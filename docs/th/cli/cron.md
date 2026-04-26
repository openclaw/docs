---
read_when:
    - คุณต้องการงานและการปลุกตามกำหนดเวลา
    - คุณกำลังดีบักการทำงานและบันทึกของ cron
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw cron` (ตั้งเวลาและรันงานเบื้องหลัง)
title: Cron
x-i18n:
    generated_at: "2026-04-26T11:25:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55cadcf73550367d399b7ca78e842f12a8113f2ec8749f59dadf2bbb5f8417ae
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

จัดการงาน cron สำหรับตัวจัดกำหนดการของ Gateway

ที่เกี่ยวข้อง:

- งาน Cron: [งาน Cron](/th/automation/cron-jobs)

เคล็ดลับ: รัน `openclaw cron --help` เพื่อดูชุดคำสั่งทั้งหมด

หมายเหตุ: `openclaw cron list` และ `openclaw cron show <job-id>` จะแสดงตัวอย่าง
เส้นทางการส่งที่ resolve แล้ว สำหรับ `channel: "last"` ตัวอย่างจะแสดงว่า
เส้นทางนั้น resolve จากเซสชัน main/current หรือจะปิดแบบ fail closed

หมายเหตุ: งาน `cron add` แบบ isolated ใช้การส่งแบบ `--announce` เป็นค่าเริ่มต้น ใช้ `--no-deliver` เพื่อเก็บ
ผลลัพธ์ไว้ภายใน `--deliver` ยังคงใช้งานได้ในฐานะ alias แบบเลิกใช้แล้วของ `--announce`

หมายเหตุ: การส่งผ่านแชตของ cron แบบ isolated เป็นแบบใช้ร่วมกัน `--announce` คือการส่งแบบ fallback
โดยตัวรันสำหรับคำตอบสุดท้าย; `--no-deliver` จะปิด fallback นี้ แต่
จะไม่ลบเครื่องมือ `message` ของเอเจนต์เมื่อมีเส้นทางแชตพร้อมใช้งาน

หมายเหตุ: งานแบบครั้งเดียว (`--at`) จะลบออกหลังสำเร็จโดยอัตโนมัติเป็นค่าเริ่มต้น ใช้ `--keep-after-run` หากต้องการเก็บไว้

หมายเหตุ: `--session` รองรับ `main`, `isolated`, `current` และ `session:<id>`
ใช้ `current` เพื่อผูกกับเซสชันที่กำลังใช้งานอยู่ในเวลาที่สร้าง หรือใช้ `session:<id>` สำหรับ
session key แบบถาวรที่ระบุชัดเจน

หมายเหตุ: `--session isolated` จะสร้าง transcript/session id ใหม่สำหรับแต่ละการรัน
ค่ากำหนดที่ปลอดภัยและการ override model/auth ที่ผู้ใช้เลือกไว้อย่างชัดเจนสามารถคงอยู่ได้ แต่
บริบทการสนทนาแวดล้อมจะไม่ถูกสืบทอด: การกำหนดเส้นทาง channel/group, นโยบายการส่ง/การเข้าคิว,
elevation, origin และการผูก ACP runtime จะถูกรีเซ็ตสำหรับการรัน isolated ใหม่

หมายเหตุ: สำหรับงาน CLI แบบครั้งเดียว ค่า datetime ของ `--at` ที่ไม่มี offset จะถือเป็น UTC เว้นแต่คุณจะส่ง
`--tz <iana>` ด้วย ซึ่งจะตีความเวลา wall-clock ท้องถิ่นนั้นตาม timezone ที่กำหนด

หมายเหตุ: ตอนนี้งานที่เกิดซ้ำจะใช้ exponential retry backoff หลังเกิดข้อผิดพลาดต่อเนื่อง (30 วินาที → 1 นาที → 5 นาที → 15 นาที → 60 นาที) จากนั้นจะกลับไปใช้ตารางเวลาปกติหลังการรันที่สำเร็จครั้งถัดไป

หมายเหตุ: ตอนนี้ `openclaw cron run` จะคืนค่าทันทีที่การรันแบบ manual ถูกเข้าคิวเพื่อดำเนินการ การตอบกลับที่สำเร็จจะมี `{ ok: true, enqueued: true, runId }`; ใช้ `openclaw cron runs --id <job-id>` เพื่อติดตามผลลัพธ์สุดท้าย

หมายเหตุ: `openclaw cron run <job-id>` จะบังคับรันเป็นค่าเริ่มต้น ใช้ `--due` เพื่อคง
พฤติกรรมเดิมแบบ "รันเฉพาะเมื่อถึงกำหนด"

หมายเหตุ: เทิร์น cron แบบ isolated จะระงับคำตอบแบบยืนยันชั่วคราวที่ค้างเก่า หาก
ผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราว และไม่มีการรัน subagent ลูกใด
ที่รับผิดชอบคำตอบสุดท้าย cron จะส่งพรอมป์ซ้ำอีกครั้งหนึ่งเพื่อขอผลลัพธ์จริง
ก่อนการส่งต่อ

หมายเหตุ: หากการรัน cron แบบ isolated ส่งกลับมาเพียงโทเค็นเงียบ (`NO_REPLY` /
`no_reply`) cron จะระงับการส่งออกโดยตรงและระงับเส้นทางสรุปที่เข้าคิว
แบบ fallback ด้วย ดังนั้นจะไม่มีการโพสต์อะไรกลับไปยังแชต

หมายเหตุ: `cron add|edit --model ...` จะใช้โมเดลที่อนุญาตซึ่งเลือกไว้นั้นสำหรับงาน
หากโมเดลไม่ได้รับอนุญาต cron จะเตือนและ fallback ไปใช้การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้นของงานแทน
ลำดับ fallback ที่ตั้งค่าไว้ยังคงมีผล แต่การ override โมเดลแบบตรง ๆ ที่ไม่มีรายการ fallback ต่อ-งานอย่างชัดเจนจะไม่ต่อท้าย
โมเดลหลักของเอเจนต์เป็นเป้าหมาย retry เพิ่มเติมแบบซ่อนอีกต่อไป

หมายเหตุ: ลำดับความสำคัญของโมเดลสำหรับ cron แบบ isolated คือ override จาก Gmail-hook ก่อน จากนั้นเป็น
`--model` ต่อ-งาน จากนั้นเป็นการ override โมเดลของ cron-session ที่จัดเก็บไว้ซึ่งผู้ใช้เลือก
แล้วจึงเป็นการเลือกตามเอเจนต์/ค่าเริ่มต้นตามปกติ

หมายเหตุ: โหมด Fast ของ cron แบบ isolated จะตามการเลือกโมเดล live ที่ resolve ได้
ค่า `params.fastMode` ในคอนฟิกโมเดลจะมีผลเป็นค่าเริ่มต้น แต่การ override `fastMode` ของเซสชันที่จัดเก็บไว้ยังคงมีสิทธิ์เหนือกว่าคอนฟิก

หมายเหตุ: หากการรันแบบ isolated โยน `LiveSessionModelSwitchError` cron จะจัดเก็บ
provider/model ที่ถูกสลับ (และการ override auth profile ที่ถูกสลับเมื่อมี) สำหรับ
การรันที่กำลังทำงานก่อน retry ลูป retry ชั้นนอกถูกจำกัดไว้ที่ retry จากการสลับ 2 ครั้ง
หลังจากความพยายามเริ่มต้น จากนั้นจะยกเลิกแทนที่จะวนซ้ำไม่รู้จบ

หมายเหตุ: การแจ้งเตือนความล้มเหลวจะใช้ `delivery.failureDestination` ก่อน จากนั้น
ใช้ `cron.failureDestination` ส่วนกลาง และสุดท้าย fallback ไปยังเป้าหมาย
announce หลักของงานเมื่อไม่ได้กำหนดปลายทางความล้มเหลวไว้โดยชัดเจน

หมายเหตุ: การเก็บรักษา/การลบข้อมูลเก่าควบคุมผ่านคอนฟิก:

- `cron.sessionRetention` (ค่าเริ่มต้น `24h`) จะลบเซสชันการรัน isolated ที่เสร็จสมบูรณ์แล้ว
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` จะลบข้อมูลเก่าของ `~/.openclaw/cron/runs/<jobId>.jsonl`

หมายเหตุการอัปเกรด: หากคุณมีงาน cron เก่าตั้งแต่ก่อนรูปแบบ delivery/store ปัจจุบัน ให้รัน
`openclaw doctor --fix` ตอนนี้ Doctor จะปรับฟิลด์ cron แบบเก่าให้เป็นมาตรฐาน (`jobId`, `schedule.cron`,
ฟิลด์ delivery ระดับบนสุดรวมถึง `threadId` แบบเก่า, alias การส่ง `provider` ใน payload) และย้าย
งาน fallback แบบ webhook ที่เป็น `notify: true` แบบเรียบง่ายไปเป็นการส่งแบบ webhook อย่างชัดเจนเมื่อมีการตั้งค่า `cron.webhook`

## การแก้ไขที่ใช้บ่อย

อัปเดตการตั้งค่าการส่งโดยไม่เปลี่ยนข้อความ:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

ปิดการส่งสำหรับงาน isolated:

```bash
openclaw cron edit <job-id> --no-deliver
```

เปิดใช้บริบท bootstrap แบบเบาสำหรับงาน isolated:

```bash
openclaw cron edit <job-id> --light-context
```

ประกาศไปยัง channel ที่ระบุ:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

สร้างงาน isolated พร้อมบริบท bootstrap แบบเบา:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` ใช้ได้กับงานเทิร์นเอเจนต์แบบ isolated เท่านั้น สำหรับการรัน cron โหมด lightweight จะคงบริบท bootstrap ให้ว่างไว้ แทนการ inject ชุด bootstrap ของ workspace แบบเต็ม

หมายเหตุเกี่ยวกับความเป็นเจ้าของการส่ง:

- การส่งผ่านแชตของ cron แบบ isolated เป็นแบบใช้ร่วมกัน เอเจนต์สามารถส่งโดยตรงได้ด้วย
  เครื่องมือ `message` เมื่อมีเส้นทางแชตพร้อมใช้งาน
- `announce` จะส่งคำตอบสุดท้ายแบบ fallback เฉพาะเมื่อเอเจนต์ไม่ได้ส่ง
  โดยตรงไปยังเป้าหมายที่ resolve แล้ว `webhook` จะโพสต์ payload ที่เสร็จสมบูรณ์ไปยัง URL
  ส่วน `none` จะปิดการส่งแบบ fallback โดยตัวรัน
- การเตือนที่สร้างจากแชตที่กำลังใช้งานอยู่จะเก็บเป้าหมายการส่ง live ของแชตไว้
  สำหรับการส่งแบบ fallback ด้วย announce session key ภายในอาจเป็นตัวพิมพ์เล็ก; อย่า
  ใช้มันเป็นแหล่งข้อมูลจริงสำหรับ provider ID ที่แยกตัวพิมพ์เล็กใหญ่ เช่น Matrix
  room ID

## คำสั่งผู้ดูแลที่ใช้บ่อย

การรันแบบ manual:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

รายการใน `cron runs` จะรวมข้อมูลวินิจฉัยการส่ง เช่น เป้าหมาย cron ที่ตั้งใจไว้
เป้าหมายที่ resolve แล้ว การส่งด้วย message-tool การใช้ fallback และสถานะการส่งแล้ว

การเปลี่ยนเป้าหมายเอเจนต์/เซสชัน:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

การปรับการส่ง:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

หมายเหตุเกี่ยวกับการส่งเมื่อเกิดความล้มเหลว:

- รองรับ `delivery.failureDestination` สำหรับงาน isolated
- งานเซสชัน main จะใช้ `delivery.failureDestination` ได้เฉพาะเมื่อการส่งหลัก
  เป็นโหมด `webhook`
- หากคุณไม่ได้ตั้งค่าปลายทางความล้มเหลวใด ๆ และงานนั้นประกาศไปยัง
  channel อยู่แล้ว การแจ้งเตือนความล้มเหลวจะใช้เป้าหมาย announce เดิมนั้นซ้ำ

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [งานตามกำหนดเวลา](/th/automation/cron-jobs)
