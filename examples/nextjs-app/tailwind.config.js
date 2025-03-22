/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        green: {
          light: "#95CE96",
          medium: "#66B95F",
          dark: "#14AC2B",
          darker: "#009110",
          DEFAULT: "#14AC2B",
        },
        cream: {
          light: "#EEEDE7",
          medium: "#EBE9DF",
          dark: "#E8E5D9",
          DEFAULT: "#E8E5D9",
        },
        lavendar: "#C1B6F8",
      },
      borderRadius: {
        "4xl": "2rem",
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      keyframes: {
        fadeIn: {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
        "up-down": {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-20px)",
          },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in-out forwards",
        "up-down-slow": "up-down 8s ease-in-out infinite",
        "up-down-medium": "up-down 6s ease-in-out infinite",
      },
    },
  },
  darkMode: "false",
  plugins: [],
};
