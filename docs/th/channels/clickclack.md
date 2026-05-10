---
read_when:
    - การเชื่อมต่อ OpenClaw กับพื้นที่ทำงาน ClickClack
    - การทดสอบตัวตนของบอต ClickClack
summary: การตั้งค่าช่องทาง bot-token ของ ClickClack และไวยากรณ์เป้าหมาย
title: คลิกแคลก
x-i18n:
    generated_at: "2026-05-10T19:21:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d4860b5f0a40d38af99bec0b8187f723a30c9b4b78d2d1de50ba8a97954baeb
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack เชื่อมต่อ OpenClaw กับเวิร์กสเปซ ClickClack ที่โฮสต์เองผ่านโทเค็นบอต ClickClack แบบ first-class

ใช้สิ่งนี้เมื่อคุณต้องการให้เอเจนต์ OpenClaw ปรากฏเป็นผู้ใช้บอต ClickClack ClickClack รองรับบอตบริการอิสระและบอตที่ผู้ใช้เป็นเจ้าของ บอตที่ผู้ใช้เป็นเจ้าของจะเก็บ `owner_user_id` และได้รับเฉพาะขอบเขตโทเค็นที่คุณอนุญาต

## การตั้งค่าอย่างรวดเร็ว

สร้างโทเค็นบอตใน ClickClack:

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

## หลายบอต

แต่ละบัญชีจะเปิดการเชื่อมต่อเรียลไทม์ ClickClack ของตัวเองและใช้โทเค็นบอตของตัวเอง

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

`replyMode: "model"` ใช้ `api.runtime.llm.complete` โดยตรงสำหรับคำตอบบอตแบบสั้น
เมื่อบัญชีกำหนด `agentId` OpenClaw ต้องใช้ trust bit
`plugins.entries.clickclack.llm.allowAgentIdOverride` อย่างชัดเจน เพื่อให้ plugin
สามารถรันการเติมเต็มสำหรับเอเจนต์บอตนั้นได้ ปิดไว้หากคุณใช้เฉพาะเส้นทางเอเจนต์เริ่มต้น

## เป้าหมาย

- `channel:<name-or-id>` ส่งไปยังช่องของเวิร์กสเปซ เป้าหมายแบบเปล่าจะใช้ค่าเริ่มต้นเป็น `channel:`
- `dm:<user_id>` สร้างหรือนำการสนทนาโดยตรงกับผู้ใช้นั้นกลับมาใช้
- `thread:<message_id>` ตอบกลับในเธรดที่มีอยู่

ตัวอย่าง:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## สิทธิ์

ขอบเขตโทเค็น ClickClack ถูกบังคับใช้โดย API ของ ClickClack

- `bot:read`: อ่านข้อมูลเวิร์กสเปซ/ช่อง/ข้อความ/เธรด/DM/เรียลไทม์/โปรไฟล์
- `bot:write`: `bot:read` พร้อมข้อความในช่อง การตอบกลับเธรด DM และการอัปโหลด
- `bot:admin`: `bot:write` พร้อมการสร้างช่อง

OpenClaw ต้องใช้เพียง `bot:write` สำหรับการแชทเอเจนต์ตามปกติ

## การแก้ไขปัญหา

- `ClickClack is not configured`: ตั้งค่า `channels.clickclack.token` หรือ `CLICKCLACK_BOT_TOKEN`
- `workspace not found`: ตั้งค่า `workspace` เป็น id หรือ slug ของเวิร์กสเปซที่ ClickClack ส่งคืน
- ไม่มีคำตอบขาเข้า: ยืนยันว่าโทเค็นมีสิทธิ์อ่านเรียลไทม์และบอตไม่ได้ตอบกลับข้อความของตัวเอง
- การส่งไปยังช่องล้มเหลว: ตรวจสอบว่าบอตเป็นสมาชิกของเวิร์กสเปซและมี `bot:write`
