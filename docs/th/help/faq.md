---
read_when:
    - การตอบคำถามสนับสนุนทั่วไปเกี่ยวกับการตั้งค่า การติดตั้ง การเริ่มต้นใช้งาน หรือรันไทม์
    - คัดกรองปัญหาที่ผู้ใช้รายงานก่อนการดีบักเชิงลึก
summary: คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า การกำหนดค่า และการใช้งาน OpenClaw
title: คำถามที่พบบ่อย
x-i18n:
    generated_at: "2026-05-02T22:19:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1437a84d7da0e4111edd46297b2a486e2da4f6e4a6cff0d69d6a372e85608130
    source_path: help/faq.md
    workflow: 16
---

คำตอบแบบรวดเร็วพร้อมการแก้ไขปัญหาเชิงลึกสำหรับการตั้งค่าใช้งานจริง (การพัฒนาในเครื่อง, VPS, หลายเอเจนต์, OAuth/API keys, การสลับโมเดลเมื่อขัดข้อง) สำหรับการวินิจฉัยขณะรันไทม์ ดู [การแก้ไขปัญหา](/th/gateway/troubleshooting) สำหรับเอกสารอ้างอิงการกำหนดค่าทั้งหมด ดู [การกำหนดค่า](/th/gateway/configuration)

## 60 วินาทีแรกเมื่อมีบางอย่างเสีย

1. **สถานะด่วน (ตรวจสอบก่อน)**

   ```bash
   openclaw status
   ```

   สรุปในเครื่องอย่างรวดเร็ว: OS + การอัปเดต, การเข้าถึง gateway/service, agents/sessions, provider config + ปัญหารันไทม์ (เมื่อ gateway เข้าถึงได้)

2. **รายงานที่วางได้ (ปลอดภัยสำหรับแชร์)**

   ```bash
   openclaw status --all
   ```

   การวินิจฉัยแบบอ่านอย่างเดียวพร้อม log tail (ปกปิด tokens แล้ว)

3. **สถานะ Daemon + พอร์ต**

   ```bash
   openclaw gateway status
   ```

   แสดง supervisor runtime เทียบกับการเข้าถึง RPC, URL เป้าหมายของ probe และ config ที่ service น่าจะใช้

4. **โพรบเชิงลึก**

   ```bash
   openclaw status --deep
   ```

   รัน live gateway health probe รวมถึง channel probes เมื่อรองรับ
   (ต้องมี gateway ที่เข้าถึงได้) ดู [Health](/th/gateway/health)

5. **ติดตาม log ล่าสุด**

   ```bash
   openclaw logs --follow
   ```

   หาก RPC ล่ม ให้ fallback เป็น:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   File logs แยกจาก service logs; ดู [Logging](/th/logging) และ [การแก้ไขปัญหา](/th/gateway/troubleshooting)

6. **รัน doctor (ซ่อมแซม)**

   ```bash
   openclaw doctor
   ```

   ซ่อมแซม/ย้าย config/state + รัน health checks ดู [Doctor](/th/gateway/doctor)

7. **สแนปช็อต Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   ขอ snapshot แบบเต็มจาก gateway ที่กำลังรันอยู่ (WS-only) ดู [Health](/th/gateway/health)

## การเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก

Q&A สำหรับการรันครั้งแรก — การติดตั้ง, onboard, auth routes, subscriptions, ความล้มเหลวเริ่มต้น —
อยู่ใน [FAQ การรันครั้งแรก](/th/help/faq-first-run)

## OpenClaw คืออะไร?

<AccordionGroup>
  <Accordion title="OpenClaw คืออะไร อธิบายในหนึ่งย่อหน้า?">
    OpenClaw คือผู้ช่วย AI ส่วนตัวที่คุณรันบนอุปกรณ์ของคุณเอง มันตอบกลับบนพื้นที่รับส่งข้อความที่คุณใช้อยู่แล้ว (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat และ Plugin ช่องทางที่บันเดิลมา เช่น QQ Bot) และยังทำเสียง + Canvas สดบนแพลตฟอร์มที่รองรับได้ด้วย **Gateway** คือ control plane ที่เปิดทำงานตลอดเวลา; ผู้ช่วยคือผลิตภัณฑ์
  </Accordion>

  <Accordion title="คุณค่าที่เสนอ">
    OpenClaw ไม่ใช่ "แค่ wrapper ของ Claude" แต่เป็น **control plane แบบ local-first** ที่ให้คุณรัน
    ผู้ช่วยที่มีความสามารถบน **ฮาร์ดแวร์ของคุณเอง** เข้าถึงได้จากแอปแชตที่คุณใช้อยู่แล้ว พร้อม
    stateful sessions, memory และเครื่องมือ - โดยไม่ต้องยกการควบคุมเวิร์กโฟลว์ของคุณให้ SaaS
    ที่โฮสต์ไว้

    จุดเด่น:

    - **อุปกรณ์ของคุณ ข้อมูลของคุณ:** รัน Gateway ได้ทุกที่ที่ต้องการ (Mac, Linux, VPS) และเก็บ
      workspace + session history ไว้ในเครื่อง
    - **ช่องทางจริง ไม่ใช่ web sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/ฯลฯ
      รวมถึงเสียงบนมือถือและ Canvas บนแพลตฟอร์มที่รองรับ
    - **ไม่ผูกกับโมเดลใดโมเดลหนึ่ง:** ใช้ Anthropic, OpenAI, MiniMax, OpenRouter ฯลฯ พร้อมการกำหนดเส้นทาง
      และ failover ต่อเอเจนต์
    - **ตัวเลือกแบบ local-only:** รันโมเดลในเครื่องเพื่อให้ **ข้อมูลทั้งหมดอยู่บนอุปกรณ์ของคุณได้** หากต้องการ
    - **การกำหนดเส้นทางหลายเอเจนต์:** แยกเอเจนต์ตามช่องทาง บัญชี หรืองาน โดยแต่ละตัวมี
      workspace และค่าเริ่มต้นของตัวเอง
    - **โอเพนซอร์สและปรับแต่งได้:** ตรวจสอบ ขยาย และ self-host ได้โดยไม่ติด vendor lock-in

    เอกสาร: [Gateway](/th/gateway), [Channels](/th/channels), [Multi-agent](/th/concepts/multi-agent),
    [Memory](/th/concepts/memory).

  </Accordion>

  <Accordion title="ฉันเพิ่งตั้งค่าเสร็จ - ควรทำอะไรก่อน?">
    โปรเจกต์แรกที่เหมาะ:

    - สร้างเว็บไซต์ (WordPress, Shopify หรือ static site แบบง่าย)
    - ทำต้นแบบแอปมือถือ (outline, screens, API plan)
    - จัดระเบียบไฟล์และโฟลเดอร์ (cleanup, naming, tagging)
    - เชื่อมต่อ Gmail และทำสรุปหรือการติดตามผลแบบอัตโนมัติ

    มันจัดการงานขนาดใหญ่ได้ แต่ทำงานได้ดีที่สุดเมื่อคุณแบ่งงานเป็นเฟสและ
    ใช้ sub agents สำหรับงานแบบขนาน

  </Accordion>

  <Accordion title="กรณีใช้งานประจำวัน 5 อันดับแรกของ OpenClaw คืออะไร?">
    ผลลัพธ์ประจำวันมักมีลักษณะดังนี้:

    - **สรุปส่วนตัว:** สรุป inbox, calendar และข่าวที่คุณสนใจ
    - **ค้นคว้าและร่าง:** ค้นคว้าอย่างรวดเร็ว สรุป และร่างแรกสำหรับอีเมลหรือเอกสาร
    - **เตือนความจำและติดตามผล:** การแจ้งเตือนและ checklist ที่ขับเคลื่อนด้วย Cron หรือ Heartbeat
    - **ทำงานอัตโนมัติในเบราว์เซอร์:** กรอกฟอร์ม รวบรวมข้อมูล และทำงานบนเว็บซ้ำ ๆ
    - **ประสานงานข้ามอุปกรณ์:** ส่งงานจากโทรศัพท์ ให้ Gateway รันบนเซิร์ฟเวอร์ แล้วรับผลกลับในแชต

  </Accordion>

  <Accordion title="OpenClaw ช่วยเรื่อง lead gen, outreach, โฆษณา และบล็อกสำหรับ SaaS ได้ไหม?">
    ได้ สำหรับ **การค้นคว้า การคัดกรอง และการร่าง** มันสามารถสแกนไซต์ สร้าง shortlist
    สรุป prospects และเขียนร่างข้อความ outreach หรือ ad copy ได้

    สำหรับ **outreach หรือการรันโฆษณา** ให้มีมนุษย์อยู่ในวงจรเสมอ หลีกเลี่ยงสแปม ปฏิบัติตามกฎหมายท้องถิ่นและ
    นโยบายแพลตฟอร์ม และตรวจทานทุกอย่างก่อนส่ง รูปแบบที่ปลอดภัยที่สุดคือให้
    OpenClaw ร่าง แล้วคุณอนุมัติ

    เอกสาร: [Security](/th/gateway/security).

  </Accordion>

  <Accordion title="ข้อดีเมื่อเทียบกับ Claude Code สำหรับการพัฒนาเว็บคืออะไร?">
    OpenClaw คือ **ผู้ช่วยส่วนตัว** และเลเยอร์การประสานงาน ไม่ใช่ตัวแทน IDE ใช้
    Claude Code หรือ Codex สำหรับลูปการเขียนโค้ดโดยตรงที่เร็วที่สุดภายใน repo ใช้ OpenClaw เมื่อคุณ
    ต้องการ memory ที่คงอยู่ การเข้าถึงข้ามอุปกรณ์ และการประสานเครื่องมือ

    ข้อดี:

    - **Persistent memory + workspace** ข้าม sessions
    - **การเข้าถึงหลายแพลตฟอร์ม** (WhatsApp, Telegram, TUI, WebChat)
    - **การประสานเครื่องมือ** (browser, files, scheduling, hooks)
    - **Gateway ที่เปิดตลอดเวลา** (รันบน VPS โต้ตอบได้จากทุกที่)
    - **Nodes** สำหรับ local browser/screen/camera/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills และ automation

<AccordionGroup>
  <Accordion title="ฉันจะปรับแต่ง skills โดยไม่ทำให้ repo สกปรกได้อย่างไร?">
    ใช้ managed overrides แทนการแก้ไขสำเนาใน repo ใส่การเปลี่ยนแปลงของคุณใน `~/.openclaw/skills/<name>/SKILL.md` (หรือเพิ่มโฟลเดอร์ผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json`) ลำดับความสำคัญคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` ดังนั้น managed overrides ยังชนะ bundled skills โดยไม่ต้องแตะ git หากต้องการติดตั้ง skill แบบ global แต่ให้มองเห็นเฉพาะบาง agents ให้เก็บสำเนาที่แชร์ไว้ใน `~/.openclaw/skills` และควบคุมการมองเห็นด้วย `agents.defaults.skills` และ `agents.list[].skills` เฉพาะการแก้ไขที่เหมาะส่ง upstream เท่านั้นที่ควรอยู่ใน repo และส่งเป็น PRs
  </Accordion>

  <Accordion title="ฉันโหลด skills จากโฟลเดอร์ที่กำหนดเองได้ไหม?">
    ได้ เพิ่มไดเรกทอรีเพิ่มเติมผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json` (ลำดับความสำคัญต่ำสุด) ลำดับความสำคัญเริ่มต้นคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` `clawhub` ติดตั้งลงใน `./skills` ตามค่าเริ่มต้น ซึ่ง OpenClaw ถือเป็น `<workspace>/skills` ใน session ถัดไป หาก skill ควรมองเห็นเฉพาะบาง agents ให้ใช้ร่วมกับ `agents.defaults.skills` หรือ `agents.list[].skills`
  </Accordion>

  <Accordion title="ฉันใช้โมเดลต่างกันสำหรับงานต่างกันได้อย่างไร?">
    รูปแบบที่รองรับวันนี้คือ:

    - **Cron jobs**: งานที่แยกกันสามารถตั้งค่า override `model` ต่อ job ได้
    - **Sub-agents**: กำหนดเส้นทางงานไปยัง agents แยกที่มีโมเดลค่าเริ่มต้นต่างกัน
    - **สลับตามต้องการ**: ใช้ `/model` เพื่อสลับโมเดลของ session ปัจจุบันได้ทุกเมื่อ

    ดู [Cron jobs](/th/automation/cron-jobs), [Multi-Agent Routing](/th/concepts/multi-agent) และ [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="บอตค้างขณะทำงานหนัก ฉันจะ offload งานนั้นได้อย่างไร?">
    ใช้ **sub-agents** สำหรับงานยาวหรืองานขนาน Sub-agents รันใน session ของตัวเอง
    ส่ง summary กลับมา และทำให้แชตหลักของคุณยังตอบสนองได้

    ขอให้บอตของคุณ "spawn a sub-agent for this task" หรือใช้ `/subagents`
    ใช้ `/status` ในแชตเพื่อดูว่า Gateway กำลังทำอะไรอยู่ตอนนี้ (และยุ่งอยู่หรือไม่)

    เคล็ดลับเรื่อง token: งานยาวและ sub-agents ต่างก็ใช้ tokens หากกังวลเรื่องค่าใช้จ่าย ให้ตั้งค่า
    โมเดลที่ถูกกว่าสำหรับ sub-agents ผ่าน `agents.defaults.subagents.model`

    เอกสาร: [Sub-agents](/th/tools/subagents), [Background Tasks](/th/automation/tasks)

  </Accordion>

  <Accordion title="thread-bound subagent sessions ทำงานอย่างไรบน Discord?">
    ใช้ thread bindings คุณสามารถ bind Discord thread เข้ากับ subagent หรือ session target เพื่อให้ข้อความ follow-up ใน thread นั้นอยู่ใน bound session นั้นต่อไป

    flow พื้นฐาน:

    - Spawn ด้วย `sessions_spawn` โดยใช้ `thread: true` (และเลือกใช้ `mode: "session"` สำหรับ follow-up แบบคงอยู่)
    - หรือ bind ด้วยตัวเองโดยใช้ `/focus <target>`
    - ใช้ `/agents` เพื่อตรวจสอบ binding state
    - ใช้ `/session idle <duration|off>` และ `/session max-age <duration|off>` เพื่อควบคุม auto-unfocus
    - ใช้ `/unfocus` เพื่อ detach thread

    config ที่ต้องใช้:

    - ค่าเริ่มต้น global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
    - overrides ของ Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`
    - Auto-bind เมื่อ spawn: `channels.discord.threadBindings.spawnSessions` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เพื่อปิดใช้งาน thread-bound session spawns

    เอกสาร: [Sub-agents](/th/tools/subagents), [Discord](/th/channels/discord), [Configuration Reference](/th/gateway/configuration-reference), [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="subagent เสร็จแล้ว แต่ completion update ไปผิดที่หรือไม่เคยโพสต์ ควรตรวจอะไร?">
    ตรวจสอบ requester route ที่ resolve แล้วก่อน:

    - การส่ง subagent แบบ completion-mode จะเลือก bound thread หรือ conversation route ใด ๆ ก่อนเมื่อมีอยู่
    - หาก completion origin มีแค่ channel, OpenClaw จะ fallback ไปยัง stored route ของ requester session (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้ direct delivery ยังสำเร็จได้
    - หากไม่มีทั้ง bound route และ stored route ที่ใช้ได้ direct delivery อาจล้มเหลว และผลลัพธ์จะ fallback ไปเป็น queued session delivery แทนการโพสต์ทันทีไปยังแชต
    - targets ที่ไม่ถูกต้องหรือล้าสมัยยังสามารถบังคับให้ queue fallback หรือทำให้ final delivery ล้มเหลวได้
    - หาก assistant reply ล่าสุดที่มองเห็นของ child เป็น silent token ตรงตัว `NO_REPLY` / `no_reply` หรือเป็น `ANNOUNCE_SKIP` ตรงตัว OpenClaw จะระงับ announce โดยตั้งใจแทนการโพสต์ progress ก่อนหน้าที่ล้าสมัย
    - หาก child หมดเวลาหลังจากมีเพียง tool calls, announce อาจยุบสิ่งนั้นเป็น summary สั้น ๆ ของ partial-progress แทนการ replay raw tool output

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [Sub-agents](/th/tools/subagents), [Background Tasks](/th/automation/tasks), [Session Tools](/th/concepts/session-tool)

  </Accordion>

  <Accordion title="Cron หรือ reminders ไม่ทำงาน ควรตรวจอะไร?">
    Cron รันอยู่ภายในกระบวนการ Gateway หาก Gateway ไม่ได้รันอย่างต่อเนื่อง
    scheduled jobs จะไม่รัน

    Checklist:

    - ยืนยันว่า cron เปิดใช้งานอยู่ (`cron.enabled`) และไม่ได้ตั้งค่า `OPENCLAW_SKIP_CRON`
    - ตรวจสอบว่า Gateway รันตลอด 24/7 (ไม่มี sleep/restarts)
    - ตรวจสอบการตั้งค่า timezone สำหรับ job (`--tz` เทียบกับ host timezone)

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    เอกสาร: [Cron jobs](/th/automation/cron-jobs), [Automation & Tasks](/th/automation)

  </Accordion>

  <Accordion title="Cron ทำงานแล้ว แต่ไม่มีอะไรถูกส่งไปยังช่อง เพราะอะไร?">
    ตรวจสอบโหมดการส่งก่อน:

    - `--no-deliver` / `delivery.mode: "none"` หมายความว่าไม่คาดว่าจะมีการส่งสำรองจาก runner
    - เป้าหมายประกาศหายไปหรือไม่ถูกต้อง (`channel` / `to`) หมายความว่า runner ข้ามการส่งออกไปภายนอก
    - การตรวจสอบสิทธิ์ช่องล้มเหลว (`unauthorized`, `Forbidden`) หมายความว่า runner พยายามส่งแล้วแต่ข้อมูลประจำตัวบล็อกไว้
    - ผลลัพธ์แบบแยกที่เงียบ (`NO_REPLY` / `no_reply` เท่านั้น) จะถูกถือว่าตั้งใจให้ส่งไม่ได้ ดังนั้น runner จึงระงับการส่งสำรองที่เข้าคิวไว้ด้วย

    สำหรับงาน Cron แบบแยก agent ยังสามารถส่งโดยตรงด้วยเครื่องมือ `message`
    เมื่อมีเส้นทางแชทพร้อมใช้งาน `--announce` ควบคุมเฉพาะเส้นทางสำรองของ runner
    สำหรับข้อความสุดท้ายที่ agent ยังไม่ได้ส่งเอง

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [งานเบื้องหลัง](/th/automation/tasks).

  </Accordion>

  <Accordion title="ทำไมการรัน Cron แบบแยกจึงสลับโมเดลหรือลองใหม่หนึ่งครั้ง?">
    โดยปกตินั่นคือเส้นทางสลับโมเดลแบบสด ไม่ใช่การตั้งเวลาซ้ำ

    Cron แบบแยกสามารถบันทึกการส่งต่อโมเดลขณะรันไทม์และลองใหม่เมื่อการรันที่ใช้งานอยู่
    โยน `LiveSessionModelSwitchError` การลองใหม่จะเก็บ provider/model ที่สลับแล้วไว้
    และถ้าการสลับมีการแทนที่โปรไฟล์การตรวจสอบสิทธิ์ใหม่ Cron
    จะบันทึกค่านั้นไว้ด้วยก่อนลองใหม่

    กฎการเลือกที่เกี่ยวข้อง:

    - การแทนที่โมเดลของ Gmail hook ชนะก่อนเมื่อใช้ได้
    - จากนั้น `model` ต่อแต่ละงาน
    - จากนั้นการแทนที่โมเดลของ cron-session ที่จัดเก็บไว้
    - จากนั้นการเลือกโมเดลปกติของ agent/ค่าเริ่มต้น

    ลูปการลองใหม่มีขอบเขต หลังจากความพยายามครั้งแรกบวกกับการลองใหม่จากการสลับ 2 ครั้ง
    Cron จะยกเลิกแทนที่จะวนซ้ำตลอดไป

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [Cron CLI](/th/cli/cron).

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
    ซิงค์ Skills ของคุณเอง สำหรับการติดตั้งแบบแชร์ข้าม agents ให้วาง Skill ไว้ใต้
    `~/.openclaw/skills` และใช้ `agents.defaults.skills` หรือ
    `agents.list[].skills` หากคุณต้องการจำกัดว่า agents ใดมองเห็นได้

  </Accordion>

  <Accordion title="OpenClaw สามารถรันงานตามกำหนดเวลาหรือทำงานต่อเนื่องในเบื้องหลังได้หรือไม่?">
    ได้ ใช้ตัวตั้งเวลาของ Gateway:

    - **งาน Cron** สำหรับงานตามกำหนดเวลาหรืองานที่เกิดซ้ำ (คงอยู่หลังรีสตาร์ต)
    - **Heartbeat** สำหรับการตรวจสอบเป็นระยะของ "main session"
    - **งานแบบแยก** สำหรับ agents อัตโนมัติที่โพสต์สรุปหรือส่งไปยังแชท

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [ระบบอัตโนมัติและงาน](/th/automation),
    [Heartbeat](/th/gateway/heartbeat).

  </Accordion>

  <Accordion title="ฉันสามารถรัน Skills ที่ใช้ได้เฉพาะ Apple macOS จาก Linux ได้หรือไม่?">
    ไม่ได้โดยตรง Skills ของ macOS ถูกจำกัดด้วย `metadata.openclaw.os` พร้อมไบนารีที่จำเป็น และ Skills จะปรากฏใน system prompt เฉพาะเมื่อมีสิทธิ์ใช้งานบน **โฮสต์ Gateway** บน Linux Skills ที่ใช้ได้เฉพาะ `darwin` (เช่น `apple-notes`, `apple-reminders`, `things-mac`) จะไม่โหลด เว้นแต่คุณจะแทนที่การจำกัดสิทธิ์

    คุณมีรูปแบบที่รองรับสามแบบ:

    **ตัวเลือก A - รัน Gateway บน Mac (ง่ายที่สุด).**
    รัน Gateway ในที่ที่มีไบนารีของ macOS อยู่ จากนั้นเชื่อมต่อจาก Linux ใน [โหมดระยะไกล](#gateway-ports-already-running-and-remote-mode) หรือผ่าน Tailscale Skills จะโหลดตามปกติเพราะโฮสต์ Gateway คือ macOS

    **ตัวเลือก B - ใช้ Node ของ macOS (ไม่มี SSH).**
    รัน Gateway บน Linux จับคู่ Node ของ macOS (แอปใน menubar) และตั้งค่า **Node Run Commands** เป็น "Always Ask" หรือ "Always Allow" บน Mac OpenClaw สามารถถือว่า Skills ที่ใช้ได้เฉพาะ macOS มีสิทธิ์ใช้งานเมื่อไบนารีที่จำเป็นมีอยู่บน Node agent จะรัน Skills เหล่านั้นผ่านเครื่องมือ `nodes` หากคุณเลือก "Always Ask" การอนุมัติ "Always Allow" ในพรอมต์จะเพิ่มคำสั่งนั้นลงใน allowlist

    **ตัวเลือก C - พร็อกซีไบนารีของ macOS ผ่าน SSH (ขั้นสูง).**
    เก็บ Gateway ไว้บน Linux แต่ทำให้ไบนารี CLI ที่จำเป็น resolve ไปยัง SSH wrappers ที่รันบน Mac จากนั้นแทนที่ Skill เพื่ออนุญาต Linux เพื่อให้ยังคงมีสิทธิ์ใช้งาน

    1. สร้าง SSH wrapper สำหรับไบนารี (ตัวอย่าง: `memo` สำหรับ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. วาง wrapper บน `PATH` บนโฮสต์ Linux (เช่น `~/bin/memo`)
    3. แทนที่ metadata ของ Skill (workspace หรือ `~/.openclaw/skills`) เพื่ออนุญาต Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. เริ่ม session ใหม่เพื่อให้ snapshot ของ Skills รีเฟรช

  </Accordion>

  <Accordion title="มีการผสานรวม Notion หรือ HeyGen หรือไม่?">
    ยังไม่มีในตัววันนี้

    ตัวเลือก:

    - **Skill / Plugin แบบกำหนดเอง:** เหมาะที่สุดสำหรับการเข้าถึง API ที่เชื่อถือได้ (Notion/HeyGen ทั้งคู่มี APIs)
    - **ระบบอัตโนมัติของเบราว์เซอร์:** ใช้ได้โดยไม่ต้องเขียนโค้ด แต่ช้ากว่าและเปราะบางกว่า

    หากคุณต้องการเก็บ context ต่อไคลเอนต์ (เวิร์กโฟลว์ของเอเจนซี) รูปแบบง่ายๆ คือ:

    - หนึ่งหน้า Notion ต่อไคลเอนต์ (context + การตั้งค่า + งานที่ใช้งานอยู่)
    - ขอให้ agent ดึงหน้านั้นเมื่อเริ่ม session

    หากคุณต้องการการผสานรวมแบบเนทีฟ ให้เปิดคำขอฟีเจอร์หรือสร้าง Skill
    ที่มุ่งเป้าไปยัง APIs เหล่านั้น

    ติดตั้ง Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    การติดตั้งแบบเนทีฟจะอยู่ในไดเรกทอรี `skills/` ของ workspace ที่ใช้งานอยู่ สำหรับ Skills แบบแชร์ข้าม agents ให้วางไว้ใน `~/.openclaw/skills/<name>/SKILL.md` หากควรให้เพียงบาง agents มองเห็นการติดตั้งแบบแชร์ ให้กำหนดค่า `agents.defaults.skills` หรือ `agents.list[].skills` Skills บางรายการคาดหวังไบนารีที่ติดตั้งผ่าน Homebrew; บน Linux หมายถึง Linuxbrew (ดูรายการ FAQ ของ Homebrew Linux ด้านบน) ดู [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config), และ [ClawHub](/th/tools/clawhub).

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

    เส้นทางนี้สามารถใช้เบราว์เซอร์โฮสต์ภายในเครื่องหรือ Node เบราว์เซอร์ที่เชื่อมต่ออยู่ หาก Gateway รันอยู่ที่อื่น ให้รันโฮสต์ Node บนเครื่องเบราว์เซอร์หรือใช้ CDP ระยะไกลแทน

    ขีดจำกัดปัจจุบันของ `existing-session` / `user`:

    - การดำเนินการอิงตาม ref ไม่ใช่ CSS selector
    - การอัปโหลดต้องใช้ `ref` / `inputRef` และปัจจุบันรองรับครั้งละหนึ่งไฟล์
    - `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการดำเนินการแบบ batch ยังต้องใช้เบราว์เซอร์ที่จัดการหรือโปรไฟล์ CDP ดิบ

  </Accordion>
</AccordionGroup>

## Sandboxing และหน่วยความจำ

<AccordionGroup>
  <Accordion title="มีเอกสาร Sandboxing เฉพาะหรือไม่?">
    มี ดู [Sandboxing](/th/gateway/sandboxing) สำหรับการตั้งค่าเฉพาะ Docker (Gateway เต็มรูปแบบใน Docker หรืออิมเมจ sandbox) ดู [Docker](/th/install/docker)
  </Accordion>

  <Accordion title="Docker ดูจำกัด - ฉันจะเปิดใช้ฟีเจอร์เต็มรูปแบบได้อย่างไร?">
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยเป็นอันดับแรกและรันเป็นผู้ใช้ `node` จึงไม่
    รวม system packages, Homebrew หรือเบราว์เซอร์ที่ bundled ไว้ สำหรับการตั้งค่าที่ครบถ้วนกว่า:

    - คงอยู่ `/home/node` ด้วย `OPENCLAW_HOME_VOLUME` เพื่อให้แคชอยู่รอด
    - อบ system deps เข้าไปในอิมเมจด้วย `OPENCLAW_DOCKER_APT_PACKAGES`
    - ติดตั้งเบราว์เซอร์ Playwright ผ่าน CLI ที่ bundled ไว้:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` และตรวจสอบให้แน่ใจว่า path นั้นถูกคงอยู่

    เอกสาร: [Docker](/th/install/docker), [เบราว์เซอร์](/th/tools/browser).

  </Accordion>

  <Accordion title="ฉันสามารถเก็บ DMs เป็นส่วนตัว แต่ทำให้กลุ่มเป็นสาธารณะ/อยู่ใน sandbox ด้วย agent เดียวได้หรือไม่?">
    ได้ - หากทราฟฟิกส่วนตัวของคุณคือ **DMs** และทราฟฟิกสาธารณะของคุณคือ **groups**

    ใช้ `agents.defaults.sandbox.mode: "non-main"` เพื่อให้ sessions ของกลุ่ม/ช่อง (คีย์ที่ไม่ใช่ main) รันใน backend sandbox ที่กำหนดค่าไว้ ขณะที่ session DM หลักยังอยู่บนโฮสต์ Docker คือ backend เริ่มต้นหากคุณไม่ได้เลือกอย่างใดอย่างหนึ่ง จากนั้นจำกัดว่าเครื่องมือใดพร้อมใช้งานใน sessions ที่อยู่ใน sandbox ผ่าน `tools.sandbox.tools`

    คำแนะนำการตั้งค่า + ตัวอย่าง config: [กลุ่ม: DMs ส่วนตัว + กลุ่มสาธารณะ](/th/channels/groups#pattern-personal-dms-public-groups-single-agent)

    อ้างอิง config หลัก: [การกำหนดค่า Gateway](/th/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ฉันจะ bind โฟลเดอร์ของโฮสต์เข้าไปใน sandbox ได้อย่างไร?">
    ตั้งค่า `agents.defaults.sandbox.docker.binds` เป็น `["host:path:mode"]` (เช่น `"/home/user/src:/src:ro"`) binds แบบ global + ต่อ agent จะ merge กัน; binds ต่อ agent จะถูกละเว้นเมื่อ `scope: "shared"` ใช้ `:ro` สำหรับสิ่งที่ละเอียดอ่อนและจำไว้ว่า binds ข้ามกำแพง filesystem ของ sandbox

    OpenClaw ตรวจสอบแหล่งที่มาของ bind กับทั้ง path ที่ normalized และ path แบบ canonical ที่ resolve ผ่าน ancestor ที่ลึกที่สุดซึ่งมีอยู่ นั่นหมายความว่าการหลุดออกผ่าน symlink-parent ยัง fail closed แม้ segment สุดท้ายของ path จะยังไม่มีอยู่ และการตรวจสอบ allowed-root ยังใช้หลังจากการ resolve symlink

    ดู [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts) และ [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) สำหรับตัวอย่างและหมายเหตุด้านความปลอดภัย

  </Accordion>

  <Accordion title="หน่วยความจำทำงานอย่างไร?">
    หน่วยความจำของ OpenClaw เป็นเพียงไฟล์ Markdown ใน workspace ของ agent:

    - บันทึกรายวันใน `memory/YYYY-MM-DD.md`
    - บันทึกระยะยาวที่คัดสรรใน `MEMORY.md` (เฉพาะ sessions หลัก/ส่วนตัว)

    OpenClaw ยังรัน **การล้างหน่วยความจำก่อน Compaction แบบเงียบ** เพื่อเตือนโมเดล
    ให้เขียนบันทึกที่คงทนก่อน auto-compaction สิ่งนี้จะรันเฉพาะเมื่อ workspace
    เขียนได้ (sandbox แบบอ่านอย่างเดียวจะข้ามไป) ดู [หน่วยความจำ](/th/concepts/memory).

  </Accordion>

  <Accordion title="หน่วยความจำลืมสิ่งต่างๆ อยู่เรื่อยๆ ฉันจะทำให้มันจำได้อย่างไร?">
    ขอให้บอต **เขียนข้อเท็จจริงลงในหน่วยความจำ** บันทึกระยะยาวควรอยู่ใน `MEMORY.md`,
    context ระยะสั้นอยู่ใน `memory/YYYY-MM-DD.md`

    นี่ยังเป็นส่วนที่เรากำลังปรับปรุง การเตือนโมเดลให้จัดเก็บความทรงจำช่วยได้;
    โมเดลจะรู้ว่าต้องทำอะไร หากยังลืมอยู่ ให้ตรวจสอบว่า Gateway ใช้
    workspace เดียวกันในทุกการรัน

    เอกสาร: [หน่วยความจำ](/th/concepts/memory), [workspace ของ agent](/th/concepts/agent-workspace).

  </Accordion>

  <Accordion title="หน่วยความจำคงอยู่ตลอดไปหรือไม่? มีขีดจำกัดอะไรบ้าง?">
    ไฟล์หน่วยความจำอยู่บนดิสก์และคงอยู่จนกว่าคุณจะลบ ขีดจำกัดคือ
    พื้นที่จัดเก็บของคุณ ไม่ใช่โมเดล **session context** ยังคงถูกจำกัดโดย
    context window ของโมเดล ดังนั้นบทสนทนายาวๆ อาจถูก compact หรือตัดทอนได้ นั่นคือเหตุผลที่
    มีการค้นหาหน่วยความจำ - มันดึงเฉพาะส่วนที่เกี่ยวข้องกลับเข้า context

    เอกสาร: [หน่วยความจำ](/th/concepts/memory), [Context](/th/concepts/context).

  </Accordion>

  <Accordion title="การค้นหาหน่วยความจำเชิงความหมายต้องใช้คีย์ OpenAI API หรือไม่?">
    ต้องใช้เฉพาะเมื่อคุณใช้ **OpenAI embeddings** เท่านั้น Codex OAuth ครอบคลุมแชต/การเติมคำและ
    **ไม่ได้** ให้สิทธิ์เข้าถึง embeddings ดังนั้น **การลงชื่อเข้าใช้ด้วย Codex (OAuth หรือ
    การเข้าสู่ระบบ Codex CLI)** จึงไม่ช่วยสำหรับการค้นหาหน่วยความจำเชิงความหมาย OpenAI embeddings
    ยังต้องใช้คีย์ API จริง (`OPENAI_API_KEY` หรือ `models.providers.openai.apiKey`)

    หากคุณไม่ได้ตั้งค่าผู้ให้บริการไว้อย่างชัดเจน OpenClaw จะเลือกผู้ให้บริการอัตโนมัติเมื่อ
    สามารถหา API key ได้ (โปรไฟล์การยืนยันตัวตน, `models.providers.*.apiKey` หรือ env vars)
    โดยจะเลือก OpenAI ก่อนหากหา OpenAI key ได้ มิฉะนั้นจะเลือก Gemini หากหา Gemini key
    ได้ จากนั้น Voyage และ Mistral ตามลำดับ หากไม่มี remote key ให้ใช้ การค้นหา
    หน่วยความจำจะยังปิดใช้งานอยู่จนกว่าคุณจะกำหนดค่า หากคุณมี local model path
    ที่กำหนดค่าไว้และมีอยู่จริง OpenClaw
    จะเลือก `local` ก่อน Ollama รองรับเมื่อคุณตั้งค่าไว้อย่างชัดเจนว่า
    `memorySearch.provider = "ollama"`

    หากคุณต้องการใช้งานในเครื่อง ให้ตั้งค่า `memorySearch.provider = "local"` (และอาจตั้งค่า
    `memorySearch.fallback = "none"` ด้วย) หากคุณต้องการ Gemini embeddings ให้ตั้งค่า
    `memorySearch.provider = "gemini"` และระบุ `GEMINI_API_KEY` (หรือ
    `memorySearch.remote.apiKey`) เรารองรับโมเดล embedding แบบ **OpenAI, Gemini, Voyage, Mistral, Ollama หรือ local**
    ดูรายละเอียดการตั้งค่าได้ที่ [หน่วยความจำ](/th/concepts/memory)

  </Accordion>
</AccordionGroup>

## สิ่งต่างๆ อยู่ที่ใดบนดิสก์

<AccordionGroup>
  <Accordion title="ข้อมูลทั้งหมดที่ใช้กับ OpenClaw ถูกบันทึกไว้ในเครื่องหรือไม่?">
    ไม่ใช่ - **สถานะของ OpenClaw อยู่ในเครื่อง** แต่ **บริการภายนอกยังเห็นสิ่งที่คุณส่งให้บริการเหล่านั้น**

    - **อยู่ในเครื่องโดยค่าเริ่มต้น:** เซสชัน, ไฟล์หน่วยความจำ, config และ workspace อยู่บนโฮสต์ Gateway
      (`~/.openclaw` + ไดเรกทอรี workspace ของคุณ)
    - **อยู่ระยะไกลตามความจำเป็น:** ข้อความที่คุณส่งไปยังผู้ให้บริการโมเดล (Anthropic/OpenAI/ฯลฯ) จะไปยัง
      API ของพวกเขา และแพลตฟอร์มแชต (WhatsApp/Telegram/Slack/ฯลฯ) จะเก็บข้อมูลข้อความไว้บน
      เซิร์ฟเวอร์ของตน
    - **คุณควบคุมขอบเขตข้อมูลได้:** การใช้โมเดลในเครื่องจะเก็บพรอมป์ไว้บนเครื่องของคุณ แต่ทราฟฟิกของช่องทาง
      ยังคงผ่านเซิร์ฟเวอร์ของช่องทางนั้น

    ที่เกี่ยวข้อง: [workspace ของเอเจนต์](/th/concepts/agent-workspace), [หน่วยความจำ](/th/concepts/memory)

  </Accordion>

  <Accordion title="OpenClaw เก็บข้อมูลไว้ที่ใด?">
    ทุกอย่างอยู่ใต้ `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`):

    | เส้นทาง                                                         | วัตถุประสงค์                                                       |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | config หลัก (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | การนำเข้า OAuth แบบเดิม (คัดลอกเข้าโปรไฟล์การยืนยันตัวตนเมื่อใช้ครั้งแรก) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | โปรไฟล์การยืนยันตัวตน (OAuth, API keys และ `keyRef`/`tokenRef` แบบไม่บังคับ) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | payload ความลับที่หนุนด้วยไฟล์แบบไม่บังคับสำหรับผู้ให้บริการ SecretRef แบบ `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ไฟล์ความเข้ากันได้แบบเดิม (ล้างรายการ `api_key` แบบคงที่แล้ว)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | สถานะผู้ให้บริการ (เช่น `whatsapp/<accountId>/creds.json`)        |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | สถานะต่อเอเจนต์ (agentDir + เซสชัน)                                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | ประวัติการสนทนาและสถานะ (ต่อเอเจนต์)                               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | เมตาดาต้าเซสชัน (ต่อเอเจนต์)                                      |

    เส้นทางแบบเอเจนต์เดียวเดิม: `~/.openclaw/agent/*` (ย้ายโดย `openclaw doctor`)

    **workspace** ของคุณ (AGENTS.md, ไฟล์หน่วยความจำ, skills ฯลฯ) แยกต่างหากและกำหนดค่าผ่าน `agents.defaults.workspace` (ค่าเริ่มต้น: `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md ควรอยู่ที่ใด?">
    ไฟล์เหล่านี้อยู่ใน **agent workspace** ไม่ใช่ `~/.openclaw`

    - **Workspace (ต่อเอเจนต์)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` แบบไม่บังคับ
      root `memory.md` ตัวพิมพ์เล็กเป็นอินพุตซ่อมแซมแบบเดิมเท่านั้น; `openclaw doctor --fix`
      สามารถรวมเข้าใน `MEMORY.md` ได้เมื่อทั้งสองไฟล์มีอยู่
    - **State dir (`~/.openclaw`)**: config, สถานะช่องทาง/ผู้ให้บริการ, โปรไฟล์การยืนยันตัวตน, เซสชัน, บันทึก
      และ Skills ที่ใช้ร่วมกัน (`~/.openclaw/skills`)

    workspace เริ่มต้นคือ `~/.openclaw/workspace` กำหนดค่าได้ผ่าน:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    หากบอท "ลืม" หลังรีสตาร์ต ให้ยืนยันว่า Gateway ใช้
    workspace เดียวกันทุกครั้งที่เริ่มทำงาน (และจำไว้ว่า: โหมดระยะไกลใช้
    workspace ของ **โฮสต์ gateway** ไม่ใช่แล็ปท็อปในเครื่องของคุณ)

    เคล็ดลับ: หากคุณต้องการพฤติกรรมหรือค่ากำหนดที่คงทน ให้ขอให้บอท **เขียนลงใน
    AGENTS.md หรือ MEMORY.md** แทนการพึ่งพาประวัติแชต

    ดู [workspace ของเอเจนต์](/th/concepts/agent-workspace) และ [หน่วยความจำ](/th/concepts/memory)

  </Accordion>

  <Accordion title="กลยุทธ์สำรองข้อมูลที่แนะนำ">
    ใส่ **agent workspace** ของคุณไว้ใน git repo แบบ **ส่วนตัว** และสำรองไว้ในที่
    ส่วนตัว (เช่น GitHub private) วิธีนี้จะเก็บหน่วยความจำ + ไฟล์ AGENTS/SOUL/USER
    และช่วยให้คุณกู้คืน "จิตใจ" ของผู้ช่วยได้ภายหลัง

    **อย่า** commit สิ่งใดภายใต้ `~/.openclaw` (ข้อมูลรับรอง, เซสชัน, โทเค็น หรือ payload ความลับที่เข้ารหัส)
    หากคุณต้องการกู้คืนแบบเต็ม ให้สำรองทั้ง workspace และไดเรกทอรีสถานะ
    แยกกัน (ดูคำถามเรื่องการย้ายข้อมูลด้านบน)

    เอกสาร: [workspace ของเอเจนต์](/th/concepts/agent-workspace)

  </Accordion>

  <Accordion title="ฉันจะถอนการติดตั้ง OpenClaw ทั้งหมดได้อย่างไร?">
    ดูคู่มือเฉพาะ: [ถอนการติดตั้ง](/th/install/uninstall)
  </Accordion>

  <Accordion title="เอเจนต์ทำงานนอก workspace ได้หรือไม่?">
    ได้ workspace คือ **default cwd** และจุดยึดหน่วยความจำ ไม่ใช่ sandbox แบบเข้มงวด
    เส้นทางแบบสัมพัทธ์จะ resolve ภายใน workspace แต่เส้นทางแบบ absolute สามารถเข้าถึงตำแหน่งอื่นบน
    โฮสต์ได้ เว้นแต่จะเปิดใช้ sandboxing หากคุณต้องการการแยกส่วน ให้ใช้
    [`agents.defaults.sandbox`](/th/gateway/sandboxing) หรือการตั้งค่า sandbox ต่อเอเจนต์ หากคุณ
    ต้องการให้ repo เป็นไดเรกทอรีทำงานเริ่มต้น ให้ชี้ `workspace` ของเอเจนต์นั้น
    ไปที่ root ของ repo repo ของ OpenClaw เป็นเพียงซอร์สโค้ดเท่านั้น; แยก
    workspace ไว้ต่างหาก เว้นแต่คุณตั้งใจให้เอเจนต์ทำงานภายในนั้น

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
    สถานะเซสชันเป็นของ **โฮสต์ gateway** หากคุณอยู่ในโหมดระยะไกล session store ที่คุณสนใจจะอยู่บนเครื่องระยะไกล ไม่ใช่แล็ปท็อปในเครื่องของคุณ ดู [การจัดการเซสชัน](/th/concepts/session)
  </Accordion>
</AccordionGroup>

## พื้นฐาน config

<AccordionGroup>
  <Accordion title="config ใช้รูปแบบใด? อยู่ที่ใด?">
    OpenClaw อ่าน config **JSON5** แบบไม่บังคับจาก `$OPENCLAW_CONFIG_PATH` (ค่าเริ่มต้น: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    หากไม่มีไฟล์ ระบบจะใช้ค่าเริ่มต้นที่ค่อนข้างปลอดภัย (รวมถึง workspace เริ่มต้นที่ `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title='ฉันตั้งค่า gateway.bind: "lan" (หรือ "tailnet") แล้วตอนนี้ไม่มีอะไร listen / UI แจ้งว่า unauthorized'>
    การ bind แบบ non-loopback **ต้องมีเส้นทางการยืนยันตัวตน gateway ที่ถูกต้อง** ในทางปฏิบัติหมายความว่า:

    - การยืนยันตัวตนแบบ shared-secret: โทเค็นหรือรหัสผ่าน
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

    - `gateway.remote.token` / `.password` **ไม่ได้** เปิดใช้การยืนยันตัวตน gateway ในเครื่องด้วยตัวเอง
    - เส้นทางการเรียกในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
    - สำหรับการยืนยันตัวตนด้วยรหัสผ่าน ให้ตั้งค่า `gateway.auth.mode: "password"` พร้อม `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`) แทน
    - หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าไว้อย่างชัดเจนผ่าน SecretRef และ resolve ไม่ได้ การ resolve จะล้มเหลวแบบปิด (ไม่มี remote fallback มาบัง)
    - การตั้งค่า Control UI แบบ shared-secret ยืนยันตัวตนผ่าน `connect.params.auth.token` หรือ `connect.params.auth.password` (เก็บไว้ในการตั้งค่า app/UI) โหมดที่มีตัวตน เช่น Tailscale Serve หรือ `trusted-proxy` ใช้ request headers แทน หลีกเลี่ยงการใส่ shared secrets ใน URL
    - ด้วย `gateway.auth.mode: "trusted-proxy"` reverse proxies แบบ loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน และมีรายการ loopback ใน `gateway.trustedProxies`

  </Accordion>

  <Accordion title="ทำไมตอนนี้ฉันต้องใช้โทเค็นบน localhost?">
    OpenClaw บังคับใช้การยืนยันตัวตนของ gateway โดยค่าเริ่มต้น รวมถึง loopback ในเส้นทางเริ่มต้นปกติ หมายความว่าเป็นการยืนยันตัวตนด้วยโทเค็น: หากไม่ได้กำหนดเส้นทางการยืนยันตัวตนไว้อย่างชัดเจน การเริ่มต้น gateway จะ resolve เป็นโหมดโทเค็นและสร้างโทเค็นให้โดยอัตโนมัติ พร้อมบันทึกลงใน `gateway.auth.token` ดังนั้น **ไคลเอนต์ WS ในเครื่องต้องยืนยันตัวตน** วิธีนี้ป้องกันกระบวนการอื่นในเครื่องไม่ให้เรียก Gateway

    หากคุณต้องการเส้นทางการยืนยันตัวตนแบบอื่น คุณสามารถเลือกโหมดรหัสผ่านอย่างชัดเจนได้ (หรือ `trusted-proxy` สำหรับ reverse proxies ที่รับรู้ตัวตน) หากคุณ **ต้องการจริงๆ** ให้เปิด loopback ให้ตั้งค่า `gateway.auth.mode: "none"` อย่างชัดเจนใน config ของคุณ Doctor สามารถสร้างโทเค็นให้คุณได้ทุกเมื่อ: `openclaw doctor --generate-gateway-token`

  </Accordion>

  <Accordion title="ฉันต้องรีสตาร์ตหลังเปลี่ยน config หรือไม่?">
    Gateway เฝ้าดู config และรองรับ hot-reload:

    - `gateway.reload.mode: "hybrid"` (ค่าเริ่มต้น): ใช้การเปลี่ยนแปลงที่ปลอดภัยแบบ hot-apply และรีสตาร์ตสำหรับรายการสำคัญ
    - รองรับ `hot`, `restart`, `off` ด้วย

  </Accordion>

  <Accordion title="ฉันจะปิด tagline ตลกๆ ของ CLI ได้อย่างไร?">
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

    - `off`: ซ่อนข้อความ tagline แต่คงบรรทัดชื่อ/เวอร์ชันของ banner ไว้
    - `default`: ใช้ `All your chats, one OpenClaw.` ทุกครั้ง
    - `random`: tagline ตลก/ตามฤดูกาลแบบหมุนเวียน (พฤติกรรมเริ่มต้น)
    - หากคุณไม่ต้องการ banner เลย ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

  </Accordion>

  <Accordion title="ฉันจะเปิดใช้ web search (และ web fetch) ได้อย่างไร?">
    `web_fetch` ทำงานได้โดยไม่ต้องมี API key `web_search` ขึ้นอยู่กับผู้ให้บริการ
    ที่คุณเลือก:

    - ผู้ให้บริการที่มี API รองรับ เช่น Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity และ Tavily ต้องใช้การตั้งค่า API key ตามปกติ
    - Ollama Web Search ไม่ต้องใช้คีย์ แต่ใช้โฮสต์ Ollama ที่คุณกำหนดค่าไว้และต้องใช้ `ollama signin`
    - DuckDuckGo ไม่ต้องใช้คีย์ แต่เป็นการผสานรวมแบบไม่เป็นทางการที่อิง HTML
    - SearXNG ไม่ต้องใช้คีย์/โฮสต์เองได้; กำหนดค่า `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl`

    **แนะนำ:** รัน `openclaw configure --section web` แล้วเลือกผู้ให้บริการ
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

    ตอนนี้การกำหนดค่า web-search เฉพาะ provider อยู่ใต้ `plugins.entries.<plugin>.config.webSearch.*`
    เส้นทาง provider แบบเดิม `tools.web.search.*` ยังโหลดได้ชั่วคราวเพื่อความเข้ากันได้ แต่ไม่ควรใช้กับการกำหนดค่าใหม่
    การกำหนดค่า fallback ของ Firecrawl web-fetch อยู่ใต้ `plugins.entries.firecrawl.config.webFetch.*`

    หมายเหตุ:

    - หากคุณใช้ allowlist ให้เพิ่ม `web_search`/`web_fetch`/`x_search` หรือ `group:web`
    - `web_fetch` เปิดใช้งานตามค่าเริ่มต้น (เว้นแต่จะปิดใช้งานไว้อย่างชัดเจน)
    - หากละ `tools.web.fetch.provider` ไว้ OpenClaw จะตรวจหา provider fallback สำหรับ fetch ที่พร้อมใช้งานตัวแรกจากข้อมูลรับรองที่มีอยู่โดยอัตโนมัติ ปัจจุบัน provider ที่รวมมาให้คือ Firecrawl
    - daemon อ่าน env var จาก `~/.openclaw/.env` (หรือ environment ของ service)

    เอกสาร: [เครื่องมือเว็บ](/th/tools/web).

  </Accordion>

  <Accordion title="config.apply ล้างการกำหนดค่าของฉัน ฉันจะกู้คืนและหลีกเลี่ยงปัญหานี้ได้อย่างไร">
    `config.apply` แทนที่ **การกำหนดค่าทั้งหมด** หากคุณส่ง object บางส่วนเท่านั้น สิ่งอื่น
    ทั้งหมดจะถูกลบออก

    OpenClaw ปัจจุบันป้องกันการเขียนทับโดยไม่ตั้งใจหลายกรณี:

    - การเขียนการกำหนดค่าที่ OpenClaw เป็นเจ้าของจะตรวจสอบการกำหนดค่าทั้งหมดหลังการเปลี่ยนแปลงก่อนเขียน
    - การเขียนที่ OpenClaw เป็นเจ้าของซึ่งไม่ถูกต้องหรือทำลายข้อมูลจะถูกปฏิเสธและบันทึกเป็น `openclaw.json.rejected.*`
    - หากการแก้ไขโดยตรงทำให้ startup หรือ hot reload เสีย Gateway จะกู้คืนการกำหนดค่าล่าสุดที่ทราบว่าใช้ได้ และบันทึกไฟล์ที่ถูกปฏิเสธเป็น `openclaw.json.clobbered.*`
    - agent หลักจะได้รับคำเตือนตอนบูตหลังการกู้คืน เพื่อไม่ให้เขียนการกำหนดค่าที่ไม่ดีซ้ำโดยไม่ตรวจสอบ

    กู้คืน:

    - ตรวจสอบ `openclaw logs --follow` เพื่อหา `Config auto-restored from last-known-good`, `Config write rejected:`, หรือ `config reload restored last-known-good config`
    - ตรวจดู `openclaw.json.clobbered.*` หรือ `openclaw.json.rejected.*` ใหม่ล่าสุดที่อยู่ข้างการกำหนดค่าที่ใช้งานอยู่
    - เก็บการกำหนดค่าที่กู้คืนและใช้งานอยู่ไว้หากทำงานได้ จากนั้นคัดลอกกลับเฉพาะ key ที่ต้องการด้วย `openclaw config set` หรือ `config.patch`
    - รัน `openclaw config validate` และ `openclaw doctor`
    - หากคุณไม่มี last-known-good หรือ payload ที่ถูกปฏิเสธ ให้กู้คืนจากข้อมูลสำรอง หรือรัน `openclaw doctor` อีกครั้งและกำหนดค่า channels/models ใหม่
    - หากสิ่งนี้เกิดขึ้นโดยไม่คาดคิด ให้แจ้ง bug และแนบการกำหนดค่าล่าสุดที่คุณทราบหรือข้อมูลสำรองใด ๆ
    - coding agent ในเครื่องมักสามารถสร้างการกำหนดค่าที่ใช้งานได้ขึ้นใหม่จาก log หรือประวัติ

    หลีกเลี่ยง:

    - ใช้ `openclaw config set` สำหรับการเปลี่ยนแปลงเล็ก ๆ
    - ใช้ `openclaw configure` สำหรับการแก้ไขแบบโต้ตอบ
    - ใช้ `config.schema.lookup` ก่อนเมื่อคุณไม่แน่ใจเกี่ยวกับ path หรือรูปร่างของ field ที่แน่นอน; คำสั่งนี้จะคืน schema node แบบตื้นพร้อมสรุปลูกโดยตรงสำหรับเจาะลึก
    - ใช้ `config.patch` สำหรับการแก้ไข RPC บางส่วน; เก็บ `config.apply` ไว้สำหรับการแทนที่การกำหนดค่าทั้งหมดเท่านั้น
    - หากคุณใช้เครื่องมือ `gateway` เฉพาะเจ้าของจาก agent run เครื่องมือนี้จะยังปฏิเสธการเขียนไปยัง `tools.exec.ask` / `tools.exec.security` (รวมถึง alias เดิม `tools.bash.*` ที่ normalize ไปยัง path exec ที่ได้รับการป้องกันเดียวกัน)

    เอกสาร: [การกำหนดค่า](/th/cli/config), [กำหนดค่า](/th/cli/configure), [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/th/gateway/doctor).

  </Accordion>

  <Accordion title="ฉันจะรัน Gateway กลางพร้อม worker เฉพาะทางข้ามอุปกรณ์ได้อย่างไร">
    รูปแบบทั่วไปคือ **Gateway หนึ่งตัว** (เช่น Raspberry Pi) พร้อม **Node** และ **agent**:

    - **Gateway (กลาง):** เป็นเจ้าของ channels (Signal/WhatsApp), routing, และ sessions
    - **Node (อุปกรณ์):** Macs/iOS/Android เชื่อมต่อเป็นอุปกรณ์ต่อพ่วงและเปิดเผยเครื่องมือในเครื่อง (`system.run`, `canvas`, `camera`)
    - **Agents (worker):** สมอง/พื้นที่ทำงานแยกกันสำหรับบทบาทพิเศษ (เช่น "Hetzner ops", "Personal data")
    - **Sub-agents:** สร้างงานเบื้องหลังจาก agent หลักเมื่อคุณต้องการการทำงานแบบขนาน
    - **TUI:** เชื่อมต่อกับ Gateway และสลับ agents/sessions

    เอกสาร: [Node](/th/nodes), [การเข้าถึงระยะไกล](/th/gateway/remote), [Multi-Agent Routing](/th/concepts/multi-agent), [Sub-agents](/th/tools/subagents), [TUI](/th/web/tui).

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

    ค่าเริ่มต้นคือ `false` (headful) Headless มีแนวโน้มกระตุ้นการตรวจจับ anti-bot บนบางไซต์มากกว่า ดู [เบราว์เซอร์](/th/tools/browser)

    Headless ใช้ **Chromium engine เดียวกัน** และทำงานได้กับงาน automation ส่วนใหญ่ (forms, clicks, scraping, logins) ความแตกต่างหลักคือ:

    - ไม่มีหน้าต่างเบราว์เซอร์ให้เห็น (ใช้ screenshot หากคุณต้องการภาพ)
    - บางไซต์เข้มงวดกับ automation ในโหมด headless มากกว่า (CAPTCHA, anti-bot)
      ตัวอย่างเช่น X/Twitter มักบล็อก session แบบ headless

  </Accordion>

  <Accordion title="ฉันจะใช้ Brave สำหรับการควบคุมเบราว์เซอร์ได้อย่างไร">
    ตั้งค่า `browser.executablePath` เป็น binary ของ Brave ของคุณ (หรือเบราว์เซอร์ที่ใช้ Chromium ตัวใดก็ได้) แล้วรีสตาร์ท Gateway
    ดูตัวอย่างการกำหนดค่าแบบเต็มใน [เบราว์เซอร์](/th/tools/browser#use-brave-or-another-chromium-based-browser)
  </Accordion>
</AccordionGroup>

## Gateway และ Node ระยะไกล

<AccordionGroup>
  <Accordion title="คำสั่งส่งต่อระหว่าง Telegram, gateway, และ Node อย่างไร">
    ข้อความ Telegram ถูกจัดการโดย **gateway** gateway จะรัน agent และ
    จากนั้นจึงเรียก Node ผ่าน **Gateway WebSocket** เฉพาะเมื่อจำเป็นต้องใช้เครื่องมือ Node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node จะไม่เห็น traffic ขาเข้าจาก provider; Node จะได้รับเฉพาะการเรียก RPC ของ Node เท่านั้น

  </Accordion>

  <Accordion title="agent ของฉันจะเข้าถึงคอมพิวเตอร์ของฉันได้อย่างไร หาก Gateway โฮสต์อยู่ระยะไกล">
    คำตอบสั้น ๆ: **จับคู่คอมพิวเตอร์ของคุณเป็น Node** Gateway รันอยู่ที่อื่น แต่สามารถ
    เรียกเครื่องมือ `node.*` (screen, camera, system) บนเครื่องในเครื่องของคุณผ่าน Gateway WebSocket ได้

    การตั้งค่าทั่วไป:

    1. รัน Gateway บนโฮสต์ที่เปิดตลอดเวลา (VPS/home server)
    2. ใส่โฮสต์ Gateway + คอมพิวเตอร์ของคุณไว้ใน tailnet เดียวกัน
    3. ตรวจให้แน่ใจว่า Gateway WS เข้าถึงได้ (tailnet bind หรือ SSH tunnel)
    4. เปิดแอป macOS ในเครื่องและเชื่อมต่อในโหมด **Remote over SSH** (หรือ tailnet โดยตรง)
       เพื่อให้ลงทะเบียนเป็น Node ได้
    5. อนุมัติ Node บน Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ไม่จำเป็นต้องมี TCP bridge แยกต่างหาก; Node เชื่อมต่อผ่าน Gateway WebSocket

    เตือนด้านความปลอดภัย: การจับคู่ Node macOS อนุญาตให้ใช้ `system.run` บนเครื่องนั้น จับคู่เฉพาะ
    อุปกรณ์ที่คุณเชื่อถือ และตรวจทาน [ความปลอดภัย](/th/gateway/security)

    เอกสาร: [Node](/th/nodes), [โปรโตคอล Gateway](/th/gateway/protocol), [โหมดระยะไกล macOS](/th/platforms/mac/remote), [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="Tailscale เชื่อมต่อแล้วแต่ฉันไม่ได้รับคำตอบ ต้องทำอย่างไรต่อ">
    ตรวจสอบพื้นฐาน:

    - Gateway กำลังทำงานอยู่: `openclaw gateway status`
    - สุขภาพ Gateway: `openclaw status`
    - สุขภาพ channel: `openclaw channels status`

    จากนั้นตรวจสอบ auth และ routing:

    - หากคุณใช้ Tailscale Serve ตรวจให้แน่ใจว่า `gateway.auth.allowTailscale` ตั้งค่าอย่างถูกต้อง
    - หากคุณเชื่อมต่อผ่าน SSH tunnel ให้ยืนยันว่า tunnel ในเครื่องเปิดอยู่และชี้ไปยัง port ที่ถูกต้อง
    - ยืนยันว่า allowlist ของคุณ (DM หรือ group) รวมบัญชีของคุณแล้ว

    เอกสาร: [Tailscale](/th/gateway/tailscale), [การเข้าถึงระยะไกล](/th/gateway/remote), [Channels](/th/channels).

  </Accordion>

  <Accordion title="OpenClaw สอง instance คุยกันได้หรือไม่ (ในเครื่อง + VPS)">
    ได้ ไม่มี bridge "bot-to-bot" ในตัว แต่คุณสามารถเชื่อมต่อได้หลายวิธี
    ที่เชื่อถือได้:

    **ง่ายที่สุด:** ใช้ channel แชตปกติที่ bot ทั้งสองเข้าถึงได้ (Telegram/Slack/WhatsApp)
    ให้ Bot A ส่งข้อความถึง Bot B แล้วให้ Bot B ตอบตามปกติ

    **CLI bridge (ทั่วไป):** รันสคริปต์ที่เรียก Gateway อีกตัวด้วย
    `openclaw agent --message ... --deliver` โดย target ไปยังแชตที่ bot อีกตัว
    ฟังอยู่ หาก bot ตัวหนึ่งอยู่บน VPS ระยะไกล ให้ชี้ CLI ของคุณไปยัง Gateway ระยะไกลนั้น
    ผ่าน SSH/Tailscale (ดู [การเข้าถึงระยะไกล](/th/gateway/remote))

    รูปแบบตัวอย่าง (รันจากเครื่องที่เข้าถึง Gateway เป้าหมายได้):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    เคล็ดลับ: เพิ่ม guardrail เพื่อไม่ให้ bot ทั้งสองวนลูปไม่รู้จบ (ตอบเมื่อถูก mention เท่านั้น, channel
    allowlists, หรือกฎ "ไม่ตอบกลับข้อความจาก bot")

    เอกสาร: [การเข้าถึงระยะไกล](/th/gateway/remote), [Agent CLI](/th/cli/agent), [ส่ง Agent](/th/tools/agent-send).

  </Accordion>

  <Accordion title="ฉันจำเป็นต้องมี VPS แยกสำหรับหลาย agent หรือไม่">
    ไม่จำเป็น Gateway หนึ่งตัวสามารถโฮสต์ agent ได้หลายตัว โดยแต่ละตัวมี workspace, ค่าเริ่มต้นของ model,
    และ routing ของตัวเอง นี่คือการตั้งค่าปกติ และถูกกว่าและง่ายกว่าการรัน
    VPS หนึ่งตัวต่อ agent มาก

    ใช้ VPS แยกเฉพาะเมื่อคุณต้องการการแยกอย่างเข้มงวด (ขอบเขตความปลอดภัย) หรือ
    การกำหนดค่าที่แตกต่างกันมากซึ่งคุณไม่ต้องการใช้ร่วมกัน มิฉะนั้น ให้ใช้ Gateway เดียวและ
    ใช้หลาย agent หรือ sub-agent

  </Accordion>

  <Accordion title="การใช้ Node บนแล็ปท็อปส่วนตัวแทน SSH จาก VPS มีประโยชน์หรือไม่">
    มี - Node เป็นวิธีหลักในการเข้าถึงแล็ปท็อปของคุณจาก Gateway ระยะไกล และ
    ปลดล็อกได้มากกว่าการเข้าถึง shell Gateway รันบน macOS/Linux (Windows ผ่าน WSL2) และ
    เบา (VPS ขนาดเล็กหรือเครื่องระดับ Raspberry Pi ก็เพียงพอ; RAM 4 GB เพียงพอมาก) ดังนั้นการตั้งค่าทั่วไป
    คือโฮสต์ที่เปิดตลอดเวลาพร้อมแล็ปท็อปของคุณเป็น Node

    - **ไม่ต้องใช้ SSH ขาเข้า** Node เชื่อมต่อออกไปยัง Gateway WebSocket และใช้การจับคู่อุปกรณ์
    - **การควบคุมการรันที่ปลอดภัยกว่า** `system.run` ถูกควบคุมด้วย allowlist/approval ของ Node บนแล็ปท็อปนั้น
    - **เครื่องมืออุปกรณ์มากขึ้น** Node เปิดเผย `canvas`, `camera`, และ `screen` นอกเหนือจาก `system.run`
    - **การทำ browser automation ในเครื่อง** เก็บ Gateway ไว้บน VPS แต่รัน Chrome ในเครื่องผ่านโฮสต์ Node บนแล็ปท็อป หรือแนบกับ Chrome ในเครื่องบนโฮสต์ผ่าน Chrome MCP

    SSH เหมาะสำหรับการเข้าถึง shell แบบเฉพาะกิจ แต่ Node ง่ายกว่าสำหรับ workflow ของ agent ที่ใช้งานต่อเนื่องและ
    automation ของอุปกรณ์

    เอกสาร: [Node](/th/nodes), [Node CLI](/th/cli/nodes), [เบราว์เซอร์](/th/tools/browser).

  </Accordion>

  <Accordion title="Node รัน service gateway หรือไม่">
    ไม่ เฉพาะ **gateway หนึ่งตัว** เท่านั้นที่ควรรันต่อโฮสต์ เว้นแต่คุณจงใจรัน profile ที่แยกกัน (ดู [หลาย gateway](/th/gateway/multiple-gateways)) Node เป็นอุปกรณ์ต่อพ่วงที่เชื่อมต่อ
    กับ gateway (Node iOS/Android หรือ "node mode" ของ macOS ในแอป menubar) สำหรับโฮสต์ Node แบบ headless
    และการควบคุม CLI ดู [Node host CLI](/th/cli/node)

    ต้องรีสตาร์ทเต็มรูปแบบสำหรับการเปลี่ยนแปลง `gateway`, `discovery`, และ `canvasHost`

  </Accordion>

  <Accordion title="มีวิธี API / RPC เพื่อ apply config หรือไม่">
    มี

    - `config.schema.lookup`: ตรวจดู subtree ของการกำหนดค่าหนึ่งรายการพร้อม schema node แบบตื้น, UI hint ที่ตรงกัน, และสรุปลูกโดยตรงก่อนเขียน
    - `config.get`: ดึง snapshot + hash ปัจจุบัน
    - `config.patch`: อัปเดตบางส่วนอย่างปลอดภัย (แนะนำสำหรับการแก้ไข RPC ส่วนใหญ่); hot-reload เมื่อทำได้และรีสตาร์ทเมื่อจำเป็น
    - `config.apply`: ตรวจสอบ + แทนที่การกำหนดค่าทั้งหมด; hot-reload เมื่อทำได้และรีสตาร์ทเมื่อจำเป็น
    - เครื่องมือ runtime `gateway` เฉพาะเจ้าของยังคงปฏิเสธการเขียน `tools.exec.ask` / `tools.exec.security`; alias เดิม `tools.bash.*` normalize ไปยัง path exec ที่ได้รับการป้องกันเดียวกัน

  </Accordion>

  <Accordion title="คอนฟิกขั้นต่ำที่เหมาะสมสำหรับการติดตั้งครั้งแรก">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    ค่านี้ตั้งค่า workspace ของคุณและจำกัดว่าใครสามารถสั่งให้บอตทำงานได้

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

    วิธีนี้จะผูก gateway ไว้กับ loopback และเปิดเผย HTTPS ผ่าน Tailscale ดู [Tailscale](/th/gateway/tailscale)

  </Accordion>

  <Accordion title="ฉันจะเชื่อมต่อ Mac node กับ Gateway ระยะไกล (Tailscale Serve) ได้อย่างไร?">
    Serve เปิดเผย **Gateway Control UI + WS** Node เชื่อมต่อผ่าน endpoint ของ Gateway WS เดียวกัน

    การตั้งค่าที่แนะนำ:

    1. **ตรวจสอบให้แน่ใจว่า VPS + Mac อยู่ใน tailnet เดียวกัน**
    2. **ใช้แอป macOS ในโหมด Remote** (เป้าหมาย SSH สามารถเป็นชื่อโฮสต์ของ tailnet ได้)
       แอปจะสร้าง tunnel ให้พอร์ต Gateway และเชื่อมต่อเป็น Node
    3. **อนุมัติ Node** บน gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    เอกสาร: [โปรโตคอล Gateway](/th/gateway/protocol), [Discovery](/th/gateway/discovery), [โหมดระยะไกลของ macOS](/th/platforms/mac/remote)

  </Accordion>

  <Accordion title="ฉันควรติดตั้งบนแล็ปท็อปเครื่องที่สองหรือแค่เพิ่ม Node?">
    หากคุณต้องการเพียง **เครื่องมือ local** (หน้าจอ/กล้อง/exec) บนแล็ปท็อปเครื่องที่สอง ให้เพิ่มเป็น
    **Node** วิธีนี้จะคง Gateway เดียวไว้และหลีกเลี่ยงคอนฟิกซ้ำซ้อน เครื่องมือ local ของ Node
    ตอนนี้รองรับเฉพาะ macOS แต่เราวางแผนจะขยายไปยัง OS อื่น

    ติดตั้ง Gateway ตัวที่สองเฉพาะเมื่อคุณต้องการ **การแยกอย่างเข้มงวด** หรือบอตสองตัวที่แยกกันโดยสมบูรณ์

    เอกสาร: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes), [Gateway หลายตัว](/th/gateway/multiple-gateways)

  </Accordion>
</AccordionGroup>

## Env vars และการโหลด .env

<AccordionGroup>
  <Accordion title="OpenClaw โหลดตัวแปรสภาพแวดล้อมอย่างไร?">
    OpenClaw อ่าน env vars จาก process แม่ (shell, launchd/systemd, CI ฯลฯ) และโหลดเพิ่มเติมจาก:

    - `.env` จากไดเรกทอรีทำงานปัจจุบัน
    - `.env` สำรองแบบ global จาก `~/.openclaw/.env` (หรือ `$OPENCLAW_STATE_DIR/.env`)

    ไฟล์ `.env` ทั้งสองไฟล์ไม่ override env vars ที่มีอยู่

    คุณยังสามารถกำหนด inline env vars ในคอนฟิกได้ด้วย (ใช้เฉพาะเมื่อไม่มีอยู่ใน process env):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    ดูลำดับความสำคัญและแหล่งที่มาทั้งหมดที่ [/environment](/th/help/environment)

  </Accordion>

  <Accordion title="ฉันเริ่ม Gateway ผ่าน service แล้ว env vars หายไป ตอนนี้ควรทำอย่างไร?">
    วิธีแก้ที่พบบ่อยสองวิธี:

    1. ใส่ key ที่หายไปใน `~/.openclaw/.env` เพื่อให้ถูกอ่านแม้ service จะไม่รับ shell env ของคุณมา
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

    วิธีนี้จะรัน login shell ของคุณและนำเข้าเฉพาะ key ที่คาดไว้ซึ่งยังขาดอยู่ (ไม่ override) ตัวแปร env ที่เทียบเท่า:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

  </Accordion>

  <Accordion title='ฉันตั้งค่า COPILOT_GITHUB_TOKEN แล้ว แต่สถานะ models แสดงว่า "Shell env: off." เพราะอะไร?'>
    `openclaw models status` รายงานว่าเปิดใช้ **การนำเข้าจาก shell env** อยู่หรือไม่ "Shell env: off"
    **ไม่ได้** หมายความว่า env vars ของคุณหายไป แต่หมายความว่า OpenClaw จะไม่โหลด
    login shell ของคุณโดยอัตโนมัติ

    หาก Gateway ทำงานเป็น service (launchd/systemd) จะไม่รับ shell
    environment ของคุณมา แก้โดยทำอย่างใดอย่างหนึ่งต่อไปนี้:

    1. ใส่ token ใน `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. หรือเปิดใช้การนำเข้าจาก shell (`env.shellEnv.enabled: true`)
    3. หรือเพิ่มลงในบล็อก `env` ในคอนฟิกของคุณ (ใช้เฉพาะเมื่อไม่มีอยู่)

    จากนั้น restart gateway แล้วตรวจสอบอีกครั้ง:

    ```bash
    openclaw models status
    ```

    Copilot tokens ถูกอ่านจาก `COPILOT_GITHUB_TOKEN` (รวมถึง `GH_TOKEN` / `GITHUB_TOKEN`)
    ดู [/concepts/model-providers](/th/concepts/model-providers) และ [/environment](/th/help/environment)

  </Accordion>
</AccordionGroup>

## เซสชันและแชตหลายรายการ

<AccordionGroup>
  <Accordion title="ฉันจะเริ่มการสนทนาใหม่ได้อย่างไร?">
    ส่ง `/new` หรือ `/reset` เป็นข้อความเดี่ยว ดู [การจัดการเซสชัน](/th/concepts/session)
  </Accordion>

  <Accordion title="เซสชันจะรีเซ็ตโดยอัตโนมัติหรือไม่หากฉันไม่เคยส่ง /new?">
    เซสชันสามารถหมดอายุหลังจาก `session.idleMinutes` แต่ค่านี้ **ปิดใช้งานโดยค่าเริ่มต้น** (ค่าเริ่มต้น **0**)
    ตั้งเป็นค่าบวกเพื่อเปิดใช้การหมดอายุเมื่อไม่ได้ใช้งาน เมื่อเปิดใช้แล้ว ข้อความ **ถัดไป**
    หลังจากช่วงเวลาว่างจะเริ่ม session id ใหม่สำหรับ chat key นั้น
    วิธีนี้ไม่ลบ transcripts แต่เพียงเริ่มเซสชันใหม่

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="มีวิธีสร้างทีมของอินสแตนซ์ OpenClaw (CEO หนึ่งคนและ agents หลายตัว) หรือไม่?">
    มี ผ่าน **multi-agent routing** และ **sub-agents** คุณสามารถสร้าง coordinator
    agent หนึ่งตัวและ worker agents หลายตัวพร้อม workspaces และ models ของแต่ละตัวได้

    อย่างไรก็ตาม ควรมองว่านี่เป็น **การทดลองสนุก ๆ** มากกว่า ใช้ token สูงและมัก
    มีประสิทธิภาพน้อยกว่าการใช้บอตเดียวพร้อมเซสชันแยกกัน โมเดลทั่วไปที่เรา
    คาดหวังคือบอตหนึ่งตัวที่คุณคุยด้วย โดยมีเซสชันต่างกันสำหรับงานคู่ขนาน บอตนั้น
    ยังสามารถสร้าง sub-agents เมื่อจำเป็นได้ด้วย

    เอกสาร: [Multi-agent routing](/th/concepts/multi-agent), [Sub-agents](/th/tools/subagents), [Agents CLI](/th/cli/agents)

  </Accordion>

  <Accordion title="ทำไม context จึงถูกตัดกลางงาน? ฉันจะป้องกันได้อย่างไร?">
    context ของเซสชันถูกจำกัดโดยหน้าต่างของโมเดล แชตที่ยาว output จากเครื่องมือขนาดใหญ่ หรือไฟล์จำนวนมาก
    อาจทำให้เกิด Compaction หรือ truncation ได้

    สิ่งที่ช่วยได้:

    - ขอให้บอตสรุปสถานะปัจจุบันและเขียนลงไฟล์
    - ใช้ `/compact` ก่อนงานยาว และใช้ `/new` เมื่อเปลี่ยนหัวข้อ
    - เก็บ context สำคัญไว้ใน workspace และขอให้บอตอ่านกลับมา
    - ใช้ sub-agents สำหรับงานยาวหรืองานคู่ขนาน เพื่อให้แชตหลักเล็กลง
    - เลือกโมเดลที่มีหน้าต่าง context ใหญ่ขึ้นหากเกิดปัญหานี้บ่อย

  </Accordion>

  <Accordion title="ฉันจะรีเซ็ต OpenClaw ทั้งหมดแต่ยังคงติดตั้งไว้ได้อย่างไร?">
    ใช้คำสั่ง reset:

    ```bash
    openclaw reset
    ```

    รีเซ็ตเต็มแบบ non-interactive:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    จากนั้นรัน setup อีกครั้ง:

    ```bash
    openclaw onboard --install-daemon
    ```

    หมายเหตุ:

    - Onboarding ยังมีตัวเลือก **Reset** หากพบคอนฟิกที่มีอยู่ ดู [Onboarding (CLI)](/th/start/wizard)
    - หากคุณใช้ profiles (`--profile` / `OPENCLAW_PROFILE`) ให้รีเซ็ต state dir แต่ละอัน (ค่าเริ่มต้นคือ `~/.openclaw-<profile>`)
    - รีเซ็ตสำหรับ dev: `openclaw gateway --dev --reset` (เฉพาะ dev; ล้างคอนฟิก dev + credentials + sessions + workspace)

  </Accordion>

  <Accordion title='ฉันพบข้อผิดพลาด "context too large" - จะรีเซ็ตหรือ compact อย่างไร?'>
    ใช้อย่างใดอย่างหนึ่งต่อไปนี้:

    - **Compact** (คงการสนทนาไว้แต่สรุป turn เก่า):

      ```
      /compact
      ```

      หรือ `/compact <instructions>` เพื่อกำกับการสรุป

    - **Reset** (session ID ใหม่สำหรับ chat key เดิม):

      ```
      /new
      /reset
      ```

    หากยังเกิดขึ้นอีก:

    - เปิดใช้หรือปรับแต่ง **session pruning** (`agents.defaults.contextPruning`) เพื่อตัด output จากเครื่องมือเก่า
    - ใช้โมเดลที่มีหน้าต่าง context ใหญ่ขึ้น

    เอกสาร: [Compaction](/th/concepts/compaction), [Session pruning](/th/concepts/session-pruning), [การจัดการเซสชัน](/th/concepts/session)

  </Accordion>

  <Accordion title='ทำไมฉันจึงเห็น "LLM request rejected: messages.content.tool_use.input field required"?'>
    นี่คือข้อผิดพลาดการตรวจสอบของ provider: โมเดลสร้างบล็อก `tool_use` โดยไม่มี
    `input` ที่จำเป็น โดยปกติหมายถึงประวัติเซสชันเก่าหรือเสียหาย (มักเกิดหลัง thread ยาว
    หรือมีการเปลี่ยนแปลงเครื่องมือ/schema)

    วิธีแก้: เริ่มเซสชันใหม่ด้วย `/new` (ข้อความเดี่ยว)

  </Accordion>

  <Accordion title="ทำไมฉันได้รับข้อความ heartbeat ทุก 30 นาที?">
    Heartbeats ทำงานทุก **30m** ตามค่าเริ่มต้น (**1h** เมื่อใช้การยืนยันตัวตนแบบ OAuth) ปรับหรือปิดได้:

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
    หากไฟล์หายไป heartbeat จะยังทำงานและโมเดลจะตัดสินใจว่าจะทำอะไร

    การ override ราย agent ใช้ `agents.list[].heartbeat` เอกสาร: [Heartbeat](/th/gateway/heartbeat)

  </Accordion>

  <Accordion title='ฉันต้องเพิ่ม "bot account" เข้าไปในกลุ่ม WhatsApp หรือไม่?'>
    ไม่ต้อง OpenClaw ทำงานบน **บัญชีของคุณเอง** ดังนั้นหากคุณอยู่ในกลุ่ม OpenClaw จะมองเห็นได้
    โดยค่าเริ่มต้น การตอบกลับในกลุ่มจะถูกบล็อกจนกว่าคุณจะอนุญาตผู้ส่ง (`groupPolicy: "allowlist"`)

    หากคุณต้องการให้มีเพียง **คุณ** เท่านั้นที่สามารถสั่งให้ตอบกลับในกลุ่มได้:

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

    ตัวเลือก 2 (หากคอนฟิก/allowlist แล้ว): แสดงรายการกลุ่มจากคอนฟิก:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    เอกสาร: [WhatsApp](/th/channels/whatsapp), [Directory](/th/cli/directory), [Logs](/th/cli/logs)

  </Accordion>

  <Accordion title="ทำไม OpenClaw ไม่ตอบในกลุ่ม?">
    สาเหตุที่พบบ่อยสองข้อ:

    - Mention gating เปิดอยู่ (ค่าเริ่มต้น) คุณต้อง @mention บอต (หรือ match `mentionPatterns`)
    - คุณคอนฟิก `channels.whatsapp.groups` โดยไม่มี `"*"` และกลุ่มไม่ได้อยู่ใน allowlist

    ดู [Groups](/th/channels/groups) และ [Group messages](/th/channels/group-messages)

  </Accordion>

  <Accordion title="กลุ่ม/threads แชร์ context กับ DMs หรือไม่?">
    Direct chats จะถูกรวมเข้ากับเซสชันหลักตามค่าเริ่มต้น Groups/channels มี session keys ของตัวเอง และ Telegram topics / Discord threads เป็นเซสชันแยกกัน ดู [Groups](/th/channels/groups) และ [Group messages](/th/channels/group-messages)
  </Accordion>

  <Accordion title="ฉันสามารถสร้าง workspaces และ agents ได้กี่รายการ?">
    ไม่มีข้อจำกัดตายตัว หลายสิบรายการ (แม้กระทั่งหลายร้อย) ก็ได้ แต่ให้ระวัง:

    - **การเพิ่มขึ้นของพื้นที่ดิสก์:** sessions + transcripts อยู่ใต้ `~/.openclaw/agents/<agentId>/sessions/`
    - **ค่าใช้จ่าย token:** agents มากขึ้นหมายถึงการใช้โมเดลพร้อมกันมากขึ้น
    - **ภาระด้านการปฏิบัติการ:** auth profiles, workspaces และ channel routing ราย agent

    เคล็ดลับ:

    - คง workspace ที่ **active** หนึ่งรายการต่อ agent (`agents.defaults.workspace`)
    - ลบ sessions เก่า (ลบ JSONL หรือ store entries) หากดิสก์โตขึ้น
    - ใช้ `openclaw doctor` เพื่อหา workspaces ที่หลงเหลือและ profile ที่ไม่ตรงกัน

  </Accordion>

  <Accordion title="ฉันสามารถรันบอตหรือแชตหลายรายการพร้อมกันได้ไหม (Slack) และควรตั้งค่าอย่างไร?">
    ได้ ใช้ **การกำหนดเส้นทางหลายเอเจนต์** เพื่อรันเอเจนต์หลายตัวแบบแยกกัน และกำหนดเส้นทางข้อความขาเข้าตาม
    ช่องทาง/บัญชี/เพียร์ Slack รองรับในฐานะช่องทางและสามารถผูกกับเอเจนต์เฉพาะได้

    การเข้าถึงเบราว์เซอร์ทรงพลัง แต่ไม่ใช่ "ทำทุกอย่างที่มนุษย์ทำได้" - ระบบป้องกันบอต, CAPTCHA และ MFA
    ยังสามารถบล็อกระบบอัตโนมัติได้ เพื่อการควบคุมเบราว์เซอร์ที่น่าเชื่อถือที่สุด ให้ใช้ Chrome MCP ภายในเครื่องบนโฮสต์
    หรือใช้ CDP บนเครื่องที่รันเบราว์เซอร์จริง

    การตั้งค่าตามแนวทางที่แนะนำ:

    - โฮสต์ Gateway ที่เปิดตลอดเวลา (VPS/Mac mini)
    - หนึ่งเอเจนต์ต่อหนึ่งบทบาท (การผูก)
    - ช่องทาง Slack ที่ผูกกับเอเจนต์เหล่านั้น
    - เบราว์เซอร์ภายในเครื่องผ่าน Chrome MCP หรือ Node เมื่อจำเป็น

    เอกสาร: [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [Slack](/th/channels/slack),
    [เบราว์เซอร์](/th/tools/browser), [Node](/th/nodes).

  </Accordion>
</AccordionGroup>

## โมเดล, เฟลโอเวอร์ และโปรไฟล์การยืนยันตัวตน

คำถามและคำตอบเกี่ยวกับโมเดล — ค่าเริ่มต้น, การเลือก, อะเลียส, การสลับ, เฟลโอเวอร์, โปรไฟล์การยืนยันตัวตน —
อยู่ใน [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models)

## Gateway: พอร์ต, "รันอยู่แล้ว" และโหมดรีโมต

<AccordionGroup>
  <Accordion title="Gateway ใช้พอร์ตใด?">
    `gateway.port` ควบคุมพอร์ตมัลติเพล็กซ์เดียวสำหรับ WebSocket + HTTP (Control UI, hooks ฯลฯ)

    ลำดับความสำคัญ:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status จึงบอกว่า "Runtime: running" แต่ "Connectivity probe: failed"?'>
    เพราะ "running" เป็นมุมมองของ **supervisor** (launchd/systemd/schtasks) ส่วนการตรวจสอบการเชื่อมต่อคือ CLI ที่เชื่อมต่อกับ gateway WebSocket จริง

    ใช้ `openclaw gateway status` และเชื่อถือบรรทัดเหล่านี้:

    - `Probe target:` (URL ที่การตรวจสอบใช้จริง)
    - `Listening:` (สิ่งที่ผูกอยู่กับพอร์ตจริง)
    - `Last gateway error:` (สาเหตุหลักที่พบบ่อยเมื่อโปรเซสยังทำงานอยู่แต่พอร์ตไม่ได้กำลังฟัง)

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status แสดง "Config (cli)" และ "Config (service)" ต่างกัน?'>
    คุณกำลังแก้ไขไฟล์คอนฟิกหนึ่งไฟล์ ขณะที่บริการกำลังรันอีกไฟล์หนึ่ง (มักเป็นความไม่ตรงกันของ `--profile` / `OPENCLAW_STATE_DIR`)

    วิธีแก้:

    ```bash
    openclaw gateway install --force
    ```

    รันคำสั่งนั้นจาก `--profile` / สภาพแวดล้อมเดียวกับที่คุณต้องการให้บริการใช้

  </Accordion>

  <Accordion title='"another gateway instance is already listening" หมายความว่าอะไร?'>
    OpenClaw บังคับใช้ runtime lock โดยผูกตัวฟัง WebSocket ทันทีเมื่อเริ่มต้น (ค่าเริ่มต้น `ws://127.0.0.1:18789`) หากการผูกล้มเหลวด้วย `EADDRINUSE` จะโยน `GatewayLockError` ซึ่งระบุว่ามีอินสแตนซ์อื่นกำลังฟังอยู่แล้ว

    วิธีแก้: หยุดอินสแตนซ์อื่น, ปล่อยพอร์ตให้ว่าง หรือรันด้วย `openclaw gateway --port <port>`

  </Accordion>

  <Accordion title="ฉันจะรัน OpenClaw ในโหมดรีโมต (ไคลเอนต์เชื่อมต่อไปยัง Gateway ที่อื่น) ได้อย่างไร?">
    ตั้งค่า `gateway.mode: "remote"` และชี้ไปยัง URL WebSocket ระยะไกล โดยเลือกใช้ข้อมูลประจำตัวรีโมตแบบ shared-secret ได้:

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
    - แอป macOS จะเฝ้าดูไฟล์คอนฟิกและสลับโหมดแบบสดเมื่อค่าเหล่านี้เปลี่ยน
    - `gateway.remote.token` / `.password` เป็นข้อมูลประจำตัวรีโมตฝั่งไคลเอนต์เท่านั้น ไม่ได้เปิดใช้การยืนยันตัวตนของ gateway ภายในเครื่องด้วยตัวเอง

  </Accordion>

  <Accordion title='Control UI บอกว่า "unauthorized" (หรือเชื่อมต่อใหม่เรื่อย ๆ) ต้องทำอย่างไร?'>
    เส้นทางการยืนยันตัวตนของ Gateway และวิธีการยืนยันตัวตนของ UI ไม่ตรงกัน

    ข้อเท็จจริง (จากโค้ด):

    - Control UI เก็บโทเค็นไว้ใน `sessionStorage` สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL Gateway ที่เลือก ดังนั้นการรีเฟรชแท็บเดิมจึงยังทำงานต่อได้โดยไม่ต้องคืนค่าการคงอยู่ของโทเค็นใน localStorage ระยะยาว
    - เมื่อเกิด `AUTH_TOKEN_MISMATCH` ไคลเอนต์ที่เชื่อถือได้สามารถลองใหม่แบบจำกัดหนึ่งครั้งด้วยโทเค็นอุปกรณ์ที่แคชไว้ เมื่อ gateway ส่งคำแนะนำให้ลองใหม่กลับมา (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)
    - การลองใหม่ด้วยโทเค็นที่แคชไว้นั้นตอนนี้ใช้สโคปที่อนุมัติแล้วซึ่งแคชไว้พร้อมกับโทเค็นอุปกรณ์อีกครั้ง ผู้เรียกที่ระบุ `deviceToken` ชัดเจน / ระบุ `scopes` ชัดเจนยังคงใช้ชุดสโคปที่ร้องขอเองแทนที่จะสืบทอดสโคปที่แคชไว้
    - นอกเส้นทางลองใหม่นั้น ลำดับความสำคัญของการยืนยันตัวตนตอนเชื่อมต่อคือ shared token/password ที่ระบุชัดเจนก่อน จากนั้นเป็น `deviceToken` ที่ระบุชัดเจน, โทเค็นอุปกรณ์ที่จัดเก็บไว้ และสุดท้ายคือ bootstrap token
    - การตรวจสอบสโคปของ bootstrap token มีคำนำหน้าตามบทบาท รายการอนุญาต operator bootstrap ในตัวรองรับเฉพาะคำขอ operator เท่านั้น บทบาท node หรือบทบาทอื่นที่ไม่ใช่ operator ยังต้องมีสโคปภายใต้คำนำหน้าบทบาทของตนเอง

    วิธีแก้:

    - เร็วที่สุด: `openclaw dashboard` (พิมพ์ + คัดลอก URL ของแดชบอร์ด, พยายามเปิด; แสดงคำแนะนำ SSH หากเป็น headless)
    - หากคุณยังไม่มีโทเค็น: `openclaw doctor --generate-gateway-token`
    - หากเป็นรีโมต ให้ทำ tunnel ก่อน: `ssh -N -L 18789:127.0.0.1:18789 user@host` จากนั้นเปิด `http://127.0.0.1:18789/`
    - โหมด shared-secret: ตั้งค่า `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` จากนั้นวาง secret ที่ตรงกันในการตั้งค่า Control UI
    - โหมด Tailscale Serve: ตรวจสอบให้แน่ใจว่าเปิดใช้ `gateway.auth.allowTailscale` และคุณกำลังเปิด Serve URL ไม่ใช่ URL loopback/tailnet ดิบที่ข้ามส่วนหัวข้อมูลประจำตัวของ Tailscale
    - โหมด trusted-proxy: ตรวจสอบให้แน่ใจว่าคุณเข้ามาผ่านพร็อกซีที่รู้จักข้อมูลประจำตัวตามที่กำหนดค่าไว้ ไม่ใช่ URL gateway ดิบ พร็อกซี loopback บนโฮสต์เดียวกันยังต้องใช้ `gateway.auth.trustedProxy.allowLoopback = true`
    - หากยังไม่ตรงกันหลังจากลองใหม่หนึ่งครั้ง ให้หมุนเวียน/อนุมัติโทเค็นอุปกรณ์ที่จับคู่ใหม่:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - หากคำสั่งหมุนเวียนนั้นบอกว่าถูกปฏิเสธ ให้ตรวจสอบสองอย่าง:
      - เซสชันอุปกรณ์ที่จับคู่สามารถหมุนเวียนได้เฉพาะอุปกรณ์ **ของตนเอง** เว้นแต่จะมี `operator.admin` ด้วย
      - ค่า `--scope` ที่ระบุชัดเจนต้องไม่เกินสโคป operator ปัจจุบันของผู้เรียก
    - ยังติดอยู่ใช่ไหม? รัน `openclaw status --all` และทำตาม [การแก้ไขปัญหา](/th/gateway/troubleshooting) ดู [แดชบอร์ด](/th/web/dashboard) สำหรับรายละเอียดการยืนยันตัวตน

  </Accordion>

  <Accordion title="ฉันตั้งค่า gateway.bind เป็น tailnet แต่ผูกไม่ได้และไม่มีอะไรฟังอยู่">
    การผูก `tailnet` จะเลือก IP ของ Tailscale จากอินเทอร์เฟซเครือข่ายของคุณ (100.64.0.0/10) หากเครื่องไม่ได้อยู่บน Tailscale (หรืออินเทอร์เฟซปิดอยู่) ก็ไม่มีสิ่งใดให้ผูก

    วิธีแก้:

    - เริ่ม Tailscale บนโฮสต์นั้น (เพื่อให้มีที่อยู่ 100.x) หรือ
    - สลับเป็น `gateway.bind: "loopback"` / `"lan"`

    หมายเหตุ: `tailnet` เป็นค่าที่ระบุชัดเจน `auto` จะเลือก loopback ก่อน ใช้ `gateway.bind: "tailnet"` เมื่อคุณต้องการผูกเฉพาะ tailnet

  </Accordion>

  <Accordion title="ฉันสามารถรัน Gateway หลายตัวบนโฮสต์เดียวกันได้ไหม?">
    โดยปกติไม่จำเป็น - Gateway หนึ่งตัวสามารถรันช่องทางข้อความและเอเจนต์ได้หลายรายการ ใช้ Gateway หลายตัวเฉพาะเมื่อคุณต้องการความซ้ำซ้อน (เช่น บอตกู้คืน) หรือการแยกอย่างเข้มงวด

    ได้ แต่คุณต้องแยกสิ่งต่อไปนี้:

    - `OPENCLAW_CONFIG_PATH` (คอนฟิกต่ออินสแตนซ์)
    - `OPENCLAW_STATE_DIR` (สถานะต่ออินสแตนซ์)
    - `agents.defaults.workspace` (การแยก workspace)
    - `gateway.port` (พอร์ตไม่ซ้ำกัน)

    การตั้งค่าแบบเร็ว (แนะนำ):

    - ใช้ `openclaw --profile <name> ...` ต่ออินสแตนซ์ (สร้าง `~/.openclaw-<name>` อัตโนมัติ)
    - ตั้งค่า `gateway.port` ที่ไม่ซ้ำกันในคอนฟิกของแต่ละโปรไฟล์ (หรือส่ง `--port` สำหรับการรันด้วยตนเอง)
    - ติดตั้งบริการต่อโปรไฟล์: `openclaw --profile <name> gateway install`

    โปรไฟล์จะเติม suffix ให้ชื่อบริการด้วย (`ai.openclaw.<profile>`; แบบเดิม `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`)
    คู่มือฉบับเต็ม: [Gateway หลายตัว](/th/gateway/multiple-gateways)

  </Accordion>

  <Accordion title='"invalid handshake" / รหัส 1008 หมายความว่าอะไร?'>
    Gateway เป็น **เซิร์ฟเวอร์ WebSocket** และคาดหวังให้ข้อความแรกสุด
    เป็นเฟรม `connect` หากได้รับสิ่งอื่น จะปิดการเชื่อมต่อ
    ด้วย **รหัส 1008** (การละเมิดนโยบาย)

    สาเหตุที่พบบ่อย:

    - คุณเปิด URL **HTTP** ในเบราว์เซอร์ (`http://...`) แทนที่จะใช้ไคลเอนต์ WS
    - คุณใช้พอร์ตหรือ path ผิด
    - พร็อกซีหรือ tunnel ลบส่วนหัวการยืนยันตัวตน หรือส่งคำขอที่ไม่ใช่ Gateway

    วิธีแก้แบบเร็ว:

    1. ใช้ URL WS: `ws://<host>:18789` (หรือ `wss://...` หากเป็น HTTPS)
    2. อย่าเปิดพอร์ต WS ในแท็บเบราว์เซอร์ปกติ
    3. หากเปิดการยืนยันตัวตนอยู่ ให้ใส่ token/password ในเฟรม `connect`

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
    log แบบไฟล์ (มีโครงสร้าง):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    คุณสามารถตั้ง path คงที่ผ่าน `logging.file` ได้ ระดับ log ของไฟล์ควบคุมโดย `logging.level` ความละเอียดของคอนโซลควบคุมโดย `--verbose` และ `logging.consoleLevel`

    วิธี tail log ที่เร็วที่สุด:

    ```bash
    openclaw logs --follow
    ```

    log ของบริการ/supervisor (เมื่อ gateway รันผ่าน launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` และ `gateway.err.log` (ค่าเริ่มต้น: `~/.openclaw/logs/...`; โปรไฟล์ใช้ `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    ดูเพิ่มเติมที่ [การแก้ไขปัญหา](/th/gateway/troubleshooting)

  </Accordion>

  <Accordion title="ฉันจะเริ่ม/หยุด/รีสตาร์ตบริการ Gateway ได้อย่างไร?">
    ใช้ตัวช่วย gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณรัน gateway ด้วยตนเอง `openclaw gateway --force` สามารถเรียกคืนพอร์ตได้ ดู [Gateway](/th/gateway)

  </Accordion>

  <Accordion title="ฉันปิดเทอร์มินัลบน Windows ไปแล้ว - จะรีสตาร์ต OpenClaw ได้อย่างไร?">
    มี **โหมดติดตั้ง Windows สองแบบ**:

    **1) WSL2 (แนะนำ):** Gateway รันอยู่ภายใน Linux

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

    เอกสาร: [Windows (WSL2)](/th/platforms/windows), [คู่มือปฏิบัติการบริการ Gateway](/th/gateway)

  </Accordion>

  <Accordion title="Gateway พร้อมใช้งานแล้วแต่ไม่มีการตอบกลับ ฉันควรตรวจสอบอะไร?">
    เริ่มด้วยการตรวจสุขภาพแบบเร็ว:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    สาเหตุที่พบบ่อย:

    - การยืนยันตัวตนของโมเดลไม่ได้โหลดบน **โฮสต์ gateway** (ตรวจสอบ `models status`)
    - การจับคู่ช่องทาง/allowlist บล็อกการตอบกลับ (ตรวจสอบคอนฟิกช่องทาง + log)
    - WebChat/Dashboard เปิดอยู่โดยไม่มีโทเค็นที่ถูกต้อง

    หากคุณอยู่ระยะไกล ให้ยืนยันว่า tunnel/การเชื่อมต่อ Tailscale พร้อมใช้งาน และ
    Gateway WebSocket เข้าถึงได้

    เอกสาร: [ช่องทาง](/th/channels), [การแก้ไขปัญหา](/th/gateway/troubleshooting), [การเข้าถึงระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - ต้องทำอย่างไร?'>
    โดยปกติหมายความว่า UI สูญเสียการเชื่อมต่อ WebSocket ตรวจสอบ:

    1. Gateway กำลังทำงานอยู่หรือไม่? `openclaw gateway status`
    2. Gateway มีสถานะปกติหรือไม่? `openclaw status`
    3. UI มีโทเค็นที่ถูกต้องหรือไม่? `openclaw dashboard`
    4. หากเป็นแบบระยะไกล ลิงก์อุโมงค์/Tailscale ใช้งานอยู่หรือไม่?

    จากนั้นตามดูบันทึก:

    ```bash
    openclaw logs --follow
    ```

    เอกสาร: [แดชบอร์ด](/th/web/dashboard), [การเข้าถึงระยะไกล](/th/gateway/remote), [การแก้ปัญหา](/th/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands ล้มเหลว ควรตรวจสอบอะไร?">
    เริ่มจากบันทึกและสถานะช่องทาง:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    จากนั้นจับคู่ข้อผิดพลาด:

    - `BOT_COMMANDS_TOO_MUCH`: เมนู Telegram มีรายการมากเกินไป OpenClaw ตัดให้เหลือเท่าขีดจำกัดของ Telegram และลองใหม่ด้วยจำนวนคำสั่งที่น้อยลงแล้ว แต่ยังต้องตัดรายการเมนูบางรายการออก ลดจำนวนคำสั่ง Plugin/skill/กำหนดเอง หรือปิด `channels.telegram.commands.native` หากคุณไม่ต้องการเมนู
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` หรือข้อผิดพลาดเครือข่ายที่คล้ายกัน: หากคุณอยู่บน VPS หรืออยู่หลังพร็อกซี ให้ยืนยันว่าอนุญาต HTTPS ขาออกและ DNS ใช้งานได้สำหรับ `api.telegram.org`

    หาก Gateway เป็นแบบระยะไกล ให้แน่ใจว่าคุณกำลังดูบันทึกบนโฮสต์ Gateway

    เอกสาร: [Telegram](/th/channels/telegram), [การแก้ปัญหาช่องทาง](/th/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI ไม่แสดงผลลัพธ์ ควรตรวจสอบอะไร?">
    ก่อนอื่นให้ยืนยันว่าเข้าถึง Gateway ได้และเอเจนต์สามารถทำงานได้:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    ใน TUI ให้ใช้ `/status` เพื่อดูสถานะปัจจุบัน หากคุณคาดหวังการตอบกลับในช่องทางแชต
    ให้แน่ใจว่าเปิดการส่งไว้ (`/deliver on`)

    เอกสาร: [TUI](/th/web/tui), [คำสั่งสแลช](/th/tools/slash-commands).

  </Accordion>

  <Accordion title="จะหยุดแล้วเริ่ม Gateway ใหม่ทั้งหมดได้อย่างไร?">
    หากคุณติดตั้งบริการไว้:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    คำสั่งนี้หยุด/เริ่ม **บริการที่ถูกกำกับดูแล** (launchd บน macOS, systemd บน Linux)
    ใช้สิ่งนี้เมื่อ Gateway ทำงานอยู่เบื้องหลังในฐานะดีมอน

    หากคุณกำลังรันในโฟร์กราวด์ ให้หยุดด้วย Ctrl-C แล้วจึงรัน:

    ```bash
    openclaw gateway run
    ```

    เอกสาร: [คู่มือปฏิบัติการบริการ Gateway](/th/gateway).

  </Accordion>

  <Accordion title="อธิบายแบบง่าย: openclaw gateway restart เทียบกับ openclaw gateway">
    - `openclaw gateway restart`: รีสตาร์ต **บริการเบื้องหลัง** (launchd/systemd)
    - `openclaw gateway`: รัน gateway **ในโฟร์กราวด์** สำหรับเซสชันเทอร์มินัลนี้

    หากคุณติดตั้งบริการไว้ ให้ใช้คำสั่ง gateway ใช้ `openclaw gateway` เมื่อ
    คุณต้องการรันครั้งเดียวในโฟร์กราวด์

  </Accordion>

  <Accordion title="วิธีที่เร็วที่สุดในการดูรายละเอียดเพิ่มเติมเมื่อมีบางอย่างล้มเหลว">
    เริ่ม Gateway ด้วย `--verbose` เพื่อดูรายละเอียดในคอนโซลมากขึ้น จากนั้นตรวจสอบไฟล์บันทึกสำหรับการยืนยันตัวตนของช่องทาง การกำหนดเส้นทางโมเดล และข้อผิดพลาด RPC
  </Accordion>
</AccordionGroup>

## สื่อและไฟล์แนบ

<AccordionGroup>
  <Accordion title="skill ของฉันสร้างรูปภาพ/PDF แล้ว แต่ไม่มีอะไรถูกส่ง">
    ไฟล์แนบขาออกจากเอเจนต์ต้องมีบรรทัด `MEDIA:<path-or-url>` (อยู่บนบรรทัดของตัวเอง) ดู [การตั้งค่าผู้ช่วย OpenClaw](/th/start/openclaw) และ [การส่งของเอเจนต์](/th/tools/agent-send)

    การส่งผ่าน CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    ตรวจสอบเพิ่มเติม:

    - ช่องทางเป้าหมายรองรับสื่อขาออกและไม่ได้ถูกบล็อกโดยรายการอนุญาต
    - ไฟล์อยู่ภายในขีดจำกัดขนาดของผู้ให้บริการ (รูปภาพจะถูกปรับขนาดสูงสุด 2048px)
    - `tools.fs.workspaceOnly=true` จำกัดการส่งพาธภายในเครื่องให้อยู่เฉพาะ workspace, temp/media-store และไฟล์ที่ผ่านการตรวจสอบใน sandbox
    - `tools.fs.workspaceOnly=false` อนุญาตให้ `MEDIA:` ส่งไฟล์ภายในเครื่องของโฮสต์ที่เอเจนต์อ่านได้อยู่แล้ว แต่เฉพาะสื่อและประเภทเอกสารที่ปลอดภัยเท่านั้น (รูปภาพ เสียง วิดีโอ PDF และเอกสาร Office) ไฟล์ข้อความธรรมดาและไฟล์ที่ดูเหมือนความลับยังคงถูกบล็อก

    ดู [รูปภาพ](/th/nodes/images)

  </Accordion>
</AccordionGroup>

## ความปลอดภัยและการควบคุมการเข้าถึง

<AccordionGroup>
  <Accordion title="การเปิดให้ OpenClaw รับ DM ขาเข้าปลอดภัยหรือไม่?">
    ให้ถือว่า DM ขาเข้าเป็นอินพุตที่ไม่น่าเชื่อถือ ค่าเริ่มต้นถูกออกแบบมาเพื่อลดความเสี่ยง:

    - พฤติกรรมเริ่มต้นบนช่องทางที่รองรับ DM คือ **การจับคู่**:
      - ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ บอทจะไม่ประมวลผลข้อความของพวกเขา
      - อนุมัติด้วย: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - คำขอที่รออนุมัติถูกจำกัดไว้ที่ **3 ต่อช่องทาง**; ตรวจสอบ `openclaw pairing list --channel <channel> [--account <id>]` หากรหัสไม่มาถึง
    - การเปิด DM ต่อสาธารณะต้องเลือกเปิดอย่างชัดเจน (`dmPolicy: "open"` และรายการอนุญาต `"*"`)

    รัน `openclaw doctor` เพื่อแสดงนโยบาย DM ที่มีความเสี่ยง

  </Accordion>

  <Accordion title="prompt injection เป็นปัญหาเฉพาะบอทสาธารณะหรือไม่?">
    ไม่ใช่ prompt injection เกี่ยวข้องกับ **เนื้อหาที่ไม่น่าเชื่อถือ** ไม่ใช่แค่ใครสามารถส่ง DM ถึงบอทได้
    หากผู้ช่วยของคุณอ่านเนื้อหาภายนอก (การค้นหา/ดึงเว็บ หน้าเบราว์เซอร์ อีเมล
    เอกสาร ไฟล์แนบ บันทึกที่วางไว้) เนื้อหานั้นอาจมีคำสั่งที่พยายาม
    ยึดการควบคุมโมเดล สิ่งนี้เกิดขึ้นได้แม้ว่า **คุณเป็นผู้ส่งเพียงคนเดียว**

    ความเสี่ยงสูงสุดคือเมื่อเปิดใช้เครื่องมือ: โมเดลอาจถูกหลอกให้
    ส่งออกบริบทหรือเรียกใช้เครื่องมือแทนคุณ ลดขอบเขตผลกระทบโดย:

    - ใช้เอเจนต์ "ผู้อ่าน" แบบอ่านอย่างเดียวหรือปิดเครื่องมือ เพื่อสรุปเนื้อหาที่ไม่น่าเชื่อถือ
    - ปิด `web_search` / `web_fetch` / `browser` สำหรับเอเจนต์ที่เปิดใช้เครื่องมือ
    - ถือว่าข้อความจากไฟล์/เอกสารที่ถอดออกมาไม่น่าเชื่อถือเช่นกัน: OpenResponses
      `input_file` และการดึงข้อมูลจากไฟล์แนบสื่อ ต่างห่อข้อความที่ดึงออกมาด้วย
      ตัวทำเครื่องหมายขอบเขตเนื้อหาภายนอกอย่างชัดเจน แทนที่จะส่งข้อความไฟล์ดิบ
    - ใช้ sandbox และรายการอนุญาตเครื่องมือที่เข้มงวด

    รายละเอียด: [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="บอทของฉันควรมีอีเมล บัญชี GitHub หรือหมายเลขโทรศัพท์ของตัวเองหรือไม่?">
    ใช่ สำหรับการตั้งค่าส่วนใหญ่ การแยกบอทด้วยบัญชีและหมายเลขโทรศัพท์ต่างหาก
    ช่วยลดขอบเขตผลกระทบหากมีบางอย่างผิดพลาด นอกจากนี้ยังทำให้หมุนเวียน
    ข้อมูลประจำตัวหรือเพิกถอนการเข้าถึงได้ง่ายขึ้นโดยไม่กระทบบัญชีส่วนตัวของคุณ

    เริ่มจากขนาดเล็ก ให้สิทธิ์เข้าถึงเฉพาะเครื่องมือและบัญชีที่คุณต้องใช้จริง และขยาย
    เพิ่มภายหลังหากจำเป็น

    เอกสาร: [ความปลอดภัย](/th/gateway/security), [การจับคู่](/th/channels/pairing).

  </Accordion>

  <Accordion title="ฉันให้มันมีอิสระเหนือข้อความของฉันได้หรือไม่ และปลอดภัยหรือไม่?">
    เรา **ไม่** แนะนำให้มอบอิสระเต็มรูปแบบเหนือข้อความส่วนตัวของคุณ รูปแบบที่ปลอดภัยที่สุดคือ:

    - คง DM ไว้ใน **โหมดจับคู่** หรือรายการอนุญาตที่เข้มงวด
    - ใช้ **หมายเลขหรือบัญชีแยกต่างหาก** หากคุณต้องการให้มันส่งข้อความแทนคุณ
    - ให้มันร่างข้อความ แล้วจึง **อนุมัติก่อนส่ง**

    หากคุณต้องการทดลอง ให้ทำบนบัญชีเฉพาะและแยกออกจากกัน ดู
    [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="ฉันใช้โมเดลราคาถูกกว่าสำหรับงานผู้ช่วยส่วนตัวได้หรือไม่?">
    ได้ **หาก** เอเจนต์เป็นแบบแชตเท่านั้นและอินพุตเชื่อถือได้ ระดับที่เล็กกว่า
    อ่อนไหวต่อการถูกยึดคำสั่งมากกว่า ดังนั้นให้หลีกเลี่ยงสำหรับเอเจนต์ที่เปิดใช้เครื่องมือ
    หรือเมื่ออ่านเนื้อหาที่ไม่น่าเชื่อถือ หากจำเป็นต้องใช้โมเดลที่เล็กกว่า ให้ล็อก
    เครื่องมือให้แน่นและรันภายใน sandbox ดู [ความปลอดภัย](/th/gateway/security).
  </Accordion>

  <Accordion title="ฉันรัน /start ใน Telegram แต่ไม่ได้รับรหัสจับคู่">
    รหัสจับคู่จะถูกส่ง **เฉพาะ** เมื่อผู้ส่งที่ไม่รู้จักส่งข้อความถึงบอทและ
    เปิดใช้ `dmPolicy: "pairing"` แล้ว `/start` เพียงอย่างเดียวจะไม่สร้างรหัส

    ตรวจสอบคำขอที่รออนุมัติ:

    ```bash
    openclaw pairing list telegram
    ```

    หากคุณต้องการเข้าถึงทันที ให้เพิ่ม id ผู้ส่งของคุณในรายการอนุญาตหรือตั้ง `dmPolicy: "open"`
    สำหรับบัญชีนั้น

  </Accordion>

  <Accordion title="WhatsApp: มันจะส่งข้อความถึงผู้ติดต่อของฉันไหม? การจับคู่ทำงานอย่างไร?">
    ไม่ นโยบาย DM เริ่มต้นของ WhatsApp คือ **การจับคู่** ผู้ส่งที่ไม่รู้จักจะได้รับเพียงรหัสจับคู่ และข้อความของพวกเขา **จะไม่ถูกประมวลผล** OpenClaw จะตอบกลับเฉพาะแชตที่ได้รับหรือการส่งอย่างชัดเจนที่คุณทริกเกอร์เท่านั้น

    อนุมัติการจับคู่ด้วย:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    แสดงคำขอที่รออนุมัติ:

    ```bash
    openclaw pairing list whatsapp
    ```

    พรอมป์หมายเลขโทรศัพท์ในวิซาร์ด: ใช้เพื่อตั้ง **รายการอนุญาต/เจ้าของ** ของคุณ เพื่อให้ DM ของคุณเองได้รับอนุญาต ไม่ได้ใช้สำหรับการส่งอัตโนมัติ หากคุณรันบนหมายเลข WhatsApp ส่วนตัว ให้ใช้หมายเลขนั้นและเปิดใช้ `channels.whatsapp.selfChatMode`

  </Accordion>
</AccordionGroup>

## คำสั่งแชต การยกเลิกงาน และ "มันไม่หยุด"

<AccordionGroup>
  <Accordion title="จะหยุดไม่ให้ข้อความระบบภายในแสดงในแชตได้อย่างไร?">
    ข้อความภายในหรือข้อความเครื่องมือส่วนใหญ่จะปรากฏเฉพาะเมื่อเปิดใช้ **verbose**, **trace** หรือ **reasoning**
    สำหรับเซสชันนั้น

    แก้ในแชตที่คุณเห็น:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    หากยังมีเสียงรบกวนมาก ให้ตรวจสอบการตั้งค่าเซสชันใน Control UI และตั้ง verbose
    เป็น **สืบทอด** และยืนยันด้วยว่าคุณไม่ได้ใช้โปรไฟล์บอทที่ตั้ง `verboseDefault`
    เป็น `on` ใน config

    เอกสาร: [การคิดและ verbose](/th/tools/thinking), [ความปลอดภัย](/th/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="จะหยุด/ยกเลิกงานที่กำลังรันได้อย่างไร?">
    ส่งข้อความใดก็ได้ต่อไปนี้ **เป็นข้อความเดี่ยว** (ไม่มีสแลช):

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

    สิ่งเหล่านี้เป็นตัวทริกเกอร์การยกเลิก (ไม่ใช่คำสั่งสแลช)

    สำหรับกระบวนการเบื้องหลัง (จากเครื่องมือ exec) คุณสามารถขอให้เอเจนต์รัน:

    ```
    process action:kill sessionId:XXX
    ```

    ภาพรวมคำสั่งสแลช: ดู [คำสั่งสแลช](/th/tools/slash-commands)

    คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความ **เดี่ยว** ที่เริ่มด้วย `/` แต่ทางลัดบางอย่าง (เช่น `/status`) ก็ใช้แบบแทรกในบรรทัดได้สำหรับผู้ส่งที่อยู่ในรายการอนุญาต

  </Accordion>

  <Accordion title='จะส่งข้อความ Discord จาก Telegram ได้อย่างไร? ("การส่งข้อความข้ามบริบทถูกปฏิเสธ")'>
    OpenClaw บล็อกการส่งข้อความ **ข้ามผู้ให้บริการ** เป็นค่าเริ่มต้น หากการเรียกเครื่องมือผูกอยู่กับ
    Telegram จะไม่ส่งไปยัง Discord เว้นแต่คุณจะอนุญาตอย่างชัดเจน

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

    รีสตาร์ต gateway หลังแก้ไข config

  </Accordion>

  <Accordion title='ทำไมรู้สึกเหมือนบอท "เมิน" ข้อความที่ส่งรัว ๆ?'>
    โหมดคิวควบคุมว่าข้อความใหม่โต้ตอบกับการรันที่กำลังดำเนินอยู่อย่างไร ใช้ `/queue` เพื่อเปลี่ยนโหมด:

    - `steer` - จัดคิวการชี้นำที่รอทั้งหมดสำหรับขอบเขตโมเดลถัดไปในการรันปัจจุบัน
    - `queue` - การชี้นำทีละรายการแบบเดิม
    - `followup` - รันข้อความทีละรายการ
    - `collect` - รวมข้อความเป็นชุดแล้วตอบกลับครั้งเดียว
    - `steer-backlog` - ชี้นำตอนนี้ แล้วประมวลผล backlog
    - `interrupt` - ยกเลิกการรันปัจจุบันแล้วเริ่มใหม่

    โหมดเริ่มต้นคือ `steer` คุณสามารถเพิ่มตัวเลือกอย่าง `debounce:0.5s cap:25 drop:summarize` สำหรับโหมด followup ได้ ดู [คิวคำสั่ง](/th/concepts/queue) และ [คิวการชี้นำ](/th/concepts/queue-steering)

  </Accordion>
</AccordionGroup>

## เบ็ดเตล็ด

<AccordionGroup>
  <Accordion title='โมเดลเริ่มต้นสำหรับ Anthropic เมื่อใช้ API key คืออะไร?'>
    ใน OpenClaw ข้อมูลประจำตัวและการเลือกโมเดลแยกจากกัน การตั้งค่า `ANTHROPIC_API_KEY` (หรือการจัดเก็บ Anthropic API key ไว้ในโปรไฟล์การยืนยันตัวตน) จะเปิดใช้การยืนยันตัวตน แต่โมเดลเริ่มต้นจริงคือสิ่งที่คุณกำหนดค่าไว้ใน `agents.defaults.model.primary` (เช่น `anthropic/claude-sonnet-4-6` หรือ `anthropic/claude-opus-4-6`) หากคุณเห็น `No credentials found for profile "anthropic:default"` แปลว่า Gateway ไม่พบข้อมูลประจำตัวของ Anthropic ใน `auth-profiles.json` ที่คาดไว้สำหรับเอเจนต์ที่กำลังทำงานอยู่
  </Accordion>
</AccordionGroup>

---

ยังติดขัดอยู่หรือไม่? ถามใน [Discord](https://discord.com/invite/clawd) หรือเปิด [การสนทนาใน GitHub](https://github.com/openclaw/openclaw/discussions)

## ที่เกี่ยวข้อง

- [FAQ การรันครั้งแรก](/th/help/faq-first-run) — การติดตั้ง การเริ่มใช้งาน การยืนยันตัวตน การสมัครใช้งาน ความล้มเหลวช่วงแรก
- [FAQ โมเดล](/th/help/faq-models) — การเลือกโมเดล การสลับเมื่อเกิดข้อผิดพลาด โปรไฟล์การยืนยันตัวตน
- [การแก้ไขปัญหา](/th/help/troubleshooting) — การคัดแยกปัญหาโดยเริ่มจากอาการ
