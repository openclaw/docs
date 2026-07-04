---
read_when:
    - การจับคู่หรือเชื่อมต่อโหนด iOS อีกครั้ง
    - การเรียกใช้แอป iOS จากซอร์ส
    - การดีบักการค้นพบ Gateway หรือคำสั่ง canvas
summary: 'แอปโหนด iOS: เชื่อมต่อกับ Gateway, การจับคู่, แคนวาส และการแก้ไขปัญหา'
title: แอป iOS
x-i18n:
    generated_at: "2026-07-04T18:25:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ad6d272518b36564562256f55ffc320c0c4d2b954914ac73c23e450fa7acee0b
    source_path: platforms/ios.md
    workflow: 16
---

ความพร้อมใช้งาน: บิลด์แอป iPhone จะเผยแพร่ผ่านช่องทางของ Apple เมื่อเปิดใช้สำหรับรีลีส บิลด์สำหรับการพัฒนาในเครื่องสามารถรันจากซอร์สได้เช่นกัน

## สิ่งที่ทำได้

- เชื่อมต่อกับ Gateway ผ่าน WebSocket (LAN หรือ tailnet)
- เปิดเผยความสามารถของ node: Canvas, Screen snapshot, Camera capture, Location, Talk mode, Voice wake
- รับคำสั่ง `node.invoke` และรายงานเหตุการณ์สถานะของ node

## ข้อกำหนด

- Gateway ที่รันอยู่บนอุปกรณ์อื่น (macOS, Linux หรือ Windows ผ่าน WSL2)
- เส้นทางเครือข่าย:
  - LAN เดียวกันผ่าน Bonjour, **หรือ**
  - Tailnet ผ่าน unicast DNS-SD (โดเมนตัวอย่าง: `openclaw.internal.`), **หรือ**
  - โฮสต์/พอร์ตแบบกำหนดเอง (ทางสำรอง)

## เริ่มต้นอย่างรวดเร็ว (จับคู่ + เชื่อมต่อ)

1. เริ่ม Gateway ที่ยืนยันตัวตนแล้วพร้อม route ที่โทรศัพท์ของคุณเข้าถึงได้ Tailscale
   Serve เป็นเส้นทางระยะไกลที่แนะนำ:

```bash
openclaw gateway --port 18789 --tailscale serve
```

สำหรับการตั้งค่า LAN เดียวกันที่เชื่อถือได้ ให้ใช้ `gateway.bind: "lan"` ที่ยืนยันตัวตนแล้ว
แทน ค่า bind เริ่มต้นแบบ loopback ไม่สามารถเข้าถึงได้จากโทรศัพท์ หากยังไม่ได้กำหนดค่า
Gateway ให้รัน `openclaw onboard` ก่อน เพื่อให้การสร้าง setup-code
มีเส้นทางยืนยันตัวตนด้วยโทเค็นหรือรหัสผ่าน

2. เปิด [Control UI](/th/web/control-ui), เลือก **Nodes** แล้วคลิก
   **Pair mobile device** ในการ์ด **Devices**

3. ในแอป iOS ให้เปิด **Settings** → **Gateway**, สแกนคิวอาร์โค้ด (หรือวาง
   setup code) แล้วเชื่อมต่อ

4. แอปทางการจะเชื่อมต่อโดยอัตโนมัติ หาก **Devices** แสดงคำขอที่รอดำเนินการ
   ให้ตรวจสอบ role และ scopes ก่อนอนุมัติ

ปุ่ม Control UI ต้องมีเซสชันที่จับคู่แล้วและมี `operator.admin`
เป็นทางสำรองผ่านเทอร์มินัล ให้เลือก gateway ที่ค้นพบในแอป iOS (หรือเปิดใช้
Manual Host แล้วป้อนโฮสต์/พอร์ต) จากนั้นอนุมัติคำขอบนโฮสต์ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

หากแอปลองจับคู่อีกครั้งด้วยรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (role/scopes/public key)
คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่และจะสร้าง `requestId` ใหม่
รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

ไม่บังคับ: หาก iOS node เชื่อมต่อจาก subnet ที่ควบคุมอย่างเข้มงวดเสมอ คุณ
สามารถเลือกเปิดใช้การอนุมัติ node อัตโนมัติครั้งแรกด้วย CIDR หรือ IP ที่ระบุชัดเจน:

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

ค่าเริ่มต้นจะปิดใช้งานไว้ ใช้กับการจับคู่ `role: node` ใหม่ที่
ไม่มี scopes ที่ขอเท่านั้น การจับคู่ operator/browser และการเปลี่ยนแปลง role, scope, metadata หรือ
public-key ใดๆ ยังต้องอนุมัติด้วยตนเอง

5. ตรวจสอบการเชื่อมต่อ:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push ที่มี relay รองรับสำหรับบิลด์ทางการ

บิลด์ iOS ที่เผยแพร่อย่างเป็นทางการใช้ push relay ภายนอกแทนการเผยแพร่โทเค็น APNs ดิบ
ไปยัง gateway

บิลด์ App Store ทางการจากเลนรีลีสสาธารณะใช้ relay ที่โฮสต์ไว้ที่ `https://ios-push-relay.openclaw.ai`

การติดตั้งใช้งาน relay แบบกำหนดเองต้องใช้เส้นทางบิลด์/การติดตั้งใช้งาน iOS ที่แยกออกอย่างตั้งใจ ซึ่ง URL ของ relay ตรงกับ URL ของ gateway relay เลนรีลีส App Store สาธารณะไม่ยอมรับการ override URL ของ relay แบบกำหนดเอง หากคุณใช้บิลด์ relay แบบกำหนดเอง ให้ตั้งค่า URL ของ gateway relay ให้ตรงกัน:

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

วิธีการทำงานของ flow:

- แอป iOS ลงทะเบียนกับ relay โดยใช้ App Attest และ StoreKit app transaction JWS
- relay ส่งคืน relay handle แบบทึบพร้อม send grant ที่มีขอบเขตตามการลงทะเบียน
- แอป iOS ดึงข้อมูลตัวตนของ gateway ที่จับคู่แล้วและรวมไว้ในการลงทะเบียน relay ดังนั้นการลงทะเบียนที่มี relay รองรับจะถูกมอบหมายให้ gateway เฉพาะนั้น
- แอปส่งต่อการลงทะเบียนที่มี relay รองรับนั้นไปยัง gateway ที่จับคู่แล้วด้วย `push.apns.register`
- gateway ใช้ relay handle ที่จัดเก็บไว้นั้นสำหรับ `push.test`, การปลุกเบื้องหลัง และ wake nudges
- URL ของ gateway relay แบบกำหนดเองต้องตรงกับ URL ของ relay ที่ฝังไว้ในบิลด์ iOS
- หากภายหลังแอปเชื่อมต่อกับ gateway อื่นหรือบิลด์ที่มี relay base URL ต่างกัน แอปจะรีเฟรชการลงทะเบียน relay แทนการใช้ binding เดิมซ้ำ

สิ่งที่ gateway **ไม่** ต้องใช้สำหรับเส้นทางนี้:

- ไม่มี relay token ระดับการติดตั้งใช้งาน
- ไม่มีคีย์ APNs โดยตรงสำหรับการส่งของ App Store ทางการที่มี relay รองรับ

flow ที่คาดหวังสำหรับ operator:

1. ติดตั้งแอป iOS ทางการ
2. ไม่บังคับ: ตั้งค่า `gateway.push.apns.relay.baseUrl` บน gateway เฉพาะเมื่อใช้บิลด์ relay แบบกำหนดเองที่แยกออกอย่างตั้งใจ
3. จับคู่แอปกับ gateway และปล่อยให้เชื่อมต่อจนเสร็จ
4. แอปเผยแพร่ `push.apns.register` โดยอัตโนมัติหลังจากมีโทเค็น APNs, เซสชัน operator เชื่อมต่อแล้ว และการลงทะเบียน relay สำเร็จ
5. หลังจากนั้น `push.test`, การปลุกเพื่อเชื่อมต่อใหม่ และ wake nudges สามารถใช้การลงทะเบียนที่จัดเก็บไว้ซึ่งมี relay รองรับได้

## Background alive beacons

เมื่อ iOS ปลุกแอปสำหรับ silent push, background refresh หรือเหตุการณ์ significant-location แอป
จะพยายามเชื่อมต่อ node ใหม่แบบสั้นๆ แล้วเรียก `node.event` ด้วย `event: "node.presence.alive"`
gateway บันทึกสิ่งนี้เป็น `lastSeenAtMs`/`lastSeenReason` บน metadata ของ node/device ที่จับคู่แล้วเท่านั้น
หลังจากรู้ตัวตนอุปกรณ์ node ที่ยืนยันตัวตนแล้ว

แอปถือว่าการปลุกเบื้องหลังถูกบันทึกสำเร็จเฉพาะเมื่อการตอบกลับจาก gateway มี
`handled: true` Gateway รุ่นเก่าอาจตอบรับ `node.event` ด้วย `{ "ok": true }`; การตอบกลับนั้น
เข้ากันได้แต่ไม่นับเป็นการอัปเดต last-seen ที่คงทน

หมายเหตุความเข้ากันได้:

- `OPENCLAW_APNS_RELAY_BASE_URL` ยังใช้งานได้เป็น env override ชั่วคราวสำหรับ gateway
- เลนรีลีส App Store สาธารณะปฏิเสธ `OPENCLAW_PUSH_RELAY_BASE_URL` สำหรับบิลด์ iOS

## Flow การยืนยันตัวตนและความเชื่อถือ

relay มีไว้เพื่อบังคับใช้ข้อจำกัดสองข้อที่ APNs โดยตรงบน gateway ไม่สามารถให้ได้สำหรับ
บิลด์ iOS ทางการ:

- เฉพาะบิลด์ iOS ของ OpenClaw ของแท้ที่เผยแพร่ผ่าน Apple เท่านั้นที่ใช้ relay ที่โฮสต์ไว้ได้
- gateway สามารถส่ง push ที่มี relay รองรับได้เฉพาะสำหรับอุปกรณ์ iOS ที่จับคู่กับ
  gateway นั้นโดยเฉพาะ

ทีละ hop:

1. `iOS app -> gateway`
   - แอปจับคู่กับ gateway ก่อนผ่าน flow การยืนยันตัวตน Gateway ปกติ
   - สิ่งนี้ทำให้แอปมีเซสชัน node ที่ยืนยันตัวตนแล้วพร้อมเซสชัน operator ที่ยืนยันตัวตนแล้ว
   - เซสชัน operator ใช้เรียก `gateway.identity.get`

2. `iOS app -> relay`
   - แอปเรียก endpoint การลงทะเบียน relay ผ่าน HTTPS
   - การลงทะเบียนมีหลักฐาน App Attest พร้อม StoreKit app transaction JWS
   - relay ตรวจสอบ bundle ID, หลักฐาน App Attest และหลักฐานการเผยแพร่ของ Apple และกำหนดให้ใช้
     เส้นทางการเผยแพร่ official/production
   - นี่คือสิ่งที่บล็อกบิลด์ Xcode/dev ในเครื่องไม่ให้ใช้ relay ที่โฮสต์ไว้ บิลด์ในเครื่องอาจ
     signed แล้ว แต่ไม่ผ่านหลักฐานการเผยแพร่ Apple ทางการที่ relay คาดหวัง

3. `gateway identity delegation`
   - ก่อนการลงทะเบียน relay แอปดึงข้อมูลตัวตนของ gateway ที่จับคู่แล้วจาก
     `gateway.identity.get`
   - แอปรวมตัวตนของ gateway นั้นไว้ใน payload การลงทะเบียน relay
   - relay ส่งคืน relay handle และ send grant ที่มีขอบเขตตามการลงทะเบียน ซึ่งถูกมอบหมายให้
     ตัวตน gateway นั้น

4. `gateway -> relay`
   - gateway จัดเก็บ relay handle และ send grant จาก `push.apns.register`
   - เมื่อมี `push.test`, การปลุกเพื่อเชื่อมต่อใหม่ และ wake nudges, gateway จะเซ็นคำขอส่งด้วย
     ตัวตนอุปกรณ์ของตนเอง
   - relay ตรวจสอบทั้ง send grant ที่จัดเก็บไว้และลายเซ็น gateway เทียบกับตัวตน
     gateway ที่ถูกมอบหมายจากการลงทะเบียน
   - gateway อื่นไม่สามารถใช้การลงทะเบียนที่จัดเก็บไว้นั้นซ้ำได้ แม้ว่าจะได้ handle มาด้วยวิธีใดก็ตาม

5. `relay -> APNs`
   - relay เป็นเจ้าของ credentials APNs production และโทเค็น APNs ดิบสำหรับบิลด์ทางการ
   - gateway ไม่เคยจัดเก็บโทเค็น APNs ดิบสำหรับบิลด์ทางการที่มี relay รองรับ
   - relay ส่ง push สุดท้ายไปยัง APNs ในนามของ gateway ที่จับคู่แล้ว

เหตุผลที่สร้างการออกแบบนี้:

- เพื่อเก็บ credentials APNs production ให้อยู่นอก gateway ของผู้ใช้
- เพื่อหลีกเลี่ยงการจัดเก็บโทเค็น APNs ดิบของบิลด์ทางการบน gateway
- เพื่ออนุญาตให้ใช้ relay ที่โฮสต์ไว้เฉพาะกับบิลด์ iOS ทางการของ OpenClaw
- เพื่อป้องกันไม่ให้ gateway หนึ่งส่ง wake push ไปยังอุปกรณ์ iOS ที่เป็นของ gateway อื่น

บิลด์ local/manual ยังคงใช้ APNs โดยตรง หากคุณทดสอบบิลด์เหล่านั้นโดยไม่มี relay
gateway ยังต้องมี credentials APNs โดยตรง:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

สิ่งเหล่านี้เป็น env vars สำหรับ runtime ของโฮสต์ gateway ไม่ใช่การตั้งค่า Fastlane `apps/ios/fastlane/.env` จัดเก็บเฉพาะ
การยืนยันตัวตน App Store Connect เช่น `APP_STORE_CONNECT_KEY_ID` และ
`APP_STORE_CONNECT_ISSUER_ID`; ไม่ได้กำหนดค่าการส่ง APNs โดยตรงสำหรับบิลด์ iOS ในเครื่อง

ที่จัดเก็บบนโฮสต์ gateway ที่แนะนำ:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

อย่า commit ไฟล์ `.p8` หรือวางไว้ภายใต้ repo checkout

## เส้นทางการค้นพบ

### Bonjour (LAN)

แอป iOS เรียกดู `_openclaw-gw._tcp` บน `local.` และเมื่อกำหนดค่าไว้ จะเรียกดู
โดเมนการค้นพบ DNS-SD แบบ wide-area เดียวกัน Gateway ใน LAN เดียวกันจะปรากฏโดยอัตโนมัติจาก `local.`;
การค้นพบข้ามเครือข่ายสามารถใช้โดเมน wide-area ที่กำหนดค่าไว้ได้โดยไม่ต้องเปลี่ยนชนิด beacon

### Tailnet (ข้ามเครือข่าย)

หาก mDNS ถูกบล็อก ให้ใช้โซน unicast DNS-SD (เลือกโดเมน; ตัวอย่าง:
`openclaw.internal.`) และ Tailscale split DNS
ดู [Bonjour](/th/gateway/bonjour) สำหรับตัวอย่าง CoreDNS

### โฮสต์/พอร์ตแบบกำหนดเอง

ใน Settings ให้เปิดใช้ **Manual Host** แล้วป้อนโฮสต์ gateway + พอร์ต (ค่าเริ่มต้น `18789`)

## Canvas + A2UI

iOS node แสดงผล canvas ของ WKWebView ใช้ `node.invoke` เพื่อควบคุม:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

หมายเหตุ:

- โฮสต์ Canvas ของ Gateway ให้บริการ `/__openclaw__/canvas/` และ `/__openclaw__/a2ui/`
- ให้บริการจากเซิร์ฟเวอร์ HTTP ของ Gateway (พอร์ตเดียวกับ `gateway.port`, ค่าเริ่มต้น `18789`)
- iOS node คง scaffold ในตัวไว้เป็นมุมมองเริ่มต้นเมื่อเชื่อมต่อแล้ว `canvas.a2ui.push` และ `canvas.a2ui.reset` ใช้หน้า A2UI ที่เป็นของแอปและรวมมาในบันเดิล
- หน้า A2UI ของ Gateway ระยะไกลเป็นแบบแสดงผลอย่างเดียวบน iOS; action ของปุ่ม A2UI native จะยอมรับเฉพาะจากหน้าที่เป็นของแอปและรวมมาในบันเดิลเท่านั้น
- กลับไปยัง scaffold ในตัวด้วย `canvas.navigate` และ `{"url":""}`

## ความสัมพันธ์กับ Computer Use

แอป iOS เป็นพื้นผิว node บนมือถือ ไม่ใช่ backend ของ Codex Computer Use Codex
Computer Use และ `cua-driver mcp` ควบคุมเดสก์ท็อป macOS ในเครื่องผ่านเครื่องมือ MCP;
แอป iOS เปิดเผยความสามารถของ iPhone ผ่านคำสั่ง node ของ OpenClaw
เช่น `canvas.*`, `camera.*`, `screen.*`, `location.*` และ `talk.*`

Agents ยังสามารถควบคุมแอป iOS ผ่าน OpenClaw ได้โดยเรียกใช้คำสั่ง node
แต่การเรียกเหล่านั้นจะผ่านโปรโตคอล gateway node และอยู่ภายใต้ข้อจำกัด foreground/background ของ iOS
ใช้ [Codex Computer Use](/th/plugins/codex-computer-use)
สำหรับการควบคุมเดสก์ท็อปในเครื่อง และใช้หน้านี้สำหรับความสามารถของ iOS node

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + talk mode

- การปลุกด้วยเสียงและโหมดพูดคุยมีให้ใช้งานในการตั้งค่า
- Talk แบบเรียลไทม์ของ OpenAI ใช้ WebRTC ที่ไคลเอนต์เป็นเจ้าของเมื่อ `talk.realtime.transport` เป็น `webrtc`; การกำหนดค่า `gateway-relay` แบบชัดเจนยังคงเป็นของ Gateway ดู [โหมดพูดคุย](/th/nodes/talk)
- โหนด iOS ที่รองรับการพูดคุยจะประกาศความสามารถ `talk` และสามารถประกาศ
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, และ `talk.ptt.once`;
  Gateway อนุญาตคำสั่ง push-to-talk เหล่านั้นโดยค่าเริ่มต้นสำหรับโหนด
  ที่รองรับ Talk และเชื่อถือได้
- iOS อาจระงับเสียงเบื้องหลัง ให้ถือว่าฟีเจอร์เสียงเป็นแบบพยายามให้ดีที่สุดเมื่อแอปไม่ได้ทำงานอยู่

## ข้อผิดพลาดทั่วไป

- `NODE_BACKGROUND_UNAVAILABLE`: นำแอป iOS มาไว้ด้านหน้า (คำสั่ง canvas/camera/screen จำเป็นต้องทำเช่นนี้)
- `A2UI_HOST_UNAVAILABLE`: หน้า A2UI ที่รวมมาไม่สามารถเข้าถึงได้ใน WebView ของแอป ให้เปิดแอปไว้ด้านหน้าบนแท็บ Screen แล้วลองอีกครั้ง
- พรอมต์จับคู่ไม่ปรากฏ: เรียกใช้ `openclaw devices list` และอนุมัติด้วยตนเอง
- เชื่อมต่อใหม่ล้มเหลวหลังติดตั้งใหม่: โทเค็นการจับคู่ใน Keychain ถูกล้างแล้ว ให้จับคู่โหนดใหม่

## เอกสารที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [การค้นพบ](/th/gateway/discovery)
- [Bonjour](/th/gateway/bonjour)
