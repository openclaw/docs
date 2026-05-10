---
read_when:
    - คุณต้องการเริ่มการรันเอเจนต์จากสคริปต์หรือบรรทัดคำสั่ง
    - คุณต้องส่งคำตอบของเอเจนต์ไปยังช่องแชทผ่านทางโปรแกรม
summary: เรียกใช้รอบการทำงานของเอเจนต์จาก CLI และเลือกส่งคำตอบไปยังช่องทางต่าง ๆ ได้
title: การส่งโดยเอเจนต์
x-i18n:
    generated_at: "2026-05-10T19:58:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2e1b05414312321e7136867bb8b998754d4a46289cc02764eb61d83f7239af1
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` เรียกใช้เอเจนต์หนึ่งรอบจากบรรทัดคำสั่งโดยไม่ต้องมี
ข้อความแชตขาเข้า ใช้สำหรับเวิร์กโฟลว์แบบสคริปต์ การทดสอบ และ
การส่งแบบโปรแกรม

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Run a simple agent turn">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    คำสั่งนี้จะส่งข้อความผ่าน Gateway และพิมพ์คำตอบออกมา

  </Step>

  <Step title="Target a specific agent or session">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Deliver the reply to a channel">
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
| `--to \<dest\>`               | สร้างคีย์เซสชันจากเป้าหมาย (โทรศัพท์, chat id)           |
| `--agent \<id\>`              | กำหนดเป้าหมายเป็นเอเจนต์ที่ตั้งค่าไว้ (ใช้เซสชัน `main` ของเอเจนต์นั้น)         |
| `--session-id \<id\>`         | ใช้เซสชันที่มีอยู่ตาม id                             |
| `--local`                     | บังคับใช้รันไทม์แบบฝังในเครื่อง (ข้าม Gateway)                 |
| `--deliver`                   | ส่งคำตอบไปยังช่องทางแชต                            |
| `--channel \<name\>`          | ช่องทางการส่ง (whatsapp, telegram, discord, slack ฯลฯ) |
| `--reply-to \<target\>`       | ระบุเป้าหมายการส่งแทนค่าเริ่มต้น                                    |
| `--reply-channel \<name\>`    | ระบุช่องทางการส่งแทนค่าเริ่มต้น                                   |
| `--reply-account \<id\>`      | ระบุ id บัญชีการส่งแทนค่าเริ่มต้น                                |
| `--thinking \<level\>`        | ตั้งค่าระดับการคิดสำหรับโปรไฟล์โมเดลที่เลือก           |
| `--verbose \<on\|full\|off\>` | ตั้งค่าระดับ verbose                                           |
| `--timeout \<seconds\>`       | กำหนด timeout ของเอเจนต์แทนค่าเริ่มต้น                                      |
| `--json`                      | ส่งออก JSON แบบมีโครงสร้าง                                      |

## พฤติกรรม

- โดยค่าเริ่มต้น CLI จะทำงาน **ผ่าน Gateway** เพิ่ม `--local` เพื่อบังคับใช้
  รันไทม์แบบฝังในเครื่องปัจจุบัน
- หากเข้าถึง Gateway ไม่ได้ CLI จะ **fallback** ไปใช้การรันแบบฝังในเครื่อง
- การเลือกเซสชัน: `--to` สร้างคีย์เซสชัน (เป้าหมายแบบกลุ่ม/ช่องทาง
  จะคงการแยกกันไว้; แชตโดยตรงจะถูกรวมเป็น `main`)
- แฟล็ก thinking และ verbose จะถูกเก็บต่อเนื่องไว้ใน session store
- เอาต์พุต: ค่าเริ่มต้นเป็นข้อความธรรมดา หรือใช้ `--json` สำหรับ payload + metadata แบบมีโครงสร้าง
- เมื่อใช้ `--json --deliver` JSON จะรวมสถานะการส่งสำหรับการส่งที่ส่งแล้ว,
  ถูกระงับ, บางส่วน และล้มเหลว ดู
  [สถานะการส่ง JSON](/th/cli/agent#json-delivery-status)

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
  <Card title="Agent CLI reference" href="/th/cli/agent" icon="terminal">
    เอกสารอ้างอิงแฟล็กและตัวเลือกทั้งหมดของ `openclaw agent`
  </Card>
  <Card title="Sub-agents" href="/th/tools/subagents" icon="users">
    การสร้างเอเจนต์ย่อยเบื้องหลัง
  </Card>
  <Card title="Sessions" href="/th/concepts/session" icon="comments">
    วิธีการทำงานของคีย์เซสชัน และวิธีที่ `--to`, `--agent` และ `--session-id` resolve คีย์เหล่านั้น
  </Card>
  <Card title="Slash commands" href="/th/tools/slash-commands" icon="slash">
    แค็ตตาล็อกคำสั่ง native ที่ใช้ภายในเซสชันของเอเจนต์
  </Card>
</CardGroup>
