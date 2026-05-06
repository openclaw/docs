---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw เข้าร่วมการประชุม Google Meet
    - คุณต้องการให้เอเจนต์ OpenClaw สร้างการประชุม Google Meet ใหม่
    - คุณกำลังกำหนดค่า Chrome, Chrome node หรือ Twilio เป็นช่องทางรับส่งของ Google Meet
summary: 'Google Meet Plugin: เข้าร่วม URL ของ Meet ที่ระบุโดยตรงผ่าน Chrome หรือ Twilio พร้อมค่าเริ่มต้นการพูดตอบกลับของเอเจนต์'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-06T17:59:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b154e9cbce560dbc8327a140b27c17d2614d13d7011032a48b110314772ab0c
    source_path: plugins/google-meet.md
    workflow: 16
---

การรองรับผู้เข้าร่วม Google Meet สำหรับ OpenClaw ตั้งใจออกแบบให้ Plugin ทำงานแบบชัดเจน:

- จะเข้าร่วมเฉพาะ URL `https://meet.google.com/...` ที่ระบุชัดเจนเท่านั้น
- สามารถสร้างพื้นที่ Meet ใหม่ผ่าน Google Meet API แล้วเข้าร่วม URL ที่ส่งกลับมา
- `agent` คือโหมดตอบกลับด้วยเสียงเริ่มต้น: การถอดเสียงแบบเรียลไทม์จะฟัง, agent ของ OpenClaw ที่กำหนดค่าจะตอบ และ OpenClaw TTS ปกติจะพูดเข้าไปใน Meet
- `bidi` ยังคงพร้อมใช้เป็นโหมดโมเดลเสียงเรียลไทม์โดยตรงสำรอง
- agent เลือกพฤติกรรมการเข้าร่วมด้วย `mode`: ใช้ `agent` สำหรับการฟัง/ตอบกลับสด, `bidi` สำหรับเสียงเรียลไทม์โดยตรงสำรอง หรือ `transcribe` เพื่อเข้าร่วม/ควบคุมเบราว์เซอร์โดยไม่มีบริดจ์ตอบกลับด้วยเสียง
- การยืนยันตัวตนเริ่มจาก Google OAuth ส่วนบุคคลหรือโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้แล้ว
- ไม่มีการประกาศขอความยินยอมอัตโนมัติ
- แบ็กเอนด์เสียงเริ่มต้นของ Chrome คือ `BlackHole 2ch`
- Chrome สามารถทำงานภายในเครื่องหรือบนโฮสต์ Node ที่จับคู่ไว้ได้
- Twilio รับหมายเลขโทรเข้า พร้อม PIN หรือชุด DTMF ที่เลือกใส่ได้; ไม่สามารถโทรไปยัง URL ของ Meet ได้โดยตรง
- คำสั่ง CLI คือ `googlemeet`; `meet` สงวนไว้สำหรับเวิร์กโฟลว์การประชุมทางไกลของ agent ที่กว้างกว่า

## เริ่มต้นอย่างรวดเร็ว

ติดตั้งการพึ่งพาเสียงภายในเครื่อง และกำหนดค่าผู้ให้บริการถอดเสียงแบบเรียลไทม์พร้อม OpenClaw TTS ปกติ OpenAI คือผู้ให้บริการถอดเสียงเริ่มต้น; Google Gemini Live ก็ใช้ได้เช่นกันในฐานะเสียงสำรอง `bidi` แยกต่างหากด้วย `realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
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

ผลลัพธ์การตั้งค่าถูกออกแบบให้อ่านได้โดย agent และรู้จักโหมด โดยจะรายงานโปรไฟล์ Chrome, การปักหมุด Node และสำหรับการเข้าร่วม Chrome แบบเรียลไทม์ จะรายงานบริดจ์เสียง BlackHole/SoX และการตรวจสอบอินโทรเรียลไทม์แบบหน่วงเวลา สำหรับการเข้าร่วมแบบสังเกตอย่างเดียว ให้ตรวจสอบทรานสปอร์ตเดียวกันด้วย `--mode transcribe`; โหมดนั้นข้ามข้อกำหนดเบื้องต้นของเสียงเรียลไทม์ เพราะไม่ได้ฟังผ่านหรือพูดผ่านบริดจ์:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

เมื่อกำหนดค่าการมอบหมายผ่าน Twilio แล้ว การตั้งค่าจะรายงานด้วยว่า Plugin `voice-call`, ข้อมูลรับรอง Twilio และการเปิดเผย Webhook สาธารณะพร้อมใช้งานหรือไม่ ให้ถือว่าการตรวจสอบใด ๆ ที่เป็น `ok: false` เป็นตัวบล็อกสำหรับทรานสปอร์ตและโหมดที่ตรวจสอบ ก่อนขอให้ agent เข้าร่วม ใช้ `openclaw googlemeet setup --json` สำหรับสคริปต์หรือผลลัพธ์ที่เครื่องอ่านได้ ใช้ `--transport chrome`, `--transport chrome-node` หรือ `--transport twilio` เพื่อตรวจล่วงหน้าทรานสปอร์ตเฉพาะก่อนที่ agent จะลองใช้

สำหรับ Twilio ให้ตรวจล่วงหน้าทรานสปอร์ตอย่างชัดเจนเสมอเมื่อทรานสปอร์ตเริ่มต้นคือ Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

สิ่งนี้จะจับการเชื่อมต่อ `voice-call` ที่ขาดหาย, ข้อมูลรับรอง Twilio หรือการเปิดเผย Webhook ที่เข้าถึงไม่ได้ ก่อนที่ agent จะพยายามโทรเข้าการประชุม

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

เครื่องมือ `google_meet` สำหรับ agent ยังคงพร้อมใช้งานบนโฮสต์ที่ไม่ใช่ macOS สำหรับโฟลว์ artifact, calendar, setup, transcribe, Twilio และ `chrome-node` การกระทำตอบกลับด้วยเสียงของ Chrome ภายในเครื่องถูกบล็อกบนโฮสต์เหล่านั้น เพราะเส้นทางเสียง Chrome ที่รวมมาด้วยปัจจุบันพึ่งพา macOS `BlackHole 2ch` บน Linux ให้ใช้ `mode: "transcribe"`, การโทรเข้าผ่าน Twilio หรือโฮสต์ macOS `chrome-node` สำหรับการเข้าร่วม Chrome แบบตอบกลับด้วยเสียง

สร้างการประชุมใหม่และเข้าร่วม:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

สำหรับห้องที่สร้างผ่าน API ให้ใช้ Google Meet `SpaceConfig.accessType` เมื่อคุณต้องการให้นโยบายไม่ต้องเคาะขอเข้าห้องชัดเจน แทนที่จะสืบทอดจากค่าเริ่มต้นของบัญชี Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` อนุญาตให้ใครก็ตามที่มี URL ของ Meet เข้าร่วมได้โดยไม่ต้องเคาะขอเข้า `TRUSTED` อนุญาตให้ผู้ใช้ที่เชื่อถือได้ขององค์กรโฮสต์, ผู้ใช้ภายนอกที่ได้รับเชิญ และผู้ใช้ที่โทรเข้า เข้าร่วมได้โดยไม่ต้องเคาะขอเข้า `RESTRICTED` จำกัดการเข้าห้องโดยไม่ต้องเคาะขอเข้าไว้เฉพาะผู้ได้รับเชิญ การตั้งค่าเหล่านี้ใช้ได้กับเส้นทางการสร้างอย่างเป็นทางการของ Google Meet API เท่านั้น ดังนั้นต้องกำหนดค่าข้อมูลรับรอง OAuth

หากคุณยืนยันตัวตน Google Meet ก่อนที่ตัวเลือกนี้จะพร้อมใช้งาน ให้เรียกใช้ `openclaw googlemeet auth login --json` อีกครั้งหลังเพิ่มสโคป `meetings.space.settings` ลงในหน้าจอขอความยินยอม Google OAuth ของคุณ

สร้างเฉพาะ URL โดยไม่เข้าร่วม:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` มีสองเส้นทาง:

- สร้างด้วย API: ใช้เมื่อกำหนดค่าข้อมูลรับรอง Google Meet OAuth แล้ว นี่คือเส้นทางที่กำหนดได้แน่นอนที่สุด และไม่ขึ้นกับสถานะ UI ของเบราว์เซอร์
- ตัวสำรองผ่านเบราว์เซอร์: ใช้เมื่อไม่มีข้อมูลรับรอง OAuth OpenClaw ใช้ Node Chrome ที่ปักหมุดไว้ เปิด `https://meet.google.com/new` รอให้ Google เปลี่ยนเส้นทางไปยัง URL รหัสการประชุมจริง แล้วส่ง URL นั้นกลับมา เส้นทางนี้ต้องให้โปรไฟล์ Chrome ของ OpenClaw บน Node ลงชื่อเข้าใช้ Google อยู่แล้ว การทำงานอัตโนมัติของเบราว์เซอร์จะจัดการพรอมป์ไมโครโฟนครั้งแรกของ Meet เอง; พรอมป์นั้นไม่ถูกถือว่าเป็นความล้มเหลวในการเข้าสู่ระบบ Google
  โฟลว์เข้าร่วมและสร้างจะพยายามใช้แท็บ Meet ที่มีอยู่ซ้ำก่อนเปิดแท็บใหม่ด้วย การจับคู่จะไม่สนใจสตริงคิวรี URL ที่ไม่เป็นอันตราย เช่น `authuser` ดังนั้นการลองใหม่ของ agent ควรโฟกัสการประชุมที่เปิดอยู่แล้วแทนที่จะสร้างแท็บ Chrome ที่สอง

ผลลัพธ์ของคำสั่ง/เครื่องมือมีฟิลด์ `source` (`api` หรือ `browser`) เพื่อให้ agent อธิบายได้ว่าใช้เส้นทางใด `create` จะเข้าร่วมการประชุมใหม่ตามค่าเริ่มต้น และส่งกลับ `joined: true` พร้อมเซสชันการเข้าร่วม หากต้องการสร้างเฉพาะ URL ให้ใช้ `create --no-join` บน CLI หรือส่ง `"join": false` ให้เครื่องมือ

หรือบอก agent ว่า: "สร้าง Google Meet, เข้าร่วมด้วยโหมดตอบกลับด้วยเสียงของ agent และส่งลิงก์ให้ฉัน" agent ควรเรียก `google_meet` ด้วย `action: "create"` แล้วแชร์ `meetingUri` ที่ส่งกลับมา

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

สำหรับการเข้าร่วมแบบสังเกตอย่างเดียว/ควบคุมเบราว์เซอร์ ให้ตั้ง `"mode": "transcribe"` โหมดนี้จะไม่เริ่มบริดจ์เสียงเรียลไทม์แบบดูเพล็กซ์ ไม่ต้องใช้ BlackHole หรือ SoX และจะไม่พูดตอบกลับเข้าไปในการประชุม การเข้าร่วม Chrome ในโหมดนี้ยังหลีกเลี่ยงการอนุญาตไมโครโฟน/กล้องของ OpenClaw และหลีกเลี่ยงเส้นทาง **Use microphone** ของ Meet หาก Meet แสดงหน้าคั่นให้เลือกเสียง ระบบอัตโนมัติจะลองเส้นทางที่ไม่ใช้ไมโครโฟน และมิฉะนั้นจะรายงานการกระทำแบบแมนนวลแทนการเปิดไมโครโฟนภายในเครื่อง ในโหมดถอดเสียง ทรานสปอร์ต Chrome ที่จัดการอยู่จะติดตั้งตัวสังเกตคำบรรยาย Meet แบบพยายามสุดความสามารถด้วย `googlemeet status --json` และ `googlemeet doctor` จะแสดง `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` และส่วนท้าย `recentTranscript` สั้น ๆ เพื่อให้ผู้ปฏิบัติการบอกได้ว่าเบราว์เซอร์เข้าร่วมสายแล้วหรือไม่ และคำบรรยายของ Meet สร้างข้อความอยู่หรือไม่
ใช้ `openclaw googlemeet test-listen <meet-url> --transport chrome-node` เมื่อคุณต้องการโพรบแบบใช่/ไม่ใช่: คำสั่งนี้เข้าร่วมในโหมดถอดเสียง รอคำบรรยายใหม่หรือการเคลื่อนไหวของทรานสคริปต์ แล้วส่งกลับ `listenVerified`, `listenTimedOut`, ฟิลด์การกระทำแบบแมนนวล และสถานะคำบรรยายล่าสุด

ระหว่างเซสชันเรียลไทม์ สถานะ `google_meet` จะรวมสุขภาพของเบราว์เซอร์และบริดจ์เสียง เช่น `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, เวลาประทับอินพุต/เอาต์พุตล่าสุด, ตัวนับไบต์ และสถานะบริดจ์ที่ปิดแล้ว หากพรอมป์หน้า Meet ที่ปลอดภัยปรากฏขึ้น ระบบอัตโนมัติของเบราว์เซอร์จะจัดการเมื่อทำได้ การเข้าสู่ระบบ, การอนุมัติจากโฮสต์ และพรอมป์สิทธิ์ของเบราว์เซอร์/OS จะถูกรายงานเป็นการกระทำแบบแมนนวลพร้อมเหตุผลและข้อความให้ agent ถ่ายทอด เซสชัน Chrome ที่จัดการอยู่จะส่งอินโทรหรือวลีทดสอบออกมาเฉพาะหลังจากสุขภาพเบราว์เซอร์รายงาน `inCall: true`; มิฉะนั้นสถานะจะรายงาน `speechReady: false` และความพยายามพูดจะถูกบล็อกแทนการแสร้งว่า agent พูดเข้าไปในการประชุมแล้ว

การเข้าร่วม Chrome ภายในเครื่องใช้โปรไฟล์เบราว์เซอร์ OpenClaw ที่ลงชื่อเข้าใช้แล้ว โหมดเรียลไทม์ต้องใช้ `BlackHole 2ch` สำหรับเส้นทางไมโครโฟน/ลำโพงที่ OpenClaw ใช้ เพื่อเสียงดูเพล็กซ์ที่สะอาด ให้ใช้อุปกรณ์เสมือนแยกกันหรือกราฟแบบ Loopback; อุปกรณ์ BlackHole เดียวเพียงพอสำหรับการทดสอบ smoke ครั้งแรก แต่อาจเกิดเสียงสะท้อนได้

### Gateway ภายในเครื่อง + Parallels Chrome

คุณ **ไม่** จำเป็นต้องมี OpenClaw Gateway เต็มรูปแบบหรือคีย์ model API ภายใน VM macOS เพียงเพื่อให้ VM เป็นเจ้าของ Chrome ให้รัน Gateway และ agent ภายในเครื่อง แล้วรันโฮสต์ Node ใน VM เปิดใช้ Plugin ที่รวมมาด้วยบน VM หนึ่งครั้ง เพื่อให้ Node โฆษณาคำสั่ง Chrome:

สิ่งที่ทำงานอยู่ที่ไหน:

- โฮสต์ Gateway: OpenClaw Gateway, เวิร์กสเปซของ agent, คีย์ model/API, ผู้ให้บริการเรียลไทม์ และการกำหนดค่า Plugin Google Meet
- VM macOS ของ Parallels: OpenClaw CLI/โฮสต์ Node, Google Chrome, SoX, BlackHole 2ch และโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้ Google
- ไม่จำเป็นใน VM: บริการ Gateway, การกำหนดค่า agent, คีย์ OpenAI/GPT หรือการตั้งค่าผู้ให้บริการโมเดล

ติดตั้งการพึ่งพาใน VM:

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

ติดตั้งหรืออัปเดต OpenClaw ใน VM แล้วเปิดใช้ Plugin ที่รวมมาด้วยที่นั่น:

```bash
openclaw plugins enable google-meet
```

เริ่มโฮสต์ Node ใน VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

หาก `<gateway-host>` เป็น IP บน LAN และคุณไม่ได้ใช้ TLS, Node จะปฏิเสธ WebSocket แบบข้อความล้วน เว้นแต่คุณจะเลือกยอมรับสำหรับเครือข่ายส่วนตัวที่เชื่อถือได้นั้น:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` เป็นสภาพแวดล้อมของโปรเซส ไม่ใช่การตั้งค่า `openclaw.json` `openclaw node install` จะจัดเก็บค่านี้ไว้ในสภาพแวดล้อมของ LaunchAgent เมื่อมีอยู่ในคำสั่งติดตั้ง

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

หรือขอให้ agent ใช้เครื่องมือ `google_meet` พร้อม `transport: "chrome-node"`

สำหรับการทดสอบ smoke ด้วยคำสั่งเดียวที่สร้างหรือใช้เซสชันซ้ำ, พูดวลีที่รู้จัก และพิมพ์สุขภาพเซสชัน:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

ระหว่างการเข้าร่วมแบบเรียลไทม์ ระบบอัตโนมัติของเบราว์เซอร์ OpenClaw จะกรอกชื่อผู้เข้าร่วม คลิก
เข้าร่วม/ขอเข้าร่วม และยอมรับตัวเลือก "ใช้ไมโครโฟน" ครั้งแรกของ Meet เมื่อพรอมป์นั้น
ปรากฏขึ้น ระหว่างการเข้าร่วมแบบสังเกตการณ์เท่านั้นหรือการสร้างการประชุมผ่านเบราว์เซอร์เท่านั้น ระบบจะ
ดำเนินต่อผ่านพรอมป์เดียวกันโดยไม่ใช้ไมโครโฟนเมื่อมีตัวเลือกนั้นให้ใช้
หากโปรไฟล์เบราว์เซอร์ยังไม่ได้ลงชื่อเข้าใช้ Meet กำลังรอให้โฮสต์อนุญาต
Chrome ต้องการสิทธิ์ไมโครโฟน/กล้องสำหรับการเข้าร่วมแบบเรียลไทม์ หรือ Meet ค้างอยู่
บนพรอมป์ที่ระบบอัตโนมัติไม่สามารถจัดการได้ ผลลัพธ์ join/test-speech จะรายงาน
`manualActionRequired: true` พร้อม `manualActionReason` และ
`manualActionMessage` Agent ควรหยุดลองเข้าร่วมซ้ำ รายงานข้อความนั้นแบบตรงตัว
พร้อม `browserUrl`/`browserTitle` ปัจจุบัน และลองอีกครั้งหลังจาก
การดำเนินการด้วยตนเองในเบราว์เซอร์เสร็จสมบูรณ์เท่านั้น

หากละ `chromeNode.node` ไว้ OpenClaw จะเลือกอัตโนมัติเฉพาะเมื่อมี
Node ที่เชื่อมต่ออยู่เพียงหนึ่งรายการที่ประกาศทั้ง `googlemeet.chrome` และการควบคุมเบราว์เซอร์ หาก
มี Node ที่รองรับหลายรายการเชื่อมต่ออยู่ ให้ตั้ง `chromeNode.node` เป็น id ของ Node,
ชื่อที่แสดง หรือ IP ระยะไกล

การตรวจสอบความล้มเหลวที่พบบ่อย:

- `Configured Google Meet node ... is not usable: offline`: Node ที่ปักหมุดไว้เป็น
  ที่รู้จักของ Gateway แต่ไม่พร้อมใช้งาน Agent ควรมอง Node นั้นเป็น
  สถานะสำหรับวินิจฉัย ไม่ใช่โฮสต์ Chrome ที่ใช้งานได้ และรายงานตัวบล็อกการตั้งค่า
  แทนการถอยไปใช้ transport อื่น เว้นแต่ผู้ใช้ขอให้ทำเช่นนั้น
- `No connected Google Meet-capable node`: เริ่ม `openclaw node run` ใน VM,
  อนุมัติการจับคู่ และตรวจสอบให้แน่ใจว่าได้รัน `openclaw plugins enable google-meet` และ
  `openclaw plugins enable browser` ใน VM แล้ว ยืนยันด้วยว่า
  โฮสต์ Gateway อนุญาตคำสั่ง Node ทั้งสองรายการด้วย
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`
- `BlackHole 2ch audio device not found`: ติดตั้ง `blackhole-2ch` บนโฮสต์
  ที่กำลังตรวจสอบ แล้วรีบูตก่อนใช้เสียง Chrome ภายในเครื่อง
- `BlackHole 2ch audio device not found on the node`: ติดตั้ง `blackhole-2ch`
  ใน VM แล้วรีบูต VM
- Chrome เปิดขึ้นแต่เข้าร่วมไม่ได้: ลงชื่อเข้าใช้โปรไฟล์เบราว์เซอร์ภายใน VM หรือ
  คงค่า `chrome.guestName` ไว้สำหรับการเข้าร่วมแบบผู้เข้าร่วมภายนอก การเข้าร่วมอัตโนมัติแบบผู้เข้าร่วมภายนอกใช้ระบบอัตโนมัติเบราว์เซอร์ของ OpenClaw
  ผ่านพร็อกซีเบราว์เซอร์ของ Node; ตรวจสอบให้แน่ใจว่าคอนฟิกเบราว์เซอร์ของ Node
  ชี้ไปยังโปรไฟล์ที่คุณต้องการ ตัวอย่างเช่น
  `browser.defaultProfile: "user"` หรือโปรไฟล์เซสชันเดิมที่มีชื่อ
- แท็บ Meet ซ้ำ: เปิดใช้งาน `chrome.reuseExistingTab: true` ไว้ OpenClaw
  จะเปิดใช้งานแท็บเดิมสำหรับ URL Meet เดียวกันก่อนเปิดแท็บใหม่ และ
  การสร้างการประชุมผ่านเบราว์เซอร์จะใช้ `https://meet.google.com/new`
  ที่กำลังดำเนินอยู่ หรือแท็บพรอมป์บัญชี Google เดิมก่อนเปิดแท็บอื่น
- ไม่มีเสียง: ใน Meet ให้กำหนดเส้นทางไมโครโฟน/ลำโพงผ่านเส้นทางอุปกรณ์เสียงเสมือน
  ที่ OpenClaw ใช้; ใช้อุปกรณ์เสมือนแยกกันหรือการกำหนดเส้นทางแบบ Loopback
  เพื่อเสียงสองทางที่สะอาด

## หมายเหตุการติดตั้ง

ค่าเริ่มต้น talk-back ของ Chrome ใช้เครื่องมือภายนอกสองรายการ:

- `sox`: ยูทิลิตีเสียงแบบบรรทัดคำสั่ง Plugin ใช้คำสั่งอุปกรณ์ CoreAudio
  แบบระบุชัดเจนสำหรับบริดจ์เสียง PCM16 24 kHz ค่าเริ่มต้น
- `blackhole-2ch`: ไดรเวอร์เสียงเสมือนของ macOS โดยจะสร้างอุปกรณ์เสียง `BlackHole 2ch`
  ที่ Chrome/Meet สามารถกำหนดเส้นทางผ่านได้

OpenClaw ไม่ได้รวมแพ็กเกจหรือแจกจ่ายแพ็กเกจใดแพ็กเกจหนึ่งนี้ซ้ำ เอกสารขอให้ผู้ใช้
ติดตั้งเป็น dependency ของโฮสต์ผ่าน Homebrew SoX ใช้สัญญาอนุญาต
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole เป็น GPL-3.0 หากคุณสร้าง
ตัวติดตั้งหรือ appliance ที่รวม BlackHole กับ OpenClaw ให้ตรวจสอบเงื่อนไขสัญญาอนุญาต upstream
ของ BlackHole หรือขอใบอนุญาตแยกต่างหากจาก Existential Audio

## Transport

### Chrome

Chrome transport เปิด URL Meet ผ่านการควบคุมเบราว์เซอร์ของ OpenClaw และเข้าร่วม
ด้วยโปรไฟล์เบราว์เซอร์ OpenClaw ที่ลงชื่อเข้าใช้แล้ว บน macOS Plugin จะตรวจสอบ
`BlackHole 2ch` ก่อนเปิดใช้งาน หากกำหนดค่าไว้ ระบบจะรันคำสั่งตรวจสุขภาพ
บริดจ์เสียงและคำสั่งเริ่มต้นก่อนเปิด Chrome ด้วย ใช้ `chrome` เมื่อ
Chrome/เสียงอยู่บนโฮสต์ Gateway; ใช้ `chrome-node` เมื่อ Chrome/เสียงอยู่
บน Node ที่จับคู่ เช่น VM macOS ของ Parallels สำหรับ Chrome ภายในเครื่อง ให้เลือก
โปรไฟล์ด้วย `browser.defaultProfile`; `chrome.browserProfile` จะถูกส่งไปยัง
โฮสต์ `chrome-node`

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

กำหนดเส้นทางเสียงไมโครโฟนและลำโพงของ Chrome ผ่านบริดจ์เสียง OpenClaw ภายในเครื่อง
หากไม่ได้ติดตั้ง `BlackHole 2ch` การเข้าร่วมจะล้มเหลวด้วยข้อผิดพลาดการตั้งค่า
แทนที่จะเข้าร่วมแบบเงียบๆ โดยไม่มีเส้นทางเสียง

### Twilio

Twilio transport เป็นแผนการโทรแบบเข้มงวดที่มอบหมายให้ Voice Call Plugin
มันไม่แยกวิเคราะห์หน้า Meet เพื่อค้นหาหมายเลขโทรศัพท์

ใช้สิ่งนี้เมื่อไม่สามารถเข้าร่วมผ่าน Chrome ได้ หรือคุณต้องการทางเลือกสำรองแบบโทรเข้า
Google Meet ต้องแสดงหมายเลขโทรเข้าและ PIN สำหรับ
การประชุม; OpenClaw จะไม่ค้นพบข้อมูลเหล่านั้นจากหน้า Meet

เปิดใช้งาน Voice Call Plugin บนโฮสต์ Gateway ไม่ใช่บน Node Chrome:

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

ระบุข้อมูลรับรอง Twilio ผ่าน environment หรือ config Environment ช่วยกัน
ความลับออกจาก `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

ใช้ `realtime.provider: "openai"` พร้อม OpenAI provider Plugin และ
`OPENAI_API_KEY` แทน หากนั่นคือผู้ให้บริการเสียงเรียลไทม์ของคุณ

รีสตาร์ทหรือโหลด Gateway ใหม่หลังจากเปิดใช้งาน `voice-call`; การเปลี่ยนแปลงคอนฟิก Plugin
จะไม่ปรากฏในโปรเซส Gateway ที่กำลังรันอยู่จนกว่าจะโหลดใหม่

จากนั้นตรวจสอบ:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

เมื่อการมอบหมาย Twilio เชื่อมต่อเรียบร้อยแล้ว `googlemeet setup` จะมีการตรวจสอบ
`twilio-voice-call-plugin`, `twilio-voice-call-credentials` และ
`twilio-voice-call-webhook` ที่สำเร็จ

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

OAuth เป็นทางเลือกสำหรับการสร้างลิงก์ Meet เพราะ `googlemeet create` สามารถถอยไปใช้
ระบบอัตโนมัติเบราว์เซอร์ได้ กำหนดค่า OAuth เมื่อคุณต้องการการสร้างผ่าน API ทางการ,
การแก้ข้อมูล space หรือการตรวจสอบ preflight ของ Meet Media API

การเข้าถึง Google Meet API ใช้ OAuth ของผู้ใช้: สร้างไคลเอนต์ Google Cloud OAuth,
ขอ scope ที่จำเป็น อนุญาตบัญชี Google จากนั้นจัดเก็บ
refresh token ที่ได้ในคอนฟิก Google Meet Plugin หรือระบุผ่าน
ตัวแปร environment `OPENCLAW_GOOGLE_MEET_*`

OAuth ไม่ได้แทนที่เส้นทางการเข้าร่วมผ่าน Chrome Chrome และ Chrome-node transport
ยังคงเข้าร่วมผ่านโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้แล้ว, BlackHole/SoX และ Node
ที่เชื่อมต่อ เมื่อคุณใช้การเข้าร่วมผ่านเบราว์เซอร์ OAuth ใช้สำหรับเส้นทาง Google
Meet API ทางการเท่านั้น: สร้างพื้นที่ประชุม แก้ข้อมูล space และรันการตรวจสอบ
preflight ของ Meet Media API

### สร้างข้อมูลรับรอง Google

ใน Google Cloud Console:

1. สร้างหรือเลือกโปรเจกต์ Google Cloud
2. เปิดใช้งาน **Google Meet REST API** สำหรับโปรเจกต์นั้น
3. กำหนดค่าหน้าจอคำยินยอม OAuth
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
`meetings.space.readonly` ช่วยให้ OpenClaw แก้ URL/โค้ด Meet เป็น space ได้
`meetings.space.settings` ช่วยให้ OpenClaw ส่งการตั้งค่า `SpaceConfig` เช่น
`accessType` ระหว่างการสร้างห้องผ่าน API
`meetings.conference.media.readonly` ใช้สำหรับ preflight ของ Meet Media API และงานสื่อ
Google อาจต้องการการลงทะเบียน Developer Preview สำหรับการใช้งาน Media API จริง
หากคุณต้องการเพียงการเข้าร่วม Chrome ผ่านเบราว์เซอร์ ให้ข้าม OAuth ทั้งหมด

### สร้าง refresh token

กำหนดค่า `oauth.clientId` และ `oauth.clientSecret` หากต้องการ หรือส่งเป็น
ตัวแปร environment จากนั้นรัน:

```bash
openclaw googlemeet auth login --json
```

คำสั่งจะพิมพ์บล็อกคอนฟิก `oauth` พร้อม refresh token มันใช้ PKCE,
callback localhost ที่ `http://localhost:8085/oauth2callback` และโฟลว์
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

จัดเก็บอ็อบเจ็กต์ `oauth` ไว้ใต้คอนฟิก Google Meet Plugin:

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

ควรใช้ตัวแปร environment เมื่อคุณไม่ต้องการให้ refresh token อยู่ใน config
หากมีทั้งค่า config และ environment Plugin จะ resolve config
ก่อน แล้วจึง fallback ไปยัง environment

คำยินยอม OAuth รวมการสร้าง Meet space, การเข้าถึงแบบอ่าน Meet space และการเข้าถึงแบบอ่าน
สื่อการประชุม Meet หากคุณยืนยันตัวตนก่อนที่การรองรับการสร้างการประชุม
จะมีอยู่ ให้รัน `openclaw googlemeet auth login --json` อีกครั้งเพื่อให้ refresh
token มี scope `meetings.space.created`

### ตรวจสอบ OAuth ด้วย doctor

รัน OAuth doctor เมื่อคุณต้องการการตรวจสุขภาพที่รวดเร็วและไม่เปิดเผยความลับ:

```bash
openclaw googlemeet doctor --oauth --json
```

สิ่งนี้ไม่โหลด runtime ของ Chrome หรือจำเป็นต้องมี Node Chrome ที่เชื่อมต่ออยู่ มัน
ตรวจสอบว่ามีคอนฟิก OAuth และ refresh token สามารถออก access
token ได้ รายงาน JSON มีเฉพาะฟิลด์สถานะ เช่น `ok`, `configured`,
`tokenSource`, `expiresAt` และข้อความตรวจสอบ; มันไม่พิมพ์ access
token, refresh token หรือ client secret

ผลลัพธ์ที่พบบ่อย:

| การตรวจสอบ | ความหมาย |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config` | มี `oauth.clientId` พร้อม `oauth.refreshToken` หรือโทเค็นการเข้าถึงที่แคชไว้ |
| `oauth-token` | โทเค็นการเข้าถึงที่แคชไว้ยังใช้งานได้ หรือโทเค็นรีเฟรชออกโทเค็นการเข้าถึงใหม่แล้ว |
| `meet-spaces-get` | การตรวจสอบ `--meeting` แบบไม่บังคับระบุพื้นที่ Meet ที่มีอยู่ได้สำเร็จ |
| `meet-spaces-create` | การตรวจสอบ `--create-space` แบบไม่บังคับสร้างพื้นที่ Meet ใหม่แล้ว |

หากต้องการพิสูจน์ด้วยว่ามีการเปิดใช้ Google Meet API และมีขอบเขต `spaces.create` ให้เรียกใช้การตรวจสอบสร้างที่มีผลข้างเคียง:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` จะสร้าง URL ของ Meet แบบใช้ชั่วคราว ใช้ตัวเลือกนี้เมื่อคุณต้องการยืนยันว่าโปรเจกต์ Google Cloud เปิดใช้ Meet API แล้ว และบัญชีที่ได้รับอนุญาตมีขอบเขต `meetings.space.created`

หากต้องการพิสูจน์สิทธิ์อ่านสำหรับพื้นที่ประชุมที่มีอยู่:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` และ `resolve-space` พิสูจน์สิทธิ์อ่านพื้นที่ที่มีอยู่ซึ่งบัญชี Google ที่ได้รับอนุญาตเข้าถึงได้ `403` จากการตรวจสอบเหล่านี้โดยปกติหมายถึง Google Meet REST API ถูกปิดใช้งาน โทเค็นรีเฟรชที่ยินยอมไว้ไม่มีขอบเขตที่ต้องใช้ หรือบัญชี Google ไม่สามารถเข้าถึงพื้นที่ Meet นั้นได้ ข้อผิดพลาดของโทเค็นรีเฟรชหมายถึงให้เรียกใช้ `openclaw googlemeet auth login
--json` อีกครั้งและจัดเก็บบล็อก `oauth` ใหม่

ไม่จำเป็นต้องมีข้อมูลรับรอง OAuth สำหรับทางเลือกสำรองผ่านเบราว์เซอร์ ในโหมดนั้น การยืนยันตัวตนของ Google มาจากโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้บน Node ที่เลือก ไม่ใช่จากการกำหนดค่า OpenClaw

ยอมรับตัวแปรสภาพแวดล้อมเหล่านี้เป็นทางเลือกสำรอง:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` หรือ `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` หรือ `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` หรือ
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` หรือ `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` หรือ `GOOGLE_MEET_PREVIEW_ACK`

ระบุ URL ของ Meet, โค้ด หรือ `spaces/{id}` ผ่าน `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

เรียกใช้การตรวจสอบล่วงหน้าก่อนงานสื่อ:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

แสดงรายการสิ่งประดิษฐ์การประชุมและการเข้าร่วมหลังจาก Meet สร้างระเบียนการประชุมแล้ว:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

เมื่อใช้ `--meeting` คำสั่ง `artifacts` และ `attendance` จะใช้ระเบียนการประชุมล่าสุดตามค่าเริ่มต้น ส่ง `--all-conference-records` เมื่อคุณต้องการระเบียนทั้งหมดที่ยังเก็บไว้สำหรับการประชุมนั้น

การค้นหา Calendar สามารถระบุ URL การประชุมจาก Google Calendar ก่อนอ่านสิ่งประดิษฐ์ของ Meet ได้:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` ค้นหา Calendar `primary` ของวันนี้เพื่อหาเหตุการณ์ Calendar ที่มีลิงก์ Google Meet ใช้ `--event <query>` เพื่อค้นหาข้อความเหตุการณ์ที่ตรงกัน และ `--calendar <id>` สำหรับ Calendar ที่ไม่ใช่ปฏิทินหลัก การค้นหา Calendar ต้องมีการเข้าสู่ระบบ OAuth ใหม่ที่รวมขอบเขตอ่านอย่างเดียวของเหตุการณ์ Calendar
`calendar-events` จะแสดงตัวอย่างเหตุการณ์ Meet ที่ตรงกันและทำเครื่องหมายเหตุการณ์ที่ `latest`, `artifacts`, `attendance` หรือ `export` จะเลือก

หากคุณทราบรหัสระเบียนการประชุมอยู่แล้ว ให้ระบุโดยตรง:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

จบการประชุมที่กำลังใช้งานสำหรับพื้นที่ที่สร้างผ่าน API เมื่อคุณต้องการปิดห้องหลังการโทร:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

คำสั่งนี้เรียก Google Meet `spaces.endActiveConference` และต้องใช้ OAuth ที่มีขอบเขต `meetings.space.created` สำหรับพื้นที่ที่บัญชีที่ได้รับอนุญาตจัดการได้ OpenClaw ยอมรับอินพุตเป็น URL ของ Meet, โค้ดการประชุม หรือ `spaces/{id}` และระบุให้เป็นทรัพยากรพื้นที่ของ API ก่อนจบการประชุมที่กำลังใช้งาน
คำสั่งนี้แยกจาก `googlemeet leave`: `leave` หยุดการเข้าร่วมภายในเครื่องหรือเซสชันของ OpenClaw ขณะที่ `end-active-conference` ขอให้ Google Meet จบการประชุมที่กำลังใช้งานสำหรับพื้นที่นั้น

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

`artifacts` ส่งคืนข้อมูลเมตาของระเบียนการประชุม พร้อมข้อมูลเมตาทรัพยากรของผู้เข้าร่วม การบันทึก ทรานสคริปต์ รายการทรานสคริปต์แบบมีโครงสร้าง และสมาร์ตโน้ต เมื่อ Google เปิดเผยข้อมูลดังกล่าวสำหรับการประชุม ใช้ `--no-transcript-entries` เพื่อข้ามการค้นหารายการสำหรับการประชุมขนาดใหญ่ `attendance` ขยายผู้เข้าร่วมเป็นแถวเซสชันผู้เข้าร่วมที่มีเวลาที่เห็นครั้งแรกและครั้งล่าสุด ระยะเวลาเซสชันรวม แฟล็กมาสายและออกก่อนเวลา และทรัพยากรผู้เข้าร่วมที่ซ้ำกันซึ่งถูกรวมตามผู้ใช้ที่ลงชื่อเข้าใช้หรือชื่อที่แสดง ส่ง `--no-merge-duplicates` เพื่อเก็บทรัพยากรผู้เข้าร่วมดิบไว้แยกกัน, `--late-after-minutes` เพื่อปรับการตรวจจับการมาสาย และ `--early-before-minutes` เพื่อปรับการตรวจจับการออกก่อนเวลา

`export` เขียนโฟลเดอร์ที่มี `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` และ `manifest.json`
`manifest.json` บันทึกอินพุตที่เลือก ตัวเลือกการส่งออก ระเบียนการประชุม ไฟล์เอาต์พุต จำนวน แหล่งโทเค็น เหตุการณ์ Calendar เมื่อมีการใช้ และคำเตือนการดึงข้อมูลบางส่วน ส่ง `--zip` เพื่อเขียนไฟล์เก็บถาวรแบบพกพาไว้ข้างโฟลเดอร์ด้วย ส่ง `--include-doc-bodies` เพื่อส่งออกข้อความ Google Docs ของทรานสคริปต์และสมาร์ตโน้ตที่ลิงก์ผ่าน Google Drive `files.export`; ต้องมีการเข้าสู่ระบบ OAuth ใหม่ที่รวมขอบเขตอ่านอย่างเดียวของ Drive Meet หากไม่มี `--include-doc-bodies` การส่งออกจะรวมเฉพาะข้อมูลเมตาของ Meet และรายการทรานสคริปต์แบบมีโครงสร้างเท่านั้น หาก Google ส่งคืนความล้มเหลวบางส่วนของสิ่งประดิษฐ์ เช่น ข้อผิดพลาดในการแสดงรายการสมาร์ตโน้ต รายการทรานสคริปต์ หรือเนื้อหาเอกสาร Drive สรุปและแมนิเฟสต์จะเก็บคำเตือนไว้แทนที่จะทำให้การส่งออกทั้งหมดล้มเหลว
ใช้ `--dry-run` เพื่อดึงข้อมูลสิ่งประดิษฐ์และการเข้าร่วมชุดเดียวกันและพิมพ์ JSON ของแมนิเฟสต์โดยไม่สร้างโฟลเดอร์หรือ ZIP วิธีนี้มีประโยชน์ก่อนเขียนการส่งออกขนาดใหญ่ หรือเมื่อเอเจนต์ต้องการเพียงจำนวน ระเบียนที่เลือก และคำเตือน

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

ตั้งค่า `"dryRun": true` เพื่อส่งคืนเฉพาะแมนิเฟสต์การส่งออกและข้ามการเขียนไฟล์

เอเจนต์ยังสามารถสร้างห้องที่รองรับโดย API พร้อมนโยบายการเข้าถึงแบบชัดเจนได้:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

และสามารถจบการประชุมที่กำลังใช้งานสำหรับห้องที่ทราบได้:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

สำหรับการตรวจสอบแบบฟังก่อน เอเจนต์ควรใช้ `test_listen` ก่อนอ้างว่าการประชุมนั้นมีประโยชน์:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

เรียกใช้ live smoke ที่มีการป้องกันกับการประชุมจริงที่ยังเก็บไว้:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

เรียกใช้โพรบเบราว์เซอร์แบบฟังก่อนแบบ live กับการประชุมที่มีคนจะพูดพร้อมคำบรรยายของ Meet ที่พร้อมใช้งาน:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

สภาพแวดล้อม live smoke:

- `OPENCLAW_LIVE_TEST=1` เปิดใช้การทดสอบ live ที่มีการป้องกัน
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` ชี้ไปยัง URL ของ Meet, โค้ด หรือ
  `spaces/{id}` ที่ยังเก็บไว้
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID` ระบุรหัสไคลเอนต์ OAuth
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN` ระบุโทเค็นรีเฟรช
- ไม่บังคับ: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` และ
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ใช้ชื่อทางเลือกสำรองเดียวกันโดยไม่มีคำนำหน้า `OPENCLAW_`

live smoke พื้นฐานของสิ่งประดิษฐ์และการเข้าร่วมต้องใช้
`https://www.googleapis.com/auth/meetings.space.readonly` และ
`https://www.googleapis.com/auth/meetings.conference.media.readonly` การค้นหา Calendar ต้องใช้ `https://www.googleapis.com/auth/calendar.events.readonly` การส่งออกเนื้อหาเอกสาร Drive ต้องใช้
`https://www.googleapis.com/auth/drive.meet.readonly`

สร้างพื้นที่ Meet ใหม่:

```bash
openclaw googlemeet create
```

คำสั่งนี้พิมพ์ `meeting uri` ใหม่ แหล่งที่มา และเซสชันเข้าร่วม เมื่อมีข้อมูลรับรอง OAuth จะใช้ Google Meet API อย่างเป็นทางการ หากไม่มีข้อมูลรับรอง OAuth จะใช้โปรไฟล์เบราว์เซอร์ที่ลงชื่อเข้าใช้ของ Node Chrome ที่ปักหมุดไว้เป็นทางเลือกสำรอง เอเจนต์สามารถใช้เครื่องมือ `google_meet` พร้อม `action: "create"` เพื่อสร้างและเข้าร่วมในขั้นตอนเดียว สำหรับการสร้างเฉพาะ URL ให้ส่ง `"join": false`

ตัวอย่างเอาต์พุต JSON จากทางเลือกสำรองผ่านเบราว์เซอร์:

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

หากทางเลือกสำรองผ่านเบราว์เซอร์พบการเข้าสู่ระบบ Google หรือตัวขัดขวางสิทธิ์ Meet ก่อนที่จะสร้าง URL ได้ เมธอด Gateway จะส่งคืนการตอบกลับที่ล้มเหลว และเครื่องมือ `google_meet` จะส่งคืนรายละเอียดแบบมีโครงสร้างแทนสตริงธรรมดา:

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

เมื่อเอเจนต์เห็น `manualActionRequired: true` ควรรายงาน `manualActionMessage` พร้อมบริบท Node และแท็บของเบราว์เซอร์ แล้วหยุดเปิดแท็บ Meet ใหม่จนกว่าผู้ปฏิบัติงานจะทำขั้นตอนในเบราว์เซอร์เสร็จ

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
ต้องมีโปรไฟล์ Google Chrome ที่ลงชื่อเข้าใช้แล้วเพื่อเข้าร่วมผ่านเบราว์เซอร์ หาก
โปรไฟล์ถูกลงชื่อออก OpenClaw จะรายงาน `manualActionRequired: true` หรือข้อผิดพลาด
สำรองของเบราว์เซอร์ และขอให้ผู้ปฏิบัติงานดำเนินการเข้าสู่ระบบ Google ให้เสร็จ
ก่อนลองอีกครั้ง

ตั้งค่า `preview.enrollmentAcknowledged: true` หลังจากยืนยันแล้วเท่านั้นว่า
โปรเจกต์ Cloud, OAuth principal และผู้เข้าร่วมการประชุมของคุณได้ลงทะเบียนใน
Google Workspace Developer Preview Program สำหรับ Meet media APIs แล้ว

## การกำหนดค่า

เส้นทางเอเจนต์ Chrome ทั่วไปต้องการเพียงเปิดใช้ Plugin, BlackHole, SoX, คีย์
ผู้ให้บริการถอดเสียงแบบเรียลไทม์ และผู้ให้บริการ TTS ของ OpenClaw ที่กำหนดค่าไว้
OpenAI เป็นผู้ให้บริการถอดเสียงเริ่มต้น ตั้งค่า `realtime.voiceProvider` เป็น
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
- `defaultMode: "agent"` (`"realtime"` ยอมรับได้เฉพาะในฐานะ alias ความเข้ากันได้
  แบบเดิมสำหรับ `"agent"`; การเรียกเครื่องมือใหม่ควรระบุ `"agent"`)
- `chromeNode.node`: id/ชื่อ/IP ของ Node ที่เป็นตัวเลือกสำหรับ `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ชื่อที่ใช้บนหน้าจอแขก Meet ที่ไม่ได้ลงชื่อเข้าใช้
- `chrome.autoJoin: true`: กรอกชื่อแขกและคลิก Join Now แบบ best-effort
  ผ่านระบบอัตโนมัติของเบราว์เซอร์ OpenClaw บน `chrome-node`
- `chrome.reuseExistingTab: true`: เปิดใช้งานแท็บ Meet ที่มีอยู่แทนการเปิดซ้ำ
- `chrome.waitForInCallMs: 20000`: รอให้แท็บ Meet รายงานว่าอยู่ในสาย
  ก่อนทริกเกอร์บทนำแบบพูดตอบกลับ
- `chrome.audioFormat: "pcm16-24khz"`: รูปแบบเสียงของคู่คำสั่ง ใช้
  `"g711-ulaw-8khz"` เฉพาะกับคู่คำสั่งแบบเดิม/กำหนดเองที่ยังคงปล่อยเสียง
  โทรศัพท์ออกมา
- `chrome.audioBufferBytes: 4096`: บัฟเฟอร์ประมวลผล SoX สำหรับคำสั่งเสียงคู่คำสั่ง
  Chrome ที่สร้างขึ้น นี่คือครึ่งหนึ่งของบัฟเฟอร์เริ่มต้น 8192 ไบต์ของ SoX
  ซึ่งลดเวลาแฝงของ pipe เริ่มต้น ขณะยังเหลือพื้นที่ให้เพิ่มได้บนโฮสต์ที่ใช้งานหนัก
  ค่าที่ต่ำกว่าค่าขั้นต่ำของ SoX จะถูก clamp เป็น 17 ไบต์
- `chrome.audioInputCommand`: คำสั่ง SoX ที่อ่านจาก CoreAudio `BlackHole 2ch`
  และเขียนเสียงใน `chrome.audioFormat`
- `chrome.audioOutputCommand`: คำสั่ง SoX ที่อ่านเสียงใน `chrome.audioFormat`
  และเขียนไปยัง CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: คำสั่งไมโครโฟนในเครื่องที่เป็นตัวเลือก ซึ่งเขียน
  PCM โมโน signed 16-bit little-endian สำหรับตรวจจับการแทรกพูดของมนุษย์ขณะที่
  การเล่นเสียงของผู้ช่วยกำลังทำงานอยู่ ข้อนี้ใช้กับบริดจ์คู่คำสั่ง `chrome`
  ที่โฮสต์โดย Gateway ในขณะนี้
- `chrome.bargeInRmsThreshold: 650`: ระดับ RMS ที่นับเป็นการขัดจังหวะโดยมนุษย์บน
  `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: ระดับ peak ที่นับเป็นการขัดจังหวะโดยมนุษย์บน
  `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: หน่วงเวลาขั้นต่ำระหว่างการล้างสถานะการขัดจังหวะ
  โดยมนุษย์ซ้ำ
- `mode: "agent"`: โหมดพูดตอบกลับเริ่มต้น คำพูดของผู้เข้าร่วมจะถูกถอดเสียงโดย
  ผู้ให้บริการถอดเสียงแบบเรียลไทม์ที่กำหนดค่าไว้ ส่งไปยังเอเจนต์ OpenClaw
  ที่กำหนดค่าไว้ในเซสชันซับเอเจนต์ต่อการประชุม และพูดตอบกลับผ่านรันไทม์
  TTS ปกติของ OpenClaw
- `mode: "bidi"`: โหมดสำรองของโมเดลเรียลไทม์แบบสองทิศทางโดยตรง ผู้ให้บริการเสียง
  เรียลไทม์ตอบคำพูดของผู้เข้าร่วมโดยตรง และอาจเรียก
  `openclaw_agent_consult` เพื่อคำตอบเชิงลึก/ที่มีเครื่องมือสนับสนุน
- `mode: "transcribe"`: โหมดสังเกตอย่างเดียวโดยไม่มีบริดจ์พูดตอบกลับ
- `realtime.provider: "openai"`: ค่าสำรองความเข้ากันได้ที่ใช้เมื่อไม่ได้ตั้งค่า
  ฟิลด์ผู้ให้บริการแบบจำกัดขอบเขตด้านล่าง
- `realtime.transcriptionProvider: "openai"`: id ผู้ให้บริการที่โหมด `agent`
  ใช้สำหรับการถอดเสียงแบบเรียลไทม์
- `realtime.voiceProvider`: id ผู้ให้บริการที่โหมด `bidi` ใช้สำหรับเสียงเรียลไทม์
  โดยตรง ตั้งค่านี้เป็น `"google"` เพื่อใช้ Gemini Live ขณะคงการถอดเสียง
  โหมดเอเจนต์ไว้บน OpenAI
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: คำตอบพูดแบบสั้น พร้อม
  `openclaw_agent_consult` สำหรับคำตอบเชิงลึก
- `realtime.introMessage`: การตรวจสอบความพร้อมแบบพูดสั้น ๆ เมื่อบริดจ์เรียลไทม์
  เชื่อมต่อ ตั้งค่าเป็น `""` เพื่อเข้าร่วมแบบเงียบ
- `realtime.agentId`: id เอเจนต์ OpenClaw ที่เป็นตัวเลือกสำหรับ
  `openclaw_agent_consult`; ค่าเริ่มต้นคือ `main`

การเขียนทับที่เป็นตัวเลือก:

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
directive ต่อคำตอบ `[[tts:voiceId=... model=eleven_v3]]` ได้เมื่อเปิดใช้การ
เขียนทับโมเดล TTS แต่การกำหนดค่าคือค่าเริ่มต้นที่กำหนดแน่นอนสำหรับการประชุม
เมื่อเข้าร่วม log ควรแสดง `transcriptionProvider=elevenlabs` และคำตอบที่พูด
แต่ละครั้งควร log `provider=elevenlabs model=eleven_v3 voice=<voiceId>`

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

`voiceCall.enabled` มีค่าเริ่มต้นเป็น `true`; เมื่อใช้ทรานสปอร์ต Twilio จะมอบหมาย
การโทร PSTN จริง, DTMF และคำทักทายบทนำให้กับ Voice Call Plugin Voice Call
จะเล่นลำดับ DTMF ก่อนเปิดสตรีมสื่อแบบเรียลไทม์ จากนั้นใช้ข้อความบทนำที่บันทึกไว้
เป็นคำทักทายเรียลไทม์เริ่มต้น หากไม่ได้เปิดใช้ `voice-call` Google Meet ยังคง
ตรวจสอบและบันทึกแผนการโทรได้ แต่ไม่สามารถทำการโทร Twilio ได้

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
Gateway ดังนั้นข้อมูลรับรองของโมเดลจึงอยู่ที่นั่น ด้วยค่าเริ่มต้น
`mode: "agent"` ผู้ให้บริการถอดเสียงแบบเรียลไทม์จะจัดการการฟัง เอเจนต์ OpenClaw
ที่กำหนดค่าไว้จะสร้างคำตอบ และ TTS ปกติของ OpenClaw จะพูดคำตอบนั้นเข้าไปใน Meet
ใช้ `mode: "bidi"` เมื่อคุณต้องการให้โมเดลเสียงเรียลไทม์ตอบโดยตรง
`mode: "realtime"` แบบดิบยังคงยอมรับในฐานะ alias ความเข้ากันได้แบบเดิมสำหรับ
`mode: "agent"` แต่จะไม่ถูกโฆษณาในสคีมาเครื่องมือเอเจนต์อีกต่อไป
log โหมดเอเจนต์รวมผู้ให้บริการ/โมเดลถอดเสียงที่ resolve แล้วเมื่อบริดจ์เริ่มทำงาน
และผู้ให้บริการ TTS, โมเดล, เสียง, รูปแบบเอาต์พุต และ sample rate หลังคำตอบที่สังเคราะห์แต่ละครั้ง

ใช้ `action: "status"` เพื่อแสดงรายการเซสชันที่ทำงานอยู่หรือตรวจสอบ session ID
ใช้ `action: "speak"` พร้อม `sessionId` และ `message` เพื่อให้เอเจนต์เรียลไทม์
พูดทันที ใช้ `action: "test_speech"` เพื่อสร้างหรือนำเซสชันกลับมาใช้ ทริกเกอร์
วลีที่ทราบ และส่งคืนสุขภาพ `inCall` เมื่อโฮสต์ Chrome สามารถรายงานได้
`test_speech` จะบังคับ `mode: "agent"` เสมอ และจะล้มเหลวหากถูกขอให้ทำงานใน
`mode: "transcribe"` เพราะเซสชันสังเกตอย่างเดียวตั้งใจให้ไม่สามารถปล่อยเสียงพูดได้
ผลลัพธ์ `speechOutputVerified` อิงจากจำนวนไบต์เอาต์พุตเสียงแบบเรียลไทม์ที่เพิ่มขึ้น
ระหว่างการเรียกทดสอบนี้ ดังนั้นเซสชันที่นำกลับมาใช้พร้อมเสียงเก่าจะไม่นับเป็น
การตรวจสอบเสียงพูดที่สำเร็จใหม่ ใช้ `action: "leave"` เพื่อทำเครื่องหมายว่า
เซสชันสิ้นสุดแล้ว

`status` รวมสุขภาพของ Chrome เมื่อมีให้ใช้งาน:

- `inCall`: Chrome ดูเหมือนอยู่ภายในสาย Meet
- `micMuted`: สถานะไมโครโฟน Meet แบบ best-effort
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: โปรไฟล์
  เบราว์เซอร์ต้องการการเข้าสู่ระบบด้วยตนเอง การอนุญาตจากโฮสต์ Meet สิทธิ์อนุญาต
  หรือการซ่อมแซมการควบคุมเบราว์เซอร์ก่อนที่เสียงพูดจะทำงานได้
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: อนุญาตให้
  เสียงพูด Chrome ที่จัดการแล้วทำงานตอนนี้หรือไม่ `speechReady: false` หมายความว่า
  OpenClaw ไม่ได้ส่งวลีบทนำ/ทดสอบเข้าไปในบริดจ์เสียง
- `providerConnected` / `realtimeReady`: สถานะบริดจ์เสียงเรียลไทม์
- `lastInputAt` / `lastOutputAt`: เสียงล่าสุดที่เห็นจากบริดจ์หรือส่งไปยังบริดจ์
- `audioOutputRouted` / `audioOutputDeviceLabel`: เอาต์พุตสื่อของแท็บ Meet
  ถูกกำหนดเส้นทางอย่างใช้งานอยู่ไปยังอุปกรณ์ BlackHole ที่บริดจ์ใช้หรือไม่
- `lastSuppressedInputAt` / `suppressedInputBytes`: อินพุต loopback ที่ถูกละเว้น
  ขณะที่การเล่นเสียงของผู้ช่วยกำลังทำงานอยู่

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## โหมดเอเจนต์และ bidi

โหมด Chrome `agent` ถูกปรับให้เหมาะกับพฤติกรรม "เอเจนต์ของฉันอยู่ในการประชุม"
ผู้ให้บริการถอดเสียงแบบเรียลไทม์ได้ยินเสียงการประชุม transcript สุดท้ายของผู้เข้าร่วม
จะถูกส่งผ่านเอเจนต์ OpenClaw ที่กำหนดค่าไว้ และคำตอบจะถูกพูดผ่านรันไทม์ TTS
ปกติของ OpenClaw ตั้งค่า `mode: "bidi"` เมื่อคุณต้องการให้โมเดลเสียงเรียลไทม์
ตอบโดยตรง
ชิ้นส่วน transcript สุดท้ายที่อยู่ใกล้กันจะถูกผสานก่อน consult เพื่อให้หนึ่งรอบการพูด
ไม่สร้างคำตอบบางส่วนที่ค้างอยู่หลายรายการ อินพุตเรียลไทม์ยังถูกระงับขณะที่เสียง
ผู้ช่วยที่เข้าคิวไว้ยังเล่นอยู่
และ echo ของ transcript ที่คล้ายผู้ช่วยเมื่อไม่นานมานี้จะถูกละเว้นก่อน agent consult
เพื่อให้ BlackHole loopback ไม่ทำให้เอเจนต์ตอบคำพูดของตัวเอง

| โหมด    | ใครตัดสินคำตอบ        | เส้นทางเอาต์พุตเสียง                     | ใช้เมื่อ                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | เอเจนต์ OpenClaw ที่กำหนดค่าไว้ | รันไทม์ TTS ปกติของ OpenClaw            | คุณต้องการพฤติกรรม "เอเจนต์ของฉันอยู่ในการประชุม"        |
| `bidi`  | โมเดลเสียงเรียลไทม์      | การตอบกลับเสียงจากผู้ให้บริการเสียงเรียลไทม์ | คุณต้องการลูปเสียงสนทนาที่มีเวลาแฝงต่ำที่สุด |

ในโหมด `bidi` เมื่อโมเดลเรียลไทม์ต้องการการให้เหตุผลเชิงลึก ข้อมูลปัจจุบัน
หรือเครื่องมือ OpenClaw ปกติ โมเดลสามารถเรียก `openclaw_agent_consult` ได้

เครื่องมือ consult รันตัวแทน OpenClaw ปกติอยู่เบื้องหลัง โดยใช้บริบทข้อความถอดเสียงการประชุมล่าสุดและส่งคืนคำตอบแบบพูดที่กระชับ ในโหมด `agent` OpenClaw จะส่งคำตอบนั้นไปยังรันไทม์ TTS โดยตรง ส่วนในโหมด `bidi` โมเดลเสียงแบบเรียลไทม์สามารถพูดผลลัพธ์ consult กลับเข้าไปในการประชุมได้ เครื่องมือนี้ใช้กลไก consult ร่วมแบบเดียวกับ Voice Call

โดยค่าเริ่มต้น consult จะรันกับตัวแทน `main` ตั้งค่า `realtime.agentId` เมื่อช่องทาง Meet ควร consult เวิร์กสเปซตัวแทน OpenClaw เฉพาะ ค่าเริ่มต้นของโมเดล นโยบายเครื่องมือ หน่วยความจำ และประวัติเซสชันเฉพาะ

consult ในโหมดตัวแทนใช้คีย์เซสชันต่อการประชุม `agent:<id>:subagent:google-meet:<session>` เพื่อให้คำถามติดตามผลคงบริบทการประชุมไว้ ขณะสืบทอดนโยบายตัวแทนปกติจากตัวแทนที่กำหนดค่าไว้

`realtime.toolPolicy` ควบคุมการรัน consult:

- `safe-read-only`: เปิดเผยเครื่องมือ consult และจำกัดตัวแทนปกติให้ใช้ `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ `memory_get`
- `owner`: เปิดเผยเครื่องมือ consult และให้ตัวแทนปกติใช้นโยบายเครื่องมือตัวแทนปกติ
- `none`: ไม่เปิดเผยเครื่องมือ consult ให้กับโมเดลเสียงแบบเรียลไทม์

คีย์เซสชัน consult ถูกจำกัดขอบเขตต่อเซสชัน Meet ดังนั้นการเรียก consult เพื่อติดตามผลจึงสามารถใช้บริบท consult ก่อนหน้าในระหว่างการประชุมเดียวกันซ้ำได้

เพื่อบังคับการตรวจสอบความพร้อมแบบพูดหลังจาก Chrome เข้าร่วมสายอย่างสมบูรณ์แล้ว:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

สำหรับ smoke แบบเข้าร่วมและพูดเต็มรูปแบบ:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## รายการตรวจสอบการทดสอบสด

ใช้ลำดับนี้ก่อนส่งมอบการประชุมให้ตัวแทนที่ไม่มีผู้ดูแล:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

สถานะ Chrome-node ที่คาดหวัง:

- `googlemeet setup` เป็นสีเขียวทั้งหมด
- `googlemeet setup` มี `chrome-node-connected` เมื่อ Chrome-node เป็นทรานสปอร์ตเริ่มต้นหรือมีการตรึงโหนดไว้
- `nodes status` แสดงว่าโหนดที่เลือกเชื่อมต่ออยู่
- โหนดที่เลือกประกาศทั้ง `googlemeet.chrome` และ `browser.proxy`
- แท็บ Meet เข้าร่วมสาย และ `test-speech` ส่งคืนสุขภาพ Chrome พร้อม `inCall: true`

สำหรับโฮสต์ Chrome ระยะไกล เช่น Parallels macOS VM นี่คือการตรวจสอบที่สั้นที่สุดและปลอดภัยหลังจากอัปเดต Gateway หรือ VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

สิ่งนี้พิสูจน์ว่า Plugin ของ Gateway ถูกโหลดแล้ว โหนด VM เชื่อมต่อด้วยโทเค็นปัจจุบัน และบริดจ์เสียง Meet พร้อมใช้งานก่อนที่ตัวแทนจะเปิดแท็บการประชุมจริง

สำหรับ smoke ของ Twilio ให้ใช้การประชุมที่เปิดเผยรายละเอียดการโทรเข้า:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

สถานะ Twilio ที่คาดหวัง:

- `googlemeet setup` มีการตรวจสอบสีเขียว `twilio-voice-call-plugin`, `twilio-voice-call-credentials` และ `twilio-voice-call-webhook`
- `voicecall` พร้อมใช้งานใน CLI หลังจากโหลด Gateway ใหม่
- เซสชันที่ส่งคืนมี `transport: "twilio"` และ `twilio.voiceCallId`
- `openclaw logs --follow` แสดงว่า DTMF TwiML ถูกให้บริการก่อน realtime TwiML จากนั้นเป็นบริดจ์แบบเรียลไทม์พร้อมคำทักทายเริ่มต้นที่เข้าคิวไว้
- `googlemeet leave <sessionId>` วางสาย voice call ที่มอบหมาย

## การแก้ปัญหา

### ตัวแทนไม่เห็นเครื่องมือ Google Meet

ยืนยันว่า Plugin เปิดใช้งานอยู่ในการกำหนดค่า Gateway และโหลด Gateway ใหม่:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

หากคุณเพิ่งแก้ไข `plugins.entries.google-meet` ให้รีสตาร์ตหรือโหลด Gateway ใหม่ ตัวแทนที่กำลังทำงานจะเห็นเฉพาะเครื่องมือ Plugin ที่ลงทะเบียนโดยกระบวนการ Gateway ปัจจุบันเท่านั้น

บนโฮสต์ Gateway ที่ไม่ใช่ macOS เครื่องมือสำหรับตัวแทน `google_meet` ยังคงมองเห็นได้ แต่การกระทำพูดกลับผ่าน Chrome ในเครื่องจะถูกบล็อกก่อนถึงบริดจ์เสียง เสียงพูดกลับผ่าน Chrome ในเครื่องขณะนี้ต้องพึ่งพา `BlackHole 2ch` ของ macOS ดังนั้นตัวแทน Linux ควรใช้ `mode: "transcribe"`, การโทรเข้า Twilio หรือโฮสต์ `chrome-node` บน macOS แทนเส้นทางตัวแทน Chrome ในเครื่องเริ่มต้น

### ไม่มีโหนดที่เชื่อมต่อและรองรับ Google Meet

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

โหนดต้องเชื่อมต่อและแสดง `googlemeet.chrome` พร้อม `browser.proxy` การกำหนดค่า Gateway ต้องอนุญาตคำสั่งโหนดเหล่านั้น:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

หาก `googlemeet setup` ล้มเหลวที่ `chrome-node-connected` หรือบันทึก Gateway รายงาน `gateway token mismatch` ให้ติดตั้งใหม่หรือรีสตาร์ตโหนดด้วยโทเค็น Gateway ปัจจุบัน สำหรับ Gateway บน LAN โดยปกติหมายถึง:

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

### เบราว์เซอร์เปิดแต่ตัวแทนเข้าร่วมไม่ได้

รัน `googlemeet test-listen` สำหรับการเข้าร่วมแบบสังเกตอย่างเดียว หรือ `googlemeet test-speech` สำหรับการเข้าร่วมแบบเรียลไทม์ จากนั้นตรวจสอบสุขภาพ Chrome ที่ส่งคืน หากโพรบใดรายงาน `manualActionRequired: true` ให้แสดง `manualActionMessage` แก่ผู้ปฏิบัติการและหยุดลองซ้ำจนกว่าการกระทำในเบราว์เซอร์จะเสร็จสิ้น

การกระทำด้วยตนเองที่พบบ่อย:

- ลงชื่อเข้าใช้โปรไฟล์ Chrome
- รับแขกเข้าจากบัญชีโฮสต์ Meet
- อนุญาตสิทธิ์ไมโครโฟน/กล้องให้ Chrome เมื่อพรอมป์สิทธิ์แบบเนทีฟของ Chrome ปรากฏ
- ปิดหรือซ่อมแซมกล่องโต้ตอบสิทธิ์ Meet ที่ค้างอยู่

อย่ารายงานว่า "not signed in" เพียงเพราะ Meet แสดง "Do you want people to hear you in the meeting?" นั่นคืออินเตอร์สติเชียลตัวเลือกเสียงของ Meet; OpenClaw คลิก **Use microphone** ผ่านระบบอัตโนมัติของเบราว์เซอร์เมื่อพร้อมใช้งานและรอสถานะการประชุมจริงต่อไป สำหรับ fallback เบราว์เซอร์แบบสร้างอย่างเดียว OpenClaw อาจคลิก **Continue without microphone** เพราะการสร้าง URL ไม่ต้องใช้เส้นทางเสียงแบบเรียลไทม์

### การสร้างการประชุมล้มเหลว

`googlemeet create` ใช้เอนด์พอยต์ Google Meet API `spaces.create` ก่อนเมื่อมีการกำหนดค่าข้อมูลรับรอง OAuth หากไม่มีข้อมูลรับรอง OAuth จะ fallback ไปยังเบราว์เซอร์โหนด Chrome ที่ตรึงไว้ ยืนยันว่า:

- สำหรับการสร้างผ่าน API: มีการกำหนดค่า `oauth.clientId` และ `oauth.refreshToken` หรือมีตัวแปรสภาพแวดล้อม `OPENCLAW_GOOGLE_MEET_*` ที่ตรงกันอยู่
- สำหรับการสร้างผ่าน API: โทเค็นรีเฟรชถูกออกหลังจากเพิ่มการรองรับการสร้างแล้ว โทเค็นเก่าอาจไม่มี scope `meetings.space.created`; รัน `openclaw googlemeet auth login --json` ใหม่และอัปเดตการกำหนดค่า Plugin
- สำหรับ fallback ของเบราว์เซอร์: `defaultTransport: "chrome-node"` และ `chromeNode.node` ชี้ไปยังโหนดที่เชื่อมต่อพร้อม `browser.proxy` และ `googlemeet.chrome`
- สำหรับ fallback ของเบราว์เซอร์: โปรไฟล์ Chrome ของ OpenClaw บนโหนดนั้นลงชื่อเข้าใช้ Google แล้ว และสามารถเปิด `https://meet.google.com/new` ได้
- สำหรับ fallback ของเบราว์เซอร์: การลองซ้ำใช้แท็บ `https://meet.google.com/new` หรือแท็บพรอมป์บัญชี Google ที่มีอยู่ซ้ำก่อนเปิดแท็บใหม่ หากตัวแทนหมดเวลา ให้ลองเรียกเครื่องมือซ้ำแทนการเปิดแท็บ Meet อีกแท็บด้วยตนเอง
- สำหรับ fallback ของเบราว์เซอร์: หากเครื่องมือส่งคืน `manualActionRequired: true` ให้ใช้ `browser.nodeId`, `browser.targetId`, `browserUrl` และ `manualActionMessage` ที่ส่งคืนมาเพื่อแนะนำผู้ปฏิบัติการ อย่าลองซ้ำเป็นลูปจนกว่าการกระทำนั้นจะเสร็จสิ้น
- สำหรับ fallback ของเบราว์เซอร์: หาก Meet แสดง "Do you want people to hear you in the meeting?" ให้เปิดแท็บค้างไว้ OpenClaw ควรคลิก **Use microphone** หรือสำหรับ fallback แบบสร้างอย่างเดียว **Continue without microphone** ผ่านระบบอัตโนมัติของเบราว์เซอร์ และรอ URL Meet ที่สร้างขึ้นต่อไป หากทำไม่ได้ ข้อผิดพลาดควรกล่าวถึง `meet-audio-choice-required` ไม่ใช่ `google-login-required`

### ตัวแทนเข้าร่วมแต่ไม่พูด

ตรวจสอบเส้นทางเรียลไทม์:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

ใช้ `mode: "agent"` สำหรับเส้นทางพูดกลับ STT -> ตัวแทน OpenClaw -> TTS ปกติ หรือ `mode: "bidi"` สำหรับ fallback เสียงแบบเรียลไทม์โดยตรง `mode: "transcribe"` ตั้งใจไม่เริ่มบริดจ์พูดกลับ สำหรับการดีบักแบบสังเกตอย่างเดียว ให้รัน `openclaw googlemeet status --json <session-id>` หลังผู้เข้าร่วมพูด แล้วตรวจสอบ `captioning`, `transcriptLines` และ `lastCaptionText` หาก `inCall` เป็น true แต่ `transcriptLines` ค้างอยู่ที่ `0` คำบรรยาย Meet อาจถูกปิดใช้งาน ยังไม่มีใครพูดตั้งแต่ติดตั้งตัวสังเกตการณ์ UI ของ Meet เปลี่ยนแปลง หรือคำบรรยายสดไม่พร้อมใช้งานสำหรับภาษา/บัญชีการประชุมนั้น

`googlemeet test-speech` ตรวจสอบเส้นทางเรียลไทม์เสมอและรายงานว่าพบไบต์เอาต์พุตของบริดจ์สำหรับการเรียกนั้นหรือไม่ หาก `speechOutputVerified` เป็น false และ `speechOutputTimedOut` เป็น true ผู้ให้บริการเรียลไทม์อาจยอมรับคำพูดแล้ว แต่ OpenClaw ไม่เห็นไบต์เอาต์พุตใหม่ไปถึงบริดจ์เสียง Chrome

ตรวจสอบเพิ่มเติมว่า:

- มีคีย์ผู้ให้บริการเรียลไทม์บนโฮสต์ Gateway เช่น `OPENAI_API_KEY` หรือ `GEMINI_API_KEY`
- `BlackHole 2ch` มองเห็นได้บนโฮสต์ Chrome
- มี `sox` อยู่บนโฮสต์ Chrome
- ไมโครโฟนและลำโพง Meet ถูกกำหนดเส้นทางผ่านเส้นทางเสียงเสมือนที่ OpenClaw ใช้ `doctor` ควรแสดง `meet output routed: yes` สำหรับการเข้าร่วมเรียลไทม์ผ่าน Chrome ในเครื่อง

`googlemeet doctor [session-id]` พิมพ์เซสชัน โหนด สถานะอยู่ในสาย เหตุผลการกระทำด้วยตนเอง การเชื่อมต่อผู้ให้บริการเรียลไทม์ `realtimeReady` กิจกรรมอินพุต/เอาต์พุตเสียง เวลาประทับเสียงล่าสุด ตัวนับไบต์ และ URL เบราว์เซอร์ ใช้ `googlemeet status [session-id] --json` เมื่อคุณต้องการ JSON ดิบ ใช้ `googlemeet doctor --oauth` เมื่อคุณต้องการตรวจสอบการรีเฟรช OAuth ของ Google Meet โดยไม่เปิดเผยโทเค็น; เพิ่ม `--meeting` หรือ `--create-space` เมื่อคุณต้องการหลักฐาน Google Meet API ด้วย

หากตัวแทนหมดเวลาและคุณเห็นแท็บ Meet เปิดอยู่แล้ว ให้ตรวจสอบแท็บนั้นโดยไม่เปิดแท็บใหม่:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

การกระทำเครื่องมือที่เทียบเท่าคือ `recover_current_tab` มันโฟกัสและตรวจสอบแท็บ Meet ที่มีอยู่สำหรับทรานสปอร์ตที่เลือก ด้วย `chrome` มันใช้การควบคุมเบราว์เซอร์ในเครื่องผ่าน Gateway; ด้วย `chrome-node` มันใช้โหนด Chrome ที่กำหนดค่าไว้ มันไม่เปิดแท็บใหม่หรือสร้างเซสชันใหม่; มันรายงานตัวขวางปัจจุบัน เช่น สถานะล็อกอิน การรับเข้า สิทธิ์ หรือการเลือกเสียง คำสั่ง CLI คุยกับ Gateway ที่กำหนดค่าไว้ ดังนั้น Gateway ต้องกำลังทำงาน; `chrome-node` ยังต้องการให้โหนด Chrome เชื่อมต่ออยู่ด้วย

### การตรวจสอบการตั้งค่า Twilio ล้มเหลว

`twilio-voice-call-plugin` ล้มเหลวเมื่อ `voice-call` ไม่ได้รับอนุญาตหรือไม่ได้เปิดใช้งาน เพิ่มลงใน `plugins.allow` เปิดใช้งาน `plugins.entries.voice-call` และโหลด Gateway ใหม่

`twilio-voice-call-credentials` ล้มเหลวเมื่อแบ็กเอนด์ Twilio ไม่มี SID บัญชี โทเค็นการยืนยันตัวตน หรือหมายเลขผู้โทร ตั้งค่าสิ่งเหล่านี้บนโฮสต์ Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` ล้มเหลวเมื่อ `voice-call` ไม่มีการเปิดเผย Webhook สาธารณะ หรือเมื่อ `publicUrl` ชี้ไปยัง local loopback หรือพื้นที่เครือข่ายส่วนตัว ตั้งค่า `plugins.entries.voice-call.config.publicUrl` เป็น URL ผู้ให้บริการสาธารณะ หรือกำหนดค่า tunnel/Tailscale exposure ของ `voice-call`

URL แบบ loopback และส่วนตัวไม่ถูกต้องสำหรับ callback ของผู้ให้บริการเครือข่ายโทรศัพท์ อย่าใช้ `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` หรือ `fd00::/8` เป็น `publicUrl`

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

สำหรับการพัฒนาในเครื่อง ให้ใช้ tunnel หรือการเปิดเผยผ่าน Tailscale แทน URL
ของโฮสต์ส่วนตัว:

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

`voicecall smoke` ตรวจเฉพาะความพร้อมเป็นค่าเริ่มต้น เมื่อต้องการ dry-run เบอร์เฉพาะ:

```bash
openclaw voicecall smoke --to "+15555550123"
```

เพิ่ม `--yes` เฉพาะเมื่อคุณตั้งใจจะโทรแจ้งเตือนขาออกแบบสดจริง:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### การโทร Twilio เริ่มแล้วแต่ไม่เข้าการประชุม

ยืนยันว่าเหตุการณ์ Meet แสดงรายละเอียดการโทรเข้า ส่งหมายเลขโทรเข้าและ PIN ที่ตรงกันทุกตัวอักษร หรือลำดับ DTMF แบบกำหนดเอง:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

ใช้ `w` นำหน้าหรือเครื่องหมายจุลภาคใน `--dtmf-sequence` หากผู้ให้บริการต้องหยุดพักก่อนป้อน PIN

หากสร้างสายโทรศัพท์แล้ว แต่รายชื่อผู้เข้าร่วมของ Meet ไม่แสดงผู้เข้าร่วมที่โทรเข้า:

- รัน `openclaw googlemeet doctor <session-id>` เพื่อยืนยัน ID สาย Twilio ที่มอบหมาย ว่า DTMF ถูกเข้าคิวไว้หรือไม่ และมีการขอคำทักทายแนะนำตัวหรือไม่
- รัน `openclaw voicecall status --call-id <id>` และยืนยันว่าสายยังทำงานอยู่
- รัน `openclaw voicecall tail` แล้วตรวจสอบว่า Webhook ของ Twilio มาถึง Gateway
- รัน `openclaw logs --follow` แล้วมองหาลำดับ Twilio Meet: Google Meet มอบหมายการเข้าร่วม, Voice Call จัดเก็บและให้บริการ TwiML DTMF ก่อนเชื่อมต่อ, Voice Call ให้บริการ TwiML แบบเรียลไทม์สำหรับสาย Twilio จากนั้น Google Meet ขอเสียงพูดแนะนำตัวด้วย `voicecall.speak`
- รัน `openclaw googlemeet setup --transport twilio` อีกครั้ง; การตรวจ setup ที่เป็นสีเขียวเป็นสิ่งจำเป็น แต่ไม่ได้พิสูจน์ว่าลำดับ PIN ของการประชุมถูกต้อง
- ยืนยันว่าหมายเลขโทรเข้าเป็นของคำเชิญ Meet และภูมิภาคเดียวกับ PIN
- เพิ่ม `voiceCall.dtmfDelayMs` จากค่าเริ่มต้น 12 วินาที หาก Meet รับสายช้าหรือบทถอดเสียงของสายยังแสดงพรอมป์ที่ขอ PIN หลังจากส่ง DTMF ก่อนเชื่อมต่อแล้ว
- หากผู้เข้าร่วมเข้าร่วมแล้วแต่คุณไม่ได้ยินคำทักทาย ให้ตรวจสอบ `openclaw logs --follow` สำหรับคำขอ `voicecall.speak` หลัง DTMF และการเล่น TTS ผ่าน media-stream หรือ fallback `<Say>` ของ Twilio หากบทถอดเสียงของสายยังมีข้อความ "enter the meeting PIN" แสดงว่าเส้นทางโทรศัพท์ยังไม่ได้เข้าห้อง Meet ดังนั้นผู้เข้าร่วมประชุมจะไม่ได้ยินเสียงพูด

หาก Webhook ไม่มาถึง ให้ดีบัก Plugin Voice Call ก่อน: ผู้ให้บริการต้องเข้าถึง `plugins.entries.voice-call.config.publicUrl` หรือ tunnel ที่กำหนดค่าไว้ ดู [การแก้ปัญหาการโทรด้วยเสียง](/th/plugins/voice-call#troubleshooting)

## หมายเหตุ

API สื่ออย่างเป็นทางการของ Google Meet มุ่งเน้นการรับ ดังนั้นการพูดเข้าไปในสาย Meet ยังต้องมีเส้นทางผู้เข้าร่วม Plugin นี้ทำให้ขอบเขตนั้นมองเห็นได้: Chrome จัดการการเข้าร่วมผ่านเบราว์เซอร์และการกำหนดเส้นทางเสียงในเครื่อง; Twilio จัดการการเข้าร่วมผ่านการโทรเข้าทางโทรศัพท์

โหมด talk-back ของ Chrome ต้องใช้ `BlackHole 2ch` พร้อมกับอย่างใดอย่างหนึ่งต่อไปนี้:

- `chrome.audioInputCommand` พร้อม `chrome.audioOutputCommand`: OpenClaw เป็นเจ้าของ bridge และส่งเสียงใน `chrome.audioFormat` ระหว่างคำสั่งเหล่านั้นกับผู้ให้บริการที่เลือก โหมดเอเจนต์ใช้การถอดเสียงแบบเรียลไทม์พร้อม TTS ปกติ; โหมด bidi ใช้ผู้ให้บริการเสียงแบบเรียลไทม์ เส้นทาง Chrome เริ่มต้นคือ PCM16 24 kHz พร้อม `chrome.audioBufferBytes: 4096`; G.711 mu-law 8 kHz ยังคงพร้อมใช้สำหรับคู่คำสั่งแบบเดิม
- `chrome.audioBridgeCommand`: คำสั่ง bridge ภายนอกเป็นเจ้าของเส้นทางเสียงในเครื่องทั้งหมด และต้องออกหลังจากเริ่มหรือยืนยัน daemon ของตัวเองแล้ว สิ่งนี้ใช้ได้เฉพาะกับ `bidi` เพราะโหมด `agent` ต้องเข้าถึงคู่คำสั่งโดยตรงสำหรับ TTS

เมื่อเอเจนต์เรียกเครื่องมือ `google_meet` ในโหมดเอเจนต์ เซสชันที่ปรึกษาการประชุมจะ fork บทถอดความปัจจุบันของผู้เรียกก่อนตอบเสียงพูดของผู้เข้าร่วม เซสชัน Meet ยังคงแยกอยู่ (`agent:<agentId>:subagent:google-meet:<sessionId>`) เพื่อให้การติดตามผลของการประชุมไม่แก้ไขบทถอดความของผู้เรียกโดยตรง

เพื่อให้เสียงสองทางสะอาด ให้กำหนดเส้นทางเอาต์พุต Meet และไมโครโฟน Meet ผ่านอุปกรณ์เสมือนแยกกัน หรือกราฟอุปกรณ์เสมือนแบบ Loopback อุปกรณ์ BlackHole ที่ใช้ร่วมกันเพียงตัวเดียวอาจสะท้อนเสียงผู้เข้าร่วมคนอื่นกลับเข้าไปในสาย

เมื่อใช้ bridge Chrome แบบคู่คำสั่ง `chrome.bargeInInputCommand` สามารถฟังไมโครโฟนในเครื่องแยกต่างหากและล้างการเล่นเสียงของผู้ช่วยเมื่อมนุษย์เริ่มพูด วิธีนี้ทำให้เสียงพูดของมนุษย์มาก่อนเอาต์พุตของผู้ช่วย แม้อินพุต loopback ของ BlackHole ที่ใช้ร่วมกันจะถูกระงับชั่วคราวระหว่างการเล่นเสียงของผู้ช่วย เช่นเดียวกับ `chrome.audioInputCommand` และ `chrome.audioOutputCommand` นี่คือคำสั่งในเครื่องที่ผู้ปฏิบัติงานกำหนดค่าไว้ ใช้พาธคำสั่งที่เชื่อถือได้อย่างชัดเจนหรือรายการอาร์กิวเมนต์ และอย่าชี้ไปยังสคริปต์จากตำแหน่งที่ไม่น่าเชื่อถือ

`googlemeet speak` จะทริกเกอร์ bridge เสียง talk-back ที่ใช้งานอยู่สำหรับเซสชัน Chrome `googlemeet leave` จะหยุด bridge นั้น สำหรับเซสชัน Twilio ที่มอบหมายผ่าน Plugin Voice Call, `leave` จะวางสายเสียงเบื้องหลังด้วย ใช้ `googlemeet end-active-conference` เมื่อคุณต้องการปิดการประชุม Google Meet ที่ใช้งานอยู่สำหรับ space ที่จัดการด้วย API ด้วย

## ที่เกี่ยวข้อง

- [Plugin การโทรด้วยเสียง](/th/plugins/voice-call)
- [โหมดพูดคุย](/th/nodes/talk)
- [การสร้าง Plugin](/th/plugins/building-plugins)
