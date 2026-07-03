---
read_when:
    - ตอบคำถามสนับสนุนทั่วไปเกี่ยวกับการตั้งค่า การติดตั้ง การเริ่มใช้งาน หรือการทำงานขณะรัน
    - คัดแยกปัญหาที่ผู้ใช้รายงานก่อนการดีบักเชิงลึก
summary: คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า การกำหนดค่า และการใช้งาน OpenClaw
title: คำถามที่พบบ่อย
x-i18n:
    generated_at: "2026-07-03T17:48:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d55385d187c20dfce05022b76fcaa054c19fc22e46da66d4a24e2538dd95708
    source_path: help/faq.md
    workflow: 16
---

คำตอบด่วนพร้อมการแก้ปัญหาเชิงลึกสำหรับการตั้งค่าใช้งานจริง (การพัฒนาในเครื่อง, VPS, หลายเอเจนต์, OAuth/API keys, model failover) สำหรับการวินิจฉัยขณะรันไทม์ ดู [การแก้ปัญหา](/th/gateway/troubleshooting) สำหรับข้อมูลอ้างอิง config ฉบับเต็ม ดู [การกำหนดค่า](/th/gateway/configuration)

## 60 วินาทีแรกเมื่อมีบางอย่างเสีย

1. **สถานะด่วน (ตรวจสอบก่อน)**

   ```bash
   openclaw status
   ```

   สรุปในเครื่องอย่างรวดเร็ว: OS + อัปเดต, การเข้าถึง gateway/service, agents/sessions, provider config + ปัญหารันไทม์ (เมื่อเข้าถึง gateway ได้)

2. **รายงานที่วางได้ทันที (ปลอดภัยสำหรับแชร์)**

   ```bash
   openclaw status --all
   ```

   การวินิจฉัยแบบอ่านอย่างเดียวพร้อม log tail (ปกปิด tokens แล้ว)

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
   (ต้องมี gateway ที่เข้าถึงได้) ดู [Health](/th/gateway/health)

5. **ดู log ล่าสุดต่อเนื่อง**

   ```bash
   openclaw logs --follow
   ```

   ถ้า RPC ใช้งานไม่ได้ ให้ fallback เป็น:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   File logs แยกจาก service logs; ดู [Logging](/th/logging) และ [การแก้ปัญหา](/th/gateway/troubleshooting)

6. **รัน doctor (การซ่อมแซม)**

   ```bash
   openclaw doctor
   ```

   ซ่อมแซม/ย้าย config/state + รัน health checks ดู [Doctor](/th/gateway/doctor)

7. **Gateway snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # แสดง target URL + config path เมื่อเกิดข้อผิดพลาด
   ```

   ขอ snapshot ฉบับเต็มจาก gateway ที่กำลังรันอยู่ (WS เท่านั้น) ดู [Health](/th/gateway/health)

## Quick start และการตั้งค่าครั้งแรก

Q&A สำหรับการรันครั้งแรก — การติดตั้ง, onboard, auth routes, subscriptions, ความล้มเหลวช่วงแรก —
อยู่ที่ [คำถามที่พบบ่อยสำหรับการรันครั้งแรก](/th/help/faq-first-run)

## OpenClaw คืออะไร

<AccordionGroup>
  <Accordion title="OpenClaw คืออะไรในหนึ่งย่อหน้า">
    OpenClaw คือผู้ช่วย AI ส่วนตัวที่คุณรันบนอุปกรณ์ของคุณเอง มันตอบกลับบนพื้นผิวการส่งข้อความที่คุณใช้อยู่แล้ว (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat และ channel plugins ที่รวมมาด้วย เช่น QQ Bot) และยังทำเสียง + live Canvas บนแพลตฟอร์มที่รองรับได้ด้วย **Gateway** คือ control plane ที่เปิดตลอดเวลา; assistant คือผลิตภัณฑ์
  </Accordion>

  <Accordion title="คุณค่าหลัก">
    OpenClaw ไม่ใช่ "แค่ Claude wrapper" แต่เป็น **control plane แบบ local-first** ที่ให้คุณรัน
    assistant ที่มีความสามารถบน **ฮาร์ดแวร์ของคุณเอง** เข้าถึงได้จากแอปแชตที่คุณใช้อยู่แล้ว พร้อม
    sessions ที่มี state, memory และ tools - โดยไม่ต้องมอบการควบคุม workflow ของคุณให้ SaaS
    ที่โฮสต์อยู่ที่อื่น

    จุดเด่น:

    - **อุปกรณ์ของคุณ ข้อมูลของคุณ:** รัน Gateway ที่ใดก็ได้ตามต้องการ (Mac, Linux, VPS) และเก็บ
      workspace + session history ไว้ในเครื่อง
    - **ช่องทางจริง ไม่ใช่ web sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      พร้อมเสียงบนมือถือและ Canvas บนแพลตฟอร์มที่รองรับ
    - **ไม่ผูกกับโมเดลใดโมเดลหนึ่ง:** ใช้ Anthropic, OpenAI, MiniMax, OpenRouter ฯลฯ พร้อมการกำหนดเส้นทาง
      และ failover ต่อเอเจนต์
    - **ตัวเลือกเฉพาะในเครื่อง:** รันโมเดลในเครื่องเพื่อให้ **ข้อมูลทั้งหมดอยู่บนอุปกรณ์ของคุณได้** หากต้องการ
    - **การกำหนดเส้นทางหลายเอเจนต์:** แยก agents ตาม channel, account หรือ task โดยแต่ละตัวมี
      workspace และค่าเริ่มต้นของตัวเอง
    - **โอเพนซอร์สและปรับแต่งได้:** ตรวจสอบ ขยาย และ self-host ได้โดยไม่ถูกล็อกกับผู้ขายรายใด

    เอกสาร: [Gateway](/th/gateway), [Channels](/th/channels), [หลายเอเจนต์](/th/concepts/multi-agent),
    [Memory](/th/concepts/memory).

  </Accordion>

  <Accordion title="ฉันเพิ่งตั้งค่าเสร็จ - ควรทำอะไรก่อน">
    โปรเจกต์แรกที่เหมาะ:

    - สร้างเว็บไซต์ (WordPress, Shopify หรือ static site แบบเรียบง่าย)
    - ทำ prototype แอปมือถือ (outline, screens, API plan)
    - จัดระเบียบไฟล์และโฟลเดอร์ (cleanup, naming, tagging)
    - เชื่อมต่อ Gmail และทำ summaries หรือ follow ups อัตโนมัติ

    มันรับมือกับงานขนาดใหญ่ได้ แต่ทำงานได้ดีที่สุดเมื่อคุณแบ่งงานเป็นเฟสและ
    ใช้ sub agents สำหรับงานแบบขนาน

  </Accordion>

  <Accordion title="ห้า use cases ประจำวันยอดนิยมสำหรับ OpenClaw คืออะไร">
    สิ่งที่ช่วยได้ในชีวิตประจำวันมักมีลักษณะดังนี้:

    - **Personal briefings:** สรุป inbox, calendar และข่าวที่คุณสนใจ
    - **Research and drafting:** ค้นคว้าอย่างรวดเร็ว สรุป และร่างฉบับแรกสำหรับ emails หรือ docs
    - **Reminders and follow ups:** การสะกิดเตือนและ checklists ที่ขับเคลื่อนด้วย Cron หรือ Heartbeat
    - **Browser automation:** กรอกฟอร์ม เก็บข้อมูล และทำงานเว็บซ้ำ ๆ
    - **การประสานงานข้ามอุปกรณ์:** ส่ง task จากโทรศัพท์ของคุณ ให้ Gateway รันบน server แล้วรับผลลัพธ์กลับใน chat

  </Accordion>

  <Accordion title="OpenClaw ช่วยเรื่อง lead gen, outreach, ads และ blogs สำหรับ SaaS ได้ไหม">
    ได้สำหรับ **การค้นคว้า การคัดกรอง และการร่าง** มันสแกนไซต์ สร้าง shortlists
    สรุป prospects และเขียน drafts สำหรับ outreach หรือ ad copy ได้

    สำหรับ **outreach หรือ ad runs** ให้มีมนุษย์อยู่ใน loop หลีกเลี่ยง spam ทำตามกฎหมายท้องถิ่นและ
    นโยบายแพลตฟอร์ม และตรวจทานทุกอย่างก่อนส่ง รูปแบบที่ปลอดภัยที่สุดคือให้
    OpenClaw ร่าง แล้วคุณอนุมัติ

    เอกสาร: [Security](/th/gateway/security).

  </Accordion>

  <Accordion title="ข้อดีเมื่อเทียบกับ Claude Code สำหรับการพัฒนาเว็บคืออะไร">
    OpenClaw คือ **ผู้ช่วยส่วนตัว** และเลเยอร์การประสานงาน ไม่ใช่ตัวแทน IDE ใช้
    Claude Code หรือ Codex สำหรับลูปการเขียนโค้ดโดยตรงที่เร็วที่สุดภายใน repo ใช้ OpenClaw เมื่อคุณ
    ต้องการ memory ที่คงอยู่ การเข้าถึงข้ามอุปกรณ์ และการประสาน tools

    ข้อดี:

    - **Persistent memory + workspace** ข้าม sessions
    - **การเข้าถึงหลายแพลตฟอร์ม** (WhatsApp, Telegram, TUI, WebChat)
    - **การประสาน tools** (browser, files, scheduling, hooks)
    - **Gateway ที่เปิดตลอดเวลา** (รันบน VPS, โต้ตอบได้จากทุกที่)
    - **Nodes** สำหรับ local browser/screen/camera/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills และระบบอัตโนมัติ

<AccordionGroup>
  <Accordion title="ฉันจะปรับแต่ง Skills โดยไม่ทำให้ repo สกปรกได้อย่างไร">
    ใช้ managed overrides แทนการแก้ไขสำเนาใน repo ใส่การเปลี่ยนแปลงของคุณใน `~/.openclaw/skills/<name>/SKILL.md` (หรือเพิ่มโฟลเดอร์ผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json`) ลำดับความสำคัญคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` ดังนั้น managed overrides ยังชนะ bundled skills โดยไม่แตะ git หากคุณต้องติดตั้ง skill แบบ global แต่ให้เห็นได้เฉพาะบาง agents ให้เก็บสำเนาที่แชร์ใน `~/.openclaw/skills` และควบคุม visibility ด้วย `agents.defaults.skills` และ `agents.list[].skills` เฉพาะการแก้ไขที่ควรส่ง upstream เท่านั้นที่ควรอยู่ใน repo และออกเป็น PRs
  </Accordion>

  <Accordion title="ฉันโหลด Skills จากโฟลเดอร์กำหนดเองได้ไหม">
    ได้ เพิ่ม directories เพิ่มเติมผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json` (ลำดับความสำคัญต่ำสุด) ลำดับความสำคัญเริ่มต้นคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` `clawhub` ติดตั้งลงใน `./skills` โดยค่าเริ่มต้น ซึ่ง OpenClaw ถือเป็น `<workspace>/skills` ใน session ถัดไป หาก skill ควรเห็นได้เฉพาะบาง agents ให้จับคู่กับ `agents.defaults.skills` หรือ `agents.list[].skills`
  </Accordion>

  <Accordion title="ฉันจะใช้โมเดลหรือการตั้งค่าต่างกันสำหรับงานต่างกันได้อย่างไร">
    ปัจจุบัน pattern ที่รองรับคือ:

    - **Cron jobs**: jobs ที่แยกกันสามารถตั้งค่า `model` override ต่อ job ได้
    - **Agents**: กำหนดเส้นทาง tasks ไปยัง agents แยกกันที่มีโมเดลเริ่มต้น thinking levels และ stream params ต่างกัน
    - **On-demand switch**: ใช้ `/model` เพื่อสลับโมเดลของ session ปัจจุบันได้ทุกเมื่อ

    ตัวอย่างเช่น ใช้โมเดลเดียวกันพร้อมการตั้งค่าต่อเอเจนต์ที่ต่างกัน:

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    ใส่ค่าเริ่มต้นต่อโมเดลที่แชร์ร่วมกันใน `agents.defaults.models["provider/model"].params` จากนั้นใส่ overrides เฉพาะเอเจนต์ใน `agents.list[].params` แบบ flat อย่ากำหนด entries `agents.list[].models["provider/model"].params` แบบ nested แยกต่างหากสำหรับโมเดลเดียวกัน; `agents.list[].models` ใช้สำหรับ per-agent model catalog และ runtime overrides

    ดู [Cron jobs](/th/automation/cron-jobs), [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [การกำหนดค่า](/th/gateway/config-agents) และ [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="บอตค้างระหว่างทำงานหนัก ฉันจะ offload งานนั้นได้อย่างไร">
    ใช้ **sub-agents** สำหรับงานยาวหรืองานขนาน Sub-agents รันใน session ของตัวเอง
    ส่ง summary กลับมา และทำให้ chat หลักของคุณยังตอบสนองได้

    ขอให้บอตของคุณ "spawn a sub-agent for this task" หรือใช้ `/subagents`
    ใช้ `/status` ใน chat เพื่อดูว่า Gateway กำลังทำอะไรอยู่ตอนนี้ (และกำลังยุ่งอยู่หรือไม่)

    เคล็ดลับเรื่อง token: งานยาวและ sub-agents ต่างก็ใช้ tokens หากกังวลเรื่องค่าใช้จ่าย ให้ตั้ง
    โมเดลที่ถูกกว่าสำหรับ sub-agents ผ่าน `agents.defaults.subagents.model`

    เอกสาร: [Sub-agents](/th/tools/subagents), [Background Tasks](/th/automation/tasks).

  </Accordion>

  <Accordion title="thread-bound subagent sessions ทำงานอย่างไรบน Discord">
    ใช้ thread bindings คุณสามารถ bind Discord thread เข้ากับ subagent หรือ session target เพื่อให้ follow-up messages ใน thread นั้นยังอยู่บน session ที่ bind ไว้

    Flow พื้นฐาน:

    - Spawn ด้วย `sessions_spawn` โดยใช้ `thread: true` (และเลือกใช้ `mode: "session"` สำหรับ follow-up แบบ persistent)
    - หรือ bind ด้วยตนเองด้วย `/focus <target>`
    - ใช้ `/agents` เพื่อตรวจสอบ binding state
    - ใช้ `/session idle <duration|off>` และ `/session max-age <duration|off>` เพื่อควบคุม auto-unfocus
    - ใช้ `/unfocus` เพื่อ detach thread

    Config ที่ต้องใช้:

    - ค่าเริ่มต้น global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
    - Discord overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`
    - Auto-bind เมื่อ spawn: `channels.discord.threadBindings.spawnSessions` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เพื่อปิด thread-bound session spawns

    เอกสาร: [Sub-agents](/th/tools/subagents), [Discord](/th/channels/discord), [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference), [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="subagent เสร็จแล้ว แต่ completion update ไปผิดที่หรือไม่เคยถูกโพสต์ ฉันควรตรวจสอบอะไร">
    ตรวจสอบ requester route ที่ resolve แล้วก่อน:

    - การส่ง subagent แบบ completion-mode จะเลือก bound thread หรือ conversation route ใด ๆ ก่อนเมื่อมีอยู่
    - หาก completion origin มีเพียง channel, OpenClaw จะ fallback ไปยัง stored route ของ requester session (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้ direct delivery ยังสำเร็จได้
    - หากไม่มีทั้ง bound route และ stored route ที่ใช้งานได้ direct delivery อาจล้มเหลว และผลลัพธ์จะ fallback ไปยัง queued session delivery แทนการโพสต์เข้า chat ทันที
    - targets ที่ไม่ถูกต้องหรือล้าสมัยยังอาจบังคับให้ queue fallback หรือ final delivery failure ได้
    - หาก assistant reply ที่มองเห็นล่าสุดของ child เป็น silent token ตรงตัว `NO_REPLY` / `no_reply` หรือเป็น `ANNOUNCE_SKIP` ตรงตัว OpenClaw จะตั้งใจ suppress การประกาศแทนการโพสต์ progress ก่อนหน้าที่ล้าสมัย
    - output ของ Tool/toolResult จะไม่ถูก promote เป็น child result text; result คือ assistant reply ล่าสุดที่มองเห็นได้ของ child

    ดีบัก:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [ตัวแทนย่อย](/th/tools/subagents), [งานเบื้องหลัง](/th/automation/tasks), [เครื่องมือเซสชัน](/th/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron หรือการเตือนไม่ทำงาน ควรตรวจสอบอะไร?">
    Cron ทำงานภายในกระบวนการ Gateway หาก Gateway ไม่ได้ทำงานอย่างต่อเนื่อง
    งานที่ตั้งเวลาไว้จะไม่ทำงาน

    รายการตรวจสอบ:

    - ยืนยันว่าเปิดใช้ cron แล้ว (`cron.enabled`) และไม่ได้ตั้งค่า `OPENCLAW_SKIP_CRON`
    - ตรวจสอบว่า Gateway ทำงานตลอด 24/7 (ไม่มีการพักเครื่อง/รีสตาร์ต)
    - ตรวจสอบการตั้งค่าเขตเวลาของงาน (`--tz` เทียบกับเขตเวลาของโฮสต์)

    ดีบัก:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [Automation](/th/automation).

  </Accordion>

  <Accordion title="Cron ทำงานแล้ว แต่ไม่มีอะไรถูกส่งไปยังช่องทาง เพราะอะไร?">
    ตรวจสอบโหมดการส่งก่อน:

    - `--no-deliver` / `delivery.mode: "none"` หมายความว่าไม่คาดว่าจะมีการส่งสำรองจาก runner
    - เป้าหมายประกาศหายไปหรือไม่ถูกต้อง (`channel` / `to`) หมายความว่า runner ข้ามการส่งออก
    - การตรวจสอบสิทธิ์ช่องทางล้มเหลว (`unauthorized`, `Forbidden`) หมายความว่า runner พยายามส่งแล้ว แต่ข้อมูลรับรองขัดขวางไว้
    - ผลลัพธ์แยกแบบเงียบ (`NO_REPLY` / `no_reply` เท่านั้น) จะถือว่าตั้งใจให้ส่งไม่ได้ ดังนั้น runner จึงระงับการส่งสำรองที่เข้าคิวไว้ด้วย

    สำหรับงาน cron แบบแยก ตัวแทนยังส่งโดยตรงด้วยเครื่องมือ `message`
    ได้เมื่อมีเส้นทางแชตพร้อมใช้งาน `--announce` ควบคุมเฉพาะเส้นทางสำรองของ runner
    สำหรับข้อความสุดท้ายที่ตัวแทนยังไม่ได้ส่งเอง

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [งานเบื้องหลัง](/th/automation/tasks).

  </Accordion>

  <Accordion title="ทำไมการรัน cron แบบแยกจึงสลับโมเดลหรือลองใหม่หนึ่งครั้ง?">
    โดยปกตินั่นคือเส้นทางสลับโมเดลแบบ live ไม่ใช่การตั้งเวลาซ้ำ

    cron แบบแยกสามารถคงการส่งต่อโมเดลรันไทม์และลองใหม่ได้เมื่อการรันที่ใช้งานอยู่
    โยน `LiveSessionModelSwitchError` การลองใหม่จะคง provider/model
    ที่สลับแล้วไว้ และหากการสลับมีการ override โปรไฟล์การตรวจสอบสิทธิ์ใหม่ cron
    ก็จะคงค่านั้นไว้ก่อนลองใหม่ด้วย

    กฎการเลือกที่เกี่ยวข้อง:

    - การ override โมเดลของ Gmail hook ชนะก่อนเมื่อใช้ได้
    - จากนั้นเป็น `model` ต่อแต่ละงาน
    - จากนั้นเป็นการ override โมเดล cron-session ที่จัดเก็บไว้
    - จากนั้นเป็นการเลือกโมเดลปกติของตัวแทน/ค่าเริ่มต้น

    ลูปการลองใหม่มีขอบเขต หลังจากความพยายามเริ่มต้นบวกกับการลองใหม่จากการสลับ 2 ครั้ง
    cron จะยกเลิกแทนที่จะวนซ้ำตลอดไป

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [CLI cron](/th/cli/cron).

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง Skills บน Linux ได้อย่างไร?">
    ใช้คำสั่ง `openclaw skills` แบบเนทีฟหรือวาง Skills ลงในพื้นที่ทำงานของคุณ UI Skills ของ macOS ไม่มีให้ใช้บน Linux
    เรียกดู Skills ได้ที่ [https://clawhub.ai](https://clawhub.ai)

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    โดยค่าเริ่มต้น `openclaw skills install` แบบเนทีฟจะเขียนลงในไดเรกทอรี `skills/`
    ของพื้นที่ทำงานที่ใช้งานอยู่ เพิ่ม `--global` เพื่อติดตั้งลงในไดเรกทอรี Skills
    ที่จัดการร่วมกันสำหรับตัวแทนทั้งหมดในเครื่อง ติดตั้ง CLI `clawhub` แยกต่างหาก
    เฉพาะเมื่อคุณต้องการเผยแพร่หรือซิงค์ Skills ของคุณเอง ใช้
    `agents.defaults.skills` หรือ `agents.list[].skills` หากคุณต้องการจำกัด
    ว่าตัวแทนใดมองเห็น Skills ที่แชร์ได้

  </Accordion>

  <Accordion title="OpenClaw สามารถรันงานตามกำหนดเวลาหรือทำงานต่อเนื่องในเบื้องหลังได้หรือไม่?">
    ได้ ใช้ตัวจัดกำหนดการของ Gateway:

    - **งาน Cron** สำหรับงานที่ตั้งเวลาไว้หรืองานที่ทำซ้ำ (คงอยู่ข้ามการรีสตาร์ต)
    - **Heartbeat** สำหรับการตรวจสอบเป็นระยะของ "เซสชันหลัก"
    - **งานแบบแยก** สำหรับตัวแทนอัตโนมัติที่โพสต์สรุปหรือส่งไปยังแชต

    เอกสาร: [งาน Cron](/th/automation/cron-jobs), [Automation](/th/automation),
    [Heartbeat](/th/gateway/heartbeat).

  </Accordion>

  <Accordion title="ฉันสามารถรัน Skills ที่ใช้ได้เฉพาะ Apple macOS จาก Linux ได้หรือไม่?">
    ไม่ได้โดยตรง Skills ของ macOS ถูกจำกัดด้วย `metadata.openclaw.os` รวมถึงไบนารีที่จำเป็น และ Skills จะปรากฏในพรอมป์ต์ระบบเฉพาะเมื่อมีสิทธิ์ใช้งานบน **โฮสต์ Gateway** บน Linux Skills ที่ใช้ได้เฉพาะ `darwin` (เช่น `apple-notes`, `apple-reminders`, `things-mac`) จะไม่โหลด เว้นแต่คุณจะ override การจำกัดสิทธิ์

    คุณมีรูปแบบที่รองรับสามแบบ:

    **ตัวเลือก A - รัน Gateway บน Mac (ง่ายที่สุด)**
    รัน Gateway ในที่ที่มีไบนารีของ macOS แล้วเชื่อมต่อจาก Linux ใน[โหมดระยะไกล](#gateway-ports-already-running-and-remote-mode) หรือผ่าน Tailscale Skills จะโหลดตามปกติเพราะโฮสต์ Gateway เป็น macOS

    **ตัวเลือก B - ใช้โหนด macOS (ไม่มี SSH)**
    รัน Gateway บน Linux จับคู่โหนด macOS (แอปแถบเมนู) และตั้งค่า **Node Run Commands** เป็น "ถามเสมอ" หรือ "อนุญาตเสมอ" บน Mac OpenClaw สามารถถือว่า Skills ที่ใช้ได้เฉพาะ macOS มีสิทธิ์ใช้งานเมื่อมีไบนารีที่จำเป็นอยู่บนโหนด ตัวแทนจะรัน Skills เหล่านั้นผ่านเครื่องมือ `nodes` หากคุณเลือก "ถามเสมอ" การอนุมัติ "อนุญาตเสมอ" ในพรอมป์ต์จะเพิ่มคำสั่งนั้นลงใน allowlist

    **ตัวเลือก C - พร็อกซีไบนารี macOS ผ่าน SSH (ขั้นสูง)**
    ให้ Gateway อยู่บน Linux ต่อไป แต่ทำให้ไบนารี CLI ที่จำเป็น resolve ไปยัง wrapper SSH ที่รันบน Mac จากนั้น override Skill เพื่ออนุญาต Linux เพื่อให้ยังมีสิทธิ์ใช้งาน

    1. สร้าง wrapper SSH สำหรับไบนารี (ตัวอย่าง: `memo` สำหรับ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. วาง wrapper ไว้บน `PATH` บนโฮสต์ Linux (เช่น `~/bin/memo`)
    3. Override เมตาดาต้า Skill (พื้นที่ทำงานหรือ `~/.openclaw/skills`) เพื่ออนุญาต Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. เริ่มเซสชันใหม่เพื่อให้สแนปช็อต Skills รีเฟรช

  </Accordion>

  <Accordion title="คุณมีการผสานรวม Notion หรือ HeyGen หรือไม่?">
    วันนี้ยังไม่มีในตัว

    ตัวเลือก:

    - **Skill / Plugin แบบกำหนดเอง:** เหมาะที่สุดสำหรับการเข้าถึง API ที่เชื่อถือได้ (Notion/HeyGen ต่างก็มี API)
    - **ระบบอัตโนมัติบนเบราว์เซอร์:** ทำงานได้โดยไม่ต้องเขียนโค้ด แต่ช้ากว่าและเปราะบางกว่า

    หากคุณต้องการเก็บบริบทต่อไคลเอนต์ (เวิร์กโฟลว์เอเจนซี) รูปแบบง่าย ๆ คือ:

    - หนึ่งหน้า Notion ต่อหนึ่งไคลเอนต์ (บริบท + การตั้งค่า + งานที่ใช้งานอยู่)
    - ขอให้ตัวแทนดึงหน้านั้นเมื่อเริ่มเซสชัน

    หากคุณต้องการการผสานรวมแบบเนทีฟ ให้เปิดคำขอคุณสมบัติหรือสร้าง Skill
    ที่กำหนดเป้าหมาย API เหล่านั้น

    ติดตั้ง Skills:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    การติดตั้งแบบเนทีฟจะลงในไดเรกทอรี `skills/` ของพื้นที่ทำงานที่ใช้งานอยู่ สำหรับ Skills ที่แชร์ข้ามตัวแทนทั้งหมดในเครื่อง ให้ใช้ `openclaw skills install @owner/<skill-slug> --global` (หรือวางเองใน `~/.openclaw/skills/<name>/SKILL.md`) หากควรให้เฉพาะบางตัวแทนมองเห็นการติดตั้งที่แชร์ ให้กำหนดค่า `agents.defaults.skills` หรือ `agents.list[].skills` Skills บางรายการคาดหวังให้มีไบนารีที่ติดตั้งผ่าน Homebrew บน Linux หมายถึง Linuxbrew (ดูรายการ FAQ Homebrew Linux ด้านบน) ดู [Skills](/th/tools/skills), [การกำหนดค่า Skills](/th/tools/skills-config), และ [ClawHub](/th/clawhub)

  </Accordion>

  <Accordion title="ฉันจะใช้ Chrome ที่ลงชื่อเข้าใช้อยู่แล้วกับ OpenClaw ได้อย่างไร?">
    ใช้โปรไฟล์เบราว์เซอร์ `user` ในตัว ซึ่งเชื่อมต่อผ่าน Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    หากคุณต้องการชื่อที่กำหนดเอง ให้สร้างโปรไฟล์ MCP แบบชัดเจน:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    เส้นทางนี้สามารถใช้เบราว์เซอร์โฮสต์ในเครื่องหรือโหนดเบราว์เซอร์ที่เชื่อมต่ออยู่ หาก Gateway รันที่อื่น ให้รันโฮสต์โหนดบนเครื่องเบราว์เซอร์หรือใช้ CDP ระยะไกลแทน

    ขีดจำกัดปัจจุบันของ `existing-session` / `user`:

    - การดำเนินการขับเคลื่อนด้วย ref ไม่ใช่ด้วย CSS selector
    - การอัปโหลดต้องใช้ `ref` / `inputRef` และปัจจุบันรองรับทีละไฟล์
    - `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการดำเนินการแบบชุดยังต้องใช้เบราว์เซอร์ที่จัดการแล้วหรือโปรไฟล์ CDP ดิบ

  </Accordion>
</AccordionGroup>

## Sandboxing และหน่วยความจำ

<AccordionGroup>
  <Accordion title="มีเอกสาร Sandboxing เฉพาะหรือไม่?">
    มี ดู [Sandboxing](/th/gateway/sandboxing) สำหรับการตั้งค่าเฉพาะ Docker (Gateway เต็มรูปแบบใน Docker หรืออิมเมจ sandbox) ดู [Docker](/th/install/docker)
  </Accordion>

  <Accordion title="Docker ดูมีข้อจำกัด - ฉันจะเปิดใช้คุณสมบัติเต็มรูปแบบได้อย่างไร?">
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยก่อนและรันเป็นผู้ใช้ `node` ดังนั้นจึงไม่
    รวมแพ็กเกจระบบ, Homebrew หรือเบราว์เซอร์ที่ bundled มา หากต้องการตั้งค่าที่ครบถ้วนกว่า:

    - คง `/home/node` ไว้ด้วย `OPENCLAW_HOME_VOLUME` เพื่อให้แคชอยู่รอด
    - ใส่ dependency ของระบบลงในอิมเมจด้วย `OPENCLAW_IMAGE_APT_PACKAGES`
    - ติดตั้งเบราว์เซอร์ Playwright ผ่าน CLI ที่ bundled มา:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` และตรวจสอบให้แน่ใจว่า path นั้นถูกคงไว้

    เอกสาร: [Docker](/th/install/docker), [เบราว์เซอร์](/th/tools/browser).

  </Accordion>

  <Accordion title="ฉันสามารถทำให้ DM เป็นส่วนตัว แต่ทำให้กลุ่มเป็นสาธารณะ/อยู่ใน sandbox ด้วยตัวแทนเดียวได้หรือไม่?">
    ได้ - หากทราฟฟิกส่วนตัวของคุณคือ **DMs** และทราฟฟิกสาธารณะของคุณคือ **กลุ่ม**

    ใช้ `agents.defaults.sandbox.mode: "non-main"` เพื่อให้เซสชันกลุ่ม/ช่องทาง (คีย์ non-main) รันในแบ็กเอนด์ sandbox ที่กำหนดค่าไว้ ขณะที่เซสชัน DM หลักยังอยู่บนโฮสต์ Docker เป็นแบ็กเอนด์เริ่มต้นหากคุณไม่ได้เลือกอย่างใดอย่างหนึ่ง จากนั้นจำกัดว่าเครื่องมือใดพร้อมใช้งานในเซสชัน sandbox ผ่าน `tools.sandbox.tools`

    คำแนะนำการตั้งค่า + ตัวอย่าง config: [กลุ่ม: DM ส่วนตัว + กลุ่มสาธารณะ](/th/channels/groups#pattern-personal-dms-public-groups-single-agent)

    ข้อมูลอ้างอิง config หลัก: [การกำหนดค่า Gateway](/th/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ฉันจะผูกโฟลเดอร์ของโฮสต์เข้าใน sandbox ได้อย่างไร?">
    ตั้งค่า `agents.defaults.sandbox.docker.binds` เป็น `["host:path:mode"]` (เช่น `"/home/user/src:/src:ro"`) bind ระดับ global และต่อแต่ละตัวแทนจะถูกรวมกัน; bind ต่อแต่ละตัวแทนจะถูกละเว้นเมื่อ `scope: "shared"` ใช้ `:ro` สำหรับสิ่งที่ละเอียดอ่อน และจำไว้ว่า bind จะข้ามกำแพงระบบไฟล์ของ sandbox

    OpenClaw ตรวจสอบแหล่ง bind กับทั้ง path ที่ normalize แล้วและ path canonical ที่ resolve ผ่าน ancestor ที่มีอยู่ลึกที่สุด นั่นหมายความว่าการหลุดออกผ่าน symlink-parent ยังคง fail closed แม้เมื่อ segment สุดท้ายของ path ยังไม่มีอยู่ และการตรวจสอบ allowed-root ยังคงใช้หลังจาก resolve symlink แล้ว

    ดู [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts) และ [Sandbox เทียบกับนโยบายเครื่องมือเทียบกับ Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) สำหรับตัวอย่างและหมายเหตุด้านความปลอดภัย

  </Accordion>

  <Accordion title="หน่วยความจำทำงานอย่างไร?">
    หน่วยความจำของ OpenClaw เป็นเพียงไฟล์ Markdown ในพื้นที่ทำงานของตัวแทน:

    - โน้ตรายวันใน `memory/YYYY-MM-DD.md`
    - โน้ตระยะยาวที่คัดสรรแล้วใน `MEMORY.md` (เฉพาะเซสชันหลัก/ส่วนตัว)

    OpenClaw ยังรัน **การ flush หน่วยความจำก่อน Compaction แบบเงียบ** เพื่อเตือนโมเดล
    ให้เขียนโน้ตที่คงทนก่อน auto-compaction สิ่งนี้จะรันเฉพาะเมื่อพื้นที่ทำงาน
    เขียนได้ (sandbox แบบอ่านอย่างเดียวจะข้ามไป) ดู [หน่วยความจำ](/th/concepts/memory)

  </Accordion>

  <Accordion title="Memory ลืมสิ่งต่าง ๆ อยู่เรื่อย ๆ ฉันจะทำให้จำไว้ได้อย่างไร?">
    ขอให้บอต **เขียนข้อเท็จจริงลงใน memory** โน้ตระยะยาวควรอยู่ใน `MEMORY.md`
    ส่วนบริบทระยะสั้นอยู่ใน `memory/YYYY-MM-DD.md`

    ส่วนนี้ยังเป็นพื้นที่ที่เรากำลังปรับปรุงอยู่ การเตือนโมเดลให้จัดเก็บ memory จะช่วยได้;
    โมเดลจะรู้ว่าต้องทำอะไร หากยังลืมอยู่ ให้ตรวจสอบว่า Gateway ใช้
    workspace เดียวกันในการรันทุกครั้ง

    เอกสาร: [Memory](/th/concepts/memory), [workspace ของ agent](/th/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Memory คงอยู่ตลอดไปหรือไม่? มีข้อจำกัดอะไรบ้าง?">
    ไฟล์ memory อยู่บนดิสก์และคงอยู่จนกว่าคุณจะลบ ข้อจำกัดคือ
    พื้นที่จัดเก็บของคุณ ไม่ใช่โมเดล **บริบทของเซสชัน** ยังถูกจำกัดโดย
    context window ของโมเดล ดังนั้นบทสนทนายาว ๆ อาจถูก compact หรือตัดทอนได้ นั่นคือเหตุผลที่มี
    การค้นหา memory - มันดึงเฉพาะส่วนที่เกี่ยวข้องกลับเข้าสู่บริบท

    เอกสาร: [Memory](/th/concepts/memory), [บริบท](/th/concepts/context).

  </Accordion>

  <Accordion title="การค้นหา semantic memory ต้องใช้คีย์ OpenAI API หรือไม่?">
    ต้องใช้เฉพาะเมื่อคุณใช้ **embeddings ของ OpenAI** Codex OAuth ครอบคลุม chat/completions และ
    **ไม่** ให้สิทธิ์เข้าถึง embeddings ดังนั้น **การลงชื่อเข้าใช้ด้วย Codex (OAuth หรือ
    การเข้าสู่ระบบ Codex CLI)** จึงไม่ช่วยสำหรับการค้นหา semantic memory embeddings ของ OpenAI
    ยังต้องใช้คีย์ API จริง (`OPENAI_API_KEY` หรือ `models.providers.openai.apiKey`)

    หากคุณไม่ได้ตั้งค่า provider อย่างชัดเจน OpenClaw จะใช้ embeddings ของ OpenAI คอนฟิกแบบเก่า
    ที่ยังระบุ `memorySearch.provider = "auto"` ก็จะ resolve เป็น OpenAI เช่นกัน
    หากไม่มีคีย์ OpenAI API การค้นหา semantic memory จะยังใช้ไม่ได้
    จนกว่าคุณจะคอนฟิกคีย์หรือเลือก provider อื่นอย่างชัดเจน

    หากคุณต้องการใช้งานแบบ local ให้ตั้งค่า `memorySearch.provider = "local"` (และจะตั้ง
    `memorySearch.fallback = "none"` เพิ่มก็ได้) หากคุณต้องการ embeddings ของ Gemini ให้ตั้งค่า
    `memorySearch.provider = "gemini"` และระบุ `GEMINI_API_KEY` (หรือ
    `memorySearch.remote.apiKey`) เรารองรับโมเดล embeddings แบบ **OpenAI, ที่เข้ากันได้กับ OpenAI, Gemini,
    Voyage, Mistral, Bedrock, Ollama, LM Studio, GitHub Copilot, DeepInfra หรือ local**
    - ดูรายละเอียดการตั้งค่าได้ที่ [Memory](/th/concepts/memory)

  </Accordion>
</AccordionGroup>

## สิ่งต่าง ๆ อยู่ที่ไหนบนดิสก์

<AccordionGroup>
  <Accordion title="ข้อมูลทั้งหมดที่ใช้กับ OpenClaw ถูกบันทึกไว้ในเครื่องหรือไม่?">
    ไม่ใช่ - **state ของ OpenClaw อยู่ในเครื่อง** แต่ **บริการภายนอกยังเห็นสิ่งที่คุณส่งไปให้**

    - **อยู่ในเครื่องโดยค่าเริ่มต้น:** เซสชัน, ไฟล์ memory, คอนฟิก และ workspace อยู่บนโฮสต์ Gateway
      (`~/.openclaw` + ไดเรกทอรี workspace ของคุณ)
    - **อยู่ระยะไกลโดยความจำเป็น:** ข้อความที่คุณส่งไปยัง model providers (Anthropic/OpenAI/ฯลฯ) จะไปยัง
      API ของพวกเขา และแพลตฟอร์มแชต (WhatsApp/Telegram/Slack/ฯลฯ) จะจัดเก็บข้อมูลข้อความไว้บน
      เซิร์ฟเวอร์ของพวกเขา
    - **คุณควบคุม footprint ได้:** การใช้โมเดล local จะเก็บ prompts ไว้บนเครื่องของคุณ แต่ทราฟฟิกของ channel
      ยังคงผ่านเซิร์ฟเวอร์ของ channel

    ที่เกี่ยวข้อง: [workspace ของ agent](/th/concepts/agent-workspace), [Memory](/th/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw จัดเก็บข้อมูลไว้ที่ไหน?">
    ทุกอย่างอยู่ภายใต้ `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`):

    | พาธ                                                            | วัตถุประสงค์                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | คอนฟิกหลัก (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | การนำเข้า OAuth แบบเก่า (คัดลอกเข้า auth profiles เมื่อใช้ครั้งแรก)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth, คีย์ API และ `keyRef`/`tokenRef` ที่เป็นทางเลือก)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | payload ลับที่มีไฟล์เป็น backend ซึ่งเป็นทางเลือกสำหรับ provider SecretRef แบบ `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ไฟล์ความเข้ากันได้แบบเก่า (ล้างรายการ `api_key` แบบ static แล้ว)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | state ของ provider (เช่น `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | state ต่อ agent (agentDir + sessions)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | ประวัติและ state ของบทสนทนา (ต่อ agent)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | เมทาดาทาของเซสชัน (ต่อ agent)                                       |

    พาธ agent เดี่ยวแบบเก่า: `~/.openclaw/agent/*` (ย้ายข้อมูลโดย `openclaw doctor`)

    **workspace** ของคุณ (AGENTS.md, ไฟล์ memory, skills, ฯลฯ) แยกต่างหากและคอนฟิกผ่าน `agents.defaults.workspace` (ค่าเริ่มต้น: `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md ควรอยู่ที่ไหน?">
    ไฟล์เหล่านี้อยู่ใน **workspace ของ agent** ไม่ใช่ `~/.openclaw`

    - **Workspace (ต่อ agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` ที่เป็นทางเลือก
      `memory.md` ตัวพิมพ์เล็กที่ root เป็นเพียงอินพุตสำหรับการซ่อมแซมแบบเก่า; `openclaw doctor --fix`
      สามารถรวมมันเข้าใน `MEMORY.md` ได้เมื่อมีทั้งสองไฟล์
    - **State dir (`~/.openclaw`)**: คอนฟิก, state ของ channel/provider, auth profiles, เซสชัน, log,
      และ Skills ที่แชร์ (`~/.openclaw/skills`)

    ค่าเริ่มต้นของ workspace คือ `~/.openclaw/workspace` ซึ่งคอนฟิกได้ผ่าน:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    หากบอต "ลืม" หลังรีสตาร์ต ให้ยืนยันว่า Gateway ใช้
    workspace เดียวกันทุกครั้งที่เปิดใช้งาน (และจำไว้ว่า: โหมด remote ใช้
    workspace ของ **โฮสต์ gateway** ไม่ใช่แล็ปท็อป local ของคุณ)

    เคล็ดลับ: หากคุณต้องการพฤติกรรมหรือ preference ที่คงทน ให้ขอให้บอต **เขียนลงใน
    AGENTS.md หรือ MEMORY.md** แทนการพึ่งพาประวัติแชต

    ดู [workspace ของ agent](/th/concepts/agent-workspace) และ [Memory](/th/concepts/memory).

  </Accordion>

  <Accordion title="ฉันทำให้ SOUL.md ใหญ่ขึ้นได้ไหม?">
    ได้ `SOUL.md` เป็นหนึ่งในไฟล์ bootstrap ของ workspace ที่ถูกฉีดเข้าไปใน
    บริบทของ agent ขีดจำกัดการฉีดต่อไฟล์เริ่มต้นคือ `20000` อักขระ
    และงบประมาณ bootstrap รวมข้ามไฟล์คือ `60000` อักขระ

    เปลี่ยนค่าเริ่มต้นที่แชร์ในคอนฟิก OpenClaw ของคุณ:

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    หรือ override agent หนึ่งตัว:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            bootstrapMaxChars: 50000,
            bootstrapTotalMaxChars: 300000,
          },
        ],
      },
    }
    ```

    ใช้ `/context` เพื่อตรวจสอบขนาด raw เทียบกับขนาดที่ถูกฉีด และดูว่าเกิดการตัดทอนหรือไม่
    ให้ `SOUL.md` มุ่งเน้นที่เสียง, จุดยืน และบุคลิกภาพ; ใส่กฎการปฏิบัติงาน
    ไว้ใน `AGENTS.md` และข้อเท็จจริงที่คงทนไว้ใน memory

    ดู [บริบท](/th/concepts/context) และ [คอนฟิก agent](/th/gateway/config-agents).

  </Accordion>

  <Accordion title="กลยุทธ์การสำรองข้อมูลที่แนะนำ">
    ใส่ **workspace ของ agent** ของคุณไว้ใน repo git แบบ **private** และสำรองไว้ที่ใดที่หนึ่ง
    ที่เป็น private (เช่น GitHub private) วิธีนี้จะเก็บ memory + ไฟล์ AGENTS/SOUL/USER
    และช่วยให้คุณกู้คืน "จิตใจ" ของผู้ช่วยได้ภายหลัง

    อย่า commit สิ่งใดก็ตามภายใต้ `~/.openclaw` (credentials, เซสชัน, tokens หรือ payloads ลับที่เข้ารหัส)
    หากคุณต้องการกู้คืนทั้งหมด ให้สำรองทั้ง workspace และ state directory
    แยกกัน (ดูคำถามเรื่องการย้ายข้อมูลด้านบน)

    เอกสาร: [workspace ของ agent](/th/concepts/agent-workspace).

  </Accordion>

  <Accordion title="ฉันจะถอนการติดตั้ง OpenClaw ทั้งหมดได้อย่างไร?">
    ดูคู่มือเฉพาะ: [ถอนการติดตั้ง](/th/install/uninstall).
  </Accordion>

  <Accordion title="Agents ทำงานนอก workspace ได้หรือไม่?">
    ได้ workspace คือ **cwd เริ่มต้น** และจุดยึดของ memory ไม่ใช่ sandbox แบบแข็ง
    พาธสัมพัทธ์จะ resolve ภายใน workspace แต่พาธสัมบูรณ์สามารถเข้าถึงตำแหน่งอื่น
    บนโฮสต์ได้ เว้นแต่จะเปิดใช้ sandboxing หากคุณต้องการการแยกกัน ให้ใช้
    [`agents.defaults.sandbox`](/th/gateway/sandboxing) หรือการตั้งค่า sandbox ต่อ agent หากคุณ
    ต้องการให้ repo เป็นไดเรกทอรีทำงานเริ่มต้น ให้ชี้ `workspace` ของ agent นั้น
    ไปที่ root ของ repo repo OpenClaw เป็นเพียง source code; แยก
    workspace ไว้ต่างหาก เว้นแต่คุณตั้งใจให้ agent ทำงานภายในนั้น

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

  <Accordion title="โหมด remote: session store อยู่ที่ไหน?">
    state ของเซสชันเป็นของ **โฮสต์ gateway** หากคุณอยู่ในโหมด remote session store ที่คุณสนใจจะอยู่บนเครื่อง remote ไม่ใช่แล็ปท็อป local ของคุณ ดู [การจัดการเซสชัน](/th/concepts/session).
  </Accordion>
</AccordionGroup>

## พื้นฐานคอนฟิก

<AccordionGroup>
  <Accordion title="คอนฟิกอยู่ในรูปแบบอะไร? อยู่ที่ไหน?">
    OpenClaw อ่านคอนฟิก **JSON5** ที่เป็นทางเลือกจาก `$OPENCLAW_CONFIG_PATH` (ค่าเริ่มต้น: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    หากไม่มีไฟล์ จะใช้ค่าเริ่มต้นที่ค่อนข้างปลอดภัย (รวมถึง workspace เริ่มต้นที่ `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title='ฉันตั้งค่า gateway.bind: "lan" (หรือ "tailnet") แล้วตอนนี้ไม่มีอะไร listen / UI บอกว่า unauthorized'>
    การ bind แบบไม่ใช่ loopback **ต้องมีพาธ auth ของ gateway ที่ถูกต้อง** ในทางปฏิบัติหมายถึง:

    - auth แบบ shared-secret: token หรือ password
    - `gateway.auth.mode: "trusted-proxy"` อยู่หลัง reverse proxy ที่รู้ identity และคอนฟิกอย่างถูกต้อง

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
    - พาธการเรียก local สามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
    - สำหรับ auth แบบ password ให้ตั้งค่า `gateway.auth.mode: "password"` พร้อม `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`) แทน
    - หาก `gateway.auth.token` / `gateway.auth.password` ถูกคอนฟิกอย่างชัดเจนผ่าน SecretRef และ resolve ไม่ได้ การ resolve จะ fail closed (ไม่มี remote fallback มาบัง)
    - การตั้งค่า Control UI แบบ shared-secret จะ authenticate ผ่าน `connect.params.auth.token` หรือ `connect.params.auth.password` (จัดเก็บใน settings ของ app/UI) โหมดที่มี identity เช่น Tailscale Serve หรือ `trusted-proxy` จะใช้ request headers แทน หลีกเลี่ยงการใส่ shared secrets ใน URLs
    - เมื่อใช้ `gateway.auth.mode: "trusted-proxy"` reverse proxies แบบ loopback บนโฮสต์เดียวกันต้องมี `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน และมีรายการ loopback ใน `gateway.trustedProxies`

  </Accordion>

  <Accordion title="ทำไมตอนนี้ฉันต้องใช้ token บน localhost?">
    OpenClaw บังคับใช้ auth ของ gateway โดยค่าเริ่มต้น รวมถึง loopback ในพาธเริ่มต้นตามปกติ นั่นหมายถึง auth แบบ token: หากไม่ได้คอนฟิกพาธ auth อย่างชัดเจน การเริ่มต้น gateway จะ resolve เป็นโหมด token และสร้าง token แบบใช้เฉพาะ runtime สำหรับการเริ่มต้นครั้งนั้น ดังนั้น **ไคลเอนต์ WS local ต้อง authenticate** คอนฟิก `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` หรือ `OPENCLAW_GATEWAY_PASSWORD` อย่างชัดเจนเมื่อไคลเอนต์ต้องการ secret ที่คงที่ข้ามการรีสตาร์ต วิธีนี้จะบล็อก process local อื่นไม่ให้เรียก Gateway.

    หากคุณต้องการเส้นทางการยืนยันตัวตนแบบอื่น คุณสามารถเลือกโหมดรหัสผ่านอย่างชัดเจนได้ (หรือ `trusted-proxy` สำหรับ reverse proxy ที่รับรู้ตัวตน) หากคุณ **ต้องการ** loopback แบบเปิดจริง ๆ ให้ตั้งค่า `gateway.auth.mode: "none"` อย่างชัดเจนใน config ของคุณ Doctor สามารถสร้าง token ให้คุณได้ทุกเมื่อ: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="ฉันต้องรีสตาร์ตหลังจากเปลี่ยน config ไหม">
    Gateway เฝ้าดู config และรองรับ hot-reload:

    - `gateway.reload.mode: "hybrid"` (ค่าเริ่มต้น): ใช้การเปลี่ยนแปลงที่ปลอดภัยแบบ hot-apply และรีสตาร์ตสำหรับการเปลี่ยนแปลงสำคัญ
    - รองรับ `hot`, `restart`, `off` ด้วย

  </Accordion>

  <Accordion title="ฉันจะปิด tagline ตลก ๆ ของ CLI ได้อย่างไร">
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

    - `off`: ซ่อนข้อความ tagline แต่ยังคงบรรทัดชื่อ banner/เวอร์ชันไว้
    - `default`: ใช้ `All your chats, one OpenClaw.` ทุกครั้ง
    - `random`: หมุนเวียน tagline ตลก/ตามฤดูกาล (พฤติกรรมเริ่มต้น)
    - หากคุณไม่ต้องการ banner เลย ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

  </Accordion>

  <Accordion title="ฉันจะเปิดใช้งาน web search (และ web fetch) ได้อย่างไร">
    `web_fetch` ทำงานได้โดยไม่ต้องใช้ API key ส่วน `web_search` ขึ้นอยู่กับ provider
    ที่คุณเลือก:

    - provider ที่ใช้ API เช่น Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity และ Tavily ต้องตั้งค่า API key ตามปกติ
    - Grok สามารถใช้ xAI OAuth จากการยืนยันตัวตนของโมเดลซ้ำได้ หรือ fallback ไปใช้ `XAI_API_KEY` / config web-search ของ plugin
    - Ollama Web Search ไม่ต้องใช้ key แต่ใช้โฮสต์ Ollama ที่คุณกำหนดค่าไว้และต้องใช้ `ollama signin`
    - DuckDuckGo ไม่ต้องใช้ key แต่เป็น integration แบบไม่เป็นทางการที่อิง HTML
    - SearXNG ไม่ต้องใช้ key/โฮสต์เองได้; กำหนดค่า `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl`

    **แนะนำ:** รัน `openclaw configure --section web` แล้วเลือก provider
    ทางเลือกผ่าน environment:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: xAI OAuth, `XAI_API_KEY`
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

    ตอนนี้ config web-search เฉพาะ provider อยู่ใต้ `plugins.entries.<plugin>.config.webSearch.*`
    เส้นทาง provider แบบเดิม `tools.web.search.*` ยังโหลดชั่วคราวเพื่อความเข้ากันได้ แต่ไม่ควรใช้กับ config ใหม่
    config fallback ของ Firecrawl web-fetch อยู่ใต้ `plugins.entries.firecrawl.config.webFetch.*`

    หมายเหตุ:

    - หากคุณใช้ allowlist ให้เพิ่ม `web_search`/`web_fetch`/`x_search` หรือ `group:web`
    - `web_fetch` เปิดใช้งานตามค่าเริ่มต้น (เว้นแต่จะปิดใช้งานอย่างชัดเจน)
    - หากละเว้น `tools.web.fetch.provider` OpenClaw จะตรวจหา provider fallback สำหรับ fetch ตัวแรกที่พร้อมใช้งานโดยอัตโนมัติจาก credentials ที่มีอยู่ Plugin Firecrawl อย่างเป็นทางการให้ fallback นี้
    - daemon อ่าน env vars จาก `~/.openclaw/.env` (หรือ environment ของบริการ)

    Docs: [เครื่องมือเว็บ](/th/tools/web).

  </Accordion>

  <Accordion title="config.apply ล้าง config ของฉัน ฉันจะกู้คืนและหลีกเลี่ยงปัญหานี้ได้อย่างไร">
    `config.apply` จะแทนที่ **config ทั้งหมด** หากคุณส่ง object บางส่วน ทุกอย่าง
    ที่เหลือจะถูกลบออก

    OpenClaw ปัจจุบันป้องกันการเขียนทับโดยไม่ตั้งใจหลายกรณี:

    - การเขียน config ที่ OpenClaw เป็นเจ้าของจะตรวจสอบ config ทั้งหมดหลังการเปลี่ยนแปลงก่อนเขียน
    - การเขียนที่ไม่ถูกต้องหรือทำลายข้อมูลซึ่ง OpenClaw เป็นเจ้าของจะถูกปฏิเสธและบันทึกเป็น `openclaw.json.rejected.*`
    - หากการแก้ไขโดยตรงทำให้ startup หรือ hot reload เสีย Gateway จะ fail closed หรือข้ามการ reload; จะไม่เขียน `openclaw.json` ใหม่
    - `openclaw doctor --fix` เป็นเจ้าของการซ่อมแซมและสามารถกู้คืน last-known-good พร้อมบันทึกไฟล์ที่ถูกปฏิเสธเป็น `openclaw.json.clobbered.*`

    กู้คืน:

    - ตรวจสอบ `openclaw logs --follow` เพื่อหา `Invalid config at`, `Config write rejected:` หรือ `config reload skipped (invalid config)`
    - ตรวจดู `openclaw.json.clobbered.*` หรือ `openclaw.json.rejected.*` ล่าสุดข้าง ๆ config ที่ใช้งานอยู่
    - รัน `openclaw config validate` และ `openclaw doctor --fix`
    - คัดลอกกลับเฉพาะ key ที่ตั้งใจไว้ด้วย `openclaw config set` หรือ `config.patch`
    - หากคุณไม่มี last-known-good หรือ payload ที่ถูกปฏิเสธ ให้กู้คืนจาก backup หรือรัน `openclaw doctor` อีกครั้งแล้วกำหนดค่า channels/models ใหม่
    - หากนี่เป็นสิ่งที่ไม่คาดคิด ให้รายงาน bug และแนบ config ล่าสุดที่คุณทราบหรือ backup ใด ๆ
    - เอเจนต์เขียนโค้ดในเครื่องมักสามารถสร้าง config ที่ใช้งานได้ใหม่จาก logs หรือ history

    หลีกเลี่ยง:

    - ใช้ `openclaw config set` สำหรับการเปลี่ยนแปลงเล็ก ๆ
    - ใช้ `openclaw configure` สำหรับการแก้ไขแบบ interactive
    - ใช้ `config.schema.lookup` ก่อนเมื่อคุณไม่แน่ใจเกี่ยวกับ path หรือรูปทรง field ที่แน่นอน; มันจะคืนค่า schema node แบบตื้นพร้อมสรุปลูกโดยตรงสำหรับเจาะลึก
    - ใช้ `config.patch` สำหรับการแก้ไข RPC บางส่วน; เก็บ `config.apply` ไว้สำหรับการแทนที่ config ทั้งหมดเท่านั้น
    - หากคุณใช้เครื่องมือ `gateway` สำหรับเอเจนต์จาก agent run เครื่องมือนั้นยังจะปฏิเสธการเขียนไปยัง `tools.exec.ask` / `tools.exec.security` (รวมถึง alias เดิม `tools.bash.*` ที่ normalize ไปยัง path exec ที่ได้รับการป้องกันเดียวกัน)

    Docs: [Config](/th/cli/config), [Configure](/th/cli/configure), [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/th/gateway/doctor).

  </Accordion>

  <Accordion title="ฉันจะรัน Gateway กลางพร้อม workers เฉพาะทางข้ามอุปกรณ์ได้อย่างไร">
    รูปแบบทั่วไปคือ **Gateway เดียว** (เช่น Raspberry Pi) พร้อม **โหนด** และ **เอเจนต์**:

    - **Gateway (กลาง):** เป็นเจ้าของ channels (Signal/WhatsApp), routing และ sessions
    - **โหนด (อุปกรณ์):** Macs/iOS/Android เชื่อมต่อเป็นอุปกรณ์ต่อพ่วงและเปิดเผยเครื่องมือ local (`system.run`, `canvas`, `camera`)
    - **เอเจนต์ (workers):** สมอง/workspaces แยกสำหรับบทบาทพิเศษ (เช่น "Hetzner ops", "Personal data")
    - **เอเจนต์ย่อย:** สร้างงานเบื้องหลังจากเอเจนต์หลักเมื่อคุณต้องการการทำงานแบบขนาน
    - **TUI:** เชื่อมต่อกับ Gateway แล้วสลับเอเจนต์/sessions

    Docs: [โหนด](/th/nodes), [การเข้าถึงระยะไกล](/th/gateway/remote), [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [เอเจนต์ย่อย](/th/tools/subagents), [TUI](/th/web/tui).

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

    ค่าเริ่มต้นคือ `false` (headful) Headless มีแนวโน้มกระตุ้นการตรวจสอบ anti-bot บางเว็บไซต์มากกว่า ดู [เบราว์เซอร์](/th/tools/browser)

    Headless ใช้ **Chromium engine เดียวกัน** และทำงานได้กับ automation ส่วนใหญ่ (forms, clicks, scraping, logins) ความแตกต่างหลักคือ:

    - ไม่มีหน้าต่างเบราว์เซอร์ที่มองเห็นได้ (ใช้ screenshots หากคุณต้องการภาพ)
    - บางเว็บไซต์เข้มงวดกับ automation ในโหมด headless มากกว่า (CAPTCHAs, anti-bot)
      ตัวอย่างเช่น X/Twitter มักบล็อก sessions แบบ headless

  </Accordion>

  <Accordion title="ฉันจะใช้ Brave สำหรับการควบคุมเบราว์เซอร์ได้อย่างไร">
    ตั้งค่า `browser.executablePath` เป็น binary ของ Brave (หรือเบราว์เซอร์ที่ใช้ Chromium อื่น ๆ) แล้วรีสตาร์ต Gateway
    ดูตัวอย่าง config แบบเต็มใน [เบราว์เซอร์](/th/tools/browser#use-brave-or-another-chromium-based-browser)
  </Accordion>
</AccordionGroup>

## Gateway และโหนดระยะไกล

<AccordionGroup>
  <Accordion title="คำสั่งเผยแพร่ระหว่าง Telegram, gateway และโหนดอย่างไร">
    ข้อความ Telegram จัดการโดย **gateway** gateway รันเอเจนต์และ
    จากนั้นจึงเรียกโหนดผ่าน **Gateway WebSocket** เฉพาะเมื่อจำเป็นต้องใช้เครื่องมือของโหนด:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    โหนดจะไม่เห็นทราฟฟิก provider ขาเข้า; จะได้รับเฉพาะการเรียก node RPC เท่านั้น

  </Accordion>

  <Accordion title="เอเจนต์ของฉันจะเข้าถึงคอมพิวเตอร์ของฉันได้อย่างไรหาก Gateway โฮสต์อยู่ระยะไกล">
    คำตอบสั้น ๆ: **จับคู่คอมพิวเตอร์ของคุณเป็นโหนด** Gateway รันอยู่ที่อื่น แต่สามารถ
    เรียกเครื่องมือ `node.*` (screen, camera, system) บนเครื่อง local ของคุณผ่าน Gateway WebSocket ได้

    การตั้งค่าทั่วไป:

    1. รัน Gateway บนโฮสต์ที่เปิดตลอดเวลา (VPS/home server)
    2. วางโฮสต์ Gateway + คอมพิวเตอร์ของคุณบน tailnet เดียวกัน
    3. ตรวจสอบให้แน่ใจว่า Gateway WS เข้าถึงได้ (tailnet bind หรือ SSH tunnel)
    4. เปิดแอป macOS ในเครื่องแล้วเชื่อมต่อในโหมด **Remote over SSH** (หรือ tailnet โดยตรง)
       เพื่อให้ลงทะเบียนเป็นโหนดได้
    5. อนุมัติโหนดบน Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ไม่จำเป็นต้องมี TCP bridge แยกต่างหาก; โหนดเชื่อมต่อผ่าน Gateway WebSocket

    คำเตือนด้านความปลอดภัย: การจับคู่โหนด macOS อนุญาตให้ใช้ `system.run` บนเครื่องนั้นได้ จับคู่
    เฉพาะอุปกรณ์ที่คุณไว้วางใจ และตรวจทาน [ความปลอดภัย](/th/gateway/security)

    Docs: [โหนด](/th/nodes), [โปรโตคอล Gateway](/th/gateway/protocol), [โหมดระยะไกล macOS](/th/platforms/mac/remote), [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="Tailscale เชื่อมต่อแล้วแต่ฉันไม่ได้รับคำตอบ ตอนนี้ควรทำอย่างไร">
    ตรวจสอบพื้นฐาน:

    - Gateway กำลังทำงาน: `openclaw gateway status`
    - สุขภาพของ Gateway: `openclaw status`
    - สุขภาพของ channel: `openclaw channels status`

    จากนั้นตรวจสอบการยืนยันตัวตนและ routing:

    - หากคุณใช้ Tailscale Serve ตรวจสอบให้แน่ใจว่าตั้งค่า `gateway.auth.allowTailscale` ถูกต้อง
    - หากคุณเชื่อมต่อผ่าน SSH tunnel ให้ยืนยันว่า tunnel ในเครื่องทำงานอยู่และชี้ไปยัง port ที่ถูกต้อง
    - ยืนยันว่า allowlists ของคุณ (DM หรือ group) รวม account ของคุณไว้แล้ว

    Docs: [Tailscale](/th/gateway/tailscale), [การเข้าถึงระยะไกล](/th/gateway/remote), [Channels](/th/channels).

  </Accordion>

  <Accordion title="OpenClaw สอง instance คุยกันได้ไหม (local + VPS)">
    ได้ ไม่มี bridge "bot-to-bot" ในตัว แต่คุณสามารถเชื่อมต่อได้ด้วยวิธีที่เชื่อถือได้ไม่กี่แบบ:

    **ง่ายที่สุด:** ใช้ channel แชทปกติที่ bot ทั้งสองเข้าถึงได้ (Telegram/Slack/WhatsApp)
    ให้ Bot A ส่งข้อความถึง Bot B แล้วให้ Bot B ตอบกลับตามปกติ

    **CLI bridge (ทั่วไป):** รัน script ที่เรียก Gateway อีกตัวด้วย
    `openclaw agent --message ... --deliver` โดย target ไปยังแชทที่ bot อีกตัว
    ฟังอยู่ หาก bot ตัวหนึ่งอยู่บน VPS ระยะไกล ให้ชี้ CLI ของคุณไปยัง Gateway ระยะไกลนั้น
    ผ่าน SSH/Tailscale (ดู [การเข้าถึงระยะไกล](/th/gateway/remote))

    รูปแบบตัวอย่าง (รันจากเครื่องที่เข้าถึง Gateway ปลายทางได้):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    เคล็ดลับ: เพิ่ม guardrail เพื่อไม่ให้ bot ทั้งสองวนลูปไม่สิ้นสุด (mention-only, channel
    allowlists หรือกฎ "ไม่ตอบกลับข้อความจาก bot")

    Docs: [การเข้าถึงระยะไกล](/th/gateway/remote), [Agent CLI](/th/cli/agent), [Agent send](/th/tools/agent-send).

  </Accordion>

  <Accordion title="ฉันต้องใช้ VPS แยกสำหรับหลายเอเจนต์ไหม">
    ไม่ต้อง Gateway เดียวสามารถโฮสต์หลายเอเจนต์ได้ โดยแต่ละตัวมี workspace, ค่าเริ่มต้นของโมเดล
    และ routing ของตัวเอง นี่คือการตั้งค่าปกติ และถูกกว่าและง่ายกว่าการรัน
    VPS หนึ่งตัวต่อเอเจนต์มาก

    ใช้ VPS แยกเฉพาะเมื่อคุณต้องการการแยกอย่างเข้มงวด (ขอบเขตความปลอดภัย) หรือ config
    ที่แตกต่างกันมากซึ่งคุณไม่ต้องการแชร์ มิฉะนั้น ให้ใช้ Gateway เดียวและ
    ใช้หลายเอเจนต์หรือเอเจนต์ย่อย

  </Accordion>

  <Accordion title="มีประโยชน์ไหมหากใช้ Node บนแล็ปท็อปส่วนตัวแทนการ SSH จาก VPS?">
    มี - Node เป็นวิธีหลักในการเข้าถึงแล็ปท็อปของคุณจาก Gateway ระยะไกล และยัง
    เปิดความสามารถมากกว่าการเข้าถึง shell Gateway ทำงานบน macOS/Linux (Windows ผ่าน WSL2) และ
    เบา (VPS ขนาดเล็กหรือเครื่องระดับ Raspberry Pi ก็ใช้ได้; RAM 4 GB เพียงพอ) ดังนั้นการตั้งค่าทั่วไป
    คือโฮสต์ที่เปิดตลอดเวลาพร้อมแล็ปท็อปของคุณในฐานะ Node

    - **ไม่ต้องใช้ SSH ขาเข้า** Node เชื่อมต่อออกไปยัง Gateway WebSocket และใช้การจับคู่อุปกรณ์
    - **การควบคุมการรันที่ปลอดภัยกว่า** `system.run` ถูกควบคุมด้วย allowlist/การอนุมัติของ Node บนแล็ปท็อปเครื่องนั้น
    - **เครื่องมืออุปกรณ์มากขึ้น** Node เปิดเผย `canvas`, `camera`, และ `screen` นอกเหนือจาก `system.run`
    - **ระบบอัตโนมัติเบราว์เซอร์ในเครื่อง** เก็บ Gateway ไว้บน VPS แต่รัน Chrome ในเครื่องผ่านโฮสต์ Node บนแล็ปท็อป หรือแนบกับ Chrome ในเครื่องบนโฮสต์ผ่าน Chrome MCP

    SSH เหมาะสำหรับการเข้าถึง shell แบบเฉพาะกิจ แต่ Node ง่ายกว่าสำหรับเวิร์กโฟลว์เอเจนต์ต่อเนื่องและ
    ระบบอัตโนมัติของอุปกรณ์

    เอกสาร: [Node](/th/nodes), [CLI ของ Node](/th/cli/nodes), [เบราว์เซอร์](/th/tools/browser).

  </Accordion>

  <Accordion title="Node รันบริการ Gateway หรือไม่?">
    ไม่ มีเพียง **gateway หนึ่งตัว** เท่านั้นที่ควรรันต่อโฮสต์ เว้นแต่คุณตั้งใจรันโปรไฟล์ที่แยกกัน (ดู [Gateway หลายตัว](/th/gateway/multiple-gateways)) Node เป็นอุปกรณ์ต่อพ่วงที่เชื่อมต่อ
    ไปยัง gateway (Node บน iOS/Android หรือ "โหมด Node" ของ macOS ในแอปแถบเมนู) สำหรับโฮสต์ Node
    แบบไม่มีหน้าจอและการควบคุมด้วย CLI โปรดดู [CLI โฮสต์ Node](/th/cli/node)

    ต้องรีสตาร์ตแบบเต็มสำหรับการเปลี่ยนแปลงพื้นผิว `gateway`, `discovery`, และ Plugin ที่โฮสต์อยู่

  </Accordion>

  <Accordion title="มีวิธี API / RPC เพื่อใช้ config หรือไม่?">
    มี

    - `config.schema.lookup`: ตรวจสอบ subtree ของ config หนึ่งรายการพร้อมโหนด schema แบบตื้น, UI hint ที่ตรงกัน, และสรุปลูกระดับถัดไปก่อนเขียน
    - `config.get`: ดึง snapshot + hash ปัจจุบัน
    - `config.patch`: อัปเดตบางส่วนอย่างปลอดภัย (แนะนำสำหรับการแก้ไข RPC ส่วนใหญ่); hot-reload เมื่อทำได้และรีสตาร์ตเมื่อจำเป็น
    - `config.apply`: ตรวจสอบความถูกต้อง + แทนที่ config ทั้งหมด; hot-reload เมื่อทำได้และรีสตาร์ตเมื่อจำเป็น
    - เครื่องมือ runtime `gateway` สำหรับเอเจนต์ยังคงปฏิเสธการเขียน `tools.exec.ask` / `tools.exec.security` ใหม่; alias เดิม `tools.bash.*` จะ normalize ไปยัง path exec ที่ได้รับการป้องกันเดียวกัน

  </Accordion>

  <Accordion title="Config ขั้นต่ำที่เหมาะสมสำหรับการติดตั้งครั้งแรก">
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
       - ในคอนโซลผู้ดูแลระบบ Tailscale ให้เปิดใช้ MagicDNS เพื่อให้ VPS มีชื่อที่เสถียร
    4. **ใช้ชื่อโฮสต์ของ tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    หากคุณต้องการ Control UI โดยไม่ใช้ SSH ให้ใช้ Tailscale Serve บน VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    สิ่งนี้ทำให้ gateway ผูกกับ loopback และเปิดเผย HTTPS ผ่าน Tailscale ดู [Tailscale](/th/gateway/tailscale)

  </Accordion>

  <Accordion title="ฉันจะเชื่อมต่อ Node ของ Mac กับ Gateway ระยะไกล (Tailscale Serve) ได้อย่างไร?">
    Serve เปิดเผย **Gateway Control UI + WS** Node เชื่อมต่อผ่าน endpoint ของ Gateway WS เดียวกัน

    การตั้งค่าที่แนะนำ:

    1. **ตรวจสอบให้แน่ใจว่า VPS + Mac อยู่ใน tailnet เดียวกัน**
    2. **ใช้แอป macOS ในโหมด Remote** (เป้าหมาย SSH อาจเป็นชื่อโฮสต์ของ tailnet)
       แอปจะ tunnel พอร์ต Gateway และเชื่อมต่อในฐานะ Node
    3. **อนุมัติ Node** บน gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    เอกสาร: [โปรโตคอล Gateway](/th/gateway/protocol), [Discovery](/th/gateway/discovery), [โหมดระยะไกลของ macOS](/th/platforms/mac/remote).

  </Accordion>

  <Accordion title="ฉันควรติดตั้งบนแล็ปท็อปเครื่องที่สอง หรือแค่เพิ่ม Node?">
    หากคุณต้องการเพียง **เครื่องมือในเครื่อง** (screen/camera/exec) บนแล็ปท็อปเครื่องที่สอง ให้เพิ่มเป็น
    **Node** สิ่งนี้คง Gateway เดียวไว้และหลีกเลี่ยง config ซ้ำซ้อน เครื่องมือ Node ในเครื่อง
    ตอนนี้รองรับเฉพาะ macOS แต่เราวางแผนจะขยายไปยัง OS อื่น

    ติดตั้ง Gateway ตัวที่สองเฉพาะเมื่อคุณต้องการ **การแยกอย่างเข้มงวด** หรือบอตสองตัวที่แยกกันอย่างสมบูรณ์

    เอกสาร: [Node](/th/nodes), [CLI ของ Node](/th/cli/nodes), [Gateway หลายตัว](/th/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars และการโหลด .env

<AccordionGroup>
  <Accordion title="OpenClaw โหลดตัวแปรสภาพแวดล้อมอย่างไร?">
    OpenClaw อ่าน env vars จาก process แม่ (shell, launchd/systemd, CI, ฯลฯ) และยังโหลดเพิ่มเติม:

    - `.env` จากไดเรกทอรีทำงานปัจจุบัน
    - fallback `.env` ส่วนกลางจาก `~/.openclaw/.env` (หรือ `$OPENCLAW_STATE_DIR/.env`)

    ไฟล์ `.env` ทั้งสองไม่ override env vars ที่มีอยู่
    ตัวแปรข้อมูลรับรองของ provider เป็นข้อยกเว้นสำหรับ workspace `.env`: key เช่น
    `GEMINI_API_KEY`, `XAI_API_KEY`, หรือ `MISTRAL_API_KEY` จะถูกละเว้นจาก workspace
    `.env` และควรอยู่ใน process environment, `~/.openclaw/.env`, หรือ config `env`

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
    วิธีแก้ที่พบบ่อยสองวิธี:

    1. ใส่ key ที่หายไปใน `~/.openclaw/.env` เพื่อให้ถูกอ่านแม้ service จะไม่สืบทอด shell env ของคุณ
    2. เปิดใช้การ import จาก shell (ความสะดวกแบบ opt-in):

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

    สิ่งนี้รัน login shell ของคุณและ import เฉพาะ key ที่คาดไว้ซึ่งยังไม่มี (ไม่ override) ค่าที่เทียบเท่าของ env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='ฉันตั้งค่า COPILOT_GITHUB_TOKEN แล้ว แต่สถานะ models แสดงว่า "Shell env: off." เพราะอะไร?'>
    `openclaw models status` รายงานว่าเปิดใช้ **การ import shell env** หรือไม่ "Shell env: off"
    **ไม่ได้** หมายความว่า env vars ของคุณหายไป - แค่หมายความว่า OpenClaw จะไม่โหลด
    login shell ของคุณโดยอัตโนมัติ

    หาก Gateway รันเป็น service (launchd/systemd) มันจะไม่สืบทอด shell
    environment ของคุณ แก้ไขโดยทำหนึ่งในสิ่งต่อไปนี้:

    1. ใส่ token ใน `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. หรือเปิดใช้ shell import (`env.shellEnv.enabled: true`)
    3. หรือเพิ่มลงในบล็อก config `env` ของคุณ (ใช้เฉพาะเมื่อยังไม่มี)

    จากนั้นรีสตาร์ต gateway และตรวจสอบอีกครั้ง:

    ```bash
    openclaw models status
    ```

    token ของ Copilot จะอ่านจาก `COPILOT_GITHUB_TOKEN` (รวมถึง `GH_TOKEN` / `GITHUB_TOKEN`)
    ดู [/concepts/model-providers](/th/concepts/model-providers) และ [/environment](/th/help/environment)

  </Accordion>
</AccordionGroup>

## เซสชันและหลายแชต

<AccordionGroup>
  <Accordion title="ฉันจะเริ่มการสนทนาใหม่ได้อย่างไร?">
    ส่ง `/new` หรือ `/reset` เป็นข้อความเดี่ยว ดู [การจัดการเซสชัน](/th/concepts/session)
  </Accordion>

  <Accordion title="เซสชันรีเซ็ตโดยอัตโนมัติไหมหากฉันไม่เคยส่ง /new?">
    เซสชันสามารถหมดอายุหลังจาก `session.idleMinutes` ได้ แต่สิ่งนี้ **ปิดไว้ตามค่าเริ่มต้น** (ค่าเริ่มต้น **0**)
    ตั้งค่าเป็นค่าบวกเพื่อเปิดใช้การหมดอายุเมื่อไม่ได้ใช้งาน เมื่อเปิดใช้แล้ว ข้อความ **ถัดไป**
    หลังช่วงเวลาที่ไม่ได้ใช้งานจะเริ่ม session id ใหม่สำหรับ chat key นั้น
    สิ่งนี้ไม่ลบ transcript - แค่เริ่มเซสชันใหม่

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="มีวิธีสร้างทีมของอินสแตนซ์ OpenClaw (CEO หนึ่งคนและเอเจนต์หลายตัว) หรือไม่?">
    มี ผ่าน **multi-agent routing** และ **sub-agents** คุณสามารถสร้างเอเจนต์ผู้ประสานงานหนึ่งตัว
    และเอเจนต์ worker หลายตัวพร้อม workspace และโมเดลของตนเอง

    อย่างไรก็ตาม สิ่งนี้เหมาะจะมองว่าเป็น **การทดลองสนุกๆ** มากกว่า ใช้ token มากและมัก
    มีประสิทธิภาพน้อยกว่าการใช้บอตเดียวพร้อมเซสชันแยกกัน โมเดลทั่วไปที่เรา
    คาดไว้คือบอตหนึ่งตัวที่คุณคุยด้วย พร้อมเซสชันต่างๆ สำหรับงานคู่ขนาน บอตนั้น
    ยังสามารถ spawn sub-agents ได้เมื่อจำเป็น

    เอกสาร: [Multi-agent routing](/th/concepts/multi-agent), [Sub-agents](/th/tools/subagents), [CLI ของเอเจนต์](/th/cli/agents).

  </Accordion>

  <Accordion title="ทำไม context ถึงถูกตัดกลางงาน? ฉันจะป้องกันได้อย่างไร?">
    context ของเซสชันถูกจำกัดโดย window ของโมเดล แชตยาว, output จากเครื่องมือขนาดใหญ่, หรือไฟล์จำนวนมาก
    อาจทำให้เกิด Compaction หรือการตัดทอนได้

    สิ่งที่ช่วยได้:

    - ขอให้บอตสรุปสถานะปัจจุบันและเขียนลงไฟล์
    - ใช้ `/compact` ก่อนงานยาว และ `/new` เมื่อเปลี่ยนหัวข้อ
    - เก็บ context สำคัญไว้ใน workspace และขอให้บอตอ่านกลับ
    - ใช้ sub-agents สำหรับงานยาวหรืองานคู่ขนานเพื่อให้แชตหลักเล็กลง
    - เลือกโมเดลที่มี context window ใหญ่ขึ้นหากเกิดปัญหานี้บ่อย

  </Accordion>

  <Accordion title="ฉันจะรีเซ็ต OpenClaw อย่างสมบูรณ์แต่ยังคงติดตั้งไว้ได้อย่างไร?">
    ใช้คำสั่ง reset:

    ```bash
    openclaw reset
    ```

    รีเซ็ตเต็มรูปแบบแบบไม่โต้ตอบ:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    จากนั้นรัน setup อีกครั้ง:

    ```bash
    openclaw onboard --install-daemon
    ```

    หมายเหตุ:

    - Onboarding ยังเสนอ **Reset** หากเห็น config ที่มีอยู่ ดู [Onboarding (CLI)](/th/start/wizard)
    - หากคุณใช้ profiles (`--profile` / `OPENCLAW_PROFILE`) ให้ reset state dir แต่ละอัน (ค่าเริ่มต้นคือ `~/.openclaw-<profile>`)
    - Dev reset: `openclaw gateway --dev --reset` (เฉพาะ dev; ล้าง config dev + credentials + sessions + workspace)

  </Accordion>

  <Accordion title='ฉันได้รับข้อผิดพลาด "context too large" - ฉันจะ reset หรือ compact ได้อย่างไร?'>
    ใช้หนึ่งในวิธีต่อไปนี้:

    - **Compact** (เก็บการสนทนาไว้แต่สรุป turn เก่า):

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

    - เปิดใช้หรือปรับแต่ง **session pruning** (`agents.defaults.contextPruning`) เพื่อตัด output เครื่องมือเก่า
    - ใช้โมเดลที่มี context window ใหญ่ขึ้น

    เอกสาร: [Compaction](/th/concepts/compaction), [Session pruning](/th/concepts/session-pruning), [การจัดการเซสชัน](/th/concepts/session).

  </Accordion>

  <Accordion title='ทำไมฉันถึงเห็น "LLM request rejected: messages.content.tool_use.input field required"?'>
    นี่เป็นข้อผิดพลาดการตรวจสอบของ provider: โมเดลปล่อยบล็อก `tool_use` โดยไม่มี
    `input` ที่จำเป็น โดยปกติหมายความว่าประวัติเซสชันเก่าหรือเสียหาย (มักเกิดหลัง thread ยาว
    หรือการเปลี่ยนแปลงเครื่องมือ/schema)

    วิธีแก้: เริ่มเซสชันใหม่ด้วย `/new` (ข้อความเดี่ยว)

  </Accordion>

  <Accordion title="ทำไมฉันถึงได้รับข้อความ Heartbeat ทุก 30 นาที?">
    Heartbeat ทำงานทุก **30m** ตามค่าเริ่มต้น (**1h** เมื่อใช้การยืนยันตัวตนแบบ OAuth) ปรับแต่งหรือปิดใช้ได้:

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

    หาก `HEARTBEAT.md` มีอยู่แต่แทบจะว่างเปล่า (มีเพียงบรรทัดว่าง,
    ความคิดเห็น Markdown/HTML, หัวข้อ Markdown เช่น `# Heading`, เครื่องหมาย fence,
    หรือโครง checklist ว่างเปล่า) OpenClaw จะข้ามการรัน heartbeat เพื่อประหยัดการเรียก API
    หากไฟล์หายไป heartbeat จะยังคงทำงาน และโมเดลจะตัดสินใจว่าจะทำอะไร

    การแทนที่ค่าเฉพาะ agent ใช้ `agents.list[].heartbeat` เอกสาร: [Heartbeat](/th/gateway/heartbeat).

  </Accordion>

  <Accordion title='ฉันต้องเพิ่ม "บัญชีบอต" เข้าไปในกลุ่ม WhatsApp หรือไม่?'>
    ไม่ต้อง OpenClaw ทำงานบน**บัญชีของคุณเอง** ดังนั้นหากคุณอยู่ในกลุ่ม OpenClaw ก็จะเห็นกลุ่มนั้นได้
    โดยค่าเริ่มต้น การตอบกลับในกลุ่มจะถูกบล็อกจนกว่าคุณจะอนุญาตผู้ส่ง (`groupPolicy: "allowlist"`)

    หากคุณต้องการให้มีเพียง**คุณ**เท่านั้นที่สามารถทริกเกอร์การตอบกลับในกลุ่มได้:

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

    ตัวเลือกที่ 2 (หากกำหนดค่า/allowlisted ไว้แล้ว): แสดงรายการกลุ่มจาก config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    เอกสาร: [WhatsApp](/th/channels/whatsapp), [Directory](/th/cli/directory), [Logs](/th/cli/logs).

  </Accordion>

  <Accordion title="ทำไม OpenClaw ไม่ตอบกลับในกลุ่ม?">
    สาเหตุที่พบบ่อยมีสองอย่าง:

    - เปิดการ gating ด้วยการ mention อยู่ (ค่าเริ่มต้น) คุณต้อง @mention บอต (หรือให้ตรงกับ `mentionPatterns`)
    - คุณกำหนดค่า `channels.whatsapp.groups` โดยไม่มี `"*"` และกลุ่มไม่ได้อยู่ใน allowlist

    ดู [Groups](/th/channels/groups) และ [Group messages](/th/channels/group-messages).

  </Accordion>

  <Accordion title="กลุ่ม/เธรดแชร์ context กับ DM หรือไม่?">
    แชทโดยตรงจะยุบรวมเข้ากับเซสชันหลักตามค่าเริ่มต้น กลุ่ม/แชนเนลมีคีย์เซสชันของตัวเอง และหัวข้อ Telegram / เธรด Discord เป็นเซสชันแยกต่างหาก ดู [Groups](/th/channels/groups) และ [Group messages](/th/channels/group-messages).
  </Accordion>

  <Accordion title="ฉันสามารถสร้าง workspace และ agent ได้กี่รายการ?">
    ไม่มีขีดจำกัดตายตัว หลายสิบรายการ (แม้กระทั่งหลายร้อยรายการ) ก็ใช้ได้ แต่ให้ระวัง:

    - **การเติบโตของดิสก์:** เซสชัน + transcripts อยู่ใต้ `~/.openclaw/agents/<agentId>/sessions/`.
    - **ต้นทุน token:** agent มากขึ้นหมายถึงการใช้งานโมเดลพร้อมกันมากขึ้น
    - **ภาระงาน Ops:** auth profiles, workspaces และการกำหนดเส้นทางแชนเนลแบบต่อ agent

    เคล็ดลับ:

    - เก็บ workspace ที่**ใช้งานอยู่**หนึ่งรายการต่อ agent (`agents.defaults.workspace`)
    - ตัดเซสชันเก่าออก (ลบ JSONL หรือรายการ store) หากดิสก์โตขึ้น
    - ใช้ `openclaw doctor` เพื่อตรวจหา workspace ที่หลงเหลือและ profile ที่ไม่ตรงกัน

  </Accordion>

  <Accordion title="ฉันสามารถรันบอตหรือแชทหลายตัวพร้อมกัน (Slack) ได้หรือไม่ และควรตั้งค่าอย่างไร?">
    ได้ ใช้ **Multi-Agent Routing** เพื่อรัน agent หลายตัวที่แยกจากกัน และกำหนดเส้นทางข้อความขาเข้าตาม
    แชนเนล/บัญชี/peer Slack รองรับในฐานะแชนเนลและสามารถผูกกับ agent เฉพาะได้

    การเข้าถึงเบราว์เซอร์ทรงพลัง แต่ไม่ใช่ "ทำได้ทุกอย่างเหมือนมนุษย์" - anti-bot, CAPTCHA และ MFA
    ยังสามารถบล็อก automation ได้ สำหรับการควบคุมเบราว์เซอร์ที่เชื่อถือได้ที่สุด ให้ใช้ Chrome MCP ในเครื่องบนโฮสต์
    หรือใช้ CDP บนเครื่องที่รันเบราว์เซอร์จริง

    การตั้งค่าตามแนวทางปฏิบัติที่ดีที่สุด:

    - โฮสต์ Gateway ที่เปิดตลอดเวลา (VPS/Mac mini)
    - หนึ่ง agent ต่อบทบาท (bindings)
    - แชนเนล Slack ผูกกับ agent เหล่านั้น
    - เบราว์เซอร์ในเครื่องผ่าน Chrome MCP หรือ node เมื่อจำเป็น

    เอกสาร: [Multi-Agent Routing](/th/concepts/multi-agent), [Slack](/th/channels/slack),
    [Browser](/th/tools/browser), [Nodes](/th/nodes).

  </Accordion>
</AccordionGroup>

## โมเดล, failover และ auth profiles

ถามตอบเกี่ยวกับโมเดล — ค่าเริ่มต้น, การเลือก, aliases, การสลับ, failover, auth profiles —
อยู่ใน [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models).

## Gateway: พอร์ต, "already running" และโหมดระยะไกล

<AccordionGroup>
  <Accordion title="Gateway ใช้พอร์ตใด?">
    `gateway.port` ควบคุมพอร์ต multiplexed เดียวสำหรับ WebSocket + HTTP (Control UI, hooks ฯลฯ)

    ลำดับความสำคัญ:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status จึงบอกว่า "Runtime: running" แต่ "Connectivity probe: failed"?'>
    เพราะ "running" เป็นมุมมองของ**supervisor** (launchd/systemd/schtasks) ส่วน connectivity probe คือ CLI ที่เชื่อมต่อกับ WebSocket ของ Gateway จริง

    ใช้ `openclaw gateway status` และเชื่อถือบรรทัดเหล่านี้:

    - `Probe target:` (URL ที่ probe ใช้จริง)
    - `Listening:` (สิ่งที่ bind อยู่จริงบนพอร์ต)
    - `Last gateway error:` (สาเหตุรากที่พบบ่อยเมื่อ process ยังมีชีวิตอยู่แต่พอร์ตไม่ได้ listening)

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status แสดง "Config (cli)" และ "Config (service)" ต่างกัน?'>
    คุณกำลังแก้ไขไฟล์ config หนึ่ง ขณะที่ service กำลังรันอีกไฟล์หนึ่ง (มักเป็นความไม่ตรงกันของ `--profile` / `OPENCLAW_STATE_DIR`)

    วิธีแก้:

    ```bash
    openclaw gateway install --force
    ```

    รันคำสั่งนั้นจาก `--profile` / environment เดียวกับที่คุณต้องการให้ service ใช้

  </Accordion>

  <Accordion title='"another gateway instance is already listening" หมายความว่าอะไร?'>
    OpenClaw บังคับใช้ runtime lock โดย bind WebSocket listener ทันทีเมื่อเริ่มต้น (ค่าเริ่มต้น `ws://127.0.0.1:18789`) หาก bind ล้มเหลวด้วย `EADDRINUSE` ระบบจะโยน `GatewayLockError` ที่ระบุว่ามี instance อื่น listening อยู่แล้ว

    วิธีแก้: หยุด instance อื่น, ปล่อยพอร์ต, หรือรันด้วย `openclaw gateway --port <port>`

  </Accordion>

  <Accordion title="ฉันจะรัน OpenClaw ในโหมดระยะไกลได้อย่างไร (client เชื่อมต่อกับ Gateway ที่อื่น)?">
    ตั้งค่า `gateway.mode: "remote"` และชี้ไปยัง URL WebSocket ระยะไกล โดยอาจมี credentials ระยะไกลแบบ shared-secret:

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
    - แอป macOS จะเฝ้าดูไฟล์ config และสลับโหมดแบบ live เมื่อค่าเหล่านี้เปลี่ยน
    - `gateway.remote.token` / `.password` เป็น credentials ระยะไกลฝั่ง client เท่านั้น; ไม่ได้เปิดใช้งาน auth ของ Gateway ในเครื่องด้วยตัวเอง

  </Accordion>

  <Accordion title='Control UI บอกว่า "unauthorized" (หรือ reconnect ตลอด) ต้องทำอย่างไร?'>
    เส้นทาง auth ของ Gateway และวิธี auth ของ UI ไม่ตรงกัน

    ข้อเท็จจริง (จากโค้ด):

    - Control UI เก็บ token ไว้ใน `sessionStorage` สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL Gateway ที่เลือก ดังนั้นการ refresh ในแท็บเดิมยังทำงานต่อได้โดยไม่ต้องกู้คืนการคงอยู่ของ token ใน localStorage ระยะยาว
    - เมื่อเกิด `AUTH_TOKEN_MISMATCH` client ที่ trusted สามารถลองใหม่แบบมีขอบเขตหนึ่งครั้งด้วย device token ที่ cache ไว้ เมื่อ Gateway ส่ง retry hints (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) กลับมา
    - การ retry ด้วย cached-token นั้นตอนนี้นำ approved scopes ที่ cache ไว้และจัดเก็บพร้อมกับ device token มาใช้ซ้ำ ผู้เรียกแบบ explicit `deviceToken` / explicit `scopes` ยังคงเก็บชุด scope ที่ขอไว้ แทนที่จะสืบทอด cached scopes
    - นอกเส้นทาง retry นั้น ลำดับความสำคัญของ connect auth คือ shared token/password แบบ explicit ก่อน จากนั้น explicit `deviceToken` จากนั้น stored device token จากนั้น bootstrap token
    - bootstrap setup-code ที่มีในตัวจะคืนค่า node device token พร้อม `scopes: []` บวกกับ operator handoff token แบบมีขอบเขตสำหรับการ onboard มือถือที่ trusted operator handoff สามารถอ่านการกำหนดค่า native ช่วง setup ได้ แต่ไม่ให้ pairing mutation scopes หรือ `operator.admin`

    วิธีแก้:

    - เร็วที่สุด: `openclaw dashboard` (พิมพ์ + คัดลอก URL dashboard, พยายามเปิด; แสดงคำใบ้ SSH หากเป็น headless)
    - หากคุณยังไม่มี token: `openclaw doctor --generate-gateway-token`
    - หากเป็นระยะไกล ให้ tunnel ก่อน: `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/`.
    - โหมด shared-secret: ตั้งค่า `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` แล้ววาง secret ที่ตรงกันใน settings ของ Control UI
    - โหมด Tailscale Serve: ตรวจสอบให้แน่ใจว่าเปิดใช้ `gateway.auth.allowTailscale` แล้ว และคุณกำลังเปิด Serve URL ไม่ใช่ loopback/tailnet URL ดิบที่ bypass headers identity ของ Tailscale
    - โหมด trusted-proxy: ตรวจสอบให้แน่ใจว่าคุณเข้ามาผ่าน proxy ที่รู้ identity ตามที่กำหนดค่าไว้ ไม่ใช่ URL Gateway ดิบ proxy แบบ loopback บนโฮสต์เดียวกันยังต้องใช้ `gateway.auth.trustedProxy.allowLoopback = true` ด้วย
    - หากยังไม่ตรงกันหลังจาก retry หนึ่งครั้ง ให้ rotate/re-approve paired device token:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - หากการเรียก rotate นั้นบอกว่าถูกปฏิเสธ ให้ตรวจสองอย่าง:
      - เซสชัน paired-device สามารถ rotate ได้เฉพาะ device **ของตัวเอง** เว้นแต่จะมี `operator.admin` ด้วย
      - ค่า `--scope` แบบ explicit ต้องไม่เกิน operator scopes ปัจจุบันของผู้เรียก
    - ยังติดอยู่ใช่ไหม? รัน `openclaw status --all` แล้วทำตาม [การแก้ไขปัญหา](/th/gateway/troubleshooting) ดู [Dashboard](/th/web/dashboard) สำหรับรายละเอียด auth

  </Accordion>

  <Accordion title="ฉันตั้งค่า gateway.bind เป็น tailnet แต่ bind ไม่ได้และไม่มีอะไร listening">
    การ bind แบบ `tailnet` จะเลือก IP ของ Tailscale จาก network interfaces ของคุณ (100.64.0.0/10) หากเครื่องไม่ได้อยู่บน Tailscale (หรือ interface down) ก็จะไม่มีอะไรให้ bind

    วิธีแก้:

    - เริ่ม Tailscale บนโฮสต์นั้น (เพื่อให้มี address 100.x), หรือ
    - เปลี่ยนเป็น `gateway.bind: "loopback"` / `"lan"`.

    หมายเหตุ: `tailnet` เป็นแบบ explicit `auto` จะเลือก loopback ก่อน; ใช้ `gateway.bind: "tailnet"` เมื่อคุณต้องการ bind เฉพาะ tailnet

  </Accordion>

  <Accordion title="ฉันสามารถรัน Gateway หลายตัวบนโฮสต์เดียวกันได้หรือไม่?">
    โดยทั่วไปไม่ได้ - Gateway หนึ่งตัวสามารถรันแชนเนลข้อความและ agent ได้หลายรายการ ใช้ Gateway หลายตัวเฉพาะเมื่อคุณต้องการ redundancy (เช่น rescue bot) หรือการแยกอย่างเข้มงวด

    ได้ แต่คุณต้องแยก:

    - `OPENCLAW_CONFIG_PATH` (config แบบต่อ instance)
    - `OPENCLAW_STATE_DIR` (state แบบต่อ instance)
    - `agents.defaults.workspace` (การแยก workspace)
    - `gateway.port` (พอร์ตไม่ซ้ำกัน)

    การตั้งค่าอย่างรวดเร็ว (แนะนำ):

    - ใช้ `openclaw --profile <name> ...` ต่อ instance (สร้าง `~/.openclaw-<name>` โดยอัตโนมัติ)
    - ตั้งค่า `gateway.port` ที่ไม่ซ้ำกันใน config ของแต่ละ profile (หรือส่ง `--port` สำหรับการรันด้วยตนเอง)
    - ติดตั้ง service แบบต่อ profile: `openclaw --profile <name> gateway install`.

    Profiles ยังเติม suffix ให้ชื่อ service (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`)
    คู่มือฉบับเต็ม: [หลาย Gateway](/th/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008 หมายความว่าอะไร?'>
    Gateway เป็น**เซิร์ฟเวอร์ WebSocket** และคาดหวังให้ข้อความแรกสุด
    เป็นเฟรม `connect` หากได้รับอย่างอื่น จะปิดการเชื่อมต่อ
    ด้วย **code 1008** (policy violation)

    สาเหตุที่พบบ่อย:

    - คุณเปิด URL **HTTP** ในเบราว์เซอร์ (`http://...`) แทนที่จะใช้ client WS
    - คุณใช้พอร์ตหรือ path ผิด
    - proxy หรือ tunnel ตัด auth headers ออกหรือส่งคำขอที่ไม่ใช่ Gateway

    วิธีแก้อย่างรวดเร็ว:

    1. ใช้ URL WS: `ws://<host>:18789` (หรือ `wss://...` หากเป็น HTTPS)
    2. อย่าเปิดพอร์ต WS ในแท็บเบราว์เซอร์ปกติ
    3. หากเปิด auth อยู่ ให้ใส่ token/password ในเฟรม `connect`

    หากคุณใช้ CLI หรือ TUI, URL ควรมีลักษณะดังนี้:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    รายละเอียด protocol: [Gateway protocol](/th/gateway/protocol).

  </Accordion>
</AccordionGroup>

## การ logging และ debugging

<AccordionGroup>
  <Accordion title="logs อยู่ที่ไหน?">
    ไฟล์ logs (แบบมีโครงสร้าง):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    คุณสามารถตั้งค่าพาธที่คงที่ได้ผ่าน `logging.file` ระดับล็อกของไฟล์ควบคุมด้วย `logging.level` ความละเอียดของคอนโซลควบคุมด้วย `--verbose` และ `logging.consoleLevel`

    การติดตามล็อกที่เร็วที่สุด:

    ```bash
    openclaw logs --follow
    ```

    ล็อกของบริการ/ซูเปอร์ไวเซอร์ (เมื่อ gateway ทำงานผ่าน launchd/systemd):

    - stdout ของ macOS launchd: `~/Library/Logs/openclaw/gateway.log` (โปรไฟล์ใช้ `gateway-<profile>.log`; stderr ถูกระงับ)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    ดูเพิ่มเติมที่ [การแก้ไขปัญหา](/th/gateway/troubleshooting)

  </Accordion>

  <Accordion title="ฉันจะเริ่ม/หยุด/รีสตาร์ตบริการ Gateway ได้อย่างไร?">
    ใช้ตัวช่วยของ gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณรัน gateway ด้วยตนเอง `openclaw gateway --force` สามารถยึดพอร์ตกลับคืนได้ ดู [Gateway](/th/gateway)

  </Accordion>

  <Accordion title="ฉันปิดเทอร์มินัลบน Windows ไปแล้ว - จะรีสตาร์ต OpenClaw ได้อย่างไร?">
    มี **โหมดการติดตั้ง Windows สามโหมด**:

    **1) การตั้งค่า Windows Hub แบบ local:** แอป native จัดการ WSL Gateway ที่เป็นของแอปแบบ local

    เปิด **OpenClaw Companion** จากเมนู Start หรือถาดระบบ แล้วใช้
    **Gateway Setup** หรือแท็บ Connections

    **2) WSL2 Gateway แบบแมนนวล:** Gateway ทำงานภายใน Linux

    เปิด PowerShell, เข้า WSL แล้วรีสตาร์ต:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณไม่เคยติดตั้งบริการ ให้เริ่มในโหมด foreground:

    ```bash
    openclaw gateway run
    ```

    **3) Windows CLI/Gateway แบบ native:** Gateway ทำงานโดยตรงใน Windows

    เปิด PowerShell แล้วรัน:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณรันด้วยตนเอง (ไม่มีบริการ) ให้ใช้:

    ```powershell
    openclaw gateway run
    ```

    เอกสาร: [Windows](/th/platforms/windows), [คู่มือการปฏิบัติงานบริการ Gateway](/th/gateway)

  </Accordion>

  <Accordion title="Gateway เปิดอยู่ แต่ไม่มีคำตอบกลับเข้ามา ควรตรวจสอบอะไร?">
    เริ่มด้วยการตรวจสุขภาพอย่างรวดเร็ว:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    สาเหตุที่พบบ่อย:

    - ยังไม่ได้โหลดการยืนยันตัวตนของโมเดลบน **โฮสต์ gateway** (ตรวจสอบ `models status`)
    - การจับคู่/allowlist ของช่องทางกำลังบล็อกคำตอบ (ตรวจสอบ config ช่องทาง + ล็อก)
    - WebChat/Dashboard เปิดอยู่โดยไม่มี token ที่ถูกต้อง

    หากคุณอยู่ระยะไกล ให้ยืนยันว่า tunnel/การเชื่อมต่อ Tailscale เปิดอยู่ และ
    Gateway WebSocket เข้าถึงได้

    เอกสาร: [ช่องทาง](/th/channels), [การแก้ไขปัญหา](/th/gateway/troubleshooting), [การเข้าถึงระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title='"ตัดการเชื่อมต่อจาก gateway: ไม่มีเหตุผล" - แล้วต้องทำอย่างไร?'>
    โดยทั่วไปหมายความว่า UI สูญเสียการเชื่อมต่อ WebSocket ตรวจสอบ:

    1. Gateway กำลังทำงานอยู่หรือไม่? `openclaw gateway status`
    2. Gateway ปกติหรือไม่? `openclaw status`
    3. UI มี token ที่ถูกต้องหรือไม่? `openclaw dashboard`
    4. หากใช้งานระยะไกล ลิงก์ tunnel/Tailscale เปิดอยู่หรือไม่?

    จากนั้นติดตามล็อก:

    ```bash
    openclaw logs --follow
    ```

    เอกสาร: [Dashboard](/th/web/dashboard), [การเข้าถึงระยะไกล](/th/gateway/remote), [การแก้ไขปัญหา](/th/gateway/troubleshooting)

  </Accordion>

  <Accordion title="Telegram setMyCommands ล้มเหลว ควรตรวจสอบอะไร?">
    เริ่มจากล็อกและสถานะช่องทาง:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    จากนั้นเทียบข้อผิดพลาด:

    - `BOT_COMMANDS_TOO_MUCH`: เมนู Telegram มีรายการมากเกินไป OpenClaw ตัดให้เหลือไม่เกินขีดจำกัดของ Telegram และลองใหม่ด้วยคำสั่งที่น้อยลงอยู่แล้ว แต่ยังต้องตัดรายการเมนูบางรายการออก ลดคำสั่งจาก plugin/skill/แบบกำหนดเอง หรือปิด `channels.telegram.commands.native` หากคุณไม่ต้องการเมนู
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` หรือข้อผิดพลาดเครือข่ายที่คล้ายกัน: หากคุณอยู่บน VPS หรืออยู่หลังพร็อกซี ให้ยืนยันว่าอนุญาต HTTPS ขาออกและ DNS ใช้งานได้สำหรับ `api.telegram.org`

    หาก Gateway อยู่ระยะไกล ตรวจสอบให้แน่ใจว่าคุณกำลังดูล็อกบนโฮสต์ Gateway

    เอกสาร: [Telegram](/th/channels/telegram), [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)

  </Accordion>

  <Accordion title="TUI ไม่แสดงผลลัพธ์ ควรตรวจสอบอะไร?">
    ก่อนอื่นให้ยืนยันว่า Gateway เข้าถึงได้และเอเจนต์รันได้:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    ใน TUI ให้ใช้ `/status` เพื่อดูสถานะปัจจุบัน หากคุณคาดหวังคำตอบในช่องทางแชท
    ตรวจสอบให้แน่ใจว่าเปิดการส่งไว้แล้ว (`/deliver on`)

    เอกสาร: [TUI](/th/web/tui), [คำสั่ง Slash](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="ฉันจะหยุดแล้วเริ่ม Gateway ใหม่อย่างสมบูรณ์ได้อย่างไร?">
    หากคุณติดตั้งบริการแล้ว:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    คำสั่งนี้หยุด/เริ่ม **บริการที่มีการดูแล** (launchd บน macOS, systemd บน Linux)
    ใช้สิ่งนี้เมื่อ Gateway ทำงานเป็น daemon อยู่เบื้องหลัง

    หากคุณกำลังรันใน foreground ให้หยุดด้วย Ctrl-C แล้ว:

    ```bash
    openclaw gateway run
    ```

    เอกสาร: [คู่มือการปฏิบัติงานบริการ Gateway](/th/gateway)

  </Accordion>

  <Accordion title="อธิบายแบบง่าย: openclaw gateway restart เทียบกับ openclaw gateway">
    - `openclaw gateway restart`: รีสตาร์ต **บริการเบื้องหลัง** (launchd/systemd)
    - `openclaw gateway`: รัน gateway **ใน foreground** สำหรับเซสชันเทอร์มินัลนี้

    หากคุณติดตั้งบริการแล้ว ให้ใช้คำสั่ง gateway ใช้ `openclaw gateway` เมื่อ
    คุณต้องการรันแบบครั้งเดียวใน foreground

  </Accordion>

  <Accordion title="วิธีที่เร็วที่สุดในการดูรายละเอียดเพิ่มเมื่อบางอย่างล้มเหลว">
    เริ่ม Gateway ด้วย `--verbose` เพื่อดูรายละเอียดคอนโซลเพิ่มเติม จากนั้นตรวจสอบไฟล์ล็อกสำหรับการยืนยันตัวตนของช่องทาง การกำหนดเส้นทางโมเดล และข้อผิดพลาด RPC
  </Accordion>
</AccordionGroup>

## สื่อและไฟล์แนบ

<AccordionGroup>
  <Accordion title="skill ของฉันสร้างรูปภาพ/PDF แต่ไม่มีอะไรถูกส่ง">
    ไฟล์แนบขาออกจากเอเจนต์ต้องใช้ฟิลด์สื่อแบบมีโครงสร้าง เช่น `media`, `mediaUrl`, `path` หรือ `filePath` ดู [การตั้งค่า OpenClaw assistant](/th/start/openclaw) และ [การส่งของเอเจนต์](/th/tools/agent-send)

    การส่งผ่าน CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    ตรวจสอบเพิ่มเติม:

    - ช่องทางเป้าหมายรองรับสื่อขาออกและไม่ได้ถูกบล็อกโดย allowlist
    - ไฟล์อยู่ภายในขีดจำกัดขนาดของผู้ให้บริการ (รูปภาพจะถูกปรับขนาดเป็นสูงสุด 2048px)
    - `tools.fs.workspaceOnly=true` จำกัดการส่งด้วยพาธ local ให้อยู่เฉพาะ workspace, temp/media-store และไฟล์ที่ผ่านการตรวจสอบโดย sandbox
    - `tools.fs.workspaceOnly=false` อนุญาตให้การส่งสื่อ local แบบมีโครงสร้างใช้ไฟล์ host-local ที่เอเจนต์อ่านได้อยู่แล้ว แต่เฉพาะสื่อและชนิดเอกสารที่ปลอดภัยเท่านั้น (รูปภาพ, เสียง, วิดีโอ, PDF, เอกสาร Office และเอกสารข้อความที่ผ่านการตรวจสอบ เช่น Markdown/MD, TXT, JSON, YAML และ YML) สิ่งนี้ไม่ใช่เครื่องสแกนความลับ: `secret.txt` หรือ `config.json` ที่เอเจนต์อ่านได้สามารถถูกแนบได้เมื่อ extension และการตรวจสอบเนื้อหาตรงกัน เก็บไฟล์ที่ละเอียดอ่อนไว้นอกพาธที่เอเจนต์อ่านได้ หรือคง `tools.fs.workspaceOnly=true` ไว้เพื่อการส่งด้วยพาธ local ที่เข้มงวดยิ่งขึ้น

    ดู [รูปภาพ](/th/nodes/images)

  </Accordion>
</AccordionGroup>

## ความปลอดภัยและการควบคุมการเข้าถึง

<AccordionGroup>
  <Accordion title="ปลอดภัยไหมที่จะเปิด OpenClaw ให้รับ DM ขาเข้า?">
    ถือว่า DM ขาเข้าเป็นอินพุตที่ไม่น่าเชื่อถือ ค่าเริ่มต้นออกแบบมาเพื่อลดความเสี่ยง:

    - พฤติกรรมเริ่มต้นบนช่องทางที่รองรับ DM คือ **การจับคู่**:
      - ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่; bot จะไม่ประมวลผลข้อความของพวกเขา
      - อนุมัติด้วย: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - คำขอที่รอดำเนินการจำกัดที่ **3 รายการต่อช่องทาง**; ตรวจสอบ `openclaw pairing list --channel <channel> [--account <id>]` หากรหัสไม่มาถึง
    - การเปิด DM สู่สาธารณะต้องเลือกใช้อย่างชัดเจน (`dmPolicy: "open"` และ allowlist `"*"`)

    รัน `openclaw doctor` เพื่อแสดงนโยบาย DM ที่มีความเสี่ยง

  </Accordion>

  <Accordion title="prompt injection เป็นข้อกังวลเฉพาะสำหรับ bot สาธารณะหรือไม่?">
    ไม่ใช่ Prompt injection เกี่ยวกับ **เนื้อหาที่ไม่น่าเชื่อถือ** ไม่ใช่เพียงว่าใครสามารถ DM หา bot ได้
    หาก assistant ของคุณอ่านข้อความจากภายนอก (web search/fetch, หน้าเบราว์เซอร์, อีเมล,
    เอกสาร, ไฟล์แนบ, ล็อกที่วางมา) เนื้อหานั้นอาจมีคำสั่งที่พยายาม
    ยึดโมเดลได้ สิ่งนี้เกิดขึ้นได้แม้ว่า **คุณจะเป็นผู้ส่งเพียงคนเดียว**

    ความเสี่ยงที่ใหญ่ที่สุดเกิดขึ้นเมื่อเปิดใช้เครื่องมือ: โมเดลอาจถูกหลอกให้
    ขโมย context ออกไปหรือเรียกใช้เครื่องมือแทนคุณ ลดขอบเขตผลกระทบโดย:

    - ใช้เอเจนต์ "ตัวอ่าน" ที่เป็น read-only หรือปิดเครื่องมือ เพื่อสรุปเนื้อหาที่ไม่น่าเชื่อถือ
    - ปิด `web_search` / `web_fetch` / `browser` สำหรับเอเจนต์ที่เปิดใช้เครื่องมือ
    - ถือว่าข้อความจากไฟล์/เอกสารที่ถอดรหัสแล้วก็ไม่น่าเชื่อถือเช่นกัน: OpenResponses
      `input_file` และการแยกข้อความจากไฟล์แนบสื่อต่างห่อข้อความที่แยกได้ด้วย
      marker ขอบเขตเนื้อหาภายนอกอย่างชัดเจน แทนที่จะส่งข้อความไฟล์ดิบ
    - ใช้ sandbox และ allowlist เครื่องมือที่เข้มงวด

    รายละเอียด: [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="OpenClaw ปลอดภัยน้อยลงหรือไม่เพราะใช้ TypeScript/Node แทน Rust/WASM?">
    ภาษาและ runtime มีความสำคัญ แต่ไม่ใช่ความเสี่ยงหลักสำหรับเอเจนต์ส่วนบุคคล
    ความเสี่ยงเชิงปฏิบัติของ OpenClaw คือการเปิดเผย gateway, ใครสามารถส่งข้อความหา
    bot ได้, prompt injection, ขอบเขตเครื่องมือ, การจัดการ credential, การเข้าถึงเบราว์เซอร์, การเข้าถึง exec
    และความน่าเชื่อถือของ skill หรือ plugin จากภายนอก

    Rust และ WASM สามารถให้การแยกที่แข็งแรงกว่าสำหรับโค้ดบางประเภท แต่
    ไม่ได้แก้ prompt injection, allowlist ที่ไม่ดี, การเปิดเผย gateway สาธารณะ,
    เครื่องมือที่กว้างเกินไป หรือโปรไฟล์เบราว์เซอร์ที่ล็อกอินบัญชีที่ละเอียดอ่อนอยู่แล้ว
    ให้ถือสิ่งเหล่านี้เป็นการควบคุมหลัก:

    - ทำให้ Gateway เป็นส่วนตัวหรือมีการยืนยันตัวตน
    - ใช้การจับคู่และ allowlist สำหรับ DM และกลุ่ม
    - ปฏิเสธหรือ sandbox เครื่องมือที่มีความเสี่ยงสำหรับอินพุตที่ไม่น่าเชื่อถือ
    - ติดตั้งเฉพาะ plugins และ skills ที่เชื่อถือได้
    - รัน `openclaw security audit --deep` หลังเปลี่ยน config

    รายละเอียด: [ความปลอดภัย](/th/gateway/security), [Sandboxing](/th/gateway/sandboxing)

  </Accordion>

  <Accordion title="ฉันเห็นรายงานเกี่ยวกับอินสแตนซ์ OpenClaw ที่ถูกเปิดเผย ควรตรวจสอบอะไร?">
    ก่อนอื่นตรวจสอบ deployment จริงของคุณ:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    baseline ที่ปลอดภัยกว่า คือ:

    - Gateway ผูกกับ `loopback` หรือเปิดเผยผ่านการเข้าถึงส่วนตัวที่ยืนยันตัวตนแล้วเท่านั้น
      เช่น tailnet, SSH tunnel, การยืนยันตัวตนด้วย token/password หรือพร็อกซีที่เชื่อถือได้ซึ่ง
      กำหนดค่าอย่างถูกต้อง
    - DM อยู่ในโหมด `pairing` หรือ `allowlist`
    - กลุ่มอยู่ใน allowlist และต้องมีการ mention เว้นแต่สมาชิกทุกคนจะเชื่อถือได้
    - เครื่องมือความเสี่ยงสูง (`exec`, `browser`, `gateway`, `cron`) ถูกปฏิเสธหรือจำกัดขอบเขตอย่างเข้มงวด
      สำหรับเอเจนต์ที่อ่านเนื้อหาที่ไม่น่าเชื่อถือ
    - เปิดใช้ sandboxing ในที่ที่การรันเครื่องมือต้องการขอบเขตผลกระทบที่เล็กลง

    การ bind สาธารณะโดยไม่มี auth, DM/กลุ่มแบบเปิดพร้อมเครื่องมือ และการเปิดเผยการควบคุมเบราว์เซอร์
    คือสิ่งที่ควรแก้ก่อน รายละเอียด:
    [เช็กลิสต์การตรวจสอบความปลอดภัย](/th/gateway/security#security-audit-checklist)

  </Accordion>

  <Accordion title="Skills ของ ClawHub และ plugins จากภายนอกปลอดภัยสำหรับการติดตั้งหรือไม่?">
    ถือว่า skills และ plugins จากภายนอกเป็นโค้ดที่คุณเลือกจะเชื่อถือ
    หน้า skill ของ ClawHub แสดงสถานะการสแกนก่อนติดตั้ง แต่การสแกนไม่ใช่
    ขอบเขตความปลอดภัยที่สมบูรณ์ OpenClaw ไม่ได้รันการบล็อกโค้ดอันตรายแบบ local
    ในตัวระหว่างขั้นตอนการติดตั้ง/อัปเดต plugin หรือ skill; ใช้
    `security.installPolicy` ที่ผู้ปฏิบัติการเป็นเจ้าของสำหรับการตัดสินใจอนุญาต/บล็อกแบบ local

    รูปแบบที่ปลอดภัยกว่า:

    - เลือกผู้เขียนที่เชื่อถือได้และเวอร์ชันที่ pin ไว้
    - อ่าน skill หรือ plugin ก่อนเปิดใช้งาน
    - จำกัด allowlist ของ plugin และ skill ให้แคบ
    - รัน workflow ที่มีอินพุตไม่น่าเชื่อถือใน sandbox พร้อมเครื่องมือขั้นต่ำ
    - หลีกเลี่ยงการให้โค้ดจากภายนอกเข้าถึง filesystem, exec, browser หรือ secret อย่างกว้างขวาง

    รายละเอียด: [Skills](/th/tools/skills), [Plugin](/th/tools/plugin),
    [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="บอตของฉันควรมีอีเมล บัญชี GitHub หรือหมายเลขโทรศัพท์ของตัวเองหรือไม่?">
    ใช่ สำหรับการตั้งค่าส่วนใหญ่ การแยกบอตออกด้วยบัญชีและหมายเลขโทรศัพท์ต่างหาก
    ช่วยลดขอบเขตผลกระทบหากมีบางอย่างผิดพลาด และยังทำให้หมุนเวียน
    ข้อมูลรับรองหรือเพิกถอนสิทธิ์เข้าถึงได้ง่ายขึ้นโดยไม่กระทบบัญชีส่วนตัวของคุณ

    เริ่มจากขอบเขตเล็กก่อน ให้สิทธิ์เข้าถึงเฉพาะเครื่องมือและบัญชีที่คุณจำเป็นต้องใช้จริง
    แล้วค่อยขยายภายหลังหากจำเป็น

    เอกสาร: [ความปลอดภัย](/th/gateway/security), [การจับคู่](/th/channels/pairing).

  </Accordion>

  <Accordion title="ฉันให้มันทำงานอัตโนมัติกับข้อความของฉันได้ไหม และปลอดภัยหรือไม่?">
    เรา**ไม่**แนะนำให้ให้สิทธิ์ทำงานอัตโนมัติเต็มรูปแบบกับข้อความส่วนตัวของคุณ รูปแบบที่ปลอดภัยที่สุดคือ:

    - เก็บข้อความส่วนตัวไว้ใน**โหมดการจับคู่**หรือรายการอนุญาตที่จำกัดมาก
    - ใช้**หมายเลขหรือบัญชีแยกต่างหาก**หากคุณต้องการให้มันส่งข้อความแทนคุณ
    - ให้มันร่างข้อความ แล้ว**อนุมัติก่อนส่ง**

    หากคุณต้องการทดลอง ให้ทำบนบัญชีเฉพาะและแยกออกจากบัญชีอื่น ดู
    [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="ฉันใช้โมเดลที่ถูกกว่าสำหรับงานผู้ช่วยส่วนตัวได้ไหม?">
    ได้ **ถ้า**เอเจนต์เป็นแบบแชทเท่านั้นและข้อมูลขาเข้าน่าเชื่อถือ ระดับโมเดลที่เล็กกว่า
    อ่อนไหวต่อการถูกแทรกคำสั่งมากกว่า จึงควรหลีกเลี่ยงสำหรับเอเจนต์ที่เปิดใช้เครื่องมือ
    หรือเมื่ออ่านข้อความที่ไม่น่าเชื่อถือ หากคุณจำเป็นต้องใช้โมเดลที่เล็กกว่า ให้จำกัด
    เครื่องมืออย่างเข้มงวดและรันภายในแซนด์บ็อกซ์ ดู [ความปลอดภัย](/th/gateway/security).
  </Accordion>

  <Accordion title="ฉันรัน /start ใน Telegram แต่ไม่ได้รับรหัสจับคู่">
    รหัสจับคู่จะถูกส่ง**เฉพาะ**เมื่อผู้ส่งที่ไม่รู้จักส่งข้อความถึงบอตและเปิดใช้
    `dmPolicy: "pairing"` แล้วเท่านั้น `/start` เพียงอย่างเดียวจะไม่สร้างรหัส

    ตรวจสอบคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list telegram
    ```

    หากคุณต้องการเข้าถึงทันที ให้เพิ่มรหัสผู้ส่งของคุณในรายการอนุญาตหรือตั้งค่า `dmPolicy: "open"`
    สำหรับบัญชีนั้น

  </Accordion>

  <Accordion title="WhatsApp: มันจะส่งข้อความถึงรายชื่อติดต่อของฉันไหม? การจับคู่ทำงานอย่างไร?">
    ไม่ นโยบายข้อความส่วนตัวเริ่มต้นของ WhatsApp คือ**การจับคู่** ผู้ส่งที่ไม่รู้จักจะได้รับเฉพาะรหัสจับคู่ และข้อความของพวกเขา**จะไม่ถูกประมวลผล** OpenClaw จะตอบกลับเฉพาะแชทที่ได้รับหรือการส่งที่คุณสั่งอย่างชัดเจนเท่านั้น

    อนุมัติการจับคู่ด้วย:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    แสดงรายการคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list whatsapp
    ```

    พรอมต์หมายเลขโทรศัพท์ในตัวช่วยตั้งค่า: ใช้เพื่อตั้งค่า**รายการอนุญาต/เจ้าของ**ของคุณ เพื่อให้ข้อความส่วนตัวของคุณเองได้รับอนุญาต ไม่ได้ใช้สำหรับการส่งอัตโนมัติ หากคุณรันบนหมายเลข WhatsApp ส่วนตัว ให้ใช้หมายเลขนั้นและเปิดใช้ `channels.whatsapp.selfChatMode`

  </Accordion>
</AccordionGroup>

## คำสั่งแชท การยกเลิกงาน และ "มันไม่ยอมหยุด"

<AccordionGroup>
  <Accordion title="ฉันจะหยุดไม่ให้ข้อความระบบภายในแสดงในแชทได้อย่างไร?">
    ข้อความภายในหรือข้อความเครื่องมือส่วนใหญ่จะแสดงเฉพาะเมื่อเปิดใช้ **verbose**, **trace** หรือ **reasoning**
    สำหรับเซสชันนั้น

    แก้ไขในแชทที่คุณเห็นข้อความนั้น:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    หากยังมีเสียงรบกวนมาก ให้ตรวจสอบการตั้งค่าเซสชันใน Control UI และตั้งค่า verbose
    เป็น **inherit** และยืนยันด้วยว่าคุณไม่ได้ใช้โปรไฟล์บอตที่ตั้งค่า `verboseDefault`
    เป็น `on` ในคอนฟิก

    เอกสาร: [การคิดและ verbose](/th/tools/thinking), [ความปลอดภัย](/th/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="ฉันจะหยุด/ยกเลิกงานที่กำลังรันอยู่ได้อย่างไร?">
    ส่งรายการใดรายการหนึ่งต่อไปนี้**เป็นข้อความเดี่ยว** (ไม่มีเครื่องหมายสแลช):

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

    รายการเหล่านี้เป็นทริกเกอร์ยกเลิก (ไม่ใช่คำสั่งสแลช)

    สำหรับกระบวนการเบื้องหลัง (จากเครื่องมือ exec) คุณสามารถขอให้เอเจนต์รัน:

    ```
    process action:kill sessionId:XXX
    ```

    ภาพรวมคำสั่งสแลช: ดู [คำสั่งสแลช](/th/tools/slash-commands).

    คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความ**เดี่ยว**ที่ขึ้นต้นด้วย `/` แต่ทางลัดบางรายการ (เช่น `/status`) ก็ใช้แบบแทรกในข้อความได้เช่นกันสำหรับผู้ส่งที่อยู่ในรายการอนุญาต

  </Accordion>

  <Accordion title='ฉันจะส่งข้อความ Discord จาก Telegram ได้อย่างไร? ("การส่งข้อความข้ามบริบทถูกปฏิเสธ")'>
    OpenClaw บล็อกการส่งข้อความ**ข้ามผู้ให้บริการ**โดยค่าเริ่มต้น หากการเรียกเครื่องมือผูกอยู่กับ
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

    รีสตาร์ต Gateway หลังแก้ไขคอนฟิก

  </Accordion>

  <Accordion title='ทำไมจึงรู้สึกเหมือนบอต "ละเลย" ข้อความที่ส่งรัว ๆ?'>
    โดยค่าเริ่มต้น พรอมต์ระหว่างที่กำลังรันจะถูกนำทางเข้าไปยังรันที่ใช้งานอยู่ ใช้ `/queue` เพื่อเลือกพฤติกรรมของรันที่ใช้งานอยู่:

    - `steer` - ชี้นำรันที่ใช้งานอยู่ที่ขอบเขตโมเดลถัดไป
    - `followup` - จัดคิวข้อความและรันทีละรายการหลังจากรันปัจจุบันจบ
    - `collect` - จัดคิวข้อความที่เข้ากันได้และตอบกลับครั้งเดียวหลังจากรันปัจจุบันจบ
    - `interrupt` - ยกเลิกรันปัจจุบันและเริ่มใหม่

    โหมดเริ่มต้นคือ `steer` คุณสามารถเพิ่มตัวเลือกอย่าง `debounce:0.5s cap:25 drop:summarize` สำหรับโหมดที่จัดคิวได้ ดู [คิวคำสั่ง](/th/concepts/queue) และ [คิวการชี้นำ](/th/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## อื่น ๆ

<AccordionGroup>
  <Accordion title='โมเดลเริ่มต้นสำหรับ Anthropic เมื่อใช้ API key คืออะไร?'>
    ใน OpenClaw ข้อมูลรับรองและการเลือกโมเดลเป็นคนละส่วนกัน การตั้งค่า `ANTHROPIC_API_KEY` (หรือจัดเก็บ Anthropic API key ในโปรไฟล์ยืนยันตัวตน) จะเปิดใช้การยืนยันตัวตน แต่โมเดลเริ่มต้นจริงคือสิ่งที่คุณกำหนดค่าไว้ใน `agents.defaults.model.primary` (เช่น `anthropic/claude-sonnet-4-6` หรือ `anthropic/claude-opus-4-6`) หากคุณเห็น `No credentials found for profile "anthropic:default"` หมายความว่า Gateway ไม่พบข้อมูลรับรอง Anthropic ใน `auth-profiles.json` ที่คาดไว้สำหรับเอเจนต์ที่กำลังรันอยู่
  </Accordion>
</AccordionGroup>

---

ยังติดปัญหาอยู่หรือไม่? ถามใน [Discord](https://discord.com/invite/clawd) หรือเปิด [การสนทนา GitHub](https://github.com/openclaw/openclaw/discussions).

## ที่เกี่ยวข้อง

- [คำถามที่พบบ่อยในการรันครั้งแรก](/th/help/faq-first-run) — การติดตั้ง การเริ่มใช้งาน การยืนยันตัวตน การสมัครใช้งาน ข้อผิดพลาดช่วงแรก
- [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models) — การเลือกโมเดล failover โปรไฟล์ยืนยันตัวตน
- [การแก้ไขปัญหา](/th/help/troubleshooting) — การคัดแยกตามอาการก่อน
