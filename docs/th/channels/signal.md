---
read_when:
    - การตั้งค่าการรองรับ Signal
    - การดีบักการส่ง/รับของ Signal
summary: การรองรับ Signal ผ่าน signal-cli (daemon แบบเนทีฟหรือคอนเทนเนอร์ bbernhard), เส้นทางการตั้งค่า และโมเดลหมายเลข
title: Signal
x-i18n:
    generated_at: "2026-05-10T19:24:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d92f94f6c1363a795366501bb5c6d5f09756c03f156b482d17021c276e3577c
    source_path: channels/signal.md
    workflow: 16
---

สถานะ: การผสานรวม CLI ภายนอก Gateway สื่อสารกับ `signal-cli` ผ่าน HTTP ไม่ว่าจะเป็นดีมอนแบบเนทีฟ (JSON-RPC + SSE) หรือคอนเทนเนอร์ bbernhard/signal-cli-rest-api (REST + WebSocket)

## ข้อกำหนดเบื้องต้น

- ติดตั้ง OpenClaw บนเซิร์ฟเวอร์ของคุณแล้ว (ขั้นตอน Linux ด้านล่างทดสอบบน Ubuntu 24)
- อย่างใดอย่างหนึ่งต่อไปนี้:
  - มี `signal-cli` บนโฮสต์ (โหมดเนทีฟ), **หรือ**
  - คอนเทนเนอร์ Docker `bbernhard/signal-cli-rest-api` (โหมดคอนเทนเนอร์)
- หมายเลขโทรศัพท์ที่รับ SMS ยืนยันได้หนึ่งครั้ง (สำหรับเส้นทางการลงทะเบียนด้วย SMS)
- การเข้าถึงเบราว์เซอร์สำหรับ captcha ของ Signal (`signalcaptchas.org`) ระหว่างการลงทะเบียน

## การตั้งค่าแบบเร็ว (สำหรับผู้เริ่มต้น)

1. ใช้ **หมายเลข Signal แยกต่างหาก** สำหรับบอต (แนะนำ)
2. ติดตั้ง `signal-cli` (ต้องใช้ Java หากคุณใช้บิลด์ JVM)
3. เลือกเส้นทางการตั้งค่าหนึ่งแบบ:
   - **เส้นทาง A (ลิงก์ QR):** `signal-cli link -n "OpenClaw"` แล้วสแกนด้วย Signal
   - **เส้นทาง B (ลงทะเบียนด้วย SMS):** ลงทะเบียนหมายเลขเฉพาะด้วย captcha + การยืนยันทาง SMS
4. กำหนดค่า OpenClaw และรีสตาร์ต gateway
5. ส่ง DM แรกและอนุมัติการจับคู่ (`openclaw pairing approve signal <CODE>`)

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

| ฟิลด์       | คำอธิบาย                                       |
| ----------- | ------------------------------------------------- |
| `account`   | หมายเลขโทรศัพท์ของบอตในรูปแบบ E.164 (`+15551234567`) |
| `cliPath`   | เส้นทางไปยัง `signal-cli` (`signal-cli` หากอยู่ใน `PATH`)  |
| `dmPolicy`  | นโยบายการเข้าถึง DM (แนะนำ `pairing`)          |
| `allowFrom` | หมายเลขโทรศัพท์หรือค่า `uuid:<id>` ที่อนุญาตให้ส่ง DM |

## สิ่งนี้คืออะไร

- ช่องทาง Signal ผ่าน `signal-cli` (ไม่ใช่ libsignal แบบฝังในตัว)
- การกำหนดเส้นทางแบบกำหนดแน่นอน: การตอบกลับจะย้อนกลับไปยัง Signal เสมอ
- DM ใช้เซสชันหลักของเอเจนต์ร่วมกัน; กลุ่มจะแยกออกจากกัน (`agent:<agentId>:signal:group:<groupId>`)

## การเขียนการกำหนดค่า

โดยค่าเริ่มต้น Signal ได้รับอนุญาตให้เขียนการอัปเดตการกำหนดค่าที่ถูกทริกเกอร์โดย `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## โมเดลหมายเลข (สำคัญ)

- Gateway เชื่อมต่อกับ **อุปกรณ์ Signal** (`signal-cli` account)
- หากคุณรันบอตบน **บัญชี Signal ส่วนตัวของคุณ** ระบบจะละเว้นข้อความของคุณเอง (การป้องกันลูป)
- สำหรับ "ฉันส่งข้อความหาบอตและมันตอบกลับ" ให้ใช้ **หมายเลขบอตแยกต่างหาก**

## เส้นทางการตั้งค่า A: ลิงก์บัญชี Signal ที่มีอยู่ (QR)

1. ติดตั้ง `signal-cli` (บิลด์ JVM หรือเนทีฟ)
2. ลิงก์บัญชีบอต:
   - `signal-cli link -n "OpenClaw"` จากนั้นสแกน QR ใน Signal
3. กำหนดค่า Signal และเริ่ม gateway

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

รองรับหลายบัญชี: ใช้ `channels.signal.accounts` พร้อมการกำหนดค่ารายบัญชีและ `name` ที่เลือกได้ ดู [`gateway/configuration`](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบที่ใช้ร่วมกัน

## เส้นทางการตั้งค่า B: ลงทะเบียนหมายเลขบอตเฉพาะ (SMS, Linux)

ใช้วิธีนี้เมื่อคุณต้องการหมายเลขบอตเฉพาะแทนการลิงก์บัญชีแอป Signal ที่มีอยู่

1. รับหมายเลขที่สามารถรับ SMS ได้ (หรือการยืนยันด้วยเสียงสำหรับโทรศัพท์บ้าน)
   - ใช้หมายเลขบอตเฉพาะเพื่อหลีกเลี่ยงความขัดแย้งของบัญชี/เซสชัน
2. ติดตั้ง `signal-cli` บนโฮสต์ gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

หากคุณใช้บิลด์ JVM (`signal-cli-${VERSION}.tar.gz`) ให้ติดตั้ง JRE 25+ ก่อน
อัปเดต `signal-cli` ให้เป็นปัจจุบันอยู่เสมอ; upstream ระบุว่ารีลีสเก่าอาจเสียหายได้เมื่อ API ของเซิร์ฟเวอร์ Signal เปลี่ยนแปลง

3. ลงทะเบียนและยืนยันหมายเลข:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

หากต้องใช้ captcha:

1. เปิด `https://signalcaptchas.org/registration/generate.html`
2. ทำ captcha ให้เสร็จ คัดลอกเป้าหมายลิงก์ `signalcaptcha://...` จาก "Open Signal"
3. รันจาก IP ภายนอกเดียวกับเซสชันเบราว์เซอร์เมื่อเป็นไปได้
4. รันการลงทะเบียนอีกครั้งทันที (โทเคน captcha หมดอายุเร็ว):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. กำหนดค่า OpenClaw, รีสตาร์ต gateway, ตรวจสอบช่องทาง:

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
   - บันทึกหมายเลขบอตเป็นรายชื่อติดต่อบนโทรศัพท์ของคุณเพื่อหลีกเลี่ยง "Unknown contact"

<Warning>
การลงทะเบียนบัญชีหมายเลขโทรศัพท์ด้วย `signal-cli` อาจทำให้เซสชันแอป Signal หลักสำหรับหมายเลขนั้นถูกยกเลิกการยืนยันตัวตน ควรใช้หมายเลขบอตเฉพาะ หรือใช้โหมดลิงก์ QR หากคุณต้องการคงการตั้งค่าแอปโทรศัพท์ที่มีอยู่ไว้
</Warning>

อ้างอิง upstream:

- README ของ `signal-cli`: `https://github.com/AsamK/signal-cli`
- ขั้นตอน captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- ขั้นตอนการลิงก์: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## โหมดดีมอนภายนอก (httpUrl)

หากคุณต้องการจัดการ `signal-cli` เอง (การเริ่มแบบ cold start ของ JVM ที่ช้า, การเริ่มต้นคอนเทนเนอร์, หรือ CPU ที่ใช้ร่วมกัน) ให้รันดีมอนแยกต่างหากและชี้ OpenClaw ไปยังดีมอนนั้น:

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

วิธีนี้จะข้ามการสร้างโปรเซสอัตโนมัติและการรอเริ่มต้นภายใน OpenClaw สำหรับการเริ่มต้นที่ช้าเมื่อสร้างโปรเซสอัตโนมัติ ให้ตั้งค่า `channels.signal.startupTimeoutMs`

## โหมดคอนเทนเนอร์ (bbernhard/signal-cli-rest-api)

แทนที่จะรัน `signal-cli` แบบเนทีฟ คุณสามารถใช้คอนเทนเนอร์ Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) ได้ ซึ่งครอบ `signal-cli` ไว้หลัง REST API และอินเทอร์เฟซ WebSocket

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

การกำหนดค่า OpenClaw:

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
| `"auto"`      | (ค่าเริ่มต้น) โพรบทั้งสองทรานสปอร์ต; การสตรีมจะตรวจสอบการรับผ่าน WebSocket ของคอนเทนเนอร์    |
| `"native"`    | บังคับใช้ signal-cli แบบเนทีฟ (JSON-RPC ที่ `/api/v1/rpc`, SSE ที่ `/api/v1/events`)         |
| `"container"` | บังคับใช้คอนเทนเนอร์ bbernhard (REST ที่ `/v2/send`, WebSocket ที่ `/v1/receive/{account}`) |

เมื่อ `apiMode` เป็น `"auto"` OpenClaw จะแคชโหมดที่ตรวจพบเป็นเวลา 30 วินาทีเพื่อหลีกเลี่ยงการโพรบซ้ำ การรับจากคอนเทนเนอร์จะถูกเลือกสำหรับการสตรีมหลังจาก `/v1/receive/{account}` อัปเกรดเป็น WebSocket เท่านั้น ซึ่งต้องใช้ `MODE=json-rpc`

โหมดคอนเทนเนอร์รองรับการทำงานของช่องทาง Signal แบบเดียวกับโหมดเนทีฟในกรณีที่คอนเทนเนอร์เปิดเผย API ที่ตรงกัน: การส่ง, การรับ, ไฟล์แนบ, ตัวบ่งชี้การพิมพ์, ใบตอบรับว่าอ่าน/ดูแล้ว, รีแอคชัน, กลุ่ม, และข้อความที่จัดรูปแบบ OpenClaw แปลการเรียก RPC ของ Signal แบบเนทีฟให้เป็น payload REST ของคอนเทนเนอร์ รวมถึง ID กลุ่มแบบ `group.{base64(internal_id)}` และ `text_mode: "styled"` สำหรับข้อความที่จัดรูปแบบแล้ว

หมายเหตุด้านการปฏิบัติงาน:

- ใช้ `autoStart: false` กับโหมดคอนเทนเนอร์ OpenClaw ไม่ควรสร้างดีมอนเนทีฟเมื่อเลือก `apiMode: "container"`
- ใช้ `MODE=json-rpc` สำหรับการรับ `MODE=normal` อาจทำให้ `/v1/about` ดูปกติ แต่ `/v1/receive/{account}` จะไม่อัปเกรดเป็น WebSocket ดังนั้น OpenClaw จะไม่เลือกการสตรีมรับของคอนเทนเนอร์ในโหมด `auto`
- ตั้งค่า `apiMode: "container"` เมื่อคุณรู้ว่า `httpUrl` ชี้ไปยัง REST API ของ bbernhard ตั้งค่า `apiMode: "native"` เมื่อคุณรู้ว่ามันชี้ไปยัง JSON-RPC/SSE ของ `signal-cli` แบบเนทีฟ ใช้ `"auto"` เมื่อการปรับใช้อาจแตกต่างกัน
- การดาวน์โหลดไฟล์แนบของคอนเทนเนอร์เคารพขีดจำกัดไบต์สื่อเดียวกับโหมดเนทีฟ การตอบสนองที่มีขนาดเกินจะถูกปฏิเสธก่อนถูกบัฟเฟอร์จนเต็มเมื่อเซิร์ฟเวอร์ส่ง `Content-Length` และจะถูกปฏิเสธระหว่างสตรีมในกรณีอื่น

## การควบคุมการเข้าถึง (DMs + กลุ่ม)

DMs:

- ค่าเริ่มต้น: `channels.signal.dmPolicy = "pairing"`
- ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่; ข้อความจะถูกละเว้นจนกว่าจะอนุมัติ (รหัสหมดอายุหลัง 1 ชั่วโมง)
- อนุมัติผ่าน:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- การจับคู่เป็นการแลกเปลี่ยนโทเคนเริ่มต้นสำหรับ DM ของ Signal รายละเอียด: [การจับคู่](/th/channels/pairing)
- ผู้ส่งที่มีเฉพาะ UUID (จาก `sourceUuid`) จะถูกจัดเก็บเป็น `uuid:<id>` ใน `channels.signal.allowFrom`

กลุ่ม:

- `channels.signal.groupPolicy = open | allowlist | disabled`
- `channels.signal.groupAllowFrom` ควบคุมว่ากลุ่มหรือผู้ส่งใดสามารถทริกเกอร์การตอบกลับในกลุ่มได้เมื่อตั้งค่า `allowlist`; รายการสามารถเป็น ID กลุ่ม Signal (แบบดิบ, `group:<id>`, หรือ `signal:group:<id>`), หมายเลขโทรศัพท์ผู้ส่ง, ค่า `uuid:<id>`, หรือ `*`
- `channels.signal.groups["<group-id>" | "*"]` สามารถแทนที่พฤติกรรมกลุ่มด้วย `requireMention`, `tools`, และ `toolsBySender`
- ใช้ `channels.signal.accounts.<id>.groups` สำหรับการแทนที่รายบัญชีในการตั้งค่าหลายบัญชี
- การอนุญาตกลุ่ม Signal ผ่าน `groupAllowFrom` ไม่ได้ปิดใช้งานการบังคับกล่าวถึงด้วยตัวเอง รายการ `channels.signal.groups["<group-id>"]` ที่กำหนดค่าเฉพาะจะประมวลผลทุกข้อความในกลุ่ม เว้นแต่ตั้งค่า `requireMention=true`
- หมายเหตุรันไทม์: หากไม่มี `channels.signal` เลย รันไทม์จะ fallback เป็น `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้งค่า `channels.defaults.groupPolicy` แล้วก็ตาม)

## วิธีทำงาน (พฤติกรรม)

- โหมดเนทีฟ: `signal-cli` รันเป็นดีมอน; gateway อ่านเหตุการณ์ผ่าน SSE
- โหมดคอนเทนเนอร์: gateway ส่งผ่าน REST API และรับผ่าน WebSocket
- ข้อความขาเข้าจะถูกทำให้เป็นรูปแบบปกติใน envelope ช่องทางร่วม
- การตอบกลับจะกำหนดเส้นทางกลับไปยังหมายเลขหรือกลุ่มเดิมเสมอ

## สื่อ + ขีดจำกัด

- ข้อความขาออกจะถูกแบ่งเป็นช่วงตาม `channels.signal.textChunkLimit` (ค่าเริ่มต้น 4000)
- การแบ่งช่วงตามบรรทัดใหม่แบบเลือกได้: ตั้งค่า `channels.signal.chunkMode="newline"` เพื่อแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- รองรับไฟล์แนบ (ดึง base64 จาก `signal-cli`)
- ไฟล์แนบโน้ตเสียงใช้ชื่อไฟล์ของ `signal-cli` เป็นค่า MIME fallback เมื่อไม่มี `contentType` ดังนั้นการถอดเสียงยังคงจำแนกวอยซ์เมโม AAC ได้
- เพดานสื่อเริ่มต้น: `channels.signal.mediaMaxMb` (ค่าเริ่มต้น 8)
- ใช้ `channels.signal.ignoreAttachments` เพื่อข้ามการดาวน์โหลดสื่อ
- บริบทประวัติกลุ่มใช้ `channels.signal.historyLimit` (หรือ `channels.signal.accounts.*.historyLimit`) โดย fallback เป็น `messages.groupChat.historyLimit` ตั้งค่า `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)

## การพิมพ์ + ใบตอบรับการอ่าน

- **ตัวบ่งชี้การพิมพ์**: OpenClaw ส่งสัญญาณการพิมพ์ผ่าน `signal-cli sendTyping` และรีเฟรชระหว่างที่การตอบกลับกำลังทำงาน
- **ใบตอบรับการอ่าน**: เมื่อ `channels.signal.sendReadReceipts` เป็น true, OpenClaw จะส่งต่อใบตอบรับการอ่านสำหรับ DM ที่ได้รับอนุญาต
- Signal-cli ไม่เปิดเผยใบตอบรับการอ่านสำหรับกลุ่ม

## รีแอคชัน (เครื่องมือข้อความ)

- ใช้ `message action=react` พร้อม `channel=signal`
- เป้าหมาย: E.164 ของผู้ส่งหรือ UUID (ใช้ `uuid:<id>` จากเอาต์พุตการจับคู่; UUID แบบไม่มี prefix ก็ใช้ได้เช่นกัน)
- `messageId` คือ timestamp ของ Signal สำหรับข้อความที่คุณกำลังรีแอ็กชัน
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
  - `off`/`ack` ปิดรีแอ็กชันของ agent (`react` ของเครื่องมือข้อความจะเกิดข้อผิดพลาด)
  - `minimal`/`extensive` เปิดรีแอ็กชันของ agent และตั้งค่าระดับคำแนะนำ
- การแทนที่รายบัญชี: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`

## เป้าหมายการส่งมอบ (CLI/Cron)

- DM: `signal:+15551234567` (หรือ E.164 แบบธรรมดา)
- DM แบบ UUID: `uuid:<id>` (หรือ UUID แบบไม่มี prefix)
- กลุ่ม: `signal:group:<groupId>`
- ชื่อผู้ใช้: `username:<name>` (หากบัญชี Signal ของคุณรองรับ)

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
- DM ถูกละเว้น: ผู้ส่งกำลังรอการอนุมัติการจับคู่
- ข้อความกลุ่มถูกละเว้น: การกั้นผู้ส่ง/การกล่าวถึงในกลุ่มบล็อกการส่งมอบ
- ข้อผิดพลาดการตรวจสอบความถูกต้องของการกำหนดค่าหลังแก้ไข: เรียกใช้ `openclaw doctor --fix`
- Signal หายไปจากการวินิจฉัย: ยืนยัน `channels.signal.enabled: true`

การตรวจสอบเพิ่มเติม:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

สำหรับลำดับการคัดแยกปัญหา: [/channels/troubleshooting](/th/channels/troubleshooting)

## หมายเหตุด้านความปลอดภัย

- `signal-cli` จัดเก็บคีย์บัญชีไว้ภายในเครื่อง (โดยทั่วไปคือ `~/.local/share/signal-cli/data/`)
- สำรองสถานะบัญชี Signal ก่อนย้ายหรือสร้างเซิร์ฟเวอร์ใหม่
- คง `channels.signal.dmPolicy: "pairing"` ไว้ เว้นแต่คุณต้องการเข้าถึง DM ในวงกว้างขึ้นอย่างชัดเจน
- การยืนยันผ่าน SMS จำเป็นเฉพาะสำหรับลำดับการลงทะเบียนหรือการกู้คืน แต่การสูญเสียการควบคุมหมายเลข/บัญชีอาจทำให้การลงทะเบียนใหม่ซับซ้อนขึ้น

## ข้อมูลอ้างอิงการกำหนดค่า (Signal)

การกำหนดค่าแบบเต็ม: [การกำหนดค่า](/th/gateway/configuration)

ตัวเลือกของผู้ให้บริการ:

- `channels.signal.enabled`: เปิด/ปิดการเริ่มต้น channel
- `channels.signal.apiMode`: `auto | native | container` (ค่าเริ่มต้น: auto) ดู [โหมดคอนเทนเนอร์](#container-mode-bbernhardsignal-cli-rest-api)
- `channels.signal.account`: E.164 สำหรับบัญชีบอต
- `channels.signal.cliPath`: พาธไปยัง `signal-cli`
- `channels.signal.httpUrl`: URL daemon แบบเต็ม (แทนที่ host/port)
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemon bind (ค่าเริ่มต้น 127.0.0.1:8080)
- `channels.signal.autoStart`: สร้าง daemon อัตโนมัติ (ค่าเริ่มต้น true หากไม่ได้ตั้งค่า `httpUrl`)
- `channels.signal.startupTimeoutMs`: เวลารอการเริ่มต้นในหน่วย ms (สูงสุด 120000)
- `channels.signal.receiveMode`: `on-start | manual`
- `channels.signal.ignoreAttachments`: ข้ามการดาวน์โหลดไฟล์แนบ
- `channels.signal.ignoreStories`: ละเว้น stories จาก daemon
- `channels.signal.sendReadReceipts`: ส่งต่อใบตอบรับการอ่าน
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.signal.allowFrom`: allowlist ของ DM (E.164 หรือ `uuid:<id>`) `open` ต้องใช้ `"*"` Signal ไม่มีชื่อผู้ใช้; ใช้ ID โทรศัพท์/UUID
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: allowlist)
- `channels.signal.groupAllowFrom`: allowlist ของกลุ่ม; รับ ID กลุ่ม Signal (แบบ raw, `group:<id>`, หรือ `signal:group:<id>`), หมายเลข E.164 ของผู้ส่ง, หรือค่า `uuid:<id>`
- `channels.signal.groups`: การแทนที่รายกลุ่มที่ใช้ ID กลุ่ม Signal (หรือ `"*"`) เป็นคีย์ ฟิลด์ที่รองรับ: `requireMention`, `tools`, `toolsBySender`
- `channels.signal.accounts.<id>.groups`: เวอร์ชันรายบัญชีของ `channels.signal.groups` สำหรับการตั้งค่าแบบหลายบัญชี
- `channels.signal.historyLimit`: จำนวนข้อความกลุ่มสูงสุดที่จะรวมเป็นบริบท (0 คือปิดใช้งาน)
- `channels.signal.dmHistoryLimit`: ขีดจำกัดประวัติ DM เป็นจำนวน user turns การแทนที่รายผู้ใช้: `channels.signal.dms["<phone_or_uuid>"].historyLimit`
- `channels.signal.textChunkLimit`: ขนาดชิ้นส่วนขาออก (อักขระ)
- `channels.signal.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแยกตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งชิ้นส่วนตามความยาว
- `channels.signal.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า/ขาออก (MB)

ตัวเลือก global ที่เกี่ยวข้อง:

- `agents.list[].groupChat.mentionPatterns` (Signal ไม่รองรับการกล่าวถึงแบบ native)
- `messages.groupChat.mentionPatterns` (fallback แบบ global)
- `messages.responsePrefix`

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — channel ทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนและลำดับการจับคู่ DM
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการกั้นด้วยการกล่าวถึง
- [การกำหนดเส้นทาง Channel](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
