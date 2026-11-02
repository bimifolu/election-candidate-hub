#!/usr/bin/env python3
"""Rebuild Senate records from the supplied PDF without OCR or inferred fields.

Requires Python 3 and PyMuPDF (fitz). The PDF's table border coordinates identify
columns; printed serial-number baselines identify rows. Font size excludes the
watermark, document headings and signature. Import fails on unassigned cells,
unknown states, missing required fields or non-contiguous state-local serials.
"""
from __future__ import annotations

import argparse
from bisect import bisect_right
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import re
import shutil
import fitz

ROOT = Path(__file__).resolve().parents[1]
STATE_NAMES = ('Abia|Adamawa|Akwa Ibom|Anambra|Bauchi|Bayelsa|Benue|Borno|Cross River|Delta|Ebonyi|Edo|Ekiti|Enugu|Federal Capital Territory|Gombe|Imo|Jigawa|Kaduna|Kano|Katsina|Kebbi|Kogi|Kwara|Lagos|Nasarawa|Niger|Ogun|Ondo|Osun|Oyo|Plateau|Rivers|Sokoto|Taraba|Yobe|Zamfara').split('|')
STATE_LOOKUP = {s.upper(): s for s in STATE_NAMES}
STATE_LOOKUP.update({'FCT': 'Federal Capital Territory', 'F.C.T': 'Federal Capital Territory', 'NASSARAWA': 'Nasarawa'})
FIELDS = ('serial', 'state', 'district', 'name', 'party', 'pwd', 'age', 'gender', 'qualifications', 'remarks')


def normalise(text):
    return ' '.join(text.split())


def extract(pdf_path):
    document = fitz.open(pdf_path)
    records = []
    page_counts = []
    raw_states = {}
    anomalies = []
    titles = []
    for page_index, page in enumerate(document):
        all_spans = [s for b in page.get_text('dict')['blocks'] if 'lines' in b
                     for line in b['lines'] for s in line['spans'] if s['text'].strip()]
        spans = [s for s in all_spans if abs(s['size'] - 10) < .01]
        if page_index == 0:
            titles = [normalise(s['text']) for s in all_spans if abs(s['size'] - 14) < .01]
        headers = [s for s in spans if s['text'] == 'SN']
        assert len(headers) == 1, f'Expected one table header on page {page_index + 1}'
        header_y = headers[0]['bbox'][1]
        header_edges = [item for drawing in page.get_drawings() for item in drawing['items']
                        if item[0] == 'l' and abs(item[1].y - item[2].y) < .01
                        and abs(item[1].y - (header_y + 1)) < .1]
        bounds = sorted({round(v, 2) for line in header_edges for v in (line[1].x, line[2].x)})
        assert len(bounds) == 11, f'Expected ten columns on page {page_index + 1}: {bounds}'
        anchors = sorted([s for s in spans if s['bbox'][0] < bounds[1] and s['text'].strip().isdigit()],
                         key=lambda s: s['bbox'][1])
        assert anchors, f'No serial rows on page {page_index + 1}'
        # Rows are never split across pages in this document: the first row must
        # immediately follow the one- or two-line repeated column header.
        assert any(abs(anchors[0]['bbox'][1] - header_y - delta) < .1 for delta in (19.8, 34.6)), f'Unexpected content above first row on page {page_index + 1}'
        page_counts.append({'page': page_index + 1, 'rows': len(anchors)})
        starts = [s['bbox'][1] - .1 for s in anchors]
        cells = [[[] for _ in FIELDS] for _ in anchors]
        for span in spans:
            x0, y0, x1, _ = span['bbox']
            if y0 < starts[0]:
                continue
            row = bisect_right(starts, y0) - 1
            col = bisect_right(bounds, (x0 + x1) / 2) - 1
            assert 0 <= col < len(FIELDS), f'Unassigned span on page {page_index + 1}: {span["text"]!r}'
            # Allow trailing whitespace to slightly overrun a printed cell border.
            assert x0 >= bounds[col] - 1 and x1 <= bounds[col + 1] + 7, f'Cross-column span on page {page_index + 1}: {span["text"]!r}'
            cells[row][col].append((y0, x0, span['text']))
        for row in cells:
            raw = {field: normalise(' '.join(s[2] for s in sorted(cell))) for field, cell in zip(FIELDS, row)}
            assert raw['serial'].isdigit(), f'Invalid serial: {raw}'
            assert raw['state'].upper() in STATE_LOOKUP, f'Unknown state: {raw}'
            state = STATE_LOOKUP[raw['state'].upper()]
            raw_states[state] = raw['state']
            serial = int(raw['serial'])
            assert all(raw[field] for field in ('district', 'name', 'party', 'gender')), f'Missing required cell: {raw}'
            assert not raw['age'] or raw['age'].isdigit(), f'Invalid age: {raw}'
            record = {
                'id': f'senate-2027-{re.sub(r"[^a-z0-9]+", "-", state.lower())}-{serial}',
                'serial': serial, 'name': raw['name'], 'state': state,
                'district': raw['district'].title(), 'office': 'Senate', 'party': raw['party'],
                'age': int(raw['age']) if raw['age'] else None, 'gender': raw['gender'],
                'pwd': raw['pwd'], 'qualifications': raw['qualifications'], 'remarks': raw['remarks'],
                'sourcePage': page_index + 1, 'sourceRow': serial, 'sourceType': 'pdf', 'sourceYear': 2027,
            }
            for field in ('age', 'pwd', 'qualifications', 'remarks'):
                if not raw[field]:
                    anomalies.append({'id': record['id'], 'page': page_index + 1, 'type': 'blank-source-field', 'field': field})
            records.append(record)
    assert len({r['id'] for r in records}) == len(records), 'Duplicate candidate IDs'
    by_state = defaultdict(list)
    for record in records:
        by_state[record['state']].append(record)
    assert set(by_state) == set(STATE_NAMES), 'Missing/extra states'
    for state, candidates in by_state.items():
        serials = [r['serial'] for r in candidates]
        assert serials == list(range(1, len(serials) + 1)), f'Non-contiguous serials for {state}: {serials}'
    metadata = {'title': ' — '.join(titles), 'filename': '2027 SENATE FINAL LIST OF CANDIDATES.pdf',
                'url': './sources/senate-2027.pdf', 'pages': len(document), 'candidateCount': len(records),
                'sha256': hashlib.sha256(pdf_path.read_bytes()).hexdigest()}
    report = {
        'source': metadata,
        'importer': {'python': '3', 'PyMuPDF': fitz.VersionBind},
        'method': 'PyMuPDF text spans; ten columns from vector table borders; rows from printed serial-number baselines; 10pt table text excludes watermark/signature; whitespace normalised only.',
        'serialNumberScope': 'Numbers restart at 1 for each state; IDs include the state slug.',
        'stateCount': len(by_state),
        'districtCount': len({(r['state'], r['district']) for r in records}),
        'stateCounts': {state: len(rows) for state, rows in sorted(by_state.items())},
        'districtCounts': {state: dict(sorted(Counter(r['district'] for r in rows).items())) for state, rows in sorted(by_state.items())},
        'partyCounts': dict(sorted(Counter(r['party'] for r in records).items())),
        'sourceStateLabels': raw_states,
        'pageCounts': page_counts,
        'checks': {'allPagesParsed': True, 'allRowsAccountedFor': sum(p['rows'] for p in page_counts) == len(records), 'all37StatesPresent': True, 'uniqueIds': True, 'stateSerialsContiguous': True},
        'blankFieldCounts': dict(Counter(a['field'] for a in anomalies)),
        'blankQualifications': [{'id': a['id'], 'page': a['page']} for a in anomalies if a['field'] == 'qualifications'],
        'notes': ['Names, party abbreviations, qualifications and remarks preserve the document spelling; whitespace only is normalised.', 'State names match map names, and district labels use title case.', 'Blank fields remain empty (age null); no qualifications, biographies or policy positions are inferred.', 'The supplied document is the source. Its authenticity, election schedule and candidate claims have not been independently verified.'],
    }
    return records, metadata, report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf', nargs='?', type=Path, default=ROOT / 'sources/senate-2027.pdf')
    parser.add_argument('--check', action='store_true', help='Verify the existing generated outputs without changing files.')
    args = parser.parse_args()
    records, metadata, report = extract(args.pdf)
    module = '// Generated by scripts/import_senate.py from the supplied PDF; do not edit records by hand.\n'
    module += 'export const senateSource = ' + json.dumps(metadata, ensure_ascii=False, indent=2) + ';\n\n'
    module += 'export const senateCandidates = ' + json.dumps(records, ensure_ascii=False, indent=2) + ';\n'
    report_text = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    if args.check:
        assert (ROOT / 'senate-data.js').read_text() == module, 'senate-data.js is out of date'
        assert (ROOT / 'sources/senate-import-report.json').read_text() == report_text, 'Import report is out of date'
    else:
        (ROOT / 'sources').mkdir(exist_ok=True)
        destination = ROOT / 'sources/senate-2027.pdf'
        if args.pdf.resolve() != destination.resolve():
            shutil.copyfile(args.pdf, destination)
        (ROOT / 'senate-data.js').write_text(module)
        (ROOT / 'sources/senate-import-report.json').write_text(report_text)
    print(json.dumps({'pages': metadata['pages'], 'candidates': len(records), 'states': report['stateCount'], 'districts': report['districtCount'], 'blankFields': report['blankFieldCounts']}, indent=2))

if __name__ == '__main__':
    main()
