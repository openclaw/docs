---
read_when:
    - คุณต้องการทริกเกอร์การรันเอเจนต์จากสคริปต์หรือบรรทัดคำสั่ง
    - คุณต้องส่งการตอบกลับของเอเจนต์ไปยังช่องแชตด้วยโปรแกรม
summary: เรียกใช้รอบการทำงานของเอเจนต์จาก CLI และเลือกส่งคำตอบไปยังช่องทางต่าง ๆ ได้
title: การส่งของเอเจนต์
x-i18n:
    generated_at: "2026-05-06T09:32:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1339ebd74e2349669942ff93f200b53a69ad05f2186d6ff76437c779f312a291
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` เรียกใช้หนึ่งรอบการทำงานของเอเจนต์จากบรรทัดคำสั่ง โดยไม่ต้องมีข้อความแชทขาเข้า ใช้สำหรับเวิร์กโฟลว์แบบสคริปต์ การทดสอบ และการส่งมอบแบบโปรแกรมได้

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เรียกใช้รอบการทำงานของเอเจนต์แบบง่าย">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    คำสั่งนี้ส่งข้อความผ่าน Gateway และพิมพ์คำตอบออกมา

  </Step>

  <Step title="กำหนดเอเจนต์หรือเซสชันเฉพาะ">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
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

| แฟล็ก                          | คำอธิบาย                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | ข้อความที่จะส่ง (จำเป็น)                                  |
| `--to \<dest\>`               | สร้างคีย์เซสชันจากเป้าหมาย (โทรศัพท์, ID แชท)           |
| `--agent \<id\>`              | กำหนดเอเจนต์ที่ตั้งค่าไว้ (ใช้เซสชัน `main` ของเอเจนต์นั้น)         |
| `--session-id \<id\>`         | ใช้เซสชันที่มีอยู่ซ้ำตาม ID                             |
| `--local`                     | บังคับใช้รันไทม์แบบฝังในเครื่อง (ข้าม Gateway)                 |
| `--deliver`                   | ส่งคำตอบไปยังช่องทางแชท                            |
| `--channel \<name\>`          | ช่องทางส่งมอบ (whatsapp, telegram, discord, slack ฯลฯ) |
| `--reply-to \<target\>`       | เขียนทับเป้าหมายการส่งมอบ                                    |
| `--reply-channel \<name\>`    | เขียนทับช่องทางการส่งมอบ                                   |
| `--reply-account \<id\>`      | เขียนทับ ID บัญชีการส่งมอบ                                |
| `--thinking \<level\>`        | ตั้งค่าระดับการคิดสำหรับโปรไฟล์โมเดลที่เลือก           |
| `--verbose \<on\|full\|off\>` | ตั้งค่าระดับ verbose                                           |
| `--timeout \<seconds\>`       | เขียนทับระยะหมดเวลาของเอเจนต์                                      |
| `--json`                      | ส่งออก JSON แบบมีโครงสร้าง                                      |

## ลักษณะการทำงาน

- โดยค่าเริ่มต้น CLI จะทำงาน **ผ่าน Gateway** เพิ่ม `--local` เพื่อบังคับใช้รันไทม์แบบฝังในเครื่องปัจจุบัน
- หากเชื่อมต่อ Gateway ไม่ได้ CLI จะ **ถอยกลับ** ไปใช้การรันแบบฝังในเครื่อง
- การเลือกเซสชัน: `--to` สร้างคีย์เซสชัน (เป้าหมายแบบกลุ่ม/ช่องทางจะรักษาการแยกไว้; แชทโดยตรงจะรวมเป็น `main`)
- แฟล็ก thinking และ verbose จะถูกคงไว้ในที่เก็บเซสชัน
- เอาต์พุต: ค่าเริ่มต้นเป็นข้อความธรรมดา หรือใช้ `--json` สำหรับเพย์โหลดแบบมีโครงสร้าง + เมทาดาทา

## ตัวอย่าง

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ข้อมูลอ้างอิง Agent CLI" href="/th/cli/agent" icon="terminal">
    ข้อมูลอ้างอิงแฟล็กและตัวเลือกทั้งหมดของ `openclaw agent`
  </Card>
  <Card title="เอเจนต์ย่อย" href="/th/tools/subagents" icon="users">
    การสร้างเอเจนต์ย่อยในเบื้องหลัง
  </Card>
  <Card title="เซสชัน" href="/th/concepts/session" icon="comments">
    วิธีการทำงานของคีย์เซสชัน และวิธีที่ `--to`, `--agent` และ `--session-id` แปลงเป็นเซสชัน
  </Card>
  <Card title="คำสั่ง Slash" href="/th/tools/slash-commands" icon="slash">
    แค็ตตาล็อกคำสั่งเนทีฟที่ใช้ภายในเซสชันของเอเจนต์
  </Card>
</CardGroup>
