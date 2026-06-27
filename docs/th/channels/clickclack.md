---
read_when:
    - การเชื่อมต่อ OpenClaw กับพื้นที่ทำงาน ClickClack
    - การทดสอบตัวตนบอต ClickClack
summary: การตั้งค่าช่องทาง bot-token ของ ClickClack และไวยากรณ์เป้าหมาย
title: คลิกแคลก
x-i18n:
    generated_at: "2026-06-27T17:09:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack เชื่อมต่อ OpenClaw กับพื้นที่ทำงาน ClickClack ที่โฮสต์เองผ่านโทเคนบอต ClickClack แบบชั้นหนึ่ง

ใช้สิ่งนี้เมื่อคุณต้องการให้เอเจนต์ OpenClaw ปรากฏเป็นผู้ใช้บอต ClickClack ClickClack รองรับบอตบริการอิสระและบอตที่ผู้ใช้เป็นเจ้าของ บอตที่ผู้ใช้เป็นเจ้าของจะเก็บ `owner_user_id` และได้รับเฉพาะขอบเขตโทเคนที่คุณให้สิทธิ์

## การตั้งค่าแบบรวดเร็ว

สร้างโทเคนบอตใน ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

สำหรับบอตที่ผู้ใช้เป็นเจ้าของ ให้เพิ่ม `--owner <user_id>`

กำหนดค่า OpenClaw:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

จากนั้นรัน:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

หาก `plugins.allow` เป็นรายการจำกัดที่ไม่ว่าง การเลือก
ClickClack อย่างชัดเจนในการตั้งค่าช่องทาง หรือการรัน `openclaw plugins enable clickclack`
จะเพิ่ม `clickclack` ต่อท้ายรายการนั้น การติดตั้งระหว่างการเริ่มต้นใช้งานใช้พฤติกรรม
การเลือกอย่างชัดเจนแบบเดียวกัน เส้นทางเหล่านี้จะไม่แทนที่ `plugins.deny` หรือการตั้งค่า
`plugins.enabled: false` แบบทั่วทั้งระบบ การรัน
`openclaw plugins install @openclaw/clickclack` โดยตรงจะเป็นไปตามนโยบาย
การติดตั้ง Plugin ปกติ และยังบันทึก ClickClack ไว้ใน allowlist ที่มีอยู่ด้วย

## บอตหลายตัว

แต่ละบัญชีเปิดการเชื่อมต่อเรียลไทม์ ClickClack ของตัวเอง และใช้โทเคนบอตของตัวเอง

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

`replyMode: "model"` ใช้ `api.runtime.llm.complete` โดยตรงสำหรับการตอบกลับสั้น ๆ ของบอต
เมื่อบัญชีกำหนด `agentId` OpenClaw จะต้องมีบิตความไว้วางใจ
`plugins.entries.clickclack.llm.allowAgentIdOverride` อย่างชัดเจน เพื่อให้ plugin
สามารถรันการเติมเต็มสำหรับเอเจนต์บอตนั้นได้ ปิดไว้หากคุณใช้เฉพาะเส้นทางเอเจนต์
เริ่มต้น

## เป้าหมาย

- `channel:<name-or-id>` ส่งไปยังช่องทางของพื้นที่ทำงาน เป้าหมายแบบไม่มีคำนำหน้าจะใช้ค่าเริ่มต้นเป็น `channel:`
- `dm:<user_id>` สร้างหรือนำการสนทนาโดยตรงกับผู้ใช้นั้นกลับมาใช้
- `thread:<message_id>` ตอบกลับในเธรดที่มีอยู่

ตัวอย่าง:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## สิทธิ์

ขอบเขตโทเคน ClickClack ถูกบังคับใช้โดย ClickClack API

- `bot:read`: อ่านข้อมูลพื้นที่ทำงาน/ช่องทาง/ข้อความ/เธรด/DM/เรียลไทม์/โปรไฟล์
- `bot:write`: `bot:read` รวมถึงข้อความช่องทาง การตอบกลับเธรด DM และการอัปโหลด
- `bot:admin`: `bot:write` รวมถึงการสร้างช่องทาง

OpenClaw ต้องใช้เพียง `bot:write` สำหรับการแชตเอเจนต์ปกติ

## การแก้ไขปัญหา

- `ClickClack is not configured`: ตั้งค่า `channels.clickclack.token` หรือ `CLICKCLACK_BOT_TOKEN`
- `workspace not found`: ตั้งค่า `workspace` เป็นรหัสหรือ slug ของพื้นที่ทำงานที่ ClickClack ส่งคืน
- ไม่มีการตอบกลับขาเข้า: ยืนยันว่าโทเคนมีสิทธิ์อ่านแบบเรียลไทม์ และบอตไม่ได้ตอบกลับข้อความของตัวเอง
- การส่งไปยังช่องทางล้มเหลว: ตรวจสอบว่าบอตเป็นสมาชิกของพื้นที่ทำงานและมี `bot:write`
