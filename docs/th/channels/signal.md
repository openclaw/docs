---
read_when:
    - การตั้งค่าการรองรับ Signal
    - การแก้ไขข้อบกพร่องในการส่ง/รับ Signal
summary: การรองรับ Signal ผ่าน signal-cli (เดมอนแบบเนทีฟหรือคอนเทนเนอร์ bbernhard) พาธการตั้งค่า และโมเดลหมายเลขโทรศัพท์
title: Signal
x-i18n:
    generated_at: "2026-07-19T07:12:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0bbae246e797f79e68b1b217006450b557021a5587467975b79840672ac34d75
    source_path: channels/signal.md
    workflow: 16
---

Signal เป็น Plugin ช่องทางที่ดาวน์โหลดได้ (`@openclaw/signal`) Gateway สื่อสารกับ `signal-cli` ผ่าน HTTP โดยใช้ได้ทั้งดีมอนแบบเนทีฟ (JSON-RPC + SSE) หรือคอนเทนเนอร์ [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket) OpenClaw ไม่ได้ฝัง libsignal ไว้ภายใน

## รูปแบบการใช้หมายเลข (โปรดอ่านส่วนนี้ก่อน)

- Gateway เชื่อมต่อกับ **อุปกรณ์ Signal** ซึ่งก็คือบัญชี `signal-cli`
- การเรียกใช้บอตบน **บัญชี Signal ส่วนตัวของคุณ** จะทำให้บอตละเว้นข้อความของคุณเอง (เพื่อป้องกันลูป)
- หากต้องการให้ "ฉันส่งข้อความหาบอตแล้วบอตตอบกลับ" ให้ใช้ **หมายเลขสำหรับบอตโดยเฉพาะ**

## การติดตั้ง

```bash
openclaw plugins install @openclaw/signal
```

ข้อกำหนด Plugin แบบไม่ระบุแหล่งที่มาจะลองค้นหาใน ClawHub ก่อน แล้วจึงใช้ npm เป็นทางเลือกสำรอง บังคับแหล่งที่มาด้วย `openclaw plugins install clawhub:@openclaw/signal` หรือ `npm:@openclaw/signal` คำสั่ง `plugins install` จะลงทะเบียนและเปิดใช้งาน Plugin โดยไม่ต้องทำขั้นตอน `enable` แยกต่างหาก ดูกฎการติดตั้งทั่วไปได้ที่ [Plugin](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="เลือกหมายเลข">
    ใช้ **หมายเลข Signal แยกต่างหาก** สำหรับบอต (แนะนำ)
  </Step>
  <Step title="ติดตั้ง Plugin">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="เรียกใช้การตั้งค่าแบบมีคำแนะนำ">
    ```bash
    openclaw channels add
    ```
    วิซาร์ดจะตรวจสอบว่า `signal-cli` อยู่ใน `PATH` หรือไม่ และหากไม่พบ จะเสนอให้ติดตั้ง โดยดาวน์โหลดบิลด์ GraalVM แบบเนทีฟอย่างเป็นทางการบน Linux x86-64 หรือติดตั้งผ่าน Homebrew บน macOS และสถาปัตยกรรมอื่น จากนั้นจะแจ้งให้ป้อนหมายเลขบอตและพาธ `signal-cli`

    สำหรับการตั้งค่าแบบไม่โต้ตอบ `openclaw channels add --channel signal` ยังรองรับ `--signal-number <e164>` สำหรับหมายเลขโทรศัพท์ของบอต รวมถึง `--http-host <host>` และ `--http-port <port>` สำหรับปลายทางดีมอน Signal (ค่าเริ่มต้นคือ `127.0.0.1:8080`)

  </Step>
  <Step title="เชื่อมโยงหรือลงทะเบียนบัญชี">
    - **เชื่อมโยงด้วย QR (เร็วที่สุด):** `signal-cli link -n "OpenClaw"` จากนั้นสแกนด้วย Signal ดู[เส้นทาง A](#setup-path-a-link-existing-signal-account-qr)
    - **ลงทะเบียนด้วย SMS:** ใช้หมายเลขเฉพาะ พร้อม captcha และการยืนยันทาง SMS ดู[เส้นทาง B](#setup-path-b-register-dedicated-bot-number-sms-linux)

  </Step>
  <Step title="ตรวจสอบและจับคู่">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    ส่ง DM ครั้งแรกและอนุมัติการจับคู่: `openclaw pairing approve signal <CODE>`
  </Step>
</Steps>

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

| ฟิลด์        | คำอธิบาย                                       |
| ------------ | ------------------------------------------------- |
| `account`    | หมายเลขโทรศัพท์ของบอตในรูปแบบ E.164 (`+15551234567`) |
| `cliPath`    | พาธไปยัง `signal-cli` (`signal-cli` หากอยู่ใน `PATH`)  |
| `configPath` | ไดเรกทอรีการกำหนดค่า signal-cli ที่ส่งเป็น `--config`        |
| `dmPolicy`   | นโยบายการเข้าถึง DM (แนะนำ `pairing`)          |
| `allowFrom`  | หมายเลขโทรศัพท์หรือค่า `uuid:<id>` ที่ได้รับอนุญาตให้ส่ง DM |

การรองรับหลายบัญชี: ใช้ `channels.signal.accounts` พร้อมการกำหนดค่ารายบัญชีและ `name` ซึ่งระบุหรือไม่ก็ได้ ดูรูปแบบที่ใช้ร่วมกันได้ที่ [ช่องทางแบบหลายบัญชี](/th/gateway/config-channels#multi-account-all-channels)

## ลักษณะการทำงาน

- การกำหนดเส้นทางแบบกำหนดแน่นอน: การตอบกลับจะส่งกลับไปยัง Signal เสมอ
- DM ใช้เซสชันหลักของเอเจนต์ร่วมกัน ส่วนกลุ่มจะแยกออกจากกัน (`agent:<agentId>:signal:group:<groupId>`)
- ตามค่าเริ่มต้น Signal อาจเขียนการอัปเดตการกำหนดค่าที่ทริกเกอร์โดย `/config set|unset` (ต้องใช้ `commands.config: true`) ปิดใช้งานได้ด้วย `channels.signal.configWrites: false`

## เส้นทางการตั้งค่า A: เชื่อมโยงบัญชี Signal ที่มีอยู่ (QR)

1. ติดตั้ง `signal-cli` (บิลด์ JVM หรือแบบเนทีฟ) หรือให้ `openclaw channels add` ติดตั้งให้
2. เชื่อมโยงบัญชีบอต: `signal-cli link -n "OpenClaw"` จากนั้นสแกน QR ใน Signal
3. กำหนดค่า Signal และเริ่ม Gateway

## เส้นทางการตั้งค่า B: ลงทะเบียนหมายเลขบอตโดยเฉพาะ (SMS, Linux)

ใช้วิธีนี้สำหรับหมายเลขบอตโดยเฉพาะแทนการเชื่อมโยงบัญชีแอป Signal ที่มีอยู่ ขั้นตอนด้านล่างผ่านการทดสอบบน Ubuntu 24

1. จัดหาหมายเลขที่รับ SMS ได้ (หรือรับการยืนยันด้วยเสียงสำหรับโทรศัพท์พื้นฐาน) หมายเลขบอตโดยเฉพาะช่วยหลีกเลี่ยงข้อขัดแย้งของบัญชี/เซสชัน
2. ติดตั้ง `signal-cli` บนโฮสต์ Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

หากใช้บิลด์ JVM (`signal-cli-${VERSION}.tar.gz`) ให้ติดตั้ง JRE ก่อน อัปเดต `signal-cli` ให้เป็นปัจจุบันอยู่เสมอ โดยต้นทางระบุว่ารีลีสเก่าอาจใช้งานไม่ได้เมื่อ API ของเซิร์ฟเวอร์ Signal เปลี่ยนแปลง

3. ลงทะเบียนและยืนยันหมายเลข:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

หากจำเป็นต้องใช้ captcha (ต้องเข้าถึงเบราว์เซอร์เพื่อทำขั้นตอนนี้ให้เสร็จสมบูรณ์):

1. เปิด `https://signalcaptchas.org/registration/generate.html`
2. ทำ captcha ให้เสร็จ แล้วคัดลอกเป้าหมายลิงก์ `signalcaptcha://...` จาก "Open Signal"
3. เมื่อเป็นไปได้ ให้เรียกใช้จาก IP ภายนอกเดียวกับเซสชันเบราว์เซอร์ (โทเค็น captcha หมดอายุอย่างรวดเร็ว)
4. ลงทะเบียนและยืนยันทันที:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. กำหนดค่า OpenClaw รีสตาร์ต Gateway และตรวจสอบช่องทาง:

```bash
# หากคุณเรียกใช้ Gateway เป็นบริการ systemd ระดับผู้ใช้:
systemctl --user restart openclaw-gateway.service

# จากนั้นตรวจสอบ:
openclaw doctor
openclaw channels status --probe
```

5. จับคู่ผู้ส่ง DM:
   - ส่งข้อความใดก็ได้ไปยังหมายเลขบอต
   - อนุมัติบนเซิร์ฟเวอร์: `openclaw pairing approve signal <PAIRING_CODE>`
   - บันทึกหมายเลขบอตเป็นรายชื่อติดต่อในโทรศัพท์เพื่อหลีกเลี่ยง "Unknown contact"

<Warning>
การลงทะเบียนบัญชีหมายเลขโทรศัพท์ด้วย `signal-cli` อาจทำให้เซสชันแอป Signal หลักของหมายเลขนั้นสูญเสียการยืนยันตัวตน ควรใช้หมายเลขบอตโดยเฉพาะ หรือใช้โหมดเชื่อมโยงด้วย QR เพื่อคงการตั้งค่าแอปโทรศัพท์ที่มีอยู่
</Warning>

ข้อมูลอ้างอิงจากต้นทาง:

- README ของ `signal-cli`: `https://github.com/AsamK/signal-cli`
- ขั้นตอน captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- ขั้นตอนการเชื่อมโยง: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## โหมดดีมอนภายนอก (httpUrl)

หากต้องการจัดการ `signal-cli` ด้วยตนเอง (การเริ่มต้นแบบ cold start ของ JVM ที่ช้า การเริ่มต้นคอนเทนเนอร์ CPU ที่ใช้ร่วมกัน) ให้เรียกใช้ดีมอนแยกต่างหากและกำหนดให้ OpenClaw ชี้ไปยังดีมอนนั้น:

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

วิธีนี้จะข้ามการสร้างโปรเซสโดยอัตโนมัติและการรอเริ่มต้นของ OpenClaw สำหรับการเริ่มต้นแบบสร้างโปรเซสอัตโนมัติที่ช้า ให้ตั้งค่า `channels.signal.startupTimeoutMs`

## โหมดคอนเทนเนอร์ (bbernhard/signal-cli-rest-api)

แทนที่จะเรียกใช้ `signal-cli` แบบเนทีฟ ให้ใช้คอนเทนเนอร์ Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) ซึ่งห่อหุ้ม `signal-cli` ไว้เบื้องหลังอินเทอร์เฟซ REST + WebSocket

ข้อกำหนด:

- คอนเทนเนอร์ **ต้อง** เรียกใช้ด้วย `MODE=json-rpc` เพื่อรับข้อความแบบเรียลไทม์
- ลงทะเบียนหรือเชื่อมโยงบัญชี Signal ภายในคอนเทนเนอร์ก่อนเชื่อมต่อ OpenClaw

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
      apiMode: "container", // หรือตั้งเป็น "auto" เพื่อตรวจหาโดยอัตโนมัติ
    },
  },
}
```

`apiMode` ควบคุมโปรโตคอลที่ OpenClaw ใช้:

| ค่า         | ลักษณะการทำงาน                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (ค่าเริ่มต้น) ตรวจสอบทั้งสองการรับส่งข้อมูล โดยการสตรีมจะตรวจสอบการรับผ่าน WebSocket ของคอนเทนเนอร์    |
| `"native"`    | บังคับใช้ signal-cli แบบเนทีฟ (JSON-RPC ที่ `/api/v1/rpc`, SSE ที่ `/api/v1/events`)         |
| `"container"` | บังคับใช้คอนเทนเนอร์ bbernhard (REST ที่ `/v2/send`, WebSocket ที่ `/v1/receive/{account}`) |

เมื่อ `apiMode` เป็น `"auto"` OpenClaw จะแคชโหมดที่ตรวจพบเป็นเวลา 30 วินาทีต่อ URL ของดีมอน เพื่อหลีกเลี่ยงการตรวจสอบซ้ำ (โหมดเนทีฟมีลำดับความสำคัญเมื่อการรับส่งข้อมูลทั้งสองแบบทำงานปกติ) การรับจากคอนเทนเนอร์จะถูกเลือกสำหรับการสตรีมหลังจาก `/v1/receive/{account}` อัปเกรดเป็น WebSocket สำเร็จเท่านั้น ซึ่งต้องใช้ `MODE=json-rpc`

โหมดคอนเทนเนอร์รองรับการดำเนินการ Signal แบบเดียวกับโหมดเนทีฟในส่วนที่คอนเทนเนอร์เปิดเผย API ที่สอดคล้องกัน ได้แก่ การส่ง การรับ ไฟล์แนบ ตัวบ่งชี้การพิมพ์ ใบตอบรับการอ่าน/การดู รีแอ็กชัน กลุ่ม และข้อความที่มีการจัดรูปแบบ OpenClaw จะแปลงการเรียก RPC แบบเนทีฟของ Signal เป็นเพย์โหลด REST ของคอนเทนเนอร์ รวมถึง ID กลุ่ม `group.{base64(internal_id)}` และ `text_mode: "styled"` สำหรับข้อความที่จัดรูปแบบ

หมายเหตุด้านการปฏิบัติงาน:

- ใช้ `autoStart: false` กับโหมดคอนเทนเนอร์ OpenClaw ไม่ควรสร้างดีมอนแบบเนทีฟเมื่อเลือก `apiMode: "container"`
- ใช้ `MODE=json-rpc` สำหรับการรับ `MODE=normal` อาจทำให้ `/v1/about` ดูเหมือนทำงานปกติ แต่ `/v1/receive/{account}` จะไม่อัปเกรดเป็น WebSocket ดังนั้น OpenClaw จะไม่เลือกการสตรีมรับจากคอนเทนเนอร์ในโหมด `auto`
- ตั้งค่า `apiMode: "container"` เมื่อ `httpUrl` ชี้ไปที่ REST API ของ bbernhard ตั้งค่า `"native"` เมื่อชี้ไปที่ JSON-RPC/SSE ของ `signal-cli` แบบเนทีฟ และตั้งค่า `"auto"` เมื่อรูปแบบการติดตั้งใช้งานอาจแตกต่างกัน
- การดาวน์โหลดไฟล์แนบในโหมดคอนเทนเนอร์ใช้ขีดจำกัดจำนวนไบต์ของสื่อเช่นเดียวกับโหมดเนทีฟ หากเซิร์ฟเวอร์ส่ง `Content-Length` การตอบกลับที่มีขนาดใหญ่เกินไปจะถูกปฏิเสธก่อนบัฟเฟอร์จนครบทั้งหมด มิฉะนั้นจะปฏิเสธระหว่างการสตรีม

## การควบคุมการเข้าถึง (DM + กลุ่ม)

DM:

- ค่าเริ่มต้น: `channels.signal.dmPolicy = "pairing"`
- ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ และข้อความจะถูกละเว้นจนกว่าจะได้รับการอนุมัติ (รหัสหมดอายุหลังจาก 1 ชั่วโมง)
- อนุมัติผ่าน `openclaw pairing list signal` และ `openclaw pairing approve signal <CODE>`
- การจับคู่เป็นการแลกเปลี่ยนโทเค็นเริ่มต้นสำหรับ DM ของ Signal รายละเอียด: [การจับคู่](/th/channels/pairing)
- ผู้ส่งที่มีเฉพาะ UUID (จาก `sourceUuid`) จะถูกจัดเก็บเป็น `uuid:<id>` ใน `channels.signal.allowFrom`

กลุ่ม:

- `channels.signal.groupPolicy = open | allowlist | disabled`
- `channels.signal.groupAllowFrom` ควบคุมว่ากลุ่มหรือผู้ส่งใดสามารถทริกเกอร์การตอบกลับในกลุ่มเมื่อกำหนด `allowlist` โดยรายการสามารถเป็น ID กลุ่ม Signal (แบบดิบ, `group:<id>` หรือ `signal:group:<id>`) หมายเลขโทรศัพท์ของผู้ส่ง ค่า `uuid:<id>` หรือ `*`
- `channels.signal.groups["<group-id>" | "*"]` สามารถแทนที่ลักษณะการทำงานของกลุ่มด้วย `requireMention`, `tools` และ `toolsBySender`
- ใช้ `channels.signal.accounts.<id>.groups` สำหรับการแทนค่ารายบัญชีในการตั้งค่าแบบหลายบัญชี
- การเพิ่มกลุ่ม Signal ลงในรายการอนุญาตผ่าน `groupAllowFrom` ไม่ได้ปิดเกตการกล่าวถึงโดยอัตโนมัติ รายการ `channels.signal.groups["<group-id>"]` ที่กำหนดค่าไว้อย่างเฉพาะเจาะจงจะประมวลผลทุกข้อความในกลุ่ม เว้นแต่จะตั้งค่า `requireMention=true`
- เมื่อใช้ `requireMention=true` การ @mention แบบเนทีฟของ Signal จะจับคู่จากเมทาดาทาการกล่าวถึงแบบมีโครงสร้างกับหมายเลขโทรศัพท์หรือ `accountUuid` ของบัญชีบอต ส่วน `mentionPatterns` ที่กำหนดค่าไว้ยังคงเป็นทางเลือกสำรองแบบข้อความธรรมดา
- หมายเหตุขณะรันไทม์: หากไม่มี `channels.signal` โดยสมบูรณ์ รันไทม์จะใช้ `groupPolicy="allowlist"` เป็นทางเลือกสำรองสำหรับการตรวจสอบกลุ่ม (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

กลุ่มที่ใช้เกตการกล่าวถึงพร้อมบริบทแบบจำกัด:

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

ข้อความกลุ่มที่อนุญาตแต่ไม่ได้กล่าวถึงบอตจะไม่มีการตอบกลับ และจะถูกเก็บไว้เฉพาะในหน้าต่างประวัติที่รอดำเนินการซึ่งมีขนาดจำกัด เมื่อมีการ @mention แบบเนทีฟหรือการกล่าวถึงด้วยข้อความสำรองในภายหลังเพื่อเรียกใช้บอต OpenClaw จะรวมบริบทล่าสุดดังกล่าวและตอบกลับไปยังกลุ่มเดิม เนื้อหาไฟล์แนบที่ข้ามจะไม่ถูกดาวน์โหลด แต่อาจปรากฏเป็นตัวยึดสื่อแบบย่อในบริบทที่รอดำเนินการเท่านั้น

## วิธีการทำงาน (ลักษณะการทำงาน)

- โหมดเนทีฟ: `signal-cli` ทำงานเป็นดีมอน โดย Gateway อ่านเหตุการณ์ผ่าน SSE
- โหมดคอนเทนเนอร์: Gateway ส่งผ่าน REST API และรับผ่าน WebSocket
- ข้อความขาเข้าจะถูกปรับให้อยู่ในรูปแบบเอนเวโลปช่องทางที่ใช้ร่วมกัน
- การตอบกลับจะถูกส่งกลับไปยังหมายเลขหรือกลุ่มเดิมเสมอ
- การตอบกลับข้อความขาเข้าจะมีเมทาดาทาการอ้างข้อความแบบเนทีฟของ Signal เมื่อแบ็กเอนด์ยอมรับการประทับเวลาขาเข้าและผู้เขียน หากเมทาดาทาการอ้างข้อความหายไปหรือถูกปฏิเสธ OpenClaw จะส่งการตอบกลับเป็นข้อความปกติ
- กำหนดค่าการใช้การอ้างข้อความแบบเนทีฟด้วย `channels.signal.replyToMode = off | first | all | batched` หรือ `channels.signal.replyToModeByChatType.direct/group` สำหรับการแทนค่าตามประเภทแชท ค่าในระดับบัญชีภายใต้ `channels.signal.accounts.<id>` มีลำดับความสำคัญสูงกว่า

## สื่อและขีดจำกัด

- ข้อความขาออกจะถูกแบ่งเป็นส่วนตาม `channels.signal.textChunkLimit` (ค่าเริ่มต้น 4000)
- การแบ่งส่วนตามบรรทัดใหม่ซึ่งเป็นทางเลือก: ตั้งค่า `channels.signal.streaming.chunkMode="newline"` เพื่อแบ่งตรงบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- รองรับไฟล์แนบ (ดึงข้อมูล base64 จาก `signal-cli`)
- ไฟล์แนบบันทึกเสียงใช้ชื่อไฟล์ `signal-cli` เป็น MIME สำรองเมื่อไม่มี `contentType` เพื่อให้การถอดเสียงยังสามารถจำแนกเสียงบันทึก AAC ได้
- ขีดจำกัดสื่อเริ่มต้น: `channels.signal.mediaMaxMb` (ค่าเริ่มต้น 8)
- ใช้ `channels.signal.ignoreAttachments` เพื่อข้ามการดาวน์โหลดสื่อ
- บริบทประวัติกลุ่มใช้ `channels.signal.historyLimit` (หรือ `channels.signal.accounts.*.historyLimit`) โดยใช้ `messages.groupChat.historyLimit` เป็นค่าสำรอง ตั้งค่า `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)

## สถานะกำลังพิมพ์และใบตอบรับการอ่าน

- **ตัวบ่งชี้สถานะกำลังพิมพ์**: OpenClaw ส่งสัญญาณกำลังพิมพ์ผ่าน `signal-cli sendTyping` และรีเฟรชสัญญาณระหว่างที่กำลังสร้างการตอบกลับ
- **ใบตอบรับการอ่าน**: เมื่อ `channels.signal.sendReadReceipts` เป็น true OpenClaw จะส่งต่อใบตอบรับการอ่านสำหรับ DM ที่อนุญาต
- `signal-cli` ไม่เปิดเผยใบตอบรับการอ่านสำหรับกลุ่ม

## รีแอ็กชันสถานะวงจรการทำงาน

ตั้งค่า `messages.statusReactions.enabled: true` เพื่อให้ Signal แสดงวงจรรีแอ็กชันสถานะที่ใช้ร่วมกัน ได้แก่ อยู่ในคิว/กำลังคิด/เครื่องมือ/Compaction/เสร็จสิ้น/ข้อผิดพลาด สำหรับรอบการทำงานขาเข้า Signal ใช้การประทับเวลาของข้อความขาเข้าเป็นเป้าหมายรีแอ็กชัน ส่วนรีแอ็กชันในกลุ่มจะถูกส่งโดยใช้ ID กลุ่ม Signal พร้อมผู้ส่งเดิมเป็นผู้เขียนเป้าหมาย

รีแอ็กชันสถานะยังต้องมีรีแอ็กชันตอบรับและ `messages.ackReactionScope` ที่ตรงกัน (`direct`, `group-all`, `group-mentions` หรือ `all`) ตั้งค่า `channels.signal.reactionLevel: "off"` เพื่อปิดใช้งานรีแอ็กชันสถานะของ Signal

`messages.removeAckAfterReply: true` จะล้างรีแอ็กชันสถานะสุดท้ายหลังจากระยะเวลาคงสถานะที่กำหนด มิฉะนั้น Signal จะคืนค่ารีแอ็กชันตอบรับเริ่มต้นหลังสถานะเสร็จสิ้น/ข้อผิดพลาดสุดท้าย

## รีแอ็กชัน (เครื่องมือข้อความ)

ใช้ `message action=react` ร่วมกับ `channel=signal`

- เป้าหมาย: E.164 หรือ UUID ของผู้ส่ง (ใช้ `uuid:<id>` จากผลลัพธ์การจับคู่ หรือใช้ UUID เดี่ยว ๆ ก็ได้)
- `messageId` คือการประทับเวลาของ Signal สำหรับข้อความที่กำลังส่งรีแอ็กชัน
- รีแอ็กชันในกลุ่มต้องใช้ `targetAuthor` หรือ `targetAuthorUuid`

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

การกำหนดค่า:

- `channels.signal.actions.reactions`: เปิด/ปิดการทำงานของรีแอ็กชัน (ค่าเริ่มต้น true)
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น `minimal`)
  - `off`/`ack` ปิดใช้งานรีแอ็กชันของเอเจนต์ (เครื่องมือข้อความ `react` จะแสดงข้อผิดพลาด)
  - `minimal`/`extensive` เปิดใช้งานรีแอ็กชันของเอเจนต์และตั้งค่าระดับคำแนะนำ
- การแทนค่าตามบัญชี: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`

## รีแอ็กชันการอนุมัติ

พรอมต์การอนุมัติ exec และ Plugin ของ Signal ใช้บล็อกการกำหนดเส้นทางระดับบนสุด `approvals.exec` และ `approvals.plugin` Signal ไม่มีบล็อก `channels.signal.execApprovals`

- `👍` อนุมัติหนึ่งครั้ง
- `👎` ปฏิเสธ
- ใช้ `/approve <id> allow-always` เมื่อคำขอเสนอการอนุมัติแบบถาวร

การประมวลผลรีแอ็กชันการอนุมัติต้องมีผู้อนุมัติ Signal ที่ระบุไว้อย่างชัดเจนจาก `channels.signal.allowFrom`, `channels.signal.defaultTo` หรือฟิลด์ระดับบัญชีที่ตรงกัน พรอมต์การอนุมัติ exec โดยตรงในแชทเดียวกันยังคงสามารถระงับ `/approve` สำรองในเครื่องที่ซ้ำกันได้โดยไม่ต้องระบุผู้อนุมัติ ส่วนการอนุมัติในกลุ่มที่ไม่มีผู้อนุมัติจะยังคงแสดงตัวเลือกสำรองในเครื่อง

## รีแอ็กชันสำหรับคำถาม

สำหรับพรอมต์ `ask_user` ที่มีคำถามแบบเลือกได้หนึ่งตัวเลือกซึ่งไม่เป็นความลับจำนวนหนึ่งข้อ และมีตัวเลือกหนึ่งถึงสี่รายการ Signal จะแสดง `1️⃣` ถึง `4️⃣` ข้างป้ายกำกับตัวเลือก ส่งรีแอ็กชันด้วยหมายเลขที่ตรงกันไปยังพรอมต์ที่ส่งแล้วเพื่อตอบคำถาม OpenClaw จะตรวจสอบว่ารีแอ็กชันมีเป้าหมายเป็นข้อความที่บอตเขียน จากนั้นจับคู่หมายเลขกับตัวเลือกมาตรฐานผ่าน Gateway การแตะที่หมดอายุหรือซ้ำจะถูกละเว้น พรอมต์ที่มีหลายคำถาม เลือกได้หลายรายการ และกรอกข้อความอิสระจะยังคงตอบได้ด้วยข้อความเท่านั้น โดยกฎการอนุญาตผู้ส่งของ DM/กลุ่ม Signal ตามปกติจะใช้ตรวจสอบสิทธิ์ผู้ส่ง

## เป้าหมายการส่ง (CLI/Cron)

- DM: `signal:+15551234567` (หรือ E.164 แบบธรรมดา)
- DM แบบ UUID: `uuid:<id>` (หรือ UUID เดี่ยว ๆ)
- กลุ่ม: `signal:group:<groupId>`
- ชื่อผู้ใช้: `username:<name>` (หากบัญชี Signal รองรับ)

## นามแฝง

กำหนดค่านามแฝงเพื่อใช้ชื่อที่คงที่กับเป้าหมาย Signal ที่ใช้ซ้ำ นามแฝงเป็นเพียงการกำหนดค่าฝั่ง OpenClaw เท่านั้น โดยจะไม่สร้างหรือแก้ไขรายชื่อติดต่อ Signal

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

ใช้นามแฝงได้ทุกตำแหน่งที่ยอมรับเป้าหมายการส่งของ Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "การปรับใช้เสร็จสมบูรณ์แล้ว"
```

นามแฝงตามบัญชีจะสืบทอดนามแฝงระดับบนสุด และสามารถเพิ่มหรือแทนที่ชื่อได้:

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

`openclaw directory peers list --channel signal` และ `openclaw directory groups list --channel signal` แสดงรายการนามแฝงที่กำหนดค่าไว้ ไดเรกทอรี Signal อ้างอิงจากการกำหนดค่า โดยจะไม่สอบถามรายชื่อติดต่อ Signal แบบสดหรือแก้ไขบัญชี Signal

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

ข้อผิดพลาดที่พบบ่อย:

- เข้าถึงดีมอนได้แต่ไม่มีการตอบกลับ: ตรวจสอบการตั้งค่าบัญชี/ดีมอน (`httpUrl`, `account`) และโหมดการรับ
- DM ถูกละเว้น: ผู้ส่งกำลังรอการอนุมัติการจับคู่
- ข้อความกลุ่มถูกละเว้น: เกตการตรวจสอบผู้ส่งกลุ่ม/การกล่าวถึงขัดขวางการส่ง
- เกิดข้อผิดพลาดในการตรวจสอบการกำหนดค่าหลังการแก้ไข: เรียกใช้ `openclaw doctor --fix`
- ไม่มี Signal ในข้อมูลวินิจฉัย: ยืนยัน `channels.signal.enabled: true`

การตรวจสอบเพิ่มเติม:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

สำหรับขั้นตอนการคัดแยกปัญหา: [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)

## หมายเหตุด้านความปลอดภัย

- `signal-cli` จัดเก็บคีย์บัญชีไว้ในเครื่อง (โดยทั่วไปคือ `~/.local/share/signal-cli/data/`)
- สำรองข้อมูลสถานะบัญชี Signal ก่อนย้ายหรือสร้างเซิร์ฟเวอร์ใหม่
- คงค่า `channels.signal.dmPolicy: "pairing"` ไว้ เว้นแต่ต้องการเปิดการเข้าถึง DM ให้กว้างขึ้นอย่างชัดเจน
- จำเป็นต้องยืนยันผ่าน SMS เฉพาะสำหรับขั้นตอนการลงทะเบียนหรือการกู้คืน แต่การสูญเสียการควบคุมหมายเลข/บัญชีอาจทำให้การลงทะเบียนใหม่ซับซ้อนขึ้น

## ข้อมูลอ้างอิงการกำหนดค่า (Signal)

การกำหนดค่าทั้งหมด: [การกำหนดค่า](/th/gateway/configuration)

ตัวเลือกผู้ให้บริการ:

- `channels.signal.enabled`: เปิด/ปิดการเริ่มต้นช่องทาง
- `channels.signal.apiMode`: `auto | native | container` (ค่าเริ่มต้น: อัตโนมัติ) ดู[โหมดคอนเทนเนอร์](#container-mode-bbernhardsignal-cli-rest-api)
- `channels.signal.account`: E.164 สำหรับบัญชีบอต
- `channels.signal.accountUuid`: UUID ของบัญชีบอตซึ่งระบุหรือไม่ก็ได้ สำหรับการตรวจหา @mention แบบเนทีฟและการป้องกันลูป
- `channels.signal.cliPath`: พาธไปยัง `signal-cli`
- `channels.signal.configPath`: ไดเรกทอรี `signal-cli --config` ซึ่งระบุหรือไม่ก็ได้
- `channels.signal.httpUrl`: URL แบบเต็มของดีมอน (แทนที่โฮสต์/พอร์ต)
- `channels.signal.httpHost`, `channels.signal.httpPort`: ที่อยู่ผูกของดีมอน (ค่าเริ่มต้น `127.0.0.1:8080`)
- `channels.signal.autoStart`: สร้างดีมอนโดยอัตโนมัติ (ค่าเริ่มต้นเป็น true หากไม่ได้ตั้งค่า `httpUrl`)
- `channels.signal.startupTimeoutMs`: ระยะหมดเวลารอการเริ่มต้นเป็นมิลลิวินาที (ต่ำสุด 1000, สูงสุด 120000; ค่าเริ่มต้น 30000)
- `channels.signal.receiveMode`: `on-start | manual`
- `channels.signal.ignoreAttachments`: ข้ามการดาวน์โหลดไฟล์แนบ
- `channels.signal.ignoreStories`: ละเว้นสตอรีจากดีมอน
- `channels.signal.sendReadReceipts`: ส่งต่อใบตอบรับการอ่าน
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: การจับคู่)
- `channels.signal.allowFrom`: รายการอนุญาตสำหรับ DM (E.164 หรือ `uuid:<id>`) `open` ต้องใช้ `"*"` Signal ไม่มีชื่อผู้ใช้ ให้ใช้รหัสโทรศัพท์/UUID
- `channels.signal.aliases`: นามแฝงฝั่ง OpenClaw สำหรับเป้าหมายการส่ง DM หรือกลุ่ม
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: รายการอนุญาต)
- `channels.signal.groupAllowFrom`: รายการอนุญาตของกลุ่ม รองรับรหัสกลุ่ม Signal (แบบดิบ, `group:<id>` หรือ `signal:group:<id>`), หมายเลข E.164 ของผู้ส่ง หรือค่า `uuid:<id>`
- `channels.signal.groups`: การตั้งค่าแทนที่รายกลุ่มที่ใช้รหัสกลุ่ม Signal (หรือ `"*"`) เป็นคีย์ ฟิลด์ที่รองรับ: `requireMention`, `tools`, `toolsBySender`
- `channels.signal.accounts.<id>.groups`: เวอร์ชันรายบัญชีของ `channels.signal.groups` สำหรับการตั้งค่าแบบหลายบัญชี
- `channels.signal.accounts.<id>.aliases`: นามแฝงรายบัญชี ซึ่งผสานกับนามแฝงระดับบนสุด
- `channels.signal.replyToMode`: โหมดอ้างข้อความตอบกลับแบบเนทีฟ `off | first | all | batched` (ค่าเริ่มต้น: `all`)
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: การตั้งค่าแทนที่การอ้างข้อความตอบกลับแบบเนทีฟตามประเภทแชต
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: การตั้งค่าแทนที่การอ้างข้อความตอบกลับรายบัญชี
- `channels.signal.historyLimit`: จำนวนข้อความกลุ่มสูงสุดที่จะรวมเป็นบริบท (0 หมายถึงปิดใช้งาน)
- `channels.signal.dmHistoryLimit`: ขีดจำกัดประวัติ DM ในหน่วยเทิร์นของผู้ใช้ การตั้งค่าแทนที่รายผู้ใช้: `channels.signal.dms["<phone_or_uuid>"].historyLimit`
- `channels.signal.textChunkLimit`: ขนาดส่วนข้อความขาออกเป็นจำนวนอักขระ (ค่าเริ่มต้น 4000)
- `channels.signal.streaming.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแบ่งที่บรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- `channels.signal.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า/ขาออกเป็น MB (ค่าเริ่มต้น 8)
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น `minimal`) ดู[รีแอ็กชัน](#reactions-message-tool)
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (ค่าเริ่มต้น `own`) - เวลาที่เอเจนต์ได้รับแจ้งเกี่ยวกับรีแอ็กชันขาเข้าจากผู้อื่น
- `channels.signal.reactionAllowlist`: ผู้ส่งที่รีแอ็กชันของพวกเขาจะแจ้งเอเจนต์เมื่อ `reactionNotifications: "allowlist"`
- `channels.signal.streaming.block.enabled`, `channels.signal.streaming.block.coalesce`: ตัวควบคุมการสตรีมโหมดบล็อกที่ใช้ร่วมกันระหว่างช่องทาง ดู[การสตรีม](/th/concepts/streaming)

ตัวเลือกส่วนกลางที่เกี่ยวข้อง:

- `agents.list[].groupChat.mentionPatterns` (ทางเลือกสำรองแบบข้อความธรรมดา โดยระบบจะตรวจหา @mention แบบเนทีฟของ Signal จากข้อมูลเมตาที่มีโครงสร้างเมื่อตั้งค่าข้อมูลระบุตัวตนของบัญชีบอตแล้ว)
- `messages.groupChat.mentionPatterns` (ทางเลือกสำรองส่วนกลาง)
- `messages.responsePrefix`

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) - ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตน DM และขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) - ลักษณะการทำงานของแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
