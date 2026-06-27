---
read_when:
    - การตั้งค่า Matrix ใน OpenClaw
    - การกำหนดค่า Matrix E2EE และการยืนยัน
summary: สถานะการรองรับเมทริกซ์ การตั้งค่า และตัวอย่างการกำหนดค่า
title: เมทริกซ์
x-i18n:
    generated_at: "2026-06-27T17:11:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f7c666294daf6a38e4a25ee7f2ad2d0d87dcdabc13291b12e4861f89421a779
    source_path: channels/matrix.md
    workflow: 16
---

Matrix เป็น Plugin ช่องทางที่ดาวน์โหลดได้สำหรับ OpenClaw
ใช้ `matrix-js-sdk` อย่างเป็นทางการ และรองรับ DM, ห้อง, เธรด, สื่อ, รีแอ็กชัน, โพล, ตำแหน่งที่ตั้ง และ E2EE

## ติดตั้ง

ติดตั้ง Matrix จาก ClawHub ก่อนกำหนดค่าช่องทาง:

```bash
openclaw plugins install @openclaw/matrix
```

สเปก Plugin แบบไม่ระบุแหล่งที่มาจะลอง ClawHub ก่อน แล้วจึงใช้ npm เป็นทางสำรอง หากต้องการบังคับแหล่งที่มาของรีจิสทรี ให้ใช้ `openclaw plugins install clawhub:@openclaw/matrix` หรือ `openclaw plugins install npm:@openclaw/matrix`

จากเช็กเอาต์ในเครื่อง:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` จะลงทะเบียนและเปิดใช้ Plugin จึงไม่ต้องมีขั้นตอน `openclaw plugins enable matrix` แยกต่างหาก แต่ Plugin จะยังไม่ทำอะไรจนกว่าคุณจะกำหนดค่าช่องทางด้านล่าง ดู [Plugin](/th/tools/plugin) สำหรับลักษณะการทำงานทั่วไปของ Plugin และกฎการติดตั้ง

## ตั้งค่า

1. สร้างบัญชี Matrix บน homeserver ของคุณ
2. กำหนดค่า `channels.matrix` ด้วย `homeserver` + `accessToken` หรือ `homeserver` + `userId` + `password`
3. รีสตาร์ต Gateway
4. เริ่ม DM กับบอต หรือเชิญบอตเข้าห้อง (ดู [การเข้าร่วมอัตโนมัติ](#auto-join) - คำเชิญใหม่จะเข้ามาได้ก็ต่อเมื่อ `autoJoin` อนุญาต)

### การตั้งค่าแบบโต้ตอบ

```bash
openclaw channels add
openclaw configure --section channels
```

วิซาร์ดจะถาม: URL ของ homeserver, วิธีตรวจสอบสิทธิ์ (โทเค็นการเข้าถึงหรือรหัสผ่าน), ID ผู้ใช้ (เฉพาะการตรวจสอบสิทธิ์ด้วยรหัสผ่าน), ชื่ออุปกรณ์ที่ไม่บังคับ, ว่าจะเปิดใช้ E2EE หรือไม่ และว่าจะกำหนดค่าสิทธิ์เข้าถึงห้องกับการเข้าร่วมอัตโนมัติหรือไม่

หากมี env vars `MATRIX_*` ที่ตรงกันอยู่แล้ว และบัญชีที่เลือกยังไม่มีข้อมูลตรวจสอบสิทธิ์ที่บันทึกไว้ วิซาร์ดจะเสนอทางลัด env-var หากต้องการแก้ชื่อห้องก่อนบันทึก allowlist ให้รัน `openclaw channels resolve --channel matrix "Project Room"` เมื่อเปิดใช้ E2EE วิซาร์ดจะเขียนค่ากำหนดและรัน bootstrap เดียวกับ [`openclaw matrix encryption setup`](#encryption-and-verification)

### ค่ากำหนดขั้นต่ำ

แบบใช้โทเค็น:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

แบบใช้รหัสผ่าน (โทเค็นจะถูกแคชหลังเข้าสู่ระบบครั้งแรก):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

### การเข้าร่วมอัตโนมัติ

`channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ด้วยค่าเริ่มต้นนี้ บอตจะไม่ปรากฏในห้องใหม่หรือ DM จากคำเชิญใหม่จนกว่าคุณจะเข้าร่วมเอง

OpenClaw ไม่สามารถบอกได้ ณ เวลาที่ได้รับคำเชิญว่าห้องที่เชิญเป็น DM หรือกลุ่ม ดังนั้นคำเชิญทั้งหมด รวมถึงคำเชิญลักษณะ DM จะผ่าน `autoJoin` ก่อน `dm.policy` จะมีผลในภายหลังเท่านั้น หลังจากบอตเข้าร่วมแล้วและห้องถูกจัดประเภทแล้ว

<Warning>
ตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` เพื่อจำกัดคำเชิญที่บอตยอมรับ หรือ `autoJoin: "always"` เพื่อยอมรับทุกคำเชิญ

`autoJoinAllowlist` รับเฉพาะเป้าหมายที่เสถียร: `!roomId:server`, `#alias:server` หรือ `*` ชื่อห้องแบบธรรมดาจะถูกปฏิเสธ รายการ alias จะถูกแก้กับ homeserver ไม่ใช่กับสถานะที่ห้องที่เชิญอ้างไว้
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

หากต้องการยอมรับทุกคำเชิญ ให้ใช้ `autoJoin: "always"`

### รูปแบบเป้าหมาย allowlist

ควรเติม allowlist ของ DM และห้องด้วย ID ที่เสถียร:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): ใช้ `@user:server` ชื่อที่แสดงจะถูกละเว้นโดยค่าเริ่มต้นเพราะเปลี่ยนแปลงได้ ตั้งค่า `dangerouslyAllowNameMatching: true` เฉพาะเมื่อคุณต้องการความเข้ากันได้กับรายการชื่อที่แสดงอย่างชัดเจนเท่านั้น
- คีย์ allowlist ของห้อง (`groups`, `rooms` รุ่นเก่า): ใช้ `!room:server` หรือ `#alias:server` ชื่อห้องแบบธรรมดาจะถูกละเว้นโดยค่าเริ่มต้น ตั้งค่า `dangerouslyAllowNameMatching: true` เฉพาะเมื่อคุณต้องการความเข้ากันได้กับการค้นหาชื่อห้องที่เข้าร่วมแล้วอย่างชัดเจนเท่านั้น
- allowlist ของคำเชิญ (`autoJoinAllowlist`): ใช้ `!room:server`, `#alias:server` หรือ `*` ชื่อห้องแบบธรรมดาจะถูกปฏิเสธ

### การทำให้ ID บัญชีเป็นมาตรฐาน

วิซาร์ดจะแปลงชื่อที่อ่านง่ายให้เป็น ID บัญชีที่ทำให้เป็นมาตรฐานแล้ว ตัวอย่างเช่น `Ops Bot` จะกลายเป็น `ops-bot` เครื่องหมายวรรคตอนจะถูก escape ในชื่อ env-var แบบมีขอบเขต เพื่อให้สองบัญชีไม่ชนกัน: `-` → `_X2D_` ดังนั้น `ops-prod` จะแมปเป็น `MATRIX_OPS_X2D_PROD_*`

### ข้อมูลประจำตัวที่แคชไว้

Matrix เก็บข้อมูลประจำตัวที่แคชไว้ใต้ `~/.openclaw/credentials/matrix/`:

- บัญชีเริ่มต้น: `credentials.json`
- บัญชีที่มีชื่อ: `credentials-<account>.json`

เมื่อมีข้อมูลประจำตัวที่แคชไว้ตรงนั้น OpenClaw จะถือว่า Matrix ถูกกำหนดค่าแล้ว แม้โทเค็นการเข้าถึงจะไม่ได้อยู่ในไฟล์ค่ากำหนดก็ตาม ซึ่งครอบคลุมการตั้งค่า, `openclaw doctor` และการตรวจสอบสถานะช่องทาง

### ตัวแปรสภาพแวดล้อม

ใช้เมื่อไม่ได้ตั้งค่าคีย์ค่ากำหนดที่เทียบเท่า บัญชีเริ่มต้นใช้ชื่อที่ไม่มี prefix ส่วนบัญชีที่มีชื่อจะใช้ ID บัญชีแทรกก่อน suffix

| บัญชีเริ่มต้น          | บัญชีที่มีชื่อ (`<ID>` คือ ID บัญชีที่ทำให้เป็นมาตรฐานแล้ว) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

สำหรับบัญชี `ops` ชื่อจะกลายเป็น `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` และอื่น ๆ env vars ของ recovery-key จะถูกอ่านโดยโฟลว์ CLI ที่รองรับ recovery (`verify backup restore`, `verify device`, `verify bootstrap`) เมื่อคุณส่งคีย์ผ่าน pipe เข้ามาด้วย `--recovery-key-stdin`

`MATRIX_HOMESERVER` ไม่สามารถตั้งจาก `.env` ของ workspace ได้ ดู [ไฟล์ `.env` ของ workspace](/th/gateway/security)

## ตัวอย่างค่ากำหนด

ฐานค่ากำหนดที่ใช้งานได้จริงพร้อมการจับคู่ DM, allowlist ห้อง และ E2EE:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

## ตัวอย่างแสดงผลล่วงหน้าของการสตรีม

การสตรีมคำตอบของ Matrix ต้องเลือกเปิดใช้ `streaming` ควบคุมวิธีที่ OpenClaw ส่งคำตอบของผู้ช่วยที่กำลังดำเนินอยู่ ส่วน `blockStreaming` ควบคุมว่าจะเก็บแต่ละบล็อกที่เสร็จแล้วไว้เป็นข้อความ Matrix ของตัวเองหรือไม่

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

หากต้องการคงตัวอย่างคำตอบแบบสดไว้ แต่ซ่อนบรรทัดเครื่องมือ/ความคืบหน้าชั่วคราว ให้ใช้รูปแบบออบเจ็กต์:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

| `streaming`       | ลักษณะการทำงาน                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (ค่าเริ่มต้น) | รอคำตอบเต็ม แล้วส่งครั้งเดียว `true` ↔ `"partial"`, `false` ↔ `"off"`                                                                                        |
| `"partial"`       | แก้ไขข้อความตัวอักษรปกติหนึ่งรายการในตำแหน่งเดิมขณะที่โมเดลเขียนบล็อกปัจจุบัน ไคลเอนต์ Matrix มาตรฐานอาจแจ้งเตือนเมื่อตัวอย่างแรกปรากฏ ไม่ใช่เมื่อแก้ไขครั้งสุดท้าย              |
| `"quiet"`         | เหมือนกับ `"partial"` แต่ข้อความเป็น notice ที่ไม่แจ้งเตือน ผู้รับจะได้รับการแจ้งเตือนก็ต่อเมื่อกฎ push ต่อผู้ใช้ตรงกับการแก้ไขที่สรุปแล้ว (ดูด้านล่าง) |

`blockStreaming` เป็นอิสระจาก `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (ค่าเริ่มต้น)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | แบบร่างสดสำหรับบล็อกปัจจุบัน บล็อกที่เสร็จแล้วถูกเก็บเป็นข้อความ | แบบร่างสดสำหรับบล็อกปัจจุบัน แล้วสรุปในตำแหน่งเดิม |
| `"off"`                 | ข้อความ Matrix ที่แจ้งเตือนหนึ่งรายการต่อบล็อกที่เสร็จแล้ว                     | ข้อความ Matrix ที่แจ้งเตือนหนึ่งรายการสำหรับคำตอบเต็ม      |

หมายเหตุ:

- หากตัวอย่างแสดงผลล่วงหน้าโตเกินขีดจำกัดขนาดต่อ event ของ Matrix OpenClaw จะหยุดการสตรีมตัวอย่างแสดงผลล่วงหน้าและกลับไปใช้การส่งเฉพาะผลสุดท้าย
- คำตอบสื่อจะส่งไฟล์แนบตามปกติเสมอ หากตัวอย่างแสดงผลล่วงหน้าที่ค้างอยู่ไม่สามารถนำกลับมาใช้ใหม่ได้อย่างปลอดภัย OpenClaw จะ redact ตัวอย่างนั้นก่อนส่งคำตอบสื่อสุดท้าย
- การอัปเดตตัวอย่างแสดงผลล่วงหน้าของความคืบหน้าเครื่องมือจะเปิดใช้โดยค่าเริ่มต้นเมื่อการสตรีมตัวอย่างแสดงผลล่วงหน้าของ Matrix ทำงานอยู่ ตั้งค่า `streaming.preview.toolProgress: false` เพื่อคงการแก้ไขตัวอย่างแสดงผลล่วงหน้าสำหรับข้อความคำตอบ แต่ปล่อยให้ความคืบหน้าเครื่องมืออยู่บนเส้นทางการส่งปกติ
- การแก้ไขตัวอย่างแสดงผลล่วงหน้ามีค่าใช้จ่ายเป็นการเรียก Matrix API เพิ่มเติม คง `streaming: "off"` ไว้หากคุณต้องการโปรไฟล์ rate-limit ที่ระมัดระวังที่สุด

## ข้อความเสียง

โน้ตเสียง Matrix ขาเข้าจะถูกถอดเสียงก่อน gate การ mention ห้อง วิธีนี้ทำให้โน้ตเสียงที่พูดชื่อบอตสามารถเรียก agent ในห้องที่มี `requireMention: true` ได้ และให้ transcript แก่ agent แทนที่จะให้เพียง placeholder ของไฟล์แนบเสียง

Matrix ใช้ผู้ให้บริการสื่อเสียงที่ใช้ร่วมกันซึ่งกำหนดค่าใต้ `tools.media.audio` เช่น OpenAI `gpt-4o-mini-transcribe` ดู [ภาพรวมเครื่องมือสื่อ](/th/tools/media-overview) สำหรับการตั้งค่าผู้ให้บริการและขีดจำกัด

รายละเอียดลักษณะการทำงาน:

- event `m.audio` และ event `m.file` ที่มีชนิด MIME เป็น `audio/*` มีสิทธิ์ใช้งานได้
- ในห้องที่เข้ารหัส OpenClaw จะถอดรหัสไฟล์แนบผ่านเส้นทางสื่อ Matrix ที่มีอยู่ก่อนถอดเสียง
- transcript จะถูกทำเครื่องหมายว่าสร้างโดยเครื่องและไม่น่าเชื่อถือในพรอมป์ของ agent
- ไฟล์แนบจะถูกทำเครื่องหมายว่าถอดเสียงแล้ว เพื่อให้เครื่องมือสื่อปลายทางไม่ถอดเสียงโน้ตเสียงเดียวกันอีกครั้ง
- ตั้งค่า `tools.media.audio.enabled: false` เพื่อปิดใช้การถอดเสียงทั่วทั้งระบบ

## เมตาดาต้าการอนุมัติ

พรอมป์การอนุมัติแบบเนทีฟของ Matrix เป็น event `m.room.message` ปกติที่มีเนื้อหา event แบบกำหนดเองเฉพาะ OpenClaw ใต้ `com.openclaw.approval` Matrix อนุญาตคีย์เนื้อหา event แบบกำหนดเอง ดังนั้นไคลเอนต์มาตรฐานยังคงแสดง body ข้อความได้ ขณะที่ไคลเอนต์ที่รองรับ OpenClaw สามารถอ่าน id การอนุมัติ, ชนิด, สถานะ, การตัดสินใจที่มีให้ใช้ และรายละเอียด exec/Plugin แบบมีโครงสร้างได้

เมื่อพรอมป์การอนุมัติยาวเกินกว่า event Matrix เดียว OpenClaw จะแบ่งข้อความที่มองเห็นออกเป็นชิ้น และแนบ `com.openclaw.approval` กับชิ้นแรกเท่านั้น รีแอ็กชันสำหรับการตัดสินใจอนุญาต/ปฏิเสธจะผูกกับ event แรกนั้น ดังนั้นพรอมป์ยาวจะคงเป้าหมายการอนุมัติเดียวกับพรอมป์ event เดียว

### กฎ push แบบโฮสต์เองสำหรับตัวอย่างแสดงผลล่วงหน้าที่สรุปแล้วแบบเงียบ

`streaming: "quiet"` จะแจ้งเตือนผู้รับก็ต่อเมื่อบล็อกหรือ turn ถูกสรุปแล้วเท่านั้น โดยกฎ push ต่อผู้ใช้ต้องตรงกับ marker ตัวอย่างแสดงผลล่วงหน้าที่สรุปแล้ว ดู [กฎ push ของ Matrix สำหรับตัวอย่างแสดงผลล่วงหน้าแบบเงียบ](/th/channels/matrix-push-rules) สำหรับสูตรเต็ม (โทเค็นผู้รับ, การตรวจสอบ pusher, การติดตั้งกฎ, หมายเหตุราย homeserver)

## ห้องบอตถึงบอต

โดยค่าเริ่มต้น ข้อความ Matrix จากบัญชี Matrix ของ OpenClaw อื่นที่กำหนดค่าไว้จะถูกละเว้น

ใช้ `allowBots` เมื่อคุณต้องการทราฟฟิก Matrix ระหว่าง agent โดยเจตนา

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` ยอมรับข้อความจากบัญชีบอต Matrix อื่นที่กำหนดค่าไว้ในห้องและ DM ที่อนุญาต
- `allowBots: "mentions"` ยอมรับข้อความเหล่านั้นเฉพาะเมื่อมีการกล่าวถึงบอตนี้อย่างเห็นได้ชัดในห้องเท่านั้น DM ยังคงได้รับอนุญาต
- `groups.<room>.allowBots` แทนที่การตั้งค่าระดับบัญชีสำหรับห้องเดียว
- ข้อความจากบอตที่กำหนดค่าไว้และได้รับการยอมรับใช้ [การป้องกันลูปบอต](/th/channels/bot-loop-protection) ร่วมกัน กำหนดค่า `channels.defaults.botLoopProtection` แล้วแทนที่ด้วย `channels.matrix.botLoopProtection` หรือ `channels.matrix.groups.<room>.botLoopProtection` เมื่อห้องหนึ่งต้องใช้งบประมาณที่ต่างกัน
- OpenClaw ยังคงละเว้นข้อความจาก ID ผู้ใช้ Matrix เดียวกันเพื่อหลีกเลี่ยงลูปการตอบตัวเอง
- Matrix ไม่เปิดเผยแฟล็กบอตแบบเนทีฟที่นี่ OpenClaw ถือว่า "เขียนโดยบอต" หมายถึง "ส่งโดยบัญชี Matrix อื่นที่กำหนดค่าไว้บน OpenClaw gateway นี้"

ใช้รายการห้องที่อนุญาตแบบเข้มงวดและข้อกำหนดการกล่าวถึงเมื่อเปิดใช้การรับส่งข้อมูลระหว่างบอตในห้องที่ใช้ร่วมกัน

## การเข้ารหัสและการยืนยัน

ในห้องที่เข้ารหัส (E2EE) อีเวนต์รูปภาพขาออกใช้ `thumbnail_file` เพื่อให้ภาพตัวอย่างถูกเข้ารหัสพร้อมกับไฟล์แนบแบบเต็ม ห้องที่ไม่ได้เข้ารหัสยังคงใช้ `thumbnail_url` แบบธรรมดา ไม่จำเป็นต้องกำหนดค่า Plugin จะตรวจจับสถานะ E2EE โดยอัตโนมัติ

คำสั่ง `openclaw matrix` ทั้งหมดรองรับ `--verbose` (การวินิจฉัยแบบเต็ม), `--json` (เอาต์พุตที่เครื่องอ่านได้) และ `--account <id>` (การตั้งค่าหลายบัญชี) โดยค่าเริ่มต้น เอาต์พุตจะกระชับพร้อมการบันทึก SDK ภายในแบบเงียบ ตัวอย่างด้านล่างแสดงรูปแบบมาตรฐาน เพิ่มแฟล็กตามต้องการ

### เปิดใช้การเข้ารหัส

```bash
openclaw matrix encryption setup
```

เริ่มต้น secret storage และ cross-signing สร้างข้อมูลสำรอง room-key หากจำเป็น จากนั้นพิมพ์สถานะและขั้นตอนถัดไป แฟล็กที่มีประโยชน์:

- `--recovery-key <key>` ใช้คีย์กู้คืนก่อนเริ่มต้น (ควรใช้รูปแบบ stdin ที่จัดทำเอกสารไว้ด้านล่าง)
- `--force-reset-cross-signing` ทิ้งตัวตน cross-signing ปัจจุบันและสร้างใหม่ (ใช้เฉพาะเมื่อจงใจเท่านั้น)

สำหรับบัญชีใหม่ ให้เปิดใช้ E2EE ตอนสร้างบัญชี:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` เป็นนามแฝงของ `--enable-e2ee`

การกำหนดค่าแบบแมนนวลที่เทียบเท่า:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

### สถานะและสัญญาณความเชื่อถือ

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` รายงานสัญญาณความเชื่อถืออิสระสามรายการ (`--verbose` แสดงทั้งหมด):

- `Locally trusted`: ได้รับความเชื่อถือโดยไคลเอนต์นี้เท่านั้น
- `Cross-signing verified`: SDK รายงานการยืนยันผ่าน cross-signing
- `Signed by owner`: ลงนามโดยคีย์ self-signing ของคุณเอง (สำหรับการวินิจฉัยเท่านั้น)

`Verified by owner` จะเป็น `yes` เฉพาะเมื่อ `Cross-signing verified` เป็น `yes` เท่านั้น ความเชื่อถือภายในเครื่องหรือลายเซ็นเจ้าของเพียงอย่างเดียวไม่เพียงพอ

`--allow-degraded-local-state` ส่งคืนการวินิจฉัยแบบดีที่สุดเท่าที่ทำได้โดยไม่ต้องเตรียมบัญชี Matrix ก่อน มีประโยชน์สำหรับการตรวจสอบแบบออฟไลน์หรือที่กำหนดค่าบางส่วน

### ยืนยันอุปกรณ์นี้ด้วยคีย์กู้คืน

คีย์กู้คืนเป็นข้อมูลละเอียดอ่อน ให้ส่งผ่าน stdin แทนการส่งบนบรรทัดคำสั่ง ตั้งค่า `MATRIX_RECOVERY_KEY` (หรือ `MATRIX_<ID>_RECOVERY_KEY` สำหรับบัญชีที่มีชื่อ):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

คำสั่งรายงานสามสถานะ:

- `Recovery key accepted`: Matrix ยอมรับคีย์สำหรับ secret storage หรือความเชื่อถือของอุปกรณ์
- `Backup usable`: สามารถโหลดข้อมูลสำรอง room-key ด้วยวัสดุกู้คืนที่เชื่อถือได้
- `Device verified by owner`: อุปกรณ์นี้มีความเชื่อถือตัวตน cross-signing ของ Matrix แบบเต็ม

คำสั่งจะออกด้วยสถานะไม่เป็นศูนย์เมื่อความเชื่อถือตัวตนแบบเต็มยังไม่สมบูรณ์ แม้คีย์กู้คืนจะปลดล็อกวัสดุข้อมูลสำรองแล้วก็ตาม ในกรณีนั้น ให้ทำ self-verification ให้เสร็จจากไคลเอนต์ Matrix อื่น:

```bash
openclaw matrix verify self
```

`verify self` รอจนกว่า `Cross-signing verified: yes` ก่อนที่จะออกสำเร็จ ใช้ `--timeout-ms <ms>` เพื่อปรับเวลารอ

รูปแบบคีย์ตามตัวอักษร `openclaw matrix verify device "<recovery-key>"` ก็ยอมรับเช่นกัน แต่คีย์จะไปอยู่ในประวัติ shell ของคุณ

### เริ่มต้นหรือซ่อมแซม cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` เป็นคำสั่งซ่อมแซมและตั้งค่าสำหรับบัญชีที่เข้ารหัส ตามลำดับ คำสั่งจะ:

- เริ่มต้น secret storage โดยใช้คีย์กู้คืนที่มีอยู่ซ้ำเมื่อเป็นไปได้
- เริ่มต้น cross-signing และอัปโหลดคีย์สาธารณะที่ขาดหายไป
- ทำเครื่องหมายและ cross-sign อุปกรณ์ปัจจุบัน
- สร้างข้อมูลสำรอง room-key ฝั่งเซิร์ฟเวอร์ หากยังไม่มีอยู่

หาก homeserver ต้องใช้ UIA เพื่ออัปโหลดคีย์ cross-signing OpenClaw จะลองแบบไม่ต้องยืนยันตัวตนก่อน จากนั้น `m.login.dummy` แล้วจึง `m.login.password` (ต้องใช้ `channels.matrix.password`)

แฟล็กที่มีประโยชน์:

- `--recovery-key-stdin` (ใช้คู่กับ `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) หรือ `--recovery-key <key>`
- `--force-reset-cross-signing` เพื่อทิ้งตัวตน cross-signing ปัจจุบัน (เฉพาะเมื่อจงใจเท่านั้น ต้องมีคีย์กู้คืนที่ใช้งานอยู่จัดเก็บไว้หรือระบุด้วย `--recovery-key-stdin`)

### ข้อมูลสำรอง room-key

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` แสดงว่ามีข้อมูลสำรองฝั่งเซิร์ฟเวอร์หรือไม่ และอุปกรณ์นี้ถอดรหัสได้หรือไม่ `backup restore` นำเข้า room keys ที่สำรองไว้เข้าสู่ crypto store ภายในเครื่อง หากคีย์กู้คืนอยู่บนดิสก์แล้ว คุณสามารถละ `--recovery-key-stdin` ได้

หากต้องการแทนที่ข้อมูลสำรองที่เสียด้วย baseline ใหม่ (ยอมรับการสูญเสียประวัติเก่าที่กู้คืนไม่ได้ และยังสามารถสร้าง secret storage ใหม่ได้หากไม่สามารถโหลด secret ของข้อมูลสำรองปัจจุบัน):

```bash
openclaw matrix verify backup reset --yes
```

เพิ่ม `--rotate-recovery-key` เฉพาะเมื่อคุณตั้งใจให้คีย์กู้คืนก่อนหน้าหยุดปลดล็อก baseline ข้อมูลสำรองใหม่

### การแสดงรายการ การร้องขอ และการตอบสนองต่อการยืนยัน

```bash
openclaw matrix verify list
```

แสดงรายการคำขอยืนยันที่รอดำเนินการสำหรับบัญชีที่เลือก

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

ส่งคำขอยืนยันจากบัญชี OpenClaw นี้ `--own-user` ขอ self-verification (คุณยอมรับพรอมป์ในไคลเอนต์ Matrix อื่นของผู้ใช้เดียวกัน); `--user-id`/`--device-id`/`--room-id` ระบุเป้าหมายเป็นคนอื่น `--own-user` ไม่สามารถใช้ร่วมกับแฟล็กระบุเป้าหมายอื่นได้

สำหรับการจัดการวงจรชีวิตระดับต่ำกว่า โดยทั่วไปขณะติดตามคำขอขาเข้าจากไคลเอนต์อื่น คำสั่งเหล่านี้ดำเนินการกับคำขอ `<id>` เฉพาะ (พิมพ์โดย `verify list` และ `verify request`):

| คำสั่ง                                     | วัตถุประสงค์                                                        |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | ยอมรับคำขอขาเข้า                                                    |
| `openclaw matrix verify start <id>`        | เริ่มโฟลว์ SAS                                                       |
| `openclaw matrix verify sas <id>`          | พิมพ์อีโมจิหรือเลขทศนิยมของ SAS                                     |
| `openclaw matrix verify confirm-sas <id>`  | ยืนยันว่า SAS ตรงกับที่ไคลเอนต์อีกฝั่งแสดง                         |
| `openclaw matrix verify mismatch-sas <id>` | ปฏิเสธ SAS เมื่ออีโมจิหรือเลขทศนิยมไม่ตรงกัน                       |
| `openclaw matrix verify cancel <id>`       | ยกเลิก; รับ `--reason <text>` และ `--code <matrix-code>` แบบไม่บังคับ |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` และ `cancel` ทั้งหมดรับ `--user-id` และ `--room-id` เป็นคำใบ้สำหรับการติดตามผลทาง DM เมื่อการยืนยันผูกอยู่กับห้องข้อความตรงเฉพาะ

### หมายเหตุหลายบัญชี

หากไม่มี `--account <id>` คำสั่ง Matrix CLI จะใช้บัญชีเริ่มต้นโดยนัย หากคุณมีบัญชีที่มีชื่อหลายบัญชีและยังไม่ได้ตั้งค่า `channels.matrix.defaultAccount` คำสั่งจะปฏิเสธการเดาและขอให้คุณเลือก เมื่อปิดใช้ E2EE หรือไม่พร้อมใช้งานสำหรับบัญชีที่มีชื่อ ข้อผิดพลาดจะชี้ไปที่คีย์การกำหนดค่าของบัญชีนั้น เช่น `channels.matrix.accounts.assistant.encryption`

<AccordionGroup>
  <Accordion title="พฤติกรรมตอนเริ่มต้น">
    เมื่อใช้ `encryption: true` ค่าเริ่มต้นของ `startupVerification` คือ `"if-unverified"` ตอนเริ่มต้น อุปกรณ์ที่ยังไม่ยืนยันจะขอ self-verification ในไคลเอนต์ Matrix อื่น ข้ามรายการซ้ำ และใช้ cooldown (ค่าเริ่มต้น 24 ชั่วโมง) ปรับด้วย `startupVerificationCooldownHours` หรือปิดใช้ด้วย `startupVerification: "off"`

    ตอนเริ่มต้นยังรันรอบ crypto bootstrap แบบระมัดระวังที่ใช้ secret storage และตัวตน cross-signing ปัจจุบันซ้ำ หากสถานะ bootstrap เสีย OpenClaw จะพยายามซ่อมแซมแบบมีการป้องกันแม้ไม่มี `channels.matrix.password`; หาก homeserver ต้องใช้ UIA แบบรหัสผ่าน ตอนเริ่มต้นจะบันทึกคำเตือนและยังไม่ถือเป็นข้อผิดพลาดร้ายแรง อุปกรณ์ที่ลงนามโดยเจ้าของแล้วจะถูกเก็บไว้

    ดู [การย้าย Matrix](/th/channels/matrix-migration) สำหรับโฟลว์อัปเกรดแบบเต็ม

  </Accordion>

  <Accordion title="ประกาศการยืนยัน">
    Matrix โพสต์ประกาศวงจรชีวิตการยืนยันลงในห้อง DM การยืนยันแบบเข้มงวดเป็นข้อความ `m.notice`: คำขอ, พร้อมแล้ว (พร้อมคำแนะนำ "Verify by emoji"), เริ่ม/เสร็จสิ้น และรายละเอียด SAS (อีโมจิ/ทศนิยม) เมื่อมี

    คำขอขาเข้าจากไคลเอนต์ Matrix อื่นจะถูกติดตามและยอมรับโดยอัตโนมัติ สำหรับ self-verification OpenClaw จะเริ่มโฟลว์ SAS โดยอัตโนมัติและยืนยันฝั่งของตัวเองเมื่อการยืนยันด้วยอีโมจิพร้อมใช้งาน คุณยังต้องเปรียบเทียบและยืนยัน "They match" ในไคลเอนต์ Matrix ของคุณ

    ประกาศระบบการยืนยันจะไม่ถูกส่งต่อไปยังไปป์ไลน์แชตของเอเจนต์

  </Accordion>

  <Accordion title="อุปกรณ์ Matrix ที่ถูกลบหรือไม่ถูกต้อง">
    หาก `verify status` บอกว่าอุปกรณ์ปัจจุบันไม่อยู่ในรายการบน homeserver อีกต่อไป ให้สร้างอุปกรณ์ Matrix ของ OpenClaw ใหม่ สำหรับการเข้าสู่ระบบด้วยรหัสผ่าน:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    สำหรับการยืนยันตัวตนด้วยโทเค็น ให้สร้าง access token ใหม่ในไคลเอนต์ Matrix หรือ UI ผู้ดูแลระบบของคุณ แล้วอัปเดต OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    แทนที่ `assistant` ด้วย ID บัญชีจากคำสั่งที่ล้มเหลว หรือละ `--account` สำหรับบัญชีเริ่มต้น

  </Accordion>

  <Accordion title="สุขอนามัยของอุปกรณ์">
    อุปกรณ์เก่าที่ OpenClaw จัดการอาจสะสมได้ แสดงรายการและตัดออก:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE ใช้เส้นทาง crypto ของ Rust อย่างเป็นทางการจาก `matrix-js-sdk` พร้อม `fake-indexeddb` เป็นชิม IndexedDB สถานะ crypto คงอยู่ใน `crypto-idb-snapshot.json` (สิทธิ์ไฟล์แบบเข้มงวด)

    สถานะรันไทม์ที่เข้ารหัสอยู่ใต้ `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` และรวมถึง sync store, crypto store, คีย์กู้คืน, สแนปช็อต IDB, การผูก thread และสถานะการยืนยันตอนเริ่มต้น เมื่อโทเค็นเปลี่ยนแต่ตัวตนบัญชียังคงเดิม OpenClaw จะใช้ root ที่มีอยู่ที่ดีที่สุดซ้ำ เพื่อให้สถานะก่อนหน้ายังคงมองเห็นได้

  </Accordion>
</AccordionGroup>

## การจัดการโปรไฟล์

อัปเดตโปรไฟล์ตนเองของ Matrix สำหรับบัญชีที่เลือก:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

คุณสามารถส่งทั้งสองตัวเลือกในการเรียกครั้งเดียวได้ Matrix รับ URL รูปโปรไฟล์แบบ `mxc://` ได้โดยตรง เมื่อคุณส่ง `http://` หรือ `https://` OpenClaw จะอัปโหลดไฟล์ก่อน แล้วจัดเก็บ URL `mxc://` ที่ resolve แล้วไว้ใน `channels.matrix.avatarUrl` (หรือค่า override รายบัญชี)

## เธรด

Matrix รองรับเธรด Matrix แบบเนทีฟสำหรับทั้งการตอบกลับอัตโนมัติและการส่งผ่านเครื่องมือข้อความ มีปุ่มควบคุมอิสระสองตัวที่กำหนดพฤติกรรม:

### การกำหนดเส้นทางเซสชัน (`sessionScope`)

`dm.sessionScope` กำหนดว่าห้อง DM ของ Matrix จะแมปกับเซสชัน OpenClaw อย่างไร:

- `"per-user"` (ค่าเริ่มต้น): ห้อง DM ทั้งหมดที่มี peer ที่กำหนดเส้นทางเดียวกันใช้เซสชันร่วมกัน
- `"per-room"`: ห้อง DM ของ Matrix แต่ละห้องมีคีย์เซสชันของตัวเอง แม้ว่า peer จะเป็นรายเดียวกัน

การผูกบทสนทนาแบบชัดเจนมีสิทธิเหนือ `sessionScope` เสมอ ดังนั้นห้องและเธรดที่ถูกผูกไว้จะคงเซสชันเป้าหมายที่เลือกไว้

### การตอบกลับในเธรด (`threadReplies`)

`threadReplies` กำหนดว่าบอตจะโพสต์คำตอบไว้ที่ใด:

- `"off"`: คำตอบอยู่ระดับบนสุด ข้อความขาเข้าที่อยู่ในเธรดจะยังอยู่ในเซสชันหลัก
- `"inbound"`: ตอบภายในเธรดเฉพาะเมื่อข้อความขาเข้าอยู่ในเธรดนั้นอยู่แล้ว
- `"always"`: ตอบภายในเธรดที่มีรากจากข้อความที่ทริกเกอร์ บทสนทนานั้นจะถูกกำหนดเส้นทางผ่านเซสชันแบบจำกัดขอบเขตตามเธรดที่ตรงกันตั้งแต่ทริกเกอร์แรกเป็นต้นไป

`dm.threadReplies` override ค่านี้สำหรับ DM เท่านั้น - ตัวอย่างเช่น แยกเธรดในห้องออกจากกัน แต่ให้ DM ยังคงเป็นแบบแบน

### การสืบทอดเธรดและคำสั่ง slash

- ข้อความขาเข้าที่อยู่ในเธรดจะรวมข้อความรากของเธรดเป็นบริบทเพิ่มเติมสำหรับเอเจนต์
- การส่งผ่านเครื่องมือข้อความจะสืบทอดเธรด Matrix ปัจจุบันโดยอัตโนมัติเมื่อกำหนดเป้าหมายไปยังห้องเดียวกัน (หรือเป้าหมายผู้ใช้ DM เดียวกัน) เว้นแต่จะระบุ `threadId` อย่างชัดเจน
- การนำเป้าหมายผู้ใช้ DM กลับมาใช้ซ้ำจะเริ่มทำงานเฉพาะเมื่อ metadata ของเซสชันปัจจุบันพิสูจน์ได้ว่าเป็น peer DM เดียวกันบนบัญชี Matrix เดียวกัน มิฉะนั้น OpenClaw จะ fallback กลับไปใช้การกำหนดเส้นทางแบบจำกัดขอบเขตตามผู้ใช้ตามปกติ
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และ `/acp spawn` ที่ผูกกับเธรด ใช้งานได้ทั้งหมดในห้อง Matrix และ DM
- `/focus` ระดับบนสุดจะสร้างเธรด Matrix ใหม่และผูกกับเซสชันเป้าหมายเมื่อเปิดใช้ `threadBindings.spawnSessions`
- การเรียก `/focus` หรือ `/acp spawn --thread here` ภายในเธรด Matrix ที่มีอยู่จะผูกเธรดนั้น ณ ตำแหน่งเดิม

เมื่อ OpenClaw ตรวจพบว่าห้อง DM ของ Matrix ชนกับห้อง DM อีกห้องบนเซสชันที่ใช้ร่วมกันเดียวกัน ระบบจะโพสต์ `m.notice` แบบครั้งเดียวในห้องนั้นเพื่อชี้ไปยังทางออก `/focus` และแนะนำให้เปลี่ยน `dm.sessionScope` การแจ้งเตือนจะแสดงเฉพาะเมื่อเปิดใช้การผูกเธรด

## การผูกบทสนทนา ACP

ห้อง Matrix, DM และเธรด Matrix ที่มีอยู่สามารถเปลี่ยนเป็น workspace ACP แบบคงทนได้โดยไม่ต้องเปลี่ยนพื้นผิวแชต

ขั้นตอนด่วนสำหรับผู้ปฏิบัติงาน:

- เรียก `/acp spawn codex --bind here` ภายใน DM, ห้อง หรือเธรดที่มีอยู่ของ Matrix ที่คุณต้องการใช้งานต่อ
- ใน DM หรือห้อง Matrix ระดับบนสุด DM/ห้องปัจจุบันจะยังเป็นพื้นผิวแชต และข้อความในอนาคตจะกำหนดเส้นทางไปยังเซสชัน ACP ที่ spawn แล้ว
- ภายในเธรด Matrix ที่มีอยู่ `--bind here` จะผูกเธรดปัจจุบันนั้น ณ ตำแหน่งเดิม
- `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP ที่ผูกไว้เดิม ณ ตำแหน่งเดิม
- `/acp close` จะปิดเซสชัน ACP และลบการผูก

หมายเหตุ:

- `--bind here` ไม่สร้างเธรดลูกของ Matrix
- `threadBindings.spawnSessions` ควบคุม `/acp spawn --thread auto|here` ซึ่งเป็นกรณีที่ OpenClaw ต้องสร้างหรือผูกเธรดลูกของ Matrix

### การกำหนดค่าการผูกเธรด

Matrix สืบทอดค่าเริ่มต้นส่วนกลางจาก `session.threadBindings` และยังรองรับ override รายช่องทางด้วย:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

การ spawn เซสชันที่ผูกกับเธรดของ Matrix เปิดเป็นค่าเริ่มต้น:

- ตั้งค่า `threadBindings.spawnSessions: false` เพื่อบล็อก `/focus` ระดับบนสุดและ `/acp spawn --thread auto|here` ไม่ให้สร้าง/ผูกเธรด Matrix
- ตั้งค่า `threadBindings.defaultSpawnContext: "isolated"` เมื่อการ spawn เธรด subagent แบบเนทีฟไม่ควร fork transcript หลัก

## รีแอ็กชัน

Matrix รองรับรีแอ็กชันขาออก การแจ้งเตือนรีแอ็กชันขาเข้า และรีแอ็กชัน ack

เครื่องมือรีแอ็กชันขาออกถูกควบคุมโดย `channels.matrix.actions.reactions`:

- `react` เพิ่มรีแอ็กชันให้กับ event ของ Matrix
- `reactions` แสดงสรุปรีแอ็กชันปัจจุบันสำหรับ event ของ Matrix
- `emoji=""` ลบรีแอ็กชันของบอตเองบน event นั้น
- `remove: true` ลบเฉพาะรีแอ็กชัน emoji ที่ระบุจากบอต

**ลำดับการ resolve** (ค่าที่กำหนดไว้ค่าแรกมีผล):

| การตั้งค่า               | ลำดับ                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | รายบัญชี → ช่องทาง → `messages.ackReaction` → fallback emoji ของตัวตนเอเจนต์   |
| `ackReactionScope`      | รายบัญชี → ช่องทาง → `messages.ackReactionScope` → ค่าเริ่มต้น `"group-mentions"` |
| `reactionNotifications` | รายบัญชี → ช่องทาง → ค่าเริ่มต้น `"own"`                                          |

`reactionNotifications: "own"` ส่งต่อ event `m.reaction` ที่เพิ่มเข้ามาเมื่อ event เหล่านั้นมีเป้าหมายเป็นข้อความ Matrix ที่บอตเขียนเอง `"off"` ปิดใช้งาน event ระบบของรีแอ็กชัน การลบรีแอ็กชันจะไม่ถูกสังเคราะห์เป็น event ระบบ เพราะ Matrix แสดงสิ่งเหล่านั้นเป็น redaction ไม่ใช่การลบ `m.reaction` แบบ standalone

## บริบทประวัติ

- `channels.matrix.historyLimit` ควบคุมจำนวนข้อความล่าสุดในห้องที่จะรวมเป็น `InboundHistory` เมื่อข้อความในห้อง Matrix ทริกเกอร์เอเจนต์ โดย fallback ไปที่ `messages.groupChat.historyLimit` หากไม่ได้ตั้งค่าทั้งสอง ค่าเริ่มต้นที่มีผลคือ `0` ตั้งค่า `0` เพื่อปิดใช้งาน
- ประวัติห้อง Matrix จำกัดเฉพาะห้อง DM ยังคงใช้ประวัติเซสชันตามปกติ
- ประวัติห้อง Matrix เป็นแบบรอดำเนินการเท่านั้น: OpenClaw buffer ข้อความในห้องที่ยังไม่ได้ทริกเกอร์คำตอบ แล้ว snapshot หน้าต่างนั้นเมื่อมี mention หรือทริกเกอร์อื่นมาถึง
- ข้อความทริกเกอร์ปัจจุบันไม่ถูกรวมไว้ใน `InboundHistory` แต่ยังอยู่ในเนื้อหาขาเข้าหลักสำหรับ turn นั้น
- การ retry event Matrix เดียวกันจะนำ snapshot ประวัติเดิมกลับมาใช้ แทนที่จะเลื่อนไปยังข้อความห้องที่ใหม่กว่า

## การมองเห็นบริบท

Matrix รองรับการควบคุม `contextVisibility` ร่วมสำหรับบริบทห้องเสริม เช่น ข้อความตอบกลับที่ดึงมา รากเธรด และประวัติที่รอดำเนินการ

- `contextVisibility: "all"` เป็นค่าเริ่มต้น บริบทเสริมจะถูกเก็บไว้ตามที่ได้รับ
- `contextVisibility: "allowlist"` กรองบริบทเสริมให้เหลือผู้ส่งที่อนุญาตโดยการตรวจสอบ allowlist ของห้อง/ผู้ใช้ที่ใช้งานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บคำตอบที่ quote อย่างชัดเจนไว้หนึ่งรายการ

การตั้งค่านี้มีผลต่อการมองเห็นบริบทเสริม ไม่ใช่ว่าข้อความขาเข้าเองจะทริกเกอร์คำตอบได้หรือไม่
การอนุญาตทริกเกอร์ยังมาจาก `groupPolicy`, `groups`, `groupAllowFrom` และการตั้งค่านโยบาย DM

## นโยบาย DM และห้อง

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

หากต้องการปิดเสียง DM ทั้งหมดแต่ยังให้ห้องทำงานต่อ ให้ตั้งค่า `dm.enabled: false`:

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

ดู [กลุ่ม](/th/channels/groups) สำหรับพฤติกรรม mention-gating และ allowlist

ตัวอย่างการ pairing สำหรับ DM ของ Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

หากผู้ใช้ Matrix ที่ยังไม่ได้รับอนุมัติยังคงส่งข้อความถึงคุณก่อนการอนุมัติ OpenClaw จะนำรหัส pairing ที่รอดำเนินการเดิมกลับมาใช้ และอาจส่งคำตอบเตือนหลังจาก cooldown สั้น ๆ แทนที่จะ mint รหัสใหม่

ดู [Pairing](/th/channels/pairing) สำหรับ flow การ pairing DM ร่วมและรูปแบบการจัดเก็บ

## การซ่อมแซมห้องตรง

หากสถานะ direct-message หลุด sync OpenClaw อาจมี mapping `m.direct` ที่ค้างอยู่ซึ่งชี้ไปยังห้องเดี่ยวเก่าแทน DM ที่ใช้งานอยู่ ตรวจสอบ mapping ปัจจุบันสำหรับ peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

ซ่อมแซม:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

ทั้งสองคำสั่งรับ `--account <id>` สำหรับการตั้งค่าหลายบัญชี flow การซ่อมแซม:

- เลือกใช้ DM แบบ 1:1 ที่เข้มงวดซึ่งถูกแมปไว้ใน `m.direct` อยู่แล้วก่อน
- fallback ไปยัง DM แบบ 1:1 ที่เข้มงวดและ joined อยู่ในปัจจุบันกับผู้ใช้นั้น
- สร้างห้อง direct ใหม่และเขียน `m.direct` ใหม่หากไม่มี DM ที่ healthy

ระบบจะไม่ลบห้องเก่าโดยอัตโนมัติ แต่จะเลือก DM ที่ healthy และอัปเดต mapping เพื่อให้การส่ง Matrix ในอนาคต การแจ้งเตือนการยืนยัน และ flow direct-message อื่น ๆ กำหนดเป้าหมายไปยังห้องที่ถูกต้อง

## การอนุมัติ exec

Matrix สามารถทำหน้าที่เป็นไคลเอนต์อนุมัติแบบเนทีฟได้ กำหนดค่าภายใต้ `channels.matrix.execApprovals` (หรือ `channels.matrix.accounts.<account>.execApprovals` สำหรับ override รายบัญชี):

- `enabled`: ส่งการอนุมัติผ่าน prompt แบบเนทีฟของ Matrix เมื่อไม่ได้ตั้งค่าหรือเป็น `"auto"` Matrix จะเปิดใช้อัตโนมัติเมื่อสามารถ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งราย ตั้งค่า `false` เพื่อปิดใช้อย่างชัดเจน
- `approvers`: ID ผู้ใช้ Matrix (`@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอ exec ไม่บังคับ - fallback ไปที่ `channels.matrix.dm.allowFrom`
- `target`: ตำแหน่งที่ส่ง prompt `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ `"channel"` ส่งไปยังห้อง Matrix หรือ DM ต้นทาง `"both"` ส่งไปยังทั้งสองที่
- `agentFilter` / `sessionFilter`: allowlist เสริมสำหรับกำหนดว่าเอเจนต์/เซสชันใดจะทริกเกอร์การส่งผ่าน Matrix

การอนุญาตแตกต่างกันเล็กน้อยตามชนิดการอนุมัติ:

- **การอนุมัติ exec** ใช้ `execApprovals.approvers` และ fallback ไปที่ `dm.allowFrom`
- **การอนุมัติ Plugin** อนุญาตผ่าน `dm.allowFrom` เท่านั้น

ทั้งสองชนิดใช้ทางลัดรีแอ็กชันของ Matrix และการอัปเดตข้อความร่วมกัน ผู้อนุมัติจะเห็นทางลัดรีแอ็กชันบนข้อความอนุมัติหลัก:

- `✅` อนุญาตครั้งเดียว
- `❌` ปฏิเสธ
- `♾️` อนุญาตเสมอ (เมื่อ policy exec ที่มีผลอนุญาต)

คำสั่ง slash สำรอง: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`

เฉพาะผู้อนุมัติที่ resolve แล้วเท่านั้นที่อนุมัติหรือปฏิเสธได้ การส่งไปยังช่องทางสำหรับการอนุมัติ exec จะรวมข้อความคำสั่งไว้ด้วย - เปิดใช้ `channel` หรือ `both` เฉพาะในห้องที่เชื่อถือได้

ที่เกี่ยวข้อง: [การอนุมัติ exec](/th/tools/exec-approvals)

## คำสั่ง slash

คำสั่ง slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` ฯลฯ) ทำงานได้โดยตรงใน DM ในห้อง OpenClaw ยังรู้จักคำสั่งที่นำหน้าด้วย mention ของ Matrix ของบอตเองด้วย ดังนั้น `@bot:server /new` จะทริกเกอร์ path คำสั่งโดยไม่ต้องใช้ regex mention แบบกำหนดเอง วิธีนี้ช่วยให้บอตตอบสนองต่อโพสต์แบบห้อง `@mention /command` ที่ Element และไคลเอนต์คล้ายกันส่งออกมาเมื่อผู้ใช้ tab-complete บอตก่อนพิมพ์คำสั่ง

กฎการอนุญาตยังคงมีผล: ผู้ส่งคำสั่งต้องผ่านนโยบาย allowlist/owner ของ DM หรือห้องเดียวกับข้อความปกติ

## หลายบัญชี

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

**การสืบทอด:**

- ค่า `channels.matrix` ระดับบนสุดทำหน้าที่เป็นค่าเริ่มต้นสำหรับบัญชีที่มีชื่อ เว้นแต่บัญชีนั้นจะ override
- จำกัดขอบเขต entry ห้องที่สืบทอดมาไปยังบัญชีเฉพาะด้วย `groups.<room>.account` entry ที่ไม่มี `account` จะถูกใช้ร่วมกันข้ามบัญชี `account: "default"` ยังคงทำงานเมื่อกำหนดค่าบัญชีเริ่มต้นไว้ที่ระดับบนสุด

**การเลือกบัญชีเริ่มต้น:**

- ตั้งค่า `defaultAccount` เพื่อเลือกบัญชีที่ระบุชื่อ ซึ่งการกำหนดเส้นทางโดยนัย การตรวจสอบ และคำสั่ง CLI จะเลือกใช้ก่อน
- หากคุณมีหลายบัญชีและมีบัญชีหนึ่งชื่อ `default` แบบตรงตัว OpenClaw จะใช้บัญชีนั้นโดยนัยแม้ไม่ได้ตั้งค่า `defaultAccount`
- หากคุณมีบัญชีที่ระบุชื่อหลายบัญชีและไม่ได้เลือกค่าเริ่มต้น คำสั่ง CLI จะไม่เดาให้ ให้ตั้งค่า `defaultAccount` หรือส่ง `--account <id>`
- บล็อกระดับบนสุด `channels.matrix.*` จะถูกถือเป็นบัญชี `default` โดยนัยเฉพาะเมื่อการยืนยันตัวตนครบถ้วน (`homeserver` + `accessToken` หรือ `homeserver` + `userId` + `password`) บัญชีที่ระบุชื่อยังคงค้นพบได้จาก `homeserver` + `userId` เมื่อข้อมูลประจำตัวที่แคชไว้ครอบคลุมการยืนยันตัวตนแล้ว

**การเลื่อนระดับ:**

- เมื่อ OpenClaw เลื่อนระดับการกำหนดค่าบัญชีเดียวเป็นหลายบัญชีระหว่างการซ่อมแซมหรือตั้งค่า ระบบจะคงบัญชีที่ระบุชื่อที่มีอยู่ไว้หากมีอยู่แล้ว หรือ `defaultAccount` ชี้ไปที่บัญชีหนึ่งอยู่แล้ว เฉพาะคีย์การยืนยันตัวตน/บูตสแตรปของ Matrix เท่านั้นที่จะย้ายเข้าไปในบัญชีที่เลื่อนระดับแล้ว ส่วนคีย์นโยบายการส่งมอบที่ใช้ร่วมกันจะอยู่ที่ระดับบนสุดต่อไป

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบหลายบัญชีที่ใช้ร่วมกัน

## โฮมเซิร์ฟเวอร์ส่วนตัว/LAN

โดยค่าเริ่มต้น OpenClaw จะบล็อกโฮมเซิร์ฟเวอร์ Matrix แบบส่วนตัว/ภายในเพื่อป้องกัน SSRF เว้นแต่คุณจะ
เลือกเปิดใช้ต่อบัญชีอย่างชัดเจน

หากโฮมเซิร์ฟเวอร์ของคุณทำงานบน localhost, IP ของ LAN/Tailscale หรือชื่อโฮสต์ภายใน ให้เปิดใช้
`network.dangerouslyAllowPrivateNetwork` สำหรับบัญชี Matrix นั้น:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

ตัวอย่างการตั้งค่าด้วย CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

การเลือกเปิดใช้นี้อนุญาตเฉพาะเป้าหมายส่วนตัว/ภายในที่เชื่อถือได้เท่านั้น โฮมเซิร์ฟเวอร์สาธารณะแบบข้อความล้วน เช่น
`http://matrix.example.org:8008` ยังคงถูกบล็อก ควรใช้ `https://` เมื่อเป็นไปได้

## การพร็อกซีทราฟฟิก Matrix

หากการติดตั้ง Matrix ของคุณต้องใช้พร็อกซี HTTP(S) ขาออกอย่างชัดเจน ให้ตั้งค่า `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

บัญชีที่ระบุชื่อสามารถแทนที่ค่าเริ่มต้นระดับบนสุดด้วย `channels.matrix.accounts.<id>.proxy`
OpenClaw ใช้การตั้งค่าพร็อกซีเดียวกันสำหรับทราฟฟิก Matrix ขณะรันไทม์และการตรวจสอบสถานะบัญชี

## การระบุเป้าหมาย

Matrix ยอมรับรูปแบบเป้าหมายเหล่านี้ในทุกที่ที่ OpenClaw ขอเป้าหมายห้องหรือผู้ใช้จากคุณ:

- ผู้ใช้: `@user:server`, `user:@user:server` หรือ `matrix:user:@user:server`
- ห้อง: `!room:server`, `room:!room:server` หรือ `matrix:room:!room:server`
- นามแฝง: `#alias:server`, `channel:#alias:server` หรือ `matrix:channel:#alias:server`

ID ห้องของ Matrix แยกตัวพิมพ์เล็กและใหญ่ ใช้ตัวพิมพ์ของ ID ห้องให้ตรงกับ Matrix
เมื่อกำหนดค่าเป้าหมายการส่งมอบแบบชัดเจน งาน cron การผูก หรือ allowlist
OpenClaw เก็บคีย์เซสชันภายในให้เป็นรูปแบบมาตรฐานสำหรับการจัดเก็บ ดังนั้นคีย์ตัวพิมพ์เล็กเหล่านั้น
จึงไม่ใช่แหล่งที่เชื่อถือได้สำหรับ ID การส่งมอบของ Matrix

การค้นหาไดเรกทอรีแบบสดใช้บัญชี Matrix ที่เข้าสู่ระบบอยู่:

- การค้นหาผู้ใช้จะสอบถามไดเรกทอรีผู้ใช้ Matrix บนโฮมเซิร์ฟเวอร์นั้น
- การค้นหาห้องยอมรับ ID ห้องและนามแฝงแบบชัดเจนโดยตรง การค้นหาชื่อห้องที่เข้าร่วมแล้วเป็นแบบพยายามให้ดีที่สุด และใช้กับ allowlist ห้องขณะรันไทม์เฉพาะเมื่อตั้งค่า `dangerouslyAllowNameMatching: true`
- หากไม่สามารถแปลงชื่อห้องเป็น ID หรือนามแฝงได้ ชื่อนั้นจะถูกละเว้นในการระบุ allowlist ขณะรันไทม์

## ข้อมูลอ้างอิงการกำหนดค่า

ฟิลด์ผู้ใช้แบบ allowlist (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) ยอมรับ ID ผู้ใช้ Matrix แบบเต็ม (ปลอดภัยที่สุด) รายการผู้ใช้ที่ไม่ใช่ ID จะถูกละเว้นโดยค่าเริ่มต้น หากคุณตั้งค่า `dangerouslyAllowNameMatching: true` ชื่อที่แสดงในไดเรกทอรี Matrix ที่ตรงกันทุกประการจะถูกแปลงเมื่อเริ่มต้นระบบและเมื่อใดก็ตามที่ allowlist เปลี่ยนขณะที่มอนิเตอร์กำลังทำงาน รายการที่แปลงไม่ได้จะถูกละเว้นขณะรันไทม์

คีย์ allowlist ของห้อง (`groups`, `rooms` เดิม) ควรเป็น ID ห้องหรือนามแฝง คีย์ชื่อห้องแบบธรรมดาจะถูกละเว้นโดยค่าเริ่มต้น; `dangerouslyAllowNameMatching: true` จะกู้คืนการค้นหาแบบพยายามให้ดีที่สุดกับชื่อห้องที่เข้าร่วมแล้ว

### บัญชีและการเชื่อมต่อ

- `enabled`: เปิดหรือปิดใช้งานช่องทาง
- `name`: ป้ายกำกับการแสดงผลที่ไม่บังคับสำหรับบัญชี
- `defaultAccount`: ID บัญชีที่ต้องการเมื่อกำหนดค่าบัญชี Matrix ไว้หลายบัญชี
- `accounts`: การแทนที่ต่อบัญชีที่ระบุชื่อ ค่า `channels.matrix` ระดับบนสุดจะสืบทอดเป็นค่าเริ่มต้น
- `homeserver`: URL โฮมเซิร์ฟเวอร์ เช่น `https://matrix.example.org`
- `network.dangerouslyAllowPrivateNetwork`: อนุญาตให้บัญชีนี้เชื่อมต่อกับ `localhost`, IP ของ LAN/Tailscale หรือชื่อโฮสต์ภายใน
- `proxy`: URL พร็อกซี HTTP(S) ที่ไม่บังคับสำหรับทราฟฟิก Matrix รองรับการแทนที่ต่อบัญชี
- `userId`: ID ผู้ใช้ Matrix แบบเต็ม (`@bot:example.org`)
- `accessToken`: โทเค็นการเข้าถึงสำหรับการยืนยันตัวตนแบบใช้โทเค็น รองรับค่าข้อความล้วนและ SecretRef ผ่านผู้ให้บริการ env/file/exec ([การจัดการความลับ](/th/gateway/secrets))
- `password`: รหัสผ่านสำหรับการเข้าสู่ระบบแบบใช้รหัสผ่าน รองรับค่าข้อความล้วนและ SecretRef
- `deviceId`: ID อุปกรณ์ Matrix แบบชัดเจน
- `deviceName`: ชื่อแสดงผลของอุปกรณ์ที่ใช้ขณะเข้าสู่ระบบด้วยรหัสผ่าน
- `avatarUrl`: URL รูปแทนตัวของตนเองที่จัดเก็บไว้สำหรับการซิงค์โปรไฟล์และการอัปเดต `profile set`
- `initialSyncLimit`: จำนวนเหตุการณ์สูงสุดที่ดึงระหว่างการซิงค์ตอนเริ่มต้น

### การเข้ารหัส

- `encryption`: เปิดใช้ E2EE ค่าเริ่มต้น: `false`
- `startupVerification`: `"if-unverified"` (ค่าเริ่มต้นเมื่อเปิด E2EE) หรือ `"off"` ร้องขอการยืนยันตนเองโดยอัตโนมัติเมื่อเริ่มต้นระบบ หากอุปกรณ์นี้ยังไม่ได้รับการยืนยัน
- `startupVerificationCooldownHours`: ช่วงพักก่อนคำขอเริ่มต้นอัตโนมัติครั้งถัดไป ค่าเริ่มต้น: `24`

### การเข้าถึงและนโยบาย

- `groupPolicy`: `"open"`, `"allowlist"` หรือ `"disabled"` ค่าเริ่มต้น: `"allowlist"`
- `groupAllowFrom`: allowlist ของ ID ผู้ใช้สำหรับทราฟฟิกห้อง
- `dm.enabled`: เมื่อเป็น `false` ให้ละเว้น DM ทั้งหมด ค่าเริ่มต้น: `true`
- `dm.policy`: `"pairing"` (ค่าเริ่มต้น), `"allowlist"`, `"open"` หรือ `"disabled"` มีผลหลังจากบอทเข้าร่วมและจัดประเภทห้องเป็น DM แล้ว; ไม่กระทบการจัดการคำเชิญ
- `dm.allowFrom`: allowlist ของ ID ผู้ใช้สำหรับทราฟฟิก DM
- `dm.sessionScope`: `"per-user"` (ค่าเริ่มต้น) หรือ `"per-room"`
- `dm.threadReplies`: การแทนที่เฉพาะ DM สำหรับเธรดการตอบกลับ (`"off"`, `"inbound"`, `"always"`)
- `allowBots`: ยอมรับข้อความจากบัญชีบอท Matrix อื่นที่กำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `allowlistOnly`: เมื่อเป็น `true` จะบังคับนโยบาย DM ที่ใช้งานอยู่ทั้งหมด (ยกเว้น `"disabled"`) และนโยบายกลุ่ม `"open"` ให้เป็น `"allowlist"` ไม่เปลี่ยนนโยบาย `"disabled"`
- `dangerouslyAllowNameMatching`: เมื่อเป็น `true` จะอนุญาตการค้นหาไดเรกทอรีชื่อที่แสดงของ Matrix สำหรับรายการ allowlist ผู้ใช้ และการค้นหาชื่อห้องที่เข้าร่วมแล้วสำหรับคีย์ allowlist ห้อง ควรใช้ ID `@user:server` แบบเต็ม และ ID ห้องหรือนามแฝง
- `autoJoin`: `"always"`, `"allowlist"` หรือ `"off"` ค่าเริ่มต้น: `"off"` ใช้กับคำเชิญ Matrix ทุกประเภท รวมถึงคำเชิญแบบ DM
- `autoJoinAllowlist`: ห้อง/นามแฝงที่อนุญาตเมื่อ `autoJoin` เป็น `"allowlist"` รายการนามแฝงจะถูกแปลงเทียบกับโฮมเซิร์ฟเวอร์ ไม่ใช่เทียบกับสถานะที่ห้องที่เชิญอ้างไว้
- `contextVisibility`: การมองเห็นบริบทเพิ่มเติม (ค่าเริ่มต้น `"all"`, `"allowlist"`, `"allowlist_quote"`)

### พฤติกรรมการตอบกลับ

- `replyToMode`: `"off"`, `"first"`, `"all"` หรือ `"batched"`
- `threadReplies`: `"off"`, `"inbound"` หรือ `"always"`
- `threadBindings`: การแทนที่ต่อช่องทางสำหรับการกำหนดเส้นทางเซสชันที่ผูกกับเธรดและวงจรชีวิต
- `streaming`: `"off"` (ค่าเริ่มต้น), `"partial"`, `"quiet"` หรือรูปแบบอ็อบเจกต์ `{ mode, preview: { toolProgress } }` `true` ↔ `"partial"`, `false` ↔ `"off"`
- `blockStreaming`: เมื่อเป็น `true` บล็อกผู้ช่วยที่เสร็จสมบูรณ์จะถูกเก็บไว้เป็นข้อความความคืบหน้าแยกต่างหาก
- `markdown`: การกำหนดค่าการเรนเดอร์ Markdown ที่ไม่บังคับสำหรับข้อความขาออก
- `responsePrefix`: สตริงที่ไม่บังคับซึ่งเติมหน้าการตอบกลับขาออก
- `textChunkLimit`: ขนาดชังก์ขาออกเป็นจำนวนอักขระเมื่อ `chunkMode: "length"` ค่าเริ่มต้น: `4000`
- `chunkMode`: `"length"` (ค่าเริ่มต้น แบ่งตามจำนวนอักขระ) หรือ `"newline"` (แบ่งตามขอบเขตบรรทัด)
- `historyLimit`: จำนวนข้อความห้องล่าสุดที่รวมเป็น `InboundHistory` เมื่อข้อความห้องเรียกใช้เอเจนต์ ถอยกลับไปใช้ `messages.groupChat.historyLimit`; ค่าเริ่มต้นที่มีผลคือ `0` (ปิดใช้งาน)
- `mediaMaxMb`: เพดานขนาดสื่อเป็น MB สำหรับการส่งขาออกและการประมวลผลขาเข้า

### การตั้งค่ารีแอ็กชัน

- `ackReaction`: การแทนที่รีแอ็กชันรับทราบสำหรับช่องทาง/บัญชีนี้
- `ackReactionScope`: การแทนที่ขอบเขต (`"group-mentions"` ค่าเริ่มต้น, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`)
- `reactionNotifications`: โหมดการแจ้งเตือนรีแอ็กชันขาเข้า (`"own"` ค่าเริ่มต้น, `"off"`)

### เครื่องมือและการแทนที่ต่อห้อง

- `actions`: การควบคุมสิทธิ์เครื่องมือต่อแอ็กชัน (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`)
- `groups`: แผนผังนโยบายต่อห้อง อัตลักษณ์เซสชันใช้ ID ห้องที่เสถียรหลังการแปลง (`rooms` เป็นนามแฝงเดิม)
  - `groups.<room>.account`: จำกัดรายการห้องที่สืบทอดมาหนึ่งรายการให้ใช้บัญชีที่ระบุ
  - `groups.<room>.allowBots`: การแทนที่ต่อห้องสำหรับการตั้งค่าระดับช่องทาง (`true` หรือ `"mentions"`)
  - `groups.<room>.users`: allowlist ผู้ส่งต่อห้อง
  - `groups.<room>.tools`: การแทนที่อนุญาต/ปฏิเสธเครื่องมือต่อห้อง
  - `groups.<room>.autoReply`: การแทนที่การควบคุมด้วยการเมนชันต่อห้อง `true` ปิดข้อกำหนดการเมนชันสำหรับห้องนั้น; `false` บังคับให้เปิดกลับมา
  - `groups.<room>.skills`: ตัวกรอง Skills ต่อห้อง
  - `groups.<room>.systemPrompt`: ส่วนย่อยพรอมป์ระบบต่อห้อง

### การตั้งค่าการอนุมัติ exec

- `execApprovals.enabled`: ส่งการอนุมัติ exec ผ่านพรอมป์แบบเนทีฟของ Matrix
- `execApprovals.approvers`: ID ผู้ใช้ Matrix ที่อนุญาตให้อนุมัติ ถอยกลับไปใช้ `dm.allowFrom`
- `execApprovals.target`: `"dm"` (ค่าเริ่มต้น), `"channel"` หรือ `"both"`
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: allowlist เอเจนต์/เซสชันที่ไม่บังคับสำหรับการส่งมอบ

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) - ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชตกลุ่มและการควบคุมด้วยการเมนชัน
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
