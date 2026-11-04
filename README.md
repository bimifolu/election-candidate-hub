# Candidate Hub

An interactive Nigerian candidate directory. Select a state, choose **Senate** or **House of Representatives**, then filter by the relevant constituency.

## Run locally

Requires Node.js 20 or newer. No dependency installation is needed to run the site.

```sh
npm run dev
npm test
```

The development server listens on port 3000; set `PORT` to override it.

## Candidate data and provenance

The site contains:

- **1,303 Senate records** across 109 senatorial districts from the supplied 127-page Senate PDF.
- **3,560 House records** across 364 federal constituencies from the supplied 300-page House PDF.

Both datasets cover all 36 states and the FCT. The supplied documents' authenticity and current candidate status have not been independently verified.

Profiles display the printed name, party, age, gender, PWD entry, qualifications and remarks. Every profile links to its source PDF page and printed serial number. Serial numbers restart in each state, so IDs include both state and serial number. Ages are shown as listed, not recalculated.

Names, party abbreviations and qualifications preserve the source spelling; whitespace is normalized. State labels match the map and constituency labels use title case. The Senate PDF has 72 blank qualification cells and the House PDF has 194; blank fields display as **Not stated in PDF**. No biographies or policy positions are inferred.

- `senate-data.js` and `reps-data.js`: generated records and source metadata.
- `sources/senate-2027.pdf` and `sources/reps-2027.pdf`: original supplied documents.
- `sources/*-import-report.json`: state/constituency/page counts and validation summaries.
- `scripts/import_senate.py` and `scripts/import_reps.py`: reproducible table-coordinate extraction.

To reproduce or verify the import, install the extraction dependency in a Python virtual environment:

```sh
python3 -m venv /tmp/candidate-import-venv
/tmp/candidate-import-venv/bin/pip install -r scripts/requirements-import.txt
/tmp/candidate-import-venv/bin/python scripts/import_senate.py --check
/tmp/candidate-import-venv/bin/python scripts/import_reps.py --check
```

Omit `--check` to regenerate the committed dataset and report from the source PDF. A future document with a different table layout requires reviewing the importer rather than assuming the same extraction rules work.

## Features

- Interactive map with keyboard controls and a state dropdown.
- Dependent senatorial district and federal constituency filters.
- Search by name, party, constituency or qualification; filter by state, office, district and party.
- Paginated results (24 per page), with sorting and saved candidates in browser local storage.
- Candidate detail views and side-by-side comparison of up to three records.
- Responsive layouts and PDF source links for each record.

The frontend uses native JavaScript and CSS; `server.js` is a small local development server. `map-data.js` contains local state geometry with attribution in `MAP-LICENSE.txt`. There are no external APIs, fonts, image services, required credentials or application runtime dependencies.

## GitHub Pages

All frontend URLs are relative and work at `https://bimifolu.github.io/election-candidate-hub/`. In **Settings → Pages**, select **Deploy from a branch**, **main**, and **/ (root)**. GitHub Pages serves the frontend and source PDF directly; it does not run `server.js`.
