---
read_when:
    - การกำหนดรายการที่อนุญาตเดียวกันสำหรับช่องทางรับส่งข้อความหลายช่องทาง
    - การใช้กฎการเข้าถึงของผู้ส่งในข้อความส่วนตัวและกลุ่มร่วมกัน
    - การตรวจสอบการควบคุมการเข้าถึงช่องทางข้อความ
summary: รายการอนุญาตผู้ส่งที่นำกลับมาใช้ซ้ำได้สำหรับช่องทางข้อความ
title: กลุ่มการเข้าถึง
x-i18n:
    generated_at: "2026-07-12T15:51:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

กลุ่มการเข้าถึงคือรายการผู้ส่งที่มีชื่อ ซึ่งคุณกำหนดครั้งเดียวภายใต้ `accessGroups` และอ้างอิงจากรายการอนุญาตของช่องทางด้วย `accessGroup:<name>`

ใช้เมื่อควรอนุญาตบุคคลกลุ่มเดียวกันในช่องทางข้อความหลายช่องทาง หรือเมื่อต้องการใช้ชุดบุคคลที่เชื่อถือได้ชุดเดียวกันทั้งสำหรับการอนุญาตผู้ส่งใน DM และในกลุ่ม

กลุ่มไม่ได้ให้สิทธิ์ใด ๆ ด้วยตัวเอง กลุ่มจะมีผลเฉพาะเมื่อฟิลด์รายการอนุญาตอ้างอิงถึงกลุ่มนั้น

## กลุ่มผู้ส่งข้อความแบบคงที่

กลุ่มผู้ส่งแบบคงที่ใช้ `type: "message.senders"` โดย `members` ใช้รหัสช่องทางข้อความเป็นคีย์ และใช้ `"*"` สำหรับรายการที่ใช้ร่วมกันในทุกช่องทาง:

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

| คีย์                       | ความหมาย                                                                 |
| -------------------------- | --------------------------------------------------------------------------- |
| `"*"`                      | รายการที่ใช้ร่วมกัน ซึ่งจะตรวจสอบสำหรับทุกช่องทางข้อความที่อ้างอิงกลุ่มนี้ |
| `discord`, `telegram`, ... | รายการที่ตรวจสอบเฉพาะเมื่อจับคู่กับรายการอนุญาตของช่องทางนั้น              |

รายการจะถูกจับคู่ตามกฎ `allowFrom` ปกติของช่องทางปลายทาง OpenClaw จะไม่แปลงรหัสผู้ส่งระหว่างช่องทาง หาก Alice มีทั้งรหัส Telegram และรหัส Discord ให้ระบุรหัสทั้งสองภายใต้คีย์ช่องทางที่ตรงกัน

## การอ้างอิงกลุ่มจากรายการอนุญาต

อ้างอิงกลุ่มด้วย `accessGroup:<name>` ได้ทุกตำแหน่งที่เส้นทางของช่องทางข้อความรองรับรายการอนุญาตผู้ส่ง

ตัวอย่างรายการอนุญาต DM:

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
      groups: {
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

กลุ่มการเข้าถึงใช้งานได้ในเส้นทางการอนุญาตร่วมของช่องทางข้อความ:

- รายการอนุญาตผู้ส่ง DM เช่น `channels.<channel>.allowFrom`
- รายการอนุญาตผู้ส่งในกลุ่ม เช่น `channels.<channel>.groupAllowFrom`
- รายการอนุญาตผู้ส่งรายห้องเฉพาะช่องทางที่ใช้กฎการจับคู่ผู้ส่งเดียวกัน (ตัวอย่างเช่น `groups.<space>.users` ของ Google Chat)
- เส้นทางการอนุญาตคำสั่งที่นำรายการอนุญาตผู้ส่งของช่องทางข้อความมาใช้ซ้ำ

การรองรับขึ้นอยู่กับว่าช่องทางนั้นเชื่อมต่อผ่านตัวช่วยการอนุญาตผู้ส่งร่วมของ OpenClaw หรือไม่ การรองรับแบบรวมมาให้ในปัจจุบันประกอบด้วย ClickClack, Discord, Feishu, Google Chat, iMessage, IRC, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Signal, Slack, SMS, Telegram, WhatsApp, Zalo และ Zalo Personal กลุ่ม `message.senders` แบบคงที่ไม่ขึ้นกับช่องทาง ดังนั้นช่องทางข้อความใหม่จะรองรับกลุ่มเหล่านี้ได้โดยใช้ตัวช่วยรับข้อความขาเข้าของ plugin SDK ที่ใช้ร่วมกัน แทนการขยายรายการอนุญาตแบบกำหนดเอง

## กลุ่มเป้าหมายของช่อง Discord

Discord ยังรองรับประเภทกลุ่มการเข้าถึงแบบไดนามิก:

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

`discord.channelAudience` หมายถึง "อนุญาตผู้ส่ง DM บน Discord ที่สามารถดูช่องของเซิร์ฟเวอร์นี้ได้ในขณะนั้น" OpenClaw จะตรวจสอบผู้ส่งผ่าน Discord ณ เวลาที่อนุญาต และใช้กฎสิทธิ์ `ViewChannel` ของ Discord โดย `membership` เป็นตัวเลือกและมีค่าเริ่มต้นเป็น `canViewChannel`

ใช้เมื่อช่อง Discord เป็นแหล่งข้อมูลที่เชื่อถือได้หลักสำหรับทีมอยู่แล้ว เช่น `#maintainers` หรือ `#on-call`

ข้อกำหนดและพฤติกรรมเมื่อเกิดความล้มเหลว:

- บอตต้องมีสิทธิ์เข้าถึงเซิร์ฟเวอร์และช่อง
- บอตต้องเปิดใช้ **Server Members Intent** ใน Discord Developer Portal
- กลุ่มการเข้าถึงจะปฏิเสธโดยปริยายเมื่อ Discord ส่งคืน `Missing Access`, ไม่สามารถระบุผู้ส่งว่าเป็นสมาชิกของเซิร์ฟเวอร์ได้ หรือช่องเป็นของเซิร์ฟเวอร์อื่น

ตัวอย่างเฉพาะสำหรับ Discord เพิ่มเติม: [การควบคุมการเข้าถึงของ Discord](/th/channels/discord#access-control-and-routing)

## การวินิจฉัย Plugin

ผู้เขียน Plugin สามารถตรวจสอบสถานะกลุ่มการเข้าถึงแบบมีโครงสร้างได้โดยไม่ต้องขยายกลับเป็นรายการอนุญาตแบบแบน:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/access-groups";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

ผลลัพธ์จะรายงานกลุ่มที่ถูกอ้างอิง จับคู่ สูญหาย ไม่รองรับ และล้มเหลว ใช้ผลลัพธ์นี้สำหรับการวินิจฉัยหรือการทดสอบความสอดคล้อง ใช้ `expandAllowFromWithAccessGroups(...)` เฉพาะสำหรับเส้นทางความเข้ากันได้ที่ยังคาดว่าจะได้รับอาร์เรย์ `allowFrom` แบบแบนเท่านั้น

## หมายเหตุด้านความปลอดภัย

- กลุ่มการเข้าถึงเป็นชื่อแทนของรายการอนุญาต ไม่ใช่บทบาท กลุ่มเหล่านี้ไม่สร้างเจ้าของ ไม่อนุมัติคำขอจับคู่ และไม่ให้สิทธิ์ใช้เครื่องมือด้วยตัวเอง
- `dmPolicy: "open"` ยังคงต้องมี `"*"` ในรายการอนุญาต DM ที่มีผล การอ้างอิงกลุ่มการเข้าถึงไม่เท่ากับการเปิดให้สาธารณะเข้าถึง
- หากไม่พบชื่อกลุ่ม ระบบจะปฏิเสธโดยปริยาย หาก `allowFrom` มี `accessGroup:operators` แต่ไม่มี `accessGroups.operators` รายการนั้นจะไม่อนุญาตใคร
- รักษารหัสช่องทางให้คงที่ ควรใช้รหัสตัวเลขหรือรหัสผู้ใช้แทนชื่อที่แสดง เมื่อช่องทางรองรับทั้งสองแบบ

## การแก้ไขปัญหา

หากผู้ส่งควรจับคู่ได้แต่ถูกบล็อก:

1. ยืนยันว่าฟิลด์รายการอนุญาตมีการอ้างอิง `accessGroup:<name>` ที่ตรงกันทุกประการ
2. ยืนยันว่า `accessGroups.<name>.type` ถูกต้อง
3. ยืนยันว่ารหัสผู้ส่งอยู่ภายใต้คีย์ช่องทางที่ตรงกัน หรือภายใต้ `"*"`
4. ยืนยันว่ารายการใช้ไวยากรณ์รายการอนุญาตปกติของช่องทางนั้น
5. สำหรับกลุ่มเป้าหมายของช่อง Discord ให้ยืนยันว่าบอตมองเห็นช่องของเซิร์ฟเวอร์และเปิดใช้ Server Members Intent แล้ว

เรียกใช้ `openclaw doctor` หลังแก้ไขการกำหนดค่าการควบคุมการเข้าถึง คำสั่งนี้ตรวจพบชุดค่ารายการอนุญาตและนโยบายที่ไม่ถูกต้องได้หลายกรณีก่อนรันไทม์
