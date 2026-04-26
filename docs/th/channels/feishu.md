---
read_when:
    - คุณต้องการเชื่อมต่อบอต Feishu/Lark
    - คุณกำลังกำหนดค่าช่องทาง Feishu
summary: ภาพรวม ฟีเจอร์ และการกำหนดค่าของบอต Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-26T11:22:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95a50a7cd7b290afe0a0db3a1b39c7305f6a0e7d0702597fb9a50b5a45afa855
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark เป็นแพลตฟอร์มการทำงานร่วมกันแบบครบวงจรที่ทีมสามารถแชต แชร์เอกสาร จัดการปฏิทิน และทำงานร่วมกันได้ในที่เดียว

**สถานะ:** พร้อมใช้งานจริงสำหรับข้อความส่วนตัวของบอตและแชตกลุ่ม โหมด WebSocket เป็นโหมดเริ่มต้น; โหมด webhook เป็นตัวเลือกเพิ่มเติม

---

## เริ่มต้นอย่างรวดเร็ว

> **ต้องใช้ OpenClaw 2026.4.25 ขึ้นไป** รัน `openclaw --version` เพื่อตรวจสอบ อัปเกรดด้วย `openclaw update`

<Steps>
  <Step title="เรียกใช้ตัวช่วยตั้งค่าช่องทาง">
  ```bash
  openclaw channels login --channel feishu
  ```
  สแกน QR code ด้วยแอปมือถือ Feishu/Lark เพื่อสร้างบอต Feishu/Lark โดยอัตโนมัติ
  </Step>
  
  <Step title="หลังจากตั้งค่าเสร็จแล้ว ให้รีสตาร์ต Gateway เพื่อให้การเปลี่ยนแปลงมีผล">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## การควบคุมการเข้าถึง

### ข้อความส่วนตัว

กำหนดค่า `dmPolicy` เพื่อควบคุมว่าใครสามารถส่งข้อความส่วนตัวถึงบอตได้:

- `"pairing"` — ผู้ใช้ที่ไม่รู้จักจะได้รับรหัส pairing; อนุมัติผ่าน CLI
- `"allowlist"` — เฉพาะผู้ใช้ที่อยู่ใน `allowFrom` เท่านั้นที่สามารถแชตได้ (ค่าเริ่มต้น: เฉพาะเจ้าของบอต)
- `"open"` — อนุญาตผู้ใช้ทุกคน
- `"disabled"` — ปิดใช้งานข้อความส่วนตัวทั้งหมด

**อนุมัติคำขอ pairing:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### แชตกลุ่ม

**นโยบายกลุ่ม** (`channels.feishu.groupPolicy`):

| Value         | พฤติกรรม |
| ------------- | --------- |
| `"open"`      | ตอบกลับทุกข้อความในกลุ่ม |
| `"allowlist"` | ตอบกลับเฉพาะกลุ่มใน `groupAllowFrom` |
| `"disabled"`  | ปิดใช้งานข้อความกลุ่มทั้งหมด |

ค่าเริ่มต้น: `allowlist`

**ข้อกำหนดการ mention** (`channels.feishu.requireMention`):

- `true` — ต้องมีการ @mention (ค่าเริ่มต้น)
- `false` — ตอบกลับได้โดยไม่ต้อง @mention
- การแทนที่เป็นรายกลุ่ม: `channels.feishu.groups.<chat_id>.requireMention`

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
      // Group IDs มีลักษณะเช่น: oc_xxx
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
          // User open_ids มีลักษณะเช่น: ou_xxx
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

เปิดกลุ่มใน Feishu/Lark คลิกไอคอนเมนูที่มุมขวาบน แล้วไปที่ **Settings** ID ของกลุ่ม (`chat_id`) จะแสดงอยู่ในหน้าการตั้งค่า

![รับ ID ของกลุ่ม](/images/feishu-get-group-id.png)

### ID ของผู้ใช้ (`open_id`, รูปแบบ: `ou_xxx`)

เริ่มต้น Gateway ส่งข้อความส่วนตัวถึงบอต จากนั้นตรวจสอบ log:

```bash
openclaw logs --follow
```

มองหา `open_id` ในผลลัพธ์ของ log คุณยังสามารถตรวจสอบคำขอ pairing ที่รอดำเนินการได้:

```bash
openclaw pairing list feishu
```

---

## คำสั่งที่ใช้บ่อย

| Command   | คำอธิบาย |
| --------- | --------- |
| `/status` | แสดงสถานะของบอต |
| `/reset`  | รีเซ็ตเซสชันปัจจุบัน |
| `/model`  | แสดงหรือสลับโมเดล AI |

> Feishu/Lark ไม่รองรับเมนู slash command แบบเนทีฟ ดังนั้นให้ส่งคำสั่งเหล่านี้เป็นข้อความธรรมดา

---

## การแก้ไขปัญหา

### บอตไม่ตอบกลับในแชตกลุ่ม

1. ตรวจสอบให้แน่ใจว่าได้เพิ่มบอตเข้ากลุ่มแล้ว
2. ตรวจสอบให้แน่ใจว่าคุณ @mention บอต (จำเป็นโดยค่าเริ่มต้น)
3. ตรวจสอบว่า `groupPolicy` ไม่ได้เป็น `"disabled"`
4. ตรวจสอบ log: `openclaw logs --follow`

### บอตไม่ได้รับข้อความ

1. ตรวจสอบให้แน่ใจว่าได้เผยแพร่และอนุมัติบอตแล้วใน Feishu Open Platform / Lark Developer
2. ตรวจสอบให้แน่ใจว่าการสมัครรับ event มี `im.message.receive_v1`
3. ตรวจสอบให้แน่ใจว่าได้เลือก **persistent connection** (WebSocket)
4. ตรวจสอบให้แน่ใจว่าได้ให้สิทธิ์ permission scope ที่จำเป็นครบทั้งหมด
5. ตรวจสอบให้แน่ใจว่า Gateway กำลังทำงานอยู่: `openclaw gateway status`
6. ตรวจสอบ log: `openclaw logs --follow`

### App Secret รั่วไหล

1. รีเซ็ต App Secret ใน Feishu Open Platform / Lark Developer
2. อัปเดตค่าใน config ของคุณ
3. รีสตาร์ต Gateway: `openclaw gateway restart`

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

`defaultAccount` ควบคุมว่าจะใช้บัญชีใดเมื่อ outbound API ไม่ได้ระบุ `accountId`
`accounts.<id>.tts` ใช้โครงสร้างเดียวกับ `messages.tts` และทำ deep-merge ทับบน
config TTS ส่วนกลาง ดังนั้นการตั้งค่า Feishu แบบหลายบอตจึงสามารถเก็บข้อมูลรับรองของผู้ให้บริการที่ใช้ร่วมกันไว้ส่วนกลางได้ ขณะเดียวกันก็แทนที่เฉพาะเสียง โมเดล persona หรือโหมดอัตโนมัติแยกตามบัญชีได้

### ขีดจำกัดข้อความ

- `textChunkLimit` — ขนาดชังก์ของข้อความขาออก (ค่าเริ่มต้น: `2000` อักขระ)
- `mediaMaxMb` — ขีดจำกัดการอัปโหลด/ดาวน์โหลดสื่อ (ค่าเริ่มต้น: `30` MB)

### การสตรีม

Feishu/Lark รองรับการตอบกลับแบบสตรีมผ่านการ์ดแบบโต้ตอบ เมื่อเปิดใช้งาน บอตจะอัปเดตการ์ดแบบเรียลไทม์ขณะสร้างข้อความ

```json5
{
  channels: {
    feishu: {
      streaming: true, // เปิดใช้เอาต์พุตการ์ดแบบสตรีม (ค่าเริ่มต้น: true)
      blockStreaming: true, // เปิดใช้การสตรีมระดับบล็อก (ค่าเริ่มต้น: true)
    },
  },
}
```

ตั้งค่า `streaming: false` เพื่อส่งคำตอบทั้งหมดในข้อความเดียว

### การปรับใช้โควตาให้เหมาะสม

ลดจำนวนการเรียก Feishu/Lark API ด้วยแฟล็กเพิ่มเติม 2 รายการ:

- `typingIndicator` (ค่าเริ่มต้น `true`): ตั้งเป็น `false` เพื่อข้ามการเรียก typing reaction
- `resolveSenderNames` (ค่าเริ่มต้น `true`): ตั้งเป็น `false` เพื่อข้ามการค้นหาโปรไฟล์ผู้ส่ง

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

Feishu/Lark รองรับ ACP สำหรับข้อความส่วนตัวและข้อความในเธรดกลุ่ม ACP ของ Feishu/Lark ขับเคลื่อนด้วยคำสั่งข้อความ — ไม่มีเมนู slash command แบบเนทีฟ ดังนั้นให้ใช้ข้อความ `/acp ...` โดยตรงภายในการสนทนา

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

#### สร้าง ACP จากแชต

ในข้อความส่วนตัวหรือเธรดของ Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` ใช้งานได้ทั้งกับข้อความส่วนตัวและข้อความในเธรดของ Feishu/Lark ข้อความติดตามในบทสนทนาที่ผูกไว้จะถูกส่งตรงไปยังเซสชัน ACP นั้น

### การกำหนดเส้นทางหลายเอเจนต์

ใช้ `bindings` เพื่อกำหนดเส้นทางข้อความส่วนตัวหรือกลุ่มของ Feishu/Lark ไปยังเอเจนต์ต่างกัน

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
- `match.peer.kind`: `"direct"` (ข้อความส่วนตัว) หรือ `"group"` (แชตกลุ่ม)
- `match.peer.id`: Open ID ของผู้ใช้ (`ou_xxx`) หรือ ID ของกลุ่ม (`oc_xxx`)

ดู [รับ ID ของกลุ่ม/ผู้ใช้](#get-groupuser-ids) สำหรับเคล็ดลับในการค้นหา

---

## ข้อมูลอ้างอิงการกำหนดค่า

การกำหนดค่าแบบเต็ม: [การกำหนดค่า Gateway](/th/gateway/configuration)

| Setting                                           | คำอธิบาย | Default |
| ------------------------------------------------- | --------- | ------- |
| `channels.feishu.enabled`                         | เปิด/ปิดใช้งานช่องทาง | `true` |
| `channels.feishu.domain`                          | โดเมน API (`feishu` หรือ `lark`) | `feishu` |
| `channels.feishu.connectionMode`                  | การขนส่ง event (`websocket` หรือ `webhook`) | `websocket` |
| `channels.feishu.defaultAccount`                  | บัญชีเริ่มต้นสำหรับการกำหนดเส้นทางขาออก | `default` |
| `channels.feishu.verificationToken`               | จำเป็นสำหรับโหมด webhook | — |
| `channels.feishu.encryptKey`                      | จำเป็นสำหรับโหมด webhook | — |
| `channels.feishu.webhookPath`                     | พาธเส้นทาง Webhook | `/feishu/events` |
| `channels.feishu.webhookHost`                     | โฮสต์ bind ของ Webhook | `127.0.0.1` |
| `channels.feishu.webhookPort`                     | พอร์ต bind ของ Webhook | `3000` |
| `channels.feishu.accounts.<id>.appId`             | App ID | — |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret | — |
| `channels.feishu.accounts.<id>.domain`            | การแทนที่โดเมนแยกตามบัญชี | `feishu` |
| `channels.feishu.accounts.<id>.tts`               | การแทนที่ TTS แยกตามบัญชี | `messages.tts` |
| `channels.feishu.dmPolicy`                        | นโยบายข้อความส่วนตัว | `allowlist` |
| `channels.feishu.allowFrom`                       | allowlist ของข้อความส่วนตัว (รายการ `open_id`) | [BotOwnerId] |
| `channels.feishu.groupPolicy`                     | นโยบายกลุ่ม | `allowlist` |
| `channels.feishu.groupAllowFrom`                  | allowlist ของกลุ่ม | — |
| `channels.feishu.requireMention`                  | ต้องมี @mention ในกลุ่ม | `true` |
| `channels.feishu.groups.<chat_id>.requireMention` | การแทนที่ @mention แยกตามกลุ่ม | inherited |
| `channels.feishu.groups.<chat_id>.enabled`        | เปิด/ปิดใช้งานกลุ่มที่ระบุ | `true` |
| `channels.feishu.textChunkLimit`                  | ขนาดชังก์ของข้อความ | `2000` |
| `channels.feishu.mediaMaxMb`                      | ขีดจำกัดขนาดสื่อ | `30` |
| `channels.feishu.streaming`                       | เอาต์พุตการ์ดแบบสตรีม | `true` |
| `channels.feishu.blockStreaming`                  | การสตรีมระดับบล็อก | `true` |
| `channels.feishu.typingIndicator`                 | ส่ง typing reaction | `true` |
| `channels.feishu.resolveSenderNames`              | แปลงชื่อที่แสดงของผู้ส่ง | `true` |

---

## ประเภทข้อความที่รองรับ

### รับเข้า

- ✅ ข้อความ
- ✅ Rich text (post)
- ✅ รูปภาพ
- ✅ ไฟล์
- ✅ เสียง
- ✅ วิดีโอ/สื่อ
- ✅ สติกเกอร์

ข้อความเสียงขาเข้าของ Feishu/Lark จะถูกทำให้เป็นมาตรฐานเป็น placeholder สื่อแทน
JSON `file_key` ดิบ เมื่อมีการกำหนดค่า `tools.media.audio` OpenClaw
จะดาวน์โหลดทรัพยากร voice note และรันการถอดเสียงเสียงแบบใช้ร่วมกันก่อนถึงรอบของ
เอเจนต์ เพื่อให้เอเจนต์ได้รับข้อความถอดจากเสียงพูด หาก Feishu มี
ข้อความถอดเสียงมาให้โดยตรงใน payload เสียงอยู่แล้ว ก็จะใช้ข้อความนั้นโดยไม่เรียก
ASR เพิ่ม หากไม่มีผู้ให้บริการถอดเสียงเสียง เอเจนต์จะยังคงได้รับ
placeholder `<media:audio>` พร้อมไฟล์แนบที่บันทึกไว้ ไม่ใช่ payload ทรัพยากร Feishu แบบดิบ

### ส่ง

- ✅ ข้อความ
- ✅ รูปภาพ
- ✅ ไฟล์
- ✅ เสียง
- ✅ วิดีโอ/สื่อ
- ✅ การ์ดแบบโต้ตอบ (รวมถึงการอัปเดตแบบสตรีม)
- ⚠️ Rich text (การจัดรูปแบบสไตล์ post; ไม่รองรับความสามารถในการเขียนแบบเต็มของ Feishu/Lark)

บับเบิลเสียงแบบเนทีฟของ Feishu/Lark ใช้ชนิดข้อความ Feishu `audio` และต้องใช้
สื่ออัปโหลด Ogg/Opus (`file_type: "opus"`) ไฟล์สื่อ `.opus` และ `.ogg` ที่มีอยู่แล้ว
จะถูกส่งเป็นเสียงแบบเนทีฟโดยตรง ไฟล์ MP3/WAV/M4A และรูปแบบเสียงอื่นที่น่าจะใช่
จะถูกแปลงเป็น 48kHz Ogg/Opus ด้วย `ffmpeg` เฉพาะเมื่อคำตอบร้องขอการส่งแบบเสียง
(`audioAsVoice` / เครื่องมือข้อความ `asVoice` รวมถึงคำตอบ voice note จาก TTS)
ไฟล์แนบ MP3 ปกติจะยังคงเป็นไฟล์ทั่วไป หากไม่มี `ffmpeg` หรือ
การแปลงล้มเหลว OpenClaw จะย้อนกลับไปใช้ไฟล์แนบและบันทึกเหตุผลไว้ใน log

### เธรดและการตอบกลับ

- ✅ การตอบกลับแบบอินไลน์
- ✅ การตอบกลับในเธรด
- ✅ การตอบกลับสื่อยังคงรับรู้เธรดเมื่อกำลังตอบกลับข้อความในเธรด

สำหรับ `groupSessionScope: "group_topic"` และ `"group_topic_sender"` กลุ่มหัวข้อแบบเนทีฟของ
Feishu/Lark ใช้ `thread_id` (`omt_*`) ของ event เป็นคีย์เซสชันหัวข้อแบบ canonical
การตอบกลับกลุ่มปกติที่ OpenClaw เปลี่ยนให้เป็นเธรดจะยังคงใช้ ID ข้อความรากของการตอบกลับ (`om_*`)
เพื่อให้เทิร์นแรกและเทิร์นติดตามอยู่ในเซสชันเดียวกัน

---

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [Pairing](/th/channels/pairing) — การยืนยันตัวตนข้อความส่วนตัวและโฟลว์ pairing
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการบังคับ mention
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้ปลอดภัยยิ่งขึ้น
