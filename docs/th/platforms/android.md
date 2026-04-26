---
read_when:
    - การจับคู่หรือเชื่อมต่อ Node ของ Android ใหม่
    - การดีบักการค้นหา gateway หรือการยืนยันตัวตนบน Android
    - การตรวจสอบความสอดคล้องของประวัติแชทระหว่างไคลเอนต์ต่าง ๆ
summary: 'แอป Android (Node): คู่มือการเชื่อมต่อ + พื้นผิวคำสั่ง Connect/Chat/Voice/Canvas'
title: แอป Android
x-i18n:
    generated_at: "2026-04-26T11:35:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a47c07e3301ad7b98f4827c9c34c42b7ba2f92c55aabd7b49606ab688191b66
    source_path: platforms/android.md
    workflow: 15
---

> **หมายเหตุ:** แอป Android ยังไม่ได้เปิดตัวสู่สาธารณะในขณะนี้ ซอร์สโค้ดมีให้ใช้งานใน [repository ของ OpenClaw](https://github.com/openclaw/openclaw) ภายใต้ `apps/android` คุณสามารถ build ได้ด้วยตนเองโดยใช้ Java 17 และ Android SDK (`./gradlew :app:assemblePlayDebug`) ดูคำแนะนำการ build ได้ที่ [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)

## ภาพรวมการรองรับ

- บทบาท: แอป Node คู่หู (Android ไม่ได้โฮสต์ Gateway)
- ต้องใช้ Gateway: ใช่ (รันบน macOS, Linux หรือ Windows ผ่าน WSL2)
- การติดตั้ง: [เริ่มต้นใช้งาน](/th/start/getting-started) + [การจับคู่](/th/channels/pairing)
- Gateway: [คู่มือการใช้งาน](/th/gateway) + [การกำหนดค่า](/th/gateway/configuration)
  - โปรโตคอล: [โปรโตคอล Gateway](/th/gateway/protocol) (Node + control plane)

## การควบคุมระบบ

การควบคุมระบบ (launchd/systemd) อยู่บนโฮสต์ Gateway ดูที่ [Gateway](/th/gateway)

## คู่มือการเชื่อมต่อ

แอป Android node ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android เชื่อมต่อโดยตรงกับ Gateway WebSocket และใช้การจับคู่อุปกรณ์ (`role: node`)

สำหรับ Tailscale หรือโฮสต์สาธารณะ Android ต้องใช้ endpoint ที่ปลอดภัย:

- แนะนำ: Tailscale Serve / Funnel พร้อม `https://<magicdns>` / `wss://<magicdns>`
- รองรับเช่นกัน: URL `wss://` ของ Gateway อื่น ๆ ที่มี TLS endpoint จริง
- `ws://` แบบ cleartext ยังคงรองรับสำหรับที่อยู่ private LAN / โฮสต์ `.local` รวมถึง `localhost`, `127.0.0.1` และ Android emulator bridge (`10.0.2.2`)

### สิ่งที่ต้องมีก่อน

- คุณสามารถรัน Gateway บนเครื่อง “master” ได้
- อุปกรณ์ Android/emulator เข้าถึง gateway WebSocket ได้:
  - อยู่ใน LAN เดียวกันพร้อม mDNS/NSD **หรือ**
  - อยู่ใน Tailscale tailnet เดียวกันโดยใช้ Wide-Area Bonjour / unicast DNS-SD (ดูด้านล่าง) **หรือ**
  - กำหนดโฮสต์/พอร์ตของ gateway ด้วยตนเอง (ทางเลือกสำรอง)
- การจับคู่อุปกรณ์มือถือผ่าน tailnet/สาธารณะ **ไม่** ใช้ endpoint แบบ `ws://` ของ raw tailnet IP ให้ใช้ Tailscale Serve หรือ URL `wss://` อื่นแทน
- คุณสามารถรัน CLI (`openclaw`) บนเครื่อง gateway ได้ (หรือผ่าน SSH)

### 1) เริ่มต้น Gateway

```bash
openclaw gateway --port 18789 --verbose
```

ยืนยันใน log ว่าคุณเห็นข้อความประมาณนี้:

- `listening on ws://0.0.0.0:18789`

สำหรับการเข้าถึง Android ระยะไกลผ่าน Tailscale ให้ใช้ Serve/Funnel แทนการ bind กับ tailnet แบบดิบ:

```bash
openclaw gateway --tailscale serve
```

วิธีนี้จะให้ Android ใช้ endpoint แบบ `wss://` / `https://` ที่ปลอดภัย การตั้งค่า `gateway.bind: "tailnet"` อย่างเดียวไม่เพียงพอสำหรับการจับคู่ Android ระยะไกลครั้งแรก เว้นแต่คุณจะมีการทำ TLS termination แยกต่างหากด้วย

### 2) ตรวจสอบการค้นหา (ไม่บังคับ)

จากเครื่อง gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

หมายเหตุการดีบักเพิ่มเติม: [Bonjour](/th/gateway/bonjour)

หากคุณกำหนดค่าโดเมนการค้นหาแบบ wide-area ไว้ด้วย ให้เปรียบเทียบกับ:

```bash
openclaw gateway discover --json
```

คำสั่งนี้จะแสดง `local.` พร้อมโดเมน wide-area ที่กำหนดไว้ในครั้งเดียว และใช้
service endpoint ที่ resolve แล้วแทนการอาศัย hint จาก TXT เท่านั้น

#### การค้นหาผ่าน tailnet (Vienna ⇄ London) ด้วย unicast DNS-SD

การค้นหาแบบ Android NSD/mDNS จะไม่ข้ามเครือข่าย หาก Android node และ gateway ของคุณอยู่คนละเครือข่ายแต่เชื่อมต่อผ่าน Tailscale ให้ใช้ Wide-Area Bonjour / unicast DNS-SD แทน

การค้นหาเพียงอย่างเดียวไม่เพียงพอสำหรับการจับคู่ Android ผ่าน tailnet/สาธารณะ เส้นทางที่ค้นพบยังคงต้องใช้ endpoint ที่ปลอดภัย (`wss://` หรือ Tailscale Serve):

1. ตั้งค่า DNS-SD zone (ตัวอย่าง `openclaw.internal.`) บนโฮสต์ gateway และเผยแพร่ record `_openclaw-gw._tcp`
2. กำหนดค่า Tailscale split DNS สำหรับโดเมนที่คุณเลือกให้ชี้ไปยัง DNS server นั้น

รายละเอียดและตัวอย่างการตั้งค่า CoreDNS: [Bonjour](/th/gateway/bonjour)

### 3) เชื่อมต่อจาก Android

ในแอป Android:

- แอปจะคงการเชื่อมต่อกับ gateway ผ่าน **foreground service** (การแจ้งเตือนแบบคงอยู่)
- เปิดแท็บ **Connect**
- ใช้โหมด **Setup Code** หรือ **Manual**
- หากการค้นหาถูกบล็อก ให้ใช้โฮสต์/พอร์ตแบบกำหนดเองใน **Advanced controls** สำหรับโฮสต์ private LAN ยังสามารถใช้ `ws://` ได้ สำหรับโฮสต์ Tailscale/สาธารณะ ให้เปิด TLS และใช้ endpoint แบบ `wss://` / Tailscale Serve

หลังจากจับคู่สำเร็จครั้งแรก Android จะเชื่อมต่อใหม่อัตโนมัติเมื่อเปิดแอป:

- endpoint แบบกำหนดเอง (หากเปิดใช้) มิฉะนั้น
- gateway ที่ค้นพบล่าสุด (best-effort)

### 4) อนุมัติการจับคู่ (CLI)

บนเครื่อง gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

รายละเอียดการจับคู่: [การจับคู่](/th/channels/pairing)

ตัวเลือกเพิ่มเติม: หาก Android node เชื่อมต่อจาก subnet ที่ควบคุมอย่างเข้มงวดเสมอ
คุณสามารถเลือกเปิดการอนุมัติอัตโนมัติสำหรับการจับคู่ Node ครั้งแรกด้วย CIDR หรือ IP แบบเจาะจงได้:

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

ฟีเจอร์นี้ปิดไว้โดยค่าเริ่มต้น และใช้เฉพาะกับการจับคู่ `role: node` ใหม่ที่
ไม่มี requested scopes เท่านั้น การจับคู่ operator/browser และการเปลี่ยนแปลงใด ๆ ใน role, scope, metadata หรือ public key
ยังคงต้องอนุมัติด้วยตนเอง

### 5) ตรวจสอบว่า Node เชื่อมต่ออยู่

- ผ่านสถานะของ Node:

  ```bash
  openclaw nodes status
  ```

- ผ่าน Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) แชท + ประวัติ

แท็บแชทบน Android รองรับการเลือกเซสชัน (ค่าเริ่มต้นคือ `main` รวมถึงเซสชันอื่นที่มีอยู่):

- ประวัติ: `chat.history` (ทำ normalization สำหรับการแสดงผล; inline directive tags
  จะถูกลบออกจากข้อความที่มองเห็นได้, payload XML ของ tool-call แบบ plain-text (รวมถึง
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และ
  บล็อก tool-call ที่ถูกตัดทอน) รวมถึง model control tokens แบบ ASCII/full-width ที่รั่วออกมา
  จะถูกลบออก, แถว assistant ที่มีเฉพาะ silent-token เช่น `NO_REPLY` / `no_reply`
  แบบตรงตัวจะถูกละไว้, และแถวที่มีขนาดใหญ่เกินไปอาจถูกแทนด้วย placeholder)
- ส่ง: `chat.send`
- อัปเดตแบบ push (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + กล้อง

#### Gateway Canvas Host (แนะนำสำหรับเนื้อหาเว็บ)

หากคุณต้องการให้ Node แสดง HTML/CSS/JS จริงที่ agent สามารถแก้ไขบนดิสก์ได้ ให้ชี้ Node ไปที่ Gateway canvas host

หมายเหตุ: Node จะโหลด canvas จากเซิร์ฟเวอร์ HTTP ของ Gateway (พอร์ตเดียวกับ `gateway.port`, ค่าเริ่มต้น `18789`)

1. สร้าง `~/.openclaw/workspace/canvas/index.html` บนโฮสต์ gateway

2. นำทาง Node ไปยังตำแหน่งนั้น (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (ไม่บังคับ): หากทั้งสองอุปกรณ์อยู่บน Tailscale ให้ใช้ชื่อ MagicDNS หรือ tailnet IP แทน `.local` เช่น `http://<gateway-magicdns>:18789/__openclaw__/canvas/`

เซิร์ฟเวอร์นี้จะ inject live-reload client ลงใน HTML และรีโหลดเมื่อไฟล์มีการเปลี่ยนแปลง
A2UI host อยู่ที่ `http://<gateway-host>:18789/__openclaw__/a2ui/`

คำสั่ง Canvas (เฉพาะขณะอยู่เบื้องหน้าเท่านั้น):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (ใช้ `{"url":""}` หรือ `{"url":"/"}` เพื่อกลับไปยัง scaffold เริ่มต้น) `canvas.snapshot` จะคืนค่า `{ format, base64 }` (ค่าเริ่มต้น `format="jpeg"`)
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` เป็น alias แบบเดิม)

คำสั่งกล้อง (เฉพาะขณะอยู่เบื้องหน้า; ต้องได้รับสิทธิ์):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

ดู [Camera node](/th/nodes/camera) สำหรับพารามิเตอร์และตัวช่วย CLI

### 8) Voice + พื้นผิวคำสั่ง Android แบบขยาย

- แท็บ Voice: Android มีสองโหมดจับเสียงที่ชัดเจน **Mic** คือเซสชันแบบแมนนวลในแท็บ Voice ที่ส่งทุกช่วงหยุดเป็นหนึ่งรอบแชท และจะหยุดเมื่อแอปออกจากเบื้องหน้าหรือเมื่อผู้ใช้ออกจากแท็บ Voice ส่วน **Talk** คือ Talk Mode แบบต่อเนื่องและจะฟังต่อไปจนกว่าจะปิดด้วยปุ่มสลับหรือ Node ตัดการเชื่อมต่อ
- Talk Mode จะยกระดับ foreground service ที่มีอยู่จาก `dataSync` เป็น `dataSync|microphone` ก่อนเริ่มจับเสียง จากนั้นจะลดระดับกลับเมื่อ Talk Mode หยุด Android 14+ ต้องมีการประกาศ `FOREGROUND_SERVICE_MICROPHONE`, ได้รับสิทธิ์รันไทม์ `RECORD_AUDIO` และใช้ประเภทบริการไมโครโฟนในรันไทม์
- คำตอบเสียงพูดใช้ `talk.speak` ผ่านผู้ให้บริการ Talk ของ gateway ที่กำหนดค่าไว้ จะใช้ system TTS แบบโลคัลเฉพาะเมื่อ `talk.speak` ไม่พร้อมใช้งานเท่านั้น
- Voice wake ยังคงถูกปิดใช้งานใน UX/runtime ของ Android
- กลุ่มคำสั่ง Android เพิ่มเติม (ความพร้อมใช้งานขึ้นอยู่กับอุปกรณ์ + สิทธิ์):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (ดู [การส่งต่อการแจ้งเตือน](#notification-forwarding) ด้านล่าง)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## จุดเริ่มต้นของผู้ช่วย

Android รองรับการเปิด OpenClaw จากทริกเกอร์ system assistant (Google
Assistant) เมื่อกำหนดค่าแล้ว การกดปุ่มโฮมค้างไว้หรือพูดว่า "Hey Google, ask
OpenClaw..." จะเปิดแอปและส่งพรอมป์เข้าสู่ช่องเขียนแชท

ฟีเจอร์นี้ใช้ metadata ของ Android **App Actions** ที่ประกาศไว้ใน manifest ของแอป ไม่
ต้องมีการกำหนดค่าเพิ่มเติมฝั่ง gateway — assistant intent จะถูกจัดการทั้งหมดโดยแอป Android และส่งต่อเป็นข้อความแชทปกติ

<Note>
ความพร้อมใช้งานของ App Actions ขึ้นอยู่กับอุปกรณ์ เวอร์ชันของ Google Play Services
และว่าผู้ใช้ได้ตั้งค่า OpenClaw เป็นแอปผู้ช่วยเริ่มต้นหรือไม่
</Note>

## การส่งต่อการแจ้งเตือน

Android สามารถส่งต่อการแจ้งเตือนของอุปกรณ์ไปยัง gateway เป็น event ได้ มีตัวควบคุมหลายอย่างที่ช่วยให้คุณกำหนดขอบเขตได้ว่าจะแจ้งเตือนใดถูกส่งต่อและเมื่อใด

| Key                              | Type           | Description                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | ส่งต่อเฉพาะการแจ้งเตือนจากชื่อ package เหล่านี้เท่านั้น หากตั้งค่าไว้ package อื่นทั้งหมดจะถูกละเว้น |
| `notifications.denyPackages`     | string[]       | ห้ามส่งต่อการแจ้งเตือนจากชื่อ package เหล่านี้โดยเด็ดขาด ใช้หลัง `allowPackages`              |
| `notifications.quietHours.start` | string (HH:mm) | เวลาเริ่มต้นของช่วงชั่วโมงเงียบ (เวลาท้องถิ่นของอุปกรณ์) การแจ้งเตือนจะถูกระงับระหว่างช่วงนี้ |
| `notifications.quietHours.end`   | string (HH:mm) | เวลาสิ้นสุดของช่วงชั่วโมงเงียบ                                                                        |
| `notifications.rateLimit`        | number         | จำนวนการแจ้งเตือนสูงสุดที่ส่งต่อได้ต่อ package ต่อนาที การแจ้งเตือนที่เกินจะถูกทิ้ง         |

ตัวเลือกการแจ้งเตือนยังใช้พฤติกรรมที่ปลอดภัยยิ่งขึ้นสำหรับ event การแจ้งเตือนที่ส่งต่อ ช่วยป้องกันการส่งต่อการแจ้งเตือนระบบที่มีความละเอียดอ่อนโดยไม่ตั้งใจ

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
การส่งต่อการแจ้งเตือนต้องใช้สิทธิ์ Android Notification Listener แอปจะขอสิทธิ์นี้ระหว่างการตั้งค่า
</Note>

## ที่เกี่ยวข้อง

- [แอป iOS](/th/platforms/ios)
- [Node](/th/nodes)
- [การแก้ปัญหา Android node](/th/nodes/troubleshooting)
