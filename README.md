# 📊 WTStats - Fantasy League Hub

> A comprehensive, interactive archive of fantasy football league history, statistics, and memorable moments built exclusively for league members.

## 📋 Table of Contents
- [🎯 Purpose](#-purpose)
- [✨ Key Features](#-key-features)
- [🏗️ Technical Architecture](#️-technical-architecture)
- [📁 Data Structure and Management](#-data-structure-and-management)
- [🚀 Deployment](#-deployment)

## 🎯 Purpose

WTStats is a custom-built web application designed specifically for our fantasy football league. It serves as the ultimate digital home for everything related to our league's rich history and competitive legacy.

### 🏆 What WTStats Enables

**📈 Historical Deep Dives**
- Explore detailed data from every season in our league's history
- Track performance trends and evolution over time
- Access comprehensive statistical breakdowns

**⚔️ Competitive Analysis**
- Compare team performances across multiple seasons
- Analyze head-to-head records between GMs
- Settle debates with hard data and facts

**🔍 Advanced Insights**
- Read "Deep Dive" articles analyzing draft trends, player value, and league dynamics
- Discover hidden patterns in our league's competitive landscape
- Gain strategic insights from historical data

**🏠 Centralized Hub**
- One-stop destination for all league-related historical information
- Easily accessible archive of memorable moments and achievements
- Platform for league members to relive past glories

> **For League Members:** This application is your dedicated tool to explore our shared fantasy football journey, settle friendly disputes with data, and celebrate the rich competitive history we've built together.

## ✨ Key Features

### 🏅 League History Dashboard
- **Overall Standings**: View comprehensive league standings across all seasons
- **Championship Tracker**: Track championship wins and runner-up finishes
- **Summary Statistics**: Access key metrics and league-wide performance indicators
- **Timeline View**: Navigate through our league's evolution year by year

### 📅 Season-Specific Views
- **Final Standings**: Complete season rankings with detailed performance metrics
- **Weekly Scores**: Track scoring trends and highlight performances throughout each season
- **Playoff Brackets**: Visualize playoff matchups and championship paths
- **Season Highlights**: Key moments and standout performances from each year

### 👤 GM Career Profiles
- **Career Statistics**: Comprehensive stats for each league member
- **Win-Loss Records**: Historical performance tracking with trend analysis
- **Performance Metrics**: Advanced analytics including scoring averages and consistency ratings
- **Achievement Tracking**: Championships, playoff appearances, and notable accomplishments

### ⚔️ Head-to-Head (H2H) Analysis
- **Historical Matchups**: Complete record between any two GMs
- **Scoring Trends**: Comparative analysis of performance in direct matchups
- **Rivalry Statistics**: Deep dive into competitive dynamics between league members
- **Win Probability Models**: Statistical analysis of matchup advantages

### 🎯 Draft History & Analysis
- **Season-by-Season Drafts**: Review complete draft results for every season
- **GM Draft Patterns**: Analyze individual drafting strategies and tendencies
- **Pick Value Analysis**: Evaluate draft performance and player development
- **Position Trends**: Track how drafting strategies have evolved over time

### 📚 Deep Dive Articles
Comprehensive MDX-powered articles exploring specific topics:

| Article Topic | Focus Area |
|---------------|------------|
| **Positional Value Evolution** | How player values have shifted across positions over time |
| **The Luck Factor in Fantasy Football** | Statistical analysis of variance and consistency in our league |
| **First Round Fortunes** | Success rates and impact of first-round draft picks |
| **All-Decade Team Selections** | Identifying the most dominant players and performances |
| **Drafting by NFL Team Analysis** | Team-based drafting patterns and their effectiveness |

## 🏗️ Technical Architecture

WTStats is built as a modern, high-performance web application optimized for league member accessibility and engagement.

### 🛠️ Core Technologies

| Technology | Purpose | Benefits |
|------------|---------|----------|
| **[Next.js](https://nextjs.org/)** | React Framework | Static site generation (SSG) for optimal performance |
| **[TypeScript](https://www.typescriptlang.org/)** | Programming Language | Enhanced code quality and maintainability |
| **[Tailwind CSS](https://tailwindcss.com/)** | Styling Framework | Rapid UI development with utility classes |
| **[Shadcn/ui](https://ui.shadcn.com/)** | Component Library | Pre-built, accessible React components |
| **[Recharts](https://recharts.org/)** | Data Visualization | Interactive charts for statistical data |
| **[MDX](https://mdxjs.com/)** | Content Management | Markdown + React components for rich articles |

### 🎨 Design Philosophy

**⚡ Performance First**
- Static site generation ensures lightning-fast load times
- Optimized for efficient hosting and bandwidth usage
- Pre-rendered content for instant page navigation

**📱 User-Centric Design**
- Responsive design works seamlessly across all devices
- Intuitive navigation tailored for league members
- Accessible components ensuring usability for everyone

**🔧 Maintainability**
- TypeScript provides type safety and reduces bugs
- Modular architecture allows for easy updates and feature additions
- Clear separation of data, logic, and presentation

## 📁 Data Structure and Management

### 🗄️ Primary Data Architecture

```
public/data/
├── 📊 league-history.json       # Overall league statistics and records
├── 📅 seasons/                  # Season-specific data
│   ├── 2023-season.json
│   ├── 2022-season.json
│   └── ...
├── 👥 gm-profiles/              # Individual GM career data
│   ├── gm-john.json
│   ├── gm-mike.json
│   └── ...
├── ⚔️ head-to-head/             # H2H matchup records
│   └── h2h-matrix.json
├── 🎯 draft-history/            # Draft results by season
│   ├── 2023-draft.json
│   └── ...
└── 📚 deep-dives/               # MDX article content
    ├── positional-value.mdx
    ├── luck-factor.mdx
    └── ...
```

### 📝 Data Management Process

**🔄 Data Curation**
- All historical data is manually curated and validated
- JSON files are updated with new season data as it becomes available
- Structured format ensures consistency across all data sources

**📚 Content Creation**
- "Deep Dive" articles are written in MDX format
- Combines Markdown simplicity with React component power
- Allows for interactive elements within analytical content

**🏗️ Build Process**
```bash
# During build (npm run build):
1. Next.js fetches local JSON and MDX data
2. Static HTML, CSS, and JavaScript are generated
3. All pages are pre-rendered for optimal performance
4. No runtime backend or database required
```

### 🎯 Data Benefits

- **🚀 Fast Access**: Pre-rendered static content loads instantly
- **🔒 Reliability**: No database dependencies or server requirements
- **📈 Scalability**: Easy to add new seasons and features
- **🛠️ Maintainability**: Simple file-based system for updates

## 🚀 Deployment

### 🌐 Hosting Platform

WTStats is deployed via **[GitHub Pages](https://pages.github.com/)**, providing:
- **Free hosting** for our league's exclusive use
- **Automatic updates** when new content is pushed
- **Reliable uptime** with GitHub's infrastructure
- **Easy access** through a public URL linked to the WTStats repository

### ⚙️ Configuration

**`next.config.js` Settings:**
```javascript
module.exports = {
  basePath: '/WTStats',           // GitHub Pages subdirectory
  assetPrefix: '/WTStats/',       // Correct asset loading
  output: 'export',               // Static export configuration
  trailingSlash: true,            // GitHub Pages compatibility
  images: {
    unoptimized: true             // Static hosting optimization
  }
}
```

### 🔄 Deployment Workflow

```bash
# Automated deployment process:
npm run deploy
```

**What happens during deployment:**
1. **Build Generation**: `npm run build` creates optimized static files
2. **Export Process**: Static site is exported to `out/` directory
3. **GitHub Pages Push**: Files are automatically pushed to `gh-pages` branch
4. **Live Update**: Site is immediately available at the GitHub Pages URL

### 🎯 Deployment Benefits

- **🚀 Zero-Downtime**: Updates are seamless and instant
- **💰 Cost-Effective**: Free hosting solution
- **🔧 Low Maintenance**: No server management required
- **🌍 Global Access**: Available to league members worldwide

---

<div align="center">

**🏆 Ready to explore your league's legendary history?**

*Visit WTStats and dive into decades of fantasy football excellence!*

</div>
