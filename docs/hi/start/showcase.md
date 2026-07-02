---
description: Real-world OpenClaw projects from the community
read_when:
    - वास्तविक OpenClaw उपयोग उदाहरणों की तलाश
    - सामुदायिक परियोजना की प्रमुख झलकियाँ अद्यतन करना
summary: OpenClaw द्वारा संचालित समुदाय-निर्मित प्रोजेक्ट और इंटीग्रेशन
title: प्रदर्शनी
x-i18n:
    generated_at: "2026-07-02T08:21:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0530aae85db5414b61c968dcc290178b2b33a540c7f86d556e9bad69cf374fb7
    source_path: start/showcase.md
    workflow: 16
---

OpenClaw प्रोजेक्ट खिलौना डेमो नहीं हैं। लोग जिन चैनलों का पहले से उपयोग करते हैं, उनसे PR review लूप, मोबाइल ऐप, होम ऑटोमेशन, वॉयस सिस्टम, devtools, और मेमरी-भारी workflow शिप कर रहे हैं — Telegram, WhatsApp, Discord, और टर्मिनल पर चैट-नेटिव बिल्ड; API का इंतजार किए बिना बुकिंग, शॉपिंग, और सपोर्ट के लिए वास्तविक ऑटोमेशन; और प्रिंटर, वैक्यूम, कैमरा, और होम सिस्टम के साथ भौतिक दुनिया के इंटीग्रेशन।

<Info>
**फीचर होना चाहते हैं?** अपना प्रोजेक्ट [Discord पर #self-promotion](https://discord.gg/clawd) में साझा करें या [X पर @openclaw को टैग करें](https://x.com/openclaw)।
</Info>

## Discord से ताज़ा

कोडिंग, devtools, मोबाइल, और चैट-नेटिव प्रोडक्ट बिल्डिंग में हाल के खास उदाहरण।

<CardGroup cols={2}>

<Card title="PR Review से Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode बदलाव पूरा करता है, PR खोलता है, OpenClaw diff की समीक्षा करता है और Telegram में सुझावों के साथ एक स्पष्ट merge verdict देता है।

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Telegram में दिया गया OpenClaw PR review feedback" />
</Card>

<Card title="मिनटों में Wine Cellar Skill" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

"Robby" (@openclaw) से एक local wine cellar skill मांगा गया। यह एक sample CSV export और store path मांगता है, फिर skill बनाकर test करता है (उदाहरण में 962 bottles)।

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="CSV से local wine cellar skill बनाता OpenClaw" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

साप्ताहिक meal plan, regulars, delivery slot बुक करना, order confirm करना। कोई API नहीं, सिर्फ browser control।

  <img src="/assets/showcase/tesco-shop.jpg" alt="चैट के जरिए Tesco shop automation" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

स्क्रीन region को hotkey करें, Gemini vision, आपके clipboard में तुरंत Markdown।

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents, Claude, Codex, और OpenClaw में skills और commands प्रबंधित करने के लिए desktop app।

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

papla.media TTS को wrap करता है और results को Telegram voice notes के रूप में भेजता है (बिना परेशान करने वाले autoplay के)।

  <img src="/assets/showcase/papla-tts.jpg" alt="TTS से Telegram voice note output" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

local OpenAI Codex sessions (CLI + VS Code) को list, inspect, और watch करने के लिए Homebrew-installed helper।

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub पर CodexMonitor" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab printers को control और troubleshoot करें: status, jobs, camera, AMS, calibration, और बहुत कुछ।

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub पर Bambu CLI skill" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Vienna के public transport के लिए real-time departures, disruptions, elevator status, और routing।

  <img src="/assets/showcase/wienerlinien.png" alt="ClawHub पर Wiener Linien skill" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ParentPay के जरिए automated UK school meal booking। भरोसेमंद table cell clicking के लिए mouse coordinates का उपयोग करता है।
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3 पर upload करें और secure presigned download links generate करें। remote OpenClaw instances के लिए उपयोगी।

  <img src="/assets/showcase/r2-upload.png" alt="ClawHub पर R2 upload skill" />
</Card>

<Card title="Telegram के जरिए iOS app" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

maps और voice recording के साथ पूरा iOS app बनाया, पूरी तरह Telegram chat के जरिए App Store distribution के लिए तैयार किया।
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Oura ring data को calendar, appointments, और gym schedule के साथ integrate करने वाला personal AI health assistant।

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

एक gateway के तहत 14+ agents, जिसमें Opus 4.5 orchestrator Codex workers को delegate करता है। agent sandboxing के लिए [technical write-up](https://github.com/adam91holt/orchestrated-ai-articles) और [Clawdspace](https://github.com/adam91holt/clawdspace) देखें।
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

Linear के लिए CLI जो agentic workflows (Claude Code, OpenClaw) के साथ integrate करता है। terminal से issues, projects, और workflows manage करें।
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Beeper Desktop के जरिए messages read, send, और archive करें। Beeper local MCP API का उपयोग करता है ताकि agents आपके सभी chats (iMessage, WhatsApp, और अधिक) को एक जगह manage कर सकें।
</Card>

</CardGroup>

## ऑटोमेशन और workflow

Scheduling, browser control, support loops, और product का "बस मेरे लिए task कर दो" वाला हिस्सा।

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code ने purifier controls खोजे और confirm किए, फिर OpenClaw room air quality manage करने के लिए takeover करता है।

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="OpenClaw के जरिए Winix air purifier control" />
</Card>

<Card title="सुंदर sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

roof camera से triggered: जब भी sky सुंदर लगे, OpenClaw से sky photo snap करने को कहें। इसने एक skill design किया और shot लिया।

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="OpenClaw द्वारा capture किया गया roof camera sky snapshot" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

एक scheduled prompt हर सुबह OpenClaw persona के जरिए एक scene image generate करता है (weather, tasks, date, favorite post या quote)।
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic availability checker और booking CLI। फिर कभी open court miss न करें।

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

email से PDFs collect करता है, tax consultant के लिए documents तैयार करता है। Monthly accounting autopilot पर।
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Netflix देखते हुए Telegram के जरिए पूरी personal site rebuild की — Notion से Astro, 18 posts migrate किए, DNS Cloudflare पर। laptop कभी नहीं खोला।
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

job listings search करता है, CV keywords से match करता है, और links के साथ relevant opportunities return करता है। JSearch API का उपयोग करके 30 मिनट में बनाया गया।
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw Jira से connected हुआ, फिर तुरंत एक नया skill generate किया (ClawHub पर मौजूद होने से पहले)।
</Card>

<Card title="Telegram के जरिए Todoist skill" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Todoist tasks automate किए और OpenClaw से सीधे Telegram chat में skill generate करवाया।
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

browser automation के जरिए TradingView में log in करता है, charts के screenshots लेता है, और मांग पर technical analysis करता है। API की जरूरत नहीं — सिर्फ browser control।
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

company Slack channel को watch करता है, सहायक जवाब देता है, और notifications Telegram पर forward करता है। बिना पूछे deployed app में production bug को autonomously fix किया।
</Card>

</CardGroup>

## ज्ञान और मेमरी

वे systems जो personal या team knowledge को index, search, remember, और reason करते हैं।

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

OpenClaw के जरिए pronunciation feedback और study flows वाला Chinese learning engine।

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **Community** • `memory` `transcription` `indexing`

पूरा WhatsApp exports ingest करता है, 1k+ voice notes transcribe करता है, git logs से cross-check करता है, linked markdown reports output करता है।
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Qdrant और OpenAI या Ollama embeddings का उपयोग करके Karakeep bookmarks में vector search जोड़ता है।
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

अलग memory manager जो session files को memories, फिर beliefs, और फिर evolving self model में बदलता है।
</Card>

</CardGroup>

## वॉयस और फोन

Speech-first entry points, phone bridges, और transcription-heavy workflows।

<CardGroup cols={2}>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi voice assistant से OpenClaw HTTP bridge। आपके agent के साथ near real-time phone calls।
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter (Gemini, और अधिक) के जरिए multi-lingual audio transcription। ClawHub पर उपलब्ध।

  <img src="/assets/showcase/openrouter-transcribe.png" alt="ClawHub पर OpenRouter transcription skill" />
</Card>

</CardGroup>

## इन्फ्रास्ट्रक्चर और deployment

Packaging, deployment, और integrations जो OpenClaw को run और extend करना आसान बनाते हैं।

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

SSH tunnel support और persistent state के साथ Home Assistant OS पर चलता OpenClaw gateway।
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

प्राकृतिक भाषा के माध्यम से Home Assistant डिवाइसों को नियंत्रित और स्वचालित करें।

  <img src="/assets/showcase/homeassistant.png" alt="ClawHub पर Home Assistant skill" />
</Card>

<Card title="Nix पैकेजिंग" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

दोहराए जा सकने वाले डिप्लॉयमेंट के लिए बैटरियां-शामिल nixified OpenClaw कॉन्फ़िगरेशन।
</Card>

<Card title="CalDAV कैलेंडर" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

khal और vdirsyncer का उपयोग करने वाला कैलेंडर skill। स्व-होस्टेड कैलेंडर इंटीग्रेशन।

  <img src="/assets/showcase/caldav-calendar.png" alt="ClawHub पर CalDAV कैलेंडर skill" />
</Card>

</CardGroup>

## घर और हार्डवेयर

OpenClaw का भौतिक दुनिया वाला पक्ष: घर, सेंसर, कैमरे, वैक्यूम और अन्य डिवाइस।

<CardGroup cols={2}>

<Card title="GoHome ऑटोमेशन" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

इंटरफ़ेस के रूप में OpenClaw के साथ Nix-नेटिव होम ऑटोमेशन, साथ में Grafana डैशबोर्ड।

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana डैशबोर्ड" />
</Card>

<Card title="Roborock वैक्यूम" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

प्राकृतिक बातचीत के माध्यम से अपने Roborock रोबोट वैक्यूम को नियंत्रित करें।

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock स्थिति" />
</Card>

</CardGroup>

## समुदाय परियोजनाएँ

ऐसी चीज़ें जो एकल वर्कफ़्लो से आगे बढ़कर व्यापक उत्पादों या इकोसिस्टम में बदल गईं।

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **समुदाय** • `marketplace` `astronomy` `webapp`

पूर्ण खगोल विज्ञान गियर marketplace। OpenClaw इकोसिस्टम के साथ और उसके आसपास निर्मित।
</Card>

</CardGroup>

## अपना प्रोजेक्ट सबमिट करें

<Steps>
  <Step title="इसे साझा करें">
    [Discord पर #self-promotion](https://discord.gg/clawd) में पोस्ट करें या [@openclaw को ट्वीट करें](https://x.com/openclaw)।
  </Step>
  <Step title="विवरण शामिल करें">
    हमें बताएं कि यह क्या करता है, repo या डेमो का लिंक दें, और अगर आपके पास स्क्रीनशॉट हो तो साझा करें।
  </Step>
  <Step title="फ़ीचर करवाएँ">
    हम उत्कृष्ट प्रोजेक्ट इस पेज में जोड़ेंगे।
  </Step>
</Steps>

## संबंधित

- [शुरू करना](/hi/start/getting-started)
- [OpenClaw](/hi/start/openclaw)
