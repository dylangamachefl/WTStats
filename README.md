# WTStats - Fantasy League Hub

## Purpose

WTStats is a custom-built web application designed specifically for our fantasy football league. Its primary purpose is to serve as a comprehensive, interactive archive of our league's history, statistics, and memorable moments. It allows league members to:

*   Explore detailed historical data from past seasons.
*   Compare team performances and head-to-head records between GMs.
*   Gain insights from "Deep Dive" articles that analyze various aspects of our league, such as draft trends and player value.
*   Access a centralized hub for all league-related historical information.

This application is a dedicated tool for our league members to relive past glories, settle debates with data, and enjoy the rich history we've built together.

## Key Features

*   **League History Dashboard**: View overall league standings, championship wins, and other summary statistics across all seasons.
*   **Season-Specific Views**: Drill down into individual season results, including final standings, weekly scores, and playoff brackets.
*   **GM Career Profiles**: See career statistics, win-loss records, and performance trends for each GM in the league.
*   **Head-to-Head (H2H) Analysis**: Compare the historical performance and scoring trends between any two GMs.
*   **Draft History & Analysis**: Review past draft results by season or by GM.
*   **Deep Dives**: A collection of articles (written in MDX) that explore specific topics in-depth, such as:
    *   Positional Value Evolution
    *   The Luck Factor in Fantasy Football
    *   First Round Fortunes
    *   All-Decade Team Selections
    *   Drafting by NFL Team Analysis

## Technical Architecture

WTStats is built as a modern web application with a focus on performance and ease of access for league members.

*   **Framework**: [Next.js](https://nextjs.org/) (a React framework) is used for its capabilities in static site generation (SSG), ensuring the site is fast and can be hosted efficiently.
*   **Language**: [TypeScript](https://www.typescriptlang.org/) is used for enhanced code quality and maintainability.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) provides utility classes for rapid UI development, complemented by [Shadcn/ui](https://ui.shadcn.com/) for pre-built, accessible React components.
*   **Data Visualization**: [Recharts](https://recharts.org/) is used to create interactive charts for displaying statistical data.
*   **Content Management**: "Deep Dive" articles are written in [MDX](https://mdxjs.com/), allowing for the combination of Markdown with React components for rich, dynamic content.

### Data Structure and Management

*   **Primary Data Source**: All historical league data (e.g., season results, GM stats, draft picks, H2H records) is stored in JSON files located within the `public/data/` directory. This data is manually curated and updated.
*   **MDX Content**: The narrative content for "Deep Dive" articles is located in `public/data/deep-dives/` as `.mdx` files.
*   **Static Generation**: During the build process (`npm run build`), Next.js fetches this local JSON and MDX data to pre-render all pages as static HTML, CSS, and JavaScript. This means the site doesn't require a traditional backend server or database at runtime.

## Deployment

The application is configured for static export and is deployed via [GitHub Pages](https://pages.github.com/). This makes it easily accessible to all league members through a public URL associated with the `WTStats` GitHub repository. The `next.config.js` file includes settings for `basePath` and `assetPrefix` to ensure correct routing and asset loading on GitHub Pages.

The deployment process is automated via the `npm run deploy` script in `package.json`, which builds the static site and pushes it to the `gh-pages` branch.
