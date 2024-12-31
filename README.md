# 🎨 Isometric Grid Portfolio

Welcome to the **Isometric Grid Portfolio**, an interactive and visually appealing web application designed to showcase projects in a unique grid format. The interface leverages modern web technologies to create a dynamic, animated isometric grid experience. 🌟

This project is meant to serve as a portfolio for my personal and school projects. I wanted it to be visually appealing and interactive, so I decided to create an isometric grid layout. The projects are loaded dynamically using JavaScript, and the project texts themselves are written in Markdown for easy editing.

---

## 🚀 Features

- **Interactive Isometric Grid**: Explore projects presented in a beautifully designed grid layout.
- **Responsive Design**: Automatically adjusts to diffrent screen sizes for a seamless experience. (although it's designed for phone screens)
- **Dynamic Animations**: Smooth transitions and hover effects enhance the user experience.
- **Mostly CSS**: I used mostly CSS to create the isometric grid, which is a fun challenge. The JavaScript is used to load the projects dynamically and create html for it, but all the position calculations are done in CSS.

---

## 🛠️ Technologies Used

- **HTML5**: Semantic and structured document layout.
- **CSS3**: Advanced styling with animations, transitions, and responsive design. And the isometric grid/cooridnate system.
- **JavaScript**: Interactive elements and dynamic content rendering.
- **Google Fonts**: Beautiful typography with Pixelify Sans.
- **Showdown.js**: Markdown parsing for project descriptions.

---

## 🎬 Getting Started

### Prerequisites

Ensure you have the following installed:

- A modern web browser (e.g., Chrome, Firefox, Edge).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/isometric-grid-project.git
   ```
2. Navigate to the project directory:
   ```bash
   cd isometric-grid-project
   ```
3. Open `s_grid.html` in your preferred browser to view the project.

---

## 🖼️ Project showcase

Each project is represented by a clickable cube in the grid. Current projects include:

- **Domino Day** 🀄
- **Eenzaamheidsvirus** 🦠
- **Daktuinen** 🌱

---

## 🌟 Customization

### Modify Projects

Add or update projects in the `projects` array within `s_grid.html`:
```javascript
const projects = [
    { title: "New Project", pos: {x: 1, y: 1}, image: "images/ProjectCubes/newProject.png" },
];
```

### Style Changes

Edit `style.css` to tweak colors, animations, or layout properties.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

## 🎉 Acknowledgments

- [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) for the retro font.
- [Showdown.js](https://github.com/showdownjs/showdown) for Markdown support.

---

Feel free to explore and customize this project. Your feedback and suggestions are highly appreciated! 🌟
```

### Steps You Can Take:
1. Replace `https://github.com/your-username/isometric-grid-project.git` with the actual URL of your repository.
2. Add more details if required, such as instructions for deployment or additional acknowledgments.