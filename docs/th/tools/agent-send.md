---
read_when:
    - คุณต้องการเรียกใช้เอเจนต์จากสคริปต์หรือบรรทัดคำสั่ง
    - คุณต้องส่งคำตอบของเอเจนต์ไปยังช่องแชตด้วยโปรแกรม
summary: เรียกใช้รอบการทำงานของเอเจนต์จาก CLI และเลือกส่งคำตอบไปยังช่องทางต่าง ๆ ได้
title: การส่งของเอเจนต์
x-i18n:
    generated_at: "2026-07-12T16:49:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` เรียกใช้การทำงานของเอเจนต์หนึ่งรอบจากบรรทัดคำสั่งโดยไม่มี
ข้อความแชตขาเข้า ใช้สำหรับเวิร์กโฟลว์แบบสคริปต์ การทดสอบ และ
การส่งผลลัพธ์ด้วยโปรแกรม เอกสารอ้างอิงแฟล็กและพฤติกรรมทั้งหมด:
[เอกสารอ้างอิง CLI ของเอเจนต์](/th/cli/agent)

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เรียกใช้การทำงานของเอเจนต์แบบง่ายหนึ่งรอบ">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    ส่งข้อความผ่าน Gateway และพิมพ์คำตอบ

  </Step>

  <Step title="ส่งพรอมต์หลายบรรทัดจากไฟล์">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    อ่านไฟล์ UTF-8 ที่ถูกต้องเป็นเนื้อหาข้อความของเอเจนต์

  </Step>

  <Step title="ระบุเอเจนต์หรือเซสชันที่ต้องการ">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"

    # Target an exact session key
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
    ```

  </Step>

  <Step title="ส่งคำตอบไปยังช่องทาง">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## แฟล็ก

| แฟล็ก                       | คำอธิบาย                                                                 |
| --------------------------- | ------------------------------------------------------------------------- |
| `--message <text>`          | ข้อความแบบอินไลน์ที่จะส่ง                                                  |
| `--message-file <path>`     | อ่านข้อความจากไฟล์ UTF-8 ที่ถูกต้อง                                       |
| `--to <dest>`               | สร้างคีย์เซสชันจากเป้าหมาย (โทรศัพท์, รหัสแชต)                            |
| `--session-key <key>`       | ใช้คีย์เซสชันที่ระบุอย่างชัดเจน                                           |
| `--agent <id>`              | ระบุเอเจนต์ที่กำหนดค่าไว้ (ใช้เซสชัน `main` ของเอเจนต์นั้น)               |
| `--session-id <id>`         | ใช้เซสชันที่มีอยู่แล้วซ้ำตามรหัส                                          |
| `--model <id>`              | แทนที่โมเดลสำหรับการเรียกใช้ครั้งนี้ (`provider/model` หรือรหัสโมเดล)     |
| `--local`                   | บังคับใช้รันไทม์แบบฝังภายในเครื่อง (ข้าม Gateway)                         |
| `--deliver`                 | ส่งคำตอบไปยังช่องทางแชต                                                    |
| `--channel <name>`          | ช่องทางการส่ง; เมื่อใช้ร่วมกับ `--agent` + `--to` จะใช้กับขอบเขต DM ด้วย |
| `--reply-to <target>`       | แทนที่เป้าหมายการส่ง                                                       |
| `--reply-channel <name>`    | แทนที่ช่องทางการส่ง                                                        |
| `--reply-account <id>`      | แทนที่รหัสบัญชีสำหรับการส่ง                                                |
| `--thinking <level>`        | กำหนดระดับการคิดสำหรับโปรไฟล์โมเดลที่เลือก                               |
| `--verbose <on\|full\|off>` | บันทึกระดับรายละเอียดสำหรับเซสชัน (`full` จะบันทึกผลลัพธ์ของเครื่องมือด้วย) |
| `--timeout <seconds>`       | แทนที่ระยะหมดเวลาของเอเจนต์ (ค่าเริ่มต้น 600 หรือค่าจากการกำหนดค่า)      |
| `--json`                    | แสดงผลเป็น JSON ที่มีโครงสร้าง                                             |

## พฤติกรรม

- โดยค่าเริ่มต้น CLI จะทำงาน **ผ่าน Gateway** เพิ่ม `--local` เพื่อบังคับใช้
  รันไทม์แบบฝังบนเครื่องปัจจุบัน
- ส่ง `--message` หรือ `--message-file` อย่างใดอย่างหนึ่งเท่านั้น ข้อความจากไฟล์จะคง
  เนื้อหาหลายบรรทัดไว้หลังจากนำ UTF-8 BOM ที่อาจมีออก
- หากคำขอไปยัง Gateway ล้มเหลว CLI จะ **สลับไปใช้** การทำงานแบบฝังภายในเครื่อง
  หาก Gateway หมดเวลา ระบบจะสลับไปใช้เซสชันใหม่แทนการทำงานแข่งกับ
  ทรานสคริปต์เดิม
- การเลือกเซสชัน: `--to` สร้างคีย์เซสชัน (เป้าหมายกลุ่ม/ช่องทาง
  จะรักษาการแยกจากกัน ส่วนแชตโดยตรงจะรวมเป็น `main`) เมื่อใช้ `--agent`,
  `--channel` และ `--to` ร่วมกัน การกำหนดเส้นทางจะเป็นไปตามผู้รับมาตรฐานของช่องทาง
  และ `session.dmScope` ข้อมูลประจำตัวที่เสถียรสำหรับการส่งออกเท่านั้นจะใช้
  เซสชันที่ผู้ให้บริการเป็นเจ้าของ ซึ่งแยกจากเซสชันหลักของเอเจนต์
- `--session-key` เลือกคีย์ที่ระบุอย่างชัดเจน คีย์ที่ขึ้นต้นด้วยเอเจนต์ต้องใช้
  `agent:<agent-id>:<session-key>` และเมื่อระบุทั้งสองค่า `--agent` ต้องตรงกับรหัสเอเจนต์นั้น
  คีย์เปล่าที่ไม่ใช่ค่าเซนทิเนลจะถูกกำหนดขอบเขตตาม `--agent` เมื่อระบุไว้
  ตัวอย่างเช่น `--agent ops --session-key incident-42` จะกำหนดเส้นทางไปยัง
  `agent:ops:incident-42` หากไม่มี `--agent` คีย์เปล่าที่ไม่ใช่ค่าเซนทิเนลจะถูกกำหนดขอบเขต
  ตามเอเจนต์เริ่มต้นที่กำหนดค่าไว้ ค่า `global` และ `unknown` แบบตรงตัวจะยังคง
  ไม่มีขอบเขตเฉพาะเมื่อไม่ได้ระบุ `--agent` เท่านั้น ส่วนเส้นทางสำรองแบบฝัง
  จะแปลงเซสชันเซนทิเนลเหล่านั้นเป็นเอเจนต์เริ่มต้นที่กำหนดค่าไว้
- `--reply-channel` และ `--reply-account` มีผลต่อการส่งเท่านั้น
- แฟล็กระดับการคิดและระดับรายละเอียดจะถูกบันทึกไว้ในที่เก็บเซสชัน
- ผลลัพธ์: เป็นข้อความธรรมดาโดยค่าเริ่มต้น หรือใช้ `--json` สำหรับเพย์โหลดแบบมีโครงสร้างพร้อมข้อมูลเมตา
- เมื่อใช้ `--json --deliver` JSON จะรวมสถานะการส่งสำหรับการส่งที่
  สำเร็จ ถูกระงับ สำเร็จบางส่วน และล้มเหลว ดู
  [สถานะการส่ง JSON](/th/cli/agent#json-delivery-status)

## ตัวอย่าง

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with a model override
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Multiline prompt from a file
openclaw agent --agent ops --message-file ./task.md

# Exact session key
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Legacy key scoped to an agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="เอกสารอ้างอิง CLI ของเอเจนต์" href="/th/cli/agent" icon="terminal">
    เอกสารอ้างอิงแฟล็กและตัวเลือกทั้งหมดของ `openclaw agent`
  </Card>
  <Card title="เอเจนต์ย่อย" href="/th/tools/subagents" icon="users">
    การสร้างเอเจนต์ย่อยในเบื้องหลัง
  </Card>
  <Card title="เซสชัน" href="/th/concepts/session" icon="comments">
    วิธีการทำงานของคีย์เซสชัน และวิธีที่ `--to`, `--agent` และ `--session-id` ใช้ระบุคีย์เหล่านั้น
  </Card>
  <Card title="คำสั่งแบบสแลช" href="/th/tools/slash-commands" icon="slash">
    แค็ตตาล็อกคำสั่งเนทีฟที่ใช้ภายในเซสชันของเอเจนต์
  </Card>
</CardGroup>
