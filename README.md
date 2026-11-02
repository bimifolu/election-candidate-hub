# Candidate Hub

An interactive Nigerian candidate directory. Select a state on the map, choose **Senate**, then filter by **senatorial district / constituency** to see the candidates and their details.

## Run locally

Requires Node.js 20 or newer. No dependency installation is needed to run the site.

```sh
npm run dev
npm test
```

The development server listens on port 3000; set `PORT` to override it.

## Senate data and provenance

The site contains **1,303 records across 109 senatorial districts, all 36 states and FCT**, transcribed from the user-supplied **2027 SENATE FINAL LIST OF CANDIDATES.pdf** (127 pages). The supplied document's authenticity and current candidate status have not been independently verified.

Profiles display the printed name, party, age, gender, PWD entry, qualifications and remarks. Every profile links to its source PDF page and printed serial number. Serial numbers restart in each state, so IDs include both state and serial number. Ages are shown as listed, not recalculated.

Names, party abbreviations and qualifications preserve the source spelling; whitespace is normalized. State labels match the map and district labels use title case. For example, the source's “NASSARAWA” district spelling remains intact under the map state Nasarawa. The PDF has 72 blank qualification cells; these and blank remarks display as **Not stated in PDF**. No biographies or policy positions are inferred. Former fictional profiles have been removed. House of Representatives data has not been supplied and is shown as unavailable.

- `senate-data.js`: generated records and source metadata.
- `sources/senate-2027.pdf`: original source document.
- `sources/senate-import-report.json`: state/district/page counts, validation results and blank-field summary.
- `scripts/import_senate.py`: reproducible extraction from table coordinates, excluding watermark/signature text.

To reproduce or verify the import, install the extraction dependency in a Python virtual environment:

```sh
python3 -m venv /tmp/candidate-import-venv
/tmp/candidate-import-venv/bin/pip install -r scripts/requirements-import.txt
/tmp/candidate-import-venv/bin/python scripts/import_senate.py --check
```

Omit `--check` to regenerate the committed dataset and report from the source PDF. A future document with a different table layout requires reviewing the importer rather than assuming the same extraction rules work.

## Features

- Interactive map with keyboard controls and a state dropdown.
- Dependent Senate district filters in the map dialog and directory.
- Search by name, party, constituency or qualification; filter by state, office, district and party.
- Paginated results (24 per page), with sorting and saved candidates in browser local storage.
- Candidate detail views and side-by-side comparison of up to three records.
- Responsive layouts and PDF source links for each record.

The frontend uses native JavaScript and CSS; `server.js` is a small local development server. `map-data.js` contains local state geometry with attribution in `MAP-LICENSE.txt`. There are no external APIs, fonts, image services, required credentials or application runtime dependencies.

## GitHub Pages

All frontend URLs are relative and work at `https://bimifolu.github.io/election-candidate-hub/`. In **Settings → Pages**, select **Deploy from a branch**, **main**, and **/ (root)**. GitHub Pages serves the frontend and source PDF directly; it does not run `server.js`.
