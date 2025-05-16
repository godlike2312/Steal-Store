# Steal Store E-commerce Platform

A visually striking e-commerce platform with an emphasis on modern design, engaging animations, and user experience.

## Project Overview

Steal Store is a minimalist e-commerce platform built with Flask as the backend and modern front-end technologies. The design focuses on a black and white aesthetic with smooth GSAP animations throughout the user experience.

## Features

- Full-screen hero section with animated text reveal
- Smooth product card reveal animations on scroll
- Animated navigation with scroll-triggered changes
- Interactive cart drawer with smooth animations
- Product filtering system with animated transitions
- Responsive design for all device sizes
- Minimalist black and white design language

## Technical Stack

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript
- **Animation Library**: GSAP (GreenSock Animation Platform)
- **Authentication**: Firebase Auth (to be implemented in future phases)

## Setup Instructions

### Prerequisites

- Python 3.6 or higher
- pip (Python package installer)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/steal-store.git
   cd steal-store
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```
     source venv/bin/activate
     ```

4. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

5. Run the application:
   ```
   python app.py
   ```

6. Open your browser and navigate to:
   ```
   http://127.0.0.1:5000/
   ```

## Project Structure

```
steal-store/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── static/                 # Static files
│   ├── css/                # CSS stylesheets
│   │   └── main.css        # Main stylesheet
│   ├── js/                 # JavaScript files
│   │   ├── main.js         # Main JavaScript file
│   │   ├── home.js         # Homepage animations
│   │   ├── products.js     # Products page functionality
│   │   └── cart.js         # Cart functionality
│   └── images/             # Image assets
└── templates/              # HTML templates
    ├── base.html           # Base template
    ├── index.html          # Homepage
    ├── products.html       # Products listing
    └── cart.html           # Shopping cart
```

## Development Phases

### Phase 1 (Current)
- Core structure and layout
- Homepage design with animations
- Basic product listing
- Shopping cart functionality

### Phase 2 (Upcoming)
- User authentication with Firebase
- Product details page
- Advanced filtering and search
- Checkout process

### Phase 3 (Future)
- Custom themes
- User accounts and order history
- Product reviews and ratings
- Admin dashboard

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 