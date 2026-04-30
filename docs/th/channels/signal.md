---
read_when:
    - การตั้งค่าการรองรับ Signal
    - การดีบักการส่ง/รับของ Signal
summary: การรองรับ Signal ผ่าน signal-cli (JSON-RPC + SSE), พาธการตั้งค่า และโมเดลหมายเลข
title: Signal
x-i18n:
    generated_at: "2026-04-30T16:27:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111b6ebe3bde4e03c7ed432f52d663f0b471f0fc4a4bf835c1ac1972467e0b96
    source_path: channels/signal.md
    workflow: 16
---

สถานะ: การผสานรวม CLI ภายนอก Gateway คุยกับ `signal-cli` ผ่าน HTTP JSON-RPC + SSE

## ข้อกำหนดเบื้องต้น

- ติดตั้ง OpenClaw บนเซิร์ฟเวอร์ของคุณแล้ว (โฟลว์ Linux ด้านล่างทดสอบบน Ubuntu 24)
- มี `signal-cli` บนโฮสต์ที่ Gateway ทำงานอยู่
- หมายเลขโทรศัพท์ที่รับ SMS ยืนยันได้หนึ่งครั้ง (สำหรับเส้นทางการลงทะเบียนด้วย SMS)
- สิทธิ์เข้าถึงเบราว์เซอร์สำหรับ Signal captcha (`signalcaptchas.org`) ระหว่างการลงทะเบียน

## การตั้งค่าอย่างรวดเร็ว (ผู้เริ่มต้น)

1. ใช้ **หมายเลข Signal แยกต่างหาก** สำหรับบอต (แนะนำ)
2. ติดตั้ง `signal-cli` (ต้องใช้ Java หากคุณใช้บิลด์ JVM)
3. เลือกเส้นทางการตั้งค่าหนึ่งแบบ:
   - **เส้นทาง A (ลิงก์ QR):** `signal-cli link -n "OpenClaw"` แล้วสแกนด้วย Signal
   - **เส้นทาง B (ลงทะเบียนด้วย SMS):** ลงทะเบียนหมายเลขเฉพาะด้วย captcha + การยืนยันทาง SMS
4. กำหนดค่า OpenClaw และรีสตาร์ท Gateway
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
| `account`   | หมายเลขโทรศัพท์บอตในรูปแบบ E.164 (`+15551234567`) |
| `cliPath`   | พาธไปยัง `signal-cli` (`signal-cli` หากอยู่บน `PATH`)  |
| `dmPolicy`  | นโยบายการเข้าถึง DM (แนะนำ `pairing`)          |
| `allowFrom` | หมายเลขโทรศัพท์หรือค่า `uuid:<id>` ที่อนุญาตให้ DM |

## คืออะไร

- ช่องทาง Signal ผ่าน `signal-cli` (ไม่ใช่ libsignal แบบฝัง)
- การกำหนดเส้นทางแบบกำหนดได้แน่นอน: คำตอบจะกลับไปที่ Signal เสมอ
- DM ใช้เซสชันหลักของเอเจนต์ร่วมกัน; กลุ่มจะแยกออกจากกัน (`agent:<agentId>:signal:group:<groupId>`)

## การเขียนการกำหนดค่า

โดยค่าเริ่มต้น Signal ได้รับอนุญาตให้เขียนการอัปเดตการกำหนดค่าที่ถูกทริกเกอร์โดย `/config set|unset` (ต้องมี `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## โมเดลหมายเลข (สำคัญ)

- Gateway เชื่อมต่อกับ **อุปกรณ์ Signal** (บัญชี `signal-cli`)
- หากคุณรันบอตบน **บัญชี Signal ส่วนตัวของคุณ** บอตจะไม่สนใจข้อความของคุณเอง (การป้องกันลูป)
- สำหรับ "ฉันส่งข้อความหาบอตแล้วบอตตอบกลับ" ให้ใช้ **หมายเลขบอตแยกต่างหาก**

## เส้นทางการตั้งค่า A: ลิงก์บัญชี Signal ที่มีอยู่ (QR)

1. ติดตั้ง `signal-cli` (บิลด์ JVM หรือ native)
2. ลิงก์บัญชีบอต:
   - `signal-cli link -n "OpenClaw"` แล้วสแกน QR ใน Signal
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

การรองรับหลายบัญชี: ใช้ `channels.signal.accounts` พร้อมการกำหนดค่าต่อบัญชีและ `name` แบบไม่บังคับ ดู [`gateway/configuration`](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบที่ใช้ร่วมกัน

## เส้นทางการตั้งค่า B: ลงทะเบียนหมายเลขบอตเฉพาะ (SMS, Linux)

ใช้วิธีนี้เมื่อคุณต้องการหมายเลขบอตเฉพาะแทนการลิงก์บัญชีแอป Signal ที่มีอยู่

1. รับหมายเลขที่สามารถรับ SMS ได้ (หรือการยืนยันด้วยเสียงสำหรับโทรศัพท์บ้าน)
   - ใช้หมายเลขบอตเฉพาะเพื่อหลีกเลี่ยงข้อขัดแย้งของบัญชี/เซสชัน
2. ติดตั้ง `signal-cli` บนโฮสต์ Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

หากคุณใช้บิลด์ JVM (`signal-cli-${VERSION}.tar.gz`) ให้ติดตั้ง JRE 25+ ก่อน
อัปเดต `signal-cli` ให้ทันสมัยอยู่เสมอ; ต้นทางระบุว่ารีลีสเก่าอาจหยุดทำงานเมื่อ API ของเซิร์ฟเวอร์ Signal เปลี่ยนแปลง

3. ลงทะเบียนและยืนยันหมายเลข:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

หากจำเป็นต้องใช้ captcha:

1. เปิด `https://signalcaptchas.org/registration/generate.html`
2. ทำ captcha ให้เสร็จ แล้วคัดลอกเป้าหมายลิงก์ `signalcaptcha://...` จาก "Open Signal"
3. รันจาก IP ภายนอกเดียวกับเซสชันเบราว์เซอร์เมื่อทำได้
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
   - อนุมัติโค้ดบนเซิร์ฟเวอร์: `openclaw pairing approve signal <PAIRING_CODE>`
   - บันทึกหมายเลขบอตเป็นรายชื่อติดต่อบนโทรศัพท์ของคุณเพื่อหลีกเลี่ยง "Unknown contact"

<Warning>
การลงทะเบียนบัญชีหมายเลขโทรศัพท์ด้วย `signal-cli` อาจยกเลิกการตรวจสอบสิทธิ์เซสชันแอป Signal หลักสำหรับหมายเลขนั้น ควรใช้หมายเลขบอตเฉพาะ หรือใช้โหมดลิงก์ QR หากคุณต้องการคงการตั้งค่าแอปโทรศัพท์ที่มีอยู่ไว้
</Warning>

อ้างอิงจากต้นทาง:

- README ของ `signal-cli`: `https://github.com/AsamK/signal-cli`
- โฟลว์ Captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- โฟลว์การลิงก์: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## โหมดดีมอนภายนอก (httpUrl)

หากคุณต้องการจัดการ `signal-cli` ด้วยตัวเอง (การเริ่ม JVM แบบ cold start ช้า, การเริ่มต้นคอนเทนเนอร์, หรือ CPU ที่ใช้ร่วมกัน) ให้รันดีมอนแยกต่างหากและชี้ OpenClaw ไปที่ดีมอนนั้น:

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

วิธีนี้จะข้ามการ spawn อัตโนมัติและการรอเริ่มต้นภายใน OpenClaw สำหรับการเริ่มต้นช้าเมื่อ spawn อัตโนมัติ ให้ตั้งค่า `channels.signal.startupTimeoutMs`

## การควบคุมการเข้าถึง (DM + กลุ่ม)

DM:

- ค่าเริ่มต้น: `channels.signal.dmPolicy = "pairing"`
- ผู้ส่งที่ไม่รู้จักจะได้รับโค้ดจับคู่; ข้อความจะถูกละเว้นจนกว่าจะอนุมัติ (โค้ดหมดอายุหลังจาก 1 ชั่วโมง)
- อนุมัติผ่าน:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- การจับคู่คือการแลกเปลี่ยนโทเคนเริ่มต้นสำหรับ Signal DM รายละเอียด: [การจับคู่](/th/channels/pairing)
- ผู้ส่งแบบ UUID เท่านั้น (จาก `sourceUuid`) จะถูกจัดเก็บเป็น `uuid:<id>` ใน `channels.signal.allowFrom`

กลุ่ม:

- `channels.signal.groupPolicy = open | allowlist | disabled`
- `channels.signal.groupAllowFrom` ควบคุมว่ากลุ่มหรือผู้ส่งใดสามารถทริกเกอร์การตอบกลับกลุ่มเมื่อกำหนด `allowlist`; รายการสามารถเป็น ID กลุ่ม Signal (ดิบ, `group:<id>`, หรือ `signal:group:<id>`), หมายเลขโทรศัพท์ผู้ส่ง, ค่า `uuid:<id>`, หรือ `*`
- `channels.signal.groups["<group-id>" | "*"]` สามารถแทนที่พฤติกรรมของกลุ่มด้วย `requireMention`, `tools`, และ `toolsBySender`
- ใช้ `channels.signal.accounts.<id>.groups` สำหรับการแทนที่ต่อบัญชีในการตั้งค่าหลายบัญชี
- การใส่กลุ่ม Signal ในรายการอนุญาตผ่าน `groupAllowFrom` ไม่ได้ปิดการกั้นด้วยการกล่าวถึงโดยตัวมันเอง รายการ `channels.signal.groups["<group-id>"]` ที่กำหนดค่าไว้เฉพาะจะประมวลผลทุกข้อความกลุ่ม เว้นแต่จะตั้งค่า `requireMention=true`
- หมายเหตุรันไทม์: หาก `channels.signal` หายไปทั้งหมด รันไทม์จะถอยกลับไปใช้ `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้ว่าจะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

## วิธีทำงาน (พฤติกรรม)

- `signal-cli` ทำงานเป็นดีมอน; Gateway อ่านเหตุการณ์ผ่าน SSE
- ข้อความขาเข้าถูกทำให้เป็นมาตรฐานเป็น envelope ช่องทางที่ใช้ร่วมกัน
- คำตอบจะถูกกำหนดเส้นทางกลับไปยังหมายเลขหรือกลุ่มเดียวกันเสมอ

## สื่อ + ขีดจำกัด

- ข้อความขาออกถูกแบ่งเป็นส่วนตาม `channels.signal.textChunkLimit` (ค่าเริ่มต้น 4000)
- การแบ่งส่วนตามบรรทัดใหม่แบบไม่บังคับ: ตั้งค่า `channels.signal.chunkMode="newline"` เพื่อแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- รองรับไฟล์แนบ (ดึง base64 จาก `signal-cli`)
- ไฟล์แนบโน้ตเสียงใช้ชื่อไฟล์ของ `signal-cli` เป็น MIME fallback เมื่อ `contentType` หายไป ดังนั้นการถอดเสียงเสียงยังสามารถจำแนกบันทึกเสียง AAC ได้
- เพดานสื่อเริ่มต้น: `channels.signal.mediaMaxMb` (ค่าเริ่มต้น 8)
- ใช้ `channels.signal.ignoreAttachments` เพื่อข้ามการดาวน์โหลดสื่อ
- บริบทประวัติกลุ่มใช้ `channels.signal.historyLimit` (หรือ `channels.signal.accounts.*.historyLimit`) โดยถอยกลับไปใช้ `messages.groupChat.historyLimit` ตั้งค่า `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)

## การพิมพ์ + ใบตอบรับการอ่าน

- **ตัวบ่งชี้การพิมพ์**: OpenClaw ส่งสัญญาณการพิมพ์ผ่าน `signal-cli sendTyping` และรีเฟรชระหว่างที่คำตอบกำลังทำงาน
- **ใบตอบรับการอ่าน**: เมื่อ `channels.signal.sendReadReceipts` เป็น true, OpenClaw จะส่งต่อใบตอบรับการอ่านสำหรับ DM ที่ได้รับอนุญาต
- Signal-cli ไม่เปิดเผยใบตอบรับการอ่านสำหรับกลุ่ม

## ปฏิกิริยา (เครื่องมือข้อความ)

- ใช้ `message action=react` พร้อม `channel=signal`
- เป้าหมาย: E.164 ของผู้ส่งหรือ UUID (ใช้ `uuid:<id>` จากเอาต์พุตการจับคู่; UUID เปล่าก็ใช้ได้เช่นกัน)
- `messageId` คือ timestamp ของ Signal สำหรับข้อความที่คุณกำลังตอบสนอง
- ปฏิกิริยาของกลุ่มต้องใช้ `targetAuthor` หรือ `targetAuthorUuid`

ตัวอย่าง:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

การกำหนดค่า:

- `channels.signal.actions.reactions`: เปิด/ปิดการทำงานปฏิกิริยา (ค่าเริ่มต้น true)
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`
  - `off`/`ack` ปิดปฏิกิริยาของเอเจนต์ (เครื่องมือข้อความ `react` จะเกิดข้อผิดพลาด)
  - `minimal`/`extensive` เปิดปฏิกิริยาของเอเจนต์และตั้งค่าระดับคำแนะนำ
- การแทนที่ต่อบัญชี: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`

## เป้าหมายการส่ง (CLI/cron)

- DM: `signal:+15551234567` (หรือ E.164 แบบธรรมดา)
- DM แบบ UUID: `uuid:<id>` (หรือ UUID เปล่า)
- กลุ่ม: `signal:group:<groupId>`
- ชื่อผู้ใช้: `username:<name>` (หากบัญชี Signal ของคุณรองรับ)

## การแก้ไขปัญหา

รันลำดับนี้ก่อน:

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

- ดีมอนเข้าถึงได้แต่ไม่มีคำตอบ: ตรวจสอบการตั้งค่าบัญชี/ดีมอน (`httpUrl`, `account`) และโหมดรับ
- DM ถูกละเว้น: ผู้ส่งรอการอนุมัติการจับคู่
- ข้อความกลุ่มถูกละเว้น: การกั้นผู้ส่งกลุ่ม/การกล่าวถึงบล็อกการส่ง
- ข้อผิดพลาดการตรวจสอบการกำหนดค่าหลังแก้ไข: รัน `openclaw doctor --fix`
- Signal หายไปจากการวินิจฉัย: ยืนยัน `channels.signal.enabled: true`

การตรวจสอบเพิ่มเติม:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

สำหรับโฟลว์คัดแยก: [/channels/troubleshooting](/th/channels/troubleshooting)

## หมายเหตุด้านความปลอดภัย

- `signal-cli` จัดเก็บคีย์บัญชีไว้ในเครื่อง (โดยทั่วไปคือ `~/.local/share/signal-cli/data/`)
- สำรองสถานะบัญชี Signal ก่อนย้ายหรือสร้างเซิร์ฟเวอร์ใหม่
- คง `channels.signal.dmPolicy: "pairing"` ไว้ เว้นแต่คุณต้องการการเข้าถึง DM ที่กว้างขึ้นอย่างชัดเจน
- การยืนยันทาง SMS จำเป็นเฉพาะสำหรับโฟลว์การลงทะเบียนหรือการกู้คืน แต่การสูญเสียการควบคุมหมายเลข/บัญชีอาจทำให้การลงทะเบียนใหม่ซับซ้อนขึ้น

## อ้างอิงการกำหนดค่า (Signal)

การกำหนดค่าแบบเต็ม: [การกำหนดค่า](/th/gateway/configuration)

ตัวเลือกผู้ให้บริการ:

- `channels.signal.enabled`: เปิด/ปิดการเริ่มต้นช่องทาง
- `channels.signal.account`: E.164 สำหรับบัญชีบอต
- `channels.signal.cliPath`: พาธไปยัง `signal-cli`
- `channels.signal.httpUrl`: URL เต็มของดีมอน (แทนที่ host/port)
- `channels.signal.httpHost`, `channels.signal.httpPort`: การผูกดีมอน (ค่าเริ่มต้น 127.0.0.1:8080)
- `channels.signal.autoStart`: สร้างดีมอนอัตโนมัติ (ค่าเริ่มต้นเป็น true หากไม่ได้ตั้งค่า `httpUrl`)
- `channels.signal.startupTimeoutMs`: เวลาหมดอายุสำหรับรอการเริ่มต้นเป็น ms (เพดาน 120000)
- `channels.signal.receiveMode`: `on-start | manual`
- `channels.signal.ignoreAttachments`: ข้ามการดาวน์โหลดไฟล์แนบ
- `channels.signal.ignoreStories`: ไม่สนใจสตอรีจากดีมอน
- `channels.signal.sendReadReceipts`: ส่งต่อใบตอบรับการอ่าน
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.signal.allowFrom`: รายการอนุญาต DM (E.164 หรือ `uuid:<id>`) `open` ต้องใช้ `"*"` Signal ไม่มีชื่อผู้ใช้ ให้ใช้รหัสโทรศัพท์/UUID
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: allowlist)
- `channels.signal.groupAllowFrom`: รายการอนุญาตของกลุ่ม; รับ ID กลุ่ม Signal (แบบดิบ, `group:<id>` หรือ `signal:group:<id>`), หมายเลข E.164 ของผู้ส่ง หรือค่า `uuid:<id>`
- `channels.signal.groups`: การแทนที่รายกลุ่มที่ระบุคีย์ด้วย ID กลุ่ม Signal (หรือ `"*"`) ฟิลด์ที่รองรับ: `requireMention`, `tools`, `toolsBySender`
- `channels.signal.accounts.<id>.groups`: เวอร์ชันรายบัญชีของ `channels.signal.groups` สำหรับการตั้งค่าหลายบัญชี
- `channels.signal.historyLimit`: จำนวนข้อความกลุ่มสูงสุดที่จะรวมเป็นบริบท (0 ปิดใช้งาน)
- `channels.signal.dmHistoryLimit`: ขีดจำกัดประวัติ DM เป็นรอบของผู้ใช้ การแทนที่รายผู้ใช้: `channels.signal.dms["<phone_or_uuid>"].historyLimit`
- `channels.signal.textChunkLimit`: ขนาดส่วนข้อความขาออก (อักขระ)
- `channels.signal.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแยกตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งส่วนตามความยาว
- `channels.signal.mediaMaxMb`: เพดานสื่อขาเข้า/ขาออก (MB)

ตัวเลือกส่วนกลางที่เกี่ยวข้อง:

- `agents.list[].groupChat.mentionPatterns` (Signal ไม่รองรับการกล่าวถึงแบบเนทีฟ)
- `messages.groupChat.mentionPatterns` (ตัวสำรองส่วนกลาง)
- `messages.responsePrefix`

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — ลักษณะการทำงานของแชทกลุ่มและการควบคุมผ่านการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
