# Monaco Editor Java LSP Demo

这是一个基于 Monaco Editor 的 Java 语言服务器演示项目，展示了如何将 Eclipse JDT Language Server 与 Monaco Editor 集成。

## 项目结构

- `src/server`: 服务器端代码
  - `jdt-server.ts`: JDT Language Server 启动和管理
  - `ws-server.ts`: WebSocket 服务器实现
  - `index.ts`: 服务启动入口
- `resources`: JDT Language Server 资源文件

## 快速开始

1. 进入 `java-language-server` 目录
```bash
cd java-language-server
```

2. 安装依赖
```bash
npm install
```

3. 启动服务器
```bash
npm run dev
```
