---
read_when:
    - การพัฒนาฟีเจอร์ช่องทาง Google Chat
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าแอป Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-07-19T18:10:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5300ce6da3bf69136b7286dc87f14a5809c5f28a206c881a95f520376304b97d
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat ทำงานเป็น Plugin `@openclaw/googlechat` อย่างเป็นทางการ: รองรับข้อความส่วนตัวและพื้นที่ผ่าน Webhook ของ Google Chat API (เฉพาะปลายทาง HTTP ไม่มี Pub/Sub)

## ติดตั้ง

```bash
openclaw plugins install @openclaw/googlechat
```

เช็กเอาต์ในเครื่อง (เมื่อเรียกใช้จากรีโพซิทอรี git):

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
   - เว้นสิทธิ์และผู้ใช้หลักไว้ (**Continue** แล้วเลือก **Done**)
3. สร้างและดาวน์โหลด **คีย์ JSON**:
   - คลิกบัญชีบริการใหม่ > แท็บ **Keys** > **Add Key** > **Create new key** > **JSON** > **Create**
4. จัดเก็บไฟล์ JSON ที่ดาวน์โหลดไว้บนโฮสต์ Gateway (เช่น `~/.openclaw/googlechat-service-account.json`)
5. สร้างแอป Google Chat ใน [การกำหนดค่า Chat ของ Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - กรอก **Application info** (ชื่อแอป, URL รูปประจำตัว, คำอธิบาย)
   - เปิดใช้ **Interactive features**
   - ใต้ **Functionality** ให้เลือก **Join spaces and group conversations**
   - ใต้ **Connection settings** ให้เลือก **HTTP endpoint URL**
   - ใต้ **Triggers** ให้เลือก **Use a common HTTP endpoint URL for all triggers** แล้วตั้งค่าเป็น URL สาธารณะของ Gateway ตามด้วย `/googlechat` (ดู [URL สาธารณะ](#public-url-webhook-only))
   - ใต้ **Visibility** ให้เลือก **Make this Chat app available to specific people and groups in `<Your Domain>`** แล้วป้อนที่อยู่อีเมลของคุณ
   - คลิก **Save**
6. เปิดใช้สถานะแอป: รีเฟรชหน้า ค้นหา **App status** ตั้งค่าเป็น **Live - available to users** แล้วเลือก **Save** อีกครั้ง
7. กำหนดค่า OpenClaw ด้วยบัญชีบริการและกลุ่มเป้าหมายของ Webhook (ต้องตรงกับการกำหนดค่าแอป Chat):
   - ตัวแปรสภาพแวดล้อม: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (เฉพาะบัญชีเริ่มต้น) หรือ
   - การกำหนดค่า: ดู [จุดสำคัญในการกำหนดค่า](#config-highlights) นอกจากนี้ `openclaw channels add --channel googlechat` ยังรองรับ `--audience-type`, `--audience`, `--webhook-path` และ `--webhook-url`
8. เริ่ม Gateway โดย Google Chat จะส่ง POST ไปยังพาธ Webhook ของคุณ (ค่าเริ่มต้นคือ `/googlechat`)

## เพิ่มลงใน Google Chat

เมื่อ Gateway ทำงานแล้วและอีเมลของคุณอยู่ในรายการการมองเห็น:

1. ไปที่ [Google Chat](https://chat.google.com/)
2. คลิกไอคอน **+** (บวก) ถัดจาก **Direct Messages**
3. ค้นหา **App name** ที่กำหนดค่าไว้ใน Google Cloud Console
   - บอตจะ_ไม่_ปรากฏในรายการเรียกดู Marketplace เนื่องจากเป็นแอปส่วนตัว ให้ค้นหาด้วยชื่อ
4. เลือกบอต คลิก **Add** หรือ **Chat** แล้วส่งข้อความ

## URL สาธารณะ (เฉพาะ Webhook)

Webhook ของ Google Chat ต้องใช้ปลายทาง HTTPS สาธารณะ เพื่อความปลอดภัย ให้เปิดเผย **เฉพาะพาธ `/googlechat`** สู่อินเทอร์เน็ต และเก็บแดชบอร์ด OpenClaw รวมถึงปลายทางอื่นไว้เป็นส่วนตัว

### ตัวเลือก A: Tailscale Funnel (แนะนำ)

ใช้ Tailscale Serve สำหรับแดชบอร์ดส่วนตัว และใช้ Funnel สำหรับพาธ Webhook สาธารณะ

1. ตรวจสอบว่า Gateway ผูกอยู่กับที่อยู่ใด:

   ```bash
   ss -tlnp | grep 18789
   ```

   จด IP ไว้ (เช่น `127.0.0.1`, `0.0.0.0` หรือที่อยู่ Tailscale `100.x.x.x`)

2. เปิดเผยแดชบอร์ดเฉพาะใน tailnet (พอร์ต 8443):

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

4. หากมีข้อความแจ้ง ให้ไปยัง URL การให้สิทธิ์ที่แสดงในผลลัพธ์เพื่อเปิดใช้ Funnel สำหรับ Node นี้

5. ตรวจสอบ:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

URL Webhook สาธารณะของคุณคือ `https://<node-name>.<tailnet>.ts.net/googlechat`; แดชบอร์ดยังคงเข้าถึงได้เฉพาะใน tailnet ที่ `https://<node-name>.<tailnet>.ts.net:8443/` ใช้ URL สาธารณะ (โดยไม่มี `:8443`) ในการกำหนดค่าแอป Google Chat

> หมายเหตุ: การกำหนดค่านี้จะคงอยู่หลังรีบูต ภายหลังสามารถนำออกได้ด้วย `tailscale funnel reset` และ `tailscale serve reset`

### ตัวเลือก B: พร็อกซีย้อนกลับ (Caddy)

พร็อกซีเฉพาะพาธ Webhook:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

คำขอไปยัง `your-domain.com/` จะถูกละเว้นหรือส่งคืน 404 ส่วน `your-domain.com/googlechat` จะกำหนดเส้นทางไปยัง OpenClaw

### ตัวเลือก C: Cloudflare Tunnel

กำหนดค่ากฎขาเข้าของ Tunnel ให้กำหนดเส้นทางเฉพาะพาธ Webhook:

- **พาธ**: `/googlechat` -> `http://localhost:18789/googlechat`
- **กฎเริ่มต้น**: HTTP 404 (ไม่พบ)

## วิธีการทำงาน

1. Google Chat ส่ง JSON ด้วย POST ไปยังพาธ Webhook ของ Gateway (เฉพาะ POST, ต้องใช้ชนิดเนื้อหา JSON และจำกัดอัตราต่อ IP)
2. OpenClaw พิสูจน์ตัวตนทุกคำขอก่อนส่งต่อ:
   - เหตุการณ์ของแอป Chat มี `Authorization: Bearer <token>`; ระบบจะตรวจสอบโทเค็นก่อนแยกวิเคราะห์เนื้อหาทั้งหมด
   - เหตุการณ์ส่วนเสริม Google Workspace มีโทเค็นอยู่ในเนื้อหา (`authorizationEventObject.systemIdToken`) และจะถูกอ่านภายใต้งบประมาณก่อนการพิสูจน์ตัวตนที่เข้มงวดยิ่งขึ้น (16 KB, 3 วินาที) ก่อนตรวจสอบ
3. โทเค็นจะถูกตรวจสอบกับ `audienceType` + `audience`:
   - `audienceType: "app-url"` → กลุ่มเป้าหมายคือ URL Webhook แบบ HTTPS ของคุณ
   - `audienceType: "project-number"` → กลุ่มเป้าหมายคือหมายเลขโปรเจกต์ Cloud
   - โทเค็นส่วนเสริมภายใต้ `app-url` ยังกำหนดให้ตั้งค่า `appPrincipal` เป็นรหัสไคลเอ็นต์ OAuth 2.0 แบบตัวเลขของแอป (21 หลัก ไม่ใช่อีเมล) มิฉะนั้นการตรวจสอบจะล้มเหลวพร้อมบันทึกคำเตือน
4. ข้อความกำหนดเส้นทางตามพื้นที่:
   - พื้นที่จะได้รับเซสชันแยกตามพื้นที่ `agent:<agentId>:googlechat:group:<spaceId>`; การตอบกลับจะส่งไปยังเธรดข้อความ
   - โดยค่าเริ่มต้น ข้อความส่วนตัวจะถูกรวมไว้ในเซสชันหลักของเอเจนต์ ตั้งค่า `session.dmScope` เพื่อใช้เซสชันข้อความส่วนตัวแยกตามคู่สนทนา (ดู [เซสชัน](/th/concepts/session))
5. โดยค่าเริ่มต้น การเข้าถึงข้อความส่วนตัวใช้การจับคู่ ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ อนุมัติด้วย:
   - `openclaw pairing approve googlechat <code>`
6. โดยค่าเริ่มต้น พื้นที่กลุ่มต้องมีการกล่าวถึงด้วย @ ระบบตรวจจับการกล่าวถึงจากคำอธิบายประกอบ `USER_MENTION` ของ Chat ที่กำหนดเป้าหมายไปยังแอป หากการตรวจจับต้องใช้ชื่อทรัพยากรผู้ใช้ของแอป ให้ตั้งค่า `botUser` (เช่น `users/1234567890`)
7. เมื่อการอนุมัติการเรียกใช้คำสั่งหรือ Plugin เริ่มต้นจาก Google Chat และมีการกำหนดค่าผู้อนุมัติ `users/<id>` ที่คงที่ OpenClaw จะโพสต์การ์ดอนุมัติแบบเนทีฟ (`cardsV2`) ในพื้นที่หรือเธรดต้นทาง ปุ่มบนการ์ดจะมีโทเค็นเรียกกลับแบบทึบ ส่วนข้อความแจ้ง `/approve <id> <decision>` แบบกำหนดเองจะปรากฏเฉพาะเมื่อไม่สามารถส่งแบบเนทีฟได้

### ความคงทนของข้อมูลขาเข้า

หลังจากพิสูจน์ตัวตนคำขอแล้ว OpenClaw จะนำออบเจ็กต์การให้สิทธิ์ส่วนเสริมออกจากพื้นที่จัดเก็บ และจัดคิวเหตุการณ์ `MESSAGE` ของ Google Chat อย่างคงทนก่อนส่งคืน `200` หากการบันทึกถาวรล้มเหลว ระบบจะส่งคืน `503` เพื่อให้ Google Chat ลองใหม่แทนการตอบรับเหตุการณ์ที่อาจสูญหาย

ข้อความที่รอดำเนินการหรือลองใหม่ได้จะยังคงอยู่หลัง Gateway เริ่มทำงานใหม่ โดยยังคงประมวลผลตามลำดับแยกตามพื้นที่ และใช้ชื่อทรัพยากรข้อความ Google Chat เพื่อระงับรายการคิวที่ซ้ำกันตราบใดที่ยังมีระเบียนการดำเนินการเสร็จสิ้นที่กำลังใช้งานหรือถูกเก็บรักษาไว้ การดำเนินการที่ไม่ใช่ข้อความจะยังใช้พาธ Webhook แบบแยกเดิมและไม่ได้รับการรับประกันคิวที่คงทนนี้ การส่งมอบระหว่างคิวกับเอเจนต์ยังคงเป็นแบบอย่างน้อยหนึ่งครั้ง ดังนั้นการขัดข้องระหว่างส่งมอบอาจทำให้มีการเล่นซ้ำหนึ่งรอบได้

## เป้าหมาย

ใช้ตัวระบุต่อไปนี้สำหรับการส่งมอบและรายการอนุญาต:

- ข้อความส่วนตัว: `users/<userId>` (แนะนำ)
- พื้นที่: `spaces/<spaceId>`
- อีเมลดิบ `name@example.com` สามารถเปลี่ยนแปลงได้ และใช้สำหรับจับคู่รายการอนุญาตเฉพาะเมื่อ `channels.googlechat.dangerouslyAllowNameMatching: true`
- เลิกใช้แล้ว: `users/<email>` จะถูกถือเป็นรหัสผู้ใช้ ไม่ใช่รายการอีเมลในรายการอนุญาต
- ระบบยอมรับและตัดคำนำหน้า `googlechat:`, `google-chat:` และ `gchat:` ออก

## จุดสำคัญในการกำหนดค่า

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // หรือ serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // ใช้ตรวจสอบส่วนเสริมเท่านั้น; รหัสไคลเอ็นต์ OAuth แบบตัวเลข
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // ไม่บังคับ; ช่วยตรวจจับการกล่าวถึง
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

- ข้อมูลเข้าสู่ระบบของบัญชีบริการ: `serviceAccountFile` (พาธ), `serviceAccount` (สตริงหรือออบเจ็กต์ JSON แบบอินไลน์) หรือ `serviceAccountRef` (SecretRef จากตัวแปรสภาพแวดล้อม/ไฟล์) ตัวแปรสภาพแวดล้อม `GOOGLE_CHAT_SERVICE_ACCOUNT` (JSON แบบอินไลน์) และ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (พาธ) ใช้กับบัญชีเริ่มต้นเท่านั้น การตั้งค่าหลายบัญชีใช้ `channels.googlechat.accounts.<id>` พร้อมคีย์เดียวกัน รวมถึง `serviceAccountRef` แยกตามบัญชี
- พาธ Webhook เริ่มต้นคือ `/googlechat` เมื่อไม่ได้ตั้งค่า `webhookPath`; หรือใช้ `webhookUrl` เพื่อระบุพาธแทนได้
- คีย์กลุ่มต้องเป็นรหัสพื้นที่ที่คงที่ (`spaces/<spaceId>`) คีย์ชื่อที่แสดงเลิกใช้แล้วและจะถูกบันทึกไว้ว่าเป็นเช่นนั้น
- `dangerouslyAllowNameMatching` เปิดใช้การจับคู่ผู้ใช้หลักจากอีเมลที่เปลี่ยนแปลงได้สำหรับรายการอนุญาตอีกครั้ง (โหมดความเข้ากันได้สำหรับเหตุฉุกเฉิน); doctor จะเตือนเกี่ยวกับรายการอีเมล
- การดำเนินการแสดงความรู้สึกใน Google Chat ไม่ได้ถูกเปิดเผย Plugin ใช้การพิสูจน์ตัวตนด้วยบัญชีบริการ ขณะที่ปลายทางการแสดงความรู้สึกของ Google Chat ต้องใช้การพิสูจน์ตัวตนของผู้ใช้ ระบบยอมรับการกำหนดค่า `actions.reactions` ที่มีอยู่เพื่อความเข้ากันได้ แต่ไม่มีผล
- การ์ดอนุมัติแบบเนทีฟใช้การคลิกปุ่ม `cardsV2` ของ Google Chat ไม่ใช่เหตุการณ์การแสดงความรู้สึก ผู้อนุมัติมาจาก `allowFrom` หรือ `defaultTo` และต้องเป็นค่า `users/<id>` แบบตัวเลขที่คงที่
- การดำเนินการกับข้อความเปิดเผยเฉพาะข้อความ `send` การอัปโหลดไฟล์แนบของ Google Chat ต้องใช้การพิสูจน์ตัวตนของผู้ใช้ ขณะที่ Plugin นี้ใช้การพิสูจน์ตัวตนด้วยบัญชีบริการ จึงไม่มีการเปิดเผยการอัปโหลดไฟล์ขาออก
- `typingIndicator`: `message` (ค่าเริ่มต้น) จะโพสต์ตัวยึดตำแหน่ง `_<Bot> is typing..._` แล้วแก้ไขให้เป็นคำตอบแรก; `none` จะปิดใช้; `reaction` ต้องใช้ OAuth ของผู้ใช้ และปัจจุบันจะย้อนกลับไปใช้ `message` พร้อมบันทึกข้อผิดพลาดเมื่อใช้การพิสูจน์ตัวตนด้วยบัญชีบริการ
- ไฟล์แนบขาเข้า (ไฟล์แนบแรกต่อข้อความ) จะถูกดาวน์โหลดผ่าน Chat API เข้าสู่ไปป์ไลน์สื่อ โดยจำกัดตาม `mediaMaxMb` (ค่าเริ่มต้น 20)
- โดยค่าเริ่มต้น ข้อความที่สร้างโดยบอตจะถูกละเว้น เมื่อใช้ `allowBots: true` ข้อความจากบอตที่ยอมรับจะใช้ [การป้องกันลูปของบอต](/th/channels/bot-loop-protection) ร่วมกัน: กำหนดค่า `channels.defaults.botLoopProtection` แล้วเขียนทับด้วย `channels.googlechat.botLoopProtection` หรือ `channels.googlechat.groups.<space>.botLoopProtection`

รายละเอียดอ้างอิงเกี่ยวกับข้อมูลลับ: [การจัดการข้อมูลลับ](/th/gateway/secrets)

## การแก้ไขปัญหา

### 405 Method Not Allowed

หาก Google Cloud Logs Explorer แสดงข้อผิดพลาดดังนี้:

```text
รหัสสถานะ: 405, วลีเหตุผล: การตอบกลับข้อผิดพลาด HTTP: HTTP/1.1 405 Method Not Allowed
```

ตัวจัดการ Webhook ยังไม่ได้ลงทะเบียน สาเหตุที่พบบ่อย ได้แก่:

1. **ยังไม่ได้กำหนดค่าช่องทาง**: ไม่มีส่วน `channels.googlechat` ตรวจสอบด้วย:

   ```bash
   openclaw config get channels.googlechat
   ```

   หากคำสั่งส่งคืน "Config path not found" ให้เพิ่มการกำหนดค่า (ดู[ข้อมูลสำคัญในการกำหนดค่า](#config-highlights))

2. **ยังไม่ได้เปิดใช้งาน Plugin**: ตรวจสอบสถานะ Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   หากแสดง "disabled" ให้เพิ่ม `plugins.entries.googlechat.enabled: true` ลงในการกำหนดค่า

3. **ไม่ได้รีสตาร์ต Gateway** หลังจากเปลี่ยนแปลงการกำหนดค่า:

   ```bash
   openclaw gateway restart
   ```

ตรวจสอบว่าช่องทางกำลังทำงาน:

```bash
openclaw channels status
# ควรแสดง: Google Chat default: enabled, configured, ...
```

### ปัญหาอื่นๆ

- `openclaw channels status --probe` แสดงข้อผิดพลาดในการยืนยันตัวตนและการกำหนดค่ากลุ่มเป้าหมายที่ขาดหายไป (จำเป็นต้องมีทั้ง `audience` และ `audienceType`)
- หากไม่มีข้อความเข้ามา ให้ตรวจสอบ URL ของ Webhook และการกำหนดค่าทริกเกอร์ของแอป Chat
- หากการจำกัดด้วยการกล่าวถึงปิดกั้นการตอบกลับ ให้ตั้งค่า `botUser` เป็นชื่อทรัพยากรผู้ใช้ของแอปและตรวจสอบ `requireMention`
- `openclaw logs --follow` ขณะส่งข้อความทดสอบจะแสดงว่าคำขอไปถึง Gateway หรือไม่

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [กลุ่ม](/th/channels/groups) — ลักษณะการทำงานของแชตกลุ่มและการจำกัดด้วยการกล่าวถึง
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนผ่าน DM และขั้นตอนการจับคู่
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
