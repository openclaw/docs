---
read_when:
    - การตอบคำถามสนับสนุนทั่วไปเกี่ยวกับการตั้งค่า การติดตั้ง การเริ่มต้นใช้งาน หรือรันไทม์
    - คัดกรองปัญหาที่ผู้ใช้รายงานก่อนการดีบักเชิงลึก
summary: คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า การกำหนดค่า และการใช้งาน OpenClaw
title: คำถามที่พบบ่อย
x-i18n:
    generated_at: "2026-05-02T10:19:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: f818d009a261e32df22c793ab9018ff20cc38f799428d0cfdd8979f8c6d94e13
    source_path: help/faq.md
    workflow: 16
---

คำตอบแบบรวดเร็วพร้อมการแก้ปัญหาเชิงลึกสำหรับการตั้งค่าจริง (การพัฒนาในเครื่อง, VPS, หลายเอเจนต์, OAuth/คีย์ API, การสลับสำรองโมเดล) สำหรับการวินิจฉัยขณะรันไทม์ โปรดดู [การแก้ปัญหา](/th/gateway/troubleshooting) สำหรับเอกสารอ้างอิงการกำหนดค่าฉบับเต็ม โปรดดู [การกำหนดค่า](/th/gateway/configuration)

## 60 วินาทีแรกเมื่อมีบางอย่างเสีย

1. **สถานะด่วน (ตรวจสอบก่อน)**

   ```bash
   openclaw status
   ```

   สรุปในเครื่องอย่างรวดเร็ว: OS + การอัปเดต, การเข้าถึง gateway/service, agents/sessions, การกำหนดค่า provider + ปัญหารันไทม์ (เมื่อเข้าถึง gateway ได้)

2. **รายงานที่วางได้ (ปลอดภัยสำหรับการแชร์)**

   ```bash
   openclaw status --all
   ```

   การวินิจฉัยแบบอ่านอย่างเดียวพร้อมท้าย log (ปกปิด tokens แล้ว)

3. **สถานะ daemon + port**

   ```bash
   openclaw gateway status
   ```

   แสดง supervisor runtime เทียบกับการเข้าถึง RPC, URL เป้าหมายของ probe และ config ที่ service น่าจะใช้

4. **probe เชิงลึก**

   ```bash
   openclaw status --deep
   ```

   รัน gateway health probe แบบสด รวมถึง channel probes เมื่อรองรับ
   (ต้องมี gateway ที่เข้าถึงได้) โปรดดู [Health](/th/gateway/health)

5. **ติดตาม log ล่าสุด**

   ```bash
   openclaw logs --follow
   ```

   ถ้า RPC ล่ม ให้ fallback ไปใช้:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   file logs แยกจาก service logs; โปรดดู [Logging](/th/logging) และ [การแก้ปัญหา](/th/gateway/troubleshooting)

6. **รัน doctor (ซ่อมแซม)**

   ```bash
   openclaw doctor
   ```

   ซ่อมแซม/ย้าย config/state + รัน health checks โปรดดู [Doctor](/th/gateway/doctor)

7. **สแนปชอต Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   ขอ snapshot แบบเต็มจาก gateway ที่กำลังรันอยู่ (WS เท่านั้น) โปรดดู [Health](/th/gateway/health)

## เริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก

ถามตอบครั้งแรก — การติดตั้ง, การ onboard, เส้นทาง auth, subscriptions, ความล้มเหลวเบื้องต้น —
อยู่ใน [FAQ ครั้งแรก](/th/help/faq-first-run)

## OpenClaw คืออะไร?

<AccordionGroup>
  <Accordion title="OpenClaw คืออะไรในหนึ่งย่อหน้า?">
    OpenClaw คือผู้ช่วย AI ส่วนตัวที่คุณรันบนอุปกรณ์ของคุณเอง ตอบกลับบนพื้นที่รับส่งข้อความที่คุณใช้อยู่แล้ว (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat และ bundled channel plugins เช่น QQ Bot) และยังทำงานเสียง + Canvas แบบสดบนแพลตฟอร์มที่รองรับได้ด้วย **Gateway** คือ control plane ที่ทำงานตลอดเวลา ส่วนผู้ช่วยคือผลิตภัณฑ์
  </Accordion>

  <Accordion title="คุณค่าที่เสนอ">
    OpenClaw ไม่ใช่ "แค่ wrapper ของ Claude" แต่เป็น **control plane ที่ให้ความสำคัญกับเครื่อง local ก่อน** ซึ่งให้คุณรัน
    ผู้ช่วยที่มีความสามารถบน **ฮาร์ดแวร์ของคุณเอง** เข้าถึงได้จากแอปแชตที่คุณใช้อยู่แล้ว พร้อม
    sessions แบบมี state, memory และ tools - โดยไม่ต้องมอบการควบคุม workflows ของคุณให้กับ
    SaaS ที่โฮสต์ไว้

    จุดเด่น:

    - **อุปกรณ์ของคุณ ข้อมูลของคุณ:** รัน Gateway ได้ทุกที่ที่คุณต้องการ (Mac, Linux, VPS) และเก็บ
      workspace + session history ไว้ในเครื่อง
    - **ช่องทางจริง ไม่ใช่ web sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      พร้อมเสียงบนมือถือและ Canvas บนแพลตฟอร์มที่รองรับ
    - **ไม่ผูกกับโมเดลใด:** ใช้ Anthropic, OpenAI, MiniMax, OpenRouter และอื่น ๆ พร้อม routing
      และ failover แยกตาม agent
    - **ตัวเลือกแบบ local เท่านั้น:** รันโมเดลในเครื่องเพื่อให้ **ข้อมูลทั้งหมดอยู่บนอุปกรณ์ของคุณได้** หากคุณต้องการ
    - **routing หลาย agent:** แยก agents ตาม channel, account หรือ task โดยแต่ละตัวมี
      workspace และ defaults ของตัวเอง
    - **โอเพนซอร์สและปรับแต่งได้:** ตรวจสอบ ขยาย และ self-host ได้โดยไม่ถูกผูกกับผู้ให้บริการรายเดียว

    เอกสาร: [Gateway](/th/gateway), [Channels](/th/channels), [Multi-agent](/th/concepts/multi-agent),
    [Memory](/th/concepts/memory).

  </Accordion>

  <Accordion title="ฉันเพิ่งตั้งค่าเสร็จ - ควรทำอะไรก่อน?">
    โปรเจกต์แรกที่เหมาะ:

    - สร้างเว็บไซต์ (WordPress, Shopify หรือ static site อย่างง่าย)
    - ทำ prototype แอปมือถือ (outline, screens, แผน API)
    - จัดระเบียบไฟล์และโฟลเดอร์ (cleanup, naming, tagging)
    - เชื่อมต่อ Gmail และทำสรุปหรือ follow ups อัตโนมัติ

    มันจัดการงานขนาดใหญ่ได้ แต่ทำงานได้ดีที่สุดเมื่อคุณแบ่งงานออกเป็นเฟสและ
    ใช้ sub agents สำหรับงานแบบขนาน

  </Accordion>

  <Accordion title="ห้า use cases ประจำวันยอดนิยมของ OpenClaw คืออะไร?">
    ผลลัพธ์ที่เห็นได้ในชีวิตประจำวันมักเป็นแบบนี้:

    - **สรุปข้อมูลส่วนตัว:** สรุป inbox, calendar และข่าวที่คุณสนใจ
    - **วิจัยและร่าง:** วิจัยอย่างรวดเร็ว สรุป และร่างฉบับแรกสำหรับอีเมลหรือเอกสาร
    - **เตือนความจำและ follow ups:** การสะกิดและ checklists ที่ขับเคลื่อนด้วย cron หรือ heartbeat
    - **ทำ browser automation:** กรอกฟอร์ม เก็บข้อมูล และทำงานเว็บซ้ำ ๆ
    - **ประสานงานข้ามอุปกรณ์:** ส่ง task จากโทรศัพท์ของคุณ ให้ Gateway รันบน server แล้วรับผลลัพธ์กลับมาในแชต

  </Accordion>

  <Accordion title="OpenClaw ช่วยเรื่องการหา lead, outreach, โฆษณา และบล็อกสำหรับ SaaS ได้ไหม?">
    ได้ สำหรับ **การวิจัย การคัดกรองคุณสมบัติ และการร่าง** เครื่องมือนี้สามารถสแกนไซต์ สร้างรายการคัดสั้น
    สรุปผู้มีโอกาสเป็นลูกค้า และเขียนร่างข้อความ outreach หรือโฆษณาได้

    สำหรับ **outreach หรือการรันโฆษณา** ให้มีมนุษย์อยู่ในกระบวนการเสมอ หลีกเลี่ยงสแปม ปฏิบัติตามกฎหมายท้องถิ่นและ
    นโยบายของแพลตฟอร์ม และตรวจทานทุกอย่างก่อนส่ง รูปแบบที่ปลอดภัยที่สุดคือให้
    OpenClaw ร่าง แล้วคุณอนุมัติ

    เอกสาร: [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="ข้อดีเมื่อเทียบกับ Claude Code สำหรับการพัฒนาเว็บคืออะไร?">
    OpenClaw เป็น **ผู้ช่วยส่วนตัว** และชั้นประสานงาน ไม่ใช่เครื่องมือทดแทน IDE ใช้
    Claude Code หรือ Codex สำหรับวงจรการเขียนโค้ดโดยตรงที่เร็วที่สุดภายใน repo ใช้ OpenClaw เมื่อคุณ
    ต้องการหน่วยความจำที่คงทน การเข้าถึงข้ามอุปกรณ์ และการประสานการทำงานของเครื่องมือ

    ข้อดี:

    - **หน่วยความจำถาวร + workspace** ข้ามเซสชัน
    - **การเข้าถึงหลายแพลตฟอร์ม** (WhatsApp, Telegram, TUI, WebChat)
    - **การประสานการทำงานของเครื่องมือ** (เบราว์เซอร์ ไฟล์ การตั้งเวลา hooks)
    - **Gateway ที่ทำงานตลอดเวลา** (รันบน VPS และโต้ตอบได้จากทุกที่)
    - **Nodes** สำหรับเบราว์เซอร์/หน้าจอ/กล้อง/exec ในเครื่อง

    ตัวอย่าง showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills และระบบอัตโนมัติ

<AccordionGroup>
  <Accordion title="ฉันจะปรับแต่ง skills โดยไม่ทำให้ repo มีการเปลี่ยนแปลงค้างอยู่ได้อย่างไร?">
    ใช้ overrides ที่จัดการได้แทนการแก้ไขสำเนาใน repo ใส่การเปลี่ยนแปลงของคุณไว้ใน `~/.openclaw/skills/<name>/SKILL.md` (หรือเพิ่มโฟลเดอร์ผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json`) ลำดับความสำคัญคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → แบบ bundled → `skills.load.extraDirs` ดังนั้น overrides ที่จัดการได้ยังคงชนะ skills แบบ bundled โดยไม่แตะ git หากคุณต้องติดตั้ง skill แบบ global แต่ต้องการให้เห็นเฉพาะบาง agents ให้เก็บสำเนาที่ใช้ร่วมกันไว้ใน `~/.openclaw/skills` และควบคุมการมองเห็นด้วย `agents.defaults.skills` และ `agents.list[].skills` เฉพาะการแก้ไขที่ควรส่ง upstream เท่านั้นที่ควรอยู่ใน repo และส่งออกเป็น PRs
  </Accordion>

  <Accordion title="ฉันโหลด skills จากโฟลเดอร์กำหนดเองได้ไหม?">
    ได้ เพิ่มไดเรกทอรีเพิ่มเติมผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json` (ลำดับความสำคัญต่ำสุด) ลำดับความสำคัญเริ่มต้นคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → แบบ bundled → `skills.load.extraDirs` โดยค่าเริ่มต้น `clawhub` จะติดตั้งลงใน `./skills` ซึ่ง OpenClaw จะถือว่าเป็น `<workspace>/skills` ในเซสชันถัดไป หาก skill ควรมองเห็นได้เฉพาะบาง agents ให้ใช้ร่วมกับ `agents.defaults.skills` หรือ `agents.list[].skills`
  </Accordion>

  <Accordion title="ฉันจะใช้โมเดลต่างกันสำหรับงานต่างกันได้อย่างไร?">
    รูปแบบที่รองรับในวันนี้คือ:

    - **งาน Cron**: งานที่แยกกันสามารถตั้งค่า override ของ `model` ต่อแต่ละงานได้
    - **Sub-agents**: ส่งงานไปยัง agents แยกต่างหากที่มีโมเดลเริ่มต้นต่างกัน
    - **สลับตามต้องการ**: ใช้ `/model` เพื่อสลับโมเดลของเซสชันปัจจุบันได้ทุกเวลา

    ดู [งาน Cron](/th/automation/cron-jobs), [การกำหนดเส้นทางแบบ Multi-Agent](/th/concepts/multi-agent), และ [คำสั่ง Slash](/th/tools/slash-commands).

  </Accordion>

  <Accordion title="บอตค้างระหว่างทำงานหนัก ฉันจะย้ายงานนั้นออกไปทำที่อื่นได้อย่างไร?">
    ใช้ **sub-agents** สำหรับงานที่ยาวหรือทำแบบขนาน Sub-agents จะรันในเซสชันของตัวเอง
    ส่งคืนสรุป และทำให้แชตหลักของคุณยังตอบสนองได้

    ขอให้บอตของคุณ "spawn a sub-agent for this task" หรือใช้ `/subagents`
    ใช้ `/status` ในแชตเพื่อดูว่า Gateway กำลังทำอะไรอยู่ตอนนี้ (และกำลังยุ่งอยู่หรือไม่)

    เคล็ดลับเรื่อง token: งานยาวและ sub-agents ต่างก็ใช้ tokens หากกังวลเรื่องค่าใช้จ่าย ให้ตั้งค่า
    โมเดลที่ถูกกว่าสำหรับ sub-agents ผ่าน `agents.defaults.subagents.model`

    เอกสาร: [Sub-agents](/th/tools/subagents), [งานเบื้องหลัง](/th/automation/tasks).

  </Accordion>

  <Accordion title="เซสชัน subagent ที่ผูกกับ thread ทำงานบน Discord อย่างไร?">
    ใช้ thread bindings คุณสามารถ bind thread ของ Discord กับ subagent หรือเป้าหมายเซสชัน เพื่อให้ข้อความติดตามผลใน thread นั้นยังอยู่ในเซสชันที่ bind ไว้

    ขั้นตอนพื้นฐาน:

    - Spawn ด้วย `sessions_spawn` โดยใช้ `thread: true` (และเลือกใช้ `mode: "session"` สำหรับการติดตามผลแบบถาวรได้)
    - หรือ bind ด้วยตนเองด้วย `/focus <target>`
    - ใช้ `/agents` เพื่อตรวจสอบสถานะ binding
    - ใช้ `/session idle <duration|off>` และ `/session max-age <duration|off>` เพื่อควบคุม auto-unfocus
    - ใช้ `/unfocus` เพื่อแยก thread ออก

    การตั้งค่าที่ต้องมี:

    - ค่าเริ่มต้น global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Overrides ของ Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-bind เมื่อ spawn: `channels.discord.threadBindings.spawnSessions` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เพื่อปิดการสร้างเซสชันที่ผูกกับ thread

    เอกสาร: [Sub-agents](/th/tools/subagents), [Discord](/th/channels/discord), [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference), [คำสั่ง Slash](/th/tools/slash-commands).

  </Accordion>

  <Accordion title="subagent ทำงานเสร็จแล้ว แต่การอัปเดตเมื่อเสร็จสิ้นไปผิดที่หรือไม่ถูกโพสต์เลย ฉันควรตรวจสอบอะไร?">
    ตรวจสอบ requester route ที่ resolve แล้วก่อน:

    - การส่งมอบ subagent ใน completion-mode จะให้ความสำคัญกับ thread หรือ conversation route ที่ bind ไว้ เมื่อมีอยู่
    - หาก origin ของ completion มีเพียง channel, OpenClaw จะ fallback ไปยัง route ที่เก็บไว้ของเซสชันผู้ขอ (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้การส่งโดยตรงยังสำเร็จได้
    - หากไม่มีทั้ง bound route และ stored route ที่ใช้ได้ การส่งโดยตรงอาจล้มเหลว และผลลัพธ์จะ fallback ไปเป็นการส่งผ่านคิวของเซสชันแทนการโพสต์ไปยังแชตทันที
    - เป้าหมายที่ไม่ถูกต้องหรือล้าสมัยยังสามารถบังคับให้ fallback ไปที่คิว หรือทำให้การส่งสุดท้ายล้มเหลวได้
    - หากข้อความตอบกลับที่ผู้ช่วยของ child แสดงล่าสุดเป็น silent token ตรงตัว `NO_REPLY` / `no_reply` หรือเป็น `ANNOUNCE_SKIP` ตรงตัว OpenClaw จะตั้งใจระงับการประกาศแทนการโพสต์ความคืบหน้าก่อนหน้าที่ล้าสมัย
    - หาก child หมดเวลาหลังจากมีเพียง tool calls การประกาศสามารถยุบสิ่งนั้นเป็นสรุปความคืบหน้าบางส่วนแบบสั้น แทนการ replay raw tool output

    ดีบัก:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [Sub-agents](/th/tools/subagents), [งานเบื้องหลัง](/th/automation/tasks), [เครื่องมือเซสชัน](/th/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron หรือ reminders ไม่ทำงาน ฉันควรตรวจสอบอะไร?">
    Cron รันอยู่ภายในโปรเซส Gateway หาก Gateway ไม่ได้รันอย่างต่อเนื่อง
    งานที่ตั้งเวลาไว้จะไม่รัน

    รายการตรวจสอบ:

    - ยืนยันว่าเปิดใช้งาน cron แล้ว (`cron.enabled`) และไม่ได้ตั้งค่า `OPENCLAW_SKIP_CRON`
    - ตรวจสอบว่า Gateway รัน 24/7 (ไม่มี sleep/restarts)
    - ตรวจสอบการตั้งค่า timezone ของงาน (`--tz` เทียบกับ timezone ของ host)

    ดีบัก:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [ระบบอัตโนมัติและงาน](/th/automation).

  </Accordion>

  <Accordion title="Cron ทำงานแล้ว แต่ไม่มีอะไรถูกส่งไปยังช่อง ทำไม?">
    ตรวจสอบโหมดการนำส่งก่อน:

    - `--no-deliver` / `delivery.mode: "none"` หมายความว่าไม่ควรมีการส่ง fallback จาก runner
    - เป้าหมายประกาศหายไปหรือไม่ถูกต้อง (`channel` / `to`) หมายความว่า runner ข้ามการนำส่งขาออก
    - ความล้มเหลวของการยืนยันตัวตนของช่อง (`unauthorized`, `Forbidden`) หมายความว่า runner พยายามนำส่งแล้วแต่ข้อมูลประจำตัวบล็อกไว้
    - ผลลัพธ์แบบ isolated ที่เงียบ (`NO_REPLY` / `no_reply` เท่านั้น) จะถือว่าจงใจไม่นำส่งได้ ดังนั้น runner จึงระงับการนำส่ง fallback ที่เข้าคิวไว้ด้วย

    สำหรับงาน Cron แบบ isolated เอเจนต์ยังสามารถส่งโดยตรงด้วยเครื่องมือ `message`
    ได้เมื่อมีเส้นทางแชตพร้อมใช้งาน `--announce` ควบคุมเฉพาะเส้นทาง fallback
    ของ runner สำหรับข้อความสุดท้ายที่เอเจนต์ยังไม่ได้ส่งเอง

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [งานเบื้องหลัง](/th/automation/tasks).

  </Accordion>

  <Accordion title="ทำไมการรัน Cron แบบ isolated จึงสลับโมเดลหรือลองใหม่หนึ่งครั้ง?">
    โดยปกตินั่นคือเส้นทางสลับโมเดลแบบสด ไม่ใช่การจัดตารางซ้ำ

    Cron แบบ isolated สามารถคงการส่งต่อโมเดลขณะรันไทม์และลองใหม่เมื่อการรัน
    ที่ใช้งานอยู่โยน `LiveSessionModelSwitchError` การลองใหม่จะคง provider/model
    ที่สลับแล้วไว้ และถ้าการสลับมีการ override โปรไฟล์ยืนยันตัวตนใหม่มาด้วย Cron
    จะคงค่านั้นไว้ก่อนลองใหม่เช่นกัน

    กฎการเลือกที่เกี่ยวข้อง:

    - การ override โมเดลของ hook Gmail ชนะก่อนเมื่อใช้ได้
    - จากนั้นเป็น `model` ต่อแต่ละงาน
    - จากนั้นเป็นการ override โมเดลของเซสชัน Cron ที่จัดเก็บไว้
    - จากนั้นเป็นการเลือกโมเดลปกติของเอเจนต์/ค่าเริ่มต้น

    ลูปการลองใหม่มีขอบเขต หลังจากความพยายามแรกบวกการลองสลับใหม่ 2 ครั้ง
    Cron จะยกเลิกแทนที่จะวนลูปไม่สิ้นสุด

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [CLI ของ Cron](/th/cli/cron).

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง Skills บน Linux ได้อย่างไร?">
    ใช้คำสั่ง `openclaw skills` แบบเนทีฟ หรือวาง Skills ลงใน workspace ของคุณ UI ของ Skills บน macOS ไม่พร้อมใช้งานบน Linux
    เรียกดู Skills ได้ที่ [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    `openclaw skills install` แบบเนทีฟเขียนลงในไดเรกทอรี `skills/`
    ของ workspace ที่ใช้งานอยู่ ติดตั้ง CLI `clawhub` แยกต่างหากเฉพาะเมื่อคุณต้องการเผยแพร่หรือ
    ซิงค์ Skills ของคุณเอง สำหรับการติดตั้งที่ใช้ร่วมกันข้ามเอเจนต์ ให้วาง Skills ไว้ใต้
    `~/.openclaw/skills` และใช้ `agents.defaults.skills` หรือ
    `agents.list[].skills` ถ้าคุณต้องการจำกัดว่าเอเจนต์ใดมองเห็นได้

  </Accordion>

  <Accordion title="OpenClaw สามารถรันงานตามกำหนดเวลาหรือรันต่อเนื่องในเบื้องหลังได้ไหม?">
    ได้ ใช้ตัวจัดตารางของ Gateway:

    - **งาน Cron** สำหรับงานตามกำหนดเวลาหรืองานที่เกิดซ้ำ (คงอยู่ข้ามการรีสตาร์ท)
    - **Heartbeat** สำหรับการตรวจสอบเป็นระยะของ "เซสชันหลัก"
    - **งาน isolated** สำหรับเอเจนต์อัตโนมัติที่โพสต์สรุปหรือนำส่งไปยังแชต

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [ระบบอัตโนมัติและงาน](/th/automation),
    [Heartbeat](/th/gateway/heartbeat).

  </Accordion>

  <Accordion title="ฉันสามารถรัน Skills เฉพาะ Apple macOS จาก Linux ได้ไหม?">
    ไม่ได้โดยตรง Skills สำหรับ macOS ถูกควบคุมด้วย `metadata.openclaw.os` พร้อมไบนารีที่ต้องใช้ และ Skills จะปรากฏใน system prompt เฉพาะเมื่อมีสิทธิ์ใช้งานบน **โฮสต์ Gateway** เท่านั้น บน Linux Skills ที่เป็น `darwin` เท่านั้น (เช่น `apple-notes`, `apple-reminders`, `things-mac`) จะไม่โหลดเว้นแต่คุณจะ override การควบคุมสิทธิ์

    คุณมีรูปแบบที่รองรับสามแบบ:

    **ตัวเลือก A - รัน Gateway บน Mac (ง่ายที่สุด)**
    รัน Gateway ในที่ที่มีไบนารี macOS อยู่ จากนั้นเชื่อมต่อจาก Linux ใน [โหมดระยะไกล](#gateway-ports-already-running-and-remote-mode) หรือผ่าน Tailscale Skills จะโหลดตามปกติเพราะโฮสต์ Gateway คือ macOS

    **ตัวเลือก B - ใช้ Node macOS (ไม่ใช้ SSH)**
    รัน Gateway บน Linux จับคู่ Node macOS (แอปแถบเมนู) และตั้งค่า **Node Run Commands** เป็น "Always Ask" หรือ "Always Allow" บน Mac OpenClaw สามารถถือว่า Skills เฉพาะ macOS มีสิทธิ์ใช้งานได้เมื่อไบนารีที่ต้องใช้อยู่บน Node เอเจนต์จะรัน Skills เหล่านั้นผ่านเครื่องมือ `nodes` หากคุณเลือก "Always Ask" การอนุมัติ "Always Allow" ในพรอมป์จะเพิ่มคำสั่งนั้นลงใน allowlist

    **ตัวเลือก C - พร็อกซีไบนารี macOS ผ่าน SSH (ขั้นสูง)**
    คง Gateway ไว้บน Linux แต่ทำให้ไบนารี CLI ที่ต้องใช้ resolve ไปยัง wrapper SSH ที่รันบน Mac จากนั้น override Skills ให้อนุญาต Linux เพื่อให้ยังมีสิทธิ์ใช้งาน

    1. สร้าง wrapper SSH สำหรับไบนารี (ตัวอย่าง: `memo` สำหรับ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. วาง wrapper บน `PATH` บนโฮสต์ Linux (เช่น `~/bin/memo`)
    3. Override metadata ของ Skills (workspace หรือ `~/.openclaw/skills`) เพื่ออนุญาต Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. เริ่มเซสชันใหม่เพื่อให้ snapshot ของ Skills รีเฟรช

  </Accordion>

  <Accordion title="มีการเชื่อมต่อ Notion หรือ HeyGen ไหม?">
    ยังไม่มีในตัวในตอนนี้

    ตัวเลือก:

    - **Skills / Plugin แบบกำหนดเอง:** เหมาะที่สุดสำหรับการเข้าถึง API ที่เชื่อถือได้ (Notion/HeyGen ทั้งคู่มี API)
    - **ระบบอัตโนมัติของเบราว์เซอร์:** ใช้งานได้โดยไม่ต้องเขียนโค้ด แต่ช้ากว่าและเปราะบางกว่า

    ถ้าคุณต้องการเก็บบริบทต่อไคลเอนต์ (workflow ของเอเจนซี) รูปแบบง่ายๆ คือ:

    - หนึ่งหน้า Notion ต่อไคลเอนต์ (บริบท + ค่ากำหนด + งานที่ใช้งานอยู่)
    - ขอให้เอเจนต์ดึงหน้านั้นเมื่อเริ่มเซสชัน

    ถ้าคุณต้องการการเชื่อมต่อแบบเนทีฟ ให้เปิดคำขอฟีเจอร์หรือสร้าง Skills
    ที่เจาะจง API เหล่านั้น

    ติดตั้ง Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    การติดตั้งแบบเนทีฟจะลงในไดเรกทอรี `skills/` ของ workspace ที่ใช้งานอยู่ สำหรับ Skills ที่ใช้ร่วมกันข้ามเอเจนต์ ให้วางไว้ใน `~/.openclaw/skills/<name>/SKILL.md` หากควรให้มีเพียงบางเอเจนต์เท่านั้นที่เห็นการติดตั้งร่วมกัน ให้กำหนดค่า `agents.defaults.skills` หรือ `agents.list[].skills` Skills บางรายการคาดหวังไบนารีที่ติดตั้งผ่าน Homebrew; บน Linux นั่นหมายถึง Linuxbrew (ดูรายการ FAQ ของ Homebrew Linux ด้านบน) ดู [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config), และ [ClawHub](/th/tools/clawhub).

  </Accordion>

  <Accordion title="ฉันจะใช้ Chrome ที่ลงชื่อเข้าใช้อยู่แล้วกับ OpenClaw ได้อย่างไร?">
    ใช้โปรไฟล์เบราว์เซอร์ `user` ในตัว ซึ่งแนบผ่าน Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    ถ้าคุณต้องการชื่อแบบกำหนดเอง ให้สร้างโปรไฟล์ MCP อย่างชัดเจน:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    เส้นทางนี้สามารถใช้เบราว์เซอร์โฮสต์ในเครื่องหรือ Node เบราว์เซอร์ที่เชื่อมต่ออยู่ได้ หาก Gateway รันอยู่ที่อื่น ให้รันโฮสต์ Node บนเครื่องเบราว์เซอร์หรือใช้ CDP ระยะไกลแทน

    ขีดจำกัดปัจจุบันของ `existing-session` / `user`:

    - การกระทำอ้างอิงด้วย ref ไม่ใช่ CSS selector
    - การอัปโหลดต้องใช้ `ref` / `inputRef` และปัจจุบันรองรับทีละหนึ่งไฟล์
    - `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด, และการกระทำแบบ batch ยังต้องใช้เบราว์เซอร์ที่จัดการโดยระบบหรือโปรไฟล์ CDP ดิบ

  </Accordion>
</AccordionGroup>

## Sandboxing และหน่วยความจำ

<AccordionGroup>
  <Accordion title="มีเอกสาร Sandboxing โดยเฉพาะไหม?">
    มี ดู [Sandboxing](/th/gateway/sandboxing) สำหรับการตั้งค่าเฉพาะ Docker (Gateway ทั้งหมดใน Docker หรืออิมเมจ sandbox) ดู [Docker](/th/install/docker)
  </Accordion>

  <Accordion title="Docker ดูมีข้อจำกัด - ฉันจะเปิดใช้ฟีเจอร์เต็มรูปแบบได้อย่างไร?">
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยเป็นอันดับแรกและรันในฐานะผู้ใช้ `node` ดังนั้นจึงไม่
    รวมแพ็กเกจระบบ, Homebrew, หรือเบราว์เซอร์ที่ bundled มาให้ สำหรับการตั้งค่าที่ครบถ้วนขึ้น:

    - คง `/home/node` ด้วย `OPENCLAW_HOME_VOLUME` เพื่อให้แคชยังอยู่
    - ฝัง system deps ลงในอิมเมจด้วย `OPENCLAW_DOCKER_APT_PACKAGES`
    - ติดตั้งเบราว์เซอร์ Playwright ผ่าน CLI ที่ bundled มาให้:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` และตรวจสอบว่า path นั้นถูกคงไว้

    เอกสาร: [Docker](/th/install/docker), [เบราว์เซอร์](/th/tools/browser).

  </Accordion>

  <Accordion title="ฉันสามารถเก็บ DM ให้เป็นส่วนตัว แต่ทำให้กลุ่มเป็นสาธารณะ/อยู่ใน sandbox ด้วยเอเจนต์เดียวได้ไหม?">
    ได้ - หากทราฟฟิกส่วนตัวของคุณคือ **DM** และทราฟฟิกสาธารณะของคุณคือ **กลุ่ม**

    ใช้ `agents.defaults.sandbox.mode: "non-main"` เพื่อให้เซสชันกลุ่ม/ช่อง (คีย์ non-main) รันใน backend sandbox ที่กำหนดค่าไว้ ขณะที่เซสชัน DM หลักยังอยู่บนโฮสต์ Docker เป็น backend เริ่มต้นหากคุณไม่ได้เลือกอย่างอื่น จากนั้นจำกัดว่าเครื่องมือใดพร้อมใช้งานในเซสชันที่อยู่ใน sandbox ผ่าน `tools.sandbox.tools`

    คำแนะนำการตั้งค่า + ตัวอย่าง config: [กลุ่ม: DM ส่วนตัว + กลุ่มสาธารณะ](/th/channels/groups#pattern-personal-dms-public-groups-single-agent)

    อ้างอิง config หลัก: [การกำหนดค่า Gateway](/th/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ฉันจะ bind โฟลเดอร์โฮสต์เข้าไปใน sandbox ได้อย่างไร?">
    ตั้งค่า `agents.defaults.sandbox.docker.binds` เป็น `["host:path:mode"]` (เช่น `"/home/user/src:/src:ro"`) bind ระดับ global + ต่อเอเจนต์จะถูกรวมกัน; bind ต่อเอเจนต์จะถูกละเว้นเมื่อ `scope: "shared"` ใช้ `:ro` สำหรับสิ่งที่อ่อนไหว และจำไว้ว่า bind จะข้ามกำแพง filesystem ของ sandbox

    OpenClaw ตรวจสอบความถูกต้องของแหล่ง bind เทียบกับทั้ง path ที่ normalized แล้วและ path canonical ที่ resolve ผ่าน ancestor ที่มีอยู่ที่ลึกที่สุด นั่นหมายความว่าการ escape ผ่าน parent ที่เป็น symlink ยัง fail closed แม้ segment สุดท้ายของ path จะยังไม่มีอยู่ และการตรวจสอบ allowed-root ยังคงมีผลหลังการ resolve symlink

    ดู [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts) และ [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) สำหรับตัวอย่างและหมายเหตุด้านความปลอดภัย

  </Accordion>

  <Accordion title="หน่วยความจำทำงานอย่างไร?">
    หน่วยความจำของ OpenClaw เป็นเพียงไฟล์ Markdown ใน workspace ของเอเจนต์:

    - บันทึกรายวันใน `memory/YYYY-MM-DD.md`
    - บันทึกระยะยาวที่คัดสรรไว้ใน `MEMORY.md` (เฉพาะเซสชันหลัก/ส่วนตัว)

    OpenClaw ยังรัน **การ flush หน่วยความจำก่อน Compaction แบบเงียบ** เพื่อเตือนโมเดล
    ให้เขียนบันทึกที่คงทนก่อน auto-compaction สิ่งนี้จะรันเฉพาะเมื่อ workspace
    เขียนได้ (sandbox แบบอ่านอย่างเดียวจะข้ามไป) ดู [หน่วยความจำ](/th/concepts/memory).

  </Accordion>

  <Accordion title="หน่วยความจำลืมสิ่งต่างๆ อยู่เรื่อย ฉันจะทำให้จำไว้ได้อย่างไร?">
    ขอให้บอต **เขียนข้อเท็จจริงลงหน่วยความจำ** บันทึกระยะยาวควรอยู่ใน `MEMORY.md`,
    บริบทระยะสั้นอยู่ใน `memory/YYYY-MM-DD.md`

    นี่ยังเป็นด้านที่เรากำลังปรับปรุง การเตือนโมเดลให้เก็บความทรงจำช่วยได้;
    โมเดลจะรู้ว่าต้องทำอะไร หากยังลืมอยู่ ให้ตรวจสอบว่า Gateway ใช้
    workspace เดียวกันในการรันทุกครั้ง

    เอกสาร: [หน่วยความจำ](/th/concepts/memory), [workspace ของเอเจนต์](/th/concepts/agent-workspace).

  </Accordion>

  <Accordion title="หน่วยความจำคงอยู่ตลอดไปไหม? มีขีดจำกัดอะไรบ้าง?">
    ไฟล์หน่วยความจำอยู่บนดิสก์และคงอยู่จนกว่าคุณจะลบ ขีดจำกัดคือ
    พื้นที่จัดเก็บของคุณ ไม่ใช่โมเดล **บริบทเซสชัน** ยังคงถูกจำกัดด้วย
    context window ของโมเดล ดังนั้นบทสนทนายาวๆ อาจถูก compact หรือ truncate ได้ นั่นคือเหตุผลที่
    มีการค้นหาหน่วยความจำ - มันดึงเฉพาะส่วนที่เกี่ยวข้องกลับเข้าไปในบริบท

    เอกสาร: [หน่วยความจำ](/th/concepts/memory), [บริบท](/th/concepts/context).

  </Accordion>

  <Accordion title="การค้นหาหน่วยความจำเชิงความหมายต้องใช้คีย์ OpenAI API หรือไม่?">
    ต้องใช้เฉพาะเมื่อคุณใช้ **OpenAI embeddings** เท่านั้น Codex OAuth ครอบคลุมการแชต/การเติมข้อความให้สมบูรณ์ และ
    **ไม่ได้** ให้สิทธิ์เข้าถึง embeddings ดังนั้น **การลงชื่อเข้าใช้ด้วย Codex (OAuth หรือ
    การเข้าสู่ระบบ Codex CLI)** จึงไม่ช่วยสำหรับการค้นหาหน่วยความจำเชิงความหมาย OpenAI embeddings
    ยังคงต้องใช้คีย์ API จริง (`OPENAI_API_KEY` หรือ `models.providers.openai.apiKey`)

    หากคุณไม่ได้ตั้งค่าผู้ให้บริการไว้อย่างชัดเจน OpenClaw จะเลือกผู้ให้บริการโดยอัตโนมัติเมื่อ
    สามารถระบุคีย์ API ได้ (โปรไฟล์การยืนยันตัวตน, `models.providers.*.apiKey` หรือ env vars)
    โดยจะให้ความสำคัญกับ OpenAI หากระบุคีย์ OpenAI ได้ มิฉะนั้นจะใช้ Gemini หาก
    ระบุคีย์ Gemini ได้ แล้วจึงเป็น Voyage แล้วจึงเป็น Mistral หากไม่มีคีย์ระยะไกลให้ใช้
    การค้นหาหน่วยความจำจะยังคงปิดใช้งานอยู่จนกว่าคุณจะกำหนดค่า หากคุณมีเส้นทางโมเดลภายในเครื่อง
    ที่กำหนดค่าไว้และมีอยู่ OpenClaw
    จะให้ความสำคัญกับ `local` รองรับ Ollama เมื่อคุณตั้งค่า
    `memorySearch.provider = "ollama"` อย่างชัดเจน

    หากคุณต้องการให้อยู่ในเครื่อง ให้ตั้งค่า `memorySearch.provider = "local"` (และอาจตั้งค่า
    `memorySearch.fallback = "none"` ด้วยก็ได้) หากคุณต้องการ Gemini embeddings ให้ตั้งค่า
    `memorySearch.provider = "gemini"` และระบุ `GEMINI_API_KEY` (หรือ
    `memorySearch.remote.apiKey`) เรารองรับโมเดล embedding แบบ **OpenAI, Gemini, Voyage, Mistral, Ollama หรือ local**
    ดูรายละเอียดการตั้งค่าได้ที่ [หน่วยความจำ](/th/concepts/memory)

  </Accordion>
</AccordionGroup>

## สิ่งต่าง ๆ อยู่ที่ใดบนดิสก์

<AccordionGroup>
  <Accordion title="ข้อมูลทั้งหมดที่ใช้กับ OpenClaw ถูกบันทึกไว้ในเครื่องหรือไม่?">
    ไม่ใช่ - **สถานะของ OpenClaw อยู่ในเครื่อง** แต่ **บริการภายนอกยังคงเห็นสิ่งที่คุณส่งให้บริการเหล่านั้น**

    - **อยู่ในเครื่องโดยค่าเริ่มต้น:** เซสชัน ไฟล์หน่วยความจำ การกำหนดค่า และเวิร์กสเปซอยู่บนโฮสต์ Gateway
      (`~/.openclaw` + ไดเรกทอรีเวิร์กสเปซของคุณ)
    - **อยู่ระยะไกลตามความจำเป็น:** ข้อความที่คุณส่งไปยังผู้ให้บริการโมเดล (Anthropic/OpenAI/ฯลฯ) จะไปยัง
      API ของบริการเหล่านั้น และแพลตฟอร์มแชต (WhatsApp/Telegram/Slack/ฯลฯ) จะเก็บข้อมูลข้อความไว้บน
      เซิร์ฟเวอร์ของตน
    - **คุณควบคุมขอบเขตข้อมูลได้:** การใช้โมเดลภายในเครื่องจะเก็บพรอมป์ไว้บนเครื่องของคุณ แต่ทราฟฟิกของช่องทาง
      ยังคงผ่านเซิร์ฟเวอร์ของช่องทางนั้น

    ที่เกี่ยวข้อง: [เวิร์กสเปซของเอเจนต์](/th/concepts/agent-workspace), [หน่วยความจำ](/th/concepts/memory)

  </Accordion>

  <Accordion title="OpenClaw เก็บข้อมูลไว้ที่ใด?">
    ทุกอย่างอยู่ภายใต้ `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`):

    | เส้นทาง                                                         | วัตถุประสงค์                                                        |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | การกำหนดค่าหลัก (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | การนำเข้า OAuth แบบเดิม (คัดลอกไปยังโปรไฟล์การยืนยันตัวตนเมื่อใช้งานครั้งแรก) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | โปรไฟล์การยืนยันตัวตน (OAuth, คีย์ API และ `keyRef`/`tokenRef` ที่เป็นตัวเลือก) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | เพย์โหลดความลับที่มีไฟล์หนุนหลังซึ่งเป็นตัวเลือกสำหรับผู้ให้บริการ SecretRef แบบ `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ไฟล์ความเข้ากันได้แบบเดิม (ล้างรายการ `api_key` แบบคงที่แล้ว)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | สถานะผู้ให้บริการ (เช่น `whatsapp/<accountId>/creds.json`)          |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | สถานะต่อเอเจนต์ (agentDir + เซสชัน)                                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | ประวัติการสนทนาและสถานะ (ต่อเอเจนต์)                               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | เมตาดาตาเซสชัน (ต่อเอเจนต์)                                        |

    เส้นทางเอเจนต์เดี่ยวแบบเดิม: `~/.openclaw/agent/*` (ย้ายโดย `openclaw doctor`)

    **เวิร์กสเปซ** ของคุณ (AGENTS.md, ไฟล์หน่วยความจำ, skills ฯลฯ) แยกต่างหากและกำหนดค่าผ่าน `agents.defaults.workspace` (ค่าเริ่มต้น: `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title="ควรวาง AGENTS.md / SOUL.md / USER.md / MEMORY.md ไว้ที่ใด?">
    ไฟล์เหล่านี้อยู่ใน **เวิร์กสเปซของเอเจนต์** ไม่ใช่ `~/.openclaw`

    - **เวิร์กสเปซ (ต่อเอเจนต์)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` ที่เป็นตัวเลือก
      `memory.md` ตัวพิมพ์เล็กที่รูทเป็นเพียงอินพุตซ่อมแซมแบบเดิมเท่านั้น; `openclaw doctor --fix`
      สามารถรวมเข้าไปใน `MEMORY.md` ได้เมื่อมีทั้งสองไฟล์อยู่
    - **ไดเรกทอรีสถานะ (`~/.openclaw`)**: การกำหนดค่า, สถานะช่องทาง/ผู้ให้บริการ, โปรไฟล์การยืนยันตัวตน, เซสชัน, บันทึก,
      และ Skills ที่ใช้ร่วมกัน (`~/.openclaw/skills`)

    เวิร์กสเปซค่าเริ่มต้นคือ `~/.openclaw/workspace` กำหนดค่าได้ผ่าน:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    หากบอต "ลืม" หลังรีสตาร์ท ให้ยืนยันว่า Gateway ใช้
    เวิร์กสเปซเดียวกันทุกครั้งที่เปิดใช้งาน (และจำไว้ว่า: โหมดระยะไกลใช้
    เวิร์กสเปซของ **โฮสต์ Gateway** ไม่ใช่แล็ปท็อปในเครื่องของคุณ)

    เคล็ดลับ: หากคุณต้องการพฤติกรรมหรือค่ากำหนดที่คงทน ให้ขอให้บอต **เขียนลงใน
    AGENTS.md หรือ MEMORY.md** แทนการพึ่งพาประวัติแชต

    ดู [เวิร์กสเปซของเอเจนต์](/th/concepts/agent-workspace) และ [หน่วยความจำ](/th/concepts/memory)

  </Accordion>

  <Accordion title="กลยุทธ์การสำรองข้อมูลที่แนะนำ">
    ใส่ **เวิร์กสเปซของเอเจนต์** ของคุณไว้ใน repo git แบบ **ส่วนตัว** และสำรองไว้ที่ใดสักแห่ง
    ที่เป็นส่วนตัว (เช่น GitHub private) วิธีนี้จะเก็บหน่วยความจำ + ไฟล์ AGENTS/SOUL/USER
    และช่วยให้คุณกู้คืน "จิตใจ" ของผู้ช่วยได้ภายหลัง

    อย่า commit สิ่งใดภายใต้ `~/.openclaw` (ข้อมูลรับรอง, เซสชัน, โทเค็น หรือเพย์โหลดความลับที่เข้ารหัส)
    หากคุณต้องการกู้คืนแบบเต็ม ให้สำรองทั้งเวิร์กสเปซและไดเรกทอรีสถานะ
    แยกกัน (ดูคำถามเรื่องการย้ายข้อมูลด้านบน)

    เอกสาร: [เวิร์กสเปซของเอเจนต์](/th/concepts/agent-workspace)

  </Accordion>

  <Accordion title="ฉันจะถอนการติดตั้ง OpenClaw อย่างสมบูรณ์ได้อย่างไร?">
    ดูคู่มือเฉพาะ: [ถอนการติดตั้ง](/th/install/uninstall)
  </Accordion>

  <Accordion title="เอเจนต์สามารถทำงานนอกเวิร์กสเปซได้หรือไม่?">
    ได้ เวิร์กสเปซคือ **cwd ค่าเริ่มต้น** และจุดยึดหน่วยความจำ ไม่ใช่แซนด์บ็อกซ์แบบบังคับตายตัว
    เส้นทางสัมพัทธ์จะ resolve ภายในเวิร์กสเปซ แต่เส้นทางแบบสมบูรณ์สามารถเข้าถึงตำแหน่งอื่น
    บนโฮสต์ได้ เว้นแต่จะเปิดใช้แซนด์บ็อกซ์ หากคุณต้องการการแยกขอบเขต ให้ใช้
    [`agents.defaults.sandbox`](/th/gateway/sandboxing) หรือการตั้งค่าแซนด์บ็อกซ์รายเอเจนต์ หากคุณ
    ต้องการให้ repo เป็นไดเรกทอรีทำงานค่าเริ่มต้น ให้ชี้ `workspace` ของเอเจนต์นั้น
    ไปที่รูทของ repo repo OpenClaw เป็นเพียงซอร์สโค้ด; ให้แยกเวิร์กสเปซไว้ต่างหาก
    เว้นแต่คุณตั้งใจให้เอเจนต์ทำงานภายในนั้น

    ตัวอย่าง (repo เป็น cwd ค่าเริ่มต้น):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="โหมดระยะไกล: ที่เก็บเซสชันอยู่ที่ใด?">
    สถานะเซสชันเป็นของ **โฮสต์ Gateway** หากคุณอยู่ในโหมดระยะไกล ที่เก็บเซสชันที่คุณสนใจอยู่บนเครื่องระยะไกล ไม่ใช่แล็ปท็อปในเครื่องของคุณ ดู [การจัดการเซสชัน](/th/concepts/session)
  </Accordion>
</AccordionGroup>

## พื้นฐานการกำหนดค่า

<AccordionGroup>
  <Accordion title="การกำหนดค่าใช้รูปแบบใด? อยู่ที่ใด?">
    OpenClaw อ่านการกำหนดค่า **JSON5** ที่เป็นตัวเลือกจาก `$OPENCLAW_CONFIG_PATH` (ค่าเริ่มต้น: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    หากไฟล์หายไป จะใช้ค่าเริ่มต้นที่ค่อนข้างปลอดภัย (รวมถึงเวิร์กสเปซค่าเริ่มต้น `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title='ฉันตั้งค่า gateway.bind: "lan" (หรือ "tailnet") แล้วตอนนี้ไม่มีอะไรรับฟัง / UI บอกว่าไม่ได้รับอนุญาต'>
    การ bind ที่ไม่ใช่ loopback **ต้องมีเส้นทางการยืนยันตัวตน Gateway ที่ถูกต้อง** ในทางปฏิบัติหมายถึง:

    - การยืนยันตัวตนด้วยความลับที่ใช้ร่วมกัน: โทเค็นหรือรหัสผ่าน
    - `gateway.auth.mode: "trusted-proxy"` อยู่หลัง reverse proxy ที่รับรู้ตัวตนและกำหนดค่าอย่างถูกต้อง

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    หมายเหตุ:

    - `gateway.remote.token` / `.password` **ไม่ได้** เปิดใช้การยืนยันตัวตน Gateway ภายในเครื่องด้วยตัวเอง
    - เส้นทางการเรียกในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
    - สำหรับการยืนยันตัวตนด้วยรหัสผ่าน ให้ตั้งค่า `gateway.auth.mode: "password"` พร้อม `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`) แทน
    - หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าอย่างชัดเจนผ่าน SecretRef และ resolve ไม่ได้ การ resolve จะล้มเหลวแบบปิด (ไม่มี remote fallback มาปกปิด)
    - การตั้งค่า Control UI แบบใช้ความลับร่วมกันจะยืนยันตัวตนผ่าน `connect.params.auth.token` หรือ `connect.params.auth.password` (จัดเก็บในการตั้งค่าแอป/UI) โหมดที่มีตัวตน เช่น Tailscale Serve หรือ `trusted-proxy` จะใช้ request headers แทน หลีกเลี่ยงการใส่ความลับที่ใช้ร่วมกันใน URL
    - เมื่อใช้ `gateway.auth.mode: "trusted-proxy"` reverse proxy แบบ loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน และมีรายการ loopback ใน `gateway.trustedProxies`

  </Accordion>

  <Accordion title="ทำไมตอนนี้ localhost จึงต้องใช้โทเค็น?">
    OpenClaw บังคับใช้การยืนยันตัวตน Gateway โดยค่าเริ่มต้น รวมถึง loopback ในเส้นทางค่าเริ่มต้นปกติ นั่นหมายถึงการยืนยันตัวตนด้วยโทเค็น: หากไม่มีการกำหนดเส้นทางการยืนยันตัวตนอย่างชัดเจน การเริ่มต้น Gateway จะ resolve เป็นโหมดโทเค็นและสร้างโทเค็นให้อัตโนมัติ โดยบันทึกไว้ที่ `gateway.auth.token` ดังนั้น **ไคลเอนต์ WS ภายในเครื่องต้องยืนยันตัวตน** วิธีนี้ป้องกันไม่ให้กระบวนการภายในเครื่องอื่นเรียก Gateway ได้

    หากคุณต้องการเส้นทางการยืนยันตัวตนแบบอื่น คุณสามารถเลือกโหมดรหัสผ่านอย่างชัดเจนได้ (หรือ `trusted-proxy` สำหรับ reverse proxy ที่รับรู้ตัวตน) หากคุณ **ต้องการจริง ๆ** ให้เปิด loopback ให้ตั้งค่า `gateway.auth.mode: "none"` อย่างชัดเจนใน config ของคุณ Doctor สามารถสร้างโทเค็นให้คุณได้ทุกเมื่อ: `openclaw doctor --generate-gateway-token`

  </Accordion>

  <Accordion title="ฉันต้องรีสตาร์ทหลังเปลี่ยนการกำหนดค่าหรือไม่?">
    Gateway เฝ้าดูการกำหนดค่าและรองรับ hot-reload:

    - `gateway.reload.mode: "hybrid"` (ค่าเริ่มต้น): นำการเปลี่ยนแปลงที่ปลอดภัยไปใช้แบบ hot-apply, รีสตาร์ทสำหรับรายการสำคัญ
    - รองรับ `hot`, `restart`, `off` ด้วยเช่นกัน

  </Accordion>

  <Accordion title="ฉันจะปิดสโลแกน CLI ตลก ๆ ได้อย่างไร?">
    ตั้งค่า `cli.banner.taglineMode` ใน config:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: ซ่อนข้อความสโลแกนแต่คงบรรทัดชื่อ/เวอร์ชันของแบนเนอร์ไว้
    - `default`: ใช้ `All your chats, one OpenClaw.` ทุกครั้ง
    - `random`: หมุนเวียนสโลแกนตลก/ตามฤดูกาล (พฤติกรรมค่าเริ่มต้น)
    - หากคุณไม่ต้องการแบนเนอร์เลย ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

  </Accordion>

  <Accordion title="ฉันจะเปิดใช้การค้นหาเว็บ (และการดึงเว็บ) ได้อย่างไร?">
    `web_fetch` ทำงานได้โดยไม่ต้องใช้คีย์ API ส่วน `web_search` ขึ้นอยู่กับ
    ผู้ให้บริการที่คุณเลือก:

    - ผู้ให้บริการที่มี API หนุนหลัง เช่น Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity และ Tavily ต้องใช้การตั้งค่าคีย์ API ปกติของบริการนั้น
    - Ollama Web Search ไม่ต้องใช้คีย์ แต่ใช้โฮสต์ Ollama ที่คุณกำหนดค่าไว้และต้องใช้ `ollama signin`
    - DuckDuckGo ไม่ต้องใช้คีย์ แต่เป็นการผสานรวมที่ไม่เป็นทางการโดยอิง HTML
    - SearXNG ไม่ต้องใช้คีย์/โฮสต์เองได้; กำหนดค่า `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl`

    **แนะนำ:** เรียกใช้ `openclaw configure --section web` แล้วเลือกผู้ให้บริการ
    ทางเลือกผ่าน environment:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` หรือ `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` หรือ `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    ตอนนี้การตั้งค่าการค้นหาเว็บเฉพาะ provider อยู่ภายใต้ `plugins.entries.<plugin>.config.webSearch.*`
    เส้นทาง provider แบบเดิม `tools.web.search.*` ยังโหลดได้ชั่วคราวเพื่อความเข้ากันได้ แต่ไม่ควรใช้กับการตั้งค่าใหม่
    การตั้งค่า Firecrawl สำหรับ web-fetch fallback อยู่ภายใต้ `plugins.entries.firecrawl.config.webFetch.*`

    หมายเหตุ:

    - หากคุณใช้ allowlists ให้เพิ่ม `web_search`/`web_fetch`/`x_search` หรือ `group:web`
    - `web_fetch` เปิดใช้งานตามค่าเริ่มต้น (เว้นแต่จะปิดไว้อย่างชัดเจน)
    - หากละเว้น `tools.web.fetch.provider` OpenClaw จะตรวจหา provider fallback สำหรับ fetch ตัวแรกที่พร้อมใช้งานจากข้อมูลรับรองที่มีโดยอัตโนมัติ ปัจจุบัน provider ที่มาพร้อมชุดคือ Firecrawl
    - Daemon อ่าน env vars จาก `~/.openclaw/.env` (หรือ service environment)

    เอกสาร: [เครื่องมือเว็บ](/th/tools/web)

  </Accordion>

  <Accordion title="config.apply ล้างการตั้งค่าของฉัน ฉันจะกู้คืนและหลีกเลี่ยงสิ่งนี้ได้อย่างไร">
    `config.apply` จะแทนที่ **การตั้งค่าทั้งหมด** หากคุณส่งออบเจ็กต์บางส่วน ทุกอย่าง
    ที่เหลือจะถูกลบออก

    OpenClaw ปัจจุบันป้องกันการเขียนทับโดยไม่ตั้งใจได้หลายกรณี:

    - การเขียนการตั้งค่าที่ OpenClaw เป็นเจ้าของจะตรวจสอบการตั้งค่าทั้งหมดหลังการเปลี่ยนแปลงก่อนเขียน
    - การเขียนที่ OpenClaw เป็นเจ้าของซึ่งไม่ถูกต้องหรือทำลายข้อมูลจะถูกปฏิเสธและบันทึกเป็น `openclaw.json.rejected.*`
    - หากการแก้ไขโดยตรงทำให้การเริ่มต้นหรือ hot reload เสีย Gateway จะกู้คืนการตั้งค่าที่ทราบว่าดีล่าสุดและบันทึกไฟล์ที่ถูกปฏิเสธเป็น `openclaw.json.clobbered.*`
    - agent หลักได้รับคำเตือนตอนบูตหลังการกู้คืน เพื่อไม่ให้เขียนการตั้งค่าที่ไม่ดีซ้ำอีกโดยไม่ตรวจสอบ

    กู้คืน:

    - ตรวจสอบ `openclaw logs --follow` เพื่อหา `Config auto-restored from last-known-good`, `Config write rejected:` หรือ `config reload restored last-known-good config`
    - ตรวจสอบ `openclaw.json.clobbered.*` หรือ `openclaw.json.rejected.*` ล่าสุดที่อยู่ข้างการตั้งค่าที่ใช้งานอยู่
    - เก็บการตั้งค่าที่กู้คืนและใช้งานอยู่ไว้หากมันทำงานได้ จากนั้นคัดลอกกลับเฉพาะคีย์ที่ต้องการด้วย `openclaw config set` หรือ `config.patch`
    - รัน `openclaw config validate` และ `openclaw doctor`
    - หากคุณไม่มี last-known-good หรือ payload ที่ถูกปฏิเสธ ให้กู้คืนจากข้อมูลสำรอง หรือรัน `openclaw doctor` อีกครั้งแล้วตั้งค่า channels/models ใหม่
    - หากสิ่งนี้ไม่คาดคิด ให้แจ้งบั๊กและแนบการตั้งค่าล่าสุดที่คุณทราบหรือข้อมูลสำรองใดๆ
    - agent เขียนโค้ดภายในเครื่องมักสร้างการตั้งค่าที่ทำงานได้ขึ้นใหม่จาก logs หรือ history ได้

    หลีกเลี่ยง:

    - ใช้ `openclaw config set` สำหรับการเปลี่ยนแปลงเล็กๆ
    - ใช้ `openclaw configure` สำหรับการแก้ไขแบบโต้ตอบ
    - ใช้ `config.schema.lookup` ก่อนเมื่อคุณไม่แน่ใจเกี่ยวกับเส้นทางหรือรูปทรงฟิลด์ที่แน่นอน; เครื่องมือนี้จะคืนโหนด schema แบบตื้นพร้อมสรุปลูกโดยตรงสำหรับเจาะลึก
    - ใช้ `config.patch` สำหรับการแก้ไข RPC บางส่วน; เก็บ `config.apply` ไว้สำหรับการแทนที่การตั้งค่าทั้งหมดเท่านั้น
    - หากคุณใช้เครื่องมือ `gateway` เฉพาะ owner จากการรัน agent เครื่องมือนี้ยังคงปฏิเสธการเขียนไปยัง `tools.exec.ask` / `tools.exec.security` (รวมถึง alias เดิม `tools.bash.*` ที่ normalize ไปยังเส้นทาง exec ที่ได้รับการป้องกันเดียวกัน)

    เอกสาร: [การตั้งค่า](/th/cli/config), [ตั้งค่า](/th/cli/configure), [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันจะรัน Gateway ส่วนกลางพร้อม worker เฉพาะทางข้ามอุปกรณ์ได้อย่างไร">
    รูปแบบทั่วไปคือ **Gateway หนึ่งตัว** (เช่น Raspberry Pi) พร้อม **Node** และ **agent**:

    - **Gateway (ส่วนกลาง):** เป็นเจ้าของ channels (Signal/WhatsApp), routing และ sessions
    - **Node (อุปกรณ์):** Macs/iOS/Android เชื่อมต่อเป็นอุปกรณ์ต่อพ่วงและเปิดเผยเครื่องมือภายในเครื่อง (`system.run`, `canvas`, `camera`)
    - **Agent (worker):** สมอง/พื้นที่ทำงานแยกต่างหากสำหรับบทบาทเฉพาะ (เช่น "Hetzner ops", "Personal data")
    - **Sub-agents:** สร้างงานเบื้องหลังจาก agent หลักเมื่อคุณต้องการการทำงานแบบขนาน
    - **TUI:** เชื่อมต่อกับ Gateway และสลับ agents/sessions

    เอกสาร: [Node](/th/nodes), [การเข้าถึงระยะไกล](/th/gateway/remote), [การกำหนดเส้นทางหลาย Agent](/th/concepts/multi-agent), [Sub-agents](/th/tools/subagents), [TUI](/th/web/tui)

  </Accordion>

  <Accordion title="เบราว์เซอร์ OpenClaw รันแบบ headless ได้หรือไม่">
    ได้ นี่เป็นตัวเลือกการตั้งค่า:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    ค่าเริ่มต้นคือ `false` (headful) Headless มีแนวโน้มกระตุ้นการตรวจสอบ anti-bot ในบางไซต์มากกว่า ดู [เบราว์เซอร์](/th/tools/browser)

    Headless ใช้ **เอนจิน Chromium เดียวกัน** และทำงานได้กับ automation ส่วนใหญ่ (forms, clicks, scraping, logins) ความแตกต่างหลักคือ:

    - ไม่มีหน้าต่างเบราว์เซอร์ที่มองเห็นได้ (ใช้ภาพหน้าจอหากคุณต้องการภาพ)
    - บางไซต์เข้มงวดกับ automation ในโหมด headless มากกว่า (CAPTCHA, anti-bot)
      ตัวอย่างเช่น X/Twitter มักบล็อก sessions แบบ headless

  </Accordion>

  <Accordion title="ฉันจะใช้ Brave สำหรับการควบคุมเบราว์เซอร์ได้อย่างไร">
    ตั้งค่า `browser.executablePath` เป็น binary ของ Brave ของคุณ (หรือเบราว์เซอร์ที่ใช้ Chromium ตัวใดก็ได้) แล้วรีสตาร์ท Gateway
    ดูตัวอย่างการตั้งค่าแบบเต็มใน [เบราว์เซอร์](/th/tools/browser#use-brave-or-another-chromium-based-browser)
  </Accordion>
</AccordionGroup>

## Gateway และ Node ระยะไกล

<AccordionGroup>
  <Accordion title="คำสั่งแพร่กระจายระหว่าง Telegram, gateway และ Node อย่างไร">
    ข้อความ Telegram ถูกจัดการโดย **gateway** gateway จะรัน agent และ
    จากนั้นจึงเรียก Node ผ่าน **Gateway WebSocket** เมื่อจำเป็นต้องใช้เครื่องมือของ Node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node จะไม่เห็น provider traffic ขาเข้า; Node จะได้รับเฉพาะการเรียก RPC ของ Node เท่านั้น

  </Accordion>

  <Accordion title="agent ของฉันจะเข้าถึงคอมพิวเตอร์ของฉันได้อย่างไรหาก Gateway โฮสต์อยู่ระยะไกล">
    คำตอบสั้นๆ: **จับคู่คอมพิวเตอร์ของคุณเป็น Node** Gateway รันอยู่ที่อื่น แต่สามารถ
    เรียกเครื่องมือ `node.*` (screen, camera, system) บนเครื่องภายในของคุณผ่าน Gateway WebSocket ได้

    การตั้งค่าทั่วไป:

    1. รัน Gateway บน host ที่เปิดตลอดเวลา (VPS/home server)
    2. ใส่ Gateway host + คอมพิวเตอร์ของคุณไว้ใน tailnet เดียวกัน
    3. ตรวจสอบให้แน่ใจว่า Gateway WS เข้าถึงได้ (tailnet bind หรือ SSH tunnel)
    4. เปิดแอป macOS ภายในเครื่องและเชื่อมต่อในโหมด **Remote over SSH** (หรือ tailnet โดยตรง)
       เพื่อให้ลงทะเบียนเป็น Node ได้
    5. อนุมัติ Node บน Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ไม่จำเป็นต้องมี TCP bridge แยกต่างหาก; Node เชื่อมต่อผ่าน Gateway WebSocket

    ข้อเตือนด้านความปลอดภัย: การจับคู่ Node macOS อนุญาตให้ใช้ `system.run` บนเครื่องนั้น จับคู่
    เฉพาะอุปกรณ์ที่คุณไว้วางใจ และตรวจสอบ [ความปลอดภัย](/th/gateway/security)

    เอกสาร: [Node](/th/nodes), [โปรโตคอล Gateway](/th/gateway/protocol), [โหมดระยะไกล macOS](/th/platforms/mac/remote), [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="Tailscale เชื่อมต่อแล้วแต่ฉันไม่ได้รับการตอบกลับ ต้องทำอย่างไรต่อ">
    ตรวจสอบพื้นฐาน:

    - Gateway กำลังรัน: `openclaw gateway status`
    - สุขภาพของ Gateway: `openclaw status`
    - สุขภาพของ Channel: `openclaw channels status`

    จากนั้นตรวจสอบ auth และ routing:

    - หากคุณใช้ Tailscale Serve ตรวจสอบให้แน่ใจว่าตั้งค่า `gateway.auth.allowTailscale` ถูกต้อง
    - หากคุณเชื่อมต่อผ่าน SSH tunnel ให้ยืนยันว่า tunnel ภายในเครื่องเปิดอยู่และชี้ไปยังพอร์ตที่ถูกต้อง
    - ยืนยันว่า allowlists ของคุณ (DM หรือกลุ่ม) รวมบัญชีของคุณไว้แล้ว

    เอกสาร: [Tailscale](/th/gateway/tailscale), [การเข้าถึงระยะไกล](/th/gateway/remote), [Channels](/th/channels)

  </Accordion>

  <Accordion title="อินสแตนซ์ OpenClaw สองตัวคุยกันได้หรือไม่ (local + VPS)">
    ได้ ไม่มี bridge "bot-to-bot" ในตัว แต่คุณเชื่อมต่อเองได้หลายวิธี
    ที่เชื่อถือได้:

    **ง่ายที่สุด:** ใช้ช่องแชทปกติที่บอททั้งสองตัวเข้าถึงได้ (Telegram/Slack/WhatsApp)
    ให้ Bot A ส่งข้อความถึง Bot B แล้วให้ Bot B ตอบกลับตามปกติ

    **CLI bridge (ทั่วไป):** รันสคริปต์ที่เรียก Gateway อีกตัวด้วย
    `openclaw agent --message ... --deliver` โดยกำหนดเป้าหมายเป็นแชทที่บอทอีกตัว
    ฟังอยู่ หากบอทตัวหนึ่งอยู่บน VPS ระยะไกล ให้ชี้ CLI ของคุณไปยัง Gateway ระยะไกลนั้น
    ผ่าน SSH/Tailscale (ดู [การเข้าถึงระยะไกล](/th/gateway/remote))

    รูปแบบตัวอย่าง (รันจากเครื่องที่เข้าถึง Gateway เป้าหมายได้):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    เคล็ดลับ: เพิ่ม guardrail เพื่อไม่ให้บอทสองตัววนลูปไม่รู้จบ (ตอบเฉพาะเมื่อถูก mention,
    channel allowlists หรือกฎ "ไม่ตอบกลับข้อความจากบอท")

    เอกสาร: [การเข้าถึงระยะไกล](/th/gateway/remote), [Agent CLI](/th/cli/agent), [Agent send](/th/tools/agent-send)

  </Accordion>

  <Accordion title="ฉันต้องใช้ VPS แยกกันสำหรับ agents หลายตัวหรือไม่">
    ไม่ต้อง Gateway หนึ่งตัวสามารถโฮสต์ agents หลายตัวได้ โดยแต่ละตัวมี workspace, model defaults
    และ routing ของตัวเอง นี่คือการตั้งค่าปกติและถูกกว่าและง่ายกว่าการรัน
    หนึ่ง VPS ต่อ agent มาก

    ใช้ VPS แยกกันเฉพาะเมื่อคุณต้องการการแยกอย่างเข้มงวด (ขอบเขตความปลอดภัย) หรือการตั้งค่า
    ที่แตกต่างกันมากและคุณไม่ต้องการแชร์ มิฉะนั้น ให้ใช้ Gateway เดียวและ
    ใช้ agents หรือ sub-agents หลายตัว

  </Accordion>

  <Accordion title="มีข้อดีในการใช้ Node บนแล็ปท็อปส่วนตัวแทน SSH จาก VPS หรือไม่">
    มี Node เป็นวิธี first-class ในการเข้าถึงแล็ปท็อปของคุณจาก Gateway ระยะไกล และ
    ปลดล็อกได้มากกว่าการเข้าถึง shell Gateway รันบน macOS/Linux (Windows ผ่าน WSL2) และ
    เบา (VPS ขนาดเล็กหรือกล่องระดับ Raspberry Pi ก็เพียงพอ; RAM 4 GB เหลือเฟือ) ดังนั้นการตั้งค่าที่พบบ่อย
    คือ host ที่เปิดตลอดเวลาพร้อมแล็ปท็อปของคุณเป็น Node

    - **ไม่ต้องใช้ SSH ขาเข้า** Node เชื่อมต่อออกไปยัง Gateway WebSocket และใช้การจับคู่อุปกรณ์
    - **การควบคุมการดำเนินการที่ปลอดภัยกว่า** `system.run` ถูกควบคุมโดย allowlists/approvals ของ Node บนแล็ปท็อปเครื่องนั้น
    - **เครื่องมืออุปกรณ์มากขึ้น** Node เปิดเผย `canvas`, `camera` และ `screen` นอกเหนือจาก `system.run`
    - **Browser automation ภายในเครื่อง** เก็บ Gateway ไว้บน VPS แต่รัน Chrome ภายในเครื่องผ่าน Node host บนแล็ปท็อป หรือแนบกับ Chrome ภายในเครื่องบน host ผ่าน Chrome MCP

    SSH เหมาะสำหรับการเข้าถึง shell แบบเฉพาะกิจ แต่ Node เรียบง่ายกว่าสำหรับ workflow ของ agent ต่อเนื่องและ
    device automation

    เอกสาร: [Node](/th/nodes), [Node CLI](/th/cli/nodes), [เบราว์เซอร์](/th/tools/browser)

  </Accordion>

  <Accordion title="Node รัน service ของ gateway หรือไม่">
    ไม่ มีเพียง **gateway หนึ่งตัว** เท่านั้นที่ควรรันต่อ host เว้นแต่คุณตั้งใจรัน profiles ที่แยกกัน (ดู [Gateway หลายตัว](/th/gateway/multiple-gateways)) Node เป็นอุปกรณ์ต่อพ่วงที่เชื่อมต่อ
    ไปยัง gateway (Node iOS/Android หรือ "node mode" ของ macOS ในแอป menubar) สำหรับ host ของ Node แบบ headless
    และการควบคุมด้วย CLI ดู [Node host CLI](/th/cli/node)

    จำเป็นต้องรีสตาร์ทเต็มรูปแบบสำหรับการเปลี่ยนแปลง `gateway`, `discovery` และ `canvasHost`

  </Accordion>

  <Accordion title="มีวิธี API / RPC ในการ apply config หรือไม่">
    มี

    - `config.schema.lookup`: ตรวจสอบ subtree ของการตั้งค่าหนึ่งส่วนพร้อมโหนด schema แบบตื้น, UI hint ที่ตรงกัน และสรุปลูกโดยตรงก่อนเขียน
    - `config.get`: ดึง snapshot + hash ปัจจุบัน
    - `config.patch`: อัปเดตบางส่วนอย่างปลอดภัย (แนะนำสำหรับการแก้ไข RPC ส่วนใหญ่); hot-reload เมื่อทำได้และรีสตาร์ทเมื่อจำเป็น
    - `config.apply`: ตรวจสอบ + แทนที่การตั้งค่าทั้งหมด; hot-reload เมื่อทำได้และรีสตาร์ทเมื่อจำเป็น
    - เครื่องมือ runtime `gateway` เฉพาะ owner ยังปฏิเสธการเขียน `tools.exec.ask` / `tools.exec.security`; alias เดิม `tools.bash.*` จะ normalize ไปยังเส้นทาง exec ที่ได้รับการป้องกันเดียวกัน

  </Accordion>

  <Accordion title="การกำหนดค่าขั้นต่ำที่สมเหตุสมผลสำหรับการติดตั้งครั้งแรก">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    ค่านี้ตั้งค่า workspace ของคุณและจำกัดว่าใครสามารถเรียกใช้บอตได้

  </Accordion>

  <Accordion title="ฉันจะตั้งค่า Tailscale บน VPS และเชื่อมต่อจาก Mac ได้อย่างไร">
    ขั้นตอนขั้นต่ำ:

    1. **ติดตั้งและเข้าสู่ระบบบน VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **ติดตั้งและเข้าสู่ระบบบน Mac ของคุณ**
       - ใช้แอป Tailscale และลงชื่อเข้าใช้ tailnet เดียวกัน
    3. **เปิดใช้ MagicDNS (แนะนำ)**
       - ในคอนโซลผู้ดูแลระบบของ Tailscale ให้เปิดใช้ MagicDNS เพื่อให้ VPS มีชื่อที่เสถียร
    4. **ใช้ชื่อโฮสต์ของ tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    หากคุณต้องการ Control UI โดยไม่ใช้ SSH ให้ใช้ Tailscale Serve บน VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    วิธีนี้ทำให้ gateway ผูกกับ loopback และเปิดเผย HTTPS ผ่าน Tailscale ดู [Tailscale](/th/gateway/tailscale)

  </Accordion>

  <Accordion title="ฉันจะเชื่อมต่อ Node บน Mac กับ Gateway ระยะไกล (Tailscale Serve) ได้อย่างไร">
    Serve เปิดเผย **Gateway Control UI + WS** Node เชื่อมต่อผ่าน endpoint ของ Gateway WS เดียวกัน

    การตั้งค่าที่แนะนำ:

    1. **ตรวจสอบให้แน่ใจว่า VPS และ Mac อยู่ใน tailnet เดียวกัน**
    2. **ใช้แอป macOS ในโหมดระยะไกล** (เป้าหมาย SSH สามารถเป็นชื่อโฮสต์ของ tailnet ได้)
       แอปจะทำ tunnel พอร์ต Gateway และเชื่อมต่อเป็น Node
    3. **อนุมัติ Node** บน gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    เอกสาร: [โปรโตคอล Gateway](/th/gateway/protocol), [การค้นพบ](/th/gateway/discovery), [โหมดระยะไกลของ macOS](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันควรติดตั้งบนแล็ปท็อปเครื่องที่สองหรือแค่เพิ่ม Node">
    หากคุณต้องการแค่ **เครื่องมือ local** (หน้าจอ/กล้อง/exec) บนแล็ปท็อปเครื่องที่สอง ให้เพิ่มเป็น
    **Node** วิธีนี้คง Gateway เดียวไว้และหลีกเลี่ยงการกำหนดค่าซ้ำ เครื่องมือ Node local
    ปัจจุบันรองรับเฉพาะ macOS แต่เราวางแผนจะขยายไปยัง OS อื่น ๆ

    ติดตั้ง Gateway ที่สองเฉพาะเมื่อคุณต้องการ **การแยกอย่างเด็ดขาด** หรือบอตสองตัวที่แยกจากกันทั้งหมด

    เอกสาร: [Node](/th/nodes), [CLI ของ Node](/th/cli/nodes), [Gateway หลายตัว](/th/gateway/multiple-gateways)

  </Accordion>
</AccordionGroup>

## Env vars และการโหลด .env

<AccordionGroup>
  <Accordion title="OpenClaw โหลดตัวแปรสภาพแวดล้อมอย่างไร">
    OpenClaw อ่าน env vars จากโปรเซสแม่ (shell, launchd/systemd, CI ฯลฯ) และโหลดเพิ่มเติมจาก:

    - `.env` จากไดเรกทอรีทำงานปัจจุบัน
    - `.env` สำรองแบบ global จาก `~/.openclaw/.env` (หรือ `$OPENCLAW_STATE_DIR/.env`)

    ไฟล์ `.env` ทั้งสองไฟล์จะไม่เขียนทับ env vars ที่มีอยู่

    คุณยังสามารถกำหนด env vars แบบ inline ใน config ได้ด้วย (ใช้เฉพาะเมื่อไม่มีใน process env):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    ดู [/environment](/th/help/environment) สำหรับลำดับความสำคัญและแหล่งที่มาทั้งหมด

  </Accordion>

  <Accordion title="ฉันเริ่ม Gateway ผ่าน service แล้ว env vars ของฉันหายไป ต้องทำอย่างไร">
    วิธีแก้ที่พบบ่อยสองแบบ:

    1. ใส่คีย์ที่หายไปใน `~/.openclaw/.env` เพื่อให้ถูกอ่านแม้ service จะไม่สืบทอด shell env ของคุณ
    2. เปิดใช้การนำเข้า shell (ความสะดวกแบบ opt-in):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    การตั้งค่านี้จะรัน login shell ของคุณและนำเข้าเฉพาะคีย์ที่คาดไว้และยังไม่มีเท่านั้น (ไม่เขียนทับ) Env var ที่เทียบเท่า:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

  </Accordion>

  <Accordion title='ฉันตั้งค่า COPILOT_GITHUB_TOKEN แล้ว แต่สถานะ models แสดงว่า "Shell env: off." เพราะอะไร'>
    `openclaw models status` รายงานว่าเปิดใช้ **การนำเข้า shell env** อยู่หรือไม่ "Shell env: off"
    **ไม่ได้** หมายความว่า env vars ของคุณหายไป แต่หมายความว่า OpenClaw จะไม่โหลด
    login shell ของคุณโดยอัตโนมัติ

    หาก Gateway รันเป็น service (launchd/systemd) มันจะไม่สืบทอดสภาพแวดล้อมของ shell
    ของคุณ แก้ไขด้วยวิธีใดวิธีหนึ่งต่อไปนี้:

    1. ใส่ token ใน `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. หรือเปิดใช้การนำเข้า shell (`env.shellEnv.enabled: true`)
    3. หรือเพิ่มไว้ในบล็อก `env` ของ config (ใช้เฉพาะเมื่อไม่มีอยู่)

    จากนั้น restart gateway และตรวจสอบอีกครั้ง:

    ```bash
    openclaw models status
    ```

    token ของ Copilot อ่านจาก `COPILOT_GITHUB_TOKEN` (รวมถึง `GH_TOKEN` / `GITHUB_TOKEN`)
    ดู [/concepts/model-providers](/th/concepts/model-providers) และ [/environment](/th/help/environment)

  </Accordion>
</AccordionGroup>

## Sessions และแชตหลายรายการ

<AccordionGroup>
  <Accordion title="ฉันจะเริ่มการสนทนาใหม่ได้อย่างไร">
    ส่ง `/new` หรือ `/reset` เป็นข้อความเดี่ยว ดู [การจัดการ Session](/th/concepts/session)
  </Accordion>

  <Accordion title="Sessions จะ reset อัตโนมัติหรือไม่ถ้าฉันไม่เคยส่ง /new">
    Sessions สามารถหมดอายุได้หลังจาก `session.idleMinutes` แต่ค่าเริ่มต้นคือ **ปิดใช้งาน** (ค่าเริ่มต้น **0**)
    ตั้งค่าเป็นค่าบวกเพื่อเปิดใช้การหมดอายุเมื่อไม่มีการใช้งาน เมื่อเปิดใช้แล้ว ข้อความ **ถัดไป**
    หลังช่วงเวลาว่างจะเริ่ม session id ใหม่สำหรับ chat key นั้น
    การทำเช่นนี้ไม่ลบ transcripts แต่เพียงเริ่ม session ใหม่

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="มีวิธีสร้างทีมของอินสแตนซ์ OpenClaw (CEO หนึ่งคนและ agent หลายตัว) หรือไม่">
    มี ผ่าน **multi-agent routing** และ **sub-agents** คุณสามารถสร้าง agent ผู้ประสานงานหนึ่งตัว
    และ worker agents หลายตัวที่มี workspaces และ models ของตนเอง

    อย่างไรก็ตาม สิ่งนี้เหมาะที่สุดที่จะมองว่าเป็น **การทดลองที่สนุก** มันใช้ token มากและมัก
    มีประสิทธิภาพน้อยกว่าการใช้บอตหนึ่งตัวพร้อม sessions แยกกัน รูปแบบทั่วไปที่เรา
    คาดไว้คือบอตหนึ่งตัวที่คุณคุยด้วย พร้อม sessions ต่าง ๆ สำหรับงานคู่ขนาน บอตนั้น
    ยังสามารถสร้าง sub-agents ได้เมื่อจำเป็น

    เอกสาร: [multi-agent routing](/th/concepts/multi-agent), [Sub-agents](/th/tools/subagents), [CLI ของ Agents](/th/cli/agents)

  </Accordion>

  <Accordion title="ทำไม context จึงถูกตัดกลางงาน ฉันจะป้องกันได้อย่างไร">
    Session context ถูกจำกัดโดยหน้าต่างของ model แชตยาว เอาต์พุตเครื่องมือขนาดใหญ่ หรือไฟล์จำนวนมาก
    อาจทำให้เกิด Compaction หรือการตัดทอน

    สิ่งที่ช่วยได้:

    - ขอให้บอตสรุปสถานะปัจจุบันและเขียนลงไฟล์
    - ใช้ `/compact` ก่อนงานยาว และใช้ `/new` เมื่อเปลี่ยนหัวข้อ
    - เก็บ context สำคัญไว้ใน workspace และขอให้บอตอ่านกลับ
    - ใช้ sub-agents สำหรับงานยาวหรืองานคู่ขนาน เพื่อให้แชตหลักเล็กลง
    - เลือก model ที่มีหน้าต่าง context ใหญ่ขึ้นหากเกิดปัญหานี้บ่อย

  </Accordion>

  <Accordion title="ฉันจะ reset OpenClaw ทั้งหมดแต่ยังคงติดตั้งไว้ได้อย่างไร">
    ใช้คำสั่ง reset:

    ```bash
    openclaw reset
    ```

    การ reset แบบเต็มโดยไม่โต้ตอบ:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    จากนั้นรัน setup อีกครั้ง:

    ```bash
    openclaw onboard --install-daemon
    ```

    หมายเหตุ:

    - Onboarding ยังเสนอ **Reset** หากพบ config ที่มีอยู่ ดู [Onboarding (CLI)](/th/start/wizard)
    - หากคุณใช้ profiles (`--profile` / `OPENCLAW_PROFILE`) ให้ reset แต่ละ state dir (ค่าเริ่มต้นคือ `~/.openclaw-<profile>`)
    - Dev reset: `openclaw gateway --dev --reset` (เฉพาะ dev; ล้าง dev config + credentials + sessions + workspace)

  </Accordion>

  <Accordion title='ฉันได้รับข้อผิดพลาด "context too large" ฉันจะ reset หรือ compact ได้อย่างไร'>
    ใช้วิธีใดวิธีหนึ่งต่อไปนี้:

    - **Compact** (คงการสนทนาไว้แต่สรุป turns เก่า):

      ```
      /compact
      ```

      หรือ `/compact <instructions>` เพื่อกำกับการสรุป

    - **Reset** (session ID ใหม่สำหรับ chat key เดิม):

      ```
      /new
      /reset
      ```

    หากยังเกิดซ้ำ:

    - เปิดใช้หรือปรับ **session pruning** (`agents.defaults.contextPruning`) เพื่อตัดเอาต์พุตเครื่องมือเก่า
    - ใช้ model ที่มีหน้าต่าง context ใหญ่ขึ้น

    เอกสาร: [Compaction](/th/concepts/compaction), [session pruning](/th/concepts/session-pruning), [การจัดการ Session](/th/concepts/session)

  </Accordion>

  <Accordion title='ทำไมฉันเห็น "LLM request rejected: messages.content.tool_use.input field required"'>
    นี่คือข้อผิดพลาดการตรวจสอบของ provider: model ส่งบล็อก `tool_use` โดยไม่มี
    `input` ที่จำเป็น โดยปกติหมายความว่า session history เก่าหรือเสียหาย (มักเกิดหลังจาก threads ยาว
    หรือการเปลี่ยนแปลง tool/schema)

    วิธีแก้: เริ่ม session ใหม่ด้วย `/new` (ข้อความเดี่ยว)

  </Accordion>

  <Accordion title="ทำไมฉันได้รับข้อความ Heartbeat ทุก 30 นาที">
    Heartbeats รันทุก **30m** ตามค่าเริ่มต้น (**1h** เมื่อใช้ OAuth auth) ปรับหรือปิดใช้งานได้:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    หาก `HEARTBEAT.md` มีอยู่แต่โดยผลลัพธ์แล้วว่างเปล่า (มีเพียงบรรทัดว่างและ markdown
    headers เช่น `# Heading`) OpenClaw จะข้ามการรัน heartbeat เพื่อประหยัด API calls
    หากไม่มีไฟล์ heartbeat จะยังรันและ model จะตัดสินใจว่าต้องทำอะไร

    การ override ราย agent ใช้ `agents.list[].heartbeat` เอกสาร: [Heartbeat](/th/gateway/heartbeat)

  </Accordion>

  <Accordion title='ฉันต้องเพิ่ม "bot account" เข้าในกลุ่ม WhatsApp หรือไม่'>
    ไม่ต้อง OpenClaw รันบน **บัญชีของคุณเอง** ดังนั้นถ้าคุณอยู่ในกลุ่ม OpenClaw ก็เห็นกลุ่มนั้นได้
    ตามค่าเริ่มต้น การตอบกลับในกลุ่มจะถูกบล็อกจนกว่าคุณจะอนุญาตผู้ส่ง (`groupPolicy: "allowlist"`)

    หากคุณต้องการให้มีเพียง **คุณ** ที่สามารถเรียกให้ตอบกลับในกลุ่มได้:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ฉันจะรับ JID ของกลุ่ม WhatsApp ได้อย่างไร">
    ตัวเลือก 1 (เร็วที่สุด): tail logs แล้วส่งข้อความทดสอบในกลุ่ม:

    ```bash
    openclaw logs --follow --json
    ```

    มองหา `chatId` (หรือ `from`) ที่ลงท้ายด้วย `@g.us` เช่น:
    `1234567890-1234567890@g.us`

    ตัวเลือก 2 (หากตั้งค่า/allowlist ไว้แล้ว): แสดงรายการกลุ่มจาก config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    เอกสาร: [WhatsApp](/th/channels/whatsapp), [Directory](/th/cli/directory), [Logs](/th/cli/logs)

  </Accordion>

  <Accordion title="ทำไม OpenClaw ไม่ตอบกลับในกลุ่ม">
    สาเหตุทั่วไปสองข้อ:

    - เปิด mention gating อยู่ (ค่าเริ่มต้น) คุณต้อง @mention บอต (หรือ match `mentionPatterns`)
    - คุณกำหนดค่า `channels.whatsapp.groups` โดยไม่มี `"*"` และกลุ่มไม่ได้อยู่ใน allowlist

    ดู [Groups](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages)

  </Accordion>

  <Accordion title="กลุ่ม/threads ใช้ context ร่วมกับ DM หรือไม่">
    แชตโดยตรงจะรวมเข้ากับ session หลักตามค่าเริ่มต้น กลุ่ม/channels มี session keys ของตัวเอง และ topics ของ Telegram / threads ของ Discord เป็น sessions แยกกัน ดู [Groups](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages)
  </Accordion>

  <Accordion title="ฉันสามารถสร้าง workspaces และ agents ได้กี่รายการ">
    ไม่มีขีดจำกัดตายตัว หลักสิบ (หรือแม้แต่หลักร้อย) ก็ใช้ได้ แต่ควรระวัง:

    - **การใช้ดิสก์เพิ่มขึ้น:** sessions + transcripts อยู่ใต้ `~/.openclaw/agents/<agentId>/sessions/`
    - **ค่าใช้จ่าย token:** agents มากขึ้นหมายถึงการใช้ model พร้อมกันมากขึ้น
    - **ภาระงานด้านปฏิบัติการ:** auth profiles, workspaces และ channel routing ต่อ agent

    เคล็ดลับ:

    - เก็บ workspace ที่ **ใช้งานอยู่** หนึ่งรายการต่อ agent (`agents.defaults.workspace`)
    - ตัด sessions เก่า (ลบ JSONL หรือ store entries) หากดิสก์เพิ่มขึ้น
    - ใช้ `openclaw doctor` เพื่อตรวจหา workspaces ที่หลงเหลือและ profile mismatches

  </Accordion>

  <Accordion title="ฉันสามารถรันบอทหรือแชตหลายตัวพร้อมกันได้ไหม (Slack) และควรตั้งค่าอย่างไร?">
    ได้ ใช้ **การกำหนดเส้นทางหลายเอเจนต์** เพื่อรันเอเจนต์หลายตัวแบบแยกจากกัน และกำหนดเส้นทางข้อความขาเข้าตาม
    ช่องทาง/บัญชี/เพียร์ Slack รองรับในฐานะช่องทางและสามารถผูกกับเอเจนต์ที่ระบุได้

    การเข้าถึงเบราว์เซอร์มีพลังมาก แต่ไม่ใช่ "ทำอะไรก็ได้เหมือนมนุษย์" - ระบบป้องกันบอท, CAPTCHA และ MFA
    ยังสามารถบล็อกการทำงานอัตโนมัติได้ เพื่อให้ควบคุมเบราว์เซอร์ได้เสถียรที่สุด ให้ใช้ Chrome MCP ในเครื่องบนโฮสต์
    หรือใช้ CDP บนเครื่องที่รันเบราว์เซอร์จริง

    การตั้งค่าตามแนวทางปฏิบัติที่ดี:

    - โฮสต์ Gateway ที่เปิดตลอดเวลา (VPS/Mac mini)
    - หนึ่งเอเจนต์ต่อหนึ่งบทบาท (การผูก)
    - ผูกช่องทาง Slack กับเอเจนต์เหล่านั้น
    - เบราว์เซอร์ในเครื่องผ่าน Chrome MCP หรือ Node เมื่อจำเป็น

    เอกสาร: [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [Slack](/th/channels/slack),
    [เบราว์เซอร์](/th/tools/browser), [Node](/th/nodes).

  </Accordion>
</AccordionGroup>

## โมเดล, การสลับเมื่อขัดข้อง และโปรไฟล์การยืนยันตัวตน

ถาม-ตอบเรื่องโมเดล — ค่าเริ่มต้น, การเลือก, นามแฝง, การสลับ, การสลับเมื่อขัดข้อง, โปรไฟล์การยืนยันตัวตน —
อยู่ใน [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models).

## Gateway: พอร์ต, "กำลังทำงานอยู่แล้ว" และโหมดระยะไกล

<AccordionGroup>
  <Accordion title="Gateway ใช้พอร์ตใด?">
    `gateway.port` ควบคุมพอร์ตแบบมัลติเพล็กซ์เดี่ยวสำหรับ WebSocket + HTTP (Control UI, hook ฯลฯ)

    ลำดับความสำคัญ:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status ถึงบอกว่า "Runtime: running" แต่ "Connectivity probe: failed"?'>
    เพราะ "running" คือมุมมองของ **supervisor** (launchd/systemd/schtasks) ส่วนการตรวจสอบการเชื่อมต่อคือ CLI ที่เชื่อมต่อกับ WebSocket ของ Gateway จริง

    ใช้ `openclaw gateway status` และเชื่อบรรทัดเหล่านี้:

    - `Probe target:` (URL ที่การตรวจสอบใช้จริง)
    - `Listening:` (สิ่งที่ผูกอยู่กับพอร์ตจริง)
    - `Last gateway error:` (สาเหตุรากที่พบบ่อยเมื่อโปรเซสยังอยู่แต่พอร์ตไม่ได้ฟังอยู่)

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status ถึงแสดง "Config (cli)" และ "Config (service)" ต่างกัน?'>
    คุณกำลังแก้ไขไฟล์กำหนดค่าหนึ่งในขณะที่บริการกำลังใช้อีกไฟล์หนึ่งอยู่ (มักเกิดจาก `--profile` / `OPENCLAW_STATE_DIR` ไม่ตรงกัน)

    วิธีแก้:

    ```bash
    openclaw gateway install --force
    ```

    รันคำสั่งนั้นจาก `--profile` / สภาพแวดล้อมเดียวกับที่คุณต้องการให้บริการใช้

  </Accordion>

  <Accordion title='"another gateway instance is already listening" หมายถึงอะไร?'>
    OpenClaw บังคับใช้ล็อกรันไทม์โดยผูกตัวฟัง WebSocket ทันทีเมื่อเริ่มต้น (ค่าเริ่มต้น `ws://127.0.0.1:18789`) หากการผูกล้มเหลวด้วย `EADDRINUSE` ระบบจะโยน `GatewayLockError` ซึ่งระบุว่ามีอินสแตนซ์อื่นกำลังฟังอยู่แล้ว

    วิธีแก้: หยุดอินสแตนซ์อื่น, ปล่อยพอร์ตให้ว่าง หรือรันด้วย `openclaw gateway --port <port>`

  </Accordion>

  <Accordion title="ฉันจะรัน OpenClaw ในโหมดระยะไกลได้อย่างไร (ไคลเอนต์เชื่อมต่อกับ Gateway ที่อื่น)?">
    ตั้ง `gateway.mode: "remote"` และชี้ไปยัง URL WebSocket ระยะไกล พร้อมข้อมูลยืนยันตัวตนระยะไกลแบบ shared-secret ได้ตามต้องการ:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    หมายเหตุ:

    - `openclaw gateway` จะเริ่มทำงานเฉพาะเมื่อ `gateway.mode` เป็น `local` (หรือคุณส่งแฟล็ก override)
    - แอป macOS เฝ้าดูไฟล์กำหนดค่าและสลับโหมดแบบสดเมื่อค่าเหล่านี้เปลี่ยน
    - `gateway.remote.token` / `.password` เป็นข้อมูลยืนยันตัวตนระยะไกลฝั่งไคลเอนต์เท่านั้น; ไม่ได้เปิดใช้การยืนยันตัวตน Gateway ในเครื่องด้วยตัวเอง

  </Accordion>

  <Accordion title='Control UI บอกว่า "unauthorized" (หรือเชื่อมต่อซ้ำไม่หยุด) ต้องทำอย่างไร?'>
    เส้นทางการยืนยันตัวตนของ Gateway กับวิธีการยืนยันตัวตนของ UI ไม่ตรงกัน

    ข้อเท็จจริง (จากโค้ด):

    - Control UI เก็บโทเค็นไว้ใน `sessionStorage` สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL Gateway ที่เลือก ดังนั้นการรีเฟรชในแท็บเดิมจะยังทำงานต่อได้โดยไม่ต้องกู้คืนการคงอยู่ของโทเค็นใน localStorage ระยะยาว
    - เมื่อเกิด `AUTH_TOKEN_MISMATCH` ไคลเอนต์ที่เชื่อถือได้สามารถลองซ้ำแบบจำกัดหนึ่งครั้งด้วยโทเค็นอุปกรณ์ที่แคชไว้ เมื่อ Gateway ส่งคำใบ้ให้ลองซ้ำ (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)
    - การลองซ้ำด้วยโทเค็นที่แคชไว้นั้นตอนนี้นำขอบเขตที่อนุมัติแล้วซึ่งแคชไว้กับโทเค็นอุปกรณ์มาใช้ซ้ำ ผู้เรียกที่ระบุ `deviceToken` / `scopes` อย่างชัดเจนยังคงใช้ชุดขอบเขตที่ขอไว้แทนการสืบทอดขอบเขตที่แคชไว้
    - นอกเส้นทางการลองซ้ำนั้น ลำดับความสำคัญของการยืนยันตัวตนเมื่อเชื่อมต่อคือ shared token/password ที่ระบุชัดเจนก่อน จากนั้นเป็น `deviceToken` ที่ระบุชัดเจน จากนั้นเป็นโทเค็นอุปกรณ์ที่เก็บไว้ แล้วจึงเป็น bootstrap token
    - การตรวจสอบขอบเขตของ bootstrap token มีคำนำหน้าตามบทบาท allowlist ของผู้ปฏิบัติการ bootstrap ในตัวตอบสนองเฉพาะคำขอของผู้ปฏิบัติการเท่านั้น; บทบาท Node หรือบทบาทอื่นที่ไม่ใช่ผู้ปฏิบัติการยังต้องมีขอบเขตภายใต้คำนำหน้าบทบาทของตัวเอง

    วิธีแก้:

    - เร็วที่สุด: `openclaw dashboard` (พิมพ์ + คัดลอก URL แดชบอร์ด, พยายามเปิด; แสดงคำใบ้ SSH หากเป็นเครื่องไม่มีหน้าจอ)
    - หากคุณยังไม่มีโทเค็น: `openclaw doctor --generate-gateway-token`
    - หากเป็นระยะไกล ให้ทำ tunnel ก่อน: `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/`
    - โหมด shared-secret: ตั้ง `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` จากนั้นวาง secret ที่ตรงกันในการตั้งค่า Control UI
    - โหมด Tailscale Serve: ตรวจสอบให้แน่ใจว่าเปิดใช้ `gateway.auth.allowTailscale` และคุณกำลังเปิด Serve URL ไม่ใช่ URL loopback/tailnet ดิบที่ข้ามเฮดเดอร์ระบุตัวตนของ Tailscale
    - โหมด trusted-proxy: ตรวจสอบให้แน่ใจว่าคุณเข้ามาผ่านพร็อกซีที่รับรู้ตัวตนตามที่กำหนดค่าไว้ ไม่ใช่ URL Gateway ดิบ พร็อกซี loopback บนโฮสต์เดียวกันยังต้องใช้ `gateway.auth.trustedProxy.allowLoopback = true`
    - หากยังไม่ตรงกันหลังลองซ้ำหนึ่งครั้ง ให้หมุนเวียน/อนุมัติโทเค็นอุปกรณ์ที่จับคู่อีกครั้ง:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - หากคำสั่ง rotate นั้นบอกว่าถูกปฏิเสธ ให้ตรวจสอบสองอย่าง:
      - เซสชันอุปกรณ์ที่จับคู่แล้วสามารถหมุนเวียนได้เฉพาะอุปกรณ์ **ของตัวเอง** เว้นแต่จะมี `operator.admin` ด้วย
      - ค่า `--scope` ที่ระบุชัดเจนต้องไม่เกินขอบเขต operator ปัจจุบันของผู้เรียก
    - ยังติดอยู่? รัน `openclaw status --all` และทำตาม [การแก้ปัญหา](/th/gateway/troubleshooting). ดู [แดชบอร์ด](/th/web/dashboard) สำหรับรายละเอียดการยืนยันตัวตน

  </Accordion>

  <Accordion title="ฉันตั้ง gateway.bind เป็น tailnet แต่มันผูกไม่ได้และไม่มีอะไรฟังอยู่">
    การผูก `tailnet` จะเลือก IP ของ Tailscale จากอินเทอร์เฟซเครือข่ายของคุณ (100.64.0.0/10) หากเครื่องไม่ได้อยู่บน Tailscale (หรืออินเทอร์เฟซปิดอยู่) ก็จะไม่มีอะไรให้ผูก

    วิธีแก้:

    - เริ่ม Tailscale บนโฮสต์นั้น (เพื่อให้มีที่อยู่ 100.x) หรือ
    - เปลี่ยนเป็น `gateway.bind: "loopback"` / `"lan"`

    หมายเหตุ: `tailnet` เป็นค่าที่ระบุชัดเจน `auto` จะเลือก loopback ก่อน; ใช้ `gateway.bind: "tailnet"` เมื่อคุณต้องการผูกกับ tailnet เท่านั้น

  </Accordion>

  <Accordion title="ฉันสามารถรัน Gateway หลายตัวบนโฮสต์เดียวกันได้ไหม?">
    โดยปกติไม่ได้ - Gateway หนึ่งตัวสามารถรันช่องทางข้อความและเอเจนต์ได้หลายตัว ใช้ Gateway หลายตัวเฉพาะเมื่อคุณต้องการความซ้ำซ้อน (เช่น บอทกู้คืน) หรือการแยกแบบเข้มงวด

    ได้ แต่คุณต้องแยก:

    - `OPENCLAW_CONFIG_PATH` (กำหนดค่าต่ออินสแตนซ์)
    - `OPENCLAW_STATE_DIR` (สถานะต่ออินสแตนซ์)
    - `agents.defaults.workspace` (การแยกเวิร์กสเปซ)
    - `gateway.port` (พอร์ตไม่ซ้ำกัน)

    การตั้งค่าอย่างรวดเร็ว (แนะนำ):

    - ใช้ `openclaw --profile <name> ...` ต่ออินสแตนซ์ (สร้าง `~/.openclaw-<name>` อัตโนมัติ)
    - ตั้ง `gateway.port` ที่ไม่ซ้ำกันในไฟล์กำหนดค่าของแต่ละโปรไฟล์ (หรือส่ง `--port` สำหรับการรันด้วยตนเอง)
    - ติดตั้งบริการต่อโปรไฟล์: `openclaw --profile <name> gateway install`

    โปรไฟล์ยังต่อท้ายชื่อบริการด้วย (`ai.openclaw.<profile>`; เดิม `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`)
    คู่มือฉบับเต็ม: [Gateway หลายตัว](/th/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008 หมายถึงอะไร?'>
    Gateway เป็น **เซิร์ฟเวอร์ WebSocket** และคาดว่าข้อความแรกสุดจะ
    เป็นเฟรม `connect` หากได้รับอย่างอื่น ระบบจะปิดการเชื่อมต่อ
    ด้วย **code 1008** (การละเมิดนโยบาย)

    สาเหตุที่พบบ่อย:

    - คุณเปิด URL **HTTP** ในเบราว์เซอร์ (`http://...`) แทนไคลเอนต์ WS
    - คุณใช้พอร์ตหรือพาธผิด
    - พร็อกซีหรือ tunnel ลบเฮดเดอร์การยืนยันตัวตนออก หรือส่งคำขอที่ไม่ใช่ Gateway

    วิธีแก้ด่วน:

    1. ใช้ URL WS: `ws://<host>:18789` (หรือ `wss://...` หากเป็น HTTPS)
    2. อย่าเปิดพอร์ต WS ในแท็บเบราว์เซอร์ปกติ
    3. หากเปิดการยืนยันตัวตน ให้ใส่ token/password ในเฟรม `connect`

    หากคุณใช้ CLI หรือ TUI, URL ควรมีลักษณะดังนี้:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    รายละเอียดโปรโตคอล: [โปรโตคอล Gateway](/th/gateway/protocol).

  </Accordion>
</AccordionGroup>

## การบันทึกล็อกและการดีบัก

<AccordionGroup>
  <Accordion title="ล็อกอยู่ที่ไหน?">
    ล็อกไฟล์ (แบบมีโครงสร้าง):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    คุณสามารถตั้งพาธคงที่ผ่าน `logging.file` ระดับล็อกไฟล์ควบคุมด้วย `logging.level` ความละเอียดของคอนโซลควบคุมด้วย `--verbose` และ `logging.consoleLevel`

    วิธี tail ล็อกที่เร็วที่สุด:

    ```bash
    openclaw logs --follow
    ```

    ล็อกของบริการ/supervisor (เมื่อ Gateway รันผ่าน launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` และ `gateway.err.log` (ค่าเริ่มต้น: `~/.openclaw/logs/...`; โปรไฟล์ใช้ `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    ดู [การแก้ปัญหา](/th/gateway/troubleshooting) สำหรับข้อมูลเพิ่มเติม

  </Accordion>

  <Accordion title="ฉันจะเริ่ม/หยุด/รีสตาร์ตบริการ Gateway ได้อย่างไร?">
    ใช้ตัวช่วย Gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณรัน Gateway ด้วยตนเอง `openclaw gateway --force` สามารถเรียกคืนพอร์ตได้ ดู [Gateway](/th/gateway).

  </Accordion>

  <Accordion title="ฉันปิดเทอร์มินัลบน Windows ไปแล้ว - จะรีสตาร์ต OpenClaw ได้อย่างไร?">
    มี **สองโหมดติดตั้งบน Windows**:

    **1) WSL2 (แนะนำ):** Gateway รันอยู่ใน Linux

    เปิด PowerShell, เข้า WSL แล้วรีสตาร์ต:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณไม่เคยติดตั้งบริการ ให้เริ่มใน foreground:

    ```bash
    openclaw gateway run
    ```

    **2) Native Windows (ไม่แนะนำ):** Gateway รันโดยตรงใน Windows

    เปิด PowerShell แล้วรัน:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณรันด้วยตนเอง (ไม่มีบริการ) ให้ใช้:

    ```powershell
    openclaw gateway run
    ```

    เอกสาร: [Windows (WSL2)](/th/platforms/windows), [คู่มือการรันบริการ Gateway](/th/gateway).

  </Accordion>

  <Accordion title="Gateway เปิดอยู่แต่ไม่มีคำตอบกลับมาเลย ควรตรวจสอบอะไร?">
    เริ่มจากการตรวจสุขภาพอย่างรวดเร็ว:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    สาเหตุที่พบบ่อย:

    - การยืนยันตัวตนของโมเดลไม่ได้โหลดบน **โฮสต์ Gateway** (ตรวจสอบ `models status`)
    - การจับคู่ช่องทาง/allowlist บล็อกคำตอบ (ตรวจสอบการกำหนดค่าช่องทาง + ล็อก)
    - WebChat/Dashboard เปิดอยู่โดยไม่มีโทเค็นที่ถูกต้อง

    หากคุณใช้งานระยะไกล ให้ยืนยันว่า tunnel/การเชื่อมต่อ Tailscale เปิดอยู่และ
    WebSocket ของ Gateway เข้าถึงได้

    เอกสาร: [ช่องทาง](/th/channels), [การแก้ปัญหา](/th/gateway/troubleshooting), [การเข้าถึงระยะไกล](/th/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - ต้องทำอย่างไร?'>
    โดยปกติหมายความว่า UI สูญเสียการเชื่อมต่อ WebSocket ตรวจสอบ:

    1. Gateway ทำงานอยู่หรือไม่? `openclaw gateway status`
    2. Gateway มีสถานะปกติหรือไม่? `openclaw status`
    3. UI มีโทเค็นที่ถูกต้องหรือไม่? `openclaw dashboard`
    4. ถ้าเป็นแบบรีโมต ลิงก์ tunnel/Tailscale เชื่อมต่ออยู่หรือไม่?

    จากนั้น tail logs:

    ```bash
    openclaw logs --follow
    ```

    เอกสาร: [แดชบอร์ด](/th/web/dashboard), [การเข้าถึงระยะไกล](/th/gateway/remote), [การแก้ไขปัญหา](/th/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands ล้มเหลว ควรตรวจสอบอะไร?">
    เริ่มจาก logs และสถานะช่องทาง:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    จากนั้นเทียบกับข้อผิดพลาด:

    - `BOT_COMMANDS_TOO_MUCH`: เมนู Telegram มีรายการมากเกินไป OpenClaw ตัดให้เหลือตามขีดจำกัดของ Telegram และลองใหม่ด้วยคำสั่งที่น้อยลงแล้ว แต่บางรายการในเมนูยังต้องถูกนำออก ลดคำสั่ง plugin/skill/custom หรือปิด `channels.telegram.commands.native` ถ้าคุณไม่ต้องการเมนู
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` หรือข้อผิดพลาดเครือข่ายที่คล้ายกัน: ถ้าคุณใช้งานบน VPS หรืออยู่หลัง proxy ให้ยืนยันว่าอนุญาต HTTPS ขาออกและ DNS ทำงานกับ `api.telegram.org`

    ถ้า Gateway อยู่บนเครื่องรีโมต ตรวจสอบให้แน่ใจว่าคุณกำลังดู logs บนโฮสต์ของ Gateway

    เอกสาร: [Telegram](/th/channels/telegram), [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI ไม่แสดงผลลัพธ์ ควรตรวจสอบอะไร?">
    ก่อนอื่นยืนยันว่าเข้าถึง Gateway ได้และเอเจนต์ทำงานได้:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    ใน TUI ให้ใช้ `/status` เพื่อดูสถานะปัจจุบัน ถ้าคุณคาดหวังการตอบกลับในช่องทางแชท
    ตรวจสอบให้แน่ใจว่าเปิดการส่งไว้แล้ว (`/deliver on`).

    เอกสาร: [TUI](/th/web/tui), [คำสั่ง Slash](/th/tools/slash-commands).

  </Accordion>

  <Accordion title="ฉันจะหยุดแล้วเริ่ม Gateway ใหม่ทั้งหมดได้อย่างไร?">
    ถ้าคุณติดตั้ง service ไว้:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    คำสั่งนี้หยุด/เริ่ม **supervised service** (launchd บน macOS, systemd บน Linux)
    ใช้เมื่อ Gateway ทำงานอยู่เบื้องหลังในฐานะ daemon

    ถ้าคุณรันอยู่ใน foreground ให้หยุดด้วย Ctrl-C แล้ว:

    ```bash
    openclaw gateway run
    ```

    เอกสาร: [คู่มือปฏิบัติการ Gateway service](/th/gateway).

  </Accordion>

  <Accordion title="อธิบายแบบง่าย: openclaw gateway restart เทียบกับ openclaw gateway">
    - `openclaw gateway restart`: รีสตาร์ท **background service** (launchd/systemd)
    - `openclaw gateway`: รัน gateway **ใน foreground** สำหรับเซสชันเทอร์มินัลนี้

    ถ้าคุณติดตั้ง service ไว้ ให้ใช้คำสั่ง gateway ใช้ `openclaw gateway` เมื่อ
    คุณต้องการรันแบบครั้งเดียวใน foreground

  </Accordion>

  <Accordion title="วิธีที่เร็วที่สุดในการดูรายละเอียดเพิ่มเมื่อบางอย่างล้มเหลว">
    เริ่ม Gateway ด้วย `--verbose` เพื่อดูรายละเอียดใน console เพิ่มขึ้น จากนั้นตรวจสอบไฟล์ log สำหรับการยืนยันตัวตนของช่องทาง การ routing โมเดล และข้อผิดพลาด RPC
  </Accordion>
</AccordionGroup>

## สื่อและไฟล์แนบ

<AccordionGroup>
  <Accordion title="skill ของฉันสร้างรูปภาพ/PDF แล้ว แต่ไม่มีอะไรถูกส่ง">
    ไฟล์แนบขาออกจากเอเจนต์ต้องมีบรรทัด `MEDIA:<path-or-url>` (อยู่ในบรรทัดของตัวเอง) ดู [การตั้งค่า OpenClaw assistant](/th/start/openclaw) และ [การส่งของเอเจนต์](/th/tools/agent-send)

    การส่งด้วย CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    ตรวจสอบด้วยว่า:

    - ช่องทางเป้าหมายรองรับสื่อขาออกและไม่ได้ถูกบล็อกโดย allowlists
    - ไฟล์อยู่ภายในขีดจำกัดขนาดของ provider (รูปภาพจะถูกปรับขนาดให้สูงสุด 2048px)
    - `tools.fs.workspaceOnly=true` จำกัดการส่ง path ในเครื่องไว้ที่ workspace, temp/media-store และไฟล์ที่ผ่านการตรวจสอบโดย sandbox
    - `tools.fs.workspaceOnly=false` อนุญาตให้ `MEDIA:` ส่งไฟล์ในเครื่องของโฮสต์ที่เอเจนต์อ่านได้อยู่แล้ว แต่เฉพาะสื่อและชนิดเอกสารที่ปลอดภัยเท่านั้น (รูปภาพ เสียง วิดีโอ PDF และเอกสาร Office) ไฟล์ plain text และไฟล์ที่ดูเหมือนมีความลับยังคงถูกบล็อก

    ดู [รูปภาพ](/th/nodes/images).

  </Accordion>
</AccordionGroup>

## ความปลอดภัยและการควบคุมการเข้าถึง

<AccordionGroup>
  <Accordion title="การเปิด OpenClaw ให้รับ DM ขาเข้าปลอดภัยหรือไม่?">
    ปฏิบัติต่อ DM ขาเข้าเป็นข้อมูลเข้าที่ไม่น่าเชื่อถือ ค่าเริ่มต้นออกแบบมาเพื่อลดความเสี่ยง:

    - พฤติกรรมเริ่มต้นบนช่องทางที่รองรับ DM คือ **pairing**:
      - ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing; บอตจะไม่ประมวลผลข้อความของพวกเขา
      - อนุมัติด้วย: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - คำขอที่รอดำเนินการถูกจำกัดไว้ที่ **3 ต่อช่องทาง**; ตรวจสอบ `openclaw pairing list --channel <channel> [--account <id>]` หากรหัสไม่มาถึง
    - การเปิด DM แบบสาธารณะต้อง opt-in อย่างชัดเจน (`dmPolicy: "open"` และ allowlist `"*"`)

    รัน `openclaw doctor` เพื่อแสดงนโยบาย DM ที่เสี่ยง

  </Accordion>

  <Accordion title="prompt injection เป็นเรื่องที่ต้องกังวลเฉพาะบอตสาธารณะหรือไม่?">
    ไม่ใช่ prompt injection เกี่ยวกับ **เนื้อหาที่ไม่น่าเชื่อถือ** ไม่ใช่แค่ว่าใครสามารถ DM บอตได้
    ถ้า assistant ของคุณอ่านเนื้อหาภายนอก (web search/fetch, หน้า browser, อีเมล,
    เอกสาร, ไฟล์แนบ, logs ที่วางเข้ามา) เนื้อหานั้นอาจมีคำสั่งที่พยายาม
    hijack โมเดลได้ สิ่งนี้เกิดขึ้นได้แม้ว่า **คุณจะเป็นผู้ส่งเพียงคนเดียว**

    ความเสี่ยงที่ใหญ่ที่สุดคือเมื่อเปิดใช้เครื่องมือ: โมเดลอาจถูกหลอกให้
    exfiltrate context หรือเรียกเครื่องมือแทนคุณ ลด blast radius โดย:

    - ใช้เอเจนต์ "reader" แบบอ่านอย่างเดียวหรือปิดเครื่องมือเพื่อสรุปเนื้อหาที่ไม่น่าเชื่อถือ
    - ปิด `web_search` / `web_fetch` / `browser` สำหรับเอเจนต์ที่เปิดใช้เครื่องมือ
    - ปฏิบัติต่อข้อความจากไฟล์/เอกสารที่ decoded แล้วว่าไม่น่าเชื่อถือเช่นกัน: OpenResponses
      `input_file` และการดึงข้อมูลจาก media-attachment จะห่อข้อความที่ดึงออกมาด้วย
      เครื่องหมายขอบเขต external-content ที่ชัดเจน แทนการส่งข้อความไฟล์ดิบ
    - ใช้ sandboxing และ allowlists เครื่องมือแบบเข้มงวด

    รายละเอียด: [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="บอตของฉันควรมีอีเมล บัญชี GitHub หรือหมายเลขโทรศัพท์ของตัวเองหรือไม่?">
    ควร สำหรับการตั้งค่าส่วนใหญ่ การแยกบอตด้วยบัญชีและหมายเลขโทรศัพท์ต่างหาก
    จะลด blast radius หากเกิดข้อผิดพลาด และยังทำให้หมุนเวียน
    credentials หรือเพิกถอนการเข้าถึงได้ง่ายขึ้นโดยไม่กระทบบัญชีส่วนตัวของคุณ

    เริ่มจากเล็ก ๆ ให้สิทธิ์เข้าถึงเฉพาะเครื่องมือและบัญชีที่คุณต้องใช้จริง แล้วค่อยขยาย
    ภายหลังหากจำเป็น

    เอกสาร: [ความปลอดภัย](/th/gateway/security), [Pairing](/th/channels/pairing).

  </Accordion>

  <Accordion title="ฉันให้มันทำงานอัตโนมัติกับข้อความของฉันได้ไหม และปลอดภัยหรือไม่?">
    เรา **ไม่** แนะนำให้ให้อิสระเต็มรูปแบบกับข้อความส่วนตัวของคุณ รูปแบบที่ปลอดภัยที่สุดคือ:

    - เก็บ DM ไว้ใน **โหมด pairing** หรือ allowlist ที่เข้มงวด
    - ใช้ **หมายเลขหรือบัญชีแยกต่างหาก** หากคุณต้องการให้มันส่งข้อความแทนคุณ
    - ให้มันร่างก่อน แล้ว **อนุมัติก่อนส่ง**

    ถ้าคุณต้องการทดลอง ให้ทำบนบัญชีเฉพาะและแยกออกจากอย่างอื่น ดู
    [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="ฉันใช้โมเดลที่ถูกกว่าสำหรับงาน personal assistant ได้ไหม?">
    ได้ **ถ้า** เอเจนต์เป็นแบบแชทเท่านั้นและข้อมูลเข้ามาจากแหล่งที่เชื่อถือได้ ระดับโมเดลที่เล็กกว่า
    เสี่ยงต่อการถูก hijack ด้วยคำสั่งมากกว่า จึงควรหลีกเลี่ยงสำหรับเอเจนต์ที่เปิดใช้เครื่องมือ
    หรือเมื่ออ่านข้อความที่ไม่น่าเชื่อถือ ถ้าคุณจำเป็นต้องใช้โมเดลที่เล็กกว่า ให้ล็อก
    เครื่องมือและรันภายใน sandbox ดู [ความปลอดภัย](/th/gateway/security).
  </Accordion>

  <Accordion title="ฉันรัน /start ใน Telegram แต่ไม่ได้รับรหัส pairing">
    รหัส pairing จะถูกส่ง **เฉพาะ** เมื่อผู้ส่งที่ไม่รู้จักส่งข้อความถึงบอตและ
    เปิดใช้ `dmPolicy: "pairing"` อยู่เท่านั้น `/start` เพียงอย่างเดียวไม่สร้างรหัส

    ตรวจสอบคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list telegram
    ```

    ถ้าคุณต้องการเข้าถึงทันที ให้เพิ่ม sender id ของคุณใน allowlist หรือตั้ง `dmPolicy: "open"`
    สำหรับบัญชีนั้น

  </Accordion>

  <Accordion title="WhatsApp: มันจะส่งข้อความหาผู้ติดต่อของฉันไหม? pairing ทำงานอย่างไร?">
    ไม่ นโยบาย DM เริ่มต้นของ WhatsApp คือ **pairing** ผู้ส่งที่ไม่รู้จักจะได้รับเพียงรหัส pairing และข้อความของพวกเขา **จะไม่ถูกประมวลผล** OpenClaw จะตอบเฉพาะแชทที่ได้รับ หรือการส่งที่คุณเรียกอย่างชัดเจนเท่านั้น

    อนุมัติ pairing ด้วย:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    แสดงรายการคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list whatsapp
    ```

    prompt หมายเลขโทรศัพท์ใน wizard: ใช้เพื่อตั้งค่า **allowlist/owner** ของคุณ เพื่อให้ DM ของคุณเองได้รับอนุญาต ไม่ได้ใช้สำหรับการส่งอัตโนมัติ ถ้าคุณรันบนหมายเลข WhatsApp ส่วนตัว ให้ใช้หมายเลขนั้นและเปิด `channels.whatsapp.selfChatMode`

  </Accordion>
</AccordionGroup>

## คำสั่งแชท การยกเลิกงาน และ "มันไม่ยอมหยุด"

<AccordionGroup>
  <Accordion title="ฉันจะหยุดไม่ให้ข้อความระบบภายในแสดงในแชทได้อย่างไร?">
    ข้อความภายในหรือข้อความเครื่องมือส่วนใหญ่จะแสดงเฉพาะเมื่อเปิดใช้ **verbose**, **trace** หรือ **reasoning**
    สำหรับเซสชันนั้น

    แก้ในแชทที่คุณเห็น:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    หากยังมีข้อความมากเกินไป ให้ตรวจสอบการตั้งค่าเซสชันใน Control UI และตั้ง verbose
    เป็น **inherit** และยืนยันด้วยว่าคุณไม่ได้ใช้โปรไฟล์บอตที่ตั้ง `verboseDefault`
    เป็น `on` ใน config

    เอกสาร: [Thinking และ verbose](/th/tools/thinking), [ความปลอดภัย](/th/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="ฉันจะหยุด/ยกเลิกงานที่กำลังรันได้อย่างไร?">
    ส่งข้อความเหล่านี้รายการใดรายการหนึ่ง **เป็นข้อความเดี่ยว** (ไม่มี slash):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    ข้อความเหล่านี้เป็น abort triggers (ไม่ใช่คำสั่ง slash)

    สำหรับกระบวนการเบื้องหลัง (จาก exec tool) คุณสามารถขอให้เอเจนต์รัน:

    ```
    process action:kill sessionId:XXX
    ```

    ภาพรวมคำสั่ง Slash: ดู [คำสั่ง Slash](/th/tools/slash-commands).

    คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความ **เดี่ยว** ที่ขึ้นต้นด้วย `/` แต่ shortcut บางรายการ (เช่น `/status`) ใช้แบบ inline ได้เช่นกันสำหรับผู้ส่งที่อยู่ใน allowlist

  </Accordion>

  <Accordion title='ฉันจะส่งข้อความ Discord จาก Telegram ได้อย่างไร? ("Cross-context messaging denied")'>
    OpenClaw บล็อกการส่งข้อความ **ข้าม provider** ตามค่าเริ่มต้น ถ้า tool call ถูกผูกกับ
    Telegram มันจะไม่ส่งไป Discord เว้นแต่คุณจะอนุญาตอย่างชัดเจน

    เปิดใช้การส่งข้อความข้าม provider สำหรับเอเจนต์:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    รีสตาร์ท gateway หลังแก้ไข config

  </Accordion>

  <Accordion title='ทำไมเหมือนบอต "เพิกเฉย" ต่อข้อความที่ส่งรัว ๆ?'>
    โหมด Queue ควบคุมว่าข้อความใหม่โต้ตอบกับ run ที่กำลังดำเนินอยู่อย่างไร ใช้ `/queue` เพื่อเปลี่ยนโหมด:

    - `steer` - จัดคิว steering ที่รอดำเนินการทั้งหมดสำหรับขอบเขตโมเดลถัดไปใน run ปัจจุบัน
    - `queue` - steering แบบเดิมทีละรายการ
    - `followup` - รันข้อความทีละรายการ
    - `collect` - รวมข้อความเป็นชุดและตอบครั้งเดียว
    - `steer-backlog` - steer ตอนนี้ แล้วประมวลผล backlog
    - `interrupt` - ยกเลิก run ปัจจุบันและเริ่มใหม่

    โหมดเริ่มต้นคือ `steer` คุณสามารถเพิ่มตัวเลือกอย่าง `debounce:0.5s cap:25 drop:summarize` สำหรับโหมด followup ได้ ดู [Command queue](/th/concepts/queue) และ [Steering queue](/th/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## เบ็ดเตล็ด

<AccordionGroup>
  <Accordion title='โมเดลเริ่มต้นสำหรับ Anthropic เมื่อใช้คีย์ API คืออะไร?'>
    ใน OpenClaw ข้อมูลประจำตัวและการเลือกโมเดลจะแยกออกจากกัน การตั้งค่า `ANTHROPIC_API_KEY` (หรือการจัดเก็บคีย์ API ของ Anthropic ในโปรไฟล์การยืนยันตัวตน) จะเปิดใช้การยืนยันตัวตน แต่โมเดลเริ่มต้นจริงคือโมเดลที่คุณกำหนดค่าไว้ใน `agents.defaults.model.primary` (เช่น `anthropic/claude-sonnet-4-6` หรือ `anthropic/claude-opus-4-6`) หากคุณเห็น `No credentials found for profile "anthropic:default"` หมายความว่า Gateway ไม่พบข้อมูลประจำตัวของ Anthropic ใน `auth-profiles.json` ที่คาดไว้สำหรับเอเจนต์ที่กำลังทำงานอยู่
  </Accordion>
</AccordionGroup>

---

ยังติดอยู่ใช่ไหม? ถามใน [Discord](https://discord.com/invite/clawd) หรือเปิด [การสนทนาใน GitHub](https://github.com/openclaw/openclaw/discussions)

## ที่เกี่ยวข้อง

- [คำถามที่พบบ่อยสำหรับการเรียกใช้ครั้งแรก](/th/help/faq-first-run) — การติดตั้ง การเริ่มต้นใช้งาน การยืนยันตัวตน การสมัครสมาชิก ความล้มเหลวในช่วงแรก
- [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models) — การเลือกโมเดล การสลับไปใช้ตัวสำรอง โปรไฟล์การยืนยันตัวตน
- [การแก้ไขปัญหา](/th/help/troubleshooting) — การคัดแยกปัญหาโดยเริ่มจากอาการ
