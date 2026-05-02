---
read_when:
    - การกำหนดค่ารายการที่อนุญาตเดียวกันในหลายช่องทางข้อความ
    - กฎการแชร์การเข้าถึงผู้ส่งในข้อความส่วนตัวและกลุ่ม
    - การตรวจสอบการควบคุมการเข้าถึงช่องทางข้อความ
summary: รายการอนุญาตผู้ส่งแบบใช้ซ้ำได้สำหรับช่องทางข้อความ
title: กลุ่มการเข้าถึง
x-i18n:
    generated_at: "2026-05-02T10:07:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7bc1d4fb80e5c5d4e72b190d49821aa93ced575eafcf89864ac800e8558f94
    source_path: channels/access-groups.md
    workflow: 16
---

กลุ่มการเข้าถึงคือรายชื่อผู้ส่งที่มีชื่อ ซึ่งคุณกำหนดครั้งเดียวแล้วอ้างอิงจาก allowlist ของช่องทางด้วย `accessGroup:<name>`.

ใช้กลุ่มเหล่านี้เมื่อคนชุดเดียวกันควรได้รับอนุญาตในหลายช่องทางข้อความ หรือเมื่อชุดที่เชื่อถือได้ชุดหนึ่งควรใช้ได้กับทั้งการอนุญาตผู้ส่งใน DM และกลุ่ม.

กลุ่มการเข้าถึงไม่ได้ให้สิทธิ์การเข้าถึงด้วยตัวเอง กลุ่มจะมีผลก็ต่อเมื่อฟิลด์ allowlist อ้างอิงถึงกลุ่มนั้นเท่านั้น.

## กลุ่มผู้ส่งข้อความแบบคงที่

กลุ่มผู้ส่งแบบคงที่ใช้ `type: "message.senders"`.

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

รายการสมาชิกใช้ id ช่องทางข้อความเป็นคีย์:

| คีย์        | ความหมาย                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `"*"`      | รายการร่วมที่ตรวจสอบสำหรับทุกช่องทางข้อความที่อ้างอิงกลุ่ม. |
| `discord`  | รายการที่ตรวจสอบเฉพาะการจับคู่ allowlist ของ Discord.                    |
| `telegram` | รายการที่ตรวจสอบเฉพาะการจับคู่ allowlist ของ Telegram.                   |
| `whatsapp` | รายการที่ตรวจสอบเฉพาะการจับคู่ allowlist ของ WhatsApp.                   |

รายการจะถูกจับคู่ด้วยกฎ `allowFrom` ปกติของช่องทางปลายทาง OpenClaw ไม่แปล id ผู้ส่งระหว่างช่องทาง หาก Alice มี id ของ Telegram และ id ของ Discord ให้ระบุทั้งสอง id ไว้ใต้คีย์ที่เหมาะสม.

## อ้างอิงกลุ่มจาก allowlist

อ้างอิงกลุ่มด้วย `accessGroup:<name>` ในทุกตำแหน่งที่เส้นทางช่องทางข้อความรองรับ allowlist ผู้ส่ง.

ตัวอย่าง allowlist ของ DM:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

ตัวอย่าง allowlist ผู้ส่งในกลุ่ม:

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      spaces: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

คุณสามารถใช้กลุ่มร่วมกับรายการโดยตรงได้:

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## เส้นทางช่องทางข้อความที่รองรับ

กลุ่มการเข้าถึงใช้งานได้ในเส้นทางการอนุญาตช่องทางข้อความร่วม รวมถึง:

- allowlist ผู้ส่ง DM เช่น `channels.<channel>.allowFrom`
- allowlist ผู้ส่งในกลุ่ม เช่น `channels.<channel>.groupAllowFrom`
- allowlist ผู้ส่งรายห้องเฉพาะช่องทางที่ใช้กฎการจับคู่ผู้ส่งเดียวกัน
- เส้นทางการอนุญาตคำสั่งที่นำ allowlist ผู้ส่งของช่องทางข้อความกลับมาใช้

การรองรับช่องทางขึ้นอยู่กับว่าช่องทางนั้นเชื่อมผ่านตัวช่วยการอนุญาตผู้ส่งร่วมของ OpenClaw หรือไม่ การรองรับที่รวมมาในปัจจุบันประกอบด้วย Discord, Google Chat, Nostr, WhatsApp, Zalo และ Zalo Personal กลุ่ม `message.senders` แบบคงที่ออกแบบมาให้ไม่ผูกกับช่องทาง ดังนั้นช่องทางข้อความใหม่ควรรองรับกลุ่มเหล่านี้โดยใช้ตัวช่วย Plugin SDK ร่วม แทนการขยาย allowlist แบบกำหนดเอง.

## ผู้ชมช่องทาง Discord

Discord ยังรองรับประเภทกลุ่มการเข้าถึงแบบไดนามิกด้วย:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

`discord.channelAudience` หมายถึง "อนุญาตผู้ส่ง DM ของ Discord ที่สามารถดูช่องทาง guild นี้ได้ในขณะนี้" OpenClaw จะแก้ผู้ส่งผ่าน Discord ณ เวลาการอนุญาต และใช้กฎสิทธิ์ `ViewChannel` ของ Discord.

ใช้รูปแบบนี้เมื่อช่องทาง Discord เป็นแหล่งข้อมูลจริงของทีมอยู่แล้ว เช่น `#maintainers` หรือ `#on-call`.

ข้อกำหนดและพฤติกรรมเมื่อเกิดความล้มเหลว:

- บอตต้องมีสิทธิ์เข้าถึง guild และช่องทาง.
- บอตต้องมี **Server Members Intent** ใน Discord Developer Portal.
- กลุ่มการเข้าถึงจะปิดกั้นเมื่อ Discord ส่งคืน `Missing Access`, ไม่สามารถแก้ผู้ส่งให้เป็นสมาชิก guild ได้, หรือช่องทางเป็นของ guild อื่น.

ตัวอย่างเฉพาะ Discord เพิ่มเติม: [การควบคุมการเข้าถึง Discord](/th/channels/discord#access-control-and-routing)

## หมายเหตุด้านความปลอดภัย

- กลุ่มการเข้าถึงเป็น alias ของ allowlist ไม่ใช่บทบาท กลุ่มเหล่านี้ไม่ได้สร้างเจ้าของ อนุมัติคำขอจับคู่ หรือให้สิทธิ์เครื่องมือด้วยตัวเอง.
- `dmPolicy: "open"` ยังคงต้องมี `"*"` ใน allowlist ของ DM ที่มีผลจริง การอ้างอิงกลุ่มการเข้าถึงไม่เหมือนกับการเปิดให้เข้าถึงสาธารณะ.
- ชื่อกลุ่มที่หายไปจะปิดกั้น หาก `allowFrom` มี `accessGroup:operators` และไม่มี `accessGroups.operators` รายการนั้นจะไม่อนุญาตใครเลย.
- รักษา id ช่องทางให้เสถียร เลือกใช้ id แบบตัวเลข/ผู้ใช้แทนชื่อที่แสดงเมื่อช่องทางรองรับทั้งสองแบบ.

## การแก้ไขปัญหา

หากผู้ส่งควรจับคู่ได้แต่ถูกบล็อก:

1. ยืนยันว่าฟิลด์ allowlist มีการอ้างอิง `accessGroup:<name>` ที่ตรงกันทุกตัวอักษร.
2. ยืนยันว่า `accessGroups.<name>.type` ถูกต้อง.
3. ยืนยันว่า id ผู้ส่งถูกระบุไว้ใต้คีย์ช่องทางที่ตรงกัน หรือใต้ `"*"`.
4. ยืนยันว่ารายการใช้ไวยากรณ์ allowlist ปกติของช่องทางนั้น.
5. สำหรับผู้ชมช่องทาง Discord ให้ยืนยันว่าบอตเห็นช่องทาง guild ได้และเปิดใช้ Server Members Intent แล้ว.

เรียกใช้ `openclaw doctor` หลังจากแก้ไขการกำหนดค่าการควบคุมการเข้าถึง คำสั่งนี้ตรวจจับชุด allowlist และนโยบายที่ไม่ถูกต้องได้จำนวนมากก่อนรันไทม์.
