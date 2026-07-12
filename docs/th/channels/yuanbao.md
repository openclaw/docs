---
read_when:
    - คุณต้องการเชื่อมต่อบอต Yuanbao
    - คุณกำลังกำหนดค่าช่อง Yuanbao
summary: ภาพรวม ฟีเจอร์ และการกำหนดค่าบอต Yuanbao
title: หยวนเป่า
x-i18n:
    generated_at: "2026-07-12T15:56:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao เป็นแพลตฟอร์มผู้ช่วย AI ของ Tencent โดย Plugin `openclaw-plugin-yuanbao` ที่ดูแลโดยชุมชนจะเชื่อมต่อบอต Yuanbao กับ OpenClaw ผ่าน WebSocket สำหรับข้อความส่วนตัวและแชตกลุ่ม

**สถานะ:** พร้อมใช้งานจริงสำหรับข้อความส่วนตัวถึงบอตและแชตกลุ่ม WebSocket เป็นโหมดการเชื่อมต่อเดียวที่รองรับ Plugin นี้ดูแลโดยทีม Tencent Yuanbao ในฐานะรายการแค็ตตาล็อกภายนอก ไม่ได้ดูแลโดยแกนหลักของ OpenClaw รายละเอียดการกำหนดค่าและพฤติกรรมด้านล่าง (นอกเหนือจากการติดตั้งและส่วนติดต่อ CLI ทั่วไป) มาจากเอกสารของ Plugin เอง และยังไม่ได้ตรวจสอบเทียบกับซอร์สของแกนหลัก OpenClaw

## เริ่มต้นอย่างรวดเร็ว

ต้องใช้ OpenClaw 2026.4.10 ขึ้นไป ตรวจสอบด้วย `openclaw --version` และอัปเกรดด้วย `openclaw update`

<Steps>
  <Step title="เพิ่มช่องทาง Yuanbao พร้อมข้อมูลประจำตัวของคุณ">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` ใช้ `appKey:appSecret` ที่คั่นด้วยเครื่องหมายโคลอน รับค่าเหล่านี้จากแอป Yuanbao โดยสร้างบอตในการตั้งค่าแอปพลิเคชันของคุณ
  </Step>

  <Step title="รีสตาร์ต Gateway เพื่อใช้การเปลี่ยนแปลง">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### การตั้งค่าแบบโต้ตอบ (ทางเลือก)

```bash
openclaw channels login --channel yuanbao
```

ทำตามข้อความแจ้งเพื่อป้อน App ID และ App Secret ของคุณ

## การควบคุมการเข้าถึง

### ข้อความส่วนตัว

`channels.yuanbao.dm.policy`:

| ค่า               | พฤติกรรม                                                     |
| ---------------- | ------------------------------------------------------------ |
| `open` (ค่าเริ่มต้น) | อนุญาตผู้ใช้ทั้งหมด                                           |
| `pairing`        | ผู้ใช้ที่ไม่รู้จักจะได้รับรหัสจับคู่ และอนุมัติผ่าน CLI             |
| `allowlist`      | เฉพาะผู้ใช้ใน `allowFrom` เท่านั้นที่สามารถแชตได้                 |
| `disabled`       | ปิดใช้งานข้อความส่วนตัวทั้งหมด                                  |

อนุมัติคำขอจับคู่:

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### แชตกลุ่ม

`channels.yuanbao.requireMention` (ค่าเริ่มต้น `true`): กำหนดให้ต้อง @กล่าวถึงก่อนที่บอตจะตอบในกลุ่ม การตอบกลับข้อความของบอตเองจะถือเป็นการกล่าวถึงโดยปริยาย

## ตัวอย่างการกำหนดค่า

การตั้งค่าพื้นฐานพร้อมนโยบายข้อความส่วนตัวแบบเปิด:

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

จำกัดข้อความส่วนตัวไว้เฉพาะผู้ใช้ที่ระบุ:

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

ปิดข้อกำหนดการ @กล่าวถึงในกลุ่ม:

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

ปรับแต่งการส่งขาออก:

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // พักข้อมูลจนกว่าจะมีจำนวนอักขระเท่านี้
      maxChars: 3000, // บังคับแบ่งเมื่อเกินขีดจำกัดนี้
      idleMs: 5000, // ส่งข้อมูลที่พักไว้โดยอัตโนมัติหลังหมดเวลาว่าง (มิลลิวินาที)
    },
  },
}
```

ตั้งค่า `outboundQueueStrategy: "immediate"` เพื่อส่งแต่ละส่วนทันทีโดยไม่พักข้อมูล

## คำสั่งทั่วไป

| คำสั่ง       | คำอธิบาย                        |
| ---------- | --------------------------- |
| `/help`    | แสดงคำสั่งที่ใช้ได้                 |
| `/status`  | แสดงสถานะบอต                    |
| `/new`     | เริ่มเซสชันใหม่                     |
| `/stop`    | หยุดการทำงานปัจจุบัน                |
| `/restart` | รีสตาร์ต OpenClaw               |
| `/compact` | กระชับบริบทของเซสชัน               |

Yuanbao รองรับเมนูคำสั่งแบบสแลชดั้งเดิม โดยคำสั่งจะซิงค์ไปยังแพลตฟอร์มโดยอัตโนมัติเมื่อ Gateway เริ่มทำงาน

## การแก้ไขปัญหา

**บอตไม่ตอบในแชตกลุ่ม:**

1. ยืนยันว่าเพิ่มบอตลงในกลุ่มแล้ว
2. ยืนยันว่าคุณ @กล่าวถึงบอต (จำเป็นโดยค่าเริ่มต้น)
3. ตรวจสอบบันทึก: `openclaw logs --follow`

**บอตไม่ได้รับข้อความ:**

1. ยืนยันว่าสร้างและอนุมัติบอตในแอป Yuanbao แล้ว
2. ยืนยันว่ากำหนดค่า `appKey` และ `appSecret` อย่างถูกต้อง
3. ยืนยันว่า Gateway กำลังทำงาน: `openclaw gateway status`
4. ตรวจสอบบันทึก: `openclaw logs --follow`

**บอตส่งคำตอบว่างหรือคำตอบสำรอง:**

1. ตรวจสอบว่าโมเดล AI ส่งคืนเนื้อหาที่ถูกต้องหรือไม่
2. คำตอบสำรองเริ่มต้น: "暂时无法解答，你可以换个问题问问我哦"
3. ปรับแต่งด้วย `channels.yuanbao.fallbackReply`

**App Secret รั่วไหล:**

1. รีเซ็ต App Secret ในแอป Yuanbao
2. อัปเดตค่าในการกำหนดค่าของคุณ
3. รีสตาร์ต Gateway: `openclaw gateway restart`

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

- `maxChars`: จำนวนอักขระสูงสุดต่อข้อความ (ค่าเริ่มต้น `3000`)
- `mediaMaxMb`: ขีดจำกัดการอัปโหลด/ดาวน์โหลดสื่อ (ค่าเริ่มต้น `20` MB)
- `overflowPolicy`: พฤติกรรมเมื่อข้อความเกินขีดจำกัด ได้แก่ `"split"` (ค่าเริ่มต้น) หรือ `"stop"`

### การสตรีม

Yuanbao รองรับเอาต์พุตแบบสตรีมระดับบล็อก โดยบอตจะส่งข้อความเป็นส่วน ๆ ระหว่างที่สร้างข้อความ

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // เปิดใช้งานการสตรีมแบบบล็อก (ค่าเริ่มต้น)
    },
  },
}
```

ตั้งค่า `disableBlockStreaming: true` เพื่อส่งคำตอบที่สมบูรณ์ในข้อความเดียว

### บริบทประวัติแชตกลุ่ม

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // ค่าเริ่มต้น: 100 ตั้งเป็น 0 เพื่อปิดใช้งาน
    },
  },
}
```

ควบคุมจำนวนข้อความย้อนหลังที่จะรวมไว้ในบริบท AI สำหรับแชตกลุ่ม

### โหมดตอบกลับข้อความ

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (ค่าเริ่มต้น: "first")
    },
  },
}
```

| ค่า      | พฤติกรรม                                                          |
| ------- | ----------------------------------------------------------------- |
| `off`   | ไม่ตอบกลับแบบอ้างอิงข้อความ                                          |
| `first` | อ้างอิงเฉพาะคำตอบแรกต่อข้อความขาเข้าแต่ละข้อความ (ค่าเริ่มต้น)             |
| `all`   | อ้างอิงทุกคำตอบ                                                     |

### การแทรกคำแนะนำ Markdown

โดยค่าเริ่มต้น บอตจะแทรกคำสั่งในพรอมต์ระบบเพื่อป้องกันไม่ให้โมเดลครอบคำตอบทั้งหมดไว้ในบล็อกโค้ด Markdown

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // ค่าเริ่มต้น: true
    },
  },
}
```

### โหมดแก้ไขข้อบกพร่อง

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

เปิดใช้งานเอาต์พุตบันทึกที่ไม่ได้กรองข้อมูลละเอียดอ่อนสำหรับ ID บอตที่ระบุ

### การกำหนดเส้นทางหลายเอเจนต์

ใช้ `bindings` เพื่อกำหนดเส้นทางข้อความส่วนตัวหรือกลุ่มของ Yuanbao ไปยังเอเจนต์ต่าง ๆ:

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

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (ข้อความส่วนตัว) หรือ `"group"` (แชตกลุ่ม)
- `match.peer.id`: ID ผู้ใช้หรือรหัสกลุ่ม

## ข้อมูลอ้างอิงการกำหนดค่า

การกำหนดค่าฉบับเต็ม: [การกำหนดค่า Gateway](/th/gateway/configuration)

| การตั้งค่า                                   | คำอธิบาย                                                   | ค่าเริ่มต้น                              |
| ------------------------------------------ | --------------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | เปิด/ปิดใช้งานช่องทาง                                        | `true`                                 |
| `channels.yuanbao.defaultAccount`          | บัญชีเริ่มต้นสำหรับการกำหนดเส้นทางขาออก                         | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (การลงนาม + การสร้างตั๋ว)                           | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (การลงนาม)                                     | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | โทเค็นที่ลงนามล่วงหน้า (ข้ามการลงนามตั๋วอัตโนมัติ)                 | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | ชื่อที่แสดงของบัญชี                                           | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | เปิด/ปิดใช้งานบัญชีที่ระบุ                                     | `true`                                 |
| `channels.yuanbao.dm.policy`               | นโยบายข้อความส่วนตัว                                          | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | รายการอนุญาตข้อความส่วนตัว (รายการ ID ผู้ใช้)                     | -                                      |
| `channels.yuanbao.requireMention`          | กำหนดให้ต้อง @กล่าวถึงในกลุ่ม                                  | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | การจัดการข้อความยาว (`split` หรือ `stop`)                      | `split`                                |
| `channels.yuanbao.replyToMode`             | กลยุทธ์การตอบกลับข้อความในกลุ่ม (`off`, `first`, `all`)           | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | กลยุทธ์ขาออก (`merge-text` หรือ `immediate`)                   | `merge-text`                           |
| `channels.yuanbao.minChars`                | Merge-text: จำนวนอักขระขั้นต่ำที่ทริกเกอร์ให้ส่ง                   | `2800`                                 |
| `channels.yuanbao.maxChars`                | Merge-text: จำนวนอักขระสูงสุดต่อข้อความ                        | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Merge-text: เวลาว่างก่อนส่งข้อมูลที่พักไว้โดยอัตโนมัติ (มิลลิวินาที) | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | ขีดจำกัดขนาดสื่อ (MB)                                         | `20`                                   |
| `channels.yuanbao.historyLimit`            | จำนวนรายการบริบทประวัติแชตกลุ่ม                                 | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | ปิดใช้งานเอาต์พุตแบบสตรีมระดับบล็อก                              | `false`                                |
| `channels.yuanbao.fallbackReply`           | คำตอบสำรองเมื่อโมเดลไม่ส่งคืนเนื้อหา                              | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | แทรกคำสั่งป้องกันการครอบทั้งข้อความด้วย Markdown                  | `true`                                 |
| `channels.yuanbao.debugBotIds`             | ID บอตในรายการอนุญาตสำหรับการแก้ไขข้อบกพร่อง (บันทึกที่ไม่กรองข้อมูล) | `[]`                                   |

## ประเภทข้อความที่รองรับ

**รับ:** ข้อความ รูปภาพ ไฟล์ เสียง/ข้อความเสียง วิดีโอ สติกเกอร์/อีโมจิที่กำหนดเอง และองค์ประกอบที่กำหนดเอง (การ์ดลิงก์)

**ส่ง:** ข้อความ (Markdown) รูปภาพ ไฟล์ เสียง วิดีโอ และสติกเกอร์

**เธรดและการตอบกลับ:** รองรับการตอบกลับแบบอ้างอิงข้อความ (กำหนดค่าได้ผ่าน `replyToMode`) แต่แพลตฟอร์มไม่รองรับการตอบกลับในเธรด

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) - ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตนข้อความส่วนตัวและขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความปลอดภัย
