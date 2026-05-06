---
read_when:
    - การทำงานกับฟีเจอร์ของช่องทาง Google Chat
summary: สถานะการรองรับแอป Google Chat ความสามารถ และการกำหนดค่า
title: Google Chat
x-i18n:
    generated_at: "2026-05-06T09:02:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b6ac581578df0fccfb560057e4b30ec359a368cb671519a153e1c727d7b920c
    source_path: channels/googlechat.md
    workflow: 16
---

สถานะ: Plugin ที่ดาวน์โหลดได้สำหรับ DM + พื้นที่ผ่าน Webhook ของ Google Chat API (HTTP เท่านั้น)

## การติดตั้ง

ติดตั้ง Google Chat ก่อนกำหนดค่า channel:

```bash
openclaw plugins install @openclaw/googlechat
```

เช็กเอาต์ในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## การตั้งค่าอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. สร้างโปรเจกต์ Google Cloud และเปิดใช้ **Google Chat API**
   - ไปที่: [ข้อมูลรับรอง Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - เปิดใช้ API หากยังไม่ได้เปิดใช้
2. สร้าง **Service Account**:
   - กด **Create Credentials** > **Service Account**
   - ตั้งชื่อได้ตามต้องการ (เช่น `openclaw-chat`)
   - ปล่อยสิทธิ์ว่างไว้ (กด **Continue**)
   - ปล่อย principals ที่มีสิทธิ์เข้าถึงว่างไว้ (กด **Done**)
3. สร้างและดาวน์โหลด **JSON Key**:
   - ในรายการ service accounts ให้คลิกบัญชีที่คุณเพิ่งสร้าง
   - ไปที่แท็บ **Keys**
   - คลิก **Add Key** > **Create new key**
   - เลือก **JSON** แล้วกด **Create**
4. เก็บไฟล์ JSON ที่ดาวน์โหลดไว้บนโฮสต์ Gateway ของคุณ (เช่น `~/.openclaw/googlechat-service-account.json`)
5. สร้างแอป Google Chat ใน [การกำหนดค่า Chat ของ Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - กรอก **Application info**:
     - **App name**: (เช่น `OpenClaw`)
     - **Avatar URL**: (เช่น `https://openclaw.ai/logo.png`)
     - **Description**: (เช่น `Personal AI Assistant`)
   - เปิดใช้ **Interactive features**
   - ภายใต้ **Functionality** ให้เลือก **Join spaces and group conversations**
   - ภายใต้ **Connection settings** ให้เลือก **HTTP endpoint URL**
   - ภายใต้ **Triggers** ให้เลือก **Use a common HTTP endpoint URL for all triggers** และตั้งค่าเป็น URL สาธารณะของ Gateway ตามด้วย `/googlechat`
     - _เคล็ดลับ: รัน `openclaw status` เพื่อหา URL สาธารณะของ Gateway_
   - ภายใต้ **Visibility** ให้เลือก **Make this Chat app available to specific people and groups in `<Your Domain>`**
   - ป้อนอีเมลของคุณ (เช่น `user@example.com`) ในกล่องข้อความ
   - คลิก **Save** ที่ด้านล่าง
6. **เปิดใช้สถานะแอป**:
   - หลังจากบันทึกแล้ว ให้ **รีเฟรชหน้า**
   - มองหาส่วน **App status** (โดยปกติอยู่ใกล้ด้านบนหรือด้านล่างหลังจากบันทึก)
   - เปลี่ยนสถานะเป็น **Live - available to users**
   - คลิก **Save** อีกครั้ง
7. กำหนดค่า OpenClaw ด้วยพาธ service account + webhook audience:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - หรือ config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`
8. ตั้งค่าประเภท + ค่าของ webhook audience (ให้ตรงกับ config แอป Chat ของคุณ)
9. เริ่ม Gateway Google Chat จะ POST ไปยังพาธ Webhook ของคุณ

## เพิ่มไปยัง Google Chat

เมื่อ Gateway ทำงานอยู่และอีเมลของคุณถูกเพิ่มในรายการ visibility แล้ว:

1. ไปที่ [Google Chat](https://chat.google.com/)
2. คลิกไอคอน **+** (บวก) ถัดจาก **Direct Messages**
3. ในแถบค้นหา (ตำแหน่งที่คุณใช้เพิ่มผู้คนตามปกติ) ให้พิมพ์ **App name** ที่คุณกำหนดค่าไว้ใน Google Cloud Console
   - **หมายเหตุ**: บอตจะ _ไม่_ ปรากฏในรายการเรียกดู "Marketplace" เพราะเป็นแอปส่วนตัว คุณต้องค้นหาด้วยชื่อ
4. เลือกบอตของคุณจากผลลัพธ์
5. คลิก **Add** หรือ **Chat** เพื่อเริ่มการสนทนาแบบ 1:1
6. ส่ง "Hello" เพื่อทริกเกอร์ผู้ช่วย!

## URL สาธารณะ (เฉพาะ Webhook)

Webhook ของ Google Chat ต้องใช้ endpoint HTTPS สาธารณะ เพื่อความปลอดภัย ให้ **เปิดเผยเฉพาะพาธ `/googlechat`** ต่ออินเทอร์เน็ต เก็บแดชบอร์ด OpenClaw และ endpoint ที่ละเอียดอ่อนอื่น ๆ ไว้ในเครือข่ายส่วนตัวของคุณ

### ตัวเลือก A: Tailscale Funnel (แนะนำ)

ใช้ Tailscale Serve สำหรับแดชบอร์ดส่วนตัวและ Funnel สำหรับพาธ Webhook สาธารณะ วิธีนี้ทำให้ `/` เป็นส่วนตัวและเปิดเผยเฉพาะ `/googlechat`

1. **ตรวจสอบว่า Gateway ของคุณ bind กับแอดเดรสใด:**

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

3. **เปิดเผยเฉพาะพาธ Webhook แบบสาธารณะ:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **อนุญาต node สำหรับการเข้าถึง Funnel:**
   หากมีพรอมป์ ให้ไปที่ URL การอนุญาตที่แสดงในเอาต์พุตเพื่อเปิดใช้ Funnel สำหรับ node นี้ในนโยบาย tailnet ของคุณ

5. **ตรวจสอบการกำหนดค่า:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

URL Webhook สาธารณะของคุณจะเป็น:
`https://<node-name>.<tailnet>.ts.net/googlechat`

แดชบอร์ดส่วนตัวของคุณยังคงเข้าถึงได้เฉพาะ tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

ใช้ URL สาธารณะ (ไม่มี `:8443`) ใน config แอป Google Chat

> หมายเหตุ: การกำหนดค่านี้คงอยู่หลังรีบูต หากต้องการลบในภายหลัง ให้รัน `tailscale funnel reset` และ `tailscale serve reset`

### ตัวเลือก B: Reverse Proxy (Caddy)

หากคุณใช้ reverse proxy เช่น Caddy ให้ proxy เฉพาะพาธที่กำหนด:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

ด้วย config นี้ คำขอใด ๆ ไปยัง `your-domain.com/` จะถูกละเว้นหรือส่งคืนเป็น 404 ขณะที่ `your-domain.com/googlechat` จะถูกส่งต่อไปยัง OpenClaw อย่างปลอดภัย

### ตัวเลือก C: Cloudflare Tunnel

กำหนดค่า ingress rules ของ tunnel ให้ route เฉพาะพาธ Webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## วิธีการทำงาน

1. Google Chat ส่ง Webhook POST ไปยัง Gateway แต่ละคำขอมี header `Authorization: Bearer <token>`
   - OpenClaw ตรวจสอบ bearer auth ก่อนอ่าน/แยกวิเคราะห์ body ของ Webhook ทั้งหมดเมื่อมี header อยู่
   - รองรับคำขอ Google Workspace Add-on ที่มี `authorizationEventObject.systemIdToken` ใน body ผ่าน pre-auth body budget ที่เข้มงวดกว่า
2. OpenClaw ตรวจสอบ token กับ `audienceType` + `audience` ที่กำหนดค่าไว้:
   - `audienceType: "app-url"` → audience คือ URL Webhook HTTPS ของคุณ
   - `audienceType: "project-number"` → audience คือหมายเลขโปรเจกต์ Cloud
3. ข้อความถูก route ตาม space:
   - DM ใช้ session key `agent:<agentId>:googlechat:direct:<spaceId>`
   - Spaces ใช้ session key `agent:<agentId>:googlechat:group:<spaceId>`
4. การเข้าถึง DM ใช้การจับคู่เป็นค่าเริ่มต้น ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ อนุมัติด้วย:
   - `openclaw pairing approve googlechat <code>`
5. พื้นที่กลุ่มต้อง @-mention โดยค่าเริ่มต้น ใช้ `botUser` หากการตรวจจับ mention ต้องใช้ชื่อผู้ใช้ของแอป

## เป้าหมาย

ใช้ตัวระบุเหล่านี้สำหรับการส่งและ allowlists:

- ข้อความส่วนตัว: `users/<userId>` (แนะนำ)
- อีเมลดิบ `name@example.com` เปลี่ยนแปลงได้และใช้เฉพาะสำหรับการจับคู่ allowlist โดยตรงเมื่อ `channels.googlechat.dangerouslyAllowNameMatching: true`
- เลิกใช้แล้ว: `users/<email>` จะถูกถือเป็น user id ไม่ใช่ email allowlist
- Spaces: `spaces/<spaceId>`

## จุดสำคัญของ Config

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

- ข้อมูลรับรอง service account สามารถส่งแบบ inline ด้วย `serviceAccount` (สตริง JSON) ได้เช่นกัน
- รองรับ `serviceAccountRef` ด้วย (env/file SecretRef) รวมถึง refs รายบัญชีภายใต้ `channels.googlechat.accounts.<id>.serviceAccountRef`
- พาธ Webhook เริ่มต้นคือ `/googlechat` หากไม่ได้ตั้งค่า `webhookPath`
- `dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ principal อีเมลที่เปลี่ยนแปลงได้สำหรับ allowlists อีกครั้ง (โหมดความเข้ากันได้ฉุกเฉิน)
- มี reactions ให้ใช้งานผ่านเครื่องมือ `reactions` และ `channels action` เมื่อเปิดใช้ `actions.reactions`
- การดำเนินการกับข้อความเปิดเผย `send` สำหรับข้อความและ `upload-file` สำหรับการส่งไฟล์แนบโดยชัดเจน `upload-file` รับ `media` / `filePath` / `path` พร้อม `message`, `filename` และการกำหนดเป้าหมาย thread แบบไม่บังคับ
- `typingIndicator` รองรับ `none`, `message` (ค่าเริ่มต้น) และ `reaction` (`reaction` ต้องใช้ OAuth ของผู้ใช้)
- ไฟล์แนบถูกดาวน์โหลดผ่าน Chat API และจัดเก็บใน media pipeline (จำกัดขนาดด้วย `mediaMaxMb`)

รายละเอียดการอ้างอิงความลับ: [การจัดการความลับ](/th/gateway/secrets)

## การแก้ไขปัญหา

### 405 Method Not Allowed

หาก Google Cloud Logs Explorer แสดงข้อผิดพลาดเช่น:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

หมายความว่า webhook handler ยังไม่ได้ลงทะเบียน สาเหตุที่พบบ่อย:

1. **ยังไม่ได้กำหนดค่า channel**: ส่วน `channels.googlechat` หายไปจาก config ของคุณ ตรวจสอบด้วย:

   ```bash
   openclaw config get channels.googlechat
   ```

   หากส่งคืน "Config path not found" ให้เพิ่มการกำหนดค่า (ดู [จุดสำคัญของ Config](#config-highlights))

2. **Plugin ไม่ได้เปิดใช้**: ตรวจสอบสถานะ Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   หากแสดงว่า "disabled" ให้เพิ่ม `plugins.entries.googlechat.enabled: true` ใน config ของคุณ

3. **Gateway ไม่ได้รีสตาร์ต**: หลังจากเพิ่ม config แล้ว ให้รีสตาร์ต Gateway:

   ```bash
   openclaw gateway restart
   ```

ตรวจสอบว่า channel กำลังทำงาน:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### ปัญหาอื่น ๆ

- ตรวจสอบ `openclaw channels status --probe` สำหรับข้อผิดพลาด auth หรือ config audience ที่หายไป
- หากไม่มีข้อความเข้ามา ให้ยืนยัน URL Webhook + event subscriptions ของแอป Chat
- หาก mention gating บล็อกการตอบกลับ ให้ตั้งค่า `botUser` เป็นชื่อทรัพยากรผู้ใช้ของแอปและตรวจสอบ `requireMention`
- ใช้ `openclaw logs --follow` ขณะส่งข้อความทดสอบเพื่อดูว่าคำขอไปถึง Gateway หรือไม่

เอกสารที่เกี่ยวข้อง:

- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [ความปลอดภัย](/th/gateway/security)
- [Reactions](/th/tools/reactions)

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — channel ทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและ mention gating
- [Channel Routing](/th/channels/channel-routing) — session routing สำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
