# Unified Schedule Dashboard

A Next.js 14 application that aggregates schedules from 8 Zeroboard websites into a unified FullCalendar dashboard.

## Prerequisites

- **Node.js 18+** is required.
    - Check with: `node --version`
    - Install from [nodejs.org](https://nodejs.org/) if missing.

## Setup & Run

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Open Browser**:
    Visit [http://localhost:3000](http://localhost:3000).

## Features

- **Multi-Site Scraping**: Aggregates data from 8 distinct Zeroboard URLs.
- **Server-Side Scraping**: Uses Next.js API Routes (`/api/schedule`) to parse HTML on the server, avoiding CORS issues.
- **Session Management**: Automatically logs in to Zeroboard to access hidden schedules.
- **FullCalendar Integration**: Interactive month view with color-coded events by branch.
- **Pastel Color Scheme**: Distinct colors for each of the 8 branches.

## Deployment (Vercel)

1.  Push this code to a GitHub repository.
2.  Import the repository in Vercel.
3.  Vercel will automatically detect Next.js.
4.  Click **Deploy**.

## Troubleshooting

-   **Encoding Issues**: The scraper uses `iconv-lite` to handle EUC-KR encoding common in Zeroboard.
-   **Login Failures**: If the scraper returns no events, check the `lib/scraper.ts` credentials or logic.
