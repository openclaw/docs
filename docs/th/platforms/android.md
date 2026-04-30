---
read_when:
    - การจับคู่หรือเชื่อมต่อ Android Node อีกครั้ง
    - การดีบักการค้นหา Gateway หรือการตรวจสอบสิทธิ์บน Android
    - การตรวจสอบความเท่าเทียมของประวัติการแชตระหว่างไคลเอนต์
summary: 'แอป Android (node): คู่มือปฏิบัติการการเชื่อมต่อ + พื้นผิวคำสั่ง Connect/Chat/Voice/Canvas'
title: แอป Android
x-i18n:
    generated_at: "2026-04-30T10:03:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae8bec406a006165f124f305e00c848f5527d43dba3cbcd07bd0d7e6f0dcc247
    source_path: platforms/android.md
    workflow: 16
---

<Note>
แอป Android ยังไม่ได้เผยแพร่สู่สาธารณะ ซอร์สโค้ดมีอยู่ใน [ที่เก็บ OpenClaw](https://github.com/openclaw/openclaw) ภายใต้ `apps/android` คุณสามารถบิลด์เองได้โดยใช้ Java 17 และ Android SDK (`./gradlew :app:assemblePlayDebug`) ดูคำแนะนำการบิลด์ที่ [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)
</Note>

## ภาพรวมการรองรับ

- บทบาท: แอปโหนดคู่หู (Android ไม่ได้โฮสต์ Gateway)
- ต้องใช้ Gateway: ใช่ (รันบน macOS, Linux หรือ Windows ผ่าน WSL2)
- ติดตั้ง: [เริ่มต้นใช้งาน](/th/start/getting-started) + [การจับคู่](/th/channels/pairing)
- Gateway: [Runbook](/th/gateway) + [การกำหนดค่า](/th/gateway/configuration)
  - โปรโตคอล: [โปรโตคอล Gateway](/th/gateway/protocol) (โหนด + control plane)

## การควบคุมระบบ

การควบคุมระบบ (launchd/systemd) อยู่บนโฮสต์ Gateway ดู [Gateway](/th/gateway)

## Runbook การเชื่อมต่อ

แอปโหนด Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android เชื่อมต่อโดยตรงกับ Gateway WebSocket และใช้การจับคู่อุปกรณ์ (`role: node`)

สำหรับ Tailscale หรือโฮสต์สาธารณะ Android ต้องใช้ endpoint ที่ปลอดภัย:

- แนะนำ: Tailscale Serve / Funnel พร้อม `https://<magicdns>` / `wss://<magicdns>`
- รองรับด้วย: URL Gateway `wss://` อื่นใดที่มี endpoint TLS จริง
- Cleartext `ws://` ยังคงรองรับบนที่อยู่ LAN ส่วนตัว / โฮสต์ `.local` รวมถึง `localhost`, `127.0.0.1` และบริดจ์ emulator ของ Android (`10.0.2.2`)

### ข้อกำหนดเบื้องต้น

- คุณสามารถรัน Gateway บนเครื่อง “master” ได้
- อุปกรณ์/ตัวจำลอง Android สามารถเข้าถึง gateway WebSocket ได้:
  - LAN เดียวกันพร้อม mDNS/NSD, **หรือ**
  - tailnet ของ Tailscale เดียวกันโดยใช้ Wide-Area Bonjour / unicast DNS-SD (ดูด้านล่าง), **หรือ**
  - โฮสต์/พอร์ต gateway แบบกำหนดเอง (ทางเลือกสำรอง)
- การจับคู่อุปกรณ์มือถือผ่าน tailnet/สาธารณะ **ไม่** ใช้ endpoint IP tailnet ดิบแบบ `ws://` ให้ใช้ Tailscale Serve หรือ URL `wss://` อื่นแทน
- คุณสามารถรัน CLI (`openclaw`) บนเครื่อง gateway ได้ (หรือผ่าน SSH)

### 1) เริ่ม Gateway

```bash
openclaw gateway --port 18789 --verbose
```

ยืนยันว่าในล็อกเห็นข้อความประมาณนี้:

- `listening on ws://0.0.0.0:18789`

สำหรับการเข้าถึง Android ระยะไกลผ่าน Tailscale แนะนำให้ใช้ Serve/Funnel แทนการ bind tailnet ดิบ:

```bash
openclaw gateway --tailscale serve
```

สิ่งนี้จะให้ endpoint `wss://` / `https://` ที่ปลอดภัยแก่ Android การตั้งค่า `gateway.bind: "tailnet"` แบบธรรมดาไม่เพียงพอสำหรับการจับคู่ Android ระยะไกลครั้งแรก เว้นแต่คุณจะ terminate TLS แยกต่างหากด้วย

### 2) ตรวจสอบการค้นพบ (ไม่บังคับ)

จากเครื่อง gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

บันทึกการดีบักเพิ่มเติม: [Bonjour](/th/gateway/bonjour)

หากคุณกำหนดค่าโดเมนการค้นพบแบบ wide-area ไว้ด้วย ให้เปรียบเทียบกับ:

```bash
openclaw gateway discover --json
```

คำสั่งนี้แสดง `local.` รวมกับโดเมน wide-area ที่กำหนดค่าไว้ในรอบเดียว และใช้
endpoint ของบริการที่ resolve แล้วแทน hint แบบ TXT เท่านั้น

#### การค้นพบผ่าน tailnet (Vienna ⇄ London) ด้วย unicast DNS-SD

การค้นพบ Android NSD/mDNS จะไม่ข้ามเครือข่าย หากโหนด Android และ gateway อยู่คนละเครือข่ายแต่เชื่อมต่อผ่าน Tailscale ให้ใช้ Wide-Area Bonjour / unicast DNS-SD แทน

การค้นพบอย่างเดียวไม่เพียงพอสำหรับการจับคู่ Android ผ่าน tailnet/สาธารณะ เส้นทางที่ค้นพบยังต้องมี endpoint ที่ปลอดภัย (`wss://` หรือ Tailscale Serve):

1. ตั้งค่าโซน DNS-SD (ตัวอย่าง `openclaw.internal.`) บนโฮสต์ gateway และเผยแพร่เรคคอร์ด `_openclaw-gw._tcp`
2. กำหนดค่า Tailscale split DNS สำหรับโดเมนที่คุณเลือกให้ชี้ไปยังเซิร์ฟเวอร์ DNS นั้น

รายละเอียดและตัวอย่างการกำหนดค่า CoreDNS: [Bonjour](/th/gateway/bonjour)

### 3) เชื่อมต่อจาก Android

ในแอป Android:

- แอปคงการเชื่อมต่อ gateway ให้ทำงานอยู่ผ่าน **foreground service** (การแจ้งเตือนถาวร)
- เปิดแท็บ **เชื่อมต่อ**
- ใช้โหมด **Setup Code** หรือ **Manual**
- หากการค้นพบถูกบล็อก ให้ใช้โฮสต์/พอร์ตแบบกำหนดเองใน **ตัวควบคุมขั้นสูง** สำหรับโฮสต์ LAN ส่วนตัว `ws://` ยังใช้งานได้ สำหรับโฮสต์ Tailscale/สาธารณะ ให้เปิด TLS และใช้ endpoint `wss://` / Tailscale Serve

หลังจากจับคู่สำเร็จครั้งแรก Android จะเชื่อมต่อใหม่อัตโนมัติเมื่อเปิดแอป:

- endpoint แบบกำหนดเอง (หากเปิดใช้), มิฉะนั้น
- gateway ที่ค้นพบล่าสุด (แบบ best-effort)

### บีคอน Presence alive

หลังจากเซสชันโหนดที่ยืนยันตัวตนแล้วเชื่อมต่อ และเมื่อแอปย้ายไปอยู่เบื้องหลังขณะที่
foreground service ยังเชื่อมต่ออยู่ Android จะเรียก `node.event` พร้อม
`event: "node.presence.alive"` gateway จะบันทึกสิ่งนี้เป็น `lastSeenAtMs`/`lastSeenReason` บน
เมตาดาต้าของโหนด/อุปกรณ์ที่จับคู่แล้ว เฉพาะหลังจากทราบ identity ของอุปกรณ์โหนดที่ยืนยันตัวตนแล้วเท่านั้น

แอปจะนับว่าบีคอนถูกบันทึกสำเร็จเฉพาะเมื่อการตอบกลับของ gateway มี
`handled: true` gateway รุ่นเก่าอาจตอบรับ `node.event` ด้วย `{ "ok": true }`; การตอบกลับนั้น
เข้ากันได้ แต่ไม่นับเป็นการอัปเดต last-seen แบบถาวร

### 4) อนุมัติการจับคู่ (CLI)

บนเครื่อง gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

รายละเอียดการจับคู่: [การจับคู่](/th/channels/pairing)

ไม่บังคับ: หากโหนด Android เชื่อมต่อจาก subnet ที่ควบคุมอย่างเข้มงวดเสมอ
คุณสามารถเลือกเปิดการอนุมัติโหนดครั้งแรกอัตโนมัติด้วย CIDR หรือ IP แบบตรงตัวที่ระบุชัดเจน:

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
public-key ใด ๆ ยังต้องอนุมัติด้วยตนเอง

### 5) ตรวจสอบว่าโหนดเชื่อมต่อแล้ว

- ผ่านสถานะโหนด:

  ```bash
  openclaw nodes status
  ```

- ผ่าน Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) แชต + ประวัติ

แท็บ Chat ของ Android รองรับการเลือกเซสชัน (ค่าเริ่มต้น `main` รวมถึงเซสชันอื่นที่มีอยู่):

- ประวัติ: `chat.history` (ปรับให้เป็นปกติเพื่อแสดงผล; แท็ก directive แบบ inline จะถูก
  ตัดออกจากข้อความที่มองเห็น, payload XML ของการเรียกเครื่องมือแบบข้อความล้วน (รวมถึง
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และ
  บล็อกการเรียกเครื่องมือที่ถูกตัดทอน) และโทเค็นควบคุมโมเดล ASCII/full-width ที่รั่วไหล
  จะถูกตัดออก, แถว assistant ที่เป็น silent-token ล้วน เช่น `NO_REPLY` /
  `no_reply` แบบตรงตัวจะถูกละไว้ และแถวที่ใหญ่เกินไปสามารถถูกแทนที่ด้วย placeholder ได้)
- ส่ง: `chat.send`
- อัปเดตแบบ push (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + กล้อง

#### Gateway Canvas Host (แนะนำสำหรับเนื้อหาเว็บ)

หากคุณต้องการให้โหนดแสดง HTML/CSS/JS จริงที่เอเจนต์สามารถแก้ไขบนดิสก์ได้ ให้ชี้โหนดไปที่ Gateway canvas host

<Note>
โหนดโหลด canvas จากเซิร์ฟเวอร์ HTTP ของ Gateway (พอร์ตเดียวกับ `gateway.port` ค่าเริ่มต้น `18789`)
</Note>

1. สร้าง `~/.openclaw/workspace/canvas/index.html` บนโฮสต์ gateway

2. นำทางโหนดไปยังตำแหน่งนั้น (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (ไม่บังคับ): หากอุปกรณ์ทั้งสองอยู่บน Tailscale ให้ใช้ชื่อ MagicDNS หรือ IP tailnet แทน `.local` เช่น `http://<gateway-magicdns>:18789/__openclaw__/canvas/`

เซิร์ฟเวอร์นี้จะแทรกไคลเอนต์ live-reload ลงใน HTML และรีโหลดเมื่อไฟล์เปลี่ยนแปลง
โฮสต์ A2UI อยู่ที่ `http://<gateway-host>:18789/__openclaw__/a2ui/`

คำสั่ง Canvas (เฉพาะ foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (ใช้ `{"url":""}` หรือ `{"url":"/"}` เพื่อกลับไปยัง scaffold เริ่มต้น) `canvas.snapshot` ส่งคืน `{ format, base64 }` (ค่าเริ่มต้น `format="jpeg"`)
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` legacy alias)

คำสั่งกล้อง (เฉพาะ foreground; ต้องผ่าน permission):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

ดูพารามิเตอร์และตัวช่วย CLI ที่ [โหนดกล้อง](/th/nodes/camera)

### 8) เสียง + พื้นผิวคำสั่ง Android ที่ขยายเพิ่ม

- แท็บ Voice: Android มีโหมดจับเสียงที่ชัดเจนสองโหมด **Mic** คือเซสชันแท็บ Voice แบบ manual ที่ส่งแต่ละช่วงหยุดพูดเป็น turn ของแชต และหยุดเมื่อแอปออกจาก foreground หรือผู้ใช้ออกจากแท็บ Voice **Talk** คือ Talk Mode ต่อเนื่องและจะฟังต่อจนกว่าจะปิด toggle หรือโหนดตัดการเชื่อมต่อ
- Talk Mode จะยกระดับ foreground service ที่มีอยู่จาก `dataSync` เป็น `dataSync|microphone` ก่อนเริ่มจับเสียง จากนั้นลดระดับเมื่อ Talk Mode หยุด Android 14+ ต้องมี declaration `FOREGROUND_SERVICE_MICROPHONE`, runtime grant `RECORD_AUDIO` และชนิดบริการ microphone ณ runtime
- การตอบกลับด้วยเสียงใช้ `talk.speak` ผ่านผู้ให้บริการ Talk ของ gateway ที่กำหนดค่าไว้ TTS ของระบบในเครื่องจะใช้เฉพาะเมื่อ `talk.speak` ใช้งานไม่ได้
- Voice wake ยังคงปิดอยู่ใน UX/runtime ของ Android
- กลุ่มคำสั่ง Android เพิ่มเติม (ความพร้อมใช้งานขึ้นอยู่กับอุปกรณ์ + permission):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (ดู [การส่งต่อการแจ้งเตือน](#notification-forwarding) ด้านล่าง)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## จุดเข้าใช้งานของ Assistant

Android รองรับการเปิด OpenClaw จาก trigger ของ system assistant (Google
Assistant) เมื่อกำหนดค่าแล้ว การกดปุ่มโฮมค้างไว้หรือพูดว่า "Hey Google, ask
OpenClaw..." จะเปิดแอปและส่งพรอมป์เข้าไปยัง chat composer

ฟังก์ชันนี้ใช้เมตาดาต้า **App Actions** ของ Android ที่ประกาศใน manifest ของแอป ไม่ต้องมี
การกำหนดค่าเพิ่มเติมฝั่ง gateway -- assistant intent จะถูก
จัดการโดยแอป Android ทั้งหมดและส่งต่อเป็นข้อความแชตปกติ

<Note>
ความพร้อมใช้งานของ App Actions ขึ้นอยู่กับอุปกรณ์ เวอร์ชัน Google Play Services
และผู้ใช้ตั้ง OpenClaw เป็นแอป assistant เริ่มต้นหรือไม่
</Note>

## การส่งต่อการแจ้งเตือน

Android สามารถส่งต่อการแจ้งเตือนของอุปกรณ์ไปยัง gateway เป็น events ได้ ตัวควบคุมหลายรายการช่วยให้คุณกำหนดขอบเขตว่าการแจ้งเตือนใดถูกส่งต่อและเมื่อใด

| คีย์                              | ชนิด           | คำอธิบาย                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | ส่งต่อเฉพาะการแจ้งเตือนจากชื่อ package เหล่านี้ หากตั้งค่าไว้ package อื่นทั้งหมดจะถูกละเว้น      |
| `notifications.denyPackages`     | string[]       | ไม่ส่งต่อการแจ้งเตือนจากชื่อ package เหล่านี้เลย ใช้หลังจาก `allowPackages`              |
| `notifications.quietHours.start` | string (HH:mm) | เวลาเริ่มต้นของช่วง quiet hours (เวลาอุปกรณ์ในเครื่อง) การแจ้งเตือนจะถูกระงับระหว่างช่วงเวลานี้ |
| `notifications.quietHours.end`   | string (HH:mm) | เวลาสิ้นสุดของช่วง quiet hours                                                                        |
| `notifications.rateLimit`        | number         | จำนวนการแจ้งเตือนที่ส่งต่อสูงสุดต่อ package ต่อนาที การแจ้งเตือนส่วนเกินจะถูกทิ้ง         |

ตัวเลือกการแจ้งเตือนยังใช้พฤติกรรมที่ปลอดภัยขึ้นสำหรับ events การแจ้งเตือนที่ส่งต่อ เพื่อป้องกันการส่งต่อการแจ้งเตือนระบบที่ละเอียดอ่อนโดยไม่ตั้งใจ

ตัวอย่างการกำหนดค่า:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
การส่งต่อการแจ้งเตือนต้องใช้ permission Android Notification Listener แอปจะแจ้งให้เปิด permission นี้ระหว่างการตั้งค่า
</Note>

## ที่เกี่ยวข้อง

- [แอป iOS](/th/platforms/ios)
- [โหนด](/th/nodes)
- [การแก้ไขปัญหาโหนด Android](/th/nodes/troubleshooting)
