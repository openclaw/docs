---
description: Real-world OpenClaw projects from the community
read_when:
    - 寻找真实的 OpenClaw 使用示例
    - 更新社区项目亮点
summary: 由社区构建并由 OpenClaw 驱动的项目和集成
title: 展示
x-i18n:
    generated_at: "2026-06-27T03:22:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 999f89403c1d022e795c0017e5aa7543a4a021ba98cf601b37ce2835136a86a1
    source_path: start/showcase.md
    workflow: 16
---

OpenClaw 项目不是玩具演示。人们正在从他们已经使用的渠道交付 PR review loops、移动应用、家庭自动化、语音系统、devtools，以及重度记忆工作流 —— 在 Telegram、WhatsApp、Discord 和终端上进行 chat-native 构建；无需等待 API 即可完成预订、购物和支持的真实自动化；以及与打印机、吸尘器、摄像头和家庭系统的物理世界集成。

<Info>
**想被展示？** 在 [Discord 上的 #self-promotion](https://discord.gg/clawd) 分享你的项目，或在 [X 上标记 @openclaw](https://x.com/openclaw)。
</Info>

## 来自 Discord 的新鲜项目

近期在编码、devtools、移动端和 chat-native 产品构建中的亮点。

<CardGroup cols={2}>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode 完成变更、打开 PR，OpenClaw 审查 diff，并在 Telegram 中回复建议以及清晰的合并结论。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

请求 “Robby” (@openclaw) 创建本地酒窖技能。它会请求一个示例 CSV 导出和存储路径，然后构建并测试该技能（示例中有 962 瓶酒）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

每周餐食计划、常购商品、预订配送时段、确认订单。没有 API，只有浏览器控制。

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

用热键选取屏幕区域，Gemini 视觉处理，Markdown 即刻进入你的剪贴板。

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

用于在 Agents、Claude、Codex 和 OpenClaw 之间管理 Skills 和命令的桌面应用。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

封装 papla.media TTS，并将结果作为 Telegram 语音消息发送（没有烦人的自动播放）。

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

通过 Homebrew 安装的辅助工具，用于列出、检查和监看本地 OpenAI Codex 会话（CLI + VS Code）。

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

控制和排查 BambuLab 打印机：状态、任务、摄像头、AMS、校准等。

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

为维也纳公共交通提供实时发车、故障中断、电梯状态和路线规划。

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

通过 ParentPay 自动预订英国学校餐食。使用鼠标坐标可靠点击表格单元格。
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

上传到 Cloudflare R2/S3，并生成安全的预签名下载链接。适用于远程 OpenClaw 实例。

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

完全通过 Telegram 聊天构建了一款带地图和语音录制的完整 iOS 应用，并部署到 TestFlight。

  <img src="/assets/showcase/ios-testflight.jpg" alt="iOS app on TestFlight" />
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

个人 AI 健康助手，将 Oura 戒指数据与日历、预约和健身房日程集成。

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

一个 Gateway 网关下运行 14+ 个智能体，由 Opus 4.5 编排器委派给 Codex worker。查看 [技术文章](https://github.com/adam91holt/orchestrated-ai-articles) 和 [Clawdspace](https://github.com/adam91holt/clawdspace)，了解智能体沙箱隔离。
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

面向 Linear 的 CLI，可与智能体式工作流（Claude Code、OpenClaw）集成。从终端管理 issue、项目和工作流。
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

通过 Beeper Desktop 读取、发送和归档消息。使用 Beeper 本地 MCP API，让智能体可以在一个地方管理你的所有聊天（iMessage、WhatsApp 等）。
</Card>

</CardGroup>

## 自动化和工作流

调度、浏览器控制、支持循环，以及产品中“直接帮我完成任务”的那一面。

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code 发现并确认了净化器控制方式，然后 OpenClaw 接管以管理房间空气质量。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

由屋顶摄像头触发：只要天空看起来漂亮，就让 OpenClaw 拍一张天空照片。它设计了一个技能并完成了拍摄。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

一个定时提示每天早上通过 OpenClaw 人格生成一张场景图（天气、任务、日期、喜欢的帖子或引语）。
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic 可用性检查器加预订 CLI。再也不会错过开放的球场。

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

从电子邮件收集 PDF，为税务顾问准备文档。月度会计自动驾驶。
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

一边看 Netflix，一边通过 Telegram 重建整个个人网站 —— 从 Notion 到 Astro，迁移 18 篇文章，DNS 切到 Cloudflare。从未打开笔记本电脑。
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

搜索职位列表，与简历关键词匹配，并返回带链接的相关机会。使用 JSearch API 在 30 分钟内构建完成。
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw 连接到 Jira，然后即时生成了一个新技能（在它出现在 ClawHub 之前）。
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

自动化 Todoist 任务，并让 OpenClaw 直接在 Telegram 聊天中生成该技能。
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

通过浏览器自动化登录 TradingView，截取图表，并按需执行技术分析。不需要 API —— 只需要浏览器控制。
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

监看公司 Slack 频道，提供有帮助的回复，并将通知转发到 Telegram。还在无人要求的情况下自主修复了已部署应用中的一个生产 bug。
</Card>

</CardGroup>

## 知识和记忆

索引、搜索、记住并推理个人或团队知识的系统。

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

通过 OpenClaw 提供发音反馈和学习流程的中文学习引擎。

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **Community** • `memory` `transcription` `indexing`

导入完整 WhatsApp 导出，转录 1k+ 条语音消息，与 git 日志交叉核对，并输出带链接的 Markdown 报告。
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

使用 Qdrant 加 OpenAI 或 Ollama embeddings，为 Karakeep 书签添加向量搜索。
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

独立的记忆管理器，将会话文件转化为记忆，再转化为信念，然后形成一个不断演进的自我模型。
</Card>

</CardGroup>

## 语音和电话

以语音优先的入口点、电话桥接，以及重度转录工作流。

<CardGroup cols={2}>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

连接 Vapi 语音助手与 OpenClaw HTTP 的桥接。让你的智能体接近实时地通电话。
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

通过 OpenRouter（Gemini 等）进行多语言音频转录。可在 ClawHub 获取。

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## 基础设施和部署

让 OpenClaw 更容易运行和扩展的打包、部署与集成。

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw Gateway 网关在 Home Assistant OS 上运行，支持 SSH 隧道和持久状态。
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

通过自然语言控制和自动化 Home Assistant 设备。

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

自带完整配置的 Nix 化 OpenClaw 配置，用于可复现部署。
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

使用 khal 和 vdirsyncer 的日历技能。自托管日历集成。

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## 家庭和硬件

OpenClaw 面向物理世界的一面：住宅、传感器、摄像头、扫地机和其他设备。

<CardGroup cols={2}>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

以 OpenClaw 作为接口的 Nix 原生家庭自动化，并包含 Grafana 仪表板。

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

通过自然对话控制你的 Roborock 扫地机器人。

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## 社区项目

从单一工作流发展为更广泛产品或生态系统的项目。

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

完整的天文设备市场。基于 OpenClaw 生态系统构建，并围绕其打造。
</Card>

</CardGroup>

## 提交你的项目

<Steps>
  <Step title="Share it">
    发布到 [Discord 上的 #self-promotion](https://discord.gg/clawd)，或[发推 @openclaw](https://x.com/openclaw)。
  </Step>
  <Step title="Include details">
    告诉我们它能做什么，附上仓库或演示链接，如果有截图也请分享。
  </Step>
  <Step title="Get featured">
    我们会把出色的项目添加到此页面。
  </Step>
</Steps>

## 相关内容

- [入门指南](/zh-CN/start/getting-started)
- [OpenClaw](/zh-CN/start/openclaw)
