---
read_when:
    - การตั้งค่าการรองรับ Signal
    - การดีบักการส่ง/รับของ Signal
summary: การรองรับ Signal ผ่าน signal-cli (เดมอนแบบเนทีฟหรือคอนเทนเนอร์ bbernhard), เส้นทางการตั้งค่า และรูปแบบหมายเลข
title: Signal
x-i18n:
    generated_at: "2026-07-12T15:47:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: db2497d0d6dcdc61cf9f7388929f9ee107602c9ed97bd248e20e67519e878b8b
    source_path: channels/signal.md
    workflow: 16
---

Signal เป็น Plugin ช่องทางที่ดาวน์โหลดได้ (`@openclaw/signal`) Gateway สื่อสารกับ `signal-cli` ผ่าน HTTP โดยใช้ได้ทั้งดีมอนแบบเนทีฟ (JSON-RPC + SSE) หรือคอนเทนเนอร์ [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket) OpenClaw ไม่ได้ฝัง libsignal ไว้ภายใน

## รูปแบบการใช้หมายเลข (โปรดอ่านส่วนนี้ก่อน)

- Gateway เชื่อมต่อกับ **อุปกรณ์ Signal** ซึ่งก็คือบัญชี `signal-cli`
- การเรียกใช้บอตบน **บัญชี Signal ส่วนตัวของคุณ** จะทำให้บอตเพิกเฉยต่อข้อความของคุณเอง (เพื่อป้องกันการวนซ้ำ)
- หากต้องการให้ "ฉันส่งข้อความหาบอตแล้วบอตตอบกลับ" ให้ใช้ **หมายเลขแยกสำหรับบอต**

## การติดตั้ง

```bash
openclaw plugins install @openclaw/signal
```

ข้อกำหนด Plugin ที่ไม่ระบุแหล่งจะลองใช้ ClawHub ก่อน แล้วจึงใช้ npm เป็นทางเลือกสำรอง บังคับแหล่งที่มาได้ด้วย `openclaw plugins install clawhub:@openclaw/signal` หรือ `npm:@openclaw/signal` คำสั่ง `plugins install` จะลงทะเบียนและเปิดใช้งาน Plugin จึงไม่ต้องมีขั้นตอน `enable` แยกต่างหาก ดูกฎการติดตั้งทั่วไปที่ [Plugin](/th/tools/plugin)

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
    ตัวช่วยสร้างจะตรวจสอบว่า `signal-cli` อยู่ใน `PATH` หรือไม่ และหากไม่พบ จะเสนอให้ติดตั้ง โดยดาวน์โหลดบิลด์ GraalVM แบบเนทีฟอย่างเป็นทางการสำหรับ Linux x86-64 หรือติดตั้งผ่าน Homebrew บน macOS และสถาปัตยกรรมอื่น จากนั้นจะให้ป้อนหมายเลขบอตและพาธของ `signal-cli`
  </Step>
  <Step title="เชื่อมโยงหรือลงทะเบียนบัญชี">
    - **เชื่อมโยงด้วย QR (เร็วที่สุด):** `signal-cli link -n "OpenClaw"` แล้วสแกนด้วย Signal ดู[เส้นทาง A](#setup-path-a-link-existing-signal-account-qr)
    - **ลงทะเบียนด้วย SMS:** ใช้หมายเลขเฉพาะพร้อมแคปช่าและการยืนยันทาง SMS ดู[เส้นทาง B](#setup-path-b-register-dedicated-bot-number-sms-linux)

  </Step>
  <Step title="ตรวจสอบและจับคู่">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    ส่งข้อความส่วนตัวครั้งแรกและอนุมัติการจับคู่ด้วย `openclaw pairing approve signal <CODE>`
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
| `configPath` | ไดเรกทอรีการกำหนดค่าของ signal-cli ที่ส่งผ่านเป็น `--config`        |
| `dmPolicy`   | นโยบายการเข้าถึงข้อความส่วนตัว (แนะนำ `pairing`)          |
| `allowFrom`  | หมายเลขโทรศัพท์หรือค่า `uuid:<id>` ที่ได้รับอนุญาตให้ส่งข้อความส่วนตัว |

การรองรับหลายบัญชี: ใช้ `channels.signal.accounts` พร้อมการกำหนดค่าแยกตามบัญชีและ `name` ซึ่งระบุหรือไม่ก็ได้ ดูรูปแบบที่ใช้ร่วมกันได้ที่ [ช่องทางแบบหลายบัญชี](/th/gateway/config-channels#multi-account-all-channels)

## สิ่งที่ระบบนี้ทำ

- การกำหนดเส้นทางแบบแน่นอน: ข้อความตอบกลับจะส่งกลับไปยัง Signal เสมอ
- ข้อความส่วนตัวใช้เซสชันหลักของเอเจนต์ร่วมกัน ส่วนกลุ่มจะแยกออกจากกัน (`agent:<agentId>:signal:group:<groupId>`)
- โดยค่าเริ่มต้น Signal อาจเขียนการอัปเดตการกำหนดค่าที่เกิดจาก `/config set|unset` (ต้องใช้ `commands.config: true`) ปิดได้ด้วย `channels.signal.configWrites: false`

## เส้นทางการตั้งค่า A: เชื่อมโยงบัญชี Signal ที่มีอยู่ (QR)

1. ติดตั้ง `signal-cli` (บิลด์ JVM หรือแบบเนทีฟ) หรือให้ `openclaw channels add` ติดตั้งให้คุณ
2. เชื่อมโยงบัญชีบอตด้วย `signal-cli link -n "OpenClaw"` แล้วสแกน QR ใน Signal
3. กำหนดค่า Signal และเริ่ม Gateway

## เส้นทางการตั้งค่า B: ลงทะเบียนหมายเลขเฉพาะสำหรับบอต (SMS, Linux)

ใช้วิธีนี้สำหรับหมายเลขบอตเฉพาะแทนการเชื่อมโยงบัญชีแอป Signal ที่มีอยู่ ขั้นตอนด้านล่างผ่านการทดสอบบน Ubuntu 24

1. เตรียมหมายเลขที่รับ SMS ได้ (หรือรับการยืนยันด้วยเสียงสำหรับโทรศัพท์พื้นฐาน) หมายเลขเฉพาะสำหรับบอตช่วยหลีกเลี่ยงข้อขัดแย้งของบัญชีหรือเซสชัน
2. ติดตั้ง `signal-cli` บนโฮสต์ของ Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

หากใช้บิลด์ JVM (`signal-cli-${VERSION}.tar.gz`) ให้ติดตั้ง JRE ก่อน อัปเดต `signal-cli` ให้เป็นปัจจุบันเสมอ เนื่องจากโครงการต้นทางระบุว่ารุ่นเก่าอาจใช้งานไม่ได้เมื่อ API ของเซิร์ฟเวอร์ Signal เปลี่ยนแปลง

3. ลงทะเบียนและยืนยันหมายเลข:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

หากต้องใช้แคปช่า (ต้องเข้าถึงเบราว์เซอร์เพื่อทำขั้นตอนนี้ให้เสร็จ):

1. เปิด `https://signalcaptchas.org/registration/generate.html`
2. ทำแคปช่าให้เสร็จ แล้วคัดลอกปลายทางลิงก์ `signalcaptcha://...` จาก "Open Signal"
3. หากทำได้ ให้เรียกใช้จาก IP ภายนอกเดียวกับเซสชันของเบราว์เซอร์ (โทเค็นแคปช่าหมดอายุอย่างรวดเร็ว)
4. ลงทะเบียนและยืนยันทันที:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. กำหนดค่า OpenClaw เริ่ม Gateway ใหม่ และตรวจสอบช่องทาง:

```bash
# หากคุณเรียกใช้ Gateway เป็นบริการ systemd ของผู้ใช้:
systemctl --user restart openclaw-gateway.service

# จากนั้นตรวจสอบ:
openclaw doctor
openclaw channels status --probe
```

5. จับคู่ผู้ส่งข้อความส่วนตัวของคุณ:
   - ส่งข้อความใดก็ได้ไปยังหมายเลขของบอต
   - อนุมัติบนเซิร์ฟเวอร์ด้วย `openclaw pairing approve signal <PAIRING_CODE>`
   - บันทึกหมายเลขบอตเป็นรายชื่อติดต่อในโทรศัพท์เพื่อหลีกเลี่ยงข้อความ "Unknown contact"

<Warning>
การลงทะเบียนบัญชีหมายเลขโทรศัพท์ด้วย `signal-cli` อาจยกเลิกการยืนยันตัวตนของเซสชันแอป Signal หลักสำหรับหมายเลขนั้น ควรใช้หมายเลขเฉพาะสำหรับบอต หรือใช้โหมดเชื่อมโยงด้วย QR เพื่อคงการตั้งค่าแอปในโทรศัพท์ที่มีอยู่
</Warning>

แหล่งอ้างอิงจากโครงการต้นทาง:

- README ของ `signal-cli`: `https://github.com/AsamK/signal-cli`
- ขั้นตอนแคปช่า: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- ขั้นตอนการเชื่อมโยง: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## โหมดดีมอนภายนอก (httpUrl)

หากต้องการจัดการ `signal-cli` ด้วยตนเอง (การเริ่มต้น JVM แบบเย็นที่ช้า การเตรียมคอนเทนเนอร์ หรือ CPU ที่ใช้ร่วมกัน) ให้เรียกใช้ดีมอนแยกต่างหากและกำหนดให้ OpenClaw ชี้ไปที่ดีมอนนั้น:

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

การตั้งค่านี้จะข้ามการสร้างกระบวนการอัตโนมัติและการรอเริ่มต้นของ OpenClaw สำหรับการเริ่มต้นแบบสร้างกระบวนการอัตโนมัติที่ช้า ให้ตั้งค่า `channels.signal.startupTimeoutMs`

## โหมดคอนเทนเนอร์ (bbernhard/signal-cli-rest-api)

แทนที่จะเรียกใช้ `signal-cli` แบบเนทีฟ ให้ใช้คอนเทนเนอร์ Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) ซึ่งห่อหุ้ม `signal-cli` ไว้หลังอินเทอร์เฟซ REST + WebSocket

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
      apiMode: "container", // หรือ "auto" เพื่อตรวจหาโดยอัตโนมัติ
    },
  },
}
```

`apiMode` ควบคุมว่า OpenClaw จะใช้โพรโทคอลใด:

| ค่า         | ลักษณะการทำงาน                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (ค่าเริ่มต้น) ตรวจสอบการรับส่งทั้งสองแบบ โดยการสตรีมจะตรวจสอบการรับผ่าน WebSocket ของคอนเทนเนอร์    |
| `"native"`    | บังคับใช้ signal-cli แบบเนทีฟ (JSON-RPC ที่ `/api/v1/rpc`, SSE ที่ `/api/v1/events`)         |
| `"container"` | บังคับใช้คอนเทนเนอร์ bbernhard (REST ที่ `/v2/send`, WebSocket ที่ `/v1/receive/{account}`) |

เมื่อ `apiMode` เป็น `"auto"` OpenClaw จะแคชโหมดที่ตรวจพบไว้ 30 วินาทีต่อ URL ของดีมอน เพื่อหลีกเลี่ยงการตรวจสอบซ้ำ (แบบเนทีฟจะมีลำดับความสำคัญเมื่อการรับส่งทั้งสองแบบทำงานปกติ) ระบบจะเลือกการรับจากคอนเทนเนอร์สำหรับการสตรีมก็ต่อเมื่อ `/v1/receive/{account}` อัปเกรดเป็น WebSocket สำเร็จ ซึ่งต้องใช้ `MODE=json-rpc`

โหมดคอนเทนเนอร์รองรับการดำเนินการ Signal เช่นเดียวกับโหมดเนทีฟในกรณีที่คอนเทนเนอร์มี API ที่สอดคล้องกัน ได้แก่ การส่ง การรับ ไฟล์แนบ ตัวบ่งชี้การพิมพ์ ใบตอบรับการอ่านหรือการดู ปฏิกิริยา กลุ่ม และข้อความที่มีการจัดรูปแบบ OpenClaw จะแปลงการเรียก RPC แบบเนทีฟของ Signal เป็นเพย์โหลด REST ของคอนเทนเนอร์ รวมถึง ID กลุ่ม `group.{base64(internal_id)}` และ `text_mode: "styled"` สำหรับข้อความที่จัดรูปแบบ

หมายเหตุด้านการปฏิบัติงาน:

- ใช้ `autoStart: false` กับโหมดคอนเทนเนอร์ OpenClaw ไม่ควรสร้างดีมอนแบบเนทีฟเมื่อเลือก `apiMode: "container"`
- ใช้ `MODE=json-rpc` สำหรับการรับข้อความ `MODE=normal` อาจทำให้ `/v1/about` ดูเหมือนทำงานปกติ แต่ `/v1/receive/{account}` จะไม่อัปเกรดเป็น WebSocket ดังนั้น OpenClaw จะไม่เลือกการสตรีมรับจากคอนเทนเนอร์ในโหมด `auto`
- ตั้งค่า `apiMode: "container"` เมื่อ `httpUrl` ชี้ไปยัง REST API ของ bbernhard, `"native"` เมื่อชี้ไปยัง JSON-RPC/SSE ของ `signal-cli` แบบเนทีฟ และ `"auto"` เมื่อรูปแบบการปรับใช้สามารถเปลี่ยนแปลงได้
- การดาวน์โหลดไฟล์แนบในโหมดคอนเทนเนอร์ใช้ขีดจำกัดจำนวนไบต์ของสื่อเช่นเดียวกับโหมดเนทีฟ การตอบกลับที่มีขนาดใหญ่เกินไปจะถูกปฏิเสธก่อนบัฟเฟอร์ครบทั้งหมดเมื่อเซิร์ฟเวอร์ส่ง `Content-Length` และจะถูกปฏิเสธระหว่างการสตรีมในกรณีอื่น

## การควบคุมการเข้าถึง (ข้อความส่วนตัว + กลุ่ม)

ข้อความส่วนตัว:

- ค่าเริ่มต้น: `channels.signal.dmPolicy = "pairing"`
- ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่ และข้อความจะถูกเพิกเฉยจนกว่าจะได้รับอนุมัติ (รหัสหมดอายุหลังจาก 1 ชั่วโมง)
- อนุมัติผ่าน `openclaw pairing list signal` และ `openclaw pairing approve signal <CODE>`
- การจับคู่เป็นวิธีแลกเปลี่ยนโทเค็นเริ่มต้นสำหรับข้อความส่วนตัวของ Signal รายละเอียด: [การจับคู่](/th/channels/pairing)
- ผู้ส่งที่มีเฉพาะ UUID (จาก `sourceUuid`) จะถูกจัดเก็บเป็น `uuid:<id>` ใน `channels.signal.allowFrom`

กลุ่ม:

- `channels.signal.groupPolicy = open | allowlist | disabled`
- `channels.signal.groupAllowFrom` ควบคุมว่ากลุ่มหรือผู้ส่งใดสามารถเรียกให้ตอบกลับในกลุ่มได้เมื่อตั้งค่า `allowlist` รายการสามารถเป็น ID กลุ่ม Signal (แบบดิบ, `group:<id>` หรือ `signal:group:<id>`), หมายเลขโทรศัพท์ของผู้ส่ง, ค่า `uuid:<id>` หรือ `*`
- `channels.signal.groups["<group-id>" | "*"]` สามารถแทนที่ลักษณะการทำงานของกลุ่มด้วย `requireMention`, `tools` และ `toolsBySender`
- ใช้ `channels.signal.accounts.<id>.groups` สำหรับการแทนที่แยกตามบัญชีในการตั้งค่าแบบหลายบัญชี
- การเพิ่มกลุ่มลงในรายการอนุญาตผ่าน `groupAllowFrom` ไม่ได้ปิดข้อกำหนดให้กล่าวถึงโดยอัตโนมัติ รายการ `channels.signal.groups["<group-id>"]` ที่กำหนดค่าไว้เฉพาะจะประมวลผลทุกข้อความในกลุ่ม เว้นแต่จะตั้งค่า `requireMention: true` อย่างชัดเจน
- หมายเหตุขณะทำงาน: หากไม่มี `channels.signal` เลย ระบบขณะทำงานจะย้อนกลับไปใช้ `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้ว่าจะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

## วิธีการทำงาน (ลักษณะการทำงาน)

- โหมดเนทีฟ: `signal-cli` ทำงานเป็นดีมอน และ Gateway อ่านเหตุการณ์ผ่าน SSE
- โหมดคอนเทนเนอร์: Gateway ส่งผ่าน REST API และรับผ่าน WebSocket
- ข้อความขาเข้าจะถูกปรับให้อยู่ในรูปแบบซองข้อมูลช่องทางที่ใช้ร่วมกัน
- ข้อความตอบกลับจะถูกส่งกลับไปยังหมายเลขหรือกลุ่มเดิมเสมอ
- การตอบกลับข้อความขาเข้าจะมีข้อมูลเมตาการอ้างข้อความแบบเนทีฟของ Signal เมื่อแบ็กเอนด์ยอมรับเวลาและผู้เขียนของข้อความขาเข้า หากไม่มีข้อมูลเมตาการอ้างข้อความหรือข้อมูลดังกล่าวถูกปฏิเสธ OpenClaw จะส่งคำตอบเป็นข้อความปกติ
- กำหนดค่าการใช้การอ้างข้อความแบบเนทีฟด้วย `channels.signal.replyToMode = off | first | all | batched` หรือ `channels.signal.replyToModeByChatType.direct/group` สำหรับการแทนที่ตามประเภทแชต ค่าระดับบัญชีภายใต้ `channels.signal.accounts.<id>` มีลำดับความสำคัญสูงกว่า

## สื่อและขีดจำกัด

- ข้อความขาออกจะถูกแบ่งเป็นส่วนตาม `channels.signal.textChunkLimit` (ค่าเริ่มต้น 4000)
- การแบ่งส่วนตามบรรทัดใหม่แบบไม่บังคับ: ตั้งค่า `channels.signal.chunkMode="newline"` เพื่อแบ่งตรงบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- รองรับไฟล์แนบ (ดึงข้อมูล base64 จาก `signal-cli`)
- ไฟล์แนบบันทึกเสียงจะใช้ชื่อไฟล์จาก `signal-cli` เป็น MIME สำรองเมื่อไม่มี `contentType` เพื่อให้การถอดเสียงยังจำแนกบันทึกเสียง AAC ได้
- ขีดจำกัดสื่อเริ่มต้น: `channels.signal.mediaMaxMb` (ค่าเริ่มต้น 8)
- ใช้ `channels.signal.ignoreAttachments` เพื่อข้ามการดาวน์โหลดสื่อ
- บริบทประวัติกลุ่มใช้ `channels.signal.historyLimit` (หรือ `channels.signal.accounts.*.historyLimit`) โดยใช้ `messages.groupChat.historyLimit` เป็นค่าสำรอง ตั้งเป็น `0` เพื่อปิดใช้งาน (ค่าเริ่มต้น 50)

## สถานะกำลังพิมพ์และใบตอบรับการอ่าน

- **ตัวบ่งชี้สถานะกำลังพิมพ์**: OpenClaw ส่งสัญญาณกำลังพิมพ์ผ่าน `signal-cli sendTyping` และรีเฟรชสัญญาณระหว่างกำลังสร้างคำตอบ
- **ใบตอบรับการอ่าน**: เมื่อ `channels.signal.sendReadReceipts` เป็น true OpenClaw จะส่งต่อใบตอบรับการอ่านสำหรับ DM ที่ได้รับอนุญาต
- `signal-cli` ไม่เปิดให้เข้าถึงใบตอบรับการอ่านสำหรับกลุ่ม

## รีแอ็กชันสถานะวงจรการทำงาน

ตั้งค่า `messages.statusReactions.enabled: true` เพื่อให้ Signal แสดงวงจรรีแอ็กชันร่วม ได้แก่ อยู่ในคิว/กำลังคิด/เครื่องมือ/Compaction/เสร็จสิ้น/ข้อผิดพลาด สำหรับข้อความขาเข้า Signal ใช้เวลาประทับของข้อความขาเข้าเป็นเป้าหมายของรีแอ็กชัน ส่วนรีแอ็กชันในกลุ่มจะส่งโดยใช้ ID กลุ่ม Signal พร้อมกำหนดผู้ส่งเดิมเป็นผู้เขียนเป้าหมาย

รีแอ็กชันสถานะยังต้องมีรีแอ็กชันรับทราบและค่า `messages.ackReactionScope` ที่ตรงกัน (`direct`, `group-all`, `group-mentions` หรือ `all`) ตั้งค่า `channels.signal.reactionLevel: "off"` เพื่อปิดใช้รีแอ็กชันสถานะของ Signal

`messages.removeAckAfterReply: true` จะล้างรีแอ็กชันสถานะสุดท้ายหลังพ้นระยะเวลาคงไว้ที่กำหนด มิฉะนั้น Signal จะคืนค่ารีแอ็กชันรับทราบเริ่มต้นหลังสถานะเสร็จสิ้น/ข้อผิดพลาดสุดท้าย

## รีแอ็กชัน (เครื่องมือข้อความ)

ใช้ `message action=react` ร่วมกับ `channel=signal`

- เป้าหมาย: E.164 หรือ UUID ของผู้ส่ง (ใช้ `uuid:<id>` จากผลลัพธ์การจับคู่ หรือใช้ UUID เปล่าก็ได้)
- `messageId` คือเวลาประทับ Signal ของข้อความที่คุณต้องการแสดงรีแอ็กชัน
- รีแอ็กชันในกลุ่มต้องระบุ `targetAuthor` หรือ `targetAuthorUuid`

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

การกำหนดค่า:

- `channels.signal.actions.reactions`: เปิด/ปิดการดำเนินการรีแอ็กชัน (ค่าเริ่มต้น true)
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น `minimal`)
  - `off`/`ack` ปิดใช้รีแอ็กชันของเอเจนต์ (เครื่องมือข้อความ `react` จะแสดงข้อผิดพลาด)
  - `minimal`/`extensive` เปิดใช้รีแอ็กชันของเอเจนต์และกำหนดระดับคำแนะนำ
- การกำหนดค่าแทนที่รายบัญชี: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`

## รีแอ็กชันการอนุมัติ

พรอมต์การอนุมัติการดำเนินการและ Plugin ของ Signal ใช้บล็อกการกำหนดเส้นทางระดับบนสุด `approvals.exec` และ `approvals.plugin` Signal ไม่มีบล็อก `channels.signal.execApprovals`

- `👍` อนุมัติหนึ่งครั้ง
- `👎` ปฏิเสธ
- ใช้ `/approve <id> allow-always` เมื่อคำขอมีตัวเลือกการอนุมัติแบบถาวร

การประมวลผลรีแอ็กชันการอนุมัติต้องมีผู้อนุมัติ Signal ที่ระบุชัดเจนจาก `channels.signal.allowFrom`, `channels.signal.defaultTo` หรือฟิลด์ระดับบัญชีที่ตรงกัน พรอมต์การอนุมัติการดำเนินการโดยตรงภายในแชตเดียวกันยังคงซ่อน `/approve` สำรองภายในที่ซ้ำกันได้โดยไม่ต้องระบุผู้อนุมัติ ส่วนการอนุมัติในกลุ่มที่ไม่มีผู้อนุมัติจะยังแสดงตัวเลือกสำรองภายใน

## เป้าหมายการส่ง (CLI/Cron)

- DM: `signal:+15551234567` (หรือ E.164 แบบธรรมดา)
- DM ด้วย UUID: `uuid:<id>` (หรือ UUID เปล่า)
- กลุ่ม: `signal:group:<groupId>`
- ชื่อผู้ใช้: `username:<name>` (หากบัญชี Signal ของคุณรองรับ)

## นามแฝง

กำหนดค่านามแฝงเพื่อใช้ชื่อที่คงที่สำหรับเป้าหมาย Signal ที่ใช้งานเป็นประจำ นามแฝงเป็นเพียงการกำหนดค่าฝั่ง OpenClaw เท่านั้น โดยจะไม่สร้างหรือแก้ไขรายชื่อติดต่อ Signal

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
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

นามแฝงรายบัญชีจะสืบทอดนามแฝงระดับบนสุด และสามารถเพิ่มหรือแทนที่ชื่อได้:

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

`openclaw directory peers list --channel signal` และ `openclaw directory groups list --channel signal` จะแสดงนามแฝงที่กำหนดค่าไว้ ไดเรกทอรี Signal อ้างอิงจากการกำหนดค่า โดยจะไม่สอบถามรายชื่อติดต่อ Signal แบบสดหรือแก้ไขบัญชี Signal

## การแก้ไขปัญหา

เริ่มจากเรียกใช้คำสั่งตามลำดับนี้:

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

- เข้าถึงดีมอนได้แต่ไม่มีการตอบกลับ: ตรวจสอบการตั้งค่าบัญชี/ดีมอน (`httpUrl`, `account`) และโหมดรับข้อมูล
- DM ถูกละเว้น: ผู้ส่งกำลังรอการอนุมัติการจับคู่
- ข้อความกลุ่มถูกละเว้น: การควบคุมตามผู้ส่ง/การกล่าวถึงของกลุ่มปิดกั้นการส่ง
- เกิดข้อผิดพลาดในการตรวจสอบความถูกต้องของการกำหนดค่าหลังแก้ไข: เรียกใช้ `openclaw doctor --fix`
- ไม่พบ Signal ในข้อมูลวินิจฉัย: ยืนยันว่า `channels.signal.enabled: true`

การตรวจสอบเพิ่มเติม:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

สำหรับขั้นตอนการคัดแยกปัญหา: [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)

## หมายเหตุด้านความปลอดภัย

- `signal-cli` จัดเก็บคีย์บัญชีไว้ภายในเครื่อง (โดยทั่วไปอยู่ที่ `~/.local/share/signal-cli/data/`)
- สำรองข้อมูลสถานะบัญชี Signal ก่อนย้ายเซิร์ฟเวอร์หรือสร้างระบบใหม่
- คงค่า `channels.signal.dmPolicy: "pairing"` ไว้ เว้นแต่คุณต้องการเปิดการเข้าถึง DM ให้กว้างขึ้นอย่างชัดเจน
- การยืนยันผ่าน SMS จำเป็นเฉพาะขั้นตอนการลงทะเบียนหรือการกู้คืน แต่การสูญเสียการควบคุมหมายเลข/บัญชีอาจทำให้การลงทะเบียนใหม่ซับซ้อนขึ้น

## ข้อมูลอ้างอิงการกำหนดค่า (Signal)

การกำหนดค่าทั้งหมด: [การกำหนดค่า](/th/gateway/configuration)

ตัวเลือกผู้ให้บริการ:

- `channels.signal.enabled`: เปิด/ปิดการเริ่มต้นช่องทาง
- `channels.signal.apiMode`: `auto | native | container` (ค่าเริ่มต้น: auto) ดู[โหมดคอนเทนเนอร์](#container-mode-bbernhardsignal-cli-rest-api)
- `channels.signal.account`: E.164 สำหรับบัญชีบอต
- `channels.signal.cliPath`: พาธไปยัง `signal-cli`
- `channels.signal.configPath`: ไดเรกทอรี `signal-cli --config` ที่ไม่บังคับ
- `channels.signal.httpUrl`: URL แบบเต็มของดีมอน (แทนที่โฮสต์/พอร์ต)
- `channels.signal.httpHost`, `channels.signal.httpPort`: การผูกดีมอน (ค่าเริ่มต้น `127.0.0.1:8080`)
- `channels.signal.autoStart`: เริ่มดีมอนอัตโนมัติ (ค่าเริ่มต้น true หากไม่ได้ตั้งค่า `httpUrl`)
- `channels.signal.startupTimeoutMs`: ระยะหมดเวลารอการเริ่มต้นในหน่วยมิลลิวินาที (ขั้นต่ำ 1000, สูงสุด 120000; ค่าเริ่มต้น 30000)
- `channels.signal.receiveMode`: `on-start | manual`
- `channels.signal.ignoreAttachments`: ข้ามการดาวน์โหลดไฟล์แนบ
- `channels.signal.ignoreStories`: ละเว้นสตอรีจากดีมอน
- `channels.signal.sendReadReceipts`: ส่งต่อใบตอบรับการอ่าน
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.signal.allowFrom`: รายการอนุญาต DM (E.164 หรือ `uuid:<id>`) ค่า `open` ต้องใช้ `"*"` Signal ไม่มีชื่อผู้ใช้ ให้ใช้ ID โทรศัพท์/UUID
- `channels.signal.aliases`: นามแฝงฝั่ง OpenClaw สำหรับเป้าหมายการส่ง DM หรือกลุ่ม
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: allowlist)
- `channels.signal.groupAllowFrom`: รายการอนุญาตของกลุ่ม รองรับ ID กลุ่ม Signal (แบบดิบ, `group:<id>` หรือ `signal:group:<id>`), หมายเลข E.164 ของผู้ส่ง หรือค่า `uuid:<id>`
- `channels.signal.groups`: การกำหนดค่าแทนที่รายกลุ่มที่ใช้ ID กลุ่ม Signal (หรือ `"*"`) เป็นคีย์ ฟิลด์ที่รองรับ: `requireMention`, `tools`, `toolsBySender`
- `channels.signal.accounts.<id>.groups`: `channels.signal.groups` เวอร์ชันรายบัญชีสำหรับการตั้งค่าแบบหลายบัญชี
- `channels.signal.accounts.<id>.aliases`: นามแฝงรายบัญชี ซึ่งผสานกับนามแฝงระดับบนสุด
- `channels.signal.replyToMode`: โหมดการอ้างคำตอบแบบเนทีฟ `off | first | all | batched` (ค่าเริ่มต้น: `all`)
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: การกำหนดค่าแทนที่การอ้างคำตอบแบบเนทีฟตามประเภทแชต
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: การกำหนดค่าแทนที่การอ้างคำตอบรายบัญชี
- `channels.signal.historyLimit`: จำนวนข้อความกลุ่มสูงสุดที่จะรวมเป็นบริบท (0 ปิดใช้งาน)
- `channels.signal.dmHistoryLimit`: ขีดจำกัดประวัติ DM ในหน่วยรอบข้อความของผู้ใช้ การกำหนดค่าแทนที่รายผู้ใช้: `channels.signal.dms["<phone_or_uuid>"].historyLimit`
- `channels.signal.textChunkLimit`: ขนาดส่วนข้อความขาออกเป็นจำนวนอักขระ (ค่าเริ่มต้น 4000)
- `channels.signal.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแบ่งตรงบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- `channels.signal.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า/ขาออกในหน่วย MB (ค่าเริ่มต้น 8)
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น `minimal`) ดู[รีแอ็กชัน](#reactions-message-tool)
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (ค่าเริ่มต้น `own`) - กำหนดว่าเอเจนต์จะได้รับการแจ้งเตือนรีแอ็กชันขาเข้าจากผู้อื่นเมื่อใด
- `channels.signal.reactionAllowlist`: ผู้ส่งที่รีแอ็กชันของพวกเขาจะแจ้งเตือนเอเจนต์เมื่อ `reactionNotifications: "allowlist"`
- `channels.signal.blockStreaming`, `channels.signal.blockStreamingCoalesce`: การควบคุมการสตรีมแบบบล็อกที่ใช้ร่วมกันระหว่างช่องทาง ดู[การสตรีม](/th/concepts/streaming)

ตัวเลือกส่วนกลางที่เกี่ยวข้อง:

- `agents.list[].groupChat.mentionPatterns` (Signal ไม่รองรับการกล่าวถึงแบบเนทีฟ)
- `messages.groupChat.mentionPatterns` (ค่าสำรองส่วนกลาง)
- `messages.responsePrefix`

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) - ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) - การยืนยันตัวตนและขั้นตอนการจับคู่ DM
- [กลุ่ม](/th/channels/groups) - พฤติกรรมแชตกลุ่มและการควบคุมตามการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) - การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) - รูปแบบการเข้าถึงและการเสริมความปลอดภัย
