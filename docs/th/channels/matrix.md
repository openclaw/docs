---
read_when:
    - การตั้งค่า Matrix ใน OpenClaw
    - การกำหนดค่า Matrix E2EE และการยืนยัน
summary: สถานะการรองรับ Matrix, การตั้งค่า และตัวอย่างการกำหนดค่า
title: เมทริกซ์
x-i18n:
    generated_at: "2026-05-10T19:22:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111f7d4ce9b1c2ead6a69b5ba2e704cc273e759001f19555f61716f07210d8b2
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

สเปก Plugin แบบเปล่าจะลองใช้ ClawHub ก่อน แล้วจึง fallback ไปที่ npm หากต้องการบังคับแหล่ง registry ให้ใช้ `openclaw plugins install clawhub:@openclaw/matrix` หรือ `openclaw plugins install npm:@openclaw/matrix`

จาก checkout ในเครื่อง:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` จะลงทะเบียนและเปิดใช้งาน Plugin ดังนั้นจึงไม่ต้องมีขั้นตอน `openclaw plugins enable matrix` แยกต่างหาก แต่ Plugin จะยังไม่ทำอะไรจนกว่าคุณจะกำหนดค่าช่องทางด้านล่าง ดู [Plugins](/th/tools/plugin) สำหรับพฤติกรรมทั่วไปของ Plugin และกฎการติดตั้ง

## ตั้งค่า

1. สร้างบัญชี Matrix บน homeserver ของคุณ
2. กำหนดค่า `channels.matrix` ด้วย `homeserver` + `accessToken` หรือ `homeserver` + `userId` + `password`
3. รีสตาร์ท Gateway
4. เริ่ม DM กับบอท หรือเชิญบอทเข้าห้อง (ดู [เข้าร่วมอัตโนมัติ](#auto-join) - คำเชิญใหม่จะเข้าถึงได้ก็ต่อเมื่อ `autoJoin` อนุญาต)

### ตั้งค่าแบบโต้ตอบ

```bash
openclaw channels add
openclaw configure --section channels
```

วิซาร์ดจะถามข้อมูลต่อไปนี้: URL ของ homeserver, วิธีตรวจสอบสิทธิ์ (access token หรือรหัสผ่าน), ID ผู้ใช้ (เฉพาะการตรวจสอบสิทธิ์ด้วยรหัสผ่าน), ชื่ออุปกรณ์ที่ไม่บังคับ, ต้องการเปิดใช้ E2EE หรือไม่ และต้องการกำหนดค่าการเข้าถึงห้องและการเข้าร่วมอัตโนมัติหรือไม่

หากมี env var `MATRIX_*` ที่ตรงกันอยู่แล้ว และบัญชีที่เลือกยังไม่มีการตรวจสอบสิทธิ์ที่บันทึกไว้ วิซาร์ดจะเสนอทางลัดด้วย env-var หากต้องการแก้ชื่อห้องก่อนบันทึก allowlist ให้รัน `openclaw channels resolve --channel matrix "Project Room"` เมื่อเปิดใช้ E2EE วิซาร์ดจะเขียน config และรัน bootstrap เดียวกับ [`openclaw matrix encryption setup`](#encryption-and-verification)

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

แบบใช้รหัสผ่าน (โทเค็นจะถูกแคชหลังจาก login ครั้งแรก):

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

ค่าเริ่มต้นของ `channels.matrix.autoJoin` คือ `off` ด้วยค่าเริ่มต้นนี้ บอทจะไม่ปรากฏในห้องใหม่หรือ DM จากคำเชิญใหม่จนกว่าคุณจะเข้าร่วมด้วยตนเอง

OpenClaw ไม่สามารถบอกได้ ณ เวลาที่เชิญว่าห้องที่ได้รับเชิญเป็น DM หรือกลุ่ม ดังนั้นคำเชิญทั้งหมด รวมถึงคำเชิญแบบ DM จะผ่าน `autoJoin` ก่อน `dm.policy` จะมีผลภายหลังเท่านั้น หลังจากบอทเข้าร่วมแล้วและห้องถูกจัดประเภทแล้ว

<Warning>
ตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` เพื่อจำกัดคำเชิญที่บอทยอมรับ หรือ `autoJoin: "always"` เพื่อยอมรับทุกคำเชิญ

`autoJoinAllowlist` ยอมรับเฉพาะเป้าหมายที่เสถียร: `!roomId:server`, `#alias:server` หรือ `*` ชื่อห้องแบบธรรมดาจะถูกปฏิเสธ รายการ alias จะถูก resolve เทียบกับ homeserver ไม่ใช่เทียบกับ state ที่ห้องที่เชิญกล่าวอ้าง
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

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): ใช้ `@user:server` ชื่อที่แสดงจะ resolve ได้ก็ต่อเมื่อไดเรกทอรีของ homeserver ส่งคืนผลลัพธ์ที่ตรงกันเพียงรายการเดียว
- ห้อง (`groups`, `autoJoinAllowlist`): ใช้ `!room:server` หรือ `#alias:server` ชื่อจะถูก resolve แบบ best-effort เทียบกับห้องที่เข้าร่วมแล้ว รายการที่ resolve ไม่ได้จะถูกละเว้นขณะ runtime

### การทำให้ ID บัญชีเป็นมาตรฐาน

วิซาร์ดจะแปลงชื่อที่อ่านง่ายเป็น ID บัญชีแบบ normalized ตัวอย่างเช่น `Ops Bot` จะกลายเป็น `ops-bot` เครื่องหมายวรรคตอนจะถูก escape ในชื่อ env-var แบบ scoped เพื่อไม่ให้บัญชีสองบัญชีชนกัน: `-` → `_X2D_` ดังนั้น `ops-prod` จะแมปเป็น `MATRIX_OPS_X2D_PROD_*`

### ข้อมูลรับรองที่แคชไว้

Matrix จัดเก็บข้อมูลรับรองที่แคชไว้ภายใต้ `~/.openclaw/credentials/matrix/`:

- บัญชีเริ่มต้น: `credentials.json`
- บัญชีที่มีชื่อ: `credentials-<account>.json`

เมื่อมีข้อมูลรับรองที่แคชไว้ในตำแหน่งนั้น OpenClaw จะถือว่า Matrix ถูกกำหนดค่าแล้ว แม้ access token จะไม่ได้อยู่ในไฟล์ config ก็ตาม ซึ่งครอบคลุมการตั้งค่า, `openclaw doctor` และการ probe สถานะช่องทาง

### ตัวแปรสภาพแวดล้อม

ใช้เมื่อไม่ได้ตั้งค่า config key ที่เทียบเท่ากัน บัญชีเริ่มต้นใช้ชื่อที่ไม่มีคำนำหน้า บัญชีที่มีชื่อใช้ ID บัญชีแทรกไว้ก่อน suffix

| บัญชีเริ่มต้น       | บัญชีที่มีชื่อ (`<ID>` คือ ID บัญชีแบบ normalized) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

สำหรับบัญชี `ops` ชื่อจะกลายเป็น `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` และอื่นๆ env var สำหรับ recovery key จะถูกอ่านโดยโฟลว์ CLI ที่รองรับการกู้คืน (`verify backup restore`, `verify device`, `verify bootstrap`) เมื่อคุณ pipe key เข้ามาผ่าน `--recovery-key-stdin`

ไม่สามารถตั้งค่า `MATRIX_HOMESERVER` จาก `.env` ของ workspace ได้ ดู [ไฟล์ `.env` ของ workspace](/th/gateway/security)

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

## ตัวอย่างพรีวิวการสตรีม

การสตรีมการตอบกลับของ Matrix เป็นแบบ opt-in `streaming` ควบคุมวิธีที่ OpenClaw ส่งคำตอบของ assistant ที่กำลังดำเนินอยู่ ส่วน `blockStreaming` ควบคุมว่าจะเก็บแต่ละ block ที่เสร็จแล้วเป็นข้อความ Matrix แยกของตัวเองหรือไม่

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

หากต้องการคงพรีวิวคำตอบแบบสดไว้ แต่ซ่อนบรรทัดเครื่องมือ/ความคืบหน้าชั่วคราว ให้ใช้รูปแบบ object:

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
| `"off"` (ค่าเริ่มต้น) | รอคำตอบเต็ม แล้วส่งครั้งเดียว `true` ↔ `"partial"`, `false` ↔ `"off"`                                                                                         |
| `"partial"`       | แก้ไขข้อความตัวอักษรปกติหนึ่งข้อความในตำแหน่งเดิมขณะที่โมเดลเขียน block ปัจจุบัน ไคลเอนต์ Matrix มาตรฐานอาจแจ้งเตือนเมื่อมีพรีวิวแรก ไม่ใช่การแก้ไขสุดท้าย              |
| `"quiet"`         | เหมือนกับ `"partial"` แต่ข้อความเป็น notice ที่ไม่แจ้งเตือน ผู้รับจะได้รับการแจ้งเตือนก็ต่อเมื่อ push rule ต่อผู้ใช้ตรงกับการแก้ไขที่ finalized แล้ว (ดูด้านล่าง) |

`blockStreaming` เป็นอิสระจาก `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (ค่าเริ่มต้น)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | draft สดสำหรับ block ปัจจุบัน โดยเก็บ block ที่เสร็จแล้วเป็นข้อความ | draft สดสำหรับ block ปัจจุบัน และ finalize ในตำแหน่งเดิม |
| `"off"`                 | ข้อความ Matrix ที่แจ้งเตือนหนึ่งข้อความต่อ block ที่เสร็จแล้ว                     | ข้อความ Matrix ที่แจ้งเตือนหนึ่งข้อความสำหรับคำตอบเต็ม      |

หมายเหตุ:

- หากพรีวิวใหญ่เกินขีดจำกัดขนาดต่อ event ของ Matrix OpenClaw จะหยุดการสตรีมพรีวิวและ fallback ไปส่งเฉพาะผลลัพธ์สุดท้าย
- การตอบกลับสื่อจะส่งไฟล์แนบตามปกติเสมอ หากพรีวิวเก่าไม่สามารถนำกลับมาใช้ซ้ำได้อย่างปลอดภัยอีกต่อไป OpenClaw จะ redact พรีวิวนั้นก่อนส่งการตอบกลับสื่อสุดท้าย
- การอัปเดตพรีวิวความคืบหน้าของเครื่องมือจะเปิดใช้โดยค่าเริ่มต้นเมื่อการสตรีมพรีวิวของ Matrix เปิดอยู่ ตั้งค่า `streaming.preview.toolProgress: false` เพื่อคงการแก้ไขพรีวิวสำหรับข้อความคำตอบไว้ แต่ปล่อยความคืบหน้าของเครื่องมือไว้บนเส้นทางการส่งปกติ
- การแก้ไขพรีวิวมีต้นทุนเป็นการเรียก Matrix API เพิ่มเติม คง `streaming: "off"` ไว้หากคุณต้องการโปรไฟล์ rate-limit ที่อนุรักษ์นิยมที่สุด

## Metadata การอนุมัติ

พรอมต์การอนุมัติแบบ native ของ Matrix เป็น event `m.room.message` ปกติที่มีเนื้อหา event แบบกำหนดเองเฉพาะ OpenClaw ภายใต้ `com.openclaw.approval` Matrix อนุญาต key ของ event-content แบบกำหนดเอง ดังนั้นไคลเอนต์มาตรฐานยังคง render body ข้อความได้ ขณะที่ไคลเอนต์ที่รองรับ OpenClaw สามารถอ่าน approval id, kind, state, decisions ที่มีให้เลือก และรายละเอียด exec/Plugin แบบมีโครงสร้างได้

เมื่อพรอมต์การอนุมัติยาวเกินไปสำหรับ Matrix event เดียว OpenClaw จะแบ่งข้อความที่มองเห็นเป็น chunk และแนบ `com.openclaw.approval` กับ chunk แรกเท่านั้น ปฏิกิริยาสำหรับการตัดสินใจอนุญาต/ปฏิเสธจะผูกกับ event แรกนั้น ดังนั้นพรอมต์ยาวจึงยังใช้เป้าหมายการอนุมัติเดียวกับพรอมต์ที่มี event เดียว

### Push rules แบบ self-hosted สำหรับพรีวิว quiet ที่ finalized แล้ว

`streaming: "quiet"` จะแจ้งเตือนผู้รับก็ต่อเมื่อ block หรือ turn ถูก finalized แล้วเท่านั้น โดย push rule ต่อผู้ใช้ต้องตรงกับ marker ของพรีวิวที่ finalized แล้ว ดู [กฎ push ของ Matrix สำหรับพรีวิว quiet](/th/channels/matrix-push-rules) สำหรับสูตรเต็ม (โทเค็นผู้รับ, การตรวจสอบ pusher, การติดตั้ง rule, หมายเหตุต่อ homeserver)

## ห้องบอทต่อบอท

โดยค่าเริ่มต้น ข้อความ Matrix จากบัญชี Matrix ของ OpenClaw อื่นที่กำหนดค่าไว้จะถูกละเว้น

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

- `allowBots: true` ยอมรับข้อความจากบัญชีบอท Matrix อื่นที่กำหนดค่าไว้ในห้องและ DM ที่อนุญาต
- `allowBots: "mentions"` ยอมรับข้อความเหล่านั้นเฉพาะเมื่อข้อความกล่าวถึงบอทนี้อย่างเห็นได้ชัดในห้อง DM ยังคงอนุญาต
- `groups.<room>.allowBots` override การตั้งค่าระดับบัญชีสำหรับห้องหนึ่งห้อง
- OpenClaw ยังคงละเว้นข้อความจาก ID ผู้ใช้ Matrix เดียวกันเพื่อหลีกเลี่ยง loop การตอบกลับตัวเอง
- Matrix ไม่เปิดเผย flag บอทแบบ native ที่นี่ OpenClaw จึงถือว่า "เขียนโดยบอท" หมายถึง "ส่งโดยบัญชี Matrix อื่นที่กำหนดค่าไว้บน OpenClaw gateway นี้"

ใช้ allowlist ของห้องที่เข้มงวดและข้อกำหนดการกล่าวถึงเมื่อเปิดใช้งานทราฟฟิกบอทต่อบอทในห้องที่ใช้ร่วมกัน

## การเข้ารหัสและการยืนยัน

ในห้องที่เข้ารหัส (E2EE) event รูปภาพขาออกจะใช้ `thumbnail_file` เพื่อให้พรีวิวรูปภาพถูกเข้ารหัสพร้อมกับไฟล์แนบเต็ม ห้องที่ไม่ได้เข้ารหัสยังคงใช้ `thumbnail_url` แบบธรรมดา ไม่ต้องกำหนดค่าใดๆ Plugin จะตรวจจับสถานะ E2EE โดยอัตโนมัติ

คำสั่ง `openclaw matrix` ทั้งหมดรองรับ `--verbose` (การวินิจฉัยแบบเต็ม), `--json` (เอาต์พุตที่เครื่องอ่านได้) และ `--account <id>` (การตั้งค่าหลายบัญชี) เอาต์พุตจะกระชับโดยค่าเริ่มต้น พร้อมการบันทึกภายใน SDK แบบเงียบ ตัวอย่างด้านล่างแสดงรูปแบบมาตรฐาน ให้เพิ่มแฟล็กตามต้องการ

### เปิดใช้การเข้ารหัส

```bash
openclaw matrix encryption setup
```

บูตสแตรปพื้นที่จัดเก็บข้อมูลลับและ cross-signing สร้างการสำรองคีย์ห้องหากจำเป็น จากนั้นพิมพ์สถานะและขั้นตอนถัดไป แฟล็กที่มีประโยชน์:

- `--recovery-key <key>` ใช้คีย์กู้คืนก่อนบูตสแตรป (แนะนำรูปแบบ stdin ที่บันทึกไว้ด้านล่าง)
- `--force-reset-cross-signing` ทิ้งตัวตน cross-signing ปัจจุบันและสร้างใหม่ (ใช้เมื่อจงใจเท่านั้น)

สำหรับบัญชีใหม่ ให้เปิดใช้ E2EE ตอนสร้างบัญชี:

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

- `Locally trusted`: ไคลเอนต์นี้เชื่อถือเท่านั้น
- `Cross-signing verified`: SDK รายงานการยืนยันผ่าน cross-signing
- `Signed by owner`: ลงนามด้วยคีย์ self-signing ของคุณเอง (เพื่อการวินิจฉัยเท่านั้น)

`Verified by owner` จะเป็น `yes` ก็ต่อเมื่อ `Cross-signing verified` เป็น `yes` เท่านั้น ความเชื่อถือภายในเครื่องหรือลายเซ็นของเจ้าของเพียงอย่างเดียวไม่เพียงพอ

`--allow-degraded-local-state` คืนค่าการวินิจฉัยแบบดีที่สุดเท่าที่ทำได้โดยไม่เตรียมบัญชี Matrix ก่อน มีประโยชน์สำหรับการตรวจสอบแบบออฟไลน์หรือที่กำหนดค่าไว้บางส่วน

### ยืนยันอุปกรณ์นี้ด้วยคีย์กู้คืน

คีย์กู้คืนเป็นข้อมูลละเอียดอ่อน - ให้ส่งผ่าน stdin แทนการส่งในบรรทัดคำสั่ง ตั้งค่า `MATRIX_RECOVERY_KEY` (หรือ `MATRIX_<ID>_RECOVERY_KEY` สำหรับบัญชีที่มีชื่อ):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

คำสั่งรายงานสามสถานะ:

- `Recovery key accepted`: Matrix ยอมรับคีย์สำหรับพื้นที่จัดเก็บข้อมูลลับหรือความเชื่อถือของอุปกรณ์
- `Backup usable`: สามารถโหลดการสำรองคีย์ห้องด้วยวัสดุกู้คืนที่เชื่อถือได้
- `Device verified by owner`: อุปกรณ์นี้มีความเชื่อถือตัวตน cross-signing ของ Matrix ครบถ้วน

คำสั่งจะออกด้วยค่าไม่ใช่ศูนย์เมื่อความเชื่อถือตัวตนครบถ้วนยังไม่สมบูรณ์ แม้ว่าคีย์กู้คืนจะปลดล็อกวัสดุสำรองแล้วก็ตาม ในกรณีนั้น ให้ทำ self-verification จากไคลเอนต์ Matrix อีกตัวให้เสร็จ:

```bash
openclaw matrix verify self
```

`verify self` รอจนกว่า `Cross-signing verified: yes` ก่อนจะออกสำเร็จ ใช้ `--timeout-ms <ms>` เพื่อปรับเวลารอ

รูปแบบคีย์ตัวอักษร `openclaw matrix verify device "<recovery-key>"` ก็ใช้ได้เช่นกัน แต่คีย์จะไปอยู่ในประวัติ shell ของคุณ

### บูตสแตรปหรือซ่อม cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` คือคำสั่งซ่อมแซมและตั้งค่าสำหรับบัญชีที่เข้ารหัส ตามลำดับ คำสั่งนี้จะ:

- บูตสแตรปพื้นที่จัดเก็บข้อมูลลับ โดยใช้คีย์กู้คืนที่มีอยู่เมื่อทำได้
- บูตสแตรป cross-signing และอัปโหลดคีย์สาธารณะที่ขาดหายไป
- ทำเครื่องหมายและ cross-sign อุปกรณ์ปัจจุบัน
- สร้างการสำรองคีย์ห้องฝั่งเซิร์ฟเวอร์หากยังไม่มีอยู่

หากโฮมเซิร์ฟเวอร์ต้องใช้ UIA เพื่ออัปโหลดคีย์ cross-signing, OpenClaw จะลองแบบไม่ต้องยืนยันตัวตนก่อน จากนั้น `m.login.dummy` แล้วจึง `m.login.password` (ต้องใช้ `channels.matrix.password`)

แฟล็กที่มีประโยชน์:

- `--recovery-key-stdin` (ใช้คู่กับ `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) หรือ `--recovery-key <key>`
- `--force-reset-cross-signing` เพื่อทิ้งตัวตน cross-signing ปัจจุบัน (เมื่อจงใจเท่านั้น)

### การสำรองคีย์ห้อง

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` แสดงว่ามีการสำรองฝั่งเซิร์ฟเวอร์หรือไม่ และอุปกรณ์นี้ถอดรหัสได้หรือไม่ `backup restore` นำเข้าคีย์ห้องที่สำรองไว้เข้าสู่พื้นที่จัดเก็บ crypto ภายในเครื่อง หากคีย์กู้คืนมีอยู่ในดิสก์แล้ว คุณสามารถละ `--recovery-key-stdin` ได้

หากต้องการแทนที่การสำรองที่เสียด้วย baseline ใหม่ (ยอมรับการสูญเสียประวัติเก่าที่กู้คืนไม่ได้ และยังสามารถสร้างพื้นที่จัดเก็บข้อมูลลับใหม่ได้หาก secret ของการสำรองปัจจุบันโหลดไม่ได้):

```bash
openclaw matrix verify backup reset --yes
```

เพิ่ม `--rotate-recovery-key` เฉพาะเมื่อคุณตั้งใจให้คีย์กู้คืนเดิมหยุดปลดล็อก baseline การสำรองใหม่เท่านั้น

### การแสดงรายการ การขอ และการตอบกลับการยืนยัน

```bash
openclaw matrix verify list
```

แสดงรายการคำขอยืนยันที่รอดำเนินการสำหรับบัญชีที่เลือก

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

ส่งคำขอยืนยันจากบัญชี OpenClaw นี้ `--own-user` ขอ self-verification (คุณยอมรับพรอมป์ในไคลเอนต์ Matrix อีกตัวของผู้ใช้เดียวกัน); `--user-id`/`--device-id`/`--room-id` กำหนดเป้าหมายเป็นบุคคลอื่น ไม่สามารถใช้ `--own-user` ร่วมกับแฟล็กกำหนดเป้าหมายอื่นได้

สำหรับการจัดการวงจรชีวิตระดับต่ำกว่า - โดยทั่วไปขณะติดตามคำขอขาเข้าจากไคลเอนต์อื่น - คำสั่งเหล่านี้ทำงานกับคำขอ `<id>` เฉพาะ (พิมพ์โดย `verify list` และ `verify request`):

| คำสั่ง                                    | วัตถุประสงค์                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | ยอมรับคำขอขาเข้า                                           |
| `openclaw matrix verify start <id>`        | เริ่มโฟลว์ SAS                                                  |
| `openclaw matrix verify sas <id>`          | พิมพ์อีโมจิหรือเลขทศนิยมของ SAS                                     |
| `openclaw matrix verify confirm-sas <id>`  | ยืนยันว่า SAS ตรงกับที่ไคลเอนต์อื่นแสดง            |
| `openclaw matrix verify mismatch-sas <id>` | ปฏิเสธ SAS เมื่ออีโมจิหรือเลขทศนิยมไม่ตรงกัน              |
| `openclaw matrix verify cancel <id>`       | ยกเลิก; รับ `--reason <text>` และ `--code <matrix-code>` เป็นตัวเลือก |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` และ `cancel` ทั้งหมดรับ `--user-id` และ `--room-id` เป็นคำใบ้ติดตามผล DM เมื่อการยืนยันถูกผูกกับห้องข้อความตรงเฉพาะ

### หมายเหตุเกี่ยวกับหลายบัญชี

หากไม่มี `--account <id>` คำสั่ง Matrix CLI จะใช้บัญชีเริ่มต้นโดยนัย หากคุณมีบัญชีที่มีชื่อหลายบัญชีและยังไม่ได้ตั้งค่า `channels.matrix.defaultAccount` คำสั่งจะไม่เดาและจะขอให้คุณเลือก เมื่อ E2EE ถูกปิดใช้งานหรือไม่พร้อมใช้งานสำหรับบัญชีที่มีชื่อ ข้อผิดพลาดจะชี้ไปที่คีย์การกำหนดค่าของบัญชีนั้น เช่น `channels.matrix.accounts.assistant.encryption`

<AccordionGroup>
  <Accordion title="พฤติกรรมตอนเริ่มต้น">
    เมื่อใช้ `encryption: true`, `startupVerification` มีค่าเริ่มต้นเป็น `"if-unverified"` ตอนเริ่มต้น อุปกรณ์ที่ยังไม่ได้ยืนยันจะขอ self-verification ในไคลเอนต์ Matrix อีกตัว โดยข้ามรายการซ้ำและใช้ช่วงพัก (ค่าเริ่มต้นคือ 24 ชั่วโมง) ปรับด้วย `startupVerificationCooldownHours` หรือปิดใช้งานด้วย `startupVerification: "off"`

    ตอนเริ่มต้นยังรันรอบบูตสแตรป crypto แบบระมัดระวังซึ่งใช้พื้นที่จัดเก็บข้อมูลลับและตัวตน cross-signing ปัจจุบันซ้ำ หากสถานะบูตสแตรปเสีย OpenClaw จะพยายามซ่อมแบบมีการป้องกันแม้ไม่มี `channels.matrix.password`; หากโฮมเซิร์ฟเวอร์ต้องใช้ password UIA ตอนเริ่มต้นจะบันทึกคำเตือนและยังไม่ทำให้ล้มเหลว อุปกรณ์ที่ owner-signed แล้วจะถูกเก็บไว้

    ดู [การย้าย Matrix](/th/channels/matrix-migration) สำหรับโฟลว์อัปเกรดฉบับเต็ม

  </Accordion>

  <Accordion title="ประกาศการยืนยัน">
    Matrix โพสต์ประกาศวงจรชีวิตการยืนยันเข้าไปในห้องยืนยัน DM แบบเข้มงวดเป็นข้อความ `m.notice`: request, ready (พร้อมคำแนะนำ "ยืนยันด้วยอีโมจิ"), start/completion และรายละเอียด SAS (อีโมจิ/ทศนิยม) เมื่อพร้อมใช้งาน

    คำขอขาเข้าจากไคลเอนต์ Matrix อื่นจะถูกติดตามและยอมรับอัตโนมัติ สำหรับ self-verification, OpenClaw จะเริ่มโฟลว์ SAS อัตโนมัติและยืนยันฝั่งของตัวเองเมื่อการยืนยันด้วยอีโมจิพร้อมใช้งาน - คุณยังต้องเปรียบเทียบและยืนยัน "ตรงกัน" ในไคลเอนต์ Matrix ของคุณ

    ประกาศระบบการยืนยันจะไม่ถูกส่งต่อไปยังไปป์ไลน์แชทของเอเจนต์

  </Accordion>

  <Accordion title="อุปกรณ์ Matrix ที่ถูกลบหรือไม่ถูกต้อง">
    หาก `verify status` ระบุว่าอุปกรณ์ปัจจุบันไม่มีอยู่ในรายการบนโฮมเซิร์ฟเวอร์แล้ว ให้สร้างอุปกรณ์ Matrix ของ OpenClaw ใหม่ สำหรับการเข้าสู่ระบบด้วยรหัสผ่าน:

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

    แทนที่ `assistant` ด้วย ID บัญชีจากคำสั่งที่ล้มเหลว หรือละ `--account` สำหรับบัญชีเริ่มต้น

  </Accordion>

  <Accordion title="สุขอนามัยของอุปกรณ์">
    อุปกรณ์เก่าที่ OpenClaw จัดการไว้อาจสะสมได้ แสดงรายการและตัดออก:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="พื้นที่จัดเก็บ Crypto">
    Matrix E2EE ใช้เส้นทาง crypto Rust อย่างเป็นทางการของ `matrix-js-sdk` พร้อม `fake-indexeddb` เป็นชิม IndexedDB สถานะ Crypto จะคงอยู่ใน `crypto-idb-snapshot.json` (สิทธิ์ไฟล์แบบจำกัด)

    สถานะ runtime ที่เข้ารหัสอยู่ใต้ `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` และรวมถึงพื้นที่จัดเก็บ sync, พื้นที่จัดเก็บ crypto, คีย์กู้คืน, สแนปช็อต IDB, การผูกเธรด และสถานะการยืนยันตอนเริ่มต้น เมื่อโทเค็นเปลี่ยนแต่ตัวตนบัญชียังคงเดิม OpenClaw จะใช้ root เดิมที่ดีที่สุดซ้ำ เพื่อให้สถานะก่อนหน้ายังคงมองเห็นได้

  </Accordion>
</AccordionGroup>

## การจัดการโปรไฟล์

อัปเดต self-profile ของ Matrix สำหรับบัญชีที่เลือก:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

คุณสามารถส่งทั้งสองตัวเลือกในการเรียกครั้งเดียวได้ Matrix ยอมรับ URL อวาตาร์ `mxc://` โดยตรง; เมื่อคุณส่ง `http://` หรือ `https://`, OpenClaw จะอัปโหลดไฟล์ก่อนและจัดเก็บ URL `mxc://` ที่แปลงแล้วลงใน `channels.matrix.avatarUrl` (หรือ override ต่อบัญชี)

## เธรด

Matrix รองรับเธรด Matrix แบบเนทีฟสำหรับทั้งการตอบกลับอัตโนมัติและการส่งด้วยเครื่องมือข้อความ มีปุ่มปรับอิสระสองรายการที่ควบคุมพฤติกรรม:

### การกำหนดเส้นทางเซสชัน (`sessionScope`)

`dm.sessionScope` กำหนดวิธีที่ห้อง DM ของ Matrix จับคู่กับเซสชัน OpenClaw:

- `"per-user"` (ค่าเริ่มต้น): ห้อง DM ทั้งหมดที่มี peer ที่ถูกกำหนดเส้นทางเดียวกันใช้เซสชันร่วมกัน
- `"per-room"`: ห้อง DM ของ Matrix แต่ละห้องได้รับคีย์เซสชันของตัวเอง แม้ว่า peer จะเป็นคนเดียวกันก็ตาม

การผูกการสนทนาแบบชัดเจนมีสิทธิ์เหนือ `sessionScope` เสมอ ดังนั้นห้องและเธรดที่ถูกผูกไว้จะคงเซสชันเป้าหมายที่เลือกไว้

### การตอบกลับแบบเธรด (`threadReplies`)

`threadReplies` กำหนดตำแหน่งที่บอตโพสต์การตอบกลับ:

- `"off"`: การตอบกลับอยู่ระดับบนสุด ข้อความแบบเธรดขาเข้าจะอยู่ในเซสชันหลักต่อไป
- `"inbound"`: ตอบกลับในเธรดเฉพาะเมื่อข้อความขาเข้าอยู่ในเธรดนั้นอยู่แล้ว
- `"always"`: ตอบกลับในเธรดที่มีรากเป็นข้อความที่ทริกเกอร์ การสนทนานั้นจะถูกกำหนดเส้นทางผ่านเซสชันที่มีขอบเขตเธรดที่ตรงกันตั้งแต่ทริกเกอร์แรกเป็นต้นไป

`dm.threadReplies` override ค่านี้สำหรับ DM เท่านั้น - ตัวอย่างเช่น แยกเธรดห้องไว้ต่างหากในขณะที่ทำให้ DM เป็นแบบแบน

### การสืบทอดเธรดและคำสั่ง slash

- ข้อความแบบเธรดขาเข้าจะรวมข้อความรากของเธรดเป็นบริบทเพิ่มเติมของเอเจนต์
- การส่งผ่านเครื่องมือข้อความจะสืบทอดเธรด Matrix ปัจจุบันโดยอัตโนมัติเมื่อกำหนดเป้าหมายไปยังห้องเดียวกัน (หรือเป้าหมายผู้ใช้ DM เดียวกัน) เว้นแต่จะระบุ `threadId` อย่างชัดเจน
- การใช้เป้าหมายผู้ใช้ DM ซ้ำจะทำงานก็ต่อเมื่อเมตาดาต้าของเซสชันปัจจุบันพิสูจน์ได้ว่าเป็นเพียร์ DM เดียวกันบนบัญชี Matrix เดียวกัน มิฉะนั้น OpenClaw จะย้อนกลับไปใช้การกำหนดเส้นทางตามผู้ใช้ตามปกติ
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และ `/acp spawn` ที่ผูกกับเธรดทั้งหมดทำงานได้ในห้อง Matrix และ DM
- `/focus` ระดับบนสุดจะสร้างเธรด Matrix ใหม่และผูกเข้ากับเซสชันเป้าหมายเมื่อเปิดใช้ `threadBindings.spawnSessions`
- การเรียกใช้ `/focus` หรือ `/acp spawn --thread here` ภายในเธรด Matrix ที่มีอยู่จะผูกเธรดนั้นในตำแหน่งเดิม

เมื่อ OpenClaw ตรวจพบว่าห้อง DM ของ Matrix ชนกับห้อง DM อื่นบนเซสชันที่ใช้ร่วมกันเดียวกัน จะโพสต์ `m.notice` แบบครั้งเดียวในห้องนั้น โดยชี้ไปยังทางออก `/focus` และแนะนำให้เปลี่ยน `dm.sessionScope` ประกาศนี้จะปรากฏเฉพาะเมื่อเปิดใช้การผูกเธรดเท่านั้น

## การผูกการสนทนา ACP

ห้อง Matrix, DM และเธรด Matrix ที่มีอยู่สามารถแปลงเป็นพื้นที่ทำงาน ACP แบบคงทนได้โดยไม่ต้องเปลี่ยนพื้นผิวแชต

ลำดับการทำงานด่วนสำหรับผู้ปฏิบัติการ:

- เรียกใช้ `/acp spawn codex --bind here` ภายใน DM, ห้อง หรือเธรดที่มีอยู่ของ Matrix ที่คุณต้องการใช้งานต่อ
- ใน DM หรือห้อง Matrix ระดับบนสุด DM/ห้องปัจจุบันจะยังคงเป็นพื้นผิวแชต และข้อความในอนาคตจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ถูกสร้างขึ้น
- ภายในเธรด Matrix ที่มีอยู่ `--bind here` จะผูกเธรดปัจจุบันนั้นในตำแหน่งเดิม
- `/new` และ `/reset` รีเซ็ตเซสชัน ACP เดียวกันที่ผูกอยู่ในตำแหน่งเดิม
- `/acp close` ปิดเซสชัน ACP และลบการผูก

หมายเหตุ:

- `--bind here` ไม่สร้างเธรดลูกของ Matrix
- `threadBindings.spawnSessions` ควบคุม `/acp spawn --thread auto|here` ซึ่ง OpenClaw จำเป็นต้องสร้างหรือผูกเธรดลูกของ Matrix

### การกำหนดค่าการผูกเธรด

Matrix สืบทอดค่าเริ่มต้นส่วนกลางจาก `session.threadBindings` และรองรับการแทนค่าต่อช่องทางด้วย:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

การสร้างเซสชันที่ผูกกับเธรดของ Matrix เปิดเป็นค่าเริ่มต้น:

- ตั้งค่า `threadBindings.spawnSessions: false` เพื่อบล็อก `/focus` ระดับบนสุดและ `/acp spawn --thread auto|here` ไม่ให้สร้าง/ผูกเธรด Matrix
- ตั้งค่า `threadBindings.defaultSpawnContext: "isolated"` เมื่อการสร้างเธรดของ subagent แบบเนทีฟไม่ควร fork transcript ของพาเรนต์

## รีแอ็กชัน

Matrix รองรับรีแอ็กชันขาออก การแจ้งเตือนรีแอ็กชันขาเข้า และรีแอ็กชัน ack

เครื่องมือรีแอ็กชันขาออกถูกควบคุมด้วย `channels.matrix.actions.reactions`:

- `react` เพิ่มรีแอ็กชันให้กับเหตุการณ์ Matrix
- `reactions` แสดงรายการสรุปรีแอ็กชันปัจจุบันสำหรับเหตุการณ์ Matrix
- `emoji=""` ลบรีแอ็กชันของบอทเองบนเหตุการณ์นั้น
- `remove: true` ลบเฉพาะรีแอ็กชันอีโมจิที่ระบุจากบอท

**ลำดับการแก้ค่า** (ใช้ค่าที่กำหนดไว้ค่าแรก):

| การตั้งค่า               | ลำดับ                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | ต่อบัญชี → ช่องทาง → `messages.ackReaction` → อีโมจิสำรองจากตัวตนของเอเจนต์   |
| `ackReactionScope`      | ต่อบัญชี → ช่องทาง → `messages.ackReactionScope` → ค่าเริ่มต้น `"group-mentions"` |
| `reactionNotifications` | ต่อบัญชี → ช่องทาง → ค่าเริ่มต้น `"own"`                                          |

`reactionNotifications: "own"` ส่งต่อเหตุการณ์ `m.reaction` ที่เพิ่มเข้ามาเมื่อเหตุการณ์เหล่านั้นมีเป้าหมายเป็นข้อความ Matrix ที่บอทเป็นผู้เขียน; `"off"` ปิดใช้งานเหตุการณ์ระบบรีแอ็กชัน การลบรีแอ็กชันจะไม่ถูกสังเคราะห์เป็นเหตุการณ์ระบบ เพราะ Matrix แสดงสิ่งเหล่านั้นเป็นการ redaction ไม่ใช่การลบ `m.reaction` แบบแยกต่างหาก

## บริบทประวัติ

- `channels.matrix.historyLimit` ควบคุมจำนวนข้อความล่าสุดในห้องที่จะถูกรวมเป็น `InboundHistory` เมื่อข้อความห้อง Matrix กระตุ้นเอเจนต์ ถอยกลับไปใช้ `messages.groupChat.historyLimit`; หากไม่ได้ตั้งค่าทั้งสอง ค่าเริ่มต้นที่มีผลคือ `0` ตั้งค่า `0` เพื่อปิดใช้งาน
- ประวัติห้อง Matrix จำกัดเฉพาะห้องเท่านั้น DM ยังคงใช้ประวัติเซสชันตามปกติ
- ประวัติห้อง Matrix เป็นแบบ pending-only: OpenClaw บัฟเฟอร์ข้อความห้องที่ยังไม่ได้กระตุ้นการตอบกลับ แล้วจึง snapshot หน้าต่างนั้นเมื่อมีการ mention หรือทริกเกอร์อื่นมาถึง
- ข้อความทริกเกอร์ปัจจุบันไม่ถูกรวมใน `InboundHistory`; ข้อความนั้นยังคงอยู่ในเนื้อหาขาเข้าหลักสำหรับรอบนั้น
- การลองซ้ำเหตุการณ์ Matrix เดิมจะใช้ snapshot ประวัติเดิมซ้ำ แทนที่จะเลื่อนไปยังข้อความห้องที่ใหม่กว่า

## การมองเห็นบริบท

Matrix รองรับการควบคุม `contextVisibility` ที่ใช้ร่วมกันสำหรับบริบทห้องเพิ่มเติม เช่น ข้อความตอบกลับที่ดึงมา รากของเธรด และประวัติที่รอดำเนินการ

- `contextVisibility: "all"` เป็นค่าเริ่มต้น บริบทเพิ่มเติมจะถูกเก็บไว้ตามที่ได้รับ
- `contextVisibility: "allowlist"` กรองบริบทเพิ่มเติมให้เหลือเฉพาะผู้ส่งที่ผ่านการตรวจสอบ allowlist ของห้อง/ผู้ใช้ที่ใช้งานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บการตอบกลับที่อ้างอิงไว้อย่างชัดเจนหนึ่งรายการ

การตั้งค่านี้ส่งผลต่อการมองเห็นบริบทเพิ่มเติม ไม่ใช่ว่าข้อความขาเข้าเองสามารถกระตุ้นการตอบกลับได้หรือไม่
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

ดู [กลุ่ม](/th/channels/groups) สำหรับพฤติกรรมการควบคุมด้วย mention และ allowlist

ตัวอย่างการจับคู่สำหรับ DM ของ Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

หากผู้ใช้ Matrix ที่ยังไม่ได้อนุมัติส่งข้อความหาคุณซ้ำก่อนการอนุมัติ OpenClaw จะใช้รหัสการจับคู่ที่รอดำเนินการเดิมซ้ำ และอาจส่งการตอบกลับเตือนหลังคูลดาวน์สั้น ๆ แทนการออกโค้ดใหม่

ดู [การจับคู่](/th/channels/pairing) สำหรับลำดับการจับคู่ DM ที่ใช้ร่วมกันและรูปแบบการจัดเก็บ

## การซ่อมแซมห้องโดยตรง

หากสถานะข้อความโดยตรงคลาดเคลื่อน OpenClaw อาจมีการแมป `m.direct` ที่ค้างอยู่ซึ่งชี้ไปยังห้องเดี่ยวเก่าแทน DM ปัจจุบัน ตรวจสอบการแมปปัจจุบันสำหรับเพียร์:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

ซ่อมแซม:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

ทั้งสองคำสั่งรับ `--account <id>` สำหรับการตั้งค่าแบบหลายบัญชี ลำดับการซ่อมแซม:

- เลือกใช้ DM แบบ 1:1 ที่เข้มงวดซึ่งถูกแมปอยู่แล้วใน `m.direct`
- ถอยกลับไปใช้ DM แบบ 1:1 ที่เข้มงวดใด ๆ ที่เข้าร่วมอยู่ในปัจจุบันกับผู้ใช้นั้น
- สร้างห้อง direct ใหม่และเขียน `m.direct` ใหม่หากไม่มี DM ที่ปกติอยู่

คำสั่งนี้ไม่ลบห้องเก่าโดยอัตโนมัติ แต่จะเลือก DM ที่ปกติและอัปเดตการแมป เพื่อให้การส่ง Matrix ในอนาคต ประกาศการยืนยัน และลำดับข้อความโดยตรงอื่น ๆ ไปยังห้องที่ถูกต้อง

## การอนุมัติ exec

Matrix สามารถทำหน้าที่เป็นไคลเอนต์การอนุมัติแบบเนทีฟได้ กำหนดค่าภายใต้ `channels.matrix.execApprovals` (หรือ `channels.matrix.accounts.<account>.execApprovals` สำหรับการแทนค่าต่อบัญชี):

- `enabled`: ส่งการอนุมัติผ่านพรอมป์แบบเนทีฟของ Matrix เมื่อไม่ได้ตั้งค่าหรือเป็น `"auto"` Matrix จะเปิดใช้งานอัตโนมัติเมื่อสามารถ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งราย ตั้งค่า `false` เพื่อปิดใช้งานอย่างชัดเจน
- `approvers`: ID ผู้ใช้ Matrix (`@owner:example.org`) ที่ได้รับอนุญาตให้อุมัติคำขอ exec ไม่บังคับ - ถอยกลับไปใช้ `channels.matrix.dm.allowFrom`
- `target`: ตำแหน่งที่ส่งพรอมป์ไป `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ; `"channel"` ส่งไปยังห้อง Matrix หรือ DM ที่เป็นต้นทาง; `"both"` ส่งไปทั้งสองที่
- `agentFilter` / `sessionFilter`: allowlist ไม่บังคับสำหรับเอเจนต์/เซสชันที่จะกระตุ้นการส่งผ่าน Matrix

การอนุญาตแตกต่างกันเล็กน้อยระหว่างชนิดการอนุมัติ:

- **การอนุมัติ exec** ใช้ `execApprovals.approvers` และถอยกลับไปใช้ `dm.allowFrom`
- **การอนุมัติ Plugin** อนุญาตผ่าน `dm.allowFrom` เท่านั้น

ทั้งสองชนิดใช้ทางลัดรีแอ็กชันและการอัปเดตข้อความของ Matrix ร่วมกัน ผู้อนุมัติจะเห็นทางลัดรีแอ็กชันบนข้อความอนุมัติหลัก:

- `✅` อนุญาตครั้งเดียว
- `❌` ปฏิเสธ
- `♾️` อนุญาตเสมอ (เมื่อนโยบาย exec ที่มีผลอนุญาต)

คำสั่ง slash สำรอง: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`

เฉพาะผู้อนุมัติที่ resolve ได้เท่านั้นจึงจะอนุมัติหรือปฏิเสธได้ การส่งผ่านช่องทางสำหรับการอนุมัติ exec รวมข้อความคำสั่งไว้ด้วย - เปิดใช้ `channel` หรือ `both` เฉพาะในห้องที่เชื่อถือได้

ที่เกี่ยวข้อง: [การอนุมัติ exec](/th/tools/exec-approvals)

## คำสั่ง Slash

คำสั่ง Slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` ฯลฯ) ทำงานได้โดยตรงใน DM ในห้อง OpenClaw ยังรู้จำคำสั่งที่มี mention ของบอท Matrix เองนำหน้า ดังนั้น `@bot:server /new` จะกระตุ้นเส้นทางคำสั่งโดยไม่ต้องใช้ regex สำหรับ mention แบบกำหนดเอง วิธีนี้ทำให้บอทตอบสนองต่อโพสต์แบบห้องสไตล์ `@mention /command` ที่ Element และไคลเอนต์คล้ายกันสร้างเมื่อผู้ใช้กด tab-complete บอทก่อนพิมพ์คำสั่ง

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

- ค่าระดับบนสุดของ `channels.matrix` ทำหน้าที่เป็นค่าเริ่มต้นสำหรับบัญชีที่มีชื่อ เว้นแต่บัญชีนั้นจะ override ค่าเหล่านั้น
- จำกัดขอบเขตรายการห้องที่สืบทอดมาให้เป็นบัญชีเฉพาะด้วย `groups.<room>.account` รายการที่ไม่มี `account` จะถูกใช้ร่วมกันข้ามบัญชี; `account: "default"` ยังคงทำงานเมื่อกำหนดค่าบัญชีเริ่มต้นไว้ที่ระดับบนสุด

**การเลือกบัญชีเริ่มต้น:**

- ตั้งค่า `defaultAccount` เพื่อเลือกบัญชีที่มีชื่อซึ่งการกำหนดเส้นทางโดยนัย การ probe และคำสั่ง CLI จะเลือกใช้
- หากคุณมีหลายบัญชีและบัญชีหนึ่งชื่อว่า `default` จริง ๆ OpenClaw จะใช้บัญชีนั้นโดยนัยแม้ไม่ได้ตั้งค่า `defaultAccount`
- หากคุณมีบัญชีที่มีชื่อหลายบัญชีและไม่ได้เลือกค่าเริ่มต้น คำสั่ง CLI จะปฏิเสธการเดา - ให้ตั้งค่า `defaultAccount` หรือส่ง `--account <id>`
- บล็อกระดับบนสุด `channels.matrix.*` จะถูกถือเป็นบัญชี `default` โดยนัยเฉพาะเมื่อ auth ของบล็อกนั้นสมบูรณ์ (`homeserver` + `accessToken` หรือ `homeserver` + `userId` + `password`) บัญชีที่มีชื่อยังคงค้นพบได้จาก `homeserver` + `userId` เมื่อข้อมูลรับรองที่แคชไว้ครอบคลุม auth

**การยกระดับ:**

- เมื่อ OpenClaw ยกระดับการกำหนดค่าแบบบัญชีเดียวเป็นหลายบัญชีระหว่างการซ่อมแซมหรือการตั้งค่า จะคงบัญชีที่มีชื่อเดิมไว้หากมีอยู่ หรือหาก `defaultAccount` ชี้ไปยังบัญชีหนึ่งอยู่แล้ว เฉพาะคีย์ auth/bootstrap ของ Matrix เท่านั้นที่จะย้ายเข้าไปยังบัญชีที่ถูกยกระดับ; คีย์นโยบายการส่งที่ใช้ร่วมกันจะยังอยู่ที่ระดับบนสุด

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบหลายบัญชีที่ใช้ร่วมกัน

## homeserver ส่วนตัว/LAN

โดยค่าเริ่มต้น OpenClaw จะบล็อก homeserver Matrix ส่วนตัว/ภายในเพื่อการป้องกัน SSRF เว้นแต่คุณจะเลือกเปิดใช้อย่างชัดเจนต่อบัญชี

หาก homeserver ของคุณทำงานบน localhost, IP ของ LAN/Tailscale หรือ hostname ภายใน ให้เปิดใช้
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

การเลือกใช้นี้อนุญาตเฉพาะปลายทางส่วนตัว/ภายในที่เชื่อถือได้เท่านั้น โฮมเซิร์ฟเวอร์สาธารณะแบบไม่เข้ารหัส เช่น
`http://matrix.example.org:8008` จะยังคงถูกบล็อก ควรใช้ `https://` เมื่อเป็นไปได้

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

บัญชีที่มีชื่อสามารถแทนที่ค่าเริ่มต้นระดับบนสุดได้ด้วย `channels.matrix.accounts.<id>.proxy`
OpenClaw ใช้การตั้งค่าพร็อกซีเดียวกันสำหรับทราฟฟิก Matrix ขณะรันและการตรวจสอบสถานะบัญชี

## การแปลงเป้าหมาย

Matrix ยอมรับรูปแบบเป้าหมายเหล่านี้ในทุกที่ที่ OpenClaw ขอเป้าหมายห้องหรือผู้ใช้จากคุณ:

- ผู้ใช้: `@user:server`, `user:@user:server`, หรือ `matrix:user:@user:server`
- ห้อง: `!room:server`, `room:!room:server`, หรือ `matrix:room:!room:server`
- นามแฝง: `#alias:server`, `channel:#alias:server`, หรือ `matrix:channel:#alias:server`

ID ห้อง Matrix แยกตัวพิมพ์ใหญ่-เล็ก ใช้ตัวพิมพ์ของ ID ห้องตามจริงจาก Matrix
เมื่อตั้งค่าเป้าหมายการส่งแบบชัดเจน งาน cron การผูก หรือรายการที่อนุญาต
OpenClaw เก็บคีย์เซสชันภายในให้อยู่ในรูปแบบมาตรฐานสำหรับการจัดเก็บ ดังนั้นคีย์ตัวพิมพ์เล็กเหล่านั้น
จึงไม่ใช่แหล่งข้อมูลที่เชื่อถือได้สำหรับ ID การส่งของ Matrix

การค้นหาไดเรกทอรีแบบสดใช้บัญชี Matrix ที่เข้าสู่ระบบอยู่:

- การค้นหาผู้ใช้จะสืบค้นไดเรกทอรีผู้ใช้ Matrix บนโฮมเซิร์ฟเวอร์นั้น
- การค้นหาห้องยอมรับ ID ห้องและนามแฝงแบบชัดเจนโดยตรง จากนั้นจึงย้อนกลับไปค้นหาชื่อห้องที่บัญชีนั้นเข้าร่วมอยู่
- การค้นหาชื่อห้องที่เข้าร่วมอยู่เป็นแบบพยายามให้ดีที่สุด หากไม่สามารถแปลงชื่อห้องเป็น ID หรือนามแฝงได้ ชื่อนั้นจะถูกละเว้นในการแปลงรายการที่อนุญาตขณะรัน

## ข้อมูลอ้างอิงการกำหนดค่า

ฟิลด์แบบรายการที่อนุญาต (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) ยอมรับ ID ผู้ใช้ Matrix แบบเต็ม (ปลอดภัยที่สุด) รายการที่ตรงกับไดเรกทอรีพอดีจะถูกแปลงเมื่อเริ่มต้นและทุกครั้งที่รายการที่อนุญาตเปลี่ยนระหว่างที่มอนิเตอร์ทำงานอยู่ รายการที่ไม่สามารถแปลงได้จะถูกละเว้นขณะรัน รายการที่อนุญาตของห้องควรใช้ ID ห้องหรือนามแฝงด้วยเหตุผลเดียวกัน

### บัญชีและการเชื่อมต่อ

- `enabled`: เปิดหรือปิดใช้งานช่องทาง
- `name`: ป้ายแสดงผลแบบไม่บังคับสำหรับบัญชี
- `defaultAccount`: ID บัญชีที่ต้องการเมื่อมีการกำหนดค่าบัญชี Matrix หลายบัญชี
- `accounts`: การแทนที่ต่อบัญชีแบบมีชื่อ ค่า `channels.matrix` ระดับบนสุดจะถูกสืบทอดเป็นค่าเริ่มต้น
- `homeserver`: URL ของโฮมเซิร์ฟเวอร์ เช่น `https://matrix.example.org`
- `network.dangerouslyAllowPrivateNetwork`: อนุญาตให้บัญชีนี้เชื่อมต่อกับ `localhost`, IP ของ LAN/Tailscale หรือชื่อโฮสต์ภายใน
- `proxy`: URL พร็อกซี HTTP(S) แบบไม่บังคับสำหรับทราฟฟิก Matrix รองรับการแทนค่าต่อบัญชี
- `userId`: ID ผู้ใช้ Matrix แบบเต็ม (`@bot:example.org`)
- `accessToken`: โทเค็นการเข้าถึงสำหรับการยืนยันตัวตนแบบใช้โทเค็น รองรับค่าข้อความธรรมดาและ SecretRef ผ่านผู้ให้บริการ env/file/exec ([การจัดการความลับ](/th/gateway/secrets))
- `password`: รหัสผ่านสำหรับการเข้าสู่ระบบแบบใช้รหัสผ่าน รองรับค่าข้อความธรรมดาและ SecretRef
- `deviceId`: ID อุปกรณ์ Matrix แบบชัดเจน
- `deviceName`: ชื่อแสดงผลของอุปกรณ์ที่ใช้ตอนเข้าสู่ระบบด้วยรหัสผ่าน
- `avatarUrl`: URL รูปแทนตัวของตนเองที่เก็บไว้สำหรับการซิงค์โปรไฟล์และการอัปเดต `profile set`
- `initialSyncLimit`: จำนวนเหตุการณ์สูงสุดที่ดึงมาระหว่างการซิงค์ตอนเริ่มต้น

### การเข้ารหัส

- `encryption`: เปิดใช้งาน E2EE ค่าเริ่มต้น: `false`
- `startupVerification`: `"if-unverified"` (ค่าเริ่มต้นเมื่อเปิด E2EE) หรือ `"off"` ขอการยืนยันตนเองโดยอัตโนมัติเมื่อเริ่มต้น หากอุปกรณ์นี้ยังไม่ได้รับการยืนยัน
- `startupVerificationCooldownHours`: ช่วงพักก่อนคำขอเริ่มต้นอัตโนมัติครั้งถัดไป ค่าเริ่มต้น: `24`

### การเข้าถึงและนโยบาย

- `groupPolicy`: `"open"`, `"allowlist"`, หรือ `"disabled"` ค่าเริ่มต้น: `"allowlist"`
- `groupAllowFrom`: รายการ ID ผู้ใช้ที่อนุญาตสำหรับทราฟฟิกห้อง
- `dm.enabled`: เมื่อเป็น `false` ให้ละเว้น DM ทั้งหมด ค่าเริ่มต้น: `true`
- `dm.policy`: `"pairing"` (ค่าเริ่มต้น), `"allowlist"`, `"open"`, หรือ `"disabled"` ใช้หลังจากบอทเข้าร่วมห้องและจัดประเภทห้องเป็น DM แล้ว โดยไม่ส่งผลต่อการจัดการคำเชิญ
- `dm.allowFrom`: รายการ ID ผู้ใช้ที่อนุญาตสำหรับทราฟฟิก DM
- `dm.sessionScope`: `"per-user"` (ค่าเริ่มต้น) หรือ `"per-room"`
- `dm.threadReplies`: การแทนค่าสำหรับ DM เท่านั้นสำหรับเธรดการตอบกลับ (`"off"`, `"inbound"`, `"always"`)
- `allowBots`: ยอมรับข้อความจากบัญชีบอท Matrix อื่นที่กำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `allowlistOnly`: เมื่อเป็น `true` จะบังคับนโยบาย DM ที่ใช้งานอยู่ทั้งหมด (ยกเว้น `"disabled"`) และนโยบายกลุ่ม `"open"` ให้เป็น `"allowlist"` โดยไม่เปลี่ยนนโยบาย `"disabled"`
- `autoJoin`: `"always"`, `"allowlist"`, หรือ `"off"` ค่าเริ่มต้น: `"off"` ใช้กับคำเชิญ Matrix ทุกแบบ รวมถึงคำเชิญแบบ DM
- `autoJoinAllowlist`: ห้อง/นามแฝงที่อนุญาตเมื่อ `autoJoin` เป็น `"allowlist"` รายการนามแฝงจะถูกแปลงเทียบกับโฮมเซิร์ฟเวอร์ ไม่ใช่เทียบกับสถานะที่ห้องที่เชิญอ้างไว้
- `contextVisibility`: การมองเห็นบริบทเสริม (ค่าเริ่มต้น `"all"`, `"allowlist"`, `"allowlist_quote"`)

### พฤติกรรมการตอบกลับ

- `replyToMode`: `"off"`, `"first"`, `"all"`, หรือ `"batched"`
- `threadReplies`: `"off"`, `"inbound"`, หรือ `"always"`
- `threadBindings`: การแทนค่าต่อช่องทางสำหรับการกำหนดเส้นทางเซสชันแบบผูกกับเธรดและวงจรชีวิต
- `streaming`: `"off"` (ค่าเริ่มต้น), `"partial"`, `"quiet"`, หรือรูปแบบอ็อบเจ็กต์ `{ mode, preview: { toolProgress } }` `true` ↔ `"partial"`, `false` ↔ `"off"`
- `blockStreaming`: เมื่อเป็น `true` บล็อกผู้ช่วยที่เสร็จแล้วจะถูกเก็บเป็นข้อความความคืบหน้าแยกกัน
- `markdown`: การกำหนดค่าการเรนเดอร์ Markdown แบบไม่บังคับสำหรับข้อความขาออก
- `responsePrefix`: สตริงแบบไม่บังคับที่เติมนำหน้าการตอบกลับขาออก
- `textChunkLimit`: ขนาดชิ้นส่วนขาออกเป็นจำนวนอักขระเมื่อ `chunkMode: "length"` ค่าเริ่มต้น: `4000`
- `chunkMode`: `"length"` (ค่าเริ่มต้น แบ่งตามจำนวนอักขระ) หรือ `"newline"` (แบ่งที่ขอบเขตบรรทัด)
- `historyLimit`: จำนวนข้อความห้องล่าสุดที่รวมเป็น `InboundHistory` เมื่อข้อความในห้องเรียกใช้เอเจนต์ ย้อนกลับไปใช้ `messages.groupChat.historyLimit`; ค่าเริ่มต้นที่มีผลคือ `0` (ปิดใช้งาน)
- `mediaMaxMb`: เพดานขนาดสื่อเป็น MB สำหรับการส่งขาออกและการประมวลผลขาเข้า

### การตั้งค่ารีแอ็กชัน

- `ackReaction`: การแทนค่ารีแอ็กชัน ack สำหรับช่องทาง/บัญชีนี้
- `ackReactionScope`: การแทนค่าขอบเขต (ค่าเริ่มต้น `"group-mentions"`, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`)
- `reactionNotifications`: โหมดการแจ้งเตือนรีแอ็กชันขาเข้า (ค่าเริ่มต้น `"own"`, `"off"`)

### เครื่องมือและการแทนค่าต่อห้อง

- `actions`: การควบคุมการใช้เครื่องมือต่อแอ็กชัน (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`)
- `groups`: แผนที่นโยบายต่อห้อง อัตลักษณ์เซสชันใช้ ID ห้องที่เสถียรหลังการแปลง (`rooms` เป็นนามแฝงแบบเก่า)
  - `groups.<room>.account`: จำกัดรายการห้องที่สืบทอดมาหนึ่งรายการไว้กับบัญชีเฉพาะ
  - `groups.<room>.allowBots`: การแทนค่าต่อห้องของการตั้งค่าระดับช่องทาง (`true` หรือ `"mentions"`)
  - `groups.<room>.users`: รายการผู้ส่งที่อนุญาตต่อห้อง
  - `groups.<room>.tools`: การแทนค่าการอนุญาต/ปฏิเสธเครื่องมือต่อห้อง
  - `groups.<room>.autoReply`: การแทนค่าการควบคุมด้วยการกล่าวถึงต่อห้อง `true` ปิดข้อกำหนดการกล่าวถึงสำหรับห้องนั้น; `false` บังคับให้กลับมาเปิด
  - `groups.<room>.skills`: ตัวกรอง Skills ต่อห้อง
  - `groups.<room>.systemPrompt`: ส่วนย่อยพรอมป์ระบบต่อห้อง

### การตั้งค่าการอนุมัติ exec

- `execApprovals.enabled`: ส่งการอนุมัติ exec ผ่านพรอมป์แบบเนทีฟของ Matrix
- `execApprovals.approvers`: ID ผู้ใช้ Matrix ที่ได้รับอนุญาตให้อนุมัติ ย้อนกลับไปใช้ `dm.allowFrom`
- `execApprovals.target`: `"dm"` (ค่าเริ่มต้น), `"channel"`, หรือ `"both"`
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: รายการเอเจนต์/เซสชันที่อนุญาตแบบไม่บังคับสำหรับการส่ง

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) - ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
