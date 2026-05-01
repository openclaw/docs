---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw เข้าร่วมการประชุม Google Meet
    - คุณต้องการให้เอเจนต์ OpenClaw สร้างการโทร Google Meet ใหม่
    - คุณกำลังกำหนดค่า Chrome, โหนด Chrome หรือ Twilio ให้เป็นทรานสปอร์ตของ Google Meet
summary: 'Plugin Google Meet: เข้าร่วม URL ของ Meet ที่ระบุโดยตรงผ่าน Chrome หรือ Twilio พร้อมค่าเริ่มต้นสำหรับเสียงแบบเรียลไทม์'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-01T10:19:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9d0d195fc709e487ef1bf5603fdb32fade1b6a0a13aa9bed5110979490f92ff
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet รองรับผู้เข้าร่วมสำหรับ OpenClaw — Plugin ตั้งใจให้ทำงานแบบระบุชัดเจนโดยการออกแบบ:

- เข้าร่วมได้เฉพาะ URL `https://meet.google.com/...` ที่ระบุอย่างชัดเจนเท่านั้น
- สร้างพื้นที่ Meet ใหม่ผ่าน Google Meet API ได้ แล้วเข้าร่วม URL ที่ส่งคืน
- `realtime` voice เป็นโหมดเริ่มต้น
- Realtime voice สามารถเรียกกลับเข้าไปยังเอเจนต์ OpenClaw แบบเต็มได้เมื่อต้องใช้การให้เหตุผลหรือเครื่องมือที่ลึกขึ้น
- เอเจนต์เลือกพฤติกรรมการเข้าร่วมด้วย `mode`: ใช้ `realtime` สำหรับการฟัง/ตอบกลับด้วยเสียงสด หรือ `transcribe` เพื่อเข้าร่วม/ควบคุมเบราว์เซอร์โดยไม่มีสะพาน realtime voice
- การยืนยันตัวตนเริ่มจาก Google OAuth ส่วนบุคคลหรือโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้อยู่แล้ว
- ไม่มีการประกาศขอความยินยอมอัตโนมัติ
- แบ็กเอนด์เสียง Chrome เริ่มต้นคือ `BlackHole 2ch`
- Chrome สามารถทำงานในเครื่องหรือบนโฮสต์ node ที่จับคู่ไว้
- Twilio รับหมายเลขโทรเข้า พร้อม PIN หรือชุด DTMF ที่ไม่บังคับ
- คำสั่ง CLI คือ `googlemeet`; `meet` ถูกสงวนไว้สำหรับเวิร์กโฟลว์การประชุมทางไกลของเอเจนต์ที่กว้างกว่า

## เริ่มต้นอย่างรวดเร็ว

ติดตั้งดีเพนเดนซีเสียงในเครื่องและกำหนดค่า provider realtime voice แบ็กเอนด์ OpenAI เป็นค่าเริ่มต้น; Google Gemini Live ก็ทำงานได้เช่นกันด้วย `realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` ติดตั้งอุปกรณ์เสียงเสมือน `BlackHole 2ch` ตัวติดตั้งของ Homebrew ต้องรีบูตก่อนที่ macOS จะแสดงอุปกรณ์นี้:

```bash
sudo reboot
```

หลังรีบูต ให้ตรวจสอบทั้งสองส่วน:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

เปิดใช้ Plugin:

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

เอาต์พุตการตั้งค่าถูกออกแบบให้อ่านได้โดยเอเจนต์และรับรู้โหมด รายงานโปรไฟล์ Chrome, การปักหมุด node และสำหรับการเข้าร่วม Chrome แบบ realtime จะรายงานสะพานเสียง BlackHole/SoX และการตรวจสอบคำแนะนำ realtime แบบหน่วงเวลา สำหรับการเข้าร่วมแบบสังเกตเท่านั้น ให้ตรวจสอบการขนส่งเดียวกันด้วย `--mode transcribe`; โหมดนั้นข้ามข้อกำหนดเบื้องต้นของเสียง realtime เพราะไม่ได้ฟังผ่านหรือพูดผ่านสะพาน:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

เมื่อกำหนดค่าการมอบหมาย Twilio แล้ว การตั้งค่ายังรายงานด้วยว่า Plugin `voice-call`, ข้อมูลประจำตัว Twilio และการเปิดเผย Webhook สาธารณะพร้อมหรือไม่ ให้ถือการตรวจสอบใด ๆ ที่เป็น `ok: false` เป็นตัวบล็อกสำหรับการขนส่งและโหมดที่ตรวจสอบก่อนขอให้เอเจนต์เข้าร่วม ใช้ `openclaw googlemeet setup --json` สำหรับสคริปต์หรือเอาต์พุตที่เครื่องอ่านได้ ใช้ `--transport chrome`, `--transport chrome-node` หรือ `--transport twilio` เพื่อ preflight การขนส่งเฉพาะก่อนที่เอเจนต์จะลองใช้

สำหรับ Twilio ให้ preflight การขนส่งอย่างชัดเจนเสมอเมื่อการขนส่งเริ่มต้นคือ Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

ซึ่งจะจับการเชื่อมต่อ `voice-call` ที่ขาดหาย ข้อมูลประจำตัว Twilio หรือการเปิดเผย Webhook ที่เข้าถึงไม่ได้ก่อนที่เอเจนต์จะพยายามโทรเข้าการประชุม

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

`googlemeet create` มีสองเส้นทาง:

- สร้างผ่าน API: ใช้เมื่อมีการกำหนดค่าข้อมูลประจำตัว Google Meet OAuth นี่เป็นเส้นทางที่กำหนดผลได้แน่นอนที่สุดและไม่ขึ้นกับสถานะ UI ของเบราว์เซอร์
- ทางเลือกสำรองของเบราว์เซอร์: ใช้เมื่อไม่มีข้อมูลประจำตัว OAuth OpenClaw ใช้ node Chrome ที่ปักหมุดไว้ เปิด `https://meet.google.com/new` รอให้ Google เปลี่ยนเส้นทางไปยัง URL รหัสการประชุมจริง แล้วส่งคืน URL นั้น เส้นทางนี้ต้องให้โปรไฟล์ Chrome ของ OpenClaw บน node ลงชื่อเข้าใช้ Google อยู่แล้ว ระบบอัตโนมัติของเบราว์เซอร์จัดการพรอมป์ไมโครโฟนครั้งแรกของ Meet เอง; พรอมป์นั้นไม่ถือเป็นความล้มเหลวในการเข้าสู่ระบบ Google
  โฟลว์เข้าร่วมและสร้างยังพยายามใช้แท็บ Meet ที่มีอยู่ซ้ำก่อนเปิดแท็บใหม่ การจับคู่จะละเว้นสตริงคิวรี URL ที่ไม่เป็นอันตราย เช่น `authuser` ดังนั้นการลองซ้ำของเอเจนต์ควรโฟกัสการประชุมที่เปิดอยู่แล้วแทนที่จะสร้างแท็บ Chrome ที่สอง

เอาต์พุตของคำสั่ง/เครื่องมือมีฟิลด์ `source` (`api` หรือ `browser`) เพื่อให้เอเจนต์อธิบายได้ว่าใช้เส้นทางใด `create` เข้าร่วมการประชุมใหม่ตามค่าเริ่มต้นและส่งคืน `joined: true` พร้อมเซสชันการเข้าร่วม หากต้องการ mint เฉพาะ URL ให้ใช้ `create --no-join` บน CLI หรือส่ง `"join": false` ไปยังเครื่องมือ

หรือบอกเอเจนต์ว่า: "สร้าง Google Meet เข้าร่วมด้วย realtime voice และส่งลิงก์ให้ฉัน" เอเจนต์ควรเรียก `google_meet` ด้วย `action: "create"` แล้วแชร์ `meetingUri` ที่ส่งคืน

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

สำหรับการเข้าร่วมแบบสังเกตเท่านั้น/ควบคุมเบราว์เซอร์ ให้ตั้งค่า `"mode": "transcribe"` ซึ่งจะไม่เริ่มสะพานโมเดล realtime แบบดูเพล็กซ์ ไม่ต้องใช้ BlackHole หรือ SoX และจะไม่พูดตอบกลับในการประชุม การเข้าร่วม Chrome ในโหมดนี้ยังหลีกเลี่ยงการให้สิทธิ์ไมโครโฟน/กล้องของ OpenClaw และหลีกเลี่ยงเส้นทาง **Use microphone** ของ Meet หาก Meet แสดงหน้าแทรกให้เลือกเสียง ระบบอัตโนมัติจะลองเส้นทางที่ไม่มีไมโครโฟน มิฉะนั้นจะรายงานการดำเนินการด้วยตนเองแทนการเปิดไมโครโฟนในเครื่อง

ระหว่างเซสชัน realtime สถานะ `google_meet` มีสุขภาพของเบราว์เซอร์และสะพานเสียง เช่น `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, เวลาอินพุต/เอาต์พุตล่าสุด ตัวนับไบต์ และสถานะการปิดสะพาน หากมีพรอมป์หน้า Meet ที่ปลอดภัยปรากฏขึ้น ระบบอัตโนมัติของเบราว์เซอร์จะจัดการเมื่อทำได้ การเข้าสู่ระบบ การรับเข้าของโฮสต์ และพรอมป์สิทธิ์เบราว์เซอร์/OS จะถูกรายงานเป็นการดำเนินการด้วยตนเองพร้อมเหตุผลและข้อความเพื่อให้เอเจนต์ส่งต่อ เซสชัน Chrome ที่จัดการจะส่งวลีแนะนำหรือทดสอบออกมาเฉพาะหลังจากสุขภาพเบราว์เซอร์รายงาน `inCall: true`; มิฉะนั้นสถานะจะรายงาน `speechReady: false` และความพยายามพูดจะถูกบล็อกแทนการแสร้งว่าเอเจนต์พูดเข้าไปในการประชุม

การเข้าร่วม Chrome ในเครื่องใช้โปรไฟล์เบราว์เซอร์ OpenClaw ที่ลงชื่อเข้าใช้แล้ว โหมด Realtime ต้องใช้ `BlackHole 2ch` สำหรับเส้นทางไมโครโฟน/ลำโพงที่ OpenClaw ใช้ สำหรับเสียงดูเพล็กซ์ที่สะอาด ให้ใช้อุปกรณ์เสมือนแยกกันหรือกราฟสไตล์ Loopback; อุปกรณ์ BlackHole เพียงตัวเดียวเพียงพอสำหรับการทดสอบ smoke ครั้งแรก แต่อาจเกิดเสียงสะท้อน

### Gateway ในเครื่อง + Parallels Chrome

คุณ **ไม่** จำเป็นต้องมี OpenClaw Gateway เต็มรูปแบบหรือคีย์ API โมเดลใน VM macOS เพียงเพื่อให้ VM เป็นเจ้าของ Chrome ให้รัน Gateway และเอเจนต์ในเครื่อง แล้วรันโฮสต์ node ใน VM เปิดใช้ Plugin ที่มาพร้อมชุดบน VM หนึ่งครั้งเพื่อให้ node โฆษณาคำสั่ง Chrome:

สิ่งที่รันที่ไหน:

- โฮสต์ Gateway: OpenClaw Gateway, เวิร์กสเปซเอเจนต์, คีย์โมเดล/API, provider realtime และการกำหนดค่า Plugin Google Meet
- Parallels macOS VM: OpenClaw CLI/โฮสต์ node, Google Chrome, SoX, BlackHole 2ch และโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้ Google
- ไม่จำเป็นใน VM: บริการ Gateway, การกำหนดค่าเอเจนต์, คีย์ OpenAI/GPT หรือการตั้งค่า provider โมเดล

ติดตั้งดีเพนเดนซี VM:

```bash
brew install blackhole-2ch sox
```

รีบูต VM หลังติดตั้ง BlackHole เพื่อให้ macOS แสดง `BlackHole 2ch`:

```bash
sudo reboot
```

หลังรีบูต ตรวจสอบว่า VM เห็นอุปกรณ์เสียงและคำสั่ง SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

ติดตั้งหรืออัปเดต OpenClaw ใน VM แล้วเปิดใช้ Plugin ที่มาพร้อมชุดที่นั่น:

```bash
openclaw plugins enable google-meet
```

เริ่มโฮสต์ node ใน VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

หาก `<gateway-host>` เป็น IP LAN และคุณไม่ได้ใช้ TLS node จะปฏิเสธ WebSocket แบบ plaintext เว้นแต่คุณจะยินยอมสำหรับเครือข่ายส่วนตัวที่เชื่อถือได้นั้น:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

ใช้ตัวแปรสภาพแวดล้อมเดียวกันเมื่อติดตั้ง node เป็น LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` เป็นสภาพแวดล้อมของกระบวนการ ไม่ใช่การตั้งค่า `openclaw.json` `openclaw node install` จะจัดเก็บไว้ในสภาพแวดล้อม LaunchAgent เมื่อมีอยู่ในคำสั่งติดตั้ง

อนุมัติ node จากโฮสต์ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

ยืนยันว่า Gateway เห็น node และ node โฆษณาทั้ง `googlemeet.chrome` และความสามารถของเบราว์เซอร์/`browser.proxy`:

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

ตอนนี้เข้าร่วมตามปกติจากโฮสต์ Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

หรือขอให้เอเจนต์ใช้เครื่องมือ `google_meet` ด้วย `transport: "chrome-node"`

สำหรับการทดสอบ smoke ด้วยคำสั่งเดียวที่สร้างหรือใช้เซสชันซ้ำ พูดวลีที่ทราบ และพิมพ์สุขภาพเซสชัน:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

ระหว่างการเข้าร่วมแบบ realtime ระบบอัตโนมัติเบราว์เซอร์ของ OpenClaw จะกรอกชื่อผู้เยี่ยมชม คลิก Join/Ask to join และยอมรับตัวเลือก "Use microphone" ครั้งแรกของ Meet เมื่อพรอมป์นั้นปรากฏขึ้น ระหว่างการเข้าร่วมแบบสังเกตเท่านั้นหรือการสร้างการประชุมผ่านเบราว์เซอร์เท่านั้น จะดำเนินต่อผ่านพรอมป์เดียวกันโดยไม่มีไมโครโฟนเมื่อมีตัวเลือกนั้น หากโปรไฟล์เบราว์เซอร์ไม่ได้ลงชื่อเข้าใช้ Meet กำลังรอการรับเข้าจากโฮสต์ Chrome ต้องการสิทธิ์ไมโครโฟน/กล้องสำหรับการเข้าร่วมแบบ realtime หรือ Meet ค้างอยู่บนพรอมป์ที่ระบบอัตโนมัติแก้ไม่ได้ ผลลัพธ์ join/test-speech จะรายงาน `manualActionRequired: true` พร้อม `manualActionReason` และ `manualActionMessage` เอเจนต์ควรหยุดลองเข้าร่วมซ้ำ รายงานข้อความนั้นตามจริงพร้อม `browserUrl`/`browserTitle` ปัจจุบัน และลองใหม่เฉพาะหลังการดำเนินการเบราว์เซอร์ด้วยตนเองเสร็จสมบูรณ์

หากละเว้น `chromeNode.node` OpenClaw จะเลือกอัตโนมัติเฉพาะเมื่อมี node ที่เชื่อมต่ออยู่เพียงหนึ่งรายการซึ่งโฆษณาทั้ง `googlemeet.chrome` และการควบคุมเบราว์เซอร์ หากมี node ที่มีความสามารถหลายรายการเชื่อมต่ออยู่ ให้ตั้งค่า `chromeNode.node` เป็นรหัส node, ชื่อที่แสดง หรือ IP ระยะไกล

การตรวจสอบความล้มเหลวที่พบบ่อย:

- `Configured Google Meet node ... is not usable: offline`: โหนดที่ปักหมุดไว้เป็นที่รู้จักโดย Gateway แต่ไม่พร้อมใช้งาน Agents ควรมองโหนดนั้นเป็นสถานะวินิจฉัย ไม่ใช่เป็นโฮสต์ Chrome ที่ใช้งานได้ และรายงานตัวบล็อกการตั้งค่าแทนการถอยกลับไปใช้ transport อื่น เว้นแต่ผู้ใช้ร้องขอเช่นนั้น
- `No connected Google Meet-capable node`: เริ่ม `openclaw node run` ใน VM, อนุมัติการจับคู่ และตรวจสอบให้แน่ใจว่าได้รัน `openclaw plugins enable google-meet` และ `openclaw plugins enable browser` ใน VM แล้ว และยืนยันด้วยว่าโฮสต์ Gateway อนุญาตคำสั่งโหนดทั้งสองด้วย `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`
- `BlackHole 2ch audio device not found`: ติดตั้ง `blackhole-2ch` บนโฮสต์ที่กำลังตรวจสอบ และรีบูตก่อนใช้เสียง Chrome แบบโลคัล
- `BlackHole 2ch audio device not found on the node`: ติดตั้ง `blackhole-2ch` ใน VM แล้วรีบูต VM
- Chrome เปิดขึ้นแต่เข้าร่วมไม่ได้: ลงชื่อเข้าใช้โปรไฟล์เบราว์เซอร์ภายใน VM หรือคงค่า `chrome.guestName` ไว้สำหรับการเข้าร่วมแบบผู้เยี่ยมชม การเข้าร่วมอัตโนมัติแบบผู้เยี่ยมชมใช้ระบบอัตโนมัติเบราว์เซอร์ของ OpenClaw ผ่านพร็อกซีเบราว์เซอร์ของโหนด ตรวจสอบให้แน่ใจว่าคอนฟิกเบราว์เซอร์ของโหนดชี้ไปยังโปรไฟล์ที่คุณต้องการ เช่น `browser.defaultProfile: "user"` หรือโปรไฟล์เซสชันที่มีอยู่และมีชื่อกำหนดไว้
- แท็บ Meet ซ้ำกัน: เปิดใช้ `chrome.reuseExistingTab: true` ไว้ OpenClaw จะเปิดใช้งานแท็บที่มีอยู่สำหรับ Meet URL เดียวกันก่อนเปิดแท็บใหม่ และการสร้างการประชุมผ่านเบราว์เซอร์จะใช้แท็บ `https://meet.google.com/new` หรือแท็บพร้อมต์บัญชี Google ที่กำลังดำเนินอยู่ซ้ำก่อนเปิดอีกแท็บ
- ไม่มีเสียง: ใน Meet ให้กำหนดเส้นทางไมโครโฟน/ลำโพงผ่านพาธอุปกรณ์เสียงเสมือนที่ OpenClaw ใช้ ใช้อุปกรณ์เสมือนแยกกันหรือการกำหนดเส้นทางแบบ Loopback เพื่อเสียงดูเพล็กซ์ที่สะอาด

## หมายเหตุการติดตั้ง

ค่าเริ่มต้นแบบเรียลไทม์ของ Chrome ใช้เครื่องมือภายนอกสองรายการ:

- `sox`: ยูทิลิตีเสียงบรรทัดคำสั่ง Plugin ใช้คำสั่งอุปกรณ์ CoreAudio แบบชัดเจนสำหรับบริดจ์เสียง PCM16 24 kHz เริ่มต้น
- `blackhole-2ch`: ไดรเวอร์เสียงเสมือนของ macOS เครื่องมือนี้สร้างอุปกรณ์เสียง `BlackHole 2ch` ที่ Chrome/Meet สามารถกำหนดเส้นทางผ่านได้

OpenClaw ไม่บันเดิลหรือแจกจ่ายแพ็กเกจใดแพ็กเกจหนึ่ง เอกสารขอให้ผู้ใช้ติดตั้งแพ็กเกจเหล่านี้เป็น dependency ของโฮสต์ผ่าน Homebrew SoX ใช้สัญญาอนุญาต `LGPL-2.0-only AND GPL-2.0-only`; BlackHole เป็น GPL-3.0 หากคุณสร้างตัวติดตั้งหรือ appliance ที่บันเดิล BlackHole กับ OpenClaw ให้ตรวจสอบเงื่อนไขสัญญาอนุญาต upstream ของ BlackHole หรือขอใบอนุญาตแยกจาก Existential Audio

## Transports

### Chrome

Chrome transport เปิด Meet URL ผ่านการควบคุมเบราว์เซอร์ของ OpenClaw และเข้าร่วมด้วยโปรไฟล์เบราว์เซอร์ OpenClaw ที่ลงชื่อเข้าใช้อยู่ บน macOS Plugin จะตรวจหา `BlackHole 2ch` ก่อนเปิดใช้งาน หากกำหนดค่าไว้ จะรันคำสั่งตรวจสุขภาพบริดจ์เสียงและคำสั่งเริ่มต้นก่อนเปิด Chrome ด้วย ใช้ `chrome` เมื่อ Chrome/เสียงอยู่บนโฮสต์ Gateway; ใช้ `chrome-node` เมื่อ Chrome/เสียงอยู่บนโหนดที่จับคู่ไว้ เช่น Parallels macOS VM สำหรับ Chrome แบบโลคัล ให้เลือกโปรไฟล์ด้วย `browser.defaultProfile`; `chrome.browserProfile` จะถูกส่งไปยังโฮสต์ `chrome-node`

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

กำหนดเส้นทางเสียงไมโครโฟนและลำโพงของ Chrome ผ่านบริดจ์เสียง OpenClaw แบบโลคัล หากไม่ได้ติดตั้ง `BlackHole 2ch` การเข้าร่วมจะล้มเหลวพร้อมข้อผิดพลาดการตั้งค่า แทนที่จะเข้าร่วมอย่างเงียบ ๆ โดยไม่มีพาธเสียง

### Twilio

Twilio transport เป็นแผนการโทรที่เข้มงวดซึ่งมอบหมายให้ Voice Call plugin ไม่ได้แยกวิเคราะห์หน้า Meet เพื่อหาหมายเลขโทรศัพท์

ใช้สิ่งนี้เมื่อการเข้าร่วมผ่าน Chrome ไม่พร้อมใช้งาน หรือเมื่อคุณต้องการ fallback แบบโทรเข้า Google Meet ต้องแสดงหมายเลขโทรเข้าและ PIN สำหรับการประชุม; OpenClaw ไม่ค้นพบข้อมูลเหล่านั้นจากหน้า Meet

เปิดใช้ Voice Call plugin บนโฮสต์ Gateway ไม่ใช่บนโหนด Chrome:

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

ระบุข้อมูลประจำตัว Twilio ผ่านสภาพแวดล้อมหรือคอนฟิก สภาพแวดล้อมช่วยเก็บความลับไม่ให้อยู่ใน `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

รีสตาร์ตหรือโหลด Gateway ใหม่หลังจากเปิดใช้ `voice-call`; การเปลี่ยนแปลงคอนฟิก Plugin จะไม่ปรากฏในกระบวนการ Gateway ที่กำลังรันอยู่จนกว่าจะโหลดใหม่

จากนั้นตรวจสอบ:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

เมื่อการมอบหมาย Twilio ถูกเชื่อมต่อแล้ว `googlemeet setup` จะรวมการตรวจสอบ `twilio-voice-call-plugin`, `twilio-voice-call-credentials` และ `twilio-voice-call-webhook` ที่สำเร็จ

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

ใช้ `--dtmf-sequence` เมื่อการประชุมต้องการลำดับที่กำหนดเอง:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth และ preflight

OAuth เป็นตัวเลือกสำหรับการสร้างลิงก์ Meet เพราะ `googlemeet create` สามารถ fallback ไปใช้ระบบอัตโนมัติเบราว์เซอร์ได้ กำหนดค่า OAuth เมื่อคุณต้องการการสร้างผ่าน API อย่างเป็นทางการ การแปลง space หรือการตรวจ preflight ของ Meet Media API

การเข้าถึง Google Meet API ใช้ OAuth ของผู้ใช้: สร้าง Google Cloud OAuth client, ขอ scope ที่จำเป็น, อนุญาตบัญชี Google จากนั้นเก็บ refresh token ที่ได้ไว้ในคอนฟิก Google Meet plugin หรือระบุตัวแปรสภาพแวดล้อม `OPENCLAW_GOOGLE_MEET_*`

OAuth ไม่ได้แทนที่พาธเข้าร่วมผ่าน Chrome Chrome และ Chrome-node transports ยังคงเข้าร่วมผ่านโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้, BlackHole/SoX และโหนดที่เชื่อมต่อ เมื่อคุณใช้การเข้าร่วมผ่านเบราว์เซอร์ OAuth ใช้เฉพาะกับพาธ Google Meet API อย่างเป็นทางการ: สร้างพื้นที่ประชุม, แปลง space และรันการตรวจ preflight ของ Meet Media API

### สร้างข้อมูลประจำตัว Google

ใน Google Cloud Console:

1. สร้างหรือเลือกโปรเจกต์ Google Cloud
2. เปิดใช้ **Google Meet REST API** สำหรับโปรเจกต์นั้น
3. กำหนดค่าหน้าจอยินยอม OAuth
   - **Internal** ง่ายที่สุดสำหรับองค์กร Google Workspace
   - **External** ใช้ได้กับการตั้งค่าส่วนตัว/ทดสอบ; ขณะที่แอปอยู่ใน Testing ให้เพิ่มบัญชี Google แต่ละบัญชีที่จะอนุญาตแอปเป็นผู้ใช้ทดสอบ
4. เพิ่ม scope ที่ OpenClaw ขอ:
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

Google Meet `spaces.create` ต้องใช้ `meetings.space.created`
`meetings.space.readonly` ช่วยให้ OpenClaw แปลง Meet URL/รหัสเป็น space ได้
`meetings.conference.media.readonly` ใช้สำหรับ preflight ของ Meet Media API และงานสื่อ Google อาจกำหนดให้ลงทะเบียน Developer Preview สำหรับการใช้งาน Media API จริง หากคุณต้องการเพียงการเข้าร่วม Chrome ผ่านเบราว์เซอร์ ให้ข้าม OAuth ทั้งหมด

### สร้าง refresh token

กำหนดค่า `oauth.clientId` และเลือกกำหนด `oauth.clientSecret` หรือส่งผ่านเป็นตัวแปรสภาพแวดล้อม จากนั้นรัน:

```bash
openclaw googlemeet auth login --json
```

คำสั่งจะพิมพ์บล็อกคอนฟิก `oauth` พร้อม refresh token คำสั่งนี้ใช้ PKCE, callback localhost ที่ `http://localhost:8085/oauth2callback` และโฟลว์คัดลอก/วางด้วยตนเองผ่าน `--manual`

ตัวอย่าง:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

ใช้โหมด manual เมื่อเบราว์เซอร์เข้าถึง callback โลคัลไม่ได้:

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

เก็บออบเจกต์ `oauth` ไว้ใต้คอนฟิก Google Meet plugin:

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

ใช้ตัวแปรสภาพแวดล้อมเมื่อคุณไม่ต้องการให้ refresh token อยู่ในคอนฟิก หากมีค่าทั้งคอนฟิกและสภาพแวดล้อม Plugin จะเลือกคอนฟิกก่อน แล้วจึง fallback ไปยังสภาพแวดล้อม

การยินยอม OAuth รวมถึงการสร้าง Meet space, การเข้าถึงอ่าน Meet space และการเข้าถึงอ่านสื่อการประชุม Meet หากคุณยืนยันตัวตนก่อนที่การรองรับการสร้างการประชุมจะมีอยู่ ให้รัน `openclaw googlemeet auth login --json` อีกครั้ง เพื่อให้ refresh token มี scope `meetings.space.created`

### ตรวจสอบ OAuth ด้วย doctor

รัน OAuth doctor เมื่อคุณต้องการการตรวจสุขภาพแบบรวดเร็วและไม่เปิดเผยความลับ:

```bash
openclaw googlemeet doctor --oauth --json
```

สิ่งนี้จะไม่โหลด runtime ของ Chrome และไม่ต้องใช้โหนด Chrome ที่เชื่อมต่ออยู่ ตรวจสอบว่ามีคอนฟิก OAuth อยู่และ refresh token สามารถสร้าง access token ได้ รายงาน JSON รวมเฉพาะฟิลด์สถานะ เช่น `ok`, `configured`, `tokenSource`, `expiresAt` และข้อความตรวจสอบ; ไม่พิมพ์ access token, refresh token หรือ client secret

ผลลัพธ์ทั่วไป:

| การตรวจสอบ            | ความหมาย                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | มี `oauth.clientId` พร้อม `oauth.refreshToken` หรือ access token ที่แคชไว้       |
| `oauth-token`        | access token ที่แคชไว้ยังใช้ได้ หรือ refresh token สร้าง access token ใหม่แล้ว |
| `meet-spaces-get`    | การตรวจ `--meeting` แบบเลือกได้แปลง Meet space ที่มีอยู่แล้ว                             |
| `meet-spaces-create` | การตรวจ `--create-space` แบบเลือกได้สร้าง Meet space ใหม่                               |

เพื่อพิสูจน์การเปิดใช้ Google Meet API และ scope `spaces.create` ด้วย ให้รันการตรวจแบบสร้าง side effect:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` สร้าง Meet URL แบบใช้แล้วทิ้ง ใช้เมื่อคุณต้องยืนยันว่าโปรเจกต์ Google Cloud เปิดใช้ Meet API แล้ว และบัญชีที่ได้รับอนุญาตมี scope `meetings.space.created`

เพื่อพิสูจน์การเข้าถึงอ่านสำหรับพื้นที่ประชุมที่มีอยู่:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` และ `resolve-space` พิสูจน์การเข้าถึงอ่านไปยัง space ที่มีอยู่ซึ่งบัญชี Google ที่ได้รับอนุญาตเข้าถึงได้ `403` จากการตรวจเหล่านี้มักหมายความว่า Google Meet REST API ถูกปิดใช้งาน, refresh token ที่ยินยอมไว้ขาด scope ที่จำเป็น หรือบัญชี Google เข้าถึง Meet space นั้นไม่ได้ ข้อผิดพลาด refresh-token หมายความว่าให้รัน `openclaw googlemeet auth login
--json` อีกครั้ง แล้วเก็บบล็อก `oauth` ใหม่

ไม่จำเป็นต้องมีข้อมูลประจำตัว OAuth สำหรับ browser fallback ในโหมดนั้น การยืนยันตัวตนของ Google มาจากโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้บนโหนดที่เลือก ไม่ใช่จากคอนฟิก OpenClaw

ตัวแปรสภาพแวดล้อมเหล่านี้ได้รับการยอมรับเป็น fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` หรือ `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` หรือ `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` หรือ
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` หรือ `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` หรือ `GOOGLE_MEET_PREVIEW_ACK`

แปลง URL ของ Meet, รหัส หรือ `spaces/{id}` ผ่าน `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

เรียกใช้การตรวจสอบล่วงหน้าก่อนงานสื่อ:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

แสดงรายการอาร์ติแฟกต์ของการประชุมและการเข้าร่วมหลังจาก Meet สร้างระเบียนการประชุมแล้ว:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

เมื่อใช้ `--meeting`, `artifacts` และ `attendance` จะใช้ระเบียนการประชุมล่าสุด
ตามค่าเริ่มต้น ส่ง `--all-conference-records` เมื่อต้องการระเบียนที่เก็บไว้ทั้งหมด
สำหรับการประชุมนั้น

การค้นหาปฏิทินสามารถแปลง URL การประชุมจาก Google Calendar ก่อนอ่าน
อาร์ติแฟกต์ของ Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` ค้นหาปฏิทิน `primary` ของวันนี้สำหรับเหตุการณ์ใน Calendar ที่มีลิงก์
Google Meet ใช้ `--event <query>` เพื่อค้นหาข้อความเหตุการณ์ที่ตรงกัน และ
`--calendar <id>` สำหรับปฏิทินที่ไม่ใช่ปฏิทินหลัก การค้นหาปฏิทินต้องใช้การเข้าสู่ระบบ
OAuth ใหม่ที่รวมขอบเขตอ่านอย่างเดียวของเหตุการณ์ Calendar
`calendar-events` แสดงตัวอย่างเหตุการณ์ Meet ที่ตรงกัน และทำเครื่องหมายเหตุการณ์ที่
`latest`, `artifacts`, `attendance` หรือ `export` จะเลือก

หากทราบรหัสระเบียนการประชุมอยู่แล้ว ให้ระบุโดยตรง:

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

`artifacts` ส่งคืนเมตาดาต้าของระเบียนการประชุม พร้อมเมตาดาต้าทรัพยากรของผู้เข้าร่วม การบันทึก
ทรานสคริปต์ รายการทรานสคริปต์แบบมีโครงสร้าง และบันทึกอัจฉริยะ เมื่อ
Google เปิดเผยข้อมูลนั้นสำหรับการประชุม ใช้ `--no-transcript-entries` เพื่อข้าม
การค้นหารายการสำหรับการประชุมขนาดใหญ่ `attendance` ขยายผู้เข้าร่วมเป็น
แถวเซสชันผู้เข้าร่วมพร้อมเวลาเห็นครั้งแรก/ครั้งล่าสุด ระยะเวลาเซสชันรวม
แฟล็กมาสาย/ออกก่อนเวลา และทรัพยากรผู้เข้าร่วมซ้ำที่ผสานตามผู้ใช้ที่ลงชื่อเข้าใช้
หรือชื่อที่แสดง ส่ง `--no-merge-duplicates` เพื่อเก็บทรัพยากรผู้เข้าร่วมดิบ
แยกกัน, `--late-after-minutes` เพื่อปรับการตรวจจับการมาสาย และ
`--early-before-minutes` เพื่อปรับการตรวจจับการออกก่อนเวลา

`export` เขียนโฟลเดอร์ที่มี `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` และ `manifest.json`
`manifest.json` บันทึกอินพุตที่เลือก ตัวเลือกการส่งออก ระเบียนการประชุม
ไฟล์เอาต์พุต จำนวน แหล่งที่มาของโทเค็น เหตุการณ์ Calendar เมื่อมีการใช้ และคำเตือน
การดึงข้อมูลบางส่วนใดๆ ส่ง `--zip` เพื่อเขียนอาร์ไคฟ์แบบพกพาไว้ข้าง
โฟลเดอร์ด้วย ส่ง `--include-doc-bodies` เพื่อส่งออกข้อความ Google Docs ของทรานสคริปต์
และบันทึกอัจฉริยะที่ลิงก์ผ่าน Google Drive `files.export`; สิ่งนี้ต้องใช้การ
เข้าสู่ระบบ OAuth ใหม่ที่รวมขอบเขตอ่านอย่างเดียวของ Drive Meet หากไม่มี
`--include-doc-bodies` การส่งออกจะรวมเฉพาะเมตาดาต้า Meet และรายการทรานสคริปต์
แบบมีโครงสร้างเท่านั้น หาก Google ส่งคืนความล้มเหลวของอาร์ติแฟกต์บางส่วน เช่น ข้อผิดพลาด
การแสดงรายการบันทึกอัจฉริยะ รายการทรานสคริปต์ หรือเนื้อหาเอกสาร Drive สรุปและ
แมนิเฟสต์จะเก็บคำเตือนไว้แทนที่จะทำให้การส่งออกทั้งหมดล้มเหลว
ใช้ `--dry-run` เพื่อดึงข้อมูลอาร์ติแฟกต์/การเข้าร่วมเดียวกันและพิมพ์
JSON ของแมนิเฟสต์โดยไม่สร้างโฟลเดอร์หรือ ZIP ซึ่งมีประโยชน์ก่อนเขียน
การส่งออกขนาดใหญ่ หรือเมื่อเอเจนต์ต้องการเพียงจำนวน ระเบียนที่เลือก และ
คำเตือน

เอเจนต์ยังสามารถสร้างบันเดิลเดียวกันผ่านเครื่องมือ `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

ตั้งค่า `"dryRun": true` เพื่อส่งคืนเฉพาะแมนิเฟสต์การส่งออกและข้ามการเขียนไฟล์

เรียกใช้ live smoke ที่มีการป้องกันกับการประชุมจริงที่ยังถูกเก็บไว้:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

สภาพแวดล้อม live smoke:

- `OPENCLAW_LIVE_TEST=1` เปิดใช้การทดสอบสดที่มีการป้องกัน
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` ชี้ไปยัง URL ของ Meet, รหัส หรือ
  `spaces/{id}` ที่ยังถูกเก็บไว้
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID` ระบุรหัสไคลเอนต์
  OAuth
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN` ระบุ
  โทเค็นรีเฟรช
- ไม่บังคับ: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` และ
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ใช้ชื่อสำรองเดียวกัน
  โดยไม่มีคำนำหน้า `OPENCLAW_`

live smoke พื้นฐานสำหรับอาร์ติแฟกต์/การเข้าร่วมต้องใช้
`https://www.googleapis.com/auth/meetings.space.readonly` และ
`https://www.googleapis.com/auth/meetings.conference.media.readonly` การค้นหา Calendar
ต้องใช้ `https://www.googleapis.com/auth/calendar.events.readonly` การส่งออก
เนื้อหาเอกสาร Drive ต้องใช้
`https://www.googleapis.com/auth/drive.meet.readonly`

สร้างพื้นที่ Meet ใหม่:

```bash
openclaw googlemeet create
```

คำสั่งจะพิมพ์ `meeting uri` ใหม่ แหล่งที่มา และเซสชันเข้าร่วม เมื่อมีข้อมูลประจำตัว
OAuth จะใช้ Google Meet API อย่างเป็นทางการ หากไม่มีข้อมูลประจำตัว OAuth จะใช้
โปรไฟล์เบราว์เซอร์ที่ลงชื่อเข้าใช้ของ Node Chrome ที่ปักหมุดไว้เป็นทางสำรอง เอเจนต์สามารถ
ใช้เครื่องมือ `google_meet` พร้อม `action: "create"` เพื่อสร้างและเข้าร่วมในขั้นตอนเดียว
สำหรับการสร้างเฉพาะ URL ให้ส่ง `"join": false`

ตัวอย่างเอาต์พุต JSON จากทางสำรองของเบราว์เซอร์:

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

หากทางสำรองของเบราว์เซอร์เจอการเข้าสู่ระบบ Google หรือตัวขวางสิทธิ์ของ Meet ก่อนที่จะ
สร้าง URL ได้ เมธอด Gateway จะส่งคืนการตอบกลับที่ล้มเหลว และเครื่องมือ
`google_meet` จะส่งคืนรายละเอียดแบบมีโครงสร้างแทนสตริงธรรมดา:

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

เมื่อเอเจนต์เห็น `manualActionRequired: true` ควรรายงาน
`manualActionMessage` พร้อมบริบท Node/แท็บของเบราว์เซอร์ และหยุดเปิดแท็บ
Meet ใหม่จนกว่าผู้ปฏิบัติงานจะทำขั้นตอนในเบราว์เซอร์เสร็จ

ตัวอย่างเอาต์พุต JSON จากการสร้างผ่าน API:

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

การสร้าง Meet จะเข้าร่วมตามค่าเริ่มต้น ทรานสปอร์ต Chrome หรือ Chrome-node ยัง
ต้องใช้โปรไฟล์ Google Chrome ที่ลงชื่อเข้าใช้เพื่อเข้าร่วมผ่านเบราว์เซอร์ หาก
โปรไฟล์ออกจากระบบแล้ว OpenClaw จะรายงาน `manualActionRequired: true` หรือข้อผิดพลาด
ทางสำรองของเบราว์เซอร์ และขอให้ผู้ปฏิบัติงานเข้าสู่ระบบ Google ให้เสร็จก่อน
ลองใหม่

ตั้งค่า `preview.enrollmentAcknowledged: true` หลังจากยืนยันแล้วเท่านั้นว่าโปรเจกต์ Cloud,
ตัวตน OAuth และผู้เข้าร่วมประชุมของคุณได้ลงทะเบียนใน Google
Workspace Developer Preview Program สำหรับ Meet media APIs แล้ว

## การกำหนดค่า

เส้นทาง Chrome แบบเรียลไทม์ทั่วไปต้องการเพียงให้เปิดใช้ Plugin, BlackHole, SoX,
และคีย์ผู้ให้บริการเสียงเรียลไทม์แบ็กเอนด์ OpenAI เป็นค่าเริ่มต้น; ตั้งค่า
`realtime.provider: "google"` เพื่อใช้ Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

ตั้งค่าการกำหนดค่า Plugin ภายใต้ `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: รหัส/ชื่อ/IP ของ Node ที่ไม่บังคับสำหรับ `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ชื่อที่ใช้บนหน้าจอผู้เข้าร่วมแขก Meet
  ที่ไม่ได้ลงชื่อเข้าใช้
- `chrome.autoJoin: true`: กรอกชื่อแขกและคลิกเข้าร่วมทันทีแบบพยายามเต็มที่
  ผ่านการทำงานอัตโนมัติของเบราว์เซอร์ OpenClaw บน `chrome-node`
- `chrome.reuseExistingTab: true`: เปิดใช้งานแท็บ Meet ที่มีอยู่แทนที่จะ
  เปิดแท็บซ้ำ
- `chrome.waitForInCallMs: 20000`: รอให้แท็บ Meet รายงานว่าอยู่ในสาย
  ก่อนทริกเกอร์คำแนะนำเริ่มต้นแบบเรียลไทม์
- `chrome.audioFormat: "pcm16-24khz"`: รูปแบบเสียงของคู่คำสั่ง ใช้
  `"g711-ulaw-8khz"` เฉพาะกับคู่คำสั่งรุ่นเก่า/กำหนดเองที่ยังปล่อย
  เสียงโทรศัพท์
- `chrome.audioInputCommand`: คำสั่ง SoX ที่อ่านจาก CoreAudio `BlackHole 2ch`
  และเขียนเสียงใน `chrome.audioFormat`
- `chrome.audioOutputCommand`: คำสั่ง SoX ที่อ่านเสียงใน `chrome.audioFormat`
  และเขียนไปยัง CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: คำสั่งไมโครโฟนท้องถิ่นที่ไม่บังคับ ซึ่งเขียน
  PCM โมโน little-endian แบบ signed 16-bit สำหรับการตรวจจับการพูดแทรกระหว่าง
  ที่การเล่นเสียงของผู้ช่วยทำงานอยู่ ปัจจุบันใช้กับบริดจ์คู่คำสั่ง `chrome`
  ที่โฮสต์โดย Gateway
- `chrome.bargeInRmsThreshold: 650`: ระดับ RMS ที่นับเป็นการพูดแทรกของมนุษย์
  บน `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: ระดับพีกที่นับเป็นการพูดแทรกของมนุษย์
  บน `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: หน่วงเวลาขั้นต่ำระหว่างการล้างสถานะ
  การพูดแทรกของมนุษย์ซ้ำ
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: คำตอบพูดแบบสั้น พร้อม
  `openclaw_agent_consult` สำหรับคำตอบเชิงลึก
- `realtime.introMessage`: การตรวจสอบความพร้อมแบบพูดสั้นๆ เมื่อบริดจ์เรียลไทม์
  เชื่อมต่อ; ตั้งค่าเป็น `""` เพื่อเข้าร่วมแบบเงียบ
- `realtime.agentId`: รหัสเอเจนต์ OpenClaw ที่ไม่บังคับสำหรับ
  `openclaw_agent_consult`; ค่าเริ่มต้นคือ `main`

การเขียนทับที่ไม่บังคับ:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    agentId: "jay",
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

การกำหนดค่าสำหรับ Twilio เท่านั้น:

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

`voiceCall.enabled` มีค่าเริ่มต้นเป็น `true`; เมื่อใช้การขนส่ง Twilio ระบบจะมอบหมาย
การโทร PSTN จริง, DTMF และคำทักทายเริ่มต้นให้กับ Plugin Voice Call Voice Call
จะเล่นลำดับ DTMF ก่อนเปิดสตรีมสื่อเรียลไทม์ จากนั้นใช้ข้อความแนะนำที่บันทึกไว้
เป็นคำทักทายเรียลไทม์เริ่มต้น หากไม่ได้เปิดใช้ `voice-call` Google Meet ยังสามารถ
ตรวจสอบความถูกต้องและบันทึกแผนการโทรได้ แต่ไม่สามารถทำการโทรผ่าน Twilio ได้

## เครื่องมือ

Agent สามารถใช้เครื่องมือ `google_meet` ได้:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

ใช้ `transport: "chrome"` เมื่อ Chrome ทำงานบนโฮสต์ Gateway ใช้
`transport: "chrome-node"` เมื่อ Chrome ทำงานบนโหนดที่จับคู่ไว้ เช่น VM Parallels
ในทั้งสองกรณี โมเดลเรียลไทม์และ `openclaw_agent_consult` จะทำงานบนโฮสต์
Gateway ดังนั้นข้อมูลประจำตัวของโมเดลจึงคงอยู่ที่นั่น

ใช้ `action: "status"` เพื่อแสดงรายการเซสชันที่ใช้งานอยู่หรือตรวจสอบ ID เซสชัน ใช้
`action: "speak"` พร้อม `sessionId` และ `message` เพื่อให้ agent เรียลไทม์
พูดทันที ใช้ `action: "test_speech"` เพื่อสร้างหรือนำเซสชันกลับมาใช้ใหม่
สั่งให้พูดวลีที่ทราบ และคืนสถานะสุขภาพ `inCall` เมื่อโฮสต์ Chrome สามารถ
รายงานได้ `test_speech` จะบังคับใช้ `mode: "realtime"` เสมอ และจะล้มเหลวหากถูกขอให้
ทำงานใน `mode: "transcribe"` เพราะเซสชันแบบสังเกตการณ์เท่านั้นไม่สามารถส่งเสียงพูดได้โดยเจตนา ผลลัพธ์ `speechOutputVerified` อิงจากจำนวนไบต์เอาต์พุตเสียงเรียลไทม์
ที่เพิ่มขึ้นระหว่างการทดสอบการโทรนี้ ดังนั้นเซสชันที่นำกลับมาใช้ใหม่ซึ่งมีเสียงเก่ากว่า
จะไม่นับเป็นการตรวจสอบเสียงพูดที่สำเร็จใหม่ ใช้ `action: "leave"` เพื่อทำเครื่องหมาย
ว่าเซสชันสิ้นสุดแล้ว

`status` จะรวมสถานะสุขภาพของ Chrome เมื่อพร้อมใช้งาน:

- `inCall`: Chrome ดูเหมือนอยู่ในสาย Meet แล้ว
- `micMuted`: สถานะไมโครโฟนของ Meet แบบพยายามให้ดีที่สุด
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: โปรไฟล์
  เบราว์เซอร์ต้องเข้าสู่ระบบด้วยตนเอง, ให้โฮสต์ Meet อนุญาตเข้าร่วม, ให้สิทธิ์ หรือ
  ซ่อมการควบคุมเบราว์เซอร์ก่อนที่เสียงพูดจะทำงานได้
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ระบุว่า
  อนุญาตให้ใช้เสียงพูด Chrome ที่จัดการอยู่ในตอนนี้หรือไม่ `speechReady: false` หมายความว่า OpenClaw ไม่ได้
  ส่งวลีแนะนำ/ทดสอบเข้าไปในบริดจ์เสียง
- `providerConnected` / `realtimeReady`: สถานะบริดจ์เสียงเรียลไทม์
- `lastInputAt` / `lastOutputAt`: เสียงล่าสุดที่เห็นจากหรือส่งไปยังบริดจ์
- `lastSuppressedInputAt` / `suppressedInputBytes`: อินพุต loopback ที่ถูกละเว้นขณะ
  การเล่นเสียงของ assistant กำลังทำงาน

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## การปรึกษา agent แบบเรียลไทม์

โหมดเรียลไทม์ของ Chrome ปรับให้เหมาะสำหรับวงจรเสียงสด ผู้ให้บริการเสียงเรียลไทม์
จะได้ยินเสียงการประชุมและพูดผ่านบริดจ์เสียงที่กำหนดค่าไว้
เมื่อโมเดลเรียลไทม์ต้องการการให้เหตุผลที่ลึกขึ้น ข้อมูลปัจจุบัน หรือเครื่องมือ
OpenClaw ปกติ โมเดลสามารถเรียก `openclaw_agent_consult` ได้

เครื่องมือปรึกษาจะเรียกใช้ agent OpenClaw ปกติอยู่เบื้องหลัง พร้อมบริบท
ทรานสคริปต์การประชุมล่าสุด และส่งคืนคำตอบแบบพูดที่กระชับไปยังเซสชัน
เสียงเรียลไทม์ จากนั้นโมเดลเสียงสามารถพูดคำตอบนั้นกลับเข้าไปในการประชุมได้
เครื่องมือนี้ใช้เครื่องมือปรึกษาเรียลไทม์ที่ใช้ร่วมกันเดียวกับ Voice Call

โดยค่าเริ่มต้น การปรึกษาจะทำงานกับ agent `main` ตั้งค่า `realtime.agentId` เมื่อเลน
Meet ควรปรึกษาพื้นที่ทำงาน agent OpenClaw เฉพาะ, ค่าเริ่มต้นของโมเดล,
นโยบายเครื่องมือ, หน่วยความจำ และประวัติเซสชัน

`realtime.toolPolicy` ควบคุมการรันการปรึกษา:

- `safe-read-only`: เปิดเผยเครื่องมือปรึกษาและจำกัด agent ปกติให้ใช้
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ
  `memory_get`
- `owner`: เปิดเผยเครื่องมือปรึกษาและให้ agent ปกติใช้นโยบายเครื่องมือ
  agent ตามปกติ
- `none`: ไม่เปิดเผยเครื่องมือปรึกษาให้กับโมเดลเสียงเรียลไทม์

คีย์เซสชันการปรึกษาถูกจำกัดขอบเขตตามเซสชัน Meet ดังนั้นการเรียกปรึกษาต่อเนื่อง
จึงสามารถนำบริบทการปรึกษาก่อนหน้ามาใช้ซ้ำได้ระหว่างการประชุมเดียวกัน

หากต้องการบังคับตรวจสอบความพร้อมแบบพูดหลังจาก Chrome เข้าร่วมสายเต็มรูปแบบแล้ว:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

สำหรับการทดสอบ smoke แบบเข้าร่วมและพูดครบถ้วน:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## รายการตรวจสอบการทดสอบสด

ใช้ลำดับนี้ก่อนส่งมอบการประชุมให้ agent ที่ไม่มีผู้ดูแล:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

สถานะ Chrome-node ที่คาดหวัง:

- `googlemeet setup` เป็นสีเขียวทั้งหมด
- `googlemeet setup` มี `chrome-node-connected` เมื่อ Chrome-node เป็น
  การขนส่งเริ่มต้นหรือมีการตรึงโหนดไว้
- `nodes status` แสดงว่าโหนดที่เลือกเชื่อมต่อแล้ว
- โหนดที่เลือกประกาศทั้ง `googlemeet.chrome` และ `browser.proxy`
- แท็บ Meet เข้าร่วมสายและ `test-speech` คืนสถานะสุขภาพ Chrome พร้อม
  `inCall: true`

สำหรับโฮสต์ Chrome ระยะไกล เช่น VM Parallels macOS นี่คือการตรวจสอบที่สั้นที่สุด
และปลอดภัยหลังจากอัปเดต Gateway หรือ VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

สิ่งนี้พิสูจน์ว่า Plugin Gateway ถูกโหลดแล้ว โหนด VM เชื่อมต่อด้วย
โทเค็นปัจจุบัน และบริดจ์เสียง Meet พร้อมใช้งานก่อนที่ agent จะเปิดแท็บ
การประชุมจริง

สำหรับ smoke ของ Twilio ให้ใช้การประชุมที่แสดงรายละเอียดการโทรเข้าโทรศัพท์:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

สถานะ Twilio ที่คาดหวัง:

- `googlemeet setup` มีการตรวจสอบ `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials` และ `twilio-voice-call-webhook` เป็นสีเขียว
- `voicecall` พร้อมใช้งานใน CLI หลังจากโหลด Gateway ใหม่
- เซสชันที่ส่งคืนมี `transport: "twilio"` และ `twilio.voiceCallId`
- `openclaw logs --follow` แสดง DTMF TwiML ที่ถูกให้บริการก่อน TwiML เรียลไทม์ จากนั้นเป็น
  บริดจ์เรียลไทม์พร้อมคำทักทายเริ่มต้นที่ถูกจัดคิว
- `googlemeet leave <sessionId>` วางสายเสียงที่มอบหมายไว้

## การแก้ไขปัญหา

### Agent มองไม่เห็นเครื่องมือ Google Meet

ยืนยันว่า Plugin เปิดใช้งานอยู่ในการกำหนดค่า Gateway และโหลด Gateway ใหม่:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

หากคุณเพิ่งแก้ไข `plugins.entries.google-meet` ให้รีสตาร์ตหรือโหลด Gateway ใหม่
agent ที่กำลังทำงานจะเห็นเฉพาะเครื่องมือ Plugin ที่ลงทะเบียนโดยกระบวนการ
Gateway ปัจจุบันเท่านั้น

### ไม่มีโหนดที่เชื่อมต่อซึ่งรองรับ Google Meet

บนโฮสต์โหนด ให้รัน:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

บนโฮสต์ Gateway ให้อนุมัติโหนดและตรวจสอบคำสั่ง:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

โหนดต้องเชื่อมต่ออยู่และแสดงรายการ `googlemeet.chrome` พร้อมกับ `browser.proxy`
การกำหนดค่า Gateway ต้องอนุญาตคำสั่งโหนดเหล่านั้น:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

หาก `googlemeet setup` ล้มเหลวที่ `chrome-node-connected` หรือบันทึก Gateway รายงาน
`gateway token mismatch` ให้ติดตั้งใหม่หรือรีสตาร์ตโหนดด้วยโทเค็น Gateway ปัจจุบัน
สำหรับ Gateway บน LAN โดยปกติหมายถึง:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

จากนั้นโหลดบริการโหนดใหม่และรันอีกครั้ง:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### เบราว์เซอร์เปิดขึ้นแต่ agent ไม่สามารถเข้าร่วมได้

รัน `googlemeet test-speech` และตรวจสอบสถานะสุขภาพ Chrome ที่ส่งคืน หากรายงาน
`manualActionRequired: true` ให้แสดง `manualActionMessage` ต่อผู้ปฏิบัติงาน
และหยุดลองซ้ำจนกว่าการดำเนินการในเบราว์เซอร์จะเสร็จสมบูรณ์

การดำเนินการด้วยตนเองที่พบบ่อย:

- ลงชื่อเข้าใช้โปรไฟล์ Chrome
- อนุญาตแขกจากบัญชีโฮสต์ Meet
- อนุญาตสิทธิ์ไมโครโฟน/กล้องของ Chrome เมื่อพรอมป์สิทธิ์ดั้งเดิมของ Chrome
  ปรากฏขึ้น
- ปิดหรือซ่อมกล่องโต้ตอบสิทธิ์ Meet ที่ค้างอยู่

อย่ารายงานว่า "ไม่ได้ลงชื่อเข้าใช้" เพียงเพราะ Meet แสดง "Do you want people to
hear you in the meeting?" นั่นคือหน้าคั่นสำหรับเลือกเสียงของ Meet; OpenClaw
จะคลิก **Use microphone** ผ่านการทำงานอัตโนมัติของเบราว์เซอร์เมื่อพร้อมใช้งานและยังคง
รอสถานะการประชุมจริง สำหรับ fallback ของเบราว์เซอร์แบบสร้างเท่านั้น OpenClaw
อาจคลิก **Continue without microphone** เพราะการสร้าง URL ไม่ต้องใช้
เส้นทางเสียงเรียลไทม์

### การสร้างการประชุมล้มเหลว

`googlemeet create` ใช้เอนด์พอยต์ Google Meet API `spaces.create` ก่อน
เมื่อมีการกำหนดค่าข้อมูลประจำตัว OAuth หากไม่มีข้อมูลประจำตัว OAuth จะ fallback
ไปยังเบราว์เซอร์โหนด Chrome ที่ตรึงไว้ ยืนยัน:

- สำหรับการสร้างผ่าน API: มีการกำหนดค่า `oauth.clientId` และ `oauth.refreshToken`
  หรือมีตัวแปรสภาพแวดล้อม `OPENCLAW_GOOGLE_MEET_*` ที่ตรงกัน
- สำหรับการสร้างผ่าน API: refresh token ถูกสร้างหลังจากเพิ่มการรองรับการสร้างแล้ว
  โทเค็นเก่าอาจไม่มี scope `meetings.space.created`; รัน
  `openclaw googlemeet auth login --json` อีกครั้งและอัปเดตการกำหนดค่า Plugin
- สำหรับ fallback ของเบราว์เซอร์: `defaultTransport: "chrome-node"` และ
  `chromeNode.node` ชี้ไปยังโหนดที่เชื่อมต่อซึ่งมี `browser.proxy` และ
  `googlemeet.chrome`
- สำหรับ fallback ของเบราว์เซอร์: โปรไฟล์ Chrome ของ OpenClaw บนโหนดนั้นลงชื่อเข้าใช้
  Google แล้วและสามารถเปิด `https://meet.google.com/new` ได้
- สำหรับ fallback ของเบราว์เซอร์: การลองซ้ำจะนำแท็บ `https://meet.google.com/new`
  หรือแท็บพรอมป์บัญชี Google ที่มีอยู่กลับมาใช้ใหม่ก่อนเปิดแท็บใหม่ หาก agent หมดเวลา
  ให้ลองเรียกเครื่องมือซ้ำแทนการเปิดแท็บ Meet อื่นด้วยตนเอง
- สำหรับ fallback ของเบราว์เซอร์: หากเครื่องมือคืนค่า `manualActionRequired: true` ให้ใช้
  `browser.nodeId`, `browser.targetId`, `browserUrl` และ
  `manualActionMessage` ที่ส่งคืนเพื่อแนะนำผู้ปฏิบัติงาน อย่าลองซ้ำเป็นลูปจนกว่า
  การดำเนินการนั้นจะเสร็จสมบูรณ์
- สำหรับ fallback ของเบราว์เซอร์: หาก Meet แสดง "Do you want people to hear you in the
  meeting?" ให้เปิดแท็บนั้นค้างไว้ OpenClaw ควรคลิก **Use microphone** หรือสำหรับ
  fallback แบบสร้างเท่านั้น คลิก **Continue without microphone** ผ่านการทำงานอัตโนมัติ
  ของเบราว์เซอร์และรอต่อไปจนกว่าจะได้ URL Meet ที่สร้างขึ้น หากทำไม่ได้
  ข้อผิดพลาดควรกล่าวถึง `meet-audio-choice-required` ไม่ใช่ `google-login-required`

### Agent เข้าร่วมแล้วแต่ไม่พูด

ตรวจสอบเส้นทางเรียลไทม์:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

ใช้ `mode: "realtime"` สำหรับการฟัง/ตอบกลับด้วยเสียง `mode: "transcribe"` ตั้งใจให้
ไม่เริ่มสะพานเสียง realtime แบบ duplex `googlemeet test-speech`
จะตรวจสอบเส้นทาง realtime เสมอ และรายงานว่าพบไบต์เอาต์พุตของสะพาน
สำหรับการเรียกใช้นั้นหรือไม่ หาก `speechOutputVerified` เป็น false และ
`speechOutputTimedOut` เป็น true ผู้ให้บริการ realtime อาจยอมรับ
ถ้อยคำแล้ว แต่ OpenClaw ไม่เห็นไบต์เอาต์พุตใหม่ไปถึงสะพานเสียงของ Chrome

ตรวจสอบเพิ่มเติมด้วย:

- มีคีย์ผู้ให้บริการ realtime บนโฮสต์ Gateway เช่น
  `OPENAI_API_KEY` หรือ `GEMINI_API_KEY`
- มองเห็น `BlackHole 2ch` บนโฮสต์ Chrome
- มี `sox` อยู่บนโฮสต์ Chrome
- ไมโครโฟนและลำโพงของ Meet ถูกกำหนดเส้นทางผ่านเส้นทางเสียงเสมือนที่
  OpenClaw ใช้

`googlemeet doctor [session-id]` จะแสดงเซสชัน, โหนด, สถานะในสาย,
เหตุผลของการดำเนินการด้วยตนเอง, การเชื่อมต่อผู้ให้บริการ realtime, `realtimeReady`, กิจกรรม
อินพุต/เอาต์พุตเสียง, ประทับเวลาเสียงล่าสุด, ตัวนับไบต์ และ URL ของเบราว์เซอร์
ใช้ `googlemeet status [session-id] --json` เมื่อคุณต้องการ JSON ดิบ ใช้
`googlemeet doctor --oauth` เมื่อคุณต้องการตรวจสอบการรีเฟรช Google Meet OAuth
โดยไม่เปิดเผยโทเค็น; เพิ่ม `--meeting` หรือ `--create-space` เมื่อคุณต้องการ
หลักฐาน Google Meet API ด้วย

หากเอเจนต์หมดเวลาและคุณเห็นแท็บ Meet เปิดอยู่แล้ว ให้ตรวจสอบแท็บนั้น
โดยไม่ต้องเปิดแท็บใหม่:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

การดำเนินการเครื่องมือที่เทียบเท่าคือ `recover_current_tab` ซึ่งจะโฟกัสและตรวจสอบ
แท็บ Meet ที่มีอยู่สำหรับการส่งผ่านที่เลือก เมื่อใช้ `chrome` จะใช้การควบคุม
เบราว์เซอร์ในเครื่องผ่าน Gateway; เมื่อใช้ `chrome-node` จะใช้โหนด Chrome
ที่กำหนดค่าไว้ มันจะไม่เปิดแท็บใหม่หรือสร้างเซสชันใหม่; แต่จะรายงาน
ตัวขัดขวางปัจจุบัน เช่น การเข้าสู่ระบบ, การรับเข้าร่วม, สิทธิ์อนุญาต หรือสถานะการเลือกเสียง
คำสั่ง CLI จะคุยกับ Gateway ที่กำหนดค่าไว้ ดังนั้น Gateway ต้องทำงานอยู่;
`chrome-node` ยังต้องให้โหนด Chrome เชื่อมต่ออยู่ด้วย

### การตรวจสอบการตั้งค่า Twilio ล้มเหลว

`twilio-voice-call-plugin` ล้มเหลวเมื่อ `voice-call` ไม่ได้รับอนุญาตหรือไม่ได้เปิดใช้งาน
เพิ่มลงใน `plugins.allow`, เปิดใช้งาน `plugins.entries.voice-call`, แล้วโหลด
Gateway ใหม่

`twilio-voice-call-credentials` ล้มเหลวเมื่อแบ็กเอนด์ Twilio ไม่มี account
SID, auth token หรือหมายเลขผู้โทร ตั้งค่าเหล่านี้บนโฮสต์ Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` ล้มเหลวเมื่อ `voice-call` ไม่มีการเปิดเผย Webhook
สาธารณะ หรือเมื่อ `publicUrl` ชี้ไปที่ loopback หรือพื้นที่เครือข่ายส่วนตัว
ตั้งค่า `plugins.entries.voice-call.config.publicUrl` เป็น URL ผู้ให้บริการสาธารณะ หรือ
กำหนดค่าช่องทางเปิดเผยแบบ tunnel/Tailscale สำหรับ `voice-call`

URL แบบ loopback และส่วนตัวไม่สามารถใช้กับ callback ของผู้ให้บริการโทรศัพท์ได้ อย่าใช้
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` หรือ `fd00::/8` เป็น `publicUrl`

สำหรับ URL สาธารณะที่เสถียร:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

สำหรับการพัฒนาในเครื่อง ให้ใช้ tunnel หรือการเปิดเผย Tailscale แทน URL โฮสต์ส่วนตัว:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

จากนั้นรีสตาร์ตหรือโหลด Gateway ใหม่ แล้วเรียกใช้:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

โดยค่าเริ่มต้น `voicecall smoke` เป็นการตรวจความพร้อมเท่านั้น หากต้องการ dry-run
หมายเลขเฉพาะ:

```bash
openclaw voicecall smoke --to "+15555550123"
```

เพิ่ม `--yes` เฉพาะเมื่อคุณตั้งใจให้วางสายแจ้งเตือนขาออกแบบสดเท่านั้น:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### สาย Twilio เริ่มแล้วแต่ไม่เคยเข้าสู่การประชุม

ยืนยันว่าเหตุการณ์ Meet เปิดเผยรายละเอียดการโทรเข้า ส่งหมายเลขโทรเข้าและ PIN
ที่ถูกต้องตรงกัน หรือชุด DTMF แบบกำหนดเอง:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

ใช้ `w` นำหน้าหรือจุลภาคใน `--dtmf-sequence` หากผู้ให้บริการต้องการหยุดพัก
ก่อนป้อน PIN

หากสร้างสายโทรศัพท์แล้ว แต่รายชื่อผู้เข้าร่วมของ Meet ไม่เคยแสดงผู้เข้าร่วมแบบโทรเข้า:

- เรียกใช้ `openclaw voicecall status --call-id <id>` และยืนยันว่าสายยังคง
  active อยู่
- เรียกใช้ `openclaw voicecall tail` และตรวจสอบว่า Webhook ของ Twilio มาถึง
  Gateway
- เรียกใช้ `openclaw logs --follow` และมองหาลำดับ Twilio Meet: Google
  Meet มอบหมายการเข้าร่วม, Voice Call เก็บ TwiML DTMF ก่อนเชื่อมต่อ,
  ให้บริการ TwiML เริ่มต้นนั้น จากนั้นให้บริการ TwiML แบบ realtime และเริ่มสะพาน realtime
  ด้วย `initialGreeting=queued`
- เรียกใช้ `openclaw googlemeet setup --transport twilio` อีกครั้ง; ต้องมี
  การตรวจสอบการตั้งค่าสีเขียว แต่ไม่ได้พิสูจน์ว่าลำดับ PIN ของการประชุมถูกต้อง
- ยืนยันว่าหมายเลขโทรเข้าเป็นของคำเชิญ Meet และภูมิภาคเดียวกับ PIN
- เพิ่มการหยุดพักนำหน้าใน `--dtmf-sequence` หาก Meet รับสายช้า เช่น
  `wwww123456#`
- หากผู้เข้าร่วมเข้าร่วมแล้ว แต่คุณไม่ได้ยินคำทักทาย ให้ตรวจสอบ
  `openclaw logs --follow` สำหรับ TwiML แบบ realtime, การเริ่มสะพาน realtime และ
  `initialGreeting=queued` คำทักทายถูกสร้างจากข้อความ
  `voicecall.start` เริ่มต้นหลังจากสะพาน realtime เชื่อมต่อแล้ว

หาก Webhook ไม่มาถึง ให้ดีบัก Plugin Voice Call ก่อน: ผู้ให้บริการต้อง
เข้าถึง `plugins.entries.voice-call.config.publicUrl` หรือ tunnel ที่กำหนดค่าไว้
ดู [การแก้ไขปัญหาการโทรด้วยเสียง](/th/plugins/voice-call#troubleshooting)

## หมายเหตุ

API สื่อทางการของ Google Meet มุ่งเน้นการรับ ดังนั้นการพูดเข้าไปในสาย Meet
ยังต้องใช้เส้นทางผู้เข้าร่วม Plugin นี้ทำให้ขอบเขตนั้นมองเห็นได้:
Chrome จัดการการเข้าร่วมผ่านเบราว์เซอร์และการกำหนดเส้นทางเสียงในเครื่อง; Twilio จัดการ
การเข้าร่วมแบบโทรเข้า

โหมด realtime ของ Chrome ต้องใช้ `BlackHole 2ch` พร้อมอย่างใดอย่างหนึ่ง:

- `chrome.audioInputCommand` พร้อม `chrome.audioOutputCommand`: OpenClaw เป็นเจ้าของ
  สะพานโมเดล realtime และส่งเสียงใน `chrome.audioFormat` ระหว่างคำสั่งเหล่านั้น
  กับผู้ให้บริการเสียง realtime ที่เลือก เส้นทาง Chrome เริ่มต้นคือ
  24 kHz PCM16; 8 kHz G.711 mu-law ยังคงพร้อมใช้งานสำหรับคู่คำสั่งเดิม
- `chrome.audioBridgeCommand`: คำสั่งสะพานภายนอกเป็นเจ้าของเส้นทางเสียงในเครื่องทั้งหมด
  และต้องออกหลังจากเริ่มหรือยืนยัน daemon แล้ว

เพื่อเสียง duplex ที่สะอาด ให้กำหนดเส้นทางเอาต์พุต Meet และไมโครโฟน Meet ผ่านอุปกรณ์
เสมือนแยกกัน หรือกราฟอุปกรณ์เสมือนแบบ Loopback อุปกรณ์ BlackHole ที่ใช้ร่วมกัน
เพียงตัวเดียวอาจสะท้อนเสียงผู้เข้าร่วมคนอื่นกลับเข้าไปในสายได้

ด้วยสะพาน Chrome แบบคู่คำสั่ง `chrome.bargeInInputCommand` สามารถฟัง
ไมโครโฟนในเครื่องแยกต่างหาก และล้างการเล่นเสียงของผู้ช่วยเมื่อมนุษย์เริ่ม
พูด วิธีนี้ทำให้เสียงพูดของมนุษย์มาก่อนเอาต์พุตของผู้ช่วย แม้อินพุต
BlackHole loopback ที่ใช้ร่วมกันจะถูกระงับชั่วคราวระหว่างการเล่นเสียงของผู้ช่วย
เช่นเดียวกับ `chrome.audioInputCommand` และ `chrome.audioOutputCommand` มันเป็น
คำสั่งในเครื่องที่ผู้ดำเนินการกำหนดค่า ใช้เส้นทางคำสั่งที่เชื่อถือได้อย่างชัดเจนหรือ
รายการอาร์กิวเมนต์ และอย่าชี้ไปยังสคริปต์จากตำแหน่งที่ไม่น่าเชื่อถือ

`googlemeet speak` จะทริกเกอร์สะพานเสียง realtime ที่ active สำหรับเซสชัน Chrome
`googlemeet leave` จะหยุดสะพานนั้น สำหรับเซสชัน Twilio ที่มอบหมายผ่าน
Plugin Voice Call, `leave` จะวางสายเสียงเบื้องหลังด้วย

## ที่เกี่ยวข้อง

- [Plugin การโทรด้วยเสียง](/th/plugins/voice-call)
- [โหมดพูดคุย](/th/nodes/talk)
- [การสร้าง Plugin](/th/plugins/building-plugins)
