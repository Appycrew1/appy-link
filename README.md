# Appy Link - UK Moving Suppliers Directory

A clean, modern directory platform connecting UK removal companies with verified suppliers. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Features

- **Modern Design**: Clean, responsive interface optimized for all devices
- **Supplier Directory**: Browse and search UK moving suppliers by category
- **Contact Forms**: Professional contact page with multiple channels
- **SEO Optimized**: Server-side rendering with proper meta tags
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first styling for rapid development

## 🛠 Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend-as-a-Service (optional)
- **Lucide React** - Beautiful icons

## 📋 Prerequisites

- Node.js 18+ and npm
- Git for version control

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/appy-link.git
cd appy-link
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup (Optional)

For Supabase integration:

```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Deploy automatically

3. **Environment Variables (if using Supabase):**
   - In Vercel dashboard: Settings → Environment Variables
   - Add your Supabase credentials
   - Redeploy

### Deploy to Other Platforms

The app works on any platform that supports Next.js:

- **Netlify**: Use the build command `npm run build`
- **Railway**: Direct GitHub integration
- **DigitalOcean App Platform**: Use Node.js buildpack

## 📁 Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── layout.tsx         # Root layout with navigation
│   ├── page.tsx           # Home page
│   ├── suppliers/         # Suppliers directory
│   │   └── page.tsx
│   └── contact/           # Contact page
│       └── page.tsx
├── lib/                   # Utilities and configurations
│   └── supabase.ts        # Supabase client (optional)
└── globals.css            # Global styles
```

## 🎨 Customization

### Branding
Update the logo and brand name in `src/app/layout.tsx`:

```tsx
<span className="text-xl font-bold text-gray-900">Your Brand</span>
```

### Colors
Modify the color scheme in `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: {
        50: '#eff6ff',
        500: '#3b82f6',  // Change this
        600: '#2563eb',  // And this
        700: '#1d4ed8',  // And this
      },
    },
  },
}
```

### Content
Update the suppliers data in `src/app/suppliers/page.tsx` and home page content in `src/app/page.tsx`.

## 🔧 Adding Features

### Database Integration
If you want to add a database:

1. Set up a Supabase project
2. Add environment variables
3. Create tables for suppliers, contacts, etc.
4. Update pages to fetch from database

### Authentication
Add user authentication:

1. Set up Supabase Auth
2. Create login/signup pages
3. Add protected routes
4. Update navigation

### Admin Panel
Add content management:

1. Create admin pages
2. Add CRUD operations
3. Implement role-based access
4. Add dashboard analytics

## 📦 Dependencies

### Core Dependencies
- `next` - React framework
- `react` & `react-dom` - React library
- `typescript` - Type safety
- `tailwindcss` - Styling
- `lucide-react` - Icons

### Optional Dependencies
- `@supabase/supabase-js` - Database (if needed)
- `@supabase/ssr` - Server-side Supabase (if needed)

## 🐛 Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check TypeScript errors: `npm run build`
- Verify environment variables are set correctly

### Deployment Issues
- Check environment variables in your deployment platform
- Ensure build command is `npm run build`
- Verify start command is `npm start`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📞 Support

- Create an issue for bugs or feature requests
- Email: hello@appylink.co.uk
- Documentation: This README

---

Built with ❤️ for the UK moving industry
