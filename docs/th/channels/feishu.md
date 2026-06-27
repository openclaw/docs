---
read_when:
    - คุณต้องการเชื่อมต่อบอต Feishu/Lark
    - คุณกำลังกำหนดค่าช่องทาง Feishu
summary: ภาพรวม ฟีเจอร์ และการกำหนดค่าบอต Feishu
title: Feishu
x-i18n:
    generated_at: "2026-06-27T17:09:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a12e91ff42b17ee99f07c10933d65a407db8ed9de2ac7bc6028d7004aa4e346
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark เป็นแพลตฟอร์มการทำงานร่วมกันแบบครบวงจรที่ทีมใช้แชต แชร์เอกสาร จัดการปฏิทิน และทำงานร่วมกันให้เสร็จได้

**สถานะ:** พร้อมใช้งานจริงสำหรับ DM ของบอต + แชตกลุ่ม WebSocket เป็นโหมดเริ่มต้น; โหมด webhook เป็นตัวเลือก

---

## เริ่มต้นอย่างรวดเร็ว

<Note>
ต้องใช้ OpenClaw 2026.5.29 ขึ้นไป รัน `openclaw --version` เพื่อตรวจสอบ อัปเกรดด้วย `openclaw update`
</Note>

<Steps>
  <Step title="รันตัวช่วยตั้งค่า channel">
  ```bash
  openclaw channels login --channel feishu
  ```
  เลือกการตั้งค่าแบบแมนนวลเพื่อวาง App ID และ App Secret จาก Feishu Open Platform หรือเลือกการตั้งค่าด้วย QR เพื่อสร้างบอตโดยอัตโนมัติ หากแอปมือถือ Feishu ภายในประเทศไม่ตอบสนองต่อรหัส QR ให้รันการตั้งค่าอีกครั้งและเลือกการตั้งค่าแบบแมนนวล
  </Step>
  
  <Step title="หลังตั้งค่าเสร็จแล้ว ให้รีสตาร์ท gateway เพื่อใช้การเปลี่ยนแปลง">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## การควบคุมการเข้าถึง

### ข้อความส่วนตัว

กำหนดค่า `dmPolicy` เพื่อควบคุมว่าใครสามารถ DM บอตได้:

- `"pairing"` - ผู้ใช้ที่ไม่รู้จักจะได้รับรหัสจับคู่; อนุมัติผ่าน CLI
- `"allowlist"` - เฉพาะผู้ใช้ที่อยู่ใน `allowFrom` เท่านั้นที่แชตได้
- `"open"` - อนุญาต DM สาธารณะเฉพาะเมื่อ `allowFrom` มี `"*"`; หากมีรายการแบบจำกัด เฉพาะผู้ใช้ที่ตรงกันเท่านั้นที่แชตได้
- `"disabled"` - ปิดใช้งาน DM ทั้งหมด

**อนุมัติคำขอจับคู่:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### แชตกลุ่ม

**นโยบายกลุ่ม** (`channels.feishu.groupPolicy`):

| ค่า         | พฤติกรรม                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | ตอบกลับทุกข้อความในกลุ่ม                                                            |
| `"allowlist"` | ตอบกลับเฉพาะกลุ่มใน `groupAllowFrom` หรือที่กำหนดค่าไว้อย่างชัดเจนภายใต้ `groups.<chat_id>` |
| `"disabled"`  | ปิดใช้งานข้อความกลุ่มทั้งหมด; รายการ `groups.<chat_id>` ที่ระบุชัดเจนจะไม่แทนที่ค่านี้         |

ค่าเริ่มต้น: `allowlist`

**ข้อกำหนดการ mention** (`channels.feishu.requireMention`):

- `true` - ต้องมี @mention (ค่าเริ่มต้น)
- `false` - ตอบกลับโดยไม่ต้องมี @mention
- override ต่อกลุ่ม: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` และ `@_all` แบบประกาศถึงทุกคนเท่านั้นจะไม่ถือว่าเป็นการ mention บอต ข้อความที่ mention ทั้ง `@all` และบอตโดยตรงยังคงนับว่าเป็นการ mention บอต

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

ในโหมด `allowlist` คุณยังสามารถอนุญาตกลุ่มได้โดยเพิ่มรายการ `groups.<chat_id>` อย่างชัดเจน รายการที่ระบุชัดเจนจะไม่แทนที่ `groupPolicy: "disabled"` ค่าเริ่มต้นแบบไวลด์การ์ดภายใต้ `groups.*` ใช้กำหนดค่ากลุ่มที่ตรงกัน แต่ไม่ได้อนุญาตกลุ่มด้วยตัวเอง

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

### ID กลุ่ม (`chat_id`, รูปแบบ: `oc_xxx`)

เปิดกลุ่มใน Feishu/Lark คลิกไอคอนเมนูที่มุมขวาบน แล้วไปที่ **Settings** ID กลุ่ม (`chat_id`) จะแสดงอยู่ในหน้าการตั้งค่า

![รับ ID กลุ่ม](/images/feishu-get-group-id.png)

### ID ผู้ใช้ (`open_id`, รูปแบบ: `ou_xxx`)

เริ่ม Gateway ส่ง DM ไปยังบอต แล้วตรวจสอบล็อก:

```bash
openclaw logs --follow
```

ค้นหา `open_id` ในเอาต์พุตล็อก คุณยังสามารถตรวจสอบคำขอจับคู่ที่รอดำเนินการได้:

```bash
openclaw pairing list feishu
```

---

## คำสั่งทั่วไป

| คำสั่ง   | คำอธิบาย                 |
| --------- | --------------------------- |
| `/status` | แสดงสถานะบอต             |
| `/reset`  | รีเซ็ตเซสชันปัจจุบัน   |
| `/model`  | แสดงหรือสลับโมเดล AI |

<Note>
Feishu/Lark ไม่รองรับเมนูคำสั่ง slash-command แบบเนทีฟ ดังนั้นให้ส่งคำสั่งเหล่านี้เป็นข้อความธรรมดา
</Note>

---

## การแก้ไขปัญหา

### บอตไม่ตอบกลับในแชตกลุ่ม

1. ตรวจสอบว่าบอตถูกเพิ่มลงในกลุ่มแล้ว
2. ตรวจสอบว่าคุณ @mention บอต (จำเป็นตามค่าเริ่มต้น)
3. ตรวจสอบว่า `groupPolicy` ไม่ใช่ `"disabled"`
4. ตรวจสอบล็อก: `openclaw logs --follow`

### บอตไม่ได้รับข้อความ

1. ตรวจสอบว่าบอตถูกเผยแพร่และอนุมัติใน Feishu Open Platform / Lark Developer แล้ว
2. ตรวจสอบว่าการสมัครรับเหตุการณ์มี `im.message.receive_v1`
3. ตรวจสอบว่าเลือก **persistent connection** (WebSocket) แล้ว
4. ตรวจสอบว่าได้รับ permission scope ที่จำเป็นทั้งหมดแล้ว
5. ตรวจสอบว่า gateway กำลังทำงาน: `openclaw gateway status`
6. ตรวจสอบล็อก: `openclaw logs --follow`

### การตั้งค่าด้วย QR ไม่ตอบสนองในแอปมือถือ Feishu

1. รันการตั้งค่าอีกครั้ง: `openclaw channels login --channel feishu`
2. เลือกการตั้งค่าแบบแมนนวล
3. ใน Feishu Open Platform ให้สร้างแอปแบบ self-built แล้วคัดลอก App ID และ App Secret
4. วางข้อมูลประจำตัวเหล่านั้นลงในตัวช่วยตั้งค่า

### App Secret รั่วไหล

1. รีเซ็ต App Secret ใน Feishu Open Platform / Lark Developer
2. อัปเดตค่าใน config ของคุณ
3. รีสตาร์ท gateway: `openclaw gateway restart`

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
`accounts.<id>.tts` ใช้รูปแบบเดียวกับ `messages.tts` และทำ deep-merge ทับ
config TTS ส่วนกลาง ดังนั้นการตั้งค่า Feishu แบบหลายบอตจึงสามารถเก็บข้อมูลประจำตัวของ provider
ที่ใช้ร่วมกันไว้ในระดับส่วนกลาง ขณะ override เฉพาะเสียง โมเดล persona หรือโหมดอัตโนมัติ
ต่อบัญชีได้

### ขีดจำกัดข้อความ

- `textChunkLimit` - ขนาดชิ้นข้อความขาออก (ค่าเริ่มต้น: `2000` ตัวอักษร)
- `mediaMaxMb` - ขีดจำกัดการอัปโหลด/ดาวน์โหลดสื่อ (ค่าเริ่มต้น: `30` MB)

### การสตรีม

Feishu/Lark รองรับการสตรีมคำตอบผ่านการ์ดแบบอินเทอร์แอคทีฟ เมื่อเปิดใช้งาน บอตจะอัปเดตการ์ดแบบเรียลไทม์ขณะสร้างข้อความ

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

ตั้งค่า `streaming: false` เพื่อส่งคำตอบครบถ้วนในข้อความเดียว `blockStreaming` ปิดอยู่ตามค่าเริ่มต้น; เปิดใช้งานเฉพาะเมื่อต้องการ flush บล็อกของผู้ช่วยที่เสร็จแล้วก่อนคำตอบสุดท้าย

### การปรับโควตาให้เหมาะสม

ลดจำนวนการเรียก API ของ Feishu/Lark ด้วยแฟล็กตัวเลือกสองรายการ:

- `typingIndicator` (ค่าเริ่มต้น `true`): ตั้งค่า `false` เพื่อข้ามการเรียก reaction ระหว่างพิมพ์
- `resolveSenderNames` (ค่าเริ่มต้น `true`): ตั้งค่า `false` เพื่อข้ามการค้นหาโปรไฟล์ผู้ส่ง

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

Feishu/Lark รองรับ ACP สำหรับ DM และข้อความเธรดกลุ่ม ACP ของ Feishu/Lark ขับเคลื่อนด้วยคำสั่งข้อความ - ไม่มีเมนูคำสั่ง slash-command แบบเนทีฟ ดังนั้นให้ใช้ข้อความ `/acp ...` โดยตรงในบทสนทนา

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

#### Spawn ACP จากแชต

ใน DM หรือเธรดของ Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` ใช้ได้กับ DM และข้อความเธรดของ Feishu/Lark ข้อความติดตามผลในบทสนทนาที่ผูกไว้จะถูก route ไปยังเซสชัน ACP นั้นโดยตรง

### การ route แบบหลายเอเจนต์

ใช้ `bindings` เพื่อ route DM หรือกลุ่มของ Feishu/Lark ไปยังเอเจนต์ต่าง ๆ

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

ฟิลด์การ route:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) หรือ `"group"` (แชตกลุ่ม)
- `match.peer.id`: Open ID ของผู้ใช้ (`ou_xxx`) หรือ ID กลุ่ม (`oc_xxx`)

ดู [รับ ID ของกลุ่ม/ผู้ใช้](#get-groupuser-ids) สำหรับเคล็ดลับการค้นหา

---

## การแยกเอเจนต์ต่อผู้ใช้ (การสร้างเอเจนต์แบบไดนามิก)

เปิดใช้งาน `dynamicAgentCreation` เพื่อสร้าง **อินสแตนซ์เอเจนต์ที่แยกจากกัน** โดยอัตโนมัติสำหรับผู้ใช้ DM แต่ละคน ผู้ใช้แต่ละคนจะมี:

- ไดเรกทอรี workspace อิสระ
- `USER.md` / `SOUL.md` / `MEMORY.md` แยกต่างหาก
- ประวัติการสนทนาส่วนตัว
- Skills และ state ที่แยกกัน

สิ่งนี้จำเป็นสำหรับบอตสาธารณะที่คุณต้องการให้ผู้ใช้แต่ละคนมีประสบการณ์ผู้ช่วย AI ส่วนตัวของตนเอง

<Note>
การผูกแบบไดนามิกจะรวม `accountId` ของ Feishu ที่ normalize แล้ว ดังนั้นบัญชีเริ่มต้นและบัญชีที่มีชื่อจะ route ผู้ส่งแต่ละคนไปยังเอเจนต์แบบไดนามิกที่ถูกต้อง

หากบัญชีที่มีชื่อสร้างเอเจนต์แบบไดนามิกที่ไม่มี scope ในรีลีสเก่า เอเจนต์ legacy นั้นยังคงนับรวมใน `maxAgents` ยืนยันว่าไม่ได้ถูกใช้โดยบัญชีเริ่มต้นก่อนลบออก หรือเพิ่ม `maxAgents` ชั่วคราว; OpenClaw ไม่สามารถอนุมานได้อย่างปลอดภัยว่าบัญชีใดเป็นเจ้าของ state legacy ที่กำกวม
</Note>

### การตั้งค่าอย่างรวดเร็ว

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Critical: makes each user's DM their "main session"
    // Automatically loads USER.md / SOUL.md / MEMORY.md
    // For stronger isolation, use "per-channel-peer" instead
    dmScope: "main",
  },
}
```

### วิธีการทำงาน

เมื่อผู้ใช้ใหม่ส่ง DM ครั้งแรก:

1. channel จะสร้าง `agentId` เฉพาะ: `feishu-{user_open_id}` สำหรับบัญชีเริ่มต้น หรือ identity digest แบบมีขอบเขตพร้อมคำนำหน้าบัญชีสำหรับบัญชีที่มีชื่อ
2. สร้าง workspace ใหม่ที่พาธ `workspaceTemplate`
3. ลงทะเบียนเอเจนต์และสร้างการผูกสำหรับผู้ใช้นี้
4. ตัวช่วย workspace จะทำให้แน่ใจว่ามีไฟล์ bootstrap (`AGENTS.md`, `SOUL.md`, `USER.md` ฯลฯ) เมื่อเข้าถึงครั้งแรก
5. route ข้อความในอนาคตทั้งหมดจากผู้ใช้นี้ไปยังเอเจนต์เฉพาะของผู้ใช้นั้น

### ตัวเลือกการกำหนดค่า

| การตั้งค่า                                                | คำอธิบาย                                  | ค่าเริ่มต้น                          |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | เปิดใช้การสร้าง agent รายผู้ใช้โดยอัตโนมัติ | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | เทมเพลตพาธสำหรับ workspace ของ agent แบบไดนามิก | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | เทมเพลตชื่อไดเรกทอรีของ agent              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | จำนวน agent แบบไดนามิกสูงสุดที่จะสร้าง       | ไม่จำกัด                             |

ตัวแปรเทมเพลต:

- `{agentId}` - ID ของ agent ที่สร้างขึ้น (เช่น `feishu-ou_xxxxxx` หรือ `feishu-support-<identity_digest>`)
- `{userId}` - Feishu open_id ของผู้ส่ง (เช่น `ou_xxxxxx`)

### ขอบเขตเซสชัน

`session.dmScope` ควบคุมวิธีแมปข้อความโดยตรงกับเซสชันของ agent นี่คือ **การตั้งค่าส่วนกลาง** ที่มีผลกับทุกช่องทาง

| ค่า                          | พฤติกรรม                                                           | เหมาะที่สุดสำหรับ                                                   |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | DM ของผู้ใช้แต่ละคนจะแมปไปยังเซสชันหลักของ agent ของผู้ใช้นั้น       | บอตผู้ใช้คนเดียวที่คุณต้องการให้ `USER.md` / `SOUL.md` โหลดอัตโนมัติ |
| `"per-channel-peer"`         | แต่ละชุดผสม (ช่องทาง + ผู้ใช้) จะได้เซสชันแยกต่างหาก                | บอตสาธารณะแบบหลายผู้ใช้ที่ต้องการการแยกที่เข้มงวดยิ่งขึ้น           |
| `"per-account-channel-peer"` | แต่ละชุดผสม (บัญชี + ช่องทาง + ผู้ใช้) จะได้เซสชันแยกต่างหาก        | บอตหลายบัญชีที่ต้องการการแยกเซสชันระดับบัญชี                       |

**ข้อแลกเปลี่ยน**: การใช้ `"main"` เปิดใช้การโหลดไฟล์ bootstrap อัตโนมัติ (`USER.md`, `SOUL.md`, `MEMORY.md`) แต่หมายความว่า DM ทั้งหมดในทุกช่องทางใช้รูปแบบคีย์เซสชันเดียวกัน สำหรับบอตสาธารณะแบบหลายผู้ใช้ที่การแยกสำคัญกว่าการโหลด bootstrap อัตโนมัติ ให้พิจารณา `"per-channel-peer"` และจัดการไฟล์ bootstrap ด้วยตนเอง

<Note>
ใช้ `"per-account-channel-peer"` เมื่อบัญชี Feishu ที่มีชื่อควรแยกเซสชันสำหรับผู้ส่งคนเดียวกัน การผูกแบบไดนามิกจะรักษาขอบเขตบัญชีไว้
</Note>

```json5
{
  session: {
    // For single-user personal bots: enables auto bootstrap loading
    dmScope: "main",

    // For public multi-user bots: stronger isolation
    // dmScope: "per-channel-peer",
  },
}
```

### การปรับใช้แบบหลายผู้ใช้ทั่วไป

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Choose dmScope based on your isolation needs:
    // "main" for bootstrap auto-loading, "per-channel-peer" for stronger isolation
    dmScope: "main",
  },
  bindings: [], // Empty - dynamic agents auto-bind
}
```

### การตรวจสอบ

ตรวจสอบบันทึกของ Gateway เพื่อยืนยันว่าการสร้างแบบไดนามิกทำงานอยู่:

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

แสดงรายการ workspace ทั้งหมดที่สร้างแล้ว:

```bash
ls -la ~/.openclaw/workspace-*
```

### หมายเหตุ

- **การแยก Workspace**: ผู้ใช้แต่ละคนจะได้ไดเรกทอรี workspace และอินสแตนซ์ agent ของตนเอง ผู้ใช้ไม่สามารถดูประวัติการสนทนาหรือไฟล์ของกันและกันภายในโฟลว์การรับส่งข้อความปกติได้
- **ขอบเขตความปลอดภัย**: นี่เป็นกลไกการแยกตามบริบทการรับส่งข้อความ ไม่ใช่ขอบเขตความปลอดภัยสำหรับผู้เช่าร่วมที่เป็นภัย กระบวนการ agent และสภาพแวดล้อมโฮสต์ยังใช้ร่วมกัน
- **`bindings` ควรว่างเปล่า**: agent แบบไดนามิกจะลงทะเบียนการผูกของตนเองโดยอัตโนมัติ
- **เส้นทางอัปเกรด**: การผูกแบบแมนนวลที่มีอยู่ยังทำงานควบคู่กับ agent แบบไดนามิกต่อไป
- **`session.dmScope` เป็นการตั้งค่าส่วนกลาง**: สิ่งนี้มีผลกับทุกช่องทาง ไม่ใช่แค่ Feishu

---

## อ้างอิงการกำหนดค่า

การกำหนดค่าแบบเต็ม: [การกำหนดค่า Gateway](/th/gateway/configuration)

| การตั้งค่า                                                | คำอธิบาย                                                                        | ค่าเริ่มต้น                          |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| `channels.feishu.enabled`                                | เปิด/ปิดใช้งานช่องทาง                                                           | `true`                               |
| `channels.feishu.domain`                                 | โดเมน API (`feishu` หรือ `lark`)                                                 | `feishu`                             |
| `channels.feishu.connectionMode`                         | การขนส่งเหตุการณ์ (`websocket` หรือ `webhook`)                                  | `websocket`                          |
| `channels.feishu.defaultAccount`                         | บัญชีเริ่มต้นสำหรับการกำหนดเส้นทางขาออก                                        | `default`                            |
| `channels.feishu.verificationToken`                      | จำเป็นสำหรับโหมด webhook                                                        | -                                    |
| `channels.feishu.encryptKey`                             | จำเป็นสำหรับโหมด webhook                                                        | -                                    |
| `channels.feishu.webhookPath`                            | พาธเส้นทาง Webhook                                                              | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | โฮสต์ bind ของ Webhook                                                          | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | พอร์ต bind ของ Webhook                                                          | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | App ID                                                                           | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | App Secret                                                                       | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | การแทนที่โดเมนรายบัญชี                                                          | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | การแทนที่ TTS รายบัญชี                                                          | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | นโยบาย DM                                                                        | `pairing`                            |
| `channels.feishu.allowFrom`                              | allowlist สำหรับ DM (รายการ open_id)                                             | -                                    |
| `channels.feishu.groupPolicy`                            | นโยบายกลุ่ม                                                                     | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | allowlist สำหรับกลุ่ม                                                           | -                                    |
| `channels.feishu.requireMention`                         | ต้องมี @mention ในกลุ่ม                                                         | `true`                               |
| `channels.feishu.groups.<chat_id>.requireMention`        | การแทนที่ @mention รายกลุ่ม; ID ที่ระบุชัดเจนยังอนุญาตกลุ่มในโหมด allowlist ด้วย | สืบทอดมา                             |
| `channels.feishu.groups.<chat_id>.enabled`               | เปิด/ปิดใช้งานกลุ่มที่ระบุ                                                      | `true`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | เปิดใช้การสร้าง agent รายผู้ใช้โดยอัตโนมัติ                                     | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | เทมเพลตพาธสำหรับ workspace ของ agent แบบไดนามิก                                 | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | เทมเพลตชื่อไดเรกทอรีของ agent                                                   | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | จำนวน agent แบบไดนามิกสูงสุดที่จะสร้าง                                           | ไม่จำกัด                             |
| `channels.feishu.textChunkLimit`                         | ขนาด chunk ของข้อความ                                                           | `2000`                               |
| `channels.feishu.mediaMaxMb`                             | ขีดจำกัดขนาดสื่อ                                                                | `30`                                 |
| `channels.feishu.streaming`                              | เอาต์พุตการ์ดแบบสตรีมมิง                                                        | `true`                               |
| `channels.feishu.blockStreaming`                         | การสตรีมคำตอบแบบบล็อกที่เสร็จสมบูรณ์แล้ว                                       | `false`                              |
| `channels.feishu.typingIndicator`                        | ส่งปฏิกิริยาการพิมพ์                                                            | `true`                               |
| `channels.feishu.resolveSenderNames`                     | แปลงชื่อที่แสดงของผู้ส่ง                                                        | `true`                               |
| `channels.feishu.tools.bitable`                          | เปิดใช้เครื่องมือ Bitable/Base                                                  | `true`                               |
| `channels.feishu.tools.base`                             | นามแฝงสำหรับ `channels.feishu.tools.bitable`; `bitable` ที่ระบุชัดเจนจะมีผลเมื่อทั้งสองถูกตั้งค่า | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | เกตเครื่องมือ Bitable/Base รายบัญชี                                             | สืบทอดมา                             |
| `channels.feishu.accounts.<id>.tools.base`               | นามแฝงรายบัญชีสำหรับ `tools.bitable`                                            | สืบทอดมา                             |

---

## ประเภทข้อความที่รองรับ

### รับ

- ✅ ข้อความ
- ✅ ข้อความแบบ rich text (post)
- ✅ รูปภาพ
- ✅ ไฟล์
- ✅ เสียง
- ✅ วิดีโอ/สื่อ
- ✅ สติกเกอร์

ข้อความเสียงขาเข้าจาก Feishu/Lark จะถูกทำให้เป็นมาตรฐานเป็นตัวยึดตำแหน่งสื่อแทน
JSON `file_key` ดิบ เมื่อกำหนดค่า `tools.media.audio` แล้ว OpenClaw
จะดาวน์โหลดทรัพยากร voice-note และเรียกใช้การถอดเสียงร่วมก่อน
รอบของ agent เพื่อให้ agent ได้รับข้อความถอดเสียงพูด หาก Feishu รวม
ข้อความถอดเสียงไว้โดยตรงในเพย์โหลดเสียง ข้อความนั้นจะถูกใช้โดยไม่เรียก
ASR อีกครั้ง หากไม่มีผู้ให้บริการถอดเสียง audio agent จะยังได้รับ
ตัวยึดตำแหน่ง `<media:audio>` พร้อมไฟล์แนบที่บันทึกไว้ ไม่ใช่เพย์โหลด
ทรัพยากร Feishu ดิบ

### ส่ง

- ✅ ข้อความ
- ✅ รูปภาพ
- ✅ ไฟล์
- ✅ เสียง
- ✅ วิดีโอ/สื่อ
- ✅ การ์ดแบบโต้ตอบ (รวมถึงการอัปเดตแบบสตรีมมิง)
- ⚠️ ข้อความแบบมีรูปแบบ (การจัดรูปแบบแบบโพสต์; ไม่รองรับความสามารถในการเขียนแบบเต็มของ Feishu/Lark)

บับเบิลเสียงเนทีฟของ Feishu/Lark ใช้ชนิดข้อความ `audio` ของ Feishu และต้องมี
สื่ออัปโหลด Ogg/Opus (`file_type: "opus"`) สื่อ `.opus` และ `.ogg` ที่มีอยู่
จะถูกส่งโดยตรงเป็นเสียงเนทีฟ MP3/WAV/M4A และรูปแบบอื่นที่น่าจะเป็นเสียง
จะถูกแปลงเป็น Ogg/Opus 48kHz ด้วย `ffmpeg` เฉพาะเมื่อคำตอบร้องขอการส่งแบบเสียงพูด
(`audioAsVoice` / เครื่องมือข้อความ `asVoice` รวมถึงคำตอบโน้ตเสียง TTS)
ไฟล์แนบ MP3 ปกติจะยังคงเป็นไฟล์ทั่วไป หากไม่มี `ffmpeg` หรือ
การแปลงล้มเหลว OpenClaw จะถอยกลับไปใช้ไฟล์แนบและบันทึกเหตุผลในล็อก

### เธรดและการตอบกลับ

- ✅ การตอบกลับในบรรทัด
- ✅ การตอบกลับในเธรด
- ✅ การตอบกลับสื่อยังคงรับรู้เธรดเมื่อตอบกลับข้อความในเธรด

สำหรับ `groupSessionScope: "group_topic"` และ `"group_topic_sender"` กลุ่มหัวข้อ
เนทีฟของ Feishu/Lark จะใช้ `thread_id` (`omt_*`) ของอีเวนต์เป็นคีย์เซสชันหัวข้อ
ตามมาตรฐาน หากอีเวนต์เริ่มต้นหัวข้อเนทีฟละ `thread_id` ไว้ OpenClaw
จะเติมข้อมูลจาก Feishu ก่อนกำหนดเส้นทางเทิร์น การตอบกลับกลุ่มปกติที่
OpenClaw แปลงเป็นเธรดจะยังคงใช้ ID ข้อความรากของการตอบกลับ (`om_*`) เพื่อให้
เทิร์นแรกและเทิร์นติดตามอยู่ในเซสชันเดียวกัน

---

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) - ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชตกลุ่มและการ gating การกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
