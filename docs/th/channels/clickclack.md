---
read_when:
    - การเชื่อมต่อ OpenClaw กับพื้นที่ทำงาน ClickClack
    - การทดสอบข้อมูลประจำตัวบอต ClickClack
summary: การตั้งค่าช่องทางด้วยโทเค็นบอต ClickClack และไวยากรณ์เป้าหมาย
title: ClickClack
x-i18n:
    generated_at: "2026-07-12T15:45:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack เชื่อมต่อ OpenClaw เข้ากับเวิร์กสเปซ ClickClack ที่โฮสต์เองผ่านโทเค็นบอต ClickClack ที่รองรับโดยตรง

ใช้วิธีนี้เมื่อต้องการให้เอเจนต์ OpenClaw ปรากฏเป็นผู้ใช้บอต ClickClack โดย ClickClack รองรับทั้งบอตบริการอิสระและบอตที่ผู้ใช้เป็นเจ้าของ บอตที่ผู้ใช้เป็นเจ้าของจะเก็บ `owner_user_id` และได้รับเฉพาะขอบเขตโทเค็นที่คุณอนุญาตเท่านั้น

## การตั้งค่าด่วน

สร้างโทเค็นบอตบนเซิร์ฟเวอร์ ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

สำหรับบอตที่ผู้ใช้เป็นเจ้าของ ให้เพิ่ม `--owner <user_id>`

กำหนดค่า OpenClaw:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

จากนั้นเรียกใช้:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

บัญชีจะถือว่าได้รับการกำหนดค่าแล้วก็ต่อเมื่อมีการตั้งค่า `baseUrl`, `token` และ `workspace` ครบทั้งหมด `workspace` รองรับรหัสเวิร์กสเปซ (`wsp_...`), slug หรือชื่อ โดย Gateway จะแปลงค่าเป็นรหัสเมื่อเริ่มทำงาน

### คีย์การกำหนดค่าบัญชี

| คีย์                     | ค่าเริ่มต้น             | หมายเหตุ                                                                                   |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | ไม่มี (จำเป็น)     | URL ของเซิร์ฟเวอร์ ClickClack                                                                  |
| `token`                 | ไม่มี (จำเป็น)     | สตริงข้อความธรรมดาหรือข้อมูลอ้างอิงความลับ (`source: "env" \| "file" \| "exec"`)                       |
| `workspace`             | ไม่มี (จำเป็น)     | รหัสเวิร์กสเปซ, slug หรือชื่อ                                                            |
| `replyMode`             | `"agent"`           | `"agent"` เรียกใช้ไปป์ไลน์เอเจนต์ทั้งหมด ส่วน `"model"` ส่งคำตอบจากโมเดลโดยตรงแบบสั้น |
| `defaultTo`             | `"channel:general"` | เป้าหมายที่ใช้เมื่อเส้นทางขาออกไม่ได้ระบุเป้าหมาย                                      |
| `allowFrom`             | `["*"]`             | รายการรหัสผู้ใช้ที่อนุญาตสำหรับ DM และข้อความในช่องทางขาเข้า                                 |
| `botUserId`             | ตรวจหาอัตโนมัติ       | แปลงค่าจากข้อมูลประจำตัวของโทเค็นบอตเมื่อเริ่มทำงาน                                        |
| `agentId`               | ค่าเริ่มต้นของเส้นทาง       | ตรึงข้อความขาเข้าของบัญชีนี้ไว้กับเอเจนต์หนึ่งราย                                       |
| `toolsAllow`            | ไม่มี                | รายการเครื่องมือที่อนุญาตสำหรับการตอบกลับของเอเจนต์จากบัญชีนี้                                     |
| `model`, `systemPrompt` | ไม่มี                | ใช้โดยการสร้างคำตอบของ `replyMode: "model"`                                               |
| `reconnectMs`           | `1500`              | ระยะหน่วงก่อนเชื่อมต่อแบบเรียลไทม์ใหม่ (100 ถึง 60000)                                                |

หาก `plugins.allow` เป็นรายการจำกัดที่ไม่ว่าง การเลือก
ClickClack อย่างชัดเจนในการตั้งค่าช่องทาง หรือการเรียกใช้ `openclaw plugins enable clickclack`
จะเพิ่ม `clickclack` ต่อท้ายรายการนั้น การติดตั้งระหว่างการเริ่มต้นใช้งานใช้
พฤติกรรมการเลือกอย่างชัดเจนแบบเดียวกัน เส้นทางเหล่านี้จะไม่แทนที่ `plugins.deny` หรือการตั้งค่า
ส่วนกลาง `plugins.enabled: false` ส่วนการเรียกใช้โดยตรง
`openclaw plugins install @openclaw/clickclack` จะเป็นไปตามนโยบาย
การติดตั้ง Plugin ตามปกติ และบันทึก ClickClack ลงในรายการอนุญาตที่มีอยู่ด้วย

## บอตหลายตัว

แต่ละบัญชีจะเปิดการเชื่อมต่อแบบเรียลไทม์กับ ClickClack ของตนเอง และใช้โทเค็นบอตของตนเอง

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## โหมดการตอบกลับ

- `replyMode: "agent"` (ค่าเริ่มต้น) ส่งข้อความขาเข้าผ่านไปป์ไลน์เอเจนต์ตามปกติ รวมถึงการบันทึกเซสชันและนโยบายเครื่องมือ
- `replyMode: "model"` ข้ามไปป์ไลน์เอเจนต์ และใช้ `llm.complete` ของรันไทม์ Plugin เพื่อให้บอตตอบกลับโดยตรงแบบสั้น (โดยอาจกำหนดรูปแบบด้วย `model` และ `systemPrompt`)

โหมดโมเดลจะสร้างคำตอบโดยใช้รหัสเอเจนต์ของบอตที่แปลงค่าแล้ว ซึ่งต้องเปิด
บิตความเชื่อถือ `plugins.entries.clickclack.llm.allowAgentIdOverride: true`
อย่างชัดเจน:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

ปิดบิตความเชื่อถือไว้หากคุณใช้เฉพาะโหมดตอบกลับ `agent` เริ่มต้น
เนื่องจากโหมดดังกล่าวไม่จำเป็นต้องใช้บิตนี้

ใช้โหมด `agent` สำหรับหลักฐานการเชื่อมโยงข้ามบริการ สำหรับรหัสข้อความ
ClickClack ที่เชื่อถือได้ในรูปแบบมาตรฐาน `msg_<ulid>` ช่องทางจะสร้าง
รหัสการทำงาน OpenClaw แบบกำหนดแน่นอนเป็น `clickclack:<message-id>` จากนั้นการเรียกโมเดลแต่ละครั้ง
จะแสดงในการวินิจฉัยเป็น `clickclack:<message-id>:model:<n>` และเมื่อรอบนั้น
ใช้ ClawRouter รหัสการเรียกโมเดลเดียวกันจะถูกส่งเป็น `X-Request-ID`
โหมด `model` จะข้ามการวินิจฉัยการทำงานและเซสชันตามปกติของเอเจนต์ จึง
ไม่เหมาะกับเส้นทางหลักฐานนี้

เมื่อเหตุการณ์แบบเรียลไทม์มี `payload.correlation_id` ที่ผ่านการตรวจสอบแล้ว
ช่องทางจะส่งค่านี้เป็น `X-Correlation-ID` ในการดึงข้อความที่เชื่อถือได้และ
คำขอตอบกลับ ClickClack ที่เกิดขึ้น ค่าจะใช้ชุดอักขระปลอดภัย
128 อักขระของ ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` และ `-`) ส่วนค่าที่ไม่ถูกต้อง
จะถูกละเว้น การเชื่อมโยงเหล่านี้มีเฉพาะตัวระบุเท่านั้น และจะไม่มีเนื้อหาข้อความ,
พรอมต์, คำตอบที่สร้างขึ้น, ข้อมูลประจำตัว หรือผลลัพธ์จากเครื่องมือ

## แถวกิจกรรมของเอเจนต์

ตามค่าเริ่มต้น ช่องทาง ClickClack จะไม่แสดงสิ่งใดขณะที่รอบการทำงานของเอเจนต์กำลังดำเนินอยู่ และจะแสดงเฉพาะคำตอบสุดท้าย ตั้งค่า `agentActivity: true` ในบัญชีเพื่อเผยแพร่แถวข้อความ `agent_commentary` และ `agent_tool` แบบถาวรขณะที่รอบการทำงานกำลังดำเนินอยู่:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

ข้อกำหนดและพฤติกรรม:

- **ปิดเป็นค่าเริ่มต้น** การตั้งค่ามาตรฐานและเซิร์ฟเวอร์ ClickClack รุ่นเก่าจะไม่ได้รับผลกระทบ
- **ต้องใช้ขอบเขตโทเค็น `agent_activity:write`** ขอบเขตนี้แยกจาก `bot:write` และจะไม่ได้รับสืบทอดจากขอบเขตดังกล่าว ให้สร้างโทเค็นบอตด้วย `--scopes bot:write,agent_activity:write` (หรือมอบขอบเขตนี้ให้โทเค็นที่มีอยู่) ก่อนเปิดใช้งานตัวเลือก
- **ลดระดับการทำงานเท่าที่ทำได้** หากโทเค็นไม่มี `agent_activity:write` หรือเซิร์ฟเวอร์ปฏิเสธการเขียนกิจกรรม ระบบจะบันทึกความล้มเหลวลงในบันทึกและยังคงส่งคำตอบสุดท้ายได้ตามปกติ โดยจะไม่มีแถวกิจกรรมปรากฏขึ้น
- แถวจะถูกจัดกลุ่มตามแต่ละรอบ (`turn_id`) และรวมกันเพื่อให้หนึ่งขั้นตอนเชิงตรรกะเป็นหนึ่งแถว โดยแถวเครื่องมือจะใช้รูปแบบความคืบหน้าเดียวกับ Discord/Slack/Telegram (ชื่อเครื่องมือพร้อมรายละเอียดคำสั่ง)
- **ข้อมูลเมตาการระบุที่มา** โพสต์ที่เอเจนต์สร้างขึ้น (แถวกิจกรรมและคำตอบสุดท้าย) จะมีฟิลด์ `author_model` และ `author_thinking` ซึ่งแปลงค่าจากโมเดลที่ใช้จริงในรอบนั้น (รวมถึงหลังจากใช้ตัวเลือกสำรอง) เซิร์ฟเวอร์ที่ไม่ได้กำหนดคอลัมน์เหล่านี้จะเพิกเฉยต่อฟิลด์ JSON ที่ไม่รู้จัก ส่วนเซิร์ฟเวอร์ที่จัดเก็บฟิลด์เหล่านี้จะสามารถตอบได้ว่า "โมเดลใดกล่าวข้อความบรรทัดนี้ และใช้ระดับการคิดใด" สำหรับแต่ละข้อความ

## เป้าหมาย

- `channel:<name-or-id>` ส่งไปยังช่องทางในเวิร์กสเปซ เป้าหมายที่ไม่มีคำนำหน้าจะใช้ `channel:` เป็นค่าเริ่มต้น
- `dm:<user_id>` สร้างหรือใช้การสนทนาโดยตรงกับผู้ใช้รายนั้นซ้ำ
- `thread:<message_id>` ตอบกลับในเธรดที่มีข้อความนั้นเป็นจุดเริ่มต้น

เป้าหมายขาออกที่ระบุอย่างชัดเจนสามารถมีคำนำหน้าผู้ให้บริการ `clickclack:` หรือ `cc:` ได้ด้วย

ตัวอย่าง:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## สิทธิ์

ขอบเขตโทเค็น ClickClack ถูกบังคับใช้โดย API ของ ClickClack

- `bot:read`: อ่านข้อมูลเวิร์กสเปซ/ช่องทาง/ข้อความ/เธรด/DM/เรียลไทม์/โปรไฟล์
- `bot:write`: ความสามารถของ `bot:read` รวมถึงข้อความในช่องทาง การตอบกลับในเธรด DM และการอัปโหลด
- `bot:admin`: ความสามารถของ `bot:write` รวมถึงการสร้างช่องทาง
- `agent_activity:write`: แถวกิจกรรมเอเจนต์แบบถาวร (`agent_commentary` / `agent_tool`) จะไม่ได้รับสืบทอดจาก `bot:write` หรือ `bot:admin` และจำเป็นเฉพาะเมื่อตั้งค่า `agentActivity: true`

OpenClaw ต้องใช้เพียง `bot:write` สำหรับการสนทนาปกติของเอเจนต์ เพิ่ม `agent_activity:write` เมื่อเปิดใช้งาน [แถวกิจกรรมของเอเจนต์](#agent-activity-rows)

## การแก้ไขปัญหา

- `ClickClack is not configured for account "<id>"`: ตั้งค่า `baseUrl`, `token` (เช่น ผ่าน `CLICKCLACK_BOT_TOKEN`) และ `workspace` สำหรับบัญชีนั้น
- `ClickClack workspace not found: <value>`: ตั้งค่า `workspace` เป็นรหัสเวิร์กสเปซ, slug หรือชื่อที่ ClickClack ส่งคืน
- ไม่มีการตอบกลับขาเข้า: ยืนยันว่าโทเค็นมีสิทธิ์อ่านแบบเรียลไทม์ และโปรดทราบว่าบอตจะเพิกเฉยต่อข้อความของตนเองและข้อความจากบอตอื่น
- การส่งข้อความไปยังช่องทางล้มเหลว: ตรวจสอบว่าบอตเป็นสมาชิกของเวิร์กสเปซและมี `bot:write`
