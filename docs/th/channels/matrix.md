---
read_when:
    - การตั้งค่า Matrix ใน OpenClaw
    - การกำหนดค่า Matrix E2EE และการยืนยัน
summary: สถานะการรองรับ Matrix, ตัวอย่างการตั้งค่า และการกำหนดค่า
title: เมทริกซ์
x-i18n:
    generated_at: "2026-06-28T20:40:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1291273746e364fb0ca7eafbde3d717ee555c3edfa576eab4fdd3d0048ceedd
    source_path: channels/matrix.md
    workflow: 16
---

Matrix เป็น Plugin ช่องทางที่ดาวน์โหลดได้สำหรับ OpenClaw
ใช้ `matrix-js-sdk` อย่างเป็นทางการ และรองรับ DM, ห้อง, เธรด, สื่อ, ปฏิกิริยา, โพล, ตำแหน่งที่ตั้ง และ E2EE

## ติดตั้ง

ติดตั้ง Matrix จาก ClawHub ก่อนกำหนดค่าช่องทาง:

```bash
openclaw plugins install @openclaw/matrix
```

สเปก Plugin แบบย่อจะลอง ClawHub ก่อน แล้วจึง fallback ไปที่ npm หากต้องการบังคับแหล่งที่มาของ registry ให้ใช้ `openclaw plugins install clawhub:@openclaw/matrix` หรือ `openclaw plugins install npm:@openclaw/matrix`

จาก checkout ในเครื่อง:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` จะลงทะเบียนและเปิดใช้ Plugin ดังนั้นจึงไม่ต้องมีขั้นตอน `openclaw plugins enable matrix` แยกต่างหาก แต่ Plugin จะยังไม่ทำงานจนกว่าคุณจะกำหนดค่าช่องทางด้านล่าง ดู [Plugins](/th/tools/plugin) สำหรับพฤติกรรม Plugin ทั่วไปและกฎการติดตั้ง

## ตั้งค่า

1. สร้างบัญชี Matrix บน homeserver ของคุณ
2. กำหนดค่า `channels.matrix` ด้วย `homeserver` + `accessToken` หรือ `homeserver` + `userId` + `password`
3. รีสตาร์ท Gateway
4. เริ่ม DM กับบอต หรือเชิญบอตเข้าห้อง (ดู [การเข้าร่วมอัตโนมัติ](#auto-join) - คำเชิญใหม่จะเข้ามาได้ก็ต่อเมื่อ `autoJoin` อนุญาต)

### การตั้งค่าแบบโต้ตอบ

```bash
openclaw channels add
openclaw configure --section channels
```

วิซาร์ดจะถามหา: URL ของ homeserver, วิธีการยืนยันตัวตน (access token หรือรหัสผ่าน), ID ผู้ใช้ (เฉพาะการยืนยันตัวตนด้วยรหัสผ่าน), ชื่ออุปกรณ์เพิ่มเติม, ว่าจะเปิดใช้ E2EE หรือไม่ และว่าจะกำหนดค่าการเข้าถึงห้องกับการเข้าร่วมอัตโนมัติหรือไม่

หากมี env vars `MATRIX_*` ที่ตรงกันอยู่แล้ว และบัญชีที่เลือกยังไม่มีการยืนยันตัวตนที่บันทึกไว้ วิซาร์ดจะเสนอทางลัดด้วย env-var หากต้องการแก้ชื่อห้องก่อนบันทึก allowlist ให้รัน `openclaw channels resolve --channel matrix "Project Room"` เมื่อเปิดใช้ E2EE วิซาร์ดจะเขียน config และรัน bootstrap เดียวกับ [`openclaw matrix encryption setup`](#encryption-and-verification)

### Config ขั้นต่ำ

แบบใช้ token:

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

แบบใช้รหัสผ่าน (token จะถูกแคชหลังเข้าสู่ระบบครั้งแรก):

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

ค่าเริ่มต้นของ `channels.matrix.autoJoin` คือ `off` เมื่อใช้ค่าเริ่มต้น บอตจะไม่ปรากฏในห้องใหม่หรือ DM จากคำเชิญใหม่จนกว่าคุณจะเข้าร่วมเอง

OpenClaw ไม่สามารถบอกได้ในเวลาที่ถูกเชิญว่าห้องที่เชิญเป็น DM หรือกลุ่ม ดังนั้นคำเชิญทั้งหมด - รวมถึงคำเชิญแบบ DM - จะผ่าน `autoJoin` ก่อน `dm.policy` จะมีผลภายหลังเท่านั้น หลังจากบอตเข้าร่วมแล้วและห้องถูกจัดประเภทแล้ว

<Warning>
ตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` เพื่อจำกัดว่าบอตจะยอมรับคำเชิญใด หรือ `autoJoin: "always"` เพื่อยอมรับทุกคำเชิญ

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

### รูปแบบเป้าหมายของ allowlist

ควรเติม allowlist ของ DM และห้องด้วย ID ที่เสถียร:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): ใช้ `@user:server` ค่าเริ่มต้นจะไม่สนใจชื่อที่แสดง เพราะเปลี่ยนแปลงได้ ตั้งค่า `dangerouslyAllowNameMatching: true` เฉพาะเมื่อคุณต้องการความเข้ากันได้กับรายการที่เป็นชื่อที่แสดงอย่างชัดเจน
- คีย์ allowlist ของห้อง (`groups`, `rooms` แบบเก่า): ใช้ `!room:server` หรือ `#alias:server` ค่าเริ่มต้นจะไม่สนใจชื่อห้องแบบธรรมดา ตั้งค่า `dangerouslyAllowNameMatching: true` เฉพาะเมื่อคุณต้องการความเข้ากันได้กับการค้นหาชื่อห้องที่เข้าร่วมแล้วอย่างชัดเจน
- allowlist ของคำเชิญ (`autoJoinAllowlist`): ใช้ `!room:server`, `#alias:server` หรือ `*` ชื่อห้องแบบธรรมดาจะถูกปฏิเสธ

### การ normalize ID บัญชี

วิซาร์ดจะแปลงชื่อที่อ่านง่ายให้เป็น ID บัญชีที่ normalize แล้ว ตัวอย่างเช่น `Ops Bot` จะกลายเป็น `ops-bot` เครื่องหมายวรรคตอนจะถูก escape ในชื่อ env-var แบบ scoped เพื่อให้บัญชีสองบัญชีไม่ชนกัน: `-` → `_X2D_` ดังนั้น `ops-prod` จะ map ไปที่ `MATRIX_OPS_X2D_PROD_*`

### ข้อมูลรับรองที่แคชไว้

Matrix เก็บข้อมูลรับรองที่แคชไว้ใต้ `~/.openclaw/credentials/matrix/`:

- บัญชีเริ่มต้น: `credentials.json`
- บัญชีที่ตั้งชื่อ: `credentials-<account>.json`

เมื่อมีข้อมูลรับรองที่แคชไว้ที่นั่น OpenClaw จะถือว่า Matrix ถูกกำหนดค่าแล้ว แม้ access token จะไม่ได้อยู่ในไฟล์ config ก็ตาม - ซึ่งครอบคลุมการตั้งค่า, `openclaw doctor` และ probe สถานะช่องทาง

### ตัวแปรสภาพแวดล้อม

ใช้เมื่อไม่ได้ตั้งค่าคีย์ config ที่เทียบเท่า บัญชีเริ่มต้นใช้ชื่อที่ไม่มี prefix ส่วนบัญชีที่ตั้งชื่อจะใช้ ID บัญชีแทรกก่อน suffix

| บัญชีเริ่มต้น       | บัญชีที่ตั้งชื่อ (`<ID>` คือ ID บัญชีที่ normalize แล้ว) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

สำหรับบัญชี `ops` ชื่อจะกลายเป็น `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` และอื่น ๆ env vars ของ recovery-key จะถูกอ่านโดย flow ของ CLI ที่รองรับ recovery (`verify backup restore`, `verify device`, `verify bootstrap`) เมื่อคุณ pipe key เข้ามาผ่าน `--recovery-key-stdin`

ไม่สามารถตั้งค่า `MATRIX_HOMESERVER` จาก `.env` ของ workspace ได้ ดู [ไฟล์ `.env` ของ Workspace](/th/gateway/security)

## ตัวอย่างการกำหนดค่า

baseline ที่ใช้งานได้จริงพร้อมการจับคู่ DM, allowlist ของห้อง และ E2EE:

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

## ตัวอย่าง preview แบบ streaming

การ streaming คำตอบของ Matrix เป็นแบบ opt-in `streaming` ควบคุมวิธีที่ OpenClaw ส่งคำตอบของผู้ช่วยที่กำลังดำเนินอยู่ ส่วน `blockStreaming` ควบคุมว่าแต่ละ block ที่เสร็จแล้วจะถูกเก็บไว้เป็นข้อความ Matrix แยกของตัวเองหรือไม่

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

หากต้องการเก็บ preview คำตอบแบบสดไว้ แต่ซ่อนบรรทัด tool/progress ชั่วคราว ให้ใช้รูปแบบ object:

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

| `streaming`       | พฤติกรรม                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (ค่าเริ่มต้น) | รอคำตอบเต็มแล้วส่งครั้งเดียว `true` ↔ `"partial"`, `false` ↔ `"off"`                                                                                        |
| `"partial"`       | แก้ไขข้อความข้อความปกติหนึ่งรายการในที่เดิมขณะที่โมเดลเขียน block ปัจจุบัน ไคลเอนต์ Matrix มาตรฐานอาจแจ้งเตือนที่ preview แรก ไม่ใช่การแก้ไขสุดท้าย              |
| `"quiet"`         | เหมือนกับ `"partial"` แต่ข้อความเป็น notice ที่ไม่แจ้งเตือน ผู้รับจะได้รับการแจ้งเตือนก็ต่อเมื่อ push rule ต่อผู้ใช้ตรงกับการแก้ไขที่ finalize แล้ว (ดูด้านล่าง) |

`blockStreaming` เป็นอิสระจาก `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (ค่าเริ่มต้น)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | draft สดสำหรับ block ปัจจุบัน, block ที่เสร็จแล้วถูกเก็บเป็นข้อความ | draft สดสำหรับ block ปัจจุบัน, finalize ในที่เดิม |
| `"off"`                 | ข้อความ Matrix แบบแจ้งเตือนหนึ่งรายการต่อ block ที่เสร็จแล้ว                     | ข้อความ Matrix แบบแจ้งเตือนหนึ่งรายการสำหรับคำตอบเต็ม      |

หมายเหตุ:

- หาก preview ยาวเกินขีดจำกัดขนาดต่อ event ของ Matrix OpenClaw จะหยุด preview streaming และ fallback ไปใช้การส่งเฉพาะผลลัพธ์สุดท้าย
- คำตอบที่เป็นสื่อจะส่งไฟล์แนบตามปกติเสมอ หาก preview ที่ค้างอยู่ไม่สามารถนำกลับมาใช้ซ้ำได้อย่างปลอดภัยอีกต่อไป OpenClaw จะ redact มันก่อนส่งคำตอบสื่อสุดท้าย
- การอัปเดต preview ความคืบหน้าของเครื่องมือจะเปิดใช้โดยค่าเริ่มต้นเมื่อ preview streaming ของ Matrix ทำงานอยู่ ตั้งค่า `streaming.preview.toolProgress: false` เพื่อเก็บการแก้ไข preview สำหรับข้อความคำตอบ แต่ให้ความคืบหน้าของเครื่องมืออยู่บนเส้นทางการส่งปกติ
- การแก้ไข preview มีค่าใช้จ่ายเป็นการเรียก Matrix API เพิ่มเติม ปล่อย `streaming: "off"` ไว้หากคุณต้องการโปรไฟล์ rate-limit ที่อนุรักษ์นิยมที่สุด

## ข้อความเสียง

บันทึกเสียง Matrix ขาเข้าจะถูกถอดเสียงก่อน gate การ mention ห้อง วิธีนี้ทำให้บันทึกเสียงที่พูดชื่อบอต trigger agent ในห้อง `requireMention: true` ได้ และให้ transcript แก่ agent แทนที่จะมีเพียง placeholder ของไฟล์แนบเสียง

Matrix ใช้ provider สื่อเสียงร่วมที่กำหนดค่าไว้ใต้ `tools.media.audio` เช่น OpenAI `gpt-4o-mini-transcribe` ดู [ภาพรวมเครื่องมือสื่อ](/th/tools/media-overview) สำหรับการตั้งค่า provider และขีดจำกัด

รายละเอียดพฤติกรรม:

- event `m.audio` และ event `m.file` ที่มี MIME type เป็น `audio/*` เข้าเงื่อนไข
- ในห้องที่เข้ารหัส OpenClaw จะถอดรหัสไฟล์แนบผ่านเส้นทางสื่อ Matrix ที่มีอยู่ก่อนการถอดเสียง
- transcript จะถูกทำเครื่องหมายว่า machine-generated และไม่น่าเชื่อถือใน prompt ของ agent
- ไฟล์แนบจะถูกทำเครื่องหมายว่าถอดเสียงแล้ว เพื่อให้เครื่องมือสื่อ downstream ไม่ถอดเสียงบันทึกเสียงเดียวกันซ้ำ
- ตั้งค่า `tools.media.audio.enabled: false` เพื่อปิดการถอดเสียง audio ทั่วทั้งระบบ

## metadata การอนุมัติ

prompt การอนุมัติ native ของ Matrix เป็น event `m.room.message` ปกติที่มีเนื้อหา event แบบกำหนดเองเฉพาะ OpenClaw ใต้ `com.openclaw.approval` Matrix อนุญาตคีย์ event-content แบบกำหนดเอง ดังนั้นไคลเอนต์มาตรฐานยังคง render body ข้อความได้ ขณะที่ไคลเอนต์ที่เข้าใจ OpenClaw สามารถอ่าน id การอนุมัติแบบมีโครงสร้าง, kind, state, decision ที่มีให้ และรายละเอียด exec/Plugin ได้

เมื่อ prompt การอนุมัติยาวเกิน event Matrix หนึ่งรายการ OpenClaw จะแบ่งข้อความที่มองเห็นได้เป็น chunk และแนบ `com.openclaw.approval` กับ chunk แรกเท่านั้น ปฏิกิริยาสำหรับ decision อนุญาต/ปฏิเสธจะผูกกับ event แรกนั้น ดังนั้น prompt ที่ยาวจะคงเป้าหมายการอนุมัติเดียวกับ prompt แบบ event เดียว

### push rules แบบ self-hosted สำหรับ preview ที่ finalize แบบ quiet

`streaming: "quiet"` จะแจ้งเตือนผู้รับก็ต่อเมื่อ block หรือ turn ถูก finalize แล้ว - push rule ต่อผู้ใช้ต้องตรงกับ marker ของ preview ที่ finalize แล้ว ดู [push rules ของ Matrix สำหรับ preview แบบ quiet](/th/channels/matrix-push-rules) สำหรับสูตรทั้งหมด (token ผู้รับ, การตรวจสอบ pusher, การติดตั้ง rule, หมายเหตุราย homeserver)

## ห้องบอตต่อบอต

โดยค่าเริ่มต้น ข้อความ Matrix จากบัญชี Matrix ของ OpenClaw อื่นที่กำหนดค่าไว้จะถูกละเว้น

ใช้ `allowBots` เมื่อคุณตั้งใจต้องการ traffic Matrix ระหว่าง agent:

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

- `allowBots: true` ยอมรับข้อความจากบัญชีบอท Matrix อื่นที่กำหนดค่าไว้ในห้องและ DM ที่อนุญาต
- `allowBots: "mentions"` ยอมรับข้อความเหล่านั้นเฉพาะเมื่อมีการกล่าวถึงบอทนี้อย่างมองเห็นได้ในห้องเท่านั้น DM ยังคงอนุญาต
- `groups.<room>.allowBots` แทนที่การตั้งค่าระดับบัญชีสำหรับห้องเดียว
- ข้อความจากบอทที่กำหนดค่าไว้และได้รับการยอมรับจะใช้ [การป้องกันลูปของบอท](/th/channels/bot-loop-protection) ร่วมกัน กำหนดค่า `channels.defaults.botLoopProtection` แล้วแทนที่ด้วย `channels.matrix.botLoopProtection` หรือ `channels.matrix.groups.<room>.botLoopProtection` เมื่อห้องหนึ่งต้องการงบประมาณที่ต่างออกไป
- OpenClaw ยังคงละเว้นข้อความจาก ID ผู้ใช้ Matrix เดียวกันเพื่อหลีกเลี่ยงลูปการตอบตัวเอง
- Matrix ไม่เปิดเผยแฟล็กบอทแบบเนทีฟที่นี่ OpenClaw ถือว่า "เขียนโดยบอท" หมายถึง "ส่งโดยบัญชี Matrix อื่นที่กำหนดค่าไว้บน Gateway ของ OpenClaw นี้"

ใช้รายการอนุญาตของห้องและข้อกำหนดการกล่าวถึงอย่างเข้มงวดเมื่อเปิดใช้ทราฟฟิกระหว่างบอทในห้องที่ใช้ร่วมกัน

## การเข้ารหัสและการยืนยัน

ในห้องที่เข้ารหัส (E2EE) เหตุการณ์รูปภาพขาออกจะใช้ `thumbnail_file` เพื่อให้ภาพตัวอย่างถูกเข้ารหัสพร้อมกับไฟล์แนบเต็ม ห้องที่ไม่ได้เข้ารหัสยังคงใช้ `thumbnail_url` แบบปกติ ไม่ต้องกำหนดค่าใด ๆ - Plugin จะตรวจจับสถานะ E2EE โดยอัตโนมัติ

คำสั่ง `openclaw matrix` ทั้งหมดยอมรับ `--verbose` (การวินิจฉัยแบบเต็ม), `--json` (เอาต์พุตที่เครื่องอ่านได้) และ `--account <id>` (การตั้งค่าหลายบัญชี) เอาต์พุตจะกระชับโดยค่าเริ่มต้น พร้อมการบันทึกภายใน SDK แบบเงียบ ตัวอย่างด้านล่างแสดงรูปแบบมาตรฐาน เพิ่มแฟล็กตามต้องการ

### เปิดใช้การเข้ารหัส

```bash
openclaw matrix encryption setup
```

บูตสแตรปที่เก็บข้อมูลลับและการลงนามข้าม สร้างข้อมูลสำรองคีย์ห้องหากจำเป็น จากนั้นพิมพ์สถานะและขั้นตอนถัดไป แฟล็กที่มีประโยชน์:

- `--recovery-key <key>` ใช้คีย์กู้คืนก่อนบูตสแตรป (แนะนำรูปแบบ stdin ที่บันทึกไว้ด้านล่าง)
- `--force-reset-cross-signing` ทิ้งตัวตนการลงนามข้ามปัจจุบันและสร้างใหม่ (ใช้เมื่อเจตนาเท่านั้น)

สำหรับบัญชีใหม่ ให้เปิดใช้ E2EE ตอนสร้าง:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` เป็นนามแฝงของ `--enable-e2ee`

การกำหนดค่าด้วยตนเองที่เทียบเท่า:

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

- `Locally trusted`: เชื่อถือโดยไคลเอนต์นี้เท่านั้น
- `Cross-signing verified`: SDK รายงานการยืนยันผ่านการลงนามข้าม
- `Signed by owner`: ลงนามโดยคีย์ลงนามด้วยตนเองของคุณเอง (เพื่อการวินิจฉัยเท่านั้น)

`Verified by owner` จะกลายเป็น `yes` เฉพาะเมื่อ `Cross-signing verified` เป็น `yes` ความเชื่อถือในเครื่องหรือเพียงลายเซ็นเจ้าของอย่างเดียวไม่เพียงพอ

`--allow-degraded-local-state` ส่งคืนการวินิจฉัยแบบดีที่สุดเท่าที่ทำได้โดยไม่ต้องเตรียมบัญชี Matrix ก่อน มีประโยชน์สำหรับการตรวจสอบแบบออฟไลน์หรือที่กำหนดค่าบางส่วน

### ยืนยันอุปกรณ์นี้ด้วยคีย์กู้คืน

คีย์กู้คืนเป็นข้อมูลละเอียดอ่อน - ส่งผ่าน stdin แทนการส่งบนบรรทัดคำสั่ง ตั้งค่า `MATRIX_RECOVERY_KEY` (หรือ `MATRIX_<ID>_RECOVERY_KEY` สำหรับบัญชีที่มีชื่อ):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

คำสั่งรายงานสามสถานะ:

- `Recovery key accepted`: Matrix ยอมรับคีย์สำหรับที่เก็บข้อมูลลับหรือความเชื่อถือของอุปกรณ์
- `Backup usable`: สามารถโหลดข้อมูลสำรองคีย์ห้องด้วยวัสดุกู้คืนที่เชื่อถือได้
- `Device verified by owner`: อุปกรณ์นี้มีความเชื่อถือตัวตนการลงนามข้ามของ Matrix เต็มรูปแบบ

คำสั่งจะออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อความเชื่อถือตัวตนเต็มรูปแบบยังไม่สมบูรณ์ แม้คีย์กู้คืนจะปลดล็อกวัสดุสำรองแล้วก็ตาม ในกรณีนั้น ให้ยืนยันตนเองให้เสร็จจากไคลเอนต์ Matrix อื่น:

```bash
openclaw matrix verify self
```

`verify self` รอจนกว่า `Cross-signing verified: yes` ก่อนออกสำเร็จ ใช้ `--timeout-ms <ms>` เพื่อปรับเวลารอ

รูปแบบคีย์ตามตัวอักษร `openclaw matrix verify device "<recovery-key>"` ก็ยอมรับเช่นกัน แต่คีย์จะไปอยู่ในประวัติเชลล์ของคุณ

### บูตสแตรปหรือซ่อมแซมการลงนามข้าม

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` คือคำสั่งซ่อมแซมและตั้งค่าสำหรับบัญชีที่เข้ารหัส ตามลำดับ คำสั่งจะ:

- บูตสแตรปที่เก็บข้อมูลลับ โดยใช้คีย์กู้คืนเดิมซ้ำเมื่อเป็นไปได้
- บูตสแตรปการลงนามข้ามและอัปโหลดคีย์สาธารณะที่ขาดหาย
- ทำเครื่องหมายและลงนามข้ามอุปกรณ์ปัจจุบัน
- สร้างข้อมูลสำรองคีย์ห้องฝั่งเซิร์ฟเวอร์หากยังไม่มีอยู่

หาก homeserver ต้องใช้ UIA เพื่ออัปโหลดคีย์การลงนามข้าม OpenClaw จะลองแบบไม่มีการตรวจสอบสิทธิ์ก่อน จากนั้น `m.login.dummy` แล้วจึง `m.login.password` (ต้องใช้ `channels.matrix.password`)

แฟล็กที่มีประโยชน์:

- `--recovery-key-stdin` (ใช้คู่กับ `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) หรือ `--recovery-key <key>`
- `--force-reset-cross-signing` เพื่อทิ้งตัวตนการลงนามข้ามปัจจุบัน (เฉพาะเมื่อเจตนาเท่านั้น ต้องมีคีย์กู้คืนที่ใช้งานอยู่เก็บไว้หรือส่งมาพร้อม `--recovery-key-stdin`)

### ข้อมูลสำรองคีย์ห้อง

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` แสดงว่ามีข้อมูลสำรองฝั่งเซิร์ฟเวอร์หรือไม่ และอุปกรณ์นี้ถอดรหัสได้หรือไม่ `backup restore` นำเข้าคีย์ห้องที่สำรองไว้เข้าสู่ที่เก็บคริปโตในเครื่อง หากคีย์กู้คืนมีอยู่บนดิสก์แล้ว คุณสามารถละ `--recovery-key-stdin` ได้

เพื่อแทนที่ข้อมูลสำรองที่เสียด้วยฐานใหม่ (ยอมรับการสูญเสียประวัติเก่าที่กู้คืนไม่ได้ และยังสามารถสร้างที่เก็บข้อมูลลับใหม่ได้หากโหลดความลับของข้อมูลสำรองปัจจุบันไม่ได้):

```bash
openclaw matrix verify backup reset --yes
```

เพิ่ม `--rotate-recovery-key` เฉพาะเมื่อคุณตั้งใจให้คีย์กู้คืนก่อนหน้าหยุดปลดล็อกฐานข้อมูลสำรองใหม่นี้

### การแสดงรายการ การขอ และการตอบกลับการยืนยัน

```bash
openclaw matrix verify list
```

แสดงรายการคำขอยืนยันที่รอดำเนินการสำหรับบัญชีที่เลือก

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

ส่งคำขอยืนยันจากบัญชี OpenClaw นี้ `--own-user` ขอการยืนยันตนเอง (คุณยอมรับพรอมต์ในไคลเอนต์ Matrix อื่นของผู้ใช้เดียวกัน); `--user-id`/`--device-id`/`--room-id` กำหนดเป้าหมายเป็นบุคคลอื่น `--own-user` ไม่สามารถใช้ร่วมกับแฟล็กกำหนดเป้าหมายอื่นได้

สำหรับการจัดการวงจรชีวิตระดับล่าง - โดยทั่วไปเมื่อเฝ้าตามคำขอขาเข้าจากไคลเอนต์อื่น - คำสั่งเหล่านี้ทำงานกับคำขอ `<id>` เฉพาะ (พิมพ์โดย `verify list` และ `verify request`):

| คำสั่ง                                     | วัตถุประสงค์                                                        |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | ยอมรับคำขอขาเข้า                                                   |
| `openclaw matrix verify start <id>`        | เริ่มโฟลว์ SAS                                                      |
| `openclaw matrix verify sas <id>`          | พิมพ์อีโมจิหรือเลขฐานสิบของ SAS                                    |
| `openclaw matrix verify confirm-sas <id>`  | ยืนยันว่า SAS ตรงกับที่ไคลเอนต์อื่นแสดง                            |
| `openclaw matrix verify mismatch-sas <id>` | ปฏิเสธ SAS เมื่ออีโมจิหรือเลขฐานสิบไม่ตรงกัน                       |
| `openclaw matrix verify cancel <id>`       | ยกเลิก; รับ `--reason <text>` และ `--code <matrix-code>` เป็นตัวเลือก |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` และ `cancel` ทั้งหมดยอมรับ `--user-id` และ `--room-id` เป็นคำใบ้ติดตามผลของ DM เมื่อการยืนยันยึดอยู่กับห้องข้อความตรงเฉพาะ

### หมายเหตุหลายบัญชี

หากไม่มี `--account <id>` คำสั่ง CLI ของ Matrix จะใช้บัญชีเริ่มต้นโดยนัย หากคุณมีหลายบัญชีที่มีชื่อและยังไม่ได้ตั้งค่า `channels.matrix.defaultAccount` คำสั่งจะปฏิเสธการเดาและขอให้คุณเลือก เมื่อ E2EE ถูกปิดใช้งานหรือไม่พร้อมใช้งานสำหรับบัญชีที่มีชื่อ ข้อผิดพลาดจะชี้ไปยังคีย์การกำหนดค่าของบัญชีนั้น เช่น `channels.matrix.accounts.assistant.encryption`

<AccordionGroup>
  <Accordion title="พฤติกรรมเมื่อเริ่มต้น">
    เมื่อมี `encryption: true`, `startupVerification` มีค่าเริ่มต้นเป็น `"if-unverified"` เมื่อเริ่มต้น อุปกรณ์ที่ยังไม่ได้ยืนยันจะขอการยืนยันตนเองในไคลเอนต์ Matrix อื่น โดยข้ามรายการซ้ำและใช้ช่วงพัก (ค่าเริ่มต้น 24 ชั่วโมง) ปรับด้วย `startupVerificationCooldownHours` หรือปิดใช้งานด้วย `startupVerification: "off"`

    การเริ่มต้นยังรันรอบบูตสแตรปคริปโตแบบระมัดระวังที่ใช้ที่เก็บข้อมูลลับและตัวตนการลงนามข้ามปัจจุบันซ้ำ หากสถานะบูตสแตรปเสีย OpenClaw จะพยายามซ่อมแซมแบบมีการป้องกันแม้ไม่มี `channels.matrix.password`; หาก homeserver ต้องใช้ UIA ด้วยรหัสผ่าน การเริ่มต้นจะบันทึกคำเตือนและยังไม่ถือว่าร้ายแรง อุปกรณ์ที่ลงนามโดยเจ้าของแล้วจะถูกเก็บรักษาไว้

    ดู [การย้ายข้อมูล Matrix](/th/channels/matrix-migration) สำหรับโฟลว์อัปเกรดแบบเต็ม

  </Accordion>

  <Accordion title="ประกาศการยืนยัน">
    Matrix โพสต์ประกาศวงจรชีวิตการยืนยันลงในห้องยืนยัน DM แบบเข้มงวดเป็นข้อความ `m.notice`: คำขอ, พร้อม (พร้อมคำแนะนำ "ยืนยันด้วยอีโมจิ"), เริ่มต้น/เสร็จสมบูรณ์ และรายละเอียด SAS (อีโมจิ/เลขฐานสิบ) เมื่อมี

    คำขอขาเข้าจากไคลเอนต์ Matrix อื่นจะถูกติดตามและยอมรับอัตโนมัติ สำหรับการยืนยันตนเอง OpenClaw จะเริ่มโฟลว์ SAS โดยอัตโนมัติและยืนยันฝั่งของตัวเองเมื่อการยืนยันด้วยอีโมจิพร้อมใช้งาน - คุณยังต้องเปรียบเทียบและยืนยัน "ตรงกัน" ในไคลเอนต์ Matrix ของคุณ

    ประกาศระบบการยืนยันจะไม่ถูกส่งต่อไปยังไปป์ไลน์แชทของเอเจนต์

  </Accordion>

  <Accordion title="อุปกรณ์ Matrix ที่ถูกลบหรือไม่ถูกต้อง">
    หาก `verify status` บอกว่าอุปกรณ์ปัจจุบันไม่อยู่ในรายการบน homeserver แล้ว ให้สร้างอุปกรณ์ Matrix ของ OpenClaw ใหม่ สำหรับการเข้าสู่ระบบด้วยรหัสผ่าน:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    สำหรับการตรวจสอบสิทธิ์ด้วยโทเค็น ให้สร้าง access token ใหม่ในไคลเอนต์ Matrix หรือ UI ผู้ดูแลระบบของคุณ แล้วอัปเดต OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    แทนที่ `assistant` ด้วย ID บัญชีจากคำสั่งที่ล้มเหลว หรือละ `--account` สำหรับบัญชีเริ่มต้น

  </Accordion>

  <Accordion title="สุขอนามัยของอุปกรณ์">
    อุปกรณ์เก่าที่ OpenClaw จัดการสามารถสะสมได้ แสดงรายการและตัดออก:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="ที่เก็บคริปโต">
    Matrix E2EE ใช้เส้นทางคริปโต Rust อย่างเป็นทางการของ `matrix-js-sdk` พร้อม `fake-indexeddb` เป็นชิม IndexedDB สถานะคริปโตคงอยู่ใน `crypto-idb-snapshot.json` (สิทธิ์ไฟล์แบบจำกัด)

    สถานะรันไทม์ที่เข้ารหัสอยู่ใต้ `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` และรวมถึงที่เก็บซิงก์ ที่เก็บคริปโต คีย์กู้คืน สแนปชอต IDB การผูกเธรด และสถานะการยืนยันเมื่อเริ่มต้น เมื่อโทเค็นเปลี่ยนแต่ตัวตนบัญชียังคงเดิม OpenClaw จะใช้รากที่มีอยู่ที่ดีที่สุดซ้ำเพื่อให้สถานะก่อนหน้ายังคงมองเห็นได้

    ราก token-hash เก่าหนึ่งรายการอาจเป็นเส้นทางความต่อเนื่องจากการหมุนโทเค็นตามปกติ หาก OpenClaw บันทึก `matrix: multiple populated token-hash storage roots detected` ให้ตรวจสอบไดเรกทอรีบัญชีและเก็บรากพี่น้องที่ล้าสมัยไว้ในอาร์ไคฟ์หลังจากยืนยันว่ารากที่ใช้งานที่เลือกนั้นแข็งแรงแล้วเท่านั้น แนะนำให้ย้ายรากที่ล้าสมัยไปไว้ในไดเรกทอรี `_archive/` แทนการลบทันที

  </Accordion>
</AccordionGroup>

## การจัดการโปรไฟล์

อัปเดตโปรไฟล์ตนเองของ Matrix สำหรับบัญชีที่เลือก:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

คุณสามารถส่งทั้งสองตัวเลือกในการเรียกครั้งเดียวได้ Matrix รับ URL รูปประจำตัวแบบ `mxc://` โดยตรง เมื่อคุณส่ง `http://` หรือ `https://` OpenClaw จะอัปโหลดไฟล์ก่อน แล้วเก็บ URL `mxc://` ที่ได้ไว้ใน `channels.matrix.avatarUrl` (หรือค่าทับต่อบัญชี)

## เธรด

Matrix รองรับเธรด Matrix แบบเนทีฟสำหรับทั้งการตอบกลับอัตโนมัติและการส่งด้วยเครื่องมือข้อความ ปุ่มปรับอิสระสองรายการควบคุมพฤติกรรม:

### การกำหนดเส้นทางเซสชัน (`sessionScope`)

`dm.sessionScope` กำหนดว่าห้อง DM ของ Matrix จับคู่กับเซสชัน OpenClaw อย่างไร:

- `"per-user"` (ค่าเริ่มต้น): ห้อง DM ทั้งหมดที่มีเพียร์ที่กำหนดเส้นทางเดียวกันใช้เซสชันเดียวร่วมกัน
- `"per-room"`: ห้อง DM ของ Matrix แต่ละห้องได้รับคีย์เซสชันของตัวเอง แม้ว่าเพียร์จะเป็นคนเดียวกันก็ตาม

การผูกบทสนทนาแบบชัดเจนจะมีผลเหนือ `sessionScope` เสมอ ดังนั้นห้องและเธรดที่ถูกผูกไว้จะคงเซสชันเป้าหมายที่เลือกไว้

### การตอบกลับในเธรด (`threadReplies`)

`threadReplies` กำหนดว่าบอตโพสต์คำตอบไว้ที่ใด:

- `"off"`: การตอบกลับอยู่ระดับบนสุด ข้อความขาเข้าในเธรดยังคงอยู่ในเซสชันแม่
- `"inbound"`: ตอบกลับภายในเธรดเฉพาะเมื่อข้อความขาเข้าอยู่ในเธรดนั้นอยู่แล้ว
- `"always"`: ตอบกลับภายในเธรดที่มีรากอยู่ที่ข้อความที่ทริกเกอร์ บทสนทนานั้นจะถูกกำหนดเส้นทางผ่านเซสชันระดับเธรดที่ตรงกันตั้งแต่ทริกเกอร์แรกเป็นต้นไป

`dm.threadReplies` ทับค่านี้เฉพาะสำหรับ DM เท่านั้น - ตัวอย่างเช่น คงการแยกเธรดของห้องไว้ในขณะที่ทำให้ DM เป็นแบบแบน

### การสืบทอดเธรดและคำสั่งสแลช

- ข้อความขาเข้าในเธรดจะรวมข้อความรากของเธรดเป็นบริบทเอเจนต์เพิ่มเติม
- การส่งด้วยเครื่องมือข้อความจะสืบทอดเธรด Matrix ปัจจุบันโดยอัตโนมัติเมื่อกำหนดเป้าหมายไปยังห้องเดียวกัน (หรือเป้าหมายผู้ใช้ DM เดียวกัน) เว้นแต่จะระบุ `threadId` อย่างชัดเจน
- การใช้เป้าหมายผู้ใช้ DM ซ้ำจะทำงานเฉพาะเมื่อเมทาดาทาของเซสชันปัจจุบันพิสูจน์ว่าเป็นเพียร์ DM เดียวกันบนบัญชี Matrix เดียวกัน มิฉะนั้น OpenClaw จะย้อนกลับไปใช้การกำหนดเส้นทางตามผู้ใช้ตามปกติ
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และ `/acp spawn` ที่ผูกกับเธรดทำงานได้ทั้งหมดในห้อง Matrix และ DM
- `/focus` ระดับบนสุดจะสร้างเธรด Matrix ใหม่และผูกกับเซสชันเป้าหมายเมื่อเปิดใช้ `threadBindings.spawnSessions`
- การเรียก `/focus` หรือ `/acp spawn --thread here` ภายในเธรด Matrix ที่มีอยู่จะผูกเธรดนั้นไว้ในตำแหน่งเดิม

เมื่อ OpenClaw ตรวจพบว่าห้อง DM ของ Matrix ชนกับห้อง DM อื่นในเซสชันร่วมเดียวกัน OpenClaw จะโพสต์ `m.notice` หนึ่งครั้งในห้องนั้น โดยชี้ไปยังทางออก `/focus` และแนะนำให้เปลี่ยน `dm.sessionScope` การแจ้งเตือนจะแสดงเฉพาะเมื่อเปิดใช้การผูกเธรด

## การผูกบทสนทนา ACP

ห้อง Matrix, DM และเธรด Matrix ที่มีอยู่สามารถเปลี่ยนเป็นพื้นที่ทำงาน ACP แบบคงทนได้โดยไม่เปลี่ยนพื้นผิวแชต

โฟลว์ด่วนสำหรับโอเปอเรเตอร์:

- เรียก `/acp spawn codex --bind here` ภายใน DM, ห้อง หรือเธรดที่มีอยู่ของ Matrix ที่คุณต้องการใช้งานต่อ
- ใน DM หรือห้อง Matrix ระดับบนสุด DM/ห้องปัจจุบันจะยังคงเป็นพื้นผิวแชต และข้อความในอนาคตจะกำหนดเส้นทางไปยังเซสชัน ACP ที่สร้างขึ้น
- ภายในเธรด Matrix ที่มีอยู่ `--bind here` จะผูกเธรดปัจจุบันนั้นไว้ในตำแหน่งเดิม
- `/new` และ `/reset` รีเซ็ตเซสชัน ACP ที่ผูกไว้เดิมในตำแหน่งเดิม
- `/acp close` ปิดเซสชัน ACP และลบการผูก

หมายเหตุ:

- `--bind here` ไม่สร้างเธรดลูกของ Matrix
- `threadBindings.spawnSessions` ควบคุม `/acp spawn --thread auto|here` ซึ่ง OpenClaw จำเป็นต้องสร้างหรือผูกเธรดลูกของ Matrix

### การกำหนดค่าการผูกเธรด

Matrix สืบทอดค่าเริ่มต้นส่วนกลางจาก `session.threadBindings` และยังรองรับการทับค่าต่อช่องทาง:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

การสร้างเซสชันที่ผูกกับเธรดของ Matrix เปิดเป็นค่าเริ่มต้น:

- ตั้ง `threadBindings.spawnSessions: false` เพื่อบล็อก `/focus` ระดับบนสุดและ `/acp spawn --thread auto|here` ไม่ให้สร้าง/ผูกเธรด Matrix
- ตั้ง `threadBindings.defaultSpawnContext: "isolated"` เมื่อการสร้างเธรดซับเอเจนต์แบบเนทีฟไม่ควร fork ทรานสคริปต์แม่

## รีแอ็กชัน

Matrix รองรับรีแอ็กชันขาออก การแจ้งเตือนรีแอ็กชันขาเข้า และรีแอ็กชันยืนยันรับ

เครื่องมือรีแอ็กชันขาออกถูกควบคุมโดย `channels.matrix.actions.reactions`:

- `react` เพิ่มรีแอ็กชันให้กับอีเวนต์ Matrix
- `reactions` แสดงสรุปรีแอ็กชันปัจจุบันสำหรับอีเวนต์ Matrix
- `emoji=""` ลบรีแอ็กชันของบอตเองบนอีเวนต์นั้น
- `remove: true` ลบเฉพาะรีแอ็กชันอีโมจิที่ระบุจากบอต

**ลำดับการแปลงค่า** (ค่าที่กำหนดไว้ก่อนจะชนะ):

| การตั้งค่า               | ลำดับ                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | ต่อบัญชี → ช่องทาง → `messages.ackReaction` → อีโมจิสำรองของตัวตนเอเจนต์        |
| `ackReactionScope`      | ต่อบัญชี → ช่องทาง → `messages.ackReactionScope` → ค่าเริ่มต้น `"group-mentions"` |
| `reactionNotifications` | ต่อบัญชี → ช่องทาง → ค่าเริ่มต้น `"own"`                                          |

`reactionNotifications: "own"` ส่งต่ออีเวนต์ `m.reaction` ที่เพิ่มเข้ามาเมื่ออีเวนต์เหล่านั้นมีเป้าหมายเป็นข้อความ Matrix ที่บอตเขียนขึ้น `"off"` ปิดใช้งานอีเวนต์ระบบรีแอ็กชัน การลบรีแอ็กชันจะไม่ถูกสังเคราะห์เป็นอีเวนต์ระบบ เพราะ Matrix แสดงสิ่งเหล่านั้นเป็นการลบข้อความ ไม่ใช่การลบ `m.reaction` แบบแยกเดี่ยว

## บริบทประวัติ

- `channels.matrix.historyLimit` ควบคุมจำนวนข้อความล่าสุดในห้องที่จะรวมเป็น `InboundHistory` เมื่อข้อความห้อง Matrix ทริกเกอร์เอเจนต์ ย้อนกลับไปใช้ `messages.groupChat.historyLimit` หากไม่ได้ตั้งทั้งสองค่า ค่าเริ่มต้นที่มีผลคือ `0` ตั้ง `0` เพื่อปิดใช้งาน
- ประวัติห้อง Matrix เป็นเฉพาะห้องเท่านั้น DM ยังคงใช้ประวัติเซสชันปกติ
- ประวัติห้อง Matrix เป็นแบบรอดำเนินการเท่านั้น: OpenClaw บัฟเฟอร์ข้อความห้องที่ยังไม่ได้ทริกเกอร์การตอบกลับ แล้วจึงจับภาพหน้าต่างนั้นเมื่อมีการกล่าวถึงหรือทริกเกอร์อื่นมาถึง
- ข้อความทริกเกอร์ปัจจุบันไม่รวมอยู่ใน `InboundHistory` ข้อความนั้นยังอยู่ในเนื้อหาขาเข้าหลักสำหรับเทิร์นนั้น
- การลองซ้ำของอีเวนต์ Matrix เดิมจะใช้ภาพรวมประวัติเดิมซ้ำแทนที่จะเลื่อนไปยังข้อความห้องที่ใหม่กว่า

## การมองเห็นบริบท

Matrix รองรับการควบคุม `contextVisibility` ร่วมสำหรับบริบทห้องเพิ่มเติม เช่น ข้อความตอบกลับที่ดึงมา รากเธรด และประวัติที่รอดำเนินการ

- `contextVisibility: "all"` เป็นค่าเริ่มต้น บริบทเพิ่มเติมจะถูกเก็บไว้ตามที่ได้รับ
- `contextVisibility: "allowlist"` กรองบริบทเพิ่มเติมให้เหลือเฉพาะผู้ส่งที่อนุญาตโดยการตรวจสอบ allowlist ของห้อง/ผู้ใช้ที่ใช้งานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บการตอบกลับที่อ้างอิงอย่างชัดเจนหนึ่งรายการไว้

การตั้งค่านี้มีผลต่อการมองเห็นบริบทเพิ่มเติม ไม่ใช่ว่าข้อความขาเข้าเองสามารถทริกเกอร์การตอบกลับได้หรือไม่
การอนุญาตทริกเกอร์ยังคงมาจาก `groupPolicy`, `groups`, `groupAllowFrom` และการตั้งค่านโยบาย DM

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

หากต้องการปิดเสียง DM ทั้งหมดในขณะที่ยังคงให้ห้องทำงานได้ ให้ตั้ง `dm.enabled: false`:

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

ดู [กลุ่ม](/th/channels/groups) สำหรับพฤติกรรมการกั้นด้วยการกล่าวถึงและ allowlist

ตัวอย่างการจับคู่สำหรับ DM ของ Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

หากผู้ใช้ Matrix ที่ยังไม่ได้อนุมัติส่งข้อความหาคุณต่อก่อนการอนุมัติ OpenClaw จะใช้รหัสจับคู่ที่รอดำเนินการเดิมซ้ำ และอาจส่งคำตอบเตือนหลังคูลดาวน์สั้น ๆ แทนการสร้างรหัสใหม่

ดู [การจับคู่](/th/channels/pairing) สำหรับโฟลว์การจับคู่ DM ร่วมและเค้าโครงพื้นที่จัดเก็บ

## การซ่อมแซมห้องโดยตรง

หากสถานะข้อความโดยตรงหลุดจากการซิงค์ OpenClaw อาจลงเอยด้วยการจับคู่ `m.direct` ที่ล้าสมัยซึ่งชี้ไปยังห้องเดี่ยวเก่าแทน DM ที่ใช้งานอยู่ ตรวจสอบการจับคู่ปัจจุบันสำหรับเพียร์:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

ซ่อมแซม:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

ทั้งสองคำสั่งรับ `--account <id>` สำหรับการตั้งค่าหลายบัญชี โฟลว์ซ่อมแซม:

- เลือก DM แบบ 1:1 ที่เข้มงวดซึ่งถูกจับคู่ไว้ใน `m.direct` อยู่แล้วก่อน
- ย้อนกลับไปใช้ DM แบบ 1:1 ที่เข้มงวดซึ่งเข้าร่วมอยู่ในปัจจุบันกับผู้ใช้นั้น
- สร้างห้องโดยตรงใหม่และเขียน `m.direct` ใหม่ หากไม่มี DM ที่สมบูรณ์อยู่

คำสั่งนี้ไม่ลบห้องเก่าโดยอัตโนมัติ แต่เลือก DM ที่สมบูรณ์และอัปเดตการจับคู่เพื่อให้การส่ง Matrix ในอนาคต การแจ้งเตือนการตรวจสอบ และโฟลว์ข้อความโดยตรงอื่น ๆ กำหนดเป้าหมายไปยังห้องที่ถูกต้อง

## การอนุมัติ Exec

Matrix สามารถทำหน้าที่เป็นไคลเอนต์การอนุมัติแบบเนทีฟได้ กำหนดค่าภายใต้ `channels.matrix.execApprovals` (หรือ `channels.matrix.accounts.<account>.execApprovals` สำหรับการทับค่าต่อบัญชี):

- `enabled`: ส่งการอนุมัติผ่านพรอมป์เนทีฟของ Matrix เมื่อไม่ได้ตั้งค่าหรือเป็น `"auto"` Matrix จะเปิดใช้อัตโนมัติเมื่อสามารถแปลงผู้อนุมัติได้อย่างน้อยหนึ่งราย ตั้ง `false` เพื่อปิดใช้งานอย่างชัดเจน
- `approvers`: ID ผู้ใช้ Matrix (`@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอ exec ไม่บังคับ - ย้อนกลับไปใช้ `channels.matrix.dm.allowFrom`
- `target`: ตำแหน่งที่ส่งพรอมป์ `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ `"channel"` ส่งไปยังห้อง Matrix หรือ DM ต้นทาง `"both"` ส่งไปทั้งสองที่
- `agentFilter` / `sessionFilter`: allowlist แบบไม่บังคับสำหรับเอเจนต์/เซสชันที่จะทริกเกอร์การส่งผ่าน Matrix

การอนุญาตแตกต่างกันเล็กน้อยระหว่างชนิดการอนุมัติ:

- **การอนุมัติ Exec** ใช้ `execApprovals.approvers` และย้อนกลับไปใช้ `dm.allowFrom`
- **การอนุมัติ Plugin** อนุญาตผ่าน `dm.allowFrom` เท่านั้น

ทั้งสองชนิดใช้ทางลัดรีแอ็กชัน Matrix และการอัปเดตข้อความร่วมกัน ผู้อนุมัติจะเห็นทางลัดรีแอ็กชันบนข้อความอนุมัติหลัก:

- `✅` อนุญาตหนึ่งครั้ง
- `❌` ปฏิเสธ
- `♾️` อนุญาตเสมอ (เมื่อ policy exec ที่มีผลอนุญาต)

คำสั่งสแลชสำรอง: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`

เฉพาะผู้อนุมัติที่แปลงค่าได้เท่านั้นที่สามารถอนุมัติหรือปฏิเสธได้ การส่งผ่านช่องทางสำหรับการอนุมัติ exec รวมข้อความคำสั่งไว้ด้วย - เปิดใช้ `channel` หรือ `both` เฉพาะในห้องที่เชื่อถือได้

ที่เกี่ยวข้อง: [การอนุมัติ Exec](/th/tools/exec-approvals)

## คำสั่งสแลช

คำสั่งสแลช (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` เป็นต้น) ทำงานได้โดยตรงใน DM ในห้อง OpenClaw ยังจดจำคำสั่งที่นำหน้าด้วยการกล่าวถึง Matrix ของบอตเองด้วย ดังนั้น `@bot:server /new` จะทริกเกอร์เส้นทางคำสั่งโดยไม่ต้องใช้ regex การกล่าวถึงแบบกำหนดเอง วิธีนี้ทำให้บอตตอบสนองต่อโพสต์แบบห้อง `@mention /command` ที่ Element และไคลเอนต์คล้ายกันปล่อยออกมาเมื่อผู้ใช้เติมชื่อบอตด้วยแท็บก่อนพิมพ์คำสั่ง

กฎการอนุญาตยังคงมีผล: ผู้ส่งคำสั่งต้องผ่านนโยบาย allowlist/เจ้าของของ DM หรือห้องเดียวกันกับข้อความธรรมดา

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

- ค่า `channels.matrix` ระดับบนสุดทำหน้าที่เป็นค่าเริ่มต้นสำหรับบัญชีที่มีชื่อ เว้นแต่บัญชีนั้นจะเขียนทับค่าเหล่านั้น
- จำกัดขอบเขตรายการห้องที่สืบทอดมาให้ใช้กับบัญชีเฉพาะด้วย `groups.<room>.account` รายการที่ไม่มี `account` จะถูกใช้ร่วมกันข้ามบัญชี; `account: "default"` ยังใช้ได้เมื่อกำหนดค่าบัญชีเริ่มต้นไว้ที่ระดับบนสุด

**การเลือกบัญชีเริ่มต้น:**

- ตั้งค่า `defaultAccount` เพื่อเลือกบัญชีที่มีชื่อซึ่งการกำหนดเส้นทางโดยนัย การตรวจสอบ และคำสั่ง CLI จะเลือกใช้เป็นหลัก
- หากคุณมีหลายบัญชีและมีบัญชีหนึ่งชื่อว่า `default` จริง ๆ OpenClaw จะใช้บัญชีนั้นโดยนัยแม้ไม่ได้ตั้งค่า `defaultAccount`
- หากคุณมีบัญชีที่มีชื่อหลายบัญชีและไม่ได้เลือกค่าเริ่มต้น คำสั่ง CLI จะไม่เดาเอง - ให้ตั้งค่า `defaultAccount` หรือส่ง `--account <id>`
- บล็อก `channels.matrix.*` ระดับบนสุดจะถูกถือเป็นบัญชี `default` โดยนัยเฉพาะเมื่อการยืนยันตัวตนครบถ้วน (`homeserver` + `accessToken` หรือ `homeserver` + `userId` + `password`) บัญชีที่มีชื่อยังคงค้นพบได้จาก `homeserver` + `userId` เมื่อข้อมูลรับรองที่แคชไว้ครอบคลุมการยืนยันตัวตนแล้ว

**การยกระดับ:**

- เมื่อ OpenClaw ยกระดับค่ากำหนดแบบบัญชีเดียวเป็นหลายบัญชีระหว่างการซ่อมแซมหรือการตั้งค่า ระบบจะรักษาบัญชีที่มีชื่อเดิมไว้หากมีอยู่ หรือหาก `defaultAccount` ชี้ไปยังบัญชีหนึ่งอยู่แล้ว เฉพาะคีย์การยืนยันตัวตน/บูตสแตรปของ Matrix เท่านั้นที่จะย้ายเข้าไปในบัญชีที่ยกระดับ; คีย์นโยบายการส่งที่ใช้ร่วมกันจะยังอยู่ที่ระดับบนสุด

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบหลายบัญชีที่ใช้ร่วมกัน

## homeserver ส่วนตัว/LAN

โดยค่าเริ่มต้น OpenClaw จะบล็อก homeserver ของ Matrix ที่เป็นส่วนตัว/ภายในเพื่อป้องกัน SSRF เว้นแต่คุณจะเลือกใช้อย่างชัดเจนต่อบัญชี

หาก homeserver ของคุณรันบน localhost, IP ของ LAN/Tailscale หรือชื่อโฮสต์ภายใน ให้เปิดใช้
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

ตัวอย่างการตั้งค่า CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

การเลือกใช้นี้อนุญาตเฉพาะปลายทางส่วนตัว/ภายในที่เชื่อถือได้เท่านั้น homeserver สาธารณะแบบไม่เข้ารหัส เช่น
`http://matrix.example.org:8008` จะยังถูกบล็อก ควรใช้ `https://` ทุกครั้งที่เป็นไปได้

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

บัญชีที่มีชื่อสามารถเขียนทับค่าเริ่มต้นระดับบนสุดได้ด้วย `channels.matrix.accounts.<id>.proxy`
OpenClaw ใช้การตั้งค่าพร็อกซีเดียวกันสำหรับทราฟฟิก Matrix ขณะรันไทม์และการตรวจสอบสถานะบัญชี

## การแก้ไขเป้าหมาย

Matrix ยอมรับรูปแบบเป้าหมายเหล่านี้ในทุกจุดที่ OpenClaw ขอเป้าหมายเป็นห้องหรือผู้ใช้:

- ผู้ใช้: `@user:server`, `user:@user:server` หรือ `matrix:user:@user:server`
- ห้อง: `!room:server`, `room:!room:server` หรือ `matrix:room:!room:server`
- นามแฝง: `#alias:server`, `channel:#alias:server` หรือ `matrix:channel:#alias:server`

ID ห้องของ Matrix แยกตัวพิมพ์เล็กและใหญ่ ใช้ตัวพิมพ์ของ ID ห้องให้ตรงตาม Matrix
เมื่อกำหนดค่าเป้าหมายการส่งที่ชัดเจน งาน Cron การผูก หรือรายการที่อนุญาต
OpenClaw เก็บคีย์เซสชันภายในให้เป็นรูปแบบบัญญัติสำหรับการจัดเก็บ ดังนั้นคีย์ตัวพิมพ์เล็กเหล่านั้น
จึงไม่ใช่แหล่งอ้างอิงที่เชื่อถือได้สำหรับ ID การส่งของ Matrix

การค้นหาไดเรกทอรีแบบสดใช้บัญชี Matrix ที่เข้าสู่ระบบอยู่:

- การค้นหาผู้ใช้จะคิวรีไดเรกทอรีผู้ใช้ของ Matrix บน homeserver นั้น
- การค้นหาห้องยอมรับ ID ห้องและนามแฝงที่ชัดเจนโดยตรง การค้นหาชื่อห้องที่เข้าร่วมแล้วเป็นแบบพยายามให้ดีที่สุด และใช้กับรายการห้องที่อนุญาตขณะรันไทม์เฉพาะเมื่อกำหนด `dangerouslyAllowNameMatching: true`
- หากไม่สามารถแก้ชื่อห้องเป็น ID หรือนามแฝงได้ ชื่อนั้นจะถูกละเว้นในการแก้ไขรายการที่อนุญาตขณะรันไทม์

## ข้อมูลอ้างอิงการกำหนดค่า

ฟิลด์ผู้ใช้แบบรายการที่อนุญาต (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) ยอมรับ ID ผู้ใช้ Matrix แบบเต็ม (ปลอดภัยที่สุด) รายการผู้ใช้ที่ไม่ใช่ ID จะถูกละเว้นโดยค่าเริ่มต้น หากคุณตั้งค่า `dangerouslyAllowNameMatching: true` ชื่อที่แสดงในไดเรกทอรี Matrix ที่ตรงกันพอดีจะถูกแก้ไขตอนเริ่มทำงานและทุกครั้งที่รายการที่อนุญาตเปลี่ยนระหว่างที่มอนิเตอร์กำลังรัน; รายการที่แก้ไขไม่ได้จะถูกละเว้นขณะรันไทม์

คีย์รายการห้องที่อนุญาต (`groups`, `rooms` แบบเดิม) ควรเป็น ID ห้องหรือนามแฝง คีย์ที่เป็นชื่อห้องธรรมดาจะถูกละเว้นโดยค่าเริ่มต้น; `dangerouslyAllowNameMatching: true` จะเปิดใช้การค้นหาแบบพยายามให้ดีที่สุดกับชื่อห้องที่เข้าร่วมแล้วอีกครั้ง

### บัญชีและการเชื่อมต่อ

- `enabled`: เปิดหรือปิดใช้งานช่องทาง
- `name`: ป้ายชื่อแสดงผลเสริมสำหรับบัญชี
- `defaultAccount`: ID บัญชีที่ต้องการเมื่อกำหนดค่าบัญชี Matrix หลายบัญชี
- `accounts`: การเขียนทับค่าต่อบัญชีแบบมีชื่อ ค่า `channels.matrix` ระดับบนสุดจะถูกสืบทอดเป็นค่าเริ่มต้น
- `homeserver`: URL ของ homeserver เช่น `https://matrix.example.org`
- `network.dangerouslyAllowPrivateNetwork`: อนุญาตให้บัญชีนี้เชื่อมต่อกับ `localhost`, IP ของ LAN/Tailscale หรือชื่อโฮสต์ภายใน
- `proxy`: URL พร็อกซี HTTP(S) เสริมสำหรับทราฟฟิก Matrix รองรับการเขียนทับต่อบัญชี
- `userId`: ID ผู้ใช้ Matrix แบบเต็ม (`@bot:example.org`)
- `accessToken`: โทเคนเข้าถึงสำหรับการยืนยันตัวตนแบบใช้โทเคน รองรับค่าข้อความธรรมดาและ SecretRef ผ่านผู้ให้บริการ env/file/exec ([การจัดการความลับ](/th/gateway/secrets))
- `password`: รหัสผ่านสำหรับการเข้าสู่ระบบแบบใช้รหัสผ่าน รองรับค่าข้อความธรรมดาและ SecretRef
- `deviceId`: ID อุปกรณ์ Matrix ที่ชัดเจน
- `deviceName`: ชื่อแสดงผลของอุปกรณ์ที่ใช้ตอนเข้าสู่ระบบด้วยรหัสผ่าน
- `avatarUrl`: URL รูปประจำตัวตนเองที่จัดเก็บไว้สำหรับการซิงก์โปรไฟล์และการอัปเดต `profile set`
- `initialSyncLimit`: จำนวนเหตุการณ์สูงสุดที่ดึงระหว่างการซิงก์ตอนเริ่มทำงาน

### การเข้ารหัส

- `encryption`: เปิดใช้ E2EE ค่าเริ่มต้น: `false`
- `startupVerification`: `"if-unverified"` (ค่าเริ่มต้นเมื่อเปิด E2EE) หรือ `"off"` ขอการยืนยันตัวตนเองอัตโนมัติเมื่อเริ่มทำงานหากอุปกรณ์นี้ยังไม่ได้รับการยืนยัน
- `startupVerificationCooldownHours`: ระยะพักก่อนคำขอเริ่มทำงานอัตโนมัติครั้งถัดไป ค่าเริ่มต้น: `24`

### การเข้าถึงและนโยบาย

- `groupPolicy`: `"open"`, `"allowlist"` หรือ `"disabled"` ค่าเริ่มต้น: `"allowlist"`
- `groupAllowFrom`: รายการ ID ผู้ใช้ที่อนุญาตสำหรับทราฟฟิกห้อง
- `dm.enabled`: เมื่อเป็น `false` จะละเว้น DM ทั้งหมด ค่าเริ่มต้น: `true`
- `dm.policy`: `"pairing"` (ค่าเริ่มต้น), `"allowlist"`, `"open"` หรือ `"disabled"` ใช้หลังจากบอตเข้าร่วมห้องและจำแนกห้องเป็น DM แล้ว; ไม่ส่งผลต่อการจัดการคำเชิญ
- `dm.allowFrom`: รายการ ID ผู้ใช้ที่อนุญาตสำหรับทราฟฟิก DM
- `dm.sessionScope`: `"per-user"` (ค่าเริ่มต้น) หรือ `"per-room"`
- `dm.threadReplies`: การเขียนทับเฉพาะ DM สำหรับการตอบกลับแบบเธรด (`"off"`, `"inbound"`, `"always"`)
- `allowBots`: ยอมรับข้อความจากบัญชีบอต Matrix อื่นที่กำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `allowlistOnly`: เมื่อเป็น `true` จะบังคับนโยบาย DM ที่ใช้งานอยู่ทั้งหมด (ยกเว้น `"disabled"`) และนโยบายกลุ่ม `"open"` ให้เป็น `"allowlist"` ไม่เปลี่ยนนโยบาย `"disabled"`
- `dangerouslyAllowNameMatching`: เมื่อเป็น `true` จะอนุญาตการค้นหาไดเรกทอรีชื่อแสดงผลของ Matrix สำหรับรายการผู้ใช้ที่อนุญาต และการค้นหาชื่อห้องที่เข้าร่วมแล้วสำหรับคีย์รายการห้องที่อนุญาต ควรใช้ ID `@user:server` แบบเต็มและ ID ห้องหรือนามแฝง
- `autoJoin`: `"always"`, `"allowlist"` หรือ `"off"` ค่าเริ่มต้น: `"off"` ใช้กับคำเชิญ Matrix ทุกประเภท รวมถึงคำเชิญแบบ DM
- `autoJoinAllowlist`: ห้อง/นามแฝงที่อนุญาตเมื่อ `autoJoin` เป็น `"allowlist"` รายการนามแฝงจะถูกแก้ไขกับ homeserver ไม่ใช่กับสถานะที่ห้องซึ่งเชิญกล่าวอ้าง
- `contextVisibility`: การมองเห็นบริบทเสริม (`"all"` เป็นค่าเริ่มต้น, `"allowlist"`, `"allowlist_quote"`)

### พฤติกรรมการตอบกลับ

- `replyToMode`: `"off"`, `"first"`, `"all"` หรือ `"batched"`
- `threadReplies`: `"off"`, `"inbound"` หรือ `"always"`
- `threadBindings`: การเขียนทับต่อช่องทางสำหรับการกำหนดเส้นทางเซสชันแบบผูกกับเธรดและวงจรชีวิต
- `streaming`: `"off"` (ค่าเริ่มต้น), `"partial"`, `"quiet"` หรือรูปแบบออบเจ็กต์ `{ mode, preview: { toolProgress } }` `true` ↔ `"partial"`, `false` ↔ `"off"`
- `blockStreaming`: เมื่อเป็น `true` บล็อกผู้ช่วยที่เสร็จแล้วจะถูกเก็บเป็นข้อความความคืบหน้าแยกต่างหาก
- `markdown`: ค่ากำหนดการเรนเดอร์ Markdown เสริมสำหรับข้อความขาออก
- `responsePrefix`: สตริงเสริมที่เติมนำหน้าการตอบกลับขาออก
- `textChunkLimit`: ขนาดชิ้นส่วนขาออกเป็นจำนวนอักขระเมื่อ `chunkMode: "length"` ค่าเริ่มต้น: `4000`
- `chunkMode`: `"length"` (ค่าเริ่มต้น แบ่งตามจำนวนอักขระ) หรือ `"newline"` (แบ่งที่ขอบเขตบรรทัด)
- `historyLimit`: จำนวนข้อความห้องล่าสุดที่รวมเป็น `InboundHistory` เมื่อข้อความในห้องกระตุ้น agent ถอยกลับไปใช้ `messages.groupChat.historyLimit`; ค่าเริ่มต้นที่มีผลคือ `0` (ปิดใช้งาน)
- `mediaMaxMb`: เพดานขนาดสื่อเป็น MB สำหรับการส่งขาออกและการประมวลผลขาเข้า

### การตั้งค่ารีแอ็กชัน

- `ackReaction`: การเขียนทับรีแอ็กชัน ack สำหรับช่องทาง/บัญชีนี้
- `ackReactionScope`: การเขียนทับขอบเขต (`"group-mentions"` เป็นค่าเริ่มต้น, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`)
- `reactionNotifications`: โหมดการแจ้งเตือนรีแอ็กชันขาเข้า (`"own"` เป็นค่าเริ่มต้น, `"off"`)

### เครื่องมือและการเขียนทับต่อห้อง

- `actions`: การควบคุมเครื่องมือต่อแอ็กชัน (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`)
- `groups`: แผนผังนโยบายต่อห้อง ตัวตนเซสชันใช้ ID ห้องที่เสถียรหลังการแก้ไข (`rooms` เป็นนามแฝงแบบเดิม)
  - `groups.<room>.account`: จำกัดรายการห้องที่สืบทอดมาหนึ่งรายการให้ใช้กับบัญชีเฉพาะ
  - `groups.<room>.allowBots`: การเขียนทับต่อห้องของการตั้งค่าระดับช่องทาง (`true` หรือ `"mentions"`)
  - `groups.<room>.users`: รายการผู้ส่งที่อนุญาตต่อห้อง
  - `groups.<room>.tools`: การเขียนทับอนุญาต/ปฏิเสธเครื่องมือต่อห้อง
  - `groups.<room>.autoReply`: การเขียนทับการควบคุมด้วยการกล่าวถึงต่อห้อง `true` ปิดข้อกำหนดการกล่าวถึงสำหรับห้องนั้น; `false` บังคับให้เปิดกลับมา
  - `groups.<room>.skills`: ตัวกรอง Skills ต่อห้อง
  - `groups.<room>.systemPrompt`: ส่วนย่อยพรอมป์ระบบต่อห้อง

### การตั้งค่าการอนุมัติ exec

- `execApprovals.enabled`: ส่งการอนุมัติ exec ผ่านพรอมป์แบบเนทีฟของ Matrix
- `execApprovals.approvers`: ID ผู้ใช้ Matrix ที่ได้รับอนุญาตให้อนุมัติ ถอยกลับไปใช้ `dm.allowFrom`
- `execApprovals.target`: `"dm"` (ค่าเริ่มต้น), `"channel"` หรือ `"both"`
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: รายการ agent/เซสชันที่อนุญาตแบบเสริมสำหรับการส่ง

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) - ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
