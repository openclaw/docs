---
description: Real-world OpenClaw projects from the community
read_when:
    - กำลังมองหาตัวอย่างการใช้งาน OpenClaw จริง
    - การอัปเดตไฮไลต์โครงการชุมชน
summary: โปรเจกต์และการผสานการทำงานที่ชุมชนสร้างขึ้นโดยใช้ OpenClaw
title: ผลงานตัวอย่าง
x-i18n:
    generated_at: "2026-07-12T16:48:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

โครงการ OpenClaw ที่สร้างโดยชุมชน: วงจรการรีวิว PR, แอปมือถือ, ระบบอัตโนมัติภายในบ้าน, ระบบเสียง, เครื่องมือสำหรับนักพัฒนา และเวิร์กโฟลว์หน่วยความจำ ทั้งหมดสร้างขึ้นโดยมีแชตเป็นศูนย์กลางบน Telegram, WhatsApp, Discord และเทอร์มินัล

<Info>
**ต้องการให้โครงการของคุณได้รับการนำเสนอหรือไม่?** แชร์โครงการของคุณใน [#self-promotion บน Discord](https://discord.gg/clawd) หรือ [แท็ก @openclaw บน X](https://x.com/openclaw)
</Info>

## ผลงานล่าสุดจาก Discord

ผลงานโดดเด่นล่าสุดในด้านการเขียนโค้ด เครื่องมือสำหรับนักพัฒนา อุปกรณ์มือถือ และการสร้างผลิตภัณฑ์ที่มีแชตเป็นศูนย์กลาง

<CardGroup cols={2}>

<Card title="Dropage instant HTML deploy" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

บอกเอเจนต์ของคุณว่า "ปรับใช้ HTML นี้" แล้วรับ URL สาธารณะกลับมาภายในประมาณหนึ่งวินาที หน้าเว็บจะหมดอายุเองหลังจากหนึ่งชั่วโมง — ไม่ต้องมีเซิร์ฟเวอร์ ไม่ต้องกำหนดค่า และไม่ต้องสมัครใช้งาน
</Card>

<Card title="Anti-scam URL checker" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

วาง URL ใดก็ได้แล้วรับผลการตรวจสอบ ใช้โดเมนหลอกลวงมากกว่า 2.5 ล้านโดเมนจากแหล่งข้อมูล 38 แห่ง (PhishTank, OpenPhish, CERT.PL และอื่น ๆ) โดยจับคู่ภายในเครื่อง เพื่อให้ประวัติการท่องเว็บไม่ออกจากเครื่องของคุณ
</Card>

<Card title="Product-design reasoning skills" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

ชุดเครื่องมือสามรายการสำหรับงานผลิตภัณฑ์: [บทสนทนาแบบโสเครติส](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) จะซักถามประเด็นอย่างละเอียดก่อนตอบ [นักวางกลยุทธ์โมเดล Kano](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) จัดหมวดหมู่ฟีเจอร์เพื่อพิจารณาว่าฟีเจอร์ใดสมควรได้รับการพัฒนา และ [ผลลัพธ์เอเจนต์ที่อ่านเข้าใจง่าย](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) เรียบเรียงผลลัพธ์จากเอเจนต์ใหม่เป็นภาษาที่เข้าใจง่าย
</Card>

<Card title="Mailbox broker for sub-agents" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

ช่วยไม่ให้ตัวประสานงานต้องรอโดยเปล่าประโยชน์ขณะที่เอเจนต์ย่อยกำลังทำงาน ด้วยกลไกเรียกกลับแบบอะซิงโครนัสที่ส่งผลลัพธ์ไปยังกล่องจดหมายแทนการบล็อกเอเจนต์หลัก
</Card>

<Card title="lite-mode for low-RAM machines" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

ช่วยให้ OpenClaw ยังคงใช้งานได้บนเครื่องที่มีหน่วยความจำ 2–4 GB โดยตรวจสอบหน่วยความจำที่ว่างและลดการใช้ฟีเจอร์ที่กินทรัพยากรมากก่อนที่เครื่องจะเริ่มใช้พื้นที่สลับ [ซอร์สโค้ดบน GitHub](https://github.com/mirajmahmudul/openclaw-lite-mode)
</Card>

<Card title="tokenomics cost tracker" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

เครื่องมือติดตามต้นทุนโทเค็นจากวิศวกร NVIDIA พร้อมการรองรับ OpenClaw อย่างเต็มรูปแบบ ช่วยให้เห็นอย่างชัดเจนว่าค่าใช้จ่ายของเอเจนต์ถูกใช้ไปที่ใด โดยแยกตามโมเดลและเซสชัน
</Card>

<Card title="Excalidraw diagram generator" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

อธิบายแผนภาพในแชต แล้วรับภาพร่าง Excalidraw ที่สร้างด้วยโปรแกรมกลับมา
</Card>

<Card title="GA4 analytics skill" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

ให้ OpenClaw สร้างเครื่องมือสืบค้น Google Analytics ของตนเอง จากนั้นจัดแพ็กเกจและเผยแพร่ไปยัง ClawHub
</Card>

<Card title="ClawEval model rankings" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

เปรียบเทียบประสิทธิภาพโมเดลในบทบาทเอเจนต์ 59 บทบาท เพื่อตอบคำถามว่า "ควรใช้ LLM ใดกับ GPU ของฉัน?" เป็นเครื่องมือยอดนิยมของชุมชนสำหรับเลือกโมเดลที่ทำงานภายในเครื่อง
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

การสร้างเพลงที่ไม่ผูกติดกับผู้ให้บริการรายใดรายหนึ่ง: วางแผนเพลง จัดโครงสร้างเนื้อร้อง และปรับแก้ผลลัพธ์ที่ยังไม่สมบูรณ์ แทนการใช้พรอมป์เพียงครั้งเดียว มี[เวอร์ชัน MiniMax](https://clawhub.ai/luischarro/music-craft-minimax) ที่ควบคุม BPM, คีย์, โครงสร้าง และการผสมเพลงได้
</Card>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode ดำเนินการแก้ไขเสร็จ เปิด PR จากนั้น OpenClaw จะรีวิวความแตกต่างและตอบกลับใน Telegram พร้อมคำแนะนำและคำตัดสินที่ชัดเจนว่าควรรวมหรือไม่

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

ขอให้ "Robby" (@openclaw) สร้าง Skills สำหรับจัดการห้องเก็บไวน์ภายในเครื่อง ระบบจะขอไฟล์ส่งออก CSV ตัวอย่างและพาธจัดเก็บ จากนั้นสร้างและทดสอบ Skills ดังกล่าว (ตัวอย่างมีไวน์ 962 ขวด)

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

วางแผนมื้ออาหารประจำสัปดาห์ เลือกสินค้าที่ซื้อเป็นประจำ จองช่วงเวลาจัดส่ง และยืนยันคำสั่งซื้อ ไม่ต้องใช้ API เพียงควบคุมผ่านเบราว์เซอร์

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

ใช้แป้นลัดเลือกพื้นที่บนหน้าจอ ประมวลผลด้วยระบบการมองเห็นของ Gemini แล้วรับ Markdown ในคลิปบอร์ดทันที

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

แอปเดสก์ท็อปสำหรับจัดการ Skills และคำสั่งต่าง ๆ ระหว่าง Agents, Claude, Codex และ OpenClaw

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **ชุมชน** • `voice` `tts` `telegram`

ครอบ papla.media TTS และส่งผลลัพธ์เป็นข้อความเสียงใน Telegram (ไม่มีการเล่นอัตโนมัติที่น่ารำคาญ)

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

เครื่องมือช่วยที่ติดตั้งผ่าน Homebrew สำหรับแสดงรายการ ตรวจสอบ และติดตามเซสชัน OpenAI Codex ภายในเครื่อง (CLI + VS Code)

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

ควบคุมและแก้ไขปัญหาเครื่องพิมพ์ BambuLab: สถานะ งาน กล้อง AMS การปรับเทียบ และอื่น ๆ

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

ข้อมูลเวลาออกเดินทางแบบเรียลไทม์ เหตุขัดข้อง สถานะลิฟต์ และการวางเส้นทางสำหรับระบบขนส่งสาธารณะของเวียนนา

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

จองอาหารโรงเรียนในสหราชอาณาจักรผ่าน ParentPay โดยอัตโนมัติ ใช้พิกัดเมาส์เพื่อคลิกเซลล์ในตารางได้อย่างแม่นยำ
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

อัปโหลดไปยัง Cloudflare R2/S3 และสร้างลิงก์ดาวน์โหลดแบบลงนามล่วงหน้าที่ปลอดภัย มีประโยชน์สำหรับอินสแตนซ์ OpenClaw ระยะไกล

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

สร้างแอป iOS ที่สมบูรณ์พร้อมแผนที่และการบันทึกเสียง เตรียมพร้อมสำหรับเผยแพร่บน App Store โดยดำเนินการทั้งหมดผ่านแชต Telegram
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

ผู้ช่วยสุขภาพ AI ส่วนบุคคลที่ผสานข้อมูลจากแหวน Oura เข้ากับปฏิทิน การนัดหมาย และตารางออกกำลังกาย

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

เอเจนต์มากกว่า 14 ตัวภายใต้ Gateway เดียว โดยมีตัวประสานงาน Opus 4.5 มอบหมายงานให้ผู้ปฏิบัติงาน Codex ดู[บทความเชิงเทคนิค](https://github.com/adam91holt/orchestrated-ai-articles) และ [Clawdspace](https://github.com/adam91holt/clawdspace) สำหรับการแยกสภาพแวดล้อมของเอเจนต์
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI สำหรับ Linear ที่ผสานเข้ากับเวิร์กโฟลว์แบบเอเจนต์ (Claude Code, OpenClaw) จัดการปัญหา โครงการ และเวิร์กโฟลว์จากเทอร์มินัล
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

อ่าน ส่ง และเก็บถาวรข้อความผ่าน Beeper Desktop ใช้ API ของ MCP ภายในเครื่องของ Beeper เพื่อให้เอเจนต์จัดการแชตทั้งหมดของคุณ (iMessage, WhatsApp และอื่น ๆ) ได้ในที่เดียว
</Card>

</CardGroup>

## ระบบอัตโนมัติและเวิร์กโฟลว์

การตั้งเวลา การควบคุมเบราว์เซอร์ วงจรการสนับสนุน และส่วนของผลิตภัณฑ์ที่มุ่งเน้นแนวคิด "เพียงทำงานนี้ให้ฉัน"

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code ค้นพบและยืนยันส่วนควบคุมเครื่องฟอกอากาศ จากนั้น OpenClaw เข้ามาจัดการคุณภาพอากาศภายในห้องต่อ

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

ทำงานเมื่อกล้องบนหลังคาถูกกระตุ้น โดยขอให้ OpenClaw ถ่ายภาพท้องฟ้าเมื่อดูสวยงาม ระบบออกแบบ Skills และถ่ายภาพให้

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

พรอมป์ตามกำหนดเวลาจะสร้างภาพฉากหนึ่งภาพทุกเช้า (สภาพอากาศ งาน วันที่ โพสต์หรือคำคมที่ชื่นชอบ) ผ่านบุคลิกจำลองของ OpenClaw
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

เครื่องมือตรวจสอบสนามว่างของ Playtomic พร้อม CLI สำหรับจอง ไม่ต้องพลาดสนามว่างอีกต่อไป

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **ชุมชน** • `automation` `email` `pdf`

รวบรวม PDF จากอีเมลและเตรียมเอกสารสำหรับที่ปรึกษาด้านภาษี ทำบัญชีรายเดือนแบบอัตโนมัติ
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

สร้างเว็บไซต์ส่วนตัวขึ้นใหม่ทั้งหมดผ่าน Telegram ระหว่างดู Netflix — ย้ายจาก Notion ไปยัง Astro ย้ายโพสต์ 18 รายการ และเปลี่ยน DNS ไปยัง Cloudflare โดยไม่เคยเปิดแล็ปท็อปเลย
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

ค้นหาประกาศงาน จับคู่กับคำสำคัญในประวัติย่อ และส่งคืนโอกาสที่เกี่ยวข้องพร้อมลิงก์ สร้างเสร็จภายใน 30 นาทีโดยใช้ JSearch API
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw เชื่อมต่อกับ Jira แล้วสร้าง Skills ใหม่ขึ้นมาทันทีตามต้องการ (ก่อนที่จะมี Skills นี้บน ClawHub)
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

ทำงาน Todoist โดยอัตโนมัติ และให้ OpenClaw สร้าง Skills โดยตรงภายในแชต Telegram
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

เข้าสู่ระบบ TradingView ผ่านระบบอัตโนมัติบนเบราว์เซอร์ จับภาพหน้าจอกราฟ และทำการวิเคราะห์ทางเทคนิคตามคำขอ ไม่ต้องใช้ API — เพียงควบคุมเบราว์เซอร์เท่านั้น
</Card>

<Card title="Car negotiation ($4,200 saved)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

ปล่อยให้ OpenClaw จัดการกับตัวแทนจำหน่ายรถยนต์ โดยรับหน้าที่เจรจาโต้ตอบไปมาและลดราคาได้ $4,200
</Card>

<Card title="Flight check-in autopilot" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

ค้นหาเที่ยวบินถัดไปจากอีเมล ดำเนินการเช็กอินออนไลน์ และเลือกที่นั่งริมหน้าต่าง — ไม่ต้องใช้แอปของสายการบิน
</Card>

<Card title="Insurance claim filing" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

ยื่นคำร้องเคลมประกันและนัดหมายติดตามผลโดยอัตโนมัติ
</Card>

<Card title="Idealista real estate skill" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

CLI สำหรับ Idealista API เพื่อค้นหาและประเมินมูลค่าอสังหาริมทรัพย์ โดยห่อหุ้มเป็น Skills เพื่อให้เอเจนต์ช่วยค้นหาบ้านผ่านแชตได้
</Card>

<Card title="Gardening business back office" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

เฝ้าติดตามใบสั่งงานใน Gmail วิเคราะห์ภาพถ่ายอสังหาริมทรัพย์ที่ส่งผ่าน Telegram สร้างเอกสารเสนอราคา PDF หลายหน้าด้วย LaTeX และออกใบแจ้งหนี้ผ่าน Xero
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

เฝ้าติดตามช่อง Slack ของบริษัท ตอบกลับอย่างเป็นประโยชน์ และส่งต่อการแจ้งเตือนไปยัง Telegram ทั้งยังแก้ไขข้อบกพร่องในระบบจริงของแอปที่ติดตั้งใช้งานอยู่ได้โดยอัตโนมัติ แม้ไม่มีใครร้องขอ
</Card>

</CardGroup>

## ความรู้และหน่วยความจำ

ระบบที่จัดทำดัชนี ค้นหา จดจำ และใช้เหตุผลกับความรู้ส่วนบุคคลหรือความรู้ของทีม

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

ระบบการเรียนรู้ภาษาจีนที่ให้ข้อเสนอแนะด้านการออกเสียงและมีลำดับขั้นตอนการเรียนผ่าน OpenClaw

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="X post analysis pipeline" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

รวบรวมโพสต์ 4 ล้านรายการจากบัญชี X ชั้นนำ 100 บัญชี แล้วแปลงเป็นไปป์ไลน์การวิเคราะห์ที่สืบค้นได้
</Card>

<Card title="Lab results to Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

จัดระเบียบผลตรวจเลือดจากห้องปฏิบัติการที่สะสมมาหลายปีไว้ในฐานข้อมูล Notion ที่มีโครงสร้าง
</Card>

<Card title="Obsidian second brain" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

ผู้ช่วยประจำวันบน WhatsApp ที่จัดเก็บหน่วยความจำทั้งหมดเป็น Markdown ในคลัง Obsidian ที่ควบคุมเวอร์ชัน ครอบคลุมการติดตามแคลอรีและการออกกำลังกาย รายการสิ่งที่ต้องทำ และการจัดการธุระส่วนตัว
</Card>

<Card title="Family history bot" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

ทำงานอยู่ในแชตกลุ่ม Telegram ของครอบครัว บันทึกเรื่องราวของญาติมากกว่า 50 คน และถามคำถามติดตามผลอย่างมีข้อมูลประกอบ — พร้อมตอบเป็นภาษาเนปาลสำหรับเจ้าของภาษา
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **ชุมชน** • `memory` `transcription` `indexing`

นำเข้าข้อมูลที่ส่งออกจาก WhatsApp ทั้งหมด ถอดเสียงข้อความเสียงมากกว่า 1,000 รายการ ตรวจสอบไขว้กับบันทึก Git และสร้างรายงาน Markdown ที่เชื่อมโยงถึงกัน
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

เพิ่มการค้นหาแบบเวกเตอร์ให้บุ๊กมาร์ก Karakeep โดยใช้ Qdrant ร่วมกับ Embedding จาก OpenAI หรือ Ollama
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **ชุมชน** • `memory` `beliefs` `self-model`

ตัวจัดการหน่วยความจำแยกต่างหากที่แปลงไฟล์เซสชันเป็นความทรงจำ จากนั้นเป็นความเชื่อ และสุดท้ายเป็นแบบจำลองตนเองที่พัฒนาอย่างต่อเนื่อง
</Card>

</CardGroup>

## เสียงและโทรศัพท์

ช่องทางเข้าถึงที่เน้นเสียงเป็นหลัก ระบบเชื่อมต่อโทรศัพท์ และเวิร์กโฟลว์ที่ใช้การถอดเสียงเป็นจำนวนมาก

<CardGroup cols={2}>

<Card title="Pebble Ring one-tap voice" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

แตะ Pebble Ring หนึ่งครั้งเพื่อเริ่มสนทนาด้วยเสียงกับ OpenClaw — เข้าถึงเอเจนต์ได้จากอุปกรณ์สวมใส่
</Card>

<Card title="Creator media studio" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

สตูดิโอสื่อครบวงจรในแชต ทั้ง TTS การถอดเสียง และระบบอัตโนมัติบนเบราว์เซอร์ที่เชื่อมต่อกับ Codex 5.2 และ MiniMax
</Card>

<Card title="Action Button walkie-talkie" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

เชื่อมปุ่ม Action Button ของ iPhone เข้ากับ OpenClaw: กด พูด แล้วเอเจนต์จะพูดตอบกลับเหมือนวิทยุสื่อสาร
</Card>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

บริดจ์เชื่อมต่อผู้ช่วยเสียง Vapi กับ OpenClaw ผ่าน HTTP สนทนาทางโทรศัพท์กับเอเจนต์ได้เกือบแบบเรียลไทม์
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

ถอดเสียงไฟล์เสียงหลายภาษาผ่าน OpenRouter (Gemini และอื่น ๆ) พร้อมใช้งานบน ClawHub

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## โครงสร้างพื้นฐานและการติดตั้งใช้งาน

การจัดแพ็กเกจ การติดตั้งใช้งาน และการผสานการทำงานที่ช่วยให้เรียกใช้และขยาย OpenClaw ได้ง่ายขึ้น

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway ของ OpenClaw ที่ทำงานบน Home Assistant OS พร้อมรองรับอุโมงค์ SSH และการเก็บสถานะแบบถาวร
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

ควบคุมและทำให้อุปกรณ์ Home Assistant ทำงานโดยอัตโนมัติผ่านภาษาธรรมชาติ

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="macOS menu bar manager" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

แอปแถบเมนูแบบเนทีฟที่พัฒนาด้วย Swift แสดงสถานะเอเจนต์พร้อมตัวควบคุมด่วน
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

การกำหนดค่า OpenClaw ในรูปแบบ Nix ที่มาพร้อมทุกสิ่งที่จำเป็นสำหรับการติดตั้งใช้งานซ้ำได้อย่างสม่ำเสมอ
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Skills ปฏิทินที่ใช้ khal และ vdirsyncer สำหรับผสานการทำงานกับปฏิทินที่โฮสต์ด้วยตนเอง

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## บ้านและฮาร์ดแวร์

ด้านที่เชื่อมต่อกับโลกทางกายภาพของ OpenClaw ได้แก่ บ้าน เซ็นเซอร์ กล้อง เครื่องดูดฝุ่น และอุปกรณ์อื่น ๆ

<CardGroup cols={2}>

<Card title="Self-built HomePod skill" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw ค้นพบ HomePod บนเครือข่ายภายในและเขียน Skills สำหรับควบคุมอุปกรณ์เหล่านั้นให้ตัวเอง
</Card>

<Card title="$35 holo cube interface" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

ลูกบาศก์โฮโลกราฟิกราคาประหยัดที่ทำหน้าที่เป็นใบหน้าทางกายภาพของเอเจนต์บนโต๊ะ
</Card>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

ระบบบ้านอัตโนมัติแบบเนทีฟบน Nix ที่ใช้ OpenClaw เป็นอินเทอร์เฟซ พร้อมแดชบอร์ด Grafana

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

ควบคุมหุ่นยนต์ดูดฝุ่น Roborock ผ่านการสนทนาที่เป็นธรรมชาติ

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## โครงการจากชุมชน

สิ่งที่เติบโตจากเวิร์กโฟลว์เดียวไปเป็นผลิตภัณฑ์หรือระบบนิเวศที่กว้างขึ้น

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **ชุมชน** • `marketplace` `astronomy` `webapp`

ตลาดซื้อขายอุปกรณ์ดาราศาสตร์แบบครบวงจร สร้างขึ้นด้วยและรอบระบบนิเวศของ OpenClaw
</Card>

<Card title="Clinch agent negotiation protocol" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

การเจรจาแบบเปิดระหว่างเอเจนต์: เอเจนต์ของคุณต่อรองข้อตกลง กำหนดการ และสัญญาบริการกับ Node อื่น พร้อมลงนามผลลัพธ์ด้วยการเข้ารหัส — คุณเพียงอนุมัติหรือปฏิเสธ
</Card>

</CardGroup>

## ส่งโครงการของคุณ

<Steps>
  <Step title="Share it">
    โพสต์ใน [#self-promotion บน Discord](https://discord.gg/clawd) หรือ [ทวีตถึง @openclaw](https://x.com/openclaw)
  </Step>
  <Step title="Include details">
    บอกเราว่าโครงการทำอะไรได้บ้าง แนบลิงก์ไปยังรีโพซิทอรีหรือเดโม และแชร์ภาพหน้าจอหากมี
  </Step>
  <Step title="Get featured">
    เราจะเพิ่มโครงการที่โดดเด่นลงในหน้านี้
  </Step>
</Steps>

## เนื้อหาที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [OpenClaw](/th/start/openclaw)
- [การรวบรวมตัวอย่างจาก X ฉบับเต็มบน openclaw.ai](https://openclaw.ai/showcase/)
