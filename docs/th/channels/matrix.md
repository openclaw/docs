---
read_when:
    - การตั้งค่า Matrix ใน OpenClaw
    - การกำหนดค่า Matrix E2EE และการยืนยัน
summary: สถานะการรองรับ Matrix การตั้งค่า และตัวอย่างการกำหนดค่า
title: เมทริกซ์
x-i18n:
    generated_at: "2026-05-06T09:03:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a35192ab3b5b9214fb3eb56f1c12737aa6966a481f43297fe0da1ac4396f917
    source_path: channels/matrix.md
    workflow: 16
---

Matrix เป็น Plugin ช่องทางที่ดาวน์โหลดได้สำหรับ OpenClaw
ใช้ `matrix-js-sdk` อย่างเป็นทางการ และรองรับ DM, ห้อง, เธรด, สื่อ, รีแอ็กชัน, โพล, ตำแหน่งที่ตั้ง และ E2EE

## ติดตั้ง

ติดตั้ง Matrix ก่อนกำหนดค่าช่องทาง:

```bash
openclaw plugins install @openclaw/matrix
```

จาก checkout ภายในเครื่อง:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` จะลงทะเบียนและเปิดใช้ Plugin ดังนั้นจึงไม่ต้องมีขั้นตอน `openclaw plugins enable matrix` แยกต่างหาก แต่ Plugin จะยังไม่ทำอะไรจนกว่าคุณจะกำหนดค่าช่องทางด้านล่าง ดู [Plugins](/th/tools/plugin) สำหรับพฤติกรรม Plugin ทั่วไปและกฎการติดตั้ง

## ตั้งค่า

1. สร้างบัญชี Matrix บน homeserver ของคุณ
2. กำหนดค่า `channels.matrix` ด้วย `homeserver` + `accessToken` หรือ `homeserver` + `userId` + `password`
3. รีสตาร์ต Gateway
4. เริ่ม DM กับบอต หรือเชิญบอตเข้าห้อง (ดู [auto-join](#auto-join) - คำเชิญใหม่จะเข้ามาได้ก็ต่อเมื่อ `autoJoin` อนุญาตเท่านั้น)

### การตั้งค่าแบบโต้ตอบ

```bash
openclaw channels add
openclaw configure --section channels
```

วิซาร์ดจะถามค่า: URL ของ homeserver, วิธีการยืนยันตัวตน (access token หรือรหัสผ่าน), user ID (เฉพาะการยืนยันตัวตนด้วยรหัสผ่าน), ชื่ออุปกรณ์ที่ไม่บังคับ, จะเปิดใช้ E2EE หรือไม่ และจะกำหนดค่าการเข้าถึงห้องกับ auto-join หรือไม่

หากมี env vars `MATRIX_*` ที่ตรงกันอยู่แล้ว และบัญชีที่เลือกไม่มี auth ที่บันทึกไว้ วิซาร์ดจะเสนอทางลัดผ่าน env-var หากต้องการ resolve ชื่อห้องก่อนบันทึก allowlist ให้รัน `openclaw channels resolve --channel matrix "Project Room"` เมื่อเปิดใช้ E2EE วิซาร์ดจะเขียน config และรัน bootstrap เดียวกับ [`openclaw matrix encryption setup`](#encryption-and-verification)

### การกำหนดค่าขั้นต่ำ

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

แบบใช้รหัสผ่าน (โทเค็นจะถูกแคชหลังจากล็อกอินครั้งแรก):

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

ค่าเริ่มต้นของ `channels.matrix.autoJoin` คือ `off` ด้วยค่าเริ่มต้นนี้ บอตจะไม่ปรากฏในห้องใหม่หรือ DM จากคำเชิญใหม่จนกว่าคุณจะเข้าร่วมด้วยตนเอง

OpenClaw ไม่สามารถบอกได้ในเวลาที่ได้รับคำเชิญว่าห้องที่เชิญเป็น DM หรือกลุ่ม ดังนั้นคำเชิญทั้งหมด - รวมถึงคำเชิญแบบ DM - จะผ่าน `autoJoin` ก่อน `dm.policy` จะมีผลภายหลังเท่านั้น หลังจากบอตเข้าร่วมแล้วและห้องถูกจัดประเภทแล้ว

<Warning>
ตั้ง `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` เพื่อจำกัดคำเชิญที่บอตยอมรับ หรือ `autoJoin: "always"` เพื่อยอมรับทุกคำเชิญ

`autoJoinAllowlist` รับเฉพาะเป้าหมายที่เสถียร: `!roomId:server`, `#alias:server` หรือ `*` ชื่อห้องแบบธรรมดาจะถูกปฏิเสธ; รายการ alias จะถูก resolve กับ homeserver ไม่ใช่กับ state ที่ห้องที่เชิญอ้างไว้
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

ควรใส่ allowlist ของ DM และห้องด้วย ID ที่เสถียร:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): ใช้ `@user:server` Display name จะ resolve ได้ก็ต่อเมื่อไดเรกทอรีของ homeserver คืนผลลัพธ์ที่ตรงกันเพียงรายการเดียวเท่านั้น
- ห้อง (`groups`, `autoJoinAllowlist`): ใช้ `!room:server` หรือ `#alias:server` ชื่อจะถูก resolve แบบดีที่สุดเท่าที่ทำได้กับห้องที่เข้าร่วมแล้ว; รายการที่ resolve ไม่ได้จะถูกละเว้นตอน runtime

### การปรับรูปแบบ Account ID

วิซาร์ดจะแปลงชื่อที่เป็นมิตรให้อยู่ในรูปแบบ account ID ที่ normalized ตัวอย่างเช่น `Ops Bot` จะกลายเป็น `ops-bot` เครื่องหมายวรรคตอนจะถูก escape ในชื่อ env-var แบบ scoped เพื่อไม่ให้สองบัญชีชนกัน: `-` → `_X2D_` ดังนั้น `ops-prod` จะ map ไปยัง `MATRIX_OPS_X2D_PROD_*`

### ข้อมูลประจำตัวที่แคชไว้

Matrix จัดเก็บข้อมูลประจำตัวที่แคชไว้ใต้ `~/.openclaw/credentials/matrix/`:

- บัญชีเริ่มต้น: `credentials.json`
- บัญชีที่มีชื่อ: `credentials-<account>.json`

เมื่อมีข้อมูลประจำตัวที่แคชไว้ที่นั่น OpenClaw จะถือว่า Matrix ถูกกำหนดค่าแล้ว แม้ access token จะไม่ได้อยู่ในไฟล์ config - ซึ่งครอบคลุมการตั้งค่า, `openclaw doctor` และการตรวจสอบสถานะช่องทาง

### ตัวแปรสภาพแวดล้อม

ใช้เมื่อไม่ได้ตั้งค่าคีย์ config ที่เทียบเท่ากัน บัญชีเริ่มต้นใช้ชื่อที่ไม่มี prefix; บัญชีที่มีชื่อใช้ account ID แทรกก่อน suffix

| บัญชีเริ่มต้น       | บัญชีที่มีชื่อ (`<ID>` คือ account ID ที่ normalized แล้ว) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

สำหรับบัญชี `ops` ชื่อจะกลายเป็น `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` และอื่น ๆ env vars ของ recovery-key จะถูกอ่านโดย flow ของ CLI ที่รองรับการกู้คืน (`verify backup restore`, `verify device`, `verify bootstrap`) เมื่อคุณ pipe คีย์เข้ามาผ่าน `--recovery-key-stdin`

ไม่สามารถตั้ง `MATRIX_HOMESERVER` จาก `.env` ของ workspace ได้; ดู [ไฟล์ `.env` ของ Workspace](/th/gateway/security)

## ตัวอย่างการกำหนดค่า

baseline ที่ใช้งานได้จริงพร้อม DM pairing, room allowlist และ E2EE:

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

## ตัวอย่างการสตรีม

การสตรีม reply ของ Matrix เป็นแบบ opt-in `streaming` ควบคุมวิธีที่ OpenClaw ส่ง reply ของผู้ช่วยที่กำลังดำเนินอยู่; `blockStreaming` ควบคุมว่า block ที่เสร็จแล้วแต่ละรายการจะถูกเก็บเป็นข้อความ Matrix ของตัวเองหรือไม่

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

หากต้องการเก็บตัวอย่างคำตอบแบบ live แต่ซ่อนบรรทัด tool/progress ระหว่างทาง ให้ใช้รูปแบบ object:

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
| `"off"` (ค่าเริ่มต้น) | รอ reply แบบเต็ม แล้วส่งครั้งเดียว `true` ↔ `"partial"`, `false` ↔ `"off"`                                                                                        |
| `"partial"`       | แก้ไขข้อความ text ปกติหนึ่งรายการในตำแหน่งเดิมขณะที่โมเดลเขียน block ปัจจุบัน ไคลเอนต์ Matrix ทั่วไปอาจแจ้งเตือนเมื่อมีตัวอย่างครั้งแรก ไม่ใช่การแก้ไขสุดท้าย              |
| `"quiet"`         | เหมือนกับ `"partial"` แต่ข้อความเป็น notice ที่ไม่แจ้งเตือน ผู้รับจะได้รับการแจ้งเตือนก็ต่อเมื่อ push rule รายผู้ใช้ตรงกับการแก้ไขที่ finalized แล้วเท่านั้น (ดูด้านล่าง) |

`blockStreaming` แยกอิสระจาก `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (ค่าเริ่มต้น)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | live draft สำหรับ block ปัจจุบัน, block ที่เสร็จแล้วถูกเก็บเป็นข้อความ | live draft สำหรับ block ปัจจุบัน, finalized ในตำแหน่งเดิม |
| `"off"`                 | ข้อความ Matrix ที่แจ้งเตือนหนึ่งข้อความต่อ block ที่เสร็จแล้ว                     | ข้อความ Matrix ที่แจ้งเตือนหนึ่งข้อความสำหรับ reply แบบเต็ม      |

หมายเหตุ:

- หากตัวอย่างยาวเกินขีดจำกัดขนาดต่อ event ของ Matrix, OpenClaw จะหยุดสตรีมตัวอย่างและ fallback ไปใช้การส่งแบบ final-only
- reply ที่เป็นสื่อจะส่ง attachment ตามปกติเสมอ หากไม่สามารถนำตัวอย่างเก่ากลับมาใช้ได้อย่างปลอดภัยอีกต่อไป OpenClaw จะ redact ตัวอย่างนั้นก่อนส่ง reply สื่อสุดท้าย
- การอัปเดตตัวอย่าง tool-progress จะเปิดใช้โดยค่าเริ่มต้นเมื่อการสตรีมตัวอย่างของ Matrix active อยู่ ตั้ง `streaming.preview.toolProgress: false` เพื่อคงการแก้ไขตัวอย่างสำหรับข้อความคำตอบไว้ แต่ปล่อยให้ tool progress อยู่ในเส้นทางการส่งปกติ
- การแก้ไขตัวอย่างมีต้นทุนเป็น API calls ของ Matrix เพิ่มเติม ใช้ `streaming: "off"` ต่อไปหากคุณต้องการ profile rate-limit ที่ระมัดระวังที่สุด

## Metadata การอนุมัติ

prompt การอนุมัติแบบ native ของ Matrix เป็น event `m.room.message` ปกติที่มีเนื้อหา event แบบ custom เฉพาะ OpenClaw ใต้ `com.openclaw.approval` Matrix อนุญาตคีย์ event-content แบบ custom ดังนั้นไคลเอนต์ทั่วไปยังคง render body ข้อความ ในขณะที่ไคลเอนต์ที่รองรับ OpenClaw สามารถอ่าน approval id, kind, state, การตัดสินใจที่มีให้เลือก และรายละเอียด exec/plugin แบบมีโครงสร้างได้

เมื่อ prompt การอนุมัติยาวเกินหนึ่ง event ของ Matrix, OpenClaw จะแบ่งข้อความที่มองเห็นเป็น chunk และแนบ `com.openclaw.approval` กับ chunk แรกเท่านั้น รีแอ็กชันสำหรับการตัดสินใจ allow/deny จะผูกกับ event แรกนั้น ดังนั้น prompt ที่ยาวจะยังคงเป้าหมายการอนุมัติเดียวกับ prompt แบบ event เดียว

### Push rules แบบ self-hosted สำหรับตัวอย่างที่ finalized แบบเงียบ

`streaming: "quiet"` จะแจ้งเตือนผู้รับก็ต่อเมื่อ block หรือ turn ถูก finalized แล้วเท่านั้น - push rule รายผู้ใช้ต้องตรงกับ marker ของตัวอย่างที่ finalized แล้ว ดู [Matrix push rules สำหรับตัวอย่างแบบเงียบ](/th/channels/matrix-push-rules) สำหรับ recipe แบบเต็ม (โทเค็นผู้รับ, การตรวจ pusher, การติดตั้ง rule, หมายเหตุราย homeserver)

## ห้องแบบบอตถึงบอต

โดยค่าเริ่มต้น ข้อความ Matrix จากบัญชี Matrix ของ OpenClaw อื่นที่กำหนดค่าไว้จะถูกละเว้น

ใช้ `allowBots` เมื่อคุณตั้งใจต้องการ traffic Matrix ระหว่างเอเจนต์:

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
- `allowBots: "mentions"` ยอมรับข้อความเหล่านั้นเฉพาะเมื่อข้อความกล่าวถึงบอตนี้อย่างเห็นได้ชัดในห้อง DM ยังได้รับอนุญาตอยู่
- `groups.<room>.allowBots` override การตั้งค่าระดับบัญชีสำหรับห้องเดียว
- OpenClaw ยังคงละเว้นข้อความจาก Matrix user ID เดียวกันเพื่อหลีกเลี่ยง self-reply loops
- Matrix ไม่ได้เปิดเผย bot flag แบบ native ที่นี่; OpenClaw ถือว่า "bot-authored" คือ "ส่งโดยบัญชี Matrix อื่นที่กำหนดค่าไว้บน OpenClaw gateway นี้"

ใช้ room allowlist และข้อกำหนดการ mention ที่เข้มงวดเมื่อเปิดใช้ traffic แบบบอตถึงบอตในห้องที่ใช้ร่วมกัน

## การเข้ารหัสและการยืนยัน

ในห้องที่เข้ารหัส (E2EE) event รูปภาพขาออกจะใช้ `thumbnail_file` เพื่อให้ตัวอย่างรูปภาพถูกเข้ารหัสไปพร้อมกับ attachment แบบเต็ม ห้องที่ไม่ได้เข้ารหัสยังคงใช้ `thumbnail_url` แบบธรรมดา ไม่ต้องกำหนดค่าใด ๆ - Plugin จะตรวจจับสถานะ E2EE โดยอัตโนมัติ

คำสั่ง `openclaw matrix` ทั้งหมดรับ `--verbose` (diagnostics แบบเต็ม), `--json` (output ที่อ่านได้ด้วยเครื่อง) และ `--account <id>` (การตั้งค่าหลายบัญชี) Output จะกระชับโดยค่าเริ่มต้นพร้อมการ logging ของ SDK ภายในแบบเงียบ ตัวอย่างด้านล่างแสดงรูปแบบ canonical; เพิ่ม flag ตามต้องการ

### เปิดใช้การเข้ารหัส

```bash
openclaw matrix encryption setup
```

บูตสแตรปที่เก็บข้อมูลลับและการเซ็นข้าม สร้างสำรอง room-key หากจำเป็น จากนั้นพิมพ์สถานะและขั้นตอนถัดไป แฟล็กที่มีประโยชน์:

- `--recovery-key <key>` ใช้ recovery key ก่อนบูตสแตรป (แนะนำให้ใช้รูปแบบ stdin ที่ระบุไว้ด้านล่าง)
- `--force-reset-cross-signing` ทิ้งตัวตน cross-signing ปัจจุบันและสร้างใหม่ (ใช้เฉพาะเมื่อตั้งใจเท่านั้น)

สำหรับบัญชีใหม่ ให้เปิดใช้ E2EE ตอนสร้างบัญชี:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` เป็น alias ของ `--enable-e2ee`

ค่าคอนฟิกแบบแมนนวลที่เทียบเท่า:

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

`verify status` รายงานสัญญาณความเชื่อถืออิสระ 3 รายการ (`--verbose` แสดงทั้งหมด):

- `Locally trusted`: เชื่อถือโดยไคลเอนต์นี้เท่านั้น
- `Cross-signing verified`: SDK รายงานการยืนยันผ่าน cross-signing
- `Signed by owner`: เซ็นด้วยคีย์ self-signing ของคุณเอง (สำหรับวินิจฉัยเท่านั้น)

`Verified by owner` จะเป็น `yes` ก็ต่อเมื่อ `Cross-signing verified` เป็น `yes` เท่านั้น ความเชื่อถือในเครื่องหรือการเซ็นของเจ้าของเพียงอย่างเดียวไม่เพียงพอ

`--allow-degraded-local-state` ส่งคืนการวินิจฉัยแบบดีที่สุดเท่าที่ทำได้โดยไม่ต้องเตรียมบัญชี Matrix ก่อน มีประโยชน์สำหรับการตรวจสอบแบบออฟไลน์หรือที่คอนฟิกไว้เพียงบางส่วน

### ยืนยันอุปกรณ์นี้ด้วย recovery key

recovery key เป็นข้อมูลอ่อนไหว - ให้ pipe ผ่าน stdin แทนการส่งบนบรรทัดคำสั่ง ตั้งค่า `MATRIX_RECOVERY_KEY` (หรือ `MATRIX_<ID>_RECOVERY_KEY` สำหรับบัญชีที่มีชื่อ):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

คำสั่งรายงาน 3 สถานะ:

- `Recovery key accepted`: Matrix ยอมรับคีย์สำหรับที่เก็บข้อมูลลับหรือความเชื่อถือของอุปกรณ์
- `Backup usable`: สามารถโหลดสำรอง room-key ด้วยวัสดุกู้คืนที่เชื่อถือได้
- `Device verified by owner`: อุปกรณ์นี้มีความเชื่อถือตัวตน Matrix cross-signing เต็มรูปแบบ

คำสั่งจะออกด้วยสถานะไม่เป็นศูนย์เมื่อความเชื่อถือตัวตนเต็มรูปแบบยังไม่สมบูรณ์ แม้ว่า recovery key จะปลดล็อกวัสดุสำรองได้แล้วก็ตาม ในกรณีนั้น ให้ทำ self-verification ให้เสร็จจากไคลเอนต์ Matrix อื่น:

```bash
openclaw matrix verify self
```

`verify self` รอจนกว่า `Cross-signing verified: yes` ก่อนจะออกสำเร็จ ใช้ `--timeout-ms <ms>` เพื่อปรับเวลารอ

รูปแบบคีย์ตรง `openclaw matrix verify device "<recovery-key>"` ก็รับได้เช่นกัน แต่คีย์จะถูกบันทึกไว้ในประวัติ shell ของคุณ

### บูตสแตรปหรือซ่อม cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` เป็นคำสั่งซ่อมแซมและตั้งค่าสำหรับบัญชีที่เข้ารหัส ตามลำดับ คำสั่งจะ:

- บูตสแตรปที่เก็บข้อมูลลับ โดยใช้ recovery key ที่มีอยู่ซ้ำเมื่อทำได้
- บูตสแตรป cross-signing และอัปโหลด public keys ที่ขาดหาย
- ทำเครื่องหมายและเซ็นข้ามอุปกรณ์ปัจจุบัน
- สร้างสำรอง room-key ฝั่งเซิร์ฟเวอร์หากยังไม่มี

หาก homeserver ต้องใช้ UIA เพื่ออัปโหลดคีย์ cross-signing, OpenClaw จะลองแบบไม่ auth ก่อน จากนั้น `m.login.dummy` แล้วจึง `m.login.password` (ต้องมี `channels.matrix.password`)

แฟล็กที่มีประโยชน์:

- `--recovery-key-stdin` (ใช้คู่กับ `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) หรือ `--recovery-key <key>`
- `--force-reset-cross-signing` เพื่อทิ้งตัวตน cross-signing ปัจจุบัน (เฉพาะเมื่อตั้งใจเท่านั้น)

### สำรอง room-key

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` แสดงว่ามีสำรองฝั่งเซิร์ฟเวอร์หรือไม่ และอุปกรณ์นี้ถอดรหัสได้หรือไม่ `backup restore` นำเข้า room keys ที่สำรองไว้เข้าสู่ crypto store ในเครื่อง หาก recovery key อยู่บนดิสก์แล้ว คุณสามารถละ `--recovery-key-stdin` ได้

เพื่อแทนที่สำรองที่เสียด้วย baseline ใหม่ (ยอมรับการสูญเสียประวัติเก่าที่กู้คืนไม่ได้ และยังสามารถสร้างที่เก็บข้อมูลลับใหม่ได้หากโหลด secret ของสำรองปัจจุบันไม่ได้):

```bash
openclaw matrix verify backup reset --yes
```

เพิ่ม `--rotate-recovery-key` เฉพาะเมื่อคุณตั้งใจให้ recovery key เดิมไม่สามารถปลดล็อก baseline สำรองใหม่ได้อีกต่อไป

### การแสดงรายการ การส่งคำขอ และการตอบสนองต่อการยืนยัน

```bash
openclaw matrix verify list
```

แสดงรายการคำขอยืนยันที่รอดำเนินการสำหรับบัญชีที่เลือก

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

ส่งคำขอยืนยันจากบัญชี OpenClaw นี้ `--own-user` ขอ self-verification (คุณยอมรับพรอมป์ในไคลเอนต์ Matrix อื่นของผู้ใช้เดียวกัน); `--user-id`/`--device-id`/`--room-id` ระบุเป้าหมายเป็นบุคคลอื่น ไม่สามารถใช้ `--own-user` ร่วมกับแฟล็กระบุเป้าหมายอื่นได้

สำหรับการจัดการ lifecycle ระดับล่างกว่า - โดยทั่วไปขณะติดตามคำขอขาเข้าจากไคลเอนต์อื่น - คำสั่งเหล่านี้ทำงานกับคำขอ `<id>` ที่ระบุ (พิมพ์โดย `verify list` และ `verify request`):

| คำสั่ง                                    | จุดประสงค์                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | ยอมรับคำขอขาเข้า                                           |
| `openclaw matrix verify start <id>`        | เริ่มโฟลว์ SAS                                                  |
| `openclaw matrix verify sas <id>`          | พิมพ์อีโมจิหรือเลขทศนิยมของ SAS                                     |
| `openclaw matrix verify confirm-sas <id>`  | ยืนยันว่า SAS ตรงกับสิ่งที่ไคลเอนต์อื่นแสดง            |
| `openclaw matrix verify mismatch-sas <id>` | ปฏิเสธ SAS เมื่ออีโมจิหรือเลขทศนิยมไม่ตรงกัน              |
| `openclaw matrix verify cancel <id>`       | ยกเลิก; รับ `--reason <text>` และ `--code <matrix-code>` แบบไม่บังคับ |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, และ `cancel` ทั้งหมดรับ `--user-id` และ `--room-id` เป็นคำใบ้ DM follow-up เมื่อการยืนยันถูกผูกกับห้องข้อความตรงที่ระบุ

### หมายเหตุสำหรับหลายบัญชี

หากไม่มี `--account <id>` คำสั่ง Matrix CLI จะใช้บัญชีเริ่มต้นโดยนัย หากคุณมีหลายบัญชีที่ตั้งชื่อไว้และยังไม่ได้ตั้ง `channels.matrix.defaultAccount` คำสั่งจะปฏิเสธการเดาและขอให้คุณเลือก เมื่อ E2EE ถูกปิดใช้หรือไม่พร้อมใช้งานสำหรับบัญชีที่ตั้งชื่อไว้ ข้อผิดพลาดจะชี้ไปยังคีย์คอนฟิกของบัญชีนั้น เช่น `channels.matrix.accounts.assistant.encryption`

<AccordionGroup>
  <Accordion title="Startup behavior">
    เมื่อมี `encryption: true`, `startupVerification` จะมีค่าเริ่มต้นเป็น `"if-unverified"` ตอนเริ่มทำงาน อุปกรณ์ที่ยังไม่ได้ยืนยันจะขอ self-verification ในไคลเอนต์ Matrix อื่น โดยข้ามรายการซ้ำและใช้ cooldown (ค่าเริ่มต้น 24 ชั่วโมง) ปรับด้วย `startupVerificationCooldownHours` หรือปิดใช้ด้วย `startupVerification: "off"`

    ตอนเริ่มทำงานยังรันรอบ crypto bootstrap แบบอนุรักษ์นิยมซึ่งใช้ที่เก็บข้อมูลลับและตัวตน cross-signing ปัจจุบันซ้ำ หากสถานะ bootstrap เสีย OpenClaw จะพยายามซ่อมแบบมีการป้องกันแม้ไม่มี `channels.matrix.password`; หาก homeserver ต้องใช้ password UIA ตอนเริ่มทำงานจะบันทึกคำเตือนและยังไม่ถือเป็นข้อผิดพลาดร้ายแรง อุปกรณ์ที่ owner-signed แล้วจะถูกเก็บรักษาไว้

    ดู [การย้ายข้อมูล Matrix](/th/channels/matrix-migration) สำหรับโฟลว์อัปเกรดฉบับเต็ม

  </Accordion>

  <Accordion title="Verification notices">
    Matrix โพสต์ประกาศ lifecycle การยืนยันเข้าไปในห้อง DM การยืนยันแบบ strict เป็นข้อความ `m.notice`: คำขอ, พร้อม (พร้อมคำแนะนำ "ยืนยันด้วยอีโมจิ"), เริ่ม/เสร็จสมบูรณ์ และรายละเอียด SAS (อีโมจิ/เลขทศนิยม) เมื่อมี

    คำขอขาเข้าจากไคลเอนต์ Matrix อื่นจะถูกติดตามและยอมรับอัตโนมัติ สำหรับ self-verification, OpenClaw จะเริ่มโฟลว์ SAS อัตโนมัติและยืนยันฝั่งของตัวเองเมื่อมีการยืนยันด้วยอีโมจิแล้ว - คุณยังต้องเปรียบเทียบและยืนยัน "ตรงกัน" ในไคลเอนต์ Matrix ของคุณ

    ประกาศระบบการยืนยันจะไม่ถูกส่งต่อไปยัง pipeline แชตของ agent

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    หาก `verify status` บอกว่าอุปกรณ์ปัจจุบันไม่มีอยู่ในรายการบน homeserver อีกต่อไป ให้สร้างอุปกรณ์ Matrix ของ OpenClaw ใหม่ สำหรับการเข้าสู่ระบบด้วยรหัสผ่าน:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    สำหรับ token auth ให้สร้าง access token ใหม่ในไคลเอนต์ Matrix หรือ UI ผู้ดูแลระบบของคุณ จากนั้นอัปเดต OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    แทนที่ `assistant` ด้วย ID บัญชีจากคำสั่งที่ล้มเหลว หรือละ `--account` สำหรับบัญชีเริ่มต้น

  </Accordion>

  <Accordion title="Device hygiene">
    อุปกรณ์ที่จัดการโดย OpenClaw รุ่นเก่าสามารถสะสมได้ แสดงรายการและตัดรายการเก่า:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE ใช้เส้นทาง crypto ของ Rust ใน `matrix-js-sdk` ทางการ โดยมี `fake-indexeddb` เป็น shim ของ IndexedDB สถานะ crypto ถูกเก็บต่อเนื่องไปที่ `crypto-idb-snapshot.json` (สิทธิ์ไฟล์แบบจำกัด)

    สถานะ runtime ที่เข้ารหัสอยู่ภายใต้ `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` และรวมถึง sync store, crypto store, recovery key, IDB snapshot, thread bindings และสถานะ startup verification เมื่อ token เปลี่ยนแต่ตัวตนบัญชียังคงเดิม OpenClaw จะใช้ root เดิมที่ดีที่สุดซ้ำเพื่อให้สถานะก่อนหน้ายังคงมองเห็นได้

  </Accordion>
</AccordionGroup>

## การจัดการโปรไฟล์

อัปเดต self-profile ของ Matrix สำหรับบัญชีที่เลือก:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

คุณสามารถส่งทั้งสองตัวเลือกในครั้งเดียวได้ Matrix รับ URL avatar แบบ `mxc://` โดยตรง; เมื่อคุณส่ง `http://` หรือ `https://`, OpenClaw จะอัปโหลดไฟล์ก่อน แล้วเก็บ URL `mxc://` ที่ resolve แล้วลงใน `channels.matrix.avatarUrl` (หรือ override เฉพาะบัญชี)

## เธรด

Matrix รองรับเธรด Matrix แบบ native ทั้งสำหรับการตอบกลับอัตโนมัติและการส่งผ่าน message-tool มี knob อิสระ 2 ตัวควบคุมพฤติกรรม:

### การกำหนดเส้นทางเซสชัน (`sessionScope`)

`dm.sessionScope` ตัดสินว่าห้อง Matrix DM จะแมปกับเซสชัน OpenClaw อย่างไร:

- `"per-user"` (ค่าเริ่มต้น): ห้อง DM ทั้งหมดที่มี peer ที่กำหนดเส้นทางเดียวกันใช้เซสชันเดียวร่วมกัน
- `"per-room"`: ห้อง Matrix DM แต่ละห้องได้คีย์เซสชันของตัวเอง แม้ว่า peer จะเป็นคนเดียวกันก็ตาม

การผูก conversation แบบชัดเจนจะชนะ `sessionScope` เสมอ ดังนั้นห้องและเธรดที่ผูกไว้จะเก็บเซสชันเป้าหมายที่เลือกไว้

### การตอบกลับในเธรด (`threadReplies`)

`threadReplies` ตัดสินว่าบอตจะโพสต์คำตอบไว้ที่ใด:

- `"off"`: คำตอบเป็นระดับบนสุด ข้อความ threaded ขาเข้าจะอยู่ในเซสชัน parent
- `"inbound"`: ตอบกลับภายในเธรดเฉพาะเมื่อข้อความขาเข้าอยู่ในเธรดนั้นอยู่แล้ว
- `"always"`: ตอบกลับภายในเธรดที่มีข้อความที่ทริกเกอร์เป็น root; conversation นั้นจะถูกกำหนดเส้นทางผ่านเซสชันแบบ thread-scoped ที่ตรงกันตั้งแต่ trigger แรกเป็นต้นไป

`dm.threadReplies` override ค่านี้สำหรับ DM เท่านั้น - เช่น แยกเธรดของห้องออกจากกันขณะทำให้ DM เป็นแบบ flat

### การสืบทอดเธรดและคำสั่ง slash

- ข้อความแบบเธรดขาเข้าจะรวมข้อความรากของเธรดเป็นบริบทเอเจนต์เพิ่มเติม
- การส่งด้วยเครื่องมือข้อความจะสืบทอดเธรด Matrix ปัจจุบันโดยอัตโนมัติเมื่อส่งไปยังห้องเดียวกัน (หรือเป้าหมายผู้ใช้ DM เดียวกัน) เว้นแต่จะระบุ `threadId` อย่างชัดเจน
- การใช้เป้าหมายผู้ใช้ DM ซ้ำจะทำงานเฉพาะเมื่อเมตาดาต้าเซสชันปัจจุบันพิสูจน์ได้ว่าเป็นคู่สนทนา DM เดียวกันบนบัญชี Matrix เดียวกัน มิฉะนั้น OpenClaw จะถอยกลับไปใช้การกำหนดเส้นทางตามขอบเขตผู้ใช้ตามปกติ
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และ `/acp spawn` ที่ผูกกับเธรดทั้งหมดใช้งานได้ในห้อง Matrix และ DM
- `/focus` ระดับบนสุดจะสร้างเธรด Matrix ใหม่และผูกเข้ากับเซสชันเป้าหมายเมื่อเปิดใช้ `threadBindings.spawnSessions`
- การเรียกใช้ `/focus` หรือ `/acp spawn --thread here` ภายในเธรด Matrix ที่มีอยู่จะผูกเธรดนั้นไว้ที่เดิม

เมื่อ OpenClaw ตรวจพบว่าห้อง DM ของ Matrix ชนกับห้อง DM อื่นบนเซสชันที่ใช้ร่วมกันเดียวกัน ระบบจะโพสต์ `m.notice` แบบครั้งเดียวในห้องนั้น โดยชี้ไปยังทางออก `/focus` และแนะนำให้เปลี่ยน `dm.sessionScope` การแจ้งเตือนนี้จะแสดงเฉพาะเมื่อเปิดใช้การผูกเธรด

## การผูกบทสนทนา ACP

ห้อง Matrix, DM และเธรด Matrix ที่มีอยู่สามารถแปลงเป็นพื้นที่ทำงาน ACP แบบคงทนได้โดยไม่ต้องเปลี่ยนพื้นผิวแชต

ขั้นตอนด่วนสำหรับผู้ปฏิบัติงาน:

- เรียกใช้ `/acp spawn codex --bind here` ภายใน DM ของ Matrix, ห้อง หรือเธรดที่มีอยู่ที่คุณต้องการใช้งานต่อ
- ใน DM หรือห้อง Matrix ระดับบนสุด DM/ห้องปัจจุบันจะยังคงเป็นพื้นผิวแชต และข้อความในอนาคตจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่สร้างขึ้น
- ภายในเธรด Matrix ที่มีอยู่ `--bind here` จะผูกเธรดปัจจุบันนั้นไว้ที่เดิม
- `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP ที่ผูกไว้เดิมที่ตำแหน่งเดิม
- `/acp close` จะปิดเซสชัน ACP และลบการผูก

หมายเหตุ:

- `--bind here` จะไม่สร้างเธรด Matrix ลูก
- `threadBindings.spawnSessions` ควบคุม `/acp spawn --thread auto|here` ซึ่ง OpenClaw จำเป็นต้องสร้างหรือผูกเธรด Matrix ลูก

### การกำหนดค่าการผูกเธรด

Matrix สืบทอดค่าเริ่มต้นส่วนกลางจาก `session.threadBindings` และยังรองรับการแทนที่ค่าต่อช่องทาง:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

การสร้างเซสชันที่ผูกกับเธรด Matrix เปิดเป็นค่าเริ่มต้น:

- ตั้งค่า `threadBindings.spawnSessions: false` เพื่อบล็อกไม่ให้ `/focus` ระดับบนสุดและ `/acp spawn --thread auto|here` สร้าง/ผูกเธรด Matrix
- ตั้งค่า `threadBindings.defaultSpawnContext: "isolated"` เมื่อการสร้างเธรดย่อยของเอเจนต์แบบเนทีฟไม่ควร fork transcript ของพาเรนต์

## รีแอ็กชัน

Matrix รองรับรีแอ็กชันขาออก การแจ้งเตือนรีแอ็กชันขาเข้า และรีแอ็กชันตอบรับ

เครื่องมือรีแอ็กชันขาออกถูกควบคุมโดย `channels.matrix.actions.reactions`:

- `react` เพิ่มรีแอ็กชันให้กับเหตุการณ์ Matrix
- `reactions` แสดงสรุปรีแอ็กชันปัจจุบันสำหรับเหตุการณ์ Matrix
- `emoji=""` ลบรีแอ็กชันของบอตเองในเหตุการณ์นั้น
- `remove: true` ลบเฉพาะรีแอ็กชันอีโมจิที่ระบุจากบอต

**ลำดับการแก้ค่า** (ค่าที่กำหนดไว้ก่อนจะชนะ):

| การตั้งค่า              | ลำดับ                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | ต่อบัญชี → ช่องทาง → `messages.ackReaction` → อีโมจิสำรองของตัวตนเอเจนต์        |
| `ackReactionScope`      | ต่อบัญชี → ช่องทาง → `messages.ackReactionScope` → ค่าเริ่มต้น `"group-mentions"` |
| `reactionNotifications` | ต่อบัญชี → ช่องทาง → ค่าเริ่มต้น `"own"`                                         |

`reactionNotifications: "own"` ส่งต่อเหตุการณ์ `m.reaction` ที่เพิ่มเข้ามาเมื่อเหตุการณ์เหล่านั้นมีเป้าหมายเป็นข้อความ Matrix ที่บอตเขียนเอง; `"off"` ปิดใช้เหตุการณ์ระบบรีแอ็กชัน การลบรีแอ็กชันจะไม่ถูกสร้างเป็นเหตุการณ์ระบบ เพราะ Matrix แสดงสิ่งเหล่านั้นเป็นการแก้ไขแบบ redaction ไม่ใช่การลบ `m.reaction` แบบแยกเดี่ยว

## บริบทประวัติ

- `channels.matrix.historyLimit` ควบคุมจำนวนข้อความล่าสุดในห้องที่จะถูกรวมเป็น `InboundHistory` เมื่อข้อความในห้อง Matrix กระตุ้นเอเจนต์ ถอยกลับไปใช้ `messages.groupChat.historyLimit`; หากไม่ได้ตั้งค่าทั้งสอง ค่าเริ่มต้นที่มีผลคือ `0` ตั้งค่า `0` เพื่อปิดใช้
- ประวัติห้อง Matrix จำกัดเฉพาะห้องเท่านั้น DM ยังคงใช้ประวัติเซสชันตามปกติ
- ประวัติห้อง Matrix เป็นแบบรอดำเนินการเท่านั้น: OpenClaw บัฟเฟอร์ข้อความห้องที่ยังไม่ได้กระตุ้นการตอบกลับ จากนั้นจึง snapshot หน้าต่างนั้นเมื่อมีการกล่าวถึงหรือทริกเกอร์อื่นมาถึง
- ข้อความทริกเกอร์ปัจจุบันจะไม่ถูกรวมใน `InboundHistory`; ข้อความนั้นยังคงอยู่ในเนื้อหาขาเข้าหลักสำหรับรอบนั้น
- การลองซ้ำของเหตุการณ์ Matrix เดียวกันจะใช้ snapshot ประวัติต้นฉบับซ้ำ แทนที่จะเลื่อนไปข้างหน้าเป็นข้อความห้องใหม่กว่า

## การมองเห็นบริบท

Matrix รองรับการควบคุม `contextVisibility` ที่ใช้ร่วมกันสำหรับบริบทห้องเสริม เช่น ข้อความตอบกลับที่ดึงมา รากเธรด และประวัติที่รอดำเนินการ

- `contextVisibility: "all"` เป็นค่าเริ่มต้น บริบทเสริมจะถูกเก็บไว้ตามที่ได้รับ
- `contextVisibility: "allowlist"` กรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่ได้รับอนุญาตโดยการตรวจ allowlist ของห้อง/ผู้ใช้ที่ใช้งานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บคำตอบที่อ้างอิงไว้อย่างชัดเจนหนึ่งรายการ

การตั้งค่านี้มีผลต่อการมองเห็นบริบทเสริม ไม่ใช่ว่าข้อความขาเข้าเองจะสามารถกระตุ้นการตอบกลับได้หรือไม่
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

หากผู้ใช้ Matrix ที่ยังไม่ได้รับอนุมัติส่งข้อความหาคุณต่อก่อนการอนุมัติ OpenClaw จะใช้รหัสจับคู่ที่รอดำเนินการเดิมซ้ำ และอาจส่งคำตอบเตือนหลังช่วงคูลดาวน์สั้น ๆ แทนการสร้างรหัสใหม่

ดู [การจับคู่](/th/channels/pairing) สำหรับโฟลว์การจับคู่ DM ที่ใช้ร่วมกันและรูปแบบการจัดเก็บ

## การซ่อมแซมห้องโดยตรง

หากสถานะข้อความโดยตรงคลาดเคลื่อน OpenClaw อาจลงเอยด้วย mapping `m.direct` ที่ล้าสมัยซึ่งชี้ไปยังห้องเดี่ยวเก่าแทน DM ที่ใช้งานอยู่ ตรวจสอบ mapping ปัจจุบันสำหรับคู่สนทนา:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

ซ่อมแซม:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

ทั้งสองคำสั่งรับ `--account <id>` สำหรับการตั้งค่าแบบหลายบัญชี โฟลว์การซ่อมแซม:

- เลือกใช้ DM แบบ 1:1 ที่เข้มงวดซึ่งถูกแมปไว้แล้วใน `m.direct`
- ถอยกลับไปใช้ DM แบบ 1:1 ที่เข้มงวดซึ่งเข้าร่วมอยู่ในปัจจุบันกับผู้ใช้นั้น
- สร้างห้องโดยตรงใหม่และเขียน `m.direct` ใหม่หากไม่มี DM ที่สมบูรณ์

ระบบจะไม่ลบห้องเก่าโดยอัตโนมัติ ระบบเลือก DM ที่สมบูรณ์และอัปเดต mapping เพื่อให้การส่ง Matrix ในอนาคต การแจ้งเตือนการยืนยัน และโฟลว์ข้อความโดยตรงอื่น ๆ มุ่งไปยังห้องที่ถูกต้อง

## การอนุมัติ exec

Matrix สามารถทำหน้าที่เป็นไคลเอนต์อนุมัติแบบเนทีฟได้ กำหนดค่าภายใต้ `channels.matrix.execApprovals` (หรือ `channels.matrix.accounts.<account>.execApprovals` สำหรับการแทนที่ค่าต่อบัญชี):

- `enabled`: ส่งการอนุมัติผ่านพรอมป์เนทีฟของ Matrix เมื่อไม่ได้ตั้งค่าหรือเป็น `"auto"` Matrix จะเปิดใช้โดยอัตโนมัติเมื่อแก้ผู้อนุมัติได้อย่างน้อยหนึ่งคน ตั้งค่า `false` เพื่อปิดใช้อย่างชัดเจน
- `approvers`: ID ผู้ใช้ Matrix (`@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอ exec ไม่บังคับ - ถอยกลับไปใช้ `channels.matrix.dm.allowFrom`
- `target`: ตำแหน่งที่จะส่งพรอมป์ `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ; `"channel"` ส่งไปยังห้อง Matrix หรือ DM ต้นทาง; `"both"` ส่งไปทั้งสองที่
- `agentFilter` / `sessionFilter`: allowlist ไม่บังคับสำหรับเอเจนต์/เซสชันที่จะทริกเกอร์การส่งผ่าน Matrix

การอนุญาตแตกต่างกันเล็กน้อยระหว่างชนิดการอนุมัติ:

- **การอนุมัติ exec** ใช้ `execApprovals.approvers` โดยถอยกลับไปใช้ `dm.allowFrom`
- **การอนุมัติ Plugin** อนุญาตผ่าน `dm.allowFrom` เท่านั้น

ทั้งสองชนิดใช้ทางลัดรีแอ็กชันของ Matrix และการอัปเดตข้อความร่วมกัน ผู้อนุมัติจะเห็นทางลัดรีแอ็กชันบนข้อความอนุมัติหลัก:

- `✅` อนุญาตครั้งเดียว
- `❌` ปฏิเสธ
- `♾️` อนุญาตเสมอ (เมื่อนโยบาย exec ที่มีผลอนุญาต)

คำสั่ง slash สำรอง: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`

เฉพาะผู้อนุมัติที่แก้ได้เท่านั้นที่สามารถอนุมัติหรือปฏิเสธได้ การส่งผ่านช่องทางสำหรับการอนุมัติ exec รวมข้อความคำสั่งด้วย - เปิดใช้ `channel` หรือ `both` เฉพาะในห้องที่เชื่อถือได้

ที่เกี่ยวข้อง: [การอนุมัติ exec](/th/tools/exec-approvals)

## คำสั่ง slash

คำสั่ง slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` และอื่น ๆ) ใช้งานได้โดยตรงใน DM ในห้อง OpenClaw ยังรู้จำคำสั่งที่นำหน้าด้วยการกล่าวถึง Matrix ของบอตเองด้วย ดังนั้น `@bot:server /new` จะทริกเกอร์เส้นทางคำสั่งโดยไม่ต้องใช้ regex การกล่าวถึงแบบกำหนดเอง สิ่งนี้ทำให้บอตตอบสนองต่อโพสต์แบบห้องลักษณะ `@mention /command` ที่ Element และไคลเอนต์คล้ายกันปล่อยออกมาเมื่อผู้ใช้กด tab-complete บอตก่อนพิมพ์คำสั่ง

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

- ค่า `channels.matrix` ระดับบนสุดทำหน้าที่เป็นค่าเริ่มต้นสำหรับบัญชีที่มีชื่อ เว้นแต่บัญชีจะ override ค่าเหล่านั้น
- จำกัดขอบเขตรายการห้องที่สืบทอดมาให้เฉพาะบัญชีหนึ่งด้วย `groups.<room>.account` รายการที่ไม่มี `account` จะใช้ร่วมกันระหว่างบัญชี; `account: "default"` ยังใช้งานได้เมื่อกำหนดค่าบัญชีเริ่มต้นไว้ที่ระดับบนสุด

**การเลือกบัญชีเริ่มต้น:**

- ตั้งค่า `defaultAccount` เพื่อเลือกบัญชีที่มีชื่อซึ่งการกำหนดเส้นทางโดยนัย การตรวจสอบ และคำสั่ง CLI ควรใช้เป็นหลัก
- หากคุณมีหลายบัญชีและมีบัญชีหนึ่งชื่อ `default` แบบตรงตัว OpenClaw จะใช้บัญชีนั้นโดยนัยแม้ไม่ได้ตั้งค่า `defaultAccount`
- หากคุณมีบัญชีที่มีชื่อหลายบัญชีและไม่ได้เลือกค่าเริ่มต้น คำสั่ง CLI จะปฏิเสธการเดา - ให้ตั้งค่า `defaultAccount` หรือส่ง `--account <id>`
- บล็อก `channels.matrix.*` ระดับบนสุดจะถูกมองเป็นบัญชี `default` โดยนัยก็ต่อเมื่อข้อมูล auth ครบถ้วน (`homeserver` + `accessToken` หรือ `homeserver` + `userId` + `password`) บัญชีที่มีชื่อยังคงถูกค้นพบได้จาก `homeserver` + `userId` เมื่อข้อมูลประจำตัวที่แคชไว้ครอบคลุม auth แล้ว

**การโปรโมต:**

- เมื่อ OpenClaw โปรโมตการกำหนดค่าแบบบัญชีเดียวเป็นหลายบัญชีระหว่างการซ่อมแซมหรือตั้งค่า ระบบจะรักษาบัญชีที่มีชื่อเดิมไว้หากมีอยู่ หรือหาก `defaultAccount` ชี้ไปยังบัญชีหนึ่งแล้ว เฉพาะคีย์ auth/bootstrap ของ Matrix เท่านั้นที่จะย้ายเข้าไปยังบัญชีที่ถูกโปรโมต; คีย์นโยบายการส่งที่ใช้ร่วมกันจะยังอยู่ที่ระดับบนสุด

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบหลายบัญชีที่ใช้ร่วมกัน

## homeserver ส่วนตัว/LAN

ตามค่าเริ่มต้น OpenClaw จะบล็อก homeserver Matrix แบบส่วนตัว/ภายในเพื่อป้องกัน SSRF เว้นแต่คุณจะ
เลือกใช้อย่างชัดเจนต่อบัญชี

หาก homeserver ของคุณทำงานบน localhost, IP ของ LAN/Tailscale หรือชื่อโฮสต์ภายใน ให้เปิดใช้
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

ตัวอย่างการตั้งค่าผ่าน CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

การเลือกเปิดใช้นี้อนุญาตเฉพาะเป้าหมายส่วนตัว/ภายในที่เชื่อถือได้เท่านั้น homeserver แบบข้อความไม่เข้ารหัสสาธารณะ เช่น
`http://matrix.example.org:8008` ยังคงถูกบล็อก ควรใช้ `https://` เมื่อเป็นไปได้

## การพร็อกซีทราฟฟิก Matrix

หากการติดตั้ง Matrix ของคุณต้องใช้พร็อกซี HTTP(S) ขาออกแบบระบุชัดเจน ให้ตั้งค่า `channels.matrix.proxy`:

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

บัญชีที่มีชื่อสามารถแทนที่ค่าเริ่มต้นระดับบนสุดได้ด้วย `channels.matrix.accounts.<id>.proxy`
OpenClaw ใช้การตั้งค่าพร็อกซีเดียวกันสำหรับทราฟฟิก Matrix ระหว่างรันไทม์และการตรวจสอบสถานะบัญชี

## การแก้ไขเป้าหมาย

Matrix ยอมรับรูปแบบเป้าหมายต่อไปนี้ในทุกที่ที่ OpenClaw ขอเป้าหมายห้องหรือผู้ใช้จากคุณ:

- ผู้ใช้: `@user:server`, `user:@user:server`, หรือ `matrix:user:@user:server`
- ห้อง: `!room:server`, `room:!room:server`, หรือ `matrix:room:!room:server`
- นามแฝง: `#alias:server`, `channel:#alias:server`, หรือ `matrix:channel:#alias:server`

ID ห้อง Matrix แยกตัวพิมพ์เล็กและตัวพิมพ์ใหญ่ ใช้ตัวพิมพ์ของ ID ห้องให้ตรงกับใน Matrix
เมื่อกำหนดค่าเป้าหมายการส่งที่ระบุชัดเจน, งาน cron, การผูกค่า, หรือ allowlist
OpenClaw เก็บคีย์เซสชันภายในในรูปแบบมาตรฐานสำหรับการจัดเก็บ ดังนั้นคีย์ตัวพิมพ์เล็กเหล่านั้น
จึงไม่ใช่แหล่งข้อมูลที่เชื่อถือได้สำหรับ ID การส่งของ Matrix

การค้นหาไดเรกทอรีแบบสดใช้บัญชี Matrix ที่เข้าสู่ระบบอยู่:

- การค้นหาผู้ใช้จะคิวรีไดเรกทอรีผู้ใช้ Matrix บน homeserver นั้น
- การค้นหาห้องยอมรับ ID ห้องและนามแฝงที่ระบุชัดเจนโดยตรง จากนั้นจึงย้อนกลับไปค้นหาชื่อห้องที่บัญชีนั้นเข้าร่วมอยู่
- การค้นหาชื่อห้องที่เข้าร่วมอยู่เป็นแบบพยายามให้ดีที่สุด หากไม่สามารถแก้ชื่อห้องเป็น ID หรือนามแฝงได้ ชื่อนั้นจะถูกละเว้นในการแก้ไข allowlist ระหว่างรันไทม์

## อ้างอิงการกำหนดค่า

ฟิลด์แบบ allowlist (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) ยอมรับ ID ผู้ใช้ Matrix แบบเต็ม (ปลอดภัยที่สุด) รายการที่ตรงกับไดเรกทอรีแบบตรงตัวจะถูกแก้ไขเมื่อเริ่มต้นและทุกครั้งที่ allowlist เปลี่ยนขณะที่มอนิเตอร์กำลังทำงาน รายการที่ไม่สามารถแก้ไขได้จะถูกละเว้นระหว่างรันไทม์ allowlist ของห้องควรใช้ ID ห้องหรือนามแฝงด้วยเหตุผลเดียวกัน

### บัญชีและการเชื่อมต่อ

- `enabled`: เปิดหรือปิดใช้งานช่องทาง
- `name`: ป้ายชื่อที่แสดงสำหรับบัญชี ซึ่งระบุหรือไม่ก็ได้
- `defaultAccount`: ID บัญชีที่ต้องการใช้เมื่อกำหนดค่าบัญชี Matrix หลายบัญชี
- `accounts`: การแทนที่แบบตั้งชื่อต่อบัญชี ค่า `channels.matrix` ระดับบนสุดจะถูกสืบทอดเป็นค่าเริ่มต้น
- `homeserver`: URL ของ homeserver เช่น `https://matrix.example.org`
- `network.dangerouslyAllowPrivateNetwork`: อนุญาตให้บัญชีนี้เชื่อมต่อกับ `localhost`, IP บน LAN/Tailscale, หรือชื่อโฮสต์ภายใน
- `proxy`: URL พร็อกซี HTTP(S) สำหรับทราฟฟิก Matrix ซึ่งระบุหรือไม่ก็ได้ รองรับการแทนที่ต่อบัญชี
- `userId`: ID ผู้ใช้ Matrix แบบเต็ม (`@bot:example.org`)
- `accessToken`: access token สำหรับการยืนยันตัวตนแบบใช้โทเค็น รองรับค่าข้อความธรรมดาและ SecretRef ผ่านผู้ให้บริการ env/file/exec ([การจัดการความลับ](/th/gateway/secrets))
- `password`: รหัสผ่านสำหรับการเข้าสู่ระบบด้วยรหัสผ่าน รองรับค่าข้อความธรรมดาและ SecretRef
- `deviceId`: ID อุปกรณ์ Matrix ที่ระบุชัดเจน
- `deviceName`: ชื่อแสดงของอุปกรณ์ที่ใช้ในเวลาล็อกอินด้วยรหัสผ่าน
- `avatarUrl`: URL อวาตาร์ของตนเองที่จัดเก็บไว้สำหรับการซิงก์โปรไฟล์และการอัปเดต `profile set`
- `initialSyncLimit`: จำนวนเหตุการณ์สูงสุดที่ดึงระหว่างการซิงก์ตอนเริ่มต้น

### การเข้ารหัส

- `encryption`: เปิดใช้งาน E2EE ค่าเริ่มต้น: `false`
- `startupVerification`: `"if-unverified"` (ค่าเริ่มต้นเมื่อเปิด E2EE) หรือ `"off"` ขอการยืนยันตนเองโดยอัตโนมัติเมื่อเริ่มต้นหากอุปกรณ์นี้ยังไม่ได้รับการยืนยัน
- `startupVerificationCooldownHours`: ระยะพักก่อนคำขอเริ่มต้นอัตโนมัติครั้งถัดไป ค่าเริ่มต้น: `24`

### การเข้าถึงและนโยบาย

- `groupPolicy`: `"open"`, `"allowlist"`, หรือ `"disabled"` ค่าเริ่มต้น: `"allowlist"`
- `groupAllowFrom`: allowlist ของ ID ผู้ใช้สำหรับทราฟฟิกห้อง
- `dm.enabled`: เมื่อเป็น `false` ให้ละเว้น DM ทั้งหมด ค่าเริ่มต้น: `true`
- `dm.policy`: `"pairing"` (ค่าเริ่มต้น), `"allowlist"`, `"open"`, หรือ `"disabled"` มีผลหลังจากบอทเข้าร่วมและจำแนกห้องว่าเป็น DM แล้ว ไม่ส่งผลต่อการจัดการคำเชิญ
- `dm.allowFrom`: allowlist ของ ID ผู้ใช้สำหรับทราฟฟิก DM
- `dm.sessionScope`: `"per-user"` (ค่าเริ่มต้น) หรือ `"per-room"`
- `dm.threadReplies`: การแทนที่เฉพาะ DM สำหรับการตอบกลับแบบเธรด (`"off"`, `"inbound"`, `"always"`)
- `allowBots`: ยอมรับข้อความจากบัญชีบอท Matrix อื่นที่กำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `allowlistOnly`: เมื่อเป็น `true` จะบังคับนโยบาย DM ที่ทำงานอยู่ทั้งหมด (ยกเว้น `"disabled"`) และนโยบายกลุ่ม `"open"` ให้เป็น `"allowlist"` ไม่เปลี่ยนนโยบาย `"disabled"`
- `autoJoin`: `"always"`, `"allowlist"`, หรือ `"off"` ค่าเริ่มต้น: `"off"` ใช้กับคำเชิญ Matrix ทุกประเภท รวมถึงคำเชิญแบบ DM
- `autoJoinAllowlist`: ห้อง/นามแฝงที่อนุญาตเมื่อ `autoJoin` เป็น `"allowlist"` รายการนามแฝงจะถูกแก้ไขเทียบกับ homeserver ไม่ใช่เทียบกับสถานะที่ห้องที่เชิญกล่าวอ้าง
- `contextVisibility`: การมองเห็นบริบทเพิ่มเติม (`"all"` เป็นค่าเริ่มต้น, `"allowlist"`, `"allowlist_quote"`)

### พฤติกรรมการตอบกลับ

- `replyToMode`: `"off"`, `"first"`, `"all"`, หรือ `"batched"`
- `threadReplies`: `"off"`, `"inbound"`, หรือ `"always"`
- `threadBindings`: การแทนที่ต่อช่องทางสำหรับการกำหนดเส้นทางและวงจรชีวิตของเซสชันที่ผูกกับเธรด
- `streaming`: `"off"` (ค่าเริ่มต้น), `"partial"`, `"quiet"`, หรือรูปแบบอ็อบเจกต์ `{ mode, preview: { toolProgress } }` `true` ↔ `"partial"`, `false` ↔ `"off"`
- `blockStreaming`: เมื่อเป็น `true` บล็อกผู้ช่วยที่เสร็จสมบูรณ์จะถูกเก็บเป็นข้อความความคืบหน้าแยกต่างหาก
- `markdown`: การกำหนดค่าการเรนเดอร์ Markdown สำหรับข้อความขาออก ซึ่งระบุหรือไม่ก็ได้
- `responsePrefix`: สตริงที่เติมหน้าให้การตอบกลับขาออก ซึ่งระบุหรือไม่ก็ได้
- `textChunkLimit`: ขนาดชิ้นข้อความขาออกเป็นจำนวนอักขระเมื่อ `chunkMode: "length"` ค่าเริ่มต้น: `4000`
- `chunkMode`: `"length"` (ค่าเริ่มต้น แบ่งตามจำนวนอักขระ) หรือ `"newline"` (แบ่งที่ขอบเขตบรรทัด)
- `historyLimit`: จำนวนข้อความห้องล่าสุดที่รวมเป็น `InboundHistory` เมื่อข้อความในห้องเรียกใช้เอเจนต์ ย้อนกลับไปใช้ `messages.groupChat.historyLimit`; ค่าเริ่มต้นที่มีผลคือ `0` (ปิดใช้งาน)
- `mediaMaxMb`: เพดานขนาดสื่อเป็น MB สำหรับการส่งขาออกและการประมวลผลขาเข้า

### การตั้งค่ารีแอ็กชัน

- `ackReaction`: การแทนที่รีแอ็กชัน ack สำหรับช่องทาง/บัญชีนี้
- `ackReactionScope`: การแทนที่ขอบเขต (`"group-mentions"` ค่าเริ่มต้น, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`)
- `reactionNotifications`: โหมดการแจ้งเตือนรีแอ็กชันขาเข้า (`"own"` ค่าเริ่มต้น, `"off"`)

### เครื่องมือและการแทนที่ต่อห้อง

- `actions`: การจำกัดเครื่องมือต่อแอ็กชัน (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`)
- `groups`: แมปนโยบายต่อห้อง ตัวตนของเซสชันใช้ ID ห้องที่เสถียรหลังการแก้ไข (`rooms` เป็นนามแฝงเดิม)
  - `groups.<room>.account`: จำกัดรายการห้องที่สืบทอดมาหนึ่งรายการให้ผูกกับบัญชีเฉพาะ
  - `groups.<room>.allowBots`: การแทนที่ต่อห้องของการตั้งค่าระดับช่องทาง (`true` หรือ `"mentions"`)
  - `groups.<room>.users`: allowlist ผู้ส่งต่อห้อง
  - `groups.<room>.tools`: การแทนที่อนุญาต/ปฏิเสธเครื่องมือต่อห้อง
  - `groups.<room>.autoReply`: การแทนที่ต่อห้องสำหรับการควบคุมด้วยการกล่าวถึง `true` ปิดข้อกำหนดการกล่าวถึงสำหรับห้องนั้น; `false` บังคับให้เปิดกลับมา
  - `groups.<room>.skills`: ตัวกรอง skill ต่อห้อง
  - `groups.<room>.systemPrompt`: ส่วนย่อยของพรอมป์ระบบต่อห้อง

### การตั้งค่าการอนุมัติ exec

- `execApprovals.enabled`: ส่งการอนุมัติ exec ผ่านพรอมป์แบบเนทีฟของ Matrix
- `execApprovals.approvers`: ID ผู้ใช้ Matrix ที่ได้รับอนุญาตให้อนุมัติ ย้อนกลับไปใช้ `dm.allowFrom`
- `execApprovals.target`: `"dm"` (ค่าเริ่มต้น), `"channel"`, หรือ `"both"`
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: allowlist ของเอเจนต์/เซสชันสำหรับการส่ง ซึ่งระบุหรือไม่ก็ได้

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) - ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตนและโฟลว์การจับคู่ของ DM
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความปลอดภัย
