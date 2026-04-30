---
read_when:
    - การจับคู่หรือเชื่อมต่อ Node iOS อีกครั้ง
    - การเรียกใช้แอป iOS จากซอร์สโค้ด
    - การดีบักการค้นพบ Gateway หรือคำสั่ง canvas
summary: 'แอป Node บน iOS: เชื่อมต่อกับ Gateway, การจับคู่, แคนวาส และการแก้ไขปัญหา'
title: แอป iOS
x-i18n:
    generated_at: "2026-04-30T10:03:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fdbe578f15d2641d1bcb147fee7626486210cceae0cc355a92b3b2dd6291c35
    source_path: platforms/ios.md
    workflow: 16
---

ความพร้อมใช้งาน: พรีวิวภายใน แอป iOS ยังไม่ได้เผยแพร่ต่อสาธารณะ

## ทำอะไรได้บ้าง

- เชื่อมต่อกับ Gateway ผ่าน WebSocket (LAN หรือ tailnet)
- เปิดเผยความสามารถของ Node: Canvas, สแนปช็อตหน้าจอ, การถ่ายภาพจากกล้อง, ตำแหน่งที่ตั้ง, โหมดพูดคุย, การปลุกด้วยเสียง
- รับคำสั่ง `node.invoke` และรายงานเหตุการณ์สถานะของ Node

## ข้อกำหนด

- Gateway ที่ทำงานอยู่บนอุปกรณ์อีกเครื่องหนึ่ง (macOS, Linux หรือ Windows ผ่าน WSL2)
- เส้นทางเครือข่าย:
  - LAN เดียวกันผ่าน Bonjour, **หรือ**
  - Tailnet ผ่าน unicast DNS-SD (โดเมนตัวอย่าง: `openclaw.internal.`), **หรือ**
  - โฮสต์/พอร์ตแบบกำหนดเอง (สำรอง)

## เริ่มต้นอย่างรวดเร็ว (จับคู่ + เชื่อมต่อ)

1. เริ่ม Gateway:

```bash
openclaw gateway --port 18789
```

2. ในแอป iOS ให้เปิด Settings แล้วเลือก gateway ที่ค้นพบ (หรือเปิดใช้ Manual Host แล้วป้อนโฮสต์/พอร์ต)

3. อนุมัติคำขอจับคู่บนโฮสต์ของ gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

หากแอปลองจับคู่อีกครั้งโดยมีรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (บทบาท/ขอบเขต/คีย์สาธารณะ)
คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่และจะสร้าง `requestId` ใหม่
เรียกใช้ `openclaw devices list` อีกครั้งก่อนอนุมัติ

ตัวเลือกเสริม: หาก Node iOS เชื่อมต่อจากซับเน็ตที่ควบคุมอย่างเข้มงวดเสมอ คุณ
สามารถเลือกใช้การอนุมัติ Node อัตโนมัติในครั้งแรกด้วย CIDR ที่ระบุชัดเจนหรือ IP ที่ตรงกันแบบแน่นอน:

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

ค่านี้ปิดไว้โดยค่าเริ่มต้น ใช้เฉพาะกับการจับคู่ `role: node` ใหม่ที่
ไม่มีขอบเขตที่ร้องขอ การจับคู่ operator/browser และการเปลี่ยนแปลงบทบาท ขอบเขต เมตาดาตา หรือ
คีย์สาธารณะใดๆ ยังคงต้องอนุมัติด้วยตนเอง

4. ตรวจสอบการเชื่อมต่อ:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push ที่มี relay รองรับสำหรับบิลด์ทางการ

บิลด์ iOS ทางการที่เผยแพร่ใช้ push relay ภายนอกแทนการเผยแพร่โทเค็น APNs ดิบ
ไปยัง gateway

ข้อกำหนดฝั่ง Gateway:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

ลำดับการทำงาน:

- แอป iOS ลงทะเบียนกับ relay โดยใช้ App Attest และ StoreKit app transaction JWS
- relay ส่งคืน relay handle แบบทึบแสงพร้อมสิทธิ์อนุญาตส่งที่ผูกกับขอบเขตการลงทะเบียน
- แอป iOS ดึงข้อมูลตัวตนของ gateway ที่จับคู่แล้วและรวมข้อมูลนั้นในการลงทะเบียน relay เพื่อให้การลงทะเบียนที่มี relay รองรับถูกมอบหมายให้ gateway นั้นโดยเฉพาะ
- แอปส่งต่อการลงทะเบียนที่มี relay รองรับนั้นไปยัง gateway ที่จับคู่แล้วด้วย `push.apns.register`
- gateway ใช้ relay handle ที่จัดเก็บไว้นั้นสำหรับ `push.test`, การปลุกเบื้องหลัง และการกระตุ้นปลุก
- URL ฐานของ gateway relay ต้องตรงกับ URL relay ที่ฝังอยู่ในบิลด์ iOS ทางการ/TestFlight
- หากภายหลังแอปเชื่อมต่อกับ gateway อื่นหรือบิลด์ที่มี URL ฐานของ relay ต่างกัน แอปจะรีเฟรชการลงทะเบียน relay แทนการใช้การผูกเดิมซ้ำ

สิ่งที่ gateway **ไม่** ต้องใช้สำหรับเส้นทางนี้:

- ไม่มีโทเค็น relay ระดับ deployment
- ไม่มีคีย์ APNs โดยตรงสำหรับการส่งแบบทางการ/TestFlight ที่มี relay รองรับ

ลำดับที่ operator คาดว่าจะใช้:

1. ติดตั้งบิลด์ iOS ทางการ/TestFlight
2. ตั้งค่า `gateway.push.apns.relay.baseUrl` บน gateway
3. จับคู่แอปกับ gateway แล้วปล่อยให้เชื่อมต่อจนเสร็จ
4. แอปเผยแพร่ `push.apns.register` โดยอัตโนมัติหลังจากมีโทเค็น APNs, session ของ operator เชื่อมต่อแล้ว และการลงทะเบียน relay สำเร็จ
5. หลังจากนั้น `push.test`, การปลุกเพื่อเชื่อมต่อใหม่ และการกระตุ้นปลุกสามารถใช้การลงทะเบียนที่จัดเก็บไว้ซึ่งมี relay รองรับได้

## Beacon แสดงสถานะมีชีวิตในเบื้องหลัง

เมื่อ iOS ปลุกแอปสำหรับ silent push, background refresh หรือเหตุการณ์ตำแหน่งสำคัญ แอป
จะพยายามเชื่อมต่อ Node ใหม่แบบสั้นๆ แล้วเรียก `node.event` ด้วย `event: "node.presence.alive"`
gateway จะบันทึกค่านี้เป็น `lastSeenAtMs`/`lastSeenReason` บนเมตาดาตาของ Node/อุปกรณ์ที่จับคู่แล้วเท่านั้น
หลังจากรู้ตัวตนอุปกรณ์ Node ที่ยืนยันตัวตนแล้ว

แอปถือว่าการปลุกเบื้องหลังถูกบันทึกสำเร็จเฉพาะเมื่อการตอบกลับของ gateway มี
`handled: true` เท่านั้น Gateway รุ่นเก่าอาจตอบรับ `node.event` ด้วย `{ "ok": true }`; การตอบกลับนั้น
เข้ากันได้ แต่จะไม่นับเป็นการอัปเดต last-seen แบบคงทน

หมายเหตุความเข้ากันได้:

- `OPENCLAW_APNS_RELAY_BASE_URL` ยังทำงานเป็น env override ชั่วคราวสำหรับ gateway

## ลำดับการยืนยันตัวตนและความไว้วางใจ

relay มีอยู่เพื่อบังคับใช้ข้อจำกัดสองข้อที่ APNs โดยตรงบน gateway ไม่สามารถให้ได้สำหรับ
บิลด์ iOS ทางการ:

- มีเพียงบิลด์ iOS ของ OpenClaw ของแท้ที่เผยแพร่ผ่าน Apple เท่านั้นที่ใช้ hosted relay ได้
- gateway สามารถส่ง push ที่มี relay รองรับได้เฉพาะสำหรับอุปกรณ์ iOS ที่จับคู่กับ gateway นั้นโดยเฉพาะ

ทีละช่วง:

1. `iOS app -> gateway`
   - แอปจับคู่กับ gateway ผ่านลำดับการยืนยันตัวตน Gateway ปกติก่อน
   - สิ่งนี้ทำให้แอปได้ session ของ Node ที่ยืนยันตัวตนแล้วพร้อมกับ session ของ operator ที่ยืนยันตัวตนแล้ว
   - session ของ operator ใช้เพื่อเรียก `gateway.identity.get`

2. `iOS app -> relay`
   - แอปเรียก endpoint การลงทะเบียนของ relay ผ่าน HTTPS
   - การลงทะเบียนมีหลักฐาน App Attest พร้อมกับ StoreKit app transaction JWS
   - relay ตรวจสอบ bundle ID, หลักฐาน App Attest และหลักฐานการเผยแพร่ของ Apple และต้องใช้
     เส้นทางการเผยแพร่ทางการ/production
   - นี่คือสิ่งที่บล็อกบิลด์ Xcode/dev ภายในเครื่องไม่ให้ใช้ hosted relay บิลด์ภายในเครื่องอาจ
     เซ็นแล้ว แต่ไม่ผ่านหลักฐานการเผยแพร่ Apple ทางการที่ relay คาดหวัง

3. `gateway identity delegation`
   - ก่อนลงทะเบียน relay แอปดึงข้อมูลตัวตนของ gateway ที่จับคู่แล้วจาก
     `gateway.identity.get`
   - แอปรวมตัวตนของ gateway นั้นไว้ใน payload การลงทะเบียน relay
   - relay ส่งคืน relay handle และสิทธิ์อนุญาตส่งที่ผูกกับขอบเขตการลงทะเบียนซึ่งมอบหมายให้
     ตัวตนของ gateway นั้น

4. `gateway -> relay`
   - gateway จัดเก็บ relay handle และสิทธิ์อนุญาตส่งจาก `push.apns.register`
   - เมื่อใช้ `push.test`, การปลุกเพื่อเชื่อมต่อใหม่ และการกระตุ้นปลุก gateway จะเซ็นคำขอส่งด้วย
     ตัวตนอุปกรณ์ของตัวเอง
   - relay ตรวจสอบทั้งสิทธิ์อนุญาตส่งที่จัดเก็บไว้และลายเซ็นของ gateway เทียบกับตัวตนของ
     gateway ที่ได้รับมอบหมายจากการลงทะเบียน
   - gateway อื่นไม่สามารถใช้การลงทะเบียนที่จัดเก็บไว้นั้นซ้ำได้ แม้ว่าจะได้ handle มาด้วยวิธีใดก็ตาม

5. `relay -> APNs`
   - relay เป็นเจ้าของข้อมูลประจำตัว APNs production และโทเค็น APNs ดิบสำหรับบิลด์ทางการ
   - gateway ไม่เคยจัดเก็บโทเค็น APNs ดิบสำหรับบิลด์ทางการที่มี relay รองรับ
   - relay ส่ง push สุดท้ายไปยัง APNs ในนามของ gateway ที่จับคู่แล้ว

เหตุผลที่สร้างการออกแบบนี้:

- เพื่อเก็บข้อมูลประจำตัว APNs production ออกจาก gateway ของผู้ใช้
- เพื่อหลีกเลี่ยงการจัดเก็บโทเค็น APNs ของบิลด์ทางการแบบดิบไว้บน gateway
- เพื่ออนุญาตให้ใช้ hosted relay ได้เฉพาะกับบิลด์ OpenClaw ทางการ/TestFlight เท่านั้น
- เพื่อป้องกันไม่ให้ gateway หนึ่งส่ง wake push ไปยังอุปกรณ์ iOS ที่เป็นของ gateway อื่น

บิลด์ภายในเครื่อง/แบบ manual ยังคงใช้ APNs โดยตรง หากคุณกำลังทดสอบบิลด์เหล่านั้นโดยไม่มี relay
gateway ยังคงต้องใช้ข้อมูลประจำตัว APNs โดยตรง:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

ค่าเหล่านี้เป็น env var รันไทม์ของโฮสต์ gateway ไม่ใช่การตั้งค่า Fastlane `apps/ios/fastlane/.env` จัดเก็บเฉพาะ
การยืนยันตัวตน App Store Connect / TestFlight เช่น `ASC_KEY_ID` และ `ASC_ISSUER_ID`; ไม่ได้กำหนดค่า
การส่ง APNs โดยตรงสำหรับบิลด์ iOS ภายในเครื่อง

พื้นที่จัดเก็บที่แนะนำบนโฮสต์ gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

อย่า commit ไฟล์ `.p8` หรือวางไว้ใต้ repo checkout

## เส้นทางการค้นพบ

### Bonjour (LAN)

แอป iOS เรียกดู `_openclaw-gw._tcp` บน `local.` และเมื่อกำหนดค่าไว้ จะเรียกดูโดเมนการค้นพบ
wide-area DNS-SD เดียวกัน Gateway บน LAN เดียวกันจะปรากฏโดยอัตโนมัติจาก `local.`;
การค้นพบข้ามเครือข่ายสามารถใช้โดเมน wide-area ที่กำหนดค่าไว้ได้โดยไม่ต้องเปลี่ยนชนิดของ beacon

### Tailnet (ข้ามเครือข่าย)

หาก mDNS ถูกบล็อก ให้ใช้โซน unicast DNS-SD (เลือกโดเมน ตัวอย่าง:
`openclaw.internal.`) และ Tailscale split DNS
ดูตัวอย่าง CoreDNS ได้ที่ [Bonjour](/th/gateway/bonjour)

### โฮสต์/พอร์ตแบบกำหนดเอง

ใน Settings ให้เปิดใช้ **Manual Host** แล้วป้อนโฮสต์ + พอร์ตของ gateway (ค่าเริ่มต้น `18789`)

## Canvas + A2UI

Node iOS แสดงผล canvas ของ WKWebView ใช้ `node.invoke` เพื่อควบคุม:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

หมายเหตุ:

- โฮสต์ canvas ของ Gateway ให้บริการ `/__openclaw__/canvas/` และ `/__openclaw__/a2ui/`
- ให้บริการจากเซิร์ฟเวอร์ HTTP ของ Gateway (พอร์ตเดียวกับ `gateway.port`, ค่าเริ่มต้น `18789`)
- Node iOS นำทางไปยัง A2UI โดยอัตโนมัติเมื่อเชื่อมต่อ หากมีการประกาศ URL โฮสต์ canvas
- กลับไปยัง scaffold ในตัวด้วย `canvas.navigate` และ `{"url":""}`

## ความสัมพันธ์กับ Computer Use

แอป iOS เป็นพื้นผิว Node แบบมือถือ ไม่ใช่ backend ของ Codex Computer Use Codex
Computer Use และ `cua-driver mcp` ควบคุมเดสก์ท็อป macOS ภายในเครื่องผ่านเครื่องมือ MCP;
แอป iOS เปิดเผยความสามารถของ iPhone ผ่านคำสั่ง Node ของ OpenClaw
เช่น `canvas.*`, `camera.*`, `screen.*`, `location.*` และ `talk.*`

Agent ยังสามารถใช้งานแอป iOS ผ่าน OpenClaw ได้โดยเรียกใช้คำสั่ง Node
แต่การเรียกเหล่านั้นผ่านโปรโตคอล Node ของ gateway และเป็นไปตามข้อจำกัด foreground/background ของ iOS
ใช้ [Codex Computer Use](/th/plugins/codex-computer-use)
สำหรับการควบคุมเดสก์ท็อปภายในเครื่อง และใช้หน้านี้สำหรับความสามารถของ Node iOS

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## การปลุกด้วยเสียง + โหมดพูดคุย

- การปลุกด้วยเสียงและโหมดพูดคุยพร้อมใช้งานใน Settings
- iOS อาจระงับเสียงเบื้องหลัง ให้ถือว่าฟีเจอร์เสียงเป็นแบบ best-effort เมื่อแอปไม่ได้ทำงานอยู่

## ข้อผิดพลาดที่พบบ่อย

- `NODE_BACKGROUND_UNAVAILABLE`: นำแอป iOS มาไว้เบื้องหน้า (คำสั่ง canvas/camera/screen ต้องใช้สิ่งนี้)
- `A2UI_HOST_NOT_CONFIGURED`: Gateway ไม่ได้ประกาศ URL โฮสต์ canvas; ตรวจสอบ `canvasHost` ใน [การกำหนดค่า Gateway](/th/gateway/configuration)
- prompt การจับคู่ไม่ปรากฏ: เรียกใช้ `openclaw devices list` แล้วอนุมัติด้วยตนเอง
- เชื่อมต่อใหม่ล้มเหลวหลังติดตั้งใหม่: โทเค็นการจับคู่ใน Keychain ถูกล้างแล้ว ให้จับคู่ Node ใหม่

## เอกสารที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [การค้นพบ](/th/gateway/discovery)
- [Bonjour](/th/gateway/bonjour)
