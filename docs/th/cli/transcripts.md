---
read_when:
    - คุณต้องการอ่านสรุปบทสนทนาที่จัดเก็บไว้จากเทอร์มินัล
    - คุณต้องระบุพาธไปยังไฟล์สรุปบทถอดเสียงในรูปแบบ Markdown
    - คุณกำลังดีบักโครงสร้างการจัดเก็บทรานสคริปต์หลัก
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw transcripts` (แสดงรายการ แสดงรายละเอียด และค้นหาตำแหน่งทรานสคริปต์ที่จัดเก็บไว้)
title: CLI บันทึกการสนทนา
x-i18n:
    generated_at: "2026-07-12T16:02:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

เครื่องมือตรวจสอบแบบอ่านอย่างเดียวสำหรับบทถอดเสียงที่เขียนโดยเครื่องมือเอเจนต์ `transcripts`
การบันทึก การนำเข้า และการสรุปจะทำงานผ่านเครื่องมือนั้น ไม่ใช่ CLI นี้

อาร์ติแฟกต์อยู่ภายใต้ไดเรกทอรีสถานะ:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

ไดเรกทอรีสถานะเริ่มต้นคือ `~/.openclaw`; กำหนดทับด้วย `OPENCLAW_STATE_DIR`
ไดเรกทอรีวันที่มาจากเวลาเริ่มต้นของเซสชัน ส่วนไดเรกทอรีเซสชันคือ
slug ที่ปลอดภัยสำหรับระบบไฟล์ซึ่งสร้างจากรหัสเซสชัน

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

| คำสั่ง                        | คำอธิบาย                                                |
| ----------------------------- | ------------------------------------------------------- |
| `list`                        | แสดงรายการเซสชันที่จัดเก็บไว้                           |
| `show <session>`              | แสดง `summary.md` ที่จัดเก็บไว้                          |
| `path <session>`              | แสดงพาธของ `summary.md`                                 |
| `path <session> --dir`        | แสดงไดเรกทอรีเซสชัน                                    |
| `path <session> --metadata`   | แสดง `metadata.json`                                    |
| `path <session> --transcript` | แสดง `transcript.jsonl`                                 |
| `--json`                      | แสดงผลลัพธ์ที่เครื่องอ่านได้ (ใช้ได้กับทุกคำสั่งย่อย) |

`<session>` รองรับทั้งรหัสเซสชันเปล่าและตัวเลือกที่ระบุวันที่
(`YYYY-MM-DD/<session>`) ใช้รูปแบบที่ระบุวันที่เมื่อมีรหัสเซสชันเดียวกัน
ในมากกว่าหนึ่งวัน เช่น `openclaw transcripts show
2026-05-22/standup` รหัสเซสชันเริ่มต้นประกอบด้วยการประทับเวลาและส่วนต่อท้าย
แบบสุ่ม ให้กำหนดรหัสคงที่แก่เซสชันเฉพาะเมื่อรหัสนั้นไม่ซ้ำกันภายในวันนั้น

## ผลลัพธ์

`list` แสดงหนึ่งบรรทัดที่คั่นด้วยแท็บต่อเซสชัน ได้แก่ ตัวเลือก เวลาเริ่มต้น ชื่อเรื่อง
และพาธสรุป

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  การประชุมประจำสัปดาห์  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

ตัวเลือกคือค่าที่ปลอดภัยที่สุดสำหรับส่งกลับไปยัง `show` หรือ `path`

`list --json` คืนค่าออบเจ็กต์ที่มี `sessionId`, `selector`, `date`, `title`,
`startedAt`, `stoppedAt`, `source`, `path`, `summaryPath`, `hasSummary`

`show --json` คืนค่าเมทาดาทาของเซสชันที่จัดเก็บไว้ ตัวเลือก ไดเรกทอรีเซสชัน
พาธสรุป และข้อความ Markdown ของสรุป

`path --json` คืนค่าพาธที่เลือกและระบุว่าไฟล์นั้นมีอยู่หรือไม่

## หลายเซสชันต่อวัน

เซสชันจะจัดกลุ่มตามวันที่ แล้วจึงตามรหัสเซสชัน การประชุมสิบครั้งในหนึ่งวันจะกลายเป็น
โฟลเดอร์ร่วมระดับสิบโฟลเดอร์:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

ใช้รหัสที่สร้างขึ้นตามค่าเริ่มต้นสำหรับระบบอัตโนมัติ ใช้รหัสคงที่ เช่น `standup` เฉพาะ
เมื่อรหัสนั้นจะไม่เกิดซ้ำในวันที่เดียวกัน

## ไม่มีสรุป

เซสชันสดจะเขียน `summary.md` เมื่อเซสชันหยุด ส่วนบทถอดเสียงที่นำเข้าจะ
เขียนไฟล์นี้ทันทีหลังนำเข้า เซสชันอาจปรากฏใน `list` โดยไม่มีสรุป
ขณะที่การบันทึกยังทำงานอยู่ หากผู้ให้บริการล้มเหลวระหว่างการหยุด หรือหาก
เมทาดาทาถูกเขียนก่อนที่จะได้รับถ้อยคำใด ๆ

ใช้ `path <session> --transcript` เพื่อตรวจสอบบทถอดเสียงดิบแบบเพิ่มต่อท้ายเท่านั้น
หรือเรียกใช้การดำเนินการ `summarize` ของเครื่องมือ `transcripts` เพื่อสร้างสรุป
Markdown ขึ้นใหม่

## การกำหนดค่า

ต้องเลือกเปิดใช้การบันทึก (แหล่งข้อมูลสดสามารถเข้าร่วมและบันทึกเสียงการประชุมได้) เปิดใช้
ด้วย:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled` (ค่าเริ่มต้น `false`): เปิดใช้เครื่องมือ
- `maxUtterances` (ค่าเริ่มต้น `2000`, จำกัดให้อยู่ระหว่าง 1-10000): ขนาดบัฟเฟอร์ถ้อยคำต่อ
  เซสชัน

กำหนดค่าแหล่งข้อมูลที่เริ่มโดยอัตโนมัติด้วย `transcripts.autoStart` แต่ละรายการจะ
เปิดใช้งานเมื่อมีรายการนั้นอยู่ หากต้องการปิดใช้งานแหล่งข้อมูล ให้ละเว้นรายการนั้น `discord-voice`
คือแหล่งข้อมูลแบบรวมมาให้ซึ่งรองรับการเริ่มโดยอัตโนมัติ และต้องระบุ `guildId` กับ
`channelId`:

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      }
    ]
  }
}
```
