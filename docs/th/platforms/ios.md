---
read_when:
    - การจับคู่หรือเชื่อมต่อโหนด iOS อีกครั้ง
    - การรันแอป iOS จากซอร์ส
    - การดีบักการค้นพบ Gateway หรือคำสั่งแคนวาส
summary: 'แอป Node บน iOS: เชื่อมต่อกับ Gateway, การจับคู่, แคนวาส และการแก้ไขปัญหา'
title: แอป iOS
x-i18n:
    generated_at: "2026-06-27T17:49:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a93381fd2b95316e05a555bee45b9aed5572679b4b1f10f7f9e40c1a69faf17
    source_path: platforms/ios.md
    workflow: 16
---

ความพร้อมใช้งาน: บิลด์แอป iPhone เผยแพร่ผ่านช่องทางของ Apple เมื่อเปิดใช้สำหรับรีลีสหนึ่ง ๆ บิลด์สำหรับการพัฒนาในเครื่องยังสามารถรันจากซอร์สได้ด้วย

## สิ่งที่ทำได้

- เชื่อมต่อกับ Gateway ผ่าน WebSocket (LAN หรือ tailnet)
- เปิดเผยความสามารถของโหนด: Canvas, สแนปช็อตหน้าจอ, การจับภาพจากกล้อง, ตำแหน่ง, โหมดพูดคุย, การปลุกด้วยเสียง
- รับคำสั่ง `node.invoke` และรายงานอีเวนต์สถานะของโหนด

## ข้อกำหนด

- Gateway ที่รันอยู่บนอุปกรณ์อีกเครื่องหนึ่ง (macOS, Linux หรือ Windows ผ่าน WSL2)
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

3. อนุมัติคำขอจับคู่บนโฮสต์ gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

หากแอปลดพยายามจับคู่อีกครั้งพร้อมรายละเอียด auth ที่เปลี่ยนไป (role/scopes/public key)
คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะสร้าง `requestId` ใหม่
รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

ไม่บังคับ: หากโหนด iOS เชื่อมต่อจากซับเน็ตที่ควบคุมอย่างเข้มงวดเสมอ คุณ
สามารถเลือกใช้การอนุมัติโหนดครั้งแรกโดยอัตโนมัติด้วย CIDR ที่ระบุชัดเจนหรือ IP ที่ตรงตัว:

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
ไม่มี scope ที่ร้องขอ การจับคู่ operator/browser และการเปลี่ยนแปลง role, scope, metadata หรือ
public-key ใด ๆ ยังคงต้องอนุมัติด้วยตนเอง

4. ตรวจสอบการเชื่อมต่อ:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## พุชที่รองรับด้วยรีเลย์สำหรับบิลด์ทางการ

บิลด์ iOS ที่เผยแพร่อย่างเป็นทางการใช้รีเลย์พุชภายนอกแทนการเผยแพร่โทเค็น APNs
ดิบไปยัง gateway

บิลด์ทางการ/TestFlight จากสายรีลีส App Store สาธารณะใช้รีเลย์ที่โฮสต์ไว้ที่ `https://ios-push-relay.openclaw.ai`

การปรับใช้รีเลย์แบบกำหนดเองต้องมีเส้นทางบิลด์/ปรับใช้ iOS ที่แยกต่างหากโดยตั้งใจ ซึ่ง URL รีเลย์ตรงกับ URL รีเลย์ของ gateway สายรีลีส App Store สาธารณะไม่ยอมรับการ override URL รีเลย์แบบกำหนดเอง หากคุณใช้บิลด์รีเลย์แบบกำหนดเอง ให้ตั้งค่า URL รีเลย์ gateway ที่ตรงกัน:

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

- แอป iOS ลงทะเบียนกับรีเลย์โดยใช้ App Attest และ StoreKit app transaction JWS
- รีเลย์ส่งคืน relay handle แบบทึบและ send grant ที่ผูกกับขอบเขตการลงทะเบียน
- แอป iOS ดึงตัวตน gateway ที่จับคู่ไว้และรวมไว้ในการลงทะเบียนรีเลย์ ดังนั้นการลงทะเบียนที่รองรับด้วยรีเลย์จึงถูกมอบหมายให้ gateway นั้นโดยเฉพาะ
- แอปส่งต่อการลงทะเบียนที่รองรับด้วยรีเลย์นั้นไปยัง gateway ที่จับคู่ไว้ด้วย `push.apns.register`
- Gateway ใช้ relay handle ที่จัดเก็บไว้นั้นสำหรับ `push.test`, การปลุกเบื้องหลัง และ wake nudge
- URL รีเลย์ gateway แบบกำหนดเองต้องตรงกับ URL รีเลย์ที่ฝังอยู่ในบิลด์ iOS
- หากภายหลังแอปเชื่อมต่อกับ gateway อื่น หรือบิลด์ที่มี relay base URL ต่างกัน แอปจะรีเฟรชการลงทะเบียนรีเลย์แทนการใช้ binding เดิมซ้ำ

สิ่งที่ gateway **ไม่** จำเป็นต้องมีสำหรับเส้นทางนี้:

- ไม่มีโทเค็นรีเลย์ระดับการปรับใช้
- ไม่มีคีย์ APNs โดยตรงสำหรับการส่งทางการ/TestFlight ที่รองรับด้วยรีเลย์

ลำดับการทำงานที่ operator คาดหวัง:

1. ติดตั้งบิลด์ iOS ทางการ/TestFlight
2. ไม่บังคับ: ตั้งค่า `gateway.push.apns.relay.baseUrl` บน gateway เฉพาะเมื่อใช้บิลด์รีเลย์แบบกำหนดเองที่แยกต่างหากโดยตั้งใจ
3. จับคู่แอปกับ gateway แล้วปล่อยให้เชื่อมต่อจนเสร็จ
4. แอปเผยแพร่ `push.apns.register` โดยอัตโนมัติหลังจากมีโทเค็น APNs, เซสชัน operator เชื่อมต่อแล้ว และการลงทะเบียนรีเลย์สำเร็จ
5. หลังจากนั้น `push.test`, การปลุกเพื่อเชื่อมต่อใหม่ และ wake nudge สามารถใช้การลงทะเบียนที่จัดเก็บไว้ซึ่งรองรับด้วยรีเลย์ได้

## บีคอน alive เบื้องหลัง

เมื่อ iOS ปลุกแอปสำหรับ silent push, background refresh หรืออีเวนต์ significant-location แอป
จะพยายามเชื่อมต่อโหนดใหม่แบบสั้น ๆ แล้วเรียก `node.event` พร้อม `event: "node.presence.alive"`
Gateway บันทึกค่านี้เป็น `lastSeenAtMs`/`lastSeenReason` บน metadata ของโหนด/อุปกรณ์ที่จับคู่ไว้เท่านั้น
หลังจากทราบตัวตนอุปกรณ์โหนดที่ผ่านการยืนยันตัวตนแล้ว

แอปถือว่าการปลุกเบื้องหลังถูกบันทึกสำเร็จเฉพาะเมื่อการตอบกลับจาก gateway มี
`handled: true` Gateway รุ่นเก่าอาจตอบรับ `node.event` ด้วย `{ "ok": true }`; การตอบกลับนั้น
เข้ากันได้แต่ไม่นับเป็นการอัปเดต last-seen ที่คงทน

หมายเหตุความเข้ากันได้:

- `OPENCLAW_APNS_RELAY_BASE_URL` ยังใช้งานได้เป็น env override ชั่วคราวสำหรับ gateway
- สายรีลีส App Store สาธารณะปฏิเสธ `OPENCLAW_PUSH_RELAY_BASE_URL` สำหรับบิลด์ iOS

## การยืนยันตัวตนและลำดับความไว้วางใจ

รีเลย์มีไว้เพื่อบังคับใช้ข้อจำกัดสองข้อที่ APNs โดยตรงบน gateway ไม่สามารถให้ได้สำหรับ
บิลด์ iOS ทางการ:

- เฉพาะบิลด์ iOS ของ OpenClaw ของแท้ที่เผยแพร่ผ่าน Apple เท่านั้นที่ใช้รีเลย์ที่โฮสต์ไว้ได้
- Gateway สามารถส่งพุชที่รองรับด้วยรีเลย์ได้เฉพาะสำหรับอุปกรณ์ iOS ที่จับคู่กับ gateway นั้นโดยเฉพาะ

ทีละช่วง:

1. `iOS app -> gateway`
   - แอปจับคู่กับ gateway ก่อนผ่านลำดับ auth ปกติของ Gateway
   - สิ่งนี้ให้เซสชันโหนดที่ผ่านการยืนยันตัวตนและเซสชัน operator ที่ผ่านการยืนยันตัวตนแก่แอป
   - เซสชัน operator ใช้เพื่อเรียก `gateway.identity.get`

2. `iOS app -> relay`
   - แอปเรียก endpoint การลงทะเบียนของรีเลย์ผ่าน HTTPS
   - การลงทะเบียนรวม proof ของ App Attest และ StoreKit app transaction JWS
   - รีเลย์ตรวจสอบ bundle ID, proof ของ App Attest และ proof การเผยแพร่ของ Apple และกำหนดให้ใช้
     เส้นทางการเผยแพร่ทางการ/production
   - นี่คือสิ่งที่บล็อกบิลด์ Xcode/dev ในเครื่องไม่ให้ใช้รีเลย์ที่โฮสต์ไว้ บิลด์ในเครื่องอาจ
     เซ็นแล้ว แต่ไม่เป็นไปตาม proof การเผยแพร่ทางการของ Apple ที่รีเลย์คาดหวัง

3. `gateway identity delegation`
   - ก่อนการลงทะเบียนรีเลย์ แอปดึงตัวตน gateway ที่จับคู่ไว้จาก
     `gateway.identity.get`
   - แอปรวมตัวตน gateway นั้นไว้ใน payload การลงทะเบียนรีเลย์
   - รีเลย์ส่งคืน relay handle และ send grant ที่ผูกกับขอบเขตการลงทะเบียน ซึ่งถูกมอบหมายให้
     ตัวตน gateway นั้น

4. `gateway -> relay`
   - Gateway จัดเก็บ relay handle และ send grant จาก `push.apns.register`
   - เมื่อใช้ `push.test`, การปลุกเพื่อเชื่อมต่อใหม่ และ wake nudge, gateway จะเซ็นคำขอส่งด้วย
     ตัวตนอุปกรณ์ของตัวเอง
   - รีเลย์ตรวจสอบทั้ง send grant ที่จัดเก็บไว้และลายเซ็น gateway เทียบกับตัวตน
     gateway ที่มอบหมายไว้จากการลงทะเบียน
   - Gateway อื่นไม่สามารถใช้การลงทะเบียนที่จัดเก็บไว้นั้นซ้ำได้ แม้ว่าจะได้ handle มาด้วยวิธีใดก็ตาม

5. `relay -> APNs`
   - รีเลย์เป็นเจ้าของข้อมูลประจำตัว APNs production และโทเค็น APNs ดิบสำหรับบิลด์ทางการ
   - Gateway ไม่เคยจัดเก็บโทเค็น APNs ดิบสำหรับบิลด์ทางการที่รองรับด้วยรีเลย์
   - รีเลย์ส่งพุชสุดท้ายไปยัง APNs ในนามของ gateway ที่จับคู่ไว้

เหตุผลที่สร้างการออกแบบนี้:

- เพื่อเก็บข้อมูลประจำตัว APNs production ให้อยู่นอก gateway ของผู้ใช้
- เพื่อหลีกเลี่ยงการจัดเก็บโทเค็น APNs ดิบของบิลด์ทางการบน gateway
- เพื่ออนุญาตให้ใช้รีเลย์ที่โฮสต์ไว้ได้เฉพาะสำหรับบิลด์ OpenClaw ทางการ/TestFlight
- เพื่อป้องกันไม่ให้ gateway หนึ่งส่งพุชปลุกไปยังอุปกรณ์ iOS ที่เป็นของ gateway อื่น

บิลด์ในเครื่อง/ด้วยตนเองยังคงใช้ APNs โดยตรง หากคุณกำลังทดสอบบิลด์เหล่านั้นโดยไม่มีรีเลย์
gateway ยังคงต้องมีข้อมูลประจำตัว APNs โดยตรง:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

ค่าเหล่านี้คือ env vars ขณะรันบนโฮสต์ gateway ไม่ใช่การตั้งค่า Fastlane `apps/ios/fastlane/.env` เก็บเฉพาะ
auth ของ App Store Connect / TestFlight เช่น `APP_STORE_CONNECT_KEY_ID` และ
`APP_STORE_CONNECT_ISSUER_ID`; ไม่ได้กำหนดค่าการส่ง APNs โดยตรงสำหรับบิลด์ iOS ในเครื่อง

พื้นที่จัดเก็บที่แนะนำบนโฮสต์ gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

อย่า commit ไฟล์ `.p8` หรือวางไว้ใต้ repo checkout

## เส้นทางการค้นหา

### Bonjour (LAN)

แอป iOS เรียกดู `_openclaw-gw._tcp` บน `local.` และเมื่อกำหนดค่าไว้ จะเรียกดู
โดเมนค้นหา DNS-SD แบบ wide-area เดียวกันด้วย Gateway ใน LAN เดียวกันจะปรากฏโดยอัตโนมัติจาก `local.`;
การค้นหาข้ามเครือข่ายสามารถใช้โดเมน wide-area ที่กำหนดค่าไว้ได้โดยไม่ต้องเปลี่ยนชนิดบีคอน

### Tailnet (ข้ามเครือข่าย)

หาก mDNS ถูกบล็อก ให้ใช้โซน unicast DNS-SD (เลือกโดเมน; ตัวอย่าง:
`openclaw.internal.`) และ Tailscale split DNS
ดูตัวอย่าง CoreDNS ได้ที่ [Bonjour](/th/gateway/bonjour)

### โฮสต์/พอร์ตแบบกำหนดเอง

ใน Settings ให้เปิดใช้ **Manual Host** แล้วป้อนโฮสต์ gateway + พอร์ต (ค่าเริ่มต้น `18789`)

## Canvas + A2UI

โหนด iOS เรนเดอร์ canvas ของ WKWebView ใช้ `node.invoke` เพื่อควบคุม:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

หมายเหตุ:

- โฮสต์ canvas ของ Gateway ให้บริการ `/__openclaw__/canvas/` และ `/__openclaw__/a2ui/`
- ให้บริการจากเซิร์ฟเวอร์ HTTP ของ Gateway (พอร์ตเดียวกับ `gateway.port`, ค่าเริ่มต้น `18789`)
- โหนด iOS คง scaffold ในตัวไว้เป็นมุมมองเริ่มต้นเมื่อเชื่อมต่อ `canvas.a2ui.push` และ `canvas.a2ui.reset` ใช้หน้า A2UI ที่บันเดิลและเป็นของแอป
- หน้า A2UI ของ Gateway ระยะไกลเป็นแบบแสดงผลอย่างเดียวบน iOS; การกระทำของปุ่ม A2UI แบบ native จะยอมรับเฉพาะจากหน้าที่บันเดิลและเป็นของแอปเท่านั้น
- กลับไปยัง scaffold ในตัวด้วย `canvas.navigate` และ `{"url":""}`

## ความสัมพันธ์กับ Computer Use

แอป iOS เป็นพื้นผิวโหนดมือถือ ไม่ใช่ backend ของ Codex Computer Use Codex
Computer Use และ `cua-driver mcp` ควบคุมเดสก์ท็อป macOS ในเครื่องผ่านเครื่องมือ MCP;
แอป iOS เปิดเผยความสามารถของ iPhone ผ่านคำสั่งโหนดของ OpenClaw
เช่น `canvas.*`, `camera.*`, `screen.*`, `location.*` และ `talk.*`

เอเจนต์ยังสามารถทำงานกับแอป iOS ผ่าน OpenClaw ได้โดยเรียกใช้คำสั่งโหนด
แต่การเรียกเหล่านั้นไปผ่านโปรโตคอลโหนดของ gateway และเป็นไปตามข้อจำกัด foreground/background ของ iOS
ใช้ [Codex Computer Use](/th/plugins/codex-computer-use)
สำหรับการควบคุมเดสก์ท็อปในเครื่อง และใช้หน้านี้สำหรับความสามารถของโหนด iOS

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## การปลุกด้วยเสียง + โหมดพูดคุย

- การปลุกด้วยเสียงและโหมดพูดคุยพร้อมใช้งานใน Settings
- โหนด iOS ที่รองรับการพูดคุยประกาศความสามารถ `talk` และสามารถประกาศ
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` และ `talk.ptt.once`;
  Gateway อนุญาตคำสั่ง push-to-talk เหล่านั้นโดยค่าเริ่มต้นสำหรับโหนด
  ที่รองรับ Talk และเชื่อถือได้
- iOS อาจระงับเสียงเบื้องหลัง; ให้ถือว่าฟีเจอร์เสียงเป็นแบบ best-effort เมื่อแอปไม่ active

## ข้อผิดพลาดที่พบบ่อย

- `NODE_BACKGROUND_UNAVAILABLE`: นำแอป iOS มาไว้ foreground (คำสั่ง canvas/camera/screen ต้องใช้สิ่งนี้)
- `A2UI_HOST_UNAVAILABLE`: หน้า A2UI ที่บันเดิลไม่สามารถเข้าถึงได้ใน WebView ของแอป; ให้แอปอยู่ foreground บนแท็บ Screen แล้วลองอีกครั้ง
- พรอมป์จับคู่ไม่ปรากฏ: รัน `openclaw devices list` แล้วอนุมัติด้วยตนเอง
- เชื่อมต่อใหม่ล้มเหลวหลังติดตั้งใหม่: โทเค็นการจับคู่ใน Keychain ถูกล้างแล้ว; จับคู่โหนดใหม่

## เอกสารที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [การค้นหา](/th/gateway/discovery)
- [Bonjour](/th/gateway/bonjour)
