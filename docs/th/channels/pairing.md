---
read_when:
    - การตั้งค่าการควบคุมการเข้าถึง DM
    - การจับคู่ Node iOS/Android ใหม่
    - การตรวจสอบสถานะด้านความปลอดภัยของ OpenClaw
summary: 'ภาพรวมการจับคู่: อนุมัติว่าใครสามารถส่งข้อความส่วนตัวถึงคุณได้ + Node ใดสามารถเข้าร่วมได้'
title: การจับคู่
x-i18n:
    generated_at: "2026-05-07T01:50:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e1b9082342209b7d37a790ecc61330f74131b070d0560cb71fb533379d9016a
    source_path: channels/pairing.md
    workflow: 16
---

"การจับคู่" คือขั้นตอนอนุมัติการเข้าถึงอย่างชัดเจนของ OpenClaw
ใช้ในสองที่:

1. **การจับคู่ DM** (ใครได้รับอนุญาตให้คุยกับบอต)
2. **การจับคู่ Node** (อุปกรณ์/โหนดใดได้รับอนุญาตให้เข้าร่วมเครือข่าย Gateway)

บริบทด้านความปลอดภัย: [ความปลอดภัย](/th/gateway/security)

## 1) การจับคู่ DM (การเข้าถึงแชทขาเข้า)

เมื่อ channel ถูกตั้งค่าด้วยนโยบาย DM `pairing` ผู้ส่งที่ไม่รู้จักจะได้รับรหัสสั้น และข้อความของพวกเขาจะ **ไม่ถูกประมวลผล** จนกว่าคุณจะอนุมัติ

นโยบาย DM เริ่มต้นมีเอกสารที่: [ความปลอดภัย](/th/gateway/security)

`dmPolicy: "open"` จะเป็นสาธารณะก็ต่อเมื่อ allowlist DM ที่มีผลรวม `"*"` อยู่ด้วย
การตั้งค่าและการตรวจสอบความถูกต้องต้องใช้ wildcard นี้สำหรับคอนฟิก public-open หากสถานะเดิม
มี `open` พร้อมรายการ `allowFrom` แบบเจาะจง runtime จะยังคงรับเฉพาะผู้ส่งเหล่านั้น
และการอนุมัติใน pairing-store จะไม่ขยายการเข้าถึงแบบ `open`

รหัสจับคู่:

- 8 อักขระ ตัวพิมพ์ใหญ่ ไม่มีอักขระที่สับสนง่าย (`0O1I`)
- **หมดอายุหลัง 1 ชั่วโมง** บอตจะส่งข้อความจับคู่เฉพาะเมื่อมีการสร้างคำขอใหม่ (ประมาณหนึ่งครั้งต่อชั่วโมงต่อผู้ส่งหนึ่งราย)
- คำขอจับคู่ DM ที่รอดำเนินการถูกจำกัดที่ **3 รายการต่อ channel** โดยค่าเริ่มต้น คำขอเพิ่มเติมจะถูกเพิกเฉยจนกว่ารายการหนึ่งจะหมดอายุหรือได้รับการอนุมัติ

### อนุมัติผู้ส่ง

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

หากยังไม่ได้ตั้งค่าเจ้าของคำสั่ง การอนุมัติรหัสจับคู่ DM จะ bootstrap
`commands.ownerAllowFrom` ไปยังผู้ส่งที่ได้รับอนุมัติด้วย เช่น `telegram:123456789`
สิ่งนี้ทำให้การตั้งค่าครั้งแรกมีเจ้าของอย่างชัดเจนสำหรับคำสั่งที่มีสิทธิ์สูงและพรอมป์อนุมัติ
exec หลังจากมีเจ้าของแล้ว การอนุมัติการจับคู่ภายหลังจะให้เฉพาะการเข้าถึง DM
เท่านั้น และจะไม่เพิ่มเจ้าของเพิ่มเติม

channel ที่รองรับ: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`

### กลุ่มผู้ส่งที่ใช้ซ้ำได้

ใช้ `accessGroups` ระดับบนสุดเมื่อชุดผู้ส่งที่เชื่อถือได้ชุดเดียวกันควรใช้กับ
message channel หลายรายการ หรือใช้กับทั้ง allowlist ของ DM และกลุ่ม

กลุ่มแบบคงที่ใช้ `type: "message.senders"` และถูกอ้างอิงด้วย
`accessGroup:<name>` จาก allowlist ของ channel:

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

Access groups มีเอกสารโดยละเอียดที่นี่: [กลุ่มการเข้าถึง](/th/channels/access-groups)

### ตำแหน่งที่เก็บสถานะ

จัดเก็บไว้ใต้ `~/.openclaw/credentials/`:

- คำขอที่รอดำเนินการ: `<channel>-pairing.json`
- ที่เก็บ allowlist ที่อนุมัติแล้ว:
  - บัญชีเริ่มต้น: `<channel>-allowFrom.json`
  - บัญชีที่ไม่ใช่ค่าเริ่มต้น: `<channel>-<accountId>-allowFrom.json`

พฤติกรรมการกำหนดขอบเขตบัญชี:

- บัญชีที่ไม่ใช่ค่าเริ่มต้นจะอ่าน/เขียนเฉพาะไฟล์ allowlist ที่มีขอบเขตของตน
- บัญชีเริ่มต้นใช้ไฟล์ allowlist แบบไม่มีขอบเขตตาม channel

ปฏิบัติกับไฟล์เหล่านี้เป็นข้อมูลละเอียดอ่อน (ไฟล์เหล่านี้ควบคุมการเข้าถึง assistant ของคุณ)

<Note>
ที่เก็บ allowlist สำหรับการจับคู่มีไว้สำหรับการเข้าถึง DM การอนุญาตของกลุ่มแยกต่างหาก
การอนุมัติรหัสจับคู่ DM ไม่ได้อนุญาตให้ผู้ส่งรายนั้นเรียกใช้คำสั่งในกลุ่ม
หรือควบคุมบอตในกลุ่มโดยอัตโนมัติ การ bootstrap เจ้าของคนแรกเป็นสถานะคอนฟิกแยกต่างหาก
ใน `commands.ownerAllowFrom` และการส่งข้อความในแชทกลุ่มยังคงเป็นไปตาม
allowlist ของกลุ่มใน channel (เช่น `groupAllowFrom`, `groups` หรือการ override
รายกลุ่มหรือรายหัวข้อ ขึ้นอยู่กับ channel)
</Note>

## 2) การจับคู่อุปกรณ์ Node (iOS/Android/macOS/Node แบบ headless)

Node เชื่อมต่อกับ Gateway ในฐานะ **อุปกรณ์** ที่มี `role: node` Gateway
จะสร้างคำขอจับคู่อุปกรณ์ที่ต้องได้รับการอนุมัติ

### จับคู่ผ่าน Telegram (แนะนำสำหรับ iOS)

หากคุณใช้ Plugin `device-pair` คุณสามารถจับคู่อุปกรณ์ครั้งแรกทั้งหมดจาก Telegram ได้:

1. ใน Telegram ให้ส่งข้อความถึงบอตของคุณ: `/pair`
2. บอตตอบกลับด้วยสองข้อความ: ข้อความคำแนะนำและข้อความ **setup code** แยกต่างหาก (คัดลอก/วางใน Telegram ได้ง่าย)
3. บนโทรศัพท์ของคุณ เปิดแอป OpenClaw iOS → Settings → Gateway
4. สแกนรหัส QR หรือวาง setup code แล้วเชื่อมต่อ
5. กลับไปที่ Telegram: `/pair pending` (ตรวจสอบ ID คำขอ role และ scopes) จากนั้นอนุมัติ

setup code คือ payload JSON ที่เข้ารหัสแบบ base64 ซึ่งมี:

- `url`: URL WebSocket ของ Gateway (`ws://...` หรือ `wss://...`)
- `bootstrapToken`: bootstrap token อายุสั้นสำหรับอุปกรณ์เดียวที่ใช้สำหรับ handshake การจับคู่เริ่มต้น

bootstrap token นั้นมีโปรไฟล์ bootstrap การจับคู่ในตัว:

- token `node` หลักที่ส่งมอบยังคงเป็น `scopes: []`
- token `operator` ใด ๆ ที่ส่งมอบยังคงถูกจำกัดอยู่ใน bootstrap allowlist:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- การตรวจสอบ bootstrap scope มี prefix ตาม role ไม่ใช่ pool scope แบบแบนชุดเดียว:
  รายการ operator scope จะตอบสนองเฉพาะคำขอของ operator และ role ที่ไม่ใช่ operator
  ยังต้องขอ scope ใต้ prefix role ของตนเอง
- การหมุนเวียน/เพิกถอน token ในภายหลังยังคงถูกจำกัดโดยทั้งสัญญา role ที่อุปกรณ์ได้รับอนุมัติ
  และ operator scopes ของ session ผู้เรียก

ปฏิบัติกับ setup code เหมือนรหัสผ่านขณะที่ยังใช้ได้

สำหรับ Tailscale, สาธารณะ หรือการจับคู่อุปกรณ์มือถือระยะไกลอื่น ๆ ให้ใช้ Tailscale Serve/Funnel
หรือ URL Gateway `wss://` อื่น setup code แบบข้อความล้วน `ws://` จะถูกยอมรับเฉพาะ
สำหรับ loopback, ที่อยู่ LAN ส่วนตัว, โฮสต์ Bonjour `.local` และโฮสต์ Android
emulator เท่านั้น ที่อยู่ Tailnet CGNAT, ชื่อ `.ts.net` และโฮสต์สาธารณะจะยังคง
fail closed ก่อนออก QR/setup-code

### อนุมัติอุปกรณ์ Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

เมื่อการอนุมัติอย่างชัดเจนถูกปฏิเสธเพราะ session อุปกรณ์ที่จับคู่ซึ่งอนุมัติ
ถูกเปิดด้วย scope เฉพาะการจับคู่ CLI จะลองคำขอเดิมอีกครั้งด้วย
`operator.admin` สิ่งนี้ช่วยให้อุปกรณ์ที่จับคู่แล้วซึ่งมีความสามารถระดับ admin กู้คืนการจับคู่
Control UI/browser ใหม่ได้โดยไม่ต้องแก้ไข `devices/paired.json` ด้วยมือ
Gateway ยังตรวจสอบความถูกต้องของการเชื่อมต่อที่ลองใหม่ token ที่ไม่สามารถยืนยันตัวตน
ด้วย `operator.admin` จะยังคงถูกบล็อก

หากอุปกรณ์เดียวกันลองใหม่ด้วยรายละเอียดการยืนยันตัวตนที่ต่างออกไป (เช่น
role/scopes/public key ต่างกัน) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่และจะสร้าง
`requestId` ใหม่

<Note>
อุปกรณ์ที่จับคู่แล้วจะไม่ได้รับการเข้าถึงที่กว้างขึ้นอย่างเงียบ ๆ หากเชื่อมต่อใหม่และขอ scope เพิ่มเติมหรือ role ที่กว้างขึ้น OpenClaw จะคงการอนุมัติเดิมไว้ตามเดิม และสร้างคำขอ upgrade ใหม่ที่รอดำเนินการ ใช้ `openclaw devices list` เพื่อเปรียบเทียบการเข้าถึงที่อนุมัติอยู่ในปัจจุบันกับการเข้าถึงที่ขอใหม่ก่อนที่คุณจะอนุมัติ
</Note>

### การอนุมัติอัตโนมัติ Node trusted-CIDR แบบไม่บังคับ

การจับคู่อุปกรณ์ยังคงเป็นแบบ manual โดยค่าเริ่มต้น สำหรับเครือข่าย Node ที่ควบคุมอย่างเข้มงวด
คุณสามารถเลือกใช้การอนุมัติอัตโนมัติสำหรับ Node ครั้งแรกด้วย CIDR หรือ IP แบบเจาะจงได้:

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

สิ่งนี้ใช้กับคำขอจับคู่ `role: node` ใหม่ที่ไม่มีการขอ
scopes เท่านั้น client แบบ Operator, browser, Control UI และ WebChat ยังต้องได้รับการอนุมัติ
ด้วยตนเอง การเปลี่ยนแปลง role, scope, metadata และ public-key ยังต้องได้รับการอนุมัติ
ด้วยตนเอง

### การจัดเก็บสถานะการจับคู่ Node

จัดเก็บไว้ใต้ `~/.openclaw/devices/`:

- `pending.json` (อายุสั้น; คำขอที่รอดำเนินการจะหมดอายุ)
- `paired.json` (อุปกรณ์ที่จับคู่แล้ว + token)

### หมายเหตุ

- API เดิม `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) เป็น
  ที่เก็บการจับคู่แยกต่างหากที่ Gateway เป็นเจ้าของ Node แบบ WS ยังต้องใช้การจับคู่อุปกรณ์
- ระเบียนการจับคู่คือแหล่งความจริงที่คงทนสำหรับ role ที่อนุมัติ token อุปกรณ์ที่ใช้งานอยู่
  ยังคงถูกจำกัดอยู่ในชุด role ที่อนุมัตินั้น รายการ token แปลกปลอม
  นอก role ที่อนุมัติจะไม่สร้างการเข้าถึงใหม่

## เอกสารที่เกี่ยวข้อง

- โมเดลความปลอดภัย + prompt injection: [ความปลอดภัย](/th/gateway/security)
- การอัปเดตอย่างปลอดภัย (เรียกใช้ doctor): [การอัปเดต](/th/install/updating)
- คอนฟิก channel:
  - Telegram: [Telegram](/th/channels/telegram)
  - WhatsApp: [WhatsApp](/th/channels/whatsapp)
  - Signal: [Signal](/th/channels/signal)
  - iMessage: [iMessage](/th/channels/imessage)
  - BlueBubbles (บริดจ์ iMessage เดิม): [BlueBubbles](/th/channels/bluebubbles)
  - Discord: [Discord](/th/channels/discord)
  - Slack: [Slack](/th/channels/slack)
