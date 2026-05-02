---
read_when:
    - การตั้งค่าการควบคุมการเข้าถึงข้อความส่วนตัว
    - การจับคู่ Node iOS/Android ใหม่
    - การตรวจสอบสถานะด้านความปลอดภัยของ OpenClaw
summary: 'ภาพรวมการจับคู่: อนุมัติว่าใครสามารถส่งข้อความส่วนตัวถึงคุณได้ + Node ใดบ้างสามารถเข้าร่วมได้'
title: การจับคู่
x-i18n:
    generated_at: "2026-05-02T10:08:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb68d87c0e1dfe7c9a6a6d9415f4c63625755fb43a2e22a1d1374ff0a63e49c4
    source_path: channels/pairing.md
    workflow: 16
---

“การจับคู่” คือขั้นตอนการอนุมัติการเข้าถึงอย่างชัดเจนของ OpenClaw
ใช้ในสองตำแหน่ง:

1. **การจับคู่ DM** (ใครได้รับอนุญาตให้คุยกับบอท)
2. **การจับคู่ Node** (อุปกรณ์/โหนดใดได้รับอนุญาตให้เข้าร่วมเครือข่าย Gateway)

บริบทความปลอดภัย: [ความปลอดภัย](/th/gateway/security)

## 1) การจับคู่ DM (การเข้าถึงแชทขาเข้า)

เมื่อช่องทางถูกกำหนดค่าด้วยนโยบาย DM `pairing` ผู้ส่งที่ไม่รู้จักจะได้รับรหัสสั้น และข้อความของพวกเขาจะ **ไม่ถูกประมวลผล** จนกว่าคุณจะอนุมัติ

นโยบาย DM เริ่มต้นมีเอกสารอยู่ที่: [ความปลอดภัย](/th/gateway/security)

`dmPolicy: "open"` จะเป็นสาธารณะก็ต่อเมื่อ allowlist ของ DM ที่มีผลรวม `"*"` อยู่ด้วย
การตั้งค่าและการตรวจสอบความถูกต้องต้องใช้ wildcard นั้นสำหรับ config แบบเปิดสาธารณะ หากสถานะที่มีอยู่มี `open` พร้อมรายการ `allowFrom` ที่เป็นรูปธรรม runtime จะยังคงยอมรับเฉพาะผู้ส่งเหล่านั้นเท่านั้น และการอนุมัติใน pairing-store จะไม่ขยายการเข้าถึงแบบ `open`

รหัสจับคู่:

- 8 อักขระ ตัวพิมพ์ใหญ่ ไม่มีอักขระที่สับสนง่าย (`0O1I`)
- **หมดอายุหลัง 1 ชั่วโมง** บอทจะส่งข้อความจับคู่เฉพาะเมื่อมีการสร้างคำขอใหม่เท่านั้น (ประมาณหนึ่งครั้งต่อชั่วโมงต่อผู้ส่ง)
- คำขอจับคู่ DM ที่รอดำเนินการถูกจำกัดไว้ที่ **3 รายการต่อช่องทาง** โดยค่าเริ่มต้น คำขอเพิ่มเติมจะถูกละเว้นจนกว่ารายการหนึ่งจะหมดอายุหรือได้รับอนุมัติ

### อนุมัติผู้ส่ง

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

หากยังไม่ได้กำหนดเจ้าของคำสั่ง การอนุมัติรหัสจับคู่ DM จะเริ่มต้น `commands.ownerAllowFrom` ให้เป็นผู้ส่งที่ได้รับอนุมัติด้วย เช่น `telegram:123456789`
สิ่งนี้ทำให้การตั้งค่าครั้งแรกมีเจ้าของที่ชัดเจนสำหรับคำสั่งที่มีสิทธิ์สูงและพรอมป์อนุมัติ exec หลังจากมีเจ้าของแล้ว การอนุมัติการจับคู่ภายหลังจะให้เฉพาะการเข้าถึง DM เท่านั้น และจะไม่เพิ่มเจ้าของเพิ่มเติม

ช่องทางที่รองรับ: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`

### กลุ่มผู้ส่งที่ใช้ซ้ำได้

ใช้ `accessGroups` ระดับบนสุดเมื่อชุดผู้ส่งที่เชื่อถือได้ชุดเดียวกันควรใช้กับหลายช่องทางข้อความ หรือใช้กับทั้ง allowlist ของ DM และกลุ่ม

กลุ่มแบบคงที่ใช้ `type: "message.senders"` และอ้างอิงด้วย `accessGroup:<name>` จาก allowlist ของช่องทาง:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

กลุ่มการเข้าถึงมีเอกสารอย่างละเอียดที่นี่: [กลุ่มการเข้าถึง](/th/channels/access-groups)

### ตำแหน่งที่เก็บสถานะ

จัดเก็บภายใต้ `~/.openclaw/credentials/`:

- คำขอที่รอดำเนินการ: `<channel>-pairing.json`
- ที่เก็บ allowlist ที่ได้รับอนุมัติ:
  - บัญชีเริ่มต้น: `<channel>-allowFrom.json`
  - บัญชีที่ไม่ใช่ค่าเริ่มต้น: `<channel>-<accountId>-allowFrom.json`

พฤติกรรมการกำหนดขอบเขตบัญชี:

- บัญชีที่ไม่ใช่ค่าเริ่มต้นจะอ่าน/เขียนเฉพาะไฟล์ allowlist ตามขอบเขตของตน
- บัญชีเริ่มต้นใช้ไฟล์ allowlist แบบไม่มีขอบเขตที่อิงตามช่องทาง

ปฏิบัติกับไฟล์เหล่านี้เป็นข้อมูลอ่อนไหว (ไฟล์เหล่านี้ควบคุมการเข้าถึงผู้ช่วยของคุณ)

<Note>
ที่เก็บ allowlist สำหรับการจับคู่ใช้สำหรับการเข้าถึง DM การอนุญาตของกลุ่มแยกต่างหาก
การอนุมัติรหัสจับคู่ DM จะไม่อนุญาตให้ผู้ส่งนั้นรันคำสั่งกลุ่มหรือควบคุมบอทในกลุ่มโดยอัตโนมัติ การเริ่มต้นเจ้าของคนแรกเป็นสถานะ config แยกต่างหากใน `commands.ownerAllowFrom` และการส่งข้อความในแชทกลุ่มยังคงเป็นไปตาม allowlist ของกลุ่มในช่องทางนั้น (เช่น `groupAllowFrom`, `groups` หรือการ override ต่อกลุ่มหรือต่อหัวข้อ ขึ้นอยู่กับช่องทาง)
</Note>

## 2) การจับคู่อุปกรณ์ Node (โหนด iOS/Android/macOS/headless)

Node เชื่อมต่อกับ Gateway เป็น **อุปกรณ์** ด้วย `role: node` Gateway จะสร้างคำขอจับคู่อุปกรณ์ที่ต้องได้รับการอนุมัติ

### จับคู่ผ่าน Telegram (แนะนำสำหรับ iOS)

หากคุณใช้ Plugin `device-pair` คุณสามารถจับคู่อุปกรณ์ครั้งแรกทั้งหมดจาก Telegram ได้:

1. ใน Telegram ส่งข้อความถึงบอทของคุณ: `/pair`
2. บอทจะตอบกลับด้วยสองข้อความ: ข้อความคำแนะนำและข้อความ **รหัสตั้งค่า** แยกต่างหาก (คัดลอก/วางใน Telegram ได้ง่าย)
3. บนโทรศัพท์ของคุณ เปิดแอป OpenClaw iOS → Settings → Gateway
4. วางรหัสตั้งค่าและเชื่อมต่อ
5. กลับไปที่ Telegram: `/pair pending` (ตรวจสอบ ID คำขอ บทบาท และ scopes) จากนั้นอนุมัติ

รหัสตั้งค่าเป็น payload JSON ที่เข้ารหัสแบบ base64 ซึ่งมี:

- `url`: URL WebSocket ของ Gateway (`ws://...` หรือ `wss://...`)
- `bootstrapToken`: token bootstrap แบบอุปกรณ์เดียวที่มีอายุสั้น ใช้สำหรับ handshake การจับคู่ครั้งแรก

token bootstrap นั้นมีโปรไฟล์ bootstrap สำหรับการจับคู่ในตัว:

- token `node` หลักที่ส่งต่อยังคงเป็น `scopes: []`
- token `operator` ใดๆ ที่ส่งต่อยังคงถูกจำกัดไว้ที่ allowlist ของ bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- การตรวจ scope ของ bootstrap มี prefix ตามบทบาท ไม่ใช่ pool ของ scope แบบแบนเดียว:
  รายการ scope ของ operator จะตอบสนองเฉพาะคำขอของ operator เท่านั้น และบทบาทที่ไม่ใช่ operator ยังต้องขอ scopes ภายใต้ prefix บทบาทของตนเอง
- การหมุนเวียน/เพิกถอน token ภายหลังยังคงถูกจำกัดโดยทั้งสัญญาบทบาทที่อุปกรณ์ได้รับอนุมัติและ scopes ของ operator ใน session ผู้เรียก

ปฏิบัติกับรหัสตั้งค่าเหมือนรหัสผ่านขณะที่ยังมีผลอยู่

### อนุมัติอุปกรณ์ Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

หากอุปกรณ์เดิมลองใหม่ด้วยรายละเอียด auth ที่แตกต่างกัน (เช่น role/scopes/public key ที่ต่างกัน) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะสร้าง `requestId` ใหม่

<Note>
อุปกรณ์ที่จับคู่แล้วจะไม่ได้รับการเข้าถึงที่กว้างขึ้นแบบเงียบๆ หากเชื่อมต่อใหม่โดยขอ scopes เพิ่มหรือบทบาทที่กว้างขึ้น OpenClaw จะคงการอนุมัติที่มีอยู่ไว้ตามเดิม และสร้างคำขออัปเกรดที่รอดำเนินการใหม่ ใช้ `openclaw devices list` เพื่อเปรียบเทียบการเข้าถึงที่อนุมัติอยู่ในปัจจุบันกับการเข้าถึงที่ขอใหม่ก่อนที่คุณจะอนุมัติ
</Note>

### การอนุมัติ Node อัตโนมัติด้วย trusted-CIDR แบบเลือกใช้ได้

การจับคู่อุปกรณ์ยังคงเป็นแบบ manual โดยค่าเริ่มต้น สำหรับเครือข่าย Node ที่ควบคุมอย่างเข้มงวด คุณสามารถเลือกใช้การอนุมัติ Node ครั้งแรกอัตโนมัติด้วย CIDR ที่ระบุชัดเจนหรือ IP แบบตรงตัวได้:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

สิ่งนี้ใช้เฉพาะกับคำขอจับคู่ `role: node` ใหม่ที่ไม่มี scopes ที่ร้องขอ
client แบบ operator, browser, UI ควบคุม และ WebChat ยังคงต้องได้รับการอนุมัติแบบ manual
การเปลี่ยนแปลงบทบาท scope metadata และ public-key ยังคงต้องได้รับการอนุมัติแบบ manual

### การจัดเก็บสถานะการจับคู่ Node

จัดเก็บภายใต้ `~/.openclaw/devices/`:

- `pending.json` (อายุสั้น คำขอที่รอดำเนินการจะหมดอายุ)
- `paired.json` (อุปกรณ์ที่จับคู่แล้ว + tokens)

### หมายเหตุ

- API `node.pair.*` แบบ legacy (CLI: `openclaw nodes pending|approve|reject|remove|rename`) เป็นที่เก็บการจับคู่แยกต่างหากที่ Gateway เป็นเจ้าของ Node แบบ WS ยังคงต้องใช้การจับคู่อุปกรณ์
- ระเบียนการจับคู่คือแหล่งความจริงถาวรสำหรับบทบาทที่ได้รับอนุมัติ token อุปกรณ์ที่ใช้งานอยู่ยังคงถูกจำกัดไว้ตามชุดบทบาทที่ได้รับอนุมัตินั้น รายการ token ที่หลุดอยู่นอกบทบาทที่ได้รับอนุมัติจะไม่สร้างการเข้าถึงใหม่

## เอกสารที่เกี่ยวข้อง

- โมเดลความปลอดภัย + prompt injection: [ความปลอดภัย](/th/gateway/security)
- การอัปเดตอย่างปลอดภัย (รัน doctor): [การอัปเดต](/th/install/updating)
- config ช่องทาง:
  - Telegram: [Telegram](/th/channels/telegram)
  - WhatsApp: [WhatsApp](/th/channels/whatsapp)
  - Signal: [Signal](/th/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/th/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/th/channels/imessage)
  - Discord: [Discord](/th/channels/discord)
  - Slack: [Slack](/th/channels/slack)
