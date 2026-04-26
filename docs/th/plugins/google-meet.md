---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw เข้าร่วมการโทร Google Meet
    - คุณต้องการให้เอเจนต์ OpenClaw สร้างการโทร Google Meet ใหม่
    - คุณกำลังกำหนดค่า Chrome, Chrome node หรือ Twilio ให้เป็นช่องทางรับส่งข้อมูลสำหรับ Google Meet
summary: 'Plugin Google Meet: เข้าร่วม URL ของ Meet ที่ระบุโดยตรงผ่าน Chrome หรือ Twilio พร้อมค่าเริ่มต้นสำหรับเสียงแบบเรียลไทม์'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-26T11:36:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bd53db711e4729a9a7b18f7aaa3eedffd71a1e19349fc858537652b5d17cfcb
    source_path: plugins/google-meet.md
    workflow: 15
---

การรองรับผู้เข้าร่วม Google Meet สำหรับ OpenClaw — Plugin นี้ถูกออกแบบมาให้ชัดเจนโดยเจตนา:

- จะเข้าร่วมเฉพาะ URL `https://meet.google.com/...` ที่ระบุอย่างชัดเจนเท่านั้น
- สามารถสร้าง Meet space ใหม่ผ่าน Google Meet API แล้วเข้าร่วมจาก URL ที่ส่งกลับมาได้
- เสียงแบบ `realtime` เป็นโหมดเริ่มต้น
- เสียงแบบเรียลไทม์สามารถเรียกกลับเข้าไปยังเอเจนต์ OpenClaw เต็มรูปแบบได้เมื่อจำเป็นต้องใช้การให้เหตุผลเชิงลึกหรือเครื่องมือเพิ่มเติม
- เอเจนต์จะเลือกพฤติกรรมการเข้าร่วมด้วย `mode`: ใช้ `realtime` สำหรับการฟัง/พูดตอบกลับแบบสด หรือ `transcribe` เพื่อเข้าร่วม/ควบคุมเบราว์เซอร์โดยไม่ใช้สะพานเชื่อมเสียงแบบเรียลไทม์
- การยืนยันตัวตนเริ่มต้นได้จาก Google OAuth ส่วนบุคคล หรือโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้ไว้แล้ว
- ไม่มีการประกาศขอความยินยอมโดยอัตโนมัติ
- backend เสียงของ Chrome โดยค่าเริ่มต้นคือ `BlackHole 2ch`
- Chrome สามารถรันแบบโลคัลหรือบนโฮสต์ Node ที่จับคู่ไว้ได้
- Twilio รองรับหมายเลขโทรเข้า พร้อม PIN หรือชุด DTMF เพิ่มเติมแบบไม่บังคับ
- คำสั่ง CLI คือ `googlemeet`; คำว่า `meet` ถูกสงวนไว้สำหรับเวิร์กโฟลว์การประชุมทางไกลของเอเจนต์ในวงกว้าง

## เริ่มต้นอย่างรวดเร็ว

ติดตั้ง dependency เสียงแบบโลคัลและกำหนดค่าผู้ให้บริการเสียงแบบเรียลไทม์ฝั่ง backend
OpenAI เป็นค่าเริ่มต้น และ Google Gemini Live ก็ใช้งานได้เช่นกันเมื่อใช้
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` จะติดตั้งอุปกรณ์เสียงเสมือน `BlackHole 2ch` ตัวติดตั้งของ Homebrew
ต้องรีบูตก่อนที่ macOS จะมองเห็นอุปกรณ์นี้:

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

ผลลัพธ์ของการตั้งค่าถูกออกแบบให้อ่านได้โดยเอเจนต์ โดยจะรายงานโปรไฟล์ Chrome,
audio bridge, การปักหมุด Node, delayed realtime intro และเมื่อมีการกำหนดค่า Twilio delegation
ก็จะรายงานด้วยว่า Plugin `voice-call` และข้อมูลรับรอง Twilio พร้อมหรือไม่
ให้ถือว่าการตรวจสอบใดก็ตามที่เป็น `ok: false` เป็นตัวบล็อกก่อนจะสั่งให้เอเจนต์เข้าร่วม
ใช้ `openclaw googlemeet setup --json` สำหรับสคริปต์หรือผลลัพธ์แบบ machine-readable
ใช้ `--transport chrome`, `--transport chrome-node` หรือ `--transport twilio`
เพื่อ preflight transport ที่ต้องการก่อนที่เอเจนต์จะลองใช้งาน

เข้าร่วมการประชุม:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

หรือให้เอเจนต์เข้าร่วมผ่าน tool `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

สร้างการประชุมใหม่แล้วเข้าร่วม:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

สร้างเฉพาะ URL โดยไม่เข้าร่วม:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` มีสองเส้นทาง:

- สร้างผ่าน API: ใช้เมื่อมีการกำหนดค่าข้อมูลรับรอง Google Meet OAuth แล้ว นี่คือ
  เส้นทางที่กำหนดผลได้แน่นอนที่สุดและไม่ขึ้นกับสถานะ UI ของเบราว์เซอร์
- ทางสำรองผ่านเบราว์เซอร์: ใช้เมื่อไม่มีข้อมูลรับรอง OAuth OpenClaw จะใช้ Chrome node ที่ปักหมุดไว้ เปิด `https://meet.google.com/new` รอให้ Google
  redirect ไปยัง URL ที่มี meeting code จริง แล้วส่งคืน URL นั้น เส้นทางนี้ต้องให้
  โปรไฟล์ Chrome ของ OpenClaw บน Node ลงชื่อเข้าใช้ Google ไว้แล้ว
  ระบบอัตโนมัติของเบราว์เซอร์จะจัดการพรอมป์ไมโครโฟนครั้งแรกของ Meet เอง และพรอมป์นั้น
  จะไม่ถูกมองว่าเป็นความล้มเหลวของการเข้าสู่ระบบ Google
  ทั้ง flow การเข้าร่วมและการสร้างจะพยายามใช้แท็บ Meet ที่มีอยู่แล้วซ้ำก่อนเปิดแท็บใหม่ การจับคู่จะไม่สน query string ของ URL ที่ไม่สำคัญ เช่น `authuser` ดังนั้นการลองใหม่ของเอเจนต์ควรไปโฟกัสการประชุมที่เปิดอยู่แล้วแทนที่จะสร้างแท็บ Chrome ที่สอง

ผลลัพธ์ของคำสั่ง/tool จะมีฟิลด์ `source` (`api` หรือ `browser`) เพื่อให้เอเจนต์
อธิบายได้ว่าใช้เส้นทางใด `create` จะเข้าร่วมการประชุมใหม่โดยค่าเริ่มต้นและส่งคืน
`joined: true` พร้อมเซสชันการเข้าร่วม หากต้องการเพียงสร้าง URL ให้ใช้
`create --no-join` ใน CLI หรือส่ง `"join": false` ให้กับ tool

หรือบอกเอเจนต์ว่า: "สร้าง Google Meet, เข้าร่วมด้วยเสียงแบบเรียลไทม์ แล้วส่งลิงก์มาให้ฉัน"
เอเจนต์ควรเรียก `google_meet` ด้วย `action: "create"` แล้วแชร์ `meetingUri`
ที่ส่งกลับมา

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

สำหรับการเข้าร่วมแบบสังเกตการณ์อย่างเดียว/ควบคุมเบราว์เซอร์ ให้ตั้งค่า `"mode": "transcribe"` ซึ่งจะ
ไม่เริ่มสะพานเชื่อมโมเดลเรียลไทม์แบบสองทาง ดังนั้นจะไม่พูดตอบกลับเข้าไปในการประชุม

ระหว่างเซสชันแบบเรียลไทม์ สถานะของ `google_meet` จะมีข้อมูลสุขภาพของเบราว์เซอร์และ audio bridge
เช่น `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, เวลา input/output ล่าสุด,
ตัวนับไบต์ และสถานะการปิดของ bridge หากมีพรอมป์หน้า Meet ที่ปลอดภัย
ระบบอัตโนมัติของเบราว์เซอร์จะจัดการให้เมื่อทำได้ พรอมป์การเข้าสู่ระบบ การอนุมัติจากโฮสต์ และสิทธิ์ของเบราว์เซอร์/ระบบปฏิบัติการ
จะถูกรายงานเป็นการดำเนินการด้วยตนเองพร้อมเหตุผลและข้อความให้เอเจนต์นำไปแจ้งต่อ

Chrome จะเข้าร่วมด้วยโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้ไว้ ใน Meet ให้เลือก `BlackHole 2ch` สำหรับ
เส้นทางไมโครโฟน/ลำโพงที่ OpenClaw ใช้งาน สำหรับเสียงสองทางที่สะอาด ให้ใช้
อุปกรณ์เสมือนแยกกันหรือกราฟแบบ Loopback; การใช้อุปกรณ์ BlackHole เดียวก็
เพียงพอสำหรับ smoke test แรก แต่มีโอกาสเกิดเสียงสะท้อน

### Gateway แบบโลคัล + Parallels Chrome

คุณ **ไม่** จำเป็นต้องมี OpenClaw Gateway เต็มรูปแบบหรือคีย์ API ของโมเดลภายใน macOS VM
เพียงเพื่อให้ VM นั้นเป็นเจ้าของ Chrome ให้รัน Gateway และเอเจนต์แบบโลคัล แล้วรัน
โฮสต์ Node ใน VM เปิดใช้งาน Plugin ที่มาพร้อมกันบน VM หนึ่งครั้งเพื่อให้ Node
ประกาศคำสั่ง Chrome

สิ่งที่รันอยู่ที่ใด:

- โฮสต์ Gateway: OpenClaw Gateway, เวิร์กสเปซของเอเจนต์, คีย์โมเดล/API, ผู้ให้บริการแบบเรียลไทม์
  และการกำหนดค่า Plugin Google Meet
- macOS VM บน Parallels: OpenClaw CLI/โฮสต์ Node, Google Chrome, SoX, BlackHole 2ch,
  และโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้ Google แล้ว
- สิ่งที่ไม่จำเป็นใน VM: บริการ Gateway, การกำหนดค่าเอเจนต์, คีย์ OpenAI/GPT หรือการตั้งค่าผู้ให้บริการโมเดล

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

ติดตั้งหรืออัปเดต OpenClaw ใน VM แล้วเปิดใช้งาน Plugin ที่มาพร้อมกันตรงนั้น:

```bash
openclaw plugins enable google-meet
```

เริ่มโฮสต์ Node ใน VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

หาก `<gateway-host>` เป็น LAN IP และคุณไม่ได้ใช้ TLS Node จะปฏิเสธ
plaintext WebSocket เว้นแต่คุณจะเปิดใช้งานอย่างชัดเจนสำหรับเครือข่าย private ที่เชื่อถือได้นั้น:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

ใช้ตัวแปรสภาพแวดล้อมเดียวกันเมื่อจะติดตั้ง Node เป็น LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` เป็นตัวแปรสภาพแวดล้อมของโปรเซส ไม่ใช่
การตั้งค่าใน `openclaw.json` คำสั่ง `openclaw node install` จะเก็บตัวแปรนี้ไว้ในสภาพแวดล้อมของ LaunchAgent
เมื่อมีอยู่บนคำสั่งติดตั้ง

อนุมัติ Node จากโฮสต์ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

ยืนยันว่า Gateway มองเห็น Node และ Node ประกาศทั้ง `googlemeet.chrome`
และ capability/`browser.proxy` ของเบราว์เซอร์:

```bash
openclaw nodes status
```

กำหนดเส้นทาง Meet ผ่าน Node นั้นบนโฮสต์ Gateway:

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

ตอนนี้ให้เข้าร่วมตามปกติจากโฮสต์ Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

หรือขอให้เอเจนต์ใช้ tool `google_meet` โดยตั้ง `transport: "chrome-node"`

สำหรับ smoke test แบบคำสั่งเดียวที่สร้างหรือใช้เซสชันซ้ำ พูดวลีที่กำหนดไว้
และพิมพ์สถานะสุขภาพของเซสชัน:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

ระหว่างการเข้าร่วม ระบบอัตโนมัติของเบราว์เซอร์ OpenClaw จะกรอกชื่อ guest, คลิก Join/Ask
to join และยอมรับตัวเลือก "Use microphone" ครั้งแรกของ Meet เมื่อพรอมป์นั้นปรากฏ
ระหว่างการสร้างการประชุมแบบเบราว์เซอร์อย่างเดียว ระบบยังสามารถดำเนินการต่อผ่านพรอมป์เดียวกันได้โดยไม่ใช้ไมโครโฟน หาก Meet ไม่แสดงปุ่ม use-microphone
หากโปรไฟล์เบราว์เซอร์ไม่ได้ลงชื่อเข้าใช้ Meet กำลังรอการอนุมัติจากโฮสต์ Chrome ต้องการสิทธิ์ไมโครโฟน/กล้อง หรือ Meet ค้างอยู่ที่
พรอมป์ที่ระบบอัตโนมัติแก้ไม่ได้ ผลลัพธ์จากการเข้าร่วม/test-speech จะรายงาน
`manualActionRequired: true` พร้อม `manualActionReason` และ
`manualActionMessage` เอเจนต์ควรหยุดพยายามเข้าร่วมซ้ำ รายงานข้อความนั้นตามตรงพร้อม `browserUrl`/`browserTitle` ปัจจุบัน และลองใหม่เฉพาะหลังจากการดำเนินการด้วยตนเองในเบราว์เซอร์เสร็จสิ้นแล้ว

หากละ `chromeNode.node` ไว้ OpenClaw จะเลือกอัตโนมัติเฉพาะเมื่อมี Node ที่เชื่อมต่ออยู่เพียงหนึ่งตัวที่ประกาศทั้ง `googlemeet.chrome` และการควบคุมเบราว์เซอร์ หาก
มีหลาย Node ที่รองรับ ให้ตั้ง `chromeNode.node` เป็น node id,
display name หรือ remote IP

การตรวจสอบความล้มเหลวที่พบบ่อย:

- `Configured Google Meet node ... is not usable: offline`: Node ที่ปักหมุดไว้
  เป็นที่รู้จักของ Gateway แต่ใช้งานไม่ได้ เอเจนต์ควรมอง Node นั้นเป็น
  สถานะสำหรับการวินิจฉัย ไม่ใช่โฮสต์ Chrome ที่ใช้การได้ และควรรายงานตัวบล็อกของการตั้งค่า
  แทนที่จะ fallback ไปใช้ transport อื่น เว้นแต่ผู้ใช้จะขอเช่นนั้น
- `No connected Google Meet-capable node`: เริ่ม `openclaw node run` ใน VM
  อนุมัติการจับคู่ และตรวจสอบให้แน่ใจว่าได้รัน `openclaw plugins enable google-meet` และ
  `openclaw plugins enable browser` ใน VM แล้ว ตรวจสอบด้วยว่า
  โฮสต์ Gateway อนุญาตทั้งสองคำสั่งของ Node ด้วย
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`
- `BlackHole 2ch audio device not found`: ติดตั้ง `blackhole-2ch` บนโฮสต์
  ที่กำลังตรวจสอบและรีบูตก่อนใช้งานเสียง Chrome แบบโลคัล
- `BlackHole 2ch audio device not found on the node`: ติดตั้ง `blackhole-2ch`
  ใน VM และรีบูต VM
- Chrome เปิดได้แต่เข้าร่วมไม่ได้: ลงชื่อเข้าใช้โปรไฟล์เบราว์เซอร์ภายใน VM หรือ
  คง `chrome.guestName` ไว้สำหรับการเข้าร่วมแบบ guest การเข้าร่วมอัตโนมัติแบบ guest ใช้ระบบอัตโนมัติของเบราว์เซอร์ OpenClaw ผ่าน proxy เบราว์เซอร์ของ Node; ตรวจสอบให้แน่ใจว่าการกำหนดค่าเบราว์เซอร์ของ Node ชี้ไปยังโปรไฟล์ที่ต้องการ เช่น
  `browser.defaultProfile: "user"` หรือโปรไฟล์ existing-session ที่ตั้งชื่อไว้
- แท็บ Meet ซ้ำซ้อน: ให้เปิด `chrome.reuseExistingTab: true` ไว้ OpenClaw
  จะเปิดใช้งานแท็บที่มีอยู่แล้วสำหรับ URL Meet เดียวกันก่อนเปิดแท็บใหม่ และ
  การสร้างการประชุมผ่านเบราว์เซอร์จะใช้แท็บ `https://meet.google.com/new`
  หรือแท็บพรอมป์บัญชี Google ที่กำลังดำเนินอยู่ซ้ำก่อนเปิดอีกแท็บหนึ่ง
- ไม่มีเสียง: ใน Meet ให้กำหนดเส้นทางไมโครโฟน/ลำโพงผ่านเส้นทางอุปกรณ์เสียงเสมือน
  ที่ OpenClaw ใช้งาน; ใช้อุปกรณ์เสมือนแยกกันหรือการกำหนดเส้นทางแบบ Loopback
  เพื่อให้ได้เสียงสองทางที่ชัดเจน

## หมายเหตุการติดตั้ง

ค่าเริ่มต้นแบบเรียลไทม์ของ Chrome ใช้เครื่องมือภายนอกสองตัว:

- `sox`: เครื่องมือเสียงบรรทัดคำสั่ง Plugin ใช้คำสั่ง `rec` และ `play`
  สำหรับ audio bridge แบบ G.711 mu-law 8 kHz เริ่มต้น
- `blackhole-2ch`: ไดรเวอร์เสียงเสมือนบน macOS ซึ่งสร้าง
  อุปกรณ์เสียง `BlackHole 2ch` ที่ Chrome/Meet สามารถกำหนดเส้นทางผ่านได้

OpenClaw ไม่ได้ bundle หรือแจกจ่ายแพ็กเกจใดแพ็กเกจหนึ่งนี้ไปด้วย เอกสารกำหนดให้ผู้ใช้
ติดตั้งเป็น dependency ของโฮสต์ผ่าน Homebrew SoX ใช้สัญญาอนุญาต
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole ใช้ GPL-3.0 หากคุณสร้าง
ตัวติดตั้งหรือ appliance ที่ bundle BlackHole ร่วมกับ OpenClaw ให้ตรวจสอบเงื่อนไขสัญญาอนุญาตต้นทางของ BlackHole
หรือขอสัญญาอนุญาตแยกต่างหากจาก Existential Audio

## Transport

### Chrome

Chrome transport จะเปิด URL ของ Meet ใน Google Chrome และเข้าร่วมด้วย
โปรไฟล์ Chrome ที่ลงชื่อเข้าใช้ไว้ บน macOS Plugin จะตรวจสอบ `BlackHole 2ch` ก่อนเปิดใช้งาน
หากมีการกำหนดค่าไว้ ระบบจะรันคำสั่งตรวจสอบสุขภาพของ audio bridge และคำสั่งเริ่มต้น
ก่อนเปิด Chrome ใช้ `chrome` เมื่อ Chrome/เสียงอยู่บนโฮสต์ Gateway;
ใช้ `chrome-node` เมื่อ Chrome/เสียงอยู่บน Node ที่จับคู่ไว้ เช่น Parallels
macOS VM

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

กำหนดเส้นทางเสียงไมโครโฟนและลำโพงของ Chrome ผ่าน audio
bridge แบบโลคัลของ OpenClaw หากไม่ได้ติดตั้ง `BlackHole 2ch` การเข้าร่วมจะล้มเหลวพร้อมข้อผิดพลาดด้านการตั้งค่า
แทนที่จะเข้าร่วมแบบเงียบ ๆ โดยไม่มีเส้นทางเสียง

### Twilio

Twilio transport เป็นแผนการโทรแบบเข้มงวดที่ delegate ไปยัง Plugin Voice Call โดยตรง โดย
จะไม่ parse หน้า Meet เพื่อหาเบอร์โทรศัพท์

ใช้วิธีนี้เมื่อไม่สามารถเข้าร่วมผ่าน Chrome ได้ หรือเมื่อคุณต้องการทางสำรองแบบโทรเข้า
Google Meet ต้องแสดงหมายเลขโทรเข้าและ PIN สำหรับ
การประชุมนั้น OpenClaw จะไม่ค้นหาข้อมูลเหล่านั้นจากหน้า Meet

เปิดใช้งาน Plugin Voice Call บนโฮสต์ Gateway ไม่ใช่บน Chrome node:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
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

ระบุข้อมูลรับรอง Twilio ผ่าน environment หรือ config การใช้ environment จะช่วย
เก็บความลับออกจาก `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

รีสตาร์ตหรือรีโหลด Gateway หลังเปิดใช้งาน `voice-call`; การเปลี่ยนแปลงการกำหนดค่า Plugin
จะไม่ปรากฏในโปรเซส Gateway ที่กำลังรันอยู่จนกว่าจะมีการรีโหลด

จากนั้นตรวจสอบ:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

เมื่อการ delegate ไปยัง Twilio เชื่อมต่อเรียบร้อยแล้ว `googlemeet setup` จะมีการตรวจสอบ
`twilio-voice-call-plugin` และ `twilio-voice-call-credentials` ที่สำเร็จ

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

OAuth เป็นตัวเลือกเสริมสำหรับการสร้างลิงก์ Meet เพราะ `googlemeet create` สามารถ fallback
ไปใช้ระบบอัตโนมัติของเบราว์เซอร์ได้ กำหนดค่า OAuth เมื่อคุณต้องการการสร้างผ่าน API อย่างเป็นทางการ
การ resolve space หรือการตรวจสอบ preflight ของ Meet Media API

การเข้าถึง Google Meet API ใช้ user OAuth: สร้าง Google Cloud OAuth client
ขอ scopes ที่จำเป็น อนุญาตบัญชี Google แล้วเก็บ
refresh token ที่ได้ไว้ใน config ของ Plugin Google Meet หรือระบุ
ตัวแปร environment `OPENCLAW_GOOGLE_MEET_*`

OAuth ไม่ได้มาแทนที่เส้นทางการเข้าร่วมผ่าน Chrome transport แบบ Chrome และ Chrome-node
ยังคงเข้าร่วมผ่านโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้ไว้, BlackHole/SoX และ Node ที่เชื่อมต่ออยู่เมื่อคุณใช้การเข้าร่วมผ่านเบราว์เซอร์ OAuth ใช้เฉพาะกับเส้นทาง Google
Meet API อย่างเป็นทางการเท่านั้น: สร้าง meeting spaces, resolve spaces และรันการตรวจสอบ preflight ของ Meet Media API

### สร้างข้อมูลรับรอง Google

ใน Google Cloud Console:

1. สร้างหรือเลือกโปรเจกต์ Google Cloud
2. เปิดใช้งาน **Google Meet REST API** สำหรับโปรเจกต์นั้น
3. กำหนดค่า OAuth consent screen
   - **Internal** ง่ายที่สุดสำหรับองค์กร Google Workspace
   - **External** ใช้ได้กับการตั้งค่าส่วนตัว/ทดสอบ; ขณะที่แอปอยู่ในสถานะ Testing
     ให้เพิ่มบัญชี Google แต่ละบัญชีที่จะใช้อนุญาตแอปเป็น test user
4. เพิ่ม scopes ที่ OpenClaw ขอ:
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

`meetings.space.created` จำเป็นสำหรับ `spaces.create` ของ Google Meet
`meetings.space.readonly` ช่วยให้ OpenClaw resolve URL/code ของ Meet ไปเป็น spaces ได้
`meetings.conference.media.readonly` ใช้สำหรับ preflight ของ Meet Media API และงานด้านสื่อ
Google อาจกำหนดให้ต้องลงทะเบียน Developer Preview สำหรับการใช้งาน Media API จริง
หากคุณต้องการเพียงการเข้าร่วมผ่าน Chrome แบบอิงเบราว์เซอร์ ให้ข้าม OAuth ได้เลย

### สร้าง refresh token

กำหนดค่า `oauth.clientId` และ `oauth.clientSecret` หากต้องการ หรือส่งเป็น
ตัวแปร environment แล้วรัน:

```bash
openclaw googlemeet auth login --json
```

คำสั่งนี้จะพิมพ์บล็อก config `oauth` พร้อม refresh token โดยใช้ PKCE,
localhost callback ที่ `http://localhost:8085/oauth2callback` และรองรับ
flow แบบคัดลอก/วางด้วย `--manual`

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

ผลลัพธ์ JSON จะมี:

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

ควรใช้ตัวแปร environment หากคุณไม่ต้องการเก็บ refresh token ไว้ใน config
หากมีค่าทั้งใน config และ environment พร้อมกัน Plugin จะ resolve จาก config
ก่อน แล้วค่อย fallback ไปยัง environment

OAuth consent ครอบคลุมการสร้าง Meet space, การอ่าน Meet space และการอ่านสื่อของการประชุม Meet
หากคุณยืนยันตัวตนก่อนที่จะมีการรองรับการสร้างการประชุม
ให้รัน `openclaw googlemeet auth login --json` ใหม่ เพื่อให้ refresh
token มี scope `meetings.space.created`

### ตรวจสอบ OAuth ด้วย doctor

รัน OAuth doctor เมื่อคุณต้องการการตรวจสอบสุขภาพที่รวดเร็วและไม่เปิดเผยความลับ:

```bash
openclaw googlemeet doctor --oauth --json
```

คำสั่งนี้จะไม่โหลด runtime ของ Chrome หรือจำเป็นต้องมี Chrome node ที่เชื่อมต่ออยู่ โดย
จะตรวจสอบว่ามี config ของ OAuth และ refresh token สามารถสร้าง access
token ได้ รายงาน JSON จะมีเฉพาะฟิลด์สถานะ เช่น `ok`, `configured`,
`tokenSource`, `expiresAt` และข้อความตรวจสอบ; จะไม่พิมพ์ access
token, refresh token หรือ client secret

ผลลัพธ์ทั่วไป:

| Check                | Meaning                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | มี `oauth.clientId` พร้อม `oauth.refreshToken` หรือ cached access token อยู่       |
| `oauth-token`        | cached access token ยังใช้ได้อยู่ หรือ refresh token ได้สร้าง access token ใหม่ |
| `meet-spaces-get`    | การตรวจสอบ `--meeting` แบบเลือกได้ ได้ resolve Meet space ที่มีอยู่แล้ว                             |
| `meet-spaces-create` | การตรวจสอบ `--create-space` แบบเลือกได้ ได้สร้าง Meet space ใหม่                               |

หากต้องการพิสูจน์ด้วยว่าได้เปิดใช้งาน Google Meet API และมี scope `spaces.create`
ให้รันการตรวจสอบแบบ create ที่มีผลข้างเคียง:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` จะสร้าง URL ของ Meet แบบใช้แล้วทิ้ง ใช้เมื่อต้องการยืนยัน
ว่าโปรเจกต์ Google Cloud ได้เปิดใช้งาน Meet API แล้ว และบัญชีที่อนุญาต
มี scope `meetings.space.created`

หากต้องการพิสูจน์สิทธิ์การอ่านสำหรับ meeting space ที่มีอยู่:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` และ `resolve-space` ใช้พิสูจน์สิทธิ์การอ่านของ space ที่มีอยู่
ซึ่งบัญชี Google ที่อนุญาตสามารถเข้าถึงได้ โดยทั่วไป `403` จากการตรวจสอบเหล่านี้
หมายความว่า Google Meet REST API ถูกปิดใช้งาน, refresh token ที่ยินยอมไว้
ขาด scope ที่จำเป็น หรือบัญชี Google ไม่สามารถเข้าถึง Meet
space นั้นได้ หากเป็นข้อผิดพลาดเกี่ยวกับ refresh token ให้รัน `openclaw googlemeet auth login
--json` ใหม่ แล้วเก็บบล็อก `oauth` ใหม่

ไม่จำเป็นต้องมีข้อมูลรับรอง OAuth สำหรับ browser fallback ในโหมดนั้น Google
auth มาจากโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้ไว้บน Node ที่เลือก ไม่ได้มาจาก
config ของ OpenClaw

รองรับตัวแปร environment เหล่านี้เป็น fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` หรือ `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` หรือ `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` หรือ
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` หรือ `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` หรือ `GOOGLE_MEET_PREVIEW_ACK`

resolve URL, code หรือ `spaces/{id}` ของ Meet ผ่าน `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

รัน preflight ก่อนทำงานด้านสื่อ:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

แสดงรายการ artifact และการเข้าร่วมหลังจาก Meet ได้สร้าง conference records แล้ว:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

เมื่อใช้ `--meeting` คำสั่ง `artifacts` และ `attendance` จะใช้ conference record ล่าสุด
โดยค่าเริ่มต้น ส่ง `--all-conference-records` หากคุณต้องการทุก record ที่ยังคงเก็บไว้
สำหรับการประชุมนั้น

การค้นหาผ่านปฏิทินสามารถ resolve URL ของการประชุมจาก Google Calendar ก่อนอ่าน
artifact ของ Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` จะค้นหาเหตุการณ์ในปฏิทิน `primary` ของวันนี้ที่มี
ลิงก์ Google Meet ใช้ `--event <query>` เพื่อค้นหาข้อความเหตุการณ์ที่ตรงกัน และ
`--calendar <id>` สำหรับปฏิทินที่ไม่ใช่ primary การค้นหาผ่านปฏิทินต้องใช้
การเข้าสู่ระบบ OAuth ใหม่ที่มี scope สำหรับอ่านเหตุการณ์ในปฏิทิน
`calendar-events` จะแสดงตัวอย่างเหตุการณ์ Meet ที่ตรงกัน และทำเครื่องหมายเหตุการณ์ที่
`latest`, `artifacts`, `attendance` หรือ `export` จะเลือก

หากคุณทราบ conference record id อยู่แล้ว ก็อ้างอิงได้โดยตรง:

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

`artifacts` จะส่งกลับ metadata ของ conference record พร้อม metadata ของทรัพยากร participant, recording,
transcript, transcript-entry แบบมีโครงสร้าง และ smart-note เมื่อ
Google เปิดเผยข้อมูลเหล่านี้สำหรับการประชุมนั้น ใช้ `--no-transcript-entries` เพื่อข้าม
การค้นหา entry สำหรับการประชุมขนาดใหญ่ `attendance` จะขยาย participants ออกเป็น
แถว participant-session พร้อมเวลาเห็นครั้งแรก/ครั้งสุดท้าย ระยะเวลารวมของเซสชัน
สถานะมาสาย/ออกก่อนเวลา และรวมทรัพยากร participant ที่ซ้ำกันโดยอิงจากผู้ใช้ที่ลงชื่อเข้าใช้
หรือชื่อที่แสดง ใช้ `--no-merge-duplicates` เพื่อแยกทรัพยากร participant
ดิบออกจากกัน, `--late-after-minutes` เพื่อปรับเกณฑ์การตรวจจับการมาสาย และ
`--early-before-minutes` เพื่อปรับเกณฑ์การตรวจจับการออกก่อนเวลา

`export` จะเขียนโฟลเดอร์ที่มี `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` และ `manifest.json`
`manifest.json` จะบันทึก input ที่เลือก, ตัวเลือกการ export, conference records,
ไฟล์เอาต์พุต, จำนวนรายการ, แหล่งที่มาของ token, Calendar event เมื่อมีการใช้ และ
คำเตือนเกี่ยวกับการดึงข้อมูลแบบบางส่วน ใช้ `--zip` เพื่อเขียน archive แบบพกพาไว้ข้างโฟลเดอร์เพิ่มเติม ใช้
`--include-doc-bodies` เพื่อ export ข้อความของ transcript และ smart-note Google Docs ที่ลิงก์ไว้
ผ่าน Google Drive `files.export`; สิ่งนี้ต้องใช้การเข้าสู่ระบบ OAuth ใหม่
ที่มี scope สำหรับ Drive Meet readonly หากไม่มี
`--include-doc-bodies` การ export จะรวมเฉพาะ metadata ของ Meet และ structured transcript
entries เท่านั้น หาก Google ส่งคืนความล้มเหลวของ artifact แบบบางส่วน เช่น smart-note
listing, transcript-entry หรือข้อผิดพลาดของเนื้อหาเอกสาร Drive สรุปและ
manifest จะเก็บคำเตือนไว้แทนที่จะทำให้การ export ทั้งหมดล้มเหลว
ใช้ `--dry-run` เพื่อดึงข้อมูล artifact/attendance ชุดเดียวกันและพิมพ์
manifest JSON โดยไม่สร้างโฟลเดอร์หรือ ZIP วิธีนี้มีประโยชน์ก่อนเขียน
การ export ขนาดใหญ่ หรือเมื่อเอเจนต์ต้องการเพียงจำนวน รายการที่เลือก และ
คำเตือน

เอเจนต์ยังสามารถสร้าง bundle เดียวกันนี้ผ่าน tool `google_meet` ได้:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

ตั้งค่า `"dryRun": true` เพื่อให้ส่งคืนเฉพาะ export manifest และข้ามการเขียนไฟล์

รัน live smoke แบบมีการป้องกันกับการประชุมจริงที่ยังคงเก็บไว้:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

environment ของ live smoke:

- `OPENCLAW_LIVE_TEST=1` เปิดใช้งาน live tests แบบมีการป้องกัน
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` ชี้ไปยัง URL, code หรือ
  `spaces/{id}` ของ Meet ที่ยังคงเก็บไว้
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID` ระบุ OAuth
  client id
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN` ระบุ
  refresh token
- ตัวเลือกเพิ่มเติม: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` และ
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ใช้ชื่อ fallback เดียวกัน
  โดยไม่มีคำนำหน้า `OPENCLAW_`

live smoke พื้นฐานของ artifact/attendance ต้องใช้
`https://www.googleapis.com/auth/meetings.space.readonly` และ
`https://www.googleapis.com/auth/meetings.conference.media.readonly` การค้นหาผ่านปฏิทิน
ต้องใช้ `https://www.googleapis.com/auth/calendar.events.readonly` การ export
เนื้อหาเอกสารจาก Drive ต้องใช้
`https://www.googleapis.com/auth/drive.meet.readonly`

สร้าง Meet space ใหม่:

```bash
openclaw googlemeet create
```

คำสั่งนี้จะแสดง `meeting uri`, source และ join session ใหม่ เมื่อมีข้อมูลรับรอง OAuth
ระบบจะใช้ Google Meet API อย่างเป็นทางการ หากไม่มีข้อมูลรับรอง OAuth จะใช้
โปรไฟล์เบราว์เซอร์ที่ลงชื่อเข้าใช้แล้วของ Chrome node ที่ปักหมุดไว้เป็นทางสำรอง เอเจนต์สามารถ
ใช้ tool `google_meet` ด้วย `action: "create"` เพื่อสร้างและเข้าร่วมในขั้นตอนเดียวได้ สำหรับการสร้างเฉพาะ URL ให้ส่ง `"join": false`

ตัวอย่างผลลัพธ์ JSON จาก browser fallback:

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

หาก browser fallback เจอการเข้าสู่ระบบ Google หรือการบล็อกสิทธิ์ของ Meet ก่อนที่
จะสร้าง URL ได้ เมธอดของ Gateway จะส่งคืนการตอบสนองที่ล้มเหลว และ
tool `google_meet` จะส่งคืนรายละเอียดแบบมีโครงสร้างแทนสตริงธรรมดา:

```json
{
  "source": "browser",
  "error": "google-login-required: ลงชื่อเข้าใช้ Google ในโปรไฟล์เบราว์เซอร์ OpenClaw แล้วลองสร้างการประชุมใหม่อีกครั้ง",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "ลงชื่อเข้าใช้ Google ในโปรไฟล์เบราว์เซอร์ OpenClaw แล้วลองสร้างการประชุมใหม่อีกครั้ง",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

เมื่อเอเจนต์เห็น `manualActionRequired: true` ควรรายงาน
`manualActionMessage` พร้อมบริบทของ Node/แท็บเบราว์เซอร์ และหยุดเปิดแท็บ
Meet ใหม่จนกว่าผู้ปฏิบัติงานจะทำขั้นตอนในเบราว์เซอร์เสร็จ

ตัวอย่างผลลัพธ์ JSON จากการสร้างผ่าน API:

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

การสร้าง Meet จะเข้าร่วมโดยค่าเริ่มต้น transport แบบ Chrome หรือ Chrome-node ยังคง
ต้องใช้โปรไฟล์ Google Chrome ที่ลงชื่อเข้าใช้แล้วเพื่อเข้าร่วมผ่านเบราว์เซอร์ หาก
โปรไฟล์ถูกออกจากระบบ OpenClaw จะรายงาน `manualActionRequired: true` หรือ
ข้อผิดพลาดของ browser fallback และขอให้ผู้ปฏิบัติงานดำเนินการเข้าสู่ระบบ Google ให้เสร็จก่อน
แล้วจึงลองใหม่

ตั้งค่า `preview.enrollmentAcknowledged: true` เฉพาะหลังจากยืนยันแล้วว่า Cloud
project, OAuth principal และผู้เข้าร่วมการประชุมของคุณได้ลงทะเบียนใน Google
Workspace Developer Preview Program สำหรับ Meet media APIs แล้ว

## การกำหนดค่า

เส้นทาง Chrome realtime ทั่วไปต้องการเพียงเปิดใช้งาน Plugin, BlackHole, SoX
และคีย์ของผู้ให้บริการเสียงแบบเรียลไทม์ฝั่ง backend OpenAI เป็นค่าเริ่มต้น; ตั้งค่า
`realtime.provider: "google"` เพื่อใช้ Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
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
- `chromeNode.node`: node id/name/IP แบบไม่บังคับสำหรับ `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ชื่อที่ใช้บนหน้าจอ guest ของ Meet เมื่อไม่ได้ลงชื่อเข้าใช้
- `chrome.autoJoin: true`: พยายามกรอกชื่อ guest และคลิก Join Now
  ผ่านระบบอัตโนมัติของเบราว์เซอร์ OpenClaw บน `chrome-node`
- `chrome.reuseExistingTab: true`: เปิดใช้งานแท็บ Meet ที่มีอยู่แทน
  การเปิดแท็บซ้ำ
- `chrome.waitForInCallMs: 20000`: รอให้แท็บ Meet รายงานว่าอยู่ในสายแล้ว
  ก่อนเรียก realtime intro
- `chrome.audioInputCommand`: คำสั่ง SoX `rec` ที่เขียนเสียง
  8 kHz G.711 mu-law ไปยัง stdout
- `chrome.audioOutputCommand`: คำสั่ง SoX `play` ที่อ่านเสียง
  8 kHz G.711 mu-law จาก stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: คำตอบเสียงพูดแบบสั้น พร้อม
  `openclaw_agent_consult` สำหรับคำตอบที่ลึกขึ้น
- `realtime.introMessage`: ข้อความสั้นสำหรับตรวจสอบความพร้อมเมื่อ realtime bridge
  เชื่อมต่อ; ตั้งเป็น `""` เพื่อเข้าร่วมแบบเงียบ

การ override แบบไม่บังคับ:

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

การกำหนดค่าเฉพาะ Twilio:

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

`voiceCall.enabled` ใช้ค่าเริ่มต้นเป็น `true`; เมื่อใช้ Twilio transport ระบบจะ delegate
การโทร PSTN จริงและ DTMF ไปยัง Plugin Voice Call หากไม่ได้เปิดใช้งาน `voice-call`
Google Meet จะยังคงตรวจสอบและบันทึก dial plan ได้ แต่ไม่สามารถ
โทรผ่าน Twilio ได้

## Tool

เอเจนต์สามารถใช้ tool `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

ใช้ `transport: "chrome"` เมื่อ Chrome รันบนโฮสต์ Gateway ใช้
`transport: "chrome-node"` เมื่อ Chrome รันบน Node ที่จับคู่ไว้ เช่น Parallels
VM ในทั้งสองกรณี โมเดลแบบเรียลไทม์และ `openclaw_agent_consult` จะรันบน
โฮสต์ Gateway ดังนั้นข้อมูลรับรองของโมเดลจะอยู่ที่นั่น

ใช้ `action: "status"` เพื่อแสดงรายการเซสชันที่กำลังใช้งานหรือดูข้อมูล session ID ใช้
`action: "speak"` พร้อม `sessionId` และ `message` เพื่อให้เอเจนต์แบบเรียลไทม์
พูดได้ทันที ใช้ `action: "test_speech"` เพื่อสร้างหรือใช้เซสชันซ้ำ
เรียกวลีที่กำหนดไว้ และส่งคืนสถานะสุขภาพ `inCall` เมื่อโฮสต์ Chrome สามารถ
รายงานได้ ใช้ `action: "leave"` เพื่อทำเครื่องหมายว่าเซสชันสิ้นสุดแล้ว

`status` จะมีข้อมูลสุขภาพของ Chrome เมื่อมี:

- `inCall`: Chrome ดูเหมือนอยู่ในการโทร Meet
- `micMuted`: สถานะไมโครโฟนของ Meet แบบ best-effort
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: โปรไฟล์ของเบราว์เซอร์
  ต้องมีการเข้าสู่ระบบด้วยตนเอง การอนุมัติจากโฮสต์ สิทธิ์ต่าง ๆ หรือการซ่อมแซมการควบคุมเบราว์เซอร์ก่อนที่การพูดจะทำงานได้
- `providerConnected` / `realtimeReady`: สถานะของ realtime voice bridge
- `lastInputAt` / `lastOutputAt`: เสียงล่าสุดที่ตรวจพบจากหรือส่งไปยัง bridge

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime agent consult

โหมด Chrome realtime ถูกปรับให้เหมาะกับลูปเสียงพูดแบบสด ผู้ให้บริการเสียงแบบเรียลไทม์
จะได้ยินเสียงจากการประชุมและพูดผ่าน audio bridge ที่กำหนดค่าไว้
เมื่อโมเดลแบบเรียลไทม์ต้องการการให้เหตุผลที่ลึกขึ้น ข้อมูลปัจจุบัน หรือเครื่องมือ OpenClaw ปกติ
โมเดลสามารถเรียก `openclaw_agent_consult` ได้

tool consult จะรันเอเจนต์ OpenClaw ปกติอยู่เบื้องหลังพร้อมบริบท transcript การประชุมล่าสุด
และส่งคืนคำตอบเสียงพูดแบบกระชับให้กับเซสชันเสียงแบบเรียลไทม์ จากนั้นโมเดลเสียง
ก็สามารถพูดคำตอบนั้นกลับเข้าไปในการประชุมได้ โดยใช้ realtime consult tool เดียวกันกับ Voice Call

`realtime.toolPolicy` ควบคุมการรัน consult:

- `safe-read-only`: เปิดเผย consult tool และจำกัดเอเจนต์ปกติไว้ที่
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ
  `memory_get`
- `owner`: เปิดเผย consult tool และให้เอเจนต์ปกติใช้ policy เครื่องมือของเอเจนต์ตามปกติ
- `none`: ไม่เปิดเผย consult tool ให้กับโมเดลเสียงแบบเรียลไทม์

session key ของ consult จะถูกกำหนดขอบเขตตามแต่ละเซสชัน Meet ดังนั้นการเรียก consult ติดตามผล
จึงสามารถใช้บริบท consult ก่อนหน้าในระหว่างการประชุมเดียวกันได้

หากต้องการบังคับให้มีการตรวจสอบความพร้อมด้วยเสียงพูดหลังจาก Chrome เข้าร่วมการโทรเต็มที่แล้ว:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

สำหรับ smoke แบบเข้าร่วมและพูดครบขั้นตอน:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## รายการตรวจสอบ live test

ใช้ลำดับนี้ก่อนส่งมอบการประชุมให้เอเจนต์ที่ทำงานโดยไม่มีผู้ดูแล:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

สถานะที่คาดหวังของ Chrome-node:

- `googlemeet setup` ผ่านทั้งหมดเป็นสีเขียว
- `googlemeet setup` มี `chrome-node-connected` เมื่อ `chrome-node` เป็น
  transport เริ่มต้นหรือมีการปักหมุด Node ไว้
- `nodes status` แสดงว่า Node ที่เลือกเชื่อมต่ออยู่
- Node ที่เลือกประกาศทั้ง `googlemeet.chrome` และ `browser.proxy`
- แท็บ Meet เข้าร่วมการโทร และ `test-speech` ส่งคืนสถานะสุขภาพของ Chrome พร้อม
  `inCall: true`

สำหรับโฮสต์ Chrome ระยะไกล เช่น Parallels macOS VM นี่คือการตรวจสอบแบบปลอดภัยที่สั้นที่สุด
หลังจากอัปเดต Gateway หรือ VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

วิธีนี้พิสูจน์ว่า Plugin ของ Gateway ถูกโหลดแล้ว, VM node เชื่อมต่อด้วย
token ปัจจุบัน และ Meet audio bridge พร้อมใช้งานก่อนที่เอเจนต์จะเปิดแท็บการประชุมจริง

สำหรับ Twilio smoke ให้ใช้การประชุมที่แสดงรายละเอียดการโทรเข้า:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

สถานะที่คาดหวังของ Twilio:

- `googlemeet setup` มีการตรวจสอบ `twilio-voice-call-plugin` และ
  `twilio-voice-call-credentials` ที่ผ่านเป็นสีเขียว
- `voicecall` ใช้งานได้ใน CLI หลังจากรีโหลด Gateway
- เซสชันที่ส่งคืนมี `transport: "twilio"` และ `twilio.voiceCallId`
- `googlemeet leave <sessionId>` จะวางสายการโทรเสียงที่ถูก delegate

## การแก้ปัญหา

### เอเจนต์มองไม่เห็น Google Meet tool

ยืนยันว่า Plugin ถูกเปิดใช้งานใน config ของ Gateway และรีโหลด Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

หากคุณเพิ่งแก้ไข `plugins.entries.google-meet` ให้รีสตาร์ตหรือรีโหลด Gateway
เอเจนต์ที่กำลังรันอยู่จะมองเห็นเฉพาะ Plugin tools ที่ลงทะเบียนโดยโปรเซส Gateway ปัจจุบันเท่านั้น

### ไม่มี Google Meet-capable node ที่เชื่อมต่ออยู่

บนโฮสต์ Node ให้รัน:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

บนโฮสต์ Gateway ให้อนุมัติ Node และตรวจสอบคำสั่ง:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node ต้องเชื่อมต่ออยู่และแสดง `googlemeet.chrome` พร้อม `browser.proxy`
config ของ Gateway ต้องอนุญาตคำสั่งของ Node เหล่านั้น:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

หาก `googlemeet setup` ล้มเหลวที่ `chrome-node-connected` หรือ log ของ Gateway รายงาน
`gateway token mismatch` ให้ติดตั้งใหม่หรือรีสตาร์ต Node ด้วย token ปัจจุบันของ Gateway
สำหรับ Gateway บน LAN โดยทั่วไปหมายถึง:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

จากนั้นรีโหลดบริการของ Node และรันอีกครั้ง:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### เบราว์เซอร์เปิดแต่เอเจนต์เข้าร่วมไม่ได้

รัน `googlemeet test-speech` และตรวจสอบสถานะสุขภาพของ Chrome ที่ส่งกลับ หาก
รายงาน `manualActionRequired: true` ให้แสดง `manualActionMessage` แก่ผู้ปฏิบัติงาน
และหยุดลองใหม่จนกว่าการดำเนินการในเบราว์เซอร์จะเสร็จสิ้น

การดำเนินการด้วยตนเองที่พบบ่อย:

- ลงชื่อเข้าใช้โปรไฟล์ Chrome
- อนุมัติ guest จากบัญชีโฮสต์ของ Meet
- ให้สิทธิ์ไมโครโฟน/กล้องแก่ Chrome เมื่อพรอมป์สิทธิ์ดั้งเดิมของ Chrome
  ปรากฏขึ้น
- ปิดหรือซ่อมแซมกล่องโต้ตอบสิทธิ์ของ Meet ที่ค้างอยู่

อย่ารายงานว่า "ยังไม่ได้ลงชื่อเข้าใช้" เพียงเพราะ Meet แสดง "Do you want people to
hear you in the meeting?" นั่นคือหน้าคั่นการเลือกเสียงของ Meet; OpenClaw
จะคลิก **Use microphone** ผ่านระบบอัตโนมัติของเบราว์เซอร์เมื่อทำได้ และรอ
สถานะการประชุมจริงต่อไป สำหรับ browser fallback แบบ create-only OpenClaw
อาจคลิก **Continue without microphone** เพราะการสร้าง URL ไม่จำเป็นต้องใช้
เส้นทางเสียงแบบเรียลไทม์

### การสร้างการประชุมล้มเหลว

`googlemeet create` จะใช้ endpoint `spaces.create` ของ Google Meet API ก่อน
เมื่อมีการกำหนดค่าข้อมูลรับรอง OAuth หากไม่มีข้อมูลรับรอง OAuth จะ fallback
ไปใช้เบราว์เซอร์ของ Chrome node ที่ปักหมุดไว้ ยืนยันว่า:

- สำหรับการสร้างผ่าน API: มีการกำหนดค่า `oauth.clientId` และ `oauth.refreshToken`
  หรือมีตัวแปร environment `OPENCLAW_GOOGLE_MEET_*` ที่ตรงกัน
- สำหรับการสร้างผ่าน API: refresh token ถูกสร้างหลังจากมีการเพิ่มการรองรับการสร้าง
  token รุ่นเก่าอาจไม่มี scope `meetings.space.created`; ให้รัน
  `openclaw googlemeet auth login --json` ใหม่และอัปเดต config ของ Plugin
- สำหรับ browser fallback: `defaultTransport: "chrome-node"` และ
  `chromeNode.node` ชี้ไปยัง Node ที่เชื่อมต่ออยู่พร้อม `browser.proxy` และ
  `googlemeet.chrome`
- สำหรับ browser fallback: โปรไฟล์ Chrome ของ OpenClaw บน Node นั้นได้ลงชื่อเข้าใช้
  Google แล้ว และสามารถเปิด `https://meet.google.com/new` ได้
- สำหรับ browser fallback: การลองใหม่จะใช้แท็บ `https://meet.google.com/new`
  หรือแท็บพรอมป์บัญชี Google ที่มีอยู่แล้วซ้ำก่อนเปิดแท็บใหม่ หากเอเจนต์หมดเวลา
  ให้ลองเรียก tool ใหม่แทนการเปิดแท็บ Meet ใหม่ด้วยตนเอง
- สำหรับ browser fallback: หาก tool ส่งคืน `manualActionRequired: true` ให้ใช้
  `browser.nodeId`, `browser.targetId`, `browserUrl` และ
  `manualActionMessage` ที่ส่งกลับมาเพื่อนำทางผู้ปฏิบัติงาน อย่าลองใหม่เป็นลูปจนกว่า
  การดำเนินการนั้นจะเสร็จสิ้น
- สำหรับ browser fallback: หาก Meet แสดง "Do you want people to hear you in the
  meeting?" ให้คงแท็บนั้นเปิดไว้ OpenClaw ควรคลิก **Use microphone** หรือสำหรับ
  fallback แบบ create-only ให้คลิก **Continue without microphone** ผ่านระบบอัตโนมัติของเบราว์เซอร์
  แล้วรอ URL ของ Meet ที่ถูกสร้างต่อไป หากทำไม่ได้ ข้อผิดพลาด
  ควรระบุ `meet-audio-choice-required` ไม่ใช่ `google-login-required`

### เอเจนต์เข้าร่วมแล้วแต่ไม่พูด

ตรวจสอบเส้นทางแบบเรียลไทม์:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

ใช้ `mode: "realtime"` สำหรับการฟัง/พูดตอบกลับ `mode: "transcribe"` นั้นตั้งใจให้
ไม่เริ่ม realtime voice bridge แบบสองทาง

ตรวจสอบเพิ่มเติมด้วยว่า:

- มีคีย์ผู้ให้บริการแบบเรียลไทม์บนโฮสต์ Gateway เช่น
  `OPENAI_API_KEY` หรือ `GEMINI_API_KEY`
- มองเห็น `BlackHole 2ch` บนโฮสต์ Chrome
- มี `rec` และ `play` อยู่บนโฮสต์ Chrome
- ไมโครโฟนและลำโพงของ Meet ถูกกำหนดเส้นทางผ่านเส้นทางเสียงเสมือนที่
  OpenClaw ใช้งาน

`googlemeet doctor [session-id]` จะแสดงเซสชัน, Node, สถานะ in-call,
เหตุผลของ manual action, การเชื่อมต่อผู้ให้บริการแบบเรียลไทม์, `realtimeReady`, กิจกรรมเสียง
input/output, เวลาของเสียงล่าสุด, ตัวนับไบต์ และ URL ของเบราว์เซอร์
ใช้ `googlemeet status [session-id]` เมื่อคุณต้องการ JSON แบบดิบ ใช้
`googlemeet doctor --oauth` เมื่อคุณต้องการยืนยันการรีเฟรช OAuth ของ Google Meet
โดยไม่เปิดเผย token; เพิ่ม `--meeting` หรือ `--create-space` เมื่อคุณต้องการหลักฐานจาก Google Meet API ด้วย

หากเอเจนต์หมดเวลาและคุณเห็นแท็บ Meet เปิดอยู่แล้ว ให้ตรวจสอบแท็บนั้น
โดยไม่เปิดแท็บใหม่:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

action ของ tool ที่เทียบเท่าคือ `recover_current_tab` โดยจะโฟกัสและตรวจสอบ
แท็บ Meet ที่มีอยู่สำหรับ transport ที่เลือก เมื่อใช้ `chrome` จะใช้การควบคุม
เบราว์เซอร์แบบโลคัลผ่าน Gateway; เมื่อใช้ `chrome-node` จะใช้ Chrome node
ที่กำหนดค่าไว้ จะไม่เปิดแท็บใหม่หรือสร้างเซสชันใหม่; แต่จะรายงานตัวบล็อกปัจจุบัน เช่น
การเข้าสู่ระบบ การอนุมัติ สิทธิ์ หรือสถานะการเลือกเสียง
คำสั่ง CLI จะคุยกับ Gateway ที่กำหนดค่าไว้ ดังนั้น Gateway ต้องกำลังรันอยู่;
`chrome-node` ยังต้องให้ Chrome node เชื่อมต่ออยู่ด้วย

### การตรวจสอบการตั้งค่า Twilio ล้มเหลว

`twilio-voice-call-plugin` จะล้มเหลวเมื่อ `voice-call` ไม่ได้รับอนุญาตหรือไม่ได้เปิดใช้งาน
ให้เพิ่มลงใน `plugins.allow`, เปิดใช้งาน `plugins.entries.voice-call` และรีโหลด
Gateway

`twilio-voice-call-credentials` จะล้มเหลวเมื่อ backend ของ Twilio ไม่มี account
SID, auth token หรือหมายเลขผู้โทร ให้ตั้งค่าบนโฮสต์ Gateway ดังนี้:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

จากนั้นรีสตาร์ตหรือรีโหลด Gateway แล้วรัน:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` เป็นแบบตรวจสอบความพร้อมเท่านั้นโดยค่าเริ่มต้น หากต้องการ dry-run หมายเลขเฉพาะ:

```bash
openclaw voicecall smoke --to "+15555550123"
```

เพิ่ม `--yes` เฉพาะเมื่อคุณต้องการโทรแจ้งออกจริงแบบ live โดยตั้งใจ:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### การโทร Twilio เริ่มแล้วแต่ไม่เข้าประชุมเลย

ยืนยันว่า event ของ Meet แสดงรายละเอียดการโทรเข้า ส่งหมายเลขโทรเข้า
และ PIN หรือชุด DTMF แบบกำหนดเองให้ตรง:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

ใช้ `w` นำหน้าหรือเครื่องหมายจุลภาคใน `--dtmf-sequence` หากผู้ให้บริการต้องการช่วงหยุด
ก่อนป้อน PIN

## หมายเหตุ

media API อย่างเป็นทางการของ Google Meet เน้นการรับข้อมูลเป็นหลัก ดังนั้นการพูดเข้าไปในการโทร
Meet ยังคงต้องใช้เส้นทางของผู้เข้าร่วม Plugin นี้ทำให้ขอบเขตนั้นมองเห็นได้ชัด:
Chrome จัดการการเข้าร่วมผ่านเบราว์เซอร์และการกำหนดเส้นทางเสียงแบบโลคัล; Twilio จัดการ
การเข้าร่วมแบบโทรเข้า

โหมด Chrome realtime ต้องมีอย่างใดอย่างหนึ่งต่อไปนี้:

- `chrome.audioInputCommand` พร้อม `chrome.audioOutputCommand`: OpenClaw เป็นเจ้าของ
  realtime model bridge และส่งผ่านเสียง G.711 mu-law 8 kHz ระหว่าง
  คำสั่งเหล่านั้นกับผู้ให้บริการเสียงแบบเรียลไทม์ที่เลือก
- `chrome.audioBridgeCommand`: คำสั่ง bridge ภายนอกเป็นเจ้าของเส้นทางเสียงแบบโลคัลทั้งหมด
  และต้องออกจากโปรเซสหลังจากเริ่มหรือยืนยัน daemon ของมัน

สำหรับเสียงสองทางที่สะอาด ให้กำหนดเส้นทางเอาต์พุตของ Meet และไมโครโฟนของ Meet ผ่าน
อุปกรณ์เสมือนแยกกันหรือกราฟอุปกรณ์เสมือนแบบ Loopback การใช้
อุปกรณ์ BlackHole ร่วมกันตัวเดียวอาจสะท้อนเสียงของผู้เข้าร่วมคนอื่นกลับเข้าไปในการโทร

`googlemeet speak` จะเรียก realtime audio bridge ที่ใช้งานอยู่สำหรับ
เซสชัน Chrome `googlemeet leave` จะหยุด bridge นั้น สำหรับเซสชัน Twilio ที่ถูก delegate
ผ่าน Plugin Voice Call คำสั่ง `leave` จะวางสายการโทรเสียงพื้นฐานด้วย

## ที่เกี่ยวข้อง

- [Plugin Voice Call](/th/plugins/voice-call)
- [Talk mode](/th/nodes/talk)
- [การสร้าง Plugin](/th/plugins/building-plugins)
