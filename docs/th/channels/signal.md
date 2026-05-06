---
read_when:
    - การตั้งค่าการรองรับ Signal
    - การดีบักการส่ง/รับ Signal
summary: การรองรับ Signal ผ่าน signal-cli (JSON-RPC + SSE), พาธการตั้งค่า และโมเดลหมายเลข
title: Signal
x-i18n:
    generated_at: "2026-05-06T09:03:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0290318ed0cda8f258a96da379b9774418fd888e1b78271a051c98b327a2f45
    source_path: channels/signal.md
    workflow: 16
---

สถานะ: การผสานรวม CLI ภายนอก Gateway สื่อสารกับ `signal-cli` ผ่าน HTTP JSON-RPC + SSE

## ข้อกำหนดเบื้องต้น

- ติดตั้ง OpenClaw บนเซิร์ฟเวอร์ของคุณแล้ว (ขั้นตอน Linux ด้านล่างทดสอบบน Ubuntu 24)
- มี `signal-cli` บนโฮสต์ที่ Gateway ทำงานอยู่
- หมายเลขโทรศัพท์ที่รับ SMS ยืนยันหนึ่งครั้งได้ (สำหรับเส้นทางการลงทะเบียนด้วย SMS)
- การเข้าถึงเบราว์เซอร์สำหรับ captcha ของ Signal (`signalcaptchas.org`) ระหว่างการลงทะเบียน

## การตั้งค่าอย่างรวดเร็ว (ผู้เริ่มต้น)

1. ใช้ **หมายเลข Signal แยกต่างหาก** สำหรับบอต (แนะนำ)
2. ติดตั้ง `signal-cli` (ต้องใช้ Java หากคุณใช้บิลด์ JVM)
3. เลือกเส้นทางการตั้งค่าหนึ่งแบบ:
   - **เส้นทาง A (ลิงก์ QR):** `signal-cli link -n "OpenClaw"` แล้วสแกนด้วย Signal
   - **เส้นทาง B (ลงทะเบียนด้วย SMS):** ลงทะเบียนหมายเลขเฉพาะด้วย captcha + การยืนยัน SMS
4. กำหนดค่า OpenClaw แล้วรีสตาร์ท Gateway
5. ส่งข้อความส่วนตัวแรกและอนุมัติการจับคู่ (`openclaw pairing approve signal <CODE>`)

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

ข้อมูลอ้างอิงฟิลด์:

| ฟิลด์       | คำอธิบาย                                       |
| ----------- | ------------------------------------------------- |
| `account`   | หมายเลขโทรศัพท์ของบอตในรูปแบบ E.164 (`+15551234567`) |
| `cliPath`   | พาธไปยัง `signal-cli` (`signal-cli` หากอยู่ใน `PATH`)  |
| `dmPolicy`  | นโยบายการเข้าถึงข้อความส่วนตัว (แนะนำ `pairing`)          |
| `allowFrom` | หมายเลขโทรศัพท์หรือค่า `uuid:<id>` ที่ได้รับอนุญาตให้ส่งข้อความส่วนตัว |

## สิ่งนี้คืออะไร

- ช่องทาง Signal ผ่าน `signal-cli` (ไม่ใช่ libsignal แบบฝัง)
- การกำหนดเส้นทางแบบกำหนดแน่นอน: คำตอบจะกลับไปที่ Signal เสมอ
- ข้อความส่วนตัวใช้เซสชันหลักของ agent ร่วมกัน; กลุ่มถูกแยกออก (`agent:<agentId>:signal:group:<groupId>`)

## การเขียนการกำหนดค่า

โดยค่าเริ่มต้น Signal ได้รับอนุญาตให้เขียนการอัปเดตการกำหนดค่าที่ทริกเกอร์โดย `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## โมเดลหมายเลข (สำคัญ)

- Gateway เชื่อมต่อกับ **อุปกรณ์ Signal** (บัญชี `signal-cli`)
- หากคุณรันบอตบน **บัญชี Signal ส่วนตัวของคุณ** บอตจะเพิกเฉยต่อข้อความของคุณเอง (การป้องกันลูป)
- สำหรับ "ฉันส่งข้อความหาบอตแล้วบอตตอบกลับ" ให้ใช้ **หมายเลขบอตแยกต่างหาก**

## เส้นทางการตั้งค่า A: ลิงก์บัญชี Signal ที่มีอยู่ (QR)

1. ติดตั้ง `signal-cli` (บิลด์ JVM หรือเนทีฟ)
2. ลิงก์บัญชีบอต:
   - `signal-cli link -n "OpenClaw"` แล้วสแกน QR ใน Signal
3. กำหนดค่า Signal แล้วเริ่ม Gateway

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

รองรับหลายบัญชี: ใช้ `channels.signal.accounts` พร้อมการกำหนดค่าต่อบัญชีและ `name` แบบไม่บังคับ ดู [`gateway/configuration`](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบที่ใช้ร่วมกัน

## เส้นทางการตั้งค่า B: ลงทะเบียนหมายเลขบอตเฉพาะ (SMS, Linux)

ใช้วิธีนี้เมื่อคุณต้องการหมายเลขบอตเฉพาะแทนการลิงก์บัญชีแอป Signal ที่มีอยู่

1. รับหมายเลขที่รับ SMS ได้ (หรือการยืนยันด้วยเสียงสำหรับโทรศัพท์บ้าน)
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
อัปเดต `signal-cli` ให้เป็นปัจจุบันเสมอ; ต้นทางระบุว่ารุ่นเก่าอาจหยุดทำงานเมื่อ API ของเซิร์ฟเวอร์ Signal เปลี่ยนแปลง

3. ลงทะเบียนและยืนยันหมายเลข:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

หากต้องใช้ captcha:

1. เปิด `https://signalcaptchas.org/registration/generate.html`
2. ทำ captcha ให้เสร็จ คัดลอกเป้าหมายลิงก์ `signalcaptcha://...` จาก "Open Signal"
3. รันจาก IP ภายนอกเดียวกับเซสชันเบราว์เซอร์เมื่อทำได้
4. รันการลงทะเบียนอีกครั้งทันที (โทเค็น captcha หมดอายุเร็ว):

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

5. จับคู่ผู้ส่งข้อความส่วนตัวของคุณ:
   - ส่งข้อความใดก็ได้ไปยังหมายเลขบอต
   - อนุมัติโค้ดบนเซิร์ฟเวอร์: `openclaw pairing approve signal <PAIRING_CODE>`
   - บันทึกหมายเลขบอตเป็นรายชื่อผู้ติดต่อในโทรศัพท์ของคุณเพื่อหลีกเลี่ยง "Unknown contact"

<Warning>
การลงทะเบียนบัญชีหมายเลขโทรศัพท์ด้วย `signal-cli` อาจทำให้เซสชันแอป Signal หลักสำหรับหมายเลขนั้นถูกยกเลิกการยืนยันตัวตน ควรใช้หมายเลขบอตเฉพาะ หรือใช้โหมดลิงก์ QR หากคุณต้องเก็บการตั้งค่าแอปโทรศัพท์ที่มีอยู่ไว้
</Warning>

ข้อมูลอ้างอิงต้นทาง:

- README ของ `signal-cli`: `https://github.com/AsamK/signal-cli`
- ขั้นตอน captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- ขั้นตอนการลิงก์: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## โหมด daemon ภายนอก (`httpUrl`)

หากคุณต้องการจัดการ `signal-cli` เอง (การเริ่มแบบ cold start ของ JVM ที่ช้า, init ของคอนเทนเนอร์, หรือ CPU ที่ใช้ร่วมกัน) ให้รัน daemon แยกต่างหากแล้วชี้ OpenClaw ไปที่ daemon นั้น:

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

วิธีนี้ข้ามการ spawn อัตโนมัติและการรอเริ่มต้นภายใน OpenClaw สำหรับการเริ่มที่ช้าเมื่อ spawn อัตโนมัติ ให้ตั้งค่า `channels.signal.startupTimeoutMs`

## การควบคุมการเข้าถึง (ข้อความส่วนตัว + กลุ่ม)

ข้อความส่วนตัว:

- ค่าเริ่มต้น: `channels.signal.dmPolicy = "pairing"`
- ผู้ส่งที่ไม่รู้จักจะได้รับโค้ดจับคู่; ข้อความจะถูกเพิกเฉยจนกว่าจะอนุมัติ (โค้ดหมดอายุหลัง 1 ชั่วโมง)
- อนุมัติผ่าน:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- การจับคู่เป็นการแลกเปลี่ยนโทเค็นเริ่มต้นสำหรับข้อความส่วนตัวของ Signal รายละเอียด: [การจับคู่](/th/channels/pairing)
- ผู้ส่งแบบ UUID เท่านั้น (จาก `sourceUuid`) จะถูกเก็บเป็น `uuid:<id>` ใน `channels.signal.allowFrom`

กลุ่ม:

- `channels.signal.groupPolicy = open | allowlist | disabled`
- `channels.signal.groupAllowFrom` ควบคุมว่ากลุ่มหรือผู้ส่งใดสามารถทริกเกอร์คำตอบในกลุ่มเมื่อมีการตั้งค่า `allowlist`; รายการสามารถเป็น ID กลุ่ม Signal (แบบดิบ, `group:<id>`, หรือ `signal:group:<id>`), หมายเลขโทรศัพท์ผู้ส่ง, ค่า `uuid:<id>`, หรือ `*`
- `channels.signal.groups["<group-id>" | "*"]` สามารถแทนที่พฤติกรรมกลุ่มด้วย `requireMention`, `tools`, และ `toolsBySender`
- ใช้ `channels.signal.accounts.<id>.groups` สำหรับการแทนที่ต่อบัญชีในการตั้งค่าหลายบัญชี
- การอนุญาตกลุ่ม Signal ผ่าน `groupAllowFrom` ไม่ได้ปิดใช้งานการกรองด้วยการกล่าวถึงโดยตัวมันเอง รายการ `channels.signal.groups["<group-id>"]` ที่กำหนดค่าเฉพาะจะประมวลผลทุกข้อความในกลุ่ม เว้นแต่จะตั้งค่า `requireMention=true`
- หมายเหตุรันไทม์: หากไม่มี `channels.signal` เลย รันไทม์จะย้อนกลับไปใช้ `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้ว่าจะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

## วิธีทำงาน (พฤติกรรม)

- `signal-cli` รันเป็น daemon; Gateway อ่านเหตุการณ์ผ่าน SSE
- ข้อความขาเข้าจะถูกปรับให้อยู่ในซองช่องทางที่ใช้ร่วมกัน
- คำตอบจะกำหนดเส้นทางกลับไปยังหมายเลขหรือกลุ่มเดียวกันเสมอ

## สื่อ + ขีดจำกัด

- ข้อความขาออกถูกแบ่งเป็นชิ้นตาม `channels.signal.textChunkLimit` (ค่าเริ่มต้น 4000)
- การแบ่งชิ้นตามบรรทัดใหม่แบบไม่บังคับ: ตั้งค่า `channels.signal.chunkMode="newline"` เพื่อแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- รองรับไฟล์แนบ (ดึงแบบ base64 จาก `signal-cli`)
- ไฟล์แนบโน้ตเสียงใช้ชื่อไฟล์ `signal-cli` เป็น MIME fallback เมื่อไม่มี `contentType` เพื่อให้การถอดเสียงยังจำแนก voice memo แบบ AAC ได้
- ขีดจำกัดสื่อเริ่มต้น: `channels.signal.mediaMaxMb` (ค่าเริ่มต้น 8)
- ใช้ `channels.signal.ignoreAttachments` เพื่อข้ามการดาวน์โหลดสื่อ
- บริบทประวัติกลุ่มใช้ `channels.signal.historyLimit` (หรือ `channels.signal.accounts.*.historyLimit`) โดยย้อนกลับไปใช้ `messages.groupChat.historyLimit` ตั้งค่า `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)

## การพิมพ์ + ใบตอบรับการอ่าน

- **ตัวบ่งชี้การพิมพ์**: OpenClaw ส่งสัญญาณการพิมพ์ผ่าน `signal-cli sendTyping` และรีเฟรชระหว่างที่คำตอบกำลังทำงาน
- **ใบตอบรับการอ่าน**: เมื่อ `channels.signal.sendReadReceipts` เป็น true, OpenClaw จะส่งต่อใบตอบรับการอ่านสำหรับข้อความส่วนตัวที่ได้รับอนุญาต
- Signal-cli ไม่เปิดเผยใบตอบรับการอ่านสำหรับกลุ่ม

## รีแอ็กชัน (เครื่องมือข้อความ)

- ใช้ `message action=react` พร้อม `channel=signal`
- เป้าหมาย: ผู้ส่ง E.164 หรือ UUID (ใช้ `uuid:<id>` จากเอาต์พุตการจับคู่; UUID แบบเปล่าก็ใช้ได้เช่นกัน)
- `messageId` คือ timestamp ของ Signal สำหรับข้อความที่คุณกำลังตอบสนอง
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
  - `off`/`ack` ปิดใช้งานรีแอ็กชันของ agent (เครื่องมือข้อความ `react` จะเกิดข้อผิดพลาด)
  - `minimal`/`extensive` เปิดใช้งานรีแอ็กชันของ agent และตั้งค่าระดับคำแนะนำ
- การแทนที่ต่อบัญชี: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`

## เป้าหมายการส่ง (CLI/cron)

- ข้อความส่วนตัว: `signal:+15551234567` (หรือ E.164 แบบธรรมดา)
- ข้อความส่วนตัว UUID: `uuid:<id>` (หรือ UUID แบบเปล่า)
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

จากนั้นยืนยันสถานะการจับคู่ข้อความส่วนตัวหากจำเป็น:

```bash
openclaw pairing list signal
```

ความล้มเหลวที่พบบ่อย:

- เข้าถึง daemon ได้แต่ไม่มีคำตอบ: ตรวจสอบการตั้งค่าบัญชี/daemon (`httpUrl`, `account`) และโหมดรับ
- ข้อความส่วนตัวถูกเพิกเฉย: ผู้ส่งกำลังรออนุมัติการจับคู่
- ข้อความกลุ่มถูกเพิกเฉย: การกรองผู้ส่ง/การกล่าวถึงของกลุ่มบล็อกการส่ง
- ข้อผิดพลาดการตรวจสอบการกำหนดค่าหลังแก้ไข: รัน `openclaw doctor --fix`
- Signal หายไปจากการวินิจฉัย: ยืนยัน `channels.signal.enabled: true`

การตรวจสอบเพิ่มเติม:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

สำหรับขั้นตอนคัดแยกปัญหา: [/channels/troubleshooting](/th/channels/troubleshooting)

## หมายเหตุด้านความปลอดภัย

- `signal-cli` เก็บคีย์บัญชีไว้ในเครื่อง (โดยทั่วไปคือ `~/.local/share/signal-cli/data/`)
- สำรองสถานะบัญชี Signal ก่อนย้ายหรือสร้างเซิร์ฟเวอร์ใหม่
- คง `channels.signal.dmPolicy: "pairing"` ไว้ เว้นแต่คุณต้องการการเข้าถึงข้อความส่วนตัวที่กว้างขึ้นอย่างชัดเจน
- การยืนยัน SMS จำเป็นเฉพาะสำหรับขั้นตอนการลงทะเบียนหรือการกู้คืน แต่การสูญเสียการควบคุมหมายเลข/บัญชีอาจทำให้การลงทะเบียนใหม่ซับซ้อนขึ้น

## ข้อมูลอ้างอิงการกำหนดค่า (Signal)

การกำหนดค่าแบบเต็ม: [การกำหนดค่า](/th/gateway/configuration)

ตัวเลือกผู้ให้บริการ:

- `channels.signal.enabled`: เปิด/ปิดการเริ่มต้นช่องทาง
- `channels.signal.account`: E.164 สำหรับบัญชีบอต
- `channels.signal.cliPath`: เส้นทางไปยัง `signal-cli`
- `channels.signal.httpUrl`: URL เดมอนแบบเต็ม (แทนที่โฮสต์/พอร์ต)
- `channels.signal.httpHost`, `channels.signal.httpPort`: การผูกเดมอน (ค่าเริ่มต้น 127.0.0.1:8080)
- `channels.signal.autoStart`: สร้างเดมอนอัตโนมัติ (ค่าเริ่มต้นเป็นจริงหากไม่ได้ตั้งค่า `httpUrl`)
- `channels.signal.startupTimeoutMs`: หมดเวลาการรอเริ่มต้นเป็นมิลลิวินาที (จำกัดสูงสุด 120000)
- `channels.signal.receiveMode`: `on-start | manual`
- `channels.signal.ignoreAttachments`: ข้ามการดาวน์โหลดไฟล์แนบ
- `channels.signal.ignoreStories`: ละเว้นเรื่องราวจากเดมอน
- `channels.signal.sendReadReceipts`: ส่งต่อใบตอบรับการอ่าน
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.signal.allowFrom`: รายการอนุญาตสำหรับข้อความส่วนตัว (E.164 หรือ `uuid:<id>`) `open` ต้องใช้ `"*"` Signal ไม่มีชื่อผู้ใช้ ให้ใช้รหัสโทรศัพท์/UUID
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: allowlist)
- `channels.signal.groupAllowFrom`: รายการอนุญาตของกลุ่ม; รับรหัสกลุ่ม Signal (แบบดิบ, `group:<id>` หรือ `signal:group:<id>`), หมายเลข E.164 ของผู้ส่ง หรือค่า `uuid:<id>`
- `channels.signal.groups`: การแทนที่รายกลุ่มที่ใช้รหัสกลุ่ม Signal (หรือ `"*"`) เป็นคีย์ ฟิลด์ที่รองรับ: `requireMention`, `tools`, `toolsBySender`
- `channels.signal.accounts.<id>.groups`: เวอร์ชันรายบัญชีของ `channels.signal.groups` สำหรับการตั้งค่าหลายบัญชี
- `channels.signal.historyLimit`: จำนวนข้อความกลุ่มสูงสุดที่จะรวมเป็นบริบท (0 ปิดใช้งาน)
- `channels.signal.dmHistoryLimit`: ขีดจำกัดประวัติข้อความส่วนตัวในจำนวนรอบผู้ใช้ การแทนที่รายผู้ใช้: `channels.signal.dms["<phone_or_uuid>"].historyLimit`
- `channels.signal.textChunkLimit`: ขนาดชิ้นส่วนขาออก (อักขระ)
- `channels.signal.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- `channels.signal.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า/ขาออก (MB)

ตัวเลือกส่วนกลางที่เกี่ยวข้อง:

- `agents.list[].groupChat.mentionPatterns` (Signal ไม่รองรับการกล่าวถึงแบบเนทีฟ)
- `messages.groupChat.mentionPatterns` (ทางเลือกสำรองส่วนกลาง)
- `messages.responsePrefix`

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนข้อความส่วนตัวและขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการกำหนดให้กล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเพิ่มความแข็งแกร่ง
