---
read_when:
    - การตอบคำถามทั่วไปด้านการสนับสนุนเกี่ยวกับการตั้งค่า การติดตั้ง การเริ่มต้นใช้งาน หรือรันไทม์
    - คัดแยกปัญหาที่ผู้ใช้รายงานก่อนการดีบักเชิงลึก
summary: คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า การกำหนดค่า และการใช้งาน OpenClaw
title: คำถามที่พบบ่อย
x-i18n:
    generated_at: "2026-05-12T00:59:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57e42ea34d4f53cb9e6f0e9c175fd553a67e70aaca08a09be28f0bde43414bc8
    source_path: help/faq.md
    workflow: 16
---

คำตอบด่วนพร้อมการแก้ปัญหาเชิงลึกสำหรับการตั้งค่าใช้งานจริง (การพัฒนาในเครื่อง, VPS, หลายเอเจนต์, OAuth/API keys, การสลับโมเดลเมื่อล้มเหลว) สำหรับการวินิจฉัยขณะรันไทม์ ดู [การแก้ปัญหา](/th/gateway/troubleshooting) สำหรับข้อมูลอ้างอิงการตั้งค่าทั้งหมด ดู [การตั้งค่า](/th/gateway/configuration).

## 60 วินาทีแรกเมื่อมีบางอย่างเสีย

1. **สถานะด่วน (ตรวจสอบเป็นอย่างแรก)**

   ```bash
   openclaw status
   ```

   สรุปในเครื่องอย่างรวดเร็ว: OS + การอัปเดต, การเข้าถึง gateway/service, เอเจนต์/เซสชัน, การตั้งค่า provider + ปัญหารันไทม์ (เมื่อเข้าถึง Gateway ได้)

2. **รายงานที่วางได้ทันที (แชร์ได้อย่างปลอดภัย)**

   ```bash
   openclaw status --all
   ```

   การวินิจฉัยแบบอ่านอย่างเดียวพร้อมส่วนท้ายของล็อก (ปกปิดโทเค็นแล้ว)

3. **สถานะ Daemon + พอร์ต**

   ```bash
   openclaw gateway status
   ```

   แสดงรันไทม์ของ supervisor เทียบกับการเข้าถึง RPC, URL เป้าหมายของ probe และไฟล์ตั้งค่าที่ service น่าจะใช้

4. **การตรวจสอบเชิงลึก**

   ```bash
   openclaw status --deep
   ```

   รันการตรวจสุขภาพ Gateway แบบสด รวมถึงการตรวจสอบช่องทางเมื่อรองรับ
   (ต้องมี Gateway ที่เข้าถึงได้) ดู [สุขภาพ](/th/gateway/health)

5. **ติดตามล็อกล่าสุด**

   ```bash
   openclaw logs --follow
   ```

   หาก RPC ล่ม ให้ใช้วิธีสำรอง:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   ไฟล์ล็อกแยกจากล็อกของ service; ดู [การบันทึกล็อก](/th/logging) และ [การแก้ปัญหา](/th/gateway/troubleshooting)

6. **รัน doctor (ซ่อมแซม)**

   ```bash
   openclaw doctor
   ```

   ซ่อมแซม/ย้ายข้อมูลการตั้งค่า/สถานะ + รันการตรวจสุขภาพ ดู [Doctor](/th/gateway/doctor)

7. **สแนปช็อต Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # แสดง URL เป้าหมาย + path การตั้งค่าเมื่อเกิดข้อผิดพลาด
   ```

   ขอให้ Gateway ที่กำลังรันอยู่ส่งสแนปช็อตฉบับเต็ม (เฉพาะ WS) ดู [สุขภาพ](/th/gateway/health)

## การเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก

คำถามและคำตอบสำหรับการรันครั้งแรก — การติดตั้ง, การเริ่มใช้งาน, เส้นทาง auth, การสมัครรับข้อมูล, ความล้มเหลวแรกเริ่ม —
อยู่ใน [FAQ การรันครั้งแรก](/th/help/faq-first-run)

## OpenClaw คืออะไร?

<AccordionGroup>
  <Accordion title="OpenClaw คืออะไรในหนึ่งย่อหน้า?">
    OpenClaw คือผู้ช่วย AI ส่วนตัวที่คุณรันบนอุปกรณ์ของคุณเอง โดยตอบกลับบนพื้นผิวการส่งข้อความที่คุณใช้อยู่แล้ว (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat และ Plugin ช่องทางที่มาพร้อมกัน เช่น QQ Bot) และยังทำเสียง + Canvas แบบสดบนแพลตฟอร์มที่รองรับได้ด้วย **Gateway** คือ control plane ที่เปิดทำงานตลอดเวลา; ผู้ช่วยคือผลิตภัณฑ์
  </Accordion>

  <Accordion title="คุณค่าที่เสนอ">
    OpenClaw ไม่ใช่ "แค่ wrapper ของ Claude" แต่เป็น **control plane แบบ local-first** ที่ช่วยให้คุณรัน
    ผู้ช่วยที่มีความสามารถบน **ฮาร์ดแวร์ของคุณเอง** เข้าถึงได้จากแอปแชตที่คุณใช้อยู่แล้ว พร้อม
    เซสชันที่มีสถานะ, memory และเครื่องมือ - โดยไม่ต้องมอบการควบคุมเวิร์กโฟลว์ของคุณให้กับ
    SaaS ที่โฮสต์ไว้

    จุดเด่น:

    - **อุปกรณ์ของคุณ ข้อมูลของคุณ:** รัน Gateway ที่ไหนก็ได้ตามต้องการ (Mac, Linux, VPS) และเก็บ
      workspace + ประวัติเซสชันไว้ในเครื่อง
    - **ช่องทางจริง ไม่ใช่ sandbox บนเว็บ:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/ฯลฯ
      รวมถึงเสียงบนมือถือและ Canvas บนแพลตฟอร์มที่รองรับ
    - **ไม่ผูกกับโมเดลใดโมเดลหนึ่ง:** ใช้ Anthropic, OpenAI, MiniMax, OpenRouter ฯลฯ พร้อมการกำหนดเส้นทาง
      และ failover ต่อเอเจนต์
    - **ตัวเลือกเฉพาะในเครื่อง:** รันโมเดลในเครื่องเพื่อให้ **ข้อมูลทั้งหมดอยู่บนอุปกรณ์ของคุณได้** หากต้องการ
    - **การกำหนดเส้นทางหลายเอเจนต์:** แยกเอเจนต์ตามช่องทาง, บัญชี หรืองาน โดยแต่ละตัวมี
      workspace และค่าเริ่มต้นของตัวเอง
    - **โอเพนซอร์สและปรับแต่งได้:** ตรวจสอบ, ขยาย และโฮสต์เองโดยไม่ติด vendor lock-in

    เอกสาร: [Gateway](/th/gateway), [ช่องทาง](/th/channels), [หลายเอเจนต์](/th/concepts/multi-agent),
    [Memory](/th/concepts/memory).

  </Accordion>

  <Accordion title="ฉันเพิ่งตั้งค่าเสร็จ - ควรทำอะไรก่อน?">
    โปรเจกต์แรกที่เหมาะ:

    - สร้างเว็บไซต์ (WordPress, Shopify หรือเว็บ static แบบง่าย)
    - ทำต้นแบบแอปมือถือ (โครงร่าง, หน้าจอ, แผน API)
    - จัดระเบียบไฟล์และโฟลเดอร์ (ล้างข้อมูล, ตั้งชื่อ, ติดแท็ก)
    - เชื่อมต่อ Gmail และทำสรุปหรือการติดตามผลอัตโนมัติ

    มันรับมืองานใหญ่ได้ แต่จะทำงานได้ดีที่สุดเมื่อคุณแบ่งงานเป็นเฟสและ
    ใช้เอเจนต์ย่อยสำหรับงานแบบขนาน

  </Accordion>

  <Accordion title="กรณีใช้งานประจำวันห้าอันดับแรกของ OpenClaw คืออะไร?">
    ประโยชน์ประจำวันมักมีลักษณะดังนี้:

    - **บรีฟส่วนตัว:** สรุป inbox, ปฏิทิน และข่าวที่คุณสนใจ
    - **การค้นคว้าและร่างเอกสาร:** ค้นคว้าเร็ว, สรุป และร่างฉบับแรกสำหรับอีเมลหรือเอกสาร
    - **ตัวเตือนและการติดตามผล:** การสะกิดและเช็กลิสต์ที่ขับเคลื่อนด้วย Cron หรือ Heartbeat
    - **ระบบอัตโนมัติบนเบราว์เซอร์:** กรอกฟอร์ม, เก็บข้อมูล และทำงานเว็บซ้ำ ๆ
    - **การประสานงานข้ามอุปกรณ์:** ส่งงานจากโทรศัพท์ ให้ Gateway รันบนเซิร์ฟเวอร์ แล้วรับผลลัพธ์กลับมาในแชต

  </Accordion>

  <Accordion title="OpenClaw ช่วยเรื่อง lead gen, outreach, ads และ blogs สำหรับ SaaS ได้ไหม?">
    ได้สำหรับ **การค้นคว้า, การคัดกรอง และการร่าง** มันสามารถสแกนเว็บไซต์, สร้าง shortlist,
    สรุป prospects และเขียนร่าง outreach หรือข้อความโฆษณาได้

    สำหรับ **การ outreach หรือการรันโฆษณา** ให้มีมนุษย์อยู่ในกระบวนการเสมอ หลีกเลี่ยงสแปม, ปฏิบัติตามกฎหมายท้องถิ่นและ
    นโยบายของแพลตฟอร์ม และตรวจทานทุกอย่างก่อนส่ง รูปแบบที่ปลอดภัยที่สุดคือให้
    OpenClaw ร่าง แล้วคุณอนุมัติ

    เอกสาร: [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="ข้อได้เปรียบเมื่อเทียบกับ Claude Code สำหรับการพัฒนาเว็บคืออะไร?">
    OpenClaw เป็น **ผู้ช่วยส่วนตัว** และชั้นประสานงาน ไม่ใช่สิ่งทดแทน IDE ใช้
    Claude Code หรือ Codex สำหรับลูปการเขียนโค้ดโดยตรงที่เร็วที่สุดภายใน repo ใช้ OpenClaw เมื่อคุณ
    ต้องการ memory ที่คงทน, การเข้าถึงข้ามอุปกรณ์ และการประสานเครื่องมือ

    ข้อได้เปรียบ:

    - **memory + workspace แบบคงอยู่** ข้ามเซสชัน
    - **การเข้าถึงหลายแพลตฟอร์ม** (WhatsApp, Telegram, TUI, WebChat)
    - **การประสานเครื่องมือ** (เบราว์เซอร์, ไฟล์, การตั้งเวลา, hooks)
    - **Gateway ที่เปิดตลอดเวลา** (รันบน VPS, โต้ตอบได้จากทุกที่)
    - **Nodes** สำหรับเบราว์เซอร์/หน้าจอ/กล้อง/exec ในเครื่อง

    ตัวอย่างผลงาน: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills และระบบอัตโนมัติ

<AccordionGroup>
  <Accordion title="ฉันจะปรับแต่ง Skills โดยไม่ทำให้ repo สกปรกได้อย่างไร?">
    ใช้ managed overrides แทนการแก้ไขสำเนาใน repo ใส่การเปลี่ยนแปลงของคุณไว้ใน `~/.openclaw/skills/<name>/SKILL.md` (หรือเพิ่มโฟลเดอร์ผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json`) ลำดับความสำคัญคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` ดังนั้น managed overrides ยังชนะ skills ที่มาพร้อมกันโดยไม่แตะ git หากคุณต้องติดตั้ง skill แบบ global แต่ให้มองเห็นได้เฉพาะบางเอเจนต์ ให้เก็บสำเนาที่ใช้ร่วมกันไว้ใน `~/.openclaw/skills` และควบคุมการมองเห็นด้วย `agents.defaults.skills` และ `agents.list[].skills` เฉพาะการแก้ไขที่สมควรส่ง upstream เท่านั้นที่ควรอยู่ใน repo และส่งออกเป็น PR
  </Accordion>

  <Accordion title="ฉันโหลด Skills จากโฟลเดอร์กำหนดเองได้ไหม?">
    ได้ เพิ่มไดเรกทอรีเพิ่มเติมผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json` (ลำดับความสำคัญต่ำสุด) ลำดับความสำคัญเริ่มต้นคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` `clawhub` ติดตั้งลงใน `./skills` โดยค่าเริ่มต้น ซึ่ง OpenClaw จะถือว่าเป็น `<workspace>/skills` ในเซสชันถัดไป หาก skill ควรมองเห็นได้เฉพาะบางเอเจนต์ ให้ใช้ร่วมกับ `agents.defaults.skills` หรือ `agents.list[].skills`
  </Accordion>

  <Accordion title="ฉันใช้โมเดลต่างกันสำหรับงานต่างกันได้อย่างไร?">
    รูปแบบที่รองรับในปัจจุบันคือ:

    - **งาน Cron**: งานที่แยกกันสามารถตั้งค่า override `model` ต่อหนึ่งงานได้
    - **เอเจนต์ย่อย**: กำหนดเส้นทางงานไปยังเอเจนต์แยกที่มีโมเดลเริ่มต้นต่างกัน
    - **สลับเมื่อต้องการ**: ใช้ `/model` เพื่อสลับโมเดลของเซสชันปัจจุบันได้ทุกเวลา

    ดู [งาน Cron](/th/automation/cron-jobs), [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent) และ [คำสั่ง Slash](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="บอตค้างระหว่างทำงานหนัก ฉันจะ offload งานนั้นได้อย่างไร?">
    ใช้ **เอเจนต์ย่อย** สำหรับงานที่ยาวหรืองานแบบขนาน เอเจนต์ย่อยรันในเซสชันของตัวเอง,
    ส่งสรุปกลับมา และทำให้แชตหลักของคุณยังตอบสนองได้

    ขอให้บอตของคุณ "spawn a sub-agent for this task" หรือใช้ `/subagents`
    ใช้ `/status` ในแชตเพื่อดูว่า Gateway กำลังทำอะไรอยู่ตอนนี้ (และกำลังยุ่งอยู่หรือไม่)

    เคล็ดลับเรื่องโทเค็น: งานยาวและเอเจนต์ย่อยต่างก็ใช้โทเค็น หากกังวลเรื่องค่าใช้จ่าย ให้ตั้งค่า
    โมเดลที่ถูกกว่าสำหรับเอเจนต์ย่อยผ่าน `agents.defaults.subagents.model`

    เอกสาร: [เอเจนต์ย่อย](/th/tools/subagents), [งานเบื้องหลัง](/th/automation/tasks)

  </Accordion>

  <Accordion title="เซสชัน subagent ที่ผูกกับเธรดทำงานอย่างไรบน Discord?">
    ใช้การผูกเธรด คุณสามารถผูกเธรด Discord กับ subagent หรือเป้าหมายเซสชัน เพื่อให้ข้อความติดตามผลในเธรดนั้นอยู่ในเซสชันที่ผูกไว้

    ลำดับพื้นฐาน:

    - สร้างด้วย `sessions_spawn` โดยใช้ `thread: true` (และเลือกใช้ `mode: "session"` สำหรับการติดตามผลแบบคงอยู่)
    - หรือผูกเองด้วย `/focus <target>`
    - ใช้ `/agents` เพื่อตรวจสอบสถานะการผูก
    - ใช้ `/session idle <duration|off>` และ `/session max-age <duration|off>` เพื่อควบคุม auto-unfocus
    - ใช้ `/unfocus` เพื่อแยกเธรดออก

    การตั้งค่าที่จำเป็น:

    - ค่าเริ่มต้น global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
    - Overrides ของ Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`
    - ผูกอัตโนมัติเมื่อ spawn: `channels.discord.threadBindings.spawnSessions` ค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เพื่อปิดการ spawn เซสชันที่ผูกกับเธรด

    เอกสาร: [เอเจนต์ย่อย](/th/tools/subagents), [Discord](/th/channels/discord), [ข้อมูลอ้างอิงการตั้งค่า](/th/gateway/configuration-reference), [คำสั่ง Slash](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="subagent เสร็จแล้ว แต่การอัปเดตเมื่อเสร็จสิ้นไปผิดที่หรือไม่เคยโพสต์ ฉันควรตรวจอะไร?">
    ตรวจเส้นทาง requester ที่ resolve แล้วก่อน:

    - การส่งมอบ subagent แบบ completion-mode จะให้ความสำคัญกับเธรดที่ผูกไว้หรือเส้นทาง conversation เมื่อมีอยู่
    - หาก origin ของ completion มีเพียงช่องทาง OpenClaw จะ fallback ไปยังเส้นทางที่เก็บไว้ของเซสชัน requester (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้การส่งโดยตรงยังสำเร็จได้
    - หากไม่มีทั้งเส้นทางที่ผูกไว้และเส้นทางที่เก็บไว้ซึ่งใช้งานได้ การส่งโดยตรงอาจล้มเหลว และผลลัพธ์จะ fallback ไปยังการส่งมอบเซสชันที่เข้าคิวแทนที่จะโพสต์ลงแชตทันที
    - เป้าหมายที่ไม่ถูกต้องหรือ stale ยังสามารถบังคับให้ fallback ไปคิวหรือทำให้การส่งมอบสุดท้ายล้มเหลวได้
    - หากคำตอบผู้ช่วยล่าสุดที่มองเห็นได้ของ child เป็นโทเค็นเงียบตรงตัว `NO_REPLY` / `no_reply` หรือเท่ากับ `ANNOUNCE_SKIP` ทุกประการ OpenClaw จะตั้งใจไม่ประกาศ แทนการโพสต์ความคืบหน้าเก่าที่ stale
    - หาก child หมดเวลาหลังจากมีเฉพาะ tool calls การประกาศอาจยุบสิ่งนั้นเป็นสรุปความคืบหน้าบางส่วนสั้น ๆ แทนการเล่นซ้ำเอาต์พุตเครื่องมือดิบ

    ดีบัก:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [เอเจนต์ย่อย](/th/tools/subagents), [งานเบื้องหลัง](/th/automation/tasks), [เครื่องมือเซสชัน](/th/concepts/session-tool)

  </Accordion>

  <Accordion title="Cron หรือ reminders ไม่ทำงาน ฉันควรตรวจอะไร?">
    Cron รันภายในโปรเซส Gateway หาก Gateway ไม่ได้รันต่อเนื่อง
    งานที่ตั้งเวลาไว้จะไม่รัน

    เช็กลิสต์:

    - ยืนยันว่า cron เปิดใช้งานอยู่ (`cron.enabled`) และไม่ได้ตั้งค่า `OPENCLAW_SKIP_CRON`
    - ตรวจว่า Gateway รัน 24/7 (ไม่มี sleep/รีสตาร์ต)
    - ตรวจสอบการตั้งค่าเขตเวลาของงาน (`--tz` เทียบกับเขตเวลาของ host)

    ดีบัก:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [ระบบอัตโนมัติ](/th/automation)

  </Accordion>

  <Accordion title="Cron ทำงานแล้ว แต่ไม่มีอะไรถูกส่งไปยังช่อง ทำไม?">
    ตรวจสอบโหมดการส่งก่อน:

    - `--no-deliver` / `delivery.mode: "none"` หมายความว่าไม่คาดหวังให้มีการส่งสำรองจากตัวรัน
    - เป้าหมายประกาศหายไปหรือไม่ถูกต้อง (`channel` / `to`) หมายความว่าตัวรันข้ามการส่งออกไปภายนอก
    - ความล้มเหลวในการยืนยันตัวตนของช่อง (`unauthorized`, `Forbidden`) หมายความว่าตัวรันพยายามส่งแล้ว แต่ข้อมูลรับรองขัดขวางไว้
    - ผลลัพธ์แบบแยกที่เงียบ (`NO_REPLY` / `no_reply` เท่านั้น) จะถือว่าจงใจไม่ให้ส่งได้ ดังนั้นตัวรันจึงระงับการส่งสำรองที่เข้าคิวไว้ด้วย

    สำหรับงาน cron แบบแยก agent ยังสามารถส่งโดยตรงด้วยเครื่องมือ `message`
    ได้เมื่อมีเส้นทางแชทให้ใช้ `--announce` ควบคุมเฉพาะเส้นทางสำรองของตัวรัน
    สำหรับข้อความสุดท้ายที่ agent ยังไม่ได้ส่งเองเท่านั้น

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [งานเบื้องหลัง](/th/automation/tasks).

  </Accordion>

  <Accordion title="ทำไมการรัน cron แบบแยกจึงสลับโมเดลหรือลองซ้ำหนึ่งครั้ง?">
    โดยปกตินั่นคือเส้นทางสลับโมเดลแบบสด ไม่ใช่การจัดตารางซ้ำ

    cron แบบแยกสามารถคงการส่งต่อโมเดลรันไทม์และลองซ้ำได้เมื่อการรันที่ใช้งานอยู่
    โยน `LiveSessionModelSwitchError` การลองซ้ำจะคง provider/model ที่สลับไปใช้ไว้
    และถ้าการสลับพา auth profile override ใหม่มาด้วย cron
    จะคงค่านั้นไว้ก่อนลองซ้ำด้วย

    กฎการเลือกที่เกี่ยวข้อง:

    - การ override โมเดลของ Gmail hook ชนะก่อนเมื่อใช้ได้
    - จากนั้นคือ `model` ต่อแต่ละงาน
    - จากนั้นคือ override โมเดลของ cron-session ที่จัดเก็บไว้
    - จากนั้นคือการเลือกโมเดล agent/ค่าเริ่มต้นตามปกติ

    ลูปการลองซ้ำมีขอบเขต หลังจากความพยายามครั้งแรกบวกกับการลองซ้ำจากการสลับ 2 ครั้ง
    cron จะยกเลิกแทนที่จะวนซ้ำตลอดไป

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [CLI ของ cron](/th/cli/cron).

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง Skills บน Linux ได้อย่างไร?">
    ใช้คำสั่ง `openclaw skills` แบบเนทีฟหรือวาง Skills ลงใน workspace ของคุณ UI ของ Skills บน macOS ไม่มีให้ใช้บน Linux
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
    ของ workspace ที่ใช้งานอยู่ ติดตั้ง CLI `clawhub` แยกต่างหากเฉพาะเมื่อคุณต้องการเผยแพร่หรือ
    ซิงค์ Skills ของคุณเอง สำหรับการติดตั้งที่ใช้ร่วมกันข้าม agents ให้วาง skill ไว้ใต้
    `~/.openclaw/skills` และใช้ `agents.defaults.skills` หรือ
    `agents.list[].skills` หากคุณต้องการจำกัดว่า agents ใดมองเห็นได้

  </Accordion>

  <Accordion title="OpenClaw สามารถรันงานตามกำหนดเวลาหรือรันต่อเนื่องในเบื้องหลังได้ไหม?">
    ได้ ใช้ตัวจัดตารางของ Gateway:

    - **งาน Cron** สำหรับงานที่ตั้งเวลาไว้หรืองานที่เกิดซ้ำ (คงอยู่ข้ามการรีสตาร์ท)
    - **Heartbeat** สำหรับการตรวจสอบเป็นระยะของ "เซสชันหลัก"
    - **งานแบบแยก** สำหรับ agents อัตโนมัติที่โพสต์สรุปหรือส่งไปยังแชท

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [ระบบอัตโนมัติ](/th/automation),
    [Heartbeat](/th/gateway/heartbeat).

  </Accordion>

  <Accordion title="ฉันสามารถรัน Skills ที่ใช้ได้เฉพาะ Apple macOS จาก Linux ได้ไหม?">
    ไม่ได้โดยตรง Skills ของ macOS ถูกจำกัดด้วย `metadata.openclaw.os` รวมถึงไบนารีที่ต้องใช้ และ Skills จะปรากฏใน system prompt เฉพาะเมื่อมีสิทธิ์บน **โฮสต์ Gateway** เท่านั้น บน Linux Skills ที่ใช้ได้เฉพาะ `darwin` (เช่น `apple-notes`, `apple-reminders`, `things-mac`) จะไม่โหลดเว้นแต่คุณจะ override การจำกัดนั้น

    คุณมีรูปแบบที่รองรับสามแบบ:

    **ตัวเลือก A - รัน Gateway บน Mac (ง่ายที่สุด)**
    รัน Gateway ในที่ที่มีไบนารีของ macOS อยู่ จากนั้นเชื่อมต่อจาก Linux ใน[โหมดระยะไกล](#gateway-ports-already-running-and-remote-mode) หรือผ่าน Tailscale Skills จะโหลดตามปกติเพราะโฮสต์ Gateway เป็น macOS

    **ตัวเลือก B - ใช้โหนด macOS (ไม่ใช้ SSH)**
    รัน Gateway บน Linux, จับคู่โหนด macOS (แอปแถบเมนู) และตั้ง **คำสั่งรัน Node** เป็น "ถามเสมอ" หรือ "อนุญาตเสมอ" บน Mac OpenClaw สามารถถือว่า Skills ที่ใช้ได้เฉพาะ macOS มีสิทธิ์เมื่อไบนารีที่ต้องใช้มีอยู่บนโหนด agent จะรัน Skills เหล่านั้นผ่านเครื่องมือ `nodes` หากคุณเลือก "ถามเสมอ" การอนุมัติ "อนุญาตเสมอ" ในพรอมป์จะเพิ่มคำสั่งนั้นลงใน allowlist

    **ตัวเลือก C - พร็อกซีไบนารีของ macOS ผ่าน SSH (ขั้นสูง)**
    ให้ Gateway อยู่บน Linux ต่อไป แต่ทำให้ไบนารี CLI ที่ต้องใช้ resolve ไปยัง SSH wrappers ที่รันบน Mac จากนั้น override skill เพื่ออนุญาต Linux เพื่อให้ยังมีสิทธิ์อยู่

    1. สร้าง SSH wrapper สำหรับไบนารี (ตัวอย่าง: `memo` สำหรับ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. วาง wrapper ไว้บน `PATH` บนโฮสต์ Linux (เช่น `~/bin/memo`)
    3. Override metadata ของ skill (workspace หรือ `~/.openclaw/skills`) เพื่ออนุญาต Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. เริ่มเซสชันใหม่เพื่อให้สแนปช็อตของ Skills รีเฟรช

  </Accordion>

  <Accordion title="มีการผสานรวมกับ Notion หรือ HeyGen ไหม?">
    วันนี้ยังไม่มีในตัว

    ตัวเลือก:

    - **Custom skill / Plugin:** ดีที่สุดสำหรับการเข้าถึง API ที่เชื่อถือได้ (Notion/HeyGen ต่างก็มี API)
    - **ระบบอัตโนมัติบนเบราว์เซอร์:** ใช้ได้โดยไม่ต้องเขียนโค้ด แต่ช้ากว่าและเปราะบางกว่า

    หากคุณต้องการเก็บบริบทแยกตามลูกค้า (workflow ของเอเจนซี) รูปแบบง่าย ๆ คือ:

    - หนึ่งหน้า Notion ต่อหนึ่งลูกค้า (บริบท + ค่ากำหนด + งานที่กำลังดำเนินอยู่)
    - ขอให้ agent ดึงหน้านั้นตอนเริ่มเซสชัน

    หากคุณต้องการการผสานรวมแบบเนทีฟ ให้เปิด feature request หรือสร้าง skill
    ที่ใช้ API เหล่านั้น

    ติดตั้ง Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    การติดตั้งแบบเนทีฟจะลงในไดเรกทอรี `skills/` ของ workspace ที่ใช้งานอยู่ สำหรับ Skills ที่ใช้ร่วมกันข้าม agents ให้วางไว้ใน `~/.openclaw/skills/<name>/SKILL.md` หากควรให้มีเพียงบาง agents เห็นการติดตั้งที่ใช้ร่วมกัน ให้กำหนดค่า `agents.defaults.skills` หรือ `agents.list[].skills` Skills บางรายการคาดหวังไบนารีที่ติดตั้งผ่าน Homebrew; บน Linux นั่นหมายถึง Linuxbrew (ดูรายการคำถามที่พบบ่อยของ Homebrew Linux ด้านบน) ดู [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config), และ [ClawHub](/th/clawhub).

  </Accordion>

  <Accordion title="ฉันจะใช้ Chrome ที่ลงชื่อเข้าใช้อยู่แล้วกับ OpenClaw ได้อย่างไร?">
    ใช้โปรไฟล์เบราว์เซอร์ `user` ที่มีในตัว ซึ่งแนบผ่าน Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    หากคุณต้องการชื่อแบบกำหนดเอง ให้สร้างโปรไฟล์ MCP อย่างชัดเจน:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    เส้นทางนี้สามารถใช้เบราว์เซอร์โฮสต์ภายในเครื่องหรือโหนดเบราว์เซอร์ที่เชื่อมต่ออยู่ได้ หาก Gateway รันอยู่ที่อื่น ให้รันโฮสต์โหนดบนเครื่องเบราว์เซอร์หรือใช้ CDP ระยะไกลแทน

    ขีดจำกัดปัจจุบันของ `existing-session` / `user`:

    - actions ขับเคลื่อนด้วย ref ไม่ใช่ขับเคลื่อนด้วย CSS-selector
    - uploads ต้องใช้ `ref` / `inputRef` และปัจจุบันรองรับทีละหนึ่งไฟล์
    - `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และ actions แบบกลุ่มยังต้องใช้เบราว์เซอร์ที่จัดการอยู่หรือโปรไฟล์ CDP ดิบ

  </Accordion>
</AccordionGroup>

## Sandboxing และหน่วยความจำ

<AccordionGroup>
  <Accordion title="มีเอกสารเฉพาะสำหรับ sandboxing ไหม?">
    มี ดู [Sandboxing](/th/gateway/sandboxing) สำหรับการตั้งค่าเฉพาะ Docker (Gateway แบบเต็มใน Docker หรืออิมเมจ sandbox) ดู [Docker](/th/install/docker)
  </Accordion>

  <Accordion title="Docker ดูเหมือนมีข้อจำกัด - ฉันจะเปิดใช้ฟีเจอร์เต็มรูปแบบได้อย่างไร?">
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยก่อนและรันเป็นผู้ใช้ `node` ดังนั้นจึงไม่
    รวมแพ็กเกจระบบ, Homebrew หรือเบราว์เซอร์ที่ bundle มาให้ สำหรับการตั้งค่าที่ครบถ้วนขึ้น:

    - คง `/home/node` ไว้ด้วย `OPENCLAW_HOME_VOLUME` เพื่อให้แคชอยู่รอด
    - ใส่ system deps ลงในอิมเมจด้วย `OPENCLAW_DOCKER_APT_PACKAGES`
    - ติดตั้งเบราว์เซอร์ Playwright ผ่าน CLI ที่ bundle มา:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` และตรวจสอบให้แน่ใจว่า path นั้นถูกคงไว้

    เอกสาร: [Docker](/th/install/docker), [เบราว์เซอร์](/th/tools/browser).

  </Accordion>

  <Accordion title="ฉันสามารถทำให้ DM เป็นส่วนตัวแต่ทำให้กลุ่มเป็นสาธารณะ/อยู่ใน sandbox ด้วย agent เดียวได้ไหม?">
    ได้ - หากทราฟฟิกส่วนตัวของคุณคือ **DMs** และทราฟฟิกสาธารณะของคุณคือ **groups**

    ใช้ `agents.defaults.sandbox.mode: "non-main"` เพื่อให้เซสชันกลุ่ม/ช่อง (คีย์ที่ไม่ใช่ main) รันใน backend sandbox ที่กำหนดค่าไว้ ขณะที่เซสชัน DM หลักยังอยู่บนโฮสต์ Docker เป็น backend เริ่มต้นหากคุณไม่ได้เลือกอย่างอื่น จากนั้นจำกัดเครื่องมือที่มีให้ใช้ในเซสชันที่อยู่ใน sandbox ผ่าน `tools.sandbox.tools`

    คำแนะนำการตั้งค่า + ตัวอย่าง config: [กลุ่ม: DM ส่วนตัว + กลุ่มสาธารณะ](/th/channels/groups#pattern-personal-dms-public-groups-single-agent)

    อ้างอิง config หลัก: [การกำหนดค่า Gateway](/th/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ฉันจะ bind โฟลเดอร์ของโฮสต์เข้าไปใน sandbox ได้อย่างไร?">
    ตั้งค่า `agents.defaults.sandbox.docker.binds` เป็น `["host:path:mode"]` (เช่น `"/home/user/src:/src:ro"`) bind ระดับ global + ต่อ agent จะถูกรวมกัน; bind ต่อ agent จะถูกละเว้นเมื่อ `scope: "shared"` ใช้ `:ro` สำหรับสิ่งที่ละเอียดอ่อน และจำไว้ว่า bind จะข้ามกำแพงระบบไฟล์ของ sandbox

    OpenClaw ตรวจสอบความถูกต้องของแหล่งที่มาของ bind เทียบกับทั้ง path ที่ normalize แล้วและ path แบบ canonical ที่ resolve ผ่าน ancestor ที่มีอยู่ลึกที่สุด นั่นหมายความว่าการหลุดออกผ่าน symlink-parent ยัง fail closed แม้ว่า path segment สุดท้ายยังไม่มีอยู่ และการตรวจสอบ allowed-root ยังคงมีผลหลังจาก symlink resolution

    ดู [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts) และ [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) สำหรับตัวอย่างและหมายเหตุด้านความปลอดภัย

  </Accordion>

  <Accordion title="หน่วยความจำทำงานอย่างไร?">
    หน่วยความจำของ OpenClaw เป็นเพียงไฟล์ Markdown ใน workspace ของ agent:

    - บันทึกรายวันใน `memory/YYYY-MM-DD.md`
    - บันทึกระยะยาวที่คัดสรรแล้วใน `MEMORY.md` (เฉพาะเซสชันหลัก/ส่วนตัว)

    OpenClaw ยังรัน **การ flush หน่วยความจำก่อน Compaction แบบเงียบ** เพื่อเตือนโมเดล
    ให้เขียนบันทึกที่คงทนก่อน auto-compaction สิ่งนี้จะรันเฉพาะเมื่อ workspace
    เขียนได้ (sandbox แบบอ่านอย่างเดียวจะข้าม) ดู [หน่วยความจำ](/th/concepts/memory)

  </Accordion>

  <Accordion title="หน่วยความจำลืมสิ่งต่าง ๆ อยู่เรื่อย ๆ ฉันจะทำให้มันจำได้อย่างไร?">
    ขอให้บอท **เขียนข้อเท็จจริงลงในหน่วยความจำ** บันทึกระยะยาวควรอยู่ใน `MEMORY.md`,
    บริบทระยะสั้นอยู่ใน `memory/YYYY-MM-DD.md`

    นี่ยังเป็นส่วนที่เรากำลังปรับปรุงอยู่ การเตือนโมเดลให้จัดเก็บความทรงจำช่วยได้;
    โมเดลจะรู้ว่าต้องทำอะไร หากยังลืมอยู่ ให้ตรวจสอบว่า Gateway ใช้
    workspace เดียวกันในทุกการรัน

    เอกสาร: [หน่วยความจำ](/th/concepts/memory), [workspace ของ agent](/th/concepts/agent-workspace).

  </Accordion>

  <Accordion title="หน่วยความจำคงอยู่ตลอดไปไหม? มีขีดจำกัดอะไรบ้าง?">
    ไฟล์หน่วยความจำอยู่บนดิสก์และคงอยู่จนกว่าคุณจะลบ ขีดจำกัดคือ
    พื้นที่จัดเก็บของคุณ ไม่ใช่โมเดล **บริบทเซสชัน** ยังคงถูกจำกัดด้วย
    context window ของโมเดล ดังนั้นบทสนทนายาว ๆ จึงอาจ compact หรือ truncate ได้ นั่นคือเหตุผลที่
    มีการค้นหาหน่วยความจำ - มันดึงเฉพาะส่วนที่เกี่ยวข้องกลับเข้าสู่บริบท

    เอกสาร: [หน่วยความจำ](/th/concepts/memory), [บริบท](/th/concepts/context).

  </Accordion>

  <Accordion title="การค้นหาหน่วยความจำเชิงความหมายต้องใช้คีย์ OpenAI API หรือไม่">
    ต้องใช้เฉพาะเมื่อคุณใช้ **OpenAI embeddings** เท่านั้น Codex OAuth ครอบคลุมแชต/การเติมเต็มและ
    **ไม่** ให้สิทธิ์เข้าถึง embeddings ดังนั้น **การลงชื่อเข้าใช้ด้วย Codex (OAuth หรือการ
    ล็อกอิน Codex CLI)** จึงไม่ช่วยสำหรับการค้นหาหน่วยความจำเชิงความหมาย OpenAI embeddings
    ยังคงต้องใช้คีย์ API จริง (`OPENAI_API_KEY` หรือ `models.providers.openai.apiKey`)

    หากคุณไม่ได้ตั้งค่าผู้ให้บริการอย่างชัดเจน OpenClaw จะเลือกผู้ให้บริการอัตโนมัติเมื่อ
    สามารถแก้หาคีย์ API ได้ (โปรไฟล์ auth, `models.providers.*.apiKey` หรือ env vars)
    โดยจะเลือก OpenAI ก่อนหากแก้หาคีย์ OpenAI ได้ ไม่เช่นนั้นจะเลือก Gemini หากแก้หา
    คีย์ Gemini ได้ จากนั้น Voyage แล้วจึง Mistral หากไม่มีคีย์ระยะไกลให้ใช้ การค้นหา
    หน่วยความจำจะยังคงปิดใช้งานจนกว่าคุณจะกำหนดค่า หากคุณมีพาธโมเดลภายในเครื่อง
    ที่กำหนดค่าไว้และมีอยู่ OpenClaw
    จะเลือก `local` ก่อน รองรับ Ollama เมื่อคุณตั้งค่าอย่างชัดเจนว่า
    `memorySearch.provider = "ollama"`

    หากคุณต้องการให้อยู่ภายในเครื่อง ให้ตั้งค่า `memorySearch.provider = "local"` (และอาจตั้งค่า
    `memorySearch.fallback = "none"` ด้วย) หากคุณต้องการ Gemini embeddings ให้ตั้งค่า
    `memorySearch.provider = "gemini"` และระบุ `GEMINI_API_KEY` (หรือ
    `memorySearch.remote.apiKey`) เรารองรับโมเดล embedding แบบ **OpenAI, Gemini, Voyage, Mistral, Ollama หรือ local**
    ดูรายละเอียดการตั้งค่าได้ที่ [Memory](/th/concepts/memory)

  </Accordion>
</AccordionGroup>

## สิ่งต่างๆ อยู่ที่ไหนบนดิสก์

<AccordionGroup>
  <Accordion title="ข้อมูลทั้งหมดที่ใช้กับ OpenClaw ถูกบันทึกไว้ภายในเครื่องหรือไม่">
    ไม่ใช่ - **สถานะของ OpenClaw อยู่ภายในเครื่อง** แต่ **บริการภายนอกยังคงเห็นสิ่งที่คุณส่งให้บริการเหล่านั้น**

    - **ภายในเครื่องตามค่าเริ่มต้น:** เซสชัน ไฟล์หน่วยความจำ config และเวิร์กสเปซอยู่บนโฮสต์ Gateway
      (`~/.openclaw` + ไดเรกทอรีเวิร์กสเปซของคุณ)
    - **ระยะไกลตามความจำเป็น:** ข้อความที่คุณส่งไปยังผู้ให้บริการโมเดล (Anthropic/OpenAI/ฯลฯ) จะไปยัง
      API ของผู้ให้บริการเหล่านั้น และแพลตฟอร์มแชต (WhatsApp/Telegram/Slack/ฯลฯ) จะเก็บข้อมูลข้อความไว้บน
      เซิร์ฟเวอร์ของตน
    - **คุณควบคุมขอบเขตข้อมูลได้:** การใช้โมเดลภายในเครื่องจะเก็บพรอมป์ไว้บนเครื่องของคุณ แต่ทราฟฟิกของช่องทาง
      ยังคงผ่านเซิร์ฟเวอร์ของช่องทางนั้น

    ที่เกี่ยวข้อง: [เวิร์กสเปซของเอเจนต์](/th/concepts/agent-workspace), [Memory](/th/concepts/memory)

  </Accordion>

  <Accordion title="OpenClaw เก็บข้อมูลไว้ที่ไหน">
    ทุกอย่างอยู่ภายใต้ `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`):

    | พาธ                                                            | วัตถุประสงค์                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Config หลัก (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | การนำเข้า OAuth แบบเดิม (คัดลอกเข้าโปรไฟล์ auth เมื่อใช้ครั้งแรก)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | โปรไฟล์ auth (OAuth, คีย์ API และ `keyRef`/`tokenRef` ที่เลือกใช้ได้)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | เพย์โหลดความลับแบบมีไฟล์หนุนที่เลือกใช้ได้สำหรับผู้ให้บริการ SecretRef แบบ `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ไฟล์ความเข้ากันได้แบบเดิม (ลบรายการ `api_key` แบบคงที่แล้ว)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | สถานะผู้ให้บริการ (เช่น `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | สถานะต่อเอเจนต์ (agentDir + เซสชัน)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | ประวัติและสถานะการสนทนา (ต่อเอเจนต์)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | เมทาดาทาเซสชัน (ต่อเอเจนต์)                                       |

    พาธเอเจนต์เดียวแบบเดิม: `~/.openclaw/agent/*` (ย้ายโดย `openclaw doctor`)

    **เวิร์กสเปซ** ของคุณ (AGENTS.md, ไฟล์หน่วยความจำ, Skills ฯลฯ) แยกต่างหากและกำหนดค่าผ่าน `agents.defaults.workspace` (ค่าเริ่มต้น: `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md ควรอยู่ที่ไหน">
    ไฟล์เหล่านี้อยู่ใน **เวิร์กสเปซของเอเจนต์** ไม่ใช่ `~/.openclaw`

    - **เวิร์กสเปซ (ต่อเอเจนต์)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` ที่เลือกใช้ได้
      ราก `memory.md` ตัวพิมพ์เล็กเป็นอินพุตสำหรับการซ่อมแซมแบบเดิมเท่านั้น; `openclaw doctor --fix`
      สามารถรวมเข้าใน `MEMORY.md` ได้เมื่อมีทั้งสองไฟล์
    - **ไดเรกทอรีสถานะ (`~/.openclaw`)**: config, สถานะช่องทาง/ผู้ให้บริการ, โปรไฟล์ auth, เซสชัน, ล็อก,
      และ Skills ที่ใช้ร่วมกัน (`~/.openclaw/skills`)

    เวิร์กสเปซเริ่มต้นคือ `~/.openclaw/workspace` กำหนดค่าได้ผ่าน:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    หากบอท "ลืม" หลังรีสตาร์ต ให้ยืนยันว่า Gateway ใช้
    เวิร์กสเปซเดียวกันทุกครั้งที่เริ่มทำงาน (และจำไว้ว่า: โหมดระยะไกลใช้เวิร์กสเปซของ
    **โฮสต์ gateway** ไม่ใช่แล็ปท็อปภายในเครื่องของคุณ)

    เคล็ดลับ: หากคุณต้องการพฤติกรรมหรือค่ากำหนดที่คงอยู่ ให้ขอให้บอท **เขียนลงใน
    AGENTS.md หรือ MEMORY.md** แทนการพึ่งพาประวัติแชต

    ดู [เวิร์กสเปซของเอเจนต์](/th/concepts/agent-workspace) และ [Memory](/th/concepts/memory)

  </Accordion>

  <Accordion title="กลยุทธ์การสำรองข้อมูลที่แนะนำ">
    ใส่ **เวิร์กสเปซของเอเจนต์** ไว้ใน repo git **ส่วนตัว** และสำรองข้อมูลไว้ที่ใดที่หนึ่ง
    แบบส่วนตัว (เช่น GitHub private) วิธีนี้จะเก็บหน่วยความจำ + ไฟล์ AGENTS/SOUL/USER
    และให้คุณกู้คืน "จิตใจ" ของผู้ช่วยได้ในภายหลัง

    **อย่า** commit สิ่งใดภายใต้ `~/.openclaw` (credentials, เซสชัน, โทเค็น หรือเพย์โหลดความลับที่เข้ารหัส)
    หากคุณต้องการกู้คืนเต็มรูปแบบ ให้สำรองทั้งเวิร์กสเปซและไดเรกทอรีสถานะ
    แยกกัน (ดูคำถามเรื่องการย้ายด้านบน)

    เอกสาร: [เวิร์กสเปซของเอเจนต์](/th/concepts/agent-workspace)

  </Accordion>

  <Accordion title="ฉันจะถอนการติดตั้ง OpenClaw อย่างสมบูรณ์ได้อย่างไร">
    ดูคู่มือเฉพาะ: [ถอนการติดตั้ง](/th/install/uninstall)
  </Accordion>

  <Accordion title="เอเจนต์ทำงานนอกเวิร์กสเปซได้หรือไม่">
    ได้ เวิร์กสเปซคือ **cwd เริ่มต้น** และจุดยึดหน่วยความจำ ไม่ใช่ sandbox แบบตายตัว
    พาธสัมพัทธ์จะถูกแก้ภายในเวิร์กสเปซ แต่พาธสัมบูรณ์สามารถเข้าถึงตำแหน่งอื่นบน
    โฮสต์ได้ เว้นแต่จะเปิดใช้ sandboxing หากคุณต้องการการแยกส่วน ให้ใช้
    [`agents.defaults.sandbox`](/th/gateway/sandboxing) หรือการตั้งค่า sandbox ต่อเอเจนต์ หากคุณ
    ต้องการให้ repo เป็นไดเรกทอรีทำงานเริ่มต้น ให้ชี้ `workspace` ของเอเจนต์นั้นไปยัง
    รากของ repo repo OpenClaw เป็นเพียงซอร์สโค้ด; ให้แยก
    เวิร์กสเปซไว้ต่างหาก เว้นแต่คุณตั้งใจให้เอเจนต์ทำงานภายในนั้น

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

  <Accordion title="โหมดระยะไกล: ที่เก็บเซสชันอยู่ที่ไหน">
    สถานะเซสชันเป็นของ **โฮสต์ gateway** หากคุณอยู่ในโหมดระยะไกล ที่เก็บเซสชันที่คุณต้องสนใจอยู่บนเครื่องระยะไกล ไม่ใช่แล็ปท็อปภายในเครื่องของคุณ ดู [การจัดการเซสชัน](/th/concepts/session)
  </Accordion>
</AccordionGroup>

## พื้นฐาน config

<AccordionGroup>
  <Accordion title="Config อยู่ในรูปแบบใด อยู่ที่ไหน">
    OpenClaw อ่าน config **JSON5** ที่เลือกใช้ได้จาก `$OPENCLAW_CONFIG_PATH` (ค่าเริ่มต้น: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    หากไฟล์ขาดหายไป จะใช้ค่าเริ่มต้นที่ค่อนข้างปลอดภัย (รวมถึงเวิร์กสเปซเริ่มต้น `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title='ฉันตั้งค่า gateway.bind: "lan" (หรือ "tailnet") แล้วตอนนี้ไม่มีอะไร listen / UI บอกว่าไม่ได้รับอนุญาต'>
    การ bind แบบไม่ใช่ loopback **ต้องมีพาธ auth ของ gateway ที่ถูกต้อง** ในทางปฏิบัติหมายถึง:

    - auth แบบ shared-secret: token หรือ password
    - `gateway.auth.mode: "trusted-proxy"` อยู่หลัง reverse proxy ที่รับรู้อัตลักษณ์และกำหนดค่าอย่างถูกต้อง

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

    - `gateway.remote.token` / `.password` **ไม่** เปิดใช้ auth ของ gateway ภายในเครื่องด้วยตัวเอง
    - พาธการเรียกภายในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
    - สำหรับ auth แบบ password ให้ตั้งค่า `gateway.auth.mode: "password"` พร้อม `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`) แทน
    - หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าอย่างชัดเจนผ่าน SecretRef และแก้หาไม่ได้ การแก้หาจะล้มเหลวแบบปิด (ไม่มี remote fallback มาปิดบัง)
    - การตั้งค่า Control UI แบบ shared-secret ยืนยันตัวตนผ่าน `connect.params.auth.token` หรือ `connect.params.auth.password` (จัดเก็บในค่าตั้งแอป/UI) โหมดที่มีอัตลักษณ์ เช่น Tailscale Serve หรือ `trusted-proxy` ใช้ส่วนหัวคำขอแทน หลีกเลี่ยงการใส่ shared secrets ใน URL
    - ด้วย `gateway.auth.mode: "trusted-proxy"` reverse proxy แบบ loopback บนโฮสต์เดียวกันต้องใช้ `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน และต้องมีรายการ loopback ใน `gateway.trustedProxies`

  </Accordion>

  <Accordion title="ทำไมตอนนี้ฉันต้องใช้ token บน localhost">
    OpenClaw บังคับใช้ auth ของ gateway ตามค่าเริ่มต้น รวมถึง loopback ในพาธเริ่มต้นปกติ นั่นหมายถึง auth แบบ token: หากไม่ได้กำหนดพาธ auth อย่างชัดเจน การเริ่มต้น gateway จะแก้ไปเป็นโหมด token และสร้าง token สำหรับ runtime เท่านั้นสำหรับการเริ่มต้นครั้งนั้น ดังนั้น **ไคลเอนต์ WS ภายในเครื่องต้องยืนยันตัวตน** กำหนดค่า `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` หรือ `OPENCLAW_GATEWAY_PASSWORD` อย่างชัดเจนเมื่อไคลเอนต์ต้องการ secret ที่เสถียรข้ามการรีสตาร์ต วิธีนี้จะบล็อกกระบวนการภายในเครื่องอื่นไม่ให้เรียก Gateway

    หากคุณต้องการพาธ auth แบบอื่น คุณสามารถเลือกโหมด password อย่างชัดเจนได้ (หรือสำหรับ reverse proxy ที่รับรู้อัตลักษณ์ ให้ใช้ `trusted-proxy`) หากคุณ **ต้องการจริงๆ** ให้ loopback เปิดอยู่ ให้ตั้งค่า `gateway.auth.mode: "none"` อย่างชัดเจนใน config ของคุณ Doctor สามารถสร้าง token ให้คุณได้ทุกเมื่อ: `openclaw doctor --generate-gateway-token`

  </Accordion>

  <Accordion title="ฉันต้องรีสตาร์ตหลังเปลี่ยน config หรือไม่">
    Gateway เฝ้าดู config และรองรับ hot-reload:

    - `gateway.reload.mode: "hybrid"` (ค่าเริ่มต้น): ใช้การเปลี่ยนแปลงที่ปลอดภัยแบบ hot-apply และรีสตาร์ตสำหรับรายการสำคัญ
    - รองรับ `hot`, `restart`, `off` ด้วย

  </Accordion>

  <Accordion title="ฉันจะปิด tagline ตลกๆ ของ CLI ได้อย่างไร">
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

    - `off`: ซ่อนข้อความ tagline แต่คงบรรทัดชื่อ/เวอร์ชันของแบนเนอร์ไว้
    - `default`: ใช้ `All your chats, one OpenClaw.` ทุกครั้ง
    - `random`: tagline ตลก/ตามฤดูกาลแบบหมุนเวียน (พฤติกรรมเริ่มต้น)
    - หากคุณไม่ต้องการแบนเนอร์เลย ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

  </Accordion>

  <Accordion title="ฉันจะเปิดใช้การค้นหาเว็บ (และการดึงเว็บ) ได้อย่างไร">
    `web_fetch` ทำงานได้โดยไม่ต้องใช้คีย์ API `web_search` ขึ้นอยู่กับ
    ผู้ให้บริการที่คุณเลือก:

    - ผู้ให้บริการที่มี API หนุนหลัง เช่น Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity และ Tavily ต้องใช้การตั้งค่าคีย์ API ตามปกติ
    - Ollama Web Search ไม่ต้องใช้คีย์ แต่ใช้โฮสต์ Ollama ที่คุณกำหนดค่าไว้และต้องใช้ `ollama signin`
    - DuckDuckGo ไม่ต้องใช้คีย์ แต่เป็นการผสานรวมที่ไม่เป็นทางการบนพื้นฐาน HTML
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

    ตอนนี้ config การค้นหาเว็บเฉพาะผู้ให้บริการอยู่ภายใต้ `plugins.entries.<plugin>.config.webSearch.*`
    เส้นทางผู้ให้บริการ `tools.web.search.*` แบบเดิมยังโหลดได้ชั่วคราวเพื่อความเข้ากันได้ แต่ไม่ควรใช้สำหรับ config ใหม่
    config สำรองสำหรับดึงข้อมูลเว็บของ Firecrawl อยู่ภายใต้ `plugins.entries.firecrawl.config.webFetch.*`

    หมายเหตุ:

    - หากคุณใช้ allowlists ให้เพิ่ม `web_search`/`web_fetch`/`x_search` หรือ `group:web`
    - `web_fetch` เปิดใช้งานตามค่าเริ่มต้น (เว้นแต่จะปิดใช้งานอย่างชัดเจน)
    - หากละไว้ไม่ระบุ `tools.web.fetch.provider` OpenClaw จะตรวจหา fetch fallback provider รายแรกที่พร้อมใช้งานโดยอัตโนมัติจากข้อมูลรับรองที่มีอยู่ ปัจจุบันผู้ให้บริการที่รวมมาให้คือ Firecrawl
    - Daemons อ่าน env vars จาก `~/.openclaw/.env` (หรือสภาพแวดล้อมของบริการ)

    เอกสาร: [เครื่องมือเว็บ](/th/tools/web).

  </Accordion>

  <Accordion title="config.apply ล้าง config ของฉัน ฉันจะกู้คืนและหลีกเลี่ยงปัญหานี้ได้อย่างไร">
    `config.apply` จะแทนที่ **config ทั้งหมด** หากคุณส่งออบเจกต์บางส่วน ทุกอย่าง
    ที่เหลือจะถูกลบออก

    OpenClaw ปัจจุบันป้องกันการเขียนทับโดยไม่ตั้งใจหลายกรณี:

    - การเขียน config ที่ OpenClaw เป็นเจ้าของจะตรวจสอบ config ทั้งหมดหลังการเปลี่ยนแปลงก่อนเขียน
    - การเขียนที่ไม่ถูกต้องหรือทำลายข้อมูลซึ่ง OpenClaw เป็นเจ้าของจะถูกปฏิเสธและบันทึกเป็น `openclaw.json.rejected.*`
    - หากการแก้ไขโดยตรงทำให้การเริ่มต้นหรือ hot reload เสียหาย Gateway จะปิดอย่างปลอดภัยหรือข้ามการโหลดใหม่ โดยจะไม่เขียน `openclaw.json` ใหม่
    - `openclaw doctor --fix` เป็นผู้รับผิดชอบการซ่อมแซม และสามารถกู้คืนค่า last-known-good พร้อมบันทึกไฟล์ที่ถูกปฏิเสธเป็น `openclaw.json.clobbered.*`

    กู้คืน:

    - ตรวจสอบ `openclaw logs --follow` เพื่อหา `Invalid config at`, `Config write rejected:` หรือ `config reload skipped (invalid config)`
    - ตรวจดู `openclaw.json.clobbered.*` หรือ `openclaw.json.rejected.*` ล่าสุดที่อยู่ข้าง config ที่ใช้งานอยู่
    - รัน `openclaw config validate` และ `openclaw doctor --fix`
    - คัดลอกกลับเฉพาะคีย์ที่ต้องการด้วย `openclaw config set` หรือ `config.patch`
    - หากคุณไม่มี last-known-good หรือ payload ที่ถูกปฏิเสธ ให้กู้คืนจากข้อมูลสำรอง หรือรัน `openclaw doctor` อีกครั้งแล้วตั้งค่า channels/models ใหม่
    - หากสิ่งนี้เกิดขึ้นโดยไม่คาดคิด ให้แจ้งบั๊กและแนบ config ล่าสุดที่ทราบหรือข้อมูลสำรองใด ๆ
    - เอเจนต์เขียนโค้ดแบบ local มักสามารถสร้าง config ที่ใช้งานได้ใหม่จาก logs หรือประวัติ

    หลีกเลี่ยง:

    - ใช้ `openclaw config set` สำหรับการเปลี่ยนแปลงเล็ก ๆ
    - ใช้ `openclaw configure` สำหรับการแก้ไขแบบโต้ตอบ
    - ใช้ `config.schema.lookup` ก่อนเมื่อคุณไม่แน่ใจเกี่ยวกับ path ที่แน่นอนหรือรูปทรงของ field โดยจะคืนค่า shallow schema node พร้อมสรุป child ทันทีสำหรับเจาะลึกต่อ
    - ใช้ `config.patch` สำหรับการแก้ไข RPC บางส่วน; เก็บ `config.apply` ไว้สำหรับการแทนที่ config ทั้งหมดเท่านั้น
    - หากคุณใช้เครื่องมือ `gateway` เฉพาะเจ้าของจากการรันเอเจนต์ เครื่องมือนี้จะยังคงปฏิเสธการเขียนไปยัง `tools.exec.ask` / `tools.exec.security` (รวมถึง alias เดิม `tools.bash.*` ที่ normalize ไปยัง exec paths ที่ได้รับการป้องกันเดียวกัน)

    เอกสาร: [Config](/th/cli/config), [Configure](/th/cli/configure), [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/th/gateway/doctor).

  </Accordion>

  <Accordion title="ฉันจะรัน Gateway ส่วนกลางพร้อม worker เฉพาะทางข้ามอุปกรณ์ได้อย่างไร">
    รูปแบบทั่วไปคือ **Gateway หนึ่งตัว** (เช่น Raspberry Pi) พร้อม **nodes** และ **agents**:

    - **Gateway (ส่วนกลาง):** เป็นเจ้าของ channels (Signal/WhatsApp), routing และ sessions
    - **Nodes (อุปกรณ์):** Macs/iOS/Android เชื่อมต่อเป็น peripherals และเปิดเผยเครื่องมือ local (`system.run`, `canvas`, `camera`)
    - **Agents (workers):** สมอง/workspaces แยกกันสำหรับบทบาทพิเศษ (เช่น "Hetzner ops", "Personal data")
    - **Sub-agents:** สร้างงานเบื้องหลังจาก agent หลักเมื่อคุณต้องการการทำงานแบบขนาน
    - **TUI:** เชื่อมต่อกับ Gateway และสลับ agents/sessions

    เอกสาร: [Nodes](/th/nodes), [การเข้าถึงระยะไกล](/th/gateway/remote), [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent), [Sub-agents](/th/tools/subagents), [TUI](/th/web/tui).

  </Accordion>

  <Accordion title="เบราว์เซอร์ OpenClaw รันแบบ headless ได้หรือไม่">
    ได้ นี่เป็นตัวเลือก config:

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

    ค่าเริ่มต้นคือ `false` (headful) Headless มีโอกาสกระตุ้นการตรวจสอบ anti-bot ในบางเว็บไซต์มากกว่า ดู [เบราว์เซอร์](/th/tools/browser)

    Headless ใช้ **Chromium engine เดียวกัน** และทำงานได้กับ automation ส่วนใหญ่ (forms, clicks, scraping, logins) ความแตกต่างหลักคือ:

    - ไม่มีหน้าต่างเบราว์เซอร์ที่มองเห็นได้ (ใช้ screenshots หากคุณต้องการภาพ)
    - บางเว็บไซต์เข้มงวดกับ automation ในโหมด headless มากกว่า (CAPTCHAs, anti-bot)
      ตัวอย่างเช่น X/Twitter มักบล็อก sessions แบบ headless

  </Accordion>

  <Accordion title="ฉันจะใช้ Brave สำหรับควบคุมเบราว์เซอร์ได้อย่างไร">
    ตั้งค่า `browser.executablePath` เป็น binary ของ Brave ของคุณ (หรือเบราว์เซอร์ที่ใช้ Chromium อื่นใด) แล้วรีสตาร์ท Gateway
    ดูตัวอย่าง config แบบเต็มใน [เบราว์เซอร์](/th/tools/browser#use-brave-or-another-chromium-based-browser)
  </Accordion>
</AccordionGroup>

## Gateway และ nodes ระยะไกล

<AccordionGroup>
  <Accordion title="คำสั่งแพร่กระจายระหว่าง Telegram, gateway และ nodes อย่างไร">
    ข้อความ Telegram ถูกจัดการโดย **gateway** gateway จะรัน agent และ
    จากนั้นจึงเรียก nodes ผ่าน **Gateway WebSocket** เฉพาะเมื่อจำเป็นต้องใช้เครื่องมือ node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes จะไม่เห็นทราฟฟิก provider ขาเข้า แต่จะรับเฉพาะการเรียก RPC ของ node เท่านั้น

  </Accordion>

  <Accordion title="agent ของฉันจะเข้าถึงคอมพิวเตอร์ของฉันได้อย่างไรหาก Gateway โฮสต์อยู่ระยะไกล">
    คำตอบสั้น ๆ: **จับคู่คอมพิวเตอร์ของคุณเป็น node** Gateway รันอยู่ที่อื่น แต่สามารถ
    เรียกเครื่องมือ `node.*` (screen, camera, system) บนเครื่อง local ของคุณผ่าน Gateway WebSocket ได้

    การตั้งค่าทั่วไป:

    1. รัน Gateway บนโฮสต์ที่เปิดตลอดเวลา (VPS/home server)
    2. ใส่โฮสต์ Gateway + คอมพิวเตอร์ของคุณไว้ใน tailnet เดียวกัน
    3. ตรวจให้แน่ใจว่า Gateway WS เข้าถึงได้ (tailnet bind หรือ SSH tunnel)
    4. เปิดแอป macOS ในเครื่องและเชื่อมต่อในโหมด **Remote over SSH** (หรือ direct tailnet)
       เพื่อให้ลงทะเบียนเป็น node ได้
    5. อนุมัติ node บน Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ไม่จำเป็นต้องมี TCP bridge แยกต่างหาก; nodes เชื่อมต่อผ่าน Gateway WebSocket

    คำเตือนด้านความปลอดภัย: การจับคู่ macOS node อนุญาตให้ใช้ `system.run` บนเครื่องนั้น จับคู่
    เฉพาะอุปกรณ์ที่คุณไว้วางใจ และอ่าน [ความปลอดภัย](/th/gateway/security)

    เอกสาร: [Nodes](/th/nodes), [โปรโตคอล Gateway](/th/gateway/protocol), [โหมดระยะไกลของ macOS](/th/platforms/mac/remote), [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="Tailscale เชื่อมต่อแล้วแต่ฉันไม่ได้รับการตอบกลับ ควรทำอย่างไรต่อ">
    ตรวจสอบพื้นฐาน:

    - Gateway กำลังรันอยู่: `openclaw gateway status`
    - สถานะสุขภาพของ Gateway: `openclaw status`
    - สถานะสุขภาพของ channel: `openclaw channels status`

    จากนั้นตรวจสอบ auth และ routing:

    - หากคุณใช้ Tailscale Serve ให้ตรวจสอบว่า `gateway.auth.allowTailscale` ตั้งค่าไว้อย่างถูกต้อง
    - หากคุณเชื่อมต่อผ่าน SSH tunnel ให้ยืนยันว่า tunnel local เปิดอยู่และชี้ไปยังพอร์ตที่ถูกต้อง
    - ยืนยันว่า allowlists ของคุณ (DM หรือ group) มีบัญชีของคุณอยู่

    เอกสาร: [Tailscale](/th/gateway/tailscale), [การเข้าถึงระยะไกล](/th/gateway/remote), [Channels](/th/channels).

  </Accordion>

  <Accordion title="OpenClaw สองอินสแตนซ์คุยกันได้หรือไม่ (local + VPS)">
    ได้ ไม่มี bridge แบบ "bot-to-bot" ในตัว แต่คุณสามารถเชื่อมต่อได้ด้วยวิธีที่เชื่อถือได้
    ไม่กี่วิธี:

    **ง่ายที่สุด:** ใช้ช่องแชทปกติที่บอททั้งสองเข้าถึงได้ (Telegram/Slack/WhatsApp)
    ให้ Bot A ส่งข้อความถึง Bot B แล้วให้ Bot B ตอบกลับตามปกติ

    **CLI bridge (ทั่วไป):** รันสคริปต์ที่เรียก Gateway อีกตัวด้วย
    `openclaw agent --message ... --deliver` โดยกำหนดเป้าหมายไปยังแชทที่บอทอีกตัว
    คอยฟังอยู่ หากบอทตัวหนึ่งอยู่บน VPS ระยะไกล ให้ชี้ CLI ของคุณไปยัง Gateway ระยะไกลนั้น
    ผ่าน SSH/Tailscale (ดู [การเข้าถึงระยะไกล](/th/gateway/remote))

    รูปแบบตัวอย่าง (รันจากเครื่องที่เข้าถึง Gateway เป้าหมายได้):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    เคล็ดลับ: เพิ่ม guardrail เพื่อไม่ให้บอททั้งสองวนลูปไม่รู้จบ (mention-only, channel
    allowlists หรือกฎ "do not reply to bot messages")

    เอกสาร: [การเข้าถึงระยะไกล](/th/gateway/remote), [Agent CLI](/th/cli/agent), [การส่ง Agent](/th/tools/agent-send).

  </Accordion>

  <Accordion title="ฉันต้องใช้ VPS แยกกันสำหรับหลาย agents หรือไม่">
    ไม่ Gateway หนึ่งตัวสามารถโฮสต์ agents ได้หลายตัว โดยแต่ละตัวมี workspace, model defaults
    และ routing ของตนเอง นี่คือการตั้งค่าปกติ และถูกกว่าและง่ายกว่าการรัน
    หนึ่ง VPS ต่อ agent มาก

    ใช้ VPS แยกกันเฉพาะเมื่อคุณต้องการ isolation แบบเข้มงวด (ขอบเขตความปลอดภัย) หรือ config
    ที่แตกต่างกันมากซึ่งคุณไม่ต้องการแชร์ มิฉะนั้น ให้ใช้ Gateway หนึ่งตัวและ
    ใช้ agents หรือ sub-agents หลายตัว

  </Accordion>

  <Accordion title="มีประโยชน์หรือไม่หากใช้ node บนแล็ปท็อปส่วนตัวแทน SSH จาก VPS">
    มี - nodes เป็นวิธีชั้นหนึ่งในการเข้าถึงแล็ปท็อปของคุณจาก Gateway ระยะไกล และ
    ปลดล็อกได้มากกว่า shell access Gateway รันบน macOS/Linux (Windows ผ่าน WSL2) และ
    เบา (VPS ขนาดเล็กหรือกล่องระดับ Raspberry Pi ก็เพียงพอ; RAM 4 GB เหลือเฟือ) ดังนั้นการตั้งค่าทั่วไป
    คือโฮสต์ที่เปิดตลอดเวลาพร้อมแล็ปท็อปของคุณเป็น node

    - **ไม่ต้องใช้ SSH ขาเข้า** Nodes เชื่อมต่อออกไปยัง Gateway WebSocket และใช้การจับคู่อุปกรณ์
    - **การควบคุมการดำเนินการที่ปลอดภัยกว่า** `system.run` ถูกควบคุมด้วย allowlists/approvals ของ node บนแล็ปท็อปนั้น
    - **เครื่องมืออุปกรณ์มากขึ้น** Nodes เปิดเผย `canvas`, `camera` และ `screen` เพิ่มเติมจาก `system.run`
    - **การทำงานอัตโนมัติของเบราว์เซอร์ local** เก็บ Gateway ไว้บน VPS แต่รัน Chrome ในเครื่องผ่าน node host บนแล็ปท็อป หรือแนบกับ Chrome local บนโฮสต์ผ่าน Chrome MCP

    SSH ใช้ได้สำหรับการเข้าถึง shell แบบเฉพาะกิจ แต่ nodes ง่ายกว่าสำหรับ workflows ของ agent ที่ทำต่อเนื่องและ
    automation ของอุปกรณ์

    เอกสาร: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes), [เบราว์เซอร์](/th/tools/browser).

  </Accordion>

  <Accordion title="nodes รันบริการ gateway หรือไม่">
    ไม่ ควรรัน **gateway หนึ่งตัว** ต่อโฮสต์เท่านั้น เว้นแต่คุณตั้งใจรันโปรไฟล์ที่แยกจากกัน (ดู [หลาย gateways](/th/gateway/multiple-gateways)) Nodes เป็น peripherals ที่เชื่อมต่อ
    กับ gateway (nodes บน iOS/Android หรือ "node mode" ของ macOS ในแอป menubar) สำหรับโฮสต์ node แบบ headless
    และการควบคุมด้วย CLI ดู [Node host CLI](/th/cli/node)

    ต้องรีสตาร์ทแบบเต็มสำหรับการเปลี่ยนแปลง surface ของ `gateway`, `discovery` และ Plugin ที่โฮสต์อยู่

  </Accordion>

  <Accordion title="มีวิธีใช้ API / RPC เพื่อ apply config หรือไม่">
    มี

    - `config.schema.lookup`: ตรวจสอบ subtree หนึ่งของ config พร้อมโหนด schema ระดับตื้น, UI hint ที่ตรงกัน, และสรุปลูกโดยตรงก่อนเขียน
    - `config.get`: ดึง snapshot + hash ปัจจุบัน
    - `config.patch`: อัปเดตบางส่วนอย่างปลอดภัย (แนะนำสำหรับการแก้ไข RPC ส่วนใหญ่); hot-reload เมื่อทำได้ และรีสตาร์ตเมื่อจำเป็น
    - `config.apply`: ตรวจสอบความถูกต้อง + แทนที่ config ทั้งหมด; hot-reload เมื่อทำได้ และรีสตาร์ตเมื่อจำเป็น
    - เครื่องมือ runtime `gateway` สำหรับเจ้าของเท่านั้นยังคงปฏิเสธการเขียนทับ `tools.exec.ask` / `tools.exec.security`; alias เดิม `tools.bash.*` จะ normalize ไปยัง path exec ที่ได้รับการป้องกันเดียวกัน

  </Accordion>

  <Accordion title="config ขั้นต่ำที่สมเหตุสมผลสำหรับการติดตั้งครั้งแรก">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    การตั้งค่านี้กำหนด workspace ของคุณและจำกัดว่าใครสามารถเรียกใช้ bot ได้

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
       - ในคอนโซลผู้ดูแลระบบของ Tailscale ให้เปิดใช้ MagicDNS เพื่อให้ VPS มีชื่อที่คงที่
    4. **ใช้ชื่อโฮสต์ของ tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    หากคุณต้องการ Control UI โดยไม่ใช้ SSH ให้ใช้ Tailscale Serve บน VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    วิธีนี้ทำให้ gateway bind กับ loopback และเปิด HTTPS ผ่าน Tailscale ดู [Tailscale](/th/gateway/tailscale)

  </Accordion>

  <Accordion title="ฉันจะเชื่อมต่อ node ของ Mac กับ Gateway ระยะไกล (Tailscale Serve) ได้อย่างไร?">
    Serve เปิดเผย **Gateway Control UI + WS** node เชื่อมต่อผ่าน endpoint Gateway WS เดียวกัน

    การตั้งค่าที่แนะนำ:

    1. **ตรวจสอบให้แน่ใจว่า VPS + Mac อยู่ใน tailnet เดียวกัน**
    2. **ใช้แอป macOS ในโหมด Remote** (เป้าหมาย SSH สามารถเป็นชื่อโฮสต์ของ tailnet ได้)
       แอปจะ tunnel พอร์ต Gateway และเชื่อมต่อเป็น node
    3. **อนุมัติ node** บน gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    เอกสาร: [โปรโตคอล Gateway](/th/gateway/protocol), [Discovery](/th/gateway/discovery), [โหมด remote ของ macOS](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันควรติดตั้งบนแล็ปท็อปเครื่องที่สอง หรือแค่เพิ่ม node?">
    หากคุณต้องการเพียง **เครื่องมือ local** (screen/camera/exec) บนแล็ปท็อปเครื่องที่สอง ให้เพิ่มเป็น
    **node** วิธีนี้รักษา Gateway เดียวไว้และหลีกเลี่ยง config ที่ซ้ำกัน เครื่องมือ node แบบ local
    ปัจจุบันรองรับเฉพาะ macOS แต่เราวางแผนจะขยายไปยัง OS อื่นๆ

    ติดตั้ง Gateway ตัวที่สองเฉพาะเมื่อคุณต้องการ **การแยกอย่างเข้มงวด** หรือ bot สองตัวที่แยกจากกันทั้งหมด

    เอกสาร: [Nodes](/th/nodes), [CLI ของ Nodes](/th/cli/nodes), [Gateway หลายตัว](/th/gateway/multiple-gateways)

  </Accordion>
</AccordionGroup>

## Env vars และการโหลด .env

<AccordionGroup>
  <Accordion title="OpenClaw โหลด environment variables อย่างไร?">
    OpenClaw อ่าน env vars จาก parent process (shell, launchd/systemd, CI ฯลฯ) และโหลดเพิ่มเติม:

    - `.env` จาก current working directory
    - fallback `.env` แบบ global จาก `~/.openclaw/.env` (หรือ `$OPENCLAW_STATE_DIR/.env`)

    ไฟล์ `.env` ทั้งสองไฟล์จะไม่ override env vars ที่มีอยู่

    คุณยังสามารถกำหนด inline env vars ใน config ได้ (ใช้เฉพาะเมื่อไม่มีใน process env):

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

  <Accordion title="ฉันเริ่ม Gateway ผ่าน service แล้ว env vars ของฉันหายไป ตอนนี้ควรทำอย่างไร?">
    วิธีแก้ที่พบบ่อยสองวิธี:

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

    วิธีนี้จะรัน login shell ของคุณและนำเข้าเฉพาะคีย์ที่คาดไว้ซึ่งยังขาดอยู่ (ไม่ override) ค่าที่เทียบเท่าใน env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

  </Accordion>

  <Accordion title='ฉันตั้งค่า COPILOT_GITHUB_TOKEN แล้ว แต่ models status แสดง "Shell env: off." เพราะอะไร?'>
    `openclaw models status` รายงานว่าเปิดใช้ **การนำเข้า shell env** หรือไม่ "Shell env: off"
    **ไม่ได้** หมายความว่า env vars ของคุณหายไป - หมายความเพียงว่า OpenClaw จะไม่โหลด
    login shell ของคุณโดยอัตโนมัติ

    หาก Gateway ทำงานเป็น service (launchd/systemd) จะไม่สืบทอด
    environment ของ shell ของคุณ แก้ไขโดยทำอย่างใดอย่างหนึ่ง:

    1. ใส่ token ใน `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. หรือเปิดใช้การนำเข้า shell (`env.shellEnv.enabled: true`)
    3. หรือเพิ่มลงในบล็อก `env` ของ config ของคุณ (ใช้เฉพาะเมื่อยังขาดอยู่)

    จากนั้นรีสตาร์ต gateway และตรวจสอบอีกครั้ง:

    ```bash
    openclaw models status
    ```

    token ของ Copilot อ่านจาก `COPILOT_GITHUB_TOKEN` (รวมถึง `GH_TOKEN` / `GITHUB_TOKEN`)
    ดู [/concepts/model-providers](/th/concepts/model-providers) และ [/environment](/th/help/environment)

  </Accordion>
</AccordionGroup>

## Sessions และหลายแชต

<AccordionGroup>
  <Accordion title="ฉันจะเริ่มบทสนทนาใหม่ได้อย่างไร?">
    ส่ง `/new` หรือ `/reset` เป็นข้อความเดี่ยว ดู [การจัดการ Session](/th/concepts/session)
  </Accordion>

  <Accordion title="Session จะรีเซ็ตอัตโนมัติหรือไม่หากฉันไม่เคยส่ง /new?">
    Session สามารถหมดอายุหลังจาก `session.idleMinutes` ได้ แต่สิ่งนี้ **ปิดใช้งานโดยค่าเริ่มต้น** (ค่าเริ่มต้น **0**)
    ตั้งค่าเป็นค่าบวกเพื่อเปิดใช้การหมดอายุเมื่อไม่มีการใช้งาน เมื่อเปิดใช้แล้ว ข้อความ **ถัดไป**
    หลังจากช่วง idle จะเริ่ม session id ใหม่สำหรับ chat key นั้น
    การดำเนินการนี้ไม่ลบ transcript - เพียงเริ่ม session ใหม่เท่านั้น

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="มีวิธีสร้างทีมของอินสแตนซ์ OpenClaw (CEO หนึ่งคนและเอเจนต์หลายตัว) หรือไม่?">
    มี ผ่าน **การกำหนดเส้นทางแบบหลายเอเจนต์** และ **เอเจนต์ย่อย** คุณสามารถสร้างเอเจนต์ผู้ประสานงานหนึ่งตัว
    และเอเจนต์ผู้ปฏิบัติงานหลายตัวที่มีเวิร์กสเปซและโมเดลของตัวเองได้

    อย่างไรก็ตาม ควรมองว่านี่เป็น **การทดลองสนุกๆ** มากกว่า การใช้โทเคนค่อนข้างมาก และมัก
    มีประสิทธิภาพน้อยกว่าการใช้บอตหนึ่งตัวกับเซสชันแยกกัน โมเดลทั่วไปที่เรา
    คาดไว้คือบอตหนึ่งตัวที่คุณคุยด้วย พร้อมเซสชันต่างๆ สำหรับงานแบบขนาน บอตนั้น
    ยังสามารถสร้างเอเจนต์ย่อยได้เมื่อจำเป็น

    เอกสาร: [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent), [เอเจนต์ย่อย](/th/tools/subagents), [CLI สำหรับเอเจนต์](/th/cli/agents).

  </Accordion>

  <Accordion title="ทำไมบริบทจึงถูกตัดกลางงาน? ฉันจะป้องกันได้อย่างไร?">
    บริบทของเซสชันถูกจำกัดด้วยหน้าต่างของโมเดล แชตที่ยาว เอาต์พุตเครื่องมือขนาดใหญ่ หรือไฟล์จำนวนมาก
    อาจทำให้เกิด Compaction หรือการตัดทอน

    สิ่งที่ช่วยได้:

    - ขอให้บอตสรุปสถานะปัจจุบันและเขียนลงไฟล์
    - ใช้ `/compact` ก่อนงานยาว และใช้ `/new` เมื่อเปลี่ยนหัวข้อ
    - เก็บบริบทสำคัญไว้ในเวิร์กสเปซและขอให้บอตอ่านกลับมา
    - ใช้เอเจนต์ย่อยสำหรับงานที่ยาวหรือทำแบบขนาน เพื่อให้แชตหลักเล็กลง
    - เลือกโมเดลที่มีหน้าต่างบริบทใหญ่ขึ้น หากเกิดปัญหานี้บ่อย

  </Accordion>

  <Accordion title="ฉันจะรีเซ็ต OpenClaw ทั้งหมดแต่ยังคงติดตั้งไว้ได้อย่างไร?">
    ใช้คำสั่งรีเซ็ต:

    ```bash
    openclaw reset
    ```

    รีเซ็ตทั้งหมดแบบไม่โต้ตอบ:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    จากนั้นรันการตั้งค่าอีกครั้ง:

    ```bash
    openclaw onboard --install-daemon
    ```

    หมายเหตุ:

    - การเริ่มใช้งานยังมีตัวเลือก **รีเซ็ต** หากพบ config ที่มีอยู่ ดู [การเริ่มใช้งาน (CLI)](/th/start/wizard)
    - หากคุณใช้โปรไฟล์ (`--profile` / `OPENCLAW_PROFILE`) ให้รีเซ็ตไดเรกทอรีสถานะของแต่ละโปรไฟล์ (ค่าเริ่มต้นคือ `~/.openclaw-<profile>`)
    - รีเซ็ตสำหรับการพัฒนา: `openclaw gateway --dev --reset` (สำหรับการพัฒนาเท่านั้น; ล้าง config สำหรับ dev + ข้อมูลประจำตัว + เซสชัน + เวิร์กสเปซ)

  </Accordion>

  <Accordion title='ฉันพบข้อผิดพลาด "context too large" - ฉันจะรีเซ็ตหรือ compact ได้อย่างไร?'>
    ใช้อย่างใดอย่างหนึ่งต่อไปนี้:

    - **Compact** (คงบทสนทนาไว้แต่สรุปเทิร์นเก่าๆ):

      ```
      /compact
      ```

      หรือ `/compact <instructions>` เพื่อกำหนดแนวทางให้สรุป

    - **รีเซ็ต** (ID เซสชันใหม่สำหรับคีย์แชตเดิม):

      ```
      /new
      /reset
      ```

    หากยังเกิดขึ้นต่อเนื่อง:

    - เปิดใช้หรือปรับแต่ง **การตัดแต่งเซสชัน** (`agents.defaults.contextPruning`) เพื่อตัดเอาต์พุตเครื่องมือเก่า
    - ใช้โมเดลที่มีหน้าต่างบริบทใหญ่ขึ้น

    เอกสาร: [Compaction](/th/concepts/compaction), [การตัดแต่งเซสชัน](/th/concepts/session-pruning), [การจัดการเซสชัน](/th/concepts/session).

  </Accordion>

  <Accordion title='ทำไมฉันจึงเห็น "LLM request rejected: messages.content.tool_use.input field required"?'>
    นี่คือข้อผิดพลาดการตรวจสอบจากผู้ให้บริการ: โมเดลสร้างบล็อก `tool_use` โดยไม่มี
    `input` ที่จำเป็น โดยปกติหมายถึงประวัติเซสชันค้างหรือเสียหาย (มักเกิดหลังเธรดยาว
    หรือหลังการเปลี่ยนแปลงเครื่องมือ/สคีมา)

    วิธีแก้: เริ่มเซสชันใหม่ด้วย `/new` (เป็นข้อความเดี่ยว)

  </Accordion>

  <Accordion title="ทำไมฉันจึงได้รับข้อความ Heartbeat ทุก 30 นาที?">
    Heartbeat ทำงานทุก **30m** ตามค่าเริ่มต้น (**1h** เมื่อใช้การยืนยันตัวตนแบบ OAuth) ปรับแต่งหรือปิดได้:

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

    หากมี `HEARTBEAT.md` อยู่แต่โดยผลลัพธ์แล้วว่างเปล่า (มีเฉพาะบรรทัดว่างและส่วนหัว markdown
    เช่น `# Heading`) OpenClaw จะข้ามการรัน Heartbeat เพื่อประหยัดการเรียก API
    หากไม่มีไฟล์นี้ Heartbeat จะยังทำงานและให้โมเดลตัดสินใจว่าจะทำอะไร

    การ override รายเอเจนต์ใช้ `agents.list[].heartbeat` เอกสาร: [Heartbeat](/th/gateway/heartbeat).

  </Accordion>

  <Accordion title='ฉันต้องเพิ่ม "บัญชีบอต" เข้าไปในกลุ่ม WhatsApp หรือไม่?'>
    ไม่ต้อง OpenClaw ทำงานบน **บัญชีของคุณเอง** ดังนั้นหากคุณอยู่ในกลุ่ม OpenClaw ก็จะเห็นกลุ่มนั้นได้
    ตามค่าเริ่มต้น การตอบกลับในกลุ่มจะถูกบล็อกจนกว่าคุณจะอนุญาตผู้ส่ง (`groupPolicy: "allowlist"`)

    หากคุณต้องการให้มีเพียง **คุณ** เท่านั้นที่สั่งให้ตอบกลับในกลุ่มได้:

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

  <Accordion title="ฉันจะรับ JID ของกลุ่ม WhatsApp ได้อย่างไร?">
    ตัวเลือกที่ 1 (เร็วที่สุด): tail logs แล้วส่งข้อความทดสอบในกลุ่ม:

    ```bash
    openclaw logs --follow --json
    ```

    มองหา `chatId` (หรือ `from`) ที่ลงท้ายด้วย `@g.us` เช่น:
    `1234567890-1234567890@g.us`.

    ตัวเลือกที่ 2 (หากกำหนดค่า/allowlist ไว้แล้ว): แสดงรายการกลุ่มจาก config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    เอกสาร: [WhatsApp](/th/channels/whatsapp), [ไดเรกทอรี](/th/cli/directory), [บันทึก](/th/cli/logs).

  </Accordion>

  <Accordion title="ทำไม OpenClaw จึงไม่ตอบกลับในกลุ่ม?">
    สาเหตุที่พบบ่อยสองข้อ:

    - เปิด mention gating อยู่ (ค่าเริ่มต้น) คุณต้อง @mention บอต (หรือให้ตรงกับ `mentionPatterns`)
    - คุณกำหนดค่า `channels.whatsapp.groups` โดยไม่มี `"*"` และกลุ่มนั้นไม่ได้อยู่ใน allowlist

    ดู [กลุ่ม](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages)

  </Accordion>

  <Accordion title="กลุ่ม/เธรดใช้บริบทร่วมกับ DM หรือไม่?">
    แชตโดยตรงจะยุบรวมเป็นเซสชันหลักตามค่าเริ่มต้น กลุ่ม/ช่องมีคีย์เซสชันของตัวเอง และหัวข้อ Telegram / เธรด Discord เป็นเซสชันแยกต่างหาก ดู [กลุ่ม](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages)
  </Accordion>

  <Accordion title="ฉันสร้างเวิร์กสเปซและเอเจนต์ได้กี่รายการ?">
    ไม่มีขีดจำกัดตายตัว หลายสิบรายการ (แม้แต่หลายร้อยรายการ) ก็ทำได้ แต่ให้ระวัง:

    - **การเพิ่มขึ้นของดิสก์:** เซสชัน + ทรานสคริปต์อยู่ใต้ `~/.openclaw/agents/<agentId>/sessions/`
    - **ค่าใช้จ่ายโทเค็น:** เอเจนต์มากขึ้นหมายถึงการใช้งานโมเดลพร้อมกันมากขึ้น
    - **ภาระงานด้าน Ops:** โปรไฟล์การยืนยันตัวตน เวิร์กสเปซ และการกำหนดเส้นทางช่องทางของแต่ละเอเจนต์

    เคล็ดลับ:

    - เก็บเวิร์กสเปซที่ **ใช้งานอยู่** หนึ่งรายการต่อเอเจนต์ (`agents.defaults.workspace`)
    - ตัดเซสชันเก่าออก (ลบ JSONL หรือรายการใน store) หากดิสก์โตขึ้น
    - ใช้ `openclaw doctor` เพื่อตรวจหาเวิร์กสเปซที่หลงเหลือและโปรไฟล์ที่ไม่ตรงกัน

  </Accordion>

  <Accordion title="ฉันรันบอทหรือแชตหลายรายการพร้อมกันได้ไหม (Slack) และควรตั้งค่าอย่างไร?">
    ได้ ใช้ **การกำหนดเส้นทางแบบหลายเอเจนต์** เพื่อรันเอเจนต์ที่แยกจากกันหลายตัว และกำหนดเส้นทางข้อความขาเข้าตาม
    ช่องทาง/บัญชี/เพียร์ Slack รองรับในฐานะช่องทางและสามารถผูกกับเอเจนต์เฉพาะได้

    การเข้าถึงเบราว์เซอร์ทรงพลัง แต่ไม่ใช่ "ทำอะไรก็ได้เหมือนมนุษย์" - ระบบป้องกันบอท, CAPTCHA และ MFA ยังสามารถ
    บล็อกการทำงานอัตโนมัติได้ สำหรับการควบคุมเบราว์เซอร์ที่น่าเชื่อถือที่สุด ให้ใช้ Chrome MCP ในเครื่องบนโฮสต์
    หรือใช้ CDP บนเครื่องที่รันเบราว์เซอร์จริง

    การตั้งค่าที่แนะนำ:

    - โฮสต์ Gateway ที่เปิดตลอดเวลา (VPS/Mac mini)
    - หนึ่งเอเจนต์ต่อหนึ่งบทบาท (bindings)
    - ช่องทาง Slack ที่ผูกกับเอเจนต์เหล่านั้น
    - เบราว์เซอร์ในเครื่องผ่าน Chrome MCP หรือโหนดเมื่อจำเป็น

    เอกสาร: [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent), [Slack](/th/channels/slack),
    [เบราว์เซอร์](/th/tools/browser), [โหนด](/th/nodes)

  </Accordion>
</AccordionGroup>

## โมเดล, failover และโปรไฟล์การยืนยันตัวตน

ถามตอบเกี่ยวกับโมเดล — ค่าเริ่มต้น, การเลือก, alias, การสลับ, failover, โปรไฟล์การยืนยันตัวตน —
อยู่ใน [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models)

## Gateway: พอร์ต, "รันอยู่แล้ว" และโหมดระยะไกล

<AccordionGroup>
  <Accordion title="Gateway ใช้พอร์ตใด?">
    `gateway.port` ควบคุมพอร์ต multiplexed เดียวสำหรับ WebSocket + HTTP (Control UI, hooks ฯลฯ)

    ลำดับความสำคัญ:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status จึงแสดงว่า "Runtime: running" แต่ "Connectivity probe: failed"?'>
    เพราะ "running" คือมุมมองของ **supervisor** (launchd/systemd/schtasks) ส่วน connectivity probe คือ CLI ที่เชื่อมต่อกับ gateway WebSocket จริง

    ใช้ `openclaw gateway status` และเชื่อถือบรรทัดเหล่านี้:

    - `Probe target:` (URL ที่ probe ใช้จริง)
    - `Listening:` (สิ่งที่ bind อยู่บนพอร์ตจริง)
    - `Last gateway error:` (สาเหตุหลักที่พบบ่อยเมื่อโปรเซสยังทำงานอยู่แต่พอร์ตไม่ได้ฟังอยู่)

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status จึงแสดง "Config (cli)" และ "Config (service)" แตกต่างกัน?'>
    คุณกำลังแก้ไขไฟล์ config หนึ่งไฟล์ ขณะที่ service กำลังรันอีกไฟล์หนึ่ง (มักเป็นความไม่ตรงกันของ `--profile` / `OPENCLAW_STATE_DIR`)

    วิธีแก้:

    ```bash
    openclaw gateway install --force
    ```

    รันคำสั่งนั้นจาก `--profile` / สภาพแวดล้อมเดียวกับที่คุณต้องการให้ service ใช้

  </Accordion>

  <Accordion title='"another gateway instance is already listening" หมายความว่าอย่างไร?'>
    OpenClaw บังคับใช้ runtime lock โดย bind ตัวรับฟัง WebSocket ทันทีเมื่อเริ่มทำงาน (ค่าเริ่มต้น `ws://127.0.0.1:18789`) หาก bind ล้มเหลวด้วย `EADDRINUSE` จะโยน `GatewayLockError` ซึ่งระบุว่าอีกอินสแตนซ์กำลังฟังอยู่แล้ว

    วิธีแก้: หยุดอินสแตนซ์อื่น ปล่อยพอร์ตให้ว่าง หรือรันด้วย `openclaw gateway --port <port>`

  </Accordion>

  <Accordion title="ฉันจะรัน OpenClaw ในโหมดระยะไกล (ไคลเอนต์เชื่อมต่อไปยัง Gateway ที่อื่น) ได้อย่างไร?">
    ตั้งค่า `gateway.mode: "remote"` และชี้ไปยัง URL WebSocket ระยะไกล โดยเลือกใช้ข้อมูลรับรองระยะไกลแบบ shared-secret ได้:

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
    - แอป macOS เฝ้าดูไฟล์ config และสลับโหมดแบบสดเมื่อค่าเหล่านี้เปลี่ยน
    - `gateway.remote.token` / `.password` เป็นข้อมูลรับรองระยะไกลฝั่งไคลเอนต์เท่านั้น โดยตัวมันเองไม่ได้เปิดใช้งานการยืนยันตัวตนของ local gateway

  </Accordion>

  <Accordion title='Control UI แสดงว่า "unauthorized" (หรือเชื่อมต่อใหม่ซ้ำ ๆ) ตอนนี้ควรทำอย่างไร?'>
    เส้นทางการยืนยันตัวตนของ gateway และวิธีการยืนยันตัวตนของ UI ไม่ตรงกัน

    ข้อเท็จจริง (จากโค้ด):

    - Control UI เก็บโทเค็นไว้ใน `sessionStorage` สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL gateway ที่เลือก ดังนั้นการรีเฟรชแท็บเดิมจึงยังใช้งานได้โดยไม่ต้องกู้คืนการคงอยู่ของโทเค็นใน localStorage ระยะยาว
    - เมื่อเกิด `AUTH_TOKEN_MISMATCH` ไคลเอนต์ที่เชื่อถือได้สามารถลองใหม่แบบจำกัดหนึ่งครั้งด้วยโทเค็นอุปกรณ์ที่แคชไว้ เมื่อ gateway ส่งคำแนะนำการลองใหม่กลับมา (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)
    - การลองใหม่ด้วยโทเค็นที่แคชไว้นั้นตอนนี้ใช้ scope ที่อนุมัติและแคชไว้ซึ่งเก็บพร้อมกับโทเค็นอุปกรณ์ซ้ำ ผู้เรียกที่ระบุ `deviceToken` / `scopes` อย่างชัดเจนยังคงใช้ชุด scope ที่ร้องขอเองแทนการสืบทอด scope ที่แคชไว้
    - นอกเส้นทางการลองใหม่นั้น ลำดับความสำคัญของการยืนยันตัวตนตอนเชื่อมต่อคือ shared token/password ที่ระบุชัดเจนก่อน จากนั้น `deviceToken` ที่ระบุชัดเจน จากนั้นโทเค็นอุปกรณ์ที่จัดเก็บไว้ แล้วจึงเป็น bootstrap token
    - การตรวจ scope ของ bootstrap token มีคำนำหน้าตามบทบาท allowlist ของ operator bootstrap ในตัวตอบสนองเฉพาะคำขอ operator เท่านั้น; บทบาท node หรือ non-operator อื่น ๆ ยังต้องมี scope ใต้คำนำหน้าบทบาทของตนเอง

    วิธีแก้:

    - เร็วที่สุด: `openclaw dashboard` (พิมพ์ + คัดลอก URL แดชบอร์ด พยายามเปิด; แสดงคำแนะนำ SSH หากเป็น headless)
    - หากคุณยังไม่มีโทเค็น: `openclaw doctor --generate-gateway-token`
    - หากเป็นระยะไกล ให้ tunnel ก่อน: `ssh -N -L 18789:127.0.0.1:18789 user@host` จากนั้นเปิด `http://127.0.0.1:18789/`
    - โหมด shared-secret: ตั้งค่า `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` จากนั้นวาง secret ที่ตรงกันในการตั้งค่า Control UI
    - โหมด Tailscale Serve: ตรวจให้แน่ใจว่าเปิดใช้งาน `gateway.auth.allowTailscale` และคุณกำลังเปิด Serve URL ไม่ใช่ URL loopback/tailnet ดิบที่ข้าม identity headers ของ Tailscale
    - โหมด trusted-proxy: ตรวจให้แน่ใจว่าคุณเข้ามาผ่านพร็อกซีที่รับรู้ตัวตนตามที่กำหนดค่าไว้ ไม่ใช่ URL gateway ดิบ พร็อกซี loopback บนโฮสต์เดียวกันยังต้องใช้ `gateway.auth.trustedProxy.allowLoopback = true`
    - หากยังไม่ตรงกันหลังจากลองใหม่หนึ่งครั้ง ให้หมุนเวียน/อนุมัติโทเค็นอุปกรณ์ที่จับคู่ใหม่:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - หากคำสั่ง rotate นั้นบอกว่าถูกปฏิเสธ ให้ตรวจสองอย่าง:
      - เซสชันอุปกรณ์ที่จับคู่สามารถหมุนเวียนได้เฉพาะอุปกรณ์ **ของตนเอง** เท่านั้น เว้นแต่จะมี `operator.admin` ด้วย
      - ค่า `--scope` ที่ระบุชัดเจนต้องไม่เกิน scope ของ operator ปัจจุบันของผู้เรียก
    - ยังติดอยู่หรือไม่? รัน `openclaw status --all` และทำตาม [การแก้ไขปัญหา](/th/gateway/troubleshooting) ดู [แดชบอร์ด](/th/web/dashboard) สำหรับรายละเอียดการยืนยันตัวตน

  </Accordion>

  <Accordion title="ฉันตั้งค่า gateway.bind เป็น tailnet แต่ bind ไม่ได้และไม่มีอะไรฟังอยู่">
    การ bind แบบ `tailnet` จะเลือก IP ของ Tailscale จากอินเทอร์เฟซเครือข่ายของคุณ (100.64.0.0/10) หากเครื่องไม่ได้อยู่บน Tailscale (หรืออินเทอร์เฟซไม่ทำงาน) ก็ไม่มีอะไรให้ bind

    วิธีแก้:

    - เริ่ม Tailscale บนโฮสต์นั้น (เพื่อให้มีที่อยู่ 100.x), หรือ
    - สลับเป็น `gateway.bind: "loopback"` / `"lan"`

    หมายเหตุ: `tailnet` เป็นแบบระบุชัดเจน `auto` จะเลือก loopback ก่อน; ใช้ `gateway.bind: "tailnet"` เมื่อคุณต้องการ bind เฉพาะ tailnet เท่านั้น

  </Accordion>

  <Accordion title="ฉันรัน Gateway หลายตัวบนโฮสต์เดียวกันได้ไหม?">
    โดยทั่วไปไม่ได้ - Gateway หนึ่งตัวสามารถรันช่องทางส่งข้อความและเอเจนต์หลายรายการได้ ใช้ Gateway หลายตัวเฉพาะเมื่อคุณต้องการ redundancy (เช่น บอทสำรอง) หรือการแยกอย่างเข้มงวด

    ได้ แต่คุณต้องแยกส่วนเหล่านี้:

    - `OPENCLAW_CONFIG_PATH` (config ต่ออินสแตนซ์)
    - `OPENCLAW_STATE_DIR` (state ต่ออินสแตนซ์)
    - `agents.defaults.workspace` (การแยกเวิร์กสเปซ)
    - `gateway.port` (พอร์ตไม่ซ้ำกัน)

    การตั้งค่าอย่างรวดเร็ว (แนะนำ):

    - ใช้ `openclaw --profile <name> ...` ต่ออินสแตนซ์ (สร้าง `~/.openclaw-<name>` ให้อัตโนมัติ)
    - ตั้งค่า `gateway.port` ที่ไม่ซ้ำกันใน config ของแต่ละโปรไฟล์ (หรือส่ง `--port` สำหรับการรันด้วยตนเอง)
    - ติดตั้ง service ต่อโปรไฟล์: `openclaw --profile <name> gateway install`

    โปรไฟล์ยังต่อท้ายชื่อ service ด้วย (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`)
    คู่มือฉบับเต็ม: [Gateway หลายตัว](/th/gateway/multiple-gateways)

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008 หมายความว่าอย่างไร?'>
    Gateway เป็น **เซิร์ฟเวอร์ WebSocket** และคาดหวังให้ข้อความแรกสุด
    เป็นเฟรม `connect` หากได้รับสิ่งอื่น จะปิดการเชื่อมต่อ
    ด้วย **code 1008** (การละเมิดนโยบาย)

    สาเหตุที่พบบ่อย:

    - คุณเปิด URL **HTTP** ในเบราว์เซอร์ (`http://...`) แทนที่จะใช้ไคลเอนต์ WS
    - คุณใช้พอร์ตหรือพาธผิด
    - พร็อกซีหรือ tunnel ตัด auth headers ออก หรือส่งคำขอที่ไม่ใช่ Gateway

    วิธีแก้ด่วน:

    1. ใช้ URL WS: `ws://<host>:18789` (หรือ `wss://...` หากเป็น HTTPS)
    2. อย่าเปิดพอร์ต WS ในแท็บเบราว์เซอร์ปกติ
    3. หากเปิดการยืนยันตัวตน ให้ใส่ token/password ในเฟรม `connect`

    หากคุณใช้ CLI หรือ TUI, URL ควรมีลักษณะดังนี้:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    รายละเอียดโปรโตคอล: [โปรโตคอล Gateway](/th/gateway/protocol)

  </Accordion>
</AccordionGroup>

## การบันทึก log และการดีบัก

<AccordionGroup>
  <Accordion title="log อยู่ที่ไหน?">
    ไฟล์ log (มีโครงสร้าง):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    คุณสามารถตั้งพาธที่คงที่ผ่าน `logging.file` ระดับ log ของไฟล์ควบคุมโดย `logging.level` ความละเอียดของคอนโซลควบคุมโดย `--verbose` และ `logging.consoleLevel`

    วิธี tail log ที่เร็วที่สุด:

    ```bash
    openclaw logs --follow
    ```

    log ของ service/supervisor (เมื่อ gateway รันผ่าน launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` และ `gateway.err.log` (ค่าเริ่มต้น: `~/.openclaw/logs/...`; โปรไฟล์ใช้ `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    ดู [การแก้ไขปัญหา](/th/gateway/troubleshooting) สำหรับข้อมูลเพิ่มเติม

  </Accordion>

  <Accordion title="ฉันจะเริ่ม/หยุด/รีสตาร์ท service ของ Gateway ได้อย่างไร?">
    ใช้ตัวช่วย gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณรัน gateway ด้วยตนเอง `openclaw gateway --force` สามารถเรียกคืนพอร์ตได้ ดู [Gateway](/th/gateway)

  </Accordion>

  <Accordion title="ฉันปิดเทอร์มินัลบน Windows ไปแล้ว - จะรีสตาร์ท OpenClaw ได้อย่างไร?">
    มี **สองโหมดการติดตั้งบน Windows**:

    **1) WSL2 (แนะนำ):** Gateway รันอยู่ภายใน Linux

    เปิด PowerShell, เข้า WSL แล้วรีสตาร์ท:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณไม่เคยติดตั้ง service ให้เริ่มใน foreground:

    ```bash
    openclaw gateway run
    ```

    **2) Native Windows (ไม่แนะนำ):** Gateway รันโดยตรงใน Windows

    เปิด PowerShell แล้วรัน:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณรันด้วยตนเอง (ไม่มี service) ให้ใช้:

    ```powershell
    openclaw gateway run
    ```

    เอกสาร: [Windows (WSL2)](/th/platforms/windows), [runbook service ของ Gateway](/th/gateway)

  </Accordion>

  <Accordion title="Gateway เปิดอยู่แต่ไม่มีคำตอบกลับมา ฉันควรตรวจอะไร?">
    เริ่มด้วยการตรวจสุขภาพแบบรวดเร็ว:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    สาเหตุที่พบบ่อย:

    - การยืนยันตัวตนโมเดลไม่ได้โหลดบน **โฮสต์ Gateway** (ตรวจสอบ `models status`)
    - การจับคู่/allowlist ของช่องทางบล็อกการตอบกลับ (ตรวจสอบการกำหนดค่าช่องทาง + บันทึก)
    - WebChat/แดชบอร์ดเปิดอยู่โดยไม่มีโทเค็นที่ถูกต้อง

    หากคุณอยู่ระยะไกล ให้ยืนยันว่าการเชื่อมต่อทันเนล/Tailscale เปิดอยู่ และ
    WebSocket ของ Gateway เข้าถึงได้

    เอกสาร: [ช่องทาง](/th/channels), [การแก้ไขปัญหา](/th/gateway/troubleshooting), [การเข้าถึงระยะไกล](/th/gateway/remote).

  </Accordion>

  <Accordion title='"ตัดการเชื่อมต่อจาก Gateway: ไม่มีเหตุผล" - ต้องทำอย่างไรต่อ?'>
    โดยปกติหมายความว่า UI สูญเสียการเชื่อมต่อ WebSocket ตรวจสอบ:

    1. Gateway กำลังทำงานอยู่หรือไม่? `openclaw gateway status`
    2. Gateway สุขภาพดีหรือไม่? `openclaw status`
    3. UI มีโทเค็นที่ถูกต้องหรือไม่? `openclaw dashboard`
    4. หากอยู่ระยะไกล ลิงก์ทันเนล/Tailscale เปิดอยู่หรือไม่?

    จากนั้นติดตามบันทึก:

    ```bash
    openclaw logs --follow
    ```

    เอกสาร: [แดชบอร์ด](/th/web/dashboard), [การเข้าถึงระยะไกล](/th/gateway/remote), [การแก้ไขปัญหา](/th/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands ล้มเหลว ฉันควรตรวจสอบอะไร?">
    เริ่มจากบันทึกและสถานะช่องทาง:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    จากนั้นจับคู่กับข้อผิดพลาด:

    - `BOT_COMMANDS_TOO_MUCH`: เมนู Telegram มีรายการมากเกินไป OpenClaw ตัดให้เหลือไม่เกินขีดจำกัดของ Telegram และลองใหม่ด้วยจำนวนคำสั่งที่น้อยลงแล้ว แต่บางรายการในเมนูยังต้องถูกลบออก ลดคำสั่ง Plugin/Skills/กำหนดเอง หรือปิดใช้ `channels.telegram.commands.native` หากคุณไม่ต้องการเมนู
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` หรือข้อผิดพลาดเครือข่ายที่คล้ายกัน: หากคุณอยู่บน VPS หรือหลังพร็อกซี ให้ยืนยันว่าอนุญาต HTTPS ขาออกและ DNS ทำงานกับ `api.telegram.org`

    หาก Gateway อยู่ระยะไกล ตรวจสอบให้แน่ใจว่าคุณกำลังดูบันทึกบนโฮสต์ Gateway

    เอกสาร: [Telegram](/th/channels/telegram), [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI ไม่แสดงผลลัพธ์ ฉันควรตรวจสอบอะไร?">
    ก่อนอื่นให้ยืนยันว่า Gateway เข้าถึงได้และเอเจนต์สามารถทำงานได้:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    ใน TUI ให้ใช้ `/status` เพื่อดูสถานะปัจจุบัน หากคุณคาดว่าจะได้รับการตอบกลับใน
    ช่องทางแชต ตรวจสอบให้แน่ใจว่าเปิดการส่งแล้ว (`/deliver on`)

    เอกสาร: [TUI](/th/web/tui), [คำสั่งสแลช](/th/tools/slash-commands).

  </Accordion>

  <Accordion title="ฉันจะหยุดแล้วเริ่ม Gateway ใหม่ทั้งหมดได้อย่างไร?">
    หากคุณติดตั้งบริการไว้:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    คำสั่งนี้จะหยุด/เริ่ม **บริการที่มีตัวควบคุมดูแล** (launchd บน macOS, systemd บน Linux)
    ใช้เมื่อ Gateway ทำงานเบื้องหลังเป็น daemon

    หากคุณกำลังรันแบบเบื้องหน้า ให้หยุดด้วย Ctrl-C แล้วรัน:

    ```bash
    openclaw gateway run
    ```

    เอกสาร: [คู่มือปฏิบัติงานบริการ Gateway](/th/gateway).

  </Accordion>

  <Accordion title="อธิบายแบบง่าย: openclaw gateway restart เทียบกับ openclaw gateway">
    - `openclaw gateway restart`: รีสตาร์ต **บริการเบื้องหลัง** (launchd/systemd)
    - `openclaw gateway`: รัน Gateway **ในเบื้องหน้า** สำหรับเซสชันเทอร์มินัลนี้

    หากคุณติดตั้งบริการไว้ ให้ใช้คำสั่ง gateway ใช้ `openclaw gateway` เมื่อ
    คุณต้องการรันครั้งเดียวแบบเบื้องหน้า

  </Accordion>

  <Accordion title="วิธีที่เร็วที่สุดในการดูรายละเอียดเพิ่มเติมเมื่อมีบางอย่างล้มเหลว">
    เริ่ม Gateway ด้วย `--verbose` เพื่อดูรายละเอียดคอนโซลเพิ่มเติม จากนั้นตรวจสอบไฟล์บันทึกเพื่อดูการยืนยันตัวตนของช่องทาง การกำหนดเส้นทางโมเดล และข้อผิดพลาด RPC
  </Accordion>
</AccordionGroup>

## สื่อและไฟล์แนบ

<AccordionGroup>
  <Accordion title="Skills ของฉันสร้างรูปภาพ/PDF แต่ไม่มีอะไรถูกส่ง">
    ไฟล์แนบขาออกจากเอเจนต์ต้องมีบรรทัด `MEDIA:<path-or-url>` (อยู่ในบรรทัดของตัวเอง) ดู [การตั้งค่าผู้ช่วย OpenClaw](/th/start/openclaw) และ [การส่งของเอเจนต์](/th/tools/agent-send)

    การส่งผ่าน CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    ตรวจสอบเพิ่มเติม:

    - ช่องทางเป้าหมายรองรับสื่อขาออกและไม่ได้ถูกบล็อกโดย allowlist
    - ไฟล์อยู่ภายในขีดจำกัดขนาดของผู้ให้บริการ (รูปภาพจะถูกปรับขนาดให้ไม่เกิน 2048px)
    - `tools.fs.workspaceOnly=true` จำกัดการส่งพาธภายในเครื่องให้อยู่ใน workspace, temp/media-store และไฟล์ที่ผ่านการตรวจสอบโดย sandbox
    - `tools.fs.workspaceOnly=false` ทำให้ `MEDIA:` ส่งไฟล์ภายในเครื่องของโฮสต์ที่เอเจนต์อ่านได้อยู่แล้ว แต่เฉพาะสื่อและชนิดเอกสารที่ปลอดภัยเท่านั้น (รูปภาพ เสียง วิดีโอ PDF และเอกสาร Office) ไฟล์ข้อความล้วนและไฟล์ที่ดูเหมือนมีความลับยังคงถูกบล็อก

    ดู [รูปภาพ](/th/nodes/images).

  </Accordion>
</AccordionGroup>

## ความปลอดภัยและการควบคุมการเข้าถึง

<AccordionGroup>
  <Accordion title="การเปิด OpenClaw ให้รับ DM ขาเข้าปลอดภัยหรือไม่?">
    ให้ถือว่า DM ขาเข้าเป็นอินพุตที่ไม่น่าเชื่อถือ ค่าเริ่มต้นถูกออกแบบมาเพื่อลดความเสี่ยง:

    - พฤติกรรมเริ่มต้นบนช่องทางที่รองรับ DM คือ **การจับคู่**:
      - ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ บอตจะไม่ประมวลผลข้อความของพวกเขา
      - อนุมัติด้วย: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - คำขอที่รอดำเนินการจำกัดไว้ที่ **3 รายการต่อช่องทาง**; ตรวจสอบ `openclaw pairing list --channel <channel> [--account <id>]` หากรหัสไม่มาถึง
    - การเปิด DM สาธารณะต้องเลือกใช้โดยชัดเจน (`dmPolicy: "open"` และ allowlist `"*"`)

    รัน `openclaw doctor` เพื่อแสดงนโยบาย DM ที่มีความเสี่ยง

  </Accordion>

  <Accordion title="prompt injection เป็นปัญหาเฉพาะบอตสาธารณะเท่านั้นหรือไม่?">
    ไม่ใช่ prompt injection เกี่ยวกับ **เนื้อหาที่ไม่น่าเชื่อถือ** ไม่ใช่แค่ใครสามารถ DM บอตได้
    หากผู้ช่วยของคุณอ่านเนื้อหาภายนอก (web search/fetch, หน้าเบราว์เซอร์, อีเมล,
    เอกสาร, ไฟล์แนบ, บันทึกที่วางเข้ามา) เนื้อหานั้นอาจมีคำสั่งที่พยายาม
    ยึดการควบคุมโมเดลได้ สิ่งนี้อาจเกิดขึ้นแม้ว่า **คุณจะเป็นผู้ส่งเพียงคนเดียว**

    ความเสี่ยงสูงสุดเกิดขึ้นเมื่อเปิดใช้เครื่องมือ: โมเดลอาจถูกหลอกให้
    ส่งออกบริบทหรือเรียกเครื่องมือแทนคุณ ลดผลกระทบที่อาจเกิดขึ้นโดย:

    - ใช้เอเจนต์ "reader" แบบอ่านอย่างเดียวหรือปิดเครื่องมือเพื่อสรุปเนื้อหาที่ไม่น่าเชื่อถือ
    - ปิด `web_search` / `web_fetch` / `browser` สำหรับเอเจนต์ที่เปิดใช้เครื่องมือ
    - ถือว่าข้อความที่ถอดรหัสจากไฟล์/เอกสารก็ไม่น่าเชื่อถือเช่นกัน: OpenResponses
      `input_file` และการดึงข้อมูลจากไฟล์แนบสื่อต่างห่อข้อความที่ดึงออกมาไว้ใน
      เครื่องหมายขอบเขตเนื้อหาภายนอกอย่างชัดเจน แทนที่จะส่งข้อความไฟล์ดิบ
    - ใช้ sandbox และ allowlist เครื่องมือแบบเข้มงวด

    รายละเอียด: [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="บอตของฉันควรมีอีเมล บัญชี GitHub หรือหมายเลขโทรศัพท์ของตัวเองหรือไม่?">
    ควรมีสำหรับการตั้งค่าส่วนใหญ่ การแยกบอตด้วยบัญชีและหมายเลขโทรศัพท์ต่างหาก
    ลดผลกระทบที่อาจเกิดขึ้นหากมีสิ่งผิดพลาด นอกจากนี้ยังทำให้หมุนเวียน
    credentials หรือเพิกถอนการเข้าถึงได้ง่ายขึ้นโดยไม่กระทบบัญชีส่วนตัวของคุณ

    เริ่มจากขนาดเล็ก ให้สิทธิ์เข้าถึงเฉพาะเครื่องมือและบัญชีที่คุณต้องใช้จริง แล้วค่อยขยาย
    ภายหลังหากจำเป็น

    เอกสาร: [ความปลอดภัย](/th/gateway/security), [การจับคู่](/th/channels/pairing).

  </Accordion>

  <Accordion title="ฉันให้มันมี autonomy เหนือข้อความของฉันได้ไหม และปลอดภัยหรือไม่?">
    เรา **ไม่** แนะนำให้ให้ autonomy เต็มรูปแบบเหนือข้อความส่วนตัวของคุณ รูปแบบที่ปลอดภัยที่สุดคือ:

    - ให้ DM อยู่ใน **โหมดการจับคู่** หรือใช้ allowlist ที่จำกัดมาก
    - ใช้ **หมายเลขหรือบัญชีแยกต่างหาก** หากคุณต้องการให้มันส่งข้อความแทนคุณ
    - ให้มันร่างข้อความ แล้ว **อนุมัติก่อนส่ง**

    หากคุณต้องการทดลอง ให้ทำบนบัญชีเฉพาะและแยกออกจากบัญชีอื่น ดู
    [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="ฉันใช้โมเดลที่ถูกกว่าสำหรับงานผู้ช่วยส่วนตัวได้ไหม?">
    ได้ **หาก** เอเจนต์เป็นแบบแชตอย่างเดียวและอินพุตเชื่อถือได้ โมเดลระดับเล็กกว่า
    อ่อนไหวต่อการถูกยึดคำสั่งมากกว่า ดังนั้นให้หลีกเลี่ยงสำหรับเอเจนต์ที่เปิดใช้เครื่องมือ
    หรือเมื่ออ่านเนื้อหาที่ไม่น่าเชื่อถือ หากจำเป็นต้องใช้โมเดลที่เล็กกว่า ให้ล็อก
    เครื่องมือและรันภายใน sandbox ดู [ความปลอดภัย](/th/gateway/security).
  </Accordion>

  <Accordion title="ฉันรัน /start ใน Telegram แต่ไม่ได้รับรหัสจับคู่">
    รหัสจับคู่จะถูกส่ง **เฉพาะ** เมื่อผู้ส่งที่ไม่รู้จักส่งข้อความถึงบอตและ
    เปิดใช้ `dmPolicy: "pairing"` อยู่ `/start` เพียงอย่างเดียวจะไม่สร้างรหัส

    ตรวจสอบคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list telegram
    ```

    หากคุณต้องการเข้าถึงทันที ให้เพิ่ม id ผู้ส่งของคุณใน allowlist หรือตั้ง `dmPolicy: "open"`
    สำหรับบัญชีนั้น

  </Accordion>

  <Accordion title="WhatsApp: มันจะส่งข้อความถึงรายชื่อติดต่อของฉันไหม? การจับคู่ทำงานอย่างไร?">
    ไม่ นโยบาย DM เริ่มต้นของ WhatsApp คือ **การจับคู่** ผู้ส่งที่ไม่รู้จักจะได้รับเฉพาะรหัสจับคู่ และข้อความของพวกเขา **จะไม่ถูกประมวลผล** OpenClaw จะตอบเฉพาะแชตที่ได้รับหรือการส่งที่คุณเรียกอย่างชัดเจนเท่านั้น

    อนุมัติการจับคู่ด้วย:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    แสดงรายการคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list whatsapp
    ```

    พรอมต์หมายเลขโทรศัพท์ของวิซาร์ด: ใช้เพื่อตั้ง **allowlist/เจ้าของ** เพื่อให้ DM ของคุณเองได้รับอนุญาต ไม่ได้ใช้สำหรับการส่งอัตโนมัติ หากคุณรันบนหมายเลข WhatsApp ส่วนตัว ให้ใช้หมายเลขนั้นและเปิดใช้ `channels.whatsapp.selfChatMode`

  </Accordion>
</AccordionGroup>

## คำสั่งแชต การยกเลิกงาน และ "มันไม่ยอมหยุด"

<AccordionGroup>
  <Accordion title="ฉันจะหยุดไม่ให้ข้อความระบบภายในแสดงในแชตได้อย่างไร?">
    ข้อความภายในหรือข้อความเครื่องมือส่วนใหญ่จะปรากฏเฉพาะเมื่อเปิดใช้ **verbose**, **trace** หรือ **reasoning**
    สำหรับเซสชันนั้น

    แก้ไขในแชตที่คุณเห็นข้อความ:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    หากยังมีเสียงรบกวนอยู่ ให้ตรวจสอบการตั้งค่าเซสชันใน Control UI และตั้งค่า verbose
    เป็น **inherit** ตรวจสอบด้วยว่าคุณไม่ได้ใช้โปรไฟล์บอตที่ตั้ง `verboseDefault`
    เป็น `on` ใน config

    เอกสาร: [การคิดและ verbose](/th/tools/thinking), [ความปลอดภัย](/th/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="ฉันจะหยุด/ยกเลิกงานที่กำลังรันได้อย่างไร?">
    ส่งข้อความใดข้อความหนึ่งต่อไปนี้ **เป็นข้อความเดี่ยว** (ไม่ใช่สแลช):

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

    ข้อความเหล่านี้เป็นตัวกระตุ้นการยกเลิก (ไม่ใช่คำสั่งสแลช)

    สำหรับกระบวนการเบื้องหลัง (จากเครื่องมือ exec) คุณสามารถขอให้เอเจนต์รัน:

    ```
    process action:kill sessionId:XXX
    ```

    ภาพรวมคำสั่งสแลช: ดู [คำสั่งสแลช](/th/tools/slash-commands).

    คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความ **เดี่ยว** ที่ขึ้นต้นด้วย `/` แต่ช็อตคัตบางรายการ (เช่น `/status`) ก็ใช้แบบ inline ได้สำหรับผู้ส่งที่อยู่ใน allowlist

  </Accordion>

  <Accordion title='ฉันจะส่งข้อความ Discord จาก Telegram ได้อย่างไร? ("Cross-context messaging denied")'>
    OpenClaw บล็อกการส่งข้อความ **ข้ามผู้ให้บริการ** ตามค่าเริ่มต้น หากการเรียกเครื่องมือถูกผูกกับ
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

    รีสตาร์ต Gateway หลังจากแก้ไข config

  </Accordion>

  <Accordion title='ทำไมรู้สึกเหมือนบอต "เพิกเฉย" ต่อข้อความที่ส่งถี่ ๆ?'>
    โหมดคิวควบคุมว่าข้อความใหม่โต้ตอบกับการรันที่กำลังดำเนินอยู่อย่างไร ใช้ `/queue` เพื่อเปลี่ยนโหมด:

    - `steer` - จัดคิวการนำทางที่รอดำเนินการทั้งหมดสำหรับขอบเขตโมเดลถัดไปในการรันปัจจุบัน
    - `queue` - การนำทางแบบเดิมทีละรายการ
    - `followup` - รันข้อความทีละรายการ
    - `collect` - รวมข้อความเป็นชุดและตอบครั้งเดียว
    - `steer-backlog` - นำทางตอนนี้ แล้วประมวลผล backlog
    - `interrupt` - ยกเลิกการรันปัจจุบันและเริ่มใหม่

    โหมดเริ่มต้นคือ `steer` คุณสามารถเพิ่มตัวเลือกอย่าง `debounce:0.5s cap:25 drop:summarize` สำหรับโหมดติดตามผลได้ ดู [คิวคำสั่ง](/th/concepts/queue) และ [คิวการควบคุม](/th/concepts/queue-steering)

  </Accordion>
</AccordionGroup>

## อื่นๆ

<AccordionGroup>
  <Accordion title='โมเดลเริ่มต้นสำหรับ Anthropic ที่ใช้คีย์ API คืออะไร?'>
    ใน OpenClaw ข้อมูลรับรองและการเลือกโมเดลเป็นคนละส่วนกัน การตั้งค่า `ANTHROPIC_API_KEY` (หรือจัดเก็บคีย์ API ของ Anthropic ในโปรไฟล์การรับรองความถูกต้อง) จะเปิดใช้การรับรองความถูกต้อง แต่โมเดลเริ่มต้นจริงคือค่าที่คุณกำหนดใน `agents.defaults.model.primary` (เช่น `anthropic/claude-sonnet-4-6` หรือ `anthropic/claude-opus-4-6`) หากคุณเห็น `No credentials found for profile "anthropic:default"` แสดงว่า Gateway ไม่พบข้อมูลรับรองของ Anthropic ใน `auth-profiles.json` ที่คาดไว้สำหรับเอเจนต์ที่กำลังทำงานอยู่
  </Accordion>
</AccordionGroup>

---

ยังติดปัญหาอยู่หรือไม่? ถามใน [Discord](https://discord.com/invite/clawd) หรือเปิด [การสนทนาใน GitHub](https://github.com/openclaw/openclaw/discussions)

## ที่เกี่ยวข้อง

- [คำถามที่พบบ่อยสำหรับการใช้งานครั้งแรก](/th/help/faq-first-run) — การติดตั้ง การเริ่มต้นใช้งาน การรับรองความถูกต้อง การสมัครใช้งาน ข้อผิดพลาดช่วงเริ่มต้น
- [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models) — การเลือกโมเดล การสลับระบบเมื่อขัดข้อง โปรไฟล์การรับรองความถูกต้อง
- [การแก้ไขปัญหา](/th/help/troubleshooting) — การคัดแยกปัญหาโดยเริ่มจากอาการ
