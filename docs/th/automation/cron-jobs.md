---
read_when:
    - การจัดกำหนดการงานเบื้องหลังหรือการปลุกให้ทำงาน
    - การเชื่อมต่อทริกเกอร์ภายนอก (Webhook, Gmail) เข้ากับ OpenClaw
    - การเลือกระหว่าง Heartbeat และ Cron สำหรับงานตามกำหนดเวลา
sidebarTitle: Scheduled tasks
summary: งานตามกำหนดเวลา, Webhook, และทริกเกอร์ Gmail PubSub สำหรับตัวจัดกำหนดการ Gateway
title: งานตามกำหนดเวลา
x-i18n:
    generated_at: "2026-05-12T00:56:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: a713c6aa2467e3c0331fe94605ba83d542632e5e426e94019d6958ef91da1da3
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron คือ scheduler ในตัวของ Gateway โดยจะคงอยู่ของ jobs, ปลุก agent ในเวลาที่ถูกต้อง และสามารถส่ง output กลับไปยัง chat channel หรือ webhook endpoint ได้

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เพิ่มการแจ้งเตือนแบบครั้งเดียว">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="ตรวจสอบ jobs ของคุณ">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="ดูประวัติการรัน">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron ทำงานอย่างไร

- Cron รัน **ภายใน process ของ Gateway** (ไม่ใช่ภายใน model)
- นิยามของ job จะคงอยู่ที่ `~/.openclaw/cron/jobs.json` ดังนั้นการรีสตาร์ตจะไม่ทำให้ schedules สูญหาย
- สถานะการดำเนินงานระหว่าง runtime จะคงอยู่ข้างกันใน `~/.openclaw/cron/jobs-state.json` หากคุณติดตามนิยาม cron ใน git ให้ติดตาม `jobs.json` และเพิ่ม `jobs-state.json` ใน gitignore
- หลังการแยกนี้ OpenClaw เวอร์ชันเก่าสามารถอ่าน `jobs.json` ได้ แต่อาจถือว่า jobs เป็นรายการใหม่เพราะ runtime fields ตอนนี้อยู่ใน `jobs-state.json`
- เมื่อ `jobs.json` ถูกแก้ไขระหว่างที่ Gateway กำลังรันหรือหยุดอยู่ OpenClaw จะเปรียบเทียบ schedule fields ที่เปลี่ยนแปลงกับ metadata ของ pending runtime slot และล้างค่า `nextRunAtMs` ที่ล้าสมัย การแก้เฉพาะรูปแบบหรือการเขียนใหม่ที่เปลี่ยนเฉพาะลำดับคีย์จะคง pending slot ไว้
- การดำเนินการ cron ทั้งหมดจะสร้างบันทึก [background task](/th/automation/tasks)
- เมื่อ Gateway เริ่มทำงาน jobs แบบ isolated agent-turn ที่เลยกำหนดแล้วจะถูกกำหนดเวลาใหม่ให้ออกจากช่วง channel-connect แทนที่จะ replay ทันที เพื่อให้การเริ่มต้น Discord/Telegram และการตั้งค่า native-command ยังคงตอบสนองได้ดีหลังรีสตาร์ต
- Jobs แบบครั้งเดียว (`--at`) จะลบตัวเองหลังสำเร็จตามค่าเริ่มต้น
- การรัน cron แบบ isolated จะพยายามปิด browser tabs/processes ที่ติดตามไว้สำหรับ session `cron:<jobId>` ของตนเมื่อการรันเสร็จสิ้น เพื่อไม่ให้การทำ browser automation แบบแยกตัวทิ้ง processes กำพร้าไว้
- การรัน cron แบบ isolated ที่ได้รับสิทธิ์ cron self-cleanup แบบแคบยังสามารถอ่านสถานะ scheduler, รายการ current job ของตนที่ถูกกรองเฉพาะตัวเอง และประวัติการรันของ job นั้นได้ เพื่อให้การตรวจสอบ status/heartbeat ตรวจสอบ schedule ของตนเองได้โดยไม่ต้องได้สิทธิ์แก้ไข cron ที่กว้างกว่า
- การรัน cron แบบ isolated ยังป้องกัน stale acknowledgement replies ด้วย หากผลลัพธ์แรกเป็นเพียง interim status update (`on it`, `pulling everything together` และคำใบ้ที่คล้ายกัน) และไม่มี descendant subagent run ที่ยังรับผิดชอบคำตอบสุดท้ายอยู่ OpenClaw จะ prompt ซ้ำหนึ่งครั้งเพื่อขอผลลัพธ์จริงก่อนส่งมอบ
- การรัน cron แบบ isolated จะเลือกใช้ structured execution-denial metadata จาก embedded run ก่อน จากนั้นจึง fallback ไปยัง final summary/output markers ที่รู้จัก เช่น `SYSTEM_RUN_DENIED` และ `INVALID_REQUEST` เพื่อไม่ให้คำสั่งที่ถูกบล็อกถูกรายงานว่าเป็นการรันที่สำเร็จ
- การรัน cron แบบ isolated ยังถือว่า agent failures ระดับ run เป็น job errors แม้ไม่มี reply payload ถูกสร้างขึ้น เพื่อให้ model/provider failures เพิ่ม error counters และเรียก failure notifications แทนที่จะล้าง job ว่าสำเร็จ
- เมื่อ job แบบ isolated agent-turn ถึง `timeoutSeconds` cron จะ abort agent run พื้นฐานและให้ช่วง cleanup สั้น ๆ หาก run ไม่ drain การ cleanup ที่ Gateway เป็นเจ้าของจะ force-clear session ownership ของ run นั้นก่อนที่ cron จะบันทึก timeout เพื่อไม่ให้งาน chat ที่เข้าคิวค้างอยู่หลัง stale processing session
- หาก isolated agent-turn ค้างก่อน runner เริ่มต้นหรือก่อน model call แรก cron จะบันทึก phase-specific timeout เช่น `setup timed out before runner start` หรือ `stalled before first model call (last phase: context-engine)` watchdogs เหล่านี้ครอบคลุม embedded providers และ CLI-backed providers ก่อนที่ process ของ CLI ภายนอกจะเริ่มจริง และถูกจำกัดแยกจากค่า `timeoutSeconds` ที่ยาว เพื่อให้ cold-start/auth/context failures ปรากฏอย่างรวดเร็วแทนที่จะรอจนเต็มงบเวลาของ job

<a id="maintenance"></a>

<Note>
การ reconcile task สำหรับ cron เป็น runtime-owned ก่อน และ durable-history-backed เป็นลำดับที่สอง: cron task ที่ active จะยัง live อยู่ตราบใดที่ cron runtime ยังติดตาม job นั้นว่ากำลังรัน แม้ยังมี old child session row อยู่ก็ตาม เมื่อ runtime หยุดเป็นเจ้าของ job และช่วง grace window 5 นาทีหมดลง maintenance จะตรวจ persisted run logs และ job state สำหรับ run ที่ตรงกับ `cron:<jobId>:<startedAt>` หาก durable history นั้นแสดง terminal result, task ledger จะถูก finalized จากข้อมูลนั้น มิฉะนั้น maintenance ที่ Gateway เป็นเจ้าของสามารถทำเครื่องหมาย task เป็น `lost` ได้ Offline CLI audit สามารถกู้คืนจาก durable history ได้ แต่จะไม่ถือว่า active-job set ว่างใน in-process ของตัวเองเป็นหลักฐานว่า cron run ที่ Gateway เป็นเจ้าของหายไปแล้ว
</Note>

## ประเภท schedule

| ชนิด    | CLI flag  | คำอธิบาย                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | timestamp แบบครั้งเดียว (ISO 8601 หรือแบบ relative เช่น `20m`)    |
| `every` | `--every` | ช่วงเวลาแบบคงที่                                          |
| `cron`  | `--cron`  | cron expression แบบ 5-field หรือ 6-field พร้อม `--tz` แบบไม่บังคับ |

Timestamps ที่ไม่มี timezone จะถูกถือว่าเป็น UTC เพิ่ม `--tz America/New_York` สำหรับการกำหนดเวลาแบบ local wall-clock

Expressions แบบ recurring top-of-hour จะถูก stagger อัตโนมัติได้สูงสุด 5 นาทีเพื่อลด load spikes ใช้ `--exact` เพื่อบังคับ timing ที่แม่นยำ หรือ `--stagger 30s` สำหรับ window ที่ระบุชัดเจน

### Day-of-month และ day-of-week ใช้ตรรกะ OR

Cron expressions ถูก parse โดย [croner](https://github.com/Hexagon/croner) เมื่อทั้ง fields day-of-month และ day-of-week ไม่ใช่ wildcard, croner จะ match เมื่อ **field ใด field หนึ่ง** match ไม่ใช่ทั้งคู่ นี่คือพฤติกรรมมาตรฐานของ Vixie cron

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

สิ่งนี้จะ fire ประมาณ 5-6 ครั้งต่อเดือนแทนที่จะเป็น 0-1 ครั้งต่อเดือน OpenClaw ใช้พฤติกรรม OR เริ่มต้นของ Croner ที่นี่ หากต้องการบังคับทั้งสองเงื่อนไข ให้ใช้ modifier day-of-week `+` ของ Croner (`0 9 15 * +1`) หรือ schedule บน field หนึ่งแล้ว guard อีก field ใน prompt หรือ command ของ job

## รูปแบบการดำเนินการ

| รูปแบบ           | ค่า `--session`   | รันใน                  | เหมาะที่สุดสำหรับ                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Main session    | `main`              | Heartbeat turn ถัดไป      | Reminders, system events        |
| Isolated        | `isolated`          | `cron:<jobId>` เฉพาะ | Reports, background chores      |
| Current session | `current`           | ผูกไว้ตอนสร้าง   | งาน recurring ที่รับรู้ context    |
| Custom session  | `session:custom-id` | Persistent named session | Workflows ที่ต่อยอดจาก history |

<AccordionGroup>
  <Accordion title="Main session เทียบกับ isolated เทียบกับ custom">
    Jobs แบบ **Main session** จะ enqueue system event และปลุก heartbeat ได้แบบไม่บังคับ (`--wake now` หรือ `--wake next-heartbeat`) system events เหล่านั้นจะไม่ขยาย daily/idle reset freshness สำหรับ target session jobs แบบ **Isolated** จะรัน agent turn เฉพาะด้วย session ใหม่ **Custom sessions** (`session:xxx`) จะคง context ข้าม runs ทำให้ workflows เช่น daily standups ที่ต่อยอดจาก summaries ก่อนหน้าเป็นไปได้
  </Accordion>
  <Accordion title="'fresh session' หมายถึงอะไรสำหรับ isolated jobs">
    สำหรับ isolated jobs, "fresh session" หมายถึง transcript/session id ใหม่สำหรับแต่ละ run OpenClaw อาจนำ preferences ที่ปลอดภัยมาด้วย เช่น thinking/fast/verbose settings, labels และ explicit user-selected model/auth overrides แต่จะไม่สืบทอด ambient conversation context จาก cron row เก่า: channel/group routing, send or queue policy, elevation, origin หรือ ACP runtime binding ใช้ `current` หรือ `session:<id>` เมื่อ recurring job ควรจงใจต่อยอดจาก conversation context เดิม
  </Accordion>
  <Accordion title="Runtime cleanup">
    สำหรับ isolated jobs, runtime teardown ตอนนี้รวม best-effort browser cleanup สำหรับ cron session นั้น Cleanup failures จะถูกเพิกเฉยเพื่อให้ผลลัพธ์ cron จริงยังเป็นตัวตัดสิน

    การรัน cron แบบ isolated ยัง dispose bundled MCP runtime instances ใด ๆ ที่ถูกสร้างสำหรับ job ผ่าน shared runtime-cleanup path ด้วย ซึ่งสอดคล้องกับวิธี teardown MCP clients ของ main-session และ custom-session เพื่อให้ isolated cron jobs ไม่ leak stdio child processes หรือ MCP connections ที่มีอายุยาวข้าม runs

  </Accordion>
  <Accordion title="Subagent และการส่งมอบ Discord">
    เมื่อการรัน cron แบบ isolated orchestrate subagents การส่งมอบจะเลือก final descendant output เหนือ stale parent interim text ด้วย หาก descendants ยังรันอยู่ OpenClaw จะ suppress partial parent update นั้นแทนที่จะประกาศออกไป

    สำหรับ text-only Discord announce targets, OpenClaw จะส่ง canonical final assistant text หนึ่งครั้งแทนที่จะ replay ทั้ง streamed/intermediate text payloads และ final answer Media และ structured Discord payloads ยังถูกส่งเป็น payloads แยกต่างหากเพื่อไม่ให้ attachments และ components หายไป

  </Accordion>
</AccordionGroup>

### ตัวเลือก payload สำหรับ isolated jobs

<ParamField path="--message" type="string" required>
  ข้อความ prompt (จำเป็นสำหรับ isolated)
</ParamField>
<ParamField path="--model" type="string">
  Model override; ใช้ selected allowed model สำหรับ job
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking level override
</ParamField>
<ParamField path="--light-context" type="boolean">
  ข้าม workspace bootstrap file injection
</ParamField>
<ParamField path="--tools" type="string">
  จำกัด tools ที่ job ใช้ได้ เช่น `--tools exec,read`
</ParamField>

`--model` ใช้ selected allowed model เป็น primary model ของ job นั้น ไม่เหมือนกับ chat-session `/model` override: configured fallback chains ยังคงมีผลเมื่อ job primary ล้มเหลว หาก requested model ไม่ได้รับอนุญาตหรือ resolve ไม่ได้ cron จะทำให้ run ล้มเหลวด้วย explicit validation error แทนที่จะ fallback ไปยัง agent/default model selection ของ job แบบเงียบ ๆ

Cron jobs ยังสามารถมี payload-level `fallbacks` ได้ด้วย เมื่อมีอยู่ list นั้นจะแทนที่ configured fallback chain สำหรับ job ใช้ `fallbacks: []` ใน job payload/API เมื่อคุณต้องการ strict cron run ที่ลองเฉพาะ selected model หาก job มี `--model` แต่ไม่มีทั้ง payload fallbacks และ configured fallbacks OpenClaw จะส่ง explicit empty fallback override เพื่อไม่ให้ agent primary ถูกต่อท้ายเป็น hidden extra retry target

ลำดับความสำคัญของการเลือก model สำหรับ isolated jobs คือ:

1. Gmail hook model override (เมื่อ run มาจาก Gmail และ override นั้นได้รับอนุญาต)
2. Per-job payload `model`
3. User-selected stored cron session model override
4. Agent/default model selection

Fast mode จะตาม resolved live selection ด้วย หาก selected model config มี `params.fastMode`, isolated cron จะใช้ค่านั้นตามค่าเริ่มต้น Stored session `fastMode` override ยังชนะ config ได้ทั้งสองทิศทาง

หาก isolated run เจอ live model-switch handoff, cron จะ retry ด้วย switched provider/model และ persist live selection นั้นสำหรับ active run ก่อน retry เมื่อ switch นั้นมี auth profile ใหม่มาด้วย cron จะ persist auth profile override นั้นสำหรับ active run ด้วย Retries ถูกจำกัด: หลังจาก initial attempt บวก switch retries 2 ครั้ง cron จะ abort แทนที่จะวน loop ตลอดไป

ก่อนที่การรัน Cron แบบแยกจะเข้าสู่ agent runner, OpenClaw จะตรวจสอบ endpoint ของ local provider ที่เข้าถึงได้สำหรับ provider ที่กำหนดค่าเป็น `api: "ollama"` และ `api: "openai-completions"` ซึ่งมี `baseUrl` เป็น loopback, private-network หรือ `.local` หาก endpoint นั้นหยุดทำงาน การรันจะถูกบันทึกเป็น `skipped` พร้อมข้อผิดพลาด provider/model ที่ชัดเจนแทนที่จะเริ่มการเรียก model ผลลัพธ์ของ endpoint จะถูกแคชไว้ 5 นาที ดังนั้นงานที่ถึงกำหนดจำนวนมากซึ่งใช้เซิร์ฟเวอร์ local Ollama, vLLM, SGLang หรือ LM Studio เดียวกันที่หยุดทำงาน จะใช้ probe ขนาดเล็กร่วมกันหนึ่งครั้งแทนที่จะสร้าง request storm การรัน provider-preflight ที่ถูกข้ามจะไม่เพิ่ม execution-error backoff; เปิดใช้ `failureAlert.includeSkipped` เมื่อต้องการการแจ้งเตือนการข้ามซ้ำ ๆ

## การส่งมอบและเอาต์พุต

| โหมด       | สิ่งที่เกิดขึ้น                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | ส่งข้อความสุดท้ายแบบ fallback ไปยังเป้าหมายหาก agent ไม่ได้ส่ง |
| `webhook`  | POST payload เหตุการณ์ที่เสร็จสิ้นไปยัง URL                                |
| `none`     | ไม่มีการส่งมอบ fallback จาก runner                                         |

ใช้ `--announce --channel telegram --to "-1001234567890"` สำหรับการส่งไปยังช่องทาง สำหรับหัวข้อฟอรัม Telegram ให้ใช้ `-1001234567890:topic:123`; ผู้เรียกผ่าน RPC/config โดยตรงยังสามารถส่ง `delivery.threadId` เป็นสตริงหรือตัวเลขได้ด้วย เป้าหมาย Slack/Discord/Mattermost ควรใช้ prefix ที่ชัดเจน (`channel:<id>`, `user:<id>`) ID ห้อง Matrix แยกตัวพิมพ์เล็กใหญ่; ใช้ ID ห้องที่ตรงกันทุกตัวอักษรหรือรูปแบบ `room:!room:server` จาก Matrix

เมื่อการส่งแบบ announce ใช้ `channel: "last"` หรือละเว้น `channel` เป้าหมายที่มี prefix ของ provider เช่น `telegram:123` สามารถเลือกช่องทางก่อนที่ Cron จะ fallback ไปยังประวัติ session หรือช่องทางเดียวที่กำหนดค่าไว้ เฉพาะ prefix ที่ Plugin ที่โหลดประกาศไว้เท่านั้นที่เป็นตัวเลือก provider หาก `delivery.channel` ถูกระบุอย่างชัดเจน prefix ของเป้าหมายต้องระบุ provider เดียวกัน เช่น `channel: "whatsapp"` พร้อม `to: "telegram:123"` จะถูกปฏิเสธแทนที่จะปล่อยให้ WhatsApp ตีความ Telegram ID เป็นหมายเลขโทรศัพท์ prefix สำหรับชนิดเป้าหมายและบริการ เช่น `channel:<id>`, `user:<id>`, `imessage:<handle>` และ `sms:<number>` ยังคงเป็นไวยากรณ์เป้าหมายที่ช่องทางเป็นเจ้าของ ไม่ใช่ตัวเลือก provider

สำหรับงานแบบแยก การส่งแชทจะถูกใช้ร่วมกัน หากมีเส้นทางแชทพร้อมใช้งาน agent สามารถใช้เครื่องมือ `message` ได้แม้งานจะใช้ `--no-deliver` หาก agent ส่งไปยังเป้าหมายที่กำหนดค่าไว้/ปัจจุบัน OpenClaw จะข้าม fallback announce มิฉะนั้น `announce`, `webhook` และ `none` จะควบคุมเฉพาะสิ่งที่ runner ทำกับการตอบกลับสุดท้ายหลังจากรอบ agent เท่านั้น

เมื่อ agent สร้าง reminder แบบแยกจากแชทที่ใช้งานอยู่ OpenClaw จะจัดเก็บเป้าหมายการส่งแบบสดที่เก็บรักษาไว้สำหรับเส้นทาง fallback announce คีย์ session ภายในอาจเป็นตัวพิมพ์เล็ก; เป้าหมายการส่งของ provider จะไม่ถูกสร้างใหม่จากคีย์เหล่านั้นเมื่อมีบริบทแชทปัจจุบันพร้อมใช้งาน

การส่ง announce แบบแฝงใช้ allowlist ของช่องทางที่กำหนดค่าไว้เพื่อตรวจสอบและเปลี่ยนเส้นทางเป้าหมายที่ล้าสมัย การอนุมัติจาก DM pairing-store ไม่ใช่ผู้รับ fallback automation; ตั้งค่า `delivery.to` หรือกำหนดค่ารายการ `allowFrom` ของช่องทางเมื่อ scheduled job ควรส่งไปยัง DM เชิงรุก

การแจ้งเตือนความล้มเหลวใช้เส้นทางปลายทางแยกต่างหาก:

- `cron.failureDestination` ตั้งค่า default ส่วนกลางสำหรับการแจ้งเตือนความล้มเหลว
- `job.delivery.failureDestination` override ค่านั้นต่อ job
- หากไม่ได้ตั้งค่าทั้งสองอย่างและ job ส่งผ่าน `announce` อยู่แล้ว ตอนนี้การแจ้งเตือนความล้มเหลวจะ fallback ไปยังเป้าหมาย announce หลักนั้น
- `delivery.failureDestination` รองรับเฉพาะ job ที่เป็น `sessionTarget="isolated"` เว้นแต่โหมดการส่งหลักจะเป็น `webhook`
- `failureAlert.includeSkipped: true` เลือกให้ job หรือนโยบายแจ้งเตือน Cron ส่วนกลางรับการแจ้งเตือน skipped-run ซ้ำ ๆ การรันที่ถูกข้ามจะเก็บตัวนับการข้ามต่อเนื่องแยกต่างหาก จึงไม่กระทบ execution-error backoff

## ตัวอย่าง CLI

<Tabs>
  <Tab title="Reminder แบบครั้งเดียว">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Job แบบแยกที่ทำซ้ำ">
    ```bash
    openclaw cron add \
      --name "Morning brief" \
      --cron "0 7 * * *" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Summarize overnight updates." \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Override model และการคิด">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
</Tabs>

## Webhook

Gateway สามารถเปิดเผย endpoint HTTP Webhook สำหรับ trigger ภายนอกได้ เปิดใช้ใน config:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### การยืนยันตัวตน

ทุก request ต้องมี hook token ผ่าน header:

- `Authorization: Bearer <token>` (แนะนำ)
- `x-openclaw-token: <token>`

token ใน query string จะถูกปฏิเสธ

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    เพิ่ม system event เข้าคิวสำหรับ session หลัก:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      คำอธิบายเหตุการณ์
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` หรือ `next-heartbeat`
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    รันรอบ agent แบบแยก:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    ฟิลด์: `message` (จำเป็น), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`

  </Accordion>
  <Accordion title="Hook ที่แมปไว้ (POST /hooks/<name>)">
    ชื่อ hook แบบกำหนดเองจะถูก resolve ผ่าน `hooks.mappings` ใน config Mapping สามารถแปลง payload ใด ๆ เป็น action `wake` หรือ `agent` ด้วย template หรือ code transform
  </Accordion>
</AccordionGroup>

<Warning>
เก็บ endpoint hook ไว้หลัง loopback, tailnet หรือ reverse proxy ที่เชื่อถือได้

- ใช้ hook token เฉพาะ; อย่าใช้ gateway auth token ซ้ำ
- เก็บ `hooks.path` ไว้ใน subpath เฉพาะ; `/` จะถูกปฏิเสธ
- ตั้งค่า `hooks.allowedAgentIds` เพื่อจำกัดการ routing `agentId` แบบชัดเจน
- คง `hooks.allowRequestSessionKey=false` ไว้ เว้นแต่คุณต้องการ session ที่ผู้เรียกเลือกได้
- หากเปิดใช้ `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วยเพื่อจำกัดรูปแบบ session key ที่อนุญาต
- โดย default payload ของ hook จะถูกห่อด้วยขอบเขตความปลอดภัย

</Warning>

## การผสานรวม Gmail PubSub

เชื่อม trigger inbox ของ Gmail เข้ากับ OpenClaw ผ่าน Google PubSub

<Note>
**ข้อกำหนดเบื้องต้น:** `gcloud` CLI, `gog` (gogcli), เปิดใช้ hook ของ OpenClaw, Tailscale สำหรับ endpoint HTTPS สาธารณะ
</Note>

### การตั้งค่าด้วย wizard (แนะนำ)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

คำสั่งนี้เขียน config `hooks.gmail`, เปิดใช้ preset Gmail และใช้ Tailscale Funnel สำหรับ push endpoint

### การเริ่ม Gateway อัตโนมัติ

เมื่อ `hooks.enabled=true` และตั้งค่า `hooks.gmail.account` แล้ว Gateway จะเริ่ม `gog gmail watch serve` ตอน boot และต่ออายุ watch อัตโนมัติ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อเลือกไม่ใช้

### การตั้งค่าแบบครั้งเดียวด้วยตนเอง

<Steps>
  <Step title="เลือกโปรเจกต์ GCP">
    เลือกโปรเจกต์ GCP ที่เป็นเจ้าของ OAuth client ที่ `gog` ใช้:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="สร้าง topic และให้สิทธิ์ Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="เริ่ม watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Override model สำหรับ Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## การจัดการ job

```bash
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
หมายเหตุ override model:

- `openclaw cron add|edit --model ...` เปลี่ยน model ที่เลือกของ job
- หาก model ได้รับอนุญาต provider/model นั้นแบบตรงตัวจะไปถึงการรัน agent แบบแยก
- หากไม่ได้รับอนุญาตหรือไม่สามารถ resolve ได้ Cron จะทำให้การรันล้มเหลวด้วย validation error ที่ชัดเจน
- ห่วงโซ่ fallback ที่กำหนดค่าไว้ยังคงมีผล เพราะ Cron `--model` เป็น primary ของ job ไม่ใช่ session `/model` override
- Payload `fallbacks` จะแทนที่ fallback ที่กำหนดค่าไว้สำหรับ job นั้น; `fallbacks: []` ปิด fallback และทำให้การรันเป็นแบบเข้มงวด
- `--model` แบบธรรมดาที่ไม่มีรายการ fallback แบบชัดเจนหรือที่กำหนดค่าไว้ จะไม่ตกผ่านไปยัง primary ของ agent เป็น retry target เพิ่มเติมแบบเงียบ ๆ

</Note>

## การกำหนดค่า

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

`maxConcurrentRuns` จำกัดทั้ง scheduled cron dispatch และการทำงานของ agent-turn แบบแยก agent turn ของ Cron แบบแยกใช้ lane การทำงานเฉพาะของคิวที่ชื่อ `cron-nested` ภายใน ดังนั้นการเพิ่มค่านี้จะทำให้การรัน Cron LLM อิสระคืบหน้าแบบขนานแทนที่จะเริ่มเฉพาะ wrapper Cron ชั้นนอก lane `nested` ที่ไม่ใช่ Cron และใช้ร่วมกันจะไม่ถูกขยายด้วยการตั้งค่านี้

state sidecar ตอน runtime ได้มาจาก `cron.store`: store แบบ `.json` เช่น `~/clawd/cron/jobs.json` ใช้ `~/clawd/cron/jobs-state.json` ส่วน path ของ store ที่ไม่มี suffix `.json` จะต่อท้ายด้วย `-state.json`

หากคุณแก้ไข `jobs.json` ด้วยมือ ให้เก็บ `jobs-state.json` ออกจาก source control OpenClaw ใช้ sidecar นั้นสำหรับ slot ที่ pending, marker ที่ active, metadata ของการรันล่าสุด และ schedule identity ที่บอก scheduler ว่า job ที่ถูกแก้ไขจากภายนอกต้องมี `nextRunAtMs` ใหม่

ปิดใช้ Cron: `cron.enabled: false` หรือ `OPENCLAW_SKIP_CRON=1`

<AccordionGroup>
  <Accordion title="พฤติกรรม retry">
    **Retry แบบครั้งเดียว**: ข้อผิดพลาดชั่วคราว (rate limit, overload, network, server error) จะ retry สูงสุด 3 ครั้งพร้อม exponential backoff ข้อผิดพลาดถาวรจะปิดใช้ทันที

    **Retry แบบ recurring**: exponential backoff (30s ถึง 60m) ระหว่าง retry Backoff จะรีเซ็ตหลังจากการรันที่สำเร็จครั้งถัดไป

  </Accordion>
  <Accordion title="การบำรุงรักษา">
    `cron.sessionRetention` (ค่าเริ่มต้น `24h`) ล้างรายการเซสชันการรันแบบแยกส่วน `cron.runLog.maxBytes` / `cron.runLog.keepLines` ล้างไฟล์บันทึกการรันโดยอัตโนมัติ
  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

### ลำดับคำสั่ง

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron ไม่ทำงาน">
    - ตรวจสอบ `cron.enabled` และตัวแปรสภาพแวดล้อม `OPENCLAW_SKIP_CRON`
    - ยืนยันว่า Gateway ทำงานอย่างต่อเนื่อง
    - สำหรับกำหนดการ `cron` ให้ตรวจสอบเขตเวลา (`--tz`) เทียบกับเขตเวลาของโฮสต์
    - `reason: not-due` ในเอาต์พุตการรันหมายความว่าการรันด้วยตนเองถูกตรวจสอบด้วย `openclaw cron run <jobId> --due` และงานยังไม่ถึงกำหนด

  </Accordion>
  <Accordion title="Cron ทำงานแล้วแต่ไม่มีการส่งมอบ">
    - โหมดการส่งมอบ `none` หมายความว่าไม่คาดว่าจะมีการส่งสำรองจากรันเนอร์ เอเจนต์ยังสามารถส่งโดยตรงด้วยเครื่องมือ `message` ได้เมื่อมีเส้นทางแชต
    - เป้าหมายการส่งมอบขาดหายหรือไม่ถูกต้อง (`channel`/`to`) หมายความว่าการส่งออกถูกข้ามไป
    - สำหรับ Matrix งานที่คัดลอกมาหรืองานเดิมที่มี ID ห้อง `delivery.to` เป็นตัวพิมพ์เล็กอาจล้มเหลว เพราะ ID ห้องของ Matrix แยกแยะตัวพิมพ์ใหญ่และเล็ก แก้ไขงานให้เป็นค่า `!room:server` หรือ `room:!room:server` ที่ตรงกันจาก Matrix
    - ข้อผิดพลาดการยืนยันตัวตนของช่องทาง (`unauthorized`, `Forbidden`) หมายความว่าการส่งมอบถูกบล็อกโดยข้อมูลประจำตัว
    - หากการรันแบบแยกส่วนส่งกลับเฉพาะโทเค็นเงียบ (`NO_REPLY` / `no_reply`) OpenClaw จะระงับการส่งออกโดยตรง และยังระงับเส้นทางสรุปสำรองที่เข้าคิวไว้ด้วย ดังนั้นจึงไม่มีสิ่งใดถูกโพสต์กลับไปยังแชต
    - หากเอเจนต์ควรส่งข้อความถึงผู้ใช้เอง ให้ตรวจสอบว่างานมีเส้นทางที่ใช้ได้ (`channel: "last"` พร้อมแชตก่อนหน้า หรือช่องทาง/เป้าหมายที่ระบุอย่างชัดเจน)

  </Accordion>
  <Accordion title="Cron หรือ Heartbeat ดูเหมือนจะขัดขวางการเปลี่ยนรอบ /new-style">
    - ความสดใหม่ของการรีเซ็ตรายวันและเมื่อไม่ได้ใช้งานไม่ได้อิงกับ `updatedAt`; ดู [การจัดการเซสชัน](/th/concepts/session#session-lifecycle)
    - การปลุกของ Cron, การรัน Heartbeat, การแจ้งเตือน exec และการทำบัญชีของ Gateway อาจอัปเดตแถวเซสชันสำหรับการกำหนดเส้นทาง/สถานะ แต่จะไม่ขยาย `sessionStartedAt` หรือ `lastInteractionAt`
    - สำหรับแถวเดิมที่สร้างก่อนมีฟิลด์เหล่านั้น OpenClaw สามารถกู้คืน `sessionStartedAt` จากส่วนหัวเซสชันของทรานสคริปต์ JSONL ได้เมื่อไฟล์ยังพร้อมใช้งาน แถวเดิมที่ไม่ได้ใช้งานซึ่งไม่มี `lastInteractionAt` จะใช้เวลาเริ่มต้นที่กู้คืนได้นั้นเป็นค่าฐานเมื่อไม่ได้ใช้งาน

  </Accordion>
  <Accordion title="ข้อควรระวังเกี่ยวกับเขตเวลา">
    - Cron ที่ไม่มี `--tz` จะใช้เขตเวลาของโฮสต์ Gateway
    - กำหนดการ `at` ที่ไม่มีเขตเวลาจะถือว่าเป็น UTC
    - `activeHours` ของ Heartbeat ใช้การแก้ค่าเขตเวลาที่กำหนดค่าไว้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติ](/th/automation) — กลไกระบบอัตโนมัติทั้งหมดโดยสรุป
- [งานเบื้องหลัง](/th/automation/tasks) — บัญชีแยกประเภทรายการงานสำหรับการดำเนินการ cron
- [Heartbeat](/th/gateway/heartbeat) — เทิร์นเซสชันหลักตามรอบเวลา
- [เขตเวลา](/th/concepts/timezone) — การกำหนดค่าเขตเวลา
