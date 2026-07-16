---
read_when:
    - คุณต้องการเชื่อมต่อบอต Feishu/Lark
    - คุณกำลังกำหนดค่าช่องทาง Feishu
summary: ภาพรวม ฟีเจอร์ และการกำหนดค่าบอต Feishu
title: Feishu
x-i18n:
    generated_at: "2026-07-16T18:36:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 007f3db63fe70b9e7f0267043e47555af7dd55e73c8fd78156b1c9190360b858
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw เชื่อมต่อกับ Feishu/Lark (แพลตฟอร์มการทำงานร่วมกันแบบครบวงจร) ผ่าน Plugin อย่างเป็นทางการ `@openclaw/feishu`: ข้อความส่วนตัวกับบอต แชตกลุ่ม การตอบกลับด้วยการ์ดแบบสตรีม และเครื่องมือเอกสาร/วิกิ/ไดรฟ์/Bitable ของ Feishu

**สถานะ:** พร้อมใช้งานจริงสำหรับข้อความส่วนตัวกับบอตและแชตกลุ่ม WebSocket เป็นช่องทางรับส่งเหตุการณ์เริ่มต้น (ไม่ต้องใช้ URL สาธารณะ) และเลือกใช้โหมด Webhook ได้

## เริ่มต้นอย่างรวดเร็ว

<Note>
ต้องใช้ OpenClaw 2026.5.29 ขึ้นไป เรียกใช้ `openclaw --version` เพื่อตรวจสอบ อัปเกรดด้วย `openclaw update`
</Note>

<Steps>
  <Step title="เรียกใช้ตัวช่วยตั้งค่าช่องทาง">
  ```bash
  openclaw channels login --channel feishu
  ```
  คำสั่งนี้จะติดตั้ง Plugin `@openclaw/feishu` หากยังไม่มี จากนั้นจะแนะนำขั้นตอนการตั้งค่า:

- **ตั้งค่าด้วยตนเอง**: วาง App ID และ App Secret จาก Feishu Open Platform (`https://open.feishu.cn`) หรือ Lark Developer (`https://open.larksuite.com`)
- **ตั้งค่าด้วย QR**: สแกนคิวอาร์โค้ดในแอป Feishu เพื่อสร้างบอตโดยอัตโนมัติ ขั้นตอนนี้จำกัดข้อความส่วนตัวไว้เฉพาะบัญชีของคุณเอง (`dmPolicy: "allowlist"` ด้วย `open_id` ของคุณ)

ตัวช่วยจะถามโดเมน API (Feishu หรือ Lark) และนโยบายกลุ่มด้วย หากแอป Feishu สำหรับอุปกรณ์เคลื่อนที่ในประเทศไม่ตอบสนองต่อคิวอาร์โค้ด ให้เรียกใช้การตั้งค่าอีกครั้งแล้วเลือกการตั้งค่าด้วยตนเอง
</Step>

  <Step title="หลังตั้งค่าเสร็จ ให้รีสตาร์ต Gateway เพื่อใช้การเปลี่ยนแปลง">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## การควบคุมการเข้าถึง

### ข้อความส่วนตัว

กำหนดค่า `channels.feishu.dmPolicy` (ค่าเริ่มต้น: `pairing`) เพื่อควบคุมว่าใครส่งข้อความส่วนตัวถึงบอตได้:

| ค่า         | ลักษณะการทำงาน                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | ผู้ใช้ที่ไม่รู้จักจะได้รับรหัสจับคู่ และอนุมัติผ่าน CLI                                                         |
| `"allowlist"` | เฉพาะผู้ใช้ที่ระบุใน `allowFrom` เท่านั้นที่แชตได้                                                                     |
| `"open"`      | เปิดรับข้อความส่วนตัวสาธารณะ การตรวจสอบความถูกต้องของการกำหนดค่ากำหนดให้ `allowFrom` ต้องมี `"*"` ส่วนรายการที่ไม่ใช่ไวลด์การ์ดยังคงจำกัดการเข้าถึงให้แคบลง |

**อนุมัติคำขอจับคู่:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### แชตกลุ่ม

**นโยบายกลุ่ม** (`channels.feishu.groupPolicy`, ค่าเริ่มต้น: `allowlist`):

| ค่า         | ลักษณะการทำงาน                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | ตอบกลับข้อความทั้งหมดในกลุ่ม                                                            |
| `"allowlist"` | ตอบกลับเฉพาะกลุ่มใน `groupAllowFrom` หรือกลุ่มที่กำหนดไว้อย่างชัดเจนภายใต้ `groups.<chat_id>` |
| `"disabled"`  | ปิดใช้งานข้อความกลุ่มทั้งหมด รายการ `groups.<chat_id>` ที่กำหนดไว้อย่างชัดเจนไม่สามารถลบล้างค่านี้ได้         |

**ข้อกำหนดการกล่าวถึง** (`channels.feishu.requireMention`):

- ค่าเริ่มต้น: ต้อง @กล่าวถึง ยกเว้นเมื่อนโยบายกลุ่มที่มีผลคือ `"open"` ซึ่งในกรณีนั้นค่าเริ่มต้นจะเป็น `false` เพื่อให้ข้อความที่ไม่สามารถมีการกล่าวถึงได้ (เช่น รูปภาพ) ยังคงส่งถึงเอเจนต์
- กำหนด `true` หรือ `false` อย่างชัดเจนเพื่อลบล้างค่า โดยลบล้างรายกลุ่มได้ด้วย `channels.feishu.groups.<chat_id>.requireMention`
- `@all` และ `@_all` ที่ใช้สำหรับการประกาศเท่านั้นจะไม่ถือเป็นการกล่าวถึงบอต ข้อความที่กล่าวถึงทั้ง `@all` และบอตโดยตรงยังคงนับเป็นการกล่าวถึงบอต

## ตัวอย่างการกำหนดค่ากลุ่ม

### อนุญาตทุกกลุ่มโดยไม่ต้อง @กล่าวถึง

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // requireMention defaults to false under "open"
    },
  },
}
```

### อนุญาตทุกกลุ่มแต่ยังคงต้อง @กล่าวถึง

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
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

ในโหมด `allowlist` คุณยังสามารถอนุญาตกลุ่มโดยเพิ่มรายการ `groups.<chat_id>` อย่างชัดเจน รายการที่กำหนดไว้อย่างชัดเจนไม่สามารถลบล้าง `groupPolicy: "disabled"` ได้ ค่าเริ่มต้นแบบไวลด์การ์ดภายใต้ `groups.*` ใช้กำหนดค่ากลุ่มที่ตรงกัน แต่ไม่อนุญาตกลุ่มเหล่านั้นด้วยตัวเอง

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

`channels.feishu.groupSenderAllowFrom` กำหนดรายการอนุญาตผู้ส่งชุดเดียวกันสำหรับทุกกลุ่ม ส่วน `allowFrom` รายกลุ่มมีลำดับความสำคัญสูงกว่า

<a id="get-groupuser-ids"></a>

## รับ ID กลุ่ม/ผู้ใช้

### ID กลุ่ม (`chat_id`, รูปแบบ: `oc_xxx`)

เปิดกลุ่มใน Feishu/Lark คลิกไอคอนเมนูที่มุมขวาบน แล้วไปที่ **Settings** ID กลุ่ม (`chat_id`) จะแสดงอยู่ในหน้าการตั้งค่า

![รับ ID กลุ่ม](/images/feishu-get-group-id.png)

### ID ผู้ใช้ (`open_id`, รูปแบบ: `ou_xxx`)

เริ่ม Gateway ส่งข้อความส่วนตัวถึงบอต แล้วตรวจสอบบันทึก:

```bash
openclaw logs --follow
```

ค้นหา `open_id` ในผลลัพธ์บันทึก หรือจะตรวจสอบคำขอจับคู่ที่รอดำเนินการก็ได้:

```bash
openclaw pairing list feishu
```

## คำสั่งทั่วไป

| คำสั่ง   | คำอธิบาย                 |
| --------- | --------------------------- |
| `/status` | แสดงสถานะบอต             |
| `/reset`  | รีเซ็ตเซสชันปัจจุบัน   |
| `/model`  | แสดงหรือสลับโมเดล AI |

<Note>
Feishu/Lark ไม่รองรับเมนูคำสั่งแบบทับที่เป็นฟังก์ชันในตัว ดังนั้นให้ส่งคำสั่งเหล่านี้เป็นข้อความธรรมดา
</Note>

## การแก้ไขปัญหา

### บอตไม่ตอบกลับในแชตกลุ่ม

1. ตรวจสอบว่าเพิ่มบอตลงในกลุ่มแล้ว
2. ตรวจสอบว่าได้ @กล่าวถึงบอต (จำเป็นโดยค่าเริ่มต้น)
3. ตรวจสอบว่า `groupPolicy` ไม่ใช่ `"disabled"`
4. ตรวจสอบบันทึก: `openclaw logs --follow`

### บอตไม่ได้รับข้อความ

1. ตรวจสอบว่าบอตได้รับการเผยแพร่และอนุมัติใน Feishu Open Platform / Lark Developer แล้ว
2. ตรวจสอบว่าการสมัครรับเหตุการณ์มี `im.message.receive_v1`
3. ตรวจสอบว่าเลือก **persistent connection** (WebSocket) แล้ว
4. ตรวจสอบว่าให้ขอบเขตสิทธิ์ที่จำเป็นทั้งหมดแล้ว
5. ตรวจสอบว่า Gateway กำลังทำงาน: `openclaw gateway status`
6. ตรวจสอบบันทึก: `openclaw logs --follow`

### การตั้งค่าด้วย QR ไม่ตอบสนองในแอป Feishu สำหรับอุปกรณ์เคลื่อนที่

1. เรียกใช้การตั้งค่าอีกครั้ง: `openclaw channels login --channel feishu`
2. เลือกการตั้งค่าด้วยตนเอง
3. ใน Feishu Open Platform ให้สร้างแอปที่พัฒนาขึ้นเอง แล้วคัดลอก App ID และ App Secret
4. วางข้อมูลประจำตัวเหล่านั้นลงในตัวช่วยตั้งค่า

### App Secret รั่วไหล

1. รีเซ็ต App Secret ใน Feishu Open Platform / Lark Developer
2. อัปเดตค่าในการกำหนดค่าของคุณ
3. รีสตาร์ต Gateway: `openclaw gateway restart`

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

`defaultAccount` ควบคุมว่าจะใช้บัญชีใดเมื่อ API ขาออกไม่ได้ระบุ `accountId` รายการบัญชีจะสืบทอดการตั้งค่าระดับบนสุด และคีย์ระดับบนสุดส่วนใหญ่สามารถลบล้างเป็นรายบัญชีได้
`accounts.<id>.tts` ใช้โครงสร้างเดียวกับ `messages.tts` และผสานแบบลึกทับการกำหนดค่า TTS ส่วนกลาง ดังนั้นการตั้งค่า Feishu แบบหลายบอตจึงเก็บข้อมูลประจำตัวของผู้ให้บริการที่ใช้ร่วมกันไว้ส่วนกลางได้ พร้อมลบล้างเฉพาะเสียง โมเดล บุคลิก หรือโหมดอัตโนมัติเป็นรายบัญชี

### ขีดจำกัดข้อความ

- `textChunkLimit` - ขนาดส่วนข้อความขาออก (ค่าเริ่มต้น: `4000` อักขระ)
- `streaming.chunkMode` - `"length"` (ค่าเริ่มต้น) แบ่งเมื่อถึงขีดจำกัด ส่วน `"newline"` ให้ความสำคัญกับขอบเขตขึ้นบรรทัดใหม่
- `mediaMaxMb` - ขีดจำกัดการอัปโหลด/ดาวน์โหลดสื่อ (ค่าเริ่มต้น: `30` MB)

### การสตรีม

Feishu/Lark รองรับการตอบกลับแบบสตรีมผ่านการ์ดแบบโต้ตอบ (Card Kit streaming API) เมื่อเปิดใช้ บอตจะอัปเดตการ์ดแบบเรียลไทม์ขณะสร้างข้อความ

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // streaming card output (default: "partial")
        block: { enabled: true }, // opt into completed-block streaming
      },
    },
  },
}
```

กำหนด `streaming.mode: "off"` เพื่อส่งคำตอบทั้งหมดในข้อความเดียว ส่วน `renderMode: "raw"` (ข้อความธรรมดาแทนการ์ด) จะปิดใช้งานการ์ดแบบสตรีมด้วย `streaming.block.enabled` ปิดอยู่โดยค่าเริ่มต้น ให้เปิดใช้เฉพาะเมื่อต้องการส่งบล็อกของผู้ช่วยที่เสร็จสมบูรณ์ออกไปก่อนคำตอบสุดท้าย ค่าบูลีนแบบเดิม `streaming` และคีย์แบบแบน `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` จะย้ายไปยังโครงสร้างแบบซ้อนนี้ผ่าน `openclaw doctor --fix`

### การเพิ่มประสิทธิภาพโควตา

ลดจำนวนการเรียก API ของ Feishu/Lark ด้วยแฟล็กเสริมสองรายการ:

- `typingIndicator` (ค่าเริ่มต้น `true`): กำหนดเป็น `false` เพื่อข้ามการเรียกปฏิกิริยาแสดงสถานะกำลังพิมพ์
- `resolveSenderNames` (ค่าเริ่มต้น `true`): กำหนดเป็น `false` เพื่อข้ามการค้นหาโปรไฟล์ผู้ส่ง

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

### ขอบเขตเซสชันกลุ่มและเธรดหัวข้อ

`channels.feishu.groupSessionScope` (ระดับบนสุด รายบัญชี หรือรายกลุ่ม) ควบคุมวิธีจับคู่ข้อความกลุ่มกับเซสชันของเอเจนต์:

| ค่า                  | เซสชัน                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"` (ค่าเริ่มต้น)    | หนึ่งเซสชันต่อแชตกลุ่ม                                       |
| `"group_sender"`       | หนึ่งเซสชันต่อ (กลุ่ม + ผู้ส่ง)                                 |
| `"group_topic"`        | หนึ่งเซสชันต่อเธรดหัวข้อ หากใช้ไม่ได้จะย้อนกลับไปใช้เซสชันกลุ่ม    |
| `"group_topic_sender"` | หนึ่งเซสชันต่อ (หัวข้อ + ผู้ส่ง) หากใช้ไม่ได้จะย้อนกลับไปใช้ (กลุ่ม + ผู้ส่ง) |

สำหรับขอบเขตหัวข้อ กลุ่มหัวข้อแบบเนทีฟของ Feishu/Lark ใช้เหตุการณ์ `thread_id` (`omt_*`) เป็นคีย์เซสชันหัวข้อมาตรฐาน หากเหตุการณ์เริ่มต้นหัวข้อแบบเนทีฟไม่มี `thread_id` OpenClaw จะเติมข้อมูลจาก Feishu ก่อนกำหนดเส้นทางเทิร์น การตอบกลับกลุ่มทั่วไปที่ OpenClaw เปลี่ยนเป็นเธรดยังคงใช้ ID ข้อความรากของการตอบกลับ (`om_*`) เพื่อให้เทิร์นแรกและเทิร์นติดตามผลอยู่ในเซสชันเดียวกัน

กำหนด `replyInThread: "enabled"` (ระดับบนสุดหรือรายกลุ่ม) เพื่อให้การตอบกลับของบอตสร้างหรือดำเนินเธรดหัวข้อ Feishu ต่อ แทนการตอบกลับในบรรทัด `topicSessionMode` เป็นค่าก่อนหน้าที่เลิกใช้แล้วของ `groupSessionScope` ควรใช้ `groupSessionScope`

### เครื่องมือพื้นที่ทำงาน Feishu

Plugin มาพร้อมเครื่องมือเอเจนต์สำหรับเอกสาร แชต ฐานความรู้ ที่เก็บข้อมูลบนคลาวด์ สิทธิ์ และ Bitable ของ Feishu รวมถึง Skills ที่สอดคล้องกัน (`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`) กลุ่มเครื่องมือถูกควบคุมด้วย `channels.feishu.tools`:

| คีย์             | เครื่องมือ                                         | ค่าเริ่มต้น             |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | การดำเนินการกับเอกสาร `feishu_doc`              | `true`              |
| `tools.chat`    | ข้อมูลแชต `feishu_chat` + การสอบถามสมาชิก      | `true`              |
| `tools.wiki`    | ฐานความรู้ `feishu_wiki` (ต้องใช้ `doc`) | `true`              |
| `tools.drive`   | พื้นที่จัดเก็บบนคลาวด์ `feishu_drive`                  | `true`              |
| `tools.perm`    | การจัดการสิทธิ์ `feishu_perm`           | `false` (มีความละเอียดอ่อน) |
| `tools.scopes`  | การวินิจฉัยขอบเขตสิทธิ์ของแอป `feishu_app_scopes`     | `true`              |
| `tools.bitable` | การดำเนินการ Bitable/Base `feishu_bitable_*`    | `true`              |

`tools.base` เป็นนามแฝงของ `tools.bitable`; เมื่อกำหนดทั้งสองค่า ค่า `bitable` ที่ระบุไว้อย่างชัดเจนจะมีผลเหนือกว่า เกตสำหรับแต่ละบัญชีอยู่ภายใต้ `accounts.<id>.tools`

ให้สิทธิ์ `drive:drive.metadata:readonly` สำหรับการค้นหา `feishu_drive info` โดยตรงนอกไดเรกทอรีราก
เว้นแต่แอปมีขอบเขตสิทธิ์ `drive:drive` แบบเต็มอยู่แล้ว หากไม่มีขอบเขตสิทธิ์ทั้งสองรายการ `info`
จะยังคงเปิดให้ใช้การค้นหาไดเรกทอรีรากแบบเดิมผ่าน `drive:drive:readonly`

### เซสชัน ACP

Feishu/Lark รองรับ ACP สำหรับ DM และข้อความในเธรดกลุ่ม ACP ของ Feishu/Lark ขับเคลื่อนด้วยคำสั่งข้อความ โดยไม่มีเมนูคำสั่งแบบสแลชในตัว ดังนั้นให้ใช้ข้อความ `/acp ...` โดยตรงในการสนทนา

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

ใน DM หรือเธรดของ Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` ใช้ได้กับ DM และข้อความในเธรด Feishu/Lark ข้อความติดตามผลในการสนทนาที่ผูกไว้จะถูกกำหนดเส้นทางไปยังเซสชัน ACP นั้นโดยตรง

### การกำหนดเส้นทางแบบหลายเอเจนต์

ใช้ `bindings` เพื่อกำหนดเส้นทาง DM หรือกลุ่ม Feishu/Lark ไปยังเอเจนต์ต่าง ๆ

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
- `match.peer.id`: Open ID ของผู้ใช้ (`ou_xxx`) หรือ ID กลุ่ม (`oc_xxx`)

ดูเคล็ดลับการค้นหาที่ [รับ ID กลุ่ม/ผู้ใช้](#get-groupuser-ids)

## การแยกเอเจนต์สำหรับผู้ใช้แต่ละราย (การสร้างเอเจนต์แบบไดนามิก)

เปิดใช้ `dynamicAgentCreation` เพื่อสร้าง **อินสแตนซ์เอเจนต์ที่แยกจากกัน** สำหรับผู้ใช้ DM แต่ละรายโดยอัตโนมัติ ผู้ใช้แต่ละรายจะได้รับ:

- ไดเรกทอรีเวิร์กสเปซอิสระ
- `USER.md` / `SOUL.md` / `MEMORY.md` แยกกัน
- ประวัติการสนทนาส่วนตัว
- Skills และสถานะที่แยกจากกัน

สิ่งนี้จำเป็นสำหรับบอตสาธารณะที่ต้องการให้ผู้ใช้แต่ละรายได้รับประสบการณ์ผู้ช่วย AI ส่วนตัวของตนเอง

<Note>
การผูกแบบไดนามิกจะรวม `accountId` ของ Feishu ที่ปรับให้อยู่ในรูปแบบมาตรฐาน เพื่อให้บัญชีเริ่มต้นและบัญชีที่มีชื่อกำหนดเส้นทางผู้ส่งแต่ละรายไปยังเอเจนต์แบบไดนามิกที่ถูกต้อง

หากบัญชีที่มีชื่อสร้างเอเจนต์แบบไดนามิกที่ไม่มีขอบเขตบัญชีไว้ในรุ่นเก่า เอเจนต์เดิมนั้นจะยังนับรวมใน `maxAgents` ตรวจสอบให้แน่ใจว่าบัญชีเริ่มต้นไม่ได้ใช้งานเอเจนต์ดังกล่าวก่อนลบ หรือเพิ่ม `maxAgents` ชั่วคราว; OpenClaw ไม่สามารถอนุมานได้อย่างปลอดภัยว่าบัญชีใดเป็นเจ้าของสถานะเดิมที่คลุมเครือ
</Note>

### การตั้งค่าด่วน

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
    // สำคัญ: ทำให้ DM ของผู้ใช้แต่ละรายเป็น "เซสชันหลัก"
    // โหลด USER.md / SOUL.md / MEMORY.md โดยอัตโนมัติ
    // หากต้องการการแยกที่เข้มงวดยิ่งขึ้น ให้ใช้ "per-channel-peer" แทน
    dmScope: "main",
  },
}
```

### วิธีการทำงาน

เมื่อผู้ใช้รายใหม่ส่ง DM ครั้งแรก:

1. ช่องทางจะสร้าง `agentId` ที่ไม่ซ้ำกัน: `feishu-{user_open_id}` สำหรับบัญชีเริ่มต้น หรือไดเจสต์ข้อมูลประจำตัวที่มีคำนำหน้าบัญชีและมีขนาดจำกัดสำหรับบัญชีที่มีชื่อ
2. สร้างเวิร์กสเปซใหม่ที่พาธ `workspaceTemplate`
3. ลงทะเบียนเอเจนต์และสร้างการผูกสำหรับผู้ใช้รายนี้
4. ตัวช่วยเวิร์กสเปซจะตรวจสอบให้มีไฟล์บูตสแตรป (`AGENTS.md`, `SOUL.md`, `USER.md` เป็นต้น) เมื่อเข้าถึงครั้งแรก
5. กำหนดเส้นทางข้อความทั้งหมดในอนาคตจากผู้ใช้รายนี้ไปยังเอเจนต์เฉพาะของตน

### ตัวเลือกการกำหนดค่า

| การตั้งค่า                                                  | คำอธิบาย                                | ค่าเริ่มต้น                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | เปิดใช้การสร้างเอเจนต์อัตโนมัติสำหรับผู้ใช้แต่ละราย   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | เทมเพลตพาธสำหรับเวิร์กสเปซของเอเจนต์แบบไดนามิก | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | เทมเพลตชื่อไดเรกทอรีเอเจนต์              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | จำนวนสูงสุดของเอเจนต์แบบไดนามิกที่จะสร้าง | ไม่จำกัด                            |

ตัวแปรเทมเพลต:

- `{agentId}` - ID เอเจนต์ที่สร้างขึ้น (เช่น `feishu-ou_xxxxxx` หรือ `feishu-support-<identity_digest>`)
- `{userId}` - open_id ของผู้ส่งใน Feishu (เช่น `ou_xxxxxx`)

### ขอบเขตเซสชัน

`session.dmScope` ควบคุมวิธีแมปข้อความโดยตรงไปยังเซสชันเอเจนต์ นี่เป็น **การตั้งค่าส่วนกลาง** ที่ส่งผลต่อทุกช่องทาง

| ค่า                        | ลักษณะการทำงาน                                                            | เหมาะสำหรับ                                                           |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | DM ของผู้ใช้แต่ละรายแมปไปยังเซสชันหลักของเอเจนต์ของตน                   | บอตผู้ใช้รายเดียวที่ต้องการให้โหลด `USER.md` / `SOUL.md` โดยอัตโนมัติ |
| `"per-peer"`                 | เพียร์แต่ละรายได้รับเซสชันแยกกัน (ไม่ขึ้นกับช่องทาง)           | การแยกโดยใช้ข้อมูลประจำตัวผู้ส่งเป็นคีย์เท่านั้น                            |
| `"per-channel-peer"`         | ชุดข้อมูล (ช่องทาง + ผู้ใช้) แต่ละชุดได้รับเซสชันแยกกัน           | บอตสาธารณะแบบหลายผู้ใช้ที่ต้องการการแยกที่เข้มงวดยิ่งขึ้น                  |
| `"per-account-channel-peer"` | ชุดข้อมูล (บัญชี + ช่องทาง + ผู้ใช้) แต่ละชุดได้รับเซสชันแยกกัน | บอตหลายบัญชีที่ต้องการแยกเซสชันในระดับบัญชี         |

**ข้อแลกเปลี่ยน**: การใช้ `"main"` จะเปิดใช้การโหลดไฟล์บูตสแตรปอัตโนมัติ (`USER.md`, `SOUL.md`, `MEMORY.md`) แต่หมายความว่า DM ทั้งหมดจากทุกช่องทางจะใช้รูปแบบคีย์เซสชันเดียวกัน สำหรับบอตสาธารณะแบบหลายผู้ใช้ที่ให้ความสำคัญกับการแยกมากกว่าการโหลดบูตสแตรปอัตโนมัติ ให้พิจารณา `"per-channel-peer"` และจัดการไฟล์บูตสแตรปด้วยตนเอง

<Note>
ใช้ `"per-account-channel-peer"` เมื่อบัญชี Feishu ที่มีชื่อต้องเก็บเซสชันแยกกันสำหรับผู้ส่งรายเดียวกัน การผูกแบบไดนามิกจะรักษาขอบเขตบัญชีไว้
</Note>

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
    // เลือก dmScope ตามความต้องการด้านการแยก:
    // "main" สำหรับการโหลดบูตสแตรปอัตโนมัติ, "per-channel-peer" สำหรับการแยกที่เข้มงวดยิ่งขึ้น
    dmScope: "main",
  },
  bindings: [], // เว้นว่าง - เอเจนต์แบบไดนามิกจะผูกโดยอัตโนมัติ
}
```

### การตรวจสอบ

ตรวจสอบบันทึกของ Gateway เพื่อยืนยันว่าการสร้างแบบไดนามิกทำงานอยู่:

```text
feishu: กำลังสร้างเอเจนต์แบบไดนามิก "feishu-ou_xxxxxx" สำหรับผู้ใช้ ou_xxxxxx
  workspace: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  agentDir: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

แสดงรายการเวิร์กสเปซที่สร้างทั้งหมด:

```bash
ls -la ~/.openclaw/workspace-*
```

### หมายเหตุ

- **การแยกเวิร์กสเปซ**: ผู้ใช้แต่ละรายจะได้รับไดเรกทอรีเวิร์กสเปซและอินสแตนซ์เอเจนต์ของตนเอง ผู้ใช้ไม่สามารถดูประวัติการสนทนาหรือไฟล์ของกันและกันภายในลำดับการรับส่งข้อความตามปกติ
- **ขอบเขตความปลอดภัย**: นี่เป็นกลไกแยกบริบทการรับส่งข้อความ ไม่ใช่ขอบเขตความปลอดภัยสำหรับผู้เช่าร่วมที่เป็นภัย กระบวนการเอเจนต์และสภาพแวดล้อมโฮสต์ยังคงใช้ร่วมกัน
- **ต้องเปิดใช้การเขียนการกำหนดค่าไว้**: การสร้างเอเจนต์แบบไดนามิกจะเขียนเอเจนต์และการผูกลงในการกำหนดค่า; ระบบจะข้ามขั้นตอนนี้เมื่อ `channels.feishu.configWrites` เป็น `false` (ค่าเริ่มต้น: เปิดใช้)
- **`bindings` ควรว่างเปล่า**: เอเจนต์แบบไดนามิกจะลงทะเบียนการผูกของตนเองโดยอัตโนมัติ
- **เส้นทางการอัปเกรด**: การผูกที่กำหนดด้วยตนเองซึ่งมีอยู่เดิมจะยังคงทำงานร่วมกับเอเจนต์แบบไดนามิก
- **`session.dmScope` เป็นส่วนกลาง**: สิ่งนี้ส่งผลต่อทุกช่องทาง ไม่ใช่เฉพาะ Feishu

## ข้อมูลอ้างอิงการกำหนดค่า

การกำหนดค่าแบบเต็ม: [การกำหนดค่า Gateway](/th/gateway/configuration)

| การตั้งค่า                                                  | คำอธิบาย                                                                          | ค่าเริ่มต้น                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | เปิด/ปิดใช้งานช่องทาง                                                           | `true`                               |
| `channels.feishu.domain`                                 | โดเมน API (`feishu`, `lark` หรือ URL ฐาน `https://`)                             | `feishu`                             |
| `channels.feishu.connectionMode`                         | การขนส่งเหตุการณ์ (`websocket` หรือ `webhook`)                                           | `websocket`                          |
| `channels.feishu.defaultAccount`                         | บัญชีเริ่มต้นสำหรับการกำหนดเส้นทางขาออก                                                 | `default`                            |
| `channels.feishu.verificationToken`                      | จำเป็นสำหรับโหมด Webhook                                                            | -                                    |
| `channels.feishu.encryptKey`                             | จำเป็นสำหรับโหมด Webhook                                                            | -                                    |
| `channels.feishu.webhookPath`                            | พาธเส้นทาง Webhook                                                                   | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | โฮสต์ที่ Webhook ผูกอยู่                                                                    | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | พอร์ตที่ Webhook ผูกอยู่                                                                    | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | ID แอป                                                                               | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | ข้อมูลลับของแอป                                                                           | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | การแทนที่โดเมนรายบัญชี                                                          | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | การแทนที่ TTS รายบัญชี                                                             | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | นโยบาย DM (`pairing`, `allowlist`, `open`)                                           | `pairing`                            |
| `channels.feishu.allowFrom`                              | รายการอนุญาต DM (รายการ open_id)                                                          | -                                    |
| `channels.feishu.groupPolicy`                            | นโยบายกลุ่ม (`open`, `allowlist`, `disabled`)                                       | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | รายการอนุญาตของกลุ่ม                                                                      | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | รายการอนุญาตผู้ส่งที่ใช้กับทุกกลุ่ม                                               | -                                    |
| `channels.feishu.requireMention`                         | กำหนดให้ต้อง @mention ในกลุ่ม                                                           | `true` (`false` เมื่อนโยบายเป็น `open`)  |
| `channels.feishu.groups.<chat_id>.requireMention`        | การแทนที่ @mention รายกลุ่ม โดย ID ที่ระบุชัดเจนจะอนุญาตกลุ่มในโหมดรายการอนุญาตด้วย     | สืบทอดค่า                            |
| `channels.feishu.groups.<chat_id>.enabled`               | เปิด/ปิดใช้งานกลุ่มที่ระบุ                                                      | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | รายการอนุญาตผู้ส่งรายกลุ่ม (แทนที่ `groupSenderAllowFrom`)                        | -                                    |
| `channels.feishu.groupSessionScope`                      | การแมปเซสชันกลุ่ม (`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | การตอบกลับของบอตสร้าง/ดำเนินเธรดหัวข้อต่อ (`disabled`, `enabled`)                    | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | เหตุการณ์รีแอ็กชันขาเข้า (`off`, `own`, `all`)                                        | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | เปิดใช้การสร้างเอเจนต์รายผู้ใช้โดยอัตโนมัติ                                             | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | เทมเพลตพาธสำหรับเวิร์กสเปซของเอเจนต์แบบไดนามิก                                           | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | เทมเพลตชื่อไดเรกทอรีเอเจนต์                                                        | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | จำนวนเอเจนต์แบบไดนามิกสูงสุดที่สร้างได้                                           | ไม่จำกัด                            |
| `channels.feishu.textChunkLimit`                         | ขนาดส่วนย่อยของข้อความ                                                                   | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | การแบ่งส่วนย่อย (`length` หรือ `newline`)                                              | `length`                             |
| `channels.feishu.mediaMaxMb`                             | ขีดจำกัดขนาดสื่อ                                                                     | `30`                                 |
| `channels.feishu.renderMode`                             | การเรนเดอร์ข้อความตอบกลับ (`auto`, `raw`, `card`)                                              | `auto`                               |
| `channels.feishu.streaming.mode`                         | เอาต์พุตการ์ดแบบสตรีม (`partial` หรือ `off`)                                           | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | การสตรีมข้อความตอบกลับเป็นบล็อกที่เสร็จสมบูรณ์                                                      | `false`                              |
| `channels.feishu.typingIndicator`                        | ส่งรีแอ็กชันแสดงสถานะกำลังพิมพ์                                                                | `true`                               |
| `channels.feishu.resolveSenderNames`                     | แปลงชื่อที่แสดงของผู้ส่ง                                                         | `true`                               |
| `channels.feishu.configWrites`                           | อนุญาตให้ช่องทางเริ่มเขียนการกำหนดค่า (จำเป็นสำหรับเอเจนต์แบบไดนามิก)                     | `true`                               |
| `channels.feishu.tools.doc`                              | เปิดใช้เครื่องมือเอกสาร                                                                | `true`                               |
| `channels.feishu.tools.chat`                             | เปิดใช้เครื่องมือข้อมูลแชต                                                               | `true`                               |
| `channels.feishu.tools.wiki`                             | เปิดใช้เครื่องมือฐานความรู้ (ต้องมี `doc`)                                         | `true`                               |
| `channels.feishu.tools.drive`                            | เปิดใช้เครื่องมือพื้นที่จัดเก็บบนคลาวด์                                                           | `true`                               |
| `channels.feishu.tools.perm`                             | เปิดใช้เครื่องมือจัดการสิทธิ์                                                   | `false`                              |
| `channels.feishu.tools.scopes`                           | เปิดใช้เครื่องมือวินิจฉัยขอบเขตสิทธิ์ของแอป                                                    | `true`                               |
| `channels.feishu.tools.bitable`                          | เปิดใช้เครื่องมือ Bitable/Base                                                            | `true`                               |
| `channels.feishu.tools.base`                             | นามแฝงสำหรับ `channels.feishu.tools.bitable`; หากตั้งค่าทั้งคู่ `bitable` ที่ระบุชัดเจนจะมีผลเหนือกว่า     | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | ตัวควบคุมเครื่องมือ Bitable/Base รายบัญชี                                                   | สืบทอดค่า                            |
| `channels.feishu.accounts.<id>.tools.base`               | นามแฝงรายบัญชีสำหรับ `tools.bitable`                                                | สืบทอดค่า                            |

## ประเภทข้อความที่รองรับ

### รับ

- ✅ ข้อความ
- ✅ Rich text (โพสต์)
- ✅ รูปภาพ
- ✅ ไฟล์
- ✅ เสียง
- ✅ วิดีโอ/สื่อ
- ✅ สติกเกอร์

ข้อความเสียง Feishu/Lark ขาเข้าจะถูกทำให้อยู่ในรูปแบบมาตรฐานเป็นตัวยึดตำแหน่งสื่อแทน
JSON `file_key` แบบดิบ เมื่อกำหนดค่า `tools.media.audio` แล้ว OpenClaw
จะดาวน์โหลดทรัพยากรบันทึกเสียงและเรียกใช้การถอดเสียงร่วมก่อนเริ่มรอบการทำงานของ
เอเจนต์ เพื่อให้เอเจนต์ได้รับข้อความถอดเสียงพูด หาก Feishu ใส่
ข้อความถอดเสียงมาโดยตรงในเพย์โหลดเสียง ระบบจะใช้ข้อความนั้นโดยไม่เรียก
ASR อีกครั้ง หากไม่มีผู้ให้บริการถอดเสียง เอเจนต์จะยังคงได้รับ
ตัวยึดตำแหน่ง `<media:audio>` พร้อมไฟล์แนบที่บันทึกไว้ ไม่ใช่เพย์โหลดทรัพยากร
Feishu แบบดิบ

### ส่ง

- ✅ ข้อความ
- ✅ รูปภาพ
- ✅ ไฟล์
- ✅ เสียง
- ✅ วิดีโอ/สื่อ
- ✅ การ์ดแบบโต้ตอบ (รวมถึงการอัปเดตแบบสตรีม)
- ⚠️ Rich text (การจัดรูปแบบแบบโพสต์ ไม่รองรับความสามารถในการเขียนของ Feishu/Lark อย่างเต็มรูปแบบ)

บับเบิลเสียงแบบเนทีฟของ Feishu/Lark ใช้ประเภทข้อความ `audio` ของ Feishu และต้องใช้
สื่ออัปโหลดแบบ Ogg/Opus (`file_type: "opus"`) สื่อ `.opus` และ `.ogg` ที่มีอยู่
จะถูกส่งโดยตรงเป็นเสียงแบบเนทีฟ ส่วน MP3/WAV/M4A และรูปแบบเสียงอื่นที่มีแนวโน้มว่าเป็นเสียง
จะถูกแปลงเป็น Ogg/Opus 48kHz ด้วย `ffmpeg` เฉพาะเมื่อข้อความตอบกลับร้องขอการส่ง
แบบเสียง (`audioAsVoice` / เครื่องมือข้อความ `asVoice` รวมถึงข้อความตอบกลับแบบบันทึกเสียง
จาก TTS) ไฟล์แนบ MP3 ทั่วไปจะยังคงเป็นไฟล์ปกติ หากไม่มี `ffmpeg` หรือ
การแปลงล้มเหลว OpenClaw จะใช้ไฟล์แนบแทนและบันทึกเหตุผลลงในล็อก

### เธรดและการตอบกลับ

- ✅ การตอบกลับแบบอินไลน์
- ✅ การตอบกลับในเธรด
- ✅ การตอบกลับด้วยสื่อยังคงรับรู้เธรดเมื่อตอบกลับข้อความในเธรด

การกำหนดเส้นทางเซสชันของกลุ่มหัวข้ออธิบายไว้ใน
[ขอบเขตเซสชันกลุ่มและเธรดหัวข้อ](#group-session-scope-and-topic-threads)

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) - ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) - ขั้นตอนการยืนยันตัวตนและการจับคู่ DM
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเพิ่มความแข็งแกร่ง
