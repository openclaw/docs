---
read_when:
    - การจัดกำหนดการงานเบื้องหลังหรือการปลุกให้ทำงาน
    - การเชื่อมต่อทริกเกอร์ภายนอก (Webhook, Gmail) เข้ากับ OpenClaw
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานตามกำหนดเวลา
sidebarTitle: Scheduled tasks
summary: งานตามกำหนดเวลา, Webhook และทริกเกอร์ Gmail PubSub สำหรับตัวจัดกำหนดการ Gateway
title: งานตามกำหนดเวลา
x-i18n:
    generated_at: "2026-04-26T11:22:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41908a34ddec3359e414ff4fbca128cc30db53273ee96a6dd12026da950b95ec
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron คือเครื่องมือตั้งเวลาในตัวของ Gateway โดยจะจัดเก็บงานไว้ ปลุกเอเจนต์ในเวลาที่เหมาะสม และสามารถส่งผลลัพธ์กลับไปยังช่องแชตหรือปลายทาง Webhook ได้

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เพิ่มการเตือนแบบครั้งเดียว">
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
  <Step title="ตรวจสอบงานของคุณ">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="ดูประวัติการทำงาน">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## วิธีการทำงานของ cron

- Cron ทำงาน **ภายใน** โพรเซส Gateway (ไม่ใช่ภายในโมเดล)
- คำจำกัดความของงานจะถูกจัดเก็บไว้ที่ `~/.openclaw/cron/jobs.json` ดังนั้นการรีสตาร์ตจะไม่ทำให้ตารางเวลาหายไป
- สถานะการทำงานขณะรันจะถูกจัดเก็บไว้ข้างกันที่ `~/.openclaw/cron/jobs-state.json` หากคุณติดตามคำจำกัดความ cron ใน git ให้ติดตาม `jobs.json` และใส่ `jobs-state.json` ใน gitignore
- หลังจากแยกไฟล์แล้ว OpenClaw เวอร์ชันเก่ายังสามารถอ่าน `jobs.json` ได้ แต่บางครั้งอาจมองว่างานเป็นงานใหม่ เนื่องจากฟิลด์ขณะรันตอนนี้อยู่ใน `jobs-state.json`
- การทำงานของ cron ทั้งหมดจะสร้างเรคคอร์ด [งานเบื้องหลัง](/th/automation/tasks)
- งานแบบครั้งเดียว (`--at`) จะลบตัวเองโดยอัตโนมัติหลังสำเร็จเป็นค่าเริ่มต้น
- การรัน cron แบบ isolated จะพยายามปิดแท็บ/โพรเซสเบราว์เซอร์ที่ติดตามไว้สำหรับเซสชัน `cron:<jobId>` ของตัวเองเมื่อการรันเสร็จสิ้น เพื่อไม่ให้งานอัตโนมัติบนเบราว์เซอร์ที่แยกออกจากกันทิ้งโพรเซสค้างไว้
- การรัน cron แบบ isolated ยังป้องกันการตอบยืนยันที่ค้างเก่าอีกด้วย หากผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราว (`on it`, `pulling everything together` และข้อความทำนองเดียวกัน) และไม่มีการรัน subagent ลูกใดที่ยังรับผิดชอบคำตอบสุดท้ายอยู่ OpenClaw จะส่งพรอมป์ซ้ำอีกครั้งหนึ่งเพื่อขอผลลัพธ์จริงก่อนส่งต่อ

<a id="maintenance"></a>

<Note>
การกระทบยอดงานสำหรับ cron ให้สิทธิ์ความเป็นเจ้าของโดย runtime ก่อน และใช้ประวัติถาวรเป็นลำดับที่สอง: งาน cron ที่ยังทำงานอยู่จะยังคงสถานะ live ตราบใดที่ cron runtime ยังติดตามงานนั้นว่าอยู่ระหว่างรัน แม้ว่ายังมีแถวเซสชันลูกเก่าอยู่ก็ตาม เมื่อ runtime ไม่ได้เป็นเจ้าของงานนั้นแล้ว และหน้าต่างผ่อนผัน 5 นาทีหมดลง การตรวจสอบการบำรุงรักษาจะตรวจสอบบันทึกการรันและสถานะงานที่จัดเก็บไว้สำหรับการรัน `cron:<jobId>:<startedAt>` ที่ตรงกัน หากประวัติถาวรนั้นแสดงผลลัพธ์ปลายทาง งานในบัญชีงานจะถูกปิดสถานะจากข้อมูลนั้น มิฉะนั้นการบำรุงรักษาที่ Gateway เป็นเจ้าของสามารถทำเครื่องหมายงานเป็น `lost` ได้ การตรวจสอบแบบออฟไลน์ผ่าน CLI สามารถกู้คืนจากประวัติถาวรได้ แต่จะไม่ถือว่าชุดงานที่กำลังทำงานในโพรเซสของตัวเองที่ว่างเปล่าเป็นหลักฐานว่าการรัน cron ที่ Gateway เป็นเจ้าของได้หายไปแล้ว
</Note>

## ประเภทตารางเวลา

| ประเภท    | แฟล็ก CLI | คำอธิบาย                                                     |
| --------- | --------- | ------------------------------------------------------------ |
| `at`      | `--at`    | เวลาประทับแบบครั้งเดียว (ISO 8601 หรือแบบสัมพัทธ์เช่น `20m`) |
| `every`   | `--every` | ช่วงเวลาคงที่                                                 |
| `cron`    | `--cron`  | นิพจน์ cron 5 ฟิลด์หรือ 6 ฟิลด์ พร้อม `--tz` แบบเลือกได้       |

เวลาประทับที่ไม่มีเขตเวลาจะถือเป็น UTC เพิ่ม `--tz America/New_York` เพื่อกำหนดเวลาตามเวลาท้องถิ่นจริง

นิพจน์ที่เกิดซ้ำตรงต้นชั่วโมงจะถูกกระจายเวลาโดยอัตโนมัติไม่เกิน 5 นาทีเพื่อลดภาระที่พุ่งสูง ใช้ `--exact` เพื่อบังคับเวลาให้ตรงเป๊ะ หรือ `--stagger 30s` เพื่อกำหนดช่วงเวลาอย่างชัดเจน

### วันของเดือนและวันของสัปดาห์ใช้ตรรกะแบบ OR

นิพจน์ Cron ถูกแยกวิเคราะห์โดย [croner](https://github.com/Hexagon/croner) เมื่อทั้งฟิลด์วันของเดือนและวันของสัปดาห์ไม่ใช่ wildcard, croner จะจับคู่เมื่อ **ฟิลด์ใดฟิลด์หนึ่ง** ตรงกัน — ไม่ใช่ทั้งคู่ นี่คือพฤติกรรมมาตรฐานของ Vixie cron

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

สิ่งนี้จะทริกเกอร์ประมาณ 5–6 ครั้งต่อเดือนแทนที่จะเป็น 0–1 ครั้งต่อเดือน OpenClaw ใช้พฤติกรรม OR เริ่มต้นของ Croner ในกรณีนี้ หากต้องการให้ทั้งสองเงื่อนไขต้องตรงกัน ให้ใช้ตัวปรับแต่งวันของสัปดาห์ `+` ของ Croner (`0 9 15 * +1`) หรือกำหนดตารางตามฟิลด์หนึ่งแล้วตรวจอีกฟิลด์ในพรอมป์หรือคำสั่งของงาน

## รูปแบบการทำงาน

| รูปแบบ          | ค่า `--session`      | ทำงานใน                  | เหมาะที่สุดสำหรับ                  |
| --------------- | -------------------- | ------------------------ | ---------------------------------- |
| เซสชันหลัก      | `main`               | เทิร์น Heartbeat ถัดไป   | การเตือน, system event            |
| Isolated        | `isolated`           | `cron:<jobId>` โดยเฉพาะ  | รายงาน, งานเบื้องหลัง             |
| เซสชันปัจจุบัน  | `current`            | ผูกตอนเวลาสร้าง         | งานที่เกิดซ้ำและรับรู้บริบท       |
| เซสชันกำหนดเอง  | `session:custom-id`  | เซสชันแบบมีชื่อถาวร      | เวิร์กโฟลว์ที่ต่อยอดจากประวัติ    |

<AccordionGroup>
  <Accordion title="เซสชันหลัก เทียบกับ isolated เทียบกับ custom">
    งานแบบ **เซสชันหลัก** จะเข้าคิว system event และเลือกได้ว่าจะปลุก Heartbeat หรือไม่ (`--wake now` หรือ `--wake next-heartbeat`) system event เหล่านั้นจะไม่ขยายความใหม่ล่าสุดของการรีเซ็ตรายวัน/ว่างงานสำหรับเซสชันเป้าหมาย งานแบบ **isolated** จะรันเทิร์นเอเจนต์เฉพาะด้วยเซสชันใหม่ ส่วน **เซสชันกำหนดเอง** (`session:xxx`) จะเก็บบริบทข้ามการรัน ทำให้รองรับเวิร์กโฟลว์อย่างการสรุป standup รายวันที่ต่อยอดจากสรุปก่อนหน้าได้
  </Accordion>
  <Accordion title="ความหมายของ 'เซสชันใหม่' สำหรับงาน isolated">
    สำหรับงาน isolated, "เซสชันใหม่" หมายถึง transcript/session id ใหม่ในแต่ละการรัน OpenClaw อาจคงค่ากำหนดที่ปลอดภัยไว้ เช่น การตั้งค่า thinking/fast/verbose, label และการ override model/auth ที่ผู้ใช้เลือกไว้อย่างชัดเจน แต่จะไม่รับช่วงบริบทการสนทนาแวดล้อมจากแถว cron เก่า เช่น การกำหนดเส้นทาง channel/group, นโยบายการส่งหรือคิว, elevation, origin หรือการผูก ACP runtime ใช้ `current` หรือ `session:<id>` เมื่องานที่เกิดซ้ำควรต่อยอดจากบริบทการสนทนาเดิมโดยตั้งใจ
  </Accordion>
  <Accordion title="การล้างทรัพยากรขณะรัน">
    สำหรับงาน isolated การปิด runtime ตอนนี้รวมถึงการล้างเบราว์เซอร์สำหรับเซสชัน cron นั้นแบบพยายามเต็มที่ด้วย ความล้มเหลวในการล้างจะถูกละเว้นเพื่อให้ผลลัพธ์ cron จริงยังคงเป็นตัวตัดสิน

    การรัน cron แบบ isolated ยังจัดการ dispose อินสแตนซ์ MCP runtime ที่รวมมาและสร้างขึ้นสำหรับงานนั้นผ่านเส้นทางล้าง runtime ที่ใช้ร่วมกันด้วย ซึ่งสอดคล้องกับวิธีที่ไคลเอนต์ MCP ของเซสชันหลักและเซสชันกำหนดเองถูกปิด ดังนั้นงาน cron แบบ isolated จะไม่ทำให้เกิดโพรเซสลูก stdio หรือการเชื่อมต่อ MCP ระยะยาวรั่วค้างข้ามการรัน

  </Accordion>
  <Accordion title="การส่งต่อผ่าน subagent และ Discord">
    เมื่อการรัน cron แบบ isolated ประสานงาน subagent การส่งต่อจะเลือกผลลัพธ์สุดท้ายของลูกหลานมากกว่าข้อความชั่วคราวเก่าจากตัวแม่ด้วย หากลูกหลานยังรันอยู่ OpenClaw จะระงับการอัปเดตบางส่วนจากตัวแม่แทนที่จะประกาศมันออกไป

    สำหรับเป้าหมายประกาศ Discord แบบข้อความล้วน OpenClaw จะส่งข้อความ assistant สุดท้ายที่เป็น canonical เพียงครั้งเดียว แทนที่จะเล่นซ้ำทั้ง payload ข้อความแบบสตรีม/ชั่วคราวและคำตอบสุดท้าย ส่วน payload ของ Discord แบบสื่อและแบบมีโครงสร้างจะยังคงส่งเป็น payload แยกกัน เพื่อไม่ให้ attachment และ component หายไป

  </Accordion>
</AccordionGroup>

### ตัวเลือก payload สำหรับงาน isolated

<ParamField path="--message" type="string" required>
  ข้อความพรอมป์ (จำเป็นสำหรับ isolated)
</ParamField>
<ParamField path="--model" type="string">
  การ override โมเดล; ใช้โมเดลที่อนุญาตซึ่งถูกเลือกสำหรับงาน
</ParamField>
<ParamField path="--thinking" type="string">
  การ override ระดับ thinking
</ParamField>
<ParamField path="--light-context" type="boolean">
  ข้ามการ inject ไฟล์ bootstrap ของ workspace
</ParamField>
<ParamField path="--tools" type="string">
  จำกัดว่าเครื่องมือใดที่งานสามารถใช้ได้ ตัวอย่างเช่น `--tools exec,read`
</ParamField>

`--model` จะใช้โมเดลที่อนุญาตซึ่งถูกเลือกสำหรับงานนั้น หากโมเดลที่ร้องขอไม่ได้รับอนุญาต cron จะบันทึกคำเตือนและ fallback ไปใช้การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้นของงานแทน ลำดับ fallback ที่ตั้งค่าไว้ยังคงมีผล แต่การ override โมเดลแบบตรง ๆ ที่ไม่มีรายการ fallback ต่อ-งานอย่างชัดเจนจะไม่ต่อท้ายโมเดลหลักของเอเจนต์เป็นเป้าหมาย retry เพิ่มเติมแบบซ่อนอีกต่อไป

ลำดับความสำคัญของการเลือกโมเดลสำหรับงาน isolated คือ:

1. การ override โมเดลจาก Gmail hook (เมื่อการรันมาจาก Gmail และอนุญาตให้ใช้ override นั้น)
2. `model` ใน payload ต่อ-งาน
3. การ override โมเดลของเซสชัน cron ที่จัดเก็บไว้ซึ่งผู้ใช้เลือก
4. การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้น

โหมด Fast จะอิงตามค่าที่เลือกใช้งานจริงที่ resolve ได้เช่นกัน หากการตั้งค่าโมเดลที่เลือกมี `params.fastMode`, cron แบบ isolated จะใช้ค่านั้นเป็นค่าเริ่มต้น ส่วนการ override `fastMode` ของเซสชันที่จัดเก็บไว้จะยังมีสิทธิ์เหนือกว่าคอนฟิกไม่ว่าทิศทางใด

หากการรัน isolated เจอการส่งต่อ live model-switch, cron จะ retry ด้วย provider/model ที่สลับแล้ว และจัดเก็บค่าที่เลือกใช้งานจริงนั้นสำหรับการรันที่กำลังทำงานก่อน retry เมื่อการสลับนั้นมี auth profile ใหม่มาด้วย cron จะจัดเก็บการ override auth profile นั้นสำหรับการรันที่กำลังทำงานด้วย จำนวน retry ถูกจำกัดไว้: หลังจากความพยายามครั้งแรกบวก retry จากการสลับอีก 2 ครั้ง cron จะยกเลิกแทนที่จะวนซ้ำไม่รู้จบ

## การส่งต่อและผลลัพธ์

| โหมด       | สิ่งที่เกิดขึ้น                                                     |
| ---------- | ------------------------------------------------------------------- |
| `announce` | ส่งข้อความสุดท้ายไปยังเป้าหมายแบบ fallback หากเอเจนต์ไม่ได้ส่งเอง |
| `webhook`  | POST payload เหตุการณ์ที่เสร็จสิ้นไปยัง URL                       |
| `none`     | ไม่มีการส่งแบบ fallback จากตัวรัน                                  |

ใช้ `--announce --channel telegram --to "-1001234567890"` เพื่อส่งไปยังช่อง สำหรับหัวข้อฟอรัม Telegram ให้ใช้ `-1001234567890:topic:123` เป้าหมาย Slack/Discord/Mattermost ควรใช้ prefix ที่ชัดเจน (`channel:<id>`, `user:<id>`) Room ID ของ Matrix แยกตัวพิมพ์เล็กใหญ่ ให้ใช้ room ID ที่ตรงตามจริงหรือรูปแบบ `room:!room:server` จาก Matrix

สำหรับงาน isolated การส่งผ่านแชตจะใช้ร่วมกัน หากมีเส้นทางแชตพร้อมใช้งาน เอเจนต์สามารถใช้เครื่องมือ `message` ได้แม้งานนั้นจะใช้ `--no-deliver` หากเอเจนต์ส่งไปยังเป้าหมายที่ตั้งค่าไว้/เป้าหมายปัจจุบัน OpenClaw จะข้ามการประกาศ fallback มิฉะนั้น `announce`, `webhook` และ `none` จะควบคุมเพียงสิ่งที่ตัวรันทำกับคำตอบสุดท้ายหลังจากเทิร์นของเอเจนต์

เมื่อเอเจนต์สร้างการเตือนแบบ isolated จากแชตที่กำลังใช้งานอยู่ OpenClaw จะจัดเก็บเป้าหมายการส่งแบบ live ที่คงไว้สำหรับเส้นทางประกาศ fallback คีย์เซสชันภายในอาจเป็นตัวพิมพ์เล็ก แต่จะไม่สร้างเป้าหมายการส่งของ provider ใหม่จากคีย์เหล่านั้นเมื่อมีบริบทแชตปัจจุบันพร้อมใช้งาน

การแจ้งเตือนความล้มเหลวจะใช้เส้นทางปลายทางแยกต่างหาก:

- `cron.failureDestination` กำหนดค่าเริ่มต้นส่วนกลางสำหรับการแจ้งเตือนความล้มเหลว
- `job.delivery.failureDestination` ใช้ override ระดับงาน
- หากไม่ได้ตั้งค่าทั้งคู่ และงานนั้นส่งผ่าน `announce` อยู่แล้ว การแจ้งเตือนความล้มเหลวจะ fallback ไปยังเป้าหมายประกาศหลักนั้น
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่โหมดการส่งหลักจะเป็น `webhook`

## ตัวอย่าง CLI

<Tabs>
  <Tab title="การเตือนแบบครั้งเดียว">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="งาน isolated แบบเกิดซ้ำ">
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
  <Tab title="การ override โมเดลและ thinking">
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

Gateway สามารถเปิดเผยปลายทาง HTTP Webhook สำหรับทริกเกอร์ภายนอกได้ เปิดใช้งานในการตั้งค่าดังนี้:

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

ทุกคำขอต้องใส่ hook token ผ่าน header:

- `Authorization: Bearer <token>` (แนะนำ)
- `x-openclaw-token: <token>`

โทเค็นใน query string จะถูกปฏิเสธ

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    เข้าคิว system event สำหรับเซสชันหลัก:

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
    รันเทิร์นเอเจนต์แบบ isolated:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    ฟิลด์: `message` (จำเป็น), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    ชื่อ hook แบบกำหนดเองจะถูก resolve ผ่าน `hooks.mappings` ในคอนฟิก โดย mapping สามารถแปลง payload ใด ๆ ให้เป็นแอ็กชัน `wake` หรือ `agent` ด้วย template หรือการแปลงด้วยโค้ด
  </Accordion>
</AccordionGroup>

<Warning>
เก็บปลายทาง hook ไว้หลัง loopback, tailnet หรือ reverse proxy ที่เชื่อถือได้

- ใช้ hook token เฉพาะ; อย่านำโทเค็นยืนยันตัวตนของ gateway มาใช้ซ้ำ
- กำหนด `hooks.path` ให้เป็น subpath เฉพาะ; ระบบจะปฏิเสธ `/`
- ตั้งค่า `hooks.allowedAgentIds` เพื่อจำกัดการกำหนดเส้นทาง `agentId` แบบชัดเจน
- คงค่า `hooks.allowRequestSessionKey=false` ไว้ เว้นแต่คุณจำเป็นต้องให้ผู้เรียกเลือกเซสชันได้เอง
- หากคุณเปิด `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` เพิ่มด้วยเพื่อจำกัดรูปแบบ session key ที่อนุญาต
- payload ของ hook จะถูกห่อด้วยขอบเขตความปลอดภัยเป็นค่าเริ่มต้น

</Warning>

## การเชื่อมต่อ Gmail PubSub

เชื่อมทริกเกอร์กล่องจดหมาย Gmail เข้ากับ OpenClaw ผ่าน Google PubSub

<Note>
**ข้อกำหนดเบื้องต้น:** CLI `gcloud`, `gog` (gogcli), เปิดใช้งาน hook ของ OpenClaw แล้ว, และใช้ Tailscale สำหรับปลายทาง HTTPS สาธารณะ
</Note>

### การตั้งค่าด้วยวิซาร์ด (แนะนำ)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

คำสั่งนี้จะเขียนคอนฟิก `hooks.gmail`, เปิดใช้งาน Gmail preset และใช้ Tailscale Funnel สำหรับปลายทาง push

### การเริ่มต้น Gateway อัตโนมัติ

เมื่อ `hooks.enabled=true` และมีการตั้งค่า `hooks.gmail.account` แล้ว Gateway จะเริ่ม `gog gmail watch serve` ตอนบูตและต่ออายุ watch ให้อัตโนมัติ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` หากไม่ต้องการใช้พฤติกรรมนี้

### การตั้งค่าด้วยตนเองครั้งเดียว

<Steps>
  <Step title="เลือกโปรเจ็กต์ GCP">
    เลือกโปรเจ็กต์ GCP ที่เป็นเจ้าของ OAuth client ที่ `gog` ใช้งาน:

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

### การ override โมเดลของ Gmail

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

## การจัดการงาน

```bash
# แสดงรายการงานทั้งหมด
openclaw cron list

# แสดงงานหนึ่งรายการ รวมถึงเส้นทางการส่งที่ resolve แล้ว
openclaw cron show <jobId>

# แก้ไขงาน
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# บังคับรันงานเดี๋ยวนี้
openclaw cron run <jobId>

# รันเฉพาะเมื่อถึงกำหนด
openclaw cron run <jobId> --due

# ดูประวัติการรัน
openclaw cron runs --id <jobId> --limit 50

# ลบงาน
openclaw cron remove <jobId>

# การเลือกเอเจนต์ (การตั้งค่าหลายเอเจนต์)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
หมายเหตุเกี่ยวกับการ override โมเดล:

- `openclaw cron add|edit --model ...` จะเปลี่ยนโมเดลที่เลือกของงาน
- หากอนุญาตให้ใช้โมเดลนั้น provider/model ที่ระบุแบบตรงตัวจะถูกส่งไปยังการรันเอเจนต์แบบ isolated
- หากไม่อนุญาต cron จะเตือนและ fallback ไปใช้การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้นของงาน
- ลำดับ fallback ที่ตั้งค่าไว้ยังคงมีผล แต่การ override แบบ `--model` ตรง ๆ ที่ไม่มีรายการ fallback ต่อ-งานอย่างชัดเจนจะไม่ไหลต่อไปยังโมเดลหลักของเอเจนต์ในฐานะเป้าหมาย retry เพิ่มเติมแบบเงียบ ๆ อีกต่อไป

</Note>

## การตั้งค่า

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

ไฟล์ sidecar สถานะ runtime จะอนุมานจาก `cron.store`: store แบบ `.json` เช่น `~/clawd/cron/jobs.json` จะใช้ `~/clawd/cron/jobs-state.json` ส่วน path ของ store ที่ไม่มีนามสกุล `.json` จะเติม `-state.json` ต่อท้าย

ปิดใช้งาน cron: `cron.enabled: false` หรือ `OPENCLAW_SKIP_CRON=1`

<AccordionGroup>
  <Accordion title="พฤติกรรมการ retry">
    **การ retry ของงานครั้งเดียว**: ข้อผิดพลาดชั่วคราว (rate limit, overload, network, server error) จะ retry ได้สูงสุด 3 ครั้งด้วย exponential backoff ส่วนข้อผิดพลาดถาวรจะถูกปิดใช้งานทันที

    **การ retry ของงานแบบเกิดซ้ำ**: ใช้ exponential backoff (30 วินาทีถึง 60 นาที) ระหว่างการ retry โดย backoff จะรีเซ็ตหลังการรันที่สำเร็จครั้งถัดไป

  </Accordion>
  <Accordion title="การบำรุงรักษา">
    `cron.sessionRetention` (ค่าเริ่มต้น `24h`) จะลบรายการ run-session แบบ isolated ที่หมดอายุ `cron.runLog.maxBytes` / `cron.runLog.keepLines` จะลบไฟล์บันทึกการรันอัตโนมัติ
  </Accordion>
</AccordionGroup>

## การแก้ปัญหา

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
    - ตรวจสอบ `cron.enabled` และตัวแปรแวดล้อม `OPENCLAW_SKIP_CRON`
    - ยืนยันว่า Gateway ทำงานต่อเนื่องอยู่
    - สำหรับตาราง `cron` ให้ตรวจสอบเขตเวลา (`--tz`) เทียบกับเขตเวลาของโฮสต์
    - `reason: not-due` ในผลลัพธ์การรันหมายความว่ามีการตรวจการรันด้วย `openclaw cron run <jobId> --due` และงานนั้นยังไม่ถึงกำหนด

  </Accordion>
  <Accordion title="Cron ทำงานแล้วแต่ไม่มีการส่งต่อ">
    - โหมดการส่ง `none` หมายความว่าไม่คาดว่าจะมีการส่งแบบ fallback จากตัวรัน เอเจนต์ยังคงส่งได้โดยตรงด้วยเครื่องมือ `message` เมื่อมีเส้นทางแชตพร้อมใช้งาน
    - เป้าหมายการส่งไม่มี/ไม่ถูกต้อง (`channel`/`to`) หมายความว่าระบบข้ามการส่งออก
    - สำหรับ Matrix งานที่คัดลอกมาหรืองานเก่าที่มี room ID ใน `delivery.to` เป็นตัวพิมพ์เล็กทั้งหมดอาจล้มเหลว เพราะ room ID ของ Matrix แยกตัวพิมพ์เล็กใหญ่ ให้แก้ไขงานเป็นค่า `!room:server` หรือ `room:!room:server` ที่ตรงตามจริงจาก Matrix
    - ข้อผิดพลาดด้านการยืนยันตัวตนของ channel (`unauthorized`, `Forbidden`) หมายความว่าการส่งถูกบล็อกด้วยข้อมูลรับรอง
    - หากการรันแบบ isolated ส่งกลับมาเพียงโทเค็นเงียบ (`NO_REPLY` / `no_reply`) OpenClaw จะระงับการส่งออกโดยตรง และยังระงับเส้นทางสรุปที่เข้าคิวแบบ fallback ด้วย ดังนั้นจะไม่มีการโพสต์อะไรกลับไปยังแชต
    - หากเอเจนต์ควรส่งข้อความหาผู้ใช้ด้วยตัวเอง ให้ตรวจสอบว่างานนั้นมีเส้นทางที่ใช้งานได้ (`channel: "last"` พร้อมแชตก่อนหน้า หรือกำหนด channel/target แบบชัดเจน)

  </Accordion>
  <Accordion title="Cron หรือ Heartbeat ดูเหมือนจะขัดขวางการ rollover แบบ /new-style">
    - ความใหม่ล่าสุดของการรีเซ็ตรายวันและการรีเซ็ตเมื่อว่างงานไม่ได้อิงกับ `updatedAt`; ดู [การจัดการเซสชัน](/th/concepts/session#session-lifecycle)
    - การปลุกโดย cron, การรัน Heartbeat, การแจ้งเตือน exec และการทำบัญชีของ gateway อาจอัปเดตแถวเซสชันเพื่อการกำหนดเส้นทาง/สถานะ แต่จะไม่ขยาย `sessionStartedAt` หรือ `lastInteractionAt`
    - สำหรับแถวเก่าที่สร้างก่อนมีฟิลด์เหล่านี้ OpenClaw สามารถกู้คืน `sessionStartedAt` จากส่วนหัว session ใน transcript JSONL ได้เมื่อไฟล์ยังพร้อมใช้งาน แถวเก่าแบบ idle ที่ไม่มี `lastInteractionAt` จะใช้เวลาเริ่มต้นที่กู้คืนนั้นเป็นค่าอ้างอิงเมื่อว่างงาน

  </Accordion>
  <Accordion title="ข้อควรระวังเรื่องเขตเวลา">
    - Cron ที่ไม่มี `--tz` จะใช้เขตเวลาของโฮสต์ gateway
    - ตาราง `at` ที่ไม่มีเขตเวลาจะถือเป็น UTC
    - `activeHours` ของ Heartbeat ใช้การ resolve เขตเวลาตามที่ตั้งค่าไว้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติและงาน](/th/automation) — ภาพรวมของกลไกระบบอัตโนมัติทั้งหมด
- [งานเบื้องหลัง](/th/automation/tasks) — บัญชีงานสำหรับการรัน cron
- [Heartbeat](/th/gateway/heartbeat) — เทิร์นของเซสชันหลักแบบเป็นระยะ
- [เขตเวลา](/th/concepts/timezone) — การตั้งค่าเขตเวลา
