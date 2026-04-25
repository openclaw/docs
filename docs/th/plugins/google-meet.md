---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw เข้าร่วมการโทร Google Meet ติดต่อฝ่ายขาย to=functions.read  კომენტary  天天中彩票人工json  аԥсാദനം code  尚度  ಇಲ್ಲ path?
    - คุณต้องการให้เอเจนต์ OpenClaw สร้างการโทร Google Meet ใหม่
    - คุณกำลังกำหนดค่า Chrome, Chrome node หรือ Twilio เป็นทรานสปอร์ตสำหรับ Google Meet
summary: 'Google Meet Plugin: เข้าร่วม URL ของ Google Meet ที่ระบุชัดเจนผ่าน Chrome หรือ Twilio พร้อมค่าเริ่มต้นของเสียงแบบเรียลไทม์'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-04-25T13:53:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3329ea25e94eb20403464d041cd34de731b7620deeac6b32248655e885cd3729
    source_path: plugins/google-meet.md
    workflow: 15
---

การรองรับผู้เข้าร่วม Google Meet สำหรับ OpenClaw — Plugin นี้ออกแบบให้ชัดเจนโดยเจตนา:

- เข้าร่วมได้เฉพาะ URL `https://meet.google.com/...` ที่ระบุไว้อย่างชัดเจนเท่านั้น
- สามารถสร้าง Meet space ใหม่ผ่าน Google Meet API แล้วจึงเข้าร่วม
  URL ที่ส่งกลับมาได้
- เสียงแบบ `realtime` เป็นโหมดค่าเริ่มต้น
- เสียงแบบเรียลไทม์สามารถเรียกกลับเข้าสู่เอเจนต์ OpenClaw เต็มรูปแบบได้เมื่อจำเป็นต้องใช้
  การให้เหตุผลเชิงลึกหรือเครื่องมือ
- เอเจนต์เลือกพฤติกรรมการเข้าร่วมผ่าน `mode`: ใช้ `realtime` สำหรับการ
  ฟัง/พูดตอบกลับแบบสด หรือ `transcribe` เพื่อเข้าร่วม/ควบคุมเบราว์เซอร์โดยไม่ใช้
  สะพานเสียงเรียลไทม์
- การยืนยันตัวตนเริ่มต้นจาก Google OAuth ส่วนบุคคล หรือ Chrome profile ที่ลงชื่อเข้าใช้ไว้แล้ว
- ไม่มีการประกาศขอความยินยอมโดยอัตโนมัติ
- แบ็กเอนด์เสียงของ Chrome ค่าเริ่มต้นคือ `BlackHole 2ch`
- Chrome สามารถทำงานในเครื่องหรือบน node host ที่จับคู่ไว้ก็ได้
- Twilio รับหมายเลข dial-in พร้อม PIN หรือชุด DTMF แบบไม่บังคับ
- คำสั่ง CLI คือ `googlemeet`; `meet` ถูกสงวนไว้สำหรับเวิร์กโฟลว์
  teleconference ของเอเจนต์ในวงกว้างกว่า

## เริ่มต้นอย่างรวดเร็ว

ติดตั้ง dependency เสียงในเครื่อง และกำหนดค่า provider เสียงเรียลไทม์ฝั่งแบ็กเอนด์
OpenAI เป็นค่าเริ่มต้น; Google Gemini Live ก็ใช้งานได้เช่นกันด้วย
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` จะติดตั้งอุปกรณ์เสียงเสมือน `BlackHole 2ch` ตัวติดตั้งของ
Homebrew ต้องรีบูตก่อนที่ macOS จะมองเห็นอุปกรณ์นี้ได้:

```bash
sudo reboot
```

หลังรีบูต ให้ตรวจสอบทั้งสองส่วน:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

เปิดใช้งาน Plugin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

ตรวจสอบการตั้งค่า:

```bash
openclaw googlemeet setup
```

เอาต์พุตของ setup ถูกออกแบบให้อ่านได้โดยเอเจนต์ มันจะรายงาน Chrome profile,
audio bridge, การตรึง node, delayed realtime intro และเมื่อกำหนด
Twilio delegation ไว้แล้ว จะรายงานด้วยว่า Plugin `voice-call` และข้อมูลรับรอง Twilio พร้อมหรือไม่
ให้ถือว่าการตรวจสอบใด ๆ ที่มี `ok: false` เป็นตัวบล็อกก่อนจะขอให้เอเจนต์เข้าร่วม
ใช้ `openclaw googlemeet setup --json` สำหรับสคริปต์หรือเอาต์พุตแบบ machine-readable

เข้าร่วมการประชุม:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

หรือให้เอเจนต์เข้าร่วมผ่านเครื่องมือ `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

สร้างการประชุมใหม่และเข้าร่วม:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

สร้างเฉพาะ URL โดยไม่เข้าร่วม:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` มี 2 เส้นทาง:

- การสร้างผ่าน API: ใช้เมื่อมีการกำหนดค่า Google Meet OAuth credentials ไว้แล้ว นี่คือ
  เส้นทางที่กำหนดแน่นอนได้มากที่สุดและไม่ขึ้นกับสถานะ UI ของเบราว์เซอร์
- fallback ผ่านเบราว์เซอร์: ใช้เมื่อไม่มี OAuth credentials OpenClaw จะใช้
  Chrome node ที่ตรึงไว้ เปิด `https://meet.google.com/new`, รอให้ Google เปลี่ยนเส้นทาง
  ไปยัง URL ที่มี meeting code จริง แล้วจึงคืน URL นั้น เส้นทางนี้ต้องให้
  Chrome profile ของ OpenClaw บน node ลงชื่อเข้าใช้ Google ไว้แล้ว
  ระบบอัตโนมัติของเบราว์เซอร์จะจัดการกับพรอมต์ไมโครโฟนครั้งแรกของ Meet เอง; พรอมต์นี้
  จะไม่ถูกนับเป็นความล้มเหลวของการล็อกอิน Google
  ทั้งโฟลว์ join และ create จะพยายามใช้แท็บ Meet ที่มีอยู่แล้วซ้ำก่อนเปิดแท็บใหม่ การจับคู่จะละเลย query string ที่ไม่สำคัญ เช่น `authuser` ดังนั้นการลองใหม่ของเอเจนต์
  ควรโฟกัสการประชุมที่เปิดอยู่แล้วแทนการสร้างแท็บ Chrome ที่สอง

เอาต์พุตของคำสั่ง/เครื่องมือจะมีฟิลด์ `source` (`api` หรือ `browser`) เพื่อให้เอเจนต์
อธิบายได้ว่าใช้เส้นทางใด `create` จะเข้าร่วมการประชุมใหม่โดยค่าเริ่มต้นและ
คืน `joined: true` พร้อม join session หากต้องการสร้างเฉพาะ URL ให้ใช้
`create --no-join` บน CLI หรือส่ง `"join": false` ให้เครื่องมือ

หรือบอกเอเจนต์ว่า: "สร้าง Google Meet, เข้าร่วมด้วยเสียงแบบ realtime และส่ง
ลิงก์มาให้ฉัน" เอเจนต์ควรเรียก `google_meet` ด้วย `action: "create"` แล้ว
แชร์ `meetingUri` ที่ส่งกลับมา

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

สำหรับการเข้าร่วมแบบ observe-only/browser-control ให้ตั้ง `"mode": "transcribe"` ซึ่ง
จะไม่เริ่มสะพาน duplex realtime model ดังนั้นมันจะไม่พูดตอบกลับเข้าไปใน
การประชุม

ระหว่างเซสชันแบบ realtime, สถานะของ `google_meet` จะรวมสุขภาพของเบราว์เซอร์และ audio bridge
เช่น `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamp ขาเข้า/ขาออกล่าสุด,
ตัวนับไบต์ และสถานะ bridge ปิด หากมีพรอมต์ของ Meet ที่ปลอดภัยปรากฏขึ้น
ระบบอัตโนมัติของเบราว์เซอร์จะจัดการเมื่อทำได้ พรอมต์สำหรับการล็อกอิน, การอนุมัติจากโฮสต์
และสิทธิ์ของเบราว์เซอร์/ระบบปฏิบัติการ จะถูกรายงานเป็น manual action พร้อมเหตุผลและ
ข้อความให้เอเจนต์ส่งต่อ

Chrome จะเข้าร่วมในฐานะ Chrome profile ที่ลงชื่อเข้าใช้อยู่ ใน Meet ให้เลือก
`BlackHole 2ch` สำหรับเส้นทางไมโครโฟน/ลำโพงที่ OpenClaw ใช้งาน สำหรับเสียง duplex ที่สะอาด
ให้ใช้อุปกรณ์เสมือนแยกกันหรือกราฟแบบ Loopback; อุปกรณ์ BlackHole เพียงตัวเดียว
เพียงพอสำหรับ smoke test แรก แต่สามารถเกิดเสียงสะท้อนได้

### Local gateway + Parallels Chrome

คุณ **ไม่** จำเป็นต้องมี OpenClaw Gateway เต็มรูปแบบหรือ model API key ภายใน macOS VM
เพียงเพื่อให้ VM เป็นเจ้าของ Chrome ให้รัน Gateway และเอเจนต์ในเครื่องหลัก แล้วรัน
node host ภายใน VM เปิดใช้งาน bundled Plugin บน VM หนึ่งครั้งเพื่อให้ node
โฆษณาคำสั่ง Chrome:

สิ่งที่รันที่ไหน:

- โฮสต์ Gateway: OpenClaw Gateway, เวิร์กสเปซเอเจนต์, model/API keys, realtime
  provider และ config ของ Google Meet Plugin
- Parallels macOS VM: OpenClaw CLI/node host, Google Chrome, SoX, BlackHole 2ch,
  และ Chrome profile ที่ลงชื่อเข้าใช้ Google แล้ว
- สิ่งที่ไม่ต้องมีใน VM: Gateway service, agent config, OpenAI/GPT key หรือการตั้งค่า
  model provider

ติดตั้ง dependency ใน VM:

```bash
brew install blackhole-2ch sox
```

รีบูต VM หลังติดตั้ง BlackHole เพื่อให้ macOS มองเห็น `BlackHole 2ch`:

```bash
sudo reboot
```

หลังรีบูต ให้ตรวจสอบว่า VM มองเห็นอุปกรณ์เสียงและคำสั่ง SoX ได้:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

ติดตั้งหรืออัปเดต OpenClaw ใน VM จากนั้นเปิดใช้งาน bundled Plugin ที่นั่น:

```bash
openclaw plugins enable google-meet
```

เริ่ม node host ใน VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

หาก `<gateway-host>` เป็น LAN IP และคุณไม่ได้ใช้ TLS, node จะปฏิเสธ
plaintext WebSocket เว้นแต่คุณจะ opt in สำหรับ trusted private network นั้น:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

ใช้ environment variable เดียวกันเมื่อติดตั้ง node เป็น LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` เป็น process environment ไม่ใช่การตั้งค่าใน
`openclaw.json` `openclaw node install` จะเก็บมันไว้ใน LaunchAgent
environment เมื่อมันมีอยู่ในคำสั่งติดตั้ง

อนุมัติ node จากโฮสต์ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

ยืนยันว่า Gateway มองเห็น node และ node โฆษณาทั้ง `googlemeet.chrome`
และ browser capability/`browser.proxy`:

```bash
openclaw nodes status
```

กำหนดเส้นทาง Meet ผ่าน node นั้นบนโฮสต์ Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

ตอนนี้เข้าร่วมได้ตามปกติจากโฮสต์ Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

หรือบอกเอเจนต์ให้ใช้เครื่องมือ `google_meet` ด้วย `transport: "chrome-node"`

สำหรับ smoke test แบบคำสั่งเดียวที่สร้างหรือใช้เซสชันเดิมซ้ำ พูดวลีที่กำหนดไว้
และพิมพ์สุขภาพของเซสชัน:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

ระหว่าง join ระบบอัตโนมัติของเบราว์เซอร์ OpenClaw จะกรอกชื่อ guest, คลิก Join/Ask
to join และยอมรับตัวเลือก "Use microphone" ของ Meet ครั้งแรกเมื่อพรอมต์นั้น
ปรากฏขึ้น ระหว่างการสร้างการประชุมผ่านเบราว์เซอร์อย่างเดียว มันยังสามารถดำเนินต่อ
ผ่านพรอมต์เดียวกันโดยไม่ใช้ไมโครโฟนได้ หาก Meet ไม่แสดงปุ่ม use-microphone
หาก browser profile ยังไม่ได้ลงชื่อเข้าใช้, Meet กำลังรอการอนุมัติจากโฮสต์,
Chrome ต้องการสิทธิ์ไมโครโฟน/กล้อง หรือ Meet ค้างอยู่ที่พรอมต์ที่ระบบอัตโนมัติ
แก้ไขไม่ได้ ผลลัพธ์ของ join/test-speech จะรายงาน
`manualActionRequired: true` พร้อม `manualActionReason` และ
`manualActionMessage` เอเจนต์ควรหยุดลอง join ซ้ำ รายงานข้อความนั้นตามจริง
พร้อม `browserUrl`/`browserTitle` ปัจจุบัน และลองใหม่เฉพาะหลังจากทำ
การดำเนินการด้วยตนเองในเบราว์เซอร์เสร็จแล้ว

หากละ `chromeNode.node`, OpenClaw จะเลือกอัตโนมัติเฉพาะเมื่อมี node ที่เชื่อมต่ออยู่เพียงหนึ่งตัว
ที่โฆษณาทั้ง `googlemeet.chrome` และ browser control หาก
มีหลาย node ที่รองรับเชื่อมต่ออยู่ ให้ตั้ง `chromeNode.node` เป็น node id,
display name หรือ remote IP

การตรวจสอบความล้มเหลวที่พบบ่อย:

- `No connected Google Meet-capable node`: เริ่ม `openclaw node run` ใน VM,
  อนุมัติการจับคู่ และตรวจสอบว่าได้รัน `openclaw plugins enable google-meet` และ
  `openclaw plugins enable browser` ใน VM แล้ว นอกจากนี้ยืนยันว่า
  โฮสต์ Gateway อนุญาตทั้งสองคำสั่งของ node ด้วย
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`
- `BlackHole 2ch audio device not found on the node`: ติดตั้ง `blackhole-2ch`
  ใน VM และรีบูต VM
- Chrome เปิดได้แต่เข้าร่วมไม่ได้: ลงชื่อเข้าใช้ browser profile ภายใน VM หรือ
  คง `chrome.guestName` ไว้สำหรับการเข้าร่วมแบบ guest ระบบ auto-join แบบ guest ใช้
  ระบบอัตโนมัติของเบราว์เซอร์ OpenClaw ผ่าน node browser proxy; ตรวจสอบว่า
  config ของ node browser ชี้ไปยัง profile ที่คุณต้องการ เช่น
  `browser.defaultProfile: "user"` หรือ existing-session profile แบบมีชื่อ
- แท็บ Meet ซ้ำ: ให้เปิด `chrome.reuseExistingTab: true` ไว้ OpenClaw
  จะเปิดใช้งานแท็บที่มีอยู่แล้วสำหรับ Meet URL เดียวกันก่อนเปิดแท็บใหม่ และ
  การสร้างการประชุมผ่านเบราว์เซอร์จะใช้แท็บ `https://meet.google.com/new`
  หรือแท็บพรอมต์บัญชี Google ที่กำลังดำเนินการอยู่ซ้ำก่อนเปิดแท็บใหม่
- ไม่มีเสียง: ใน Meet ให้กำหนดเส้นทางไมโครโฟน/ลำโพงผ่านเส้นทางอุปกรณ์เสียงเสมือน
  ที่ OpenClaw ใช้; ใช้อุปกรณ์เสมือนแยกกันหรือการกำหนดเส้นทางแบบ Loopback
  เพื่อให้ได้เสียง duplex ที่สะอาด

## หมายเหตุการติดตั้ง

ค่าเริ่มต้นแบบ Chrome realtime ใช้เครื่องมือภายนอก 2 ตัว:

- `sox`: ยูทิลิตีเสียงแบบบรรทัดคำสั่ง Plugin ใช้คำสั่ง `rec` และ `play`
  ของมันสำหรับ audio bridge แบบ G.711 mu-law 8 kHz ตามค่าเริ่มต้น
- `blackhole-2ch`: ไดรเวอร์เสียงเสมือนสำหรับ macOS มันสร้าง
  อุปกรณ์เสียง `BlackHole 2ch` ที่ Chrome/Meet สามารถกำหนดเส้นทางผ่านได้

OpenClaw ไม่ได้ bundle หรือแจกจ่ายแพ็กเกจใดแพ็กเกจหนึ่งเหล่านี้ใหม่ เอกสารแนะนำให้ผู้ใช้
ติดตั้งเป็น dependency ของโฮสต์ผ่าน Homebrew SoX ใช้สัญญาอนุญาต
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole เป็น GPL-3.0 หากคุณสร้าง
installer หรือ appliance ที่ bundle BlackHole ร่วมกับ OpenClaw ให้ตรวจสอบ
เงื่อนไขสัญญาอนุญาตต้นทางของ BlackHole หรือขอใบอนุญาตแยกจาก Existential Audio

## Transports

### Chrome

ทรานสปอร์ต Chrome จะเปิด Meet URL ใน Google Chrome และเข้าร่วมในฐานะ
Chrome profile ที่ลงชื่อเข้าใช้อยู่ บน macOS Plugin จะตรวจสอบ `BlackHole 2ch` ก่อนเปิด
หากมีการกำหนดค่าไว้ มันจะรันคำสั่งตรวจสุขภาพของ audio bridge และคำสั่งเริ่มต้น
ก่อนเปิด Chrome ใช้ `chrome` เมื่อ Chrome/เสียงอยู่บนโฮสต์ Gateway; ใช้
`chrome-node` เมื่อ Chrome/เสียงอยู่บน paired node เช่น Parallels
macOS VM

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

ส่งเสียงไมโครโฟนและลำโพงของ Chrome ผ่านสะพานเสียง OpenClaw ภายในเครื่อง หากไม่ได้ติดตั้ง `BlackHole 2ch` การเข้าร่วมจะล้มเหลวพร้อมข้อผิดพลาดการตั้งค่า แทนที่จะเข้าร่วมแบบเงียบ ๆ โดยไม่มีเส้นทางเสียง

### Twilio

ทรานสปอร์ต Twilio เป็นแผนการโทรแบบเข้มงวดที่มอบหมายให้กับ Plugin Voice Call โดยตรง โดยจะไม่แยกวิเคราะห์หน้า Meet เพื่อค้นหาหมายเลขโทรศัพท์

ใช้วิธีนี้เมื่อไม่สามารถเข้าร่วมผ่าน Chrome ได้ หรือเมื่อคุณต้องการทางเลือกสำรองแบบโทรเข้าผ่านโทรศัพท์ Google Meet ต้องแสดงหมายเลขโทรเข้าและ PIN ของการประชุมให้ใช้งานได้ OpenClaw จะไม่ค้นหาข้อมูลเหล่านั้นจากหน้า Meet

เปิดใช้ Plugin Voice Call บนโฮสต์ Gateway ไม่ใช่บน Chrome Node:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // หรือกำหนด "twilio" หากต้องการให้ Twilio เป็นค่าเริ่มต้น
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

ระบุข้อมูลรับรอง Twilio ผ่าน environment หรือ config การใช้ environment ช่วยเก็บความลับไว้นอก `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

รีสตาร์ทหรือโหลด Gateway ใหม่หลังจากเปิดใช้ `voice-call`; การเปลี่ยนแปลง config ของ Plugin จะไม่ปรากฏในโปรเซส Gateway ที่กำลังรันอยู่จนกว่าจะมีการโหลดใหม่

จากนั้นตรวจสอบยืนยัน:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

เมื่อเชื่อมต่อการมอบหมายให้ Twilio เรียบร้อยแล้ว `googlemeet setup` จะมีการตรวจสอบ `twilio-voice-call-plugin` และ `twilio-voice-call-credentials` ที่สำเร็จ

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

ใช้ `--dtmf-sequence` เมื่อการประชุมต้องใช้ลำดับแบบกำหนดเอง:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth และ preflight

OAuth เป็นทางเลือกสำหรับการสร้างลิงก์ Meet เพราะ `googlemeet create` สามารถถอยกลับไปใช้การทำงานอัตโนมัติผ่านเบราว์เซอร์ได้ กำหนดค่า OAuth เมื่อคุณต้องการการสร้างผ่าน API อย่างเป็นทางการ การ resolve space หรือการตรวจสอบ preflight ของ Meet Media API

การเข้าถึง Google Meet API ใช้ user OAuth: สร้างไคลเอนต์ OAuth ของ Google Cloud ขอ scopes ที่จำเป็น อนุญาตบัญชี Google จากนั้นเก็บ refresh token ที่ได้ไว้ใน config ของ Plugin Google Meet หรือระบุตัวแปร environment `OPENCLAW_GOOGLE_MEET_*`

OAuth ไม่ได้แทนที่เส้นทางการเข้าร่วมผ่าน Chrome ทรานสปอร์ต Chrome และ Chrome-node ยังคงเข้าร่วมผ่านโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้ไว้, BlackHole/SoX และ Node ที่เชื่อมต่ออยู่ เมื่อคุณใช้การเข้าร่วมผ่านเบราว์เซอร์ OAuth ใช้เฉพาะกับเส้นทาง Google Meet API อย่างเป็นทางการเท่านั้น: สร้าง meeting spaces, resolve spaces และรันการตรวจสอบ preflight ของ Meet Media API

### สร้างข้อมูลรับรอง Google

ใน Google Cloud Console:

1. สร้างหรือเลือกโปรเจ็กต์ Google Cloud
2. เปิดใช้ **Google Meet REST API** สำหรับโปรเจ็กต์นั้น
3. กำหนดค่า OAuth consent screen
   - **Internal** ง่ายที่สุดสำหรับองค์กร Google Workspace
   - **External** ใช้ได้กับการตั้งค่าส่วนตัว/ทดสอบ; ขณะที่แอปอยู่ในสถานะ Testing ให้เพิ่มแต่ละบัญชี Google ที่จะอนุญาตแอปเป็นผู้ใช้ทดสอบ
4. เพิ่ม scopes ที่ OpenClaw ร้องขอ:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. สร้าง OAuth client ID
   - ประเภทแอปพลิเคชัน: **Web application**
   - Authorized redirect URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. คัดลอก client ID และ client secret

`meetings.space.created` จำเป็นสำหรับ Google Meet `spaces.create`
`meetings.space.readonly` ช่วยให้ OpenClaw resolve URL/รหัส Meet ไปเป็น spaces ได้
`meetings.conference.media.readonly` ใช้สำหรับ preflight ของ Meet Media API และงานด้านสื่อ; Google อาจกำหนดให้ลงทะเบียน Developer Preview สำหรับการใช้งาน Media API จริง
หากคุณต้องการเพียงการเข้าร่วมผ่าน Chrome บนเบราว์เซอร์เท่านั้น ให้ข้าม OAuth ไปได้เลย

### ออก refresh token

กำหนดค่า `oauth.clientId` และหากต้องการ `oauth.clientSecret` หรือส่งผ่านเป็นตัวแปร environment แล้วรัน:

```bash
openclaw googlemeet auth login --json
```

คำสั่งนี้จะพิมพ์บล็อก config `oauth` ที่มี refresh token โดยใช้ PKCE, localhost callback ที่ `http://localhost:8085/oauth2callback` และรองรับขั้นตอนคัดลอก/วางด้วย `--manual`

ตัวอย่าง:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

ใช้โหมด manual เมื่อเบราว์เซอร์ไม่สามารถเข้าถึง local callback ได้:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

เอาต์พุต JSON ประกอบด้วย:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

เก็บออบเจ็กต์ `oauth` ไว้ใต้ config ของ Plugin Google Meet:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

ควรใช้ตัวแปร environment หากคุณไม่ต้องการเก็บ refresh token ไว้ใน config หากมีทั้งค่าใน config และ environment พร้อมกัน Plugin จะ resolve จาก config ก่อน แล้วค่อย fallback ไปใช้ environment

OAuth consent ครอบคลุมการสร้าง Meet space, การอ่าน Meet space และการอ่านสื่อของ Meet conference หากคุณเคยยืนยันตัวตนก่อนที่จะมีการรองรับการสร้างการประชุม ให้รัน `openclaw googlemeet auth login --json` อีกครั้งเพื่อให้ refresh token มี scope `meetings.space.created`

### ตรวจสอบ OAuth ด้วย doctor

รัน OAuth doctor เมื่อคุณต้องการตรวจสุขภาพแบบรวดเร็วโดยไม่เปิดเผยความลับ:

```bash
openclaw googlemeet doctor --oauth --json
```

คำสั่งนี้จะไม่โหลด Chrome runtime และไม่ต้องมี Chrome Node ที่เชื่อมต่ออยู่ มันจะตรวจสอบว่า config OAuth มีอยู่และ refresh token สามารถออก access token ได้ รายงาน JSON จะมีเฉพาะฟิลด์สถานะ เช่น `ok`, `configured`, `tokenSource`, `expiresAt` และข้อความการตรวจสอบเท่านั้น โดยจะไม่พิมพ์ access token, refresh token หรือ client secret

ผลลัพธ์ที่พบบ่อย:

| การตรวจสอบ           | ความหมาย                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | มี `oauth.clientId` พร้อม `oauth.refreshToken` หรือมี access token ที่แคชไว้แล้ว       |
| `oauth-token`        | access token ที่แคชไว้ยังใช้งานได้ หรือ refresh token ได้ออก access token ใหม่แล้ว       |
| `meet-spaces-get`    | การตรวจสอบเสริมด้วย `--meeting` ได้ resolve Meet space ที่มีอยู่แล้ว                    |
| `meet-spaces-create` | การตรวจสอบเสริมด้วย `--create-space` ได้สร้าง Meet space ใหม่                           |

หากต้องการยืนยันทั้งการเปิดใช้ Google Meet API และ scope `spaces.create` ด้วย ให้รันการตรวจสอบแบบสร้างจริงที่มีผลข้างเคียง:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` จะสร้าง URL Meet ชั่วคราว ใช้เมื่อต้องการยืนยันว่าโปรเจ็กต์ Google Cloud ได้เปิดใช้ Meet API แล้ว และบัญชีที่อนุญาตมี scope `meetings.space.created`

หากต้องการยืนยันสิทธิ์การอ่านสำหรับ meeting space ที่มีอยู่แล้ว:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` และ `resolve-space` ใช้ยืนยันสิทธิ์การอ่านของ space ที่มีอยู่แล้วซึ่งบัญชี Google ที่ได้รับอนุญาตสามารถเข้าถึงได้ หากการตรวจสอบเหล่านี้ส่งกลับ `403` โดยทั่วไปหมายความว่า Google Meet REST API ถูกปิดใช้งาน, refresh token ที่ยินยอมไว้ไม่มี scope ที่จำเป็น หรือบัญชี Google ไม่สามารถเข้าถึง Meet space นั้นได้ หากเกิดข้อผิดพลาดเกี่ยวกับ refresh token ให้รัน `openclaw googlemeet auth login --json` ใหม่และจัดเก็บบล็อก `oauth` ใหม่

ไม่จำเป็นต้องมีข้อมูลรับรอง OAuth สำหรับ browser fallback ในโหมดนั้น การยืนยันตัวตนกับ Google จะมาจากโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้ไว้บน Node ที่เลือก ไม่ได้มาจาก config ของ OpenClaw

ยอมรับตัวแปร environment ต่อไปนี้เป็นค่า fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` หรือ `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` หรือ `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` หรือ
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` หรือ `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` หรือ `GOOGLE_MEET_PREVIEW_ACK`

Resolve URL Meet, รหัส หรือ `spaces/{id}` ผ่าน `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

รัน preflight ก่อนทำงานด้านสื่อ:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

แสดงรายการอาร์ติแฟกต์ของการประชุมและข้อมูลการเข้าร่วม หลังจาก Meet ได้สร้าง conference records แล้ว:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

เมื่อใช้ `--meeting` คำสั่ง `artifacts` และ `attendance` จะใช้ conference record ล่าสุดเป็นค่าเริ่มต้น ส่ง `--all-conference-records` เมื่อคุณต้องการทุก record ที่ยังถูกเก็บไว้สำหรับการประชุมนั้น

Calendar lookup สามารถ resolve URL การประชุมจาก Google Calendar ก่อนอ่านอาร์ติแฟกต์ของ Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` จะค้นหาเหตุการณ์ในปฏิทิน `primary` ของวันนี้ที่มีลิงก์ Google Meet ใช้ `--event <query>` เพื่อค้นหาข้อความของเหตุการณ์ที่ตรงกัน และ `--calendar <id>` สำหรับปฏิทินที่ไม่ใช่ primary Calendar lookup ต้องใช้การเข้าสู่ระบบ OAuth ใหม่ที่มี scope สำหรับอ่านเหตุการณ์ในปฏิทิน `calendar-events` จะแสดงตัวอย่างเหตุการณ์ Meet ที่ตรงกันและทำเครื่องหมายเหตุการณ์ที่ `latest`, `artifacts`, `attendance` หรือ `export` จะเลือก

หากคุณทราบ id ของ conference record อยู่แล้ว ให้ระบุโดยตรง:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

เขียนรายงานที่อ่านง่าย:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` จะส่งกลับเมทาดาทาของ conference record พร้อมเมทาดาทาทรัพยากรของผู้เข้าร่วม การบันทึก ทรานสคริปต์ structured transcript-entry และ smart-note เมื่อ Google เปิดเผยข้อมูลเหล่านั้นสำหรับการประชุม ใช้ `--no-transcript-entries` เพื่อข้ามการค้นหา entries สำหรับการประชุมขนาดใหญ่ `attendance` จะขยายผู้เข้าร่วมเป็นแถว participant-session พร้อมเวลาเห็นครั้งแรก/ครั้งสุดท้าย ระยะเวลารวมของเซสชัน สถานะเข้าเรียนสาย/ออกก่อนเวลา และรวมทรัพยากรผู้เข้าร่วมที่ซ้ำกันตามผู้ใช้ที่ลงชื่อเข้าใช้หรือชื่อที่แสดง ส่ง `--no-merge-duplicates` เพื่อแยกทรัพยากรผู้เข้าร่วมดิบออกจากกัน ใช้ `--late-after-minutes` เพื่อปรับการตรวจจับการเข้าสาย และใช้ `--early-before-minutes` เพื่อปรับการตรวจจับการออกก่อนเวลา

`export` จะเขียนโฟลเดอร์ที่มี `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` และ `manifest.json` `manifest.json` จะบันทึกอินพุตที่เลือก ตัวเลือกการ export conference records ไฟล์เอาต์พุต จำนวน token source Calendar event เมื่อมีการใช้ และคำเตือนการดึงข้อมูลแบบบางส่วน ส่ง `--zip` เพื่อเขียน archive แบบพกพาเพิ่มเติมไว้ข้างโฟลเดอร์ ส่ง `--include-doc-bodies` เพื่อ export ข้อความ Google Docs ของทรานสคริปต์และ smart-note ที่ลิงก์ไว้ผ่าน Google Drive `files.export`; การดำเนินการนี้ต้องใช้การเข้าสู่ระบบ OAuth ใหม่ที่มี scope สำหรับ Drive Meet readonly หากไม่มี `--include-doc-bodies` การ export จะรวมเฉพาะเมทาดาทา Meet และ structured transcript entries เท่านั้น หาก Google ส่งกลับความล้มเหลวของอาร์ติแฟกต์แบบบางส่วน เช่น smart-note listing, transcript-entry หรือข้อผิดพลาด document-body ของ Drive ระบบจะเก็บคำเตือนไว้ใน summary และ manifest แทนที่จะทำให้การ export ทั้งหมดล้มเหลว
ใช้ `--dry-run` เพื่อดึงข้อมูล artifact/attendance ชุดเดียวกันและพิมพ์ manifest JSON โดยไม่สร้างโฟลเดอร์หรือ ZIP ซึ่งมีประโยชน์ก่อนเขียน export ขนาดใหญ่ หรือเมื่อ agent ต้องการเพียงจำนวน records ที่เลือก และคำเตือน

Agents ยังสามารถสร้าง bundle เดียวกันผ่านเครื่องมือ `google_meet` ได้:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

ตั้งค่า `"dryRun": true` เพื่อส่งกลับเฉพาะ export manifest และข้ามการเขียนไฟล์

รัน live smoke แบบมีการป้องกันกับการประชุมจริงที่ยังถูกเก็บไว้:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

environment สำหรับ live smoke:

- `OPENCLAW_LIVE_TEST=1` เปิดใช้ live tests แบบมีการป้องกัน
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` ชี้ไปยัง URL, รหัส หรือ `spaces/{id}` ของ Meet ที่ยังถูกเก็บไว้
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID` ระบุ OAuth client id
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN` ระบุ refresh token
- ตัวเลือกเพิ่มเติม: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` และ `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ใช้ชื่อ fallback เดียวกันโดยไม่มีคำนำหน้า `OPENCLAW_`

live smoke พื้นฐานสำหรับ artifact/attendance ต้องใช้
`https://www.googleapis.com/auth/meetings.space.readonly` และ
`https://www.googleapis.com/auth/meetings.conference.media.readonly` Calendar lookup ต้องใช้ `https://www.googleapis.com/auth/calendar.events.readonly` การ export document-body ของ Drive ต้องใช้
`https://www.googleapis.com/auth/drive.meet.readonly`

สร้าง Meet space ใหม่:

```bash
openclaw googlemeet create
```

คำสั่งนี้จะพิมพ์ `meeting uri` ใหม่ แหล่งที่มา และ join session หากมีข้อมูลรับรอง OAuth ระบบจะใช้ Google Meet API อย่างเป็นทางการ หากไม่มีข้อมูลรับรอง OAuth ระบบจะใช้โปรไฟล์เบราว์เซอร์ที่ลงชื่อเข้าใช้ไว้ของ Chrome node ที่ปักหมุดไว้เป็น fallback Agents สามารถใช้เครื่องมือ `google_meet` พร้อม `action: "create"` เพื่อสร้างและเข้าร่วมในขั้นตอนเดียว สำหรับการสร้างแบบ URL อย่างเดียว ให้ส่ง `"join": false`

ตัวอย่างเอาต์พุต JSON จาก browser fallback:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

หาก browser fallback พบการเข้าสู่ระบบ Google หรือสิ่งกีดขวางด้านสิทธิ์ของ Meet ก่อนที่จะสร้าง URL ได้ เมธอด Gateway จะส่งกลับการตอบสนองที่ล้มเหลว และเครื่องมือ `google_meet` จะส่งกลับรายละเอียดแบบมีโครงสร้างแทนสตริงธรรมดา:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

เมื่อ agent เห็น `manualActionRequired: true` ควรรายงาน `manualActionMessage` พร้อมบริบท browser node/tab และหยุดเปิดแท็บ Meet ใหม่จนกว่าผู้ปฏิบัติงานจะทำขั้นตอนในเบราว์เซอร์เสร็จ

ตัวอย่างเอาต์พุต JSON จาก API create:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

การสร้าง Meet จะเข้าร่วมโดยค่าเริ่มต้น ทรานสปอร์ต Chrome หรือ Chrome-node ยังคงต้องใช้โปรไฟล์ Google Chrome ที่ลงชื่อเข้าใช้ไว้เพื่อเข้าร่วมผ่านเบราว์เซอร์ หากโปรไฟล์ออกจากระบบ OpenClaw จะรายงาน `manualActionRequired: true` หรือข้อผิดพลาด browser fallback และขอให้ผู้ปฏิบัติงานทำการเข้าสู่ระบบ Google ให้เสร็จก่อนลองใหม่

ตั้งค่า `preview.enrollmentAcknowledged: true` หลังจากยืนยันแล้วเท่านั้นว่าโปรเจ็กต์ Cloud, OAuth principal และผู้เข้าร่วมประชุมของคุณได้ลงทะเบียนใน Google Workspace Developer Preview Program สำหรับ Meet media APIs

## Config

เส้นทาง Chrome realtime ทั่วไปต้องการเพียงเปิดใช้ Plugin, BlackHole, SoX และคีย์ของผู้ให้บริการเสียงแบบ realtime ฝั่ง backend เท่านั้น OpenAI เป็นค่าเริ่มต้น; ตั้งค่า `realtime.provider: "google"` เพื่อใช้ Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# หรือ
export GEMINI_API_KEY=...
```

ตั้งค่า Plugin ภายใต้ `plugins.entries.google-meet.config`:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

ค่าเริ่มต้น:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: node id/name/IP แบบเลือกได้สำหรับ `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ชื่อที่ใช้บนหน้าจอผู้เยี่ยมชม Meet แบบยังไม่ลงชื่อเข้าใช้
- `chrome.autoJoin: true`: พยายามกรอกชื่อผู้เยี่ยมชมและคลิก Join Now แบบ best-effort ผ่านการทำงานอัตโนมัติของเบราว์เซอร์ OpenClaw บน `chrome-node`
- `chrome.reuseExistingTab: true`: เปิดใช้งานแท็บ Meet ที่มีอยู่แทนการเปิดแท็บซ้ำ
- `chrome.waitForInCallMs: 20000`: รอให้แท็บ Meet รายงานว่าอยู่ในสายก่อนทริกเกอร์ข้อความแนะนำ realtime
- `chrome.audioInputCommand`: คำสั่ง SoX `rec` ที่เขียนเสียง G.711 mu-law 8 kHz ไปยัง stdout
- `chrome.audioOutputCommand`: คำสั่ง SoX `play` ที่อ่านเสียง G.711 mu-law 8 kHz จาก stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: คำตอบแบบพูดสั้น ๆ พร้อม `openclaw_agent_consult` สำหรับคำตอบที่ลึกขึ้น
- `realtime.introMessage`: ข้อความสั้นแบบพูดสำหรับตรวจความพร้อมเมื่อ realtime bridge เชื่อมต่อ; ตั้งเป็น `""` เพื่อเข้าร่วมแบบเงียบ

ตัวเลือก override เพิ่มเติม:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

config สำหรับ Twilio เท่านั้น:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled` มีค่าเริ่มต้นเป็น `true`; เมื่อใช้ทรานสปอร์ต Twilio ระบบจะมอบหมายการโทร PSTN จริงและ DTMF ให้กับ Plugin Voice Call หากไม่ได้เปิดใช้ `voice-call` Google Meet ยังสามารถตรวจสอบและบันทึกแผนการโทรได้ แต่ไม่สามารถวางสาย Twilio ได้

## Tool

Agents สามารถใช้เครื่องมือ `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

ใช้ `transport: "chrome"` เมื่อ Chrome รันอยู่บนโฮสต์ Gateway ใช้ `transport: "chrome-node"` เมื่อ Chrome รันอยู่บน Node ที่จับคู่ไว้ เช่น Parallels VM ในทั้งสองกรณี โมเดล realtime และ `openclaw_agent_consult` จะรันบนโฮสต์ Gateway ดังนั้นข้อมูลรับรองของโมเดลจะอยู่ที่นั่น

ใช้ `action: "status"` เพื่อแสดงรายการเซสชันที่กำลังใช้งานหรือเพื่อตรวจสอบ session ID ใช้ `action: "speak"` พร้อม `sessionId` และ `message` เพื่อให้ realtime agent พูดได้ทันที ใช้ `action: "test_speech"` เพื่อสร้างหรือใช้เซสชันเดิม ทริกเกอร์วลีที่ทราบแน่นอน และส่งกลับสถานะสุขภาพ `inCall` เมื่อโฮสต์ Chrome สามารถรายงานได้ ใช้ `action: "leave"` เพื่อทำเครื่องหมายว่าเซสชันสิ้นสุดแล้ว

`status` จะรวมสถานะสุขภาพของ Chrome เมื่อมีให้ใช้:

- `inCall`: Chrome ดูเหมือนจะอยู่ภายในการโทร Meet
- `micMuted`: สถานะไมโครโฟนของ Meet แบบ best-effort
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: โปรไฟล์เบราว์เซอร์ต้องมีการเข้าสู่ระบบด้วยตนเอง การอนุมัติเข้าร่วมจากโฮสต์ Meet การให้สิทธิ์ หรือการซ่อมแซมการควบคุมเบราว์เซอร์ก่อนที่การพูดจะทำงานได้
- `providerConnected` / `realtimeReady`: สถานะของ realtime voice bridge
- `lastInputAt` / `lastOutputAt`: เวลาล่าสุดที่พบเสียงจากหรือส่งเสียงไปยัง bridge

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime agent consult

โหมด Chrome realtime ถูกปรับให้เหมาะกับลูปเสียงสด ผู้ให้บริการเสียง realtime จะได้ยินเสียงการประชุมและพูดผ่านสะพานเสียงที่กำหนดไว้ เมื่อโมเดล realtime ต้องการการให้เหตุผลที่ลึกขึ้น ข้อมูลปัจจุบัน หรือเครื่องมือ OpenClaw ตามปกติ ก็สามารถเรียก `openclaw_agent_consult` ได้

เครื่องมือ consult จะรัน OpenClaw agent ปกติอยู่เบื้องหลังพร้อมบริบททรานสคริปต์การประชุมล่าสุด และส่งกลับคำตอบสั้นกระชับสำหรับการพูดในเซสชันเสียง realtime จากนั้นโมเดลเสียงสามารถพูดคำตอบนั้นกลับเข้าไปในการประชุมได้ มันใช้เครื่องมือ realtime consult แบบใช้ร่วมกันเดียวกับ Voice Call

`realtime.toolPolicy` ควบคุมการรัน consult:

- `safe-read-only`: เปิดเผยเครื่องมือ consult และจำกัด regular agent ให้ใช้
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ
  `memory_get`
- `owner`: เปิดเผยเครื่องมือ consult และให้ regular agent ใช้นโยบายเครื่องมือปกติของ agent
- `none`: ไม่เปิดเผยเครื่องมือ consult ให้กับโมเดลเสียง realtime

คีย์เซสชัน consult จะถูกกำหนดขอบเขตตามแต่ละเซสชัน Meet ดังนั้นการเรียก consult ติดตามผลสามารถนำบริบท consult ก่อนหน้ากลับมาใช้ซ้ำได้ระหว่างการประชุมเดียวกัน

หากต้องการบังคับการตรวจความพร้อมแบบพูดหลังจาก Chrome เข้าร่วมการโทรอย่างสมบูรณ์แล้ว:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

สำหรับ smoke แบบเข้าร่วมและพูดครบถ้วน:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## รายการตรวจสอบ live test

ใช้ลำดับนี้ก่อนส่งมอบการประชุมให้ agent แบบไม่ต้องดูแล:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

สถานะที่คาดหวังของ Chrome-node:

- `googlemeet setup` เป็นสีเขียวทั้งหมด
- `googlemeet setup` มี `chrome-node-connected` เมื่อ `chrome-node` เป็นทรานสปอร์ตเริ่มต้น หรือเมื่อมีการปักหมุด node ไว้
- `nodes status` แสดงว่า node ที่เลือกเชื่อมต่ออยู่
- node ที่เลือกประกาศทั้ง `googlemeet.chrome` และ `browser.proxy`
- แท็บ Meet เข้าร่วมการโทร และ `test-speech` ส่งกลับสถานะสุขภาพของ Chrome พร้อม `inCall: true`

สำหรับโฮสต์ Chrome ระยะไกล เช่น Parallels macOS VM นี่คือการตรวจสอบแบบปลอดภัยที่สั้นที่สุดหลังจากอัปเดต Gateway หรือ VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

ซึ่งยืนยันว่า Plugin ของ Gateway ถูกโหลดแล้ว VM node เชื่อมต่อด้วย token ปัจจุบัน และสะพานเสียง Meet พร้อมใช้งานก่อนที่ agent จะเปิดแท็บการประชุมจริง

สำหรับ Twilio smoke ให้ใช้การประชุมที่แสดงรายละเอียดการโทรเข้า:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

สถานะ Twilio ที่คาดหวัง:

- `googlemeet setup` มีการตรวจสอบ `twilio-voice-call-plugin` และ `twilio-voice-call-credentials` เป็นสีเขียว
- `voicecall` พร้อมใช้งานใน CLI หลังจาก Gateway โหลดใหม่
- เซสชันที่ส่งกลับมี `transport: "twilio"` และ `twilio.voiceCallId`
- `googlemeet leave <sessionId>` วางสายการโทรเสียงที่มอบหมายไว้

## การแก้ไขปัญหา

### Agent มองไม่เห็นเครื่องมือ Google Meet

ยืนยันว่าเปิดใช้ Plugin ใน config ของ Gateway แล้ว และโหลด Gateway ใหม่:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

หากคุณเพิ่งแก้ไข `plugins.entries.google-meet` ให้รีสตาร์ทหรือโหลด Gateway ใหม่ agent ที่กำลังทำงานจะเห็นเฉพาะเครื่องมือ Plugin ที่ลงทะเบียนโดยโปรเซส Gateway ปัจจุบันเท่านั้น

### ไม่มี node ที่รองรับ Google Meet เชื่อมต่ออยู่

บนโฮสต์ของ node ให้รัน:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

บนโฮสต์ Gateway ให้อนุมัติ node และตรวจสอบคำสั่ง:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

node ต้องเชื่อมต่ออยู่และแสดง `googlemeet.chrome` พร้อม `browser.proxy` config ของ Gateway ต้องอนุญาตคำสั่ง node เหล่านั้น:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

หาก `googlemeet setup` ล้มเหลวที่ `chrome-node-connected` หรือ log ของ Gateway รายงาน `gateway token mismatch` ให้ติดตั้งใหม่หรือรีสตาร์ท node ด้วย token ปัจจุบันของ Gateway สำหรับ Gateway บน LAN โดยทั่วไปหมายถึง:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

จากนั้นโหลดบริการ node ใหม่และรันอีกครั้ง:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### เบราว์เซอร์เปิดขึ้นแต่ agent เข้าร่วมไม่ได้

รัน `googlemeet test-speech` และตรวจสอบสถานะสุขภาพของ Chrome ที่ส่งกลับ หากรายงาน `manualActionRequired: true` ให้แสดง `manualActionMessage` แก่ผู้ปฏิบัติงาน และหยุดลองใหม่จนกว่าการดำเนินการในเบราว์เซอร์จะเสร็จสิ้น

การดำเนินการด้วยตนเองที่พบบ่อย:

- ลงชื่อเข้าใช้โปรไฟล์ Chrome
- อนุมัติผู้เยี่ยมชมจากบัญชีโฮสต์ของ Meet
- ให้สิทธิ์ไมโครโฟน/กล้องแก่ Chrome เมื่อมีหน้าต่างขอสิทธิ์แบบเนทีฟของ Chrome ปรากฏขึ้น
- ปิดหรือซ่อมแซมกล่องโต้ตอบสิทธิ์ของ Meet ที่ค้างอยู่

อย่ารายงานว่า "ยังไม่ได้ลงชื่อเข้าใช้" เพียงเพราะ Meet แสดง "Do you want people to hear you in the meeting?" นั่นคือหน้าคั่นกลางสำหรับเลือกเสียงของ Meet; OpenClaw จะคลิก **Use microphone** ผ่านการทำงานอัตโนมัติของเบราว์เซอร์เมื่อทำได้ และยังคงรอสถานะการประชุมจริงต่อไป สำหรับ browser fallback แบบสร้างอย่างเดียว OpenClaw อาจคลิก **Continue without microphone** เพราะการสร้าง URL ไม่ต้องใช้เส้นทางเสียง realtime

### การสร้างการประชุมล้มเหลว

`googlemeet create` จะใช้เอนด์พอยต์ Google Meet API `spaces.create` ก่อน เมื่อมีการกำหนดค่าข้อมูลรับรอง OAuth หากไม่มีข้อมูลรับรอง OAuth ระบบจะ fallback ไปยังเบราว์เซอร์ของ Chrome node ที่ปักหมุดไว้ ให้ยืนยันว่า:

- สำหรับการสร้างผ่าน API: มีการกำหนดค่า `oauth.clientId` และ `oauth.refreshToken` หรือมีตัวแปร environment `OPENCLAW_GOOGLE_MEET_*` ที่ตรงกันอยู่
- สำหรับการสร้างผ่าน API: refresh token ถูกออกหลังจากมีการเพิ่มการรองรับการสร้างแล้ว token เก่าอาจไม่มี scope `meetings.space.created`; ให้รัน `openclaw googlemeet auth login --json` ใหม่และอัปเดต config ของ Plugin
- สำหรับ browser fallback: `defaultTransport: "chrome-node"` และ `chromeNode.node` ชี้ไปยัง node ที่เชื่อมต่ออยู่พร้อม `browser.proxy` และ `googlemeet.chrome`
- สำหรับ browser fallback: โปรไฟล์ Chrome ของ OpenClaw บน node นั้นลงชื่อเข้าใช้ Google แล้วและสามารถเปิด `https://meet.google.com/new`
- สำหรับ browser fallback: การลองใหม่จะใช้แท็บ `https://meet.google.com/new` ที่มีอยู่ หรือแท็บข้อความแจ้งบัญชี Google ที่มีอยู่ แทนการเปิดแท็บใหม่ หาก agent หมดเวลา ให้ลองเรียกเครื่องมือใหม่แทนการเปิดแท็บ Meet อีกแท็บด้วยตนเอง
- สำหรับ browser fallback: หากเครื่องมือส่งกลับ `manualActionRequired: true` ให้ใช้ `browser.nodeId`, `browser.targetId`, `browserUrl` และ `manualActionMessage` ที่ส่งกลับมาเพื่อแนะนำผู้ปฏิบัติงาน อย่าลองใหม่แบบวนซ้ำจนกว่าการดำเนินการนั้นจะเสร็จสิ้น
- สำหรับ browser fallback: หาก Meet แสดง "Do you want people to hear you in the meeting?" ให้ปล่อยแท็บนั้นเปิดไว้ OpenClaw ควรคลิก **Use microphone** หรือสำหรับ fallback แบบสร้างอย่างเดียว ให้คลิก **Continue without microphone** ผ่านการทำงานอัตโนมัติของเบราว์เซอร์ แล้วรอ URL Meet ที่สร้างขึ้นต่อไป หากทำไม่ได้ ข้อผิดพลาดควรกล่าวถึง `meet-audio-choice-required` ไม่ใช่ `google-login-required`

### Agent เข้าร่วมแล้วแต่ไม่พูด

ตรวจสอบเส้นทาง realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

ใช้ `mode: "realtime"` สำหรับการฟัง/พูดตอบกลับ `mode: "transcribe"` จะไม่เริ่มสะพานเสียง realtime แบบสองทางโดยตั้งใจ

ตรวจสอบเพิ่มเติมด้วยว่า:

- มีคีย์ผู้ให้บริการ realtime อยู่บนโฮสต์ Gateway เช่น `OPENAI_API_KEY` หรือ `GEMINI_API_KEY`
- มองเห็น `BlackHole 2ch` บนโฮสต์ Chrome
- มี `rec` และ `play` อยู่บนโฮสต์ Chrome
- ไมโครโฟนและลำโพงของ Meet ถูกส่งผ่านเส้นทางเสียงเสมือนที่ OpenClaw ใช้

`googlemeet doctor [session-id]` จะแสดงเซสชัน node สถานะ in-call สาเหตุของ manual action การเชื่อมต่อผู้ให้บริการ realtime ค่า `realtimeReady` กิจกรรมอินพุต/เอาต์พุตเสียง เวลาประทับเสียงล่าสุด ตัวนับไบต์ และ URL ของเบราว์เซอร์ ใช้ `googlemeet status [session-id]` เมื่อต้องการ JSON ดิบ ใช้ `googlemeet doctor --oauth` เมื่อต้องการตรวจสอบการรีเฟรช OAuth ของ Google Meet โดยไม่เปิดเผย token; เพิ่ม `--meeting` หรือ `--create-space` เมื่อต้องการหลักฐานจาก Google Meet API ด้วย

หาก agent หมดเวลาและคุณเห็นว่าแท็บ Meet เปิดอยู่แล้ว ให้ตรวจสอบแท็บนั้นโดยไม่เปิดแท็บใหม่:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

action ของเครื่องมือที่เทียบเท่าคือ `recover_current_tab` มันจะโฟกัสและตรวจสอบแท็บ Meet ที่มีอยู่บน Chrome node ที่กำหนดค่าไว้ โดยจะไม่เปิดแท็บใหม่หรือสร้างเซสชันใหม่ แต่จะรายงานตัวขัดขวางปัจจุบัน เช่น การเข้าสู่ระบบ การอนุมัติเข้าร่วม สิทธิ์ หรือสถานะการเลือกเสียง CLI command จะสื่อสารกับ Gateway ที่กำหนดค่าไว้ ดังนั้น Gateway ต้องกำลังทำงานอยู่และ Chrome node ต้องเชื่อมต่ออยู่

### การตรวจสอบการตั้งค่า Twilio ล้มเหลว

`twilio-voice-call-plugin` ล้มเหลวเมื่อ `voice-call` ไม่ได้รับอนุญาตหรือไม่ได้เปิดใช้ เพิ่มเข้าไปใน `plugins.allow` เปิดใช้ `plugins.entries.voice-call` และโหลด Gateway ใหม่

`twilio-voice-call-credentials` ล้มเหลวเมื่อ backend ของ Twilio ไม่มี account SID, auth token หรือหมายเลขผู้โทร ตั้งค่าสิ่งเหล่านี้บนโฮสต์ Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

จากนั้นรีสตาร์ทหรือโหลด Gateway ใหม่และรัน:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` เป็นการตรวจความพร้อมเท่านั้นโดยค่าเริ่มต้น หากต้องการ dry-run กับหมายเลขเฉพาะ:

```bash
openclaw voicecall smoke --to "+15555550123"
```

ให้เพิ่ม `--yes` เฉพาะเมื่อคุณต้องการโทรแจ้งออกจริงโดยตั้งใจ:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### การโทร Twilio เริ่มต้นแล้วแต่ไม่เคยเข้าสู่การประชุม

ยืนยันว่าเหตุการณ์ Meet แสดงรายละเอียดการโทรเข้า ส่งหมายเลขโทรเข้าและ PIN ที่ถูกต้อง หรือส่งลำดับ DTMF แบบกำหนดเอง:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

ใช้ `w` นำหน้าหรือเครื่องหมายจุลภาคใน `--dtmf-sequence` หากผู้ให้บริการต้องการช่วงพักก่อนป้อน PIN

## หมายเหตุ

media API อย่างเป็นทางการของ Google Meet เน้นการรับข้อมูลเป็นหลัก ดังนั้นการพูดเข้าไปในการโทร Meet ยังต้องใช้เส้นทางของผู้เข้าร่วม Plugin นี้ทำให้ขอบเขตนั้นชัดเจน: Chrome จัดการการเข้าร่วมผ่านเบราว์เซอร์และการกำหนดเส้นทางเสียงในเครื่อง; Twilio จัดการการเข้าร่วมแบบโทรเข้าผ่านโทรศัพท์

โหมด Chrome realtime ต้องใช้ข้อใดข้อหนึ่งต่อไปนี้:

- `chrome.audioInputCommand` พร้อม `chrome.audioOutputCommand`: OpenClaw เป็นเจ้าของสะพานโมเดล realtime และส่งผ่านเสียง G.711 mu-law 8 kHz ระหว่างคำสั่งเหล่านั้นกับผู้ให้บริการเสียง realtime ที่เลือก
- `chrome.audioBridgeCommand`: คำสั่งสะพานภายนอกเป็นเจ้าของเส้นทางเสียงในเครื่องทั้งหมด และต้องออกจากโปรเซสหลังจากเริ่มต้นหรือยืนยัน daemon ของตนแล้ว

เพื่อให้ได้เสียงสองทางที่สะอาด ให้กำหนดเส้นทางเอาต์พุตของ Meet และไมโครโฟนของ Meet ผ่านอุปกรณ์เสมือนแยกกัน หรือผ่านกราฟอุปกรณ์เสมือนแบบ Loopback อุปกรณ์ BlackHole เดียวที่ใช้ร่วมกันอาจสะท้อนเสียงของผู้เข้าร่วมคนอื่นกลับเข้าไปในการโทร

`googlemeet speak` จะทริกเกอร์สะพานเสียง realtime ที่กำลังใช้งานสำหรับเซสชัน Chrome `googlemeet leave` จะหยุดสะพานนั้น สำหรับเซสชัน Twilio ที่มอบหมายผ่าน Plugin Voice Call คำสั่ง `leave` จะวางสายการโทรเสียงต้นทางด้วย

## ที่เกี่ยวข้อง

- [Plugin Voice Call](/th/plugins/voice-call)
- [โหมด Talk](/th/nodes/talk)
- [การสร้าง Plugins](/th/plugins/building-plugins)
