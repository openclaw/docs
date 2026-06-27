---
read_when:
    - กำลังทำงานเกี่ยวกับฟีเจอร์ช่องทาง Google Chat
summary: สถานะการรองรับแอป Google Chat ความสามารถ และการกำหนดค่า
title: Google Chat
x-i18n:
    generated_at: "2026-06-27T17:09:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d506f6e92bfb73940254ca906c7581f24ac49d3f498fcae213eae71c4449442
    source_path: channels/googlechat.md
    workflow: 16
---

สถานะ: Plugin ที่ดาวน์โหลดได้สำหรับ DM + พื้นที่ผ่าน Webhook ของ Google Chat API (HTTP เท่านั้น).

## ติดตั้ง

ติดตั้ง Google Chat ก่อนกำหนดค่าช่องทาง:

```bash
openclaw plugins install @openclaw/googlechat
```

เช็กเอาต์ในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## ตั้งค่าแบบรวดเร็ว (ผู้เริ่มต้น)

1. สร้างโปรเจกต์ Google Cloud และเปิดใช้ **Google Chat API**.
   - ไปที่: [ข้อมูลรับรอง Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - เปิดใช้ API หากยังไม่ได้เปิดใช้.
2. สร้าง **บัญชีบริการ**:
   - กด **สร้างข้อมูลรับรอง** > **บัญชีบริการ**.
   - ตั้งชื่อตามต้องการ (เช่น `openclaw-chat`).
   - เว้นสิทธิ์ไว้เป็นค่าว่าง (กด **ดำเนินการต่อ**).
   - เว้นผู้มีสิทธิ์เข้าถึงไว้เป็นค่าว่าง (กด **เสร็จสิ้น**).
3. สร้างและดาวน์โหลด **คีย์ JSON**:
   - ในรายการบัญชีบริการ ให้คลิกบัญชีที่คุณเพิ่งสร้าง.
   - ไปที่แท็บ **คีย์**.
   - คลิก **เพิ่มคีย์** > **สร้างคีย์ใหม่**.
   - เลือก **JSON** แล้วกด **สร้าง**.
4. เก็บไฟล์ JSON ที่ดาวน์โหลดไว้บนโฮสต์ Gateway ของคุณ (เช่น `~/.openclaw/googlechat-service-account.json`).
5. สร้างแอป Google Chat ใน [การกำหนดค่า Chat บน Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - กรอก **ข้อมูลแอปพลิเคชัน**:
     - **ชื่อแอป**: (เช่น `OpenClaw`)
     - **URL อวาตาร์**: (เช่น `https://openclaw.ai/logo.png`)
     - **คำอธิบาย**: (เช่น `Personal AI Assistant`)
   - เปิดใช้ **ฟีเจอร์แบบโต้ตอบ**.
   - ภายใต้ **ฟังก์ชันการทำงาน** ให้เลือก **เข้าร่วมพื้นที่และการสนทนากลุ่ม**.
   - ภายใต้ **การตั้งค่าการเชื่อมต่อ** ให้เลือก **URL ปลายทาง HTTP**.
   - ภายใต้ **ทริกเกอร์** ให้เลือก **ใช้ URL ปลายทาง HTTP ร่วมกันสำหรับทุกทริกเกอร์** และตั้งค่าเป็น URL สาธารณะของ Gateway ตามด้วย `/googlechat`.
     - _เคล็ดลับ: รัน `openclaw status` เพื่อหา URL สาธารณะของ Gateway._
   - ภายใต้ **การมองเห็น** ให้เลือก **ทำให้แอป Chat นี้พร้อมใช้งานสำหรับบุคคลและกลุ่มที่ระบุใน `<Your Domain>`**.
   - ใส่ที่อยู่อีเมลของคุณ (เช่น `user@example.com`) ในกล่องข้อความ.
   - คลิก **บันทึก** ที่ด้านล่าง.
6. **เปิดใช้สถานะแอป**:
   - หลังจากบันทึกแล้ว ให้ **รีเฟรชหน้า**.
   - มองหาส่วน **สถานะแอป** (โดยปกติจะอยู่ใกล้ด้านบนหรือด้านล่างหลังจากบันทึก).
   - เปลี่ยนสถานะเป็น **เผยแพร่จริง - พร้อมใช้งานสำหรับผู้ใช้**.
   - คลิก **บันทึก** อีกครั้ง.
7. กำหนดค่า OpenClaw ด้วยพาธบัญชีบริการ + กลุ่มเป้าหมาย Webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - หรือ config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. ตั้งค่าประเภทกลุ่มเป้าหมาย Webhook + ค่า (ให้ตรงกับการกำหนดค่าแอป Chat ของคุณ).
9. เริ่ม Gateway. Google Chat จะ POST ไปยังพาธ Webhook ของคุณ.

## เพิ่มไปยัง Google Chat

เมื่อ Gateway กำลังทำงานและอีเมลของคุณถูกเพิ่มลงในรายการการมองเห็นแล้ว:

1. ไปที่ [Google Chat](https://chat.google.com/).
2. คลิกไอคอน **+** (บวก) ถัดจาก **ข้อความส่วนตัว**.
3. ในแถบค้นหา (ที่คุณใช้เพิ่มคนตามปกติ) ให้พิมพ์ **ชื่อแอป** ที่คุณกำหนดค่าไว้ใน Google Cloud Console.
   - **หมายเหตุ**: บอทจะ _ไม่_ ปรากฏในรายการเรียกดู "Marketplace" เพราะเป็นแอปส่วนตัว. คุณต้องค้นหาด้วยชื่อ.
4. เลือกบอทของคุณจากผลลัพธ์.
5. คลิก **เพิ่ม** หรือ **แชท** เพื่อเริ่มการสนทนาแบบ 1:1.
6. ส่ง "Hello" เพื่อเรียกใช้งานผู้ช่วย!

## URL สาธารณะ (เฉพาะ Webhook)

Webhook ของ Google Chat ต้องใช้ปลายทาง HTTPS สาธารณะ. เพื่อความปลอดภัย ให้ **เปิดเผยเฉพาะพาธ `/googlechat`** ต่ออินเทอร์เน็ต. เก็บแดชบอร์ด OpenClaw และปลายทางที่ละเอียดอ่อนอื่นไว้ในเครือข่ายส่วนตัวของคุณ.

### ตัวเลือก A: Tailscale Funnel (แนะนำ)

ใช้ Tailscale Serve สำหรับแดชบอร์ดส่วนตัว และ Funnel สำหรับพาธ Webhook สาธารณะ. วิธีนี้ทำให้ `/` เป็นส่วนตัว ขณะที่เปิดเผยเฉพาะ `/googlechat`.

1. **ตรวจสอบว่า Gateway ของคุณผูกกับที่อยู่ใด:**

   ```bash
   ss -tlnp | grep 18789
   ```

   จดที่อยู่ IP ไว้ (เช่น `127.0.0.1`, `0.0.0.0` หรือ IP Tailscale ของคุณ เช่น `100.x.x.x`).

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

4. **อนุญาตโหนดให้เข้าถึง Funnel:**
   หากมีพรอมป์ ให้เปิด URL การอนุญาตที่แสดงในเอาต์พุตเพื่อเปิดใช้ Funnel สำหรับโหนดนี้ในนโยบาย tailnet ของคุณ.

5. **ตรวจสอบการกำหนดค่า:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

URL Webhook สาธารณะของคุณจะเป็น:
`https://<node-name>.<tailnet>.ts.net/googlechat`

แดชบอร์ดส่วนตัวของคุณยังคงเป็นแบบเฉพาะ tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

ใช้ URL สาธารณะ (ไม่รวม `:8443`) ในการกำหนดค่าแอป Google Chat.

> หมายเหตุ: การกำหนดค่านี้คงอยู่หลังรีบูต. หากต้องการลบในภายหลัง ให้รัน `tailscale funnel reset` และ `tailscale serve reset`.

### ตัวเลือก B: Reverse Proxy (Caddy)

หากคุณใช้ Reverse Proxy เช่น Caddy ให้พร็อกซีเฉพาะพาธที่ระบุ:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

ด้วย config นี้ คำขอใดก็ตามที่ไปยัง `your-domain.com/` จะถูกละเว้นหรือส่งคืนเป็น 404 ขณะที่ `your-domain.com/googlechat` จะถูกส่งต่อไปยัง OpenClaw อย่างปลอดภัย.

### ตัวเลือก C: Cloudflare Tunnel

กำหนดค่ากฎ ingress ของ tunnel ให้ส่งต่อเฉพาะพาธ Webhook:

- **พาธ**: `/googlechat` -> `http://localhost:18789/googlechat`
- **กฎเริ่มต้น**: HTTP 404 (ไม่พบ)

## วิธีการทำงาน

1. Google Chat ส่ง Webhook POST ไปยัง Gateway. คำขอแต่ละรายการมีส่วนหัว `Authorization: Bearer <token>`.
   - OpenClaw ตรวจสอบ bearer auth ก่อนอ่าน/แยกวิเคราะห์เนื้อหา Webhook ทั้งหมดเมื่อมีส่วนหัวนี้.
   - รองรับคำขอ Google Workspace Add-on ที่มี `authorizationEventObject.systemIdToken` ในเนื้อหา ผ่านงบประมาณเนื้อหาก่อนตรวจสอบสิทธิ์ที่เข้มงวดยิ่งขึ้น.
2. OpenClaw ตรวจสอบโทเค็นกับ `audienceType` + `audience` ที่กำหนดค่าไว้:
   - `audienceType: "app-url"` → กลุ่มเป้าหมายคือ URL Webhook HTTPS ของคุณ.
   - `audienceType: "project-number"` → กลุ่มเป้าหมายคือหมายเลขโปรเจกต์ Cloud.
3. ข้อความถูกกำหนดเส้นทางตามพื้นที่:
   - DM ใช้คีย์เซสชัน `agent:<agentId>:googlechat:direct:<spaceId>`.
   - พื้นที่ใช้คีย์เซสชัน `agent:<agentId>:googlechat:group:<spaceId>`.
4. การเข้าถึง DM ใช้การจับคู่เป็นค่าเริ่มต้น. ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่; อนุมัติด้วย:
   - `openclaw pairing approve googlechat <code>`
5. พื้นที่กลุ่มต้อง @-mention เป็นค่าเริ่มต้น. ใช้ `botUser` หากการตรวจจับ mention ต้องใช้ชื่อผู้ใช้ของแอป.
6. เมื่อคำขออนุมัติ exec หรือ Plugin เริ่มจาก Google Chat และมีการกำหนดค่าผู้อนุมัติ `users/<id>` ที่เสถียร OpenClaw จะโพสต์การ์ดอนุมัติของ Google Chat แบบเนทีฟในพื้นที่หรือเธรดต้นทาง. ปุ่มบนการ์ดใช้โทเค็น callback แบบทึบ และพรอมป์ `/approve <id> <decision>` แบบแมนนวลจะแสดงเฉพาะเมื่อไม่สามารถส่งการอนุมัติแบบเนทีฟได้.

## เป้าหมาย

ใช้ตัวระบุเหล่านี้สำหรับการส่งและ allowlist:

- ข้อความส่วนตัว: `users/<userId>` (แนะนำ).
- อีเมลดิบ `name@example.com` เปลี่ยนแปลงได้ และใช้เฉพาะสำหรับการจับคู่ allowlist โดยตรงเมื่อ `channels.googlechat.dangerouslyAllowNameMatching: true`.
- เลิกใช้แล้ว: `users/<email>` จะถูกถือเป็น id ผู้ใช้ ไม่ใช่ allowlist อีเมล.
- พื้นที่: `spaces/<spaceId>`.

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

- ข้อมูลรับรองบัญชีบริการสามารถส่งแบบ inline ด้วย `serviceAccount` (สตริง JSON) ได้เช่นกัน.
- รองรับ `serviceAccountRef` ด้วย (SecretRef แบบ env/file) รวมถึง refs ต่อบัญชีภายใต้ `channels.googlechat.accounts.<id>.serviceAccountRef`.
- พาธ Webhook เริ่มต้นคือ `/googlechat` หากไม่ได้ตั้งค่า `webhookPath`.
- `dangerouslyAllowNameMatching` เปิดใช้การจับคู่ principal อีเมลที่เปลี่ยนแปลงได้อีกครั้งสำหรับ allowlist (โหมดความเข้ากันได้สำหรับกรณีฉุกเฉิน).
- Reactions พร้อมใช้งานผ่านเครื่องมือ `reactions` และ `channels action` เมื่อเปิดใช้ `actions.reactions`.
- การ์ดอนุมัติแบบเนทีฟใช้การคลิกปุ่ม `cardsV2` ของ Google Chat ไม่ใช่เหตุการณ์ reaction. ผู้อนุมัติมาจาก `dm.allowFrom` หรือ `defaultTo` และต้องเป็นค่า `users/<id>` แบบตัวเลขที่เสถียร.
- การกระทำของข้อความเปิดเผย `send` สำหรับข้อความ และ `upload-file` สำหรับการส่งไฟล์แนบแบบชัดเจน. `upload-file` รับ `media` / `filePath` / `path` พร้อม `message`, `filename` และการกำหนดเป้าหมายเธรดที่เป็นตัวเลือก.
- `typingIndicator` รองรับ `message` (ค่าเริ่มต้น), `none` และ `reaction` (reaction ต้องใช้ OAuth ของผู้ใช้).
- ไฟล์แนบถูกดาวน์โหลดผ่าน Chat API และจัดเก็บใน pipeline สื่อ (จำกัดขนาดโดย `mediaMaxMb`).
- ข้อความ Google Chat ที่บอทเขียนเองจะถูกละเว้นเป็นค่าเริ่มต้น. หากคุณตั้งค่า `allowBots: true` โดยตั้งใจ ข้อความที่บอทเขียนเองซึ่งได้รับการยอมรับจะใช้ [การป้องกันลูปของบอท](/th/channels/bot-loop-protection) ร่วมกัน. กำหนดค่า `channels.defaults.botLoopProtection` แล้ว override ด้วย `channels.googlechat.botLoopProtection` หรือ `channels.googlechat.groups.<space>.botLoopProtection` เมื่อพื้นที่หนึ่งต้องใช้งบประมาณที่ต่างออกไป.

รายละเอียดการอ้างอิงความลับ: [การจัดการความลับ](/th/gateway/secrets).

## การแก้ไขปัญหา

### 405 Method Not Allowed

หาก Google Cloud Logs Explorer แสดงข้อผิดพลาดเช่น:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

หมายความว่า handler ของ Webhook ยังไม่ได้ลงทะเบียน. สาเหตุที่พบบ่อย:

1. **ไม่ได้กำหนดค่าช่องทาง**: ส่วน `channels.googlechat` หายไปจาก config ของคุณ. ตรวจสอบด้วย:

   ```bash
   openclaw config get channels.googlechat
   ```

   หากส่งคืน "Config path not found" ให้เพิ่มการกำหนดค่า (ดู [จุดสำคัญของ Config](#config-highlights)).

2. **ไม่ได้เปิดใช้ Plugin**: ตรวจสอบสถานะ Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   หากแสดงว่า "disabled" ให้เพิ่ม `plugins.entries.googlechat.enabled: true` ลงใน config ของคุณ.

3. **ยังไม่ได้รีสตาร์ท Gateway**: หลังจากเพิ่ม config แล้ว ให้รีสตาร์ท Gateway:

   ```bash
   openclaw gateway restart
   ```

ตรวจสอบว่าช่องทางกำลังทำงาน:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### ปัญหาอื่น

- ตรวจสอบ `openclaw channels status --probe` สำหรับข้อผิดพลาด auth หรือ config กลุ่มเป้าหมายที่ขาดหาย.
- หากไม่มีข้อความเข้ามา ให้ยืนยัน URL Webhook + การสมัครรับเหตุการณ์ของแอป Chat.
- หากการกั้นด้วย mention บล็อกการตอบกลับ ให้ตั้งค่า `botUser` เป็นชื่อ resource ผู้ใช้ของแอป และตรวจสอบ `requireMention`.
- ใช้ `openclaw logs --follow` ขณะส่งข้อความทดสอบเพื่อดูว่าคำขอไปถึง Gateway หรือไม่.

เอกสารที่เกี่ยวข้อง:

- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [ความปลอดภัย](/th/gateway/security)
- [Reactions](/th/tools/reactions)

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนผ่าน DM และขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
