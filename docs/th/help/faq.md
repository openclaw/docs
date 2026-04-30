---
read_when:
    - ตอบคำถามขอความช่วยเหลือทั่วไปเกี่ยวกับการตั้งค่า การติดตั้ง การเริ่มต้นใช้งาน หรือรันไทม์
    - คัดแยกปัญหาที่ผู้ใช้รายงานก่อนการดีบักเชิงลึก
summary: คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า การกำหนดค่า และการใช้งาน OpenClaw
title: คำถามที่พบบ่อย
x-i18n:
    generated_at: "2026-04-30T09:57:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: c09be6571e048b71e4e02288b22b51e70102872675dfc7bef133b955a06f6ac9
    source_path: help/faq.md
    workflow: 16
---

คำตอบสั้นพร้อมการแก้ปัญหาเชิงลึกสำหรับการตั้งค่าใช้งานจริง (การพัฒนาในเครื่อง, VPS, หลายเอเจนต์, OAuth/API keys, การสลับโมเดลเมื่อมีปัญหา) สำหรับการวินิจฉัยขณะรันไทม์ ดู [การแก้ปัญหา](/th/gateway/troubleshooting) สำหรับเอกสารอ้างอิงการกำหนดค่าฉบับเต็ม ดู [การกำหนดค่า](/th/gateway/configuration)

## 60 วินาทีแรกเมื่อมีบางอย่างเสีย

1. **สถานะด่วน (ตรวจสอบก่อน)**

   ```bash
   openclaw status
   ```

   สรุปในเครื่องอย่างรวดเร็ว: OS + การอัปเดต, การเข้าถึง gateway/service, agents/sessions, การกำหนดค่า provider + ปัญหารันไทม์ (เมื่อ gateway เข้าถึงได้)

2. **รายงานที่วางได้ทันที (แชร์ได้อย่างปลอดภัย)**

   ```bash
   openclaw status --all
   ```

   การวินิจฉัยแบบอ่านอย่างเดียวพร้อม log tail (ปกปิด tokens แล้ว)

3. **สถานะ Daemon + port**

   ```bash
   openclaw gateway status
   ```

   แสดงรันไทม์ของ supervisor เทียบกับการเข้าถึง RPC, URL เป้าหมายสำหรับ probe และการกำหนดค่าที่ service น่าจะใช้

4. **Probe เชิงลึก**

   ```bash
   openclaw status --deep
   ```

   รัน probe สุขภาพของ gateway แบบสด รวมถึง channel probes เมื่อรองรับ
   (ต้องมี gateway ที่เข้าถึงได้) ดู [สุขภาพ](/th/gateway/health)

5. **ติดตาม log ล่าสุด**

   ```bash
   openclaw logs --follow
   ```

   หาก RPC ล่ม ให้ fallback เป็น:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   File logs แยกจาก service logs; ดู [การบันทึก log](/th/logging) และ [การแก้ปัญหา](/th/gateway/troubleshooting)

6. **รัน doctor (การซ่อมแซม)**

   ```bash
   openclaw doctor
   ```

   ซ่อมแซม/ย้าย config/state + รัน health checks ดู [Doctor](/th/gateway/doctor)

7. **Snapshot ของ Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # แสดง URL เป้าหมาย + path ของ config เมื่อเกิดข้อผิดพลาด
   ```

   ขอ snapshot แบบเต็มจาก gateway ที่กำลังรันอยู่ (เฉพาะ WS) ดู [สุขภาพ](/th/gateway/health)

## เริ่มต้นอย่างรวดเร็วและตั้งค่าครั้งแรก

คำถาม-คำตอบสำหรับการใช้งานครั้งแรก — การติดตั้ง, onboarding, เส้นทาง auth, subscriptions, ความล้มเหลวเบื้องต้น —
อยู่ใน [FAQ สำหรับการใช้งานครั้งแรก](/th/help/faq-first-run)

## OpenClaw คืออะไร?

<AccordionGroup>
  <Accordion title="OpenClaw คืออะไรในหนึ่งย่อหน้า?">
    OpenClaw คือผู้ช่วย AI ส่วนตัวที่คุณรันบนอุปกรณ์ของคุณเอง มันตอบกลับบนพื้นผิวการส่งข้อความที่คุณใช้อยู่แล้ว (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat และ Plugin ช่องทางที่ bundled มา เช่น QQ Bot) และยังทำงานด้วยเสียง + Canvas แบบสดบนแพลตฟอร์มที่รองรับได้ด้วย **Gateway** คือ control plane ที่เปิดทำงานตลอดเวลา ส่วนผู้ช่วยคือผลิตภัณฑ์
  </Accordion>

  <Accordion title="คุณค่าที่ได้รับ">
    OpenClaw ไม่ใช่ "แค่ wrapper ของ Claude" แต่มันคือ **control plane แบบ local-first** ที่ให้คุณรัน
    ผู้ช่วยที่มีความสามารถบน **ฮาร์ดแวร์ของคุณเอง** เข้าถึงได้จากแอปแชตที่คุณใช้อยู่แล้ว พร้อม
    sessions ที่มีสถานะ, memory และเครื่องมือ โดยไม่ต้องยกการควบคุม workflows ของคุณให้กับ
    SaaS ที่โฮสต์ไว้

    จุดเด่น:

    - **อุปกรณ์ของคุณ ข้อมูลของคุณ:** รัน Gateway ได้ทุกที่ที่คุณต้องการ (Mac, Linux, VPS) และเก็บ
      workspace + ประวัติ session ไว้ในเครื่อง
    - **ช่องทางจริง ไม่ใช่ sandbox บนเว็บ:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      รวมถึงเสียงบนมือถือและ Canvas บนแพลตฟอร์มที่รองรับ
    - **ไม่ผูกกับโมเดลใดโมเดลหนึ่ง:** ใช้ Anthropic, OpenAI, MiniMax, OpenRouter ฯลฯ พร้อมการกำหนดเส้นทาง
      และ failover ต่อ agent
    - **ตัวเลือกเฉพาะเครื่อง:** รันโมเดลในเครื่องเพื่อให้ **ข้อมูลทั้งหมดอยู่บนอุปกรณ์ของคุณได้** หากคุณต้องการ
    - **การกำหนดเส้นทางหลายเอเจนต์:** แยก agents ตามช่องทาง, account หรือ task โดยแต่ละตัวมี
      workspace และค่าเริ่มต้นของตัวเอง
    - **โอเพนซอร์สและปรับแต่งได้:** ตรวจสอบ, ขยาย และ self-host ได้โดยไม่ถูกล็อกกับ vendor

    เอกสาร: [Gateway](/th/gateway), [ช่องทาง](/th/channels), [หลายเอเจนต์](/th/concepts/multi-agent),
    [Memory](/th/concepts/memory)

  </Accordion>

  <Accordion title="ฉันเพิ่งตั้งค่าเสร็จ - ควรทำอะไรก่อน?">
    โปรเจกต์แรกที่เหมาะ:

    - สร้างเว็บไซต์ (WordPress, Shopify หรือ static site แบบง่าย)
    - ทำ prototype แอปมือถือ (outline, screens, API plan)
    - จัดระเบียบไฟล์และโฟลเดอร์ (cleanup, naming, tagging)
    - เชื่อมต่อ Gmail และทำสรุปหรือ follow ups อัตโนมัติ

    มันจัดการงานขนาดใหญ่ได้ แต่จะทำงานได้ดีที่สุดเมื่อคุณแบ่งงานเป็น phases และ
    ใช้ sub agents สำหรับงานขนาน

  </Accordion>

  <Accordion title="กรณีใช้งานประจำวัน 5 อันดับแรกของ OpenClaw คืออะไร?">
    ประโยชน์ในชีวิตประจำวันมักมีลักษณะดังนี้:

    - **สรุปส่วนตัว:** สรุป inbox, calendar และข่าวที่คุณสนใจ
    - **การค้นคว้าและร่างเนื้อหา:** ค้นคว้าอย่างรวดเร็ว, สรุป และร่างฉบับแรกสำหรับ emails หรือ docs
    - **การเตือนความจำและ follow ups:** nudges และ checklists ที่ขับเคลื่อนด้วย cron หรือ heartbeat
    - **การทำงานอัตโนมัติบนเบราว์เซอร์:** กรอก forms, รวบรวมข้อมูล และทำงานเว็บซ้ำ ๆ
    - **การประสานงานข้ามอุปกรณ์:** ส่ง task จากโทรศัพท์ของคุณ ให้ Gateway รันบน server แล้วรับผลลัพธ์กลับมาใน chat

  </Accordion>

  <Accordion title="OpenClaw ช่วยเรื่อง lead gen, outreach, ads และ blogs สำหรับ SaaS ได้ไหม?">
    ได้สำหรับ **การค้นคว้า, qualification และการร่าง** มันสามารถ scan sites, สร้าง shortlists,
    สรุป prospects และเขียนร่าง outreach หรือ ad copy ได้

    สำหรับ **การทำ outreach หรือ ad runs** ให้มีมนุษย์อยู่ในกระบวนการเสมอ หลีกเลี่ยง spam, ปฏิบัติตามกฎหมายท้องถิ่นและ
    policies ของ platform และตรวจทานทุกอย่างก่อนส่ง รูปแบบที่ปลอดภัยที่สุดคือให้
    OpenClaw ร่าง แล้วคุณอนุมัติ

    เอกสาร: [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="ข้อได้เปรียบเมื่อเทียบกับ Claude Code สำหรับการพัฒนาเว็บคืออะไร?">
    OpenClaw คือ **ผู้ช่วยส่วนตัว** และ coordination layer ไม่ใช่สิ่งทดแทน IDE ใช้
    Claude Code หรือ Codex สำหรับ loop การเขียนโค้ดโดยตรงที่เร็วที่สุดภายใน repo ใช้ OpenClaw เมื่อคุณ
    ต้องการ memory ที่คงอยู่, การเข้าถึงข้ามอุปกรณ์ และการประสานเครื่องมือ

    ข้อได้เปรียบ:

    - **Persistent memory + workspace** ข้าม sessions
    - **การเข้าถึงหลายแพลตฟอร์ม** (WhatsApp, Telegram, TUI, WebChat)
    - **การประสานเครื่องมือ** (browser, files, scheduling, hooks)
    - **Gateway ที่เปิดทำงานตลอดเวลา** (รันบน VPS, โต้ตอบจากที่ไหนก็ได้)
    - **Nodes** สำหรับ local browser/screen/camera/exec

    ตัวอย่างผลงาน: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills และ automation

<AccordionGroup>
  <Accordion title="ฉันจะปรับแต่ง skills โดยไม่ทำให้ repo dirty ได้อย่างไร?">
    ใช้ managed overrides แทนการแก้ไขสำเนาใน repo ใส่การเปลี่ยนแปลงของคุณไว้ใน `~/.openclaw/skills/<name>/SKILL.md` (หรือเพิ่มโฟลเดอร์ผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json`) ลำดับความสำคัญคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` ดังนั้น managed overrides ยังชนะ bundled skills โดยไม่แตะ git หากคุณต้องการติดตั้ง skill แบบ global แต่ให้เห็นได้เฉพาะบาง agents ให้เก็บสำเนาที่แชร์ไว้ใน `~/.openclaw/skills` และควบคุม visibility ด้วย `agents.defaults.skills` และ `agents.list[].skills` เฉพาะการแก้ไขที่ควรส่ง upstream เท่านั้นที่ควรอยู่ใน repo และส่งออกเป็น PRs
  </Accordion>

  <Accordion title="ฉันโหลด skills จากโฟลเดอร์กำหนดเองได้ไหม?">
    ได้ เพิ่ม directories เพิ่มเติมผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json` (ลำดับความสำคัญต่ำสุด) ลำดับความสำคัญเริ่มต้นคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` `clawhub` ติดตั้งลงใน `./skills` ตามค่าเริ่มต้น ซึ่ง OpenClaw ถือว่าเป็น `<workspace>/skills` ใน session ถัดไป หาก skill ควรเห็นได้เฉพาะบาง agents ให้จับคู่กับ `agents.defaults.skills` หรือ `agents.list[].skills`
  </Accordion>

  <Accordion title="ฉันจะใช้โมเดลต่างกันสำหรับงานต่างกันได้อย่างไร?">
    รูปแบบที่รองรับในปัจจุบันคือ:

    - **Cron jobs**: jobs ที่แยกกันสามารถตั้งค่า override `model` ต่อ job ได้
    - **Sub-agents**: กำหนดเส้นทาง tasks ไปยัง agents แยกต่างหากที่มี default models ต่างกัน
    - **สลับตามต้องการ**: ใช้ `/model` เพื่อสลับโมเดลของ session ปัจจุบันได้ทุกเมื่อ

    ดู [Cron jobs](/th/automation/cron-jobs), [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent) และ [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="บอตค้างขณะทำงานหนัก ฉันจะ offload งานนั้นได้อย่างไร?">
    ใช้ **sub-agents** สำหรับงานที่ยาวหรือทำขนาน Sub-agents จะรันใน session ของตัวเอง,
    ส่งคืนสรุป และทำให้ chat หลักของคุณยังตอบสนองได้

    ขอให้บอตของคุณ "spawn a sub-agent for this task" หรือใช้ `/subagents`
    ใช้ `/status` ใน chat เพื่อดูว่า Gateway กำลังทำอะไรอยู่ตอนนี้ (และกำลัง busy หรือไม่)

    เคล็ดลับเรื่อง tokens: งานยาวและ sub-agents ต่างก็ใช้ tokens หากกังวลเรื่องต้นทุน ให้ตั้งค่า
    โมเดลที่ถูกกว่าสำหรับ sub-agents ผ่าน `agents.defaults.subagents.model`

    เอกสาร: [Sub-agents](/th/tools/subagents), [งานเบื้องหลัง](/th/automation/tasks)

  </Accordion>

  <Accordion title="sessions ของ subagent ที่ผูกกับ thread ทำงานอย่างไรบน Discord?">
    ใช้ thread bindings คุณสามารถ bind Discord thread กับ subagent หรือ session target เพื่อให้ messages ที่ตามมาใน thread นั้นยังอยู่ใน bound session นั้น

    Flow พื้นฐาน:

    - Spawn ด้วย `sessions_spawn` โดยใช้ `thread: true` (และเลือกใช้ `mode: "session"` สำหรับ follow-up ที่คงอยู่)
    - หรือ bind ด้วยตนเองด้วย `/focus <target>`
    - ใช้ `/agents` เพื่อตรวจสอบสถานะ binding
    - ใช้ `/session idle <duration|off>` และ `/session max-age <duration|off>` เพื่อควบคุม auto-unfocus
    - ใช้ `/unfocus` เพื่อ detach thread

    Config ที่จำเป็น:

    - ค่าเริ่มต้น global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
    - Overrides สำหรับ Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`
    - Auto-bind เมื่อ spawn: ตั้งค่า `channels.discord.threadBindings.spawnSubagentSessions: true`

    เอกสาร: [Sub-agents](/th/tools/subagents), [Discord](/th/channels/discord), [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference), [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="subagent ทำงานเสร็จแล้ว แต่ completion update ไปผิดที่หรือไม่เคยถูกโพสต์ ควรตรวจอะไร?">
    ตรวจ resolved requester route ก่อน:

    - การส่ง subagent แบบ completion-mode จะเลือก bound thread หรือ conversation route หากมีอยู่
    - หาก completion origin มีเฉพาะ channel, OpenClaw จะ fallback ไปยัง stored route ของ requester session (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้การส่งโดยตรงยังสำเร็จได้
    - หากไม่มีทั้ง bound route และ stored route ที่ใช้ได้ การส่งโดยตรงอาจล้มเหลวและผลลัพธ์จะ fallback เป็น queued session delivery แทนการโพสต์ไปยัง chat ทันที
    - Targets ที่ invalid หรือ stale ยังสามารถบังคับให้ queue fallback หรือทำให้ final delivery ล้มเหลวได้
    - หาก assistant reply ล่าสุดที่มองเห็นได้ของ child เป็น silent token ตรงตัว `NO_REPLY` / `no_reply` หรือเป็น `ANNOUNCE_SKIP` ตรงตัว OpenClaw จะ suppress announce โดยตั้งใจแทนการโพสต์ progress เก่าที่ stale
    - หาก child หมดเวลาหลังจากมีเพียง tool calls, announce อาจยุบสิ่งนั้นเป็นสรุป partial-progress สั้น ๆ แทนการ replay raw tool output

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [Sub-agents](/th/tools/subagents), [งานเบื้องหลัง](/th/automation/tasks), [Session Tools](/th/concepts/session-tool)

  </Accordion>

  <Accordion title="Cron หรือ reminders ไม่ทำงาน ควรตรวจอะไร?">
    Cron รันภายใน process ของ Gateway หาก Gateway ไม่ได้รันอย่างต่อเนื่อง,
    scheduled jobs จะไม่ทำงาน

    Checklist:

    - ยืนยันว่า cron เปิดใช้งานอยู่ (`cron.enabled`) และไม่ได้ตั้งค่า `OPENCLAW_SKIP_CRON`
    - ตรวจสอบว่า Gateway รันตลอด 24/7 (ไม่มี sleep/restarts)
    - ตรวจสอบ timezone settings สำหรับ job (`--tz` เทียบกับ timezone ของ host)

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    เอกสาร: [Cron jobs](/th/automation/cron-jobs), [Automation และ Tasks](/th/automation)

  </Accordion>

  <Accordion title="Cron ทำงานแล้ว แต่ไม่มีอะไรถูกส่งไปยังช่อง เพราะอะไร?">
    ตรวจสอบโหมดการส่งก่อน:

    - `--no-deliver` / `delivery.mode: "none"` หมายความว่าไม่ควรมีการส่งสำรองจาก runner
    - เป้าหมายประกาศหายไปหรือไม่ถูกต้อง (`channel` / `to`) หมายความว่า runner ข้ามการส่งออก
    - การยืนยันตัวตนของช่องล้มเหลว (`unauthorized`, `Forbidden`) หมายความว่า runner พยายามส่งแล้ว แต่ข้อมูลรับรองบล็อกไว้
    - ผลลัพธ์แบบแยกที่เงียบ (`NO_REPLY` / `no_reply` เท่านั้น) จะถูกถือว่าตั้งใจให้ส่งไม่ได้ ดังนั้น runner จะระงับการส่งสำรองที่เข้าคิวไว้ด้วย

    สำหรับงาน Cron แบบแยก agent ยังสามารถส่งโดยตรงด้วยเครื่องมือ `message`
    เมื่อมีเส้นทางแชตพร้อมใช้งาน `--announce` ควบคุมเฉพาะเส้นทางสำรองของ runner
    สำหรับข้อความสุดท้ายที่ agent ยังไม่ได้ส่งเอง

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [งานเบื้องหลัง](/th/automation/tasks).

  </Accordion>

  <Accordion title="ทำไมการรัน Cron แบบแยกจึงสลับโมเดลหรือลองใหม่หนึ่งครั้ง?">
    โดยปกติแล้วนั่นคือเส้นทางการสลับโมเดลแบบสด ไม่ใช่การกำหนดเวลาแบบซ้ำซ้อน

    Cron แบบแยกสามารถบันทึกการส่งต่อโมเดลในรันไทม์และลองใหม่ได้เมื่อการรันที่ใช้งานอยู่
    โยน `LiveSessionModelSwitchError` การลองใหม่จะคง provider/model ที่สลับไว้
    และหากการสลับมีการแทนที่โปรไฟล์การยืนยันตัวตนใหม่ Cron
    จะบันทึกค่านั้นด้วยก่อนลองใหม่

    กฎการเลือกที่เกี่ยวข้อง:

    - การแทนที่โมเดลของ Gmail hook ชนะก่อนเมื่อใช้ได้
    - จากนั้น `model` ต่อแต่ละงาน
    - จากนั้นการแทนที่โมเดลของเซสชัน Cron ที่บันทึกไว้
    - จากนั้นการเลือกโมเดล agent/default ตามปกติ

    ลูปการลองใหม่มีขอบเขต หลังจากความพยายามครั้งแรกบวกการลองใหม่จากการสลับอีก 2 ครั้ง
    Cron จะยกเลิกแทนที่จะวนลูปตลอดไป

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

    `openclaw skills install` แบบเนทีฟจะเขียนลงในไดเรกทอรี `skills/`
    ของ workspace ที่ใช้งานอยู่ ติดตั้ง CLI `clawhub` แยกต่างหากเฉพาะเมื่อคุณต้องการเผยแพร่หรือ
    ซิงก์ Skills ของคุณเอง สำหรับการติดตั้งที่ใช้ร่วมกันข้าม agents ให้วาง skill ไว้ใต้
    `~/.openclaw/skills` และใช้ `agents.defaults.skills` หรือ
    `agents.list[].skills` หากคุณต้องการจำกัดว่า agents ใดมองเห็นได้

  </Accordion>

  <Accordion title="OpenClaw สามารถรันงานตามกำหนดเวลาหรือทำงานต่อเนื่องในเบื้องหลังได้ไหม?">
    ได้ ใช้ตัวกำหนดเวลาของ Gateway:

    - **งาน Cron** สำหรับงานตามกำหนดเวลาหรืองานที่เกิดซ้ำ (คงอยู่หลังรีสตาร์ท)
    - **Heartbeat** สำหรับการตรวจสอบเป็นระยะของ "เซสชันหลัก"
    - **งานแบบแยก** สำหรับ agents อัตโนมัติที่โพสต์สรุปหรือส่งไปยังแชต

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [ระบบอัตโนมัติและงาน](/th/automation),
    [Heartbeat](/th/gateway/heartbeat).

  </Accordion>

  <Accordion title="ฉันสามารถรัน Skills ที่ใช้ได้เฉพาะ Apple macOS จาก Linux ได้ไหม?">
    ทำโดยตรงไม่ได้ Skills ของ macOS ถูกควบคุมด้วย `metadata.openclaw.os` พร้อมไบนารีที่จำเป็น และ Skills จะปรากฏใน system prompt เฉพาะเมื่อมีสิทธิ์ใช้งานบน **Gateway host** เท่านั้น บน Linux Skills ที่ใช้ได้เฉพาะ `darwin` (เช่น `apple-notes`, `apple-reminders`, `things-mac`) จะไม่โหลดเว้นแต่คุณจะแทนที่การควบคุมนั้น

    คุณมีรูปแบบที่รองรับสามแบบ:

    **ตัวเลือก A - รัน Gateway บน Mac (ง่ายที่สุด).**
    รัน Gateway ในที่ที่มีไบนารีของ macOS แล้วเชื่อมต่อจาก Linux ใน [โหมดระยะไกล](#gateway-ports-already-running-and-remote-mode) หรือผ่าน Tailscale Skills จะโหลดตามปกติเพราะ Gateway host เป็น macOS

    **ตัวเลือก B - ใช้ Node macOS (ไม่มี SSH).**
    รัน Gateway บน Linux จับคู่ Node macOS (แอป menubar) และตั้งค่า **Node Run Commands** เป็น "Always Ask" หรือ "Always Allow" บน Mac OpenClaw สามารถถือว่า Skills ที่ใช้ได้เฉพาะ macOS มีสิทธิ์ใช้งานเมื่อมีไบนารีที่จำเป็นอยู่บน Node agent จะรัน Skills เหล่านั้นผ่านเครื่องมือ `nodes` หากคุณเลือก "Always Ask" การอนุมัติ "Always Allow" ใน prompt จะเพิ่มคำสั่งนั้นลงใน allowlist

    **ตัวเลือก C - พร็อกซีไบนารีของ macOS ผ่าน SSH (ขั้นสูง).**
    คง Gateway ไว้บน Linux แต่ทำให้ไบนารี CLI ที่จำเป็น resolve ไปยัง SSH wrappers ที่รันบน Mac จากนั้นแทนที่ skill เพื่ออนุญาต Linux เพื่อให้ยังมีสิทธิ์ใช้งาน

    1. สร้าง SSH wrapper สำหรับไบนารี (ตัวอย่าง: `memo` สำหรับ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. วาง wrapper ไว้บน `PATH` บน host Linux (เช่น `~/bin/memo`).
    3. แทนที่ metadata ของ skill (workspace หรือ `~/.openclaw/skills`) เพื่ออนุญาต Linux:

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

    - **Skill / Plugin แบบกำหนดเอง:** ดีที่สุดสำหรับการเข้าถึง API ที่เชื่อถือได้ (Notion/HeyGen ต่างก็มี API)
    - **ระบบอัตโนมัติผ่านเบราว์เซอร์:** ใช้งานได้โดยไม่ต้องเขียนโค้ด แต่ช้ากว่าและเปราะบางกว่า

    หากคุณต้องการเก็บบริบทต่อไคลเอนต์ (เวิร์กโฟลว์ของเอเจนซี) รูปแบบง่ายๆ คือ:

    - หนึ่งหน้า Notion ต่อหนึ่งไคลเอนต์ (บริบท + การตั้งค่า + งานที่กำลังทำ)
    - ขอให้ agent ดึงหน้านั้นเมื่อเริ่มเซสชัน

    หากคุณต้องการการผสานรวมแบบเนทีฟ ให้เปิดคำขอฟีเจอร์หรือสร้าง skill
    ที่มุ่งไปยัง API เหล่านั้น

    ติดตั้ง Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    การติดตั้งแบบเนทีฟจะไปอยู่ในไดเรกทอรี `skills/` ของ workspace ที่ใช้งานอยู่ สำหรับ Skills ที่ใช้ร่วมกันข้าม agents ให้วางไว้ใน `~/.openclaw/skills/<name>/SKILL.md` หากควรมีเพียงบาง agents ที่เห็นการติดตั้งร่วม ให้กำหนดค่า `agents.defaults.skills` หรือ `agents.list[].skills` Skills บางรายการคาดหวังไบนารีที่ติดตั้งผ่าน Homebrew; บน Linux หมายถึง Linuxbrew (ดูรายการ FAQ ของ Homebrew Linux ด้านบน) ดู [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config), และ [ClawHub](/th/tools/clawhub).

  </Accordion>

  <Accordion title="ฉันจะใช้ Chrome ที่ลงชื่อเข้าใช้อยู่แล้วกับ OpenClaw ได้อย่างไร?">
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

    เส้นทางนี้สามารถใช้เบราว์เซอร์ของ host ในเครื่องหรือ Node เบราว์เซอร์ที่เชื่อมต่ออยู่ หาก Gateway รันอยู่ที่อื่น ให้รัน Node host บนเครื่องเบราว์เซอร์หรือใช้ CDP ระยะไกลแทน

    ขีดจำกัดปัจจุบันของ `existing-session` / `user`:

    - การดำเนินการอิง `ref` ไม่ได้อิง CSS selector
    - การอัปโหลดต้องใช้ `ref` / `inputRef` และปัจจุบันรองรับครั้งละหนึ่งไฟล์
    - `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการดำเนินการแบบชุดยังต้องใช้เบราว์เซอร์ที่จัดการโดยระบบหรือโปรไฟล์ CDP ดิบ

  </Accordion>
</AccordionGroup>

## การแซนด์บ็อกซ์และหน่วยความจำ

<AccordionGroup>
  <Accordion title="มีเอกสารเฉพาะสำหรับการแซนด์บ็อกซ์ไหม?">
    มี ดู [การแซนด์บ็อกซ์](/th/gateway/sandboxing) สำหรับการตั้งค่าเฉพาะ Docker (Gateway เต็มรูปแบบใน Docker หรืออิมเมจแซนด์บ็อกซ์) ดู [Docker](/th/install/docker).
  </Accordion>

  <Accordion title="Docker ดูมีข้อจำกัด - ฉันจะเปิดใช้ฟีเจอร์เต็มรูปแบบได้อย่างไร?">
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยก่อนและรันเป็นผู้ใช้ `node` ดังนั้นจึงไม่มี
    แพ็กเกจระบบ, Homebrew, หรือเบราว์เซอร์ที่รวมมาให้ สำหรับการตั้งค่าที่ครบถ้วนกว่า:

    - คงข้อมูล `/home/node` ด้วย `OPENCLAW_HOME_VOLUME` เพื่อให้แคชยังอยู่
    - ใส่ dependencies ของระบบลงในอิมเมจด้วย `OPENCLAW_DOCKER_APT_PACKAGES`
    - ติดตั้งเบราว์เซอร์ Playwright ผ่าน CLI ที่รวมมาให้:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` และตรวจสอบให้แน่ใจว่า path นั้นถูกคงไว้

    เอกสาร: [Docker](/th/install/docker), [เบราว์เซอร์](/th/tools/browser).

  </Accordion>

  <Accordion title="ฉันสามารถทำให้ DM เป็นส่วนตัว แต่ทำให้กลุ่มเป็นสาธารณะ/ถูกแซนด์บ็อกซ์ด้วย agent เดียวได้ไหม?">
    ได้ - หากทราฟฟิกส่วนตัวของคุณคือ **DMs** และทราฟฟิกสาธารณะของคุณคือ **groups**

    ใช้ `agents.defaults.sandbox.mode: "non-main"` เพื่อให้เซสชันกลุ่ม/ช่อง (คีย์ที่ไม่ใช่ main) รันใน backend แซนด์บ็อกซ์ที่กำหนดค่าไว้ ขณะที่เซสชัน DM หลักยังอยู่บน host Docker เป็น backend เริ่มต้นหากคุณไม่ได้เลือกอย่างอื่น จากนั้นจำกัดว่าเครื่องมือใดพร้อมใช้งานในเซสชันที่ถูกแซนด์บ็อกซ์ผ่าน `tools.sandbox.tools`

    คำแนะนำการตั้งค่า + ตัวอย่าง config: [กลุ่ม: DM ส่วนตัว + กลุ่มสาธารณะ](/th/channels/groups#pattern-personal-dms-public-groups-single-agent)

    อ้างอิง config หลัก: [การกำหนดค่า Gateway](/th/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ฉันจะ bind โฟลเดอร์ host เข้าไปในแซนด์บ็อกซ์ได้อย่างไร?">
    ตั้งค่า `agents.defaults.sandbox.docker.binds` เป็น `["host:path:mode"]` (เช่น `"/home/user/src:/src:ro"`) bind ระดับ global + ต่อ agent จะ merge กัน; bind ต่อ agent จะถูกละเว้นเมื่อ `scope: "shared"` ใช้ `:ro` สำหรับสิ่งที่อ่อนไหว และจำไว้ว่า bind จะข้ามกำแพงระบบไฟล์ของแซนด์บ็อกซ์

    OpenClaw ตรวจสอบแหล่งที่มาของ bind เทียบกับทั้ง path ที่ normalize แล้วและ path canonical ที่ resolve ผ่านบรรพบุรุษที่มีอยู่ลึกที่สุด นั่นหมายความว่าการหลุดออกผ่าน symlink-parent ยังล้มเหลวแบบปิด แม้ส่วน path สุดท้ายจะยังไม่มีอยู่ และการตรวจสอบ allowed-root ยังมีผลหลังจาก resolve symlink แล้ว

    ดู [การแซนด์บ็อกซ์](/th/gateway/sandboxing#custom-bind-mounts) และ [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) สำหรับตัวอย่างและหมายเหตุด้านความปลอดภัย

  </Accordion>

  <Accordion title="หน่วยความจำทำงานอย่างไร?">
    หน่วยความจำของ OpenClaw เป็นเพียงไฟล์ Markdown ใน workspace ของ agent:

    - บันทึกรายวันใน `memory/YYYY-MM-DD.md`
    - บันทึกระยะยาวที่คัดสรรแล้วใน `MEMORY.md` (เฉพาะเซสชัน main/private)

    OpenClaw ยังรัน **การ flush หน่วยความจำก่อน Compaction แบบเงียบ** เพื่อเตือนโมเดล
    ให้เขียนบันทึกที่คงทนก่อน auto-compaction ซึ่งจะรันเฉพาะเมื่อ workspace
    เขียนได้ (แซนด์บ็อกซ์แบบอ่านอย่างเดียวจะข้าม) ดู [หน่วยความจำ](/th/concepts/memory).

  </Accordion>

  <Accordion title="หน่วยความจำลืมสิ่งต่างๆ อยู่เรื่อยๆ ฉันจะทำให้มันจำได้อย่างไร?">
    ขอให้บอท **เขียนข้อเท็จจริงลงในหน่วยความจำ** บันทึกระยะยาวควรอยู่ใน `MEMORY.md`,
    บริบทระยะสั้นควรอยู่ใน `memory/YYYY-MM-DD.md`

    นี่ยังเป็นพื้นที่ที่เรากำลังปรับปรุงอยู่ การเตือนโมเดลให้จัดเก็บความทรงจำจะช่วยได้;
    โมเดลจะรู้ว่าต้องทำอะไร หากยังลืมอยู่ ให้ตรวจสอบว่า Gateway ใช้
    workspace เดียวกันในการรันทุกครั้ง

    เอกสาร: [หน่วยความจำ](/th/concepts/memory), [workspace ของ agent](/th/concepts/agent-workspace).

  </Accordion>

  <Accordion title="หน่วยความจำคงอยู่ตลอดไปไหม? มีขีดจำกัดอะไรบ้าง?">
    ไฟล์หน่วยความจำอยู่บนดิสก์และคงอยู่จนกว่าคุณจะลบ ขีดจำกัดคือ
    พื้นที่จัดเก็บของคุณ ไม่ใช่โมเดล **บริบทของเซสชัน** ยังถูกจำกัดด้วย
    context window ของโมเดล ดังนั้นบทสนทนายาวๆ อาจถูก compact หรือตัดทอน นั่นคือเหตุผลที่
    มีการค้นหาหน่วยความจำ - มันดึงเฉพาะส่วนที่เกี่ยวข้องกลับเข้าบริบท

    เอกสาร: [หน่วยความจำ](/th/concepts/memory), [บริบท](/th/concepts/context).

  </Accordion>

  <Accordion title="การค้นหาหน่วยความจำเชิงความหมายต้องใช้คีย์ OpenAI API หรือไม่?">
    ต้องใช้เฉพาะเมื่อคุณใช้ **OpenAI embeddings** เท่านั้น Codex OAuth ครอบคลุมแชต/การเติมข้อความให้สมบูรณ์ และ
    **ไม่ได้** ให้สิทธิ์เข้าถึง embeddings ดังนั้น **การลงชื่อเข้าใช้ด้วย Codex (OAuth หรือ
    การเข้าสู่ระบบ Codex CLI)** จะไม่ช่วยสำหรับการค้นหาหน่วยความจำเชิงความหมาย OpenAI embeddings
    ยังคงต้องใช้คีย์ API จริง (`OPENAI_API_KEY` หรือ `models.providers.openai.apiKey`)

    หากคุณไม่ได้ตั้งค่าผู้ให้บริการอย่างชัดเจน OpenClaw จะเลือกผู้ให้บริการให้อัตโนมัติเมื่อ
    สามารถระบุคีย์ API ได้ (โปรไฟล์การยืนยันตัวตน, `models.providers.*.apiKey` หรือ env vars)
    ระบบจะเลือก OpenAI ก่อนหากระบุคีย์ OpenAI ได้ ไม่เช่นนั้นจะเลือก Gemini หาก
    ระบุคีย์ Gemini ได้ จากนั้น Voyage แล้วจึง Mistral หากไม่มีคีย์ระยะไกลให้ใช้ การค้นหา
    หน่วยความจำจะยังปิดใช้งานอยู่จนกว่าคุณจะกำหนดค่า หากคุณมีเส้นทางโมเดล local
    ที่กำหนดค่าไว้และมีอยู่ OpenClaw
    จะเลือก `local` ก่อน รองรับ Ollama เมื่อคุณตั้งค่า
    `memorySearch.provider = "ollama"` อย่างชัดเจน

    หากคุณต้องการให้อยู่ในเครื่อง ให้ตั้งค่า `memorySearch.provider = "local"` (และเลือกตั้งค่า
    `memorySearch.fallback = "none"` ได้) หากคุณต้องการ Gemini embeddings ให้ตั้งค่า
    `memorySearch.provider = "gemini"` และระบุ `GEMINI_API_KEY` (หรือ
    `memorySearch.remote.apiKey`) เรารองรับโมเดล embedding แบบ **OpenAI, Gemini, Voyage, Mistral, Ollama หรือ local**
    ดูรายละเอียดการตั้งค่าได้ที่ [หน่วยความจำ](/th/concepts/memory)

  </Accordion>
</AccordionGroup>

## ตำแหน่งที่สิ่งต่าง ๆ อยู่บนดิสก์

<AccordionGroup>
  <Accordion title="ข้อมูลทั้งหมดที่ใช้กับ OpenClaw ถูกบันทึกไว้ในเครื่องหรือไม่?">
    ไม่ใช่ - **สถานะของ OpenClaw อยู่ในเครื่อง** แต่ **บริการภายนอกยังคงเห็นสิ่งที่คุณส่งให้**

    - **อยู่ในเครื่องโดยค่าเริ่มต้น:** เซสชัน, ไฟล์หน่วยความจำ, คอนฟิก และพื้นที่ทำงานอยู่บนโฮสต์ Gateway
      (`~/.openclaw` + ไดเรกทอรีพื้นที่ทำงานของคุณ)
    - **อยู่ระยะไกลโดยความจำเป็น:** ข้อความที่คุณส่งไปยังผู้ให้บริการโมเดล (Anthropic/OpenAI/ฯลฯ) จะไปยัง
      API ของพวกเขา และแพลตฟอร์มแชต (WhatsApp/Telegram/Slack/ฯลฯ) จะจัดเก็บข้อมูลข้อความไว้บน
      เซิร์ฟเวอร์ของพวกเขา
    - **คุณควบคุมขอบเขตข้อมูลได้:** การใช้โมเดล local จะเก็บพรอมป์ไว้บนเครื่องของคุณ แต่ทราฟฟิกของช่องทาง
      ยังคงผ่านเซิร์ฟเวอร์ของช่องทางนั้น

    ที่เกี่ยวข้อง: [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace), [หน่วยความจำ](/th/concepts/memory)

  </Accordion>

  <Accordion title="OpenClaw เก็บข้อมูลไว้ที่ไหน?">
    ทุกอย่างอยู่ภายใต้ `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`):

    | เส้นทาง                                                         | วัตถุประสงค์                                                       |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | คอนฟิกหลัก (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | การนำเข้า OAuth แบบเดิม (คัดลอกไปยังโปรไฟล์การยืนยันตัวตนเมื่อใช้ครั้งแรก) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | โปรไฟล์การยืนยันตัวตน (OAuth, คีย์ API และ `keyRef`/`tokenRef` ที่เลือกใช้ได้) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | เพย์โหลดลับที่รองรับด้วยไฟล์ซึ่งเลือกใช้ได้สำหรับผู้ให้บริการ SecretRef แบบ `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ไฟล์ความเข้ากันได้แบบเดิม (ลบรายการ `api_key` แบบคงที่แล้ว)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | สถานะผู้ให้บริการ (เช่น `whatsapp/<accountId>/creds.json`)        |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | สถานะต่อเอเจนต์ (agentDir + เซสชัน)                               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | ประวัติการสนทนาและสถานะ (ต่อเอเจนต์)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | เมทาดาทาเซสชัน (ต่อเอเจนต์)                                      |

    เส้นทางเอเจนต์เดียวแบบเดิม: `~/.openclaw/agent/*` (ย้ายข้อมูลโดย `openclaw doctor`)

    **พื้นที่ทำงาน** ของคุณ (AGENTS.md, ไฟล์หน่วยความจำ, Skills ฯลฯ) แยกต่างหากและกำหนดค่าผ่าน `agents.defaults.workspace` (ค่าเริ่มต้น: `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md ควรอยู่ที่ไหน?">
    ไฟล์เหล่านี้อยู่ใน **พื้นที่ทำงานของเอเจนต์** ไม่ใช่ `~/.openclaw`

    - **พื้นที่ทำงาน (ต่อเอเจนต์)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` ที่เลือกใช้ได้
      ราก `memory.md` ตัวพิมพ์เล็กเป็นอินพุตซ่อมแซมแบบเดิมเท่านั้น; `openclaw doctor --fix`
      สามารถรวมเข้าไปใน `MEMORY.md` ได้เมื่อมีทั้งสองไฟล์
    - **ไดเรกทอรีสถานะ (`~/.openclaw`)**: คอนฟิก, สถานะช่องทาง/ผู้ให้บริการ, โปรไฟล์การยืนยันตัวตน, เซสชัน, ล็อก
      และ Skills ที่ใช้ร่วมกัน (`~/.openclaw/skills`)

    พื้นที่ทำงานเริ่มต้นคือ `~/.openclaw/workspace` กำหนดค่าได้ผ่าน:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    หากบอต "ลืม" หลังรีสตาร์ต ให้ยืนยันว่า Gateway ใช้
    พื้นที่ทำงานเดียวกันทุกครั้งที่เปิดใช้งาน (และจำไว้ว่า: โหมดระยะไกลใช้
    พื้นที่ทำงานของ **โฮสต์ Gateway** ไม่ใช่แล็ปท็อป local ของคุณ)

    เคล็ดลับ: หากคุณต้องการพฤติกรรมหรือการตั้งค่าที่คงทน ให้ขอให้บอต **เขียนลงใน
    AGENTS.md หรือ MEMORY.md** แทนการพึ่งพาประวัติแชต

    ดู [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace) และ [หน่วยความจำ](/th/concepts/memory)

  </Accordion>

  <Accordion title="กลยุทธ์สำรองข้อมูลที่แนะนำ">
    ใส่ **พื้นที่ทำงานของเอเจนต์** ของคุณไว้ใน repo git แบบ **ส่วนตัว** และสำรองข้อมูลไว้ที่ที่
    เป็นส่วนตัว (ตัวอย่างเช่น GitHub private) วิธีนี้จะเก็บหน่วยความจำ + ไฟล์ AGENTS/SOUL/USER
    และให้คุณกู้คืน "จิตใจ" ของผู้ช่วยได้ในภายหลัง

    **อย่า** commit สิ่งใดภายใต้ `~/.openclaw` (ข้อมูลประจำตัว, เซสชัน, โทเค็น หรือเพย์โหลดข้อมูลลับที่เข้ารหัส)
    หากคุณต้องกู้คืนแบบเต็ม ให้สำรองทั้งพื้นที่ทำงานและไดเรกทอรีสถานะ
    แยกกัน (ดูคำถามเรื่องการย้ายข้อมูลด้านบน)

    เอกสาร: [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)

  </Accordion>

  <Accordion title="ฉันจะถอนการติดตั้ง OpenClaw ทั้งหมดได้อย่างไร?">
    ดูคู่มือเฉพาะ: [ถอนการติดตั้ง](/th/install/uninstall)
  </Accordion>

  <Accordion title="เอเจนต์ทำงานนอกพื้นที่ทำงานได้หรือไม่?">
    ได้ พื้นที่ทำงานคือ **default cwd** และจุดอ้างอิงหน่วยความจำ ไม่ใช่ sandbox ที่บังคับตายตัว
    เส้นทางสัมพัทธ์จะ resolve ภายในพื้นที่ทำงาน แต่เส้นทางสัมบูรณ์สามารถเข้าถึงตำแหน่งอื่น
    บนโฮสต์ได้ เว้นแต่จะเปิดใช้ sandboxing หากคุณต้องการการแยกใช้งาน ให้ใช้
    [`agents.defaults.sandbox`](/th/gateway/sandboxing) หรือการตั้งค่า sandbox ต่อเอเจนต์ หากคุณ
    ต้องการให้ repo เป็นไดเรกทอรีทำงานเริ่มต้น ให้ชี้ `workspace`
    ของเอเจนต์นั้นไปที่รากของ repo repo OpenClaw เป็นเพียงซอร์สโค้ด; ให้แยก
    พื้นที่ทำงานออกจากกัน เว้นแต่คุณตั้งใจให้เอเจนต์ทำงานภายในนั้น

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

  <Accordion title="โหมดระยะไกล: ที่เก็บเซสชันอยู่ที่ไหน?">
    สถานะเซสชันเป็นของ **โฮสต์ Gateway** หากคุณอยู่ในโหมดระยะไกล ที่เก็บเซสชันที่คุณต้องสนใจอยู่บนเครื่องระยะไกล ไม่ใช่แล็ปท็อป local ของคุณ ดู [การจัดการเซสชัน](/th/concepts/session)
  </Accordion>
</AccordionGroup>

## พื้นฐานคอนฟิก

<AccordionGroup>
  <Accordion title="คอนฟิกอยู่ในรูปแบบใด? อยู่ที่ไหน?">
    OpenClaw อ่านคอนฟิก **JSON5** ที่เลือกใช้ได้จาก `$OPENCLAW_CONFIG_PATH` (ค่าเริ่มต้น: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    หากไม่มีไฟล์ จะใช้ค่าเริ่มต้นที่ค่อนข้างปลอดภัย (รวมถึงพื้นที่ทำงานเริ่มต้นที่ `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title='ฉันตั้งค่า gateway.bind: "lan" (หรือ "tailnet") แล้วตอนนี้ไม่มีอะไร listen / UI แจ้งว่าไม่ได้รับอนุญาต'>
    การ bind ที่ไม่ใช่ loopback **ต้องมีเส้นทางการยืนยันตัวตน Gateway ที่ถูกต้อง** ในทางปฏิบัติหมายถึง:

    - การยืนยันตัวตนแบบ shared-secret: โทเค็นหรือรหัสผ่าน
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

    - `gateway.remote.token` / `.password` **ไม่ได้** เปิดใช้การยืนยันตัวตน Gateway ในเครื่องด้วยตัวเอง
    - เส้นทางการเรียกในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
    - สำหรับการยืนยันตัวตนด้วยรหัสผ่าน ให้ตั้งค่า `gateway.auth.mode: "password"` พร้อม `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`) แทน
    - หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าอย่างชัดเจนผ่าน SecretRef และ resolve ไม่ได้ การ resolve จะล้มเหลวแบบปิด (ไม่มี remote fallback มาปิดบัง)
    - การตั้งค่า Control UI แบบ shared-secret ยืนยันตัวตนผ่าน `connect.params.auth.token` หรือ `connect.params.auth.password` (จัดเก็บในแอป/การตั้งค่า UI) โหมดที่มีตัวตน เช่น Tailscale Serve หรือ `trusted-proxy` ใช้ส่วนหัวคำขอแทน หลีกเลี่ยงการใส่ shared secrets ใน URL
    - เมื่อใช้ `gateway.auth.mode: "trusted-proxy"` reverse proxy แบบ loopback บนโฮสต์เดียวกันต้องใช้ `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน และมีรายการ loopback ใน `gateway.trustedProxies`

  </Accordion>

  <Accordion title="ทำไมตอนนี้ฉันต้องใช้โทเค็นบน localhost?">
    OpenClaw บังคับใช้การยืนยันตัวตน Gateway โดยค่าเริ่มต้น รวมถึง loopback ในเส้นทางค่าเริ่มต้นตามปกติ หมายถึงการยืนยันตัวตนด้วยโทเค็น: หากไม่ได้กำหนดค่าเส้นทางการยืนยันตัวตนอย่างชัดเจน การเริ่มต้น Gateway จะ resolve เป็นโหมดโทเค็นและสร้างโทเค็นให้อัตโนมัติ บันทึกไว้ที่ `gateway.auth.token` ดังนั้น **ไคลเอนต์ WS ในเครื่องต้องยืนยันตัวตน** วิธีนี้บล็อกกระบวนการอื่นในเครื่องไม่ให้เรียก Gateway

    หากคุณต้องการเส้นทางการยืนยันตัวตนแบบอื่น คุณสามารถเลือกโหมดรหัสผ่านอย่างชัดเจนได้ (หรือ `trusted-proxy` สำหรับ reverse proxy ที่รับรู้ตัวตน) หากคุณ **ต้องการจริง ๆ** ให้ loopback เปิดอยู่ ให้ตั้งค่า `gateway.auth.mode: "none"` อย่างชัดเจนในคอนฟิกของคุณ Doctor สามารถสร้างโทเค็นให้คุณได้ทุกเมื่อ: `openclaw doctor --generate-gateway-token`

  </Accordion>

  <Accordion title="ฉันต้องรีสตาร์ตหลังเปลี่ยนคอนฟิกหรือไม่?">
    Gateway เฝ้าดูคอนฟิกและรองรับ hot-reload:

    - `gateway.reload.mode: "hybrid"` (ค่าเริ่มต้น): hot-apply การเปลี่ยนแปลงที่ปลอดภัย รีสตาร์ตสำหรับการเปลี่ยนแปลงสำคัญ
    - รองรับ `hot`, `restart`, `off` ด้วย

  </Accordion>

  <Accordion title="ฉันจะปิดแท็กไลน์ CLI ตลก ๆ ได้อย่างไร?">
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

    - `off`: ซ่อนข้อความแท็กไลน์แต่ยังคงบรรทัดชื่อแบนเนอร์/เวอร์ชันไว้
    - `default`: ใช้ `All your chats, one OpenClaw.` ทุกครั้ง
    - `random`: แท็กไลน์ตลก/ตามฤดูกาลที่หมุนเปลี่ยน (พฤติกรรมเริ่มต้น)
    - หากคุณไม่ต้องการแบนเนอร์เลย ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

  </Accordion>

  <Accordion title="ฉันจะเปิดใช้การค้นหาเว็บ (และการดึงข้อมูลเว็บ) ได้อย่างไร?">
    `web_fetch` ทำงานได้โดยไม่ต้องใช้คีย์ API `web_search` ขึ้นอยู่กับ
    ผู้ให้บริการที่คุณเลือก:

    - ผู้ให้บริการที่รองรับด้วย API เช่น Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity และ Tavily ต้องใช้การตั้งค่าคีย์ API ตามปกติ
    - Ollama Web Search ไม่ต้องใช้คีย์ แต่ใช้โฮสต์ Ollama ที่คุณกำหนดค่าไว้และต้องใช้ `ollama signin`
    - DuckDuckGo ไม่ต้องใช้คีย์ แต่เป็นการผสานรวมแบบไม่เป็นทางการที่ใช้ HTML
    - SearXNG ไม่ต้องใช้คีย์/โฮสต์เองได้; กำหนดค่า `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl`

    **แนะนำ:** รัน `openclaw configure --section web` แล้วเลือกผู้ให้บริการ
    ทางเลือกผ่านสภาพแวดล้อม:

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

    ตอนนี้การกำหนดค่า web-search เฉพาะผู้ให้บริการอยู่ภายใต้ `plugins.entries.<plugin>.config.webSearch.*`
    พาธผู้ให้บริการแบบเดิม `tools.web.search.*` ยังโหลดได้ชั่วคราวเพื่อความเข้ากันได้ แต่ไม่ควรใช้สำหรับการกำหนดค่าใหม่
    การกำหนดค่า fallback ของ web-fetch สำหรับ Firecrawl อยู่ภายใต้ `plugins.entries.firecrawl.config.webFetch.*`

    หมายเหตุ:

    - หากคุณใช้ allowlist ให้เพิ่ม `web_search`/`web_fetch`/`x_search` หรือ `group:web`
    - `web_fetch` เปิดใช้งานตามค่าเริ่มต้น (เว้นแต่จะปิดไว้อย่างชัดเจน)
    - หากละ `tools.web.fetch.provider` ไว้ OpenClaw จะตรวจจับผู้ให้บริการ fetch fallback รายแรกที่พร้อมใช้งานจากข้อมูลรับรองที่มีโดยอัตโนมัติ ปัจจุบันผู้ให้บริการที่มาพร้อมระบบคือ Firecrawl
    - Daemon อ่านตัวแปรสภาพแวดล้อมจาก `~/.openclaw/.env` (หรือสภาพแวดล้อมของ service)

    เอกสาร: [เครื่องมือเว็บ](/th/tools/web)

  </Accordion>

  <Accordion title="config.apply ล้างการกำหนดค่าของฉัน ฉันจะกู้คืนและหลีกเลี่ยงเรื่องนี้ได้อย่างไร">
    `config.apply` จะแทนที่ **การกำหนดค่าทั้งหมด** หากคุณส่งออบเจกต์บางส่วน ทุกอย่าง
    ที่เหลือจะถูกลบออก

    OpenClaw ปัจจุบันป้องกันการเขียนทับโดยไม่ตั้งใจได้หลายกรณี:

    - การเขียนการกำหนดค่าที่ OpenClaw เป็นเจ้าของจะตรวจสอบการกำหนดค่าทั้งหมดหลังการเปลี่ยนแปลงก่อนเขียน
    - การเขียนที่ OpenClaw เป็นเจ้าของซึ่งไม่ถูกต้องหรือทำลายข้อมูลจะถูกปฏิเสธและบันทึกเป็น `openclaw.json.rejected.*`
    - หากการแก้ไขโดยตรงทำให้การเริ่มทำงานหรือ hot reload เสีย Gateway จะคืนค่าการกำหนดค่าที่ทราบว่าใช้งานได้ล่าสุด และบันทึกไฟล์ที่ถูกปฏิเสธเป็น `openclaw.json.clobbered.*`
    - เอเจนต์หลักจะได้รับคำเตือนตอนบูตหลังการกู้คืน เพื่อไม่ให้เขียนการกำหนดค่าที่เสียซ้ำแบบไม่ตรวจสอบ

    กู้คืน:

    - ตรวจสอบ `openclaw logs --follow` เพื่อหา `Config auto-restored from last-known-good`, `Config write rejected:`, หรือ `config reload restored last-known-good config`
    - ตรวจสอบ `openclaw.json.clobbered.*` หรือ `openclaw.json.rejected.*` ล่าสุดที่อยู่ข้างการกำหนดค่าที่ใช้งานอยู่
    - เก็บการกำหนดค่าที่กู้คืนและใช้งานอยู่ไว้หากมันทำงานได้ จากนั้นคัดลอกกลับเฉพาะคีย์ที่ตั้งใจด้วย `openclaw config set` หรือ `config.patch`
    - รัน `openclaw config validate` และ `openclaw doctor`
    - หากคุณไม่มี last-known-good หรือ payload ที่ถูกปฏิเสธ ให้กู้คืนจากข้อมูลสำรอง หรือรัน `openclaw doctor` อีกครั้งแล้วกำหนดค่า channels/models ใหม่
    - หากนี่เป็นเรื่องที่ไม่คาดคิด ให้แจ้งบั๊กและแนบการกำหนดค่าล่าสุดที่คุณทราบหรือข้อมูลสำรองใดๆ
    - เอเจนต์เขียนโค้ดในเครื่องมักจะสร้างการกำหนดค่าที่ใช้งานได้ขึ้นใหม่จากบันทึกหรือประวัติได้

    หลีกเลี่ยง:

    - ใช้ `openclaw config set` สำหรับการเปลี่ยนแปลงเล็กๆ
    - ใช้ `openclaw configure` สำหรับการแก้ไขแบบโต้ตอบ
    - ใช้ `config.schema.lookup` ก่อนเมื่อคุณไม่แน่ใจเกี่ยวกับพาธหรือรูปแบบฟิลด์ที่แน่นอน ระบบจะคืนค่าโหนด schema แบบตื้นพร้อมสรุปลูกโดยตรงสำหรับการเจาะลงไปดูรายละเอียด
    - ใช้ `config.patch` สำหรับการแก้ไข RPC บางส่วน; เก็บ `config.apply` ไว้สำหรับการแทนที่การกำหนดค่าทั้งหมดเท่านั้น
    - หากคุณใช้เครื่องมือ `gateway` สำหรับเจ้าของเท่านั้นจากการรันของเอเจนต์ เครื่องมือนั้นจะยังคงปฏิเสธการเขียนไปยัง `tools.exec.ask` / `tools.exec.security` (รวมถึง alias เดิม `tools.bash.*` ที่ normalize ไปยังพาธ exec ที่ป้องกันเดียวกัน)

    เอกสาร: [Config](/th/cli/config), [Configure](/th/cli/configure), [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันจะรัน Gateway ส่วนกลางพร้อม worker เฉพาะทางข้ามอุปกรณ์ได้อย่างไร">
    รูปแบบทั่วไปคือ **Gateway หนึ่งตัว** (เช่น Raspberry Pi) พร้อม **node** และ **agent**:

    - **Gateway (ส่วนกลาง):** ดูแล channels (Signal/WhatsApp), การกำหนดเส้นทาง และเซสชัน
    - **Node (อุปกรณ์):** Mac/iOS/Android เชื่อมต่อเป็นอุปกรณ์ต่อพ่วงและเปิดเผยเครื่องมือในเครื่อง (`system.run`, `canvas`, `camera`)
    - **Agent (worker):** สมอง/พื้นที่ทำงานแยกต่างหากสำหรับบทบาทเฉพาะ (เช่น "Hetzner ops", "Personal data")
    - **Sub-agent:** สร้างงานเบื้องหลังจากเอเจนต์หลักเมื่อคุณต้องการการทำงานแบบขนาน
    - **TUI:** เชื่อมต่อกับ Gateway และสลับเอเจนต์/เซสชัน

    เอกสาร: [Node](/th/nodes), [การเข้าถึงระยะไกล](/th/gateway/remote), [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [Sub-agent](/th/tools/subagents), [TUI](/th/web/tui)

  </Accordion>

  <Accordion title="เบราว์เซอร์ของ OpenClaw รันแบบ headless ได้ไหม">
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

    ค่าเริ่มต้นคือ `false` (headful) Headless มีโอกาสกระตุ้นการตรวจสอบ anti-bot บนบางไซต์มากกว่า ดู [เบราว์เซอร์](/th/tools/browser)

    Headless ใช้ **เอนจิน Chromium เดียวกัน** และทำงานกับระบบอัตโนมัติส่วนใหญ่ได้ (ฟอร์ม การคลิก การดึงข้อมูล การเข้าสู่ระบบ) ความแตกต่างหลักคือ:

    - ไม่มีหน้าต่างเบราว์เซอร์ที่มองเห็นได้ (ใช้ภาพหน้าจอหากคุณต้องการภาพ)
    - บางไซต์เข้มงวดกับระบบอัตโนมัติในโหมด headless มากกว่า (CAPTCHA, anti-bot)
      ตัวอย่างเช่น X/Twitter มักบล็อกเซสชัน headless

  </Accordion>

  <Accordion title="ฉันจะใช้ Brave สำหรับการควบคุมเบราว์เซอร์ได้อย่างไร">
    ตั้งค่า `browser.executablePath` เป็น binary ของ Brave ของคุณ (หรือเบราว์เซอร์ที่ใช้ Chromium ใดๆ) แล้วรีสตาร์ท Gateway
    ดูตัวอย่างการกำหนดค่าแบบเต็มใน [เบราว์เซอร์](/th/tools/browser#use-brave-or-another-chromium-based-browser)
  </Accordion>
</AccordionGroup>

## Gateway และ node ระยะไกล

<AccordionGroup>
  <Accordion title="คำสั่งส่งต่อระหว่าง Telegram, gateway และ node อย่างไร">
    ข้อความ Telegram ถูกจัดการโดย **gateway** gateway จะรันเอเจนต์และ
    หลังจากนั้นจึงเรียก node ผ่าน **Gateway WebSocket** เมื่อจำเป็นต้องใช้เครื่องมือของ node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node จะไม่เห็นทราฟฟิกขาเข้าจากผู้ให้บริการ; node จะได้รับเฉพาะการเรียก RPC ของ node เท่านั้น

  </Accordion>

  <Accordion title="เอเจนต์ของฉันจะเข้าถึงคอมพิวเตอร์ของฉันได้อย่างไรหาก Gateway โฮสต์อยู่ระยะไกล">
    คำตอบสั้นๆ: **จับคู่คอมพิวเตอร์ของคุณเป็น node** Gateway รันอยู่ที่อื่น แต่สามารถ
    เรียกเครื่องมือ `node.*` (หน้าจอ กล้อง ระบบ) บนเครื่องของคุณผ่าน Gateway WebSocket ได้

    การตั้งค่าทั่วไป:

    1. รัน Gateway บนโฮสต์ที่เปิดตลอดเวลา (VPS/เซิร์ฟเวอร์ที่บ้าน)
    2. ใส่โฮสต์ Gateway และคอมพิวเตอร์ของคุณไว้ใน tailnet เดียวกัน
    3. ตรวจสอบว่า Gateway WS เข้าถึงได้ (tailnet bind หรือ SSH tunnel)
    4. เปิดแอป macOS ในเครื่องและเชื่อมต่อในโหมด **Remote over SSH** (หรือ tailnet โดยตรง)
       เพื่อให้แอปลงทะเบียนเป็น node ได้
    5. อนุมัติ node บน Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ไม่จำเป็นต้องมี TCP bridge แยกต่างหาก; node เชื่อมต่อผ่าน Gateway WebSocket

    คำเตือนด้านความปลอดภัย: การจับคู่ node macOS อนุญาตให้ใช้ `system.run` บนเครื่องนั้น จับคู่
    เฉพาะอุปกรณ์ที่คุณไว้วางใจ และตรวจทาน [ความปลอดภัย](/th/gateway/security)

    เอกสาร: [Node](/th/nodes), [โปรโตคอล Gateway](/th/gateway/protocol), [โหมดระยะไกลของ macOS](/th/platforms/mac/remote), [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="Tailscale เชื่อมต่อแล้วแต่ฉันไม่ได้รับการตอบกลับ ทำอย่างไรต่อ">
    ตรวจสอบพื้นฐาน:

    - Gateway กำลังรันอยู่: `openclaw gateway status`
    - สุขภาพของ Gateway: `openclaw status`
    - สุขภาพของ channel: `openclaw channels status`

    จากนั้นตรวจสอบการยืนยันตัวตนและการกำหนดเส้นทาง:

    - หากคุณใช้ Tailscale Serve ตรวจสอบให้แน่ใจว่าตั้งค่า `gateway.auth.allowTailscale` ถูกต้อง
    - หากคุณเชื่อมต่อผ่าน SSH tunnel ให้ยืนยันว่า tunnel ในเครื่องทำงานอยู่และชี้ไปยังพอร์ตที่ถูกต้อง
    - ยืนยันว่า allowlist ของคุณ (DM หรือกลุ่ม) รวมบัญชีของคุณไว้แล้ว

    เอกสาร: [Tailscale](/th/gateway/tailscale), [การเข้าถึงระยะไกล](/th/gateway/remote), [Channel](/th/channels)

  </Accordion>

  <Accordion title="อินสแตนซ์ OpenClaw สองตัวคุยกันได้ไหม (ในเครื่อง + VPS)">
    ได้ ไม่มี bridge "bot-to-bot" ในตัว แต่คุณสามารถเชื่อมต่อได้หลายวิธี
    ที่น่าเชื่อถือ:

    **ง่ายที่สุด:** ใช้ช่องแชตปกติที่บอตทั้งสองเข้าถึงได้ (Telegram/Slack/WhatsApp)
    ให้ Bot A ส่งข้อความถึง Bot B แล้วให้ Bot B ตอบกลับตามปกติ

    **CLI bridge (ทั่วไป):** รันสคริปต์ที่เรียก Gateway อีกตัวด้วย
    `openclaw agent --message ... --deliver` โดยกำหนดเป้าหมายไปยังแชตที่บอตอีกตัว
    ฟังอยู่ หากบอตตัวหนึ่งอยู่บน VPS ระยะไกล ให้ชี้ CLI ของคุณไปยัง Gateway ระยะไกลนั้น
    ผ่าน SSH/Tailscale (ดู [การเข้าถึงระยะไกล](/th/gateway/remote))

    รูปแบบตัวอย่าง (รันจากเครื่องที่เข้าถึง Gateway เป้าหมายได้):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    เคล็ดลับ: เพิ่ม guardrail เพื่อไม่ให้บอตทั้งสองวนลูปไม่สิ้นสุด (mention-only, channel
    allowlist หรือกฎ "do not reply to bot messages")

    เอกสาร: [การเข้าถึงระยะไกล](/th/gateway/remote), [Agent CLI](/th/cli/agent), [การส่งของ Agent](/th/tools/agent-send)

  </Accordion>

  <Accordion title="ฉันต้องใช้ VPS แยกสำหรับหลายเอเจนต์หรือไม่">
    ไม่ต้อง Gateway หนึ่งตัวสามารถโฮสต์เอเจนต์หลายตัวได้ โดยแต่ละตัวมีพื้นที่ทำงาน ค่าเริ่มต้นของโมเดล
    และการกำหนดเส้นทางของตนเอง นี่คือการตั้งค่าปกติและถูกกว่า รวมถึงเรียบง่ายกว่าการรัน
    หนึ่ง VPS ต่อเอเจนต์มาก

    ใช้ VPS แยกเฉพาะเมื่อคุณต้องการการแยกอย่างเข้มงวด (ขอบเขตความปลอดภัย) หรือการกำหนดค่า
    ที่แตกต่างกันมากและไม่ต้องการแชร์ มิฉะนั้นให้ใช้ Gateway เดียวและ
    ใช้หลายเอเจนต์หรือ sub-agent

  </Accordion>

  <Accordion title="มีประโยชน์ไหมหากใช้ node บนแล็ปท็อปส่วนตัวแทน SSH จาก VPS">
    มี node เป็นวิธีหลักในการเข้าถึงแล็ปท็อปของคุณจาก Gateway ระยะไกล และ
    เปิดความสามารถมากกว่าการเข้าถึง shell Gateway รันบน macOS/Linux (Windows ผ่าน WSL2) และ
    น้ำหนักเบา (VPS ขนาดเล็กหรือเครื่องระดับ Raspberry Pi ก็พอ; RAM 4 GB เพียงพอ) ดังนั้นการตั้งค่าทั่วไป
    คือโฮสต์ที่เปิดตลอดเวลาพร้อมแล็ปท็อปของคุณเป็น node

    - **ไม่ต้องใช้ SSH ขาเข้า** Node เชื่อมต่อออกไปยัง Gateway WebSocket และใช้การจับคู่อุปกรณ์
    - **การควบคุมการดำเนินการที่ปลอดภัยกว่า** `system.run` ถูกกำกับด้วย allowlist/การอนุมัติของ node บนแล็ปท็อปนั้น
    - **เครื่องมืออุปกรณ์มากขึ้น** Node เปิดเผย `canvas`, `camera`, และ `screen` เพิ่มเติมจาก `system.run`
    - **ระบบอัตโนมัติของเบราว์เซอร์ในเครื่อง** เก็บ Gateway ไว้บน VPS แต่รัน Chrome ในเครื่องผ่านโฮสต์ node บนแล็ปท็อป หรือแนบกับ Chrome ในเครื่องบนโฮสต์ผ่าน Chrome MCP

    SSH เหมาะสำหรับการเข้าถึง shell แบบเฉพาะกิจ แต่ node เรียบง่ายกว่าสำหรับเวิร์กโฟลว์เอเจนต์ต่อเนื่องและ
    ระบบอัตโนมัติของอุปกรณ์

    เอกสาร: [Node](/th/nodes), [Node CLI](/th/cli/nodes), [เบราว์เซอร์](/th/tools/browser)

  </Accordion>

  <Accordion title="Node รัน service ของ gateway หรือไม่">
    ไม่ รัน **gateway หนึ่งตัว** ต่อโฮสต์เท่านั้น เว้นแต่คุณตั้งใจรันโปรไฟล์ที่แยกจากกัน (ดู [Gateway หลายตัว](/th/gateway/multiple-gateways)) Node เป็นอุปกรณ์ต่อพ่วงที่เชื่อมต่อ
    กับ gateway (node iOS/Android หรือ "โหมด node" ของ macOS ในแอป menubar) สำหรับโฮสต์ node
    แบบ headless และการควบคุมผ่าน CLI ดู [Node host CLI](/th/cli/node)

    ต้องรีสตาร์ทเต็มรูปแบบสำหรับการเปลี่ยนแปลง `gateway`, `discovery`, และ `canvasHost`

  </Accordion>

  <Accordion title="มีวิธี API / RPC สำหรับ apply config หรือไม่">
    มี

    - `config.schema.lookup`: ตรวจสอบ subtree การกำหนดค่าหนึ่งรายการพร้อมโหนด schema แบบตื้น UI hint ที่ตรงกัน และสรุปลูกโดยตรงก่อนเขียน
    - `config.get`: ดึง snapshot + hash ปัจจุบัน
    - `config.patch`: อัปเดตบางส่วนอย่างปลอดภัย (แนะนำสำหรับการแก้ไข RPC ส่วนใหญ่); hot-reload เมื่อเป็นไปได้และรีสตาร์ทเมื่อจำเป็น
    - `config.apply`: ตรวจสอบความถูกต้อง + แทนที่การกำหนดค่าทั้งหมด; hot-reload เมื่อเป็นไปได้และรีสตาร์ทเมื่อจำเป็น
    - เครื่องมือ runtime `gateway` สำหรับเจ้าของเท่านั้นยังคงปฏิเสธการเขียนใหม่ไปยัง `tools.exec.ask` / `tools.exec.security`; alias เดิม `tools.bash.*` จะ normalize ไปยังพาธ exec ที่ป้องกันเดียวกัน

  </Accordion>

  <Accordion title="การตั้งค่าขั้นต่ำที่สมเหตุสมผลสำหรับการติดตั้งครั้งแรก">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    การตั้งค่านี้กำหนด workspace ของคุณและจำกัดผู้ที่สามารถเรียกบอตได้

  </Accordion>

  <Accordion title="ฉันจะตั้งค่า Tailscale บน VPS และเชื่อมต่อจาก Mac ได้อย่างไร?">
    ขั้นตอนขั้นต่ำ:

    1. **ติดตั้ง + เข้าสู่ระบบบน VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **ติดตั้ง + เข้าสู่ระบบบน Mac ของคุณ**
       - ใช้แอป Tailscale แล้วลงชื่อเข้าใช้ tailnet เดียวกัน
    3. **เปิดใช้ MagicDNS (แนะนำ)**
       - ในคอนโซลผู้ดูแลของ Tailscale ให้เปิดใช้ MagicDNS เพื่อให้ VPS มีชื่อที่คงที่
    4. **ใช้ชื่อโฮสต์ของ tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    หากคุณต้องการ Control UI โดยไม่ใช้ SSH ให้ใช้ Tailscale Serve บน VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    วิธีนี้ทำให้ Gateway ผูกกับ loopback และเปิดเผย HTTPS ผ่าน Tailscale ดู [Tailscale](/th/gateway/tailscale)

  </Accordion>

  <Accordion title="ฉันจะเชื่อมต่อ Node ของ Mac กับ Gateway ระยะไกล (Tailscale Serve) ได้อย่างไร?">
    Serve เปิดเผย **Gateway Control UI + WS** Node เชื่อมต่อผ่าน Gateway WS endpoint เดียวกัน

    การตั้งค่าที่แนะนำ:

    1. **ตรวจสอบให้แน่ใจว่า VPS + Mac อยู่ใน tailnet เดียวกัน**
    2. **ใช้แอป macOS ในโหมดระยะไกล** (เป้าหมาย SSH สามารถเป็นชื่อโฮสต์ของ tailnet ได้)
       แอปจะทำ tunnel พอร์ต Gateway และเชื่อมต่อเป็น Node
    3. **อนุมัติ Node** บน Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    เอกสาร: [โปรโตคอล Gateway](/th/gateway/protocol), [การค้นพบ](/th/gateway/discovery), [โหมดระยะไกลของ macOS](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันควรติดตั้งบนแล็ปท็อปเครื่องที่สองหรือแค่เพิ่ม Node?">
    หากคุณต้องการเพียง **เครื่องมือในเครื่อง** (หน้าจอ/กล้อง/exec) บนแล็ปท็อปเครื่องที่สอง ให้เพิ่มเป็น
    **Node** วิธีนี้คง Gateway ไว้เพียงตัวเดียวและหลีกเลี่ยง config ที่ซ้ำซ้อน เครื่องมือ Node ในเครื่อง
    ตอนนี้รองรับเฉพาะ macOS แต่เราวางแผนจะขยายไปยัง OS อื่น

    ติดตั้ง Gateway ตัวที่สองเฉพาะเมื่อคุณต้องการ **การแยกอย่างเข้มงวด** หรือบอตสองตัวที่แยกกันโดยสมบูรณ์

    เอกสาร: [Node](/th/nodes), [CLI ของ Node](/th/cli/nodes), [Gateway หลายตัว](/th/gateway/multiple-gateways)

  </Accordion>
</AccordionGroup>

## Env vars และการโหลด .env

<AccordionGroup>
  <Accordion title="OpenClaw โหลดตัวแปรสภาพแวดล้อมอย่างไร?">
    OpenClaw อ่านตัวแปรสภาพแวดล้อมจาก process แม่ (shell, launchd/systemd, CI ฯลฯ) และโหลดเพิ่มเติมจาก:

    - `.env` จากไดเรกทอรีทำงานปัจจุบัน
    - `.env` fallback แบบ global จาก `~/.openclaw/.env` (หรือ `$OPENCLAW_STATE_DIR/.env`)

    ไฟล์ `.env` ทั้งสองไฟล์จะไม่แทนที่ตัวแปรสภาพแวดล้อมที่มีอยู่

    คุณยังสามารถกำหนดตัวแปรสภาพแวดล้อม inline ใน config ได้ด้วย (ใช้เฉพาะเมื่อไม่มีอยู่ใน process env):

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

  <Accordion title="ฉันเริ่ม Gateway ผ่าน service แล้วตัวแปรสภาพแวดล้อมของฉันหายไป ตอนนี้ควรทำอย่างไร?">
    วิธีแก้ที่พบบ่อยมีสองวิธี:

    1. ใส่คีย์ที่หายไปใน `~/.openclaw/.env` เพื่อให้ถูกอ่านแม้ service จะไม่สืบทอด shell env ของคุณ
    2. เปิดใช้การนำเข้าจาก shell (ความสะดวกแบบเลือกเปิดใช้):

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

    วิธีนี้จะเรียกใช้ login shell ของคุณและนำเข้าเฉพาะคีย์ที่คาดไว้ซึ่งยังไม่มีอยู่ (ไม่แทนที่ของเดิม) ตัวแปรสภาพแวดล้อมที่เทียบเท่า:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='ฉันตั้งค่า COPILOT_GITHUB_TOKEN แล้ว แต่สถานะ models แสดง "Shell env: off." เพราะอะไร?'>
    `openclaw models status` รายงานว่าเปิดใช้ **การนำเข้าจาก shell env** หรือไม่ "Shell env: off"
    **ไม่ได้** หมายความว่าตัวแปรสภาพแวดล้อมของคุณหายไป แต่หมายความว่า OpenClaw จะไม่โหลด
    login shell ของคุณโดยอัตโนมัติ

    หาก Gateway ทำงานเป็น service (launchd/systemd) มันจะไม่สืบทอด
    สภาพแวดล้อม shell ของคุณ แก้ได้ด้วยวิธีใดวิธีหนึ่งต่อไปนี้:

    1. ใส่ token ใน `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. หรือเปิดใช้การนำเข้าจาก shell (`env.shellEnv.enabled: true`)
    3. หรือเพิ่มไว้ในบล็อก `env` ของ config (ใช้เฉพาะเมื่อไม่มีอยู่)

    จากนั้นรีสตาร์ต Gateway แล้วตรวจสอบอีกครั้ง:

    ```bash
    openclaw models status
    ```

    token ของ Copilot จะถูกอ่านจาก `COPILOT_GITHUB_TOKEN` (รวมถึง `GH_TOKEN` / `GITHUB_TOKEN`)
    ดู [/concepts/model-providers](/th/concepts/model-providers) และ [/environment](/th/help/environment)

  </Accordion>
</AccordionGroup>

## เซสชันและหลายแชต

<AccordionGroup>
  <Accordion title="ฉันจะเริ่มการสนทนาใหม่ได้อย่างไร?">
    ส่ง `/new` หรือ `/reset` เป็นข้อความเดี่ยว ดู [การจัดการเซสชัน](/th/concepts/session)
  </Accordion>

  <Accordion title="เซสชันจะรีเซ็ตโดยอัตโนมัติหรือไม่หากฉันไม่เคยส่ง /new?">
    เซสชันสามารถหมดอายุหลังจาก `session.idleMinutes` ได้ แต่ฟีเจอร์นี้ **ปิดใช้งานโดยค่าเริ่มต้น** (ค่าเริ่มต้น **0**)
    ตั้งเป็นค่าบวกเพื่อเปิดใช้การหมดอายุเมื่อไม่มีการใช้งาน เมื่อเปิดใช้แล้ว ข้อความ **ถัดไป**
    หลังช่วงเวลาที่ไม่มีการใช้งานจะเริ่ม session id ใหม่สำหรับ chat key นั้น
    การทำเช่นนี้ไม่ได้ลบ transcript แต่เพียงเริ่มเซสชันใหม่

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="มีวิธีสร้างทีมของอินสแตนซ์ OpenClaw (CEO หนึ่งคนและ agent หลายตัว) หรือไม่?">
    มี ผ่าน **การกำหนดเส้นทางหลาย agent** และ **sub-agent** คุณสามารถสร้าง agent ผู้ประสานงานหนึ่งตัว
    และ agent ผู้ปฏิบัติงานหลายตัวที่มี workspace และ model ของตัวเอง

    อย่างไรก็ตาม สิ่งนี้เหมาะจะมองว่าเป็น **การทดลองสนุก ๆ** มากกว่า ใช้ token มากและมัก
    มีประสิทธิภาพน้อยกว่าการใช้บอตตัวเดียวกับหลายเซสชัน โมเดลทั่วไปที่เรา
    จินตนาการไว้คือบอตหนึ่งตัวที่คุณคุยด้วย โดยมีเซสชันต่างกันสำหรับงานคู่ขนาน บอตนั้น
    ยังสามารถสร้าง sub-agent ได้เมื่อจำเป็น

    เอกสาร: [การกำหนดเส้นทางหลาย agent](/th/concepts/multi-agent), [Sub-agent](/th/tools/subagents), [CLI ของ Agent](/th/cli/agents)

  </Accordion>

  <Accordion title="ทำไม context จึงถูกตัดกลางงาน? ฉันจะป้องกันได้อย่างไร?">
    context ของเซสชันถูกจำกัดด้วยหน้าต่างของ model แชตยาว ๆ เอาต์พุตเครื่องมือขนาดใหญ่ หรือไฟล์จำนวนมาก
    อาจทำให้เกิด Compaction หรือการตัดทอนได้

    สิ่งที่ช่วยได้:

    - ขอให้บอตสรุปสถานะปัจจุบันและเขียนลงไฟล์
    - ใช้ `/compact` ก่อนงานยาว ๆ และใช้ `/new` เมื่อเปลี่ยนหัวข้อ
    - เก็บ context สำคัญไว้ใน workspace และขอให้บอตอ่านกลับมา
    - ใช้ sub-agent สำหรับงานยาวหรืองานคู่ขนาน เพื่อให้แชตหลักเล็กลง
    - เลือก model ที่มีหน้าต่าง context ใหญ่ขึ้นหากเกิดขึ้นบ่อย

  </Accordion>

  <Accordion title="ฉันจะรีเซ็ต OpenClaw ทั้งหมดแต่ยังคงติดตั้งไว้ได้อย่างไร?">
    ใช้คำสั่ง reset:

    ```bash
    openclaw reset
    ```

    รีเซ็ตทั้งหมดแบบ non-interactive:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    จากนั้นรันการตั้งค่าอีกครั้ง:

    ```bash
    openclaw onboard --install-daemon
    ```

    หมายเหตุ:

    - Onboarding ยังมี **Reset** ให้เลือกหากพบ config ที่มีอยู่ ดู [Onboarding (CLI)](/th/start/wizard)
    - หากคุณใช้ profile (`--profile` / `OPENCLAW_PROFILE`) ให้ reset state dir แต่ละตัว (ค่าเริ่มต้นคือ `~/.openclaw-<profile>`)
    - การ reset สำหรับ dev: `openclaw gateway --dev --reset` (เฉพาะ dev; ล้าง config dev + credentials + sessions + workspace)

  </Accordion>

  <Accordion title='ฉันพบข้อผิดพลาด "context too large" จะรีเซ็ตหรือ compact ได้อย่างไร?'>
    ใช้วิธีใดวิธีหนึ่งต่อไปนี้:

    - **Compact** (เก็บการสนทนาไว้แต่สรุป turn เก่า ๆ):

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

    - เปิดใช้หรือปรับแต่ง **การตัดแต่งเซสชัน** (`agents.defaults.contextPruning`) เพื่อตัดเอาต์พุตเครื่องมือเก่า
    - ใช้ model ที่มีหน้าต่าง context ใหญ่ขึ้น

    เอกสาร: [Compaction](/th/concepts/compaction), [การตัดแต่งเซสชัน](/th/concepts/session-pruning), [การจัดการเซสชัน](/th/concepts/session)

  </Accordion>

  <Accordion title='ทำไมฉันจึงเห็น "LLM request rejected: messages.content.tool_use.input field required"?'>
    นี่เป็นข้อผิดพลาดการตรวจสอบจาก provider: model ส่งบล็อก `tool_use` โดยไม่มี
    `input` ที่จำเป็น โดยปกติหมายความว่าประวัติเซสชันเก่าหรือเสียหาย (มักเกิดหลัง thread ยาว ๆ
    หรือการเปลี่ยนแปลงเครื่องมือ/schema)

    วิธีแก้: เริ่มเซสชันใหม่ด้วย `/new` (เป็นข้อความเดี่ยว)

  </Accordion>

  <Accordion title="ทำไมฉันจึงได้รับข้อความ Heartbeat ทุก 30 นาที?">
    Heartbeat ทำงานทุก **30m** โดยค่าเริ่มต้น (**1h** เมื่อใช้การยืนยันตัวตน OAuth) ปรับแต่งหรือปิดใช้งานได้:

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
    เช่น `# Heading`) OpenClaw จะข้ามการรัน Heartbeat เพื่อประหยัด API call
    หากไฟล์หายไป Heartbeat ยังจะทำงานและให้ model ตัดสินใจว่าจะทำอะไร

    การ override ราย agent ใช้ `agents.list[].heartbeat` เอกสาร: [Heartbeat](/th/gateway/heartbeat)

  </Accordion>

  <Accordion title='ฉันต้องเพิ่ม "bot account" เข้าไปในกลุ่ม WhatsApp หรือไม่?'>
    ไม่ต้อง OpenClaw ทำงานบน **บัญชีของคุณเอง** ดังนั้นถ้าคุณอยู่ในกลุ่ม OpenClaw ก็เห็นกลุ่มนั้นได้
    โดยค่าเริ่มต้น การตอบกลับในกลุ่มจะถูกบล็อกจนกว่าคุณจะอนุญาตผู้ส่ง (`groupPolicy: "allowlist"`)

    หากคุณต้องการให้มีเพียง **คุณ** เท่านั้นที่เรียกการตอบกลับในกลุ่มได้:

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
    ตัวเลือกที่ 1 (เร็วที่สุด): tail logs แล้วส่งข้อความทดสอบในกลุ่ม:

    ```bash
    openclaw logs --follow --json
    ```

    มองหา `chatId` (หรือ `from`) ที่ลงท้ายด้วย `@g.us` เช่น:
    `1234567890-1234567890@g.us`.

    ตัวเลือกที่ 2 (หากตั้งค่า/allowlist ไว้แล้ว): แสดงรายการกลุ่มจาก config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    เอกสาร: [WhatsApp](/th/channels/whatsapp), [Directory](/th/cli/directory), [Logs](/th/cli/logs)

  </Accordion>

  <Accordion title="ทำไม OpenClaw ไม่ตอบกลับในกลุ่ม?">
    สาเหตุที่พบบ่อยมีสองอย่าง:

    - เปิด mention gating อยู่ (ค่าเริ่มต้น) คุณต้อง @mention บอต (หรือ match `mentionPatterns`)
    - คุณตั้งค่า `channels.whatsapp.groups` โดยไม่มี `"*"` และกลุ่มนั้นไม่ได้อยู่ใน allowlist

    ดู [กลุ่ม](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages)

  </Accordion>

  <Accordion title="กลุ่ม/thread ใช้ context ร่วมกับ DM หรือไม่?">
    แชตโดยตรงจะถูกรวมเข้ากับเซสชันหลักโดยค่าเริ่มต้น กลุ่ม/channel มี session key ของตัวเอง และ topic ของ Telegram / thread ของ Discord เป็นเซสชันแยกต่างหาก ดู [กลุ่ม](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages)
  </Accordion>

  <Accordion title="ฉันสร้าง workspace และ agent ได้กี่รายการ?">
    ไม่มีขีดจำกัดตายตัว หลายสิบรายการ (แม้แต่หลายร้อยรายการ) ก็ใช้ได้ แต่ควรระวัง:

    - **การเพิ่มขึ้นของพื้นที่ดิสก์:** sessions + transcripts อยู่ใต้ `~/.openclaw/agents/<agentId>/sessions/`
    - **ค่าใช้จ่าย token:** agent มากขึ้นหมายถึงการใช้ model พร้อมกันมากขึ้น
    - **ภาระงาน ops:** auth profile, workspace และการกำหนดเส้นทาง channel ราย agent

    เคล็ดลับ:

    - เก็บ workspace ที่ **ใช้งานอยู่** หนึ่งรายการต่อ agent (`agents.defaults.workspace`)
    - ตัดเซสชันเก่า (ลบ JSONL หรือรายการใน store) หากพื้นที่ดิสก์เพิ่มขึ้น
    - ใช้ `openclaw doctor` เพื่อตรวจหา workspace ที่หลงเหลือและ profile ที่ไม่ตรงกัน

  </Accordion>

  <Accordion title="ฉันสามารถรันบอทหรือแชทหลายรายการพร้อมกัน (Slack) ได้ไหม และควรตั้งค่าอย่างไร?">
    ได้ ใช้ **การกำหนดเส้นทางแบบหลายเอเจนต์** เพื่อรันเอเจนต์ที่แยกจากกันหลายตัวและกำหนดเส้นทางข้อความขาเข้าตาม
    ช่องทาง/บัญชี/เพียร์ Slack รองรับเป็นช่องทางและสามารถผูกกับเอเจนต์เฉพาะได้

    การเข้าถึงเบราว์เซอร์มีพลังมาก แต่ไม่ใช่แบบ "ทำอะไรก็ได้เหมือนมนุษย์" - ระบบป้องกันบอท, CAPTCHA และ MFA
    ยังคงบล็อกระบบอัตโนมัติได้ สำหรับการควบคุมเบราว์เซอร์ที่เสถียรที่สุด ให้ใช้ Chrome MCP ในเครื่องบนโฮสต์
    หรือใช้ CDP บนเครื่องที่รันเบราว์เซอร์จริง

    การตั้งค่าตามแนวทางปฏิบัติที่ดี:

    - โฮสต์ Gateway ที่เปิดตลอดเวลา (VPS/Mac mini)
    - หนึ่งเอเจนต์ต่อหนึ่งบทบาท (การผูก)
    - ช่องทาง Slack ที่ผูกกับเอเจนต์เหล่านั้น
    - เบราว์เซอร์ในเครื่องผ่าน Chrome MCP หรือ Node เมื่อต้องใช้

    เอกสาร: [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent), [Slack](/th/channels/slack),
    [เบราว์เซอร์](/th/tools/browser), [Nodes](/th/nodes).

  </Accordion>
</AccordionGroup>

## โมเดล, failover และโปรไฟล์การยืนยันตัวตน

ถาม-ตอบเกี่ยวกับโมเดล — ค่าเริ่มต้น, การเลือก, alias, การสลับ, failover, โปรไฟล์การยืนยันตัวตน —
อยู่ใน [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models).

## Gateway: พอร์ต, "กำลังรันอยู่แล้ว" และโหมดระยะไกล

<AccordionGroup>
  <Accordion title="Gateway ใช้พอร์ตใด?">
    `gateway.port` ควบคุมพอร์ตมัลติเพล็กซ์เดียวสำหรับ WebSocket + HTTP (Control UI, hook ฯลฯ)

    ลำดับความสำคัญ:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status จึงบอกว่า "Runtime: running" แต่ "Connectivity probe: failed"?'>
    เพราะ "running" คือมุมมองของ **supervisor** (launchd/systemd/schtasks) ส่วน connectivity probe คือ CLI ที่เชื่อมต่อกับ WebSocket ของ Gateway จริง

    ใช้ `openclaw gateway status` และเชื่อบรรทัดเหล่านี้:

    - `Probe target:` (URL ที่ probe ใช้จริง)
    - `Listening:` (สิ่งที่ bind อยู่บนพอร์ตจริง)
    - `Last gateway error:` (สาเหตุรากที่พบบ่อยเมื่อโปรเซสยังอยู่ แต่พอร์ตไม่ได้ listening)

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status แสดง "Config (cli)" และ "Config (service)" ต่างกัน?'>
    คุณกำลังแก้ไขไฟล์ config หนึ่ง ในขณะที่ service กำลังรันอีกไฟล์หนึ่ง (มักเป็น `--profile` / `OPENCLAW_STATE_DIR` ที่ไม่ตรงกัน)

    วิธีแก้:

    ```bash
    openclaw gateway install --force
    ```

    รันคำสั่งนั้นจาก `--profile` / สภาพแวดล้อมเดียวกับที่คุณต้องการให้ service ใช้

  </Accordion>

  <Accordion title='"another gateway instance is already listening" หมายความว่าอะไร?'>
    OpenClaw บังคับใช้ runtime lock โดย bind WebSocket listener ทันทีตอนเริ่มต้น (ค่าเริ่มต้น `ws://127.0.0.1:18789`) หาก bind ล้มเหลวด้วย `EADDRINUSE` ระบบจะโยน `GatewayLockError` ซึ่งระบุว่ามี instance อื่นกำลัง listening อยู่แล้ว

    วิธีแก้: หยุด instance อื่น, ปล่อยพอร์ตให้ว่าง หรือรันด้วย `openclaw gateway --port <port>`

  </Accordion>

  <Accordion title="ฉันจะรัน OpenClaw ในโหมดระยะไกลได้อย่างไร (ไคลเอนต์เชื่อมต่อไปยัง Gateway ที่อื่น)?">
    ตั้งค่า `gateway.mode: "remote"` และชี้ไปยัง URL WebSocket ระยะไกล โดยอาจใช้ credentials ระยะไกลแบบ shared-secret:

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

    - `openclaw gateway` จะเริ่มทำงานเฉพาะเมื่อ `gateway.mode` เป็น `local` (หรือคุณส่ง flag override)
    - แอป macOS เฝ้าดูไฟล์ config และสลับโหมดแบบ live เมื่อค่าเหล่านี้เปลี่ยน
    - `gateway.remote.token` / `.password` เป็น credentials ระยะไกลฝั่งไคลเอนต์เท่านั้น; ไม่ได้เปิดใช้การยืนยันตัวตนของ Gateway ในเครื่องด้วยตัวเอง

  </Accordion>

  <Accordion title='Control UI บอกว่า "unauthorized" (หรือเชื่อมต่อใหม่ซ้ำ ๆ) ต้องทำอย่างไร?'>
    เส้นทางการยืนยันตัวตนของ Gateway และวิธีการยืนยันตัวตนของ UI ไม่ตรงกัน

    ข้อเท็จจริง (จากโค้ด):

    - Control UI เก็บ token ไว้ใน `sessionStorage` สำหรับ session แท็บเบราว์เซอร์ปัจจุบันและ URL Gateway ที่เลือก ดังนั้นการรีเฟรชในแท็บเดิมยังทำงานต่อได้โดยไม่ต้องคืนค่าการคง token แบบ long-lived ใน localStorage
    - เมื่อเกิด `AUTH_TOKEN_MISMATCH` ไคลเอนต์ที่เชื่อถือได้สามารถลองใหม่แบบมีขอบเขตหนึ่งครั้งด้วย device token ที่แคชไว้ เมื่อ Gateway ส่งคำใบ้ให้ลองใหม่ (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)
    - การลองใหม่ด้วย token ที่แคชไว้นั้นตอนนี้นำ scope ที่อนุมัติแล้วซึ่งเก็บไว้กับ device token กลับมาใช้ ผู้เรียกที่ส่ง `deviceToken` แบบชัดเจน / `scopes` แบบชัดเจนยังคงใช้ชุด scope ที่ร้องขอไว้ แทนการสืบทอด scope ที่แคชไว้
    - นอกเส้นทางลองใหม่นั้น ลำดับความสำคัญของการยืนยันตัวตนขณะเชื่อมต่อคือ shared token/password แบบชัดเจนก่อน จากนั้น `deviceToken` แบบชัดเจน จากนั้น device token ที่เก็บไว้ จากนั้น bootstrap token
    - การตรวจ scope ของ bootstrap token มี prefix ตามบทบาท allowlist operator แบบ built-in สำหรับ bootstrap ตอบสนองเฉพาะคำขอ operator เท่านั้น; Node หรือบทบาทอื่นที่ไม่ใช่ operator ยังต้องมี scope ภายใต้ prefix บทบาทของตนเอง

    วิธีแก้:

    - เร็วที่สุด: `openclaw dashboard` (พิมพ์ + คัดลอก URL dashboard, พยายามเปิด; แสดงคำใบ้ SSH หากเป็น headless)
    - หากคุณยังไม่มี token: `openclaw doctor --generate-gateway-token`
    - หากเป็นระยะไกล ให้ tunnel ก่อน: `ssh -N -L 18789:127.0.0.1:18789 user@host` จากนั้นเปิด `http://127.0.0.1:18789/`
    - โหมด shared-secret: ตั้งค่า `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` จากนั้นวาง secret ที่ตรงกันในการตั้งค่า Control UI
    - โหมด Tailscale Serve: ตรวจสอบว่าเปิดใช้ `gateway.auth.allowTailscale` แล้ว และคุณกำลังเปิด Serve URL ไม่ใช่ URL loopback/tailnet ดิบที่ข้าม header ตัวตนของ Tailscale
    - โหมด trusted-proxy: ตรวจสอบว่าคุณเข้ามาผ่าน proxy ที่รู้ตัวตนตามที่กำหนดค่าไว้ ไม่ใช่ URL Gateway ดิบ proxy แบบ loopback บนโฮสต์เดียวกันยังต้องใช้ `gateway.auth.trustedProxy.allowLoopback = true`
    - หากยังไม่ตรงกันหลังลองใหม่หนึ่งครั้ง ให้หมุน/อนุมัติ device token ที่จับคู่ใหม่:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - หากคำสั่ง rotate นั้นบอกว่าถูกปฏิเสธ ให้ตรวจสอบสองอย่าง:
      - session ของอุปกรณ์ที่จับคู่สามารถหมุนได้เฉพาะ device **ของตัวเอง** เว้นแต่จะมี `operator.admin` ด้วย
      - ค่า `--scope` แบบชัดเจนต้องไม่เกิน scope operator ปัจจุบันของผู้เรียก
    - ยังติดอยู่หรือไม่? รัน `openclaw status --all` และทำตาม [การแก้ไขปัญหา](/th/gateway/troubleshooting) ดู [Dashboard](/th/web/dashboard) สำหรับรายละเอียดการยืนยันตัวตน

  </Accordion>

  <Accordion title="ฉันตั้งค่า gateway.bind เป็น tailnet แต่ bind ไม่ได้และไม่มีอะไร listen">
    การ bind แบบ `tailnet` เลือก IP ของ Tailscale จาก network interface ของคุณ (100.64.0.0/10) หากเครื่องไม่ได้อยู่บน Tailscale (หรือ interface down) ก็ไม่มีอะไรให้ bind

    วิธีแก้:

    - เริ่ม Tailscale บนโฮสต์นั้น (เพื่อให้มีที่อยู่ 100.x), หรือ
    - เปลี่ยนเป็น `gateway.bind: "loopback"` / `"lan"`

    หมายเหตุ: `tailnet` เป็นแบบชัดเจน `auto` จะเลือก loopback ก่อน; ใช้ `gateway.bind: "tailnet"` เมื่อคุณต้องการ bind เฉพาะ tailnet เท่านั้น

  </Accordion>

  <Accordion title="ฉันสามารถรัน Gateway หลายตัวบนโฮสต์เดียวกันได้ไหม?">
    โดยปกติไม่ได้ - Gateway หนึ่งตัวสามารถรันช่องทางรับส่งข้อความและเอเจนต์หลายรายการได้ ใช้ Gateway หลายตัวเฉพาะเมื่อคุณต้องการความซ้ำซ้อน (เช่น บอทกู้คืน) หรือการแยกขาดอย่างเข้มงวด

    ได้ แต่คุณต้องแยก:

    - `OPENCLAW_CONFIG_PATH` (config ต่อ instance)
    - `OPENCLAW_STATE_DIR` (state ต่อ instance)
    - `agents.defaults.workspace` (การแยก workspace)
    - `gateway.port` (พอร์ตไม่ซ้ำกัน)

    การตั้งค่าอย่างรวดเร็ว (แนะนำ):

    - ใช้ `openclaw --profile <name> ...` ต่อ instance (สร้าง `~/.openclaw-<name>` โดยอัตโนมัติ)
    - ตั้งค่า `gateway.port` ที่ไม่ซ้ำใน config ของแต่ละ profile (หรือส่ง `--port` สำหรับการรันด้วยตนเอง)
    - ติดตั้ง service ต่อ profile: `openclaw --profile <name> gateway install`

    Profile ยังเติม suffix ให้ชื่อ service (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`)
    คู่มือฉบับเต็ม: [Gateway หลายตัว](/th/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008 หมายความว่าอะไร?'>
    Gateway เป็น **เซิร์ฟเวอร์ WebSocket** และคาดว่าข้อความแรกสุดจะ
    เป็นเฟรม `connect` หากได้รับอย่างอื่น ระบบจะปิดการเชื่อมต่อ
    ด้วย **code 1008** (การละเมิดนโยบาย)

    สาเหตุที่พบบ่อย:

    - คุณเปิด URL **HTTP** ในเบราว์เซอร์ (`http://...`) แทนที่จะใช้ไคลเอนต์ WS
    - คุณใช้พอร์ตหรือ path ผิด
    - proxy หรือ tunnel ลบ header การยืนยันตัวตน หรือส่งคำขอที่ไม่ใช่ Gateway

    วิธีแก้อย่างรวดเร็ว:

    1. ใช้ URL WS: `ws://<host>:18789` (หรือ `wss://...` หากเป็น HTTPS)
    2. อย่าเปิดพอร์ต WS ในแท็บเบราว์เซอร์ปกติ
    3. หากเปิดการยืนยันตัวตน ให้ใส่ token/password ในเฟรม `connect`

    หากคุณใช้ CLI หรือ TUI URL ควรมีลักษณะดังนี้:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    รายละเอียดโปรโตคอล: [โปรโตคอล Gateway](/th/gateway/protocol).

  </Accordion>
</AccordionGroup>

## การบันทึก log และการ debug

<AccordionGroup>
  <Accordion title="log อยู่ที่ไหน?">
    File logs (มีโครงสร้าง):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    คุณสามารถตั้งค่า path ที่เสถียรผ่าน `logging.file` ได้ ระดับ log ของไฟล์ควบคุมโดย `logging.level` ความละเอียดของ console ควบคุมโดย `--verbose` และ `logging.consoleLevel`

    tail log ที่เร็วที่สุด:

    ```bash
    openclaw logs --follow
    ```

    log ของ service/supervisor (เมื่อ gateway รันผ่าน launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` และ `gateway.err.log` (ค่าเริ่มต้น: `~/.openclaw/logs/...`; profile ใช้ `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    ดูเพิ่มเติมที่ [การแก้ไขปัญหา](/th/gateway/troubleshooting)

  </Accordion>

  <Accordion title="ฉันจะเริ่ม/หยุด/รีสตาร์ท service ของ Gateway ได้อย่างไร?">
    ใช้ตัวช่วย gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณรัน gateway ด้วยตนเอง `openclaw gateway --force` สามารถยึดพอร์ตกลับมาได้ ดู [Gateway](/th/gateway)

  </Accordion>

  <Accordion title="ฉันปิด terminal บน Windows ไปแล้ว - จะรีสตาร์ท OpenClaw ได้อย่างไร?">
    มี **โหมดติดตั้ง Windows สองแบบ**:

    **1) WSL2 (แนะนำ):** Gateway รันอยู่ใน Linux

    เปิด PowerShell, เข้า WSL, จากนั้นรีสตาร์ท:

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

    เอกสาร: [Windows (WSL2)](/th/platforms/windows), [คู่มือปฏิบัติการ service ของ Gateway](/th/gateway).

  </Accordion>

  <Accordion title="Gateway เปิดอยู่แต่ไม่มี reply กลับมา ฉันควรตรวจสอบอะไร?">
    เริ่มด้วยการตรวจสุขภาพอย่างรวดเร็ว:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    สาเหตุที่พบบ่อย:

    - การยืนยันตัวตนของโมเดลไม่ได้โหลดบน **โฮสต์ gateway** (ตรวจ `models status`)
    - การจับคู่ช่องทาง/allowlist บล็อก reply (ตรวจ config ช่องทาง + log)
    - WebChat/Dashboard เปิดอยู่โดยไม่มี token ที่ถูกต้อง

    หากคุณอยู่ระยะไกล ให้ยืนยันว่า tunnel/การเชื่อมต่อ Tailscale เปิดอยู่ และ
    WebSocket ของ Gateway เข้าถึงได้

    เอกสาร: [ช่องทาง](/th/channels), [การแก้ไขปัญหา](/th/gateway/troubleshooting), [การเข้าถึงระยะไกล](/th/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - ต้องทำอย่างไร?'>
    โดยปกติหมายความว่า UI สูญเสียการเชื่อมต่อ WebSocket ตรวจสอบ:

    1. Gateway กำลังทำงานอยู่หรือไม่? `openclaw gateway status`
    2. Gateway มีสถานะปกติหรือไม่? `openclaw status`
    3. UI มีโทเค็นที่ถูกต้องหรือไม่? `openclaw dashboard`
    4. หากเป็นแบบรีโมต ลิงก์ tunnel/Tailscale ทำงานอยู่หรือไม่?

    จากนั้นติดตาม log:

    ```bash
    openclaw logs --follow
    ```

    เอกสาร: [Dashboard](/th/web/dashboard), [การเข้าถึงระยะไกล](/th/gateway/remote), [การแก้ไขปัญหา](/th/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands ล้มเหลว ควรตรวจสอบอะไร?">
    เริ่มจาก log และสถานะ channel:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    จากนั้นเทียบกับข้อผิดพลาด:

    - `BOT_COMMANDS_TOO_MUCH`: เมนู Telegram มีรายการมากเกินไป OpenClaw ตัดให้เหลือเท่าขีดจำกัดของ Telegram และลองใหม่ด้วยจำนวนคำสั่งที่น้อยลงแล้ว แต่ยังต้องตัดรายการเมนูบางรายการออก ลดคำสั่ง plugin/skill/custom หรือปิดใช้งาน `channels.telegram.commands.native` หากคุณไม่ต้องการเมนู
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` หรือข้อผิดพลาดเครือข่ายที่คล้ายกัน: หากคุณอยู่บน VPS หรืออยู่หลัง proxy ให้ยืนยันว่าอนุญาต HTTPS ขาออกและ DNS ใช้งานได้สำหรับ `api.telegram.org`

    หาก Gateway อยู่บนเครื่องระยะไกล ตรวจสอบให้แน่ใจว่าคุณกำลังดู log บนโฮสต์ของ Gateway

    เอกสาร: [Telegram](/th/channels/telegram), [การแก้ไขปัญหา channel](/th/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI ไม่แสดงผลลัพธ์ ควรตรวจสอบอะไร?">
    ก่อนอื่นยืนยันว่าเข้าถึง Gateway ได้และ agent สามารถทำงานได้:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    ใน TUI ให้ใช้ `/status` เพื่อดูสถานะปัจจุบัน หากคุณคาดว่าจะได้รับคำตอบใน chat
    channel ให้ตรวจสอบว่าเปิดใช้งานการส่งแล้ว (`/deliver on`)

    เอกสาร: [TUI](/th/web/tui), [คำสั่ง slash](/th/tools/slash-commands).

  </Accordion>

  <Accordion title="ฉันจะหยุด Gateway ทั้งหมดแล้วเริ่มใหม่ได้อย่างไร?">
    หากคุณติดตั้ง service แล้ว:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    คำสั่งนี้หยุด/เริ่ม **service ที่มีตัวควบคุม** (launchd บน macOS, systemd บน Linux)
    ใช้กรณีที่ Gateway ทำงานอยู่เบื้องหลังเป็น daemon

    หากคุณกำลังรันแบบ foreground ให้หยุดด้วย Ctrl-C แล้วรัน:

    ```bash
    openclaw gateway run
    ```

    เอกสาร: [runbook ของ Gateway service](/th/gateway).

  </Accordion>

  <Accordion title="อธิบายแบบง่าย: openclaw gateway restart กับ openclaw gateway">
    - `openclaw gateway restart`: รีสตาร์ต **background service** (launchd/systemd)
    - `openclaw gateway`: รัน gateway **ใน foreground** สำหรับ session ของ terminal นี้

    หากคุณติดตั้ง service แล้ว ให้ใช้คำสั่ง gateway ใช้ `openclaw gateway` เมื่อ
    คุณต้องการรันครั้งเดียวแบบ foreground

  </Accordion>

  <Accordion title="วิธีที่เร็วที่สุดในการดูรายละเอียดเพิ่มเมื่อมีบางอย่างล้มเหลว">
    เริ่ม Gateway ด้วย `--verbose` เพื่อดูรายละเอียดใน console เพิ่มขึ้น จากนั้นตรวจสอบไฟล์ log สำหรับการยืนยันตัวตนของ channel, การกำหนดเส้นทาง model และข้อผิดพลาด RPC
  </Accordion>
</AccordionGroup>

## สื่อและไฟล์แนบ

<AccordionGroup>
  <Accordion title="Skill ของฉันสร้างรูปภาพ/PDF แต่ไม่มีอะไรถูกส่ง">
    ไฟล์แนบขาออกจาก agent ต้องมีบรรทัด `MEDIA:<path-or-url>` (อยู่ในบรรทัดของตัวเอง) ดู [การตั้งค่า OpenClaw assistant](/th/start/openclaw) และ [Agent send](/th/tools/agent-send)

    การส่งด้วย CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    ตรวจสอบเพิ่มเติม:

    - channel เป้าหมายรองรับสื่อขาออกและไม่ได้ถูกบล็อกด้วย allowlist
    - ไฟล์อยู่ภายในขีดจำกัดขนาดของ provider (รูปภาพจะถูกปรับขนาดให้สูงสุด 2048px)
    - `tools.fs.workspaceOnly=true` จำกัดการส่ง local-path ไว้เฉพาะ workspace, temp/media-store และไฟล์ที่ผ่านการตรวจสอบ sandbox
    - `tools.fs.workspaceOnly=false` อนุญาตให้ `MEDIA:` ส่งไฟล์ host-local ที่ agent อ่านได้อยู่แล้ว แต่เฉพาะสื่อและชนิดเอกสารที่ปลอดภัย (รูปภาพ, เสียง, วิดีโอ, PDF และเอกสาร Office) ไฟล์ plain text และไฟล์ที่ดูเหมือน secret ยังคงถูกบล็อก

    ดู [รูปภาพ](/th/nodes/images).

  </Accordion>
</AccordionGroup>

## ความปลอดภัยและการควบคุมการเข้าถึง

<AccordionGroup>
  <Accordion title="การเปิด OpenClaw ให้รับ DM ขาเข้าปลอดภัยหรือไม่?">
    ปฏิบัติต่อ DM ขาเข้าเป็นข้อมูลนำเข้าที่ไม่น่าเชื่อถือ ค่าเริ่มต้นถูกออกแบบมาเพื่อลดความเสี่ยง:

    - พฤติกรรมเริ่มต้นบน channel ที่รองรับ DM คือ **pairing**:
      - ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing; bot จะไม่ประมวลผลข้อความของพวกเขา
      - อนุมัติด้วย: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - คำขอที่รออนุมัติถูกจำกัดไว้ที่ **3 ต่อ channel**; ตรวจสอบ `openclaw pairing list --channel <channel> [--account <id>]` หากรหัสมาไม่ถึง
    - การเปิด DM ต่อสาธารณะต้อง opt-in อย่างชัดเจน (`dmPolicy: "open"` และ allowlist `"*"`)

    รัน `openclaw doctor` เพื่อแสดงนโยบาย DM ที่มีความเสี่ยง

  </Accordion>

  <Accordion title="prompt injection เป็นเรื่องที่ต้องกังวลเฉพาะ bot สาธารณะหรือไม่?">
    ไม่ใช่ prompt injection เกี่ยวกับ **เนื้อหาที่ไม่น่าเชื่อถือ** ไม่ใช่แค่ใครสามารถ DM หา bot ได้
    หาก assistant ของคุณอ่านข้อความจากภายนอก (web search/fetch, หน้า browser, email,
    เอกสาร, ไฟล์แนบ, log ที่วางเข้ามา) เนื้อหานั้นอาจมีคำสั่งที่พยายาม
    ยึดการควบคุม model ได้ สิ่งนี้เกิดขึ้นได้แม้ว่า **คุณจะเป็นผู้ส่งเพียงคนเดียว**

    ความเสี่ยงใหญ่ที่สุดคือเมื่อเปิดใช้งานเครื่องมือ: model อาจถูกหลอกให้
    ส่งออกบริบทหรือเรียกเครื่องมือแทนคุณ ลด blast radius โดย:

    - ใช้ agent แบบอ่านอย่างเดียวหรือปิดเครื่องมือที่เป็น "reader" เพื่อสรุปเนื้อหาที่ไม่น่าเชื่อถือ
    - ปิด `web_search` / `web_fetch` / `browser` สำหรับ agent ที่เปิดใช้เครื่องมือ
    - ปฏิบัติต่อข้อความจากไฟล์/เอกสารที่ถอดรหัสแล้วว่าไม่น่าเชื่อถือเช่นกัน: OpenResponses
      `input_file` และการสกัดไฟล์แนบสื่อจะห่อข้อความที่สกัดได้ไว้ใน
      marker ขอบเขต external-content ที่ชัดเจน แทนการส่งข้อความไฟล์ดิบ
    - ใช้ sandbox และ allowlist เครื่องมืออย่างเข้มงวด

    รายละเอียด: [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="bot ของฉันควรมี email, บัญชี GitHub หรือหมายเลขโทรศัพท์ของตัวเองหรือไม่?">
    ควรมี สำหรับการตั้งค่าส่วนใหญ่ การแยก bot ด้วยบัญชีและหมายเลขโทรศัพท์ต่างหาก
    ช่วยลด blast radius หากมีบางอย่างผิดพลาด นอกจากนี้ยังทำให้หมุนเวียน
    credentials หรือเพิกถอนการเข้าถึงได้ง่ายขึ้นโดยไม่กระทบบัญชีส่วนตัวของคุณ

    เริ่มจากเล็ก ๆ ให้สิทธิ์เข้าถึงเฉพาะเครื่องมือและบัญชีที่คุณต้องใช้จริง และค่อยขยาย
    ภายหลังหากจำเป็น

    เอกสาร: [ความปลอดภัย](/th/gateway/security), [Pairing](/th/channels/pairing).

  </Accordion>

  <Accordion title="ฉันให้มันมี autonomy เหนือข้อความ text ของฉันได้ไหม และปลอดภัยหรือไม่?">
    เรา **ไม่** แนะนำให้มี autonomy เต็มรูปแบบเหนือข้อความส่วนตัวของคุณ รูปแบบที่ปลอดภัยที่สุดคือ:

    - เก็บ DM ไว้ใน **โหมด pairing** หรือ allowlist ที่เข้มงวด
    - ใช้ **หมายเลขหรือบัญชีแยกต่างหาก** หากคุณต้องการให้มันส่งข้อความแทนคุณ
    - ให้มันร่างข้อความ แล้ว **อนุมัติก่อนส่ง**

    หากคุณต้องการทดลอง ให้ทำบนบัญชีเฉพาะและแยกไว้อย่างชัดเจน ดู
    [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="ฉันใช้ model ที่ถูกกว่าสำหรับงาน personal assistant ได้ไหม?">
    ได้ **หาก** agent เป็นแบบ chat-only และข้อมูลนำเข้าเชื่อถือได้ tier ที่เล็กกว่า
    มีโอกาสถูกยึดคำสั่งได้ง่ายกว่า ดังนั้นหลีกเลี่ยงการใช้กับ agent ที่เปิดใช้เครื่องมือ
    หรือเมื่ออ่านข้อความที่ไม่น่าเชื่อถือ หากจำเป็นต้องใช้ model ที่เล็กกว่า ให้ล็อก
    เครื่องมือให้แน่นและรันภายใน sandbox ดู [ความปลอดภัย](/th/gateway/security).
  </Accordion>

  <Accordion title="ฉันรัน /start ใน Telegram แต่ไม่ได้รหัส pairing">
    รหัส pairing จะถูกส่ง **เฉพาะ** เมื่อผู้ส่งที่ไม่รู้จักส่งข้อความหา bot และ
    เปิดใช้งาน `dmPolicy: "pairing"` แล้ว `/start` เพียงอย่างเดียวจะไม่สร้างรหัส

    ตรวจสอบคำขอที่รออนุมัติ:

    ```bash
    openclaw pairing list telegram
    ```

    หากคุณต้องการเข้าถึงทันที ให้เพิ่ม sender id ของคุณใน allowlist หรือตั้ง `dmPolicy: "open"`
    สำหรับบัญชีนั้น

  </Accordion>

  <Accordion title="WhatsApp: มันจะส่งข้อความหาผู้ติดต่อของฉันหรือไม่? pairing ทำงานอย่างไร?">
    ไม่ นโยบาย DM เริ่มต้นของ WhatsApp คือ **pairing** ผู้ส่งที่ไม่รู้จักจะได้รับเพียงรหัส pairing และข้อความของพวกเขาจะ **ไม่ถูกประมวลผล** OpenClaw จะตอบกลับเฉพาะ chat ที่ได้รับหรือการส่งที่คุณสั่งอย่างชัดเจนเท่านั้น

    อนุมัติ pairing ด้วย:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    แสดงรายการคำขอที่รออนุมัติ:

    ```bash
    openclaw pairing list whatsapp
    ```

    prompt หมายเลขโทรศัพท์ของ wizard: ใช้เพื่อตั้งค่า **allowlist/owner** ของคุณ เพื่อให้ DM ของคุณเองได้รับอนุญาต ไม่ได้ใช้สำหรับการส่งอัตโนมัติ หากคุณรันบนหมายเลข WhatsApp ส่วนตัวของคุณ ให้ใช้หมายเลขนั้นและเปิดใช้งาน `channels.whatsapp.selfChatMode`

  </Accordion>
</AccordionGroup>

## คำสั่ง chat, การยกเลิกงาน และ "มันไม่ยอมหยุด"

<AccordionGroup>
  <Accordion title="ฉันจะหยุดไม่ให้ข้อความระบบภายในแสดงใน chat ได้อย่างไร?">
    ข้อความภายในหรือข้อความจากเครื่องมือส่วนใหญ่จะแสดงเฉพาะเมื่อเปิดใช้งาน **verbose**, **trace** หรือ **reasoning**
    สำหรับ session นั้น

    แก้ไขใน chat ที่คุณเห็น:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    หากยังมีเสียงรบกวนมากเกินไป ให้ตรวจสอบการตั้งค่า session ใน Control UI และตั้ง verbose
    เป็น **inherit** และยืนยันว่าคุณไม่ได้ใช้ bot profile ที่ตั้ง `verboseDefault`
    เป็น `on` ใน config

    เอกสาร: [การคิดและ verbose](/th/tools/thinking), [ความปลอดภัย](/th/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="ฉันจะหยุด/ยกเลิกงานที่กำลังรันได้อย่างไร?">
    ส่งข้อความใดข้อความหนึ่งเหล่านี้ **เป็นข้อความเดี่ยว** (ไม่มี slash):

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

    สิ่งเหล่านี้คือ trigger สำหรับยกเลิก (ไม่ใช่คำสั่ง slash)

    สำหรับกระบวนการเบื้องหลัง (จากเครื่องมือ exec) คุณสามารถขอให้ agent รัน:

    ```
    process action:kill sessionId:XXX
    ```

    ภาพรวมคำสั่ง slash: ดู [คำสั่ง slash](/th/tools/slash-commands)

    คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความ **เดี่ยว** ที่ขึ้นต้นด้วย `/` แต่ shortcut บางรายการ (เช่น `/status`) ใช้แบบ inline ได้ด้วยสำหรับผู้ส่งที่อยู่ใน allowlist

  </Accordion>

  <Accordion title='ฉันจะส่งข้อความ Discord จาก Telegram ได้อย่างไร? ("Cross-context messaging denied")'>
    OpenClaw บล็อกการส่งข้อความ **ข้าม provider** ตามค่าเริ่มต้น หาก tool call ผูกอยู่กับ
    Telegram มันจะไม่ส่งไป Discord เว้นแต่คุณจะอนุญาตอย่างชัดเจน

    เปิดใช้งานการส่งข้อความข้าม provider สำหรับ agent:

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

    รีสตาร์ต gateway หลังแก้ไข config

  </Accordion>

  <Accordion title='ทำไมรู้สึกเหมือน bot "ไม่สนใจ" ข้อความที่ส่งรัว ๆ?'>
    โหมด queue ควบคุมว่าข้อความใหม่โต้ตอบกับ run ที่กำลังทำงานอย่างไร ใช้ `/queue` เพื่อเปลี่ยนโหมด:

    - `steer` - จัดคิว steering ที่รออยู่ทั้งหมดสำหรับขอบเขต model ถัดไปใน run ปัจจุบัน
    - `queue` - steering แบบเดิมทีละรายการ
    - `followup` - รันข้อความทีละรายการ
    - `collect` - รวมข้อความเป็น batch แล้วตอบครั้งเดียว
    - `steer-backlog` - steer ตอนนี้ แล้วประมวลผล backlog
    - `interrupt` - ยกเลิก run ปัจจุบันและเริ่มใหม่

    โหมดเริ่มต้นคือ `steer` คุณสามารถเพิ่มตัวเลือกอย่าง `debounce:0.5s cap:25 drop:summarize` สำหรับโหมด followup ได้ ดู [Command queue](/th/concepts/queue) และ [Steering queue](/th/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## อื่น ๆ

<AccordionGroup>
  <Accordion title='โมเดลเริ่มต้นสำหรับ Anthropic เมื่อใช้ API key คืออะไร?'>
    ใน OpenClaw ข้อมูลรับรองและการเลือกโมเดลเป็นคนละส่วนกัน การตั้งค่า `ANTHROPIC_API_KEY` (หรือจัดเก็บ API key ของ Anthropic ไว้ในโปรไฟล์การยืนยันตัวตน) จะเปิดใช้การยืนยันตัวตน แต่โมเดลเริ่มต้นจริงคือค่าที่คุณกำหนดไว้ใน `agents.defaults.model.primary` (เช่น `anthropic/claude-sonnet-4-6` หรือ `anthropic/claude-opus-4-6`) หากคุณเห็น `No credentials found for profile "anthropic:default"` หมายความว่า Gateway ไม่พบข้อมูลรับรองของ Anthropic ใน `auth-profiles.json` ที่คาดไว้สำหรับเอเจนต์ที่กำลังทำงานอยู่
  </Accordion>
</AccordionGroup>

---

ยังติดขัดอยู่หรือไม่? ถามใน [Discord](https://discord.com/invite/clawd) หรือเปิด [การสนทนาใน GitHub](https://github.com/openclaw/openclaw/discussions)

## ที่เกี่ยวข้อง

- [คำถามที่พบบ่อยสำหรับการใช้งานครั้งแรก](/th/help/faq-first-run) — การติดตั้ง การเริ่มใช้งาน การยืนยันตัวตน การสมัครใช้งาน ความล้มเหลวช่วงแรก
- [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models) — การเลือกโมเดล การสลับไปใช้ตัวสำรอง โปรไฟล์การยืนยันตัวตน
- [การแก้ไขปัญหา](/th/help/troubleshooting) — การคัดแยกปัญหาโดยเริ่มจากอาการ
