---
description: Real-world OpenClaw projects from the community
read_when:
    - กำลังมองหาตัวอย่างการใช้งาน OpenClaw จริง
    - การอัปเดตไฮไลต์โครงการชุมชน
summary: โปรเจกต์และการผสานการทำงานที่ชุมชนสร้างขึ้นและขับเคลื่อนโดย OpenClaw
title: ตัวอย่างผลงาน
x-i18n:
    generated_at: "2026-06-27T18:24:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 999f89403c1d022e795c0017e5aa7543a4a021ba98cf601b37ce2835136a86a1
    source_path: start/showcase.md
    workflow: 16
---

OpenClaw project ไม่ใช่เดโมของเล่น ผู้คนกำลังส่งมอบลูปรีวิว PR, แอปมือถือ, ระบบอัตโนมัติในบ้าน, ระบบเสียง, devtools และเวิร์กโฟลว์ที่ใช้หน่วยความจำหนักจากช่องทางที่พวกเขาใช้อยู่แล้ว — การบิลด์แบบเนทีฟบนแชตบน Telegram, WhatsApp, Discord และเทอร์มินัล; ระบบอัตโนมัติจริงสำหรับการจอง การช็อปปิง และซัพพอร์ตโดยไม่ต้องรอ API; และการเชื่อมต่อกับโลกจริงผ่านเครื่องพิมพ์ เครื่องดูดฝุ่น กล้อง และระบบภายในบ้าน

<Info>
**อยากให้โปรเจกต์ของคุณได้รับการนำเสนอไหม?** แชร์โปรเจกต์ของคุณใน [#self-promotion บน Discord](https://discord.gg/clawd) หรือ [แท็ก @openclaw บน X](https://x.com/openclaw)
</Info>

## สดใหม่จาก Discord

ผลงานเด่นล่าสุดจากการเขียนโค้ด, devtools, มือถือ และการสร้างผลิตภัณฑ์แบบเนทีฟบนแชต

<CardGroup cols={2}>

<Card title="รีวิว PR เป็นฟีดแบ็กบน Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode ทำการเปลี่ยนแปลงเสร็จ เปิด PR จากนั้น OpenClaw รีวิว diff และตอบกลับใน Telegram พร้อมข้อเสนอแนะและคำตัดสินการ merge ที่ชัดเจน

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="ฟีดแบ็กรีวิว PR ของ OpenClaw ที่ส่งใน Telegram" />
</Card>

<Card title="Skills ห้องเก็บไวน์ในไม่กี่นาที" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

ขอให้ "Robby" (@openclaw) สร้าง Skills ห้องเก็บไวน์แบบ local โดยจะขอตัวอย่างการ export CSV และพาธจัดเก็บ จากนั้นสร้างและทดสอบ Skills นั้น (ตัวอย่างมีไวน์ 962 ขวด)

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw กำลังสร้าง Skills ห้องเก็บไวน์แบบ local จาก CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

แผนมื้ออาหารรายสัปดาห์ รายการที่ซื้อประจำ จองช่วงเวลาจัดส่ง ยืนยันคำสั่งซื้อ ไม่มี API มีแค่การควบคุมเบราว์เซอร์

  <img src="/assets/showcase/tesco-shop.jpg" alt="ระบบอัตโนมัติสำหรับช็อป Tesco ผ่านแชต" />
</Card>

<Card title="SNAG จากสกรีนช็อตเป็น Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

กดฮอตคีย์เลือกพื้นที่หน้าจอ ใช้ Gemini vision แล้วได้ Markdown ทันทีในคลิปบอร์ด

  <img src="/assets/showcase/snag.png" alt="เครื่องมือ SNAG จากสกรีนช็อตเป็น markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

แอปเดสก์ท็อปสำหรับจัดการ Skills และคำสั่งใน Agents, Claude, Codex และ OpenClaw

  <img src="/assets/showcase/agents-ui.jpg" alt="แอป Agents UI" />
</Card>

<Card title="บันทึกเสียง Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

ห่อหุ้ม TTS ของ papla.media และส่งผลลัพธ์เป็นบันทึกเสียง Telegram (ไม่มี autoplay ที่น่ารำคาญ)

  <img src="/assets/showcase/papla-tts.jpg" alt="ผลลัพธ์บันทึกเสียง Telegram จาก TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

ตัวช่วยที่ติดตั้งผ่าน Homebrew สำหรับแสดงรายการ ตรวจสอบ และเฝ้าดูเซสชัน OpenAI Codex แบบ local (CLI + VS Code)

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor บน ClawHub" />
</Card>

<Card title="การควบคุมเครื่องพิมพ์ Bambu 3D" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

ควบคุมและแก้ปัญหาเครื่องพิมพ์ BambuLab: สถานะ งาน กล้อง AMS การปรับเทียบ และอื่น ๆ

  <img src="/assets/showcase/bambu-cli.png" alt="Skills Bambu CLI บน ClawHub" />
</Card>

<Card title="การขนส่งเวียนนา (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

เวลาออกเดินทางแบบเรียลไทม์ เหตุขัดข้อง สถานะลิฟต์ และการวางเส้นทางสำหรับขนส่งสาธารณะของเวียนนา

  <img src="/assets/showcase/wienerlinien.png" alt="Skills Wiener Linien บน ClawHub" />
</Card>

<Card title="อาหารโรงเรียน ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

การจองอาหารโรงเรียนในสหราชอาณาจักรแบบอัตโนมัติผ่าน ParentPay ใช้พิกัดเมาส์เพื่อคลิกเซลล์ตารางได้อย่างเชื่อถือได้
</Card>

<Card title="อัปโหลด R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

อัปโหลดไปยัง Cloudflare R2/S3 และสร้างลิงก์ดาวน์โหลดแบบ presigned ที่ปลอดภัย มีประโยชน์สำหรับอินสแตนซ์ OpenClaw ระยะไกล

  <img src="/assets/showcase/r2-upload.png" alt="Skills อัปโหลด R2 บน ClawHub" />
</Card>

<Card title="แอป iOS ผ่าน Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

สร้างแอป iOS ที่สมบูรณ์พร้อมแผนที่และการบันทึกเสียง แล้ว deploy ไปยัง TestFlight ทั้งหมดผ่านแชต Telegram

  <img src="/assets/showcase/ios-testflight.jpg" alt="แอป iOS บน TestFlight" />
</Card>

<Card title="ผู้ช่วยสุขภาพ Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

ผู้ช่วยสุขภาพ AI ส่วนตัวที่ผสานข้อมูลจาก Oura ring เข้ากับปฏิทิน นัดหมาย และตารางยิม

  <img src="/assets/showcase/oura-health.png" alt="ผู้ช่วยสุขภาพ Oura ring" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

agents 14+ ตัวภายใต้ Gateway เดียว โดยมีตัว orchestrator Opus 4.5 มอบหมายงานให้ Codex workers ดู [บทความเชิงเทคนิค](https://github.com/adam91holt/orchestrated-ai-articles) และ [Clawdspace](https://github.com/adam91holt/clawdspace) สำหรับการ sandbox agents
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI สำหรับ Linear ที่ผสานกับเวิร์กโฟลว์แบบ agentic (Claude Code, OpenClaw) จัดการ issues, projects และ workflows จากเทอร์มินัล
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

อ่าน ส่ง และเก็บถาวรข้อความผ่าน Beeper Desktop ใช้ Beeper local MCP API เพื่อให้ agents จัดการแชตทั้งหมดของคุณ (iMessage, WhatsApp และอื่น ๆ) ได้ในที่เดียว
</Card>

</CardGroup>

## ระบบอัตโนมัติและเวิร์กโฟลว์

การจัดตารางเวลา การควบคุมเบราว์เซอร์ ลูปซัพพอร์ต และด้าน "ทำงานนั้นให้ฉันเลย" ของผลิตภัณฑ์

<CardGroup cols={2}>

<Card title="การควบคุมเครื่องฟอกอากาศ Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code ค้นพบและยืนยันการควบคุมเครื่องฟอกอากาศ จากนั้น OpenClaw เข้ามารับช่วงจัดการคุณภาพอากาศในห้อง

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="การควบคุมเครื่องฟอกอากาศ Winix ผ่าน OpenClaw" />
</Card>

<Card title="ภาพถ่ายท้องฟ้าสวยจากกล้อง" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

ถูก trigger โดยกล้องบนหลังคา: ขอให้ OpenClaw ถ่ายภาพท้องฟ้าเมื่อใดก็ตามที่ดูสวย มันออกแบบ Skills และถ่ายภาพให้

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="ภาพท้องฟ้าจากกล้องบนหลังคาที่ OpenClaw จับภาพไว้" />
</Card>

<Card title="ฉากสรุปยามเช้าแบบภาพ" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

พรอมต์ตามกำหนดเวลาสร้างภาพฉากหนึ่งภาพทุกเช้า (อากาศ งาน วันที่ โพสต์หรือคำคมโปรด) ผ่าน persona ของ OpenClaw
</Card>

<Card title="การจองสนามพาเดล" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

ตัวตรวจสอบเวลาว่างของ Playtomic พร้อม CLI สำหรับจอง ไม่พลาดสนามว่างอีกต่อไป

  <img src="/assets/showcase/padel-screenshot.jpg" alt="สกรีนช็อต padel-cli" />
</Card>

<Card title="รับเอกสารบัญชี" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

รวบรวม PDF จากอีเมล เตรียมเอกสารให้ที่ปรึกษาภาษี งานบัญชีรายเดือนแบบ autopilot
</Card>

<Card title="โหมดนักพัฒนาบนโซฟา" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

สร้างเว็บไซต์ส่วนตัวทั้งเว็บใหม่ผ่าน Telegram ระหว่างดู Netflix — จาก Notion ไป Astro, ย้ายโพสต์ 18 รายการ, DNS ไป Cloudflare ไม่เคยเปิดแล็ปท็อปเลย
</Card>

<Card title="agent ค้นหางาน" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

ค้นหาประกาศงาน เทียบกับคีย์เวิร์ดใน CV และส่งคืนโอกาสที่เกี่ยวข้องพร้อมลิงก์ สร้างใน 30 นาทีโดยใช้ JSearch API
</Card>

<Card title="ตัวสร้าง Skills สำหรับ Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw เชื่อมต่อกับ Jira แล้วสร้าง Skills ใหม่ทันที (ก่อนที่จะมีอยู่บน ClawHub)
</Card>

<Card title="Skills Todoist ผ่าน Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

ทำให้งาน Todoist เป็นอัตโนมัติและให้ OpenClaw สร้าง Skills โดยตรงในแชต Telegram
</Card>

<Card title="การวิเคราะห์ TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

เข้าสู่ระบบ TradingView ผ่านระบบอัตโนมัติของเบราว์เซอร์ ถ่ายสกรีนช็อตกราฟ และทำการวิเคราะห์ทางเทคนิคตามคำขอ ไม่ต้องใช้ API — มีแค่การควบคุมเบราว์เซอร์
</Card>

<Card title="ซัพพอร์ตอัตโนมัติบน Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

เฝ้าดูช่อง Slack ของบริษัท ตอบกลับอย่างเป็นประโยชน์ และส่งต่อการแจ้งเตือนไปยัง Telegram แก้บั๊ก production ในแอปที่ deploy แล้วได้เองโดยไม่ต้องมีใครขอ
</Card>

</CardGroup>

## ความรู้และหน่วยความจำ

ระบบที่จัดทำดัชนี ค้นหา จดจำ และให้เหตุผลบนความรู้ส่วนตัวหรือของทีม

<CardGroup cols={2}>

<Card title="การเรียนภาษาจีน xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

เอนจินเรียนภาษาจีนพร้อมฟีดแบ็กการออกเสียงและโฟลว์การเรียนผ่าน OpenClaw

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="ฟีดแบ็กการออกเสียง xuezh" />
</Card>

<Card title="คลังหน่วยความจำ WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

นำเข้า export WhatsApp ทั้งหมด ถอดเสียงบันทึกเสียง 1k+ รายการ ตรวจเทียบกับ git logs และส่งออกรายงาน markdown ที่เชื่อมโยงกัน
</Card>

<Card title="การค้นหาเชิง semantic ของ Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

เพิ่ม vector search ให้บุ๊กมาร์ก Karakeep โดยใช้ Qdrant พร้อม embeddings จาก OpenAI หรือ Ollama
</Card>

<Card title="หน่วยความจำ Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

ตัวจัดการหน่วยความจำแยกต่างหากที่เปลี่ยนไฟล์เซสชันเป็น memories จากนั้นเป็น beliefs แล้วต่อด้วย self model ที่พัฒนาไปเรื่อย ๆ
</Card>

</CardGroup>

## เสียงและโทรศัพท์

จุดเข้าใช้งานที่เน้นเสียงเป็นหลัก phone bridges และเวิร์กโฟลว์ที่ใช้การถอดเสียงจำนวนมาก

<CardGroup cols={2}>

<Card title="phone bridge Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi voice assistant ไปยัง OpenClaw HTTP bridge โทรศัพท์แบบใกล้เรียลไทม์กับ agent ของคุณ
</Card>

<Card title="การถอดเสียง OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

การถอดเสียงหลายภาษาผ่าน OpenRouter (Gemini และอื่น ๆ) พร้อมใช้งานบน ClawHub

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skills การถอดเสียง OpenRouter บน ClawHub" />
</Card>

</CardGroup>

## โครงสร้างพื้นฐานและการ deploy

การแพ็กเกจ การ deploy และการเชื่อมต่อที่ทำให้ OpenClaw รันและขยายได้ง่ายขึ้น

<CardGroup cols={2}>

<Card title="ส่วนเสริม Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw gateway ที่ทำงานบน Home Assistant OS พร้อมการรองรับ SSH tunnel และสถานะถาวร
</Card>

<Card title="สกิล Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

ควบคุมและทำให้อุปกรณ์ Home Assistant ทำงานอัตโนมัติผ่านภาษาธรรมชาติ

  <img src="/assets/showcase/homeassistant.png" alt="สกิล Home Assistant บน ClawHub" />
</Card>

<Card title="การแพ็กเกจด้วย Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

การกำหนดค่า OpenClaw แบบ nixified ที่มาพร้อมครบสำหรับการปรับใช้ที่ทำซ้ำได้
</Card>

<Card title="ปฏิทิน CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

สกิลปฏิทินที่ใช้ khal และ vdirsyncer การผสานรวมปฏิทินแบบโฮสต์เอง

  <img src="/assets/showcase/caldav-calendar.png" alt="สกิลปฏิทิน CalDAV บน ClawHub" />
</Card>

</CardGroup>

## บ้านและฮาร์ดแวร์

ด้านโลกกายภาพของ OpenClaw: บ้าน เซ็นเซอร์ กล้อง เครื่องดูดฝุ่น และอุปกรณ์อื่นๆ

<CardGroup cols={2}>

<Card title="ระบบอัตโนมัติ GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

ระบบอัตโนมัติภายในบ้านแบบ Nix-native โดยใช้ OpenClaw เป็นอินเทอร์เฟซ พร้อมแดชบอร์ด Grafana

  <img src="/assets/showcase/gohome-grafana.png" alt="แดชบอร์ด GoHome Grafana" />
</Card>

<Card title="เครื่องดูดฝุ่น Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

ควบคุมหุ่นยนต์ดูดฝุ่น Roborock ของคุณผ่านการสนทนาแบบธรรมชาติ

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="สถานะ Roborock" />
</Card>

</CardGroup>

## โปรเจกต์ชุมชน

สิ่งที่เติบโตจากเวิร์กโฟลว์เดียวไปเป็นผลิตภัณฑ์หรือระบบนิเวศที่กว้างขึ้น

<CardGroup cols={2}>

<Card title="ตลาด StarSwap" icon="star" href="https://star-swap.com/">
  **ชุมชน** • `marketplace` `astronomy` `webapp`

ตลาดอุปกรณ์ดาราศาสตร์ครบวงจร สร้างด้วยและรอบระบบนิเวศ OpenClaw
</Card>

</CardGroup>

## ส่งโปรเจกต์ของคุณ

<Steps>
  <Step title="แชร์">
    โพสต์ใน [#self-promotion บน Discord](https://discord.gg/clawd) หรือ [ทวีตถึง @openclaw](https://x.com/openclaw)
  </Step>
  <Step title="ใส่รายละเอียด">
    บอกเราว่ามันทำอะไร ลิงก์ไปยัง repo หรือเดโม และแชร์ภาพหน้าจอถ้าคุณมี
  </Step>
  <Step title="ได้รับการนำเสนอ">
    เราจะเพิ่มโปรเจกต์ที่โดดเด่นลงในหน้านี้
  </Step>
</Steps>

## ที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [OpenClaw](/th/start/openclaw)
