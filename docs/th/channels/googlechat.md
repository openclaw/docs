---
read_when:
    - กำลังทำงานกับฟีเจอร์ช่องทาง Google Chat
summary: สถานะการรองรับแอป Google Chat, ความสามารถ และการกำหนดค่า
title: Google Chat
x-i18n:
    generated_at: "2026-05-02T10:07:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdb8dcf651602e92801d7107646d853871ea6cef188a8733a831695a1243740e
    source_path: channels/googlechat.md
    workflow: 16
---

สถานะ: Plugin ที่ดาวน์โหลดได้สำหรับ DM + สเปซผ่าน Webhook ของ Google Chat API (HTTP เท่านั้น)

## ติดตั้ง

ติดตั้ง Google Chat ก่อนกำหนดค่าช่องทาง:

```bash
openclaw plugins install @openclaw/googlechat
```

เช็กเอาต์ในเครื่อง (เมื่อเรียกใช้จาก git repo):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## ตั้งค่าอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. สร้างโปรเจกต์ Google Cloud และเปิดใช้ **Google Chat API**
   - ไปที่: [ข้อมูลรับรอง Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - เปิดใช้ API หากยังไม่ได้เปิดใช้
2. สร้าง **Service Account**:
   - กด **Create Credentials** > **Service Account**
   - ตั้งชื่ออะไรก็ได้ที่ต้องการ (เช่น `openclaw-chat`)
   - เว้นสิทธิ์ว่างไว้ (กด **Continue**)
   - เว้นผู้รับสิทธิ์เข้าถึงว่างไว้ (กด **Done**)
3. สร้างและดาวน์โหลด **JSON Key**:
   - ในรายการ service account ให้คลิกตัวที่คุณเพิ่งสร้าง
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
   - ใต้ **Functionality** ให้เลือก **Join spaces and group conversations**
   - ใต้ **Connection settings** ให้เลือก **HTTP endpoint URL**
   - ใต้ **Triggers** ให้เลือก **Use a common HTTP endpoint URL for all triggers** แล้วตั้งค่าเป็น URL สาธารณะของ Gateway ตามด้วย `/googlechat`
     - _เคล็ดลับ: เรียกใช้ `openclaw status` เพื่อหา URL สาธารณะของ Gateway_
   - ใต้ **Visibility** ให้เลือก **Make this Chat app available to specific people and groups in `<Your Domain>`**
   - ป้อนอีเมลของคุณ (เช่น `user@example.com`) ในกล่องข้อความ
   - คลิก **Save** ที่ด้านล่าง
6. **เปิดใช้สถานะแอป**:
   - หลังบันทึกแล้ว ให้ **รีเฟรชหน้า**
   - มองหาส่วน **App status** (มักอยู่ใกล้ด้านบนหรือด้านล่างหลังบันทึก)
   - เปลี่ยนสถานะเป็น **Live - available to users**
   - คลิก **Save** อีกครั้ง
7. กำหนดค่า OpenClaw ด้วยพาธ service account + กลุ่มเป้าหมายของ Webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - หรือ config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`
8. ตั้งค่าประเภท + ค่ากลุ่มเป้าหมายของ Webhook (ให้ตรงกับ config แอป Chat ของคุณ)
9. เริ่ม Gateway Google Chat จะส่ง POST ไปยังพาธ Webhook ของคุณ

## เพิ่มไปยัง Google Chat

เมื่อ Gateway ทำงานอยู่และอีเมลของคุณถูกเพิ่มในรายการการมองเห็นแล้ว:

1. ไปที่ [Google Chat](https://chat.google.com/)
2. คลิกไอคอน **+** (บวก) ถัดจาก **ข้อความส่วนตัว**
3. ในแถบค้นหา (ตำแหน่งที่ปกติใช้เพิ่มคน) ให้พิมพ์ **ชื่อแอป** ที่คุณกำหนดค่าใน Google Cloud Console
   - **หมายเหตุ**: บอทจะ _ไม่_ ปรากฏในรายการเรียกดู "Marketplace" เพราะเป็นแอปส่วนตัว คุณต้องค้นหาด้วยชื่อ
4. เลือกบอทของคุณจากผลลัพธ์
5. คลิก **Add** หรือ **Chat** เพื่อเริ่มการสนทนาแบบ 1:1
6. ส่ง "สวัสดี" เพื่อเรียกใช้งานผู้ช่วย!

## URL สาธารณะ (เฉพาะ Webhook)

Webhook ของ Google Chat ต้องใช้เอนด์พอยต์ HTTPS สาธารณะ เพื่อความปลอดภัย **ให้เปิดเผยเฉพาะพาธ `/googlechat`** สู่อินเทอร์เน็ต เก็บแดชบอร์ด OpenClaw และเอนด์พอยต์อ่อนไหวอื่น ๆ ไว้ในเครือข่ายส่วนตัวของคุณ

### ตัวเลือก A: Tailscale Funnel (แนะนำ)

ใช้ Tailscale Serve สำหรับแดชบอร์ดส่วนตัวและ Funnel สำหรับพาธ Webhook สาธารณะ วิธีนี้ทำให้ `/` เป็นส่วนตัว ขณะเปิดเผยเฉพาะ `/googlechat`

1. **ตรวจสอบว่า Gateway ของคุณผูกอยู่กับแอดเดรสใด:**

   ```bash
   ss -tlnp | grep 18789
   ```

   จดที่อยู่ IP ไว้ (เช่น `127.0.0.1`, `0.0.0.0` หรือ IP ของ Tailscale เช่น `100.x.x.x`)

2. **เปิดแดชบอร์ดให้เฉพาะ tailnet เท่านั้น (พอร์ต 8443):**

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

4. **อนุญาต node ให้เข้าถึง Funnel:**
   หากระบบแจ้ง ให้ไปที่ URL อนุญาตที่แสดงในเอาต์พุตเพื่อเปิดใช้ Funnel สำหรับ node นี้ในนโยบาย tailnet ของคุณ

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

> หมายเหตุ: การกำหนดค่านี้คงอยู่ข้ามการรีบูต หากต้องการนำออกภายหลัง ให้เรียกใช้ `tailscale funnel reset` และ `tailscale serve reset`

### ตัวเลือก B: รีเวิร์สพร็อกซี (Caddy)

หากคุณใช้รีเวิร์สพร็อกซีอย่าง Caddy ให้พร็อกซีเฉพาะพาธที่ระบุเท่านั้น:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

ด้วย config นี้ คำขอใด ๆ ไปยัง `your-domain.com/` จะถูกเพิกเฉยหรือส่งกลับเป็น 404 ขณะที่ `your-domain.com/googlechat` จะถูกกำหนดเส้นทางไปยัง OpenClaw อย่างปลอดภัย

### ตัวเลือก C: Cloudflare Tunnel

กำหนดค่า ingress rules ของ tunnel ให้กำหนดเส้นทางเฉพาะพาธ Webhook:

- **พาธ**: `/googlechat` -> `http://localhost:18789/googlechat`
- **กฎเริ่มต้น**: HTTP 404 (Not Found)

## วิธีการทำงาน

1. Google Chat ส่ง Webhook POST ไปยัง Gateway แต่ละคำขอมีส่วนหัว `Authorization: Bearer <token>`
   - OpenClaw ตรวจสอบ bearer auth ก่อนอ่าน/แยกวิเคราะห์เนื้อหา Webhook แบบเต็มเมื่อมีส่วนหัวนี้
   - รองรับคำขอ Google Workspace Add-on ที่มี `authorizationEventObject.systemIdToken` ในเนื้อหาผ่านงบประมาณเนื้อหา pre-auth ที่เข้มงวดยิ่งขึ้น
2. OpenClaw ตรวจสอบ token เทียบกับ `audienceType` + `audience` ที่กำหนดค่าไว้:
   - `audienceType: "app-url"` → audience คือ URL Webhook HTTPS ของคุณ
   - `audienceType: "project-number"` → audience คือหมายเลขโปรเจกต์ Cloud
3. ข้อความถูกกำหนดเส้นทางตามสเปซ:
   - DM ใช้คีย์เซสชัน `agent:<agentId>:googlechat:direct:<spaceId>`
   - สเปซใช้คีย์เซสชัน `agent:<agentId>:googlechat:group:<spaceId>`
4. การเข้าถึง DM ใช้การจับคู่เป็นค่าเริ่มต้น ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ อนุมัติด้วย:
   - `openclaw pairing approve googlechat <code>`
5. สเปซแบบกลุ่มต้อง @-mention เป็นค่าเริ่มต้น ใช้ `botUser` หากการตรวจจับ mention ต้องใช้ชื่อผู้ใช้ของแอป

## เป้าหมาย

ใช้ตัวระบุเหล่านี้สำหรับการส่งและ allowlist:

- ข้อความส่วนตัว: `users/<userId>` (แนะนำ)
- อีเมลดิบ `name@example.com` เปลี่ยนแปลงได้และใช้เฉพาะสำหรับการจับคู่ allowlist โดยตรงเมื่อ `channels.googlechat.dangerouslyAllowNameMatching: true`
- เลิกใช้แล้ว: `users/<email>` จะถูกถือว่าเป็น user id ไม่ใช่ allowlist อีเมล
- สเปซ: `spaces/<spaceId>`

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
          allow: true,
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

- ข้อมูลรับรอง service account สามารถส่งแบบ inline ด้วย `serviceAccount` (สตริง JSON) ได้ด้วย
- รองรับ `serviceAccountRef` ด้วยเช่นกัน (env/file SecretRef) รวมถึง refs แบบต่อบัญชีใต้ `channels.googlechat.accounts.<id>.serviceAccountRef`
- พาธ Webhook เริ่มต้นคือ `/googlechat` หากไม่ได้ตั้งค่า `webhookPath`
- `dangerouslyAllowNameMatching` เปิดใช้การจับคู่ principal อีเมลที่เปลี่ยนแปลงได้อีกครั้งสำหรับ allowlist (โหมดความเข้ากันได้แบบ break-glass)
- ปฏิกิริยาพร้อมใช้งานผ่านเครื่องมือ `reactions` และ `channels action` เมื่อเปิดใช้ `actions.reactions`
- การดำเนินการกับข้อความเปิดเผย `send` สำหรับข้อความ และ `upload-file` สำหรับการส่งไฟล์แนบแบบระบุชัดเจน `upload-file` รับ `media` / `filePath` / `path` พร้อม `message`, `filename` และการกำหนดเป้าหมายเธรดที่เป็นตัวเลือก
- `typingIndicator` รองรับ `none`, `message` (ค่าเริ่มต้น) และ `reaction` (`reaction` ต้องใช้ OAuth ของผู้ใช้)
- ไฟล์แนบถูกดาวน์โหลดผ่าน Chat API และจัดเก็บใน pipeline สื่อ (จำกัดขนาดด้วย `mediaMaxMb`)

รายละเอียด secrets reference: [การจัดการ Secrets](/th/gateway/secrets)

## การแก้ไขปัญหา

### 405 Method Not Allowed

หาก Google Cloud Logs Explorer แสดงข้อผิดพลาดเช่น:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

หมายความว่า webhook handler ไม่ได้ลงทะเบียน สาเหตุที่พบบ่อย:

1. **ไม่ได้กำหนดค่าช่องทาง**: ส่วน `channels.googlechat` หายไปจาก config ของคุณ ตรวจสอบด้วย:

   ```bash
   openclaw config get channels.googlechat
   ```

   หากส่งกลับ "Config path not found" ให้เพิ่มการกำหนดค่า (ดู [ไฮไลต์ config](#config-highlights))

2. **ไม่ได้เปิดใช้ Plugin**: ตรวจสอบสถานะ Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   หากแสดงว่า "disabled" ให้เพิ่ม `plugins.entries.googlechat.enabled: true` ใน config ของคุณ

3. **Gateway ยังไม่ได้รีสตาร์ต**: หลังเพิ่ม config แล้ว ให้รีสตาร์ต Gateway:

   ```bash
   openclaw gateway restart
   ```

ตรวจสอบว่าช่องทางกำลังทำงาน:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### ปัญหาอื่น ๆ

- ตรวจสอบ `openclaw channels status --probe` เพื่อดูข้อผิดพลาด auth หรือ config audience ที่ขาดหาย
- หากไม่มีข้อความเข้ามา ให้ยืนยัน URL Webhook + การสมัครรับเหตุการณ์ของแอป Chat
- หาก mention gating บล็อกการตอบกลับ ให้ตั้งค่า `botUser` เป็นชื่อทรัพยากรผู้ใช้ของแอปและตรวจสอบ `requireMention`
- ใช้ `openclaw logs --follow` ขณะส่งข้อความทดสอบเพื่อดูว่าคำขอไปถึง Gateway หรือไม่

เอกสารที่เกี่ยวข้อง:

- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [ความปลอดภัย](/th/gateway/security)
- [ปฏิกิริยา](/th/tools/reactions)

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและ mention gating
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
