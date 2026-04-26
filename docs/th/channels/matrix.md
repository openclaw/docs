---
read_when:
    - การตั้งค่า Matrix ใน OpenClaw
    - การกำหนดค่า Matrix E2EE และการยืนยันตัวตน
summary: สถานะการรองรับ Matrix การตั้งค่า และตัวอย่างการกำหนดค่า
title: Matrix
x-i18n:
    generated_at: "2026-04-26T11:23:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1850d51aba7279a3d495c346809b4df26d7da4b7611c5a8c9ab70f9a2b3c827d
    source_path: channels/matrix.md
    workflow: 15
---

Matrix เป็น channel plugin ที่มาพร้อมกับ OpenClaw
ใช้ `matrix-js-sdk` อย่างเป็นทางการ และรองรับ DM, rooms, threads, media, reactions, polls, location และ E2EE

## Bundled plugin

Matrix มาพร้อมเป็น bundled plugin ใน OpenClaw รุ่นปัจจุบัน ดังนั้น
โดยปกติแล้ว build แบบแพ็กเกจไม่จำเป็นต้องติดตั้งแยกต่างหาก

หากคุณใช้ build รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Matrix มา ให้ติดตั้ง
ด้วยตนเอง:

ติดตั้งจาก npm:

```bash
openclaw plugins install @openclaw/matrix
```

ติดตั้งจาก local checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

ดู [Plugins](/th/tools/plugin) สำหรับพฤติกรรมของ plugin และกฎการติดตั้ง

## การตั้งค่า

1. ตรวจสอบให้แน่ใจว่ามี Matrix plugin พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันรวมมาให้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้ด้วยตนเองด้วยคำสั่งด้านบน
2. สร้างบัญชี Matrix บน homeserver ของคุณ
3. กำหนดค่า `channels.matrix` โดยใช้วิธีใดวิธีหนึ่งต่อไปนี้:
   - `homeserver` + `accessToken` หรือ
   - `homeserver` + `userId` + `password`
4. รีสตาร์ต gateway
5. เริ่ม DM กับบอทหรือเชิญบอทเข้าห้อง
   - คำเชิญ Matrix ใหม่จะใช้งานได้ก็ต่อเมื่อ `channels.matrix.autoJoin` อนุญาต

เส้นทางการตั้งค่าแบบโต้ตอบ:

```bash
openclaw channels add
openclaw configure --section channels
```

ตัวช่วยตั้งค่า Matrix จะถามข้อมูลต่อไปนี้:

- URL ของ homeserver
- วิธีการยืนยันตัวตน: access token หรือ password
- user ID (เฉพาะการยืนยันตัวตนด้วย password)
- ชื่ออุปกรณ์แบบเลือกได้
- จะเปิดใช้ E2EE หรือไม่
- จะกำหนดค่าการเข้าถึงห้องและการเข้าร่วมคำเชิญอัตโนมัติหรือไม่

พฤติกรรมหลักของตัวช่วยตั้งค่า:

- หากมีตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตนของ Matrix อยู่แล้ว และบัญชีนั้นยังไม่ได้บันทึกข้อมูลยืนยันตัวตนไว้ในคอนฟิก ตัวช่วยตั้งค่าจะเสนอทางลัดแบบ env เพื่อเก็บข้อมูลยืนยันตัวตนไว้ในตัวแปรสภาพแวดล้อม
- ชื่อบัญชีจะถูกทำให้เป็นรูปแบบมาตรฐานตาม account ID เช่น `Ops Bot` จะกลายเป็น `ops-bot`
- รายการ allowlist ของ DM สามารถรับ `@user:server` ได้โดยตรง ส่วน display name จะใช้ได้ก็ต่อเมื่อการค้นหาไดเรกทอรีแบบสดพบผลลัพธ์ที่ตรงกันเพียงรายการเดียว
- รายการ allowlist ของห้องสามารถรับ room ID และ alias ได้โดยตรง แนะนำให้ใช้ `!room:server` หรือ `#alias:server`; ชื่อที่ไม่สามารถ resolve ได้จะถูกเพิกเฉยใน runtime ระหว่างการ resolve allowlist
- ในโหมด allowlist สำหรับการเข้าร่วมคำเชิญอัตโนมัติ ให้ใช้เฉพาะเป้าหมายคำเชิญที่เสถียร: `!roomId:server`, `#alias:server` หรือ `*` เท่านั้น ระบบจะปฏิเสธชื่อห้องแบบข้อความธรรมดา
- หากต้องการ resolve ชื่อห้องก่อนบันทึก ให้ใช้ `openclaw channels resolve --channel matrix "Project Room"`

<Warning>
`channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off`

หากคุณปล่อยไว้โดยไม่ตั้งค่า บอทจะไม่เข้าร่วมห้องที่ได้รับเชิญหรือคำเชิญแบบ DM ใหม่ ดังนั้นบอทจะไม่ปรากฏในกลุ่มใหม่หรือ DM ที่ถูกเชิญ เว้นแต่คุณจะเข้าร่วมด้วยตนเองก่อน

ตั้งค่า `autoJoin: "allowlist"` ร่วมกับ `autoJoinAllowlist` เพื่อจำกัดว่ารับคำเชิญใดบ้าง หรือกำหนด `autoJoin: "always"` หากคุณต้องการให้เข้าร่วมทุกคำเชิญ

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

การตั้งค่าแบบใช้ password (ระบบจะ cache token หลังจากเข้าสู่ระบบ):

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

Matrix จะเก็บข้อมูลยืนยันตัวตนที่ cache ไว้ใน `~/.openclaw/credentials/matrix/`
บัญชีค่าเริ่มต้นจะใช้ `credentials.json`; บัญชีที่มีชื่อจะใช้ `credentials-<account>.json`
เมื่อมีข้อมูลยืนยันตัวตนที่ cache ไว้ในนั้น OpenClaw จะถือว่า Matrix ถูกกำหนดค่าแล้วสำหรับการตั้งค่า, doctor และการค้นพบสถานะ channel แม้ว่าข้อมูลยืนยันตัวตนปัจจุบันจะไม่ได้ตั้งไว้ในคอนฟิกโดยตรงก็ตาม

ตัวแปรสภาพแวดล้อมที่เทียบเท่ากัน (ใช้เมื่อไม่ได้ตั้งค่าคีย์ในคอนฟิก):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

สำหรับบัญชีที่ไม่ใช่ค่าเริ่มต้น ให้ใช้ตัวแปรสภาพแวดล้อมแบบระบุขอบเขตบัญชี:

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

Matrix จะ escape เครื่องหมายวรรคตอนใน account ID เพื่อหลีกเลี่ยงการชนกันของตัวแปรสภาพแวดล้อมแบบระบุขอบเขต
ตัวอย่างเช่น `-` จะกลายเป็น `_X2D_` ดังนั้น `ops-prod` จะจับคู่กับ `MATRIX_OPS_X2D_PROD_*`

ตัวช่วยตั้งค่าแบบโต้ตอบจะเสนอทางลัด env-var ก็ต่อเมื่อมีตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตนอยู่แล้ว และบัญชีที่เลือกยังไม่ได้บันทึกการยืนยันตัวตนของ Matrix ไว้ในคอนฟิก

ไม่สามารถตั้งค่า `MATRIX_HOMESERVER` จาก `.env` ของ workspace ได้; ดู [ไฟล์ `.env` ของ workspace](/th/gateway/security)

## ตัวอย่างการกำหนดค่า

นี่คือตัวอย่างคอนฟิกพื้นฐานที่ใช้งานได้จริง พร้อม DM pairing, room allowlist และเปิดใช้ E2EE:

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
จำแนกได้อย่างน่าเชื่อถือว่าห้องที่ถูกเชิญเป็น DM หรือกลุ่มในเวลาที่เชิญ ดังนั้นคำเชิญทั้งหมดจะผ่าน `autoJoin`
ก่อนเสมอ ส่วน `dm.policy` จะมีผลหลังจากบอทเข้าร่วมห้องแล้วและห้องนั้นถูกจำแนกว่าเป็น DM

## Streaming previews

การสตรีมคำตอบของ Matrix เป็นฟีเจอร์ที่ต้องเปิดใช้เอง

ตั้งค่า `channels.matrix.streaming` เป็น `"partial"` เมื่อคุณต้องการให้ OpenClaw ส่งคำตอบพรีวิวสดหนึ่งข้อความ
แก้ไขพรีวิวนั้นในตำแหน่งเดิมขณะที่โมเดลกำลังสร้างข้อความ แล้วจึงสรุปผลขั้นสุดท้ายเมื่อ
คำตอบเสร็จสมบูรณ์:

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
- `streaming: "partial"` จะสร้างข้อความพรีวิวที่แก้ไขได้หนึ่งข้อความสำหรับ assistant block ปัจจุบันโดยใช้ข้อความ Matrix ปกติ วิธีนี้จะคงพฤติกรรมการแจ้งเตือนแบบ preview-first แบบเดิมของ Matrix เอาไว้ ดังนั้นไคลเอนต์มาตรฐานอาจแจ้งเตือนจากข้อความพรีวิวที่สตรีมครั้งแรกแทนที่จะเป็น block ที่เสร็จสมบูรณ์
- `streaming: "quiet"` จะสร้างข้อความ notice พรีวิวแบบเงียบที่แก้ไขได้หนึ่งข้อความสำหรับ assistant block ปัจจุบัน ใช้ตัวเลือกนี้ก็ต่อเมื่อคุณกำหนดค่า push rules ของผู้รับสำหรับการแก้ไขพรีวิวที่สรุปผลขั้นสุดท้ายแล้วด้วย
- `blockStreaming: true` เปิดใช้ข้อความความคืบหน้า Matrix แบบแยกต่างหาก เมื่อเปิด preview streaming อยู่ Matrix จะคงฉบับร่างสดไว้สำหรับ block ปัจจุบัน และเก็บ block ที่เสร็จแล้วเป็นข้อความแยกต่างหาก
- เมื่อเปิด preview streaming และ `blockStreaming` ปิดอยู่ Matrix จะแก้ไขฉบับร่างสดในตำแหน่งเดิม และสรุปผล event เดิมนั้นเมื่อ block หรือ turn เสร็จสิ้น
- หากพรีวิวไม่สามารถใส่ใน Matrix event เดียวได้อีกต่อไป OpenClaw จะหยุด preview streaming และกลับไปใช้การส่งขั้นสุดท้ายแบบปกติ
- การตอบกลับด้วยสื่อยังคงส่งไฟล์แนบตามปกติ หากพรีวิวเก่าที่ค้างอยู่ไม่สามารถนำกลับมาใช้อย่างปลอดภัยได้อีก OpenClaw จะ redact พรีวิวนั้นก่อนส่งคำตอบสื่อขั้นสุดท้าย
- การแก้ไขพรีวิวทำให้มีการเรียก Matrix API เพิ่มขึ้น ปล่อยให้ปิด streaming ไว้หากคุณต้องการพฤติกรรมด้าน rate limit ที่ระมัดระวังที่สุด

`blockStreaming` ไม่ได้เปิดใช้ draft previews ด้วยตัวเอง
ให้ใช้ `streaming: "partial"` หรือ `streaming: "quiet"` สำหรับการแก้ไขพรีวิวก่อน จากนั้นจึงเพิ่ม `blockStreaming: true` เฉพาะเมื่อคุณต้องการให้ assistant blocks ที่เสร็จแล้วคงแสดงเป็นข้อความความคืบหน้าแยกต่างหากด้วย

หากคุณต้องการการแจ้งเตือน Matrix มาตรฐานโดยไม่ใช้ push rules แบบกำหนดเอง ให้ใช้ `streaming: "partial"` สำหรับพฤติกรรม preview-first หรือปล่อย `streaming` ไว้เป็น off สำหรับการส่งเฉพาะผลลัพธ์สุดท้าย เมื่อ `streaming: "off"`:

- `blockStreaming: true` จะส่งแต่ละ block ที่เสร็จแล้วเป็นข้อความ Matrix ปกติที่แจ้งเตือนได้
- `blockStreaming: false` จะส่งเฉพาะคำตอบสุดท้ายที่เสร็จสมบูรณ์เป็นข้อความ Matrix ปกติที่แจ้งเตือนได้

### Push rules แบบ self-hosted ของ Matrix สำหรับพรีวิวที่สรุปผลขั้นสุดท้ายแบบเงียบ

การสตรีมแบบเงียบ (`streaming: "quiet"`) จะแจ้งเตือนผู้รับก็ต่อเมื่อ block หรือ turn ถูกสรุปผลขั้นสุดท้ายแล้วเท่านั้น — push rule ระดับผู้ใช้ต้องตรงกับเครื่องหมายพรีวิวที่สรุปผลแล้ว ดู [Matrix push rules for quiet previews](/th/channels/matrix-push-rules) สำหรับการตั้งค่าแบบเต็ม (recipient token, การตรวจสอบ pusher, การติดตั้งกฎ และหมายเหตุเฉพาะแต่ละ homeserver)

## ห้องบอทคุยกับบอท

ตามค่าเริ่มต้น ข้อความ Matrix จากบัญชี OpenClaw Matrix อื่นที่กำหนดค่าไว้จะถูกเพิกเฉย

ใช้ `allowBots` เมื่อคุณตั้งใจให้มีการรับส่ง Matrix ระหว่างเอเจนต์:

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

- `allowBots: true` ยอมรับข้อความจากบัญชีบอท Matrix อื่นที่กำหนดค่าไว้ ในห้องและ DM ที่อนุญาต
- `allowBots: "mentions"` ยอมรับข้อความเหล่านั้นเฉพาะเมื่อมีการ mention บอทนี้อย่างชัดเจนในห้อง ส่วน DM ยังอนุญาตตามปกติ
- `groups.<room>.allowBots` จะแทนที่ค่าระดับบัญชีสำหรับห้องเดียว
- OpenClaw ยังคงเพิกเฉยข้อความจาก Matrix user ID เดียวกันเพื่อหลีกเลี่ยงลูปตอบตัวเอง
- Matrix ไม่ได้มี bot flag แบบเนทีฟสำหรับกรณีนี้; OpenClaw จะถือว่า "bot-authored" คือ "ส่งมาจากบัญชี Matrix อื่นที่กำหนดค่าไว้บน OpenClaw gateway นี้"

เมื่อเปิดใช้การรับส่งระหว่างบอทในห้องที่ใช้ร่วมกัน ให้ใช้ room allowlists แบบเข้มงวดและกำหนดให้มีการ mention

## การเข้ารหัสและการยืนยันตัวตน

ในห้องที่เข้ารหัส (E2EE) event รูปภาพขาออกจะใช้ `thumbnail_file` ดังนั้นภาพพรีวิวจะถูกเข้ารหัสพร้อมกับไฟล์แนบฉบับเต็ม ส่วนห้องที่ไม่เข้ารหัสจะยังคงใช้ `thumbnail_url` แบบธรรมดา ไม่ต้องกำหนดค่าเพิ่มเติม — plugin จะตรวจจับสถานะ E2EE โดยอัตโนมัติ

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

คำสั่งยืนยันตัวตน (ทั้งหมดรองรับ `--verbose` สำหรับการวินิจฉัย และ `--json` สำหรับผลลัพธ์แบบ machine-readable):

```bash
openclaw matrix verify status
```

สถานะรายละเอียดแบบ verbose (การวินิจฉัยแบบเต็ม):

```bash
openclaw matrix verify status --verbose
```

รวม recovery key ที่จัดเก็บไว้ไว้ในผลลัพธ์แบบ machine-readable:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Bootstrap สถานะ cross-signing และการยืนยันตัวตน:

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

`Signed by owner` ในผลลัพธ์แบบ verbose หรือ JSON มีไว้เพื่อการวินิจฉัยเท่านั้น OpenClaw ไม่ถือว่า
สถานะนั้นเพียงพอ เว้นแต่ `Cross-signing verified` จะเป็น `yes` ด้วย

คำสั่งนี้จะยังคงออกด้วยสถานะ non-zero หากความเชื่อถือของ Matrix identity อย่างสมบูรณ์ยังไม่ครบถ้วน
แม้ว่า recovery key จะสามารถปลดล็อกข้อมูล backup ได้ก็ตาม ในกรณีนั้น ให้ทำ
self-verification ให้เสร็จจาก Matrix client ตัวอื่น:

```bash
openclaw matrix verify self
```

ยอมรับคำขอใน Matrix client อื่น เปรียบเทียบอีโมจิ SAS หรือเลขทศนิยม
แล้วพิมพ์ `yes` เฉพาะเมื่อทั้งสองฝั่งตรงกัน คำสั่งจะรอจนกว่า Matrix จะรายงาน
`Cross-signing verified: yes` ก่อนจึงจะออกสำเร็จ

ใช้ `verify bootstrap --force-reset-cross-signing` เฉพาะเมื่อคุณตั้งใจ
ที่จะเปลี่ยน cross-signing identity ปัจจุบันเท่านั้น

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

หากยังไม่ได้โหลด backup key ลงดิสก์ ให้ส่ง Matrix recovery key:

```bash
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
```

โฟลว์ self-verification แบบโต้ตอบ:

```bash
openclaw matrix verify self
```

สำหรับคำขอยืนยันตัวตนระดับล่างหรือคำขอขาเข้า ให้ใช้:

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

ลบ backup ปัจจุบันบนเซิร์ฟเวอร์และสร้าง baseline ของ backup ใหม่ หาก
ไม่สามารถโหลด backup key ที่จัดเก็บไว้ได้อย่างสมบูรณ์ การรีเซ็ตนี้ยังสามารถสร้าง secret storage ใหม่ได้ด้วย
เพื่อให้การเริ่มระบบแบบ cold start ในอนาคตสามารถโหลด backup key ใหม่ได้:

```bash
openclaw matrix verify backup reset --yes
```

คำสั่ง `verify` ทั้งหมดจะสรุปผลแบบกระชับเป็นค่าเริ่มต้น (รวมถึงบันทึกภายในของ SDK แบบเงียบ) และจะแสดงการวินิจฉัยโดยละเอียดก็ต่อเมื่อใช้ `--verbose`
ใช้ `--json` สำหรับผลลัพธ์แบบ machine-readable แบบเต็มเมื่อทำสคริปต์

ในการตั้งค่าหลายบัญชี คำสั่ง Matrix CLI จะใช้บัญชี Matrix ค่าเริ่มต้นโดยปริยาย เว้นแต่คุณจะส่ง `--account <id>`
หากคุณกำหนดค่าหลายบัญชีที่มีชื่อ ให้ตั้งค่า `channels.matrix.defaultAccount` ก่อน ไม่เช่นนั้นการทำงาน CLI แบบปริยายเหล่านั้นจะหยุดและขอให้คุณเลือกบัญชีอย่างชัดเจน
ใช้ `--account` ทุกครั้งเมื่อคุณต้องการให้การยืนยันตัวตนหรือการดำเนินการกับอุปกรณ์เจาะจงไปยังบัญชีที่มีชื่อ:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

เมื่อปิดใช้งานการเข้ารหัสหรือไม่สามารถใช้งานได้สำหรับบัญชีที่มีชื่อ คำเตือนและข้อผิดพลาดในการยืนยันตัวตนของ Matrix จะชี้ไปยังคีย์คอนฟิกของบัญชีนั้น เช่น `channels.matrix.accounts.assistant.encryption`

<AccordionGroup>
  <Accordion title="ความหมายของ verified">
    OpenClaw จะถือว่าอุปกรณ์ได้รับการยืนยันแล้วก็ต่อเมื่อ cross-signing identity ของคุณเองเป็นผู้ลงนามให้อุปกรณ์นั้น `verify status --verbose` จะแสดงสัญญาณความเชื่อถือสามอย่าง:

    - `Locally trusted`: เชื่อถือโดย client นี้เท่านั้น
    - `Cross-signing verified`: SDK รายงานว่าผ่านการยืนยันด้วย cross-signing
    - `Signed by owner`: ลงนามโดย self-signing key ของคุณเอง

    `Verified by owner` จะเป็น `yes` ก็ต่อเมื่อมีการยืนยันแบบ cross-signing อยู่ด้วย
    ความเชื่อถือเฉพาะในเครื่องหรือการลงนามโดยเจ้าของเพียงอย่างเดียว ยังไม่เพียงพอให้ OpenClaw ถือว่า
    อุปกรณ์ได้รับการยืนยันอย่างสมบูรณ์

  </Accordion>

  <Accordion title="bootstrap ทำอะไร">
    `verify bootstrap` คือคำสั่งสำหรับซ่อมแซมและตั้งค่าบัญชีที่เข้ารหัส โดยจะทำตามลำดับดังนี้:

    - bootstrap secret storage โดยนำ recovery key ที่มีอยู่กลับมาใช้เมื่อเป็นไปได้
    - bootstrap cross-signing และอัปโหลด public cross-signing keys ที่ขาดหายไป
    - ทำเครื่องหมายและ cross-sign อุปกรณ์ปัจจุบัน
    - สร้าง room-key backup ฝั่งเซิร์ฟเวอร์หากยังไม่มีอยู่

    หาก homeserver ต้องใช้ UIA เพื่ออัปโหลด cross-signing keys, OpenClaw จะลองแบบไม่ยืนยันตัวตนก่อน จากนั้น `m.login.dummy` แล้วจึง `m.login.password` (ต้องใช้ `channels.matrix.password`) ใช้ `--force-reset-cross-signing` เฉพาะเมื่อคุณตั้งใจทิ้ง identity ปัจจุบันเท่านั้น

  </Accordion>

  <Accordion title="Fresh backup baseline">
    หากคุณต้องการให้ข้อความที่เข้ารหัสในอนาคตยังทำงานได้ และยอมรับการสูญเสียประวัติเก่าที่กู้คืนไม่ได้:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    เพิ่ม `--account <id>` เพื่อเจาะจงบัญชีที่มีชื่อ การดำเนินการนี้ยังสามารถสร้าง secret storage ใหม่ได้ด้วย หากไม่สามารถโหลด backup secret ปัจจุบันได้อย่างปลอดภัย
    เพิ่ม `--rotate-recovery-key` เฉพาะเมื่อคุณตั้งใจให้ recovery
    key เก่าไม่สามารถปลดล็อก fresh backup baseline ใหม่ได้อีก

  </Accordion>

  <Accordion title="พฤติกรรมตอนเริ่มต้น">
    เมื่อใช้ `encryption: true`, `startupVerification` จะมีค่าเริ่มต้นเป็น `"if-unverified"` ตอนเริ่มต้น อุปกรณ์ที่ยังไม่ผ่านการยืนยันจะร้องขอ self-verification ใน Matrix client อื่น โดยข้ามคำขอซ้ำและใช้ช่วงคูลดาวน์ ปรับแต่งได้ด้วย `startupVerificationCooldownHours` หรือปิดด้วย `startupVerification: "off"`

    การเริ่มต้นยังรันกระบวนการ bootstrap ของ crypto แบบระมัดระวัง ซึ่งนำ secret storage และ cross-signing identity ปัจจุบันกลับมาใช้ซ้ำ หากสถานะ bootstrap เสียหาย OpenClaw จะพยายามซ่อมแซมแบบมีการป้องกันแม้ไม่มี `channels.matrix.password`; หาก homeserver ต้องใช้ password UIA ตอนเริ่มต้นจะบันทึกคำเตือนและไม่ถือเป็นข้อผิดพลาดร้ายแรง อุปกรณ์ที่เจ้าของลงนามไว้แล้วจะถูกเก็บรักษาไว้

    ดู [Matrix migration](/th/install/migrating-matrix) สำหรับโฟลว์การอัปเกรดแบบเต็ม

  </Accordion>

  <Accordion title="ประกาศการยืนยันตัวตน">
    Matrix จะโพสต์ประกาศเกี่ยวกับวงจรชีวิตของการยืนยันตัวตนลงในห้อง DM สำหรับการยืนยันตัวตนแบบเข้มงวดเป็นข้อความ `m.notice`: คำขอ, สถานะพร้อม (พร้อมคำแนะนำ "Verify by emoji"), การเริ่มต้น/เสร็จสิ้น และรายละเอียด SAS (อีโมจิ/เลขทศนิยม) เมื่อมี

    คำขอขาเข้าจาก Matrix client อื่นจะถูกติดตามและยอมรับอัตโนมัติ สำหรับ self-verification, OpenClaw จะเริ่มโฟลว์ SAS ให้อัตโนมัติ และยืนยันฝั่งของตัวเองเมื่อมีการยืนยันด้วยอีโมจิพร้อมใช้งาน — แต่คุณยังต้องเปรียบเทียบและยืนยัน "They match" ใน Matrix client ของคุณเอง

    ประกาศระบบสำหรับการยืนยันตัวตนจะไม่ถูกส่งต่อไปยังไปป์ไลน์แชตของเอเจนต์

  </Accordion>

  <Accordion title="อุปกรณ์ Matrix ที่ถูกลบหรือไม่ถูกต้อง">
    หาก `verify status` ระบุว่าอุปกรณ์ปัจจุบันไม่ได้อยู่ในรายการบน
    homeserver แล้ว ให้สร้างอุปกรณ์ Matrix ใหม่สำหรับ OpenClaw สำหรับการเข้าสู่ระบบด้วย password:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    สำหรับการยืนยันตัวตนด้วย token ให้สร้าง access token ใหม่ใน Matrix client หรือ UI สำหรับผู้ดูแลของคุณ
    แล้วอัปเดต OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    แทนที่ `assistant` ด้วย account ID จากคำสั่งที่ล้มเหลว หรือไม่ต้องระบุ
    `--account` สำหรับบัญชีค่าเริ่มต้น

  </Accordion>

  <Accordion title="สุขอนามัยของอุปกรณ์">
    อุปกรณ์เก่าที่ OpenClaw จัดการอาจสะสมเพิ่มขึ้นได้ แสดงรายการและลบที่ไม่ใช้งาน:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE ใช้เส้นทาง Rust crypto ของ `matrix-js-sdk` อย่างเป็นทางการ โดยใช้ `fake-indexeddb` เป็น IndexedDB shim สถานะ crypto จะคงอยู่ใน `crypto-idb-snapshot.json` (สิทธิ์ไฟล์แบบเข้มงวด)

    สถานะ runtime ที่เข้ารหัสจะอยู่ภายใต้ `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` และรวมถึง sync store, crypto store, recovery key, IDB snapshot, thread bindings และสถานะ startup verification เมื่อ token เปลี่ยนแต่ identity ของบัญชียังคงเดิม OpenClaw จะนำ root เดิมที่ดีที่สุดกลับมาใช้เพื่อให้สถานะก่อนหน้ายังคงมองเห็นได้

  </Accordion>
</AccordionGroup>

## การจัดการโปรไฟล์

อัปเดต self-profile ของ Matrix สำหรับบัญชีที่เลือกด้วย:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

เพิ่ม `--account <id>` เมื่อคุณต้องการเจาะจงบัญชี Matrix ที่มีชื่ออย่างชัดเจน

Matrix รองรับ URL รูปโปรไฟล์แบบ `mxc://` ได้โดยตรง เมื่อคุณส่ง URL รูปโปรไฟล์แบบ `http://` หรือ `https://`, OpenClaw จะอัปโหลดไปยัง Matrix ก่อน แล้วบันทึก URL `mxc://` ที่ resolve แล้วกลับไปยัง `channels.matrix.avatarUrl` (หรือ override ของบัญชีที่เลือก)

## Threads

Matrix รองรับ Matrix threads แบบเนทีฟทั้งสำหรับการตอบกลับอัตโนมัติและการส่งผ่าน message-tool

- `dm.sessionScope: "per-user"` (ค่าเริ่มต้น) จะคงการกำหนดเส้นทาง Matrix DM แบบผูกกับผู้ส่ง ดังนั้นหลายห้อง DM จึงแชร์หนึ่งเซสชันได้เมื่อ resolve ไปยัง peer เดียวกัน
- `dm.sessionScope: "per-room"` จะแยกแต่ละห้อง Matrix DM ให้อยู่ใน session key ของตัวเอง ขณะเดียวกันยังใช้การยืนยันตัวตน DM ปกติและการตรวจสอบ allowlist ตามเดิม
- explicit Matrix conversation bindings ยังคงมีลำดับความสำคัญสูงกว่า `dm.sessionScope` ดังนั้นห้องและ threads ที่ถูก bind ไว้จะยังคงใช้เซสชันเป้าหมายที่เลือกไว้
- `threadReplies: "off"` จะให้การตอบกลับอยู่ระดับบนสุด และให้ข้อความ threaded ขาเข้าอยู่บนเซสชันแม่
- `threadReplies: "inbound"` จะตอบกลับภายใน thread เฉพาะเมื่อข้อความขาเข้านั้นอยู่ใน thread นั้นอยู่แล้ว
- `threadReplies: "always"` จะให้คำตอบในห้องอยู่ใน thread ที่มีรากจากข้อความที่ทริกเกอร์ และกำหนดเส้นทางบทสนทนานั้นผ่านเซสชันแบบผูกกับ thread ที่ตรงกันตั้งแต่ข้อความแรกที่ทริกเกอร์
- `dm.threadReplies` จะแทนที่ค่าระดับบนสุดสำหรับ DM เท่านั้น ตัวอย่างเช่น คุณสามารถแยก room threads ออกจากกันแต่ให้ DMs เรียบแบบไม่แยก thread
- ข้อความ threaded ขาเข้าจะรวมข้อความรากของ thread เป็นบริบทเพิ่มเติมให้เอเจนต์
- การส่งผ่าน message-tool จะสืบทอด Matrix thread ปัจจุบันโดยอัตโนมัติเมื่อเป้าหมายเป็นห้องเดียวกัน หรือเป็นเป้าหมายผู้ใช้ DM เดียวกัน เว้นแต่จะมีการระบุ `threadId` อย่างชัดเจน
- การนำเป้าหมายผู้ใช้ DM ของเซสชันเดียวกันกลับมาใช้ซ้ำจะเกิดขึ้นก็ต่อเมื่อ metadata ของเซสชันปัจจุบันพิสูจน์ได้ว่าเป็น DM peer เดียวกันบนบัญชี Matrix เดียวกัน; มิฉะนั้น OpenClaw จะกลับไปใช้การกำหนดเส้นทางแบบผูกกับผู้ใช้ตามปกติ
- เมื่อ OpenClaw พบว่าห้อง Matrix DM ชนกับห้อง DM อื่นบนเซสชัน Matrix DM ที่ใช้ร่วมกันเดียวกัน ระบบจะโพสต์ `m.notice` แบบครั้งเดียวในห้องนั้นพร้อมทางออก `/focus` เมื่อเปิดใช้ thread bindings และคำใบ้ `dm.sessionScope`
- รองรับ runtime thread bindings สำหรับ Matrix `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และ `/acp spawn` แบบผูกกับ thread ใช้งานได้ในห้อง Matrix และ DMs
- `/focus` ระดับบนสุดของห้อง/DM Matrix จะสร้าง Matrix thread ใหม่และ bind เข้ากับเซสชันเป้าหมายเมื่อ `threadBindings.spawnSubagentSessions=true`
- การรัน `/focus` หรือ `/acp spawn --thread here` ภายใน Matrix thread ที่มีอยู่แล้ว จะ bind thread ปัจจุบันนั้นแทน

## ACP conversation bindings

ห้อง Matrix, DMs และ Matrix threads ที่มีอยู่แล้ว สามารถเปลี่ยนให้เป็น ACP workspaces แบบคงทนได้โดยไม่ต้องเปลี่ยนพื้นผิวการแชต

โฟลว์ผู้ปฏิบัติงานแบบรวดเร็ว:

- รัน `/acp spawn codex --bind here` ภายใน Matrix DM, ห้อง หรือ thread ที่มีอยู่แล้วที่คุณต้องการใช้ต่อ
- ใน Matrix DM หรือห้องระดับบนสุด DM/ห้องปัจจุบันจะยังคงเป็นพื้นผิวการแชต และข้อความในอนาคตจะถูกกำหนดเส้นทางไปยัง ACP session ที่สร้างขึ้น
- ภายใน Matrix thread ที่มีอยู่แล้ว `--bind here` จะ bind thread ปัจจุบันนั้นในตำแหน่งเดิม
- `/new` และ `/reset` จะรีเซ็ต ACP session ที่ bind อยู่เดิมในตำแหน่งเดิม
- `/acp close` จะปิด ACP session และลบ binding

หมายเหตุ:

- `--bind here` จะไม่สร้าง Matrix thread ลูก
- `threadBindings.spawnAcpSessions` จำเป็นเฉพาะสำหรับ `/acp spawn --thread auto|here` ซึ่ง OpenClaw ต้องสร้างหรือ bind Matrix thread ลูก

### คอนฟิก thread binding

Matrix รับค่าเริ่มต้นส่วนกลางจาก `session.threadBindings` และยังรองรับ overrides ต่อ channel:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

แฟลก spawn แบบผูกกับ Matrix thread เป็นแบบ opt-in:

- ตั้งค่า `threadBindings.spawnSubagentSessions: true` เพื่ออนุญาตให้ `/focus` ระดับบนสุดสร้างและ bind Matrix threads ใหม่
- ตั้งค่า `threadBindings.spawnAcpSessions: true` เพื่ออนุญาตให้ `/acp spawn --thread auto|here` bind ACP sessions เข้ากับ Matrix threads

## Reactions

Matrix รองรับการกระทำ reaction ขาออก การแจ้งเตือน reaction ขาเข้า และ ack reactions ขาเข้า

- การใช้ reaction tooling ขาออกถูกควบคุมด้วย `channels["matrix"].actions.reactions`
- `react` เพิ่ม reaction ให้กับ Matrix event ที่ระบุ
- `reactions` แสดงสรุป reaction ปัจจุบันสำหรับ Matrix event ที่ระบุ
- `emoji=""` จะลบ reactions ของบัญชีบอทเองบน event นั้น
- `remove: true` จะลบเฉพาะ reaction อีโมจิที่ระบุจากบัญชีบอท

ขอบเขตของ ack reactions ใช้ลำดับการ resolve มาตรฐานของ OpenClaw:

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

- `reactionNotifications: "own"` จะส่งต่อ `m.reaction` events ที่ถูกเพิ่มเข้ามาเมื่อมันชี้ไปยังข้อความ Matrix ที่บอทเป็นผู้เขียน
- `reactionNotifications: "off"` ปิดใช้งาน reaction system events
- การลบ reaction จะไม่ถูกสังเคราะห์ให้เป็น system events เพราะ Matrix แสดงสิ่งเหล่านั้นเป็น redactions ไม่ใช่การลบ `m.reaction` แบบสแตนด์อโลน

## บริบทประวัติ

- `channels.matrix.historyLimit` ควบคุมจำนวนข้อความห้องล่าสุดที่จะรวมเป็น `InboundHistory` เมื่อข้อความห้อง Matrix ทริกเกอร์เอเจนต์ โดยจะ fallback ไปที่ `messages.groupChat.historyLimit`; หากทั้งสองค่าไม่ได้ตั้งไว้ ค่าเริ่มต้นที่มีผลจริงคือ `0` ตั้งค่า `0` เพื่อปิดใช้งาน
- ประวัติห้อง Matrix เป็นแบบ room-only ส่วน DMs ยังคงใช้ประวัติเซสชันตามปกติ
- ประวัติห้อง Matrix เป็นแบบ pending-only: OpenClaw จะบัฟเฟอร์ข้อความห้องที่ยังไม่ได้ทริกเกอร์การตอบกลับ จากนั้นจึง snapshot หน้าต่างนั้นเมื่อมีการ mention หรือทริกเกอร์อื่นเข้ามา
- ข้อความทริกเกอร์ปัจจุบันจะไม่ถูกรวมใน `InboundHistory`; มันจะยังอยู่ในเนื้อหาขาเข้าหลักสำหรับ turn นั้น
- การ retry ของ Matrix event เดิมจะนำ snapshot ประวัติเดิมกลับมาใช้แทนที่จะเลื่อนไปตามข้อความห้องใหม่กว่า

## การมองเห็นบริบท

Matrix รองรับตัวควบคุม `contextVisibility` แบบใช้ร่วมกันสำหรับบริบทห้องเสริม เช่น ข้อความตอบกลับที่ดึงมา, thread roots และประวัติที่รอดำเนินการ

- `contextVisibility: "all"` เป็นค่าเริ่มต้น บริบทเสริมจะถูกเก็บไว้ตามที่รับมา
- `contextVisibility: "allowlist"` จะกรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่ได้รับอนุญาตจากการตรวจสอบ allowlist ของห้อง/ผู้ใช้ที่กำลังใช้งานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บข้อความตอบกลับที่อ้างอิงโดยตรงไว้หนึ่งรายการ

การตั้งค่านี้มีผลต่อการมองเห็นของบริบทเสริม ไม่ใช่ว่าข้อความขาเข้าเองจะสามารถทริกเกอร์การตอบกลับได้หรือไม่
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

ตัวอย่าง pairing สำหรับ Matrix DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

หากผู้ใช้ Matrix ที่ยังไม่ได้รับการอนุมัติยังคงส่งข้อความถึงคุณก่อนการอนุมัติ OpenClaw จะนำ pending pairing code เดิมกลับมาใช้ซ้ำ และอาจส่งข้อความเตือนอีกครั้งหลังช่วงคูลดาวน์สั้นๆ แทนการสร้างโค้ดใหม่

ดู [Pairing](/th/channels/pairing) สำหรับโฟลว์ DM pairing แบบใช้ร่วมกันและเลย์เอาต์การจัดเก็บ

## การซ่อมห้อง direct

หากสถานะ direct-message ไม่ตรงกัน OpenClaw อาจลงเอยด้วยแมป `m.direct` ที่ล้าสมัยซึ่งชี้ไปยังห้องเดี่ยวเก่าแทน DM ที่ใช้งานจริง ตรวจสอบแมปปัจจุบันสำหรับ peer ด้วย:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

ซ่อมด้วย:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

โฟลว์การซ่อม:

- ให้ความสำคัญกับ DM แบบ 1:1 ที่เข้มงวดซึ่งถูกแมปไว้ใน `m.direct` อยู่แล้ว
- fallback ไปยัง DM แบบ 1:1 ที่เข้าร่วมอยู่ในปัจจุบันกับผู้ใช้นั้น
- สร้างห้อง direct ใหม่และเขียน `m.direct` ทับใหม่หากยังไม่มี DM ที่ใช้งานได้ปกติ

โฟลว์การซ่อมจะไม่ลบห้องเก่าโดยอัตโนมัติ มันเพียงเลือก DM ที่ใช้งานได้ปกติและอัปเดตแมปเพื่อให้การส่ง Matrix ใหม่ การแจ้งเตือนการยืนยันตัวตน และโฟลว์ direct-message อื่นๆ ชี้ไปยังห้องที่ถูกต้องอีกครั้ง

## การอนุมัติ exec

Matrix สามารถทำหน้าที่เป็นไคลเอนต์อนุมัติแบบเนทีฟสำหรับบัญชี Matrix ได้ โดยปุ่มควบคุมการกำหนดเส้นทาง DM/channel แบบเนทีฟยังคงอยู่ภายใต้คอนฟิกการอนุมัติ exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (ไม่บังคับ; fallback ไปที่ `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

ผู้อนุมัติต้องเป็น Matrix user IDs เช่น `@owner:example.org` Matrix จะเปิดใช้การอนุมัติแบบเนทีฟโดยอัตโนมัติเมื่อ `enabled` ไม่ได้ตั้งค่าไว้หรือเป็น `"auto"` และสามารถ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งราย Exec approvals จะใช้ `execApprovals.approvers` ก่อน และสามารถ fallback ไปที่ `channels.matrix.dm.allowFrom` ได้ ส่วน Plugin approvals จะอนุญาตผ่าน `channels.matrix.dm.allowFrom` ตั้งค่า `enabled: false` เพื่อปิด Matrix ในฐานะ native approval client อย่างชัดเจน มิฉะนั้นคำขออนุมัติจะ fallback ไปยังเส้นทางอนุมัติอื่นที่กำหนดไว้หรือ approval fallback policy

การกำหนดเส้นทางแบบเนทีฟของ Matrix รองรับการอนุมัติทั้งสองประเภท:

- `channels.matrix.execApprovals.*` ควบคุมโหมดการกระจาย DM/channel แบบเนทีฟสำหรับพรอมป์ตขออนุมัติของ Matrix
- Exec approvals ใช้ชุดผู้อนุมัติ exec จาก `execApprovals.approvers` หรือ `channels.matrix.dm.allowFrom`
- Plugin approvals ใช้ Matrix DM allowlist จาก `channels.matrix.dm.allowFrom`
- ทางลัด reaction ของ Matrix และการอัปเดตข้อความใช้ได้กับทั้ง exec และ plugin approvals

กฎการส่ง:

- `target: "dm"` ส่งพรอมป์ตขออนุมัติไปยัง DM ของผู้อนุมัติ
- `target: "channel"` ส่งพรอมป์ตกลับไปยังห้อง Matrix หรือ DM ต้นทาง
- `target: "both"` ส่งทั้งไปยัง DM ของผู้อนุมัติและห้อง Matrix หรือ DM ต้นทาง

พรอมป์ตขออนุมัติของ Matrix จะตั้งค่า reaction shortcuts บนข้อความอนุมัติหลัก:

- `✅` = อนุญาตครั้งเดียว
- `❌` = ปฏิเสธ
- `♾️` = อนุญาตเสมอเมื่อการตัดสินใจนั้นได้รับอนุญาตโดยนโยบาย exec ที่มีผลจริง

ผู้อนุมัติสามารถกด reaction บนข้อความนั้นหรือใช้ slash commands สำรอง: `/approve <id> allow-once`, `/approve <id> allow-always` หรือ `/approve <id> deny`

มีเพียงผู้อนุมัติที่ resolve ได้เท่านั้นที่สามารถอนุมัติหรือปฏิเสธได้ สำหรับ exec approvals การส่งผ่าน channel จะรวมข้อความคำสั่งไว้ด้วย ดังนั้นให้เปิดใช้ `channel` หรือ `both` เฉพาะในห้องที่เชื่อถือได้เท่านั้น

override ต่อบัญชี:

- `channels.matrix.accounts.<account>.execApprovals`

เอกสารที่เกี่ยวข้อง: [Exec approvals](/th/tools/exec-approvals)

## Slash commands

slash commands ของ Matrix (เช่น `/new`, `/reset`, `/model`) ใช้งานได้โดยตรงใน DMs ส่วนในห้อง OpenClaw ยังรองรับ slash commands ที่ขึ้นต้นด้วย Matrix mention ของบอทเองด้วย ดังนั้น `@bot:server /new` จะทริกเกอร์เส้นทางคำสั่งโดยไม่ต้องใช้ mention regex แบบกำหนดเอง วิธีนี้ทำให้บอทยังคงตอบสนองต่อโพสต์แบบห้องที่เป็น `@mention /command` ซึ่ง Element และไคลเอนต์ลักษณะเดียวกันสร้างขึ้นเมื่อผู้ใช้กดแท็บเติมชื่อบอทก่อนพิมพ์คำสั่ง

กฎการอนุญาตยังคงมีผล: ผู้ส่งคำสั่งต้องผ่านนโยบาย allowlist/owner สำหรับ DM หรือห้อง เช่นเดียวกับข้อความปกติ

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

ค่าระดับบนสุดของ `channels.matrix` จะทำหน้าที่เป็นค่าเริ่มต้นสำหรับบัญชีที่มีชื่อ เว้นแต่บัญชีนั้นจะ override เอง
คุณสามารถกำหนดขอบเขตรายการห้องที่สืบทอดมาให้กับบัญชี Matrix เดียวได้ด้วย `groups.<room>.account`
รายการที่ไม่มี `account` จะยังคงถูกใช้ร่วมกันระหว่างบัญชี Matrix ทั้งหมด และรายการที่มี `account: "default"` ก็ยังใช้งานได้เมื่อมีการกำหนดค่าบัญชีค่าเริ่มต้นไว้โดยตรงที่ `channels.matrix.*` ระดับบนสุด
ค่าเริ่มต้นการยืนยันตัวตนแบบใช้ร่วมกันที่ไม่ครบถ้วนจะไม่สร้างบัญชีค่าเริ่มต้นแบบ implicit แยกขึ้นมาด้วยตัวเอง OpenClaw จะสังเคราะห์บัญชี `default` ระดับบนสุดก็ต่อเมื่อค่าเริ่มต้นนั้นมีการยืนยันตัวตนใหม่ครบ (`homeserver` บวก `accessToken` หรือ `homeserver` บวก `userId` และ `password`); บัญชีที่มีชื่อยังคงสามารถถูกค้นพบได้จาก `homeserver` บวก `userId` เมื่อ cached credentials มาตอบโจทย์การยืนยันตัวตนในภายหลัง
หาก Matrix มีบัญชีที่มีชื่ออยู่แล้วเพียงหนึ่งบัญชี หรือ `defaultAccount` ชี้ไปยังคีย์บัญชีที่มีชื่ออยู่แล้ว การโปรโมตเพื่อซ่อมแซม/ตั้งค่าจากบัญชีเดียวไปเป็นหลายบัญชีจะคงบัญชีนั้นไว้แทนการสร้างรายการ `accounts.default` ใหม่ เฉพาะคีย์ Matrix auth/bootstrap เท่านั้นที่จะถูกย้ายไปยังบัญชีที่ถูกโปรโมตนั้น; คีย์นโยบายการส่งแบบใช้ร่วมกันจะยังคงอยู่ระดับบนสุด
ตั้งค่า `defaultAccount` เมื่อคุณต้องการให้ OpenClaw เลือกใช้บัญชี Matrix ที่มีชื่อบัญชีหนึ่งเป็นค่าปริยายสำหรับการกำหนดเส้นทาง การตรวจสอบ และการทำงานของ CLI
หากกำหนดค่าหลายบัญชี Matrix และมี account id หนึ่งเป็น `default`, OpenClaw จะใช้บัญชีนั้นโดยปริยายแม้ไม่ได้ตั้งค่า `defaultAccount`
หากคุณกำหนดค่าหลายบัญชีที่มีชื่อ ให้ตั้งค่า `defaultAccount` หรือส่ง `--account <id>` สำหรับคำสั่ง CLI ที่อาศัยการเลือกบัญชีแบบปริยาย
ส่ง `--account <id>` ไปยัง `openclaw matrix verify ...` และ `openclaw matrix devices ...` เมื่อคุณต้องการ override การเลือกแบบปริยายนั้นสำหรับคำสั่งใดคำสั่งหนึ่ง

ดู [Configuration reference](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบหลายบัญชีแบบใช้ร่วมกัน

## homeservers แบบ Private/LAN

ตามค่าเริ่มต้น OpenClaw จะบล็อก Matrix homeservers แบบ private/internal เพื่อป้องกัน SSRF เว้นแต่คุณจะ opt in อย่างชัดเจนต่อบัญชี

หาก homeserver ของคุณรันอยู่บน localhost, IP ใน LAN/Tailscale หรือ hostname ภายใน ให้เปิดใช้
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

การ opt in นี้อนุญาตเฉพาะเป้าหมาย private/internal ที่เชื่อถือได้เท่านั้น ส่วน homeservers แบบข้อความล้วนสาธารณะ เช่น
`http://matrix.example.org:8008` จะยังคงถูกบล็อก ควรใช้ `https://` ทุกครั้งเมื่อเป็นไปได้

## การใช้พร็อกซีกับทราฟฟิก Matrix

หากการติดตั้งใช้งาน Matrix ของคุณต้องการพร็อกซี HTTP(S) ขาออกแบบชัดเจน ให้ตั้งค่า `channels.matrix.proxy`:

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
OpenClaw ใช้การตั้งค่าพร็อกซีเดียวกันทั้งสำหรับทราฟฟิก Matrix ระหว่าง runtime และการ probe สถานะบัญชี

## การ resolve เป้าหมาย

Matrix รองรับรูปแบบเป้าหมายเหล่านี้ทุกที่ที่ OpenClaw ขอให้คุณระบุเป้าหมายห้องหรือผู้ใช้:

- ผู้ใช้: `@user:server`, `user:@user:server` หรือ `matrix:user:@user:server`
- ห้อง: `!room:server`, `room:!room:server` หรือ `matrix:room:!room:server`
- alias: `#alias:server`, `channel:#alias:server` หรือ `matrix:channel:#alias:server`

Matrix room IDs แยกตัวพิมพ์เล็กและใหญ่ ใช้ตัวพิมพ์ของ room ID ตามจริงจาก Matrix
เมื่อกำหนดค่า explicit delivery targets, Cron jobs, bindings หรือ allowlists
OpenClaw จะเก็บ session keys ภายในให้อยู่ในรูปแบบ canonical สำหรับการจัดเก็บ ดังนั้นคีย์ตัวพิมพ์เล็กเหล่านั้น
จึงไม่ใช่แหล่งข้อมูลที่เชื่อถือได้สำหรับ Matrix delivery IDs

การค้นหาไดเรกทอรีแบบสดจะใช้บัญชี Matrix ที่ล็อกอินอยู่:

- การค้นหาผู้ใช้จะสอบถาม Matrix user directory บน homeserver นั้น
- การค้นหาห้องจะรับ room IDs และ aliases ที่ระบุชัดเจนได้โดยตรง จากนั้นจึง fallback ไปค้นหาจากชื่อห้องที่เข้าร่วมแล้วของบัญชีนั้น
- การค้นหาชื่อห้องที่เข้าร่วมแล้วเป็นแบบ best-effort หากไม่สามารถ resolve ชื่อห้องไปเป็น ID หรือ alias ได้ ระบบจะเพิกเฉยชื่อนั้นระหว่างการ resolve allowlist ใน runtime

## ข้อมูลอ้างอิงการกำหนดค่า

- `enabled`: เปิดหรือปิดใช้งาน channel
- `name`: ป้ายชื่อแบบเลือกได้สำหรับบัญชี
- `defaultAccount`: account ID ที่ต้องการใช้เป็นค่าปริยายเมื่อมีการกำหนดค่าหลายบัญชี Matrix
- `homeserver`: URL ของ homeserver เช่น `https://matrix.example.org`
- `network.dangerouslyAllowPrivateNetwork`: อนุญาตให้บัญชี Matrix นี้เชื่อมต่อกับ homeservers แบบ private/internal เปิดใช้ตัวเลือกนี้เมื่อ homeserver resolve ไปยัง `localhost`, IP ใน LAN/Tailscale หรือโฮสต์ภายใน เช่น `matrix-synapse`
- `proxy`: URL ของพร็อกซี HTTP(S) แบบเลือกได้สำหรับทราฟฟิก Matrix บัญชีที่มีชื่อสามารถ override ค่าเริ่มต้นระดับบนสุดด้วย `proxy` ของตัวเอง
- `userId`: Matrix user ID แบบเต็ม เช่น `@bot:example.org`
- `accessToken`: access token สำหรับการยืนยันตัวตนแบบใช้ token รองรับทั้งค่าข้อความธรรมดาและค่า SecretRef สำหรับ `channels.matrix.accessToken` และ `channels.matrix.accounts.<id>.accessToken` ผ่านผู้ให้บริการ env/file/exec ดู [Secrets Management](/th/gateway/secrets)
- `password`: รหัสผ่านสำหรับการเข้าสู่ระบบแบบใช้ password รองรับทั้งค่าข้อความธรรมดาและค่า SecretRef
- `deviceId`: Matrix device ID ที่ระบุชัดเจน
- `deviceName`: ชื่อที่ใช้แสดงของอุปกรณ์สำหรับการเข้าสู่ระบบด้วย password
- `avatarUrl`: URL รูปโปรไฟล์ของตัวเองที่จัดเก็บไว้สำหรับการซิงก์โปรไฟล์และการอัปเดต `profile set`
- `initialSyncLimit`: จำนวน event สูงสุดที่ดึงระหว่างการซิงก์ตอนเริ่มต้น
- `encryption`: เปิดใช้ E2EE
- `allowlistOnly`: เมื่อเป็น `true` จะอัปเกรดนโยบายห้อง `open` ให้เป็น `allowlist` และบังคับให้ทุกนโยบาย DM ที่ใช้งานอยู่ยกเว้น `disabled` (รวมถึง `pairing` และ `open`) เป็น `allowlist` ไม่มีผลกับนโยบาย `disabled`
- `allowBots`: อนุญาตข้อความจากบัญชี OpenClaw Matrix อื่นที่กำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `groupPolicy`: `open`, `allowlist` หรือ `disabled`
- `contextVisibility`: โหมดการมองเห็นบริบทห้องเสริม (`all`, `allowlist`, `allowlist_quote`)
- `groupAllowFrom`: allowlist ของ user IDs สำหรับทราฟฟิกห้อง ใช้ Matrix user IDs แบบเต็มจะปลอดภัยที่สุด; การจับคู่กับ directory ที่ตรงกันแบบเป๊ะจะถูก resolve ตอนเริ่มต้นและเมื่อ allowlist เปลี่ยนในขณะที่ monitor กำลังทำงาน ชื่อที่ resolve ไม่ได้จะถูกเพิกเฉย
- `historyLimit`: จำนวนข้อความห้องสูงสุดที่จะรวมเป็นบริบทประวัติกลุ่ม โดยจะ fallback ไปที่ `messages.groupChat.historyLimit`; หากทั้งสองค่าไม่ได้ตั้งไว้ ค่าเริ่มต้นที่มีผลจริงคือ `0` ตั้งค่า `0` เพื่อปิดใช้งาน
- `replyToMode`: `off`, `first`, `all` หรือ `batched`
- `markdown`: ค่ากำหนดการเรนเดอร์ Markdown แบบเลือกได้สำหรับข้อความ Matrix ขาออก
- `streaming`: `off` (ค่าเริ่มต้น), `"partial"`, `"quiet"`, `true` หรือ `false` โดย `"partial"` และ `true` จะเปิดใช้การอัปเดตฉบับร่างแบบ preview-first ด้วยข้อความ Matrix ปกติ ส่วน `"quiet"` ใช้พรีวิวแบบ notice ที่ไม่แจ้งเตือนสำหรับการตั้งค่า push-rule แบบ self-hosted และ `false` เทียบเท่ากับ `"off"`
- `blockStreaming`: `true` เปิดใช้ข้อความความคืบหน้าแยกต่างหากสำหรับ assistant blocks ที่เสร็จแล้ว ขณะที่ draft preview streaming กำลังทำงาน
- `threadReplies`: `off`, `inbound` หรือ `always`
- `threadBindings`: overrides ต่อ channel สำหรับการกำหนดเส้นทางเซสชันและวงจรชีวิตแบบผูกกับ thread
- `startupVerification`: โหมดคำขอ self-verification อัตโนมัติเมื่อเริ่มต้น (`if-unverified`, `off`)
- `startupVerificationCooldownHours`: ช่วงคูลดาวน์ก่อนลองส่งคำขอ startup verification อัตโนมัติอีกครั้ง
- `textChunkLimit`: ขนาด chunk ของข้อความขาออกเป็นจำนวนอักขระ (ใช้เมื่อ `chunkMode` เป็น `length`)
- `chunkMode`: `length` แยกข้อความตามจำนวนอักขระ; `newline` แยกที่ขอบเขตบรรทัด
- `responsePrefix`: สตริงแบบเลือกได้ที่เติมไว้หน้าคำตอบขาออกทั้งหมดสำหรับ channel นี้
- `ackReaction`: override ของ ack reaction แบบเลือกได้สำหรับ channel/บัญชีนี้
- `ackReactionScope`: override ของขอบเขต ack reaction แบบเลือกได้ (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`)
- `reactionNotifications`: โหมดการแจ้งเตือน reaction ขาเข้า (`own`, `off`)
- `mediaMaxMb`: เพดานขนาดสื่อเป็น MB สำหรับการส่งขาออกและการประมวลผลสื่อขาเข้า
- `autoJoin`: นโยบายเข้าร่วมคำเชิญอัตโนมัติ (`always`, `allowlist`, `off`) ค่าเริ่มต้น: `off` ใช้กับคำเชิญ Matrix ทั้งหมด รวมถึงคำเชิญแบบ DM
- `autoJoinAllowlist`: ห้อง/aliases ที่อนุญาตเมื่อ `autoJoin` เป็น `allowlist` รายการ alias จะถูก resolve เป็น room IDs ระหว่างการจัดการคำเชิญ; OpenClaw จะไม่เชื่อถือสถานะ alias ที่ห้องที่ได้รับเชิญอ้างว่าเป็น
- `dm`: บล็อกนโยบาย DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`)
- `dm.policy`: ควบคุมการเข้าถึง DM หลังจาก OpenClaw เข้าร่วมห้องแล้วและจัดประเภทว่าเป็น DM แล้ว ไม่ได้เปลี่ยนแปลงว่าคำเชิญจะถูกเข้าร่วมอัตโนมัติหรือไม่
- `dm.allowFrom`: allowlist ของ user IDs สำหรับทราฟฟิก DM ใช้ Matrix user IDs แบบเต็มจะปลอดภัยที่สุด; การจับคู่กับ directory ที่ตรงกันแบบเป๊ะจะถูก resolve ตอนเริ่มต้นและเมื่อ allowlist เปลี่ยนในขณะที่ monitor กำลังทำงาน ชื่อที่ resolve ไม่ได้จะถูกเพิกเฉย
- `dm.sessionScope`: `per-user` (ค่าเริ่มต้น) หรือ `per-room` ใช้ `per-room` เมื่อคุณต้องการให้แต่ละห้อง Matrix DM เก็บบริบทแยกจากกัน แม้ peer จะเป็นคนเดิมก็ตาม
- `dm.threadReplies`: override ของนโยบาย thread สำหรับ DM เท่านั้น (`off`, `inbound`, `always`) มันจะแทนที่การตั้งค่า `threadReplies` ระดับบนสุด ทั้งในด้านตำแหน่งการตอบกลับและการแยกเซสชันใน DMs
- `execApprovals`: การส่งการอนุมัติ exec แบบเนทีฟของ Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`)
- `execApprovals.approvers`: Matrix user IDs ที่ได้รับอนุญาตให้อนุมัติคำขอ exec ไม่บังคับเมื่อ `dm.allowFrom` ระบุผู้อนุมัติไว้อยู่แล้ว
- `execApprovals.target`: `dm | channel | both` (ค่าเริ่มต้น: `dm`)
- `accounts`: overrides ต่อบัญชีแบบมีชื่อ ค่าระดับบนสุดของ `channels.matrix` ทำหน้าที่เป็นค่าเริ่มต้นให้รายการเหล่านี้
- `groups`: แมปนโยบายต่อห้อง แนะนำให้ใช้ room IDs หรือ aliases; ชื่อห้องที่ resolve ไม่ได้จะถูกเพิกเฉยใน runtime ตัวตนของ session/group จะใช้ room ID ที่เสถียรหลังการ resolve
- `groups.<room>.account`: จำกัดรายการห้องที่สืบทอดมาหนึ่งรายการให้ใช้กับบัญชี Matrix ที่ระบุในชุดหลายบัญชี
- `groups.<room>.allowBots`: override ระดับห้องสำหรับผู้ส่งที่เป็นบอทที่กำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `groups.<room>.users`: allowlist ของผู้ส่งต่อห้อง
- `groups.<room>.tools`: overrides การอนุญาต/ปฏิเสธ tools ต่อห้อง
- `groups.<room>.autoReply`: override ระดับห้องสำหรับการบังคับ mention โดย `true` จะปิดข้อกำหนดการ mention สำหรับห้องนั้น และ `false` จะบังคับให้เปิดกลับอีกครั้ง
- `groups.<room>.skills`: ตัวกรอง skill ระดับห้องแบบเลือกได้
- `groups.<room>.systemPrompt`: snippet ของ system prompt ระดับห้องแบบเลือกได้
- `rooms`: alias แบบเดิมของ `groups`
- `actions`: การควบคุมการใช้ tool ต่อ action (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`)

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — channels ที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์ pairing
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการบังคับ mention
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
