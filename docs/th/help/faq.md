---
read_when:
    - การตอบคำถามสนับสนุนทั่วไปเกี่ยวกับการตั้งค่า การติดตั้ง การเริ่มใช้งาน หรือรันไทม์
    - การคัดแยกปัญหาที่ผู้ใช้รายงานก่อนการดีบักเชิงลึก
summary: คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า การกำหนดค่า และการใช้งาน OpenClaw
title: คำถามที่พบบ่อย
x-i18n:
    generated_at: "2026-06-27T17:41:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40b32792c202944576cd983ecf8bf794551bc50986d6b5c985a8ddfe0ecf0b34
    source_path: help/faq.md
    workflow: 16
---

คำตอบแบบรวดเร็วพร้อมการแก้ปัญหาเชิงลึกสำหรับการตั้งค่าจริง (การพัฒนาในเครื่อง, VPS, หลายเอเจนต์, OAuth/คีย์ API, การสลับโมเดลเมื่อล้มเหลว) สำหรับการวินิจฉัยรันไทม์ โปรดดู [การแก้ปัญหา](/th/gateway/troubleshooting) สำหรับอ้างอิงการกำหนดค่าฉบับเต็ม โปรดดู [การกำหนดค่า](/th/gateway/configuration)

## 60 วินาทีแรกเมื่อมีบางอย่างเสีย

1. **สถานะด่วน (ตรวจสอบก่อน)**

   ```bash
   openclaw status
   ```

   สรุปภายในเครื่องอย่างรวดเร็ว: OS + อัปเดต, การเข้าถึง gateway/บริการ, เอเจนต์/เซสชัน, การกำหนดค่าผู้ให้บริการ + ปัญหารันไทม์ (เมื่อเข้าถึง gateway ได้)

2. **รายงานที่วางต่อได้ (ปลอดภัยสำหรับแชร์)**

   ```bash
   openclaw status --all
   ```

   การวินิจฉัยแบบอ่านอย่างเดียวพร้อมท้าย log (ปกปิด token แล้ว)

3. **สถานะ daemon + port**

   ```bash
   openclaw gateway status
   ```

   แสดงรันไทม์ของ supervisor เทียบกับการเข้าถึง RPC, URL เป้าหมายของ probe, และการกำหนดค่าที่บริการน่าจะใช้

4. **probe เชิงลึก**

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

   File logs แยกจาก service logs; ดู [Logging](/th/logging) และ [การแก้ปัญหา](/th/gateway/troubleshooting)

6. **รัน doctor (การซ่อมแซม)**

   ```bash
   openclaw doctor
   ```

   ซ่อมแซม/ย้ายข้อมูล config/state + รัน health checks ดู [Doctor](/th/gateway/doctor)

7. **snapshot ของ Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   ขอ snapshot ฉบับเต็มจาก gateway ที่กำลังทำงาน (เฉพาะ WS) ดู [Health](/th/gateway/health)

## เริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก

ถาม-ตอบสำหรับการใช้งานครั้งแรก — การติดตั้ง, onboard, เส้นทาง auth, subscriptions, ความล้มเหลวเริ่มต้น —
อยู่ที่ [FAQ การใช้งานครั้งแรก](/th/help/faq-first-run)

## OpenClaw คืออะไร?

<AccordionGroup>
  <Accordion title="OpenClaw คืออะไรในหนึ่งย่อหน้า?">
    OpenClaw คือผู้ช่วย AI ส่วนตัวที่คุณรันบนอุปกรณ์ของคุณเอง มันตอบกลับบนพื้นผิวการส่งข้อความที่คุณใช้อยู่แล้ว (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat และ Plugin ช่องทางที่บันเดิลมา เช่น QQ Bot) และยังทำเสียง + Canvas แบบ live บนแพลตฟอร์มที่รองรับได้ด้วย **Gateway** คือ control plane ที่เปิดตลอดเวลา; ผู้ช่วยคือผลิตภัณฑ์
  </Accordion>

  <Accordion title="คุณค่าที่ได้รับ">
    OpenClaw ไม่ใช่ "แค่ wrapper ของ Claude" แต่มันคือ **control plane แบบ local-first** ที่ให้คุณรัน
    ผู้ช่วยที่มีความสามารถบน **ฮาร์ดแวร์ของคุณเอง** เข้าถึงได้จากแอปแชตที่คุณใช้อยู่แล้ว พร้อม
    เซสชันที่มีสถานะ, memory, และเครื่องมือ - โดยไม่ต้องยกการควบคุมเวิร์กโฟลว์ของคุณให้กับ
    SaaS ที่โฮสต์ให้

    จุดเด่น:

    - **อุปกรณ์ของคุณ ข้อมูลของคุณ:** รัน Gateway ที่ไหนก็ได้ตามต้องการ (Mac, Linux, VPS) และเก็บ
      workspace + ประวัติเซสชันไว้ในเครื่อง
    - **ช่องทางจริง ไม่ใช่ sandbox บนเว็บ:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/ฯลฯ,
      พร้อมเสียงบนมือถือและ Canvas บนแพลตฟอร์มที่รองรับ
    - **ไม่ผูกกับโมเดล:** ใช้ Anthropic, OpenAI, MiniMax, OpenRouter ฯลฯ พร้อมการ route
      และ failover แยกตามเอเจนต์
    - **ตัวเลือกเฉพาะในเครื่อง:** รันโมเดลในเครื่องเพื่อให้ **ข้อมูลทั้งหมดอยู่บนอุปกรณ์ของคุณได้** หากต้องการ
    - **การ route หลายเอเจนต์:** แยกเอเจนต์ตามช่องทาง, บัญชี, หรืองาน โดยแต่ละตัวมี
      workspace และค่าเริ่มต้นของตัวเอง
    - **โอเพนซอร์สและปรับแต่งได้:** ตรวจสอบ, ขยาย, และ self-host ได้โดยไม่ติด vendor lock-in

    เอกสาร: [Gateway](/th/gateway), [Channels](/th/channels), [หลายเอเจนต์](/th/concepts/multi-agent),
    [Memory](/th/concepts/memory)

  </Accordion>

  <Accordion title="ฉันเพิ่งตั้งค่าเสร็จ - ควรทำอะไรเป็นอย่างแรก?">
    โปรเจกต์แรกที่เหมาะ:

    - สร้างเว็บไซต์ (WordPress, Shopify, หรือไซต์ static แบบง่าย)
    - ทำ prototype แอปมือถือ (โครงร่าง, หน้าจอ, แผน API)
    - จัดระเบียบไฟล์และโฟลเดอร์ (ทำความสะอาด, ตั้งชื่อ, ติดแท็ก)
    - เชื่อมต่อ Gmail และทำสรุปหรือการติดตามผลแบบอัตโนมัติ

    มันจัดการงานใหญ่ได้ แต่จะทำงานได้ดีที่สุดเมื่อคุณแบ่งงานเป็นเฟสและ
    ใช้เอเจนต์ย่อยสำหรับงานแบบขนาน

  </Accordion>

  <Accordion title="กรณีใช้งานประจำวันยอดนิยม 5 อันดับของ OpenClaw คืออะไร?">
    ผลลัพธ์ที่ได้ประโยชน์ในชีวิตประจำวันมักเป็นแบบนี้:

    - **บรีฟส่วนตัว:** สรุป inbox, calendar, และข่าวที่คุณสนใจ
    - **ค้นคว้าและร่าง:** ค้นคว้าอย่างรวดเร็ว, สรุป, และร่างแรกสำหรับอีเมลหรือเอกสาร
    - **เตือนความจำและติดตามผล:** การสะกิดเตือนและ checklist ที่ขับเคลื่อนด้วย Cron หรือ Heartbeat
    - **การทำงานอัตโนมัติบนเบราว์เซอร์:** กรอกฟอร์ม, รวบรวมข้อมูล, และทำงานเว็บซ้ำๆ
    - **การประสานงานข้ามอุปกรณ์:** ส่งงานจากโทรศัพท์ ให้ Gateway รันบนเซิร์ฟเวอร์ แล้วรับผลกลับในแชต

  </Accordion>

  <Accordion title="OpenClaw ช่วยเรื่อง lead gen, outreach, โฆษณา, และบล็อกสำหรับ SaaS ได้ไหม?">
    ได้สำหรับ **การค้นคว้า, การคัดกรอง, และการร่าง** มันสแกนไซต์, สร้าง shortlist,
    สรุป prospect, และเขียนร่าง outreach หรือข้อความโฆษณาได้

    สำหรับ **การทำ outreach หรือการรันโฆษณา** ให้มีมนุษย์อยู่ในลูปเสมอ หลีกเลี่ยงสแปม ปฏิบัติตามกฎหมายท้องถิ่นและ
    นโยบายแพลตฟอร์ม และตรวจทานทุกอย่างก่อนส่ง รูปแบบที่ปลอดภัยที่สุดคือให้
    OpenClaw ร่าง แล้วคุณอนุมัติ

    เอกสาร: [Security](/th/gateway/security)

  </Accordion>

  <Accordion title="ข้อดีเมื่อเทียบกับ Claude Code สำหรับการพัฒนาเว็บคืออะไร?">
    OpenClaw คือ **ผู้ช่วยส่วนตัว** และเลเยอร์ประสานงาน ไม่ใช่ตัวแทน IDE ใช้
    Claude Code หรือ Codex สำหรับลูปเขียนโค้ดโดยตรงใน repo ที่เร็วที่สุด ใช้ OpenClaw เมื่อคุณ
    ต้องการ memory ที่คงอยู่, การเข้าถึงข้ามอุปกรณ์, และการประสานเครื่องมือ

    ข้อดี:

    - **Memory + workspace แบบคงอยู่** ข้ามเซสชัน
    - **การเข้าถึงหลายแพลตฟอร์ม** (WhatsApp, Telegram, TUI, WebChat)
    - **การประสานเครื่องมือ** (เบราว์เซอร์, ไฟล์, การตั้งเวลา, hook)
    - **Gateway ที่เปิดตลอดเวลา** (รันบน VPS, โต้ตอบจากที่ไหนก็ได้)
    - **Nodes** สำหรับเบราว์เซอร์/หน้าจอ/กล้อง/exec ในเครื่อง

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills และการทำงานอัตโนมัติ

<AccordionGroup>
  <Accordion title="ฉันจะปรับแต่ง skills โดยไม่ทำให้ repo มีการเปลี่ยนแปลงค้างได้อย่างไร?">
    ใช้ managed overrides แทนการแก้สำเนาใน repo ใส่การเปลี่ยนแปลงของคุณใน `~/.openclaw/skills/<name>/SKILL.md` (หรือเพิ่มโฟลเดอร์ผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json`) ลำดับความสำคัญคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` ดังนั้น managed overrides ยังชนะ skills ที่บันเดิลมาโดยไม่แตะ git หากคุณต้องติดตั้ง skill แบบ global แต่ให้เห็นเฉพาะบางเอเจนต์ ให้เก็บสำเนาที่แชร์ไว้ใน `~/.openclaw/skills` แล้วควบคุมการมองเห็นด้วย `agents.defaults.skills` และ `agents.list[].skills` เฉพาะการแก้ไขที่ควรส่ง upstream เท่านั้นที่ควรอยู่ใน repo และส่งเป็น PR
  </Accordion>

  <Accordion title="ฉันโหลด skills จากโฟลเดอร์กำหนดเองได้ไหม?">
    ได้ เพิ่มไดเรกทอรีเพิ่มเติมผ่าน `skills.load.extraDirs` ใน `~/.openclaw/openclaw.json` (ลำดับความสำคัญต่ำสุด) ลำดับความสำคัญเริ่มต้นคือ `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` `clawhub` ติดตั้งลงใน `./skills` ตามค่าเริ่มต้น ซึ่ง OpenClaw ถือเป็น `<workspace>/skills` ในเซสชันถัดไป หาก skill ควรมองเห็นได้เฉพาะบางเอเจนต์ ให้ใช้ร่วมกับ `agents.defaults.skills` หรือ `agents.list[].skills`
  </Accordion>

  <Accordion title="ฉันจะใช้โมเดลหรือการตั้งค่าต่างกันสำหรับงานต่างกันได้อย่างไร?">
    รูปแบบที่รองรับในปัจจุบันคือ:

    - **Cron jobs**: งานที่แยกกันสามารถตั้งค่า override `model` ต่อ job ได้
    - **Agents**: route งานไปยังเอเจนต์แยกกันที่มีโมเดลเริ่มต้น, ระดับการคิด, และ stream params ต่างกัน
    - **การสลับตามต้องการ**: ใช้ `/model` เพื่อสลับโมเดลของเซสชันปัจจุบันได้ทุกเมื่อ

    ตัวอย่างเช่น ใช้โมเดลเดียวกันพร้อมการตั้งค่าต่างกันต่อเอเจนต์:

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

    ใส่ค่าเริ่มต้นต่อโมเดลที่ใช้ร่วมกันใน `agents.defaults.models["provider/model"].params` จากนั้นใส่ override เฉพาะเอเจนต์ใน `agents.list[].params` แบบ flat อย่ากำหนด entry `agents.list[].models["provider/model"].params` แบบ nested แยกต่างหากสำหรับโมเดลเดียวกัน; `agents.list[].models` ใช้สำหรับ catalog โมเดลและ runtime override ต่อเอเจนต์

    ดู [Cron jobs](/th/automation/cron-jobs), [การ route หลายเอเจนต์](/th/concepts/multi-agent), [การกำหนดค่า](/th/gateway/config-agents), และ [คำสั่ง Slash](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="บอทค้างระหว่างทำงานหนัก ฉันจะ offload งานนั้นได้อย่างไร?">
    ใช้ **เอเจนต์ย่อย** สำหรับงานยาวหรืองานขนาน เอเจนต์ย่อยรันในเซสชันของตัวเอง,
    ส่งสรุปกลับมา, และทำให้แชตหลักของคุณยังตอบสนองได้

    ขอให้บอทของคุณ "spawn a sub-agent for this task" หรือใช้ `/subagents`
    ใช้ `/status` ในแชตเพื่อดูว่า Gateway กำลังทำอะไรอยู่ตอนนี้ (และกำลังยุ่งหรือไม่)

    เคล็ดลับ token: งานยาวและเอเจนต์ย่อยต่างก็ใช้ token หากกังวลเรื่องค่าใช้จ่าย ให้ตั้ง
    โมเดลที่ถูกกว่าสำหรับเอเจนต์ย่อยผ่าน `agents.defaults.subagents.model`

    เอกสาร: [เอเจนต์ย่อย](/th/tools/subagents), [งานเบื้องหลัง](/th/automation/tasks)

  </Accordion>

  <Accordion title="เซสชัน subagent ที่ผูกกับ thread ทำงานบน Discord อย่างไร?">
    ใช้ thread bindings คุณสามารถผูก Discord thread กับ subagent หรือเป้าหมายเซสชัน เพื่อให้ข้อความติดตามผลใน thread นั้นคงอยู่ในเซสชันที่ผูกไว้

    โฟลว์พื้นฐาน:

    - Spawn ด้วย `sessions_spawn` โดยใช้ `thread: true` (และเลือกใช้ `mode: "session"` สำหรับการติดตามผลแบบคงอยู่)
    - หรือผูกเองด้วย `/focus <target>`
    - ใช้ `/agents` เพื่อตรวจสอบสถานะ binding
    - ใช้ `/session idle <duration|off>` และ `/session max-age <duration|off>` เพื่อควบคุม auto-unfocus
    - ใช้ `/unfocus` เพื่อถอด thread ออก

    config ที่จำเป็น:

    - ค่าเริ่มต้น global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
    - override สำหรับ Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`
    - ผูกอัตโนมัติเมื่อ spawn: `channels.discord.threadBindings.spawnSessions` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เพื่อปิดการ spawn เซสชันที่ผูกกับ thread

    เอกสาร: [เอเจนต์ย่อย](/th/tools/subagents), [Discord](/th/channels/discord), [อ้างอิงการกำหนดค่า](/th/gateway/configuration-reference), [คำสั่ง Slash](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="subagent ทำงานเสร็จแล้ว แต่การอัปเดตเมื่อเสร็จสิ้นไปผิดที่หรือไม่เคยโพสต์เลย ฉันควรตรวจอะไร?">
    ตรวจเส้นทาง requester ที่ resolve ได้ก่อน:

    - การส่งของ subagent ในโหมด completion จะเลือก thread ที่ผูกไว้หรือเส้นทาง conversation เมื่อมีอยู่
    - หาก origin ของ completion มีเพียง channel, OpenClaw จะ fallback ไปยังเส้นทางที่เก็บไว้ของเซสชัน requester (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้การส่งตรงยังสำเร็จได้
    - หากไม่มีทั้งเส้นทางที่ผูกไว้และเส้นทางที่เก็บไว้ที่ใช้ได้ การส่งตรงอาจล้มเหลว และผลลัพธ์จะ fallback ไปเป็นการส่งผ่านคิวของเซสชันแทนการโพสต์ไปยังแชตทันที
    - เป้าหมายที่ไม่ถูกต้องหรือเก่าเกินไปยังอาจบังคับให้ fallback ไปคิว หรือทำให้การส่งสุดท้ายล้มเหลวได้
    - หาก reply ล่าสุดที่ผู้ใช้เห็นของ child เป็น token เงียบที่ตรงเป๊ะ `NO_REPLY` / `no_reply` หรือเป็น `ANNOUNCE_SKIP` ตรงเป๊ะ OpenClaw จะตั้งใจกดการประกาศไว้แทนการโพสต์ progress เก่าที่ค้างอยู่
    - เอาต์พุต tool/toolResult จะไม่ถูกโปรโมตเป็นข้อความผลลัพธ์ของ child; ผลลัพธ์คือ reply ล่าสุดที่ผู้ใช้เห็นของ assistant จาก child

    ดีบัก:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [Sub-agents](/th/tools/subagents), [Background Tasks](/th/automation/tasks), [Session Tools](/th/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron หรือการเตือนไม่ทำงาน ควรตรวจสอบอะไร?">
    Cron ทำงานภายในกระบวนการ Gateway หาก Gateway ไม่ได้ทำงานอย่างต่อเนื่อง
    งานที่ตั้งเวลาไว้จะไม่ทำงาน

    รายการตรวจสอบ:

    - ยืนยันว่าเปิดใช้งาน cron แล้ว (`cron.enabled`) และไม่ได้ตั้งค่า `OPENCLAW_SKIP_CRON`
    - ตรวจสอบว่า Gateway ทำงานตลอด 24/7 (ไม่มีการ sleep/รีสตาร์ต)
    - ตรวจสอบการตั้งค่าเขตเวลาของงาน (`--tz` เทียบกับเขตเวลาของโฮสต์)

    ดีบัก:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    เอกสาร: [Cron jobs](/th/automation/cron-jobs), [Automation](/th/automation).

  </Accordion>

  <Accordion title="Cron ทำงานแล้ว แต่ไม่มีอะไรถูกส่งไปยังช่องทาง เพราะอะไร?">
    ตรวจสอบโหมดการส่งก่อน:

    - `--no-deliver` / `delivery.mode: "none"` หมายความว่าไม่คาดหวังให้มีการส่งสำรองจากตัวรัน
    - เป้าหมายประกาศหายไปหรือไม่ถูกต้อง (`channel` / `to`) หมายความว่าตัวรันข้ามการส่งออก
    - การยืนยันตัวตนของช่องทางล้มเหลว (`unauthorized`, `Forbidden`) หมายความว่าตัวรันพยายามส่งแล้ว แต่ข้อมูลประจำตัวบล็อกไว้
    - ผลลัพธ์แบบแยกที่เงียบ (`NO_REPLY` / `no_reply` เท่านั้น) จะถูกถือว่าตั้งใจให้ส่งไม่ได้ ดังนั้นตัวรันจึงระงับการส่งสำรองในคิวด้วย

    สำหรับงาน cron แบบแยก เอเจนต์ยังสามารถส่งโดยตรงด้วยเครื่องมือ `message`
    เมื่อมีเส้นทางแชทพร้อมใช้งาน `--announce` ควบคุมเฉพาะเส้นทางสำรองของตัวรัน
    สำหรับข้อความสุดท้ายที่เอเจนต์ยังไม่ได้ส่งเองเท่านั้น

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [Cron jobs](/th/automation/cron-jobs), [Background Tasks](/th/automation/tasks).

  </Accordion>

  <Accordion title="ทำไมการรัน cron แบบแยกจึงสลับโมเดลหรือลองใหม่หนึ่งครั้ง?">
    โดยทั่วไปนี่คือเส้นทางการสลับโมเดลแบบสด ไม่ใช่การตั้งเวลาซ้ำ

    cron แบบแยกสามารถคงการส่งต่อโมเดลรันไทม์และลองใหม่เมื่อการรันที่ใช้งานอยู่
    โยน `LiveSessionModelSwitchError` การลองใหม่จะคงผู้ให้บริการ/โมเดลที่สลับแล้วไว้
    และหากการสลับมีการแทนที่โปรไฟล์ยืนยันตัวตนใหม่ cron ก็จะคงค่านั้นไว้ก่อนลองใหม่ด้วย

    กฎการเลือกที่เกี่ยวข้อง:

    - การแทนที่โมเดลของฮุก Gmail ชนะก่อนเมื่อใช้ได้
    - จากนั้นเป็น `model` ต่อแต่ละงาน
    - จากนั้นเป็นการแทนที่โมเดลของ cron-session ที่จัดเก็บไว้
    - จากนั้นเป็นการเลือกโมเดลเอเจนต์/ค่าเริ่มต้นตามปกติ

    ลูปการลองใหม่มีขอบเขตจำกัด หลังจากความพยายามครั้งแรกบวกการลองใหม่จากการสลับ 2 ครั้ง
    cron จะยกเลิกแทนที่จะวนลูปตลอดไป

    ดีบัก:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    เอกสาร: [Cron jobs](/th/automation/cron-jobs), [cron CLI](/th/cli/cron).

  </Accordion>

  <Accordion title="ฉันจะติดตั้ง Skills บน Linux ได้อย่างไร?">
    ใช้คำสั่ง `openclaw skills` แบบเนทีฟ หรือวาง Skills ลงในเวิร์กสเปซของคุณ UI ของ Skills บน macOS ไม่มีให้ใช้บน Linux
    เรียกดู Skills ได้ที่ [https://clawhub.ai](https://clawhub.ai).

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

    คำสั่ง `openclaw skills install` แบบเนทีฟจะเขียนลงในไดเรกทอรี `skills/`
    ของเวิร์กสเปซที่ใช้งานอยู่ตามค่าเริ่มต้น เพิ่ม `--global` เพื่อติดตั้งลงในไดเรกทอรี
    Skills ที่จัดการร่วมกันสำหรับเอเจนต์ภายในเครื่องทั้งหมด ติดตั้ง CLI `clawhub`
    แยกต่างหากเฉพาะเมื่อคุณต้องการเผยแพร่หรือซิงก์ Skills ของคุณเอง ใช้
    `agents.defaults.skills` หรือ `agents.list[].skills` หากคุณต้องการจำกัดว่า
    เอเจนต์ใดมองเห็น Skills ที่ใช้ร่วมกันได้

  </Accordion>

  <Accordion title="OpenClaw สามารถรันงานตามกำหนดเวลาหรือทำงานเบื้องหลังอย่างต่อเนื่องได้หรือไม่?">
    ได้ ใช้ตัวตั้งเวลาของ Gateway:

    - **Cron jobs** สำหรับงานที่ตั้งเวลาไว้หรืองานที่เกิดซ้ำ (คงอยู่หลังรีสตาร์ต)
    - **Heartbeat** สำหรับการตรวจสอบเป็นระยะของ "เซสชันหลัก"
    - **งานแบบแยก** สำหรับเอเจนต์อัตโนมัติที่โพสต์สรุปหรือส่งไปยังแชท

    เอกสาร: [Cron jobs](/th/automation/cron-jobs), [Automation](/th/automation),
    [Heartbeat](/th/gateway/heartbeat).

  </Accordion>

  <Accordion title="ฉันสามารถรัน Skills ที่ใช้ได้เฉพาะ Apple macOS จาก Linux ได้หรือไม่?">
    ไม่ได้โดยตรง Skills ของ macOS ถูกจำกัดด้วย `metadata.openclaw.os` พร้อมไบนารีที่จำเป็น และ Skills จะปรากฏในพรอมป์ของระบบเฉพาะเมื่อมีสิทธิ์ใช้งานบน **โฮสต์ Gateway** บน Linux Skills ที่จำกัดเฉพาะ `darwin` (เช่น `apple-notes`, `apple-reminders`, `things-mac`) จะไม่โหลด เว้นแต่คุณจะ override การจำกัดสิทธิ์

    คุณมีรูปแบบที่รองรับสามแบบ:

    **ตัวเลือก A - รัน Gateway บน Mac (ง่ายที่สุด)**
    รัน Gateway ในที่ที่มีไบนารีของ macOS อยู่ แล้วเชื่อมต่อจาก Linux ใน [โหมดระยะไกล](#gateway-ports-already-running-and-remote-mode) หรือผ่าน Tailscale Skills จะโหลดตามปกติเพราะโฮสต์ Gateway เป็น macOS

    **ตัวเลือก B - ใช้ Node macOS (ไม่ใช้ SSH)**
    รัน Gateway บน Linux, จับคู่ Node macOS (แอป menubar), และตั้งค่า **Node Run Commands** เป็น "Always Ask" หรือ "Always Allow" บน Mac OpenClaw สามารถถือว่า Skills ที่ใช้ได้เฉพาะ macOS มีสิทธิ์ใช้งานเมื่อมีไบนารีที่จำเป็นอยู่บน Node เอเจนต์จะรัน Skills เหล่านั้นผ่านเครื่องมือ `nodes` หากคุณเลือก "Always Ask" การอนุมัติ "Always Allow" ในพรอมป์จะเพิ่มคำสั่งนั้นลงในรายการอนุญาต

    **ตัวเลือก C - พร็อกซีไบนารี macOS ผ่าน SSH (ขั้นสูง)**
    เก็บ Gateway ไว้บน Linux แต่ทำให้ไบนารี CLI ที่จำเป็น resolve ไปยัง wrapper SSH ที่รันบน Mac จากนั้น override Skill เพื่ออนุญาต Linux เพื่อให้ยังมีสิทธิ์ใช้งาน

    1. สร้าง wrapper SSH สำหรับไบนารี (ตัวอย่าง: `memo` สำหรับ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. วาง wrapper บน `PATH` บนโฮสต์ Linux (เช่น `~/bin/memo`)
    3. Override เมทาดาทาของ Skill (เวิร์กสเปซหรือ `~/.openclaw/skills`) เพื่ออนุญาต Linux:

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
    ยังไม่มีในตัวตอนนี้

    ตัวเลือก:

    - **Skill / Plugin แบบกำหนดเอง:** ดีที่สุดสำหรับการเข้าถึง API ที่เชื่อถือได้ (ทั้ง Notion/HeyGen มี API)
    - **การทำงานอัตโนมัติผ่านเบราว์เซอร์:** ใช้ได้โดยไม่ต้องเขียนโค้ด แต่ช้ากว่าและเปราะบางกว่า

    หากคุณต้องการเก็บบริบทแยกตามลูกค้า (เวิร์กโฟลว์เอเจนซี) รูปแบบง่าย ๆ คือ:

    - หนึ่งหน้า Notion ต่อลูกค้าหนึ่งราย (บริบท + การตั้งค่า + งานที่ใช้งานอยู่)
    - ขอให้เอเจนต์ดึงหน้านั้นเมื่อเริ่มเซสชัน

    หากคุณต้องการการผสานรวมแบบเนทีฟ ให้เปิดคำขอฟีเจอร์หรือสร้าง Skill
    ที่กำหนดเป้าหมาย API เหล่านั้น

    ติดตั้ง Skills:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    การติดตั้งแบบเนทีฟจะไปอยู่ในไดเรกทอรี `skills/` ของเวิร์กสเปซที่ใช้งานอยู่ สำหรับ Skills ที่ใช้ร่วมกันในเอเจนต์ภายในเครื่องทั้งหมด ให้ใช้ `openclaw skills install @owner/<skill-slug> --global` (หรือวางเองใน `~/.openclaw/skills/<name>/SKILL.md`) หากควรให้เอเจนต์บางตัวเท่านั้นเห็นการติดตั้งที่ใช้ร่วมกัน ให้กำหนดค่า `agents.defaults.skills` หรือ `agents.list[].skills` Skills บางรายการคาดหวังไบนารีที่ติดตั้งผ่าน Homebrew; บน Linux นั่นหมายถึง Linuxbrew (ดูรายการ FAQ ของ Homebrew Linux ด้านบน) ดู [Skills](/th/tools/skills), [Skills config](/th/tools/skills-config), และ [ClawHub](/th/clawhub).

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

    ข้อจำกัดปัจจุบันของ `existing-session` / `user`:

    - การกระทำอ้างอิงด้วย ref ไม่ใช่ด้วย CSS selector
    - การอัปโหลดต้องใช้ `ref` / `inputRef` และปัจจุบันรองรับไฟล์ครั้งละหนึ่งไฟล์
    - `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด, และการกระทำแบบแบตช์ยังต้องใช้เบราว์เซอร์ที่จัดการไว้หรือโปรไฟล์ CDP ดิบ

  </Accordion>
</AccordionGroup>

## การทำ Sandbox และหน่วยความจำ

<AccordionGroup>
  <Accordion title="มีเอกสารการทำ Sandbox โดยเฉพาะหรือไม่?">
    มี ดู [Sandboxing](/th/gateway/sandboxing) สำหรับการตั้งค่าเฉพาะ Docker (Gateway เต็มรูปแบบใน Docker หรืออิมเมจ Sandbox) ดู [Docker](/th/install/docker)
  </Accordion>

  <Accordion title="Docker ดูจำกัด - ฉันจะเปิดใช้ฟีเจอร์เต็มรูปแบบได้อย่างไร?">
    อิมเมจค่าเริ่มต้นให้ความสำคัญกับความปลอดภัยก่อนและรันเป็นผู้ใช้ `node` ดังนั้นจึงไม่มี
    แพ็กเกจระบบ, Homebrew, หรือเบราว์เซอร์ที่บันเดิลมา สำหรับการตั้งค่าที่ครบกว่า:

    - คง `/home/node` ไว้ด้วย `OPENCLAW_HOME_VOLUME` เพื่อให้แคชคงอยู่
    - อบ dependency ระบบลงในอิมเมจด้วย `OPENCLAW_IMAGE_APT_PACKAGES`
    - ติดตั้งเบราว์เซอร์ Playwright ผ่าน CLI ที่บันเดิลมา:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` และตรวจสอบให้แน่ใจว่า path นั้นถูกคงไว้

    เอกสาร: [Docker](/th/install/docker), [Browser](/th/tools/browser).

  </Accordion>

  <Accordion title="ฉันสามารถเก็บ DM ให้เป็นส่วนตัว แต่ทำให้กลุ่มเป็นสาธารณะ/อยู่ใน Sandbox ด้วยเอเจนต์เดียวได้หรือไม่?">
    ได้ - หากทราฟฟิกส่วนตัวของคุณคือ **DMs** และทราฟฟิกสาธารณะของคุณคือ **groups**

    ใช้ `agents.defaults.sandbox.mode: "non-main"` เพื่อให้เซสชันกลุ่ม/ช่องทาง (คีย์ non-main) รันใน backend Sandbox ที่กำหนดค่าไว้ ขณะที่เซสชัน DM หลักยังคงอยู่บนโฮสต์ Docker เป็น backend ค่าเริ่มต้นหากคุณไม่ได้เลือกตัวอื่น จากนั้นจำกัดเครื่องมือที่ใช้งานได้ในเซสชัน Sandbox ผ่าน `tools.sandbox.tools`

    คำแนะนำการตั้งค่า + ตัวอย่าง config: [Groups: personal DMs + public groups](/th/channels/groups#pattern-personal-dms-public-groups-single-agent)

    อ้างอิง config สำคัญ: [Gateway configuration](/th/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="ฉันจะ bind โฟลเดอร์ของโฮสต์เข้าไปใน Sandbox ได้อย่างไร?">
    ตั้งค่า `agents.defaults.sandbox.docker.binds` เป็น `["host:path:mode"]` (เช่น `"/home/user/src:/src:ro"`) bind แบบ global + ต่อเอเจนต์จะ merge กัน; bind ต่อเอเจนต์จะถูกละเว้นเมื่อ `scope: "shared"` ใช้ `:ro` สำหรับสิ่งที่ละเอียดอ่อน และจำไว้ว่า bind จะข้ามกำแพงระบบไฟล์ของ Sandbox

    OpenClaw ตรวจสอบแหล่งที่มาของ bind เทียบกับทั้ง path ที่ normalize แล้วและ path canonical ที่ resolve ผ่าน ancestor ที่มีอยู่ลึกที่สุด นั่นหมายความว่าการ escape ผ่าน symlink-parent ยัง fail closed แม้ segment สุดท้ายของ path จะยังไม่มีอยู่ และการตรวจสอบ allowed-root ยังคงใช้หลังจาก resolve symlink แล้ว

    ดู [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts) และ [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) สำหรับตัวอย่างและหมายเหตุด้านความปลอดภัย

  </Accordion>

  <Accordion title="หน่วยความจำทำงานอย่างไร?">
    หน่วยความจำของ OpenClaw เป็นเพียงไฟล์ Markdown ในเวิร์กสเปซของเอเจนต์:

    - บันทึกรายวันใน `memory/YYYY-MM-DD.md`
    - บันทึกระยะยาวที่คัดสรรแล้วใน `MEMORY.md` (เฉพาะเซสชันหลัก/ส่วนตัว)

    OpenClaw ยังรัน **การ flush หน่วยความจำก่อน Compaction แบบเงียบ** เพื่อเตือนโมเดล
    ให้เขียนบันทึกที่คงทนก่อน auto-compaction สิ่งนี้จะรันเฉพาะเมื่อเวิร์กสเปซ
    เขียนได้ (Sandbox แบบอ่านอย่างเดียวจะข้ามไป) ดู [Memory](/th/concepts/memory).

  </Accordion>

  <Accordion title="Memory ลืมข้อมูลอยู่เรื่อย ๆ ฉันจะทำให้จำไว้ถาวรได้อย่างไร?">
    ขอให้บอต **เขียนข้อเท็จจริงลงใน memory** โน้ตระยะยาวควรอยู่ใน `MEMORY.md`
    ส่วนบริบทระยะสั้นให้เก็บไว้ใน `memory/YYYY-MM-DD.md`

    เรื่องนี้ยังเป็นส่วนที่เรากำลังปรับปรุง การเตือนโมเดลให้จัดเก็บความทรงจำจะช่วยได้
    โมเดลจะรู้ว่าต้องทำอย่างไร หากยังลืมอยู่ ให้ตรวจสอบว่า Gateway ใช้
    workspace เดียวกันในทุกครั้งที่รัน

    เอกสาร: [Memory](/th/concepts/memory), [workspace ของเอเจนต์](/th/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Memory คงอยู่ตลอดไปหรือไม่? มีข้อจำกัดอะไรบ้าง?">
    ไฟล์ Memory อยู่บนดิสก์และคงอยู่จนกว่าคุณจะลบ ข้อจำกัดคือพื้นที่จัดเก็บของคุณ
    ไม่ใช่โมเดล **บริบทเซสชัน** ยังคงถูกจำกัดด้วยหน้าต่างบริบทของโมเดล
    ดังนั้นบทสนทนาที่ยาวอาจถูก compact หรือตัดทอน นี่คือเหตุผลที่มี
    การค้นหา memory เพราะมันดึงเฉพาะส่วนที่เกี่ยวข้องกลับเข้ามาในบริบท

    เอกสาร: [Memory](/th/concepts/memory), [บริบท](/th/concepts/context).

  </Accordion>

  <Accordion title="การค้นหา semantic memory ต้องใช้คีย์ OpenAI API หรือไม่?">
    ต้องใช้เฉพาะเมื่อคุณใช้ **การฝังเวกเตอร์ของ OpenAI** เท่านั้น Codex OAuth ครอบคลุมแชต/การเติมเต็ม
    และ **ไม่** ให้สิทธิ์เข้าถึงการฝังเวกเตอร์ ดังนั้น **การลงชื่อเข้าใช้ด้วย Codex (OAuth หรือการเข้าสู่ระบบผ่าน
    Codex CLI)** จะไม่ช่วยสำหรับการค้นหา semantic memory การฝังเวกเตอร์ของ OpenAI
    ยังต้องใช้คีย์ API จริง (`OPENAI_API_KEY` หรือ `models.providers.openai.apiKey`)

    หากคุณไม่ได้ตั้งค่าผู้ให้บริการไว้อย่างชัดเจน OpenClaw จะใช้การฝังเวกเตอร์ของ OpenAI
    คอนฟิกเก่าแบบ legacy ที่ยังระบุ `memorySearch.provider = "auto"` ก็จะ resolve ไปเป็น OpenAI เช่นกัน
    หากไม่มีคีย์ OpenAI API การค้นหา semantic memory จะยังใช้งานไม่ได้
    จนกว่าคุณจะกำหนดค่าคีย์หรือเลือกผู้ให้บริการอื่นอย่างชัดเจน

    หากคุณต้องการใช้แบบ local ให้ตั้งค่า `memorySearch.provider = "local"` (และจะตั้งค่า
    `memorySearch.fallback = "none"` เพิ่มก็ได้) หากคุณต้องการใช้การฝังเวกเตอร์ของ Gemini ให้ตั้งค่า
    `memorySearch.provider = "gemini"` และระบุ `GEMINI_API_KEY` (หรือ
    `memorySearch.remote.apiKey`) เรารองรับโมเดลการฝังเวกเตอร์แบบ **OpenAI, เข้ากันได้กับ OpenAI, Gemini,
    Voyage, Mistral, Bedrock, Ollama, LM Studio, GitHub Copilot, DeepInfra หรือ local**
    ดูรายละเอียดการตั้งค่าได้ที่ [Memory](/th/concepts/memory)

  </Accordion>
</AccordionGroup>

## สิ่งต่าง ๆ อยู่ที่ไหนบนดิสก์

<AccordionGroup>
  <Accordion title="ข้อมูลทั้งหมดที่ใช้กับ OpenClaw ถูกบันทึกไว้ในเครื่องหรือไม่?">
    ไม่ใช่ - **สถานะของ OpenClaw อยู่ในเครื่อง** แต่ **บริการภายนอกยังคงเห็นสิ่งที่คุณส่งให้บริการเหล่านั้น**

    - **อยู่ในเครื่องโดยค่าเริ่มต้น:** เซสชัน, ไฟล์ memory, คอนฟิก และ workspace อยู่บนโฮสต์ Gateway
      (`~/.openclaw` + ไดเรกทอรี workspace ของคุณ)
    - **อยู่ระยะไกลโดยความจำเป็น:** ข้อความที่คุณส่งให้ผู้ให้บริการโมเดล (Anthropic/OpenAI/ฯลฯ) จะถูกส่งไปยัง
      API ของผู้ให้บริการเหล่านั้น และแพลตฟอร์มแชต (WhatsApp/Telegram/Slack/ฯลฯ) จะจัดเก็บข้อมูลข้อความไว้บน
      เซิร์ฟเวอร์ของตน
    - **คุณควบคุมร่องรอยข้อมูลได้:** การใช้โมเดล local จะเก็บ prompt ไว้บนเครื่องของคุณ แต่ทราฟฟิกของช่องทาง
      ยังผ่านเซิร์ฟเวอร์ของช่องทางนั้นอยู่

    ที่เกี่ยวข้อง: [workspace ของเอเจนต์](/th/concepts/agent-workspace), [Memory](/th/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw เก็บข้อมูลไว้ที่ไหน?">
    ทุกอย่างอยู่ใต้ `$OPENCLAW_STATE_DIR` (ค่าเริ่มต้น: `~/.openclaw`):

    | พาธ                                                            | วัตถุประสงค์                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | คอนฟิกหลัก (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | การนำเข้า OAuth แบบ legacy (คัดลอกเข้าโปรไฟล์ auth เมื่อใช้ครั้งแรก)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | โปรไฟล์ auth (OAuth, คีย์ API และ `keyRef`/`tokenRef` ที่เป็นตัวเลือก)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | payload ความลับแบบมีไฟล์สำรองที่เป็นตัวเลือกสำหรับผู้ให้บริการ SecretRef แบบ `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ไฟล์ความเข้ากันได้แบบ legacy (ล้างรายการ `api_key` แบบคงที่แล้ว)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | สถานะผู้ให้บริการ (เช่น `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | สถานะรายเอเจนต์ (agentDir + เซสชัน)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | ประวัติการสนทนาและสถานะ (ต่อเอเจนต์)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | metadata ของเซสชัน (ต่อเอเจนต์)                                       |

    พาธเอเจนต์เดี่ยวแบบ legacy: `~/.openclaw/agent/*` (ย้ายโดย `openclaw doctor`)

    **workspace** ของคุณ (AGENTS.md, ไฟล์ memory, skills และอื่น ๆ) แยกออกมาต่างหากและกำหนดค่าผ่าน `agents.defaults.workspace` (ค่าเริ่มต้น: `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md ควรอยู่ที่ไหน?">
    ไฟล์เหล่านี้อยู่ใน **workspace ของเอเจนต์** ไม่ใช่ `~/.openclaw`

    - **Workspace (ต่อเอเจนต์)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, และ `HEARTBEAT.md` ที่เป็นตัวเลือก
      `memory.md` ตัวพิมพ์เล็กที่ root เป็นอินพุตซ่อมแซมแบบ legacy เท่านั้น; `openclaw doctor --fix`
      สามารถรวมเข้าไปใน `MEMORY.md` ได้เมื่อมีทั้งสองไฟล์อยู่
    - **ไดเรกทอรีสถานะ (`~/.openclaw`)**: คอนฟิก, สถานะช่องทาง/ผู้ให้บริการ, โปรไฟล์ auth, เซสชัน, บันทึก,
      และ Skills ที่ใช้ร่วมกัน (`~/.openclaw/skills`)

    workspace เริ่มต้นคือ `~/.openclaw/workspace` และกำหนดค่าได้ผ่าน:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    หากบอต "ลืม" หลังรีสตาร์ต ให้ยืนยันว่า Gateway ใช้
    workspace เดียวกันทุกครั้งที่เปิดใช้งาน (และจำไว้ว่า: โหมดระยะไกลใช้ workspace ของ
    **โฮสต์ Gateway** ไม่ใช่แล็ปท็อป local ของคุณ)

    เคล็ดลับ: หากคุณต้องการพฤติกรรมหรือความชอบที่คงทน ให้ขอให้บอต **เขียนลงใน
    AGENTS.md หรือ MEMORY.md** แทนการพึ่งพาประวัติแชต

    ดู [workspace ของเอเจนต์](/th/concepts/agent-workspace) และ [Memory](/th/concepts/memory).

  </Accordion>

  <Accordion title="ฉันทำให้ SOUL.md ใหญ่ขึ้นได้ไหม?">
    ได้ `SOUL.md` เป็นหนึ่งในไฟล์เริ่มต้นของ workspace ที่ถูก inject เข้าไปใน
    บริบทของเอเจนต์ ขีดจำกัดการ inject ต่อไฟล์โดยค่าเริ่มต้นคือ `20000` อักขระ
    และงบประมาณ bootstrap รวมทุกไฟล์คือ `60000` อักขระ

    เปลี่ยนค่าเริ่มต้นที่ใช้ร่วมกันในคอนฟิก OpenClaw ของคุณ:

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

    หรือ override เอเจนต์หนึ่งตัว:

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

    ใช้ `/context` เพื่อตรวจสอบขนาดดิบเทียบกับขนาดที่ inject แล้ว และดูว่ามีการตัดทอนเกิดขึ้นหรือไม่
    คง `SOUL.md` ให้เน้นเสียง ท่าที และบุคลิกภาพ; ใส่กฎการปฏิบัติงาน
    ใน `AGENTS.md` และข้อเท็จจริงที่คงทนใน memory

    ดู [บริบท](/th/concepts/context) และ [คอนฟิกเอเจนต์](/th/gateway/config-agents).

  </Accordion>

  <Accordion title="กลยุทธ์สำรองข้อมูลที่แนะนำ">
    ใส่ **workspace ของเอเจนต์** ของคุณไว้ใน repo git แบบ **ส่วนตัว** และสำรองไว้ในที่
    ส่วนตัว (เช่น GitHub private) วิธีนี้จะเก็บ memory + ไฟล์ AGENTS/SOUL/USER
    และช่วยให้คุณกู้คืน "จิตใจ" ของผู้ช่วยได้ภายหลัง

    **อย่า** commit สิ่งใดก็ตามใต้ `~/.openclaw` (credentials, เซสชัน, โทเคน หรือ payload ความลับที่เข้ารหัส)
    หากคุณต้องกู้คืนทั้งหมด ให้สำรองทั้ง workspace และไดเรกทอรีสถานะ
    แยกกัน (ดูคำถามเรื่องการย้ายด้านบน)

    เอกสาร: [workspace ของเอเจนต์](/th/concepts/agent-workspace).

  </Accordion>

  <Accordion title="ฉันจะถอนการติดตั้ง OpenClaw ทั้งหมดได้อย่างไร?">
    ดูคู่มือเฉพาะ: [ถอนการติดตั้ง](/th/install/uninstall).
  </Accordion>

  <Accordion title="เอเจนต์ทำงานนอก workspace ได้ไหม?">
    ได้ workspace คือ **cwd เริ่มต้น** และจุดยึดของ memory ไม่ใช่ sandbox แบบบังคับ
    พาธแบบ relative จะ resolve ภายใน workspace แต่พาธแบบ absolute สามารถเข้าถึงตำแหน่งอื่นของ
    โฮสต์ได้ เว้นแต่ว่าเปิดใช้ sandboxing หากคุณต้องการการแยก ให้ใช้
    [`agents.defaults.sandbox`](/th/gateway/sandboxing) หรือการตั้งค่า sandbox รายเอเจนต์ หากคุณ
    ต้องการให้ repo เป็นไดเรกทอรีทำงานเริ่มต้น ให้ชี้ `workspace` ของเอเจนต์นั้น
    ไปที่ root ของ repo repo OpenClaw เป็นเพียงซอร์สโค้ด; แยก
    workspace ไว้ต่างหาก เว้นแต่คุณตั้งใจให้เอเจนต์ทำงานภายใน repo นั้น

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

  <Accordion title="โหมดระยะไกล: session store อยู่ที่ไหน?">
    สถานะเซสชันเป็นของ **โฮสต์ Gateway** หากคุณอยู่ในโหมดระยะไกล session store ที่คุณสนใจจะอยู่บนเครื่องระยะไกล ไม่ใช่แล็ปท็อป local ของคุณ ดู [การจัดการเซสชัน](/th/concepts/session).
  </Accordion>
</AccordionGroup>

## พื้นฐานคอนฟิก

<AccordionGroup>
  <Accordion title="คอนฟิกใช้รูปแบบอะไร? อยู่ที่ไหน?">
    OpenClaw อ่านคอนฟิก **JSON5** ที่เป็นตัวเลือกจาก `$OPENCLAW_CONFIG_PATH` (ค่าเริ่มต้น: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    หากไม่มีไฟล์ จะใช้ค่าเริ่มต้นที่ค่อนข้างปลอดภัย (รวมถึง workspace เริ่มต้นเป็น `~/.openclaw/workspace`)

  </Accordion>

  <Accordion title='ฉันตั้งค่า gateway.bind: "lan" (หรือ "tailnet") แล้วตอนนี้ไม่มีอะไร listen / UI บอกว่าไม่ได้รับอนุญาต'>
    การ bind แบบไม่ใช่ loopback **ต้องมีพาธ auth ของ gateway ที่ถูกต้อง** ในทางปฏิบัติหมายความว่า:

    - auth แบบ shared-secret: โทเคนหรือรหัสผ่าน
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

    - `gateway.remote.token` / `.password` **ไม่** เปิดใช้ auth ของ gateway local ด้วยตัวเอง
    - พาธการเรียก local สามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
    - สำหรับ auth ด้วยรหัสผ่าน ให้ตั้งค่า `gateway.auth.mode: "password"` พร้อม `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`) แทน
    - หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าไว้อย่างชัดเจนผ่าน SecretRef แล้ว resolve ไม่ได้ การ resolve จะล้มเหลวแบบปิด (ไม่มี remote fallback มาบัง)
    - การตั้งค่า Control UI แบบ shared-secret จะ authenticate ผ่าน `connect.params.auth.token` หรือ `connect.params.auth.password` (เก็บไว้ในการตั้งค่าแอป/UI) โหมดที่มีข้อมูลอัตลักษณ์ เช่น Tailscale Serve หรือ `trusted-proxy` ใช้ request headers แทน หลีกเลี่ยงการใส่ shared secrets ใน URL
    - เมื่อใช้ `gateway.auth.mode: "trusted-proxy"` reverse proxy แบบ loopback บนโฮสต์เดียวกันต้องมี `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน และมีรายการ loopback ใน `gateway.trustedProxies`

  </Accordion>

  <Accordion title="ทำไมตอนนี้ฉันต้องใช้โทเคนบน localhost?">
    OpenClaw บังคับใช้ auth ของ gateway โดยค่าเริ่มต้น รวมถึง loopback ด้วย ในพาธเริ่มต้นตามปกติ นั่นหมายถึง auth แบบโทเคน: หากไม่มีการกำหนดพาธ auth อย่างชัดเจน การเริ่ม Gateway จะ resolve เป็นโหมดโทเคนและสร้างโทเคนเฉพาะ runtime สำหรับการเริ่มครั้งนั้น ดังนั้น **ไคลเอนต์ WS local ต้อง authenticate** กำหนดค่า `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` หรือ `OPENCLAW_GATEWAY_PASSWORD` อย่างชัดเจนเมื่อไคลเอนต์ต้องการ secret ที่คงที่ข้ามการรีสตาร์ต วิธีนี้จะบล็อกโปรเซส local อื่นไม่ให้เรียก Gateway.

    หากคุณต้องการเส้นทาง auth แบบอื่น คุณสามารถเลือกโหมดรหัสผ่านอย่างชัดเจนได้ (หรือสำหรับ reverse proxy ที่รู้จักตัวตน ให้ใช้ `trusted-proxy`) หากคุณ **ต้องการ** เปิด loopback จริง ๆ ให้ตั้งค่า `gateway.auth.mode: "none"` อย่างชัดเจนใน config ของคุณ Doctor สามารถสร้าง token ให้คุณได้ทุกเมื่อ: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="ฉันต้องรีสตาร์ตหลังเปลี่ยน config หรือไม่?">
    Gateway เฝ้าดู config และรองรับ hot-reload:

    - `gateway.reload.mode: "hybrid"` (ค่าเริ่มต้น): นำการเปลี่ยนแปลงที่ปลอดภัยไปใช้แบบ hot-apply และรีสตาร์ตเมื่อเป็นการเปลี่ยนแปลงสำคัญ
    - รองรับ `hot`, `restart`, `off` ด้วยเช่นกัน

  </Accordion>

  <Accordion title="ฉันจะปิด tagline ตลก ๆ ของ CLI ได้อย่างไร?">
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

    - `off`: ซ่อนข้อความ tagline แต่ยังคงบรรทัดชื่อ/เวอร์ชันของแบนเนอร์ไว้
    - `default`: ใช้ `All your chats, one OpenClaw.` ทุกครั้ง
    - `random`: หมุนเวียน tagline ตลก/ตามฤดูกาล (พฤติกรรมเริ่มต้น)
    - หากคุณไม่ต้องการแบนเนอร์เลย ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

  </Accordion>

  <Accordion title="ฉันจะเปิดใช้ web search (และ web fetch) ได้อย่างไร?">
    `web_fetch` ทำงานได้โดยไม่ต้องใช้ API key ส่วน `web_search` ขึ้นอยู่กับ provider
    ที่คุณเลือก:

    - provider ที่มี API รองรับ เช่น Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity และ Tavily ต้องตั้งค่า API key ตามปกติ
    - Grok สามารถใช้ xAI OAuth จาก model auth ซ้ำได้ หรือ fallback ไปใช้ `XAI_API_KEY` / config web-search ของ plugin
    - Ollama Web Search ไม่ต้องใช้ key แต่ใช้ host Ollama ที่คุณ config ไว้ และต้องใช้ `ollama signin`
    - DuckDuckGo ไม่ต้องใช้ key แต่เป็น integration แบบไม่เป็นทางการที่อิง HTML
    - SearXNG ไม่ต้องใช้ key/โฮสต์เองได้; config `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl`

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
    เส้นทาง provider แบบเก่า `tools.web.search.*` ยังโหลดชั่วคราวเพื่อ compatibility แต่ไม่ควรใช้กับ config ใหม่
    config fallback ของ Firecrawl web-fetch อยู่ใต้ `plugins.entries.firecrawl.config.webFetch.*`

    หมายเหตุ:

    - หากคุณใช้ allowlist ให้เพิ่ม `web_search`/`web_fetch`/`x_search` หรือ `group:web`
    - `web_fetch` เปิดใช้โดยค่าเริ่มต้น (เว้นแต่จะปิดไว้อย่างชัดเจน)
    - หากละ `tools.web.fetch.provider` ไว้ OpenClaw จะตรวจหา provider fallback สำหรับ fetch ตัวแรกที่พร้อมจาก credentials ที่มีให้โดยอัตโนมัติ Plugin Firecrawl อย่างเป็นทางการมี fallback นี้ให้
    - daemon อ่าน env vars จาก `~/.openclaw/.env` (หรือ environment ของ service)

    เอกสาร: [เครื่องมือ Web](/th/tools/web).

  </Accordion>

  <Accordion title="config.apply ล้าง config ของฉันหมด ฉันจะกู้คืนและหลีกเลี่ยงสิ่งนี้ได้อย่างไร?">
    `config.apply` จะแทนที่ **config ทั้งหมด** หากคุณส่ง object บางส่วนไป อย่างอื่นทั้งหมด
    จะถูกลบออก

    OpenClaw ปัจจุบันป้องกันการเขียนทับโดยไม่ตั้งใจหลายกรณี:

    - การเขียน config ที่ OpenClaw เป็นเจ้าของจะ validate config ทั้งหมดหลังการเปลี่ยนแปลงก่อนเขียน
    - การเขียนที่ไม่ถูกต้องหรือทำลายข้อมูลซึ่ง OpenClaw เป็นเจ้าของจะถูกปฏิเสธและบันทึกเป็น `openclaw.json.rejected.*`
    - หากการแก้ไขโดยตรงทำให้ startup หรือ hot reload เสีย Gateway จะ fail closed หรือข้าม reload; จะไม่เขียน `openclaw.json` ใหม่
    - `openclaw doctor --fix` เป็นเจ้าของการซ่อมแซมและสามารถกู้คืน last-known-good พร้อมบันทึกไฟล์ที่ถูกปฏิเสธเป็น `openclaw.json.clobbered.*`

    กู้คืน:

    - ตรวจสอบ `openclaw logs --follow` สำหรับ `Invalid config at`, `Config write rejected:` หรือ `config reload skipped (invalid config)`
    - ตรวจดู `openclaw.json.clobbered.*` หรือ `openclaw.json.rejected.*` ที่ใหม่ที่สุดข้าง config ที่ใช้งานอยู่
    - รัน `openclaw config validate` และ `openclaw doctor --fix`
    - คัดลอกกลับเฉพาะ keys ที่ตั้งใจด้วย `openclaw config set` หรือ `config.patch`
    - หากคุณไม่มี last-known-good หรือ payload ที่ถูกปฏิเสธ ให้กู้คืนจาก backup หรือรัน `openclaw doctor` อีกครั้งแล้ว config channels/models ใหม่
    - หากนี่เป็นสิ่งที่ไม่คาดคิด ให้แจ้ง bug และแนบ config ล่าสุดที่คุณทราบหรือ backup ใด ๆ
    - coding agent ภายในเครื่องมักสร้าง config ที่ใช้งานได้ขึ้นใหม่จาก logs หรือ history ได้

    หลีกเลี่ยง:

    - ใช้ `openclaw config set` สำหรับการเปลี่ยนแปลงเล็ก ๆ
    - ใช้ `openclaw configure` สำหรับการแก้ไขแบบ interactive
    - ใช้ `config.schema.lookup` ก่อนเมื่อคุณไม่แน่ใจเกี่ยวกับ path หรือรูปทรง field ที่แน่นอน; คำสั่งนี้คืน shallow schema node พร้อมสรุป child ทันทีเพื่อ drill-down
    - ใช้ `config.patch` สำหรับการแก้ไข RPC บางส่วน; เก็บ `config.apply` ไว้สำหรับการแทนที่ full-config เท่านั้น
    - หากคุณใช้เครื่องมือ `gateway` สำหรับ agent-facing จากการรัน agent เครื่องมือนี้ยังจะปฏิเสธการเขียนไปยัง `tools.exec.ask` / `tools.exec.security` (รวมถึง alias เก่า `tools.bash.*` ที่ normalize ไปยัง protected exec paths เดียวกัน)

    เอกสาร: [Config](/th/cli/config), [Configure](/th/cli/configure), [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/th/gateway/doctor).

  </Accordion>

  <Accordion title="ฉันจะรัน Gateway ส่วนกลางพร้อม workers เฉพาะทางข้ามอุปกรณ์ได้อย่างไร?">
    รูปแบบทั่วไปคือ **Gateway หนึ่งตัว** (เช่น Raspberry Pi) บวกกับ **nodes** และ **agents**:

    - **Gateway (ส่วนกลาง):** เป็นเจ้าของ channels (Signal/WhatsApp), routing และ sessions
    - **Nodes (อุปกรณ์):** Macs/iOS/Android เชื่อมต่อเป็น peripherals และเปิดเผยเครื่องมือภายในเครื่อง (`system.run`, `canvas`, `camera`)
    - **Agents (workers):** brains/workspaces แยกกันสำหรับบทบาทเฉพาะ (เช่น "Hetzner ops", "Personal data")
    - **Sub-agents:** สร้างงาน background จาก agent หลักเมื่อคุณต้องการ parallelism
    - **TUI:** เชื่อมต่อกับ Gateway แล้วสลับ agents/sessions

    เอกสาร: [Nodes](/th/nodes), [การเข้าถึงระยะไกล](/th/gateway/remote), [Multi-Agent Routing](/th/concepts/multi-agent), [Sub-agents](/th/tools/subagents), [TUI](/th/web/tui).

  </Accordion>

  <Accordion title="เบราว์เซอร์ OpenClaw รันแบบ headless ได้หรือไม่?">
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

    ค่าเริ่มต้นคือ `false` (headful) Headless มีโอกาสกระตุ้นการตรวจสอบ anti-bot บางไซต์มากกว่า ดู [Browser](/th/tools/browser)

    Headless ใช้ **Chromium engine เดียวกัน** และทำงานได้กับ automation ส่วนใหญ่ (forms, clicks, scraping, logins) ความแตกต่างหลักคือ:

    - ไม่มีหน้าต่างเบราว์เซอร์ที่มองเห็นได้ (ใช้ screenshots หากต้องการภาพ)
    - บางไซต์เข้มงวดกับ automation ในโหมด headless มากกว่า (CAPTCHAs, anti-bot)
      ตัวอย่างเช่น X/Twitter มักบล็อก sessions แบบ headless

  </Accordion>

  <Accordion title="ฉันจะใช้ Brave สำหรับการควบคุมเบราว์เซอร์ได้อย่างไร?">
    ตั้งค่า `browser.executablePath` เป็น binary ของ Brave ของคุณ (หรือเบราว์เซอร์ใด ๆ ที่อิง Chromium) แล้วรีสตาร์ต Gateway
    ดูตัวอย่าง config แบบเต็มใน [Browser](/th/tools/browser#use-brave-or-another-chromium-based-browser)
  </Accordion>
</AccordionGroup>

## Gateway และ nodes ระยะไกล

<AccordionGroup>
  <Accordion title="commands ส่งต่อระหว่าง Telegram, gateway และ nodes อย่างไร?">
    ข้อความ Telegram ถูกจัดการโดย **gateway** gateway รัน agent และ
    จากนั้นจึงเรียก nodes ผ่าน **Gateway WebSocket** เฉพาะเมื่อจำเป็นต้องใช้เครื่องมือ node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes จะไม่เห็น traffic provider ขาเข้า; nodes จะรับเฉพาะการเรียก node RPC เท่านั้น

  </Accordion>

  <Accordion title="agent ของฉันจะเข้าถึงคอมพิวเตอร์ของฉันได้อย่างไร หาก Gateway โฮสต์จากระยะไกล?">
    คำตอบสั้น ๆ: **pair คอมพิวเตอร์ของคุณเป็น node** Gateway รันอยู่ที่อื่น แต่สามารถ
    เรียกเครื่องมือ `node.*` (screen, camera, system) บนเครื่องภายในของคุณผ่าน Gateway WebSocket ได้

    การตั้งค่าทั่วไป:

    1. รัน Gateway บน host ที่เปิดตลอดเวลา (VPS/home server)
    2. ใส่ host ของ Gateway + คอมพิวเตอร์ของคุณไว้ใน tailnet เดียวกัน
    3. ตรวจให้แน่ใจว่า Gateway WS เข้าถึงได้ (tailnet bind หรือ SSH tunnel)
    4. เปิดแอป macOS ในเครื่องแล้วเชื่อมต่อในโหมด **Remote over SSH** (หรือ direct tailnet)
       เพื่อให้สามารถ register เป็น node ได้
    5. อนุมัติ node บน Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    ไม่จำเป็นต้องมี TCP bridge แยกต่างหาก; nodes เชื่อมต่อผ่าน Gateway WebSocket

    คำเตือนด้านความปลอดภัย: การ pair node macOS อนุญาตให้ใช้ `system.run` บนเครื่องนั้น
    pair เฉพาะอุปกรณ์ที่คุณ trust และตรวจทาน [Security](/th/gateway/security)

    เอกสาร: [Nodes](/th/nodes), [Gateway protocol](/th/gateway/protocol), [โหมดระยะไกล macOS](/th/platforms/mac/remote), [Security](/th/gateway/security).

  </Accordion>

  <Accordion title="Tailscale เชื่อมต่อแล้วแต่ฉันไม่ได้รับการตอบกลับ ต้องทำอย่างไรต่อ?">
    ตรวจพื้นฐาน:

    - Gateway กำลังรันอยู่: `openclaw gateway status`
    - สุขภาพของ Gateway: `openclaw status`
    - สุขภาพของ Channel: `openclaw channels status`

    จากนั้น verify auth และ routing:

    - หากคุณใช้ Tailscale Serve ให้ตรวจว่า `gateway.auth.allowTailscale` ตั้งค่าอย่างถูกต้อง
    - หากคุณเชื่อมต่อผ่าน SSH tunnel ให้ยืนยันว่า local tunnel ทำงานอยู่และชี้ไปยัง port ที่ถูกต้อง
    - ยืนยันว่า allowlists ของคุณ (DM หรือ group) รวม account ของคุณแล้ว

    เอกสาร: [Tailscale](/th/gateway/tailscale), [การเข้าถึงระยะไกล](/th/gateway/remote), [Channels](/th/channels).

  </Accordion>

  <Accordion title="OpenClaw สอง instance คุยกันได้หรือไม่ (local + VPS)?">
    ได้ ไม่มี bridge "bot-to-bot" ในตัว แต่คุณสามารถเชื่อมต่อได้หลายวิธี
    ที่เชื่อถือได้:

    **ง่ายที่สุด:** ใช้ช่องทาง chat ปกติที่ bot ทั้งสองเข้าถึงได้ (Telegram/Slack/WhatsApp)
    ให้ Bot A ส่งข้อความถึง Bot B แล้วปล่อยให้ Bot B ตอบกลับตามปกติ

    **CLI bridge (ทั่วไป):** รัน script ที่เรียก Gateway อีกตัวด้วย
    `openclaw agent --message ... --deliver` โดย target ไปยัง chat ที่ bot อีกตัว
    ฟังอยู่ หาก bot หนึ่งอยู่บน VPS ระยะไกล ให้ชี้ CLI ของคุณไปที่ Gateway ระยะไกลนั้น
    ผ่าน SSH/Tailscale (ดู [การเข้าถึงระยะไกล](/th/gateway/remote))

    รูปแบบตัวอย่าง (รันจากเครื่องที่เข้าถึง Gateway เป้าหมายได้):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    เคล็ดลับ: เพิ่ม guardrail เพื่อไม่ให้ bot ทั้งสองวน loop ไม่สิ้นสุด (mention-only, channel
    allowlists หรือกฎ "do not reply to bot messages")

    เอกสาร: [การเข้าถึงระยะไกล](/th/gateway/remote), [Agent CLI](/th/cli/agent), [Agent send](/th/tools/agent-send).

  </Accordion>

  <Accordion title="ฉันต้องใช้ VPS แยกสำหรับหลาย agents หรือไม่?">
    ไม่ต้อง Gateway หนึ่งตัวสามารถ host agents หลายตัวได้ โดยแต่ละตัวมี workspace, ค่าเริ่มต้นของ model
    และ routing ของตัวเอง นี่คือการตั้งค่าปกติ และถูกกว่าและง่ายกว่าการรัน
    VPS หนึ่งตัวต่อ agent มาก

    ใช้ VPS แยกเฉพาะเมื่อคุณต้องการ isolation ที่แข็งแรง (security boundaries) หรือ config
    ที่ต่างกันมากและไม่ต้องการแชร์ มิฉะนั้น ให้ใช้ Gateway หนึ่งตัวและ
    ใช้หลาย agents หรือ sub-agents

  </Accordion>

  <Accordion title="การใช้โหนดบนแล็ปท็อปส่วนตัวแทน SSH จาก VPS มีประโยชน์หรือไม่?">
    มี - โหนดเป็นวิธีหลักในการเข้าถึงแล็ปท็อปของคุณจาก Gateway ระยะไกล และ
    ปลดล็อกได้มากกว่าการเข้าถึงเชลล์ Gateway ทำงานบน macOS/Linux (Windows ผ่าน WSL2) และ
    มีน้ำหนักเบา (VPS ขนาดเล็กหรือเครื่องระดับ Raspberry Pi ก็เพียงพอ; RAM 4 GB เหลือเฟือ) ดังนั้นการตั้งค่าทั่วไปคือ
    โฮสต์ที่เปิดตลอดเวลาพร้อมแล็ปท็อปของคุณเป็นโหนด

    - **ไม่ต้องใช้ SSH ขาเข้า** โหนดเชื่อมต่อออกไปยัง Gateway WebSocket และใช้การจับคู่อุปกรณ์
    - **การควบคุมการเรียกใช้ที่ปลอดภัยกว่า** `system.run` ถูกควบคุมด้วยรายการอนุญาต/การอนุมัติของโหนดบนแล็ปท็อปนั้น
    - **เครื่องมืออุปกรณ์มากขึ้น** โหนดเปิดเผย `canvas`, `camera` และ `screen` นอกเหนือจาก `system.run`
    - **การทำงานอัตโนมัติของเบราว์เซอร์ในเครื่อง** คง Gateway ไว้บน VPS แต่เรียกใช้ Chrome ในเครื่องผ่านโฮสต์โหนดบนแล็ปท็อป หรือแนบกับ Chrome ในเครื่องบนโฮสต์ผ่าน Chrome MCP

    SSH ใช้ได้ดีสำหรับการเข้าถึงเชลล์เฉพาะกิจ แต่โหนดง่ายกว่าสำหรับเวิร์กโฟลว์เอเจนต์ต่อเนื่องและ
    การทำงานอัตโนมัติของอุปกรณ์

    เอกสาร: [โหนด](/th/nodes), [CLI โหนด](/th/cli/nodes), [เบราว์เซอร์](/th/tools/browser).

  </Accordion>

  <Accordion title="โหนดเรียกใช้บริการ gateway หรือไม่?">
    ไม่ ควรมี **gateway เดียว** ต่อโฮสต์ เว้นแต่คุณตั้งใจเรียกใช้โปรไฟล์ที่แยกกัน (ดู [หลาย gateway](/th/gateway/multiple-gateways)) โหนดเป็นอุปกรณ์ต่อพ่วงที่เชื่อมต่อ
    กับ gateway (โหนด iOS/Android หรือ "โหมดโหนด" ของ macOS ในแอปแถบเมนู) สำหรับโฮสต์โหนดแบบไม่มีหน้าจอ
    และการควบคุมผ่าน CLI ดู [CLI โฮสต์ Node](/th/cli/node)

    ต้องรีสตาร์ตแบบเต็มสำหรับการเปลี่ยนแปลงพื้นผิว `gateway`, `discovery` และ Plugin ที่โฮสต์

  </Accordion>

  <Accordion title="มีวิธี API / RPC สำหรับใช้ config หรือไม่?">
    มี

    - `config.schema.lookup`: ตรวจสอบ subtree ของ config หนึ่งรายการพร้อมโหนด schema ระดับตื้น คำใบ้ UI ที่ตรงกัน และสรุปลูกโดยตรงก่อนเขียน
    - `config.get`: ดึง snapshot + hash ปัจจุบัน
    - `config.patch`: อัปเดตบางส่วนอย่างปลอดภัย (แนะนำสำหรับการแก้ไข RPC ส่วนใหญ่); hot-reload เมื่อทำได้ และรีสตาร์ตเมื่อจำเป็น
    - `config.apply`: ตรวจสอบความถูกต้อง + แทนที่ config ทั้งหมด; hot-reload เมื่อทำได้ และรีสตาร์ตเมื่อจำเป็น
    - เครื่องมือ runtime `gateway` สำหรับเอเจนต์ยังคงปฏิเสธการเขียน `tools.exec.ask` / `tools.exec.security`; alias เดิม `tools.bash.*` จะ normalize ไปยังเส้นทาง exec ที่ได้รับการป้องกันเดียวกัน

  </Accordion>

  <Accordion title="config ขั้นต่ำที่สมเหตุสมผลสำหรับการติดตั้งครั้งแรก">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    สิ่งนี้ตั้งค่า workspace ของคุณและจำกัดว่าใครสามารถสั่งงานบอทได้

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
    4. **ใช้ชื่อโฮสต์ tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    ถ้าคุณต้องการ Control UI โดยไม่ใช้ SSH ให้ใช้ Tailscale Serve บน VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    สิ่งนี้คง gateway ให้ bind กับ loopback และเปิดเผย HTTPS ผ่าน Tailscale ดู [Tailscale](/th/gateway/tailscale)

  </Accordion>

  <Accordion title="ฉันจะเชื่อมต่อโหนด Mac กับ Gateway ระยะไกล (Tailscale Serve) ได้อย่างไร?">
    Serve เปิดเผย **Gateway Control UI + WS** โหนดเชื่อมต่อผ่าน endpoint Gateway WS เดียวกัน

    การตั้งค่าที่แนะนำ:

    1. **ตรวจสอบให้แน่ใจว่า VPS + Mac อยู่บน tailnet เดียวกัน**
    2. **ใช้แอป macOS ในโหมด Remote** (เป้าหมาย SSH อาจเป็นชื่อโฮสต์ tailnet)
       แอปจะ tunnel พอร์ต Gateway และเชื่อมต่อเป็นโหนด
    3. **อนุมัติโหนด** บน gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    เอกสาร: [โปรโตคอล Gateway](/th/gateway/protocol), [Discovery](/th/gateway/discovery), [โหมด remote ของ macOS](/th/platforms/mac/remote).

  </Accordion>

  <Accordion title="ฉันควรติดตั้งบนแล็ปท็อปเครื่องที่สองหรือแค่เพิ่มโหนด?">
    ถ้าคุณต้องการเพียง **เครื่องมือในเครื่อง** (screen/camera/exec) บนแล็ปท็อปเครื่องที่สอง ให้เพิ่มเป็น
    **โหนด** สิ่งนี้คง Gateway เดียวและหลีกเลี่ยง config ซ้ำ เครื่องมือโหนดในเครื่อง
    ปัจจุบันรองรับเฉพาะ macOS แต่เราวางแผนจะขยายไปยัง OS อื่น

    ติดตั้ง Gateway เครื่องที่สองเฉพาะเมื่อคุณต้องการ **การแยกอย่างเข้มงวด** หรือบอทสองตัวที่แยกจากกันโดยสมบูรณ์

    เอกสาร: [โหนด](/th/nodes), [CLI โหนด](/th/cli/nodes), [หลาย gateway](/th/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## ตัวแปร env และการโหลด .env

<AccordionGroup>
  <Accordion title="OpenClaw โหลดตัวแปรสภาพแวดล้อมอย่างไร?">
    OpenClaw อ่านตัวแปร env จากโปรเซสแม่ (shell, launchd/systemd, CI ฯลฯ) และโหลดเพิ่มเติม:

    - `.env` จากไดเรกทอรีทำงานปัจจุบัน
    - fallback `.env` ส่วนกลางจาก `~/.openclaw/.env` (หรือ `$OPENCLAW_STATE_DIR/.env`)

    ไฟล์ `.env` ทั้งสองไฟล์จะไม่ override ตัวแปร env ที่มีอยู่
    ตัวแปร credential ของ provider เป็นข้อยกเว้นสำหรับ workspace `.env`: คีย์เช่น
    `GEMINI_API_KEY`, `XAI_API_KEY` หรือ `MISTRAL_API_KEY` จะถูกละเว้นจาก workspace
    `.env` และควรอยู่ในสภาพแวดล้อมของโปรเซส, `~/.openclaw/.env` หรือ config `env`

    คุณยังสามารถกำหนดตัวแปร env แบบ inline ใน config ได้ (ใช้เฉพาะเมื่อไม่มีใน process env):

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

  <Accordion title="ฉันเริ่ม Gateway ผ่าน service แล้วตัวแปร env ของฉันหายไป ตอนนี้ทำอย่างไร?">
    วิธีแก้ทั่วไปสองวิธี:

    1. ใส่คีย์ที่หายไปใน `~/.openclaw/.env` เพื่อให้ถูกอ่านแม้ service จะไม่ได้รับ env จาก shell ของคุณ
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

    สิ่งนี้จะเรียกใช้ login shell ของคุณและนำเข้าเฉพาะคีย์ที่คาดไว้ซึ่งยังไม่มี (ไม่ override) ตัวแปร env เทียบเท่า:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='ฉันตั้งค่า COPILOT_GITHUB_TOKEN แล้ว แต่สถานะ models แสดง "Shell env: off." ทำไม?'>
    `openclaw models status` รายงานว่าเปิดใช้ **การนำเข้า shell env** หรือไม่ "Shell env: off"
    **ไม่ได้** หมายความว่าตัวแปร env ของคุณหายไป - แค่หมายความว่า OpenClaw จะไม่โหลด
    login shell ของคุณโดยอัตโนมัติ

    ถ้า Gateway ทำงานเป็น service (launchd/systemd) มันจะไม่สืบทอดสภาพแวดล้อมจาก shell
    ของคุณ แก้โดยทำหนึ่งในข้อต่อไปนี้:

    1. ใส่ token ใน `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. หรือเปิดใช้การนำเข้าจาก shell (`env.shellEnv.enabled: true`)
    3. หรือเพิ่มลงในบล็อก `env` ของ config (ใช้เฉพาะเมื่อไม่มี)

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
  <Accordion title="ฉันจะเริ่มการสนทนาใหม่ได้อย่างไร?">
    ส่ง `/new` หรือ `/reset` เป็นข้อความเดี่ยว ดู [การจัดการเซสชัน](/th/concepts/session)
  </Accordion>

  <Accordion title="เซสชันจะ reset โดยอัตโนมัติหรือไม่ถ้าฉันไม่เคยส่ง /new?">
    เซสชันสามารถหมดอายุหลังจาก `session.idleMinutes` แต่สิ่งนี้ **ปิดใช้งานโดยค่าเริ่มต้น** (ค่าเริ่มต้น **0**)
    ตั้งค่าเป็นค่าบวกเพื่อเปิดใช้การหมดอายุเมื่อไม่ใช้งาน เมื่อเปิดใช้แล้ว ข้อความ **ถัดไป**
    หลังช่วงเวลาที่ไม่ใช้งานจะเริ่ม session id ใหม่สำหรับ chat key นั้น
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
    มี ผ่าน **การ routing หลายเอเจนต์** และ **sub-agents** คุณสามารถสร้างเอเจนต์ coordinator หนึ่งตัว
    และเอเจนต์ worker หลายตัวพร้อม workspace และโมเดลของตัวเอง

    อย่างไรก็ตาม สิ่งนี้เหมาะจะมองว่าเป็น **การทดลองสนุก ๆ** มากกว่า มันใช้ token มากและมัก
    มีประสิทธิภาพน้อยกว่าการใช้บอทหนึ่งตัวพร้อมเซสชันแยกกัน โมเดลทั่วไปที่เรา
    จินตนาการไว้คือบอทหนึ่งตัวที่คุณคุยด้วย พร้อมเซสชันต่าง ๆ สำหรับงานขนาน บอทนั้น
    ยังสามารถ spawn sub-agents เมื่อจำเป็นได้ด้วย

    เอกสาร: [การ routing หลายเอเจนต์](/th/concepts/multi-agent), [Sub-agents](/th/tools/subagents), [CLI เอเจนต์](/th/cli/agents).

  </Accordion>

  <Accordion title="ทำไม context จึงถูกตัดกลางงาน? ฉันจะป้องกันได้อย่างไร?">
    context ของเซสชันถูกจำกัดด้วยหน้าต่างของโมเดล แชตยาว output ของเครื่องมือขนาดใหญ่ หรือไฟล์จำนวนมาก
    อาจกระตุ้น Compaction หรือการตัดทอน

    สิ่งที่ช่วยได้:

    - ขอให้บอทสรุปสถานะปัจจุบันและเขียนลงไฟล์
    - ใช้ `/compact` ก่อนงานยาว และ `/new` เมื่อเปลี่ยนหัวข้อ
    - เก็บ context สำคัญไว้ใน workspace และขอให้บอทอ่านกลับ
    - ใช้ sub-agents สำหรับงานยาวหรืองานขนาน เพื่อให้แชตหลักเล็กลง
    - เลือกโมเดลที่มี context window ใหญ่ขึ้นถ้าเกิดขึ้นบ่อย

  </Accordion>

  <Accordion title="ฉันจะ reset OpenClaw ทั้งหมดแต่ยังคงติดตั้งไว้ได้อย่างไร?">
    ใช้คำสั่ง reset:

    ```bash
    openclaw reset
    ```

    reset ทั้งหมดแบบ non-interactive:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    จากนั้นเรียกใช้ setup อีกครั้ง:

    ```bash
    openclaw onboard --install-daemon
    ```

    หมายเหตุ:

    - Onboarding ยังเสนอ **Reset** หากพบ config ที่มีอยู่ ดู [Onboarding (CLI)](/th/start/wizard)
    - ถ้าคุณใช้ profiles (`--profile` / `OPENCLAW_PROFILE`) ให้ reset state dir แต่ละรายการ (ค่าเริ่มต้นคือ `~/.openclaw-<profile>`)
    - Dev reset: `openclaw gateway --dev --reset` (เฉพาะ dev; ล้าง dev config + credentials + sessions + workspace)

  </Accordion>

  <Accordion title='ฉันได้รับข้อผิดพลาด "context too large" - ฉันจะ reset หรือ compact ได้อย่างไร?'>
    ใช้อย่างใดอย่างหนึ่งต่อไปนี้:

    - **Compact** (คงการสนทนาไว้แต่สรุป turn เก่า):

      ```
      /compact
      ```

      หรือ `/compact <instructions>` เพื่อกำกับสรุป

    - **Reset** (session ID ใหม่สำหรับ chat key เดิม):

      ```
      /new
      /reset
      ```

    ถ้ายังเกิดขึ้นต่อไป:

    - เปิดใช้หรือปรับแต่ง **session pruning** (`agents.defaults.contextPruning`) เพื่อตัด output เครื่องมือเก่า
    - ใช้โมเดลที่มี context window ใหญ่ขึ้น

    เอกสาร: [Compaction](/th/concepts/compaction), [การตัดแต่งเซสชัน](/th/concepts/session-pruning), [การจัดการเซสชัน](/th/concepts/session).

  </Accordion>

  <Accordion title='ทำไมฉันจึงเห็น "LLM request rejected: messages.content.tool_use.input field required"?'>
    นี่เป็นข้อผิดพลาดการตรวจสอบจาก provider: โมเดลปล่อยบล็อก `tool_use` โดยไม่มี
    `input` ที่จำเป็น โดยปกติหมายความว่าประวัติเซสชันล้าสมัยหรือเสียหาย (มักเกิดหลัง thread ยาว
    หรือการเปลี่ยนแปลงเครื่องมือ/schema)

    วิธีแก้: เริ่มเซสชันใหม่ด้วย `/new` (ข้อความเดี่ยว)

  </Accordion>

  <Accordion title="ทำไมฉันจึงได้รับข้อความ heartbeat ทุก 30 นาที?">
    Heartbeat ทำงานทุก **30m** โดยค่าเริ่มต้น (**1h** เมื่อใช้การ auth แบบ OAuth) ปรับแต่งหรือปิดใช้งานได้:

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

    หากมี `HEARTBEAT.md` อยู่แต่แทบจะว่างเปล่า (มีเพียงบรรทัดว่าง,
    คอมเมนต์ Markdown/HTML, หัวข้อ Markdown เช่น `# Heading`, ตัวกำหนดขอบเขต fence,
    หรือ stub เช็กลิสต์ว่าง) OpenClaw จะข้ามการรัน Heartbeat เพื่อประหยัดการเรียก API
    หากไฟล์หายไป Heartbeat จะยังคงรัน และโมเดลจะตัดสินใจว่าจะทำอะไร

    การ override ราย agent ใช้ `agents.list[].heartbeat` เอกสาร: [Heartbeat](/th/gateway/heartbeat).

  </Accordion>

  <Accordion title='ฉันต้องเพิ่ม "บัญชีบอต" เข้าไปในกลุ่ม WhatsApp หรือไม่?'>
    ไม่ต้อง OpenClaw รันบน **บัญชีของคุณเอง** ดังนั้นหากคุณอยู่ในกลุ่ม OpenClaw ก็จะมองเห็นได้
    โดยค่าเริ่มต้น การตอบกลับในกลุ่มจะถูกบล็อกไว้จนกว่าคุณจะอนุญาตผู้ส่ง (`groupPolicy: "allowlist"`)

    หากคุณต้องการให้มีเพียง **คุณ** เท่านั้นที่สามารถทริกเกอร์การตอบกลับในกลุ่มได้:

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
    ตัวเลือกที่ 1 (เร็วที่สุด): tail logs แล้วส่งข้อความทดสอบในกลุ่ม:

    ```bash
    openclaw logs --follow --json
    ```

    มองหา `chatId` (หรือ `from`) ที่ลงท้ายด้วย `@g.us` เช่น:
    `1234567890-1234567890@g.us`.

    ตัวเลือกที่ 2 (หากกำหนดค่า/allowlist แล้ว): แสดงรายการกลุ่มจาก config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    เอกสาร: [WhatsApp](/th/channels/whatsapp), [Directory](/th/cli/directory), [Logs](/th/cli/logs).

  </Accordion>

  <Accordion title="ทำไม OpenClaw จึงไม่ตอบกลับในกลุ่ม?">
    สาเหตุที่พบบ่อยมีสองอย่าง:

    - เปิด mention gating อยู่ (ค่าเริ่มต้น) คุณต้อง @mention บอต (หรือ match `mentionPatterns`)
    - คุณกำหนดค่า `channels.whatsapp.groups` โดยไม่มี `"*"` และกลุ่มนั้นไม่ได้อยู่ใน allowlist

    ดู [กลุ่ม](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages).

  </Accordion>

  <Accordion title="กลุ่ม/thread ใช้ context ร่วมกับ DM หรือไม่?">
    โดยค่าเริ่มต้น แชตโดยตรงจะถูกรวมเข้ากับเซสชันหลัก กลุ่ม/ช่องทางจะมี session key ของตัวเอง และหัวข้อ Telegram / thread ของ Discord จะแยกเป็นคนละเซสชัน ดู [กลุ่ม](/th/channels/groups) และ [ข้อความกลุ่ม](/th/channels/group-messages).
  </Accordion>

  <Accordion title="ฉันสามารถสร้าง workspace และ agent ได้กี่รายการ?">
    ไม่มีขีดจำกัดตายตัว หลายสิบรายการ (หรือแม้แต่หลายร้อยรายการ) ก็ใช้ได้ แต่ควรระวัง:

    - **การเติบโตของดิสก์:** session + transcript อยู่ใต้ `~/.openclaw/agents/<agentId>/sessions/`
    - **ค่าใช้จ่าย token:** agent ที่มากขึ้นหมายถึงการใช้งานโมเดลพร้อมกันมากขึ้น
    - **ภาระงานปฏิบัติการ:** auth profile, workspace และ channel routing แยกตาม agent

    เคล็ดลับ:

    - คงไว้หนึ่ง workspace ที่ **active** ต่อ agent (`agents.defaults.workspace`)
    - ล้าง session เก่า (ลบ JSONL หรือรายการใน store) หากดิสก์โตขึ้น
    - ใช้ `openclaw doctor` เพื่อตรวจหา workspace ที่หลงเหลือและ profile ที่ไม่ตรงกัน

  </Accordion>

  <Accordion title="ฉันสามารถรันหลายบอตหรือหลายแชตพร้อมกันได้หรือไม่ (Slack) และควรตั้งค่าอย่างไร?">
    ได้ ใช้ **Multi-Agent Routing** เพื่อรัน agent หลายตัวที่แยกจากกัน และ route ข้อความขาเข้าตาม
    channel/account/peer Slack รองรับในฐานะ channel และสามารถผูกกับ agent เฉพาะได้

    การเข้าถึงเบราว์เซอร์มีพลังมาก แต่ไม่ใช่ "ทำอะไรก็ได้เหมือนมนุษย์" - anti-bot, CAPTCHA และ MFA
    ยังสามารถบล็อก automation ได้ เพื่อการควบคุมเบราว์เซอร์ที่เชื่อถือได้มากที่สุด ให้ใช้ Chrome MCP ภายในเครื่องบน host
    หรือใช้ CDP บนเครื่องที่รันเบราว์เซอร์จริง

    การตั้งค่าที่แนะนำ:

    - Gateway host ที่เปิดตลอดเวลา (VPS/Mac mini)
    - หนึ่ง agent ต่อหนึ่งบทบาท (bindings)
    - ผูกช่องทาง Slack กับ agent เหล่านั้น
    - เบราว์เซอร์ภายในเครื่องผ่าน Chrome MCP หรือ node เมื่อจำเป็น

    เอกสาร: [Multi-Agent Routing](/th/concepts/multi-agent), [Slack](/th/channels/slack),
    [เบราว์เซอร์](/th/tools/browser), [Node](/th/nodes).

  </Accordion>
</AccordionGroup>

## โมเดล, failover และ auth profile

ถาม-ตอบเกี่ยวกับโมเดล — ค่าเริ่มต้น, การเลือก, alias, การสลับ, failover, auth profile —
อยู่ใน [FAQ โมเดล](/th/help/faq-models).

## Gateway: port, "already running" และ remote mode

<AccordionGroup>
  <Accordion title="Gateway ใช้ port ใด?">
    `gateway.port` ควบคุม port เดียวแบบ multiplexed สำหรับ WebSocket + HTTP (Control UI, hook และอื่น ๆ)

    ลำดับความสำคัญ:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status จึงบอกว่า "Runtime: running" แต่ "Connectivity probe: failed"?'>
    เพราะ "running" เป็นมุมมองของ **supervisor** (launchd/systemd/schtasks) ส่วน connectivity probe คือ CLI ที่เชื่อมต่อกับ gateway WebSocket จริง

    ใช้ `openclaw gateway status` และเชื่อถือบรรทัดเหล่านี้:

    - `Probe target:` (URL ที่ probe ใช้จริง)
    - `Listening:` (สิ่งที่ bind อยู่บน port จริง)
    - `Last gateway error:` (สาเหตุหลักที่พบบ่อยเมื่อ process ยังทำงานอยู่แต่ port ไม่ได้ listen)

  </Accordion>

  <Accordion title='ทำไม openclaw gateway status จึงแสดง "Config (cli)" และ "Config (service)" ต่างกัน?'>
    คุณกำลังแก้ไฟล์ config หนึ่งไฟล์ ขณะที่ service กำลังรันอีกไฟล์หนึ่ง (มักเป็น `--profile` / `OPENCLAW_STATE_DIR` ที่ไม่ตรงกัน)

    วิธีแก้:

    ```bash
    openclaw gateway install --force
    ```

    รันคำสั่งนั้นจาก `--profile` / environment เดียวกับที่คุณต้องการให้ service ใช้

  </Accordion>

  <Accordion title='"another gateway instance is already listening" หมายความว่าอะไร?'>
    OpenClaw บังคับใช้ runtime lock โดย bind WebSocket listener ทันทีเมื่อเริ่มต้น (ค่าเริ่มต้น `ws://127.0.0.1:18789`) หาก bind ล้มเหลวด้วย `EADDRINUSE` จะ throw `GatewayLockError` ซึ่งระบุว่ามี instance อื่น listen อยู่แล้ว

    วิธีแก้: หยุด instance อื่น, ปล่อย port, หรือรันด้วย `openclaw gateway --port <port>`

  </Accordion>

  <Accordion title="ฉันจะรัน OpenClaw ใน remote mode (client เชื่อมต่อไปยัง Gateway ที่อื่น) ได้อย่างไร?">
    ตั้งค่า `gateway.mode: "remote"` และชี้ไปยัง URL WebSocket ระยะไกล โดยเลือกใช้ข้อมูลรับรอง remote แบบ shared-secret ได้:

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

    - `openclaw gateway` จะเริ่มทำงานเฉพาะเมื่อ `gateway.mode` เป็น `local` (หรือคุณส่ง override flag)
    - แอป macOS จะเฝ้าดูไฟล์ config และสลับ mode แบบ live เมื่อค่าเหล่านี้เปลี่ยน
    - `gateway.remote.token` / `.password` เป็นข้อมูลรับรอง remote ฝั่ง client เท่านั้น; ไม่ได้เปิดใช้ auth ของ local gateway ด้วยตัวเอง

  </Accordion>

  <Accordion title='Control UI แจ้งว่า "unauthorized" (หรือเชื่อมต่อใหม่ซ้ำ ๆ) ควรทำอย่างไร?'>
    เส้นทาง auth ของ gateway และวิธี auth ของ UI ไม่ตรงกัน

    ข้อเท็จจริง (จากโค้ด):

    - Control UI เก็บ token ไว้ใน `sessionStorage` สำหรับ session ของแท็บเบราว์เซอร์ปัจจุบันและ URL gateway ที่เลือก ดังนั้นการ refresh ในแท็บเดิมยังทำงานต่อได้โดยไม่ต้องคืน persistence ของ token ใน localStorage ระยะยาว
    - เมื่อเกิด `AUTH_TOKEN_MISMATCH` client ที่เชื่อถือได้สามารถลองใหม่แบบจำกัดหนึ่งครั้งด้วย device token ที่ cache ไว้ เมื่อ gateway ส่ง retry hint กลับมา (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)
    - การลองใหม่ด้วย cached-token นั้นตอนนี้ใช้ cached approved scopes ที่เก็บไว้กับ device token ซ้ำ ผู้เรียกที่ระบุ `deviceToken` / `scopes` อย่างชัดเจนยังคงใช้ชุด scope ที่ร้องขอของตนเอง แทนที่จะสืบทอด cached scopes
    - นอกเส้นทาง retry นั้น ลำดับความสำคัญของ connect auth คือ shared token/password ที่ระบุชัดเจนก่อน จากนั้น `deviceToken` ที่ระบุชัดเจน จากนั้น device token ที่จัดเก็บไว้ จากนั้น bootstrap token
    - setup-code bootstrap ในตัวเป็นแบบ node-only หลังอนุมัติแล้ว จะคืน node device token พร้อม `scopes: []` และไม่คืน operator token ที่ส่งต่อให้

    วิธีแก้:

    - เร็วที่สุด: `openclaw dashboard` (พิมพ์ + คัดลอก URL dashboard, พยายามเปิด; แสดง hint SSH หากเป็น headless)
    - หากคุณยังไม่มี token: `openclaw doctor --generate-gateway-token`
    - หากเป็น remote ให้ tunnel ก่อน: `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/`
    - โหมด shared-secret: ตั้งค่า `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` แล้ววาง secret ที่ตรงกันใน settings ของ Control UI
    - โหมด Tailscale Serve: ตรวจให้แน่ใจว่าเปิดใช้ `gateway.auth.allowTailscale` และคุณกำลังเปิด Serve URL ไม่ใช่ URL loopback/tailnet ดิบที่ข้าม identity headers ของ Tailscale
    - โหมด trusted-proxy: ตรวจให้แน่ใจว่าคุณเข้ามาผ่าน identity-aware proxy ที่กำหนดค่าไว้ ไม่ใช่ URL gateway ดิบ proxy แบบ same-host loopback ต้องมี `gateway.auth.trustedProxy.allowLoopback = true` ด้วย
    - หากยัง mismatch หลัง retry หนึ่งครั้ง ให้ rotate/re-approve device token ที่จับคู่:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - หากคำสั่ง rotate นั้นบอกว่าถูกปฏิเสธ ให้ตรวจสองเรื่อง:
      - session ของ paired-device สามารถ rotate ได้เฉพาะ device **ของตัวเอง** เว้นแต่จะมี `operator.admin` ด้วย
      - ค่า `--scope` ที่ระบุชัดเจนต้องไม่เกิน operator scopes ปัจจุบันของผู้เรียก
    - ยังติดอยู่หรือไม่? รัน `openclaw status --all` และทำตาม [การแก้ไขปัญหา](/th/gateway/troubleshooting) ดู [Dashboard](/th/web/dashboard) สำหรับรายละเอียด auth

  </Accordion>

  <Accordion title="ฉันตั้งค่า gateway.bind เป็น tailnet แต่ bind ไม่ได้และไม่มีอะไร listen อยู่">
    การ bind แบบ `tailnet` จะเลือก IP ของ Tailscale จาก network interface ของคุณ (100.64.0.0/10) หากเครื่องไม่ได้อยู่บน Tailscale (หรือ interface down) ก็จะไม่มีอะไรให้ bind

    วิธีแก้:

    - เริ่ม Tailscale บน host นั้น (เพื่อให้มี address 100.x), หรือ
    - เปลี่ยนเป็น `gateway.bind: "loopback"` / `"lan"`

    หมายเหตุ: `tailnet` เป็นค่าแบบชัดเจน `auto` จะเลือก loopback ก่อน; ใช้ `gateway.bind: "tailnet"` เมื่อคุณต้องการ bind เฉพาะ tailnet เท่านั้น

  </Accordion>

  <Accordion title="ฉันสามารถรัน Gateway หลายตัวบน host เดียวกันได้หรือไม่?">
    โดยปกติไม่ได้ - Gateway เดียวสามารถรันช่องทางส่งข้อความและ agent ได้หลายตัว ใช้ Gateway หลายตัวเฉพาะเมื่อคุณต้องการ redundancy (เช่น rescue bot) หรือการแยกอย่างเข้มงวด

    ได้ แต่คุณต้องแยก:

    - `OPENCLAW_CONFIG_PATH` (config แยกตาม instance)
    - `OPENCLAW_STATE_DIR` (state แยกตาม instance)
    - `agents.defaults.workspace` (การแยก workspace)
    - `gateway.port` (port ไม่ซ้ำกัน)

    การตั้งค่าเร็ว (แนะนำ):

    - ใช้ `openclaw --profile <name> ...` ต่อ instance (สร้าง `~/.openclaw-<name>` อัตโนมัติ)
    - ตั้งค่า `gateway.port` ที่ไม่ซ้ำกันใน config ของแต่ละ profile (หรือส่ง `--port` สำหรับการรันด้วยตนเอง)
    - ติดตั้ง service แยกตาม profile: `openclaw --profile <name> gateway install`

    Profile ยังเติม suffix ให้ชื่อ service (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`)
    คู่มือฉบับเต็ม: [หลาย gateway](/th/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008 หมายความว่าอะไร?'>
    Gateway เป็น **WebSocket server** และคาดว่าข้อความแรกสุดจะต้อง
    เป็น frame `connect` หากได้รับอย่างอื่น จะปิดการเชื่อมต่อ
    ด้วย **code 1008** (policy violation)

    สาเหตุที่พบบ่อย:

    - คุณเปิด URL **HTTP** ในเบราว์เซอร์ (`http://...`) แทนที่จะใช้ WS client
    - คุณใช้ port หรือ path ผิด
    - proxy หรือ tunnel ตัด auth headers ออก หรือส่งคำขอที่ไม่ใช่ Gateway

    วิธีแก้เร็ว:

    1. ใช้ URL WS: `ws://<host>:18789` (หรือ `wss://...` หากเป็น HTTPS)
    2. อย่าเปิด port WS ในแท็บเบราว์เซอร์ปกติ
    3. หากเปิด auth ให้ใส่ token/password ใน frame `connect`

    หากคุณใช้ CLI หรือ TUI URL ควรมีลักษณะดังนี้:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    รายละเอียด protocol: [protocol ของ Gateway](/th/gateway/protocol).

  </Accordion>
</AccordionGroup>

## การ logging และการ debugging

<AccordionGroup>
  <Accordion title="log อยู่ที่ไหน?">
    ไฟล์ log (แบบมีโครงสร้าง):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    คุณสามารถตั้งค่าพาธที่คงที่ผ่าน `logging.file` ได้ ระดับ log ของไฟล์ควบคุมโดย `logging.level` ความละเอียดของ console ควบคุมโดย `--verbose` และ `logging.consoleLevel`

    วิธี tail log ที่เร็วที่สุด:

    ```bash
    openclaw logs --follow
    ```

    log ของ service/supervisor (เมื่อ gateway ทำงานผ่าน launchd/systemd):

    - macOS launchd stdout: `~/Library/Logs/openclaw/gateway.log` (โปรไฟล์ใช้ `gateway-<profile>.log`; stderr จะถูกระงับ)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    ดูเพิ่มเติมที่ [การแก้ไขปัญหา](/th/gateway/troubleshooting)

  </Accordion>

  <Accordion title="ฉันจะเริ่ม/หยุด/รีสตาร์ท service ของ Gateway ได้อย่างไร">
    ใช้ตัวช่วยของ gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณรัน gateway ด้วยตนเอง `openclaw gateway --force` สามารถยึด port กลับมาได้ ดู [Gateway](/th/gateway)

  </Accordion>

  <Accordion title="ฉันปิด terminal บน Windows ไปแล้ว - จะรีสตาร์ท OpenClaw ได้อย่างไร">
    มี **สามโหมดการติดตั้งบน Windows**:

    **1) การตั้งค่า Windows Hub แบบ local:** แอป native จัดการ WSL Gateway ที่แอปเป็นเจ้าของแบบ local

    เปิด **OpenClaw Companion** จาก Start menu หรือ tray จากนั้นใช้
    **Gateway Setup** หรือแท็บ Connections

    **2) WSL2 Gateway แบบ manual:** Gateway ทำงานภายใน Linux

    เปิด PowerShell, เข้า WSL, แล้วรีสตาร์ท:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณไม่เคยติดตั้ง service ให้เริ่มแบบ foreground:

    ```bash
    openclaw gateway run
    ```

    **3) Native Windows CLI/Gateway:** Gateway ทำงานโดยตรงใน Windows

    เปิด PowerShell แล้วรัน:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    หากคุณรันด้วยตนเอง (ไม่มี service) ให้ใช้:

    ```powershell
    openclaw gateway run
    ```

    เอกสาร: [Windows](/th/platforms/windows), [runbook ของ Gateway service](/th/gateway)

  </Accordion>

  <Accordion title="Gateway ทำงานแล้วแต่คำตอบไม่มาถึงเลย ควรตรวจสอบอะไร">
    เริ่มด้วยการกวาดตรวจ health อย่างรวดเร็ว:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    สาเหตุที่พบบ่อย:

    - auth ของ model ไม่ได้โหลดบน **gateway host** (ตรวจสอบ `models status`)
    - การ pairing/allowlist ของ channel บล็อกคำตอบ (ตรวจสอบ config ของ channel + logs)
    - WebChat/Dashboard เปิดอยู่โดยไม่มี token ที่ถูกต้อง

    หากคุณอยู่ระยะไกล ให้ยืนยันว่า tunnel/การเชื่อมต่อ Tailscale ทำงานอยู่ และ
    Gateway WebSocket เข้าถึงได้

    เอกสาร: [Channels](/th/channels), [การแก้ไขปัญหา](/th/gateway/troubleshooting), [การเข้าถึงระยะไกล](/th/gateway/remote)

  </Accordion>

  <Accordion title='"ตัดการเชื่อมต่อจาก gateway: ไม่มีเหตุผล" - แล้วทำอย่างไรต่อ'>
    โดยปกติหมายความว่า UI สูญเสียการเชื่อมต่อ WebSocket ตรวจสอบ:

    1. Gateway ทำงานอยู่หรือไม่ `openclaw gateway status`
    2. Gateway มีสถานะ healthy หรือไม่ `openclaw status`
    3. UI มี token ที่ถูกต้องหรือไม่ `openclaw dashboard`
    4. หากใช้งานระยะไกล ลิงก์ tunnel/Tailscale ทำงานอยู่หรือไม่

    จากนั้น tail logs:

    ```bash
    openclaw logs --follow
    ```

    เอกสาร: [Dashboard](/th/web/dashboard), [การเข้าถึงระยะไกล](/th/gateway/remote), [การแก้ไขปัญหา](/th/gateway/troubleshooting)

  </Accordion>

  <Accordion title="Telegram setMyCommands ล้มเหลว ควรตรวจสอบอะไร">
    เริ่มด้วย logs และสถานะ channel:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    จากนั้นจับคู่ error:

    - `BOT_COMMANDS_TOO_MUCH`: เมนู Telegram มีรายการมากเกินไป OpenClaw ตัดให้ถึงขีดจำกัดของ Telegram แล้วและลองใหม่ด้วยคำสั่งที่น้อยลง แต่บางรายการในเมนูยังต้องถูกลบออก ลดคำสั่งจาก plugin/skill/custom หรือปิด `channels.telegram.commands.native` หากคุณไม่ต้องการเมนู
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, หรือ error ด้านเครือข่ายที่คล้ายกัน: หากคุณอยู่บน VPS หรืออยู่หลัง proxy ให้ยืนยันว่าอนุญาต outbound HTTPS และ DNS ใช้งานได้สำหรับ `api.telegram.org`

    หาก Gateway อยู่ระยะไกล ให้ตรวจสอบว่าคุณกำลังดู logs บน Gateway host

    เอกสาร: [Telegram](/th/channels/telegram), [การแก้ไขปัญหา Channel](/th/channels/troubleshooting)

  </Accordion>

  <Accordion title="TUI ไม่แสดง output ควรตรวจสอบอะไร">
    ก่อนอื่นให้ยืนยันว่า Gateway เข้าถึงได้และ agent รันได้:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    ใน TUI ให้ใช้ `/status` เพื่อดูสถานะปัจจุบัน หากคุณคาดว่าจะมีคำตอบใน chat
    channel ให้ตรวจสอบว่าเปิดการส่งไว้แล้ว (`/deliver on`)

    เอกสาร: [TUI](/th/web/tui), [คำสั่ง slash](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="ฉันจะหยุดแล้วเริ่ม Gateway ใหม่ทั้งหมดได้อย่างไร">
    หากคุณติดตั้ง service แล้ว:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    คำสั่งนี้จะหยุด/เริ่ม **supervised service** (launchd บน macOS, systemd บน Linux)
    ใช้เมื่อ Gateway ทำงานอยู่เบื้องหลังเป็น daemon

    หากคุณกำลังรันใน foreground ให้หยุดด้วย Ctrl-C แล้วรัน:

    ```bash
    openclaw gateway run
    ```

    เอกสาร: [runbook ของ Gateway service](/th/gateway)

  </Accordion>

  <Accordion title="อธิบายแบบง่าย: openclaw gateway restart เทียบกับ openclaw gateway">
    - `openclaw gateway restart`: รีสตาร์ท **background service** (launchd/systemd)
    - `openclaw gateway`: รัน gateway **ใน foreground** สำหรับ terminal session นี้

    หากคุณติดตั้ง service แล้ว ให้ใช้คำสั่ง gateway ใช้ `openclaw gateway` เมื่อ
    คุณต้องการรันแบบครั้งเดียวใน foreground

  </Accordion>

  <Accordion title="วิธีเร็วที่สุดในการดูรายละเอียดเพิ่มเมื่อมีบางอย่างล้มเหลว">
    เริ่ม Gateway ด้วย `--verbose` เพื่อดูรายละเอียดใน console มากขึ้น จากนั้นตรวจสอบไฟล์ log สำหรับ auth ของ channel, การ routing ของ model, และ RPC errors
  </Accordion>
</AccordionGroup>

## สื่อและไฟล์แนบ

<AccordionGroup>
  <Accordion title="Skill ของฉันสร้างรูปภาพ/PDF แต่ไม่มีอะไรถูกส่ง">
    ไฟล์แนบขาออกจาก agent ต้องใช้ฟิลด์สื่อแบบมีโครงสร้าง เช่น `media`, `mediaUrl`, `path`, หรือ `filePath` ดู [การตั้งค่า OpenClaw assistant](/th/start/openclaw) และ [Agent send](/th/tools/agent-send)

    การส่งด้วย CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    ตรวจสอบเพิ่มเติม:

    - target channel รองรับสื่อขาออกและไม่ได้ถูกบล็อกโดย allowlists
    - ไฟล์อยู่ภายในขีดจำกัดขนาดของ provider (รูปภาพจะถูกปรับขนาดเป็นสูงสุด 2048px)
    - `tools.fs.workspaceOnly=true` จำกัดการส่งจากพาธ local ให้อยู่ใน workspace, temp/media-store, และไฟล์ที่ผ่านการตรวจสอบโดย sandbox
    - `tools.fs.workspaceOnly=false` ทำให้การส่งสื่อ local แบบมีโครงสร้างใช้ไฟล์ host-local ที่ agent อ่านได้อยู่แล้ว แต่เฉพาะสื่อรวมถึงชนิดเอกสารที่ปลอดภัย (รูปภาพ, เสียง, วิดีโอ, PDF, เอกสาร Office, และเอกสารข้อความที่ผ่านการตรวจสอบ เช่น Markdown/MD, TXT, JSON, YAML, และ YML) นี่ไม่ใช่ตัวสแกน secret: `secret.txt` หรือ `config.json` ที่ agent อ่านได้สามารถแนบได้เมื่อ extension และการตรวจสอบเนื้อหาตรงกัน เก็บไฟล์ที่อ่อนไหวไว้นอกพาธที่ agent อ่านได้ หรือคง `tools.fs.workspaceOnly=true` ไว้เพื่อการส่งจากพาธ local ที่เข้มงวดกว่า

    ดู [รูปภาพ](/th/nodes/images)

  </Accordion>
</AccordionGroup>

## ความปลอดภัยและการควบคุมการเข้าถึง

<AccordionGroup>
  <Accordion title="การเปิดให้ OpenClaw รับ DM ขาเข้าปลอดภัยหรือไม่">
    ให้ถือว่า DM ขาเข้าเป็น input ที่ไม่น่าเชื่อถือ ค่าเริ่มต้นถูกออกแบบมาเพื่อลดความเสี่ยง:

    - พฤติกรรมเริ่มต้นบน channel ที่รองรับ DM คือ **pairing**:
      - ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing; bot จะไม่ประมวลผลข้อความของพวกเขา
      - อนุมัติด้วย: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - คำขอที่รอดำเนินการจำกัดไว้ที่ **3 ต่อ channel**; ตรวจสอบ `openclaw pairing list --channel <channel> [--account <id>]` หากรหัสไม่มาถึง
    - การเปิด DM ต่อสาธารณะต้อง opt-in อย่างชัดเจน (`dmPolicy: "open"` และ allowlist `"*"`)

    รัน `openclaw doctor` เพื่อแสดงนโยบาย DM ที่มีความเสี่ยง

  </Accordion>

  <Accordion title="prompt injection เป็นข้อกังวลเฉพาะ bot สาธารณะหรือไม่">
    ไม่ใช่ Prompt injection เกี่ยวกับ **เนื้อหาที่ไม่น่าเชื่อถือ** ไม่ใช่แค่ว่าใครสามารถ DM หา bot ได้
    หาก assistant ของคุณอ่านเนื้อหาภายนอก (web search/fetch, browser pages, emails,
    docs, attachments, pasted logs) เนื้อหานั้นอาจมีคำสั่งที่พยายาม
    hijack model ได้ สิ่งนี้เกิดขึ้นได้แม้ว่า **คุณจะเป็นผู้ส่งเพียงคนเดียว**

    ความเสี่ยงที่ใหญ่ที่สุดคือเมื่อเปิดใช้งาน tools: model อาจถูกหลอกให้
    exfiltrate context หรือเรียก tools แทนคุณ ลด blast radius โดย:

    - ใช้ agent แบบ "reader" ที่ read-only หรือปิด tool เพื่อสรุปเนื้อหาที่ไม่น่าเชื่อถือ
    - ปิด `web_search` / `web_fetch` / `browser` สำหรับ agent ที่เปิดใช้ tools
    - ถือว่าข้อความที่ถอดรหัสจากไฟล์/เอกสารเป็นสิ่งที่ไม่น่าเชื่อถือด้วย: OpenResponses
      `input_file` และการแยก media-attachment ต่างก็ห่อข้อความที่แยกออกมาด้วย
      marker ขอบเขต external-content อย่างชัดเจนแทนการส่งข้อความไฟล์ดิบ
    - ใช้ sandboxing และ tool allowlists ที่เข้มงวด

    รายละเอียด: [ความปลอดภัย](/th/gateway/security)

  </Accordion>

  <Accordion title="OpenClaw ปลอดภัยน้อยลงหรือไม่เพราะใช้ TypeScript/Node แทน Rust/WASM">
    ภาษาและ runtime มีผล แต่ไม่ใช่ความเสี่ยงหลักสำหรับ agent ส่วนบุคคล
    ความเสี่ยงเชิงปฏิบัติของ OpenClaw คือการเปิดเผย gateway, ใครส่งข้อความหา
    bot ได้, prompt injection, ขอบเขตของ tool, การจัดการ credential, การเข้าถึง browser, การเข้าถึง exec
    และความน่าเชื่อถือของ Skill หรือ Plugin จากบุคคลที่สาม

    Rust และ WASM สามารถให้การแยกที่แข็งแรงกว่าสำหรับโค้ดบางประเภท แต่
    ไม่ได้แก้ prompt injection, allowlists ที่ไม่ดี, การเปิด gateway สาธารณะ,
    tools ที่กว้างเกินไป, หรือ browser profile ที่ล็อกอินเข้า
    บัญชีอ่อนไหวอยู่แล้ว ให้ถือสิ่งเหล่านี้เป็นการควบคุมหลัก:

    - ทำให้ Gateway เป็นส่วนตัวหรือมีการยืนยันตัวตน
    - ใช้ pairing และ allowlists สำหรับ DM และกลุ่ม
    - ปฏิเสธหรือ sandbox tools ที่เสี่ยงสำหรับ input ที่ไม่น่าเชื่อถือ
    - ติดตั้งเฉพาะ Plugins และ Skills ที่เชื่อถือได้
    - รัน `openclaw security audit --deep` หลังเปลี่ยน config

    รายละเอียด: [ความปลอดภัย](/th/gateway/security), [Sandboxing](/th/gateway/sandboxing)

  </Accordion>

  <Accordion title="ฉันเห็นรายงานเกี่ยวกับ OpenClaw instances ที่ถูกเปิดเผย ควรตรวจสอบอะไร">
    ก่อนอื่นให้ตรวจสอบ deployment จริงของคุณ:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    baseline ที่ปลอดภัยกว่าคือ:

    - Gateway bind กับ `loopback` หรือเปิดเผยเฉพาะผ่านการเข้าถึงส่วนตัวที่ยืนยันตัวตนแล้ว
      เช่น tailnet, SSH tunnel, token/password auth, หรือ trusted proxy ที่กำหนดค่าอย่างถูกต้อง
    - DM อยู่ในโหมด `pairing` หรือ `allowlist`
    - กลุ่มอยู่ใน allowlist และถูก gate ด้วย mention เว้นแต่สมาชิกทุกคนจะเชื่อถือได้
    - tools ความเสี่ยงสูง (`exec`, `browser`, `gateway`, `cron`) ถูกปฏิเสธหรือจำกัดขอบเขตอย่างแน่นหนา
      สำหรับ agent ที่อ่านเนื้อหาที่ไม่น่าเชื่อถือ
    - เปิดใช้ sandboxing เมื่อการเรียกใช้ tool ต้องการ blast radius ที่เล็กลง

    public binds ที่ไม่มี auth, DM/กลุ่มแบบเปิดพร้อม tools, และการควบคุม browser
    ที่ถูกเปิดเผยคือ findings ที่ควรแก้ก่อน รายละเอียด:
    [checklist การตรวจสอบความปลอดภัย](/th/gateway/security#security-audit-checklist)

  </Accordion>

  <Accordion title="ClawHub skills และ Plugins จากบุคคลที่สามปลอดภัยสำหรับการติดตั้งหรือไม่">
    ให้ถือว่า Skills และ Plugins จากบุคคลที่สามเป็นโค้ดที่คุณเลือกจะเชื่อถือ
    หน้า Skills ของ ClawHub แสดงสถานะการสแกนก่อนติดตั้ง แต่การสแกนไม่ใช่
    ขอบเขตความปลอดภัยที่สมบูรณ์ OpenClaw ไม่ได้รันการบล็อกโค้ดอันตรายแบบ local
    ในตัวระหว่าง flow การติดตั้ง/อัปเดต Plugin หรือ Skill; ใช้
    `security.installPolicy` ที่ operator เป็นเจ้าของสำหรับการตัดสินใจ allow/block แบบ local

    รูปแบบที่ปลอดภัยกว่า:

    - เลือกใช้ผู้เขียนที่เชื่อถือได้และเวอร์ชันที่ pin ไว้
    - อ่าน Skill หรือ Plugin ก่อนเปิดใช้งาน
    - จำกัด allowlists ของ Plugin และ Skill ให้แคบ
    - รัน workflows ที่รับ input ที่ไม่น่าเชื่อถือใน sandbox พร้อม tools ขั้นต่ำ
    - หลีกเลี่ยงการให้โค้ดจากบุคคลที่สามเข้าถึง filesystem, exec, browser, หรือ secret แบบกว้างๆ

    รายละเอียด: [Skills](/th/tools/skills), [Plugin](/th/tools/plugin),
    [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="บอตของฉันควรมีอีเมล บัญชี GitHub หรือหมายเลขโทรศัพท์ของตัวเองหรือไม่">
    ใช่ สำหรับการตั้งค่าส่วนใหญ่ การแยกบอตด้วยบัญชีและหมายเลขโทรศัพท์ต่างหาก
    จะลดขอบเขตผลกระทบหากมีบางอย่างผิดพลาด และยังทำให้หมุนเวียน
    ข้อมูลประจำตัวหรือเพิกถอนสิทธิ์เข้าถึงได้ง่ายขึ้นโดยไม่กระทบบัญชีส่วนตัวของคุณ

    เริ่มจากขอบเขตเล็ก ๆ ให้สิทธิ์เข้าถึงเฉพาะเครื่องมือและบัญชีที่คุณต้องใช้จริง แล้วค่อยขยาย
    ภายหลังหากจำเป็น

    เอกสาร: [ความปลอดภัย](/th/gateway/security), [การจับคู่](/th/channels/pairing).

  </Accordion>

  <Accordion title="ฉันให้มันทำงานอัตโนมัติกับข้อความของฉันได้ไหม และปลอดภัยหรือไม่">
    เรา **ไม่** แนะนำให้ให้อิสระเต็มรูปแบบกับข้อความส่วนตัวของคุณ รูปแบบที่ปลอดภัยที่สุดคือ:

    - คงข้อความส่วนตัว (DM) ไว้ใน **โหมดจับคู่** หรือใช้รายการอนุญาตที่เข้มงวด
    - ใช้ **หมายเลขหรือบัญชีแยกต่างหาก** หากคุณต้องการให้มันส่งข้อความแทนคุณ
    - ให้มันร่างข้อความ แล้ว **อนุมัติก่อนส่ง**

    หากคุณต้องการทดลอง ให้ทำบนบัญชีเฉพาะและแยกออกจากบัญชีอื่น ดู
    [ความปลอดภัย](/th/gateway/security).

  </Accordion>

  <Accordion title="ฉันใช้โมเดลที่ถูกกว่าสำหรับงานผู้ช่วยส่วนตัวได้ไหม">
    ได้ **ถ้า** เอเจนต์ใช้แชตอย่างเดียวและอินพุตเชื่อถือได้ ระดับที่เล็กกว่า
    เสี่ยงต่อการถูกยึดคำสั่งได้มากกว่า ดังนั้นให้หลีกเลี่ยงสำหรับเอเจนต์ที่เปิดใช้เครื่องมือ
    หรือเมื่ออ่านข้อความที่ไม่น่าเชื่อถือ หากจำเป็นต้องใช้โมเดลที่เล็กกว่า ให้ล็อก
    เครื่องมือให้แน่นและรันภายใน sandbox ดู [ความปลอดภัย](/th/gateway/security).
  </Accordion>

  <Accordion title="ฉันรัน /start ใน Telegram แต่ไม่ได้รับรหัสจับคู่">
    รหัสจับคู่จะถูกส่ง **เฉพาะ** เมื่อผู้ส่งที่ไม่รู้จักส่งข้อความถึงบอตและ
    เปิดใช้ `dmPolicy: "pairing"` อยู่ `/start` เพียงอย่างเดียวจะไม่สร้างรหัส

    ตรวจสอบคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list telegram
    ```

    หากคุณต้องการเข้าถึงทันที ให้เพิ่ม id ผู้ส่งของคุณในรายการอนุญาต หรือกำหนด `dmPolicy: "open"`
    สำหรับบัญชีนั้น

  </Accordion>

  <Accordion title="WhatsApp: มันจะส่งข้อความถึงผู้ติดต่อของฉันไหม การจับคู่ทำงานอย่างไร">
    ไม่ นโยบาย DM เริ่มต้นของ WhatsApp คือ **การจับคู่** ผู้ส่งที่ไม่รู้จักจะได้รับเพียงรหัสจับคู่ และข้อความของพวกเขาจะ **ไม่ถูกประมวลผล** OpenClaw จะตอบกลับเฉพาะแชตที่ได้รับหรือการส่งที่คุณสั่งอย่างชัดเจนเท่านั้น

    อนุมัติการจับคู่ด้วย:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    แสดงรายการคำขอที่รอดำเนินการ:

    ```bash
    openclaw pairing list whatsapp
    ```

    พรอมป์หมายเลขโทรศัพท์ของตัวช่วยตั้งค่า: ใช้เพื่อตั้งค่า **รายการอนุญาต/เจ้าของ** เพื่อให้ DM ของคุณเองได้รับอนุญาต ไม่ได้ใช้สำหรับการส่งอัตโนมัติ หากคุณรันบนหมายเลข WhatsApp ส่วนตัว ให้ใช้หมายเลขนั้นและเปิดใช้ `channels.whatsapp.selfChatMode`

  </Accordion>
</AccordionGroup>

## คำสั่งแชต การยกเลิกงาน และ "มันไม่ยอมหยุด"

<AccordionGroup>
  <Accordion title="ฉันจะหยุดไม่ให้ข้อความระบบภายในแสดงในแชตได้อย่างไร">
    ข้อความภายในหรือข้อความเครื่องมือส่วนใหญ่จะแสดงเฉพาะเมื่อเปิดใช้ **verbose**, **trace** หรือ **reasoning**
    สำหรับเซสชันนั้น

    แก้ไขในแชตที่คุณเห็นข้อความนั้น:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    หากยังมีข้อความรบกวนอยู่ ให้ตรวจสอบการตั้งค่าเซสชันใน Control UI และตั้งค่า verbose
    เป็น **inherit** และยืนยันด้วยว่าคุณไม่ได้ใช้โปรไฟล์บอตที่ตั้ง `verboseDefault`
    เป็น `on` ใน config

    เอกสาร: [การคิดและ verbose](/th/tools/thinking), [ความปลอดภัย](/th/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="ฉันจะหยุด/ยกเลิกงานที่กำลังรันได้อย่างไร">
    ส่งข้อความใดก็ได้ต่อไปนี้ **เป็นข้อความเดี่ยวแยกต่างหาก** (ไม่มี slash):

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

    ข้อความเหล่านี้เป็นตัวกระตุ้นการยกเลิก (ไม่ใช่คำสั่ง slash)

    สำหรับกระบวนการเบื้องหลัง (จากเครื่องมือ exec) คุณขอให้เอเจนต์รันได้ว่า:

    ```
    process action:kill sessionId:XXX
    ```

    ภาพรวมคำสั่ง slash: ดู [คำสั่ง slash](/th/tools/slash-commands).

    คำสั่งส่วนใหญ่ต้องส่งเป็นข้อความ **เดี่ยวแยกต่างหาก** ที่เริ่มด้วย `/` แต่ทางลัดบางอย่าง (เช่น `/status`) ก็ใช้แบบแทรกในบรรทัดได้สำหรับผู้ส่งที่อยู่ในรายการอนุญาต

  </Accordion>

  <Accordion title='ฉันจะส่งข้อความ Discord จาก Telegram ได้อย่างไร ("การส่งข้อความข้ามบริบทถูกปฏิเสธ")'>
    OpenClaw บล็อกการส่งข้อความ **ข้ามผู้ให้บริการ** ตามค่าเริ่มต้น หาก tool call ถูกผูก
    กับ Telegram มันจะไม่ส่งไปยัง Discord เว้นแต่คุณจะอนุญาตอย่างชัดเจน

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

    รีสตาร์ท Gateway หลังแก้ไข config

  </Accordion>

  <Accordion title='ทำไมบอตจึงดูเหมือน "ไม่สนใจ" ข้อความที่ส่งถี่ ๆ'>
    ตามค่าเริ่มต้น พรอมป์ระหว่างรันจะถูกส่งเข้าไปนำทางรันที่กำลังทำงานอยู่ ใช้ `/queue` เพื่อเลือกพฤติกรรมของรันที่กำลังทำงาน:

    - `steer` - นำทางรันที่กำลังทำงานอยู่ที่ขอบเขตโมเดลถัดไป
    - `followup` - จัดคิวข้อความและรันทีละข้อความหลังจากรันปัจจุบันจบ
    - `collect` - จัดคิวข้อความที่เข้ากันได้และตอบกลับครั้งเดียวหลังจากรันปัจจุบันจบ
    - `interrupt` - ยกเลิกรันปัจจุบันและเริ่มใหม่

    โหมดเริ่มต้นคือ `steer` คุณเพิ่มตัวเลือกอย่าง `debounce:0.5s cap:25 drop:summarize` สำหรับโหมดที่มีคิวได้ ดู [คิวคำสั่ง](/th/concepts/queue) และ [คิวนำทาง](/th/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## เบ็ดเตล็ด

<AccordionGroup>
  <Accordion title='โมเดลเริ่มต้นสำหรับ Anthropic เมื่อใช้ API key คืออะไร'>
    ใน OpenClaw ข้อมูลประจำตัวและการเลือกโมเดลแยกจากกัน การตั้งค่า `ANTHROPIC_API_KEY` (หรือจัดเก็บ Anthropic API key ในโปรไฟล์ auth) จะเปิดใช้การยืนยันตัวตน แต่โมเดลเริ่มต้นจริงคือสิ่งที่คุณกำหนดใน `agents.defaults.model.primary` (เช่น `anthropic/claude-sonnet-4-6` หรือ `anthropic/claude-opus-4-6`) หากคุณเห็น `No credentials found for profile "anthropic:default"` หมายความว่า Gateway ไม่พบข้อมูลประจำตัว Anthropic ใน `auth-profiles.json` ที่คาดไว้สำหรับเอเจนต์ที่กำลังรันอยู่
  </Accordion>
</AccordionGroup>

---

ยังติดอยู่ใช่ไหม ถามใน [Discord](https://discord.com/invite/clawd) หรือเปิด [การสนทนา GitHub](https://github.com/openclaw/openclaw/discussions).

## ที่เกี่ยวข้อง

- [คำถามที่พบบ่อยสำหรับการรันครั้งแรก](/th/help/faq-first-run) — การติดตั้ง การเริ่มใช้งาน auth การสมัครใช้งาน ความล้มเหลวช่วงต้น
- [คำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models) — การเลือกโมเดล failover โปรไฟล์ auth
- [การแก้ไขปัญหา](/th/help/troubleshooting) — การคัดแยกปัญหาโดยเริ่มจากอาการ
