---
read_when:
    - คุณต้องการเชื่อมต่อบอต Feishu/Lark
    - คุณกำลังกำหนดค่าช่องทาง Feishu
summary: ภาพรวม ฟีเจอร์ และการกำหนดค่าของบอต Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-25T13:41:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b9cebcedf05a517b03a15ae306cece1a3c07f772c48c54b7ece05ef892d05d2
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark เป็นแพลตฟอร์มการทำงานร่วมกันแบบครบวงจรที่ทีมสามารถแชต แชร์เอกสาร จัดการปฏิทิน และทำงานร่วมกันได้ในที่เดียว

**สถานะ:** พร้อมใช้งานจริงสำหรับ DM ของบอตและแชตกลุ่ม โหมด WebSocket เป็นโหมดเริ่มต้น และโหมด webhook เป็นตัวเลือกเสริม

---

## เริ่มต้นอย่างรวดเร็ว

> **ต้องใช้ OpenClaw 2026.4.25 ขึ้นไป** เรียกใช้ `openclaw --version` เพื่อตรวจสอบ อัปเกรดด้วย `openclaw update`

<Steps>
  <Step title="เรียกใช้ตัวช่วยตั้งค่าช่องทาง">
  ```bash
  openclaw channels login --channel feishu
  ```
  สแกนรหัส QR ด้วยแอป Feishu/Lark บนมือถือของคุณเพื่อสร้างบอต Feishu/Lark โดยอัตโนมัติ
  </Step>
  
  <Step title="หลังจากตั้งค่าเสร็จสิ้น ให้รีสตาร์ท Gateway เพื่อใช้การเปลี่ยนแปลง">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## การควบคุมการเข้าถึง

### ข้อความส่วนตัว

กำหนดค่า `dmPolicy` เพื่อควบคุมว่าใครสามารถส่ง DM ถึงบอตได้:

- `"pairing"` — ผู้ใช้ที่ไม่รู้จักจะได้รับรหัส pairing; อนุมัติผ่าน CLI
- `"allowlist"` — เฉพาะผู้ใช้ที่อยู่ใน `allowFrom` เท่านั้นที่แชตได้ (ค่าเริ่มต้น: เจ้าของบอตเท่านั้น)
- `"open"` — อนุญาตผู้ใช้ทั้งหมด
- `"disabled"` — ปิดใช้งาน DM ทั้งหมด

**อนุมัติคำขอ pairing:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### แชตกลุ่ม

**นโยบายกลุ่ม** (`channels.feishu.groupPolicy`):

| ค่า          | การทำงาน                                     |
| ------------ | -------------------------------------------- |
| `"open"`     | ตอบกลับทุกข้อความในกลุ่ม                     |
| `"allowlist"`| ตอบกลับเฉพาะกลุ่มที่อยู่ใน `groupAllowFrom` |
| `"disabled"` | ปิดใช้งานข้อความกลุ่มทั้งหมด                 |

ค่าเริ่มต้น: `allowlist`

**ข้อกำหนดการ mention** (`channels.feishu.requireMention`):

- `true` — ต้อง @mention (ค่าเริ่มต้น)
- `false` — ตอบกลับได้โดยไม่ต้อง @mention
- การแทนที่ต่อกลุ่ม: `channels.feishu.groups.<chat_id>.requireMention`

---

## ตัวอย่างการกำหนดค่ากลุ่ม

### อนุญาตทุกกลุ่ม โดยไม่ต้อง @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### อนุญาตทุกกลุ่ม แต่ยังคงต้อง @mention

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

### อนุญาตเฉพาะบางกลุ่ม

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // รหัสกลุ่มมีลักษณะเช่น: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
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
          // open_id ของผู้ใช้มีลักษณะเช่น: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## ดูรหัสกลุ่ม/ผู้ใช้

### รหัสกลุ่ม (`chat_id`, รูปแบบ: `oc_xxx`)

เปิดกลุ่มใน Feishu/Lark คลิกไอคอนเมนูที่มุมขวาบน แล้วไปที่ **การตั้งค่า** รหัสกลุ่ม (`chat_id`) จะแสดงอยู่ในหน้าการตั้งค่า

![Get Group ID](/images/feishu-get-group-id.png)

### รหัสผู้ใช้ (`open_id`, รูปแบบ: `ou_xxx`)

เริ่มต้น Gateway ส่ง DM ถึงบอต จากนั้นตรวจสอบบันทึก:

```bash
openclaw logs --follow
```

มองหา `open_id` ในผลลัพธ์ของบันทึก คุณยังสามารถตรวจสอบคำขอ pairing ที่รอดำเนินการได้ด้วย:

```bash
openclaw pairing list feishu
```

---

## คำสั่งที่ใช้บ่อย

| คำสั่ง    | คำอธิบาย                    |
| --------- | --------------------------- |
| `/status` | แสดงสถานะบอต               |
| `/reset`  | รีเซ็ตเซสชันปัจจุบัน        |
| `/model`  | แสดงหรือสลับโมเดล AI       |

> Feishu/Lark ไม่รองรับเมนู slash command แบบเนทีฟ ดังนั้นให้ส่งคำสั่งเหล่านี้เป็นข้อความธรรมดา

---

## การแก้ไขปัญหา

### บอตไม่ตอบกลับในแชตกลุ่ม

1. ตรวจสอบให้แน่ใจว่าได้เพิ่มบอตเข้ากลุ่มแล้ว
2. ตรวจสอบให้แน่ใจว่าคุณได้ @mention บอต (จำเป็นโดยค่าเริ่มต้น)
3. ตรวจสอบว่า `groupPolicy` ไม่ได้เป็น `"disabled"`
4. ตรวจสอบบันทึก: `openclaw logs --follow`

### บอตไม่ได้รับข้อความ

1. ตรวจสอบให้แน่ใจว่าบอตได้รับการเผยแพร่และอนุมัติแล้วใน Feishu Open Platform / Lark Developer
2. ตรวจสอบให้แน่ใจว่าการสมัครรับเหตุการณ์มี `im.message.receive_v1`
3. ตรวจสอบให้แน่ใจว่าเลือก **persistent connection** (WebSocket)
4. ตรวจสอบให้แน่ใจว่าได้ให้สิทธิ์ permission scope ที่จำเป็นทั้งหมดแล้ว
5. ตรวจสอบให้แน่ใจว่า Gateway กำลังทำงานอยู่: `openclaw gateway status`
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
          name: "บอตหลัก",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "บอตสำรอง",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` ควบคุมว่าจะใช้บัญชีใดเมื่อ API ขาออกไม่ได้ระบุ `accountId`

### ขีดจำกัดข้อความ

- `textChunkLimit` — ขนาดชิ้นข้อความขาออก (ค่าเริ่มต้น: `2000` อักขระ)
- `mediaMaxMb` — ขีดจำกัดการอัปโหลด/ดาวน์โหลดสื่อ (ค่าเริ่มต้น: `30` MB)

### การสตรีม

Feishu/Lark รองรับการตอบกลับแบบสตรีมผ่านการ์ดแบบโต้ตอบ เมื่อเปิดใช้งาน บอตจะอัปเดตการ์ดแบบเรียลไทม์ขณะสร้างข้อความ

```json5
{
  channels: {
    feishu: {
      streaming: true, // เปิดใช้ผลลัพธ์การ์ดแบบสตรีม (ค่าเริ่มต้น: true)
      blockStreaming: true, // เปิดใช้การสตรีมระดับบล็อก (ค่าเริ่มต้น: true)
    },
  },
}
```

ตั้งค่า `streaming: false` เพื่อส่งคำตอบทั้งหมดในข้อความเดียว

### การปรับแต่งโควตาให้เหมาะสม

ลดจำนวนการเรียก API ของ Feishu/Lark ด้วยแฟล็กเสริมสองรายการ:

- `typingIndicator` (ค่าเริ่มต้น `true`): ตั้งเป็น `false` เพื่อข้ามการเรียกใช้ปฏิกิริยาการพิมพ์
- `resolveSenderNames` (ค่าเริ่มต้น `true`): ตั้งเป็น `false` เพื่อข้ามการค้นหาข้อมูลโปรไฟล์ผู้ส่ง

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

Feishu/Lark รองรับ ACP สำหรับ DM และข้อความเธรดในกลุ่ม ACP ของ Feishu/Lark ขับเคลื่อนด้วยคำสั่งข้อความ — ไม่มีเมนู slash command แบบเนทีฟ ดังนั้นให้ใช้ข้อความ `/acp ...` โดยตรงในการสนทนา

#### การ bind ACP แบบถาวร

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

#### สร้าง ACP จากแชต

ใน DM หรือเธรดของ Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` ใช้งานได้กับ DM และข้อความเธรดของ Feishu/Lark ข้อความติดตามผลในบทสนทนาที่ bind ไว้จะถูกส่งตรงไปยังเซสชัน ACP นั้น

### การกำหนดเส้นทางหลายเอเจนต์

ใช้ `bindings` เพื่อกำหนดเส้นทาง DM หรือกลุ่มของ Feishu/Lark ไปยังเอเจนต์ที่ต่างกัน

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
- `match.peer.kind`: `"direct"` (DM) หรือ `"group"` (แชตกลุ่ม)
- `match.peer.id`: Open ID ของผู้ใช้ (`ou_xxx`) หรือรหัสกลุ่ม (`oc_xxx`)

ดู [ดูรหัสกลุ่ม/ผู้ใช้](#get-groupuser-ids) สำหรับเคล็ดลับในการค้นหา

---

## ข้อมูลอ้างอิงการกำหนดค่า

การกำหนดค่าแบบเต็ม: [การกำหนดค่า Gateway](/th/gateway/configuration)

| การตั้งค่า                                        | คำอธิบาย                                 | ค่าเริ่มต้น      |
| ------------------------------------------------ | ----------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | เปิด/ปิดใช้งานช่องทาง                    | `true`           |
| `channels.feishu.domain`                          | โดเมน API (`feishu` หรือ `lark`)         | `feishu`         |
| `channels.feishu.connectionMode`                  | การขนส่งเหตุการณ์ (`websocket` หรือ `webhook`) | `websocket` |
| `channels.feishu.defaultAccount`                  | บัญชีเริ่มต้นสำหรับการกำหนดเส้นทางขาออก | `default`        |
| `channels.feishu.verificationToken`               | จำเป็นสำหรับโหมด webhook                 | —                |
| `channels.feishu.encryptKey`                      | จำเป็นสำหรับโหมด webhook                 | —                |
| `channels.feishu.webhookPath`                     | พาธเส้นทาง webhook                       | `/feishu/events` |
| `channels.feishu.webhookHost`                     | โฮสต์ bind ของ webhook                   | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | พอร์ต bind ของ webhook                   | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                    | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                | —                |
| `channels.feishu.accounts.<id>.domain`            | การแทนที่โดเมนต่อบัญชี                   | `feishu`         |
| `channels.feishu.dmPolicy`                        | นโยบาย DM                                 | `allowlist`      |
| `channels.feishu.allowFrom`                       | allowlist ของ DM (รายการ open_id)        | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | นโยบายกลุ่ม                               | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | allowlist ของกลุ่ม                        | —                |
| `channels.feishu.requireMention`                  | ต้องมี @mention ในกลุ่ม                  | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | การแทนที่ @mention ต่อกลุ่ม               | สืบทอดค่า        |
| `channels.feishu.groups.<chat_id>.enabled`        | เปิด/ปิดใช้งานกลุ่มที่ระบุ               | `true`           |
| `channels.feishu.textChunkLimit`                  | ขนาดชิ้นข้อความ                           | `2000`           |
| `channels.feishu.mediaMaxMb`                      | ขีดจำกัดขนาดสื่อ                         | `30`             |
| `channels.feishu.streaming`                       | ผลลัพธ์การ์ดแบบสตรีม                     | `true`           |
| `channels.feishu.blockStreaming`                  | การสตรีมระดับบล็อก                       | `true`           |
| `channels.feishu.typingIndicator`                 | ส่งปฏิกิริยาการพิมพ์                     | `true`           |
| `channels.feishu.resolveSenderNames`              | แปลงชื่อแสดงผลของผู้ส่ง                  | `true`           |

---

## ประเภทข้อความที่รองรับ

### รับ

- ✅ ข้อความ
- ✅ Rich text (post)
- ✅ รูปภาพ
- ✅ ไฟล์
- ✅ เสียง
- ✅ วิดีโอ/สื่อ
- ✅ สติกเกอร์

### ส่ง

- ✅ ข้อความ
- ✅ รูปภาพ
- ✅ ไฟล์
- ✅ เสียง
- ✅ วิดีโอ/สื่อ
- ✅ การ์ดแบบโต้ตอบ (รวมถึงการอัปเดตแบบสตรีม)
- ⚠️ Rich text (การจัดรูปแบบแบบ post; ไม่รองรับความสามารถในการเขียนแบบเต็มรูปแบบของ Feishu/Lark)

บับเบิลเสียงแบบเนทีฟของ Feishu/Lark ใช้ชนิดข้อความ Feishu `audio` และต้องใช้อัปโหลดสื่อแบบ Ogg/Opus (`file_type: "opus"`). สื่อ `.opus` และ `.ogg` ที่มีอยู่แล้วจะถูกส่งเป็นเสียงแบบเนทีฟโดยตรง ส่วน MP3/WAV/M4A และรูปแบบเสียงอื่นที่น่าจะใช่ จะถูกแปลงเป็น Ogg/Opus 48kHz ด้วย `ffmpeg` เฉพาะเมื่อการตอบกลับร้องขอการส่งแบบเสียง (`audioAsVoice` / message tool `asVoice` รวมถึงการตอบกลับ TTS แบบ voice note) ไฟล์แนบ MP3 ทั่วไปจะยังคงถูกส่งเป็นไฟล์ปกติ หากไม่มี `ffmpeg` หรือการแปลงล้มเหลว OpenClaw จะย้อนกลับไปใช้ไฟล์แนบและบันทึกสาเหตุไว้

### เธรดและการตอบกลับ

- ✅ การตอบกลับแบบอินไลน์
- ✅ การตอบกลับในเธรด
- ✅ การตอบกลับสื่อยังคงรับรู้เธรดเมื่อกำลังตอบกลับข้อความในเธรด

สำหรับ `groupSessionScope: "group_topic"` และ `"group_topic_sender"` กลุ่มหัวข้อแบบเนทีฟของ Feishu/Lark จะใช้ event `thread_id` (`omt_*`) เป็นคีย์เซสชันของหัวข้อแบบ canonical ส่วนการตอบกลับกลุ่มปกติที่ OpenClaw แปลงเป็นเธรดจะยังคงใช้รหัสข้อความรากของการตอบกลับ (`om_*`) เพื่อให้เทิร์นแรกและเทิร์นติดตามผลอยู่ในเซสชันเดียวกัน

---

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์ pairing
- [Groups](/th/channels/groups) — พฤติกรรมของแชตกลุ่มและการกำหนดให้มีการ mention
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
