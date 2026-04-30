---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw เข้าร่วมการโทร Google Meet
    - คุณต้องการให้เอเจนต์ OpenClaw สร้างการโทร Google Meet ใหม่
    - คุณกำลังกำหนดค่า Chrome, โหนด Chrome หรือ Twilio เป็นตัวรับส่งสำหรับ Google Meet
summary: 'Plugin ของ Google Meet: เข้าร่วม URL ของ Meet ที่ระบุอย่างชัดเจนผ่าน Chrome หรือ Twilio พร้อมค่าเริ่มต้นสำหรับเสียงแบบเรียลไทม์'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-30T10:05:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b989c872fee0dca31680f67559cd26b715303f7c6f4eeda51fc63889bb0383c
    source_path: plugins/google-meet.md
    workflow: 16
---

การรองรับผู้เข้าร่วม Google Meet สำหรับ OpenClaw — Plugin มีความชัดเจนตามการออกแบบ:

- จะเข้าร่วมเฉพาะ URL `https://meet.google.com/...` ที่ระบุชัดเจนเท่านั้น
- สามารถสร้างพื้นที่ Meet ใหม่ผ่าน Google Meet API แล้วเข้าร่วม URL ที่ส่งกลับมาได้
- `realtime` voice เป็นโหมดเริ่มต้น
- Realtime voice สามารถเรียกกลับเข้าไปยัง agent OpenClaw แบบเต็มได้เมื่อจำเป็นต้องใช้
  การให้เหตุผลที่ลึกขึ้นหรือเครื่องมือ
- Agent เลือกพฤติกรรมการเข้าร่วมด้วย `mode`: ใช้ `realtime` สำหรับการฟังสด/
  พูดตอบกลับ หรือใช้ `transcribe` เพื่อเข้าร่วม/ควบคุมเบราว์เซอร์โดยไม่มี
  realtime voice bridge
- Auth เริ่มจาก Google OAuth ส่วนบุคคลหรือโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้อยู่แล้ว
- ไม่มีการประกาศขอความยินยอมโดยอัตโนมัติ
- แบ็กเอนด์เสียงเริ่มต้นของ Chrome คือ `BlackHole 2ch`
- Chrome สามารถทำงานในเครื่องหรือบนโฮสต์ node ที่จับคู่ไว้
- Twilio รับหมายเลขโทรเข้า พร้อม PIN หรือ DTMF sequence แบบไม่บังคับ
- คำสั่ง CLI คือ `googlemeet`; `meet` ถูกสงวนไว้สำหรับเวิร์กโฟลว์
  การประชุมทางไกลของ agent ที่กว้างกว่า

## เริ่มต้นอย่างรวดเร็ว

ติดตั้ง dependency เสียงในเครื่องและกำหนดค่า backend realtime voice
provider OpenAI เป็นค่าเริ่มต้น; Google Gemini Live ก็ใช้งานได้กับ
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` ติดตั้งอุปกรณ์เสียงเสมือน `BlackHole 2ch` ตัวติดตั้งของ Homebrew
ต้องรีบูตก่อน macOS จึงจะแสดงอุปกรณ์:

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

เอาต์พุตการตั้งค่าถูกออกแบบมาให้อ่านได้โดย agent และรับรู้โหมดได้ โดยรายงานโปรไฟล์ Chrome,
การปักหมุด node และสำหรับการเข้าร่วม Chrome แบบ realtime จะรายงาน BlackHole/SoX audio
bridge และการตรวจสอบ intro แบบ realtime ที่หน่วงเวลา สำหรับการเข้าร่วมแบบ observe-only
ให้ตรวจสอบ transport เดียวกันด้วย `--mode transcribe`; โหมดนั้นข้ามข้อกำหนดเบื้องต้น
ของเสียง realtime เพราะไม่ได้ฟังผ่านหรือพูดผ่าน bridge:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

เมื่อกำหนดค่า Twilio delegation แล้ว การตั้งค่าจะรายงานด้วยว่า Plugin
`voice-call` และข้อมูลประจำตัว Twilio พร้อมใช้งานหรือไม่ ให้ถือว่าการตรวจสอบใดๆ
ที่มี `ok: false` เป็นตัวบล็อกสำหรับ transport และโหมดที่ตรวจสอบก่อนขอให้ agent
เข้าร่วม ใช้ `openclaw googlemeet setup --json` สำหรับสคริปต์หรือเอาต์พุตที่เครื่องอ่านได้
ใช้ `--transport chrome`, `--transport chrome-node` หรือ `--transport twilio`
เพื่อ preflight transport เฉพาะก่อนที่ agent จะลองใช้

เข้าร่วมการประชุม:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

หรือให้ agent เข้าร่วมผ่านเครื่องมือ `google_meet`:

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

- สร้างด้วย API: ใช้เมื่อกำหนดค่าข้อมูลประจำตัว Google Meet OAuth แล้ว เส้นทางนี้
  กำหนดผลได้แน่นอนที่สุดและไม่ขึ้นกับสถานะ UI ของเบราว์เซอร์
- Browser fallback: ใช้เมื่อไม่มีข้อมูลประจำตัว OAuth OpenClaw ใช้ node Chrome
  ที่ปักหมุดไว้ เปิด `https://meet.google.com/new` รอให้ Google เปลี่ยนเส้นทาง
  ไปยัง URL รหัสการประชุมจริง แล้วส่ง URL นั้นกลับ เส้นทางนี้ต้องให้โปรไฟล์ Chrome
  ของ OpenClaw บน node ลงชื่อเข้าใช้ Google อยู่แล้ว ระบบอัตโนมัติของเบราว์เซอร์
  จัดการพรอมต์ไมโครโฟนครั้งแรกของ Meet เอง; พรอมต์นั้นไม่ถือเป็นความล้มเหลว
  ในการเข้าสู่ระบบ Google
  โฟลว์เข้าร่วมและสร้างจะพยายามใช้แท็บ Meet ที่มีอยู่ซ้ำก่อนเปิดแท็บใหม่ด้วย
  การจับคู่จะละเว้น query string ของ URL ที่ไม่เป็นอันตราย เช่น `authuser`
  ดังนั้นการลองใหม่ของ agent ควรโฟกัสการประชุมที่เปิดอยู่แล้วแทนการสร้างแท็บ
  Chrome ที่สอง

เอาต์พุตคำสั่ง/เครื่องมือมีฟิลด์ `source` (`api` หรือ `browser`) เพื่อให้ agent
อธิบายได้ว่าใช้เส้นทางใด `create` จะเข้าร่วมการประชุมใหม่ตามค่าเริ่มต้นและส่งกลับ
`joined: true` พร้อมเซสชันการเข้าร่วม หากต้องการออกเฉพาะ URL ให้ใช้
`create --no-join` บน CLI หรือส่ง `"join": false` ไปยังเครื่องมือ

หรือบอก agent ว่า: "สร้าง Google Meet เข้าร่วมด้วย realtime voice และส่งลิงก์ให้ฉัน"
agent ควรเรียก `google_meet` ด้วย `action: "create"` แล้วแชร์ `meetingUri`
ที่ส่งกลับมา

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

สำหรับการเข้าร่วมแบบ observe-only/browser-control ให้ตั้งค่า `"mode": "transcribe"`
ซึ่งจะไม่เริ่ม duplex realtime model bridge, ไม่ต้องใช้ BlackHole หรือ SoX,
และจะไม่พูดตอบกลับเข้าไปในการประชุม การเข้าร่วม Chrome ในโหมดนี้ยังหลีกเลี่ยง
การให้สิทธิ์ไมโครโฟน/กล้องของ OpenClaw และหลีกเลี่ยงเส้นทาง **Use
microphone** ของ Meet หาก Meet แสดงหน้าคั่นให้เลือกเสียง ระบบอัตโนมัติจะลอง
เส้นทางที่ไม่มีไมโครโฟน และหากทำไม่ได้จะรายงานการดำเนินการด้วยตนเองแทนการเปิด
ไมโครโฟนในเครื่อง

ระหว่างเซสชัน realtime สถานะ `google_meet` มีสุขภาพของเบราว์เซอร์และ audio bridge
เช่น `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamp ของอินพุต/เอาต์พุตล่าสุด,
byte counter และสถานะปิดของ bridge หากมีพรอมต์หน้า Meet ที่ปลอดภัยปรากฏขึ้น
ระบบอัตโนมัติของเบราว์เซอร์จะจัดการเมื่อทำได้ การเข้าสู่ระบบ การรับเข้าจากโฮสต์
และพรอมต์สิทธิ์ของเบราว์เซอร์/OS จะถูกรายงานเป็นการดำเนินการด้วยตนเองพร้อมเหตุผลและ
ข้อความให้ agent ส่งต่อ เซสชัน Chrome ที่จัดการแล้วจะปล่อย intro หรือวลีทดสอบ
หลังจากสุขภาพเบราว์เซอร์รายงาน `inCall: true` เท่านั้น; มิฉะนั้นสถานะจะรายงาน
`speechReady: false` และบล็อกความพยายามพูดแทนการแสร้งว่า agent พูดเข้าไปในการประชุม

การเข้าร่วม Chrome ในเครื่องใช้โปรไฟล์เบราว์เซอร์ OpenClaw ที่ลงชื่อเข้าใช้แล้ว โหมด realtime
ต้องใช้ `BlackHole 2ch` สำหรับเส้นทางไมโครโฟน/ลำโพงที่ OpenClaw ใช้ เพื่อเสียง duplex
ที่สะอาด ให้ใช้อุปกรณ์เสมือนแยกกันหรือกราฟแบบ Loopback; อุปกรณ์ BlackHole เดียว
เพียงพอสำหรับ smoke test แรก แต่อาจเกิดเสียงสะท้อนได้

### Gateway ในเครื่อง + Parallels Chrome

คุณ **ไม่** จำเป็นต้องมี OpenClaw Gateway แบบเต็มหรือ model API key ภายใน VM macOS
เพียงเพื่อให้ VM เป็นเจ้าของ Chrome ให้รัน Gateway และ agent ในเครื่อง แล้วรัน
node host ใน VM เปิดใช้ Plugin ที่บันเดิลมาใน VM หนึ่งครั้งเพื่อให้ node
โฆษณาคำสั่ง Chrome:

สิ่งที่รันในแต่ละที่:

- โฮสต์ Gateway: OpenClaw Gateway, พื้นที่ทำงานของ agent, model/API key, realtime
  provider และการกำหนดค่า Plugin Google Meet
- VM macOS Parallels: OpenClaw CLI/node host, Google Chrome, SoX, BlackHole 2ch
  และโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้ Google
- สิ่งที่ไม่จำเป็นใน VM: บริการ Gateway, การกำหนดค่า agent, OpenAI/GPT key หรือการตั้งค่า
  model provider

ติดตั้ง dependency ของ VM:

```bash
brew install blackhole-2ch sox
```

รีบูต VM หลังติดตั้ง BlackHole เพื่อให้ macOS แสดง `BlackHole 2ch`:

```bash
sudo reboot
```

หลังรีบูต ให้ตรวจสอบว่า VM เห็นอุปกรณ์เสียงและคำสั่ง SoX ได้:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

ติดตั้งหรืออัปเดต OpenClaw ใน VM แล้วเปิดใช้ Plugin ที่บันเดิลมาในนั้น:

```bash
openclaw plugins enable google-meet
```

เริ่ม node host ใน VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

หาก `<gateway-host>` เป็น LAN IP และคุณไม่ได้ใช้ TLS node จะปฏิเสธ plaintext WebSocket
เว้นแต่คุณจะเลือกใช้สำหรับเครือข่ายส่วนตัวที่เชื่อถือได้นั้น:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` เป็น process environment ไม่ใช่การตั้งค่า
`openclaw.json` `openclaw node install` จะเก็บค่านี้ไว้ใน environment ของ LaunchAgent
เมื่อมีอยู่ในคำสั่งติดตั้ง

อนุมัติ node จากโฮสต์ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

ยืนยันว่า Gateway เห็น node และ node โฆษณาทั้ง `googlemeet.chrome`
และความสามารถของเบราว์เซอร์/`browser.proxy`:

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

หรือขอให้ agent ใช้เครื่องมือ `google_meet` พร้อม `transport: "chrome-node"`

สำหรับ smoke test คำสั่งเดียวที่สร้างหรือใช้เซสชันซ้ำ พูดวลีที่ทราบ และพิมพ์สุขภาพเซสชัน:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

ระหว่างการเข้าร่วม realtime ระบบอัตโนมัติของเบราว์เซอร์ OpenClaw จะกรอกชื่อผู้เข้าร่วม,
คลิก Join/Ask to join และยอมรับตัวเลือก "Use microphone" ครั้งแรกของ Meet เมื่อพรอมต์นั้นปรากฏ
ระหว่างการเข้าร่วมแบบ observe-only หรือการสร้างการประชุมแบบ browser-only ระบบจะดำเนินต่อ
หลังพรอมต์เดียวกันโดยไม่ใช้ไมโครโฟนเมื่อมีตัวเลือกนั้น หากโปรไฟล์เบราว์เซอร์ไม่ได้ลงชื่อเข้าใช้,
Meet กำลังรอการรับเข้าจากโฮสต์, Chrome ต้องการสิทธิ์ไมโครโฟน/กล้องสำหรับการเข้าร่วม realtime,
หรือ Meet ค้างอยู่บนพรอมต์ที่ระบบอัตโนมัติแก้ไขไม่ได้ ผลลัพธ์ join/test-speech จะรายงาน
`manualActionRequired: true` พร้อม `manualActionReason` และ
`manualActionMessage` Agent ควรหยุดลองเข้าร่วมซ้ำ รายงานข้อความนั้นแบบตรงตัว
พร้อม `browserUrl`/`browserTitle` ปัจจุบัน และลองใหม่เฉพาะหลังจากดำเนินการในเบราว์เซอร์
ด้วยตนเองเสร็จแล้ว

หากละเว้น `chromeNode.node` OpenClaw จะเลือกอัตโนมัติเฉพาะเมื่อมี node ที่เชื่อมต่ออยู่
หนึ่งตัวพอดีที่โฆษณาทั้ง `googlemeet.chrome` และการควบคุมเบราว์เซอร์ หากมี node
ที่ใช้งานได้หลายตัวเชื่อมต่ออยู่ ให้ตั้งค่า `chromeNode.node` เป็น node id,
display name หรือ remote IP

การตรวจสอบความล้มเหลวที่พบบ่อย:

- `Configured Google Meet node ... is not usable: offline`: Node ที่ปักหมุดไว้นั้น
  Gateway รู้จักอยู่แล้วแต่ไม่พร้อมใช้งาน Agents ควรถือว่า Node นั้นเป็น
  สถานะสำหรับวินิจฉัย ไม่ใช่โฮสต์ Chrome ที่ใช้งานได้ และรายงานตัวบล็อกการตั้งค่า
  แทนการถอยกลับไปใช้ทรานสปอร์ตอื่น เว้นแต่ผู้ใช้ขอให้ทำเช่นนั้น
- `No connected Google Meet-capable node`: เริ่ม `openclaw node run` ใน VM,
  อนุมัติการจับคู่ และตรวจสอบให้แน่ใจว่าได้รัน `openclaw plugins enable google-meet` และ
  `openclaw plugins enable browser` ใน VM แล้ว นอกจากนี้ให้ยืนยันว่า
  โฮสต์ Gateway อนุญาตคำสั่ง Node ทั้งสองด้วย
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`
- `BlackHole 2ch audio device not found`: ติดตั้ง `blackhole-2ch` บนโฮสต์
  ที่กำลังตรวจสอบและรีบูตก่อนใช้เสียง Chrome แบบโลคัล
- `BlackHole 2ch audio device not found on the node`: ติดตั้ง `blackhole-2ch`
  ใน VM และรีบูต VM
- Chrome เปิดขึ้นแต่เข้าร่วมไม่ได้: ลงชื่อเข้าใช้โปรไฟล์เบราว์เซอร์ภายใน VM หรือ
  ตั้งค่า `chrome.guestName` ไว้สำหรับการเข้าร่วมแบบผู้เยี่ยมชม การเข้าร่วมอัตโนมัติแบบผู้เยี่ยมชมใช้
  ระบบอัตโนมัติของเบราว์เซอร์ OpenClaw ผ่านพร็อกซีเบราว์เซอร์ของ Node ตรวจสอบให้แน่ใจว่าคอนฟิกเบราว์เซอร์ของ Node
  ชี้ไปยังโปรไฟล์ที่คุณต้องการ ตัวอย่างเช่น
  `browser.defaultProfile: "user"` หรือโปรไฟล์เซสชันที่มีอยู่ซึ่งมีชื่อ
- แท็บ Meet ซ้ำ: เปิดใช้ `chrome.reuseExistingTab: true` ไว้ OpenClaw
  จะเปิดใช้งานแท็บเดิมสำหรับ Meet URL เดียวกันก่อนเปิดแท็บใหม่ และ
  การสร้างการประชุมผ่านเบราว์เซอร์จะใช้แท็บ `https://meet.google.com/new`
  หรือแท็บพรอมป์บัญชี Google ที่กำลังดำเนินอยู่ซ้ำก่อนเปิดแท็บอื่น
- ไม่มีเสียง: ใน Meet ให้กำหนดเส้นทางไมโครโฟน/ลำโพงผ่านเส้นทางอุปกรณ์เสียงเสมือน
  ที่ OpenClaw ใช้ ใช้อุปกรณ์เสมือนแยกกันหรือการกำหนดเส้นทางแบบ Loopback
  เพื่อเสียงสองทางที่สะอาด

## หมายเหตุการติดตั้ง

ค่าเริ่มต้นแบบเรียลไทม์ของ Chrome ใช้เครื่องมือภายนอกสองอย่าง:

- `sox`: ยูทิลิตีเสียงผ่านบรรทัดคำสั่ง Plugin ใช้คำสั่งอุปกรณ์ CoreAudio
  แบบระบุชัดเจนสำหรับบริดจ์เสียง PCM16 ค่าเริ่มต้นที่ 24 kHz
- `blackhole-2ch`: ไดรเวอร์เสียงเสมือนของ macOS ซึ่งสร้างอุปกรณ์เสียง `BlackHole 2ch`
  ที่ Chrome/Meet สามารถกำหนดเส้นทางผ่านได้

OpenClaw ไม่ได้รวมแพ็กเกจหรือแจกจ่ายแพ็กเกจใดแพ็กเกจหนึ่ง เอกสารขอให้ผู้ใช้
ติดตั้งเป็น dependency ของโฮสต์ผ่าน Homebrew SoX มีสัญญาอนุญาตเป็น
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole เป็น GPL-3.0 หากคุณสร้าง
ตัวติดตั้งหรือแอปพลายแอนซ์ที่รวม BlackHole กับ OpenClaw ให้ตรวจสอบเงื่อนไขสัญญาอนุญาตต้นทางของ BlackHole
หรือขอใบอนุญาตแยกต่างหากจาก Existential Audio

## ทรานสปอร์ต

### Chrome

ทรานสปอร์ต Chrome เปิด Meet URL ผ่านการควบคุมเบราว์เซอร์ของ OpenClaw และเข้าร่วม
ในฐานะโปรไฟล์เบราว์เซอร์ OpenClaw ที่ลงชื่อเข้าใช้แล้ว บน macOS, Plugin จะตรวจหา
`BlackHole 2ch` ก่อนเปิดใช้งาน หากมีการคอนฟิกไว้ ระบบจะรันคำสั่งตรวจสุขภาพบริดจ์เสียง
และคำสั่งเริ่มต้นก่อนเปิด Chrome ด้วย ใช้ `chrome` เมื่อ
Chrome/เสียงอยู่บนโฮสต์ Gateway; ใช้ `chrome-node` เมื่อ Chrome/เสียงอยู่
บน Node ที่จับคู่แล้ว เช่น Parallels macOS VM สำหรับ Chrome แบบโลคัล ให้เลือก
โปรไฟล์ด้วย `browser.defaultProfile`; `chrome.browserProfile` จะถูกส่งให้
โฮสต์ `chrome-node`

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

กำหนดเส้นทางเสียงไมโครโฟนและลำโพงของ Chrome ผ่านบริดจ์เสียง OpenClaw แบบโลคัล
หากไม่ได้ติดตั้ง `BlackHole 2ch` การเข้าร่วมจะล้มเหลวพร้อมข้อผิดพลาดการตั้งค่า
แทนที่จะเข้าร่วมแบบเงียบ ๆ โดยไม่มีเส้นทางเสียง

### Twilio

ทรานสปอร์ต Twilio เป็นแผนการโทรที่เข้มงวดซึ่งมอบหมายให้ Voice Call Plugin
ไม่แยกวิเคราะห์หน้า Meet เพื่อค้นหาหมายเลขโทรศัพท์

ใช้สิ่งนี้เมื่อการเข้าร่วมผ่าน Chrome ไม่พร้อมใช้งาน หรือคุณต้องการทางเลือกสำรองแบบโทรเข้า
Google Meet ต้องแสดงหมายเลขโทรเข้าและ PIN สำหรับ
การประชุม OpenClaw จะไม่ค้นพบข้อมูลเหล่านั้นจากหน้า Meet

เปิดใช้ Voice Call Plugin บนโฮสต์ Gateway ไม่ใช่บน Node Chrome:

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

ระบุข้อมูลประจำตัว Twilio ผ่านสภาพแวดล้อมหรือคอนฟิก สภาพแวดล้อมช่วยเก็บ
ข้อมูลลับไม่ให้อยู่ใน `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

รีสตาร์ตหรือโหลด Gateway ใหม่หลังเปิดใช้ `voice-call`; การเปลี่ยนแปลงคอนฟิกของ Plugin
จะไม่ปรากฏในกระบวนการ Gateway ที่รันอยู่แล้วจนกว่าจะโหลดใหม่

จากนั้นตรวจสอบ:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

เมื่อการมอบหมาย Twilio เชื่อมต่อเรียบร้อยแล้ว `googlemeet setup` จะมีการตรวจสอบ
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

## OAuth และการตรวจสอบก่อนเริ่ม

OAuth เป็นทางเลือกสำหรับการสร้างลิงก์ Meet เพราะ `googlemeet create` สามารถถอยกลับไปใช้
ระบบอัตโนมัติของเบราว์เซอร์ได้ คอนฟิก OAuth เมื่อคุณต้องการสร้างผ่าน API อย่างเป็นทางการ,
การแก้ไข space หรือการตรวจสอบก่อนเริ่มของ Meet Media API

การเข้าถึง Google Meet API ใช้ OAuth ของผู้ใช้: สร้างไคลเอนต์ Google Cloud OAuth,
ขอ scopes ที่จำเป็น, อนุญาตบัญชี Google แล้วจัดเก็บ
refresh token ที่ได้ในคอนฟิก Google Meet Plugin หรือระบุ
ตัวแปรสภาพแวดล้อม `OPENCLAW_GOOGLE_MEET_*`

OAuth ไม่ได้แทนที่เส้นทางการเข้าร่วมผ่าน Chrome ทรานสปอร์ต Chrome และ Chrome-node
ยังคงเข้าร่วมผ่านโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้แล้ว, BlackHole/SoX และ Node ที่เชื่อมต่อ
เมื่อคุณใช้การเข้าร่วมผ่านเบราว์เซอร์ OAuth ใช้สำหรับเส้นทาง Google
Meet API อย่างเป็นทางการเท่านั้น: สร้าง meeting spaces, แก้ไข spaces และรันการตรวจสอบก่อนเริ่มของ Meet Media API

### สร้างข้อมูลประจำตัว Google

ใน Google Cloud Console:

1. สร้างหรือเลือกโปรเจกต์ Google Cloud
2. เปิดใช้ **Google Meet REST API** สำหรับโปรเจกต์นั้น
3. คอนฟิกหน้าจอยินยอม OAuth
   - **Internal** ง่ายที่สุดสำหรับองค์กร Google Workspace
   - **External** ใช้ได้กับการตั้งค่าส่วนตัว/ทดสอบ ขณะที่แอปอยู่ใน Testing
     ให้เพิ่มบัญชี Google แต่ละบัญชีที่จะอนุญาตแอปเป็นผู้ใช้ทดสอบ
4. เพิ่ม scopes ที่ OpenClaw ขอ:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. สร้าง OAuth client ID
   - ประเภทแอปพลิเคชัน: **Web application**
   - URI เปลี่ยนเส้นทางที่ได้รับอนุญาต:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. คัดลอก client ID และ client secret

`meetings.space.created` จำเป็นสำหรับ Google Meet `spaces.create`
`meetings.space.readonly` ช่วยให้ OpenClaw แก้ไข Meet URLs/codes เป็น spaces ได้
`meetings.conference.media.readonly` ใช้สำหรับการตรวจสอบก่อนเริ่มของ Meet Media API และงานสื่อ
Google อาจกำหนดให้ลงทะเบียน Developer Preview สำหรับการใช้งาน Media API จริง
หากคุณต้องการเพียงการเข้าร่วมผ่าน Chrome ที่ใช้เบราว์เซอร์ ให้ข้าม OAuth ทั้งหมด

### ออก refresh token

คอนฟิก `oauth.clientId` และถ้าจำเป็น `oauth.clientSecret` หรือส่งผ่านเป็น
ตัวแปรสภาพแวดล้อม แล้วรัน:

```bash
openclaw googlemeet auth login --json
```

คำสั่งจะพิมพ์บล็อกคอนฟิก `oauth` พร้อม refresh token โดยใช้ PKCE,
callback แบบ localhost ที่ `http://localhost:8085/oauth2callback` และโฟลว์
คัดลอก/วางด้วยตนเองผ่าน `--manual`

ตัวอย่าง:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

ใช้โหมด manual เมื่อเบราว์เซอร์เข้าถึง callback แบบโลคัลไม่ได้:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

เอาต์พุต JSON มี:

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

จัดเก็บออบเจ็กต์ `oauth` ไว้ใต้คอนฟิก Google Meet Plugin:

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

ควรใช้ตัวแปรสภาพแวดล้อมเมื่อคุณไม่ต้องการให้ refresh token อยู่ในคอนฟิก
หากมีค่าทั้งจากคอนฟิกและสภาพแวดล้อม Plugin จะใช้คอนฟิก
ก่อน แล้วจึง fallback ไปยังสภาพแวดล้อม

การยินยอม OAuth รวมถึงการสร้าง Meet space, สิทธิ์อ่าน Meet space และสิทธิ์อ่านสื่อการประชุม Meet
หากคุณยืนยันตัวตนก่อนมีการรองรับการสร้างการประชุม
ให้รัน `openclaw googlemeet auth login --json` อีกครั้งเพื่อให้ refresh
token มี scope `meetings.space.created`

### ตรวจสอบ OAuth ด้วย doctor

รัน OAuth doctor เมื่อต้องการตรวจสุขภาพแบบรวดเร็วที่ไม่เปิดเผยข้อมูลลับ:

```bash
openclaw googlemeet doctor --oauth --json
```

สิ่งนี้จะไม่โหลดรันไทม์ Chrome หรือกำหนดให้มี Node Chrome ที่เชื่อมต่ออยู่
โดยจะตรวจสอบว่ามีคอนฟิก OAuth อยู่และ refresh token สามารถออก access
token ได้ รายงาน JSON มีเฉพาะฟิลด์สถานะ เช่น `ok`, `configured`,
`tokenSource`, `expiresAt` และข้อความการตรวจสอบ โดยจะไม่พิมพ์ access
token, refresh token หรือ client secret

ผลลัพธ์ทั่วไป:

| การตรวจสอบ | ความหมาย |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | มี `oauth.clientId` พร้อม `oauth.refreshToken` หรือ access token ที่แคชไว้       |
| `oauth-token`        | access token ที่แคชไว้ยังใช้งานได้ หรือ refresh token ออก access token ใหม่แล้ว |
| `meet-spaces-get`    | การตรวจสอบ `--meeting` แบบทางเลือกแก้ไข Meet space ที่มีอยู่ได้แล้ว                             |
| `meet-spaces-create` | การตรวจสอบ `--create-space` แบบทางเลือกสร้าง Meet space ใหม่แล้ว                               |

เพื่อพิสูจน์การเปิดใช้ Google Meet API และ scope `spaces.create` ด้วย ให้รัน
การตรวจสอบ create ที่มี side effect:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` สร้าง Meet URL ชั่วคราว ใช้เมื่อคุณต้องยืนยันว่า
โปรเจกต์ Google Cloud เปิดใช้ Meet API แล้ว และบัญชีที่ได้รับอนุญาต
มี scope `meetings.space.created`

เพื่อพิสูจน์สิทธิ์อ่านสำหรับ meeting space ที่มีอยู่:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` และ `resolve-space` พิสูจน์สิทธิ์อ่านไปยัง
space ที่มีอยู่ซึ่งบัญชี Google ที่ได้รับอนุญาตเข้าถึงได้ `403` จากการตรวจสอบเหล่านี้
มักหมายความว่า Google Meet REST API ถูกปิดใช้งาน, refresh token ที่ยินยอมไว้
ขาด scope ที่จำเป็น หรือบัญชี Google เข้าถึง Meet
space นั้นไม่ได้ ข้อผิดพลาด refresh-token หมายความว่าให้รัน `openclaw googlemeet auth login
--json` อีกครั้งและจัดเก็บบล็อก `oauth` ใหม่

ไม่จำเป็นต้องมีข้อมูลประจำตัว OAuth สำหรับ fallback ผ่านเบราว์เซอร์ ในโหมดนั้น การยืนยันตัวตน Google
มาจากโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้แล้วบน Node ที่เลือก ไม่ใช่จาก
คอนฟิก OpenClaw

ตัวแปรสภาพแวดล้อมเหล่านี้ได้รับการยอมรับเป็น fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` หรือ `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` หรือ `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` หรือ
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` หรือ `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` หรือ `GOOGLE_MEET_PREVIEW_ACK`

แปลง Meet URL, รหัส หรือ `spaces/{id}` ผ่าน `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

เรียกใช้การตรวจสอบก่อนเริ่มก่อนงานสื่อ:

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
ตามค่าเริ่มต้น ส่ง `--all-conference-records` เมื่อต้องการทุกระเบียนที่ยังถูกเก็บไว้
สำหรับการประชุมนั้น

การค้นหา Calendar สามารถแปลง URL การประชุมจาก Google Calendar ก่อนอ่าน
อาร์ติแฟกต์ของ Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` ค้นหาปฏิทิน `primary` ของวันนี้เพื่อหาอีเวนต์ Calendar ที่มีลิงก์
Google Meet ใช้ `--event <query>` เพื่อค้นหาข้อความอีเวนต์ที่ตรงกัน และ
`--calendar <id>` สำหรับปฏิทินที่ไม่ใช่ปฏิทินหลัก การค้นหา Calendar ต้องใช้การเข้าสู่ระบบ
OAuth ใหม่ที่รวมขอบเขต readonly ของอีเวนต์ Calendar
`calendar-events` แสดงตัวอย่างอีเวนต์ Meet ที่ตรงกันและทำเครื่องหมายอีเวนต์ที่
`latest`, `artifacts`, `attendance` หรือ `export` จะเลือก

หากคุณทราบ ID ระเบียนการประชุมอยู่แล้ว ให้ระบุโดยตรง:

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

`artifacts` ส่งคืนเมตาดาต้าระเบียนการประชุมพร้อมเมตาดาต้าทรัพยากรของผู้เข้าร่วม การบันทึก
ทรานสคริปต์ รายการทรานสคริปต์แบบมีโครงสร้าง และสมาร์ตโน้ต เมื่อ
Google เปิดเผยข้อมูลนั้นสำหรับการประชุม ใช้ `--no-transcript-entries` เพื่อข้าม
การค้นหารายการสำหรับการประชุมขนาดใหญ่ `attendance` ขยายผู้เข้าร่วมเป็น
แถวเซสชันผู้เข้าร่วมพร้อมเวลาแรก/ล่าสุดที่พบ ระยะเวลาเซสชันรวม
แฟล็กมาสาย/ออกก่อนกำหนด และทรัพยากรผู้เข้าร่วมที่ซ้ำกันซึ่งถูกรวมตามผู้ใช้ที่ลงชื่อเข้าใช้
หรือชื่อที่แสดง ส่ง `--no-merge-duplicates` เพื่อเก็บทรัพยากรผู้เข้าร่วมดิบ
แยกกัน, `--late-after-minutes` เพื่อปรับการตรวจจับการมาสาย และ
`--early-before-minutes` เพื่อปรับการตรวจจับการออกก่อนกำหนด

`export` เขียนโฟลเดอร์ที่มี `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` และ `manifest.json`
`manifest.json` บันทึกอินพุตที่เลือก ตัวเลือกการส่งออก ระเบียนการประชุม
ไฟล์เอาต์พุต จำนวน แหล่งที่มาของโทเค็น อีเวนต์ Calendar เมื่อมีการใช้ และ
คำเตือนการดึงข้อมูลบางส่วน ส่ง `--zip` เพื่อเขียนไฟล์เก็บถาวรแบบพกพาเพิ่มเติม
ข้างโฟลเดอร์ ส่ง `--include-doc-bodies` เพื่อส่งออกข้อความ Google Docs ของทรานสคริปต์และ
สมาร์ตโน้ตที่ลิงก์ไว้ผ่าน Google Drive `files.export`; การดำเนินการนี้ต้องใช้
การเข้าสู่ระบบ OAuth ใหม่ที่รวมขอบเขต Drive Meet readonly หากไม่มี
`--include-doc-bodies` การส่งออกจะรวมเฉพาะเมตาดาต้า Meet และรายการทรานสคริปต์
แบบมีโครงสร้างเท่านั้น หาก Google ส่งคืนความล้มเหลวบางส่วนของอาร์ติแฟกต์ เช่น ข้อผิดพลาดการแสดงรายการ
สมาร์ตโน้ต รายการทรานสคริปต์ หรือเนื้อหาเอกสาร Drive สรุปและ
manifest จะเก็บคำเตือนแทนการทำให้การส่งออกทั้งหมดล้มเหลว
ใช้ `--dry-run` เพื่อดึงข้อมูลอาร์ติแฟกต์/การเข้าร่วมชุดเดียวกันและพิมพ์
manifest JSON โดยไม่สร้างโฟลเดอร์หรือ ZIP วิธีนี้มีประโยชน์ก่อนเขียน
การส่งออกขนาดใหญ่ หรือเมื่อ agent ต้องการเพียงจำนวน ระเบียนที่เลือก และ
คำเตือน

Agent ยังสามารถสร้างบันเดิลเดียวกันผ่านเครื่องมือ `google_meet` ได้ด้วย:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

ตั้งค่า `"dryRun": true` เพื่อส่งคืนเฉพาะ manifest การส่งออกและข้ามการเขียนไฟล์

เรียกใช้ live smoke แบบมีการป้องกันกับการประชุมจริงที่ยังถูกเก็บไว้:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

สภาพแวดล้อม live smoke:

- `OPENCLAW_LIVE_TEST=1` เปิดใช้การทดสอบ live แบบมีการป้องกัน
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` ชี้ไปยัง Meet URL, รหัส หรือ
  `spaces/{id}` ที่ยังถูกเก็บไว้
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID` ให้ OAuth
  client id
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN` ให้
  refresh token
- ไม่บังคับ: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` และ
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ใช้ชื่อ fallback เดียวกัน
  โดยไม่มีคำนำหน้า `OPENCLAW_`

live smoke สำหรับอาร์ติแฟกต์/การเข้าร่วมพื้นฐานต้องใช้
`https://www.googleapis.com/auth/meetings.space.readonly` และ
`https://www.googleapis.com/auth/meetings.conference.media.readonly` การค้นหา Calendar
ต้องใช้ `https://www.googleapis.com/auth/calendar.events.readonly` การส่งออกเนื้อหาเอกสาร
Drive ต้องใช้
`https://www.googleapis.com/auth/drive.meet.readonly`

สร้างพื้นที่ Meet ใหม่:

```bash
openclaw googlemeet create
```

คำสั่งจะพิมพ์ `meeting uri` ใหม่ แหล่งที่มา และเซสชันเข้าร่วม เมื่อมีข้อมูลประจำตัว OAuth
คำสั่งจะใช้ Google Meet API อย่างเป็นทางการ หากไม่มีข้อมูลประจำตัว OAuth
คำสั่งจะใช้โปรไฟล์เบราว์เซอร์ที่ลงชื่อเข้าใช้ของ Chrome node ที่ปักหมุดไว้เป็น fallback Agent สามารถ
ใช้เครื่องมือ `google_meet` ด้วย `action: "create"` เพื่อสร้างและเข้าร่วมในขั้นตอนเดียว
สำหรับการสร้างเฉพาะ URL ให้ส่ง `"join": false`

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

หาก browser fallback พบการเข้าสู่ระบบ Google หรือตัวบล็อกสิทธิ์ Meet ก่อนที่จะ
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

เมื่อ agent เห็น `manualActionRequired: true` ควรรายงาน
`manualActionMessage` พร้อมบริบท node/แท็บของเบราว์เซอร์ และหยุดเปิดแท็บ
Meet ใหม่จนกว่าผู้ปฏิบัติงานจะทำขั้นตอนในเบราว์เซอร์ให้เสร็จ

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

การสร้าง Meet จะเข้าร่วมตามค่าเริ่มต้น ทรานสปอร์ต Chrome หรือ Chrome-node ยังคง
ต้องใช้โปรไฟล์ Google Chrome ที่ลงชื่อเข้าใช้เพื่อเข้าร่วมผ่านเบราว์เซอร์ หาก
โปรไฟล์ออกจากระบบแล้ว OpenClaw จะรายงาน `manualActionRequired: true` หรือ
ข้อผิดพลาด browser fallback และขอให้ผู้ปฏิบัติงานเข้าสู่ระบบ Google ให้เสร็จก่อน
ลองอีกครั้ง

ตั้งค่า `preview.enrollmentAcknowledged: true` หลังจากยืนยันแล้วเท่านั้นว่าโปรเจกต์ Cloud
ของคุณ, OAuth principal และผู้เข้าร่วมการประชุมได้ลงทะเบียนใน Google
Workspace Developer Preview Program สำหรับ Meet media APIs แล้ว

## การกำหนดค่า

เส้นทาง Chrome realtime ทั่วไปต้องการเพียงให้เปิดใช้ Plugin, BlackHole, SoX
และคีย์ผู้ให้บริการเสียง realtime ฝั่งแบ็กเอนด์ OpenAI เป็นค่าเริ่มต้น; ตั้งค่า
`realtime.provider: "google"` เพื่อใช้ Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

ตั้งค่าการกำหนดค่า Plugin ใต้ `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: ID/ชื่อ/IP ของ node แบบไม่บังคับสำหรับ `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ชื่อที่ใช้บนหน้าจอผู้เข้าร่วม Meet ที่ยังไม่ได้ลงชื่อเข้าใช้
- `chrome.autoJoin: true`: เติมชื่อผู้เข้าร่วมและคลิก Join Now แบบ best-effort
  ผ่านระบบอัตโนมัติของเบราว์เซอร์ OpenClaw บน `chrome-node`
- `chrome.reuseExistingTab: true`: เปิดใช้งานแท็บ Meet ที่มีอยู่แทน
  การเปิดแท็บซ้ำ
- `chrome.waitForInCallMs: 20000`: รอให้แท็บ Meet รายงานว่าอยู่ในสาย
  ก่อนทริกเกอร์ข้อความแนะนำ realtime
- `chrome.audioFormat: "pcm16-24khz"`: รูปแบบเสียง command-pair ใช้
  `"g711-ulaw-8khz"` เฉพาะสำหรับ command pair แบบ legacy/custom ที่ยังส่งออก
  เสียงโทรศัพท์
- `chrome.audioInputCommand`: คำสั่ง SoX ที่อ่านจาก CoreAudio `BlackHole 2ch`
  และเขียนเสียงใน `chrome.audioFormat`
- `chrome.audioOutputCommand`: คำสั่ง SoX ที่อ่านเสียงใน `chrome.audioFormat`
  และเขียนไปยัง CoreAudio `BlackHole 2ch`
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: คำตอบพูดแบบสั้น พร้อม
  `openclaw_agent_consult` สำหรับคำตอบที่ลึกขึ้น
- `realtime.introMessage`: การตรวจสอบความพร้อมแบบพูดสั้นๆ เมื่อบริดจ์ realtime
  เชื่อมต่อ; ตั้งค่าเป็น `""` เพื่อเข้าร่วมแบบเงียบ
- `realtime.agentId`: ID agent ของ OpenClaw แบบไม่บังคับสำหรับ
  `openclaw_agent_consult`; ค่าเริ่มต้นคือ `main`

การ override แบบไม่บังคับ:

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

`voiceCall.enabled` มีค่าเริ่มต้นเป็น `true`; เมื่อใช้ทรานสปอร์ต Twilio ระบบจะมอบหมาย
การโทร PSTN จริงและ DTMF ให้กับ Plugin Voice Call หากไม่ได้เปิดใช้ `voice-call`
Google Meet ยังสามารถตรวจสอบและบันทึกแผนการโทรได้ แต่ไม่สามารถ
วางสาย Twilio ได้

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
`transport: "chrome-node"` เมื่อ Chrome ทำงานบนโหนดที่จับคู่ไว้ เช่น VM
Parallels ในทั้งสองกรณี โมเดลเรียลไทม์และ `openclaw_agent_consult` จะทำงานบน
โฮสต์ Gateway ดังนั้นข้อมูลรับรองของโมเดลจึงอยู่ที่นั่น

ใช้ `action: "status"` เพื่อแสดงรายการเซสชันที่ใช้งานอยู่หรือตรวจสอบ ID ของเซสชัน ใช้
`action: "speak"` พร้อม `sessionId` และ `message` เพื่อให้เอเจนต์เรียลไทม์
พูดทันที ใช้ `action: "test_speech"` เพื่อสร้างหรือนำเซสชันกลับมาใช้ใหม่
เรียกวลีที่ทราบล่วงหน้า และส่งคืนสุขภาพ `inCall` เมื่อโฮสต์ Chrome สามารถ
รายงานได้ `test_speech` จะบังคับใช้ `mode: "realtime"` เสมอและจะล้มเหลวหากถูกขอให้
ทำงานใน `mode: "transcribe"` เพราะเซสชันแบบสังเกตอย่างเดียวตั้งใจไม่ให้
ส่งเสียงพูดได้ ผลลัพธ์ `speechOutputVerified` ของรายการนี้อิงจากจำนวนไบต์เอาต์พุตเสียงเรียลไทม์
ที่เพิ่มขึ้นระหว่างการเรียกทดสอบนี้ ดังนั้นเซสชันที่นำกลับมาใช้ใหม่ซึ่งมีเสียงเก่ากว่า
จะไม่นับเป็นการตรวจสอบเสียงพูดที่สำเร็จใหม่ ใช้ `action: "leave"` เพื่อทำเครื่องหมายว่า
เซสชันสิ้นสุดแล้ว

`status` รวมสุขภาพของ Chrome เมื่อพร้อมใช้งาน:

- `inCall`: Chrome ดูเหมือนอยู่ในสาย Meet
- `micMuted`: สถานะไมโครโฟนของ Meet แบบพยายามให้ดีที่สุด
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: โปรไฟล์
  เบราว์เซอร์ต้องให้เข้าสู่ระบบด้วยตนเอง, ต้องให้โฮสต์ Meet อนุญาตเข้าร่วม, ต้องให้สิทธิ์ หรือ
  ต้องซ่อมแซมการควบคุมเบราว์เซอร์ก่อนที่เสียงพูดจะทำงานได้
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ระบุว่า
  อนุญาตให้ใช้เสียงพูดของ Chrome ที่จัดการอยู่ในตอนนี้หรือไม่ `speechReady: false` หมายความว่า OpenClaw
  ไม่ได้ส่งวลีแนะนำตัว/ทดสอบเข้าไปในบริดจ์เสียง
- `providerConnected` / `realtimeReady`: สถานะบริดจ์เสียงเรียลไทม์
- `lastInputAt` / `lastOutputAt`: เสียงล่าสุดที่เห็นจากบริดจ์หรือส่งไปยังบริดจ์

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## การปรึกษาเอเจนต์เรียลไทม์

โหมดเรียลไทม์ของ Chrome ถูกปรับให้เหมาะกับลูปเสียงสด ผู้ให้บริการเสียง
เรียลไทม์จะได้ยินเสียงการประชุมและพูดผ่านบริดจ์เสียงที่กำหนดค่าไว้
เมื่อโมเดลเรียลไทม์ต้องใช้การให้เหตุผลที่ลึกขึ้น ข้อมูลปัจจุบัน หรือเครื่องมือ
OpenClaw ปกติ โมเดลสามารถเรียก `openclaw_agent_consult` ได้

เครื่องมือปรึกษาจะเรียกใช้เอเจนต์ OpenClaw ปกติในเบื้องหลังพร้อมบริบท
ทรานสคริปต์การประชุมล่าสุด และส่งคืนคำตอบแบบพูดที่กระชับไปยังเซสชันเสียง
เรียลไทม์ จากนั้นโมเดลเสียงสามารถพูดคำตอบนั้นกลับเข้าไปในการประชุมได้
เครื่องมือนี้ใช้เครื่องมือปรึกษาเรียลไทม์ร่วมตัวเดียวกับ Voice Call

โดยค่าเริ่มต้น การปรึกษาจะทำงานกับเอเจนต์ `main` ตั้งค่า `realtime.agentId` เมื่อ
เลน Meet ควรปรึกษาพื้นที่ทำงานเอเจนต์ OpenClaw เฉพาะ ค่าเริ่มต้นของโมเดล
นโยบายเครื่องมือ หน่วยความจำ และประวัติเซสชันเฉพาะ

`realtime.toolPolicy` ควบคุมการเรียกปรึกษา:

- `safe-read-only`: เปิดใช้เครื่องมือปรึกษาและจำกัดเอเจนต์ปกติให้ใช้
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ
  `memory_get`
- `owner`: เปิดใช้เครื่องมือปรึกษาและอนุญาตให้เอเจนต์ปกติใช้นโยบายเครื่องมือ
  เอเจนต์ตามปกติ
- `none`: ไม่เปิดใช้เครื่องมือปรึกษาให้กับโมเดลเสียงเรียลไทม์

คีย์เซสชันปรึกษาจะถูกจำกัดขอบเขตต่อเซสชัน Meet ดังนั้นการเรียกปรึกษาต่อเนื่อง
สามารถใช้บริบทการปรึกษาก่อนหน้าในระหว่างการประชุมเดียวกันได้

เพื่อบังคับการตรวจสอบความพร้อมแบบพูดหลังจาก Chrome เข้าร่วมสายโดยสมบูรณ์แล้ว:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

สำหรับการทดสอบควันแบบเข้าร่วมและพูดเต็มรูปแบบ:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## รายการตรวจสอบการทดสอบสด

ใช้ลำดับนี้ก่อนส่งต่อการประชุมให้เอเจนต์ทำงานโดยไม่มีคนดูแล:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

สถานะ Chrome-node ที่คาดไว้:

- `googlemeet setup` เป็นสีเขียวทั้งหมด
- `googlemeet setup` มี `chrome-node-connected` เมื่อ Chrome-node เป็น
  การขนส่งเริ่มต้นหรือมีการปักหมุดโหนดไว้
- `nodes status` แสดงว่าโหนดที่เลือกเชื่อมต่ออยู่
- โหนดที่เลือกประกาศทั้ง `googlemeet.chrome` และ `browser.proxy`
- แท็บ Meet เข้าร่วมสายและ `test-speech` ส่งคืนสุขภาพ Chrome พร้อม
  `inCall: true`

สำหรับโฮสต์ Chrome ระยะไกล เช่น VM Parallels macOS นี่คือการตรวจสอบแบบสั้นที่สุด
ที่ปลอดภัยหลังจากอัปเดต Gateway หรือ VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

สิ่งนี้พิสูจน์ว่า Plugin ของ Gateway โหลดแล้ว โหนด VM เชื่อมต่อด้วยโทเค็น
ปัจจุบัน และบริดจ์เสียง Meet พร้อมใช้งานก่อนที่เอเจนต์จะเปิดแท็บประชุมจริง

สำหรับการทดสอบควัน Twilio ให้ใช้การประชุมที่แสดงรายละเอียดการโทรเข้า:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

สถานะ Twilio ที่คาดไว้:

- `googlemeet setup` มีการตรวจสอบ `twilio-voice-call-plugin` และ
  `twilio-voice-call-credentials` เป็นสีเขียว
- `voicecall` พร้อมใช้งานใน CLI หลังจากโหลด Gateway ใหม่
- เซสชันที่ส่งคืนมี `transport: "twilio"` และ `twilio.voiceCallId`
- `googlemeet leave <sessionId>` วางสายการโทรเสียงที่มอบหมายไว้

## การแก้ไขปัญหา

### เอเจนต์มองไม่เห็นเครื่องมือ Google Meet

ยืนยันว่า Plugin เปิดใช้งานอยู่ในการกำหนดค่า Gateway และโหลด Gateway ใหม่:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

หากคุณเพิ่งแก้ไข `plugins.entries.google-meet` ให้รีสตาร์ทหรือโหลด Gateway ใหม่
เอเจนต์ที่กำลังทำงานจะเห็นเฉพาะเครื่องมือ Plugin ที่ลงทะเบียนโดยกระบวนการ Gateway
ปัจจุบันเท่านั้น

### ไม่มีโหนดที่เชื่อมต่อซึ่งรองรับ Google Meet

บนโฮสต์โหนด ให้เรียกใช้:

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

โหนดต้องเชื่อมต่ออยู่และแสดง `googlemeet.chrome` รวมถึง `browser.proxy`
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

หาก `googlemeet setup` ล้มเหลวที่ `chrome-node-connected` หรือบันทึก Gateway รายงานว่า
`gateway token mismatch` ให้ติดตั้งใหม่หรือรีสตาร์ทโหนดด้วยโทเค็น Gateway ปัจจุบัน
สำหรับ Gateway บน LAN โดยปกติหมายถึง:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

จากนั้นโหลดบริการโหนดใหม่และเรียกใช้อีกครั้ง:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### เบราว์เซอร์เปิดแต่เอเจนต์เข้าร่วมไม่ได้

เรียกใช้ `googlemeet test-speech` และตรวจสอบสุขภาพ Chrome ที่ส่งคืน หากรายการนี้
รายงาน `manualActionRequired: true` ให้แสดง `manualActionMessage` แก่ผู้ปฏิบัติงาน
และหยุดลองซ้ำจนกว่าการดำเนินการในเบราว์เซอร์จะเสร็จสมบูรณ์

การดำเนินการด้วยตนเองที่พบบ่อย:

- ลงชื่อเข้าใช้โปรไฟล์ Chrome
- อนุญาตแขกจากบัญชีโฮสต์ Meet
- ให้สิทธิ์ไมโครโฟน/กล้องของ Chrome เมื่อพรอมต์สิทธิ์แบบเนทีฟของ Chrome
  ปรากฏขึ้น
- ปิดหรือซ่อมแซมกล่องโต้ตอบสิทธิ์ของ Meet ที่ค้างอยู่

อย่ารายงานว่า "not signed in" เพียงเพราะ Meet แสดง "Do you want people to
hear you in the meeting?" นั่นคือหน้าคั่นสำหรับเลือกเสียงของ Meet; OpenClaw
จะคลิก **Use microphone** ผ่านการทำงานอัตโนมัติของเบราว์เซอร์เมื่อพร้อมใช้งานและยังคง
รอสถานะการประชุมจริงต่อไป สำหรับทางเลือกเบราว์เซอร์แบบสร้างเท่านั้น OpenClaw
อาจคลิก **Continue without microphone** เพราะการสร้าง URL ไม่ต้องใช้
เส้นทางเสียงเรียลไทม์

### การสร้างการประชุมล้มเหลว

`googlemeet create` ใช้ปลายทาง `spaces.create` ของ Google Meet API ก่อน
เมื่อกำหนดค่าข้อมูลรับรอง OAuth แล้ว หากไม่มีข้อมูลรับรอง OAuth จะถอยกลับไปใช้
เบราว์เซอร์โหนด Chrome ที่ปักหมุดไว้ ยืนยันว่า:

- สำหรับการสร้างผ่าน API: มีการกำหนดค่า `oauth.clientId` และ `oauth.refreshToken`
  หรือมีตัวแปรสภาพแวดล้อม `OPENCLAW_GOOGLE_MEET_*` ที่ตรงกัน
- สำหรับการสร้างผ่าน API: โทเค็นรีเฟรชถูกสร้างหลังจากเพิ่มการรองรับการสร้างแล้ว
  โทเค็นเก่าอาจไม่มีขอบเขต `meetings.space.created`; เรียกใช้
  `openclaw googlemeet auth login --json` อีกครั้งและอัปเดตการกำหนดค่า Plugin
- สำหรับทางเลือกเบราว์เซอร์: `defaultTransport: "chrome-node"` และ
  `chromeNode.node` ชี้ไปยังโหนดที่เชื่อมต่อซึ่งมี `browser.proxy` และ
  `googlemeet.chrome`
- สำหรับทางเลือกเบราว์เซอร์: โปรไฟล์ OpenClaw Chrome บนโหนดนั้นลงชื่อเข้าใช้
  Google แล้วและสามารถเปิด `https://meet.google.com/new` ได้
- สำหรับทางเลือกเบราว์เซอร์: การลองซ้ำจะนำแท็บ `https://meet.google.com/new`
  หรือแท็บพรอมต์บัญชี Google ที่มีอยู่กลับมาใช้ใหม่ก่อนเปิดแท็บใหม่ หากเอเจนต์หมดเวลา
  ให้ลองเรียกเครื่องมือซ้ำแทนการเปิดแท็บ Meet อื่นด้วยตนเอง
- สำหรับทางเลือกเบราว์เซอร์: หากเครื่องมือส่งคืน `manualActionRequired: true` ให้ใช้
  `browser.nodeId`, `browser.targetId`, `browserUrl` และ
  `manualActionMessage` ที่ส่งคืนเพื่อแนะนำผู้ปฏิบัติงาน อย่าลองซ้ำเป็นลูปจนกว่า
  การดำเนินการนั้นจะเสร็จสมบูรณ์
- สำหรับทางเลือกเบราว์เซอร์: หาก Meet แสดง "Do you want people to hear you in the
  meeting?" ให้เปิดแท็บค้างไว้ OpenClaw ควรคลิก **Use microphone** หรือสำหรับ
  ทางเลือกแบบสร้างเท่านั้น ให้คลิก **Continue without microphone** ผ่านการทำงาน
  อัตโนมัติของเบราว์เซอร์และรอ URL Meet ที่สร้างต่อไป หากทำไม่ได้
  ข้อผิดพลาดควรกล่าวถึง `meet-audio-choice-required` ไม่ใช่ `google-login-required`

### เอเจนต์เข้าร่วมได้แต่ไม่พูด

ตรวจสอบเส้นทางเรียลไทม์:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

ใช้ `mode: "realtime"` สำหรับการฟัง/พูดตอบกลับ `mode: "transcribe"` ตั้งใจ
ไม่เริ่มบริดจ์เสียงเรียลไทม์แบบดูเพล็กซ์ `googlemeet test-speech`
จะตรวจสอบเส้นทางเรียลไทม์เสมอและรายงานว่ามีการสังเกตไบต์เอาต์พุตของบริดจ์
สำหรับการเรียกนั้นหรือไม่ หาก `speechOutputVerified` เป็น false และ
`speechOutputTimedOut` เป็น true ผู้ให้บริการเรียลไทม์อาจยอมรับ
คำพูดแล้ว แต่ OpenClaw ไม่เห็นไบต์เอาต์พุตใหม่ไปถึงบริดจ์เสียง Chrome

ตรวจสอบเพิ่มเติมว่า:

- มีคีย์ผู้ให้บริการเรียลไทม์พร้อมใช้งานบนโฮสต์ Gateway เช่น
  `OPENAI_API_KEY` หรือ `GEMINI_API_KEY`
- `BlackHole 2ch` มองเห็นได้บนโฮสต์ Chrome
- `sox` มีอยู่บนโฮสต์ Chrome
- ไมโครโฟนและลำโพงของ Meet ถูกส่งผ่านเส้นทางเสียงเสมือนที่ใช้โดย
  OpenClaw

`googlemeet doctor [session-id]` พิมพ์เซสชัน โหนด สถานะในสาย
เหตุผลของการดำเนินการด้วยตนเอง การเชื่อมต่อผู้ให้บริการเรียลไทม์ `realtimeReady` กิจกรรม
อินพุต/เอาต์พุตเสียง เวลาประทับเสียงล่าสุด ตัวนับไบต์ และ URL เบราว์เซอร์
ใช้ `googlemeet status [session-id]` เมื่อคุณต้องการ JSON ดิบ ใช้
`googlemeet doctor --oauth` เมื่อคุณต้องการตรวจสอบการรีเฟรช OAuth ของ Google Meet
โดยไม่เปิดเผยโทเค็น; เพิ่ม `--meeting` หรือ `--create-space` เมื่อคุณต้องการ
หลักฐาน Google Meet API ด้วย

หากเอเจนต์หมดเวลาและคุณเห็นแท็บ Meet เปิดอยู่แล้ว ให้ตรวจสอบแท็บนั้น
โดยไม่ต้องเปิดแท็บใหม่:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

การกระทำเครื่องมือที่เทียบเท่าคือ `recover_current_tab` รายการนี้จะโฟกัสและตรวจสอบ
แท็บ Meet ที่มีอยู่สำหรับการขนส่งที่เลือก เมื่อใช้ `chrome` รายการนี้ใช้การควบคุม
เบราว์เซอร์ภายในเครื่องผ่าน Gateway; เมื่อใช้ `chrome-node` รายการนี้ใช้โหนด Chrome
ที่กำหนดค่าไว้ รายการนี้ไม่เปิดแท็บใหม่หรือสร้างเซสชันใหม่ แต่รายงานตัวบล็อก
ปัจจุบัน เช่น การเข้าสู่ระบบ การอนุญาตเข้าร่วม สิทธิ์ หรือสถานะการเลือกเสียง
คำสั่ง CLI คุยกับ Gateway ที่กำหนดค่าไว้ ดังนั้น Gateway ต้องกำลังทำงานอยู่;
`chrome-node` ยังต้องให้โหนด Chrome เชื่อมต่ออยู่ด้วย

### การตรวจสอบการตั้งค่า Twilio ล้มเหลว

`twilio-voice-call-plugin` ล้มเหลวเมื่อ `voice-call` ไม่ได้รับอนุญาตหรือไม่ได้เปิดใช้งาน
เพิ่มไปยัง `plugins.allow` เปิดใช้งาน `plugins.entries.voice-call` แล้วโหลด
Gateway ใหม่

`twilio-voice-call-credentials` ล้มเหลวเมื่อแบ็กเอนด์ Twilio ไม่มี account
SID, auth token หรือหมายเลขผู้โทร ตั้งค่าเหล่านี้บนโฮสต์ Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

จากนั้นรีสตาร์ตหรือโหลด Gateway ใหม่ แล้วรัน:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

โดยค่าเริ่มต้น `voicecall smoke` ใช้ตรวจความพร้อมเท่านั้น หากต้องการ dry-run หมายเลขเฉพาะ:

```bash
openclaw voicecall smoke --to "+15555550123"
```

เพิ่ม `--yes` เฉพาะเมื่อคุณตั้งใจจะโทรแจ้งเตือนขาออกแบบสดจริง:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### การโทร Twilio เริ่มแล้วแต่ไม่เข้าร่วมการประชุม

ยืนยันว่าเหตุการณ์ Meet แสดงรายละเอียดการโทรเข้า ส่งหมายเลขโทรเข้าและ PIN
ที่ถูกต้อง หรือส่งลำดับ DTMF แบบกำหนดเอง:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

ใช้ `w` นำหน้าหรือใช้จุลภาคใน `--dtmf-sequence` หากผู้ให้บริการต้องการหยุดพัก
ก่อนป้อน PIN

## หมายเหตุ

API สื่ออย่างเป็นทางการของ Google Meet เน้นการรับสัญญาณ ดังนั้นการพูดเข้าสู่สาย
Meet ยังต้องมีเส้นทางผู้เข้าร่วม Plugin นี้ทำให้ขอบเขตนั้นมองเห็นได้:
Chrome จัดการการเข้าร่วมผ่านเบราว์เซอร์และการกำหนดเส้นทางเสียงในเครื่อง ส่วน Twilio จัดการ
การเข้าร่วมผ่านการโทรเข้า

โหมดเรียลไทม์ของ Chrome ต้องใช้ `BlackHole 2ch` พร้อมกับอย่างใดอย่างหนึ่งต่อไปนี้:

- `chrome.audioInputCommand` พร้อม `chrome.audioOutputCommand`: OpenClaw เป็นเจ้าของ
  บริดจ์โมเดลเรียลไทม์ และส่งเสียงใน `chrome.audioFormat` ระหว่างคำสั่งเหล่านั้น
  กับผู้ให้บริการเสียงเรียลไทม์ที่เลือก เส้นทาง Chrome เริ่มต้นคือ
  PCM16 24 kHz; G.711 mu-law 8 kHz ยังคงพร้อมใช้งานสำหรับคู่คำสั่งเดิม
- `chrome.audioBridgeCommand`: คำสั่งบริดจ์ภายนอกเป็นเจ้าของเส้นทางเสียงในเครื่องทั้งหมด
  และต้องออกหลังจากเริ่มหรือยืนยัน daemon แล้ว

เพื่อให้เสียงสองทางสะอาด ให้กำหนดเส้นทางเอาต์พุต Meet และไมโครโฟน Meet ผ่านอุปกรณ์เสมือนแยกกัน
หรือกราฟอุปกรณ์เสมือนแบบ Loopback อุปกรณ์ BlackHole ที่ใช้ร่วมกันเพียงตัวเดียว
อาจสะท้อนเสียงผู้เข้าร่วมคนอื่นกลับเข้าสู่สายได้

`googlemeet speak` ทริกเกอร์บริดจ์เสียงเรียลไทม์ที่ใช้งานอยู่สำหรับเซสชัน Chrome
`googlemeet leave` หยุดบริดจ์นั้น สำหรับเซสชัน Twilio ที่มอบหมายผ่าน Voice Call plugin
`leave` จะวางสายเสียงที่อยู่เบื้องหลังด้วย

## ที่เกี่ยวข้อง

- [Voice call plugin](/th/plugins/voice-call)
- [โหมดพูดคุย](/th/nodes/talk)
- [การสร้าง plugins](/th/plugins/building-plugins)
