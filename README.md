You will need to have the latest version of Node.js installed on your machine to run the app. Please refer to this guide on installing Node.js if you need a reference: https://nodejs.org/en/download/package-manager#macos

All Blue (dev) utilizes OIDC and the identity token provided to access user information on API v3.0. Should you need to access the Hall Monitor app, here are the details:
- Name: All Blue (dev)
- ID: 63e3ff6fbe04240001a20b01
- Link: https://hall-monitor.int.clever.com/applications/63e3ff6fbe04240001a20b01

How to run the app:

  Step 1: Clone the Github Repo
  Step 2: Run the command "node index.js" in your terminal while in the file location of the repo
  Step 3: Navigate to "localhost:3000" in your web browser of choice
  Step 4: Select the "Log in with Clever" button and enter the following details when prompted:
    - When prompted with the School Picker, enter the district ID 63e42be9ea7d85c10c19ebe5 (#DEMO All Blue (dev))
    - When prompted to log in, select the Clever Passwords login and enter 243615677 for the username and password
  Step 5: You should be redirected back to the All Blue (localhost) site with a message confirming the authentication was successful.

If you have any questions, reach out to @swalsh on Slack!
