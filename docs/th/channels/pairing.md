---
read_when:
    - การตั้งค่าการควบคุมการเข้าถึง DM
    - การจับคู่ Node iOS/Android ใหม่
    - การตรวจสอบสถานะความปลอดภัยของ OpenClaw
summary: 'ภาพรวม Pairing: อนุมัติว่าใครสามารถส่ง DM ถึงคุณได้บ้าง + Node ใดสามารถเข้าร่วมได้บ้าง'
title: Pairing
x-i18n:
    generated_at: "2026-04-25T13:41:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f11c992f7cbde12f8c6963279dbaea420941e2fc088179d3fd259e4aa007e34
    source_path: channels/pairing.md
    workflow: 15
---

“Pairing” คือขั้นตอน **การอนุมัติโดยเจ้าของ** อย่างชัดเจนของ OpenClaw
ซึ่งใช้ใน 2 กรณี:

1. **DM Pairing** (ใครบ้างที่ได้รับอนุญาตให้คุยกับบอต)
2. **Node Pairing** (อุปกรณ์/Node ใดบ้างที่ได้รับอนุญาตให้เข้าร่วมเครือข่าย Gateway)

บริบทด้านความปลอดภัย: [Security](/th/gateway/security)

## 1) DM Pairing (การเข้าถึงแชตขาเข้า)

เมื่อกำหนดค่าช่องทางด้วยนโยบาย DM เป็น `pairing` ผู้ส่งที่ไม่รู้จักจะได้รับรหัสสั้น ๆ และข้อความของพวกเขา **จะยังไม่ถูกประมวลผล** จนกว่าคุณจะอนุมัติ

นโยบาย DM เริ่มต้นมีเอกสารอธิบายไว้ที่: [Security](/th/gateway/security)

รหัส Pairing:

- 8 อักขระ ตัวพิมพ์ใหญ่ ไม่มีอักขระที่สับสนง่าย (`0O1I`)
- **หมดอายุภายใน 1 ชั่วโมง** บอตจะส่งข้อความ pairing เฉพาะเมื่อมีการสร้างคำขอใหม่เท่านั้น (ประมาณหนึ่งครั้งต่อชั่วโมงต่อผู้ส่งหนึ่งราย)
- คำขอ DM Pairing ที่รอดำเนินการถูกจำกัดไว้ที่ **3 รายการต่อช่องทาง** โดยค่าเริ่มต้น คำขอเพิ่มเติมจะถูกละเว้นจนกว่าจะมีรายการใดรายการหนึ่งหมดอายุหรือได้รับอนุมัติ

### อนุมัติผู้ส่ง

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

ช่องทางที่รองรับ: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`

### ตำแหน่งที่จัดเก็บสถานะ

จัดเก็บไว้ภายใต้ `~/.openclaw/credentials/`:

- คำขอที่รอดำเนินการ: `<channel>-pairing.json`
- ที่เก็บ allowlist ที่ได้รับอนุมัติ:
  - บัญชีเริ่มต้น: `<channel>-allowFrom.json`
  - บัญชีที่ไม่ใช่ค่าเริ่มต้น: `<channel>-<accountId>-allowFrom.json`

พฤติกรรมการกำหนดขอบเขตตามบัญชี:

- บัญชีที่ไม่ใช่ค่าเริ่มต้นจะอ่าน/เขียนเฉพาะไฟล์ allowlist ที่อยู่ในขอบเขตของตัวเอง
- บัญชีเริ่มต้นจะใช้ไฟล์ allowlist ระดับช่องทางที่ไม่มีการกำหนดขอบเขตบัญชี

ให้ถือว่าสิ่งเหล่านี้เป็นข้อมูลสำคัญ (เพราะใช้ควบคุมการเข้าถึงผู้ช่วยของคุณ)

ข้อสำคัญ: ที่เก็บนี้ใช้สำหรับการเข้าถึง DM การอนุญาตกลุ่มเป็นอีกเรื่องหนึ่ง
การอนุมัติรหัส DM Pairing ไม่ได้ทำให้ผู้ส่งคนนั้นสามารถเรียกใช้คำสั่งกลุ่มหรือควบคุมบอตในกลุ่มได้โดยอัตโนมัติ สำหรับการเข้าถึงกลุ่ม ให้กำหนดค่า group allowlist แบบชัดเจนของช่องทางนั้น (เช่น `groupAllowFrom`, `groups` หรือการแทนที่ต่อกลุ่ม/ต่อหัวข้อ ขึ้นอยู่กับช่องทาง)

## 2) Node device pairing (Node แบบ iOS/Android/macOS/headless)

Node เชื่อมต่อกับ Gateway ในฐานะ **อุปกรณ์** โดยมี `role: node` และ Gateway
จะสร้างคำขอจับคู่อุปกรณ์ที่ต้องได้รับการอนุมัติก่อน

### จับคู่ผ่าน Telegram (แนะนำสำหรับ iOS)

หากคุณใช้ Plugin `device-pair` คุณสามารถทำการจับคู่อุปกรณ์ครั้งแรกทั้งหมดผ่าน Telegram ได้:

1. ใน Telegram ส่งข้อความถึงบอตของคุณ: `/pair`
2. บอตจะตอบกลับด้วย 2 ข้อความ: ข้อความคำแนะนำ และข้อความ **setup code** แยกต่างหาก (คัดลอก/วางใน Telegram ได้สะดวก)
3. บนโทรศัพท์ของคุณ เปิดแอป OpenClaw iOS → Settings → Gateway
4. วาง setup code แล้วเชื่อมต่อ
5. กลับไปที่ Telegram: `/pair pending` (ตรวจสอบ request ID, role และ scope) แล้วจึงอนุมัติ

setup code คือ payload JSON ที่เข้ารหัสแบบ base64 ซึ่งมีข้อมูลดังนี้:

- `url`: URL WebSocket ของ Gateway (`ws://...` หรือ `wss://...`)
- `bootstrapToken`: bootstrap token แบบใช้กับอุปกรณ์เดียวและมีอายุสั้น ซึ่งใช้สำหรับ handshake การจับคู่ครั้งแรก

bootstrap token นั้นมีโปรไฟล์ bootstrap สำหรับ pairing ที่มีอยู่ในตัวดังนี้:

- token แบบ handed-off หลักของ `node` จะยังคงเป็น `scopes: []`
- token แบบ handed-off ของ `operator` จะยังคงถูกจำกัดอยู่ใน bootstrap allowlist:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- การตรวจสอบ scope ของ bootstrap ใช้คำนำหน้าตาม role ไม่ใช่ pool scope แบบแบนเดียว:
  รายการ scope ของ operator จะตอบสนองได้เฉพาะคำขอของ operator เท่านั้น และ role ที่ไม่ใช่ operator
  ยังคงต้องขอ scope ภายใต้คำนำหน้าของ role ของตัวเอง

ให้ปฏิบัติต่อ setup code เสมือนรหัสผ่านตราบใดที่ยังใช้งานได้

### อนุมัติอุปกรณ์ Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

หากอุปกรณ์เดิมลองใหม่ด้วยรายละเอียดการยืนยันตัวตนที่ต่างออกไป (เช่น
role/scope/public key ต่างกัน) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะมีการสร้าง
`requestId` ใหม่

ข้อสำคัญ: อุปกรณ์ที่จับคู่แล้วจะไม่ได้รับสิทธิ์ที่กว้างขึ้นแบบเงียบ ๆ หากอุปกรณ์นั้น
เชื่อมต่อใหม่โดยขอ scope เพิ่มเติมหรือ role ที่กว้างกว่า OpenClaw จะคงการอนุมัติเดิมไว้ตามเดิม และสร้างคำขออัปเกรดใหม่ที่รอดำเนินการ ใช้
`openclaw devices list` เพื่อเปรียบเทียบสิทธิ์ที่ได้รับอนุมัติอยู่ในปัจจุบันกับสิทธิ์ที่ร้องขอใหม่ ก่อนที่คุณจะอนุมัติ

### การอนุมัติอัตโนมัติสำหรับ Node จาก CIDR ที่เชื่อถือได้แบบเลือกเปิด

โดยค่าเริ่มต้น การจับคู่อุปกรณ์ยังคงต้องทำด้วยตนเอง สำหรับเครือข่าย Node ที่ควบคุมอย่างเข้มงวด
คุณสามารถเลือกเปิดการอนุมัติอัตโนมัติสำหรับ Node ครั้งแรกด้วย CIDR หรือ IP แบบเจาะจงได้:

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

สิ่งนี้ใช้ได้เฉพาะกับคำขอจับคู่ `role: node` ใหม่ที่ไม่มี scope ที่ร้องขอ
ไคลเอนต์ Operator, เบราว์เซอร์, Control UI และ WebChat ยังคงต้องได้รับการอนุมัติด้วยตนเอง การเปลี่ยนแปลง role, scope, metadata และ public key ยังคงต้องได้รับการอนุมัติด้วยตนเอง

### ที่เก็บสถานะ Node Pairing

จัดเก็บไว้ภายใต้ `~/.openclaw/devices/`:

- `pending.json` (อายุสั้น; คำขอที่รอดำเนินการจะหมดอายุ)
- `paired.json` (อุปกรณ์ที่จับคู่แล้ว + token)

### หมายเหตุ

- API แบบเดิม `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) เป็น
  ที่เก็บ pairing แยกต่างหากที่ Gateway เป็นเจ้าของ Node แบบ WS ยังคงต้องใช้ device pairing
- ระเบียน pairing คือแหล่งข้อมูลจริงแบบถาวรสำหรับ role ที่ได้รับอนุมัติ
  token ของอุปกรณ์ที่ยังใช้งานอยู่จะยังคงถูกจำกัดตามชุด role ที่ได้รับอนุมัตินั้น รายการ token ที่หลุดมาอยู่นอก role ที่ได้รับอนุมัติจะไม่ก่อให้เกิดการเข้าถึงใหม่

## เอกสารที่เกี่ยวข้อง

- โมเดลความปลอดภัย + prompt injection: [Security](/th/gateway/security)
- การอัปเดตอย่างปลอดภัย (เรียกใช้ doctor): [Updating](/th/install/updating)
- การกำหนดค่าช่องทาง:
  - Telegram: [Telegram](/th/channels/telegram)
  - WhatsApp: [WhatsApp](/th/channels/whatsapp)
  - Signal: [Signal](/th/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/th/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/th/channels/imessage)
  - Discord: [Discord](/th/channels/discord)
  - Slack: [Slack](/th/channels/slack)
