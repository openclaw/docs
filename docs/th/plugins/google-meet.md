---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw เข้าร่วมการประชุม Google Meet
    - คุณต้องการให้เอเจนต์ OpenClaw สร้างการโทร Google Meet ใหม่
    - คุณกำลังกำหนดค่า Chrome, Chrome node หรือ Twilio เป็นทรานสปอร์ตสำหรับ Google Meet
summary: 'Google Meet Plugin: เข้าร่วม URL ของ Meet ที่ระบุอย่างชัดเจนผ่าน Chrome หรือ Twilio พร้อมค่าเริ่มต้นสำหรับการพูดตอบกลับของเอเจนต์'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-06T09:24:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c1de7528ddabe6411598eea362d4a21c6f95f374700046c18294b215a1333d3
    source_path: plugins/google-meet.md
    workflow: 16
---

การรองรับผู้เข้าร่วม Google Meet สำหรับ OpenClaw — Plugin ตั้งใจออกแบบให้ชัดเจน:

- เข้าร่วมได้เฉพาะ URL `https://meet.google.com/...` ที่ระบุอย่างชัดเจนเท่านั้น
- สามารถสร้างพื้นที่ Meet ใหม่ผ่าน Google Meet API แล้วเข้าร่วม URL ที่ส่งกลับมา
- `agent` คือโหมดตอบกลับเริ่มต้น: การถอดเสียงแบบเรียลไทม์จะฟัง, agent ของ OpenClaw ที่กำหนดค่าจะตอบ, และ OpenClaw TTS ปกติจะพูดเข้าไปใน Meet
- `bidi` ยังคงพร้อมใช้งานเป็นโหมดสำรองสำหรับโมเดลเสียงเรียลไทม์โดยตรง
- Agent เลือกลักษณะการเข้าร่วมด้วย `mode`: ใช้ `agent` สำหรับการฟัง/ตอบกลับสด, `bidi` สำหรับเสียงเรียลไทม์โดยตรงแบบสำรอง, หรือ `transcribe` เพื่อเข้าร่วม/ควบคุมเบราว์เซอร์โดยไม่มีสะพานตอบกลับ
- Auth เริ่มต้นเป็น Google OAuth ส่วนบุคคลหรือโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้อยู่แล้ว
- ไม่มีการประกาศขอความยินยอมอัตโนมัติ
- แบ็กเอนด์เสียง Chrome เริ่มต้นคือ `BlackHole 2ch`
- Chrome สามารถทำงานในเครื่องหรือบนโฮสต์ Node ที่จับคู่ไว้
- Twilio รับหมายเลขโทรเข้า พร้อม PIN หรือชุด DTMF แบบไม่บังคับ; ไม่สามารถโทรไปยัง URL ของ Meet โดยตรงได้
- คำสั่ง CLI คือ `googlemeet`; `meet` สงวนไว้สำหรับเวิร์กโฟลว์การประชุมทางไกลของ agent ที่กว้างกว่า

## เริ่มต้นอย่างรวดเร็ว

ติดตั้ง dependency เสียงในเครื่อง และกำหนดค่าผู้ให้บริการถอดเสียงแบบเรียลไทม์พร้อม OpenClaw TTS ปกติ OpenAI เป็นผู้ให้บริการถอดเสียงเริ่มต้น; Google Gemini Live ก็ใช้งานได้เช่นกันในฐานะเสียงสำรอง `bidi` แยกต่างหากด้วย `realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` จะติดตั้งอุปกรณ์เสียงเสมือน `BlackHole 2ch` ตัวติดตั้งของ Homebrew ต้องรีบูตก่อนที่ macOS จะแสดงอุปกรณ์:

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

เอาต์พุตการตั้งค่าถูกออกแบบมาให้อ่านได้โดย agent และรับรู้โหมด โดยรายงานโปรไฟล์ Chrome, การตรึง Node, และสำหรับการเข้าร่วม Chrome แบบเรียลไทม์ จะรายงานสะพานเสียง BlackHole/SoX และการตรวจสอบบทนำแบบเรียลไทม์ที่หน่วงไว้ สำหรับการเข้าร่วมแบบสังเกตอย่างเดียว ให้ตรวจสอบทรานสปอร์ตเดียวกันด้วย `--mode transcribe`; โหมดนั้นจะข้ามข้อกำหนดเบื้องต้นด้านเสียงเรียลไทม์ เพราะไม่ได้ฟังผ่านหรือพูดผ่านสะพาน:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

เมื่อกำหนดค่าการมอบหมายผ่าน Twilio แล้ว การตั้งค่าจะรายงานด้วยว่า Plugin `voice-call`, ข้อมูลประจำตัว Twilio, และการเปิดเผย Webhook สาธารณะพร้อมหรือไม่ ให้ถือการตรวจสอบใดๆ ที่เป็น `ok: false` เป็นตัวบล็อกสำหรับทรานสปอร์ตและโหมดที่ตรวจสอบ ก่อนขอให้ agent เข้าร่วม ใช้ `openclaw googlemeet setup --json` สำหรับสคริปต์หรือเอาต์พุตที่เครื่องอ่านได้ ใช้ `--transport chrome`, `--transport chrome-node`, หรือ `--transport twilio` เพื่อ preflight ทรานสปอร์ตเฉพาะก่อนที่ agent จะลองใช้

สำหรับ Twilio ให้ preflight ทรานสปอร์ตอย่างชัดเจนเสมอเมื่อทรานสปอร์ตเริ่มต้นคือ Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

วิธีนี้จะตรวจพบการเชื่อม `voice-call` ที่ขาดหาย, ข้อมูลประจำตัว Twilio, หรือการเปิดเผย Webhook ที่เข้าถึงไม่ได้ ก่อนที่ agent จะพยายามโทรเข้าประชุม

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

เครื่องมือ `google_meet` สำหรับ agent ยังคงพร้อมใช้งานบนโฮสต์ที่ไม่ใช่ macOS สำหรับโฟลว์ artifact, calendar, setup, transcribe, Twilio, และ `chrome-node` การกระทำตอบกลับผ่าน Chrome ในเครื่องจะถูกบล็อกบนโฮสต์เหล่านั้น เพราะเส้นทางเสียง Chrome ที่รวมมาด้วยปัจจุบันพึ่งพา `BlackHole 2ch` ของ macOS บน Linux ให้ใช้ `mode: "transcribe"`, การโทรเข้า Twilio, หรือโฮสต์ `chrome-node` บน macOS สำหรับการเข้าร่วม Chrome แบบตอบกลับ

สร้างการประชุมใหม่และเข้าร่วม:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

สำหรับห้องที่สร้างด้วย API ให้ใช้ Google Meet `SpaceConfig.accessType` เมื่อคุณต้องการให้นโยบายไม่ต้องเคาะประตูของห้องชัดเจน แทนที่จะสืบทอดจากค่าเริ่มต้นของบัญชี Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` อนุญาตให้ทุกคนที่มี URL ของ Meet เข้าร่วมโดยไม่ต้องเคาะประตู `TRUSTED` อนุญาตให้ผู้ใช้ที่องค์กรโฮสต์เชื่อถือ, ผู้ใช้ภายนอกที่ได้รับเชิญ, และผู้ใช้โทรเข้าเข้าร่วมโดยไม่ต้องเคาะประตู `RESTRICTED` จำกัดการเข้าแบบไม่ต้องเคาะประตูไว้เฉพาะผู้ได้รับเชิญ การตั้งค่าเหล่านี้ใช้กับเส้นทางการสร้างผ่าน Google Meet API อย่างเป็นทางการเท่านั้น ดังนั้นต้องกำหนดค่าข้อมูลประจำตัว OAuth

หากคุณยืนยันตัวตน Google Meet ก่อนที่ตัวเลือกนี้จะพร้อมใช้งาน ให้รัน `openclaw googlemeet auth login --json` อีกครั้งหลังเพิ่ม scope `meetings.space.settings` ลงในหน้าจอขอความยินยอม Google OAuth ของคุณ

สร้างเฉพาะ URL โดยไม่เข้าร่วม:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` มีสองเส้นทาง:

- สร้างด้วย API: ใช้เมื่อกำหนดค่าข้อมูลประจำตัว Google Meet OAuth แล้ว นี่คือเส้นทางที่กำหนดผลได้แน่นอนที่สุดและไม่ขึ้นกับสถานะ UI ของเบราว์เซอร์
- ตัวสำรองผ่านเบราว์เซอร์: ใช้เมื่อไม่มีข้อมูลประจำตัว OAuth OpenClaw ใช้ Node Chrome ที่ตรึงไว้ เปิด `https://meet.google.com/new` รอให้ Google เปลี่ยนเส้นทางไปยัง URL รหัสการประชุมจริง แล้วส่งคืน URL นั้น เส้นทางนี้ต้องให้โปรไฟล์ Chrome ของ OpenClaw บน Node ลงชื่อเข้าใช้ Google อยู่แล้ว ระบบอัตโนมัติของเบราว์เซอร์จัดการพรอมป์ไมโครโฟนครั้งแรกของ Meet เอง; พรอมป์นั้นไม่ถูกถือว่าเป็นความล้มเหลวในการเข้าสู่ระบบ Google
  โฟลว์เข้าร่วมและสร้างจะพยายามใช้แท็บ Meet ที่มีอยู่ซ้ำก่อนเปิดแท็บใหม่ด้วย การจับคู่จะละเว้นสตริง query ของ URL ที่ไม่เป็นอันตราย เช่น `authuser` ดังนั้นการลองใหม่ของ agent ควรโฟกัสการประชุมที่เปิดอยู่แล้วแทนที่จะสร้างแท็บ Chrome แท็บที่สอง

เอาต์พุตคำสั่ง/เครื่องมือมีฟิลด์ `source` (`api` หรือ `browser`) เพื่อให้ agent อธิบายได้ว่าใช้เส้นทางใด `create` จะเข้าร่วมการประชุมใหม่โดยค่าเริ่มต้น และส่งคืน `joined: true` พร้อมเซสชันเข้าร่วม หากต้องการสร้างเฉพาะ URL ให้ใช้ `create --no-join` บน CLI หรือส่ง `"join": false` ให้เครื่องมือ

หรือบอก agent ว่า: "สร้าง Google Meet, เข้าร่วมด้วยโหมดตอบกลับของ agent, และส่งลิงก์ให้ฉัน" agent ควรเรียก `google_meet` ด้วย `action: "create"` แล้วแชร์ `meetingUri` ที่ส่งกลับมา

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

สำหรับการเข้าร่วมแบบสังเกตอย่างเดียว/ควบคุมเบราว์เซอร์ ให้ตั้ง `"mode": "transcribe"` วิธีนี้จะไม่เริ่มสะพานเสียงเรียลไทม์แบบสองทาง, ไม่ต้องใช้ BlackHole หรือ SoX, และจะไม่ตอบกลับเข้าไปในการประชุม การเข้าร่วม Chrome ในโหมดนี้ยังหลีกเลี่ยงการให้สิทธิ์ไมโครโฟน/กล้องของ OpenClaw และหลีกเลี่ยงเส้นทาง **ใช้ไมโครโฟน** ของ Meet หาก Meet แสดงหน้าคั่นให้เลือกเสียง ระบบอัตโนมัติจะลองเส้นทางไม่มีไมโครโฟน และมิฉะนั้นจะรายงานการกระทำด้วยตนเองแทนการเปิดไมโครโฟนในเครื่อง ในโหมด transcribe ทรานสปอร์ต Chrome ที่จัดการยังติดตั้งตัวสังเกตคำบรรยาย Meet แบบ best-effort ด้วย `googlemeet status --json` และ `googlemeet doctor` จะแสดง `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`, และส่วนท้าย `recentTranscript` สั้นๆ เพื่อให้ผู้ปฏิบัติงานบอกได้ว่าเบราว์เซอร์เข้าร่วมสายแล้วหรือไม่ และคำบรรยาย Meet กำลังสร้างข้อความหรือไม่
ใช้ `openclaw googlemeet test-listen <meet-url> --transport chrome-node` เมื่อคุณต้องการโพรบใช่/ไม่ใช่: คำสั่งจะเข้าร่วมในโหมด transcribe, รอคำบรรยายใหม่หรือการเคลื่อนไหวของ transcript, และส่งคืน `listenVerified`, `listenTimedOut`, ฟิลด์การกระทำด้วยตนเอง, และสถานะคำบรรยายล่าสุด

ระหว่างเซสชันเรียลไทม์ สถานะ `google_meet` จะรวมสถานะเบราว์เซอร์และสะพานเสียง เช่น `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamp อินพุต/เอาต์พุตล่าสุด, ตัวนับไบต์, และสถานะสะพานปิด หากมีพรอมป์หน้า Meet ที่ปลอดภัยปรากฏขึ้น ระบบอัตโนมัติของเบราว์เซอร์จะจัดการเมื่อทำได้ พรอมป์เข้าสู่ระบบ, การอนุญาตจากโฮสต์, และสิทธิ์ของเบราว์เซอร์/OS จะถูกรายงานเป็นการกระทำด้วยตนเองพร้อมเหตุผลและข้อความเพื่อให้ agent ส่งต่อ เซสชัน Chrome ที่จัดการจะส่งบทนำหรือวลีทดสอบเฉพาะหลังจากสถานะเบราว์เซอร์รายงาน `inCall: true`; ไม่เช่นนั้นสถานะจะรายงาน `speechReady: false` และการพยายามพูดจะถูกบล็อก แทนที่จะแสร้งว่า agent พูดเข้าไปในการประชุมแล้ว

การเข้าร่วม Chrome ในเครื่องใช้โปรไฟล์เบราว์เซอร์ OpenClaw ที่ลงชื่อเข้าไว้ โหมดเรียลไทม์ต้องใช้ `BlackHole 2ch` สำหรับเส้นทางไมโครโฟน/ลำโพงที่ OpenClaw ใช้ สำหรับเสียงสองทางที่สะอาด ให้ใช้อุปกรณ์เสมือนแยกกันหรือกราฟสไตล์ Loopback; อุปกรณ์ BlackHole เดียวเพียงพอสำหรับการทดสอบ smoke ครั้งแรก แต่อาจเกิดเสียงสะท้อนได้

### Gateway ในเครื่อง + Parallels Chrome

คุณ **ไม่** ต้องมี OpenClaw Gateway แบบเต็มหรือคีย์ model API ภายใน VM macOS เพียงเพื่อให้ VM เป็นเจ้าของ Chrome ให้รัน Gateway และ agent ในเครื่อง แล้วรันโฮสต์ Node ใน VM เปิดใช้ Plugin ที่รวมมาใน VM หนึ่งครั้งเพื่อให้ Node ประกาศคำสั่ง Chrome:

สิ่งที่รันอยู่ที่ไหน:

- โฮสต์ Gateway: OpenClaw Gateway, เวิร์กสเปซ agent, คีย์ model/API, ผู้ให้บริการเรียลไทม์, และการกำหนดค่า Plugin Google Meet
- Parallels macOS VM: OpenClaw CLI/โฮสต์ Node, Google Chrome, SoX, BlackHole 2ch, และโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้ Google
- ไม่จำเป็นใน VM: บริการ Gateway, การกำหนดค่า agent, คีย์ OpenAI/GPT, หรือการตั้งค่าผู้ให้บริการโมเดล

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

ติดตั้งหรืออัปเดต OpenClaw ใน VM แล้วเปิดใช้ Plugin ที่รวมมาในนั้น:

```bash
openclaw plugins enable google-meet
```

เริ่มโฮสต์ Node ใน VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

หาก `<gateway-host>` เป็น IP ของ LAN และคุณไม่ได้ใช้ TLS Node จะปฏิเสธ WebSocket แบบข้อความล้วน เว้นแต่คุณจะเลือกใช้สำหรับเครือข่ายส่วนตัวที่เชื่อถือนั้น:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

ใช้ตัวแปรสภาพแวดล้อมเดียวกันเมื่อติดตั้ง Node เป็น LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` เป็นสภาพแวดล้อมของกระบวนการ ไม่ใช่การตั้งค่า `openclaw.json` `openclaw node install` จะจัดเก็บไว้ในสภาพแวดล้อมของ LaunchAgent เมื่อมีอยู่ในคำสั่งติดตั้ง

อนุมัติ Node จากโฮสต์ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

ยืนยันว่า Gateway เห็น Node และ Node ประกาศทั้ง `googlemeet.chrome` และความสามารถเบราว์เซอร์/`browser.proxy`:

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

สำหรับการทดสอบ smoke ด้วยคำสั่งเดียวที่จะสร้างหรือใช้เซสชันซ้ำ, พูดวลีที่ทราบ, และพิมพ์สถานะเซสชัน:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

ระหว่างการเข้าร่วมแบบเรียลไทม์ ระบบอัตโนมัติของเบราว์เซอร์ OpenClaw จะกรอกชื่อผู้เข้าร่วมแบบผู้เยี่ยมชม คลิก
Join/Ask to join และยอมรับตัวเลือก "Use microphone" ในการใช้งานครั้งแรกของ Meet เมื่อ
พรอมต์นั้นปรากฏขึ้น ระหว่างการเข้าร่วมแบบสังเกตการณ์เท่านั้นหรือการสร้างการประชุมด้วยเบราว์เซอร์เท่านั้น ระบบจะ
ดำเนินการต่อผ่านพรอมต์เดียวกันโดยไม่ใช้ไมโครโฟนเมื่อมีตัวเลือกนั้น
หากโปรไฟล์เบราว์เซอร์ยังไม่ได้ลงชื่อเข้าใช้, Meet กำลังรอการอนุมัติจากโฮสต์,
Chrome ต้องการสิทธิ์ไมโครโฟน/กล้องสำหรับการเข้าร่วมแบบเรียลไทม์ หรือ Meet ค้างอยู่
ที่พรอมต์ที่ระบบอัตโนมัติแก้ไขไม่ได้ ผลลัพธ์ join/test-speech จะรายงาน
`manualActionRequired: true` พร้อม `manualActionReason` และ
`manualActionMessage` Agents ควรหยุดลองเข้าร่วมซ้ำ รายงานข้อความนั้นตามจริง
พร้อม `browserUrl`/`browserTitle` ปัจจุบัน และลองใหม่หลังจากการดำเนินการด้วยตนเอง
ในเบราว์เซอร์เสร็จสมบูรณ์เท่านั้น

หากละ `chromeNode.node` ไว้ OpenClaw จะเลือกอัตโนมัติก็ต่อเมื่อมี
Node ที่เชื่อมต่ออยู่เพียงหนึ่งตัวซึ่งประกาศทั้ง `googlemeet.chrome` และการควบคุมเบราว์เซอร์
หากมี Node ที่รองรับหลายตัวเชื่อมต่ออยู่ ให้ตั้ง `chromeNode.node` เป็น id ของ Node,
ชื่อที่แสดง หรือ IP ระยะไกล

การตรวจสอบความล้มเหลวที่พบบ่อย:

- `Configured Google Meet node ... is not usable: offline`: Node ที่ปักหมุดไว้
  เป็นที่รู้จักของ Gateway แต่ไม่พร้อมใช้งาน Agents ควรถือว่า Node นั้นเป็น
  สถานะเพื่อการวินิจฉัย ไม่ใช่โฮสต์ Chrome ที่ใช้งานได้ และรายงานตัวบล็อกการตั้งค่า
  แทนที่จะถอยกลับไปใช้การขนส่งอื่น เว้นแต่ผู้ใช้จะขอเช่นนั้น
- `No connected Google Meet-capable node`: เริ่ม `openclaw node run` ใน VM,
  อนุมัติการจับคู่ และตรวจสอบให้แน่ใจว่าได้เรียกใช้ `openclaw plugins enable google-meet` และ
  `openclaw plugins enable browser` ใน VM แล้ว ตรวจสอบด้วยว่า
  โฮสต์ Gateway อนุญาตคำสั่งของ Node ทั้งสองรายการด้วย
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`
- `BlackHole 2ch audio device not found`: ติดตั้ง `blackhole-2ch` บนโฮสต์
  ที่กำลังตรวจสอบ และรีบูตก่อนใช้เสียง Chrome ภายในเครื่อง
- `BlackHole 2ch audio device not found on the node`: ติดตั้ง `blackhole-2ch`
  ใน VM แล้วรีบูต VM
- Chrome เปิดขึ้นแต่เข้าร่วมไม่ได้: ลงชื่อเข้าใช้โปรไฟล์เบราว์เซอร์ภายใน VM หรือ
  ตั้งค่า `chrome.guestName` ไว้สำหรับการเข้าร่วมแบบผู้เยี่ยมชม การเข้าร่วมอัตโนมัติแบบผู้เยี่ยมชมใช้ระบบอัตโนมัติ
  ของเบราว์เซอร์ OpenClaw ผ่านพร็อกซีเบราว์เซอร์ของ Node ตรวจสอบให้แน่ใจว่าการกำหนดค่าเบราว์เซอร์
  ของ Node ชี้ไปยังโปรไฟล์ที่คุณต้องการ เช่น
  `browser.defaultProfile: "user"` หรือโปรไฟล์ existing-session ที่มีชื่ออยู่แล้ว
- แท็บ Meet ซ้ำ: เปิดใช้ `chrome.reuseExistingTab: true` ไว้ OpenClaw
  จะเปิดใช้งานแท็บที่มีอยู่สำหรับ URL ของ Meet เดียวกันก่อนเปิดแท็บใหม่ และ
  การสร้างการประชุมผ่านเบราว์เซอร์จะใช้แท็บ `https://meet.google.com/new`
  หรือแท็บพรอมต์บัญชี Google ที่กำลังดำเนินอยู่ซ้ำก่อนเปิดอีกแท็บ
- ไม่มีเสียง: ใน Meet ให้กำหนดเส้นทางเสียงไมโครโฟน/ลำโพงผ่านเส้นทางอุปกรณ์เสียงเสมือน
  ที่ OpenClaw ใช้ ใช้อุปกรณ์เสมือนแยกกันหรือการกำหนดเส้นทางแบบ Loopback-style
  สำหรับเสียงสองทางที่สะอาด

## หมายเหตุการติดตั้ง

ค่าเริ่มต้นการพูดตอบกลับของ Chrome ใช้เครื่องมือภายนอกสองตัว:

- `sox`: ยูทิลิตีเสียงแบบบรรทัดคำสั่ง Plugin ใช้คำสั่งอุปกรณ์ CoreAudio
  แบบชัดเจนสำหรับบริดจ์เสียง PCM16 ค่าเริ่มต้น 24 kHz
- `blackhole-2ch`: ไดรเวอร์เสียงเสมือนของ macOS สร้างอุปกรณ์เสียง `BlackHole 2ch`
  ที่ Chrome/Meet สามารถกำหนดเส้นทางผ่านได้

OpenClaw ไม่ได้รวมแพ็กเกจทั้งสองไว้หรือแจกจ่ายซ้ำ เอกสารขอให้ผู้ใช้
ติดตั้งเป็น dependency ของโฮสต์ผ่าน Homebrew SoX ได้รับอนุญาตใช้สิทธิ์เป็น
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole เป็น GPL-3.0 หากคุณสร้าง
ตัวติดตั้งหรือ appliance ที่รวม BlackHole กับ OpenClaw ให้ตรวจสอบข้อกำหนดสิทธิ์การใช้งาน
ต้นทางของ BlackHole หรือขอใบอนุญาตแยกจาก Existential Audio

## การขนส่ง

### Chrome

การขนส่ง Chrome เปิด URL ของ Meet ผ่านการควบคุมเบราว์เซอร์ของ OpenClaw และเข้าร่วม
เป็นโปรไฟล์เบราว์เซอร์ OpenClaw ที่ลงชื่อเข้าใช้แล้ว บน macOS, Plugin จะตรวจหา
`BlackHole 2ch` ก่อนเปิดใช้งาน หากมีการกำหนดค่าไว้ ระบบจะรันคำสั่งตรวจสุขภาพ
บริดจ์เสียงและคำสั่งเริ่มต้นก่อนเปิด Chrome ด้วย ใช้ `chrome` เมื่อ
Chrome/เสียงอยู่บนโฮสต์ Gateway; ใช้ `chrome-node` เมื่อ Chrome/เสียงอยู่
บน Node ที่จับคู่ไว้ เช่น VM macOS ของ Parallels สำหรับ Chrome ภายในเครื่อง ให้เลือก
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

การขนส่ง Twilio เป็นแผนการโทรที่เข้มงวดซึ่งมอบหมายให้ Voice Call Plugin
ไม่แยกวิเคราะห์หน้า Meet เพื่อหาหมายเลขโทรศัพท์

ใช้สิ่งนี้เมื่อไม่สามารถเข้าร่วมผ่าน Chrome ได้ หรือคุณต้องการตัวเลือกสำรองการโทรเข้า
Google Meet ต้องแสดงหมายเลขโทรเข้าและ PIN สำหรับการประชุม
OpenClaw จะไม่ค้นพบข้อมูลเหล่านั้นจากหน้า Meet

เปิดใช้ Voice Call Plugin บนโฮสต์ Gateway ไม่ใช่บน Node Chrome:

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

ระบุข้อมูลรับรอง Twilio ผ่าน environment หรือการกำหนดค่า Environment ช่วยกัน
ความลับออกจาก `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

ใช้ `realtime.provider: "openai"` กับ OpenAI provider Plugin และ
`OPENAI_API_KEY` แทน หากนั่นคือผู้ให้บริการเสียงเรียลไทม์ของคุณ

รีสตาร์ตหรือโหลด Gateway ใหม่หลังจากเปิดใช้ `voice-call`; การเปลี่ยนแปลงการกำหนดค่า Plugin
จะไม่ปรากฏในโปรเซส Gateway ที่กำลังรันอยู่จนกว่าจะโหลดใหม่

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

ใช้ `--dtmf-sequence` เมื่อการประชุมต้องใช้ลำดับที่กำหนดเอง:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth และการตรวจสอบก่อนดำเนินการ

OAuth เป็นตัวเลือกเสริมสำหรับการสร้างลิงก์ Meet เพราะ `googlemeet create` สามารถถอยกลับ
ไปใช้ระบบอัตโนมัติของเบราว์เซอร์ได้ กำหนดค่า OAuth เมื่อคุณต้องการการสร้างผ่าน API อย่างเป็นทางการ,
การแก้ไข space หรือการตรวจสอบก่อนดำเนินการของ Meet Media API

การเข้าถึง Google Meet API ใช้ OAuth ของผู้ใช้: สร้าง Google Cloud OAuth client,
ขอ scopes ที่จำเป็น อนุญาตบัญชี Google แล้วจัดเก็บ
refresh token ที่ได้ในค่ากำหนดของ Google Meet Plugin หรือระบุ
ตัวแปร environment `OPENCLAW_GOOGLE_MEET_*`

OAuth ไม่ได้แทนที่เส้นทางการเข้าร่วมผ่าน Chrome การขนส่ง Chrome และ Chrome-node
ยังคงเข้าร่วมผ่านโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้แล้ว, BlackHole/SoX และ Node
ที่เชื่อมต่ออยู่เมื่อคุณใช้การเข้าร่วมผ่านเบราว์เซอร์ OAuth ใช้สำหรับเส้นทาง
Google Meet API อย่างเป็นทางการเท่านั้น: สร้าง meeting spaces, resolve spaces,
และรันการตรวจสอบก่อนดำเนินการของ Meet Media API

### สร้างข้อมูลรับรอง Google

ใน Google Cloud Console:

1. สร้างหรือเลือก Google Cloud project
2. เปิดใช้ **Google Meet REST API** สำหรับโปรเจกต์นั้น
3. กำหนดค่าหน้าจอความยินยอม OAuth
   - **Internal** ง่ายที่สุดสำหรับองค์กร Google Workspace
   - **External** ใช้ได้กับการตั้งค่าส่วนบุคคล/ทดสอบ; ขณะที่แอปอยู่ใน Testing,
     ให้เพิ่มบัญชี Google แต่ละบัญชีที่จะอนุญาตแอปเป็นผู้ใช้ทดสอบ
4. เพิ่ม scopes ที่ OpenClaw ขอ:
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
`meetings.space.readonly` ให้ OpenClaw resolve URL/code ของ Meet เป็น spaces
`meetings.space.settings` ให้ OpenClaw ส่งค่าตั้ง `SpaceConfig` เช่น
`accessType` ระหว่างการสร้างห้องผ่าน API
`meetings.conference.media.readonly` ใช้สำหรับการตรวจสอบก่อนดำเนินการของ Meet Media API และงานสื่อ
Google อาจต้องให้ลงทะเบียน Developer Preview สำหรับการใช้งาน Media API จริง
หากคุณต้องการเพียงการเข้าร่วมผ่าน Chrome ที่อิงเบราว์เซอร์ ให้ข้าม OAuth ทั้งหมด

### ออก refresh token

กำหนดค่า `oauth.clientId` และ `oauth.clientSecret` แบบเลือกได้ หรือส่งผ่านเป็น
ตัวแปร environment แล้วรัน:

```bash
openclaw googlemeet auth login --json
```

คำสั่งจะพิมพ์บล็อกการกำหนดค่า `oauth` พร้อม refresh token ใช้ PKCE,
localhost callback ที่ `http://localhost:8085/oauth2callback` และโฟลว์
คัดลอก/วางด้วยตนเองด้วย `--manual`

ตัวอย่าง:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

ใช้โหมด manual เมื่อเบราว์เซอร์เข้าถึง callback ภายในเครื่องไม่ได้:

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

จัดเก็บอ็อบเจ็กต์ `oauth` ใต้การกำหนดค่า Google Meet Plugin:

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

เลือกใช้ตัวแปร environment เมื่อคุณไม่ต้องการให้ refresh token อยู่ในการกำหนดค่า
หากมีค่าทั้งใน config และ environment, Plugin จะ resolve จาก config
ก่อนแล้วจึงใช้ environment เป็น fallback

ความยินยอม OAuth รวมถึงการสร้าง Meet space, การเข้าถึงการอ่าน Meet space และ
การเข้าถึงการอ่านสื่อการประชุม Meet หากคุณยืนยันตัวตนก่อนที่รองรับการสร้างการประชุม
ให้รัน `openclaw googlemeet auth login --json` อีกครั้งเพื่อให้ refresh
token มี scope `meetings.space.created`

### ตรวจสอบ OAuth ด้วย doctor

รัน OAuth doctor เมื่อคุณต้องการตรวจสุขภาพที่รวดเร็วและไม่เปิดเผยความลับ:

```bash
openclaw googlemeet doctor --oauth --json
```

คำสั่งนี้ไม่โหลด runtime ของ Chrome หรือจำเป็นต้องมี Node Chrome ที่เชื่อมต่ออยู่
ตรวจสอบว่ามีการกำหนดค่า OAuth และ refresh token สามารถออก
access token ได้ รายงาน JSON รวมเฉพาะฟิลด์สถานะ เช่น `ok`, `configured`,
`tokenSource`, `expiresAt` และข้อความตรวจสอบ; ไม่พิมพ์ access
token, refresh token หรือ client secret

ผลลัพธ์ที่พบบ่อย:

| การตรวจสอบ           | ความหมาย                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | มี `oauth.clientId` พร้อม `oauth.refreshToken` หรือโทเค็นการเข้าถึงที่แคชไว้            |
| `oauth-token`        | โทเค็นการเข้าถึงที่แคชไว้ยังใช้ได้ หรือโทเค็นรีเฟรชออกโทเค็นการเข้าถึงใหม่แล้ว        |
| `meet-spaces-get`    | การตรวจสอบ `--meeting` แบบไม่บังคับแก้ไปยัง Meet space ที่มีอยู่แล้ว                   |
| `meet-spaces-create` | การตรวจสอบ `--create-space` แบบไม่บังคับสร้าง Meet space ใหม่แล้ว                      |

หากต้องการพิสูจน์การเปิดใช้งาน Google Meet API และขอบเขต `spaces.create` ด้วย ให้เรียกใช้การตรวจสอบการสร้างที่มีผลข้างเคียง:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` จะสร้าง Meet URL แบบใช้แล้วทิ้ง ใช้ตัวเลือกนี้เมื่อคุณต้องยืนยันว่าโปรเจกต์ Google Cloud เปิดใช้งาน Meet API แล้ว และบัญชีที่ได้รับอนุญาตมีขอบเขต `meetings.space.created`

หากต้องการพิสูจน์สิทธิ์อ่านสำหรับ meeting space ที่มีอยู่แล้ว:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` และ `resolve-space` พิสูจน์สิทธิ์อ่านใน space ที่มีอยู่แล้วซึ่งบัญชี Google ที่ได้รับอนุญาตเข้าถึงได้ `403` จากการตรวจสอบเหล่านี้โดยปกติหมายความว่า Google Meet REST API ถูกปิดใช้งาน, โทเค็นรีเฟรชที่ยินยอมไว้ไม่มีขอบเขตที่จำเป็น, หรือบัญชี Google ไม่สามารถเข้าถึง Meet space นั้นได้ ข้อผิดพลาดของโทเค็นรีเฟรชหมายความว่าให้เรียกใช้ `openclaw googlemeet auth login
--json` อีกครั้งและจัดเก็บบล็อก `oauth` ใหม่

ไม่จำเป็นต้องมีข้อมูลประจำตัว OAuth สำหรับกลไกสำรองผ่านเบราว์เซอร์ ในโหมดนั้น การยืนยันตัวตน Google มาจากโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้บน Node ที่เลือก ไม่ใช่จากคอนฟิก OpenClaw

ยอมรับตัวแปรสภาพแวดล้อมเหล่านี้เป็นค่าทดแทน:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` หรือ `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` หรือ `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` หรือ
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` หรือ `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` หรือ `GOOGLE_MEET_PREVIEW_ACK`

แก้ Meet URL, รหัส หรือ `spaces/{id}` ผ่าน `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

เรียกใช้การตรวจสอบล่วงหน้าก่อนงานสื่อ:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

แสดงรายการอาร์ติแฟกต์การประชุมและการเข้าร่วมหลังจาก Meet สร้างระเบียนการประชุมแล้ว:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

เมื่อใช้ `--meeting`, `artifacts` และ `attendance` จะใช้ระเบียนการประชุมล่าสุดตามค่าเริ่มต้น ส่ง `--all-conference-records` เมื่อคุณต้องการระเบียนทั้งหมดที่ยังถูกเก็บไว้สำหรับการประชุมนั้น

การค้นหา Calendar สามารถแก้ URL การประชุมจาก Google Calendar ก่อนอ่านอาร์ติแฟกต์ Meet ได้:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` ค้นหาปฏิทิน `primary` ของวันนี้เพื่อหาเหตุการณ์ Calendar ที่มีลิงก์ Google Meet ใช้ `--event <query>` เพื่อค้นหาข้อความเหตุการณ์ที่ตรงกัน และ `--calendar <id>` สำหรับปฏิทินที่ไม่ใช่ปฏิทินหลัก การค้นหา Calendar ต้องใช้การเข้าสู่ระบบ OAuth ใหม่ที่รวมขอบเขตอ่านอย่างเดียวของเหตุการณ์ Calendar
`calendar-events` แสดงตัวอย่างเหตุการณ์ Meet ที่ตรงกันและทำเครื่องหมายเหตุการณ์ที่ `latest`, `artifacts`, `attendance` หรือ `export` จะเลือก

หากคุณทราบรหัสระเบียนการประชุมอยู่แล้ว ให้ระบุโดยตรง:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

ยุติการประชุมที่ใช้งานอยู่สำหรับ space ที่สร้างด้วย API เมื่อคุณต้องการปิดห้องหลังการโทร:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

คำสั่งนี้เรียก Google Meet `spaces.endActiveConference` และต้องใช้ OAuth พร้อมขอบเขต `meetings.space.created` สำหรับ space ที่บัญชีที่ได้รับอนุญาตจัดการได้ OpenClaw ยอมรับอินพุตเป็น Meet URL, รหัสการประชุม หรือ `spaces/{id}` และแก้เป็นทรัพยากร space ของ API ก่อนยุติการประชุมที่ใช้งานอยู่
คำสั่งนี้แยกจาก `googlemeet leave`: `leave` หยุดการเข้าร่วมภายในเครื่อง/เซสชันของ OpenClaw ขณะที่ `end-active-conference` ขอให้ Google Meet ยุติการประชุมที่ใช้งานอยู่สำหรับ space นั้น

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

`artifacts` คืนค่าเมทาดาทาระเบียนการประชุมพร้อมเมทาดาทาทรัพยากรผู้เข้าร่วม, การบันทึก, ทรานสคริปต์, รายการทรานสคริปต์แบบมีโครงสร้าง และสมาร์ตโน้ต เมื่อ Google เปิดเผยข้อมูลนั้นสำหรับการประชุม ใช้ `--no-transcript-entries` เพื่อข้ามการค้นหารายการสำหรับการประชุมขนาดใหญ่ `attendance` ขยายผู้เข้าร่วมเป็นแถวเซสชันผู้เข้าร่วมพร้อมเวลาเห็นครั้งแรก/ครั้งสุดท้าย, ระยะเวลารวมของเซสชัน, แฟล็กมาสาย/ออกก่อน และทรัพยากรผู้เข้าร่วมที่ซ้ำกันซึ่งรวมตามผู้ใช้ที่ลงชื่อเข้าใช้หรือชื่อที่แสดง ส่ง `--no-merge-duplicates` เพื่อแยกทรัพยากรผู้เข้าร่วมดิบไว้ต่างหาก, `--late-after-minutes` เพื่อปรับการตรวจจับการมาสาย และ `--early-before-minutes` เพื่อปรับการตรวจจับการออกก่อน

`export` เขียนโฟลเดอร์ที่มี `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` และ `manifest.json`
`manifest.json` บันทึกอินพุตที่เลือก, ตัวเลือกการส่งออก, ระเบียนการประชุม, ไฟล์เอาต์พุต, จำนวน, แหล่งที่มาของโทเค็น, เหตุการณ์ Calendar เมื่อมีการใช้ และคำเตือนการดึงข้อมูลบางส่วน ส่ง `--zip` เพื่อเขียนไฟล์เก็บถาวรแบบพกพาไว้ข้างโฟลเดอร์ด้วย ส่ง `--include-doc-bodies` เพื่อส่งออกข้อความ Google Docs ของทรานสคริปต์และสมาร์ตโน้ตที่ลิงก์ไว้ผ่าน Google Drive `files.export`; ตัวเลือกนี้ต้องใช้การเข้าสู่ระบบ OAuth ใหม่ที่รวมขอบเขตอ่านอย่างเดียวของ Drive Meet หากไม่มี `--include-doc-bodies` การส่งออกจะรวมเฉพาะเมทาดาทา Meet และรายการทรานสคริปต์แบบมีโครงสร้างเท่านั้น หาก Google คืนค่าความล้มเหลวของอาร์ติแฟกต์บางส่วน เช่น ข้อผิดพลาดการแสดงรายการสมาร์ตโน้ต, รายการทรานสคริปต์ หรือเนื้อหาเอกสาร Drive สรุปและ manifest จะเก็บคำเตือนไว้แทนที่จะทำให้การส่งออกทั้งหมดล้มเหลว
ใช้ `--dry-run` เพื่อดึงข้อมูลอาร์ติแฟกต์/การเข้าร่วมเดียวกันและพิมพ์ JSON ของ manifest โดยไม่สร้างโฟลเดอร์หรือ ZIP วิธีนี้มีประโยชน์ก่อนเขียนการส่งออกขนาดใหญ่ หรือเมื่อเอเจนต์ต้องการเพียงจำนวน ระเบียนที่เลือก และคำเตือน

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

ตั้งค่า `"dryRun": true` เพื่อคืนเฉพาะ manifest การส่งออกและข้ามการเขียนไฟล์

เอเจนต์ยังสามารถสร้างห้องที่หนุนด้วย API พร้อมนโยบายการเข้าถึงที่ชัดเจนได้:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

และสามารถยุติการประชุมที่ใช้งานอยู่สำหรับห้องที่ทราบได้:

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

เรียกใช้ live smoke ที่มีการป้องกันกับการประชุมจริงที่ยังถูกเก็บไว้:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

เรียกใช้โพรบเบราว์เซอร์แบบ live ฟังก่อนกับการประชุมที่มีคนจะพูดและมีคำบรรยาย Meet พร้อมใช้งาน:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

สภาพแวดล้อม live smoke:

- `OPENCLAW_LIVE_TEST=1` เปิดใช้งานการทดสอบ live ที่มีการป้องกัน
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` ชี้ไปยัง Meet URL, รหัส หรือ
  `spaces/{id}` ที่ยังถูกเก็บไว้
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID` ให้รหัสไคลเอนต์ OAuth
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN` ให้โทเค็นรีเฟรช
- ไม่บังคับ: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` และ
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ใช้ชื่อค่าทดแทนเดียวกัน
  โดยไม่มีคำนำหน้า `OPENCLAW_`

live smoke พื้นฐานสำหรับอาร์ติแฟกต์/การเข้าร่วมต้องใช้
`https://www.googleapis.com/auth/meetings.space.readonly` และ
`https://www.googleapis.com/auth/meetings.conference.media.readonly` การค้นหา Calendar ต้องใช้ `https://www.googleapis.com/auth/calendar.events.readonly` การส่งออกเนื้อหาเอกสาร Drive ต้องใช้
`https://www.googleapis.com/auth/drive.meet.readonly`

สร้าง Meet space ใหม่:

```bash
openclaw googlemeet create
```

คำสั่งจะพิมพ์ `meeting uri` ใหม่, แหล่งที่มา และเซสชันเข้าร่วม เมื่อมีข้อมูลประจำตัว OAuth คำสั่งจะใช้ Google Meet API อย่างเป็นทางการ หากไม่มีข้อมูลประจำตัว OAuth คำสั่งจะใช้โปรไฟล์เบราว์เซอร์ที่ลงชื่อเข้าใช้ของ Chrome Node ที่ปักหมุดไว้เป็นกลไกสำรอง เอเจนต์สามารถใช้เครื่องมือ `google_meet` พร้อม `action: "create"` เพื่อสร้างและเข้าร่วมในขั้นตอนเดียว สำหรับการสร้างเฉพาะ URL ให้ส่ง `"join": false`

ตัวอย่างเอาต์พุต JSON จากกลไกสำรองผ่านเบราว์เซอร์:

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

หากกลไกสำรองผ่านเบราว์เซอร์เจอการเข้าสู่ระบบ Google หรือตัวบล็อกสิทธิ์ Meet ก่อนสร้าง URL ได้ เมธอด Gateway จะคืนการตอบกลับที่ล้มเหลว และเครื่องมือ `google_meet` จะคืนรายละเอียดแบบมีโครงสร้างแทนสตริงธรรมดา:

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

เมื่อเอเจนต์เห็น `manualActionRequired: true` ควรรายงาน `manualActionMessage` พร้อมบริบท Node/แท็บของเบราว์เซอร์ และหยุดเปิดแท็บ Meet ใหม่จนกว่าผู้ปฏิบัติงานจะทำขั้นตอนในเบราว์เซอร์เสร็จ

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
การย้อนกลับไปใช้เบราว์เซอร์ และขอให้ผู้ปฏิบัติงานเข้าสู่ระบบ Google ให้เสร็จก่อน
ลองใหม่

ตั้งค่า `preview.enrollmentAcknowledged: true` หลังจากยืนยันแล้วเท่านั้นว่าโปรเจกต์ Cloud
ของคุณ, OAuth principal และผู้เข้าร่วมการประชุมได้ลงทะเบียนใน Google
Workspace Developer Preview Program สำหรับ Meet media APIs แล้ว

## การกำหนดค่า

เส้นทาง Chrome agent ทั่วไปต้องการเพียงเปิดใช้ Plugin, BlackHole, SoX,
คีย์ผู้ให้บริการถอดเสียงแบบเรียลไทม์ และผู้ให้บริการ OpenClaw TTS ที่กำหนดค่าไว้
OpenAI เป็นผู้ให้บริการถอดเสียงค่าเริ่มต้น; ตั้งค่า `realtime.voiceProvider` เป็น
`"google"` และ `realtime.model` เพื่อใช้ Google Gemini Live สำหรับโหมด `bidi`
โดยไม่เปลี่ยนผู้ให้บริการถอดเสียงค่าเริ่มต้นของโหมด agent:

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
- `defaultMode: "agent"` (`"realtime"` ยอมรับเฉพาะในฐานะนามแฝงความเข้ากันได้แบบเดิม
  สำหรับ `"agent"`; การเรียกเครื่องมือใหม่ควรใช้ `"agent"`)
- `chromeNode.node`: id/name/IP ของ Node แบบเลือกได้สำหรับ `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ชื่อที่ใช้บนหน้าจอผู้เข้าร่วม Meet แบบไม่ได้ลงชื่อเข้าใช้
- `chrome.autoJoin: true`: กรอกชื่อผู้เข้าร่วมและคลิก Join Now แบบพยายามให้ดีที่สุด
  ผ่านระบบอัตโนมัติของเบราว์เซอร์ OpenClaw บน `chrome-node`
- `chrome.reuseExistingTab: true`: เปิดใช้งานแท็บ Meet ที่มีอยู่แทนการเปิดซ้ำ
- `chrome.waitForInCallMs: 20000`: รอให้แท็บ Meet รายงานว่าอยู่ในสาย
  ก่อนทริกเกอร์บทนำแบบพูดตอบกลับ
- `chrome.audioFormat: "pcm16-24khz"`: รูปแบบเสียงสำหรับคู่คำสั่ง ใช้
  `"g711-ulaw-8khz"` เฉพาะกับคู่คำสั่งแบบเดิม/กำหนดเองที่ยังส่งเสียงแบบโทรศัพท์
- `chrome.audioBufferBytes: 4096`: บัฟเฟอร์การประมวลผล SoX สำหรับคำสั่งเสียงคู่คำสั่ง Chrome
  ที่สร้างขึ้น นี่คือครึ่งหนึ่งของบัฟเฟอร์ค่าเริ่มต้น 8192 ไบต์ของ SoX
  ช่วยลดความหน่วงของ pipe ค่าเริ่มต้นโดยยังเหลือพื้นที่ให้เพิ่มได้บนโฮสต์ที่งานหนาแน่น
  ค่าที่ต่ำกว่าค่าขั้นต่ำของ SoX จะถูกจำกัดไว้ที่ 17 ไบต์
- `chrome.audioInputCommand`: คำสั่ง SoX ที่อ่านจาก CoreAudio `BlackHole 2ch`
  และเขียนเสียงใน `chrome.audioFormat`
- `chrome.audioOutputCommand`: คำสั่ง SoX ที่อ่านเสียงใน `chrome.audioFormat`
  และเขียนไปยัง CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: คำสั่งไมโครโฟนภายในเครื่องแบบเลือกได้ที่เขียน
  PCM โมโน little-endian แบบ signed 16 บิตสำหรับตรวจจับการแทรกระหว่างที่
  การเล่นเสียงของผู้ช่วยทำงานอยู่ ขณะนี้ใช้กับบริดจ์คู่คำสั่ง `chrome`
  ที่โฮสต์โดย Gateway
- `chrome.bargeInRmsThreshold: 650`: ระดับ RMS ที่นับเป็นการขัดจังหวะโดยมนุษย์
  บน `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: ระดับพีกที่นับเป็นการขัดจังหวะโดยมนุษย์
  บน `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: หน่วงเวลาขั้นต่ำระหว่างการล้างสถานะการขัดจังหวะโดยมนุษย์ซ้ำ
- `mode: "agent"`: โหมดพูดตอบกลับค่าเริ่มต้น เสียงพูดของผู้เข้าร่วมจะถูกถอดเสียงโดย
  ผู้ให้บริการถอดเสียงแบบเรียลไทม์ที่กำหนดค่าไว้ ส่งไปยังเอเจนต์ OpenClaw ที่กำหนดค่าไว้
  ในเซสชัน sub-agent แยกตามการประชุม และพูดกลับผ่านรันไทม์ OpenClaw TTS ปกติ
- `mode: "bidi"`: โหมดสำรองโมเดลเรียลไทม์แบบสองทิศทางโดยตรง
  ผู้ให้บริการเสียงแบบเรียลไทม์จะตอบเสียงพูดของผู้เข้าร่วมโดยตรง และอาจเรียก
  `openclaw_agent_consult` สำหรับคำตอบที่ลึกขึ้นหรือมีเครื่องมือสนับสนุน
- `mode: "transcribe"`: โหมดสังเกตการณ์อย่างเดียวโดยไม่มีบริดจ์พูดตอบกลับ
- `realtime.provider: "openai"`: ค่าถอยกลับเพื่อความเข้ากันได้ที่ใช้เมื่อไม่ได้ตั้งค่า
  ฟิลด์ผู้ให้บริการแบบ scoped ด้านล่าง
- `realtime.transcriptionProvider: "openai"`: id ผู้ให้บริการที่โหมด `agent` ใช้
  สำหรับการถอดเสียงแบบเรียลไทม์
- `realtime.voiceProvider`: id ผู้ให้บริการที่โหมด `bidi` ใช้สำหรับเสียงเรียลไทม์โดยตรง
  ตั้งค่านี้เป็น `"google"` เพื่อใช้ Gemini Live โดยยังคงให้การถอดเสียงโหมด agent อยู่บน OpenAI
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: การตอบกลับด้วยเสียงแบบสั้น พร้อม
  `openclaw_agent_consult` สำหรับคำตอบที่ลึกขึ้น
- `realtime.introMessage`: การตรวจสอบความพร้อมแบบพูดสั้นๆ เมื่อบริดจ์เรียลไทม์เชื่อมต่อ;
  ตั้งเป็น `""` เพื่อเข้าร่วมแบบเงียบ
- `realtime.agentId`: id เอเจนต์ OpenClaw แบบเลือกได้สำหรับ
  `openclaw_agent_consult`; ค่าเริ่มต้นคือ `main`

การ override แบบเลือกได้:

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

ElevenLabs สำหรับทั้งการฟังและการพูดในโหมด agent:

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
`messages.tts.providers.elevenlabs.voiceId` การตอบกลับของเอเจนต์ยังสามารถใช้
คำสั่งกำกับต่อการตอบกลับ `[[tts:voiceId=... model=eleven_v3]]` ได้เมื่อเปิดใช้การ
override โมเดล TTS แต่การกำหนดค่าคือค่าเริ่มต้นแบบกำหนดแน่นอนสำหรับการประชุม
เมื่อเข้าร่วม log ควรแสดง `transcriptionProvider=elevenlabs` และการตอบกลับด้วยเสียงแต่ละครั้ง
ควรบันทึก `provider=elevenlabs model=eleven_v3 voice=<voiceId>`

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
การโทร PSTN จริง, DTMF และคำทักทายบทนำให้กับ Voice Call plugin Voice Call
จะเล่นลำดับ DTMF ก่อนเปิดสตรีมสื่อเรียลไทม์ จากนั้นใช้ข้อความบทนำที่บันทึกไว้
เป็นคำทักทายเรียลไทม์เริ่มต้น หากไม่ได้เปิดใช้ `voice-call`
Google Meet ยังสามารถตรวจสอบและบันทึกแผนการโทรได้ แต่ไม่สามารถโทร Twilio ได้

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
`transport: "chrome-node"` เมื่อ Chrome ทำงานบน Node ที่จับคู่ไว้ เช่น Parallels
VM ในทั้งสองกรณี ผู้ให้บริการโมเดลและ `openclaw_agent_consult` จะทำงานบนโฮสต์
Gateway ดังนั้นข้อมูลรับรองโมเดลจึงอยู่ที่นั่น เมื่อใช้ค่าเริ่มต้น `mode: "agent"`,
ผู้ให้บริการถอดเสียงแบบเรียลไทม์จะจัดการการฟัง เอเจนต์ OpenClaw ที่กำหนดค่าไว้
จะสร้างคำตอบ และ OpenClaw TTS ปกติจะพูดคำตอบเข้าไปใน Meet ใช้
`mode: "bidi"` เมื่อคุณต้องการให้โมเดลเสียงเรียลไทม์ตอบโดยตรง
`mode: "realtime"` ดิบยังคงยอมรับในฐานะนามแฝงความเข้ากันได้แบบเดิมสำหรับ
`mode: "agent"` แต่จะไม่โฆษณาในสคีมาเครื่องมือของเอเจนต์อีกต่อไป
log โหมด agent จะมีผู้ให้บริการ/โมเดลการถอดเสียงที่ resolve แล้วเมื่อบริดจ์
เริ่มทำงาน และมีผู้ให้บริการ TTS, โมเดล, เสียง, รูปแบบเอาต์พุต และอัตราสุ่มตัวอย่าง
หลังการตอบกลับที่สังเคราะห์แต่ละครั้ง

ใช้ `action: "status"` เพื่อแสดงรายการเซสชันที่ทำงานอยู่หรือตรวจสอบ session ID ใช้
`action: "speak"` กับ `sessionId` และ `message` เพื่อให้เอเจนต์เรียลไทม์
พูดทันที ใช้ `action: "test_speech"` เพื่อสร้างหรือนำเซสชันกลับมาใช้ซ้ำ
ทริกเกอร์วลีที่รู้จัก และส่งคืนสุขภาพ `inCall` เมื่อโฮสต์ Chrome รายงานได้
`test_speech` จะบังคับ `mode: "agent"` เสมอ และจะล้มเหลวหากถูกขอให้ทำงานใน
`mode: "transcribe"` เพราะเซสชันสังเกตการณ์อย่างเดียวไม่สามารถส่งเสียงพูดได้โดยตั้งใจ
ผลลัพธ์ `speechOutputVerified` อิงจากจำนวนไบต์เอาต์พุตเสียงเรียลไทม์ที่เพิ่มขึ้น
ระหว่างการเรียกทดสอบนี้ ดังนั้นเซสชันที่นำกลับมาใช้ซ้ำพร้อมเสียงเก่าจะไม่ถูกนับว่าเป็น
การตรวจสอบเสียงพูดที่สำเร็จใหม่ ใช้ `action: "leave"` เพื่อทำเครื่องหมายว่าเซสชันสิ้นสุดแล้ว

`status` มีสุขภาพ Chrome เมื่อมีข้อมูล:

- `inCall`: Chrome ดูเหมือนอยู่ภายในสาย Meet
- `micMuted`: สถานะไมโครโฟน Meet แบบพยายามให้ดีที่สุด
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: โปรไฟล์
  เบราว์เซอร์ต้องเข้าสู่ระบบด้วยตนเอง, ได้รับอนุญาตจากโฮสต์ Meet, สิทธิ์อนุญาต หรือ
  ซ่อมแซมการควบคุมเบราว์เซอร์ก่อนที่เสียงพูดจะทำงานได้
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ว่าตอนนี้
  อนุญาตให้ใช้เสียงพูด Chrome ที่จัดการอยู่หรือไม่ `speechReady: false` หมายความว่า OpenClaw
  ไม่ได้ส่งวลีบทนำ/ทดสอบเข้าไปในบริดจ์เสียง
- `providerConnected` / `realtimeReady`: สถานะบริดจ์เสียงเรียลไทม์
- `lastInputAt` / `lastOutputAt`: เสียงล่าสุดที่เห็นจากบริดจ์หรือส่งไปยังบริดจ์
- `audioOutputRouted` / `audioOutputDeviceLabel`: เอาต์พุตสื่อของแท็บ Meet
  ถูกกำหนดเส้นทางอย่างแข็งขันไปยังอุปกรณ์ BlackHole ที่บริดจ์ใช้หรือไม่
- `lastSuppressedInputAt` / `suppressedInputBytes`: อินพุต loopback ที่ถูกละเว้นขณะ
  การเล่นเสียงของผู้ช่วยทำงานอยู่

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## โหมด Agent และ Bidi

โหมด Chrome `agent` ได้รับการปรับให้เหมาะกับพฤติกรรม "เอเจนต์ของฉันอยู่ในการประชุม"
ผู้ให้บริการถอดเสียงแบบเรียลไทม์จะได้ยินเสียงการประชุม transcript สุดท้ายของผู้เข้าร่วม
จะถูกส่งผ่านเอเจนต์ OpenClaw ที่กำหนดค่าไว้ และคำตอบจะถูกพูดผ่านรันไทม์
OpenClaw TTS ปกติ ตั้งค่า `mode: "bidi"` เมื่อคุณต้องการให้โมเดลเสียงเรียลไทม์
ตอบโดยตรง
ชิ้นส่วน transcript สุดท้ายที่อยู่ใกล้กันจะถูกรวมเข้าด้วยกันก่อน consult เพื่อให้หนึ่งรอบการพูด
ไม่สร้างคำตอบบางส่วนเก่าหลายรายการ อินพุตเรียลไทม์ยังถูกระงับไว้ขณะเสียงผู้ช่วยที่อยู่ในคิว
ยังเล่นอยู่
และ echo ของ transcript ที่คล้ายผู้ช่วยล่าสุดจะถูกละเว้นก่อน consult เอเจนต์
เพื่อไม่ให้ BlackHole loopback ทำให้เอเจนต์ตอบเสียงของตัวเอง

| โหมด    | ใครตัดสินใจคำตอบ        | เส้นทางเอาต์พุตเสียงพูด                     | ใช้เมื่อ                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | เอเจนต์ OpenClaw ที่กำหนดค่าไว้ | รันไทม์ OpenClaw TTS ปกติ            | คุณต้องการพฤติกรรม "เอเจนต์ของฉันอยู่ในการประชุม"        |
| `bidi`  | โมเดลเสียงเรียลไทม์      | การตอบสนองเสียงจากผู้ให้บริการเสียงเรียลไทม์ | คุณต้องการลูปเสียงสนทนาที่มีความหน่วงต่ำที่สุด |

ในโหมด `bidi` เมื่อโมเดลเรียลไทม์ต้องการการให้เหตุผลที่ลึกขึ้น ข้อมูลปัจจุบัน
หรือเครื่องมือ OpenClaw ปกติ โมเดลสามารถเรียก `openclaw_agent_consult` ได้

เครื่องมือ consult เรียกใช้เอเจนต์ OpenClaw ปกติอยู่เบื้องหลังพร้อมบริบท
ทรานสคริปต์การประชุมล่าสุด และส่งคืนคำตอบแบบพูดที่กระชับ ในโหมด `agent`,
OpenClaw จะส่งคำตอบนั้นไปยัง TTS runtime โดยตรง; ในโหมด `bidi`, โมเดลเสียง
realtime สามารถพูดผลลัพธ์ consult กลับเข้าไปในการประชุมได้ เครื่องมือนี้ใช้
กลไก consult ที่ใช้ร่วมกันเดียวกับ Voice Call

โดยค่าเริ่มต้น consult จะรันกับเอเจนต์ `main` ตั้งค่า `realtime.agentId` เมื่อ
เลน Meet ควร consult workspace ของเอเจนต์ OpenClaw เฉพาะ, ค่าเริ่มต้นของโมเดล,
นโยบายเครื่องมือ, หน่วยความจำ และประวัติเซสชัน

consult ในโหมดเอเจนต์ใช้คีย์เซสชันต่อการประชุม
`agent:<id>:subagent:google-meet:<session>` เพื่อให้คำถามต่อเนื่องยังคงบริบท
การประชุมไว้ ขณะรับช่วงนโยบายเอเจนต์ปกติจากเอเจนต์ที่กำหนดค่าไว้

`realtime.toolPolicy` ควบคุมการรัน consult:

- `safe-read-only`: เปิดเผยเครื่องมือ consult และจำกัดเอเจนต์ปกติไว้ที่
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, และ
  `memory_get`
- `owner`: เปิดเผยเครื่องมือ consult และให้เอเจนต์ปกติใช้นโยบายเครื่องมือ
  เอเจนต์ตามปกติ
- `none`: อย่าเปิดเผยเครื่องมือ consult ให้กับโมเดลเสียง realtime

คีย์เซสชัน consult ถูกกำหนดขอบเขตต่อเซสชัน Meet ดังนั้นการเรียก consult ต่อเนื่อง
จึงสามารถใช้บริบท consult ก่อนหน้าอีกครั้งระหว่างการประชุมเดียวกันได้

หากต้องการบังคับการตรวจสอบความพร้อมแบบพูดหลังจาก Chrome เข้าร่วมสายอย่างสมบูรณ์แล้ว:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

สำหรับ smoke แบบเข้าร่วมและพูดแบบครบถ้วน:

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
- `googlemeet setup` มี `chrome-node-connected` เมื่อ Chrome-node เป็น
  transport เริ่มต้นหรือมีการปักหมุด node
- `nodes status` แสดงว่า node ที่เลือกเชื่อมต่ออยู่
- node ที่เลือกประกาศทั้ง `googlemeet.chrome` และ `browser.proxy`
- แท็บ Meet เข้าร่วมสาย และ `test-speech` ส่งคืนสถานะสุขภาพ Chrome พร้อม
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

สิ่งนี้พิสูจน์ว่า Plugin ของ Gateway ถูกโหลดแล้ว, node ของ VM เชื่อมต่อด้วย token
ปัจจุบัน และสะพานเสียงของ Meet พร้อมใช้งานก่อนที่เอเจนต์จะเปิดแท็บการประชุมจริง

สำหรับ Twilio smoke ให้ใช้การประชุมที่แสดงรายละเอียดการโทรเข้าโทรศัพท์:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

สถานะ Twilio ที่คาดหวัง:

- `googlemeet setup` มีการตรวจสอบ `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials`, และ `twilio-voice-call-webhook` เป็นสีเขียว
- `voicecall` พร้อมใช้งานใน CLI หลัง Gateway โหลดซ้ำ
- เซสชันที่ส่งคืนมี `transport: "twilio"` และ `twilio.voiceCallId`
- `openclaw logs --follow` แสดงว่า DTMF TwiML ถูกเสิร์ฟก่อน realtime TwiML
  จากนั้นเป็นสะพาน realtime พร้อมคำทักทายเริ่มต้นที่ถูกจัดคิวไว้
- `googlemeet leave <sessionId>` วางสาย voice call ที่มอบหมายไว้

## การแก้ไขปัญหา

### เอเจนต์มองไม่เห็นเครื่องมือ Google Meet

ยืนยันว่า Plugin เปิดใช้งานอยู่ในการกำหนดค่า Gateway แล้วโหลด Gateway ซ้ำ:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

หากคุณเพิ่งแก้ไข `plugins.entries.google-meet` ให้รีสตาร์ตหรือโหลด Gateway ซ้ำ
เอเจนต์ที่กำลังรันจะเห็นเฉพาะเครื่องมือ Plugin ที่ลงทะเบียนโดยโปรเซส Gateway
ปัจจุบันเท่านั้น

บนโฮสต์ Gateway ที่ไม่ใช่ macOS เครื่องมือ `google_meet` สำหรับเอเจนต์ยังคงมองเห็นได้
แต่การกระทำ talk-back ของ Chrome ภายในเครื่องจะถูกบล็อกก่อนถึงสะพานเสียง
เสียง talk-back ของ Chrome ภายในเครื่องในปัจจุบันต้องพึ่งพา `BlackHole 2ch` บน macOS
ดังนั้นเอเจนต์ Linux ควรใช้ `mode: "transcribe"`, การโทรเข้า Twilio, หรือโฮสต์
`chrome-node` บน macOS แทนเส้นทางเอเจนต์ Chrome ภายในเครื่องเริ่มต้น

### ไม่มี node ที่รองรับ Google Meet และเชื่อมต่ออยู่

บนโฮสต์ node ให้รัน:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

บนโฮสต์ Gateway ให้อนุมัติ node และยืนยันคำสั่ง:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

node ต้องเชื่อมต่ออยู่และแสดงรายการ `googlemeet.chrome` รวมถึง `browser.proxy`
การกำหนดค่า Gateway ต้องอนุญาตคำสั่ง node เหล่านั้น:

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
`gateway token mismatch` ให้ติดตั้งใหม่หรือรีสตาร์ต node ด้วย token ของ Gateway ปัจจุบัน
สำหรับ Gateway บน LAN โดยทั่วไปหมายถึง:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

จากนั้นโหลดบริการ node ซ้ำและรันใหม่:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### เบราว์เซอร์เปิดแต่เอเจนต์เข้าร่วมไม่ได้

รัน `googlemeet test-listen` สำหรับการเข้าร่วมแบบสังเกตอย่างเดียว หรือ
`googlemeet test-speech` สำหรับการเข้าร่วมแบบ realtime จากนั้นตรวจสอบสถานะสุขภาพ
Chrome ที่ส่งคืน หาก probe ใดรายงาน `manualActionRequired: true` ให้แสดง
`manualActionMessage` ต่อผู้ปฏิบัติงานและหยุดลองซ้ำจนกว่าการกระทำในเบราว์เซอร์จะเสร็จสมบูรณ์

การกระทำด้วยตนเองที่พบบ่อย:

- ลงชื่อเข้าใช้โปรไฟล์ Chrome
- อนุญาตผู้เข้าร่วมจากบัญชีโฮสต์ Meet
- ให้สิทธิ์ไมโครโฟน/กล้องแก่ Chrome เมื่อพรอมป์สิทธิ์แบบ native ของ Chrome ปรากฏขึ้น
- ปิดหรือซ่อมกล่องโต้ตอบสิทธิ์ Meet ที่ค้างอยู่

อย่ารายงานว่า "not signed in" เพียงเพราะ Meet แสดง "Do you want people to
hear you in the meeting?" นั่นคือ interstitial สำหรับการเลือกเสียงของ Meet; OpenClaw
จะคลิก **Use microphone** ผ่าน browser automation เมื่อพร้อมใช้งาน และรอต่อไปจนถึง
สถานะการประชุมจริง สำหรับ fallback ของเบราว์เซอร์แบบสร้างอย่างเดียว OpenClaw อาจคลิก
**Continue without microphone** เพราะการสร้าง URL ไม่ต้องใช้เส้นทางเสียง realtime

### การสร้างการประชุมล้มเหลว

`googlemeet create` ใช้ endpoint `spaces.create` ของ Google Meet API ก่อน
เมื่อมีการกำหนดค่าข้อมูลรับรอง OAuth หากไม่มีข้อมูลรับรอง OAuth จะ fallback ไปยัง
เบราว์เซอร์ Chrome node ที่ปักหมุดไว้ ยืนยันว่า:

- สำหรับการสร้างผ่าน API: มีการกำหนดค่า `oauth.clientId` และ `oauth.refreshToken`
  หรือมีตัวแปรสภาพแวดล้อม `OPENCLAW_GOOGLE_MEET_*` ที่ตรงกัน
- สำหรับการสร้างผ่าน API: refresh token ถูกสร้างหลังจากเพิ่มการรองรับการสร้าง
  token เก่าอาจไม่มี scope `meetings.space.created`; รัน
  `openclaw googlemeet auth login --json` อีกครั้งและอัปเดตการกำหนดค่า Plugin
- สำหรับ browser fallback: `defaultTransport: "chrome-node"` และ
  `chromeNode.node` ชี้ไปยัง node ที่เชื่อมต่ออยู่พร้อม `browser.proxy` และ
  `googlemeet.chrome`
- สำหรับ browser fallback: โปรไฟล์ OpenClaw Chrome บน node นั้นลงชื่อเข้าใช้
  Google แล้ว และสามารถเปิด `https://meet.google.com/new`
- สำหรับ browser fallback: การลองซ้ำใช้แท็บ `https://meet.google.com/new` หรือ
  แท็บพรอมป์บัญชี Google ที่มีอยู่ก่อนเปิดแท็บใหม่ หากเอเจนต์หมดเวลา ให้ลองเรียก
  เครื่องมือซ้ำแทนการเปิดแท็บ Meet อีกแท็บด้วยตนเอง
- สำหรับ browser fallback: หากเครื่องมือส่งคืน `manualActionRequired: true` ให้ใช้
  `browser.nodeId`, `browser.targetId`, `browserUrl`, และ `manualActionMessage`
  ที่ส่งคืนเพื่อแนะนำผู้ปฏิบัติงาน อย่าลองซ้ำเป็นลูปจนกว่าการกระทำนั้นจะเสร็จสมบูรณ์
- สำหรับ browser fallback: หาก Meet แสดง "Do you want people to hear you in the
  meeting?" ให้เปิดแท็บค้างไว้ OpenClaw ควรคลิก **Use microphone** หรือสำหรับ
  fallback แบบสร้างอย่างเดียว ให้คลิก **Continue without microphone** ผ่าน
  browser automation และรอต่อจนได้ Meet URL ที่สร้างขึ้น หากทำไม่ได้ ข้อผิดพลาด
  ควรกล่าวถึง `meet-audio-choice-required` ไม่ใช่ `google-login-required`

### เอเจนต์เข้าร่วมแต่ไม่พูด

ตรวจสอบเส้นทาง realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

ใช้ `mode: "agent"` สำหรับเส้นทางปกติ STT -> เอเจนต์ OpenClaw -> TTS talk-back,
หรือ `mode: "bidi"` สำหรับ fallback เสียง realtime โดยตรง `mode: "transcribe"`
จงใจไม่เริ่มสะพาน talk-back สำหรับการดีบักแบบสังเกตอย่างเดียว ให้รัน
`openclaw googlemeet status --json <session-id>` หลังผู้เข้าร่วมพูด แล้วตรวจสอบ
`captioning`, `transcriptLines`, และ `lastCaptionText` หาก `inCall` เป็น true แต่
`transcriptLines` ยังคงเป็น `0` คำบรรยาย Meet อาจถูกปิดใช้งาน, ยังไม่มีใครพูดหลังติดตั้ง
observer, UI ของ Meet เปลี่ยนไป, หรือ live captions ไม่พร้อมใช้งานสำหรับภาษา/บัญชีของการประชุม

`googlemeet test-speech` ตรวจสอบเส้นทาง realtime เสมอและรายงานว่ามีการสังเกตเห็น
bridge output bytes สำหรับการเรียกนั้นหรือไม่ หาก `speechOutputVerified` เป็น false และ
`speechOutputTimedOut` เป็น true ผู้ให้บริการ realtime อาจยอมรับ utterance แล้ว แต่
OpenClaw ไม่เห็น output bytes ใหม่ไปถึงสะพานเสียง Chrome

ตรวจสอบเพิ่มเติม:

- มีคีย์ผู้ให้บริการ realtime บนโฮสต์ Gateway เช่น `OPENAI_API_KEY` หรือ `GEMINI_API_KEY`
- `BlackHole 2ch` มองเห็นได้บนโฮสต์ Chrome
- มี `sox` อยู่บนโฮสต์ Chrome
- ไมโครโฟนและลำโพงของ Meet ถูก route ผ่านเส้นทางเสียง virtual ที่ OpenClaw ใช้
  `doctor` ควรแสดง `meet output routed: yes` สำหรับการเข้าร่วม realtime ด้วย Chrome ภายในเครื่อง

`googlemeet doctor [session-id]` พิมพ์เซสชัน, node, สถานะในสาย,
เหตุผลของการกระทำด้วยตนเอง, การเชื่อมต่อผู้ให้บริการ realtime, `realtimeReady`,
กิจกรรม input/output เสียง, timestamp เสียงล่าสุด, ตัวนับ byte, และ URL เบราว์เซอร์
ใช้ `googlemeet status [session-id] --json` เมื่อคุณต้องการ JSON ดิบ ใช้
`googlemeet doctor --oauth` เมื่อคุณต้องยืนยันการ refresh ของ Google Meet OAuth
โดยไม่เปิดเผย token; เพิ่ม `--meeting` หรือ `--create-space` เมื่อคุณต้องการหลักฐาน
Google Meet API ด้วย

หากเอเจนต์หมดเวลาและคุณเห็นแท็บ Meet เปิดอยู่แล้ว ให้ตรวจสอบแท็บนั้นโดยไม่เปิดอีกแท็บ:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

การกระทำเครื่องมือที่เทียบเท่าคือ `recover_current_tab` ซึ่งโฟกัสและตรวจสอบแท็บ Meet
ที่มีอยู่สำหรับ transport ที่เลือก เมื่อใช้ `chrome` จะใช้การควบคุมเบราว์เซอร์ภายในเครื่อง
ผ่าน Gateway; เมื่อใช้ `chrome-node` จะใช้ Chrome node ที่กำหนดค่าไว้ มันจะไม่เปิดแท็บใหม่
หรือสร้างเซสชันใหม่; แต่จะรายงานตัวขัดขวางปัจจุบัน เช่น สถานะ login, admission,
permissions, หรือ audio-choice คำสั่ง CLI คุยกับ Gateway ที่กำหนดค่าไว้ ดังนั้น Gateway
ต้องกำลังทำงาน; `chrome-node` ยังต้องให้ Chrome node เชื่อมต่ออยู่ด้วย

### การตรวจสอบการตั้งค่า Twilio ล้มเหลว

`twilio-voice-call-plugin` ล้มเหลวเมื่อ `voice-call` ไม่ได้รับอนุญาตหรือไม่ได้เปิดใช้งาน
เพิ่มไปยัง `plugins.allow`, เปิดใช้งาน `plugins.entries.voice-call`, และโหลด Gateway ซ้ำ

`twilio-voice-call-credentials` ล้มเหลวเมื่อ backend ของ Twilio ไม่มี account SID,
auth token, หรือหมายเลขผู้โทร ตั้งค่าสิ่งเหล่านี้บนโฮสต์ Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` ล้มเหลวเมื่อ `voice-call` ไม่มีการเปิดเผย Webhook สาธารณะ
หรือเมื่อ `publicUrl` ชี้ไปยัง local loopback หรือพื้นที่เครือข่ายส่วนตัว
ตั้งค่า `plugins.entries.voice-call.config.publicUrl` เป็น URL ของผู้ให้บริการสาธารณะ
หรือกำหนดค่า tunnel/Tailscale exposure สำหรับ `voice-call`

URL แบบ loopback และส่วนตัวไม่ถูกต้องสำหรับ carrier callbacks อย่าใช้
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, หรือ `fd00::/8` เป็น `publicUrl`

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

สำหรับการพัฒนาในเครื่อง ให้ใช้ tunnel หรือการเปิดให้เข้าถึงผ่าน Tailscale แทน URL ของโฮสต์ส่วนตัว:

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

จากนั้นรีสตาร์ทหรือโหลด Gateway ใหม่ แล้วรัน:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

ตามค่าเริ่มต้น `voicecall smoke` ใช้ตรวจสอบความพร้อมเท่านั้น หากต้องการทดลองแบบไม่ดำเนินการจริงกับหมายเลขเฉพาะ:

```bash
openclaw voicecall smoke --to "+15555550123"
```

เพิ่ม `--yes` เฉพาะเมื่อคุณตั้งใจจะโทรแจ้งเตือนขาออกแบบสดจริง:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### สาย Twilio เริ่มแล้วแต่ไม่เคยเข้าการประชุม

ยืนยันว่าเหตุการณ์ Meet แสดงรายละเอียดการโทรเข้า ส่งหมายเลขโทรเข้าและ PIN ที่ถูกต้อง หรือกำหนดลำดับ DTMF แบบกำหนดเอง:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

ใช้ `w` นำหน้าหรือใช้จุลภาคใน `--dtmf-sequence` หาก provider ต้องการหยุดพักก่อนป้อน PIN

หากสร้างสายโทรศัพท์แล้ว แต่รายชื่อผู้เข้าร่วมของ Meet ไม่เคยแสดงผู้เข้าร่วมแบบโทรเข้า:

- รัน `openclaw googlemeet doctor <session-id>` เพื่อยืนยัน ID สาย Twilio ที่มอบหมายแล้ว ตรวจสอบว่า DTMF ถูกจัดคิวไว้หรือไม่ และมีการขอคำทักทายเริ่มต้นหรือไม่
- รัน `openclaw voicecall status --call-id <id>` และยืนยันว่าสายยังคงทำงานอยู่
- รัน `openclaw voicecall tail` และตรวจสอบว่า Webhook ของ Twilio มาถึง Gateway
- รัน `openclaw logs --follow` แล้วมองหาลำดับ Twilio Meet: Google Meet มอบหมายการเข้าร่วม, Voice Call เก็บและให้บริการ DTMF TwiML ก่อนเชื่อมต่อ, Voice Call ให้บริการ TwiML แบบเรียลไทม์สำหรับสาย Twilio จากนั้น Google Meet ขอเสียงพูดแนะนำด้วย `voicecall.speak`
- รัน `openclaw googlemeet setup --transport twilio` อีกครั้ง การตรวจสอบ setup ที่ผ่านเป็นสีเขียวเป็นสิ่งจำเป็น แต่ไม่ได้พิสูจน์ว่าลำดับ PIN ของการประชุมถูกต้อง
- ยืนยันว่าหมายเลขโทรเข้าเป็นของคำเชิญ Meet และภูมิภาคเดียวกันกับ PIN
- เพิ่ม `voiceCall.dtmfDelayMs` จากค่าเริ่มต้น 12 วินาที หาก Meet รับสายช้า หรือข้อความถอดเสียงของสายยังคงแสดงพรอมป์ที่ขอ PIN หลังจากส่ง DTMF ก่อนเชื่อมต่อแล้ว
- หากผู้เข้าร่วมเข้าร่วมแล้วแต่คุณไม่ได้ยินคำทักทาย ให้ตรวจสอบ `openclaw logs --follow` สำหรับคำขอ `voicecall.speak` หลัง DTMF และตรวจสอบการเล่น TTS ผ่าน media-stream หรือ fallback `<Say>` ของ Twilio หากข้อความถอดเสียงของสายยังคงมี "enter the meeting PIN" แสดงว่าขาโทรศัพท์ยังไม่ได้เข้าห้อง Meet ดังนั้นผู้เข้าร่วมประชุมจะยังไม่ได้ยินเสียงพูด

หาก Webhook ไม่มาถึง ให้ดีบัก Plugin Voice Call ก่อน: provider ต้องเข้าถึง `plugins.entries.voice-call.config.publicUrl` หรือ tunnel ที่กำหนดค่าไว้ ดู [การแก้ปัญหาสายเสียง](/th/plugins/voice-call#troubleshooting)

## หมายเหตุ

API สื่ออย่างเป็นทางการของ Google Meet เน้นการรับสื่อ ดังนั้นการพูดเข้าไปในสาย Meet ยังคงต้องใช้เส้นทางผู้เข้าร่วม Plugin นี้ทำให้ขอบเขตนั้นมองเห็นได้ชัดเจน: Chrome จัดการการเข้าร่วมผ่านเบราว์เซอร์และการกำหนดเส้นทางเสียงในเครื่อง ส่วน Twilio จัดการการเข้าร่วมผ่านการโทรเข้า

โหมด talk-back ของ Chrome ต้องใช้ `BlackHole 2ch` พร้อมอย่างใดอย่างหนึ่งต่อไปนี้:

- `chrome.audioInputCommand` พร้อม `chrome.audioOutputCommand`: OpenClaw เป็นเจ้าของ bridge และส่งต่อเสียงใน `chrome.audioFormat` ระหว่างคำสั่งเหล่านั้นกับ provider ที่เลือก โหมด agent ใช้การถอดเสียงแบบเรียลไทม์พร้อม TTS ปกติ ส่วนโหมด bidi ใช้ provider เสียงแบบเรียลไทม์ เส้นทาง Chrome เริ่มต้นคือ PCM16 24 kHz พร้อม `chrome.audioBufferBytes: 4096`; G.711 mu-law 8 kHz ยังพร้อมใช้สำหรับคู่คำสั่งแบบเดิม
- `chrome.audioBridgeCommand`: คำสั่ง bridge ภายนอกเป็นเจ้าของเส้นทางเสียงในเครื่องทั้งหมด และต้องออกหลังจากเริ่มหรือยืนยัน daemon ของตัวเองแล้ว สิ่งนี้ใช้ได้เฉพาะกับ `bidi` เพราะโหมด `agent` ต้องเข้าถึงคู่คำสั่งโดยตรงสำหรับ TTS

เมื่อ agent เรียกเครื่องมือ `google_meet` ในโหมด agent เซสชันที่ปรึกษาการประชุมจะ fork transcript ปัจจุบันของผู้เรียกก่อนตอบเสียงพูดของผู้เข้าร่วม เซสชัน Meet ยังคงแยกอยู่ (`agent:<agentId>:subagent:google-meet:<sessionId>`) ดังนั้นการติดตามผลของการประชุมจะไม่แก้ไข transcript ของผู้เรียกโดยตรง

เพื่อเสียงดูเพล็กซ์ที่สะอาด ให้กำหนดเส้นทางเอาต์พุต Meet และไมโครโฟน Meet ผ่านอุปกรณ์เสมือนแยกกัน หรือกราฟอุปกรณ์เสมือนแบบ Loopback-style อุปกรณ์ BlackHole ที่ใช้ร่วมกันเพียงตัวเดียวอาจสะท้อนเสียงผู้เข้าร่วมคนอื่นกลับเข้าไปในสายได้

ด้วย bridge Chrome แบบคู่คำสั่ง `chrome.bargeInInputCommand` สามารถฟังไมโครโฟนในเครื่องแยกต่างหาก และล้างการเล่นเสียงผู้ช่วยเมื่อมนุษย์เริ่มพูดได้ วิธีนี้ทำให้เสียงพูดของมนุษย์มาก่อนเอาต์พุตของผู้ช่วย แม้เมื่ออินพุต local loopback ของ BlackHole ที่ใช้ร่วมกันถูกระงับชั่วคราวระหว่างการเล่นเสียงผู้ช่วย เช่นเดียวกับ `chrome.audioInputCommand` และ `chrome.audioOutputCommand` สิ่งนี้เป็นคำสั่งในเครื่องที่ operator กำหนดค่า ใช้เส้นทางคำสั่งที่เชื่อถือได้อย่างชัดเจนหรือรายการอาร์กิวเมนต์ และอย่าชี้ไปยังสคริปต์จากตำแหน่งที่ไม่น่าเชื่อถือ

`googlemeet speak` จะทริกเกอร์ bridge เสียง talk-back ที่ใช้งานอยู่สำหรับเซสชัน Chrome `googlemeet leave` จะหยุด bridge นั้น สำหรับเซสชัน Twilio ที่มอบหมายผ่าน Plugin Voice Call คำสั่ง `leave` จะวางสายเสียงพื้นฐานด้วย ใช้ `googlemeet end-active-conference` เมื่อคุณต้องการปิดการประชุม Google Meet ที่ใช้งานอยู่สำหรับพื้นที่ที่จัดการด้วย API ด้วย

## ที่เกี่ยวข้อง

- [Plugin สายเสียง](/th/plugins/voice-call)
- [โหมดพูดคุย](/th/nodes/talk)
- [การสร้าง Plugin](/th/plugins/building-plugins)
