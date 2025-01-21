# **All Blue (Dev)**

### **Project Overview**
All Blue (Dev) is a demonstration app that utilizes OIDC to authenticate users via Clever and access user details through Clever's API v3.0. The app showcases how to implement authentication flows and retrieve user information from the identity token.

---

### **Prerequisites**
Before running the app, ensure the following are set up:

1. **Node.js Installation**:
   - Install the latest version of Node.js for your operating system: [Node.js Installation Guide](https://nodejs.org/en/download/package-manager#macos).

2. **Clever Developer App**:
   - Create a Clever Developer App: [Clever Developer Portal](https://apps.clever.com/signup).
   - Contact Clever at `integrations@clever.com` to request OIDC scopes for your developer account.

3. **Environment Variables**:
   - Create a `.env` file in the project directory with the following variables:
     ```
     CLEVER_CLIENT_ID=<your_client_id>
     CLEVER_CLIENT_SECRET=<your_client_secret>
     REDIRECT_URI=<your_redirect_uri>
     SESSION_SECRET=<your_session_secret>
     ```

---

### **How to Use**
1. **Clone the Repository**:
```bash
git clone https://github.com/blkwhte/all-blue-dev.git
```
   
2. **Install Dependencies (if applicable): If your project has dependencies (e.g., express, axios), install them:**
```bash
npm install
```
3. **Start the Application: Run the app using Node.js:**

```bash
node index.js
```
4. **Access the App:**

   - Open your browser and navigate to https://localhost:3000.
   - Click the "Log in with Clever" button to start the authentication flow.
   - Testing the App
   - When prompted with the School Picker, enter the #DEMO All Blue (dev) district's Clever ID, 63e42be9ea7d85c10c19ebe5
   - Log in with Clever Passwords:
      - Example student:
         - Username + Password: 243615677
      - Example teacher:
         - Username + Password: 341754

5. **After successful authentication:**

You should be redirected back to the app's home page (https://localhost:3000/home) with a confirmation message and user details displayed.

### **Additional Notes**

Ensure the .env variables are correctly configured before running the app.
The app is designed for local development and testing purposes. Use self-signed SSL certificates for HTTPS.
