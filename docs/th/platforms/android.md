---
read_when:
    - การจับคู่หรือเชื่อมต่อ Node Android อีกครั้ง
    - การดีบักการค้นพบ Gateway หรือการตรวจสอบสิทธิ์บน Android
    - ตรวจสอบความเท่าเทียมของประวัติแชตระหว่างไคลเอนต์
summary: 'แอป Android (node): คู่มือปฏิบัติการการเชื่อมต่อ + พื้นที่คำสั่ง Connect/Chat/Voice/Canvas'
title: แอป Android
x-i18n:
    generated_at: "2026-06-27T17:48:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
แอป Android อย่างเป็นทางการพร้อมใช้งานบน [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) แอปนี้เป็นโหนดคู่ขนานและต้องใช้ OpenClaw Gateway ที่กำลังทำงานอยู่ ซอร์สโค้ดยังมีอยู่ใน [รีโพสิทอรี OpenClaw](https://github.com/openclaw/openclaw) ใต้ `apps/android`; ดูคำแนะนำการบิลด์ได้ที่ [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)
</Note>

## ภาพรวมการรองรับ

- บทบาท: แอปโหนดคู่ขนาน (Android ไม่ได้โฮสต์ Gateway)
- ต้องใช้ Gateway: ใช่ (รันบน macOS, Linux หรือ Windows ผ่าน WSL2)
- ติดตั้ง: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) สำหรับแอป, [เริ่มต้นใช้งาน](/th/start/getting-started) สำหรับ Gateway จากนั้น [การจับคู่](/th/channels/pairing)
- Gateway: [คู่มือปฏิบัติการ](/th/gateway) + [การกำหนดค่า](/th/gateway/configuration)
  - โปรโตคอล: [โปรโตคอล Gateway](/th/gateway/protocol) (โหนด + control plane)

## การควบคุมระบบ

การควบคุมระบบ (launchd/systemd) อยู่บนโฮสต์ Gateway ดู [Gateway](/th/gateway)

## คู่มือปฏิบัติการการเชื่อมต่อ

แอปโหนด Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android เชื่อมต่อโดยตรงกับ Gateway WebSocket และใช้การจับคู่อุปกรณ์ (`role: node`)

สำหรับ Tailscale หรือโฮสต์สาธารณะ Android ต้องใช้เอนด์พอยต์ที่ปลอดภัย:

- แนะนำ: Tailscale Serve / Funnel พร้อม `https://<magicdns>` / `wss://<magicdns>`
- รองรับด้วย: URL ของ Gateway แบบ `wss://` อื่นใดที่มีเอนด์พอยต์ TLS จริง
- `ws://` แบบข้อความล้วนยังคงรองรับบนที่อยู่ LAN ส่วนตัว / โฮสต์ `.local` รวมถึง `localhost`, `127.0.0.1` และบริดจ์ของ Android emulator (`10.0.2.2`)

### ข้อกำหนดเบื้องต้น

- คุณสามารถรัน Gateway บนเครื่อง "master" ได้
- อุปกรณ์/อีมูเลเตอร์ Android สามารถเข้าถึง gateway WebSocket ได้:
  - LAN เดียวกันพร้อม mDNS/NSD, **หรือ**
  - tailnet ของ Tailscale เดียวกันโดยใช้ Wide-Area Bonjour / unicast DNS-SD (ดูด้านล่าง), **หรือ**
  - โฮสต์/พอร์ต gateway แบบระบุเอง (ทางเลือกสำรอง)
- การจับคู่ผ่าน tailnet/มือถือสาธารณะ **ไม่** ใช้เอนด์พอยต์ IP tailnet ดิบแบบ `ws://` ให้ใช้ Tailscale Serve หรือ URL แบบ `wss://` อื่นแทน
- คุณสามารถรัน CLI (`openclaw`) บนเครื่อง gateway (หรือผ่าน SSH) ได้

### 1) เริ่ม Gateway

```bash
openclaw gateway --port 18789 --verbose
```

ยืนยันว่าในล็อกเห็นข้อความประมาณนี้:

- `listening on ws://0.0.0.0:18789`

สำหรับการเข้าถึง Android ระยะไกลผ่าน Tailscale ให้ใช้ Serve/Funnel แทนการ bind tailnet แบบดิบ:

```bash
openclaw gateway --tailscale serve
```

สิ่งนี้จะให้เอนด์พอยต์ `wss://` / `https://` ที่ปลอดภัยแก่ Android การตั้งค่า `gateway.bind: "tailnet"` แบบธรรมดายังไม่เพียงพอสำหรับการจับคู่ Android ระยะไกลครั้งแรก เว้นแต่คุณจะ terminate TLS แยกต่างหากด้วย

### 2) ตรวจสอบการค้นพบ (ไม่บังคับ)

จากเครื่อง gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

หมายเหตุการดีบักเพิ่มเติม: [Bonjour](/th/gateway/bonjour)

หากคุณกำหนดค่าโดเมนการค้นพบแบบ wide-area ไว้ด้วย ให้เปรียบเทียบกับ:

```bash
openclaw gateway discover --json
```

คำสั่งนี้แสดง `local.` พร้อมโดเมน wide-area ที่กำหนดค่าไว้ในการรันครั้งเดียว และใช้เอนด์พอยต์บริการที่ resolve ได้แทนคำใบ้แบบ TXT เท่านั้น

#### การค้นพบ Tailnet (Vienna ⇄ London) ผ่าน unicast DNS-SD

การค้นพบ Android NSD/mDNS จะไม่ข้ามเครือข่าย หากโหนด Android และ gateway อยู่คนละเครือข่ายแต่เชื่อมต่อผ่าน Tailscale ให้ใช้ Wide-Area Bonjour / unicast DNS-SD แทน

การค้นพบเพียงอย่างเดียวไม่เพียงพอสำหรับการจับคู่ Android ผ่าน tailnet/สาธารณะ เส้นทางที่ค้นพบยังต้องมีเอนด์พอยต์ที่ปลอดภัย (`wss://` หรือ Tailscale Serve):

1. ตั้งค่าโซน DNS-SD (ตัวอย่าง `openclaw.internal.`) บนโฮสต์ gateway และเผยแพร่เรคคอร์ด `_openclaw-gw._tcp`
2. กำหนดค่า Tailscale split DNS สำหรับโดเมนที่คุณเลือกให้ชี้ไปยังเซิร์ฟเวอร์ DNS นั้น

รายละเอียดและตัวอย่างการกำหนดค่า CoreDNS: [Bonjour](/th/gateway/bonjour)

### 3) เชื่อมต่อจาก Android

ในแอป Android:

- แอปรักษาการเชื่อมต่อ gateway ให้มีชีวิตอยู่ผ่าน **foreground service** (การแจ้งเตือนแบบคงอยู่)
- เปิดแท็บ **Connect**
- ใช้โหมด **Setup Code** หรือ **Manual**
- หากการค้นพบถูกบล็อก ให้ใช้โฮสต์/พอร์ตแบบระบุเองใน **Advanced controls** สำหรับโฮสต์ LAN ส่วนตัว `ws://` ยังใช้งานได้ สำหรับโฮสต์ Tailscale/สาธารณะ ให้เปิด TLS และใช้เอนด์พอยต์ `wss://` / Tailscale Serve

หลังจากจับคู่สำเร็จครั้งแรก Android จะเชื่อมต่อใหม่อัตโนมัติเมื่อเปิดแอป:

- เอนด์พอยต์แบบระบุเอง (หากเปิดใช้) มิฉะนั้น
- gateway ล่าสุดที่ค้นพบ (พยายามอย่างดีที่สุด)

### บีคอนสถานะว่ายังออนไลน์

หลังจากเซสชันโหนดที่ยืนยันตัวตนแล้วเชื่อมต่อ และเมื่อแอปย้ายไปทำงานเบื้องหลังในขณะที่
foreground service ยังคงเชื่อมต่ออยู่ Android จะเรียก `node.event` ด้วย
`event: "node.presence.alive"` gateway จะบันทึกสิ่งนี้เป็น `lastSeenAtMs`/`lastSeenReason` บน
เมทาดาทาของโหนด/อุปกรณ์ที่จับคู่แล้ว เฉพาะหลังจากทราบตัวตนอุปกรณ์โหนดที่ยืนยันตัวตนแล้วเท่านั้น

แอปจะนับว่าบีคอนถูกบันทึกสำเร็จก็ต่อเมื่อการตอบกลับจาก gateway มี
`handled: true` Gateway รุ่นเก่าอาจยืนยัน `node.event` ด้วย `{ "ok": true }`; การตอบกลับนั้น
เข้ากันได้ แต่ไม่นับเป็นการอัปเดต last-seen แบบคงทน

### 4) อนุมัติการจับคู่ (CLI)

บนเครื่อง gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

รายละเอียดการจับคู่: [การจับคู่](/th/channels/pairing)

ไม่บังคับ: หากโหนด Android เชื่อมต่อจากซับเน็ตที่ควบคุมอย่างเข้มงวดเสมอ
คุณสามารถเลือกใช้การอนุมัติโหนดครั้งแรกโดยอัตโนมัติด้วย CIDR หรือ IP ที่ระบุชัดเจน:

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

ค่านี้ปิดใช้งานโดยค่าเริ่มต้น ใช้เฉพาะกับการจับคู่ `role: node` ใหม่
ที่ไม่มี scopes ที่ร้องขอ การจับคู่ operator/browser และการเปลี่ยนแปลง role, scope, metadata หรือ
public-key ใดๆ ยังคงต้องได้รับการอนุมัติด้วยตนเอง

### 5) ตรวจสอบว่าโหนดเชื่อมต่ออยู่

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

- ประวัติ: `chat.history` (ปรับการแสดงผลให้เป็นมาตรฐาน; แท็ก directive แบบ inline จะถูก
  ตัดออกจากข้อความที่มองเห็น, payload XML ของ tool-call แบบข้อความล้วน (รวมถึง
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และ
  บล็อก tool-call ที่ถูกตัดทอน) และโทเค็นควบคุมโมเดลแบบ ASCII/full-width ที่หลุดออกมา
  จะถูกตัดออก, แถวผู้ช่วยที่เป็น silent-token ล้วน เช่น `NO_REPLY` /
  `no_reply` แบบตรงตัวจะถูกละไว้ และแถวที่ใหญ่เกินไปสามารถถูกแทนที่ด้วย placeholder ได้)
- ส่ง: `chat.send`
- อัปเดตแบบ push (พยายามอย่างดีที่สุด): `chat.subscribe` → `event:"chat"`

### 7) Canvas + กล้อง

#### โฮสต์ Gateway Canvas (แนะนำสำหรับเนื้อหาเว็บ)

หากคุณต้องการให้โหนดแสดง HTML/CSS/JS จริงที่ agent สามารถแก้ไขบนดิสก์ได้ ให้ชี้โหนดไปที่โฮสต์ canvas ของ Gateway

<Note>
โหนดโหลด canvas จากเซิร์ฟเวอร์ HTTP ของ Gateway (พอร์ตเดียวกับ `gateway.port` ค่าเริ่มต้น `18789`)
</Note>

1. สร้าง `~/.openclaw/workspace/canvas/index.html` บนโฮสต์ gateway

2. นำทางโหนดไปยังหน้านั้น (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (ไม่บังคับ): หากอุปกรณ์ทั้งสองอยู่บน Tailscale ให้ใช้ชื่อ MagicDNS หรือ IP tailnet แทน `.local` เช่น `http://<gateway-magicdns>:18789/__openclaw__/canvas/`

เซิร์ฟเวอร์นี้ฉีดไคลเอนต์ live-reload เข้าไปใน HTML และโหลดใหม่เมื่อไฟล์เปลี่ยนแปลง
Gateway ยังให้บริการ `/__openclaw__/a2ui/` ด้วย แต่แอป Android ถือว่าหน้า A2UI ระยะไกลเป็นแบบ render-only คำสั่ง A2UI ที่รองรับ action จะใช้หน้า A2UI ที่รวมมากับแอปและเป็นของแอปก่อนนำข้อความไปใช้

คำสั่ง Canvas (เฉพาะ foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (ใช้ `{"url":""}` หรือ `{"url":"/"}` เพื่อกลับไปยัง scaffold ค่าเริ่มต้น) `canvas.snapshot` ส่งคืน `{ format, base64 }` (ค่าเริ่มต้น `format="jpeg"`)
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` เป็น alias legacy) คำสั่งเหล่านี้ใช้หน้า A2UI ที่รวมมากับแอปและเป็นของแอปสำหรับการ render ที่รองรับ action

คำสั่งกล้อง (เฉพาะ foreground; ควบคุมด้วยสิทธิ์):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

ดูพารามิเตอร์และตัวช่วย CLI ได้ที่ [โหนดกล้อง](/th/nodes/camera)

### 8) เสียง + พื้นผิวคำสั่ง Android ที่ขยายเพิ่ม

- แท็บ Voice: Android มีโหมดจับเสียงสองโหมดที่ชัดเจน **Mic** คือเซสชันแท็บ Voice แบบแมนนวลที่ส่งแต่ละช่วงหยุดเป็นรอบแชตและหยุดเมื่อแอปออกจาก foreground หรือผู้ใช้ออกจากแท็บ Voice **Talk** คือ Talk Mode แบบต่อเนื่องและจะฟังต่อไปจนกว่าจะถูกปิดหรือโหนดตัดการเชื่อมต่อ
- Talk Mode เลื่อนระดับ foreground service ที่มีอยู่จาก `connectedDevice` เป็น `connectedDevice|microphone` ก่อนเริ่มจับเสียง จากนั้นลดระดับเมื่อ Talk Mode หยุด บริการโหนดประกาศ `FOREGROUND_SERVICE_CONNECTED_DEVICE` พร้อม `CHANGE_NETWORK_STATE`; Android 14+ ยังต้องมีการประกาศ `FOREGROUND_SERVICE_MICROPHONE`, การให้สิทธิ์ runtime `RECORD_AUDIO` และประเภทบริการ microphone ขณะ runtime ด้วย
- โดยค่าเริ่มต้น Android Talk ใช้การรู้จำเสียงพูดแบบเนทีฟ, แชต Gateway และ `talk.speak` ผ่านผู้ให้บริการ Talk ของ gateway ที่กำหนดค่าไว้ ระบบ TTS ภายในเครื่องจะถูกใช้เฉพาะเมื่อ `talk.speak` ไม่พร้อมใช้งาน
- Android Talk ใช้ realtime Gateway relay เฉพาะเมื่อ `talk.realtime.mode` เป็น `realtime` และ `talk.realtime.transport` เป็น `gateway-relay`
- การปลุกด้วยเสียงยังคงปิดใช้งานใน UX/runtime ของ Android
- ชุดคำสั่ง Android เพิ่มเติม (ความพร้อมใช้งานขึ้นอยู่กับอุปกรณ์ สิทธิ์ และการตั้งค่าผู้ใช้):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` เฉพาะเมื่อเปิดใช้ **Settings > Phone Capabilities > Installed Apps**; โดยค่าเริ่มต้นจะแสดงรายการแอปที่มองเห็นได้จาก launcher
  - `notifications.list`, `notifications.actions` (ดู [การส่งต่อการแจ้งเตือน](#notification-forwarding) ด้านล่าง)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## จุดเข้าใช้งาน Assistant

Android รองรับการเปิด OpenClaw จากทริกเกอร์ assistant ของระบบ (Google
Assistant) เมื่อกำหนดค่าแล้ว การกดปุ่ม home ค้างไว้หรือพูดว่า "Hey Google, ask
OpenClaw..." จะเปิดแอปและส่งพรอมต์เข้าไปยังตัวเขียนข้อความแชต

สิ่งนี้ใช้เมทาดาทา **App Actions** ของ Android ที่ประกาศไว้ใน manifest ของแอป ไม่ต้องมี
การกำหนดค่าเพิ่มเติมฝั่ง gateway -- assistant intent จะถูกจัดการทั้งหมดโดยแอป Android และส่งต่อเป็นข้อความแชตปกติ

<Note>
ความพร้อมใช้งานของ App Actions ขึ้นอยู่กับอุปกรณ์ เวอร์ชัน Google Play Services
และผู้ใช้ตั้ง OpenClaw เป็นแอป assistant เริ่มต้นหรือไม่
</Note>

## การส่งต่อการแจ้งเตือน

Android สามารถส่งต่อการแจ้งเตือนของอุปกรณ์ไปยัง gateway เป็นเหตุการณ์ได้ มีตัวควบคุมหลายรายการให้คุณกำหนดขอบเขตว่าจะส่งต่อการแจ้งเตือนใดและเมื่อใด

| คีย์                              | ประเภท           | คำอธิบาย                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | ส่งต่อเฉพาะการแจ้งเตือนจากชื่อแพ็กเกจเหล่านี้ หากตั้งค่าไว้ แพ็กเกจอื่นทั้งหมดจะถูกละไว้      |
| `notifications.denyPackages`     | string[]       | ไม่ส่งต่อการแจ้งเตือนจากชื่อแพ็กเกจเหล่านี้ ใช้หลังจาก `allowPackages`              |
| `notifications.quietHours.start` | string (HH:mm) | จุดเริ่มต้นของช่วงเวลาเงียบ (เวลาท้องถิ่นของอุปกรณ์) การแจ้งเตือนจะถูกระงับระหว่างช่วงเวลานี้ |
| `notifications.quietHours.end`   | string (HH:mm) | จุดสิ้นสุดของช่วงเวลาเงียบ                                                                        |
| `notifications.rateLimit`        | number         | จำนวนการแจ้งเตือนสูงสุดที่ส่งต่อต่อแพ็กเกจต่อนาที การแจ้งเตือนที่เกินจะถูกทิ้ง         |

ตัวเลือกการแจ้งเตือนยังใช้พฤติกรรมที่ปลอดภัยกว่าสำหรับเหตุการณ์การแจ้งเตือนที่ส่งต่อ เพื่อป้องกันการส่งต่อการแจ้งเตือนระบบที่ละเอียดอ่อนโดยไม่ตั้งใจ

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
การส่งต่อการแจ้งเตือนต้องใช้สิทธิ์ Android Notification Listener แอปจะแจ้งขอสิทธิ์นี้ระหว่างการตั้งค่า
</Note>

## ที่เกี่ยวข้อง

- [แอป iOS](/th/platforms/ios)
- [Node](/th/nodes)
- [การแก้ไขปัญหา Node Android](/th/nodes/troubleshooting)
