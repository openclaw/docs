---
read_when:
    - การจับคู่หรือเชื่อมต่อ Node ของ iOS ใหม่
    - การเรียกใช้แอป iOS จากซอร์ส
    - การดีบักการค้นพบ Gateway หรือคำสั่ง canvas
summary: 'แอป Node บน iOS: เชื่อมต่อกับ Gateway, การจับคู่, แคนวาส และการแก้ไขปัญหา'
title: แอป iOS
x-i18n:
    generated_at: "2026-05-07T13:22:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 707f8b97156e800f89bc00265c1889c9cbade347fde35f037a302065956346f4
    source_path: platforms/ios.md
    workflow: 16
---

สถานะพร้อมใช้: พรีวิวภายใน แอป iOS ยังไม่ได้เผยแพร่สู่สาธารณะ

## สิ่งที่ทำได้

- เชื่อมต่อกับ Gateway ผ่าน WebSocket (LAN หรือ tailnet)
- เปิดเผยความสามารถของ Node: Canvas, สแนปช็อตหน้าจอ, การจับภาพจากกล้อง, ตำแหน่ง, โหมด Talk, Voice wake
- รับคำสั่ง `node.invoke` และรายงานเหตุการณ์สถานะของ Node

## ข้อกำหนด

- Gateway ที่ทำงานอยู่บนอุปกรณ์อื่น (macOS, Linux หรือ Windows ผ่าน WSL2)
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

3. อนุมัติคำขอจับคู่บนโฮสต์ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

หากแอปพยายามจับคู่อีกครั้งด้วยรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (บทบาท/ขอบเขต/คีย์สาธารณะ)
คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะสร้าง `requestId` ใหม่
ให้รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

ตัวเลือกเสริม: หาก Node iOS เชื่อมต่อจากซับเน็ตที่ควบคุมอย่างเข้มงวดเสมอ คุณ
สามารถเลือกใช้การอนุมัติ Node อัตโนมัติครั้งแรกด้วย CIDR หรือ IP ที่ระบุชัดเจน:

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

ค่านี้ปิดไว้ตามค่าเริ่มต้น ใช้เฉพาะกับการจับคู่ `role: node` ใหม่
ที่ไม่มีขอบเขตที่ร้องขอเท่านั้น การจับคู่ Operator/เบราว์เซอร์ และการเปลี่ยนบทบาท ขอบเขต เมทาดาตา หรือ
คีย์สาธารณะใดๆ ยังคงต้องอนุมัติด้วยตนเอง

4. ตรวจสอบการเชื่อมต่อ:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push ที่รองรับด้วย relay สำหรับบิลด์ทางการ

บิลด์ iOS ที่เผยแพร่อย่างเป็นทางการใช้ push relay ภายนอกแทนการเผยแพร่โทเค็น APNs แบบดิบ
ไปยัง Gateway

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

- แอป iOS ลงทะเบียนกับ relay โดยใช้ App Attest และ StoreKit app transaction JWS
- relay ส่งคืน relay handle แบบทึบ พร้อม send grant ที่ผูกกับขอบเขตการลงทะเบียน
- แอป iOS ดึงตัวตนของ gateway ที่จับคู่ไว้ และรวมไว้ในการลงทะเบียน relay ดังนั้นการลงทะเบียนที่รองรับด้วย relay จึงถูกมอบหมายให้ gateway เฉพาะนั้น
- แอปส่งต่อการลงทะเบียนที่รองรับด้วย relay นั้นไปยัง Gateway ที่จับคู่ไว้ด้วย `push.apns.register`
- Gateway ใช้ relay handle ที่จัดเก็บไว้นั้นสำหรับ `push.test`, การ wake เบื้องหลัง และ wake nudge
- URL ฐาน relay ของ Gateway ต้องตรงกับ URL relay ที่ฝังอยู่ในบิลด์ iOS ทางการ/TestFlight
- หากภายหลังแอปเชื่อมต่อกับ Gateway อื่น หรือบิลด์ที่มี URL ฐาน relay ต่างกัน แอปจะรีเฟรชการลงทะเบียน relay แทนการใช้ binding เก่าซ้ำ

สิ่งที่ Gateway **ไม่** ต้องใช้สำหรับเส้นทางนี้:

- ไม่ต้องมีโทเค็น relay ระดับ deployment
- ไม่ต้องมีคีย์ APNs โดยตรงสำหรับการส่งแบบ relay-backed ในบิลด์ทางการ/TestFlight

โฟลว์ที่คาดหวังสำหรับ operator:

1. ติดตั้งบิลด์ iOS ทางการ/TestFlight
2. ตั้งค่า `gateway.push.apns.relay.baseUrl` บน Gateway
3. จับคู่แอปกับ Gateway แล้วปล่อยให้เชื่อมต่อจนเสร็จ
4. แอปเผยแพร่ `push.apns.register` โดยอัตโนมัติหลังจากมีโทเค็น APNs, เซสชัน operator เชื่อมต่อแล้ว และการลงทะเบียน relay สำเร็จ
5. หลังจากนั้น `push.test`, การ wake เพื่อเชื่อมต่อใหม่ และ wake nudge สามารถใช้การลงทะเบียน relay-backed ที่จัดเก็บไว้ได้

## Beacon แสดงว่ายังมีชีวิตในเบื้องหลัง

เมื่อ iOS wake แอปจาก silent push, background refresh หรือเหตุการณ์ significant-location แอป
จะพยายามเชื่อมต่อ Node ใหม่ช่วงสั้นๆ แล้วเรียก `node.event` ด้วย `event: "node.presence.alive"`
Gateway บันทึกสิ่งนี้เป็น `lastSeenAtMs`/`lastSeenReason` บนเมทาดาตาของ Node/อุปกรณ์ที่จับคู่ไว้เท่านั้น
หลังจากรู้ตัวตนอุปกรณ์ Node ที่ผ่านการยืนยันตัวตนแล้ว

แอปถือว่า background wake ถูกบันทึกสำเร็จก็ต่อเมื่อการตอบกลับของ Gateway มี
`handled: true` Gateway รุ่นเก่าอาจตอบรับ `node.event` ด้วย `{ "ok": true }`; การตอบกลับนั้น
เข้ากันได้ แต่ไม่นับเป็นการอัปเดต last-seen ที่คงทน

หมายเหตุความเข้ากันได้:

- `OPENCLAW_APNS_RELAY_BASE_URL` ยังใช้งานได้เป็น env override ชั่วคราวสำหรับ Gateway

## โฟลว์การยืนยันตัวตนและความเชื่อถือ

relay มีไว้เพื่อบังคับใช้ข้อจำกัดสองข้อที่ APNs โดยตรงบน Gateway ไม่สามารถให้ได้สำหรับ
บิลด์ iOS ทางการ:

- เฉพาะบิลด์ iOS ของ OpenClaw ของแท้ที่เผยแพร่ผ่าน Apple เท่านั้นที่ใช้ hosted relay ได้
- Gateway ส่ง push แบบ relay-backed ได้เฉพาะสำหรับอุปกรณ์ iOS ที่จับคู่กับ Gateway เฉพาะนั้น

ทีละ hop:

1. `iOS app -> gateway`
   - แอปจับคู่กับ Gateway ผ่านโฟลว์ยืนยันตัวตนปกติของ Gateway ก่อน
   - สิ่งนี้ทำให้แอปมีเซสชัน Node ที่ผ่านการยืนยันตัวตน พร้อมเซสชัน operator ที่ผ่านการยืนยันตัวตน
   - เซสชัน operator ใช้เรียก `gateway.identity.get`

2. `iOS app -> relay`
   - แอปเรียก endpoint การลงทะเบียนของ relay ผ่าน HTTPS
   - การลงทะเบียนมีหลักฐาน App Attest พร้อม StoreKit app transaction JWS
   - relay ตรวจสอบ bundle ID, หลักฐาน App Attest และหลักฐานการเผยแพร่ของ Apple และกำหนดให้ใช้
     เส้นทางการเผยแพร่ทางการ/production
   - นี่คือสิ่งที่บล็อกบิลด์ Xcode/dev ภายในเครื่องไม่ให้ใช้ hosted relay บิลด์ภายในเครื่องอาจ
     ถูก signed แล้ว แต่ไม่ตรงตามหลักฐานการเผยแพร่ทางการของ Apple ที่ relay คาดหวัง

3. `gateway identity delegation`
   - ก่อนการลงทะเบียน relay แอปดึงตัวตนของ Gateway ที่จับคู่ไว้จาก
     `gateway.identity.get`
   - แอปรวมตัวตนของ Gateway นั้นไว้ใน payload การลงทะเบียน relay
   - relay ส่งคืน relay handle และ send grant ที่ผูกกับขอบเขตการลงทะเบียน ซึ่งถูกมอบหมายให้
     ตัวตน Gateway นั้น

4. `gateway -> relay`
   - Gateway จัดเก็บ relay handle และ send grant จาก `push.apns.register`
   - เมื่อ `push.test`, การ wake เพื่อเชื่อมต่อใหม่ และ wake nudge, Gateway ลงนามคำขอส่งด้วย
     ตัวตนอุปกรณ์ของตัวเอง
   - relay ตรวจสอบทั้ง send grant ที่จัดเก็บไว้และลายเซ็นของ Gateway เทียบกับตัวตน
     Gateway ที่ถูกมอบหมายจากการลงทะเบียน
   - Gateway อื่นไม่สามารถใช้การลงทะเบียนที่จัดเก็บไว้นั้นซ้ำได้ แม้จะได้ handle มาด้วยวิธีใดก็ตาม

5. `relay -> APNs`
   - relay เป็นเจ้าของข้อมูลประจำตัว APNs production และโทเค็น APNs แบบดิบสำหรับบิลด์ทางการ
   - Gateway ไม่เคยจัดเก็บโทเค็น APNs แบบดิบสำหรับบิลด์ทางการที่รองรับด้วย relay
   - relay ส่ง push สุดท้ายไปยัง APNs ในนามของ Gateway ที่จับคู่ไว้

เหตุผลที่สร้างการออกแบบนี้:

- เพื่อเก็บข้อมูลประจำตัว APNs production ไม่ให้อยู่ใน Gateway ของผู้ใช้
- เพื่อหลีกเลี่ยงการจัดเก็บโทเค็น APNs ของบิลด์ทางการแบบดิบบน Gateway
- เพื่ออนุญาตให้ใช้ hosted relay เฉพาะสำหรับบิลด์ OpenClaw ทางการ/TestFlight
- เพื่อป้องกันไม่ให้ Gateway หนึ่งส่ง wake push ไปยังอุปกรณ์ iOS ที่เป็นของ Gateway อื่น

บิลด์ local/manual ยังคงใช้ APNs โดยตรง หากคุณกำลังทดสอบบิลด์เหล่านั้นโดยไม่ใช้ relay
Gateway ยังต้องใช้ข้อมูลประจำตัว APNs โดยตรง:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

สิ่งเหล่านี้เป็น env var runtime ของโฮสต์ Gateway ไม่ใช่การตั้งค่า Fastlane `apps/ios/fastlane/.env` จัดเก็บเฉพาะ
การยืนยันตัวตน App Store Connect / TestFlight เช่น `ASC_KEY_ID` และ `ASC_ISSUER_ID`; ไม่ได้กำหนดค่า
การส่ง APNs โดยตรงสำหรับบิลด์ iOS ภายในเครื่อง

พื้นที่จัดเก็บที่แนะนำบนโฮสต์ Gateway:

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

แอป iOS browse `_openclaw-gw._tcp` บน `local.` และเมื่อกำหนดค่าไว้ จะ browse โดเมน discovery
wide-area DNS-SD เดียวกันด้วย Gateway บน LAN เดียวกันจะปรากฏโดยอัตโนมัติจาก `local.`;
การค้นพบข้ามเครือข่ายสามารถใช้โดเมน wide-area ที่กำหนดค่าไว้โดยไม่ต้องเปลี่ยนชนิด beacon

### Tailnet (ข้ามเครือข่าย)

หาก mDNS ถูกบล็อก ให้ใช้โซน unicast DNS-SD (เลือกโดเมน; ตัวอย่าง:
`openclaw.internal.`) และ Tailscale split DNS
ดูตัวอย่าง CoreDNS ได้ที่ [Bonjour](/th/gateway/bonjour)

### โฮสต์/พอร์ตแบบกำหนดเอง

ใน Settings ให้เปิดใช้ **Manual Host** แล้วป้อนโฮสต์ Gateway + พอร์ต (ค่าเริ่มต้น `18789`)

## Canvas + A2UI

Node iOS render Canvas แบบ WKWebView ใช้ `node.invoke` เพื่อควบคุม:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

หมายเหตุ:

- โฮสต์ Canvas ของ Gateway ให้บริการ `/__openclaw__/canvas/` และ `/__openclaw__/a2ui/`
- ให้บริการจากเซิร์ฟเวอร์ HTTP ของ Gateway (พอร์ตเดียวกับ `gateway.port`, ค่าเริ่มต้น `18789`)
- Node iOS นำทางไปยัง A2UI โดยอัตโนมัติเมื่อเชื่อมต่อ หากมีการประกาศ URL โฮสต์ Canvas
- กลับไปยัง scaffold ในตัวด้วย `canvas.navigate` และ `{"url":""}`

## ความสัมพันธ์กับ Computer Use

แอป iOS เป็นพื้นผิว Node บนมือถือ ไม่ใช่ backend ของ Codex Computer Use Codex
Computer Use และ `cua-driver mcp` ควบคุมเดสก์ท็อป macOS ภายในเครื่องผ่านเครื่องมือ MCP;
แอป iOS เปิดเผยความสามารถของ iPhone ผ่านคำสั่ง Node ของ OpenClaw
เช่น `canvas.*`, `camera.*`, `screen.*`, `location.*` และ `talk.*`

Agents ยังคงใช้งานแอป iOS ผ่าน OpenClaw ได้ด้วยการเรียกคำสั่ง Node
แต่การเรียกเหล่านั้นผ่านโปรโตคอล Node ของ Gateway และเป็นไปตามขีดจำกัด foreground/background ของ iOS
ใช้ [Codex Computer Use](/th/plugins/codex-computer-use)
สำหรับการควบคุมเดสก์ท็อปภายในเครื่อง และใช้หน้านี้สำหรับความสามารถของ Node iOS

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + โหมด Talk

- Voice wake และโหมด Talk พร้อมใช้งานใน Settings
- Node iOS ที่รองรับ Talk จะประกาศความสามารถ `talk` และสามารถประกาศ
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` และ `talk.ptt.once`;
  Gateway อนุญาตคำสั่ง push-to-talk เหล่านั้นตามค่าเริ่มต้นสำหรับ Node
  ที่รองรับ Talk และเชื่อถือได้
- iOS อาจระงับเสียงเบื้องหลัง; ให้ถือว่าฟีเจอร์เสียงเป็น best-effort เมื่อแอปไม่ได้ active

## ข้อผิดพลาดทั่วไป

- `NODE_BACKGROUND_UNAVAILABLE`: นำแอป iOS มายัง foreground (คำสั่ง canvas/camera/screen ต้องใช้สถานะนี้)
- `A2UI_HOST_NOT_CONFIGURED`: Gateway ไม่ได้ประกาศ URL พื้นผิว Plugin Canvas; ตรวจสอบ `plugins.entries.canvas.config.host` ใน [การกำหนดค่า Gateway](/th/gateway/configuration)
- prompt การจับคู่ไม่ปรากฏ: รัน `openclaw devices list` แล้วอนุมัติด้วยตนเอง
- การเชื่อมต่อใหม่ล้มเหลวหลังติดตั้งใหม่: โทเค็นการจับคู่ใน Keychain ถูกล้างแล้ว; จับคู่ Node อีกครั้ง

## เอกสารที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [การค้นพบ](/th/gateway/discovery)
- [Bonjour](/th/gateway/bonjour)
