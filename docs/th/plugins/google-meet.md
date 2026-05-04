---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw เข้าร่วมการประชุม Google Meet
    - คุณต้องการให้เอเจนต์ OpenClaw สร้างการประชุม Google Meet ใหม่
    - คุณกำลังกำหนดค่า Chrome, โหนด Chrome หรือ Twilio ให้เป็นทรานสปอร์ตของ Google Meet
summary: 'Plugin Google Meet: เข้าร่วม URL ของ Meet ที่ระบุอย่างชัดเจนผ่าน Chrome หรือ Twilio พร้อมค่าเริ่มต้นสำหรับการตอบกลับของเอเจนต์'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-04T07:05:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4268ad895bbf83d649b9571c0888c27eb982ad9710dfb408f22f7818cdc5dbcb
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet รองรับผู้เข้าร่วมสำหรับ OpenClaw — Plugin ตั้งใจออกแบบให้ชัดเจน:

- เข้าร่วมได้เฉพาะ URL `https://meet.google.com/...` ที่ระบุไว้อย่างชัดเจนเท่านั้น
- สามารถสร้างพื้นที่ Meet ใหม่ผ่าน Google Meet API แล้วเข้าร่วม URL ที่ส่งกลับมา
- `agent` คือโหมดพูดตอบกลับเริ่มต้น: การถอดเสียงแบบเรียลไทม์จะฟัง, Agent ของ OpenClaw ที่กำหนดค่าไว้จะตอบ, และ TTS ปกติของ OpenClaw จะพูดเข้าไปใน Meet
- `bidi` ยังพร้อมใช้เป็นโหมดสำรองของโมเดลเสียงเรียลไทม์โดยตรง
- Agent เลือกพฤติกรรมการเข้าร่วมด้วย `mode`: ใช้ `agent` สำหรับการฟัง/พูดตอบกลับแบบสด, `bidi` สำหรับเสียงเรียลไทม์โดยตรงเป็นสำรอง, หรือ `transcribe` เพื่อเข้าร่วม/ควบคุมเบราว์เซอร์โดยไม่มีสะพานพูดตอบกลับ
- การยืนยันตัวตนเริ่มจาก Google OAuth ส่วนบุคคลหรือโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้อยู่แล้ว
- ไม่มีการประกาศขอความยินยอมโดยอัตโนมัติ
- แบ็กเอนด์เสียงเริ่มต้นของ Chrome คือ `BlackHole 2ch`
- Chrome สามารถทำงานในเครื่องหรือบนโฮสต์ Node ที่จับคู่ไว้
- Twilio รับหมายเลขโทรเข้า พร้อม PIN หรือชุด DTMF ที่ไม่บังคับ; ไม่สามารถโทรไปยัง URL ของ Meet ได้โดยตรง
- คำสั่ง CLI คือ `googlemeet`; `meet` สงวนไว้สำหรับเวิร์กโฟลว์ประชุมทางไกลของ Agent ที่กว้างกว่า

## เริ่มต้นอย่างรวดเร็ว

ติดตั้ง dependency เสียงในเครื่องและกำหนดค่าผู้ให้บริการถอดเสียงแบบเรียลไทม์ พร้อม TTS ปกติของ OpenClaw OpenAI คือผู้ให้บริการถอดเสียงเริ่มต้น; Google Gemini Live ก็ทำงานได้ในฐานะเสียงสำรอง `bidi` แยกต่างหากด้วย `realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
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

เอาต์พุตการตั้งค่าถูกออกแบบให้อ่านได้โดย Agent และรับรู้โหมด มันรายงานโปรไฟล์ Chrome, การปักหมุด Node, และสำหรับการเข้าร่วม Chrome แบบเรียลไทม์ จะรายงานสะพานเสียง BlackHole/SoX และการตรวจสอบอินโทรเรียลไทม์แบบหน่วง สำหรับการเข้าร่วมแบบสังเกตอย่างเดียว ให้ตรวจสอบ transport เดียวกันด้วย `--mode transcribe`; โหมดนั้นข้ามข้อกำหนดเสียงเรียลไทม์เบื้องต้น เพราะไม่ได้ฟังผ่านหรือพูดผ่านสะพาน:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

เมื่อกำหนดค่าการมอบหมายผ่าน Twilio แล้ว การตั้งค่าจะรายงานด้วยว่า Plugin `voice-call`, ข้อมูลประจำตัว Twilio, และการเปิดเผย Webhook สาธารณะพร้อมหรือไม่ ถือว่าการตรวจสอบใดๆ ที่เป็น `ok: false` เป็นตัวบล็อกสำหรับ transport และโหมดที่ตรวจสอบ ก่อนขอให้ Agent เข้าร่วม ใช้ `openclaw googlemeet setup --json` สำหรับสคริปต์หรือเอาต์พุตที่เครื่องอ่านได้ ใช้ `--transport chrome`, `--transport chrome-node`, หรือ `--transport twilio` เพื่อ preflight transport ที่ระบุก่อนที่ Agent จะลองใช้

สำหรับ Twilio ให้ preflight transport อย่างชัดเจนเสมอเมื่อ transport เริ่มต้นคือ Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

ซึ่งจะจับการต่อสาย `voice-call` ที่ขาดหาย, ข้อมูลประจำตัว Twilio, หรือการเปิดเผย Webhook ที่เข้าถึงไม่ได้ ก่อนที่ Agent จะพยายามโทรเข้าการประชุม

เข้าร่วมการประชุม:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

หรือให้ Agent เข้าร่วมผ่านเครื่องมือ `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

เครื่องมือ `google_meet` สำหรับ Agent ยังพร้อมใช้งานบนโฮสต์ที่ไม่ใช่ macOS สำหรับ artifact, ปฏิทิน, การตั้งค่า, การถอดเสียง, Twilio, และโฟลว์ `chrome-node` การกระทำพูดตอบกลับผ่าน Chrome ในเครื่องถูกบล็อกบนโฮสต์เหล่านั้น เพราะเส้นทางเสียง Chrome ที่บันเดิลมาปัจจุบันพึ่งพา `BlackHole 2ch` ของ macOS บน Linux ให้ใช้ `mode: "transcribe"`, การโทรเข้าผ่าน Twilio, หรือโฮสต์ `chrome-node` บน macOS สำหรับการเข้าร่วมแบบพูดตอบกลับผ่าน Chrome

สร้างการประชุมใหม่และเข้าร่วม:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

สำหรับห้องที่สร้างผ่าน API ให้ใช้ Google Meet `SpaceConfig.accessType` เมื่อคุณต้องการให้ policy ไม่ต้องเคาะเข้าห้องของห้องนั้นชัดเจน แทนที่จะสืบทอดจากค่าเริ่มต้นของบัญชี Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` อนุญาตให้ทุกคนที่มี URL ของ Meet เข้าร่วมโดยไม่ต้องเคาะ `TRUSTED` อนุญาตให้ผู้ใช้ที่เชื่อถือได้ขององค์กรโฮสต์, ผู้ใช้ภายนอกที่ได้รับเชิญ, และผู้ใช้ที่โทรเข้าเข้าร่วมโดยไม่ต้องเคาะ `RESTRICTED` จำกัดการเข้าห้องแบบไม่ต้องเคาะไว้เฉพาะผู้ได้รับเชิญ การตั้งค่าเหล่านี้ใช้กับเส้นทางการสร้างผ่าน Google Meet API อย่างเป็นทางการเท่านั้น ดังนั้นต้องกำหนดค่าข้อมูลประจำตัว OAuth

หากคุณยืนยันตัวตน Google Meet ก่อนที่ตัวเลือกนี้จะพร้อมใช้งาน ให้รัน `openclaw googlemeet auth login --json` อีกครั้งหลังเพิ่ม scope `meetings.space.settings` ลงในหน้าจอขอความยินยอม Google OAuth ของคุณ

สร้างเฉพาะ URL โดยไม่เข้าร่วม:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` มีสองเส้นทาง:

- สร้างผ่าน API: ใช้เมื่อมีการกำหนดค่าข้อมูลประจำตัว Google Meet OAuth เส้นทางนี้กำหนดผลได้แน่นอนที่สุด และไม่พึ่งพาสถานะ UI ของเบราว์เซอร์
- สำรองผ่านเบราว์เซอร์: ใช้เมื่อไม่มีข้อมูลประจำตัว OAuth OpenClaw ใช้ Node ของ Chrome ที่ปักหมุดไว้ เปิด `https://meet.google.com/new` รอให้ Google เปลี่ยนเส้นทางไปยัง URL รหัสการประชุมจริง แล้วส่ง URL นั้นกลับ เส้นทางนี้ต้องให้โปรไฟล์ Chrome ของ OpenClaw บน Node ลงชื่อเข้าใช้ Google อยู่แล้ว ระบบอัตโนมัติของเบราว์เซอร์จัดการพรอมป์ไมโครโฟนครั้งแรกของ Meet เอง; พรอมป์นั้นไม่ถือเป็นความล้มเหลวในการเข้าสู่ระบบ Google
  โฟลว์เข้าร่วมและสร้างยังพยายามนำแท็บ Meet ที่มีอยู่กลับมาใช้ก่อนเปิดแท็บใหม่ด้วย การจับคู่จะละเว้น query string ของ URL ที่ไม่เป็นอันตราย เช่น `authuser` ดังนั้นการลองซ้ำของ Agent ควรโฟกัสการประชุมที่เปิดอยู่แล้วแทนที่จะสร้างแท็บ Chrome ที่สอง

เอาต์พุตคำสั่ง/เครื่องมือมีฟิลด์ `source` (`api` หรือ `browser`) เพื่อให้ Agent อธิบายได้ว่าใช้เส้นทางใด โดยค่าเริ่มต้น `create` จะเข้าร่วมการประชุมใหม่และส่งกลับ `joined: true` พร้อม session การเข้าร่วม หากต้องการสร้างเฉพาะ URL ให้ใช้ `create --no-join` บน CLI หรือส่ง `"join": false` ให้เครื่องมือ

หรือบอก Agent ว่า: "สร้าง Google Meet, เข้าร่วมด้วยโหมดพูดตอบกลับของ Agent, แล้วส่งลิงก์ให้ฉัน" Agent ควรเรียก `google_meet` ด้วย `action: "create"` แล้วแชร์ `meetingUri` ที่ส่งกลับมา

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

สำหรับการเข้าร่วมแบบสังเกตอย่างเดียว/ควบคุมเบราว์เซอร์ ให้ตั้ง `"mode": "transcribe"` ซึ่งจะไม่เริ่มสะพานเสียงเรียลไทม์แบบสองทาง, ไม่ต้องใช้ BlackHole หรือ SoX, และจะไม่พูดตอบกลับเข้าไปในการประชุม การเข้าร่วมผ่าน Chrome ในโหมดนี้ยังหลีกเลี่ยงการให้สิทธิ์ไมโครโฟน/กล้องของ OpenClaw และหลีกเลี่ยงเส้นทาง **ใช้ไมโครโฟน** ของ Meet หาก Meet แสดง interstitial สำหรับการเลือกเสียง ระบบอัตโนมัติจะลองเส้นทางไม่ใช้ไมโครโฟน และถ้าไม่ได้ก็รายงานการกระทำด้วยตนเองแทนการเปิดไมโครโฟนในเครื่อง ในโหมด transcribe, managed Chrome transports ยังติดตั้งตัวสังเกตคำบรรยาย Meet แบบ best-effort ด้วย `googlemeet status --json` และ `googlemeet doctor` แสดง `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`, และส่วนท้าย `recentTranscript` สั้นๆ เพื่อให้ผู้ปฏิบัติการบอกได้ว่าเบราว์เซอร์เข้าร่วมสายแล้วหรือไม่ และคำบรรยาย Meet กำลังสร้างข้อความหรือไม่
ใช้ `openclaw googlemeet test-listen <meet-url> --transport chrome-node` เมื่อต้องการ probe แบบใช่/ไม่ใช่: มันเข้าร่วมในโหมด transcribe, รอคำบรรยายสดหรือการเปลี่ยนแปลง transcript ใหม่, และส่งกลับ `listenVerified`, `listenTimedOut`, ฟิลด์การกระทำด้วยตนเอง, และสถานะคำบรรยายล่าสุด

ระหว่าง session เรียลไทม์ สถานะ `google_meet` มีสถานะสุขภาพของเบราว์เซอร์และสะพานเสียง เช่น `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamp อินพุต/เอาต์พุตล่าสุด, ตัวนับ byte, และสถานะสะพานปิด หากพรอมป์หน้า Meet ที่ปลอดภัยปรากฏขึ้น ระบบอัตโนมัติของเบราว์เซอร์จะจัดการเมื่อทำได้ การเข้าสู่ระบบ, การรับเข้าห้องโดยโฮสต์, และพรอมป์สิทธิ์ของเบราว์เซอร์/OS จะถูกรายงานเป็นการกระทำด้วยตนเองพร้อมเหตุผลและข้อความให้ Agent ถ่ายทอด Managed Chrome sessions จะส่งอินโทรหรือวลีทดสอบออกมาเฉพาะหลังจากสถานะสุขภาพของเบราว์เซอร์รายงาน `inCall: true`; มิฉะนั้นสถานะจะรายงาน `speechReady: false` และบล็อกความพยายามพูด แทนการแสร้งว่า Agent ได้พูดเข้าไปในการประชุมแล้ว

การเข้าร่วมผ่าน Chrome ในเครื่องใช้โปรไฟล์เบราว์เซอร์ OpenClaw ที่ลงชื่อเข้าใช้แล้ว โหมดเรียลไทม์ต้องใช้ `BlackHole 2ch` สำหรับเส้นทางไมโครโฟน/ลำโพงที่ OpenClaw ใช้ เพื่อเสียงสองทางที่สะอาด ให้ใช้อุปกรณ์เสมือนแยกกันหรือกราฟแบบ Loopback; อุปกรณ์ BlackHole เดียวเพียงพอสำหรับ smoke test แรก แต่อาจเกิดเสียงสะท้อน

### Gateway ในเครื่อง + Chrome บน Parallels

คุณ **ไม่** จำเป็นต้องมี OpenClaw Gateway เต็มรูปแบบหรือคีย์ API ของโมเดลภายใน VM macOS เพียงเพื่อให้ VM เป็นเจ้าของ Chrome ให้รัน Gateway และ Agent ในเครื่อง แล้วรันโฮสต์ Node ใน VM เปิดใช้ Plugin ที่บันเดิลมาใน VM หนึ่งครั้ง เพื่อให้ Node โฆษณาคำสั่ง Chrome:

สิ่งที่รันในแต่ละที่:

- โฮสต์ Gateway: OpenClaw Gateway, workspace ของ Agent, คีย์โมเดล/API, ผู้ให้บริการเรียลไทม์, และ config ของ Plugin Google Meet
- VM macOS ของ Parallels: OpenClaw CLI/โฮสต์ Node, Google Chrome, SoX, BlackHole 2ch, และโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้ Google
- ไม่จำเป็นใน VM: บริการ Gateway, config ของ Agent, คีย์ OpenAI/GPT, หรือการตั้งค่าผู้ให้บริการโมเดล

ติดตั้ง dependency ของ VM:

```bash
brew install blackhole-2ch sox
```

รีบูต VM หลังติดตั้ง BlackHole เพื่อให้ macOS แสดง `BlackHole 2ch`:

```bash
sudo reboot
```

หลังรีบูต ให้ตรวจสอบว่า VM เห็นอุปกรณ์เสียงและคำสั่ง SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

ติดตั้งหรืออัปเดต OpenClaw ใน VM แล้วเปิดใช้ Plugin ที่บันเดิลมาที่นั่น:

```bash
openclaw plugins enable google-meet
```

เริ่มโฮสต์ Node ใน VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

หาก `<gateway-host>` เป็น IP ของ LAN และคุณไม่ได้ใช้ TLS, Node จะปฏิเสธ WebSocket แบบ plaintext เว้นแต่คุณจะยินยอมสำหรับเครือข่ายส่วนตัวที่เชื่อถือได้นั้น:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

ใช้ environment variable เดียวกันเมื่อติดตั้ง Node เป็น LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` คือ environment ของ process ไม่ใช่การตั้งค่า `openclaw.json` `openclaw node install` จะเก็บค่าไว้ใน environment ของ LaunchAgent เมื่อมีค่านี้อยู่ในคำสั่งติดตั้ง

อนุมัติ Node จากโฮสต์ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

ยืนยันว่า Gateway เห็น Node และ Node โฆษณาทั้ง `googlemeet.chrome` และความสามารถของเบราว์เซอร์/`browser.proxy`:

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

ตอนนี้เข้าร่วมตามปกติจากโฮสต์ Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

หรือขอให้ Agent ใช้เครื่องมือ `google_meet` ด้วย `transport: "chrome-node"`

สำหรับ smoke test คำสั่งเดียวที่สร้างหรือนำ session กลับมาใช้, พูดวลีที่รู้ล่วงหน้า, และพิมพ์สถานะสุขภาพของ session:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

ระหว่างการเข้าร่วมแบบเรียลไทม์ ระบบอัตโนมัติของเบราว์เซอร์ OpenClaw จะกรอกชื่อผู้เข้าร่วม คลิก
Join/Ask to join และยอมรับตัวเลือก "Use microphone" ครั้งแรกของ Meet เมื่อ
พรอมป์นั้นปรากฏ ระหว่างการเข้าร่วมแบบสังเกตการณ์อย่างเดียวหรือการสร้างการประชุมด้วยเบราว์เซอร์เท่านั้น ระบบจะ
ดำเนินการต่อผ่านพรอมป์เดียวกันโดยไม่ใช้ไมโครโฟนเมื่อมีตัวเลือกนั้นให้ใช้
หากโปรไฟล์เบราว์เซอร์ไม่ได้ลงชื่อเข้าใช้, Meet กำลังรอการอนุมัติจากโฮสต์,
Chrome ต้องการสิทธิ์ไมโครโฟน/กล้องสำหรับการเข้าร่วมแบบเรียลไทม์ หรือ Meet ค้างอยู่
ที่พรอมป์ซึ่งระบบอัตโนมัติไม่สามารถจัดการได้ ผลลัพธ์ join/test-speech จะรายงาน
`manualActionRequired: true` พร้อม `manualActionReason` และ
`manualActionMessage` Agents ควรหยุดลองเข้าร่วมซ้ำ รายงานข้อความนั้นตามจริง
พร้อม `browserUrl`/`browserTitle` ปัจจุบัน และลองใหม่เฉพาะหลังจาก
การดำเนินการด้วยตนเองในเบราว์เซอร์เสร็จสมบูรณ์แล้ว

หากละเว้น `chromeNode.node` OpenClaw จะเลือกอัตโนมัติเฉพาะเมื่อมี
Node ที่เชื่อมต่ออยู่เพียงหนึ่งรายการซึ่งประกาศทั้ง `googlemeet.chrome` และการควบคุมเบราว์เซอร์ หาก
มี Node ที่รองรับหลายรายการเชื่อมต่ออยู่ ให้ตั้ง `chromeNode.node` เป็น id ของ Node,
ชื่อที่แสดง หรือ IP ระยะไกล

การตรวจสอบความล้มเหลวทั่วไป:

- `Configured Google Meet node ... is not usable: offline`: Node ที่ปักหมุดไว้เป็น
  ที่รู้จักของ Gateway แต่ไม่พร้อมใช้งาน Agents ควรมอง Node นั้นเป็น
  สถานะวินิจฉัย ไม่ใช่เป็นโฮสต์ Chrome ที่ใช้งานได้ และรายงานตัวขัดขวางการตั้งค่า
  แทนการถอยไปใช้การรับส่งอื่น เว้นแต่ผู้ใช้ขอไว้เช่นนั้น
- `No connected Google Meet-capable node`: เริ่ม `openclaw node run` ใน VM,
  อนุมัติการจับคู่ และตรวจสอบให้แน่ใจว่าได้เรียกใช้ `openclaw plugins enable google-meet` และ
  `openclaw plugins enable browser` ใน VM แล้ว และยืนยันว่าโฮสต์
  Gateway อนุญาตคำสั่ง Node ทั้งสองด้วย
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`
- `BlackHole 2ch audio device not found`: ติดตั้ง `blackhole-2ch` บนโฮสต์
  ที่กำลังตรวจสอบ แล้วรีบูตก่อนใช้เสียง Chrome ภายในเครื่อง
- `BlackHole 2ch audio device not found on the node`: ติดตั้ง `blackhole-2ch`
  ใน VM แล้วรีบูต VM
- Chrome เปิดขึ้นแต่เข้าร่วมไม่ได้: ลงชื่อเข้าใช้โปรไฟล์เบราว์เซอร์ภายใน VM หรือ
  ตั้งค่า `chrome.guestName` ไว้สำหรับการเข้าร่วมในฐานะแขก การเข้าร่วมอัตโนมัติแบบแขกใช้ระบบอัตโนมัติของ
  เบราว์เซอร์ OpenClaw ผ่านพร็อกซีเบราว์เซอร์ของ Node ตรวจสอบให้แน่ใจว่าคอนฟิกเบราว์เซอร์ของ Node
  ชี้ไปยังโปรไฟล์ที่คุณต้องการ เช่น
  `browser.defaultProfile: "user"` หรือโปรไฟล์เซสชันที่มีอยู่แบบมีชื่อ
- แท็บ Meet ซ้ำ: เปิดใช้ `chrome.reuseExistingTab: true` ไว้ OpenClaw
  จะเปิดใช้งานแท็บที่มีอยู่สำหรับ Meet URL เดียวกันก่อนเปิดแท็บใหม่ และ
  การสร้างการประชุมในเบราว์เซอร์จะใช้แท็บ `https://meet.google.com/new`
  ที่กำลังดำเนินอยู่หรือแท็บพรอมป์บัญชี Google เดิมก่อนเปิดอีกแท็บ
- ไม่มีเสียง: ใน Meet ให้กำหนดเส้นทางไมโครโฟน/ลำโพงผ่านพาธอุปกรณ์เสียงเสมือน
  ที่ OpenClaw ใช้ ใช้อุปกรณ์เสมือนแยกกันหรือการกำหนดเส้นทางแบบ Loopback
  เพื่อเสียงสองทางที่สะอาด

## หมายเหตุการติดตั้ง

ค่าเริ่มต้นการพูดตอบกลับของ Chrome ใช้เครื่องมือภายนอกสองรายการ:

- `sox`: ยูทิลิตีเสียงแบบบรรทัดคำสั่ง Plugin ใช้คำสั่งอุปกรณ์ CoreAudio
  แบบชัดเจนสำหรับบริดจ์เสียง PCM16 24 kHz เริ่มต้น
- `blackhole-2ch`: ไดรเวอร์เสียงเสมือนของ macOS โดยจะสร้างอุปกรณ์เสียง `BlackHole 2ch`
  ที่ Chrome/Meet สามารถกำหนดเส้นทางผ่านได้

OpenClaw ไม่ได้บันเดิลหรือแจกจ่ายแพ็กเกจใดแพ็กเกจหนึ่ง เอกสารขอให้ผู้ใช้
ติดตั้งเป็น dependency ของโฮสต์ผ่าน Homebrew SoX ใช้ไลเซนส์
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole เป็น GPL-3.0 หากคุณสร้าง
ตัวติดตั้งหรือ appliance ที่บันเดิล BlackHole กับ OpenClaw ให้ตรวจสอบข้อกำหนดไลเซนส์
ต้นน้ำของ BlackHole หรือขอไลเซนส์แยกจาก Existential Audio

## การรับส่ง

### Chrome

การรับส่ง Chrome จะเปิด Meet URL ผ่านการควบคุมเบราว์เซอร์ OpenClaw และเข้าร่วม
ในฐานะโปรไฟล์เบราว์เซอร์ OpenClaw ที่ลงชื่อเข้าใช้อยู่ บน macOS Plugin จะตรวจสอบ
`BlackHole 2ch` ก่อนเปิดใช้งาน หากกำหนดค่าไว้ ระบบจะเรียกใช้คำสั่งตรวจสุขภาพ
บริดจ์เสียงและคำสั่งเริ่มต้นก่อนเปิด Chrome ด้วย ใช้ `chrome` เมื่อ
Chrome/เสียงอยู่บนโฮสต์ Gateway; ใช้ `chrome-node` เมื่อ Chrome/เสียงอยู่
บน Node ที่จับคู่ไว้ เช่น Parallels macOS VM สำหรับ Chrome ภายในเครื่อง ให้เลือก
โปรไฟล์ด้วย `browser.defaultProfile`; `chrome.browserProfile` จะถูกส่งไปยัง
โฮสต์ `chrome-node`

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

กำหนดเส้นทางเสียงไมโครโฟนและลำโพงของ Chrome ผ่านบริดจ์เสียง OpenClaw ภายในเครื่อง
หากไม่ได้ติดตั้ง `BlackHole 2ch` การเข้าร่วมจะล้มเหลวด้วยข้อผิดพลาดการตั้งค่า
แทนที่จะเข้าร่วมแบบเงียบ ๆ โดยไม่มีพาธเสียง

### Twilio

การรับส่ง Twilio เป็นแผนการโทรที่เข้มงวดซึ่งมอบหมายให้ Voice Call Plugin
จัดการ โดยจะไม่แยกวิเคราะห์หน้า Meet เพื่อหาหมายเลขโทรศัพท์

ใช้สิ่งนี้เมื่อการเข้าร่วมผ่าน Chrome ไม่พร้อมใช้งาน หรือคุณต้องการทางเลือกสำรอง
การโทรเข้า Google Meet ต้องเปิดเผยหมายเลขโทรเข้าและ PIN สำหรับ
การประชุม OpenClaw จะไม่ค้นหาข้อมูลเหล่านั้นจากหน้า Meet

เปิดใช้ Voice Call Plugin บนโฮสต์ Gateway ไม่ใช่บน Chrome Node:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
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
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
      },
    },
  },
}
```

ระบุข้อมูลประจำตัว Twilio ผ่าน environment หรือคอนฟิก Environment ช่วยเก็บ
ความลับออกจาก `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

ใช้ `realtime.provider: "openai"` กับ OpenAI provider Plugin และ
`OPENAI_API_KEY` แทน หากนั่นคือผู้ให้บริการเสียงเรียลไทม์ของคุณ

รีสตาร์ตหรือโหลด Gateway ใหม่หลังเปิดใช้ `voice-call`; การเปลี่ยนแปลงคอนฟิก Plugin
จะไม่ปรากฏในโปรเซส Gateway ที่กำลังทำงานอยู่จนกว่าจะโหลดใหม่

จากนั้นตรวจสอบ:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

เมื่อการมอบหมาย Twilio เชื่อมต่อเรียบร้อยแล้ว `googlemeet setup` จะรวมการตรวจสอบ
`twilio-voice-call-plugin`, `twilio-voice-call-credentials` และ
`twilio-voice-call-webhook` ที่สำเร็จ

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

ใช้ `--dtmf-sequence` เมื่อการประชุมต้องการลำดับแบบกำหนดเอง:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth และ preflight

OAuth เป็นตัวเลือกสำหรับการสร้างลิงก์ Meet เพราะ `googlemeet create` สามารถถอยไปใช้
ระบบอัตโนมัติของเบราว์เซอร์ได้ กำหนดค่า OAuth เมื่อคุณต้องการการสร้างผ่าน API อย่างเป็นทางการ,
การแก้ไข space หรือการตรวจสอบ preflight ของ Meet Media API

การเข้าถึง Google Meet API ใช้ OAuth ของผู้ใช้: สร้าง Google Cloud OAuth client,
ขอ scope ที่จำเป็น อนุญาตบัญชี Google แล้วจัดเก็บ
refresh token ที่ได้ไว้ในคอนฟิก Google Meet Plugin หรือระบุผ่าน
ตัวแปร environment `OPENCLAW_GOOGLE_MEET_*`

OAuth ไม่ได้แทนที่พาธการเข้าร่วมผ่าน Chrome การรับส่ง Chrome และ Chrome-node
ยังคงเข้าร่วมผ่านโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้, BlackHole/SoX และ Node
ที่เชื่อมต่ออยู่เมื่อคุณใช้การเข้าร่วมผ่านเบราว์เซอร์ OAuth ใช้เฉพาะสำหรับพาธ Google
Meet API อย่างเป็นทางการเท่านั้น: สร้าง meeting spaces, แก้ไข spaces และเรียกใช้
การตรวจสอบ preflight ของ Meet Media API

### สร้างข้อมูลประจำตัว Google

ใน Google Cloud Console:

1. สร้างหรือเลือกโปรเจกต์ Google Cloud
2. เปิดใช้ **Google Meet REST API** สำหรับโปรเจกต์นั้น
3. กำหนดค่าหน้าจอยินยอม OAuth
   - **Internal** ง่ายที่สุดสำหรับองค์กร Google Workspace
   - **External** ใช้ได้กับการตั้งค่าส่วนตัว/ทดสอบ; ขณะที่แอปอยู่ใน Testing,
     ให้เพิ่มบัญชี Google แต่ละบัญชีที่จะอนุญาตแอปเป็นผู้ใช้ทดสอบ
4. เพิ่ม scope ที่ OpenClaw ขอ:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. สร้าง OAuth client ID
   - ประเภทแอปพลิเคชัน: **Web application**
   - Authorized redirect URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. คัดลอก client ID และ client secret

`meetings.space.created` จำเป็นสำหรับ Google Meet `spaces.create`
`meetings.space.readonly` ช่วยให้ OpenClaw แก้ไข Meet URLs/โค้ดเป็น spaces ได้
`meetings.space.settings` ช่วยให้ OpenClaw ส่งการตั้งค่า `SpaceConfig` เช่น
`accessType` ระหว่างการสร้างห้องผ่าน API ได้
`meetings.conference.media.readonly` ใช้สำหรับ preflight ของ Meet Media API และงานสื่อ;
Google อาจต้องมีการลงทะเบียน Developer Preview สำหรับการใช้ Media API จริง
หากคุณต้องการเพียงการเข้าร่วม Chrome ผ่านเบราว์เซอร์ ให้ข้าม OAuth ทั้งหมด

### สร้าง refresh token

กำหนดค่า `oauth.clientId` และ `oauth.clientSecret` หากต้องการ หรือส่งผ่านเป็น
ตัวแปร environment แล้วเรียกใช้:

```bash
openclaw googlemeet auth login --json
```

คำสั่งจะพิมพ์บล็อกคอนฟิก `oauth` พร้อม refresh token โดยใช้ PKCE,
คอลแบ็ก localhost ที่ `http://localhost:8085/oauth2callback` และโฟลว์
คัดลอก/วางด้วยตนเองด้วย `--manual`

ตัวอย่าง:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

ใช้โหมด manual เมื่อเบราว์เซอร์เข้าถึงคอลแบ็กภายในเครื่องไม่ได้:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

เอาต์พุต JSON รวมถึง:

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

จัดเก็บอ็อบเจกต์ `oauth` ไว้ใต้คอนฟิก Google Meet Plugin:

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

ควรใช้ตัวแปร environment เมื่อคุณไม่ต้องการให้ refresh token อยู่ในคอนฟิก
หากมีทั้งค่าจากคอนฟิกและ environment Plugin จะเลือกคอนฟิก
ก่อน แล้วจึงใช้ environment เป็น fallback

การยินยอม OAuth รวมการสร้าง Meet space, สิทธิ์อ่าน Meet space และสิทธิ์อ่านสื่อ
การประชุมของ Meet หากคุณยืนยันตัวตนก่อนมีการรองรับการสร้างการประชุม
ให้เรียกใช้ `openclaw googlemeet auth login --json` อีกครั้ง เพื่อให้ refresh
token มี scope `meetings.space.created`

### ตรวจสอบ OAuth ด้วย doctor

เรียกใช้ OAuth doctor เมื่อคุณต้องการการตรวจสุขภาพที่รวดเร็วและไม่เปิดเผยความลับ:

```bash
openclaw googlemeet doctor --oauth --json
```

คำสั่งนี้ไม่โหลด Chrome runtime หรือจำเป็นต้องมี Chrome Node ที่เชื่อมต่ออยู่
โดยตรวจสอบว่ามีคอนฟิก OAuth และ refresh token สามารถสร้าง access
token ได้ รายงาน JSON จะรวมเฉพาะฟิลด์สถานะ เช่น `ok`, `configured`,
`tokenSource`, `expiresAt` และข้อความตรวจสอบ; จะไม่พิมพ์ access
token, refresh token หรือ client secret

ผลลัพธ์ทั่วไป:

| การตรวจสอบ                | ความหมาย                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | มี `oauth.clientId` พร้อม `oauth.refreshToken` หรือโทเค็นการเข้าถึงที่แคชไว้       |
| `oauth-token`        | โทเค็นการเข้าถึงที่แคชไว้ยังใช้ได้ หรือโทเค็นรีเฟรชออกโทเค็นการเข้าถึงใหม่ |
| `meet-spaces-get`    | การตรวจสอบ `--meeting` แบบไม่บังคับแก้ค่าเป็น Meet space ที่มีอยู่แล้ว                             |
| `meet-spaces-create` | การตรวจสอบ `--create-space` แบบไม่บังคับสร้าง Meet space ใหม่                               |

หากต้องการพิสูจน์การเปิดใช้ Google Meet API และขอบเขต `spaces.create` ด้วย ให้รันการตรวจสอบสร้างที่มีผลข้างเคียง:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` สร้าง Meet URL ชั่วคราว ใช้เมื่อคุณต้องยืนยันว่าโปรเจกต์ Google Cloud เปิดใช้ Meet API แล้ว และบัญชีที่ได้รับอนุญาตมีขอบเขต `meetings.space.created`

หากต้องการพิสูจน์สิทธิ์อ่านสำหรับ meeting space ที่มีอยู่:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` และ `resolve-space` พิสูจน์สิทธิ์อ่านสำหรับ space ที่มีอยู่ซึ่งบัญชี Google ที่ได้รับอนุญาตเข้าถึงได้ ค่า `403` จากการตรวจสอบเหล่านี้มักหมายความว่า Google Meet REST API ถูกปิดใช้งาน, โทเค็นรีเฟรชที่ยินยอมไว้ไม่มีขอบเขตที่จำเป็น, หรือบัญชี Google ไม่สามารถเข้าถึง Meet space นั้นได้ ข้อผิดพลาดของโทเค็นรีเฟรชหมายความว่าให้รัน `openclaw googlemeet auth login
--json` อีกครั้งและจัดเก็บบล็อก `oauth` ใหม่

ไม่จำเป็นต้องมีข้อมูลประจำตัว OAuth สำหรับทางเลือกสำรองของเบราว์เซอร์ ในโหมดนั้น การยืนยันตัวตน Google มาจากโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้บน Node ที่เลือก ไม่ใช่จากการกำหนดค่า OpenClaw

ยอมรับตัวแปรสภาพแวดล้อมเหล่านี้เป็นค่าทางเลือกสำรอง:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` หรือ `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` หรือ `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` หรือ
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` หรือ `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` หรือ `GOOGLE_MEET_PREVIEW_ACK`

แก้ค่า Meet URL, รหัส, หรือ `spaces/{id}` ผ่าน `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

รันการตรวจสอบก่อนเริ่มงานสื่อ:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

แสดงรายการอาร์ทิแฟกต์การประชุมและการเข้าร่วมหลังจาก Meet สร้างระเบียนการประชุมแล้ว:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

เมื่อใช้ `--meeting`, `artifacts` และ `attendance` จะใช้ระเบียนการประชุมล่าสุดโดยค่าเริ่มต้น ส่ง `--all-conference-records` เมื่อคุณต้องการระเบียนทั้งหมดที่ยังเก็บไว้สำหรับการประชุมนั้น

การค้นหา Calendar สามารถแก้ค่า URL การประชุมจาก Google Calendar ก่อนอ่านอาร์ทิแฟกต์ Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` ค้นหาปฏิทิน `primary` ของวันนี้เพื่อหาเหตุการณ์ Calendar ที่มีลิงก์ Google Meet ใช้ `--event <query>` เพื่อค้นหาข้อความเหตุการณ์ที่ตรงกัน และ `--calendar <id>` สำหรับปฏิทินที่ไม่ใช่ปฏิทินหลัก การค้นหา Calendar ต้องใช้การเข้าสู่ระบบ OAuth ใหม่ที่รวมขอบเขตอ่านอย่างเดียวของเหตุการณ์ Calendar
`calendar-events` แสดงตัวอย่างเหตุการณ์ Meet ที่ตรงกันและทำเครื่องหมายเหตุการณ์ที่ `latest`, `artifacts`, `attendance`, หรือ `export` จะเลือก

หากคุณรู้อยู่แล้วว่าเป็นไอดีระเบียนการประชุมใด ให้ระบุโดยตรง:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

จบการประชุมที่ใช้งานอยู่สำหรับ space ที่สร้างด้วย API เมื่อคุณต้องการปิดห้องหลังการโทร:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

คำสั่งนี้เรียก Google Meet `spaces.endActiveConference` และต้องใช้ OAuth พร้อมขอบเขต `meetings.space.created` สำหรับ space ที่บัญชีที่ได้รับอนุญาตจัดการได้ OpenClaw ยอมรับอินพุตเป็น Meet URL, รหัสการประชุม, หรือ `spaces/{id}` แล้วแก้ค่าเป็นทรัพยากร space ของ API ก่อนจบการประชุมที่ใช้งานอยู่
คำสั่งนี้แยกจาก `googlemeet leave`: `leave` หยุดการเข้าร่วมแบบ local/session ของ OpenClaw ส่วน `end-active-conference` ขอให้ Google Meet จบการประชุมที่ใช้งานอยู่สำหรับ space

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

`artifacts` ส่งคืนเมตาดาต้าของระเบียนการประชุมพร้อมเมตาดาต้าทรัพยากรของผู้เข้าร่วม, การบันทึก, บทถอดเสียง, รายการบทถอดเสียงแบบมีโครงสร้าง, และบันทึกอัจฉริยะเมื่อ Google เปิดเผยให้กับการประชุมนั้น ใช้ `--no-transcript-entries` เพื่อข้ามการค้นหารายการสำหรับการประชุมขนาดใหญ่ `attendance` ขยายผู้เข้าร่วมเป็นแถวเซสชันผู้เข้าร่วมพร้อมเวลาเห็นครั้งแรก/ครั้งล่าสุด, ระยะเวลาเซสชันรวม, แฟล็กมาสาย/ออกก่อน, และรวมทรัพยากรผู้เข้าร่วมที่ซ้ำกันตามผู้ใช้ที่ลงชื่อเข้าใช้หรือชื่อที่แสดง ส่ง `--no-merge-duplicates` เพื่อแยกทรัพยากรผู้เข้าร่วมดิบไว้ต่างหาก, `--late-after-minutes` เพื่อปรับการตรวจจับมาสาย, และ `--early-before-minutes` เพื่อปรับการตรวจจับออกก่อน

`export` เขียนโฟลเดอร์ที่มี `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json`, และ `manifest.json`
`manifest.json` บันทึกอินพุตที่เลือก, ตัวเลือกการส่งออก, ระเบียนการประชุม, ไฟล์เอาต์พุต, จำนวน, แหล่งที่มาของโทเค็น, เหตุการณ์ Calendar เมื่อมีการใช้, และคำเตือนการดึงข้อมูลบางส่วน ส่ง `--zip` เพื่อเขียนไฟล์เก็บถาวรแบบพกพาข้างโฟลเดอร์ด้วย ส่ง `--include-doc-bodies` เพื่อส่งออกข้อความ Google Docs ของบทถอดเสียงและบันทึกอัจฉริยะที่เชื่อมโยงผ่าน Google Drive `files.export`; สิ่งนี้ต้องใช้การเข้าสู่ระบบ OAuth ใหม่ที่รวมขอบเขตอ่านอย่างเดียวของ Drive Meet หากไม่มี `--include-doc-bodies` การส่งออกจะรวมเฉพาะเมตาดาต้า Meet และรายการบทถอดเสียงแบบมีโครงสร้างเท่านั้น หาก Google ส่งคืนความล้มเหลวของอาร์ทิแฟกต์บางส่วน เช่น ข้อผิดพลาดการแสดงรายการบันทึกอัจฉริยะ, รายการบทถอดเสียง, หรือเนื้อหาเอกสารจาก Drive สรุปและแมนิเฟสต์จะเก็บคำเตือนไว้แทนที่จะทำให้การส่งออกทั้งหมดล้มเหลว
ใช้ `--dry-run` เพื่อดึงข้อมูลอาร์ทิแฟกต์/การเข้าร่วมชุดเดียวกันและพิมพ์ JSON ของแมนิเฟสต์โดยไม่สร้างโฟลเดอร์หรือ ZIP วิธีนี้มีประโยชน์ก่อนเขียนการส่งออกขนาดใหญ่ หรือเมื่อ agent ต้องการเพียงจำนวน ระเบียนที่เลือก และคำเตือน

agent ยังสามารถสร้างบันเดิลเดียวกันผ่านเครื่องมือ `google_meet`:

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

agent ยังสามารถสร้างห้องที่หนุนด้วย API พร้อมนโยบายการเข้าถึงที่ระบุชัดเจน:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

และสามารถจบการประชุมที่ใช้งานอยู่สำหรับห้องที่รู้จักได้:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

สำหรับการตรวจสอบแบบฟังก่อน agent ควรใช้ `test_listen` ก่อนอ้างว่าการประชุมมีประโยชน์:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

รัน live smoke ที่มีการป้องกันกับการประชุมจริงที่ยังเก็บไว้:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

รันโพรบเบราว์เซอร์แบบฟังก่อนแบบสดกับการประชุมที่มีคนพูดและมีคำบรรยาย Meet พร้อมใช้งาน:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

สภาพแวดล้อม live smoke:

- `OPENCLAW_LIVE_TEST=1` เปิดใช้การทดสอบสดที่มีการป้องกัน
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` ชี้ไปที่ Meet URL, รหัส, หรือ `spaces/{id}` ที่ยังเก็บไว้
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID` ให้ไอดีไคลเอนต์ OAuth
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN` ให้โทเค็นรีเฟรช
- ไม่บังคับ: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, และ
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ใช้ชื่อทางเลือกสำรองเดียวกันโดยไม่มีคำนำหน้า `OPENCLAW_`

live smoke พื้นฐานสำหรับอาร์ทิแฟกต์/การเข้าร่วมต้องใช้
`https://www.googleapis.com/auth/meetings.space.readonly` และ
`https://www.googleapis.com/auth/meetings.conference.media.readonly` การค้นหา Calendar ต้องใช้ `https://www.googleapis.com/auth/calendar.events.readonly` การส่งออกเนื้อหาเอกสารจาก Drive ต้องใช้
`https://www.googleapis.com/auth/drive.meet.readonly`

สร้าง Meet space ใหม่:

```bash
openclaw googlemeet create
```

คำสั่งนี้พิมพ์ `meeting uri`, แหล่งที่มา, และเซสชันเข้าร่วมใหม่ เมื่อมีข้อมูลประจำตัว OAuth คำสั่งจะใช้ Google Meet API อย่างเป็นทางการ หากไม่มีข้อมูลประจำตัว OAuth คำสั่งจะใช้โปรไฟล์เบราว์เซอร์ที่ลงชื่อเข้าใช้ของ Node Chrome ที่ปักหมุดไว้เป็นทางเลือกสำรอง agent สามารถใช้เครื่องมือ `google_meet` พร้อม `action: "create"` เพื่อสร้างและเข้าร่วมในขั้นตอนเดียว สำหรับการสร้างเฉพาะ URL ให้ส่ง `"join": false`

ตัวอย่างเอาต์พุต JSON จากทางเลือกสำรองของเบราว์เซอร์:

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

หากทางเลือกสำรองของเบราว์เซอร์เจอการเข้าสู่ระบบ Google หรือตัวขวางสิทธิ์ Meet ก่อนที่จะสร้าง URL ได้ เมธอด Gateway จะส่งคืนการตอบกลับที่ล้มเหลว และเครื่องมือ `google_meet` จะส่งคืนรายละเอียดแบบมีโครงสร้างแทนสตริงธรรมดา:

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

เมื่อ agent เห็น `manualActionRequired: true` ควรรายงาน `manualActionMessage` พร้อมบริบท Node/แท็บของเบราว์เซอร์ แล้วหยุดเปิดแท็บ Meet ใหม่จนกว่าผู้ปฏิบัติการจะทำขั้นตอนในเบราว์เซอร์ให้เสร็จ

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

การสร้าง Meet จะเข้าร่วมโดยค่าเริ่มต้น ทรานสปอร์ต Chrome หรือ Chrome-node ยัง
ต้องใช้โปรไฟล์ Google Chrome ที่ลงชื่อเข้าใช้แล้วเพื่อเข้าร่วมผ่านเบราว์เซอร์ หาก
โปรไฟล์ออกจากระบบอยู่ OpenClaw จะรายงาน `manualActionRequired: true` หรือข้อผิดพลาด
การสำรองไปใช้เบราว์เซอร์ และขอให้ผู้ปฏิบัติงานล็อกอิน Google ให้เสร็จก่อนลองใหม่

ตั้งค่า `preview.enrollmentAcknowledged: true` เฉพาะหลังจากยืนยันแล้วว่าโปรเจกต์ Cloud
ของคุณ, OAuth principal และผู้เข้าร่วมการประชุมได้ลงทะเบียนใน Google
Workspace Developer Preview Program สำหรับ Meet media APIs แล้ว

## การกำหนดค่า

เส้นทางเอเจนต์ Chrome ทั่วไปต้องการเพียงเปิดใช้ Plugin, BlackHole, SoX, คีย์
ผู้ให้บริการถอดเสียงแบบเรียลไทม์ และผู้ให้บริการ TTS ของ OpenClaw ที่กำหนดค่าไว้
OpenAI เป็นผู้ให้บริการถอดเสียงเริ่มต้น; ตั้งค่า `realtime.voiceProvider` เป็น
`"google"` และ `realtime.model` เพื่อใช้ Google Gemini Live สำหรับโหมด `bidi`
โดยไม่เปลี่ยนผู้ให้บริการถอดเสียงเริ่มต้นของโหมดเอเจนต์:

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
- `defaultMode: "agent"` (`"realtime"` ยอมรับเฉพาะในฐานะนามแฝงความเข้ากันได้เดิม
  สำหรับ `"agent"`; การเรียกเครื่องมือใหม่ควรระบุ `"agent"`)
- `chromeNode.node`: id/ชื่อ/IP ของ Node ที่ไม่บังคับสำหรับ `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ชื่อที่ใช้บนหน้าจอแขก Meet ที่ยังไม่ได้ลงชื่อเข้าใช้
- `chrome.autoJoin: true`: กรอกชื่อแขกและคลิก Join Now แบบพยายามดีที่สุด
  ผ่านการทำงานอัตโนมัติของเบราว์เซอร์ OpenClaw บน `chrome-node`
- `chrome.reuseExistingTab: true`: เปิดใช้งานแท็บ Meet ที่มีอยู่แทนการเปิดซ้ำ
- `chrome.waitForInCallMs: 20000`: รอให้แท็บ Meet รายงานว่าอยู่ในสาย
  ก่อนทริกเกอร์บทนำแบบพูดตอบกลับ
- `chrome.audioFormat: "pcm16-24khz"`: รูปแบบเสียงของคู่คำสั่ง ใช้
  `"g711-ulaw-8khz"` เฉพาะสำหรับคู่คำสั่งเดิม/กำหนดเองที่ยังส่งเสียงโทรศัพท์ออกมา
- `chrome.audioBufferBytes: 4096`: บัฟเฟอร์ประมวลผล SoX สำหรับคำสั่งเสียงคู่คำสั่ง
  Chrome ที่สร้างขึ้น ค่านี้เป็นครึ่งหนึ่งของบัฟเฟอร์เริ่มต้น 8192 ไบต์ของ SoX
  เพื่อลดเวลาแฝงของไปป์เริ่มต้นและยังเหลือพื้นที่ให้เพิ่มได้บนโฮสต์ที่มีงานหนาแน่น
  ค่าที่ต่ำกว่าขั้นต่ำของ SoX จะถูกจำกัดไว้ที่ 17 ไบต์
- `chrome.audioInputCommand`: คำสั่ง SoX ที่อ่านจาก CoreAudio `BlackHole 2ch`
  และเขียนเสียงใน `chrome.audioFormat`
- `chrome.audioOutputCommand`: คำสั่ง SoX ที่อ่านเสียงใน `chrome.audioFormat`
  และเขียนไปยัง CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: คำสั่งไมโครโฟนภายในเครื่องที่ไม่บังคับ ซึ่งเขียน
  PCM โมโน signed 16-bit little-endian สำหรับตรวจจับการพูดแทรกของมนุษย์ขณะ
  การเล่นเสียงของผู้ช่วยทำงานอยู่ ขณะนี้ใช้กับบริดจ์คู่คำสั่ง `chrome` ที่โฮสต์โดย Gateway
- `chrome.bargeInRmsThreshold: 650`: ระดับ RMS ที่นับเป็นการขัดจังหวะของมนุษย์
  บน `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: ระดับพีคที่นับเป็นการขัดจังหวะของมนุษย์
  บน `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: หน่วงเวลาขั้นต่ำระหว่างการล้างการขัดจังหวะของมนุษย์ซ้ำ
- `mode: "agent"`: โหมดพูดตอบกลับเริ่มต้น คำพูดของผู้เข้าร่วมจะถูกถอดเสียงโดย
  ผู้ให้บริการถอดเสียงแบบเรียลไทม์ที่กำหนดค่าไว้ ส่งไปยังเอเจนต์ OpenClaw
  ที่กำหนดค่าไว้ในเซสชันเอเจนต์ย่อยต่อการประชุม และพูดตอบกลับผ่าน runtime
  TTS ปกติของ OpenClaw
- `mode: "bidi"`: โหมดสำรองโมเดลเรียลไทม์สองทิศทางโดยตรง ผู้ให้บริการเสียง
  เรียลไทม์ตอบคำพูดของผู้เข้าร่วมโดยตรง และอาจเรียก
  `openclaw_agent_consult` สำหรับคำตอบที่ลึกขึ้น/รองรับด้วยเครื่องมือ
- `mode: "transcribe"`: โหมดสังเกตการณ์เท่านั้นโดยไม่มีบริดจ์พูดตอบกลับ
- `realtime.provider: "openai"`: การสำรองความเข้ากันได้ที่ใช้เมื่อยังไม่ได้ตั้งค่า
  ช่องผู้ให้บริการแบบ scoped ด้านล่าง
- `realtime.transcriptionProvider: "openai"`: id ผู้ให้บริการที่โหมด `agent`
  ใช้สำหรับการถอดเสียงแบบเรียลไทม์
- `realtime.voiceProvider`: id ผู้ให้บริการที่โหมด `bidi` ใช้สำหรับเสียงเรียลไทม์โดยตรง
  ตั้งค่านี้เป็น `"google"` เพื่อใช้ Gemini Live โดยคงการถอดเสียงในโหมดเอเจนต์ไว้บน OpenAI
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: คำตอบพูดสั้น ๆ พร้อม
  `openclaw_agent_consult` สำหรับคำตอบที่ลึกขึ้น
- `realtime.introMessage`: การตรวจความพร้อมแบบพูดสั้น ๆ เมื่อบริดจ์เรียลไทม์
  เชื่อมต่อ; ตั้งเป็น `""` เพื่อเข้าร่วมแบบเงียบ
- `realtime.agentId`: id เอเจนต์ OpenClaw ที่ไม่บังคับสำหรับ
  `openclaw_agent_consult`; ค่าเริ่มต้นคือ `main`

การแทนที่ที่ไม่บังคับ:

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
  defaultMode: "agent",
  realtime: {
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        voice: "Kore",
      },
    },
  },
}
```

ElevenLabs สำหรับทั้งการฟังและการพูดในโหมดเอเจนต์:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

เสียง Meet แบบคงอยู่มาจาก
`messages.tts.providers.elevenlabs.voiceId` คำตอบของเอเจนต์ยังสามารถใช้
directive ต่อคำตอบ `[[tts:voiceId=... model=eleven_v3]]` ได้เมื่อเปิดใช้
การแทนที่โมเดล TTS แต่การกำหนดค่าเป็นค่าเริ่มต้นแบบกำหนดได้แน่นอนสำหรับการประชุม
เมื่อเข้าร่วม log ควรแสดง `transcriptionProvider=elevenlabs` และคำตอบที่พูดแต่ละครั้ง
ควร log `provider=elevenlabs model=eleven_v3 voice=<voiceId>`

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

`voiceCall.enabled` มีค่าเริ่มต้นเป็น `true`; เมื่อใช้ทรานสปอร์ต Twilio จะมอบหมาย
การโทร PSTN จริง, DTMF และคำทักทายบทนำให้กับ Voice Call Plugin Voice Call
เล่นลำดับ DTMF ก่อนเปิดสตรีมสื่อเรียลไทม์ จากนั้นใช้ข้อความบทนำที่บันทึกไว้เป็น
คำทักทายเรียลไทม์เริ่มต้น หากไม่ได้เปิดใช้ `voice-call` Google Meet ยังสามารถ
ตรวจสอบและบันทึกแผนการโทรได้ แต่ไม่สามารถวางสายโทร Twilio ได้

## เครื่องมือ

เอเจนต์สามารถใช้เครื่องมือ `google_meet` ได้:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

ใช้ `transport: "chrome"` เมื่อ Chrome ทำงานบนโฮสต์ Gateway ใช้
`transport: "chrome-node"` เมื่อ Chrome ทำงานบน Node ที่จับคู่ไว้ เช่น VM Parallels
ในทั้งสองกรณี ผู้ให้บริการโมเดลและ `openclaw_agent_consult` จะทำงานบนโฮสต์
Gateway ดังนั้นข้อมูลรับรองโมเดลจึงอยู่ที่นั่น เมื่อใช้ค่าเริ่มต้น `mode: "agent"`
ผู้ให้บริการถอดเสียงแบบเรียลไทม์จัดการการฟัง เอเจนต์ OpenClaw ที่กำหนดค่าไว้
สร้างคำตอบ และ TTS ปกติของ OpenClaw พูดเข้าไปใน Meet ใช้ `mode: "bidi"`
เมื่อคุณต้องการให้โมเดลเสียงเรียลไทม์ตอบโดยตรง
`mode: "realtime"` แบบดิบยังคงยอมรับในฐานะนามแฝงความเข้ากันได้เดิมสำหรับ
`mode: "agent"` แต่จะไม่ถูกโฆษณาใน schema เครื่องมือของเอเจนต์อีกต่อไป
log โหมดเอเจนต์มีผู้ให้บริการ/โมเดลถอดเสียงที่ resolve แล้วเมื่อบริดจ์เริ่มทำงาน
และผู้ให้บริการ TTS, โมเดล, เสียง, รูปแบบเอาต์พุต และอัตราสุ่มตัวอย่างหลังจาก
สังเคราะห์คำตอบแต่ละครั้ง

ใช้ `action: "status"` เพื่อแสดงเซสชันที่ใช้งานอยู่หรือตรวจสอบ session ID ใช้
`action: "speak"` พร้อม `sessionId` และ `message` เพื่อให้เอเจนต์เรียลไทม์
พูดทันที ใช้ `action: "test_speech"` เพื่อสร้างหรือใช้เซสชันซ้ำ ทริกเกอร์วลีที่รู้จัก
และส่งคืนสุขภาพ `inCall` เมื่อโฮสต์ Chrome รายงานได้ `test_speech` บังคับใช้
`mode: "agent"` เสมอ และล้มเหลวหากถูกขอให้รันใน `mode: "transcribe"` เพราะ
เซสชันสังเกตการณ์เท่านั้นตั้งใจไม่ให้ส่งเสียงออกได้ ผลลัพธ์ `speechOutputVerified`
อิงกับจำนวนไบต์เอาต์พุตเสียงเรียลไทม์ที่เพิ่มขึ้นระหว่างการเรียกทดสอบนี้ ดังนั้น
เซสชันที่ใช้ซ้ำซึ่งมีเสียงเก่าจะไม่นับเป็นการตรวจคำพูดที่สำเร็จใหม่ ใช้
`action: "leave"` เพื่อทำเครื่องหมายว่าเซสชันสิ้นสุดแล้ว

`status` มีสุขภาพ Chrome เมื่อพร้อมใช้งาน:

- `inCall`: Chrome ดูเหมือนอยู่ภายในสาย Meet
- `micMuted`: สถานะไมโครโฟน Meet แบบพยายามดีที่สุด
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: โปรไฟล์
  เบราว์เซอร์ต้องการการล็อกอินด้วยมือ การอนุญาตเข้าโดยโฮสต์ Meet สิทธิ์ หรือ
  การซ่อมแซมการควบคุมเบราว์เซอร์ก่อนที่เสียงพูดจะทำงานได้
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ว่าเสียงพูด
  Chrome ที่จัดการอยู่ได้รับอนุญาตตอนนี้หรือไม่ `speechReady: false` หมายความว่า
  OpenClaw ไม่ได้ส่งวลีบทนำ/ทดสอบเข้าไปในบริดจ์เสียง
- `providerConnected` / `realtimeReady`: สถานะบริดจ์เสียงเรียลไทม์
- `lastInputAt` / `lastOutputAt`: เสียงล่าสุดที่เห็นจากหรือส่งไปยังบริดจ์
- `audioOutputRouted` / `audioOutputDeviceLabel`: ว่าเอาต์พุตสื่อของแท็บ Meet
  ถูก route ไปยังอุปกรณ์ BlackHole ที่บริดจ์ใช้โดยตรงหรือไม่
- `lastSuppressedInputAt` / `suppressedInputBytes`: อินพุต local loopback ที่ถูกละเว้นขณะ
  การเล่นเสียงของผู้ช่วยทำงานอยู่

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## โหมด Agent และ Bidi

โหมด Chrome `agent` ปรับให้เหมาะกับพฤติกรรม "เอเจนต์ของฉันอยู่ในการประชุม"
ผู้ให้บริการถอดเสียงแบบเรียลไทม์ฟังเสียงการประชุม transcript สุดท้ายของผู้เข้าร่วม
จะถูกส่งผ่านเอเจนต์ OpenClaw ที่กำหนดค่าไว้ และคำตอบจะถูกพูดผ่าน runtime TTS
ปกติของ OpenClaw ตั้งค่า `mode: "bidi"` เมื่อคุณต้องการให้โมเดลเสียงเรียลไทม์ตอบโดยตรง
ชิ้นส่วน transcript สุดท้ายที่อยู่ใกล้กันจะถูกผสานก่อน consult เพื่อให้หนึ่งรอบการพูด
ไม่สร้างคำตอบ partial ที่ค้างอยู่หลายรายการ อินพุตเรียลไทม์ยังถูกระงับขณะเสียง
ผู้ช่วยที่อยู่ในคิวยังคงเล่นอยู่
และเสียงสะท้อน transcript ที่คล้ายผู้ช่วยเมื่อเร็ว ๆ นี้จะถูกละเว้นก่อน consult
เอเจนต์ เพื่อให้ local loopback ของ BlackHole ไม่ทำให้เอเจนต์ตอบคำพูดของตัวเอง

| โหมด    | ใครตัดสินคำตอบ        | เส้นทางเอาต์พุตเสียง                     | ใช้เมื่อ                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | เอเจนต์ OpenClaw ที่กำหนดค่าไว้ | runtime TTS ปกติของ OpenClaw            | คุณต้องการพฤติกรรม "เอเจนต์ของฉันอยู่ในการประชุม"        |
| `bidi`  | โมเดลเสียงเรียลไทม์      | การตอบกลับเสียงของผู้ให้บริการเสียงเรียลไทม์ | คุณต้องการลูปเสียงสนทนาที่มีเวลาแฝงต่ำที่สุด |

ในโหมด `bidi` เมื่อโมเดลเรียลไทม์ต้องการการให้เหตุผลที่ลึกขึ้น ข้อมูลปัจจุบัน
หรือเครื่องมือ OpenClaw ปกติ ก็สามารถเรียก `openclaw_agent_consult` ได้

เครื่องมือ consult เรียกใช้เอเจนต์ OpenClaw ปกติอยู่เบื้องหลังพร้อมบริบทบันทึกการประชุมล่าสุด และส่งคำตอบแบบพูดที่กระชับกลับมา ในโหมด `agent` OpenClaw จะส่งคำตอบนั้นไปยังรันไทม์ TTS โดยตรง ส่วนในโหมด `bidi` โมเดลเสียงแบบเรียลไทม์สามารถพูดผลลัพธ์ consult กลับเข้าไปในการประชุมได้ โดยใช้กลไก consult ร่วมเดียวกับ Voice Call

ตามค่าเริ่มต้น consult จะทำงานกับเอเจนต์ `main` ตั้งค่า `realtime.agentId` เมื่อเลน Meet ควร consult เวิร์กสเปซเอเจนต์ OpenClaw เฉพาะ ค่าเริ่มต้นของโมเดล นโยบายเครื่องมือ หน่วยความจำ และประวัติเซสชันเฉพาะ

consult ในโหมดเอเจนต์ใช้คีย์เซสชันต่อการประชุม `agent:<id>:subagent:google-meet:<session>` เพื่อให้คำถามติดตามผลยังคงบริบทการประชุมไว้ พร้อมสืบทอดนโยบายเอเจนต์ปกติจากเอเจนต์ที่กำหนดค่าไว้

`realtime.toolPolicy` ควบคุมการเรียกใช้งาน consult:

- `safe-read-only`: เปิดเผยเครื่องมือ consult และจำกัดเอเจนต์ปกติให้ใช้ `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ `memory_get`
- `owner`: เปิดเผยเครื่องมือ consult และให้เอเจนต์ปกติใช้นโยบายเครื่องมือเอเจนต์ปกติ
- `none`: ไม่เปิดเผยเครื่องมือ consult ให้โมเดลเสียงแบบเรียลไทม์

คีย์เซสชัน consult ถูกจำกัดขอบเขตต่อเซสชัน Meet ดังนั้นการเรียก consult ติดตามผลจึงสามารถนำบริบท consult ก่อนหน้ามาใช้ซ้ำระหว่างการประชุมเดียวกันได้

หากต้องการบังคับการตรวจสอบความพร้อมแบบพูดหลังจาก Chrome เข้าร่วมสายเรียบร้อยแล้ว:

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

ใช้ลำดับนี้ก่อนส่งมอบการประชุมให้เอเจนต์ที่ไม่มีผู้ดูแล:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

สถานะ Chrome-node ที่คาดไว้:

- `googlemeet setup` เป็นสีเขียวทั้งหมด
- `googlemeet setup` รวม `chrome-node-connected` เมื่อ Chrome-node เป็นทรานสปอร์ตเริ่มต้นหรือมีการตรึง Node ไว้
- `nodes status` แสดงว่า Node ที่เลือกเชื่อมต่ออยู่
- Node ที่เลือกประกาศทั้ง `googlemeet.chrome` และ `browser.proxy`
- แท็บ Meet เข้าร่วมสาย และ `test-speech` ส่งคืนสุขภาพ Chrome พร้อม `inCall: true`

สำหรับโฮสต์ Chrome ระยะไกล เช่น VM macOS ของ Parallels นี่คือการตรวจสอบที่ปลอดภัยและสั้นที่สุดหลังอัปเดต Gateway หรือ VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

สิ่งนี้พิสูจน์ว่า Plugin ของ Gateway ถูกโหลดแล้ว, Node ของ VM เชื่อมต่อด้วยโทเค็นปัจจุบัน และสะพานเสียง Meet พร้อมใช้งานก่อนที่เอเจนต์จะเปิดแท็บการประชุมจริง

สำหรับการทดสอบ smoke ของ Twilio ให้ใช้การประชุมที่เปิดเผยรายละเอียดการโทรเข้า:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

สถานะ Twilio ที่คาดไว้:

- `googlemeet setup` รวมการตรวจสอบ `twilio-voice-call-plugin`, `twilio-voice-call-credentials` และ `twilio-voice-call-webhook` ที่เป็นสีเขียว
- `voicecall` พร้อมใช้งานใน CLI หลังโหลด Gateway ใหม่
- เซสชันที่ส่งคืนมี `transport: "twilio"` และ `twilio.voiceCallId`
- `openclaw logs --follow` แสดงว่า DTMF TwiML ถูกให้บริการก่อน TwiML แบบเรียลไทม์ จากนั้นเป็นสะพานเรียลไทม์พร้อมคำทักทายเริ่มต้นที่ถูกเข้าคิวไว้
- `googlemeet leave <sessionId>` วางสายการโทรด้วยเสียงที่มอบหมายแล้ว

## การแก้ไขปัญหา

### เอเจนต์มองไม่เห็นเครื่องมือ Google Meet

ยืนยันว่า Plugin เปิดใช้งานอยู่ในการกำหนดค่า Gateway และโหลด Gateway ใหม่:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

หากคุณเพิ่งแก้ไข `plugins.entries.google-meet` ให้รีสตาร์ตหรือโหลด Gateway ใหม่ เอเจนต์ที่กำลังทำงานจะเห็นเฉพาะเครื่องมือ Plugin ที่ลงทะเบียนโดยกระบวนการ Gateway ปัจจุบันเท่านั้น

บนโฮสต์ Gateway ที่ไม่ใช่ macOS เครื่องมือ `google_meet` สำหรับเอเจนต์ยังคงมองเห็นได้ แต่การกระทำพูดกลับของ Chrome ในเครื่องจะถูกบล็อกก่อนถึงสะพานเสียง เสียงพูดกลับของ Chrome ในเครื่องในปัจจุบันขึ้นกับ `BlackHole 2ch` บน macOS ดังนั้นเอเจนต์ Linux ควรใช้ `mode: "transcribe"`, การโทรเข้า Twilio หรือโฮสต์ `chrome-node` บน macOS แทนเส้นทางเอเจนต์ Chrome ในเครื่องตามค่าเริ่มต้น

### ไม่มี Node ที่เชื่อมต่อและรองรับ Google Meet

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

Node ต้องเชื่อมต่ออยู่และแสดง `googlemeet.chrome` พร้อม `browser.proxy` การกำหนดค่า Gateway ต้องอนุญาตคำสั่ง Node เหล่านั้น:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

หาก `googlemeet setup` ล้มเหลวที่ `chrome-node-connected` หรือบันทึก Gateway รายงาน `gateway token mismatch` ให้ติดตั้งใหม่หรือรีสตาร์ต Node ด้วยโทเค็น Gateway ปัจจุบัน สำหรับ Gateway บน LAN โดยทั่วไปหมายถึง:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

จากนั้นโหลดบริการ Node ใหม่และรันอีกครั้ง:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### เบราว์เซอร์เปิดได้แต่เอเจนต์เข้าร่วมไม่ได้

รัน `googlemeet test-listen` สำหรับการเข้าร่วมแบบสังเกตเท่านั้น หรือ `googlemeet test-speech` สำหรับการเข้าร่วมแบบเรียลไทม์ จากนั้นตรวจสอบสุขภาพ Chrome ที่ส่งคืน หากโพรบใดรายงาน `manualActionRequired: true` ให้แสดง `manualActionMessage` แก่ผู้ปฏิบัติงานและหยุดลองซ้ำจนกว่าการกระทำในเบราว์เซอร์จะเสร็จสมบูรณ์

การกระทำด้วยตนเองที่พบบ่อย:

- ลงชื่อเข้าใช้โปรไฟล์ Chrome
- รับผู้เข้าร่วมแบบแขกจากบัญชีโฮสต์ Meet
- ให้สิทธิ์ไมโครโฟน/กล้องแก่ Chrome เมื่อพร้อมต์สิทธิ์แบบเนทีฟของ Chrome ปรากฏ
- ปิดหรือซ่อมแซมกล่องโต้ตอบสิทธิ์ Meet ที่ค้างอยู่

อย่ารายงานว่า "not signed in" เพียงเพราะ Meet แสดง "Do you want people to hear you in the meeting?" นั่นคือหน้าคั่นเลือกเสียงของ Meet; OpenClaw คลิก **Use microphone** ผ่านระบบอัตโนมัติของเบราว์เซอร์เมื่อพร้อมใช้งาน และรอต่อไปจนถึงสถานะการประชุมจริง สำหรับทางเลือกเบราว์เซอร์แบบสร้างอย่างเดียว OpenClaw อาจคลิก **Continue without microphone** เพราะการสร้าง URL ไม่ต้องใช้เส้นทางเสียงแบบเรียลไทม์

### สร้างการประชุมล้มเหลว

`googlemeet create` ใช้เอนด์พอยต์ `spaces.create` ของ Google Meet API ก่อนเมื่อกำหนดค่าข้อมูลรับรอง OAuth ไว้ หากไม่มีข้อมูลรับรอง OAuth จะถอยกลับไปใช้เบราว์เซอร์ของ Node Chrome ที่ตรึงไว้ ยืนยันว่า:

- สำหรับการสร้างผ่าน API: กำหนดค่า `oauth.clientId` และ `oauth.refreshToken` แล้ว หรือมีตัวแปรสภาพแวดล้อม `OPENCLAW_GOOGLE_MEET_*` ที่ตรงกัน
- สำหรับการสร้างผ่าน API: โทเค็นรีเฟรชถูกสร้างหลังจากเพิ่มการรองรับการสร้างแล้ว โทเค็นเก่าอาจไม่มีขอบเขต `meetings.space.created`; รัน `openclaw googlemeet auth login --json` อีกครั้งและอัปเดตการกำหนดค่า Plugin
- สำหรับทางเลือกเบราว์เซอร์: `defaultTransport: "chrome-node"` และ `chromeNode.node` ชี้ไปยัง Node ที่เชื่อมต่ออยู่พร้อม `browser.proxy` และ `googlemeet.chrome`
- สำหรับทางเลือกเบราว์เซอร์: โปรไฟล์ Chrome ของ OpenClaw บน Node นั้นลงชื่อเข้าใช้ Google แล้วและเปิด `https://meet.google.com/new` ได้
- สำหรับทางเลือกเบราว์เซอร์: การลองซ้ำจะนำแท็บ `https://meet.google.com/new` หรือแท็บพร้อมต์บัญชี Google ที่มีอยู่มาใช้ซ้ำก่อนเปิดแท็บใหม่ หากเอเจนต์หมดเวลา ให้ลองเรียกเครื่องมือซ้ำแทนการเปิดแท็บ Meet อีกแท็บด้วยตนเอง
- สำหรับทางเลือกเบราว์เซอร์: หากเครื่องมือส่งคืน `manualActionRequired: true` ให้ใช้ `browser.nodeId`, `browser.targetId`, `browserUrl` และ `manualActionMessage` ที่ส่งคืนเพื่อแนะนำผู้ปฏิบัติงาน อย่าลองซ้ำวนไปจนกว่าการกระทำนั้นจะเสร็จสมบูรณ์
- สำหรับทางเลือกเบราว์เซอร์: หาก Meet แสดง "Do you want people to hear you in the meeting?" ให้ปล่อยแท็บไว้ OpenClaw ควรคลิก **Use microphone** หรือสำหรับทางเลือกแบบสร้างอย่างเดียว คลิก **Continue without microphone** ผ่านระบบอัตโนมัติของเบราว์เซอร์และรอต่อไปจนได้ URL Meet ที่สร้างขึ้น หากทำไม่ได้ ข้อผิดพลาดควรกล่าวถึง `meet-audio-choice-required` ไม่ใช่ `google-login-required`

### เอเจนต์เข้าร่วมแล้วแต่ไม่พูด

ตรวจสอบเส้นทางเรียลไทม์:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

ใช้ `mode: "agent"` สำหรับเส้นทางพูดกลับปกติ STT -> เอเจนต์ OpenClaw -> TTS หรือ `mode: "bidi"` สำหรับทางเลือกเสียงเรียลไทม์โดยตรง `mode: "transcribe"` ตั้งใจไม่เริ่มสะพานพูดกลับ สำหรับการดีบักแบบสังเกตเท่านั้น ให้รัน `openclaw googlemeet status --json <session-id>` หลังผู้เข้าร่วมพูด และตรวจสอบ `captioning`, `transcriptLines` และ `lastCaptionText` หาก `inCall` เป็น true แต่ `transcriptLines` ค้างที่ `0` แคปชัน Meet อาจถูกปิดใช้งาน ยังไม่มีใครพูดตั้งแต่ติดตั้งตัวสังเกตการณ์ UI ของ Meet เปลี่ยนไป หรือแคปชันสดไม่พร้อมใช้งานสำหรับภาษา/บัญชีของการประชุม

`googlemeet test-speech` ตรวจสอบเส้นทางเรียลไทม์เสมอ และรายงานว่ามีการสังเกตไบต์เอาต์พุตของสะพานสำหรับการเรียกใช้นั้นหรือไม่ หาก `speechOutputVerified` เป็น false และ `speechOutputTimedOut` เป็น true ผู้ให้บริการเรียลไทม์อาจยอมรับถ้อยคำแล้ว แต่ OpenClaw ไม่เห็นไบต์เอาต์พุตใหม่ไปถึงสะพานเสียง Chrome

ตรวจสอบเพิ่มเติมว่า:

- คีย์ผู้ให้บริการเรียลไทม์พร้อมใช้งานบนโฮสต์ Gateway เช่น `OPENAI_API_KEY` หรือ `GEMINI_API_KEY`
- `BlackHole 2ch` มองเห็นได้บนโฮสต์ Chrome
- `sox` มีอยู่บนโฮสต์ Chrome
- ไมโครโฟนและลำโพง Meet ถูกกำหนดเส้นทางผ่านเส้นทางเสียงเสมือนที่ OpenClaw ใช้ `doctor` ควรแสดง `meet output routed: yes` สำหรับการเข้าร่วม Chrome ในเครื่องแบบเรียลไทม์

`googlemeet doctor [session-id]` พิมพ์เซสชัน, Node, สถานะในสาย, เหตุผลการกระทำด้วยตนเอง, การเชื่อมต่อผู้ให้บริการเรียลไทม์, `realtimeReady`, กิจกรรมอินพุต/เอาต์พุตเสียง, การประทับเวลาเสียงล่าสุด, ตัวนับไบต์ และ URL เบราว์เซอร์ ใช้ `googlemeet status [session-id] --json` เมื่อต้องการ JSON ดิบ ใช้ `googlemeet doctor --oauth` เมื่อต้องการตรวจสอบการรีเฟรช OAuth ของ Google Meet โดยไม่เปิดเผยโทเค็น; เพิ่ม `--meeting` หรือ `--create-space` เมื่อต้องการหลักฐาน Google Meet API ด้วย

หากเอเจนต์หมดเวลาและคุณเห็นว่าแท็บ Meet เปิดอยู่แล้ว ให้ตรวจสอบแท็บนั้นโดยไม่เปิดอีกแท็บ:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

การกระทำเครื่องมือที่เทียบเท่าคือ `recover_current_tab` โดยจะโฟกัสและตรวจสอบแท็บ Meet ที่มีอยู่สำหรับทรานสปอร์ตที่เลือก เมื่อใช้ `chrome` จะใช้การควบคุมเบราว์เซอร์ในเครื่องผ่าน Gateway; เมื่อใช้ `chrome-node` จะใช้ Node Chrome ที่กำหนดค่าไว้ คำสั่งนี้ไม่เปิดแท็บใหม่หรือสร้างเซสชันใหม่ แต่รายงานตัวขัดขวางปัจจุบัน เช่น สถานะการเข้าสู่ระบบ การรับเข้า สิทธิ์ หรือการเลือกเสียง คำสั่ง CLI คุยกับ Gateway ที่กำหนดค่าไว้ ดังนั้น Gateway ต้องกำลังทำงานอยู่; `chrome-node` ยังต้องให้ Node Chrome เชื่อมต่ออยู่ด้วย

### การตรวจสอบการตั้งค่า Twilio ล้มเหลว

`twilio-voice-call-plugin` ล้มเหลวเมื่อ `voice-call` ไม่ได้รับอนุญาตหรือไม่ได้เปิดใช้งาน เพิ่มลงใน `plugins.allow`, เปิดใช้งาน `plugins.entries.voice-call` และโหลด Gateway ใหม่

`twilio-voice-call-credentials` ล้มเหลวเมื่อแบ็กเอนด์ Twilio ไม่มี SID บัญชี โทเค็นยืนยันตัวตน หรือหมายเลขผู้โทร ตั้งค่าสิ่งเหล่านี้บนโฮสต์ Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` ล้มเหลวเมื่อ `voice-call` ไม่มีการเปิดเผย Webhook สาธารณะ หรือเมื่อ `publicUrl` ชี้ไปยัง local loopback หรือพื้นที่เครือข่ายส่วนตัว ตั้งค่า `plugins.entries.voice-call.config.publicUrl` เป็น URL ผู้ให้บริการสาธารณะ หรือกำหนดค่าทันเนล/การเปิดเผยผ่าน Tailscale สำหรับ `voice-call`

URL แบบ loopback และส่วนตัวไม่ถูกต้องสำหรับคอลแบ็กของผู้ให้บริการเครือข่าย อย่าใช้ `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` หรือ `fd00::/8` เป็น `publicUrl`

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

สำหรับการพัฒนาในเครื่อง ให้ใช้อุโมงค์หรือการเปิดเผยผ่าน Tailscale แทน URL
โฮสต์ส่วนตัว:

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

จากนั้นรีสตาร์ตหรือโหลด Gateway ใหม่ แล้วรัน:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

โดยค่าเริ่มต้น `voicecall smoke` ใช้เพื่อตรวจความพร้อมเท่านั้น หากต้องการ dry-run กับหมายเลขเฉพาะ:

```bash
openclaw voicecall smoke --to "+15555550123"
```

เพิ่ม `--yes` เฉพาะเมื่อคุณตั้งใจจะโทรแจ้งเตือนขาออกจริง:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### การโทร Twilio เริ่มแล้วแต่ไม่เคยเข้าสู่การประชุม

ยืนยันว่าอีเวนต์ Meet เปิดเผยรายละเอียดการโทรเข้า ส่งหมายเลขโทรเข้าและ PIN
ที่ตรงกัน หรือส่งลำดับ DTMF แบบกำหนดเอง:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

ใช้ `w` นำหน้าหรือคอมมาใน `--dtmf-sequence` หากผู้ให้บริการต้องการหยุดพัก
ก่อนป้อน PIN

หากสร้างสายโทรศัพท์แล้ว แต่รายชื่อผู้เข้าร่วมของ Meet ไม่เคยแสดงผู้เข้าร่วม
ที่โทรเข้า:

- รัน `openclaw googlemeet doctor <session-id>` เพื่อยืนยัน ID สาย Twilio
  ที่มอบหมาย ว่า DTMF ถูกเข้าคิวหรือไม่ และมีการขอคำทักทายเริ่มต้นหรือไม่
- รัน `openclaw voicecall status --call-id <id>` และยืนยันว่าสายยังทำงานอยู่
- รัน `openclaw voicecall tail` และตรวจว่า Webhook ของ Twilio มาถึง
  Gateway
- รัน `openclaw logs --follow` แล้วมองหาลำดับ Twilio Meet: Google
  Meet มอบหมายการเข้าร่วม, Voice Call เริ่มขาโทรศัพท์, Google Meet รอ
  `voiceCall.dtmfDelayMs`, ส่ง DTMF ด้วย `voicecall.dtmf`, รอ
  `voiceCall.postDtmfSpeechDelayMs`, จากนั้นขอเสียงแนะนำตัวด้วย
  `voicecall.speak`
- รัน `openclaw googlemeet setup --transport twilio` อีกครั้ง; การตรวจ setup
  ที่ผ่านเป็นสีเขียวเป็นสิ่งจำเป็น แต่ไม่ได้พิสูจน์ว่าลำดับ PIN ของการประชุมถูกต้อง
- ยืนยันว่าหมายเลขโทรเข้าเป็นของคำเชิญและภูมิภาค Meet เดียวกันกับ PIN
- เพิ่ม `voiceCall.dtmfDelayMs` หาก Meet รับสายช้าหรือบันทึกถอดเสียงของสายยังแสดงพรอมต์ที่ขอ PIN หลังจากส่ง DTMF แล้ว
- หากผู้เข้าร่วมเข้าร่วมแล้วแต่คุณไม่ได้ยินคำทักทาย ให้ตรวจ
  `openclaw logs --follow` สำหรับคำขอ `voicecall.speak` หลัง DTMF และ
  การเล่น TTS ผ่าน media-stream หรือ fallback `<Say>` ของ Twilio หากบันทึก
  ถอดเสียงของสายยังมีข้อความ "enter the meeting PIN" แสดงว่าขาโทรศัพท์ยังไม่ได้
  เข้าห้อง Meet ดังนั้นผู้เข้าร่วมประชุมจะไม่ได้ยินเสียงพูด

หาก Webhook ไม่มาถึง ให้ดีบัก Plugin Voice Call ก่อน: ผู้ให้บริการต้องเข้าถึง
`plugins.entries.voice-call.config.publicUrl` หรืออุโมงค์ที่กำหนดค่าไว้
ดู [การแก้ไขปัญหาการโทรด้วยเสียง](/th/plugins/voice-call#troubleshooting)

## หมายเหตุ

API สื่ออย่างเป็นทางการของ Google Meet มุ่งเน้นการรับ ดังนั้นการพูดเข้าไปในสาย
Meet ยังต้องมีเส้นทางผู้เข้าร่วม Plugin นี้ทำให้ขอบเขตนั้นมองเห็นได้:
Chrome จัดการการเข้าร่วมผ่านเบราว์เซอร์และการกำหนดเส้นทางเสียงในเครื่อง; Twilio
จัดการการเข้าร่วมโดยโทรศัพท์โทรเข้า

โหมด talk-back ของ Chrome ต้องใช้ `BlackHole 2ch` พร้อมอย่างใดอย่างหนึ่งต่อไปนี้:

- `chrome.audioInputCommand` พร้อม `chrome.audioOutputCommand`: OpenClaw เป็นเจ้าของ
  bridge และส่งผ่านเสียงใน `chrome.audioFormat` ระหว่างคำสั่งเหล่านั้นกับผู้ให้บริการ
  ที่เลือก โหมด Agent ใช้การถอดเสียงแบบเรียลไทม์พร้อม TTS ปกติ;
  โหมด bidi ใช้ผู้ให้บริการเสียงแบบเรียลไทม์ เส้นทาง Chrome เริ่มต้นคือ PCM16
  24 kHz พร้อม `chrome.audioBufferBytes: 4096`; G.711 mu-law 8 kHz ยังคง
  ใช้งานได้สำหรับคู่คำสั่งแบบเดิม
- `chrome.audioBridgeCommand`: คำสั่ง bridge ภายนอกเป็นเจ้าของเส้นทางเสียงในเครื่องทั้งหมด
  และต้องออกหลังจากเริ่มหรือยืนยัน daemon ของตน วิธีนี้ใช้ได้เฉพาะกับ `bidi`
  เพราะโหมด `agent` ต้องเข้าถึงคู่คำสั่งโดยตรงสำหรับ TTS

เมื่อ Agent เรียกเครื่องมือ `google_meet` ในโหมด Agent เซสชันที่ปรึกษาการประชุม
จะ fork บันทึกบทสนทนาปัจจุบันของผู้เรียกก่อนตอบเสียงผู้เข้าร่วม เซสชัน Meet
ยังคงแยกอยู่ (`agent:<agentId>:subagent:google-meet:<sessionId>`)
ดังนั้นการติดตามผลของการประชุมจะไม่แก้ไขบันทึกบทสนทนาของผู้เรียกโดยตรง

เพื่อให้ได้เสียงสองทางที่สะอาด ให้กำหนดเส้นทางเอาต์พุต Meet และไมโครโฟน Meet
ผ่านอุปกรณ์เสมือนแยกกันหรือกราฟอุปกรณ์เสมือนแบบ Loopback อุปกรณ์ BlackHole
ที่แชร์เพียงตัวเดียวอาจสะท้อนเสียงผู้เข้าร่วมคนอื่นกลับเข้าไปในสาย

เมื่อใช้ Chrome bridge แบบคู่คำสั่ง `chrome.bargeInInputCommand` สามารถฟัง
ไมโครโฟนในเครื่องแยกต่างหากและล้างการเล่นเสียงของผู้ช่วยเมื่อมนุษย์เริ่มพูด
วิธีนี้ทำให้เสียงพูดของมนุษย์มาก่อนเอาต์พุตของผู้ช่วย แม้อินพุต local loopback
ของ BlackHole ที่แชร์จะถูกระงับชั่วคราวระหว่างการเล่นเสียงของผู้ช่วยก็ตาม
เช่นเดียวกับ `chrome.audioInputCommand` และ `chrome.audioOutputCommand` คำสั่งนี้เป็น
คำสั่งในเครื่องที่ operator กำหนดค่าไว้ ใช้เส้นทางคำสั่งหรือรายการอาร์กิวเมนต์
ที่เชื่อถือได้อย่างชัดเจน และอย่าชี้ไปยังสคริปต์จากตำแหน่งที่ไม่น่าเชื่อถือ

`googlemeet speak` จะเรียก bridge เสียง talk-back ที่ทำงานอยู่สำหรับเซสชัน
Chrome `googlemeet leave` จะหยุด bridge นั้น สำหรับเซสชัน Twilio ที่มอบหมาย
ผ่าน Plugin Voice Call, `leave` จะวางสายเสียงพื้นฐานด้วย ใช้
`googlemeet end-active-conference` เมื่อคุณต้องการปิดการประชุม Google Meet
ที่ทำงานอยู่สำหรับพื้นที่ที่จัดการผ่าน API ด้วย

## ที่เกี่ยวข้อง

- [Plugin โทรด้วยเสียง](/th/plugins/voice-call)
- [โหมดพูดคุย](/th/nodes/talk)
- [การสร้าง Plugin](/th/plugins/building-plugins)
