/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scan our actual Expo Router + component folders
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Keep Tailwind tokens aligned with our Theme constants
      colors: {
        textPrimary: "#101417",
        textSecondary: "#5A6472",
        background: "#FFFFFF",
        inputBg: "#FFFFFF",
        inputBorder: "#E4E7EB",
        inputBorderFocused: "#0B74E5",
        inputBorderHover: "#D1D5DB",
        inputPlaceholder: "#9AA4B2",
        inputPlaceholderFocused: "#6B7280",
        primary: "#0B74E5",
        primaryPressed: "#095EC0",
        link: "#0B74E5",
        muted: "#C8CCD2",
        switchTrack: "#D3D6DC",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "20px",
        xl: "28px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        xxl: "32px",
      },
      fontSize: {
        title: "24px",
        heading: "20px",
        body: "16px",
        small: "14px",
      },
    },
  },
  plugins: [],
};
