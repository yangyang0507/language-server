/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { defineConfig } from "vite";

export default defineConfig({
  preview: {
    port: 8082,
  },
  worker: {
    format: "es",
  },
  assetsInclude: ['**/*.java'], // 允许导入 Java 文件
});
