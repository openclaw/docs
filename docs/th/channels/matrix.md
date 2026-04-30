---
read_when:
    - การตั้งค่า Matrix ใน OpenClaw
    - การกำหนดค่า Matrix E2EE และการยืนยัน
summary: สถานะการรองรับ Matrix, การตั้งค่า และตัวอย่างการกำหนดค่า
title: เมทริกซ์
x-i18n:
    generated_at: "2026-04-30T09:37:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261b0eaae452cff7bb9ddf8dc67ddda45fb27b6468e95450b19207348d0b577a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix เป็น Plugin ช่องทางที่รวมมากับ OpenClaw.
มันใช้ `matrix-js-sdk` อย่างเป็นทางการ และรองรับ DM, ห้อง, เธรด, สื่อ, ปฏิกิริยา, โพล, ตำแหน่ง และ E2EE.

## Plugin ที่รวมมาให้

OpenClaw รุ่นแพ็กเกจปัจจุบันมาพร้อมกับ Plugin Matrix ในตัว คุณไม่จำเป็นต้องติดตั้งอะไรเพิ่มเติม การกำหนดค่า `channels.matrix.*` (ดู [การตั้งค่า](#setup)) คือสิ่งที่เปิดใช้งานมัน

สำหรับบิลด์เก่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Matrix ให้ติดตั้งแพ็กเกจ npm ปัจจุบันเมื่อมีการเผยแพร่:

```bash
openclaw plugins install @openclaw/matrix
```

หาก npm รายงานว่าแพ็กเกจที่ OpenClaw เป็นเจ้าของถูกเลิกใช้แล้ว ให้ใช้บิลด์ OpenClaw แบบแพ็กเกจปัจจุบัน หรือเช็กเอาต์ภายในเครื่องจนกว่าจะมีแพ็กเกจ npm ที่ใหม่กว่าเผยแพร่

จากเช็กเอาต์ภายในเครื่อง:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` จะลงทะเบียนและเปิดใช้งาน Plugin ดังนั้นจึงไม่ต้องมีขั้นตอน `openclaw plugins enable matrix` แยกต่างหาก Plugin ยังจะไม่ทำอะไรจนกว่าคุณจะกำหนดค่าช่องทางด้านล่าง ดู [Plugins](/th/tools/plugin) สำหรับพฤติกรรม Plugin ทั่วไปและกฎการติดตั้ง

## การตั้งค่า

1. สร้างบัญชี Matrix บน homeserver ของคุณ
2. กำหนดค่า `channels.matrix` ด้วย `homeserver` + `accessToken` หรือ `homeserver` + `userId` + `password`
3. รีสตาร์ท Gateway
4. เริ่ม DM กับบอต หรือเชิญบอตเข้าห้อง (ดู [เข้าร่วมอัตโนมัติ](#auto-join) — คำเชิญใหม่จะเข้าสู่ระบบได้ก็ต่อเมื่อ `autoJoin` อนุญาต)

### การตั้งค่าแบบโต้ตอบ

```bash
openclaw channels add
openclaw configure --section channels
```

วิซาร์ดจะถาม: URL ของ homeserver, วิธีการยืนยันตัวตน (access token หรือรหัสผ่าน), user ID (เฉพาะการยืนยันตัวตนด้วยรหัสผ่าน), ชื่ออุปกรณ์ที่ไม่บังคับ, จะเปิดใช้ E2EE หรือไม่ และจะกำหนดค่าการเข้าถึงห้องและการเข้าร่วมอัตโนมัติหรือไม่

หากมีตัวแปรสภาพแวดล้อม `MATRIX_*` ที่ตรงกันอยู่แล้ว และบัญชีที่เลือกยังไม่มีการยืนยันตัวตนที่บันทึกไว้ วิซาร์ดจะเสนอทางลัดด้วยตัวแปรสภาพแวดล้อม หากต้องการแปลงชื่อห้องก่อนบันทึกรายการอนุญาต ให้รัน `openclaw channels resolve --channel matrix "Project Room"` เมื่อเปิดใช้ E2EE วิซาร์ดจะเขียนการกำหนดค่าและรัน bootstrap เดียวกับ [`openclaw matrix encryption setup`](#encryption-and-verification)

### การกำหนดค่าน้อยที่สุด

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

### เข้าร่วมอัตโนมัติ

`channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ด้วยค่าเริ่มต้นนี้ บอตจะไม่ปรากฏในห้องใหม่หรือ DM จากคำเชิญใหม่จนกว่าคุณจะเข้าร่วมด้วยตนเอง

OpenClaw ไม่สามารถบอกได้ในเวลาที่ได้รับคำเชิญว่าห้องที่ถูกเชิญเป็น DM หรือกลุ่ม ดังนั้นคำเชิญทั้งหมด — รวมถึงคำเชิญแบบ DM — จะผ่าน `autoJoin` ก่อน `dm.policy` จะมีผลในภายหลังเท่านั้น หลังจากบอตเข้าร่วมแล้วและห้องถูกจัดประเภทแล้ว

<Warning>
ตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` เพื่อจำกัดคำเชิญที่บอตยอมรับ หรือตั้งค่า `autoJoin: "always"` เพื่อยอมรับทุกคำเชิญ

`autoJoinAllowlist` ยอมรับเฉพาะเป้าหมายที่เสถียร: `!roomId:server`, `#alias:server` หรือ `*` ชื่อห้องธรรมดาจะถูกปฏิเสธ รายการ alias จะถูกแปลงกับ homeserver ไม่ใช่กับสถานะที่ห้องที่เชิญอ้างไว้
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

### รูปแบบเป้าหมายของรายการอนุญาต

รายการอนุญาตของ DM และห้องควรใส่ด้วย ID ที่เสถียรที่สุด:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): ใช้ `@user:server` ชื่อที่แสดงจะแปลงได้ก็ต่อเมื่อไดเรกทอรีของ homeserver ส่งคืนผลลัพธ์ที่ตรงกันเพียงรายการเดียว
- ห้อง (`groups`, `autoJoinAllowlist`): ใช้ `!room:server` หรือ `#alias:server` ชื่อจะถูกแปลงแบบพยายามอย่างดีที่สุดกับห้องที่เข้าร่วมแล้ว รายการที่แปลงไม่ได้จะถูกละเว้นขณะรันไทม์

### การทำให้ Account ID เป็นรูปแบบมาตรฐาน

วิซาร์ดจะแปลงชื่อที่เป็นมิตรให้เป็น account ID ที่อยู่ในรูปแบบมาตรฐาน ตัวอย่างเช่น `Ops Bot` จะกลายเป็น `ops-bot` เครื่องหมายวรรคตอนจะถูก escape ในชื่อตัวแปรสภาพแวดล้อมแบบ scoped เพื่อไม่ให้สองบัญชีชนกัน: `-` → `_X2D_` ดังนั้น `ops-prod` จะแมปเป็น `MATRIX_OPS_X2D_PROD_*`

### ข้อมูลประจำตัวที่แคชไว้

Matrix เก็บข้อมูลประจำตัวที่แคชไว้ภายใต้ `~/.openclaw/credentials/matrix/`:

- บัญชีเริ่มต้น: `credentials.json`
- บัญชีที่มีชื่อ: `credentials-<account>.json`

เมื่อมีข้อมูลประจำตัวที่แคชไว้อยู่ที่นั่น OpenClaw จะถือว่า Matrix ถูกกำหนดค่าแล้ว แม้ access token จะไม่ได้อยู่ในไฟล์การกำหนดค่า — ซึ่งครอบคลุมการตั้งค่า, `openclaw doctor` และการตรวจสอบสถานะช่องทาง

### ตัวแปรสภาพแวดล้อม

ใช้เมื่อยังไม่ได้ตั้งค่าคีย์การกำหนดค่าที่เทียบเท่า บัญชีเริ่มต้นใช้ชื่อที่ไม่มีคำนำหน้า บัญชีที่มีชื่อใช้ account ID แทรกไว้ก่อนส่วนต่อท้าย

| บัญชีเริ่มต้น          | บัญชีที่มีชื่อ (`<ID>` คือ account ID ที่อยู่ในรูปแบบมาตรฐาน) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

สำหรับบัญชี `ops` ชื่อจะกลายเป็น `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` และอื่น ๆ ตัวแปรสภาพแวดล้อมของ recovery key จะถูกอ่านโดยโฟลว์ CLI ที่รองรับการกู้คืน (`verify backup restore`, `verify device`, `verify bootstrap`) เมื่อคุณ pipe คีย์เข้ามาผ่าน `--recovery-key-stdin`

ไม่สามารถตั้งค่า `MATRIX_HOMESERVER` จากไฟล์ `.env` ของ workspace ได้ ดู [ไฟล์ `.env` ของ Workspace](/th/gateway/security)

## ตัวอย่างการกำหนดค่า

พื้นฐานที่ใช้งานได้จริงพร้อมการจับคู่ DM, รายการอนุญาตห้อง และ E2EE:

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

## พรีวิวการสตรีม

การสตรีมคำตอบของ Matrix เป็นแบบเลือกเปิดใช้ `streaming` ควบคุมวิธีที่ OpenClaw ส่งคำตอบของผู้ช่วยที่กำลังดำเนินอยู่ ส่วน `blockStreaming` ควบคุมว่าจะเก็บแต่ละบล็อกที่เสร็จแล้วเป็นข้อความ Matrix ของตัวเองหรือไม่

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

หากต้องการคงพรีวิวคำตอบสดไว้แต่ซ่อนบรรทัดเครื่องมือ/ความคืบหน้าระหว่างทาง ให้ใช้รูปแบบออบเจ็กต์:

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
| `"partial"`       | แก้ไขข้อความธรรมดาหนึ่งข้อความในตำแหน่งเดิมขณะที่โมเดลเขียนบล็อกปัจจุบัน ไคลเอนต์ Matrix ทั่วไปอาจแจ้งเตือนเมื่อมีพรีวิวแรก ไม่ใช่การแก้ไขสุดท้าย              |
| `"quiet"`         | เหมือนกับ `"partial"` แต่ข้อความเป็น notice ที่ไม่แจ้งเตือน ผู้รับจะได้รับการแจ้งเตือนเพียงครั้งเดียวเมื่อกฎ push รายผู้ใช้ตรงกับการแก้ไขที่เสร็จสมบูรณ์แล้ว (ดูด้านล่าง) |

`blockStreaming` เป็นอิสระจาก `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (ค่าเริ่มต้น)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | ร่างสดสำหรับบล็อกปัจจุบัน บล็อกที่เสร็จแล้วถูกเก็บเป็นข้อความ | ร่างสดสำหรับบล็อกปัจจุบัน แล้วสรุปจบในตำแหน่งเดิม |
| `"off"`                 | ข้อความ Matrix ที่แจ้งเตือนหนึ่งข้อความต่อบล็อกที่เสร็จแล้ว                     | ข้อความ Matrix ที่แจ้งเตือนหนึ่งข้อความสำหรับคำตอบเต็ม      |

หมายเหตุ:

- หากพรีวิวขยายเกินขีดจำกัดขนาดต่อ event ของ Matrix OpenClaw จะหยุดสตรีมพรีวิวและถอยกลับไปใช้การส่งเฉพาะผลลัพธ์สุดท้าย
- คำตอบแบบสื่อจะส่งไฟล์แนบตามปกติเสมอ หากไม่สามารถนำพรีวิวเก่ากลับมาใช้ซ้ำได้อย่างปลอดภัยอีกต่อไป OpenClaw จะ redact พรีวิวนั้นก่อนส่งคำตอบแบบสื่อสุดท้าย
- การอัปเดตพรีวิวความคืบหน้าของเครื่องมือจะเปิดใช้เป็นค่าเริ่มต้นเมื่อการสตรีมพรีวิวของ Matrix ทำงานอยู่ ตั้งค่า `streaming.preview.toolProgress: false` เพื่อคงการแก้ไขพรีวิวสำหรับข้อความคำตอบไว้ แต่ปล่อยให้ความคืบหน้าของเครื่องมืออยู่บนเส้นทางการส่งตามปกติ
- การแก้ไขพรีวิวมีค่าใช้จ่ายเป็นการเรียก Matrix API เพิ่มเติม ปล่อย `streaming: "off"` ไว้หากคุณต้องการโปรไฟล์ rate-limit ที่ระมัดระวังที่สุด

## เมทาดาทาการอนุมัติ

พรอมต์การอนุมัติแบบ native ของ Matrix เป็น event `m.room.message` ปกติที่มีเนื้อหา event แบบกำหนดเองเฉพาะ OpenClaw ภายใต้ `com.openclaw.approval` Matrix อนุญาตคีย์ event-content แบบกำหนดเอง ดังนั้นไคลเอนต์ทั่วไปยังคงแสดงผลเนื้อความ ในขณะที่ไคลเอนต์ที่รองรับ OpenClaw สามารถอ่าน approval id, kind, state, การตัดสินใจที่มีให้ และรายละเอียด exec/plugin แบบมีโครงสร้างได้

เมื่อพรอมต์การอนุมัติยาวเกินหนึ่ง event ของ Matrix OpenClaw จะแบ่งข้อความที่มองเห็นเป็นชิ้น ๆ และแนบ `com.openclaw.approval` กับชิ้นแรกเท่านั้น ปฏิกิริยาสำหรับการตัดสินใจอนุญาต/ปฏิเสธจะผูกกับ event แรกนั้น ดังนั้นพรอมต์ยาวจึงยังคงมีเป้าหมายการอนุมัติเดียวกับพรอมต์ที่เป็น event เดียว

### กฎ push แบบโฮสต์เองสำหรับพรีวิวสุดท้ายแบบ quiet

`streaming: "quiet"` จะแจ้งเตือนผู้รับเพียงครั้งเดียวเมื่อบล็อกหรือเทิร์นสรุปจบแล้ว — กฎ push รายผู้ใช้ต้องตรงกับ marker ของพรีวิวที่สรุปจบแล้ว ดู [กฎ push ของ Matrix สำหรับพรีวิวแบบ quiet](/th/channels/matrix-push-rules) สำหรับสูตรเต็ม (recipient token, การตรวจสอบ pusher, การติดตั้งกฎ, หมายเหตุราย homeserver)

## ห้องบอตถึงบอต

ตามค่าเริ่มต้น ข้อความ Matrix จากบัญชี Matrix ของ OpenClaw อื่นที่กำหนดค่าไว้จะถูกละเว้น

ใช้ `allowBots` เมื่อคุณต้องการทราฟฟิก Matrix ระหว่างเอเจนต์โดยตั้งใจ:

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
- `allowBots: "mentions"` ยอมรับข้อความเหล่านั้นเฉพาะเมื่อข้อความกล่าวถึงบอตนี้อย่างมองเห็นได้ในห้อง DM ยังคงอนุญาตอยู่
- `groups.<room>.allowBots` จะแทนที่การตั้งค่าระดับบัญชีสำหรับห้องเดียว
- OpenClaw ยังคงละเว้นข้อความจาก Matrix user ID เดียวกันเพื่อหลีกเลี่ยงลูปการตอบกลับตัวเอง
- Matrix ไม่ได้เปิดเผยแฟล็กบอตแบบ native ที่นี่ OpenClaw ถือว่า "เขียนโดยบอต" หมายถึง "ส่งโดยบัญชี Matrix อื่นที่กำหนดค่าไว้บน OpenClaw gateway นี้"

ใช้รายการอนุญาตห้องที่เข้มงวดและข้อกำหนดการกล่าวถึงเมื่อเปิดใช้ทราฟฟิกบอตถึงบอตในห้องที่ใช้ร่วมกัน

## การเข้ารหัสและการตรวจสอบ

ในห้องที่เข้ารหัส (E2EE) เหตุการณ์รูปภาพขาออกจะใช้ `thumbnail_file` เพื่อให้ตัวอย่างรูปภาพถูกเข้ารหัสไปพร้อมกับไฟล์แนบเต็ม ห้องที่ไม่ได้เข้ารหัสยังคงใช้ `thumbnail_url` แบบธรรมดา ไม่ต้องกำหนดค่าใดๆ — Plugin จะตรวจจับสถานะ E2EE โดยอัตโนมัติ

คำสั่ง `openclaw matrix` ทั้งหมดรองรับ `--verbose` (การวินิจฉัยแบบเต็ม), `--json` (เอาต์พุตที่เครื่องอ่านได้) และ `--account <id>` (การตั้งค่าหลายบัญชี) โดยค่าเริ่มต้นเอาต์พุตจะกระชับ พร้อมการบันทึกภายใน SDK แบบเงียบ ตัวอย่างด้านล่างแสดงรูปแบบมาตรฐาน เพิ่มแฟล็กตามต้องการ

### เปิดใช้งานการเข้ารหัส

```bash
openclaw matrix encryption setup
```

บูตสแตรป secret storage และ cross-signing สร้างข้อมูลสำรอง room-key หากจำเป็น จากนั้นพิมพ์สถานะและขั้นตอนถัดไป แฟล็กที่มีประโยชน์:

- `--recovery-key <key>` ใช้คีย์กู้คืนก่อนบูตสแตรป (แนะนำรูปแบบ stdin ที่เอกสารไว้ด้านล่าง)
- `--force-reset-cross-signing` ละทิ้งตัวตน cross-signing ปัจจุบันและสร้างใหม่ (ใช้เฉพาะเมื่อจงใจเท่านั้น)

สำหรับบัญชีใหม่ ให้เปิดใช้งาน E2EE ตอนสร้างบัญชี:

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

`verify status` รายงานสัญญาณความเชื่อถืออิสระสามอย่าง (`--verbose` แสดงทั้งหมด):

- `Locally trusted`: เชื่อถือโดยไคลเอนต์นี้เท่านั้น
- `Cross-signing verified`: SDK รายงานการยืนยันผ่าน cross-signing
- `Signed by owner`: ลงนามโดยคีย์ self-signing ของคุณเอง (เพื่อการวินิจฉัยเท่านั้น)

`Verified by owner` จะกลายเป็น `yes` เฉพาะเมื่อ `Cross-signing verified` เป็น `yes` เท่านั้น ความเชื่อถือในเครื่องหรือการลงนามโดยเจ้าของเพียงอย่างเดียวไม่เพียงพอ

`--allow-degraded-local-state` คืนค่าการวินิจฉัยแบบ best-effort โดยไม่เตรียมบัญชี Matrix ก่อน มีประโยชน์สำหรับการตรวจสอบแบบออฟไลน์หรือกำหนดค่าไว้บางส่วน

### ยืนยันอุปกรณ์นี้ด้วยคีย์กู้คืน

คีย์กู้คืนเป็นข้อมูลละเอียดอ่อน — ให้ส่งผ่าน stdin แทนการส่งบนบรรทัดคำสั่ง ตั้งค่า `MATRIX_RECOVERY_KEY` (หรือ `MATRIX_<ID>_RECOVERY_KEY` สำหรับบัญชีที่มีชื่อ):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

คำสั่งจะรายงานสามสถานะ:

- `Recovery key accepted`: Matrix ยอมรับคีย์สำหรับ secret storage หรือความเชื่อถือของอุปกรณ์
- `Backup usable`: สามารถโหลดข้อมูลสำรอง room-key ด้วยวัสดุกู้คืนที่เชื่อถือได้
- `Device verified by owner`: อุปกรณ์นี้มีความเชื่อถือตัวตน cross-signing ของ Matrix อย่างสมบูรณ์

คำสั่งจะออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อความเชื่อถือตัวตนเต็มยังไม่สมบูรณ์ แม้ว่าคีย์กู้คืนจะปลดล็อกวัสดุสำรองแล้วก็ตาม ในกรณีนั้น ให้ทำ self-verification ให้เสร็จจากไคลเอนต์ Matrix อื่น:

```bash
openclaw matrix verify self
```

`verify self` จะรอจนกว่า `Cross-signing verified: yes` ก่อนออกสำเร็จ ใช้ `--timeout-ms <ms>` เพื่อปรับเวลารอ

รูปแบบคีย์ตรง `openclaw matrix verify device "<recovery-key>"` ก็รองรับเช่นกัน แต่คีย์จะไปอยู่ในประวัติ shell ของคุณ

### บูตสแตรปหรือซ่อมแซม cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` คือคำสั่งซ่อมแซมและตั้งค่าสำหรับบัญชีที่เข้ารหัส โดยเรียงลำดับดังนี้:

- บูตสแตรป secret storage โดยนำคีย์กู้คืนที่มีอยู่กลับมาใช้เมื่อเป็นไปได้
- บูตสแตรป cross-signing และอัปโหลด public keys ที่ขาดหาย
- ทำเครื่องหมายและ cross-sign อุปกรณ์ปัจจุบัน
- สร้างข้อมูลสำรอง room-key ฝั่งเซิร์ฟเวอร์หากยังไม่มี

หาก homeserver ต้องใช้ UIA เพื่ออัปโหลดคีย์ cross-signing, OpenClaw จะลองแบบไม่ยืนยันตัวตนก่อน ตามด้วย `m.login.dummy` แล้วจึง `m.login.password` (ต้องมี `channels.matrix.password`)

แฟล็กที่มีประโยชน์:

- `--recovery-key-stdin` (ใช้คู่กับ `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) หรือ `--recovery-key <key>`
- `--force-reset-cross-signing` เพื่อละทิ้งตัวตน cross-signing ปัจจุบัน (เฉพาะเมื่อจงใจเท่านั้น)

### ข้อมูลสำรอง room-key

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` แสดงว่ามีข้อมูลสำรองฝั่งเซิร์ฟเวอร์หรือไม่ และอุปกรณ์นี้ถอดรหัสได้หรือไม่ `backup restore` นำเข้า room keys ที่สำรองไว้เข้าสู่ crypto store ในเครื่อง หากคีย์กู้คืนอยู่บนดิสก์แล้ว คุณสามารถละ `--recovery-key-stdin` ได้

หากต้องการแทนที่ข้อมูลสำรองที่เสียด้วย baseline ใหม่ (ยอมรับการสูญเสียประวัติเก่าที่กู้คืนไม่ได้ และยังสามารถสร้าง secret storage ใหม่ได้หากโหลดความลับของข้อมูลสำรองปัจจุบันไม่ได้):

```bash
openclaw matrix verify backup reset --yes
```

เพิ่ม `--rotate-recovery-key` เฉพาะเมื่อคุณจงใจต้องการให้คีย์กู้คืนเดิมหยุดปลดล็อก baseline ข้อมูลสำรองใหม่

### การแสดงรายการ การร้องขอ และการตอบกลับการยืนยัน

```bash
openclaw matrix verify list
```

แสดงรายการคำขอยืนยันที่รอดำเนินการสำหรับบัญชีที่เลือก

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

ส่งคำขอยืนยันจากบัญชี OpenClaw นี้ `--own-user` ขอ self-verification (คุณยอมรับพรอมป์ในไคลเอนต์ Matrix อื่นของผู้ใช้เดียวกัน); `--user-id`/`--device-id`/`--room-id` ระบุเป้าหมายเป็นบุคคลอื่น `--own-user` ไม่สามารถใช้ร่วมกับแฟล็กระบุเป้าหมายอื่นได้

สำหรับการจัดการ lifecycle ระดับล่าง — โดยทั่วไปขณะติดตามคำขอขาเข้าจากไคลเอนต์อื่น — คำสั่งเหล่านี้ทำงานกับคำขอ `<id>` เฉพาะ (พิมพ์โดย `verify list` และ `verify request`):

| คำสั่ง                                     | วัตถุประสงค์                                                         |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | ยอมรับคำขอขาเข้า                                                   |
| `openclaw matrix verify start <id>`        | เริ่มโฟลว์ SAS                                                      |
| `openclaw matrix verify sas <id>`          | พิมพ์อีโมจิหรือเลขทศนิยม SAS                                       |
| `openclaw matrix verify confirm-sas <id>`  | ยืนยันว่า SAS ตรงกับที่ไคลเอนต์อีกฝั่งแสดง                         |
| `openclaw matrix verify mismatch-sas <id>` | ปฏิเสธ SAS เมื่ออีโมจิหรือเลขทศนิยมไม่ตรงกัน                       |
| `openclaw matrix verify cancel <id>`       | ยกเลิก; รับ `--reason <text>` และ `--code <matrix-code>` เป็นตัวเลือก |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` และ `cancel` ทั้งหมดรองรับ `--user-id` และ `--room-id` เป็นคำใบ้สำหรับการติดตามผล DM เมื่อการยืนยันผูกกับห้องข้อความส่วนตัวที่เฉพาะเจาะจง

### หมายเหตุหลายบัญชี

หากไม่มี `--account <id>` คำสั่ง Matrix CLI จะใช้บัญชีเริ่มต้นโดยนัย หากคุณมีบัญชีที่มีชื่อหลายบัญชีและยังไม่ได้ตั้งค่า `channels.matrix.defaultAccount` คำสั่งจะไม่เดาเองและจะขอให้คุณเลือก เมื่อ E2EE ถูกปิดใช้งานหรือไม่พร้อมใช้งานสำหรับบัญชีที่มีชื่อ ข้อผิดพลาดจะชี้ไปยังคีย์ config ของบัญชีนั้น เช่น `channels.matrix.accounts.assistant.encryption`

<AccordionGroup>
  <Accordion title="ลักษณะการทำงานเมื่อเริ่มต้น">
    เมื่อมี `encryption: true`, `startupVerification` จะมีค่าเริ่มต้นเป็น `"if-unverified"` เมื่อเริ่มต้น อุปกรณ์ที่ยังไม่ยืนยันจะขอ self-verification ในไคลเอนต์ Matrix อื่น ข้ามรายการซ้ำและใช้ cooldown (ค่าเริ่มต้น 24 ชั่วโมง) ปรับด้วย `startupVerificationCooldownHours` หรือปิดด้วย `startupVerification: "off"`

    การเริ่มต้นยังรัน crypto bootstrap pass แบบระมัดระวัง ซึ่งนำ secret storage และตัวตน cross-signing ปัจจุบันกลับมาใช้ หากสถานะ bootstrap เสีย OpenClaw จะพยายามซ่อมแซมแบบมีการป้องกันแม้ไม่มี `channels.matrix.password`; หาก homeserver ต้องใช้รหัสผ่าน UIA การเริ่มต้นจะบันทึกคำเตือนและยังไม่ทำให้ล้มเหลวร้ายแรง อุปกรณ์ที่ owner-signed อยู่แล้วจะถูกคงไว้

    ดู [การย้าย Matrix](/th/channels/matrix-migration) สำหรับโฟลว์การอัปเกรดแบบเต็ม

  </Accordion>

  <Accordion title="ประกาศการยืนยัน">
    Matrix โพสต์ประกาศ lifecycle การยืนยันลงในห้องยืนยัน DM แบบเข้มงวดเป็นข้อความ `m.notice`: คำขอ, พร้อม (พร้อมคำแนะนำ "ยืนยันด้วยอีโมจิ"), เริ่ม/เสร็จสมบูรณ์ และรายละเอียด SAS (อีโมจิ/ทศนิยม) เมื่อมี

    คำขอขาเข้าจากไคลเอนต์ Matrix อื่นจะถูกติดตามและยอมรับอัตโนมัติ สำหรับ self-verification, OpenClaw จะเริ่มโฟลว์ SAS โดยอัตโนมัติและยืนยันฝั่งของตนเองเมื่อการยืนยันด้วยอีโมจิพร้อมใช้งาน — คุณยังต้องเปรียบเทียบและยืนยัน "ตรงกัน" ในไคลเอนต์ Matrix ของคุณ

    ประกาศระบบการยืนยันจะไม่ถูกส่งต่อไปยัง pipeline แชตของ agent

  </Accordion>

  <Accordion title="อุปกรณ์ Matrix ที่ถูกลบหรือไม่ถูกต้อง">
    หาก `verify status` ระบุว่าอุปกรณ์ปัจจุบันไม่อยู่ในรายการบน homeserver แล้ว ให้สร้างอุปกรณ์ OpenClaw Matrix ใหม่ สำหรับการเข้าสู่ระบบด้วยรหัสผ่าน:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    สำหรับการยืนยันตัวตนด้วยโทเค็น ให้สร้าง access token ใหม่ในไคลเอนต์ Matrix หรือ UI ผู้ดูแลระบบ จากนั้นอัปเดต OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    แทนที่ `assistant` ด้วย ID บัญชีจากคำสั่งที่ล้มเหลว หรือละ `--account` สำหรับบัญชีเริ่มต้น

  </Accordion>

  <Accordion title="สุขอนามัยของอุปกรณ์">
    อุปกรณ์ที่ OpenClaw จัดการเก่าๆ อาจสะสมได้ แสดงรายการและลบรายการที่ไม่จำเป็น:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE ใช้เส้นทาง Rust crypto อย่างเป็นทางการของ `matrix-js-sdk` พร้อม `fake-indexeddb` เป็น IndexedDB shim สถานะ crypto จะคงอยู่ใน `crypto-idb-snapshot.json` (สิทธิ์ไฟล์แบบจำกัด)

    สถานะ runtime ที่เข้ารหัสอยู่ภายใต้ `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` และรวมถึง sync store, crypto store, คีย์กู้คืน, สแนปช็อต IDB, thread bindings และสถานะการยืนยันตอนเริ่มต้น เมื่อโทเค็นเปลี่ยนแต่ตัวตนบัญชียังเหมือนเดิม OpenClaw จะนำ root ที่มีอยู่ที่ดีที่สุดกลับมาใช้ เพื่อให้สถานะก่อนหน้ายังคงมองเห็นได้

  </Accordion>
</AccordionGroup>

## การจัดการโปรไฟล์

อัปเดต self-profile ของ Matrix สำหรับบัญชีที่เลือก:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

คุณสามารถส่งทั้งสองตัวเลือกในการเรียกครั้งเดียวได้ Matrix รองรับ URL อวาตาร์ `mxc://` โดยตรง เมื่อคุณส่ง `http://` หรือ `https://`, OpenClaw จะอัปโหลดไฟล์ก่อน แล้วเก็บ URL `mxc://` ที่ resolve แล้วลงใน `channels.matrix.avatarUrl` (หรือ override รายบัญชี)

## Threads

Matrix รองรับ threads ดั้งเดิมของ Matrix สำหรับทั้งการตอบกลับอัตโนมัติและการส่งผ่าน message-tool มีปุ่มปรับสองตัวที่ควบคุมลักษณะการทำงานแยกกัน:

### การกำหนดเส้นทางเซสชัน (`sessionScope`)

`dm.sessionScope` กำหนดว่าห้อง DM ของ Matrix จะ map กับเซสชัน OpenClaw อย่างไร:

- `"per-user"` (ค่าเริ่มต้น): ห้อง DM ทั้งหมดที่มี peer ที่ route เดียวกันใช้เซสชันเดียวร่วมกัน
- `"per-room"`: ห้อง DM ของ Matrix แต่ละห้องมีคีย์เซสชันของตัวเอง แม้ว่า peer จะเป็นคนเดียวกันก็ตาม

conversation bindings ที่ระบุชัดเจนจะมีสิทธิ์เหนือ `sessionScope` เสมอ ดังนั้นห้องและ threads ที่ bind ไว้จะคงเซสชันเป้าหมายที่เลือกไว้

### การตอบกลับใน thread (`threadReplies`)

`threadReplies` กำหนดว่าบอทจะโพสต์คำตอบไว้ที่ใด:

- `"off"`: คำตอบอยู่ระดับบนสุด ข้อความขาเข้าใน thread จะยังอยู่บนเซสชันแม่
- `"inbound"`: ตอบใน thread เฉพาะเมื่อข้อความขาเข้าอยู่ใน thread นั้นอยู่แล้ว
- `"always"`: ตอบใน thread ที่มีข้อความที่ทริกเกอร์เป็น root; บทสนทนานั้นจะถูก route ผ่านเซสชันที่ scope ตาม thread ที่ตรงกันตั้งแต่ทริกเกอร์แรกเป็นต้นไป

`dm.threadReplies` override สิ่งนี้สำหรับ DM เท่านั้น — ตัวอย่างเช่น แยก threads ของห้องออกจากกัน แต่ให้ DM อยู่แบบ flat

### การสืบทอด thread และคำสั่ง slash

- ข้อความแบบเธรดขาเข้าจะรวมข้อความรากของเธรดเป็นบริบทเอเจนต์เพิ่มเติม
- การส่งผ่านเครื่องมือข้อความจะสืบทอดเธรด Matrix ปัจจุบันโดยอัตโนมัติเมื่อกำหนดเป้าหมายไปยังห้องเดียวกัน (หรือเป้าหมายผู้ใช้ DM เดียวกัน) เว้นแต่จะระบุ `threadId` อย่างชัดเจน
- การใช้เป้าหมายผู้ใช้ DM ซ้ำจะทำงานเฉพาะเมื่อข้อมูลเมตาของเซสชันปัจจุบันพิสูจน์ได้ว่าเป็นคู่สนทนา DM เดียวกันบนบัญชี Matrix เดียวกัน ไม่เช่นนั้น OpenClaw จะย้อนกลับไปใช้การกำหนดเส้นทางตามขอบเขตผู้ใช้ตามปกติ
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และ `/acp spawn` ที่ผูกกับเธรด ล้วนทำงานได้ในห้อง Matrix และ DM
- `/focus` ระดับบนสุดจะสร้างเธรด Matrix ใหม่และผูกกับเซสชันเป้าหมายเมื่อ `threadBindings.spawnSubagentSessions: true`
- การเรียกใช้ `/focus` หรือ `/acp spawn --thread here` ภายในเธรด Matrix ที่มีอยู่จะผูกเธรดนั้นไว้ที่เดิม

เมื่อ OpenClaw ตรวจพบว่าห้อง DM ของ Matrix ชนกับห้อง DM อื่นบนเซสชันที่ใช้ร่วมกันเดียวกัน ระบบจะโพสต์ `m.notice` แบบครั้งเดียวในห้องนั้น โดยชี้ไปยังทางออก `/focus` และแนะนำให้เปลี่ยน `dm.sessionScope` ประกาศนี้จะปรากฏเฉพาะเมื่อเปิดใช้การผูกเธรดเท่านั้น

## การผูกการสนทนา ACP

ห้อง Matrix, DM และเธรด Matrix ที่มีอยู่สามารถเปลี่ยนเป็นพื้นที่ทำงาน ACP แบบคงทนได้โดยไม่ต้องเปลี่ยนพื้นผิวแชต

ขั้นตอนอย่างเร็วสำหรับผู้ปฏิบัติงาน:

- เรียกใช้ `/acp spawn codex --bind here` ภายใน Matrix DM, ห้อง หรือเธรดที่มีอยู่ซึ่งคุณต้องการใช้งานต่อ
- ใน Matrix DM หรือห้องระดับบนสุด DM/ห้องปัจจุบันจะยังเป็นพื้นผิวแชต และข้อความในอนาคตจะถูกส่งไปยังเซสชัน ACP ที่สร้างขึ้น
- ภายในเธรด Matrix ที่มีอยู่ `--bind here` จะผูกเธรดปัจจุบันไว้ที่เดิม
- `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP ที่ผูกไว้เดิมที่ตำแหน่งเดิม
- `/acp close` จะปิดเซสชัน ACP และลบการผูก

หมายเหตุ:

- `--bind here` ไม่สร้างเธรด Matrix ลูก
- `threadBindings.spawnAcpSessions` จำเป็นเฉพาะสำหรับ `/acp spawn --thread auto|here` ซึ่ง OpenClaw ต้องสร้างหรือผูกเธรด Matrix ลูก

### การกำหนดค่าการผูกเธรด

Matrix สืบทอดค่าเริ่มต้นส่วนกลางจาก `session.threadBindings` และยังรองรับการแทนที่ต่อช่องทางด้วย:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

แฟล็กการสร้างที่ผูกกับเธรดของ Matrix เป็นแบบเลือกเปิดใช้:

- ตั้งค่า `threadBindings.spawnSubagentSessions: true` เพื่ออนุญาตให้ `/focus` ระดับบนสุดสร้างและผูกเธรด Matrix ใหม่
- ตั้งค่า `threadBindings.spawnAcpSessions: true` เพื่ออนุญาตให้ `/acp spawn --thread auto|here` ผูกเซสชัน ACP กับเธรด Matrix

## รีแอ็กชัน

Matrix รองรับรีแอ็กชันขาออก การแจ้งเตือนรีแอ็กชันขาเข้า และรีแอ็กชันรับทราบ

เครื่องมือรีแอ็กชันขาออกถูกควบคุมด้วย `channels.matrix.actions.reactions`:

- `react` เพิ่มรีแอ็กชันให้กับอีเวนต์ Matrix
- `reactions` แสดงสรุปรีแอ็กชันปัจจุบันของอีเวนต์ Matrix
- `emoji=""` ลบรีแอ็กชันของบอตเองบนอีเวนต์นั้น
- `remove: true` ลบเฉพาะรีแอ็กชันอีโมจิที่ระบุจากบอต

**ลำดับการแก้ค่า** (ค่าที่กำหนดไว้ก่อนจะชนะ):

| การตั้งค่า              | ลำดับ                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | ต่อบัญชี → ช่องทาง → `messages.ackReaction` → ค่าอีโมจิสำรองจากตัวตนเอเจนต์   |
| `ackReactionScope`      | ต่อบัญชี → ช่องทาง → `messages.ackReactionScope` → ค่าเริ่มต้น `"group-mentions"` |
| `reactionNotifications` | ต่อบัญชี → ช่องทาง → ค่าเริ่มต้น `"own"`                                          |

`reactionNotifications: "own"` จะส่งต่ออีเวนต์ `m.reaction` ที่เพิ่มเข้ามาเมื่อเป้าหมายเป็นข้อความ Matrix ที่บอตเขียนเอง ส่วน `"off"` จะปิดอีเวนต์ระบบของรีแอ็กชัน การลบรีแอ็กชันจะไม่ถูกสังเคราะห์เป็นอีเวนต์ระบบ เพราะ Matrix แสดงสิ่งเหล่านั้นเป็นการแก้ไขลบ ไม่ใช่การลบ `m.reaction` แบบเดี่ยว

## บริบทประวัติ

- `channels.matrix.historyLimit` ควบคุมจำนวนข้อความล่าสุดในห้องที่จะถูกรวมเป็น `InboundHistory` เมื่อข้อความในห้อง Matrix กระตุ้นเอเจนต์ ย้อนกลับไปใช้ `messages.groupChat.historyLimit`; หากไม่ได้ตั้งค่าทั้งคู่ ค่าเริ่มต้นที่มีผลคือ `0` ตั้งค่า `0` เพื่อปิดใช้
- ประวัติห้อง Matrix เป็นประวัติภายในห้องเท่านั้น DM ยังคงใช้ประวัติเซสชันตามปกติ
- ประวัติห้อง Matrix เป็นแบบรอดำเนินการเท่านั้น: OpenClaw จะบัฟเฟอร์ข้อความในห้องที่ยังไม่ได้กระตุ้นการตอบกลับ จากนั้นจึงบันทึกสแนปช็อตของช่วงนั้นเมื่อมีการเมนชันหรือทริกเกอร์อื่นเข้ามา
- ข้อความทริกเกอร์ปัจจุบันจะไม่รวมอยู่ใน `InboundHistory`; ข้อความนั้นจะยังอยู่ในเนื้อหาขาเข้าหลักสำหรับรอบนั้น
- การลองซ้ำของอีเวนต์ Matrix เดิมจะใช้สแนปช็อตประวัติเดิมซ้ำ แทนที่จะเลื่อนไปยังข้อความใหม่กว่าในห้อง

## การมองเห็นบริบท

Matrix รองรับตัวควบคุม `contextVisibility` ที่ใช้ร่วมกันสำหรับบริบทห้องเสริม เช่น ข้อความตอบกลับที่ดึงมา รากเธรด และประวัติที่รอดำเนินการ

- `contextVisibility: "all"` เป็นค่าเริ่มต้น บริบทเสริมจะถูกเก็บไว้ตามที่ได้รับ
- `contextVisibility: "allowlist"` กรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่ได้รับอนุญาตจากการตรวจ allowlist ห้อง/ผู้ใช้ที่ใช้งานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บการตอบกลับที่อ้างถึงอย่างชัดเจนไว้หนึ่งรายการ

การตั้งค่านี้มีผลต่อการมองเห็นบริบทเสริม ไม่ใช่ว่าข้อความขาเข้าเองสามารถกระตุ้นการตอบกลับได้หรือไม่
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

หากต้องการปิดเสียง DM ทั้งหมดแต่ยังให้ห้องทำงานอยู่ ให้ตั้งค่า `dm.enabled: false`:

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

ดู [กลุ่ม](/th/channels/groups) สำหรับพฤติกรรมการบังคับเมนชันและ allowlist

ตัวอย่างการจับคู่สำหรับ Matrix DM:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

หากผู้ใช้ Matrix ที่ยังไม่ได้รับการอนุมัติส่งข้อความถึงคุณต่อไปก่อนการอนุมัติ OpenClaw จะใช้รหัสจับคู่ที่รอดำเนินการเดิมซ้ำ และอาจส่งข้อความเตือนกลับหลังช่วงคูลดาวน์สั้น ๆ แทนที่จะสร้างรหัสใหม่

ดู [การจับคู่](/th/channels/pairing) สำหรับขั้นตอนการจับคู่ DM ที่ใช้ร่วมกันและโครงร่างการจัดเก็บ

## การซ่อมแซมห้องโดยตรง

หากสถานะข้อความตรงเลื่อนไม่ตรงกัน OpenClaw อาจมีการแมป `m.direct` ที่ล้าสมัยซึ่งชี้ไปยังห้องเดี่ยวเก่าแทน DM ที่ใช้งานอยู่ ตรวจสอบการแมปปัจจุบันสำหรับคู่สนทนา:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

ซ่อมแซม:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

ทั้งสองคำสั่งรับ `--account <id>` สำหรับการตั้งค่าหลายบัญชี ขั้นตอนการซ่อมแซม:

- เลือก DM แบบ 1:1 ที่เข้มงวดซึ่งถูกแมปไว้แล้วใน `m.direct` ก่อน
- ย้อนกลับไปใช้ DM แบบ 1:1 ที่เข้มงวดซึ่งเข้าร่วมอยู่ในปัจจุบันกับผู้ใช้นั้น
- สร้างห้องโดยตรงใหม่และเขียน `m.direct` ใหม่หากไม่มี DM ที่สมบูรณ์อยู่

ระบบจะไม่ลบห้องเก่าโดยอัตโนมัติ แต่จะเลือก DM ที่สมบูรณ์และอัปเดตการแมป เพื่อให้การส่ง Matrix ในอนาคต ประกาศการยืนยัน และขั้นตอนข้อความตรงอื่น ๆ ส่งไปยังห้องที่ถูกต้อง

## การอนุมัติ exec

Matrix สามารถทำหน้าที่เป็นไคลเอนต์อนุมัติแบบเนทีฟได้ กำหนดค่าภายใต้ `channels.matrix.execApprovals` (หรือ `channels.matrix.accounts.<account>.execApprovals` สำหรับการแทนที่ต่อบัญชี):

- `enabled`: ส่งการอนุมัติผ่านพรอมป์เนทีฟของ Matrix เมื่อไม่ได้ตั้งค่าหรือเป็น `"auto"` Matrix จะเปิดใช้อัตโนมัติเมื่อสามารถระบุผู้อนุมัติได้อย่างน้อยหนึ่งคน ตั้งค่า `false` เพื่อปิดใช้อย่างชัดเจน
- `approvers`: ID ผู้ใช้ Matrix (`@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอ exec ไม่บังคับ — ย้อนกลับไปใช้ `channels.matrix.dm.allowFrom`
- `target`: ตำแหน่งที่ส่งพรอมป์ `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ; `"channel"` ส่งไปยังห้อง Matrix หรือ DM ที่เป็นต้นทาง; `"both"` ส่งไปทั้งสองที่
- `agentFilter` / `sessionFilter`: allowlist ทางเลือกสำหรับกำหนดว่าเอเจนต์/เซสชันใดจะกระตุ้นการส่งผ่าน Matrix

การอนุญาตแตกต่างกันเล็กน้อยระหว่างชนิดการอนุมัติ:

- **การอนุมัติ exec** ใช้ `execApprovals.approvers` โดยย้อนกลับไปใช้ `dm.allowFrom`
- **การอนุมัติ Plugin** อนุญาตผ่าน `dm.allowFrom` เท่านั้น

ทั้งสองชนิดใช้ทางลัดรีแอ็กชันและการอัปเดตข้อความของ Matrix ร่วมกัน ผู้อนุมัติจะเห็นทางลัดรีแอ็กชันบนข้อความอนุมัติหลัก:

- `✅` อนุญาตครั้งเดียว
- `❌` ปฏิเสธ
- `♾️` อนุญาตเสมอ (เมื่อ policy exec ที่มีผลอนุญาต)

คำสั่ง slash สำรอง: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`

เฉพาะผู้อนุมัติที่ระบุได้เท่านั้นที่สามารถอนุมัติหรือปฏิเสธได้ การส่งผ่านช่องทางสำหรับการอนุมัติ exec จะรวมข้อความคำสั่งด้วย — เปิดใช้ `channel` หรือ `both` เฉพาะในห้องที่เชื่อถือได้เท่านั้น

ที่เกี่ยวข้อง: [การอนุมัติ exec](/th/tools/exec-approvals)

## คำสั่ง slash

คำสั่ง slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` ฯลฯ) ทำงานได้โดยตรงใน DM ในห้อง OpenClaw ยังจดจำคำสั่งที่นำหน้าด้วยการเมนชัน Matrix ของบอตเองด้วย ดังนั้น `@bot:server /new` จะกระตุ้นเส้นทางคำสั่งโดยไม่ต้องใช้ regex เมนชันแบบกำหนดเอง วิธีนี้ช่วยให้บอตตอบสนองต่อโพสต์รูปแบบห้อง `@mention /command` ที่ Element และไคลเอนต์ลักษณะเดียวกันส่งออกมาเมื่อผู้ใช้ใช้การเติมแท็บชื่อบอตก่อนพิมพ์คำสั่ง

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

- ค่าระดับบนสุดของ `channels.matrix` ทำหน้าที่เป็นค่าเริ่มต้นสำหรับบัญชีที่มีชื่อ เว้นแต่บัญชีนั้นจะแทนที่ค่าเอง
- จำกัดขอบเขตรายการห้องที่สืบทอดมาให้กับบัญชีเฉพาะด้วย `groups.<room>.account` รายการที่ไม่มี `account` จะใช้ร่วมกันข้ามบัญชี; `account: "default"` ยังทำงานได้เมื่อกำหนดค่าบัญชีเริ่มต้นไว้ที่ระดับบนสุด

**การเลือกบัญชีเริ่มต้น:**

- ตั้งค่า `defaultAccount` เพื่อเลือกบัญชีที่มีชื่อซึ่งการกำหนดเส้นทางแบบนัย การตรวจสอบ และคำสั่ง CLI จะใช้ก่อน
- หากคุณมีหลายบัญชีและมีบัญชีหนึ่งชื่อ `default` จริง ๆ OpenClaw จะใช้บัญชีนั้นโดยนัยแม้ไม่ได้ตั้งค่า `defaultAccount`
- หากคุณมีหลายบัญชีที่มีชื่อและไม่ได้เลือกค่าเริ่มต้น คำสั่ง CLI จะปฏิเสธการคาดเดา — ให้ตั้งค่า `defaultAccount` หรือส่ง `--account <id>`
- บล็อก `channels.matrix.*` ระดับบนสุดจะถูกถือเป็นบัญชี `default` โดยนัยเฉพาะเมื่อการยืนยันตัวตนครบถ้วน (`homeserver` + `accessToken` หรือ `homeserver` + `userId` + `password`) บัญชีที่มีชื่อยังค้นพบได้จาก `homeserver` + `userId` เมื่อข้อมูลรับรองที่แคชไว้ครอบคลุมการยืนยันตัวตน

**การยกระดับ:**

- เมื่อ OpenClaw ยกระดับการกำหนดค่าแบบบัญชีเดียวเป็นหลายบัญชีระหว่างการซ่อมแซมหรือการตั้งค่า ระบบจะคงบัญชีที่มีชื่อเดิมไว้หากมีอยู่ หรือหาก `defaultAccount` ชี้ไปยังบัญชีหนึ่งอยู่แล้ว เฉพาะคีย์การยืนยันตัวตน/บูตสแตรปของ Matrix เท่านั้นที่จะย้ายเข้าไปในบัญชีที่ยกระดับแล้ว; คีย์นโยบายการส่งที่ใช้ร่วมกันจะยังอยู่ที่ระดับบนสุด

ดู [อ้างอิงการกำหนดค่า](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบหลายบัญชีที่ใช้ร่วมกัน

## homeserver ส่วนตัว/LAN

โดยค่าเริ่มต้น OpenClaw จะบล็อก homeserver Matrix แบบส่วนตัว/ภายในเพื่อป้องกัน SSRF เว้นแต่คุณจะเลือกเปิดใช้ต่อบัญชีอย่างชัดเจน

หาก homeserver ของคุณทำงานบน localhost, IP ของ LAN/Tailscale หรือชื่อโฮสต์ภายใน ให้เปิดใช้
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

การยินยอมใช้งานนี้อนุญาตเฉพาะเป้าหมายส่วนตัว/ภายในที่เชื่อถือได้เท่านั้น โฮมเซิร์ฟเวอร์แบบข้อความล้วนสาธารณะ เช่น
`http://matrix.example.org:8008` ยังคงถูกบล็อก ควรใช้ `https://` เมื่อเป็นไปได้เสมอ

## การส่งทราฟฟิก Matrix ผ่านพร็อกซี

หากการติดตั้งใช้งาน Matrix ของคุณต้องใช้พร็อกซี HTTP(S) ขาออกอย่างชัดเจน ให้ตั้งค่า `channels.matrix.proxy`:

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

## การจำแนกเป้าหมาย

Matrix ยอมรับรูปแบบเป้าหมายเหล่านี้ได้ทุกที่ที่ OpenClaw ขอเป้าหมายห้องหรือผู้ใช้จากคุณ:

- ผู้ใช้: `@user:server`, `user:@user:server`, หรือ `matrix:user:@user:server`
- ห้อง: `!room:server`, `room:!room:server`, หรือ `matrix:room:!room:server`
- นามแฝง: `#alias:server`, `channel:#alias:server`, หรือ `matrix:channel:#alias:server`

ID ห้องของ Matrix แยกตัวพิมพ์ใหญ่เล็ก ใช้รูปแบบตัวพิมพ์ของ ID ห้องจาก Matrix ให้ตรงทุกประการ
เมื่อกำหนดค่าเป้าหมายการส่งที่ระบุชัดเจน งาน Cron การผูก หรือรายการอนุญาต
OpenClaw เก็บคีย์เซสชันภายในในรูปแบบมาตรฐานสำหรับการจัดเก็บ ดังนั้นคีย์ตัวพิมพ์เล็กเหล่านั้น
จึงไม่ใช่แหล่งอ้างอิงที่เชื่อถือได้สำหรับ ID การส่งของ Matrix

การค้นหาไดเรกทอรีแบบสดใช้บัญชี Matrix ที่เข้าสู่ระบบอยู่:

- การค้นหาผู้ใช้จะสอบถามไดเรกทอรีผู้ใช้ Matrix บนโฮมเซิร์ฟเวอร์นั้น
- การค้นหาห้องยอมรับ ID ห้องและนามแฝงที่ระบุชัดเจนโดยตรง จากนั้นจึงย้อนกลับไปค้นหาชื่อห้องที่บัญชีนั้นเข้าร่วมอยู่
- การค้นหาชื่อห้องที่เข้าร่วมเป็นแบบพยายามให้ดีที่สุด หากไม่สามารถจำแนกชื่อห้องเป็น ID หรือนามแฝงได้ ระบบจะละเว้นชื่อนั้นในการจำแนกรายการอนุญาตขณะรันไทม์

## ข้อมูลอ้างอิงการกำหนดค่า

ฟิลด์แบบรายการอนุญาต (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) ยอมรับ ID ผู้ใช้ Matrix แบบเต็ม (ปลอดภัยที่สุด) รายการที่ตรงกับไดเรกทอรีอย่างแน่นอนจะถูกจำแนกเมื่อเริ่มต้น และเมื่อใดก็ตามที่รายการอนุญาตเปลี่ยนขณะที่ตัวมอนิเตอร์กำลังทำงาน รายการที่จำแนกไม่ได้จะถูกละเว้นขณะรันไทม์ รายการอนุญาตของห้องควรใช้ ID ห้องหรือนามแฝงด้วยเหตุผลเดียวกัน

### บัญชีและการเชื่อมต่อ

- `enabled`: เปิดหรือปิดใช้งานช่องทาง
- `name`: ป้ายชื่อแสดงผลเสริมสำหรับบัญชี
- `defaultAccount`: ID บัญชีที่ต้องการใช้เมื่อกำหนดค่าหลายบัญชี Matrix
- `accounts`: การเขียนทับรายบัญชีแบบมีชื่อ ค่า `channels.matrix` ระดับบนสุดจะถูกสืบทอดเป็นค่าเริ่มต้น
- `homeserver`: URL โฮมเซิร์ฟเวอร์ เช่น `https://matrix.example.org`
- `network.dangerouslyAllowPrivateNetwork`: อนุญาตให้บัญชีนี้เชื่อมต่อกับ `localhost`, IP ใน LAN/Tailscale หรือชื่อโฮสต์ภายใน
- `proxy`: URL พร็อกซี HTTP(S) เสริมสำหรับทราฟฟิก Matrix รองรับการเขียนทับรายบัญชี
- `userId`: ID ผู้ใช้ Matrix แบบเต็ม (`@bot:example.org`)
- `accessToken`: โทเค็นเข้าถึงสำหรับการยืนยันตัวตนแบบใช้โทเค็น รองรับค่าข้อความล้วนและ SecretRef ผ่านผู้ให้บริการ env/file/exec ([การจัดการความลับ](/th/gateway/secrets))
- `password`: รหัสผ่านสำหรับการเข้าสู่ระบบแบบใช้รหัสผ่าน รองรับค่าข้อความล้วนและ SecretRef
- `deviceId`: ID อุปกรณ์ Matrix ที่ระบุชัดเจน
- `deviceName`: ชื่อแสดงผลของอุปกรณ์ที่ใช้ตอนเข้าสู่ระบบด้วยรหัสผ่าน
- `avatarUrl`: URL อวาตาร์ตนเองที่เก็บไว้สำหรับการซิงค์โปรไฟล์และการอัปเดต `profile set`
- `initialSyncLimit`: จำนวนเหตุการณ์สูงสุดที่ดึงระหว่างการซิงค์ตอนเริ่มต้น

### การเข้ารหัส

- `encryption`: เปิดใช้งาน E2EE ค่าเริ่มต้น: `false`
- `startupVerification`: `"if-unverified"` (ค่าเริ่มต้นเมื่อ E2EE เปิดอยู่) หรือ `"off"` ขอการยืนยันตนเองโดยอัตโนมัติเมื่อเริ่มต้น หากอุปกรณ์นี้ยังไม่ได้รับการยืนยัน
- `startupVerificationCooldownHours`: ระยะพักก่อนคำขอเริ่มต้นอัตโนมัติครั้งถัดไป ค่าเริ่มต้น: `24`

### การเข้าถึงและนโยบาย

- `groupPolicy`: `"open"`, `"allowlist"` หรือ `"disabled"` ค่าเริ่มต้น: `"allowlist"`
- `groupAllowFrom`: รายการอนุญาตของ ID ผู้ใช้สำหรับทราฟฟิกห้อง
- `dm.enabled`: เมื่อเป็น `false` ให้ละเว้น DM ทั้งหมด ค่าเริ่มต้น: `true`
- `dm.policy`: `"pairing"` (ค่าเริ่มต้น), `"allowlist"`, `"open"` หรือ `"disabled"` ใช้หลังจากบอตเข้าร่วมและจัดประเภทห้องเป็น DM แล้ว ไม่มีผลต่อการจัดการคำเชิญ
- `dm.allowFrom`: รายการอนุญาตของ ID ผู้ใช้สำหรับทราฟฟิก DM
- `dm.sessionScope`: `"per-user"` (ค่าเริ่มต้น) หรือ `"per-room"`
- `dm.threadReplies`: การเขียนทับเฉพาะ DM สำหรับการตอบกลับแบบเธรด (`"off"`, `"inbound"`, `"always"`)
- `allowBots`: ยอมรับข้อความจากบัญชีบอต Matrix อื่นที่กำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `allowlistOnly`: เมื่อเป็น `true` จะบังคับนโยบาย DM ที่ใช้งานอยู่ทั้งหมด (ยกเว้น `"disabled"`) และนโยบายกลุ่ม `"open"` ให้เป็น `"allowlist"` ไม่เปลี่ยนนโยบาย `"disabled"`
- `autoJoin`: `"always"`, `"allowlist"` หรือ `"off"` ค่าเริ่มต้น: `"off"` ใช้กับคำเชิญ Matrix ทุกแบบ รวมถึงคำเชิญลักษณะ DM
- `autoJoinAllowlist`: ห้อง/นามแฝงที่อนุญาตเมื่อ `autoJoin` เป็น `"allowlist"` รายการนามแฝงจะถูกจำแนกกับโฮมเซิร์ฟเวอร์ ไม่ใช่กับสถานะที่ห้องที่เชิญอ้างไว้
- `contextVisibility`: การมองเห็นบริบทเพิ่มเติม (ค่าเริ่มต้น `"all"`, `"allowlist"`, `"allowlist_quote"`)

### พฤติกรรมการตอบกลับ

- `replyToMode`: `"off"`, `"first"`, `"all"` หรือ `"batched"`
- `threadReplies`: `"off"`, `"inbound"` หรือ `"always"`
- `threadBindings`: การเขียนทับรายช่องทางสำหรับการกำหนดเส้นทางเซสชันที่ผูกกับเธรดและวงจรชีวิต
- `streaming`: `"off"` (ค่าเริ่มต้น), `"partial"`, `"quiet"` หรือรูปแบบออบเจ็กต์ `{ mode, preview: { toolProgress } }` `true` ↔ `"partial"`, `false` ↔ `"off"`
- `blockStreaming`: เมื่อเป็น `true` บล็อกของผู้ช่วยที่เสร็จสมบูรณ์จะถูกเก็บเป็นข้อความความคืบหน้าแยกต่างหาก
- `markdown`: การกำหนดค่าการแสดงผล Markdown เสริมสำหรับข้อความขาออก
- `responsePrefix`: สตริงเสริมที่เติมนำหน้าการตอบกลับขาออก
- `textChunkLimit`: ขนาดชังก์ขาออกเป็นจำนวนอักขระเมื่อ `chunkMode: "length"` ค่าเริ่มต้น: `4000`
- `chunkMode`: `"length"` (ค่าเริ่มต้น แบ่งตามจำนวนอักขระ) หรือ `"newline"` (แบ่งที่ขอบเขตบรรทัด)
- `historyLimit`: จำนวนข้อความห้องล่าสุดที่รวมเป็น `InboundHistory` เมื่อข้อความในห้องทริกเกอร์เอเจนต์ ย้อนกลับไปใช้ `messages.groupChat.historyLimit`; ค่าเริ่มต้นที่มีผลคือ `0` (ปิดใช้งาน)
- `mediaMaxMb`: เพดานขนาดสื่อเป็น MB สำหรับการส่งขาออกและการประมวลผลขาเข้า

### การตั้งค่ารีแอ็กชัน

- `ackReaction`: การเขียนทับรีแอ็กชันรับทราบสำหรับช่องทาง/บัญชีนี้
- `ackReactionScope`: การเขียนทับขอบเขต (`"group-mentions"` ค่าเริ่มต้น, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`)
- `reactionNotifications`: โหมดการแจ้งเตือนรีแอ็กชันขาเข้า (`"own"` ค่าเริ่มต้น, `"off"`)

### เครื่องมือและการเขียนทับรายห้อง

- `actions`: การควบคุมการใช้เครื่องมือรายแอ็กชัน (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`)
- `groups`: แผนผังนโยบายรายห้อง ตัวตนเซสชันใช้ ID ห้องที่เสถียรหลังการจำแนก (`rooms` เป็นนามแฝงเดิม)
  - `groups.<room>.account`: จำกัดรายการห้องที่สืบทอดมาหนึ่งรายการให้ใช้กับบัญชีเฉพาะ
  - `groups.<room>.allowBots`: การเขียนทับรายห้องของการตั้งค่าระดับช่องทาง (`true` หรือ `"mentions"`)
  - `groups.<room>.users`: รายการอนุญาตผู้ส่งรายห้อง
  - `groups.<room>.tools`: การเขียนทับการอนุญาต/ปฏิเสธเครื่องมือรายห้อง
  - `groups.<room>.autoReply`: การเขียนทับการควบคุมด้วยการกล่าวถึงรายห้อง `true` ปิดข้อกำหนดการกล่าวถึงสำหรับห้องนั้น; `false` บังคับเปิดกลับมา
  - `groups.<room>.skills`: ตัวกรอง Skills รายห้อง
  - `groups.<room>.systemPrompt`: ส่วนย่อยพรอมป์ระบบรายห้อง

### การตั้งค่าการอนุมัติ Exec

- `execApprovals.enabled`: ส่งการอนุมัติ exec ผ่านพรอมป์แบบเนทีฟของ Matrix
- `execApprovals.approvers`: ID ผู้ใช้ Matrix ที่ได้รับอนุญาตให้อนุมัติ ย้อนกลับไปใช้ `dm.allowFrom`
- `execApprovals.target`: `"dm"` (ค่าเริ่มต้น), `"channel"` หรือ `"both"`
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: รายการอนุญาตเอเจนต์/เซสชันเสริมสำหรับการส่ง

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
