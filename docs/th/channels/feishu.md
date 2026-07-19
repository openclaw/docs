---
read_when:
    - คุณต้องการเชื่อมต่อบอต Feishu/Lark
    - คุณกำลังกำหนดค่าช่อง Feishu
summary: ภาพรวม ฟีเจอร์ และการกำหนดค่าบอต Feishu
title: Feishu
x-i18n:
    generated_at: "2026-07-19T07:10:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 907f99245ec1d5d038362636def039b16225f90ab9d8ec9d61d08f16495a1710
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw เชื่อมต่อกับ Feishu/Lark (แพลตฟอร์มการทำงานร่วมกันแบบครบวงจร) ผ่าน Plugin อย่างเป็นทางการ `@openclaw/feishu`: DM ของบอต แชตกลุ่ม การตอบกลับด้วยการ์ดแบบสตรีม และเครื่องมือเอกสาร/วิกิ/ไดรฟ์/Bitable ของ Feishu

**สถานะ:** พร้อมใช้งานจริงสำหรับ DM ของบอตและแชตกลุ่ม WebSocket เป็นการรับส่งเหตุการณ์เริ่มต้น (ไม่ต้องใช้ URL สาธารณะ) ส่วนโหมด webhook เป็นทางเลือก

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
- **ตั้งค่าด้วย QR**: สแกนโค้ด QR ในแอป Feishu เพื่อสร้างบอตโดยอัตโนมัติ ขั้นตอนนี้จะจำกัด DM ไว้เฉพาะบัญชีของคุณเอง (`dmPolicy: "allowlist"` ด้วย `open_id` ของคุณ)

ตัวช่วยจะถามโดเมน API (Feishu หรือ Lark) และนโยบายกลุ่มด้วย หากแอป Feishu สำหรับมือถือภายในประเทศไม่ตอบสนองต่อโค้ด QR ให้เรียกใช้การตั้งค่าอีกครั้งและเลือกตั้งค่าด้วยตนเอง
</Step>

  <Step title="หลังตั้งค่าเสร็จสิ้น ให้รีสตาร์ต Gateway เพื่อใช้การเปลี่ยนแปลง">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## ความคงทนของข้อมูลขาเข้า

OpenClaw จะจัดคิวซองข้อมูล `im.message.receive_v1` และ `drive.notice.comment_add_v1` ที่ผ่านการยืนยันตัวตนอย่างคงทนก่อนส่งต่อไปยังเอเจนต์ เหตุการณ์ที่รอดำเนินการหรือสามารถลองใหม่ได้จะยังคงอยู่หลังรีสตาร์ต Gateway โดยยังประมวลผลตามลำดับต่อแชตหรือเอกสาร และใช้ ID เหตุการณ์ของ Feishu เพื่อระงับรายการคิวซ้ำตราบใดที่ยังมีระเบียนการเสร็จสิ้นที่กำลังใช้งานหรือเก็บรักษาไว้

หากไม่สามารถบันทึกเหตุการณ์ WebSocket อย่างถาวรได้หลังจากลองใหม่ตามจำนวนครั้งที่จำกัด OpenClaw จะปิดซ็อกเก็ตนั้นและบังคับให้สร้างการเชื่อมต่อใหม่ที่ผ่านการยืนยันตัวตน แทนที่จะดำเนินการต่อหลังเทิร์นที่ยังไม่ได้คอมมิต เหตุการณ์ Feishu ประเภทอื่น รวมถึงรีแอ็กชันและคำเชิญประชุม VC จะใช้เส้นทางเหตุการณ์ตามปกติและไม่ได้รับการรับประกันคิวแบบคงทนนี้

## การควบคุมการเข้าถึง

### ข้อความโดยตรง

กำหนดค่า `channels.feishu.dmPolicy` (ค่าเริ่มต้น: `pairing`) เพื่อควบคุมว่าใครสามารถส่ง DM ถึงบอตได้:

| ค่า         | ลักษณะการทำงาน                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | ผู้ใช้ที่ไม่รู้จักจะได้รับรหัสจับคู่ ให้อนุมัติผ่าน CLI                                                         |
| `"allowlist"` | เฉพาะผู้ใช้ที่ระบุใน `allowFrom` เท่านั้นที่แชตได้                                                                     |
| `"open"`      | เปิด DM สาธารณะ การตรวจสอบการกำหนดค่ากำหนดให้ `allowFrom` มี `"*"` รายการที่ไม่ใช่ไวลด์การ์ดยังคงจำกัดการเข้าถึงให้แคบลง |

**อนุมัติคำขอจับคู่:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### แชตกลุ่ม

**นโยบายกลุ่ม** (`channels.feishu.groupPolicy`, ค่าเริ่มต้น: `allowlist`):

| ค่า         | ลักษณะการทำงาน                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | ตอบกลับทุกข้อความในกลุ่ม                                                            |
| `"allowlist"` | ตอบกลับเฉพาะกลุ่มที่อยู่ใน `groupAllowFrom` หรือกำหนดไว้อย่างชัดเจนภายใต้ `groups.<chat_id>` |
| `"disabled"`  | ปิดใช้งานข้อความกลุ่มทั้งหมด รายการ `groups.<chat_id>` ที่กำหนดไว้อย่างชัดเจนไม่สามารถลบล้างค่านี้ได้         |

**ข้อกำหนดการกล่าวถึง** (`channels.feishu.requireMention`):

- ค่าเริ่มต้น: ต้อง @กล่าวถึง ยกเว้นเมื่อนโยบายกลุ่มที่มีผลคือ `"open"` ซึ่งจะใช้ค่าเริ่มต้นเป็น `false` เพื่อให้ข้อความที่ไม่สามารถมีการกล่าวถึงได้ (เช่น รูปภาพ) ยังคงส่งถึงเอเจนต์
- ตั้งค่า `true` หรือ `false` อย่างชัดเจนเพื่อลบล้างค่า การลบล้างรายกลุ่ม: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` และ `@_all` ที่ใช้สำหรับการประกาศเท่านั้นจะไม่ถือว่าเป็นการกล่าวถึงบอต ข้อความที่กล่าวถึงทั้ง `@all` และบอตโดยตรงยังคงนับว่าเป็นการกล่าวถึงบอต

## ตัวอย่างการกำหนดค่ากลุ่ม

### อนุญาตทุกกลุ่มโดยไม่ต้อง @กล่าวถึง

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // requireMention ใช้ค่าเริ่มต้นเป็น false ภายใต้ "open"
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

### อนุญาตเฉพาะกลุ่มที่ระบุ

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // ID กลุ่มมีลักษณะดังนี้: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

ในโหมด `allowlist` คุณสามารถอนุญาตกลุ่มได้ด้วยการเพิ่มรายการ `groups.<chat_id>` อย่างชัดเจน รายการที่กำหนดไว้อย่างชัดเจนไม่สามารถลบล้าง `groupPolicy: "disabled"` ได้ ค่าเริ่มต้นแบบไวลด์การ์ดภายใต้ `groups.*` จะกำหนดค่ากลุ่มที่ตรงกัน แต่ไม่ได้อนุญาตกลุ่มเหล่านั้นด้วยตัวเอง

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
          // open_id ของผู้ใช้มีลักษณะดังนี้: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

`channels.feishu.groupSenderAllowFrom` กำหนดรายการอนุญาตผู้ส่งเดียวกันสำหรับทุกกลุ่ม ส่วน `allowFrom` รายกลุ่มมีลำดับความสำคัญสูงกว่า

### ข้อความที่เขียนโดยบอต

ตามค่าเริ่มต้น Feishu จะละเว้นข้อความที่เขียนโดยบอตอื่น หากต้องการอนุญาตการสนทนาระหว่างบอตในกลุ่ม ให้มอบขอบเขต `im:message.group_at_msg.include_bot:readonly` และ `im:message:readonly` แก่แอป จากนั้นตั้งค่า `allowBots`:

```json5
{
  channels: {
    feishu: {
      allowBots: true,
    },
  },
}
```

Feishu จะส่งเหตุการณ์กลุ่มที่เขียนโดยบอตต่อเมื่อบอตอื่นกล่าวถึงบอตนี้เท่านั้น นโยบายกลุ่ม รายการอนุญาตผู้ส่ง และข้อกำหนดการกล่าวถึงที่มีอยู่ยังคงมีผล OpenClaw จะทิ้งข้อความที่เขียนโดยตัวเอง กล่าวถึงบอตอีกฝ่ายในการตอบกลับด้วยข้อความหรือการ์ดทุกครั้ง และใช้กลไกป้องกัน [`channels.defaults.botLoopProtection`](/th/channels/bot-loop-protection) ที่ใช้ร่วมกัน

<a id="get-groupuser-ids"></a>

## รับ ID กลุ่ม/ผู้ใช้

### ID กลุ่ม (`chat_id`, รูปแบบ: `oc_xxx`)

เปิดกลุ่มใน Feishu/Lark คลิกไอคอนเมนูที่มุมขวาบน แล้วไปที่ **Settings** ID กลุ่ม (`chat_id`) จะแสดงอยู่ในหน้าการตั้งค่า

![รับ ID กลุ่ม](/images/feishu-get-group-id.png)

### ID ผู้ใช้ (`open_id`, รูปแบบ: `ou_xxx`)

เริ่ม Gateway ส่ง DM ถึงบอต แล้วตรวจสอบบันทึก:

```bash
openclaw logs --follow
```

มองหา `open_id` ในผลลัพธ์บันทึก คุณยังสามารถตรวจสอบคำขอจับคู่ที่รอดำเนินการได้:

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
Feishu/Lark ไม่รองรับเมนูคำสั่งแบบสแลชโดยตรง ดังนั้นให้ส่งคำสั่งเหล่านี้เป็นข้อความธรรมดา
</Note>

## การแก้ไขปัญหา

### บอตไม่ตอบกลับในแชตกลุ่ม

1. ตรวจสอบว่าเพิ่มบอตเข้ากลุ่มแล้ว
2. ตรวจสอบว่าคุณ @กล่าวถึงบอต (จำเป็นตามค่าเริ่มต้น)
3. ตรวจสอบว่า `groupPolicy` ไม่ใช่ `"disabled"`
4. ตรวจสอบบันทึก: `openclaw logs --follow`

### บอตไม่ได้รับข้อความ

1. ตรวจสอบว่าบอตได้รับการเผยแพร่และอนุมัติใน Feishu Open Platform / Lark Developer แล้ว
2. ตรวจสอบว่าการสมัครรับเหตุการณ์มี `im.message.receive_v1`
3. สำหรับการเข้าร่วมคำเชิญประชุมโดยอัตโนมัติ ให้สมัครรับ `vc.bot.meeting_invited_v1` ด้วย
4. ตรวจสอบว่าเลือก **persistent connection** (WebSocket) แล้ว
5. ตรวจสอบว่าได้รับขอบเขตสิทธิ์ที่จำเป็นทั้งหมดแล้ว
6. ตรวจสอบว่า Gateway กำลังทำงาน: `openclaw gateway status`
7. ตรวจสอบบันทึก: `openclaw logs --follow`

การสมัครรับ `vc.bot.meeting_invited_v1` มีไว้เพื่อส่งเหตุการณ์เท่านั้น การเข้าร่วมอัตโนมัติจะ
ปิดใช้งานตามค่าเริ่มต้น หากต้องการเปิดใช้ทั่วทั้งระบบ:

```json5
{
  channels: {
    feishu: {
      vcAutoJoin: true,
    },
  },
}
```

หากต้องการเปิดใช้เพียงบัญชีเดียว ให้ละเว้นสวิตช์ระดับบนสุดและตั้งค่าลบล้างสำหรับบัญชี:

```json5
{
  channels: {
    feishu: {
      accounts: {
        meetings: { vcAutoJoin: true },
      },
    },
  },
}
```

ผู้เชิญยังคงต้องผ่านนโยบาย DM ของ Feishu ตามปกติ รายการอนุญาต/การจับคู่ เซสชัน และการกำหนดเส้นทาง
การตอบกลับ ก่อนที่เอเจนต์จะได้รับเทิร์นการเข้าร่วม การเข้าร่วมยังกำหนดให้มีเครื่องมือเข้าร่วม Feishu VC
ที่พร้อมใช้งาน ซึ่งกำหนดค่าสำหรับข้อมูลประจำตัวของแอปพร้อมขอบเขต
`vc:meeting.bot.join:write` ตัวอย่างเช่น Skills เอเจนต์ VC อย่างเป็นทางการ
[`lark-cli`](https://github.com/larksuite/cli/tree/main/skills/lark-vc-agent)
มี `vc +meeting-join`

<Warning>
ขณะนี้ Skills เอเจนต์ VC อย่างเป็นทางการ `lark-cli` ระบุว่าการดำเนินการของบอตประชุมเป็นรุ่นเบต้าแบบจำกัด หากเครื่องมือส่งคืน `ErrNotInGray` หรือรหัสข้อผิดพลาด `20017` แสดงว่าแอปหรือผู้เช่ายังไม่ได้รับการเปิดใช้สำหรับรุ่นเบต้านั้น ให้ปฏิบัติตามคำแนะนำสำหรับการเข้าถึงล่วงหน้าใน Skills ที่ลิงก์ไว้ก่อนแก้ไขปัญหาการมอบขอบเขตตามปกติ
</Warning>

### การตั้งค่าด้วย QR ไม่ตอบสนองในแอป Feishu สำหรับมือถือ

1. เรียกใช้การตั้งค่าอีกครั้ง: `openclaw channels login --channel feishu`
2. เลือกตั้งค่าด้วยตนเอง
3. ใน Feishu Open Platform ให้สร้างแอปที่พัฒนาขึ้นเองและคัดลอก App ID กับ App Secret
4. วางข้อมูลประจำตัวเหล่านั้นในตัวช่วยตั้งค่า

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
          name: "บอตหลัก",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
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

`defaultAccount` ควบคุมว่าจะใช้บัญชีใดเมื่อ API ขาออกไม่ได้ระบุ `accountId` รายการบัญชีจะสืบทอดการตั้งค่าระดับบนสุด โดยคีย์ระดับบนสุดส่วนใหญ่สามารถลบล้างเป็นรายบัญชีได้
`accounts.<id>.tts` ใช้โครงสร้างเดียวกับ `messages.tts` และผสานแบบลึกทับการกำหนดค่า TTS ส่วนกลาง เพื่อให้การตั้งค่า Feishu แบบหลายบอตสามารถเก็บข้อมูลประจำตัวของผู้ให้บริการที่ใช้ร่วมกันไว้ส่วนกลาง ขณะลบล้างเฉพาะเสียง โมเดล บุคลิก หรือโหมดอัตโนมัติเป็นรายบัญชี

### ขีดจำกัดข้อความ

- `textChunkLimit` - ขนาดส่วนข้อความขาออก (ค่าเริ่มต้น: `4000` อักขระ)
- `streaming.chunkMode` - `"length"` (ค่าเริ่มต้น) จะแบ่งเมื่อถึงขีดจำกัด ส่วน `"newline"` จะให้ความสำคัญกับขอบเขตบรรทัดใหม่
- `mediaMaxMb` - ขีดจำกัดการอัปโหลด/ดาวน์โหลดสื่อ (ค่าเริ่มต้น: `30` MB)

### การสตรีม

Feishu/Lark รองรับการตอบกลับแบบสตรีมผ่านการ์ดแบบโต้ตอบ (Card Kit streaming API) เมื่อเปิดใช้งาน บอตจะอัปเดตการ์ดแบบเรียลไทม์ระหว่างสร้างข้อความ

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // ผลลัพธ์การ์ดแบบสตรีม (ค่าเริ่มต้น: "partial")
        block: { enabled: true }, // เลือกใช้การสตรีมบล็อกที่เสร็จสมบูรณ์
      },
    },
  },
}
```

ตั้งค่า `streaming.mode: "off"` เพื่อส่งคำตอบฉบับสมบูรณ์ในข้อความเดียว ส่วน `renderMode: "raw"` (ข้อความธรรมดาแทนการ์ด) จะปิดใช้การ์ดแบบสตรีมด้วยเช่นกัน โดยค่าเริ่มต้น `streaming.block.enabled` จะปิดอยู่ ให้เปิดใช้เฉพาะเมื่อต้องการส่งบล็อกคำตอบของผู้ช่วยที่เสร็จแล้วออกไปก่อนคำตอบสุดท้าย ค่าแบบบูลีนเดิม `streaming` และคีย์แบบแบน `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` จะย้ายไปเป็นโครงสร้างแบบซ้อนนี้ผ่าน `openclaw doctor --fix`

### การเพิ่มประสิทธิภาพโควตา

ลดจำนวนการเรียก Feishu/Lark API ด้วยแฟล็กเสริม 2 รายการ:

- `typingIndicator` (ค่าเริ่มต้น `true`): ตั้งค่า `false` เพื่อข้ามการเรียกรีแอ็กชันแสดงสถานะกำลังพิมพ์
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

### ขอบเขตเซสชันกลุ่มและเธรดหัวข้อ

`channels.feishu.groupSessionScope` (ระดับบนสุด ต่อบัญชี หรือต่อกลุ่ม) ควบคุมวิธีแมปข้อความกลุ่มกับเซสชันของเอเจนต์:

| ค่า                  | เซสชัน                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"` (ค่าเริ่มต้น)    | หนึ่งเซสชันต่อแชตกลุ่ม                                       |
| `"group_sender"`       | หนึ่งเซสชันต่อ (กลุ่ม + ผู้ส่ง)                                 |
| `"group_topic"`        | หนึ่งเซสชันต่อเธรดหัวข้อ หากใช้ไม่ได้จะย้อนกลับไปใช้เซสชันกลุ่ม    |
| `"group_topic_sender"` | หนึ่งเซสชันต่อ (หัวข้อ + ผู้ส่ง) หากใช้ไม่ได้จะย้อนกลับไปใช้ (กลุ่ม + ผู้ส่ง) |

สำหรับขอบเขตแบบหัวข้อ กลุ่มหัวข้อแบบเนทีฟของ Feishu/Lark จะใช้อีเวนต์ `thread_id` (`omt_*`) เป็นคีย์เซสชันหัวข้อมาตรฐาน หากอีเวนต์เริ่มต้นหัวข้อแบบเนทีฟไม่มี `thread_id` OpenClaw จะเติมข้อมูลนี้จาก Feishu ก่อนกำหนดเส้นทางเทิร์น ส่วนการตอบกลับในกลุ่มทั่วไปที่ OpenClaw เปลี่ยนเป็นเธรดจะยังคงใช้ ID ข้อความรากของการตอบกลับ (`om_*`) เพื่อให้เทิร์นแรกและเทิร์นติดตามผลอยู่ในเซสชันเดียวกัน

ตั้งค่า `replyInThread: "enabled"` (ระดับบนสุดหรือต่อกลุ่ม) เพื่อให้คำตอบของบอตสร้างหรือดำเนินเธรดหัวข้อ Feishu ต่อ แทนการตอบแบบอินไลน์ `topicSessionMode` เป็นรุ่นก่อนหน้าที่เลิกใช้แล้วของ `groupSessionScope` ให้เลือกใช้ `groupSessionScope`

### เครื่องมือพื้นที่ทำงาน Feishu

Plugin มาพร้อมเครื่องมือเอเจนต์สำหรับเอกสาร แชต ฐานความรู้ พื้นที่จัดเก็บบนคลาวด์ สิทธิ์ และ Bitable ของ Feishu พร้อม Skills ที่สอดคล้องกัน (`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`) กลุ่มเครื่องมือควบคุมด้วย `channels.feishu.tools`:

| คีย์             | เครื่องมือ                                         | ค่าเริ่มต้น             |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | การดำเนินการกับเอกสาร `feishu_doc`              | `true`              |
| `tools.chat`    | ข้อมูลแชต + การสอบถามสมาชิก `feishu_chat`      | `true`              |
| `tools.wiki`    | ฐานความรู้ `feishu_wiki` (ต้องมี `doc`) | `true`              |
| `tools.drive`   | พื้นที่จัดเก็บบนคลาวด์ `feishu_drive`                  | `true`              |
| `tools.perm`    | การจัดการสิทธิ์ `feishu_perm`           | `false` (มีความละเอียดอ่อน) |
| `tools.scopes`  | การวินิจฉัยขอบเขตแอป `feishu_app_scopes`     | `true`              |
| `tools.bitable` | การดำเนินการ Bitable/Base `feishu_bitable_*`    | `true`              |

`tools.base` เป็นนามแฝงของ `tools.bitable` โดยค่า `bitable` ที่ระบุชัดเจนจะมีผลเหนือกว่าเมื่อตั้งค่าทั้งคู่ การควบคุมต่อบัญชีอยู่ภายใต้ `accounts.<id>.tools`

ให้สิทธิ์ `drive:drive.metadata:readonly` สำหรับการค้นหา `feishu_drive info` โดยตรงนอกไดเรกทอรีราก
เว้นแต่แอปจะมีขอบเขต `drive:drive` แบบเต็มอยู่แล้ว หากไม่มีขอบเขตใดเลย `info`
จะคงการค้นหาไดเรกทอรีรากแบบเดิมที่ใช้งานผ่าน `drive:drive:readonly` ไว้

### เซสชัน ACP

Feishu/Lark รองรับ ACP สำหรับ DM และข้อความในเธรดกลุ่ม ACP บน Feishu/Lark ขับเคลื่อนด้วยคำสั่งข้อความ โดยไม่มีเมนูคำสั่งสแลชแบบเนทีฟ ดังนั้นให้ใช้ข้อความ `/acp ...` โดยตรงในการสนทนา

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

`--thread here` ใช้งานได้กับ DM และข้อความในเธรด Feishu/Lark ข้อความติดตามผลในการสนทนาที่ผูกไว้จะถูกกำหนดเส้นทางไปยังเซสชัน ACP นั้นโดยตรง

### การกำหนดเส้นทางแบบหลายเอเจนต์

ใช้ `bindings` เพื่อกำหนดเส้นทาง DM หรือกลุ่ม Feishu/Lark ไปยังเอเจนต์ต่างกัน

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

ดูเคล็ดลับการค้นหาได้ที่ [รับ ID กลุ่ม/ผู้ใช้](#get-groupuser-ids)

## การแยกเอเจนต์ต่อผู้ใช้ (การสร้างเอเจนต์แบบไดนามิก)

เปิดใช้ `dynamicAgentCreation` เพื่อสร้าง **อินสแตนซ์เอเจนต์ที่แยกจากกัน** โดยอัตโนมัติสำหรับผู้ใช้ DM แต่ละราย ผู้ใช้แต่ละรายจะได้รับ:

- ไดเรกทอรีพื้นที่ทำงานอิสระ
- `USER.md` / `SOUL.md` / `MEMORY.md` แยกกัน
- ประวัติการสนทนาส่วนตัว
- Skills และสถานะที่แยกจากกัน

สิ่งนี้จำเป็นสำหรับบอตสาธารณะที่ต้องการให้ผู้ใช้แต่ละรายได้รับประสบการณ์ผู้ช่วย AI ส่วนตัวของตนเอง

<Note>
การผูกแบบไดนามิกจะรวม `accountId` ของ Feishu ที่ปรับให้อยู่ในรูปแบบมาตรฐาน เพื่อให้บัญชีเริ่มต้นและบัญชีที่มีชื่อกำหนดเส้นทางผู้ส่งแต่ละรายไปยังเอเจนต์แบบไดนามิกที่ถูกต้อง

หากบัญชีที่มีชื่อเคยสร้างเอเจนต์แบบไดนามิกที่ไม่มีขอบเขตในรุ่นเก่า เอเจนต์เดิมนั้นจะยังคงนับรวมใน `maxAgents` โปรดยืนยันว่าไม่ได้ถูกใช้โดยบัญชีเริ่มต้นก่อนนำออก หรือเพิ่ม `maxAgents` ชั่วคราว เพราะ OpenClaw ไม่สามารถอนุมานได้อย่างปลอดภัยว่าบัญชีใดเป็นเจ้าของสถานะเดิมที่กำกวม
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

เมื่อผู้ใช้ใหม่ส่ง DM แรก:

1. ช่องทางจะสร้าง `agentId` ที่ไม่ซ้ำกัน: `feishu-{user_open_id}` สำหรับบัญชีเริ่มต้น หรือค่าแฮชสรุปข้อมูลประจำตัวที่มีขอบเขตจำกัดและนำหน้าด้วยบัญชีสำหรับบัญชีที่มีชื่อ
2. สร้างพื้นที่ทำงานใหม่ที่พาธ `workspaceTemplate`
3. ลงทะเบียนเอเจนต์และสร้างการผูกสำหรับผู้ใช้รายนี้
4. ตัวช่วยพื้นที่ทำงานจะตรวจให้แน่ใจว่ามีไฟล์บูตสแตรป (`AGENTS.md`, `SOUL.md`, `USER.md` ฯลฯ) เมื่อเข้าถึงครั้งแรก
5. กำหนดเส้นทางข้อความทั้งหมดจากผู้ใช้รายนี้ในอนาคตไปยังเอเจนต์เฉพาะของผู้ใช้

### ตัวเลือกการกำหนดค่า

| การตั้งค่า                                                  | คำอธิบาย                                | ค่าเริ่มต้น                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | เปิดใช้การสร้างเอเจนต์ต่อผู้ใช้โดยอัตโนมัติ   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | เทมเพลตพาธสำหรับพื้นที่ทำงานของเอเจนต์แบบไดนามิก | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | เทมเพลตชื่อไดเรกทอรีเอเจนต์              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | จำนวนเอเจนต์แบบไดนามิกสูงสุดที่สร้างได้ | ไม่จำกัด                            |

ตัวแปรเทมเพลต:

- `{agentId}` - ID เอเจนต์ที่สร้างขึ้น (เช่น `feishu-ou_xxxxxx` หรือ `feishu-support-<identity_digest>`)
- `{userId}` - open_id ของผู้ส่งใน Feishu (เช่น `ou_xxxxxx`)

### ขอบเขตเซสชัน

`session.dmScope` ควบคุมวิธีแมปข้อความโดยตรงกับเซสชันของเอเจนต์ นี่เป็น **การตั้งค่าส่วนกลาง** ที่มีผลต่อทุกช่องทาง

| ค่า                        | ลักษณะการทำงาน                                                            | เหมาะสำหรับ                                                           |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | DM ของผู้ใช้แต่ละรายจะแมปกับเซสชันหลักของเอเจนต์                   | บอตผู้ใช้รายเดียวที่ต้องการให้ `USER.md` / `SOUL.md` โหลดอัตโนมัติ |
| `"per-peer"`                 | เพียร์แต่ละรายจะมีเซสชันแยกกัน (ไม่ขึ้นกับช่องทาง)           | การแยกที่ใช้ข้อมูลประจำตัวผู้ส่งเป็นคีย์เท่านั้น                            |
| `"per-channel-peer"`         | แต่ละชุด (ช่องทาง + ผู้ใช้) จะมีเซสชันแยกกัน           | บอตสาธารณะแบบหลายผู้ใช้ที่ต้องการการแยกที่เข้มงวดยิ่งขึ้น                  |
| `"per-account-channel-peer"` | แต่ละชุด (บัญชี + ช่องทาง + ผู้ใช้) จะมีเซสชันแยกกัน | บอตหลายบัญชีที่ต้องการการแยกเซสชันระดับบัญชี         |

**ข้อแลกเปลี่ยน**: การใช้ `"main"` จะเปิดใช้การโหลดไฟล์บูตสแตรปโดยอัตโนมัติ (`USER.md`, `SOUL.md`, `MEMORY.md`) แต่หมายความว่า DM ทั้งหมดในทุกช่องทางจะใช้รูปแบบคีย์เซสชันเดียวกัน สำหรับบอตสาธารณะแบบหลายผู้ใช้ที่การแยกสำคัญกว่าการโหลดบูตสแตรปอัตโนมัติ ให้พิจารณา `"per-channel-peer"` และจัดการไฟล์บูตสแตรปด้วยตนเอง

<Note>
ใช้ `"per-account-channel-peer"` เมื่อบัญชี Feishu ที่มีชื่อควรแยกเซสชันสำหรับผู้ส่งรายเดียวกัน การผูกแบบไดนามิกจะรักษาขอบเขตบัญชีไว้
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
    // "main" สำหรับการโหลดบูตสแตรปอัตโนมัติ และ "per-channel-peer" สำหรับการแยกที่เข้มงวดยิ่งขึ้น
    dmScope: "main",
  },
  bindings: [], // ว่างไว้ - เอเจนต์แบบไดนามิกจะผูกโดยอัตโนมัติ
}
```

### การตรวจสอบ

ตรวจสอบบันทึก Gateway เพื่อยืนยันว่าการสร้างแบบไดนามิกทำงานอยู่:

```text
feishu: กำลังสร้างเอเจนต์แบบไดนามิก "feishu-ou_xxxxxx" สำหรับผู้ใช้ ou_xxxxxx
  พื้นที่ทำงาน: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  ไดเรกทอรีเอเจนต์: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

แสดงรายการพื้นที่ทำงานทั้งหมดที่สร้างขึ้น:

```bash
ls -la ~/.openclaw/workspace-*
```

### หมายเหตุ

- **การแยกพื้นที่ทำงาน**: ผู้ใช้แต่ละรายจะมีไดเรกทอรีพื้นที่ทำงานและอินสแตนซ์เอเจนต์ของตนเอง ผู้ใช้ไม่สามารถดูประวัติการสนทนาหรือไฟล์ของกันและกันผ่านขั้นตอนการรับส่งข้อความตามปกติ
- **ขอบเขตความปลอดภัย**: นี่เป็นกลไกแยกบริบทการรับส่งข้อความ ไม่ใช่ขอบเขตความปลอดภัยสำหรับผู้เช่าร่วมที่ไม่เป็นมิตร กระบวนการเอเจนต์และสภาพแวดล้อมโฮสต์ใช้ร่วมกัน
- **ต้องเปิดใช้งานการเขียนการกำหนดค่าไว้**: การสร้างเอเจนต์แบบไดนามิกจะเขียนเอเจนต์และการผูกลงในการกำหนดค่า โดยจะข้ามการดำเนินการนี้เมื่อ `channels.feishu.configWrites` เป็น `false` (ค่าเริ่มต้น: เปิดใช้งาน)
- **`bindings` ควรว่างเปล่า**: เอเจนต์แบบไดนามิกจะลงทะเบียนการผูกของตนเองโดยอัตโนมัติ
- **เส้นทางการอัปเกรด**: การผูกที่กำหนดด้วยตนเองซึ่งมีอยู่จะยังคงทำงานร่วมกับเอเจนต์แบบไดนามิกได้
- **`session.dmScope` เป็นแบบส่วนกลาง**: การตั้งค่านี้ส่งผลต่อทุกช่องทาง ไม่ใช่เฉพาะ Feishu

## ข้อมูลอ้างอิงการกำหนดค่า

การกำหนดค่าฉบับเต็ม: [การกำหนดค่า Gateway](/th/gateway/configuration)

| การตั้งค่า                                                  | คำอธิบาย                                                                          | ค่าเริ่มต้น                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | เปิด/ปิดใช้งานช่องทาง                                                           | `true`                               |
| `channels.feishu.domain`                                 | โดเมน API (`feishu`, `lark` หรือ URL ฐาน `https://`)                             | `feishu`                             |
| `channels.feishu.connectionMode`                         | การขนส่งเหตุการณ์ (`websocket` หรือ `webhook`)                                           | `websocket`                          |
| `channels.feishu.defaultAccount`                         | บัญชีเริ่มต้นสำหรับการกำหนดเส้นทางขาออก                                                 | `default`                            |
| `channels.feishu.verificationToken`                      | จำเป็นสำหรับโหมด Webhook                                                            | -                                    |
| `channels.feishu.encryptKey`                             | จำเป็นสำหรับโหมด Webhook                                                            | -                                    |
| `channels.feishu.webhookPath`                            | พาธเส้นทาง Webhook                                                                   | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | โฮสต์ผูก Webhook                                                                    | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | พอร์ตผูก Webhook                                                                    | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | ID แอป                                                                               | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | ข้อมูลลับของแอป                                                                           | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | การแทนที่โดเมนแยกตามบัญชี                                                          | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | การแทนที่ TTS แยกตามบัญชี                                                             | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | นโยบาย DM (`pairing`, `allowlist`, `open`)                                           | `pairing`                            |
| `channels.feishu.allowFrom`                              | รายการอนุญาต DM (รายการ open_id)                                                          | -                                    |
| `channels.feishu.groupPolicy`                            | นโยบายกลุ่ม (`open`, `allowlist`, `disabled`)                                       | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | รายการอนุญาตกลุ่ม                                                                      | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | รายการอนุญาตผู้ส่งที่ใช้กับทุกกลุ่ม                                               | -                                    |
| `channels.feishu.requireMention`                         | กำหนดให้ต้อง @mention ในกลุ่ม                                                           | `true` (`false` เมื่อนโยบายเป็น `open`)  |
| `channels.feishu.allowBots`                              | ยอมรับบอตอื่นที่กล่าวถึงบอตนี้ พร้อมการป้องกันลูปของบอต                    | `false`                              |
| `channels.feishu.groups.<chat_id>.requireMention`        | การแทนที่ @mention แยกตามกลุ่ม โดย ID ที่ระบุอย่างชัดเจนจะอนุญาตกลุ่มในโหมดรายการอนุญาตด้วย     | สืบทอดค่า                            |
| `channels.feishu.groups.<chat_id>.enabled`               | เปิด/ปิดใช้งานกลุ่มที่ระบุ                                                      | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | รายการอนุญาตผู้ส่งแยกตามกลุ่ม (แทนที่ `groupSenderAllowFrom`)                        | -                                    |
| `channels.feishu.groupSessionScope`                      | การแมปเซสชันกลุ่ม (`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | การตอบกลับของบอตจะสร้าง/ดำเนินเธรดหัวข้อต่อ (`disabled`, `enabled`)                    | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | เหตุการณ์รีแอ็กชันขาเข้า (`off`, `own`, `all`)                                        | `own`                                |
| `channels.feishu.vcAutoJoin`                             | เข้าร่วมการประชุม VC ที่ได้รับเชิญหลังจากผ่านการอนุญาต DM ตามปกติ                               | `false`                              |
| `channels.feishu.dynamicAgentCreation.enabled`           | เปิดใช้งานการสร้างเอเจนต์แยกตามผู้ใช้โดยอัตโนมัติ                                             | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | เทมเพลตพาธสำหรับพื้นที่ทำงานของเอเจนต์แบบไดนามิก                                           | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | เทมเพลตชื่อไดเรกทอรีเอเจนต์                                                        | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | จำนวนเอเจนต์แบบไดนามิกสูงสุดที่จะสร้าง                                           | ไม่จำกัด                            |
| `channels.feishu.textChunkLimit`                         | ขนาดส่วนข้อความ                                                                   | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | การแบ่งส่วน (`length` หรือ `newline`)                                              | `length`                             |
| `channels.feishu.mediaMaxMb`                             | ขีดจำกัดขนาดสื่อ                                                                     | `30`                                 |
| `channels.feishu.renderMode`                             | การเรนเดอร์การตอบกลับ (`auto`, `raw`, `card`)                                              | `auto`                               |
| `channels.feishu.streaming.mode`                         | เอาต์พุตการ์ดแบบสตรีม (`partial` หรือ `off`)                                           | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | การสตรีมการตอบกลับเมื่อบล็อกเสร็จสมบูรณ์                                                      | `false`                              |
| `channels.feishu.typingIndicator`                        | ส่งรีแอ็กชันขณะกำลังพิมพ์                                                                | `true`                               |
| `channels.feishu.resolveSenderNames`                     | แปลงข้อมูลชื่อที่แสดงของผู้ส่ง                                                         | `true`                               |
| `channels.feishu.configWrites`                           | อนุญาตการเขียนการกำหนดค่าที่เริ่มต้นโดยช่องทาง (จำเป็นสำหรับเอเจนต์แบบไดนามิก)                     | `true`                               |
| `channels.feishu.tools.doc`                              | เปิดใช้งานเครื่องมือเอกสาร                                                                | `true`                               |
| `channels.feishu.tools.chat`                             | เปิดใช้งานเครื่องมือข้อมูลแชต                                                               | `true`                               |
| `channels.feishu.tools.wiki`                             | เปิดใช้งานเครื่องมือฐานความรู้ (ต้องใช้ `doc`)                                         | `true`                               |
| `channels.feishu.tools.drive`                            | เปิดใช้งานเครื่องมือพื้นที่จัดเก็บบนคลาวด์                                                           | `true`                               |
| `channels.feishu.tools.perm`                             | เปิดใช้งานเครื่องมือจัดการสิทธิ์                                                   | `false`                              |
| `channels.feishu.tools.scopes`                           | เปิดใช้งานเครื่องมือวินิจฉัยขอบเขตสิทธิ์ของแอป                                                    | `true`                               |
| `channels.feishu.tools.bitable`                          | เปิดใช้งานเครื่องมือ Bitable/Base                                                            | `true`                               |
| `channels.feishu.tools.base`                             | ชื่อแทนสำหรับ `channels.feishu.tools.bitable`; หากตั้งค่าทั้งคู่ `bitable` ที่ระบุอย่างชัดเจนจะมีผลเหนือกว่า     | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | ตัวควบคุมเครื่องมือ Bitable/Base แยกตามบัญชี                                                   | สืบทอดค่า                            |
| `channels.feishu.accounts.<id>.tools.base`               | ชื่อแทนแยกตามบัญชีสำหรับ `tools.bitable`                                                | สืบทอดค่า                            |

## ประเภทข้อความที่รองรับ

### รับ

- ✅ ข้อความ
- ✅ ข้อความแบบริชเท็กซ์ (โพสต์)
- ✅ รูปภาพ
- ✅ ไฟล์
- ✅ เสียง
- ✅ วิดีโอ/สื่อ
- ✅ สติกเกอร์

ข้อความเสียง Feishu/Lark ขาเข้าจะถูกทำให้เป็นมาตรฐานในรูปแบบตัวยึดสื่อแทน
JSON `file_key` แบบดิบ เมื่อกำหนดค่า `tools.media.audio` แล้ว OpenClaw
จะดาวน์โหลดทรัพยากรบันทึกเสียงและเรียกใช้การถอดเสียงร่วมก่อนถึงรอบการทำงานของ
เอเจนต์ เพื่อให้เอเจนต์ได้รับข้อความถอดเสียงพูด หาก Feishu ใส่
ข้อความถอดเสียงไว้ในเพย์โหลดเสียงโดยตรง ระบบจะใช้ข้อความนั้นโดยไม่เรียก
ASR อีกครั้ง หากไม่มีผู้ให้บริการถอดเสียง เอเจนต์จะยังได้รับ
ตัวยึด `<media:audio>` พร้อมไฟล์แนบที่บันทึกไว้ ไม่ใช่เพย์โหลด
ทรัพยากร Feishu แบบดิบ

### ส่ง

- ✅ ข้อความ
- ✅ รูปภาพ
- ✅ ไฟล์
- ✅ เสียง
- ✅ วิดีโอ/สื่อ
- ✅ การ์ดแบบโต้ตอบ (รวมถึงการอัปเดตแบบสตรีม)
- ⚠️ ข้อความแบบริชเท็กซ์ (การจัดรูปแบบสไตล์โพสต์ ไม่รองรับความสามารถในการเขียนของ Feishu/Lark อย่างเต็มรูปแบบ)

บับเบิลเสียงแบบเนทีฟของ Feishu/Lark ใช้ประเภทข้อความ Feishu `audio` และต้องใช้
สื่ออัปโหลด Ogg/Opus (`file_type: "opus"`) สื่อ `.opus` และ `.ogg` ที่มีอยู่
จะถูกส่งโดยตรงเป็นเสียงแบบเนทีฟ ส่วน MP3/WAV/M4A และรูปแบบเสียงอื่น ๆ ที่มีแนวโน้มว่าเป็นเสียง
จะถูกแปลงรหัสเป็น Ogg/Opus 48kHz ด้วย `ffmpeg` เฉพาะเมื่อการตอบกลับร้องขอให้ส่ง
เป็นเสียง (`audioAsVoice` / เครื่องมือข้อความ `asVoice` รวมถึงการตอบกลับ
ด้วยข้อความเสียงจาก TTS) ไฟล์แนบ MP3 ทั่วไปจะยังคงเป็นไฟล์ปกติ หากไม่มี `ffmpeg`
หรือการแปลงล้มเหลว OpenClaw จะเปลี่ยนไปใช้ไฟล์แนบและบันทึกเหตุผลไว้ในล็อก

### เธรดและการตอบกลับ

- ✅ การตอบกลับแบบอินไลน์
- ✅ การตอบกลับในเธรด
- ✅ การตอบกลับด้วยสื่อยังคงเชื่อมโยงกับเธรดเมื่อตอบกลับข้อความในเธรด

การกำหนดเส้นทางเซสชันตามกลุ่มหัวข้ออธิบายไว้ใน
[ขอบเขตเซสชันกลุ่มและเธรดหัวข้อ](#group-session-scope-and-topic-threads)

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) - ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตนผ่าน DM และขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความปลอดภัย
