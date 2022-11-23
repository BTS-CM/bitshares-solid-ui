import solid from "solid-start/vite";
import { defineConfig } from "vite";
import eslint from 'vite-plugin-eslint'

export default defineConfig({
  plugins: [solid(), eslint()]
});
