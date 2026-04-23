---
read_when:
    - การตั้งค่า Matrix ใน OpenClaw
    - การกำหนดค่า Matrix E2EE และการยืนยันตัวตน
summary: สถานะการรองรับ Matrix การตั้งค่า และตัวอย่างการกำหนดค่า
title: Matrix
x-i18n:
    generated_at: "2026-04-23T10:13:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14873e9d65994138d26ad0bc1bf9bc6e00bea17f9306d592c757503d363de71a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix เป็น channel plugin ที่มากับระบบสำหรับ OpenClaw
โดยใช้ `matrix-js-sdk` อย่างเป็นทางการ และรองรับ DM, ห้อง, เธรด, สื่อ, รีแอ็กชัน, โพล, ตำแหน่งที่ตั้ง และ E2EE

## plugin ที่มากับระบบ

Matrix มาพร้อมเป็น plugin ที่มากับระบบใน OpenClaw รุ่นปัจจุบัน ดังนั้น
โดยปกติแล้วการติดตั้งแบบแพ็กเกจไม่จำเป็นต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Matrix ไว้ ให้ติดตั้ง
ด้วยตนเอง:

ติดตั้งจาก npm:

```bash
openclaw plugins install @openclaw/matrix
```

ติดตั้งจาก checkout ภายในเครื่อง:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

ดู [Plugins](/th/tools/plugin) สำหรับพฤติกรรมของ plugin และกฎการติดตั้ง

## การตั้งค่า

1. ตรวจสอบให้แน่ใจว่า plugin Matrix พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันรวมไว้ให้อยู่แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้ด้วยตนเองโดยใช้คำสั่งข้างต้น
2. สร้างบัญชี Matrix บน homeserver ของคุณ
3. กำหนดค่า `channels.matrix` โดยใช้แบบใดแบบหนึ่งต่อไปนี้:
   - `homeserver` + `accessToken` หรือ
   - `homeserver` + `userId` + `password`
4. รีสตาร์ท Gateway
5. เริ่ม DM กับบอตหรือเชิญบอตเข้าห้อง
   - คำเชิญ Matrix ใหม่จะใช้งานได้ก็ต่อเมื่อ `channels.matrix.autoJoin` อนุญาต

เส้นทางการตั้งค่าแบบโต้ตอบ:

```bash
openclaw channels add
openclaw configure --section channels
```

ตัวช่วยตั้งค่า Matrix จะถามข้อมูลต่อไปนี้:

- URL ของ homeserver
- วิธีการยืนยันตัวตน: access token หรือรหัสผ่าน
- ID ผู้ใช้ (เฉพาะการยืนยันตัวตนด้วยรหัสผ่าน)
- ชื่ออุปกรณ์เพิ่มเติมถ้าต้องการ
- จะเปิดใช้ E2EE หรือไม่
- จะกำหนดค่าการเข้าถึงห้องและการเข้าร่วมอัตโนมัติจากคำเชิญหรือไม่

พฤติกรรมสำคัญของตัวช่วยตั้งค่า:

- หากมีตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตนของ Matrix อยู่แล้ว และบัญชีนั้นยังไม่มีการบันทึกข้อมูลยืนยันตัวตนไว้ใน config ตัวช่วยตั้งค่าจะเสนอทางลัด env เพื่อเก็บข้อมูลยืนยันตัวตนไว้ในตัวแปรสภาพแวดล้อม
- ชื่อบัญชีจะถูกทำให้เป็นรูปแบบมาตรฐานตาม account ID ตัวอย่างเช่น `Ops Bot` จะกลายเป็น `ops-bot`
- รายการ allowlist ของ DM รับค่า `@user:server` ได้โดยตรง; ชื่อที่แสดงผลจะใช้ได้เฉพาะเมื่อการค้นหาไดเรกทอรีแบบสดพบผลลัพธ์ที่ตรงกันเพียงรายการเดียว
- รายการ allowlist ของห้องรับ room ID และ alias ได้โดยตรง แนะนำให้ใช้ `!room:server` หรือ `#alias:server`; ชื่อที่ไม่สามารถ resolve ได้จะถูกเพิกเฉยระหว่างรันไทม์โดยกระบวนการ resolve ของ allowlist
- ในโหมด allowlist ของการเข้าร่วมอัตโนมัติจากคำเชิญ ให้ใช้เฉพาะเป้าหมายคำเชิญที่เสถียรเท่านั้น: `!roomId:server`, `#alias:server`, หรือ `*` ระบบจะปฏิเสธชื่อห้องแบบข้อความธรรมดา
- หากต้องการ resolve ชื่อห้องก่อนบันทึก ให้ใช้ `openclaw channels resolve --channel matrix "Project Room"`

<Warning>
ค่าเริ่มต้นของ `channels.matrix.autoJoin` คือ `off`

หากปล่อยไว้โดยไม่กำหนด บอตจะไม่เข้าร่วมห้องที่เชิญเข้ามาหรือคำเชิญแบบ DM ใหม่ ดังนั้นบอตจะไม่ปรากฏในกลุ่มใหม่หรือ DM ที่เชิญเข้ามา เว้นแต่คุณจะเข้าร่วมด้วยตนเองก่อน

ตั้งค่า `autoJoin: "allowlist"` ร่วมกับ `autoJoinAllowlist` เพื่อจำกัดว่าคำเชิญใดที่บอตจะยอมรับ หรือกำหนด `autoJoin: "always"` หากคุณต้องการให้บอตเข้าร่วมทุกคำเชิญ

ในโหมด `allowlist`, `autoJoinAllowlist` รับได้เฉพาะ `!roomId:server`, `#alias:server`, หรือ `*`
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

การตั้งค่าแบบใช้รหัสผ่าน (ระบบจะ cache token หลังจากเข้าสู่ระบบ):

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

Matrix จะจัดเก็บข้อมูลรับรองที่ cache ไว้ใน `~/.openclaw/credentials/matrix/`
บัญชีค่าเริ่มต้นใช้ `credentials.json`; บัญชีที่มีชื่อจะใช้ `credentials-<account>.json`
เมื่อมีข้อมูลรับรองที่ cache ไว้ที่นั่น OpenClaw จะถือว่า Matrix ได้รับการกำหนดค่าแล้วสำหรับการตั้งค่า doctor และการตรวจพบสถานะ channel แม้ว่าการยืนยันตัวตนปัจจุบันจะไม่ได้ถูกตั้งค่าโดยตรงใน config ก็ตาม

ตัวแปรสภาพแวดล้อมที่เทียบเท่ากัน (ใช้เมื่อไม่ได้ตั้งค่า config key):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

สำหรับบัญชีที่ไม่ใช่ค่าเริ่มต้น ให้ใช้ตัวแปรสภาพแวดล้อมแบบกำหนดขอบเขตตามบัญชี:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

ตัวอย่างสำหรับบัญชี `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

สำหรับ account ID แบบมาตรฐาน `ops-bot` ให้ใช้:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix จะ escape เครื่องหมายวรรคตอนใน account ID เพื่อให้ตัวแปรสภาพแวดล้อมแบบกำหนดขอบเขตไม่ชนกัน
ตัวอย่างเช่น `-` จะกลายเป็น `_X2D_` ดังนั้น `ops-prod` จะถูกแมปเป็น `MATRIX_OPS_X2D_PROD_*`

ตัวช่วยตั้งค่าแบบโต้ตอบจะเสนอทางลัด env-var ก็ต่อเมื่อมีตัวแปรสภาพแวดล้อมยืนยันตัวตนเหล่านั้นอยู่แล้ว และบัญชีที่เลือกยังไม่มีการบันทึกข้อมูลยืนยันตัวตนของ Matrix ไว้ใน config

ไม่สามารถตั้งค่า `MATRIX_HOMESERVER` จาก `.env` ของ workspace ได้; ดู [ไฟล์ `.env` ของ workspace](/th/gateway/security)

## ตัวอย่างการกำหนดค่า

นี่คือตัวอย่าง config พื้นฐานที่ใช้งานได้จริง โดยเปิดใช้การจับคู่ DM, allowlist ของห้อง และ E2EE:

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

`autoJoin` ใช้กับคำเชิญ Matrix ทั้งหมด รวมถึงคำเชิญแบบ DM OpenClaw ไม่สามารถ
จัดประเภทห้องที่ถูกเชิญได้อย่างน่าเชื่อถือว่าเป็น DM หรือกลุ่มในเวลาที่เชิญ ดังนั้นคำเชิญทั้งหมดจะผ่าน `autoJoin`
ก่อน `dm.policy` จะมีผลหลังจากที่บอตเข้าร่วมห้องแล้วและห้องนั้นถูกจัดประเภทว่าเป็น DM

## ตัวอย่างการสตรีมแบบพรีวิว

การสตรีมคำตอบของ Matrix เป็นฟังก์ชันที่ต้องเปิดใช้เอง

ตั้งค่า `channels.matrix.streaming` เป็น `"partial"` เมื่อคุณต้องการให้ OpenClaw ส่งคำตอบแบบพรีวิวสดเพียงหนึ่งรายการ
แก้ไขพรีวิวนั้นในตำแหน่งเดิมขณะที่โมเดลกำลังสร้างข้อความ และปิดท้ายเมื่อ
ตอบกลับเสร็จสิ้น:

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
- `streaming: "partial"` จะสร้างข้อความพรีวิวที่แก้ไขได้หนึ่งรายการสำหรับบล็อก assistant ปัจจุบัน โดยใช้ข้อความ Matrix ปกติ การทำเช่นนี้จะคงพฤติกรรมการแจ้งเตือนแบบพรีวิวก่อนของ Matrix รุ่นเดิมไว้ ดังนั้นไคลเอนต์มาตรฐานอาจแจ้งเตือนจากข้อความพรีวิวที่สตรีมครั้งแรก แทนที่จะเป็นบล็อกที่เสร็จสมบูรณ์แล้ว
- `streaming: "quiet"` จะสร้างข้อความพรีวิวแบบเงียบที่แก้ไขได้หนึ่งรายการสำหรับบล็อก assistant ปัจจุบัน ใช้ตัวเลือกนี้เฉพาะเมื่อคุณกำหนดค่า push rule ของผู้รับสำหรับการแก้ไขพรีวิวที่ปิดท้ายแล้วด้วย
- `blockStreaming: true` เปิดใช้ข้อความความคืบหน้า Matrix แยกต่างหาก เมื่อเปิดใช้การสตรีมแบบพรีวิว Matrix จะคงฉบับร่างสดไว้สำหรับบล็อกปัจจุบัน และเก็บบล็อกที่เสร็จสมบูรณ์แล้วไว้เป็นข้อความแยกต่างหาก
- เมื่อเปิดการสตรีมแบบพรีวิวและ `blockStreaming` ปิดอยู่ Matrix จะแก้ไขฉบับร่างสดในตำแหน่งเดิม และปิดท้าย event เดิมนั้นเมื่อบล็อกหรือเทิร์นเสร็จสิ้น
- หากพรีวิวไม่สามารถใส่ใน Matrix event เดียวได้อีกต่อไป OpenClaw จะหยุดการสตรีมแบบพรีวิวและกลับไปใช้การส่งผลลัพธ์สุดท้ายแบบปกติ
- คำตอบที่มีสื่อจะยังส่งไฟล์แนบตามปกติ หากไม่สามารถนำพรีวิวที่ค้างอยู่กลับมาใช้ซ้ำได้อย่างปลอดภัย OpenClaw จะ redact พรีวิวนั้นก่อนส่งคำตอบสื่อสุดท้าย
- การแก้ไขพรีวิวมีต้นทุนเป็นการเรียก Matrix API เพิ่มเติม หากคุณต้องการพฤติกรรมด้าน rate limit ที่ระมัดระวังที่สุด ให้ปิดการสตรีมไว้

`blockStreaming` ไม่ได้เปิดใช้พรีวิวฉบับร่างด้วยตัวเอง
ให้ใช้ `streaming: "partial"` หรือ `streaming: "quiet"` สำหรับการแก้ไขพรีวิว; จากนั้นค่อยเพิ่ม `blockStreaming: true` เฉพาะเมื่อคุณต้องการให้บล็อก assistant ที่เสร็จแล้วคงมองเห็นได้เป็นข้อความความคืบหน้าแยกต่างหากด้วย

หากคุณต้องการการแจ้งเตือน Matrix มาตรฐานโดยไม่ใช้ push rule แบบกำหนดเอง ให้ใช้ `streaming: "partial"` สำหรับพฤติกรรมแบบพรีวิวก่อน หรือปล่อย `streaming` เป็นปิดไว้สำหรับการส่งเฉพาะผลลัพธ์สุดท้าย เมื่อ `streaming: "off"`:

- `blockStreaming: true` จะส่งแต่ละบล็อกที่เสร็จแล้วเป็นข้อความ Matrix ปกติที่มีการแจ้งเตือน
- `blockStreaming: false` จะส่งเฉพาะคำตอบสุดท้ายที่เสร็จสมบูรณ์เป็นข้อความ Matrix ปกติที่มีการแจ้งเตือน

### push rule สำหรับพรีวิวแบบเงียบที่ปิดท้ายแล้วบนระบบ self-hosted

หากคุณรันโครงสร้างพื้นฐาน Matrix เอง และต้องการให้พรีวิวแบบเงียบแจ้งเตือนเฉพาะเมื่อบล็อกหรือ
คำตอบสุดท้ายเสร็จสิ้น ให้ตั้งค่า `streaming: "quiet"` และเพิ่ม push rule ต่อผู้ใช้สำหรับการแก้ไขพรีวิวที่ปิดท้ายแล้ว

โดยปกติแล้วนี่เป็นการตั้งค่าระดับผู้ใช้ผู้รับ ไม่ใช่การเปลี่ยน config ระดับ homeserver โดยรวม:

แผนที่สั้น ๆ ก่อนเริ่ม:

- ผู้ใช้ผู้รับ = บุคคลที่จะได้รับการแจ้งเตือน
- ผู้ใช้บอต = บัญชี Matrix ของ OpenClaw ที่ส่งคำตอบ
- ใช้ access token ของผู้ใช้ผู้รับสำหรับการเรียก API ด้านล่าง
- จับคู่ `sender` ใน push rule กับ MXID แบบเต็มของผู้ใช้บอต

1. กำหนดค่า OpenClaw ให้ใช้พรีวิวแบบเงียบ:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. ตรวจสอบให้แน่ใจว่าบัญชีของผู้รับได้รับการแจ้งเตือน push ของ Matrix แบบปกติอยู่แล้ว กฎของพรีวิวแบบเงียบ
   จะทำงานได้ก็ต่อเมื่อผู้ใช้นั้นมี pusher/อุปกรณ์ที่ใช้งานได้อยู่แล้ว

3. รับ access token ของผู้ใช้ผู้รับ
   - ใช้ token ของผู้ใช้ที่รับข้อความ ไม่ใช่ token ของบอต
   - โดยปกติการนำ token ของเซสชันไคลเอนต์ที่มีอยู่มาใช้ซ้ำจะง่ายที่สุด
   - หากคุณต้องการสร้าง token ใหม่ คุณสามารถเข้าสู่ระบบผ่าน Matrix Client-Server API มาตรฐานได้:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. ตรวจสอบว่าบัญชีของผู้รับมี pusher อยู่แล้ว:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

หากคำสั่งนี้ไม่คืนค่า pusher/อุปกรณ์ที่ใช้งานอยู่ ให้แก้ไขการแจ้งเตือน Matrix แบบปกติก่อน แล้วจึงค่อยเพิ่ม
กฎ OpenClaw ด้านล่าง

OpenClaw จะทำเครื่องหมายการแก้ไขพรีวิวแบบข้อความล้วนที่ปิดท้ายแล้วด้วย:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. สร้าง override push rule สำหรับแต่ละบัญชีผู้รับที่ควรได้รับการแจ้งเตือนเหล่านี้:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

แทนที่ค่าต่อไปนี้ก่อนรันคำสั่ง:

- `https://matrix.example.org`: URL ฐานของ homeserver ของคุณ
- `$USER_ACCESS_TOKEN`: access token ของผู้ใช้ที่รับข้อความ
- `openclaw-finalized-preview-botname`: rule ID ที่ไม่ซ้ำกันสำหรับบอตนี้สำหรับผู้ใช้ที่รับข้อความรายนี้
- `@bot:example.org`: MXID ของบอต Matrix ใน OpenClaw ของคุณ ไม่ใช่ MXID ของผู้ใช้ที่รับข้อความ

สิ่งสำคัญสำหรับการตั้งค่าหลายบอต:

- Push rule ถูกอ้างอิงด้วย `ruleId` การรัน `PUT` ซ้ำกับ rule ID เดิมจะเป็นการอัปเดตกฎนั้น
- หากผู้ใช้ผู้รับคนเดียวต้องการให้มีการแจ้งเตือนจากบัญชีบอต Matrix ของ OpenClaw หลายบัญชี ให้สร้างหนึ่งกฎต่อหนึ่งบอต โดยใช้ rule ID ที่ไม่ซ้ำกันสำหรับการจับคู่ `sender` แต่ละรายการ
- รูปแบบที่เรียบง่ายคือ `openclaw-finalized-preview-<botname>` เช่น `openclaw-finalized-preview-ops` หรือ `openclaw-finalized-preview-support`

กฎนี้จะถูกประเมินกับผู้ส่ง event:

- ยืนยันตัวตนด้วย token ของผู้ใช้ผู้รับ
- จับคู่ `sender` กับ MXID ของบอต OpenClaw

6. ตรวจสอบว่ากฎมีอยู่แล้ว:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. ทดสอบการตอบกลับแบบสตรีม ในโหมด quiet ห้องควรแสดงพรีวิวฉบับร่างแบบเงียบ และการแก้ไขในตำแหน่งเดิมครั้งสุดท้าย
   ควรแจ้งเตือนหนึ่งครั้งเมื่อบล็อกหรือเทิร์นเสร็จสิ้น

หากภายหลังคุณต้องการลบกฎ ให้ลบ rule ID เดิมนั้นโดยใช้ token ของผู้ใช้ผู้รับ:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

หมายเหตุ:

- สร้างกฎโดยใช้ access token ของผู้ใช้ผู้รับ ไม่ใช่ของบอต
- กฎ `override` ที่ผู้ใช้กำหนดขึ้นใหม่จะถูกแทรกไว้ก่อนกฎระงับค่าเริ่มต้น ดังนั้นไม่จำเป็นต้องมีพารามิเตอร์ลำดับเพิ่มเติม
- สิ่งนี้มีผลเฉพาะกับการแก้ไขพรีวิวแบบข้อความล้วนที่ OpenClaw สามารถปิดท้ายในตำแหน่งเดิมได้อย่างปลอดภัยเท่านั้น การย้อนกลับไปใช้สื่อหรือการย้อนกลับจากพรีวิวที่ค้างอยู่จะยังคงใช้การส่งแบบ Matrix ปกติ
- หาก `GET /_matrix/client/v3/pushers` แสดงว่าไม่มี pusher แปลว่าผู้ใช้รายนั้นยังไม่มีการส่ง push ของ Matrix ที่ทำงานได้สำหรับบัญชี/อุปกรณ์นี้

#### Synapse

สำหรับ Synapse โดยปกติการตั้งค่าข้างต้นเพียงอย่างเดียวก็เพียงพอแล้ว:

- ไม่จำเป็นต้องมีการเปลี่ยนแปลง `homeserver.yaml` แบบพิเศษสำหรับการแจ้งเตือนพรีวิว OpenClaw ที่ปิดท้ายแล้ว
- หากระบบ Synapse ของคุณส่งการแจ้งเตือน push ของ Matrix แบบปกติได้อยู่แล้ว ขั้นตอนหลักก็คือ user token + การเรียก `pushrules` ข้างต้น
- หากคุณรัน Synapse หลัง reverse proxy หรือ workers ให้แน่ใจว่า `/_matrix/client/.../pushrules/` ไปถึง Synapse ได้อย่างถูกต้อง
- หากคุณใช้ Synapse workers ให้ตรวจสอบว่า pushers อยู่ในสถานะพร้อมใช้งาน การส่ง push จะถูกจัดการโดยโปรเซสหลักหรือ `synapse.app.pusher` / workers ของ pusher ที่กำหนดค่าไว้

#### Tuwunel

สำหรับ Tuwunel ให้ใช้ขั้นตอนการตั้งค่าและการเรียก API `pushrules` แบบเดียวกับที่แสดงไว้ข้างต้น:

- ไม่จำเป็นต้องมี config เฉพาะของ Tuwunel สำหรับตัวทำเครื่องหมายพรีวิวที่ปิดท้ายแล้ว
- หากการแจ้งเตือน Matrix แบบปกติทำงานได้อยู่แล้วสำหรับผู้ใช้รายนั้น ขั้นตอนหลักก็คือ user token + การเรียก `pushrules` ข้างต้น
- หากดูเหมือนว่าการแจ้งเตือนหายไปในขณะที่ผู้ใช้กำลังใช้งานบนอุปกรณ์อีกเครื่อง ให้ตรวจสอบว่าเปิด `suppress_push_when_active` อยู่หรือไม่ Tuwunel เพิ่มตัวเลือกนี้ใน Tuwunel 1.4.2 เมื่อวันที่ 12 กันยายน 2025 และตัวเลือกนี้สามารถระงับการส่ง push ไปยังอุปกรณ์อื่นโดยเจตนาได้ขณะที่มีอุปกรณ์หนึ่งกำลังใช้งานอยู่

## ห้องบอตต่อบอต

ตามค่าเริ่มต้น ข้อความ Matrix จากบัญชี Matrix ของ OpenClaw อื่นที่กำหนดค่าไว้จะถูกละเว้น

ใช้ `allowBots` เมื่อคุณต้องการทราฟฟิก Matrix ระหว่างเอเจนต์โดยเจตนา:

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

- `allowBots: true` ยอมรับข้อความจากบัญชีบอต Matrix อื่นที่กำหนดค่าไว้ ในห้องและ DM ที่ได้รับอนุญาต
- `allowBots: "mentions"` ยอมรับข้อความเหล่านั้นเฉพาะเมื่อมีการกล่าวถึงบอตนี้อย่างชัดเจนในห้อง ส่วน DM ยังคงได้รับอนุญาต
- `groups.<room>.allowBots` จะ override การตั้งค่าระดับบัญชีสำหรับห้องหนึ่งห้อง
- OpenClaw จะยังคงละเว้นข้อความจาก Matrix user ID เดียวกัน เพื่อหลีกเลี่ยงลูปตอบกลับตัวเอง
- Matrix ไม่มีการเปิดเผยแฟล็กบอตแบบ native ในส่วนนี้ OpenClaw ถือว่า "เขียนโดยบอต" หมายถึง "ส่งมาจากอีกบัญชี Matrix ที่กำหนดค่าไว้บน Gateway OpenClaw นี้"

เมื่อเปิดใช้ทราฟฟิกบอตต่อบอตในห้องที่ใช้ร่วมกัน ให้ใช้ allowlist ของห้องที่เข้มงวดและข้อกำหนดการกล่าวถึง

## การเข้ารหัสและการยืนยันตัวตน

ในห้องที่เข้ารหัส (E2EE) event รูปภาพขาออกจะใช้ `thumbnail_file` เพื่อให้พรีวิวรูปภาพถูกเข้ารหัสไปพร้อมกับไฟล์แนบฉบับเต็ม ห้องที่ไม่ได้เข้ารหัสจะยังคงใช้ `thumbnail_url` แบบปกติ ไม่จำเป็นต้องกำหนดค่าใด ๆ — plugin จะตรวจจับสถานะ E2EE โดยอัตโนมัติ

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

ตรวจสอบสถานะการยืนยันตัวตน:

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

บูตสแตรปสถานะ cross-signing และการยืนยันตัวตน:

```bash
openclaw matrix verify bootstrap
```

การวินิจฉัย bootstrap แบบ verbose:

```bash
openclaw matrix verify bootstrap --verbose
```

บังคับรีเซ็ต identity ของ cross-signing ใหม่ก่อน bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

ยืนยันอุปกรณ์นี้ด้วย recovery key:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

รายละเอียดการยืนยันอุปกรณ์แบบ verbose:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

ตรวจสอบสถานะสำรอง room-key:

```bash
openclaw matrix verify backup status
```

การวินิจฉัยสถานะสำรองแบบ verbose:

```bash
openclaw matrix verify backup status --verbose
```

กู้คืน room keys จากข้อมูลสำรองบนเซิร์ฟเวอร์:

```bash
openclaw matrix verify backup restore
```

การวินิจฉัยการกู้คืนแบบ verbose:

```bash
openclaw matrix verify backup restore --verbose
```

ลบข้อมูลสำรองปัจจุบันบนเซิร์ฟเวอร์ และสร้าง baseline ของข้อมูลสำรองใหม่ หาก
ไม่สามารถโหลด backup key ที่จัดเก็บไว้ได้อย่างสมบูรณ์ การรีเซ็ตนี้ยังสามารถสร้าง secret storage ใหม่ได้ด้วย เพื่อให้
การเริ่มต้นแบบ cold start ในอนาคตโหลด backup key ใหม่ได้:

```bash
openclaw matrix verify backup reset --yes
```

คำสั่ง `verify` ทั้งหมดจะกระชับตามค่าเริ่มต้น (รวมถึงการบันทึกภายใน SDK แบบเงียบ) และจะแสดงการวินิจฉัยโดยละเอียดเฉพาะเมื่อใช้ `--verbose`
ใช้ `--json` สำหรับผลลัพธ์แบบ machine-readable เต็มรูปแบบเมื่อต้องการเขียนสคริปต์

ในการตั้งค่าแบบหลายบัญชี คำสั่ง CLI ของ Matrix จะใช้บัญชี Matrix ค่าเริ่มต้นโดยนัย เว้นแต่คุณจะส่ง `--account <id>`
หากคุณกำหนดค่าบัญชีที่มีชื่อหลายบัญชี ให้ตั้งค่า `channels.matrix.defaultAccount` ก่อน มิฉะนั้นการทำงาน CLI แบบนัยเหล่านั้นจะหยุดและขอให้คุณเลือกบัญชีอย่างชัดเจน
ใช้ `--account` ทุกครั้งเมื่อคุณต้องการให้การยืนยันตัวตนหรือการทำงานกับอุปกรณ์กำหนดเป้าหมายไปยังบัญชีที่มีชื่ออย่างชัดเจน:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

เมื่อการเข้ารหัสถูกปิดใช้งานหรือไม่พร้อมใช้งานสำหรับบัญชีที่มีชื่อ คำเตือนของ Matrix และข้อผิดพลาดการยืนยันตัวตนจะชี้ไปยัง config key ของบัญชีนั้น เช่น `channels.matrix.accounts.assistant.encryption`

### ความหมายของ "verified"

OpenClaw จะถือว่าอุปกรณ์ Matrix นี้ได้รับการยืนยันตัวตนแล้ว ก็ต่อเมื่ออุปกรณ์นั้นได้รับการยืนยันโดย identity cross-signing ของคุณเอง
ในทางปฏิบัติ `openclaw matrix verify status --verbose` จะแสดงสัญญาณความเชื่อถือ 3 อย่าง:

- `Locally trusted`: อุปกรณ์นี้ได้รับความเชื่อถือโดยไคลเอนต์ปัจจุบันเท่านั้น
- `Cross-signing verified`: SDK รายงานว่าอุปกรณ์ได้รับการยืนยันผ่าน cross-signing
- `Signed by owner`: อุปกรณ์นี้ถูกลงลายเซ็นโดย self-signing key ของคุณเอง

`Verified by owner` จะกลายเป็น `yes` ก็ต่อเมื่อมีการยืนยันผ่าน cross-signing หรือมี owner-signing
ความเชื่อถือในเครื่องเพียงอย่างเดียวไม่เพียงพอให้ OpenClaw ถือว่าอุปกรณ์ได้รับการยืนยันอย่างสมบูรณ์

### สิ่งที่ bootstrap ทำ

`openclaw matrix verify bootstrap` คือคำสั่งสำหรับซ่อมแซมและตั้งค่าบัญชี Matrix ที่เข้ารหัส
โดยจะทำสิ่งต่อไปนี้ทั้งหมดตามลำดับ:

- บูตสแตรป secret storage โดยนำ recovery key เดิมกลับมาใช้ซ้ำเมื่อเป็นไปได้
- บูตสแตรป cross-signing และอัปโหลด public cross-signing keys ที่ขาดหายไป
- พยายามทำเครื่องหมายและ cross-sign อุปกรณ์ปัจจุบัน
- สร้างข้อมูลสำรอง room-key ฝั่งเซิร์ฟเวอร์ใหม่ หากยังไม่มีอยู่

หาก homeserver ต้องใช้ interactive auth เพื่ออัปโหลด cross-signing keys, OpenClaw จะพยายามอัปโหลดโดยไม่ใช้ auth ก่อน จากนั้นใช้ `m.login.dummy` และสุดท้ายใช้ `m.login.password` เมื่อมีการกำหนดค่า `channels.matrix.password`

ใช้ `--force-reset-cross-signing` เฉพาะเมื่อคุณตั้งใจจะทิ้ง identity ของ cross-signing ปัจจุบันและสร้างใหม่เท่านั้น

หากคุณตั้งใจจะทิ้งข้อมูลสำรอง room-key ปัจจุบันและเริ่ม
baseline สำรองใหม่สำหรับข้อความในอนาคต ให้ใช้ `openclaw matrix verify backup reset --yes`
ให้ทำเช่นนี้เฉพาะเมื่อคุณยอมรับว่าประวัติที่เข้ารหัสเก่าซึ่งไม่สามารถกู้คืนได้จะยังคง
ไม่สามารถเข้าถึงได้ และ OpenClaw อาจสร้าง secret storage ใหม่หากไม่สามารถโหลด secret ของข้อมูลสำรองปัจจุบันได้อย่างปลอดภัย

### baseline ของข้อมูลสำรองใหม่

หากคุณต้องการให้ข้อความที่เข้ารหัสในอนาคตยังใช้งานได้ และยอมรับการสูญเสียประวัติเก่าที่ไม่สามารถกู้คืนได้ ให้รันคำสั่งเหล่านี้ตามลำดับ:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

เพิ่ม `--account <id>` ให้กับแต่ละคำสั่งเมื่อคุณต้องการกำหนดเป้าหมายไปยังบัญชี Matrix ที่มีชื่ออย่างชัดเจน

### พฤติกรรมเมื่อเริ่มต้นระบบ

เมื่อ `encryption: true`, Matrix จะตั้งค่า `startupVerification` เป็น `"if-unverified"` โดยค่าเริ่มต้น
เมื่อเริ่มต้นระบบ หากอุปกรณ์นี้ยังไม่ได้รับการยืนยัน Matrix จะร้องขอการยืนยันตัวเองในไคลเอนต์ Matrix อื่น
ข้ามคำขอซ้ำเมื่อมีคำขอที่ค้างอยู่แล้ว และใช้ช่วง cooldown ภายในเครื่องก่อนลองใหม่หลังการรีสตาร์ท
ตามค่าเริ่มต้น การพยายามส่งคำขอที่ล้มเหลวจะลองใหม่เร็วกว่ากรณีที่สร้างคำขอสำเร็จ
ตั้งค่า `startupVerification: "off"` เพื่อปิดการส่งคำขออัตโนมัติเมื่อเริ่มต้นระบบ หรือปรับ `startupVerificationCooldownHours`
หากคุณต้องการช่วงเวลาลองใหม่ที่สั้นลงหรือยาวขึ้น

การเริ่มต้นระบบยังทำกระบวนการ bootstrap ด้าน crypto แบบระมัดระวังโดยอัตโนมัติด้วย
กระบวนการนั้นจะพยายามใช้ secret storage และ identity ของ cross-signing ปัจจุบันซ้ำก่อน และหลีกเลี่ยงการรีเซ็ต cross-signing เว้นแต่คุณจะรัน flow ซ่อมแซม bootstrap แบบชัดเจน

หากระหว่างเริ่มต้นระบบยังพบสถานะ bootstrap ที่เสียหาย OpenClaw สามารถพยายามใช้เส้นทางซ่อมแซมแบบมีการป้องกันได้ แม้จะไม่ได้กำหนดค่า `channels.matrix.password` ไว้ก็ตาม
หาก homeserver ต้องใช้ UIA แบบรหัสผ่านสำหรับการซ่อมแซมนั้น OpenClaw จะบันทึกคำเตือนและคงการเริ่มต้นระบบไว้แบบไม่ร้ายแรงแทนการยุติบอต
หากอุปกรณ์ปัจจุบันได้รับการลงลายเซ็นโดยเจ้าของอยู่แล้ว OpenClaw จะคง identity นั้นไว้แทนที่จะรีเซ็ตโดยอัตโนมัติ

ดู [การย้าย Matrix](/th/install/migrating-matrix) สำหรับ flow การอัปเกรดแบบเต็ม ข้อจำกัด คำสั่งกู้คืน และข้อความการย้ายที่พบบ่อย

### การแจ้งเตือนการยืนยันตัวตน

Matrix จะโพสต์การแจ้งเตือนวงจรการยืนยันตัวตนลงในห้อง DM สำหรับการยืนยันตัวตนแบบเข้มงวดโดยตรงเป็นข้อความ `m.notice`
ซึ่งรวมถึง:

- การแจ้งเตือนคำขอยืนยันตัวตน
- การแจ้งเตือนพร้อมยืนยันตัวตน (พร้อมคำแนะนำ "Verify by emoji" อย่างชัดเจน)
- การแจ้งเตือนเริ่มต้นและเสร็จสิ้นการยืนยันตัวตน
- รายละเอียด SAS (emoji และเลขฐานสิบ) เมื่อมี

คำขอยืนยันตัวตนขาเข้าจากไคลเอนต์ Matrix อื่นจะถูกติดตามและยอมรับอัตโนมัติโดย OpenClaw
สำหรับ flow การยืนยันตัวเอง OpenClaw จะเริ่ม flow SAS อัตโนมัติด้วยเมื่อการยืนยันด้วย emoji พร้อมใช้งาน และยืนยันฝั่งของตัวเอง
สำหรับคำขอยืนยันตัวตนจากผู้ใช้/อุปกรณ์ Matrix อื่น OpenClaw จะยอมรับคำขอนั้นอัตโนมัติ จากนั้นรอให้ flow SAS ดำเนินต่อไปตามปกติ
คุณยังคงต้องเปรียบเทียบ emoji หรือ SAS แบบตัวเลขในไคลเอนต์ Matrix ของคุณ และยืนยัน "They match" ที่นั่นเพื่อให้การยืนยันตัวตนเสร็จสมบูรณ์

OpenClaw จะไม่ยอมรับ flow ซ้ำที่เริ่มจากตัวเองแบบอัตโนมัติโดยไม่ตรวจสอบ การเริ่มต้นระบบจะข้ามการสร้างคำขอใหม่เมื่อมีคำขอยืนยันตัวเองค้างอยู่แล้ว

การแจ้งเตือนของโปรโตคอล/ระบบการยืนยันตัวตนจะไม่ถูกส่งต่อไปยัง pipeline แชตของเอเจนต์ ดังนั้นจึงไม่ก่อให้เกิด `NO_REPLY`

### สุขอนามัยของอุปกรณ์

อุปกรณ์ Matrix เก่าที่ OpenClaw จัดการอาจสะสมอยู่ในบัญชี และทำให้การทำความเข้าใจความเชื่อถือในห้องที่เข้ารหัสทำได้ยากขึ้น
แสดงรายการได้ด้วย:

```bash
openclaw matrix devices list
```

ลบอุปกรณ์เก่าที่ OpenClaw จัดการไว้ด้วย:

```bash
openclaw matrix devices prune-stale
```

### ที่เก็บ crypto

Matrix E2EE ใช้เส้นทาง Rust crypto ของ `matrix-js-sdk` อย่างเป็นทางการใน Node โดยใช้ `fake-indexeddb` เป็น shim สำหรับ IndexedDB สถานะ crypto จะถูกจัดเก็บถาวรลงในไฟล์ snapshot (`crypto-idb-snapshot.json`) และกู้คืนเมื่อเริ่มต้นระบบ ไฟล์ snapshot นี้เป็นสถานะรันไทม์ที่มีความละเอียดอ่อนและถูกจัดเก็บด้วยสิทธิ์ไฟล์แบบจำกัด

สถานะรันไทม์ที่เข้ารหัสจะอยู่ภายใต้รูทแบบต่อบัญชี ต่อผู้ใช้ และต่อ token-hash ใน
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`
ไดเรกทอรีนั้นประกอบด้วย sync store (`bot-storage.json`), crypto store (`crypto/`),
ไฟล์ recovery key (`recovery-key.json`), IndexedDB snapshot (`crypto-idb-snapshot.json`),
การผูกเธรด (`thread-bindings.json`) และสถานะการยืนยันตัวตนเมื่อเริ่มต้นระบบ (`startup-verification.json`)
เมื่อ token เปลี่ยน แต่ตัวตนของบัญชียังคงเดิม OpenClaw จะนำรูทเดิมที่เหมาะสมที่สุด
สำหรับ tuple ของบัญชี/homeserver/ผู้ใช้นั้นกลับมาใช้ใหม่ เพื่อให้สถานะ sync เดิม สถานะ crypto เดิม การผูกเธรดเดิม
และสถานะการยืนยันตัวตนเมื่อเริ่มต้นระบบยังคงมองเห็นได้

## การจัดการโปรไฟล์

อัปเดต self-profile ของ Matrix สำหรับบัญชีที่เลือกด้วย:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

เพิ่ม `--account <id>` เมื่อคุณต้องการกำหนดเป้าหมายไปยังบัญชีที่มีชื่ออย่างชัดเจน

Matrix รับ URL avatar แบบ `mxc://` ได้โดยตรง เมื่อคุณส่ง URL avatar แบบ `http://` หรือ `https://` OpenClaw จะอัปโหลดไปยัง Matrix ก่อน แล้วบันทึก URL `mxc://` ที่ resolve แล้วกลับไปไว้ใน `channels.matrix.avatarUrl` (หรือ override ของบัญชีที่เลือก)

## เธรด

Matrix รองรับ Matrix threads แบบ native ทั้งสำหรับการตอบกลับอัตโนมัติและการส่งผ่านเครื่องมือข้อความ

- `dm.sessionScope: "per-user"` (ค่าเริ่มต้น) จะคงการกำหนดเส้นทาง Matrix DM ให้ยึดตามผู้ส่ง ดังนั้นหลายห้อง DM จึงใช้เซสชันเดียวกันร่วมกันได้เมื่อ resolve ไปยังคู่สนทนาคนเดียวกัน
- `dm.sessionScope: "per-room"` จะแยกแต่ละห้อง Matrix DM ออกเป็น session key ของตัวเอง ขณะเดียวกันก็ยังใช้การยืนยันตัวตน DM และการตรวจสอบ allowlist ตามปกติ
- การผูกบทสนทนา Matrix แบบ explicit ยังคงมีลำดับความสำคัญเหนือ `dm.sessionScope` ดังนั้นห้องและเธรดที่ถูก bind ไว้จะยังคงใช้เซสชันเป้าหมายที่เลือกไว้
- `threadReplies: "off"` จะคงคำตอบไว้ระดับบนสุด และเก็บข้อความเธรดขาเข้าไว้บนเซสชันของข้อความแม่
- `threadReplies: "inbound"` จะตอบภายในเธรดเฉพาะเมื่อข้อความขาเข้านั้นอยู่ในเธรดนั้นอยู่แล้ว
- `threadReplies: "always"` จะคงการตอบกลับในห้องให้อยู่ในเธรดที่มีรากจากข้อความที่กระตุ้น และกำหนดเส้นทางบทสนทนานั้นผ่านเซสชันแบบกำหนดขอบเขตตามเธรดที่ตรงกันจากข้อความที่กระตุ้นข้อความแรก
- `dm.threadReplies` จะ override การตั้งค่าระดับบนสุดสำหรับ DM เท่านั้น ตัวอย่างเช่น คุณสามารถแยกเธรดของห้องออกจากกัน ขณะเดียวกันก็ทำให้ DM เป็นแบบแบนได้
- ข้อความเธรดขาเข้าจะรวมข้อความรากของเธรดเป็นบริบทเพิ่มเติมให้เอเจนต์
- การส่งผ่านเครื่องมือข้อความจะสืบทอดเธรด Matrix ปัจจุบันโดยอัตโนมัติเมื่อเป้าหมายเป็นห้องเดียวกัน หรือเป็นผู้ใช้เป้าหมาย DM คนเดิม เว้นแต่จะระบุ `threadId` แบบ explicit
- การใช้เป้าหมายผู้ใช้ DM ซ้ำในเซสชันเดียวกันจะทำงานก็ต่อเมื่อ metadata ของเซสชันปัจจุบันพิสูจน์ได้ว่าเป็นคู่สนทนา DM คนเดิมบนบัญชี Matrix เดียวกันเท่านั้น มิฉะนั้น OpenClaw จะย้อนกลับไปใช้การกำหนดเส้นทางแบบกำหนดขอบเขตตามผู้ใช้ตามปกติ
- เมื่อ OpenClaw เห็นว่าห้อง Matrix DM หนึ่งชนกับอีกห้อง DM หนึ่งบนเซสชัน Matrix DM ที่ใช้ร่วมกันเดียวกัน ระบบจะโพสต์ `m.notice` แบบครั้งเดียวในห้องนั้นพร้อม escape hatch `/focus` เมื่อเปิดใช้การผูกเธรดและมีคำใบ้ `dm.sessionScope`
- Matrix รองรับการผูกเธรดในรันไทม์ `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และ `/acp spawn` แบบผูกกับเธรดใช้งานได้ในห้องและ DM ของ Matrix
- `/focus` ระดับบนสุดของห้อง/DM ใน Matrix จะสร้าง Matrix thread ใหม่และ bind เข้ากับเซสชันเป้าหมายเมื่อ `threadBindings.spawnSubagentSessions=true`
- การรัน `/focus` หรือ `/acp spawn --thread here` ภายใน Matrix thread ที่มีอยู่แล้ว จะ bind เธรดปัจจุบันนั้นแทน

## การผูกบทสนทนา ACP

ห้อง Matrix, DM และ Matrix thread ที่มีอยู่แล้ว สามารถเปลี่ยนเป็น ACP workspace แบบถาวรได้โดยไม่ต้องเปลี่ยนพื้นผิวแชต

โฟลว์ด่วนสำหรับผู้ปฏิบัติงาน:

- รัน `/acp spawn codex --bind here` ภายใน Matrix DM ห้อง หรือเธรดที่มีอยู่แล้วที่คุณต้องการใช้งานต่อ
- ใน Matrix DM หรือห้องระดับบนสุด DM/ห้องปัจจุบันจะยังคงเป็นพื้นผิวแชต และข้อความในอนาคตจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ถูกสร้างขึ้น
- ภายใน Matrix thread ที่มีอยู่แล้ว `--bind here` จะ bind เธรดปัจจุบันนั้นในตำแหน่งเดิม
- `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP ที่ bind เดิมนั้นในตำแหน่งเดิม
- `/acp close` จะปิดเซสชัน ACP และลบการ bind

หมายเหตุ:

- `--bind here` จะไม่สร้าง Matrix thread ลูก
- ต้องใช้ `threadBindings.spawnAcpSessions` เฉพาะสำหรับ `/acp spawn --thread auto|here` ซึ่ง OpenClaw จำเป็นต้องสร้างหรือ bind Matrix thread ลูก

### การกำหนดค่าการผูกเธรด

Matrix สืบทอดค่าเริ่มต้นแบบ global จาก `session.threadBindings` และยังรองรับ override ระดับ channel ต่อไปนี้:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

แฟล็กการสร้างแบบผูกกับเธรดของ Matrix เป็นแบบต้องเปิดใช้เอง:

- ตั้งค่า `threadBindings.spawnSubagentSessions: true` เพื่ออนุญาตให้ `/focus` ระดับบนสุดสร้างและ bind Matrix thread ใหม่
- ตั้งค่า `threadBindings.spawnAcpSessions: true` เพื่ออนุญาตให้ `/acp spawn --thread auto|here` bind เซสชัน ACP เข้ากับ Matrix threads

## รีแอ็กชัน

Matrix รองรับการทำงานของรีแอ็กชันขาออก การแจ้งเตือนรีแอ็กชันขาเข้า และรีแอ็กชันตอบรับขาเข้า

- เครื่องมือรีแอ็กชันขาออกถูกควบคุมด้วย `channels["matrix"].actions.reactions`
- `react` เพิ่มรีแอ็กชันให้กับ Matrix event ที่ระบุ
- `reactions` แสดงสรุปรีแอ็กชันปัจจุบันสำหรับ Matrix event ที่ระบุ
- `emoji=""` จะลบรีแอ็กชันของบัญชีบอตเองบน event นั้น
- `remove: true` จะลบเฉพาะรีแอ็กชันอีโมจิที่ระบุจากบัญชีบอต

ขอบเขตของรีแอ็กชันตอบรับจะ resolve ตามลำดับมาตรฐานของ OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback เป็นอีโมจิ identity ของเอเจนต์

ขอบเขตของรีแอ็กชันตอบรับจะ resolve ตามลำดับนี้:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

โหมดการแจ้งเตือนรีแอ็กชันจะ resolve ตามลำดับนี้:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- ค่าเริ่มต้น: `own`

พฤติกรรม:

- `reactionNotifications: "own"` จะส่งต่อ event `m.reaction` ที่ถูกเพิ่มเข้ามา เมื่อ event เหล่านั้นกำหนดเป้าหมายไปยังข้อความ Matrix ที่เขียนโดยบอต
- `reactionNotifications: "off"` จะปิด event ระบบของรีแอ็กชัน
- การลบรีแอ็กชันจะไม่ถูกสังเคราะห์เป็น event ระบบ เพราะ Matrix แสดงสิ่งเหล่านั้นเป็น redaction ไม่ใช่การลบ `m.reaction` แบบแยกเดี่ยว

## บริบทประวัติ

- `channels.matrix.historyLimit` ควบคุมจำนวนข้อความล่าสุดในห้องที่จะถูกรวมเป็น `InboundHistory` เมื่อข้อความห้อง Matrix กระตุ้นเอเจนต์ หากไม่ได้ตั้งค่า จะ fallback ไปใช้ `messages.groupChat.historyLimit`; หากไม่ได้ตั้งค่าทั้งคู่ ค่าใช้งานจริงเริ่มต้นคือ `0` ตั้งค่าเป็น `0` เพื่อปิดใช้งาน
- ประวัติห้อง Matrix เป็นแบบเฉพาะห้องเท่านั้น DM ยังคงใช้ประวัติเซสชันตามปกติ
- ประวัติห้อง Matrix เป็นแบบ pending-only: OpenClaw จะบัฟเฟอร์ข้อความในห้องที่ยังไม่ได้กระตุ้นการตอบกลับ จากนั้นจึง snapshot หน้าต่างนั้นเมื่อมีการกล่าวถึงหรือทริกเกอร์อื่นเข้ามา
- ข้อความทริกเกอร์ปัจจุบันจะไม่ถูกรวมใน `InboundHistory`; ข้อความนั้นจะยังคงอยู่ในเนื้อหาขาเข้าหลักของเทิร์นนั้น
- การลองใหม่ของ Matrix event เดิมจะใช้ snapshot ประวัติเดิมซ้ำ แทนที่จะเลื่อนไปใช้ข้อความในห้องที่ใหม่กว่า

## การมองเห็นบริบท

Matrix รองรับตัวควบคุม `contextVisibility` แบบใช้ร่วมกันสำหรับบริบทห้องเสริม เช่น ข้อความตอบกลับที่ดึงมา รากเธรด และประวัติที่ค้างอยู่

- `contextVisibility: "all"` เป็นค่าเริ่มต้น บริบทเสริมจะถูกรักษาไว้ตามที่ได้รับ
- `contextVisibility: "allowlist"` จะกรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่ได้รับอนุญาตตามการตรวจสอบ allowlist ของห้อง/ผู้ใช้ที่กำลังใช้งานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บข้อความตอบกลับที่อ้างอิงแบบ explicit ไว้หนึ่งรายการ

การตั้งค่านี้มีผลกับการมองเห็นของบริบทเสริม ไม่ใช่ว่าข้อความขาเข้าเองสามารถกระตุ้นการตอบกลับได้หรือไม่
การอนุญาตให้ทริกเกอร์ยังคงมาจาก `groupPolicy`, `groups`, `groupAllowFrom` และการตั้งค่านโยบาย DM

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

ดู [Groups](/th/channels/groups) สำหรับพฤติกรรมการบังคับกล่าวถึงและ allowlist

ตัวอย่างการจับคู่สำหรับ Matrix DM:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

หากผู้ใช้ Matrix ที่ยังไม่ได้รับอนุมัติยังคงส่งข้อความถึงคุณก่อนการอนุมัติ OpenClaw จะใช้รหัสการจับคู่ที่รอดำเนินการเดิมซ้ำ และอาจส่งข้อความเตือนอีกครั้งหลังช่วง cooldown สั้น ๆ แทนการสร้างรหัสใหม่

ดู [Pairing](/th/channels/pairing) สำหรับโฟลว์การจับคู่ DM แบบใช้ร่วมกันและโครงสร้างการจัดเก็บ

## การซ่อมแซมห้อง direct

หากสถานะ direct-message ไม่ตรงกัน OpenClaw อาจลงเอยด้วย mapping `m.direct` ที่ล้าสมัยซึ่งชี้ไปยังห้องเดี่ยวเก่าแทน DM ที่ใช้งานอยู่ ตรวจสอบ mapping ปัจจุบันสำหรับคู่สนทนาด้วย:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

ซ่อมแซมด้วย:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

โฟลว์การซ่อมแซม:

- ให้ความสำคัญกับ DM แบบ 1:1 ที่เข้มงวดซึ่งถูกแมปอยู่แล้วใน `m.direct`
- fallback ไปยัง DM แบบ 1:1 ที่เข้าร่วมอยู่ในปัจจุบันกับผู้ใช้นั้น
- สร้างห้อง direct ใหม่และเขียน `m.direct` ใหม่ หากไม่มี DM ที่สมบูรณ์ใช้งานได้

โฟลว์การซ่อมแซมจะไม่ลบห้องเก่าโดยอัตโนมัติ โดยจะเพียงเลือก DM ที่สมบูรณ์และอัปเดต mapping เพื่อให้การส่ง Matrix ใหม่ การแจ้งเตือนการยืนยันตัวตน และโฟลว์ direct-message อื่น ๆ กลับไปกำหนดเป้าหมายห้องที่ถูกต้องอีกครั้ง

## การอนุมัติ exec

Matrix สามารถทำหน้าที่เป็นไคลเอนต์การอนุมัติแบบ native สำหรับบัญชี Matrix ได้ โดยตัวควบคุม
การกำหนดเส้นทาง DM/channel แบบ native ยังคงอยู่ภายใต้ config การอนุมัติ exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (ไม่บังคับ; fallback ไปใช้ `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

ผู้อนุมัติต้องเป็น Matrix user ID เช่น `@owner:example.org` Matrix จะเปิดใช้การอนุมัติแบบ native โดยอัตโนมัติเมื่อ `enabled` ไม่ได้ตั้งค่าไว้หรือเป็น `"auto"` และสามารถ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งราย การอนุมัติ exec ใช้ `execApprovals.approvers` ก่อน และสามารถ fallback ไปใช้ `channels.matrix.dm.allowFrom` ได้ การอนุมัติ plugin จะอนุญาตผ่าน `channels.matrix.dm.allowFrom` ตั้งค่า `enabled: false` เพื่อปิด Matrix ในฐานะไคลเอนต์การอนุมัติแบบ native อย่างชัดเจน มิฉะนั้นคำขออนุมัติจะ fallback ไปยังเส้นทางการอนุมัติอื่นที่กำหนดค่าไว้หรือนโยบาย fallback ของการอนุมัติ

การกำหนดเส้นทาง native ของ Matrix รองรับการอนุมัติทั้งสองประเภท:

- `channels.matrix.execApprovals.*` ควบคุมโหมด fanout ของ DM/channel แบบ native สำหรับพรอมป์ตการอนุมัติของ Matrix
- การอนุมัติ exec ใช้ชุดผู้อนุมัติ exec จาก `execApprovals.approvers` หรือ `channels.matrix.dm.allowFrom`
- การอนุมัติ plugin ใช้ Matrix DM allowlist จาก `channels.matrix.dm.allowFrom`
- ทางลัดรีแอ็กชันและการอัปเดตข้อความของ Matrix ใช้ได้กับทั้งการอนุมัติ exec และ plugin

กฎการส่ง:

- `target: "dm"` จะส่งพรอมป์ตการอนุมัติไปยัง DM ของผู้อนุมัติ
- `target: "channel"` จะส่งพรอมป์ตกลับไปยังห้อง Matrix หรือ DM ต้นทาง
- `target: "both"` จะส่งไปยัง DM ของผู้อนุมัติและห้อง Matrix หรือ DM ต้นทาง

พรอมป์ตการอนุมัติของ Matrix จะใส่ทางลัดรีแอ็กชันไว้ในข้อความการอนุมัติหลัก:

- `✅` = อนุญาตครั้งเดียว
- `❌` = ปฏิเสธ
- `♾️` = อนุญาตตลอดไป เมื่อการตัดสินใจนั้นได้รับอนุญาตโดยนโยบาย exec ที่มีผลใช้งานจริง

ผู้อนุมัติสามารถรีแอ็กกับข้อความนั้น หรือใช้คำสั่ง slash สำรอง: `/approve <id> allow-once`, `/approve <id> allow-always`, หรือ `/approve <id> deny`

เฉพาะผู้อนุมัติที่ resolve ได้เท่านั้นที่สามารถอนุมัติหรือปฏิเสธได้ สำหรับการอนุมัติ exec การส่งผ่าน channel จะรวมข้อความคำสั่งด้วย ดังนั้นควรเปิดใช้ `channel` หรือ `both` เฉพาะในห้องที่เชื่อถือได้เท่านั้น

override ระดับบัญชี:

- `channels.matrix.accounts.<account>.execApprovals`

เอกสารที่เกี่ยวข้อง: [การอนุมัติ exec](/th/tools/exec-approvals)

## คำสั่ง slash

คำสั่ง slash ของ Matrix (เช่น `/new`, `/reset`, `/model`) ใช้งานได้โดยตรงใน DM ในห้อง OpenClaw ยังสามารถรู้จักคำสั่ง slash ที่ขึ้นต้นด้วยการ mention Matrix ของบอตเองได้ด้วย ดังนั้น `@bot:server /new` จะเรียกเส้นทางคำสั่งโดยไม่ต้องใช้ regex mention แบบกำหนดเอง วิธีนี้ช่วยให้บอตยังตอบสนองต่อโพสต์แบบห้องลักษณะ `@mention /command` ที่ Element และไคลเอนต์ลักษณะเดียวกันส่งออกมาเมื่อผู้ใช้ทำ tab-complete ชื่อบอตก่อนพิมพ์คำสั่ง

กฎการอนุญาตยังคงมีผล: ผู้ส่งคำสั่งต้องผ่านนโยบาย allowlist/owner ของ DM หรือห้อง เช่นเดียวกับข้อความทั่วไป

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
คุณสามารถกำหนดขอบเขตรายการห้องที่สืบทอดมาให้ใช้กับบัญชี Matrix เดียวได้ด้วย `groups.<room>.account`
รายการที่ไม่มี `account` จะยังคงใช้ร่วมกันระหว่างทุกบัญชี Matrix และรายการที่มี `account: "default"` ก็ยังใช้งานได้เมื่อกำหนดค่าบัญชีค่าเริ่มต้นไว้โดยตรงที่ `channels.matrix.*` ระดับบนสุด
ค่าเริ่มต้นการยืนยันตัวตนแบบแชร์บางส่วนจะไม่สร้างบัญชีค่าเริ่มต้นแบบ implicit แยกต่างหากด้วยตัวเอง OpenClaw จะสังเคราะห์บัญชี `default` ระดับบนสุดก็ต่อเมื่อค่าเริ่มต้นนั้นมีข้อมูลยืนยันตัวตนใหม่ (`homeserver` ร่วมกับ `accessToken` หรือ `homeserver` ร่วมกับ `userId` และ `password`) เท่านั้น; บัญชีที่มีชื่อยังคงสามารถถูกค้นพบได้จาก `homeserver` ร่วมกับ `userId` เมื่อข้อมูลรับรองที่ cache ไว้ทำให้การยืนยันตัวตนสมบูรณ์ในภายหลัง
หาก Matrix มีบัญชีที่มีชื่ออยู่แล้วเพียงหนึ่งบัญชี หรือ `defaultAccount` ชี้ไปยังคีย์บัญชีที่มีชื่อซึ่งมีอยู่แล้ว การซ่อมแซม/ตั้งค่าการยกระดับจากบัญชีเดียวไปหลายบัญชีจะคงบัญชีนั้นไว้แทนการสร้างรายการ `accounts.default` ใหม่ เฉพาะคีย์การยืนยันตัวตน/bootstrap ของ Matrix เท่านั้นที่จะถูกย้ายเข้าไปยังบัญชีที่ถูกยกระดับนั้น; คีย์นโยบายการส่งแบบแชร์จะยังอยู่ที่ระดับบนสุด
ตั้งค่า `defaultAccount` เมื่อคุณต้องการให้ OpenClaw เลือกใช้บัญชี Matrix ที่มีชื่อบัญชีหนึ่งก่อนสำหรับการกำหนดเส้นทาง การ probe และการทำงานของ CLI แบบ implicit
หากมีการกำหนดค่าหลายบัญชี Matrix และหนึ่งใน account id คือ `default` OpenClaw จะใช้บัญชีนั้นแบบ implicit แม้จะไม่ได้ตั้งค่า `defaultAccount`
หากคุณกำหนดค่าหลายบัญชีที่มีชื่อ ให้ตั้งค่า `defaultAccount` หรือส่ง `--account <id>` สำหรับคำสั่ง CLI ที่อาศัยการเลือกบัญชีแบบ implicit
ส่ง `--account <id>` ให้ `openclaw matrix verify ...` และ `openclaw matrix devices ...` เมื่อคุณต้องการ override การเลือกแบบ implicit นั้นสำหรับคำสั่งเดียว

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#multi-account-all-channels) สำหรับรูปแบบหลายบัญชีแบบใช้ร่วมกัน

## homeserver แบบ private/LAN

ตามค่าเริ่มต้น OpenClaw จะบล็อก homeserver Matrix แบบ private/internal เพื่อป้องกัน SSRF เว้นแต่คุณจะ
เลือกเปิดใช้งานอย่างชัดเจนเป็นรายบัญชี

หาก homeserver ของคุณรันอยู่บน localhost, IP ของ LAN/Tailscale หรือโฮสต์เนมภายใน ให้เปิดใช้
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

การเลือกเปิดใช้งานนี้อนุญาตเฉพาะเป้าหมาย private/internal ที่เชื่อถือได้เท่านั้น homeserver แบบข้อความชัดเจนสาธารณะ เช่น
`http://matrix.example.org:8008` จะยังคงถูกบล็อก แนะนำให้ใช้ `https://` เมื่อเป็นไปได้

## การใช้พร็อกซีกับทราฟฟิก Matrix

หากระบบ Matrix ของคุณต้องการพร็อกซี HTTP(S) ขาออกแบบ explicit ให้ตั้งค่า `channels.matrix.proxy`:

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
OpenClaw ใช้การตั้งค่าพร็อกซีเดียวกันสำหรับทราฟฟิก Matrix ระหว่างรันไทม์และการ probe สถานะบัญชี

## การ resolve เป้าหมาย

Matrix ยอมรับรูปแบบเป้าหมายเหล่านี้ทุกที่ที่ OpenClaw ขอให้คุณระบุห้องหรือผู้ใช้เป้าหมาย:

- ผู้ใช้: `@user:server`, `user:@user:server`, หรือ `matrix:user:@user:server`
- ห้อง: `!room:server`, `room:!room:server`, หรือ `matrix:room:!room:server`
- alias: `#alias:server`, `channel:#alias:server`, หรือ `matrix:channel:#alias:server`

การค้นหาไดเรกทอรีแบบสดใช้บัญชี Matrix ที่เข้าสู่ระบบอยู่:

- การค้นหาผู้ใช้จะสืบค้นไดเรกทอรีผู้ใช้ Matrix บน homeserver นั้น
- การค้นหาห้องจะยอมรับ room ID และ alias แบบ explicit โดยตรง จากนั้นจึง fallback ไปค้นหาชื่อห้องที่เข้าร่วมอยู่ของบัญชีนั้น
- การค้นหาชื่อห้องที่เข้าร่วมอยู่เป็นแบบ best-effort หากไม่สามารถ resolve ชื่อห้องเป็น ID หรือ alias ได้ ระบบจะเพิกเฉยระหว่างการ resolve allowlist ในรันไทม์

## ข้อมูลอ้างอิงการกำหนดค่า

- `enabled`: เปิดหรือปิด channel
- `name`: ป้ายชื่อเพิ่มเติมสำหรับบัญชี
- `defaultAccount`: account ID ที่ต้องการให้ใช้เป็นหลักเมื่อมีการกำหนดค่าหลายบัญชี Matrix
- `homeserver`: URL ของ homeserver เช่น `https://matrix.example.org`
- `network.dangerouslyAllowPrivateNetwork`: อนุญาตให้บัญชี Matrix นี้เชื่อมต่อกับ homeserver แบบ private/internal เปิดใช้เมื่อ homeserver resolve ไปยัง `localhost`, IP ของ LAN/Tailscale หรือโฮสต์ภายใน เช่น `matrix-synapse`
- `proxy`: URL ของพร็อกซี HTTP(S) สำหรับทราฟฟิก Matrix แบบเพิ่มเติม บัญชีที่มีชื่อสามารถ override ค่าเริ่มต้นระดับบนสุดด้วย `proxy` ของตนเองได้
- `userId`: Matrix user ID แบบเต็ม เช่น `@bot:example.org`
- `accessToken`: access token สำหรับการยืนยันตัวตนแบบใช้ token รองรับทั้งค่า plaintext และค่า SecretRef สำหรับ `channels.matrix.accessToken` และ `channels.matrix.accounts.<id>.accessToken` ผ่านผู้ให้บริการ env/file/exec ดู [การจัดการ Secrets](/th/gateway/secrets)
- `password`: รหัสผ่านสำหรับการเข้าสู่ระบบแบบใช้รหัสผ่าน รองรับทั้งค่า plaintext และค่า SecretRef
- `deviceId`: Matrix device ID แบบ explicit
- `deviceName`: ชื่ออุปกรณ์ที่แสดงสำหรับการเข้าสู่ระบบด้วยรหัสผ่าน
- `avatarUrl`: URL avatar ของตนเองที่จัดเก็บไว้สำหรับการซิงก์โปรไฟล์และการอัปเดต `profile set`
- `initialSyncLimit`: จำนวน event สูงสุดที่จะดึงระหว่าง startup sync
- `encryption`: เปิดใช้ E2EE
- `allowlistOnly`: เมื่อเป็น `true` จะยกระดับนโยบายห้อง `open` เป็น `allowlist` และบังคับให้นโยบาย DM ที่กำลังใช้งานอยู่ทั้งหมดยกเว้น `disabled` (รวมถึง `pairing` และ `open`) กลายเป็น `allowlist` ไม่มีผลกับนโยบาย `disabled`
- `allowBots`: อนุญาตข้อความจากบัญชี Matrix ของ OpenClaw อื่นที่กำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `groupPolicy`: `open`, `allowlist`, หรือ `disabled`
- `contextVisibility`: โหมดการมองเห็นบริบทห้องเสริม (`all`, `allowlist`, `allowlist_quote`)
- `groupAllowFrom`: allowlist ของ user ID สำหรับทราฟฟิกในห้อง Matrix user ID แบบเต็มปลอดภัยที่สุด; รายการที่ตรงกับไดเรกทอรีแบบ exact จะถูก resolve ตอนเริ่มต้นและเมื่อ allowlist เปลี่ยนระหว่างที่ monitor กำลังทำงาน รายการที่ resolve ไม่ได้จะถูกเพิกเฉย
- `historyLimit`: จำนวนข้อความในห้องสูงสุดที่จะรวมเป็นบริบทประวัติกลุ่ม หากไม่ได้ตั้งค่า จะ fallback ไปใช้ `messages.groupChat.historyLimit`; หากไม่ได้ตั้งค่าทั้งคู่ ค่าใช้งานจริงเริ่มต้นคือ `0` ตั้งค่าเป็น `0` เพื่อปิดใช้งาน
- `replyToMode`: `off`, `first`, `all`, หรือ `batched`
- `markdown`: การกำหนดค่าการเรนเดอร์ Markdown สำหรับข้อความ Matrix ขาออกแบบเพิ่มเติม
- `streaming`: `off` (ค่าเริ่มต้น), `"partial"`, `"quiet"`, `true`, หรือ `false` `"partial"` และ `true` เปิดใช้การอัปเดตฉบับร่างแบบพรีวิวก่อนด้วยข้อความ Matrix ปกติ `"quiet"` ใช้การแจ้งพรีวิวแบบไม่แจ้งเตือนสำหรับการตั้งค่า push rule บนระบบ self-hosted `false` มีความหมายเท่ากับ `"off"`
- `blockStreaming`: `true` เปิดใช้ข้อความความคืบหน้าแยกต่างหากสำหรับบล็อก assistant ที่เสร็จแล้ว ขณะที่การสตรีมฉบับร่างแบบพรีวิวกำลังทำงาน
- `threadReplies`: `off`, `inbound`, หรือ `always`
- `threadBindings`: override ระดับ channel สำหรับการกำหนดเส้นทางและวงจรชีวิตของเซสชันที่ผูกกับเธรด
- `startupVerification`: โหมดคำขอยืนยันตัวเองอัตโนมัติเมื่อเริ่มต้นระบบ (`if-unverified`, `off`)
- `startupVerificationCooldownHours`: ระยะ cooldown ก่อนลองคำขอยืนยันตัวตนอัตโนมัติเมื่อเริ่มต้นระบบอีกครั้ง
- `textChunkLimit`: ขนาดชิ้นข้อความขาออกเป็นจำนวนอักขระ (ใช้เมื่อ `chunkMode` เป็น `length`)
- `chunkMode`: `length` แบ่งข้อความตามจำนวนอักขระ; `newline` แบ่งตามขอบเขตบรรทัด
- `responsePrefix`: สตริงเพิ่มเติมที่นำหน้าคำตอบขาออกทั้งหมดสำหรับ channel นี้
- `ackReaction`: override รีแอ็กชันตอบรับแบบเพิ่มเติมสำหรับ channel/บัญชีนี้
- `ackReactionScope`: override ขอบเขตรีแอ็กชันตอบรับแบบเพิ่มเติม (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`)
- `reactionNotifications`: โหมดการแจ้งเตือนรีแอ็กชันขาเข้า (`own`, `off`)
- `mediaMaxMb`: ขีดจำกัดขนาดสื่อเป็น MB สำหรับการส่งขาออกและการประมวลผลสื่อขาเข้า
- `autoJoin`: นโยบายเข้าร่วมอัตโนมัติจากคำเชิญ (`always`, `allowlist`, `off`) ค่าเริ่มต้น: `off` ใช้กับคำเชิญ Matrix ทั้งหมด รวมถึงคำเชิญแบบ DM
- `autoJoinAllowlist`: ห้อง/alias ที่อนุญาตเมื่อ `autoJoin` เป็น `allowlist` รายการ alias จะถูก resolve เป็น room ID ระหว่างจัดการคำเชิญ; OpenClaw จะไม่เชื่อถือสถานะ alias ที่ห้องที่ถูกเชิญอ้างว่าเป็น
- `dm`: บล็อกนโยบาย DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`)
- `dm.policy`: ควบคุมการเข้าถึง DM หลังจากที่ OpenClaw เข้าร่วมห้องและจัดประเภทว่าเป็น DM แล้ว ไม่ได้เปลี่ยนว่าคำเชิญจะถูกเข้าร่วมอัตโนมัติหรือไม่
- `dm.allowFrom`: allowlist ของ user ID สำหรับทราฟฟิก DM Matrix user ID แบบเต็มปลอดภัยที่สุด; รายการที่ตรงกับไดเรกทอรีแบบ exact จะถูก resolve ตอนเริ่มต้นและเมื่อ allowlist เปลี่ยนระหว่างที่ monitor กำลังทำงาน รายการที่ resolve ไม่ได้จะถูกเพิกเฉย
- `dm.sessionScope`: `per-user` (ค่าเริ่มต้น) หรือ `per-room` ใช้ `per-room` เมื่อคุณต้องการให้แต่ละห้อง Matrix DM แยกบริบทออกจากกัน แม้ว่าคู่สนทนาจะเป็นคนเดียวกันก็ตาม
- `dm.threadReplies`: override นโยบายเธรดสำหรับ DM เท่านั้น (`off`, `inbound`, `always`) โดยจะ override การตั้งค่า `threadReplies` ระดับบนสุดทั้งสำหรับตำแหน่งการตอบกลับและการแยกเซสชันใน DM
- `execApprovals`: การส่งการอนุมัติ exec แบบ native ของ Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`)
- `execApprovals.approvers`: Matrix user ID ที่ได้รับอนุญาตให้อนุมัติคำขอ exec เป็นค่าเพิ่มเติมเมื่อ `dm.allowFrom` ระบุผู้อนุมัติไว้อยู่แล้ว
- `execApprovals.target`: `dm | channel | both` (ค่าเริ่มต้น: `dm`)
- `accounts`: override แบบมีชื่อรายบัญชี ค่า `channels.matrix` ระดับบนสุดทำหน้าที่เป็นค่าเริ่มต้นสำหรับรายการเหล่านี้
- `groups`: แผนที่นโยบายรายห้อง แนะนำให้ใช้ room ID หรือ alias; ชื่อห้องที่ resolve ไม่ได้จะถูกเพิกเฉยระหว่างรันไทม์ ตัวตนของ session/group จะใช้ room ID ที่เสถียรหลังการ resolve
- `groups.<room>.account`: จำกัดรายการห้องที่สืบทอดมาหนึ่งรายการให้ใช้กับบัญชี Matrix ที่ระบุในการตั้งค่าแบบหลายบัญชี
- `groups.<room>.allowBots`: override ระดับห้องสำหรับผู้ส่งที่เป็นบอตที่กำหนดค่าไว้ (`true` หรือ `"mentions"`)
- `groups.<room>.users`: allowlist ผู้ส่งรายห้อง
- `groups.<room>.tools`: override อนุญาต/ปฏิเสธเครื่องมือรายห้อง
- `groups.<room>.autoReply`: override ระดับห้องสำหรับการบังคับกล่าวถึง `true` ปิดข้อกำหนดการกล่าวถึงสำหรับห้องนั้น; `false` บังคับให้กลับมาเปิดอีกครั้ง
- `groups.<room>.skills`: ตัวกรอง Skills ระดับห้องแบบเพิ่มเติม
- `groups.<room>.systemPrompt`: ชิ้นส่วน system prompt ระดับห้องแบบเพิ่มเติม
- `rooms`: alias แบบเดิมของ `groups`
- `actions`: การควบคุมเครื่องมือรายแอ็กชัน (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`)

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — channels ที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการบังคับการกล่าวถึง
- [การกำหนดเส้นทาง Channel](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้ระบบแข็งแกร่งขึ้น
