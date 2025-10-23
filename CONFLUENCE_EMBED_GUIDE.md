# Good Vibes Carousel - Confluence Embedding Guide

## ✅ Your app is now built and ready for deployment!

The production build is in the `build/` folder (79.19 kB main.js + 8.86 kB CSS).

---

## Option A: Quick Testing with Local Server

### 1. Serve the build locally:
```bash
npx serve -s build -p 3000
```

### 2. Use ngrok to expose it publicly (for testing):
```bash
# Install ngrok if you don't have it
brew install ngrok

# Expose your local server
ngrok http 3000
```

You'll get a public URL like: `https://abc123.ngrok.io`

---

## Option B: Deploy to a Hosting Service

### Recommended hosting options:

#### **Netlify** (Easiest - Free tier available)
1. Push your code to GitHub
2. Go to https://app.netlify.com
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repo
5. Build command: `npm run build`
6. Publish directory: `build`
7. Deploy!

You'll get a URL like: `https://your-app.netlify.app`

#### **Vercel** (Great for React apps)
```bash
npm install -g vercel
cd /Users/minh.dam/Desktop/good-vibes-frontend
vercel --prod
```

#### **AWS S3 + CloudFront** (Enterprise option)
Best for internal company hosting with proper security.

---

## Step 3: Embed in Confluence

Once your app is hosted, you can embed it in Confluence:

### Method 1: HTML Macro (Confluence Cloud)
1. Edit your Confluence page
2. Type `/html` and select "HTML macro"
3. Add this code:

```html
<iframe 
  src="YOUR_HOSTED_URL_HERE" 
  width="100%" 
  height="600px" 
  frameborder="0"
  style="border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
></iframe>
```

### Method 2: Iframe Macro (Confluence Server/Data Center)
1. Edit your Confluence page
2. Type `/iframe` and select "Iframe macro"
3. Enter your hosted URL
4. Set width to `100%` and height to `600px`

### Method 3: Custom HTML (if HTML macro is enabled)
```html
<div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
  <iframe 
    src="YOUR_HOSTED_URL_HERE" 
    width="100%" 
    height="700px" 
    frameborder="0"
    allow="fullscreen"
    style="border: none; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);"
  ></iframe>
</div>
```

---

## Important Notes

### CORS Configuration
Your backend needs to allow requests from your Confluence domain. Update `Program.cs`:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowConfluence",
        policy =>
        {
            policy.WithOrigins(
                "http://localhost:3000",
                "https://your-app.netlify.app",  // Your hosted frontend
                "https://your-company.atlassian.net"  // Your Confluence URL
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
        });
});
```

### Backend Hosting
Your .NET backend also needs to be publicly accessible. Options:
- **Azure App Service** (Microsoft)
- **AWS Elastic Beanstalk**
- **Heroku** (easy for .NET)
- **Railway** (modern, easy)

---

## Testing Checklist

- [ ] Frontend builds successfully
- [ ] Frontend is hosted and accessible via HTTPS
- [ ] Backend is hosted and accessible
- [ ] CORS is configured to allow Confluence domain
- [ ] Test the hosted URL in a browser
- [ ] Embed iframe in Confluence test page
- [ ] Verify carousel works in Confluence
- [ ] Check mobile responsiveness in Confluence

---

## Responsive Design for Confluence

Your carousel should adapt well, but you can add a media query for small Confluence spaces:

```css
@media (max-width: 768px) {
  iframe {
    height: 500px !important;
  }
}
```

---

## Security Considerations

For production:
1. Use HTTPS for both frontend and backend
2. Set up proper authentication if needed
3. Configure CSP (Content Security Policy) headers
4. Add rate limiting to your backend
5. Use environment variables for API keys

---

## Next Steps

1. **Choose a hosting provider** (I recommend Netlify for frontend)
2. **Deploy your frontend**
3. **Deploy your backend** (with updated CORS)
4. **Get the hosted URLs**
5. **Embed in Confluence** using the iframe method above

Need help with any of these steps? Let me know!
