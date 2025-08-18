# Florist E-Commerce Website Project

## Project Overview
A modern e-commerce platform for a florist business featuring product management, online ordering, and comprehensive admin panel for inventory control.

## Tech Stack

### Backend
- **Node.js** with Express.js (v5.1.0)
- **SQLite3** database for data persistence
- **JWT** for secure authentication
- **bcryptjs** for password hashing
- **Multer** for image uploads
- **CORS** for cross-origin requests
- **dotenv** for environment configuration

### Frontend
- **Vanilla JavaScript** (no framework dependencies)
- **HTML5/CSS3** for structure and styling
- **Responsive design** for mobile/tablet/desktop
- **API-based architecture** for dynamic content

## Database Schema

```sql
-- User authentication
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Store information
CREATE TABLE store_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_name TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    hours TEXT,
    delivery_info TEXT,
    social_media TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Plant inventory
CREATE TABLE plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    scientific_name TEXT,
    category TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    description TEXT,
    care_instructions TEXT,
    light_requirements TEXT,
    water_needs TEXT,
    pet_friendly BOOLEAN DEFAULT 0,
    size TEXT,
    growth_rate TEXT,
    image_url TEXT,
    gallery_images TEXT,
    featured BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Plant categories
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    order_index INTEGER DEFAULT 0
);

-- Customer orders
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT,
    delivery_type TEXT,
    order_items TEXT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2),
    total DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Reviews and ratings
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    approved BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plant_id) REFERENCES plants(id)
);

-- Site statistics
CREATE TABLE stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
);
```

## Features

### Customer-Facing Website
1. **Homepage**
   - Featured plants carousel
   - Category showcase
   - Special offers section
   - Store information

2. **Product Catalog**
   - Filter by category, price, care level
   - Search functionality
   - Grid/list view toggle
   - Sort by price, name, popularity

3. **Product Details**
   - High-quality images with zoom
   - Detailed care instructions
   - Stock availability
   - Customer reviews
   - Related products

4. **Shopping Cart**
   - Add/remove items
   - Quantity adjustment
   - Price calculation
   - Delivery options

5. **Checkout**
   - Guest checkout option
   - Delivery/pickup selection
   - Order summary
   - Payment integration ready

### Admin Panel
1. **Dashboard**
   - Sales overview
   - Low stock alerts
   - Recent orders
   - Quick stats

2. **Plant Management**
   - Add/edit/delete plants
   - Bulk image upload
   - Stock tracking
   - Category assignment
   - Price management

3. **Order Management**
   - View all orders
   - Update order status
   - Print order details
   - Customer information

4. **Category Management**
   - Create plant categories
   - Organize hierarchy
   - Set display order

5. **Store Settings**
   - Update store information
   - Business hours
   - Delivery zones
   - Social media links

6. **Reports**
   - Sales reports
   - Inventory reports
   - Popular products
   - Customer insights

## API Endpoints

### Authentication
- `POST /api/login` - Admin login
- `POST /api/logout` - Admin logout
- `GET /api/verify-token` - Verify JWT token

### Plants
- `GET /api/plants` - Get all plants
- `GET /api/plants/:id` - Get single plant
- `POST /api/plants` - Add new plant (admin)
- `PUT /api/plants/:id` - Update plant (admin)
- `DELETE /api/plants/:id` - Delete plant (admin)
- `GET /api/plants/featured` - Get featured plants
- `GET /api/plants/category/:category` - Get plants by category

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Add category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders (admin)
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status (admin)

### Store
- `GET /api/store` - Get store information
- `PUT /api/store` - Update store info (admin)

### Upload
- `POST /api/upload` - Upload images (admin)
- `DELETE /api/upload/:filename` - Delete image (admin)

## Project Structure

```
florist-website/
├── server.js                 # Express server setup
├── package.json             # Dependencies
├── .env                     # Environment variables
├── ecosystem.config.js      # PM2 configuration
├── database/
│   └── florist.db          # SQLite database
├── uploads/                # Image storage
│   ├── plants/
│   └── categories/
├── admin/                  # Admin panel
│   ├── index.html
│   ├── dashboard.html
│   ├── plants.html
│   ├── orders.html
│   ├── css/
│   │   └── admin.css
│   └── js/
│       ├── admin.js
│       ├── plants.js
│       └── orders.js
├── public/                 # Customer website
│   ├── index.html
│   ├── shop.html
│   ├── product.html
│   ├── cart.html
│   ├── checkout.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── main.js
│   │   ├── shop.js
│   │   ├── cart.js
│   │   └── api.js
│   └── images/
│       └── logo.png
└── middleware/
    └── auth.js            # JWT authentication

```

## Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DB_PATH=./database/florist.db

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Upload Settings
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Admin Credentials (initial setup)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password
```

## Installation & Setup

1. **Clone repository**
```bash
git clone <repository-url>
cd florist-website
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize database**
```bash
node scripts/init-db.js
```

5. **Start development server**
```bash
npm run dev
```

6. **Access website**
- Customer site: http://localhost:3000
- Admin panel: http://localhost:3000/admin

## Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

### Environment Setup
- Set `NODE_ENV=production`
- Use strong JWT secret
- Configure proper upload directory
- Set up SSL certificate
- Configure backup strategy

## Security Considerations

1. **Authentication**
   - JWT tokens with expiration
   - Secure password hashing
   - Session management

2. **Data Protection**
   - Input validation
   - SQL injection prevention
   - XSS protection
   - CSRF tokens

3. **File Upload**
   - File type validation
   - Size limits
   - Virus scanning (recommended)

4. **API Security**
   - Rate limiting
   - CORS configuration
   - HTTPS enforcement

## Maintenance

### Daily Tasks
- Check order queue
- Update inventory
- Respond to reviews

### Weekly Tasks
- Update featured plants
- Check low stock items
- Review sales reports

### Monthly Tasks
- Database backup
- Update plant descriptions
- Analyze customer data
- Security updates

## Future Enhancements

1. **Payment Integration**
   - Stripe/PayPal integration
   - Multiple payment methods
   - Invoice generation

2. **Customer Features**
   - User accounts
   - Wishlist functionality
   - Order history
   - Email notifications

3. **Advanced Features**
   - Plant care reminders
   - Loyalty program
   - Gift cards
   - Subscription boxes

4. **Marketing Tools**
   - Email newsletter
   - Discount codes
   - SEO optimization
   - Social media integration

## Support & Documentation

- Admin guide: `/docs/admin-guide.md`
- API documentation: `/docs/api.md`
- Troubleshooting: `/docs/troubleshooting.md`

## License

MIT License - Customize as needed for commercial use.