---
read_when:
    - การตอบคำถามสนับสนุนทั่วไปเกี่ยวกับการตั้งค่า การติดตั้ง การเริ่มต้นใช้งาน หรือรันไทม์
    - การคัดแยกปัญหาที่ผู้ใช้รายงานก่อนการแก้จุดบกพร่องเชิงลึก
summary: คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า การกำหนดค่า และการใช้งาน OpenClaw
title: คำถามที่พบบ่อย
x-i18n:
    generated_at: "2026-05-03T21:34:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372220d62f872db1427b2836662bc8cc74e07d2cdfb651c105d3df25131855dd
    source_path: help/faq.md
    workflow: 16
---

คำตอบด่วนพร้อมการแก้ปัญหาเชิงลึกสำหรับการตั้งค่าใช้งานจริง (การพัฒนาในเครื่อง, VPS, หลายเอเจนต์, OAuth/API keys, การสลับโมเดลสำรองเมื่อขัดข้อง) สำหรับการวินิจฉัยรันไทม์ โปรดดู [การแก้ปัญหา](/th/gateway/troubleshooting) สำหรับเอกสารอ้างอิงคอนฟิกฉบับเต็ม โปรดดู [การกำหนดค่า](/th/gateway/configuration)

## 60 วินาทีแรกหากมีบางอย่างเสีย

1. **สถานะด่วน (ตรวจสอบก่อน)**

   ```bash
   openclaw status
   ```

   สรุปในเครื่องอย่างรวดเร็ว: OS + อัปเดต, การเข้าถึง gateway/service, agents/sessions, คอนฟิกผู้ให้บริการ + ปัญหารันไทม์ (เมื่อเข้าถึง Gateway ได้)

2. **รายงานที่วางแชร์ได้ (ปลอดภัยต่อการแชร์)**

   ```bash
   openclaw status --all
   ```

   การวินิจฉัยแบบอ่านอย่างเดียวพร้อมส่วนท้ายของล็อก (ปกปิดโทเค็นแล้ว)

3. **สถานะ daemon + พอร์ต**

   ```bash
   openclaw gateway status
   ```

   แสดงรันไทม์ของ supervisor เทียบกับการเข้าถึง RPC, URL เป้าหมายของ probe และคอนฟิกที่ service น่าจะใช้

4. **probe เชิงลึก**

   ```bash
   openclaw status --deep
   ```

   รัน live gateway health probe รวมถึง channel probes เมื่อรองรับ
   (ต้องมี Gateway ที่เข้าถึงได้) ดู [Health](/th/gateway/health)

5. **ดูท้ายล็อกล่าสุด**

   ```bash
   openclaw logs --follow
   ```

   หาก RPC ล่ม ให้ถอยกลับไปใช้:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   ล็อกไฟล์แยกจากล็อกของ service; ดู [Logging](/th/logging) และ [การแก้ปัญหา](/th/gateway/troubleshooting)

6. **รัน doctor (ซ่อมแซม)**

   ```bash
   openclaw doctor
   ```

   ซ่อมแซม/ย้ายคอนฟิก/สถานะ + รัน health checks ดู [Doctor](/th/gateway/doctor)

7. **สแนปช็อต Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # แสดง URL เป้าหมาย + path ของคอนฟิกเมื่อเกิดข้อผิดพลาด
   ```

   ขอ snapshot ฉบับเต็มจาก Gateway ที่กำลังรันอยู่ (เฉพาะ WS) ดู [Health](/th/gateway/health)

## เริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก

คำถามและคำตอบสำหรับการรันครั้งแรก ได้แก่ การติดตั้ง การเริ่มใช้งาน เส้นทาง auth การสมัครใช้งาน และความล้มเหลวเริ่มต้น
อยู่ใน [FAQ สำหรับการรันครั้งแรก](/th/help/faq-first-run)

## OpenClaw คืออะไร?

<AccordionGroup>
  <Accordion title="OpenClaw คืออะไรในหนึ่งย่อหน้า?">
    OpenClaw คือผู้ช่วย AI ส่วนตัวที่คุณรันบนอุปกรณ์ของคุณเอง มันตอบกลับบนพื้นผิวการส่งข้อความที่คุณใช้อยู่แล้ว (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat และ channel plugins ที่รวมมา เช่น QQ Bot) และยังทำงานด้วยเสียง + Canvas แบบสดบนแพลตฟอร์มที่รองรับได้ด้วย **Gateway** คือ control plane ที่ทำงานตลอดเวลา ส่วนผู้ช่วยคือผลิตภัณฑ์
  </Accordion>

  <Accordion title="คุณค่าหลัก">
    OpenClaw ไม่ใช่ "แค่ Claude wrapper" มันคือ **control plane แบบ local-first** ที่ให้คุณรัน
    ผู้ช่วยที่มีความสามารถบน **ฮาร์ดแวร์ของคุณเอง** เข้าถึงได้จากแอปแชตที่คุณใช้อยู่แล้ว พร้อม
    sessions ที่มีสถานะ, memory และ tools โดยไม่ต้องส่งการควบคุม workflow ของคุณให้ SaaS
    ที่โฮสต์โดยผู้อื่น

    จุดเด่น:

    - **อุปกรณ์ของคุณ ข้อมูลของคุณ:** รัน Gateway ได้ทุกที่ที่คุณต้องการ (Mac, Linux, VPS) และเก็บ
      workspace + ประวัติ session ไว้ในเครื่อง
    - **channels จริง ไม่ใช่ web sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/ฯลฯ
      รวมถึงเสียงบนมือถือและ Canvas บนแพลตฟอร์มที่รองรับ
    - **ไม่ผูกกับโมเดลใดโมเดลหนึ่ง:** ใช้ Anthropic, OpenAI, MiniMax, OpenRouter ฯลฯ พร้อมการกำหนดเส้นทาง
      และ failover ราย agent
    - **ตัวเลือกเฉพาะในเครื่อง:** รันโมเดลในเครื่องเพื่อให้ **ข้อมูลทั้งหมดอยู่บนอุปกรณ์ของคุณได้** หากต้องการ
    - **การกำหนดเส้นทางหลาย agent:** แยก agent ตาม channel, บัญชี หรืองาน โดยแต่ละตัวมี
      workspace และค่าเริ่มต้นของตนเอง
    - **โอเพนซอร์สและปรับแต่งได้:** ตรวจสอบ ขยาย และ self-host ได้โดยไม่ติด vendor lock-in

    เอกสาร: [Gateway](/th/gateway), [Channels](/th/channels), [หลาย agent](/th/concepts/multi-agent),
    [Memory](/th/concepts/memory)

  </Accordion>

  <Accordion title="ฉันเพิ่งตั้งค่าเสร็จ ควรทำอะไรก่อน?">
    โปรเจกต์เริ่มต้นที่ดี:

    - สร้างเว็บไซต์ (WordPress, Shopify หรือเว็บไซต์ static แบบเรียบง่าย)
    - ทำ prototype แอปมือถือ (โครงร่าง หน้าจอ แผน API)
    - จัดระเบียบไฟล์และโฟลเดอร์ (ล้างข้อมูล ตั้งชื่อ ติดแท็ก)
    - เชื่อมต่อ Gmail และทำสรุปหรือการติดตามผลอัตโนมัติ

    มันจัดการงานขนาดใหญ่ได้ แต่ทำงานได้ดีที่สุดเมื่อคุณแบ่งงานเป็นหลายเฟสและ
    ใช้ sub agents สำหรับงานแบบขนาน

  </Accordion>

  <Accordion title="กรณีใช้งานประจำวัน 5 อันดับแรกของ OpenClaw คืออะไร?">
    งานที่ได้ผลในชีวิตประจำวันมักมีลักษณะเช่น:

    - **สรุปข้อมูลส่วนตัว:** สรุป inbox, ปฏิทิน และข่าวที่คุณสนใจ
    - **ค้นคว้าและร่างเนื้อหา:** ค้นคว้าอย่างรวดเร็ว สรุป และร่างฉบับแรกสำหรับอีเมลหรือเอกสาร
    - **เตือนความจำและติดตามผล:** การเตือนและ checklist ที่ขับเคลื่อนด้วย cron หรือ heartbeat
    - **ระบบอัตโนมัติบนเบราว์เซอร์:** กรอกฟอร์ม เก็บข้อมูล และทำงานเว็บซ้ำ ๆ
    - **ประสานงานข้ามอุปกรณ์:** ส่งงานจากโทรศัพท์ ให้ Gateway รันบน server แล้วรับผลลัพธ์กลับในแชต

  </Accordion>

  <Accordion title="OpenClaw ช่วยเรื่อง lead gen, outreach, ads และ blogs สำหรับ SaaS ได้ไหม?">
    ได้สำหรับ **การค้นคว้า การคัดกรอง และการร่าง** มันสามารถสแกนไซต์ สร้าง shortlist
    สรุป prospect และเขียน outreach หรือร่าง ad copy ได้

    สำหรับ **การ outreach หรือการรันโฆษณา** ให้มีมนุษย์อยู่ใน loop หลีกเลี่ยง spam ปฏิบัติตามกฎหมายท้องถิ่นและ
    นโยบายแพลตฟอร์ม และตรวจทานทุกอย่างก่อนส่ง รูปแบบที่ปลอดภัยที่สุดคือให้
    OpenClaw ร่าง แล้วคุณอนุมัติ

    เอกสาร: [Security](/th/gateway/security)

  </Accordion>

  <Accordion title="ข้อได้เปรียบเมื่อเทียบกับ Claude Code สำหรับการพัฒนาเว็บคืออะไร?">
    OpenClaw คือ **ผู้ช่วยส่วนตัว** และชั้นประสานงาน ไม่ใช่ตัวแทน IDE ใช้
    Claude Code หรือ Codex สำหรับ loop การเขียนโค้ดโดยตรงที่เร็วที่สุดภายใน repo ใช้ OpenClaw เมื่อคุณ
    ต้องการ memory ที่คงอยู่ การเข้าถึงข้ามอุปกรณ์ และการประสาน tools

    ข้อได้เปรียบ:

    - **memory + workspace แบบคงอยู่** ข้าม sessions
    - **การเข้าถึงหลายแพลตฟอร์ม** (WhatsApp, Telegram, TUI, WebChat)
    - **การประสาน tools** (เบราว์เซอร์ ไฟล์ การตั้งเวลา hooks)
    - **Gateway ที่ทำงานตลอดเวลา** (รันบน VPS โต้ตอบจากที่ไหนก็ได้)
    - **Nodes** สำหรับเบราว์เซอร์/หน้าจอ/กล้อง/exec ในเครื่อง

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills และระบบอัตโนมัติ

<AccordionGroup>
  <Accordion title="ฉันจะปรับแต่ง skills โดยไม่ทำให้ repo สกปรกได้อย่างไร?">
    ใช้ managed overrides แทนการแก้ไขสำเนาใน repo ใส่การเปลี่ยนแปลงของคุณไว้ที่ `~/.openclaw/skills/<name>/SKILL.md` (หรือเพิ่มโฟลเดอร์ผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json`) ลำดับความสำคัญคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` ดังนั้น managed overrides ยังชนะ skills ที่ bundled มาโดยไม่แตะ git หากคุณต้องติดตั้ง skill แบบ global แต่ต้องการให้เห็นเฉพาะบาง agents ให้เก็บสำเนาที่แชร์ไว้ใน `~/.openclaw/skills` แล้วควบคุมการมองเห็นด้วย `agents.defaults.skills` และ `agents.list[].skills` เฉพาะการแก้ไขที่ควรส่ง upstream เท่านั้นที่ควรอยู่ใน repo และส่งออกเป็น PRs
  </Accordion>

  <Accordion title="ฉันโหลด skills จากโฟลเดอร์กำหนดเองได้ไหม?">
    ได้ เพิ่มไดเรกทอรีเพิ่มเติมผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json` (ความสำคัญต่ำสุด) ลำดับความสำคัญเริ่มต้นคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` `clawhub` ติดตั้งลงใน `./skills` โดยค่าเริ่มต้น ซึ่ง OpenClaw ถือว่าเป็น `<workspace>/skills` ใน session ถัดไป หาก skill ควรมองเห็นได้เฉพาะบาง agents ให้จับคู่กับ `agents.defaults.skills` หรือ `agents.list[].skills`
  </Accordion>

  <Accordion title="ฉันจะใช้โมเดลต่างกันสำหรับงานต่าง ๆ ได้อย่างไร?">
    รูปแบบที่รองรับในตอนนี้คือ:

    - **Cron jobs**: งานแยกอิสระสามารถตั้งค่า override `model` ต่อ job ได้
    - **Sub-agents**: กำหนดเส้นทางงานไปยัง agents แยกที่มีโมเดลเริ่มต้นต่างกัน
    - **สลับตามต้องการ**: ใช้ `/model` เพื่อสลับโมเดลของ session ปัจจุบันได้ทุกเมื่อ

    ดู [Cron jobs](/th/automation/cron-jobs), [การกำหนดเส้นทางหลาย Agent](/th/concepts/multi-agent) และ [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="bot ค้างระหว่างทำงานหนัก ฉันจะย้ายงานออกไปทำที่อื่นได้อย่างไร?">
    ใช้ **sub-agents** สำหรับงานยาวหรืองานแบบขนาน Sub-agents รันใน session ของตนเอง
    ส่งคืนสรุป และทำให้แชตหลักของคุณยังตอบสนองได้

    ขอให้ bot ของคุณ "spawn a sub-agent for this task" หรือใช้ `/subagents`
    ใช้ `/status` ในแชตเพื่อดูว่า Gateway กำลังทำอะไรอยู่ตอนนี้ (และยุ่งอยู่หรือไม่)

    เคล็ดลับเรื่องโทเค็น: งานยาวและ sub-agents ต่างก็ใช้โทเค็น หากกังวลเรื่องค่าใช้จ่าย ให้ตั้ง
    โมเดลที่ถูกกว่าสำหรับ sub-agents ผ่าน `agents.defaults.subagents.model`

    เอกสาร: [Sub-agents](/th/tools/subagents), [Background Tasks](/th/automation/tasks)

  </Accordion>

  <Accordion title="sessions ของ subagent ที่ผูกกับ thread ทำงานอย่างไรบน Discord?">
    ใช้ thread bindings คุณสามารถผูก Discord thread เข้ากับ subagent หรือ session target เพื่อให้ข้อความ follow-up ใน thread นั้นยังคงอยู่ใน session ที่ผูกไว้

    ขั้นตอนพื้นฐาน:

    - Spawn ด้วย `sessions_spawn` โดยใช้ `thread: true` (และเลือกใช้ `mode: "session"` สำหรับ follow-up แบบคงอยู่)
    - หรือผูกด้วยตนเองผ่าน `/focus <target>`
    - ใช้ `/agents` เพื่อตรวจสอบสถานะ binding
    - ใช้ `/session idle <duration|off>` และ `/session max-age <duration|off>` เพื่อควบคุม auto-unfocus
    - ใช้ `/unfocus` เพื่อแยก thread ออก

    คอนฟิกที่ต้องมี:

    - ค่าเริ่มต้น global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
    - overrides ของ Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`
    - ผูกอัตโนมัติเมื่อ spawn: `channels.discord.threadBindings.spawnSessions` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เพื่อปิดการ spawn session ที่ผูกกับ thread

    เอกสาร: [Sub-agents](/th/tools/subagents), [Discord](/th/channels/discord), [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference), [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="subagent เสร็จแล้ว แต่ completion update ไปผิดที่หรือไม่เคยโพสต์ ฉันควรตรวจอะไร?">
    ตรวจ requester route ที่ resolve แล้วก่อน:

    - การส่ง subagent แบบ completion-mode จะเลือก bound thread หรือ conversation route หากมีอยู่
    - หาก completion origin มีเพียง channel, OpenClaw จะถอยกลับไปใช้ route ที่เก็บไว้ใน requester session (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้ direct delivery ยังสำเร็จได้
    - หากไม่มีทั้ง bound route และ stored route ที่ใช้ได้ direct delivery อาจล้มเหลว และผลลัพธ์จะถอยกลับไปเป็น queued session delivery แทนการโพสต์ลงแชตทันที
    - target ที่ไม่ถูกต้องหรือล้าสมัยยังอาจบังคับให้ fallback ไป queue หรือทำให้การส่งขั้นสุดท้ายล้มเหลวได้
    - หากคำตอบ assistant ล่าสุดที่มองเห็นได้ของ child เป็น silent token ตรงตัว `NO_REPLY` / `no_reply` หรือเป็น `ANNOUNCE_SKIP` ตรงตัว OpenClaw จะตั้งใจระงับ announce แทนการโพสต์ progress เก่าก่อนหน้า
    - หาก child timeout หลังจากมีเพียง tool calls, announce อาจย่อให้เป็นสรุป partial-progress สั้น ๆ แทนการ replay raw tool output

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [Sub-agents](/th/tools/subagents), [Background Tasks](/th/automation/tasks), [Session Tools](/th/concepts/session-tool)

  </Accordion>

  <Accordion title="Cron หรือ reminders ไม่ทำงาน ฉันควรตรวจอะไร?">
    Cron รันอยู่ภายใน process ของ Gateway หาก Gateway ไม่ได้รันต่อเนื่อง
    scheduled jobs จะไม่รัน

    Checklist:

    - ยืนยันว่าเปิดใช้ cron (`cron.enabled`) และไม่ได้ตั้ง `OPENCLAW_SKIP_CRON`
    - ตรวจว่า Gateway รันอยู่ตลอด 24/7 (ไม่มี sleep/restarts)
    - ตรวจสอบการตั้งค่า timezone สำหรับ job (`--tz` เทียบกับ timezone ของ host)

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    เอกสาร: [Cron jobs](/th/automation/cron-jobs), [ระบบอัตโนมัติและ Tasks](/th/automation)

  </Accordion>

  <Accordion title="Cron ทำงานแล้ว แต่ไม่มีอะไรถูกส่งไปยังช่อง ทำไม?">
    ตรวจสอบโหมดการส่งก่อน:

    - `--no-deliver` / `delivery.mode: "none"` หมายความว่าไม่ควรมีการส่งสำรองจาก runner
    - เป้าหมายประกาศที่หายไปหรือไม่ถูกต้อง (`channel` / `to`) หมายความว่า runner ข้ามการส่งออก
    - ความล้มเหลวด้านการยืนยันตัวตนของช่อง (`unauthorized`, `Forbidden`) หมายความว่า runner พยายามส่งแล้ว แต่ข้อมูลประจำตัวบล็อกไว้
    - ผลลัพธ์แบบ isolated ที่เงียบ (`NO_REPLY` / `no_reply` เท่านั้น) จะถือว่าตั้งใจให้ส่งไม่ได้ ดังนั้น runner จึงระงับการส่งสำรองที่อยู่ในคิวด้วย

    สำหรับงาน Cron แบบ isolated เอเจนต์ยังสามารถส่งโดยตรงด้วยเครื่องมือ `message`
    ได้เมื่อมีเส้นทางแชต `--announce` ควบคุมเฉพาะเส้นทางสำรองของ runner
    สำหรับข้อความสุดท้ายที่เอเจนต์ยังไม่ได้ส่งเอง

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [งานเบื้องหลัง](/th/automation/tasks).

  </Accordion>

  <Accordion title="ทำไมการรัน Cron แบบ isolated จึงเปลี่ยนโมเดลหรือลองใหม่หนึ่งครั้ง?">
    โดยปกติแล้วนี่คือเส้นทางการสลับโมเดลแบบสด ไม่ใช่การกำหนดเวลาซ้ำ

    Cron แบบ isolated สามารถคงการส่งต่อโมเดลขณะรันไทม์และลองใหม่เมื่อการรันที่ใช้งานอยู่
    โยน `LiveSessionModelSwitchError` การลองใหม่จะเก็บผู้ให้บริการ/โมเดลที่สลับแล้วไว้
    และถ้าการสลับมีการแทนที่โปรไฟล์การยืนยันตัวตนใหม่ Cron
    จะคงค่านั้นไว้ด้วยก่อนลองใหม่

    กฎการเลือกที่เกี่ยวข้อง:

    - การแทนที่โมเดลของ hook Gmail จะชนะก่อนเมื่อใช้ได้
    - จากนั้นเป็น `model` ต่อแต่ละงาน
    - จากนั้นเป็นการแทนที่โมเดลของเซสชัน Cron ที่เก็บไว้
    - จากนั้นเป็นการเลือกโมเดลของเอเจนต์/ค่าเริ่มต้นตามปกติ

    ลูปการลองใหม่มีขอบเขต หลังจากความพยายามแรกบวกกับการลองใหม่จากการสลับ 2 ครั้ง
    Cron จะยกเลิกแทนที่จะวนตลอดไป

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [CLI ของ Cron](/th/cli/cron).

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง Skills บน Linux ได้อย่างไร?">
    ใช้คำสั่ง `openclaw skills` แบบเนทีฟ หรือวาง Skills ลงในเวิร์กสเปซของคุณ UI ของ Skills บน macOS ไม่พร้อมใช้งานบน Linux
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
    ของเวิร์กสเปซที่ใช้งานอยู่ ติดตั้ง CLI `clawhub` แยกต่างหากเฉพาะเมื่อคุณต้องการเผยแพร่หรือ
    ซิงก์ Skills ของคุณเอง สำหรับการติดตั้งร่วมกันข้ามเอเจนต์ ให้วาง Skill ไว้ใต้
    `~/.openclaw/skills` และใช้ `agents.defaults.skills` หรือ
    `agents.list[].skills` หากคุณต้องการจำกัดว่าเอเจนต์ใดเห็นได้บ้าง

  </Accordion>

  <Accordion title="OpenClaw สามารถรันงานตามกำหนดเวลาหรือทำงานต่อเนื่องในเบื้องหลังได้หรือไม่?">
    ได้ ใช้ตัวกำหนดเวลาของ Gateway:

    - **งาน Cron** สำหรับงานตามกำหนดเวลาหรืองานที่เกิดซ้ำ (คงอยู่ข้ามการรีสตาร์ต)
    - **Heartbeat** สำหรับการตรวจสอบเป็นระยะของ "เซสชันหลัก"
    - **งาน isolated** สำหรับเอเจนต์อัตโนมัติที่โพสต์สรุปหรือส่งไปยังแชต

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [ระบบอัตโนมัติและงาน](/th/automation),
    [Heartbeat](/th/gateway/heartbeat).

  </Accordion>

  <Accordion title="ฉันสามารถรัน Skills เฉพาะ Apple macOS จาก Linux ได้หรือไม่?">
    ไม่ได้โดยตรง Skills ของ macOS ถูกจำกัดด้วย `metadata.openclaw.os` รวมถึงไบนารีที่ต้องใช้ และ Skills จะปรากฏในพรอมป์ต์ระบบเฉพาะเมื่อมีสิทธิ์บน **โฮสต์ Gateway** เท่านั้น บน Linux Skills ที่เป็น `darwin` เท่านั้น (เช่น `apple-notes`, `apple-reminders`, `things-mac`) จะไม่โหลด เว้นแต่คุณจะแทนที่การจำกัดนี้

    คุณมีรูปแบบที่รองรับสามแบบ:

    **ตัวเลือก A - รัน Gateway บน Mac (ง่ายที่สุด).**
    รัน Gateway ในที่ที่มีไบนารีของ macOS อยู่ จากนั้นเชื่อมต่อจาก Linux ใน[โหมดรีโมต](#gateway-ports-already-running-and-remote-mode) หรือผ่าน Tailscale Skills จะโหลดตามปกติเพราะโฮสต์ Gateway เป็น macOS

    **ตัวเลือก B - ใช้ Node macOS (ไม่มี SSH).**
    รัน Gateway บน Linux จับคู่ Node macOS (แอปแถบเมนู) และตั้งค่า **Node Run Commands** เป็น "Always Ask" หรือ "Always Allow" บน Mac OpenClaw สามารถถือว่า Skills เฉพาะ macOS มีสิทธิ์เมื่อไบนารีที่ต้องใช้มีอยู่บน Node เอเจนต์จะรัน Skills เหล่านั้นผ่านเครื่องมือ `nodes` หากคุณเลือก "Always Ask" การอนุมัติ "Always Allow" ในพรอมป์ต์จะเพิ่มคำสั่งนั้นลงใน allowlist

    **ตัวเลือก C - พร็อกซีไบนารีของ macOS ผ่าน SSH (ขั้นสูง).**
    ให้ Gateway อยู่บน Linux ต่อไป แต่ทำให้ไบนารี CLI ที่ต้องใช้ถูก resolve เป็น wrapper SSH ที่รันบน Mac จากนั้นแทนที่ Skill เพื่ออนุญาต Linux เพื่อให้ยังคงมีสิทธิ์

    1. สร้าง wrapper SSH สำหรับไบนารี (ตัวอย่าง: `memo` สำหรับ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. วาง wrapper ไว้บน `PATH` บนโฮสต์ Linux (เช่น `~/bin/memo`)
    3. แทนที่ metadata ของ Skill (ในเวิร์กสเปซหรือ `~/.openclaw/skills`) เพื่ออนุญาต Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. เริ่มเซสชันใหม่เพื่อให้สแนปช็อต Skills รีเฟรช

  </Accordion>

  <Accordion title="มีการผสานรวม Notion หรือ HeyGen หรือไม่?">
    วันนี้ยังไม่มีในตัว

    ตัวเลือก:

    - **Skill / Plugin แบบกำหนดเอง:** ดีที่สุดสำหรับการเข้าถึง API ที่เชื่อถือได้ (ทั้ง Notion/HeyGen มี API)
    - **ระบบอัตโนมัติของเบราว์เซอร์:** ใช้ได้โดยไม่ต้องเขียนโค้ด แต่ช้ากว่าและเปราะบางกว่า

    หากคุณต้องการเก็บบริบทต่อไคลเอนต์ (เวิร์กโฟลว์เอเจนซี) รูปแบบง่ายๆ คือ:

    - หนึ่งหน้า Notion ต่อหนึ่งไคลเอนต์ (บริบท + การตั้งค่า + งานที่กำลังทำ)
    - ขอให้เอเจนต์ดึงหน้านั้นเมื่อเริ่มเซสชัน

    หากคุณต้องการการผสานรวมแบบเนทีฟ ให้เปิดคำขอฟีเจอร์หรือสร้าง Skill
    ที่ใช้ API เหล่านั้น

    ติดตั้ง Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    การติดตั้งแบบเนทีฟจะอยู่ในไดเรกทอรี `skills/` ของเวิร์กสเปซที่ใช้งานอยู่ สำหรับ Skills ที่ใช้ร่วมกันข้ามเอเจนต์ ให้วางไว้ใน `~/.openclaw/skills/<name>/SKILL.md` หากควรให้เอเจนต์บางตัวเท่านั้นเห็นการติดตั้งร่วมกัน ให้กำหนดค่า `agents.defaults.skills` หรือ `agents.list[].skills` Skills บางรายการคาดหวังไบนารีที่ติดตั้งผ่าน Homebrew; บน Linux หมายถึง Linuxbrew (ดูรายการ FAQ ของ Homebrew Linux ด้านบน) ดู [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config), และ [ClawHub](/th/tools/clawhub).

  </Accordion>

  <Accordion title="ฉันจะใช้ Chrome ที่ลงชื่อเข้าใช้อยู่แล้วกับ OpenClaw ได้อย่างไร?">
    ใช้โปรไฟล์เบราว์เซอร์ `user` ในตัว ซึ่งแนบผ่าน Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    หากคุณต้องการชื่อแบบกำหนดเอง ให้สร้างโปรไฟล์ MCP แบบชัดเจน:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    เส้นทางนี้สามารถใช้เบราว์เซอร์ของโฮสต์ local หรือ Node เบราว์เซอร์ที่เชื่อมต่ออยู่ได้ หาก Gateway รันอยู่ที่อื่น ให้รันโฮสต์ Node บนเครื่องเบราว์เซอร์ หรือใช้ CDP ระยะไกลแทน

    ข้อจำกัดปัจจุบันของ `existing-session` / `user`:

    - การกระทำอ้างอิงด้วย ref ไม่ได้ขับเคลื่อนด้วย CSS-selector
    - การอัปโหลดต้องใช้ `ref` / `inputRef` และปัจจุบันรองรับครั้งละหนึ่งไฟล์
    - `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการกระทำแบบ batch ยังต้องใช้เบราว์เซอร์ที่จัดการแล้วหรือโปรไฟล์ CDP ดิบ

  </Accordion>
</AccordionGroup>

## แซนด์บ็อกซ์และหน่วยความจำ

<AccordionGroup>
  <Accordion title="มีเอกสารเฉพาะสำหรับแซนด์บ็อกซ์หรือไม่?">
    มี ดู [แซนด์บ็อกซ์](/th/gateway/sandboxing) สำหรับการตั้งค่าเฉพาะ Docker (Gateway เต็มรูปแบบใน Docker หรืออิมเมจแซนด์บ็อกซ์) ดู [Docker](/th/install/docker).
  </Accordion>

  <Accordion title="Docker ดูเหมือนมีข้อจำกัด - ฉันจะเปิดใช้ฟีเจอร์เต็มรูปแบบได้อย่างไร?">
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยก่อนและรันเป็นผู้ใช้ `node` ดังนั้นจึงไม่มี
    แพ็กเกจระบบ, Homebrew, หรือเบราว์เซอร์ที่รวมมาให้ สำหรับการตั้งค่าที่ครบถ้วนกว่า:

    - คง `/home/node` ด้วย `OPENCLAW_HOME_VOLUME` เพื่อให้แคชยังอยู่
    - ใส่ dependencies ของระบบเข้าไปในอิมเมจด้วย `OPENCLAW_DOCKER_APT_PACKAGES`
    - ติดตั้งเบราว์เซอร์ Playwright ผ่าน CLI ที่รวมมาให้:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` และตรวจสอบให้แน่ใจว่า path นั้นถูกคงไว้

    เอกสาร: [Docker](/th/install/docker), [เบราว์เซอร์](/th/tools/browser).

  </Accordion>

  <Accordion title="ฉันสามารถทำให้ DM เป็นส่วนตัว แต่ให้กลุ่มเป็นสาธารณะ/อยู่ในแซนด์บ็อกซ์ด้วยเอเจนต์เดียวได้หรือไม่?">
    ได้ - หากทราฟฟิกส่วนตัวของคุณคือ **DMs** และทราฟฟิกสาธารณะของคุณคือ **กลุ่ม**

    ใช้ `agents.defaults.sandbox.mode: "non-main"` เพื่อให้เซสชันกลุ่ม/ช่อง (คีย์ที่ไม่ใช่ main) รันใน backend แซนด์บ็อกซ์ที่กำหนดค่าไว้ ขณะที่เซสชัน DM หลักยังอยู่บนโฮสต์ Docker คือ backend เริ่มต้นหากคุณไม่ได้เลือกอย่างอื่น จากนั้นจำกัดว่าเครื่องมือใดพร้อมใช้งานในเซสชันแซนด์บ็อกซ์ผ่าน `tools.sandbox.tools`

    คำแนะนำการตั้งค่า + ตัวอย่าง config: [กลุ่ม: DM ส่วนตัว + กลุ่มสาธารณะ](/th/channels/groups#pattern-personal-dms-public-groups-single-agent)

    อ้างอิง config สำคัญ: [การกำหนดค่า Gateway](/th/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ฉันจะ bind โฟลเดอร์ของโฮสต์เข้าไปในแซนด์บ็อกซ์ได้อย่างไร?">
    ตั้งค่า `agents.defaults.sandbox.docker.binds` เป็น `["host:path:mode"]` (เช่น `"/home/user/src:/src:ro"`) bind ระดับ global + ต่อเอเจนต์จะ merge กัน; bind ต่อเอเจนต์จะถูกละเว้นเมื่อ `scope: "shared"` ใช้ `:ro` สำหรับสิ่งที่ละเอียดอ่อน และจำไว้ว่า bind จะข้ามกำแพงระบบไฟล์ของแซนด์บ็อกซ์

    OpenClaw ตรวจสอบแหล่งที่มาของ bind เทียบกับทั้ง path ที่ normalize แล้วและ path ตามจริงที่ resolve ผ่าน ancestor ที่ลึกที่สุดซึ่งมีอยู่ นั่นหมายความว่าการ escape ผ่าน symlink-parent ยังคง fail closed แม้ segment สุดท้ายของ path จะยังไม่มีอยู่ และการตรวจ allowed-root ยังคงใช้หลังการ resolve symlink

    ดู [แซนด์บ็อกซ์](/th/gateway/sandboxing#custom-bind-mounts) และ [แซนด์บ็อกซ์เทียบกับนโยบายเครื่องมือเทียบกับสิทธิ์ยกระดับ](/th/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) สำหรับตัวอย่างและหมายเหตุด้านความปลอดภัย

  </Accordion>

  <Accordion title="หน่วยความจำทำงานอย่างไร?">
    หน่วยความจำของ OpenClaw เป็นเพียงไฟล์ Markdown ในเวิร์กสเปซของเอเจนต์:

    - บันทึกรายวันใน `memory/YYYY-MM-DD.md`
    - บันทึกระยะยาวที่คัดสรรใน `MEMORY.md` (เฉพาะเซสชันหลัก/ส่วนตัว)

    OpenClaw ยังรัน **การ flush หน่วยความจำก่อน Compaction แบบเงียบ** เพื่อเตือนโมเดล
    ให้เขียนบันทึกที่คงทนก่อนการทำ auto-compaction สิ่งนี้จะรันเฉพาะเมื่อเวิร์กสเปซ
    เขียนได้เท่านั้น (แซนด์บ็อกซ์แบบอ่านอย่างเดียวจะข้าม) ดู [หน่วยความจำ](/th/concepts/memory).

  </Accordion>

  <Accordion title="หน่วยความจำลืมสิ่งต่างๆ อยู่เรื่อยๆ ฉันจะทำให้จำได้อย่างไร?">
    ขอให้บอท **เขียนข้อเท็จจริงลงในหน่วยความจำ** บันทึกระยะยาวควรอยู่ใน `MEMORY.md`,
    บริบทระยะสั้นไปอยู่ใน `memory/YYYY-MM-DD.md`

    นี่ยังเป็นพื้นที่ที่เรากำลังปรับปรุงอยู่ การเตือนโมเดลให้จัดเก็บความทรงจำช่วยได้;
    โมเดลจะรู้ว่าต้องทำอะไร หากยังลืมอยู่ ให้ตรวจสอบว่า Gateway ใช้เวิร์กสเปซเดียวกัน
    ในทุกการรัน

    เอกสาร: [หน่วยความจำ](/th/concepts/memory), [เวิร์กสเปซของเอเจนต์](/th/concepts/agent-workspace).

  </Accordion>

  <Accordion title="หน่วยความจำคงอยู่ตลอดไปหรือไม่? มีขีดจำกัดอะไรบ้าง?">
    ไฟล์หน่วยความจำอยู่บนดิสก์และคงอยู่จนกว่าคุณจะลบ ขีดจำกัดคือ
    พื้นที่จัดเก็บของคุณ ไม่ใช่โมเดล **บริบทเซสชัน** ยังถูกจำกัดด้วยหน้าต่างบริบทของโมเดล
    ดังนั้นการสนทนายาวๆ อาจถูก compact หรือ truncate นี่คือเหตุผลที่
    การค้นหาหน่วยความจำมีอยู่ - มันดึงเฉพาะส่วนที่เกี่ยวข้องกลับเข้าสู่บริบท

    เอกสาร: [หน่วยความจำ](/th/concepts/memory), [บริบท](/th/concepts/context).

  </Accordion>

  <Accordion title="การค้นหาหน่วยความจำเชิงความหมายต้องใช้คีย์ OpenAI API หรือไม่?">
    ต้องใช้เฉพาะเมื่อคุณใช้ **OpenAI embeddings** เท่านั้น Codex OAuth ครอบคลุมแชต/การเติมข้อความให้สมบูรณ์ และ
    **ไม่ได้** ให้สิทธิ์เข้าถึง embeddings ดังนั้น **การลงชื่อเข้าใช้ด้วย Codex (OAuth หรือ
    การเข้าสู่ระบบ Codex CLI)** จึงไม่ช่วยสำหรับการค้นหาหน่วยความจำเชิงความหมาย OpenAI embeddings
    ยังต้องใช้คีย์ API จริง (`OPENAI_API_KEY` หรือ `models.providers.openai.apiKey`)

    หากคุณไม่ได้ตั้งค่า provider อย่างชัดเจน OpenClaw จะเลือก provider อัตโนมัติเมื่อ
    สามารถหา API key ได้ (โปรไฟล์ auth, `models.providers.*.apiKey` หรือ env vars)
    ระบบจะเลือก OpenAI ก่อนหากหา OpenAI key ได้ มิฉะนั้นจะเลือก Gemini หากหา Gemini key
    ได้ จากนั้น Voyage แล้วจึง Mistral หากไม่มีคีย์ระยะไกลที่ใช้ได้ การค้นหา
    หน่วยความจำจะยังคงถูกปิดใช้งานจนกว่าคุณจะกำหนดค่า หากคุณมีเส้นทางโมเดล local
    ที่กำหนดค่าไว้และมีอยู่จริง OpenClaw
    จะเลือก `local` ก่อน Ollama รองรับเมื่อคุณตั้งค่า
    `memorySearch.provider = "ollama"` อย่างชัดเจน

    หากคุณต้องการใช้งานในเครื่อง ให้ตั้งค่า `memorySearch.provider = "local"` (และตั้งค่าเพิ่มเติมได้ที่
    `memorySearch.fallback = "none"`) หากคุณต้องการ Gemini embeddings ให้ตั้งค่า
    `memorySearch.provider = "gemini"` และระบุ `GEMINI_API_KEY` (หรือ
    `memorySearch.remote.apiKey`) เรารองรับโมเดล embedding แบบ **OpenAI, Gemini, Voyage, Mistral, Ollama หรือ local**
    - ดูรายละเอียดการตั้งค่าได้ที่ [หน่วยความจำ](/th/concepts/memory)

  </Accordion>
</AccordionGroup>

## สิ่งต่าง ๆ อยู่ที่ใดบนดิสก์

<AccordionGroup>
  <Accordion title="ข้อมูลทั้งหมดที่ใช้กับ OpenClaw ถูกบันทึกไว้ในเครื่องหรือไม่?">
    ไม่ใช่ - **สถานะของ OpenClaw อยู่ในเครื่อง** แต่ **บริการภายนอกยังคงเห็นสิ่งที่คุณส่งให้บริการเหล่านั้น**

    - **อยู่ในเครื่องโดยค่าเริ่มต้น:** เซสชัน ไฟล์หน่วยความจำ คอนฟิก และ workspace อยู่บนโฮสต์ Gateway
      (`~/.openclaw` + ไดเรกทอรี workspace ของคุณ)
    - **อยู่ระยะไกลตามความจำเป็น:** ข้อความที่คุณส่งไปยัง model providers (Anthropic/OpenAI/ฯลฯ) จะไปยัง
      API ของผู้ให้บริการเหล่านั้น และแพลตฟอร์มแชต (WhatsApp/Telegram/Slack/ฯลฯ) จะจัดเก็บข้อมูลข้อความไว้บน
      เซิร์ฟเวอร์ของตน
    - **คุณควบคุมร่องรอยข้อมูลได้:** การใช้โมเดล local จะเก็บ prompts ไว้บนเครื่องของคุณ แต่ทราฟฟิกของ channel
      ยังคงผ่านเซิร์ฟเวอร์ของ channel นั้น

    ที่เกี่ยวข้อง: [Agent workspace](/th/concepts/agent-workspace), [หน่วยความจำ](/th/concepts/memory)

  </Accordion>

  <Accordion title="OpenClaw จัดเก็บข้อมูลไว้ที่ใด?">
    ทุกอย่างอยู่ภายใต้ `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`):

    | Path                                                            | วัตถุประสงค์                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | คอนฟิกหลัก (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | การนำเข้า OAuth แบบเดิม (คัดลอกเข้าสู่โปรไฟล์ auth เมื่อใช้ครั้งแรก)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | โปรไฟล์ auth (OAuth, API keys และ `keyRef`/`tokenRef` ที่ไม่บังคับ)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | payload secret ที่สำรองด้วยไฟล์ซึ่งไม่บังคับ สำหรับ SecretRef providers แบบ `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ไฟล์ความเข้ากันได้แบบเดิม (ล้างรายการ `api_key` แบบคงที่แล้ว)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | สถานะ provider (เช่น `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | สถานะราย agent (agentDir + เซสชัน)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | ประวัติและสถานะการสนทนา (ต่อ agent)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | เมทาดาทาของเซสชัน (ต่อ agent)                                       |

    เส้นทางแบบ agent เดียวเดิม: `~/.openclaw/agent/*` (ย้ายข้อมูลโดย `openclaw doctor`)

    **workspace** ของคุณ (AGENTS.md, ไฟล์หน่วยความจำ, skills, ฯลฯ) แยกต่างหากและกำหนดค่าผ่าน `agents.defaults.workspace` (ค่าเริ่มต้น: `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md ควรอยู่ที่ใด?">
    ไฟล์เหล่านี้อยู่ใน **agent workspace** ไม่ใช่ `~/.openclaw`

    - **Workspace (ต่อ agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` ที่ไม่บังคับ
      `memory.md` ตัวพิมพ์เล็กที่ root เป็นเพียงอินพุตซ่อมแซมแบบเดิมเท่านั้น; `openclaw doctor --fix`
      สามารถรวมไฟล์นั้นเข้า `MEMORY.md` ได้เมื่อมีทั้งสองไฟล์
    - **State dir (`~/.openclaw`)**: คอนฟิก สถานะ channel/provider โปรไฟล์ auth เซสชัน บันทึก
      และ skills ที่ใช้ร่วมกัน (`~/.openclaw/skills`)

    Workspace เริ่มต้นคือ `~/.openclaw/workspace` กำหนดค่าได้ผ่าน:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    หากบอต "ลืม" หลังรีสตาร์ต ให้ยืนยันว่า Gateway ใช้
    workspace เดียวกันทุกครั้งที่เปิดใช้งาน (และจำไว้ว่า: โหมดระยะไกลใช้ **workspace ของโฮสต์ gateway**
    ไม่ใช่แล็ปท็อป local ของคุณ)

    เคล็ดลับ: หากคุณต้องการพฤติกรรมหรือการตั้งค่าที่คงทน ให้ขอให้บอต **เขียนลงใน
    AGENTS.md หรือ MEMORY.md** แทนการพึ่งพาประวัติแชต

    ดู [Agent workspace](/th/concepts/agent-workspace) และ [หน่วยความจำ](/th/concepts/memory)

  </Accordion>

  <Accordion title="กลยุทธ์สำรองข้อมูลที่แนะนำ">
    ใส่ **agent workspace** ของคุณไว้ใน repo git แบบ **ส่วนตัว** และสำรองไว้ในที่
    ส่วนตัว (เช่น GitHub private) วิธีนี้จะเก็บหน่วยความจำ + ไฟล์ AGENTS/SOUL/USER
    และช่วยให้คุณกู้คืน "จิตใจ" ของผู้ช่วยได้ภายหลัง

    **อย่า** commit สิ่งใดภายใต้ `~/.openclaw` (credentials, เซสชัน, tokens หรือ payloads secrets ที่เข้ารหัส)
    หากคุณต้องการกู้คืนเต็มรูปแบบ ให้สำรองทั้ง workspace และ state directory
    แยกกัน (ดูคำถามเรื่องการย้ายข้อมูลด้านบน)

    เอกสาร: [Agent workspace](/th/concepts/agent-workspace)

  </Accordion>

  <Accordion title="ฉันจะถอนการติดตั้ง OpenClaw อย่างสมบูรณ์ได้อย่างไร?">
    ดูคู่มือเฉพาะ: [ถอนการติดตั้ง](/th/install/uninstall)
  </Accordion>

  <Accordion title="Agents สามารถทำงานนอก workspace ได้หรือไม่?">
    ได้ Workspace คือ **default cwd** และจุดยึดหน่วยความจำ ไม่ใช่ sandbox แบบแข็ง
    เส้นทางแบบ relative จะ resolve ภายใน workspace แต่เส้นทางแบบ absolute สามารถเข้าถึงตำแหน่งอื่นบน
    โฮสต์ได้ เว้นแต่จะเปิดใช้งาน sandboxing หากคุณต้องการแยกสภาพแวดล้อม ให้ใช้
    [`agents.defaults.sandbox`](/th/gateway/sandboxing) หรือการตั้งค่า sandbox ราย agent หากคุณ
    ต้องการให้ repo เป็นไดเรกทอรีทำงานเริ่มต้น ให้ชี้
    `workspace` ของ agent นั้นไปที่ repo root OpenClaw repo เป็นเพียง source code; ให้แยก
    workspace ไว้ต่างหาก เว้นแต่คุณตั้งใจให้ agent ทำงานอยู่ภายในนั้น

    ตัวอย่าง (repo เป็น default cwd):

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

  <Accordion title="โหมดระยะไกล: session store อยู่ที่ใด?">
    สถานะเซสชันเป็นของ **โฮสต์ gateway** หากคุณอยู่ในโหมดระยะไกล session store ที่คุณสนใจอยู่บนเครื่องระยะไกล ไม่ใช่แล็ปท็อป local ของคุณ ดู [การจัดการเซสชัน](/th/concepts/session)
  </Accordion>
</AccordionGroup>

## พื้นฐานคอนฟิก

<AccordionGroup>
  <Accordion title="คอนฟิกอยู่ในรูปแบบใด? อยู่ที่ใด?">
    OpenClaw อ่านคอนฟิก **JSON5** ที่ไม่บังคับจาก `$OPENCLAW_CONFIG_PATH` (ค่าเริ่มต้น: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    หากไฟล์ไม่มีอยู่ ระบบจะใช้ค่าเริ่มต้นที่ค่อนข้างปลอดภัย (รวมถึง workspace เริ่มต้นที่ `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title='ฉันตั้งค่า gateway.bind: "lan" (หรือ "tailnet") แล้วตอนนี้ไม่มีอะไร listen / UI แจ้งว่าไม่ได้รับอนุญาต'>
    การ bind แบบไม่ใช่ loopback **ต้องมีเส้นทาง auth ของ gateway ที่ถูกต้อง** ในทางปฏิบัติหมายถึง:

    - auth แบบ shared-secret: token หรือ password
    - `gateway.auth.mode: "trusted-proxy"` หลัง reverse proxy ที่รับรู้ตัวตนและกำหนดค่าอย่างถูกต้อง

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

    - `gateway.remote.token` / `.password` **ไม่ได้** เปิดใช้งาน auth ของ gateway local ด้วยตัวเอง
    - เส้นทางการเรียก local สามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
    - สำหรับ password auth ให้ตั้งค่า `gateway.auth.mode: "password"` พร้อม `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`) แทน
    - หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าอย่างชัดเจนผ่าน SecretRef และ resolve ไม่ได้ การ resolve จะล้มเหลวแบบปิด (ไม่มี remote fallback มาปิดบัง)
    - การตั้งค่า Control UI แบบ shared-secret จะ authenticate ผ่าน `connect.params.auth.token` หรือ `connect.params.auth.password` (เก็บไว้ในการตั้งค่า app/UI) โหมดที่มีข้อมูลตัวตน เช่น Tailscale Serve หรือ `trusted-proxy` ใช้ request headers แทน หลีกเลี่ยงการใส่ shared secrets ใน URLs
    - เมื่อใช้ `gateway.auth.mode: "trusted-proxy"` reverse proxies แบบ loopback บนโฮสต์เดียวกันต้องมี `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน และมีรายการ loopback ใน `gateway.trustedProxies`

  </Accordion>

  <Accordion title="ทำไมตอนนี้ฉันต้องใช้ token บน localhost?">
    OpenClaw บังคับใช้ auth ของ gateway โดยค่าเริ่มต้น รวมถึง loopback ด้วย ในเส้นทางเริ่มต้นปกติหมายถึง token auth: หากไม่ได้กำหนดเส้นทาง auth อย่างชัดเจน การเริ่มต้น gateway จะ resolve เป็นโหมด token และสร้าง token ให้โดยอัตโนมัติ แล้วบันทึกไว้ที่ `gateway.auth.token` ดังนั้น **ไคลเอนต์ WS local ต้อง authenticate** สิ่งนี้ป้องกันไม่ให้ process local อื่นเรียก Gateway

    หากคุณต้องการเส้นทาง auth แบบอื่น คุณสามารถเลือกโหมด password อย่างชัดเจน (หรือ `trusted-proxy` สำหรับ reverse proxies ที่รับรู้ตัวตน) หากคุณ **ต้องการจริง ๆ** ให้ loopback เปิดอยู่ ให้ตั้งค่า `gateway.auth.mode: "none"` อย่างชัดเจนในคอนฟิกของคุณ Doctor สามารถสร้าง token ให้คุณได้ทุกเมื่อ: `openclaw doctor --generate-gateway-token`

  </Accordion>

  <Accordion title="ฉันต้องรีสตาร์ตหลังเปลี่ยนคอนฟิกหรือไม่?">
    Gateway เฝ้าดูคอนฟิกและรองรับ hot-reload:

    - `gateway.reload.mode: "hybrid"` (ค่าเริ่มต้น): ใช้การเปลี่ยนแปลงที่ปลอดภัยแบบ hot-apply และรีสตาร์ตสำหรับรายการสำคัญ
    - รองรับ `hot`, `restart`, `off` ด้วย

  </Accordion>

  <Accordion title="ฉันจะปิดใช้งาน tagline ตลก ๆ ของ CLI ได้อย่างไร?">
    ตั้งค่า `cli.banner.taglineMode` ในคอนฟิก:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: ซ่อนข้อความ tagline แต่ยังคงบรรทัดชื่อ/เวอร์ชันของ banner ไว้
    - `default`: ใช้ `All your chats, one OpenClaw.` ทุกครั้ง
    - `random`: tagline ตลก/ตามฤดูกาลแบบหมุนเวียน (พฤติกรรมเริ่มต้น)
    - หากคุณไม่ต้องการ banner เลย ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

  </Accordion>

  <Accordion title="ฉันจะเปิดใช้งานการค้นหาเว็บ (และ web fetch) ได้อย่างไร?">
    `web_fetch` ทำงานได้โดยไม่ต้องใช้ API key `web_search` ขึ้นอยู่กับ
    provider ที่คุณเลือก:

    - API-backed providers เช่น Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity และ Tavily ต้องใช้การตั้งค่า API key ตามปกติ
    - Ollama Web Search ไม่ต้องใช้คีย์ แต่ใช้โฮสต์ Ollama ที่คุณกำหนดค่าไว้และต้องใช้ `ollama signin`
    - DuckDuckGo ไม่ต้องใช้คีย์ แต่เป็นการผสานรวมแบบ HTML ที่ไม่เป็นทางการ
    - SearXNG ไม่ต้องใช้คีย์/โฮสต์เองได้; กำหนดค่า `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl`

    **แนะนำ:** เรียกใช้ `openclaw configure --section web` แล้วเลือก provider
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

    ตอนนี้การตั้งค่า web-search เฉพาะผู้ให้บริการอยู่ภายใต้ `plugins.entries.<plugin>.config.webSearch.*`
    พาธผู้ให้บริการแบบเดิม `tools.web.search.*` ยังโหลดได้ชั่วคราวเพื่อความเข้ากันได้ แต่ไม่ควรใช้กับการตั้งค่าใหม่
    การตั้งค่า fallback สำหรับ web-fetch ของ Firecrawl อยู่ภายใต้ `plugins.entries.firecrawl.config.webFetch.*`

    หมายเหตุ:

    - หากคุณใช้ allowlists ให้เพิ่ม `web_search`/`web_fetch`/`x_search` หรือ `group:web`
    - `web_fetch` เปิดใช้งานตามค่าเริ่มต้น (เว้นแต่จะปิดใช้งานอย่างชัดเจน)
    - หากละเว้น `tools.web.fetch.provider` OpenClaw จะตรวจหาผู้ให้บริการ fallback สำหรับ fetch รายแรกที่พร้อมใช้งานจาก credentials ที่มีโดยอัตโนมัติ ปัจจุบันผู้ให้บริการที่รวมมาคือ Firecrawl
    - Daemons อ่าน env vars จาก `~/.openclaw/.env` (หรือ environment ของบริการ)

    เอกสาร: [เครื่องมือเว็บ](/th/tools/web)

  </Accordion>

  <Accordion title="config.apply ล้างการตั้งค่าของฉัน ฉันจะกู้คืนและหลีกเลี่ยงสิ่งนี้ได้อย่างไร">
    `config.apply` จะแทนที่ **config ทั้งหมด** หากคุณส่งออบเจ็กต์บางส่วน อย่างอื่นทั้งหมด
    จะถูกลบออก

    OpenClaw ปัจจุบันป้องกันการเขียนทับโดยไม่ตั้งใจหลายกรณี:

    - การเขียน config ที่ OpenClaw เป็นเจ้าของจะตรวจสอบ config ทั้งหมดหลังการเปลี่ยนแปลงก่อนเขียน
    - การเขียนที่ไม่ถูกต้องหรือทำลายข้อมูลซึ่ง OpenClaw เป็นเจ้าของจะถูกปฏิเสธและบันทึกเป็น `openclaw.json.rejected.*`
    - หากการแก้ไขโดยตรงทำให้ startup หรือ hot reload เสีย Gateway จะ fail closed หรือข้ามการ reload; จะไม่เขียน `openclaw.json` ใหม่
    - `openclaw doctor --fix` เป็นเจ้าของการซ่อมแซมและสามารถคืนค่า last-known-good พร้อมบันทึกไฟล์ที่ถูกปฏิเสธเป็น `openclaw.json.clobbered.*`

    กู้คืน:

    - ตรวจสอบ `openclaw logs --follow` เพื่อหา `Invalid config at`, `Config write rejected:`, หรือ `config reload skipped (invalid config)`
    - ตรวจดู `openclaw.json.clobbered.*` หรือ `openclaw.json.rejected.*` ล่าสุดที่อยู่ข้าง config ที่ใช้งานอยู่
    - รัน `openclaw config validate` และ `openclaw doctor --fix`
    - คัดลอกกลับเฉพาะคีย์ที่ตั้งใจไว้ด้วย `openclaw config set` หรือ `config.patch`
    - หากคุณไม่มี last-known-good หรือ payload ที่ถูกปฏิเสธ ให้กู้คืนจาก backup หรือรัน `openclaw doctor` อีกครั้งแล้วตั้งค่า channels/models ใหม่
    - หากสิ่งนี้เกิดขึ้นโดยไม่คาดคิด ให้แจ้งบั๊กและแนบ config ล่าสุดที่คุณทราบหรือ backup ใดๆ
    - local coding agent มักจะสร้าง config ที่ใช้งานได้ขึ้นใหม่จาก logs หรือ history ได้

    หลีกเลี่ยง:

    - ใช้ `openclaw config set` สำหรับการเปลี่ยนแปลงเล็กๆ
    - ใช้ `openclaw configure` สำหรับการแก้ไขแบบโต้ตอบ
    - ใช้ `config.schema.lookup` ก่อนเมื่อคุณไม่แน่ใจเกี่ยวกับพาธที่แน่นอนหรือรูปร่างของฟิลด์; คำสั่งนี้จะคืนค่า schema node แบบตื้นพร้อมสรุปลูกโดยตรงสำหรับการเจาะลึก
    - ใช้ `config.patch` สำหรับการแก้ไข RPC บางส่วน; เก็บ `config.apply` ไว้สำหรับการแทนที่ config ทั้งหมดเท่านั้น
    - หากคุณใช้เครื่องมือ `gateway` สำหรับ owner-only จากการรัน agent เครื่องมือนี้จะยังคงปฏิเสธการเขียนไปยัง `tools.exec.ask` / `tools.exec.security` (รวมถึง alias แบบเดิม `tools.bash.*` ที่ normalize ไปยัง exec paths ที่ได้รับการป้องกันเดียวกัน)

    เอกสาร: [Config](/th/cli/config), [Configure](/th/cli/configure), [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันจะรัน Gateway กลางพร้อม workers เฉพาะทางข้ามอุปกรณ์ได้อย่างไร">
    รูปแบบทั่วไปคือ **Gateway หนึ่งตัว** (เช่น Raspberry Pi) พร้อม **nodes** และ **agents**:

    - **Gateway (กลาง):** เป็นเจ้าของ channels (Signal/WhatsApp), routing, และ sessions
    - **Nodes (อุปกรณ์):** Macs/iOS/Android เชื่อมต่อเป็น peripherals และเปิดเผยเครื่องมือ local (`system.run`, `canvas`, `camera`)
    - **Agents (workers):** brains/workspaces แยกต่างหากสำหรับบทบาทพิเศษ (เช่น "ปฏิบัติการ Hetzner", "ข้อมูลส่วนตัว")
    - **Sub-agents:** สร้างงานพื้นหลังจาก agent หลักเมื่อคุณต้องการ parallelism
    - **TUI:** เชื่อมต่อกับ Gateway และสลับ agents/sessions

    เอกสาร: [Nodes](/th/nodes), [การเข้าถึงระยะไกล](/th/gateway/remote), [Multi-Agent Routing](/th/concepts/multi-agent), [Sub-agents](/th/tools/subagents), [TUI](/th/web/tui)

  </Accordion>

  <Accordion title="เบราว์เซอร์ OpenClaw รันแบบ headless ได้ไหม">
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

    ค่าเริ่มต้นคือ `false` (headful) Headless มีแนวโน้มมากขึ้นที่จะกระตุ้นการตรวจ anti-bot ในบางไซต์ ดู [Browser](/th/tools/browser)

    Headless ใช้ **Chromium engine เดียวกัน** และทำงานได้กับ automation ส่วนใหญ่ (forms, clicks, scraping, logins) ความแตกต่างหลักคือ:

    - ไม่มีหน้าต่างเบราว์เซอร์ที่มองเห็นได้ (ใช้ screenshots หากคุณต้องการภาพ)
    - บางไซต์เข้มงวดกับ automation ในโหมด headless มากกว่า (CAPTCHAs, anti-bot)
      ตัวอย่างเช่น X/Twitter มักบล็อก sessions แบบ headless

  </Accordion>

  <Accordion title="ฉันจะใช้ Brave สำหรับควบคุมเบราว์เซอร์ได้อย่างไร">
    ตั้งค่า `browser.executablePath` เป็น binary ของ Brave ของคุณ (หรือเบราว์เซอร์ที่ใช้ Chromium ใดๆ) แล้ว restart Gateway
    ดูตัวอย่าง config ฉบับเต็มใน [Browser](/th/tools/browser#use-brave-or-another-chromium-based-browser)
  </Accordion>
</AccordionGroup>

## Gateways และ nodes ระยะไกล

<AccordionGroup>
  <Accordion title="คำสั่งแพร่กระจายระหว่าง Telegram, gateway, และ nodes อย่างไร">
    ข้อความ Telegram ถูกจัดการโดย **gateway** gateway จะรัน agent และ
    จากนั้นจึงเรียก nodes ผ่าน **Gateway WebSocket** เมื่อจำเป็นต้องใช้เครื่องมือ node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes ไม่เห็น provider traffic ขาเข้า; พวกมันรับเฉพาะการเรียก node RPC เท่านั้น

  </Accordion>

  <Accordion title="agent ของฉันจะเข้าถึงคอมพิวเตอร์ของฉันได้อย่างไรหาก Gateway โฮสต์อยู่ระยะไกล">
    คำตอบสั้นๆ: **จับคู่คอมพิวเตอร์ของคุณเป็น node** Gateway รันอยู่ที่อื่น แต่สามารถ
    เรียกเครื่องมือ `node.*` (screen, camera, system) บนเครื่อง local ของคุณผ่าน Gateway WebSocket ได้

    การตั้งค่าทั่วไป:

    1. เรียกใช้ Gateway บนโฮสต์ที่เปิดตลอดเวลา (VPS/เซิร์ฟเวอร์ที่บ้าน)
    2. ใส่โฮสต์ Gateway + คอมพิวเตอร์ของคุณไว้ใน tailnet เดียวกัน
    3. ตรวจสอบว่า Gateway WS เข้าถึงได้ (bind ผ่าน tailnet หรือ SSH tunnel)
    4. เปิดแอป macOS ในเครื่องและเชื่อมต่อในโหมด **Remote over SSH** (หรือ tailnet โดยตรง)
       เพื่อให้ลงทะเบียนเป็นโหนดได้
    5. อนุมัติโหนดบน Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ไม่จำเป็นต้องมี TCP bridge แยกต่างหาก โหนดเชื่อมต่อผ่าน Gateway WebSocket

    ข้อเตือนด้านความปลอดภัย: การจับคู่โหนด macOS อนุญาตให้ใช้ `system.run` บนเครื่องนั้นได้ จับคู่
    เฉพาะอุปกรณ์ที่คุณไว้วางใจ และตรวจสอบ [ความปลอดภัย](/th/gateway/security)

    เอกสาร: [โหนด](/th/nodes), [โปรโตคอล Gateway](/th/gateway/protocol), [โหมดระยะไกลของ macOS](/th/platforms/mac/remote), [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="Tailscale เชื่อมต่อแล้ว แต่ฉันไม่ได้รับการตอบกลับเลย ต้องทำอย่างไร?">
    ตรวจสอบพื้นฐาน:

    - Gateway กำลังทำงาน: `openclaw gateway status`
    - สถานะสุขภาพของ Gateway: `openclaw status`
    - สถานะสุขภาพของช่องทาง: `openclaw channels status`

    จากนั้นตรวจสอบการยืนยันตัวตนและการกำหนดเส้นทาง:

    - หากคุณใช้ Tailscale Serve ตรวจสอบให้แน่ใจว่า `gateway.auth.allowTailscale` ถูกตั้งค่าอย่างถูกต้อง
    - หากคุณเชื่อมต่อผ่าน SSH tunnel ให้ยืนยันว่า tunnel ในเครื่องทำงานอยู่และชี้ไปยังพอร์ตที่ถูกต้อง
    - ยืนยันว่า allowlists ของคุณ (DM หรือกลุ่ม) มีบัญชีของคุณอยู่

    เอกสาร: [Tailscale](/th/gateway/tailscale), [การเข้าถึงระยะไกล](/th/gateway/remote), [ช่องทาง](/th/channels).

  </Accordion>

  <Accordion title="อินสแตนซ์ OpenClaw สองตัวคุยกันได้ไหม (ในเครื่อง + VPS)?">
    ได้ ไม่มี bridge แบบ "บอตถึงบอต" ในตัว แต่คุณสามารถเชื่อมต่อได้หลายวิธี
    ที่เชื่อถือได้:

    **ง่ายที่สุด:** ใช้ช่องทางแชทปกติที่บอตทั้งสองเข้าถึงได้ (Telegram/Slack/WhatsApp)
    ให้บอต A ส่งข้อความไปยังบอต B จากนั้นให้บอต B ตอบกลับตามปกติ

    **CLI bridge (ทั่วไป):** เรียกใช้สคริปต์ที่เรียก Gateway อีกตัวด้วย
    `openclaw agent --message ... --deliver` โดยกำหนดเป้าหมายไปยังแชทที่บอตอีกตัว
    ฟังอยู่ หากบอตหนึ่งอยู่บน VPS ระยะไกล ให้ชี้ CLI ของคุณไปยัง Gateway ระยะไกลนั้น
    ผ่าน SSH/Tailscale (ดู [การเข้าถึงระยะไกล](/th/gateway/remote))

    รูปแบบตัวอย่าง (เรียกใช้จากเครื่องที่เข้าถึง Gateway เป้าหมายได้):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    เคล็ดลับ: เพิ่ม guardrail เพื่อไม่ให้บอตทั้งสองวนลูปไม่รู้จบ (ตอบเฉพาะเมื่อถูกกล่าวถึง,
    allowlists ของช่องทาง, หรือกฎ "ไม่ตอบกลับข้อความจากบอต")

    เอกสาร: [การเข้าถึงระยะไกล](/th/gateway/remote), [Agent CLI](/th/cli/agent), [การส่งของ Agent](/th/tools/agent-send).

  </Accordion>

  <Accordion title="ฉันต้องมี VPS แยกสำหรับหลายเอเจนต์หรือไม่?">
    ไม่ต้อง Gateway เดียวสามารถโฮสต์เอเจนต์หลายตัวได้ โดยแต่ละตัวมี workspace, ค่าเริ่มต้นของโมเดล,
    และการกำหนดเส้นทางของตนเอง นี่คือการตั้งค่าปกติและถูกกว่าและง่ายกว่าการเรียกใช้
    VPS หนึ่งตัวต่อหนึ่งเอเจนต์มาก

    ใช้ VPS แยกเฉพาะเมื่อคุณต้องการการแยกอย่างเข้มงวด (ขอบเขตความปลอดภัย) หรือ
    การกำหนดค่าที่แตกต่างกันมากซึ่งคุณไม่ต้องการใช้ร่วมกัน มิฉะนั้น ให้ใช้ Gateway เดียวและ
    ใช้หลายเอเจนต์หรือเอเจนต์ย่อย

  </Accordion>

  <Accordion title="การใช้โหนดบนแล็ปท็อปส่วนตัวแทน SSH จาก VPS มีประโยชน์หรือไม่?">
    มี โหนดเป็นวิธีหลักในการเข้าถึงแล็ปท็อปของคุณจาก Gateway ระยะไกล และ
    ปลดล็อกได้มากกว่าการเข้าถึงเชลล์ Gateway ทำงานบน macOS/Linux (Windows ผ่าน WSL2) และ
    ใช้ทรัพยากรเบา (VPS ขนาดเล็กหรือกล่องระดับ Raspberry Pi ก็เพียงพอ; RAM 4 GB เหลือเฟือ) ดังนั้นการตั้งค่าทั่วไป
    คือโฮสต์ที่เปิดตลอดเวลาพร้อมกับแล็ปท็อปของคุณในฐานะโหนด

    - **ไม่ต้องใช้ SSH ขาเข้า** โหนดเชื่อมต่อออกไปยัง Gateway WebSocket และใช้การจับคู่อุปกรณ์
    - **การควบคุมการดำเนินการที่ปลอดภัยกว่า** `system.run` ถูกควบคุมด้วย allowlists/การอนุมัติโหนดบนแล็ปท็อปนั้น
    - **เครื่องมืออุปกรณ์เพิ่มเติม** โหนดเปิดเผย `canvas`, `camera`, และ `screen` นอกเหนือจาก `system.run`
    - **การทำงานอัตโนมัติของเบราว์เซอร์ในเครื่อง** เก็บ Gateway ไว้บน VPS แต่เรียกใช้ Chrome ในเครื่องผ่านโฮสต์โหนดบนแล็ปท็อป หรือเชื่อมต่อกับ Chrome ในเครื่องบนโฮสต์ผ่าน Chrome MCP

    SSH เหมาะสำหรับการเข้าถึงเชลล์แบบเฉพาะกิจ แต่โหนดง่ายกว่าสำหรับเวิร์กโฟลว์เอเจนต์ที่ใช้งานต่อเนื่องและ
    การทำงานอัตโนมัติของอุปกรณ์

    เอกสาร: [โหนด](/th/nodes), [CLI ของโหนด](/th/cli/nodes), [เบราว์เซอร์](/th/tools/browser).

  </Accordion>

  <Accordion title="โหนดเรียกใช้บริการ gateway หรือไม่?">
    ไม่ เฉพาะ **gateway หนึ่งตัว** เท่านั้นที่ควรทำงานต่อหนึ่งโฮสต์ เว้นแต่คุณตั้งใจเรียกใช้โปรไฟล์ที่แยกกัน (ดู [หลาย gateway](/th/gateway/multiple-gateways)) โหนดเป็นอุปกรณ์ต่อพ่วงที่เชื่อมต่อ
    กับ gateway (โหนด iOS/Android หรือ "โหมดโหนด" ของ macOS ในแอปแถบเมนู) สำหรับโฮสต์โหนดแบบ headless
    และการควบคุมด้วย CLI ดู [CLI ของโฮสต์โหนด](/th/cli/node)

    ต้องรีสตาร์ตเต็มรูปแบบสำหรับการเปลี่ยนแปลง `gateway`, `discovery`, และ `canvasHost`

  </Accordion>

  <Accordion title="มีวิธี API / RPC สำหรับปรับใช้ config หรือไม่?">
    มี

    - `config.schema.lookup`: ตรวจสอบ subtree ของ config หนึ่งรายการพร้อมโหนด schema แบบตื้น, คำใบ้ UI ที่ตรงกัน, และสรุปลูกโดยตรงก่อนเขียน
    - `config.get`: ดึง snapshot + hash ปัจจุบัน
    - `config.patch`: อัปเดตบางส่วนอย่างปลอดภัย (แนะนำสำหรับการแก้ไข RPC ส่วนใหญ่); hot-reload เมื่อทำได้และรีสตาร์ตเมื่อจำเป็น
    - `config.apply`: ตรวจสอบความถูกต้อง + แทนที่ config ทั้งหมด; hot-reload เมื่อทำได้และรีสตาร์ตเมื่อจำเป็น
    - เครื่องมือ runtime `gateway` เฉพาะเจ้าของยังคงปฏิเสธการเขียนทับ `tools.exec.ask` / `tools.exec.security`; alias เดิม `tools.bash.*` จะ normalize ไปยัง path exec ที่ได้รับการป้องกันเดียวกัน

  </Accordion>

  <Accordion title="การตั้งค่าขั้นต่ำที่เหมาะสมสำหรับการติดตั้งครั้งแรก">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    การตั้งค่านี้กำหนดพื้นที่ทำงานของคุณและจำกัดว่าใครสามารถสั่งให้บอตทำงานได้

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
       - ในคอนโซลผู้ดูแลของ Tailscale ให้เปิดใช้ MagicDNS เพื่อให้ VPS มีชื่อที่คงที่
    4. **ใช้ชื่อโฮสต์ของ tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    หากคุณต้องการ Control UI โดยไม่ใช้ SSH ให้ใช้ Tailscale Serve บน VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    วิธีนี้จะผูก gateway ไว้กับ loopback และเปิดเผย HTTPS ผ่าน Tailscale ดู [Tailscale](/th/gateway/tailscale)

  </Accordion>

  <Accordion title="ฉันจะเชื่อมต่อโหนด Mac กับ Gateway ระยะไกล (Tailscale Serve) ได้อย่างไร?">
    Serve เปิดเผย **Gateway Control UI + WS** โหนดเชื่อมต่อผ่านปลายทาง Gateway WS เดียวกัน

    การตั้งค่าที่แนะนำ:

    1. **ตรวจสอบให้แน่ใจว่า VPS + Mac อยู่ใน tailnet เดียวกัน**
    2. **ใช้แอป macOS ในโหมดระยะไกล** (เป้าหมาย SSH สามารถเป็นชื่อโฮสต์ของ tailnet ได้)
       แอปจะสร้าง tunnel พอร์ต Gateway และเชื่อมต่อเป็นโหนด
    3. **อนุมัติโหนด** บน gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    เอกสาร: [โปรโตคอล Gateway](/th/gateway/protocol), [การค้นพบ](/th/gateway/discovery), [โหมดระยะไกลของ macOS](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันควรติดตั้งบนแล็ปท็อปเครื่องที่สองหรือแค่เพิ่มโหนด?">
    หากคุณต้องการเพียง **เครื่องมือภายในเครื่อง** (หน้าจอ/กล้อง/exec) บนแล็ปท็อปเครื่องที่สอง ให้เพิ่มเป็น
    **โหนด** วิธีนี้จะคง Gateway เดียวไว้และหลีกเลี่ยงการตั้งค่าซ้ำ เครื่องมือโหนดภายในเครื่อง
    ตอนนี้รองรับเฉพาะ macOS แต่เราวางแผนจะขยายไปยัง OS อื่น ๆ

    ติดตั้ง Gateway ตัวที่สองก็ต่อเมื่อคุณต้องการ **การแยกอย่างเข้มงวด** หรือบอตสองตัวที่แยกจากกันโดยสมบูรณ์

    เอกสาร: [โหนด](/th/nodes), [CLI สำหรับโหนด](/th/cli/nodes), [Gateway หลายตัว](/th/gateway/multiple-gateways)

  </Accordion>
</AccordionGroup>

## ตัวแปรสภาพแวดล้อมและการโหลด .env

<AccordionGroup>
  <Accordion title="OpenClaw โหลดตัวแปรสภาพแวดล้อมอย่างไร?">
    OpenClaw อ่านตัวแปรสภาพแวดล้อมจากโปรเซสแม่ (shell, launchd/systemd, CI ฯลฯ) และโหลดเพิ่มเติมจาก:

    - `.env` จากไดเรกทอรีทำงานปัจจุบัน
    - `.env` สำรองแบบ global จาก `~/.openclaw/.env` (หรือ `$OPENCLAW_STATE_DIR/.env`)

    ไฟล์ `.env` ทั้งสองไฟล์จะไม่เขียนทับตัวแปรสภาพแวดล้อมที่มีอยู่

    คุณยังสามารถกำหนดตัวแปรสภาพแวดล้อมแบบ inline ใน config ได้ด้วย (ใช้เฉพาะเมื่อไม่มีอยู่ในสภาพแวดล้อมของโปรเซส):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    ดูลำดับความสำคัญและแหล่งที่มาทั้งหมดได้ที่ [/environment](/th/help/environment)

  </Accordion>

  <Accordion title="ฉันเริ่ม Gateway ผ่าน service แล้วตัวแปรสภาพแวดล้อมหายไป ตอนนี้ต้องทำอย่างไร?">
    วิธีแก้ที่พบบ่อยสองวิธี:

    1. ใส่คีย์ที่ขาดไปใน `~/.openclaw/.env` เพื่อให้ถูกดึงมาใช้แม้ service จะไม่ได้สืบทอดสภาพแวดล้อมของ shell
    2. เปิดใช้การนำเข้า shell (ความสะดวกแบบเลือกเปิด):

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

    วิธีนี้จะเรียกใช้ login shell ของคุณและนำเข้าเฉพาะคีย์ที่คาดหวังซึ่งยังขาดอยู่ (ไม่เขียนทับเด็ดขาด) ตัวแปรสภาพแวดล้อมที่เทียบเท่า:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

  </Accordion>

  <Accordion title='ฉันตั้งค่า COPILOT_GITHUB_TOKEN แล้ว แต่สถานะโมเดลแสดง "Shell env: off." เพราะอะไร?'>
    `openclaw models status` รายงานว่าเปิดใช้ **การนำเข้า shell env** หรือไม่ "Shell env: off"
    **ไม่ได้** หมายความว่าตัวแปรสภาพแวดล้อมของคุณหายไป แต่หมายความว่า OpenClaw จะไม่โหลด
    login shell ของคุณโดยอัตโนมัติ

    หาก Gateway ทำงานเป็น service (launchd/systemd) มันจะไม่สืบทอดสภาพแวดล้อมของ
    shell ของคุณ แก้ไขโดยทำอย่างใดอย่างหนึ่งต่อไปนี้:

    1. ใส่ token ใน `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. หรือเปิดใช้การนำเข้า shell (`env.shellEnv.enabled: true`)
    3. หรือเพิ่มลงในบล็อก `env` ของ config (ใช้เฉพาะเมื่อยังไม่มี)

    จากนั้นรีสตาร์ต gateway และตรวจสอบอีกครั้ง:

    ```bash
    openclaw models status
    ```

    token ของ Copilot อ่านจาก `COPILOT_GITHUB_TOKEN` (รวมถึง `GH_TOKEN` / `GITHUB_TOKEN`)
    ดู [/concepts/model-providers](/th/concepts/model-providers) และ [/environment](/th/help/environment)

  </Accordion>
</AccordionGroup>

## เซสชันและแชตหลายรายการ

<AccordionGroup>
  <Accordion title="ฉันจะเริ่มบทสนทนาใหม่ได้อย่างไร?">
    ส่ง `/new` หรือ `/reset` เป็นข้อความเดี่ยว ดู [การจัดการเซสชัน](/th/concepts/session)
  </Accordion>

  <Accordion title="เซสชันรีเซ็ตอัตโนมัติหรือไม่หากฉันไม่เคยส่ง /new?">
    เซสชันสามารถหมดอายุหลังจาก `session.idleMinutes` แต่ฟีเจอร์นี้ **ปิดอยู่โดยค่าเริ่มต้น** (ค่าเริ่มต้น **0**)
    ตั้งค่าเป็นค่าบวกเพื่อเปิดใช้การหมดอายุเมื่อไม่มีการใช้งาน เมื่อเปิดใช้แล้ว ข้อความ **ถัดไป**
    หลังช่วงเวลาที่ไม่มีการใช้งานจะเริ่ม session id ใหม่สำหรับ chat key นั้น
    วิธีนี้ไม่ลบ transcript แต่เพียงเริ่มเซสชันใหม่

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="มีวิธีสร้างทีมของอินสแตนซ์ OpenClaw (CEO หนึ่งคนและ agent หลายตัว) หรือไม่?">
    มี ผ่าน **การกำหนดเส้นทางแบบ multi-agent** และ **sub-agents** คุณสามารถสร้าง agent ผู้ประสานงานหนึ่งตัว
    และ agent ผู้ปฏิบัติงานหลายตัว โดยแต่ละตัวมีพื้นที่ทำงานและโมเดลของตนเอง

    อย่างไรก็ตาม ควรมองว่านี่เป็น **การทดลองที่สนุก** มากกว่า วิธีนี้ใช้ token มากและมัก
    มีประสิทธิภาพน้อยกว่าการใช้บอตหนึ่งตัวพร้อมเซสชันแยกกัน รูปแบบทั่วไปที่เรา
    จินตนาการไว้คือบอตหนึ่งตัวที่คุณคุยด้วย พร้อมเซสชันต่าง ๆ สำหรับงานขนานกัน บอตนั้น
    ยังสามารถสร้าง sub-agents ได้เมื่อจำเป็น

    เอกสาร: [การกำหนดเส้นทางแบบ multi-agent](/th/concepts/multi-agent), [Sub-agents](/th/tools/subagents), [CLI สำหรับ Agents](/th/cli/agents)

  </Accordion>

  <Accordion title="ทำไม context จึงถูกตัดระหว่างงาน? ฉันจะป้องกันได้อย่างไร?">
    context ของเซสชันถูกจำกัดโดยหน้าต่างของโมเดล แชตที่ยาว ผลลัพธ์เครื่องมือขนาดใหญ่ หรือไฟล์จำนวนมาก
    อาจทำให้เกิด Compaction หรือการตัดทอน

    สิ่งที่ช่วยได้:

    - ขอให้บอตสรุปสถานะปัจจุบันและเขียนลงไฟล์
    - ใช้ `/compact` ก่อนงานยาว และใช้ `/new` เมื่อเปลี่ยนหัวข้อ
    - เก็บ context สำคัญไว้ในพื้นที่ทำงานและขอให้บอตอ่านกลับ
    - ใช้ sub-agents สำหรับงานยาวหรืองานขนาน เพื่อให้แชตหลักเล็กลง
    - เลือกโมเดลที่มีหน้าต่าง context ใหญ่ขึ้นหากเกิดปัญหานี้บ่อย

  </Accordion>

  <Accordion title="ฉันจะรีเซ็ต OpenClaw ทั้งหมดแต่ยังคงติดตั้งไว้ได้อย่างไร?">
    ใช้คำสั่ง reset:

    ```bash
    openclaw reset
    ```

    การรีเซ็ตเต็มรูปแบบแบบไม่โต้ตอบ:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    จากนั้นเรียก setup อีกครั้ง:

    ```bash
    openclaw onboard --install-daemon
    ```

    หมายเหตุ:

    - Onboarding ยังเสนอ **Reset** หากพบ config ที่มีอยู่ ดู [Onboarding (CLI)](/th/start/wizard)
    - หากคุณใช้ profiles (`--profile` / `OPENCLAW_PROFILE`) ให้รีเซ็ต state dir แต่ละรายการ (ค่าเริ่มต้นคือ `~/.openclaw-<profile>`)
    - รีเซ็ตสำหรับ dev: `openclaw gateway --dev --reset` (เฉพาะ dev; ล้าง config + credentials + sessions + workspace สำหรับ dev)

  </Accordion>

  <Accordion title='ฉันได้รับข้อผิดพลาด "context too large" จะรีเซ็ตหรือ compact ได้อย่างไร?'>
    ใช้อย่างใดอย่างหนึ่งต่อไปนี้:

    - **Compact** (คงบทสนทนาไว้แต่สรุปเทิร์นเก่า ๆ):

      ```
      /compact
      ```

      หรือ `/compact <instructions>` เพื่อกำกับสรุป

    - **Reset** (session ID ใหม่สำหรับ chat key เดิม):

      ```
      /new
      /reset
      ```

    หากยังเกิดขึ้นต่อเนื่อง:

    - เปิดใช้หรือปรับ **การตัดแต่งเซสชัน** (`agents.defaults.contextPruning`) เพื่อตัดผลลัพธ์เครื่องมือเก่า
    - ใช้โมเดลที่มีหน้าต่าง context ใหญ่ขึ้น

    เอกสาร: [Compaction](/th/concepts/compaction), [การตัดแต่งเซสชัน](/th/concepts/session-pruning), [การจัดการเซสชัน](/th/concepts/session)

  </Accordion>

  <Accordion title='ทำไมฉันจึงเห็น "LLM request rejected: messages.content.tool_use.input field required"?'>
    นี่เป็นข้อผิดพลาดการตรวจสอบจาก provider: โมเดลสร้างบล็อก `tool_use` โดยไม่มี
    `input` ที่จำเป็น โดยปกติหมายความว่าประวัติเซสชันล้าสมัยหรือเสียหาย (มักเกิดหลัง thread ที่ยาว
    หรือการเปลี่ยนแปลง tool/schema)

    วิธีแก้: เริ่มเซสชันใหม่ด้วย `/new` (ข้อความเดี่ยว)

  </Accordion>

  <Accordion title="ทำไมฉันจึงได้รับข้อความ heartbeat ทุก 30 นาที?">
    Heartbeat ทำงานทุก **30m** โดยค่าเริ่มต้น (**1h** เมื่อใช้การยืนยันตัวตนแบบ OAuth) ปรับหรือปิดได้ดังนี้:

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

    หากมี `HEARTBEAT.md` อยู่แต่แทบว่างเปล่า (มีเพียงบรรทัดว่างและหัวข้อ markdown
    เช่น `# Heading`) OpenClaw จะข้ามการเรียกใช้ heartbeat เพื่อประหยัด API calls
    หากไฟล์หายไป heartbeat จะยังทำงานและให้โมเดลตัดสินใจว่าจะทำอะไร

    การ override ราย agent ใช้ `agents.list[].heartbeat` เอกสาร: [Heartbeat](/th/gateway/heartbeat)

  </Accordion>

  <Accordion title='ฉันต้องเพิ่ม "bot account" ไปยังกลุ่ม WhatsApp หรือไม่?'>
    ไม่ต้อง OpenClaw ทำงานบน **บัญชีของคุณเอง** ดังนั้นหากคุณอยู่ในกลุ่ม OpenClaw ก็เห็นกลุ่มนั้นได้
    โดยค่าเริ่มต้น การตอบกลับในกลุ่มจะถูกบล็อกจนกว่าคุณจะอนุญาตผู้ส่ง (`groupPolicy: "allowlist"`)

    หากคุณต้องการให้มีเพียง **คุณ** ที่สั่งให้ตอบกลับในกลุ่มได้:

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
    ตัวเลือก 1 (เร็วที่สุด): tail logs แล้วส่งข้อความทดสอบในกลุ่ม:

    ```bash
    openclaw logs --follow --json
    ```

    มองหา `chatId` (หรือ `from`) ที่ลงท้ายด้วย `@g.us` เช่น:
    `1234567890-1234567890@g.us`

    ตัวเลือก 2 (หากกำหนดค่า/อยู่ใน allowlist แล้ว): แสดงรายการกลุ่มจาก config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    เอกสาร: [WhatsApp](/th/channels/whatsapp), [Directory](/th/cli/directory), [Logs](/th/cli/logs)

  </Accordion>

  <Accordion title="ทำไม OpenClaw ไม่ตอบกลับในกลุ่ม?">
    สาเหตุที่พบบ่อยสองข้อ:

    - เปิด mention gating อยู่ (ค่าเริ่มต้น) คุณต้อง @mention บอต (หรือให้ตรงกับ `mentionPatterns`)
    - คุณกำหนดค่า `channels.whatsapp.groups` โดยไม่มี `"*"` และกลุ่มไม่ได้อยู่ใน allowlist

    ดู [Groups](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages)

  </Accordion>

  <Accordion title="กลุ่ม/thread ใช้ context ร่วมกับ DM หรือไม่?">
    แชตโดยตรงจะยุบรวมเป็นเซสชันหลักโดยค่าเริ่มต้น กลุ่ม/ช่องทางมี session key ของตัวเอง และ topic ของ Telegram / thread ของ Discord เป็นเซสชันแยกกัน ดู [Groups](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages)
  </Accordion>

  <Accordion title="ฉันสามารถสร้าง workspace และ agent ได้กี่รายการ?">
    ไม่มีขีดจำกัดตายตัว หลายสิบรายการ (แม้แต่หลายร้อย) ก็ได้ แต่ควรระวัง:

    - **การใช้ดิสก์เพิ่มขึ้น:** sessions + transcripts อยู่ใต้ `~/.openclaw/agents/<agentId>/sessions/`
    - **ค่า token:** agent มากขึ้นหมายถึงการใช้งานโมเดลพร้อมกันมากขึ้น
    - **ภาระงานด้านปฏิบัติการ:** auth profiles, workspaces และ channel routing ราย agent

    เคล็ดลับ:

    - คง workspace **ที่ใช้งานอยู่** หนึ่งรายการต่อ agent (`agents.defaults.workspace`)
    - ตัดแต่งเซสชันเก่า (ลบ JSONL หรือรายการใน store) หากดิสก์โตขึ้น
    - ใช้ `openclaw doctor` เพื่อตรวจหา workspace ที่หลงเหลือและ profile ที่ไม่ตรงกัน

  </Accordion>

  <Accordion title="ฉันสามารถรันบอตหรือแชตหลายรายการพร้อมกันได้ไหม (Slack) และควรตั้งค่าอย่างไร?">
    ได้ ใช้ **การกำหนดเส้นทางแบบหลายเอเจนต์** เพื่อรันเอเจนต์ที่แยกจากกันหลายตัวและกำหนดเส้นทางข้อความขาเข้าตาม
    ช่องทาง/บัญชี/เพียร์ Slack รองรับในฐานะช่องทางและสามารถผูกกับเอเจนต์เฉพาะได้

    การเข้าถึงเบราว์เซอร์มีความสามารถสูง แต่ไม่ได้หมายถึง "ทำได้ทุกอย่างเหมือนมนุษย์" - ระบบกันบอต, CAPTCHA และ MFA
    ยังสามารถบล็อกการทำงานอัตโนมัติได้ สำหรับการควบคุมเบราว์เซอร์ที่เชื่อถือได้ที่สุด ให้ใช้ Chrome MCP ในเครื่องบนโฮสต์
    หรือใช้ CDP บนเครื่องที่รันเบราว์เซอร์จริง

    การตั้งค่าตามแนวทางปฏิบัติที่ดีที่สุด:

    - โฮสต์ Gateway ที่เปิดทำงานตลอดเวลา (VPS/Mac mini)
    - เอเจนต์หนึ่งตัวต่อหนึ่งบทบาท (การผูก)
    - ช่องทาง Slack ที่ผูกกับเอเจนต์เหล่านั้น
    - เบราว์เซอร์ในเครื่องผ่าน Chrome MCP หรือ Node เมื่อจำเป็น

    เอกสาร: [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent), [Slack](/th/channels/slack),
    [เบราว์เซอร์](/th/tools/browser), [Nodes](/th/nodes).

  </Accordion>
</AccordionGroup>

## โมเดล, การสลับเมื่อขัดข้อง และโปรไฟล์การยืนยันตัวตน

ถามตอบเกี่ยวกับโมเดล — ค่าเริ่มต้น, การเลือก, นามแฝง, การสลับ, การสลับเมื่อขัดข้อง, โปรไฟล์การยืนยันตัวตน —
อยู่ที่ [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models)

## Gateway: พอร์ต, "กำลังรันอยู่แล้ว", และโหมดรีโมต

<AccordionGroup>
  <Accordion title="Gateway ใช้พอร์ตใด?">
    `gateway.port` ควบคุมพอร์ตเดียวแบบมัลติเพล็กซ์สำหรับ WebSocket + HTTP (Control UI, ฮุก ฯลฯ)

    ลำดับความสำคัญ:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status จึงบอกว่า "Runtime: running" แต่ "Connectivity probe: failed"?'>
    เพราะ "running" เป็นมุมมองของ **supervisor** (launchd/systemd/schtasks) ส่วนการตรวจสอบการเชื่อมต่อคือ CLI ที่เชื่อมต่อกับ WebSocket ของ Gateway จริง

    ใช้ `openclaw gateway status` และเชื่อถือบรรทัดเหล่านี้:

    - `Probe target:` (URL ที่การตรวจสอบใช้จริง)
    - `Listening:` (สิ่งที่ผูกอยู่บนพอร์ตจริง)
    - `Last gateway error:` (สาเหตุหลักที่พบบ่อยเมื่อโปรเซสยังทำงานอยู่แต่พอร์ตไม่ได้รับการรับฟัง)

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status จึงแสดง "Config (cli)" และ "Config (service)" ต่างกัน?'>
    คุณกำลังแก้ไขไฟล์คอนฟิกหนึ่ง ขณะที่บริการกำลังรันอีกไฟล์หนึ่งอยู่ (มักเป็นการไม่ตรงกันของ `--profile` / `OPENCLAW_STATE_DIR`)

    วิธีแก้:

    ```bash
    openclaw gateway install --force
    ```

    รันคำสั่งนั้นจาก `--profile` / สภาพแวดล้อมเดียวกับที่คุณต้องการให้บริการใช้

  </Accordion>

  <Accordion title='"another gateway instance is already listening" หมายความว่าอย่างไร?'>
    OpenClaw บังคับใช้ล็อก runtime โดยผูกตัวรับฟัง WebSocket ทันทีเมื่อเริ่มต้น (ค่าเริ่มต้น `ws://127.0.0.1:18789`) หากการผูกล้มเหลวด้วย `EADDRINUSE` ระบบจะโยน `GatewayLockError` เพื่อระบุว่ามีอีกอินสแตนซ์หนึ่งกำลังรับฟังอยู่แล้ว

    วิธีแก้: หยุดอินสแตนซ์อื่น, ทำให้พอร์ตว่าง, หรือรันด้วย `openclaw gateway --port <port>`

  </Accordion>

  <Accordion title="ฉันจะรัน OpenClaw ในโหมดรีโมตได้อย่างไร (ไคลเอนต์เชื่อมต่อไปยัง Gateway ที่อยู่ที่อื่น)?">
    ตั้งค่า `gateway.mode: "remote"` และชี้ไปยัง URL WebSocket ระยะไกล โดยเลือกใช้ข้อมูลรับรองรีโมตแบบ shared-secret ได้:

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
    - แอป macOS จะเฝ้าดูไฟล์คอนฟิกและสลับโหมดแบบสดเมื่อค่าเหล่านี้เปลี่ยน
    - `gateway.remote.token` / `.password` เป็นข้อมูลรับรองรีโมตฝั่งไคลเอนต์เท่านั้น; ค่าเหล่านี้ไม่ได้เปิดใช้งานการยืนยันตัวตนของ Gateway ในเครื่องด้วยตัวเอง

  </Accordion>

  <Accordion title='Control UI บอกว่า "unauthorized" (หรือเชื่อมต่อใหม่ซ้ำ ๆ) ต้องทำอย่างไร?'>
    เส้นทางการยืนยันตัวตนของ Gateway และวิธีการยืนยันตัวตนของ UI ไม่ตรงกัน

    ข้อเท็จจริง (จากโค้ด):

    - Control UI เก็บโทเค็นไว้ใน `sessionStorage` สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL Gateway ที่เลือก ดังนั้นการรีเฟรชในแท็บเดิมยังทำงานได้โดยไม่ต้องกลับไปใช้การคงอยู่ของโทเค็นแบบยาวใน localStorage
    - เมื่อเกิด `AUTH_TOKEN_MISMATCH` ไคลเอนต์ที่เชื่อถือได้สามารถลองใหม่แบบจำกัดหนึ่งครั้งด้วยโทเค็นอุปกรณ์ที่แคชไว้ เมื่อ Gateway ส่งคำใบ้ให้ลองใหม่ (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)
    - การลองใหม่ด้วยโทเค็นที่แคชไว้นั้นตอนนี้ใช้สโคปที่อนุมัติแล้วซึ่งแคชไว้กับโทเค็นอุปกรณ์ซ้ำ ผู้เรียกที่ระบุ `deviceToken` / `scopes` อย่างชัดเจนยังคงใช้ชุดสโคปที่ร้องขอของตนแทนการสืบทอดสโคปที่แคชไว้
    - นอกเส้นทางการลองใหม่นั้น ลำดับความสำคัญของการยืนยันตัวตนในการเชื่อมต่อคือ shared token/password ที่ระบุอย่างชัดเจนก่อน จากนั้นเป็น `deviceToken` ที่ระบุอย่างชัดเจน จากนั้นเป็นโทเค็นอุปกรณ์ที่เก็บไว้ และสุดท้ายเป็น bootstrap token
    - การตรวจสอบสโคปของ bootstrap token มีคำนำหน้าตามบทบาท allowlist ตัวดำเนินการ bootstrap ในตัวตอบสนองเฉพาะคำขอของตัวดำเนินการเท่านั้น; Node หรือบทบาทอื่นที่ไม่ใช่ตัวดำเนินการยังต้องมีสโคปภายใต้คำนำหน้าบทบาทของตนเอง

    วิธีแก้:

    - เร็วที่สุด: `openclaw dashboard` (พิมพ์ + คัดลอก URL แดชบอร์ด, พยายามเปิด; แสดงคำใบ้ SSH หากเป็นเครื่อง headless)
    - หากคุณยังไม่มีโทเค็น: `openclaw doctor --generate-gateway-token`
    - หากเป็นรีโมต ให้ทำ tunnel ก่อน: `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/`
    - โหมด shared-secret: ตั้งค่า `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` แล้ววาง secret ที่ตรงกันในการตั้งค่า Control UI
    - โหมด Tailscale Serve: ตรวจสอบว่าเปิดใช้ `gateway.auth.allowTailscale` แล้ว และคุณกำลังเปิด URL ของ Serve ไม่ใช่ URL loopback/tailnet ดิบที่ข้ามส่วนหัวตัวตนของ Tailscale
    - โหมด trusted-proxy: ตรวจสอบว่าคุณเข้ามาผ่านพร็อกซีที่รู้ตัวตนตามที่กำหนดค่าไว้ ไม่ใช่ URL Gateway ดิบ พร็อกซี local loopback บนโฮสต์เดียวกันยังต้องใช้ `gateway.auth.trustedProxy.allowLoopback = true`
    - หากยังไม่ตรงกันหลังจากลองใหม่หนึ่งครั้ง ให้หมุนเวียน/อนุมัติโทเค็นอุปกรณ์ที่จับคู่ใหม่:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - หากคำสั่ง rotate นั้นบอกว่าถูกปฏิเสธ ให้ตรวจสอบสองเรื่อง:
      - เซสชันอุปกรณ์ที่จับคู่สามารถหมุนเวียนได้เฉพาะอุปกรณ์ **ของตนเอง** เว้นแต่จะมี `operator.admin` ด้วย
      - ค่า `--scope` ที่ระบุอย่างชัดเจนต้องไม่เกินสโคปตัวดำเนินการปัจจุบันของผู้เรียก
    - ยังติดอยู่หรือไม่? รัน `openclaw status --all` และทำตาม [การแก้ไขปัญหา](/th/gateway/troubleshooting) ดู [แดชบอร์ด](/th/web/dashboard) สำหรับรายละเอียดการยืนยันตัวตน

  </Accordion>

  <Accordion title="ฉันตั้งค่า gateway.bind เป็น tailnet แต่ผูกไม่ได้และไม่มีอะไรรับฟังอยู่">
    การผูก `tailnet` เลือก IP ของ Tailscale จากอินเทอร์เฟซเครือข่ายของคุณ (100.64.0.0/10) หากเครื่องไม่ได้อยู่บน Tailscale (หรืออินเทอร์เฟซปิดอยู่) ก็ไม่มีสิ่งใดให้ผูก

    วิธีแก้:

    - เริ่ม Tailscale บนโฮสต์นั้น (เพื่อให้มีที่อยู่ 100.x), หรือ
    - เปลี่ยนเป็น `gateway.bind: "loopback"` / `"lan"`

    หมายเหตุ: `tailnet` เป็นแบบระบุชัดเจน `auto` จะเลือก loopback ก่อน; ใช้ `gateway.bind: "tailnet"` เมื่อคุณต้องการการผูกเฉพาะ tailnet เท่านั้น

  </Accordion>

  <Accordion title="ฉันสามารถรัน Gateway หลายตัวบนโฮสต์เดียวกันได้ไหม?">
    โดยปกติไม่ควร - Gateway หนึ่งตัวสามารถรันช่องทางข้อความและเอเจนต์หลายรายการได้ ใช้ Gateway หลายตัวเฉพาะเมื่อคุณต้องการความซ้ำซ้อน (เช่น บอตกู้คืน) หรือการแยกอย่างเข้มงวด

    ได้ แต่คุณต้องแยกสิ่งเหล่านี้:

    - `OPENCLAW_CONFIG_PATH` (คอนฟิกต่ออินสแตนซ์)
    - `OPENCLAW_STATE_DIR` (สถานะต่ออินสแตนซ์)
    - `agents.defaults.workspace` (การแยก workspace)
    - `gateway.port` (พอร์ตไม่ซ้ำกัน)

    การตั้งค่าอย่างรวดเร็ว (แนะนำ):

    - ใช้ `openclaw --profile <name> ...` ต่ออินสแตนซ์ (สร้าง `~/.openclaw-<name>` อัตโนมัติ)
    - ตั้งค่า `gateway.port` ที่ไม่ซ้ำกันในคอนฟิกของแต่ละโปรไฟล์ (หรือส่ง `--port` สำหรับการรันแบบแมนนวล)
    - ติดตั้งบริการต่อโปรไฟล์: `openclaw --profile <name> gateway install`

    โปรไฟล์ยังต่อท้ายชื่อบริการด้วย (`ai.openclaw.<profile>`; รุ่นเดิม `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`)
    คู่มือฉบับเต็ม: [Gateway หลายตัว](/th/gateway/multiple-gateways)

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008 หมายความว่าอย่างไร?'>
    Gateway เป็น **เซิร์ฟเวอร์ WebSocket** และคาดว่าข้อความแรกสุดจะต้องเป็น
    เฟรม `connect` หากได้รับอย่างอื่น ระบบจะปิดการเชื่อมต่อ
    ด้วย **code 1008** (การละเมิดนโยบาย)

    สาเหตุที่พบบ่อย:

    - คุณเปิด URL **HTTP** ในเบราว์เซอร์ (`http://...`) แทนที่จะใช้ไคลเอนต์ WS
    - คุณใช้พอร์ตหรือพาธผิด
    - พร็อกซีหรือ tunnel ลบส่วนหัวการยืนยันตัวตนออกหรือส่งคำขอที่ไม่ใช่ Gateway

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
    ล็อกไฟล์ (แบบมีโครงสร้าง):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    คุณสามารถตั้งค่าพาธคงที่ผ่าน `logging.file` ระดับล็อกของไฟล์ควบคุมโดย `logging.level` ความละเอียดของคอนโซลควบคุมโดย `--verbose` และ `logging.consoleLevel`

    ดูล็อกต่อเนื่องแบบเร็วที่สุด:

    ```bash
    openclaw logs --follow
    ```

    ล็อกบริการ/supervisor (เมื่อ Gateway รันผ่าน launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` และ `gateway.err.log` (ค่าเริ่มต้น: `~/.openclaw/logs/...`; โปรไฟล์ใช้ `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    ดูเพิ่มเติมที่ [การแก้ไขปัญหา](/th/gateway/troubleshooting)

  </Accordion>

  <Accordion title="ฉันจะเริ่ม/หยุด/รีสตาร์ตบริการ Gateway ได้อย่างไร?">
    ใช้ตัวช่วยของ Gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณรัน Gateway แบบแมนนวล `openclaw gateway --force` สามารถยึดพอร์ตกลับมาได้ ดู [Gateway](/th/gateway)

  </Accordion>

  <Accordion title="ฉันปิดเทอร์มินัลบน Windows ไปแล้ว - จะรีสตาร์ต OpenClaw ได้อย่างไร?">
    มี **สองโหมดการติดตั้งบน Windows**:

    **1) WSL2 (แนะนำ):** Gateway รันภายใน Linux

    เปิด PowerShell, เข้า WSL, แล้วรีสตาร์ต:

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

    หากคุณรันแบบแมนนวล (ไม่มีบริการ) ให้ใช้:

    ```powershell
    openclaw gateway run
    ```

    เอกสาร: [Windows (WSL2)](/th/platforms/windows), [คู่มือการรันบริการ Gateway](/th/gateway)

  </Accordion>

  <Accordion title="Gateway เปิดอยู่แล้วแต่คำตอบไม่เคยมาถึง ควรตรวจสอบอะไร?">
    เริ่มด้วยการตรวจสุขภาพแบบเร็ว:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    สาเหตุที่พบบ่อย:

    - การยืนยันตัวตนของโมเดลไม่ได้โหลดบน **โฮสต์ Gateway** (ตรวจ `models status`)
    - การจับคู่ช่องทาง/allowlist บล็อกคำตอบ (ตรวจคอนฟิกช่องทาง + ล็อก)
    - WebChat/แดชบอร์ดเปิดอยู่โดยไม่มีโทเค็นที่ถูกต้อง

    หากคุณใช้งานแบบรีโมต ให้ยืนยันว่า tunnel/การเชื่อมต่อ Tailscale ทำงานอยู่และ
    WebSocket ของ Gateway เข้าถึงได้

    เอกสาร: [ช่องทาง](/th/channels), [การแก้ไขปัญหา](/th/gateway/troubleshooting), [การเข้าถึงระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - ต้องทำอย่างไร?'>
    โดยปกติหมายความว่า UI สูญเสียการเชื่อมต่อ WebSocket ตรวจสอบ:

    1. Gateway ทำงานอยู่หรือไม่? `openclaw gateway status`
    2. Gateway ปกติดีหรือไม่? `openclaw status`
    3. UI มีโทเค็นที่ถูกต้องหรือไม่? `openclaw dashboard`
    4. หากเป็นรีโมต ลิงก์ tunnel/Tailscale ใช้งานอยู่หรือไม่?

    จากนั้น tail logs:

    ```bash
    openclaw logs --follow
    ```

    เอกสาร: [Dashboard](/th/web/dashboard), [การเข้าถึงระยะไกล](/th/gateway/remote), [การแก้ปัญหา](/th/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands ล้มเหลว ฉันควรตรวจสอบอะไร?">
    เริ่มจาก logs และสถานะช่องทาง:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    จากนั้นเทียบข้อผิดพลาด:

    - `BOT_COMMANDS_TOO_MUCH`: เมนู Telegram มีรายการมากเกินไป OpenClaw ตัดให้เหลือเท่าขีดจำกัดของ Telegram และลองใหม่ด้วยคำสั่งที่น้อยลงแล้ว แต่ยังจำเป็นต้องตัดบางรายการในเมนูออก ลดคำสั่ง Plugin/skill/กำหนดเอง หรือปิดใช้ `channels.telegram.commands.native` หากคุณไม่ต้องการเมนู
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` หรือข้อผิดพลาดเครือข่ายที่คล้ายกัน: หากคุณอยู่บน VPS หรืออยู่หลัง proxy ให้ยืนยันว่าอนุญาต HTTPS ขาออกและ DNS ใช้งานได้กับ `api.telegram.org`

    หาก Gateway อยู่แบบรีโมต ตรวจสอบให้แน่ใจว่าคุณกำลังดู logs บนโฮสต์ Gateway

    เอกสาร: [Telegram](/th/channels/telegram), [การแก้ปัญหาช่องทาง](/th/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI ไม่แสดงเอาต์พุต ฉันควรตรวจสอบอะไร?">
    ก่อนอื่นยืนยันว่าเข้าถึง Gateway ได้และ agent สามารถทำงานได้:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    ใน TUI ใช้ `/status` เพื่อดูสถานะปัจจุบัน หากคุณคาดหวังการตอบกลับในช่องทางแชต
    ตรวจสอบให้แน่ใจว่าเปิดใช้การส่งข้อความแล้ว (`/deliver on`)

    เอกสาร: [TUI](/th/web/tui), [คำสั่ง Slash](/th/tools/slash-commands).

  </Accordion>

  <Accordion title="ฉันจะหยุด Gateway ให้สนิทแล้วเริ่มใหม่ได้อย่างไร?">
    หากคุณติดตั้ง service แล้ว:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    คำสั่งนี้หยุด/เริ่ม **service ที่ถูกควบคุมดูแล** (launchd บน macOS, systemd บน Linux)
    ใช้เมื่อ Gateway ทำงานเบื้องหลังในฐานะ daemon

    หากคุณกำลังรันแบบ foreground ให้หยุดด้วย Ctrl-C แล้วจากนั้น:

    ```bash
    openclaw gateway run
    ```

    เอกสาร: [คู่มือปฏิบัติการ Gateway service](/th/gateway).

  </Accordion>

  <Accordion title="อธิบายแบบง่าย: openclaw gateway restart เทียบกับ openclaw gateway">
    - `openclaw gateway restart`: รีสตาร์ท **background service** (launchd/systemd)
    - `openclaw gateway`: รัน gateway **ใน foreground** สำหรับเซสชัน terminal นี้

    หากคุณติดตั้ง service แล้ว ให้ใช้คำสั่ง gateway ใช้ `openclaw gateway` เมื่อ
    คุณต้องการรันครั้งเดียวแบบ foreground

  </Accordion>

  <Accordion title="วิธีที่เร็วที่สุดในการดูรายละเอียดเพิ่มเติมเมื่อบางอย่างล้มเหลว">
    เริ่ม Gateway ด้วย `--verbose` เพื่อให้ได้รายละเอียดใน console มากขึ้น จากนั้นตรวจสอบไฟล์ log สำหรับข้อผิดพลาดเกี่ยวกับการยืนยันตัวตนของช่องทาง การกำหนดเส้นทาง model และ RPC
  </Accordion>
</AccordionGroup>

## สื่อและไฟล์แนบ

<AccordionGroup>
  <Accordion title="skill ของฉันสร้างภาพ/PDF แต่ไม่มีอะไรถูกส่ง">
    ไฟล์แนบขาออกจาก agent ต้องมีบรรทัด `MEDIA:<path-or-url>` (อยู่ในบรรทัดของตัวเอง) ดู [การตั้งค่า OpenClaw assistant](/th/start/openclaw) และ [Agent send](/th/tools/agent-send)

    การส่งด้วย CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    ตรวจสอบเพิ่มเติม:

    - ช่องทางเป้าหมายรองรับสื่อขาออกและไม่ถูกบล็อกโดย allowlists
    - ไฟล์อยู่ภายในขีดจำกัดขนาดของ provider (ภาพจะถูกปรับขนาดเป็นสูงสุด 2048px)
    - `tools.fs.workspaceOnly=true` จำกัดการส่งด้วย local path ให้อยู่ใน workspace, temp/media-store และไฟล์ที่ผ่านการตรวจสอบ sandbox
    - `tools.fs.workspaceOnly=false` อนุญาตให้ `MEDIA:` ส่งไฟล์ host-local ที่ agent อ่านได้อยู่แล้ว แต่เฉพาะสื่อและชนิดเอกสารที่ปลอดภัย (ภาพ, เสียง, วิดีโอ, PDF และเอกสาร Office) ไฟล์ข้อความล้วนและไฟล์ที่ดูเหมือนเป็นความลับยังคงถูกบล็อก

    ดู [ภาพ](/th/nodes/images).

  </Accordion>
</AccordionGroup>

## ความปลอดภัยและการควบคุมการเข้าถึง

<AccordionGroup>
  <Accordion title="ปลอดภัยไหมที่จะเปิด OpenClaw ให้รับ DM ขาเข้า?">
    ให้ถือว่า DM ขาเข้าเป็นข้อมูลนำเข้าที่ไม่น่าเชื่อถือ ค่าเริ่มต้นถูกออกแบบมาเพื่อลดความเสี่ยง:

    - พฤติกรรมเริ่มต้นบนช่องทางที่รองรับ DM คือ **การจับคู่**:
      - ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่; bot จะไม่ประมวลผลข้อความของพวกเขา
      - อนุมัติด้วย: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - คำขอที่รอดำเนินการถูกจำกัดไว้ที่ **3 ต่อช่องทาง**; ตรวจสอบ `openclaw pairing list --channel <channel> [--account <id>]` หากรหัสไม่มาถึง
    - การเปิด DM แบบสาธารณะต้องเลือกเปิดอย่างชัดเจน (`dmPolicy: "open"` และ allowlist `"*"`)

    รัน `openclaw doctor` เพื่อแสดงนโยบาย DM ที่มีความเสี่ยง

  </Accordion>

  <Accordion title="prompt injection เป็นปัญหาเฉพาะ bot สาธารณะเท่านั้นหรือไม่?">
    ไม่ใช่ Prompt injection เกี่ยวกับ **เนื้อหาที่ไม่น่าเชื่อถือ** ไม่ใช่แค่ว่าใคร DM หา bot ได้
    หาก assistant ของคุณอ่านเนื้อหาภายนอก (web search/fetch, หน้า browser, อีเมล,
    เอกสาร, ไฟล์แนบ, logs ที่วางเข้ามา) เนื้อหานั้นอาจมีคำสั่งที่พยายาม
    ยึดควบคุม model ได้ สิ่งนี้เกิดขึ้นได้แม้ว่า **คุณจะเป็นผู้ส่งเพียงคนเดียว**

    ความเสี่ยงสูงสุดคือเมื่อเปิดใช้ tools: model อาจถูกหลอกให้
    exfiltrate context หรือเรียก tools แทนคุณ ลดขอบเขตผลกระทบโดย:

    - ใช้ agent "reader" แบบอ่านอย่างเดียวหรือปิด tools เพื่อสรุปเนื้อหาที่ไม่น่าเชื่อถือ
    - ปิด `web_search` / `web_fetch` / `browser` สำหรับ agent ที่เปิดใช้ tools
    - ถือว่าข้อความจากไฟล์/เอกสารที่ถอดรหัสแล้วไม่น่าเชื่อถือด้วย: OpenResponses
      `input_file` และการดึงข้อมูลจาก media attachment ต่างห่อข้อความที่สกัดได้ไว้ใน
      marker ขอบเขต external-content ที่ชัดเจน แทนการส่งข้อความไฟล์ดิบ
    - ใช้ sandboxing และ tool allowlists ที่เข้มงวด

    รายละเอียด: [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="bot ของฉันควรมีอีเมล บัญชี GitHub หรือหมายเลขโทรศัพท์ของตัวเองหรือไม่?">
    ควร สำหรับการตั้งค่าส่วนใหญ่ การแยก bot ด้วยบัญชีและหมายเลขโทรศัพท์ต่างหาก
    ช่วยลดขอบเขตผลกระทบหากเกิดปัญหา และยังทำให้หมุนเวียน
    credentials หรือเพิกถอนการเข้าถึงได้ง่ายขึ้นโดยไม่กระทบบัญชีส่วนตัวของคุณ

    เริ่มจากเล็ก ๆ ให้สิทธิ์เข้าถึงเฉพาะ tools และบัญชีที่คุณต้องใช้จริง แล้วค่อยขยาย
    ภายหลังหากจำเป็น

    เอกสาร: [ความปลอดภัย](/th/gateway/security), [การจับคู่](/th/channels/pairing).

  </Accordion>

  <Accordion title="ฉันให้มันมีอิสระเหนือข้อความของฉันได้ไหม และปลอดภัยหรือไม่?">
    เรา **ไม่** แนะนำให้ให้อิสระเต็มรูปแบบเหนือข้อความส่วนตัวของคุณ รูปแบบที่ปลอดภัยที่สุดคือ:

    - ให้ DM อยู่ใน **โหมดการจับคู่** หรือ allowlist ที่เข้มงวด
    - ใช้ **หมายเลขหรือบัญชีแยกต่างหาก** หากคุณต้องการให้มันส่งข้อความแทนคุณ
    - ให้มันร่างก่อน แล้ว **อนุมัติก่อนส่ง**

    หากคุณต้องการทดลอง ให้ทำบนบัญชีเฉพาะและแยกไว้ต่างหาก ดู
    [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="ฉันใช้ model ที่ถูกกว่าสำหรับงาน personal assistant ได้ไหม?">
    ได้ **หาก** agent เป็นแบบ chat-only และข้อมูลนำเข้าน่าเชื่อถือ tier ที่เล็กกว่า
    มีโอกาสถูก instruction hijacking ได้ง่ายกว่า ดังนั้นหลีกเลี่ยงการใช้กับ agent ที่เปิดใช้ tools
    หรือเมื่ออ่านข้อความที่ไม่น่าเชื่อถือ หากจำเป็นต้องใช้ model ที่เล็กกว่า ให้ล็อก down
    tools และรันภายใน sandbox ดู [ความปลอดภัย](/th/gateway/security).
  </Accordion>

  <Accordion title="ฉันรัน /start ใน Telegram แต่ไม่ได้รับรหัสจับคู่">
    รหัสจับคู่จะถูกส่ง **เฉพาะ** เมื่อผู้ส่งที่ไม่รู้จักส่งข้อความหา bot และ
    เปิดใช้ `dmPolicy: "pairing"` อยู่ `/start` เพียงอย่างเดียวไม่ได้สร้างรหัส

    ตรวจสอบคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list telegram
    ```

    หากคุณต้องการเข้าถึงทันที ให้เพิ่ม sender id ของคุณใน allowlist หรือตั้ง `dmPolicy: "open"`
    สำหรับบัญชีนั้น

  </Accordion>

  <Accordion title="WhatsApp: มันจะส่งข้อความหาผู้ติดต่อของฉันไหม? การจับคู่ทำงานอย่างไร?">
    ไม่ นโยบาย DM เริ่มต้นของ WhatsApp คือ **การจับคู่** ผู้ส่งที่ไม่รู้จักจะได้รับเพียงรหัสจับคู่ และข้อความของพวกเขา **จะไม่ถูกประมวลผล** OpenClaw ตอบกลับเฉพาะแชตที่ได้รับหรือการส่งที่คุณเรียกอย่างชัดเจนเท่านั้น

    อนุมัติการจับคู่ด้วย:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    แสดงคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list whatsapp
    ```

    prompt หมายเลขโทรศัพท์ใน wizard: ใช้เพื่อตั้งค่า **allowlist/owner** ของคุณ เพื่อให้ DM ของคุณเองได้รับอนุญาต ไม่ได้ใช้สำหรับการส่งอัตโนมัติ หากคุณรันบนหมายเลข WhatsApp ส่วนตัวของคุณ ให้ใช้หมายเลขนั้นและเปิดใช้ `channels.whatsapp.selfChatMode`

  </Accordion>
</AccordionGroup>

## คำสั่งแชต การยกเลิกงาน และ "มันไม่ยอมหยุด"

<AccordionGroup>
  <Accordion title="ฉันจะหยุดข้อความระบบภายในไม่ให้แสดงในแชตได้อย่างไร?">
    ข้อความภายในหรือข้อความ tool ส่วนใหญ่จะแสดงเฉพาะเมื่อเปิดใช้ **verbose**, **trace** หรือ **reasoning**
    สำหรับเซสชันนั้น

    แก้ในแชตที่คุณเห็น:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    หากยังมีเสียงรบกวน ให้ตรวจสอบการตั้งค่าเซสชันใน Control UI และตั้งค่า verbose
    เป็น **inherit** และยืนยันว่าคุณไม่ได้ใช้ bot profile ที่ตั้ง `verboseDefault` เป็น
    `on` ใน config

    เอกสาร: [Thinking and verbose](/th/tools/thinking), [ความปลอดภัย](/th/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="ฉันจะหยุด/ยกเลิกงานที่กำลังรันอยู่ได้อย่างไร?">
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

    สำหรับกระบวนการเบื้องหลัง (จาก exec tool) คุณสามารถขอให้ agent รัน:

    ```
    process action:kill sessionId:XXX
    ```

    ภาพรวมคำสั่ง Slash: ดู [คำสั่ง Slash](/th/tools/slash-commands).

    คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความ **เดี่ยว** ที่ขึ้นต้นด้วย `/` แต่ shortcut บางรายการ (เช่น `/status`) ก็ใช้แบบ inline ได้สำหรับผู้ส่งที่อยู่ใน allowlist

  </Accordion>

  <Accordion title='ฉันจะส่งข้อความ Discord จาก Telegram ได้อย่างไร? ("Cross-context messaging denied")'>
    OpenClaw บล็อกการส่งข้อความ **ข้าม provider** ตามค่าเริ่มต้น หาก tool call ถูกผูกกับ
    Telegram มันจะไม่ส่งไปยัง Discord เว้นแต่คุณจะอนุญาตอย่างชัดเจน

    เปิดใช้การส่งข้อความข้าม provider สำหรับ agent:

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

  <Accordion title='ทำไมรู้สึกเหมือน bot "เมิน" ข้อความที่ส่งถี่ ๆ?'>
    โหมด queue ควบคุมว่าข้อความใหม่โต้ตอบกับ run ที่กำลังดำเนินอยู่ได้อย่างไร ใช้ `/queue` เพื่อเปลี่ยนโหมด:

    - `steer` - queue steering ที่รอดำเนินการทั้งหมดสำหรับ boundary ถัดไปของ model ใน run ปัจจุบัน
    - `queue` - steering แบบเดิมทีละรายการ
    - `followup` - รันข้อความทีละรายการ
    - `collect` - รวมข้อความเป็น batch แล้วตอบครั้งเดียว
    - `steer-backlog` - steer ตอนนี้ แล้วจึงประมวลผล backlog
    - `interrupt` - ยกเลิก run ปัจจุบันแล้วเริ่มใหม่

    โหมดเริ่มต้นคือ `steer` คุณสามารถเพิ่มตัวเลือกเช่น `debounce:0.5s cap:25 drop:summarize` สำหรับโหมด followup ได้ ดู [Command queue](/th/concepts/queue) และ [Steering queue](/th/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## เบ็ดเตล็ด

<AccordionGroup>
  <Accordion title='โมเดลเริ่มต้นสำหรับ Anthropic ที่ใช้ API key คืออะไร?'>
    ใน OpenClaw ข้อมูลประจำตัวและการเลือกโมเดลเป็นคนละส่วนกัน การตั้งค่า `ANTHROPIC_API_KEY` (หรือจัดเก็บ Anthropic API key ใน auth profiles) จะเปิดใช้งานการยืนยันตัวตน แต่โมเดลเริ่มต้นจริงคือโมเดลที่คุณกำหนดค่าไว้ใน `agents.defaults.model.primary` (เช่น `anthropic/claude-sonnet-4-6` หรือ `anthropic/claude-opus-4-6`) หากคุณเห็น `No credentials found for profile "anthropic:default"` หมายความว่า Gateway ไม่พบข้อมูลประจำตัวของ Anthropic ใน `auth-profiles.json` ที่คาดไว้สำหรับเอเจนต์ที่กำลังทำงานอยู่
  </Accordion>
</AccordionGroup>

---

ยังติดอยู่ใช่ไหม? ถามใน [Discord](https://discord.com/invite/clawd) หรือเปิด [GitHub discussion](https://github.com/openclaw/openclaw/discussions)

## ที่เกี่ยวข้อง

- [คำถามที่พบบ่อยเกี่ยวกับการใช้งานครั้งแรก](/th/help/faq-first-run) — การติดตั้ง, การเริ่มใช้งาน, auth, การสมัครใช้งาน, ความล้มเหลวช่วงแรก
- [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models) — การเลือกโมเดล, failover, auth profiles
- [การแก้ไขปัญหา](/th/help/troubleshooting) — การคัดแยกปัญหาโดยเริ่มจากอาการ
