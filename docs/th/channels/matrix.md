---
read_when:
    - การตั้งค่า Matrix ใน OpenClaw
    - การกำหนดค่า Matrix E2EE และการยืนยันตัวตน
summary: สถานะการรองรับ วิธีตั้งค่า และตัวอย่างการกำหนดค่า Matrix
title: Matrix
x-i18n:
    generated_at: "2026-04-25T13:41:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e764c837f34131f20d1e912c059ffdce61421227a44b7f91faa624a6f878ed2
    source_path: channels/matrix.md
    workflow: 15
---

Matrix เป็น Plugin แชนเนลที่มาพร้อมกับ OpenClaw
โดยใช้ `matrix-js-sdk` อย่างเป็นทางการ และรองรับ DM, rooms, threads, media, reactions, polls, location และ E2EE

## Plugin ที่มาพร้อมระบบ

Matrix มาพร้อมเป็น Plugin ที่รวมอยู่ในรีลีส OpenClaw ปัจจุบัน ดังนั้น
บิลด์แพ็กเกจปกติจึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Matrix ให้ติดตั้ง
ด้วยตนเอง:

ติดตั้งจาก npm:

```bash
openclaw plugins install @openclaw/matrix
```

ติดตั้งจาก local checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

ดู [Plugins](/th/tools/plugin) สำหรับพฤติกรรมของ Plugin และกฎการติดตั้ง

## การตั้งค่า

1. ตรวจสอบให้แน่ใจว่า Plugin Matrix พร้อมใช้งาน
   - รีลีส OpenClaw แบบแพ็กเกจปัจจุบันรวมมาให้แล้ว
   - การติดตั้งแบบเก่าหรือแบบกำหนดเองสามารถเพิ่มได้ด้วยตนเองด้วยคำสั่งด้านบน
2. สร้างบัญชี Matrix บน homeserver ของคุณ
3. กำหนดค่า `channels.matrix` โดยใช้:
   - `homeserver` + `accessToken` หรือ
   - `homeserver` + `userId` + `password`
4. รีสตาร์ต Gateway
5. เริ่ม DM กับบอทหรือเชิญบอทเข้าห้อง
   - คำเชิญ Matrix ใหม่จะใช้งานได้ก็ต่อเมื่อ `channels.matrix.autoJoin` อนุญาต

เส้นทางการตั้งค่าแบบอินเทอร์แอคทีฟ:

```bash
openclaw channels add
openclaw configure --section channels
```

วิซาร์ด Matrix จะถามข้อมูลต่อไปนี้:

- URL ของ homeserver
- วิธีการยืนยันตัวตน: access token หรือ password
- user ID (เฉพาะการยืนยันตัวตนด้วย password)
- ชื่ออุปกรณ์เพิ่มเติม (ไม่บังคับ)
- จะเปิดใช้ E2EE หรือไม่
- จะกำหนดค่าการเข้าถึงห้องและการเข้าร่วมอัตโนมัติจากคำเชิญหรือไม่

พฤติกรรมสำคัญของวิซาร์ด:

- หากมีตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตนของ Matrix อยู่แล้ว และบัญชีนั้นยังไม่มีข้อมูลยืนยันตัวตนที่บันทึกไว้ใน config วิซาร์ดจะเสนอทางลัด env เพื่อเก็บข้อมูลยืนยันตัวตนไว้ในตัวแปรสภาพแวดล้อม
- ชื่อบัญชีจะถูกทำให้เป็นมาตรฐานตาม account ID ตัวอย่างเช่น `Ops Bot` จะกลายเป็น `ops-bot`
- รายการ allowlist ของ DM รับค่า `@user:server` ได้โดยตรง; display name ใช้งานได้ก็ต่อเมื่อการค้นหาไดเรกทอรีแบบสดพบรายการที่ตรงกันเพียงหนึ่งรายการเท่านั้น
- รายการ allowlist ของห้องรับ room IDs และ aliases ได้โดยตรง แนะนำให้ใช้ `!room:server` หรือ `#alias:server`; ชื่อที่ไม่สามารถ resolve ได้จะถูกเพิกเฉยขณะรันไทม์โดยกระบวนการ resolve allowlist
- ในโหมด allowlist สำหรับการเข้าร่วมห้องอัตโนมัติจากคำเชิญ ให้ใช้เฉพาะเป้าหมายคำเชิญที่เสถียร: `!roomId:server`, `#alias:server` หรือ `*` เท่านั้น ระบบจะปฏิเสธชื่อห้องแบบ plain
- หากต้องการ resolve ชื่อห้องก่อนบันทึก ให้ใช้ `openclaw channels resolve --channel matrix "Project Room"`

<Warning>
`channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off`

หากคุณปล่อยค่าไว้โดยไม่กำหนด บอทจะไม่เข้าร่วมห้องที่ได้รับเชิญหรือคำเชิญแบบ DM ใหม่ ดังนั้นบอทจะไม่ปรากฏในกลุ่มใหม่หรือ DM ที่ได้รับเชิญ เว้นแต่คุณจะเข้าร่วมด้วยตนเองก่อน

ตั้งค่า `autoJoin: "allowlist"` ร่วมกับ `autoJoinAllowlist` เพื่อจำกัดว่าคำเชิญแบบใดที่ยอมรับได้ หรือกำหนด `autoJoin: "always"` หากคุณต้องการให้เข้าร่วมทุกคำเชิญ

ในโหมด `allowlist`, `autoJoinAllowlist` รับได้เฉพาะ `!roomId:server`, `#alias:server` หรือ `*` เท่านั้น
</Warning>

ตัวอย่าง allowlist:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

เข้าร่วมทุกคำเชิญ:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

การตั้งค่าขั้นต่ำแบบใช้ token:

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

การตั้งค่าแบบใช้ password (token จะถูกแคชหลังจากล็อกอิน):

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

Matrix จะเก็บข้อมูลยืนยันตัวตนที่แคชไว้ใน `~/.openclaw/credentials/matrix/`
บัญชีค่าเริ่มต้นใช้ `credentials.json`; บัญชีที่ตั้งชื่อใช้ `credentials-<account>.json`
เมื่อมีข้อมูลยืนยันตัวตนที่แคชไว้ในตำแหน่งดังกล่าว OpenClaw จะถือว่า Matrix ถูกกำหนดค่าแล้วสำหรับการตั้งค่า doctor และการค้นหาสถานะแชนเนล แม้ว่าการยืนยันตัวตนปัจจุบันจะไม่ได้ถูกตั้งไว้ใน config โดยตรงก็ตาม

ตัวแปรสภาพแวดล้อมที่เทียบเท่า (ใช้เมื่อไม่ได้ตั้งค่า key ใน config):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

สำหรับบัญชีที่ไม่ใช่ค่าเริ่มต้น ให้ใช้ตัวแปรสภาพแวดล้อมแบบผูกกับบัญชี:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

ตัวอย่างสำหรับบัญชี `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

สำหรับ account ID แบบ normalized `ops-bot` ให้ใช้:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix จะ escape เครื่องหมายวรรคตอนใน account ID เพื่อป้องกันการชนกันของตัวแปรสภาพแวดล้อมแบบผูกกับบัญชี
ตัวอย่างเช่น `-` จะกลายเป็น `_X2D_` ดังนั้น `ops-prod` จะถูกแมปเป็น `MATRIX_OPS_X2D_PROD_*`

วิซาร์ดแบบอินเทอร์แอคทีฟจะเสนอทางลัด env-var ก็ต่อเมื่อตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตนเหล่านั้นมีอยู่แล้ว และบัญชีที่เลือกยังไม่มีข้อมูลยืนยันตัวตนของ Matrix บันทึกอยู่ใน config

ไม่สามารถตั้งค่า `MATRIX_HOMESERVER` จาก workspace `.env` ได้; ดู [Workspace `.env` files](/th/gateway/security)

## ตัวอย่างการกำหนดค่า

นี่คือตัวอย่าง config พื้นฐานที่ใช้งานได้จริง พร้อม DM pairing, room allowlist และเปิดใช้ E2EE:

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
        "!roomid:example.org": {
          requireMention: true,
        },
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

`autoJoin` ใช้กับคำเชิญ Matrix ทั้งหมด รวมถึงคำเชิญแบบ DM ด้วย OpenClaw ไม่สามารถ
จำแนกได้อย่างน่าเชื่อถือในเวลาที่เชิญว่าห้องที่ถูกเชิญเป็น DM หรือกลุ่ม ดังนั้นคำเชิญทั้งหมดจึงต้องผ่าน `autoJoin`
ก่อน ส่วน `dm.policy` จะถูกนำไปใช้หลังจากบอทเข้าร่วมแล้วและห้องถูกจัดประเภทเป็น DM

## ตัวอย่างการสตรีมแบบพรีวิว

การสตรีมการตอบกลับของ Matrix เป็นแบบ opt-in

ตั้งค่า `channels.matrix.streaming` เป็น `"partial"` เมื่อคุณต้องการให้ OpenClaw ส่งคำตอบพรีวิวสดหนึ่งรายการ
แก้ไขพรีวิวนั้นแบบแทนที่ข้อความเดิมระหว่างที่โมเดลกำลังสร้างข้อความ แล้วจบการทำงานเมื่อ
ตอบกลับเสร็จสมบูรณ์:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` เป็นค่าเริ่มต้น OpenClaw จะรอคำตอบสุดท้ายแล้วส่งเพียงครั้งเดียว
- `streaming: "partial"` จะสร้างข้อความพรีวิวที่แก้ไขได้หนึ่งข้อความสำหรับบล็อก assistant ปัจจุบันโดยใช้ข้อความ Matrix ปกติ ซึ่งจะคงพฤติกรรมการแจ้งเตือนแบบพรีวิวก่อนของ Matrix รุ่นเก่าไว้ ดังนั้นไคลเอนต์มาตรฐานอาจแจ้งเตือนจากข้อความพรีวิวที่สตรีมครั้งแรกแทนบล็อกที่เสร็จสมบูรณ์
- `streaming: "quiet"` จะสร้างข้อความพรีวิวแบบ quiet ที่แก้ไขได้หนึ่งข้อความสำหรับบล็อก assistant ปัจจุบัน ใช้ตัวเลือกนี้เฉพาะเมื่อคุณกำหนด recipient push rules สำหรับการแก้ไขพรีวิวที่เสร็จสมบูรณ์แล้วด้วย
- `blockStreaming: true` จะเปิดใช้ข้อความความคืบหน้า Matrix แยกต่างหาก เมื่อเปิดใช้การสตรีมแบบพรีวิว Matrix จะคงฉบับร่างสดไว้สำหรับบล็อกปัจจุบัน และเก็บบล็อกที่เสร็จสมบูรณ์ไว้เป็นข้อความแยก
- เมื่อเปิดการสตรีมแบบพรีวิวและ `blockStreaming` ปิดอยู่ Matrix จะแก้ไขฉบับร่างสดแบบแทนที่เดิมและสรุปเป็น event เดิมนั้นเมื่อบล็อกหรือเทิร์นเสร็จสิ้น
- หากพรีวิวไม่สามารถพอดีใน Matrix event เดียวได้อีกต่อไป OpenClaw จะหยุดการสตรีมแบบพรีวิวและถอยกลับไปใช้การส่งแบบสุดท้ายปกติ
- คำตอบแบบ media จะยังคงส่งไฟล์แนบตามปกติ หากไม่สามารถนำพรีวิวเก่ากลับมาใช้ซ้ำได้อย่างปลอดภัย OpenClaw จะ redact พรีวิวนั้นก่อนส่งคำตอบ media สุดท้าย
- การแก้ไขพรีวิวทำให้มี Matrix API calls เพิ่มขึ้น ปล่อยให้ปิดการสตรีมไว้หากคุณต้องการพฤติกรรมด้าน rate limit ที่ระมัดระวังที่สุด

`blockStreaming` ไม่ได้เปิดใช้พรีวิวฉบับร่างด้วยตัวมันเอง
ให้ใช้ `streaming: "partial"` หรือ `streaming: "quiet"` สำหรับการแก้ไขพรีวิว; แล้วจึงเพิ่ม `blockStreaming: true` เฉพาะเมื่อคุณต้องการให้บล็อก assistant ที่เสร็จแล้วคงอยู่เป็นข้อความความคืบหน้าแยกด้วย

หากคุณต้องการการแจ้งเตือน Matrix แบบมาตรฐานโดยไม่ต้องใช้ custom push rules ให้ใช้ `streaming: "partial"` สำหรับพฤติกรรมแบบพรีวิวก่อน หรือปล่อย `streaming` เป็นปิดไว้สำหรับการส่งเฉพาะผลลัพธ์สุดท้าย เมื่อ `streaming: "off"`:

- `blockStreaming: true` จะส่งแต่ละบล็อกที่เสร็จแล้วเป็นข้อความ Matrix ปกติที่มีการแจ้งเตือน
- `blockStreaming: false` จะส่งเฉพาะคำตอบสุดท้ายที่เสร็จสมบูรณ์เป็นข้อความ Matrix ปกติที่มีการแจ้งเตือน

### push rules แบบ self-hosted สำหรับพรีวิวแบบ quiet ที่สรุปแล้ว

การสตรีมแบบ quiet (`streaming: "quiet"`) จะแจ้งเตือนผู้รับเฉพาะเมื่อบล็อกหรือเทิร์นถูกสรุปเสร็จแล้วเท่านั้น — push rule ระดับผู้ใช้ต้องตรงกับตัวทำเครื่องหมายพรีวิวที่สรุปแล้ว ดู [Matrix push rules for quiet previews](/th/channels/matrix-push-rules) สำหรับการตั้งค่าแบบเต็ม (recipient token, การตรวจสอบ pusher, การติดตั้ง rule, หมายเหตุแยกตาม homeserver)

## ห้องบอทถึงบอท

ตามค่าเริ่มต้น ข้อความ Matrix จากบัญชี Matrix ของ OpenClaw อื่นที่ถูกกำหนดค่าไว้จะถูกเพิกเฉย

ใช้ `allowBots` เมื่อคุณต้องการให้มีทราฟฟิก Matrix ระหว่างเอเจนต์โดยตั้งใจ:

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

- `allowBots: true` ยอมรับข้อความจากบัญชีบอท Matrix อื่นที่ถูกกำหนดค่าไว้ในห้องและ DM ที่อนุญาต
- `allowBots: "mentions"` ยอมรับข้อความเหล่านั้นเฉพาะเมื่อมีการ mention บอทนี้อย่างชัดเจนในห้อง ส่วน DM ยังอนุญาตตามปกติ
- `groups.<room>.allowBots` ใช้แทนค่าระดับบัญชีสำหรับห้องใดห้องหนึ่ง
- OpenClaw ยังคงเพิกเฉยต่อข้อความจาก Matrix user ID เดียวกัน เพื่อหลีกเลี่ยงลูปตอบกลับตัวเอง
- Matrix ไม่มี bot flag แบบ native สำหรับกรณีนี้; OpenClaw ถือว่า "bot-authored" หมายถึง "ส่งมาจากบัญชี Matrix อื่นที่ถูกกำหนดค่าบน OpenClaw Gateway นี้"

ให้ใช้ room allowlist แบบเข้มงวดและข้อกำหนดการ mention เมื่อเปิดใช้ทราฟฟิกบอทถึงบอทในห้องที่ใช้ร่วมกัน

## การเข้ารหัสและการยืนยันตัวตน

ในห้องที่เข้ารหัส (E2EE) event รูปภาพขาออกจะใช้ `thumbnail_file` เพื่อให้ภาพพรีวิวถูกเข้ารหัสไปพร้อมกับไฟล์แนบขนาดเต็ม ห้องที่ไม่เข้ารหัสจะยังใช้ `thumbnail_url` แบบปกติ ไม่จำเป็นต้องตั้งค่าใด ๆ เพิ่มเติม — Plugin จะตรวจจับสถานะ E2EE โดยอัตโนมัติ

เปิดใช้การเข้ารหัส:

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

คำสั่งการยืนยันตัวตน (ทั้งหมดรองรับ `--verbose` สำหรับการวินิจฉัย และ `--json` สำหรับผลลัพธ์แบบ machine-readable):

```bash
openclaw matrix verify status
```

สถานะแบบ verbose (การวินิจฉัยเต็มรูปแบบ):

```bash
openclaw matrix verify status --verbose
```

รวม recovery key ที่จัดเก็บไว้ในผลลัพธ์แบบ machine-readable:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Bootstrap สถานะ cross-signing และ verification:

```bash
openclaw matrix verify bootstrap
```

การวินิจฉัย bootstrap แบบ verbose:

```bash
openclaw matrix verify bootstrap --verbose
```

บังคับรีเซ็ต cross-signing identity ใหม่ก่อนทำ bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

ยืนยันอุปกรณ์นี้ด้วย recovery key:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

คำสั่งนี้จะรายงานสถานะแยกกันสามรายการ:

- `Recovery key accepted`: Matrix ยอมรับ recovery key สำหรับ secret storage หรือความเชื่อถือของอุปกรณ์
- `Backup usable`: สามารถโหลด room-key backup ได้ด้วย recovery material ที่เชื่อถือได้
- `Device verified by owner`: อุปกรณ์ OpenClaw ปัจจุบันมีความเชื่อถือของ Matrix cross-signing identity อย่างสมบูรณ์

`Signed by owner` ในผลลัพธ์แบบ verbose หรือ JSON ใช้เพื่อการวินิจฉัยเท่านั้น OpenClaw ไม่ถือว่า
เพียงพอ เว้นแต่ `Cross-signing verified` จะเป็น `yes` ด้วย

คำสั่งนี้ยังคงออกด้วยโค้ดไม่เป็นศูนย์เมื่อความเชื่อถือของ Matrix identity แบบสมบูรณ์ยังไม่ครบถ้วน
แม้ว่า recovery key จะสามารถปลดล็อก backup material ได้ก็ตาม ในกรณีนั้น ให้ทำ
self-verification จาก Matrix client อื่นให้เสร็จสมบูรณ์:

```bash
openclaw matrix verify self
```

ยอมรับคำขอใน Matrix client อื่น เปรียบเทียบอีโมจิ SAS หรือตัวเลขทศนิยม
แล้วพิมพ์ `yes` เฉพาะเมื่อค่าตรงกัน คำสั่งจะรอจนกว่า Matrix จะรายงาน
`Cross-signing verified: yes` ก่อนจึงจะออกสำเร็จ

ใช้ `verify bootstrap --force-reset-cross-signing` เฉพาะเมื่อคุณตั้งใจ
ต้องการแทนที่ cross-signing identity ปัจจุบัน

รายละเอียดการยืนยันอุปกรณ์แบบ verbose:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

ตรวจสอบสถานะสุขภาพของ room-key backup:

```bash
openclaw matrix verify backup status
```

การวินิจฉัยสถานะสุขภาพของ backup แบบ verbose:

```bash
openclaw matrix verify backup status --verbose
```

กู้คืน room keys จาก backup บนเซิร์ฟเวอร์:

```bash
openclaw matrix verify backup restore
```

โฟลว์ self-verification แบบอินเทอร์แอคทีฟ:

```bash
openclaw matrix verify self
```

สำหรับคำขอยืนยันระดับล่างหรือคำขอยืนยันขาเข้า ให้ใช้:

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

ใช้ `openclaw matrix verify cancel <id>` เพื่อยกเลิกคำขอ

การวินิจฉัยการกู้คืนแบบ verbose:

```bash
openclaw matrix verify backup restore --verbose
```

ลบ backup ปัจจุบันบนเซิร์ฟเวอร์และสร้าง baseline ของ backup ใหม่ หากไม่สามารถโหลด
backup key ที่จัดเก็บไว้ได้อย่างสมบูรณ์ การรีเซ็ตนี้ยังสามารถสร้าง secret storage ใหม่ได้ด้วย เพื่อให้
การเริ่มต้นแบบ cold start ในอนาคตสามารถโหลด backup key ใหม่ได้:

```bash
openclaw matrix verify backup reset --yes
```

คำสั่ง `verify` ทั้งหมดจะแสดงผลแบบกระชับตามค่าเริ่มต้น (รวมถึงบันทึกภายในของ SDK แบบเงียบ) และจะแสดงการวินิจฉัยโดยละเอียดเมื่อใช้ `--verbose` เท่านั้น
ใช้ `--json` สำหรับผลลัพธ์แบบ machine-readable แบบเต็มเมื่อทำสคริปต์

ในการตั้งค่าแบบหลายบัญชี คำสั่ง CLI ของ Matrix จะใช้บัญชี Matrix ค่าเริ่มต้นแบบโดยนัย เว้นแต่คุณจะส่ง `--account <id>`
หากคุณกำหนดค่าหลายบัญชีที่มีชื่อไว้ ให้ตั้งค่า `channels.matrix.defaultAccount` ก่อน มิฉะนั้นการดำเนินการ CLI แบบโดยนัยเหล่านั้นจะหยุดและขอให้คุณเลือกบัญชีอย่างชัดเจน
ใช้ `--account` ทุกครั้งเมื่อคุณต้องการให้การยืนยันหรือการดำเนินการกับอุปกรณ์มุ่งเป้าไปยังบัญชีที่มีชื่ออย่างชัดเจน:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

เมื่อการเข้ารหัสถูกปิดใช้งานหรือไม่พร้อมใช้งานสำหรับบัญชีที่มีชื่อ คำเตือนของ Matrix และข้อผิดพลาดการยืนยันจะชี้ไปยังคีย์ config ของบัญชีนั้น เช่น `channels.matrix.accounts.assistant.encryption`

<AccordionGroup>
  <Accordion title="ความหมายของ verified">
    OpenClaw จะถือว่าอุปกรณ์ได้รับการยืนยันแล้วก็ต่อเมื่อ cross-signing identity ของคุณเองเป็นผู้ลงนามให้อุปกรณ์นั้น `verify status --verbose` จะแสดงสัญญาณความเชื่อถือ 3 รายการ:

    - `Locally trusted`: เชื่อถือโดย client นี้เท่านั้น
    - `Cross-signing verified`: SDK รายงานว่ามีการยืนยันผ่าน cross-signing
    - `Signed by owner`: ลงนามโดย self-signing key ของคุณเอง

    `Verified by owner` จะกลายเป็น `yes` ก็ต่อเมื่อมีการยืนยันด้วย cross-signing
    ความเชื่อถือเฉพาะในเครื่องหรือการลงนามโดยเจ้าของเพียงอย่างเดียวไม่เพียงพอที่ OpenClaw จะถือว่า
    อุปกรณ์ได้รับการยืนยันอย่างสมบูรณ์

  </Accordion>

  <Accordion title="สิ่งที่ bootstrap ทำ">
    `verify bootstrap` คือคำสั่งซ่อมแซมและตั้งค่าสำหรับบัญชีที่เข้ารหัส โดยจะทำงานตามลำดับดังนี้:

    - bootstrap secret storage โดยนำ recovery key ที่มีอยู่กลับมาใช้ซ้ำเมื่อเป็นไปได้
    - bootstrap cross-signing และอัปโหลด public cross-signing keys ที่ขาดหายไป
    - ทำเครื่องหมายและ cross-sign อุปกรณ์ปัจจุบัน
    - สร้าง room-key backup ฝั่งเซิร์ฟเวอร์หากยังไม่มีอยู่

    หาก homeserver ต้องใช้ UIA เพื่ออัปโหลด cross-signing keys OpenClaw จะลองแบบไม่ใช้ auth ก่อน จากนั้น `m.login.dummy` แล้วจึง `m.login.password` (ต้องมี `channels.matrix.password`) ใช้ `--force-reset-cross-signing` เฉพาะเมื่อคุณตั้งใจจะทิ้ง identity ปัจจุบัน

  </Accordion>

  <Accordion title="baseline ของ backup ใหม่">
    หากคุณต้องการให้ข้อความที่เข้ารหัสในอนาคตยังทำงานได้ และยอมรับการสูญเสียประวัติเก่าที่ไม่สามารถกู้คืนได้:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    เพิ่ม `--account <id>` เพื่อมุ่งเป้าไปยังบัญชีที่มีชื่อ การดำเนินการนี้ยังสามารถสร้าง secret storage ใหม่ได้ด้วย หากไม่สามารถโหลด backup secret ปัจจุบันได้อย่างปลอดภัย

  </Accordion>

  <Accordion title="พฤติกรรมเมื่อเริ่มต้นระบบ">
    เมื่อใช้ `encryption: true`, `startupVerification` จะมีค่าเริ่มต้นเป็น `"if-unverified"` ตอนเริ่มต้น อุปกรณ์ที่ยังไม่ผ่านการยืนยันจะร้องขอ self-verification ใน Matrix client อื่น โดยข้ามคำขอซ้ำและใช้ช่วงคูลดาวน์ ปรับแต่งได้ด้วย `startupVerificationCooldownHours` หรือปิดใช้งานด้วย `startupVerification: "off"`

    เมื่อเริ่มต้น ระบบยังรันการ bootstrap ด้านคริปโตแบบระมัดระวัง ซึ่งจะนำ secret storage และ cross-signing identity ปัจจุบันกลับมาใช้ซ้ำ หากสถานะ bootstrap เสียหาย OpenClaw จะพยายามซ่อมแซมแบบมีการป้องกัน แม้ไม่มี `channels.matrix.password`; หาก homeserver ต้องใช้ password UIA ตอนเริ่มต้น ระบบจะบันทึกคำเตือนและไม่ถือเป็นข้อผิดพลาดร้ายแรง อุปกรณ์ที่ถูกลงนามโดยเจ้าของอยู่แล้วจะถูกคงไว้

    ดู [Matrix migration](/th/install/migrating-matrix) สำหรับโฟลว์การอัปเกรดแบบเต็ม

  </Accordion>

  <Accordion title="ประกาศการยืนยันตัวตน">
    Matrix จะโพสต์ประกาศวงจรชีวิตของการยืนยันตัวตนลงในห้อง DM สำหรับการยืนยันแบบเข้มงวดในรูปแบบข้อความ `m.notice`: คำขอ, ready (พร้อมคำแนะนำ "Verify by emoji"), การเริ่มต้น/เสร็จสมบูรณ์ และรายละเอียด SAS (อีโมจิ/ตัวเลขทศนิยม) เมื่อมี

    คำขอขาเข้าจาก Matrix client อื่นจะถูกติดตามและยอมรับอัตโนมัติ สำหรับ self-verification, OpenClaw จะเริ่มโฟลว์ SAS โดยอัตโนมัติและยืนยันฝั่งของตัวเองเมื่อการยืนยันด้วยอีโมจิพร้อมใช้งาน — แต่คุณยังต้องเปรียบเทียบและยืนยัน "They match" ใน Matrix client ของคุณอยู่ดี

    ประกาศระบบสำหรับการยืนยันตัวตนจะไม่ถูกส่งต่อไปยังไปป์ไลน์แชตของเอเจนต์

  </Accordion>

  <Accordion title="สุขอนามัยของอุปกรณ์">
    อุปกรณ์เก่าที่จัดการโดย OpenClaw อาจสะสมเพิ่มขึ้นได้ แสดงรายการและล้างออก:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE ใช้เส้นทาง Rust crypto ของ `matrix-js-sdk` อย่างเป็นทางการ ร่วมกับ `fake-indexeddb` เป็น IndexedDB shim สถานะคริปโตจะถูกเก็บถาวรลงใน `crypto-idb-snapshot.json` (สิทธิ์ไฟล์แบบเข้มงวด)

    สถานะรันไทม์แบบเข้ารหัสจะอยู่ภายใต้ `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` และรวมถึง sync store, crypto store, recovery key, IDB snapshot, thread bindings และสถานะ startup verification เมื่อ token เปลี่ยนแต่ identity ของบัญชียังคงเดิม OpenClaw จะนำ root เดิมที่เหมาะสมที่สุดกลับมาใช้ซ้ำ เพื่อให้สถานะก่อนหน้ายังคงมองเห็นได้

  </Accordion>
</AccordionGroup>

## การจัดการโปรไฟล์

อัปเดต self-profile ของ Matrix สำหรับบัญชีที่เลือกด้วย:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

เพิ่ม `--account <id>` เมื่อต้องการมุ่งเป้าไปยังบัญชี Matrix ที่มีชื่ออย่างชัดเจน

Matrix ยอมรับ URL รูปประจำตัวแบบ `mxc://` ได้โดยตรง เมื่อคุณส่ง URL รูปประจำตัวแบบ `http://` หรือ `https://` OpenClaw จะอัปโหลดไปยัง Matrix ก่อน แล้วบันทึก URL `mxc://` ที่ resolve แล้วกลับไปยัง `channels.matrix.avatarUrl` (หรือ override ของบัญชีที่เลือก)

## เธรด

Matrix รองรับ Matrix threads แบบเนทีฟทั้งสำหรับการตอบกลับอัตโนมัติและการส่งผ่าน message-tool

- `dm.sessionScope: "per-user"` (ค่าเริ่มต้น) จะคงการกำหนดเส้นทาง DM ของ Matrix ไว้ตามผู้ส่ง ดังนั้นหลายห้อง DM จึงแชร์หนึ่งเซสชันได้เมื่อ resolve ไปยังคู่สนทนาคนเดียวกัน
- `dm.sessionScope: "per-room"` จะแยกแต่ละห้อง DM ของ Matrix ให้มี session key ของตัวเอง ขณะเดียวกันก็ยังใช้การยืนยันตัวตนของ DM และการตรวจสอบ allowlist ตามปกติ
- explicit Matrix conversation bindings ยังคงมีลำดับความสำคัญเหนือ `dm.sessionScope` ดังนั้นห้องและเธรดที่ bind ไว้จะคงใช้เซสชันเป้าหมายที่เลือกไว้
- `threadReplies: "off"` จะคงการตอบกลับไว้ที่ระดับบนสุด และทำให้ข้อความขาเข้าที่เป็นเธรดอยู่บน parent session
- `threadReplies: "inbound"` จะตอบกลับภายในเธรดก็ต่อเมื่อข้อความขาเข้าอยู่ในเธรดนั้นอยู่แล้ว
- `threadReplies: "always"` จะคงการตอบกลับในห้องให้อยู่ในเธรดที่ยึดกับข้อความที่เป็นตัวกระตุ้น และกำหนดเส้นทางบทสนทนานั้นผ่าน session แบบผูกกับเธรดที่ตรงกันจากข้อความกระตุ้นแรก
- `dm.threadReplies` ใช้แทนค่าระดับบนสุดสำหรับ DM เท่านั้น ตัวอย่างเช่น คุณสามารถแยกเธรดของห้องออกจากกันได้ ขณะเดียวกันก็ให้ DM เป็นแบบแบน
- ข้อความขาเข้าที่เป็นเธรดจะรวมข้อความรากของเธรดเป็นบริบทเพิ่มเติมให้เอเจนต์
- การส่งผ่าน message-tool จะสืบทอด Matrix thread ปัจจุบันโดยอัตโนมัติเมื่อเป้าหมายเป็นห้องเดียวกัน หรือเป็นเป้าหมายผู้ใช้ DM เดียวกัน เว้นแต่จะมีการระบุ `threadId` อย่างชัดเจน
- การใช้ซ้ำเป้าหมายผู้ใช้ DM แบบ same-session จะเกิดขึ้นก็ต่อเมื่อ metadata ของเซสชันปัจจุบันพิสูจน์ได้ว่าเป็นคู่สนทนา DM คนเดียวกันบนบัญชี Matrix เดียวกัน; มิฉะนั้น OpenClaw จะถอยกลับไปใช้การกำหนดเส้นทางตามขอบเขตผู้ใช้ตามปกติ
- เมื่อ OpenClaw เห็นว่าห้อง DM ของ Matrix ชนกับห้อง DM อื่นบน Matrix DM session ที่ใช้ร่วมกันเดียวกัน ระบบจะโพสต์ `m.notice` แบบครั้งเดียวในห้องนั้นพร้อม escape hatch `/focus` เมื่อเปิดใช้ thread bindings และมีคำใบ้ `dm.sessionScope`
- รองรับ runtime thread bindings สำหรับ Matrix `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และ `/acp spawn` แบบผูกกับเธรด ทำงานได้ในห้องและ DM ของ Matrix
- `/focus` ระดับบนสุดของห้อง/DM ใน Matrix จะสร้าง Matrix thread ใหม่และ bind เข้ากับเซสชันเป้าหมายเมื่อ `threadBindings.spawnSubagentSessions=true`
- การรัน `/focus` หรือ `/acp spawn --thread here` ภายใน Matrix thread ที่มีอยู่แล้ว จะ bind เธรดปัจจุบันนั้นแทน

## ACP conversation bindings

ห้อง Matrix, DM และ Matrix threads ที่มีอยู่แล้ว สามารถเปลี่ยนให้เป็น ACP workspaces แบบคงทนได้โดยไม่ต้องเปลี่ยนพื้นผิวของแชต

โฟลว์แบบรวดเร็วสำหรับโอเปอเรเตอร์:

- รัน `/acp spawn codex --bind here` ภายใน Matrix DM, ห้อง หรือเธรดที่มีอยู่แล้วที่คุณต้องการใช้งานต่อ
- ใน Matrix DM หรือห้องระดับบนสุด DM/ห้องปัจจุบันจะยังคงเป็นพื้นผิวของแชต และข้อความในอนาคตจะถูกกำหนดเส้นทางไปยัง ACP session ที่สร้างขึ้น
- ภายใน Matrix thread ที่มีอยู่แล้ว `--bind here` จะ bind เธรดปัจจุบันนั้นไว้กับที่
- `/new` และ `/reset` จะรีเซ็ต ACP session เดิมที่ bind ไว้ในตำแหน่งเดิม
- `/acp close` จะปิด ACP session และลบ binding ออก

หมายเหตุ:

- `--bind here` จะไม่สร้าง Matrix thread ลูก
- `threadBindings.spawnAcpSessions` จำเป็นเฉพาะสำหรับ `/acp spawn --thread auto|here` ซึ่งเป็นกรณีที่ OpenClaw ต้องสร้างหรือ bind Matrix thread ลูก

### การกำหนดค่า thread binding

Matrix สืบทอดค่าเริ่มต้นแบบโกลบอลจาก `session.threadBindings` และยังรองรับการ override รายแชนเนลด้วย:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

แฟล็กการ spawn แบบ thread-bound ของ Matrix เป็นแบบ opt-in:

- ตั้งค่า `threadBindings.spawnSubagentSessions: true` เพื่ออนุญาตให้ `/focus` ระดับบนสุดสร้างและ bind Matrix threads ใหม่
- ตั้งค่า `threadBindings.spawnAcpSessions: true` เพื่ออนุญาตให้ `/acp spawn --thread auto|here` bind ACP sessions เข้ากับ Matrix threads

## Reactions

Matrix รองรับการทำงาน reaction ขาออก, การแจ้งเตือน reaction ขาเข้า และ ack reactions ขาเข้า

- เครื่องมือ reaction ขาออกถูกควบคุมด้วย `channels["matrix"].actions.reactions`
- `react` เพิ่ม reaction ให้กับ Matrix event ที่ระบุ
- `reactions` แสดงรายการสรุป reaction ปัจจุบันของ Matrix event ที่ระบุ
- `emoji=""` จะลบ reactions ของบัญชีบอทเองบน event นั้น
- `remove: true` จะลบเฉพาะ reaction ของอีโมจิที่ระบุจากบัญชีบอท

ขอบเขตของ ack reaction ใช้ลำดับการ resolve มาตรฐานของ OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback เป็นอีโมจิ identity ของเอเจนต์

ขอบเขตของ ack reaction จะ resolve ตามลำดับนี้:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

โหมดการแจ้งเตือน reaction จะ resolve ตามลำดับนี้:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- ค่าเริ่มต้น: `own`

พฤติกรรม:

- `reactionNotifications: "own"` จะส่งต่อ `m.reaction` events ที่ถูกเพิ่มเข้ามา เมื่อ event เหล่านั้นอ้างอิงถึงข้อความ Matrix ที่เขียนโดยบอท
- `reactionNotifications: "off"` จะปิดใช้งาน reaction system events
- การลบ reaction จะไม่ถูกสังเคราะห์เป็น system events เพราะ Matrix แสดงสิ่งเหล่านั้นเป็น redactions ไม่ใช่การลบ `m.reaction` แบบสแตนด์อโลน

## บริบทประวัติ

- `channels.matrix.historyLimit` ควบคุมจำนวนข้อความล่าสุดในห้องที่จะถูกรวมเป็น `InboundHistory` เมื่อข้อความในห้อง Matrix เป็นตัวกระตุ้นเอเจนต์ โดยจะ fallback ไปใช้ `messages.groupChat.historyLimit`; หากทั้งสองค่าไม่ได้ตั้งไว้ ค่าเริ่มต้นที่มีผลจริงคือ `0` ตั้งค่าเป็น `0` เพื่อปิดใช้งาน
- ประวัติห้อง Matrix เป็นแบบเฉพาะห้องเท่านั้น ส่วน DM ยังคงใช้ประวัติเซสชันตามปกติ
- ประวัติห้อง Matrix เป็นแบบ pending-only: OpenClaw จะบัฟเฟอร์ข้อความในห้องที่ยังไม่ได้กระตุ้นให้เกิดการตอบกลับ จากนั้นจึง snapshot หน้าต่างดังกล่าวเมื่อมีการ mention หรือทริกเกอร์อื่นเข้ามา
- ข้อความทริกเกอร์ปัจจุบันจะไม่ถูกรวมอยู่ใน `InboundHistory`; ข้อความนั้นจะยังคงอยู่ในเนื้อหาขาเข้าหลักของเทิร์นนั้น
- การลองใหม่ของ Matrix event เดิมจะนำ history snapshot เดิมกลับมาใช้ซ้ำ แทนที่จะเลื่อนไปยังข้อความในห้องที่ใหม่กว่า

## การมองเห็นบริบท

Matrix รองรับตัวควบคุม `contextVisibility` แบบใช้ร่วมกันสำหรับบริบทเสริมห้อง เช่น ข้อความตอบกลับที่ดึงมา, thread roots และ pending history

- `contextVisibility: "all"` เป็นค่าเริ่มต้น บริบทเสริมจะถูกรักษาไว้ตามที่ได้รับมา
- `contextVisibility: "allowlist"` จะกรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่ได้รับอนุญาตจากการตรวจสอบ room/user allowlist ที่กำลังใช้งาน
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บ quoted reply แบบชัดเจนไว้หนึ่งรายการ

การตั้งค่านี้มีผลต่อการมองเห็นของบริบทเสริม ไม่ใช่ว่าข้อความขาเข้าเองจะสามารถกระตุ้นการตอบกลับได้หรือไม่
การอนุญาตให้ทริกเกอร์ยังคงมาจากการตั้งค่า `groupPolicy`, `groups`, `groupAllowFrom` และนโยบาย DM

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
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

ดู [Groups](/th/channels/groups) สำหรับพฤติกรรมการบังคับ mention และ allowlist

ตัวอย่าง pairing สำหรับ Matrix DM:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

หากผู้ใช้ Matrix ที่ยังไม่ได้รับอนุมัติส่งข้อความหาคุณซ้ำก่อนการอนุมัติ OpenClaw จะนำ pending pairing code เดิมกลับมาใช้ซ้ำ และอาจส่งข้อความเตือนอีกครั้งหลังช่วงคูลดาวน์สั้น ๆ แทนการสร้างโค้ดใหม่

ดู [Pairing](/th/channels/pairing) สำหรับโฟลว์ DM pairing แบบใช้ร่วมกันและโครงสร้างการจัดเก็บ

## การซ่อมแซมห้อง direct

หากสถานะ direct-message หลุดการซิงก์ OpenClaw อาจลงเอยด้วย mapping `m.direct` ที่ล้าสมัยซึ่งชี้ไปยังห้องเดี่ยวเก่าแทน DM ที่ใช้งานจริง ตรวจสอบ mapping ปัจจุบันสำหรับคู่สนทนาด้วยคำสั่ง:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

ซ่อมแซมด้วย:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

โฟลว์การซ่อมแซม:

- ให้ความสำคัญกับ DM แบบ 1:1 ที่เข้มงวดซึ่งถูกแมปไว้แล้วใน `m.direct`
- fallback ไปยัง DM แบบ 1:1 ที่เข้าร่วมอยู่ในปัจจุบันกับผู้ใช้นั้น
- สร้างห้อง direct ใหม่และเขียน `m.direct` ใหม่ หากไม่มี DM ที่สมบูรณ์ใช้งานได้

โฟลว์การซ่อมแซมจะไม่ลบห้องเก่าโดยอัตโนมัติ โดยจะเพียงเลือก DM ที่ใช้งานได้และอัปเดต mapping เพื่อให้การส่ง Matrix ใหม่, ประกาศการยืนยันตัวตน และโฟลว์ direct-message อื่น ๆ กลับไปยังห้องที่ถูกต้องอีกครั้ง

## การอนุมัติ exec

Matrix สามารถทำหน้าที่เป็นไคลเอนต์อนุมัติแบบเนทีฟสำหรับบัญชี Matrix ได้ โดยตัวควบคุมการกำหนดเส้นทาง DM/แชนเนลแบบเนทีฟยังคงอยู่ภายใต้ config การอนุมัติ exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (ไม่บังคับ; fallback ไปที่ `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

ผู้อนุมัติต้องเป็น Matrix user IDs เช่น `@owner:example.org` Matrix จะเปิดใช้การอนุมัติแบบเนทีฟโดยอัตโนมัติเมื่อ `enabled` ไม่ได้ตั้งค่าไว้หรือเป็น `"auto"` และสามารถ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งราย การอนุมัติ exec จะใช้ `execApprovals.approvers` ก่อน และสามารถ fallback ไปยัง `channels.matrix.dm.allowFrom` ได้ ส่วนการอนุมัติ Plugin จะอนุญาตผ่าน `channels.matrix.dm.allowFrom` ตั้งค่า `enabled: false` เพื่อปิดใช้งาน Matrix ในฐานะไคลเอนต์อนุมัติแบบเนทีฟอย่างชัดเจน มิฉะนั้นคำขออนุมัติจะ fallback ไปยังเส้นทางการอนุมัติอื่นที่กำหนดไว้หรือ approval fallback policy

การกำหนดเส้นทางแบบเนทีฟของ Matrix รองรับการอนุมัติทั้งสองประเภท:

- `channels.matrix.execApprovals.*` ควบคุมโหมด fanout แบบ DM/แชนเนลเนทีฟสำหรับพรอมต์อนุมัติของ Matrix
- การอนุมัติ exec ใช้ชุดผู้อนุมัติ exec จาก `execApprovals.approvers` หรือ `channels.matrix.dm.allowFrom`
- การอนุมัติ Plugin ใช้ Matrix DM allowlist จาก `channels.matrix.dm.allowFrom`
- ทางลัด reaction ของ Matrix และการอัปเดตข้อความจะใช้กับทั้งการอนุมัติ exec และ Plugin

กฎการส่งมอบ:

- `target: "dm"` จะส่งพรอมต์อนุมัติไปยัง DM ของผู้อนุมัติ
- `target: "channel"` จะส่งพรอมต์กลับไปยังห้อง Matrix หรือ DM ต้นทาง
- `target: "both"` จะส่งทั้งไปยัง DM ของผู้อนุมัติและห้อง Matrix หรือ DM ต้นทาง

พรอมต์อนุมัติของ Matrix จะตั้งค่า reaction shortcuts บนข้อความอนุมัติหลัก:

- `✅` = อนุญาตครั้งเดียว
- `❌` = ปฏิเสธ
- `♾️` = อนุญาตเสมอเมื่อการตัดสินใจนั้นได้รับอนุญาตตามนโยบาย exec ที่มีผล

ผู้อนุมัติสามารถใส่ reaction บนข้อความนั้น หรือใช้ slash commands สำรอง: `/approve <id> allow-once`, `/approve <id> allow-always` หรือ `/approve <id> deny`

เฉพาะผู้อนุมัติที่ resolve ได้เท่านั้นที่สามารถอนุมัติหรือปฏิเสธได้ สำหรับการอนุมัติ exec การส่งผ่านแชนเนลจะรวมข้อความคำสั่งไว้ด้วย ดังนั้นควรเปิดใช้ `channel` หรือ `both` เฉพาะในห้องที่เชื่อถือได้

override รายบัญชี:

- `channels.matrix.accounts.<account>.execApprovals`

เอกสารที่เกี่ยวข้อง: [Exec approvals](/th/tools/exec-approvals)

## Slash commands

slash commands ของ Matrix (เช่น `/new`, `/reset`, `/model`) ใช้งานได้โดยตรงใน DM ในห้อง OpenClaw ยังรู้จัก slash commands ที่มี mention ของบอท Matrix เองนำหน้าอยู่ด้วย ดังนั้น `@bot:server /new` จะกระตุ้นเส้นทางคำสั่งโดยไม่ต้องใช้ mention regex แบบกำหนดเอง วิธีนี้ช่วยให้บอทยังคงตอบสนองต่อโพสต์แบบห้องในลักษณะ `@mention /command` ที่ Element และไคลเอนต์ลักษณะคล้ายกันส่งออกมา เมื่อผู้ใช้ tab-complete ชื่อบอทก่อนพิมพ์คำสั่ง

กฎการอนุญาตยังคงมีผล: ผู้ส่งคำสั่งต้องผ่านนโยบาย allowlist/owner ของ DM หรือห้องเช่นเดียวกับข้อความปกติ

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

ค่า `channels.matrix` ระดับบนสุดทำหน้าที่เป็นค่าเริ่มต้นสำหรับบัญชีที่มีชื่อ เว้นแต่บัญชีนั้นจะ override เอง
คุณสามารถกำหนดขอบเขตรายการห้องที่สืบทอดมาให้กับบัญชี Matrix เดียวได้ด้วย `groups.<room>.account`
รายการที่ไม่มี `account` จะยังคงถูกใช้ร่วมกันในทุกบัญชี Matrix และรายการที่มี `account: "default"` ก็ยังใช้งานได้เมื่อบัญชีค่าเริ่มต้นถูกกำหนดไว้โดยตรงที่ `channels.matrix.*` ระดับบนสุด
ค่าเริ่มต้นร่วมด้านการยืนยันตัวตนแบบบางส่วนจะไม่สร้างบัญชีค่าเริ่มต้นแบบโดยนัยแยกต่างหากขึ้นมาเอง OpenClaw จะสร้างบัญชี `default` ระดับบนสุดขึ้นมาเฉพาะเมื่อค่าเริ่มต้นนั้นมีข้อมูลยืนยันตัวตนใหม่ครบ (`homeserver` พร้อม `accessToken` หรือ `homeserver` พร้อม `userId` และ `password`); ส่วนบัญชีที่มีชื่อยังคงถูกค้นพบได้จาก `homeserver` พร้อม `userId` เมื่อ credentials ที่แคชไว้ตอบสนองการยืนยันตัวตนในภายหลัง
หาก Matrix มีบัญชีที่มีชื่ออยู่แล้วเพียงหนึ่งบัญชี หรือ `defaultAccount` ชี้ไปยังคีย์บัญชีที่มีชื่ออยู่แล้ว การยกระดับจากบัญชีเดียวไปหลายบัญชีสำหรับการซ่อมแซม/ตั้งค่าจะคงบัญชีนั้นไว้แทนการสร้างรายการ `accounts.default` ใหม่ มีเพียงคีย์ Matrix auth/bootstrap เท่านั้นที่จะถูกย้ายเข้าไปในบัญชีที่ถูกยกระดับนั้น; คีย์นโยบายการส่งมอบแบบใช้ร่วมกันจะยังคงอยู่ที่ระดับบนสุด
ตั้งค่า `defaultAccount` เมื่อคุณต้องการให้ OpenClaw เลือกใช้บัญชี Matrix ที่มีชื่อบัญชีหนึ่งเป็นค่าเริ่มต้นสำหรับการกำหนดเส้นทางแบบโดยนัย, การ probe และการดำเนินการ CLI
หากมีการกำหนดค่าหลายบัญชี Matrix และมี account id หนึ่งเป็น `default`, OpenClaw จะใช้บัญชีนั้นโดยนัยแม้ว่า `defaultAccount` จะไม่ได้ตั้งค่าไว้ก็ตาม
หากคุณกำหนดค่าหลายบัญชีที่มีชื่อ ให้ตั้งค่า `defaultAccount` หรือส่ง `--account <id>` สำหรับคำสั่ง CLI ที่อาศัยการเลือกบัญชีแบบโดยนัย
ส่ง `--account <id>` ไปยัง `openclaw matrix verify ...` และ `openclaw matrix devices ...` เมื่อต้องการ override การเลือกแบบโดยนัยนั้นสำหรับคำสั่งเดียว

ดู [Configuration reference](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบหลายบัญชีแบบใช้ร่วมกัน

## homeserver แบบ private/LAN

ตามค่าเริ่มต้น OpenClaw จะบล็อก Matrix homeservers แบบ private/internal เพื่อป้องกัน SSRF เว้นแต่คุณจะ
เลือกเปิดใช้งานอย่างชัดเจนเป็นรายบัญชี

หาก homeserver ของคุณทำงานบน localhost, IP ใน LAN/Tailscale หรือ hostname ภายใน ให้เปิดใช้
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

ตัวอย่างการตั้งค่าผ่าน CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

การเลือกเปิดใช้งานนี้อนุญาตเฉพาะเป้าหมาย private/internal ที่เชื่อถือได้เท่านั้น ส่วน public homeservers แบบ cleartext เช่น
`http://matrix.example.org:8008` ยังคงถูกบล็อก แนะนำให้ใช้ `https://` ทุกครั้งที่เป็นไปได้

## พร็อกซีทราฟฟิก Matrix

หากการติดตั้ง Matrix ของคุณต้องใช้พร็อกซี HTTP(S) ขาออกแบบชัดเจน ให้ตั้งค่า `channels.matrix.proxy`:

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

บัญชีที่มีชื่อสามารถ override ค่าเริ่มต้นระดับบนสุดได้ด้วย `channels.matrix.accounts.<id>.proxy`
OpenClaw ใช้การตั้งค่าพร็อกซีเดียวกันทั้งกับทราฟฟิก Matrix ระหว่างรันไทม์และการ probe สถานะบัญชี

## การ resolve เป้าหมาย

Matrix ยอมรับรูปแบบเป้าหมายเหล่านี้ในทุกตำแหน่งที่ OpenClaw ขอให้คุณระบุเป้าหมายห้องหรือผู้ใช้:

- ผู้ใช้: `@user:server`, `user:@user:server` หรือ `matrix:user:@user:server`
- ห้อง: `!room:server`, `room:!room:server` หรือ `matrix:room:!room:server`
- aliases: `#alias:server`, `channel:#alias:server` หรือ `matrix:channel:#alias:server`

การค้นหาไดเรกทอรีแบบสดจะใช้บัญชี Matrix ที่ล็อกอินอยู่:

- การค้นหาผู้ใช้จะ query ไปยัง Matrix user directory บน homeserver นั้น
- การค้นหาห้องจะยอมรับ room IDs และ aliases แบบชัดเจนโดยตรง จากนั้นจึง fallback ไปค้นหาชื่อห้องที่เข้าร่วมอยู่สำหรับบัญชีนั้น
- การค้นหาชื่อห้องที่เข้าร่วมอยู่เป็นแบบ best-effort หากชื่อห้องไม่สามารถ resolve เป็น ID หรือ alias ได้ ระบบจะเพิกเฉยชื่อดังกล่าวในการ resolve allowlist ระหว่างรันไทม์

## เอกสารอ้างอิงการกำหนดค่า

- `enabled`: เปิดหรือปิดใช้งานแชนเนล
- `name`: ป้ายกำกับเพิ่มเติมสำหรับบัญชี
- `defaultAccount`: account ID ที่ต้องการใช้เป็นค่าเริ่มต้นเมื่อมีการกำหนดค่าหลายบัญชี Matrix
- `homeserver`: URL ของ homeserver เช่น `https://matrix.example.org`
- `network.dangerouslyAllowPrivateNetwork`: อนุญาตให้บัญชี Matrix นี้เชื่อมต่อกับ homeservers แบบ private/internal เปิดใช้งานตัวเลือกนี้เมื่อ homeserver resolve ไปยัง `localhost`, IP ใน LAN/Tailscale หรือโฮสต์ภายใน เช่น `matrix-synapse`
- `proxy`: URL ของพร็อกซี HTTP(S) สำหรับทราฟฟิก Matrix (ไม่บังคับ) บัญชีที่มีชื่อสามารถ override ค่าเริ่มต้นระดับบนสุดด้วย `proxy` ของตนเองได้
- `userId`: Matrix user ID แบบเต็ม เช่น `@bot:example.org`
- `accessToken`: access token สำหรับการยืนยันตัวตนแบบใช้ token รองรับทั้งค่า plaintext และค่า SecretRef สำหรับ `channels.matrix.accessToken` และ `channels.matrix.accounts.<id>.accessToken` ผ่าน providers แบบ env/file/exec ดู [Secrets Management](/th/gateway/secrets)
- `password`: password สำหรับการล็อกอินแบบใช้ password รองรับทั้งค่า plaintext และค่า SecretRef
- `deviceId`: Matrix device ID แบบระบุชัดเจน
- `deviceName`: ชื่อแสดงอุปกรณ์สำหรับการล็อกอินแบบใช้ password
- `avatarUrl`: URL รูปประจำตัวของตัวเองที่จัดเก็บไว้สำหรับการซิงก์โปรไฟล์และการอัปเดต `profile set`
- `initialSyncLimit`: จำนวนสูงสุดของ events ที่ดึงระหว่าง startup sync
- `encryption`: เปิดใช้ E2EE
- `allowlistOnly`: เมื่อเป็น `true` จะอัปเกรดนโยบายห้อง `open` เป็น `allowlist` และบังคับให้นโยบาย DM ที่ใช้งานอยู่ทั้งหมด ยกเว้น `disabled` (รวมถึง `pairing` และ `open`) กลายเป็น `allowlist` ไม่มีผลกับนโยบาย `disabled`
- `allowBots`: อนุญาตข้อความจากบัญชี Matrix ของ OpenClaw อื่นที่ถูกกำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `groupPolicy`: `open`, `allowlist` หรือ `disabled`
- `contextVisibility`: โหมดการมองเห็นบริบทเสริมของห้อง (`all`, `allowlist`, `allowlist_quote`)
- `groupAllowFrom`: allowlist ของ user IDs สำหรับทราฟฟิกในห้อง Matrix user ID แบบเต็มปลอดภัยที่สุด; รายการที่ตรงกันแบบ exact ในไดเรกทอรีจะถูก resolve ตอนเริ่มต้นและเมื่อ allowlist เปลี่ยนขณะตัวมอนิเตอร์กำลังทำงาน ชื่อที่ resolve ไม่ได้จะถูกเพิกเฉย
- `historyLimit`: จำนวนข้อความห้องสูงสุดที่จะรวมเป็นบริบทประวัติกลุ่ม โดยจะ fallback ไปใช้ `messages.groupChat.historyLimit`; หากทั้งสองค่าไม่ได้ตั้งไว้ ค่าเริ่มต้นที่มีผลจริงคือ `0` ตั้งค่าเป็น `0` เพื่อปิดใช้งาน
- `replyToMode`: `off`, `first`, `all` หรือ `batched`
- `markdown`: การกำหนดค่าการเรนเดอร์ Markdown สำหรับข้อความ Matrix ขาออก (ไม่บังคับ)
- `streaming`: `off` (ค่าเริ่มต้น), `"partial"`, `"quiet"`, `true` หรือ `false` ค่า `"partial"` และ `true` จะเปิดใช้การอัปเดตร่างแบบพรีวิวก่อนด้วยข้อความ Matrix ปกติ ค่า `"quiet"` ใช้ประกาศพรีวิวแบบไม่แจ้งเตือนสำหรับการตั้งค่า push-rule แบบ self-hosted ค่า `false` เทียบเท่ากับ `"off"`
- `blockStreaming`: `true` จะเปิดใช้ข้อความความคืบหน้าแยกสำหรับบล็อก assistant ที่เสร็จสมบูรณ์ ขณะการสตรีมพรีวิวฉบับร่างกำลังทำงาน
- `threadReplies`: `off`, `inbound` หรือ `always`
- `threadBindings`: การ override ระดับแชนเนลสำหรับการกำหนดเส้นทางเซสชันและวงจรชีวิตที่ผูกกับเธรด
- `startupVerification`: โหมดคำขอ self-verification อัตโนมัติเมื่อเริ่มต้นระบบ (`if-unverified`, `off`)
- `startupVerificationCooldownHours`: ช่วงคูลดาวน์ก่อนลองส่งคำขอ startup verification อัตโนมัติซ้ำ
- `textChunkLimit`: ขนาด chunk ของข้อความขาออกเป็นจำนวนอักขระ (ใช้เมื่อ `chunkMode` เป็น `length`)
- `chunkMode`: `length` แบ่งข้อความตามจำนวนอักขระ; `newline` แบ่งที่ขอบเขตของบรรทัด
- `responsePrefix`: สตริงเพิ่มเติมที่นำหน้าการตอบกลับขาออกทั้งหมดสำหรับแชนเนลนี้
- `ackReaction`: การ override ack reaction สำหรับแชนเนล/บัญชีนี้ (ไม่บังคับ)
- `ackReactionScope`: การ override ขอบเขต ack reaction (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`)
- `reactionNotifications`: โหมดการแจ้งเตือน reaction ขาเข้า (`own`, `off`)
- `mediaMaxMb`: เพดานขนาด media เป็น MB สำหรับการส่งขาออกและการประมวลผล media ขาเข้า
- `autoJoin`: นโยบายเข้าร่วมอัตโนมัติจากคำเชิญ (`always`, `allowlist`, `off`) ค่าเริ่มต้น: `off` ใช้กับคำเชิญ Matrix ทั้งหมด รวมถึงคำเชิญแบบ DM
- `autoJoinAllowlist`: ห้อง/aliases ที่อนุญาตเมื่อ `autoJoin` เป็น `allowlist` รายการ alias จะถูก resolve เป็น room IDs ระหว่างการจัดการคำเชิญ; OpenClaw จะไม่เชื่อถือสถานะ alias ที่ห้องที่เชิญอ้างไว้
- `dm`: บล็อกนโยบาย DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`)
- `dm.policy`: ควบคุมการเข้าถึง DM หลังจาก OpenClaw เข้าร่วมห้องแล้วและจัดประเภทห้องเป็น DM แล้ว โดยไม่เปลี่ยนว่าคำเชิญจะถูกเข้าร่วมอัตโนมัติหรือไม่
- `dm.allowFrom`: allowlist ของ user IDs สำหรับทราฟฟิก DM Matrix user ID แบบเต็มปลอดภัยที่สุด; รายการที่ตรงกันแบบ exact ในไดเรกทอรีจะถูก resolve ตอนเริ่มต้นและเมื่อ allowlist เปลี่ยนขณะตัวมอนิเตอร์กำลังทำงาน ชื่อที่ resolve ไม่ได้จะถูกเพิกเฉย
- `dm.sessionScope`: `per-user` (ค่าเริ่มต้น) หรือ `per-room` ใช้ `per-room` เมื่อคุณต้องการให้แต่ละห้อง DM ของ Matrix แยกบริบทออกจากกัน แม้คู่สนทนาจะเป็นคนเดิมก็ตาม
- `dm.threadReplies`: การ override นโยบายเธรดสำหรับ DM เท่านั้น (`off`, `inbound`, `always`) โดยจะ override การตั้งค่า `threadReplies` ระดับบนสุด ทั้งสำหรับตำแหน่งการตอบกลับและการแยกเซสชันใน DM
- `execApprovals`: การส่งการอนุมัติ exec แบบเนทีฟของ Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`)
- `execApprovals.approvers`: Matrix user IDs ที่ได้รับอนุญาตให้อนุมัติคำขอ exec ไม่บังคับเมื่อ `dm.allowFrom` ระบุผู้อนุมัติไว้แล้ว
- `execApprovals.target`: `dm | channel | both` (ค่าเริ่มต้น: `dm`)
- `accounts`: การ override รายบัญชีที่มีชื่อ ค่า `channels.matrix` ระดับบนสุดจะทำหน้าที่เป็นค่าเริ่มต้นสำหรับรายการเหล่านี้
- `groups`: แมปนโยบายรายห้อง แนะนำให้ใช้ room IDs หรือ aliases; ชื่อห้องที่ resolve ไม่ได้จะถูกเพิกเฉยระหว่างรันไทม์ เซสชัน/อัตลักษณ์กลุ่มจะใช้ room ID ที่เสถียรหลังการ resolve
- `groups.<room>.account`: จำกัดรายการห้องที่สืบทอดมารายการหนึ่งให้ใช้กับบัญชี Matrix เฉพาะบัญชีในการตั้งค่าแบบหลายบัญชี
- `groups.<room>.allowBots`: การ override ระดับห้องสำหรับผู้ส่งที่เป็นบอทที่ถูกกำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `groups.<room>.users`: allowlist ผู้ส่งรายห้อง
- `groups.<room>.tools`: การ override การอนุญาต/ปฏิเสธ tools รายห้อง
- `groups.<room>.autoReply`: การ override ระดับห้องสำหรับการบังคับ mention ค่า `true` จะปิดข้อกำหนดการ mention สำหรับห้องนั้น; ค่า `false` จะบังคับเปิดกลับมา
- `groups.<room>.skills`: ตัวกรอง Skills ระดับห้อง (ไม่บังคับ)
- `groups.<room>.systemPrompt`: snippet ของ system prompt ระดับห้อง (ไม่บังคับ)
- `rooms`: alias แบบเดิมของ `groups`
- `actions`: การควบคุมการใช้ tools รายแอ็กชัน (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`)

## ที่เกี่ยวข้อง

- [Channels Overview](/th/channels) — ภาพรวมของแชนเนลที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์ pairing
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการบังคับ mention
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้ระบบแข็งแรงขึ้น
