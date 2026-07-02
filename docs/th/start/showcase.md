---
description: Real-world OpenClaw projects from the community
read_when:
    - กำลังมองหาตัวอย่างการใช้งาน OpenClaw จริง
    - กำลังอัปเดตไฮไลต์โครงการของชุมชน
summary: โปรเจกต์และการผสานการทำงานที่ชุมชนสร้างขึ้นและขับเคลื่อนโดย OpenClaw
title: ตัวอย่างผลงาน
x-i18n:
    generated_at: "2026-07-02T09:02:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0530aae85db5414b61c968dcc290178b2b33a540c7f86d556e9bad69cf374fb7
    source_path: start/showcase.md
    workflow: 16
---

โปรเจกต์ OpenClaw ไม่ใช่เดโมของเล่น ผู้คนกำลังส่งมอบลูปรีวิว PR, แอปมือถือ, ระบบอัตโนมัติในบ้าน, ระบบเสียง, เครื่องมือสำหรับนักพัฒนา และเวิร์กโฟลว์ที่ใช้หน่วยความจำหนัก จากช่องทางที่พวกเขาใช้อยู่แล้ว — งานสร้างแบบเนทีฟบนแชตผ่าน Telegram, WhatsApp, Discord และเทอร์มินัล; ระบบอัตโนมัติจริงสำหรับการจอง การช็อปปิง และการซัพพอร์ตโดยไม่ต้องรอ API; รวมถึงการเชื่อมต่อกับโลกจริงอย่างพรินเตอร์ เครื่องดูดฝุ่น กล้อง และระบบในบ้าน

<Info>
**อยากให้โปรเจกต์ของคุณได้รับการนำเสนอไหม?** แชร์โปรเจกต์ของคุณใน [#self-promotion บน Discord](https://discord.gg/clawd) หรือ [แท็ก @openclaw บน X](https://x.com/openclaw)
</Info>

## สดใหม่จาก Discord

ผลงานเด่นล่าสุดในสายงานเขียนโค้ด เครื่องมือสำหรับนักพัฒนา มือถือ และการสร้างผลิตภัณฑ์แบบเนทีฟบนแชต

<CardGroup cols={2}>

<Card title="รีวิว PR เป็นฟีดแบ็กบน Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode ทำการเปลี่ยนแปลงเสร็จ เปิด PR จากนั้น OpenClaw รีวิว diff และตอบกลับใน Telegram พร้อมคำแนะนำและคำตัดสินการ merge ที่ชัดเจน

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="ฟีดแบ็กรีวิว PR ของ OpenClaw ที่ส่งใน Telegram" />
</Card>

<Card title="ทักษะห้องเก็บไวน์ในไม่กี่นาที" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

ขอให้ "Robby" (@openclaw) สร้างทักษะห้องเก็บไวน์แบบ local โดยจะขอไฟล์ส่งออก CSV ตัวอย่างและพาธจัดเก็บ จากนั้นสร้างและทดสอบทักษะนั้น (ตัวอย่างมีไวน์ 962 ขวด)

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw สร้างทักษะห้องเก็บไวน์แบบ local จาก CSV" />
</Card>

<Card title="ระบบนำร่องช็อป Tesco อัตโนมัติ" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

วางแผนมื้ออาหารประจำสัปดาห์ เลือกรายการประจำ จองช่วงเวลาจัดส่ง ยืนยันคำสั่งซื้อ ไม่มี API มีแค่การควบคุมเบราว์เซอร์

  <img src="/assets/showcase/tesco-shop.jpg" alt="ระบบอัตโนมัติสำหรับช็อป Tesco ผ่านแชต" />
</Card>

<Card title="SNAG จากภาพหน้าจอเป็น Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

กดปุ่มลัดเลือกพื้นที่บนหน้าจอ ใช้ Gemini vision แล้วได้ Markdown ทันทีในคลิปบอร์ดของคุณ

  <img src="/assets/showcase/snag.png" alt="เครื่องมือ SNAG จากภาพหน้าจอเป็น Markdown" />
</Card>

<Card title="UI สำหรับเอเจนต์" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

แอปเดสก์ท็อปสำหรับจัดการทักษะและคำสั่งข้าม Agents, Claude, Codex และ OpenClaw

  <img src="/assets/showcase/agents-ui.jpg" alt="แอป Agents UI" />
</Card>

<Card title="บันทึกเสียง Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

ครอบ papla.media TTS และส่งผลลัพธ์เป็นบันทึกเสียง Telegram (ไม่มี autoplay ที่น่ารำคาญ)

  <img src="/assets/showcase/papla-tts.jpg" alt="ผลลัพธ์บันทึกเสียง Telegram จาก TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

ตัวช่วยที่ติดตั้งผ่าน Homebrew สำหรับแสดงรายการ ตรวจสอบ และเฝ้าดูเซสชัน OpenAI Codex แบบ local (CLI + VS Code)

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor บน ClawHub" />
</Card>

<Card title="ควบคุมพรินเตอร์ 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

ควบคุมและแก้ปัญหาพรินเตอร์ BambuLab: สถานะ งาน กล้อง AMS การปรับเทียบ และอื่น ๆ

  <img src="/assets/showcase/bambu-cli.png" alt="ทักษะ Bambu CLI บน ClawHub" />
</Card>

<Card title="ระบบขนส่งเวียนนา (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

เวลาออกเดินทางแบบเรียลไทม์ เหตุขัดข้อง สถานะลิฟต์ และการวางเส้นทางสำหรับระบบขนส่งสาธารณะของเวียนนา

  <img src="/assets/showcase/wienerlinien.png" alt="ทักษะ Wiener Linien บน ClawHub" />
</Card>

<Card title="อาหารโรงเรียน ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

จองอาหารโรงเรียนในสหราชอาณาจักรผ่าน ParentPay แบบอัตโนมัติ ใช้พิกัดเมาส์เพื่อคลิกเซลล์ตารางได้อย่างเชื่อถือได้
</Card>

<Card title="อัปโหลด R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

อัปโหลดไปยัง Cloudflare R2/S3 และสร้างลิงก์ดาวน์โหลด presigned ที่ปลอดภัย มีประโยชน์สำหรับอินสแตนซ์ OpenClaw ระยะไกล

  <img src="/assets/showcase/r2-upload.png" alt="ทักษะอัปโหลด R2 บน ClawHub" />
</Card>

<Card title="แอป iOS ผ่าน Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

สร้างแอป iOS ที่สมบูรณ์พร้อมแผนที่และการบันทึกเสียง เตรียมพร้อมสำหรับการเผยแพร่บน App Store ทั้งหมดผ่านแชต Telegram
</Card>

<Card title="ผู้ช่วยสุขภาพ Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

ผู้ช่วยสุขภาพ AI ส่วนตัวที่รวมข้อมูลแหวน Oura เข้ากับปฏิทิน นัดหมาย และตารางเข้ายิม

  <img src="/assets/showcase/oura-health.png" alt="ผู้ช่วยสุขภาพ Oura ring" />
</Card>

<Card title="Kev's Dream Team (14+ เอเจนต์)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

เอเจนต์ 14+ ตัวภายใต้ Gateway เดียว พร้อมตัว orchestrator Opus 4.5 ที่มอบหมายงานให้ Codex workers ดู [บทความเชิงเทคนิค](https://github.com/adam91holt/orchestrated-ai-articles) และ [Clawdspace](https://github.com/adam91holt/clawdspace) สำหรับการทำแซนด์บ็อกซ์เอเจนต์
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI สำหรับ Linear ที่ผสานกับเวิร์กโฟลว์แบบ agentic (Claude Code, OpenClaw) จัดการ issue โปรเจกต์ และเวิร์กโฟลว์จากเทอร์มินัล
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

อ่าน ส่ง และเก็บถาวรข้อความผ่าน Beeper Desktop ใช้ Beeper local MCP API เพื่อให้เอเจนต์จัดการแชตทั้งหมดของคุณ (iMessage, WhatsApp และอื่น ๆ) ได้ในที่เดียว
</Card>

</CardGroup>

## ระบบอัตโนมัติและเวิร์กโฟลว์

การตั้งเวลา การควบคุมเบราว์เซอร์ ลูปซัพพอร์ต และด้าน "ทำงานนี้ให้ฉันที" ของผลิตภัณฑ์

<CardGroup cols={2}>

<Card title="ควบคุมเครื่องฟอกอากาศ Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code ค้นพบและยืนยันการควบคุมเครื่องฟอกอากาศ จากนั้น OpenClaw รับช่วงต่อเพื่อจัดการคุณภาพอากาศในห้อง

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="ควบคุมเครื่องฟอกอากาศ Winix ผ่าน OpenClaw" />
</Card>

<Card title="ภาพถ่ายท้องฟ้าสวยจากกล้อง" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

ทริกเกอร์จากกล้องบนหลังคา: ขอให้ OpenClaw ถ่ายภาพท้องฟ้าเมื่อใดก็ตามที่ดูสวย มันออกแบบทักษะและถ่ายภาพนั้น

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="สแนปชอตท้องฟ้าจากกล้องบนหลังคาที่ถ่ายโดย OpenClaw" />
</Card>

<Card title="ฉากสรุปข่าวเช้าแบบภาพ" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

พรอมป์ตามกำหนดเวลาสร้างภาพฉากหนึ่งภาพทุกเช้า (สภาพอากาศ งาน วันที่ โพสต์หรือคำคมโปรด) ผ่าน persona ของ OpenClaw
</Card>

<Card title="จองสนามพาเดล" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

ตัวตรวจสอบเวลาว่างของ Playtomic พร้อม CLI สำหรับจอง ไม่พลาดสนามว่างอีกต่อไป

  <img src="/assets/showcase/padel-screenshot.jpg" alt="ภาพหน้าจอ padel-cli" />
</Card>

<Card title="รับเอกสารบัญชี" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

รวบรวม PDF จากอีเมล เตรียมเอกสารสำหรับที่ปรึกษาภาษี งานบัญชีรายเดือนบนระบบอัตโนมัติ
</Card>

<Card title="โหมดนักพัฒนาบนโซฟา" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

สร้างเว็บไซต์ส่วนตัวใหม่ทั้งเว็บผ่าน Telegram ระหว่างดู Netflix — จาก Notion ไป Astro, ย้ายโพสต์ 18 รายการ, DNS ไป Cloudflare ไม่เคยเปิดแล็ปท็อป
</Card>

<Card title="เอเจนต์ค้นหางาน" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

ค้นหารายการงาน เทียบกับคีย์เวิร์ดใน CV และส่งคืนโอกาสที่เกี่ยวข้องพร้อมลิงก์ สร้างใน 30 นาทีโดยใช้ JSearch API
</Card>

<Card title="ตัวสร้างทักษะ Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw เชื่อมต่อกับ Jira แล้วสร้างทักษะใหม่แบบทันที (ก่อนที่จะมีบน ClawHub)
</Card>

<Card title="ทักษะ Todoist ผ่าน Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

ทำงาน Todoist แบบอัตโนมัติและให้ OpenClaw สร้างทักษะโดยตรงในแชต Telegram
</Card>

<Card title="การวิเคราะห์ TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

เข้าสู่ระบบ TradingView ผ่านระบบอัตโนมัติของเบราว์เซอร์ ถ่ายภาพหน้าจอกราฟ และทำการวิเคราะห์ทางเทคนิคตามต้องการ ไม่ต้องใช้ API — แค่ควบคุมเบราว์เซอร์
</Card>

<Card title="ซัพพอร์ตอัตโนมัติบน Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

เฝ้าดูช่อง Slack ของบริษัท ตอบกลับอย่างเป็นประโยชน์ และส่งต่อการแจ้งเตือนไปยัง Telegram แก้บั๊ก production ในแอปที่ deploy แล้วได้เองโดยไม่ต้องมีใครขอ
</Card>

</CardGroup>

## ความรู้และหน่วยความจำ

ระบบที่จัดทำดัชนี ค้นหา จดจำ และให้เหตุผลกับความรู้ส่วนตัวหรือของทีม

<CardGroup cols={2}>

<Card title="การเรียนภาษาจีน xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

เอนจินเรียนภาษาจีนพร้อมฟีดแบ็กการออกเสียงและโฟลว์การเรียนผ่าน OpenClaw

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="ฟีดแบ็กการออกเสียง xuezh" />
</Card>

<Card title="คลังหน่วยความจำ WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

นำเข้าการส่งออก WhatsApp ทั้งหมด ถอดเสียงบันทึกเสียง 1k+ รายการ ตรวจสอบเทียบกับ git logs และส่งออกรายงาน markdown ที่เชื่อมโยงกัน
</Card>

<Card title="การค้นหาเชิงความหมาย Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

เพิ่มการค้นหาแบบเวกเตอร์ให้บุ๊กมาร์ก Karakeep โดยใช้ Qdrant พร้อม embedding จาก OpenAI หรือ Ollama
</Card>

<Card title="หน่วยความจำ Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

ตัวจัดการหน่วยความจำแยกต่างหากที่เปลี่ยนไฟล์เซสชันเป็นความทรงจำ จากนั้นเป็นความเชื่อ แล้วเป็นโมเดลตนเองที่พัฒนาไปเรื่อย ๆ
</Card>

</CardGroup>

## เสียงและโทรศัพท์

จุดเริ่มต้นที่ใช้เสียงเป็นหลัก สะพานเชื่อมโทรศัพท์ และเวิร์กโฟลว์ที่ใช้การถอดเสียงหนัก

<CardGroup cols={2}>

<Card title="สะพานเชื่อมโทรศัพท์ Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

สะพานเชื่อมผู้ช่วยเสียง Vapi ไปยัง OpenClaw HTTP โทรศัพท์กับเอเจนต์ของคุณได้เกือบเรียลไทม์
</Card>

<Card title="การถอดเสียง OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

การถอดเสียงหลายภาษาผ่าน OpenRouter (Gemini และอื่น ๆ) พร้อมใช้งานบน ClawHub

  <img src="/assets/showcase/openrouter-transcribe.png" alt="ทักษะการถอดเสียง OpenRouter บน ClawHub" />
</Card>

</CardGroup>

## โครงสร้างพื้นฐานและการ deploy

การแพ็กเกจ การ deploy และการผสานรวมที่ทำให้ OpenClaw รันและขยายได้ง่ายขึ้น

<CardGroup cols={2}>

<Card title="ส่วนเสริม Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw gateway ที่รันบน Home Assistant OS พร้อมการรองรับ SSH tunnel และสถานะที่คงอยู่
</Card>

<Card title="สกิล Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

ควบคุมและทำให้อุปกรณ์ Home Assistant ทำงานอัตโนมัติผ่านภาษาธรรมชาติ

  <img src="/assets/showcase/homeassistant.png" alt="สกิล Home Assistant บน ClawHub" />
</Card>

<Card title="การจัดแพ็กเกจ Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

การกำหนดค่า OpenClaw แบบ Nix ที่มาพร้อมทุกอย่างสำหรับการปรับใช้ที่ทำซ้ำได้
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

ระบบอัตโนมัติในบ้านที่ใช้ Nix โดยตรง โดยมี OpenClaw เป็นอินเทอร์เฟซ พร้อมแดชบอร์ด Grafana

  <img src="/assets/showcase/gohome-grafana.png" alt="แดชบอร์ด GoHome Grafana" />
</Card>

<Card title="เครื่องดูดฝุ่น Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

ควบคุมหุ่นยนต์ดูดฝุ่น Roborock ของคุณผ่านการสนทนาธรรมชาติ

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="สถานะ Roborock" />
</Card>

</CardGroup>

## โครงการชุมชน

สิ่งที่เติบโตจากเวิร์กโฟลว์เดียวไปเป็นผลิตภัณฑ์หรือระบบนิเวศที่กว้างขึ้น

<CardGroup cols={2}>

<Card title="ตลาด StarSwap" icon="star" href="https://star-swap.com/">
  **ชุมชน** • `marketplace` `astronomy` `webapp`

ตลาดซื้อขายอุปกรณ์ดาราศาสตร์เต็มรูปแบบ สร้างด้วยและอยู่รอบระบบนิเวศ OpenClaw
</Card>

</CardGroup>

## ส่งโครงการของคุณ

<Steps>
  <Step title="แชร์โครงการ">
    โพสต์ใน [#self-promotion บน Discord](https://discord.gg/clawd) หรือ [ทวีตถึง @openclaw](https://x.com/openclaw)
  </Step>
  <Step title="ใส่รายละเอียด">
    บอกเราว่ามันทำอะไร ลิงก์ไปยัง repo หรือเดโม และแชร์ภาพหน้าจอหากคุณมี
  </Step>
  <Step title="ได้แสดงบนหน้า">
    เราจะเพิ่มโครงการที่โดดเด่นลงในหน้านี้
  </Step>
</Steps>

## ที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [OpenClaw](/th/start/openclaw)
