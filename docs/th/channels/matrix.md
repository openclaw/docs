---
read_when:
    - การตั้งค่า Matrix ใน OpenClaw
    - การกำหนดค่า Matrix E2EE และการยืนยัน
summary: สถานะการรองรับ Matrix การตั้งค่า และตัวอย่างการกำหนดค่า
title: Matrix
x-i18n:
    generated_at: "2026-05-02T10:08:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: f280df31cd26182b50613198642285ede1953b546c1593c0723c523ec96635a1
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

จากเช็กเอาต์ในเครื่อง:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` จะลงทะเบียนและเปิดใช้ Plugin ดังนั้นจึงไม่ต้องมีขั้นตอน `openclaw plugins enable matrix` แยกต่างหาก แต่ Plugin จะยังไม่ทำอะไรจนกว่าคุณจะกำหนดค่าช่องทางด้านล่าง ดู [Plugin](/th/tools/plugin) สำหรับลักษณะการทำงานทั่วไปของ Plugin และกฎการติดตั้ง

## ตั้งค่า

1. สร้างบัญชี Matrix บน homeserver ของคุณ
2. กำหนดค่า `channels.matrix` ด้วย `homeserver` + `accessToken` หรือ `homeserver` + `userId` + `password`
3. รีสตาร์ท Gateway
4. เริ่ม DM กับบอต หรือเชิญบอตเข้าห้อง (ดู [การเข้าร่วมอัตโนมัติ](#auto-join) — คำเชิญใหม่จะเข้ามาได้ก็ต่อเมื่อ `autoJoin` อนุญาต)

### การตั้งค่าแบบโต้ตอบ

```bash
openclaw channels add
openclaw configure --section channels
```

วิซาร์ดจะถามข้อมูลเหล่านี้: URL ของ homeserver, วิธีตรวจสอบสิทธิ์ (โทเค็นการเข้าถึงหรือรหัสผ่าน), ID ผู้ใช้ (เฉพาะการตรวจสอบสิทธิ์ด้วยรหัสผ่าน), ชื่ออุปกรณ์ที่ไม่บังคับ, ว่าจะเปิดใช้ E2EE หรือไม่ และว่าจะกำหนดค่าการเข้าถึงห้องและการเข้าร่วมอัตโนมัติหรือไม่

หากมีตัวแปรสภาพแวดล้อม `MATRIX_*` ที่ตรงกันอยู่แล้ว และบัญชีที่เลือกยังไม่มีข้อมูลตรวจสอบสิทธิ์ที่บันทึกไว้ วิซาร์ดจะเสนอทางลัดผ่านตัวแปรสภาพแวดล้อม หากต้องการแปลงชื่อห้องก่อนบันทึกรายการอนุญาต ให้รัน `openclaw channels resolve --channel matrix "Project Room"` เมื่อเปิดใช้ E2EE วิซาร์ดจะเขียนค่ากำหนดและรันการบูตสแตรปเดียวกับ [`openclaw matrix encryption setup`](#encryption-and-verification)

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

### การเข้าร่วมอัตโนมัติ

ค่าเริ่มต้นของ `channels.matrix.autoJoin` คือ `off` ด้วยค่าเริ่มต้นนี้ บอตจะไม่ปรากฏในห้องใหม่หรือ DM จากคำเชิญใหม่จนกว่าคุณจะเข้าร่วมด้วยตนเอง

OpenClaw ไม่สามารถบอกได้ในเวลาที่ได้รับคำเชิญว่าห้องที่ถูกเชิญเป็น DM หรือกลุ่ม ดังนั้นคำเชิญทั้งหมด — รวมถึงคำเชิญแบบ DM — จะผ่าน `autoJoin` ก่อน `dm.policy` จะมีผลภายหลังเท่านั้น หลังจากบอตเข้าร่วมแล้วและห้องถูกจัดประเภทแล้ว

<Warning>
ตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` เพื่อจำกัดคำเชิญที่บอตยอมรับ หรือ `autoJoin: "always"` เพื่อยอมรับทุกคำเชิญ

`autoJoinAllowlist` ยอมรับเฉพาะเป้าหมายที่เสถียร: `!roomId:server`, `#alias:server` หรือ `*` ชื่อห้องแบบข้อความธรรมดาจะถูกปฏิเสธ รายการนามแฝงจะถูกแปลงเทียบกับ homeserver ไม่ใช่เทียบกับสถานะที่ห้องที่เชิญอ้างไว้
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

รายการอนุญาตสำหรับ DM และห้องควรเติมด้วย ID ที่เสถียร:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): ใช้ `@user:server` ชื่อที่แสดงจะแปลงได้เฉพาะเมื่อไดเรกทอรีของ homeserver คืนค่าที่ตรงกันเพียงรายการเดียวเท่านั้น
- ห้อง (`groups`, `autoJoinAllowlist`): ใช้ `!room:server` หรือ `#alias:server` ชื่อจะถูกแปลงแบบพยายามให้ดีที่สุดเทียบกับห้องที่เข้าร่วมแล้ว รายการที่แปลงไม่ได้จะถูกละเว้นขณะรันไทม์

### การทำให้ ID บัญชีเป็นมาตรฐาน

วิซาร์ดจะแปลงชื่อที่อ่านง่ายเป็น ID บัญชีที่ทำให้เป็นมาตรฐานแล้ว ตัวอย่างเช่น `Ops Bot` จะกลายเป็น `ops-bot` เครื่องหมายวรรคตอนจะถูกเอสเคปในชื่อตัวแปรสภาพแวดล้อมแบบมีขอบเขต เพื่อให้บัญชีสองบัญชีไม่ชนกันได้: `-` → `_X2D_` ดังนั้น `ops-prod` จึงแมปเป็น `MATRIX_OPS_X2D_PROD_*`

### ข้อมูลประจำตัวที่แคชไว้

Matrix จัดเก็บข้อมูลประจำตัวที่แคชไว้ใต้ `~/.openclaw/credentials/matrix/`:

- บัญชีเริ่มต้น: `credentials.json`
- บัญชีที่มีชื่อ: `credentials-<account>.json`

เมื่อมีข้อมูลประจำตัวที่แคชไว้ที่นั่น OpenClaw จะถือว่า Matrix ถูกกำหนดค่าแล้ว แม้โทเค็นการเข้าถึงจะไม่ได้อยู่ในไฟล์ค่ากำหนดก็ตาม ซึ่งครอบคลุมการตั้งค่า, `openclaw doctor` และการตรวจสอบสถานะช่องทาง

### ตัวแปรสภาพแวดล้อม

ใช้เมื่อตั้งค่าคีย์กำหนดค่าที่เทียบเท่ากันไว้ บัญชีเริ่มต้นใช้ชื่อที่ไม่มีคำนำหน้า บัญชีที่มีชื่อใช้ ID บัญชีแทรกก่อนส่วนต่อท้าย

| บัญชีเริ่มต้น         | บัญชีที่มีชื่อ (`<ID>` คือ ID บัญชีที่ทำให้เป็นมาตรฐานแล้ว) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

สำหรับบัญชี `ops` ชื่อจะกลายเป็น `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` และอื่นๆ ตัวแปรสภาพแวดล้อมคีย์กู้คืนจะถูกอ่านโดยโฟลว์ CLI ที่รับรู้การกู้คืน (`verify backup restore`, `verify device`, `verify bootstrap`) เมื่อคุณส่งคีย์เข้ามาผ่าน `--recovery-key-stdin`

ไม่สามารถตั้งค่า `MATRIX_HOMESERVER` จาก `.env` ของเวิร์กสเปซได้ ดู [ไฟล์ `.env` ของเวิร์กสเปซ](/th/gateway/security)

## ตัวอย่างค่ากำหนด

ค่าพื้นฐานที่ใช้งานได้จริงพร้อมการจับคู่ DM, รายการอนุญาตห้อง และ E2EE:

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

## ตัวอย่างก่อนส่งแบบสตรีมมิง

การสตรีมคำตอบของ Matrix เป็นแบบเลือกเปิดใช้ `streaming` ควบคุมวิธีที่ OpenClaw ส่งคำตอบของผู้ช่วยที่กำลังดำเนินอยู่ ส่วน `blockStreaming` ควบคุมว่าแต่ละบล็อกที่เสร็จแล้วจะถูกเก็บเป็นข้อความ Matrix ของตัวเองหรือไม่

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

หากต้องการเก็บตัวอย่างคำตอบแบบสดไว้ แต่ซ่อนบรรทัดเครื่องมือ/ความคืบหน้าระหว่างทาง ให้ใช้รูปแบบออบเจ็กต์:

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
| `"partial"`       | แก้ไขข้อความตัวอักษรปกติหนึ่งรายการในตำแหน่งเดิมขณะที่โมเดลเขียนบล็อกปัจจุบัน ไคลเอนต์ Matrix มาตรฐานอาจแจ้งเตือนที่ตัวอย่างแรก ไม่ใช่การแก้ไขสุดท้าย              |
| `"quiet"`         | เหมือนกับ `"partial"` แต่ข้อความเป็นประกาศที่ไม่แจ้งเตือน ผู้รับจะได้รับการแจ้งเตือนก็ต่อเมื่อกฎพุชรายผู้ใช้ตรงกับการแก้ไขที่สรุปแล้วเท่านั้น (ดูด้านล่าง) |

`blockStreaming` เป็นอิสระจาก `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (ค่าเริ่มต้น)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | แบบร่างสดสำหรับบล็อกปัจจุบัน บล็อกที่เสร็จแล้วถูกเก็บเป็นข้อความ | แบบร่างสดสำหรับบล็อกปัจจุบัน สรุปผลในตำแหน่งเดิม |
| `"off"`                 | ข้อความ Matrix ที่แจ้งเตือนหนึ่งรายการต่อบล็อกที่เสร็จแล้ว                     | ข้อความ Matrix ที่แจ้งเตือนหนึ่งรายการสำหรับคำตอบเต็ม      |

หมายเหตุ:

- หากตัวอย่างก่อนส่งโตเกินขีดจำกัดขนาดต่อเหตุการณ์ของ Matrix, OpenClaw จะหยุดสตรีมตัวอย่างก่อนส่งและถอยกลับไปใช้การส่งเฉพาะผลลัพธ์สุดท้าย
- คำตอบสื่อจะส่งไฟล์แนบตามปกติเสมอ หากตัวอย่างก่อนส่งที่ค้างอยู่ไม่สามารถนำกลับมาใช้ได้อย่างปลอดภัยอีกต่อไป OpenClaw จะปกปิดตัวอย่างนั้นก่อนส่งคำตอบสื่อสุดท้าย
- การอัปเดตตัวอย่างก่อนส่งของความคืบหน้าเครื่องมือจะเปิดใช้ตามค่าเริ่มต้นเมื่อการสตรีมตัวอย่างก่อนส่งของ Matrix ทำงาน ตั้งค่า `streaming.preview.toolProgress: false` เพื่อเก็บการแก้ไขตัวอย่างก่อนส่งสำหรับข้อความคำตอบ แต่ปล่อยให้ความคืบหน้าเครื่องมืออยู่บนเส้นทางการส่งปกติ
- การแก้ไขตัวอย่างก่อนส่งมีต้นทุนเป็นการเรียก Matrix API เพิ่มเติม ปล่อย `streaming: "off"` ไว้หากคุณต้องการโปรไฟล์การจำกัดอัตราที่ระมัดระวังที่สุด

## เมทาดาทาการอนุมัติ

พรอมป์อนุมัติแบบเนทีฟของ Matrix เป็นเหตุการณ์ `m.room.message` ปกติที่มีเนื้อหาเหตุการณ์แบบกำหนดเองเฉพาะ OpenClaw ใต้ `com.openclaw.approval` Matrix อนุญาตคีย์เนื้อหาเหตุการณ์แบบกำหนดเอง ดังนั้นไคลเอนต์มาตรฐานจึงยังแสดงผลเนื้อหาข้อความ ขณะที่ไคลเอนต์ที่รับรู้ OpenClaw สามารถอ่าน ID การอนุมัติ โหมด สถานะ การตัดสินใจที่ใช้ได้ และรายละเอียด exec/Plugin ในรูปแบบมีโครงสร้างได้

เมื่อพรอมป์อนุมัติยาวเกินไปสำหรับเหตุการณ์ Matrix หนึ่งรายการ OpenClaw จะแบ่งข้อความที่มองเห็นเป็นชิ้น และแนบ `com.openclaw.approval` กับชิ้นแรกเท่านั้น รีแอ็กชันสำหรับการตัดสินใจอนุญาต/ปฏิเสธจะผูกกับเหตุการณ์แรกนั้น ดังนั้นพรอมป์ยาวจึงยังใช้เป้าหมายการอนุมัติเดียวกับพรอมป์แบบเหตุการณ์เดียว

### กฎพุชแบบโฮสต์เองสำหรับตัวอย่างก่อนส่งที่สรุปแล้วแบบเงียบ

`streaming: "quiet"` จะแจ้งเตือนผู้รับก็ต่อเมื่อบล็อกหรือเทิร์นถูกสรุปแล้วเท่านั้น — กฎพุชรายผู้ใช้ต้องตรงกับเครื่องหมายตัวอย่างก่อนส่งที่สรุปแล้ว ดู [กฎพุช Matrix สำหรับตัวอย่างก่อนส่งแบบเงียบ](/th/channels/matrix-push-rules) สำหรับสูตรแบบเต็ม (โทเค็นผู้รับ, การตรวจสอบ pusher, การติดตั้งกฎ, หมายเหตุราย homeserver)

## ห้องบอตต่อบอต

ตามค่าเริ่มต้น ข้อความ Matrix จากบัญชี Matrix ของ OpenClaw อื่นที่กำหนดค่าไว้จะถูกละเว้น

ใช้ `allowBots` เมื่อคุณตั้งใจต้องการทราฟฟิก Matrix ระหว่างเอเจนต์:

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
- `allowBots: "mentions"` ยอมรับข้อความเหล่านั้นเฉพาะเมื่อข้อความกล่าวถึงบอตนี้อย่างมองเห็นได้ในห้องเท่านั้น DM ยังคงอนุญาต
- `groups.<room>.allowBots` จะแทนที่การตั้งค่าระดับบัญชีสำหรับห้องเดียว
- OpenClaw ยังคงละเว้นข้อความจาก ID ผู้ใช้ Matrix เดียวกันเพื่อหลีกเลี่ยงลูปการตอบตัวเอง
- Matrix ไม่เปิดเผยแฟล็กบอตแบบเนทีฟที่นี่ OpenClaw ถือว่า "เขียนโดยบอต" คือ "ส่งโดยบัญชี Matrix อื่นที่กำหนดค่าไว้บน OpenClaw Gateway นี้"

ใช้รายการอนุญาตห้องที่เข้มงวดและข้อกำหนดการกล่าวถึงเมื่อเปิดใช้ทราฟฟิกบอตต่อบอตในห้องที่ใช้ร่วมกัน

## การเข้ารหัสและการยืนยัน

ในห้องที่เข้ารหัส (E2EE) เหตุการณ์รูปภาพขาออกใช้ `thumbnail_file` เพื่อให้ตัวอย่างรูปภาพถูกเข้ารหัสพร้อมไฟล์แนบเต็ม ห้องที่ไม่เข้ารหัสยังคงใช้ `thumbnail_url` แบบธรรมดา ไม่ต้องกำหนดค่าใดๆ — Plugin จะตรวจจับสถานะ E2EE โดยอัตโนมัติ

คำสั่ง `openclaw matrix` ทั้งหมดยอมรับ `--verbose` (การวินิจฉัยแบบเต็ม), `--json` (เอาต์พุตที่เครื่องอ่านได้) และ `--account <id>` (การตั้งค่าหลายบัญชี) เอาต์พุตจะกระชับตามค่าเริ่มต้นพร้อมการบันทึกภายใน SDK แบบเงียบ ตัวอย่างด้านล่างแสดงรูปแบบมาตรฐาน เพิ่มแฟล็กตามต้องการ

### เปิดใช้การเข้ารหัส

```bash
openclaw matrix encryption setup
```

บูตสแตรปพื้นที่จัดเก็บความลับและ cross-signing สร้างข้อมูลสำรอง room-key หากจำเป็น จากนั้นพิมพ์สถานะและขั้นตอนถัดไป แฟล็กที่มีประโยชน์:

- `--recovery-key <key>` ใช้ recovery key ก่อนบูตสแตรป (แนะนำให้ใช้รูปแบบ stdin ที่อธิบายไว้ด้านล่าง)
- `--force-reset-cross-signing` ทิ้งข้อมูลประจำตัว cross-signing ปัจจุบันและสร้างรายการใหม่ (ใช้เมื่อมีเจตนาเท่านั้น)

สำหรับบัญชีใหม่ ให้เปิดใช้ E2EE ตอนสร้างบัญชี:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` เป็นชื่อแฝงของ `--enable-e2ee`

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
- `Cross-signing verified`: SDK รายงานการยืนยันผ่าน cross-signing
- `Signed by owner`: ลงนามโดย self-signing key ของคุณเอง (เพื่อการวินิจฉัยเท่านั้น)

`Verified by owner` จะเป็น `yes` เฉพาะเมื่อ `Cross-signing verified` เป็น `yes` เท่านั้น ความเชื่อถือเฉพาะเครื่องหรือการลงนามโดยเจ้าของเพียงอย่างเดียวไม่เพียงพอ

`--allow-degraded-local-state` ส่งคืนการวินิจฉัยแบบดีที่สุดเท่าที่ทำได้โดยไม่เตรียมบัญชี Matrix ก่อน มีประโยชน์สำหรับการตรวจสอบแบบออฟไลน์หรือที่กำหนดค่าไว้บางส่วน

### ยืนยันอุปกรณ์นี้ด้วย recovery key

recovery key เป็นข้อมูลอ่อนไหว ให้ไพป์ผ่าน stdin แทนการส่งบนบรรทัดคำสั่ง ตั้งค่า `MATRIX_RECOVERY_KEY` (หรือ `MATRIX_<ID>_RECOVERY_KEY` สำหรับบัญชีที่มีชื่อ):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

คำสั่งจะรายงานสามสถานะ:

- `Recovery key accepted`: Matrix ยอมรับคีย์สำหรับพื้นที่จัดเก็บความลับหรือความเชื่อถืออุปกรณ์
- `Backup usable`: สามารถโหลดข้อมูลสำรอง room-key ด้วยวัสดุกู้คืนที่เชื่อถือได้
- `Device verified by owner`: อุปกรณ์นี้มีความเชื่อถือของข้อมูลประจำตัว cross-signing ของ Matrix ครบถ้วน

คำสั่งจะออกด้วยสถานะไม่เป็นศูนย์เมื่อความเชื่อถือข้อมูลประจำตัวแบบเต็มยังไม่สมบูรณ์ แม้ว่า recovery key จะปลดล็อกวัสดุข้อมูลสำรองแล้วก็ตาม ในกรณีนั้น ให้ทำการยืนยันตัวเองให้เสร็จจากไคลเอนต์ Matrix อื่น:

```bash
openclaw matrix verify self
```

`verify self` จะรอจนกว่า `Cross-signing verified: yes` ก่อนออกสำเร็จ ใช้ `--timeout-ms <ms>` เพื่อปรับเวลารอ

รูปแบบคีย์ตรง `openclaw matrix verify device "<recovery-key>"` ก็ยอมรับเช่นกัน แต่คีย์จะไปอยู่ในประวัติเชลล์ของคุณ

### บูตสแตรปหรือซ่อมแซม cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` คือคำสั่งซ่อมแซมและตั้งค่าสำหรับบัญชีที่เข้ารหัส โดยจะทำตามลำดับดังนี้:

- บูตสแตรปพื้นที่จัดเก็บความลับ โดยนำ recovery key ที่มีอยู่มาใช้ซ้ำเมื่อเป็นไปได้
- บูตสแตรป cross-signing และอัปโหลด public keys ที่ขาดหายไป
- ทำเครื่องหมายและ cross-sign อุปกรณ์ปัจจุบัน
- สร้างข้อมูลสำรอง room-key ฝั่งเซิร์ฟเวอร์หากยังไม่มี

หาก homeserver ต้องใช้ UIA เพื่ออัปโหลดคีย์ cross-signing OpenClaw จะลองแบบไม่ใช้การยืนยันตัวตนก่อน จากนั้นลอง `m.login.dummy` แล้วจึงลอง `m.login.password` (ต้องใช้ `channels.matrix.password`)

แฟล็กที่มีประโยชน์:

- `--recovery-key-stdin` (ใช้คู่กับ `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) หรือ `--recovery-key <key>`
- `--force-reset-cross-signing` เพื่อทิ้งข้อมูลประจำตัว cross-signing ปัจจุบัน (ใช้เมื่อมีเจตนาเท่านั้น)

### ข้อมูลสำรอง room-key

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` แสดงว่ามีข้อมูลสำรองฝั่งเซิร์ฟเวอร์หรือไม่ และอุปกรณ์นี้ถอดรหัสได้หรือไม่ `backup restore` นำเข้า room keys ที่สำรองไว้เข้า crypto store ภายในเครื่อง หาก recovery key อยู่บนดิสก์แล้ว คุณสามารถละ `--recovery-key-stdin` ได้

หากต้องการแทนที่ข้อมูลสำรองที่เสียด้วย baseline ใหม่ (ยอมรับการสูญเสียประวัติเก่าที่กู้คืนไม่ได้ และยังสามารถสร้างพื้นที่จัดเก็บความลับใหม่ได้หากโหลดความลับของข้อมูลสำรองปัจจุบันไม่ได้):

```bash
openclaw matrix verify backup reset --yes
```

เพิ่ม `--rotate-recovery-key` เฉพาะเมื่อคุณตั้งใจให้ recovery key ก่อนหน้าไม่สามารถปลดล็อก baseline ข้อมูลสำรองใหม่ได้อีก

### การแสดงรายการ การขอ และการตอบกลับการยืนยัน

```bash
openclaw matrix verify list
```

แสดงรายการคำขอยืนยันที่รอดำเนินการสำหรับบัญชีที่เลือก

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

ส่งคำขอยืนยันจากบัญชี OpenClaw นี้ `--own-user` ขอการยืนยันตัวเอง (คุณยอมรับพรอมป์ในไคลเอนต์ Matrix อื่นของผู้ใช้เดียวกัน); `--user-id`/`--device-id`/`--room-id` กำหนดเป้าหมายไปยังผู้อื่น ไม่สามารถใช้ `--own-user` ร่วมกับแฟล็กกำหนดเป้าหมายอื่นได้

สำหรับการจัดการวงจรชีวิตระดับล่าง โดยทั่วไปเมื่อเฝ้าตามคำขอขาเข้าจากไคลเอนต์อื่น คำสั่งเหล่านี้ทำงานกับคำขอ `<id>` ที่ระบุ (พิมพ์โดย `verify list` และ `verify request`):

| คำสั่ง                                     | วัตถุประสงค์                                                        |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | ยอมรับคำขอขาเข้า                                                    |
| `openclaw matrix verify start <id>`        | เริ่มโฟลว์ SAS                                                       |
| `openclaw matrix verify sas <id>`          | พิมพ์อีโมจิหรือเลขทศนิยมของ SAS                                     |
| `openclaw matrix verify confirm-sas <id>`  | ยืนยันว่า SAS ตรงกับที่ไคลเอนต์อีกฝ่ายแสดง                         |
| `openclaw matrix verify mismatch-sas <id>` | ปฏิเสธ SAS เมื่ออีโมจิหรือเลขทศนิยมไม่ตรงกัน                        |
| `openclaw matrix verify cancel <id>`       | ยกเลิก; รับ `--reason <text>` และ `--code <matrix-code>` เป็นตัวเลือก |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, และ `cancel` รับ `--user-id` และ `--room-id` เป็นคำใบ้การติดตามผล DM เมื่อการยืนยันยึดกับห้องข้อความส่วนตัวที่ระบุ

### หมายเหตุสำหรับหลายบัญชี

หากไม่มี `--account <id>` คำสั่ง Matrix CLI จะใช้บัญชีค่าเริ่มต้นโดยนัย หากคุณมีหลายบัญชีที่ตั้งชื่อไว้และยังไม่ได้ตั้งค่า `channels.matrix.defaultAccount` คำสั่งจะไม่เดาเองและจะขอให้คุณเลือก เมื่อ E2EE ถูกปิดใช้หรือไม่พร้อมใช้งานสำหรับบัญชีที่ตั้งชื่อไว้ ข้อผิดพลาดจะชี้ไปยังคีย์การกำหนดค่าของบัญชีนั้น เช่น `channels.matrix.accounts.assistant.encryption`

<AccordionGroup>
  <Accordion title="พฤติกรรมตอนเริ่มต้น">
    เมื่อใช้ `encryption: true`, `startupVerification` มีค่าเริ่มต้นเป็น `"if-unverified"` ตอนเริ่มต้น อุปกรณ์ที่ยังไม่ยืนยันจะขอการยืนยันตัวเองในไคลเอนต์ Matrix อื่น โดยข้ามรายการซ้ำและใช้ช่วงพัก (ค่าเริ่มต้นคือ 24 ชั่วโมง) ปรับด้วย `startupVerificationCooldownHours` หรือปิดใช้ด้วย `startupVerification: "off"`

    ตอนเริ่มต้นยังรันขั้นตอน crypto bootstrap แบบระมัดระวังที่นำพื้นที่จัดเก็บความลับและข้อมูลประจำตัว cross-signing ปัจจุบันมาใช้ซ้ำ หากสถานะ bootstrap เสีย OpenClaw จะพยายามซ่อมแซมแบบมีการป้องกันแม้ไม่มี `channels.matrix.password`; หาก homeserver ต้องใช้ password UIA ตอนเริ่มต้นจะบันทึกคำเตือนและยังไม่ถือเป็นข้อผิดพลาดร้ายแรง อุปกรณ์ที่ลงนามโดยเจ้าของแล้วจะถูกเก็บไว้

    ดู [การย้ายข้อมูล Matrix](/th/channels/matrix-migration) สำหรับโฟลว์การอัปเกรดฉบับเต็ม

  </Accordion>

  <Accordion title="ประกาศการยืนยัน">
    Matrix โพสต์ประกาศวงจรชีวิตการยืนยันลงในห้องตรวจสอบ DM แบบเข้มงวดเป็นข้อความ `m.notice`: คำขอ ความพร้อม (พร้อมคำแนะนำ "Verify by emoji") การเริ่มต้น/เสร็จสมบูรณ์ และรายละเอียด SAS (อีโมจิ/ทศนิยม) เมื่อพร้อมใช้งาน

    คำขอขาเข้าจากไคลเอนต์ Matrix อื่นจะถูกติดตามและยอมรับอัตโนมัติ สำหรับการยืนยันตัวเอง OpenClaw จะเริ่มโฟลว์ SAS โดยอัตโนมัติและยืนยันฝั่งของตัวเองเมื่อมีการยืนยันด้วยอีโมจิพร้อมใช้งาน แต่คุณยังต้องเปรียบเทียบและยืนยัน "They match" ในไคลเอนต์ Matrix ของคุณ

    ประกาศระบบการยืนยันจะไม่ถูกส่งต่อไปยังไปป์ไลน์แชตของ agent

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

    สำหรับการยืนยันตัวตนด้วยโทเค็น ให้สร้าง access token ใหม่ในไคลเอนต์ Matrix หรือ UI ผู้ดูแลระบบของคุณ จากนั้นอัปเดต OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    แทนที่ `assistant` ด้วย ID บัญชีจากคำสั่งที่ล้มเหลว หรือไม่ต้องระบุ `--account` สำหรับบัญชีค่าเริ่มต้น

  </Accordion>

  <Accordion title="สุขอนามัยอุปกรณ์">
    อุปกรณ์เก่าที่ OpenClaw จัดการไว้อาจสะสมได้ แสดงรายการและลบรายการที่ไม่ใช้งาน:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE ใช้เส้นทาง crypto ของ Rust อย่างเป็นทางการจาก `matrix-js-sdk` พร้อม `fake-indexeddb` เป็น IndexedDB shim สถานะ crypto จะคงอยู่ที่ `crypto-idb-snapshot.json` (สิทธิ์ไฟล์แบบจำกัด)

    สถานะ runtime ที่เข้ารหัสอยู่ใต้ `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` และรวมถึง sync store, crypto store, recovery key, IDB snapshot, thread bindings และสถานะ startup verification เมื่อโทเค็นเปลี่ยนแต่ข้อมูลประจำตัวของบัญชียังคงเดิม OpenClaw จะนำรากที่มีอยู่ที่ดีที่สุดมาใช้ซ้ำเพื่อให้สถานะก่อนหน้ายังคงมองเห็นได้

  </Accordion>
</AccordionGroup>

## การจัดการโปรไฟล์

อัปเดตโปรไฟล์ตนเองของ Matrix สำหรับบัญชีที่เลือก:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

คุณสามารถส่งทั้งสองตัวเลือกในการเรียกครั้งเดียวได้ Matrix ยอมรับ URL อวตาร `mxc://` โดยตรง; เมื่อคุณส่ง `http://` หรือ `https://` OpenClaw จะอัปโหลดไฟล์ก่อนและจัดเก็บ URL `mxc://` ที่ได้ลงใน `channels.matrix.avatarUrl` (หรือ override ต่อบัญชี)

## เธรด

Matrix รองรับเธรด Matrix แบบเนทีฟสำหรับทั้งการตอบกลับอัตโนมัติและการส่งผ่าน message-tool มีตัวควบคุมอิสระสองรายการกำหนดพฤติกรรม:

### การกำหนดเส้นทางเซสชัน (`sessionScope`)

`dm.sessionScope` กำหนดว่าห้อง DM ของ Matrix จับคู่กับเซสชัน OpenClaw อย่างไร:

- `"per-user"` (ค่าเริ่มต้น): ห้อง DM ทั้งหมดที่มีเพียร์ที่กำหนดเส้นทางเดียวกันใช้เซสชันเดียวร่วมกัน
- `"per-room"`: ห้อง DM ของ Matrix แต่ละห้องได้รับคีย์เซสชันของตัวเอง แม้ว่าเพียร์จะเป็นคนเดียวกันก็ตาม

การผูกการสนทนาอย่างชัดเจนจะชนะ `sessionScope` เสมอ ดังนั้นห้องและเธรดที่ผูกไว้จะคงเซสชันเป้าหมายที่เลือกไว้

### การตอบกลับแบบเธรด (`threadReplies`)

`threadReplies` กำหนดว่าบอตโพสต์คำตอบไว้ที่ใด:

- `"off"`: คำตอบเป็นระดับบนสุด ข้อความขาเข้าที่อยู่ในเธรดจะยังอยู่บนเซสชันหลัก
- `"inbound"`: ตอบกลับภายในเธรดเฉพาะเมื่อข้อความขาเข้าอยู่ในเธรดนั้นอยู่แล้ว
- `"always"`: ตอบกลับภายในเธรดที่มีข้อความที่ทริกเกอร์เป็นราก การสนทนานั้นจะถูกกำหนดเส้นทางผ่านเซสชันที่มีขอบเขตเธรดตรงกันตั้งแต่ทริกเกอร์แรกเป็นต้นไป

`dm.threadReplies` override สิ่งนี้สำหรับ DM เท่านั้น เช่น แยกเธรดห้องให้อยู่โดดเดี่ยวไว้ พร้อมกับให้ DM เป็นแบบแบน

### การสืบทอดเธรดและคำสั่งสแลช

- ข้อความแบบเธรดขาเข้าจะรวมข้อความรากของเธรดเป็นบริบทเพิ่มเติมสำหรับเอเจนต์
- การส่งผ่านเครื่องมือข้อความจะสืบทอดเธรด Matrix ปัจจุบันโดยอัตโนมัติเมื่อกำหนดเป้าหมายไปยังห้องเดียวกัน (หรือเป้าหมายผู้ใช้ DM เดียวกัน) เว้นแต่จะระบุ `threadId` อย่างชัดเจน
- การนำเป้าหมายผู้ใช้ DM กลับมาใช้ซ้ำจะทำงานเฉพาะเมื่อเมทาดาทาของเซสชันปัจจุบันพิสูจน์ได้ว่าเป็นคู่สนทนา DM เดียวกันบนบัญชี Matrix เดียวกัน มิฉะนั้น OpenClaw จะถอยกลับไปใช้การกำหนดเส้นทางตามขอบเขตผู้ใช้ตามปกติ
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และ `/acp spawn` ที่ผูกกับเธรด ล้วนทำงานได้ในห้อง Matrix และ DM
- `/focus` ระดับบนสุดจะสร้างเธรด Matrix ใหม่และผูกเข้ากับเซสชันเป้าหมายเมื่อเปิดใช้ `threadBindings.spawnSessions`
- การเรียกใช้ `/focus` หรือ `/acp spawn --thread here` ภายในเธรด Matrix ที่มีอยู่จะผูกเธรดนั้นไว้ ณ ตำแหน่งเดิม

เมื่อ OpenClaw ตรวจพบว่าห้อง DM ของ Matrix ชนกับห้อง DM อื่นบนเซสชันที่ใช้ร่วมกันเดียวกัน ระบบจะโพสต์ `m.notice` แบบครั้งเดียวในห้องนั้น โดยชี้ไปยังทางออก `/focus` และแนะนำให้เปลี่ยน `dm.sessionScope` การแจ้งเตือนจะปรากฏเฉพาะเมื่อเปิดใช้การผูกเธรด

## การผูกบทสนทนา ACP

ห้อง Matrix, DM และเธรด Matrix ที่มีอยู่สามารถเปลี่ยนเป็นพื้นที่ทำงาน ACP ที่คงทนได้โดยไม่ต้องเปลี่ยนพื้นผิวแชต

ขั้นตอนด่วนสำหรับผู้ปฏิบัติการ:

- เรียกใช้ `/acp spawn codex --bind here` ภายใน DM, ห้อง หรือเธรดที่มีอยู่ของ Matrix ที่คุณต้องการใช้งานต่อ
- ใน DM หรือห้อง Matrix ระดับบนสุด DM/ห้องปัจจุบันจะยังเป็นพื้นผิวแชต และข้อความในอนาคตจะถูกส่งต่อไปยังเซสชัน ACP ที่สร้างขึ้น
- ภายในเธรด Matrix ที่มีอยู่ `--bind here` จะผูกเธรดปัจจุบันนั้นไว้ ณ ตำแหน่งเดิม
- `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP ที่ผูกไว้เดิม ณ ตำแหน่งเดิม
- `/acp close` จะปิดเซสชัน ACP และลบการผูกออก

หมายเหตุ:

- `--bind here` จะไม่สร้างเธรดลูกของ Matrix
- `threadBindings.spawnSessions` ควบคุม `/acp spawn --thread auto|here` ซึ่งเป็นกรณีที่ OpenClaw ต้องสร้างหรือผูกเธรดลูกของ Matrix

### การกำหนดค่าการผูกเธรด

Matrix สืบทอดค่าเริ่มต้นส่วนกลางจาก `session.threadBindings` และยังรองรับการแทนที่ค่าเฉพาะช่องทางด้วย:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

การสร้างเซสชันที่ผูกกับเธรดของ Matrix เปิดเป็นค่าเริ่มต้น:

- ตั้งค่า `threadBindings.spawnSessions: false` เพื่อบล็อกไม่ให้ `/focus` ระดับบนสุดและ `/acp spawn --thread auto|here` สร้าง/ผูกเธรด Matrix
- ตั้งค่า `threadBindings.defaultSpawnContext: "isolated"` เมื่อการสร้างเธรดของซับเอเจนต์แบบเนทีฟไม่ควรแยกสำเนาทรานสคริปต์ของพาเรนต์

## ปฏิกิริยา

Matrix รองรับปฏิกิริยาขาออก การแจ้งเตือนปฏิกิริยาขาเข้า และปฏิกิริยารับทราบ

เครื่องมือปฏิกิริยาขาออกถูกควบคุมโดย `channels.matrix.actions.reactions`:

- `react` เพิ่มปฏิกิริยาให้กับเหตุการณ์ Matrix
- `reactions` แสดงรายการสรุปปฏิกิริยาปัจจุบันของเหตุการณ์ Matrix
- `emoji=""` ลบปฏิกิริยาของบอตเองบนเหตุการณ์นั้น
- `remove: true` ลบเฉพาะปฏิกิริยาอีโมจิที่ระบุจากบอต

**ลำดับการแก้ค่า** (ค่าที่กำหนดไว้แรกชนะ):

| การตั้งค่า              | ลำดับ                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | ต่อบัญชี → ช่องทาง → `messages.ackReaction` → อีโมจิประจำตัวของเอเจนต์เป็นค่าทดแทน |
| `ackReactionScope`      | ต่อบัญชี → ช่องทาง → `messages.ackReactionScope` → ค่าเริ่มต้น `"group-mentions"` |
| `reactionNotifications` | ต่อบัญชี → ช่องทาง → ค่าเริ่มต้น `"own"`                                          |

`reactionNotifications: "own"` จะส่งต่อเหตุการณ์ `m.reaction` ที่เพิ่มเข้ามาเมื่อเหตุการณ์เหล่านั้นมุ่งเป้าไปยังข้อความ Matrix ที่บอตเขียนขึ้นเอง; `"off"` ปิดใช้งานเหตุการณ์ระบบของปฏิกิริยา การลบปฏิกิริยาจะไม่ถูกสังเคราะห์เป็นเหตุการณ์ระบบ เพราะ Matrix แสดงสิ่งเหล่านั้นเป็นการปกปิดข้อความ ไม่ใช่การลบ `m.reaction` แบบแยกต่างหาก

## บริบทประวัติ

- `channels.matrix.historyLimit` ควบคุมจำนวนข้อความล่าสุดในห้องที่จะรวมเป็น `InboundHistory` เมื่อข้อความในห้อง Matrix กระตุ้นเอเจนต์ ถอยกลับไปใช้ `messages.groupChat.historyLimit`; หากไม่ได้ตั้งค่าทั้งคู่ ค่าเริ่มต้นที่มีผลคือ `0` ตั้งค่า `0` เพื่อปิดใช้งาน
- ประวัติห้อง Matrix เป็นเฉพาะห้องเท่านั้น DM ยังคงใช้ประวัติเซสชันตามปกติ
- ประวัติห้อง Matrix เป็นแบบรอดำเนินการเท่านั้น: OpenClaw บัฟเฟอร์ข้อความในห้องที่ยังไม่ได้กระตุ้นการตอบกลับ จากนั้นถ่ายสแนปช็อตหน้าต่างนั้นเมื่อมีการกล่าวถึงหรือทริกเกอร์อื่นมาถึง
- ข้อความทริกเกอร์ปัจจุบันจะไม่รวมอยู่ใน `InboundHistory`; ข้อความนั้นจะอยู่ในเนื้อหาขาเข้าหลักสำหรับรอบนั้น
- การลองซ้ำของเหตุการณ์ Matrix เดียวกันจะนำสแนปช็อตประวัติเดิมกลับมาใช้ แทนที่จะเลื่อนไปยังข้อความใหม่กว่าในห้อง

## การมองเห็นบริบท

Matrix รองรับตัวควบคุม `contextVisibility` ที่ใช้ร่วมกันสำหรับบริบทห้องเพิ่มเติม เช่น ข้อความตอบกลับที่ดึงมา รากเธรด และประวัติที่รอดำเนินการ

- `contextVisibility: "all"` เป็นค่าเริ่มต้น บริบทเพิ่มเติมจะถูกเก็บไว้ตามที่ได้รับ
- `contextVisibility: "allowlist"` กรองบริบทเพิ่มเติมให้เหลือเฉพาะผู้ส่งที่ผ่านการตรวจสอบรายการอนุญาตของห้อง/ผู้ใช้ที่ใช้งานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บคำตอบที่อ้างอิงอย่างชัดเจนหนึ่งรายการไว้

การตั้งค่านี้มีผลต่อการมองเห็นบริบทเพิ่มเติม ไม่ใช่ว่าข้อความขาเข้านั้นสามารถกระตุ้นการตอบกลับได้หรือไม่
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

ดู [กลุ่ม](/th/channels/groups) สำหรับพฤติกรรมการควบคุมด้วยการกล่าวถึงและรายการอนุญาต

ตัวอย่างการจับคู่สำหรับ DM ของ Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

หากผู้ใช้ Matrix ที่ยังไม่ได้รับอนุมัติยังส่งข้อความถึงคุณก่อนการอนุมัติ OpenClaw จะนำรหัสจับคู่ที่รอดำเนินการเดิมกลับมาใช้ และอาจส่งคำตอบเตือนความจำหลังช่วงพักสั้น ๆ แทนที่จะสร้างรหัสใหม่

ดู [การจับคู่](/th/channels/pairing) สำหรับขั้นตอนการจับคู่ DM ที่ใช้ร่วมกันและโครงร่างการจัดเก็บ

## การซ่อมแซมห้องตรง

หากสถานะข้อความตรงคลาดเคลื่อนออกจากการซิงค์ OpenClaw อาจลงเอยด้วยการแมป `m.direct` ที่ค้างอยู่ ซึ่งชี้ไปยังห้องเดี่ยวเก่าแทนที่จะเป็น DM ที่ใช้งานจริง ตรวจสอบการแมปปัจจุบันสำหรับคู่สนทนา:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

ซ่อมแซม:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

คำสั่งทั้งสองรองรับ `--account <id>` สำหรับการตั้งค่าหลายบัญชี ขั้นตอนซ่อมแซมจะ:

- เลือก DM แบบ 1:1 ที่เคร่งครัดซึ่งถูกแมปไว้แล้วใน `m.direct` เป็นอันดับแรก
- ถอยกลับไปใช้ DM แบบ 1:1 ที่เคร่งครัดใด ๆ ที่เข้าร่วมอยู่ในปัจจุบันกับผู้ใช้นั้น
- สร้างห้องตรงใหม่และเขียน `m.direct` ใหม่หากไม่มี DM ที่สมบูรณ์อยู่

คำสั่งนี้จะไม่ลบห้องเก่าโดยอัตโนมัติ แต่จะเลือก DM ที่สมบูรณ์และอัปเดตการแมป เพื่อให้การส่ง Matrix ในอนาคต การแจ้งเตือนการยืนยัน และขั้นตอนข้อความตรงอื่น ๆ มุ่งเป้าไปยังห้องที่ถูกต้อง

## การอนุมัติ Exec

Matrix สามารถทำหน้าที่เป็นไคลเอนต์อนุมัติแบบเนทีฟได้ กำหนดค่าภายใต้ `channels.matrix.execApprovals` (หรือ `channels.matrix.accounts.<account>.execApprovals` สำหรับการแทนที่ค่าต่อบัญชี):

- `enabled`: ส่งการอนุมัติผ่านพรอมป์แบบเนทีฟของ Matrix เมื่อไม่ได้ตั้งค่าหรือเป็น `"auto"` Matrix จะเปิดใช้งานโดยอัตโนมัติเมื่อแก้หาผู้อนุมัติได้อย่างน้อยหนึ่งราย ตั้งค่า `false` เพื่อปิดใช้งานอย่างชัดเจน
- `approvers`: ID ผู้ใช้ Matrix (`@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอ exec ไม่บังคับ — ถอยกลับไปใช้ `channels.matrix.dm.allowFrom`
- `target`: ตำแหน่งที่จะส่งพรอมป์ `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ; `"channel"` ส่งไปยังห้อง Matrix หรือ DM ต้นทาง; `"both"` ส่งไปทั้งสองที่
- `agentFilter` / `sessionFilter`: รายการอนุญาตแบบไม่บังคับสำหรับเอเจนต์/เซสชันที่จะทริกเกอร์การส่งผ่าน Matrix

การอนุญาตแตกต่างกันเล็กน้อยระหว่างชนิดการอนุมัติ:

- **การอนุมัติ Exec** ใช้ `execApprovals.approvers` และถอยกลับไปใช้ `dm.allowFrom`
- **การอนุมัติ Plugin** อนุญาตผ่าน `dm.allowFrom` เท่านั้น

ทั้งสองชนิดใช้ทางลัดปฏิกิริยาและการอัปเดตข้อความของ Matrix ร่วมกัน ผู้อนุมัติจะเห็นทางลัดปฏิกิริยาบนข้อความอนุมัติหลัก:

- `✅` อนุญาตครั้งเดียว
- `❌` ปฏิเสธ
- `♾️` อนุญาตเสมอ (เมื่อนโยบาย exec ที่มีผลอนุญาต)

คำสั่งสแลชสำรอง: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`

เฉพาะผู้อนุมัติที่แก้หาได้เท่านั้นที่สามารถอนุมัติหรือปฏิเสธได้ การส่งผ่านช่องทางสำหรับการอนุมัติ exec จะรวมข้อความคำสั่งไว้ด้วย — เปิดใช้ `channel` หรือ `both` เฉพาะในห้องที่เชื่อถือได้

ที่เกี่ยวข้อง: [การอนุมัติ Exec](/th/tools/exec-approvals)

## คำสั่งสแลช

คำสั่งสแลช (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` ฯลฯ) ทำงานได้โดยตรงใน DM ในห้อง OpenClaw ยังรู้จำคำสั่งที่ขึ้นต้นด้วยการกล่าวถึง Matrix ของบอตเองด้วย ดังนั้น `@bot:server /new` จะทริกเกอร์เส้นทางคำสั่งโดยไม่ต้องใช้ regex การกล่าวถึงแบบกำหนดเอง วิธีนี้ทำให้บอตตอบสนองต่อโพสต์รูปแบบห้อง `@mention /command` ที่ Element และไคลเอนต์ที่คล้ายกันส่งออกมาเมื่อผู้ใช้ใช้การเติมแท็บชื่อบอตก่อนพิมพ์คำสั่ง

กฎการอนุญาตยังคงใช้: ผู้ส่งคำสั่งต้องผ่านนโยบายรายการอนุญาต/เจ้าของของ DM หรือห้องเดียวกันกับข้อความธรรมดา

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

- ค่า `channels.matrix` ระดับบนสุดทำหน้าที่เป็นค่าเริ่มต้นสำหรับบัญชีที่มีชื่อ เว้นแต่บัญชีจะแทนที่ค่าเหล่านั้น
- จำกัดขอบเขตรายการห้องที่สืบทอดมาให้ผูกกับบัญชีเฉพาะด้วย `groups.<room>.account` รายการที่ไม่มี `account` จะถูกใช้ร่วมกันข้ามบัญชี; `account: "default"` ยังคงทำงานเมื่อบัญชีเริ่มต้นถูกกำหนดค่าไว้ที่ระดับบนสุด

**การเลือกบัญชีเริ่มต้น:**

- ตั้งค่า `defaultAccount` เพื่อเลือกบัญชีที่มีชื่อซึ่งการกำหนดเส้นทางโดยนัย การตรวจสอบ และคำสั่ง CLI ควรใช้เป็นหลัก
- หากคุณมีหลายบัญชีและมีบัญชีหนึ่งชื่อ `default` จริง ๆ OpenClaw จะใช้บัญชีนั้นโดยนัยแม้ไม่ได้ตั้งค่า `defaultAccount`
- หากคุณมีหลายบัญชีที่มีชื่อและไม่ได้เลือกค่าเริ่มต้น คำสั่ง CLI จะปฏิเสธที่จะเดา — ตั้งค่า `defaultAccount` หรือส่ง `--account <id>`
- บล็อก `channels.matrix.*` ระดับบนสุดจะถูกถือว่าเป็นบัญชี `default` โดยนัยเฉพาะเมื่อการยืนยันตัวตนครบถ้วน (`homeserver` + `accessToken` หรือ `homeserver` + `userId` + `password`) บัญชีที่มีชื่อยังคงค้นพบได้จาก `homeserver` + `userId` เมื่อข้อมูลประจำตัวที่แคชไว้ครอบคลุมการยืนยันตัวตน

**การเลื่อนสถานะ:**

- เมื่อ OpenClaw เลื่อนสถานะการกำหนดค่าบัญชีเดียวเป็นหลายบัญชีระหว่างการซ่อมแซมหรือการตั้งค่า ระบบจะรักษาบัญชีที่มีชื่อที่มีอยู่ไว้หากมีบัญชีหนึ่งอยู่แล้วหรือ `defaultAccount` ชี้ไปที่บัญชีหนึ่งอยู่แล้ว เฉพาะคีย์การยืนยันตัวตน/บูตสแตรปของ Matrix เท่านั้นที่จะย้ายเข้าไปในบัญชีที่เลื่อนสถานะแล้ว; คีย์นโยบายการส่งที่ใช้ร่วมกันจะคงอยู่ที่ระดับบนสุด

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบหลายบัญชีที่ใช้ร่วมกัน

## โฮมเซิร์ฟเวอร์ส่วนตัว/LAN

โดยค่าเริ่มต้น OpenClaw จะบล็อกโฮมเซิร์ฟเวอร์ Matrix ส่วนตัว/ภายในเพื่อป้องกัน SSRF เว้นแต่คุณจะ
เลือกใช้อย่างชัดเจนต่อบัญชี

หากโฮมเซิร์ฟเวอร์ของคุณทำงานบน localhost, IP ของ LAN/Tailscale หรือชื่อโฮสต์ภายใน ให้เปิดใช้
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

การเลือกใช้นี้อนุญาตเฉพาะเป้าหมายส่วนตัว/ภายในที่เชื่อถือได้เท่านั้น homeserver แบบ cleartext สาธารณะ เช่น
`http://matrix.example.org:8008` ยังคงถูกบล็อก ควรใช้ `https://` whenever possible.

## การส่งทราฟฟิก Matrix ผ่านพร็อกซี

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

บัญชีที่มีชื่อสามารถแทนที่ค่าเริ่มต้นระดับบนสุดด้วย `channels.matrix.accounts.<id>.proxy` ได้
OpenClaw ใช้การตั้งค่าพร็อกซีเดียวกันสำหรับทราฟฟิก Matrix ขณะรันไทม์และการตรวจสอบสถานะบัญชี

## การแก้ไขเป้าหมาย

Matrix ยอมรับรูปแบบเป้าหมายเหล่านี้ได้ทุกที่ที่ OpenClaw ขอเป้าหมายห้องหรือผู้ใช้จากคุณ:

- ผู้ใช้: `@user:server`, `user:@user:server`, หรือ `matrix:user:@user:server`
- ห้อง: `!room:server`, `room:!room:server`, หรือ `matrix:room:!room:server`
- นามแฝง: `#alias:server`, `channel:#alias:server`, หรือ `matrix:channel:#alias:server`

ID ห้อง Matrix คำนึงถึงตัวพิมพ์ใหญ่เล็ก ใช้รูปแบบตัวพิมพ์ของ ID ห้องที่ตรงจาก Matrix
เมื่อตั้งค่าเป้าหมายการส่งที่ระบุชัดเจน, งาน cron, การผูก, หรือ allowlist
OpenClaw เก็บคีย์เซสชันภายในให้อยู่ในรูปแบบมาตรฐานสำหรับพื้นที่จัดเก็บ ดังนั้นคีย์ตัวพิมพ์เล็กเหล่านั้น
จึงไม่ใช่แหล่งอ้างอิงที่เชื่อถือได้สำหรับ ID การส่งของ Matrix

การค้นหาไดเรกทอรีสดใช้บัญชี Matrix ที่เข้าสู่ระบบอยู่:

- การค้นหาผู้ใช้จะค้นหาไดเรกทอรีผู้ใช้ Matrix บน homeserver นั้น
- การค้นหาห้องยอมรับ ID ห้องและนามแฝงที่ระบุชัดเจนโดยตรง จากนั้นจะถอยกลับไปค้นหาชื่อห้องที่บัญชีนั้นเข้าร่วมอยู่
- การค้นหาชื่อห้องที่เข้าร่วมอยู่เป็นแบบพยายามให้ดีที่สุด หากชื่อห้องไม่สามารถแก้ไขเป็น ID หรือนามแฝงได้ จะถูกละเว้นในการแก้ไข allowlist ขณะรันไทม์

## ข้อมูลอ้างอิงการกำหนดค่า

ฟิลด์แบบ allowlist (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) ยอมรับ ID ผู้ใช้ Matrix แบบเต็ม (ปลอดภัยที่สุด) รายการที่ตรงกับไดเรกทอรีอย่างแน่นอนจะถูกแก้ไขตอนเริ่มต้นและทุกครั้งที่ allowlist เปลี่ยนระหว่างที่มอนิเตอร์ทำงานอยู่ รายการที่ไม่สามารถแก้ไขได้จะถูกละเว้นขณะรันไทม์ allowlist ของห้องควรใช้ ID ห้องหรือนามแฝงด้วยเหตุผลเดียวกัน

### บัญชีและการเชื่อมต่อ

- `enabled`: เปิดหรือปิดใช้งานช่องทาง
- `name`: ป้ายชื่อแสดงผลเสริมสำหรับบัญชี
- `defaultAccount`: ID บัญชีที่ต้องการเมื่อมีการกำหนดค่าบัญชี Matrix หลายบัญชี
- `accounts`: การแทนที่ต่อบัญชีแบบมีชื่อ ค่า `channels.matrix` ระดับบนสุดจะถูกสืบทอดเป็นค่าเริ่มต้น
- `homeserver`: URL ของ homeserver เช่น `https://matrix.example.org`
- `network.dangerouslyAllowPrivateNetwork`: อนุญาตให้บัญชีนี้เชื่อมต่อกับ `localhost`, IP ของ LAN/Tailscale, หรือชื่อโฮสต์ภายใน
- `proxy`: URL พร็อกซี HTTP(S) เสริมสำหรับทราฟฟิก Matrix รองรับการแทนที่ต่อบัญชี
- `userId`: ID ผู้ใช้ Matrix แบบเต็ม (`@bot:example.org`)
- `accessToken`: โทเค็นการเข้าถึงสำหรับการยืนยันตัวตนแบบใช้โทเค็น รองรับค่าข้อความธรรมดาและ SecretRef ผ่านผู้ให้บริการ env/file/exec ([การจัดการความลับ](/th/gateway/secrets))
- `password`: รหัสผ่านสำหรับการเข้าสู่ระบบแบบใช้รหัสผ่าน รองรับค่าข้อความธรรมดาและ SecretRef
- `deviceId`: ID อุปกรณ์ Matrix ที่ระบุชัดเจน
- `deviceName`: ชื่อแสดงผลของอุปกรณ์ที่ใช้ตอนเข้าสู่ระบบด้วยรหัสผ่าน
- `avatarUrl`: URL อวาตาร์ของตัวเองที่จัดเก็บไว้สำหรับการซิงก์โปรไฟล์และการอัปเดต `profile set`
- `initialSyncLimit`: จำนวนเหตุการณ์สูงสุดที่ดึงระหว่างการซิงก์ตอนเริ่มต้น

### การเข้ารหัส

- `encryption`: เปิดใช้งาน E2EE ค่าเริ่มต้น: `false`
- `startupVerification`: `"if-unverified"` (ค่าเริ่มต้นเมื่อเปิด E2EE) หรือ `"off"` ส่งคำขอการยืนยันตัวเองอัตโนมัติตอนเริ่มต้นเมื่ออุปกรณ์นี้ยังไม่ได้รับการยืนยัน
- `startupVerificationCooldownHours`: ช่วงพักก่อนคำขอเริ่มต้นอัตโนมัติครั้งถัดไป ค่าเริ่มต้น: `24`

### การเข้าถึงและนโยบาย

- `groupPolicy`: `"open"`, `"allowlist"`, หรือ `"disabled"` ค่าเริ่มต้น: `"allowlist"`
- `groupAllowFrom`: allowlist ของ ID ผู้ใช้สำหรับทราฟฟิกห้อง
- `dm.enabled`: เมื่อเป็น `false` ให้ละเว้น DM ทั้งหมด ค่าเริ่มต้น: `true`
- `dm.policy`: `"pairing"` (ค่าเริ่มต้น), `"allowlist"`, `"open"`, หรือ `"disabled"` ใช้หลังจากบอทเข้าร่วมและจัดประเภทห้องเป็น DM แล้ว โดยไม่ส่งผลต่อการจัดการคำเชิญ
- `dm.allowFrom`: allowlist ของ ID ผู้ใช้สำหรับทราฟฟิก DM
- `dm.sessionScope`: `"per-user"` (ค่าเริ่มต้น) หรือ `"per-room"`
- `dm.threadReplies`: การแทนที่เฉพาะ DM สำหรับการตอบกลับแบบเธรด (`"off"`, `"inbound"`, `"always"`)
- `allowBots`: ยอมรับข้อความจากบัญชีบอท Matrix อื่นที่กำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `allowlistOnly`: เมื่อเป็น `true` จะบังคับให้นโยบาย DM ที่ใช้งานอยู่ทั้งหมด (ยกเว้น `"disabled"`) และนโยบายกลุ่ม `"open"` เป็น `"allowlist"` ไม่เปลี่ยนนโยบาย `"disabled"`
- `autoJoin`: `"always"`, `"allowlist"`, หรือ `"off"` ค่าเริ่มต้น: `"off"` ใช้กับคำเชิญ Matrix ทุกคำเชิญ รวมถึงคำเชิญแบบ DM
- `autoJoinAllowlist`: ห้อง/นามแฝงที่อนุญาตเมื่อ `autoJoin` เป็น `"allowlist"` รายการนามแฝงจะถูกแก้ไขเทียบกับ homeserver ไม่ใช่เทียบกับสถานะที่ห้องที่เชิญอ้างไว้
- `contextVisibility`: การมองเห็นบริบทเพิ่มเติม (ค่าเริ่มต้น `"all"`, `"allowlist"`, `"allowlist_quote"`)

### พฤติกรรมการตอบกลับ

- `replyToMode`: `"off"`, `"first"`, `"all"`, หรือ `"batched"`
- `threadReplies`: `"off"`, `"inbound"`, หรือ `"always"`
- `threadBindings`: การแทนที่ต่อช่องทางสำหรับการกำหนดเส้นทางเซสชันที่ผูกกับเธรดและวงจรชีวิต
- `streaming`: `"off"` (ค่าเริ่มต้น), `"partial"`, `"quiet"`, หรือรูปแบบอ็อบเจ็กต์ `{ mode, preview: { toolProgress } }` `true` ↔ `"partial"`, `false` ↔ `"off"`
- `blockStreaming`: เมื่อเป็น `true` บล็อกผู้ช่วยที่เสร็จสมบูรณ์จะถูกเก็บเป็นข้อความความคืบหน้าแยกกัน
- `markdown`: การกำหนดค่าการเรนเดอร์ Markdown เสริมสำหรับข้อความขาออก
- `responsePrefix`: สตริงเสริมที่เติมไว้หน้าการตอบกลับขาออก
- `textChunkLimit`: ขนาดชังก์ขาออกเป็นจำนวนอักขระเมื่อ `chunkMode: "length"` ค่าเริ่มต้น: `4000`
- `chunkMode`: `"length"` (ค่าเริ่มต้น แบ่งตามจำนวนอักขระ) หรือ `"newline"` (แบ่งที่ขอบเขตบรรทัด)
- `historyLimit`: จำนวนข้อความห้องล่าสุดที่รวมเป็น `InboundHistory` เมื่อข้อความห้องเรียกเอเจนต์ ถอยกลับไปใช้ `messages.groupChat.historyLimit`; ค่าเริ่มต้นที่มีผลคือ `0` (ปิดใช้งาน)
- `mediaMaxMb`: ขีดจำกัดขนาดสื่อเป็น MB สำหรับการส่งขาออกและการประมวลผลขาเข้า

### การตั้งค่าปฏิกิริยา

- `ackReaction`: การแทนที่ปฏิกิริยา ack สำหรับช่องทาง/บัญชีนี้
- `ackReactionScope`: การแทนที่ขอบเขต (`"group-mentions"` ค่าเริ่มต้น, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`)
- `reactionNotifications`: โหมดการแจ้งเตือนปฏิกิริยาขาเข้า (`"own"` ค่าเริ่มต้น, `"off"`)

### เครื่องมือและการแทนที่ต่อห้อง

- `actions`: การควบคุมเครื่องมือต่อแอ็กชัน (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`)
- `groups`: แผนที่นโยบายต่อห้อง ตัวตนเซสชันใช้ ID ห้องที่เสถียรหลังการแก้ไข (`rooms` เป็นนามแฝงแบบเดิม)
  - `groups.<room>.account`: จำกัดรายการห้องที่สืบทอดมาหนึ่งรายการไว้กับบัญชีเฉพาะ
  - `groups.<room>.allowBots`: การแทนที่ต่อห้องของการตั้งค่าระดับช่องทาง (`true` หรือ `"mentions"`)
  - `groups.<room>.users`: allowlist ผู้ส่งต่อห้อง
  - `groups.<room>.tools`: การแทนที่อนุญาต/ปฏิเสธเครื่องมือต่อห้อง
  - `groups.<room>.autoReply`: การแทนที่การควบคุมด้วยการกล่าวถึงต่อห้อง `true` ปิดข้อกำหนดการกล่าวถึงสำหรับห้องนั้น; `false` บังคับให้เปิดกลับมา
  - `groups.<room>.skills`: ตัวกรอง Skills ต่อห้อง
  - `groups.<room>.systemPrompt`: ส่วนย่อยพรอมป์ระบบต่อห้อง

### การตั้งค่าการอนุมัติ Exec

- `execApprovals.enabled`: ส่งการอนุมัติ exec ผ่านพรอมป์แบบเนทีฟของ Matrix
- `execApprovals.approvers`: ID ผู้ใช้ Matrix ที่ได้รับอนุญาตให้อนุมัติ ถอยกลับไปใช้ `dm.allowFrom`
- `execApprovals.target`: `"dm"` (ค่าเริ่มต้น), `"channel"`, หรือ `"both"`
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: allowlist ของเอเจนต์/เซสชันเสริมสำหรับการส่ง

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเพิ่มความแข็งแกร่ง
