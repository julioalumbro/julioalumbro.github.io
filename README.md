# CS471 Assignment 1 — Weather Visualization

This project is an interactive D3 line chart using the course-provided 2017 weather dataset.

## Project structure

```text
CS471-a1/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── script.js
└── data/
    └── weather_state_daily.csv
```

The structure is based on the CMSC471 lab projects.

## Run the project

From the repository folder, run:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Interactions

- Use the state and measurement dropdowns to filter the data.
- Use the month dropdown to focus on part of the year.
- Hover over a point to see the date and exact value.
- View the highlighted highest and lowest observations.

These cover dynamic filtering and details-on-demand from the assignment requirements.

The original CSV is large, so the webpage uses a smaller file containing state-level daily averages.

## Before submitting

- Add all team member names.
- Complete the development process section.
- Add an accurate AI-use statement.
- Enable GitHub Pages.
- Record the demo video.
