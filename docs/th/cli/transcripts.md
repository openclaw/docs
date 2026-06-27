---
read_when:
    - คุณต้องการอ่านสรุปบันทึกการสนทนาที่จัดเก็บไว้จากเทอร์มินัล
    - คุณต้องระบุเส้นทางไปยังสรุปบันทึกถอดความในรูปแบบมาร์กดาวน์
    - คุณกำลังดีบักโครงสร้างการจัดเก็บทรานสคริปต์ของแกนหลัก
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw transcripts` (แสดงรายการ แสดง และระบุตำแหน่งบทถอดความที่จัดเก็บไว้)
title: CLI สำหรับบันทึกการสนทนา
x-i18n:
    generated_at: "2026-06-27T17:24:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae6010cfb4e051182f1c48d0d728b30d054542e1e7983ff15a2432840193f9c0
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

ตรวจสอบทรานสคริปต์ที่เขียนโดยเครื่องมือ `transcripts` หลักของ OpenClaw CLI นี้เป็นแบบอ่านอย่างเดียว; การบันทึก การนำเข้า และการสรุปเป็นหน้าที่ของเครื่องมือเอเจนต์และแหล่งที่มาแบบเริ่มอัตโนมัติที่กำหนดค่าไว้

ใช้ CLI เมื่อต้องการหาโน้ตของเมื่อวาน เปิดไฟล์ Markdown ในเอดิเตอร์ ป้อนทรานสคริปต์ให้เครื่องมืออื่น หรือดีบักว่าเซสชันถูกจัดเก็บไว้ที่ใดบนดิสก์ เครื่องมือนี้ไม่เริ่มหรือหยุดการบันทึก

อาร์ติแฟกต์อยู่ใต้ไดเรกทอรีสถานะของ OpenClaw:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

ไดเรกทอรีสถานะเริ่มต้นคือ `~/.openclaw`; ตั้งค่า `OPENCLAW_STATE_DIR` เพื่อใช้ตำแหน่งอื่น ไดเรกทอรีวันที่มาจากเวลาเริ่มเซสชัน และไดเรกทอรีเซสชันเป็นเซกเมนต์ระบบไฟล์ที่ปลอดภัยซึ่งได้มาจากรหัสเซสชัน

## คำสั่ง

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

- `list`: แสดงรายการเซสชันที่จัดเก็บ ตัวเลือกที่ระบุวันที่ เวลาเริ่มต้น ชื่อ และพาธ `summary.md`
- `show <session>`: พิมพ์ `summary.md` ที่จัดเก็บไว้
- `path <session>`: พิมพ์พาธ `summary.md`
- `path <session> --dir`: พิมพ์ไดเรกทอรีเซสชัน
- `path <session> --metadata`: พิมพ์ `metadata.json`
- `path <session> --transcript`: พิมพ์ `transcript.jsonl`
- `--json`: พิมพ์เอาต์พุตที่เครื่องอ่านได้

เมื่อรหัสเซสชันที่มนุษย์ตั้งซ้ำกันข้ามวัน ให้ใช้ตัวเลือกที่ระบุวันที่จาก `list` เช่น `openclaw transcripts show 2026-05-22/standup` รหัสเซสชันเริ่มต้นมีไทม์สแตมป์และส่วนต่อท้ายแบบสุ่ม; กำหนดค่ารหัสเซสชันแบบคงที่เฉพาะเมื่อรหัสนั้นไม่ซ้ำกันภายในวันเดียวกัน

## เอาต์พุต

`list` พิมพ์หนึ่งเซสชันต่อหนึ่งบรรทัด:

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/alex/.openclaw/transcripts/2026-05-22/standup/summary.md
```

เอาต์พุตคั่นด้วยแท็บ คอลัมน์คือ ตัวเลือก เวลาเริ่มต้น ชื่อ และพาธสรุป ตัวเลือกคือค่าที่ปลอดภัยที่สุดสำหรับส่งกลับไปยัง `show` หรือ `path`

`list --json` พิมพ์ออบเจ็กต์ที่มี:

- `sessionId`
- `selector`
- `date`
- `title`
- `startedAt`
- `stoppedAt`
- `source`
- `path`
- `summaryPath`
- `hasSummary`

`show --json` ส่งคืนเมตาดาต้าเซสชันที่จัดเก็บ ตัวเลือก ไดเรกทอรีเซสชัน พาธสรุป และข้อความสรุป Markdown `path --json` ส่งคืนพาธที่เลือกและระบุว่าไฟล์นั้นมีอยู่หรือไม่

## การประชุมหลายรายการต่อวัน

Transcripts จัดกลุ่มเซสชันตามวันที่ จากนั้นตามรหัสเซสชัน การประชุมสิบรายการในหนึ่งวันจะกลายเป็นโฟลเดอร์พี่น้องสิบโฟลเดอร์:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

ใช้รหัสที่สร้างตามค่าเริ่มต้นสำหรับงานอัตโนมัติส่วนใหญ่ ใช้รหัสคงที่ เช่น `standup` เฉพาะเมื่อรหัสเดียวกันจะไม่ถูกใช้สองครั้งในวันที่เดียวกัน

## สรุปที่หายไป

เซสชันสดเขียน `summary.md` เมื่อเซสชันหยุด ทรานสคริปต์ที่นำเข้าจะเขียน `summary.md` ทันทีหลังนำเข้า เซสชันยังคงปรากฏใน `list` ได้โดยไม่มีสรุป เมื่อการบันทึกยังทำงานอยู่ ผู้ให้บริการล้มเหลวระหว่างการหยุด หรือเมตาดาต้าถูกเขียนก่อนมีคำพูดใดๆ เข้ามา

ใช้ `path <session> --transcript` เพื่อตรวจสอบทรานสคริปต์แบบเขียนต่อท้ายเท่านั้น และใช้แอ็กชันเครื่องมือ `transcripts` ชื่อ `summarize` เพื่อสร้างสรุป Markdown ใหม่

## การกำหนดค่า

การบันทึกทรานสคริปต์เป็นแบบเลือกเปิดใช้ เพราะแหล่งที่มาสดสามารถเข้าร่วมและบันทึกเสียงการประชุมได้ เปิดใช้เครื่องมือด้วย `transcripts.enabled` ระดับบนสุด:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

กำหนดค่าแหล่งที่มาแบบเริ่มอัตโนมัติด้วย `transcripts.autoStart` ใน `openclaw.json` แต่ละรายการจะเปิดใช้เมื่อมีอยู่; ละเว้นรายการเพื่อปิดใช้แหล่งที่มานั้น

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      },
      {
        "providerId": "slack-huddle",
        "accountId": "workspace",
        "channelId": "C123"
      }
    ]
  }
}
```
