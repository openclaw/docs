---
read_when:
    - คุณต้องการอ่านสรุปบทสนทนาที่จัดเก็บไว้จากเทอร์มินัล
    - คุณต้องระบุพาธไปยังไฟล์สรุปบทถอดเสียงในรูปแบบ Markdown
    - คุณกำลังดีบักโครงสร้างการจัดเก็บทรานสคริปต์หลัก
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw transcripts` (แสดงรายการ แสดงรายละเอียด และค้นหาตำแหน่งทรานสคริปต์ที่จัดเก็บไว้)
title: CLI สำหรับข้อความถอดเสียง
x-i18n:
    generated_at: "2026-07-20T05:56:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5615c3051f31f9ae38acb70c8bb00e187b987366d41b8e2049c97ba953aa35d
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

เครื่องมือตรวจสอบแบบอ่านอย่างเดียวสำหรับบทถอดเสียงที่เขียนโดยเครื่องมือเอเจนต์ `transcripts`
การบันทึก การนำเข้า และการสรุปทำงานผ่านเครื่องมือนั้น ไม่ใช่ CLI นี้

อาร์ติแฟกต์อยู่ภายใต้ไดเรกทอรีสถานะ:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

ไดเรกทอรีสถานะเริ่มต้นคือ `~/.openclaw`; เขียนทับได้ด้วย `OPENCLAW_STATE_DIR`
ไดเรกทอรีวันที่มาจากเวลาเริ่มต้นเซสชัน ส่วนไดเรกทอรีเซสชันเป็น
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

| คำสั่ง                       | คำอธิบาย                                     |
| ----------------------------- | ----------------------------------------------- |
| `list`                        | แสดงรายการเซสชันที่จัดเก็บไว้                           |
| `show <session>`              | พิมพ์ `summary.md` ที่จัดเก็บไว้                  |
| `path <session>`              | พิมพ์พาธ `summary.md`                    |
| `path <session> --dir`        | พิมพ์ไดเรกทอรีเซสชัน                    |
| `path <session> --metadata`   | พิมพ์ `metadata.json`                          |
| `path <session> --transcript` | พิมพ์ `transcript.jsonl`                       |
| `--json`                      | พิมพ์เอาต์พุตที่เครื่องอ่านได้ (ใช้ได้กับทุกคำสั่งย่อย) |

`<session>` รับได้ทั้งรหัสเซสชันแบบเดี่ยวหรือ selector ที่ระบุวันที่
(`YYYY-MM-DD/<session>`) ใช้รูปแบบที่ระบุวันที่เมื่อรหัสเซสชันเดียวกัน
ปรากฏมากกว่าหนึ่งวัน เช่น `openclaw transcripts show
2026-05-22/standup` รหัสเซสชันเริ่มต้นประกอบด้วยการประทับเวลาและ
ส่วนต่อท้ายแบบสุ่ม ให้กำหนดรหัสคงที่แก่เซสชันเฉพาะเมื่อรหัสนั้นไม่ซ้ำกันภายในวันนั้น

## เอาต์พุต

`list` พิมพ์หนึ่งบรรทัดที่คั่นด้วยแท็บต่อเซสชัน ได้แก่ selector, เวลาเริ่มต้น, ชื่อเรื่อง,
พาธสรุป

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  การประชุมติดตามงานประจำสัปดาห์  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

selector เป็นค่าที่ปลอดภัยที่สุดสำหรับส่งกลับไปยัง `show` หรือ `path`

`list --json` ส่งคืนออบเจ็กต์ที่มี `sessionId`, `selector`, `date`, `title`,
`startedAt`, `stoppedAt`, `source`, `path`, `summaryPath`, `hasSummary`

`show --json` ส่งคืนเมทาดาทาเซสชันที่จัดเก็บไว้, selector, ไดเรกทอรีเซสชัน,
พาธสรุป และข้อความสรุป Markdown

`path --json` ส่งคืนพาธที่เลือกและระบุว่าไฟล์นั้นมีอยู่หรือไม่

## หลายเซสชันต่อวัน

เซสชันจัดกลุ่มตามวันที่ แล้วจึงตามรหัสเซสชัน การประชุมสิบรายการในหนึ่งวันจะกลายเป็น
โฟลเดอร์พี่น้องสิบโฟลเดอร์:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

ใช้รหัสที่สร้างขึ้นตามค่าเริ่มต้นสำหรับระบบอัตโนมัติ ใช้รหัสคงที่อย่าง `standup` เฉพาะ
เมื่อรหัสนั้นจะไม่ซ้ำกันในวันที่เดียวกัน

## สรุปที่หายไป

เซสชันสดจะเขียน `summary.md` เมื่อเซสชันหยุด ส่วนบทถอดเสียงที่นำเข้า
จะเขียนทันทีหลังการนำเข้า เซสชันอาจปรากฏใน `list` โดยไม่มี
สรุปขณะที่การบันทึกยังทำงานอยู่ หากผู้ให้บริการล้มเหลวระหว่างการหยุด หรือหาก
เมทาดาทาถูกเขียนก่อนที่จะได้รับถ้อยคำใด ๆ

ใช้ `path <session> --transcript` เพื่อตรวจสอบบทถอดเสียงดิบแบบต่อท้ายอย่างเดียว
หรือเรียกใช้การดำเนินการ `summarize` ของเครื่องมือ `transcripts` เพื่อสร้างสรุป
Markdown ใหม่

## การกำหนดค่า

การบันทึกต้องเปิดใช้โดยสมัครใจ (แหล่งที่มาสดสามารถเข้าร่วมและบันทึกเสียงการประชุมได้) เปิดใช้
ด้วย:

```json
{
  "transcripts": {
    "enabled": true
  }
}
```

- `enabled` (ค่าเริ่มต้น `false`): เปิดเครื่องมือ
  กำหนดค่าแหล่งที่มาเริ่มต้นอัตโนมัติด้วย `transcripts.autoStart` แต่ละรายการจะ
  เปิดใช้เมื่อมีรายการนั้นอยู่ หากต้องการปิดใช้แหล่งที่มานั้นให้ละเว้นรายการ `discord-voice`
  เป็นแหล่งที่มาแบบรวมมาให้ซึ่งรองรับการเริ่มต้นอัตโนมัติ และต้องใช้ `guildId` กับ
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
