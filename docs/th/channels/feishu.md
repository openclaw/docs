---
read_when:
    - คุณต้องการเชื่อมต่อบอต Feishu/Lark
    - คุณกำลังกำหนดค่าช่องทาง Feishu
summary: ภาพรวม คุณสมบัติ และการกำหนดค่าของบอต Feishu
title: Feishu
x-i18n:
    generated_at: "2026-05-03T21:27:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16d8156d215d47fa6e7d810e3a70eb8e84176a681669c27de8f58320be83a7a0
    source_path: channels/feishu.md
    workflow: 16
---

# Feishu / Lark

Feishu/Lark เป็นแพลตฟอร์มการทำงานร่วมกันแบบครบวงจรที่ทีมใช้แชท แชร์เอกสาร จัดการปฏิทิน และทำงานร่วมกันให้เสร็จได้

**สถานะ:** พร้อมใช้งานจริงสำหรับ DM ของบอตและแชทกลุ่ม WebSocket เป็นโหมดเริ่มต้น ส่วนโหมด Webhook เป็นตัวเลือกเสริม

---

## เริ่มต้นอย่างรวดเร็ว

<Note>
ต้องใช้ OpenClaw 2026.4.25 ขึ้นไป เรียกใช้ `openclaw --version` เพื่อตรวจสอบ อัปเกรดด้วย `openclaw update`
</Note>

<Steps>
  <Step title="เรียกใช้ตัวช่วยตั้งค่าช่องทาง">
  ```bash
  openclaw channels login --channel feishu
  ```
  สแกนคิวอาร์โค้ดด้วยแอปมือถือ Feishu/Lark เพื่อสร้างบอต Feishu/Lark โดยอัตโนมัติ
  </Step>
  
  <Step title="หลังจากตั้งค่าเสร็จแล้ว ให้รีสตาร์ท Gateway เพื่อใช้การเปลี่ยนแปลง">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## การควบคุมการเข้าถึง

### ข้อความส่วนตัว

กำหนดค่า `dmPolicy` เพื่อควบคุมว่าใครสามารถส่ง DM ถึงบอตได้:

- `"pairing"` — ผู้ใช้ที่ไม่รู้จักจะได้รับรหัสจับคู่ อนุมัติผ่าน CLI
- `"allowlist"` — เฉพาะผู้ใช้ที่ระบุไว้ใน `allowFrom` เท่านั้นที่แชทได้ (ค่าเริ่มต้น: เฉพาะเจ้าของบอต)
- `"open"` — อนุญาต DM สาธารณะเฉพาะเมื่อ `allowFrom` มี `"*"`; หากมีรายการแบบจำกัด เฉพาะผู้ใช้ที่ตรงกันเท่านั้นที่แชทได้
- `"disabled"` — ปิดใช้งาน DM ทั้งหมด

**อนุมัติคำขอจับคู่:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### แชทกลุ่ม

**นโยบายกลุ่ม** (`channels.feishu.groupPolicy`):

| ค่า           | พฤติกรรม                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | ตอบกลับทุกข้อความในกลุ่ม                                                            |
| `"allowlist"` | ตอบกลับเฉพาะกลุ่มใน `groupAllowFrom` หรือกลุ่มที่กำหนดไว้อย่างชัดเจนภายใต้ `groups.<chat_id>` |
| `"disabled"`  | ปิดใช้งานข้อความกลุ่มทั้งหมด รายการ `groups.<chat_id>` ที่กำหนดไว้อย่างชัดเจนจะไม่แทนที่ค่านี้         |

ค่าเริ่มต้น: `allowlist`

**ข้อกำหนดการกล่าวถึง** (`channels.feishu.requireMention`):

- `true` — ต้องมี @mention (ค่าเริ่มต้น)
- `false` — ตอบกลับโดยไม่ต้องมี @mention
- การแทนที่เฉพาะกลุ่ม: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` และ `@_all` ที่ใช้สำหรับประกาศถึงทุกคนเท่านั้น จะไม่ถือว่าเป็นการกล่าวถึงบอต ข้อความที่กล่าวถึงทั้ง `@all` และบอตโดยตรงยังคงนับว่าเป็นการกล่าวถึงบอต

---

## ตัวอย่างการกำหนดค่ากลุ่ม

### อนุญาตทุกกลุ่ม ไม่ต้องมี @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### อนุญาตทุกกลุ่ม แต่ยังต้องมี @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### อนุญาตเฉพาะบางกลุ่มเท่านั้น

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

ในโหมด `allowlist` คุณยังสามารถอนุญาตกลุ่มได้ด้วยการเพิ่มรายการ `groups.<chat_id>` อย่างชัดเจน รายการที่กำหนดไว้อย่างชัดเจนจะไม่แทนที่ `groupPolicy: "disabled"` ค่าเริ่มต้นแบบไวลด์การ์ดภายใต้ `groups.*` ใช้กำหนดค่าสำหรับกลุ่มที่ตรงกัน แต่จะไม่อนุญาตกลุ่มด้วยตัวเอง

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### จำกัดผู้ส่งภายในกลุ่ม

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## รับ ID ของกลุ่ม/ผู้ใช้

### ID ของกลุ่ม (`chat_id`, รูปแบบ: `oc_xxx`)

เปิดกลุ่มใน Feishu/Lark คลิกไอคอนเมนูที่มุมขวาบน แล้วไปที่ **การตั้งค่า** ID ของกลุ่ม (`chat_id`) จะแสดงอยู่บนหน้าการตั้งค่า

![รับ ID ของกลุ่ม](/images/feishu-get-group-id.png)

### ID ของผู้ใช้ (`open_id`, รูปแบบ: `ou_xxx`)

เริ่ม Gateway ส่ง DM ถึงบอต แล้วตรวจสอบบันทึก:

```bash
openclaw logs --follow
```

มองหา `open_id` ในผลลัพธ์บันทึก คุณยังสามารถตรวจสอบคำขอจับคู่ที่รอดำเนินการได้:

```bash
openclaw pairing list feishu
```

---

## คำสั่งทั่วไป

| คำสั่ง    | คำอธิบาย                 |
| --------- | --------------------------- |
| `/status` | แสดงสถานะบอต             |
| `/reset`  | รีเซ็ตเซสชันปัจจุบัน   |
| `/model`  | แสดงหรือสลับโมเดล AI |

<Note>
Feishu/Lark ไม่รองรับเมนูคำสั่งสแลชแบบเนทีฟ ดังนั้นให้ส่งคำสั่งเหล่านี้เป็นข้อความธรรมดา
</Note>

---

## การแก้ไขปัญหา

### บอตไม่ตอบกลับในแชทกลุ่ม

1. ตรวจสอบว่าบอตถูกเพิ่มเข้าไปในกลุ่มแล้ว
2. ตรวจสอบว่าคุณ @mention บอต (จำเป็นตามค่าเริ่มต้น)
3. ตรวจสอบว่า `groupPolicy` ไม่ใช่ `"disabled"`
4. ตรวจสอบบันทึก: `openclaw logs --follow`

### บอตไม่ได้รับข้อความ

1. ตรวจสอบว่าบอตถูกเผยแพร่และได้รับการอนุมัติใน Feishu Open Platform / Lark Developer แล้ว
2. ตรวจสอบว่าการสมัครรับอีเวนต์มี `im.message.receive_v1`
3. ตรวจสอบว่าเลือก **การเชื่อมต่อแบบถาวร** (WebSocket) แล้ว
4. ตรวจสอบว่าได้ให้ขอบเขตสิทธิ์ที่จำเป็นทั้งหมดแล้ว
5. ตรวจสอบว่า Gateway กำลังทำงานอยู่: `openclaw gateway status`
6. ตรวจสอบบันทึก: `openclaw logs --follow`

### App Secret รั่วไหล

1. รีเซ็ต App Secret ใน Feishu Open Platform / Lark Developer
2. อัปเดตค่าใน config ของคุณ
3. รีสตาร์ท Gateway: `openclaw gateway restart`

---

## การกำหนดค่าขั้นสูง

### หลายบัญชี

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` ควบคุมว่าจะใช้บัญชีใดเมื่อ API ขาออกไม่ได้ระบุ `accountId`
`accounts.<id>.tts` ใช้โครงสร้างเดียวกับ `messages.tts` และรวมแบบลึกทับ
config TTS ส่วนกลาง ดังนั้นการตั้งค่า Feishu แบบหลายบอตจึงสามารถเก็บข้อมูลรับรอง
ของผู้ให้บริการร่วมไว้ในระดับส่วนกลาง พร้อมแทนที่เฉพาะเสียง โมเดล บุคลิก หรือโหมดอัตโนมัติ
ในแต่ละบัญชีได้

### ขีดจำกัดข้อความ

- `textChunkLimit` — ขนาดชิ้นส่วนข้อความขาออก (ค่าเริ่มต้น: `2000` อักขระ)
- `mediaMaxMb` — ขีดจำกัดการอัปโหลด/ดาวน์โหลดสื่อ (ค่าเริ่มต้น: `30` MB)

### การสตรีม

Feishu/Lark รองรับการตอบกลับแบบสตรีมผ่านการ์ดแบบโต้ตอบ เมื่อเปิดใช้งาน บอตจะอัปเดตการ์ดแบบเรียลไทม์ขณะสร้างข้อความ

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

ตั้งค่า `streaming: false` เพื่อส่งคำตอบทั้งหมดในข้อความเดียว `blockStreaming` ปิดอยู่ตามค่าเริ่มต้น เปิดใช้เฉพาะเมื่อคุณต้องการให้บล็อกของผู้ช่วยที่เสร็จแล้วถูกส่งออกก่อนคำตอบสุดท้าย

### การเพิ่มประสิทธิภาพโควตา

ลดจำนวนการเรียก Feishu/Lark API ด้วยแฟล็กเสริมสองรายการ:

- `typingIndicator` (ค่าเริ่มต้น `true`): ตั้งค่าเป็น `false` เพื่อข้ามการเรียกปฏิกิริยากำลังพิมพ์
- `resolveSenderNames` (ค่าเริ่มต้น `true`): ตั้งค่าเป็น `false` เพื่อข้ามการค้นหาโปรไฟล์ผู้ส่ง

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### เซสชัน ACP

Feishu/Lark รองรับ ACP สำหรับ DM และข้อความเธรดของกลุ่ม ACP ของ Feishu/Lark ขับเคลื่อนด้วยคำสั่งข้อความ ไม่มีเมนูคำสั่งสแลชแบบเนทีฟ ดังนั้นให้ใช้ข้อความ `/acp ...` โดยตรงในการสนทนา

#### การผูก ACP แบบถาวร

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### เรียก ACP จากแชท

ใน DM หรือเธรดของ Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` ใช้ได้กับ DM และข้อความเธรดของ Feishu/Lark ข้อความถัดไปในการสนทนาที่ผูกไว้จะถูกส่งตรงไปยังเซสชัน ACP นั้น

### การกำหนดเส้นทางแบบหลายเอเจนต์

ใช้ `bindings` เพื่อกำหนดเส้นทาง DM หรือกลุ่มของ Feishu/Lark ไปยังเอเจนต์ต่างกัน

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

ฟิลด์การกำหนดเส้นทาง:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) หรือ `"group"` (แชทกลุ่ม)
- `match.peer.id`: Open ID ของผู้ใช้ (`ou_xxx`) หรือ ID ของกลุ่ม (`oc_xxx`)

ดู [รับ ID ของกลุ่ม/ผู้ใช้](#get-groupuser-ids) สำหรับเคล็ดลับการค้นหา

---

## อ้างอิงการกำหนดค่า

การกำหนดค่าทั้งหมด: [การกำหนดค่า Gateway](/th/gateway/configuration)

| การตั้งค่า                                           | คำอธิบาย                                                                      | ค่าเริ่มต้น          |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | เปิด/ปิดช่องทาง                                                       | `true`           |
| `channels.feishu.domain`                          | โดเมน API (`feishu` หรือ `lark`)                                                  | `feishu`         |
| `channels.feishu.connectionMode`                  | การขนส่งเหตุการณ์ (`websocket` หรือ `webhook`)                                       | `websocket`      |
| `channels.feishu.defaultAccount`                  | บัญชีเริ่มต้นสำหรับการกำหนดเส้นทางขาออก                                             | `default`        |
| `channels.feishu.verificationToken`               | จำเป็นสำหรับโหมด webhook                                                        | —                |
| `channels.feishu.encryptKey`                      | จำเป็นสำหรับโหมด webhook                                                        | —                |
| `channels.feishu.webhookPath`                     | เส้นทาง Route ของ Webhook                                                               | `/feishu/events` |
| `channels.feishu.webhookHost`                     | โฮสต์ที่ Webhook bind                                                                | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | พอร์ตที่ Webhook bind                                                                | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                                                           | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                                                       | —                |
| `channels.feishu.accounts.<id>.domain`            | การแทนที่โดเมนรายบัญชี                                                      | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | การแทนที่ TTS รายบัญชี                                                         | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | นโยบาย DM                                                                        | `allowlist`      |
| `channels.feishu.allowFrom`                       | รายการอนุญาต DM (รายการ open_id)                                                      | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | นโยบายกลุ่ม                                                                     | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | รายการอนุญาตของกลุ่ม                                                                  | —                |
| `channels.feishu.requireMention`                  | ต้องมี @mention ในกลุ่ม                                                       | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | การแทนที่ @mention รายกลุ่ม; ID ที่ระบุชัดเจนยังอนุญาตให้กลุ่มเข้าได้ในโหมดรายการอนุญาต | สืบทอด        |
| `channels.feishu.groups.<chat_id>.enabled`        | เปิด/ปิดกลุ่มที่ระบุ                                                  | `true`           |
| `channels.feishu.textChunkLimit`                  | ขนาดชิ้นส่วนข้อความ                                                               | `2000`           |
| `channels.feishu.mediaMaxMb`                      | ขีดจำกัดขนาดสื่อ                                                                 | `30`             |
| `channels.feishu.streaming`                       | เอาต์พุตการ์ดแบบสตรีม                                                            | `true`           |
| `channels.feishu.blockStreaming`                  | การสตรีมการตอบกลับแบบบล็อกที่เสร็จสมบูรณ์                                                  | `false`          |
| `channels.feishu.typingIndicator`                 | ส่งปฏิกิริยากำลังพิมพ์                                                            | `true`           |
| `channels.feishu.resolveSenderNames`              | แปลงชื่อที่แสดงของผู้ส่ง                                                     | `true`           |

---

## ประเภทข้อความที่รองรับ

### รับ

- ✅ ข้อความ
- ✅ ข้อความแบบ Rich text (โพสต์)
- ✅ รูปภาพ
- ✅ ไฟล์
- ✅ เสียง
- ✅ วิดีโอ/สื่อ
- ✅ สติกเกอร์

ข้อความเสียงขาเข้าของ Feishu/Lark จะถูกทำให้เป็นมาตรฐานเป็นตัวแทนสื่อแทน
JSON `file_key` ดิบ เมื่อกำหนดค่า `tools.media.audio` แล้ว OpenClaw
จะดาวน์โหลดทรัพยากรบันทึกเสียงและเรียกใช้การถอดเสียงร่วมก่อนเทิร์นของ
เอเจนต์ เพื่อให้เอเจนต์ได้รับข้อความถอดเสียงพูด หาก Feishu ใส่
ข้อความถอดเสียงมาโดยตรงในเพย์โหลดเสียง ข้อความนั้นจะถูกใช้โดยไม่เรียก
ASR อีกครั้ง หากไม่มีผู้ให้บริการถอดเสียง เอเจนต์ยังคงได้รับ
ตัวแทน `<media:audio>` พร้อมไฟล์แนบที่บันทึกไว้ ไม่ใช่เพย์โหลดทรัพยากร
Feishu ดิบ

### ส่ง

- ✅ ข้อความ
- ✅ รูปภาพ
- ✅ ไฟล์
- ✅ เสียง
- ✅ วิดีโอ/สื่อ
- ✅ การ์ดแบบโต้ตอบ (รวมถึงการอัปเดตแบบสตรีม)
- ⚠️ ข้อความแบบ Rich text (การจัดรูปแบบสไตล์โพสต์; ไม่รองรับความสามารถการเขียนเต็มรูปแบบของ Feishu/Lark)

บับเบิลเสียงแบบเนทีฟของ Feishu/Lark ใช้ชนิดข้อความ `audio` ของ Feishu และต้องใช้
สื่ออัปโหลด Ogg/Opus (`file_type: "opus"`) สื่อ `.opus` และ `.ogg` ที่มีอยู่
จะถูกส่งโดยตรงเป็นเสียงแบบเนทีฟ MP3/WAV/M4A และรูปแบบอื่นที่น่าจะเป็นเสียง
จะถูกแปลงเป็น Ogg/Opus 48kHz ด้วย `ffmpeg` เฉพาะเมื่อการตอบกลับร้องขอการส่งแบบเสียง
(`audioAsVoice` / เครื่องมือข้อความ `asVoice` รวมถึงการตอบกลับบันทึกเสียง
TTS) ไฟล์แนบ MP3 ปกติจะยังคงเป็นไฟล์ทั่วไป หากไม่มี `ffmpeg` หรือ
การแปลงล้มเหลว OpenClaw จะย้อนกลับไปใช้ไฟล์แนบและบันทึกเหตุผลไว้

### เธรดและการตอบกลับ

- ✅ การตอบกลับแบบอินไลน์
- ✅ การตอบกลับในเธรด
- ✅ การตอบกลับด้วยสื่อยังคงรับรู้เธรดเมื่อกำลังตอบกลับข้อความในเธรด

สำหรับ `groupSessionScope: "group_topic"` และ `"group_topic_sender"` กลุ่มหัวข้อ
แบบเนทีฟของ Feishu/Lark ใช้ `thread_id` (`omt_*`) ของเหตุการณ์เป็นคีย์เซสชัน
หัวข้อหลัก การตอบกลับกลุ่มปกติที่ OpenClaw แปลงเป็นเธรดจะยังคงใช้
ID ข้อความรากของการตอบกลับ (`om_*`) เพื่อให้เทิร์นแรกและเทิร์นติดตามผล
ยังอยู่ในเซสชันเดียวกัน

---

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการกำหนดให้มีการ mention
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเพิ่มความแข็งแกร่ง
