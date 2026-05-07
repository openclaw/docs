---
read_when:
    - การตอบคำถามสนับสนุนทั่วไปเกี่ยวกับการตั้งค่า การติดตั้ง การเริ่มต้นใช้งาน หรือรันไทม์
    - การคัดแยกปัญหาที่ผู้ใช้รายงานก่อนการดีบักเชิงลึก
summary: คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า การกำหนดค่า และการใช้งาน OpenClaw
title: คำถามที่พบบ่อย
x-i18n:
    generated_at: "2026-05-07T13:20:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: b208e28def6b9a1165130bc02f9e2646c3b16d203dfc8c0d59dc664f388c2ef8
    source_path: help/faq.md
    workflow: 16
---

คำตอบแบบเร็วพร้อมการแก้ปัญหาเชิงลึกสำหรับการตั้งค่าในโลกจริง (การพัฒนาในเครื่อง, VPS, หลายเอเจนต์, OAuth/API keys, การสลับโมเดลเมื่อขัดข้อง) สำหรับการวินิจฉัยรันไทม์ โปรดดู [การแก้ปัญหา](/th/gateway/troubleshooting) สำหรับเอกสารอ้างอิงการตั้งค่าทั้งหมด โปรดดู [การกำหนดค่า](/th/gateway/configuration)

## 60 วินาทีแรกเมื่อมีบางอย่างเสีย

1. **สถานะด่วน (ตรวจสอบก่อน)**

   ```bash
   openclaw status
   ```

   สรุปในเครื่องอย่างรวดเร็ว: OS + การอัปเดต, การเข้าถึง gateway/service, agents/sessions, การตั้งค่า provider + ปัญหารันไทม์ (เมื่อเข้าถึง Gateway ได้)

2. **รายงานที่วางได้ (แชร์ได้อย่างปลอดภัย)**

   ```bash
   openclaw status --all
   ```

   การวินิจฉัยแบบอ่านอย่างเดียวพร้อมท้าย log (ปิดบัง tokens แล้ว)

3. **สถานะ Daemon + port**

   ```bash
   openclaw gateway status
   ```

   แสดง supervisor runtime เทียบกับการเข้าถึง RPC, URL เป้าหมายของ probe และ config ที่ service น่าจะใช้

4. **Deep probes**

   ```bash
   openclaw status --deep
   ```

   รัน live gateway health probe รวมถึง channel probes เมื่อรองรับ
   (ต้องมี Gateway ที่เข้าถึงได้) ดู [Health](/th/gateway/health)

5. **ดูท้าย log ล่าสุด**

   ```bash
   openclaw logs --follow
   ```

   หาก RPC ล่ม ให้ fallback ไปที่:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   File logs แยกจาก service logs โปรดดู [Logging](/th/logging) และ [การแก้ปัญหา](/th/gateway/troubleshooting)

6. **รัน doctor (ซ่อมแซม)**

   ```bash
   openclaw doctor
   ```

   ซ่อมแซม/ย้าย config/state + รัน health checks ดู [Doctor](/th/gateway/doctor)

7. **Snapshot ของ Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   ขอ snapshot แบบเต็มจาก Gateway ที่กำลังรันอยู่ (เฉพาะ WS) ดู [Health](/th/gateway/health)

## การเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก

คำถามและคำตอบสำหรับการรันครั้งแรก — การติดตั้ง, onboard, auth routes, subscriptions, ความล้มเหลวเริ่มต้น —
อยู่ที่ [FAQ สำหรับการรันครั้งแรก](/th/help/faq-first-run)

## OpenClaw คืออะไร?

<AccordionGroup>
  <Accordion title="OpenClaw คืออะไรในหนึ่งย่อหน้า?">
    OpenClaw คือผู้ช่วย AI ส่วนตัวที่คุณรันบนอุปกรณ์ของคุณเอง โดยตอบกลับบนช่องทางส่งข้อความที่คุณใช้อยู่แล้ว (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat และ Plugin ช่องทางที่มาพร้อมกัน เช่น QQ Bot) และยังทำเสียง + Canvas สดบนแพลตฟอร์มที่รองรับได้ด้วย **Gateway** คือ control plane ที่เปิดตลอดเวลา ส่วนผู้ช่วยคือผลิตภัณฑ์
  </Accordion>

  <Accordion title="คุณค่าที่เสนอ">
    OpenClaw ไม่ใช่ "แค่ Claude wrapper" แต่เป็น **local-first control plane** ที่ให้คุณรัน
    ผู้ช่วยที่มีความสามารถบน **ฮาร์ดแวร์ของคุณเอง** เข้าถึงได้จากแอปแชตที่คุณใช้อยู่แล้ว พร้อม
    sessions แบบมีสถานะ, memory และเครื่องมือ - โดยไม่ต้องยกการควบคุม workflows ของคุณให้ SaaS
    ที่โฮสต์ไว้

    จุดเด่น:

    - **อุปกรณ์ของคุณ ข้อมูลของคุณ:** รัน Gateway ที่ไหนก็ได้ตามต้องการ (Mac, Linux, VPS) และเก็บ
      workspace + ประวัติ session ไว้ในเครื่อง
    - **ช่องทางจริง ไม่ใช่เว็บ sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      รวมถึงเสียงบนมือถือและ Canvas บนแพลตฟอร์มที่รองรับ
    - **ไม่ผูกกับโมเดลใดโมเดลหนึ่ง:** ใช้ Anthropic, OpenAI, MiniMax, OpenRouter, ฯลฯ พร้อม routing
      และ failover ราย agent
    - **ตัวเลือกเฉพาะในเครื่อง:** รันโมเดลในเครื่องเพื่อให้ **ข้อมูลทั้งหมดอยู่บนอุปกรณ์ของคุณได้** หากต้องการ
    - **การ routing หลายเอเจนต์:** แยก agents ตามช่องทาง, บัญชี หรือ task โดยแต่ละตัวมี
      workspace และค่าเริ่มต้นของตัวเอง
    - **โอเพนซอร์สและปรับแต่งได้:** ตรวจสอบ ขยาย และ self-host ได้โดยไม่ติด vendor lock-in

    เอกสาร: [Gateway](/th/gateway), [Channels](/th/channels), [Multi-agent](/th/concepts/multi-agent),
    [Memory](/th/concepts/memory).

  </Accordion>

  <Accordion title="ฉันเพิ่งตั้งค่าเสร็จ - ควรทำอะไรก่อน?">
    โปรเจกต์แรกที่เหมาะ:

    - สร้างเว็บไซต์ (WordPress, Shopify หรือเว็บไซต์ static แบบง่าย)
    - ทำ prototype แอปมือถือ (outline, screens, API plan)
    - จัดระเบียบไฟล์และโฟลเดอร์ (cleanup, naming, tagging)
    - เชื่อมต่อ Gmail และทำ summaries หรือ follow ups อัตโนมัติ

    มันรับมือกับงานใหญ่ได้ แต่จะทำงานได้ดีที่สุดเมื่อคุณแบ่งงานเป็นเฟสและ
    ใช้เอเจนต์ย่อยสำหรับงานแบบขนาน

  </Accordion>

  <Accordion title="กรณีใช้งานประจำวันห้าอันดับแรกของ OpenClaw คืออะไร?">
    ประโยชน์ในชีวิตประจำวันมักเป็นแบบนี้:

    - **สรุปข้อมูลส่วนตัว:** สรุป inbox, calendar และข่าวที่คุณสนใจ
    - **ค้นคว้าและร่างงาน:** ค้นคว้าอย่างรวดเร็ว สรุป และร่างฉบับแรกสำหรับ emails หรือ docs
    - **เตือนความจำและ follow ups:** การเตือนและ checklists ที่ขับเคลื่อนด้วย Cron หรือ Heartbeat
    - **Browser automation:** กรอก forms, รวบรวมข้อมูล และทำ web tasks ซ้ำ
    - **การประสานงานข้ามอุปกรณ์:** ส่ง task จากโทรศัพท์ ให้ Gateway รันบนเซิร์ฟเวอร์ แล้วรับผลลัพธ์กลับในแชต

  </Accordion>

  <Accordion title="OpenClaw ช่วยเรื่อง lead gen, outreach, ads และ blogs สำหรับ SaaS ได้ไหม?">
    ได้สำหรับ **การค้นคว้า การคัดกรองคุณสมบัติ และการร่าง** มันสามารถสแกน sites, สร้าง shortlists,
    สรุป prospects และเขียน drafts สำหรับ outreach หรือ ad copy ได้

    สำหรับ **การทำ outreach หรือ ad runs** ให้มีมนุษย์อยู่ใน loop หลีกเลี่ยง spam ปฏิบัติตามกฎหมายท้องถิ่นและ
    นโยบายของแพลตฟอร์ม และตรวจทานทุกอย่างก่อนส่ง รูปแบบที่ปลอดภัยที่สุดคือให้
    OpenClaw ร่าง แล้วคุณอนุมัติ

    เอกสาร: [Security](/th/gateway/security).

  </Accordion>

  <Accordion title="ข้อได้เปรียบเมื่อเทียบกับ Claude Code สำหรับการพัฒนาเว็บคืออะไร?">
    OpenClaw คือ **ผู้ช่วยส่วนตัว** และเลเยอร์ประสานงาน ไม่ใช่เครื่องมือแทน IDE ใช้
    Claude Code หรือ Codex สำหรับ loop เขียนโค้ดโดยตรงที่เร็วที่สุดใน repo ใช้ OpenClaw เมื่อคุณ
    ต้องการ memory ที่คงอยู่, การเข้าถึงข้ามอุปกรณ์ และการประสานเครื่องมือ

    ข้อได้เปรียบ:

    - **Memory + workspace ที่คงอยู่** ข้าม sessions
    - **การเข้าถึงหลายแพลตฟอร์ม** (WhatsApp, Telegram, TUI, WebChat)
    - **การประสานเครื่องมือ** (browser, files, scheduling, hooks)
    - **Gateway ที่เปิดตลอดเวลา** (รันบน VPS, โต้ตอบจากที่ไหนก็ได้)
    - **Nodes** สำหรับ local browser/screen/camera/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills และ automation

<AccordionGroup>
  <Accordion title="ฉันจะปรับแต่ง Skills โดยไม่ทำให้ repo สกปรกได้อย่างไร?">
    ใช้ managed overrides แทนการแก้สำเนาใน repo ใส่การเปลี่ยนแปลงของคุณใน `~/.openclaw/skills/<name>/SKILL.md` (หรือเพิ่มโฟลเดอร์ผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json`) ลำดับความสำคัญคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` ดังนั้น managed overrides ยังชนะ skills ที่มาพร้อมกันโดยไม่แตะ git หากคุณต้องติดตั้ง skill แบบ global แต่ให้เห็นเฉพาะบาง agents ให้เก็บสำเนาที่แชร์ไว้ใน `~/.openclaw/skills` และควบคุมการมองเห็นด้วย `agents.defaults.skills` และ `agents.list[].skills` เฉพาะการแก้ไขที่ควร upstream เท่านั้นที่ควรอยู่ใน repo และส่งออกเป็น PRs
  </Accordion>

  <Accordion title="ฉันโหลด Skills จากโฟลเดอร์กำหนดเองได้ไหม?">
    ได้ เพิ่ม directories เพิ่มเติมผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json` (ลำดับความสำคัญต่ำสุด) ลำดับความสำคัญเริ่มต้นคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` `clawhub` ติดตั้งลงใน `./skills` โดยค่าเริ่มต้น ซึ่ง OpenClaw มองเป็น `<workspace>/skills` ใน session ถัดไป หาก skill ควรมองเห็นได้เฉพาะบาง agents ให้ใช้คู่กับ `agents.defaults.skills` หรือ `agents.list[].skills`
  </Accordion>

  <Accordion title="ฉันจะใช้โมเดลต่างกันสำหรับงานต่างกันได้อย่างไร?">
    ปัจจุบันรูปแบบที่รองรับคือ:

    - **Cron jobs**: งานที่แยก isolated สามารถตั้งค่า override `model` ราย job ได้
    - **เอเจนต์ย่อย**: route tasks ไปยัง agents แยกต่างหากที่มีโมเดลเริ่มต้นต่างกัน
    - **การสลับตามต้องการ**: ใช้ `/model` เพื่อสลับโมเดลของ session ปัจจุบันได้ทุกเมื่อ

    ดู [Cron jobs](/th/automation/cron-jobs), [Multi-Agent Routing](/th/concepts/multi-agent) และ [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="บอทค้างระหว่างทำงานหนัก ฉันจะ offload งานนั้นได้อย่างไร?">
    ใช้ **เอเจนต์ย่อย** สำหรับงานยาวหรืองานขนาน เอเจนต์ย่อยรันใน session ของตัวเอง
    ส่งสรุปกลับมา และทำให้แชตหลักของคุณยังตอบสนองได้

    ขอให้บอทของคุณ "spawn a sub-agent for this task" หรือใช้ `/subagents`
    ใช้ `/status` ในแชตเพื่อดูว่า Gateway กำลังทำอะไรอยู่ตอนนี้ (และยุ่งอยู่หรือไม่)

    เคล็ดลับเรื่อง tokens: งานยาวและเอเจนต์ย่อยต่างใช้ tokens หากกังวลเรื่องค่าใช้จ่าย ให้ตั้งค่า
    โมเดลที่ถูกกว่าสำหรับเอเจนต์ย่อยผ่าน `agents.defaults.subagents.model`

    เอกสาร: [Sub-agents](/th/tools/subagents), [Background Tasks](/th/automation/tasks).

  </Accordion>

  <Accordion title="Sessions ของ subagent ที่ผูกกับ thread ทำงานอย่างไรบน Discord?">
    ใช้ thread bindings คุณสามารถ bind thread ของ Discord กับ subagent หรือเป้าหมาย session เพื่อให้ข้อความ follow-up ใน thread นั้นยังอยู่ใน bound session นั้น

    ขั้นตอนพื้นฐาน:

    - Spawn ด้วย `sessions_spawn` โดยใช้ `thread: true` (และเลือกใช้ `mode: "session"` สำหรับ follow-up แบบคงอยู่)
    - หรือ bind ด้วยตนเองด้วย `/focus <target>`
    - ใช้ `/agents` เพื่อตรวจสอบสถานะ binding
    - ใช้ `/session idle <duration|off>` และ `/session max-age <duration|off>` เพื่อควบคุม auto-unfocus
    - ใช้ `/unfocus` เพื่อ detach thread

    Config ที่ต้องใช้:

    - ค่าเริ่มต้น global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
    - Overrides ของ Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`
    - Auto-bind เมื่อ spawn: `channels.discord.threadBindings.spawnSessions` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เพื่อปิด session spawns ที่ผูกกับ thread

    เอกสาร: [Sub-agents](/th/tools/subagents), [Discord](/th/channels/discord), [Configuration Reference](/th/gateway/configuration-reference), [Slash commands](/th/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent เสร็จแล้ว แต่ completion update ไปผิดที่หรือไม่เคยโพสต์ ฉันควรตรวจสอบอะไร?">
    ตรวจสอบ requester route ที่ resolve แล้วก่อน:

    - การส่ง subagent แบบ completion-mode จะเลือก bound thread หรือ conversation route ก่อน เมื่อมีอยู่
    - หาก origin ของ completion มีเพียง channel OpenClaw จะ fallback ไปยัง route ที่เก็บไว้ของ requester session (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้การส่งโดยตรงยังสำเร็จได้
    - หากไม่มีทั้ง bound route และ stored route ที่ใช้ได้ การส่งโดยตรงอาจล้มเหลว และผลลัพธ์จะ fallback ไปยัง queued session delivery แทนการโพสต์ไปยังแชตทันที
    - เป้าหมายที่ไม่ถูกต้องหรือเก่าอาจยังบังคับให้ queue fallback หรือทำให้ final delivery ล้มเหลวได้
    - หากคำตอบ assistant ที่มองเห็นล่าสุดของ child เป็น silent token ตรงตัว `NO_REPLY` / `no_reply` หรือเป็น `ANNOUNCE_SKIP` ตรงตัว OpenClaw จะจงใจระงับ announce แทนการโพสต์ progress ก่อนหน้าที่เก่าแล้ว
    - หาก child หมดเวลาหลังจากมีเพียง tool calls announce อาจยุบสิ่งนั้นเป็นสรุป partial-progress สั้น ๆ แทนการ replay raw tool output

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [Sub-agents](/th/tools/subagents), [Background Tasks](/th/automation/tasks), [Session Tools](/th/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron หรือ reminders ไม่ทำงาน ฉันควรตรวจสอบอะไร?">
    Cron รันอยู่ภายใน process ของ Gateway หาก Gateway ไม่ได้รันอย่างต่อเนื่อง
    scheduled jobs จะไม่รัน

    Checklist:

    - ยืนยันว่าเปิดใช้ cron แล้ว (`cron.enabled`) และไม่ได้ตั้งค่า `OPENCLAW_SKIP_CRON`
    - ตรวจสอบว่า Gateway รันตลอด 24/7 (ไม่มี sleep/restarts)
    - ตรวจสอบการตั้งค่า timezone สำหรับ job (`--tz` เทียบกับ timezone ของ host)

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    เอกสาร: [Cron jobs](/th/automation/cron-jobs), [Automation & Tasks](/th/automation).

  </Accordion>

  <Accordion title="Cron ทำงานแล้ว แต่ไม่มีอะไรถูกส่งไปยังช่องทาง เพราะอะไร?">
    ตรวจสอบโหมดการส่งก่อน:

    - `--no-deliver` / `delivery.mode: "none"` หมายความว่าไม่คาดว่าจะมีการส่งสำรองจากตัวรันเนอร์
    - เป้าหมายประกาศหายไปหรือไม่ถูกต้อง (`channel` / `to`) หมายความว่าตัวรันเนอร์ข้ามการส่งออกภายนอก
    - ความล้มเหลวของการยืนยันตัวตนช่องทาง (`unauthorized`, `Forbidden`) หมายความว่าตัวรันเนอร์พยายามส่งแล้ว แต่ข้อมูลรับรองบล็อกไว้
    - ผลลัพธ์แบบแยกที่เงียบ (`NO_REPLY` / `no_reply` เท่านั้น) จะถือว่าตั้งใจให้ไม่สามารถส่งได้ ดังนั้นตัวรันเนอร์จะระงับการส่งสำรองที่เข้าคิวไว้ด้วย

    สำหรับงาน cron แบบแยก เอเจนต์ยังสามารถส่งโดยตรงด้วยเครื่องมือ `message`
    ได้เมื่อมีเส้นทางแชทพร้อมใช้งาน `--announce` ควบคุมเฉพาะเส้นทางสำรองของตัวรันเนอร์
    สำหรับข้อความสุดท้ายที่เอเจนต์ยังไม่ได้ส่งไปแล้ว

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [งานเบื้องหลัง](/th/automation/tasks).

  </Accordion>

  <Accordion title="ทำไมการรัน cron แบบแยกจึงสลับโมเดลหรือลองใหม่หนึ่งครั้ง?">
    โดยปกติแล้วนั่นคือเส้นทางสลับโมเดลแบบสด ไม่ใช่การจัดกำหนดการซ้ำ

    cron แบบแยกสามารถคงการส่งต่อโมเดลรันไทม์และลองใหม่ได้เมื่อการรันที่ใช้งานอยู่
    โยน `LiveSessionModelSwitchError` การลองใหม่จะเก็บผู้ให้บริการ/โมเดลที่สลับไว้
    และหากการสลับมีการแทนที่โปรไฟล์การยืนยันตัวตนใหม่มาด้วย cron
    จะคงค่านั้นไว้ก่อนลองใหม่เช่นกัน

    กฎการเลือกที่เกี่ยวข้อง:

    - การแทนที่โมเดลของ Gmail hook จะชนะก่อนเมื่อใช้ได้
    - จากนั้นเป็น `model` ต่อหนึ่งงาน
    - จากนั้นเป็นการแทนที่โมเดล cron-session ที่จัดเก็บไว้
    - จากนั้นเป็นการเลือกโมเดลเอเจนต์/ค่าเริ่มต้นตามปกติ

    ลูปการลองใหม่มีขอบเขต หลังจากความพยายามครั้งแรกบวกกับการลองใหม่จากการสลับ 2 ครั้ง
    cron จะยกเลิกแทนที่จะวนซ้ำตลอดไป

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [cron CLI](/th/cli/cron).

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง Skills บน Linux ได้อย่างไร?">
    ใช้คำสั่ง `openclaw skills` แบบเนทีฟ หรือวาง Skills ลงในเวิร์กสเปซของคุณ UI ของ Skills บน macOS ไม่มีให้ใช้บน Linux
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
    ซิงค์ Skills ของคุณเอง สำหรับการติดตั้งที่ใช้ร่วมกันระหว่างเอเจนต์ ให้วาง Skill ไว้ใต้
    `~/.openclaw/skills` และใช้ `agents.defaults.skills` หรือ
    `agents.list[].skills` หากคุณต้องการจำกัดว่าเอเจนต์ใดบ้างที่มองเห็นได้

  </Accordion>

  <Accordion title="OpenClaw สามารถรันงานตามกำหนดเวลาหรือรันต่อเนื่องในเบื้องหลังได้หรือไม่?">
    ได้ ใช้ตัวจัดกำหนดการของ Gateway:

    - **งาน Cron** สำหรับงานที่จัดกำหนดการไว้หรือเกิดซ้ำ (ยังคงอยู่หลังรีสตาร์ท)
    - **Heartbeat** สำหรับการตรวจสอบเป็นระยะของ "เซสชันหลัก"
    - **งานแบบแยก** สำหรับเอเจนต์อัตโนมัติที่โพสต์สรุปหรือส่งไปยังแชท

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [ระบบอัตโนมัติและงาน](/th/automation),
    [Heartbeat](/th/gateway/heartbeat).

  </Accordion>

  <Accordion title="ฉันสามารถรัน Skills ที่ใช้ได้เฉพาะ Apple macOS จาก Linux ได้หรือไม่?">
    ไม่ได้โดยตรง Skills ของ macOS ถูกจำกัดด้วย `metadata.openclaw.os` พร้อมไบนารีที่จำเป็น และ Skills จะปรากฏในพรอมป์ระบบเฉพาะเมื่อเข้าเกณฑ์บน **โฮสต์ Gateway** เท่านั้น บน Linux Skills ที่ใช้ได้เฉพาะ `darwin` (เช่น `apple-notes`, `apple-reminders`, `things-mac`) จะไม่โหลด เว้นแต่คุณจะแทนที่การจำกัดนั้น

    คุณมีรูปแบบที่รองรับสามแบบ:

    **ตัวเลือก A - รัน Gateway บน Mac (ง่ายที่สุด)**
    รัน Gateway ในที่ที่มีไบนารีของ macOS อยู่ จากนั้นเชื่อมต่อจาก Linux ใน[โหมดรีโมต](#gateway-ports-already-running-and-remote-mode) หรือผ่าน Tailscale Skills จะโหลดตามปกติเพราะโฮสต์ Gateway คือ macOS

    **ตัวเลือก B - ใช้โหนด macOS (ไม่มี SSH)**
    รัน Gateway บน Linux จับคู่โหนด macOS (แอป menubar) และตั้งค่า **คำสั่งรันของโหนด** เป็น "ถามเสมอ" หรือ "อนุญาตเสมอ" บน Mac OpenClaw สามารถถือว่า Skills ที่ใช้ได้เฉพาะ macOS เข้าเกณฑ์เมื่อมีไบนารีที่จำเป็นอยู่บนโหนด เอเจนต์รัน Skills เหล่านั้นผ่านเครื่องมือ `nodes` หากคุณเลือก "ถามเสมอ" การอนุมัติ "อนุญาตเสมอ" ในพรอมป์จะเพิ่มคำสั่งนั้นลงในรายการอนุญาต

    **ตัวเลือก C - พร็อกซีไบนารี macOS ผ่าน SSH (ขั้นสูง)**
    เก็บ Gateway ไว้บน Linux แต่ทำให้ไบนารี CLI ที่จำเป็น resolve ไปยัง wrapper SSH ที่รันบน Mac จากนั้นแทนที่ Skill เพื่ออนุญาต Linux เพื่อให้ยังเข้าเกณฑ์

    1. สร้าง wrapper SSH สำหรับไบนารี (ตัวอย่าง: `memo` สำหรับ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. วาง wrapper บน `PATH` บนโฮสต์ Linux (เช่น `~/bin/memo`)
    3. แทนที่เมตาดาตาของ Skill (เวิร์กสเปซหรือ `~/.openclaw/skills`) เพื่ออนุญาต Linux:

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

    - **Skill / Plugin แบบกำหนดเอง:** เหมาะที่สุดสำหรับการเข้าถึง API ที่เชื่อถือได้ (Notion/HeyGen ทั้งคู่มี API)
    - **ระบบอัตโนมัติผ่านเบราว์เซอร์:** ใช้งานได้โดยไม่ต้องเขียนโค้ด แต่ช้ากว่าและเปราะบางกว่า

    หากคุณต้องการเก็บบริบทต่อหนึ่งลูกค้า (เวิร์กโฟลว์เอเจนซี) รูปแบบง่าย ๆ คือ:

    - หนึ่งหน้า Notion ต่อหนึ่งลูกค้า (บริบท + ค่ากำหนด + งานที่กำลังทำ)
    - ขอให้เอเจนต์ดึงหน้านั้นเมื่อเริ่มเซสชัน

    หากคุณต้องการการผสานรวมแบบเนทีฟ ให้เปิดคำขอฟีเจอร์หรือสร้าง Skill
    ที่มุ่งเป้าไปยัง API เหล่านั้น

    ติดตั้ง Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    การติดตั้งแบบเนทีฟจะลงในไดเรกทอรี `skills/` ของเวิร์กสเปซที่ใช้งานอยู่ สำหรับ Skills ที่ใช้ร่วมกันระหว่างเอเจนต์ ให้วางไว้ใน `~/.openclaw/skills/<name>/SKILL.md` หากควรมีเพียงบางเอเจนต์ที่เห็นการติดตั้งร่วม ให้กำหนดค่า `agents.defaults.skills` หรือ `agents.list[].skills` Skills บางรายการคาดหวังไบนารีที่ติดตั้งผ่าน Homebrew; บน Linux นั่นหมายถึง Linuxbrew (ดูรายการ FAQ ของ Homebrew Linux ด้านบน) ดู [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config), และ [ClawHub](/th/tools/clawhub).

  </Accordion>

  <Accordion title="ฉันจะใช้ Chrome ที่ลงชื่อเข้าใช้อยู่แล้วกับ OpenClaw ได้อย่างไร?">
    ใช้โปรไฟล์เบราว์เซอร์ `user` ในตัว ซึ่งเชื่อมต่อผ่าน Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    หากคุณต้องการชื่อที่กำหนดเอง ให้สร้างโปรไฟล์ MCP อย่างชัดเจน:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    เส้นทางนี้สามารถใช้เบราว์เซอร์โฮสต์ local หรือโหนดเบราว์เซอร์ที่เชื่อมต่ออยู่ หาก Gateway รันอยู่ที่อื่น ให้รันโฮสต์โหนดบนเครื่องเบราว์เซอร์หรือใช้ CDP ระยะไกลแทน

    ข้อจำกัดปัจจุบันของ `existing-session` / `user`:

    - การกระทำอ้างอิงด้วย ref ไม่ใช่ด้วย CSS-selector
    - การอัปโหลดต้องใช้ `ref` / `inputRef` และตอนนี้รองรับครั้งละหนึ่งไฟล์
    - `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการกระทำแบบแบตช์ยังต้องใช้เบราว์เซอร์ที่จัดการแล้วหรือโปรไฟล์ CDP ดิบ

  </Accordion>
</AccordionGroup>

## การทำแซนด์บ็อกซ์และหน่วยความจำ

<AccordionGroup>
  <Accordion title="มีเอกสารแซนด์บ็อกซ์โดยเฉพาะหรือไม่?">
    มี ดู [Sandboxing](/th/gateway/sandboxing) สำหรับการตั้งค่าเฉพาะ Docker (Gateway เต็มรูปแบบใน Docker หรืออิมเมจแซนด์บ็อกซ์) ดู [Docker](/th/install/docker).
  </Accordion>

  <Accordion title="Docker ดูจำกัด - ฉันจะเปิดใช้ฟีเจอร์เต็มรูปแบบได้อย่างไร?">
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยก่อนและรันเป็นผู้ใช้ `node` ดังนั้นจึงไม่มี
    แพ็กเกจระบบ, Homebrew หรือเบราว์เซอร์ที่รวมมาให้ สำหรับการตั้งค่าที่ครบถ้วนกว่า:

    - คง `/home/node` ไว้ด้วย `OPENCLAW_HOME_VOLUME` เพื่อให้แคชยังคงอยู่
    - อบ deps ของระบบเข้าไปในอิมเมจด้วย `OPENCLAW_DOCKER_APT_PACKAGES`
    - ติดตั้งเบราว์เซอร์ Playwright ผ่าน CLI ที่รวมมา:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` และตรวจสอบให้แน่ใจว่า path ถูกคงไว้

    เอกสาร: [Docker](/th/install/docker), [เบราว์เซอร์](/th/tools/browser).

  </Accordion>

  <Accordion title="ฉันสามารถเก็บ DM ให้เป็นส่วนตัว แต่ทำให้กลุ่มเป็นสาธารณะ/อยู่ในแซนด์บ็อกซ์ด้วยเอเจนต์เดียวได้หรือไม่?">
    ได้ - หากทราฟฟิกส่วนตัวของคุณคือ **DMs** และทราฟฟิกสาธารณะของคุณคือ **กลุ่ม**

    ใช้ `agents.defaults.sandbox.mode: "non-main"` เพื่อให้เซสชันกลุ่ม/ช่องทาง (คีย์ที่ไม่ใช่ main) รันในแบ็กเอนด์แซนด์บ็อกซ์ที่กำหนดค่าไว้ ขณะที่เซสชัน DM หลักยังอยู่บนโฮสต์ Docker คือแบ็กเอนด์เริ่มต้นหากคุณไม่เลือกอย่างอื่น จากนั้นจำกัดว่าเครื่องมือใดบ้างที่พร้อมใช้งานในเซสชันแซนด์บ็อกซ์ผ่าน `tools.sandbox.tools`

    คำแนะนำการตั้งค่า + ตัวอย่างการกำหนดค่า: [กลุ่ม: DM ส่วนตัว + กลุ่มสาธารณะ](/th/channels/groups#pattern-personal-dms-public-groups-single-agent)

    ข้อมูลอ้างอิงการกำหนดค่าหลัก: [การกำหนดค่า Gateway](/th/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ฉันจะผูกโฟลเดอร์ของโฮสต์เข้าไปในแซนด์บ็อกซ์ได้อย่างไร?">
    ตั้งค่า `agents.defaults.sandbox.docker.binds` เป็น `["host:path:mode"]` (เช่น `"/home/user/src:/src:ro"`) bind ส่วนกลาง + ต่อเอเจนต์จะถูกรวมกัน; bind ต่อเอเจนต์จะถูกละเว้นเมื่อ `scope: "shared"` ใช้ `:ro` สำหรับสิ่งที่อ่อนไหว และจำไว้ว่า bind จะข้ามกำแพงระบบไฟล์ของแซนด์บ็อกซ์

    OpenClaw ตรวจสอบความถูกต้องของแหล่ง bind เทียบกับทั้ง path ที่ normalize แล้วและ path แบบ canonical ที่ resolve ผ่าน ancestor ที่มีอยู่ลึกที่สุด นั่นหมายความว่าการ escape ผ่าน symlink-parent ยังล้มเหลวแบบปิด แม้เมื่อ path segment สุดท้ายยังไม่มีอยู่ และการตรวจ allowed-root ยังคงใช้หลังการ resolve symlink

    ดู [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts) และ [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) สำหรับตัวอย่างและหมายเหตุด้านความปลอดภัย

  </Accordion>

  <Accordion title="หน่วยความจำทำงานอย่างไร?">
    หน่วยความจำของ OpenClaw เป็นเพียงไฟล์ Markdown ในเวิร์กสเปซของเอเจนต์:

    - บันทึกรายวันใน `memory/YYYY-MM-DD.md`
    - บันทึกระยะยาวที่คัดสรรแล้วใน `MEMORY.md` (เฉพาะเซสชันหลัก/ส่วนตัว)

    OpenClaw ยังรัน **การ flush หน่วยความจำก่อน Compaction แบบเงียบ** เพื่อเตือนโมเดล
    ให้เขียนบันทึกที่คงทนก่อนการ auto-compaction สิ่งนี้จะรันเฉพาะเมื่อเวิร์กสเปซ
    เขียนได้ (แซนด์บ็อกซ์แบบอ่านอย่างเดียวจะข้ามไป) ดู [หน่วยความจำ](/th/concepts/memory).

  </Accordion>

  <Accordion title="หน่วยความจำลืมสิ่งต่าง ๆ อยู่เรื่อย ๆ ฉันจะทำให้มันจำได้อย่างไร?">
    ขอให้บอต **เขียนข้อเท็จจริงลงในหน่วยความจำ** บันทึกระยะยาวควรอยู่ใน `MEMORY.md`,
    บริบทระยะสั้นไปอยู่ใน `memory/YYYY-MM-DD.md`

    นี่ยังคงเป็นส่วนที่เรากำลังปรับปรุง การเตือนโมเดลให้จัดเก็บความทรงจำช่วยได้;
    โมเดลจะรู้ว่าต้องทำอะไร หากยังลืมอยู่ ให้ตรวจสอบว่า Gateway ใช้เวิร์กสเปซเดียวกัน
    ในทุกการรัน

    เอกสาร: [หน่วยความจำ](/th/concepts/memory), [เวิร์กสเปซเอเจนต์](/th/concepts/agent-workspace).

  </Accordion>

  <Accordion title="หน่วยความจำคงอยู่ตลอดไปหรือไม่? มีข้อจำกัดอะไรบ้าง?">
    ไฟล์หน่วยความจำอยู่บนดิสก์และคงอยู่จนกว่าคุณจะลบ ข้อจำกัดคือพื้นที่จัดเก็บของคุณ
    ไม่ใช่โมเดล **บริบทเซสชัน** ยังคงถูกจำกัดด้วย context window ของโมเดล
    ดังนั้นบทสนทนาที่ยาวอาจถูก compact หรือตัดทอน นั่นคือเหตุผลที่มี
    การค้นหาหน่วยความจำ - มันดึงเฉพาะส่วนที่เกี่ยวข้องกลับเข้ามาในบริบท

    เอกสาร: [หน่วยความจำ](/th/concepts/memory), [บริบท](/th/concepts/context).

  </Accordion>

  <Accordion title="การค้นหา semantic memory ต้องใช้คีย์ OpenAI API หรือไม่?">
    ต้องใช้เฉพาะเมื่อคุณใช้ **OpenAI embeddings** เท่านั้น Codex OAuth ครอบคลุมแชต/คอมพลีชัน และ
    **ไม่** ให้สิทธิ์เข้าถึง embeddings ดังนั้น **การลงชื่อเข้าใช้ด้วย Codex (OAuth หรือการเข้าสู่ระบบ
    Codex CLI)** จึงไม่ช่วยสำหรับการค้นหา semantic memory OpenAI embeddings
    ยังต้องใช้คีย์ API จริง (`OPENAI_API_KEY` หรือ `models.providers.openai.apiKey`)

    หากคุณไม่ได้ตั้งค่าผู้ให้บริการไว้อย่างชัดเจน OpenClaw จะเลือกผู้ให้บริการโดยอัตโนมัติเมื่อ
    สามารถ resolve คีย์ API ได้ (โปรไฟล์ auth, `models.providers.*.apiKey` หรือ env vars)
    ระบบจะเลือก OpenAI ก่อนหาก resolve คีย์ OpenAI ได้ มิฉะนั้นจะเลือก Gemini หาก
    resolve คีย์ Gemini ได้ จากนั้น Voyage แล้วจึง Mistral หากไม่มีคีย์ระยะไกลที่ใช้ได้ การค้นหา
    memory จะยังปิดอยู่จนกว่าคุณจะกำหนดค่า หากคุณมีเส้นทางโมเดล local
    ที่กำหนดค่าไว้และมีอยู่จริง OpenClaw
    จะเลือก `local` ก่อน รองรับ Ollama เมื่อคุณตั้งค่าอย่างชัดเจนเป็น
    `memorySearch.provider = "ollama"`

    หากคุณต้องการใช้แบบ local ให้ตั้งค่า `memorySearch.provider = "local"` (และตั้งค่า
    `memorySearch.fallback = "none"` เพิ่มเติมได้) หากคุณต้องการ Gemini embeddings ให้ตั้งค่า
    `memorySearch.provider = "gemini"` และระบุ `GEMINI_API_KEY` (หรือ
    `memorySearch.remote.apiKey`) เรารองรับโมเดล embedding แบบ **OpenAI, Gemini, Voyage, Mistral, Ollama หรือ local**
    - ดูรายละเอียดการตั้งค่าได้ที่ [Memory](/th/concepts/memory)

  </Accordion>
</AccordionGroup>

## ตำแหน่งที่สิ่งต่าง ๆ อยู่บนดิสก์

<AccordionGroup>
  <Accordion title="ข้อมูลทั้งหมดที่ใช้กับ OpenClaw ถูกบันทึกไว้ในเครื่องหรือไม่?">
    ไม่ใช่ - **สถานะของ OpenClaw เป็น local** แต่ **บริการภายนอกยังคงเห็นสิ่งที่คุณส่งไปให้**

    - **เป็น local โดยค่าเริ่มต้น:** เซสชัน ไฟล์ memory คอนฟิก และ workspace อยู่บนโฮสต์ Gateway
      (`~/.openclaw` + ไดเรกทอรี workspace ของคุณ)
    - **เป็นระยะไกลโดยความจำเป็น:** ข้อความที่คุณส่งไปยังผู้ให้บริการโมเดล (Anthropic/OpenAI/ฯลฯ) จะไปยัง
      API ของพวกเขา และแพลตฟอร์มแชต (WhatsApp/Telegram/Slack/ฯลฯ) จะเก็บข้อมูลข้อความไว้บน
      เซิร์ฟเวอร์ของพวกเขา
    - **คุณควบคุมขอบเขตข้อมูลได้:** การใช้โมเดล local จะเก็บพรอมป์ไว้บนเครื่องของคุณ แต่ทราฟฟิกของ channel
      ยังผ่านเซิร์ฟเวอร์ของ channel นั้นอยู่

    ที่เกี่ยวข้อง: [Agent workspace](/th/concepts/agent-workspace), [Memory](/th/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw เก็บข้อมูลไว้ที่ใด?">
    ทุกอย่างอยู่ภายใต้ `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`):

    | เส้นทาง                                                        | วัตถุประสงค์                                                       |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | คอนฟิกหลัก (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | การนำเข้า OAuth แบบ legacy (คัดลอกเข้าโปรไฟล์ auth เมื่อใช้ครั้งแรก) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | โปรไฟล์ auth (OAuth, คีย์ API และ `keyRef`/`tokenRef` ที่มีหรือไม่มีก็ได้) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | เพย์โหลด secret แบบไฟล์ที่มีหรือไม่มีก็ได้สำหรับผู้ให้บริการ SecretRef แบบ `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ไฟล์ความเข้ากันได้แบบ legacy (ล้างรายการ `api_key` แบบคงที่แล้ว) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | สถานะผู้ให้บริการ (เช่น `whatsapp/<accountId>/creds.json`)        |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | สถานะต่อ agent (agentDir + เซสชัน)                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | ประวัติการสนทนาและสถานะ (ต่อ agent)                                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | เมตาดาต้าเซสชัน (ต่อ agent)                                       |

    เส้นทาง agent เดี่ยวแบบ legacy: `~/.openclaw/agent/*` (ย้ายโดย `openclaw doctor`)

    **workspace** ของคุณ (AGENTS.md, ไฟล์ memory, Skills ฯลฯ) แยกต่างหากและกำหนดค่าผ่าน `agents.defaults.workspace` (ค่าเริ่มต้น: `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md ควรอยู่ที่ใด?">
    ไฟล์เหล่านี้อยู่ใน **agent workspace** ไม่ใช่ `~/.openclaw`

    - **Workspace (ต่อ agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` ที่มีหรือไม่มีก็ได้
      รากตัวพิมพ์เล็ก `memory.md` เป็นอินพุตซ่อมแซมแบบ legacy เท่านั้น; `openclaw doctor --fix`
      สามารถรวมเข้า `MEMORY.md` ได้เมื่อมีทั้งสองไฟล์
    - **State dir (`~/.openclaw`)**: คอนฟิก สถานะ channel/ผู้ให้บริการ โปรไฟล์ auth เซสชัน ล็อก
      และ Skills ที่ใช้ร่วมกัน (`~/.openclaw/skills`)

    workspace เริ่มต้นคือ `~/.openclaw/workspace` กำหนดค่าได้ผ่าน:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    หากบอต "ลืม" หลังรีสตาร์ต ให้ยืนยันว่า Gateway ใช้
    workspace เดียวกันทุกครั้งที่เปิดใช้งาน (และจำไว้ว่า: โหมดระยะไกลใช้ **workspace ของโฮสต์ gateway**
    ไม่ใช่แล็ปท็อป local ของคุณ)

    เคล็ดลับ: หากคุณต้องการพฤติกรรมหรือความต้องการที่คงทน ให้ขอให้บอต **เขียนลงใน
    AGENTS.md หรือ MEMORY.md** แทนการพึ่งพาประวัติแชต

    ดู [Agent workspace](/th/concepts/agent-workspace) และ [Memory](/th/concepts/memory)

  </Accordion>

  <Accordion title="กลยุทธ์สำรองข้อมูลที่แนะนำ">
    ใส่ **agent workspace** ของคุณไว้ใน repo git แบบ **ส่วนตัว** และสำรองข้อมูลไว้ในที่
    ส่วนตัว (เช่น GitHub private) วิธีนี้จะเก็บ memory + ไฟล์ AGENTS/SOUL/USER
    และให้คุณกู้คืน "จิตใจ" ของผู้ช่วยได้ในภายหลัง

    อย่า commit สิ่งใดภายใต้ `~/.openclaw` (credentials, เซสชัน, token หรือเพย์โหลด secrets ที่เข้ารหัส)
    หากคุณต้องกู้คืนแบบเต็ม ให้สำรองทั้ง workspace และไดเรกทอรีสถานะ
    แยกกัน (ดูคำถามเรื่องการย้ายข้อมูลด้านบน)

    เอกสาร: [Agent workspace](/th/concepts/agent-workspace).

  </Accordion>

  <Accordion title="ฉันจะถอนการติดตั้ง OpenClaw อย่างสมบูรณ์ได้อย่างไร?">
    ดูคู่มือเฉพาะ: [Uninstall](/th/install/uninstall).
  </Accordion>

  <Accordion title="agents ทำงานนอก workspace ได้หรือไม่?">
    ได้ workspace คือ **default cwd** และจุดยึด memory ไม่ใช่ sandbox แบบแข็ง
    เส้นทางแบบ relative จะ resolve ภายใน workspace แต่เส้นทางแบบ absolute สามารถเข้าถึงตำแหน่งอื่นบน
    โฮสต์ได้ เว้นแต่จะเปิดใช้ sandboxing หากคุณต้องการการแยกส่วน ให้ใช้
    [`agents.defaults.sandbox`](/th/gateway/sandboxing) หรือการตั้งค่า sandbox ต่อ agent หากคุณ
    ต้องการให้ repo เป็นไดเรกทอรีทำงานเริ่มต้น ให้ชี้ `workspace` ของ agent นั้น
    ไปยังราก repo repo ของ OpenClaw เป็นเพียงซอร์สโค้ด; แยก
    workspace ไว้ต่างหาก เว้นแต่คุณตั้งใจให้ agent ทำงานภายในนั้น

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
    สถานะเซสชันเป็นของ **โฮสต์ gateway** หากคุณอยู่ในโหมดระยะไกล session store ที่คุณสนใจอยู่บนเครื่องระยะไกล ไม่ใช่แล็ปท็อป local ของคุณ ดู [Session management](/th/concepts/session)
  </Accordion>
</AccordionGroup>

## พื้นฐานคอนฟิก

<AccordionGroup>
  <Accordion title="คอนฟิกเป็นรูปแบบใด? อยู่ที่ใด?">
    OpenClaw อ่านคอนฟิก **JSON5** ที่มีหรือไม่มีก็ได้จาก `$OPENCLAW_CONFIG_PATH` (ค่าเริ่มต้น: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    หากไม่มีไฟล์ ระบบจะใช้ค่าเริ่มต้นที่ค่อนข้างปลอดภัย (รวมถึง workspace เริ่มต้นที่ `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title='ฉันตั้งค่า gateway.bind: "lan" (หรือ "tailnet") แล้วตอนนี้ไม่มีอะไร listen / UI แจ้งว่า unauthorized'>
    การ bind แบบ non-loopback **ต้องมีเส้นทาง auth ของ gateway ที่ถูกต้อง** ในทางปฏิบัติหมายถึง:

    - auth แบบ shared-secret: token หรือ password
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

    - `gateway.remote.token` / `.password` **ไม่** เปิดใช้ auth ของ gateway local ด้วยตัวเอง
    - เส้นทางการเรียก local สามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
    - สำหรับ auth ด้วยรหัสผ่าน ให้ตั้งค่า `gateway.auth.mode: "password"` พร้อม `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`) แทน
    - หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าอย่างชัดเจนผ่าน SecretRef และ resolve ไม่ได้ การ resolve จะ fail closed (ไม่มี remote fallback มาบดบัง)
    - การตั้งค่า Control UI แบบ shared-secret ตรวจสอบสิทธิ์ผ่าน `connect.params.auth.token` หรือ `connect.params.auth.password` (เก็บใน app/UI settings) โหมดที่มีตัวตน เช่น Tailscale Serve หรือ `trusted-proxy` ใช้ request headers แทน หลีกเลี่ยงการใส่ shared secrets ใน URL
    - เมื่อใช้ `gateway.auth.mode: "trusted-proxy"` reverse proxies แบบ loopback โฮสต์เดียวกันต้องมี `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน และมีรายการ loopback ใน `gateway.trustedProxies`

  </Accordion>

  <Accordion title="ทำไมตอนนี้ฉันต้องใช้ token บน localhost?">
    OpenClaw บังคับใช้ auth ของ gateway โดยค่าเริ่มต้น รวมถึง loopback ในเส้นทางเริ่มต้นตามปกติ หมายถึง token auth: หากไม่ได้กำหนดเส้นทาง auth อย่างชัดเจน การเริ่มต้น gateway จะ resolve เป็นโหมด token และสร้าง token เฉพาะ runtime สำหรับการเริ่มต้นครั้งนั้น ดังนั้น **ไคลเอนต์ WS local ต้องตรวจสอบสิทธิ์** กำหนดค่า `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` หรือ `OPENCLAW_GATEWAY_PASSWORD` อย่างชัดเจนเมื่อไคลเอนต์ต้องการ secret ที่คงที่ข้ามการรีสตาร์ต สิ่งนี้จะป้องกันไม่ให้โปรเซส local อื่นเรียก Gateway

    หากคุณต้องการเส้นทาง auth แบบอื่น คุณสามารถเลือกโหมด password อย่างชัดเจนได้ (หรือสำหรับ reverse proxies ที่รับรู้ตัวตน ให้ใช้ `trusted-proxy`) หากคุณ **ต้องการจริง ๆ** ให้ loopback เปิดอยู่ ให้ตั้งค่า `gateway.auth.mode: "none"` อย่างชัดเจนในคอนฟิกของคุณ Doctor สามารถสร้าง token ให้คุณได้ทุกเมื่อ: `openclaw doctor --generate-gateway-token`

  </Accordion>

  <Accordion title="ฉันต้องรีสตาร์ตหลังเปลี่ยนคอนฟิกหรือไม่?">
    Gateway เฝ้าดูคอนฟิกและรองรับ hot-reload:

    - `gateway.reload.mode: "hybrid"` (ค่าเริ่มต้น): ใช้การเปลี่ยนแปลงที่ปลอดภัยแบบ hot-apply และรีสตาร์ตสำหรับการเปลี่ยนแปลงที่สำคัญ
    - รองรับ `hot`, `restart`, `off` ด้วย

  </Accordion>

  <Accordion title="ฉันจะปิด tagline ตลก ๆ ของ CLI ได้อย่างไร?">
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

    - `off`: ซ่อนข้อความ tagline แต่คงบรรทัดชื่อ/เวอร์ชันของ banner ไว้
    - `default`: ใช้ `All your chats, one OpenClaw.` ทุกครั้ง
    - `random`: tagline ตลก/ตามฤดูกาลแบบหมุนเวียน (พฤติกรรมเริ่มต้น)
    - หากคุณไม่ต้องการ banner เลย ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

  </Accordion>

  <Accordion title="ฉันจะเปิดใช้ web search (และ web fetch) ได้อย่างไร?">
    `web_fetch` ทำงานได้โดยไม่ต้องใช้คีย์ API `web_search` ขึ้นอยู่กับ
    ผู้ให้บริการที่คุณเลือก:

    - ผู้ให้บริการที่มี API รองรับ เช่น Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity และ Tavily ต้องตั้งค่าคีย์ API ตามปกติของแต่ละบริการ
    - Ollama Web Search ไม่ต้องใช้คีย์ แต่ใช้โฮสต์ Ollama ที่คุณกำหนดค่าไว้และต้องใช้ `ollama signin`
    - DuckDuckGo ไม่ต้องใช้คีย์ แต่เป็นการผสานรวมแบบ HTML ที่ไม่เป็นทางการ
    - SearXNG ไม่ต้องใช้คีย์/โฮสต์เองได้; กำหนดค่า `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl`

    **แนะนำ:** เรียกใช้ `openclaw configure --section web` และเลือกผู้ให้บริการ
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

    การกำหนดค่าเว็บเสิร์ชเฉพาะผู้ให้บริการตอนนี้อยู่ใต้ `plugins.entries.<plugin>.config.webSearch.*`
    เส้นทางผู้ให้บริการแบบเดิม `tools.web.search.*` ยังโหลดได้ชั่วคราวเพื่อความเข้ากันได้ แต่ไม่ควรใช้กับการกำหนดค่าใหม่
    การกำหนดค่า fallback สำหรับเว็บเฟตช์ของ Firecrawl อยู่ใต้ `plugins.entries.firecrawl.config.webFetch.*`

    หมายเหตุ:

    - หากคุณใช้รายการอนุญาต ให้เพิ่ม `web_search`/`web_fetch`/`x_search` หรือ `group:web`
    - `web_fetch` เปิดใช้ตามค่าเริ่มต้น (เว้นแต่จะปิดใช้อย่างชัดเจน)
    - หากละเว้น `tools.web.fetch.provider` OpenClaw จะตรวจหาผู้ให้บริการ fetch fallback รายแรกที่พร้อมใช้งานโดยอัตโนมัติจากข้อมูลประจำตัวที่มีอยู่ ปัจจุบันผู้ให้บริการที่มาพร้อมชุดคือ Firecrawl
    - Daemon อ่าน env vars จาก `~/.openclaw/.env` (หรือสภาพแวดล้อมของบริการ)

    เอกสาร: [เครื่องมือเว็บ](/th/tools/web)

  </Accordion>

  <Accordion title="config.apply ล้างการกำหนดค่าของฉัน ฉันจะกู้คืนและหลีกเลี่ยงสิ่งนี้ได้อย่างไร?">
    `config.apply` จะแทนที่ **การกำหนดค่าทั้งหมด** หากคุณส่งออบเจ็กต์บางส่วน ทุกอย่าง
    ที่เหลือจะถูกลบออก

    OpenClaw ปัจจุบันป้องกันการเขียนทับโดยไม่ตั้งใจได้หลายกรณี:

    - การเขียนการกำหนดค่าที่ OpenClaw เป็นเจ้าของจะตรวจสอบความถูกต้องของการกำหนดค่าหลังการเปลี่ยนแปลงแบบเต็มก่อนเขียน
    - การเขียนที่ OpenClaw เป็นเจ้าของซึ่งไม่ถูกต้องหรือทำลายข้อมูลจะถูกปฏิเสธและบันทึกเป็น `openclaw.json.rejected.*`
    - หากการแก้ไขโดยตรงทำให้การเริ่มต้นหรือการโหลดใหม่แบบร้อนเสียหาย Gateway จะ fail closed หรือข้ามการโหลดใหม่ โดยจะไม่เขียน `openclaw.json` ใหม่
    - `openclaw doctor --fix` เป็นผู้รับผิดชอบการซ่อมแซมและสามารถกู้คืนค่าล่าสุดที่ทราบว่าใช้งานได้ พร้อมบันทึกไฟล์ที่ถูกปฏิเสธเป็น `openclaw.json.clobbered.*`

    กู้คืน:

    - ตรวจสอบ `openclaw logs --follow` เพื่อหา `Invalid config at`, `Config write rejected:` หรือ `config reload skipped (invalid config)`
    - ตรวจสอบ `openclaw.json.clobbered.*` หรือ `openclaw.json.rejected.*` ล่าสุดที่อยู่ข้างการกำหนดค่าที่ใช้งานอยู่
    - รัน `openclaw config validate` และ `openclaw doctor --fix`
    - คัดลอกกลับเฉพาะคีย์ที่ต้องการด้วย `openclaw config set` หรือ `config.patch`
    - หากคุณไม่มีค่าล่าสุดที่ทราบว่าใช้งานได้หรือ payload ที่ถูกปฏิเสธ ให้กู้คืนจากข้อมูลสำรอง หรือรัน `openclaw doctor` อีกครั้งแล้วกำหนดค่า channels/models ใหม่
    - หากเหตุการณ์นี้ไม่คาดคิด ให้รายงานบั๊กและแนบการกำหนดค่าล่าสุดที่คุณทราบหรือข้อมูลสำรองใดๆ
    - เอเจนต์เขียนโค้ดในเครื่องมักสามารถสร้างการกำหนดค่าที่ใช้งานได้ใหม่จากบันทึกหรือประวัติ

    หลีกเลี่ยง:

    - ใช้ `openclaw config set` สำหรับการเปลี่ยนแปลงเล็กๆ
    - ใช้ `openclaw configure` สำหรับการแก้ไขแบบโต้ตอบ
    - ใช้ `config.schema.lookup` ก่อนเมื่อคุณไม่แน่ใจเกี่ยวกับเส้นทางที่แน่นอนหรือรูปทรงของฟิลด์ โดยจะส่งคืนโหนด schema แบบตื้นพร้อมสรุปลูกโดยตรงสำหรับการเจาะลึก
    - ใช้ `config.patch` สำหรับการแก้ไข RPC บางส่วน เก็บ `config.apply` ไว้สำหรับการแทนที่การกำหนดค่าแบบเต็มเท่านั้น
    - หากคุณใช้เครื่องมือ `gateway` สำหรับเจ้าของเท่านั้นจากการรันเอเจนต์ เครื่องมือนั้นยังคงปฏิเสธการเขียนไปยัง `tools.exec.ask` / `tools.exec.security` (รวมถึง alias เดิม `tools.bash.*` ที่ normalize เป็นเส้นทาง exec ที่ได้รับการป้องกันเดียวกัน)

    เอกสาร: [Config](/th/cli/config), [Configure](/th/cli/configure), [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันจะรัน Gateway ส่วนกลางพร้อมเวิร์กเกอร์เฉพาะทางข้ามอุปกรณ์ได้อย่างไร?">
    รูปแบบทั่วไปคือ **Gateway หนึ่งตัว** (เช่น Raspberry Pi) บวกกับ **nodes** และ **agents**:

    - **Gateway (ส่วนกลาง):** เป็นเจ้าของ channels (Signal/WhatsApp), การกำหนดเส้นทาง และ sessions
    - **Nodes (อุปกรณ์):** Macs/iOS/Android เชื่อมต่อเป็นอุปกรณ์ต่อพ่วงและเปิดเผยเครื่องมือในเครื่อง (`system.run`, `canvas`, `camera`)
    - **Agents (เวิร์กเกอร์):** สมอง/พื้นที่ทำงานแยกต่างหากสำหรับบทบาทพิเศษ (เช่น "Hetzner ops", "Personal data")
    - **Sub-agents:** สร้างงานพื้นหลังจากเอเจนต์หลักเมื่อคุณต้องการการทำงานแบบขนาน
    - **TUI:** เชื่อมต่อกับ Gateway และสลับ agents/sessions

    เอกสาร: [Nodes](/th/nodes), [การเข้าถึงระยะไกล](/th/gateway/remote), [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [Sub-agents](/th/tools/subagents), [TUI](/th/web/tui)

  </Accordion>

  <Accordion title="เบราว์เซอร์ OpenClaw รันแบบ headless ได้ไหม?">
    ได้ นี่เป็นตัวเลือกการกำหนดค่า:

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

    Headless ใช้ **เครื่องยนต์ Chromium เดียวกัน** และทำงานได้กับงานอัตโนมัติส่วนใหญ่ (ฟอร์ม, การคลิก, การ scraping, การเข้าสู่ระบบ) ความแตกต่างหลักคือ:

    - ไม่มีหน้าต่างเบราว์เซอร์ที่มองเห็นได้ (ใช้ภาพหน้าจอหากคุณต้องการภาพ)
    - บางไซต์เข้มงวดกับการทำงานอัตโนมัติในโหมด headless มากกว่า (CAPTCHA, anti-bot)
      ตัวอย่างเช่น X/Twitter มักบล็อกเซสชันแบบ headless

  </Accordion>

  <Accordion title="ฉันจะใช้ Brave สำหรับการควบคุมเบราว์เซอร์ได้อย่างไร?">
    ตั้งค่า `browser.executablePath` เป็นไบนารี Brave ของคุณ (หรือเบราว์เซอร์ที่ใช้ Chromium ตัวใดก็ได้) แล้วรีสตาร์ท Gateway
    ดูตัวอย่างการกำหนดค่าแบบเต็มใน [เบราว์เซอร์](/th/tools/browser#use-brave-or-another-chromium-based-browser)
  </Accordion>
</AccordionGroup>

## Gateway และ node ระยะไกล

<AccordionGroup>
  <Accordion title="คำสั่งแพร่กระจายระหว่าง Telegram, gateway และ nodes อย่างไร?">
    ข้อความ Telegram ถูกจัดการโดย **gateway** gateway จะรันเอเจนต์และ
    หลังจากนั้นจึงเรียก nodes ผ่าน **Gateway WebSocket** เมื่อจำเป็นต้องใช้เครื่องมือ node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes จะไม่เห็นทราฟฟิกขาเข้าจากผู้ให้บริการ พวกมันรับเฉพาะการเรียก node RPC เท่านั้น

  </Accordion>

  <Accordion title="เอเจนต์ของฉันจะเข้าถึงคอมพิวเตอร์ของฉันได้อย่างไร หาก Gateway โฮสต์อยู่ระยะไกล?">
    คำตอบสั้นๆ: **จับคู่คอมพิวเตอร์ของคุณเป็น node** Gateway รันอยู่ที่อื่น แต่สามารถ
    เรียกเครื่องมือ `node.*` (หน้าจอ, กล้อง, ระบบ) บนเครื่องในพื้นที่ของคุณผ่าน Gateway WebSocket

    การตั้งค่าทั่วไป:

    1. รัน Gateway บนโฮสต์ที่เปิดตลอดเวลา (VPS/เซิร์ฟเวอร์ที่บ้าน)
    2. วางโฮสต์ Gateway + คอมพิวเตอร์ของคุณไว้ใน tailnet เดียวกัน
    3. ตรวจสอบว่า Gateway WS เข้าถึงได้ (tailnet bind หรือ SSH tunnel)
    4. เปิดแอป macOS ในเครื่องและเชื่อมต่อในโหมด **Remote over SSH** (หรือ tailnet โดยตรง)
       เพื่อให้ลงทะเบียนเป็น node ได้
    5. อนุมัติ node บน Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ไม่จำเป็นต้องใช้ TCP bridge แยกต่างหาก nodes เชื่อมต่อผ่าน Gateway WebSocket

    คำเตือนด้านความปลอดภัย: การจับคู่ node macOS อนุญาตให้ใช้ `system.run` บนเครื่องนั้น จับคู่เฉพาะ
    อุปกรณ์ที่คุณไว้วางใจ และทบทวน [ความปลอดภัย](/th/gateway/security)

    เอกสาร: [Nodes](/th/nodes), [โปรโตคอล Gateway](/th/gateway/protocol), [โหมดระยะไกล macOS](/th/platforms/mac/remote), [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="Tailscale เชื่อมต่อแล้วแต่ฉันไม่ได้รับการตอบกลับ ตอนนี้ควรทำอย่างไร?">
    ตรวจสอบพื้นฐาน:

    - Gateway กำลังรันอยู่: `openclaw gateway status`
    - สุขภาพ Gateway: `openclaw status`
    - สุขภาพ Channel: `openclaw channels status`

    จากนั้นตรวจสอบ auth และการกำหนดเส้นทาง:

    - หากคุณใช้ Tailscale Serve ให้ตรวจสอบว่า `gateway.auth.allowTailscale` ตั้งค่าอย่างถูกต้อง
    - หากคุณเชื่อมต่อผ่าน SSH tunnel ให้ยืนยันว่า tunnel ในเครื่องเปิดอยู่และชี้ไปยังพอร์ตที่ถูกต้อง
    - ยืนยันว่ารายการอนุญาตของคุณ (DM หรือกลุ่ม) รวมบัญชีของคุณไว้แล้ว

    เอกสาร: [Tailscale](/th/gateway/tailscale), [การเข้าถึงระยะไกล](/th/gateway/remote), [Channels](/th/channels)

  </Accordion>

  <Accordion title="อินสแตนซ์ OpenClaw สองตัวคุยกันได้ไหม (ในเครื่อง + VPS)?">
    ได้ ไม่มี bridge แบบ "bot-to-bot" ในตัว แต่คุณสามารถเชื่อมต่อได้ด้วยวิธีที่
    เชื่อถือได้หลายแบบ:

    **ง่ายที่สุด:** ใช้ช่องแชทปกติที่บอททั้งสองเข้าถึงได้ (Telegram/Slack/WhatsApp)
    ให้ Bot A ส่งข้อความถึง Bot B แล้วปล่อยให้ Bot B ตอบกลับตามปกติ

    **CLI bridge (ทั่วไป):** รันสคริปต์ที่เรียก Gateway อีกตัวด้วย
    `openclaw agent --message ... --deliver` โดยกำหนดเป้าหมายเป็นแชทที่บอทอีกตัว
    ฟังอยู่ หากบอทตัวหนึ่งอยู่บน VPS ระยะไกล ให้ชี้ CLI ของคุณไปยัง Gateway ระยะไกลนั้น
    ผ่าน SSH/Tailscale (ดู [การเข้าถึงระยะไกล](/th/gateway/remote))

    รูปแบบตัวอย่าง (รันจากเครื่องที่เข้าถึง Gateway เป้าหมายได้):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    เคล็ดลับ: เพิ่ม guardrail เพื่อไม่ให้บอทสองตัววนลูปไม่รู้จบ (ตอบเฉพาะเมื่อถูก mention, รายการอนุญาตของ channel,
    หรือกฎ "ไม่ตอบกลับข้อความจากบอท")

    เอกสาร: [การเข้าถึงระยะไกล](/th/gateway/remote), [Agent CLI](/th/cli/agent), [Agent send](/th/tools/agent-send)

  </Accordion>

  <Accordion title="ฉันต้องใช้ VPS แยกสำหรับหลายเอเจนต์ไหม?">
    ไม่ต้อง Gateway หนึ่งตัวสามารถโฮสต์เอเจนต์หลายตัวได้ โดยแต่ละตัวมีพื้นที่ทำงาน ค่าเริ่มต้นของโมเดล
    และการกำหนดเส้นทางของตนเอง นี่คือการตั้งค่าปกติ และถูกกว่าและง่ายกว่าการรัน
    VPS หนึ่งตัวต่อเอเจนต์มาก

    ใช้ VPS แยกเฉพาะเมื่อคุณต้องการการแยกอย่างเข้มงวด (ขอบเขตความปลอดภัย) หรือการกำหนดค่าที่แตกต่างกันมาก
    ซึ่งคุณไม่ต้องการแชร์ มิฉะนั้น ให้ใช้ Gateway หนึ่งตัวและ
    ใช้หลายเอเจนต์หรือ sub-agents

  </Accordion>

  <Accordion title="การใช้ node บนแล็ปท็อปส่วนตัวของฉันแทน SSH จาก VPS มีประโยชน์ไหม?">
    มี nodes คือวิธีระดับแรกสำหรับเข้าถึงแล็ปท็อปของคุณจาก Gateway ระยะไกล และ
    ปลดล็อกได้มากกว่าการเข้าถึง shell Gateway รันบน macOS/Linux (Windows ผ่าน WSL2) และ
    เบา (VPS ขนาดเล็กหรือกล่องระดับ Raspberry Pi ก็เพียงพอ; RAM 4 GB เหลือเฟือ) ดังนั้นการตั้งค่าทั่วไป
    คือโฮสต์ที่เปิดตลอดเวลาบวกกับแล็ปท็อปของคุณเป็น node

    - **ไม่ต้องใช้ SSH ขาเข้า** Nodes เชื่อมต่อออกไปยัง Gateway WebSocket และใช้การจับคู่อุปกรณ์
    - **การควบคุมการดำเนินการที่ปลอดภัยกว่า** `system.run` ถูกควบคุมด้วยรายการอนุญาต/การอนุมัติของ node บนแล็ปท็อปนั้น
    - **เครื่องมืออุปกรณ์มากขึ้น** Nodes เปิดเผย `canvas`, `camera` และ `screen` นอกเหนือจาก `system.run`
    - **การทำงานอัตโนมัติของเบราว์เซอร์ในเครื่อง** ให้ Gateway อยู่บน VPS แต่รัน Chrome ในเครื่องผ่านโฮสต์ node บนแล็ปท็อป หรือเชื่อมต่อกับ Chrome ในเครื่องบนโฮสต์ผ่าน Chrome MCP

    SSH เหมาะสำหรับการเข้าถึง shell แบบเฉพาะกิจ แต่ nodes ง่ายกว่าสำหรับเวิร์กโฟลว์เอเจนต์ต่อเนื่องและ
    การทำงานอัตโนมัติของอุปกรณ์

    เอกสาร: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes), [เบราว์เซอร์](/th/tools/browser)

  </Accordion>

  <Accordion title="Nodes รันบริการ gateway หรือไม่?">
    ไม่ มีเพียง **gateway หนึ่งตัว** เท่านั้นที่ควรรันต่อโฮสต์ เว้นแต่คุณตั้งใจรันโปรไฟล์ที่แยกกัน (ดู [หลาย gateway](/th/gateway/multiple-gateways)) Nodes เป็นอุปกรณ์ต่อพ่วงที่เชื่อมต่อ
    กับ gateway (nodes iOS/Android หรือ "โหมด node" ของ macOS ในแอปแถบเมนู) สำหรับโฮสต์ node
    แบบ headless และการควบคุม CLI ดู [Node host CLI](/th/cli/node)

    ต้องรีสตาร์ทเต็มรูปแบบสำหรับการเปลี่ยนแปลง `gateway`, `discovery` และพื้นผิว Plugin ที่โฮสต์ไว้

  </Accordion>

  <Accordion title="มีวิธี API / RPC สำหรับใช้การกำหนดค่าหรือไม่?">
    มี

    - `config.schema.lookup`: ตรวจสอบแผนผังย่อยของ config หนึ่งรายการพร้อมโหนดสคีมาแบบตื้น คำใบ้ UI ที่ตรงกัน และสรุปลูกโดยตรงก่อนเขียน
    - `config.get`: ดึง snapshot + hash ปัจจุบัน
    - `config.patch`: อัปเดตบางส่วนอย่างปลอดภัย (แนะนำสำหรับการแก้ไข RPC ส่วนใหญ่); โหลดใหม่แบบ hot-reload เมื่อทำได้ และรีสตาร์ตเมื่อจำเป็น
    - `config.apply`: ตรวจสอบความถูกต้อง + แทนที่ config ทั้งหมด; โหลดใหม่แบบ hot-reload เมื่อทำได้ และรีสตาร์ตเมื่อจำเป็น
    - เครื่องมือรันไทม์ `gateway` เฉพาะเจ้าของยังคงปฏิเสธการเขียนทับ `tools.exec.ask` / `tools.exec.security`; alias เดิม `tools.bash.*` จะ normalize ไปยังเส้นทาง exec ที่ได้รับการป้องกันเดียวกัน

  </Accordion>

  <Accordion title="config ขั้นต่ำที่สมเหตุสมผลสำหรับการติดตั้งครั้งแรก">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    การตั้งค่านี้กำหนด workspace ของคุณและจำกัดว่าใครสามารถทริกเกอร์บอทได้

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
       - ในคอนโซลผู้ดูแล Tailscale ให้เปิดใช้ MagicDNS เพื่อให้ VPS มีชื่อที่เสถียร
    4. **ใช้ชื่อโฮสต์ของ tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    หากคุณต้องการ UI ควบคุมโดยไม่ใช้ SSH ให้ใช้ Tailscale Serve บน VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    วิธีนี้จะผูก gateway ไว้กับ loopback และเปิดเผย HTTPS ผ่าน Tailscale ดู [Tailscale](/th/gateway/tailscale)

  </Accordion>

  <Accordion title="ฉันจะเชื่อมต่อ Node ของ Mac กับ Gateway ระยะไกล (Tailscale Serve) ได้อย่างไร?">
    Serve เปิดเผย **UI ควบคุม Gateway + WS** Node จะเชื่อมต่อผ่านปลายทาง Gateway WS เดียวกัน

    การตั้งค่าที่แนะนำ:

    1. **ตรวจสอบให้แน่ใจว่า VPS + Mac อยู่ใน tailnet เดียวกัน**
    2. **ใช้แอป macOS ในโหมด Remote** (เป้าหมาย SSH สามารถเป็นชื่อโฮสต์ของ tailnet ได้)
       แอปจะ tunnel พอร์ต Gateway และเชื่อมต่อเป็น Node
    3. **อนุมัติ Node** บน gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    เอกสาร: [โปรโตคอล Gateway](/th/gateway/protocol), [การค้นพบ](/th/gateway/discovery), [โหมดระยะไกล macOS](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันควรติดตั้งบนแล็ปท็อปเครื่องที่สอง หรือแค่เพิ่ม Node?">
    หากคุณต้องการเพียง **เครื่องมือ local** (หน้าจอ/กล้อง/exec) บนแล็ปท็อปเครื่องที่สอง ให้เพิ่มเป็น
    **Node** วิธีนี้จะคง Gateway เดียวไว้และหลีกเลี่ยง config ซ้ำ เครื่องมือ Node local
    ตอนนี้รองรับเฉพาะ macOS แต่เราวางแผนจะขยายไปยัง OS อื่นๆ

    ติดตั้ง Gateway เครื่องที่สองเฉพาะเมื่อคุณต้องการ **การแยกอย่างเข้มงวด** หรือบอทสองตัวที่แยกจากกันโดยสมบูรณ์

    เอกสาร: [Node](/th/nodes), [CLI ของ Node](/th/cli/nodes), [Gateway หลายตัว](/th/gateway/multiple-gateways)

  </Accordion>
</AccordionGroup>

## ตัวแปรสภาพแวดล้อมและการโหลด .env

<AccordionGroup>
  <Accordion title="OpenClaw โหลดตัวแปรสภาพแวดล้อมอย่างไร?">
    OpenClaw อ่านตัวแปรสภาพแวดล้อมจากกระบวนการแม่ (shell, launchd/systemd, CI ฯลฯ) และยังโหลดเพิ่มเติม:

    - `.env` จากไดเรกทอรีทำงานปัจจุบัน
    - `.env` สำรองแบบ global จาก `~/.openclaw/.env` (หรือ `$OPENCLAW_STATE_DIR/.env`)

    ไฟล์ `.env` ทั้งสองไฟล์จะไม่เขียนทับตัวแปรสภาพแวดล้อมที่มีอยู่

    คุณยังสามารถกำหนดตัวแปรสภาพแวดล้อมแบบ inline ใน config ได้ (ใช้เฉพาะเมื่อขาดจาก env ของกระบวนการ):

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

  <Accordion title="ฉันเริ่ม Gateway ผ่าน service แล้วตัวแปรสภาพแวดล้อมหายไป ต้องทำอย่างไร?">
    วิธีแก้ที่พบบ่อยสองแบบ:

    1. ใส่ key ที่หายไปใน `~/.openclaw/.env` เพื่อให้ถูกดึงมาใช้แม้ service จะไม่ได้รับ env จาก shell ของคุณ
    2. เปิดใช้การนำเข้าจาก shell (ความสะดวกแบบต้องเลือกเปิด):

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

    วิธีนี้จะรัน login shell ของคุณและนำเข้าเฉพาะ key ที่คาดไว้แต่ยังขาดอยู่ (ไม่เขียนทับเด็ดขาด) ตัวแปรสภาพแวดล้อมที่เทียบเท่า:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

  </Accordion>

  <Accordion title='ฉันตั้งค่า COPILOT_GITHUB_TOKEN แล้ว แต่สถานะโมเดลแสดงว่า "Shell env: off." เพราะอะไร?'>
    `openclaw models status` รายงานว่า **การนำเข้า env จาก shell** เปิดใช้อยู่หรือไม่ "Shell env: off"
    **ไม่ได้** หมายความว่าตัวแปรสภาพแวดล้อมของคุณหายไป - แค่หมายความว่า OpenClaw จะไม่โหลด
    login shell ของคุณโดยอัตโนมัติ

    หาก Gateway รันเป็น service (launchd/systemd) มันจะไม่ได้รับสภาพแวดล้อมจาก shell
    ของคุณ แก้ไขโดยทำอย่างใดอย่างหนึ่งต่อไปนี้:

    1. ใส่ token ใน `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. หรือเปิดใช้การนำเข้าจาก shell (`env.shellEnv.enabled: true`)
    3. หรือเพิ่มลงในบล็อก `env` ของ config (ใช้เฉพาะเมื่อขาดอยู่)

    จากนั้นรีสตาร์ต gateway และตรวจสอบอีกครั้ง:

    ```bash
    openclaw models status
    ```

    token ของ Copilot อ่านจาก `COPILOT_GITHUB_TOKEN` (รวมถึง `GH_TOKEN` / `GITHUB_TOKEN`)
    ดู [/concepts/model-providers](/th/concepts/model-providers) และ [/environment](/th/help/environment)

  </Accordion>
</AccordionGroup>

## เซสชันและหลายแชต

<AccordionGroup>
  <Accordion title="ฉันจะเริ่มบทสนทนาใหม่ได้อย่างไร?">
    ส่ง `/new` หรือ `/reset` เป็นข้อความเดี่ยว ดู [การจัดการเซสชัน](/th/concepts/session)
  </Accordion>

  <Accordion title="เซสชันจะรีเซ็ตอัตโนมัติหรือไม่หากฉันไม่เคยส่ง /new?">
    เซสชันสามารถหมดอายุหลังจาก `session.idleMinutes` แต่ฟีเจอร์นี้ **ปิดโดยค่าเริ่มต้น** (ค่าเริ่มต้น **0**)
    ตั้งค่าเป็นค่าบวกเพื่อเปิดใช้การหมดอายุเมื่อไม่มีการใช้งาน เมื่อเปิดใช้แล้ว ข้อความ **ถัดไป**
    หลังช่วงเวลาที่ไม่มีการใช้งานจะเริ่มรหัสเซสชันใหม่สำหรับคีย์แชตนั้น
    การทำเช่นนี้ไม่ลบ transcript - เพียงเริ่มเซสชันใหม่

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="มีวิธีสร้างทีมของอินสแตนซ์ OpenClaw (CEO หนึ่งตัวและ agent หลายตัว) หรือไม่?">
    มี ผ่าน **การกำหนดเส้นทางแบบหลาย agent** และ **sub-agent** คุณสามารถสร้าง agent ผู้ประสานงานหนึ่งตัว
    และ agent ผู้ปฏิบัติงานหลายตัวพร้อม workspace และโมเดลของตนเอง

    อย่างไรก็ตาม สิ่งนี้เหมาะจะมองเป็น **การทดลองสนุกๆ** มากกว่า ใช้ token มากและมัก
    มีประสิทธิภาพน้อยกว่าการใช้บอทหนึ่งตัวกับเซสชันแยกกัน โมเดลทั่วไปที่เรา
    จินตนาการไว้คือบอทหนึ่งตัวที่คุณคุยด้วย พร้อมเซสชันต่างๆ สำหรับงานขนาน บอทนั้น
    ยังสามารถ spawn sub-agent ได้เมื่อจำเป็น

    เอกสาร: [การกำหนดเส้นทางแบบหลาย agent](/th/concepts/multi-agent), [Sub-agent](/th/tools/subagents), [CLI ของ Agent](/th/cli/agents)

  </Accordion>

  <Accordion title="ทำไม context จึงถูกตัดกลางงาน? จะป้องกันได้อย่างไร?">
    context ของเซสชันถูกจำกัดด้วยหน้าต่างของโมเดล แชตยาวๆ, output เครื่องมือจำนวนมาก, หรือไฟล์จำนวนมาก
    อาจทำให้เกิด Compaction หรือการตัดทอนได้

    สิ่งที่ช่วยได้:

    - ขอให้บอทสรุปสถานะปัจจุบันและเขียนลงไฟล์
    - ใช้ `/compact` ก่อนงานยาว และใช้ `/new` เมื่อเปลี่ยนหัวข้อ
    - เก็บ context สำคัญไว้ใน workspace และขอให้บอทอ่านกลับมา
    - ใช้ sub-agent สำหรับงานยาวหรืองานขนาน เพื่อให้แชตหลักเล็กลง
    - เลือกโมเดลที่มีหน้าต่าง context ใหญ่ขึ้นหากเกิดบ่อย

  </Accordion>

  <Accordion title="ฉันจะรีเซ็ต OpenClaw ทั้งหมดแต่ยังคงติดตั้งไว้ได้อย่างไร?">
    ใช้คำสั่ง reset:

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

    - Onboarding ยังเสนอตัวเลือก **รีเซ็ต** หากพบ config ที่มีอยู่ ดู [Onboarding (CLI)](/th/start/wizard)
    - หากคุณใช้โปรไฟล์ (`--profile` / `OPENCLAW_PROFILE`) ให้รีเซ็ต state dir แต่ละรายการ (ค่าเริ่มต้นคือ `~/.openclaw-<profile>`)
    - รีเซ็ตสำหรับ dev: `openclaw gateway --dev --reset` (เฉพาะ dev; ล้าง config + credentials + sessions + workspace ของ dev)

  </Accordion>

  <Accordion title='ฉันพบข้อผิดพลาด "context too large" - จะรีเซ็ตหรือ compact ได้อย่างไร?'>
    ใช้อย่างใดอย่างหนึ่งต่อไปนี้:

    - **Compact** (คงบทสนทนาไว้แต่สรุป turn เก่าๆ):

      ```
      /compact
      ```

      หรือ `/compact <instructions>` เพื่อกำหนดแนวทางให้สรุป

    - **รีเซ็ต** (รหัสเซสชันใหม่สำหรับคีย์แชตเดิม):

      ```
      /new
      /reset
      ```

    หากยังเกิดขึ้นต่อเนื่อง:

    - เปิดใช้หรือปรับแต่ง **การตัดแต่งเซสชัน** (`agents.defaults.contextPruning`) เพื่อตัด output เครื่องมือเก่าๆ
    - ใช้โมเดลที่มีหน้าต่าง context ใหญ่ขึ้น

    เอกสาร: [Compaction](/th/concepts/compaction), [การตัดแต่งเซสชัน](/th/concepts/session-pruning), [การจัดการเซสชัน](/th/concepts/session)

  </Accordion>

  <Accordion title='ทำไมฉันจึงเห็น "LLM request rejected: messages.content.tool_use.input field required"?'>
    นี่เป็นข้อผิดพลาดการตรวจสอบความถูกต้องจาก provider: โมเดลส่งบล็อก `tool_use` โดยไม่มี
    `input` ที่จำเป็น โดยปกติหมายความว่าประวัติเซสชันเก่าหรือเสียหาย (มักเกิดหลัง thread ยาวๆ
    หรือมีการเปลี่ยนเครื่องมือ/สคีมา)

    วิธีแก้: เริ่มเซสชันใหม่ด้วย `/new` (ข้อความเดี่ยว)

  </Accordion>

  <Accordion title="ทำไมฉันจึงได้รับข้อความ Heartbeat ทุก 30 นาที?">
    Heartbeat รันทุก **30m** โดยค่าเริ่มต้น (**1h** เมื่อใช้การยืนยันตัวตนแบบ OAuth) ปรับแต่งหรือปิดได้:

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

    หาก `HEARTBEAT.md` มีอยู่แต่แทบว่างเปล่า (มีเพียงบรรทัดว่างและหัวข้อ markdown
    เช่น `# Heading`) OpenClaw จะข้ามการรัน Heartbeat เพื่อประหยัด API call
    หากไฟล์หายไป Heartbeat ยังคงรันและให้โมเดลตัดสินใจว่าจะทำอะไร

    การ override ราย agent ใช้ `agents.list[].heartbeat` เอกสาร: [Heartbeat](/th/gateway/heartbeat)

  </Accordion>

  <Accordion title='ฉันต้องเพิ่ม "บัญชีบอท" เข้าในกลุ่ม WhatsApp หรือไม่?'>
    ไม่ต้อง OpenClaw รันบน **บัญชีของคุณเอง** ดังนั้นหากคุณอยู่ในกลุ่ม OpenClaw ก็เห็นได้
    โดยค่าเริ่มต้น การตอบกลับในกลุ่มจะถูกบล็อกจนกว่าคุณจะอนุญาตผู้ส่ง (`groupPolicy: "allowlist"`)

    หากคุณต้องการให้มีเพียง **คุณ** ที่สามารถทริกเกอร์การตอบกลับในกลุ่มได้:

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

  <Accordion title="ฉันจะดู JID ของกลุ่ม WhatsApp ได้อย่างไร?">
    ตัวเลือก 1 (เร็วที่สุด): tail log แล้วส่งข้อความทดสอบในกลุ่ม:

    ```bash
    openclaw logs --follow --json
    ```

    มองหา `chatId` (หรือ `from`) ที่ลงท้ายด้วย `@g.us` เช่น:
    `1234567890-1234567890@g.us`

    ตัวเลือก 2 (หากกำหนดค่า/allowlist แล้ว): แสดงรายชื่อกลุ่มจาก config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    เอกสาร: [WhatsApp](/th/channels/whatsapp), [Directory](/th/cli/directory), [Log](/th/cli/logs)

  </Accordion>

  <Accordion title="ทำไม OpenClaw จึงไม่ตอบกลับในกลุ่ม?">
    สาเหตุที่พบบ่อยสองประการ:

    - การ gating ด้วยการ mention เปิดอยู่ (ค่าเริ่มต้น) คุณต้อง @mention บอท (หรือให้ตรงกับ `mentionPatterns`)
    - คุณกำหนดค่า `channels.whatsapp.groups` โดยไม่มี `"*"` และกลุ่มนั้นไม่ได้อยู่ใน allowlist

    ดู [กลุ่ม](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages)

  </Accordion>

  <Accordion title="กลุ่ม/thread ใช้ context ร่วมกับ DM หรือไม่?">
    แชตโดยตรงจะรวมเป็นเซสชันหลักโดยค่าเริ่มต้น กลุ่ม/channel มีคีย์เซสชันของตนเอง และหัวข้อ Telegram / thread Discord เป็นเซสชันแยกต่างหาก ดู [กลุ่ม](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages)
  </Accordion>

  <Accordion title="ฉันสามารถสร้างเวิร์กสเปซและเอเจนต์ได้กี่รายการ?">
    ไม่มีขีดจำกัดตายตัว หลายสิบรายการ (หรือแม้แต่หลายร้อยรายการ) ก็ใช้ได้ แต่ควรระวัง:

    - **การเติบโตของดิสก์:** เซสชัน + ทรานสคริปต์อยู่ใต้ `~/.openclaw/agents/<agentId>/sessions/`.
    - **ค่าใช้จ่ายโทเค็น:** เอเจนต์มากขึ้นหมายถึงการใช้งานโมเดลพร้อมกันมากขึ้น
    - **ภาระงานด้านปฏิบัติการ:** โปรไฟล์ยืนยันตัวตน เวิร์กสเปซ และการกำหนดเส้นทางช่องทางแบบต่อเอเจนต์

    เคล็ดลับ:

    - เก็บเวิร์กสเปซที่ **ใช้งานอยู่** หนึ่งรายการต่อเอเจนต์ (`agents.defaults.workspace`)
    - ตัดเซสชันเก่าออก (ลบ JSONL หรือรายการในสโตร์) หากดิสก์โตขึ้น
    - ใช้ `openclaw doctor` เพื่อตรวจหาเวิร์กสเปซหลงเหลือและโปรไฟล์ที่ไม่ตรงกัน

  </Accordion>

  <Accordion title="ฉันสามารถรันบอตหรือแชตหลายรายการพร้อมกันได้ไหม (Slack) และควรตั้งค่าอย่างไร?">
    ได้ ใช้ **การกำหนดเส้นทางหลายเอเจนต์** เพื่อรันเอเจนต์ที่แยกกันหลายตัว และกำหนดเส้นทางข้อความขาเข้าตาม
    ช่องทาง/บัญชี/คู่สนทนา Slack รองรับในฐานะช่องทางและผูกกับเอเจนต์เฉพาะได้

    การเข้าถึงเบราว์เซอร์ทรงพลัง แต่ไม่ใช่ "ทำได้ทุกอย่างเหมือนมนุษย์" - ระบบกันบอต, CAPTCHA และ MFA ยังสามารถ
    บล็อกการทำงานอัตโนมัติได้ สำหรับการควบคุมเบราว์เซอร์ที่เชื่อถือได้ที่สุด ให้ใช้ Chrome MCP ในเครื่องบนโฮสต์
    หรือใช้ CDP บนเครื่องที่รันเบราว์เซอร์จริง

    การตั้งค่าตามแนวทางปฏิบัติที่ดี:

    - โฮสต์ Gateway ที่เปิดตลอดเวลา (VPS/Mac mini)
    - หนึ่งเอเจนต์ต่อหนึ่งบทบาท (การผูก)
    - ช่องทาง Slack ที่ผูกกับเอเจนต์เหล่านั้น
    - เบราว์เซอร์ในเครื่องผ่าน Chrome MCP หรือโหนดเมื่อจำเป็น

    เอกสาร: [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [Slack](/th/channels/slack),
    [เบราว์เซอร์](/th/tools/browser), [โหนด](/th/nodes).

  </Accordion>
</AccordionGroup>

## โมเดล, failover และโปรไฟล์ยืนยันตัวตน

ถามตอบเกี่ยวกับโมเดล — ค่าเริ่มต้น, การเลือก, นามแฝง, การสลับ, failover, โปรไฟล์ยืนยันตัวตน —
อยู่ใน [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models)

## Gateway: พอร์ต, "ทำงานอยู่แล้ว" และโหมดระยะไกล

<AccordionGroup>
  <Accordion title="Gateway ใช้พอร์ตใด?">
    `gateway.port` ควบคุมพอร์ตแบบมัลติเพล็กซ์เดี่ยวสำหรับ WebSocket + HTTP (Control UI, hooks และอื่น ๆ)

    ลำดับความสำคัญ:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status จึงบอกว่า "Runtime: running" แต่ "Connectivity probe: failed"?'>
    เพราะ "running" คือมุมมองของ **supervisor** (launchd/systemd/schtasks) ส่วนการตรวจสอบการเชื่อมต่อคือ CLI ที่เชื่อมต่อไปยัง WebSocket ของ Gateway จริง ๆ

    ใช้ `openclaw gateway status` และเชื่อถือบรรทัดเหล่านี้:

    - `Probe target:` (URL ที่การตรวจสอบใช้จริง)
    - `Listening:` (สิ่งที่ผูกอยู่กับพอร์ตจริง)
    - `Last gateway error:` (สาเหตุหลักที่พบบ่อยเมื่อโปรเซสยังทำงานอยู่แต่พอร์ตไม่ได้ฟังอยู่)

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status แสดง "Config (cli)" และ "Config (service)" ต่างกัน?'>
    คุณกำลังแก้ไขไฟล์คอนฟิกหนึ่ง ขณะที่บริการกำลังรันอีกไฟล์หนึ่งอยู่ (มักเป็นความไม่ตรงกันของ `--profile` / `OPENCLAW_STATE_DIR`)

    วิธีแก้:

    ```bash
    openclaw gateway install --force
    ```

    รันคำสั่งนั้นจาก `--profile` / สภาพแวดล้อมเดียวกับที่คุณต้องการให้บริการใช้

  </Accordion>

  <Accordion title='"another gateway instance is already listening" หมายความว่าอะไร?'>
    OpenClaw บังคับใช้ runtime lock โดยผูกตัวฟัง WebSocket ทันทีเมื่อเริ่มต้น (ค่าเริ่มต้น `ws://127.0.0.1:18789`) หากการผูกล้มเหลวด้วย `EADDRINUSE` ระบบจะโยน `GatewayLockError` เพื่อระบุว่ามีอินสแตนซ์อื่นกำลังฟังอยู่แล้ว

    วิธีแก้: หยุดอินสแตนซ์อื่น, ทำให้พอร์ตว่าง, หรือรันด้วย `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="ฉันจะรัน OpenClaw ในโหมดระยะไกลได้อย่างไร (ไคลเอนต์เชื่อมต่อไปยัง Gateway ที่อื่น)?">
    ตั้งค่า `gateway.mode: "remote"` และชี้ไปยัง URL WebSocket ระยะไกล โดยอาจใช้ข้อมูลรับรองระยะไกลแบบ shared-secret ด้วย:

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

    - `openclaw gateway` จะเริ่มต้นเมื่อ `gateway.mode` เป็น `local` เท่านั้น (หรือคุณส่งแฟล็ก override)
    - แอป macOS เฝ้าดูไฟล์คอนฟิกและสลับโหมดแบบสดเมื่อค่าเหล่านี้เปลี่ยน
    - `gateway.remote.token` / `.password` เป็นข้อมูลรับรองระยะไกลฝั่งไคลเอนต์เท่านั้น; ค่าเหล่านี้ไม่ได้เปิดใช้การยืนยันตัวตนของ Gateway ในเครื่องด้วยตัวเอง

  </Accordion>

  <Accordion title='Control UI บอกว่า "unauthorized" (หรือเชื่อมต่อใหม่ซ้ำ ๆ) ควรทำอย่างไร?'>
    เส้นทางยืนยันตัวตนของ Gateway และวิธียืนยันตัวตนของ UI ไม่ตรงกัน

    ข้อเท็จจริง (จากโค้ด):

    - Control UI เก็บโทเค็นไว้ใน `sessionStorage` สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL Gateway ที่เลือก ดังนั้นการรีเฟรชในแท็บเดิมยังทำงานได้โดยไม่ต้องนำการคงอยู่ของโทเค็นใน localStorage ระยะยาวกลับมา
    - เมื่อเกิด `AUTH_TOKEN_MISMATCH` ไคลเอนต์ที่เชื่อถือได้สามารถลองซ้ำแบบจำกัดหนึ่งครั้งด้วยโทเค็นอุปกรณ์ที่แคชไว้ เมื่อ Gateway ส่งคำใบ้ให้ลองซ้ำ (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)
    - การลองซ้ำด้วยโทเค็นที่แคชไว้นั้นตอนนี้นำขอบเขตที่อนุมัติแล้วซึ่งเก็บไว้กับโทเค็นอุปกรณ์กลับมาใช้ ผู้เรียกที่ระบุ `deviceToken` ชัดเจน / `scopes` ชัดเจน ยังคงใช้ชุดขอบเขตที่ร้องขอไว้เองแทนที่จะสืบทอดขอบเขตจากแคช
    - นอกเส้นทางลองซ้ำนั้น ลำดับความสำคัญของการยืนยันตัวตนตอนเชื่อมต่อคือ shared token/password ที่ระบุชัดเจนก่อน จากนั้นจึงเป็น `deviceToken` ที่ระบุชัดเจน, โทเค็นอุปกรณ์ที่จัดเก็บไว้, แล้วจึงเป็น bootstrap token
    - การตรวจสอบขอบเขตของ Bootstrap token มีคำนำหน้าตามบทบาท รายการอนุญาตตัวดำเนินการ bootstrap ในตัวตอบสนองเฉพาะคำขอของตัวดำเนินการเท่านั้น; บทบาทโหนดหรือบทบาทที่ไม่ใช่ตัวดำเนินการอื่น ๆ ยังต้องมีขอบเขตภายใต้คำนำหน้าบทบาทของตนเอง

    วิธีแก้:

    - เร็วที่สุด: `openclaw dashboard` (พิมพ์ + คัดลอก URL แดชบอร์ด, พยายามเปิด; แสดงคำใบ้ SSH หากเป็นเครื่อง headless)
    - หากคุณยังไม่มีโทเค็น: `openclaw doctor --generate-gateway-token`
    - หากเป็นระยะไกล ให้ทำ tunnel ก่อน: `ssh -N -L 18789:127.0.0.1:18789 user@host` จากนั้นเปิด `http://127.0.0.1:18789/`
    - โหมด shared-secret: ตั้งค่า `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` จากนั้นวาง secret ที่ตรงกันในการตั้งค่า Control UI
    - โหมด Tailscale Serve: ตรวจสอบว่าเปิดใช้ `gateway.auth.allowTailscale` แล้ว และคุณกำลังเปิด Serve URL ไม่ใช่ URL loopback/tailnet ดิบที่ข้ามส่วนหัวระบุตัวตนของ Tailscale
    - โหมด trusted-proxy: ตรวจสอบว่าคุณเข้ามาผ่านพร็อกซีแบบรับรู้ตัวตนที่กำหนดค่าไว้ ไม่ใช่ URL Gateway ดิบ พร็อกซี loopback บนโฮสต์เดียวกันยังต้องใช้ `gateway.auth.trustedProxy.allowLoopback = true`
    - หากยังไม่ตรงกันหลังการลองซ้ำหนึ่งครั้ง ให้หมุน/อนุมัติโทเค็นอุปกรณ์ที่จับคู่ใหม่:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - หากคำสั่ง rotate นั้นบอกว่าถูกปฏิเสธ ให้ตรวจสอบสองเรื่อง:
      - เซสชันอุปกรณ์ที่จับคู่แล้วหมุนได้เฉพาะอุปกรณ์ **ของตนเอง** เท่านั้น เว้นแต่จะมี `operator.admin` ด้วย
      - ค่า `--scope` ที่ระบุชัดเจนต้องไม่เกินขอบเขต operator ปัจจุบันของผู้เรียก
    - ยังติดอยู่หรือไม่? รัน `openclaw status --all` และทำตาม [การแก้ไขปัญหา](/th/gateway/troubleshooting) ดู [แดชบอร์ด](/th/web/dashboard) สำหรับรายละเอียดการยืนยันตัวตน

  </Accordion>

  <Accordion title="ฉันตั้งค่า gateway.bind เป็น tailnet แต่ผูกไม่ได้และไม่มีอะไรฟังอยู่">
    การผูก `tailnet` จะเลือก IP ของ Tailscale จากอินเทอร์เฟซเครือข่ายของคุณ (100.64.0.0/10) หากเครื่องไม่ได้อยู่บน Tailscale (หรืออินเทอร์เฟซปิดอยู่) ก็ไม่มีอะไรให้ผูก

    วิธีแก้:

    - เริ่ม Tailscale บนโฮสต์นั้น (เพื่อให้มีที่อยู่ 100.x), หรือ
    - สลับเป็น `gateway.bind: "loopback"` / `"lan"`.

    หมายเหตุ: `tailnet` เป็นการตั้งค่าโดยชัดเจน `auto` จะชอบ loopback; ใช้ `gateway.bind: "tailnet"` เมื่อคุณต้องการผูกเฉพาะ tailnet

  </Accordion>

  <Accordion title="ฉันสามารถรัน Gateway หลายตัวบนโฮสต์เดียวกันได้ไหม?">
    โดยปกติไม่ได้ - Gateway หนึ่งตัวสามารถรันช่องทางส่งข้อความและเอเจนต์หลายรายการได้ ใช้ Gateway หลายตัวเฉพาะเมื่อคุณต้องการความซ้ำซ้อน (เช่น บอตกู้คืน) หรือการแยกอย่างเข้มงวด

    ได้ แต่คุณต้องแยก:

    - `OPENCLAW_CONFIG_PATH` (คอนฟิกต่ออินสแตนซ์)
    - `OPENCLAW_STATE_DIR` (สถานะต่ออินสแตนซ์)
    - `agents.defaults.workspace` (การแยกเวิร์กสเปซ)
    - `gateway.port` (พอร์ตที่ไม่ซ้ำกัน)

    การตั้งค่าแบบเร็ว (แนะนำ):

    - ใช้ `openclaw --profile <name> ...` ต่ออินสแตนซ์ (สร้าง `~/.openclaw-<name>` อัตโนมัติ)
    - ตั้งค่า `gateway.port` ที่ไม่ซ้ำกันในคอนฟิกของแต่ละโปรไฟล์ (หรือส่ง `--port` สำหรับการรันด้วยตนเอง)
    - ติดตั้งบริการต่อโปรไฟล์: `openclaw --profile <name> gateway install`.

    โปรไฟล์ยังต่อท้ายชื่อบริการด้วย (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`)
    คู่มือฉบับเต็ม: [Gateway หลายตัว](/th/gateway/multiple-gateways)

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008 หมายความว่าอะไร?'>
    Gateway เป็น **เซิร์ฟเวอร์ WebSocket** และคาดหวังให้ข้อความแรกสุด
    เป็นเฟรม `connect` หากได้รับอย่างอื่น ระบบจะปิดการเชื่อมต่อ
    ด้วย **code 1008** (การละเมิดนโยบาย)

    สาเหตุที่พบบ่อย:

    - คุณเปิด URL **HTTP** ในเบราว์เซอร์ (`http://...`) แทนที่จะใช้ไคลเอนต์ WS
    - คุณใช้พอร์ตหรือพาธผิด
    - พร็อกซีหรือ tunnel ตัดส่วนหัว auth ออก หรือส่งคำขอที่ไม่ใช่ Gateway

    วิธีแก้แบบเร็ว:

    1. ใช้ URL WS: `ws://<host>:18789` (หรือ `wss://...` หากเป็น HTTPS)
    2. อย่าเปิดพอร์ต WS ในแท็บเบราว์เซอร์ปกติ
    3. หากเปิด auth อยู่ ให้ใส่ token/password ในเฟรม `connect`

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
    ไฟล์ล็อก (แบบมีโครงสร้าง):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    คุณสามารถตั้งค่าพาธคงที่ผ่าน `logging.file` ระดับไฟล์ล็อกควบคุมโดย `logging.level` ความละเอียดของคอนโซลควบคุมโดย `--verbose` และ `logging.consoleLevel`

    tail ล็อกที่เร็วที่สุด:

    ```bash
    openclaw logs --follow
    ```

    ล็อกบริการ/supervisor (เมื่อ Gateway รันผ่าน launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` และ `gateway.err.log` (ค่าเริ่มต้น: `~/.openclaw/logs/...`; โปรไฟล์ใช้ `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    ดู [การแก้ไขปัญหา](/th/gateway/troubleshooting) เพิ่มเติม

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
    มี **โหมดติดตั้ง Windows สองแบบ**:

    **1) WSL2 (แนะนำ):** Gateway รันอยู่ภายใน Linux

    เปิด PowerShell, เข้า WSL, จากนั้นรีสตาร์ต:

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

    เอกสาร: [Windows (WSL2)](/th/platforms/windows), [คู่มือการรันบริการ Gateway](/th/gateway)

  </Accordion>

  <Accordion title="Gateway ทำงานแล้วแต่ไม่มีการตอบกลับมาถึง ฉันควรตรวจอะไร?">
    เริ่มด้วยการตรวจสุขภาพอย่างเร็ว:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    สาเหตุที่พบบ่อย:

    - การยืนยันตัวตนของโมเดลไม่ได้โหลดบน **Gateway host** (ตรวจสอบ `models status`)
    - การจับคู่/allowlist ของช่องทางบล็อกการตอบกลับ (ตรวจสอบการกำหนดค่าช่องทาง + บันทึก)
    - WebChat/แดชบอร์ดเปิดอยู่โดยไม่มีโทเค็นที่ถูกต้อง.

    หากคุณใช้งานจากระยะไกล ให้ยืนยันว่าการเชื่อมต่อ tunnel/Tailscale พร้อมใช้งาน และ
    Gateway WebSocket เข้าถึงได้.

    เอกสาร: [ช่องทาง](/th/channels), [การแก้ไขปัญหา](/th/gateway/troubleshooting), [การเข้าถึงระยะไกล](/th/gateway/remote).

  </Accordion>

  <Accordion title='"ตัดการเชื่อมต่อจาก Gateway: ไม่มีเหตุผล" - ต้องทำอย่างไรต่อ?'>
    โดยปกติหมายความว่า UI สูญเสียการเชื่อมต่อ WebSocket ตรวจสอบ:

    1. Gateway กำลังทำงานอยู่หรือไม่? `openclaw gateway status`
    2. Gateway แข็งแรงหรือไม่? `openclaw status`
    3. UI มีโทเค็นที่ถูกต้องหรือไม่? `openclaw dashboard`
    4. หากใช้งานจากระยะไกล ลิงก์ tunnel/Tailscale พร้อมใช้งานหรือไม่?

    จากนั้นดูบันทึกแบบต่อเนื่อง:

    ```bash
    openclaw logs --follow
    ```

    เอกสาร: [แดชบอร์ด](/th/web/dashboard), [การเข้าถึงระยะไกล](/th/gateway/remote), [การแก้ไขปัญหา](/th/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands ล้มเหลว ควรตรวจสอบอะไร?">
    เริ่มจากบันทึกและสถานะช่องทาง:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    จากนั้นเทียบกับข้อผิดพลาด:

    - `BOT_COMMANDS_TOO_MUCH`: เมนู Telegram มีรายการมากเกินไป OpenClaw ตัดให้เหลือตามขีดจำกัดของ Telegram และลองใหม่ด้วยคำสั่งที่น้อยลงแล้ว แต่ยังต้องลบรายการเมนูบางรายการ ลดคำสั่ง Plugin/skill/custom หรือปิด `channels.telegram.commands.native` หากคุณไม่ต้องการเมนู.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` หรือข้อผิดพลาดเครือข่ายที่คล้ายกัน: หากคุณอยู่บน VPS หรืออยู่หลังพร็อกซี ให้ยืนยันว่าอนุญาต HTTPS ขาออกและ DNS ทำงานได้สำหรับ `api.telegram.org`.

    หาก Gateway อยู่ระยะไกล ตรวจสอบให้แน่ใจว่าคุณกำลังดูบันทึกบน Gateway host.

    เอกสาร: [Telegram](/th/channels/telegram), [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI ไม่แสดงเอาต์พุต ควรตรวจสอบอะไร?">
    ก่อนอื่นยืนยันว่า Gateway เข้าถึงได้และเอเจนต์ทำงานได้:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    ใน TUI ใช้ `/status` เพื่อดูสถานะปัจจุบัน หากคุณคาดว่าจะมีการตอบกลับในช่องทางแชต
    ตรวจสอบให้แน่ใจว่าเปิดการส่งข้อความแล้ว (`/deliver on`).

    เอกสาร: [TUI](/th/web/tui), [คำสั่ง Slash](/th/tools/slash-commands).

  </Accordion>

  <Accordion title="ฉันจะหยุดแล้วเริ่ม Gateway ใหม่อย่างสมบูรณ์ได้อย่างไร?">
    หากคุณติดตั้งบริการไว้:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    คำสั่งนี้หยุด/เริ่ม **บริการที่ถูกควบคุมดูแล** (launchd บน macOS, systemd บน Linux).
    ใช้เมื่อ Gateway ทำงานอยู่เบื้องหลังเป็น daemon.

    หากคุณกำลังรันใน foreground ให้หยุดด้วย Ctrl-C แล้วเรียกใช้:

    ```bash
    openclaw gateway run
    ```

    เอกสาร: [คู่มือปฏิบัติงานบริการ Gateway](/th/gateway).

  </Accordion>

  <Accordion title="อธิบายแบบง่าย: openclaw gateway restart เทียบกับ openclaw gateway">
    - `openclaw gateway restart`: รีสตาร์ต **บริการเบื้องหลัง** (launchd/systemd).
    - `openclaw gateway`: รัน gateway **ใน foreground** สำหรับเซสชันเทอร์มินัลนี้.

    หากคุณติดตั้งบริการไว้ ให้ใช้คำสั่ง gateway ใช้ `openclaw gateway` เมื่อ
    คุณต้องการรันครั้งเดียวใน foreground.

  </Accordion>

  <Accordion title="วิธีที่เร็วที่สุดในการดูรายละเอียดเพิ่มเมื่อมีบางอย่างล้มเหลว">
    เริ่ม Gateway ด้วย `--verbose` เพื่อดูรายละเอียดคอนโซลมากขึ้น จากนั้นตรวจสอบไฟล์บันทึกสำหรับการยืนยันตัวตนของช่องทาง การกำหนดเส้นทางโมเดล และข้อผิดพลาด RPC.
  </Accordion>
</AccordionGroup>

## สื่อและไฟล์แนบ

<AccordionGroup>
  <Accordion title="Skill ของฉันสร้างรูปภาพ/PDF แล้ว แต่ไม่ได้ส่งอะไรออกไป">
    ไฟล์แนบขาออกจากเอเจนต์ต้องมีบรรทัด `MEDIA:<path-or-url>` (อยู่ในบรรทัดของตัวเอง) ดู [การตั้งค่าผู้ช่วย OpenClaw](/th/start/openclaw) และ [การส่งของเอเจนต์](/th/tools/agent-send).

    การส่งด้วย CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    ตรวจสอบเพิ่มเติม:

    - ช่องทางเป้าหมายรองรับสื่อขาออกและไม่ถูกบล็อกโดย allowlist.
    - ไฟล์อยู่ภายในขีดจำกัดขนาดของผู้ให้บริการ (รูปภาพจะถูกปรับขนาดเป็นสูงสุด 2048px).
    - `tools.fs.workspaceOnly=true` จำกัดการส่งจากพาธภายในเครื่องให้อยู่เฉพาะ workspace, temp/media-store และไฟล์ที่ผ่านการตรวจสอบโดย sandbox.
    - `tools.fs.workspaceOnly=false` อนุญาตให้ `MEDIA:` ส่งไฟล์ host-local ที่เอเจนต์อ่านได้อยู่แล้ว แต่เฉพาะสื่อและชนิดเอกสารที่ปลอดภัย (รูปภาพ เสียง วิดีโอ PDF และเอกสาร Office) ไฟล์ข้อความธรรมดาและไฟล์ที่ดูเหมือนมีความลับยังคงถูกบล็อก.

    ดู [รูปภาพ](/th/nodes/images).

  </Accordion>
</AccordionGroup>

## ความปลอดภัยและการควบคุมการเข้าถึง

<AccordionGroup>
  <Accordion title="การเปิด OpenClaw ให้รับ DM ขาเข้าปลอดภัยหรือไม่?">
    ให้ถือว่า DM ขาเข้าเป็นอินพุตที่ไม่น่าเชื่อถือ ค่าเริ่มต้นถูกออกแบบมาเพื่อลดความเสี่ยง:

    - พฤติกรรมเริ่มต้นบนช่องทางที่รองรับ DM คือ **การจับคู่**:
      - ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่; บอทจะไม่ประมวลผลข้อความของพวกเขา.
      - อนุมัติด้วย: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - คำขอที่รอดำเนินการถูกจำกัดไว้ที่ **3 ต่อช่องทาง**; ตรวจสอบ `openclaw pairing list --channel <channel> [--account <id>]` หากรหัสไม่มาถึง.
    - การเปิด DM แบบสาธารณะต้องเลือกเปิดอย่างชัดเจน (`dmPolicy: "open"` และ allowlist `"*"`).

    รัน `openclaw doctor` เพื่อแสดงนโยบาย DM ที่มีความเสี่ยง.

  </Accordion>

  <Accordion title="prompt injection เป็นความเสี่ยงเฉพาะบอทสาธารณะหรือไม่?">
    ไม่ใช่ prompt injection เกี่ยวข้องกับ **เนื้อหาที่ไม่น่าเชื่อถือ** ไม่ใช่แค่ว่าใครสามารถ DM บอทได้.
    หากผู้ช่วยของคุณอ่านเนื้อหาภายนอก (การค้นหา/ดึงข้อมูลเว็บ, หน้าเบราว์เซอร์, อีเมล,
    เอกสาร, ไฟล์แนบ, บันทึกที่วางไว้) เนื้อหานั้นอาจมีคำสั่งที่พยายาม
    ยึดการควบคุมโมเดล สิ่งนี้เกิดขึ้นได้แม้ว่า **คุณจะเป็นผู้ส่งเพียงคนเดียว**.

    ความเสี่ยงใหญ่ที่สุดคือเมื่อเปิดใช้เครื่องมือ: โมเดลอาจถูกหลอกให้
    ส่งออกบริบทหรือเรียกใช้เครื่องมือแทนคุณ ลดขอบเขตผลกระทบโดย:

    - ใช้เอเจนต์ "ผู้อ่าน" แบบอ่านอย่างเดียวหรือปิดเครื่องมือเพื่อสรุปเนื้อหาที่ไม่น่าเชื่อถือ
    - ปิด `web_search` / `web_fetch` / `browser` สำหรับเอเจนต์ที่เปิดใช้เครื่องมือ
    - ถือว่าข้อความจากไฟล์/เอกสารที่ถอดรหัสแล้วไม่น่าเชื่อถือเช่นกัน: OpenResponses
      `input_file` และการดึงข้อมูลจาก media-attachment ต่างห่อข้อความที่ดึงออกมาใน
      เครื่องหมายขอบเขตเนื้อหาภายนอกอย่างชัดเจน แทนที่จะส่งข้อความไฟล์ดิบ
    - ใช้ sandbox และ allowlist เครื่องมืออย่างเข้มงวด

    รายละเอียด: [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="บอทของฉันควรมีอีเมล บัญชี GitHub หรือหมายเลขโทรศัพท์ของตัวเองหรือไม่?">
    ควร สำหรับการตั้งค่าส่วนใหญ่ การแยกบอทด้วยบัญชีและหมายเลขโทรศัพท์แยกต่างหาก
    ลดขอบเขตผลกระทบหากมีบางอย่างผิดพลาด นอกจากนี้ยังทำให้หมุนเวียน
    ข้อมูลประจำตัวหรือเพิกถอนการเข้าถึงได้ง่ายขึ้นโดยไม่กระทบบัญชีส่วนตัวของคุณ.

    เริ่มจากขนาดเล็ก ให้สิทธิ์เข้าถึงเฉพาะเครื่องมือและบัญชีที่คุณต้องการจริง ๆ แล้วค่อยขยาย
    ภายหลังหากจำเป็น.

    เอกสาร: [ความปลอดภัย](/th/gateway/security), [การจับคู่](/th/channels/pairing).

  </Accordion>

  <Accordion title="ฉันสามารถให้มันมีอิสระจัดการข้อความของฉันได้หรือไม่ และปลอดภัยหรือเปล่า?">
    เรา **ไม่** แนะนำให้อิสระเต็มรูปแบบเหนือข้อความส่วนตัวของคุณ รูปแบบที่ปลอดภัยที่สุดคือ:

    - เก็บ DM ไว้ใน **โหมดจับคู่** หรือ allowlist ที่เข้มงวด.
    - ใช้ **หมายเลขหรือบัญชีแยกต่างหาก** หากคุณต้องการให้มันส่งข้อความแทนคุณ.
    - ให้มันร่างข้อความ แล้ว **อนุมัติก่อนส่ง**.

    หากคุณต้องการทดลอง ให้ทำบนบัญชีเฉพาะและแยกออกจากกัน ดู
    [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="ฉันสามารถใช้โมเดลที่ถูกกว่าสำหรับงานผู้ช่วยส่วนตัวได้หรือไม่?">
    ได้ **หาก** เอเจนต์เป็นแบบแชตอย่างเดียวและอินพุตน่าเชื่อถือ เทียร์ที่เล็กกว่า
    ไวต่อการถูกยึดคำสั่งมากกว่า ดังนั้นหลีกเลี่ยงการใช้กับเอเจนต์ที่เปิดใช้เครื่องมือ
    หรือเมื่ออ่านข้อความที่ไม่น่าเชื่อถือ หากจำเป็นต้องใช้โมเดลที่เล็กกว่า ให้ล็อก
    เครื่องมือและรันภายใน sandbox ดู [ความปลอดภัย](/th/gateway/security).
  </Accordion>

  <Accordion title="ฉันรัน /start ใน Telegram แต่ไม่ได้รับรหัสจับคู่">
    รหัสจับคู่จะถูกส่ง **เฉพาะ** เมื่อผู้ส่งที่ไม่รู้จักส่งข้อความหาบอทและ
    เปิดใช้ `dmPolicy: "pairing"` แล้ว `/start` เพียงอย่างเดียวไม่สร้างรหัส.

    ตรวจสอบคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list telegram
    ```

    หากคุณต้องการเข้าถึงทันที ให้เพิ่ม sender id ของคุณใน allowlist หรือตั้ง `dmPolicy: "open"`
    สำหรับบัญชีนั้น.

  </Accordion>

  <Accordion title="WhatsApp: มันจะส่งข้อความหาผู้ติดต่อของฉันหรือไม่? การจับคู่ทำงานอย่างไร?">
    ไม่ นโยบาย DM เริ่มต้นของ WhatsApp คือ **การจับคู่** ผู้ส่งที่ไม่รู้จักจะได้รับเพียงรหัสจับคู่และข้อความของพวกเขา **จะไม่ถูกประมวลผล** OpenClaw ตอบกลับเฉพาะแชตที่ได้รับหรือการส่งอย่างชัดเจนที่คุณเรียกใช้.

    อนุมัติการจับคู่ด้วย:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    แสดงรายการคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list whatsapp
    ```

    พรอมป์หมายเลขโทรศัพท์ของวิซาร์ด: ใช้เพื่อตั้งค่า **allowlist/owner** ของคุณ เพื่อให้ DM ของคุณเองได้รับอนุญาต ไม่ได้ใช้สำหรับการส่งอัตโนมัติ หากคุณรันบนหมายเลข WhatsApp ส่วนตัวของคุณ ให้ใช้หมายเลขนั้นและเปิดใช้ `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## คำสั่งแชต การยกเลิกงาน และ "มันไม่ยอมหยุด"

<AccordionGroup>
  <Accordion title="ฉันจะหยุดไม่ให้ข้อความระบบภายในแสดงในแชตได้อย่างไร?">
    ข้อความภายในหรือข้อความเครื่องมือส่วนใหญ่จะปรากฏเฉพาะเมื่อเปิดใช้ **verbose**, **trace** หรือ **reasoning**
    สำหรับเซสชันนั้น.

    แก้ไขในแชตที่คุณเห็น:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    หากยังมีเสียงรบกวน ให้ตรวจสอบการตั้งค่าเซสชันใน UI ควบคุมและตั้ง verbose
    เป็น **สืบทอด** นอกจากนี้ให้ยืนยันว่าคุณไม่ได้ใช้โปรไฟล์บอทที่ตั้งค่า `verboseDefault`
    เป็น `on` ในการกำหนดค่า.

    เอกสาร: [การคิดและ verbose](/th/tools/thinking), [ความปลอดภัย](/th/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="ฉันจะหยุด/ยกเลิกงานที่กำลังรันได้อย่างไร?">
    ส่งข้อความใดก็ได้ต่อไปนี้ **เป็นข้อความเดี่ยว** (ไม่มี slash):

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

    รายการเหล่านี้เป็นตัวกระตุ้นการยกเลิก (ไม่ใช่คำสั่ง slash).

    สำหรับกระบวนการเบื้องหลัง (จากเครื่องมือ exec) คุณสามารถขอให้เอเจนต์รัน:

    ```
    process action:kill sessionId:XXX
    ```

    ภาพรวมคำสั่ง Slash: ดู [คำสั่ง Slash](/th/tools/slash-commands).

    คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความ **เดี่ยว** ที่ขึ้นต้นด้วย `/` แต่ทางลัดบางรายการ (เช่น `/status`) ใช้งานแบบ inline ได้เช่นกันสำหรับผู้ส่งที่อยู่ใน allowlist.

  </Accordion>

  <Accordion title='ฉันจะส่งข้อความ Discord จาก Telegram ได้อย่างไร? ("ปฏิเสธการส่งข้อความข้ามบริบท")'>
    OpenClaw บล็อกการส่งข้อความ **ข้ามผู้ให้บริการ** ตามค่าเริ่มต้น หากการเรียกเครื่องมือผูกกับ
    Telegram มันจะไม่ส่งไปยัง Discord เว้นแต่คุณจะอนุญาตอย่างชัดเจน.

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

    รีสตาร์ต gateway หลังจากแก้ไขการกำหนดค่า.

  </Accordion>

  <Accordion title='ทำไมรู้สึกเหมือนบอท "เมิน" ข้อความที่ส่งถี่ ๆ?'>
    โหมดคิวควบคุมว่าข้อความใหม่โต้ตอบกับการรันที่กำลังดำเนินอยู่ได้อย่างไร ใช้ `/queue` เพื่อเปลี่ยนโหมด:

    - `steer` - จัดคิวการชี้นำที่รอดำเนินการทั้งหมดสำหรับขอบเขตโมเดลถัดไปในการรันปัจจุบัน
    - `queue` - การชี้นำทีละรายการแบบเดิม
    - `followup` - รันข้อความทีละรายการ
    - `collect` - รวมข้อความเป็นชุดแล้วตอบครั้งเดียว
    - `steer-backlog` - ชี้นำทันที แล้วประมวลผล backlog
    - `interrupt` - ยกเลิกการรันปัจจุบันและเริ่มใหม่

    โหมดเริ่มต้นคือ `steer` คุณสามารถเพิ่มตัวเลือกอย่าง `debounce:0.5s cap:25 drop:summarize` สำหรับโหมดติดตามผลได้ ดู [คิวคำสั่ง](/th/concepts/queue) และ [คิวการกำกับ](/th/concepts/queue-steering)

  </Accordion>
</AccordionGroup>

## เบ็ดเตล็ด

<AccordionGroup>
  <Accordion title='โมเดลเริ่มต้นสำหรับ Anthropic เมื่อใช้คีย์ API คืออะไร'>
    ใน OpenClaw ข้อมูลรับรองและการเลือกโมเดลแยกจากกัน การตั้งค่า `ANTHROPIC_API_KEY` (หรือการจัดเก็บคีย์ API ของ Anthropic ในโปรไฟล์การยืนยันตัวตน) จะเปิดใช้การยืนยันตัวตน แต่โมเดลเริ่มต้นจริงคือสิ่งที่คุณกำหนดค่าไว้ใน `agents.defaults.model.primary` (เช่น `anthropic/claude-sonnet-4-6` หรือ `anthropic/claude-opus-4-6`) หากคุณเห็น `No credentials found for profile "anthropic:default"` หมายความว่า Gateway ไม่พบข้อมูลรับรองของ Anthropic ใน `auth-profiles.json` ที่คาดไว้สำหรับเอเจนต์ที่กำลังทำงานอยู่
  </Accordion>
</AccordionGroup>

---

ยังติดขัดอยู่หรือไม่ ถามใน [Discord](https://discord.com/invite/clawd) หรือเปิด [การสนทนาบน GitHub](https://github.com/openclaw/openclaw/discussions)

## ที่เกี่ยวข้อง

- [คำถามที่พบบ่อยสำหรับการใช้งานครั้งแรก](/th/help/faq-first-run) — การติดตั้ง การเริ่มต้นใช้งาน การยืนยันตัวตน การสมัครสมาชิก ความล้มเหลวช่วงแรก
- [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models) — การเลือกโมเดล การสลับเมื่อเกิดข้อผิดพลาด โปรไฟล์การยืนยันตัวตน
- [การแก้ไขปัญหา](/th/help/troubleshooting) — การคัดแยกปัญหาโดยเริ่มจากอาการ
