---
read_when:
    - การ pairing หรือเชื่อมต่อ node บน iOS ใหม่
    - การรันแอป iOS จากซอร์ส
    - การดีบักการค้นหา gateway หรือคำสั่ง canvas
summary: 'แอป node บน iOS: การเชื่อมต่อกับ Gateway, pairing, canvas และการแก้ไขปัญหา'
title: แอป iOS
x-i18n:
    generated_at: "2026-04-25T13:51:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0088cd135168248cfad10c24715f74117a66efaa52a572579c04f96a806538
    source_path: platforms/ios.md
    workflow: 15
---

สถานะการใช้งาน: พรีวิวภายใน แอป iOS ยังไม่ได้เผยแพร่สู่สาธารณะ

## สิ่งที่แอปนี้ทำได้

- เชื่อมต่อกับ Gateway ผ่าน WebSocket (LAN หรือ tailnet)
- แสดงความสามารถของ node: Canvas, Screen snapshot, Camera capture, Location, Talk mode, Voice wake
- รับคำสั่ง `node.invoke` และรายงานเหตุการณ์สถานะของ node

## ข้อกำหนด

- ต้องมี Gateway ที่รันอยู่บนอุปกรณ์อีกเครื่องหนึ่ง (macOS, Linux หรือ Windows ผ่าน WSL2)
- เส้นทางเครือข่าย:
  - อยู่ใน LAN เดียวกันผ่าน Bonjour **หรือ**
  - อยู่ใน tailnet ผ่าน unicast DNS-SD (ตัวอย่างโดเมน: `openclaw.internal.`) **หรือ**
  - ระบุ host/port ด้วยตนเอง (fallback)

## เริ่มต้นอย่างรวดเร็ว (pair + connect)

1. เริ่ม Gateway:

```bash
openclaw gateway --port 18789
```

2. ในแอป iOS ให้เปิด Settings และเลือก gateway ที่ค้นพบได้ (หรือเปิด Manual Host แล้วกรอก host/port)

3. อนุมัติคำขอ pairing บนโฮสต์ gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

หากแอปลอง pairing ใหม่พร้อมรายละเอียด auth ที่เปลี่ยนไป (role/scopes/public key)
คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะมี `requestId` ใหม่ถูกสร้างขึ้น
ให้รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

ทางเลือก: หาก iOS node เชื่อมต่อมาจาก subnet ที่ควบคุมได้แน่นหนาเสมอ
คุณสามารถเลือกเปิดการอนุมัติอัตโนมัติสำหรับ node ครั้งแรกด้วย CIDRs หรือ IPs แบบตรงตัวได้:

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

ฟีเจอร์นี้ปิดอยู่โดยค่าเริ่มต้น โดยมีผลเฉพาะกับ pairing ใหม่ของ `role: node` ที่
ไม่มี requested scopes เท่านั้น การ pairing สำหรับ operator/browser และการเปลี่ยนแปลงใดๆ ของ role, scope, metadata หรือ public key ยังคงต้องอนุมัติด้วยตนเอง

4. ตรวจสอบการเชื่อมต่อ:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push แบบ relay-backed สำหรับ official builds

official iOS builds ที่เผยแพร่จริงจะใช้ external push relay แทนการเผยแพร่ APNs
token ดิบไปยัง gateway โดยตรง

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

โฟลว์ทำงานดังนี้:

- แอป iOS ลงทะเบียนกับ relay โดยใช้ App Attest และ app receipt
- relay จะส่งกลับ relay handle แบบ opaque พร้อม send grant ที่ผูกกับการลงทะเบียน
- แอป iOS จะดึง paired gateway identity มาและรวมเข้าไปใน relay registration เพื่อให้ relay-backed registration นี้ถูกมอบหมายให้ gateway เฉพาะตัวนั้น
- แอปจะส่ง relay-backed registration นั้นต่อไปยัง paired gateway ด้วย `push.apns.register`
- gateway ใช้ relay handle ที่เก็บไว้นั้นสำหรับ `push.test`, background wakes และ wake nudges
- relay base URL ของ gateway ต้องตรงกับ relay URL ที่ฝังอยู่ใน official/TestFlight iOS build
- หากแอปเชื่อมต่อกับ gateway อื่นในภายหลัง หรือกับ build ที่มี relay base URL ต่างออกไป แอปจะรีเฟรช relay registration แทนการใช้ binding เดิมซ้ำ

สิ่งที่ gateway **ไม่** ต้องใช้ในเส้นทางนี้:

- ไม่ต้องมี deployment-wide relay token
- ไม่ต้องมี direct APNs key สำหรับการส่งแบบ relay-backed ของ official/TestFlight

โฟลว์ที่ผู้ปฏิบัติงานควรคาดหวัง:

1. ติดตั้ง official/TestFlight iOS build
2. ตั้งค่า `gateway.push.apns.relay.baseUrl` บน gateway
3. Pair แอปเข้ากับ gateway และปล่อยให้มันเชื่อมต่อจนเสร็จ
4. แอปจะเผยแพร่ `push.apns.register` อัตโนมัติหลังจากมี APNs token, เชื่อมต่อ operator session แล้ว และ relay registration สำเร็จ
5. หลังจากนั้น `push.test`, reconnect wakes และ wake nudges จะใช้ relay-backed registration ที่เก็บไว้ได้

หมายเหตุด้านความเข้ากันได้:

- `OPENCLAW_APNS_RELAY_BASE_URL` ยังคงใช้เป็น env override ชั่วคราวสำหรับ gateway ได้

## การยืนยันตัวตนและโฟลว์ความไว้วางใจ

relay มีไว้เพื่อบังคับใช้ข้อจำกัดสองอย่างที่ direct APNs-on-gateway ไม่สามารถให้ได้สำหรับ
official iOS builds:

- เฉพาะ OpenClaw iOS builds ของแท้ที่เผยแพร่ผ่าน Apple เท่านั้นที่ใช้ hosted relay ได้
- gateway สามารถส่ง relay-backed pushes ได้เฉพาะกับอุปกรณ์ iOS ที่ pair กับ gateway นั้นโดยเฉพาะ

ทีละขั้นตอน:

1. `iOS app -> gateway`
   - แอปจะ pair กับ gateway ก่อนผ่านโฟลว์ Gateway auth ปกติ
   - สิ่งนี้ทำให้แอปได้ทั้ง authenticated node session และ authenticated operator session
   - operator session ใช้เรียก `gateway.identity.get`

2. `iOS app -> relay`
   - แอปเรียก endpoints สำหรับลงทะเบียนของ relay ผ่าน HTTPS
   - การลงทะเบียนรวม App Attest proof และ app receipt
   - relay จะตรวจสอบ bundle ID, App Attest proof และ Apple receipt และต้องเป็น
     เส้นทางการเผยแพร่แบบ official/production
   - นี่คือสิ่งที่บล็อก local Xcode/dev builds ไม่ให้ใช้ hosted relay แม้ local build อาจ
     ถูกเซ็นแล้ว แต่ก็ยังไม่ผ่านหลักฐานการเผยแพร่ผ่าน Apple แบบเป็นทางการที่ relay คาดหวัง

3. `gateway identity delegation`
   - ก่อน relay registration แอปจะดึง paired gateway identity จาก
     `gateway.identity.get`
   - แอปรวม gateway identity นี้เข้าไปใน payload ของ relay registration
   - relay จะส่งกลับ relay handle และ send grant ที่ผูกกับการลงทะเบียน และมอบหมายให้กับ
     gateway identity นั้น

4. `gateway -> relay`
   - gateway จะเก็บ relay handle และ send grant จาก `push.apns.register`
   - เมื่อ `push.test`, reconnect wakes และ wake nudges gateway จะเซ็นคำขอส่งด้วย
     device identity ของตัวเอง
   - relay จะตรวจสอบทั้ง send grant ที่เก็บไว้และลายเซ็นของ gateway เทียบกับ delegated
     gateway identity จากตอนลงทะเบียน
   - gateway อื่นไม่สามารถใช้ registration ที่เก็บไว้นั้นซ้ำได้ แม้ว่าจะ somehow ได้ handle ไปก็ตาม

5. `relay -> APNs`
   - relay เป็นผู้ถือ production APNs credentials และ APNs token ดิบของ official build
   - gateway จะไม่เก็บ APNs token ดิบสำหรับ official builds แบบ relay-backed
   - relay จะส่ง push สุดท้ายไปยัง APNs ในนามของ paired gateway

เหตุผลที่ออกแบบแบบนี้:

- เพื่อไม่ให้ production APNs credentials อยู่ใน gateways ของผู้ใช้
- เพื่อหลีกเลี่ยงการเก็บ official-build APNs tokens แบบดิบบน gateway
- เพื่อให้ hosted relay ใช้ได้เฉพาะกับ official/TestFlight OpenClaw builds
- เพื่อป้องกันไม่ให้ gateway หนึ่งส่ง wake pushes ไปยังอุปกรณ์ iOS ที่เป็นของ gateway อื่น

local/manual builds ยังคงใช้ direct APNs หากคุณกำลังทดสอบ builds เหล่านั้นโดยไม่ใช้ relay
gateway ยังคงต้องมี direct APNs credentials:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

สิ่งเหล่านี้เป็นตัวแปรสภาพแวดล้อมของ runtime บนโฮสต์ gateway ไม่ใช่การตั้งค่าของ Fastlane `apps/ios/fastlane/.env` จะเก็บเฉพาะ
ข้อมูลยืนยันตัวตนสำหรับ App Store Connect / TestFlight เช่น `ASC_KEY_ID` และ `ASC_ISSUER_ID` เท่านั้น ไม่ได้กำหนดค่า
การส่ง direct APNs สำหรับ local iOS builds

ตำแหน่งจัดเก็บที่แนะนำบนโฮสต์ gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

ห้าม commit ไฟล์ `.p8` หรือวางไว้ใต้ repo checkout

## เส้นทางการค้นพบ

### Bonjour (LAN)

แอป iOS จะ browse `_openclaw-gw._tcp` บน `local.` และเมื่อมีการกำหนดค่าไว้ก็จะ browse
โดเมน wide-area DNS-SD เดียวกันด้วย Gateways ใน LAN เดียวกันจะปรากฏอัตโนมัติจาก `local.`
ส่วนการค้นหาข้ามเครือข่ายสามารถใช้โดเมน wide-area ที่กำหนดไว้ได้โดยไม่ต้องเปลี่ยนชนิดของ beacon

### Tailnet (ข้ามเครือข่าย)

หาก mDNS ถูกบล็อก ให้ใช้ unicast DNS-SD zone (เลือกโดเมน; ตัวอย่าง:
`openclaw.internal.`) และ Tailscale split DNS
ดู [Bonjour](/th/gateway/bonjour) สำหรับตัวอย่าง CoreDNS

### ระบุ host/port ด้วยตนเอง

ใน Settings ให้เปิด **Manual Host** แล้วกรอก host + port ของ gateway (ค่าเริ่มต้น `18789`)

## Canvas + A2UI

iOS node จะเรนเดอร์ canvas ด้วย WKWebView ใช้ `node.invoke` เพื่อควบคุม:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

หมายเหตุ:

- Canvas host ของ Gateway ให้บริการที่ `/__openclaw__/canvas/` และ `/__openclaw__/a2ui/`
- ให้บริการผ่านเซิร์ฟเวอร์ HTTP ของ Gateway (พอร์ตเดียวกับ `gateway.port`, ค่าเริ่มต้น `18789`)
- iOS node จะนำทางไปยัง A2UI อัตโนมัติเมื่อเชื่อมต่อ หากมีการประกาศ canvas host URL ไว้
- กลับไปยัง scaffold ที่มีมาในระบบได้ด้วย `canvas.navigate` และ `{"url":""}`

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + talk mode

- Voice wake และ talk mode พร้อมใช้งานใน Settings
- iOS อาจ suspend เสียงในพื้นหลัง; ให้ถือว่าฟีเจอร์เสียงเป็นแบบ best-effort เมื่อแอปไม่ได้ active

## ข้อผิดพลาดที่พบบ่อย

- `NODE_BACKGROUND_UNAVAILABLE`: นำแอป iOS ขึ้นมาสู่ foreground (คำสั่ง canvas/camera/screen ต้องการสิ่งนี้)
- `A2UI_HOST_NOT_CONFIGURED`: Gateway ไม่ได้ประกาศ canvas host URL; ตรวจสอบ `canvasHost` ใน [การกำหนดค่า Gateway](/th/gateway/configuration)
- prompt สำหรับ pairing ไม่เคยแสดง: รัน `openclaw devices list` แล้วอนุมัติด้วยตนเอง
- เชื่อมต่อใหม่หลังติดตั้งใหม่ไม่สำเร็จ: token สำหรับ pairing ใน Keychain ถูกล้างแล้ว; ให้ pair node ใหม่

## เอกสารที่เกี่ยวข้อง

- [Pairing](/th/channels/pairing)
- [Discovery](/th/gateway/discovery)
- [Bonjour](/th/gateway/bonjour)
