---
read_when:
    - การจับคู่หรือเชื่อมต่อ Android node ใหม่อีกครั้ง
    - การดีบักการค้นหา Gateway หรือ auth บน Android
    - การตรวจสอบความสอดคล้องของประวัติแชตระหว่างไคลเอนต์ต่าง ๆ
summary: 'แอป Android (Node): รันบุ๊กการเชื่อมต่อ + พื้นผิวคำสั่ง Connect/Chat/Voice/Canvas'
title: แอป Android
x-i18n:
    generated_at: "2026-04-25T13:51:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 789de91275a11e63878ba670b9f316538d6b4731c22ec491b2c802f1cd14dcec
    source_path: platforms/android.md
    workflow: 15
---

> **หมายเหตุ:** แอป Android ยังไม่ได้เปิดตัวสู่สาธารณะในขณะนี้ ซอร์สโค้ดมีให้ใน [OpenClaw repository](https://github.com/openclaw/openclaw) ภายใต้ `apps/android` คุณสามารถ build เองได้โดยใช้ Java 17 และ Android SDK (`./gradlew :app:assemblePlayDebug`) ดู [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) สำหรับคำแนะนำการ build

## ภาพรวมการรองรับ

- บทบาท: แอป node คู่หู (Android ไม่ได้โฮสต์ Gateway)
- ต้องใช้ Gateway: ใช่ (รันบน macOS, Linux หรือ Windows ผ่าน WSL2)
- การติดตั้ง: [เริ่มต้นใช้งาน](/th/start/getting-started) + [Pairing](/th/channels/pairing)
- Gateway: [Runbook](/th/gateway) + [Configuration](/th/gateway/configuration)
  - โปรโตคอล: [Gateway protocol](/th/gateway/protocol) (nodes + control plane)

## การควบคุมระบบ

การควบคุมระบบ (launchd/systemd) อยู่บนโฮสต์ของ Gateway ดู [Gateway](/th/gateway)

## รันบุ๊กการเชื่อมต่อ

แอป Android node ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android เชื่อมต่อโดยตรงกับ Gateway WebSocket และใช้ device pairing (`role: node`)

สำหรับ Tailscale หรือโฮสต์สาธารณะ Android ต้องใช้ endpoint ที่ปลอดภัย:

- แนะนำ: Tailscale Serve / Funnel พร้อม `https://<magicdns>` / `wss://<magicdns>`
- รองรับเช่นกัน: Gateway URL แบบ `wss://` อื่น ๆ ที่มี TLS endpoint จริง
- `ws://` แบบไม่เข้ารหัสยังคงรองรับบน private LAN addresses / โฮสต์ `.local` รวมถึง `localhost`, `127.0.0.1` และ Android emulator bridge (`10.0.2.2`)

### ข้อกำหนดเบื้องต้น

- คุณสามารถรัน Gateway บนเครื่อง “master” ได้
- อุปกรณ์ Android/emulator สามารถเข้าถึง gateway WebSocket ได้:
  - อยู่บน LAN เดียวกันพร้อม mDNS/NSD **หรือ**
  - อยู่บน Tailscale tailnet เดียวกันโดยใช้ Wide-Area Bonjour / unicast DNS-SD (ดูด้านล่าง) **หรือ**
  - กำหนด gateway host/port ด้วยตนเอง (fallback)
- การจับคู่มือถือผ่าน tailnet/สาธารณะ **ไม่ใช้** endpoint แบบ raw tailnet IP `ws://` ให้ใช้ Tailscale Serve หรือ `wss://` URL อื่นแทน
- คุณสามารถรัน CLI (`openclaw`) บนเครื่อง gateway ได้ (หรือผ่าน SSH)

### 1) เริ่มต้น Gateway

```bash
openclaw gateway --port 18789 --verbose
```

ยืนยันใน logs ว่าคุณเห็นข้อความประมาณนี้:

- `listening on ws://0.0.0.0:18789`

สำหรับการเข้าถึง Android ระยะไกลผ่าน Tailscale ให้ใช้ Serve/Funnel แทน raw tailnet bind:

```bash
openclaw gateway --tailscale serve
```

สิ่งนี้จะมอบ endpoint แบบปลอดภัย `wss://` / `https://` ให้ Android การตั้งค่า `gateway.bind: "tailnet"` แบบปกติเพียงอย่างเดียวไม่เพียงพอสำหรับการจับคู่ Android ระยะไกลครั้งแรก เว้นแต่คุณจะ terminate TLS แยกต่างหากด้วย

### 2) ตรวจสอบการค้นพบ (ไม่บังคับ)

จากเครื่อง gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

หมายเหตุการดีบักเพิ่มเติม: [Bonjour](/th/gateway/bonjour)

หากคุณกำหนดค่า wide-area discovery domain ไว้ด้วย ให้เปรียบเทียบกับ:

```bash
openclaw gateway discover --json
```

คำสั่งนี้จะแสดงทั้ง `local.` และ wide-area domain ที่กำหนดค่าไว้ในครั้งเดียว และใช้ service endpoint ที่ resolve แล้ว
แทน hints จาก TXT เพียงอย่างเดียว

#### การค้นพบผ่าน tailnet (Vienna ⇄ London) ด้วย unicast DNS-SD

การค้นพบแบบ Android NSD/mDNS จะไม่ข้ามเครือข่าย หาก Android node และ gateway ของคุณอยู่คนละเครือข่ายแต่เชื่อมต่อกันผ่าน Tailscale ให้ใช้ Wide-Area Bonjour / unicast DNS-SD แทน

การค้นพบเพียงอย่างเดียวยังไม่เพียงพอสำหรับการจับคู่ Android ผ่าน tailnet/สาธารณะ เส้นทางที่ค้นพบได้ยังคงต้องมี endpoint ที่ปลอดภัย (`wss://` หรือ Tailscale Serve):

1. ตั้งค่า DNS-SD zone (ตัวอย่าง `openclaw.internal.`) บนโฮสต์ gateway และเผยแพร่เรคคอร์ด `_openclaw-gw._tcp`
2. กำหนดค่า Tailscale split DNS สำหรับโดเมนที่คุณเลือกให้ชี้ไปยัง DNS server นั้น

รายละเอียดและตัวอย่างการกำหนดค่า CoreDNS: [Bonjour](/th/gateway/bonjour)

### 3) เชื่อมต่อจาก Android

ในแอป Android:

- แอปจะคงการเชื่อมต่อกับ gateway ผ่าน **foreground service** (การแจ้งเตือนถาวร)
- เปิดแท็บ **Connect**
- ใช้โหมด **Setup Code** หรือ **Manual**
- หากการค้นหาถูกบล็อก ให้ใช้ host/port แบบกำหนดเองใน **Advanced controls** สำหรับโฮสต์ private LAN ยังใช้ `ws://` ได้ สำหรับโฮสต์ Tailscale/สาธารณะ ให้เปิด TLS และใช้ endpoint แบบ `wss://` / Tailscale Serve

หลังจากจับคู่สำเร็จครั้งแรก Android จะเชื่อมต่อใหม่อัตโนมัติเมื่อเปิดแอป:

- manual endpoint (หากเปิดใช้) มิฉะนั้น
- gateway ที่ค้นพบล่าสุด (best-effort)

### 4) อนุมัติ pairing (CLI)

บนเครื่อง gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

รายละเอียดการจับคู่: [Pairing](/th/channels/pairing)

ทางเลือกเพิ่มเติม: หาก Android node เชื่อมต่อมาจาก subnet ที่ควบคุมอย่างเข้มงวดเสมอ
คุณสามารถเลือกเปิดการอนุมัติอัตโนมัติสำหรับ node ครั้งแรกด้วย CIDRs หรือ IP แบบระบุชัดเจน:

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

สิ่งนี้ปิดไว้เป็นค่าเริ่มต้น ใช้ได้เฉพาะ pairing ใหม่แบบ `role: node` ที่
ไม่มี requested scopes การจับคู่แบบ operator/browser และการเปลี่ยน role, scope, metadata หรือ public-key ใด ๆ ยังคงต้องได้รับการอนุมัติด้วยตนเอง

### 5) ตรวจสอบว่า node เชื่อมต่อแล้ว

- ผ่านสถานะ nodes:

  ```bash
  openclaw nodes status
  ```

- ผ่าน Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) แชต + ประวัติ

แท็บ Chat บน Android รองรับการเลือกเซสชัน (ค่าเริ่มต้น `main` รวมถึงเซสชันอื่นที่มีอยู่):

- ประวัติ: `chat.history` (ทำให้เหมาะกับการแสดงผลแล้ว; inline directive tags จะ
  ถูกลบออกจากข้อความที่มองเห็นได้, payload แบบ XML ของ tool-call ในรูปแบบ plain-text (รวมถึง
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และ
  บล็อก tool-call ที่ถูกตัดทอน) รวมถึง model control tokens แบบ ASCII/full-width ที่รั่วออกมา
  จะถูกลบออก, แถวของ assistant ที่เป็น pure silent-token เช่น `NO_REPLY` /
  `no_reply` แบบตรงตัวจะถูกละไว้ และแถวที่มีขนาดใหญ่เกินไปอาจถูกแทนที่ด้วย placeholders)
- ส่ง: `chat.send`
- การอัปเดตแบบ push (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + กล้อง

#### Gateway Canvas Host (แนะนำสำหรับเนื้อหาเว็บ)

หากคุณต้องการให้ node แสดง HTML/CSS/JS จริงที่ agent สามารถแก้ไขบนดิสก์ได้ ให้ชี้ node ไปยัง Gateway canvas host

หมายเหตุ: nodes จะโหลด canvas จาก Gateway HTTP server (พอร์ตเดียวกับ `gateway.port`, ค่าเริ่มต้น `18789`)

1. สร้าง `~/.openclaw/workspace/canvas/index.html` บนโฮสต์ gateway

2. นำทาง node ไปยังหน้านั้น (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (ไม่บังคับ): หากทั้งสองอุปกรณ์อยู่บน Tailscale ให้ใช้ชื่อ MagicDNS หรือ tailnet IP แทน `.local` เช่น `http://<gateway-magicdns>:18789/__openclaw__/canvas/`

เซิร์ฟเวอร์นี้จะแทรกไคลเอนต์ live-reload ลงใน HTML และรีโหลดเมื่อไฟล์มีการเปลี่ยนแปลง
A2UI host อยู่ที่ `http://<gateway-host>:18789/__openclaw__/a2ui/`

คำสั่ง Canvas (เฉพาะขณะอยู่ foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (ใช้ `{"url":""}` หรือ `{"url":"/"}` เพื่อกลับไปยัง scaffold เริ่มต้น) `canvas.snapshot` ส่งกลับ `{ format, base64 }` (ค่าเริ่มต้น `format="jpeg"`)
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` เป็น legacy alias)

คำสั่งกล้อง (เฉพาะขณะอยู่ foreground; มีการกั้นด้วย permission):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

ดู [Camera node](/th/nodes/camera) สำหรับพารามิเตอร์และตัวช่วย CLI

### 8) Voice + พื้นผิวคำสั่ง Android ที่ขยายเพิ่ม

- Voice: Android ใช้ flow เดียวแบบเปิด/ปิดไมค์ในแท็บ Voice พร้อมการจับข้อความถอดเสียงและการเล่น `talk.speak` จะใช้ system TTS ในเครื่องเฉพาะเมื่อ `talk.speak` ไม่พร้อมใช้งาน Voice จะหยุดเมื่อแอปออกจาก foreground
- ตัวสลับ voice wake/talk-mode ถูกนำออกจาก UX/runtime ของ Android ในปัจจุบัน
- ตระกูลคำสั่ง Android เพิ่มเติม (ความพร้อมใช้งานขึ้นอยู่กับอุปกรณ์ + permissions):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (ดู [Notification forwarding](#notification-forwarding) ด้านล่าง)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## จุดเริ่มต้นของผู้ช่วย

Android รองรับการเปิด OpenClaw จาก system assistant trigger (Google
Assistant) เมื่อกำหนดค่าไว้ การกดปุ่มโฮมค้างไว้หรือพูดว่า "Hey Google, ask
OpenClaw..." จะเปิดแอปและส่งพรอมป์เข้าไปยัง chat composer

สิ่งนี้ใช้ metadata ของ Android **App Actions** ที่ประกาศไว้ใน app manifest ไม่จำเป็นต้องมีการกำหนดค่าเพิ่มเติมที่ฝั่ง gateway — assistant intent จะถูกจัดการทั้งหมดโดยแอป Android และส่งต่อไปเป็นข้อความแชตปกติ

<Note>
ความพร้อมใช้งานของ App Actions ขึ้นอยู่กับอุปกรณ์ เวอร์ชันของ Google Play Services
และการที่ผู้ใช้ได้ตั้ง OpenClaw เป็นแอปผู้ช่วยเริ่มต้นหรือไม่
</Note>

## การส่งต่อการแจ้งเตือน

Android สามารถส่งต่อการแจ้งเตือนของอุปกรณ์ไปยัง gateway ในรูปแบบ events ได้ มีตัวควบคุมหลายอย่างที่ช่วยให้คุณกำหนดขอบเขตว่าการแจ้งเตือนใดจะถูกส่งต่อและเมื่อใด

| คีย์                              | ชนิด          | คำอธิบาย                                                                                     |
| -------------------------------- | ------------- | --------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]      | ส่งต่อเฉพาะการแจ้งเตือนจากชื่อแพ็กเกจเหล่านี้ หากตั้งค่าไว้ แพ็กเกจอื่นทั้งหมดจะถูกละเลย |
| `notifications.denyPackages`     | string[]      | ห้ามส่งต่อการแจ้งเตือนจากชื่อแพ็กเกจเหล่านี้ ใช้หลังจาก `allowPackages`                    |
| `notifications.quietHours.start` | string (HH:mm) | เวลาเริ่มต้นของช่วง quiet hours (เวลาท้องถิ่นของอุปกรณ์) การแจ้งเตือนจะถูกระงับในช่วงนี้ |
| `notifications.quietHours.end`   | string (HH:mm) | เวลาสิ้นสุดของช่วง quiet hours                                                              |
| `notifications.rateLimit`        | number        | จำนวนการแจ้งเตือนสูงสุดที่ส่งต่อได้ต่อแพ็กเกจต่อนาที การแจ้งเตือนที่เกินจะถูกทิ้ง         |

ตัวเลือกการแจ้งเตือนยังใช้พฤติกรรมที่ปลอดภัยยิ่งขึ้นสำหรับ forwarded notification events เพื่อป้องกันการส่งต่อการแจ้งเตือนระบบที่อ่อนไหวโดยไม่ตั้งใจ

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
- [Nodes](/th/nodes)
- [การแก้ไขปัญหา Android node](/th/nodes/troubleshooting)
