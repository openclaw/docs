---
read_when:
    - การจับคู่หรือเชื่อมต่อโหนด iOS อีกครั้ง
    - การเรียกใช้แอป iOS จากซอร์สโค้ด
    - การดีบักการค้นพบ Gateway หรือคำสั่งแคนวาส
summary: 'แอป Node บน iOS: เชื่อมต่อกับ Gateway, การจับคู่, แคนวาส, และการแก้ไขปัญหา'
title: แอป iOS
x-i18n:
    generated_at: "2026-07-02T08:55:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f58f5a3a4c6f918ddca493367554c2df5a34292deeb112296103dce2203743
    source_path: platforms/ios.md
    workflow: 16
---

ความพร้อมใช้งาน: บิลด์แอป iPhone เผยแพร่ผ่านช่องทางของ Apple เมื่อเปิดใช้สำหรับรีลีส บิลด์สำหรับการพัฒนาในเครื่องยังสามารถรันจากซอร์สได้ด้วย

## สิ่งที่ทำได้

- เชื่อมต่อกับ Gateway ผ่าน WebSocket (LAN หรือ tailnet)
- เปิดเผยความสามารถของ Node: Canvas, สแนปช็อตหน้าจอ, การจับภาพจากกล้อง, ตำแหน่ง, โหมด Talk, การปลุกด้วยเสียง
- รับคำสั่ง `node.invoke` และรายงานเหตุการณ์สถานะของ Node

## ข้อกำหนด

- Gateway ที่รันอยู่บนอุปกรณ์อื่น (macOS, Linux หรือ Windows ผ่าน WSL2)
- เส้นทางเครือข่าย:
  - LAN เดียวกันผ่าน Bonjour, **หรือ**
  - Tailnet ผ่าน unicast DNS-SD (โดเมนตัวอย่าง: `openclaw.internal.`), **หรือ**
  - โฮสต์/พอร์ตแบบกำหนดเอง (fallback)

## เริ่มต้นอย่างรวดเร็ว (จับคู่ + เชื่อมต่อ)

1. เริ่ม Gateway:

```bash
openclaw gateway --port 18789
```

2. ในแอป iOS ให้เปิด Settings แล้วเลือก Gateway ที่ค้นพบ (หรือเปิดใช้ Manual Host แล้วป้อนโฮสต์/พอร์ต)

3. อนุมัติคำขอจับคู่บนโฮสต์ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

หากแอปลองจับคู่อีกครั้งพร้อมรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (บทบาท/ขอบเขต/กุญแจสาธารณะ)
คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะสร้าง `requestId` ใหม่
รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

ตัวเลือกเสริม: หาก Node iOS เชื่อมต่อจากซับเน็ตที่ควบคุมอย่างเข้มงวดเสมอ คุณ
สามารถเลือกเปิดใช้การอนุมัติ Node อัตโนมัติในครั้งแรกด้วย CIDR ที่ระบุชัดเจนหรือ IP แบบเจาะจง:

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
ไม่มีการร้องขอขอบเขตเท่านั้น การจับคู่แบบผู้ปฏิบัติการ/เบราว์เซอร์ และการเปลี่ยนแปลงบทบาท ขอบเขต เมทาดาทา หรือ
กุญแจสาธารณะใดๆ ยังคงต้องอนุมัติด้วยตนเอง

4. ตรวจสอบการเชื่อมต่อ:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## การ push ที่รองรับด้วย relay สำหรับบิลด์ทางการ

บิลด์ iOS ทางการที่เผยแพร่จะใช้ relay สำหรับ push ภายนอกแทนการเผยแพร่โทเค็น APNs
ดิบไปยัง Gateway

บิลด์ App Store ทางการจากช่องทางรีลีสสาธารณะใช้ relay ที่โฮสต์ไว้ที่ `https://ios-push-relay.openclaw.ai`

การดีพลอย relay แบบกำหนดเองต้องใช้เส้นทางบิลด์/ดีพลอย iOS ที่แยกไว้โดยตั้งใจ ซึ่ง URL ของ relay ตรงกับ URL relay ของ Gateway ช่องทางรีลีส App Store สาธารณะไม่ยอมรับการ override URL relay แบบกำหนดเอง หากคุณใช้บิลด์ relay แบบกำหนดเอง ให้ตั้งค่า URL relay ของ Gateway ให้ตรงกัน:

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

โฟลว์ทำงานอย่างไร:

- แอป iOS ลงทะเบียนกับ relay โดยใช้ App Attest และ StoreKit app transaction JWS
- relay ส่งคืน handle ของ relay แบบทึบ พร้อมสิทธิ์ส่งที่ผูกกับการลงทะเบียน
- แอป iOS ดึงข้อมูลตัวตนของ Gateway ที่จับคู่ไว้และใส่ไว้ในการลงทะเบียน relay ดังนั้นการลงทะเบียนที่รองรับด้วย relay จึงถูกมอบหมายให้กับ Gateway เฉพาะนั้น
- แอปส่งต่อการลงทะเบียนที่รองรับด้วย relay นั้นไปยัง Gateway ที่จับคู่ไว้ด้วย `push.apns.register`
- Gateway ใช้ handle ของ relay ที่เก็บไว้นั้นสำหรับ `push.test`, การปลุกเบื้องหลัง และการสะกิดปลุก
- URL relay ของ Gateway แบบกำหนดเองต้องตรงกับ URL relay ที่ฝังอยู่ในบิลด์ iOS
- หากภายหลังแอปเชื่อมต่อกับ Gateway อื่น หรือบิลด์ที่มี URL พื้นฐานของ relay ต่างกัน แอปจะรีเฟรชการลงทะเบียน relay แทนการนำ binding เก่ามาใช้ซ้ำ

สิ่งที่ Gateway **ไม่** ต้องมีสำหรับเส้นทางนี้:

- ไม่มีโทเค็น relay ระดับการดีพลอย
- ไม่มีกุญแจ APNs โดยตรงสำหรับการส่งแบบรองรับด้วย relay ของ App Store ทางการ

โฟลว์ที่คาดหวังสำหรับผู้ปฏิบัติการ:

1. ติดตั้งแอป iOS ทางการ
2. ตัวเลือกเสริม: ตั้งค่า `gateway.push.apns.relay.baseUrl` บน Gateway เฉพาะเมื่อใช้บิลด์ relay แบบกำหนดเองที่แยกไว้โดยตั้งใจ
3. จับคู่แอปกับ Gateway แล้วปล่อยให้เชื่อมต่อจนเสร็จ
4. แอปเผยแพร่ `push.apns.register` โดยอัตโนมัติหลังจากมีโทเค็น APNs, เซสชันผู้ปฏิบัติการเชื่อมต่อแล้ว และการลงทะเบียน relay สำเร็จ
5. หลังจากนั้น `push.test`, การปลุกเพื่อเชื่อมต่อใหม่ และการสะกิดปลุกสามารถใช้การลงทะเบียนที่รองรับด้วย relay ซึ่งเก็บไว้ได้

## Beacon แสดงการยังทำงานในเบื้องหลัง

เมื่อ iOS ปลุกแอปสำหรับ silent push, background refresh หรือเหตุการณ์ significant-location แอปจะ
พยายามเชื่อมต่อ Node ใหม่แบบสั้นๆ แล้วเรียก `node.event` พร้อม `event: "node.presence.alive"`
Gateway บันทึกค่านี้เป็น `lastSeenAtMs`/`lastSeenReason` บนเมทาดาทาของ Node/อุปกรณ์ที่จับคู่ไว้เท่านั้น
หลังจากทราบตัวตนอุปกรณ์ Node ที่ยืนยันตัวตนแล้ว

แอปถือว่าการปลุกเบื้องหลังถูกบันทึกสำเร็จเฉพาะเมื่อการตอบกลับจาก Gateway มี
`handled: true` Gateway รุ่นเก่าอาจตอบรับ `node.event` ด้วย `{ "ok": true }`; การตอบกลับนั้น
เข้ากันได้แต่ไม่นับเป็นการอัปเดต last-seen ที่คงทน

หมายเหตุด้านความเข้ากันได้:

- `OPENCLAW_APNS_RELAY_BASE_URL` ยังใช้งานได้เป็น env override ชั่วคราวสำหรับ Gateway
- ช่องทางรีลีส App Store สาธารณะปฏิเสธ `OPENCLAW_PUSH_RELAY_BASE_URL` สำหรับบิลด์ iOS

## การยืนยันตัวตนและโฟลว์ความเชื่อถือ

relay มีไว้เพื่อบังคับใช้ข้อจำกัดสองข้อที่ APNs โดยตรงบน Gateway ไม่สามารถให้ได้สำหรับ
บิลด์ iOS ทางการ:

- เฉพาะบิลด์ iOS ของ OpenClaw ของแท้ที่เผยแพร่ผ่าน Apple เท่านั้นที่ใช้ relay ที่โฮสต์ไว้ได้
- Gateway สามารถส่ง push ที่รองรับด้วย relay ได้เฉพาะสำหรับอุปกรณ์ iOS ที่จับคู่กับ Gateway เฉพาะนั้น

ทีละ hop:

1. `iOS app -> gateway`
   - แอปจับคู่กับ Gateway ก่อนผ่านโฟลว์การยืนยันตัวตน Gateway ปกติ
   - สิ่งนี้มอบเซสชัน Node ที่ยืนยันตัวตนแล้ว พร้อมเซสชันผู้ปฏิบัติการที่ยืนยันตัวตนแล้วให้แอป
   - เซสชันผู้ปฏิบัติการใช้เพื่อเรียก `gateway.identity.get`

2. `iOS app -> relay`
   - แอปเรียก endpoint การลงทะเบียนของ relay ผ่าน HTTPS
   - การลงทะเบียนมีหลักฐาน App Attest พร้อม StoreKit app transaction JWS
   - relay ตรวจสอบ bundle ID, หลักฐาน App Attest และหลักฐานการเผยแพร่ของ Apple และกำหนดให้ใช้
     เส้นทางการเผยแพร่ทางการ/production
   - นี่คือสิ่งที่บล็อกไม่ให้บิลด์ Xcode/dev ในเครื่องใช้ relay ที่โฮสต์ไว้ บิลด์ในเครื่องอาจ
     ลงนามแล้ว แต่ไม่เป็นไปตามหลักฐานการเผยแพร่ Apple ทางการที่ relay คาดหวัง

3. `gateway identity delegation`
   - ก่อนลงทะเบียน relay แอปดึงข้อมูลตัวตนของ Gateway ที่จับคู่ไว้จาก
     `gateway.identity.get`
   - แอปใส่ตัวตน Gateway นั้นไว้ใน payload การลงทะเบียน relay
   - relay ส่งคืน handle ของ relay และสิทธิ์ส่งที่ผูกกับการลงทะเบียน ซึ่งถูกมอบหมายให้กับ
     ตัวตน Gateway นั้น

4. `gateway -> relay`
   - Gateway เก็บ handle ของ relay และสิทธิ์ส่งจาก `push.apns.register`
   - เมื่อใช้ `push.test`, การปลุกเพื่อเชื่อมต่อใหม่ และการสะกิดปลุก Gateway จะลงนามคำขอส่งด้วย
     ตัวตนอุปกรณ์ของตนเอง
   - relay ตรวจสอบทั้งสิทธิ์ส่งที่เก็บไว้และลายเซ็น Gateway เทียบกับตัวตน
     Gateway ที่ได้รับมอบหมายจากการลงทะเบียน
   - Gateway อื่นไม่สามารถนำการลงทะเบียนที่เก็บไว้นั้นไปใช้ซ้ำได้ แม้ว่าจะได้ handle มาด้วยวิธีใดก็ตาม

5. `relay -> APNs`
   - relay เป็นเจ้าของข้อมูลรับรอง APNs สำหรับ production และโทเค็น APNs ดิบสำหรับบิลด์ทางการ
   - Gateway ไม่เคยเก็บโทเค็น APNs ดิบสำหรับบิลด์ทางการที่รองรับด้วย relay
   - relay ส่ง push ขั้นสุดท้ายไปยัง APNs ในนามของ Gateway ที่จับคู่ไว้

เหตุผลที่สร้างการออกแบบนี้:

- เพื่อเก็บข้อมูลรับรอง APNs สำหรับ production ให้อยู่นอก Gateway ของผู้ใช้
- เพื่อหลีกเลี่ยงการจัดเก็บโทเค็น APNs ดิบของบิลด์ทางการบน Gateway
- เพื่ออนุญาตให้ใช้ relay ที่โฮสต์ไว้เฉพาะกับบิลด์ iOS ทางการของ OpenClaw
- เพื่อป้องกันไม่ให้ Gateway หนึ่งส่ง wake push ไปยังอุปกรณ์ iOS ที่เป็นของ Gateway อื่น

บิลด์ในเครื่อง/แบบกำหนดเองยังคงใช้ APNs โดยตรง หากคุณกำลังทดสอบบิลด์เหล่านั้นโดยไม่มี relay
Gateway ยังคงต้องมีข้อมูลรับรอง APNs โดยตรง:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

ค่าเหล่านี้คือ env vars ขณะรันบนโฮสต์ Gateway ไม่ใช่การตั้งค่า Fastlane `apps/ios/fastlane/.env` เก็บเฉพาะ
ข้อมูลยืนยันตัวตน App Store Connect เช่น `APP_STORE_CONNECT_KEY_ID` และ
`APP_STORE_CONNECT_ISSUER_ID`; ไม่ได้กำหนดค่าการส่ง APNs โดยตรงสำหรับบิลด์ iOS ในเครื่อง

พื้นที่จัดเก็บที่แนะนำบนโฮสต์ Gateway:

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

แอป iOS browse `_openclaw-gw._tcp` บน `local.` และเมื่อกำหนดค่าไว้ จะ browse โดเมน
การค้นหา DNS-SD แบบ wide-area เดียวกันด้วย Gateway ใน LAN เดียวกันจะปรากฏโดยอัตโนมัติจาก `local.`;
การค้นหาข้ามเครือข่ายสามารถใช้โดเมน wide-area ที่กำหนดค่าไว้ได้โดยไม่ต้องเปลี่ยนชนิด beacon

### Tailnet (ข้ามเครือข่าย)

หาก mDNS ถูกบล็อก ให้ใช้โซน unicast DNS-SD (เลือกโดเมน ตัวอย่าง:
`openclaw.internal.`) และ Tailscale split DNS
ดูตัวอย่าง CoreDNS ได้ที่ [Bonjour](/th/gateway/bonjour)

### โฮสต์/พอร์ตแบบกำหนดเอง

ใน Settings ให้เปิดใช้ **Manual Host** แล้วป้อนโฮสต์ Gateway + พอร์ต (ค่าเริ่มต้น `18789`)

## Canvas + A2UI

Node iOS เรนเดอร์ canvas ของ WKWebView ใช้ `node.invoke` เพื่อควบคุม:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

หมายเหตุ:

- โฮสต์ Canvas ของ Gateway ให้บริการ `/__openclaw__/canvas/` และ `/__openclaw__/a2ui/`
- ให้บริการจากเซิร์ฟเวอร์ HTTP ของ Gateway (พอร์ตเดียวกับ `gateway.port`, ค่าเริ่มต้น `18789`)
- Node iOS เก็บ scaffold ในตัวไว้เป็นมุมมองเริ่มต้นเมื่อเชื่อมต่อ `canvas.a2ui.push` และ `canvas.a2ui.reset` ใช้หน้า A2UI ที่เป็นของแอปและมาพร้อมบันเดิล
- หน้า A2UI ของ Gateway ระยะไกลเป็นแบบเรนเดอร์อย่างเดียวบน iOS; การกระทำของปุ่ม A2UI แบบ native จะยอมรับเฉพาะจากหน้าที่เป็นของแอปและมาพร้อมบันเดิลเท่านั้น
- กลับไปยัง scaffold ในตัวด้วย `canvas.navigate` และ `{"url":""}`

## ความสัมพันธ์กับ Computer Use

แอป iOS เป็นพื้นผิว Node บนมือถือ ไม่ใช่ backend ของ Codex Computer Use Codex
Computer Use และ `cua-driver mcp` ควบคุมเดสก์ท็อป macOS ในเครื่องผ่านเครื่องมือ MCP;
แอป iOS เปิดเผยความสามารถของ iPhone ผ่านคำสั่ง Node ของ OpenClaw
เช่น `canvas.*`, `camera.*`, `screen.*`, `location.*` และ `talk.*`

Agent ยังคงใช้งานแอป iOS ผ่าน OpenClaw ได้ด้วยการเรียกใช้คำสั่ง Node
แต่การเรียกเหล่านั้นผ่านโปรโตคอล Node ของ Gateway และเป็นไปตามข้อจำกัด foreground/background
ของ iOS ใช้ [Codex Computer Use](/th/plugins/codex-computer-use)
สำหรับการควบคุมเดสก์ท็อปในเครื่อง และใช้หน้านี้สำหรับความสามารถของ Node iOS

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## การปลุกด้วยเสียง + โหมด Talk

- การปลุกด้วยเสียงและโหมด Talk พร้อมใช้งานใน Settings
- Node iOS ที่รองรับ Talk จะประกาศความสามารถ `talk` และสามารถประกาศ
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` และ `talk.ptt.once`;
  Gateway อนุญาตคำสั่ง push-to-talk เหล่านั้นโดยค่าเริ่มต้นสำหรับ Node ที่รองรับ
  Talk และเชื่อถือได้
- iOS อาจระงับเสียงเบื้องหลัง; ให้ถือว่าฟีเจอร์เสียงเป็น best-effort เมื่อแอปไม่ได้ทำงานอยู่

## ข้อผิดพลาดทั่วไป

- `NODE_BACKGROUND_UNAVAILABLE`: นำแอป iOS ขึ้นมาอยู่เบื้องหน้า (คำสั่ง canvas/camera/screen ต้องใช้สิ่งนี้)
- `A2UI_HOST_UNAVAILABLE`: หน้า A2UI ที่มาพร้อมบันเดิลไม่สามารถเข้าถึงได้ใน WebView ของแอป; ให้แอปอยู่เบื้องหน้าบนแท็บ Screen แล้วลองอีกครั้ง
- พรอมป์การจับคู่ไม่ปรากฏ: รัน `openclaw devices list` แล้วอนุมัติด้วยตนเอง
- เชื่อมต่อใหม่ล้มเหลวหลังติดตั้งใหม่: โทเค็นการจับคู่ใน Keychain ถูกล้างแล้ว; จับคู่ Node ใหม่

## เอกสารที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [การค้นหา](/th/gateway/discovery)
- [Bonjour](/th/gateway/bonjour)
