---
read_when:
    - การตั้งค่าการรองรับ Signal
    - การดีบักการส่ง/รับ Signal
summary: รองรับ Signal ผ่าน signal-cli (daemon แบบเนทีฟหรือคอนเทนเนอร์ bbernhard), พาธการตั้งค่า และโมเดลหมายเลข
title: Signal
x-i18n:
    generated_at: "2026-07-03T17:46:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 862afe3764e89aa026d245f57134b8e8e157539f24975ca341d67296fb8852d0
    source_path: channels/signal.md
    workflow: 16
---

สถานะ: การผสานรวม CLI ภายนอก Gateway คุยกับ `signal-cli` ผ่าน HTTP — ไม่ว่าจะเป็นเดมอนเนทีฟ (JSON-RPC + SSE) หรือคอนเทนเนอร์ bbernhard/signal-cli-rest-api (REST + WebSocket)

## ข้อกำหนดเบื้องต้น

- ติดตั้ง OpenClaw บนเซิร์ฟเวอร์ของคุณแล้ว (ขั้นตอน Linux ด้านล่างทดสอบบน Ubuntu 24)
- อย่างใดอย่างหนึ่ง:
  - มี `signal-cli` บนโฮสต์ (โหมดเนทีฟ), **หรือ**
  - คอนเทนเนอร์ Docker `bbernhard/signal-cli-rest-api` (โหมดคอนเทนเนอร์)
- หมายเลขโทรศัพท์ที่สามารถรับ SMS ยืนยันได้หนึ่งครั้ง (สำหรับเส้นทางการลงทะเบียนด้วย SMS)
- การเข้าถึงเบราว์เซอร์สำหรับ captcha ของ Signal (`signalcaptchas.org`) ระหว่างการลงทะเบียน

## การตั้งค่าอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ใช้ **หมายเลข Signal แยกต่างหาก** สำหรับบอต (แนะนำ)
2. ติดตั้ง Plugin ของ OpenClaw:

```bash
openclaw plugins install @openclaw/signal
```

3. ติดตั้ง `signal-cli` (ต้องมี Java หากคุณใช้บิลด์ JVM)
4. เลือกเส้นทางการตั้งค่าหนึ่งแบบ:
   - **เส้นทาง A (ลิงก์ QR):** `signal-cli link -n "OpenClaw"` แล้วสแกนด้วย Signal
   - **เส้นทาง B (ลงทะเบียนด้วย SMS):** ลงทะเบียนหมายเลขเฉพาะด้วย captcha + การยืนยัน SMS
5. กำหนดค่า OpenClaw แล้วรีสตาร์ท Gateway
6. ส่ง DM แรกและอนุมัติการจับคู่ (`openclaw pairing approve signal <CODE>`)

การกำหนดค่าขั้นต่ำ:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

อ้างอิงฟิลด์:

| ฟิลด์        | คำอธิบาย                                       |
| ------------ | ------------------------------------------------- |
| `account`    | หมายเลขโทรศัพท์ของบอตในรูปแบบ E.164 (`+15551234567`) |
| `cliPath`    | พาธไปยัง `signal-cli` (`signal-cli` หากอยู่ใน `PATH`)  |
| `configPath` | ไดเรกทอรี config ของ signal-cli ที่ส่งผ่านเป็น `--config`        |
| `dmPolicy`   | นโยบายการเข้าถึง DM (แนะนำ `pairing`)          |
| `allowFrom`  | หมายเลขโทรศัพท์หรือค่า `uuid:<id>` ที่อนุญาตให้ส่ง DM |

## สิ่งนี้คืออะไร

- ช่องทาง Signal ผ่าน `signal-cli` (ไม่ใช่ libsignal แบบฝัง)
- การกำหนดเส้นทางแบบกำหนดแน่นอน: การตอบกลับจะกลับไปที่ Signal เสมอ
- DM ใช้เซสชันหลักของเอเจนต์ร่วมกัน; กลุ่มจะถูกแยกต่างหาก (`agent:<agentId>:signal:group:<groupId>`)

## การเขียน config

ตามค่าเริ่มต้น Signal ได้รับอนุญาตให้เขียนอัปเดต config ที่ถูกเรียกด้วย `/config set|unset` (ต้องมี `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## โมเดลหมายเลข (สำคัญ)

- Gateway เชื่อมต่อกับ **อุปกรณ์ Signal** (บัญชี `signal-cli`)
- หากคุณรันบอตบน **บัญชี Signal ส่วนตัวของคุณ** บอตจะละเว้นข้อความของคุณเอง (การป้องกันลูป)
- สำหรับ "ฉันส่งข้อความหาบอตแล้วบอตตอบกลับ" ให้ใช้ **หมายเลขบอตแยกต่างหาก**

## เส้นทางการตั้งค่า A: ลิงก์บัญชี Signal ที่มีอยู่ (QR)

1. ติดตั้ง `signal-cli` (บิลด์ JVM หรือเนทีฟ)
2. ลิงก์บัญชีบอต:
   - `signal-cli link -n "OpenClaw"` จากนั้นสแกน QR ใน Signal
3. กำหนดค่า Signal และเริ่ม Gateway

ตัวอย่าง:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

รองรับหลายบัญชี: ใช้ `channels.signal.accounts` พร้อม config ต่อบัญชีและ `name` ที่เป็นทางเลือก ดู [`gateway/configuration`](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบร่วม

## เส้นทางการตั้งค่า B: ลงทะเบียนหมายเลขบอตเฉพาะ (SMS, Linux)

ใช้วิธีนี้เมื่อคุณต้องการหมายเลขบอตเฉพาะแทนการลิงก์บัญชีแอป Signal ที่มีอยู่

1. รับหมายเลขที่สามารถรับ SMS ได้ (หรือการยืนยันด้วยเสียงสำหรับโทรศัพท์พื้นฐาน)
   - ใช้หมายเลขบอตเฉพาะเพื่อหลีกเลี่ยงความขัดแย้งของบัญชี/เซสชัน
2. ติดตั้ง `signal-cli` บนโฮสต์ Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

หากคุณใช้บิลด์ JVM (`signal-cli-${VERSION}.tar.gz`) ให้ติดตั้ง JRE 25+ ก่อน
คอยอัปเดต `signal-cli` อยู่เสมอ; upstream ระบุว่ารีลีสเก่าอาจเสียได้เมื่อ API เซิร์ฟเวอร์ Signal เปลี่ยนแปลง

3. ลงทะเบียนและยืนยันหมายเลข:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

หากต้องใช้ captcha:

1. เปิด `https://signalcaptchas.org/registration/generate.html`
2. ทำ captcha ให้เสร็จ แล้วคัดลอกเป้าหมายลิงก์ `signalcaptcha://...` จาก "Open Signal"
3. รันจาก IP ภายนอกเดียวกับเซสชันเบราว์เซอร์เมื่อเป็นไปได้
4. รันการลงทะเบียนอีกครั้งทันที (โทเคน captcha หมดอายุเร็ว):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. กำหนดค่า OpenClaw, รีสตาร์ท Gateway, ตรวจสอบช่องทาง:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. จับคู่ผู้ส่ง DM ของคุณ:
   - ส่งข้อความใดก็ได้ไปยังหมายเลขบอต
   - อนุมัติรหัสบนเซิร์ฟเวอร์: `openclaw pairing approve signal <PAIRING_CODE>`
   - บันทึกหมายเลขบอตเป็นผู้ติดต่อในโทรศัพท์ของคุณเพื่อหลีกเลี่ยง "Unknown contact"

<Warning>
การลงทะเบียนบัญชีหมายเลขโทรศัพท์ด้วย `signal-cli` อาจทำให้เซสชันแอป Signal หลักของหมายเลขนั้นถูกยกเลิกการยืนยันตัวตน ควรใช้หมายเลขบอตเฉพาะ หรือใช้โหมดลิงก์ QR หากคุณต้องคงการตั้งค่าแอปโทรศัพท์ที่มีอยู่ไว้
</Warning>

อ้างอิง upstream:

- README ของ `signal-cli`: `https://github.com/AsamK/signal-cli`
- ขั้นตอน captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- ขั้นตอนการลิงก์: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## โหมดเดมอนภายนอก (httpUrl)

หากคุณต้องการจัดการ `signal-cli` เอง (การเริ่มต้น JVM แบบ cold start ที่ช้า, การเริ่มต้นคอนเทนเนอร์, หรือ CPU ที่ใช้ร่วมกัน) ให้รันเดมอนแยกต่างหากและชี้ OpenClaw ไปที่เดมอนนั้น:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

วิธีนี้จะข้ามการ spawn อัตโนมัติและการรอเริ่มต้นภายใน OpenClaw สำหรับการเริ่มต้นที่ช้าเมื่อ spawn อัตโนมัติ ให้ตั้งค่า `channels.signal.startupTimeoutMs`

## โหมดคอนเทนเนอร์ (bbernhard/signal-cli-rest-api)

แทนที่จะรัน `signal-cli` แบบเนทีฟ คุณสามารถใช้คอนเทนเนอร์ Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) ได้ สิ่งนี้ห่อ `signal-cli` ไว้หลัง REST API และอินเทอร์เฟซ WebSocket

ข้อกำหนด:

- คอนเทนเนอร์ **ต้อง** รันด้วย `MODE=json-rpc` เพื่อรับข้อความแบบเรียลไทม์
- ลงทะเบียนหรือลิงก์บัญชี Signal ของคุณภายในคอนเทนเนอร์ก่อนเชื่อมต่อ OpenClaw

ตัวอย่างบริการ `docker-compose.yml`:

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

config ของ OpenClaw:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

ฟิลด์ `apiMode` ควบคุมว่า OpenClaw ใช้โปรโตคอลใด:

| ค่า         | พฤติกรรม                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (ค่าเริ่มต้น) ตรวจสอบทั้งสองทรานสปอร์ต; การสตรีมตรวจยืนยันการรับผ่าน WebSocket ของคอนเทนเนอร์    |
| `"native"`    | บังคับใช้ signal-cli เนทีฟ (JSON-RPC ที่ `/api/v1/rpc`, SSE ที่ `/api/v1/events`)         |
| `"container"` | บังคับใช้คอนเทนเนอร์ bbernhard (REST ที่ `/v2/send`, WebSocket ที่ `/v1/receive/{account}`) |

เมื่อ `apiMode` เป็น `"auto"` OpenClaw จะแคชโหมดที่ตรวจพบไว้ 30 วินาทีเพื่อหลีกเลี่ยงการ probe ซ้ำ การรับจากคอนเทนเนอร์จะถูกเลือกสำหรับการสตรีมหลังจาก `/v1/receive/{account}` อัปเกรดเป็น WebSocket เท่านั้น ซึ่งต้องใช้ `MODE=json-rpc`

โหมดคอนเทนเนอร์รองรับการทำงานของช่องทาง Signal แบบเดียวกับโหมดเนทีฟในกรณีที่คอนเทนเนอร์เปิดเผย API ที่ตรงกัน: การส่ง, การรับ, ไฟล์แนบ, ตัวบ่งชี้การพิมพ์, ใบตอบรับว่าอ่าน/ดูแล้ว, รีแอ็กชัน, กลุ่ม, และข้อความมีสไตล์ OpenClaw แปลงการเรียก RPC ของ Signal แบบเนทีฟเป็น payload REST ของคอนเทนเนอร์ รวมถึง ID กลุ่ม `group.{base64(internal_id)}` และ `text_mode: "styled"` สำหรับข้อความที่จัดรูปแบบ

หมายเหตุการปฏิบัติงาน:

- ใช้ `autoStart: false` กับโหมดคอนเทนเนอร์ OpenClaw ไม่ควร spawn เดมอนเนทีฟเมื่อเลือก `apiMode: "container"`
- ใช้ `MODE=json-rpc` สำหรับการรับ `MODE=normal` อาจทำให้ `/v1/about` ดูปกติ แต่ `/v1/receive/{account}` ไม่อัปเกรดเป็น WebSocket ดังนั้น OpenClaw จะไม่เลือกการสตรีมรับจากคอนเทนเนอร์ในโหมด `auto`
- ตั้งค่า `apiMode: "container"` เมื่อคุณรู้ว่า `httpUrl` ชี้ไปที่ REST API ของ bbernhard ตั้งค่า `apiMode: "native"` เมื่อคุณรู้ว่าชี้ไปที่ JSON-RPC/SSE ของ `signal-cli` แบบเนทีฟ ใช้ `"auto"` เมื่อดีพลอยเมนต์อาจแตกต่างกันได้
- การดาวน์โหลดไฟล์แนบของคอนเทนเนอร์เคารพขีดจำกัดไบต์สื่อเดียวกับโหมดเนทีฟ การตอบกลับที่มีขนาดใหญ่เกินจะถูกปฏิเสธก่อนบัฟเฟอร์เต็มเมื่อเซิร์ฟเวอร์ส่ง `Content-Length` และจะถูกปฏิเสธระหว่างสตรีมในกรณีอื่น

## การควบคุมการเข้าถึง (DM + กลุ่ม)

DM:

- ค่าเริ่มต้น: `channels.signal.dmPolicy = "pairing"`
- ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่; ข้อความจะถูกละเว้นจนกว่าจะอนุมัติ (รหัสหมดอายุหลัง 1 ชั่วโมง)
- อนุมัติผ่าน:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- การจับคู่คือการแลกเปลี่ยนโทเคนเริ่มต้นสำหรับ DM ของ Signal รายละเอียด: [การจับคู่](/th/channels/pairing)
- ผู้ส่งแบบ UUID เท่านั้น (จาก `sourceUuid`) จะถูกจัดเก็บเป็น `uuid:<id>` ใน `channels.signal.allowFrom`

กลุ่ม:

- `channels.signal.groupPolicy = open | allowlist | disabled`
- `channels.signal.groupAllowFrom` ควบคุมว่ากลุ่มหรือผู้ส่งใดสามารถเรียกการตอบกลับกลุ่มได้เมื่อกำหนด `allowlist`; รายการอาจเป็น ID กลุ่ม Signal (ดิบ, `group:<id>`, หรือ `signal:group:<id>`), หมายเลขโทรศัพท์ผู้ส่ง, ค่า `uuid:<id>`, หรือ `*`
- `channels.signal.groups["<group-id>" | "*"]` สามารถเขียนทับพฤติกรรมกลุ่มด้วย `requireMention`, `tools`, และ `toolsBySender`
- ใช้ `channels.signal.accounts.<id>.groups` สำหรับการเขียนทับต่อบัญชีในการตั้งค่าแบบหลายบัญชี
- การอนุญาตกลุ่ม Signal ผ่าน `groupAllowFrom` ไม่ได้ปิด mention gating ด้วยตัวเอง รายการ `channels.signal.groups["<group-id>"]` ที่กำหนดค่าไว้โดยเฉพาะจะประมวลผลข้อความกลุ่มทุกข้อความ เว้นแต่ตั้งค่า `requireMention=true`
- หมายเหตุรันไทม์: หากไม่มี `channels.signal` เลย รันไทม์จะ fallback เป็น `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

## วิธีทำงาน (พฤติกรรม)

- โหมดเนทีฟ: `signal-cli` รันเป็นเดมอน; Gateway อ่านอีเวนต์ผ่าน SSE
- โหมดคอนเทนเนอร์: Gateway ส่งผ่าน REST API และรับผ่าน WebSocket
- ข้อความขาเข้าจะถูกทำให้เป็นมาตรฐานเป็น envelope ช่องทางร่วม
- การตอบกลับจะถูกกำหนดเส้นทางกลับไปยังหมายเลขหรือกลุ่มเดียวกันเสมอ

## สื่อ + ขีดจำกัด

- ข้อความขาออกจะถูกแบ่งเป็นชิ้นตาม `channels.signal.textChunkLimit` (ค่าเริ่มต้น 4000)
- การแบ่งชิ้นตามบรรทัดใหม่แบบทางเลือก: ตั้งค่า `channels.signal.chunkMode="newline"` เพื่อแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- รองรับไฟล์แนบ (ดึง base64 จาก `signal-cli`)
- ไฟล์แนบบันทึกเสียงใช้ชื่อไฟล์ `signal-cli` เป็น fallback ของ MIME เมื่อไม่มี `contentType` ดังนั้นการถอดเสียงเสียงยังสามารถจัดประเภท voice memo แบบ AAC ได้
- ขีดจำกัดสื่อเริ่มต้น: `channels.signal.mediaMaxMb` (ค่าเริ่มต้น 8)
- ใช้ `channels.signal.ignoreAttachments` เพื่อข้ามการดาวน์โหลดสื่อ
- บริบทประวัติกลุ่มใช้ `channels.signal.historyLimit` (หรือ `channels.signal.accounts.*.historyLimit`) โดย fallback เป็น `messages.groupChat.historyLimit` ตั้งค่า `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)

## การพิมพ์ + ใบตอบรับว่าอ่านแล้ว

- **ตัวบ่งชี้การพิมพ์**: OpenClaw ส่งสัญญาณการพิมพ์ผ่าน `signal-cli sendTyping` และรีเฟรชสัญญาณเหล่านั้นระหว่างที่กำลังเรียกใช้การตอบกลับ
- **ใบตอบรับการอ่าน**: เมื่อ `channels.signal.sendReadReceipts` เป็น true OpenClaw จะส่งต่อใบตอบรับการอ่านสำหรับ DM ที่อนุญาต
- Signal-cli ไม่เปิดเผยใบตอบรับการอ่านสำหรับกลุ่ม

## รีแอ็กชันสถานะวงจรชีวิต

ตั้งค่า `messages.statusReactions.enabled: true` เพื่อให้ Signal แสดงวงจรชีวิตรีแอ็กชัน
queued/thinking/tool/Compaction/done/error ที่ใช้ร่วมกันในเทิร์นขาเข้า
Signal ใช้ timestamp ของข้อความขาเข้าเป็นเป้าหมายของรีแอ็กชัน ส่วนรีแอ็กชัน
ในกลุ่มจะถูกส่งด้วยรหัสกลุ่ม Signal พร้อมผู้ส่งเดิมเป็นผู้เขียนเป้าหมาย

รีแอ็กชันสถานะยังต้องมีรีแอ็กชัน ack และ
`messages.ackReactionScope` ที่ตรงกัน (`direct`, `group-all`, `group-mentions`, หรือ `all`)
ตั้งค่า `channels.signal.reactionLevel: "off"` เพื่อปิดใช้งานรีแอ็กชันสถานะของ Signal
การกระทำ `react` ของเครื่องมือข้อความยังคงเข้มงวดกว่า: ต้องมี
`reactionLevel: "minimal"` หรือ `"extensive"`

`messages.removeAckAfterReply: true` จะล้างรีแอ็กชันสถานะสุดท้ายหลังจาก
เวลาคงสถานะที่กำหนดไว้ มิฉะนั้น Signal จะคืนค่ารีแอ็กชัน ack เริ่มต้นหลังจาก
สถานะ done/error สุดท้าย

## รีแอ็กชัน (เครื่องมือข้อความ)

- ใช้ `message action=react` พร้อม `channel=signal`
- เป้าหมาย: E.164 หรือ UUID ของผู้ส่ง (ใช้ `uuid:<id>` จากเอาต์พุตการจับคู่; UUID เปล่าก็ใช้ได้เช่นกัน)
- `messageId` คือ timestamp ของ Signal สำหรับข้อความที่คุณกำลังรีแอ็กต์
- รีแอ็กชันในกลุ่มต้องใช้ `targetAuthor` หรือ `targetAuthorUuid`

ตัวอย่าง:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

การกำหนดค่า:

- `channels.signal.actions.reactions`: เปิด/ปิดการกระทำรีแอ็กชัน (ค่าเริ่มต้น true)
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`
  - `off`/`ack` ปิดใช้งานรีแอ็กชันของเอเจนต์ (เครื่องมือข้อความ `react` จะเกิดข้อผิดพลาด)
  - `minimal`/`extensive` เปิดใช้งานรีแอ็กชันของเอเจนต์และตั้งค่าระดับคำแนะนำ
- การแทนที่รายบัญชี: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`

## รีแอ็กชันการอนุมัติ

พรอมป์อนุมัติ exec และ Plugin ของ Signal ใช้บล็อกการกำหนดเส้นทางระดับบนสุด
`approvals.exec` และ `approvals.plugin` Signal ไม่มีบล็อก
`channels.signal.execApprovals`

- `👍` อนุมัติหนึ่งครั้ง
- `👎` ปฏิเสธ
- ใช้ `/approve <id> allow-always` เมื่อคำขอเสนอการอนุมัติแบบถาวร

การ resolve รีแอ็กชันการอนุมัติต้องมีผู้อนุมัติ Signal อย่างชัดเจนจาก
`channels.signal.allowFrom`, `channels.signal.defaultTo`, หรือฟิลด์ระดับบัญชีที่ตรงกัน
พรอมป์อนุมัติ exec แบบแชตตรงเดียวกันยังสามารถระงับ fallback `/approve` ภายในที่ซ้ำกันได้
โดยไม่ต้องมีผู้อนุมัติอย่างชัดเจน; การอนุมัติในกลุ่มที่ไม่มีผู้อนุมัติจะยังคงแสดง fallback ภายในไว้

## เป้าหมายการส่ง (CLI/Cron)

- DM: `signal:+15551234567` (หรือ E.164 เปล่า)
- DM แบบ UUID: `uuid:<id>` (หรือ UUID เปล่า)
- กลุ่ม: `signal:group:<groupId>`
- ชื่อผู้ใช้: `username:<name>` (หากบัญชี Signal ของคุณรองรับ)

## นามแฝง

กำหนดค่านามแฝงเมื่อคุณต้องการชื่อที่เสถียรสำหรับเป้าหมาย Signal ที่ใช้ซ้ำ
นามแฝงเป็นการกำหนดค่าฝั่ง OpenClaw เท่านั้น; ไม่ได้สร้างหรือแก้ไขผู้ติดต่อ Signal

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

ใช้นามแฝงได้ทุกที่ที่รับเป้าหมายการส่งของ Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

นามแฝงรายบัญชีจะสืบทอดนามแฝงระดับบนสุดและสามารถเพิ่มหรือแทนที่ชื่อได้:

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` และ
`openclaw directory groups list --channel signal` จะแสดงรายการนามแฝงที่กำหนดค่าไว้ ไดเรกทอรี
Signal อิงการกำหนดค่า; ไม่ได้ query ผู้ติดต่อ Signal แบบสดหรือ
เปลี่ยนแปลงบัญชี Signal

## การแก้ไขปัญหา

เรียกใช้ลำดับนี้ก่อน:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

จากนั้นยืนยันสถานะการจับคู่ DM หากจำเป็น:

```bash
openclaw pairing list signal
```

ความล้มเหลวที่พบบ่อย:

- เข้าถึง daemon ได้แต่ไม่มีการตอบกลับ: ตรวจสอบการตั้งค่าบัญชี/daemon (`httpUrl`, `account`) และโหมดการรับ
- DM ถูกเพิกเฉย: ผู้ส่งกำลังรอการอนุมัติการจับคู่
- ข้อความกลุ่มถูกเพิกเฉย: การ gating ตามผู้ส่งกลุ่ม/การกล่าวถึงบล็อกการส่ง
- ข้อผิดพลาดการตรวจสอบการกำหนดค่าหลังแก้ไข: เรียกใช้ `openclaw doctor --fix`
- Signal หายไปจาก diagnostics: ยืนยัน `channels.signal.enabled: true`

การตรวจสอบเพิ่มเติม:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

สำหรับ flow การ triage: [/channels/troubleshooting](/th/channels/troubleshooting)

## หมายเหตุด้านความปลอดภัย

- `signal-cli` เก็บคีย์บัญชีไว้ภายในเครื่อง (โดยทั่วไปคือ `~/.local/share/signal-cli/data/`)
- สำรองสถานะบัญชี Signal ก่อนย้ายเซิร์ฟเวอร์หรือสร้างใหม่
- คง `channels.signal.dmPolicy: "pairing"` ไว้ เว้นแต่คุณต้องการการเข้าถึง DM ที่กว้างขึ้นอย่างชัดเจน
- การยืนยันทาง SMS จำเป็นเฉพาะสำหรับ flow การลงทะเบียนหรือการกู้คืนเท่านั้น แต่การสูญเสียการควบคุมหมายเลข/บัญชีอาจทำให้การลงทะเบียนใหม่ซับซ้อนขึ้น

## อ้างอิงการกำหนดค่า (Signal)

การกำหนดค่าทั้งหมด: [การกำหนดค่า](/th/gateway/configuration)

ตัวเลือก provider:

- `channels.signal.enabled`: เปิด/ปิดการเริ่มต้นช่องทาง
- `channels.signal.apiMode`: `auto | native | container` (ค่าเริ่มต้น: auto) ดู [โหมด Container](#container-mode-bbernhardsignal-cli-rest-api)
- `channels.signal.account`: E.164 สำหรับบัญชีบอต
- `channels.signal.cliPath`: พาธไปยัง `signal-cli`
- `channels.signal.configPath`: ไดเรกทอรี `signal-cli --config` ที่ไม่บังคับ
- `channels.signal.httpUrl`: URL daemon แบบเต็ม (แทนที่ host/port)
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemon bind (ค่าเริ่มต้น 127.0.0.1:8080)
- `channels.signal.autoStart`: spawn daemon อัตโนมัติ (ค่าเริ่มต้น true หากไม่ได้ตั้ง `httpUrl`)
- `channels.signal.startupTimeoutMs`: timeout การรอเริ่มต้นเป็น ms (เพดาน 120000)
- `channels.signal.receiveMode`: `on-start | manual`
- `channels.signal.ignoreAttachments`: ข้ามการดาวน์โหลดไฟล์แนบ
- `channels.signal.ignoreStories`: เพิกเฉย stories จาก daemon
- `channels.signal.sendReadReceipts`: ส่งต่อใบตอบรับการอ่าน
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.signal.allowFrom`: รายการอนุญาต DM (E.164 หรือ `uuid:<id>`) `open` ต้องใช้ `"*"` Signal ไม่มีชื่อผู้ใช้; ใช้รหัสโทรศัพท์/UUID
- `channels.signal.aliases`: นามแฝงฝั่ง OpenClaw สำหรับเป้าหมายการส่ง DM หรือกลุ่ม
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: allowlist)
- `channels.signal.groupAllowFrom`: รายการอนุญาตกลุ่ม; รับรหัสกลุ่ม Signal (แบบ raw, `group:<id>`, หรือ `signal:group:<id>`), หมายเลข E.164 ของผู้ส่ง, หรือค่า `uuid:<id>`
- `channels.signal.groups`: การแทนที่รายกลุ่มที่ keyed ด้วยรหัสกลุ่ม Signal (หรือ `"*"`) ฟิลด์ที่รองรับ: `requireMention`, `tools`, `toolsBySender`
- `channels.signal.accounts.<id>.groups`: เวอร์ชันรายบัญชีของ `channels.signal.groups` สำหรับการตั้งค่าหลายบัญชี
- `channels.signal.accounts.<id>.aliases`: นามแฝงรายบัญชีที่ผสานกับนามแฝงระดับบนสุด
- `channels.signal.historyLimit`: จำนวนข้อความกลุ่มสูงสุดที่จะรวมเป็นบริบท (0 ปิดใช้งาน)
- `channels.signal.dmHistoryLimit`: ขีดจำกัดประวัติ DM เป็นเทิร์นผู้ใช้ การแทนที่รายผู้ใช้: `channels.signal.dms["<phone_or_uuid>"].historyLimit`
- `channels.signal.textChunkLimit`: ขนาด chunk ขาออก (อักขระ)
- `channels.signal.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อน chunk ตามความยาว
- `channels.signal.mediaMaxMb`: เพดานสื่อขาเข้า/ขาออก (MB)

ตัวเลือก global ที่เกี่ยวข้อง:

- `agents.list[].groupChat.mentionPatterns` (Signal ไม่รองรับการกล่าวถึงแบบ native)
- `messages.groupChat.mentionPatterns` (fallback global)
- `messages.responsePrefix`

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และ flow การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการ gating การกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเพิ่มความแข็งแกร่ง
