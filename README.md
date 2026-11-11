# After Hours — NMC5344 Group 5

A static website for the supplied simulated sleep dataset and project report. Open `index.html` in a browser to explore it locally. All data and chart code are bundled. Optional Google Fonts have system font fallbacks.

## Publish on GitHub Pages

1. Sign in to GitHub in your browser and create a repository for this project.
2. Upload the **contents** of this folder, including `assets`, `index.html`, `app.js`, `style.css` and `.nojekyll`, to the repository root. Keep the folder structure.
3. In the repository, open Settings → Pages.
4. Under Build and deployment, choose Deploy from a branch, select `main` and `/ (root)`, then Save.
5. Wait for GitHub Pages to finish deploying and open the URL shown on that page.

The ChatGPT GitHub connector is separate from signing in to GitHub in a browser. If your account is restricted by your organisation, follow its access requirements. Uploading through the website requires your own repository permissions.

## Data and calculations

The dataset has 8,500 rows and 18 columns. `assets/data.js` contains the variables used by the explorer and model coefficients calculated in R from the supplied CSV. The two models use Intermediate as the chronotype reference and Corporate 9-to-5 as the occupation reference.

Model 1: `total_sleep_hours ~ bedtime_phone_minutes * chronotype`

Model 2: `total_sleep_hours ~ bedtime_phone_minutes * chronotype + occupation_type`

Filters update descriptive summaries and boxplots. They do not refit the models. Model 2's occupation selector and phone-time slider update fitted predictions from the full sample. Adjusted R² and RMSE are in-sample metrics.

Boxplots use linearly interpolated quartiles and the 1.5 IQR rule. The boxes and whiskers are displayed; individual outlier dots are omitted to reduce visual clutter. Full observed minima and maxima appear in the sleep statistics table. Fatigue intervals include their lower bound and exclude their upper bound, with the final interval including 10 hours.

The website uses measured statistics from the supplied CSV and restrained interpretations. Some statements in the original report are broader than the data support, so the website text describes associations and observed distributions. The source report is included as supplied.
