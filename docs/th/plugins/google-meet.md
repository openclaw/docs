---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw เข้าร่วมการประชุม Google Meet
    - คุณต้องการให้เอเจนต์ OpenClaw สร้างการประชุม Google Meet ใหม่
    - คุณกำลังกำหนดค่า Chrome, Chrome node หรือ Twilio เป็นการรับส่งของ Google Meet
summary: 'Plugin Google Meet: เข้าร่วม URL ของ Meet ที่ระบุชัดเจนผ่าน Chrome หรือ Twilio พร้อมค่าเริ่มต้นเสียงแบบเรียลไทม์'
title: Plugin สำหรับ Google Meet
x-i18n:
    generated_at: "2026-05-04T02:25:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 77ab70d27d47bcc037144c7c6cfad6f93f307355b6ebcf3ee75c85b96a24af2f
    source_path: plugins/google-meet.md
    workflow: 16
---

การรองรับผู้เข้าร่วม Google Meet สำหรับ OpenClaw — Plugin จงใจออกแบบให้ชัดเจน:

- เข้าร่วมเฉพาะ URL `https://meet.google.com/...` ที่ระบุอย่างชัดเจนเท่านั้น
- สามารถสร้างพื้นที่ Meet ใหม่ผ่าน Google Meet API แล้วเข้าร่วม URL ที่ส่งกลับมา
- `realtime` voice เป็นโหมดเริ่มต้น
- Realtime voice สามารถเรียกกลับเข้าสู่ agent OpenClaw แบบเต็มได้เมื่อต้องใช้การให้เหตุผลที่ลึกขึ้นหรือเครื่องมือ
- Agents เลือกพฤติกรรมการเข้าร่วมด้วย `mode`: ใช้ `realtime` สำหรับการฟัง/พูดตอบกลับแบบสด หรือ `transcribe` เพื่อเข้าร่วม/ควบคุมเบราว์เซอร์โดยไม่มีสะพาน realtime voice
- การยืนยันตัวตนเริ่มต้นเป็น Google OAuth ส่วนบุคคลหรือโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้อยู่แล้ว
- ไม่มีการประกาศความยินยอมอัตโนมัติ
- แบ็กเอนด์เสียง Chrome เริ่มต้นคือ `BlackHole 2ch`
- Chrome สามารถทำงานในเครื่องหรือบนโฮสต์ Node ที่จับคู่ไว้
- Twilio รับหมายเลขโทรเข้า พร้อม PIN หรือชุด DTMF ที่เป็นตัวเลือกได้ แต่ไม่สามารถโทรไปยัง URL Meet ได้โดยตรง
- คำสั่ง CLI คือ `googlemeet`; `meet` สงวนไว้สำหรับเวิร์กโฟลว์การประชุมทางไกลของ agent ที่กว้างกว่า

## เริ่มต้นอย่างรวดเร็ว

ติดตั้ง dependency เสียงในเครื่องและกำหนดค่า provider realtime voice แบ็กเอนด์ OpenAI เป็นค่าเริ่มต้น; Google Gemini Live ก็ใช้งานได้กับ
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` ติดตั้งอุปกรณ์เสียงเสมือน `BlackHole 2ch` ตัวติดตั้งของ Homebrew
ต้องรีบูตก่อนที่ macOS จะเปิดเผยอุปกรณ์:

```bash
sudo reboot
```

หลังรีบูต ให้ตรวจสอบทั้งสองส่วน:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
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

เอาต์พุตการตั้งค่ามีไว้ให้อ่านได้โดย agent และรับรู้โหมด รายงานโปรไฟล์ Chrome,
การปักหมุด Node และสำหรับการเข้าร่วม Chrome แบบ realtime จะรายงานสะพานเสียง
BlackHole/SoX และการตรวจ intro realtime ที่หน่วงเวลาไว้ สำหรับการเข้าร่วมแบบดูอย่างเดียว ให้ตรวจ transport เดียวกันด้วย `--mode transcribe`; โหมดนั้นข้ามข้อกำหนดเบื้องต้นของเสียง realtime
เพราะไม่ได้ฟังผ่านหรือพูดผ่านสะพาน:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

เมื่อกำหนดค่า delegation ของ Twilio แล้ว การตั้งค่ายังรายงานด้วยว่า Plugin
`voice-call`, credential ของ Twilio และการเปิดเผย Webhook สาธารณะพร้อมหรือไม่
ให้ถือว่าเช็กใดๆ ที่เป็น `ok: false` เป็นตัวบล็อกสำหรับ transport และโหมดที่ตรวจ
ก่อนขอให้ agent เข้าร่วม ใช้ `openclaw googlemeet setup --json` สำหรับ
สคริปต์หรือเอาต์พุตที่เครื่องอ่านได้ ใช้ `--transport chrome`,
`--transport chrome-node` หรือ `--transport twilio` เพื่อ preflight transport เฉพาะ
ก่อนที่ agent จะลองใช้

สำหรับ Twilio ให้ preflight transport อย่างชัดเจนเสมอเมื่อ transport เริ่มต้น
เป็น Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

การทำเช่นนั้นจะจับ wiring ของ `voice-call` ที่หายไป, credential ของ Twilio หรือ
การเปิดเผย Webhook ที่เข้าถึงไม่ได้ ก่อนที่ agent จะพยายามโทรเข้าการประชุม

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
  "mode": "agent"
}
```

เครื่องมือ `google_meet` สำหรับ agent ยังคงพร้อมใช้งานบนโฮสต์ที่ไม่ใช่ macOS สำหรับ
โฟลว์ artifact, calendar, setup, transcribe, Twilio และ `chrome-node` การกระทำ
พูดตอบกลับด้วย Chrome ในเครื่องจะถูกบล็อกบนโฮสต์เหล่านั้น เพราะเส้นทางเสียง Chrome ที่บันเดิลอยู่
ตอนนี้ขึ้นกับ `BlackHole 2ch` ของ macOS บน Linux ให้ใช้ `mode: "transcribe"`,
การโทรเข้า Twilio หรือโฮสต์ `chrome-node` บน macOS สำหรับการเข้าร่วม Chrome แบบพูดตอบกลับ

สร้างการประชุมใหม่และเข้าร่วม:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

สำหรับห้องที่สร้างด้วย API ให้ใช้ Google Meet `SpaceConfig.accessType` เมื่อต้องการ
ให้นโยบายไม่ต้องเคาะของห้องชัดเจน แทนที่จะสืบทอดจากค่าเริ่มต้นของบัญชี Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` อนุญาตให้ทุกคนที่มี URL Meet เข้าร่วมได้โดยไม่ต้องเคาะ `TRUSTED` อนุญาตให้
ผู้ใช้ที่เชื่อถือได้ขององค์กรโฮสต์ ผู้ใช้ภายนอกที่ได้รับเชิญ และผู้ใช้ที่โทรเข้า
เข้าร่วมได้โดยไม่ต้องเคาะ `RESTRICTED` จำกัดการเข้าที่ไม่ต้องเคาะไว้เฉพาะผู้ได้รับเชิญ การตั้งค่าเหล่านี้
ใช้กับเส้นทางการสร้างผ่าน Google Meet API อย่างเป็นทางการเท่านั้น ดังนั้นต้องกำหนดค่า
credential OAuth

หากคุณยืนยันตัวตน Google Meet ก่อนที่ตัวเลือกนี้จะพร้อมใช้งาน ให้รัน
`openclaw googlemeet auth login --json` อีกครั้งหลังเพิ่ม scope
`meetings.space.settings` ลงในหน้าจอความยินยอม Google OAuth ของคุณ

สร้างเฉพาะ URL โดยไม่เข้าร่วม:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` มีสองเส้นทาง:

- สร้างด้วย API: ใช้เมื่อมีการกำหนดค่า credential Google Meet OAuth นี่คือ
  เส้นทางที่กำหนดผลได้แน่นอนที่สุดและไม่ขึ้นกับสถานะ UI ของเบราว์เซอร์
- fallback ของเบราว์เซอร์: ใช้เมื่อไม่มี credential OAuth OpenClaw ใช้ Node Chrome
  ที่ปักหมุดไว้ เปิด `https://meet.google.com/new` รอให้ Google
  redirect ไปยัง URL โค้ดการประชุมจริง แล้วส่ง URL นั้นกลับ เส้นทางนี้ต้องการ
  ให้โปรไฟล์ Chrome ของ OpenClaw บน Node ลงชื่อเข้าใช้ Google อยู่แล้ว
  ระบบอัตโนมัติของเบราว์เซอร์จัดการพรอมป์ไมโครโฟนครั้งแรกของ Meet เอง; พรอมป์นั้น
  ไม่ถือเป็นความล้มเหลวในการเข้าสู่ระบบ Google
  โฟลว์ join และ create ยังพยายามใช้แท็บ Meet ที่มีอยู่ซ้ำก่อนเปิดแท็บใหม่ด้วย
  การจับคู่จะไม่สนใจ query string ของ URL ที่ไม่เป็นอันตราย เช่น `authuser` ดังนั้น
  การลองใหม่ของ agent ควรโฟกัสการประชุมที่เปิดอยู่แล้ว แทนที่จะสร้างแท็บ Chrome ที่สอง

เอาต์พุตของคำสั่ง/เครื่องมือมีฟิลด์ `source` (`api` หรือ `browser`) เพื่อให้ agents
อธิบายได้ว่าใช้เส้นทางใด `create` จะเข้าร่วมการประชุมใหม่โดยค่าเริ่มต้นและ
ส่งกลับ `joined: true` พร้อม session การเข้าร่วม หากต้องการสร้างเฉพาะ URL ให้ใช้
`create --no-join` ใน CLI หรือส่ง `"join": false` ไปยังเครื่องมือ

หรือบอก agent ว่า: "Create a Google Meet, join it with realtime voice, and send
me the link." agent ควรเรียก `google_meet` ด้วย `action: "create"` แล้ว
แชร์ `meetingUri` ที่ส่งกลับมา

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

สำหรับการเข้าร่วมแบบดูอย่างเดียว/ควบคุมเบราว์เซอร์ ให้ตั้งค่า `"mode": "transcribe"` โหมดนั้น
จะไม่เริ่มสะพาน realtime voice แบบสองทาง ไม่ต้องใช้ BlackHole หรือ SoX
และจะไม่พูดตอบกลับเข้าไปในการประชุม การเข้าร่วม Chrome ในโหมดนี้ยังหลีกเลี่ยง
การให้สิทธิ์ไมโครโฟน/กล้องของ OpenClaw และหลีกเลี่ยงเส้นทาง **Use
microphone** ของ Meet หาก Meet แสดง interstitial สำหรับเลือกเสียง ระบบอัตโนมัติจะพยายาม
ใช้เส้นทางไม่มีไมโครโฟน และมิฉะนั้นจะรายงานการกระทำด้วยตนเองแทนการเปิด
ไมโครโฟนในเครื่อง ในโหมด transcribe, transport Chrome ที่จัดการแล้วยังติดตั้ง
ตัวสังเกตคำบรรยาย Meet แบบ best-effort ด้วย `googlemeet status --json` และ
`googlemeet doctor` แสดง `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
และ tail `recentTranscript` แบบสั้น เพื่อให้ operators ทราบได้ว่าเบราว์เซอร์
เข้าร่วมสายแล้วหรือไม่ และคำบรรยาย Meet กำลังสร้างข้อความหรือไม่
ใช้ `openclaw googlemeet test-listen <meet-url> --transport chrome-node` เมื่อ
คุณต้องการ probe แบบใช่/ไม่ใช่: คำสั่งนี้เข้าร่วมในโหมด transcribe รอการเคลื่อนไหวของคำบรรยายหรือ
transcript ใหม่ และส่งกลับ `listenVerified`, `listenTimedOut`, ฟิลด์การกระทำด้วยตนเอง
และสถานะคำบรรยายล่าสุด

ระหว่าง session realtime, สถานะ `google_meet` มีสุขภาพของเบราว์เซอร์และสะพานเสียง
เช่น `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamp อินพุต/เอาต์พุตล่าสุด,
ตัวนับไบต์ และสถานะสะพานปิด หากพรอมป์หน้า Meet ที่ปลอดภัย
ปรากฏขึ้น ระบบอัตโนมัติของเบราว์เซอร์จะจัดการเมื่อทำได้ การเข้าสู่ระบบ การอนุญาตจากโฮสต์ และ
พรอมป์สิทธิ์ของเบราว์เซอร์/OS จะถูกรายงานเป็นการกระทำด้วยตนเองพร้อมเหตุผลและ
ข้อความให้ agent ถ่ายทอด Managed Chrome sessions จะปล่อย intro หรือ
วลีทดสอบหลังจากสุขภาพของเบราว์เซอร์รายงาน `inCall: true` เท่านั้น; มิฉะนั้นสถานะจะรายงาน
`speechReady: false` และความพยายามพูดจะถูกบล็อก แทนที่จะแกล้งว่า
agent พูดเข้าไปในการประชุมแล้ว

การเข้าร่วม Chrome ในเครื่องใช้โปรไฟล์เบราว์เซอร์ OpenClaw ที่ลงชื่อเข้าใช้แล้ว โหมด Realtime
ต้องใช้ `BlackHole 2ch` สำหรับเส้นทางไมโครโฟน/ลำโพงที่ OpenClaw ใช้ สำหรับ
เสียงสองทางที่สะอาด ให้ใช้อุปกรณ์เสมือนแยกกันหรือกราฟแบบ Loopback; อุปกรณ์
BlackHole เดียวเพียงพอสำหรับ smoke test แรก แต่อาจเกิดเสียงสะท้อน

### Gateway ในเครื่อง + Parallels Chrome

คุณ **ไม่** จำเป็นต้องมี OpenClaw Gateway เต็มรูปแบบหรือคีย์ model API ภายใน macOS VM
เพียงเพื่อให้ VM เป็นเจ้าของ Chrome ให้รัน Gateway และ agent ในเครื่อง แล้วรัน
โฮสต์ Node ใน VM เปิดใช้งาน Plugin ที่บันเดิลมากับ VM หนึ่งครั้ง เพื่อให้ Node
ประกาศคำสั่ง Chrome:

สิ่งที่รันอยู่ที่ไหน:

- โฮสต์ Gateway: OpenClaw Gateway, workspace ของ agent, คีย์ model/API, provider realtime
  และ config ของ Plugin Google Meet
- Parallels macOS VM: OpenClaw CLI/โฮสต์ Node, Google Chrome, SoX, BlackHole 2ch,
  และโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้ Google
- ไม่จำเป็นใน VM: บริการ Gateway, config ของ agent, คีย์ OpenAI/GPT หรือการตั้งค่า
  provider model

ติดตั้ง dependency ของ VM:

```bash
brew install blackhole-2ch sox
```

รีบูต VM หลังติดตั้ง BlackHole เพื่อให้ macOS เปิดเผย `BlackHole 2ch`:

```bash
sudo reboot
```

หลังรีบูต ให้ตรวจสอบว่า VM เห็นอุปกรณ์เสียงและคำสั่ง SoX ได้:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

ติดตั้งหรืออัปเดต OpenClaw ใน VM แล้วเปิดใช้งาน Plugin ที่บันเดิลไว้ที่นั่น:

```bash
openclaw plugins enable google-meet
```

เริ่มโฮสต์ Node ใน VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

หาก `<gateway-host>` เป็น IP บน LAN และคุณไม่ได้ใช้ TLS, Node จะปฏิเสธ
WebSocket plaintext เว้นแต่คุณจะ opt in สำหรับเครือข่ายส่วนตัวที่เชื่อถือได้นั้น:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` เป็น process environment ไม่ใช่การตั้งค่า
`openclaw.json` `openclaw node install` จะจัดเก็บไว้ใน environment ของ LaunchAgent
เมื่อมีอยู่ในคำสั่งติดตั้ง

อนุมัติ Node จากโฮสต์ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

ยืนยันว่า Gateway เห็น Node และ Node ประกาศทั้ง `googlemeet.chrome`
และ capability ของเบราว์เซอร์/`browser.proxy`:

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

หรือขอให้ agent ใช้เครื่องมือ `google_meet` พร้อม `transport: "chrome-node"`

สำหรับ smoke test แบบคำสั่งเดียวที่สร้างหรือใช้ session ซ้ำ พูดวลีที่รู้ล่วงหน้า
และพิมพ์สุขภาพ session:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

ระหว่างการเข้าร่วมแบบเรียลไทม์ ระบบอัตโนมัติของเบราว์เซอร์ OpenClaw จะกรอกชื่อผู้เข้าร่วม กด
เข้าร่วม/ขอเข้าร่วม และยอมรับตัวเลือก "ใช้ไมโครโฟน" เมื่อใช้งาน Meet ครั้งแรก หาก
พรอมป์นั้นปรากฏขึ้น ระหว่างการเข้าร่วมแบบสังเกตการณ์อย่างเดียวหรือการสร้างการประชุมผ่านเบราว์เซอร์เท่านั้น ระบบจะ
ดำเนินการผ่านพรอมป์เดียวกันต่อไปโดยไม่ใช้ไมโครโฟน เมื่อมีตัวเลือกนั้นให้ใช้
หากโปรไฟล์เบราว์เซอร์ยังไม่ได้ลงชื่อเข้าใช้, Meet กำลังรอการอนุมัติจากโฮสต์,
Chrome ต้องการสิทธิ์ไมโครโฟน/กล้องสำหรับการเข้าร่วมแบบเรียลไทม์ หรือ Meet ค้างอยู่
ที่พรอมป์ซึ่งระบบอัตโนมัติแก้ไขไม่ได้ ผลลัพธ์ join/test-speech จะรายงาน
`manualActionRequired: true` พร้อม `manualActionReason` และ
`manualActionMessage` เอเจนต์ควรหยุดลองเข้าร่วมซ้ำ รายงานข้อความที่ตรงนั้น
พร้อม `browserUrl`/`browserTitle` ปัจจุบัน และลองใหม่เฉพาะหลังจาก
ดำเนินการด้วยตนเองในเบราว์เซอร์เสร็จแล้วเท่านั้น

หากละเว้น `chromeNode.node` OpenClaw จะเลือกอัตโนมัติเฉพาะเมื่อมี Node ที่เชื่อมต่ออยู่
เพียงหนึ่ง Node ที่ประกาศทั้ง `googlemeet.chrome` และการควบคุมเบราว์เซอร์ หาก
มี Node ที่รองรับหลาย Node เชื่อมต่ออยู่ ให้ตั้งค่า `chromeNode.node` เป็นรหัส Node,
ชื่อที่แสดง หรือ IP ระยะไกล

การตรวจสอบความล้มเหลวที่พบบ่อย:

- `Configured Google Meet node ... is not usable: offline`: Node ที่ปักหมุดไว้เป็น
  ที่รู้จักของ Gateway แต่ไม่พร้อมใช้งาน เอเจนต์ควรถือว่า Node นั้นเป็น
  สถานะวินิจฉัย ไม่ใช่โฮสต์ Chrome ที่ใช้ได้ และรายงานตัวบล็อกการตั้งค่า
  แทนที่จะถอยกลับไปใช้ทรานสปอร์ตอื่น เว้นแต่ผู้ใช้จะขอให้ทำเช่นนั้น
- `No connected Google Meet-capable node`: เริ่ม `openclaw node run` ใน VM,
  อนุมัติการจับคู่ และตรวจสอบให้แน่ใจว่าได้รัน `openclaw plugins enable google-meet` และ
  `openclaw plugins enable browser` ใน VM แล้ว ยืนยันด้วยว่า
  โฮสต์ Gateway อนุญาตคำสั่ง Node ทั้งสองรายการด้วย
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`
- `BlackHole 2ch audio device not found`: ติดตั้ง `blackhole-2ch` บนโฮสต์
  ที่กำลังตรวจสอบและรีบูตก่อนใช้เสียง Chrome ภายในเครื่อง
- `BlackHole 2ch audio device not found on the node`: ติดตั้ง `blackhole-2ch`
  ใน VM และรีบูต VM
- Chrome เปิดขึ้นแต่เข้าร่วมไม่ได้: ลงชื่อเข้าใช้โปรไฟล์เบราว์เซอร์ภายใน VM หรือ
  คงค่า `chrome.guestName` ไว้สำหรับการเข้าร่วมแบบแขก การเข้าร่วมอัตโนมัติแบบแขกใช้ระบบอัตโนมัติ
  ของเบราว์เซอร์ OpenClaw ผ่านพร็อกซีเบราว์เซอร์ของ Node ตรวจสอบให้แน่ใจว่าคอนฟิกเบราว์เซอร์
  ของ Node ชี้ไปยังโปรไฟล์ที่คุณต้องการ เช่น
  `browser.defaultProfile: "user"` หรือโปรไฟล์เซสชันที่มีอยู่และตั้งชื่อไว้
- แท็บ Meet ซ้ำ: เปิดใช้ `chrome.reuseExistingTab: true` ไว้ OpenClaw
  จะเปิดใช้งานแท็บที่มีอยู่สำหรับ URL Meet เดียวกันก่อนเปิดแท็บใหม่ และ
  การสร้างการประชุมผ่านเบราว์เซอร์จะใช้แท็บ `https://meet.google.com/new`
  ที่กำลังดำเนินอยู่หรือแท็บพรอมป์บัญชี Google ก่อนเปิดอีกแท็บหนึ่ง
- ไม่มีเสียง: ใน Meet ให้กำหนดเส้นทางเสียงไมโครโฟน/ลำโพงผ่านเส้นทางอุปกรณ์เสียงเสมือน
  ที่ OpenClaw ใช้ ใช้อุปกรณ์เสมือนแยกกันหรือการกำหนดเส้นทางแบบ Loopback
  เพื่อเสียงสองทิศทางที่สะอาด

## หมายเหตุการติดตั้ง

ค่าเริ่มต้นของการตอบกลับเสียง Chrome ใช้เครื่องมือภายนอกสองรายการ:

- `sox`: ยูทิลิตีเสียงแบบบรรทัดคำสั่ง Plugin ใช้คำสั่งอุปกรณ์ CoreAudio
  อย่างชัดเจนสำหรับบริดจ์เสียง PCM16 24 kHz เริ่มต้น
- `blackhole-2ch`: ไดรเวอร์เสียงเสมือนของ macOS สร้างอุปกรณ์เสียง `BlackHole 2ch`
  ที่ Chrome/Meet สามารถกำหนดเส้นทางผ่านได้

OpenClaw ไม่ได้รวมแพ็กเกจใดแพ็กเกจหนึ่งไว้หรือแจกจ่ายต่อ เอกสารขอให้ผู้ใช้
ติดตั้งเป็น dependency ของโฮสต์ผ่าน Homebrew SoX อยู่ภายใต้สัญญาอนุญาต
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole เป็น GPL-3.0 หากคุณสร้าง
ตัวติดตั้งหรือแอปพลายแอนซ์ที่รวม BlackHole กับ OpenClaw ให้ตรวจสอบข้อกำหนดสัญญาอนุญาต
ต้นทางของ BlackHole หรือขอใบอนุญาตแยกต่างหากจาก Existential Audio

## ทรานสปอร์ต

### Chrome

ทรานสปอร์ต Chrome เปิด URL Meet ผ่านการควบคุมเบราว์เซอร์ของ OpenClaw และเข้าร่วม
ในฐานะโปรไฟล์เบราว์เซอร์ OpenClaw ที่ลงชื่อเข้าใช้แล้ว บน macOS, Plugin จะตรวจสอบ
`BlackHole 2ch` ก่อนเปิดใช้งาน หากมีการคอนฟิกไว้ ระบบจะรันคำสั่งตรวจสุขภาพบริดจ์เสียง
และคำสั่งเริ่มต้นก่อนเปิด Chrome ด้วย ใช้ `chrome` เมื่อ
Chrome/เสียงอยู่บนโฮสต์ Gateway; ใช้ `chrome-node` เมื่อ Chrome/เสียงอยู่
บน Node ที่จับคู่ไว้ เช่น Parallels macOS VM สำหรับ Chrome ภายในเครื่อง ให้เลือก
โปรไฟล์ด้วย `browser.defaultProfile`; `chrome.browserProfile` จะถูกส่งไปยัง
โฮสต์ `chrome-node`

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

กำหนดเส้นทางเสียงไมโครโฟนและลำโพงของ Chrome ผ่านบริดจ์เสียง OpenClaw ภายในเครื่อง
หากไม่ได้ติดตั้ง `BlackHole 2ch` การเข้าร่วมจะล้มเหลวพร้อมข้อผิดพลาดการตั้งค่า
แทนที่จะเข้าร่วมแบบเงียบ ๆ โดยไม่มีเส้นทางเสียง

### Twilio

ทรานสปอร์ต Twilio เป็นแผนการโทรที่เข้มงวดซึ่งมอบหมายให้ Voice Call Plugin
ไม่ได้แยกวิเคราะห์หน้า Meet เพื่อหาหมายเลขโทรศัพท์

ใช้ตัวเลือกนี้เมื่อไม่สามารถเข้าร่วมผ่าน Chrome ได้ หรือคุณต้องการตัวเลือกสำรอง
แบบโทรเข้า Google Meet ต้องเปิดเผยหมายเลขโทรเข้าและ PIN สำหรับ
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

ให้ข้อมูลรับรอง Twilio ผ่านสภาพแวดล้อมหรือคอนฟิก สภาพแวดล้อมช่วยเก็บความลับ
ไม่ให้ไปอยู่ใน `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

รีสตาร์ทหรือโหลด Gateway ใหม่หลังเปิดใช้ `voice-call`; การเปลี่ยนแปลงคอนฟิก Plugin
จะไม่ปรากฏในกระบวนการ Gateway ที่กำลังรันอยู่จนกว่าจะโหลดใหม่

จากนั้นตรวจสอบ:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

เมื่อเชื่อมต่อการมอบหมาย Twilio แล้ว `googlemeet setup` จะมีการตรวจสอบ
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

OAuth เป็นทางเลือกสำหรับการสร้างลิงก์ Meet เพราะ `googlemeet create` สามารถถอยกลับ
ไปใช้ระบบอัตโนมัติของเบราว์เซอร์ได้ คอนฟิก OAuth เมื่อคุณต้องการการสร้างผ่าน API ทางการ,
การระบุพื้นที่ หรือการตรวจ preflight ของ Meet Media API

การเข้าถึง Google Meet API ใช้ OAuth ของผู้ใช้: สร้างไคลเอนต์ Google Cloud OAuth,
ขอ scope ที่จำเป็น อนุญาตบัญชี Google จากนั้นเก็บ
refresh token ที่ได้ไว้ในคอนฟิก Google Meet Plugin หรือระบุ
ตัวแปรสภาพแวดล้อม `OPENCLAW_GOOGLE_MEET_*`

OAuth ไม่ได้แทนที่เส้นทางเข้าร่วมผ่าน Chrome ทรานสปอร์ต Chrome และ Chrome-node
ยังคงเข้าร่วมผ่านโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้แล้ว, BlackHole/SoX และ Node ที่เชื่อมต่อ
เมื่อคุณใช้การเข้าร่วมผ่านเบราว์เซอร์ OAuth ใช้เฉพาะกับเส้นทาง Google
Meet API ทางการ: สร้างพื้นที่การประชุม, ระบุพื้นที่ และรันการตรวจ preflight
ของ Meet Media API

### สร้างข้อมูลรับรอง Google

ใน Google Cloud Console:

1. สร้างหรือเลือกโปรเจกต์ Google Cloud
2. เปิดใช้ **Google Meet REST API** สำหรับโปรเจกต์นั้น
3. คอนฟิกหน้าจอความยินยอม OAuth
   - **Internal** ง่ายที่สุดสำหรับองค์กร Google Workspace
   - **External** ใช้ได้กับการตั้งค่าส่วนตัว/ทดสอบ ขณะที่แอปอยู่ในสถานะ Testing
     ให้เพิ่มบัญชี Google แต่ละบัญชีที่จะอนุญาตแอปเป็นผู้ใช้ทดสอบ
4. เพิ่ม scope ที่ OpenClaw ขอ:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. สร้าง OAuth client ID
   - ประเภทแอปพลิเคชัน: **Web application**
   - URI เปลี่ยนเส้นทางที่อนุญาต:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. คัดลอก client ID และ client secret

`meetings.space.created` จำเป็นสำหรับ Google Meet `spaces.create`
`meetings.space.readonly` ช่วยให้ OpenClaw ระบุ URL/รหัส Meet ไปยังพื้นที่ได้
`meetings.space.settings` ช่วยให้ OpenClaw ส่งการตั้งค่า `SpaceConfig` เช่น
`accessType` ระหว่างการสร้างห้องผ่าน API
`meetings.conference.media.readonly` ใช้สำหรับ preflight ของ Meet Media API และงานสื่อ
Google อาจต้องการการลงทะเบียน Developer Preview สำหรับการใช้งาน Media API จริง
หากคุณต้องการเพียงการเข้าร่วมผ่าน Chrome บนเบราว์เซอร์ ให้ข้าม OAuth ทั้งหมด

### ออก refresh token

คอนฟิก `oauth.clientId` และเลือกคอนฟิก `oauth.clientSecret` หรือส่งผ่านเป็น
ตัวแปรสภาพแวดล้อม จากนั้นรัน:

```bash
openclaw googlemeet auth login --json
```

คำสั่งจะพิมพ์บล็อกคอนฟิก `oauth` พร้อม refresh token โดยใช้ PKCE,
คอลแบ็ก localhost ที่ `http://localhost:8085/oauth2callback` และโฟลว์
คัดลอก/วางด้วยตนเองเมื่อใช้ `--manual`

ตัวอย่าง:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

ใช้โหมดด้วยตนเองเมื่อเบราว์เซอร์เข้าถึงคอลแบ็กภายในเครื่องไม่ได้:

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

เก็บอ็อบเจ็กต์ `oauth` ไว้ใต้คอนฟิก Google Meet Plugin:

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
หากมีทั้งค่าคอนฟิกและค่าสภาพแวดล้อม Plugin จะใช้คอนฟิกก่อน
แล้วจึงใช้ค่าสภาพแวดล้อมเป็น fallback

ความยินยอม OAuth รวมการสร้างพื้นที่ Meet, สิทธิ์อ่านพื้นที่ Meet และสิทธิ์อ่านสื่อ
การประชุม Meet หากคุณยืนยันตัวตนก่อนที่การรองรับการสร้างการประชุมจะมีอยู่
ให้รัน `openclaw googlemeet auth login --json` ใหม่ เพื่อให้ refresh token
มี scope `meetings.space.created`

### ตรวจสอบ OAuth ด้วย doctor

รัน OAuth doctor เมื่อคุณต้องการตรวจสุขภาพที่รวดเร็วและไม่เปิดเผยความลับ:

```bash
openclaw googlemeet doctor --oauth --json
```

คำสั่งนี้จะไม่โหลดรันไทม์ Chrome หรือจำเป็นต้องมี Node Chrome ที่เชื่อมต่ออยู่
จะตรวจว่ามีคอนฟิก OAuth และ refresh token สามารถออก access
token ได้ รายงาน JSON มีเฉพาะฟิลด์สถานะ เช่น `ok`, `configured`,
`tokenSource`, `expiresAt` และข้อความตรวจสอบ; จะไม่พิมพ์ access
token, refresh token หรือ client secret

ผลลัพธ์ที่พบบ่อย:

| การตรวจสอบ           | ความหมาย                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | มี `oauth.clientId` พร้อม `oauth.refreshToken` หรือ access token ที่แคชไว้       |
| `oauth-token`        | access token ที่แคชไว้ยังใช้ได้ หรือ refresh token ออก access token ใหม่ |
| `meet-spaces-get`    | การตรวจสอบ `--meeting` ที่เป็นทางเลือกระบุพื้นที่ Meet ที่มีอยู่ได้                             |
| `meet-spaces-create` | การตรวจสอบ `--create-space` ที่เป็นทางเลือกสร้างพื้นที่ Meet ใหม่                               |

เพื่อพิสูจน์การเปิดใช้ Google Meet API และ scope `spaces.create` ด้วย ให้รัน
การตรวจสร้างที่มีผลข้างเคียง:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` จะสร้าง URL Meet ชั่วคราวที่ทิ้งได้ ใช้เมื่อต้องการยืนยันว่าโปรเจกต์ Google Cloud เปิดใช้ Meet API แล้ว และบัญชีที่ได้รับอนุญาตมี scope `meetings.space.created`

เพื่อพิสูจน์สิทธิ์อ่านสำหรับพื้นที่การประชุมที่มีอยู่:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` และ `resolve-space` พิสูจน์สิทธิ์อ่านพื้นที่ที่มีอยู่ซึ่งบัญชี Google ที่ได้รับอนุญาตเข้าถึงได้ `403` จากการตรวจสอบเหล่านี้มักหมายความว่า Google Meet REST API ถูกปิดใช้งาน, refresh token ที่ยินยอมไว้ไม่มี scope ที่จำเป็น, หรือบัญชี Google ไม่สามารถเข้าถึงพื้นที่ Meet นั้นได้ ข้อผิดพลาด refresh-token หมายความว่าให้รัน `openclaw googlemeet auth login
--json` อีกครั้งแล้วเก็บบล็อก `oauth` ใหม่

ไม่จำเป็นต้องมีข้อมูลรับรอง OAuth สำหรับทางเลือกสำรองของเบราว์เซอร์ ในโหมดนั้น การยืนยันตัวตน Google มาจากโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้บนโหนดที่เลือก ไม่ใช่จากการกำหนดค่า OpenClaw

ตัวแปรสภาพแวดล้อมเหล่านี้รองรับเป็นค่าทางเลือกสำรอง:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` หรือ `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` หรือ `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` หรือ
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` หรือ `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` หรือ `GOOGLE_MEET_PREVIEW_ACK`

แปลง URL Meet, รหัส, หรือ `spaces/{id}` ผ่าน `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

รันการตรวจสอบล่วงหน้าก่อนงานสื่อ:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

แสดงรายการอาร์ติแฟกต์การประชุมและการเข้าร่วมหลังจาก Meet สร้างระเบียนการประชุมแล้ว:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

เมื่อใช้ `--meeting` ค่า `artifacts` และ `attendance` จะใช้ระเบียนการประชุมล่าสุดตามค่าเริ่มต้น ส่ง `--all-conference-records` เมื่อต้องการทุกระเบียนที่ยังถูกเก็บไว้สำหรับการประชุมนั้น

การค้นหา Calendar สามารถแปลง URL การประชุมจาก Google Calendar ก่อนอ่านอาร์ติแฟกต์ Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` ค้นหาปฏิทิน `primary` ของวันนี้เพื่อหาเหตุการณ์ Calendar ที่มีลิงก์ Google Meet ใช้ `--event <query>` เพื่อค้นหาข้อความเหตุการณ์ที่ตรงกัน และ `--calendar <id>` สำหรับปฏิทินที่ไม่ใช่ปฏิทินหลัก การค้นหา Calendar ต้องมีการเข้าสู่ระบบ OAuth ใหม่ที่รวม scope อ่านอย่างเดียวสำหรับเหตุการณ์ Calendar
`calendar-events` แสดงตัวอย่างเหตุการณ์ Meet ที่ตรงกันและทำเครื่องหมายเหตุการณ์ที่ `latest`, `artifacts`, `attendance`, หรือ `export` จะเลือก

หากคุณทราบ id ระเบียนการประชุมอยู่แล้ว ให้ระบุโดยตรง:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

จบการประชุมที่ใช้งานอยู่สำหรับพื้นที่ที่สร้างด้วย API เมื่อต้องการปิดห้องหลังการโทร:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

คำสั่งนี้เรียก Google Meet `spaces.endActiveConference` และต้องใช้ OAuth พร้อม scope `meetings.space.created` สำหรับพื้นที่ที่บัญชีที่ได้รับอนุญาตจัดการได้
OpenClaw รองรับอินพุตเป็น URL Meet, รหัสการประชุม, หรือ `spaces/{id}` และแปลงเป็นทรัพยากรพื้นที่ของ API ก่อนจบการประชุมที่ใช้งานอยู่
คำสั่งนี้แยกจาก `googlemeet leave`: `leave` หยุดการเข้าร่วมแบบ local/session ของ OpenClaw ส่วน `end-active-conference` ขอให้ Google Meet จบการประชุมที่ใช้งานอยู่สำหรับพื้นที่นั้น

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

`artifacts` ส่งคืนเมทาดาทาระเบียนการประชุมพร้อมเมทาดาทาทรัพยากรผู้เข้าร่วม, การบันทึก, ทรานสคริปต์, รายการทรานสคริปต์แบบมีโครงสร้าง, และบันทึกอัจฉริยะ เมื่อ Google เปิดเผยข้อมูลเหล่านี้สำหรับการประชุม ใช้ `--no-transcript-entries` เพื่อข้ามการค้นหารายการสำหรับการประชุมขนาดใหญ่ `attendance` ขยายผู้เข้าร่วมเป็นแถวเซสชันผู้เข้าร่วมพร้อมเวลาเห็นครั้งแรก/ครั้งล่าสุด, ระยะเวลาเซสชันรวม, แฟล็กมาสาย/ออกก่อน, และทรัพยากรผู้เข้าร่วมที่ซ้ำกันซึ่งผสานตามผู้ใช้ที่ลงชื่อเข้าใช้หรือชื่อที่แสดง ส่ง `--no-merge-duplicates` เพื่อเก็บทรัพยากรผู้เข้าร่วมดิบแยกกัน, `--late-after-minutes` เพื่อปรับการตรวจจับการมาสาย, และ `--early-before-minutes` เพื่อปรับการตรวจจับการออกก่อน

`export` เขียนโฟลเดอร์ที่ประกอบด้วย `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json`, และ `manifest.json`
`manifest.json` บันทึกอินพุตที่เลือก, ตัวเลือกการส่งออก, ระเบียนการประชุม, ไฟล์เอาต์พุต, จำนวน, แหล่งที่มาของโทเค็น, เหตุการณ์ Calendar เมื่อมีการใช้, และคำเตือนการดึงข้อมูลบางส่วน ส่ง `--zip` เพื่อเขียนไฟล์เก็บถาวรแบบพกพาไว้ข้างโฟลเดอร์ด้วย ส่ง `--include-doc-bodies` เพื่อส่งออกข้อความ Google Docs ของทรานสคริปต์และบันทึกอัจฉริยะที่ลิงก์ผ่าน Google Drive `files.export`; สิ่งนี้ต้องใช้การเข้าสู่ระบบ OAuth ใหม่ที่รวม scope อ่านอย่างเดียวของ Drive Meet หากไม่ใช้ `--include-doc-bodies` การส่งออกจะรวมเฉพาะเมทาดาทา Meet และรายการทรานสคริปต์แบบมีโครงสร้างเท่านั้น หาก Google ส่งคืนความล้มเหลวของอาร์ติแฟกต์บางส่วน เช่น ข้อผิดพลาดการแสดงรายการบันทึกอัจฉริยะ, รายการทรานสคริปต์, หรือเนื้อหาเอกสาร Drive สรุปและ manifest จะเก็บคำเตือนไว้แทนที่จะทำให้การส่งออกทั้งหมดล้มเหลว
ใช้ `--dry-run` เพื่อดึงข้อมูลอาร์ติแฟกต์/การเข้าร่วมเดียวกันและพิมพ์ JSON ของ manifest โดยไม่สร้างโฟลเดอร์หรือ ZIP สิ่งนี้มีประโยชน์ก่อนเขียนการส่งออกขนาดใหญ่ หรือเมื่อเอเจนต์ต้องการเพียงจำนวน, ระเบียนที่เลือก, และคำเตือน

เอเจนต์ยังสามารถสร้างบันเดิลเดียวกันผ่านเครื่องมือ `google_meet` ได้:

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

เอเจนต์ยังสามารถสร้างห้องที่รองรับด้วย API พร้อมนโยบายการเข้าถึงที่ระบุชัดเจน:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
  "accessType": "OPEN"
}
```

และสามารถจบการประชุมที่ใช้งานอยู่สำหรับห้องที่ทราบได้:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

สำหรับการตรวจสอบแบบฟังก่อน เอเจนต์ควรใช้ `test_listen` ก่อนอ้างว่าการประชุมมีประโยชน์:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

รัน live smoke แบบมีการป้องกันกับการประชุมจริงที่ยังถูกเก็บไว้:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

รันโพรบเบราว์เซอร์แบบสดที่ฟังก่อนกับการประชุมซึ่งจะมีคนพูดและมีคำบรรยาย Meet พร้อมใช้งาน:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

สภาพแวดล้อม live smoke:

- `OPENCLAW_LIVE_TEST=1` เปิดใช้การทดสอบสดแบบมีการป้องกัน
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` ชี้ไปยัง URL Meet, รหัส, หรือ
  `spaces/{id}` ที่ยังถูกเก็บไว้
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID` ให้ id ไคลเอนต์ OAuth
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN` ให้ refresh token
- ตัวเลือกเสริม: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, และ
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ใช้ชื่อทางเลือกสำรองเดียวกันโดยไม่มีคำนำหน้า `OPENCLAW_`

live smoke พื้นฐานสำหรับอาร์ติแฟกต์/การเข้าร่วมต้องใช้
`https://www.googleapis.com/auth/meetings.space.readonly` และ
`https://www.googleapis.com/auth/meetings.conference.media.readonly` การค้นหา Calendar ต้องใช้ `https://www.googleapis.com/auth/calendar.events.readonly` การส่งออกเนื้อหาเอกสาร Drive ต้องใช้
`https://www.googleapis.com/auth/drive.meet.readonly`

สร้างพื้นที่ Meet ใหม่:

```bash
openclaw googlemeet create
```

คำสั่งจะพิมพ์ `meeting uri` ใหม่, แหล่งที่มา, และเซสชันเข้าร่วม เมื่อมีข้อมูลรับรอง OAuth จะใช้ Google Meet API อย่างเป็นทางการ หากไม่มีข้อมูลรับรอง OAuth จะใช้โปรไฟล์เบราว์เซอร์ที่ลงชื่อเข้าใช้ของโหนด Chrome ที่ปักหมุดไว้เป็นทางเลือกสำรอง เอเจนต์สามารถใช้เครื่องมือ `google_meet` พร้อม `action: "create"` เพื่อสร้างและเข้าร่วมในขั้นตอนเดียว สำหรับการสร้างเฉพาะ URL ให้ส่ง `"join": false`

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

หากทางเลือกสำรองของเบราว์เซอร์พบตัวกั้นการเข้าสู่ระบบ Google หรือสิทธิ์ Meet ก่อนที่จะสร้าง URL ได้ เมธอด Gateway จะส่งคืนการตอบกลับที่ล้มเหลว และเครื่องมือ `google_meet` จะส่งคืนรายละเอียดแบบมีโครงสร้างแทนสตริงธรรมดา:

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

เมื่อเอเจนต์เห็น `manualActionRequired: true` ควรรายงาน `manualActionMessage` พร้อมบริบทโหนด/แท็บของเบราว์เซอร์ และหยุดเปิดแท็บ Meet ใหม่จนกว่าผู้ปฏิบัติการจะทำขั้นตอนในเบราว์เซอร์เสร็จ

ตัวอย่างเอาต์พุต JSON จากการสร้างด้วย API:

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

การสร้าง Meet จะเข้าร่วมตามค่าเริ่มต้น transport แบบ Chrome หรือ Chrome-node ยังต้องใช้โปรไฟล์ Google Chrome ที่ลงชื่อเข้าใช้เพื่อเข้าร่วมผ่านเบราว์เซอร์ หากโปรไฟล์ออกจากระบบอยู่ OpenClaw จะรายงาน `manualActionRequired: true` หรือข้อผิดพลาดทางเลือกสำรองของเบราว์เซอร์ และขอให้ผู้ปฏิบัติการทำการเข้าสู่ระบบ Google ให้เสร็จก่อนลองใหม่

ตั้งค่า `preview.enrollmentAcknowledged: true` เฉพาะหลังจากยืนยันว่าโปรเจกต์ Cloud, principal ของ OAuth, และผู้เข้าร่วมการประชุมของคุณได้ลงทะเบียนใน Google Workspace Developer Preview Program สำหรับ Meet media APIs แล้ว

## การกำหนดค่า

เส้นทางเอเจนต์ Chrome ทั่วไปต้องการเพียงการเปิดใช้ Plugin, BlackHole, SoX, คีย์ผู้ให้บริการถอดเสียงแบบเรียลไทม์, และผู้ให้บริการ OpenClaw TTS ที่กำหนดค่าแล้ว
OpenAI เป็นผู้ให้บริการถอดเสียงตามค่าเริ่มต้น; ตั้งค่า `realtime.provider: "google"` เพื่อใช้ Google Gemini Live สำหรับโหมด `bidi`:

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
- `defaultMode: "agent"` (`"realtime"` ยอมรับเป็นนามแฝงเพื่อความเข้ากันได้สำหรับ
  `"agent"`)
- `chromeNode.node`: รหัส/ชื่อ/IP ของ Node ที่ไม่บังคับสำหรับ `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ชื่อที่ใช้บนหน้าจอผู้เยี่ยมชม Meet ที่ยังไม่ได้ลงชื่อเข้าใช้
- `chrome.autoJoin: true`: พยายามกรอกชื่อผู้เยี่ยมชมและคลิก Join Now ให้ดีที่สุด
  ผ่านระบบอัตโนมัติของเบราว์เซอร์ OpenClaw บน `chrome-node`
- `chrome.reuseExistingTab: true`: เปิดใช้งานแท็บ Meet ที่มีอยู่แทนการเปิดซ้ำ
- `chrome.waitForInCallMs: 20000`: รอให้แท็บ Meet รายงานว่าอยู่ในการโทร
  ก่อนทริกเกอร์ข้อความแนะนำของเรียลไทม์
- `chrome.audioFormat: "pcm16-24khz"`: รูปแบบเสียงของคู่คำสั่ง ใช้
  `"g711-ulaw-8khz"` เฉพาะสำหรับคู่คำสั่งรุ่นเก่า/กำหนดเองที่ยังคงส่งเสียงโทรศัพท์
- `chrome.audioInputCommand`: คำสั่ง SoX ที่อ่านจาก CoreAudio `BlackHole 2ch`
  และเขียนเสียงใน `chrome.audioFormat`
- `chrome.audioOutputCommand`: คำสั่ง SoX ที่อ่านเสียงใน `chrome.audioFormat`
  และเขียนไปยัง CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: คำสั่งไมโครโฟนในเครื่องที่ไม่บังคับ ซึ่งเขียน PCM โมโน signed 16-bit little-endian สำหรับการตรวจจับการพูดแทรกของมนุษย์ขณะ
  การเล่นเสียงของผู้ช่วยทำงานอยู่ ขณะนี้ใช้กับบริดจ์คู่คำสั่ง `chrome` ที่โฮสต์โดย Gateway
- `chrome.bargeInRmsThreshold: 650`: ระดับ RMS ที่นับเป็นการขัดจังหวะจากมนุษย์
  บน `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: ระดับพีคที่นับเป็นการขัดจังหวะจากมนุษย์
  บน `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: หน่วงเวลาขั้นต่ำระหว่างการล้างสถานะการขัดจังหวะจากมนุษย์ซ้ำ
- `mode: "agent"`: โหมดตอบกลับเริ่มต้น คำพูดของผู้เข้าร่วมจะถูกถอดเสียงโดย
  ผู้ให้บริการถอดเสียงเรียลไทม์ที่กำหนดค่าไว้ ส่งไปยัง
  เอเจนต์ OpenClaw ที่กำหนดค่าไว้ในเซสชันเอเจนต์ย่อยต่อการประชุม และพูดตอบกลับผ่าน
  รันไทม์ TTS ปกติของ OpenClaw
- `mode: "bidi"`: โหมดสำรองของโมเดลเรียลไทม์แบบสองทิศทางโดยตรง
  ผู้ให้บริการเสียงเรียลไทม์จะตอบคำพูดของผู้เข้าร่วมโดยตรง และอาจเรียก
  `openclaw_agent_consult` เพื่อคำตอบที่ลึกขึ้น/มีเครื่องมือสนับสนุน
- `mode: "transcribe"`: โหมดสังเกตการณ์อย่างเดียวโดยไม่มีบริดจ์ตอบกลับ
- `realtime.provider: "openai"`: รหัสผู้ให้บริการที่โหมด `agent` ใช้สำหรับ
  การถอดเสียงเรียลไทม์ และโหมด `bidi` ใช้สำหรับเสียงเรียลไทม์
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: คำตอบพูดสั้น ๆ พร้อม
  `openclaw_agent_consult` สำหรับคำตอบที่ลึกขึ้น
- `realtime.introMessage`: การตรวจสอบความพร้อมแบบพูดสั้น ๆ เมื่อบริดจ์เรียลไทม์
  เชื่อมต่อ ตั้งเป็น `""` เพื่อเข้าร่วมแบบเงียบ
- `realtime.agentId`: รหัสเอเจนต์ OpenClaw ที่ไม่บังคับสำหรับ
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

ค่าเริ่มต้นของ `voiceCall.enabled` คือ `true`; เมื่อใช้การขนส่ง Twilio จะมอบหมาย
การโทร PSTN จริง, DTMF และคำทักทายเริ่มต้นให้กับ Plugin Voice Call โดย Voice Call
จะเล่นลำดับ DTMF ก่อนเปิดสตรีมสื่อเรียลไทม์ จากนั้นใช้ข้อความแนะนำที่บันทึกไว้
เป็นคำทักทายเรียลไทม์เริ่มต้น หากไม่ได้เปิดใช้ `voice-call`
Google Meet ยังคงตรวจสอบและบันทึกแผนการโทรได้ แต่ไม่สามารถวางสาย Twilio ได้

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
`transport: "chrome-node"` เมื่อ Chrome ทำงานบน Node ที่จับคู่ เช่น VM Parallels
ในทั้งสองกรณี ผู้ให้บริการโมเดลและ `openclaw_agent_consult` จะทำงานบนโฮสต์
Gateway ดังนั้นข้อมูลประจำตัวของโมเดลจึงอยู่ที่นั่น ด้วยค่าเริ่มต้น `mode: "agent"`
ผู้ให้บริการถอดเสียงเรียลไทม์จะจัดการการฟัง เอเจนต์ OpenClaw ที่กำหนดค่าไว้จะสร้างคำตอบ
และ TTS ปกติของ OpenClaw จะพูดคำนั้นเข้า Meet ใช้ `mode: "bidi"` เมื่อคุณต้องการให้
โมเดลเสียงเรียลไทม์ตอบโดยตรง `mode: "realtime"` ยังคงยอมรับเป็นนามแฝงเพื่อความเข้ากันได้สำหรับ
`mode: "agent"`

ใช้ `action: "status"` เพื่อแสดงรายการเซสชันที่ใช้งานอยู่หรือตรวจสอบรหัสเซสชัน ใช้
`action: "speak"` พร้อม `sessionId` และ `message` เพื่อให้เอเจนต์เรียลไทม์
พูดทันที ใช้ `action: "test_speech"` เพื่อสร้างหรือใช้เซสชันซ้ำ
ทริกเกอร์วลีที่รู้จัก และส่งคืนสุขภาพ `inCall` เมื่อโฮสต์ Chrome สามารถ
รายงานได้ `test_speech` จะบังคับใช้ `mode: "agent"` เสมอ และจะล้มเหลวหากถูกขอให้
ทำงานใน `mode: "transcribe"` เพราะเซสชันแบบสังเกตการณ์อย่างเดียวตั้งใจให้
ไม่สามารถส่งเสียงพูดได้ ผลลัพธ์ `speechOutputVerified` อิงจากจำนวนไบต์เอาต์พุตเสียงเรียลไทม์
ที่เพิ่มขึ้นระหว่างการทดสอบครั้งนี้ ดังนั้นเซสชันที่ใช้ซ้ำซึ่งมีเสียงเก่ากว่า
จะไม่นับเป็นการตรวจสอบเสียงพูดใหม่ที่สำเร็จ ใช้ `action: "leave"` เพื่อทำเครื่องหมายว่า
เซสชันสิ้นสุดแล้ว

`status` รวมสุขภาพของ Chrome เมื่อมีข้อมูล:

- `inCall`: Chrome ดูเหมือนอยู่ภายในสาย Meet
- `micMuted`: สถานะไมโครโฟน Meet แบบพยายามให้ดีที่สุด
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: โปรไฟล์
  เบราว์เซอร์ต้องการการเข้าสู่ระบบด้วยตนเอง การอนุญาตจากโฮสต์ Meet สิทธิ์อนุญาต หรือ
  การซ่อมการควบคุมเบราว์เซอร์ก่อนที่เสียงพูดจะทำงานได้
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ระบุว่า
  อนุญาตให้ใช้เสียงพูดของ Chrome ที่จัดการอยู่ในตอนนี้หรือไม่ `speechReady: false` หมายความว่า OpenClaw
  ไม่ได้ส่งวลีแนะนำ/ทดสอบเข้าไปในบริดจ์เสียง
- `providerConnected` / `realtimeReady`: สถานะบริดจ์เสียงเรียลไทม์
- `lastInputAt` / `lastOutputAt`: เสียงล่าสุดที่เห็นจากบริดจ์หรือส่งไปยังบริดจ์
- `audioOutputRouted` / `audioOutputDeviceLabel`: ระบุว่าเอาต์พุตสื่อของแท็บ Meet
  ถูกกำหนดเส้นทางอย่างใช้งานไปยังอุปกรณ์ BlackHole ที่บริดจ์ใช้หรือไม่
- `lastSuppressedInputAt` / `suppressedInputBytes`: อินพุต loopback ที่ถูกละเว้นขณะ
  การเล่นเสียงของผู้ช่วยทำงานอยู่

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## โหมดเอเจนต์และสองทิศทาง

โหมด `agent` ของ Chrome ถูกปรับให้เหมาะกับพฤติกรรม "เอเจนต์ของฉันอยู่ในการประชุม"
ผู้ให้บริการถอดเสียงเรียลไทม์ได้ยินเสียงการประชุม ทรานสคริปต์สุดท้ายของผู้เข้าร่วม
ถูกส่งผ่านเอเจนต์ OpenClaw ที่กำหนดค่าไว้ และคำตอบถูกพูดผ่านรันไทม์ TTS ปกติของ OpenClaw
ตั้งค่า `mode: "bidi"` เมื่อคุณต้องการให้โมเดลเสียงเรียลไทม์ตอบโดยตรง
เศษทรานสคริปต์สุดท้ายที่อยู่ใกล้กันจะถูกรวมเข้าด้วยกันก่อนการ consult เพื่อให้การพูดหนึ่งรอบ
ไม่สร้างคำตอบบางส่วนเก่าหลายรายการ อินพุตเรียลไทม์จะถูกระงับด้วย
ขณะที่เสียงผู้ช่วยที่จัดคิวยังเล่นอยู่
และเสียงสะท้อนทรานสคริปต์ที่คล้ายผู้ช่วยเมื่อเร็ว ๆ นี้จะถูกละเว้นก่อนการ consult ของเอเจนต์
เพื่อไม่ให้ loopback ของ BlackHole ทำให้เอเจนต์ตอบคำพูดของตัวเอง

| โหมด    | ผู้ตัดสินคำตอบ        | เส้นทางเอาต์พุตเสียงพูด                     | ใช้เมื่อ                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | เอเจนต์ OpenClaw ที่กำหนดค่าไว้ | รันไทม์ TTS ปกติของ OpenClaw            | คุณต้องการพฤติกรรม "เอเจนต์ของฉันอยู่ในการประชุม"        |
| `bidi`  | โมเดลเสียงเรียลไทม์      | การตอบกลับเสียงของผู้ให้บริการเสียงเรียลไทม์ | คุณต้องการลูปเสียงสนทนาที่มีความหน่วงต่ำที่สุด |

ในโหมด `bidi` เมื่อโมเดลเรียลไทม์ต้องการการให้เหตุผลที่ลึกขึ้น
ข้อมูลปัจจุบัน หรือเครื่องมือ OpenClaw ปกติ ก็สามารถเรียก `openclaw_agent_consult` ได้

เครื่องมือ consult จะเรียกใช้เอเจนต์ OpenClaw ปกติอยู่เบื้องหลัง พร้อมบริบท
ทรานสคริปต์การประชุมล่าสุด และส่งคืนคำตอบพูดที่กระชับ ในโหมด `agent`
OpenClaw จะส่งคำตอบนั้นตรงไปยังรันไทม์ TTS; ในโหมด `bidi`
โมเดลเสียงเรียลไทม์สามารถพูดผลลัพธ์ consult กลับเข้าไปในการประชุมได้ โดยใช้
กลไก consult ที่ใช้ร่วมกันเดียวกับ Voice Call

โดยค่าเริ่มต้น consult จะทำงานกับเอเจนต์ `main` ตั้งค่า `realtime.agentId` เมื่อ
เลน Meet ควร consult เวิร์กสเปซเอเจนต์ OpenClaw เฉพาะ ค่าเริ่มต้นของโมเดล
นโยบายเครื่องมือ หน่วยความจำ และประวัติเซสชัน

consult ในโหมดเอเจนต์ใช้คีย์เซสชัน `agent:<id>:subagent:google-meet:<session>`
แบบต่อการประชุม เพื่อให้คำถามติดตามผลรักษาบริบทการประชุมไว้ขณะสืบทอดนโยบาย
เอเจนต์ปกติจากเอเจนต์ที่กำหนดค่าไว้

`realtime.toolPolicy` ควบคุมการรัน consult:

- `safe-read-only`: เปิดเผยเครื่องมือ consult และจำกัดเอเจนต์ปกติให้ใช้
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ
  `memory_get`
- `owner`: เปิดเผยเครื่องมือ consult และให้เอเจนต์ปกติใช้นโยบายเครื่องมือ
  เอเจนต์ปกติ
- `none`: ไม่เปิดเผยเครื่องมือ consult ให้โมเดลเสียงเรียลไทม์

คีย์เซสชัน consult ถูกกำหนดขอบเขตต่อเซสชัน Meet ดังนั้นการเรียก consult ติดตามผล
จึงสามารถใช้บริบท consult ก่อนหน้าในระหว่างการประชุมเดียวกันได้

เพื่อบังคับการตรวจสอบความพร้อมแบบพูดหลังจาก Chrome เข้าร่วมสายเรียบร้อยแล้ว:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

สำหรับ smoke การเข้าร่วมและพูดแบบเต็ม:

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

สถานะ Chrome-node ที่คาดหวัง:

- `googlemeet setup` เป็นสีเขียวทั้งหมด
- `googlemeet setup` รวม `chrome-node-connected` เมื่อ Chrome-node เป็น
  การขนส่งเริ่มต้นหรือมีการปักหมุด Node
- `nodes status` แสดงว่า Node ที่เลือกเชื่อมต่ออยู่
- Node ที่เลือกประกาศทั้ง `googlemeet.chrome` และ `browser.proxy`
- แท็บ Meet เข้าร่วมสาย และ `test-speech` ส่งคืนสุขภาพ Chrome พร้อม
  `inCall: true`

สำหรับโฮสต์ Chrome ระยะไกล เช่น VM Parallels macOS นี่คือการตรวจสอบที่สั้นที่สุด
และปลอดภัยหลังอัปเดต Gateway หรือ VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

สิ่งนี้พิสูจน์ว่า Plugin Gateway ถูกโหลดแล้ว, Node VM เชื่อมต่อด้วย
โทเค็นปัจจุบัน และบริดจ์เสียง Meet พร้อมใช้งานก่อนที่เอเจนต์จะเปิด
แท็บการประชุมจริง

สำหรับ smoke ของ Twilio ให้ใช้การประชุมที่แสดงรายละเอียดการโทรเข้าทางโทรศัพท์:

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
- `openclaw logs --follow` แสดง DTMF TwiML ที่ถูกให้บริการก่อน realtime TwiML จากนั้นเป็น
  บริดจ์ realtime พร้อมคำทักทายเริ่มต้นที่เข้าคิวไว้
- `googlemeet leave <sessionId>` วางสายการโทรเสียงที่มอบหมายไว้

## การแก้ไขปัญหา

### เอเจนต์มองไม่เห็นเครื่องมือ Google Meet

ยืนยันว่า Plugin ถูกเปิดใช้งานในการกำหนดค่า Gateway และโหลด Gateway ใหม่:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

หากคุณเพิ่งแก้ไข `plugins.entries.google-meet` ให้รีสตาร์ตหรือโหลด Gateway ใหม่
เอเจนต์ที่กำลังทำงานจะเห็นเฉพาะเครื่องมือ Plugin ที่ลงทะเบียนโดยกระบวนการ Gateway
ปัจจุบันเท่านั้น

บนโฮสต์ Gateway ที่ไม่ใช่ macOS เครื่องมือ `google_meet` สำหรับเอเจนต์จะยังมองเห็นได้
แต่การทำงาน Chrome talk-back ในเครื่องจะถูกบล็อกก่อนถึงบริดจ์เสียง
เสียง Chrome talk-back ในเครื่องขณะนี้ขึ้นกับ `BlackHole 2ch` ของ macOS ดังนั้น
เอเจนต์ Linux ควรใช้ `mode: "transcribe"` การโทรเข้า Twilio หรือโฮสต์
`chrome-node` ของ macOS แทนเส้นทางเอเจนต์ Chrome ในเครื่องเริ่มต้น

### ไม่มี Node ที่รองรับ Google Meet เชื่อมต่ออยู่

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

Node ต้องเชื่อมต่ออยู่และแสดงรายการ `googlemeet.chrome` พร้อมกับ `browser.proxy`
การกำหนดค่า Gateway ต้องอนุญาตคำสั่ง Node เหล่านั้น:

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
`gateway token mismatch` ให้ติดตั้งใหม่หรือรีสตาร์ต Node ด้วยโทเค็น Gateway ปัจจุบัน
สำหรับ Gateway บน LAN โดยปกติหมายถึง:

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

### เบราว์เซอร์เปิดขึ้นแต่เอเจนต์เข้าร่วมไม่ได้

รัน `googlemeet test-listen` สำหรับการเข้าร่วมแบบสังเกตการณ์เท่านั้น หรือ `googlemeet test-speech`
สำหรับการเข้าร่วมแบบ realtime แล้วตรวจสอบสถานะสุขภาพ Chrome ที่ส่งคืน หากโพรบใดรายงาน
`manualActionRequired: true` ให้แสดง `manualActionMessage` ต่อผู้ปฏิบัติงาน
และหยุดลองซ้ำจนกว่าการทำงานในเบราว์เซอร์จะเสร็จสมบูรณ์

การทำงานด้วยตนเองที่พบบ่อย:

- ลงชื่อเข้าใช้โปรไฟล์ Chrome
- อนุญาตผู้เข้าร่วมจากบัญชีโฮสต์ Meet
- ให้สิทธิ์ไมโครโฟน/กล้องแก่ Chrome เมื่อพรอมป์สิทธิ์แบบเนทีฟของ Chrome ปรากฏ
- ปิดหรือซ่อมกล่องโต้ตอบสิทธิ์ Meet ที่ค้างอยู่

อย่ารายงานว่า "not signed in" เพียงเพราะ Meet แสดง "Do you want people to
hear you in the meeting?" นั่นคือหน้าคั่นการเลือกเสียงของ Meet; OpenClaw
คลิก **Use microphone** ผ่านการทำงานอัตโนมัติของเบราว์เซอร์เมื่อพร้อมใช้งาน และยังคง
รอสถานะการประชุมจริงต่อไป สำหรับ browser fallback แบบสร้างอย่างเดียว OpenClaw
อาจคลิก **Continue without microphone** เพราะการสร้าง URL ไม่ต้องใช้
เส้นทางเสียง realtime

### การสร้างการประชุมล้มเหลว

`googlemeet create` ใช้เอนด์พอยต์ Google Meet API `spaces.create` ก่อน
เมื่อมีการกำหนดค่าข้อมูลรับรอง OAuth หากไม่มีข้อมูลรับรอง OAuth จะ fallback
ไปยังเบราว์เซอร์ Chrome Node ที่ปักหมุดไว้ ยืนยันว่า:

- สำหรับการสร้างผ่าน API: มีการกำหนดค่า `oauth.clientId` และ `oauth.refreshToken`
  หรือมีตัวแปรสภาพแวดล้อม `OPENCLAW_GOOGLE_MEET_*` ที่ตรงกัน
- สำหรับการสร้างผ่าน API: โทเค็นรีเฟรชถูกออกหลังจากเพิ่มการรองรับการสร้างแล้ว
  โทเค็นรุ่นเก่าอาจไม่มี scope `meetings.space.created`; ให้รัน
  `openclaw googlemeet auth login --json` อีกครั้งและอัปเดตการกำหนดค่า Plugin
- สำหรับ browser fallback: `defaultTransport: "chrome-node"` และ
  `chromeNode.node` ชี้ไปยัง Node ที่เชื่อมต่ออยู่พร้อม `browser.proxy` และ
  `googlemeet.chrome`
- สำหรับ browser fallback: โปรไฟล์ Chrome ของ OpenClaw บน Node นั้นลงชื่อเข้าใช้
  Google แล้วและสามารถเปิด `https://meet.google.com/new`
- สำหรับ browser fallback: การลองซ้ำใช้แท็บ `https://meet.google.com/new`
  หรือแท็บพรอมป์บัญชี Google ที่มีอยู่ก่อนเปิดแท็บใหม่ หากเอเจนต์หมดเวลา
  ให้ลองเรียกเครื่องมือซ้ำแทนการเปิดแท็บ Meet อีกแท็บด้วยตนเอง
- สำหรับ browser fallback: หากเครื่องมือส่งคืน `manualActionRequired: true` ให้ใช้
  `browser.nodeId`, `browser.targetId`, `browserUrl` และ
  `manualActionMessage` ที่ส่งคืนมาเพื่อแนะนำผู้ปฏิบัติงาน อย่าลองซ้ำวนไปมาจนกว่า
  การทำงานนั้นจะเสร็จสมบูรณ์
- สำหรับ browser fallback: หาก Meet แสดง "Do you want people to hear you in the
  meeting?" ให้เปิดแท็บทิ้งไว้ OpenClaw ควรคลิก **Use microphone** หรือสำหรับ
  fallback แบบสร้างอย่างเดียว คลิก **Continue without microphone** ผ่านการทำงานอัตโนมัติ
  ของเบราว์เซอร์และรอ URL Meet ที่สร้างต่อไป หากทำไม่ได้ ข้อผิดพลาดควรกล่าวถึง
  `meet-audio-choice-required` ไม่ใช่ `google-login-required`

### เอเจนต์เข้าร่วมแล้วแต่ไม่พูด

ตรวจสอบเส้นทาง realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

ใช้ `mode: "agent"` สำหรับเส้นทาง talk-back ปกติ STT -> เอเจนต์ OpenClaw -> TTS
หรือ `mode: "bidi"` สำหรับ fallback เสียง realtime โดยตรง `mode: "transcribe"`
ตั้งใจไม่เริ่มบริดจ์ talk-back สำหรับการดีบักแบบสังเกตการณ์เท่านั้น
ให้รัน `openclaw googlemeet status --json <session-id>` หลังจากผู้เข้าร่วมพูด
และตรวจสอบ `captioning`, `transcriptLines` และ `lastCaptionText` หาก `inCall` เป็น
true แต่ `transcriptLines` ยังคงเป็น `0` อาจเป็นเพราะคำบรรยาย Meet ถูกปิดใช้งาน
ยังไม่มีใครพูดตั้งแต่ติดตั้งตัวสังเกตการณ์ UI ของ Meet เปลี่ยนไป หรือ live
captions ไม่พร้อมใช้งานสำหรับภาษา/บัญชีของการประชุม

`googlemeet test-speech` ตรวจสอบเส้นทาง realtime เสมอและรายงานว่า
พบไบต์เอาต์พุตบริดจ์สำหรับการเรียกใช้นั้นหรือไม่ หาก `speechOutputVerified` เป็น false และ
`speechOutputTimedOut` เป็น true ผู้ให้บริการ realtime อาจยอมรับถ้อยคำแล้ว
แต่ OpenClaw ไม่เห็นไบต์เอาต์พุตใหม่ไปถึงบริดจ์เสียง Chrome

ตรวจสอบเพิ่มเติมว่า:

- มีคีย์ผู้ให้บริการ realtime บนโฮสต์ Gateway เช่น
  `OPENAI_API_KEY` หรือ `GEMINI_API_KEY`
- `BlackHole 2ch` มองเห็นได้บนโฮสต์ Chrome
- `sox` มีอยู่บนโฮสต์ Chrome
- ไมโครโฟนและลำโพง Meet ถูกกำหนดเส้นทางผ่านเส้นทางเสียงเสมือนที่ OpenClaw ใช้
  `doctor` ควรแสดง `meet output routed: yes` สำหรับการเข้าร่วม Chrome realtime
  ในเครื่อง

`googlemeet doctor [session-id]` พิมพ์เซสชัน, Node, สถานะอยู่ในสาย,
เหตุผลของการทำงานด้วยตนเอง, การเชื่อมต่อผู้ให้บริการ realtime, `realtimeReady`,
กิจกรรมอินพุต/เอาต์พุตเสียง, timestamp เสียงล่าสุด, ตัวนับไบต์ และ URL เบราว์เซอร์
ใช้ `googlemeet status [session-id] --json` เมื่อคุณต้องการ JSON ดิบ ใช้
`googlemeet doctor --oauth` เมื่อคุณต้องการตรวจสอบการรีเฟรช OAuth ของ Google Meet
โดยไม่เปิดเผยโทเค็น; เพิ่ม `--meeting` หรือ `--create-space` เมื่อคุณต้องการ
หลักฐาน Google Meet API ด้วย

หากเอเจนต์หมดเวลาและคุณเห็นแท็บ Meet เปิดอยู่แล้ว ให้ตรวจสอบแท็บนั้น
โดยไม่ต้องเปิดอีกแท็บ:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

การทำงานของเครื่องมือที่เทียบเท่าคือ `recover_current_tab` เครื่องมือนี้โฟกัสและตรวจสอบ
แท็บ Meet ที่มีอยู่สำหรับ transport ที่เลือก เมื่อใช้ `chrome` จะใช้การควบคุมเบราว์เซอร์
ในเครื่องผ่าน Gateway; เมื่อใช้ `chrome-node` จะใช้ Chrome Node ที่กำหนดค่าไว้
เครื่องมือนี้ไม่เปิดแท็บใหม่หรือสร้างเซสชันใหม่; แต่รายงานตัวบล็อกปัจจุบัน
เช่น สถานะการเข้าสู่ระบบ การอนุญาตเข้า การให้สิทธิ์ หรือการเลือกเสียง
คำสั่ง CLI คุยกับ Gateway ที่กำหนดค่าไว้ ดังนั้น Gateway ต้องทำงานอยู่;
`chrome-node` ยังต้องมี Chrome Node เชื่อมต่ออยู่ด้วย

### การตรวจสอบการตั้งค่า Twilio ล้มเหลว

`twilio-voice-call-plugin` ล้มเหลวเมื่อ `voice-call` ไม่ได้รับอนุญาตหรือไม่ได้เปิดใช้งาน
เพิ่มลงใน `plugins.allow` เปิดใช้งาน `plugins.entries.voice-call` และโหลด
Gateway ใหม่

`twilio-voice-call-credentials` ล้มเหลวเมื่อแบ็กเอนด์ Twilio ไม่มี account
SID, auth token หรือหมายเลขผู้โทร ตั้งค่าเหล่านี้บนโฮสต์ Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` ล้มเหลวเมื่อ `voice-call` ไม่มีการเปิดเผย Webhook
สาธารณะ หรือเมื่อ `publicUrl` ชี้ไปยัง local loopback หรือพื้นที่เครือข่ายส่วนตัว
ตั้งค่า `plugins.entries.voice-call.config.publicUrl` เป็น URL ผู้ให้บริการสาธารณะ หรือ
กำหนดค่า tunnel/Tailscale exposure สำหรับ `voice-call`

URL แบบ loopback และส่วนตัวไม่ถูกต้องสำหรับ callback ของผู้ให้บริการโทรศัพท์ อย่าใช้
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

สำหรับการพัฒนาในเครื่อง ให้ใช้ tunnel หรือ Tailscale exposure แทน URL โฮสต์
ส่วนตัว:

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

จากนั้นรีสตาร์ตหรือโหลด Gateway ใหม่และรัน:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` เป็นการตรวจสอบความพร้อมเท่านั้นโดยค่าเริ่มต้น หากต้องการ dry-run
หมายเลขเฉพาะ:

```bash
openclaw voicecall smoke --to "+15555550123"
```

เพิ่ม `--yes` เฉพาะเมื่อคุณตั้งใจจะโทรแจ้งเตือนขาออกแบบสด:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### สาย Twilio เริ่มแล้วแต่ไม่เคยเข้าสู่การประชุม

ยืนยันว่าอีเวนต์ Meet เปิดเผยรายละเอียดการโทรเข้าโทรศัพท์ ส่งหมายเลขโทรเข้า
และ PIN ที่ถูกต้อง หรือกำหนดลำดับ DTMF แบบกำหนดเอง:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

ใช้ `w` นำหน้าหรือจุลภาคใน `--dtmf-sequence` หากผู้ให้บริการต้องการการหยุดพัก
ก่อนป้อน PIN

หากสร้างสายโทรศัพท์แล้วแต่รายชื่อผู้เข้าร่วม Meet ไม่เคยแสดงผู้เข้าร่วมแบบโทรเข้า:

- รัน `openclaw googlemeet doctor <session-id>` เพื่อยืนยัน ID สาย Twilio
  ที่มอบหมายไว้ ตรวจว่า DTMF เข้าคิวแล้วหรือไม่ และตรวจว่ามีการร้องขอคำทักทายแนะนำตัวหรือไม่
- รัน `openclaw voicecall status --call-id <id>` และยืนยันว่าสายยังคงใช้งานอยู่
- รัน `openclaw voicecall tail` และตรวจว่า Webhook ของ Twilio มาถึง Gateway
- รัน `openclaw logs --follow` และมองหาลำดับ Twilio Meet: Google
  Meet มอบหมายการเข้าร่วม, Voice Call เริ่มขาโทรศัพท์, Google Meet รอ
  `voiceCall.dtmfDelayMs`, ส่ง DTMF ด้วย `voicecall.dtmf`, รอ
  `voiceCall.postDtmfSpeechDelayMs` จากนั้นร้องขอคำพูดแนะนำตัวด้วย
  `voicecall.speak`
- รัน `openclaw googlemeet setup --transport twilio` อีกครั้ง; ต้องมีการตรวจสอบการตั้งค่า
  เป็นสีเขียว แต่ไม่ได้พิสูจน์ว่าลำดับ PIN การประชุมถูกต้อง
- ยืนยันว่าหมายเลขโทรเข้าเป็นของคำเชิญและภูมิภาค Meet เดียวกันกับ PIN
- เพิ่ม `voiceCall.dtmfDelayMs` หาก Meet รับสายช้า หรือบันทึกถอดเสียงของสาย
  ยังแสดงพรอมป์ให้ป้อน PIN หลังจากส่ง DTMF แล้ว
- หากผู้เข้าร่วมเข้าร่วมแล้วแต่คุณไม่ได้ยินคำทักทาย ให้ตรวจ
  `openclaw logs --follow` เพื่อดูคำขอ `voicecall.speak` หลัง DTMF และ
  การเล่น TTS แบบ media-stream หรือ fallback `<Say>` ของ Twilio หากบันทึกถอดเสียงของสาย
  ยังมี "enter the meeting PIN" แสดงว่าขาโทรศัพท์ยังไม่ได้เข้าห้อง Meet
  ดังนั้นผู้เข้าร่วมการประชุมจะยังไม่ได้ยินเสียงพูด

หาก Webhook ไม่มาถึง ให้ดีบัก Voice Call Plugin ก่อน: ผู้ให้บริการต้อง
เข้าถึง `plugins.entries.voice-call.config.publicUrl` หรือ tunnel ที่กำหนดค่าไว้ได้
ดู [การแก้ปัญหาการโทรด้วยเสียง](/th/plugins/voice-call#troubleshooting)

## หมายเหตุ

API สื่ออย่างเป็นทางการของ Google Meet เน้นการรับสื่อ ดังนั้นการพูดเข้าไปในสาย Meet
ยังคงต้องมีเส้นทางของผู้เข้าร่วม Plugin นี้ทำให้ขอบเขตนั้นมองเห็นได้ชัดเจน:
Chrome จัดการการเข้าร่วมผ่านเบราว์เซอร์และการกำหนดเส้นทางเสียงภายในเครื่อง; Twilio จัดการ
การเข้าร่วมด้วยการโทรเข้า

โหมดตอบกลับด้วยเสียงของ Chrome ต้องใช้ `BlackHole 2ch` พร้อมอย่างใดอย่างหนึ่งต่อไปนี้:

- `chrome.audioInputCommand` พร้อม `chrome.audioOutputCommand`: OpenClaw เป็นเจ้าของ
  bridge และ pipe เสียงใน `chrome.audioFormat` ระหว่างคำสั่งเหล่านั้นกับ
  ผู้ให้บริการที่เลือก โหมด agent ใช้การถอดเสียงแบบเรียลไทม์ร่วมกับ TTS ปกติ;
  โหมด bidi ใช้ผู้ให้บริการเสียงแบบเรียลไทม์ เส้นทาง Chrome เริ่มต้นคือ 24 kHz
  PCM16; 8 kHz G.711 mu-law ยังคงพร้อมใช้งานสำหรับคู่คำสั่งรุ่นเดิม
- `chrome.audioBridgeCommand`: คำสั่ง bridge ภายนอกเป็นเจ้าของเส้นทางเสียงภายในเครื่อง
  ทั้งหมด และต้องออกหลังจากเริ่มหรือยืนยัน daemon ของตัวเองแล้ว รายการนี้ใช้ได้เฉพาะกับ
  `bidi` เพราะโหมด `agent` ต้องเข้าถึงคู่คำสั่งโดยตรงสำหรับ TTS

เพื่อให้ได้เสียง duplex ที่สะอาด ให้กำหนดเส้นทางเอาต์พุต Meet และไมโครโฟน Meet ผ่าน
อุปกรณ์เสมือนแยกกัน หรือกราฟอุปกรณ์เสมือนแบบ Loopback-style อุปกรณ์ BlackHole เดียวที่ใช้ร่วมกัน
อาจสะท้อนเสียงผู้เข้าร่วมคนอื่นกลับเข้าไปในสายได้

เมื่อใช้ bridge Chrome แบบคู่คำสั่ง `chrome.bargeInInputCommand` สามารถฟัง
ไมโครโฟนภายในเครื่องแยกต่างหากและล้างเสียงเล่นกลับของผู้ช่วยเมื่อมนุษย์เริ่ม
พูด วิธีนี้ทำให้เสียงพูดของมนุษย์มาก่อนเอาต์พุตของผู้ช่วย แม้เมื่ออินพุต
BlackHole loopback ที่ใช้ร่วมกันถูกระงับชั่วคราวระหว่างการเล่นกลับของผู้ช่วย
เช่นเดียวกับ `chrome.audioInputCommand` และ `chrome.audioOutputCommand` รายการนี้เป็น
คำสั่งภายในเครื่องที่ผู้ปฏิบัติงานกำหนดค่า ใช้เส้นทางคำสั่งที่เชื่อถือได้อย่างชัดเจนหรือ
รายการอาร์กิวเมนต์ และอย่าชี้ไปยังสคริปต์จากตำแหน่งที่ไม่น่าเชื่อถือ

`googlemeet speak` จะทริกเกอร์ bridge เสียงตอบกลับที่ใช้งานอยู่สำหรับเซสชัน Chrome
`googlemeet leave` จะหยุด bridge นั้น สำหรับเซสชัน Twilio ที่มอบหมายผ่าน Voice Call Plugin,
`leave` จะวางสายการโทรด้วยเสียงเบื้องหลังด้วย
ใช้ `googlemeet end-active-conference` เมื่อคุณต้องการปิด
การประชุม Google Meet ที่ใช้งานอยู่สำหรับพื้นที่ที่จัดการด้วย API ด้วย

## ที่เกี่ยวข้อง

- [Voice Call Plugin](/th/plugins/voice-call)
- [โหมดพูดคุย](/th/nodes/talk)
- [การสร้าง Plugin](/th/plugins/building-plugins)
