---
read_when:
    - คุณต้องการทริกเกอร์การรันเอเจนต์จากสคริปต์หรือบรรทัดคำสั่ง
    - คุณต้องส่งคำตอบของเอเจนต์ไปยังช่องแชทด้วยโปรแกรม
summary: เรียกใช้รอบการทำงานของเอเจนต์จาก CLI และเลือกส่งคำตอบไปยังช่องทางได้
title: ส่งโดยเอเจนต์
x-i18n:
    generated_at: "2026-06-27T18:25:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` รันหนึ่งรอบการทำงานของเอเจนต์จากบรรทัดคำสั่งโดยไม่ต้องมี
ข้อความแชทขาเข้า ใช้สำหรับเวิร์กโฟลว์แบบสคริปต์ การทดสอบ และ
การส่งแบบโปรแกรม

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="รันหนึ่งรอบการทำงานของเอเจนต์แบบง่าย">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    คำสั่งนี้ส่งข้อความผ่าน Gateway และพิมพ์คำตอบออกมา

  </Step>

  <Step title="ส่งพรอมต์หลายบรรทัดจากไฟล์">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    คำสั่งนี้อ่านไฟล์ UTF-8 ที่ถูกต้องเป็นเนื้อหาข้อความของเอเจนต์

  </Step>

  <Step title="กำหนดเป้าหมายเป็นเอเจนต์หรือเซสชันเฉพาะ">
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

| แฟล็ก                         | คำอธิบาย                                                   |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | ข้อความแบบอินไลน์ที่จะส่ง                                  |
| `--message-file \<path\>`     | อ่านข้อความจากไฟล์ UTF-8 ที่ถูกต้อง                        |
| `--to \<dest\>`               | สร้างคีย์เซสชันจากเป้าหมาย (โทรศัพท์, chat id)             |
| `--session-key \<key\>`       | ใช้คีย์เซสชันที่ระบุชัดเจน                                 |
| `--agent \<id\>`              | กำหนดเป้าหมายเป็นเอเจนต์ที่ตั้งค่าไว้ (ใช้เซสชัน `main`)   |
| `--session-id \<id\>`         | ใช้เซสชันเดิมซ้ำตาม id                                     |
| `--local`                     | บังคับใช้รันไทม์ฝังในเครื่อง (ข้าม Gateway)                |
| `--deliver`                   | ส่งคำตอบไปยังช่องทางแชท                                    |
| `--channel \<name\>`          | ช่องทางส่ง (whatsapp, telegram, discord, slack, etc.)      |
| `--reply-to \<target\>`       | แทนที่เป้าหมายการส่ง                                       |
| `--reply-channel \<name\>`    | แทนที่ช่องทางการส่ง                                        |
| `--reply-account \<id\>`      | แทนที่ id บัญชีสำหรับส่ง                                   |
| `--thinking \<level\>`        | ตั้งระดับ thinking สำหรับโปรไฟล์โมเดลที่เลือก              |
| `--verbose \<on\|full\|off\>` | ตั้งระดับ verbose                                          |
| `--timeout \<seconds\>`       | แทนที่ timeout ของเอเจนต์                                  |
| `--json`                      | แสดงผลเป็น JSON ที่มีโครงสร้าง                             |

## พฤติกรรม

- โดยค่าเริ่มต้น CLI จะไป **ผ่าน Gateway** เพิ่ม `--local` เพื่อบังคับใช้
  รันไทม์แบบฝังในเครื่องปัจจุบัน
- ส่งค่าเพียงหนึ่งอย่างระหว่าง `--message` หรือ `--message-file` ข้อความจากไฟล์จะคง
  เนื้อหาหลายบรรทัดไว้หลังจากลบ UTF-8 BOM ที่เป็นทางเลือกออก
- หากติดต่อ Gateway ไม่ได้ CLI จะ **ถอยกลับ** ไปใช้การรันแบบฝังในเครื่อง
- การเลือกเซสชัน: `--to` สร้างคีย์เซสชัน (เป้าหมายกลุ่ม/ช่องทาง
  จะคงการแยกไว้; แชทโดยตรงจะรวมเป็น `main`)
- `--session-key` เลือกคีย์ที่ระบุชัดเจน คีย์ที่มีคำนำหน้าเอเจนต์ต้องใช้
  `agent:<agent-id>:<session-key>` และ `--agent` ต้องตรงกับ agent id นั้นเมื่อ
  ระบุทั้งสองอย่าง คีย์เปล่าที่ไม่ใช่ sentinel จะอยู่ภายใต้ขอบเขตของ `--agent` เมื่อ
  ระบุไว้ ตัวอย่างเช่น `--agent ops --session-key incident-42` จะกำหนดเส้นทางไปที่
  `agent:ops:incident-42` หากไม่มี `--agent` คีย์เปล่าที่ไม่ใช่ sentinel จะอยู่ภายใต้ขอบเขต
  ของเอเจนต์ค่าเริ่มต้นที่ตั้งค่าไว้ ค่า literal `global` และ `unknown` จะยังคง
  ไม่ถูกกำหนดขอบเขตเฉพาะเมื่อไม่มีการระบุ `--agent`; ในกรณีนั้น fallback แบบฝัง
  และ ownership ของ store จะใช้เอเจนต์ค่าเริ่มต้นที่ตั้งค่าไว้
- แฟล็ก thinking และ verbose จะคงอยู่ใน session store
- เอาต์พุต: ค่าเริ่มต้นเป็นข้อความธรรมดา หรือใช้ `--json` สำหรับ payload + metadata ที่มีโครงสร้าง
- เมื่อใช้ `--json --deliver` JSON จะรวมสถานะการส่งสำหรับการส่งที่สำเร็จ,
  ถูกระงับ, บางส่วน และล้มเหลว ดู
  [สถานะการส่ง JSON](/th/cli/agent#json-delivery-status)

## ตัวอย่าง

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

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

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="เอกสารอ้างอิง Agent CLI" href="/th/cli/agent" icon="terminal">
    เอกสารอ้างอิงแฟล็กและตัวเลือกทั้งหมดของ `openclaw agent`
  </Card>
  <Card title="เอเจนต์ย่อย" href="/th/tools/subagents" icon="users">
    การสร้างเอเจนต์ย่อยเบื้องหลัง
  </Card>
  <Card title="เซสชัน" href="/th/concepts/session" icon="comments">
    คีย์เซสชันทำงานอย่างไร และ `--to`, `--agent`, และ `--session-id` resolve คีย์เหล่านั้นอย่างไร
  </Card>
  <Card title="คำสั่ง Slash" href="/th/tools/slash-commands" icon="slash">
    แค็ตตาล็อกคำสั่ง native ที่ใช้ภายในเซสชันของเอเจนต์
  </Card>
</CardGroup>
