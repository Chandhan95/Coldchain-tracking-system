# 🚀 Free Deployment Guide for Cold Chain Sync

This guide will walk you through exactly how to expose your application to the internet for free using reliable modern cloud hosts. We are using **Aiven** (for MySQL), **Render** (for Spring Boot Backend), and **Vercel** (for React/Vite Frontend).

## Step 0: Preparing your Repository
Before you do anything, ensure you push all pending changes to **GitHub**. The latest code including our `Dockerfile` and parameterized configs must be pushed.

```bash
git add .
git commit -m "Ready for production deployment"
git push
```

---

## Step 1: Set up the Database (Aiven)
We need a cloud database that's accessible worldwide so our cloud-backend can talk to it.

1. Go to [Aiven Console](https://console.aiven.io/signup) and create a free account.
2. Click **Create Service**.
3. Select **MySQL**.
4. Scroll down to *Service plans* and select the **Free Plan** (available in specific regions like DigitalOcean NYC or similar).
5. Name your service (e.g., `coldchainsync-db`) and create it.
6. Once the database finishes creating, click on it and look for the **Connection Information** tab.
7. Locate the **Service URI (JDBC)** or just note down the **host, port, user, and password**.

---

## Step 2: Deploy the Backend (Render)
Render allows us to run Java applications via Docker for free.

1. Go to [Render Dashboard](https://dashboard.render.com/register) and create an account using GitHub.
2. Click **New** -> **Web Service**.
3. Connect your GitHub account and select your `coldchainsync` repository.
4. **Important**:
   - Scroll down to *Root Directory* and type `coldchain-backend`.
   - Scroll down to *Environment* and ensure **Docker** is selected.
   - Choose the **Free** instance type.
5. Expand the **Advanced** -> **Environment Variables** section and add the following based on your Aiven database details:
   - `DB_URL`: The JDBC URL from Aiven (e.g., `jdbc:mysql://mysql-....aivencloud.com:21344/defaultdb?useSSL=true`)
   - `DB_USERNAME`: The Aiven database user (usually `avnadmin`)
   - `DB_PASSWORD`: The Aiven database password
6. Click **Create Web Service**.
7. Wait ~5-10 minutes for Render to build the Java `.jar` via the `Dockerfile` and start the server.
8. Look for the Render URL at the top left (it looks like `https://coldchain-backend.onrender.com`). **Copy this URL**.

> [!WARNING]
> Render free web services "spin down" after 15 minutes of inactivity. Don't worry if the first request takes up to a minute to respond when you haven't used it in a while. It's waking up!

---

## Step 3: Deploy the Frontend (Vercel)
Vercel is the easiest, fastest way to host React applications.

1. Go to [Vercel](https://vercel.com/signup) and create an account using GitHub.
2. Click **Add New** -> **Project**.
3. Import your `coldchainsync` GitHub repository.
4. **Important**:
   - In the **Framework Preset**, ensure it says **Vite**.
   - In the **Root Directory**, click "Edit" and select `coldchain-frontend`.
5. Open the **Environment Variables** panel and add:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: The Render URL you copied in Step 2 (e.g., `https://coldchain-backend.onrender.com`). Do *not* add a trailing slash `/`.
6. Click **Deploy**.
7. In ~1 minute, Vercel will give you a live production URL!

---

🎉 **Congratulations! Your system is now running 100% in the cloud and totally for free.** 
If you find any bugs inside the hackathon testing simply fix them locally, run `git push`, and both Render and Vercel will automatically trigger a new deployment immediately.
