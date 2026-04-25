---
read_when:
    - คุณต้องการงานตามกำหนดเวลาและการปลุกให้ทำงาน
    - คุณกำลังดีบักการทำงานของ Cron และ log
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw cron` (กำหนดตารางเวลาและรันงานเบื้องหลัง)
title: Cron
x-i18n:
    generated_at: "2026-04-25T13:44:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 281c0e0e5a3139d2b9cb7cc02afe3b9a9d4a20228a7891eb45c55b7e22c5e1c4
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

จัดการงาน Cron สำหรับตัวจัดตารางเวลาของ Gateway

ที่เกี่ยวข้อง:

- งาน Cron: [Cron jobs](/th/automation/cron-jobs)

เคล็ดลับ: รัน `openclaw cron --help` เพื่อดูพื้นผิวคำสั่งทั้งหมด

หมายเหตุ: `openclaw cron list` และ `openclaw cron show <job-id>` จะแสดงตัวอย่าง
เส้นทางการส่งที่ resolve แล้ว สำหรับ `channel: "last"` ตัวอย่างจะแสดงว่า
เส้นทางถูก resolve จากเซสชัน main/current หรือจะปิดแบบ fail closed

หมายเหตุ: งาน `cron add` แบบ isolated ใช้การส่งแบบ `--announce` เป็นค่าเริ่มต้น ใช้ `--no-deliver` เพื่อเก็บ
ผลลัพธ์ไว้ภายใน `--deliver` ยังคงใช้ได้ในฐานะชื่อแฝงที่เลิกใช้งานแล้วของ `--announce`

หมายเหตุ: การส่งไปยังแชตของ Cron แบบ isolated เป็นแบบใช้ร่วมกัน `--announce` คือการส่งแบบ fallback ของ runner
สำหรับคำตอบสุดท้าย; `--no-deliver` ปิด fallback นี้ แต่
ไม่ได้ลบเครื่องมือ `message` ของ Agent เมื่อมีเส้นทางแชตให้ใช้

หมายเหตุ: งานแบบ one-shot (`--at`) จะถูกลบหลังสำเร็จเป็นค่าเริ่มต้น ใช้ `--keep-after-run` เพื่อเก็บไว้

หมายเหตุ: `--session` รองรับ `main`, `isolated`, `current` และ `session:<id>`
ใช้ `current` เพื่อผูกกับเซสชันที่กำลังใช้งานอยู่ขณะสร้าง หรือ `session:<id>` สำหรับ
คีย์เซสชันถาวรแบบระบุชัด

หมายเหตุ: `--session isolated` จะสร้าง transcript/session id ใหม่สำหรับแต่ละการรัน
ค่ากำหนดที่ปลอดภัยและการเขียนทับ model/auth ที่ผู้ใช้เลือกอย่างชัดเจนอาจถูกส่งต่อได้ แต่
บริบทของบทสนทนารอบข้างจะไม่ถูกส่งต่อ: การกำหนดเส้นทางช่องทาง/กลุ่ม, นโยบายส่ง/คิว,
elevation, origin และการผูก runtime ของ ACP จะถูกรีเซ็ตสำหรับการรันแบบ isolated ใหม่

หมายเหตุ: สำหรับงาน CLI แบบ one-shot ค่า datetime ของ `--at` ที่ไม่มี offset จะถือเป็น UTC เว้นแต่คุณจะส่ง
`--tz <iana>` ด้วย ซึ่งจะตีความเวลา wall-clock ในท้องถิ่นนั้นตาม timezone ที่กำหนด

หมายเหตุ: ตอนนี้งานที่เกิดซ้ำใช้ exponential retry backoff หลังเกิดข้อผิดพลาดต่อเนื่อง (30s → 1m → 5m → 15m → 60m) แล้วจะกลับไปใช้ตารางเวลาปกติหลังการรันที่สำเร็จครั้งถัดไป

หมายเหตุ: ตอนนี้ `openclaw cron run` จะคืนค่าทันทีที่จัดคิวการรันด้วยตนเองไว้แล้ว การตอบกลับที่สำเร็จจะมี `{ ok: true, enqueued: true, runId }`; ใช้ `openclaw cron runs --id <job-id>` เพื่อติดตามผลลัพธ์ในภายหลัง

หมายเหตุ: `openclaw cron run <job-id>` จะบังคับรันเป็นค่าเริ่มต้น ใช้ `--due` เพื่อคง
พฤติกรรมเดิมแบบ "รันเฉพาะเมื่อถึงกำหนด"

หมายเหตุ: เทิร์น Cron แบบ isolated จะระงับคำตอบที่ล้าสมัยซึ่งมีแต่การตอบรับเท่านั้น หาก
ผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราว และไม่มีการรัน subagent สืบทอดใด
รับผิดชอบต่อคำตอบสุดท้าย Cron จะ re-prompt หนึ่งครั้งเพื่อเอาผลลัพธ์จริงก่อนส่ง

หมายเหตุ: หากการรัน Cron แบบ isolated ส่งคืนเฉพาะ silent token (`NO_REPLY` /
`no_reply`) Cron จะระงับทั้งการส่งออกโดยตรงและเส้นทาง fallback แบบสรุปที่เข้าคิว
ดังนั้นจะไม่มีการโพสต์อะไรกลับไปยังแชต

หมายเหตุ: `cron add|edit --model ...` ใช้ model ที่เลือกและได้รับอนุญาตนั้นสำหรับงาน
หาก model ไม่ได้รับอนุญาต Cron จะเตือนและ fallback ไปใช้การเลือก model ของ agent/default ของงานแทน
สาย fallback ที่กำหนดค่าไว้ยังคงมีผล แต่การเขียนทับ model แบบธรรมดาที่ไม่มีรายการ fallback ต่อ-งานอย่างชัดเจน จะไม่ผนวก primary ของ Agent เป็นเป้าหมาย retry เพิ่มเติมแบบซ่อนอีกต่อไป

หมายเหตุ: ลำดับความสำคัญของ model สำหรับ Cron แบบ isolated คือ Gmail-hook override ก่อน จากนั้น
`--model` ต่อ-งาน จากนั้น user-selected stored cron-session model override แล้วจึงเป็น
การเลือกแบบ agent/default ปกติ

หมายเหตุ: fast mode ของ Cron แบบ isolated จะอิงตามการเลือก live model ที่ resolve แล้ว
การกำหนดค่า model `params.fastMode` จะมีผลเป็นค่าเริ่มต้น แต่ session `fastMode`
override ที่จัดเก็บไว้ยังคงมีลำดับความสำคัญเหนือการกำหนดค่า

หมายเหตุ: หากการรันแบบ isolated โยน `LiveSessionModelSwitchError` Cron จะบันทึก
provider/model ที่ถูกสลับ (และ auth profile override ที่ถูกสลับเมื่อมี) สำหรับ
การรันที่กำลังใช้งานอยู่ก่อน retry ลูป retry ภายนอกถูกจำกัดไว้ที่ 2 ครั้งสำหรับการสลับ
หลังจากความพยายามเริ่มต้น จากนั้นจะยกเลิกแทนที่จะวนลูปไม่สิ้นสุด

หมายเหตุ: การแจ้งเตือนความล้มเหลวจะใช้ `delivery.failureDestination` ก่อน จากนั้น
`cron.failureDestination` แบบ global และสุดท้าย fallback ไปยังเป้าหมาย
announce หลักของงานเมื่อไม่มีการกำหนดปลายทางความล้มเหลวไว้โดยชัดเจน

หมายเหตุ: retention/pruning ควบคุมผ่านการกำหนดค่า:

- `cron.sessionRetention` (ค่าเริ่มต้น `24h`) จะ prune เซสชันการรันแบบ isolated ที่เสร็จสิ้นแล้ว
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` จะ prune `~/.openclaw/cron/runs/<jobId>.jsonl`

หมายเหตุสำหรับการอัปเกรด: หากคุณมีงาน Cron รุ่นเก่าจากก่อนรูปแบบการส่ง/การจัดเก็บปัจจุบัน ให้รัน
`openclaw doctor --fix` ตอนนี้ doctor จะ normalize ฟิลด์ Cron แบบเดิม (`jobId`, `schedule.cron`,
ฟิลด์การส่งระดับบนสุดรวมถึง `threadId` แบบเดิม, ชื่อแฝงการส่ง `provider` ใน payload) และ migrate งาน fallback แบบ Webhook อย่างง่ายที่มี
`notify: true` ไปเป็นการส่ง Webhook แบบชัดเจนเมื่อมีการกำหนด `cron.webhook`

## การแก้ไขทั่วไป

อัปเดตการตั้งค่าการส่งโดยไม่เปลี่ยนข้อความ:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

ปิดการส่งสำหรับงานแบบ isolated:

```bash
openclaw cron edit <job-id> --no-deliver
```

เปิดใช้บริบท bootstrap แบบ lightweight สำหรับงานแบบ isolated:

```bash
openclaw cron edit <job-id> --light-context
```

ประกาศไปยังช่องทางที่ระบุ:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

สร้างงานแบบ isolated พร้อมบริบท bootstrap แบบ lightweight:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` ใช้ได้กับงานเทิร์น Agent แบบ isolated เท่านั้น สำหรับการรัน Cron โหมด lightweight จะทำให้บริบท bootstrap ว่างเปล่าแทนการ inject ชุด bootstrap ของเวิร์กสเปซแบบเต็ม

หมายเหตุเรื่องความเป็นเจ้าของการส่ง:

- การส่งไปยังแชตของ Cron แบบ isolated เป็นแบบใช้ร่วมกัน Agent สามารถส่งโดยตรงด้วย
  เครื่องมือ `message` เมื่อมีเส้นทางแชตให้ใช้
- `announce` จะ fallback-deliver คำตอบสุดท้ายเฉพาะเมื่อ Agent ไม่ได้ส่ง
  โดยตรงไปยังเป้าหมายที่ resolve แล้ว `webhook` จะโพสต์ payload ที่เสร็จแล้วไปยัง URL
  `none` จะปิดการส่งแบบ fallback ของ runner

## คำสั่งผู้ดูแลระบบที่ใช้บ่อย

การรันด้วยตนเอง:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

รายการ `cron runs` จะรวมข้อมูลวินิจฉัยการส่ง พร้อมเป้าหมาย Cron ที่ตั้งใจไว้
เป้าหมายที่ resolve แล้ว การส่งด้วย message-tool การใช้ fallback และสถานะ delivered

การเปลี่ยนเป้าหมาย Agent/เซสชัน:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

การปรับแต่งการส่ง:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

หมายเหตุเรื่องการส่งเมื่อเกิดความล้มเหลว:

- รองรับ `delivery.failureDestination` สำหรับงานแบบ isolated
- งาน main-session ใช้ `delivery.failureDestination` ได้เฉพาะเมื่อโหมดการส่งหลัก
  เป็น `webhook`
- หากคุณไม่ได้ตั้งค่าปลายทางความล้มเหลวใด ๆ และงานนั้นประกาศไปยัง
  ช่องทางอยู่แล้ว การแจ้งเตือนความล้มเหลวจะใช้เป้าหมาย announce เดียวกันนั้นซ้ำ

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
- [Scheduled tasks](/th/automation/cron-jobs)
