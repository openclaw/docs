---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw เข้าร่วมการประชุม Google Meet
    - คุณต้องการให้เอเจนต์ OpenClaw สร้างการโทร Google Meet ใหม่
    - คุณกำลังกำหนดค่า Chrome, โหนด Chrome หรือ Twilio เป็นทรานสปอร์ตของ Google Meet
summary: 'Google Meet Plugin: เข้าร่วม URL ของ Meet ที่ระบุอย่างชัดเจนผ่าน Chrome หรือ Twilio พร้อมค่าเริ่มต้นสำหรับเสียงแบบเรียลไทม์'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-02T10:23:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dc515382d2cc7beacaf18a50b75cb0f4eda3038cfd8efe73ea3ce7b5007bc43
    source_path: plugins/google-meet.md
    workflow: 16
---

การรองรับผู้เข้าร่วม Google Meet สำหรับ OpenClaw — Plugin ออกแบบมาให้ชัดเจนโดยตั้งใจ:

- จะเข้าร่วมเฉพาะ URL `https://meet.google.com/...` ที่ระบุอย่างชัดเจนเท่านั้น
- สามารถสร้างพื้นที่ Meet ใหม่ผ่าน Google Meet API แล้วเข้าร่วม URL ที่ส่งคืนมา
- `realtime` voice เป็นโหมดเริ่มต้น
- Realtime voice สามารถเรียกกลับเข้าไปยังเอเจนต์ OpenClaw เต็มรูปแบบเมื่อจำเป็นต้องใช้การให้เหตุผลที่ลึกขึ้นหรือเครื่องมือ
- เอเจนต์เลือกพฤติกรรมการเข้าร่วมด้วย `mode`: ใช้ `realtime` สำหรับการฟัง/พูดตอบกลับแบบสด หรือ `transcribe` เพื่อเข้าร่วม/ควบคุมเบราว์เซอร์โดยไม่มีสะพานเสียง realtime
- การยืนยันตัวตนเริ่มจาก Google OAuth ส่วนบุคคลหรือโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้อยู่แล้ว
- ไม่มีการประกาศความยินยอมอัตโนมัติ
- แบ็กเอนด์เสียงเริ่มต้นของ Chrome คือ `BlackHole 2ch`
- Chrome สามารถรันในเครื่องหรือบนโฮสต์ node ที่จับคู่ไว้
- Twilio รับหมายเลขโทรเข้า พร้อม PIN หรือชุดลำดับ DTMF ที่ไม่บังคับ; ไม่สามารถโทรไปยัง URL ของ Meet โดยตรงได้
- คำสั่ง CLI คือ `googlemeet`; `meet` ถูกสงวนไว้สำหรับเวิร์กโฟลว์การประชุมทางไกลของเอเจนต์ที่กว้างกว่า

## เริ่มต้นอย่างรวดเร็ว

ติดตั้ง dependency เสียงในเครื่องและกำหนดค่าผู้ให้บริการ realtime voice แบ็กเอนด์ OpenAI เป็นค่าเริ่มต้น; Google Gemini Live ก็ใช้ได้กับ `realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` ติดตั้งอุปกรณ์เสียงเสมือน `BlackHole 2ch` ตัวติดตั้งของ Homebrew ต้องรีบูตก่อนที่ macOS จะแสดงอุปกรณ์:

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

เอาต์พุตการตั้งค่าถูกออกแบบให้อ่านได้โดยเอเจนต์และรับรู้โหมด โดยรายงานโปรไฟล์ Chrome, การตรึง node และสำหรับการเข้าร่วม Chrome แบบ realtime จะรายงานสะพานเสียง BlackHole/SoX และการตรวจสอบ intro realtime แบบหน่วงเวลา สำหรับการเข้าร่วมแบบสังเกตการณ์เท่านั้น ให้ตรวจสอบ transport เดียวกันด้วย `--mode transcribe`; โหมดนั้นจะข้ามข้อกำหนดเบื้องต้นของเสียง realtime เพราะไม่ได้ฟังผ่านหรือพูดผ่านสะพาน:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

เมื่อกำหนดค่าการมอบหมายให้ Twilio แล้ว การตั้งค่าจะรายงานด้วยว่า Plugin `voice-call`, ข้อมูลประจำตัว Twilio และการเปิดเผย Webhook สาธารณะพร้อมหรือไม่ ให้ถือการตรวจสอบใดๆ ที่เป็น `ok: false` เป็นตัวขวางสำหรับ transport และโหมดที่ถูกตรวจสอบ ก่อนขอให้เอเจนต์เข้าร่วม ใช้ `openclaw googlemeet setup --json` สำหรับสคริปต์หรือเอาต์พุตที่อ่านได้โดยเครื่อง ใช้ `--transport chrome`, `--transport chrome-node` หรือ `--transport twilio` เพื่อตรวจสอบ transport เฉพาะล่วงหน้าก่อนที่เอเจนต์จะลองใช้

สำหรับ Twilio ให้ตรวจสอบ transport ล่วงหน้าอย่างชัดเจนเสมอเมื่อ transport เริ่มต้นคือ Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

วิธีนี้จะจับการเชื่อมต่อ `voice-call` ที่ขาดหาย ข้อมูลประจำตัว Twilio หรือการเปิดเผย Webhook ที่เข้าถึงไม่ได้ ก่อนที่เอเจนต์จะพยายามโทรเข้าการประชุม

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

เครื่องมือ `google_meet` สำหรับเอเจนต์ยังคงพร้อมใช้งานบนโฮสต์ที่ไม่ใช่ macOS สำหรับโฟลว์ artifact, calendar, setup, transcribe, Twilio และ `chrome-node` การดำเนินการ realtime ของ Chrome ในเครื่องจะถูกบล็อกบนโฮสต์เหล่านั้น เพราะเส้นทางเสียง Chrome realtime ที่รวมมาด้วยปัจจุบันขึ้นกับ `BlackHole 2ch` บน macOS บน Linux ให้ใช้ `mode: "transcribe"`, การโทรเข้า Twilio หรือโฮสต์ `chrome-node` บน macOS สำหรับการเข้าร่วม Chrome แบบ realtime

สร้างการประชุมใหม่และเข้าร่วม:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

สำหรับห้องที่สร้างผ่าน API ให้ใช้ Google Meet `SpaceConfig.accessType` เมื่อคุณต้องการให้นโยบายไม่ต้องเคาะเข้าห้องชัดเจน แทนที่จะสืบทอดจากค่าเริ่มต้นของบัญชี Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` อนุญาตให้ทุกคนที่มี URL ของ Meet เข้าร่วมได้โดยไม่ต้องเคาะ `TRUSTED` อนุญาตให้ผู้ใช้ที่เชื่อถือได้ขององค์กรโฮสต์ ผู้ใช้ภายนอกที่ได้รับเชิญ และผู้ใช้ที่โทรเข้าเข้าร่วมได้โดยไม่ต้องเคาะ `RESTRICTED` จำกัดการเข้าห้องโดยไม่ต้องเคาะไว้เฉพาะผู้ได้รับเชิญ การตั้งค่าเหล่านี้ใช้กับเส้นทางการสร้างอย่างเป็นทางการของ Google Meet API เท่านั้น ดังนั้นต้องกำหนดค่าข้อมูลประจำตัว OAuth

หากคุณยืนยันตัวตน Google Meet ก่อนที่ตัวเลือกนี้จะพร้อมใช้งาน ให้รัน `openclaw googlemeet auth login --json` อีกครั้งหลังจากเพิ่ม scope `meetings.space.settings` ในหน้าจอความยินยอม Google OAuth ของคุณ

สร้างเฉพาะ URL โดยไม่เข้าร่วม:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` มีสองเส้นทาง:

- การสร้างผ่าน API: ใช้เมื่อกำหนดค่าข้อมูลประจำตัว Google Meet OAuth ไว้ เส้นทางนี้กำหนดผลได้แน่นอนที่สุดและไม่ขึ้นกับสถานะ UI ของเบราว์เซอร์
- ทางเลือกสำรองผ่านเบราว์เซอร์: ใช้เมื่อไม่มีข้อมูลประจำตัว OAuth OpenClaw ใช้ node Chrome ที่ตรึงไว้ เปิด `https://meet.google.com/new` รอให้ Google เปลี่ยนเส้นทางไปยัง URL รหัสการประชุมจริง แล้วส่งคืน URL นั้น เส้นทางนี้ต้องการให้โปรไฟล์ Chrome ของ OpenClaw บน node ลงชื่อเข้าใช้ Google อยู่แล้ว ระบบอัตโนมัติของเบราว์เซอร์จัดการพรอมป์ไมโครโฟนครั้งแรกของ Meet เอง พรอมป์นั้นไม่ถือเป็นความล้มเหลวในการเข้าสู่ระบบ Google
  โฟลว์เข้าร่วมและสร้างยังพยายามใช้แท็บ Meet ที่มีอยู่แล้วก่อนเปิดแท็บใหม่ การจับคู่จะไม่สนใจ query string ของ URL ที่ไม่เป็นอันตราย เช่น `authuser` ดังนั้นการลองใหม่ของเอเจนต์ควรโฟกัสการประชุมที่เปิดอยู่แล้วแทนที่จะสร้างแท็บ Chrome ที่สอง

เอาต์พุตของคำสั่ง/เครื่องมือมีฟิลด์ `source` (`api` หรือ `browser`) เพื่อให้เอเจนต์อธิบายได้ว่าใช้เส้นทางใด `create` จะเข้าร่วมการประชุมใหม่ตามค่าเริ่มต้นและส่งคืน `joined: true` พร้อมเซสชันการเข้าร่วม หากต้องการออกเพียง URL ให้ใช้ `create --no-join` บน CLI หรือส่ง `"join": false` ให้เครื่องมือ

หรือบอกเอเจนต์ว่า: "สร้าง Google Meet เข้าร่วมด้วย realtime voice และส่งลิงก์ให้ฉัน" เอเจนต์ควรเรียก `google_meet` ด้วย `action: "create"` แล้วแชร์ `meetingUri` ที่ส่งคืนมา

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

สำหรับการเข้าร่วมแบบสังเกตการณ์เท่านั้น/ควบคุมเบราว์เซอร์ ให้ตั้ง `"mode": "transcribe"` โหมดนี้จะไม่เริ่มสะพานโมเดล realtime แบบสองทาง ไม่ต้องใช้ BlackHole หรือ SoX และจะไม่พูดตอบกลับเข้าไปในการประชุม การเข้าร่วม Chrome ในโหมดนี้ยังหลีกเลี่ยงการให้สิทธิ์ไมโครโฟน/กล้องของ OpenClaw และหลีกเลี่ยงเส้นทาง Meet **ใช้ไมโครโฟน** หาก Meet แสดงหน้าคั่นสำหรับเลือกเสียง ระบบอัตโนมัติจะลองเส้นทางที่ไม่ใช้ไมโครโฟน และมิฉะนั้นจะรายงานการดำเนินการแบบแมนนวลแทนการเปิดไมโครโฟนในเครื่อง ในโหมด transcribe, transport Chrome ที่จัดการแล้วยังติดตั้งตัวสังเกต caption ของ Meet แบบ best-effort ด้วย `googlemeet status --json` และ `googlemeet doctor` แสดง `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` และส่วนท้าย `recentTranscript` สั้นๆ เพื่อให้ผู้ปฏิบัติงานบอกได้ว่าเบราว์เซอร์เข้าร่วมสายแล้วหรือไม่ และ caption ของ Meet กำลังสร้างข้อความหรือไม่
ใช้ `openclaw googlemeet test-listen <meet-url> --transport chrome-node` เมื่อคุณต้องการโพรบแบบใช่/ไม่ใช่: คำสั่งนี้เข้าร่วมในโหมด transcribe รอการเคลื่อนไหวของ caption หรือ transcript ใหม่ แล้วส่งคืน `listenVerified`, `listenTimedOut`, ฟิลด์การดำเนินการแบบแมนนวล และสถานะ caption ล่าสุด

ระหว่างเซสชัน realtime, สถานะ `google_meet` จะรวมสถานะสุขภาพของเบราว์เซอร์และสะพานเสียง เช่น `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamp อินพุต/เอาต์พุตล่าสุด ตัวนับ byte และสถานะปิดของสะพาน หากมีพรอมป์หน้า Meet ที่ปลอดภัยปรากฏขึ้น ระบบอัตโนมัติของเบราว์เซอร์จะจัดการเมื่อทำได้ การเข้าสู่ระบบ การรับเข้าของโฮสต์ และพรอมป์สิทธิ์ของเบราว์เซอร์/OS จะถูกรายงานเป็นการดำเนินการแบบแมนนวลพร้อมเหตุผลและข้อความเพื่อให้เอเจนต์ถ่ายทอดต่อ เซสชัน Chrome ที่จัดการแล้วจะปล่อย intro หรือวลีทดสอบเฉพาะหลังจากสถานะสุขภาพของเบราว์เซอร์รายงาน `inCall: true`; มิฉะนั้นสถานะจะรายงาน `speechReady: false` และความพยายามพูดจะถูกบล็อกแทนการแสร้งว่าเอเจนต์พูดเข้าไปในการประชุมแล้ว

การเข้าร่วม Chrome ในเครื่องใช้โปรไฟล์เบราว์เซอร์ OpenClaw ที่ลงชื่อเข้าใช้แล้ว โหมด realtime ต้องใช้ `BlackHole 2ch` สำหรับเส้นทางไมโครโฟน/ลำโพงที่ OpenClaw ใช้ สำหรับเสียงสองทางที่สะอาด ให้ใช้อุปกรณ์เสมือนแยกกันหรือกราฟแบบ Loopback; อุปกรณ์ BlackHole เดี่ยวเพียงพอสำหรับ smoke test แรก แต่อาจเกิด echo ได้

### Gateway ในเครื่อง + Chrome บน Parallels

คุณ **ไม่** ต้องมี OpenClaw Gateway เต็มรูปแบบหรือคีย์ model API ภายใน VM macOS เพียงเพื่อให้ VM เป็นเจ้าของ Chrome รัน Gateway และเอเจนต์ในเครื่อง แล้วรันโฮสต์ node ใน VM เปิดใช้ Plugin ที่รวมมาบน VM หนึ่งครั้งเพื่อให้ node โฆษณาคำสั่ง Chrome:

สิ่งที่รันในแต่ละที่:

- โฮสต์ Gateway: OpenClaw Gateway, พื้นที่ทำงานเอเจนต์, คีย์ model/API, ผู้ให้บริการ realtime และการกำหนดค่า Plugin Google Meet
- VM macOS ของ Parallels: OpenClaw CLI/โฮสต์ node, Google Chrome, SoX, BlackHole 2ch และโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้ Google
- ไม่จำเป็นใน VM: บริการ Gateway, การกำหนดค่าเอเจนต์, คีย์ OpenAI/GPT หรือการตั้งค่าผู้ให้บริการ model

ติดตั้ง dependency ของ VM:

```bash
brew install blackhole-2ch sox
```

รีบูต VM หลังติดตั้ง BlackHole เพื่อให้ macOS แสดง `BlackHole 2ch`:

```bash
sudo reboot
```

หลังรีบูต ตรวจสอบว่า VM มองเห็นอุปกรณ์เสียงและคำสั่ง SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

ติดตั้งหรืออัปเดต OpenClaw ใน VM แล้วเปิดใช้ Plugin ที่รวมมาไว้ที่นั่น:

```bash
openclaw plugins enable google-meet
```

เริ่มโฮสต์ node ใน VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

หาก `<gateway-host>` เป็น IP ของ LAN และคุณไม่ได้ใช้ TLS, node จะปฏิเสธ WebSocket แบบ plaintext เว้นแต่คุณจะเลือกใช้สำหรับเครือข่ายส่วนตัวที่เชื่อถือได้นั้น:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` เป็นสภาพแวดล้อมของ process ไม่ใช่การตั้งค่า `openclaw.json` `openclaw node install` จะเก็บไว้ในสภาพแวดล้อม LaunchAgent เมื่อมีอยู่ในคำสั่งติดตั้ง

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

สำหรับ smoke test แบบคำสั่งเดียวที่สร้างหรือใช้เซสชันซ้ำ พูดวลีที่รู้ล่วงหน้า และพิมพ์สถานะสุขภาพของเซสชัน:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

ระหว่างการเข้าร่วมแบบเรียลไทม์ ระบบอัตโนมัติของเบราว์เซอร์ OpenClaw จะกรอกชื่อผู้เข้าร่วม คลิก
เข้าร่วม/ขอเข้าร่วม และยอมรับตัวเลือก "Use microphone" ครั้งแรกของ Meet เมื่อพรอมต์นั้น
ปรากฏขึ้น ระหว่างการเข้าร่วมแบบสังเกตการณ์เท่านั้นหรือการสร้างการประชุมเฉพาะเบราว์เซอร์ ระบบจะ
ดำเนินต่อผ่านพรอมต์เดียวกันโดยไม่ใช้ไมโครโฟนเมื่อตัวเลือกนั้นพร้อมใช้งาน
หากโปรไฟล์เบราว์เซอร์ไม่ได้ลงชื่อเข้าใช้, Meet กำลังรอการอนุมัติจากผู้จัด,
Chrome ต้องการสิทธิ์ไมโครโฟน/กล้องสำหรับการเข้าร่วมแบบเรียลไทม์ หรือ Meet ค้างอยู่
ที่พรอมต์ที่ระบบอัตโนมัติแก้ไม่ได้ ผลลัพธ์ join/test-speech จะรายงาน
`manualActionRequired: true` พร้อม `manualActionReason` และ
`manualActionMessage` Agents ควรหยุดลองเข้าร่วมซ้ำ รายงานข้อความนั้นแบบตรงตัว
พร้อม `browserUrl`/`browserTitle` ปัจจุบัน และลองใหม่เฉพาะหลังจาก
การดำเนินการด้วยตนเองในเบราว์เซอร์เสร็จสมบูรณ์แล้ว

หากละเว้น `chromeNode.node` OpenClaw จะเลือกอัตโนมัติเฉพาะเมื่อมี Node ที่เชื่อมต่ออยู่
เพียงหนึ่งรายการที่ประกาศทั้ง `googlemeet.chrome` และการควบคุมเบราว์เซอร์ หากมี Node
ที่รองรับหลายรายการเชื่อมต่ออยู่ ให้ตั้ง `chromeNode.node` เป็น id ของ Node,
ชื่อที่แสดง หรือ IP ระยะไกล

การตรวจสอบความล้มเหลวที่พบบ่อย:

- `Configured Google Meet node ... is not usable: offline`: Node ที่ปักหมุดไว้
  เป็นที่รู้จักของ Gateway แต่ไม่พร้อมใช้งาน Agents ควรมอง Node นั้นเป็น
  สถานะสำหรับวินิจฉัย ไม่ใช่เป็นโฮสต์ Chrome ที่ใช้งานได้ และรายงานตัวบล็อกการตั้งค่า
  แทนที่จะถอยกลับไปใช้การขนส่งอื่น เว้นแต่ผู้ใช้จะขอเช่นนั้น
- `No connected Google Meet-capable node`: เริ่ม `openclaw node run` ใน VM,
  อนุมัติการจับคู่ และตรวจสอบให้แน่ใจว่าได้รัน `openclaw plugins enable google-meet` และ
  `openclaw plugins enable browser` ใน VM แล้ว นอกจากนี้ให้ยืนยันว่า
  โฮสต์ Gateway อนุญาตคำสั่ง Node ทั้งสองรายการด้วย
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`
- `BlackHole 2ch audio device not found`: ติดตั้ง `blackhole-2ch` บนโฮสต์
  ที่กำลังตรวจสอบ และรีบูตก่อนใช้เสียง Chrome แบบโลคัล
- `BlackHole 2ch audio device not found on the node`: ติดตั้ง `blackhole-2ch`
  ใน VM และรีบูต VM
- Chrome เปิดขึ้นแต่เข้าร่วมไม่ได้: ลงชื่อเข้าใช้โปรไฟล์เบราว์เซอร์ภายใน VM หรือ
  ตั้งค่า `chrome.guestName` ไว้สำหรับการเข้าร่วมแบบผู้เข้าร่วม Guest auto-join ใช้ระบบอัตโนมัติของ
  เบราว์เซอร์ OpenClaw ผ่านพร็อกซีเบราว์เซอร์ของ Node; ตรวจสอบให้แน่ใจว่าคอนฟิกเบราว์เซอร์ของ Node
  ชี้ไปที่โปรไฟล์ที่คุณต้องการ เช่น
  `browser.defaultProfile: "user"` หรือโปรไฟล์ named existing-session
- แท็บ Meet ซ้ำ: เปิดใช้ `chrome.reuseExistingTab: true` ไว้ OpenClaw
  จะเปิดใช้งานแท็บที่มีอยู่สำหรับ URL Meet เดียวกันก่อนเปิดแท็บใหม่ และ
  การสร้างการประชุมผ่านเบราว์เซอร์จะใช้แท็บ `https://meet.google.com/new`
  หรือแท็บพรอมต์บัญชี Google ที่กำลังดำเนินอยู่ซ้ำก่อนเปิดอีกแท็บหนึ่ง
- ไม่มีเสียง: ใน Meet ให้กำหนดเส้นทางเสียงไมโครโฟน/ลำโพงผ่านเส้นทางอุปกรณ์เสียงเสมือน
  ที่ OpenClaw ใช้; ใช้อุปกรณ์เสมือนแยกกันหรือการกำหนดเส้นทางแบบ Loopback
  เพื่อเสียงดูเพล็กซ์ที่สะอาด

## หมายเหตุการติดตั้ง

ค่าเริ่มต้น Chrome แบบเรียลไทม์ใช้เครื่องมือภายนอกสองรายการ:

- `sox`: ยูทิลิตีเสียงแบบบรรทัดคำสั่ง Plugin ใช้คำสั่งอุปกรณ์ CoreAudio
  แบบชัดเจนสำหรับบริดจ์เสียง PCM16 24 kHz ค่าเริ่มต้น
- `blackhole-2ch`: ไดรเวอร์เสียงเสมือน macOS สร้างอุปกรณ์เสียง `BlackHole 2ch`
  ที่ Chrome/Meet สามารถกำหนดเส้นทางผ่านได้

OpenClaw ไม่ได้รวมแพ็กเกจหรือแจกจ่ายแพ็กเกจใดแพ็กเกจหนึ่ง เอกสารขอให้ผู้ใช้
ติดตั้งเป็น dependency ของโฮสต์ผ่าน Homebrew SoX อยู่ภายใต้สัญญาอนุญาต
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole เป็น GPL-3.0 หากคุณสร้าง
ตัวติดตั้งหรือแอปพลายแอนซ์ที่รวม BlackHole กับ OpenClaw ให้ตรวจสอบเงื่อนไขสัญญาอนุญาต
ต้นทางของ BlackHole หรือขอใบอนุญาตแยกต่างหากจาก Existential Audio

## การขนส่ง

### Chrome

การขนส่ง Chrome เปิด URL Meet ผ่านการควบคุมเบราว์เซอร์ OpenClaw และเข้าร่วม
ด้วยโปรไฟล์เบราว์เซอร์ OpenClaw ที่ลงชื่อเข้าใช้อยู่ บน macOS Plugin จะตรวจสอบ
`BlackHole 2ch` ก่อนเริ่มทำงาน หากกำหนดค่าไว้ ระบบจะรันคำสั่งตรวจสุขภาพบริดจ์เสียง
และคำสั่งเริ่มต้นก่อนเปิด Chrome ด้วย ใช้ `chrome` เมื่อ
Chrome/เสียงอยู่บนโฮสต์ Gateway; ใช้ `chrome-node` เมื่อ Chrome/เสียงอยู่
บน Node ที่จับคู่แล้ว เช่น Parallels macOS VM สำหรับ Chrome แบบโลคัล ให้เลือก
โปรไฟล์ด้วย `browser.defaultProfile`; `chrome.browserProfile` จะถูกส่งต่อไปยัง
โฮสต์ `chrome-node`

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

กำหนดเส้นทางเสียงไมโครโฟนและลำโพง Chrome ผ่านบริดจ์เสียง OpenClaw แบบโลคัล
หากไม่ได้ติดตั้ง `BlackHole 2ch` การเข้าร่วมจะล้มเหลวด้วยข้อผิดพลาดการตั้งค่า
แทนที่จะเข้าร่วมแบบเงียบ ๆ โดยไม่มีเส้นทางเสียง

### Twilio

การขนส่ง Twilio เป็นแผนการโทรแบบเข้มงวดที่มอบหมายให้ Voice Call Plugin
ระบบจะไม่แยกวิเคราะห์หน้า Meet เพื่อหาเบอร์โทรศัพท์

ใช้ตัวเลือกนี้เมื่อไม่สามารถเข้าร่วมผ่าน Chrome ได้ หรือคุณต้องการทางเลือกสำรอง
แบบโทรเข้า Google Meet ต้องแสดงหมายเลขโทรเข้าและ PIN สำหรับ
การประชุม; OpenClaw จะไม่ค้นหาข้อมูลเหล่านั้นจากหน้า Meet

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
ความลับออกจาก `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

รีสตาร์ตหรือโหลด Gateway ใหม่หลังจากเปิดใช้ `voice-call`; การเปลี่ยนแปลงคอนฟิก Plugin
จะไม่ปรากฏในกระบวนการ Gateway ที่กำลังทำงานอยู่จนกว่าจะโหลดใหม่

จากนั้นตรวจสอบ:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

เมื่อเชื่อมต่อการมอบหมาย Twilio แล้ว `googlemeet setup` จะรวมการตรวจสอบ
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

OAuth เป็นทางเลือกสำหรับการสร้างลิงก์ Meet เพราะ `googlemeet create` สามารถถอยกลับไปใช้
ระบบอัตโนมัติของเบราว์เซอร์ได้ กำหนดค่า OAuth เมื่อคุณต้องการการสร้างผ่าน API อย่างเป็นทางการ,
การแปลง space หรือการตรวจสอบ preflight ของ Meet Media API

การเข้าถึง Google Meet API ใช้ OAuth ของผู้ใช้: สร้างไคลเอ็นต์ OAuth ของ Google Cloud,
ขอ scope ที่จำเป็น, อนุญาตบัญชี Google จากนั้นจัดเก็บ
refresh token ที่ได้ในคอนฟิก Google Meet Plugin หรือระบุ
ตัวแปรสภาพแวดล้อม `OPENCLAW_GOOGLE_MEET_*`

OAuth ไม่ได้แทนที่เส้นทางการเข้าร่วมผ่าน Chrome การขนส่ง Chrome และ Chrome-node
ยังคงเข้าร่วมผ่านโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้อยู่, BlackHole/SoX และ Node
ที่เชื่อมต่อเมื่อคุณใช้การเข้าร่วมผ่านเบราว์เซอร์ OAuth ใช้เฉพาะสำหรับเส้นทาง
Google Meet API อย่างเป็นทางการ: สร้าง meeting spaces, แปลง spaces และรัน
การตรวจสอบ preflight ของ Meet Media API

### สร้างข้อมูลประจำตัว Google

ใน Google Cloud Console:

1. สร้างหรือเลือกโปรเจกต์ Google Cloud
2. เปิดใช้ **Google Meet REST API** สำหรับโปรเจกต์นั้น
3. กำหนดค่าหน้าจอคำยินยอม OAuth
   - **Internal** ง่ายที่สุดสำหรับองค์กร Google Workspace
   - **External** ใช้ได้กับการตั้งค่าส่วนตัว/ทดสอบ; ขณะที่แอปอยู่ใน Testing
     ให้เพิ่มบัญชี Google แต่ละบัญชีที่จะอนุญาตแอปเป็น test user
4. เพิ่ม scope ที่ OpenClaw ขอ:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. สร้าง OAuth client ID
   - ประเภทแอปพลิเคชัน: **Web application**
   - URI เปลี่ยนเส้นทางที่ได้รับอนุญาต:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. คัดลอก client ID และ client secret

`meetings.space.created` จำเป็นสำหรับ Google Meet `spaces.create`
`meetings.space.readonly` ช่วยให้ OpenClaw แปลง URL/โค้ด Meet เป็น spaces ได้
`meetings.space.settings` ช่วยให้ OpenClaw ส่งการตั้งค่า `SpaceConfig` เช่น
`accessType` ระหว่างการสร้างห้องผ่าน API
`meetings.conference.media.readonly` ใช้สำหรับ preflight ของ Meet Media API และงานสื่อ;
Google อาจต้องให้ลงทะเบียน Developer Preview สำหรับการใช้ Media API จริง
หากคุณต้องการแค่การเข้าร่วมผ่าน Chrome ที่ใช้เบราว์เซอร์ ให้ข้าม OAuth ไปทั้งหมด

### ออก refresh token

กำหนดค่า `oauth.clientId` และเลือกกำหนด `oauth.clientSecret` หรือส่งผ่านเป็น
ตัวแปรสภาพแวดล้อม จากนั้นรัน:

```bash
openclaw googlemeet auth login --json
```

คำสั่งจะพิมพ์บล็อกคอนฟิก `oauth` พร้อม refresh token โดยใช้ PKCE,
callback localhost ที่ `http://localhost:8085/oauth2callback` และขั้นตอน
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

จัดเก็บอ็อบเจ็กต์ `oauth` ใต้คอนฟิก Google Meet Plugin:

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
หากมีทั้งค่าคอนฟิกและค่าสภาพแวดล้อม Plugin จะ resolve คอนฟิก
ก่อน แล้วจึงใช้สภาพแวดล้อมเป็น fallback

คำยินยอม OAuth รวมการสร้าง Meet space, สิทธิ์อ่าน Meet space และสิทธิ์อ่าน
สื่อการประชุม Meet หากคุณยืนยันตัวตนก่อนมีการรองรับการสร้างการประชุม
ให้รัน `openclaw googlemeet auth login --json` อีกครั้งเพื่อให้ refresh
token มี scope `meetings.space.created`

### ตรวจสอบ OAuth ด้วย doctor

รัน OAuth doctor เมื่อคุณต้องการตรวจสุขภาพแบบรวดเร็วที่ไม่เปิดเผยความลับ:

```bash
openclaw googlemeet doctor --oauth --json
```

คำสั่งนี้จะไม่โหลด runtime ของ Chrome หรือจำเป็นต้องมี Node Chrome ที่เชื่อมต่ออยู่
คำสั่งตรวจสอบว่ามีคอนฟิก OAuth และ refresh token สามารถออก access
token ได้ รายงาน JSON จะมีเฉพาะฟิลด์สถานะ เช่น `ok`, `configured`,
`tokenSource`, `expiresAt` และข้อความตรวจสอบ; จะไม่พิมพ์ access
token, refresh token หรือ client secret

ผลลัพธ์ที่พบบ่อย:

| การตรวจสอบ          | ความหมาย                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | มี `oauth.clientId` พร้อม `oauth.refreshToken` หรือ access token ที่แคชไว้             |
| `oauth-token`        | access token ที่แคชไว้ยังใช้ได้ หรือ refresh token ออก access token ใหม่แล้ว           |
| `meet-spaces-get`    | การตรวจสอบ `--meeting` ทางเลือกแปลง Meet space ที่มีอยู่แล้วได้                         |
| `meet-spaces-create` | การตรวจสอบ `--create-space` ทางเลือกสร้าง Meet space ใหม่แล้ว                           |

หากต้องการพิสูจน์การเปิดใช้ Google Meet API และ scope `spaces.create` ด้วย ให้รัน
การตรวจสอบสร้างที่มีผลข้างเคียง:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` สร้าง Meet URL แบบใช้แล้วทิ้ง ใช้เมื่อต้องการยืนยันว่าโปรเจกต์ Google Cloud เปิดใช้ Meet API แล้ว และบัญชีที่ได้รับอนุญาตมี scope `meetings.space.created`

เพื่อพิสูจน์สิทธิ์อ่านสำหรับ meeting space ที่มีอยู่:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` และ `resolve-space` พิสูจน์สิทธิ์อ่านสำหรับ space ที่มีอยู่ซึ่งบัญชี Google ที่ได้รับอนุญาตสามารถเข้าถึงได้ `403` จากการตรวจสอบเหล่านี้มักหมายความว่า Google Meet REST API ถูกปิดใช้งาน, โทเค็นรีเฟรชที่ให้ความยินยอมแล้วไม่มี scope ที่จำเป็น, หรือบัญชี Google ไม่สามารถเข้าถึง Meet space นั้นได้ ข้อผิดพลาดเกี่ยวกับ refresh token หมายความว่าให้เรียก `openclaw googlemeet auth login
--json` อีกครั้ง แล้วจัดเก็บบล็อก `oauth` ใหม่

ไม่จำเป็นต้องใช้ข้อมูลรับรอง OAuth สำหรับ browser fallback ในโหมดนั้น การยืนยันตัวตนของ Google มาจากโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้อยู่บน Node ที่เลือก ไม่ได้มาจากการกำหนดค่า OpenClaw

ตัวแปรสภาพแวดล้อมเหล่านี้รองรับเป็น fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` หรือ `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` หรือ `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` หรือ
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` หรือ `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` หรือ `GOOGLE_MEET_PREVIEW_ACK`

แก้ URL, รหัส, หรือ `spaces/{id}` ของ Meet ผ่าน `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

เรียก preflight ก่อนทำงานกับสื่อ:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

แสดงรายการอาร์ติแฟกต์การประชุมและข้อมูลการเข้าร่วมหลังจาก Meet สร้างบันทึกการประชุมแล้ว:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

เมื่อใช้ `--meeting`, `artifacts` และ `attendance` จะใช้บันทึกการประชุมล่าสุดเป็นค่าเริ่มต้น ส่ง `--all-conference-records` เมื่อคุณต้องการทุกบันทึกที่ยังเก็บไว้สำหรับการประชุมนั้น

การค้นหา Calendar สามารถแก้ meeting URL จาก Google Calendar ก่อนอ่านอาร์ติแฟกต์ Meet ได้:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` ค้นหา Calendar `primary` ของวันนี้เพื่อหาเหตุการณ์ Calendar ที่มีลิงก์ Google Meet ใช้ `--event <query>` เพื่อค้นหาข้อความเหตุการณ์ที่ตรงกัน และ `--calendar <id>` สำหรับ Calendar ที่ไม่ใช่ primary การค้นหา Calendar ต้องการการเข้าสู่ระบบ OAuth ใหม่ที่รวม scope แบบอ่านอย่างเดียวสำหรับเหตุการณ์ Calendar
`calendar-events` แสดงตัวอย่างเหตุการณ์ Meet ที่ตรงกันและทำเครื่องหมายเหตุการณ์ที่ `latest`, `artifacts`, `attendance`, หรือ `export` จะเลือก

หากคุณรู้ conference record id อยู่แล้ว ให้ระบุโดยตรง:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

จบการประชุมที่ใช้งานอยู่สำหรับ space ที่สร้างด้วย API เมื่อคุณต้องการปิดห้องหลังการโทร:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

คำสั่งนี้เรียก Google Meet `spaces.endActiveConference` และต้องใช้ OAuth พร้อม scope `meetings.space.created` สำหรับ space ที่บัญชีที่ได้รับอนุญาตสามารถจัดการได้ OpenClaw รับอินพุตเป็น Meet URL, meeting code, หรือ `spaces/{id}` แล้วแก้เป็นทรัพยากร space ของ API ก่อนจบการประชุมที่ใช้งานอยู่
คำสั่งนี้แยกจาก `googlemeet leave`: `leave` หยุดการเข้าร่วมแบบ local/session ของ OpenClaw ขณะที่ `end-active-conference` ขอให้ Google Meet จบการประชุมที่ใช้งานอยู่สำหรับ space นั้น

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

`artifacts` ส่งคืนเมทาดาทาของบันทึกการประชุมพร้อมเมทาดาทาทรัพยากรของผู้เข้าร่วม, การบันทึก, transcript, รายการ transcript แบบมีโครงสร้าง, และ smart-note เมื่อ Google เปิดเผยให้กับการประชุมนั้น ใช้ `--no-transcript-entries` เพื่อข้ามการค้นหารายการสำหรับการประชุมขนาดใหญ่ `attendance` ขยายผู้เข้าร่วมเป็นแถว participant-session พร้อมเวลา first/last seen, ระยะเวลารวมของ session, แฟล็กมาสาย/ออกก่อน, และรวมทรัพยากรผู้เข้าร่วมที่ซ้ำกันตามผู้ใช้ที่ลงชื่อเข้าใช้หรือชื่อที่แสดง ส่ง `--no-merge-duplicates` เพื่อแยกทรัพยากรผู้เข้าร่วมดิบไว้ต่างหาก, `--late-after-minutes` เพื่อปรับการตรวจจับการมาสาย, และ `--early-before-minutes` เพื่อปรับการตรวจจับการออกก่อน

`export` เขียนโฟลเดอร์ที่มี `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json`, และ `manifest.json`
`manifest.json` บันทึกอินพุตที่เลือก, ตัวเลือกการ export, บันทึกการประชุม, ไฟล์เอาต์พุต, จำนวน, แหล่งที่มาของโทเค็น, เหตุการณ์ Calendar เมื่อมีการใช้, และคำเตือนการดึงข้อมูลบางส่วน ส่ง `--zip` เพื่อเขียนอาร์ไคฟ์พกพาไว้ข้างโฟลเดอร์ด้วย ส่ง `--include-doc-bodies` เพื่อ export ข้อความ Google Docs ของ transcript และ smart-note ที่ลิงก์ผ่าน Google Drive `files.export`; ซึ่งต้องมีการเข้าสู่ระบบ OAuth ใหม่ที่รวม scope แบบอ่านอย่างเดียวของ Drive Meet หากไม่มี `--include-doc-bodies`, การ export จะรวมเฉพาะเมทาดาทาของ Meet และรายการ transcript แบบมีโครงสร้าง หาก Google ส่งคืนความล้มเหลวบางส่วนของอาร์ติแฟกต์ เช่น ข้อผิดพลาดในการแสดงรายการ smart-note, รายการ transcript, หรือเนื้อหาเอกสาร Drive, summary และ manifest จะเก็บคำเตือนไว้แทนที่จะทำให้การ export ทั้งหมดล้มเหลว
ใช้ `--dry-run` เพื่อดึงข้อมูลอาร์ติแฟกต์/การเข้าร่วมชุดเดียวกันและพิมพ์ manifest JSON โดยไม่สร้างโฟลเดอร์หรือ ZIP ซึ่งมีประโยชน์ก่อนเขียนการ export ขนาดใหญ่ หรือเมื่อเอเจนต์ต้องการเฉพาะจำนวน, บันทึกที่เลือก, และคำเตือน

เอเจนต์ยังสามารถสร้าง bundle เดียวกันผ่านเครื่องมือ `google_meet` ได้:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

ตั้งค่า `"dryRun": true` เพื่อส่งคืนเฉพาะ export manifest และข้ามการเขียนไฟล์

เอเจนต์ยังสามารถสร้างห้องที่รองรับด้วย API พร้อมนโยบายการเข้าถึงที่ชัดเจนได้:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
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

สำหรับการตรวจสอบแบบฟังก่อน เอเจนต์ควรใช้ `test_listen` ก่อนอ้างว่าการประชุมมีประโยชน์:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

เรียก live smoke ที่มีการป้องกันกับการประชุมจริงที่ยังเก็บไว้:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

เรียกการตรวจสอบเบราว์เซอร์แบบ listen-first แบบ live กับการประชุมที่มีคนจะพูดและมีคำบรรยาย Meet พร้อมใช้งาน:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

สภาพแวดล้อม live smoke:

- `OPENCLAW_LIVE_TEST=1` เปิดใช้การทดสอบ live ที่มีการป้องกัน
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` ชี้ไปยัง Meet URL, รหัส, หรือ
  `spaces/{id}` ที่ยังเก็บไว้
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID` ระบุ OAuth
  client id
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN` ระบุ
  refresh token
- ไม่บังคับ: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, และ
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ใช้ชื่อ fallback เดียวกัน
  โดยไม่มีคำนำหน้า `OPENCLAW_`

live smoke พื้นฐานสำหรับอาร์ติแฟกต์/การเข้าร่วมต้องใช้
`https://www.googleapis.com/auth/meetings.space.readonly` และ
`https://www.googleapis.com/auth/meetings.conference.media.readonly` การค้นหา Calendar ต้องใช้ `https://www.googleapis.com/auth/calendar.events.readonly` การ export เนื้อหาเอกสาร Drive ต้องใช้
`https://www.googleapis.com/auth/drive.meet.readonly`

สร้าง Meet space ใหม่:

```bash
openclaw googlemeet create
```

คำสั่งนี้พิมพ์ `meeting uri`, แหล่งที่มา, และ join session ใหม่ เมื่อมีข้อมูลรับรอง OAuth จะใช้ Google Meet API อย่างเป็นทางการ หากไม่มีข้อมูลรับรอง OAuth จะใช้โปรไฟล์เบราว์เซอร์ที่ลงชื่อเข้าใช้ของ Node Chrome ที่ปักหมุดเป็น fallback เอเจนต์สามารถใช้เครื่องมือ `google_meet` พร้อม `action: "create"` เพื่อสร้างและเข้าร่วมในขั้นตอนเดียว สำหรับการสร้างเฉพาะ URL ให้ส่ง `"join": false`

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

หาก browser fallback พบการเข้าสู่ระบบ Google หรือบล็อกเกอร์สิทธิ์ของ Meet ก่อนที่จะสร้าง URL ได้ เมธอด Gateway จะส่งคืนการตอบสนองที่ล้มเหลว และเครื่องมือ `google_meet` จะส่งคืนรายละเอียดแบบมีโครงสร้างแทนสตริงธรรมดา:

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

เมื่อเอเจนต์เห็น `manualActionRequired: true` ควรรายงาน `manualActionMessage` พร้อมบริบท Node/แท็บของเบราว์เซอร์ แล้วหยุดเปิดแท็บ Meet ใหม่จนกว่าผู้ปฏิบัติงานจะทำขั้นตอนในเบราว์เซอร์เสร็จ

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

การสร้าง Meet จะเข้าร่วมเป็นค่าเริ่มต้น การขนส่งแบบ Chrome หรือ Chrome-node ยังต้องใช้โปรไฟล์ Google Chrome ที่ลงชื่อเข้าใช้อยู่เพื่อเข้าร่วมผ่านเบราว์เซอร์ หากโปรไฟล์ลงชื่อออกอยู่ OpenClaw จะรายงาน `manualActionRequired: true` หรือข้อผิดพลาด browser fallback และขอให้ผู้ปฏิบัติงานทำการเข้าสู่ระบบ Google ให้เสร็จก่อนลองใหม่

ตั้งค่า `preview.enrollmentAcknowledged: true` เฉพาะหลังจากยืนยันว่าโปรเจกต์ Cloud, OAuth principal, และผู้เข้าร่วมการประชุมของคุณลงทะเบียนใน Google Workspace Developer Preview Program สำหรับ Meet media APIs แล้ว

## การกำหนดค่า

เส้นทาง Chrome realtime ทั่วไปต้องการเพียงเปิดใช้ Plugin, BlackHole, SoX, และคีย์ผู้ให้บริการเสียง realtime ฝั่ง backend OpenAI เป็นค่าเริ่มต้น; ตั้งค่า `realtime.provider: "google"` เพื่อใช้ Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

ตั้งค่า Plugin config ใต้ `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: id/ชื่อ/IP ของ Node แบบไม่บังคับสำหรับ `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ชื่อที่ใช้บนหน้าจอผู้เข้าร่วม Meet แบบ
  ยังไม่ได้ลงชื่อเข้าใช้
- `chrome.autoJoin: true`: เติมชื่อผู้เข้าร่วมและคลิกเข้าร่วมทันทีแบบพยายามเต็มที่
  ผ่านระบบอัตโนมัติของเบราว์เซอร์ OpenClaw บน `chrome-node`
- `chrome.reuseExistingTab: true`: เปิดใช้งานแท็บ Meet ที่มีอยู่แทนการเปิดซ้ำ
- `chrome.waitForInCallMs: 20000`: รอให้แท็บ Meet รายงานว่าอยู่ในสาย
  ก่อนทริกเกอร์คำแนะนำเริ่มต้นแบบเรียลไทม์
- `chrome.audioFormat: "pcm16-24khz"`: รูปแบบเสียงของคู่คำสั่ง ใช้
  `"g711-ulaw-8khz"` เฉพาะกับคู่คำสั่งรุ่นเก่า/แบบกำหนดเองที่ยังส่งออก
  เสียงโทรศัพท์อยู่
- `chrome.audioInputCommand`: คำสั่ง SoX ที่อ่านจาก CoreAudio `BlackHole 2ch`
  และเขียนเสียงใน `chrome.audioFormat`
- `chrome.audioOutputCommand`: คำสั่ง SoX ที่อ่านเสียงใน `chrome.audioFormat`
  และเขียนไปยัง CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: คำสั่งไมโครโฟนในเครื่องแบบไม่บังคับที่เขียน
  signed 16-bit little-endian mono PCM สำหรับตรวจจับการแทรกพูดของมนุษย์
  ขณะที่การเล่นเสียงของผู้ช่วยทำงานอยู่ ขณะนี้ใช้กับบริดจ์คู่คำสั่ง `chrome`
  ที่โฮสต์โดย Gateway
- `chrome.bargeInRmsThreshold: 650`: ระดับ RMS ที่นับเป็นการขัดจังหวะโดยมนุษย์
  บน `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: ระดับพีคที่นับเป็นการขัดจังหวะโดยมนุษย์
  บน `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: หน่วงเวลาขั้นต่ำระหว่างการล้างการขัดจังหวะโดยมนุษย์ซ้ำ
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: คำตอบพูดแบบสั้น พร้อม
  `openclaw_agent_consult` สำหรับคำตอบเชิงลึก
- `realtime.introMessage`: การตรวจสอบความพร้อมด้วยเสียงแบบสั้นเมื่อบริดจ์เรียลไทม์
  เชื่อมต่อ ตั้งค่าเป็น `""` เพื่อเข้าร่วมแบบเงียบ
- `realtime.agentId`: id ของ OpenClaw agent แบบไม่บังคับสำหรับ
  `openclaw_agent_consult`; ค่าเริ่มต้นคือ `main`

การแทนที่แบบไม่บังคับ:

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

`voiceCall.enabled` มีค่าเริ่มต้นเป็น `true`; เมื่อใช้การขนส่ง Twilio จะมอบหมาย
การโทร PSTN จริง, DTMF, และคำทักทายเริ่มต้นให้กับ Voice Call Plugin Voice Call
จะเล่นลำดับ DTMF ก่อนเปิดสตรีมสื่อแบบเรียลไทม์ จากนั้นใช้ข้อความเริ่มต้นที่บันทึกไว้
เป็นคำทักทายเรียลไทม์แรก หากไม่ได้เปิดใช้งาน `voice-call` Google Meet ยังสามารถ
ตรวจสอบและบันทึกแผนการโทรได้ แต่ไม่สามารถวางสาย Twilio ได้

## เครื่องมือ

Agents สามารถใช้เครื่องมือ `google_meet` ได้:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

ใช้ `transport: "chrome"` เมื่อ Chrome ทำงานบนโฮสต์ Gateway ใช้
`transport: "chrome-node"` เมื่อ Chrome ทำงานบน Node ที่จับคู่ไว้ เช่น Parallels
VM ในทั้งสองกรณี โมเดลเรียลไทม์และ `openclaw_agent_consult` ทำงานบนโฮสต์
Gateway ดังนั้นข้อมูลรับรองของโมเดลจึงยังอยู่ที่นั่น

ใช้ `action: "status"` เพื่อแสดงรายการเซสชันที่ใช้งานอยู่หรือตรวจสอบ session ID
ใช้ `action: "speak"` พร้อม `sessionId` และ `message` เพื่อให้ agent เรียลไทม์
พูดทันที ใช้ `action: "test_speech"` เพื่อสร้างหรือนำเซสชันกลับมาใช้ใหม่
ทริกเกอร์วลีที่ทราบ และคืนค่าสุขภาพ `inCall` เมื่อโฮสต์ Chrome รายงานได้
`test_speech` จะบังคับ `mode: "realtime"` เสมอ และจะล้มเหลวหากถูกขอให้ทำงานใน
`mode: "transcribe"` เพราะเซสชันแบบสังเกตเท่านั้นตั้งใจไม่ให้ส่งเสียงพูดออกมา
ผลลัพธ์ `speechOutputVerified` อิงจากจำนวนไบต์เอาต์พุตเสียงเรียลไทม์ที่เพิ่มขึ้น
ระหว่างการเรียกทดสอบนี้ ดังนั้นเซสชันที่นำกลับมาใช้ใหม่ซึ่งมีเสียงเก่าอยู่แล้ว
จะไม่นับเป็นการตรวจสอบเสียงพูดที่สำเร็จใหม่ ใช้ `action: "leave"` เพื่อทำเครื่องหมายว่า
เซสชันสิ้นสุดแล้ว

`status` รวมสุขภาพ Chrome เมื่อพร้อมใช้งาน:

- `inCall`: Chrome ดูเหมือนอยู่ภายในสาย Meet
- `micMuted`: สถานะไมโครโฟน Meet แบบพยายามเต็มที่
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: โปรไฟล์
  เบราว์เซอร์ต้องการการเข้าสู่ระบบด้วยตนเอง การอนุญาตจากโฮสต์ Meet สิทธิ์อนุญาต
  หรือการซ่อมแซมการควบคุมเบราว์เซอร์ก่อนเสียงพูดจะทำงานได้
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: อนุญาตให้ใช้
  เสียงพูด Chrome ที่มีการจัดการตอนนี้หรือไม่ `speechReady: false` หมายความว่า OpenClaw
  ไม่ได้ส่งวลีเริ่มต้น/ทดสอบเข้าไปในบริดจ์เสียง
- `providerConnected` / `realtimeReady`: สถานะบริดจ์เสียงเรียลไทม์
- `lastInputAt` / `lastOutputAt`: เสียงล่าสุดที่เห็นจากหรือส่งไปยังบริดจ์
- `lastSuppressedInputAt` / `suppressedInputBytes`: อินพุต local loopback ที่ถูกละเว้น
  ขณะที่การเล่นเสียงของผู้ช่วยทำงานอยู่

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## การ consult agent เรียลไทม์

โหมดเรียลไทม์ของ Chrome ถูกปรับให้เหมาะกับลูปเสียงสด ผู้ให้บริการเสียงเรียลไทม์
ได้ยินเสียงการประชุมและพูดผ่านบริดจ์เสียงที่กำหนดค่าไว้ เมื่อโมเดลเรียลไทม์ต้องการ
การให้เหตุผลเชิงลึก ข้อมูลปัจจุบัน หรือเครื่องมือ OpenClaw ปกติ ก็สามารถเรียก
`openclaw_agent_consult` ได้

เครื่องมือ consult จะเรียกใช้ agent OpenClaw ปกติเบื้องหลังพร้อมบริบทถอดเสียงการประชุมล่าสุด
และคืนคำตอบแบบพูดที่กระชับให้กับเซสชันเสียงเรียลไทม์ จากนั้นโมเดลเสียงสามารถพูดคำตอบนั้น
กลับเข้าไปในการประชุมได้ โดยใช้เครื่องมือ consult เรียลไทม์แบบแชร์เดียวกันกับ Voice Call

ตามค่าเริ่มต้น consult จะทำงานกับ agent `main` ตั้งค่า `realtime.agentId` เมื่อช่อง Meet
ควร consult พื้นที่ทำงาน agent OpenClaw เฉพาะ ค่าเริ่มต้นของโมเดล นโยบายเครื่องมือ
หน่วยความจำ และประวัติเซสชัน

`realtime.toolPolicy` ควบคุมการทำงานของ consult:

- `safe-read-only`: เปิดเผยเครื่องมือ consult และจำกัด agent ปกติให้ใช้
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, และ
  `memory_get`
- `owner`: เปิดเผยเครื่องมือ consult และให้ agent ปกติใช้นโยบายเครื่องมือของ
  agent ตามปกติ
- `none`: ไม่เปิดเผยเครื่องมือ consult ให้โมเดลเสียงเรียลไทม์

คีย์เซสชัน consult ถูกกำหนดขอบเขตต่อเซสชัน Meet ดังนั้นการเรียก consult ต่อเนื่อง
สามารถนำบริบท consult ก่อนหน้ากลับมาใช้ใหม่ได้ระหว่างการประชุมเดียวกัน

เพื่อบังคับการตรวจสอบความพร้อมด้วยเสียงหลังจาก Chrome เข้าร่วมสายอย่างสมบูรณ์แล้ว:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

สำหรับ smoke แบบเข้าร่วมและพูดครบถ้วน:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## รายการตรวจสอบการทดสอบสด

ใช้ลำดับนี้ก่อนส่งต่อการประชุมให้ agent ที่ไม่มีผู้ดูแล:

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
- `nodes status` แสดงว่า Node ที่เลือกเชื่อมต่อแล้ว
- Node ที่เลือกประกาศทั้ง `googlemeet.chrome` และ `browser.proxy`
- แท็บ Meet เข้าร่วมสายและ `test-speech` คืนค่าสุขภาพ Chrome พร้อม
  `inCall: true`

สำหรับโฮสต์ Chrome ระยะไกล เช่น Parallels macOS VM นี่คือการตรวจสอบที่สั้นที่สุด
และปลอดภัยหลังอัปเดต Gateway หรือ VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

สิ่งนี้พิสูจน์ว่า Gateway Plugin ถูกโหลดแล้ว, VM Node เชื่อมต่อด้วยโทเค็นปัจจุบัน,
และบริดจ์เสียง Meet พร้อมใช้งานก่อนที่ agent จะเปิดแท็บการประชุมจริง

สำหรับ smoke ของ Twilio ให้ใช้การประชุมที่เปิดเผยรายละเอียดการโทรเข้า:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

สถานะ Twilio ที่คาดหวัง:

- `googlemeet setup` รวมการตรวจสอบสีเขียว `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials`, และ `twilio-voice-call-webhook`
- `voicecall` พร้อมใช้งานใน CLI หลังโหลด Gateway ใหม่
- เซสชันที่คืนมามี `transport: "twilio"` และ `twilio.voiceCallId`
- `openclaw logs --follow` แสดง DTMF TwiML ที่ถูกให้บริการก่อน realtime TwiML
  แล้วตามด้วยบริดจ์เรียลไทม์ที่มีคำทักทายเริ่มต้นเข้าคิวไว้
- `googlemeet leave <sessionId>` วางสายเสียงที่มอบหมายไว้

## การแก้ไขปัญหา

### Agent มองไม่เห็นเครื่องมือ Google Meet

ยืนยันว่า Plugin เปิดใช้งานอยู่ในการกำหนดค่า Gateway และโหลด Gateway ใหม่:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

หากคุณเพิ่งแก้ไข `plugins.entries.google-meet` ให้รีสตาร์ทหรือโหลด Gateway ใหม่
agent ที่กำลังทำงานอยู่จะเห็นเฉพาะเครื่องมือ Plugin ที่ลงทะเบียนโดยกระบวนการ Gateway
ปัจจุบันเท่านั้น

บนโฮสต์ Gateway ที่ไม่ใช่ macOS เครื่องมือ `google_meet` สำหรับ agent ยังคงมองเห็นได้
แต่การกระทำเรียลไทม์ของ Chrome ในเครื่องจะถูกบล็อกก่อนถึงบริดจ์เสียง เสียงเรียลไทม์
ของ Chrome ในเครื่องขณะนี้ขึ้นกับ macOS `BlackHole 2ch` ดังนั้น agent บน Linux ควรใช้
`mode: "transcribe"` การโทรเข้า Twilio หรือโฮสต์ `chrome-node` บน macOS แทนเส้นทาง
เรียลไทม์ของ Chrome ในเครื่องที่เป็นค่าเริ่มต้น

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

Node ต้องเชื่อมต่ออยู่และแสดงรายการ `googlemeet.chrome` รวมถึง `browser.proxy`
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

หาก `googlemeet setup` ล้มเหลวที่ `chrome-node-connected` หรือบันทึก Gateway รายงานว่า
`gateway token mismatch` ให้ติดตั้งใหม่หรือรีสตาร์ท Node ด้วยโทเค็น Gateway ปัจจุบัน
สำหรับ Gateway บน LAN โดยทั่วไปหมายถึง:

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

### เบราว์เซอร์เปิดแต่ agent เข้าร่วมไม่ได้

รัน `googlemeet test-listen` สำหรับการเข้าร่วมแบบสังเกตเท่านั้น หรือ `googlemeet test-speech`
สำหรับการเข้าร่วมแบบเรียลไทม์ จากนั้นตรวจสอบสุขภาพ Chrome ที่คืนมา หากโพรบใดรายงาน
`manualActionRequired: true` ให้แสดง `manualActionMessage` ต่อผู้ปฏิบัติงาน
และหยุดลองซ้ำจนกว่าการกระทำในเบราว์เซอร์จะเสร็จสิ้น

การกระทำด้วยตนเองที่พบบ่อย:

- ลงชื่อเข้าใช้โปรไฟล์ Chrome
- อนุญาตผู้เข้าร่วมจากบัญชีโฮสต์ Meet
- ให้สิทธิ์ไมโครโฟน/กล้องแก่ Chrome เมื่อพรอมป์สิทธิ์ดั้งเดิมของ Chrome ปรากฏ
- ปิดหรือซ่อมแซมกล่องโต้ตอบสิทธิ์ Meet ที่ค้างอยู่

อย่ารายงานว่า "ไม่ได้ลงชื่อเข้าใช้" เพียงเพราะ Meet แสดงว่า "คุณต้องการให้ผู้อื่นได้ยินเสียงคุณในการประชุมหรือไม่" นั่นคือหน้าคั่นสำหรับเลือกเสียงของ Meet; OpenClaw
คลิก **ใช้ไมโครโฟน** ผ่านระบบอัตโนมัติของเบราว์เซอร์เมื่อมีให้ใช้ และรอต่อไปจนกว่าจะพบสถานะการประชุมจริง สำหรับการสำรองผ่านเบราว์เซอร์แบบสร้างอย่างเดียว OpenClaw
อาจคลิก **ดำเนินการต่อโดยไม่มีไมโครโฟน** เพราะการสร้าง URL ไม่จำเป็นต้องใช้เส้นทางเสียงแบบเรียลไทม์

### การสร้างการประชุมล้มเหลว

`googlemeet create` ใช้ endpoint
`spaces.create` ของ Google Meet API ก่อนเมื่อมีการกำหนดค่าข้อมูลรับรอง OAuth หากไม่มีข้อมูลรับรอง OAuth ระบบจะถอยกลับไปใช้เบราว์เซอร์โหนด Chrome ที่ปักหมุดไว้ ตรวจสอบว่า:

- สำหรับการสร้างผ่าน API: มีการกำหนดค่า `oauth.clientId` และ `oauth.refreshToken`
  หรือมีตัวแปรสภาพแวดล้อม `OPENCLAW_GOOGLE_MEET_*` ที่ตรงกัน
- สำหรับการสร้างผ่าน API: refresh token ถูกสร้างขึ้นหลังจากเพิ่มการรองรับการสร้างแล้ว
  โทเคนเก่าอาจไม่มี scope `meetings.space.created`; เรียกใช้
  `openclaw googlemeet auth login --json` อีกครั้งและอัปเดตการกำหนดค่า Plugin
- สำหรับการสำรองผ่านเบราว์เซอร์: `defaultTransport: "chrome-node"` และ
  `chromeNode.node` ชี้ไปยังโหนดที่เชื่อมต่อแล้วซึ่งมี `browser.proxy` และ
  `googlemeet.chrome`
- สำหรับการสำรองผ่านเบราว์เซอร์: โปรไฟล์ OpenClaw Chrome บนโหนดนั้นลงชื่อเข้าใช้
  Google แล้วและเปิด `https://meet.google.com/new` ได้
- สำหรับการสำรองผ่านเบราว์เซอร์: การลองซ้ำจะนำแท็บ
  `https://meet.google.com/new` ที่มีอยู่หรือแท็บพร้อมต์บัญชี Google มาใช้ซ้ำก่อนเปิดแท็บใหม่ หากเอเจนต์หมดเวลา
  ให้ลองเรียกเครื่องมือซ้ำแทนการเปิดแท็บ Meet อื่นด้วยตนเอง
- สำหรับการสำรองผ่านเบราว์เซอร์: หากเครื่องมือส่งคืน `manualActionRequired: true` ให้ใช้
  `browser.nodeId`, `browser.targetId`, `browserUrl` และ
  `manualActionMessage` ที่ส่งคืนมาเพื่อแนะนำผู้ปฏิบัติงาน อย่าลองซ้ำเป็นลูปจนกว่าการดำเนินการนั้นจะเสร็จสมบูรณ์
- สำหรับการสำรองผ่านเบราว์เซอร์: หาก Meet แสดงว่า "คุณต้องการให้ผู้อื่นได้ยินเสียงคุณในการประชุมหรือไม่"
  ให้เปิดแท็บนั้นทิ้งไว้ OpenClaw ควรคลิก **ใช้ไมโครโฟน** หรือสำหรับการสำรองแบบสร้างอย่างเดียว
  **ดำเนินการต่อโดยไม่มีไมโครโฟน** ผ่านระบบอัตโนมัติของเบราว์เซอร์ และรอต่อไปจนกว่าจะได้ URL ของ Meet ที่สร้างขึ้น หากทำไม่ได้
  ข้อผิดพลาดควรกล่าวถึง `meet-audio-choice-required` ไม่ใช่ `google-login-required`

### เอเจนต์เข้าร่วมแต่ไม่พูด

ตรวจสอบเส้นทางเรียลไทม์:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

ใช้ `mode: "realtime"` สำหรับการฟัง/ตอบกลับด้วยเสียง `mode: "transcribe"` ตั้งใจ
ไม่เริ่มสะพานเสียงเรียลไทม์แบบสองทาง สำหรับการดีบักแบบสังเกตอย่างเดียว
ให้เรียกใช้ `openclaw googlemeet status --json <session-id>` หลังจากผู้เข้าร่วมพูด
และตรวจสอบ `captioning`, `transcriptLines` และ `lastCaptionText` หาก `inCall` เป็น
true แต่ `transcriptLines` ยังคงเป็น `0` คำบรรยายของ Meet อาจถูกปิดใช้งาน ไม่มีใคร
พูดหลังจากติดตั้งตัวสังเกตแล้ว UI ของ Meet เปลี่ยนไป หรือคำบรรยายสดไม่พร้อมใช้งานสำหรับภาษาหรือบัญชีของการประชุม

`googlemeet test-speech` ตรวจสอบเส้นทางเรียลไทม์เสมอและรายงานว่า
พบไบต์เอาต์พุตของสะพานสำหรับการเรียกใช้นั้นหรือไม่ หาก `speechOutputVerified` เป็น false และ
`speechOutputTimedOut` เป็น true ผู้ให้บริการเรียลไทม์อาจยอมรับ
ถ้อยคำแล้ว แต่ OpenClaw ไม่พบไบต์เอาต์พุตใหม่ไปถึงสะพานเสียง Chrome

ตรวจสอบเพิ่มเติมว่า:

- มีคีย์ผู้ให้บริการเรียลไทม์บนโฮสต์ Gateway เช่น
  `OPENAI_API_KEY` หรือ `GEMINI_API_KEY`
- `BlackHole 2ch` มองเห็นได้บนโฮสต์ Chrome
- มี `sox` อยู่บนโฮสต์ Chrome
- ไมโครโฟนและลำโพงของ Meet ถูกกำหนดเส้นทางผ่านเส้นทางเสียงเสมือนที่ OpenClaw ใช้

`googlemeet doctor [session-id]` พิมพ์เซสชัน โหนด สถานะในสาย
เหตุผลที่ต้องดำเนินการด้วยตนเอง การเชื่อมต่อผู้ให้บริการเรียลไทม์ `realtimeReady` กิจกรรมอินพุต/เอาต์พุตเสียง
เวลาประทับเสียงล่าสุด ตัวนับไบต์ และ URL เบราว์เซอร์
ใช้ `googlemeet status [session-id] --json` เมื่อต้องการ JSON ดิบ ใช้
`googlemeet doctor --oauth` เมื่อต้องการตรวจสอบ refresh ของ Google Meet OAuth
โดยไม่เปิดเผยโทเคน; เพิ่ม `--meeting` หรือ `--create-space` เมื่อต้องการ
หลักฐาน Google Meet API ด้วย

หากเอเจนต์หมดเวลาและคุณเห็นแท็บ Meet เปิดอยู่แล้ว ให้ตรวจสอบแท็บนั้น
โดยไม่เปิดแท็บอื่น:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

การดำเนินการของเครื่องมือที่เทียบเท่าคือ `recover_current_tab` มันโฟกัสและตรวจสอบ
แท็บ Meet ที่มีอยู่สำหรับ transport ที่เลือก เมื่อใช้ `chrome` จะใช้การควบคุมเบราว์เซอร์ภายในผ่าน Gateway; เมื่อใช้ `chrome-node` จะใช้โหนด Chrome ที่กำหนดค่าไว้
มันไม่เปิดแท็บใหม่หรือสร้างเซสชันใหม่; มันรายงานตัวบล็อกปัจจุบัน เช่น สถานะการเข้าสู่ระบบ การอนุญาตเข้าร่วม สิทธิ์ หรือการเลือกเสียง
คำสั่ง CLI คุยกับ Gateway ที่กำหนดค่าไว้ ดังนั้น Gateway ต้องทำงานอยู่;
`chrome-node` ยังต้องให้โหนด Chrome เชื่อมต่ออยู่ด้วย

### การตรวจสอบการตั้งค่า Twilio ล้มเหลว

`twilio-voice-call-plugin` ล้มเหลวเมื่อ `voice-call` ไม่ได้รับอนุญาตหรือไม่ได้เปิดใช้งาน
เพิ่มเข้าไปใน `plugins.allow`, เปิดใช้งาน `plugins.entries.voice-call` และโหลด Gateway ใหม่

`twilio-voice-call-credentials` ล้มเหลวเมื่อ backend ของ Twilio ไม่มี SID บัญชี โทเคน auth หรือหมายเลขผู้โทร ตั้งค่าสิ่งเหล่านี้บนโฮสต์ Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` ล้มเหลวเมื่อ `voice-call` ไม่มีการเปิดเผย Webhook สาธารณะ
หรือเมื่อ `publicUrl` ชี้ไปยัง local loopback หรือพื้นที่เครือข่ายส่วนตัว
ตั้งค่า `plugins.entries.voice-call.config.publicUrl` เป็น URL ผู้ให้บริการสาธารณะ หรือ
กำหนดค่าการเปิดเผย `voice-call` ผ่าน tunnel/Tailscale

URL แบบ loopback และ URL ส่วนตัวใช้ไม่ได้สำหรับ callback ของผู้ให้บริการโทรศัพท์ อย่าใช้
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

สำหรับการพัฒนาในเครื่อง ให้ใช้ tunnel หรือการเปิดเผยผ่าน Tailscale แทน URL โฮสต์ส่วนตัว:

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

`voicecall smoke` เป็นการตรวจสอบความพร้อมเท่านั้นโดยค่าเริ่มต้น หากต้องการ dry-run หมายเลขที่เฉพาะเจาะจง:

```bash
openclaw voicecall smoke --to "+15555550123"
```

เพิ่ม `--yes` เฉพาะเมื่อคุณตั้งใจจะโทรแจ้งเตือนขาออกจริง:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### การโทร Twilio เริ่มขึ้นแต่ไม่เคยเข้าสู่การประชุม

ยืนยันว่าเหตุการณ์ Meet แสดงรายละเอียดการโทรเข้า ส่งหมายเลขโทรเข้าและ PIN ที่ตรงเป๊ะ
หรือลำดับ DTMF แบบกำหนดเอง:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

ใช้ `w` นำหน้าหรือเครื่องหมายจุลภาคใน `--dtmf-sequence` หากผู้ให้บริการต้องการหยุดพัก
ก่อนป้อน PIN

หากมีการสร้างสายโทรศัพท์แล้ว แต่รายชื่อผู้เข้าร่วมของ Meet ยังไม่แสดงผู้เข้าร่วมแบบโทรเข้า:

- เรียกใช้ `openclaw googlemeet doctor <session-id>` เพื่อยืนยัน ID สาย Twilio
  ที่ถูกมอบหมาย ว่า DTMF ถูกเข้าคิวไว้หรือไม่ และมีการร้องขอคำทักทายเปิดตัวหรือไม่
- เรียกใช้ `openclaw voicecall status --call-id <id>` และยืนยันว่าสายยังคง
  ทำงานอยู่
- เรียกใช้ `openclaw voicecall tail` และตรวจสอบว่า Webhook ของ Twilio มาถึง
  Gateway
- เรียกใช้ `openclaw logs --follow` และมองหาลำดับ Twilio Meet: Google
  Meet มอบหมายการเข้าร่วม, Voice Call เริ่มสายโทรศัพท์, Google Meet รอ
  `voiceCall.dtmfDelayMs`, ส่ง DTMF ด้วย `voicecall.dtmf`, รอ
  `voiceCall.postDtmfSpeechDelayMs` แล้วขอเสียงทักทายเปิดตัวด้วย
  `voicecall.speak`
- เรียกใช้ `openclaw googlemeet setup --transport twilio` อีกครั้ง; การตรวจสอบการตั้งค่าสีเขียว
  จำเป็น แต่ไม่ได้พิสูจน์ว่าลำดับ PIN ของการประชุมถูกต้อง
- ยืนยันว่าหมายเลขโทรเข้าเป็นของคำเชิญ Meet และภูมิภาคเดียวกับ
  PIN
- เพิ่ม `voiceCall.dtmfDelayMs` หาก Meet รับสายช้าหรือ transcript ของสาย
  ยังแสดงพร้อมต์ให้ป้อน PIN หลังจากส่ง DTMF แล้ว
- หากผู้เข้าร่วมเข้าร่วมแล้วแต่คุณไม่ได้ยินคำทักทาย ให้ตรวจสอบ
  `openclaw logs --follow` สำหรับคำขอ `voicecall.speak` หลัง DTMF และ
  การเล่น TTS ผ่าน media-stream หรือ fallback `<Say>` ของ Twilio หาก transcript ของสาย
  ยังมีคำว่า "ป้อน PIN การประชุม" แสดงว่าสายโทรศัพท์ยังไม่ได้เข้าห้อง Meet
  ดังนั้นผู้เข้าร่วมการประชุมจะไม่ได้ยินเสียงพูด

หาก Webhook ไม่มาถึง ให้ดีบัก Voice Call Plugin ก่อน: ผู้ให้บริการต้อง
เข้าถึง `plugins.entries.voice-call.config.publicUrl` หรือ tunnel ที่กำหนดค่าไว้
ดู [การแก้ไขปัญหาการโทรด้วยเสียง](/th/plugins/voice-call#troubleshooting)

## หมายเหตุ

media API อย่างเป็นทางการของ Google Meet เป็นแบบเน้นรับสื่อ ดังนั้นการพูดเข้าไปในสาย Meet
ยังต้องมีเส้นทางผู้เข้าร่วม Plugin นี้ทำให้ขอบเขตนั้นมองเห็นได้:
Chrome จัดการการเข้าร่วมผ่านเบราว์เซอร์และการกำหนดเส้นทางเสียงภายในเครื่อง; Twilio จัดการ
การเข้าร่วมผ่านการโทรเข้า

โหมดเรียลไทม์ของ Chrome ต้องใช้ `BlackHole 2ch` พร้อมกับอย่างใดอย่างหนึ่งต่อไปนี้:

- `chrome.audioInputCommand` และ `chrome.audioOutputCommand`: OpenClaw เป็นเจ้าของ
  สะพานโมเดลเรียลไทม์และส่งเสียงในรูปแบบ `chrome.audioFormat` ระหว่างคำสั่งเหล่านั้น
  กับผู้ให้บริการเสียงเรียลไทม์ที่เลือก เส้นทาง Chrome เริ่มต้นคือ
  PCM16 24 kHz; G.711 mu-law 8 kHz ยังคงพร้อมใช้งานสำหรับคู่คำสั่งรุ่นเก่า
- `chrome.audioBridgeCommand`: คำสั่งสะพานภายนอกเป็นเจ้าของเส้นทางเสียงภายในเครื่องทั้งหมด
  และต้องออกหลังจากเริ่มหรือยืนยัน daemon แล้ว

สำหรับเสียงสองทางที่สะอาด ให้กำหนดเส้นทางเอาต์พุต Meet และไมโครโฟน Meet ผ่านอุปกรณ์เสมือนแยกกัน
หรือกราฟอุปกรณ์เสมือนแบบ Loopback-style อุปกรณ์ BlackHole เดียวที่ใช้ร่วมกัน
อาจสะท้อนเสียงผู้เข้าร่วมคนอื่นกลับเข้าไปในสาย

เมื่อใช้สะพาน Chrome แบบคู่คำสั่ง `chrome.bargeInInputCommand` สามารถฟัง
ไมโครโฟนภายในเครื่องแยกต่างหากและล้างการเล่นเสียงของผู้ช่วยเมื่อมนุษย์เริ่มพูด
สิ่งนี้ทำให้เสียงมนุษย์มาก่อนเอาต์พุตของผู้ช่วย แม้เมื่ออินพุต loopback ของ BlackHole ที่ใช้ร่วมกัน
ถูกระงับชั่วคราวระหว่างการเล่นเสียงของผู้ช่วยก็ตาม
เช่นเดียวกับ `chrome.audioInputCommand` และ `chrome.audioOutputCommand` มันเป็น
คำสั่งภายในเครื่องที่ผู้ปฏิบัติงานกำหนดค่า ใช้เส้นทางคำสั่งที่เชื่อถือได้อย่างชัดเจนหรือ
รายการอาร์กิวเมนต์ และอย่าชี้ไปยังสคริปต์จากตำแหน่งที่ไม่น่าเชื่อถือ

`googlemeet speak` กระตุ้นสะพานเสียงเรียลไทม์ที่ใช้งานอยู่สำหรับเซสชัน Chrome
`googlemeet leave` หยุดสะพานนั้น สำหรับเซสชัน Twilio ที่มอบหมายผ่าน Voice Call Plugin
`leave` จะวางสายเสียงพื้นฐานด้วย
ใช้ `googlemeet end-active-conference` เมื่อคุณต้องการปิดการประชุม
Google Meet ที่ใช้งานอยู่สำหรับพื้นที่ที่จัดการผ่าน API ด้วย

## ที่เกี่ยวข้อง

- [Voice Call Plugin](/th/plugins/voice-call)
- [โหมดพูดคุย](/th/nodes/talk)
- [การสร้าง Plugin](/th/plugins/building-plugins)
