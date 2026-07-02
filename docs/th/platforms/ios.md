---
read_when:
    - การจับคู่หรือเชื่อมต่อ Node iOS อีกครั้ง
    - การเรียกใช้แอป iOS จากซอร์ส
    - การดีบักการค้นพบ Gateway หรือคำสั่ง canvas
summary: 'แอปโหนด iOS: เชื่อมต่อกับ Gateway, การจับคู่, แคนวาส และการแก้ไขปัญหา'
title: แอป iOS
x-i18n:
    generated_at: "2026-07-02T22:53:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 150349a06488ecb36a4456d323738cca329c47d83ef6006e6f8de5e39ebb4902
    source_path: platforms/ios.md
    workflow: 16
---

ความพร้อมใช้งาน: บิลด์แอป iPhone จะถูกเผยแพร่ผ่านช่องทางของ Apple เมื่อเปิดใช้สำหรับรีลีส บิลด์สำหรับการพัฒนาในเครื่องสามารถรันจากซอร์สได้เช่นกัน

## สิ่งที่ทำได้

- เชื่อมต่อกับ Gateway ผ่าน WebSocket (LAN หรือ tailnet)
- เปิดเผยความสามารถของโหนด: Canvas, Screen snapshot, Camera capture, Location, Talk mode, Voice wake
- รับคำสั่ง `node.invoke` และรายงานเหตุการณ์สถานะของโหนด

## ข้อกำหนด

- Gateway ที่รันอยู่บนอุปกรณ์อื่น (macOS, Linux หรือ Windows ผ่าน WSL2)
- เส้นทางเครือข่าย:
  - LAN เดียวกันผ่าน Bonjour, **หรือ**
  - Tailnet ผ่าน unicast DNS-SD (โดเมนตัวอย่าง: `openclaw.internal.`), **หรือ**
  - โฮสต์/พอร์ตแบบระบุเอง (ทางสำรอง)

## เริ่มต้นอย่างรวดเร็ว (จับคู่ + เชื่อมต่อ)

1. เริ่ม Gateway:

```bash
openclaw gateway --port 18789
```

2. ในแอป iOS ให้เปิด Settings แล้วเลือก gateway ที่ค้นพบ (หรือเปิดใช้ Manual Host แล้วป้อนโฮสต์/พอร์ต)

3. อนุมัติคำขอจับคู่บนโฮสต์ gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

หากแอปลองจับคู่อีกครั้งพร้อมรายละเอียดการตรวจสอบสิทธิ์ที่เปลี่ยนไป (role/scopes/public key)
คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะสร้าง `requestId` ใหม่
ให้รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

ตัวเลือกเสริม: หากโหนด iOS เชื่อมต่อจาก subnet ที่ควบคุมอย่างเข้มงวดเสมอ คุณ
สามารถเลือกเปิดใช้การอนุมัติโหนดอัตโนมัติครั้งแรกด้วย CIDR หรือ IP ที่ระบุชัดเจน:

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

ค่านี้ปิดไว้โดยค่าเริ่มต้น ใช้เฉพาะกับการจับคู่ `role: node` ใหม่
ที่ไม่มี scopes ที่ร้องขอ การจับคู่ operator/browser และการเปลี่ยน role, scope, metadata หรือ
public-key ใดๆ ยังคงต้องอนุมัติด้วยตนเอง

4. ตรวจสอบการเชื่อมต่อ:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push ที่รองรับด้วย relay สำหรับบิลด์ทางการ

บิลด์ iOS ที่เผยแพร่อย่างเป็นทางการใช้ push relay ภายนอกแทนการเผยแพร่ token APNs ดิบ
ไปยัง gateway

บิลด์ App Store ทางการจากสายรีลีสสาธารณะใช้ relay ที่โฮสต์ไว้ที่ `https://ios-push-relay.openclaw.ai`

การ deploy relay แบบกำหนดเองต้องใช้เส้นทางบิลด์/deployment iOS ที่แยกออกมาโดยตั้งใจ ซึ่ง URL ของ relay ตรงกับ URL ของ gateway relay สายรีลีส App Store สาธารณะไม่รับการ override URL relay แบบกำหนดเอง หากคุณใช้บิลด์ relay แบบกำหนดเอง ให้ตั้งค่า URL gateway relay ให้ตรงกัน:

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
- relay ส่งคืน relay handle แบบทึบและ send grant ที่ผูกกับขอบเขตการลงทะเบียน
- แอป iOS ดึงข้อมูล identity ของ gateway ที่จับคู่แล้วและรวมไว้ในการลงทะเบียน relay ดังนั้นการลงทะเบียนที่รองรับด้วย relay จะถูกมอบหมายให้ gateway เฉพาะตัวนั้น
- แอปส่งต่อการลงทะเบียนที่รองรับด้วย relay นั้นไปยัง gateway ที่จับคู่แล้วด้วย `push.apns.register`
- gateway ใช้ relay handle ที่จัดเก็บไว้นั้นสำหรับ `push.test`, การ wake เบื้องหลัง และ wake nudges
- URL gateway relay แบบกำหนดเองต้องตรงกับ URL relay ที่ฝังไว้ในบิลด์ iOS
- หากภายหลังแอปเชื่อมต่อกับ gateway อื่นหรือบิลด์ที่มี base URL ของ relay ต่างกัน แอปจะรีเฟรชการลงทะเบียน relay แทนการใช้ binding เก่า

สิ่งที่ gateway **ไม่** ต้องใช้สำหรับเส้นทางนี้:

- ไม่มี relay token ระดับ deployment
- ไม่มีคีย์ APNs โดยตรงสำหรับการส่งจาก App Store ทางการที่รองรับด้วย relay

ลำดับการทำงานที่คาดหวังสำหรับ operator:

1. ติดตั้งแอป iOS ทางการ
2. ตัวเลือกเสริม: ตั้งค่า `gateway.push.apns.relay.baseUrl` บน gateway เฉพาะเมื่อใช้บิลด์ relay แบบกำหนดเองที่แยกออกมาโดยตั้งใจ
3. จับคู่แอปกับ gateway และปล่อยให้เชื่อมต่อจนเสร็จ
4. แอปเผยแพร่ `push.apns.register` โดยอัตโนมัติหลังจากมี APNs token, session ของ operator เชื่อมต่อแล้ว และการลงทะเบียน relay สำเร็จ
5. หลังจากนั้น `push.test`, การ wake เพื่อเชื่อมต่อใหม่ และ wake nudges จะใช้การลงทะเบียนที่จัดเก็บไว้ซึ่งรองรับด้วย relay ได้

## Beacon การมีชีวิตในเบื้องหลัง

เมื่อ iOS ปลุกแอปสำหรับ silent push, background refresh หรือ significant-location event แอป
จะพยายามเชื่อมต่อโหนดใหม่แบบสั้นๆ แล้วเรียก `node.event` ด้วย `event: "node.presence.alive"`
gateway จะบันทึกค่านี้เป็น `lastSeenAtMs`/`lastSeenReason` บน metadata ของโหนด/อุปกรณ์ที่จับคู่แล้ว เฉพาะ
หลังจากรู้ identity ของอุปกรณ์โหนดที่ตรวจสอบสิทธิ์แล้ว

แอปถือว่า background wake ถูกบันทึกสำเร็จเฉพาะเมื่อ response จาก gateway มี
`handled: true` เท่านั้น gateway รุ่นเก่าอาจตอบรับ `node.event` ด้วย `{ "ok": true }`; response นั้น
เข้ากันได้ แต่ไม่นับเป็นการอัปเดต last-seen ที่คงทน

หมายเหตุความเข้ากันได้:

- `OPENCLAW_APNS_RELAY_BASE_URL` ยังใช้ได้เป็น env override ชั่วคราวสำหรับ gateway
- สายรีลีส App Store สาธารณะปฏิเสธ `OPENCLAW_PUSH_RELAY_BASE_URL` สำหรับบิลด์ iOS

## การตรวจสอบสิทธิ์และลำดับความไว้วางใจ

relay มีไว้เพื่อบังคับใช้ข้อจำกัดสองอย่างที่ APNs-on-gateway โดยตรงไม่สามารถให้ได้สำหรับ
บิลด์ iOS ทางการ:

- เฉพาะบิลด์ iOS ของ OpenClaw ของแท้ที่เผยแพร่ผ่าน Apple เท่านั้นที่ใช้ relay ที่โฮสต์ไว้ได้
- gateway สามารถส่ง push ที่รองรับด้วย relay ได้เฉพาะสำหรับอุปกรณ์ iOS ที่จับคู่กับ gateway เฉพาะตัวนั้น

ทีละ hop:

1. `iOS app -> gateway`
   - แอปจับคู่กับ gateway ก่อนผ่านลำดับการตรวจสอบสิทธิ์ Gateway ปกติ
   - สิ่งนี้ให้ session โหนดที่ตรวจสอบสิทธิ์แล้วและ session operator ที่ตรวจสอบสิทธิ์แล้วแก่แอป
   - session operator ใช้เพื่อเรียก `gateway.identity.get`

2. `iOS app -> relay`
   - แอปเรียก endpoint การลงทะเบียน relay ผ่าน HTTPS
   - การลงทะเบียนมีหลักฐาน App Attest และ StoreKit app transaction JWS
   - relay ตรวจสอบ bundle ID, หลักฐาน App Attest และหลักฐานการเผยแพร่ของ Apple และกำหนดให้ใช้
     เส้นทางการเผยแพร่ official/production
   - นี่คือสิ่งที่บล็อกบิลด์ Xcode/dev ในเครื่องไม่ให้ใช้ relay ที่โฮสต์ไว้ บิลด์ในเครื่องอาจ
     signed แล้ว แต่ไม่ตรงตามหลักฐานการเผยแพร่ทางการของ Apple ที่ relay คาดหวัง

3. `gateway identity delegation`
   - ก่อนการลงทะเบียน relay แอปดึง identity ของ gateway ที่จับคู่แล้วจาก
     `gateway.identity.get`
   - แอปรวม identity ของ gateway นั้นไว้ใน payload การลงทะเบียน relay
   - relay ส่งคืน relay handle และ send grant ที่ผูกกับขอบเขตการลงทะเบียน ซึ่งถูกมอบหมายให้
     identity ของ gateway นั้น

4. `gateway -> relay`
   - gateway จัดเก็บ relay handle และ send grant จาก `push.apns.register`
   - เมื่อ `push.test`, การ wake เพื่อเชื่อมต่อใหม่ และ wake nudges gateway จะลงนามคำขอส่งด้วย
     identity ของอุปกรณ์ตัวเอง
   - relay ตรวจสอบทั้ง send grant ที่จัดเก็บไว้และลายเซ็นของ gateway เทียบกับ identity ของ
     gateway ที่มอบหมายไว้จากการลงทะเบียน
   - gateway อื่นไม่สามารถใช้การลงทะเบียนที่จัดเก็บไว้นั้นซ้ำได้ แม้ว่าจะได้ handle มา somehow

5. `relay -> APNs`
   - relay เป็นเจ้าของ credentials APNs production และ token APNs ดิบสำหรับบิลด์ทางการ
   - gateway ไม่เคยจัดเก็บ token APNs ดิบสำหรับบิลด์ทางการที่รองรับด้วย relay
   - relay ส่ง push สุดท้ายไปยัง APNs ในนามของ gateway ที่จับคู่แล้ว

เหตุผลที่สร้างดีไซน์นี้:

- เพื่อเก็บ credentials APNs production ออกจาก gateway ของผู้ใช้
- เพื่อหลีกเลี่ยงการจัดเก็บ token APNs ดิบของบิลด์ทางการบน gateway
- เพื่ออนุญาตให้ใช้ relay ที่โฮสต์ไว้เฉพาะกับบิลด์ iOS ทางการของ OpenClaw
- เพื่อป้องกันไม่ให้ gateway หนึ่งส่ง wake push ไปยังอุปกรณ์ iOS ที่เป็นของ gateway อื่น

บิลด์ local/manual ยังคงใช้ APNs โดยตรง หากคุณกำลังทดสอบบิลด์เหล่านั้นโดยไม่มี relay
gateway ยังคงต้องใช้ credentials APNs โดยตรง:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

ค่าเหล่านี้เป็น env vars ตอน runtime ของโฮสต์ gateway ไม่ใช่การตั้งค่า Fastlane `apps/ios/fastlane/.env` จัดเก็บเฉพาะ
auth ของ App Store Connect เช่น `APP_STORE_CONNECT_KEY_ID` และ
`APP_STORE_CONNECT_ISSUER_ID`; ไม่ได้กำหนดค่าการส่ง APNs โดยตรงสำหรับบิลด์ iOS ในเครื่อง

การจัดเก็บที่แนะนำบนโฮสต์ gateway:

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

แอป iOS browse `_openclaw-gw._tcp` บน `local.` และเมื่อกำหนดค่าไว้ จะ browse
โดเมนการค้นหา DNS-SD แบบ wide-area เดียวกัน gateway ใน LAN เดียวกันจะปรากฏโดยอัตโนมัติจาก `local.`;
การค้นหาข้ามเครือข่ายสามารถใช้โดเมน wide-area ที่กำหนดค่าไว้โดยไม่ต้องเปลี่ยนชนิด beacon

### Tailnet (ข้ามเครือข่าย)

หาก mDNS ถูกบล็อก ให้ใช้ zone unicast DNS-SD (เลือกโดเมนหนึ่ง ตัวอย่าง:
`openclaw.internal.`) และ Tailscale split DNS
ดูตัวอย่าง CoreDNS ได้ที่ [Bonjour](/th/gateway/bonjour)

### โฮสต์/พอร์ตแบบระบุเอง

ใน Settings ให้เปิดใช้ **Manual Host** แล้วป้อนโฮสต์ gateway + พอร์ต (ค่าเริ่มต้น `18789`)

## Canvas + A2UI

โหนด iOS แสดงผล canvas ของ WKWebView ใช้ `node.invoke` เพื่อควบคุม:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

หมายเหตุ:

- โฮสต์ canvas ของ Gateway ให้บริการ `/__openclaw__/canvas/` และ `/__openclaw__/a2ui/`
- ให้บริการจาก HTTP server ของ Gateway (พอร์ตเดียวกับ `gateway.port`, ค่าเริ่มต้น `18789`)
- โหนด iOS คง scaffold ในตัวเป็น view ค่าเริ่มต้นเมื่อเชื่อมต่อแล้ว `canvas.a2ui.push` และ `canvas.a2ui.reset` ใช้หน้า A2UI ที่ bundled และเป็นของแอป
- หน้า A2UI ของ Gateway ระยะไกลเป็นแบบ render-only บน iOS; action ของปุ่ม A2UI แบบ native จะรับเฉพาะจากหน้าที่ bundled และเป็นของแอปเท่านั้น
- กลับไปยัง scaffold ในตัวด้วย `canvas.navigate` และ `{"url":""}`

## ความสัมพันธ์กับ Computer Use

แอป iOS เป็นพื้นผิวโหนดบนมือถือ ไม่ใช่ backend ของ Codex Computer Use Codex
Computer Use และ `cua-driver mcp` ควบคุมเดสก์ท็อป macOS ในเครื่องผ่านเครื่องมือ MCP;
แอป iOS เปิดเผยความสามารถของ iPhone ผ่านคำสั่งโหนด OpenClaw
เช่น `canvas.*`, `camera.*`, `screen.*`, `location.*` และ `talk.*`

Agents ยังสามารถใช้งานแอป iOS ผ่าน OpenClaw ได้โดยเรียกคำสั่งโหนด
แต่การเรียกเหล่านั้นจะผ่านโปรโตคอลโหนดของ gateway และเป็นไปตามข้อจำกัด foreground/background ของ iOS
ใช้ [Codex Computer Use](/th/plugins/codex-computer-use)
สำหรับการควบคุมเดสก์ท็อปในเครื่อง และใช้หน้านี้สำหรับความสามารถโหนด iOS

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + talk mode

- Voice wake และ talk mode พร้อมใช้งานใน Settings
- OpenAI realtime Talk ใช้ WebRTC ที่ client เป็นเจ้าของเมื่อ `talk.realtime.transport` เป็น `webrtc`; การกำหนดค่า `gateway-relay` แบบชัดเจนยังคงเป็นของ Gateway ดู [Talk mode](/th/nodes/talk)
- โหนด iOS ที่รองรับ Talk จะประกาศความสามารถ `talk` และสามารถประกาศ
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` และ `talk.ptt.once`;
  Gateway อนุญาตคำสั่ง push-to-talk เหล่านั้นโดยค่าเริ่มต้นสำหรับโหนดที่เชื่อถือได้
  และรองรับ Talk
- iOS อาจพักการทำงานเสียงเบื้องหลัง ให้ถือว่าฟีเจอร์เสียงเป็น best-effort เมื่อแอปไม่ได้ active

## ข้อผิดพลาดที่พบบ่อย

- `NODE_BACKGROUND_UNAVAILABLE`: นำแอป iOS มาไว้ foreground (คำสั่ง canvas/camera/screen ต้องใช้)
- `A2UI_HOST_UNAVAILABLE`: ไม่สามารถเข้าถึงหน้า A2UI ที่ bundled ใน WebView ของแอปได้; ให้แอปอยู่ foreground บนแท็บ Screen แล้วลองอีกครั้ง
- prompt การจับคู่ไม่เคยปรากฏ: รัน `openclaw devices list` แล้วอนุมัติด้วยตนเอง
- เชื่อมต่อใหม่ล้มเหลวหลังติดตั้งใหม่: token การจับคู่ใน Keychain ถูกล้างแล้ว; จับคู่โหนดใหม่

## เอกสารที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [การค้นพบ](/th/gateway/discovery)
- [Bonjour](/th/gateway/bonjour)
