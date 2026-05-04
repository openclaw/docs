---
read_when:
    - กำลังทำงานกับฟีเจอร์ช่องทาง Google Chat
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าของแอป Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-05-04T02:21:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: afa2ca4d9673396aa24a55ca5855a34ad26a4640c3a1f6928dbf7246e403cb04
    source_path: channels/googlechat.md
    workflow: 16
---

สถานะ: Plugin ที่ดาวน์โหลดได้สำหรับ DMs + พื้นที่ทำงานผ่าน Webhook ของ Google Chat API (HTTP เท่านั้น)

## ติดตั้ง

ติดตั้ง Google Chat ก่อนกำหนดค่าช่องทาง:

```bash
openclaw plugins install @openclaw/googlechat
```

เช็กเอาต์ในเครื่อง (เมื่อเรียกใช้จาก repo git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## การตั้งค่าแบบเร็ว (สำหรับผู้เริ่มต้น)

1. สร้างโปรเจกต์ Google Cloud และเปิดใช้ **Google Chat API**
   - ไปที่: [ข้อมูลประจำตัว Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - เปิดใช้ API หากยังไม่ได้เปิดใช้
2. สร้าง **Service Account**:
   - กด **Create Credentials** > **Service Account**
   - ตั้งชื่อใดก็ได้ที่คุณต้องการ (เช่น `openclaw-chat`)
   - เว้นสิทธิ์ไว้เป็นค่าว่าง (กด **Continue**)
   - เว้น principal ที่มีสิทธิ์เข้าถึงไว้เป็นค่าว่าง (กด **Done**)
3. สร้างและดาวน์โหลด **JSON Key**:
   - ในรายการ service account ให้คลิกรายการที่คุณเพิ่งสร้าง
   - ไปที่แท็บ **Keys**
   - คลิก **Add Key** > **Create new key**
   - เลือก **JSON** แล้วกด **Create**
4. เก็บไฟล์ JSON ที่ดาวน์โหลดไว้บนโฮสต์ Gateway ของคุณ (เช่น `~/.openclaw/googlechat-service-account.json`)
5. สร้างแอป Google Chat ใน [การกำหนดค่า Chat ใน Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - กรอก **Application info**:
     - **App name**: (เช่น `OpenClaw`)
     - **Avatar URL**: (เช่น `https://openclaw.ai/logo.png`)
     - **Description**: (เช่น `Personal AI Assistant`)
   - เปิดใช้ **Interactive features**
   - ใต้ **Functionality** ให้เลือก **Join spaces and group conversations**
   - ใต้ **Connection settings** ให้เลือก **HTTP endpoint URL**
   - ใต้ **Triggers** ให้เลือก **Use a common HTTP endpoint URL for all triggers** แล้วตั้งค่าเป็น URL สาธารณะของ Gateway ตามด้วย `/googlechat`
     - _เคล็ดลับ: รัน `openclaw status` เพื่อหา URL สาธารณะของ Gateway_
   - ใต้ **Visibility** ให้เลือก **Make this Chat app available to specific people and groups in `<Your Domain>`**
   - ป้อนที่อยู่อีเมลของคุณ (เช่น `user@example.com`) ในกล่องข้อความ
   - คลิก **Save** ที่ด้านล่าง
6. **เปิดใช้สถานะแอป**:
   - หลังจากบันทึกแล้ว ให้ **รีเฟรชหน้า**
   - มองหาส่วน **App status** (โดยปกติจะอยู่ใกล้ด้านบนหรือด้านล่างหลังจากบันทึก)
   - เปลี่ยนสถานะเป็น **Live - available to users**
   - คลิก **Save** อีกครั้ง
7. กำหนดค่า OpenClaw ด้วย path ของ service account + audience ของ Webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - หรือ config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`
8. ตั้งค่าประเภท + ค่าของ audience สำหรับ Webhook (ให้ตรงกับ config แอป Chat ของคุณ)
9. เริ่ม Gateway จากนั้น Google Chat จะส่ง POST ไปยัง path ของ Webhook

## เพิ่มลงใน Google Chat

เมื่อ Gateway ทำงานอยู่และเพิ่มอีเมลของคุณในรายการ visibility แล้ว:

1. ไปที่ [Google Chat](https://chat.google.com/)
2. คลิกไอคอน **+** (บวก) ข้าง **Direct Messages**
3. ในแถบค้นหา (ตำแหน่งที่คุณมักเพิ่มคน) ให้พิมพ์ **App name** ที่คุณกำหนดค่าไว้ใน Google Cloud Console
   - **หมายเหตุ**: บอตจะ _ไม่_ ปรากฏในรายการเรียกดู "Marketplace" เพราะเป็นแอปส่วนตัว คุณต้องค้นหาด้วยชื่อ
4. เลือกบอตของคุณจากผลลัพธ์
5. คลิก **Add** หรือ **Chat** เพื่อเริ่มการสนทนาแบบ 1:1
6. ส่ง "สวัสดี" เพื่อเรียกใช้ผู้ช่วย!

## URL สาธารณะ (เฉพาะ Webhook)

Webhook ของ Google Chat ต้องใช้ endpoint HTTPS สาธารณะ เพื่อความปลอดภัย **ให้เปิดเผยเฉพาะ path `/googlechat`** สู่ internet เท่านั้น เก็บแดชบอร์ด OpenClaw และ endpoint ที่ละเอียดอ่อนอื่นๆ ไว้ในเครือข่ายส่วนตัวของคุณ

### ตัวเลือก A: Tailscale Funnel (แนะนำ)

ใช้ Tailscale Serve สำหรับแดชบอร์ดส่วนตัว และ Funnel สำหรับ path Webhook สาธารณะ วิธีนี้ทำให้ `/` เป็นส่วนตัว ขณะที่เปิดเผยเฉพาะ `/googlechat`

1. **ตรวจสอบว่า Gateway ของคุณ bind อยู่กับที่อยู่ใด:**

   ```bash
   ss -tlnp | grep 18789
   ```

   จดที่อยู่ IP ไว้ (เช่น `127.0.0.1`, `0.0.0.0` หรือ IP ของ Tailscale เช่น `100.x.x.x`)

2. **เปิดเผยแดชบอร์ดให้เฉพาะ tailnet เท่านั้น (พอร์ต 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **เปิดเผยเฉพาะ path ของ Webhook แบบสาธารณะ:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **อนุญาต Node สำหรับการเข้าถึง Funnel:**
   หากมี prompt ให้ไปที่ URL สำหรับการอนุญาตที่แสดงในเอาต์พุต เพื่อเปิดใช้ Funnel สำหรับ Node นี้ในนโยบาย tailnet ของคุณ

5. **ตรวจสอบการกำหนดค่า:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

URL Webhook สาธารณะของคุณจะเป็น:
`https://<node-name>.<tailnet>.ts.net/googlechat`

แดชบอร์ดส่วนตัวของคุณจะยังคงเข้าถึงได้เฉพาะใน tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

ใช้ URL สาธารณะ (ไม่รวม `:8443`) ใน config แอป Google Chat

> หมายเหตุ: การกำหนดค่านี้จะคงอยู่หลังรีบูต หากต้องการนำออกภายหลัง ให้รัน `tailscale funnel reset` และ `tailscale serve reset`

### ตัวเลือก B: Reverse Proxy (Caddy)

หากคุณใช้ reverse proxy เช่น Caddy ให้ proxy เฉพาะ path ที่ระบุ:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

ด้วย config นี้ คำขอใดๆ ไปที่ `your-domain.com/` จะถูกละเว้นหรือส่งกลับเป็น 404 ขณะที่ `your-domain.com/googlechat` จะถูก route ไปยัง OpenClaw อย่างปลอดภัย

### ตัวเลือก C: Cloudflare Tunnel

กำหนดค่ากฎ ingress ของ tunnel ให้ route เฉพาะ path ของ Webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## วิธีทำงาน

1. Google Chat ส่ง Webhook POST ไปยัง Gateway แต่ละคำขอมี header `Authorization: Bearer <token>`
   - OpenClaw ตรวจสอบ bearer auth ก่อนอ่าน/parse body ของ Webhook ทั้งหมดเมื่อมี header อยู่
   - รองรับคำขอ Google Workspace Add-on ที่มี `authorizationEventObject.systemIdToken` ใน body ผ่านงบประมาณ body ก่อน auth ที่เข้มงวดยิ่งขึ้น
2. OpenClaw ตรวจสอบ token กับ `audienceType` + `audience` ที่กำหนดค่าไว้:
   - `audienceType: "app-url"` → audience คือ URL HTTPS Webhook ของคุณ
   - `audienceType: "project-number"` → audience คือหมายเลขโปรเจกต์ Cloud
3. ข้อความจะถูก route ตามพื้นที่ทำงาน:
   - DMs ใช้ session key `agent:<agentId>:googlechat:direct:<spaceId>`
   - พื้นที่ทำงานใช้ session key `agent:<agentId>:googlechat:group:<spaceId>`
4. การเข้าถึง DM ใช้การ pairing เป็นค่าเริ่มต้น ผู้ส่งที่ไม่รู้จักจะได้รับ pairing code; อนุมัติด้วย:
   - `openclaw pairing approve googlechat <code>`
5. พื้นที่ทำงานแบบกลุ่มต้อง @-mention เป็นค่าเริ่มต้น ใช้ `botUser` หากการตรวจจับ mention ต้องใช้ชื่อผู้ใช้ของแอป

## เป้าหมาย

ใช้ตัวระบุเหล่านี้สำหรับการส่งและ allowlist:

- ข้อความโดยตรง: `users/<userId>` (แนะนำ)
- อีเมลดิบ `name@example.com` เปลี่ยนแปลงได้ และใช้เฉพาะสำหรับการจับคู่ allowlist โดยตรงเมื่อ `channels.googlechat.dangerouslyAllowNameMatching: true`
- เลิกใช้แล้ว: `users/<email>` จะถูกถือเป็น user id ไม่ใช่ allowlist อีเมล
- พื้นที่ทำงาน: `spaces/<spaceId>`

## ไฮไลต์ config

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
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
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

หมายเหตุ:

- สามารถส่งข้อมูลประจำตัวของ service account แบบ inline ด้วย `serviceAccount` (สตริง JSON) ได้เช่นกัน
- รองรับ `serviceAccountRef` เช่นกัน (env/file SecretRef) รวมถึง refs ต่อบัญชีภายใต้ `channels.googlechat.accounts.<id>.serviceAccountRef`
- path Webhook เริ่มต้นคือ `/googlechat` หากไม่ได้ตั้งค่า `webhookPath`
- `dangerouslyAllowNameMatching` เปิดใช้การจับคู่ principal อีเมลที่เปลี่ยนแปลงได้อีกครั้งสำหรับ allowlist (โหมดความเข้ากันได้แบบ break-glass)
- Reactions พร้อมใช้งานผ่านเครื่องมือ `reactions` และ `channels action` เมื่อเปิดใช้ `actions.reactions`
- การดำเนินการกับข้อความเปิดเผย `send` สำหรับข้อความ และ `upload-file` สำหรับการส่งไฟล์แนบแบบชัดเจน `upload-file` รับ `media` / `filePath` / `path` รวมถึง `message`, `filename` และการกำหนดเป้าหมาย thread ที่เป็นตัวเลือก
- `typingIndicator` รองรับ `none`, `message` (ค่าเริ่มต้น) และ `reaction` (`reaction` ต้องใช้ OAuth ของผู้ใช้)
- ไฟล์แนบจะถูกดาวน์โหลดผ่าน Chat API และเก็บไว้ใน pipeline สื่อ (จำกัดขนาดด้วย `mediaMaxMb`)

รายละเอียดการอ้างอิง secrets: [การจัดการ Secrets](/th/gateway/secrets)

## การแก้ไขปัญหา

### 405 Method Not Allowed

หาก Google Cloud Logs Explorer แสดงข้อผิดพลาดเช่น:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

หมายความว่า handler ของ Webhook ไม่ได้ถูกลงทะเบียน สาเหตุทั่วไป:

1. **ยังไม่ได้กำหนดค่าช่องทาง**: ส่วน `channels.googlechat` หายไปจาก config ของคุณ ตรวจสอบด้วย:

   ```bash
   openclaw config get channels.googlechat
   ```

   หากส่งกลับ "ไม่พบ path config" ให้เพิ่มการกำหนดค่า (ดู [ไฮไลต์ config](#config-highlights))

2. **Plugin ไม่ได้เปิดใช้**: ตรวจสอบสถานะ Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   หากแสดง "disabled" ให้เพิ่ม `plugins.entries.googlechat.enabled: true` ลงใน config ของคุณ

3. **Gateway ยังไม่ได้รีสตาร์ต**: หลังจากเพิ่ม config แล้ว ให้รีสตาร์ต Gateway:

   ```bash
   openclaw gateway restart
   ```

ตรวจสอบว่าช่องทางกำลังทำงาน:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### ปัญหาอื่นๆ

- ตรวจสอบ `openclaw channels status --probe` สำหรับข้อผิดพลาด auth หรือ config audience ที่หายไป
- หากไม่มีข้อความเข้ามา ให้ยืนยัน URL Webhook + event subscriptions ของแอป Chat
- หาก mention gating บล็อกการตอบกลับ ให้ตั้งค่า `botUser` เป็นชื่อ resource ผู้ใช้ของแอป แล้วตรวจสอบ `requireMention`
- ใช้ `openclaw logs --follow` ขณะส่งข้อความทดสอบเพื่อดูว่าคำขอไปถึง Gateway หรือไม่

เอกสารที่เกี่ยวข้อง:

- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [ความปลอดภัย](/th/gateway/security)
- [Reactions](/th/tools/reactions)

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และ flow การ pairing
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและ mention gating
- [การ route ช่องทาง](/th/channels/channel-routing) — การ route session สำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการ hardening
