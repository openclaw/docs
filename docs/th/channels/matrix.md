---
read_when:
    - การตั้งค่า Matrix ใน OpenClaw
    - การกำหนดค่า Matrix E2EE และการตรวจสอบยืนยัน
summary: สถานะการรองรับ Matrix การตั้งค่า และตัวอย่างการกำหนดค่า
title: Matrix
x-i18n:
    generated_at: "2026-05-11T20:21:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0187f7ffa068e5db07e39581f718e3e9aab23f778fffc5cca14e43664a6ee10a
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

สเปก Plugin แบบย่อจะลองใช้ ClawHub ก่อน จากนั้นจึง fallback ไปที่ npm หากต้องการบังคับแหล่ง registry ให้ใช้ `openclaw plugins install clawhub:@openclaw/matrix` หรือ `openclaw plugins install npm:@openclaw/matrix`

จาก checkout ในเครื่อง:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` จะลงทะเบียนและเปิดใช้ Plugin ดังนั้นจึงไม่จำเป็นต้องมีขั้นตอน `openclaw plugins enable matrix` แยกต่างหาก Plugin ยังจะไม่ทำอะไรจนกว่าคุณจะกำหนดค่าช่องทางด้านล่าง ดู [Plugin](/th/tools/plugin) สำหรับพฤติกรรมทั่วไปของ Plugin และกฎการติดตั้ง

## ตั้งค่า

1. สร้างบัญชี Matrix บน homeserver ของคุณ
2. กำหนดค่า `channels.matrix` ด้วย `homeserver` + `accessToken` หรือ `homeserver` + `userId` + `password`
3. รีสตาร์ท Gateway
4. เริ่ม DM กับบอต หรือเชิญบอตเข้าห้อง (ดู [auto-join](#auto-join) - คำเชิญใหม่จะเข้ามาได้ก็ต่อเมื่อ `autoJoin` อนุญาต)

### การตั้งค่าแบบโต้ตอบ

```bash
openclaw channels add
openclaw configure --section channels
```

ตัวช่วยตั้งค่าจะถาม: URL ของ homeserver, วิธีรับรองความถูกต้อง (access token หรือรหัสผ่าน), ID ผู้ใช้ (เฉพาะการรับรองความถูกต้องด้วยรหัสผ่าน), ชื่ออุปกรณ์ที่ไม่บังคับ, ต้องการเปิดใช้ E2EE หรือไม่ และต้องการกำหนดค่าการเข้าถึงห้องกับ auto-join หรือไม่

หากมี env vars `MATRIX_*` ที่ตรงกันอยู่แล้ว และบัญชีที่เลือกไม่มี auth ที่บันทึกไว้ ตัวช่วยตั้งค่าจะเสนอทางลัด env-var หากต้องการแปลงชื่อห้องก่อนบันทึก allowlist ให้เรียกใช้ `openclaw channels resolve --channel matrix "Project Room"` เมื่อเปิดใช้ E2EE ตัวช่วยตั้งค่าจะเขียน config และเรียกใช้ bootstrap เดียวกับ [`openclaw matrix encryption setup`](#encryption-and-verification)

### Config ขั้นต่ำ

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

แบบใช้รหัสผ่าน (โทเค็นจะถูกแคชหลังจากเข้าสู่ระบบครั้งแรก):

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

### Auto-join

`channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` เมื่อใช้ค่าเริ่มต้น บอตจะไม่ปรากฏในห้องใหม่หรือ DM จากคำเชิญใหม่จนกว่าคุณจะเข้าร่วมด้วยตนเอง

OpenClaw ไม่สามารถบอกได้ในเวลาที่ได้รับคำเชิญว่าห้องที่ถูกเชิญเป็น DM หรือกลุ่ม ดังนั้นคำเชิญทั้งหมด รวมถึงคำเชิญแบบ DM จะผ่าน `autoJoin` ก่อน `dm.policy` จะมีผลภายหลังเท่านั้น หลังจากบอตเข้าร่วมและห้องถูกจัดประเภทแล้ว

<Warning>
ตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` เพื่อจำกัดว่าบอตยอมรับคำเชิญใด หรือ `autoJoin: "always"` เพื่อยอมรับทุกคำเชิญ

`autoJoinAllowlist` ยอมรับเฉพาะเป้าหมายที่เสถียร: `!roomId:server`, `#alias:server` หรือ `*` ชื่อห้องธรรมดาจะถูกปฏิเสธ รายการ alias จะถูกแปลงเทียบกับ homeserver ไม่ใช่เทียบกับสถานะที่ห้องที่เชิญอ้างไว้
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

ควรเติม DM และ allowlist ของห้องด้วย ID ที่เสถียร:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): ใช้ `@user:server` ชื่อที่แสดงจะถูกละเว้นตามค่าเริ่มต้นเพราะเปลี่ยนแปลงได้ ตั้งค่า `dangerouslyAllowNameMatching: true` เฉพาะเมื่อคุณต้องการความเข้ากันได้กับรายการชื่อที่แสดงอย่างชัดเจน
- คีย์ allowlist ของห้อง (`groups`, `rooms` เดิม): ใช้ `!room:server` หรือ `#alias:server` ชื่อห้องธรรมดาจะถูกละเว้นตามค่าเริ่มต้น ตั้งค่า `dangerouslyAllowNameMatching: true` เฉพาะเมื่อคุณต้องการความเข้ากันได้กับการค้นหาชื่อห้องที่เข้าร่วมแล้วอย่างชัดเจน
- allowlist ของคำเชิญ (`autoJoinAllowlist`): ใช้ `!room:server`, `#alias:server` หรือ `*` ชื่อห้องธรรมดาจะถูกปฏิเสธ

### การทำให้ Account ID เป็นมาตรฐาน

ตัวช่วยตั้งค่าจะแปลงชื่อที่อ่านง่ายเป็น account ID ที่เป็นมาตรฐาน ตัวอย่างเช่น `Ops Bot` จะกลายเป็น `ops-bot` เครื่องหมายวรรคตอนจะถูก escape ในชื่อ env-var แบบ scoped เพื่อไม่ให้สองบัญชีชนกัน: `-` → `_X2D_` ดังนั้น `ops-prod` จึงแมปกับ `MATRIX_OPS_X2D_PROD_*`

### Credential ที่แคชไว้

Matrix เก็บ credential ที่แคชไว้ใต้ `~/.openclaw/credentials/matrix/`:

- บัญชีเริ่มต้น: `credentials.json`
- บัญชีที่มีชื่อ: `credentials-<account>.json`

เมื่อมี credential ที่แคชไว้ในตำแหน่งนั้น OpenClaw จะถือว่า Matrix ถูกกำหนดค่าแล้ว แม้ access token จะไม่อยู่ในไฟล์ config ก็ตาม ซึ่งครอบคลุมการตั้งค่า, `openclaw doctor` และการ probe สถานะช่องทาง

### Environment variables

ใช้เมื่อไม่ได้ตั้งค่าคีย์ config ที่เทียบเท่า บัญชีเริ่มต้นใช้ชื่อที่ไม่มี prefix ส่วนบัญชีที่มีชื่อใช้ account ID แทรกก่อน suffix

| บัญชีเริ่มต้น         | บัญชีที่มีชื่อ (`<ID>` คือ account ID ที่เป็นมาตรฐาน) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

สำหรับบัญชี `ops` ชื่อจะกลายเป็น `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` และอื่นๆ env vars ของ recovery-key จะถูกอ่านโดย flow ของ CLI ที่รองรับการกู้คืน (`verify backup restore`, `verify device`, `verify bootstrap`) เมื่อคุณ pipe คีย์เข้ามาผ่าน `--recovery-key-stdin`

ไม่สามารถตั้งค่า `MATRIX_HOMESERVER` จาก workspace `.env` ได้ ดู [ไฟล์ Workspace `.env`](/th/gateway/security)

## ตัวอย่าง Configuration

Baseline ที่ใช้งานได้จริงพร้อมการจับคู่ DM, allowlist ของห้อง และ E2EE:

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

## พรีวิว Streaming

การ streaming การตอบกลับของ Matrix เป็นแบบ opt-in `streaming` ควบคุมวิธีที่ OpenClaw ส่งคำตอบของผู้ช่วยที่กำลังดำเนินอยู่ ส่วน `blockStreaming` ควบคุมว่าแต่ละบล็อกที่เสร็จแล้วจะถูกเก็บเป็นข้อความ Matrix ของตัวเองหรือไม่

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

หากต้องการคงพรีวิวคำตอบสดไว้ แต่ซ่อนบรรทัดเครื่องมือ/ความคืบหน้าชั่วคราว ให้ใช้รูปแบบ object:

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
| `"off"` (ค่าเริ่มต้น) | รอคำตอบเต็ม แล้วส่งครั้งเดียว `true` ↔ `"partial"`, `false` ↔ `"off"`                                                                                               |
| `"partial"`       | แก้ไขข้อความตัวอักษรปกติหนึ่งข้อความในที่เดิมขณะที่โมเดลเขียนบล็อกปัจจุบัน ไคลเอนต์ Matrix ทั่วไปอาจแจ้งเตือนตอนพรีวิวแรก ไม่ใช่ตอนแก้ไขสุดท้าย              |
| `"quiet"`         | เหมือนกับ `"partial"` แต่ข้อความเป็น notice ที่ไม่แจ้งเตือน ผู้รับจะได้รับการแจ้งเตือนก็ต่อเมื่อกฎ push รายผู้ใช้ตรงกับการแก้ไขที่ finalized แล้ว (ดูด้านล่าง) |

`blockStreaming` เป็นอิสระจาก `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (ค่าเริ่มต้น)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | ร่างสดสำหรับบล็อกปัจจุบัน บล็อกที่เสร็จแล้วถูกเก็บเป็นข้อความ | ร่างสดสำหรับบล็อกปัจจุบัน finalized ในที่เดิม |
| `"off"`                 | ข้อความ Matrix ที่แจ้งเตือนหนึ่งข้อความต่อบล็อกที่เสร็จแล้ว                     | ข้อความ Matrix ที่แจ้งเตือนหนึ่งข้อความสำหรับคำตอบเต็ม      |

หมายเหตุ:

- หากพรีวิวโตเกินขีดจำกัดขนาดต่อ event ของ Matrix OpenClaw จะหยุด preview streaming และ fallback ไปเป็นการส่งเฉพาะผลลัพธ์สุดท้าย
- คำตอบที่เป็นสื่อจะส่งไฟล์แนบตามปกติเสมอ หากไม่สามารถนำพรีวิวเก่ากลับมาใช้ซ้ำได้อย่างปลอดภัยอีกต่อไป OpenClaw จะ redact พรีวิวนั้นก่อนส่งคำตอบสื่อสุดท้าย
- การอัปเดตพรีวิวความคืบหน้าของเครื่องมือเปิดใช้ตามค่าเริ่มต้นเมื่อ Matrix preview streaming ทำงานอยู่ ตั้งค่า `streaming.preview.toolProgress: false` เพื่อคงการแก้ไขพรีวิวสำหรับข้อความคำตอบไว้ แต่ให้ความคืบหน้าของเครื่องมืออยู่บนเส้นทางการส่งปกติ
- การแก้ไขพรีวิวมีค่าใช้จ่ายเป็น Matrix API calls เพิ่มเติม ปล่อย `streaming: "off"` ไว้หากคุณต้องการ profile rate-limit ที่ระมัดระวังที่สุด

## Metadata การอนุมัติ

พรอมป์การอนุมัติแบบ native ของ Matrix เป็น event `m.room.message` ปกติที่มีเนื้อหา event แบบกำหนดเองเฉพาะ OpenClaw ใต้ `com.openclaw.approval` Matrix อนุญาตคีย์ event-content แบบกำหนดเอง ดังนั้นไคลเอนต์ทั่วไปยังคงแสดง body ข้อความ ขณะที่ไคลเอนต์ที่รองรับ OpenClaw สามารถอ่าน id การอนุมัติแบบมีโครงสร้าง, ชนิด, สถานะ, การตัดสินใจที่มีให้เลือก และรายละเอียด exec/Plugin ได้

เมื่อพรอมป์การอนุมัติยาวเกินกว่าหนึ่ง event ของ Matrix OpenClaw จะแบ่งข้อความที่มองเห็นได้เป็นชิ้นๆ และแนบ `com.openclaw.approval` ไว้กับชิ้นแรกเท่านั้น รีแอ็กชันสำหรับการตัดสินใจ allow/deny จะผูกกับ event แรกนั้น ดังนั้นพรอมป์ยาวจึงยังคงเป้าหมายการอนุมัติเดียวกับพรอมป์แบบ event เดียว

### กฎ push แบบ self-hosted สำหรับพรีวิว finalized แบบ quiet

`streaming: "quiet"` จะแจ้งเตือนผู้รับเฉพาะเมื่อบล็อกหรือเทิร์น finalized แล้วเท่านั้น กฎ push รายผู้ใช้ต้องตรงกับเครื่องหมายพรีวิว finalized ดู [กฎ push ของ Matrix สำหรับพรีวิวแบบ quiet](/th/channels/matrix-push-rules) สำหรับสูตรทั้งหมด (โทเค็นผู้รับ, การตรวจ pusher, การติดตั้งกฎ, หมายเหตุราย homeserver)

## ห้อง Bot-to-bot

ตามค่าเริ่มต้น ข้อความ Matrix จากบัญชี Matrix ของ OpenClaw อื่นที่กำหนดค่าไว้จะถูกละเว้น

ใช้ `allowBots` เมื่อคุณตั้งใจต้องการทราฟฟิก Matrix ระหว่าง agent:

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
- `allowBots: "mentions"` ยอมรับข้อความเหล่านั้นเฉพาะเมื่อข้อความกล่าวถึงบอตนี้อย่างมองเห็นได้ในห้อง DM ยังอนุญาตอยู่
- `groups.<room>.allowBots` override การตั้งค่าระดับบัญชีสำหรับห้องหนึ่งห้อง
- OpenClaw ยังละเว้นข้อความจาก ID ผู้ใช้ Matrix เดียวกันเพื่อหลีกเลี่ยง loop การตอบตัวเอง
- Matrix ไม่เปิดเผย flag บอตแบบ native ที่นี่ OpenClaw ถือว่า "เขียนโดยบอต" หมายถึง "ส่งโดยบัญชี Matrix อื่นที่กำหนดค่าไว้บน Gateway OpenClaw นี้"

ใช้ allowlist ของห้องที่เข้มงวดและข้อกำหนดการกล่าวถึงเมื่อเปิดใช้ทราฟฟิก bot-to-bot ในห้องที่แชร์กัน

## การเข้ารหัสและการตรวจสอบความถูกต้อง

ในห้องที่เข้ารหัส (E2EE) เหตุการณ์รูปภาพขาออกจะใช้ `thumbnail_file` เพื่อให้ตัวอย่างรูปภาพถูกเข้ารหัสควบคู่ไปกับไฟล์แนบฉบับเต็ม ห้องที่ไม่ได้เข้ารหัสยังคงใช้ `thumbnail_url` แบบปกติ ไม่จำเป็นต้องกำหนดค่าใดๆ - plugin จะตรวจจับสถานะ E2EE โดยอัตโนมัติ

คำสั่ง `openclaw matrix` ทั้งหมดรองรับ `--verbose` (การวินิจฉัยแบบเต็ม), `--json` (เอาต์พุตที่เครื่องอ่านได้), และ `--account <id>` (การตั้งค่าหลายบัญชี) โดยค่าเริ่มต้น เอาต์พุตจะกระชับพร้อมการบันทึกภายใน SDK แบบเงียบ ตัวอย่างด้านล่างแสดงรูปแบบมาตรฐาน ให้เพิ่มแฟล็กตามต้องการ

### เปิดใช้งานการเข้ารหัส

```bash
openclaw matrix encryption setup
```

บูตสแตรปที่จัดเก็บความลับและ cross-signing สร้างการสำรอง room-key หากจำเป็น จากนั้นพิมพ์สถานะและขั้นตอนถัดไป แฟล็กที่มีประโยชน์:

- `--recovery-key <key>` ใช้ recovery key ก่อนการบูตสแตรป (แนะนำให้ใช้รูปแบบ stdin ที่ระบุไว้ด้านล่าง)
- `--force-reset-cross-signing` ละทิ้งตัวตน cross-signing ปัจจุบันและสร้างใหม่ (ใช้เมื่อจงใจเท่านั้น)

สำหรับบัญชีใหม่ ให้เปิดใช้งาน E2EE ตอนสร้างบัญชี:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` เป็น alias ของ `--enable-e2ee`

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

`verify status` รายงานสัญญาณความเชื่อถืออิสระสามรายการ (`--verbose` จะแสดงทั้งหมด):

- `Locally trusted`: เชื่อถือโดยไคลเอนต์นี้เท่านั้น
- `Cross-signing verified`: SDK รายงานการตรวจสอบยืนยันผ่าน cross-signing
- `Signed by owner`: ลงนามโดยคีย์ self-signing ของคุณเอง (เพื่อการวินิจฉัยเท่านั้น)

`Verified by owner` จะกลายเป็น `yes` เฉพาะเมื่อ `Cross-signing verified` เป็น `yes` เท่านั้น ความเชื่อถือภายในเครื่องหรือลายเซ็นของเจ้าของเพียงอย่างเดียวไม่เพียงพอ

`--allow-degraded-local-state` ส่งคืนการวินิจฉัยแบบดีที่สุดเท่าที่ทำได้โดยไม่ต้องเตรียมบัญชี Matrix ก่อน มีประโยชน์สำหรับการตรวจสอบแบบออฟไลน์หรือที่กำหนดค่าไว้บางส่วน

### ตรวจสอบยืนยันอุปกรณ์นี้ด้วย recovery key

recovery key เป็นข้อมูลละเอียดอ่อน - ให้ส่งผ่าน stdin แทนการส่งบนบรรทัดคำสั่ง ตั้งค่า `MATRIX_RECOVERY_KEY` (หรือ `MATRIX_<ID>_RECOVERY_KEY` สำหรับบัญชีที่มีชื่อ):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

คำสั่งจะรายงานสามสถานะ:

- `Recovery key accepted`: Matrix ยอมรับคีย์สำหรับที่จัดเก็บความลับหรือความเชื่อถือของอุปกรณ์
- `Backup usable`: สามารถโหลดการสำรอง room-key ด้วยวัสดุการกู้คืนที่เชื่อถือได้
- `Device verified by owner`: อุปกรณ์นี้มีความเชื่อถือตัวตน cross-signing ของ Matrix อย่างสมบูรณ์

คำสั่งจะออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อความเชื่อถือตัวตนแบบเต็มยังไม่สมบูรณ์ แม้ recovery key จะปลดล็อกวัสดุสำรองแล้วก็ตาม ในกรณีนั้น ให้ทำ self-verification ให้เสร็จจากไคลเอนต์ Matrix อื่น:

```bash
openclaw matrix verify self
```

`verify self` จะรอจนกว่า `Cross-signing verified: yes` ก่อนออกสำเร็จ ใช้ `--timeout-ms <ms>` เพื่อปรับเวลารอ

รูปแบบคีย์แบบตรงตัว `openclaw matrix verify device "<recovery-key>"` ก็รองรับเช่นกัน แต่คีย์จะถูกบันทึกไว้ในประวัติ shell ของคุณ

### บูตสแตรปหรือซ่อมแซม cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` เป็นคำสั่งซ่อมแซมและตั้งค่าสำหรับบัญชีที่เข้ารหัส ตามลำดับ คำสั่งนี้จะ:

- บูตสแตรปที่จัดเก็บความลับ โดยนำ recovery key ที่มีอยู่มาใช้ซ้ำเมื่อทำได้
- บูตสแตรป cross-signing และอัปโหลดคีย์สาธารณะที่ขาดหาย
- ทำเครื่องหมายและ cross-sign อุปกรณ์ปัจจุบัน
- สร้างการสำรอง room-key ฝั่งเซิร์ฟเวอร์หากยังไม่มีอยู่

หาก homeserver ต้องใช้ UIA เพื่ออัปโหลดคีย์ cross-signing, OpenClaw จะลองแบบไม่มีการยืนยันตัวตนก่อน จากนั้นลอง `m.login.dummy` แล้วจึงลอง `m.login.password` (ต้องใช้ `channels.matrix.password`)

แฟล็กที่มีประโยชน์:

- `--recovery-key-stdin` (ใช้คู่กับ `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) หรือ `--recovery-key <key>`
- `--force-reset-cross-signing` เพื่อละทิ้งตัวตน cross-signing ปัจจุบัน (เมื่อจงใจเท่านั้น)

### การสำรอง room-key

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` แสดงว่ามีการสำรองฝั่งเซิร์ฟเวอร์หรือไม่ และอุปกรณ์นี้ถอดรหัสได้หรือไม่ `backup restore` นำเข้า room key ที่สำรองไว้เข้าสู่ crypto store ภายในเครื่อง หาก recovery key มีอยู่บนดิสก์แล้ว คุณสามารถละ `--recovery-key-stdin` ได้

เพื่อแทนที่การสำรองที่เสียด้วย baseline ใหม่ (ยอมรับการสูญเสียประวัติเก่าที่กู้คืนไม่ได้ และยังสามารถสร้างที่จัดเก็บความลับใหม่ได้หาก secret ของการสำรองปัจจุบันโหลดไม่ได้):

```bash
openclaw matrix verify backup reset --yes
```

เพิ่ม `--rotate-recovery-key` เฉพาะเมื่อคุณตั้งใจให้ recovery key ก่อนหน้าไม่สามารถปลดล็อก baseline การสำรองใหม่ได้อีกต่อไป

### การแสดงรายการ การขอ และการตอบกลับการตรวจสอบยืนยัน

```bash
openclaw matrix verify list
```

แสดงรายการคำขอตรวจสอบยืนยันที่รอดำเนินการสำหรับบัญชีที่เลือก

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

ส่งคำขอตรวจสอบยืนยันจากบัญชี OpenClaw นี้ `--own-user` ขอ self-verification (คุณยอมรับพรอมป์ในไคลเอนต์ Matrix อื่นของผู้ใช้เดียวกัน); `--user-id`/`--device-id`/`--room-id` ระบุเป้าหมายเป็นคนอื่น ไม่สามารถใช้ `--own-user` ร่วมกับแฟล็กกำหนดเป้าหมายอื่นได้

สำหรับการจัดการวงจรชีวิตระดับล่าง - โดยทั่วไปใช้ขณะติดตามคำขอขาเข้าจากไคลเอนต์อื่น - คำสั่งเหล่านี้จะทำงานกับคำขอ `<id>` ที่ระบุ (พิมพ์โดย `verify list` และ `verify request`):

| คำสั่ง                                    | วัตถุประสงค์                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | ยอมรับคำขอขาเข้า                                           |
| `openclaw matrix verify start <id>`        | เริ่มโฟลว์ SAS                                                  |
| `openclaw matrix verify sas <id>`          | พิมพ์อีโมจิ SAS หรือทศนิยม                                     |
| `openclaw matrix verify confirm-sas <id>`  | ยืนยันว่า SAS ตรงกับสิ่งที่ไคลเอนต์อื่นแสดง            |
| `openclaw matrix verify mismatch-sas <id>` | ปฏิเสธ SAS เมื่ออีโมจิหรือทศนิยมไม่ตรงกัน              |
| `openclaw matrix verify cancel <id>`       | ยกเลิก; รับ `--reason <text>` และ `--code <matrix-code>` เป็นตัวเลือก |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, และ `cancel` ทั้งหมดรองรับ `--user-id` และ `--room-id` เป็นคำใบ้สำหรับการติดตามผล DM เมื่อการตรวจสอบยืนยันถูกผูกกับห้องข้อความโดยตรงที่ระบุ

### หมายเหตุเกี่ยวกับหลายบัญชี

หากไม่มี `--account <id>` คำสั่ง Matrix CLI จะใช้บัญชีเริ่มต้นโดยนัย หากคุณมีหลายบัญชีที่ตั้งชื่อไว้และยังไม่ได้ตั้งค่า `channels.matrix.defaultAccount` คำสั่งจะไม่เดาและจะขอให้คุณเลือก เมื่อ E2EE ถูกปิดใช้งานหรือไม่พร้อมใช้งานสำหรับบัญชีที่มีชื่อ ข้อผิดพลาดจะชี้ไปที่คีย์การกำหนดค่าของบัญชีนั้น เช่น `channels.matrix.accounts.assistant.encryption`

<AccordionGroup>
  <Accordion title="พฤติกรรมตอนเริ่มต้น">
    เมื่อใช้ `encryption: true`, `startupVerification` จะมีค่าเริ่มต้นเป็น `"if-unverified"` ตอนเริ่มต้น อุปกรณ์ที่ยังไม่ได้ตรวจสอบยืนยันจะขอ self-verification ในไคลเอนต์ Matrix อื่น โดยข้ามรายการซ้ำและใช้คูลดาวน์ (ค่าเริ่มต้นคือ 24 ชั่วโมง) ปรับด้วย `startupVerificationCooldownHours` หรือปิดใช้งานด้วย `startupVerification: "off"`

    ตอนเริ่มต้นยังรันรอบการบูตสแตรป crypto แบบระมัดระวัง ซึ่งนำที่จัดเก็บความลับและตัวตน cross-signing ปัจจุบันมาใช้ซ้ำ หากสถานะการบูตสแตรปเสีย OpenClaw จะพยายามซ่อมแซมแบบมีการป้องกันแม้ไม่มี `channels.matrix.password`; หาก homeserver ต้องใช้ password UIA ตอนเริ่มต้นจะบันทึกคำเตือนและยังคงไม่เป็นข้อผิดพลาดร้ายแรง อุปกรณ์ที่ลงนามโดยเจ้าของแล้วจะถูกรักษาไว้

    ดู [การย้าย Matrix](/th/channels/matrix-migration) สำหรับโฟลว์อัปเกรดฉบับเต็ม

  </Accordion>

  <Accordion title="การแจ้งเตือนการตรวจสอบยืนยัน">
    Matrix โพสต์การแจ้งเตือนวงจรชีวิตการตรวจสอบยืนยันลงในห้องตรวจสอบยืนยัน DM แบบเข้มงวดเป็นข้อความ `m.notice`: คำขอ, พร้อมแล้ว (พร้อมคำแนะนำ "Verify by emoji"), เริ่ม/เสร็จสิ้น, และรายละเอียด SAS (อีโมจิ/ทศนิยม) เมื่อมี

    คำขอขาเข้าจากไคลเอนต์ Matrix อื่นจะถูกติดตามและยอมรับอัตโนมัติ สำหรับ self-verification, OpenClaw จะเริ่มโฟลว์ SAS โดยอัตโนมัติและยืนยันฝั่งของตนเองเมื่อการตรวจสอบยืนยันด้วยอีโมจิพร้อมใช้งาน - คุณยังต้องเปรียบเทียบและยืนยัน "They match" ในไคลเอนต์ Matrix ของคุณ

    การแจ้งเตือนระบบการตรวจสอบยืนยันจะไม่ถูกส่งต่อไปยัง pipeline แชทของ agent

  </Accordion>

  <Accordion title="อุปกรณ์ Matrix ที่ถูกลบหรือไม่ถูกต้อง">
    หาก `verify status` ระบุว่าอุปกรณ์ปัจจุบันไม่อยู่ในรายการบน homeserver อีกต่อไป ให้สร้างอุปกรณ์ Matrix ของ OpenClaw ใหม่ สำหรับการเข้าสู่ระบบด้วยรหัสผ่าน:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    สำหรับการยืนยันตัวตนด้วยโทเคน ให้สร้าง access token ใหม่ในไคลเอนต์ Matrix หรือ UI ผู้ดูแลระบบของคุณ จากนั้นอัปเดต OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    แทนที่ `assistant` ด้วย ID บัญชีจากคำสั่งที่ล้มเหลว หรือละ `--account` สำหรับบัญชีเริ่มต้น

  </Accordion>

  <Accordion title="สุขอนามัยของอุปกรณ์">
    อุปกรณ์เก่าที่ OpenClaw จัดการไว้อาจสะสมได้ แสดงรายการและตัดออก:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE ใช้เส้นทาง crypto แบบ Rust ของ `matrix-js-sdk` อย่างเป็นทางการ โดยมี `fake-indexeddb` เป็น shim ของ IndexedDB สถานะ crypto จะคงอยู่ใน `crypto-idb-snapshot.json` (สิทธิ์ไฟล์แบบจำกัด)

    สถานะ runtime ที่เข้ารหัสอยู่ภายใต้ `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` และรวมถึง sync store, crypto store, recovery key, สแนปชอต IDB, การผูก thread, และสถานะการตรวจสอบยืนยันตอนเริ่มต้น เมื่อโทเคนเปลี่ยนแต่ตัวตนบัญชียังคงเดิม OpenClaw จะนำ root ที่มีอยู่ดีที่สุดมาใช้ซ้ำเพื่อให้สถานะก่อนหน้ายังคงมองเห็นได้

  </Accordion>
</AccordionGroup>

## การจัดการโปรไฟล์

อัปเดต self-profile ของ Matrix สำหรับบัญชีที่เลือก:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

คุณสามารถส่งทั้งสองตัวเลือกในการเรียกครั้งเดียวได้ Matrix รองรับ URL อวาตาร์ `mxc://` โดยตรง; เมื่อคุณส่ง `http://` หรือ `https://`, OpenClaw จะอัปโหลดไฟล์ก่อนและจัดเก็บ URL `mxc://` ที่แก้ไขแล้วลงใน `channels.matrix.avatarUrl` (หรือ override ต่อบัญชี)

## Thread

Matrix รองรับ thread ดั้งเดิมของ Matrix ทั้งสำหรับการตอบกลับอัตโนมัติและการส่งด้วยเครื่องมือข้อความ มีตัวควบคุมอิสระสองตัวสำหรับพฤติกรรม:

### การกำหนดเส้นทางเซสชัน (`sessionScope`)

`dm.sessionScope` กำหนดว่าห้อง DM ของ Matrix จะแมปกับเซสชัน OpenClaw อย่างไร:

- `"per-user"` (ค่าเริ่มต้น): ห้อง DM ทั้งหมดที่มี peer ที่กำหนดเส้นทางเดียวกันจะแชร์เซสชันเดียว
- `"per-room"`: ห้อง DM ของ Matrix แต่ละห้องจะมีคีย์เซสชันของตัวเอง แม้ peer จะเป็นคนเดียวกัน

การผูก conversation แบบชัดเจนจะมีผลเหนือ `sessionScope` เสมอ ดังนั้นห้องและ thread ที่ถูกผูกไว้จะคงเซสชันเป้าหมายที่เลือกไว้

### การตอบกลับใน thread (`threadReplies`)

`threadReplies` กำหนดว่าบอทจะโพสต์คำตอบที่ไหน:

- `"off"`: คำตอบเป็นระดับบนสุด ข้อความขาเข้าที่อยู่ใน thread จะยังคงอยู่บนเซสชัน parent
- `"inbound"`: ตอบภายใน thread เฉพาะเมื่อข้อความขาเข้าอยู่ใน thread นั้นอยู่แล้ว
- `"always"`: ตอบภายใน thread ที่มีรากอยู่ที่ข้อความที่ทริกเกอร์; conversation นั้นจะถูกกำหนดเส้นทางผ่านเซสชันที่มีขอบเขตตาม thread ที่ตรงกันตั้งแต่ทริกเกอร์แรกเป็นต้นไป

`dm.threadReplies` จะแทนที่ค่านี้สำหรับ DM เท่านั้น - ตัวอย่างเช่น แยก thread ของห้องออกจากกันขณะที่ยังคงให้ DM เป็นแบบเรียบ

### การสืบทอด thread และคำสั่ง slash

- ข้อความแบบเธรดขาเข้าจะรวมข้อความรากของเธรดเป็นบริบทเพิ่มเติมของเอเจนต์
- การส่งผ่าน message-tool จะสืบทอดเธรด Matrix ปัจจุบันโดยอัตโนมัติเมื่อกำหนดเป้าหมายไปที่ห้องเดียวกัน (หรือเป้าหมายผู้ใช้ DM เดียวกัน) เว้นแต่จะระบุ `threadId` อย่างชัดเจน
- การใช้เป้าหมายผู้ใช้ DM ซ้ำจะทำงานเฉพาะเมื่อเมตาดาต้าของเซสชันปัจจุบันพิสูจน์ได้ว่าเป็นคู่สนทนา DM เดียวกันบนบัญชี Matrix เดียวกัน มิฉะนั้น OpenClaw จะถอยกลับไปใช้การกำหนดเส้นทางตามขอบเขตผู้ใช้ตามปกติ
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และ `/acp spawn` ที่ผูกกับเธรด ทั้งหมดทำงานได้ในห้อง Matrix และ DM
- `/focus` ระดับบนสุดจะสร้างเธรด Matrix ใหม่และผูกเธรดนั้นกับเซสชันเป้าหมายเมื่อเปิดใช้ `threadBindings.spawnSessions`
- การเรียกใช้ `/focus` หรือ `/acp spawn --thread here` ภายในเธรด Matrix ที่มีอยู่จะผูกเธรดนั้นไว้กับที่

เมื่อ OpenClaw ตรวจพบว่าห้อง DM ของ Matrix ชนกับห้อง DM อื่นบนเซสชันที่ใช้ร่วมกันเดียวกัน ระบบจะโพสต์ `m.notice` แบบครั้งเดียวในห้องนั้น โดยชี้ไปยังทางออก `/focus` และแนะนำให้เปลี่ยน `dm.sessionScope` การแจ้งเตือนจะแสดงเฉพาะเมื่อเปิดใช้การผูกเธรดเท่านั้น

## การผูกบทสนทนา ACP

ห้อง Matrix, DM และเธรด Matrix ที่มีอยู่สามารถเปลี่ยนเป็นพื้นที่ทำงาน ACP แบบคงทนได้โดยไม่ต้องเปลี่ยนพื้นผิวแชต

ขั้นตอนด่วนสำหรับผู้ปฏิบัติการ:

- เรียกใช้ `/acp spawn codex --bind here` ภายใน DM, ห้อง หรือเธรดที่มีอยู่ของ Matrix ที่คุณต้องการใช้ต่อ
- ใน DM หรือห้อง Matrix ระดับบนสุด DM/ห้องปัจจุบันจะยังเป็นพื้นผิวแชต และข้อความในอนาคตจะถูกส่งต่อไปยังเซสชัน ACP ที่สร้างขึ้น
- ภายในเธรด Matrix ที่มีอยู่ `--bind here` จะผูกเธรดปัจจุบันนั้นไว้กับที่
- `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP ที่ผูกอยู่เดิมไว้กับที่
- `/acp close` จะปิดเซสชัน ACP และลบการผูกออก

หมายเหตุ:

- `--bind here` ไม่สร้างเธรดย่อยของ Matrix
- `threadBindings.spawnSessions` ควบคุม `/acp spawn --thread auto|here` ในกรณีที่ OpenClaw ต้องสร้างหรือผูกเธรดย่อยของ Matrix

### การกำหนดค่าการผูกเธรด

Matrix สืบทอดค่าเริ่มต้นส่วนกลางจาก `session.threadBindings` และยังรองรับการแทนที่รายช่องทางด้วย:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

การสร้างเซสชันที่ผูกกับเธรดของ Matrix จะเปิดเป็นค่าเริ่มต้น:

- ตั้งค่า `threadBindings.spawnSessions: false` เพื่อบล็อกไม่ให้ `/focus` ระดับบนสุดและ `/acp spawn --thread auto|here` สร้าง/ผูกเธรด Matrix
- ตั้งค่า `threadBindings.defaultSpawnContext: "isolated"` เมื่อการสร้างเธรด subagent แบบเนทีฟไม่ควร fork ทรานสคริปต์ของพาเรนต์

## รีแอ็กชัน

Matrix รองรับรีแอ็กชันขาออก การแจ้งเตือนรีแอ็กชันขาเข้า และรีแอ็กชันตอบรับ

เครื่องมือรีแอ็กชันขาออกถูกควบคุมโดย `channels.matrix.actions.reactions`:

- `react` เพิ่มรีแอ็กชันไปยังอีเวนต์ Matrix
- `reactions` แสดงสรุปรีแอ็กชันปัจจุบันของอีเวนต์ Matrix
- `emoji=""` ลบรีแอ็กชันของบอตเองในอีเวนต์นั้น
- `remove: true` ลบเฉพาะรีแอ็กชันอีโมจิที่ระบุจากบอต

**ลำดับการแก้ค่า** (ค่าที่กำหนดตัวแรกเป็นผู้ชนะ):

| การตั้งค่า                 | ลำดับ                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | ต่อบัญชี → ช่องทาง → `messages.ackReaction` → ค่า fallback อีโมจิของตัวตนเอเจนต์   |
| `ackReactionScope`      | ต่อบัญชี → ช่องทาง → `messages.ackReactionScope` → ค่าเริ่มต้น `"group-mentions"` |
| `reactionNotifications` | ต่อบัญชี → ช่องทาง → ค่าเริ่มต้น `"own"`                                          |

`reactionNotifications: "own"` จะส่งต่ออีเวนต์ `m.reaction` ที่เพิ่มเข้ามาเมื่ออีเวนต์เหล่านั้นมีเป้าหมายเป็นข้อความ Matrix ที่บอตเป็นผู้เขียน; `"off"` จะปิดอีเวนต์ระบบรีแอ็กชัน การลบรีแอ็กชันจะไม่ถูกสังเคราะห์เป็นอีเวนต์ระบบ เพราะ Matrix แสดงสิ่งเหล่านั้นเป็นการแก้ไขแบบ redaction ไม่ใช่การลบ `m.reaction` แบบสแตนด์อโลน

## บริบทประวัติ

- `channels.matrix.historyLimit` ควบคุมจำนวนข้อความห้องล่าสุดที่รวมเป็น `InboundHistory` เมื่อข้อความในห้อง Matrix ทริกเกอร์เอเจนต์ ถอยกลับไปใช้ `messages.groupChat.historyLimit`; หากไม่ได้ตั้งค่าทั้งคู่ ค่าเริ่มต้นที่มีผลคือ `0` ตั้งค่า `0` เพื่อปิดใช้
- ประวัติห้อง Matrix เป็นแบบเฉพาะห้องเท่านั้น DM ยังคงใช้ประวัติเซสชันตามปกติ
- ประวัติห้อง Matrix เป็นแบบรอดำเนินการเท่านั้น: OpenClaw บัฟเฟอร์ข้อความห้องที่ยังไม่ได้ทริกเกอร์การตอบกลับ จากนั้นจึง snapshot หน้าต่างนั้นเมื่อมีการกล่าวถึงหรือทริกเกอร์อื่นมาถึง
- ข้อความทริกเกอร์ปัจจุบันไม่ถูกรวมอยู่ใน `InboundHistory`; ข้อความนั้นจะอยู่ในเนื้อหาขาเข้าหลักสำหรับรอบนั้น
- การลองซ้ำของอีเวนต์ Matrix เดียวกันจะใช้ snapshot ประวัติเดิมแทนที่จะเลื่อนไปยังข้อความห้องใหม่กว่า

## การมองเห็นบริบท

Matrix รองรับการควบคุม `contextVisibility` ที่ใช้ร่วมกันสำหรับบริบทห้องเสริม เช่น ข้อความตอบกลับที่ดึงมา รากเธรด และประวัติที่รอดำเนินการ

- `contextVisibility: "all"` เป็นค่าเริ่มต้น บริบทเสริมจะถูกเก็บไว้ตามที่ได้รับ
- `contextVisibility: "allowlist"` กรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่ได้รับอนุญาตโดยการตรวจ allowlist ของห้อง/ผู้ใช้ที่ทำงานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บข้อความตอบกลับที่อ้างอิงอย่างชัดเจนไว้หนึ่งรายการ

การตั้งค่านี้ส่งผลต่อการมองเห็นบริบทเสริม ไม่ใช่ว่าข้อความขาเข้าเองสามารถทริกเกอร์การตอบกลับได้หรือไม่
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

ดู [กลุ่ม](/th/channels/groups) สำหรับพฤติกรรมการควบคุมด้วยการกล่าวถึงและ allowlist

ตัวอย่างการจับคู่สำหรับ DM ของ Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

หากผู้ใช้ Matrix ที่ยังไม่ได้อนุมัติส่งข้อความถึงคุณต่อไปก่อนการอนุมัติ OpenClaw จะใช้รหัสจับคู่ที่รอดำเนินการเดิมซ้ำ และอาจส่งคำตอบเตือนหลัง cooldown สั้น ๆ แทนที่จะสร้างรหัสใหม่

ดู [การจับคู่](/th/channels/pairing) สำหรับโฟลว์การจับคู่ DM ที่ใช้ร่วมกันและเลย์เอาต์การจัดเก็บ

## การซ่อมห้องโดยตรง

หากสถานะข้อความโดยตรงคลาดเคลื่อนจนไม่ตรงกัน OpenClaw อาจจบลงด้วย mapping `m.direct` ที่ล้าสมัยซึ่งชี้ไปยังห้องเดี่ยวเก่าแทน DM ที่ใช้งานอยู่ ตรวจสอบ mapping ปัจจุบันของคู่สนทนา:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

ซ่อมแซม:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

ทั้งสองคำสั่งยอมรับ `--account <id>` สำหรับการตั้งค่าหลายบัญชี โฟลว์การซ่อมแซม:

- เลือกใช้ DM แบบ 1:1 อย่างเข้มงวดที่ถูก map อยู่แล้วใน `m.direct` ก่อน
- ถอยกลับไปใช้ DM แบบ 1:1 อย่างเข้มงวดที่เข้าร่วมอยู่ในปัจจุบันกับผู้ใช้นั้น
- สร้างห้องโดยตรงใหม่และเขียน `m.direct` ใหม่หากไม่มี DM ที่สมบูรณ์อยู่

คำสั่งนี้ไม่ลบห้องเก่าโดยอัตโนมัติ แต่จะเลือก DM ที่สมบูรณ์และอัปเดต mapping เพื่อให้การส่ง Matrix ในอนาคต การแจ้งเตือนการยืนยัน และโฟลว์ข้อความโดยตรงอื่น ๆ ไปยังห้องที่ถูกต้อง

## การอนุมัติ exec

Matrix สามารถทำหน้าที่เป็นไคลเอนต์อนุมัติแบบเนทีฟได้ กำหนดค่าภายใต้ `channels.matrix.execApprovals` (หรือ `channels.matrix.accounts.<account>.execApprovals` สำหรับการแทนที่รายบัญชี):

- `enabled`: ส่งการอนุมัติผ่านพรอมป์แบบเนทีฟของ Matrix เมื่อไม่ได้ตั้งค่าหรือเป็น `"auto"` Matrix จะเปิดใช้อัตโนมัติเมื่อสามารถแก้หาผู้อนุมัติได้อย่างน้อยหนึ่งราย ตั้งค่า `false` เพื่อปิดใช้อย่างชัดเจน
- `approvers`: ID ผู้ใช้ Matrix (`@owner:example.org`) ที่อนุญาตให้อนุมัติคำขอ exec ไม่บังคับ - ถอยกลับไปใช้ `channels.matrix.dm.allowFrom`
- `target`: ตำแหน่งที่พรอมป์จะไป `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ; `"channel"` ส่งไปยังห้อง Matrix หรือ DM ต้นทาง; `"both"` ส่งไปยังทั้งสองที่
- `agentFilter` / `sessionFilter`: allowlist เสริมสำหรับเอเจนต์/เซสชันที่จะทริกเกอร์การส่งผ่าน Matrix

การอนุญาตแตกต่างกันเล็กน้อยระหว่างชนิดการอนุมัติ:

- **การอนุมัติ exec** ใช้ `execApprovals.approvers` และถอยกลับไปใช้ `dm.allowFrom`
- **การอนุมัติ Plugin** อนุญาตผ่าน `dm.allowFrom` เท่านั้น

ทั้งสองชนิดใช้ชอร์ตคัตรีแอ็กชันและการอัปเดตข้อความของ Matrix ร่วมกัน ผู้อนุมัติจะเห็นชอร์ตคัตรีแอ็กชันบนข้อความอนุมัติหลัก:

- `✅` อนุญาตหนึ่งครั้ง
- `❌` ปฏิเสธ
- `♾️` อนุญาตเสมอ (เมื่อนโยบาย exec ที่มีผลอนุญาต)

คำสั่ง slash แบบ fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`

เฉพาะผู้อนุมัติที่แก้หาได้เท่านั้นที่สามารถอนุมัติหรือปฏิเสธได้ การส่งผ่านช่องทางสำหรับการอนุมัติ exec จะรวมข้อความคำสั่งไว้ด้วย - เปิดใช้ `channel` หรือ `both` เฉพาะในห้องที่เชื่อถือได้เท่านั้น

ที่เกี่ยวข้อง: [การอนุมัติ exec](/th/tools/exec-approvals)

## คำสั่ง slash

คำสั่ง slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` เป็นต้น) ทำงานได้โดยตรงใน DM ในห้อง OpenClaw ยังรู้จำคำสั่งที่นำหน้าด้วยการกล่าวถึง Matrix ของบอตเองด้วย ดังนั้น `@bot:server /new` จะทริกเกอร์เส้นทางคำสั่งโดยไม่ต้องใช้ regex การกล่าวถึงแบบกำหนดเอง วิธีนี้ทำให้บอตตอบสนองต่อโพสต์สไตล์ห้อง `@mention /command` ที่ Element และไคลเอนต์ที่คล้ายกันส่งออกเมื่อผู้ใช้กดเติมชื่อบอตอัตโนมัติก่อนพิมพ์คำสั่ง

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

- ค่าระดับบนสุดของ `channels.matrix` ทำหน้าที่เป็นค่าเริ่มต้นสำหรับบัญชีที่มีชื่อ เว้นแต่บัญชีนั้นจะแทนที่ค่าเหล่านั้น
- จำกัดขอบเขตรายการห้องที่สืบทอดมาให้กับบัญชีเฉพาะด้วย `groups.<room>.account` รายการที่ไม่มี `account` จะใช้ร่วมกันข้ามบัญชี; `account: "default"` ยังทำงานเมื่อบัญชีเริ่มต้นถูกกำหนดค่าที่ระดับบนสุด

**การเลือกบัญชีเริ่มต้น:**

- ตั้งค่า `defaultAccount` เพื่อเลือกบัญชีที่มีชื่อซึ่งการกำหนดเส้นทางโดยนัย การโพรบ และคำสั่ง CLI จะใช้เป็นหลัก
- หากคุณมีหลายบัญชีและมีบัญชีหนึ่งชื่อ `default` จริง ๆ OpenClaw จะใช้บัญชีนั้นโดยนัยแม้ไม่ได้ตั้งค่า `defaultAccount`
- หากคุณมีบัญชีที่มีชื่อหลายบัญชีและไม่ได้เลือกค่าเริ่มต้น คำสั่ง CLI จะไม่เดา - ตั้งค่า `defaultAccount` หรือส่ง `--account <id>`
- บล็อกระดับบนสุด `channels.matrix.*` จะถูกถือเป็นบัญชี `default` โดยนัยเฉพาะเมื่อการยืนยันตัวตนครบถ้วน (`homeserver` + `accessToken` หรือ `homeserver` + `userId` + `password`) บัญชีที่มีชื่อยังคงค้นพบได้จาก `homeserver` + `userId` เมื่อมี credential ที่แคชไว้ครอบคลุม auth

**การเลื่อนระดับ:**

- เมื่อ OpenClaw เลื่อนระดับการกำหนดค่าแบบบัญชีเดียวเป็นหลายบัญชีระหว่างการซ่อมหรือการตั้งค่า ระบบจะรักษาบัญชีที่มีชื่อเดิมไว้หากมีอยู่ หรือหาก `defaultAccount` ชี้ไปยังบัญชีหนึ่งอยู่แล้ว เฉพาะคีย์ auth/bootstrap ของ Matrix เท่านั้นที่จะย้ายเข้าไปในบัญชีที่ถูกเลื่อนระดับ; คีย์นโยบายการส่งที่ใช้ร่วมกันจะยังคงอยู่ที่ระดับบนสุด

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบหลายบัญชีที่ใช้ร่วมกัน

## homeserver ส่วนตัว/LAN

โดยค่าเริ่มต้น OpenClaw จะบล็อก homeserver Matrix แบบส่วนตัว/ภายในเพื่อการป้องกัน SSRF เว้นแต่คุณจะ
เลือกเปิดใช้อย่างชัดเจนต่อบัญชี

หาก homeserver ของคุณทำงานบน localhost, IP ของ LAN/Tailscale หรือ hostname ภายใน ให้เปิดใช้
`network.dangerouslyAllowPrivateNetwork` สำหรับบัญชี Matrix นั้น

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

การเลือกใช้นี้อนุญาตเฉพาะเป้าหมายส่วนตัว/ภายในที่เชื่อถือได้เท่านั้น โฮมเซิร์ฟเวอร์แบบข้อความล้วนสาธารณะ เช่น
`http://matrix.example.org:8008` ยังคงถูกบล็อก ควรใช้ `https://` ทุกครั้งที่เป็นไปได้

## การพร็อกซีทราฟฟิก Matrix

หากการปรับใช้ Matrix ของคุณต้องใช้พร็อกซี HTTP(S) ขาออกแบบชัดเจน ให้ตั้งค่า `channels.matrix.proxy`:

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

บัญชีที่มีชื่อสามารถกำหนดทับค่าเริ่มต้นระดับบนสุดได้ด้วย `channels.matrix.accounts.<id>.proxy`
OpenClaw ใช้การตั้งค่าพร็อกซีเดียวกันสำหรับทราฟฟิก Matrix ขณะรันไทม์และการตรวจสอบสถานะบัญชี

## การแปลงเป้าหมาย

Matrix รองรับรูปแบบเป้าหมายเหล่านี้ในทุกที่ที่ OpenClaw ขอเป้าหมายเป็นห้องหรือผู้ใช้:

- ผู้ใช้: `@user:server`, `user:@user:server`, หรือ `matrix:user:@user:server`
- ห้อง: `!room:server`, `room:!room:server`, หรือ `matrix:room:!room:server`
- นามแฝง: `#alias:server`, `channel:#alias:server`, หรือ `matrix:channel:#alias:server`

ID ห้องของ Matrix แยกตัวพิมพ์เล็กและใหญ่ ใช้การสะกดตัวพิมพ์ของ ID ห้องให้ตรงกับ Matrix
เมื่อกำหนดค่าเป้าหมายการส่งที่ชัดเจน งาน cron การผูก หรือรายการอนุญาต
OpenClaw เก็บคีย์เซสชันภายในให้เป็นรูปแบบมาตรฐานสำหรับการจัดเก็บ ดังนั้นคีย์ตัวพิมพ์เล็กเหล่านั้น
จึงไม่ใช่แหล่งข้อมูลที่เชื่อถือได้สำหรับ ID การส่งของ Matrix

การค้นหาไดเรกทอรีแบบสดใช้บัญชี Matrix ที่เข้าสู่ระบบอยู่:

- การค้นหาผู้ใช้จะค้นไดเรกทอรีผู้ใช้ Matrix บนโฮมเซิร์ฟเวอร์นั้น
- การค้นหาห้องรองรับ ID ห้องและนามแฝงที่ระบุชัดเจนโดยตรง การค้นหาชื่อห้องที่เข้าร่วมแล้วเป็นแบบพยายามอย่างดีที่สุด และใช้เฉพาะกับรายการอนุญาตของห้องขณะรันไทม์เมื่อมีการตั้งค่า `dangerouslyAllowNameMatching: true`
- หากไม่สามารถแปลงชื่อห้องเป็น ID หรือนามแฝงได้ ชื่อนั้นจะถูกละเว้นโดยการแปลงรายการอนุญาตขณะรันไทม์

## ข้อมูลอ้างอิงการกำหนดค่า

ฟิลด์ผู้ใช้แบบรายการอนุญาต (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) รองรับ ID ผู้ใช้ Matrix แบบเต็ม (ปลอดภัยที่สุด) รายการผู้ใช้ที่ไม่ใช่ ID จะถูกละเว้นตามค่าเริ่มต้น หากคุณตั้งค่า `dangerouslyAllowNameMatching: true` การจับคู่ชื่อแสดงผลในไดเรกทอรี Matrix แบบตรงตัวจะถูกแปลงเมื่อเริ่มต้น และทุกครั้งที่รายการอนุญาตเปลี่ยนระหว่างที่ตัวเฝ้าตรวจทำงานอยู่ รายการที่แปลงไม่ได้จะถูกละเว้นขณะรันไทม์

คีย์รายการอนุญาตของห้อง (`groups`, `rooms` แบบเดิม) ควรเป็น ID ห้องหรือนามแฝง คีย์ที่เป็นชื่อห้องแบบธรรมดาจะถูกละเว้นตามค่าเริ่มต้น; `dangerouslyAllowNameMatching: true` จะคืนค่าการค้นหาแบบพยายามอย่างดีที่สุดกับชื่อห้องที่เข้าร่วมแล้ว

### บัญชีและการเชื่อมต่อ

- `enabled`: เปิดหรือปิดช่องทาง
- `name`: ป้ายชื่อที่แสดงสำหรับบัญชีแบบไม่บังคับ
- `defaultAccount`: ID บัญชีที่ต้องการใช้เมื่อกำหนดค่าบัญชี Matrix ไว้หลายบัญชี
- `accounts`: การกำหนดทับรายบัญชีแบบมีชื่อ ค่า `channels.matrix` ระดับบนสุดจะถูกสืบทอดเป็นค่าเริ่มต้น
- `homeserver`: URL ของโฮมเซิร์ฟเวอร์ เช่น `https://matrix.example.org`
- `network.dangerouslyAllowPrivateNetwork`: อนุญาตให้บัญชีนี้เชื่อมต่อกับ `localhost`, IP ของ LAN/Tailscale หรือชื่อโฮสต์ภายใน
- `proxy`: URL พร็อกซี HTTP(S) แบบไม่บังคับสำหรับทราฟฟิก Matrix รองรับการกำหนดทับรายบัญชี
- `userId`: ID ผู้ใช้ Matrix แบบเต็ม (`@bot:example.org`)
- `accessToken`: โทเค็นการเข้าถึงสำหรับการยืนยันตัวตนแบบใช้โทเค็น รองรับค่าข้อความล้วนและ SecretRef ผ่านผู้ให้บริการ env/file/exec ([การจัดการความลับ](/th/gateway/secrets))
- `password`: รหัสผ่านสำหรับการเข้าสู่ระบบแบบใช้รหัสผ่าน รองรับค่าข้อความล้วนและ SecretRef
- `deviceId`: ID อุปกรณ์ Matrix ที่ระบุชัดเจน
- `deviceName`: ชื่อแสดงผลของอุปกรณ์ที่ใช้ในเวลาเข้าสู่ระบบด้วยรหัสผ่าน
- `avatarUrl`: URL รูปประจำตัวของตนเองที่จัดเก็บไว้สำหรับการซิงค์โปรไฟล์และการอัปเดต `profile set`
- `initialSyncLimit`: จำนวนเหตุการณ์สูงสุดที่ดึงระหว่างการซิงค์เมื่อเริ่มต้น

### การเข้ารหัส

- `encryption`: เปิดใช้ E2EE ค่าเริ่มต้น: `false`
- `startupVerification`: `"if-unverified"` (ค่าเริ่มต้นเมื่อเปิด E2EE) หรือ `"off"` ขอการยืนยันตนเองโดยอัตโนมัติเมื่อเริ่มต้น หากอุปกรณ์นี้ยังไม่ได้รับการยืนยัน
- `startupVerificationCooldownHours`: ช่วงพักก่อนคำขออัตโนมัติครั้งถัดไปเมื่อเริ่มต้น ค่าเริ่มต้น: `24`

### การเข้าถึงและนโยบาย

- `groupPolicy`: `"open"`, `"allowlist"`, หรือ `"disabled"` ค่าเริ่มต้น: `"allowlist"`
- `groupAllowFrom`: รายการอนุญาตของ ID ผู้ใช้สำหรับทราฟฟิกห้อง
- `dm.enabled`: เมื่อเป็น `false` ให้ละเว้น DM ทั้งหมด ค่าเริ่มต้น: `true`
- `dm.policy`: `"pairing"` (ค่าเริ่มต้น), `"allowlist"`, `"open"`, หรือ `"disabled"` ใช้หลังจากบอตเข้าร่วมและจำแนกห้องเป็น DM แล้ว; ไม่มีผลต่อการจัดการคำเชิญ
- `dm.allowFrom`: รายการอนุญาตของ ID ผู้ใช้สำหรับทราฟฟิก DM
- `dm.sessionScope`: `"per-user"` (ค่าเริ่มต้น) หรือ `"per-room"`
- `dm.threadReplies`: การกำหนดทับเฉพาะ DM สำหรับการตอบกลับแบบเธรด (`"off"`, `"inbound"`, `"always"`)
- `allowBots`: รับข้อความจากบัญชีบอต Matrix อื่นที่กำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `allowlistOnly`: เมื่อเป็น `true` จะบังคับให้นโยบาย DM ที่ใช้งานอยู่ทั้งหมด (ยกเว้น `"disabled"`) และนโยบายกลุ่ม `"open"` เป็น `"allowlist"` ไม่เปลี่ยนนโยบาย `"disabled"`
- `dangerouslyAllowNameMatching`: เมื่อเป็น `true` จะอนุญาตการค้นหาไดเรกทอรีชื่อแสดงผลของ Matrix สำหรับรายการอนุญาตผู้ใช้ และการค้นหาชื่อห้องที่เข้าร่วมแล้วสำหรับคีย์รายการอนุญาตของห้อง ควรใช้ ID แบบเต็ม `@user:server` และ ID ห้องหรือนามแฝง
- `autoJoin`: `"always"`, `"allowlist"`, หรือ `"off"` ค่าเริ่มต้น: `"off"` ใช้กับคำเชิญ Matrix ทุกแบบ รวมถึงคำเชิญแบบ DM
- `autoJoinAllowlist`: ห้อง/นามแฝงที่อนุญาตเมื่อ `autoJoin` เป็น `"allowlist"` รายการนามแฝงจะถูกแปลงเทียบกับโฮมเซิร์ฟเวอร์ ไม่ใช่เทียบกับสถานะที่ห้องที่เชิญอ้างสิทธิ์
- `contextVisibility`: การมองเห็นบริบทเสริม (`"all"` ค่าเริ่มต้น, `"allowlist"`, `"allowlist_quote"`)

### พฤติกรรมการตอบกลับ

- `replyToMode`: `"off"`, `"first"`, `"all"`, หรือ `"batched"`
- `threadReplies`: `"off"`, `"inbound"`, หรือ `"always"`
- `threadBindings`: การกำหนดทับรายช่องทางสำหรับการกำหนดเส้นทางและวงจรชีวิตของเซสชันที่ผูกกับเธรด
- `streaming`: `"off"` (ค่าเริ่มต้น), `"partial"`, `"quiet"`, หรือรูปแบบอ็อบเจกต์ `{ mode, preview: { toolProgress } }` `true` ↔ `"partial"`, `false` ↔ `"off"`
- `blockStreaming`: เมื่อเป็น `true` บล็อกของผู้ช่วยที่เสร็จสมบูรณ์จะถูกเก็บเป็นข้อความความคืบหน้าแยกต่างหาก
- `markdown`: การกำหนดค่าการเรนเดอร์ Markdown แบบไม่บังคับสำหรับข้อความขาออก
- `responsePrefix`: สตริงแบบไม่บังคับที่เติมหน้าการตอบกลับขาออก
- `textChunkLimit`: ขนาดชิ้นส่วนขาออกเป็นจำนวนอักขระเมื่อ `chunkMode: "length"` ค่าเริ่มต้น: `4000`
- `chunkMode`: `"length"` (ค่าเริ่มต้น แบ่งตามจำนวนอักขระ) หรือ `"newline"` (แบ่งที่ขอบเขตบรรทัด)
- `historyLimit`: จำนวนข้อความล่าสุดในห้องที่รวมเป็น `InboundHistory` เมื่อข้อความในห้องทริกเกอร์เอเจนต์ ย้อนกลับไปใช้ `messages.groupChat.historyLimit`; ค่าเริ่มต้นที่มีผลคือ `0` (ปิดใช้งาน)
- `mediaMaxMb`: เพดานขนาดสื่อเป็น MB สำหรับการส่งขาออกและการประมวลผลขาเข้า

### การตั้งค่ารีแอ็กชัน

- `ackReaction`: การกำหนดทับรีแอ็กชันยืนยันสำหรับช่องทาง/บัญชีนี้
- `ackReactionScope`: การกำหนดทับขอบเขต (`"group-mentions"` ค่าเริ่มต้น, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`)
- `reactionNotifications`: โหมดการแจ้งเตือนรีแอ็กชันขาเข้า (`"own"` ค่าเริ่มต้น, `"off"`)

### เครื่องมือและการกำหนดทับรายห้อง

- `actions`: การควบคุมการใช้งานเครื่องมือตามแอ็กชัน (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`)
- `groups`: แผนที่นโยบายรายห้อง ตัวตนของเซสชันใช้ ID ห้องที่เสถียรหลังการแปลง (`rooms` เป็นนามแฝงแบบเดิม)
  - `groups.<room>.account`: จำกัดรายการห้องที่สืบทอดหนึ่งรายการไว้กับบัญชีที่ระบุ
  - `groups.<room>.allowBots`: การกำหนดทับรายห้องสำหรับการตั้งค่าระดับช่องทาง (`true` หรือ `"mentions"`)
  - `groups.<room>.users`: รายการอนุญาตผู้ส่งรายห้อง
  - `groups.<room>.tools`: การกำหนดทับอนุญาต/ปฏิเสธเครื่องมือรายห้อง
  - `groups.<room>.autoReply`: การกำหนดทับการควบคุมด้วยการกล่าวถึงรายห้อง `true` ปิดข้อกำหนดการกล่าวถึงสำหรับห้องนั้น; `false` บังคับให้เปิดกลับมา
  - `groups.<room>.skills`: ตัวกรอง Skills รายห้อง
  - `groups.<room>.systemPrompt`: ส่วนย่อยของ system prompt รายห้อง

### การตั้งค่าการอนุมัติ exec

- `execApprovals.enabled`: ส่งการอนุมัติ exec ผ่านพรอมป์แบบเนทีฟของ Matrix
- `execApprovals.approvers`: ID ผู้ใช้ Matrix ที่ได้รับอนุญาตให้อนุมัติ ย้อนกลับไปใช้ `dm.allowFrom`
- `execApprovals.target`: `"dm"` (ค่าเริ่มต้น), `"channel"`, หรือ `"both"`
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: รายการอนุญาตเอเจนต์/เซสชันแบบไม่บังคับสำหรับการส่ง

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) - ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
