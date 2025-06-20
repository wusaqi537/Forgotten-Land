/**
 * Playroom 基础配置 (CommonJS 版本)
 * 文档：https://github.com/seek-oss/playroom#configuration
 */
module.exports = {
  // ① 组件入口：让 Playroom 能 import 到你的 React 组件
  components: './src/index.js',

  // ② 构建产物目录（playroom build 时会生成静态站点）
  outputPath: './dist/playroom',

  // —— 以下均为可选，但常用 ——
  title: 'My R3F Game Components',   // 页面标题
  widths: [375, 768, 1024],          // 预览窗口宽度
  port: 9000,                        // dev 服务器端口
  openBrowser: true,                  // 启动后是否自动打开浏览器
  frameComponent: './playroom/FrameComponent.jsx'
}; 