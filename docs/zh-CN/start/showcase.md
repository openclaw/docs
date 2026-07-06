---
description: Real-world OpenClaw projects from the community
read_when:
    - 寻找真实的 OpenClaw 使用示例
    - 更新社区项目亮点
summary: 由社区构建、由 OpenClaw 提供支持的项目和集成
title: 展示
x-i18n:
    generated_at: "2026-07-06T21:54:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

社区构建的 OpenClaw 项目：PR 审查循环、移动应用、家庭自动化、语音系统、开发工具和记忆工作流，以 Telegram、WhatsApp、Discord 和终端上的聊天原生方式构建。

<Info>
**想被展示？** 在 [Discord 上的 #self-promotion](https://discord.gg/clawd) 分享你的项目，或在 [X 上标记 @openclaw](https://x.com/openclaw)。
</Info>

## 来自 Discord 的新鲜项目

近期在编码、开发工具、移动和聊天原生产品构建方面的亮点。

<CardGroup cols={2}>

<Card title="Dropage 即时 HTML 部署" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

告诉你的智能体 “deploy this HTML”，大约一秒后就能拿到一个公开 URL。页面会在一小时后自动过期，无需服务器、无需配置、无需注册。
</Card>

<Card title="反诈骗 URL 检查器" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

粘贴任意 URL，获取判定结果。来自 38 个源（PhishTank、OpenPhish、CERT.PL 等）的 250 万+诈骗域名，在本地匹配，因此浏览历史永远不会离开本机。
</Card>

<Card title="产品设计推理 Skills" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

用于产品工作的三件套：[苏格拉底式对话](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) 会在回答前交叉审视问题，[Kano 模型策略师](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) 会将功能按是否值得保留分类，[可读的智能体输出](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) 会把智能体输出改写成平实语言。
</Card>

<Card title="面向子智能体的邮箱代理" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

让编排器在子智能体工作时不再空转：一种异步回调机制，结果会落入邮箱，而不是阻塞父智能体。
</Card>

<Card title="面向低内存机器的 lite-mode" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

让 OpenClaw 在 2-4 GB 机器上保持可用：检查可用内存，并在机器开始交换前裁剪重型功能。[GitHub 源码](https://github.com/mirajmahmudul/openclaw-lite-mode)。
</Card>

<Card title="tokenomics 成本跟踪器" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

来自 NVIDIA 工程师的 token 成本跟踪器，提供一流的 OpenClaw 支持：按模型和会话精确查看你的智能体开销去向。
</Card>

<Card title="Excalidraw 图表生成器" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

在聊天中描述一张图表，然后得到一个以编程方式生成的 Excalidraw 草图。
</Card>

<Card title="GA4 分析 Skill" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

让 OpenClaw 构建自己的 Google Analytics 查询工具，然后将其打包并发布到 ClawHub。
</Card>

<Card title="ClawEval 模型排名" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

在 59 个智能体角色上对模型做基准测试，用来回答“我的 GPU 该用哪个 LLM？”。这是社区挑选本地模型时很喜欢的工具。
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

提供商无关的歌曲生成：规划曲目、组织歌词，并修订稀疏结果，而不是一次性提示。包含一个 [MiniMax 变体](https://clawhub.ai/luischarro/music-craft-minimax)，支持 BPM、调性、结构和混搭控制。
</Card>

<Card title="PR 审查到 Telegram 反馈" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode 完成变更并打开 PR，OpenClaw 审查 diff，并在 Telegram 中回复建议和清晰的合并判定。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR 审查反馈通过 Telegram 送达" />
</Card>

<Card title="几分钟内完成酒窖 Skill" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

向 “Robby”（@openclaw）请求一个本地酒窖 Skill。它会请求一个 CSV 导出样本和存储路径，然后构建并测试该 Skill（示例中有 962 瓶酒）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw 从 CSV 构建本地酒窖 Skill" />
</Card>

<Card title="Tesco 购物自动驾驶" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

每周餐食计划、常购商品、预订配送时段、确认订单。没有 API，只有浏览器控制。

  <img src="/assets/showcase/tesco-shop.jpg" alt="通过聊天自动化 Tesco 购物" />
</Card>

<Card title="SNAG 截图转 Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

用快捷键选取屏幕区域，Gemini 视觉识别，Markdown 即时进入剪贴板。

  <img src="/assets/showcase/snag.png" alt="SNAG 截图转 Markdown 工具" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

用于跨 Agents、Claude、Codex 和 OpenClaw 管理 Skills 与命令的桌面应用。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI 应用" />
</Card>

<Card title="Telegram 语音消息（papla.media）" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

封装 papla.media TTS，并将结果作为 Telegram 语音消息发送（没有恼人的自动播放）。

  <img src="/assets/showcase/papla-tts.jpg" alt="来自 TTS 的 Telegram 语音消息输出" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

通过 Homebrew 安装的辅助工具，用于列出、检查和监看本地 OpenAI Codex 会话（CLI + VS Code）。

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub 上的 CodexMonitor" />
</Card>

<Card title="Bambu 3D 打印机控制" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

控制和排查 BambuLab 打印机：状态、作业、摄像头、AMS、校准等。

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub 上的 Bambu CLI Skill" />
</Card>

<Card title="维也纳交通（Wiener Linien）" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

提供维也纳公共交通的实时发车、故障中断、电梯状态和路线规划。

  <img src="/assets/showcase/wienerlinien.png" alt="ClawHub 上的 Wiener Linien Skill" />
</Card>

<Card title="ParentPay 学校餐食" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

通过 ParentPay 自动预订英国学校餐食。使用鼠标坐标来可靠点击表格单元格。
</Card>

<Card title="R2 上传（Send Me My Files）" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

上传到 Cloudflare R2/S3，并生成安全的预签名下载链接。适合远程 OpenClaw 实例使用。

  <img src="/assets/showcase/r2-upload.png" alt="ClawHub 上的 R2 上传 Skill" />
</Card>

<Card title="通过 Telegram 构建 iOS 应用" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

完全通过 Telegram 聊天构建了一个带地图和语音录制的完整 iOS 应用，并准备好发布到 App Store。
</Card>

<Card title="Oura Ring 健康助手" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

个人 AI 健康助手，将 Oura 戒指数据与日历、预约和健身房日程集成。

  <img src="/assets/showcase/oura-health.png" alt="Oura 戒指健康助手" />
</Card>

<Card title="Kev 的 Dream Team（14+ 个智能体）" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

一个 Gateway 网关下有 14+ 个智能体，由 Opus 4.5 编排器委派给 Codex worker。请参阅[技术文章](https://github.com/adam91holt/orchestrated-ai-articles)和 [Clawdspace](https://github.com/adam91holt/clawdspace) 了解 Agent 沙箱隔离。
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

面向 Linear 的 CLI，可与智能体式工作流（Claude Code、OpenClaw）集成。从终端管理 issue、项目和工作流。
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

通过 Beeper Desktop 读取、发送和归档消息。使用 Beeper local MCP API，让智能体可以在一个地方管理你的所有聊天（iMessage、WhatsApp 等）。
</Card>

</CardGroup>

## 自动化和工作流

调度、浏览器控制、支持循环，以及产品中“直接帮我完成任务”的一面。

<CardGroup cols={2}>

<Card title="Winix 空气净化器控制" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code 发现并确认了净化器控制方式，然后 OpenClaw 接管以管理房间空气质量。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="通过 OpenClaw 控制 Winix 空气净化器" />
</Card>

<Card title="漂亮天空相机抓拍" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

由屋顶摄像头触发：每当天空看起来很漂亮时，让 OpenClaw 拍一张天空照片。它设计了一个 Skill 并完成了拍摄。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="OpenClaw 捕获的屋顶摄像头天空快照" />
</Card>

<Card title="可视化晨报场景" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

一个定时提示会每天早晨通过 OpenClaw 人设生成一张场景图（天气、任务、日期、喜欢的帖子或引语）。
</Card>

<Card title="Padel 球场预订" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic 可用性检查器加预订 CLI。再也不会错过开放球场。

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli 截图" />
</Card>

<Card title="会计资料收集" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

从电子邮件收集 PDF，为税务顾问准备文档。每月会计自动运行。
</Card>

<Card title="沙发土豆开发模式" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

一边看 Netflix，一边通过 Telegram 重建整个个人网站：从 Notion 迁移到 Astro，迁移 18 篇文章，DNS 迁到 Cloudflare。全程没有打开笔记本电脑。
</Card>

<Card title="求职智能体" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

搜索职位列表，与简历关键词匹配，并返回带链接的相关机会。使用 JSearch API 在 30 分钟内构建完成。
</Card>

<Card title="Jira Skill 构建器" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw 连接到 Jira，然后即时生成了一个新技能（在它出现在 ClawHub 之前）。
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

自动化 Todoist 任务，并让 OpenClaw 直接在 Telegram 聊天中生成该技能。
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

通过浏览器自动化登录 TradingView，截取图表截图，并按需执行技术分析。无需 API，只需要浏览器控制。
</Card>

<Card title="Car negotiation ($4,200 saved)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

让 OpenClaw 放手处理汽车经销商：它负责来回谈判，并把价格砍掉了 4,200 美元。
</Card>

<Card title="Flight check-in autopilot" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

在电子邮件中找到下一班航班，完成在线值机，并选择靠窗座位——无需航空公司应用。
</Card>

<Card title="Insurance claim filing" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

自主提交保险理赔申请，并安排后续预约。
</Card>

<Card title="Idealista real estate skill" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

用于房产查询和估值的 Idealista API CLI，被包装成技能，让智能体可以在聊天中帮你找房。
</Card>

<Card title="Gardening business back office" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

监控 Gmail 中的工单，分析通过 Telegram 发送的房产照片，编写多页 LaTeX 报价 PDF，并通过 Xero 开票。
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

监控公司 Slack 渠道，给出有帮助的回复，并将通知转发到 Telegram。还在没人要求的情况下自主修复了已部署应用中的生产缺陷。
</Card>

</CardGroup>

## 知识和记忆

用于索引、搜索、记住并推理个人或团队知识的系统。

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

通过 OpenClaw 提供发音反馈和学习流程的中文学习引擎。

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="X post analysis pipeline" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

拉取 100 个热门 X 账号的 400 万条帖子，并将其转化为可查询的分析流水线。
</Card>

<Card title="Lab results to Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

将多年的血液检查实验室结果整理到结构化的 Notion 数据库中。
</Card>

<Card title="Obsidian second brain" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

运行在 WhatsApp 上的日常助手，所有记忆都以 markdown 形式存储在受版本控制的 Obsidian 仓库中：卡路里和训练追踪、待办清单、生活事务管理。
</Card>

<Card title="Family history bot" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

驻留在家庭 Telegram 群聊中，记录 50 多位亲属的故事，并提出有依据的追问——还会用尼泊尔语回复母语使用者。
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **Community** • `memory` `transcription` `indexing`

摄取完整的 WhatsApp 导出，转写 1k+ 条语音笔记，与 git 日志交叉核对，并输出带链接的 markdown 报告。
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

使用 Qdrant 加 OpenAI 或 Ollama 嵌入，为 Karakeep 书签添加向量搜索。
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

独立的记忆管理器，将会话文件转化为记忆，再转化为信念，最后形成不断演进的自我模型。
</Card>

</CardGroup>

## 语音和电话

以语音优先的入口点、电话桥接，以及大量转写工作流。

<CardGroup cols={2}>

<Card title="Pebble Ring one-tap voice" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

轻点一下 Pebble Ring 即可开始与 OpenClaw 的语音对话——从可穿戴设备访问智能体。
</Card>

<Card title="Creator media studio" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

聊天中的完整媒体工作室：TTS、转写，以及接入 Codex 5.2 和 MiniMax 的浏览器自动化。
</Card>

<Card title="Action Button walkie-talkie" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

iPhone Action Button 接入 OpenClaw：按下、说话，然后智能体像对讲机一样回应。
</Card>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

连接 Vapi 语音助手和 OpenClaw HTTP 的桥接。与你的智能体进行近实时电话通话。
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

通过 OpenRouter（Gemini 等）进行多语言音频转写。已在 ClawHub 上提供。

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## 基础设施和部署

让 OpenClaw 更易运行和扩展的打包、部署和集成。

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

在 Home Assistant OS 上运行的 OpenClaw gateway，支持 SSH 隧道和持久状态。
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

通过自然语言控制和自动化 Home Assistant 设备。

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="macOS menu bar manager" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

原生 Swift 菜单栏应用，可显示智能体状态并提供快速控制。
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

开箱即用的 nix 化 OpenClaw 配置，用于可复现部署。
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

使用 khal 和 vdirsyncer 的日历技能。自托管日历集成。

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## 家庭和硬件

OpenClaw 的物理世界一面：住宅、传感器、摄像头、吸尘器和其他设备。

<CardGroup cols={2}>

<Card title="Self-built HomePod skill" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw 在本地网络中发现了 HomePod，并自己编写了控制它们的技能。
</Card>

<Card title="$35 holo cube interface" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

一个便宜的全息立方体，作为智能体在桌面上的实体面孔。
</Card>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

以 OpenClaw 作为界面的 Nix 原生家庭自动化，另带 Grafana 仪表板。

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

完整的天文设备市场。使用 OpenClaw 生态系统并围绕它构建。
</Card>

<Card title="Clinch agent negotiation protocol" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

开放的智能体到智能体谈判：你的智能体会与其他节点讨价还价，协商日程和服务协议，并对结果进行加密签名——你只需批准或拒绝。
</Card>

</CardGroup>

## 提交你的项目

<Steps>
  <Step title="Share it">
    发布到 [Discord 上的 #self-promotion](https://discord.gg/clawd)，或 [发推 @openclaw](https://x.com/openclaw)。
  </Step>
  <Step title="Include details">
    告诉我们它能做什么，附上仓库或演示链接；如果有截图，也请一并分享。
  </Step>
  <Step title="Get featured">
    我们会把出色项目添加到此页面。
  </Step>
</Steps>

## 相关

- [入门指南](/zh-CN/start/getting-started)
- [OpenClaw](/zh-CN/start/openclaw)
- [openclaw.ai 上的完整 X showcase](https://openclaw.ai/showcase/)
