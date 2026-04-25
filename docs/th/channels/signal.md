---
read_when:
    - การตั้งค่าการรองรับ Signal
    - การดีบักการส่ง/รับของ Signal
summary: การรองรับ Signal ผ่าน signal-cli (JSON-RPC + SSE), เส้นทางการตั้งค่า และโมเดลหมายเลขโทรศัพท์
title: Signal
x-i18n:
    generated_at: "2026-04-25T13:42:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb1ff4328aae73576a78b00be3dd79e9768badfc6193843ed3c05439765ae295
    source_path: channels/signal.md
    workflow: 15
---

สถานะ: การเชื่อมต่อกับ CLI ภายนอก Gateway สื่อสารกับ `signal-cli` ผ่าน HTTP JSON-RPC + SSE

## ข้อกำหนดเบื้องต้น

- ติดตั้ง OpenClaw บนเซิร์ฟเวอร์ของคุณแล้ว (ขั้นตอนสำหรับ Linux ด้านล่างทดสอบบน Ubuntu 24)
- มี `signal-cli` พร้อมใช้งานบนโฮสต์ที่ Gateway ทำงานอยู่
- มีหมายเลขโทรศัพท์ที่สามารถรับ SMS ยืนยันได้หนึ่งครั้ง (สำหรับเส้นทางการลงทะเบียนผ่าน SMS)
- เข้าถึงเบราว์เซอร์สำหรับ Signal captcha (`signalcaptchas.org`) ระหว่างการลงทะเบียน

## การตั้งค่าแบบรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ใช้ **หมายเลข Signal แยกต่างหาก** สำหรับบอท (แนะนำ)
2. ติดตั้ง `signal-cli` (ต้องใช้ Java หากคุณใช้รุ่น JVM)
3. เลือกหนึ่งเส้นทางการตั้งค่า:
   - **เส้นทาง A (ลิงก์ด้วย QR):** `signal-cli link -n "OpenClaw"` แล้วสแกนด้วย Signal
   - **เส้นทาง B (ลงทะเบียนด้วย SMS):** ลงทะเบียนหมายเลขเฉพาะสำหรับบอทด้วย captcha + การยืนยันผ่าน SMS
4. กำหนดค่า OpenClaw แล้วรีสตาร์ต Gateway
5. ส่ง DM แรกและอนุมัติการจับคู่ (`openclaw pairing approve signal <CODE>`)

Config ขั้นต่ำ:

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

| ฟิลด์       | คำอธิบาย                                           |
| ----------- | -------------------------------------------------- |
| `account`   | หมายเลขโทรศัพท์ของบอทในรูปแบบ E.164 (`+15551234567`) |
| `cliPath`   | พาธไปยัง `signal-cli` (`signal-cli` หากอยู่บน `PATH`) |
| `dmPolicy`  | นโยบายการเข้าถึง DM (แนะนำให้ใช้ `pairing`)         |
| `allowFrom` | หมายเลขโทรศัพท์หรือค่า `uuid:<id>` ที่ได้รับอนุญาตให้ส่ง DM |

## มันคืออะไร

- ช่องทาง Signal ผ่าน `signal-cli` (ไม่ใช่ libsignal แบบฝัง)
- การกำหนดเส้นทางแบบกำหนดแน่นอน: การตอบกลับจะส่งกลับไปที่ Signal เสมอ
- DM ใช้เซสชันหลักของเอเจนต์ร่วมกัน; กลุ่มจะแยกออกจากกัน (`agent:<agentId>:signal:group:<groupId>`)

## การเขียน config

โดยค่าเริ่มต้น Signal ได้รับอนุญาตให้เขียนการอัปเดต config ที่ถูกกระตุ้นโดย `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## โมเดลหมายเลขโทรศัพท์ (สำคัญ)

- Gateway เชื่อมต่อกับ **อุปกรณ์ Signal** (บัญชี `signal-cli`)
- หากคุณรันบอทบน **บัญชี Signal ส่วนตัวของคุณเอง** ระบบจะไม่สนใจข้อความของคุณเอง (การป้องกันลูป)
- หากต้องการให้ "ฉันส่งข้อความหาบอทแล้วบอทตอบกลับ" ให้ใช้ **หมายเลขบอทแยกต่างหาก**

## เส้นทางการตั้งค่า A: ลิงก์บัญชี Signal ที่มีอยู่แล้ว (QR)

1. ติดตั้ง `signal-cli` (รุ่น JVM หรือ native build)
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

รองรับหลายบัญชี: ใช้ `channels.signal.accounts` พร้อม config แยกตามบัญชีและ `name` แบบไม่บังคับ ดู [`gateway/configuration`](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบที่ใช้ร่วมกัน

## เส้นทางการตั้งค่า B: ลงทะเบียนหมายเลขบอทเฉพาะ (SMS, Linux)

ใช้วิธีนี้เมื่อคุณต้องการหมายเลขบอทเฉพาะแทนการลิงก์บัญชีแอป Signal ที่มีอยู่

1. เตรียมหมายเลขที่รับ SMS ได้ (หรือการยืนยันด้วยเสียงสำหรับโทรศัพท์พื้นฐาน)
   - ใช้หมายเลขบอทเฉพาะเพื่อหลีกเลี่ยงความขัดแย้งของบัญชี/เซสชัน
2. ติดตั้ง `signal-cli` บนโฮสต์ของ Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

หากคุณใช้รุ่น JVM (`signal-cli-${VERSION}.tar.gz`) ให้ติดตั้ง JRE 25+ ก่อน
ควรอัปเดต `signal-cli` ให้ทันสมัยอยู่เสมอ; upstream ระบุว่ารีลีสเก่าอาจใช้งานไม่ได้เมื่อ API ฝั่งเซิร์ฟเวอร์ของ Signal เปลี่ยนแปลง

3. ลงทะเบียนและยืนยันหมายเลข:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

หากต้องใช้ captcha:

1. เปิด `https://signalcaptchas.org/registration/generate.html`
2. ทำ captcha ให้เสร็จ แล้วคัดลอกปลายทางลิงก์ `signalcaptcha://...` จาก "Open Signal"
3. ให้รันจาก IP ภายนอกเดียวกับเซสชันเบราว์เซอร์หากเป็นไปได้
4. รันการลงทะเบียนอีกครั้งทันที (โทเค็น captcha หมดอายุเร็ว):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. กำหนดค่า OpenClaw, รีสตาร์ต Gateway, และตรวจสอบช่องทาง:

```bash
# หากคุณรัน Gateway เป็นบริการ systemd ระดับผู้ใช้:
systemctl --user restart openclaw-gateway.service

# จากนั้นตรวจสอบ:
openclaw doctor
openclaw channels status --probe
```

5. จับคู่ผู้ส่ง DM ของคุณ:
   - ส่งข้อความใดก็ได้ไปยังหมายเลขบอท
   - อนุมัติรหัสบนเซิร์ฟเวอร์: `openclaw pairing approve signal <PAIRING_CODE>`
   - บันทึกหมายเลขบอทเป็นรายชื่อติดต่อบนโทรศัพท์ของคุณเพื่อหลีกเลี่ยง "Unknown contact"

สำคัญ: การลงทะเบียนบัญชีหมายเลขโทรศัพท์ด้วย `signal-cli` อาจทำให้เซสชันแอป Signal หลักของหมายเลขนั้นหลุดการยืนยันตัวตน ควรใช้หมายเลขบอทเฉพาะ หรือใช้โหมดลิงก์ด้วย QR หากคุณต้องการคงการตั้งค่าแอปบนโทรศัพท์ที่มีอยู่ไว้

ข้อมูลอ้างอิงจาก upstream:

- README ของ `signal-cli`: `https://github.com/AsamK/signal-cli`
- ขั้นตอน captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- ขั้นตอนการลิงก์: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## โหมด daemon ภายนอก (`httpUrl`)

หากคุณต้องการจัดการ `signal-cli` เอง (การเริ่มต้นแบบ cold start ของ JVM ที่ช้า, container init, หรือ CPU ที่ใช้ร่วมกัน) ให้รัน daemon แยกต่างหากแล้วชี้ OpenClaw ไปที่มัน:

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

วิธีนี้จะข้ามการ spawn อัตโนมัติและการรอช่วงเริ่มต้นภายใน OpenClaw สำหรับการเริ่มต้นช้าเมื่อใช้ auto-spawn ให้ตั้ง `channels.signal.startupTimeoutMs`

## การควบคุมการเข้าถึง (DM + กลุ่ม)

DM:

- ค่าเริ่มต้น: `channels.signal.dmPolicy = "pairing"`
- ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่; ข้อความจะถูกละเลยจนกว่าจะอนุมัติ (รหัสหมดอายุใน 1 ชั่วโมง)
- อนุมัติผ่าน:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pairing คือการแลกเปลี่ยนโทเค็นค่าเริ่มต้นสำหรับ Signal DM รายละเอียด: [Pairing](/th/channels/pairing)
- ผู้ส่งที่มีเฉพาะ UUID (จาก `sourceUuid`) จะถูกเก็บเป็น `uuid:<id>` ใน `channels.signal.allowFrom`

กลุ่ม:

- `channels.signal.groupPolicy = open | allowlist | disabled`
- `channels.signal.groupAllowFrom` ควบคุมว่าใครสามารถ trigger ในกลุ่มได้เมื่อใช้ `allowlist`
- `channels.signal.groups["<group-id>" | "*"]` สามารถ override พฤติกรรมของกลุ่มด้วย `requireMention`, `tools` และ `toolsBySender`
- ใช้ `channels.signal.accounts.<id>.groups` สำหรับการ override แยกตามบัญชีในชุดการตั้งค่าหลายบัญชี
- หมายเหตุด้าน runtime: หากไม่มี `channels.signal` เลย runtime จะ fallback ไปใช้ `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้ว่าจะตั้ง `channels.defaults.groupPolicy` ไว้ก็ตาม)

## วิธีการทำงาน (พฤติกรรม)

- `signal-cli` ทำงานเป็น daemon; Gateway อ่าน events ผ่าน SSE
- ข้อความขาเข้าจะถูกทำให้เป็นมาตรฐานเข้าสู่ channel envelope ที่ใช้ร่วมกัน
- การตอบกลับจะถูกกำหนดเส้นทางกลับไปยังหมายเลขหรือกลุ่มเดิมเสมอ

## สื่อ + ขีดจำกัด

- ข้อความขาออกจะถูกแบ่งเป็นช่วงตาม `channels.signal.textChunkLimit` (ค่าเริ่มต้น 4000)
- การแบ่งตามบรรทัดใหม่แบบเลือกได้: ตั้ง `channels.signal.chunkMode="newline"` เพื่อแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- รองรับไฟล์แนบ (ดึง base64 จาก `signal-cli`)
- ไฟล์แนบประเภท voice note ใช้ชื่อไฟล์จาก `signal-cli` เป็น MIME fallback เมื่อไม่มี `contentType` ดังนั้นการถอดเสียงยังสามารถจัดประเภท AAC voice memo ได้
- ขีดจำกัดสื่อค่าเริ่มต้น: `channels.signal.mediaMaxMb` (ค่าเริ่มต้น 8)
- ใช้ `channels.signal.ignoreAttachments` เพื่อข้ามการดาวน์โหลดสื่อ
- บริบทประวัติกลุ่มใช้ `channels.signal.historyLimit` (หรือ `channels.signal.accounts.*.historyLimit`) โดย fallback ไปใช้ `messages.groupChat.historyLimit` ตั้งค่าเป็น `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)

## การพิมพ์ + read receipts

- **ตัวแสดงสถานะการพิมพ์**: OpenClaw ส่งสัญญาณการพิมพ์ผ่าน `signal-cli sendTyping` และรีเฟรชสัญญาณขณะกำลังรันการตอบกลับ
- **Read receipts**: เมื่อ `channels.signal.sendReadReceipts` เป็น true OpenClaw จะส่งต่อ read receipts สำหรับ DM ที่ได้รับอนุญาต
- Signal-cli ไม่เปิดเผย read receipts สำหรับกลุ่ม

## Reactions (message tool)

- ใช้ `message action=react` กับ `channel=signal`
- เป้าหมาย: E.164 ของผู้ส่งหรือ UUID (ใช้ `uuid:<id>` จากผลลัพธ์ pairing; UUID เปล่าก็ใช้ได้เช่นกัน)
- `messageId` คือ timestamp ของ Signal สำหรับข้อความที่คุณกำลัง react
- reactions ในกลุ่มต้องใช้ `targetAuthor` หรือ `targetAuthorUuid`

ตัวอย่าง:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Config:

- `channels.signal.actions.reactions`: เปิด/ปิดการทำงานของ reaction (ค่าเริ่มต้น true)
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`
  - `off`/`ack` ปิด agent reactions (`react` ของ message tool จะ error)
  - `minimal`/`extensive` เปิด agent reactions และกำหนดระดับคำแนะนำ
- การ override แยกตามบัญชี: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`

## เป้าหมายการส่ง (CLI/cron)

- DM: `signal:+15551234567` (หรือ E.164 แบบปกติ)
- UUID DM: `uuid:<id>` (หรือ UUID แบบปกติ)
- กลุ่ม: `signal:group:<groupId>`
- ชื่อผู้ใช้: `username:<name>` (หากบัญชี Signal ของคุณรองรับ)

## การแก้ไขปัญหา

ให้รันลำดับนี้ก่อน:

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

ปัญหาที่พบบ่อย:

- เข้าถึง daemon ได้แต่ไม่มีการตอบกลับ: ตรวจสอบการตั้งค่าบัญชี/daemon (`httpUrl`, `account`) และโหมดการรับ
- DM ถูกละเลย: ผู้ส่งกำลังรอการอนุมัติ pairing
- ข้อความกลุ่มถูกละเลย: เงื่อนไขผู้ส่ง/mention ของกลุ่มบล็อกการส่งต่อ
- เกิดข้อผิดพลาด validation ของ config หลังแก้ไข: รัน `openclaw doctor --fix`
- ไม่มี Signal ในข้อมูลวินิจฉัย: ยืนยันว่า `channels.signal.enabled: true`

การตรวจสอบเพิ่มเติม:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

สำหรับขั้นตอนการ triage: [/channels/troubleshooting](/th/channels/troubleshooting)

## หมายเหตุด้านความปลอดภัย

- `signal-cli` จัดเก็บคีย์บัญชีไว้ในเครื่อง (โดยทั่วไปคือ `~/.local/share/signal-cli/data/`)
- สำรองสถานะบัญชี Signal ก่อนย้ายเซิร์ฟเวอร์หรือสร้างระบบใหม่
- ควรใช้ `channels.signal.dmPolicy: "pairing"` ต่อไป เว้นแต่คุณต้องการเปิดการเข้าถึง DM ให้กว้างขึ้นอย่างชัดเจน
- การยืนยันด้วย SMS จำเป็นเฉพาะสำหรับขั้นตอนการลงทะเบียนหรือกู้คืนเท่านั้น แต่การสูญเสียการควบคุมหมายเลข/บัญชีอาจทำให้การลงทะเบียนใหม่ซับซ้อนขึ้น

## เอกสารอ้างอิงการกำหนดค่า (Signal)

การกำหนดค่าแบบเต็ม: [Configuration](/th/gateway/configuration)

ตัวเลือกของผู้ให้บริการ:

- `channels.signal.enabled`: เปิด/ปิดการเริ่มต้นช่องทาง
- `channels.signal.account`: E.164 สำหรับบัญชีบอท
- `channels.signal.cliPath`: พาธไปยัง `signal-cli`
- `channels.signal.httpUrl`: URL เต็มของ daemon (override host/port)
- `channels.signal.httpHost`, `channels.signal.httpPort`: การ bind ของ daemon (ค่าเริ่มต้น 127.0.0.1:8080)
- `channels.signal.autoStart`: spawn daemon อัตโนมัติ (ค่าเริ่มต้น true หากไม่ได้ตั้ง `httpUrl`)
- `channels.signal.startupTimeoutMs`: เวลารอเริ่มต้นเป็นมิลลิวินาที (สูงสุด 120000)
- `channels.signal.receiveMode`: `on-start | manual`
- `channels.signal.ignoreAttachments`: ข้ามการดาวน์โหลดไฟล์แนบ
- `channels.signal.ignoreStories`: ไม่สนใจ stories จาก daemon
- `channels.signal.sendReadReceipts`: ส่งต่อ read receipts
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.signal.allowFrom`: allowlist ของ DM (E.164 หรือ `uuid:<id>`) `open` ต้องมี `"*"` Signal ไม่มี usernames; ให้ใช้โทรศัพท์/UUID
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: allowlist)
- `channels.signal.groupAllowFrom`: allowlist ของผู้ส่งในกลุ่ม
- `channels.signal.groups`: การ override รายกลุ่ม โดยคีย์ด้วย id กลุ่มของ Signal (หรือ `"*"`) ฟิลด์ที่รองรับ: `requireMention`, `tools`, `toolsBySender`
- `channels.signal.accounts.<id>.groups`: เวอร์ชันแยกตามบัญชีของ `channels.signal.groups` สำหรับการตั้งค่าหลายบัญชี
- `channels.signal.historyLimit`: จำนวนข้อความกลุ่มสูงสุดที่จะรวมเป็นบริบท (`0` คือปิดใช้งาน)
- `channels.signal.dmHistoryLimit`: ขีดจำกัดประวัติ DM ในหน่วย user turns การ override รายผู้ใช้: `channels.signal.dms["<phone_or_uuid>"].historyLimit`
- `channels.signal.textChunkLimit`: ขนาดการแบ่งข้อความขาออก (อักขระ)
- `channels.signal.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- `channels.signal.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า/ขาออก (MB)

ตัวเลือกส่วนกลางที่เกี่ยวข้อง:

- `agents.list[].groupChat.mentionPatterns` (Signal ไม่รองรับ mentions แบบ native)
- `messages.groupChat.mentionPatterns` (fallback ส่วนกลาง)
- `messages.responsePrefix`

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอน pairing
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการกั้นด้วย mention
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการทำ hardening
