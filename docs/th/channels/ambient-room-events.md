---
read_when:
    - การกำหนดค่าห้องกลุ่มหรือห้องช่องที่เปิดใช้งานตลอดเวลา
    - คุณต้องการให้เอเจนต์เฝ้าดูการสนทนาในห้องโดยไม่โพสต์ข้อความสุดท้ายโดยอัตโนมัติ
    - การดีบักสถานะการพิมพ์และการใช้โทเค็นเมื่อไม่มีข้อความในห้องที่มองเห็นได้
sidebarTitle: Ambient room events
summary: ให้ห้องกลุ่มที่รองรับให้บริบทแบบเงียบ เว้นแต่ agent จะส่งด้วยเครื่องมือข้อความ
title: เหตุการณ์รอบข้างในห้อง
x-i18n:
    generated_at: "2026-07-02T17:48:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3dcf5abab58d9bfd75b7cef6c8a55b98f6688a895774b8ba4a1ffc5723e0a6
    source_path: channels/ambient-room-events.md
    workflow: 16
---

เหตุการณ์ห้องแบบ ambient ช่วยให้ OpenClaw ประมวลผลบทสนทนาในกลุ่มหรือช่องที่ไม่ได้กล่าวถึงเป็นบริบทแบบเงียบได้ agent สามารถอัปเดตหน่วยความจำและสถานะเซสชันได้ แต่ห้องจะยังเงียบอยู่ เว้นแต่ agent จะเรียกใช้เครื่องมือ `message` อย่างชัดเจน

สำหรับแชตกลุ่มแบบเปิดตลอด นี่คือโหมดที่แนะนำ: รวม `messages.groupChat.unmentionedInbound: "room_event"` กับ `messages.groupChat.visibleReplies: "message_tool"` ใช้เมื่อ agent ควรฟัง ตัดสินใจว่าเมื่อใดการตอบกลับจึงมีประโยชน์ และหลีกเลี่ยงรูปแบบพรอมต์เดิมของการตอบ `NO_REPLY`

รองรับในปัจจุบัน: ช่อง Discord guild, ช่อง Slack และช่องส่วนตัว, DM แบบหลายคนของ Slack, และกลุ่มหรือ supergroup ของ Telegram ช่องกลุ่มอื่นจะคงพฤติกรรมกลุ่มเดิมไว้ เว้นแต่หน้าช่องของช่องนั้นระบุว่ารองรับเหตุการณ์ห้องแบบ ambient

## การตั้งค่าที่แนะนำ

ตั้งค่าพฤติกรรมแชตกลุ่มส่วนกลาง:

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

จากนั้นกำหนดค่าห้องเองให้เป็นแบบเปิดตลอด โดยปิด mention gating สำหรับห้องนั้น ช่องยังต้องได้รับอนุญาตโดย `groupPolicy` ปกติ รายการอนุญาตของห้อง และรายการอนุญาตของผู้ส่ง

หลังจากบันทึก config แล้ว Gateway จะ hot-reload การตั้งค่า `messages` รีสตาร์ทเฉพาะเมื่อการเฝ้าดูไฟล์หรือการโหลด config ใหม่ถูกปิดใช้งาน

## สิ่งที่เปลี่ยนแปลง

เมื่อใช้ `messages.groupChat.unmentionedInbound: "room_event"`:

- ข้อความกลุ่มหรือช่องที่ได้รับอนุญาตและไม่ได้กล่าวถึงจะกลายเป็นเหตุการณ์ห้องแบบเงียบ
- ข้อความที่กล่าวถึงยังคงเป็นคำขอของผู้ใช้
- คำสั่งข้อความและคำสั่งเนทีฟยังคงเป็นคำขอของผู้ใช้
- คำขอยกเลิกหรือหยุดยังคงเป็นคำขอของผู้ใช้
- ข้อความโดยตรงยังคงเป็นคำขอของผู้ใช้

เหตุการณ์ห้องใช้การส่งแบบมองเห็นได้ที่เข้มงวด ข้อความสุดท้ายของ assistant เป็นแบบส่วนตัว agent ต้องเรียก `message(action=send)` เพื่อโพสต์ในห้อง

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

ใช้ config Discord รายช่องเมื่อมีเพียงช่องเดียวที่ควรเป็น ambient:

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

รายการอนุญาตของช่อง Slack ใช้ ID เป็นหลัก ใช้ ID ช่อง เช่น `C12345678` ไม่ใช่ `#channel-name`

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

สำหรับกลุ่ม Telegram บอตต้องสามารถเห็นข้อความกลุ่มปกติได้ หาก `requireMention: false` ให้ปิดโหมดความเป็นส่วนตัวของ BotFather หรือใช้การตั้งค่า Telegram แบบอื่นที่ส่งทราฟฟิกกลุ่มเต็มรูปแบบไปยังบอต

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

ID กลุ่ม Telegram มักเป็นตัวเลขติดลบ เช่น `-1001234567890` อ่าน `chat.id` จาก `openclaw logs --follow`, ส่งต่อข้อความกลุ่มไปยังบอตช่วยหา ID หรือดู Bot API `getUpdates`

## นโยบายเฉพาะ agent

ใช้การ override ของ agent เมื่อมี agent หลายตัวใช้ห้องเดียวกัน แต่ควรมีเพียงตัวเดียวที่ถือว่าบทสนทนาที่ไม่ได้กล่าวถึงเป็นบริบทแบบ ambient:

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

ค่า `agents.list[].groupChat.unmentionedInbound` เฉพาะ agent จะ override `messages.groupChat.unmentionedInbound` สำหรับ agent นั้น

## โหมดการตอบกลับที่มองเห็นได้

`messages.groupChat.visibleReplies` มีค่าเริ่มต้นเป็น `"automatic"` สำหรับคำขอผู้ใช้ในกลุ่ม/ช่องปกติ คงค่าเริ่มต้นนั้นไว้เมื่อคุณต้องการให้ข้อความสุดท้ายของ assistant โพสต์แบบมองเห็นได้โดยไม่ต้องมีการเรียก message-tool อย่างชัดเจน

สำหรับห้องแบบ ambient ที่เปิดตลอด ยังคงแนะนำ `messages.groupChat.visibleReplies: "message_tool"` โดยเฉพาะกับโมเดลรุ่นล่าสุดที่ใช้เครื่องมือได้เชื่อถือได้ เช่น GPT 5.5 ซึ่งช่วยให้ agent ตัดสินใจว่าจะพูดเมื่อใดโดยเรียกเครื่องมือ message หากโมเดลส่งคืนข้อความสุดท้ายโดยไม่เรียกเครื่องมือ OpenClaw จะเก็บข้อความสุดท้ายนั้นเป็นส่วนตัวและบันทึก metadata การส่งที่ถูกระงับ

เหตุการณ์ห้องยังคงเข้มงวด แม้เมื่อคำขอกลุ่มอื่นใช้การตอบกลับอัตโนมัติ เหตุการณ์ห้องแบบ ambient ที่ไม่ได้กล่าวถึงยังต้องใช้ `message(action=send)` สำหรับเอาต์พุตที่มองเห็นได้

## ประวัติ

`messages.groupChat.historyLimit` ควบคุมค่าเริ่มต้นของประวัติกลุ่มส่วนกลาง ช่องสามารถ override ได้ด้วย `channels.<channel>.historyLimit` และบางช่องยังรองรับขีดจำกัดประวัติรายบัญชีด้วย

ตั้งค่า `historyLimit: 0` เพื่อปิดบริบทประวัติกลุ่ม

ช่องที่รองรับ room-event จะเก็บข้อความห้อง ambient ล่าสุดไว้เป็นบริบท Telegram เก็บหน้าต่างต่อกลุ่มแบบ rolling ที่เปิดตลอดซึ่งถูกจำกัดด้วย `historyLimit`; เทิร์นคำขอผู้ใช้จะเลือกรายการหลังจากการตอบกลับที่บันทึกไว้ล่าสุดของบอต ขณะที่เทิร์น room-event จะได้รับหน้าต่างล่าสุดเต็มรูปแบบเพื่อให้โมเดลเห็นโพสต์ล่าสุดของตัวเองได้ คีย์โหมด Telegram `includeGroupHistoryContext` ที่เลิกใช้แล้วจะถูกลบโดย `openclaw doctor --fix`

## การแก้ไขปัญหา

หากห้องแสดงการพิมพ์หรือการใช้ token แต่ไม่มีข้อความที่มองเห็นได้:

1. ยืนยันว่าห้องได้รับอนุญาตโดยรายการอนุญาตของช่องและรายการอนุญาตของผู้ส่ง
2. ยืนยันว่า `requireMention: false` ถูกตั้งไว้ที่ระดับห้องที่คุณคาดไว้
3. ตรวจสอบว่า `messages.groupChat.unmentionedInbound` หรือการ override ของ agent เป็น `"room_event"` หรือไม่
4. ตรวจสอบ logs เพื่อหา metadata ของ payload สุดท้ายที่ถูกระงับ หรือ `didSendViaMessagingTool: false`
5. สำหรับคำขอกลุ่มปกติ ให้คงไว้หรือกู้คืน `messages.groupChat.visibleReplies: "automatic"` หากคุณต้องการให้คำตอบสุดท้ายถูกโพสต์โดยอัตโนมัติ สำหรับห้อง ambient ที่ใช้ `message_tool` ให้ใช้โมเดล/runtime ที่เรียกเครื่องมือได้เชื่อถือได้

หากห้อง ambient ของ Telegram ไม่ทำงานเลย ให้ตรวจสอบโหมดความเป็นส่วนตัวของ BotFather และยืนยันว่า Gateway กำลังได้รับข้อความกลุ่มปกติ

หากห้อง ambient ของ Slack ไม่ทำงาน ให้ตรวจสอบว่าคีย์ช่องเป็น ID ช่อง Slack และแอปมี scope `channels:history` หรือ `groups:history` ที่จำเป็นสำหรับประเภทห้องนั้น

## ที่เกี่ยวข้อง

- [กลุ่ม](/th/channels/groups)
- [Discord](/th/channels/discord)
- [Slack](/th/channels/slack)
- [Telegram](/th/channels/telegram)
- [การแก้ไขปัญหาช่อง](/th/channels/troubleshooting)
- [ข้อมูลอ้างอิงการกำหนดค่าช่อง](/th/gateway/config-channels)
