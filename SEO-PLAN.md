# PageText.io SEO 优化方案

## 现状分析
- 工具站：网页 → Markdown 转换器（Jina Reader API）
- 单页应用（首页），已添加 API 页
- GSC：已添加并验证（siteOwner）
- Bing：未添加（需手动操作）
- GA 已配置
- 基础 SEO 标签完整（meta, OG, structured data, sitemap, robots.txt）
- 无外链，无博客
- ✅ DataForSEO 已通过 Composio 接入（API 余额 $1）

## 已实施（2026-07-04）

### 技术 SEO
- [x] GSC 添加 pagetext.io（sc-domain 验证）
- [x] 提交 Sitemap 到 GSC
- [x] 创建 /api 页面（开发者文档）
- [x] 扩展 Sitemap（首页 + API 页）
- [x] 首页导航 + 页脚增加 /api 链接

### 内链建设
- [x] sqlformat.io "Related Free Tools" 区块添加 pagetext.io 链接

### 自动任务（Cron）
- [x] 每日 14:00 SEO cron（GSC 提交 + 数据查询 + 建议）

### DataForSEO 关键词研究（2026-07-04）
- [x] DataForSEO 通过 Composio 连接并激活
- [x] 45 个关键词建议（搜索量、竞争度、CPC）
- [x] 所有相关竞争度极低（0-16/100），机会巨大

## DataForSEO 关键词研究结果

### 🎯 核心关键词（与 pagetext.io 功能直接相关）

| 关键词 | 月搜索量 | 竞争度(0-100) | CPC |
|--------|:-------:|:------------:|:---:|
| **web to markdown** | 260 | 4 | $10.20 |
| **url to markdown** | 210 | 3 | - |
| **web page text extractor** | 390 | 11 | $3.97 |
| **convert webpage to markdown** | 70 | 5 | $102.24 |
| **markdown from url** | 10 | 0 | - |
| **page text extractor** | 10 | 0 | - |
| **markdown web** | 110 | 5 | - |
| **convert to markdown online** | 20 | 3 | - |

### 📈 高流量关联关键词

| 关键词 | 月搜索量 | 竞争度(0-100) | 说明 |
|--------|:-------:|:------------:|------|
| **html to markdown** | 1900 | 2 | 最大流量池 |
| **markdown to html** | 2400 | 1 | 最大流量池（双向转换） |
| **markdown converter** | 1000 | 2 | 通用转换词 |
| **convert html to markdown** | 480 | 4 | 精确长尾 |
| **html to markdown converter** | 480 | 4 | 精确长尾 |
| **html to md converter** | 320 | 2 | 精确长尾 |
| **convert markdown to html** | 480 | 2 | 反向转换 |
| **convert md to html** | 480 | 2 | 反向转换 |

### 📝 长尾关键词（搜索量 < 50，竞争 0-3）

| 关键词 | 月搜索量 | 竞争度 |
|--------|:-------:|:-----:|
| online markdown editors | 30 | 1 |
| markdown link url | 20 | 0 |
| markup url | 20 | 0 |
| readme markdown online | 20 | 5 |
| page text extractor | 10 | 0 |
| markdown from url | 10 | 0 |
| convert html to markdown online | 10 | 11 |
| convert markdown to html online | 10 | 1 |
| github markdown online | 10 | 3 |

### 💡 核心发现
- **所有关键词竞争度极低**（0-16/100），属于未充分开发的蓝海市场
- 最大机会在 **html to markdown（1900/月）+ markdown to html（2400/月）** 双向转换方向
- CPC 最高的关键词 **convert webpage to markdown（$102）** 说明这个垂直领域商业价值大
- pagetext.io 目前只做"网页→Markdown"单向，做双向转换可覆盖更大流量

## 待完成

### 第1优先级：内容策略（按阶段实施）

根据 DataForSEO 数据，内容发布时间表更新如下：

| 周次 | 内容类型 | 目标关键词 | 预期流量 |
|:----:|---------|-----------|:-------:|
| 本周 | 首页重写 | web to markdown, url to markdown, convert webpage to markdown | 540/月 |
| 第1周 | 新增 /html-to-markdown 页面 | html to markdown, html to markdown converter | 2200/月 |
| 第2周 | 新增 /markdown-to-html 页面 | markdown to html, convert md to html | 2880/月 |
| 第3周 | 新增 /web-page-text-extractor 页面 | web page text extractor, page text extractor | 400/月 |
| 第4周 | 新增 /markdown-converter 汇总页 | markdown converter, convert to markdown online | 1020/月 |
| 持续 | 博客：how to convert url to markdown | markdown from url, url to markdown | 220/月 |
| 持续 | 用例页：for ChatGPT, for Claude | web to markdown for chatgpt | 长尾 |

### 第2优先级：技术 SEO
- [ ] 新增 5 个内容页（按上述计划每周 1-2 个）
- [ ] 每新增页面后扩展 sitemap
- [ ] 页面间互链（内链矩阵）
- [ ] 站外：sqlformat.io / devtoolbox 同步添加新页面链接

### 第3优先级：Bing 收录
1. 打开 https://www.bing.com/webmaster/
2. 添加 pagetext.io
3. 验证所有权（DNS TXT 或文件验证）
4. 提交 sitemap
5. 完成后告知，cron 自动接管每日提交

## 自动任务

### 每日 14:00（已设置 cron `f2e20f4e487a`）
1. 提交最新 sitemap 到 GSC
2. 查询 GSC 近7天搜索数据
3. 生成 SEO 报告（展示/点击/排名/建议）

### 可选的：每周 DataForSEO 关键词监控
可每周自动跑 DataForSEO 查关键词排名变化，监控 SEO 进展。

## 阶段目标

| 阶段 | 时间 | 目标 |
|:----:|:----:|------|
| 🚀 **起步** | 第1-4周 | 上线 5 个内容页，覆盖核心关键词，GSC 开始收录 |
| 📈 **增长** | 第2-3月 | 关键词排名进入前 20，月展示 > 1000 |
| 🏆 **稳定** | 第3-6月 | 核心关键词进入前 10，月点击 > 100 |
