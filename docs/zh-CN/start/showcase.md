---
description: Real-world OpenClaw projects from the community
read_when:
    - 寻找真实的 OpenClaw 使用示例
    - 更新社区项目亮点
summary: 由社区构建、由 OpenClaw 驱动的项目和集成
title: 展示
x-i18n:
    generated_at: "2026-07-02T07:59:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0530aae85db5414b61c968dcc290178b2b33a540c7f86d556e9bad69cf374fb7
    source_path: start/showcase.md
    workflow: 16
---

OpenClaw 项目不是玩具演示。人们正在从他们已经使用的渠道交付 PR 审查循环、移动应用、家庭自动化、语音系统、开发工具和重记忆工作流：基于 Telegram、WhatsApp、Discord 和终端的聊天原生构建；无需等待 API 即可完成预订、购物和支持的真实自动化；以及与打印机、吸尘器、摄像头和家庭系统的物理世界集成。

<Info>
**想被推荐展示？** 在 [Discord 的 #self-promotion](https://discord.gg/clawd) 分享你的项目，或在 [X 上标记 @openclaw](https://x.com/openclaw)。
</Info>

## Discord 最新动态

近期在编码、开发工具、移动端和聊天原生产品构建中的亮点。

<CardGroup cols={2}>

<Card title="PR 审查到 Telegram 反馈" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode 完成改动、打开 PR，OpenClaw 审查 diff，并在 Telegram 中回复建议和清晰的合并判断。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR 审查反馈通过 Telegram 送达" />
</Card>

<Card title="几分钟创建酒窖技能" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

请求 “Robby”（@openclaw）创建一个本地酒窖技能。它会请求一个示例 CSV 导出和存储路径，然后构建并测试该技能（示例中有 962 瓶酒）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw 从 CSV 构建本地酒窖技能" />
</Card>

<Card title="Tesco 购物自动驾驶" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

每周餐食计划、常购商品、预订配送时段、确认订单。没有 API，只有浏览器控制。

  <img src="/assets/showcase/tesco-shop.jpg" alt="通过聊天进行 Tesco 购物自动化" />
</Card>

<Card title="SNAG 截图转 Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

热键选取屏幕区域、Gemini 视觉、即时 Markdown 进入你的剪贴板。

  <img src="/assets/showcase/snag.png" alt="SNAG 截图转 Markdown 工具" />
</Card>

<Card title="智能体 UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

用于在 Agents、Claude、Codex 和 OpenClaw 之间管理技能和命令的桌面应用。

  <img src="/assets/showcase/agents-ui.jpg" alt="智能体 UI 应用" />
</Card>

<Card title="Telegram 语音留言（papla.media）" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

封装 papla.media TTS，并将结果作为 Telegram 语音留言发送（没有烦人的自动播放）。

  <img src="/assets/showcase/papla-tts.jpg" alt="来自 TTS 的 Telegram 语音留言输出" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

通过 Homebrew 安装的辅助工具，用于列出、检查和监视本地 OpenAI Codex 会话（CLI + VS Code）。

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub 上的 CodexMonitor" />
</Card>

<Card title="Bambu 3D 打印机控制" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

控制和排查 BambuLab 打印机：状态、任务、摄像头、AMS、校准等。

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub 上的 Bambu CLI 技能" />
</Card>

<Card title="维也纳交通（Wiener Linien）" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

为维也纳公共交通提供实时发车、故障中断、电梯状态和路线规划。

  <img src="/assets/showcase/wienerlinien.png" alt="ClawHub 上的 Wiener Linien 技能" />
</Card>

<Card title="ParentPay 学校餐食" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

通过 ParentPay 自动预订英国学校餐食。使用鼠标坐标可靠点击表格单元格。
</Card>

<Card title="R2 上传（Send Me My Files）" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

上传到 Cloudflare R2/S3，并生成安全的预签名下载链接。适用于远程 OpenClaw 实例。

  <img src="/assets/showcase/r2-upload.png" alt="ClawHub 上的 R2 上传技能" />
</Card>

<Card title="通过 Telegram 构建 iOS 应用" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

完全通过 Telegram 聊天构建了一个带地图和语音录制的完整 iOS 应用，并准备好分发到 App Store。
</Card>

<Card title="Oura Ring 健康助手" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

个人 AI 健康助手，将 Oura ring 数据与日历、预约和健身房日程集成。

  <img src="/assets/showcase/oura-health.png" alt="Oura ring 健康助手" />
</Card>

<Card title="Kev 的梦之队（14+ 智能体）" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

一个 Gateway 网关下有 14+ 个智能体，由 Opus 4.5 编排器委派给 Codex worker。参见 [技术文章](https://github.com/adam91holt/orchestrated-ai-articles) 和 [Clawdspace](https://github.com/adam91holt/clawdspace) 了解 Agent 沙箱隔离。
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

面向 Linear 的 CLI，可与 agentic 工作流（Claude Code、OpenClaw）集成。从终端管理议题、项目和工作流。
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

通过 Beeper Desktop 读取、发送和归档消息。使用 Beeper 本地 MCP API，让智能体可以在一个地方管理你的所有聊天（iMessage、WhatsApp 等）。
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

<Card title="漂亮天空相机照片" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

由屋顶摄像头触发：每当天空看起来漂亮时，让 OpenClaw 拍一张天空照片。它设计了一个技能并拍下了照片。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="OpenClaw 捕捉的屋顶摄像头天空快照" />
</Card>

<Card title="可视化早晨简报场景" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

通过一个 OpenClaw 人设，定时提示每天早晨生成一张场景图片（天气、任务、日期、喜欢的帖子或引语）。
</Card>

<Card title="Padel 球场预订" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic 可用性检查器加预订 CLI。再也不会错过空闲球场。

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli 截图" />
</Card>

<Card title="会计资料收集" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

从电子邮件收集 PDF，为税务顾问准备文档。让每月会计工作自动运行。
</Card>

<Card title="沙发土豆开发模式" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

一边看 Netflix，一边通过 Telegram 重建了整个个人网站：从 Notion 到 Astro，迁移 18 篇文章，DNS 切到 Cloudflare。完全没打开笔记本电脑。
</Card>

<Card title="求职智能体" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

搜索职位列表，与简历关键词匹配，并返回带链接的相关机会。使用 JSearch API 在 30 分钟内构建完成。
</Card>

<Card title="Jira 技能构建器" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw 连接到 Jira，然后即时生成了一个新技能（在它出现在 ClawHub 之前）。
</Card>

<Card title="通过 Telegram 构建 Todoist 技能" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

自动化 Todoist 任务，并让 OpenClaw 直接在 Telegram 聊天中生成该技能。
</Card>

<Card title="TradingView 分析" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

通过浏览器自动化登录 TradingView、截图图表，并按需执行技术分析。不需要 API，只需要浏览器控制。
</Card>

<Card title="Slack 自动支持" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

监视公司 Slack 频道，提供有帮助的回复，并将通知转发到 Telegram。在没有被要求的情况下，自主修复了已部署应用中的生产 bug。
</Card>

</CardGroup>

## 知识和记忆

用于索引、搜索、记住并推理个人或团队知识的系统。

<CardGroup cols={2}>

<Card title="xuezh 中文学习" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

通过 OpenClaw 提供发音反馈和学习流程的中文学习引擎。

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh 发音反馈" />
</Card>

<Card title="WhatsApp 记忆保险库" icon="vault">
  **Community** • `memory` `transcription` `indexing`

摄取完整 WhatsApp 导出，转写 1k+ 条语音留言，与 git 日志交叉检查，并输出带链接的 markdown 报告。
</Card>

<Card title="Karakeep 语义搜索" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

使用 Qdrant 加 OpenAI 或 Ollama embeddings 为 Karakeep 书签添加向量搜索。
</Card>

<Card title="Inside-Out-2 记忆" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

独立的记忆管理器，将会话文件转换成记忆，再转换成信念，然后形成不断演化的自我模型。
</Card>

</CardGroup>

## 语音和电话

以语音优先的入口、电话桥接，以及重转写工作流。

<CardGroup cols={2}>

<Card title="Clawdia 电话桥接" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

连接 Vapi 语音助手和 OpenClaw HTTP 的桥接。与你的智能体进行近实时电话通话。
</Card>

<Card title="OpenRouter 转写" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

通过 OpenRouter 进行多语言音频转写（Gemini 等）。可在 ClawHub 获取。

  <img src="/assets/showcase/openrouter-transcribe.png" alt="ClawHub 上的 OpenRouter 转写技能" />
</Card>

</CardGroup>

## 基础设施和部署

让 OpenClaw 更容易运行和扩展的打包、部署和集成。

<CardGroup cols={2}>

<Card title="Home Assistant 附加组件" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

在 Home Assistant OS 上运行的 OpenClaw Gateway 网关，支持 SSH 隧道和持久状态。
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

通过自然语言控制和自动化 Home Assistant 设备。

  <img src="/assets/showcase/homeassistant.png" alt="ClawHub 上的 Home Assistant skill" />
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

内置完整功能的 nixified OpenClaw 配置，用于可复现部署。
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

使用 khal 和 vdirsyncer 的日历 Skills。自托管日历集成。

  <img src="/assets/showcase/caldav-calendar.png" alt="ClawHub 上的 CalDAV calendar skill" />
</Card>

</CardGroup>

## 家庭和硬件

OpenClaw 面向物理世界的一侧：家庭、传感器、摄像头、扫地机器人和其他设备。

<CardGroup cols={2}>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

以 OpenClaw 为界面的 Nix 原生家庭自动化，并带有 Grafana 仪表板。

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana 仪表板" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

通过自然对话控制你的 Roborock 扫地机器人。

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock 状态" />
</Card>

</CardGroup>

## 社区项目

从单个工作流发展为更广泛产品或生态系统的项目。

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

完整的天文设备市场。基于 OpenClaw 生态系统构建，并围绕其运行。
</Card>

</CardGroup>

## 提交你的项目

<Steps>
  <Step title="分享它">
    发布到 [Discord 上的 #self-promotion](https://discord.gg/clawd)，或 [tweet @openclaw](https://x.com/openclaw)。
  </Step>
  <Step title="包含详细信息">
    告诉我们它能做什么，链接到仓库或演示，并在有截图时分享截图。
  </Step>
  <Step title="获得推荐">
    我们会把突出的项目添加到此页面。
  </Step>
</Steps>

## 相关

- [入门指南](/zh-CN/start/getting-started)
- [OpenClaw](/zh-CN/start/openclaw)
