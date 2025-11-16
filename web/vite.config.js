import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import graphqlLoader from "vite-plugin-graphql-loader"
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), graphqlLoader(), tailwindcss()],
});
