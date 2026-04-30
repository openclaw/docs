---
read_when:
    - การตั้งค่าการรองรับ Signal
    - การดีบักการส่ง/รับ Signal
summary: การรองรับ Signal ผ่าน signal-cli (JSON-RPC + SSE), พาธการตั้งค่า และโมเดลหมายเลข
title: Signal
x-i18n:
    generated_at: "2026-04-30T09:39:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: d450454550a86cbf0e2b7231bb149f78275a756517db1f20d7a07e3d298febee
    source_path: channels/signal.md
    workflow: 16
---

สถานะ: การผสานรวม CLI ภายนอก Gateway สื่อสารกับ `signal-cli` ผ่าน HTTP JSON-RPC + SSE

## ข้อกำหนดเบื้องต้น

- ติดตั้ง OpenClaw บนเซิร์ฟเวอร์ของคุณแล้ว (ขั้นตอนสำหรับ Linux ด้านล่างทดสอบบน Ubuntu 24)
- มี `signal-cli` บนโฮสต์ที่ Gateway ทำงานอยู่
- หมายเลขโทรศัพท์ที่รับ SMS ยืนยันได้หนึ่งครั้ง (สำหรับเส้นทางลงทะเบียนด้วย SMS)
- การเข้าถึงเบราว์เซอร์สำหรับ captcha ของ Signal (`signalcaptchas.org`) ระหว่างการลงทะเบียน

## ตั้งค่าอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ใช้ **หมายเลข Signal แยกต่างหาก** สำหรับบอท (แนะนำ)
2. ติดตั้ง `signal-cli` (ต้องใช้ Java หากคุณใช้บิลด์ JVM)
3. เลือกเส้นทางการตั้งค่าหนึ่งแบบ:
   - **เส้นทาง A (ลิงก์ QR):** `signal-cli link -n "OpenClaw"` แล้วสแกนด้วย Signal
   - **เส้นทาง B (ลงทะเบียนด้วย SMS):** ลงทะเบียนหมายเลขเฉพาะด้วย captcha + การยืนยัน SMS
4. กำหนดค่า OpenClaw และรีสตาร์ท Gateway
5. ส่ง DM แรกและอนุมัติการจับคู่ (`openclaw pairing approve signal <CODE>`)

ค่ากำหนดขั้นต่ำ:

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
| `account`   | หมายเลขโทรศัพท์ของบอทในรูปแบบ E.164 (`+15551234567`) |
| `cliPath`   | พาธไปยัง `signal-cli` (`signal-cli` หากอยู่ใน `PATH`)  |
| `dmPolicy`  | นโยบายการเข้าถึง DM (แนะนำ `pairing`)          |
| `allowFrom` | หมายเลขโทรศัพท์หรือค่า `uuid:<id>` ที่อนุญาตให้ส่ง DM |

## คืออะไร

- ช่องทาง Signal ผ่าน `signal-cli` (ไม่ใช่ libsignal แบบฝังในตัว)
- การกำหนดเส้นทางแบบกำหนดแน่นอน: การตอบกลับจะกลับไปที่ Signal เสมอ
- DM ใช้เซสชันหลักของเอเจนต์ร่วมกัน; กลุ่มจะแยกออกจากกัน (`agent:<agentId>:signal:group:<groupId>`)

## การเขียนค่ากำหนด

โดยค่าเริ่มต้น Signal ได้รับอนุญาตให้เขียนการอัปเดตค่ากำหนดที่เรียกจาก `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## โมเดลหมายเลข (สำคัญ)

- Gateway เชื่อมต่อกับ **อุปกรณ์ Signal** (บัญชี `signal-cli`)
- หากคุณรันบอทบน **บัญชี Signal ส่วนตัวของคุณ** บอทจะละเว้นข้อความของคุณเอง (การป้องกันลูป)
- สำหรับ "ฉันส่งข้อความหาบอทแล้วให้บอทตอบกลับ" ให้ใช้ **หมายเลขบอทแยกต่างหาก**

## เส้นทางการตั้งค่า A: ลิงก์บัญชี Signal ที่มีอยู่ (QR)

1. ติดตั้ง `signal-cli` (บิลด์ JVM หรือ native)
2. ลิงก์บัญชีบอท:
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

การรองรับหลายบัญชี: ใช้ `channels.signal.accounts` พร้อมค่ากำหนดรายบัญชีและ `name` ที่ไม่บังคับ ดู [`gateway/configuration`](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบที่ใช้ร่วมกัน

## เส้นทางการตั้งค่า B: ลงทะเบียนหมายเลขบอทเฉพาะ (SMS, Linux)

ใช้วิธีนี้เมื่อคุณต้องการหมายเลขบอทเฉพาะแทนการลิงก์บัญชีแอป Signal ที่มีอยู่

1. รับหมายเลขที่สามารถรับ SMS ได้ (หรือการยืนยันด้วยเสียงสำหรับโทรศัพท์พื้นฐาน)
   - ใช้หมายเลขบอทเฉพาะเพื่อหลีกเลี่ยงความขัดแย้งของบัญชี/เซสชัน
2. ติดตั้ง `signal-cli` บนโฮสต์ Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

หากคุณใช้บิลด์ JVM (`signal-cli-${VERSION}.tar.gz`) ให้ติดตั้ง JRE 25+ ก่อน
อัปเดต `signal-cli` ให้เป็นปัจจุบันเสมอ; upstream ระบุว่ารีลีสเก่าอาจหยุดทำงานเมื่อ API ของเซิร์ฟเวอร์ Signal เปลี่ยนแปลง

3. ลงทะเบียนและยืนยันหมายเลข:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

หากต้องใช้ captcha:

1. เปิด `https://signalcaptchas.org/registration/generate.html`
2. ทำ captcha ให้เสร็จ คัดลอกเป้าหมายลิงก์ `signalcaptcha://...` จาก "Open Signal"
3. รันจาก IP ภายนอกเดียวกับเซสชันเบราว์เซอร์เมื่อเป็นไปได้
4. รันการลงทะเบียนอีกครั้งทันที (โทเค็น captcha หมดอายุเร็ว):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. กำหนดค่า OpenClaw รีสตาร์ท Gateway และตรวจสอบช่องทาง:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. จับคู่ผู้ส่ง DM ของคุณ:
   - ส่งข้อความใดก็ได้ไปยังหมายเลขบอท
   - อนุมัติโค้ดบนเซิร์ฟเวอร์: `openclaw pairing approve signal <PAIRING_CODE>`
   - บันทึกหมายเลขบอทเป็นรายชื่อติดต่อในโทรศัพท์ของคุณเพื่อหลีกเลี่ยง "Unknown contact"

<Warning>
การลงทะเบียนบัญชีหมายเลขโทรศัพท์ด้วย `signal-cli` อาจทำให้เซสชันแอป Signal หลักของหมายเลขนั้นถูกยกเลิกการยืนยันตัวตน ควรใช้หมายเลขบอทเฉพาะ หรือใช้โหมดลิงก์ QR หากคุณต้องการคงการตั้งค่าแอปโทรศัพท์ที่มีอยู่ไว้
</Warning>

ข้อมูลอ้างอิง upstream:

- README ของ `signal-cli`: `https://github.com/AsamK/signal-cli`
- ขั้นตอน captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- ขั้นตอนการลิงก์: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## โหมด daemon ภายนอก (httpUrl)

หากคุณต้องการจัดการ `signal-cli` ด้วยตัวเอง (การเริ่มต้นแบบ cold start ของ JVM ที่ช้า, การ init คอนเทนเนอร์, หรือ CPU ที่ใช้ร่วมกัน) ให้รัน daemon แยกต่างหากแล้วชี้ OpenClaw ไปที่ daemon นั้น:

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

วิธีนี้จะข้ามการ auto-spawn และการรอเริ่มต้นภายใน OpenClaw สำหรับการเริ่มต้นที่ช้าเมื่อ auto-spawn ให้ตั้งค่า `channels.signal.startupTimeoutMs`

## การควบคุมการเข้าถึง (DM + กลุ่ม)

DM:

- ค่าเริ่มต้น: `channels.signal.dmPolicy = "pairing"`
- ผู้ส่งที่ไม่รู้จักจะได้รับโค้ดจับคู่; ข้อความจะถูกละเว้นจนกว่าจะอนุมัติ (โค้ดหมดอายุหลัง 1 ชั่วโมง)
- อนุมัติผ่าน:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- การจับคู่คือการแลกเปลี่ยนโทเค็นเริ่มต้นสำหรับ Signal DM รายละเอียด: [การจับคู่](/th/channels/pairing)
- ผู้ส่งแบบ UUID เท่านั้น (จาก `sourceUuid`) จะถูกจัดเก็บเป็น `uuid:<id>` ใน `channels.signal.allowFrom`

กลุ่ม:

- `channels.signal.groupPolicy = open | allowlist | disabled`
- `channels.signal.groupAllowFrom` ควบคุมว่าใครสามารถเรียกใช้งานในกลุ่มได้เมื่อกำหนด `allowlist`
- `channels.signal.groups["<group-id>" | "*"]` สามารถ override พฤติกรรมของกลุ่มด้วย `requireMention`, `tools`, และ `toolsBySender`
- ใช้ `channels.signal.accounts.<id>.groups` สำหรับ override รายบัญชีในการตั้งค่าหลายบัญชี
- หมายเหตุรันไทม์: หาก `channels.signal` หายไปทั้งหมด รันไทม์จะ fallback เป็น `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้งค่า `channels.defaults.groupPolicy` แล้วก็ตาม)

## วิธีทำงาน (พฤติกรรม)

- `signal-cli` ทำงานเป็น daemon; Gateway อ่านเหตุการณ์ผ่าน SSE
- ข้อความขาเข้าจะถูก normalize เป็น envelope ของช่องทางที่ใช้ร่วมกัน
- การตอบกลับจะกำหนดเส้นทางกลับไปยังหมายเลขหรือกลุ่มเดียวกันเสมอ

## สื่อ + ขีดจำกัด

- ข้อความขาออกจะถูกแบ่งเป็นชิ้นตาม `channels.signal.textChunkLimit` (ค่าเริ่มต้น 4000)
- การแบ่งตามบรรทัดใหม่ที่ไม่บังคับ: ตั้งค่า `channels.signal.chunkMode="newline"` เพื่อแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- รองรับไฟล์แนบ (ดึงเป็น base64 จาก `signal-cli`)
- ไฟล์แนบโน้ตเสียงใช้ชื่อไฟล์จาก `signal-cli` เป็น MIME fallback เมื่อไม่มี `contentType` เพื่อให้การถอดเสียงยังสามารถจำแนกบันทึกเสียง AAC ได้
- ขีดจำกัดสื่อเริ่มต้น: `channels.signal.mediaMaxMb` (ค่าเริ่มต้น 8)
- ใช้ `channels.signal.ignoreAttachments` เพื่อข้ามการดาวน์โหลดสื่อ
- บริบทประวัติกลุ่มใช้ `channels.signal.historyLimit` (หรือ `channels.signal.accounts.*.historyLimit`) โดย fallback ไปที่ `messages.groupChat.historyLimit` ตั้งค่า `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)

## การพิมพ์ + ใบตอบรับการอ่าน

- **ตัวบ่งชี้การพิมพ์**: OpenClaw ส่งสัญญาณการพิมพ์ผ่าน `signal-cli sendTyping` และรีเฟรชระหว่างที่การตอบกลับกำลังทำงาน
- **ใบตอบรับการอ่าน**: เมื่อ `channels.signal.sendReadReceipts` เป็น true, OpenClaw จะส่งต่อใบตอบรับการอ่านสำหรับ DM ที่อนุญาต
- Signal-cli ไม่เปิดเผยใบตอบรับการอ่านสำหรับกลุ่ม

## ปฏิกิริยา (เครื่องมือข้อความ)

- ใช้ `message action=react` กับ `channel=signal`
- เป้าหมาย: ผู้ส่ง E.164 หรือ UUID (ใช้ `uuid:<id>` จากผลลัพธ์การจับคู่; UUID แบบเปล่าก็ใช้ได้เช่นกัน)
- `messageId` คือ timestamp ของ Signal สำหรับข้อความที่คุณกำลังตอบสนอง
- ปฏิกิริยาในกลุ่มต้องใช้ `targetAuthor` หรือ `targetAuthorUuid`

ตัวอย่าง:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

ค่ากำหนด:

- `channels.signal.actions.reactions`: เปิด/ปิดการกระทำปฏิกิริยา (ค่าเริ่มต้น true)
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`
  - `off`/`ack` ปิดใช้งานปฏิกิริยาของเอเจนต์ (เครื่องมือข้อความ `react` จะเกิดข้อผิดพลาด)
  - `minimal`/`extensive` เปิดใช้งานปฏิกิริยาของเอเจนต์และกำหนดระดับคำแนะนำ
- override รายบัญชี: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`

## เป้าหมายการส่งมอบ (CLI/cron)

- DM: `signal:+15551234567` (หรือ E.164 แบบธรรมดา)
- UUID DM: `uuid:<id>` (หรือ UUID แบบเปล่า)
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

- เข้าถึง daemon ได้แต่ไม่มีการตอบกลับ: ตรวจสอบค่าบัญชี/daemon (`httpUrl`, `account`) และโหมดรับ
- DM ถูกละเว้น: ผู้ส่งกำลังรอการอนุมัติการจับคู่
- ข้อความกลุ่มถูกละเว้น: การกั้นตามผู้ส่ง/การกล่าวถึงของกลุ่มบล็อกการส่งมอบ
- ข้อผิดพลาดการตรวจสอบค่ากำหนดหลังแก้ไข: รัน `openclaw doctor --fix`
- Signal หายไปจากการวินิจฉัย: ยืนยัน `channels.signal.enabled: true`

การตรวจสอบเพิ่มเติม:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

สำหรับขั้นตอนการคัดแยกปัญหา: [/channels/troubleshooting](/th/channels/troubleshooting)

## หมายเหตุด้านความปลอดภัย

- `signal-cli` จัดเก็บคีย์บัญชีไว้ในเครื่อง (โดยทั่วไปคือ `~/.local/share/signal-cli/data/`)
- สำรองสถานะบัญชี Signal ก่อนย้ายเซิร์ฟเวอร์หรือสร้างใหม่
- คง `channels.signal.dmPolicy: "pairing"` ไว้ เว้นแต่คุณต้องการเข้าถึง DM ที่กว้างขึ้นอย่างชัดเจน
- การยืนยัน SMS จำเป็นเฉพาะสำหรับขั้นตอนการลงทะเบียนหรือการกู้คืน แต่การสูญเสียการควบคุมหมายเลข/บัญชีอาจทำให้การลงทะเบียนซ้ำซับซ้อนขึ้น

## ข้อมูลอ้างอิงค่ากำหนด (Signal)

ค่ากำหนดแบบเต็ม: [ค่ากำหนด](/th/gateway/configuration)

ตัวเลือกผู้ให้บริการ:

- `channels.signal.enabled`: เปิด/ปิดการเริ่มต้นช่องทาง.
- `channels.signal.account`: E.164 สำหรับบัญชีบอท.
- `channels.signal.cliPath`: พาธไปยัง `signal-cli`.
- `channels.signal.httpUrl`: URL daemon แบบเต็ม (แทนที่ host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: การ bind ของ daemon (ค่าเริ่มต้น 127.0.0.1:8080).
- `channels.signal.autoStart`: spawn daemon อัตโนมัติ (ค่าเริ่มต้นเป็น true หากไม่ได้ตั้งค่า `httpUrl`).
- `channels.signal.startupTimeoutMs`: เวลาหมดเวลาการรอเริ่มต้นเป็น ms (จำกัดสูงสุด 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: ข้ามการดาวน์โหลดไฟล์แนบ.
- `channels.signal.ignoreStories`: ละเว้น stories จาก daemon.
- `channels.signal.sendReadReceipts`: ส่งต่อใบตอบรับการอ่าน.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing).
- `channels.signal.allowFrom`: allowlist สำหรับ DM (E.164 หรือ `uuid:<id>`). `open` ต้องใช้ `"*"`. Signal ไม่มีชื่อผู้ใช้; ใช้รหัสโทรศัพท์/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: allowlist).
- `channels.signal.groupAllowFrom`: allowlist ผู้ส่งกลุ่ม.
- `channels.signal.groups`: การ override ต่อกลุ่ม โดยใช้ id กลุ่ม Signal เป็นคีย์ (หรือ `"*"`). ฟิลด์ที่รองรับ: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: เวอร์ชันต่อบัญชีของ `channels.signal.groups` สำหรับการตั้งค่าหลายบัญชี.
- `channels.signal.historyLimit`: จำนวนข้อความกลุ่มสูงสุดที่จะรวมเป็นบริบท (0 ปิดใช้งาน).
- `channels.signal.dmHistoryLimit`: ขีดจำกัดประวัติ DM ในจำนวนเทิร์นของผู้ใช้. การ override ต่อผู้ใช้: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: ขนาด chunk ขาออก (อักขระ).
- `channels.signal.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว.
- `channels.signal.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า/ขาออก (MB).

ตัวเลือกส่วนกลางที่เกี่ยวข้อง:

- `agents.list[].groupChat.mentionPatterns` (Signal ไม่รองรับการกล่าวถึงแบบ native).
- `messages.groupChat.mentionPatterns` (fallback ส่วนกลาง).
- `messages.responsePrefix`.

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเพิ่มความแข็งแกร่ง
