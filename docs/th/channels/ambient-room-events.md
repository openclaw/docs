---
read_when:
    - การกำหนดค่าห้องกลุ่มหรือช่องทางให้พร้อมใช้งานตลอดเวลา
    - คุณต้องการให้เอเจนต์เฝ้าดูการสนทนาในห้องโดยไม่โพสต์ข้อความสุดท้ายโดยอัตโนมัติ
    - การดีบักการพิมพ์และการใช้งานโทเค็นโดยไม่มีข้อความห้องที่มองเห็นได้
sidebarTitle: Ambient room events
summary: ให้ห้องกลุ่มที่รองรับให้บริบทแบบเงียบ เว้นแต่ว่าเอเจนต์จะส่งด้วยเครื่องมือข้อความ
title: เหตุการณ์แวดล้อมในห้อง
x-i18n:
    generated_at: "2026-06-27T17:09:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6423bea8aa1371fe53b610ae1ca794fc6d7866ecd767eee7b837a75004eebf83
    source_path: channels/ambient-room-events.md
    workflow: 16
---

เหตุการณ์ห้องแบบ ambient ช่วยให้ OpenClaw ประมวลผลข้อความพูดคุยในกลุ่มหรือช่องที่ไม่ได้กล่าวถึงเป็นบริบทเงียบได้ เอเจนต์สามารถอัปเดตหน่วยความจำและสถานะเซสชันได้ แต่ห้องจะยังเงียบอยู่ เว้นแต่เอเจนต์จะเรียกเครื่องมือ `message` อย่างชัดเจน

สำหรับแชตกลุ่มที่เปิดใช้งานตลอดเวลา นี่คือโหมดที่แนะนำ: ใช้ `messages.groupChat.unmentionedInbound: "room_event"` ร่วมกับ `messages.groupChat.visibleReplies: "message_tool"` ใช้โหมดนี้เมื่อเอเจนต์ควรฟัง ตัดสินใจเองว่าเมื่อใดการตอบกลับจึงมีประโยชน์ และหลีกเลี่ยงรูปแบบพรอมต์แบบเก่าที่ตอบ `NO_REPLY`

รองรับในปัจจุบัน: ช่องกิลด์ Discord, ช่อง Slack และช่องส่วนตัว, DM หลายคนของ Slack และกลุ่มหรือซูเปอร์กรุ๊ปของ Telegram ช่องกลุ่มอื่นจะคงพฤติกรรมกลุ่มเดิมไว้ เว้นแต่หน้าช่องของช่องนั้นจะระบุว่ารองรับเหตุการณ์ห้องแบบ ambient

## การตั้งค่าที่แนะนำ

ตั้งค่าพฤติกรรมแชตกลุ่มแบบส่วนกลาง:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

จากนั้นกำหนดค่าห้องเองให้เปิดใช้งานตลอดเวลาโดยปิดการกั้นด้วยการกล่าวถึงสำหรับห้องนั้น ช่องยังต้องได้รับอนุญาตโดย `groupPolicy` ปกติ รายการอนุญาตของห้อง และรายการอนุญาตของผู้ส่ง

หลังจากบันทึกการกำหนดค่าแล้ว Gateway จะโหลดการตั้งค่า `messages` ใหม่แบบ hot-reload รีสตาร์ทเฉพาะเมื่อการเฝ้าดูไฟล์หรือการโหลดการกำหนดค่าใหม่ถูกปิดใช้งาน

## สิ่งที่เปลี่ยนไป

เมื่อใช้ `messages.groupChat.unmentionedInbound: "room_event"`:

- ข้อความกลุ่มหรือช่องที่ได้รับอนุญาตแต่ไม่ได้กล่าวถึงจะกลายเป็นเหตุการณ์ห้องแบบเงียบ
- ข้อความที่กล่าวถึงยังคงเป็นคำขอของผู้ใช้
- คำสั่งข้อความและคำสั่งเนทีฟยังคงเป็นคำขอของผู้ใช้
- คำขอยกเลิกหรือหยุดยังคงเป็นคำขอของผู้ใช้
- ข้อความโดยตรงยังคงเป็นคำขอของผู้ใช้

เหตุการณ์ห้องใช้การส่งที่มองเห็นได้แบบเข้มงวด ข้อความสุดท้ายของผู้ช่วยเป็นแบบส่วนตัว เอเจนต์ต้องเรียก `message(action=send)` เพื่อโพสต์ในห้อง

## ตัวอย่าง Discord

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

ใช้การกำหนดค่า Discord แบบรายช่องเมื่อมีเพียงช่องเดียวที่ควรเป็น ambient:

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## ตัวอย่าง Slack

รายการอนุญาตช่อง Slack ใช้ ID เป็นหลัก ใช้ ID ช่อง เช่น `C12345678` ไม่ใช่ `#channel-name`

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          allow: true,
          requireMention: false,
        },
      },
    },
  },
}
```

## ตัวอย่าง Telegram

สำหรับกลุ่ม Telegram บอตต้องสามารถเห็นข้อความกลุ่มปกติได้ หากใช้ `requireMention: false` ให้ปิดโหมดความเป็นส่วนตัวของ BotFather หรือใช้การตั้งค่า Telegram แบบอื่นที่ส่งทราฟฟิกกลุ่มทั้งหมดไปยังบอต

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

ID กลุ่ม Telegram มักเป็นตัวเลขติดลบ เช่น `-1001234567890` อ่าน `chat.id` จาก `openclaw logs --follow` ส่งต่อข้อความกลุ่มไปยังบอตช่วยดู ID หรือตรวจสอบ Bot API `getUpdates`

## นโยบายเฉพาะเอเจนต์

ใช้การเขียนทับสำหรับเอเจนต์เมื่อมีหลายเอเจนต์ใช้ห้องเดียวกัน แต่มีเพียงเอเจนต์เดียวที่ควรถือว่าข้อความพูดคุยที่ไม่ได้กล่าวถึงเป็นบริบทแบบ ambient:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

ค่าเฉพาะเอเจนต์ `agents.list[].groupChat.unmentionedInbound` จะเขียนทับ `messages.groupChat.unmentionedInbound` สำหรับเอเจนต์นั้น

## โหมดการตอบกลับที่มองเห็นได้

`messages.groupChat.visibleReplies` มีค่าเริ่มต้นเป็น `"automatic"` สำหรับคำขอของผู้ใช้แบบกลุ่ม/ช่องปกติ คงค่าเริ่มต้นนี้ไว้เมื่อคุณต้องการให้ข้อความสุดท้ายของผู้ช่วยโพสต์อย่างมองเห็นได้โดยไม่ต้องเรียกเครื่องมือข้อความอย่างชัดเจน

สำหรับห้องแบบ ambient ที่เปิดใช้งานตลอดเวลา ยังคงแนะนำให้ใช้ `messages.groupChat.visibleReplies: "message_tool"` โดยเฉพาะกับโมเดลรุ่นล่าสุดที่เรียกใช้เครื่องมือได้เชื่อถือได้ เช่น GPT 5.5 วิธีนี้ช่วยให้เอเจนต์ตัดสินใจว่าเมื่อใดควรพูดโดยเรียกเครื่องมือข้อความ หากโมเดลส่งคืนข้อความสุดท้ายโดยไม่ได้เรียกเครื่องมือ OpenClaw จะเก็บข้อความสุดท้ายนั้นไว้เป็นส่วนตัวและบันทึกเมทาดาทาการส่งที่ถูกระงับ

เหตุการณ์ห้องยังคงเข้มงวดแม้คำขอกลุ่มอื่นจะใช้การตอบกลับอัตโนมัติ เหตุการณ์ห้อง ambient ที่ไม่ได้กล่าวถึงยังคงต้องใช้ `message(action=send)` สำหรับเอาต์พุตที่มองเห็นได้

## ประวัติ

`messages.groupChat.historyLimit` ควบคุมค่าเริ่มต้นของประวัติกลุ่มแบบส่วนกลาง ช่องสามารถเขียนทับได้ด้วย `channels.<channel>.historyLimit` และบางช่องยังรองรับขีดจำกัดประวัติแบบรายบัญชีด้วย

ตั้งค่า `historyLimit: 0` เพื่อปิดบริบทประวัติกลุ่ม

ช่องที่รองรับเหตุการณ์ห้องจะเก็บข้อความห้องแบบ ambient ล่าสุดไว้เป็นบริบท Discord จะเก็บประวัติเหตุการณ์ห้องไว้จนกว่าการส่ง Discord ที่มองเห็นได้จะสำเร็จ ดังนั้นบริบทเงียบจะไม่หายไปก่อนการส่งผ่านเครื่องมือข้อความ

## การแก้ปัญหา

หากห้องแสดงการพิมพ์หรือการใช้โทเค็นแต่ไม่มีข้อความที่มองเห็นได้:

1. ยืนยันว่าห้องได้รับอนุญาตโดยรายการอนุญาตของช่องและรายการอนุญาตของผู้ส่ง
2. ยืนยันว่า `requireMention: false` ถูกตั้งไว้ที่ระดับห้องที่คุณคาดไว้
3. ตรวจสอบว่า `messages.groupChat.unmentionedInbound` หรือการเขียนทับของเอเจนต์เป็น `"room_event"` หรือไม่
4. ตรวจสอบบันทึกสำหรับเมทาดาทาเพย์โหลดสุดท้ายที่ถูกระงับหรือ `didSendViaMessagingTool: false`
5. สำหรับคำขอกลุ่มปกติ ให้คงหรือคืนค่า `messages.groupChat.visibleReplies: "automatic"` หากคุณต้องการให้การตอบกลับสุดท้ายถูกโพสต์โดยอัตโนมัติ สำหรับห้องแบบ ambient ที่ใช้ `message_tool` ให้ใช้โมเดล/รันไทม์ที่เรียกใช้เครื่องมือได้อย่างเชื่อถือได้

หากห้อง ambient ของ Telegram ไม่ทริกเกอร์เลย ให้ตรวจสอบโหมดความเป็นส่วนตัวของ BotFather และยืนยันว่า Gateway กำลังได้รับข้อความกลุ่มปกติ

หากห้อง ambient ของ Slack ไม่ทริกเกอร์ ให้ตรวจสอบว่าคีย์ช่องเป็น ID ช่อง Slack และแอปมี scope `channels:history` หรือ `groups:history` ที่จำเป็นสำหรับประเภทห้องนั้น

## ที่เกี่ยวข้อง

- [กลุ่ม](/th/channels/groups)
- [Discord](/th/channels/discord)
- [Slack](/th/channels/slack)
- [Telegram](/th/channels/telegram)
- [การแก้ปัญหาช่อง](/th/channels/troubleshooting)
- [ข้อมูลอ้างอิงการกำหนดค่าช่อง](/th/gateway/config-channels)
