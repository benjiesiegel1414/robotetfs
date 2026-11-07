# RobotETFs.com

Static site for every robotics, humanoid and automation ETF. Part of the Dividend Empire network.

- `data/funds.csv`: fund list (Ticker, ETF Name, ETF Provider, Category, AUM, Expense Ratio, Inception Date, Dividend Yield, Pays, Issuer URL). Synced daily from the Google Sheet when `SHEET` is set in `scripts/build.mjs`.
- Categories: core robotics, humanoid, physical ai, ai & robotics, autonomous & drones, leveraged.
- `content/funds.json`: plain-English profile for each fund.
- `content/articles/*.html`: guides with live-data tokens.
- `node scripts/build.mjs` builds every page into the repo root. The GitHub Action runs it daily and on every push to the source folders.
