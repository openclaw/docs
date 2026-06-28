---
read_when:
    - การกำหนดค่ารายการที่อนุญาตเดียวกันในหลายช่องทางข้อความ
    - กฎการเข้าถึงผู้ส่งสำหรับการแชร์ข้อความส่วนตัวและกลุ่ม
    - การตรวจสอบการควบคุมการเข้าถึงช่องทางข้อความ
summary: รายการอนุญาตผู้ส่งที่ใช้ซ้ำได้สำหรับช่องทางข้อความ
title: กลุ่มการเข้าถึง
x-i18n:
    generated_at: "2026-05-10T19:21:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1dba4fc84deb6e0c8c7b17ebc10182aa6e4bc2c821070e33df44f384e285266f
    source_path: channels/access-groups.md
    workflow: 16
    postprocess_version: locale-links-v1
---

กลุ่มการเข้าถึงคือรายการผู้ส่งที่ตั้งชื่อไว้ ซึ่งคุณกำหนดครั้งเดียวแล้วอ้างอิงจากรายการอนุญาตของช่องทางด้วย `accessGroup:<name>`

ใช้เมื่อควรอนุญาตให้คนกลุ่มเดียวกันเข้าถึงได้ในหลายช่องทางข้อความ หรือเมื่อชุดผู้ที่เชื่อถือได้ชุดหนึ่งควรใช้กับทั้งการอนุญาตผู้ส่งใน DM และในกลุ่ม

กลุ่มการเข้าถึงไม่ได้ให้สิทธิ์เข้าถึงด้วยตัวเอง กลุ่มจะมีผลก็ต่อเมื่อฟิลด์รายการอนุญาตอ้างอิงถึงกลุ่มนั้น

## กลุ่มผู้ส่งข้อความแบบคงที่

กลุ่มผู้ส่งแบบคงที่ใช้ `type: "message.senders"`

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

รายการสมาชิกใช้ id ของช่องทางข้อความเป็นคีย์:

| คีย์        | ความหมาย                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `"*"`      | รายการร่วมที่ตรวจสอบสำหรับทุกช่องทางข้อความที่อ้างอิงกลุ่มนี้ |
| `discord`  | รายการที่ตรวจสอบเฉพาะการจับคู่รายการอนุญาตของ Discord                    |
| `telegram` | รายการที่ตรวจสอบเฉพาะการจับคู่รายการอนุญาตของ Telegram                   |
| `whatsapp` | รายการที่ตรวจสอบเฉพาะการจับคู่รายการอนุญาตของ WhatsApp                   |

รายการต่างๆ จะถูกจับคู่ด้วยกฎ `allowFrom` ปกติของช่องทางปลายทาง OpenClaw ไม่แปลง id ผู้ส่งระหว่างช่องทาง หาก Alice มี id ของ Telegram และ id ของ Discord ให้ระบุทั้งสอง id ใต้คีย์ที่เหมาะสม

## อ้างอิงกลุ่มจากรายการอนุญาต

อ้างอิงกลุ่มด้วย `accessGroup:<name>` ได้ทุกที่ที่พาธของช่องทางข้อความรองรับรายการอนุญาตผู้ส่ง

ตัวอย่างรายการอนุญาตของ DM:

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

ตัวอย่างรายการอนุญาตผู้ส่งในกลุ่ม:

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

คุณสามารถใช้กลุ่มและรายการโดยตรงร่วมกันได้:

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

## พาธของช่องทางข้อความที่รองรับ

กลุ่มการเข้าถึงพร้อมใช้งานในพาธการอนุญาตของช่องทางข้อความที่ใช้ร่วมกัน รวมถึง:

- รายการอนุญาตผู้ส่ง DM เช่น `channels.<channel>.allowFrom`
- รายการอนุญาตผู้ส่งในกลุ่ม เช่น `channels.<channel>.groupAllowFrom`
- รายการอนุญาตผู้ส่งต่อห้องแบบเฉพาะช่องทางที่ใช้กฎการจับคู่ผู้ส่งเดียวกัน
- พาธการอนุญาตคำสั่งที่ใช้รายการอนุญาตผู้ส่งของช่องทางข้อความซ้ำ

การรองรับช่องทางขึ้นอยู่กับว่าช่องทางนั้นเชื่อมผ่านตัวช่วยการอนุญาตผู้ส่งที่ใช้ร่วมกันของ OpenClaw หรือไม่ การรองรับแบบบันเดิลในปัจจุบันรวมถึง Discord, Feishu, Google Chat, iMessage, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQBot, Signal, WhatsApp, Zalo และ Zalo Personal กลุ่ม `message.senders` แบบคงที่ออกแบบมาให้ไม่ผูกกับช่องทาง ดังนั้นช่องทางข้อความใหม่ควรรองรับกลุ่มเหล่านี้โดยใช้ตัวช่วย SDK ของ Plugin ที่ใช้ร่วมกัน แทนการขยายรายการอนุญาตแบบกำหนดเอง

## การวินิจฉัยของ Plugin

ผู้เขียน Plugin สามารถตรวจสอบสถานะกลุ่มการเข้าถึงแบบมีโครงสร้างได้โดยไม่ต้องขยายกลับเป็นรายการอนุญาตแบบแบน:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/security-runtime";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

ผลลัพธ์จะรายงานกลุ่มที่ถูกอ้างอิง จับคู่ได้ ขาดหาย ไม่รองรับ และล้มเหลว ใช้สิ่งนี้เมื่อคุณต้องการการวินิจฉัยหรือการทดสอบความสอดคล้อง ใช้ `expandAllowFromWithAccessGroups(...)` เฉพาะกับพาธความเข้ากันได้ที่ยังคาดหวังอาร์เรย์ `allowFrom` แบบแบน

## กลุ่มผู้ชมช่องทาง Discord

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

`discord.channelAudience` หมายถึง "อนุญาตผู้ส่ง DM ของ Discord ที่สามารถดูช่องทางกิลด์นี้ได้ในขณะนี้" OpenClaw จะแก้ผู้ส่งผ่าน Discord ในเวลาที่อนุญาต และใช้กฎสิทธิ์ `ViewChannel` ของ Discord

ใช้สิ่งนี้เมื่อช่องทาง Discord เป็นแหล่งข้อมูลจริงของทีมอยู่แล้ว เช่น `#maintainers` หรือ `#on-call`

ข้อกำหนดและพฤติกรรมเมื่อล้มเหลว:

- บอตต้องมีสิทธิ์เข้าถึงกิลด์และช่องทาง
- บอตต้องมี **Server Members Intent** ใน Discord Developer Portal
- กลุ่มการเข้าถึงจะล้มเหลวแบบปิดเมื่อ Discord ส่งคืน `Missing Access`, ไม่สามารถแก้ผู้ส่งเป็นสมาชิกกิลด์ได้ หรือช่องทางเป็นของกิลด์อื่น

ตัวอย่างเฉพาะ Discord เพิ่มเติม: [การควบคุมการเข้าถึงของ Discord](/th/channels/discord#access-control-and-routing)

## หมายเหตุด้านความปลอดภัย

- กลุ่มการเข้าถึงเป็นนามแฝงของรายการอนุญาต ไม่ใช่บทบาท กลุ่มเหล่านี้ไม่ได้สร้างเจ้าของ อนุมัติคำขอจับคู่ หรือให้สิทธิ์เครื่องมือด้วยตัวเอง
- `dmPolicy: "open"` ยังต้องมี `"*"` ในรายการอนุญาต DM ที่มีผล การอ้างอิงกลุ่มการเข้าถึงไม่เหมือนกับการเข้าถึงสาธารณะ
- ชื่อกลุ่มที่ขาดหายจะล้มเหลวแบบปิด หาก `allowFrom` มี `accessGroup:operators` และไม่มี `accessGroups.operators` รายการนั้นจะไม่อนุญาตใครเลย
- รักษา id ของช่องทางให้เสถียร ควรใช้ id แบบตัวเลขหรือ id ผู้ใช้แทนชื่อที่แสดง เมื่อช่องทางรองรับทั้งสองแบบ

## การแก้ไขปัญหา

หากผู้ส่งควรถูกจับคู่แต่ถูกบล็อก:

1. ยืนยันว่าฟิลด์รายการอนุญาตมีการอ้างอิง `accessGroup:<name>` ที่ตรงกันทุกตัวอักษร
2. ยืนยันว่า `accessGroups.<name>.type` ถูกต้อง
3. ยืนยันว่า id ผู้ส่งถูกระบุไว้ใต้คีย์ช่องทางที่ตรงกัน หรือใต้ `"*"`
4. ยืนยันว่ารายการนั้นใช้ไวยากรณ์รายการอนุญาตปกติของช่องทางนั้น
5. สำหรับกลุ่มผู้ชมช่องทาง Discord ให้ยืนยันว่าบอตมองเห็นช่องทางกิลด์ได้ และเปิดใช้ Server Members Intent แล้ว

เรียกใช้ `openclaw doctor` หลังจากแก้ไขการกำหนดค่าการควบคุมการเข้าถึง คำสั่งนี้จะตรวจจับชุดค่าผสมของรายการอนุญาตและนโยบายที่ไม่ถูกต้องจำนวนมากก่อนถึงรันไทม์
