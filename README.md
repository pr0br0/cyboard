# Cyprus Classified

A modern classifieds platform for buying and selling in Cyprus.

## Overview

Cyprus Classified is a full-featured classified ads platform where users can browse, post, and manage listings across various categories. The platform provides an intuitive and responsive interface for users to find what they're looking for or list items they want to sell.

## Features

- **User Authentication**: Secure login and registration system
- **Browse Listings**: View all listings with filtering and sorting options
- **Detailed Listing Views**: Comprehensive view of individual listings with images, descriptions, and seller information
- **Post New Ads**: Intuitive form for creating new classified ads
- **Categories & Locations**: Browse by category or location
- **Responsive Design**: Optimized for all devices (desktop, tablet, mobile)

## Pages

1. **Homepage**: Landing page with featured listings and categories
2. **Listings Page**: Grid view of all listings with filter sidebar
3. **Listing Detail**: Detailed view of a single listing
4. **Post Ad**: Form to create a new listing
5. **Login/Register**: Modal forms for user authentication

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Image Storage**: Cloudinary (configured for production)
- **Deployment**: Ready for deployment on any Node.js hosting platform

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MongoDB

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/cyprus-classified.git
   cd cyprus-classified
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/cyprus-classified
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=90d
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

The backend provides a RESTful API with the following endpoints:

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/listings` - Get all listings with filtering options
- `GET /api/listings/:id` - Get details for a specific listing
- `POST /api/listings` - Create a new listing (requires authentication)
- `PUT /api/listings/:id` - Update a listing (requires authentication)
- `DELETE /api/listings/:id` - Delete a listing (requires authentication)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Bootstrap for the responsive design framework
- Bootstrap Icons for the icon set
- Placeholder.com for placeholder images during development 