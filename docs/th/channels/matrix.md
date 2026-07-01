---
read_when:
    - การตั้งค่า Matrix ใน OpenClaw
    - การกำหนดค่า Matrix E2EE และการยืนยัน
summary: สถานะการรองรับ Matrix การตั้งค่า และตัวอย่างการกำหนดค่า
title: เมทริกซ์
x-i18n:
    generated_at: "2026-07-01T13:27:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2aa86a477c4f15e792ba01c45bb06f37a55fee26ee2c895bfa308ff57ef6d819
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

สเปก Plugin แบบสั้นจะลองใช้ ClawHub ก่อน แล้วจึง fallback ไป npm หากต้องการบังคับแหล่ง registry ให้ใช้ `openclaw plugins install clawhub:@openclaw/matrix` หรือ `openclaw plugins install npm:@openclaw/matrix`

จาก checkout ภายในเครื่อง:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` จะลงทะเบียนและเปิดใช้งาน Plugin ดังนั้นจึงไม่ต้องมีขั้นตอน `openclaw plugins enable matrix` แยกต่างหาก Plugin จะยังไม่ทำงานจนกว่าคุณจะกำหนดค่าช่องทางด้านล่าง ดู [Plugins](/th/tools/plugin) สำหรับพฤติกรรม Plugin และกฎการติดตั้งทั่วไป

## การตั้งค่า

1. สร้างบัญชี Matrix บน homeserver ของคุณ
2. กำหนดค่า `channels.matrix` ด้วย `homeserver` + `accessToken` หรือ `homeserver` + `userId` + `password`
3. รีสตาร์ท Gateway
4. เริ่ม DM กับบอต หรือเชิญบอตเข้าห้อง (ดู [auto-join](#auto-join) - คำเชิญใหม่จะเข้าได้ก็ต่อเมื่อ `autoJoin` อนุญาตเท่านั้น)

### การตั้งค่าแบบโต้ตอบ

```bash
openclaw channels add
openclaw configure --section channels
```

วิซาร์ดจะถาม: URL ของ homeserver, วิธี auth (access token หรือ password), user ID (เฉพาะ password auth), ชื่ออุปกรณ์เสริม, ว่าจะเปิดใช้ E2EE หรือไม่ และว่าจะกำหนดค่าการเข้าถึงห้องกับ auto-join หรือไม่

หากมี env vars `MATRIX_*` ที่ตรงกันอยู่แล้ว และบัญชีที่เลือกยังไม่มี auth ที่บันทึกไว้ วิซาร์ดจะเสนอทางลัด env-var หากต้องการ resolve ชื่อห้องก่อนบันทึก allowlist ให้รัน `openclaw channels resolve --channel matrix "Project Room"` เมื่อเปิดใช้ E2EE วิซาร์ดจะเขียน config และรัน bootstrap เดียวกับ [`openclaw matrix encryption setup`](#encryption-and-verification)

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

แบบใช้ password (token จะถูก cache หลัง login ครั้งแรก):

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

`channels.matrix.autoJoin` มีค่า default เป็น `off` ด้วยค่า default บอตจะไม่ปรากฏในห้องใหม่หรือ DM จากคำเชิญใหม่จนกว่าคุณจะ join เอง

OpenClaw ไม่สามารถบอกได้ในเวลารับคำเชิญว่าห้องที่ถูกเชิญเป็น DM หรือกลุ่ม ดังนั้นทุกคำเชิญ รวมถึงคำเชิญแบบ DM จะผ่าน `autoJoin` ก่อน `dm.policy` จะมีผลภายหลังเท่านั้น หลังจากบอต join แล้วและห้องถูกจัดประเภทแล้ว

<Warning>
ตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` เพื่อจำกัดว่าบอตจะยอมรับคำเชิญใด หรือ `autoJoin: "always"` เพื่อยอมรับทุกคำเชิญ

`autoJoinAllowlist` รับเฉพาะเป้าหมายที่เสถียร: `!roomId:server`, `#alias:server` หรือ `*` ชื่อห้องแบบข้อความธรรมดาจะถูกปฏิเสธ รายการ alias จะถูก resolve กับ homeserver ไม่ใช่กับ state ที่ห้องที่เชิญอ้างไว้
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

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): ใช้ `@user:server` ชื่อที่แสดงจะถูกละเว้นตามค่า default เพราะเปลี่ยนแปลงได้ ตั้งค่า `dangerouslyAllowNameMatching: true` เฉพาะเมื่อคุณต้องการ compatibility กับรายการชื่อที่แสดงอย่างชัดเจน
- คีย์ allowlist ของห้อง (`groups`, `rooms` เดิม): ใช้ `!room:server` หรือ `#alias:server` ชื่อห้องแบบข้อความธรรมดาจะถูกละเว้นตามค่า default ตั้งค่า `dangerouslyAllowNameMatching: true` เฉพาะเมื่อคุณต้องการ compatibility กับการค้นหาชื่อห้องที่ join แล้วอย่างชัดเจน
- allowlist คำเชิญ (`autoJoinAllowlist`): ใช้ `!room:server`, `#alias:server` หรือ `*` ชื่อห้องแบบข้อความธรรมดาจะถูกปฏิเสธ

### การทำให้ Account ID เป็นมาตรฐาน

วิซาร์ดจะแปลงชื่อที่อ่านง่ายเป็น account ID ที่ทำให้เป็นมาตรฐานแล้ว ตัวอย่างเช่น `Ops Bot` จะกลายเป็น `ops-bot` เครื่องหมายวรรคตอนจะถูก escape ในชื่อ env-var แบบ scoped เพื่อให้สองบัญชีไม่ชนกัน: `-` → `_X2D_` ดังนั้น `ops-prod` จะ map เป็น `MATRIX_OPS_X2D_PROD_*`

### Credentials ที่ cache ไว้

Matrix จะเก็บ credentials ที่ cache ไว้ใต้ `~/.openclaw/credentials/matrix/`:

- บัญชี default: `credentials.json`
- บัญชีที่มีชื่อ: `credentials-<account>.json`

เมื่อมี credentials ที่ cache ไว้อยู่ที่นั่น OpenClaw จะถือว่า Matrix ถูกกำหนดค่าแล้ว แม้ access token จะไม่อยู่ในไฟล์ config ก็ตาม ซึ่งครอบคลุม setup, `openclaw doctor` และ probe สถานะช่องทาง

### Environment variables

ใช้เมื่อไม่ได้ตั้งค่าคีย์ config ที่เทียบเท่า บัญชี default ใช้ชื่อที่ไม่มี prefix บัญชีที่มีชื่อจะใช้ account ID แทรกไว้ก่อน suffix

| บัญชี default       | บัญชีที่มีชื่อ (`<ID>` คือ account ID ที่ทำให้เป็นมาตรฐานแล้ว) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

สำหรับบัญชี `ops` ชื่อจะกลายเป็น `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` และอื่น ๆ env vars สำหรับ recovery-key จะถูกอ่านโดย flow ของ CLI ที่รองรับ recovery (`verify backup restore`, `verify device`, `verify bootstrap`) เมื่อคุณ pipe คีย์เข้ามาผ่าน `--recovery-key-stdin`

ไม่สามารถตั้งค่า `MATRIX_HOMESERVER` จาก workspace `.env` ได้ ดู [ไฟล์ `.env` ของ Workspace](/th/gateway/security)

## ตัวอย่างการกำหนดค่า

baseline ที่ใช้งานได้จริงพร้อมการ pairing ของ DM, allowlist ของห้อง และ E2EE:

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

## ตัวอย่าง preview แบบ Streaming

การ streaming ข้อความตอบกลับของ Matrix เป็นแบบ opt-in `streaming` ควบคุมวิธีที่ OpenClaw ส่งคำตอบของผู้ช่วยที่กำลังเขียนอยู่ ส่วน `blockStreaming` ควบคุมว่าจะคงแต่ละ block ที่เสร็จแล้วไว้เป็นข้อความ Matrix ของตัวเองหรือไม่

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

หากต้องการเก็บ preview คำตอบแบบ live แต่ซ่อนบรรทัด tool/progress ชั่วคราว ให้ใช้รูปแบบ object:

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

รูปแบบ object เต็มรับ `{ mode, preview, progress }`:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pick from configured or built-in labels (false to hide)
          labels: ["Thinking", "Writing", "Searching"], // candidates for label: "auto"
          maxLines: 8, // max rolling progress lines (default: 8)
          maxLineChars: 120, // max chars per line before truncation (default: 120)
          toolProgress: true, // show tool/progress activity (default: true)
        },
      },
    },
  },
}
```

- `progress.label`: label แบบกำหนดเอง, `"auto"` หรือไม่ตั้งค่าเพื่อเลือกจาก label ที่กำหนดค่าไว้หรือที่มีมาให้ในตัว หรือ `false` เพื่อซ่อนบรรทัด label
- `progress.labels`: label ตัวเลือกที่ใช้เฉพาะเมื่อ `label` เป็น `"auto"` หรือไม่ได้ตั้งค่า ไม่ต้องตั้งค่าเพื่อใช้ค่า default ที่มีมาให้ในตัว
- `progress.maxLines`: จำนวนบรรทัด progress แบบ rolling สูงสุดที่เก็บไว้ใน draft หลังจากถึงขีดจำกัดนี้ บรรทัดเก่าจะถูกตัดออก
- `progress.maxLineChars`: จำนวนอักขระสูงสุดต่อบรรทัด progress แบบ compact ก่อนถูกตัดทอน
- `progress.toolProgress`: เมื่อเป็น `true` (default) กิจกรรม tool/progress แบบ live จะปรากฏใน draft

| `streaming`       | พฤติกรรม                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (default) | รอคำตอบเต็ม แล้วส่งครั้งเดียว `true` ↔ `"partial"`, `false` ↔ `"off"`                                                                                        |
| `"partial"`       | แก้ไขข้อความตัวอักษรปกติหนึ่งข้อความในตำแหน่งเดิมขณะที่โมเดลเขียน block ปัจจุบัน Client Matrix มาตรฐานอาจแจ้งเตือนตอน preview แรก ไม่ใช่ตอนแก้ไขสุดท้าย              |
| `"quiet"`         | เหมือนกับ `"partial"` แต่ข้อความเป็น notice ที่ไม่แจ้งเตือน ผู้รับจะได้รับการแจ้งเตือนก็ต่อเมื่อกฎ push ต่อผู้ใช้ตรงกับการแก้ไขที่ finalize แล้ว (ดูด้านล่าง) |
| `"progress"`      | ส่งบรรทัด progress แบบ compact ทีละบรรทัดโดยใช้ draft ของ progress                                                                                                     |

`blockStreaming` เป็นอิสระจาก `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (default)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | draft แบบ live สำหรับ block ปัจจุบัน, block ที่เสร็จแล้วถูกเก็บเป็นข้อความ | draft แบบ live สำหรับ block ปัจจุบัน, finalize ในตำแหน่งเดิม |
| `"off"`                 | ข้อความ Matrix ที่แจ้งเตือนหนึ่งข้อความต่อ block ที่เสร็จแล้ว                     | ข้อความ Matrix ที่แจ้งเตือนหนึ่งข้อความสำหรับคำตอบเต็ม      |

หมายเหตุ:

- หาก preview โตเกินขีดจำกัดขนาดต่อ event ของ Matrix, OpenClaw จะหยุด preview streaming และ fallback เป็นการส่งเฉพาะผลลัพธ์สุดท้าย
- คำตอบที่เป็นสื่อจะส่ง attachment ตามปกติเสมอ หาก preview เก่าที่ค้างอยู่ไม่สามารถนำกลับมาใช้ซ้ำได้อย่างปลอดภัย OpenClaw จะ redact preview นั้นก่อนส่งคำตอบสื่อสุดท้าย
- การอัปเดต preview ของ tool-progress เปิดใช้งานตามค่า default เมื่อ Matrix preview streaming ทำงาน ตั้งค่า `streaming.preview.toolProgress: false` เพื่อคงการแก้ไข preview สำหรับข้อความคำตอบไว้ แต่ให้ tool progress อยู่บนเส้นทางการส่งปกติ
- การแก้ไข preview มีค่าใช้จ่ายเป็น API call ของ Matrix เพิ่มเติม ปล่อย `streaming: "off"` ไว้หากคุณต้องการ profile rate-limit ที่ระมัดระวังที่สุด

## ข้อความเสียง

voice notes ขาเข้าของ Matrix จะถูกถอดเสียงก่อนด่านการกล่าวถึงห้อง วิธีนี้ทำให้ voice note ที่พูดชื่อบอตสามารถเรียก agent ในห้องที่ตั้ง `requireMention: true` ได้ และให้ transcript แก่ agent แทนที่จะเป็นเพียง placeholder ของ audio attachment

Matrix ใช้ provider สื่อเสียงร่วมที่กำหนดค่าไว้ใต้ `tools.media.audio` เช่น OpenAI `gpt-4o-mini-transcribe` ดู [ภาพรวมเครื่องมือสื่อ](/th/tools/media-overview) สำหรับการตั้งค่า provider และขีดจำกัด

รายละเอียดพฤติกรรม:

- อีเวนต์ `m.audio` และอีเวนต์ `m.file` ที่มี MIME type เป็น `audio/*` มีสิทธิ์ใช้งานได้
- ในห้องที่เข้ารหัส OpenClaw จะถอดรหัสไฟล์แนบผ่านเส้นทางสื่อ Matrix ที่มีอยู่ก่อนการถอดเสียง
- ข้อความถอดเสียงถูกทำเครื่องหมายว่าเป็นเนื้อหาที่สร้างโดยเครื่องและไม่น่าเชื่อถือในพรอมป์ของเอเจนต์
- ไฟล์แนบถูกทำเครื่องหมายว่าถอดเสียงแล้ว เพื่อให้เครื่องมือสื่อปลายน้ำไม่ถอดเสียงโน้ตเสียงเดียวกันซ้ำอีก
- ตั้งค่า `tools.media.audio.enabled: false` เพื่อปิดใช้งานการถอดเสียงจากเสียงทั่วทั้งระบบ

## เมตาดาตาการอนุมัติ

พรอมป์การอนุมัติแบบเนทีฟของ Matrix เป็นอีเวนต์ `m.room.message` ปกติที่มีเนื้อหาอีเวนต์แบบกำหนดเองเฉพาะของ OpenClaw อยู่ใต้ `com.openclaw.approval` Matrix อนุญาตคีย์เนื้อหาอีเวนต์แบบกำหนดเอง ดังนั้นไคลเอนต์ทั่วไปยังคงแสดงผลตัวข้อความได้ ขณะที่ไคลเอนต์ที่รองรับ OpenClaw สามารถอ่านรหัสการอนุมัติแบบมีโครงสร้าง ชนิด สถานะ การตัดสินใจที่มีให้ใช้ และรายละเอียด exec/plugin ได้

เมื่อพรอมป์การอนุมัติยาวเกินกว่าจะอยู่ในอีเวนต์ Matrix เดียว OpenClaw จะแบ่งข้อความที่มองเห็นได้เป็นส่วนๆ และแนบ `com.openclaw.approval` กับส่วนแรกเท่านั้น รีแอ็กชันสำหรับการตัดสินใจอนุญาต/ปฏิเสธจะผูกกับอีเวนต์แรกนั้น ดังนั้นพรอมป์ยาวจึงยังคงมีเป้าหมายการอนุมัติเดียวกับพรอมป์แบบอีเวนต์เดียว

### กฎ push แบบโฮสต์เองสำหรับพรีวิวที่สรุปแล้วแบบเงียบ

`streaming: "quiet"` จะแจ้งเตือนผู้รับเพียงครั้งเดียวเมื่อบล็อกหรือเทิร์นถูกสรุปแล้ว - กฎ push ต่อผู้ใช้ต้องจับคู่กับมาร์กเกอร์พรีวิวที่สรุปแล้ว ดู [กฎ push ของ Matrix สำหรับพรีวิวแบบเงียบ](/th/channels/matrix-push-rules) สำหรับสูตรเต็มรูปแบบ (โทเคนผู้รับ การตรวจสอบ pusher การติดตั้งกฎ หมายเหตุราย homeserver)

## ห้องบอตถึงบอต

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

- `allowBots: true` รับข้อความจากบัญชีบอต Matrix อื่นที่กำหนดค่าไว้ในห้องและ DM ที่อนุญาต
- `allowBots: "mentions"` รับข้อความเหล่านั้นเฉพาะเมื่อข้อความกล่าวถึงบอตนี้อย่างเห็นได้ชัดในห้องเท่านั้น DM ยังได้รับอนุญาตอยู่
- `groups.<room>.allowBots` เขียนทับการตั้งค่าระดับบัญชีสำหรับห้องเดียว
- ข้อความจากบอตที่กำหนดค่าไว้และได้รับการยอมรับจะใช้ [การป้องกันลูปบอต](/th/channels/bot-loop-protection) ร่วมกัน กำหนดค่า `channels.defaults.botLoopProtection` แล้วเขียนทับด้วย `channels.matrix.botLoopProtection` หรือ `channels.matrix.groups.<room>.botLoopProtection` เมื่อห้องหนึ่งต้องการงบประมาณที่ต่างกัน
- OpenClaw ยังคงละเว้นข้อความจาก ID ผู้ใช้ Matrix เดียวกันเพื่อหลีกเลี่ยงลูปการตอบตัวเอง
- Matrix ไม่เปิดเผยแฟล็กบอตแบบเนทีฟในที่นี้ OpenClaw ถือว่า "เขียนโดยบอต" หมายถึง "ส่งโดยบัญชี Matrix อื่นที่กำหนดค่าไว้บน Gateway ของ OpenClaw นี้"

ใช้รายการอนุญาตห้องที่เข้มงวดและข้อกำหนดการกล่าวถึงเมื่อเปิดใช้งานทราฟฟิกบอตถึงบอตในห้องร่วม

## การเข้ารหัสและการยืนยัน

ในห้องที่เข้ารหัส (E2EE) อีเวนต์รูปภาพขาออกจะใช้ `thumbnail_file` เพื่อให้พรีวิวรูปภาพถูกเข้ารหัสไปพร้อมกับไฟล์แนบเต็ม ห้องที่ไม่ได้เข้ารหัสยังคงใช้ `thumbnail_url` แบบธรรมดา ไม่ต้องกำหนดค่าใดๆ - Plugin จะตรวจจับสถานะ E2EE โดยอัตโนมัติ

คำสั่ง `openclaw matrix` ทั้งหมดรับ `--verbose` (การวินิจฉัยแบบเต็ม), `--json` (เอาต์พุตที่เครื่องอ่านได้) และ `--account <id>` (การตั้งค่าหลายบัญชี) เอาต์พุตจะกระชับตามค่าเริ่มต้นพร้อมการบันทึก SDK ภายในแบบเงียบ ตัวอย่างด้านล่างแสดงรูปแบบมาตรฐาน เพิ่มแฟล็กตามต้องการ

### เปิดใช้งานการเข้ารหัส

```bash
openclaw matrix encryption setup
```

บูตสแตรป secret storage และ cross-signing สร้างข้อมูลสำรอง room-key หากจำเป็น จากนั้นพิมพ์สถานะและขั้นตอนถัดไป แฟล็กที่มีประโยชน์:

- `--recovery-key <key>` ใช้ recovery key ก่อนบูตสแตรป (ควรใช้รูปแบบ stdin ที่บันทึกไว้ด้านล่าง)
- `--force-reset-cross-signing` ทิ้ง identity ของ cross-signing ปัจจุบันและสร้างใหม่ (ใช้เฉพาะเมื่อตั้งใจเท่านั้น)

สำหรับบัญชีใหม่ ให้เปิดใช้งาน E2EE ตอนสร้าง:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` เป็น alias ของ `--enable-e2ee`

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

- `Locally trusted`: เชื่อถือโดยไคลเอนต์นี้เท่านั้น
- `Cross-signing verified`: SDK รายงานการยืนยันผ่าน cross-signing
- `Signed by owner`: ลงนามโดยคีย์ self-signing ของคุณเอง (เพื่อวินิจฉัยเท่านั้น)

`Verified by owner` จะกลายเป็น `yes` เฉพาะเมื่อ `Cross-signing verified` เป็น `yes` ความเชื่อถือในเครื่องหรือลายเซ็นของเจ้าของเพียงอย่างเดียวไม่เพียงพอ

`--allow-degraded-local-state` ส่งคืนการวินิจฉัยแบบ best-effort โดยไม่ต้องเตรียมบัญชี Matrix ก่อน มีประโยชน์สำหรับการตรวจสอบแบบออฟไลน์หรือที่กำหนดค่าไว้บางส่วน

### ยืนยันอุปกรณ์นี้ด้วย recovery key

recovery key เป็นข้อมูลอ่อนไหว - ส่งผ่าน stdin แทนการส่งบนบรรทัดคำสั่ง ตั้งค่า `MATRIX_RECOVERY_KEY` (หรือ `MATRIX_<ID>_RECOVERY_KEY` สำหรับบัญชีที่มีชื่อ):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

คำสั่งรายงานสามสถานะ:

- `Recovery key accepted`: Matrix ยอมรับคีย์สำหรับ secret storage หรือความเชื่อถือของอุปกรณ์
- `Backup usable`: สามารถโหลดข้อมูลสำรอง room-key ด้วยวัสดุ recovery ที่เชื่อถือได้
- `Device verified by owner`: อุปกรณ์นี้มีความเชื่อถือ identity ของ Matrix cross-signing อย่างเต็มรูปแบบ

คำสั่งจะออกด้วยสถานะ non-zero เมื่อความเชื่อถือ identity แบบเต็มยังไม่สมบูรณ์ แม้ว่า recovery key จะปลดล็อกวัสดุสำรองแล้วก็ตาม ในกรณีนั้น ให้ทำ self-verification ให้เสร็จจากไคลเอนต์ Matrix อื่น:

```bash
openclaw matrix verify self
```

`verify self` จะรอให้ `Cross-signing verified: yes` ก่อนออกสำเร็จ ใช้ `--timeout-ms <ms>` เพื่อปรับเวลารอ

รูปแบบคีย์แบบตัวอักษร `openclaw matrix verify device "<recovery-key>"` ก็รับได้เช่นกัน แต่คีย์จะไปอยู่ในประวัติ shell ของคุณ

### บูตสแตรปหรือซ่อมแซม cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` เป็นคำสั่งซ่อมแซมและตั้งค่าสำหรับบัญชีที่เข้ารหัส ตามลำดับ คำสั่งจะ:

- บูตสแตรป secret storage โดยนำ recovery key ที่มีอยู่กลับมาใช้เมื่อเป็นไปได้
- บูตสแตรป cross-signing และอัปโหลด public keys ที่หายไป
- ทำเครื่องหมายและ cross-sign อุปกรณ์ปัจจุบัน
- สร้างข้อมูลสำรอง room-key ฝั่งเซิร์ฟเวอร์หากยังไม่มีอยู่

หาก homeserver ต้องใช้ UIA เพื่ออัปโหลดคีย์ cross-signing OpenClaw จะลองแบบ no-auth ก่อน จากนั้น `m.login.dummy` แล้วจึง `m.login.password` (ต้องใช้ `channels.matrix.password`)

แฟล็กที่มีประโยชน์:

- `--recovery-key-stdin` (จับคู่กับ `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) หรือ `--recovery-key <key>`
- `--force-reset-cross-signing` เพื่อทิ้ง identity ของ cross-signing ปัจจุบัน (เฉพาะเมื่อตั้งใจเท่านั้น ต้องมี recovery key ที่ใช้งานอยู่ถูกจัดเก็บไว้หรือส่งด้วย `--recovery-key-stdin`)

### ข้อมูลสำรอง room-key

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` แสดงว่ามีข้อมูลสำรองฝั่งเซิร์ฟเวอร์หรือไม่ และอุปกรณ์นี้ถอดรหัสได้หรือไม่ `backup restore` นำเข้า room keys ที่สำรองไว้เข้าสู่ crypto store ในเครื่อง หาก recovery key อยู่บนดิสก์แล้ว คุณสามารถละ `--recovery-key-stdin` ได้

เพื่อแทนที่ข้อมูลสำรองที่เสียด้วย baseline ใหม่ (ยอมรับการสูญเสียประวัติเก่าที่กู้คืนไม่ได้ และยังสามารถสร้าง secret storage ใหม่ได้หากโหลด secret ของข้อมูลสำรองปัจจุบันไม่ได้):

```bash
openclaw matrix verify backup reset --yes
```

เพิ่ม `--rotate-recovery-key` เฉพาะเมื่อคุณตั้งใจต้องการให้ recovery key ก่อนหน้าไม่สามารถปลดล็อก baseline ข้อมูลสำรองใหม่ได้อีกต่อไป

### การแสดงรายการ การขอ และการตอบกลับการยืนยัน

```bash
openclaw matrix verify list
```

แสดงรายการคำขอยืนยันที่รอดำเนินการสำหรับบัญชีที่เลือก

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

ส่งคำขอยืนยันจากบัญชี OpenClaw นี้ `--own-user` ขอ self-verification (คุณยอมรับพรอมป์ในไคลเอนต์ Matrix อื่นของผู้ใช้เดียวกัน); `--user-id`/`--device-id`/`--room-id` กำหนดเป้าหมายไปยังคนอื่น `--own-user` ไม่สามารถใช้ร่วมกับแฟล็กกำหนดเป้าหมายอื่นได้

สำหรับการจัดการ lifecycle ระดับต่ำกว่า - โดยทั่วไปขณะติดตามคำขอขาเข้าจากไคลเอนต์อื่น - คำสั่งเหล่านี้ทำงานกับคำขอ `<id>` เฉพาะ (พิมพ์โดย `verify list` และ `verify request`):

| คำสั่ง                                    | วัตถุประสงค์                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | ยอมรับคำขอขาเข้า                                           |
| `openclaw matrix verify start <id>`        | เริ่ม flow SAS                                                  |
| `openclaw matrix verify sas <id>`          | พิมพ์อีโมจิหรือเลขทศนิยมของ SAS                                     |
| `openclaw matrix verify confirm-sas <id>`  | ยืนยันว่าว่า SAS ตรงกับที่ไคลเอนต์อีกฝั่งแสดง            |
| `openclaw matrix verify mismatch-sas <id>` | ปฏิเสธ SAS เมื่ออีโมจิหรือเลขทศนิยมไม่ตรงกัน              |
| `openclaw matrix verify cancel <id>`       | ยกเลิก; รับ `--reason <text>` และ `--code <matrix-code>` แบบไม่บังคับ |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` และ `cancel` ทั้งหมดรับ `--user-id` และ `--room-id` เป็นคำใบ้ติดตามผล DM เมื่อการยืนยันยึดกับห้องข้อความตรงเฉพาะ

### หมายเหตุหลายบัญชี

หากไม่มี `--account <id>` คำสั่ง Matrix CLI จะใช้บัญชีเริ่มต้นโดยนัย หากคุณมีบัญชีที่มีชื่อหลายบัญชีและยังไม่ได้ตั้งค่า `channels.matrix.defaultAccount` คำสั่งจะปฏิเสธที่จะเดาและขอให้คุณเลือก เมื่อ E2EE ถูกปิดใช้งานหรือไม่พร้อมใช้งานสำหรับบัญชีที่มีชื่อ ข้อผิดพลาดจะชี้ไปที่คีย์กำหนดค่าของบัญชีนั้น เช่น `channels.matrix.accounts.assistant.encryption`

<AccordionGroup>
  <Accordion title="พฤติกรรมตอนเริ่มต้น">
    เมื่อใช้ `encryption: true`, `startupVerification` มีค่าเริ่มต้นเป็น `"if-unverified"` ตอนเริ่มต้น อุปกรณ์ที่ยังไม่ยืนยันจะขอ self-verification ในไคลเอนต์ Matrix อื่น ข้ามรายการซ้ำ และใช้ cooldown (ค่าเริ่มต้น 24 ชั่วโมง) ปรับด้วย `startupVerificationCooldownHours` หรือปิดใช้งานด้วย `startupVerification: "off"`

    ตอนเริ่มต้นยังรัน pass การบูตสแตรป crypto แบบอนุรักษ์นิยมที่นำ secret storage และ identity ของ cross-signing ปัจจุบันกลับมาใช้ หากสถานะบูตสแตรปเสีย OpenClaw จะพยายามซ่อมแซมแบบมีการป้องกันแม้ไม่มี `channels.matrix.password`; หาก homeserver ต้องใช้ UIA แบบรหัสผ่าน ตอนเริ่มต้นจะบันทึกคำเตือนและยังไม่ถือเป็นข้อผิดพลาดร้ายแรง อุปกรณ์ที่ owner-signed แล้วจะถูกเก็บไว้

    ดู [การย้ายข้อมูล Matrix](/th/channels/matrix-migration) สำหรับ flow การอัปเกรดฉบับเต็ม

  </Accordion>

  <Accordion title="ประกาศการยืนยัน">
    Matrix โพสต์ประกาศ lifecycle ของการยืนยันเข้าไปในห้อง DM การยืนยันแบบเข้มงวดเป็นข้อความ `m.notice`: คำขอ, พร้อมแล้ว (พร้อมคำแนะนำ "Verify by emoji"), เริ่มต้น/เสร็จสิ้น และรายละเอียด SAS (อีโมจิ/เลขทศนิยม) เมื่อมี

    คำขอขาเข้าจากไคลเอนต์ Matrix อื่นจะถูกติดตามและยอมรับอัตโนมัติ สำหรับ self-verification OpenClaw จะเริ่ม flow SAS โดยอัตโนมัติและยืนยันฝั่งของตัวเองเมื่อการยืนยันด้วยอีโมจิพร้อมใช้งาน - คุณยังต้องเปรียบเทียบและยืนยัน "They match" ในไคลเอนต์ Matrix ของคุณ

    ประกาศระบบการยืนยันจะไม่ถูกส่งต่อไปยัง pipeline แชตของเอเจนต์

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

    สำหรับการยืนยันตัวตนด้วยโทเค็น ให้สร้าง access token ใหม่ใน Matrix client หรือ UI ผู้ดูแลระบบของคุณ แล้วอัปเดต OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    แทนที่ `assistant` ด้วย ID บัญชีจากคำสั่งที่ล้มเหลว หรือละ `--account` เพื่อใช้บัญชีเริ่มต้น

  </Accordion>

  <Accordion title="สุขอนามัยของอุปกรณ์">
    อุปกรณ์เก่าที่ OpenClaw จัดการอาจสะสมเพิ่มขึ้นได้ แสดงรายการและตัดทิ้ง:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="ที่เก็บคริปโต">
    Matrix E2EE ใช้เส้นทางคริปโต Rust อย่างเป็นทางการของ `matrix-js-sdk` โดยใช้ `fake-indexeddb` เป็น IndexedDB shim สถานะคริปโตจะคงอยู่ใน `crypto-idb-snapshot.json` (สิทธิ์ไฟล์แบบจำกัด)

    สถานะรันไทม์ที่เข้ารหัสอยู่ใต้ `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` และมี sync store, crypto store, recovery key, IDB snapshot, thread bindings และสถานะการตรวจสอบตอนเริ่มต้น เมื่อโทเค็นเปลี่ยนแต่ตัวตนบัญชียังคงเดิม OpenClaw จะนำ root เดิมที่เหมาะที่สุดมาใช้ซ้ำเพื่อให้สถานะก่อนหน้ายังคงมองเห็นได้

    root token-hash รุ่นเก่าเพียงรายการเดียวอาจเป็นเส้นทางความต่อเนื่องของการหมุนเวียนโทเค็นตามปกติได้ หาก OpenClaw บันทึก `matrix: multiple populated token-hash storage roots detected` ให้ตรวจสอบไดเรกทอรีบัญชีและเก็บ root พี่น้องที่ค้างไว้เข้า archive หลังจากยืนยันแล้วว่า root ที่ใช้งานอยู่ซึ่งถูกเลือกมีสภาพสมบูรณ์เท่านั้น ควรย้าย root ที่ค้างไว้เข้าไดเรกทอรี `_archive/` แทนการลบทันที

  </Accordion>
</AccordionGroup>

## การจัดการโปรไฟล์

อัปเดตโปรไฟล์ตนเองของ Matrix สำหรับบัญชีที่เลือก:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

คุณสามารถส่งทั้งสองตัวเลือกในการเรียกครั้งเดียวได้ Matrix รับ URL รูปแทนตัวแบบ `mxc://` โดยตรง เมื่อคุณส่ง `http://` หรือ `https://` OpenClaw จะอัปโหลดไฟล์ก่อน แล้วเก็บ URL `mxc://` ที่ resolve แล้วไว้ใน `channels.matrix.avatarUrl` (หรือค่า override รายบัญชี)

## เธรด

Matrix รองรับเธรด Matrix แบบเนทีฟสำหรับทั้งการตอบกลับอัตโนมัติและการส่งผ่านเครื่องมือข้อความ ปุ่มควบคุมอิสระสองรายการกำหนดพฤติกรรม:

### การกำหนดเส้นทางเซสชัน (`sessionScope`)

`dm.sessionScope` กำหนดว่าห้อง DM ของ Matrix จะแมปกับเซสชัน OpenClaw อย่างไร:

- `"per-user"` (ค่าเริ่มต้น): ห้อง DM ทั้งหมดที่มี peer ที่ถูกกำหนดเส้นทางเดียวกันจะแชร์เซสชันเดียว
- `"per-room"`: ห้อง DM ของ Matrix แต่ละห้องจะได้คีย์เซสชันของตัวเอง แม้ว่า peer จะเป็นคนเดียวกันก็ตาม

การผูกบทสนทนาแบบชัดเจนมีผลเหนือ `sessionScope` เสมอ ดังนั้นห้องและเธรดที่ผูกไว้จะคงเซสชันเป้าหมายที่เลือกไว้

### การตอบกลับในเธรด (`threadReplies`)

`threadReplies` กำหนดว่าบอตจะโพสต์คำตอบไว้ที่ใด:

- `"off"`: คำตอบเป็นระดับบนสุด ข้อความแบบเธรดขาเข้าจะคงอยู่ในเซสชันแม่
- `"inbound"`: ตอบกลับภายในเธรดเฉพาะเมื่อข้อความขาเข้าอยู่ในเธรดนั้นอยู่แล้ว
- `"always"`: ตอบกลับภายในเธรดที่มีรากอยู่ที่ข้อความที่ทริกเกอร์ บทสนทนานั้นจะถูกกำหนดเส้นทางผ่านเซสชันที่มีขอบเขตตามเธรดที่ตรงกันตั้งแต่ทริกเกอร์แรกเป็นต้นไป

`dm.threadReplies` override ค่านี้สำหรับ DM เท่านั้น เช่น แยกเธรดในห้องออกจากกัน ในขณะที่ยังคงให้ DM เป็นแบบแบน

### การสืบทอดเธรดและคำสั่ง slash

- ข้อความแบบเธรดขาเข้าจะรวมข้อความรากของเธรดเป็นบริบท agent เพิ่มเติม
- การส่งผ่านเครื่องมือข้อความจะสืบทอดเธรด Matrix ปัจจุบันโดยอัตโนมัติเมื่อกำหนดเป้าหมายไปยังห้องเดียวกัน (หรือเป้าหมายผู้ใช้ DM เดียวกัน) เว้นแต่จะระบุ `threadId` อย่างชัดเจน
- การใช้เป้าหมายผู้ใช้ DM ซ้ำจะเริ่มทำงานเฉพาะเมื่อ metadata ของเซสชันปัจจุบันพิสูจน์ว่าเป็น peer DM เดียวกันบนบัญชี Matrix เดียวกัน ไม่เช่นนั้น OpenClaw จะย้อนกลับไปใช้การกำหนดเส้นทางตามขอบเขตผู้ใช้ตามปกติ
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และ `/acp spawn` ที่ผูกกับเธรดทั้งหมดใช้งานได้ในห้อง Matrix และ DM
- `/focus` ระดับบนสุดจะสร้างเธรด Matrix ใหม่และผูกเข้ากับเซสชันเป้าหมายเมื่อเปิดใช้ `threadBindings.spawnSessions`
- การเรียก `/focus` หรือ `/acp spawn --thread here` ภายในเธรด Matrix ที่มีอยู่จะผูกเธรดนั้นไว้กับที่

เมื่อ OpenClaw ตรวจพบว่าห้อง DM ของ Matrix ชนกับห้อง DM อื่นบนเซสชันที่แชร์เดียวกัน ระบบจะโพสต์ `m.notice` แบบครั้งเดียวในห้องนั้น โดยชี้ไปยังทางออก `/focus` และแนะนำให้เปลี่ยน `dm.sessionScope` ประกาศนี้จะปรากฏเฉพาะเมื่อเปิดใช้ thread bindings

## การผูกบทสนทนา ACP

ห้อง Matrix, DM และเธรด Matrix ที่มีอยู่สามารถเปลี่ยนเป็นพื้นที่ทำงาน ACP แบบคงทนได้โดยไม่ต้องเปลี่ยนพื้นผิวแชต

โฟลว์สำหรับผู้ปฏิบัติงานแบบเร็ว:

- เรียก `/acp spawn codex --bind here` ภายใน DM, ห้อง หรือเธรดที่มีอยู่ของ Matrix ที่คุณต้องการใช้ต่อ
- ใน DM หรือห้อง Matrix ระดับบนสุด DM/ห้องปัจจุบันจะยังเป็นพื้นผิวแชต และข้อความในอนาคตจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ spawn ขึ้น
- ภายในเธรด Matrix ที่มีอยู่ `--bind here` จะผูกเธรดปัจจุบันนั้นไว้กับที่
- `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP ที่ผูกไว้เดิมในที่เดิม
- `/acp close` จะปิดเซสชัน ACP และลบการผูก

หมายเหตุ:

- `--bind here` ไม่สร้างเธรดลูกของ Matrix
- `threadBindings.spawnSessions` ควบคุม `/acp spawn --thread auto|here` ซึ่ง OpenClaw ต้องสร้างหรือผูกเธรดลูกของ Matrix

### การกำหนดค่า thread binding

Matrix สืบทอดค่าเริ่มต้นทั่วโลกจาก `session.threadBindings` และยังรองรับ override รายช่องทางด้วย:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

การ spawn เซสชันที่ผูกกับเธรด Matrix เปิดเป็นค่าเริ่มต้น:

- ตั้งค่า `threadBindings.spawnSessions: false` เพื่อบล็อก `/focus` ระดับบนสุดและ `/acp spawn --thread auto|here` ไม่ให้สร้าง/ผูกเธรด Matrix
- ตั้งค่า `threadBindings.defaultSpawnContext: "isolated"` เมื่อการ spawn เธรด subagent แบบเนทีฟไม่ควร fork transcript แม่

## ปฏิกิริยา

Matrix รองรับปฏิกิริยาขาออก การแจ้งเตือนปฏิกิริยาขาเข้า และปฏิกิริยา ack

เครื่องมือปฏิกิริยาขาออกถูกควบคุมโดย `channels.matrix.actions.reactions`:

- `react` เพิ่มปฏิกิริยาให้กับ event ของ Matrix
- `reactions` แสดงสรุปปฏิกิริยาปัจจุบันสำหรับ event ของ Matrix
- `emoji=""` ลบปฏิกิริยาของบอตเองบน event นั้น
- `remove: true` ลบเฉพาะปฏิกิริยา emoji ที่ระบุจากบอต

**ลำดับการ resolve** (ค่าที่กำหนดไว้ก่อนชนะ):

| การตั้งค่า              | ลำดับ                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | รายบัญชี → ช่องทาง → `messages.ackReaction` → fallback emoji ของตัวตน agent      |
| `ackReactionScope`      | รายบัญชี → ช่องทาง → `messages.ackReactionScope` → ค่าเริ่มต้น `"group-mentions"` |
| `reactionNotifications` | รายบัญชี → ช่องทาง → ค่าเริ่มต้น `"own"`                                         |

`reactionNotifications: "own"` ส่งต่อ event `m.reaction` ที่เพิ่มเข้ามาเมื่อ event เหล่านั้นชี้ไปยังข้อความ Matrix ที่บอตเป็นผู้เขียน ส่วน `"off"` ปิดใช้งาน event ระบบปฏิกิริยา การลบปฏิกิริยาจะไม่ถูกสังเคราะห์เป็น event ระบบ เพราะ Matrix แสดงสิ่งเหล่านั้นเป็น redaction ไม่ใช่การลบ `m.reaction` แบบ standalone

## บริบทประวัติ

- `channels.matrix.historyLimit` ควบคุมจำนวนข้อความล่าสุดในห้องที่รวมเป็น `InboundHistory` เมื่อข้อความในห้อง Matrix ทริกเกอร์ agent ถอยกลับไปใช้ `messages.groupChat.historyLimit` หากไม่ได้ตั้งค่าทั้งสอง ค่าเริ่มต้นที่มีผลคือ `0` ตั้งค่า `0` เพื่อปิดใช้งาน
- ประวัติห้อง Matrix เป็นเฉพาะห้องเท่านั้น DM ยังคงใช้ประวัติเซสชันตามปกติ
- ประวัติห้อง Matrix เป็นแบบ pending-only: OpenClaw บัฟเฟอร์ข้อความในห้องที่ยังไม่ได้ทริกเกอร์คำตอบ แล้ว snapshot หน้าต่างนั้นเมื่อมีการ mention หรือทริกเกอร์อื่นมาถึง
- ข้อความทริกเกอร์ปัจจุบันจะไม่รวมอยู่ใน `InboundHistory` แต่จะอยู่ในเนื้อหาขาเข้าหลักสำหรับรอบนั้น
- การ retry event Matrix เดียวกันจะใช้ snapshot ประวัติต้นฉบับซ้ำ แทนที่จะเลื่อนไปยังข้อความในห้องที่ใหม่กว่า

## การมองเห็นบริบท

Matrix รองรับตัวควบคุม `contextVisibility` ร่วมสำหรับบริบทห้องเสริม เช่น ข้อความตอบกลับที่ดึงมา รากเธรด และประวัติที่รออยู่

- `contextVisibility: "all"` เป็นค่าเริ่มต้น บริบทเสริมจะคงไว้ตามที่ได้รับ
- `contextVisibility: "allowlist"` กรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่ได้รับอนุญาตโดยการตรวจ allowlist ของห้อง/ผู้ใช้ที่ใช้งานอยู่
- `contextVisibility: "allowlist_quote"` ทำงานเหมือน `allowlist` แต่ยังคงเก็บคำตอบที่ quote อย่างชัดเจนไว้หนึ่งรายการ

การตั้งค่านี้ส่งผลต่อการมองเห็นบริบทเสริม ไม่ใช่ว่าข้อความขาเข้าเองจะทริกเกอร์คำตอบได้หรือไม่
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

หากต้องการปิดเสียง DM ทั้งหมดในขณะที่ยังให้ห้องทำงานอยู่ ให้ตั้งค่า `dm.enabled: false`:

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

ตัวอย่างการจับคู่สำหรับ DM ของ Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

หากผู้ใช้ Matrix ที่ยังไม่ได้อนุมัติยังส่งข้อความถึงคุณก่อนการอนุมัติ OpenClaw จะใช้โค้ดจับคู่ที่รอดำเนินการเดิมซ้ำ และอาจส่งคำตอบเตือนความจำหลัง cooldown สั้น ๆ แทนการ mint โค้ดใหม่

ดู [การจับคู่](/th/channels/pairing) สำหรับโฟลว์การจับคู่ DM ร่วมและเลย์เอาต์ที่เก็บข้อมูล

## การซ่อมแซมห้องโดยตรง

หากสถานะ direct-message คลาดเคลื่อนจากการซิงก์ OpenClaw อาจมีการแมป `m.direct` ที่ค้าง ซึ่งชี้ไปยังห้องเดี่ยวเก่าแทน DM ที่ใช้งานอยู่ ตรวจสอบการแมปปัจจุบันสำหรับ peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

ซ่อมแซม:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

ทั้งสองคำสั่งรับ `--account <id>` สำหรับการตั้งค่าหลายบัญชี โฟลว์การซ่อมแซม:

- เลือก DM แบบ 1:1 ที่เข้มงวดซึ่งแมปอยู่ใน `m.direct` อยู่แล้วเป็นอันดับแรก
- ถอยกลับไปใช้ DM แบบ 1:1 ที่เข้มงวดซึ่งเข้าร่วมอยู่ในปัจจุบันกับผู้ใช้นั้น
- สร้างห้อง direct ใหม่และเขียน `m.direct` ใหม่ หากไม่มี DM ที่มีสภาพสมบูรณ์อยู่

ระบบจะไม่ลบห้องเก่าโดยอัตโนมัติ แต่จะเลือก DM ที่มีสภาพสมบูรณ์และอัปเดตการแมป เพื่อให้การส่งของ Matrix ในอนาคต ประกาศการตรวจสอบ และโฟลว์ direct-message อื่น ๆ กำหนดเป้าหมายไปยังห้องที่ถูกต้อง

## การอนุมัติ Exec

Matrix สามารถทำหน้าที่เป็น client การอนุมัติแบบเนทีฟได้ กำหนดค่าใต้ `channels.matrix.execApprovals` (หรือ `channels.matrix.accounts.<account>.execApprovals` สำหรับ override รายบัญชี):

- `enabled`: ส่งการอนุมัติผ่าน prompt แบบเนทีฟของ Matrix เมื่อไม่ได้ตั้งค่าหรือเป็น `"auto"` Matrix จะเปิดใช้อัตโนมัติเมื่อ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งคน ตั้งค่า `false` เพื่อปิดใช้งานอย่างชัดเจน
- `approvers`: ID ผู้ใช้ Matrix (`@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอ exec ไม่บังคับ - ถอยกลับไปใช้ `channels.matrix.dm.allowFrom`
- `target`: ตำแหน่งที่ prompt จะถูกส่งไป `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ; `"channel"` ส่งไปยังห้อง Matrix หรือ DM ต้นทาง; `"both"` ส่งไปทั้งสองที่
- `agentFilter` / `sessionFilter`: allowlist ไม่บังคับสำหรับ agent/เซสชันที่จะทริกเกอร์การส่งผ่าน Matrix

การอนุญาตแตกต่างกันเล็กน้อยระหว่างชนิดการอนุมัติ:

- **การอนุมัติ Exec** ใช้ `execApprovals.approvers` และถอยกลับไปใช้ `dm.allowFrom`
- **การอนุมัติ Plugin** อนุญาตผ่าน `dm.allowFrom` เท่านั้น

ทั้งสองชนิดใช้ shortcut ปฏิกิริยาและการอัปเดตข้อความของ Matrix ร่วมกัน ผู้อนุมัติจะเห็น shortcut ปฏิกิริยาบนข้อความการอนุมัติหลัก:

- `✅` อนุญาตหนึ่งครั้ง
- `❌` ปฏิเสธ
- `♾️` อนุญาตเสมอ (เมื่อ policy exec ที่มีผลอนุญาต)

คำสั่ง slash สำรอง: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

เฉพาะผู้อนุมัติที่ระบุได้แล้วเท่านั้นที่สามารถอนุมัติหรือปฏิเสธได้ การส่งผ่านช่องทางสำหรับการอนุมัติ exec จะรวมข้อความคำสั่งไว้ด้วย - เปิดใช้ `channel` หรือ `both` เฉพาะในห้องที่เชื่อถือได้เท่านั้น.

ที่เกี่ยวข้อง: [การอนุมัติ Exec](/th/tools/exec-approvals).

## คำสั่ง slash

คำสั่ง slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` เป็นต้น) ใช้งานได้โดยตรงใน DM ในห้อง OpenClaw ยังจดจำคำสั่งที่ขึ้นต้นด้วยการกล่าวถึง Matrix ของบอตเองด้วย ดังนั้น `@bot:server /new` จะเรียกเส้นทางคำสั่งโดยไม่ต้องใช้ regex การกล่าวถึงแบบกำหนดเอง วิธีนี้ทำให้บอตตอบสนองต่อโพสต์รูปแบบห้องอย่าง `@mention /command` ที่ Element และไคลเอนต์ที่คล้ายกันส่งออกมาเมื่อผู้ใช้เติมชื่อบอตด้วยแท็บก่อนพิมพ์คำสั่ง.

กฎการอนุญาตยังคงมีผล: ผู้ส่งคำสั่งต้องผ่านนโยบาย allowlist/เจ้าของสำหรับ DM หรือห้องแบบเดียวกับข้อความปกติ.

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

**การสืบทอดค่า:**

- ค่า `channels.matrix` ระดับบนสุดทำหน้าที่เป็นค่าเริ่มต้นสำหรับบัญชีที่ตั้งชื่อไว้ เว้นแต่บัญชีนั้นจะแทนที่ค่าเอง.
- จำกัดขอบเขตรายการห้องที่สืบทอดมาให้กับบัญชีเฉพาะด้วย `groups.<room>.account` รายการที่ไม่มี `account` จะใช้ร่วมกันข้ามบัญชี; `account: "default"` ยังใช้งานได้เมื่อบัญชีเริ่มต้นถูกกำหนดไว้ที่ระดับบนสุด.

**การเลือกบัญชีเริ่มต้น:**

- ตั้งค่า `defaultAccount` เพื่อเลือกบัญชีที่ตั้งชื่อไว้ซึ่งการกำหนดเส้นทางโดยนัย การตรวจสอบ และคำสั่ง CLI จะเลือกใช้.
- หากคุณมีหลายบัญชีและมีบัญชีหนึ่งชื่อว่า `default` จริง ๆ OpenClaw จะใช้บัญชีนั้นโดยนัยแม้ไม่ได้ตั้งค่า `defaultAccount`.
- หากคุณมีหลายบัญชีที่ตั้งชื่อไว้และไม่ได้เลือกค่าเริ่มต้น คำสั่ง CLI จะปฏิเสธการเดา - ให้ตั้งค่า `defaultAccount` หรือส่ง `--account <id>`.
- บล็อก `channels.matrix.*` ระดับบนสุดจะถูกมองเป็นบัญชี `default` โดยนัยเฉพาะเมื่อข้อมูล auth ครบถ้วน (`homeserver` + `accessToken` หรือ `homeserver` + `userId` + `password`) บัญชีที่ตั้งชื่อไว้ยังคงค้นพบได้จาก `homeserver` + `userId` เมื่อข้อมูลประจำตัวที่แคชไว้ครอบคลุม auth แล้ว.

**การโปรโมต:**

- เมื่อ OpenClaw โปรโมต config แบบบัญชีเดียวเป็นหลายบัญชีระหว่างการซ่อมแซมหรือการตั้งค่า จะคงบัญชีที่ตั้งชื่อไว้เดิมหากมีอยู่ หรือหาก `defaultAccount` ชี้ไปยังบัญชีหนึ่งอยู่แล้ว เฉพาะคีย์ auth/bootstrap ของ Matrix เท่านั้นที่จะย้ายเข้าไปในบัญชีที่ถูกโปรโมต; คีย์นโยบายการส่งร่วมกันจะยังอยู่ที่ระดับบนสุด.

ดู [อ้างอิงการกำหนดค่า](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบหลายบัญชีที่ใช้ร่วมกัน.

## homeserver ส่วนตัว/LAN

โดยค่าเริ่มต้น OpenClaw จะบล็อก homeserver ของ Matrix ที่เป็นส่วนตัว/ภายในเพื่อป้องกัน SSRF เว้นแต่คุณจะเลือกเปิดใช้ต่อบัญชีอย่างชัดเจน.

หาก homeserver ของคุณทำงานบน localhost, IP ของ LAN/Tailscale หรือชื่อโฮสต์ภายใน ให้เปิดใช้ `network.dangerouslyAllowPrivateNetwork` สำหรับบัญชี Matrix นั้น:

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

การเลือกเปิดใช้นี้อนุญาตเฉพาะเป้าหมายส่วนตัว/ภายในที่เชื่อถือได้เท่านั้น homeserver แบบข้อความไม่เข้ารหัสสาธารณะ เช่น
`http://matrix.example.org:8008` ยังคงถูกบล็อก ควรใช้ `https://` ทุกครั้งที่เป็นไปได้.

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

บัญชีที่ตั้งชื่อไว้สามารถแทนที่ค่าเริ่มต้นระดับบนสุดด้วย `channels.matrix.accounts.<id>.proxy`.
OpenClaw ใช้การตั้งค่าพร็อกซีเดียวกันสำหรับทราฟฟิก Matrix ระหว่างรันไทม์และการตรวจสอบสถานะบัญชี.

## การระบุเป้าหมาย

Matrix ยอมรับรูปแบบเป้าหมายเหล่านี้ทุกที่ที่ OpenClaw ขอเป้าหมายเป็นห้องหรือผู้ใช้:

- ผู้ใช้: `@user:server`, `user:@user:server` หรือ `matrix:user:@user:server`
- ห้อง: `!room:server`, `room:!room:server` หรือ `matrix:room:!room:server`
- นามแฝง: `#alias:server`, `channel:#alias:server` หรือ `matrix:channel:#alias:server`

ID ห้อง Matrix แยกตัวพิมพ์เล็กใหญ่ ใช้รูปแบบตัวพิมพ์ของ ID ห้องให้ตรงกับ Matrix
เมื่อกำหนดค่าเป้าหมายการส่งอย่างชัดเจน งาน Cron การผูก หรือ allowlist.
OpenClaw เก็บคีย์เซสชันภายในให้เป็นรูปแบบมาตรฐานสำหรับการจัดเก็บ ดังนั้นคีย์ตัวพิมพ์เล็กเหล่านั้น
จึงไม่ใช่แหล่งข้อมูลที่เชื่อถือได้สำหรับ ID การส่งของ Matrix.

การค้นหาไดเรกทอรีแบบสดใช้บัญชี Matrix ที่ล็อกอินอยู่:

- การค้นหาผู้ใช้จะ query ไดเรกทอรีผู้ใช้ Matrix บน homeserver นั้น.
- การค้นหาห้องยอมรับ ID ห้องและนามแฝงที่ระบุชัดเจนโดยตรง การค้นหาชื่อห้องที่เข้าร่วมแล้วเป็นแบบพยายามอย่างดีที่สุด และใช้กับ allowlist ห้องของรันไทม์เท่านั้นเมื่อมีการตั้งค่า `dangerouslyAllowNameMatching: true`.
- หากไม่สามารถระบุชื่อห้องให้เป็น ID หรือนามแฝงได้ ชื่อนั้นจะถูกละเว้นในการระบุ allowlist ระหว่างรันไทม์.

## อ้างอิงการกำหนดค่า

ฟิลด์ผู้ใช้แบบ allowlist (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) ยอมรับ ID ผู้ใช้ Matrix แบบเต็ม (ปลอดภัยที่สุด) รายการผู้ใช้ที่ไม่ใช่ ID จะถูกละเว้นโดยค่าเริ่มต้น หากคุณตั้งค่า `dangerouslyAllowNameMatching: true` ชื่อแสดงผลในไดเรกทอรี Matrix ที่ตรงกันแบบเป๊ะจะถูกระบุเมื่อเริ่มต้นระบบและทุกครั้งที่ allowlist เปลี่ยนขณะที่มอนิเตอร์กำลังทำงาน; รายการที่ระบุไม่ได้จะถูกละเว้นระหว่างรันไทม์.

คีย์ allowlist ของห้อง (`groups`, `rooms` แบบเดิม) ควรเป็น ID ห้องหรือนามแฝง คีย์ที่เป็นชื่อห้องธรรมดาจะถูกละเว้นโดยค่าเริ่มต้น; `dangerouslyAllowNameMatching: true` จะคืนการค้นหาแบบพยายามอย่างดีที่สุดเทียบกับชื่อห้องที่เข้าร่วมแล้ว.

### บัญชีและการเชื่อมต่อ

- `enabled`: เปิดหรือปิดช่องทาง.
- `name`: ป้ายกำกับการแสดงผลแบบไม่บังคับสำหรับบัญชี.
- `defaultAccount`: ID บัญชีที่ต้องการเมื่อกำหนดค่าบัญชี Matrix ไว้หลายบัญชี.
- `accounts`: การแทนค่ารายบัญชีที่ตั้งชื่อไว้ ค่า `channels.matrix` ระดับบนสุดจะถูกสืบทอดเป็นค่าเริ่มต้น.
- `homeserver`: URL ของ homeserver เช่น `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: อนุญาตให้บัญชีนี้เชื่อมต่อกับ `localhost`, IP ของ LAN/Tailscale หรือชื่อโฮสต์ภายใน.
- `proxy`: URL พร็อกซี HTTP(S) แบบไม่บังคับสำหรับทราฟฟิก Matrix รองรับการแทนค่ารายบัญชี.
- `userId`: ID ผู้ใช้ Matrix แบบเต็ม (`@bot:example.org`).
- `accessToken`: โทเค็นการเข้าถึงสำหรับ auth แบบใช้โทเค็น รองรับค่าข้อความล้วนและ SecretRef ผ่านผู้ให้บริการ env/file/exec ([การจัดการความลับ](/th/gateway/secrets)).
- `password`: รหัสผ่านสำหรับการล็อกอินแบบใช้รหัสผ่าน รองรับค่าข้อความล้วนและ SecretRef.
- `deviceId`: ID อุปกรณ์ Matrix ที่ระบุชัดเจน.
- `deviceName`: ชื่อแสดงผลของอุปกรณ์ที่ใช้ตอนล็อกอินด้วยรหัสผ่าน.
- `avatarUrl`: URL อวาตาร์ของตนเองที่จัดเก็บไว้สำหรับการซิงก์โปรไฟล์และการอัปเดต `profile set`.
- `initialSyncLimit`: จำนวนเหตุการณ์สูงสุดที่ดึงมาระหว่างการซิงก์ตอนเริ่มต้น.

### การเข้ารหัส

- `encryption`: เปิดใช้ E2EE ค่าเริ่มต้น: `false`.
- `startupVerification`: `"if-unverified"` (ค่าเริ่มต้นเมื่อเปิด E2EE) หรือ `"off"` ส่งคำขอการยืนยันตนเองโดยอัตโนมัติเมื่อเริ่มต้นระบบ หากอุปกรณ์นี้ยังไม่ได้รับการยืนยัน.
- `startupVerificationCooldownHours`: ระยะคูลดาวน์ก่อนคำขออัตโนมัติครั้งถัดไปตอนเริ่มต้นระบบ ค่าเริ่มต้น: `24`.

### การเข้าถึงและนโยบาย

- `groupPolicy`: `"open"`, `"allowlist"` หรือ `"disabled"` ค่าเริ่มต้น: `"allowlist"`.
- `groupAllowFrom`: allowlist ของ ID ผู้ใช้สำหรับทราฟฟิกห้อง.
- `mentionPatterns`: รูปแบบ regex แบบจำกัดขอบเขตสำหรับการกล่าวถึงในห้อง อ็อบเจกต์ที่มี `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }` ควบคุมว่า `agents.list[].groupChat.mentionPatterns` ที่กำหนดค่าไว้จะมีผลต่อห้องแต่ละห้องหรือไม่.
- `dm.enabled`: เมื่อเป็น `false` ให้ละเว้น DM ทั้งหมด ค่าเริ่มต้น: `true`.
- `dm.policy`: `"pairing"` (ค่าเริ่มต้น), `"allowlist"`, `"open"` หรือ `"disabled"` มีผลหลังจากบอตเข้าร่วมและจำแนกห้องว่าเป็น DM แล้ว; ไม่มีผลต่อการจัดการคำเชิญ.
- `dm.allowFrom`: allowlist ของ ID ผู้ใช้สำหรับทราฟฟิก DM.
- `dm.sessionScope`: `"per-user"` (ค่าเริ่มต้น) หรือ `"per-room"`.
- `dm.threadReplies`: การแทนค่าการตอบแบบเธรดเฉพาะ DM (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: ยอมรับข้อความจากบัญชีบอต Matrix อื่นที่กำหนดค่าไว้ (`true` หรือ `"mentions"`).
- `allowlistOnly`: เมื่อเป็น `true` จะบังคับนโยบาย DM ที่ใช้งานอยู่ทั้งหมด (ยกเว้น `"disabled"`) และนโยบายกลุ่ม `"open"` ให้เป็น `"allowlist"` ไม่เปลี่ยนนโยบาย `"disabled"`.
- `dangerouslyAllowNameMatching`: เมื่อเป็น `true` จะอนุญาตการค้นหาไดเรกทอรีชื่อแสดงผลของ Matrix สำหรับรายการ allowlist ผู้ใช้ และการค้นหาชื่อห้องที่เข้าร่วมแล้วสำหรับคีย์ allowlist ห้อง ควรใช้ ID `@user:server` แบบเต็ม และ ID ห้องหรือนามแฝง.
- `autoJoin`: `"always"`, `"allowlist"` หรือ `"off"` ค่าเริ่มต้น: `"off"` มีผลกับคำเชิญ Matrix ทุกครั้ง รวมถึงคำเชิญแบบ DM.
- `autoJoinAllowlist`: ห้อง/นามแฝงที่อนุญาตเมื่อ `autoJoin` เป็น `"allowlist"` รายการนามแฝงจะถูกระบุเทียบกับ homeserver ไม่ใช่เทียบกับสถานะที่ห้องที่เชิญอ้างไว้.
- `contextVisibility`: การมองเห็นบริบทเพิ่มเติม (ค่าเริ่มต้น `"all"`, `"allowlist"`, `"allowlist_quote"`).

### พฤติกรรมการตอบกลับ

- `replyToMode`: `"off"`, `"first"`, `"all"` หรือ `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` หรือ `"always"`.
- `threadBindings`: การแทนค่ารายช่องทางสำหรับการกำหนดเส้นทางเซสชันที่ผูกกับเธรดและวงจรชีวิต.
- `streaming`: `"off"` (ค่าเริ่มต้น), `"partial"`, `"quiet"`, `"progress"` หรือรูปแบบอ็อบเจกต์ `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }` `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: เมื่อเป็น `true` บล็อกผู้ช่วยที่เสร็จสมบูรณ์แล้วจะถูกเก็บเป็นข้อความความคืบหน้าแยกกัน.
- `markdown`: config การเรนเดอร์ Markdown แบบไม่บังคับสำหรับข้อความขาออก.
- `responsePrefix`: สตริงแบบไม่บังคับที่เติมนำหน้าการตอบกลับขาออก.
- `textChunkLimit`: ขนาดชิ้นส่วนขาออกเป็นจำนวนอักขระเมื่อ `chunkMode: "length"` ค่าเริ่มต้น: `4000`.
- `chunkMode`: `"length"` (ค่าเริ่มต้น แบ่งตามจำนวนอักขระ) หรือ `"newline"` (แบ่งตามขอบเขตบรรทัด).
- `historyLimit`: จำนวนข้อความห้องล่าสุดที่รวมเป็น `InboundHistory` เมื่อข้อความในห้องเรียก agent ย้อนกลับไปใช้ `messages.groupChat.historyLimit`; ค่าเริ่มต้นที่มีผลคือ `0` (ปิดใช้งาน).
- `mediaMaxMb`: เพดานขนาดสื่อเป็น MB สำหรับการส่งขาออกและการประมวลผลขาเข้า.

### การตั้งค่า reaction

- `ackReaction`: การแทนค่า reaction ตอบรับสำหรับช่องทาง/บัญชีนี้.
- `ackReactionScope`: การแทนค่าขอบเขต (`"group-mentions"` ค่าเริ่มต้น, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: โหมดการแจ้งเตือน reaction ขาเข้า (`"own"` ค่าเริ่มต้น, `"off"`).

### เครื่องมือและการแทนค่ารายห้อง

- `actions`: การควบคุมสิทธิ์เครื่องมือต่อแต่ละ action (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`)
- `groups`: แผนที่นโยบายต่อห้อง ตัวตนของเซสชันใช้ ID ห้องที่เสถียรหลังการ resolve (`rooms` เป็น alias แบบเดิม)
  - `groups.<room>.account`: จำกัดรายการห้องที่สืบทอดมาหนึ่งรายการให้ใช้กับบัญชีเฉพาะ
  - `groups.<room>.enabled`: สวิตช์เปิด/ปิดต่อห้อง เมื่อเป็น `false` ห้องจะถูกละเว้นเหมือนไม่ได้อยู่ในแผนที่
  - `groups.<room>.requireMention`: การแทนที่ข้อกำหนดการ mention ระดับช่องทางสำหรับแต่ละห้อง
  - `groups.<room>.allowBots`: การแทนที่การตั้งค่าระดับช่องทางสำหรับแต่ละห้อง (`true` หรือ `"mentions"`)
  - `groups.<room>.botLoopProtection`: การแทนที่งบประมาณการป้องกันลูป bot-to-bot สำหรับแต่ละห้อง
  - `groups.<room>.users`: allowlist ผู้ส่งต่อห้อง
  - `groups.<room>.tools`: การแทนที่การอนุญาต/ปฏิเสธเครื่องมือต่อห้อง
  - `groups.<room>.autoReply`: การแทนที่การควบคุมด้วย mention ต่อห้อง `true` ปิดใช้งานข้อกำหนดการ mention สำหรับห้องนั้น; `false` บังคับให้เปิดกลับมา
  - `groups.<room>.skills`: ตัวกรอง Skills ต่อห้อง
  - `groups.<room>.systemPrompt`: ส่วนย่อยของ system prompt ต่อห้อง

### การตั้งค่าการอนุมัติ exec

- `execApprovals.enabled`: ส่งการอนุมัติ exec ผ่านพรอมป์แบบเนทีฟของ Matrix
- `execApprovals.approvers`: ID ผู้ใช้ Matrix ที่ได้รับอนุญาตให้อนุมัติ ถอยกลับไปใช้ `dm.allowFrom`
- `execApprovals.target`: `"dm"` (ค่าเริ่มต้น), `"channel"` หรือ `"both"`
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: allowlist ของ agent/session แบบไม่บังคับสำหรับการส่งมอบ

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) - ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชตกลุ่มและการควบคุมด้วย mention
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
