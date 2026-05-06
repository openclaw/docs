---
read_when:
    - การจับคู่หรือเชื่อมต่อ Node Android อีกครั้ง
    - การดีบักการค้นพบ Gateway หรือการยืนยันตัวตนบน Android
    - การตรวจสอบความสอดคล้องของประวัติการแชทระหว่างไคลเอนต์
summary: 'แอป Android (Node): คู่มือปฏิบัติการการเชื่อมต่อ + พื้นผิวคำสั่ง เชื่อมต่อ/แชท/เสียง/ผืนผ้าใบ'
title: แอป Android
x-i18n:
    generated_at: "2026-05-06T09:21:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: cce53df4675e01858ced3d58142512ad096ced0ef50cd617e57b65f9cf911c05
    source_path: platforms/android.md
    workflow: 16
---

<Note>
แอป Android ยังไม่ได้เผยแพร่สาธารณะ ซอร์สโค้ดมีอยู่ใน [ที่เก็บ OpenClaw](https://github.com/openclaw/openclaw) ภายใต้ `apps/android` คุณสามารถ build เองได้โดยใช้ Java 17 และ Android SDK (`./gradlew :app:assemblePlayDebug`) ดูคำแนะนำการ build ได้ที่ [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)
</Note>

## ภาพรวมการรองรับ

- บทบาท: แอป companion node (Android ไม่ได้โฮสต์ Gateway)
- ต้องใช้ Gateway: ใช่ (รันบน macOS, Linux หรือ Windows ผ่าน WSL2)
- ติดตั้ง: [เริ่มต้นใช้งาน](/th/start/getting-started) + [จับคู่](/th/channels/pairing)
- Gateway: [Runbook](/th/gateway) + [การกำหนดค่า](/th/gateway/configuration)
  - โปรโตคอล: [โปรโตคอล Gateway](/th/gateway/protocol) (nodes + control plane)

## การควบคุมระบบ

การควบคุมระบบ (launchd/systemd) อยู่บนโฮสต์ Gateway ดู [Gateway](/th/gateway)

## Runbook การเชื่อมต่อ

แอป Android node ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android เชื่อมต่อโดยตรงกับ Gateway WebSocket และใช้การจับคู่อุปกรณ์ (`role: node`)

สำหรับ Tailscale หรือโฮสต์สาธารณะ Android ต้องใช้ endpoint ที่ปลอดภัย:

- แนะนำ: Tailscale Serve / Funnel พร้อม `https://<magicdns>` / `wss://<magicdns>`
- รองรับด้วย: URL Gateway แบบ `wss://` อื่นใดที่มี endpoint TLS จริง
- `ws://` แบบ cleartext ยังคงรองรับบนที่อยู่ LAN ส่วนตัว / โฮสต์ `.local` รวมถึง `localhost`, `127.0.0.1` และ bridge ของ Android emulator (`10.0.2.2`)

### ข้อกำหนดเบื้องต้น

- คุณสามารถรัน Gateway บนเครื่อง "master" ได้
- อุปกรณ์/อีมูเลเตอร์ Android สามารถเข้าถึง gateway WebSocket ได้:
  - LAN เดียวกันพร้อม mDNS/NSD, **หรือ**
  - Tailnet Tailscale เดียวกันโดยใช้ Wide-Area Bonjour / unicast DNS-SD (ดูด้านล่าง), **หรือ**
  - โฮสต์/พอร์ต gateway แบบกำหนดเอง (fallback)
- การจับคู่ผ่าน tailnet/มือถือสาธารณะ **ไม่** ใช้ endpoint raw tailnet IP `ws://` ให้ใช้ Tailscale Serve หรือ URL `wss://` อื่นแทน
- คุณสามารถรัน CLI (`openclaw`) บนเครื่อง gateway (หรือผ่าน SSH) ได้

### 1) เริ่ม Gateway

```bash
openclaw gateway --port 18789 --verbose
```

ยืนยันใน log ว่าคุณเห็นข้อความคล้าย:

- `listening on ws://0.0.0.0:18789`

สำหรับการเข้าถึง Android ระยะไกลผ่าน Tailscale แนะนำให้ใช้ Serve/Funnel แทนการ bind กับ tailnet โดยตรง:

```bash
openclaw gateway --tailscale serve
```

สิ่งนี้ให้ endpoint `wss://` / `https://` ที่ปลอดภัยกับ Android การตั้งค่า `gateway.bind: "tailnet"` แบบธรรมดายังไม่พอสำหรับการจับคู่ Android ระยะไกลครั้งแรก เว้นแต่คุณจะ terminate TLS แยกต่างหากด้วย

### 2) ตรวจสอบ discovery (ไม่บังคับ)

จากเครื่อง gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

หมายเหตุการ debug เพิ่มเติม: [Bonjour](/th/gateway/bonjour)

หากคุณกำหนดค่าโดเมน wide-area discovery ไว้ด้วย ให้เปรียบเทียบกับ:

```bash
openclaw gateway discover --json
```

คำสั่งนี้แสดง `local.` พร้อมโดเมน wide-area ที่กำหนดค่าไว้ในครั้งเดียว และใช้
service endpoint ที่ resolve ได้แทน hint แบบ TXT-only

#### Discovery ผ่าน tailnet (Vienna ⇄ London) ด้วย unicast DNS-SD

Discovery ของ Android NSD/mDNS จะไม่ข้ามเครือข่าย หาก Android node และ gateway อยู่คนละเครือข่ายแต่เชื่อมต่อผ่าน Tailscale ให้ใช้ Wide-Area Bonjour / unicast DNS-SD แทน

Discovery เพียงอย่างเดียวไม่เพียงพอสำหรับการจับคู่ Android ผ่าน tailnet/สาธารณะ เส้นทางที่ค้นพบยังต้องมี endpoint ที่ปลอดภัย (`wss://` หรือ Tailscale Serve):

1. ตั้งค่าโซน DNS-SD (ตัวอย่าง `openclaw.internal.`) บนโฮสต์ gateway และเผยแพร่ระเบียน `_openclaw-gw._tcp`
2. กำหนดค่า Tailscale split DNS สำหรับโดเมนที่คุณเลือกให้ชี้ไปยังเซิร์ฟเวอร์ DNS นั้น

รายละเอียดและตัวอย่างการกำหนดค่า CoreDNS: [Bonjour](/th/gateway/bonjour)

### 3) เชื่อมต่อจาก Android

ในแอป Android:

- แอปจะรักษาการเชื่อมต่อ gateway ให้คงอยู่ผ่าน **foreground service** (การแจ้งเตือนแบบถาวร)
- เปิดแท็บ **Connect**
- ใช้โหมด **Setup Code** หรือ **Manual**
- หาก discovery ถูกบล็อก ให้ใช้ host/port แบบกำหนดเองใน **Advanced controls** สำหรับโฮสต์ LAN ส่วนตัว `ws://` ยังใช้งานได้ สำหรับโฮสต์ Tailscale/สาธารณะ ให้เปิด TLS และใช้ endpoint `wss://` / Tailscale Serve

หลังจากจับคู่สำเร็จครั้งแรก Android จะเชื่อมต่อใหม่อัตโนมัติเมื่อเปิดแอป:

- endpoint แบบกำหนดเอง (หากเปิดใช้), มิฉะนั้น
- gateway ล่าสุดที่ค้นพบ (แบบ best-effort)

### Beacon สถานะ presence alive

หลังจาก session node ที่ตรวจสอบสิทธิ์แล้วเชื่อมต่อ และเมื่อแอปย้ายไปอยู่เบื้องหลังในขณะที่
foreground service ยังคงเชื่อมต่ออยู่ Android จะเรียก `node.event` พร้อม
`event: "node.presence.alive"` Gateway จะบันทึกสิ่งนี้เป็น `lastSeenAtMs`/`lastSeenReason` บน
metadata ของ node/อุปกรณ์ที่จับคู่แล้ว เฉพาะหลังจากรู้ identity ของอุปกรณ์ node ที่ตรวจสอบสิทธิ์แล้วเท่านั้น

แอปจะนับว่า beacon ถูกบันทึกสำเร็จก็ต่อเมื่อ response จาก gateway มี
`handled: true` Gateway รุ่นเก่าอาจ acknowledge `node.event` ด้วย `{ "ok": true }`; response นั้น
เข้ากันได้แต่จะไม่นับเป็นการอัปเดต last-seen แบบ durable

### 4) อนุมัติการจับคู่ (CLI)

บนเครื่อง gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

รายละเอียดการจับคู่: [จับคู่](/th/channels/pairing)

ไม่บังคับ: หาก Android node เชื่อมต่อจาก subnet ที่ควบคุมอย่างเข้มงวดเสมอ
คุณสามารถเลือกเปิดการอนุมัติ node อัตโนมัติครั้งแรกด้วย CIDR ที่ระบุชัดเจนหรือ IP แบบ exact ได้:

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

สิ่งนี้ปิดไว้ตามค่าเริ่มต้น ใช้เฉพาะกับการจับคู่ `role: node` ใหม่
ที่ไม่มี scope ที่ร้องขอ การจับคู่ operator/browser และการเปลี่ยน role, scope, metadata หรือ
public-key ใดๆ ยังคงต้องอนุมัติด้วยตนเอง

### 5) ตรวจสอบว่า node เชื่อมต่อแล้ว

- ผ่านสถานะ nodes:

  ```bash
  openclaw nodes status
  ```

- ผ่าน Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + ประวัติ

แท็บ Chat ของ Android รองรับการเลือก session (ค่าเริ่มต้น `main` รวมถึง session อื่นที่มีอยู่):

- ประวัติ: `chat.history` (ทำให้การแสดงผลเป็นมาตรฐาน; tag directive แบบ inline จะถูก
  ลบออกจากข้อความที่มองเห็น payload XML ของ tool-call แบบ plain-text (รวมถึง
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และ
  บล็อก tool-call ที่ถูกตัดทอน) รวมถึง token ควบคุมโมเดล ASCII/full-width ที่รั่วออกมา
  จะถูกลบ แถว assistant ที่เป็น silent-token ล้วน เช่น `NO_REPLY` /
  `no_reply` แบบ exact จะถูกละไว้ และแถวที่ใหญ่เกินไปสามารถถูกแทนที่ด้วย placeholder)
- ส่ง: `chat.send`
- อัปเดตแบบ push (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + กล้อง

#### Gateway Canvas Host (แนะนำสำหรับเนื้อหาเว็บ)

หากคุณต้องการให้ node แสดง HTML/CSS/JS จริงที่ agent สามารถแก้ไขบนดิสก์ได้ ให้ชี้ node ไปที่ Gateway canvas host

<Note>
Nodes โหลด canvas จากเซิร์ฟเวอร์ HTTP ของ Gateway (พอร์ตเดียวกับ `gateway.port` ค่าเริ่มต้น `18789`)
</Note>

1. สร้าง `~/.openclaw/workspace/canvas/index.html` บนโฮสต์ gateway

2. นำทาง node ไปยังหน้านั้น (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (ไม่บังคับ): หากอุปกรณ์ทั้งสองอยู่บน Tailscale ให้ใช้ชื่อ MagicDNS หรือ tailnet IP แทน `.local` เช่น `http://<gateway-magicdns>:18789/__openclaw__/canvas/`

เซิร์ฟเวอร์นี้จะ inject client live-reload เข้าไปใน HTML และ reload เมื่อไฟล์เปลี่ยนแปลง
A2UI host อยู่ที่ `http://<gateway-host>:18789/__openclaw__/a2ui/`

คำสั่ง Canvas (เฉพาะ foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (ใช้ `{"url":""}` หรือ `{"url":"/"}` เพื่อกลับไปยัง scaffold ค่าเริ่มต้น) `canvas.snapshot` ส่งคืน `{ format, base64 }` (ค่าเริ่มต้น `format="jpeg"`)
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` เป็น alias เดิม)

คำสั่งกล้อง (เฉพาะ foreground; ต้องผ่าน permission):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

ดูพารามิเตอร์และตัวช่วย CLI ได้ที่ [Camera node](/th/nodes/camera)

### 8) Voice + พื้นผิวคำสั่ง Android ที่ขยายเพิ่ม

- แท็บ Voice: Android มีโหมด capture ที่ชัดเจนสองโหมด **Mic** คือ session แบบ manual ในแท็บ Voice ที่ส่งแต่ละช่วงหยุดพูดเป็น chat turn และหยุดเมื่อแอปออกจาก foreground หรือผู้ใช้ออกจากแท็บ Voice **Talk** คือ Talk Mode แบบต่อเนื่องและจะฟังต่อไปจนกว่าจะปิด toggle หรือ node ตัดการเชื่อมต่อ
- Talk Mode จะยกระดับ foreground service ที่มีอยู่จาก `dataSync` เป็น `dataSync|microphone` ก่อนเริ่ม capture แล้วลดระดับกลับเมื่อ Talk Mode หยุด Android 14+ ต้องมีการประกาศ `FOREGROUND_SERVICE_MICROPHONE`, grant runtime `RECORD_AUDIO` และชนิดบริการ microphone ใน runtime
- คำตอบที่พูดออกเสียงใช้ `talk.speak` ผ่าน gateway Talk provider ที่กำหนดค่าไว้ ระบบ TTS ในเครื่องจะถูกใช้เฉพาะเมื่อ `talk.speak` ไม่พร้อมใช้งาน
- Voice wake ยังคงปิดใช้งานใน UX/runtime ของ Android
- ตระกูลคำสั่ง Android เพิ่มเติม (ความพร้อมใช้งานขึ้นกับอุปกรณ์ + permissions):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (ดู [การส่งต่อการแจ้งเตือน](#notification-forwarding) ด้านล่าง)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## จุดเข้า Assistant

Android รองรับการเปิด OpenClaw จาก trigger ผู้ช่วยระบบ (Google
Assistant) เมื่อกำหนดค่าแล้ว การกดปุ่ม home ค้างไว้หรือพูดว่า "Hey Google, ask
OpenClaw..." จะเปิดแอปและส่ง prompt เข้าไปใน chat composer

สิ่งนี้ใช้ metadata **App Actions** ของ Android ที่ประกาศใน manifest ของแอป ไม่ต้อง
กำหนดค่าเพิ่มเติมฝั่ง gateway -- intent ของ assistant ถูก
จัดการทั้งหมดโดยแอป Android และส่งต่อเป็นข้อความ chat ปกติ

<Note>
ความพร้อมใช้งานของ App Actions ขึ้นกับอุปกรณ์ เวอร์ชัน Google Play Services
และผู้ใช้ได้ตั้ง OpenClaw เป็นแอป assistant ค่าเริ่มต้นหรือไม่
</Note>

## การส่งต่อการแจ้งเตือน

Android สามารถส่งต่อการแจ้งเตือนของอุปกรณ์ไปยัง gateway เป็น event ได้ มีหลาย control ที่ให้คุณกำหนดขอบเขตว่าการแจ้งเตือนใดจะถูกส่งต่อและเมื่อใด

| Key                              | Type           | Description                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | ส่งต่อเฉพาะการแจ้งเตือนจากชื่อ package เหล่านี้ หากตั้งค่า package อื่นทั้งหมดจะถูกละเว้น      |
| `notifications.denyPackages`     | string[]       | ไม่ส่งต่อการแจ้งเตือนจากชื่อ package เหล่านี้เลย ใช้หลังจาก `allowPackages`              |
| `notifications.quietHours.start` | string (HH:mm) | เวลาเริ่มต้นของช่วง quiet hours (เวลาท้องถิ่นของอุปกรณ์) การแจ้งเตือนจะถูกระงับในช่วงนี้ |
| `notifications.quietHours.end`   | string (HH:mm) | เวลาสิ้นสุดของช่วง quiet hours                                                                        |
| `notifications.rateLimit`        | number         | จำนวนการแจ้งเตือนสูงสุดที่ส่งต่อต่อ package ต่อนาที การแจ้งเตือนส่วนเกินจะถูกทิ้ง         |

ตัวเลือกการแจ้งเตือนยังใช้พฤติกรรมที่ปลอดภัยขึ้นสำหรับ event การแจ้งเตือนที่ถูกส่งต่อ เพื่อป้องกันการส่งต่อการแจ้งเตือนระบบที่ละเอียดอ่อนโดยไม่ตั้งใจ

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
การส่งต่อการแจ้งเตือนต้องใช้ permission Android Notification Listener แอปจะแจ้งให้อนุญาตสิ่งนี้ระหว่างการตั้งค่า
</Note>

## ที่เกี่ยวข้อง

- [แอป iOS](/th/platforms/ios)
- [Nodes](/th/nodes)
- [การแก้ปัญหา Android node](/th/nodes/troubleshooting)
