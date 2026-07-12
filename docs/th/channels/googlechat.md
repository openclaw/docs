---
read_when:
    - การพัฒนาฟีเจอร์ของช่องทาง Google Chat
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าแอป Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-07-12T15:45:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72a08c41f7da019f91265cbf7ae73134a0767c603449ebd8cd9a5354936a3b52
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat ทำงานในรูปแบบ Plugin อย่างเป็นทางการ `@openclaw/googlechat`: รองรับข้อความส่วนตัวและพื้นที่ผ่าน Webhook ของ Google Chat API (เฉพาะปลายทาง HTTP ไม่มี Pub/Sub)

## ติดตั้ง

```bash
openclaw plugins install @openclaw/googlechat
```

เช็กเอาต์ภายในเครื่อง (เมื่อเรียกใช้จากคลัง git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## การตั้งค่าด่วน (สำหรับผู้เริ่มต้น)

1. สร้างโปรเจกต์ Google Cloud และเปิดใช้ **Google Chat API**
   - ไปที่: [ข้อมูลเข้าสู่ระบบ Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - เปิดใช้ API หากยังไม่ได้เปิดใช้
2. สร้าง **Service Account**:
   - กด **Create Credentials** > **Service Account**
   - ตั้งชื่อตามต้องการ (เช่น `openclaw-chat`)
   - เว้นสิทธิ์และตัวการหลักไว้โดยไม่ต้องกรอก (**Continue** แล้วตามด้วย **Done**)
3. สร้างและดาวน์โหลด **คีย์ JSON**:
   - คลิก Service Account ใหม่ > แท็บ **Keys** > **Add Key** > **Create new key** > **JSON** > **Create**
4. จัดเก็บไฟล์ JSON ที่ดาวน์โหลดไว้บนโฮสต์ Gateway ของคุณ (เช่น `~/.openclaw/googlechat-service-account.json`)
5. สร้างแอป Google Chat ใน [การกำหนดค่า Chat ของ Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - กรอก **Application info** (ชื่อแอป, URL รูปประจำตัว, คำอธิบาย)
   - เปิดใช้ **Interactive features**
   - ภายใต้ **Functionality** ให้เลือก **Join spaces and group conversations**
   - ภายใต้ **Connection settings** ให้เลือก **HTTP endpoint URL**
   - ภายใต้ **Triggers** ให้เลือก **Use a common HTTP endpoint URL for all triggers** และตั้งค่าเป็น URL Gateway สาธารณะของคุณตามด้วย `/googlechat` (ดู [URL สาธารณะ](#public-url-webhook-only))
   - ภายใต้ **Visibility** ให้เลือก **Make this Chat app available to specific people and groups in `<Your Domain>`** และป้อนที่อยู่อีเมลของคุณ
   - คลิก **Save**
6. เปิดใช้สถานะแอป: รีเฟรชหน้า ค้นหา **App status** ตั้งค่าเป็น **Live - available to users** แล้วคลิก **Save** อีกครั้ง
7. กำหนดค่า OpenClaw ด้วย Service Account และกลุ่มเป้าหมายของ Webhook (ต้องตรงกับการกำหนดค่าแอป Chat):
   - ตัวแปรสภาพแวดล้อม: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (เฉพาะบัญชีเริ่มต้น) หรือ
   - การกำหนดค่า: ดู [จุดสำคัญของการกำหนดค่า](#config-highlights) นอกจากนี้ `openclaw channels add --channel googlechat` ยังรองรับ `--audience-type`, `--audience`, `--webhook-path` และ `--webhook-url`
8. เริ่ม Gateway จากนั้น Google Chat จะส่ง POST ไปยังพาธ Webhook ของคุณ (ค่าเริ่มต้นคือ `/googlechat`)

## เพิ่มลงใน Google Chat

เมื่อ Gateway ทำงานแล้วและอีเมลของคุณอยู่ในรายการการมองเห็น:

1. ไปที่ [Google Chat](https://chat.google.com/)
2. คลิกไอคอน **+** (บวก) ถัดจาก **Direct Messages**
3. ค้นหา **ชื่อแอป** ที่คุณกำหนดค่าไว้ใน Google Cloud Console
   - บอตจะ_ไม่_ปรากฏในรายการเรียกดูของ Marketplace เนื่องจากเป็นแอปส่วนตัว ให้ค้นหาด้วยชื่อ
4. เลือกบอต คลิก **Add** หรือ **Chat** แล้วส่งข้อความ

## URL สาธารณะ (เฉพาะ Webhook)

Webhook ของ Google Chat ต้องใช้ปลายทาง HTTPS สาธารณะ เพื่อความปลอดภัย ให้เปิดเผยต่ออินเทอร์เน็ต**เฉพาะพาธ `/googlechat`** และเก็บแดชบอร์ด OpenClaw รวมถึงปลายทางอื่นไว้เป็นส่วนตัว

### ตัวเลือก A: Tailscale Funnel (แนะนำ)

ใช้ Tailscale Serve สำหรับแดชบอร์ดส่วนตัว และใช้ Funnel สำหรับพาธ Webhook สาธารณะ

1. ตรวจสอบว่า Gateway ของคุณผูกอยู่กับที่อยู่ใด:

   ```bash
   ss -tlnp | grep 18789
   ```

   จด IP ไว้ (เช่น `127.0.0.1`, `0.0.0.0` หรือที่อยู่ Tailscale รูปแบบ `100.x.x.x`)

2. เปิดเผยแดชบอร์ดให้เฉพาะ tailnet (พอร์ต 8443):

   ```bash
   # หากผูกกับ localhost (127.0.0.1 หรือ 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # หากผูกกับ IP ของ Tailscale เท่านั้น:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. เปิดเผยต่อสาธารณะเฉพาะพาธ Webhook:

   ```bash
   # หากผูกกับ localhost (127.0.0.1 หรือ 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # หากผูกกับ IP ของ Tailscale เท่านั้น:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. หากระบบแจ้ง ให้ไปที่ URL การอนุญาตที่แสดงในผลลัพธ์เพื่อเปิดใช้ Funnel สำหรับ Node นี้

5. ตรวจสอบ:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

URL Webhook สาธารณะของคุณคือ `https://<node-name>.<tailnet>.ts.net/googlechat` ส่วนแดชบอร์ดยังคงเข้าถึงได้เฉพาะผ่าน tailnet ที่ `https://<node-name>.<tailnet>.ts.net:8443/` ใช้ URL สาธารณะ (โดยไม่มี `:8443`) ในการกำหนดค่าแอป Google Chat

> หมายเหตุ: การกำหนดค่านี้จะคงอยู่หลังการรีบูต หากต้องการนำออกภายหลัง ให้ใช้ `tailscale funnel reset` และ `tailscale serve reset`

### ตัวเลือก B: พร็อกซีย้อนกลับ (Caddy)

ทำพร็อกซีเฉพาะพาธ Webhook:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

คำขอไปยัง `your-domain.com/` จะถูกละเว้นหรือได้รับ 404 ขณะที่ `your-domain.com/googlechat` จะถูกกำหนดเส้นทางไปยัง OpenClaw

### ตัวเลือก C: Cloudflare Tunnel

กำหนดค่ากฎขาเข้าของ Tunnel ให้กำหนดเส้นทางเฉพาะพาธ Webhook:

- **พาธ**: `/googlechat` -> `http://localhost:18789/googlechat`
- **กฎเริ่มต้น**: HTTP 404 (ไม่พบ)

## วิธีการทำงาน

1. Google Chat ส่ง JSON ด้วย POST ไปยังพาธ Webhook ของ Gateway (รองรับเฉพาะ POST, ต้องใช้ชนิดเนื้อหา JSON และมีการจำกัดอัตราต่อ IP)
2. OpenClaw พิสูจน์ตัวตนทุกคำขอก่อนส่งต่อ:
   - เหตุการณ์จากแอป Chat มี `Authorization: Bearer <token>` โดยจะตรวจสอบโทเค็นก่อนแยกวิเคราะห์เนื้อหาทั้งหมด
   - เหตุการณ์จาก Google Workspace Add-on มีโทเค็นอยู่ในเนื้อหา (`authorizationEventObject.systemIdToken`) และจะถูกอ่านภายใต้งบประมาณก่อนการพิสูจน์ตัวตนที่เข้มงวดยิ่งขึ้น (16 KB, 3 วินาที) ก่อนตรวจสอบ
3. ระบบตรวจสอบโทเค็นกับ `audienceType` + `audience`:
   - `audienceType: "app-url"` → กลุ่มเป้าหมายคือ URL Webhook แบบ HTTPS ของคุณ
   - `audienceType: "project-number"` → กลุ่มเป้าหมายคือหมายเลขโปรเจกต์ Cloud
   - โทเค็น Add-on ภายใต้ `app-url` ยังกำหนดให้ตั้งค่า `appPrincipal` เป็นรหัสไคลเอ็นต์ OAuth 2.0 แบบตัวเลขของแอป (21 หลัก ไม่ใช่อีเมล) มิฉะนั้นการตรวจสอบจะล้มเหลวพร้อมบันทึกคำเตือน
4. ข้อความจะถูกกำหนดเส้นทางตามพื้นที่:
   - พื้นที่ใช้เซสชันแยกตามพื้นที่ `agent:<agentId>:googlechat:group:<spaceId>` โดยการตอบกลับจะถูกส่งไปยังเธรดของข้อความ
   - โดยค่าเริ่มต้น ข้อความส่วนตัวจะรวมเข้าในเซสชันหลักของเอเจนต์ ตั้งค่า `session.dmScope` เพื่อใช้เซสชันข้อความส่วนตัวแยกตามคู่สนทนา (ดู [เซสชัน](/th/concepts/session))
5. โดยค่าเริ่มต้น การเข้าถึงข้อความส่วนตัวใช้การจับคู่ ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ ให้อนุมัติด้วย:
   - `openclaw pairing approve googlechat <code>`
6. โดยค่าเริ่มต้น พื้นที่กลุ่มต้องมีการกล่าวถึงด้วย @ ระบบตรวจหาการกล่าวถึงจากคำอธิบายประกอบ `USER_MENTION` ของ Chat ที่ระบุเป้าหมายเป็นแอป หากการตรวจหาต้องใช้ชื่อทรัพยากรผู้ใช้ของแอป ให้ตั้งค่า `botUser` (เช่น `users/1234567890`)
7. เมื่อการอนุมัติคำสั่ง exec หรือ Plugin เริ่มต้นจาก Google Chat และมีการกำหนดผู้อนุมัติ `users/<id>` ที่เสถียร OpenClaw จะโพสต์การ์ดอนุมัติแบบเนทีฟ (`cardsV2`) ในพื้นที่หรือเธรดต้นทาง ปุ่มบนการ์ดจะมีโทเค็นคอลแบ็กแบบทึบ ส่วนพรอมต์แบบกำหนดเอง `/approve <id> <decision>` จะปรากฏเฉพาะเมื่อไม่สามารถส่งแบบเนทีฟได้

## เป้าหมาย

ใช้ตัวระบุต่อไปนี้สำหรับการส่งและรายการอนุญาต:

- ข้อความส่วนตัว: `users/<userId>` (แนะนำ)
- พื้นที่: `spaces/<spaceId>`
- อีเมลดิบ `name@example.com` สามารถเปลี่ยนแปลงได้ และจะใช้สำหรับจับคู่กับรายการอนุญาตเฉพาะเมื่อ `channels.googlechat.dangerouslyAllowNameMatching: true`
- เลิกใช้แล้ว: `users/<email>` จะถือว่าเป็นรหัสผู้ใช้ ไม่ใช่รายการอนุญาตอีเมล
- ระบบยอมรับและตัดคำนำหน้า `googlechat:`, `google-chat:` และ `gchat:` ออก

## จุดสำคัญของการกำหนดค่า

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // หรือ serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // เฉพาะการตรวจสอบ Add-on; รหัสไคลเอ็นต์ OAuth แบบตัวเลข
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // ไม่บังคับ; ช่วยตรวจหาการกล่าวถึง
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "ตอบสั้น ๆ เท่านั้น",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

หมายเหตุ:

- ข้อมูลเข้าสู่ระบบของ Service Account: `serviceAccountFile` (พาธ), `serviceAccount` (สตริงหรือออบเจ็กต์ JSON แบบอินไลน์) หรือ `serviceAccountRef` (SecretRef จากตัวแปรสภาพแวดล้อม/ไฟล์) ตัวแปรสภาพแวดล้อม `GOOGLE_CHAT_SERVICE_ACCOUNT` (JSON แบบอินไลน์) และ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (พาธ) มีผลเฉพาะกับบัญชีเริ่มต้น การตั้งค่าหลายบัญชีใช้ `channels.googlechat.accounts.<id>` พร้อมคีย์เดียวกัน รวมถึง `serviceAccountRef` แยกตามบัญชี
- พาธ Webhook เริ่มต้นคือ `/googlechat` เมื่อไม่ได้ตั้งค่า `webhookPath`; หรือ `webhookUrl` สามารถระบุพาธแทนได้
- คีย์กลุ่มต้องเป็นรหัสพื้นที่ที่เสถียร (`spaces/<spaceId>`) คีย์ที่เป็นชื่อที่แสดงเลิกใช้แล้ว และระบบจะบันทึกไว้ว่าเป็นเช่นนั้น
- `dangerouslyAllowNameMatching` เปิดใช้การจับคู่ตัวการหลักด้วยอีเมลที่เปลี่ยนแปลงได้อีกครั้งสำหรับรายการอนุญาต (โหมดความเข้ากันได้ฉุกเฉิน) โดย doctor จะเตือนเกี่ยวกับรายการอีเมล
- การดำเนินการแสดงความรู้สึกของ Google Chat ไม่ได้ถูกเปิดเผย Plugin ใช้การพิสูจน์ตัวตนด้วย Service Account ขณะที่ปลายทางแสดงความรู้สึกของ Google Chat ต้องใช้การพิสูจน์ตัวตนของผู้ใช้ ระบบยอมรับการกำหนดค่า `actions.reactions` ที่มีอยู่เพื่อความเข้ากันได้ แต่ไม่มีผลใด ๆ
- การ์ดอนุมัติแบบเนทีฟใช้การคลิกปุ่ม `cardsV2` ของ Google Chat ไม่ใช่เหตุการณ์แสดงความรู้สึก ผู้อนุมัติมาจาก `dm.allowFrom` หรือ `defaultTo` และต้องเป็นค่า `users/<id>` แบบตัวเลขที่เสถียร
- การดำเนินการกับข้อความเปิดเผยเฉพาะการ `send` ข้อความ การอัปโหลดไฟล์แนบของ Google Chat ต้องใช้การพิสูจน์ตัวตนของผู้ใช้ แต่ Plugin นี้ใช้การพิสูจน์ตัวตนด้วย Service Account จึงไม่เปิดเผยการอัปโหลดไฟล์ขาออก
- `typingIndicator`: `message` (ค่าเริ่มต้น) จะโพสต์ข้อความตัวแทน `_<Bot> is typing..._` และแก้ไขให้เป็นการตอบกลับแรก; `none` จะปิดใช้; `reaction` ต้องใช้ OAuth ของผู้ใช้ และในปัจจุบันจะย้อนกลับไปใช้ `message` พร้อมบันทึกข้อผิดพลาดเมื่อใช้การพิสูจน์ตัวตนด้วย Service Account
- ไฟล์แนบขาเข้า (ไฟล์แนบแรกต่อข้อความ) จะถูกดาวน์โหลดผ่าน Chat API เข้าสู่ไปป์ไลน์สื่อ โดยจำกัดขนาดด้วย `mediaMaxMb` (ค่าเริ่มต้น 20)
- โดยค่าเริ่มต้น ระบบจะละเว้นข้อความที่บอตเป็นผู้เขียน เมื่อใช้ `allowBots: true` ข้อความจากบอตที่ยอมรับจะใช้ [การป้องกันลูปของบอต](/th/channels/bot-loop-protection) ร่วมกัน: กำหนดค่า `channels.defaults.botLoopProtection` แล้วเขียนทับด้วย `channels.googlechat.botLoopProtection` หรือ `channels.googlechat.groups.<space>.botLoopProtection`

รายละเอียดการอ้างอิงข้อมูลลับ: [การจัดการข้อมูลลับ](/th/gateway/secrets)

## การแก้ไขปัญหา

### 405 ไม่อนุญาตให้ใช้เมธอด

หาก Google Cloud Logs Explorer แสดงข้อผิดพลาด เช่น:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

ยังไม่ได้ลงทะเบียนตัวจัดการ Webhook สาเหตุที่พบบ่อย:

1. **ไม่ได้กำหนดค่าช่องทาง**: ไม่มีส่วน `channels.googlechat` ตรวจสอบด้วย:

   ```bash
   openclaw config get channels.googlechat
   ```

   หากส่งคืน "Config path not found" ให้เพิ่มการกำหนดค่า (ดู [จุดสำคัญของการกำหนดค่า](#config-highlights))

2. **ไม่ได้เปิดใช้ Plugin**: ตรวจสอบสถานะ Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   หากแสดง "disabled" ให้เพิ่ม `plugins.entries.googlechat.enabled: true` ในการกำหนดค่าของคุณ

3. **ไม่ได้เริ่ม Gateway ใหม่** หลังเปลี่ยนแปลงการกำหนดค่า:

   ```bash
   openclaw gateway restart
   ```

ตรวจสอบว่าช่องทางกำลังทำงาน:

```bash
openclaw channels status
# ควรแสดง: Google Chat default: enabled, configured, ...
```

### ปัญหาอื่น ๆ

- `openclaw channels status --probe` จะแสดงข้อผิดพลาดในการพิสูจน์ตัวตนและการกำหนดค่ากลุ่มเป้าหมายที่ขาดหายไป (ต้องมีทั้ง `audience` และ `audienceType`)
- หากไม่มีข้อความเข้ามา ให้ตรวจสอบ URL Webhook และการกำหนดค่าทริกเกอร์ของแอป Chat
- หากการจำกัดด้วยการกล่าวถึงขัดขวางการตอบกลับ ให้ตั้งค่า `botUser` เป็นชื่อทรัพยากรผู้ใช้ของแอปและตรวจสอบ `requireMention`
- การใช้ `openclaw logs --follow` ขณะส่งข้อความทดสอบจะแสดงว่าคำขอมาถึง Gateway หรือไม่

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [กลุ่ม](/th/channels/groups) — ลักษณะการทำงานของแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนผ่านข้อความส่วนตัวและขั้นตอนการจับคู่
- [ความปลอดภัย](/th/gateway/security) — รูปแบบการเข้าถึงและการเสริมความแข็งแกร่งด้านความปลอดภัย
