---
description: Real-world OpenClaw projects from the community
read_when:
- Looking for real OpenClaw usage examples
- การอัปเดตไฮไลต์โปรเจกต์ของชุมชน
summary: โปรเจกต์และการเชื่อมต่อที่สร้างโดยชุมชนซึ่งขับเคลื่อนด้วย OpenClaw
title: ผลงานเด่น
x-i18n:
  generated_at: '2026-04-24T09:34:09Z'
  model: gpt-5.4
  provider: openai
  source_hash: db901336bb0814eae93453331a58aa267024afeb53f259f5e2a4d71df1039ad2
  source_path: start/showcase.md
  workflow: 15
---

โปรเจกต์ OpenClaw ไม่ใช่เดโมของเล่น ผู้คนกำลังใช้งานจริงกับลูปรีวิว PR, แอปมือถือ, ระบบอัตโนมัติในบ้าน, ระบบเสียง, devtools และเวิร์กโฟลว์ที่ใช้ memory หนักจากช่องทางที่พวกเขาใช้อยู่แล้ว — การพัฒนาแบบแชตบน Telegram, WhatsApp, Discord และเทอร์มินัล; ระบบอัตโนมัติจริงสำหรับการจอง การช้อปปิ้ง และการสนับสนุนโดยไม่ต้องรอ API; และการเชื่อมต่อกับโลกจริงผ่านเครื่องพิมพ์ หุ่นดูดฝุ่น กล้อง และระบบภายในบ้าน

<Info>
**อยากให้โปรเจกต์ของคุณได้รับการนำเสนอหรือไม่?** แชร์โปรเจกต์ของคุณใน [#self-promotion บน Discord](https://discord.gg/clawd) หรือ [แท็ก @openclaw บน X](https://x.com/openclaw)
</Info>

## วิดีโอ

เริ่มจากตรงนี้หากคุณต้องการเส้นทางที่สั้นที่สุดจาก “นี่คืออะไร?” ไปสู่ “โอเค เข้าใจแล้ว”

<CardGroup cols={3}>

<Card title="คู่มือการตั้งค่าแบบเต็ม" href="https://www.youtube.com/watch?v=SaWSPZoPX34">
  VelvetShark, 28 นาที ติดตั้ง ทำ onboarding และไปจนถึงผู้ช่วยตัวแรกที่ใช้งานได้จริงแบบครบวงจร
</Card>

<Card title="วิดีโอรวมผลงานเด่นของชุมชน" href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">
  ภาพรวมแบบรวดเร็วของโปรเจกต์จริง พื้นผิว และเวิร์กโฟลว์ที่สร้างขึ้นรอบ ๆ OpenClaw
</Card>

<Card title="โปรเจกต์ที่ใช้งานจริงในโลกภายนอก" href="https://www.youtube.com/watch?v=5kkIJNUGFho">
  ตัวอย่างจากชุมชน ตั้งแต่ลูปการเขียนโค้ดแบบแชต ไปจนถึงฮาร์ดแวร์และระบบอัตโนมัติส่วนบุคคล
</Card>

</CardGroup>

## สดใหม่จาก Discord

ผลงานเด่นล่าสุดในสายการเขียนโค้ด devtools มือถือ และการสร้างผลิตภัณฑ์แบบแชต

<CardGroup cols={2}>

<Card title="รีวิว PR สู่ฟีดแบ็กใน Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode จัดการการเปลี่ยนแปลงจนเสร็จ เปิด PR แล้ว OpenClaw ตรวจสอบ diff และตอบกลับใน Telegram พร้อมข้อเสนอแนะและคำตัดสินการ merge ที่ชัดเจน

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="ฟีดแบ็กการรีวิว PR ของ OpenClaw ที่ส่งใน Telegram" />
</Card>

<Card title="Skill จัดการห้องเก็บไวน์ในไม่กี่นาที" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

ขอให้ “Robby” (@openclaw) สร้าง skill สำหรับห้องเก็บไวน์แบบ local ระบบจะขอไฟล์ส่งออก CSV ตัวอย่างและพาธสำหรับเก็บ จากนั้นสร้างและทดสอบ skill (ตัวอย่างมี 962 ขวด)

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw สร้าง skill ห้องเก็บไวน์แบบ local จาก CSV" />
</Card>

<Card title="ระบบซื้อของ Tesco แบบอัตโนมัติ" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

วางแผนมื้ออาหารประจำสัปดาห์ รายการประจำ จองช่วงเวลาจัดส่ง ยืนยันคำสั่งซื้อ ไม่มี API ใช้แค่การควบคุมเบราว์เซอร์

  <img src="/assets/showcase/tesco-shop.jpg" alt="ระบบอัตโนมัติสำหรับช้อป Tesco ผ่านแชต" />
</Card>

<Card title="SNAG แปลงภาพหน้าจอเป็น Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

กดคีย์ลัดเลือกพื้นที่หน้าจอ ใช้ Gemini vision แล้วได้ Markdown ลงคลิปบอร์ดทันที

  <img src="/assets/showcase/snag.png" alt="เครื่องมือ SNAG แปลงภาพหน้าจอเป็น markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

แอปเดสก์ท็อปสำหรับจัดการ skills และคำสั่งข้าม Agents, Claude, Codex และ OpenClaw

  <img src="/assets/showcase/agents-ui.jpg" alt="แอป Agents UI" />
</Card>

<Card title="ข้อความเสียง Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **ชุมชน** • `voice` `tts` `telegram`

ห่อ TTS ของ papla.media และส่งผลลัพธ์เป็นข้อความเสียงใน Telegram (ไม่มีเล่นอัตโนมัติที่น่ารำคาญ)

  <img src="/assets/showcase/papla-tts.jpg" alt="เอาต์พุตข้อความเสียง Telegram จาก TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

ตัวช่วยที่ติดตั้งผ่าน Homebrew เพื่อแสดงรายการ ตรวจสอบ และเฝ้าดูเซสชัน OpenAI Codex ในเครื่อง (CLI + VS Code)

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor บน ClawHub" />
</Card>

<Card title="ควบคุมเครื่องพิมพ์ 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

ควบคุมและแก้ไขปัญหาเครื่องพิมพ์ BambuLab: สถานะ งาน กล้อง AMS การปรับเทียบ และอื่น ๆ

  <img src="/assets/showcase/bambu-cli.png" alt="skill Bambu CLI บน ClawHub" />
</Card>

<Card title="ขนส่งสาธารณะเวียนนา (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

เวลาออกเดินทางแบบเรียลไทม์ เหตุขัดข้อง สถานะลิฟต์ และการวางเส้นทางสำหรับขนส่งสาธารณะในเวียนนา

  <img src="/assets/showcase/wienerlinien.png" alt="skill Wiener Linien" />
</Card>

<Card title="อาหารโรงเรียน ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ระบบจองอาหารโรงเรียนในสหราชอาณาจักรผ่าน ParentPay แบบอัตโนมัติ ใช้พิกัดเมาส์เพื่อคลิกเซลล์ตารางได้อย่างเชื่อถือได้
</Card>

<Card title="อัปโหลดไปยัง R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

อัปโหลดไปยัง Cloudflare R2/S3 และสร้างลิงก์ดาวน์โหลด presigned ที่ปลอดภัย มีประโยชน์สำหรับอินสแตนซ์ OpenClaw ระยะไกล
</Card>

<Card title="แอป iOS ผ่าน Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

สร้างแอป iOS แบบสมบูรณ์พร้อมแผนที่และการบันทึกเสียง และ deploy ไปยัง TestFlight ทั้งหมดผ่านแชต Telegram

  <img src="/assets/showcase/ios-testflight.jpg" alt="แอป iOS บน TestFlight" />
</Card>

<Card title="ผู้ช่วยสุขภาพ Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

ผู้ช่วยสุขภาพ AI ส่วนบุคคลที่ผสานข้อมูล Oura ring กับปฏิทิน การนัดหมาย และตารางฟิตเนส

  <img src="/assets/showcase/oura-health.png" alt="ผู้ช่วยสุขภาพ Oura ring" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

14+ agents ภายใต้ gateway เดียว โดยมีตัว orchestration ด้วย Opus 4.5 คอยมอบหมายงานให้ Codex workers ดู [บทความเชิงเทคนิค](https://github.com/adam91holt/orchestrated-ai-articles) และ [Clawdspace](https://github.com/adam91holt/clawdspace) สำหรับการ sandbox agents
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI สำหรับ Linear ที่ผสานกับเวิร์กโฟลว์แบบ agentic (Claude Code, OpenClaw) จัดการ issues, projects และ workflows จากเทอร์มินัล
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

อ่าน ส่ง และเก็บข้อความผ่าน Beeper Desktop ใช้ Beeper local MCP API เพื่อให้ agents จัดการแชตทั้งหมดของคุณได้ (iMessage, WhatsApp และอื่น ๆ) ในที่เดียว
</Card>

</CardGroup>

## ระบบอัตโนมัติและเวิร์กโฟลว์

การตั้งเวลา การควบคุมเบราว์เซอร์ ลูปงานสนับสนุน และด้าน “ทำงานนี้ให้ฉันเลย” ของผลิตภัณฑ์

<CardGroup cols={2}>

<Card title="ควบคุมเครื่องฟอกอากาศ Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code ค้นพบและยืนยันการควบคุมเครื่องฟอกอากาศ แล้ว OpenClaw ก็รับช่วงต่อเพื่อจัดการคุณภาพอากาศในห้อง

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="การควบคุมเครื่องฟอกอากาศ Winix ผ่าน OpenClaw" />
</Card>

<Card title="ภาพท้องฟ้าสวย ๆ จากกล้อง" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

ถูกทริกเกอร์จากกล้องบนหลังคา: ให้ OpenClaw ถ่ายภาพท้องฟ้าเมื่อมันดูสวย ระบบออกแบบ skill และถ่ายภาพให้

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="ภาพท้องฟ้าจากกล้องบนหลังคาที่ OpenClaw ถ่ายไว้" />
</Card>

<Card title="ฉากสรุปตอนเช้าแบบภาพ" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

พรอมป์ที่ตั้งเวลาไว้จะสร้างภาพฉากหนึ่งทุกเช้า (สภาพอากาศ งาน วันที่ โพสต์หรือคำคมโปรด) ผ่าน persona ของ OpenClaw
</Card>

<Card title="การจองสนามพาเดล" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

ตัวตรวจสอบเวลาว่างของ Playtomic พร้อม CLI สำหรับจอง จะไม่พลาดสนามว่างอีกต่อไป

  <img src="/assets/showcase/padel-screenshot.jpg" alt="ภาพหน้าจอ padel-cli" />
</Card>

<Card title="ระบบรับเอกสารบัญชี" icon="file-invoice-dollar">
  **ชุมชน** • `automation` `email` `pdf`

รวบรวม PDFs จากอีเมล เตรียมเอกสารสำหรับที่ปรึกษาด้านภาษี งานบัญชีรายเดือนแบบอัตโนมัติ
</Card>

<Card title="โหมดนักพัฒนาสายโซฟา" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

สร้างเว็บไซต์ส่วนตัวใหม่ทั้งเว็บผ่าน Telegram ขณะดู Netflix — ย้ายจาก Notion ไป Astro ย้าย 18 โพสต์ เปลี่ยน DNS ไป Cloudflare โดยไม่เคยเปิดแล็ปท็อปเลย
</Card>

<Card title="agent ค้นหางาน" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

ค้นหาประกาศงาน จับคู่กับคีย์เวิร์ดใน CV และส่งโอกาสที่เกี่ยวข้องพร้อมลิงก์ สร้างเสร็จใน 30 นาทีด้วย JSearch API
</Card>

<Card title="ตัวสร้าง skill สำหรับ Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw เชื่อมต่อกับ Jira แล้วสร้าง skill ใหม่ขึ้นมาทันที (ก่อนที่มันจะมีบน ClawHub)
</Card>

<Card title="skill Todoist ผ่าน Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

ทำงานกับ Todoist tasks แบบอัตโนมัติ และให้ OpenClaw สร้าง skill โดยตรงในแชต Telegram
</Card>

<Card title="การวิเคราะห์ TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

ล็อกอินเข้า TradingView ผ่านระบบอัตโนมัติของเบราว์เซอร์ จับภาพกราฟ และวิเคราะห์ทางเทคนิคตามต้องการ ไม่ต้องมี API — ใช้เพียงการควบคุมเบราว์เซอร์
</Card>

<Card title="ระบบช่วยตอบใน Slack อัตโนมัติ" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

เฝ้าดูช่อง Slack ของบริษัท ตอบกลับอย่างเป็นประโยชน์ และส่งต่อการแจ้งเตือนไปยัง Telegram แก้บั๊ก production ในแอปที่ deploy แล้วได้เองโดยไม่มีใครสั่ง
</Card>

</CardGroup>

## ความรู้และ memory

ระบบที่ทำดัชนี ค้นหา จดจำ และให้เหตุผลบนฐานความรู้ส่วนบุคคลหรือของทีม

<CardGroup cols={2}>

<Card title="xuezh เรียนภาษาจีน" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

เอนจินเรียนภาษาจีนพร้อมฟีดแบ็กการออกเสียงและโฟลว์การเรียนผ่าน OpenClaw

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="ฟีดแบ็กการออกเสียงของ xuezh" />
</Card>

<Card title="ห้องนิรภัย memory บน WhatsApp" icon="vault">
  **ชุมชน** • `memory` `transcription` `indexing`

นำเข้า exports ของ WhatsApp ทั้งหมด ถอดเสียง voice notes กว่า 1k รายการ ตรวจสอบไขว้กับ git logs และสร้างรายงาน markdown แบบเชื่อมโยง
</Card>

<Card title="การค้นหาเชิงความหมายใน Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

เพิ่มการค้นหาแบบ vector ให้กับบุ๊กมาร์ก Karakeep โดยใช้ Qdrant ร่วมกับ embeddings จาก OpenAI หรือ Ollama
</Card>

<Card title="memory แบบ Inside-Out-2" icon="brain">
  **ชุมชน** • `memory` `beliefs` `self-model`

ตัวจัดการ memory แยกต่างหากที่เปลี่ยนไฟล์ session ให้กลายเป็น memories จากนั้นเป็น beliefs แล้วพัฒนาไปเป็น self model ที่เปลี่ยนแปลงได้
</Card>

</CardGroup>

## เสียงและโทรศัพท์

จุดเริ่มต้นแบบ speech-first สะพานเชื่อมโทรศัพท์ และเวิร์กโฟลว์ที่เน้นการถอดเสียง

<CardGroup cols={2}>

<Card title="สะพานเชื่อมโทรศัพท์ Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

สะพานเชื่อม Vapi voice assistant กับ OpenClaw HTTP โทรศัพท์แบบเกือบเรียลไทม์กับ agent ของคุณ
</Card>

<Card title="การถอดเสียงผ่าน OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

การถอดเสียงหลายภาษาผ่าน OpenRouter (Gemini และอื่น ๆ) พร้อมใช้งานบน ClawHub
</Card>

</CardGroup>

## โครงสร้างพื้นฐานและการ deploy

การแพ็กเกจ การ deploy และการเชื่อมต่อที่ช่วยให้ OpenClaw รันและขยายได้ง่ายขึ้น

<CardGroup cols={2}>

<Card title="ส่วนเสริม Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw gateway ที่ทำงานบน Home Assistant OS พร้อมรองรับ SSH tunnel และสถานะถาวร
</Card>

<Card title="skill สำหรับ Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

ควบคุมและทำงานอัตโนมัติให้กับอุปกรณ์ Home Assistant ด้วยภาษาธรรมชาติ
</Card>

<Card title="การแพ็กเกจด้วย Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

การตั้งค่า OpenClaw แบบ nixified ที่มาพร้อมทุกอย่างสำหรับการ deploy ที่ทำซ้ำได้
</Card>

<Card title="ปฏิทิน CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

skill ปฏิทินที่ใช้ khal และ vdirsyncer การเชื่อมต่อปฏิทินแบบ self-hosted
</Card>

</CardGroup>

## บ้านและฮาร์ดแวร์

ด้านกายภาพของ OpenClaw: บ้าน เซ็นเซอร์ กล้อง หุ่นดูดฝุ่น และอุปกรณ์อื่น ๆ

<CardGroup cols={2}>

<Card title="ระบบอัตโนมัติ GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

ระบบอัตโนมัติในบ้านแบบ native สำหรับ Nix โดยใช้ OpenClaw เป็นอินเทอร์เฟซ พร้อมแดชบอร์ด Grafana

  <img src="/assets/showcase/gohome-grafana.png" alt="แดชบอร์ด GoHome Grafana" />
</Card>

<Card title="หุ่นดูดฝุ่น Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

ควบคุมหุ่นดูดฝุ่น Roborock ของคุณผ่านการสนทนาแบบธรรมชาติ

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="สถานะ Roborock" />
</Card>

</CardGroup>

## โปรเจกต์ชุมชน

สิ่งที่เติบโตเกินกว่าการเป็นเวิร์กโฟลว์เดียว จนกลายเป็นผลิตภัณฑ์หรือระบบนิเวศที่กว้างขึ้น

<CardGroup cols={2}>

<Card title="ตลาดซื้อขาย StarSwap" icon="star" href="https://star-swap.com/">
  **ชุมชน** • `marketplace` `astronomy` `webapp`

ตลาดซื้อขายอุปกรณ์ดาราศาสตร์แบบเต็มรูปแบบ สร้างด้วยและรอบ ๆ ระบบนิเวศของ OpenClaw
</Card>

</CardGroup>

## ส่งโปรเจกต์ของคุณ

<Steps>
  <Step title="แชร์โปรเจกต์">
    โพสต์ใน [#self-promotion บน Discord](https://discord.gg/clawd) หรือ [ทวีตถึง @openclaw](https://x.com/openclaw)
  </Step>
  <Step title="ใส่รายละเอียด">
    บอกเราว่ามันทำอะไร ลิงก์ไปยัง repo หรือเดโม และแชร์ภาพหน้าจอถ้าคุณมี
  </Step>
  <Step title="รับการนำเสนอ">
    เราจะเพิ่มโปรเจกต์ที่โดดเด่นลงในหน้านี้
  </Step>
</Steps>

## ที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [OpenClaw](/th/start/openclaw)
