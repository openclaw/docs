---
read_when:
    - การตอบคำถามสนับสนุนทั่วไปเกี่ยวกับการตั้งค่า การติดตั้ง การเริ่มต้นใช้งาน หรือรันไทม์
    - คัดแยกปัญหาที่ผู้ใช้รายงานก่อนการดีบักเชิงลึก
summary: คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า การกำหนดค่า และการใช้งาน OpenClaw
title: คำถามที่พบบ่อย
x-i18n:
    generated_at: "2026-05-10T19:42:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121de36647f7452969b760d6b6ab0a6b1b776d63987ca6ba0be1c8cf4c9f85e9
    source_path: help/faq.md
    workflow: 16
---

คำตอบด่วนพร้อมการแก้ไขปัญหาเชิงลึกสำหรับการตั้งค่าในโลกจริง (การพัฒนาในเครื่อง, VPS, หลายเอเจนต์, OAuth/API keys, การสลับโมเดลสำรองเมื่อล้มเหลว) สำหรับการวินิจฉัยรันไทม์ โปรดดู [การแก้ไขปัญหา](/th/gateway/troubleshooting) สำหรับข้อมูลอ้างอิงการกำหนดค่าทั้งหมด โปรดดู [การกำหนดค่า](/th/gateway/configuration)

## 60 วินาทีแรกเมื่อมีบางอย่างเสีย

1. **สถานะด่วน (ตรวจสอบก่อน)**

   ```bash
   openclaw status
   ```

   สรุปข้อมูลในเครื่องอย่างรวดเร็ว: OS + อัปเดต, การเข้าถึง gateway/service, agents/sessions, provider config + ปัญหารันไทม์ (เมื่อเข้าถึง Gateway ได้)

2. **รายงานที่วางได้ทันที (แชร์ได้อย่างปลอดภัย)**

   ```bash
   openclaw status --all
   ```

   การวินิจฉัยแบบอ่านอย่างเดียวพร้อมส่วนท้ายของ log (ปิดบัง tokens แล้ว)

3. **สถานะ Daemon + พอร์ต**

   ```bash
   openclaw gateway status
   ```

   แสดง supervisor runtime เทียบกับการเข้าถึง RPC, URL เป้าหมายของ probe และ config ที่ service น่าจะใช้

4. **Probe เชิงลึก**

   ```bash
   openclaw status --deep
   ```

   รัน health probe ของ Gateway แบบสด รวมถึง channel probes เมื่อรองรับ
   (ต้องมี Gateway ที่เข้าถึงได้) ดู [Health](/th/gateway/health)

5. **ติดตาม log ล่าสุด**

   ```bash
   openclaw logs --follow
   ```

   หาก RPC ล่ม ให้ใช้วิธีสำรอง:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   File logs แยกจาก service logs; ดู [Logging](/th/logging) และ [การแก้ไขปัญหา](/th/gateway/troubleshooting)

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

   ขอ snapshot แบบเต็มจาก Gateway ที่กำลังรันอยู่ (WS-only) ดู [Health](/th/gateway/health)

## เริ่มต้นใช้งานด่วนและการตั้งค่าครั้งแรก

ถามตอบสำหรับการใช้งานครั้งแรก — การติดตั้ง, onboarding, เส้นทาง auth, subscriptions, ความล้มเหลวเริ่มต้น —
อยู่ที่ [FAQ สำหรับการใช้งานครั้งแรก](/th/help/faq-first-run)

## OpenClaw คืออะไร?

<AccordionGroup>
  <Accordion title="OpenClaw คืออะไร ในหนึ่งย่อหน้า?">
    OpenClaw คือผู้ช่วย AI ส่วนตัวที่คุณรันบนอุปกรณ์ของคุณเอง ตอบกลับบนพื้นผิวการส่งข้อความที่คุณใช้อยู่แล้ว (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat และ channel plugins ที่รวมมาให้ เช่น QQ Bot) และยังสามารถใช้งานเสียง + Canvas แบบสดบนแพลตฟอร์มที่รองรับได้ด้วย **Gateway** คือ control plane ที่เปิดทำงานตลอดเวลา; ผู้ช่วยคือผลิตภัณฑ์
  </Accordion>

  <Accordion title="คุณค่าที่นำเสนอ">
    OpenClaw ไม่ใช่ "แค่ wrapper ของ Claude" แต่เป็น **control plane แบบ local-first** ที่ให้คุณรัน
    ผู้ช่วยที่มีความสามารถบน **ฮาร์ดแวร์ของคุณเอง** เข้าถึงได้จากแอปแชตที่คุณใช้อยู่แล้ว พร้อม
    sessions ที่มี state, memory และ tools - โดยไม่ต้องส่งมอบการควบคุม workflows ของคุณให้กับ
    SaaS ที่โฮสต์ให้

    จุดเด่น:

    - **อุปกรณ์ของคุณ ข้อมูลของคุณ:** รัน Gateway ที่ใดก็ได้ตามต้องการ (Mac, Linux, VPS) และเก็บ
      workspace + session history ไว้ในเครื่อง
    - **Channels จริง ไม่ใช่ web sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      พร้อมเสียงบนมือถือและ Canvas บนแพลตฟอร์มที่รองรับ
    - **ไม่ผูกกับโมเดลใดโมเดลหนึ่ง:** ใช้ Anthropic, OpenAI, MiniMax, OpenRouter ฯลฯ พร้อม routing
      และ failover แยกตาม agent
    - **ตัวเลือกเฉพาะในเครื่อง:** รันโมเดลในเครื่องเพื่อให้ **ข้อมูลทั้งหมดอยู่บนอุปกรณ์ของคุณได้** หากต้องการ
    - **การกำหนดเส้นทางแบบหลายเอเจนต์:** แยก agents ตาม channel, account หรือ task โดยแต่ละตัวมี
      workspace และค่าเริ่มต้นของตัวเอง
    - **โอเพนซอร์สและปรับแต่งได้:** ตรวจสอบ ขยาย และ self-host ได้โดยไม่ติด vendor lock-in

    เอกสาร: [Gateway](/th/gateway), [Channels](/th/channels), [หลายเอเจนต์](/th/concepts/multi-agent),
    [Memory](/th/concepts/memory)

  </Accordion>

  <Accordion title="ฉันเพิ่งตั้งค่าเสร็จ - ควรทำอะไรก่อน?">
    โปรเจกต์เริ่มต้นที่ดี:

    - สร้างเว็บไซต์ (WordPress, Shopify หรือเว็บไซต์ static แบบง่าย)
    - ทำ prototype แอปมือถือ (โครงร่าง, screens, แผน API)
    - จัดระเบียบไฟล์และโฟลเดอร์ (cleanup, naming, tagging)
    - เชื่อมต่อ Gmail และทำสรุปหรือ follow ups อัตโนมัติ

    มันจัดการงานขนาดใหญ่ได้ แต่จะทำงานได้ดีที่สุดเมื่อคุณแบ่งงานเป็นช่วง ๆ และ
    ใช้ sub agents สำหรับงานคู่ขนาน

  </Accordion>

  <Accordion title="กรณีใช้งานประจำวัน 5 อันดับแรกของ OpenClaw คืออะไร?">
    ประโยชน์ในชีวิตประจำวันมักมีลักษณะเช่นนี้:

    - **สรุปข้อมูลส่วนตัว:** สรุป inbox, calendar และข่าวที่คุณสนใจ
    - **ค้นคว้าและร่าง:** ค้นคว้าอย่างรวดเร็ว สรุป และร่างฉบับแรกสำหรับอีเมลหรือเอกสาร
    - **เตือนความจำและติดตามผล:** การสะกิดและ checklist ที่ขับเคลื่อนด้วย cron หรือ heartbeat
    - **ระบบอัตโนมัติบนเบราว์เซอร์:** กรอกฟอร์ม รวบรวมข้อมูล และทำงานบนเว็บซ้ำ ๆ
    - **การประสานงานข้ามอุปกรณ์:** ส่ง task จากโทรศัพท์ ให้ Gateway รันบนเซิร์ฟเวอร์ แล้วรับผลลัพธ์กลับในแชต

  </Accordion>

  <Accordion title="OpenClaw ช่วยเรื่อง lead gen, outreach, ads และ blogs สำหรับ SaaS ได้ไหม?">
    ได้สำหรับ **การค้นคว้า การคัดกรอง และการร่าง** มันสามารถสแกนเว็บไซต์ สร้าง shortlists
    สรุป prospects และเขียนร่าง outreach หรือ ad copy ได้

    สำหรับ **การรัน outreach หรือ ads** ให้มีมนุษย์อยู่ในวงจรเสมอ หลีกเลี่ยง spam ปฏิบัติตามกฎหมายท้องถิ่นและ
    นโยบายแพลตฟอร์ม และตรวจทานทุกอย่างก่อนส่ง รูปแบบที่ปลอดภัยที่สุดคือให้
    OpenClaw ร่าง แล้วคุณอนุมัติ

    เอกสาร: [Security](/th/gateway/security)

  </Accordion>

  <Accordion title="ข้อได้เปรียบเมื่อเทียบกับ Claude Code สำหรับการพัฒนาเว็บคืออะไร?">
    OpenClaw คือ **ผู้ช่วยส่วนตัว** และชั้นประสานงาน ไม่ใช่ตัวแทน IDE ใช้
    Claude Code หรือ Codex สำหรับลูปการเขียนโค้ดโดยตรงที่เร็วที่สุดภายใน repo ใช้ OpenClaw เมื่อคุณ
    ต้องการ memory ที่คงอยู่ การเข้าถึงข้ามอุปกรณ์ และการจัดการเครื่องมือร่วมกัน

    ข้อได้เปรียบ:

    - **Memory + workspace ที่คงอยู่** ข้าม sessions
    - **การเข้าถึงหลายแพลตฟอร์ม** (WhatsApp, Telegram, TUI, WebChat)
    - **การจัดการเครื่องมือร่วมกัน** (เบราว์เซอร์, ไฟล์, scheduling, hooks)
    - **Gateway ที่เปิดทำงานตลอดเวลา** (รันบน VPS, โต้ตอบจากที่ใดก็ได้)
    - **Nodes** สำหรับ browser/screen/camera/exec ในเครื่อง

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills และ automation

<AccordionGroup>
  <Accordion title="ฉันจะปรับแต่ง skills โดยไม่ทำให้ repo สกปรกได้อย่างไร?">
    ใช้ managed overrides แทนการแก้ไขสำเนาใน repo ใส่การเปลี่ยนแปลงของคุณใน `~/.openclaw/skills/<name>/SKILL.md` (หรือเพิ่มโฟลเดอร์ผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json`) ลำดับความสำคัญคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` ดังนั้น managed overrides ยังชนะ skills ที่ bundled มาโดยไม่แตะ git หากคุณต้องการให้ติดตั้ง skill แบบ global แต่เห็นได้เฉพาะบาง agents ให้เก็บสำเนาที่แชร์ไว้ใน `~/.openclaw/skills` และควบคุมการมองเห็นด้วย `agents.defaults.skills` และ `agents.list[].skills` เฉพาะการแก้ไขที่ควร upstream เท่านั้นที่ควรอยู่ใน repo และส่งออกเป็น PRs
  </Accordion>

  <Accordion title="ฉันโหลด skills จากโฟลเดอร์กำหนดเองได้ไหม?">
    ได้ เพิ่มไดเรกทอรีเพิ่มเติมผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json` (ลำดับความสำคัญต่ำสุด) ลำดับความสำคัญเริ่มต้นคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` `clawhub` ติดตั้งลงใน `./skills` โดยค่าเริ่มต้น ซึ่ง OpenClaw ถือเป็น `<workspace>/skills` ใน session ถัดไป หาก skill ควรเห็นได้เฉพาะบาง agents ให้จับคู่กับ `agents.defaults.skills` หรือ `agents.list[].skills`
  </Accordion>

  <Accordion title="ฉันจะใช้โมเดลต่างกันสำหรับงานต่างกันได้อย่างไร?">
    วันนี้รูปแบบที่รองรับคือ:

    - **Cron jobs**: isolated jobs สามารถตั้งค่า override `model` ต่อ job ได้
    - **Sub-agents**: ส่ง task ไปยัง agents แยกกันที่มีโมเดลเริ่มต้นต่างกัน
    - **สลับตามต้องการ**: ใช้ `/model` เพื่อสลับโมเดลของ session ปัจจุบันได้ทุกเมื่อ

    ดู [Cron jobs](/th/automation/cron-jobs), [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent) และ [คำสั่ง Slash](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="บอทค้างระหว่างทำงานหนัก ฉันจะย้ายงานออกไปได้อย่างไร?">
    ใช้ **sub-agents** สำหรับงานยาวหรืองานคู่ขนาน Sub-agents รันใน session ของตัวเอง
    ส่งสรุปกลับมา และทำให้แชตหลักของคุณยังตอบสนองได้

    ขอให้บอทของคุณ "spawn a sub-agent for this task" หรือใช้ `/subagents`
    ใช้ `/status` ในแชตเพื่อดูว่า Gateway กำลังทำอะไรอยู่ตอนนี้ (และยุ่งอยู่หรือไม่)

    เคล็ดลับเรื่อง token: งานยาวและ sub-agents ต่างก็ใช้ tokens หากกังวลเรื่องค่าใช้จ่าย ให้ตั้งค่า
    โมเดลที่ถูกกว่าสำหรับ sub-agents ผ่าน `agents.defaults.subagents.model`

    เอกสาร: [Sub-agents](/th/tools/subagents), [Background Tasks](/th/automation/tasks)

  </Accordion>

  <Accordion title="sessions ของ subagent ที่ผูกกับ thread ทำงานอย่างไรบน Discord?">
    ใช้ thread bindings คุณสามารถ bind thread ของ Discord กับ subagent หรือ session target เพื่อให้ข้อความติดตามผลใน thread นั้นอยู่บน session ที่ bind ไว้

    Flow พื้นฐาน:

    - Spawn ด้วย `sessions_spawn` โดยใช้ `thread: true` (และเลือกใช้ `mode: "session"` สำหรับ follow-up ที่คงอยู่)
    - หรือ bind ด้วยตนเองด้วย `/focus <target>`
    - ใช้ `/agents` เพื่อตรวจสอบสถานะ binding
    - ใช้ `/session idle <duration|off>` และ `/session max-age <duration|off>` เพื่อควบคุม auto-unfocus
    - ใช้ `/unfocus` เพื่อ detach thread

    Config ที่ต้องใช้:

    - ค่าเริ่มต้น global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
    - Overrides ของ Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`
    - Auto-bind เมื่อ spawn: `channels.discord.threadBindings.spawnSessions` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เพื่อปิดการ spawn session ที่ผูกกับ thread

    เอกสาร: [Sub-agents](/th/tools/subagents), [Discord](/th/channels/discord), [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference), [คำสั่ง Slash](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="subagent ทำเสร็จแล้ว แต่ completion update ไปผิดที่หรือไม่เคยโพสต์ ควรตรวจอะไร?">
    ตรวจ requester route ที่ resolve แล้วก่อน:

    - การส่งมอบ subagent แบบ completion-mode จะเลือก thread ที่ bind ไว้หรือ conversation route หากมีอยู่ก่อน
    - หาก completion origin มีแค่ channel, OpenClaw จะ fallback ไปยัง route ที่เก็บไว้ของ requester session (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้การส่งตรงยังสำเร็จได้
    - หากไม่มีทั้ง route ที่ bind ไว้และ route ที่เก็บไว้ซึ่งใช้ได้ การส่งตรงอาจล้มเหลว และผลลัพธ์จะ fallback ไปยัง queued session delivery แทนการโพสต์ไปยังแชตทันที
    - targets ที่ไม่ถูกต้องหรือเก่าเกินไปยังอาจบังคับให้ fallback ไปยังคิวหรือทำให้การส่งมอบสุดท้ายล้มเหลวได้
    - หากคำตอบ assistant ล่าสุดที่มองเห็นของ child เป็น silent token ตรงตัว `NO_REPLY` / `no_reply` หรือเป็น `ANNOUNCE_SKIP` ตรงตัว OpenClaw จะตั้งใจระงับ announce แทนการโพสต์ความคืบหน้าก่อนหน้าที่เก่าแล้ว
    - หาก child หมดเวลาหลังจากมีเพียง tool calls announce อาจยุบสิ่งนั้นเป็นสรุปความคืบหน้าบางส่วนแบบสั้น แทนการเล่น raw tool output ซ้ำ

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [Sub-agents](/th/tools/subagents), [Background Tasks](/th/automation/tasks), [Session Tools](/th/concepts/session-tool)

  </Accordion>

  <Accordion title="Cron หรือ reminders ไม่ทำงาน ควรตรวจอะไร?">
    Cron รันภายใน process ของ Gateway หาก Gateway ไม่ได้รันอย่างต่อเนื่อง
    scheduled jobs จะไม่รัน

    Checklist:

    - ยืนยันว่า cron เปิดใช้งานอยู่ (`cron.enabled`) และไม่ได้ตั้งค่า `OPENCLAW_SKIP_CRON`
    - ตรวจว่า Gateway รัน 24/7 (ไม่ sleep/restart)
    - ตรวจสอบการตั้งค่า timezone สำหรับ job (`--tz` เทียบกับ timezone ของ host)

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    เอกสาร: [Cron jobs](/th/automation/cron-jobs), [Automation & Tasks](/th/automation)

  </Accordion>

  <Accordion title="Cron ทำงานแล้ว แต่ไม่มีอะไรถูกส่งไปยังช่อง ทำไม?">
    ตรวจสอบโหมดการส่งก่อน:

    - `--no-deliver` / `delivery.mode: "none"` หมายความว่าไม่ควรมีการส่งสำรองจาก runner
    - เป้าหมายประกาศหายไปหรือไม่ถูกต้อง (`channel` / `to`) หมายความว่า runner ข้ามการส่งออกภายนอก
    - ความล้มเหลวในการยืนยันตัวตนของช่อง (`unauthorized`, `Forbidden`) หมายความว่า runner พยายามส่งแล้ว แต่ข้อมูลประจำตัวขัดขวางไว้
    - ผลลัพธ์แบบแยกที่เงียบ (`NO_REPLY` / `no_reply` เท่านั้น) จะถือว่าตั้งใจให้ส่งไม่ได้ ดังนั้น runner จึงระงับการส่งสำรองที่อยู่ในคิวด้วย

    สำหรับงาน cron แบบแยก agent ยังสามารถส่งโดยตรงด้วยเครื่องมือ `message`
    เมื่อมีเส้นทางแชตพร้อมใช้งาน `--announce` ควบคุมเฉพาะเส้นทางสำรองของ runner
    สำหรับข้อความสุดท้ายที่ agent ยังไม่ได้ส่งเอง

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [งานเบื้องหลัง](/th/automation/tasks).

  </Accordion>

  <Accordion title="ทำไมการรัน cron แบบแยกจึงเปลี่ยนโมเดลหรือลองซ้ำหนึ่งครั้ง?">
    โดยปกตินั่นคือเส้นทางเปลี่ยนโมเดลแบบสด ไม่ใช่การจัดตารางซ้ำ

    cron แบบแยกสามารถบันทึกการส่งต่อโมเดลรันไทม์และลองซ้ำได้เมื่อการรันที่ใช้งานอยู่
    โยน `LiveSessionModelSwitchError` การลองซ้ำจะคง provider/model ที่เปลี่ยนแล้วไว้
    และถ้าการเปลี่ยนนั้นมีการแทนที่โปรไฟล์ auth ใหม่ cron
    จะบันทึกสิ่งนั้นไว้ก่อนลองซ้ำด้วย

    กฎการเลือกที่เกี่ยวข้อง:

    - การแทนที่โมเดลของ hook Gmail มีสิทธิ์ก่อนเมื่อใช้ได้
    - จากนั้น `model` รายงาน
    - จากนั้นการแทนที่โมเดล cron-session ที่เก็บไว้
    - จากนั้นการเลือกโมเดล agent/default ตามปกติ

    ลูปการลองซ้ำมีขอบเขตจำกัด หลังจากความพยายามครั้งแรกบวกกับการลองซ้ำจากการเปลี่ยน 2 ครั้ง
    cron จะยกเลิกแทนที่จะวนไปตลอด

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [CLI cron](/th/cli/cron).

  </Accordion>

  <Accordion title="ฉันติดตั้ง Skills บน Linux ได้อย่างไร?">
    ใช้คำสั่ง `openclaw skills` แบบ native หรือวาง Skills ลงใน workspace ของคุณ UI ของ Skills บน macOS ไม่มีให้ใช้บน Linux
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

    `openclaw skills install` แบบ native จะเขียนลงในไดเรกทอรี `skills/`
    ของ workspace ที่ใช้งานอยู่ ติดตั้ง CLI `clawhub` แยกต่างหากเฉพาะเมื่อคุณต้องการเผยแพร่หรือ
    ซิงก์ Skills ของคุณเอง สำหรับการติดตั้งที่ใช้ร่วมกันระหว่าง agents ให้วาง skill ไว้ใต้
    `~/.openclaw/skills` และใช้ `agents.defaults.skills` หรือ
    `agents.list[].skills` หากคุณต้องการจำกัดว่า agent ใดมองเห็นได้

  </Accordion>

  <Accordion title="OpenClaw สามารถรันงานตามตารางหรือรันต่อเนื่องในเบื้องหลังได้ไหม?">
    ได้ ใช้ตัวจัดตารางของ Gateway:

    - **งาน Cron** สำหรับงานตามตารางหรือเกิดซ้ำ (คงอยู่ข้ามการรีสตาร์ท)
    - **Heartbeat** สำหรับการตรวจสอบเป็นระยะของ "เซสชันหลัก"
    - **งานแบบแยก** สำหรับ agents อัตโนมัติที่โพสต์สรุปหรือส่งไปยังแชต

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [ระบบอัตโนมัติและงาน](/th/automation),
    [Heartbeat](/th/gateway/heartbeat).

  </Accordion>

  <Accordion title="ฉันรัน Skills ที่ใช้ได้เฉพาะ Apple macOS จาก Linux ได้ไหม?">
    ไม่ได้โดยตรง Skills ของ macOS ถูกกำกับด้วย `metadata.openclaw.os` พร้อมกับไบนารีที่จำเป็น และ Skills จะปรากฏใน system prompt เฉพาะเมื่อมีสิทธิ์ใช้งานบน **โฮสต์ Gateway** บน Linux, Skills ที่ใช้ได้เฉพาะ `darwin` (เช่น `apple-notes`, `apple-reminders`, `things-mac`) จะไม่โหลด เว้นแต่คุณจะแทนที่การกำกับนั้น

    คุณมีรูปแบบที่รองรับสามแบบ:

    **ตัวเลือก A - รัน Gateway บน Mac (ง่ายที่สุด).**
    รัน Gateway ในที่ที่มีไบนารีของ macOS อยู่ จากนั้นเชื่อมต่อจาก Linux ใน [โหมดระยะไกล](#gateway-ports-already-running-and-remote-mode) หรือผ่าน Tailscale Skills จะโหลดตามปกติเพราะโฮสต์ Gateway เป็น macOS

    **ตัวเลือก B - ใช้ Node macOS (ไม่มี SSH).**
    รัน Gateway บน Linux จับคู่ Node macOS (แอปแถบเมนู) และตั้งค่า **Node Run Commands** เป็น "ถามเสมอ" หรือ "อนุญาตเสมอ" บน Mac OpenClaw สามารถถือว่า Skills ที่ใช้ได้เฉพาะ macOS มีสิทธิ์ใช้งานเมื่อไบนารีที่จำเป็นมีอยู่บน Node agent จะรัน Skills เหล่านั้นผ่านเครื่องมือ `nodes` หากคุณเลือก "ถามเสมอ" การอนุมัติ "อนุญาตเสมอ" ใน prompt จะเพิ่มคำสั่งนั้นลงใน allowlist

    **ตัวเลือก C - พร็อกซีไบนารี macOS ผ่าน SSH (ขั้นสูง).**
    ให้ Gateway อยู่บน Linux ต่อไป แต่ทำให้ไบนารี CLI ที่จำเป็น resolve เป็น wrapper SSH ที่รันบน Mac จากนั้นแทนที่ skill เพื่ออนุญาต Linux เพื่อให้ยังมีสิทธิ์ใช้งาน

    1. สร้าง wrapper SSH สำหรับไบนารี (ตัวอย่าง: `memo` สำหรับ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. วาง wrapper บน `PATH` บนโฮสต์ Linux (เช่น `~/bin/memo`)
    3. แทนที่ metadata ของ skill (workspace หรือ `~/.openclaw/skills`) เพื่ออนุญาต Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. เริ่มเซสชันใหม่เพื่อรีเฟรช snapshot ของ Skills

  </Accordion>

  <Accordion title="คุณมีการเชื่อมต่อ Notion หรือ HeyGen ไหม?">
    วันนี้ยังไม่มีในตัว

    ตัวเลือก:

    - **skill / Plugin แบบกำหนดเอง:** เหมาะที่สุดสำหรับการเข้าถึง API ที่เชื่อถือได้ (ทั้ง Notion/HeyGen มี API)
    - **ระบบอัตโนมัติของเบราว์เซอร์:** ใช้งานได้โดยไม่ต้องเขียนโค้ด แต่ช้ากว่าและเปราะบางกว่า

    หากคุณต้องการเก็บ context ต่อ client (workflow ของ agency) รูปแบบง่าย ๆ คือ:

    - หน้า Notion หนึ่งหน้าต่อ client (context + preferences + active work)
    - ขอให้ agent ดึงหน้านั้นเมื่อเริ่มเซสชัน

    หากคุณต้องการการเชื่อมต่อแบบ native ให้เปิดคำขอฟีเจอร์หรือสร้าง skill
    ที่มุ่งเป้าไปยัง API เหล่านั้น

    ติดตั้ง Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    การติดตั้งแบบ native จะอยู่ในไดเรกทอรี `skills/` ของ workspace ที่ใช้งานอยู่ สำหรับ Skills ที่ใช้ร่วมกันระหว่าง agents ให้วางไว้ใน `~/.openclaw/skills/<name>/SKILL.md` หากควรมีเพียงบาง agents ที่มองเห็นการติดตั้งที่ใช้ร่วมกัน ให้กำหนดค่า `agents.defaults.skills` หรือ `agents.list[].skills` Skills บางรายการคาดหวังไบนารีที่ติดตั้งผ่าน Homebrew; บน Linux นั่นหมายถึง Linuxbrew (ดูรายการ FAQ Homebrew Linux ด้านบน) ดู [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config), และ [ClawHub](/th/clawhub).

  </Accordion>

  <Accordion title="ฉันใช้ Chrome ที่ลงชื่อเข้าใช้อยู่แล้วกับ OpenClaw ได้อย่างไร?">
    ใช้โปรไฟล์เบราว์เซอร์ `user` ในตัว ซึ่งแนบผ่าน Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    หากคุณต้องการชื่อแบบกำหนดเอง ให้สร้างโปรไฟล์ MCP อย่างชัดเจน:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    เส้นทางนี้สามารถใช้เบราว์เซอร์บนโฮสต์ local หรือ Node เบราว์เซอร์ที่เชื่อมต่ออยู่ หาก Gateway รันอยู่ที่อื่น ให้รันโฮสต์ Node บนเครื่องเบราว์เซอร์หรือใช้ CDP ระยะไกลแทน

    ข้อจำกัดปัจจุบันของ `existing-session` / `user`:

    - actions อ้างอิงด้วย ref ไม่ใช่ CSS selector
    - การอัปโหลดต้องใช้ `ref` / `inputRef` และตอนนี้รองรับทีละไฟล์
    - `responsebody`, การ export PDF, การดักจับการดาวน์โหลด, และ actions แบบ batch ยังต้องใช้เบราว์เซอร์ที่มีการจัดการหรือโปรไฟล์ CDP ดิบ

  </Accordion>
</AccordionGroup>

## การทำ sandbox และหน่วยความจำ

<AccordionGroup>
  <Accordion title="มีเอกสารการทำ sandbox โดยเฉพาะไหม?">
    มี ดู [การทำ sandbox](/th/gateway/sandboxing) สำหรับการตั้งค่าเฉพาะ Docker (Gateway เต็มรูปแบบใน Docker หรืออิมเมจ sandbox) ดู [Docker](/th/install/docker).
  </Accordion>

  <Accordion title="Docker ดูมีข้อจำกัด - ฉันเปิดใช้ฟีเจอร์เต็มรูปแบบได้อย่างไร?">
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยก่อนและรันเป็นผู้ใช้ `node` ดังนั้นจึงไม่
    รวมแพ็กเกจระบบ, Homebrew, หรือเบราว์เซอร์ที่ bundled ไว้ สำหรับการตั้งค่าที่ครบถ้วนกว่า:

    - คง `/home/node` ไว้ด้วย `OPENCLAW_HOME_VOLUME` เพื่อให้แคชอยู่รอด
    - อบ system deps เข้าไปในอิมเมจด้วย `OPENCLAW_DOCKER_APT_PACKAGES`
    - ติดตั้งเบราว์เซอร์ Playwright ผ่าน CLI ที่ bundled ไว้:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` และตรวจให้แน่ใจว่า path ถูกคงไว้

    เอกสาร: [Docker](/th/install/docker), [เบราว์เซอร์](/th/tools/browser).

  </Accordion>

  <Accordion title="ฉันทำให้ข้อความส่วนตัวเป็นส่วนตัว แต่ทำให้กลุ่มเป็นสาธารณะ/ถูก sandbox ด้วย agent เดียวได้ไหม?">
    ได้ - หากทราฟฟิกส่วนตัวของคุณคือ **ข้อความส่วนตัว** และทราฟฟิกสาธารณะของคุณคือ **กลุ่ม**

    ใช้ `agents.defaults.sandbox.mode: "non-main"` เพื่อให้เซสชันกลุ่ม/ช่อง (คีย์ non-main) รันใน backend sandbox ที่กำหนดค่าไว้ ขณะที่เซสชันข้อความส่วนตัวหลักยังอยู่บนโฮสต์ Docker คือ backend เริ่มต้นหากคุณไม่ได้เลือกอย่างอื่น จากนั้นจำกัดว่าเครื่องมือใดใช้งานได้ในเซสชันที่ถูก sandbox ผ่าน `tools.sandbox.tools`

    คำแนะนำการตั้งค่า + ตัวอย่าง config: [กลุ่ม: ข้อความส่วนตัวส่วนบุคคล + กลุ่มสาธารณะ](/th/channels/groups#pattern-personal-dms-public-groups-single-agent)

    อ้างอิง config หลัก: [การกำหนดค่า Gateway](/th/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ฉัน bind โฟลเดอร์ของโฮสต์เข้าไปใน sandbox ได้อย่างไร?">
    ตั้งค่า `agents.defaults.sandbox.docker.binds` เป็น `["host:path:mode"]` (เช่น `"/home/user/src:/src:ro"`) bind แบบ global + per-agent จะ merge กัน; bind แบบ per-agent จะถูกละเว้นเมื่อ `scope: "shared"` ใช้ `:ro` สำหรับสิ่งที่ละเอียดอ่อน และจำไว้ว่า bind จะข้ามกำแพง filesystem ของ sandbox

    OpenClaw ตรวจสอบแหล่งที่มาของ bind เทียบกับทั้ง path ที่ normalize แล้วและ path canonical ที่ resolve ผ่าน ancestor ที่มีอยู่ลึกที่สุด นั่นหมายความว่า symlink-parent escapes ยังคง fail closed แม้ segment path สุดท้ายจะยังไม่มีอยู่ และการตรวจ allowed-root ยังคงใช้หลังจากการ resolve symlink

    ดู [การทำ sandbox](/th/gateway/sandboxing#custom-bind-mounts) และ [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) สำหรับตัวอย่างและหมายเหตุด้านความปลอดภัย

  </Accordion>

  <Accordion title="หน่วยความจำทำงานอย่างไร?">
    หน่วยความจำของ OpenClaw เป็นเพียงไฟล์ Markdown ใน workspace ของ agent:

    - บันทึกรายวันใน `memory/YYYY-MM-DD.md`
    - บันทึกระยะยาวที่คัดสรรใน `MEMORY.md` (เฉพาะเซสชันหลัก/ส่วนตัว)

    OpenClaw ยังรัน **การ flush หน่วยความจำก่อน Compaction แบบเงียบ** เพื่อเตือนโมเดล
    ให้เขียนบันทึกที่ทนทานก่อน auto-compaction สิ่งนี้จะรันเฉพาะเมื่อ workspace
    เขียนได้ (sandbox แบบอ่านอย่างเดียวจะข้ามไป) ดู [หน่วยความจำ](/th/concepts/memory).

  </Accordion>

  <Accordion title="หน่วยความจำลืมสิ่งต่าง ๆ อยู่เรื่อย ๆ ฉันทำให้มันจำได้อย่างไร?">
    ขอให้บอท **เขียนข้อเท็จจริงลงในหน่วยความจำ** บันทึกระยะยาวควรอยู่ใน `MEMORY.md`,
    context ระยะสั้นอยู่ใน `memory/YYYY-MM-DD.md`

    นี่ยังคงเป็นพื้นที่ที่เรากำลังปรับปรุง การเตือนโมเดลให้จัดเก็บความทรงจำช่วยได้;
    โมเดลจะรู้ว่าต้องทำอะไร หากยังลืมอยู่ ให้ตรวจสอบว่า Gateway ใช้
    workspace เดียวกันในทุกการรัน

    เอกสาร: [หน่วยความจำ](/th/concepts/memory), [workspace ของ agent](/th/concepts/agent-workspace).

  </Accordion>

  <Accordion title="หน่วยความจำคงอยู่ตลอดไปไหม? มีข้อจำกัดอะไรบ้าง?">
    ไฟล์หน่วยความจำอยู่บนดิสก์และคงอยู่จนกว่าคุณจะลบ ข้อจำกัดคือ
    พื้นที่จัดเก็บของคุณ ไม่ใช่โมเดล **context ของเซสชัน** ยังคงถูกจำกัดด้วย
    context window ของโมเดล ดังนั้นบทสนทนายาว ๆ อาจ compact หรือ truncate ได้ นั่นคือเหตุผลที่
    มีการค้นหาหน่วยความจำ - มันดึงเฉพาะส่วนที่เกี่ยวข้องกลับเข้า context

    เอกสาร: [หน่วยความจำ](/th/concepts/memory), [Context](/th/concepts/context).

  </Accordion>

  <Accordion title="การค้นหาหน่วยความจำเชิงความหมายต้องใช้คีย์ OpenAI API หรือไม่?">
    ต้องใช้เฉพาะเมื่อคุณใช้ **OpenAI embeddings** เท่านั้น Codex OAuth ครอบคลุมแชต/การเติมข้อความให้สมบูรณ์ และ
    **ไม่ได้** ให้สิทธิ์เข้าถึง embeddings ดังนั้น **การลงชื่อเข้าใช้ด้วย Codex (OAuth หรือการเข้าสู่ระบบ
    Codex CLI)** จึงไม่ช่วยสำหรับการค้นหาหน่วยความจำเชิงความหมาย OpenAI embeddings
    ยังคงต้องใช้คีย์ API จริง (`OPENAI_API_KEY` หรือ `models.providers.openai.apiKey`)

    หากคุณไม่ได้ตั้งค่าผู้ให้บริการไว้อย่างชัดเจน OpenClaw จะเลือกผู้ให้บริการโดยอัตโนมัติเมื่อ
    สามารถแก้หาคีย์ API ได้ (โปรไฟล์การยืนยันตัวตน, `models.providers.*.apiKey` หรือ env vars)
    ระบบจะเลือก OpenAI ก่อนหากแก้หาคีย์ OpenAI ได้ มิฉะนั้นจะเลือก Gemini หากแก้หาคีย์ Gemini
    ได้ จากนั้น Voyage แล้วจึง Mistral หากไม่มีคีย์ระยะไกลให้ใช้ การค้นหา
    หน่วยความจำจะยังคงปิดใช้งานจนกว่าคุณจะกำหนดค่า หากคุณมีพาธโมเดลภายในเครื่อง
    ที่กำหนดค่าไว้และมีอยู่ OpenClaw
    จะเลือก `local` เป็นอันดับแรก รองรับ Ollama เมื่อคุณตั้งค่าอย่างชัดเจนเป็น
    `memorySearch.provider = "ollama"`

    หากคุณต้องการใช้งานภายในเครื่อง ให้ตั้งค่า `memorySearch.provider = "local"` (และอาจตั้งค่า
    `memorySearch.fallback = "none"` ด้วย) หากคุณต้องการ Gemini embeddings ให้ตั้งค่า
    `memorySearch.provider = "gemini"` และระบุ `GEMINI_API_KEY` (หรือ
    `memorySearch.remote.apiKey`) เรารองรับโมเดล embedding แบบ **OpenAI, Gemini, Voyage, Mistral, Ollama หรือ local**
    โปรดดูรายละเอียดการตั้งค่าใน [หน่วยความจำ](/th/concepts/memory)

  </Accordion>
</AccordionGroup>

## สิ่งต่าง ๆ อยู่ที่ไหนบนดิสก์

<AccordionGroup>
  <Accordion title="ข้อมูลทั้งหมดที่ใช้กับ OpenClaw ถูกบันทึกไว้ภายในเครื่องหรือไม่?">
    ไม่ใช่ - **สถานะของ OpenClaw อยู่ภายในเครื่อง** แต่ **บริการภายนอกยังคงเห็นสิ่งที่คุณส่งไปให้บริการเหล่านั้น**

    - **ภายในเครื่องโดยค่าเริ่มต้น:** เซสชัน ไฟล์หน่วยความจำ การกำหนดค่า และ workspace อยู่บนโฮสต์ Gateway
      (`~/.openclaw` + ไดเรกทอรี workspace ของคุณ)
    - **ระยะไกลตามความจำเป็น:** ข้อความที่คุณส่งไปยังผู้ให้บริการโมเดล (Anthropic/OpenAI/ฯลฯ) จะไปยัง
      API ของผู้ให้บริการเหล่านั้น และแพลตฟอร์มแชต (WhatsApp/Telegram/Slack/ฯลฯ) จะจัดเก็บข้อมูลข้อความไว้บน
      เซิร์ฟเวอร์ของตน
    - **คุณควบคุมร่องรอยข้อมูลได้:** การใช้โมเดลภายในเครื่องจะเก็บพรอมป์ไว้บนเครื่องของคุณ แต่ทราฟฟิกของช่องทาง
      ยังคงผ่านเซิร์ฟเวอร์ของช่องทางนั้น

    ที่เกี่ยวข้อง: [workspace ของเอเจนต์](/th/concepts/agent-workspace), [หน่วยความจำ](/th/concepts/memory)

  </Accordion>

  <Accordion title="OpenClaw จัดเก็บข้อมูลไว้ที่ไหน?">
    ทุกอย่างอยู่ภายใต้ `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`):

    | พาธ                                                            | วัตถุประสงค์                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | การกำหนดค่าหลัก (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | การนำเข้า OAuth เดิม (คัดลอกเข้าสู่โปรไฟล์การยืนยันตัวตนเมื่อใช้งานครั้งแรก)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | โปรไฟล์การยืนยันตัวตน (OAuth, คีย์ API และ `keyRef`/`tokenRef` ที่เลือกใช้ได้)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | เพย์โหลดลับที่สำรองด้วยไฟล์แบบเลือกใช้ได้สำหรับผู้ให้บริการ SecretRef แบบ `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ไฟล์ความเข้ากันได้เดิม (ล้างรายการ `api_key` แบบคงที่แล้ว)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | สถานะผู้ให้บริการ (เช่น `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | สถานะต่อเอเจนต์ (agentDir + เซสชัน)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | ประวัติการสนทนาและสถานะ (ต่อเอเจนต์)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | เมตาดาต้าเซสชัน (ต่อเอเจนต์)                                       |

    พาธเดิมสำหรับเอเจนต์เดียว: `~/.openclaw/agent/*` (ย้ายโดย `openclaw doctor`)

    **workspace** ของคุณ (AGENTS.md, ไฟล์หน่วยความจำ, Skills ฯลฯ) แยกต่างหากและกำหนดค่าผ่าน `agents.defaults.workspace` (ค่าเริ่มต้น: `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md ควรอยู่ที่ไหน?">
    ไฟล์เหล่านี้อยู่ใน **workspace ของเอเจนต์** ไม่ใช่ `~/.openclaw`

    - **Workspace (ต่อเอเจนต์)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` แบบเลือกใช้ได้
      รูท `memory.md` ตัวพิมพ์เล็กเป็นอินพุตซ่อมแซมแบบเดิมเท่านั้น; `openclaw doctor --fix`
      สามารถผสานเข้ากับ `MEMORY.md` เมื่อทั้งสองไฟล์มีอยู่
    - **ไดเรกทอรีสถานะ (`~/.openclaw`)**: การกำหนดค่า สถานะช่องทาง/ผู้ให้บริการ โปรไฟล์การยืนยันตัวตน เซสชัน บันทึก
      และ Skills ที่ใช้ร่วมกัน (`~/.openclaw/skills`)

    workspace เริ่มต้นคือ `~/.openclaw/workspace` กำหนดค่าได้ผ่าน:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    หากบอต "ลืม" หลังจากรีสตาร์ต ให้ยืนยันว่า Gateway ใช้
    workspace เดียวกันในการเปิดใช้งานทุกครั้ง (และจำไว้ว่า: โหมดระยะไกลใช้ **workspace ของโฮสต์ gateway**
    ไม่ใช่แล็ปท็อปภายในเครื่องของคุณ)

    เคล็ดลับ: หากคุณต้องการพฤติกรรมหรือค่ากำหนดที่คงทน ให้ขอให้บอต **เขียนลงใน
    AGENTS.md หรือ MEMORY.md** แทนการพึ่งพาประวัติแชต

    ดู [workspace ของเอเจนต์](/th/concepts/agent-workspace) และ [หน่วยความจำ](/th/concepts/memory)

  </Accordion>

  <Accordion title="กลยุทธ์สำรองข้อมูลที่แนะนำ">
    ใส่ **workspace ของเอเจนต์** ของคุณไว้ในรีโป git แบบ **ส่วนตัว** และสำรองข้อมูลไว้ในที่
    ส่วนตัว (เช่น GitHub private) วิธีนี้จะเก็บหน่วยความจำ + ไฟล์ AGENTS/SOUL/USER
    และช่วยให้คุณกู้คืน "จิตใจ" ของผู้ช่วยได้ภายหลัง

    **อย่า** commit สิ่งใดภายใต้ `~/.openclaw` (ข้อมูลประจำตัว เซสชัน โทเค็น หรือเพย์โหลดลับที่เข้ารหัส)
    หากคุณต้องการกู้คืนแบบเต็ม ให้สำรองทั้ง workspace และไดเรกทอรีสถานะ
    แยกกัน (ดูคำถามเรื่องการย้ายข้อมูลด้านบน)

    เอกสาร: [workspace ของเอเจนต์](/th/concepts/agent-workspace)

  </Accordion>

  <Accordion title="ฉันจะถอนการติดตั้ง OpenClaw ทั้งหมดได้อย่างไร?">
    ดูคู่มือเฉพาะ: [ถอนการติดตั้ง](/th/install/uninstall)
  </Accordion>

  <Accordion title="เอเจนต์ทำงานนอก workspace ได้หรือไม่?">
    ได้ workspace คือ **cwd เริ่มต้น** และหลักยึดหน่วยความจำ ไม่ใช่ sandbox แบบบังคับ
    พาธสัมพัทธ์จะถูกแก้ภายใน workspace แต่พาธแบบสัมบูรณ์สามารถเข้าถึงตำแหน่งอื่นบน
    โฮสต์ได้ เว้นแต่ว่าเปิดใช้งาน sandboxing หากคุณต้องการการแยกใช้งาน ให้ใช้
    [`agents.defaults.sandbox`](/th/gateway/sandboxing) หรือการตั้งค่า sandbox ต่อเอเจนต์ หากคุณ
    ต้องการให้รีโปเป็นไดเรกทอรีทำงานเริ่มต้น ให้ชี้ `workspace` ของเอเจนต์นั้น
    ไปที่รูทของรีโป รีโป OpenClaw เป็นเพียงซอร์สโค้ด; แยก
    workspace ไว้ต่างหาก เว้นแต่ว่าคุณตั้งใจให้เอเจนต์ทำงานภายในนั้น

    ตัวอย่าง (รีโปเป็น cwd เริ่มต้น):

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
    สถานะเซสชันเป็นของ **โฮสต์ gateway** หากคุณอยู่ในโหมดระยะไกล ที่เก็บเซสชันที่คุณสนใจจะอยู่บนเครื่องระยะไกล ไม่ใช่แล็ปท็อปภายในเครื่องของคุณ ดู [การจัดการเซสชัน](/th/concepts/session)
  </Accordion>
</AccordionGroup>

## พื้นฐานการกำหนดค่า

<AccordionGroup>
  <Accordion title="การกำหนดค่าอยู่ในรูปแบบใด? อยู่ที่ไหน?">
    OpenClaw อ่านการกำหนดค่า **JSON5** แบบเลือกใช้ได้จาก `$OPENCLAW_CONFIG_PATH` (ค่าเริ่มต้น: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    หากไฟล์หายไป ระบบจะใช้ค่าเริ่มต้นที่ค่อนข้างปลอดภัย (รวมถึง workspace เริ่มต้นเป็น `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title='ฉันตั้งค่า gateway.bind: "lan" (หรือ "tailnet") แล้วตอนนี้ไม่มีอะไร listen / UI แจ้งว่าไม่ได้รับอนุญาต'>
    การ bind ที่ไม่ใช่ loopback **ต้องมีพาธการยืนยันตัวตนของ gateway ที่ถูกต้อง** ในทางปฏิบัติหมายถึง:

    - การยืนยันตัวตนด้วย shared-secret: โทเค็นหรือรหัสผ่าน
    - `gateway.auth.mode: "trusted-proxy"` หลังพร็อกซีย้อนกลับที่รับรู้ตัวตนและกำหนดค่าอย่างถูกต้อง

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

    - `gateway.remote.token` / `.password` **ไม่ได้** เปิดใช้งานการยืนยันตัวตน gateway ภายในเครื่องด้วยตัวเอง
    - พาธการเรียกภายในเครื่องสามารถใช้ `gateway.remote.*` เป็นทางเลือกสำรองได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
    - สำหรับการยืนยันตัวตนด้วยรหัสผ่าน ให้ตั้งค่า `gateway.auth.mode: "password"` พร้อม `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`) แทน
    - หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าอย่างชัดเจนผ่าน SecretRef และแก้ค่าไม่ได้ การแก้ค่าจะล้มเหลวแบบปิด (ไม่มี remote fallback มาปิดบัง)
    - การตั้งค่า Control UI แบบ shared-secret จะยืนยันตัวตนผ่าน `connect.params.auth.token` หรือ `connect.params.auth.password` (จัดเก็บในการตั้งค่าแอป/UI) โหมดที่มีข้อมูลตัวตน เช่น Tailscale Serve หรือ `trusted-proxy` จะใช้เฮดเดอร์คำขอแทน หลีกเลี่ยงการใส่ shared secrets ใน URL
    - เมื่อใช้ `gateway.auth.mode: "trusted-proxy"` พร็อกซีย้อนกลับแบบ loopback บนโฮสต์เดียวกันต้องมี `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน และมีรายการ loopback ใน `gateway.trustedProxies`

  </Accordion>

  <Accordion title="ทำไมตอนนี้ฉันต้องใช้โทเค็นบน localhost?">
    OpenClaw บังคับใช้การยืนยันตัวตนของ gateway โดยค่าเริ่มต้น รวมถึง loopback ด้วย ในพาธเริ่มต้นปกติ หมายถึงการยืนยันตัวตนด้วยโทเค็น: หากไม่ได้กำหนดพาธการยืนยันตัวตนไว้อย่างชัดเจน การเริ่มต้น gateway จะแก้เป็นโหมดโทเค็นและสร้างโทเค็นเฉพาะรันไทม์สำหรับการเริ่มต้นครั้งนั้น ดังนั้น **ไคลเอนต์ WS ภายในเครื่องต้องยืนยันตัวตน** กำหนดค่า `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` หรือ `OPENCLAW_GATEWAY_PASSWORD` อย่างชัดเจนเมื่อไคลเอนต์ต้องการ secret ที่คงที่ข้ามการรีสตาร์ต วิธีนี้จะบล็อกโปรเซสภายในเครื่องอื่นไม่ให้เรียก Gateway

    หากคุณต้องการพาธการยืนยันตัวตนแบบอื่น คุณสามารถเลือกโหมดรหัสผ่านอย่างชัดเจน (หรือ `trusted-proxy` สำหรับพร็อกซีย้อนกลับที่รับรู้ตัวตน) หากคุณ **ต้องการจริง ๆ** ให้ loopback เปิดอยู่ ให้ตั้งค่า `gateway.auth.mode: "none"` อย่างชัดเจนในการกำหนดค่าของคุณ Doctor สามารถสร้างโทเค็นให้คุณได้ทุกเมื่อ: `openclaw doctor --generate-gateway-token`

  </Accordion>

  <Accordion title="ฉันต้องรีสตาร์ตหลังจากเปลี่ยนการกำหนดค่าหรือไม่?">
    Gateway เฝ้าดูการกำหนดค่าและรองรับ hot-reload:

    - `gateway.reload.mode: "hybrid"` (ค่าเริ่มต้น): ปรับใช้การเปลี่ยนแปลงที่ปลอดภัยแบบ hot-apply, รีสตาร์ตสำหรับการเปลี่ยนแปลงสำคัญ
    - รองรับ `hot`, `restart`, `off` ด้วย

  </Accordion>

  <Accordion title="ฉันจะปิด tagline ตลกของ CLI ได้อย่างไร?">
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
    - `random`: tagline ตลก/ตามฤดูกาลแบบหมุนเวียน (พฤติกรรมเริ่มต้น)
    - หากคุณไม่ต้องการแบนเนอร์เลย ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

  </Accordion>

  <Accordion title="ฉันจะเปิดใช้งานการค้นเว็บ (และการดึงเว็บ) ได้อย่างไร?">
    `web_fetch` ทำงานได้โดยไม่ต้องใช้คีย์ API `web_search` ขึ้นอยู่กับผู้ให้บริการ
    ที่คุณเลือก:

    - ผู้ให้บริการที่ใช้ API เป็นฐาน เช่น Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity และ Tavily ต้องใช้การตั้งค่าคีย์ API ตามปกติ
    - Ollama Web Search ไม่ต้องใช้คีย์ แต่ใช้โฮสต์ Ollama ที่คุณกำหนดค่าไว้และต้องใช้ `ollama signin`
    - DuckDuckGo ไม่ต้องใช้คีย์ แต่เป็นการผสานรวมแบบไม่เป็นทางการที่อิง HTML
    - SearXNG ไม่ต้องใช้คีย์/โฮสต์เองได้; กำหนดค่า `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl`

    **แนะนำ:** เรียกใช้ `openclaw configure --section web` และเลือกผู้ให้บริการ
    ทางเลือกด้านสภาพแวดล้อม:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, หรือ `MINIMAX_API_KEY`
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

    ตอนนี้การกำหนดค่า web-search เฉพาะผู้ให้บริการอยู่ใต้ `plugins.entries.<plugin>.config.webSearch.*`
    พาธผู้ให้บริการแบบเดิม `tools.web.search.*` ยังคงโหลดชั่วคราวเพื่อความเข้ากันได้ แต่ไม่ควรใช้กับการกำหนดค่าใหม่
    การกำหนดค่า fallback ของ Firecrawl สำหรับ web-fetch อยู่ใต้ `plugins.entries.firecrawl.config.webFetch.*`

    หมายเหตุ:

    - หากคุณใช้ allowlist ให้เพิ่ม `web_search`/`web_fetch`/`x_search` หรือ `group:web`
    - `web_fetch` เปิดใช้ตามค่าเริ่มต้น (เว้นแต่จะปิดใช้อย่างชัดเจน)
    - หากละเว้น `tools.web.fetch.provider` OpenClaw จะตรวจพบผู้ให้บริการ fetch fallback รายแรกที่พร้อมใช้งานจากข้อมูลรับรองที่มีโดยอัตโนมัติ ปัจจุบันผู้ให้บริการที่รวมมาให้คือ Firecrawl
    - daemon อ่าน env var จาก `~/.openclaw/.env` (หรือสภาพแวดล้อมของบริการ)

    เอกสาร: [เครื่องมือเว็บ](/th/tools/web)

  </Accordion>

  <Accordion title="config.apply ล้างการกำหนดค่าของฉัน ฉันจะกู้คืนและหลีกเลี่ยงเรื่องนี้ได้อย่างไร?">
    `config.apply` จะแทนที่ **การกำหนดค่าทั้งหมด** หากคุณส่งอ็อบเจกต์บางส่วน ทุกอย่าง
    ที่เหลือจะถูกลบออก

    OpenClaw ปัจจุบันป้องกันการเขียนทับโดยไม่ตั้งใจหลายกรณี:

    - การเขียนการกำหนดค่าที่ OpenClaw เป็นเจ้าของจะตรวจสอบความถูกต้องของการกำหนดค่าทั้งหมดหลังการเปลี่ยนแปลงก่อนเขียน
    - การเขียนที่ OpenClaw เป็นเจ้าของซึ่งไม่ถูกต้องหรือทำลายข้อมูลจะถูกปฏิเสธและบันทึกเป็น `openclaw.json.rejected.*`
    - หากการแก้ไขโดยตรงทำให้การเริ่มต้นหรือ hot reload เสีย Gateway จะปิดแบบปลอดภัยหรือข้ามการ reload; จะไม่เขียน `openclaw.json` ใหม่
    - `openclaw doctor --fix` เป็นเจ้าของการซ่อมแซมและสามารถกู้คืนค่าล่าสุดที่ทราบว่าใช้งานได้ พร้อมบันทึกไฟล์ที่ถูกปฏิเสธเป็น `openclaw.json.clobbered.*`

    การกู้คืน:

    - ตรวจสอบ `openclaw logs --follow` สำหรับ `Invalid config at`, `Config write rejected:`, หรือ `config reload skipped (invalid config)`
    - ตรวจสอบ `openclaw.json.clobbered.*` หรือ `openclaw.json.rejected.*` ที่ใหม่ที่สุดข้างการกำหนดค่าที่ใช้งานอยู่
    - รัน `openclaw config validate` และ `openclaw doctor --fix`
    - คัดลอกกลับเฉพาะคีย์ที่ต้องการด้วย `openclaw config set` หรือ `config.patch`
    - หากคุณไม่มีค่าล่าสุดที่ทราบว่าใช้งานได้หรือ payload ที่ถูกปฏิเสธ ให้กู้คืนจากข้อมูลสำรอง หรือรัน `openclaw doctor` อีกครั้งแล้วกำหนดค่า channel/model ใหม่
    - หากเรื่องนี้ไม่คาดคิด ให้รายงานบั๊กและแนบการกำหนดค่าล่าสุดที่คุณทราบหรือข้อมูลสำรองใดๆ
    - เอเจนต์เขียนโค้ดในเครื่องมักสามารถสร้างการกำหนดค่าที่ใช้งานได้จาก log หรือประวัติ

    วิธีหลีกเลี่ยง:

    - ใช้ `openclaw config set` สำหรับการเปลี่ยนแปลงเล็กๆ
    - ใช้ `openclaw configure` สำหรับการแก้ไขแบบโต้ตอบ
    - ใช้ `config.schema.lookup` ก่อนเมื่อคุณไม่แน่ใจเกี่ยวกับพาธหรือรูปทรงฟิลด์ที่แน่นอน; มันจะคืนค่าโหนด schema แบบตื้นพร้อมสรุป child ทันทีสำหรับการเจาะลึก
    - ใช้ `config.patch` สำหรับการแก้ไข RPC บางส่วน; เก็บ `config.apply` ไว้สำหรับการแทนที่การกำหนดค่าทั้งหมดเท่านั้น
    - หากคุณใช้เครื่องมือ `gateway` เฉพาะเจ้าของจากการรันเอเจนต์ เครื่องมือนั้นจะยังปฏิเสธการเขียนไปยัง `tools.exec.ask` / `tools.exec.security` (รวมถึง alias เดิม `tools.bash.*` ที่ normalize ไปยังพาธ exec ที่ได้รับการป้องกันเดียวกัน)

    เอกสาร: [การกำหนดค่า](/th/cli/config), [กำหนดค่า](/th/cli/configure), [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันจะรัน Gateway ส่วนกลางพร้อม worker เฉพาะทางข้ามอุปกรณ์ได้อย่างไร?">
    รูปแบบทั่วไปคือ **Gateway หนึ่งตัว** (เช่น Raspberry Pi) พร้อม **Node** และ **เอเจนต์**:

    - **Gateway (ส่วนกลาง):** เป็นเจ้าของ channel (Signal/WhatsApp), routing, และ session
    - **Node (อุปกรณ์):** Mac/iOS/Android เชื่อมต่อเป็นอุปกรณ์ต่อพ่วงและเปิดเผยเครื่องมือในเครื่อง (`system.run`, `canvas`, `camera`)
    - **เอเจนต์ (worker):** สมอง/เวิร์กสเปซแยกสำหรับบทบาทพิเศษ (เช่น "Hetzner ops", "Personal data")
    - **เอเจนต์ย่อย:** spawn งานเบื้องหลังจากเอเจนต์หลักเมื่อคุณต้องการการทำงานขนาน
    - **TUI:** เชื่อมต่อกับ Gateway และสลับเอเจนต์/session

    เอกสาร: [Node](/th/nodes), [การเข้าถึงระยะไกล](/th/gateway/remote), [Multi-Agent Routing](/th/concepts/multi-agent), [เอเจนต์ย่อย](/th/tools/subagents), [TUI](/th/web/tui)

  </Accordion>

  <Accordion title="เบราว์เซอร์ OpenClaw รันแบบ headless ได้หรือไม่?">
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

    ค่าเริ่มต้นคือ `false` (headful) Headless มีแนวโน้มจะกระตุ้นการตรวจจับ anti-bot ในบางเว็บไซต์มากกว่า ดู [เบราว์เซอร์](/th/tools/browser)

    Headless ใช้ **เอนจิน Chromium เดียวกัน** และทำงานได้กับ automation ส่วนใหญ่ (ฟอร์ม, การคลิก, scraping, การเข้าสู่ระบบ) ความแตกต่างหลักคือ:

    - ไม่มีหน้าต่างเบราว์เซอร์ที่มองเห็นได้ (ใช้ screenshot หากคุณต้องการภาพ)
    - บางเว็บไซต์เข้มงวดกับ automation ในโหมด headless มากกว่า (CAPTCHA, anti-bot)
      ตัวอย่างเช่น X/Twitter มักบล็อก session แบบ headless

  </Accordion>

  <Accordion title="ฉันจะใช้ Brave สำหรับการควบคุมเบราว์เซอร์ได้อย่างไร?">
    ตั้งค่า `browser.executablePath` เป็นไบนารี Brave ของคุณ (หรือเบราว์เซอร์ที่ใช้ Chromium ตัวใดก็ได้) แล้วรีสตาร์ท Gateway
    ดูตัวอย่างการกำหนดค่าเต็มใน [เบราว์เซอร์](/th/tools/browser#use-brave-or-another-chromium-based-browser)
  </Accordion>
</AccordionGroup>

## Gateway และ Node ระยะไกล

<AccordionGroup>
  <Accordion title="คำสั่งแพร่ต่อระหว่าง Telegram, gateway, และ Node อย่างไร?">
    ข้อความ Telegram ถูกจัดการโดย **gateway** gateway จะรันเอเจนต์และ
    จากนั้นจึงเรียก Node ผ่าน **Gateway WebSocket** เมื่อจำเป็นต้องใช้เครื่องมือของ Node:

    Telegram → Gateway → เอเจนต์ → `node.*` → Node → Gateway → Telegram

    Node จะไม่เห็นทราฟฟิกขาเข้าจากผู้ให้บริการ; จะรับเฉพาะการเรียก RPC ของ Node เท่านั้น

  </Accordion>

  <Accordion title="เอเจนต์ของฉันจะเข้าถึงคอมพิวเตอร์ของฉันได้อย่างไรหาก Gateway โฮสต์อยู่ระยะไกล?">
    คำตอบสั้นๆ: **จับคู่คอมพิวเตอร์ของคุณเป็น Node** Gateway รันอยู่ที่อื่น แต่สามารถ
    เรียกเครื่องมือ `node.*` (screen, camera, system) บนเครื่องในเครื่องของคุณผ่าน Gateway WebSocket

    การตั้งค่าทั่วไป:

    1. รัน Gateway บนโฮสต์ที่เปิดตลอดเวลา (VPS/เซิร์ฟเวอร์ที่บ้าน)
    2. นำโฮสต์ Gateway + คอมพิวเตอร์ของคุณไว้บน tailnet เดียวกัน
    3. ตรวจให้แน่ใจว่า Gateway WS เข้าถึงได้ (bind ผ่าน tailnet หรือ SSH tunnel)
    4. เปิดแอป macOS ในเครื่องและเชื่อมต่อในโหมด **Remote over SSH** (หรือ tailnet โดยตรง)
       เพื่อให้ลงทะเบียนเป็น Node ได้
    5. อนุมัติ Node บน Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ไม่จำเป็นต้องมี TCP bridge แยกต่างหาก; Node เชื่อมต่อผ่าน Gateway WebSocket

    คำเตือนด้านความปลอดภัย: การจับคู่ Node macOS อนุญาตให้ใช้ `system.run` บนเครื่องนั้น จับคู่เฉพาะ
    อุปกรณ์ที่คุณเชื่อถือ และทบทวน [ความปลอดภัย](/th/gateway/security)

    เอกสาร: [Node](/th/nodes), [โปรโตคอล Gateway](/th/gateway/protocol), [โหมดระยะไกล macOS](/th/platforms/mac/remote), [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="Tailscale เชื่อมต่อแล้วแต่ฉันไม่ได้รับการตอบกลับ ตอนนี้ควรทำอย่างไร?">
    ตรวจสอบพื้นฐาน:

    - Gateway กำลังรันอยู่: `openclaw gateway status`
    - สุขภาพ Gateway: `openclaw status`
    - สุขภาพ channel: `openclaw channels status`

    จากนั้นตรวจสอบ auth และ routing:

    - หากคุณใช้ Tailscale Serve ตรวจให้แน่ใจว่า `gateway.auth.allowTailscale` ตั้งค่าอย่างถูกต้อง
    - หากคุณเชื่อมต่อผ่าน SSH tunnel ให้ยืนยันว่า tunnel ในเครื่องทำงานอยู่และชี้ไปยังพอร์ตที่ถูกต้อง
    - ยืนยันว่า allowlist ของคุณ (DM หรือกลุ่ม) มีบัญชีของคุณรวมอยู่

    เอกสาร: [Tailscale](/th/gateway/tailscale), [การเข้าถึงระยะไกล](/th/gateway/remote), [Channel](/th/channels)

  </Accordion>

  <Accordion title="OpenClaw สอง instance คุยกันเองได้หรือไม่ (ในเครื่อง + VPS)?">
    ได้ ไม่มี bridge "bot-to-bot" ในตัว แต่คุณสามารถเชื่อมต่อได้ด้วยวิธีที่เชื่อถือได้
    หลายแบบ:

    **ง่ายที่สุด:** ใช้ channel แชตปกติที่บอททั้งสองเข้าถึงได้ (Telegram/Slack/WhatsApp)
    ให้บอท A ส่งข้อความถึงบอท B แล้วให้บอท B ตอบกลับตามปกติ

    **CLI bridge (ทั่วไป):** รันสคริปต์ที่เรียก Gateway อีกตัวด้วย
    `openclaw agent --message ... --deliver` โดยกำหนดเป้าหมายเป็นแชตที่บอทอีกตัว
    ฟังอยู่ หากบอทตัวหนึ่งอยู่บน VPS ระยะไกล ให้ชี้ CLI ของคุณไปที่ Gateway ระยะไกลนั้น
    ผ่าน SSH/Tailscale (ดู [การเข้าถึงระยะไกล](/th/gateway/remote))

    รูปแบบตัวอย่าง (รันจากเครื่องที่เข้าถึง Gateway เป้าหมายได้):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    เคล็ดลับ: เพิ่ม guardrail เพื่อให้บอทสองตัวไม่วนลูปไม่รู้จบ (mention-only, channel
    allowlist, หรือกฎ "ไม่ตอบกลับข้อความจากบอท")

    เอกสาร: [การเข้าถึงระยะไกล](/th/gateway/remote), [Agent CLI](/th/cli/agent), [การส่งของเอเจนต์](/th/tools/agent-send)

  </Accordion>

  <Accordion title="ฉันต้องใช้ VPS แยกสำหรับหลายเอเจนต์หรือไม่?">
    ไม่ต้อง Gateway หนึ่งตัวสามารถโฮสต์เอเจนต์หลายตัวได้ โดยแต่ละตัวมีเวิร์กสเปซ ค่าเริ่มต้นของ model
    และ routing ของตัวเอง นี่คือการตั้งค่าปกติและถูกกว่าและง่ายกว่าการรัน
    VPS หนึ่งตัวต่อเอเจนต์มาก

    ใช้ VPS แยกเฉพาะเมื่อคุณต้องการการแยกอย่างแข็งแรง (ขอบเขตความปลอดภัย) หรือ
    การกำหนดค่าที่แตกต่างกันมากซึ่งคุณไม่ต้องการแชร์ มิฉะนั้น ให้ใช้ Gateway หนึ่งตัวและ
    ใช้หลายเอเจนต์หรือเอเจนต์ย่อย

  </Accordion>

  <Accordion title="การใช้ Node บนแล็ปท็อปส่วนตัวแทน SSH จาก VPS มีประโยชน์หรือไม่?">
    มี - Node เป็นวิธีระดับแรกสำหรับเข้าถึงแล็ปท็อปของคุณจาก Gateway ระยะไกล และ
    ปลดล็อกได้มากกว่าการเข้าถึง shell Gateway รันบน macOS/Linux (Windows ผ่าน WSL2) และ
    เบา (VPS ขนาดเล็กหรือเครื่องระดับ Raspberry Pi ก็เพียงพอ; RAM 4 GB เหลือเฟือ) ดังนั้นการตั้งค่าทั่วไป
    คือโฮสต์ที่เปิดตลอดเวลาพร้อมแล็ปท็อปของคุณเป็น Node

    - **ไม่ต้องใช้ SSH ขาเข้า** Node เชื่อมต่อออกไปยัง Gateway WebSocket และใช้การจับคู่อุปกรณ์
    - **การควบคุมการรันที่ปลอดภัยกว่า** `system.run` ถูกควบคุมโดย allowlist/approval ของ Node บนแล็ปท็อปเครื่องนั้น
    - **เครื่องมืออุปกรณ์มากขึ้น** Node เปิดเผย `canvas`, `camera`, และ `screen` นอกเหนือจาก `system.run`
    - **browser automation ในเครื่อง** ให้ Gateway อยู่บน VPS แต่รัน Chrome ในเครื่องผ่านโฮสต์ Node บนแล็ปท็อป หรือแนบกับ Chrome ในเครื่องบนโฮสต์ผ่าน Chrome MCP

    SSH ใช้ได้สำหรับการเข้าถึง shell แบบเฉพาะกิจ แต่ Node ง่ายกว่าสำหรับเวิร์กโฟลว์เอเจนต์ที่ใช้งานต่อเนื่องและ
    automation ของอุปกรณ์

    เอกสาร: [Node](/th/nodes), [Nodes CLI](/th/cli/nodes), [เบราว์เซอร์](/th/tools/browser)

  </Accordion>

  <Accordion title="Node รันบริการ gateway หรือไม่?">
    ไม่รัน ควรรัน **gateway หนึ่งตัว** ต่อโฮสต์เท่านั้น เว้นแต่คุณตั้งใจรันโปรไฟล์แยกกัน (ดู [หลาย gateway](/th/gateway/multiple-gateways)) Node เป็นอุปกรณ์ต่อพ่วงที่เชื่อมต่อ
    ไปยัง gateway (Node iOS/Android, หรือ "โหมด Node" ของ macOS ในแอป menubar) สำหรับโฮสต์ Node
    แบบ headless และการควบคุมผ่าน CLI ดู [Node host CLI](/th/cli/node)

    จำเป็นต้องรีสตาร์ทเต็มรูปแบบสำหรับการเปลี่ยนแปลงพื้นผิว `gateway`, `discovery`, และ Plugin ที่โฮสต์

  </Accordion>

  <Accordion title="มีวิธี API / RPC สำหรับใช้การกำหนดค่าหรือไม่?">
    มี

    - `config.schema.lookup`: ตรวจสอบ subtree หนึ่งของ config พร้อม node ของ schema แบบตื้น, UI hint ที่ตรงกัน และสรุปลูกโดยตรงก่อนเขียน
    - `config.get`: ดึง snapshot ปัจจุบัน + hash
    - `config.patch`: การอัปเดตบางส่วนอย่างปลอดภัย (แนะนำสำหรับการแก้ไข RPC ส่วนใหญ่); hot-reload เมื่อเป็นไปได้ และรีสตาร์ตเมื่อจำเป็น
    - `config.apply`: ตรวจสอบความถูกต้อง + แทนที่ config ทั้งหมด; hot-reload เมื่อเป็นไปได้ และรีสตาร์ตเมื่อจำเป็น
    - เครื่องมือ runtime `gateway` สำหรับ owner-only ยังคงปฏิเสธการเขียนทับ `tools.exec.ask` / `tools.exec.security`; alias เก่า `tools.bash.*` จะถูก normalize ไปยัง path exec ที่ได้รับการป้องกันเดียวกัน

  </Accordion>

  <Accordion title="config ขั้นต่ำที่สมเหตุสมผลสำหรับการติดตั้งครั้งแรก">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    สิ่งนี้ตั้งค่า workspace ของคุณและจำกัดว่าใครสามารถเรียกใช้บอตได้

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
       - ในคอนโซลผู้ดูแลระบบ Tailscale ให้เปิดใช้ MagicDNS เพื่อให้ VPS มีชื่อที่คงที่
    4. **ใช้ hostname ของ tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    หากคุณต้องการ Control UI โดยไม่ใช้ SSH ให้ใช้ Tailscale Serve บน VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    วิธีนี้ทำให้ gateway bind อยู่กับ loopback และเผยแพร่ HTTPS ผ่าน Tailscale ดู [Tailscale](/th/gateway/tailscale)

  </Accordion>

  <Accordion title="ฉันจะเชื่อมต่อ node บน Mac กับ Gateway ระยะไกล (Tailscale Serve) ได้อย่างไร?">
    Serve เผยแพร่ **Gateway Control UI + WS** Node เชื่อมต่อผ่าน endpoint Gateway WS เดียวกัน

    การตั้งค่าที่แนะนำ:

    1. **ตรวจสอบให้แน่ใจว่า VPS + Mac อยู่บน tailnet เดียวกัน**
    2. **ใช้แอป macOS ในโหมด Remote** (target SSH สามารถเป็น hostname ของ tailnet ได้)
       แอปจะ tunnel พอร์ต Gateway และเชื่อมต่อเป็น node
    3. **อนุมัติ node** บน gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    เอกสาร: [โปรโตคอล Gateway](/th/gateway/protocol), [Discovery](/th/gateway/discovery), [โหมด remote ของ macOS](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันควรติดตั้งบนแล็ปท็อปเครื่องที่สองหรือแค่เพิ่ม node?">
    หากคุณต้องการเพียง **เครื่องมือในเครื่อง** (หน้าจอ/กล้อง/exec) บนแล็ปท็อปเครื่องที่สอง ให้เพิ่มเป็น
    **node** วิธีนี้คง Gateway เดียวไว้และหลีกเลี่ยง config ซ้ำ เครื่องมือ node ในเครื่อง
    ปัจจุบันรองรับเฉพาะ macOS แต่เราวางแผนจะขยายไปยัง OS อื่น

    ติดตั้ง Gateway ตัวที่สองเฉพาะเมื่อคุณต้องการ **การแยกอย่างเข้มงวด** หรือบอตสองตัวที่แยกกันโดยสมบูรณ์

    เอกสาร: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes), [Gateway หลายตัว](/th/gateway/multiple-gateways)

  </Accordion>
</AccordionGroup>

## Env vars และการโหลด .env

<AccordionGroup>
  <Accordion title="OpenClaw โหลด environment variables อย่างไร?">
    OpenClaw อ่าน env vars จาก parent process (shell, launchd/systemd, CI ฯลฯ) และโหลดเพิ่มเติม:

    - `.env` จากไดเรกทอรีทำงานปัจจุบัน
    - fallback `.env` แบบ global จาก `~/.openclaw/.env` (หรือ `$OPENCLAW_STATE_DIR/.env`)

    ไฟล์ `.env` ทั้งสองไม่ override env vars ที่มีอยู่

    คุณยังสามารถกำหนด env vars แบบ inline ใน config ได้ (ใช้เฉพาะเมื่อไม่มีใน process env):

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

  <Accordion title="ฉันเริ่ม Gateway ผ่าน service แล้ว env vars ของฉันหายไป ตอนนี้ต้องทำอย่างไร?">
    วิธีแก้ไขที่พบบ่อยสองวิธี:

    1. ใส่ key ที่หายไปใน `~/.openclaw/.env` เพื่อให้ถูกอ่านแม้ service จะไม่ inherit shell env ของคุณ
    2. เปิดใช้การนำเข้าจาก shell (ความสะดวกแบบ opt-in):

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

    สิ่งนี้เรียกใช้ login shell ของคุณและนำเข้าเฉพาะ key ที่คาดไว้ซึ่งยังไม่มี (ไม่ override) Env var ที่เทียบเท่า:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

  </Accordion>

  <Accordion title='ฉันตั้งค่า COPILOT_GITHUB_TOKEN แล้ว แต่ models status แสดง "Shell env: off." ทำไม?'>
    `openclaw models status` รายงานว่าเปิดใช้ **การนำเข้า shell env** อยู่หรือไม่ "Shell env: off"
    **ไม่ได้** หมายความว่า env vars ของคุณหายไป แต่หมายความว่า OpenClaw จะไม่โหลด
    login shell ของคุณโดยอัตโนมัติ

    หาก Gateway ทำงานเป็น service (launchd/systemd) มันจะไม่ inherit environment
    ของ shell คุณ แก้ไขด้วยวิธีใดวิธีหนึ่งต่อไปนี้:

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

    Copilot tokens ถูกอ่านจาก `COPILOT_GITHUB_TOKEN` (รวมถึง `GH_TOKEN` / `GITHUB_TOKEN`)
    ดู [/concepts/model-providers](/th/concepts/model-providers) และ [/environment](/th/help/environment)

  </Accordion>
</AccordionGroup>

## Sessions และหลายแชต

<AccordionGroup>
  <Accordion title="ฉันจะเริ่มบทสนทนาใหม่ได้อย่างไร?">
    ส่ง `/new` หรือ `/reset` เป็นข้อความเดี่ยว ดู [การจัดการ Session](/th/concepts/session)
  </Accordion>

  <Accordion title="Session จะรีเซ็ตโดยอัตโนมัติหรือไม่ถ้าฉันไม่เคยส่ง /new?">
    Session สามารถหมดอายุหลังจาก `session.idleMinutes` แต่สิ่งนี้ **ปิดอยู่โดยค่าเริ่มต้น** (ค่าเริ่มต้น **0**)
    ตั้งค่าเป็นค่าบวกเพื่อเปิดใช้การหมดอายุเมื่อ idle เมื่อเปิดใช้ ข้อความ **ถัดไป**
    หลังช่วง idle จะเริ่ม session id ใหม่สำหรับ chat key นั้น
    สิ่งนี้ไม่ลบ transcript แต่เพียงเริ่ม session ใหม่

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="มีวิธีสร้างทีมของ instance OpenClaw (CEO หนึ่งคนและ agents หลายตัว) หรือไม่?">
    มี ผ่าน **การ routing แบบ multi-agent** และ **sub-agents** คุณสามารถสร้าง agent ผู้ประสานงานหนึ่งตัว
    และ worker agents หลายตัวพร้อม workspace และโมเดลของตนเอง

    อย่างไรก็ตาม ควรมองสิ่งนี้เป็น **การทดลองสนุก ๆ** มากกว่า มันใช้ token มากและมัก
    มีประสิทธิภาพน้อยกว่าการใช้บอตหนึ่งตัวพร้อม session แยกกัน โมเดลทั่วไปที่เรา
    คาดไว้คือบอตหนึ่งตัวที่คุณคุยด้วย พร้อม session ต่าง ๆ สำหรับงานคู่ขนาน บอตนั้น
    ยังสามารถ spawn sub-agents เมื่อจำเป็นได้ด้วย

    เอกสาร: [การ routing แบบ multi-agent](/th/concepts/multi-agent), [Sub-agents](/th/tools/subagents), [Agents CLI](/th/cli/agents)

  </Accordion>

  <Accordion title="ทำไม context ถึงถูกตัดกลางงาน? ฉันจะป้องกันได้อย่างไร?">
    Session context ถูกจำกัดด้วย window ของโมเดล แชตยาว ๆ, output จากเครื่องมือขนาดใหญ่ หรือไฟล์จำนวนมาก
    สามารถทำให้เกิด Compaction หรือการตัดทอนได้

    สิ่งที่ช่วยได้:

    - ขอให้บอตสรุปสถานะปัจจุบันและเขียนลงไฟล์
    - ใช้ `/compact` ก่อนงานยาว และ `/new` เมื่อเปลี่ยนหัวข้อ
    - เก็บ context สำคัญไว้ใน workspace และขอให้บอตอ่านกลับมา
    - ใช้ sub-agents สำหรับงานยาวหรืองานคู่ขนาน เพื่อให้แชตหลักเล็กลง
    - เลือกโมเดลที่มี context window ใหญ่ขึ้น หากเกิดเรื่องนี้บ่อย

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

    - Onboarding ยังมีตัวเลือก **Reset** หากพบ config ที่มีอยู่ ดู [Onboarding (CLI)](/th/start/wizard)
    - หากคุณใช้ profiles (`--profile` / `OPENCLAW_PROFILE`) ให้รีเซ็ต state dir แต่ละรายการ (ค่าเริ่มต้นคือ `~/.openclaw-<profile>`)
    - Dev reset: `openclaw gateway --dev --reset` (เฉพาะ dev; ลบ dev config + credentials + sessions + workspace)

  </Accordion>

  <Accordion title='ฉันได้รับ error "context too large" - ฉันจะรีเซ็ตหรือ compact ได้อย่างไร?'>
    ใช้อย่างใดอย่างหนึ่งต่อไปนี้:

    - **Compact** (คงบทสนทนาไว้แต่สรุป turn เก่า ๆ):

      ```
      /compact
      ```

      หรือ `/compact <instructions>` เพื่อกำกับ summary

    - **Reset** (session ID ใหม่สำหรับ chat key เดิม):

      ```
      /new
      /reset
      ```

    หากยังเกิดซ้ำ:

    - เปิดใช้หรือปรับแต่ง **session pruning** (`agents.defaults.contextPruning`) เพื่อตัด output เครื่องมือเก่า
    - ใช้โมเดลที่มี context window ใหญ่ขึ้น

    เอกสาร: [Compaction](/th/concepts/compaction), [Session pruning](/th/concepts/session-pruning), [การจัดการ Session](/th/concepts/session)

  </Accordion>

  <Accordion title='ทำไมฉันเห็น "LLM request rejected: messages.content.tool_use.input field required"?'>
    นี่คือ error การตรวจสอบจาก provider: โมเดลปล่อยบล็อก `tool_use` โดยไม่มี
    `input` ที่จำเป็น โดยปกติหมายความว่าประวัติ session เก่าหรือเสียหาย (มักเกิดหลัง thread ยาว ๆ
    หรือมีการเปลี่ยนเครื่องมือ/schema)

    วิธีแก้: เริ่ม session ใหม่ด้วย `/new` (ข้อความเดี่ยว)

  </Accordion>

  <Accordion title="ทำไมฉันได้รับข้อความ heartbeat ทุก 30 นาที?">
    Heartbeat ทำงานทุก **30m** โดยค่าเริ่มต้น (**1h** เมื่อใช้การยืนยันตัวตน OAuth) ปรับแต่งหรือปิดได้:

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

    หาก `HEARTBEAT.md` มีอยู่แต่แทบว่างเปล่า (มีเพียงบรรทัดว่างและ markdown
    headers เช่น `# Heading`) OpenClaw จะข้ามการรัน heartbeat เพื่อประหยัด API calls
    หากไฟล์หายไป heartbeat จะยังคงทำงานและโมเดลจะตัดสินใจว่าจะทำอะไร

    การ override ต่อ agent ใช้ `agents.list[].heartbeat` เอกสาร: [Heartbeat](/th/gateway/heartbeat)

  </Accordion>

  <Accordion title='ฉันจำเป็นต้องเพิ่ม "bot account" ลงในกลุ่ม WhatsApp หรือไม่?'>
    ไม่จำเป็น OpenClaw ทำงานบน **บัญชีของคุณเอง** ดังนั้นหากคุณอยู่ในกลุ่ม OpenClaw ก็เห็นกลุ่มนั้นได้
    โดยค่าเริ่มต้น การตอบกลับในกลุ่มจะถูกบล็อกจนกว่าคุณจะอนุญาตผู้ส่ง (`groupPolicy: "allowlist"`)

    หากคุณต้องการให้มีเพียง **คุณ** เท่านั้นที่ trigger การตอบกลับในกลุ่มได้:

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

    ตัวเลือก 2 (หากตั้งค่า/allowlist ไว้แล้ว): แสดงรายการกลุ่มจาก config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    เอกสาร: [WhatsApp](/th/channels/whatsapp), [Directory](/th/cli/directory), [Logs](/th/cli/logs)

  </Accordion>

  <Accordion title="ทำไม OpenClaw ไม่ตอบกลับในกลุ่ม?">
    สาเหตุที่พบบ่อยสองอย่าง:

    - การ mention gating เปิดอยู่ (ค่าเริ่มต้น) คุณต้อง @mention บอต (หรือตรงกับ `mentionPatterns`)
    - คุณตั้งค่า `channels.whatsapp.groups` โดยไม่มี `"*"` และกลุ่มไม่ได้อยู่ใน allowlist

    ดู [Groups](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages)

  </Accordion>

  <Accordion title="กลุ่ม/thread ใช้ context ร่วมกับ DM หรือไม่?">
    แชตตรงจะถูกรวมไปยัง session หลักโดยค่าเริ่มต้น กลุ่ม/channel มี session key ของตนเอง และ Telegram topics / Discord threads เป็น session แยกต่างหาก ดู [Groups](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages)
  </Accordion>

  <Accordion title="ฉันสร้างเวิร์กสเปซและเอเจนต์ได้กี่รายการ?">
    ไม่มีขีดจำกัดตายตัว หลายสิบรายการ (หรือแม้แต่หลายร้อยรายการ) ก็ได้ แต่ให้ระวังเรื่องต่อไปนี้:

    - **การเพิ่มขึ้นของพื้นที่ดิสก์:** เซสชัน + บันทึกบทสนทนาอยู่ใต้ `~/.openclaw/agents/<agentId>/sessions/`
    - **ต้นทุนโทเค็น:** เอเจนต์มากขึ้นหมายถึงการใช้งานโมเดลพร้อมกันมากขึ้น
    - **ภาระงานด้านปฏิบัติการ:** โปรไฟล์การตรวจสอบสิทธิ์ เวิร์กสเปซ และการกำหนดเส้นทางช่องทางแบบต่อเอเจนต์

    เคล็ดลับ:

    - เก็บเวิร์กสเปซที่ **ใช้งานอยู่** ไว้หนึ่งรายการต่อเอเจนต์ (`agents.defaults.workspace`)
    - ตัดเซสชันเก่าออก (ลบ JSONL หรือรายการในที่จัดเก็บ) หากดิสก์เพิ่มขึ้น
    - ใช้ `openclaw doctor` เพื่อตรวจหาเวิร์กสเปซที่หลงเหลือและโปรไฟล์ที่ไม่ตรงกัน

  </Accordion>

  <Accordion title="ฉันสามารถรันบอตหรือแชตหลายรายการพร้อมกันได้ไหม (Slack) และควรตั้งค่าอย่างไร?">
    ได้ ใช้ **การกำหนดเส้นทางหลายเอเจนต์** เพื่อรันเอเจนต์ที่แยกจากกันหลายรายการและกำหนดเส้นทางข้อความขาเข้าตาม
    ช่องทาง/บัญชี/เพียร์ Slack รองรับในฐานะช่องทางและสามารถผูกกับเอเจนต์เฉพาะได้

    การเข้าถึงเบราว์เซอร์มีพลังมาก แต่ไม่ใช่ "ทำทุกอย่างที่มนุษย์ทำได้" - ระบบกันบอต, CAPTCHA และ MFA ยังสามารถ
    บล็อกระบบอัตโนมัติได้ สำหรับการควบคุมเบราว์เซอร์ที่เชื่อถือได้มากที่สุด ให้ใช้ Chrome MCP แบบโลคัลบนโฮสต์
    หรือใช้ CDP บนเครื่องที่รันเบราว์เซอร์จริง

    การตั้งค่าตามแนวทางปฏิบัติที่ดีที่สุด:

    - โฮสต์ Gateway ที่เปิดตลอดเวลา (VPS/Mac mini)
    - หนึ่งเอเจนต์ต่อบทบาท (การผูก)
    - ช่องทาง Slack ที่ผูกกับเอเจนต์เหล่านั้น
    - เบราว์เซอร์โลคัลผ่าน Chrome MCP หรือโหนดเมื่อจำเป็น

    เอกสาร: [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [Slack](/th/channels/slack),
    [เบราว์เซอร์](/th/tools/browser), [โหนด](/th/nodes)

  </Accordion>
</AccordionGroup>

## โมเดล, การสลับเมื่อผิดพลาด และโปรไฟล์การตรวจสอบสิทธิ์

ถาม-ตอบเกี่ยวกับโมเดล — ค่าเริ่มต้น, การเลือก, นามแฝง, การสลับ, การสลับเมื่อผิดพลาด, โปรไฟล์การตรวจสอบสิทธิ์ —
อยู่ใน [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models)

## Gateway: พอร์ต, "รันอยู่แล้ว" และโหมดระยะไกล

<AccordionGroup>
  <Accordion title="Gateway ใช้พอร์ตใด?">
    `gateway.port` ควบคุมพอร์ตมัลติเพล็กซ์เดียวสำหรับ WebSocket + HTTP (Control UI, ฮุก ฯลฯ)

    ลำดับความสำคัญ:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status จึงบอกว่า "Runtime: running" แต่ "Connectivity probe: failed"?'>
    เพราะ "running" เป็นมุมมองของ **ซูเปอร์ไวเซอร์** (launchd/systemd/schtasks) การตรวจสอบการเชื่อมต่อคือ CLI ที่เชื่อมต่อกับ WebSocket ของ Gateway จริง ๆ

    ใช้ `openclaw gateway status` และเชื่อถือบรรทัดเหล่านี้:

    - `Probe target:` (URL ที่การตรวจสอบใช้จริง)
    - `Listening:` (สิ่งที่ผูกอยู่บนพอร์ตจริง)
    - `Last gateway error:` (สาเหตุรากที่พบบ่อยเมื่อโปรเซสยังมีชีวิตอยู่แต่พอร์ตไม่ได้ฟังอยู่)

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status จึงแสดง "Config (cli)" และ "Config (service)" ต่างกัน?'>
    คุณกำลังแก้ไขไฟล์คอนฟิกหนึ่งไฟล์ในขณะที่บริการกำลังรันอีกไฟล์หนึ่ง (มักเป็นความไม่ตรงกันของ `--profile` / `OPENCLAW_STATE_DIR`)

    วิธีแก้:

    ```bash
    openclaw gateway install --force
    ```

    รันคำสั่งนั้นจาก `--profile` / สภาพแวดล้อมเดียวกับที่คุณต้องการให้บริการใช้

  </Accordion>

  <Accordion title='"another gateway instance is already listening" หมายความว่าอะไร?'>
    OpenClaw บังคับใช้ล็อกรันไทม์โดยผูกตัวฟัง WebSocket ทันทีเมื่อเริ่มต้น (ค่าเริ่มต้น `ws://127.0.0.1:18789`) หากการผูกล้มเหลวด้วย `EADDRINUSE` จะโยน `GatewayLockError` ที่ระบุว่ามีอินสแตนซ์อื่นกำลังฟังอยู่แล้ว

    วิธีแก้: หยุดอินสแตนซ์อื่น, ปล่อยพอร์ต, หรือรันด้วย `openclaw gateway --port <port>`

  </Accordion>

  <Accordion title="ฉันจะรัน OpenClaw ในโหมดระยะไกลได้อย่างไร (ไคลเอนต์เชื่อมต่อกับ Gateway ที่อื่น)?">
    ตั้งค่า `gateway.mode: "remote"` และชี้ไปยัง URL WebSocket ระยะไกล โดยเลือกใช้ข้อมูลรับรองระยะไกลแบบความลับร่วมได้:

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

    - `openclaw gateway` จะเริ่มเฉพาะเมื่อ `gateway.mode` เป็น `local` (หรือคุณส่งแฟล็ก override)
    - แอป macOS เฝ้าดูไฟล์คอนฟิกและสลับโหมดแบบสดเมื่อค่าเหล่านี้เปลี่ยน
    - `gateway.remote.token` / `.password` เป็นข้อมูลรับรองระยะไกลฝั่งไคลเอนต์เท่านั้น; ค่าเหล่านี้ไม่ได้เปิดใช้งานการตรวจสอบสิทธิ์ Gateway โลคัลด้วยตัวเอง

  </Accordion>

  <Accordion title='Control UI บอกว่า "unauthorized" (หรือเชื่อมต่อใหม่ซ้ำ ๆ) ตอนนี้ควรทำอย่างไร?'>
    เส้นทางการตรวจสอบสิทธิ์ Gateway ของคุณและวิธีการตรวจสอบสิทธิ์ของ UI ไม่ตรงกัน

    ข้อเท็จจริง (จากโค้ด):

    - Control UI เก็บโทเค็นไว้ใน `sessionStorage` สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL Gateway ที่เลือก ดังนั้นการรีเฟรชในแท็บเดิมยังคงทำงานได้โดยไม่ต้องกู้คืนการคงอยู่ของโทเค็นใน localStorage ระยะยาว
    - เมื่อเกิด `AUTH_TOKEN_MISMATCH` ไคลเอนต์ที่เชื่อถือได้สามารถลองใหม่แบบมีขอบเขตหนึ่งครั้งด้วยโทเค็นอุปกรณ์ที่แคชไว้ เมื่อ Gateway ส่งคำแนะนำให้ลองใหม่ (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)
    - การลองใหม่ด้วยโทเค็นที่แคชไว้นั้นตอนนี้ใช้สโคปที่อนุมัติแล้วซึ่งแคชไว้กับโทเค็นอุปกรณ์อีกครั้ง ผู้เรียกที่ระบุ `deviceToken` / `scopes` อย่างชัดเจนยังคงเก็บชุดสโคปที่ร้องขอไว้ แทนที่จะสืบทอดสโคปที่แคชไว้
    - นอกเส้นทางการลองใหม่นั้น ลำดับความสำคัญของการตรวจสอบสิทธิ์การเชื่อมต่อคือโทเค็น/รหัสผ่านความลับร่วมที่ระบุอย่างชัดเจนก่อน จากนั้น `deviceToken` ที่ระบุอย่างชัดเจน จากนั้นโทเค็นอุปกรณ์ที่จัดเก็บไว้ จากนั้นโทเค็นบูตสแตรป
    - การตรวจสอบสโคปของโทเค็นบูตสแตรปมีคำนำหน้าบทบาท รายการอนุญาตผู้ปฏิบัติการบูตสแตรปในตัวตอบสนองเฉพาะคำขอของผู้ปฏิบัติการ; บทบาทโหนดหรือบทบาทที่ไม่ใช่ผู้ปฏิบัติการอื่นยังต้องมีสโคปภายใต้คำนำหน้าบทบาทของตัวเอง

    วิธีแก้:

    - เร็วที่สุด: `openclaw dashboard` (พิมพ์ + คัดลอก URL แดชบอร์ด, พยายามเปิด; แสดงคำแนะนำ SSH หากไม่มีหน้าจอ)
    - หากคุณยังไม่มีโทเค็น: `openclaw doctor --generate-gateway-token`
    - หากเป็นระยะไกล ให้สร้างทันเนลก่อน: `ssh -N -L 18789:127.0.0.1:18789 user@host` จากนั้นเปิด `http://127.0.0.1:18789/`
    - โหมดความลับร่วม: ตั้งค่า `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` จากนั้นวางความลับที่ตรงกันในการตั้งค่า Control UI
    - โหมด Tailscale Serve: ตรวจสอบให้แน่ใจว่าเปิดใช้งาน `gateway.auth.allowTailscale` และคุณกำลังเปิด URL Serve ไม่ใช่ URL loopback/tailnet ดิบที่ข้ามส่วนหัวระบุตัวตนของ Tailscale
    - โหมดพร็อกซีที่เชื่อถือได้: ตรวจสอบให้แน่ใจว่าคุณกำลังเข้าผ่านพร็อกซีที่รับรู้ตัวตนตามที่กำหนดค่าไว้ ไม่ใช่ URL Gateway ดิบ พร็อกซี loopback บนโฮสต์เดียวกันยังต้องใช้ `gateway.auth.trustedProxy.allowLoopback = true`
    - หากยังไม่ตรงกันหลังการลองใหม่หนึ่งครั้ง ให้หมุนเวียน/อนุมัติโทเค็นอุปกรณ์ที่จับคู่อีกครั้ง:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - หากคำสั่ง rotate นั้นบอกว่าถูกปฏิเสธ ให้ตรวจสองเรื่อง:
      - เซสชันอุปกรณ์ที่จับคู่สามารถหมุนเวียนได้เฉพาะอุปกรณ์ **ของตัวเอง** เว้นแต่จะมี `operator.admin` ด้วย
      - ค่า `--scope` ที่ระบุอย่างชัดเจนต้องไม่เกินสโคปผู้ปฏิบัติการปัจจุบันของผู้เรียก
    - ยังติดอยู่? รัน `openclaw status --all` และทำตาม [การแก้ไขปัญหา](/th/gateway/troubleshooting) ดู [แดชบอร์ด](/th/web/dashboard) สำหรับรายละเอียดการตรวจสอบสิทธิ์

  </Accordion>

  <Accordion title="ฉันตั้งค่า gateway.bind เป็น tailnet แต่ไม่สามารถผูกได้และไม่มีอะไรฟังอยู่">
    การผูก `tailnet` เลือก IP ของ Tailscale จากอินเทอร์เฟซเครือข่ายของคุณ (100.64.0.0/10) หากเครื่องไม่ได้อยู่บน Tailscale (หรืออินเทอร์เฟซล่ม) ก็ไม่มีอะไรให้ผูก

    วิธีแก้:

    - เริ่ม Tailscale บนโฮสต์นั้น (เพื่อให้มีที่อยู่ 100.x), หรือ
    - เปลี่ยนเป็น `gateway.bind: "loopback"` / `"lan"`

    หมายเหตุ: `tailnet` เป็นการระบุอย่างชัดเจน `auto` จะเลือก loopback ก่อน; ใช้ `gateway.bind: "tailnet"` เมื่อคุณต้องการผูกกับ tailnet เท่านั้น

  </Accordion>

  <Accordion title="ฉันสามารถรัน Gateway หลายตัวบนโฮสต์เดียวกันได้ไหม?">
    โดยปกติไม่ได้ - Gateway หนึ่งตัวสามารถรันช่องทางรับส่งข้อความและเอเจนต์หลายรายการได้ ใช้ Gateway หลายตัวเฉพาะเมื่อคุณต้องการความซ้ำซ้อน (เช่น บอตกู้ระบบ) หรือการแยกอย่างเข้มงวด

    ได้ แต่คุณต้องแยกสิ่งต่อไปนี้:

    - `OPENCLAW_CONFIG_PATH` (คอนฟิกต่ออินสแตนซ์)
    - `OPENCLAW_STATE_DIR` (สถานะต่ออินสแตนซ์)
    - `agents.defaults.workspace` (การแยกเวิร์กสเปซ)
    - `gateway.port` (พอร์ตที่ไม่ซ้ำกัน)

    การตั้งค่าอย่างรวดเร็ว (แนะนำ):

    - ใช้ `openclaw --profile <name> ...` ต่ออินสแตนซ์ (สร้าง `~/.openclaw-<name>` อัตโนมัติ)
    - ตั้งค่า `gateway.port` ที่ไม่ซ้ำกันในคอนฟิกของแต่ละโปรไฟล์ (หรือส่ง `--port` สำหรับการรันด้วยตนเอง)
    - ติดตั้งบริการต่อโปรไฟล์: `openclaw --profile <name> gateway install`

    โปรไฟล์ยังเพิ่มส่วนท้ายให้ชื่อบริการด้วย (`ai.openclaw.<profile>`; แบบเดิม `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`)
    คู่มือฉบับเต็ม: [หลาย Gateway](/th/gateway/multiple-gateways)

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008 หมายความว่าอะไร?'>
    Gateway เป็น **เซิร์ฟเวอร์ WebSocket** และคาดว่าข้อความแรกสุดจะ
    เป็นเฟรม `connect` หากได้รับอย่างอื่น จะปิดการเชื่อมต่อ
    ด้วย **code 1008** (การละเมิดนโยบาย)

    สาเหตุที่พบบ่อย:

    - คุณเปิด URL **HTTP** ในเบราว์เซอร์ (`http://...`) แทนที่จะใช้ไคลเอนต์ WS
    - คุณใช้พอร์ตหรือพาธผิด
    - พร็อกซีหรือทันเนลลบส่วนหัวการตรวจสอบสิทธิ์หรือส่งคำขอที่ไม่ใช่ Gateway

    วิธีแก้ด่วน:

    1. ใช้ URL WS: `ws://<host>:18789` (หรือ `wss://...` หากเป็น HTTPS)
    2. อย่าเปิดพอร์ต WS ในแท็บเบราว์เซอร์ปกติ
    3. หากเปิดการตรวจสอบสิทธิ์ ให้ใส่โทเค็น/รหัสผ่านในเฟรม `connect`

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

    คุณสามารถตั้งค่าพาธที่เสถียรผ่าน `logging.file` ระดับล็อกไฟล์ควบคุมโดย `logging.level` ความละเอียดของคอนโซลควบคุมโดย `--verbose` และ `logging.consoleLevel`

    วิธี tail ล็อกที่เร็วที่สุด:

    ```bash
    openclaw logs --follow
    ```

    ล็อกบริการ/ซูเปอร์ไวเซอร์ (เมื่อ Gateway รันผ่าน launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` และ `gateway.err.log` (ค่าเริ่มต้น: `~/.openclaw/logs/...`; โปรไฟล์ใช้ `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    ดู [การแก้ไขปัญหา](/th/gateway/troubleshooting) สำหรับข้อมูลเพิ่มเติม

  </Accordion>

  <Accordion title="ฉันจะเริ่ม/หยุด/รีสตาร์ตบริการ Gateway ได้อย่างไร?">
    ใช้ตัวช่วย Gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณรัน Gateway ด้วยตนเอง `openclaw gateway --force` สามารถยึดพอร์ตกลับมาได้ ดู [Gateway](/th/gateway)

  </Accordion>

  <Accordion title="ฉันปิดเทอร์มินัลบน Windows ไปแล้ว - จะรีสตาร์ต OpenClaw ได้อย่างไร?">
    มี **สองโหมดการติดตั้งบน Windows**:

    **1) WSL2 (แนะนำ):** Gateway รันอยู่ใน Linux

    เปิด PowerShell, เข้า WSL, จากนั้นรีสตาร์ต:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณไม่เคยติดตั้งบริการ ให้เริ่มในโฟร์กราวด์:

    ```bash
    openclaw gateway run
    ```

    **2) Windows แบบเนทีฟ (ไม่แนะนำ):** Gateway รันโดยตรงใน Windows

    เปิด PowerShell และรัน:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณรันด้วยตนเอง (ไม่มีบริการ) ให้ใช้:

    ```powershell
    openclaw gateway run
    ```

    เอกสาร: [Windows (WSL2)](/th/platforms/windows), [คู่มือปฏิบัติการบริการ Gateway](/th/gateway)

  </Accordion>

  <Accordion title="Gateway ทำงานแล้วแต่การตอบกลับไม่เคยมาถึง ฉันควรตรวจอะไร?">
    เริ่มด้วยการตรวจสุขภาพอย่างรวดเร็ว:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    สาเหตุที่พบบ่อย:

    - ไม่ได้โหลดการยืนยันตัวตนของโมเดลบน **โฮสต์ Gateway** (ตรวจสอบ `models status`)
    - การจับคู่ช่องทาง/allowlist บล็อกการตอบกลับ (ตรวจสอบการตั้งค่าช่องทางและบันทึก)
    - WebChat/Dashboard เปิดอยู่โดยไม่มีโทเค็นที่ถูกต้อง

    หากคุณใช้งานจากระยะไกล ให้ยืนยันว่าการเชื่อมต่อ tunnel/Tailscale ทำงานอยู่ และ
    Gateway WebSocket เข้าถึงได้

    เอกสาร: [ช่องทาง](/th/channels), [การแก้ไขปัญหา](/th/gateway/troubleshooting), [การเข้าถึงระยะไกล](/th/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - ต้องทำอย่างไรต่อ?'>
    โดยปกติหมายความว่า UI สูญเสียการเชื่อมต่อ WebSocket ตรวจสอบ:

    1. Gateway ทำงานอยู่หรือไม่? `openclaw gateway status`
    2. Gateway อยู่ในสถานะปกติหรือไม่? `openclaw status`
    3. UI มีโทเค็นที่ถูกต้องหรือไม่? `openclaw dashboard`
    4. หากใช้งานจากระยะไกล ลิงก์ tunnel/Tailscale ทำงานอยู่หรือไม่?

    จากนั้นติดตามบันทึก:

    ```bash
    openclaw logs --follow
    ```

    เอกสาร: [Dashboard](/th/web/dashboard), [การเข้าถึงระยะไกล](/th/gateway/remote), [การแก้ไขปัญหา](/th/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands ล้มเหลว ควรตรวจสอบอะไร?">
    เริ่มจากบันทึกและสถานะช่องทาง:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    จากนั้นเทียบกับข้อผิดพลาด:

    - `BOT_COMMANDS_TOO_MUCH`: เมนู Telegram มีรายการมากเกินไป OpenClaw ตัดให้เหลือไม่เกินขีดจำกัดของ Telegram และลองใหม่ด้วยคำสั่งที่น้อยลงแล้ว แต่ยังต้องตัดบางรายการในเมนูออก ลดคำสั่งของ plugin/skill/คำสั่งกำหนดเอง หรือปิดใช้ `channels.telegram.commands.native` หากคุณไม่ต้องการเมนู
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` หรือข้อผิดพลาดเครือข่ายที่คล้ายกัน: หากคุณอยู่บน VPS หรือหลังพร็อกซี ให้ยืนยันว่าอนุญาต HTTPS ขาออกและ DNS ใช้งานได้สำหรับ `api.telegram.org`

    หาก Gateway อยู่ระยะไกล ตรวจสอบให้แน่ใจว่าคุณกำลังดูบันทึกบนโฮสต์ Gateway

    เอกสาร: [Telegram](/th/channels/telegram), [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI ไม่แสดงเอาต์พุต ควรตรวจสอบอะไร?">
    ก่อนอื่นยืนยันว่าเข้าถึง Gateway ได้และเอเจนต์สามารถทำงานได้:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    ใน TUI ให้ใช้ `/status` เพื่อดูสถานะปัจจุบัน หากคุณคาดว่าจะได้รับการตอบกลับในช่องทางแชต
    ตรวจสอบว่าเปิดการส่งข้อความอยู่ (`/deliver on`)

    เอกสาร: [TUI](/th/web/tui), [คำสั่ง Slash](/th/tools/slash-commands).

  </Accordion>

  <Accordion title="จะหยุดแล้วเริ่ม Gateway ใหม่ทั้งหมดได้อย่างไร?">
    หากคุณติดตั้งบริการไว้:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    การดำเนินการนี้หยุด/เริ่ม **บริการที่ถูกควบคุม** (launchd บน macOS, systemd บน Linux)
    ใช้เมื่อ Gateway ทำงานอยู่เบื้องหลังเป็น daemon

    หากคุณกำลังรันแบบเบื้องหน้า ให้หยุดด้วย Ctrl-C แล้ว:

    ```bash
    openclaw gateway run
    ```

    เอกสาร: [คู่มือปฏิบัติการบริการ Gateway](/th/gateway).

  </Accordion>

  <Accordion title="อธิบายแบบง่ายๆ: openclaw gateway restart เทียบกับ openclaw gateway">
    - `openclaw gateway restart`: รีสตาร์ต **บริการเบื้องหลัง** (launchd/systemd)
    - `openclaw gateway`: รัน gateway **ในเบื้องหน้า** สำหรับเซสชันเทอร์มินัลนี้

    หากคุณติดตั้งบริการไว้ ให้ใช้คำสั่ง gateway ใช้ `openclaw gateway` เมื่อ
    คุณต้องการรันครั้งเดียวแบบเบื้องหน้า

  </Accordion>

  <Accordion title="วิธีที่เร็วที่สุดในการดูรายละเอียดเพิ่มเติมเมื่อบางอย่างล้มเหลว">
    เริ่ม Gateway ด้วย `--verbose` เพื่อดูรายละเอียดในคอนโซลมากขึ้น จากนั้นตรวจสอบไฟล์บันทึกสำหรับการยืนยันตัวตนช่องทาง การกำหนดเส้นทางโมเดล และข้อผิดพลาด RPC
  </Accordion>
</AccordionGroup>

## สื่อและไฟล์แนบ

<AccordionGroup>
  <Accordion title="Skill ของฉันสร้างรูปภาพ/PDF แล้ว แต่ไม่มีอะไรถูกส่ง">
    ไฟล์แนบขาออกจากเอเจนต์ต้องมีบรรทัด `MEDIA:<path-or-url>` (อยู่ในบรรทัดของตัวเอง) ดู [การตั้งค่าผู้ช่วย OpenClaw](/th/start/openclaw) และ [การส่งของเอเจนต์](/th/tools/agent-send)

    การส่งผ่าน CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    ตรวจสอบเพิ่มเติม:

    - ช่องทางเป้าหมายรองรับสื่อขาออกและไม่ได้ถูกบล็อกโดย allowlist
    - ไฟล์อยู่ภายในขีดจำกัดขนาดของผู้ให้บริการ (รูปภาพจะถูกปรับขนาดสูงสุดเป็น 2048px)
    - `tools.fs.workspaceOnly=true` จำกัดการส่งด้วยพาธภายในเครื่องให้อยู่เฉพาะ workspace, temp/media-store และไฟล์ที่ผ่านการตรวจสอบโดย sandbox
    - `tools.fs.workspaceOnly=false` อนุญาตให้ `MEDIA:` ส่งไฟล์ภายในโฮสต์ที่เอเจนต์อ่านได้อยู่แล้ว แต่เฉพาะสื่อและประเภทเอกสารที่ปลอดภัยเท่านั้น (รูปภาพ เสียง วิดีโอ PDF และเอกสาร Office) ไฟล์ข้อความล้วนและไฟล์ที่ดูเหมือนเป็นความลับยังคงถูกบล็อก

    ดู [รูปภาพ](/th/nodes/images).

  </Accordion>
</AccordionGroup>

## ความปลอดภัยและการควบคุมการเข้าถึง

<AccordionGroup>
  <Accordion title="การเปิด OpenClaw ให้รับ DM ขาเข้าปลอดภัยหรือไม่?">
    ให้ถือว่า DM ขาเข้าเป็นอินพุตที่ไม่น่าเชื่อถือ ค่าเริ่มต้นออกแบบมาเพื่อลดความเสี่ยง:

    - พฤติกรรมเริ่มต้นบนช่องทางที่รองรับ DM คือ **การจับคู่**:
      - ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ บอทจะไม่ประมวลผลข้อความของพวกเขา
      - อนุมัติด้วย: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - คำขอที่รอดำเนินการถูกจำกัดไว้ที่ **3 ต่อช่องทาง**; ตรวจสอบ `openclaw pairing list --channel <channel> [--account <id>]` หากรหัสไม่มาถึง
    - การเปิด DM แบบสาธารณะต้องเลือกใช้โดยชัดเจน (`dmPolicy: "open"` และ allowlist `"*"`)

    รัน `openclaw doctor` เพื่อแสดงนโยบาย DM ที่มีความเสี่ยง

  </Accordion>

  <Accordion title="prompt injection เป็นปัญหาเฉพาะบอทสาธารณะเท่านั้นหรือไม่?">
    ไม่ใช่ prompt injection เกี่ยวข้องกับ **เนื้อหาที่ไม่น่าเชื่อถือ** ไม่ใช่แค่ว่าใครสามารถ DM บอทได้
    หากผู้ช่วยของคุณอ่านเนื้อหาภายนอก (การค้นหา/ดึงเว็บ หน้าเบราว์เซอร์ อีเมล
    เอกสาร ไฟล์แนบ บันทึกที่วางเข้ามา) เนื้อหานั้นอาจมีคำสั่งที่พยายาม
    แย่งการควบคุมโมเดล เหตุการณ์นี้เกิดขึ้นได้แม้ว่า **คุณจะเป็นผู้ส่งเพียงคนเดียว**

    ความเสี่ยงที่ใหญ่ที่สุดคือเมื่อเปิดใช้เครื่องมือ: โมเดลอาจถูกหลอกให้
    ส่งออกบริบทหรือเรียกใช้เครื่องมือแทนคุณ ลดขอบเขตความเสียหายโดย:

    - ใช้เอเจนต์ "reader" แบบอ่านอย่างเดียวหรือปิดเครื่องมือเพื่อสรุปเนื้อหาที่ไม่น่าเชื่อถือ
    - ปิด `web_search` / `web_fetch` / `browser` สำหรับเอเจนต์ที่เปิดใช้เครื่องมือ
    - ถือว่าข้อความไฟล์/เอกสารที่ถอดรหัสแล้วไม่น่าเชื่อถือเช่นกัน: OpenResponses
      `input_file` และการดึงข้อมูลจากไฟล์แนบสื่อต่างก็ครอบข้อความที่ดึงออกมาด้วย
      เครื่องหมายขอบเขตเนื้อหาภายนอกอย่างชัดเจน แทนที่จะส่งข้อความไฟล์ดิบ
    - ใช้ sandbox และ allowlist เครื่องมือที่เข้มงวด

    รายละเอียด: [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="บอทของฉันควรมีอีเมล บัญชี GitHub หรือหมายเลขโทรศัพท์ของตัวเองหรือไม่?">
    ใช่ สำหรับการตั้งค่าส่วนใหญ่ การแยกบอทด้วยบัญชีและหมายเลขโทรศัพท์ต่างหาก
    ช่วยลดขอบเขตความเสียหายหากมีสิ่งผิดพลาด นอกจากนี้ยังทำให้หมุนเวียน
    ข้อมูลประจำตัวหรือเพิกถอนการเข้าถึงได้ง่ายขึ้นโดยไม่กระทบบัญชีส่วนตัวของคุณ

    เริ่มจากเล็กๆ ให้สิทธิ์เข้าถึงเฉพาะเครื่องมือและบัญชีที่คุณต้องใช้จริง แล้วค่อยขยาย
    ในภายหลังหากจำเป็น

    เอกสาร: [ความปลอดภัย](/th/gateway/security), [การจับคู่](/th/channels/pairing).

  </Accordion>

  <Accordion title="ฉันให้มันมีอิสระจัดการข้อความส่วนตัวของฉันได้ไหม และปลอดภัยหรือไม่?">
    เรา **ไม่** แนะนำให้ให้อิสระเต็มรูปแบบกับข้อความส่วนตัวของคุณ รูปแบบที่ปลอดภัยที่สุดคือ:

    - ให้ DM อยู่ใน **โหมดการจับคู่** หรือ allowlist ที่เข้มงวด
    - ใช้ **หมายเลขหรือบัญชีแยกต่างหาก** หากคุณต้องการให้มันส่งข้อความแทนคุณ
    - ให้มันร่างข้อความ แล้ว **อนุมัติก่อนส่ง**

    หากคุณต้องการทดลอง ให้ทำบนบัญชีเฉพาะและแยกไว้อย่างชัดเจน ดู
    [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="ฉันใช้โมเดลที่ถูกกว่าสำหรับงานผู้ช่วยส่วนตัวได้ไหม?">
    ได้ **หาก** เอเจนต์ใช้แชตอย่างเดียวและอินพุตน่าเชื่อถือ ระดับโมเดลที่เล็กกว่า
    เสี่ยงต่อการถูกแย่งคำสั่งมากกว่า ดังนั้นหลีกเลี่ยงสำหรับเอเจนต์ที่เปิดใช้เครื่องมือ
    หรือเมื่ออ่านเนื้อหาที่ไม่น่าเชื่อถือ หากคุณจำเป็นต้องใช้โมเดลที่เล็กกว่า ให้ล็อก
    เครื่องมือและรันภายใน sandbox ดู [ความปลอดภัย](/th/gateway/security).
  </Accordion>

  <Accordion title="ฉันรัน /start ใน Telegram แต่ไม่ได้รับรหัสจับคู่">
    รหัสจับคู่จะถูกส่ง **เฉพาะ** เมื่อผู้ส่งที่ไม่รู้จักส่งข้อความถึงบอทและ
    เปิดใช้ `dmPolicy: "pairing"` อยู่ `/start` เพียงอย่างเดียวไม่สร้างรหัส

    ตรวจสอบคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list telegram
    ```

    หากคุณต้องการเข้าถึงทันที ให้เพิ่ม id ผู้ส่งของคุณใน allowlist หรือตั้งค่า `dmPolicy: "open"`
    สำหรับบัญชีนั้น

  </Accordion>

  <Accordion title="WhatsApp: มันจะส่งข้อความหาผู้ติดต่อของฉันไหม? การจับคู่ทำงานอย่างไร?">
    ไม่ นโยบาย WhatsApp DM เริ่มต้นคือ **การจับคู่** ผู้ส่งที่ไม่รู้จักจะได้รับเพียงรหัสจับคู่ และข้อความของพวกเขา **จะไม่ถูกประมวลผล** OpenClaw ตอบกลับเฉพาะแชตที่ได้รับ หรือการส่งที่คุณเรียกใช้อย่างชัดเจนเท่านั้น

    อนุมัติการจับคู่ด้วย:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    แสดงรายการคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list whatsapp
    ```

    พรอมป์หมายเลขโทรศัพท์ในตัวช่วยตั้งค่า: ใช้เพื่อตั้งค่า **allowlist/เจ้าของ** ของคุณเพื่อให้ DM ของคุณเองได้รับอนุญาต ไม่ได้ใช้สำหรับการส่งอัตโนมัติ หากคุณรันบนหมายเลข WhatsApp ส่วนตัวของคุณ ให้ใช้หมายเลขนั้นและเปิดใช้ `channels.whatsapp.selfChatMode`

  </Accordion>
</AccordionGroup>

## คำสั่งแชต การยกเลิกงาน และ "มันไม่หยุด"

<AccordionGroup>
  <Accordion title="จะหยุดไม่ให้ข้อความระบบภายในแสดงในแชตได้อย่างไร?">
    ข้อความภายในหรือข้อความเครื่องมือส่วนใหญ่จะปรากฏเมื่อเปิดใช้ **verbose**, **trace** หรือ **reasoning**
    สำหรับเซสชันนั้นเท่านั้น

    แก้ไขในแชตที่คุณเห็น:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    หากยังมีเสียงรบกวนมาก ให้ตรวจสอบการตั้งค่าเซสชันใน Control UI และตั้งค่า verbose
    เป็น **inherit** และยืนยันด้วยว่าคุณไม่ได้ใช้โปรไฟล์บอทที่ตั้ง `verboseDefault`
    เป็น `on` ในการตั้งค่า

    เอกสาร: [การคิดและ verbose](/th/tools/thinking), [ความปลอดภัย](/th/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="จะหยุด/ยกเลิกงานที่กำลังรันได้อย่างไร?">
    ส่งรายการใดรายการหนึ่งต่อไปนี้ **เป็นข้อความเดี่ยว** (ไม่มี slash):

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

    รายการเหล่านี้เป็นตัวกระตุ้นการยกเลิก (ไม่ใช่คำสั่ง slash)

    สำหรับกระบวนการเบื้องหลัง (จากเครื่องมือ exec) คุณขอให้เอเจนต์รันได้ว่า:

    ```
    process action:kill sessionId:XXX
    ```

    ภาพรวมคำสั่ง slash: ดู [คำสั่ง Slash](/th/tools/slash-commands).

    คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความ **เดี่ยว** ที่ขึ้นต้นด้วย `/` แต่ทางลัดบางรายการ (เช่น `/status`) ใช้แบบ inline ได้เช่นกันสำหรับผู้ส่งที่อยู่ใน allowlist

  </Accordion>

  <Accordion title='จะส่งข้อความ Discord จาก Telegram ได้อย่างไร? ("Cross-context messaging denied")'>
    OpenClaw บล็อกการส่งข้อความ **ข้ามผู้ให้บริการ** โดยค่าเริ่มต้น หากการเรียกเครื่องมือผูกอยู่กับ
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

    รีสตาร์ต gateway หลังแก้ไขการตั้งค่า

  </Accordion>

  <Accordion title='ทำไมบอทดูเหมือน "เมิน" ข้อความที่ส่งรัวๆ?'>
    โหมดคิวควบคุมว่าข้อความใหม่โต้ตอบกับการรันที่กำลังดำเนินอยู่แบบใด ใช้ `/queue` เพื่อเปลี่ยนโหมด:

    - `steer` - จัดคิวการชี้นำที่รอดำเนินการทั้งหมดสำหรับขอบเขตโมเดลถัดไปในการรันปัจจุบัน
    - `queue` - การชี้นำแบบเดิมทีละรายการ
    - `followup` - รันข้อความทีละรายการ
    - `collect` - รวมข้อความเป็นชุดและตอบครั้งเดียว
    - `steer-backlog` - ชี้นำตอนนี้ แล้วจึงประมวลผลงานค้าง
    - `interrupt` - ยกเลิกการรันปัจจุบันและเริ่มใหม่

    โหมดเริ่มต้นคือ `steer` คุณสามารถเพิ่มตัวเลือกอย่าง `debounce:0.5s cap:25 drop:summarize` สำหรับโหมดติดตามผลได้ ดู [คิวคำสั่ง](/th/concepts/queue) และ [คิวการควบคุมทิศทาง](/th/concepts/queue-steering)

  </Accordion>
</AccordionGroup>

## เบ็ดเตล็ด

<AccordionGroup>
  <Accordion title='โมเดลเริ่มต้นสำหรับ Anthropic เมื่อใช้คีย์ API คืออะไร?'>
    ใน OpenClaw ข้อมูลรับรองและการเลือกโมเดลเป็นคนละส่วนกัน การตั้งค่า `ANTHROPIC_API_KEY` (หรือการเก็บคีย์ API ของ Anthropic ไว้ในโปรไฟล์การยืนยันตัวตน) จะเปิดใช้งานการยืนยันตัวตน แต่โมเดลเริ่มต้นจริงคือโมเดลที่คุณกำหนดค่าไว้ใน `agents.defaults.model.primary` (เช่น `anthropic/claude-sonnet-4-6` หรือ `anthropic/claude-opus-4-6`) หากคุณเห็น `No credentials found for profile "anthropic:default"` หมายความว่า Gateway ไม่พบข้อมูลรับรองของ Anthropic ใน `auth-profiles.json` ที่คาดไว้สำหรับเอเจนต์ที่กำลังทำงานอยู่
  </Accordion>
</AccordionGroup>

---

ยังติดขัดอยู่ใช่ไหม? ถามใน [Discord](https://discord.com/invite/clawd) หรือเปิด [การสนทนาใน GitHub](https://github.com/openclaw/openclaw/discussions)

## ที่เกี่ยวข้อง

- [คำถามที่พบบ่อยเกี่ยวกับการใช้งานครั้งแรก](/th/help/faq-first-run) — การติดตั้ง การเริ่มต้นใช้งาน การยืนยันตัวตน การสมัครใช้งาน ความล้มเหลวช่วงแรก
- [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models) — การเลือกโมเดล การสลับเมื่อเกิดความล้มเหลว โปรไฟล์การยืนยันตัวตน
- [การแก้ไขปัญหา](/th/help/troubleshooting) — การคัดแยกปัญหาโดยเริ่มจากอาการ
