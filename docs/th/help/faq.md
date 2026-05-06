---
read_when:
    - การตอบคำถามสนับสนุนทั่วไปเกี่ยวกับการตั้งค่า การติดตั้ง การเริ่มต้นใช้งาน หรือรันไทม์
    - คัดแยกปัญหาที่ผู้ใช้รายงานก่อนการดีบักเชิงลึก
summary: คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า การกำหนดค่า และการใช้งาน OpenClaw
title: คำถามที่พบบ่อย
x-i18n:
    generated_at: "2026-05-06T17:56:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d5724af921ab660da3d4453779f269bda440fb27518638541312e489f203318
    source_path: help/faq.md
    workflow: 16
---

คำตอบแบบรวดเร็วพร้อมการแก้ปัญหาเชิงลึกสำหรับการตั้งค่าใช้งานจริง (การพัฒนาในเครื่อง, VPS, หลายเอเจนต์, OAuth/API keys, การสลับโมเดลเมื่อขัดข้อง) สำหรับการวินิจฉัยขณะรันไทม์ ดู [การแก้ปัญหา](/th/gateway/troubleshooting) สำหรับเอกสารอ้างอิงการตั้งค่าทั้งหมด ดู [การกำหนดค่า](/th/gateway/configuration)

## 60 วินาทีแรกเมื่อมีบางอย่างเสีย

1. **สถานะด่วน (ตรวจสอบก่อน)**

   ```bash
   openclaw status
   ```

   สรุปในเครื่องอย่างรวดเร็ว: OS + อัปเดต, การเข้าถึง gateway/service, agents/sessions, การตั้งค่า provider + ปัญหารันไทม์ (เมื่อเข้าถึง gateway ได้)

2. **รายงานที่วางแชร์ได้ (ปลอดภัยต่อการแชร์)**

   ```bash
   openclaw status --all
   ```

   การวินิจฉัยแบบอ่านอย่างเดียวพร้อมท้าย log (ปกปิด tokens แล้ว)

3. **สถานะ Daemon + พอร์ต**

   ```bash
   openclaw gateway status
   ```

   แสดง supervisor runtime เทียบกับการเข้าถึง RPC, URL เป้าหมายของ probe และการตั้งค่าที่ service น่าจะใช้

4. **Probe เชิงลึก**

   ```bash
   openclaw status --deep
   ```

   รัน gateway health probe แบบสด รวมถึง channel probes เมื่อรองรับ
   (ต้องมี gateway ที่เข้าถึงได้) ดู [Health](/th/gateway/health)

5. **ติดตาม log ล่าสุด**

   ```bash
   openclaw logs --follow
   ```

   ถ้า RPC ล่ม ให้ใช้แทนด้วย:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   File logs แยกจาก service logs; ดู [Logging](/th/logging) และ [การแก้ปัญหา](/th/gateway/troubleshooting)

6. **รัน doctor (การซ่อมแซม)**

   ```bash
   openclaw doctor
   ```

   ซ่อมแซม/ย้าย config/state + รัน health checks ดู [Doctor](/th/gateway/doctor)

7. **สแนปช็อต Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   ขอ snapshot แบบเต็มจาก gateway ที่กำลังรันอยู่ (เฉพาะ WS) ดู [Health](/th/gateway/health)

## เริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก

ถามตอบสำหรับการรันครั้งแรก — การติดตั้ง, onboard, เส้นทาง auth, subscriptions, ความล้มเหลวเริ่มต้น —
อยู่ใน [FAQ การรันครั้งแรก](/th/help/faq-first-run)

## OpenClaw คืออะไร?

<AccordionGroup>
  <Accordion title="OpenClaw คืออะไร ในหนึ่งย่อหน้า?">
    OpenClaw คือผู้ช่วย AI ส่วนตัวที่คุณรันบนอุปกรณ์ของคุณเอง มันตอบกลับบนพื้นที่สนทนาที่คุณใช้อยู่แล้ว (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat และ bundled channel plugins เช่น QQ Bot) และยังทำเสียง + Canvas แบบสดบนแพลตฟอร์มที่รองรับได้ด้วย **Gateway** คือ control plane ที่เปิดทำงานตลอดเวลา; ผู้ช่วยคือผลิตภัณฑ์
  </Accordion>

  <Accordion title="คุณค่าที่เสนอ">
    OpenClaw ไม่ใช่ "แค่ Claude wrapper" แต่เป็น **control plane แบบ local-first** ที่ให้คุณรัน
    ผู้ช่วยที่มีความสามารถบน **ฮาร์ดแวร์ของคุณเอง** เข้าถึงได้จากแอปแชตที่คุณใช้อยู่แล้ว พร้อม
    sessions ที่มีสถานะ, memory และ tools - โดยไม่ต้องส่งมอบการควบคุม workflows ของคุณให้ SaaS
    ที่โฮสต์ไว้

    จุดเด่น:

    - **อุปกรณ์ของคุณ ข้อมูลของคุณ:** รัน Gateway ได้ทุกที่ที่คุณต้องการ (Mac, Linux, VPS) และเก็บ
      workspace + ประวัติ session ไว้ในเครื่อง
    - **ช่องทางจริง ไม่ใช่ web sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      รวมถึงเสียงบนมือถือและ Canvas บนแพลตฟอร์มที่รองรับ
    - **ไม่ผูกกับโมเดล:** ใช้ Anthropic, OpenAI, MiniMax, OpenRouter ฯลฯ พร้อมการกำหนดเส้นทาง
      และ failover แยกตาม agent
    - **ตัวเลือกเฉพาะในเครื่อง:** รันโมเดลในเครื่องเพื่อให้ **ข้อมูลทั้งหมดอยู่บนอุปกรณ์ของคุณได้** หากต้องการ
    - **การกำหนดเส้นทางหลายเอเจนต์:** แยก agents ตามช่องทาง, บัญชี หรือ task โดยแต่ละตัวมี
      workspace และค่าเริ่มต้นของตัวเอง
    - **โอเพนซอร์สและปรับแต่งได้:** ตรวจสอบ ขยาย และ self-host ได้โดยไม่ติดกับผู้ขายรายใด

    เอกสาร: [Gateway](/th/gateway), [Channels](/th/channels), [หลายเอเจนต์](/th/concepts/multi-agent),
    [Memory](/th/concepts/memory)

  </Accordion>

  <Accordion title="ฉันเพิ่งตั้งค่าเสร็จ - ควรทำอะไรก่อน?">
    โปรเจกต์แรกที่เหมาะ:

    - สร้างเว็บไซต์ (WordPress, Shopify หรือเว็บไซต์ static แบบง่าย)
    - ทำต้นแบบแอปมือถือ (โครงร่าง, หน้าจอ, แผน API)
    - จัดระเบียบไฟล์และโฟลเดอร์ (ทำความสะอาด, ตั้งชื่อ, ติดแท็ก)
    - เชื่อมต่อ Gmail และทำสรุปหรือการติดตามผลอัตโนมัติ

    มันจัดการงานขนาดใหญ่ได้ แต่จะทำงานได้ดีที่สุดเมื่อคุณแบ่งงานออกเป็นเฟสและ
    ใช้ sub agents สำหรับงานคู่ขนาน

  </Accordion>

  <Accordion title="กรณีใช้งานประจำวัน 5 อันดับแรกของ OpenClaw คืออะไร?">
    ผลลัพธ์ที่ได้ประโยชน์ในชีวิตประจำวันมักมีลักษณะดังนี้:

    - **สรุปข้อมูลส่วนตัว:** สรุป inbox, ปฏิทิน และข่าวที่คุณสนใจ
    - **ค้นคว้าและร่างงาน:** ค้นคว้าอย่างรวดเร็ว สรุป และร่างฉบับแรกสำหรับอีเมลหรือเอกสาร
    - **เตือนความจำและติดตามผล:** การสะกิดเตือนและเช็กลิสต์ที่ขับเคลื่อนด้วย cron หรือ heartbeat
    - **ระบบอัตโนมัติในเบราว์เซอร์:** กรอกฟอร์ม รวบรวมข้อมูล และทำงานเว็บซ้ำ ๆ
    - **ประสานงานข้ามอุปกรณ์:** ส่ง task จากโทรศัพท์ ให้ Gateway รันบนเซิร์ฟเวอร์ แล้วรับผลลัพธ์กลับในแชต

  </Accordion>

  <Accordion title="OpenClaw ช่วยเรื่องการสร้างลีด การติดต่อกลุ่มเป้าหมาย โฆษณา และบล็อกสำหรับ SaaS ได้ไหม">
    ได้ สำหรับ **การวิจัย การคัดกรองคุณสมบัติ และการร่าง** โดยสามารถสแกนเว็บไซต์ สร้างรายชื่อคัดสรรแบบสั้น
    สรุปผู้มีโอกาสเป็นลูกค้า และเขียนร่างข้อความติดต่อหรือข้อความโฆษณาได้

    สำหรับ **การส่งข้อความติดต่อหรือการรันโฆษณา** ให้มีมนุษย์อยู่ในวงจรการตัดสินใจเสมอ หลีกเลี่ยงสแปม ปฏิบัติตามกฎหมายท้องถิ่นและ
    นโยบายของแพลตฟอร์ม และตรวจทานทุกอย่างก่อนส่ง รูปแบบที่ปลอดภัยที่สุดคือให้
    OpenClaw ร่าง แล้วคุณอนุมัติ

    เอกสาร: [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="มีข้อได้เปรียบอะไรเมื่อเทียบกับ Claude Code สำหรับการพัฒนาเว็บ">
    OpenClaw เป็น **ผู้ช่วยส่วนตัว** และชั้นประสานงาน ไม่ใช่สิ่งทดแทน IDE ใช้
    Claude Code หรือ Codex สำหรับลูปการเขียนโค้ดโดยตรงที่เร็วที่สุดภายในรีโพซิทอรี ใช้ OpenClaw เมื่อคุณ
    ต้องการหน่วยความจำที่คงทน การเข้าถึงข้ามอุปกรณ์ และการประสานการทำงานของเครื่องมือ

    ข้อได้เปรียบ:

    - **หน่วยความจำถาวร + workspace** ข้ามเซสชัน
    - **การเข้าถึงหลายแพลตฟอร์ม** (WhatsApp, Telegram, TUI, WebChat)
    - **การประสานการทำงานของเครื่องมือ** (เบราว์เซอร์ ไฟล์ การตั้งเวลา hooks)
    - **Gateway ที่ทำงานตลอดเวลา** (รันบน VPS แล้วโต้ตอบจากที่ใดก็ได้)
    - **Node** สำหรับเบราว์เซอร์/หน้าจอ/กล้อง/exec ในเครื่อง

    ตัวอย่างการใช้งาน: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills และระบบอัตโนมัติ

<AccordionGroup>
  <Accordion title="ฉันจะปรับแต่ง Skills โดยไม่ทำให้รีโพซิทอรีมีการเปลี่ยนแปลงค้างอยู่ได้อย่างไร">
    ใช้การ override ที่จัดการไว้แทนการแก้ไขสำเนาในรีโพซิทอรี ใส่การเปลี่ยนแปลงของคุณใน `~/.openclaw/skills/<name>/SKILL.md` (หรือเพิ่มโฟลเดอร์ผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json`) ลำดับความสำคัญคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → ที่ bundled มา → `skills.load.extraDirs` ดังนั้น override ที่จัดการไว้ยังคงชนะ Skills ที่ bundled มาโดยไม่ต้องแตะ git หากคุณต้องการติดตั้ง Skills แบบทั่วทั้งระบบแต่ให้มองเห็นได้เฉพาะบางเอเจนต์ ให้เก็บสำเนาที่ใช้ร่วมกันไว้ใน `~/.openclaw/skills` แล้วควบคุมการมองเห็นด้วย `agents.defaults.skills` และ `agents.list[].skills` เฉพาะการแก้ไขที่ควรส่งกลับ upstream เท่านั้นที่ควรอยู่ในรีโพซิทอรีและส่งออกเป็น PR
  </Accordion>

  <Accordion title="ฉันโหลด Skills จากโฟลเดอร์กำหนดเองได้ไหม">
    ได้ เพิ่มไดเรกทอรีเพิ่มเติมผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json` (ลำดับความสำคัญต่ำสุด) ลำดับความสำคัญเริ่มต้นคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → ที่ bundled มา → `skills.load.extraDirs` `clawhub` จะติดตั้งลงใน `./skills` ตามค่าเริ่มต้น ซึ่ง OpenClaw จะถือว่าเป็น `<workspace>/skills` ในเซสชันถัดไป หาก Skills ควรมองเห็นได้เฉพาะบางเอเจนต์ ให้ใช้ร่วมกับ `agents.defaults.skills` หรือ `agents.list[].skills`
  </Accordion>

  <Accordion title="ฉันจะใช้โมเดลต่างกันสำหรับงานต่างกันได้อย่างไร">
    รูปแบบที่รองรับในวันนี้คือ:

    - **งาน Cron**: งานที่แยกออกจากกันสามารถตั้งค่า override `model` ต่อหนึ่งงานได้
    - **เอเจนต์ย่อย**: กำหนดเส้นทางงานไปยังเอเจนต์แยกต่างหากที่มีโมเดลเริ่มต้นต่างกัน
    - **การสลับตามต้องการ**: ใช้ `/model` เพื่อสลับโมเดลของเซสชันปัจจุบันได้ทุกเมื่อ

    ดู [งาน Cron](/th/automation/cron-jobs), [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), และ [คำสั่ง Slash](/th/tools/slash-commands).

  </Accordion>

  <Accordion title="บอตค้างระหว่างทำงานหนัก ฉันจะย้ายงานนั้นออกไปทำที่อื่นได้อย่างไร">
    ใช้ **เอเจนต์ย่อย** สำหรับงานที่ยาวหรือทำแบบขนาน เอเจนต์ย่อยจะรันในเซสชันของตัวเอง
    ส่งคืนสรุป และทำให้แชตหลักของคุณยังตอบสนองได้

    ขอให้บอตของคุณ "สร้างเอเจนต์ย่อยสำหรับงานนี้" หรือใช้ `/subagents`
    ใช้ `/status` ในแชตเพื่อดูว่า Gateway กำลังทำอะไรอยู่ตอนนี้ (และยุ่งอยู่หรือไม่)

    เคล็ดลับเรื่องโทเค็น: งานที่ยาวและเอเจนต์ย่อยต่างก็ใช้โทเค็น หากกังวลเรื่องค่าใช้จ่าย ให้ตั้งค่า
    โมเดลที่ถูกกว่าสำหรับเอเจนต์ย่อยผ่าน `agents.defaults.subagents.model`

    เอกสาร: [เอเจนต์ย่อย](/th/tools/subagents), [งานเบื้องหลัง](/th/automation/tasks).

  </Accordion>

  <Accordion title="เซสชันเอเจนต์ย่อยที่ผูกกับเธรดทำงานบน Discord อย่างไร">
    ใช้การผูกเธรด คุณสามารถผูกเธรด Discord กับเอเจนต์ย่อยหรือเป้าหมายเซสชัน เพื่อให้ข้อความติดตามผลในเธรดนั้นยังอยู่บนเซสชันที่ผูกไว้

    โฟลว์พื้นฐาน:

    - สร้างด้วย `sessions_spawn` โดยใช้ `thread: true` (และเลือกใช้ `mode: "session"` สำหรับการติดตามผลแบบถาวร)
    - หรือผูกเองด้วย `/focus <target>`
    - ใช้ `/agents` เพื่อตรวจสอบสถานะการผูก
    - ใช้ `/session idle <duration|off>` และ `/session max-age <duration|off>` เพื่อควบคุมการยกเลิกโฟกัสอัตโนมัติ
    - ใช้ `/unfocus` เพื่อแยกเธรดออก

    การกำหนดค่าที่จำเป็น:

    - ค่าเริ่มต้นส่วนกลาง: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - การ override ของ Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - ผูกอัตโนมัติเมื่อสร้าง: `channels.discord.threadBindings.spawnSessions` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เพื่อปิดการสร้างเซสชันที่ผูกกับเธรด

    เอกสาร: [เอเจนต์ย่อย](/th/tools/subagents), [Discord](/th/channels/discord), [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference), [คำสั่ง Slash](/th/tools/slash-commands).

  </Accordion>

  <Accordion title="เอเจนต์ย่อยทำงานเสร็จแล้ว แต่การอัปเดตเมื่อเสร็จสิ้นไปผิดที่หรือไม่ถูกโพสต์เลย ฉันควรตรวจอะไร">
    ตรวจเส้นทางผู้ร้องขอที่ resolve แล้วก่อน:

    - การส่งมอบเอเจนต์ย่อยในโหมดเสร็จสิ้นจะให้ความสำคัญกับเธรดที่ผูกไว้หรือเส้นทางการสนทนาเมื่อมีอยู่
    - หากต้นทางของการเสร็จสิ้นมีเฉพาะช่องทาง OpenClaw จะ fallback ไปยังเส้นทางที่เก็บไว้ของเซสชันผู้ร้องขอ (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้การส่งโดยตรงยังสำเร็จได้
    - หากไม่มีทั้งเส้นทางที่ผูกไว้และเส้นทางที่เก็บไว้ซึ่งใช้งานได้ การส่งโดยตรงอาจล้มเหลว และผลลัพธ์จะ fallback ไปเป็นการส่งมอบเซสชันที่อยู่ในคิวแทนการโพสต์ไปยังแชตทันที
    - เป้าหมายที่ไม่ถูกต้องหรือล้าสมัยยังอาจบังคับให้ fallback ไปคิวหรือทำให้การส่งมอบสุดท้ายล้มเหลวได้
    - หากคำตอบผู้ช่วยที่มองเห็นล่าสุดของลูกเป็นโทเค็นเงียบที่ตรงเป๊ะ `NO_REPLY` / `no_reply` หรือ `ANNOUNCE_SKIP` ตรงเป๊ะ OpenClaw จะตั้งใจระงับการประกาศแทนการโพสต์ความคืบหน้าก่อนหน้าที่ล้าสมัย
    - หากลูกหมดเวลาหลังจากมีเพียงการเรียกเครื่องมือ การประกาศสามารถยุบสิ่งนั้นเป็นสรุปความคืบหน้าบางส่วนแบบสั้นแทนการเล่นซ้ำ output ดิบของเครื่องมือ

    ดีบัก:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [เอเจนต์ย่อย](/th/tools/subagents), [งานเบื้องหลัง](/th/automation/tasks), [เครื่องมือเซสชัน](/th/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron หรือการเตือนไม่ทำงาน ฉันควรตรวจอะไร">
    Cron รันอยู่ภายในกระบวนการ Gateway หาก Gateway ไม่ได้รันอย่างต่อเนื่อง
    งานที่ตั้งเวลาไว้จะไม่รัน

    รายการตรวจสอบ:

    - ยืนยันว่าเปิดใช้งาน cron แล้ว (`cron.enabled`) และไม่ได้ตั้งค่า `OPENCLAW_SKIP_CRON`
    - ตรวจว่า Gateway รันอยู่ตลอด 24/7 (ไม่มี sleep/รีสตาร์ต)
    - ตรวจสอบการตั้งค่า timezone สำหรับงาน (`--tz` เทียบกับ timezone ของโฮสต์)

    ดีบัก:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [ระบบอัตโนมัติและงาน](/th/automation).

  </Accordion>

  <Accordion title="Cron ทำงานแล้ว แต่ไม่มีอะไรถูกส่งไปยังช่อง ทำไม?">
    ตรวจสอบโหมดการส่งก่อน:

    - `--no-deliver` / `delivery.mode: "none"` หมายความว่าไม่ควรมีการส่งสำรองจาก runner
    - เป้าหมายประกาศหายไปหรือไม่ถูกต้อง (`channel` / `to`) หมายความว่า runner ข้ามการส่งออก
    - การยืนยันตัวตนของช่องล้มเหลว (`unauthorized`, `Forbidden`) หมายความว่า runner พยายามส่งแล้ว แต่ข้อมูลรับรองบล็อกไว้
    - ผลลัพธ์แบบ isolated ที่เงียบ (`NO_REPLY` / `no_reply` เท่านั้น) จะถือว่าไม่สามารถส่งได้โดยตั้งใจ ดังนั้น runner จึงระงับการส่งสำรองที่เข้าคิวไว้ด้วย

    สำหรับงาน cron แบบ isolated agent ยังสามารถส่งโดยตรงด้วยเครื่องมือ `message`
    ได้เมื่อมีเส้นทางแชตพร้อมใช้งาน `--announce` ควบคุมเฉพาะเส้นทางสำรองของ runner
    สำหรับข้อความสุดท้ายที่ agent ยังไม่ได้ส่งเอง

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [งานเบื้องหลัง](/th/automation/tasks).

  </Accordion>

  <Accordion title="ทำไมการรัน cron แบบ isolated จึงสลับโมเดลหรือลองใหม่หนึ่งครั้ง?">
    โดยปกตินั่นคือเส้นทางการสลับโมเดลแบบสด ไม่ใช่การจัดตารางซ้ำ

    cron แบบ isolated สามารถเก็บการส่งต่อโมเดลระหว่างรันไทม์และลองใหม่ได้เมื่อการรันที่ใช้งานอยู่
    โยน `LiveSessionModelSwitchError` การลองใหม่จะคง provider/model ที่สลับแล้วไว้
    และหากการสลับมาพร้อมกับการ override โปรไฟล์ auth ใหม่ cron
    จะเก็บค่านั้นไว้ก่อนลองใหม่ด้วย

    กฎการเลือกที่เกี่ยวข้อง:

    - การ override โมเดลของ Gmail hook ชนะก่อนเมื่อใช้ได้
    - จากนั้นคือ `model` รายงาน
    - จากนั้นคือการ override โมเดลของ cron-session ที่เก็บไว้
    - จากนั้นคือการเลือกโมเดล agent/default ตามปกติ

    ลูปการลองใหม่มีขอบเขต หลังจากความพยายามแรกบวกกับการลองใหม่จากการสลับ 2 ครั้ง
    cron จะยกเลิกแทนที่จะวนไปตลอด

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [cron CLI](/th/cli/cron).

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง Skills บน Linux ได้อย่างไร?">
    ใช้คำสั่ง `openclaw skills` แบบเนทีฟ หรือวาง Skills ลงในพื้นที่ทำงานของคุณ UI ของ Skills บน macOS ไม่พร้อมใช้งานบน Linux
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

    `openclaw skills install` แบบเนทีฟจะเขียนลงในไดเรกทอรี `skills/`
    ของพื้นที่ทำงานที่ใช้งานอยู่ ติดตั้ง CLI `clawhub` แยกต่างหากเฉพาะเมื่อคุณต้องการเผยแพร่หรือ
    ซิงก์ Skills ของคุณเอง สำหรับการติดตั้งร่วมกันข้าม agent ให้วาง skill ไว้ใต้
    `~/.openclaw/skills` และใช้ `agents.defaults.skills` หรือ
    `agents.list[].skills` หากคุณต้องการจำกัดว่า agent ใดบ้างที่มองเห็นได้

  </Accordion>

  <Accordion title="OpenClaw สามารถรันงานตามกำหนดการหรือต่อเนื่องในเบื้องหลังได้ไหม?">
    ได้ ใช้ตัวจัดตารางของ Gateway:

    - **งาน Cron** สำหรับงานตามกำหนดการหรืองานที่เกิดซ้ำ (คงอยู่หลังรีสตาร์ต)
    - **Heartbeat** สำหรับการตรวจสอบเป็นระยะของ "เซสชันหลัก"
    - **งาน isolated** สำหรับ agent อัตโนมัติที่โพสต์สรุปหรือส่งไปยังแชต

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [ระบบอัตโนมัติและงาน](/th/automation),
    [Heartbeat](/th/gateway/heartbeat).

  </Accordion>

  <Accordion title="ฉันสามารถรัน Skills ที่ใช้ได้เฉพาะ Apple macOS จาก Linux ได้ไหม?">
    ไม่ได้โดยตรง Skills ของ macOS ถูกควบคุมด้วย `metadata.openclaw.os` รวมถึงไบนารีที่จำเป็น และ Skills จะปรากฏใน system prompt เฉพาะเมื่อมีสิทธิ์ใช้งานบน **โฮสต์ Gateway** เท่านั้น บน Linux Skills ที่ใช้ได้เฉพาะ `darwin` (เช่น `apple-notes`, `apple-reminders`, `things-mac`) จะไม่โหลดเว้นแต่คุณจะ override การควบคุมนี้

    คุณมีรูปแบบที่รองรับสามแบบ:

    **ตัวเลือก A - รัน Gateway บน Mac (ง่ายที่สุด).**
    รัน Gateway ในที่ที่มีไบนารีของ macOS อยู่ จากนั้นเชื่อมต่อจาก Linux ใน [โหมดระยะไกล](#gateway-ports-already-running-and-remote-mode) หรือผ่าน Tailscale Skills จะโหลดตามปกติเพราะโฮสต์ Gateway เป็น macOS

    **ตัวเลือก B - ใช้ Node macOS (ไม่มี SSH).**
    รัน Gateway บน Linux จับคู่ Node macOS (แอปแถบเมนู) และตั้งค่า **Node Run Commands** เป็น "Always Ask" หรือ "Always Allow" บน Mac OpenClaw สามารถถือว่า Skills ที่ใช้ได้เฉพาะ macOS มีสิทธิ์ใช้งานเมื่อมีไบนารีที่จำเป็นอยู่บน Node agent จะรัน Skills เหล่านั้นผ่านเครื่องมือ `nodes` หากคุณเลือก "Always Ask" การอนุมัติ "Always Allow" ใน prompt จะเพิ่มคำสั่งนั้นลงใน allowlist

    **ตัวเลือก C - พร็อกซีไบนารีของ macOS ผ่าน SSH (ขั้นสูง).**
    คง Gateway ไว้บน Linux แต่ทำให้ไบนารี CLI ที่จำเป็น resolve ไปยัง SSH wrapper ที่รันบน Mac จากนั้น override skill เพื่ออนุญาต Linux เพื่อให้ยังมีสิทธิ์ใช้งาน

    1. สร้าง SSH wrapper สำหรับไบนารี (ตัวอย่าง: `memo` สำหรับ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. วาง wrapper บน `PATH` บนโฮสต์ Linux (เช่น `~/bin/memo`)
    3. Override metadata ของ skill (พื้นที่ทำงานหรือ `~/.openclaw/skills`) เพื่ออนุญาต Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. เริ่มเซสชันใหม่เพื่อให้ snapshot ของ Skills รีเฟรช

  </Accordion>

  <Accordion title="มีการผสานรวม Notion หรือ HeyGen ไหม?">
    ตอนนี้ยังไม่มีในตัว

    ตัวเลือก:

    - **Skill / Plugin แบบกำหนดเอง:** เหมาะที่สุดสำหรับการเข้าถึง API ที่เชื่อถือได้ (ทั้ง Notion/HeyGen มี API)
    - **ระบบอัตโนมัติของเบราว์เซอร์:** ใช้ได้โดยไม่ต้องเขียนโค้ด แต่ช้ากว่าและเปราะบางกว่า

    หากคุณต้องการเก็บบริบทแยกตามลูกค้า (เวิร์กโฟลว์เอเจนซี) รูปแบบง่าย ๆ คือ:

    - หนึ่งหน้า Notion ต่อหนึ่งลูกค้า (บริบท + การตั้งค่า + งานที่ใช้งานอยู่)
    - ขอให้ agent ดึงหน้านั้นเมื่อเริ่มเซสชัน

    หากคุณต้องการการผสานรวมแบบเนทีฟ ให้เปิดคำขอฟีเจอร์หรือสร้าง skill
    ที่มุ่งเป้าไปยัง API เหล่านั้น

    ติดตั้ง Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    การติดตั้งแบบเนทีฟจะอยู่ในไดเรกทอรี `skills/` ของพื้นที่ทำงานที่ใช้งานอยู่ สำหรับ Skills ที่ใช้ร่วมกันข้าม agent ให้วางไว้ใน `~/.openclaw/skills/<name>/SKILL.md` หากมีเพียงบาง agent ที่ควรเห็นการติดตั้งร่วมกัน ให้กำหนดค่า `agents.defaults.skills` หรือ `agents.list[].skills` Skills บางรายการคาดหวังไบนารีที่ติดตั้งผ่าน Homebrew; บน Linux หมายถึง Linuxbrew (ดูรายการ FAQ ของ Homebrew Linux ด้านบน) ดู [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config), และ [ClawHub](/th/tools/clawhub).

  </Accordion>

  <Accordion title="ฉันจะใช้ Chrome ที่ลงชื่อเข้าใช้อยู่แล้วกับ OpenClaw ได้อย่างไร?">
    ใช้โปรไฟล์เบราว์เซอร์ `user` ในตัว ซึ่งแนบผ่าน Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    หากคุณต้องการชื่อที่กำหนดเอง ให้สร้างโปรไฟล์ MCP แบบชัดเจน:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    เส้นทางนี้สามารถใช้เบราว์เซอร์โฮสต์ local หรือ Node เบราว์เซอร์ที่เชื่อมต่ออยู่ หาก Gateway รันอยู่ที่อื่น ให้รันโฮสต์ Node บนเครื่องเบราว์เซอร์ หรือใช้ CDP ระยะไกลแทน

    ขีดจำกัดปัจจุบันของ `existing-session` / `user`:

    - การดำเนินการขับเคลื่อนด้วย ref ไม่ใช่ด้วย CSS-selector
    - การอัปโหลดต้องใช้ `ref` / `inputRef` และปัจจุบันรองรับทีละไฟล์
    - `responsebody`, การส่งออก PDF, การดักจับดาวน์โหลด, และการดำเนินการแบบ batch ยังต้องใช้เบราว์เซอร์ที่จัดการไว้หรือโปรไฟล์ CDP ดิบ

  </Accordion>
</AccordionGroup>

## Sandboxing และหน่วยความจำ

<AccordionGroup>
  <Accordion title="มีเอกสาร sandboxing เฉพาะไหม?">
    มี ดู [Sandboxing](/th/gateway/sandboxing) สำหรับการตั้งค่าเฉพาะ Docker (Gateway เต็มรูปแบบใน Docker หรืออิมเมจ sandbox) ดู [Docker](/th/install/docker)
  </Accordion>

  <Accordion title="Docker ดูจำกัด - ฉันจะเปิดใช้ฟีเจอร์เต็มรูปแบบได้อย่างไร?">
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยก่อนและรันเป็นผู้ใช้ `node` ดังนั้นจึงไม่
    รวมแพ็กเกจระบบ, Homebrew, หรือเบราว์เซอร์ที่บันเดิลมา สำหรับการตั้งค่าที่สมบูรณ์กว่า:

    - Persist `/home/node` ด้วย `OPENCLAW_HOME_VOLUME` เพื่อให้แคชคงอยู่
    - Bake system deps เข้าไปในอิมเมจด้วย `OPENCLAW_DOCKER_APT_PACKAGES`
    - ติดตั้งเบราว์เซอร์ Playwright ผ่าน CLI ที่บันเดิลมา:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` และตรวจสอบว่า path นั้นถูก persist

    เอกสาร: [Docker](/th/install/docker), [เบราว์เซอร์](/th/tools/browser).

  </Accordion>

  <Accordion title="ฉันสามารถทำให้ DM เป็นส่วนตัว แต่ให้กลุ่มเป็นสาธารณะ/sandboxed ด้วย agent เดียวได้ไหม?">
    ได้ - หากทราฟฟิกส่วนตัวของคุณคือ **DMs** และทราฟฟิกสาธารณะของคุณคือ **กลุ่ม**

    ใช้ `agents.defaults.sandbox.mode: "non-main"` เพื่อให้เซสชันกลุ่ม/ช่อง (คีย์ที่ไม่ใช่ main) รันใน backend sandbox ที่กำหนดค่าไว้ ขณะที่เซสชัน DM หลักยังอยู่บนโฮสต์ Docker เป็น backend เริ่มต้นหากคุณไม่ได้เลือกอย่างใดอย่างหนึ่ง จากนั้นจำกัดเครื่องมือที่พร้อมใช้งานในเซสชัน sandboxed ผ่าน `tools.sandbox.tools`

    คู่มือการตั้งค่า + ตัวอย่าง config: [กลุ่ม: DM ส่วนตัว + กลุ่มสาธารณะ](/th/channels/groups#pattern-personal-dms-public-groups-single-agent)

    อ้างอิง config สำคัญ: [การกำหนดค่า Gateway](/th/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ฉันจะ bind โฟลเดอร์โฮสต์เข้าไปใน sandbox ได้อย่างไร?">
    ตั้งค่า `agents.defaults.sandbox.docker.binds` เป็น `["host:path:mode"]` (เช่น `"/home/user/src:/src:ro"`) bind ส่วนกลาง + ราย agent จะรวมกัน; bind ราย agent จะถูกละเว้นเมื่อ `scope: "shared"` ใช้ `:ro` สำหรับสิ่งที่ละเอียดอ่อน และจำไว้ว่า bind จะข้ามกำแพงระบบไฟล์ของ sandbox

    OpenClaw ตรวจสอบแหล่งที่มาของ bind กับทั้ง path ที่ normalize แล้วและ path canonical ที่ resolve ผ่าน ancestor ที่มีอยู่ลึกที่สุด นั่นหมายความว่าการหลบออกผ่าน symlink-parent ยังล้มเหลวแบบปิด แม้เมื่อ segment สุดท้ายของ path ยังไม่มีอยู่ และการตรวจสอบ allowed-root ยังใช้หลังจากการ resolve symlink

    ดู [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts) และ [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) สำหรับตัวอย่างและหมายเหตุด้านความปลอดภัย

  </Accordion>

  <Accordion title="หน่วยความจำทำงานอย่างไร?">
    หน่วยความจำของ OpenClaw เป็นเพียงไฟล์ Markdown ในพื้นที่ทำงานของ agent:

    - บันทึกรายวันใน `memory/YYYY-MM-DD.md`
    - บันทึกระยะยาวที่คัดสรรแล้วใน `MEMORY.md` (เฉพาะเซสชัน main/private)

    OpenClaw ยังรัน **การ flush หน่วยความจำก่อน Compaction แบบเงียบ**
    เพื่อเตือนโมเดลให้เขียนบันทึกที่คงทนก่อน auto-compaction สิ่งนี้จะรันเฉพาะเมื่อพื้นที่ทำงาน
    เขียนได้ (sandbox แบบอ่านอย่างเดียวจะข้าม) ดู [หน่วยความจำ](/th/concepts/memory).

  </Accordion>

  <Accordion title="หน่วยความจำลืมสิ่งต่าง ๆ อยู่เรื่อย ฉันจะทำให้มันจำได้อย่างไร?">
    ขอให้บอต **เขียนข้อเท็จจริงลงในหน่วยความจำ** บันทึกระยะยาวควรอยู่ใน `MEMORY.md`,
    บริบทระยะสั้นควรอยู่ใน `memory/YYYY-MM-DD.md`

    นี่ยังเป็นส่วนที่เรากำลังปรับปรุง การเตือนโมเดลให้จัดเก็บความทรงจำช่วยได้;
    มันจะรู้ว่าต้องทำอะไร หากมันยังลืมอยู่ ให้ตรวจสอบว่า Gateway ใช้พื้นที่ทำงานเดียวกัน
    ในทุกการรัน

    เอกสาร: [หน่วยความจำ](/th/concepts/memory), [พื้นที่ทำงานของ Agent](/th/concepts/agent-workspace).

  </Accordion>

  <Accordion title="หน่วยความจำคงอยู่ตลอดไปไหม? มีขีดจำกัดอะไรบ้าง?">
    ไฟล์หน่วยความจำอยู่บนดิสก์และคงอยู่จนกว่าคุณจะลบ ขีดจำกัดคือ
    พื้นที่จัดเก็บของคุณ ไม่ใช่โมเดล **บริบทของเซสชัน** ยังถูกจำกัดด้วย context window
    ของโมเดล ดังนั้นการสนทนาที่ยาวสามารถถูก compact หรือตัดทอนได้ นั่นคือเหตุผลที่
    มีการค้นหาหน่วยความจำ - มันดึงกลับมาเฉพาะส่วนที่เกี่ยวข้องเข้าสู่บริบท

    เอกสาร: [หน่วยความจำ](/th/concepts/memory), [บริบท](/th/concepts/context).

  </Accordion>

  <Accordion title="การค้นหาหน่วยความจำเชิงความหมายต้องใช้คีย์ OpenAI API หรือไม่?">
    ต้องใช้เฉพาะเมื่อคุณใช้ **OpenAI embeddings** เท่านั้น Codex OAuth ครอบคลุมการแชต/การเติมข้อความและ
    **ไม่** ให้สิทธิ์เข้าถึง embeddings ดังนั้น **การลงชื่อเข้าใช้ด้วย Codex (OAuth หรือการเข้าสู่ระบบด้วย
    Codex CLI)** จึงไม่ช่วยสำหรับการค้นหาหน่วยความจำเชิงความหมาย OpenAI embeddings
    ยังต้องใช้ API key จริง (`OPENAI_API_KEY` หรือ `models.providers.openai.apiKey`)

    หากคุณไม่ได้ตั้งค่าผู้ให้บริการอย่างชัดเจน OpenClaw จะเลือกผู้ให้บริการให้อัตโนมัติเมื่อ
    สามารถหา API key ได้ (auth profiles, `models.providers.*.apiKey` หรือ env vars)
    โดยจะเลือก OpenAI ก่อนหากพบคีย์ OpenAI ไม่เช่นนั้นจะเลือก Gemini หากพบคีย์ Gemini
    จากนั้น Voyage แล้วจึง Mistral หากไม่มีคีย์ระยะไกลให้ใช้ การค้นหาหน่วยความจำ
    จะยังปิดอยู่จนกว่าคุณจะกำหนดค่า หากคุณมีพาธโมเดลในเครื่องที่กำหนดค่าไว้และมีอยู่จริง OpenClaw
    จะเลือก `local` ก่อน รองรับ Ollama เมื่อคุณตั้งค่าอย่างชัดเจนเป็น
    `memorySearch.provider = "ollama"`

    หากคุณต้องการใช้งานในเครื่อง ให้ตั้งค่า `memorySearch.provider = "local"` (และจะตั้งค่า
    `memorySearch.fallback = "none"` ด้วยก็ได้) หากคุณต้องการ Gemini embeddings ให้ตั้งค่า
    `memorySearch.provider = "gemini"` และระบุ `GEMINI_API_KEY` (หรือ
    `memorySearch.remote.apiKey`) เรารองรับโมเดล embedding แบบ **OpenAI, Gemini, Voyage, Mistral, Ollama หรือ local**
    ดูรายละเอียดการตั้งค่าได้ที่ [หน่วยความจำ](/th/concepts/memory)

  </Accordion>
</AccordionGroup>

## สิ่งต่าง ๆ อยู่ที่ไหนบนดิสก์

<AccordionGroup>
  <Accordion title="ข้อมูลทั้งหมดที่ใช้กับ OpenClaw ถูกบันทึกไว้ในเครื่องหรือไม่?">
    ไม่ใช่ - **สถานะของ OpenClaw อยู่ในเครื่อง** แต่ **บริการภายนอกยังเห็นสิ่งที่คุณส่งให้บริการเหล่านั้น**

    - **อยู่ในเครื่องโดยค่าเริ่มต้น:** เซสชัน ไฟล์หน่วยความจำ การกำหนดค่า และเวิร์กสเปซอยู่บนโฮสต์ Gateway
      (`~/.openclaw` + ไดเรกทอรีเวิร์กสเปซของคุณ)
    - **อยู่ระยะไกลโดยจำเป็น:** ข้อความที่คุณส่งให้ผู้ให้บริการโมเดล (Anthropic/OpenAI/ฯลฯ) จะไปยัง
      API ของบริการเหล่านั้น และแพลตฟอร์มแชต (WhatsApp/Telegram/Slack/ฯลฯ) จะเก็บข้อมูลข้อความไว้บน
      เซิร์ฟเวอร์ของตน
    - **คุณควบคุมขอบเขตข้อมูลได้:** การใช้โมเดลในเครื่องช่วยให้พรอมป์อยู่บนเครื่องของคุณ แต่ทราฟฟิกของช่องทาง
      ยังคงผ่านเซิร์ฟเวอร์ของช่องทางนั้น

    ที่เกี่ยวข้อง: [เวิร์กสเปซของเอเจนต์](/th/concepts/agent-workspace), [หน่วยความจำ](/th/concepts/memory)

  </Accordion>

  <Accordion title="OpenClaw เก็บข้อมูลไว้ที่ไหน?">
    ทุกอย่างอยู่ภายใต้ `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`):

    | พาธ                                                            | วัตถุประสงค์                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | การกำหนดค่าหลัก (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | การนำเข้า OAuth แบบเดิม (คัดลอกเข้า auth profiles เมื่อใช้ครั้งแรก)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth, API keys และ `keyRef`/`tokenRef` ที่เลือกใช้ได้)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | เพย์โหลดความลับแบบอิงไฟล์ที่เลือกใช้ได้สำหรับผู้ให้บริการ SecretRef แบบ `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ไฟล์ความเข้ากันได้แบบเดิม (ล้างรายการ `api_key` แบบคงที่แล้ว)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | สถานะผู้ให้บริการ (เช่น `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | สถานะต่อเอเจนต์ (agentDir + เซสชัน)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | ประวัติการสนทนาและสถานะ (ต่อเอเจนต์)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | เมทาดาทาเซสชัน (ต่อเอเจนต์)                                       |

    พาธเอเจนต์เดียวแบบเดิม: `~/.openclaw/agent/*` (ย้ายข้อมูลโดย `openclaw doctor`)

    **เวิร์กสเปซ** ของคุณ (AGENTS.md, ไฟล์หน่วยความจำ, Skills, ฯลฯ) แยกออกมาต่างหากและกำหนดค่าผ่าน `agents.defaults.workspace` (ค่าเริ่มต้น: `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md ควรอยู่ที่ไหน?">
    ไฟล์เหล่านี้อยู่ใน **เวิร์กสเปซของเอเจนต์** ไม่ใช่ `~/.openclaw`

    - **เวิร์กสเปซ (ต่อเอเจนต์)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` ที่เลือกใช้ได้
      รากตัวพิมพ์เล็ก `memory.md` เป็นเพียงอินพุตซ่อมแซมแบบเดิมเท่านั้น; `openclaw doctor --fix`
      สามารถรวมเข้าไปใน `MEMORY.md` ได้เมื่อมีทั้งสองไฟล์
    - **ไดเรกทอรีสถานะ (`~/.openclaw`)**: การกำหนดค่า, สถานะช่องทาง/ผู้ให้บริการ, auth profiles, เซสชัน, บันทึก,
      และ Skills ที่ใช้ร่วมกัน (`~/.openclaw/skills`)

    เวิร์กสเปซเริ่มต้นคือ `~/.openclaw/workspace` กำหนดค่าได้ผ่าน:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    หากบอต "ลืม" หลังรีสตาร์ท ให้ยืนยันว่า Gateway ใช้
    เวิร์กสเปซเดียวกันในการเปิดใช้งานทุกครั้ง (และจำไว้ว่า: โหมดระยะไกลใช้เวิร์กสเปซของ
    **โฮสต์ Gateway** ไม่ใช่แล็ปท็อปในเครื่องของคุณ)

    เคล็ดลับ: หากคุณต้องการพฤติกรรมหรือค่ากำหนดที่คงทน ให้ขอให้บอต **เขียนลงใน
    AGENTS.md หรือ MEMORY.md** แทนการพึ่งพาประวัติแชต

    ดู [เวิร์กสเปซของเอเจนต์](/th/concepts/agent-workspace) และ [หน่วยความจำ](/th/concepts/memory)

  </Accordion>

  <Accordion title="กลยุทธ์สำรองข้อมูลที่แนะนำ">
    ใส่ **เวิร์กสเปซของเอเจนต์** ไว้ใน repo git แบบ **ส่วนตัว** และสำรองไว้ในที่
    ส่วนตัว (เช่น GitHub private) วิธีนี้จะเก็บหน่วยความจำ + ไฟล์ AGENTS/SOUL/USER
    และช่วยให้คุณกู้คืน "ใจ" ของผู้ช่วยได้ภายหลัง

    **อย่า** commit สิ่งใดภายใต้ `~/.openclaw` (ข้อมูลรับรอง, เซสชัน, โทเค็น หรือเพย์โหลดความลับที่เข้ารหัส)
    หากคุณต้องการกู้คืนทั้งหมด ให้สำรองทั้งเวิร์กสเปซและไดเรกทอรีสถานะ
    แยกกัน (ดูคำถามเรื่องการย้ายข้อมูลด้านบน)

    เอกสาร: [เวิร์กสเปซของเอเจนต์](/th/concepts/agent-workspace)

  </Accordion>

  <Accordion title="ฉันจะถอนการติดตั้ง OpenClaw ทั้งหมดได้อย่างไร?">
    ดูคู่มือเฉพาะ: [ถอนการติดตั้ง](/th/install/uninstall)
  </Accordion>

  <Accordion title="เอเจนต์ทำงานนอกเวิร์กสเปซได้หรือไม่?">
    ได้ เวิร์กสเปซคือ **cwd เริ่มต้น** และจุดยึดหน่วยความจำ ไม่ใช่ sandbox แบบตายตัว
    พาธสัมพัทธ์จะถูกแก้ภายในเวิร์กสเปซ แต่พาธสัมบูรณ์สามารถเข้าถึงตำแหน่งอื่นบน
    โฮสต์ได้ เว้นแต่จะเปิดใช้ sandboxing หากคุณต้องการการแยกใช้งาน ให้ใช้
    [`agents.defaults.sandbox`](/th/gateway/sandboxing) หรือการตั้งค่า sandbox ต่อเอเจนต์ หากคุณ
    ต้องการให้ repo เป็นไดเรกทอรีทำงานเริ่มต้น ให้ชี้ `workspace` ของเอเจนต์นั้นไปที่ราก repo
    repo ของ OpenClaw เป็นเพียงซอร์สโค้ด; แยกเวิร์กสเปซไว้ต่างหาก
    เว้นแต่คุณตั้งใจให้เอเจนต์ทำงานภายในนั้น

    ตัวอย่าง (repo เป็น cwd เริ่มต้น):

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

  <Accordion title="โหมดระยะไกล: ที่เก็บเซสชันอยู่ที่ไหน?">
    สถานะเซสชันเป็นของ **โฮสต์ Gateway** หากคุณอยู่ในโหมดระยะไกล ที่เก็บเซสชันที่คุณต้องสนใจจะอยู่บนเครื่องระยะไกล ไม่ใช่แล็ปท็อปในเครื่องของคุณ ดู [การจัดการเซสชัน](/th/concepts/session)
  </Accordion>
</AccordionGroup>

## พื้นฐานการกำหนดค่า

<AccordionGroup>
  <Accordion title="การกำหนดค่าอยู่ในรูปแบบใด? อยู่ที่ไหน?">
    OpenClaw อ่านการกำหนดค่า **JSON5** ที่เลือกใช้ได้จาก `$OPENCLAW_CONFIG_PATH` (ค่าเริ่มต้น: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    หากไม่มีไฟล์ ระบบจะใช้ค่าเริ่มต้นที่ค่อนข้างปลอดภัย (รวมถึงเวิร์กสเปซเริ่มต้นที่ `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title='ฉันตั้งค่า gateway.bind: "lan" (หรือ "tailnet") แล้วตอนนี้ไม่มีอะไร listen / UI บอกว่า unauthorized'>
    การ bind แบบไม่ใช่ loopback **ต้องมีพาธการยืนยันตัวตนของ gateway ที่ถูกต้อง** ในทางปฏิบัติหมายถึง:

    - การยืนยันตัวตนแบบ shared-secret: โทเค็นหรือรหัสผ่าน
    - `gateway.auth.mode: "trusted-proxy"` หลังพร็อกซีย้อนกลับแบบรับรู้ตัวตนที่กำหนดค่าอย่างถูกต้อง

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

    - `gateway.remote.token` / `.password` **ไม่** เปิดใช้การยืนยันตัวตน Gateway ในเครื่องด้วยตัวเอง
    - พาธการเรียกในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
    - สำหรับการยืนยันตัวตนด้วยรหัสผ่าน ให้ตั้งค่า `gateway.auth.mode: "password"` พร้อม `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`) แทน
    - หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าอย่างชัดเจนผ่าน SecretRef และแก้ค่าไม่ได้ การแก้ค่าจะล้มเหลวแบบปิด (ไม่มี remote fallback มาบดบัง)
    - การตั้งค่า Control UI แบบ shared-secret ยืนยันตัวตนผ่าน `connect.params.auth.token` หรือ `connect.params.auth.password` (เก็บไว้ในการตั้งค่าแอป/UI) โหมดที่มีข้อมูลตัวตน เช่น Tailscale Serve หรือ `trusted-proxy` ใช้ส่วนหัวคำขอแทน หลีกเลี่ยงการใส่ shared secrets ใน URL
    - เมื่อใช้ `gateway.auth.mode: "trusted-proxy"` พร็อกซีย้อนกลับ loopback บนโฮสต์เดียวกันต้องมี `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจนและมีรายการ loopback ใน `gateway.trustedProxies`

  </Accordion>

  <Accordion title="ทำไมตอนนี้ฉันต้องใช้โทเค็นบน localhost?">
    OpenClaw บังคับใช้การยืนยันตัวตน Gateway โดยค่าเริ่มต้น รวมถึง loopback ในพาธเริ่มต้นปกติหมายถึงการยืนยันตัวตนด้วยโทเค็น: หากไม่มีพาธการยืนยันตัวตนที่กำหนดค่าไว้อย่างชัดเจน การเริ่มต้น Gateway จะ resolve เป็นโหมดโทเค็นและสร้างโทเค็นเฉพาะรันไทม์สำหรับการเริ่มต้นครั้งนั้น ดังนั้น **ไคลเอนต์ WS ในเครื่องต้องยืนยันตัวตน** กำหนดค่า `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` หรือ `OPENCLAW_GATEWAY_PASSWORD` อย่างชัดเจนเมื่อไคลเอนต์ต้องใช้ secret ที่คงที่ข้ามการรีสตาร์ท วิธีนี้บล็อกกระบวนการในเครื่องอื่นไม่ให้เรียก Gateway

    หากคุณต้องการพาธการยืนยันตัวตนแบบอื่น คุณสามารถเลือกโหมดรหัสผ่านอย่างชัดเจนได้ (หรือ `trusted-proxy` สำหรับพร็อกซีย้อนกลับแบบรับรู้ตัวตน) หากคุณ **ต้องการจริง ๆ** ให้ loopback เปิดอยู่ ให้ตั้งค่า `gateway.auth.mode: "none"` อย่างชัดเจนในการกำหนดค่าของคุณ Doctor สามารถสร้างโทเค็นให้คุณได้ทุกเมื่อ: `openclaw doctor --generate-gateway-token`

  </Accordion>

  <Accordion title="ฉันต้องรีสตาร์ทหลังเปลี่ยนการกำหนดค่าหรือไม่?">
    Gateway เฝ้าดูการกำหนดค่าและรองรับ hot-reload:

    - `gateway.reload.mode: "hybrid"` (ค่าเริ่มต้น): hot-apply การเปลี่ยนแปลงที่ปลอดภัย และรีสตาร์ทสำหรับรายการสำคัญ
    - รองรับ `hot`, `restart`, `off` ด้วย

  </Accordion>

  <Accordion title="ฉันจะปิด tagline ตลก ๆ ของ CLI ได้อย่างไร?">
    ตั้งค่า `cli.banner.taglineMode` ในการกำหนดค่า:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: ซ่อนข้อความ tagline แต่ยังคงบรรทัดชื่อ/เวอร์ชันของแบนเนอร์ไว้
    - `default`: ใช้ `All your chats, one OpenClaw.` ทุกครั้ง
    - `random`: หมุนเวียน tagline ตลก/ตามฤดูกาล (พฤติกรรมเริ่มต้น)
    - หากคุณไม่ต้องการแบนเนอร์เลย ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

  </Accordion>

  <Accordion title="ฉันจะเปิดใช้การค้นหาเว็บ (และดึงข้อมูลเว็บ) ได้อย่างไร?">
    `web_fetch` ทำงานได้โดยไม่ต้องใช้ API key ส่วน `web_search` ขึ้นอยู่กับ
    ผู้ให้บริการที่คุณเลือก:

    - ผู้ให้บริการที่อิง API เช่น Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity และ Tavily ต้องตั้งค่า API key ตามปกติของบริการเหล่านั้น
    - Ollama Web Search ไม่ต้องใช้คีย์ แต่ใช้โฮสต์ Ollama ที่คุณกำหนดค่าไว้และต้องใช้ `ollama signin`
    - DuckDuckGo ไม่ต้องใช้คีย์ แต่เป็นการผสานรวมแบบไม่เป็นทางการที่อิง HTML
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

    การกำหนดค่า web-search เฉพาะ provider ตอนนี้อยู่ใต้ `plugins.entries.<plugin>.config.webSearch.*`
    เส้นทาง provider เดิม `tools.web.search.*` ยังโหลดได้ชั่วคราวเพื่อความเข้ากันได้ แต่ไม่ควรใช้สำหรับการกำหนดค่าใหม่
    การกำหนดค่า fallback ของ Firecrawl web-fetch อยู่ใต้ `plugins.entries.firecrawl.config.webFetch.*`

    หมายเหตุ:

    - หากคุณใช้ allowlists ให้เพิ่ม `web_search`/`web_fetch`/`x_search` หรือ `group:web`
    - `web_fetch` เปิดใช้งานโดยค่าเริ่มต้น (เว้นแต่จะปิดใช้งานอย่างชัดเจน)
    - หากละ `tools.web.fetch.provider` ไว้ OpenClaw จะตรวจหา provider fallback สำหรับ fetch ตัวแรกที่พร้อมใช้งานจากข้อมูลรับรองที่มีให้โดยอัตโนมัติ ปัจจุบัน provider ที่รวมมาให้คือ Firecrawl
    - daemon อ่าน env vars จาก `~/.openclaw/.env` (หรือ service environment)

    เอกสาร: [เครื่องมือเว็บ](/th/tools/web)

  </Accordion>

  <Accordion title="config.apply ล้างการกำหนดค่าของฉัน ฉันจะกู้คืนและหลีกเลี่ยงสิ่งนี้ได้อย่างไร">
    `config.apply` จะแทนที่ **การกำหนดค่าทั้งหมด** หากคุณส่ง object บางส่วน ทุกอย่าง
    อื่นจะถูกลบออก

    OpenClaw เวอร์ชันปัจจุบันป้องกันการเขียนทับโดยไม่ตั้งใจได้หลายกรณี:

    - การเขียนการกำหนดค่าที่ OpenClaw เป็นเจ้าของจะตรวจสอบการกำหนดค่าทั้งหมดหลังเปลี่ยนแปลงก่อนเขียน
    - การเขียนที่ OpenClaw เป็นเจ้าของซึ่งไม่ถูกต้องหรือมีลักษณะทำลายข้อมูลจะถูกปฏิเสธและบันทึกเป็น `openclaw.json.rejected.*`
    - หากการแก้ไขโดยตรงทำให้การเริ่มต้นหรือ hot reload เสีย Gateway จะ fail closed หรือข้ามการ reload; โดยจะไม่เขียน `openclaw.json` ใหม่
    - `openclaw doctor --fix` เป็นผู้รับผิดชอบการซ่อมแซมและสามารถกู้คืน last-known-good พร้อมบันทึกไฟล์ที่ถูกปฏิเสธเป็น `openclaw.json.clobbered.*`

    กู้คืน:

    - ตรวจสอบ `openclaw logs --follow` เพื่อหา `Invalid config at`, `Config write rejected:` หรือ `config reload skipped (invalid config)`
    - ตรวจสอบ `openclaw.json.clobbered.*` หรือ `openclaw.json.rejected.*` ล่าสุดที่อยู่ข้างการกำหนดค่าที่ใช้งานอยู่
    - เรียกใช้ `openclaw config validate` และ `openclaw doctor --fix`
    - คัดลอกกลับเฉพาะ key ที่ต้องการด้วย `openclaw config set` หรือ `config.patch`
    - หากคุณไม่มี last-known-good หรือ payload ที่ถูกปฏิเสธ ให้กู้คืนจากข้อมูลสำรอง หรือเรียกใช้ `openclaw doctor` อีกครั้งแล้วกำหนดค่า channels/models ใหม่
    - หากสิ่งนี้เกิดขึ้นโดยไม่คาดคิด ให้รายงาน bug และแนบการกำหนดค่าล่าสุดที่ทราบหรือข้อมูลสำรองใดๆ
    - agent เขียนโค้ดแบบ local มักสามารถสร้างการกำหนดค่าที่ทำงานได้ขึ้นใหม่จาก logs หรือ history

    หลีกเลี่ยง:

    - ใช้ `openclaw config set` สำหรับการเปลี่ยนแปลงเล็กๆ
    - ใช้ `openclaw configure` สำหรับการแก้ไขแบบโต้ตอบ
    - ใช้ `config.schema.lookup` ก่อนเมื่อคุณไม่แน่ใจเกี่ยวกับ path หรือรูปร่างของ field ที่แน่นอน; คำสั่งนี้จะคืน schema node แบบตื้นพร้อมสรุป child โดยตรงสำหรับเจาะลึก
    - ใช้ `config.patch` สำหรับการแก้ไข RPC บางส่วน; เก็บ `config.apply` ไว้สำหรับการแทนที่การกำหนดค่าแบบเต็มเท่านั้น
    - หากคุณใช้เครื่องมือ `gateway` แบบ owner-only จากการรัน agent เครื่องมือนี้จะยังคงปฏิเสธการเขียนไปยัง `tools.exec.ask` / `tools.exec.security` (รวมถึง alias เดิม `tools.bash.*` ที่ normalize ไปยัง exec paths ที่ได้รับการป้องกันเดียวกัน)

    เอกสาร: [การกำหนดค่า](/th/cli/config), [กำหนดค่า](/th/cli/configure), [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันจะรัน Gateway กลางพร้อม workers เฉพาะทางข้ามอุปกรณ์ได้อย่างไร">
    รูปแบบทั่วไปคือ **Gateway หนึ่งตัว** (เช่น Raspberry Pi) พร้อม **nodes** และ **agents**:

    - **Gateway (ศูนย์กลาง):** เป็นเจ้าของ channels (Signal/WhatsApp), routing และ sessions
    - **Nodes (อุปกรณ์):** Macs/iOS/Android เชื่อมต่อเป็น peripherals และ expose เครื่องมือ local (`system.run`, `canvas`, `camera`)
    - **Agents (workers):** สมอง/workspaces แยกกันสำหรับบทบาทพิเศษ (เช่น "Hetzner ops", "Personal data")
    - **Sub-agents:** spawn งานเบื้องหลังจาก agent หลักเมื่อคุณต้องการการทำงานแบบขนาน
    - **TUI:** เชื่อมต่อกับ Gateway และสลับ agents/sessions

    เอกสาร: [Nodes](/th/nodes), [การเข้าถึงระยะไกล](/th/gateway/remote), [การกำหนดเส้นทาง Multi-Agent](/th/concepts/multi-agent), [Sub-agents](/th/tools/subagents), [TUI](/th/web/tui)

  </Accordion>

  <Accordion title="เบราว์เซอร์ OpenClaw รันแบบ headless ได้หรือไม่">
    ได้ เป็นตัวเลือกการกำหนดค่า:

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

    ค่าเริ่มต้นคือ `false` (headful) Headless มีแนวโน้มมากกว่าที่จะกระตุ้นการตรวจสอบ anti-bot ในบางไซต์ ดู [เบราว์เซอร์](/th/tools/browser)

    Headless ใช้ **Chromium engine เดียวกัน** และทำงานได้กับ automation ส่วนใหญ่ (forms, clicks, scraping, logins) ความแตกต่างหลักคือ:

    - ไม่มีหน้าต่างเบราว์เซอร์ที่มองเห็นได้ (ใช้ screenshots หากคุณต้องการภาพ)
    - บางไซต์เข้มงวดกับ automation ในโหมด headless มากกว่า (CAPTCHAs, anti-bot)
      ตัวอย่างเช่น X/Twitter มักบล็อก sessions แบบ headless

  </Accordion>

  <Accordion title="ฉันจะใช้ Brave สำหรับการควบคุมเบราว์เซอร์ได้อย่างไร">
    ตั้งค่า `browser.executablePath` เป็น binary ของ Brave (หรือเบราว์เซอร์ที่ใช้ Chromium อื่นๆ) แล้ว restart Gateway
    ดูตัวอย่างการกำหนดค่าแบบเต็มใน [เบราว์เซอร์](/th/tools/browser#use-brave-or-another-chromium-based-browser)
  </Accordion>
</AccordionGroup>

## Gateway และ nodes ระยะไกล

<AccordionGroup>
  <Accordion title="คำสั่งเผยแพร่ระหว่าง Telegram, gateway และ nodes อย่างไร">
    ข้อความ Telegram ถูกจัดการโดย **gateway** gateway จะรัน agent และ
    จากนั้นจึงเรียก nodes ผ่าน **Gateway WebSocket** เมื่อจำเป็นต้องใช้เครื่องมือ node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes จะไม่เห็น traffic provider ขาเข้า; nodes จะได้รับเฉพาะ node RPC calls เท่านั้น

  </Accordion>

  <Accordion title="agent ของฉันจะเข้าถึงคอมพิวเตอร์ของฉันได้อย่างไรหาก Gateway ถูกโฮสต์จากระยะไกล">
    คำตอบสั้นๆ: **pair คอมพิวเตอร์ของคุณเป็น node** Gateway รันอยู่ที่อื่น แต่สามารถ
    เรียกเครื่องมือ `node.*` (screen, camera, system) บนเครื่อง local ของคุณผ่าน Gateway WebSocket ได้

    การตั้งค่าทั่วไป:

    1. รัน Gateway บน host ที่เปิดตลอดเวลา (VPS/home server)
    2. วาง Gateway host + คอมพิวเตอร์ของคุณไว้ใน tailnet เดียวกัน
    3. ตรวจสอบให้แน่ใจว่า Gateway WS เข้าถึงได้ (tailnet bind หรือ SSH tunnel)
    4. เปิดแอป macOS แบบ local และเชื่อมต่อในโหมด **Remote over SSH** (หรือ tailnet โดยตรง)
       เพื่อให้ลงทะเบียนเป็น node ได้
    5. อนุมัติ node บน Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ไม่จำเป็นต้องใช้ TCP bridge แยกต่างหาก; nodes เชื่อมต่อผ่าน Gateway WebSocket

    คำเตือนด้านความปลอดภัย: การ pairing node macOS อนุญาตให้ใช้ `system.run` บนเครื่องนั้น จับคู่เฉพาะ
    อุปกรณ์ที่คุณเชื่อถือ และตรวจทาน [ความปลอดภัย](/th/gateway/security)

    เอกสาร: [Nodes](/th/nodes), [Gateway protocol](/th/gateway/protocol), [โหมดระยะไกลของ macOS](/th/platforms/mac/remote), [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="Tailscale เชื่อมต่อแล้วแต่ฉันไม่ได้รับการตอบกลับ ควรทำอย่างไรต่อ">
    ตรวจสอบพื้นฐาน:

    - Gateway กำลังทำงาน: `openclaw gateway status`
    - สุขภาพของ Gateway: `openclaw status`
    - สุขภาพของ Channel: `openclaw channels status`

    จากนั้นตรวจสอบ auth และ routing:

    - หากคุณใช้ Tailscale Serve ให้ตรวจสอบว่า `gateway.auth.allowTailscale` ตั้งค่าอย่างถูกต้อง
    - หากคุณเชื่อมต่อผ่าน SSH tunnel ให้ยืนยันว่า tunnel แบบ local ทำงานอยู่และชี้ไปยัง port ที่ถูกต้อง
    - ยืนยันว่า allowlists ของคุณ (DM หรือ group) รวม account ของคุณแล้ว

    เอกสาร: [Tailscale](/th/gateway/tailscale), [การเข้าถึงระยะไกล](/th/gateway/remote), [Channels](/th/channels)

  </Accordion>

  <Accordion title="OpenClaw สอง instance คุยกันได้หรือไม่ (local + VPS)">
    ได้ ไม่มี bridge แบบ "bot-to-bot" ในตัว แต่คุณสามารถเชื่อมต่อได้ด้วยวิธีที่เชื่อถือได้หลายแบบ:

    **ง่ายที่สุด:** ใช้ chat channel ปกติที่ bots ทั้งสองเข้าถึงได้ (Telegram/Slack/WhatsApp)
    ให้ Bot A ส่งข้อความไปหา Bot B แล้วให้ Bot B ตอบกลับตามปกติ

    **CLI bridge (ทั่วไป):** รัน script ที่เรียก Gateway อีกตัวด้วย
    `openclaw agent --message ... --deliver` โดยกำหนดเป้าหมายเป็น chat ที่ bot อีกตัว
    ฟังอยู่ หาก bot หนึ่งอยู่บน VPS ระยะไกล ให้ชี้ CLI ของคุณไปยัง Gateway ระยะไกลนั้น
    ผ่าน SSH/Tailscale (ดู [การเข้าถึงระยะไกล](/th/gateway/remote))

    รูปแบบตัวอย่าง (รันจากเครื่องที่เข้าถึง Gateway เป้าหมายได้):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    เคล็ดลับ: เพิ่ม guardrail เพื่อให้ bots สองตัวไม่วนลูปไม่รู้จบ (mention-only, channel
    allowlists หรือกฎ "do not reply to bot messages")

    เอกสาร: [การเข้าถึงระยะไกล](/th/gateway/remote), [Agent CLI](/th/cli/agent), [Agent send](/th/tools/agent-send)

  </Accordion>

  <Accordion title="ฉันต้องใช้ VPS แยกกันสำหรับหลาย agents หรือไม่">
    ไม่จำเป็น Gateway หนึ่งตัวสามารถโฮสต์ agents ได้หลายตัว โดยแต่ละตัวมี workspace, ค่าเริ่มต้นของ model
    และ routing ของตัวเอง นี่คือการตั้งค่าปกติ และมีค่าใช้จ่ายถูกกว่าและเรียบง่ายกว่าการรัน
    VPS หนึ่งตัวต่อ agent มาก

    ใช้ VPS แยกกันเฉพาะเมื่อคุณต้องการการแยกที่เข้มงวด (ขอบเขตความปลอดภัย) หรือการกำหนดค่าที่แตกต่างกันมาก
    ซึ่งคุณไม่ต้องการแชร์ มิฉะนั้น ให้ใช้ Gateway หนึ่งตัวและ
    ใช้หลาย agents หรือ sub-agents

  </Accordion>

  <Accordion title="การใช้ node บนแล็ปท็อปส่วนตัวของฉันแทน SSH จาก VPS มีประโยชน์หรือไม่">
    มี - nodes เป็นวิธีหลักในการเข้าถึงแล็ปท็อปของคุณจาก Gateway ระยะไกล และ
    ปลดล็อกได้มากกว่าการเข้าถึง shell Gateway รันบน macOS/Linux (Windows ผ่าน WSL2) และ
    มีน้ำหนักเบา (VPS ขนาดเล็กหรือกล่องระดับ Raspberry Pi ก็เพียงพอ; RAM 4 GB เหลือเฟือ) ดังนั้นการตั้งค่าทั่วไป
    คือ host ที่เปิดตลอดเวลาพร้อมแล็ปท็อปของคุณเป็น node

    - **ไม่ต้องใช้ SSH ขาเข้า** Nodes เชื่อมต่อออกไปยัง Gateway WebSocket และใช้ device pairing
    - **การควบคุมการดำเนินการที่ปลอดภัยกว่า** `system.run` ถูกควบคุมโดย node allowlists/approvals บนแล็ปท็อปนั้น
    - **เครื่องมืออุปกรณ์มากขึ้น** Nodes expose `canvas`, `camera` และ `screen` นอกเหนือจาก `system.run`
    - **การทำ browser automation แบบ local** เก็บ Gateway ไว้บน VPS แต่รัน Chrome แบบ local ผ่าน node host บนแล็ปท็อป หรือ attach ไปยัง Chrome แบบ local บน host ผ่าน Chrome MCP

    SSH เหมาะสำหรับการเข้าถึง shell แบบเฉพาะกิจ แต่ nodes เรียบง่ายกว่าสำหรับ workflow ของ agent ต่อเนื่องและ
    device automation

    เอกสาร: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes), [เบราว์เซอร์](/th/tools/browser)

  </Accordion>

  <Accordion title="nodes รัน gateway service หรือไม่">
    ไม่ เฉพาะ **gateway หนึ่งตัว** เท่านั้นที่ควรรันต่อ host เว้นแต่คุณตั้งใจรัน profiles ที่แยกกัน (ดู [หลาย gateways](/th/gateway/multiple-gateways)) Nodes เป็น peripherals ที่เชื่อมต่อ
    ไปยัง gateway (nodes ของ iOS/Android หรือ "node mode" ของ macOS ในแอป menubar) สำหรับ node
    hosts แบบ headless และการควบคุมผ่าน CLI ดู [Node host CLI](/th/cli/node)

    ต้อง restart แบบเต็มสำหรับการเปลี่ยนแปลง `gateway`, `discovery` และ `canvasHost`

  </Accordion>

  <Accordion title="มีวิธี API / RPC สำหรับ apply config หรือไม่">
    มี

    - `config.schema.lookup`: ตรวจสอบซับทรี config หนึ่งรายการพร้อมโหนดสคีมาแบบตื้น, คำใบ้ UI ที่ตรงกัน, และสรุปลูกโดยตรงก่อนเขียน
    - `config.get`: ดึง snapshot + hash ปัจจุบัน
    - `config.patch`: อัปเดตบางส่วนอย่างปลอดภัย (แนะนำสำหรับการแก้ไข RPC ส่วนใหญ่); hot-reload เมื่อทำได้ และรีสตาร์ตเมื่อจำเป็น
    - `config.apply`: ตรวจสอบความถูกต้อง + แทนที่ config ทั้งหมด; hot-reload เมื่อทำได้ และรีสตาร์ตเมื่อจำเป็น
    - เครื่องมือ runtime `gateway` สำหรับเจ้าของเท่านั้นยังคงปฏิเสธการเขียน `tools.exec.ask` / `tools.exec.security` ใหม่; alias เดิม `tools.bash.*` จะถูก normalize ไปยัง exec path ที่ป้องกันไว้เดียวกัน

  </Accordion>

  <Accordion title="config ขั้นต่ำที่สมเหตุสมผลสำหรับการติดตั้งครั้งแรก">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    ค่านี้ตั้งค่า workspace ของคุณและจำกัดว่าใครสามารถ trigger bot ได้

  </Accordion>

  <Accordion title="ฉันจะตั้งค่า Tailscale บน VPS และเชื่อมต่อจาก Mac ได้อย่างไร?">
    ขั้นตอนขั้นต่ำ:

    1. **ติดตั้ง + เข้าสู่ระบบบน VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **ติดตั้ง + เข้าสู่ระบบบน Mac ของคุณ**
       - ใช้แอป Tailscale และลงชื่อเข้าใช้ tailnet เดียวกัน
    3. **เปิดใช้ MagicDNS (แนะนำ)**
       - ในคอนโซลผู้ดูแลระบบ Tailscale ให้เปิดใช้ MagicDNS เพื่อให้ VPS มีชื่อที่เสถียร
    4. **ใช้ชื่อโฮสต์ของ tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    หากคุณต้องการ Control UI โดยไม่ใช้ SSH ให้ใช้ Tailscale Serve บน VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    วิธีนี้ทำให้ Gateway bind อยู่กับ loopback และเปิดเผย HTTPS ผ่าน Tailscale ดู [Tailscale](/th/gateway/tailscale)

  </Accordion>

  <Accordion title="ฉันจะเชื่อมต่อ Node บน Mac กับ Gateway ระยะไกล (Tailscale Serve) ได้อย่างไร?">
    Serve เปิดเผย **Gateway Control UI + WS** Node เชื่อมต่อผ่าน endpoint Gateway WS เดียวกัน

    การตั้งค่าที่แนะนำ:

    1. **ตรวจสอบให้แน่ใจว่า VPS + Mac อยู่ใน tailnet เดียวกัน**
    2. **ใช้แอป macOS ในโหมด Remote** (เป้าหมาย SSH สามารถเป็นชื่อโฮสต์ของ tailnet ได้)
       แอปจะ tunnel พอร์ต Gateway และเชื่อมต่อเป็น Node
    3. **อนุมัติ Node** บน Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    เอกสาร: [โปรโตคอล Gateway](/th/gateway/protocol), [การค้นพบ](/th/gateway/discovery), [โหมดระยะไกลของ macOS](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันควรติดตั้งบนแล็ปท็อปเครื่องที่สองหรือแค่เพิ่ม Node?">
    หากคุณต้องการเพียง **เครื่องมือในเครื่อง** (หน้าจอ/กล้อง/exec) บนแล็ปท็อปเครื่องที่สอง ให้เพิ่มเป็น
    **Node** วิธีนี้คง Gateway เดียวไว้และหลีกเลี่ยง config ซ้ำซ้อน เครื่องมือ Node ในเครื่อง
    ปัจจุบันรองรับเฉพาะ macOS แต่เราวางแผนจะขยายไปยัง OS อื่น

    ติดตั้ง Gateway ตัวที่สองเฉพาะเมื่อคุณต้องการ **การแยกอย่างเข้มงวด** หรือ bot สองตัวที่แยกกันเต็มรูปแบบ

    เอกสาร: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes), [Gateway หลายตัว](/th/gateway/multiple-gateways)

  </Accordion>
</AccordionGroup>

## env var และการโหลด .env

<AccordionGroup>
  <Accordion title="OpenClaw โหลดตัวแปรสภาพแวดล้อมอย่างไร?">
    OpenClaw อ่าน env var จาก parent process (shell, launchd/systemd, CI ฯลฯ) และยังโหลดเพิ่มเติมจาก:

    - `.env` จากไดเรกทอรีทำงานปัจจุบัน
    - `.env` fallback ส่วนกลางจาก `~/.openclaw/.env` (หรือ `$OPENCLAW_STATE_DIR/.env`)

    ไฟล์ `.env` ทั้งสองไฟล์จะไม่ override env var ที่มีอยู่

    คุณยังสามารถกำหนด env var แบบ inline ใน config ได้ (ใช้เฉพาะเมื่อไม่มีใน process env):

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

  <Accordion title="ฉันเริ่ม Gateway ผ่าน service แล้ว env var ของฉันหายไป ตอนนี้ควรทำอย่างไร?">
    วิธีแก้ที่พบบ่อยสองวิธี:

    1. ใส่ key ที่หายไปใน `~/.openclaw/.env` เพื่อให้ถูกโหลดแม้ service จะไม่สืบทอด shell env ของคุณ
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

    วิธีนี้รัน login shell ของคุณและนำเข้าเฉพาะ key ที่คาดไว้ซึ่งหายไป (ไม่ override เด็ดขาด) env var ที่เทียบเท่า:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

  </Accordion>

  <Accordion title='ฉันตั้งค่า COPILOT_GITHUB_TOKEN แล้ว แต่สถานะโมเดลแสดง "Shell env: off." เพราะอะไร?'>
    `openclaw models status` รายงานว่าเปิดใช้ **การนำเข้า shell env** อยู่หรือไม่ "Shell env: off"
    **ไม่ได้** หมายความว่า env var ของคุณหายไป แต่หมายความว่า OpenClaw จะไม่โหลด
    login shell ของคุณโดยอัตโนมัติ

    หาก Gateway รันเป็น service (launchd/systemd) จะไม่สืบทอดสภาพแวดล้อม shell
    ของคุณ แก้ไขโดยทำอย่างใดอย่างหนึ่งต่อไปนี้:

    1. ใส่ token ใน `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. หรือเปิดใช้การนำเข้า shell (`env.shellEnv.enabled: true`)
    3. หรือเพิ่มลงในบล็อก `env` ใน config ของคุณ (ใช้เฉพาะเมื่อไม่มี)

    จากนั้นรีสตาร์ต Gateway และตรวจสอบอีกครั้ง:

    ```bash
    openclaw models status
    ```

    token ของ Copilot ถูกอ่านจาก `COPILOT_GITHUB_TOKEN` (รวมถึง `GH_TOKEN` / `GITHUB_TOKEN`)
    ดู [/concepts/model-providers](/th/concepts/model-providers) และ [/environment](/th/help/environment)

  </Accordion>
</AccordionGroup>

## เซสชันและหลายแชต

<AccordionGroup>
  <Accordion title="ฉันจะเริ่มการสนทนาใหม่ได้อย่างไร?">
    ส่ง `/new` หรือ `/reset` เป็นข้อความเดี่ยว ดู [การจัดการเซสชัน](/th/concepts/session)
  </Accordion>

  <Accordion title="เซสชันจะรีเซ็ตโดยอัตโนมัติไหมถ้าฉันไม่เคยส่ง /new?">
    เซสชันสามารถหมดอายุหลังจาก `session.idleMinutes` แต่ค่าเริ่มต้นคือ **ปิดใช้** (ค่าเริ่มต้น **0**)
    ตั้งค่าเป็นค่าบวกเพื่อเปิดใช้การหมดอายุเมื่อไม่ได้ใช้งาน เมื่อเปิดใช้แล้ว ข้อความ **ถัดไป**
    หลังช่วงเวลาที่ไม่ได้ใช้งานจะเริ่ม session id ใหม่สำหรับ chat key นั้น
    การดำเนินการนี้ไม่ลบ transcript แต่เพียงเริ่มเซสชันใหม่

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="มีวิธีสร้างทีมของอินสแตนซ์ OpenClaw (CEO หนึ่งคนและเอเจนต์หลายตัว) หรือไม่?">
    มี ผ่าน **การกำหนดเส้นทางแบบหลายเอเจนต์** และ **sub-agents** คุณสามารถสร้างเอเจนต์ผู้ประสานงานหนึ่งตัว
    และเอเจนต์ worker หลายตัวพร้อม workspace และโมเดลของตนเอง

    อย่างไรก็ตาม ควรมองสิ่งนี้เป็น **การทดลองสนุก ๆ** มากกว่า มันใช้ token มากและมัก
    มีประสิทธิภาพน้อยกว่าการใช้ bot หนึ่งตัวกับเซสชันแยกกัน โมเดลทั่วไปที่เรา
    มองไว้คือ bot หนึ่งตัวที่คุณคุยด้วย พร้อมเซสชันต่าง ๆ สำหรับงานคู่ขนาน bot นั้น
    ยังสามารถ spawn sub-agents ได้เมื่อจำเป็น

    เอกสาร: [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent), [Sub-agents](/th/tools/subagents), [Agents CLI](/th/cli/agents)

  </Accordion>

  <Accordion title="ทำไม context จึงถูกตัดกลางงาน? ฉันจะป้องกันได้อย่างไร?">
    context ของเซสชันถูกจำกัดด้วยหน้าต่างของโมเดล แชตยาว เอาต์พุตเครื่องมือขนาดใหญ่ หรือไฟล์จำนวนมาก
    อาจ trigger Compaction หรือการตัดทอน

    สิ่งที่ช่วยได้:

    - ขอให้ bot สรุปสถานะปัจจุบันและเขียนลงไฟล์
    - ใช้ `/compact` ก่อนงานยาว และ `/new` เมื่อเปลี่ยนหัวข้อ
    - เก็บ context สำคัญไว้ใน workspace และขอให้ bot อ่านกลับ
    - ใช้ sub-agents สำหรับงานยาวหรืองานคู่ขนาน เพื่อให้แชตหลักเล็กลง
    - เลือกโมเดลที่มีหน้าต่าง context ใหญ่ขึ้นหากเกิดขึ้นบ่อย

  </Accordion>

  <Accordion title="ฉันจะรีเซ็ต OpenClaw ทั้งหมดแต่ยังคงติดตั้งไว้ได้อย่างไร?">
    ใช้คำสั่ง reset:

    ```bash
    openclaw reset
    ```

    การรีเซ็ตทั้งหมดแบบ non-interactive:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    จากนั้นรัน setup อีกครั้ง:

    ```bash
    openclaw onboard --install-daemon
    ```

    หมายเหตุ:

    - Onboarding ยังเสนอ **Reset** หากพบ config ที่มีอยู่ ดู [Onboarding (CLI)](/th/start/wizard)
    - หากคุณใช้โปรไฟล์ (`--profile` / `OPENCLAW_PROFILE`) ให้รีเซ็ต state dir แต่ละรายการ (ค่าเริ่มต้นคือ `~/.openclaw-<profile>`)
    - รีเซ็ตสำหรับ dev: `openclaw gateway --dev --reset` (เฉพาะ dev; ล้าง config + credentials + sessions + workspace สำหรับ dev)

  </Accordion>

  <Accordion title='ฉันได้รับข้อผิดพลาด "context too large" ฉันจะรีเซ็ตหรือ compact ได้อย่างไร?'>
    ใช้อย่างใดอย่างหนึ่งต่อไปนี้:

    - **Compact** (คงการสนทนาไว้แต่สรุป turn เก่า):

      ```
      /compact
      ```

      หรือ `/compact <instructions>` เพื่อกำหนดแนวทางให้สรุป

    - **Reset** (session ID ใหม่สำหรับ chat key เดิม):

      ```
      /new
      /reset
      ```

    หากยังเกิดขึ้นต่อเนื่อง:

    - เปิดใช้หรือปรับ **session pruning** (`agents.defaults.contextPruning`) เพื่อตัดเอาต์พุตเครื่องมือเก่า
    - ใช้โมเดลที่มีหน้าต่าง context ใหญ่ขึ้น

    เอกสาร: [Compaction](/th/concepts/compaction), [Session pruning](/th/concepts/session-pruning), [การจัดการเซสชัน](/th/concepts/session)

  </Accordion>

  <Accordion title='ทำไมฉันเห็น "LLM request rejected: messages.content.tool_use.input field required"?'>
    นี่คือข้อผิดพลาดการตรวจสอบจาก provider: โมเดลสร้างบล็อก `tool_use` โดยไม่มี
    `input` ที่จำเป็น โดยปกติหมายความว่าประวัติเซสชันล้าสมัยหรือเสียหาย (มักเกิดหลังเธรดยาว
    หรือการเปลี่ยนเครื่องมือ/สคีมา)

    วิธีแก้: เริ่มเซสชันใหม่ด้วย `/new` (ข้อความเดี่ยว)

  </Accordion>

  <Accordion title="ทำไมฉันได้รับข้อความ Heartbeat ทุก 30 นาที?">
    Heartbeat รันทุก **30m** โดยค่าเริ่มต้น (**1h** เมื่อใช้ OAuth auth) ปรับหรือปิดใช้ได้:

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

    หาก `HEARTBEAT.md` มีอยู่แต่แทบว่างเปล่า (มีเพียงบรรทัดว่างและ header markdown
    เช่น `# Heading`) OpenClaw จะข้ามการรัน Heartbeat เพื่อประหยัด API call
    หากไฟล์หายไป Heartbeat จะยังคงรันและโมเดลตัดสินใจว่าจะทำอะไร

    การ override ต่อเอเจนต์ใช้ `agents.list[].heartbeat` เอกสาร: [Heartbeat](/th/gateway/heartbeat)

  </Accordion>

  <Accordion title='ฉันจำเป็นต้องเพิ่ม "บัญชี bot" เข้าไปในกลุ่ม WhatsApp หรือไม่?'>
    ไม่จำเป็น OpenClaw รันบน **บัญชีของคุณเอง** ดังนั้นถ้าคุณอยู่ในกลุ่ม OpenClaw ก็เห็นได้
    โดยค่าเริ่มต้น การตอบกลับในกลุ่มจะถูกบล็อกจนกว่าคุณจะอนุญาตผู้ส่ง (`groupPolicy: "allowlist"`)

    หากคุณต้องการให้มีเพียง **คุณ** ที่ trigger การตอบกลับในกลุ่มได้:

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

  <Accordion title="ฉันจะหา JID ของกลุ่ม WhatsApp ได้อย่างไร?">
    ตัวเลือก 1 (เร็วที่สุด): tail log และส่งข้อความทดสอบในกลุ่ม:

    ```bash
    openclaw logs --follow --json
    ```

    มองหา `chatId` (หรือ `from`) ที่ลงท้ายด้วย `@g.us` เช่น:
    `1234567890-1234567890@g.us`

    ตัวเลือก 2 (หากกำหนดค่า/allowlist แล้ว): แสดงรายการกลุ่มจาก config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    เอกสาร: [WhatsApp](/th/channels/whatsapp), [Directory](/th/cli/directory), [Logs](/th/cli/logs)

  </Accordion>

  <Accordion title="ทำไม OpenClaw ไม่ตอบกลับในกลุ่ม?">
    สาเหตุที่พบบ่อยสองอย่าง:

    - การ gate ด้วย mention เปิดอยู่ (ค่าเริ่มต้น) คุณต้อง @mention bot (หรือให้ตรงกับ `mentionPatterns`)
    - คุณกำหนดค่า `channels.whatsapp.groups` โดยไม่มี `"*"` และกลุ่มไม่ได้อยู่ใน allowlist

    ดู [กลุ่ม](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages)

  </Accordion>

  <Accordion title="กลุ่ม/เธรดแชร์ context กับ DM หรือไม่?">
    แชตโดยตรงจะถูกรวมเข้ากับเซสชันหลักโดยค่าเริ่มต้น กลุ่ม/ช่องมี session key ของตนเอง และหัวข้อ Telegram / เธรด Discord เป็นเซสชันแยกต่างหาก ดู [กลุ่ม](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages)
  </Accordion>

  <Accordion title="ฉันสามารถสร้างเวิร์กสเปซและเอเจนต์ได้กี่รายการ?">
    ไม่มีขีดจำกัดตายตัว หลายสิบรายการ (หรือแม้แต่หลายร้อยรายการ) ก็ได้ แต่ให้ระวัง:

    - **พื้นที่ดิสก์เพิ่มขึ้น:** เซสชัน + ทรานสคริปต์อยู่ภายใต้ `~/.openclaw/agents/<agentId>/sessions/`.
    - **ค่าใช้จ่ายโทเค็น:** เอเจนต์มากขึ้นหมายถึงการใช้งานโมเดลพร้อมกันมากขึ้น
    - **ภาระงานปฏิบัติการ:** โปรไฟล์การยืนยันตัวตน เวิร์กสเปซ และการกำหนดเส้นทางช่องทางแบบแยกตามเอเจนต์

    เคล็ดลับ:

    - เก็บเวิร์กสเปซที่ **ใช้งานอยู่** หนึ่งรายการต่อเอเจนต์ (`agents.defaults.workspace`)
    - ตัดเซสชันเก่าออก (ลบ JSONL หรือรายการในสโตร์) หากดิสก์เพิ่มขึ้น
    - ใช้ `openclaw doctor` เพื่อตรวจหาเวิร์กสเปซที่หลงเหลือและโปรไฟล์ที่ไม่ตรงกัน

  </Accordion>

  <Accordion title="ฉันสามารถเรียกใช้บอทหรือแชทหลายรายการพร้อมกัน (Slack) ได้ไหม และควรตั้งค่าอย่างไร?">
    ได้ ใช้ **การกำหนดเส้นทางหลายเอเจนต์** เพื่อเรียกใช้เอเจนต์หลายตัวที่แยกจากกัน และกำหนดเส้นทางข้อความขาเข้าตาม
    ช่องทาง/บัญชี/เพียร์ Slack รองรับในฐานะช่องทางและสามารถผูกกับเอเจนต์เฉพาะได้

    การเข้าถึงเบราว์เซอร์ทรงพลัง แต่ไม่ใช่ "ทำได้ทุกอย่างเหมือนมนุษย์" - ระบบป้องกันบอท, CAPTCHA และ MFA
    ยังอาจบล็อกระบบอัตโนมัติได้ เพื่อการควบคุมเบราว์เซอร์ที่เชื่อถือได้ที่สุด ให้ใช้ Chrome MCP ในเครื่องบนโฮสต์
    หรือใช้ CDP บนเครื่องที่เรียกใช้เบราว์เซอร์จริง

    การตั้งค่าตามแนวทางปฏิบัติที่ดีที่สุด:

    - โฮสต์ Gateway ที่เปิดตลอดเวลา (VPS/Mac mini)
    - หนึ่งเอเจนต์ต่อหนึ่งบทบาท (การผูก)
    - ช่องทาง Slack ที่ผูกกับเอเจนต์เหล่านั้น
    - เบราว์เซอร์ในเครื่องผ่าน Chrome MCP หรือ Node เมื่อจำเป็น

    เอกสาร: [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [Slack](/th/channels/slack),
    [เบราว์เซอร์](/th/tools/browser), [Nodes](/th/nodes).

  </Accordion>
</AccordionGroup>

## โมเดล, การสลับเมื่อขัดข้อง, และโปรไฟล์การยืนยันตัวตน

คำถามและคำตอบเกี่ยวกับโมเดล — ค่าเริ่มต้น, การเลือก, นามแฝง, การสลับ, การสลับเมื่อขัดข้อง, โปรไฟล์การยืนยันตัวตน —
อยู่ใน [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models)

## Gateway: พอร์ต, "ทำงานอยู่แล้ว", และโหมดระยะไกล

<AccordionGroup>
  <Accordion title="Gateway ใช้พอร์ตใด?">
    `gateway.port` ควบคุมพอร์ตมัลติเพล็กซ์เดียวสำหรับ WebSocket + HTTP (Control UI, hooks ฯลฯ)

    ลำดับความสำคัญ:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status จึงบอกว่า "Runtime: running" แต่ "Connectivity probe: failed"?'>
    เพราะ "running" คือมุมมองของ **ซูเปอร์ไวเซอร์** (launchd/systemd/schtasks) ส่วนโพรบการเชื่อมต่อคือ CLI ที่เชื่อมต่อกับ WebSocket ของ Gateway จริง

    ใช้ `openclaw gateway status` และเชื่อถือบรรทัดเหล่านี้:

    - `Probe target:` (URL ที่โพรบใช้จริง)
    - `Listening:` (สิ่งที่ถูกผูกอยู่บนพอร์ตจริง)
    - `Last gateway error:` (สาเหตุรากที่พบบ่อยเมื่อโปรเซสยังมีชีวิตอยู่แต่พอร์ตไม่ได้ฟังอยู่)

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status แสดง "Config (cli)" และ "Config (service)" ต่างกัน?'>
    คุณกำลังแก้ไขไฟล์คอนฟิกหนึ่งไฟล์ ในขณะที่บริการกำลังใช้อีกไฟล์หนึ่งอยู่ (มักเป็นความไม่ตรงกันของ `--profile` / `OPENCLAW_STATE_DIR`)

    วิธีแก้:

    ```bash
    openclaw gateway install --force
    ```

    เรียกใช้คำสั่งนั้นจาก `--profile` / สภาพแวดล้อมเดียวกับที่คุณต้องการให้บริการใช้

  </Accordion>

  <Accordion title='"another gateway instance is already listening" หมายความว่าอะไร?'>
    OpenClaw บังคับใช้ล็อกรันไทม์ด้วยการผูกตัวฟัง WebSocket ทันทีเมื่อเริ่มต้น (ค่าเริ่มต้น `ws://127.0.0.1:18789`) หากการผูกล้มเหลวด้วย `EADDRINUSE` ระบบจะโยน `GatewayLockError` ที่ระบุว่าอีกอินสแตนซ์หนึ่งกำลังฟังอยู่แล้ว

    วิธีแก้: หยุดอินสแตนซ์อื่น ปลดพอร์ตให้ว่าง หรือเรียกใช้ด้วย `openclaw gateway --port <port>`

  </Accordion>

  <Accordion title="ฉันจะเรียกใช้ OpenClaw ในโหมดระยะไกลได้อย่างไร (ไคลเอนต์เชื่อมต่อกับ Gateway ที่อื่น)?">
    ตั้งค่า `gateway.mode: "remote"` และชี้ไปที่ URL WebSocket ระยะไกล โดยเลือกใช้ข้อมูลประจำตัวระยะไกลแบบความลับร่วมได้:

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

    - `openclaw gateway` เริ่มต้นเฉพาะเมื่อ `gateway.mode` เป็น `local` (หรือคุณส่งแฟล็กแทนที่)
    - แอป macOS เฝ้าดูไฟล์คอนฟิกและสลับโหมดแบบสดเมื่อค่าเหล่านี้เปลี่ยน
    - `gateway.remote.token` / `.password` เป็นข้อมูลประจำตัวระยะไกลฝั่งไคลเอนต์เท่านั้น โดยตัวมันเองไม่ได้เปิดใช้การยืนยันตัวตนของ Gateway ในเครื่อง

  </Accordion>

  <Accordion title='Control UI บอกว่า "unauthorized" (หรือเชื่อมต่อใหม่ซ้ำ ๆ) ต้องทำอย่างไร?'>
    เส้นทางการยืนยันตัวตนของ Gateway และวิธีการยืนยันตัวตนของ UI ไม่ตรงกัน

    ข้อเท็จจริง (จากโค้ด):

    - Control UI เก็บโทเค็นไว้ใน `sessionStorage` สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL ของ Gateway ที่เลือก ดังนั้นการรีเฟรชในแท็บเดิมจะยังทำงานต่อได้โดยไม่ต้องกู้คืนการคงอยู่ของโทเค็นใน localStorage ระยะยาว
    - เมื่อเกิด `AUTH_TOKEN_MISMATCH` ไคลเอนต์ที่เชื่อถือได้สามารถลองใหม่แบบจำกัดหนึ่งครั้งด้วยโทเค็นอุปกรณ์ที่แคชไว้ เมื่อ Gateway ส่งคำแนะนำให้ลองใหม่กลับมา (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)
    - การลองใหม่ด้วยโทเค็นที่แคชไว้นั้นตอนนี้นำขอบเขตที่อนุมัติแล้วซึ่งแคชไว้กับโทเค็นอุปกรณ์กลับมาใช้ ผู้เรียกที่ระบุ `deviceToken` / `scopes` แบบชัดเจนยังคงใช้ชุดขอบเขตที่ร้องขอเองแทนการสืบทอดขอบเขตที่แคชไว้
    - นอกเส้นทางลองใหม่นั้น ลำดับความสำคัญของการยืนยันตัวตนเมื่อเชื่อมต่อคือโทเค็น/รหัสผ่านแบบความลับร่วมที่ระบุชัดเจนก่อน จากนั้น `deviceToken` ที่ระบุชัดเจน จากนั้นโทเค็นอุปกรณ์ที่จัดเก็บไว้ จากนั้นโทเค็น bootstrap
    - การตรวจสอบขอบเขตของโทเค็น bootstrap ใช้คำนำหน้าบทบาท รายการอนุญาตโอเปอเรเตอร์ bootstrap ในตัวตอบสนองเฉพาะคำขอของโอเปอเรเตอร์เท่านั้น บทบาท Node หรือบทบาทอื่นที่ไม่ใช่โอเปอเรเตอร์ยังต้องมีขอบเขตภายใต้คำนำหน้าบทบาทของตนเอง

    วิธีแก้:

    - เร็วที่สุด: `openclaw dashboard` (พิมพ์ + คัดลอก URL แดชบอร์ด พยายามเปิด และแสดงคำแนะนำ SSH หากเป็นเครื่องไม่มีหน้าจอ)
    - หากคุณยังไม่มีโทเค็น: `openclaw doctor --generate-gateway-token`
    - หากเป็นระยะไกล ให้ทำทันเนลก่อน: `ssh -N -L 18789:127.0.0.1:18789 user@host` จากนั้นเปิด `http://127.0.0.1:18789/`
    - โหมดความลับร่วม: ตั้งค่า `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` จากนั้นวางความลับที่ตรงกันในการตั้งค่า Control UI
    - โหมด Tailscale Serve: ตรวจให้แน่ใจว่าเปิดใช้ `gateway.auth.allowTailscale` และคุณกำลังเปิด URL ของ Serve ไม่ใช่ URL loopback/tailnet ดิบที่ข้ามส่วนหัวระบุตัวตนของ Tailscale
    - โหมดพร็อกซีที่เชื่อถือได้: ตรวจให้แน่ใจว่าคุณเข้ามาผ่านพร็อกซีที่รู้จักตัวตนตามที่กำหนดค่าไว้ ไม่ใช่ URL Gateway ดิบ พร็อกซี loopback บนโฮสต์เดียวกันยังต้องใช้ `gateway.auth.trustedProxy.allowLoopback = true`
    - หากยังไม่ตรงกันหลังการลองใหม่หนึ่งครั้ง ให้หมุนเวียน/อนุมัติโทเค็นอุปกรณ์ที่จับคู่อีกครั้ง:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - หากคำสั่งหมุนเวียนนั้นบอกว่าถูกปฏิเสธ ให้ตรวจสอบสองอย่าง:
      - เซสชันอุปกรณ์ที่จับคู่สามารถหมุนเวียนได้เฉพาะอุปกรณ์ **ของตนเอง** เท่านั้น เว้นแต่ว่าจะมี `operator.admin` ด้วย
      - ค่า `--scope` ที่ระบุชัดเจนต้องไม่เกินขอบเขตโอเปอเรเตอร์ปัจจุบันของผู้เรียก
    - ยังติดอยู่หรือไม่? เรียกใช้ `openclaw status --all` และทำตาม [การแก้ไขปัญหา](/th/gateway/troubleshooting) ดู [แดชบอร์ด](/th/web/dashboard) สำหรับรายละเอียดการยืนยันตัวตน

  </Accordion>

  <Accordion title="ฉันตั้งค่า gateway.bind เป็น tailnet แต่ผูกไม่ได้และไม่มีอะไรฟังอยู่">
    การผูก `tailnet` เลือก IP ของ Tailscale จากอินเทอร์เฟซเครือข่ายของคุณ (100.64.0.0/10) หากเครื่องไม่ได้อยู่บน Tailscale (หรืออินเทอร์เฟซปิดอยู่) ก็จะไม่มีอะไรให้ผูก

    วิธีแก้:

    - เริ่ม Tailscale บนโฮสต์นั้น (เพื่อให้มีที่อยู่ 100.x), หรือ
    - เปลี่ยนเป็น `gateway.bind: "loopback"` / `"lan"`

    หมายเหตุ: `tailnet` เป็นการระบุชัดเจน `auto` จะเลือก loopback ก่อน ใช้ `gateway.bind: "tailnet"` เมื่อคุณต้องการการผูกเฉพาะ tailnet เท่านั้น

  </Accordion>

  <Accordion title="ฉันสามารถเรียกใช้ Gateway หลายตัวบนโฮสต์เดียวกันได้ไหม?">
    โดยทั่วไปไม่จำเป็น - Gateway หนึ่งตัวสามารถเรียกใช้ช่องทางรับส่งข้อความและเอเจนต์หลายรายการได้ ใช้ Gateway หลายตัวเฉพาะเมื่อคุณต้องการความซ้ำซ้อน (เช่น บอทกู้คืน) หรือการแยกอย่างเข้มงวด

    ได้ แต่คุณต้องแยกสิ่งต่อไปนี้:

    - `OPENCLAW_CONFIG_PATH` (คอนฟิกต่ออินสแตนซ์)
    - `OPENCLAW_STATE_DIR` (สถานะต่ออินสแตนซ์)
    - `agents.defaults.workspace` (การแยกเวิร์กสเปซ)
    - `gateway.port` (พอร์ตที่ไม่ซ้ำกัน)

    การตั้งค่าแบบเร็ว (แนะนำ):

    - ใช้ `openclaw --profile <name> ...` ต่ออินสแตนซ์ (สร้าง `~/.openclaw-<name>` อัตโนมัติ)
    - ตั้งค่า `gateway.port` ที่ไม่ซ้ำกันในคอนฟิกของแต่ละโปรไฟล์ (หรือส่ง `--port` สำหรับการเรียกใช้แบบแมนนวล)
    - ติดตั้งบริการต่อโปรไฟล์: `openclaw --profile <name> gateway install`

    โปรไฟล์ยังเพิ่มส่วนต่อท้ายให้ชื่อบริการด้วย (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`)
    คู่มือฉบับเต็ม: [Gateway หลายตัว](/th/gateway/multiple-gateways)

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008 หมายความว่าอะไร?'>
    Gateway เป็น **เซิร์ฟเวอร์ WebSocket** และคาดหวังให้ข้อความแรกสุด
    เป็นเฟรม `connect` หากได้รับสิ่งอื่นใด จะปิดการเชื่อมต่อ
    ด้วย **code 1008** (การละเมิดนโยบาย)

    สาเหตุที่พบบ่อย:

    - คุณเปิด URL **HTTP** ในเบราว์เซอร์ (`http://...`) แทนไคลเอนต์ WS
    - คุณใช้พอร์ตหรือพาธผิด
    - พร็อกซีหรือทันเนลตัดส่วนหัวการยืนยันตัวตนออกหรือส่งคำขอที่ไม่ใช่ Gateway

    วิธีแก้ด่วน:

    1. ใช้ URL WS: `ws://<host>:18789` (หรือ `wss://...` หากเป็น HTTPS)
    2. อย่าเปิดพอร์ต WS ในแท็บเบราว์เซอร์ปกติ
    3. หากเปิดการยืนยันตัวตน ให้ใส่โทเค็น/รหัสผ่านในเฟรม `connect`

    หากคุณใช้ CLI หรือ TUI, URL ควรมีลักษณะดังนี้:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    รายละเอียดโปรโตคอล: [โปรโตคอล Gateway](/th/gateway/protocol)

  </Accordion>
</AccordionGroup>

## การบันทึกล็อกและการดีบัก

<AccordionGroup>
  <Accordion title="ล็อกอยู่ที่ไหน?">
    ล็อกไฟล์ (มีโครงสร้าง):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    คุณสามารถตั้งค่าพาธที่คงที่ผ่าน `logging.file` ระดับล็อกไฟล์ถูกควบคุมโดย `logging.level` ความละเอียดของคอนโซลถูกควบคุมโดย `--verbose` และ `logging.consoleLevel`

    วิธี tail ล็อกที่เร็วที่สุด:

    ```bash
    openclaw logs --follow
    ```

    ล็อกของบริการ/ซูเปอร์ไวเซอร์ (เมื่อ Gateway ทำงานผ่าน launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` และ `gateway.err.log` (ค่าเริ่มต้น: `~/.openclaw/logs/...`; โปรไฟล์ใช้ `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    ดูเพิ่มเติมที่ [การแก้ไขปัญหา](/th/gateway/troubleshooting)

  </Accordion>

  <Accordion title="ฉันจะเริ่ม/หยุด/รีสตาร์ทบริการ Gateway ได้อย่างไร?">
    ใช้ตัวช่วย Gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณเรียกใช้ Gateway แบบแมนนวล `openclaw gateway --force` สามารถยึดพอร์ตกลับคืนได้ ดู [Gateway](/th/gateway)

  </Accordion>

  <Accordion title="ฉันปิดเทอร์มินัลบน Windows ไปแล้ว - จะรีสตาร์ท OpenClaw ได้อย่างไร?">
    มี **สองโหมดการติดตั้ง Windows**:

    **1) WSL2 (แนะนำ):** Gateway ทำงานอยู่ภายใน Linux

    เปิด PowerShell, เข้า WSL, จากนั้นรีสตาร์ท:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณไม่เคยติดตั้งบริการ ให้เริ่มในโฟร์กราวด์:

    ```bash
    openclaw gateway run
    ```

    **2) Windows แบบเนทีฟ (ไม่แนะนำ):** Gateway ทำงานโดยตรงใน Windows

    เปิด PowerShell และเรียกใช้:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณเรียกใช้แบบแมนนวล (ไม่มีบริการ) ให้ใช้:

    ```powershell
    openclaw gateway run
    ```

    เอกสาร: [Windows (WSL2)](/th/platforms/windows), [คู่มือปฏิบัติการบริการ Gateway](/th/gateway)

  </Accordion>

  <Accordion title="Gateway ทำงานอยู่แล้วแต่คำตอบไม่มาถึง ควรตรวจสอบอะไร?">
    เริ่มด้วยการกวาดตรวจสุขภาพอย่างรวดเร็ว:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    สาเหตุที่พบบ่อย:

    - ไม่ได้โหลดการรับรองความถูกต้องของโมเดลบน **โฮสต์ Gateway** (ตรวจสอบ `models status`)
    - การจับคู่ช่องทาง/allowlist บล็อกการตอบกลับ (ตรวจสอบการกำหนดค่าช่องทาง + บันทึก)
    - WebChat/Dashboard เปิดอยู่โดยไม่มีโทเค็นที่ถูกต้อง

    หากคุณเชื่อมต่อจากระยะไกล ให้ยืนยันว่าการเชื่อมต่อ tunnel/Tailscale ทำงานอยู่ และ
    Gateway WebSocket เข้าถึงได้

    เอกสาร: [Channels](/th/channels), [Troubleshooting](/th/gateway/troubleshooting), [Remote access](/th/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - ต้องทำอย่างไรต่อ?'>
    โดยปกติหมายความว่า UI สูญเสียการเชื่อมต่อ WebSocket ตรวจสอบ:

    1. Gateway ทำงานอยู่หรือไม่? `openclaw gateway status`
    2. Gateway มีสถานะปกติหรือไม่? `openclaw status`
    3. UI มีโทเค็นที่ถูกต้องหรือไม่? `openclaw dashboard`
    4. หากเชื่อมต่อจากระยะไกล ลิงก์ tunnel/Tailscale ทำงานอยู่หรือไม่?

    จากนั้น tail บันทึก:

    ```bash
    openclaw logs --follow
    ```

    เอกสาร: [Dashboard](/th/web/dashboard), [Remote access](/th/gateway/remote), [Troubleshooting](/th/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands ล้มเหลว ควรตรวจสอบอะไร?">
    เริ่มจากบันทึกและสถานะช่องทาง:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    จากนั้นจับคู่ข้อผิดพลาด:

    - `BOT_COMMANDS_TOO_MUCH`: เมนู Telegram มีรายการมากเกินไป OpenClaw ตัดให้เหลือตามขีดจำกัดของ Telegram และลองใหม่ด้วยคำสั่งที่น้อยลงแล้ว แต่ยังต้องตัดรายการเมนูบางรายการออก ลดคำสั่ง plugin/skill/custom หรือปิดใช้ `channels.telegram.commands.native` หากคุณไม่ต้องการเมนู
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` หรือข้อผิดพลาดเครือข่ายที่คล้ายกัน: หากคุณอยู่บน VPS หรืออยู่หลังพร็อกซี ให้ยืนยันว่าอนุญาต HTTPS ขาออกและ DNS ใช้งานได้สำหรับ `api.telegram.org`

    หาก Gateway อยู่ระยะไกล ตรวจสอบให้แน่ใจว่าคุณกำลังดูบันทึกบนโฮสต์ Gateway

    เอกสาร: [Telegram](/th/channels/telegram), [Channel troubleshooting](/th/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI ไม่แสดงเอาต์พุต ควรตรวจสอบอะไร?">
    ก่อนอื่นยืนยันว่า Gateway เข้าถึงได้และเอเจนต์สามารถทำงานได้:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    ใน TUI ใช้ `/status` เพื่อดูสถานะปัจจุบัน หากคุณคาดว่าจะได้รับการตอบกลับใน
    ช่องทางแชต ให้ตรวจสอบว่าเปิดใช้การส่งข้อความแล้ว (`/deliver on`)

    เอกสาร: [TUI](/th/web/tui), [Slash commands](/th/tools/slash-commands).

  </Accordion>

  <Accordion title="ฉันจะหยุดแล้วเริ่ม Gateway ใหม่ทั้งหมดได้อย่างไร?">
    หากคุณติดตั้งบริการไว้:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    คำสั่งนี้หยุด/เริ่ม **บริการที่มีการกำกับดูแล** (launchd บน macOS, systemd บน Linux)
    ใช้เมื่อ Gateway ทำงานอยู่เบื้องหลังแบบ daemon

    หากคุณกำลังรันแบบ foreground ให้หยุดด้วย Ctrl-C แล้วรัน:

    ```bash
    openclaw gateway run
    ```

    เอกสาร: [Gateway service runbook](/th/gateway).

  </Accordion>

  <Accordion title="อธิบายแบบง่าย: openclaw gateway restart เทียบกับ openclaw gateway">
    - `openclaw gateway restart`: รีสตาร์ท **บริการเบื้องหลัง** (launchd/systemd)
    - `openclaw gateway`: รัน gateway **ใน foreground** สำหรับเซสชันเทอร์มินัลนี้

    หากคุณติดตั้งบริการไว้ ให้ใช้คำสั่ง gateway ใช้ `openclaw gateway` เมื่อ
    คุณต้องการรันแบบครั้งเดียวใน foreground

  </Accordion>

  <Accordion title="วิธีที่เร็วที่สุดในการดูรายละเอียดเพิ่มเมื่อมีบางอย่างล้มเหลว">
    เริ่ม Gateway ด้วย `--verbose` เพื่อดูรายละเอียดในคอนโซลมากขึ้น จากนั้นตรวจสอบไฟล์บันทึกสำหรับการรับรองความถูกต้องของช่องทาง การกำหนดเส้นทางโมเดล และข้อผิดพลาด RPC
  </Accordion>
</AccordionGroup>

## สื่อและไฟล์แนบ

<AccordionGroup>
  <Accordion title="skill ของฉันสร้างรูปภาพ/PDF แล้ว แต่ไม่มีอะไรถูกส่ง">
    ไฟล์แนบขาออกจากเอเจนต์ต้องมีบรรทัด `MEDIA:<path-or-url>` (อยู่ในบรรทัดของตัวเอง) ดู [OpenClaw assistant setup](/th/start/openclaw) และ [Agent send](/th/tools/agent-send)

    การส่งผ่าน CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    ตรวจสอบเพิ่มเติม:

    - ช่องทางเป้าหมายรองรับสื่อขาออกและไม่ถูกบล็อกโดย allowlist
    - ไฟล์อยู่ภายในขีดจำกัดขนาดของผู้ให้บริการ (รูปภาพจะถูกปรับขนาดให้สูงสุด 2048px)
    - `tools.fs.workspaceOnly=true` จำกัดการส่งพาธในเครื่องให้อยู่ใน workspace, temp/media-store และไฟล์ที่ผ่านการตรวจสอบโดย sandbox
    - `tools.fs.workspaceOnly=false` อนุญาตให้ `MEDIA:` ส่งไฟล์ในเครื่องของโฮสต์ที่เอเจนต์อ่านได้อยู่แล้ว แต่เฉพาะสื่อและชนิดเอกสารที่ปลอดภัยเท่านั้น (รูปภาพ เสียง วิดีโอ PDF และเอกสาร Office) ไฟล์ข้อความล้วนและไฟล์ที่ดูเหมือนเป็นความลับยังคงถูกบล็อก

    ดู [Images](/th/nodes/images)

  </Accordion>
</AccordionGroup>

## ความปลอดภัยและการควบคุมการเข้าถึง

<AccordionGroup>
  <Accordion title="ปลอดภัยหรือไม่ที่จะเปิด OpenClaw ให้รับ DM ขาเข้า?">
    ปฏิบัติต่อ DM ขาเข้าเป็นอินพุตที่ไม่น่าเชื่อถือ ค่าเริ่มต้นถูกออกแบบมาเพื่อลดความเสี่ยง:

    - พฤติกรรมเริ่มต้นบนช่องทางที่รองรับ DM คือ **การจับคู่**:
      - ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ บอทจะไม่ประมวลผลข้อความของพวกเขา
      - อนุมัติด้วย: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - คำขอที่รอดำเนินการถูกจำกัดไว้ที่ **3 รายการต่อช่องทาง**; ตรวจสอบ `openclaw pairing list --channel <channel> [--account <id>]` หากรหัสไม่มาถึง
    - การเปิด DM ต่อสาธารณะต้องเลือกใช้อย่างชัดเจน (`dmPolicy: "open"` และ allowlist `"*"`)

    รัน `openclaw doctor` เพื่อแสดงนโยบาย DM ที่มีความเสี่ยง

  </Accordion>

  <Accordion title="prompt injection เป็นข้อกังวลเฉพาะบอทสาธารณะเท่านั้นหรือไม่?">
    ไม่ใช่ prompt injection เกี่ยวกับ **เนื้อหาที่ไม่น่าเชื่อถือ** ไม่ใช่แค่ว่าใครสามารถ DM บอทได้
    หากผู้ช่วยของคุณอ่านเนื้อหาภายนอก (การค้นหา/ดึงข้อมูลเว็บ หน้าเบราว์เซอร์ อีเมล
    เอกสาร ไฟล์แนบ บันทึกที่วางมา) เนื้อหานั้นอาจมีคำสั่งที่พยายาม
    ยึดการควบคุมโมเดล สิ่งนี้เกิดขึ้นได้แม้ว่า **คุณจะเป็นผู้ส่งเพียงคนเดียว**

    ความเสี่ยงที่ใหญ่ที่สุดคือเมื่อเปิดใช้เครื่องมือ: โมเดลอาจถูกหลอกให้
    ส่งออกบริบทหรือเรียกใช้เครื่องมือแทนคุณ ลดขอบเขตผลกระทบโดย:

    - ใช้เอเจนต์ "reader" แบบอ่านอย่างเดียวหรือปิดเครื่องมือ เพื่อสรุปเนื้อหาที่ไม่น่าเชื่อถือ
    - ปิด `web_search` / `web_fetch` / `browser` สำหรับเอเจนต์ที่เปิดใช้เครื่องมือ
    - ปฏิบัติต่อข้อความจากไฟล์/เอกสารที่ถอดออกมาเป็นสิ่งที่ไม่น่าเชื่อถือเช่นกัน: OpenResponses
      `input_file` และการสกัดจากไฟล์แนบสื่อต่างห่อข้อความที่สกัดได้ไว้ใน
      เครื่องหมายขอบเขตเนื้อหาภายนอกอย่างชัดเจน แทนที่จะส่งข้อความไฟล์ดิบ
    - ใช้ sandbox และ allowlist เครื่องมืออย่างเข้มงวด

    รายละเอียด: [Security](/th/gateway/security).

  </Accordion>

  <Accordion title="บอทของฉันควรมีอีเมล บัญชี GitHub หรือหมายเลขโทรศัพท์ของตัวเองหรือไม่?">
    ควร สำหรับการตั้งค่าส่วนใหญ่ การแยกบอทด้วยบัญชีและหมายเลขโทรศัพท์ต่างหาก
    ช่วยลดขอบเขตผลกระทบหากเกิดปัญหา นอกจากนี้ยังทำให้การหมุนเวียน
    ข้อมูลประจำตัวหรือเพิกถอนการเข้าถึงทำได้ง่ายขึ้นโดยไม่กระทบบัญชีส่วนตัวของคุณ

    เริ่มจากเล็ก ๆ ให้สิทธิ์เข้าถึงเฉพาะเครื่องมือและบัญชีที่คุณต้องใช้จริง และค่อยขยาย
    ในภายหลังหากจำเป็น

    เอกสาร: [Security](/th/gateway/security), [Pairing](/th/channels/pairing).

  </Accordion>

  <Accordion title="ฉันให้มันทำงานอัตโนมัติกับข้อความของฉันได้ไหม และปลอดภัยหรือไม่?">
    เรา **ไม่** แนะนำให้ให้อิสระเต็มรูปแบบกับข้อความส่วนตัวของคุณ รูปแบบที่ปลอดภัยที่สุดคือ:

    - เก็บ DM ไว้ใน **โหมดจับคู่** หรือ allowlist ที่จำกัดมาก
    - ใช้ **หมายเลขหรือบัญชีแยกต่างหาก** หากคุณต้องการให้มันส่งข้อความแทนคุณ
    - ให้มันร่างข้อความ แล้ว **อนุมัติก่อนส่ง**

    หากคุณต้องการทดลอง ให้ทำบนบัญชีเฉพาะและแยกออกจากบัญชีอื่น ดู
    [Security](/th/gateway/security).

  </Accordion>

  <Accordion title="ฉันใช้โมเดลที่ถูกกว่าสำหรับงานผู้ช่วยส่วนตัวได้ไหม?">
    ได้ **หาก** เอเจนต์เป็นแบบแชตเท่านั้นและอินพุตเชื่อถือได้ ระดับที่เล็กกว่า
    อ่อนไหวต่อการถูกยึดคำสั่งมากกว่า ดังนั้นหลีกเลี่ยงสำหรับเอเจนต์ที่เปิดใช้เครื่องมือ
    หรือเมื่ออ่านเนื้อหาที่ไม่น่าเชื่อถือ หากจำเป็นต้องใช้โมเดลที่เล็กกว่า ให้ล็อก
    เครื่องมือและรันใน sandbox ดู [Security](/th/gateway/security)
  </Accordion>

  <Accordion title="ฉันรัน /start ใน Telegram แต่ไม่ได้รับรหัสจับคู่">
    รหัสจับคู่จะถูกส่ง **เฉพาะ** เมื่อผู้ส่งที่ไม่รู้จักส่งข้อความถึงบอทและ
    เปิดใช้ `dmPolicy: "pairing"` เท่านั้น `/start` เพียงอย่างเดียวจะไม่สร้างรหัส

    ตรวจสอบคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list telegram
    ```

    หากคุณต้องการเข้าถึงทันที ให้เพิ่ม sender id ของคุณใน allowlist หรือตั้ง `dmPolicy: "open"`
    สำหรับบัญชีนั้น

  </Accordion>

  <Accordion title="WhatsApp: มันจะส่งข้อความหาผู้ติดต่อของฉันไหม? การจับคู่ทำงานอย่างไร?">
    ไม่ นโยบาย DM เริ่มต้นของ WhatsApp คือ **การจับคู่** ผู้ส่งที่ไม่รู้จักจะได้รับเฉพาะรหัสจับคู่ และข้อความของพวกเขาจะ **ไม่ถูกประมวลผล** OpenClaw จะตอบเฉพาะแชตที่ได้รับหรือการส่งที่คุณสั่งอย่างชัดเจนเท่านั้น

    อนุมัติการจับคู่ด้วย:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    แสดงรายการคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list whatsapp
    ```

    พรอมต์หมายเลขโทรศัพท์ในวิซาร์ด: ใช้เพื่อตั้ง **allowlist/owner** ของคุณ เพื่อให้ DM ของคุณได้รับอนุญาต ไม่ได้ใช้สำหรับการส่งอัตโนมัติ หากคุณรันบนหมายเลข WhatsApp ส่วนตัวของคุณ ให้ใช้หมายเลขนั้นและเปิดใช้ `channels.whatsapp.selfChatMode`

  </Accordion>
</AccordionGroup>

## คำสั่งแชต การยกเลิกงาน และ "มันไม่หยุด"

<AccordionGroup>
  <Accordion title="ฉันจะหยุดไม่ให้ข้อความระบบภายในแสดงในแชตได้อย่างไร?">
    ข้อความภายในหรือข้อความเครื่องมือส่วนใหญ่จะปรากฏเฉพาะเมื่อเปิดใช้ **verbose**, **trace** หรือ **reasoning**
    สำหรับเซสชันนั้น

    แก้ไขในแชตที่คุณเห็น:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    หากยังมีข้อความรบกวน ให้ตรวจสอบการตั้งค่าเซสชันใน Control UI และตั้ง verbose
    เป็น **inherit** และยืนยันว่าคุณไม่ได้ใช้โปรไฟล์บอทที่ตั้ง `verboseDefault`
    เป็น `on` ในการกำหนดค่า

    เอกสาร: [Thinking and verbose](/th/tools/thinking), [Security](/th/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="ฉันจะหยุด/ยกเลิกงานที่กำลังรันได้อย่างไร?">
    ส่งข้อความใดข้อความหนึ่งต่อไปนี้ **เป็นข้อความเดี่ยว** (ไม่มี slash):

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

    สิ่งเหล่านี้เป็นตัวกระตุ้นการยกเลิก (ไม่ใช่คำสั่ง slash)

    สำหรับกระบวนการเบื้องหลัง (จากเครื่องมือ exec) คุณสามารถขอให้เอเจนต์รัน:

    ```
    process action:kill sessionId:XXX
    ```

    ภาพรวมคำสั่ง slash: ดู [Slash commands](/th/tools/slash-commands)

    คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความ **เดี่ยว** ที่ขึ้นต้นด้วย `/` แต่ทางลัดบางรายการ (เช่น `/status`) ใช้งานแบบ inline ได้เช่นกันสำหรับผู้ส่งที่อยู่ใน allowlist

  </Accordion>

  <Accordion title='ฉันจะส่งข้อความ Discord จาก Telegram ได้อย่างไร? ("Cross-context messaging denied")'>
    OpenClaw บล็อกการส่งข้อความ **ข้ามผู้ให้บริการ** โดยค่าเริ่มต้น หากการเรียกเครื่องมือถูกผูกกับ
    Telegram มันจะไม่ส่งไปยัง Discord เว้นแต่คุณจะอนุญาตอย่างชัดเจน

    เปิดใช้การส่งข้อความข้ามผู้ให้บริการสำหรับเอเจนต์:

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

    รีสตาร์ท gateway หลังแก้ไขการกำหนดค่า

  </Accordion>

  <Accordion title='ทำไมรู้สึกเหมือนบอท "เพิกเฉย" ต่อข้อความที่ส่งถี่ ๆ?'>
    โหมดคิวควบคุมว่าข้อความใหม่โต้ตอบกับการรันที่กำลังดำเนินอยู่อย่างไร ใช้ `/queue` เพื่อเปลี่ยนโหมด:

    - `steer` - คิว steering ที่รอดำเนินการทั้งหมดสำหรับขอบเขตโมเดลถัดไปในการรันปัจจุบัน
    - `queue` - steering แบบเดิมทีละรายการ
    - `followup` - รันข้อความทีละรายการ
    - `collect` - รวมข้อความเป็นชุดแล้วตอบครั้งเดียว
    - `steer-backlog` - steer ทันที จากนั้นประมวลผล backlog
    - `interrupt` - ยกเลิกการรันปัจจุบันแล้วเริ่มใหม่

    โหมดเริ่มต้นคือ `steer` คุณสามารถเพิ่มตัวเลือกอย่าง `debounce:0.5s cap:25 drop:summarize` สำหรับโหมด followup ได้ ดู [คิวคำสั่ง](/th/concepts/queue) และ [คิว Steering](/th/concepts/queue-steering)

  </Accordion>
</AccordionGroup>

## เบ็ดเตล็ด

<AccordionGroup>
  <Accordion title='โมเดลเริ่มต้นสำหรับ Anthropic ที่ใช้ API key คืออะไร'>
    ใน OpenClaw ข้อมูลรับรองและการเลือกโมเดลแยกจากกัน การตั้งค่า `ANTHROPIC_API_KEY` (หรือการจัดเก็บ API key ของ Anthropic ในโปรไฟล์การตรวจสอบสิทธิ์) จะเปิดใช้งานการตรวจสอบสิทธิ์ แต่โมเดลเริ่มต้นจริงคือโมเดลใดก็ตามที่คุณกำหนดค่าไว้ใน `agents.defaults.model.primary` (เช่น `anthropic/claude-sonnet-4-6` หรือ `anthropic/claude-opus-4-6`) หากคุณเห็น `No credentials found for profile "anthropic:default"` หมายความว่า Gateway ไม่พบข้อมูลรับรอง Anthropic ใน `auth-profiles.json` ที่คาดไว้สำหรับเอเจนต์ที่กำลังทำงานอยู่
  </Accordion>
</AccordionGroup>

---

ยังติดปัญหาอยู่ใช่ไหม ถามใน [Discord](https://discord.com/invite/clawd) หรือเปิด [การสนทนาใน GitHub](https://github.com/openclaw/openclaw/discussions)

## ที่เกี่ยวข้อง

- [คำถามที่พบบ่อยในการรันครั้งแรก](/th/help/faq-first-run) — การติดตั้ง การเริ่มใช้งาน การตรวจสอบสิทธิ์ การสมัครสมาชิก ความล้มเหลวในช่วงแรก
- [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models) — การเลือกโมเดล การสลับไปใช้ตัวสำรอง โปรไฟล์การตรวจสอบสิทธิ์
- [การแก้ไขปัญหา](/th/help/troubleshooting) — การคัดแยกปัญหาโดยเริ่มจากอาการ
