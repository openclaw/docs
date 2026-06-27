---
read_when:
    - การตั้งค่าการรองรับ Signal
    - การดีบักการส่ง/รับของ Signal
summary: รองรับ Signal ผ่าน signal-cli (daemon แบบเนทีฟหรือคอนเทนเนอร์ bbernhard), เส้นทางการตั้งค่า และโมเดลหมายเลข
title: Signal
x-i18n:
    generated_at: "2026-06-27T17:13:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f4d82f43a11494d371a9af9a8e55b227364594a5a144b5a4d8690e865d9ade8
    source_path: channels/signal.md
    workflow: 16
---

สถานะ: การผสานรวม CLI ภายนอก Gateway คุยกับ `signal-cli` ผ่าน HTTP — ไม่ว่าจะเป็น daemon แบบเนทีฟ (JSON-RPC + SSE) หรือคอนเทนเนอร์ bbernhard/signal-cli-rest-api (REST + WebSocket)

## ข้อกำหนดเบื้องต้น

- ติดตั้ง OpenClaw บนเซิร์ฟเวอร์ของคุณแล้ว (โฟลว์ Linux ด้านล่างทดสอบบน Ubuntu 24)
- อย่างใดอย่างหนึ่งต่อไปนี้:
  - มี `signal-cli` บนโฮสต์ (โหมดเนทีฟ), **หรือ**
  - คอนเทนเนอร์ Docker `bbernhard/signal-cli-rest-api` (โหมดคอนเทนเนอร์)
- หมายเลขโทรศัพท์ที่รับ SMS ยืนยันได้หนึ่งครั้ง (สำหรับเส้นทางการลงทะเบียนด้วย SMS)
- การเข้าถึงเบราว์เซอร์สำหรับ captcha ของ Signal (`signalcaptchas.org`) ระหว่างการลงทะเบียน

## ตั้งค่าอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ใช้ **หมายเลข Signal แยกต่างหาก** สำหรับบอต (แนะนำ)
2. ติดตั้ง Plugin ของ OpenClaw:

```bash
openclaw plugins install @openclaw/signal
```

3. ติดตั้ง `signal-cli` (ต้องใช้ Java หากคุณใช้ JVM build)
4. เลือกเส้นทางการตั้งค่าหนึ่งแบบ:
   - **เส้นทาง A (ลิงก์ QR):** `signal-cli link -n "OpenClaw"` แล้วสแกนด้วย Signal
   - **เส้นทาง B (ลงทะเบียน SMS):** ลงทะเบียนหมายเลขเฉพาะด้วย captcha + การยืนยัน SMS
5. กำหนดค่า OpenClaw แล้วรีสตาร์ท gateway
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

ข้อมูลอ้างอิงฟิลด์:

| ฟิลด์        | คำอธิบาย                                       |
| ------------ | ------------------------------------------------- |
| `account`    | หมายเลขโทรศัพท์ของบอตในรูปแบบ E.164 (`+15551234567`) |
| `cliPath`    | พาธไปยัง `signal-cli` (`signal-cli` หากอยู่บน `PATH`)  |
| `configPath` | ไดเรกทอรี config ของ signal-cli ที่ส่งเป็น `--config`        |
| `dmPolicy`   | นโยบายการเข้าถึง DM (แนะนำ `pairing`)          |
| `allowFrom`  | หมายเลขโทรศัพท์หรือค่า `uuid:<id>` ที่ได้รับอนุญาตให้ DM |

## สิ่งนี้คืออะไร

- ช่องทาง Signal ผ่าน `signal-cli` (ไม่ใช่ libsignal แบบฝัง)
- การกำหนดเส้นทางที่กำหนดแน่นอน: การตอบกลับจะกลับไปที่ Signal เสมอ
- DM ใช้ session หลักของ agent ร่วมกัน; กลุ่มจะแยกออกจากกัน (`agent:<agentId>:signal:group:<groupId>`)

## การเขียน config

โดยค่าเริ่มต้น Signal ได้รับอนุญาตให้เขียนการอัปเดต config ที่ถูกทริกเกอร์โดย `/config set|unset` (ต้องใช้ `commands.config: true`)

ปิดใช้งานด้วย:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## โมเดลหมายเลข (สำคัญ)

- gateway เชื่อมต่อกับ **อุปกรณ์ Signal** (`signal-cli` account)
- หากคุณรันบอตบน **account Signal ส่วนตัวของคุณ** บอตจะละเว้นข้อความของคุณเอง (การป้องกันลูป)
- สำหรับ "ฉันส่งข้อความหาบอตแล้วบอตตอบกลับ" ให้ใช้ **หมายเลขบอตแยกต่างหาก**

## เส้นทางการตั้งค่า A: ลิงก์ account Signal ที่มีอยู่ (QR)

1. ติดตั้ง `signal-cli` (JVM หรือ native build)
2. ลิงก์ account บอต:
   - `signal-cli link -n "OpenClaw"` แล้วสแกน QR ใน Signal
3. กำหนดค่า Signal แล้วเริ่ม gateway

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

การรองรับหลาย account: ใช้ `channels.signal.accounts` พร้อม config ต่อ account และ `name` แบบไม่บังคับ ดู [`gateway/configuration`](/th/gateway/config-channels#multi-account-all-channels) สำหรับรูปแบบที่ใช้ร่วมกัน

## เส้นทางการตั้งค่า B: ลงทะเบียนหมายเลขบอตเฉพาะ (SMS, Linux)

ใช้วิธีนี้เมื่อคุณต้องการหมายเลขบอตเฉพาะแทนการลิงก์ account แอป Signal ที่มีอยู่

1. รับหมายเลขที่รับ SMS ได้ (หรือการยืนยันด้วยเสียงสำหรับโทรศัพท์พื้นฐาน)
   - ใช้หมายเลขบอตเฉพาะเพื่อหลีกเลี่ยงความขัดแย้งของ account/session
2. ติดตั้ง `signal-cli` บนโฮสต์ gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

หากคุณใช้ JVM build (`signal-cli-${VERSION}.tar.gz`) ให้ติดตั้ง JRE 25+ ก่อน
อัปเดต `signal-cli` ให้ทันสมัยอยู่เสมอ; upstream ระบุว่า release เก่าอาจเสียได้เมื่อ API ของเซิร์ฟเวอร์ Signal เปลี่ยน

3. ลงทะเบียนและยืนยันหมายเลข:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

หากต้องใช้ captcha:

1. เปิด `https://signalcaptchas.org/registration/generate.html`
2. ทำ captcha ให้เสร็จ แล้วคัดลอกเป้าหมายลิงก์ `signalcaptcha://...` จาก "Open Signal"
3. รันจาก IP ภายนอกเดียวกับ session เบราว์เซอร์เมื่อทำได้
4. รันการลงทะเบียนอีกครั้งทันที (โทเคน captcha หมดอายุเร็ว):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. กำหนดค่า OpenClaw, รีสตาร์ท gateway, ตรวจสอบช่องทาง:

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
   - บันทึกหมายเลขบอตเป็นรายชื่อผู้ติดต่อในโทรศัพท์ของคุณเพื่อหลีกเลี่ยง "ผู้ติดต่อที่ไม่รู้จัก"

<Warning>
การลงทะเบียน account หมายเลขโทรศัพท์ด้วย `signal-cli` อาจทำให้ session แอป Signal หลักของหมายเลขนั้นถูกยกเลิกการยืนยันตัวตน ควรใช้หมายเลขบอตเฉพาะ หรือใช้โหมดลิงก์ QR หากคุณต้องการคงการตั้งค่าแอปโทรศัพท์ที่มีอยู่
</Warning>

ข้อมูลอ้างอิง upstream:

- README ของ `signal-cli`: `https://github.com/AsamK/signal-cli`
- โฟลว์ captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- โฟลว์การลิงก์: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## โหมด daemon ภายนอก (httpUrl)

หากคุณต้องการจัดการ `signal-cli` เอง (JVM cold start ช้า, การเริ่มต้นคอนเทนเนอร์, หรือ CPU ที่ใช้ร่วมกัน) ให้รัน daemon แยกต่างหากแล้วชี้ OpenClaw ไปที่มัน:

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

วิธีนี้จะข้ามการ auto-spawn และการรอเริ่มต้นภายใน OpenClaw สำหรับการเริ่มช้าเมื่อ auto-spawning ให้ตั้งค่า `channels.signal.startupTimeoutMs`

## โหมดคอนเทนเนอร์ (bbernhard/signal-cli-rest-api)

แทนที่จะรัน `signal-cli` แบบเนทีฟ คุณสามารถใช้คอนเทนเนอร์ Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) ได้ สิ่งนี้ห่อ `signal-cli` ไว้หลัง REST API และอินเทอร์เฟซ WebSocket

ข้อกำหนด:

- คอนเทนเนอร์ **ต้อง** รันด้วย `MODE=json-rpc` เพื่อรับข้อความแบบเรียลไทม์
- ลงทะเบียนหรือลิงก์ account Signal ของคุณภายในคอนเทนเนอร์ก่อนเชื่อมต่อ OpenClaw

ตัวอย่าง service `docker-compose.yml`:

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

ฟิลด์ `apiMode` ควบคุมว่า OpenClaw ใช้ protocol ใด:

| ค่า         | พฤติกรรม                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (ค่าเริ่มต้น) Probe ทั้งสอง transport; streaming ตรวจสอบการรับผ่าน WebSocket ของคอนเทนเนอร์    |
| `"native"`    | บังคับใช้ signal-cli แบบเนทีฟ (JSON-RPC ที่ `/api/v1/rpc`, SSE ที่ `/api/v1/events`)         |
| `"container"` | บังคับใช้คอนเทนเนอร์ bbernhard (REST ที่ `/v2/send`, WebSocket ที่ `/v1/receive/{account}`) |

เมื่อ `apiMode` เป็น `"auto"` OpenClaw จะ cache โหมดที่ตรวจพบไว้ 30 วินาทีเพื่อหลีกเลี่ยงการ probe ซ้ำ การรับของคอนเทนเนอร์จะถูกเลือกสำหรับ streaming เท่านั้นหลังจาก `/v1/receive/{account}` อัปเกรดเป็น WebSocket ซึ่งต้องใช้ `MODE=json-rpc`

โหมดคอนเทนเนอร์รองรับการดำเนินการช่องทาง Signal แบบเดียวกับโหมดเนทีฟเมื่อคอนเทนเนอร์เปิดเผย API ที่ตรงกัน: ส่ง, รับ, ไฟล์แนบ, ตัวบ่งชี้การพิมพ์, ใบตอบรับว่าอ่านแล้ว/ดูแล้ว, reactions, กลุ่ม, และข้อความมีสไตล์ OpenClaw แปลการเรียก Signal RPC แบบเนทีฟของตนเป็น payload REST ของคอนเทนเนอร์ รวมถึง ID กลุ่ม `group.{base64(internal_id)}` และ `text_mode: "styled"` สำหรับข้อความที่จัดรูปแบบ

หมายเหตุด้านการปฏิบัติงาน:

- ใช้ `autoStart: false` กับโหมดคอนเทนเนอร์ OpenClaw ไม่ควร spawn daemon แบบเนทีฟเมื่อเลือก `apiMode: "container"`
- ใช้ `MODE=json-rpc` สำหรับการรับ `MODE=normal` อาจทำให้ `/v1/about` ดูปกติ แต่ `/v1/receive/{account}` ไม่อัปเกรดเป็น WebSocket ดังนั้น OpenClaw จะไม่เลือก streaming การรับของคอนเทนเนอร์ในโหมด `auto`
- ตั้งค่า `apiMode: "container"` เมื่อคุณรู้ว่า `httpUrl` ชี้ไปที่ REST API ของ bbernhard ตั้งค่า `apiMode: "native"` เมื่อคุณรู้ว่ามันชี้ไปที่ JSON-RPC/SSE ของ `signal-cli` แบบเนทีฟ ใช้ `"auto"` เมื่อ deployment อาจแตกต่างกัน
- การดาวน์โหลดไฟล์แนบในโหมดคอนเทนเนอร์เคารพขีดจำกัดไบต์สื่อเดียวกับโหมดเนทีฟ response ที่มีขนาดใหญ่เกินจะถูกปฏิเสธก่อนถูก buffer เต็มเมื่อเซิร์ฟเวอร์ส่ง `Content-Length` และจะถูกปฏิเสธระหว่าง streaming ในกรณีอื่น

## การควบคุมการเข้าถึง (DM + กลุ่ม)

DM:

- ค่าเริ่มต้น: `channels.signal.dmPolicy = "pairing"`
- ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่; ข้อความจะถูกละเว้นจนกว่าจะอนุมัติ (รหัสหมดอายุหลังจาก 1 ชั่วโมง)
- อนุมัติผ่าน:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pairing เป็นการแลกเปลี่ยนโทเคนเริ่มต้นสำหรับ Signal DM รายละเอียด: [Pairing](/th/channels/pairing)
- ผู้ส่งแบบ UUID เท่านั้น (จาก `sourceUuid`) จะถูกเก็บเป็น `uuid:<id>` ใน `channels.signal.allowFrom`

กลุ่ม:

- `channels.signal.groupPolicy = open | allowlist | disabled`
- `channels.signal.groupAllowFrom` ควบคุมว่ากลุ่มหรือผู้ส่งใดสามารถทริกเกอร์การตอบกลับกลุ่มได้เมื่อตั้งค่า `allowlist`; รายการสามารถเป็น ID กลุ่ม Signal (ดิบ, `group:<id>`, หรือ `signal:group:<id>`), หมายเลขโทรศัพท์ผู้ส่ง, ค่า `uuid:<id>`, หรือ `*`
- `channels.signal.groups["<group-id>" | "*"]` สามารถ override พฤติกรรมกลุ่มด้วย `requireMention`, `tools`, และ `toolsBySender`
- ใช้ `channels.signal.accounts.<id>.groups` สำหรับ override ต่อ account ในการตั้งค่าหลาย account
- การ allowlist กลุ่ม Signal ผ่าน `groupAllowFrom` ไม่ได้ปิด mention gating ด้วยตัวเอง รายการ `channels.signal.groups["<group-id>"]` ที่กำหนดค่าไว้เฉพาะจะประมวลผลทุกข้อความกลุ่มเว้นแต่จะตั้งค่า `requireMention=true`
- หมายเหตุ runtime: หาก `channels.signal` หายไปทั้งหมด runtime จะ fallback เป็น `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

## วิธีทำงาน (พฤติกรรม)

- โหมดเนทีฟ: `signal-cli` รันเป็น daemon; gateway อ่าน event ผ่าน SSE
- โหมดคอนเทนเนอร์: gateway ส่งผ่าน REST API และรับผ่าน WebSocket
- ข้อความขาเข้าจะถูก normalize เป็น envelope ช่องทางที่ใช้ร่วมกัน
- การตอบกลับจะ route กลับไปยังหมายเลขหรือกลุ่มเดิมเสมอ

## สื่อ + ขีดจำกัด

- ข้อความขาออกจะถูกแบ่งเป็นชิ้นตาม `channels.signal.textChunkLimit` (ค่าเริ่มต้น 4000)
- การแบ่งชิ้นตามบรรทัดใหม่แบบไม่บังคับ: ตั้งค่า `channels.signal.chunkMode="newline"` เพื่อแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนการแบ่งตามความยาว
- รองรับไฟล์แนบ (base64 ที่ดึงจาก `signal-cli`)
- ไฟล์แนบ voice-note ใช้ชื่อไฟล์ `signal-cli` เป็น fallback ของ MIME เมื่อ `contentType` หายไป เพื่อให้การถอดเสียงยังจัดประเภท voice memo แบบ AAC ได้
- ขีดจำกัดสื่อเริ่มต้น: `channels.signal.mediaMaxMb` (ค่าเริ่มต้น 8)
- ใช้ `channels.signal.ignoreAttachments` เพื่อข้ามการดาวน์โหลดสื่อ
- บริบทประวัติกลุ่มใช้ `channels.signal.historyLimit` (หรือ `channels.signal.accounts.*.historyLimit`) โดย fallback ไปที่ `messages.groupChat.historyLimit` ตั้งค่า `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)

## การพิมพ์ + ใบตอบรับว่าอ่านแล้ว

- **ตัวบ่งชี้การพิมพ์**: OpenClaw ส่งสัญญาณการพิมพ์ผ่าน `signal-cli sendTyping` และรีเฟรชสัญญาณระหว่างที่คำตอบกำลังทำงาน
- **ใบตอบรับการอ่าน**: เมื่อ `channels.signal.sendReadReceipts` เป็น true OpenClaw จะส่งต่อใบตอบรับการอ่านสำหรับ DM ที่อนุญาต
- Signal-cli ไม่เปิดเผยใบตอบรับการอ่านสำหรับกลุ่ม

## ปฏิกิริยา (เครื่องมือข้อความ)

- ใช้ `message action=react` พร้อม `channel=signal`
- เป้าหมาย: E.164 หรือ UUID ของผู้ส่ง (ใช้ `uuid:<id>` จากเอาต์พุตการจับคู่; UUID เปล่าก็ใช้ได้เช่นกัน)
- `messageId` คือเวลาประทับของ Signal สำหรับข้อความที่คุณกำลังแสดงปฏิกิริยา
- ปฏิกิริยาในกลุ่มต้องใช้ `targetAuthor` หรือ `targetAuthorUuid`

ตัวอย่าง:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

การกำหนดค่า:

- `channels.signal.actions.reactions`: เปิด/ปิดการกระทำปฏิกิริยา (ค่าเริ่มต้น true)
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`
  - `off`/`ack` ปิดใช้งานปฏิกิริยาของเอเจนต์ (เครื่องมือข้อความ `react` จะเกิดข้อผิดพลาด)
  - `minimal`/`extensive` เปิดใช้งานปฏิกิริยาของเอเจนต์และตั้งค่าระดับคำแนะนำ
- การแทนที่รายบัญชี: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`

## ปฏิกิริยาการอนุมัติ

พรอมป์การอนุมัติ Signal exec และ Plugin ใช้บล็อกการกำหนดเส้นทางระดับบนสุด `approvals.exec` และ
`approvals.plugin` Signal ไม่มีบล็อก
`channels.signal.execApprovals`

- `👍` อนุมัติหนึ่งครั้ง
- `👎` ปฏิเสธ
- ใช้ `/approve <id> allow-always` เมื่อคำขอเสนอการอนุมัติแบบถาวร

การแก้ไขปฏิกิริยาการอนุมัติต้องมีผู้อนุมัติ Signal อย่างชัดเจนจาก
`channels.signal.allowFrom`, `channels.signal.defaultTo` หรือฟิลด์ระดับบัญชีที่ตรงกัน
พรอมป์อนุมัติ exec โดยตรงในแชทเดียวกันยังสามารถระงับ fallback `/approve` ภายในเครื่องที่ซ้ำกันได้
โดยไม่ต้องมีผู้อนุมัติอย่างชัดเจน; การอนุมัติแบบกลุ่มที่ไม่มีผู้อนุมัติจะยังแสดง fallback ภายในเครื่องไว้

## เป้าหมายการส่งมอบ (CLI/cron)

- DM: `signal:+15551234567` (หรือ E.164 แบบธรรมดา)
- DM แบบ UUID: `uuid:<id>` (หรือ UUID เปล่า)
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

- Daemon เข้าถึงได้แต่ไม่มีคำตอบ: ตรวจสอบการตั้งค่าบัญชี/daemon (`httpUrl`, `account`) และโหมดรับ
- DM ถูกละเว้น: ผู้ส่งกำลังรอการอนุมัติการจับคู่
- ข้อความกลุ่มถูกละเว้น: การควบคุมผู้ส่ง/การกล่าวถึงของกลุ่มบล็อกการส่งมอบ
- ข้อผิดพลาดการตรวจสอบการกำหนดค่าหลังแก้ไข: เรียกใช้ `openclaw doctor --fix`
- Signal หายไปจากการวินิจฉัย: ยืนยัน `channels.signal.enabled: true`

การตรวจสอบเพิ่มเติม:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

สำหรับโฟลว์การคัดแยก: [/channels/troubleshooting](/th/channels/troubleshooting)

## หมายเหตุด้านความปลอดภัย

- `signal-cli` จัดเก็บคีย์บัญชีไว้ในเครื่อง (โดยทั่วไปคือ `~/.local/share/signal-cli/data/`)
- สำรองสถานะบัญชี Signal ก่อนย้ายเซิร์ฟเวอร์หรือสร้างใหม่
- คง `channels.signal.dmPolicy: "pairing"` ไว้ เว้นแต่คุณต้องการสิทธิ์เข้าถึง DM ที่กว้างขึ้นอย่างชัดเจน
- การยืนยัน SMS จำเป็นเฉพาะสำหรับโฟลว์การลงทะเบียนหรือการกู้คืน แต่การสูญเสียการควบคุมหมายเลข/บัญชีอาจทำให้การลงทะเบียนใหม่ซับซ้อนขึ้น

## อ้างอิงการกำหนดค่า (Signal)

การกำหนดค่าแบบเต็ม: [การกำหนดค่า](/th/gateway/configuration)

ตัวเลือกผู้ให้บริการ:

- `channels.signal.enabled`: เปิด/ปิดการเริ่มต้นช่องทาง
- `channels.signal.apiMode`: `auto | native | container` (ค่าเริ่มต้น: auto) ดู [โหมดคอนเทนเนอร์](#container-mode-bbernhardsignal-cli-rest-api)
- `channels.signal.account`: E.164 สำหรับบัญชีบอต
- `channels.signal.cliPath`: พาธไปยัง `signal-cli`
- `channels.signal.configPath`: ไดเรกทอรี `signal-cli --config` ที่ไม่บังคับ
- `channels.signal.httpUrl`: URL daemon แบบเต็ม (แทนที่ host/port)
- `channels.signal.httpHost`, `channels.signal.httpPort`: การ bind ของ daemon (ค่าเริ่มต้น 127.0.0.1:8080)
- `channels.signal.autoStart`: สร้าง daemon อัตโนมัติ (ค่าเริ่มต้น true หากไม่ได้ตั้งค่า `httpUrl`)
- `channels.signal.startupTimeoutMs`: เวลารอเริ่มต้นเป็น ms (จำกัด 120000)
- `channels.signal.receiveMode`: `on-start | manual`
- `channels.signal.ignoreAttachments`: ข้ามการดาวน์โหลดไฟล์แนบ
- `channels.signal.ignoreStories`: ละเว้นสตอรีจาก daemon
- `channels.signal.sendReadReceipts`: ส่งต่อใบตอบรับการอ่าน
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.signal.allowFrom`: allowlist ของ DM (E.164 หรือ `uuid:<id>`) `open` ต้องใช้ `"*"` Signal ไม่มีชื่อผู้ใช้; ใช้หมายเลขโทรศัพท์/UUID
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: allowlist)
- `channels.signal.groupAllowFrom`: allowlist ของกลุ่ม; รับ ID กลุ่ม Signal (ดิบ, `group:<id>` หรือ `signal:group:<id>`), หมายเลข E.164 ของผู้ส่ง หรือค่า `uuid:<id>`
- `channels.signal.groups`: การแทนที่รายกลุ่มที่ใช้ ID กลุ่ม Signal เป็นคีย์ (หรือ `"*"`) ฟิลด์ที่รองรับ: `requireMention`, `tools`, `toolsBySender`
- `channels.signal.accounts.<id>.groups`: เวอร์ชันรายบัญชีของ `channels.signal.groups` สำหรับการตั้งค่าหลายบัญชี
- `channels.signal.historyLimit`: จำนวนข้อความกลุ่มสูงสุดที่จะรวมเป็นบริบท (0 ปิดใช้งาน)
- `channels.signal.dmHistoryLimit`: ขีดจำกัดประวัติ DM เป็นจำนวนเทิร์นของผู้ใช้ การแทนที่รายผู้ใช้: `channels.signal.dms["<phone_or_uuid>"].historyLimit`
- `channels.signal.textChunkLimit`: ขนาดชิ้นส่วนขาออก (อักขระ)
- `channels.signal.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งชิ้นส่วนตามความยาว
- `channels.signal.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า/ขาออก (MB)

ตัวเลือกระดับโลกที่เกี่ยวข้อง:

- `agents.list[].groupChat.mentionPatterns` (Signal ไม่รองรับการกล่าวถึงแบบเนทีฟ)
- `messages.groupChat.mentionPatterns` (fallback ระดับโลก)
- `messages.responsePrefix`

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชทกลุ่มและการควบคุมการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเพิ่มความแข็งแกร่ง
