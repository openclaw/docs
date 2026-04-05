---
read_when:
    - 寻找真实的 OpenClaw 使用示例
    - 更新社区项目精选
summary: 由 OpenClaw 驱动的社区构建项目和集成
title: Showcase
x-i18n:
    generated_at: "2026-04-05T10:10:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2917e9a476ef527ddb3e51c610bbafbd145e705c9cc29f191639fb63d238ef70
    source_path: start/showcase.md
    workflow: 15
---

# Showcase

来自社区的真实项目。看看大家正在用 OpenClaw 构建什么。

<Info>
**想在这里展示你的项目吗？** 请在 [Discord 的 #self-promotion 频道](https://discord.gg/clawd)分享你的项目，或在 [X 上 @openclaw](https://x.com/openclaw)。
</Info>

## 🎥 OpenClaw 实战演示

由 VelvetShark 制作的完整设置演示（28 分钟）。

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
    title="OpenClaw：本该成为 Siri 那样的自托管 AI（完整设置）"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[在 YouTube 上观看](https://www.youtube.com/watch?v=SaWSPZoPX34)

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
    title="OpenClaw 展示视频"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[在 YouTube 上观看](https://www.youtube.com/watch?v=mMSKQvlmFuQ)

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
    title="OpenClaw 社区展示"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[在 YouTube 上观看](https://www.youtube.com/watch?v=5kkIJNUGFho)

## 🆕 来自 Discord 的最新项目

<CardGroup cols={2}>

<Card title="PR 审查 → Telegram 反馈" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode 完成更改 → 打开一个 PR → OpenClaw 审查 diff，并在 Telegram 中回复“少量建议”和明确的合并结论（包括需要优先修复的关键问题）。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw 在 Telegram 中交付的 PR 审查反馈" />
</Card>

<Card title="几分钟做出酒窖 Skill" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

向 “Robby”（@openclaw）请求一个本地酒窖 skill。它会请求一个示例 CSV 导出文件以及存储位置，然后快速构建并测试该 skill（示例中有 962 瓶酒）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw 从 CSV 构建本地酒窖 skill" />
</Card>

<Card title="Tesco 购物自动驾驶" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

每周餐食计划 → 常购商品 → 预订配送时段 → 确认订单。无需 API，只靠浏览器控制。

  <img src="/assets/showcase/tesco-shop.jpg" alt="通过聊天实现 Tesco 购物自动化" />
</Card>

<Card title="SNAG 截图转 Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

快捷键选取屏幕区域 → Gemini 视觉 → Markdown 立即进入剪贴板。

  <img src="/assets/showcase/snag.png" alt="SNAG 截图转 Markdown 工具" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

用于在 Agents、Claude、Codex 和 OpenClaw 之间管理 skills/commands 的桌面应用。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI 应用" />
</Card>

<Card title="Telegram 语音便笺（papla.media）" icon="microphone" href="https://papla.media/docs">
  **社区** • `voice` `tts` `telegram`

封装 papla.media TTS，并将结果作为 Telegram 语音便笺发送（没有烦人的自动播放）。

  <img src="/assets/showcase/papla-tts.jpg" alt="来自 TTS 的 Telegram 语音便笺输出" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

通过 Homebrew 安装的辅助工具，用于列出/检查/监视本地 OpenAI Codex 会话（CLI + VS Code）。

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub 上的 CodexMonitor" />
</Card>

<Card title="Bambu 3D 打印机控制" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

控制和排查 BambuLab 打印机：状态、任务、摄像头、AMS、校准等。

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub 上的 Bambu CLI skill" />
</Card>

<Card title="维也纳交通（Wiener Linien）" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

提供维也纳公共交通的实时发车、故障、电梯状态和路线规划。

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill" />
</Card>

<Card title="ParentPay 学校餐食" icon="utensils" href="#">
  **@George5562** • `automation` `browser` `parenting`

通过 ParentPay 自动预订英国学校餐食。使用鼠标坐标可靠点击表格单元格。
</Card>

<Card title="R2 上传（把我的文件发给我）" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

上传到 Cloudflare R2/S3，并生成安全的预签名下载链接。非常适合远程 OpenClaw 实例。
</Card>

<Card title="通过 Telegram 构建 iOS 应用" icon="mobile" href="#">
  **@coard** • `ios` `xcode` `testflight`

完全通过 Telegram 聊天构建了一个带地图和语音录制功能的完整 iOS 应用，并部署到 TestFlight。

  <img src="/assets/showcase/ios-testflight.jpg" alt="TestFlight 上的 iOS 应用" />
</Card>

<Card title="Oura Ring 健康助理" icon="heart-pulse" href="#">
  **@AS** • `health` `oura` `calendar`

一个个人 AI 健康助理，将 Oura ring 数据与日历、预约和健身计划集成。

  <img src="/assets/showcase/oura-health.png" alt="Oura ring 健康助理" />
</Card>
<Card title="Kev 的梦之队（14+ 个智能体）" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

一个 Gateway 网关下运行 14+ 个智能体，由 Opus 4.5 编排器委派给 Codex 工作智能体。包含一篇全面的[技术文章](https://github.com/adam91holt/orchestrated-ai-articles)，涵盖 Dream Team 名册、模型选择、沙箱隔离、webhook、heartbeat 和委派流程。用于智能体沙箱隔离的 [Clawdspace](https://github.com/adam91holt/clawdspace)。[博客文章](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/)。
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

面向 Linear 的 CLI，可与智能体工作流（Claude Code、OpenClaw）集成。可从终端管理 issue、项目和工作流。首个外部 PR 已合并！
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

通过 Beeper Desktop 读取、发送和归档消息。使用 Beeper 本地 MCP API，因此智能体可以在一个地方管理你的所有聊天（iMessage、WhatsApp 等）。
</Card>

</CardGroup>

## 🤖 自动化与工作流

<CardGroup cols={2}>

<Card title="Winix 空气净化器控制" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code 发现并确认了净化器控制方式，然后 OpenClaw 接管房间空气质量管理。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="通过 OpenClaw 控制 Winix 空气净化器" />
</Card>

<Card title="漂亮天空相机抓拍" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

由屋顶摄像头触发：每当天空看起来很美时，就让 OpenClaw 拍一张天空照片——它设计了一个 skill 并完成了拍摄。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="由 OpenClaw 捕获的屋顶摄像头天空快照" />
</Card>

<Card title="可视化晨间简报场景" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

通过定时提示词，每天早晨由一个 OpenClaw 角色生成一张“场景”图片（天气、任务、日期、喜欢的帖子/引用）。
</Card>

<Card title="Padel 球场预订" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Playtomic 可用性检查器 + 预订 CLI。再也不会错过空闲球场。
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli 截图" />
</Card>

<Card title="会计资料收集" icon="file-invoice-dollar">
  **社区** • `automation` `email` `pdf`
  
  从电子邮件中收集 PDF，并为税务顾问整理文档。每月会计工作进入自动驾驶。
</Card>

<Card title="沙发土豆开发模式" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

一边看 Netflix，一边通过 Telegram 重建整个个人网站——Notion → Astro，迁移了 18 篇文章，DNS 切到 Cloudflare。全程没打开过笔记本电脑。
</Card>

<Card title="求职智能体" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

搜索职位列表，按简历关键词进行匹配，并返回相关机会及链接。使用 JSearch API，在 30 分钟内构建完成。
</Card>

<Card title="Jira Skill 构建器" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw 连接到 Jira，然后即时生成了一个新的 skill（在它出现在 ClawHub 之前）。
</Card>

<Card title="通过 Telegram 使用 Todoist Skill" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

自动化 Todoist 任务，并让 OpenClaw 直接在 Telegram 聊天中生成该 skill。
</Card>

<Card title="TradingView 分析" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

通过浏览器自动化登录 TradingView，截取图表，并按需执行技术分析。无需 API——只需要浏览器控制。
</Card>

<Card title="Slack 自动支持" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

监视公司的 Slack 渠道，提供有帮助的回复，并将通知转发到 Telegram。还在未被要求的情况下，自主修复了某个已部署应用中的生产 bug。
</Card>

</CardGroup>

## 🧠 知识与记忆

<CardGroup cols={2}>

<Card title="xuezh 中文学习" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  通过 OpenClaw 进行中文学习引擎，包含发音反馈和学习流程。
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh 发音反馈" />
</Card>

<Card title="WhatsApp 记忆金库" icon="vault">
  **社区** • `memory` `transcription` `indexing`
  
  导入完整的 WhatsApp 导出，转录 1000+ 条语音便笺，与 git 日志交叉核对，并输出带链接的 Markdown 报告。
</Card>

<Card title="Karakeep 语义搜索" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  使用 Qdrant + OpenAI/Ollama embeddings 为 Karakeep 书签添加向量搜索。
</Card>

<Card title="头脑特工队 2 记忆" icon="brain">
  **社区** • `memory` `beliefs` `self-model`
  
  一个独立的记忆管理器，可将会话文件转化为记忆 → 信念 → 持续演化的自我模型。
</Card>

</CardGroup>

## 🎙️ 语音与电话

<CardGroup cols={2}>

<Card title="Clawdia 电话桥接" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Vapi 语音助理 ↔ OpenClaw HTTP 桥接。与你的智能体进行接近实时的电话通话。
</Card>

<Card title="OpenRouter 转录" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

通过 OpenRouter（Gemini 等）进行多语言音频转录。可在 ClawHub 上获取。
</Card>

</CardGroup>

## 🏗️ 基础设施与部署

<CardGroup cols={2}>

<Card title="Home Assistant 附加组件" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  在 Home Assistant OS 上运行的 OpenClaw Gateway 网关，支持 SSH 隧道和持久化状态。
</Card>

<Card title="Home Assistant Skill" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  通过自然语言控制和自动化 Home Assistant 设备。
</Card>

<Card title="Nix 打包" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  开箱即用的 nix 化 OpenClaw 配置，用于可复现部署。
</Card>

<Card title="CalDAV 日历" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  使用 khal/vdirsyncer 的日历 skill。自托管日历集成。
</Card>

</CardGroup>

## 🏠 家居与硬件

<CardGroup cols={2}>

<Card title="GoHome 自动化" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  原生 Nix 家居自动化，以 OpenClaw 作为交互界面，并配有漂亮的 Grafana 仪表盘。
  
  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana 仪表盘" />
</Card>

<Card title="Roborock 扫地机器人" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  通过自然对话控制你的 Roborock 扫地机器人。
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock 状态" />
</Card>

</CardGroup>

## 🌟 社区项目

<CardGroup cols={2}>

<Card title="StarSwap Marketplace" icon="star" href="https://star-swap.com/">
  **社区** • `marketplace` `astronomy` `webapp`
  
  完整的天文设备交易市场。围绕 OpenClaw 生态系统构建 / 使用其构建。
</Card>

</CardGroup>

---

## 提交你的项目

有想分享的内容吗？我们很乐意展示！

<Steps>
  <Step title="分享出来">
    在 [Discord 的 #self-promotion 频道](https://discord.gg/clawd)发帖，或在 [X 上 @openclaw](https://x.com/openclaw)
  </Step>
  <Step title="附上详细信息">
    告诉我们它是做什么的，附上仓库/演示链接，如果有截图也请一并分享
  </Step>
  <Step title="获得展示">
    我们会将出色的项目加入本页
  </Step>
</Steps>
