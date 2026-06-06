# Markdown 笔记

一个简洁、**本地优先**的 Markdown 笔记应用 —— 在浏览器里写作、实时预览,所有数据都保存在本地,不上传任何服务器。

🔗 **在线体验**:<https://peterl427.github.io/little-markdown/>

---

## ✨ 功能特性

### 写作与预览
- 左侧编辑、右侧实时预览的双栏布局
- 完整支持 GitHub Flavored Markdown(表格、任务列表、删除线等)
- 代码块语法高亮,配色随明暗主题自动切换
- 实时字符统计与最后编辑时间

### ⚡ 斜杠命令
- 在行首或空白处输入 `/` 唤起片段菜单,快速插入图片、链接、代码块、标题、列表、表格、引用、分割线等
- 关键词过滤支持 **中文 / 英文 / 拼音**(如输入 `/bg`、`/表格`、`/table` 都能定位到「表格」)
- 全键盘操作:`↑` `↓` 选择,`Enter` / `Tab` 插入,`Esc` 关闭

### 🖼️ 图片
- 三种插入方式:工具栏按钮、粘贴(`Ctrl/Cmd + V`)、拖拽文件到窗口
- 大图自动压缩(最长边缩放到 1600px 并重新编码),GIF / SVG 原样保留,尽量节省本地存储
- 图片以 data URL 形式内嵌进 Markdown,预览中**点击即可放大查看**

### 📁 导入与导出
- 单篇笔记一键导出为 `.md` 文件(标题写成一级标题,可与导入往返)
- 拖入或选择 `.md` / `.markdown` / `.txt` 等文件即可批量导入为新笔记

### 🔍 其它
- 按标题或正文**实时搜索**
- 明暗主题一键切换,自动记忆(默认深色,首屏无闪烁)
- 侧边栏底部显示本地存储用量,接近上限时高亮提醒
- 删除二次确认,避免误操作

---

## 🛠️ 技术栈

| 领域 | 选型 |
| --- | --- |
| 框架 | React 19 + TypeScript |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS 4 + Typography 插件 |
| Markdown | react-markdown + remark-gfm |
| 代码高亮 | react-syntax-highlighter |
| 存储 | 浏览器 LocalStorage(无后端) |

---

## 🚀 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 浏览器打开 http://localhost:5173/little-markdown/

# 生产构建
npm run build

# 本地预览构建产物
npm run preview
```

> 注意:[vite.config.ts](vite.config.ts) 中把 `base` 设为 `/little-markdown/` 以适配 GitHub Pages 项目页,因此本地开发与预览也需要带 `/little-markdown/` 前缀访问。

---

## 📦 部署

推送到 `main` 分支后,[GitHub Actions](.github/workflows/deploy.yml) 会自动构建并部署到 GitHub Pages,无需手动操作。

若要部署到其它位置(例如自定义域名的根路径),修改 [vite.config.ts](vite.config.ts) 中的 `base` 为相应路径(根路径用 `'/'`)即可。

---

## 📂 项目结构

```
src/
├─ components/   # UI 组件(编辑器、预览、侧边栏、灯箱、片段菜单等)
├─ hooks/        # React Hooks(笔记管理、主题、文件拖放、快捷键)
├─ lib/          # 纯逻辑(存储、导入导出、图片处理、片段、语法高亮、格式化)
├─ types.ts      # 数据模型(Note)
├─ App.tsx       # 应用主组件
└─ main.tsx      # 入口
```

---

## 🔒 数据与隐私

- 所有笔记与图片**仅保存在当前浏览器的 LocalStorage 中**(容量约 5 MB),不会上传到任何服务器。
- 更换设备 / 浏览器,或清除浏览器数据后,笔记不会自动同步或恢复。
- 建议对重要内容定期使用导出功能备份为 `.md` 文件。
