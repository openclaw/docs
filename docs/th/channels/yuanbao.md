---
read_when:
    - คุณต้องการเชื่อมต่อบอต Yuanbao
    - คุณกำลังตั้งค่าช่องทาง Yuanbao
summary: ภาพรวม ฟีเจอร์ และการกำหนดค่าบอต Yuanbao
title: Yuanbao
x-i18n:
    generated_at: "2026-05-06T09:04:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3830af0206854e500132edfc9340724fe97f90ca60fa23ce05202d96d9cacf04
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao คือแพลตฟอร์มผู้ช่วย AI ของ Tencent Plugin ช่องทางของ OpenClaw
เชื่อมต่อบอต Yuanbao กับ OpenClaw ผ่าน WebSocket เพื่อให้บอตโต้ตอบกับผู้ใช้
ผ่านข้อความส่วนตัวและแชทกลุ่มได้

**สถานะ:** พร้อมใช้งานจริงสำหรับข้อความส่วนตัวกับบอตและแชทกลุ่ม WebSocket เป็นโหมดการเชื่อมต่อเดียวที่รองรับ

---

## เริ่มต้นอย่างรวดเร็ว

> **ต้องใช้ OpenClaw 2026.4.10 ขึ้นไป** เรียกใช้ `openclaw --version` เพื่อตรวจสอบ อัปเกรดด้วย `openclaw update`

<Steps>
  <Step title="Add the Yuanbao channel with your credentials">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  ค่า `--token` ใช้รูปแบบ `appKey:appSecret` ที่คั่นด้วยเครื่องหมายโคลอน คุณสามารถรับค่าเหล่านี้จากแอป Yuanbao ได้โดยสร้างหุ่นยนต์ในการตั้งค่าแอปพลิเคชันของคุณ
  </Step>

  <Step title="After setup completes, restart the gateway to apply the changes">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### การตั้งค่าแบบโต้ตอบ (ทางเลือก)

คุณยังสามารถใช้วิซาร์ดแบบโต้ตอบได้:

```bash
openclaw channels login --channel yuanbao
```

ทำตามพรอมป์เพื่อป้อน App ID และ App Secret ของคุณ

---

## การควบคุมการเข้าถึง

### ข้อความส่วนตัว

กำหนดค่า `dmPolicy` เพื่อควบคุมว่าใครสามารถส่ง DM ถึงบอตได้:

- `"pairing"` - ผู้ใช้ที่ไม่รู้จักจะได้รับรหัสจับคู่ อนุมัติผ่าน CLI
- `"allowlist"` - เฉพาะผู้ใช้ที่อยู่ใน `allowFrom` เท่านั้นที่แชทได้
- `"open"` - อนุญาตผู้ใช้ทั้งหมด (ค่าเริ่มต้น)
- `"disabled"` - ปิดใช้งาน DM ทั้งหมด

**อนุมัติคำขอจับคู่:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### แชทกลุ่ม

**ข้อกำหนดการกล่าวถึง** (`channels.yuanbao.requireMention`):

- `true` - ต้อง @mention (ค่าเริ่มต้น)
- `false` - ตอบกลับโดยไม่ต้อง @mention

การตอบกลับข้อความของบอตในแชทกลุ่มจะถือเป็นการกล่าวถึงโดยนัย

---

## ตัวอย่างการกำหนดค่า

### การตั้งค่าพื้นฐานพร้อมนโยบาย DM แบบเปิด

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

### จำกัด DM เฉพาะผู้ใช้บางราย

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

### ปิดข้อกำหนด @mention ในกลุ่ม

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### ปรับการส่งข้อความขาออกให้เหมาะสม

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### ปรับกลยุทธ์ merge-text

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

---

## คำสั่งทั่วไป

| คำสั่ง     | คำอธิบาย                |
| ---------- | --------------------------- |
| `/help`    | แสดงคำสั่งที่มีอยู่      |
| `/status`  | แสดงสถานะบอต             |
| `/new`     | เริ่มเซสชันใหม่          |
| `/stop`    | หยุดการรันปัจจุบัน      |
| `/restart` | รีสตาร์ต OpenClaw        |
| `/compact` | ย่อบริบทของเซสชัน       |

> Yuanbao รองรับเมนูคำสั่งสแลชแบบเนทีฟ คำสั่งจะซิงค์ไปยังแพลตฟอร์มโดยอัตโนมัติเมื่อ Gateway เริ่มทำงาน

---

## การแก้ไขปัญหา

### บอตไม่ตอบสนองในแชทกลุ่ม

1. ตรวจสอบให้แน่ใจว่าได้เพิ่มบอตเข้ากลุ่มแล้ว
2. ตรวจสอบให้แน่ใจว่าคุณ @mention บอต (จำเป็นตามค่าเริ่มต้น)
3. ตรวจสอบบันทึก: `openclaw logs --follow`

### บอตไม่ได้รับข้อความ

1. ตรวจสอบให้แน่ใจว่าบอตถูกสร้างและอนุมัติในแอป Yuanbao แล้ว
2. ตรวจสอบให้แน่ใจว่า `appKey` และ `appSecret` ได้รับการกำหนดค่าอย่างถูกต้อง
3. ตรวจสอบให้แน่ใจว่า Gateway กำลังทำงาน: `openclaw gateway status`
4. ตรวจสอบบันทึก: `openclaw logs --follow`

### บอตส่งการตอบกลับว่างหรือการตอบกลับสำรอง

1. ตรวจสอบว่าโมเดล AI กำลังส่งคืนเนื้อหาที่ถูกต้องหรือไม่
2. การตอบกลับสำรองเริ่มต้นคือ: "暂时无法解答，你可以换个问题问问我哦"
3. ปรับแต่งได้ผ่าน `channels.yuanbao.fallbackReply`

### App Secret รั่วไหล

1. รีเซ็ต App Secret ใน YuanBao APP
2. อัปเดตค่าในการกำหนดค่าของคุณ
3. รีสตาร์ต Gateway: `openclaw gateway restart`

---

## การกำหนดค่าขั้นสูง

### หลายบัญชี

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` ควบคุมว่าจะใช้บัญชีใดเมื่อ API ขาออกไม่ได้ระบุ `accountId`

### ขีดจำกัดข้อความ

- `maxChars` - จำนวนอักขระสูงสุดต่อข้อความเดียว (ค่าเริ่มต้น: `3000` อักขระ)
- `mediaMaxMb` - ขีดจำกัดการอัปโหลด/ดาวน์โหลดสื่อ (ค่าเริ่มต้น: `20` MB)
- `overflowPolicy` - พฤติกรรมเมื่อข้อความเกินขีดจำกัด: `"split"` (ค่าเริ่มต้น) หรือ `"stop"`

### การสตรีม

Yuanbao รองรับเอาต์พุตการสตรีมระดับบล็อก เมื่อเปิดใช้งาน บอตจะส่งข้อความเป็นชิ้นๆ ขณะที่สร้างข้อความ

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

ตั้งค่า `disableBlockStreaming: true` เพื่อส่งการตอบกลับทั้งหมดในข้อความเดียว

### บริบทประวัติแชทกลุ่ม

ควบคุมจำนวนข้อความย้อนหลังที่จะรวมไว้ในบริบท AI สำหรับแชทกลุ่ม:

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### โหมดตอบกลับถึงข้อความ

ควบคุมวิธีที่บอตอ้างอิงข้อความเมื่อตอบกลับในแชทกลุ่ม:

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| ค่า       | พฤติกรรม                                                |
| --------- | -------------------------------------------------------- |
| `"off"`   | ไม่มีการตอบกลับแบบอ้างอิง                               |
| `"first"` | อ้างอิงเฉพาะการตอบกลับแรกต่อข้อความขาเข้า (ค่าเริ่มต้น) |
| `"all"`   | อ้างอิงทุกการตอบกลับ                                    |

### การแทรกคำแนะนำ Markdown

ตามค่าเริ่มต้น บอตจะแทรกคำแนะนำในพรอมป์ระบบเพื่อป้องกันไม่ให้โมเดล AI ครอบการตอบกลับทั้งหมดไว้ในบล็อกโค้ด markdown

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### โหมดดีบัก

เปิดใช้งานเอาต์พุตบันทึกที่ไม่ผ่านการล้างข้อมูลสำหรับ ID บอตบางรายการ:

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### การกำหนดเส้นทางหลายเอเจนต์

ใช้ `bindings` เพื่อกำหนดเส้นทาง DM หรือกลุ่มของ Yuanbao ไปยังเอเจนต์ต่างๆ

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

ฟิลด์การกำหนดเส้นทาง:

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (DM) หรือ `"group"` (แชทกลุ่ม)
- `match.peer.id`: ID ผู้ใช้หรือรหัสกลุ่ม

---

## ข้อมูลอ้างอิงการกำหนดค่า

การกำหนดค่าแบบเต็ม: [การกำหนดค่า Gateway](/th/gateway/configuration)

| การตั้งค่า                                 | คำอธิบาย                                          | ค่าเริ่มต้น                            |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | เปิด/ปิดช่องทาง                                   | `true`                                 |
| `channels.yuanbao.defaultAccount`          | บัญชีเริ่มต้นสำหรับการกำหนดเส้นทางขาออก          | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (ใช้สำหรับการลงนามและการสร้างตั๋ว)        | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (ใช้สำหรับการลงนาม)                    | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | โทเค็นที่ลงนามไว้ล่วงหน้า (ข้ามการลงนามตั๋วอัตโนมัติ) | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | ชื่อที่แสดงของบัญชี                               | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | เปิด/ปิดบัญชีเฉพาะ                                | `true`                                 |
| `channels.yuanbao.dm.policy`               | นโยบาย DM                                         | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | รายการอนุญาต DM (รายการ ID ผู้ใช้)                | -                                      |
| `channels.yuanbao.requireMention`          | ต้อง @mention ในกลุ่ม                             | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | การจัดการข้อความยาว (`split` หรือ `stop`)         | `split`                                |
| `channels.yuanbao.replyToMode`             | กลยุทธ์การตอบกลับถึงข้อความของกลุ่ม (`off`, `first`, `all`) | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | กลยุทธ์ขาออก (`merge-text` หรือ `immediate`)      | `merge-text`                           |
| `channels.yuanbao.minChars`                | Merge-text: จำนวนอักขระขั้นต่ำเพื่อกระตุ้นการส่ง | `2800`                                 |
| `channels.yuanbao.maxChars`                | Merge-text: จำนวนอักขระสูงสุดต่อข้อความ          | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Merge-text: เวลารอเมื่อไม่มีการใช้งานก่อน auto-flush (ms) | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | ขีดจำกัดขนาดสื่อ (MB)                             | `20`                                   |
| `channels.yuanbao.historyLimit`            | รายการบริบทประวัติแชทกลุ่ม                        | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | ปิดใช้งานเอาต์พุตการสตรีมระดับบล็อก              | `false`                                |
| `channels.yuanbao.fallbackReply`           | การตอบกลับสำรองเมื่อ AI ไม่ส่งคืนเนื้อหา          | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | แทรกคำแนะนำป้องกันการครอบ markdown               | `true`                                 |
| `channels.yuanbao.debugBotIds`             | ID บอตในรายการอนุญาตสำหรับดีบัก (บันทึกที่ไม่ผ่านการล้างข้อมูล) | `[]`                                   |

---

## ประเภทข้อความที่รองรับ

### รับ

- ✅ ข้อความ
- ✅ รูปภาพ
- ✅ ไฟล์
- ✅ เสียง / ข้อความเสียง
- ✅ วิดีโอ
- ✅ สติกเกอร์ / อีโมจิแบบกำหนดเอง
- ✅ องค์ประกอบแบบกำหนดเอง (การ์ดลิงก์ ฯลฯ)

### ส่ง

- ✅ ข้อความ (พร้อมรองรับ markdown)
- ✅ รูปภาพ
- ✅ ไฟล์
- ✅ เสียง
- ✅ วิดีโอ
- ✅ สติกเกอร์

### เธรดและการตอบกลับ

- ✅ การตอบกลับแบบอ้างอิง (กำหนดค่าได้ผ่าน `replyToMode`)
- ❌ การตอบกลับในเธรด (แพลตฟอร์มไม่รองรับ)

---

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) - ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชทกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความปลอดภัย
