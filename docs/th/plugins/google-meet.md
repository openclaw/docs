---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw เข้าร่วมการโทร Google Meet
    - คุณต้องการให้เอเจนต์ OpenClaw สร้างสาย Google Meet ใหม่
    - คุณกำลังกำหนดค่า Chrome, Chrome Node หรือ Twilio เป็นทรานสปอร์ต Google Meet
summary: 'Plugin Google Meet: เข้าร่วม URL ของ Meet ที่ระบุอย่างชัดเจนผ่าน Chrome หรือ Twilio พร้อมค่าเริ่มต้นการตอบกลับด้วยเสียงของเอเจนต์'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-06-27T17:55:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e85d531897e3aeadf0ac718f82a7aac5ce73715e182e96ceba77cb76eff094c4
    source_path: plugins/google-meet.md
    workflow: 16
---

การรองรับผู้เข้าร่วม Google Meet สำหรับ OpenClaw — Plugin นี้ถูกออกแบบให้ทำงานแบบระบุชัดเจน:

- จะเข้าร่วมเฉพาะ URL `https://meet.google.com/...` ที่ระบุอย่างชัดเจนเท่านั้น
- สามารถสร้างพื้นที่ Meet ใหม่ผ่าน Google Meet API แล้วเข้าร่วม URL ที่ส่งกลับมา
- `agent` คือโหมดตอบกลับเริ่มต้น: การถอดเสียงแบบเรียลไทม์จะฟัง เอเจนต์ OpenClaw ที่กำหนดค่าจะตอบ และ OpenClaw TTS ปกติจะพูดเข้าไปใน Meet
- `bidi` ยังใช้งานได้ในฐานะโหมดสำรองของโมเดลเสียงเรียลไทม์โดยตรง
- เอเจนต์เลือกพฤติกรรมการเข้าร่วมด้วย `mode`: ใช้ `agent` สำหรับการฟัง/ตอบกลับสด, `bidi` สำหรับเสียงเรียลไทม์โดยตรงแบบสำรอง หรือ `transcribe` เพื่อเข้าร่วม/ควบคุมเบราว์เซอร์โดยไม่มีสะพานตอบกลับ
- การยืนยันตัวตนเริ่มจาก Google OAuth ส่วนบุคคลหรือโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้อยู่แล้ว
- ไม่มีการประกาศขอความยินยอมอัตโนมัติ
- แบ็กเอนด์เสียง Chrome เริ่มต้นคือ `BlackHole 2ch`
- Chrome สามารถทำงานในเครื่องหรือบนโฮสต์ Node ที่จับคู่ไว้
- Twilio รับหมายเลขโทรเข้า พร้อม PIN หรือชุด DTMF เสริมได้ แต่ไม่สามารถโทรเข้า URL ของ Meet โดยตรง
- คำสั่ง CLI คือ `googlemeet`; `meet` ถูกสงวนไว้สำหรับเวิร์กโฟลว์การประชุมทางไกลของเอเจนต์ที่กว้างกว่า

## เริ่มต้นอย่างรวดเร็ว

ติดตั้งดีเพนเดนซีเสียงในเครื่องและกำหนดค่าผู้ให้บริการถอดเสียงแบบเรียลไทม์ พร้อม OpenClaw TTS ปกติ OpenAI คือผู้ให้บริการถอดเสียงเริ่มต้น; Google Gemini Live ก็ทำงานได้เช่นกันในฐานะเสียงสำรอง `bidi` แยกต่างหากเมื่อใช้ `realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` ติดตั้งอุปกรณ์เสียงเสมือน `BlackHole 2ch` ตัวติดตั้งของ Homebrew ต้องรีบูตหนึ่งครั้งก่อนที่ macOS จะแสดงอุปกรณ์นี้:

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

ผลลัพธ์การตั้งค่าถูกออกแบบให้อ่านได้โดยเอเจนต์และรับรู้โหมด มันรายงานโปรไฟล์ Chrome, การปักหมุด Node และสำหรับการเข้าร่วม Chrome แบบเรียลไทม์ จะรายงานสะพานเสียง BlackHole/SoX และการตรวจสอบอินโทรแบบเรียลไทม์ที่หน่วงไว้ สำหรับการเข้าร่วมแบบสังเกตการณ์อย่างเดียว ให้ตรวจสอบทรานสปอร์ตเดียวกันด้วย `--mode transcribe`; โหมดนั้นข้ามข้อกำหนดเสียงเรียลไทม์เพราะไม่ได้ฟังผ่านหรือพูดผ่านสะพาน:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

เมื่อกำหนดค่าการมอบหมายผ่าน Twilio แล้ว การตั้งค่าจะรายงานด้วยว่า Plugin `voice-call`, ข้อมูลรับรอง Twilio และการเปิดเผย Webhook สาธารณะพร้อมหรือไม่ ให้ถือว่าการตรวจสอบใดก็ตามที่มี `ok: false` เป็นตัวบล็อกสำหรับทรานสปอร์ตและโหมดที่ถูกตรวจสอบ ก่อนขอให้เอเจนต์เข้าร่วม ใช้ `openclaw googlemeet setup --json` สำหรับสคริปต์หรือเอาต์พุตที่เครื่องอ่านได้ ใช้ `--transport chrome`, `--transport chrome-node` หรือ `--transport twilio` เพื่อทำ preflight ทรานสปอร์ตเฉพาะก่อนที่เอเจนต์จะลองใช้

สำหรับ Twilio ให้ preflight ทรานสปอร์ตอย่างชัดเจนเสมอเมื่อทรานสปอร์ตเริ่มต้นคือ Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

สิ่งนี้จะตรวจพบการเชื่อมต่อ `voice-call` ที่ขาดหาย ข้อมูลรับรอง Twilio หรือการเปิดเผย Webhook ที่เข้าถึงไม่ได้ ก่อนที่เอเจนต์จะพยายามโทรเข้าการประชุม

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
  "mode": "agent"
}
```

เครื่องมือ `google_meet` สำหรับเอเจนต์ยังใช้งานได้บนโฮสต์ที่ไม่ใช่ macOS สำหรับโฟลว์อาร์ติแฟกต์ ปฏิทิน การตั้งค่า การถอดเสียง Twilio และ `chrome-node` การกระทำตอบกลับผ่าน Chrome ในเครื่องถูกบล็อกที่นั่น เพราะเส้นทางเสียง Chrome ที่รวมมาด้วยปัจจุบันพึ่งพา `BlackHole 2ch` ของ macOS บน Linux ให้ใช้ `mode: "transcribe"`, การโทรเข้าผ่าน Twilio หรือโฮสต์ macOS `chrome-node` สำหรับการเข้าร่วมแบบตอบกลับผ่าน Chrome

สร้างการประชุมใหม่และเข้าร่วม:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

สำหรับห้องที่สร้างผ่าน API ให้ใช้ Google Meet `SpaceConfig.accessType` เมื่อคุณต้องการให้นโยบายไม่ต้องขอเข้าในห้องระบุชัดเจน แทนที่จะสืบทอดจากค่าเริ่มต้นของบัญชี Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` อนุญาตให้ทุกคนที่มี URL ของ Meet เข้าร่วมได้โดยไม่ต้องขอเข้า `TRUSTED` อนุญาตให้ผู้ใช้ที่เชื่อถือได้ขององค์กรโฮสต์ ผู้ใช้ภายนอกที่ได้รับเชิญ และผู้ใช้ที่โทรเข้า เข้าร่วมได้โดยไม่ต้องขอเข้า `RESTRICTED` จำกัดการเข้าแบบไม่ต้องขอเข้าไว้เฉพาะผู้ได้รับเชิญ การตั้งค่าเหล่านี้ใช้กับเส้นทางการสร้างผ่าน Google Meet API อย่างเป็นทางการเท่านั้น ดังนั้นต้องกำหนดค่าข้อมูลรับรอง OAuth

หากคุณยืนยันตัวตน Google Meet ก่อนที่ตัวเลือกนี้จะพร้อมใช้งาน ให้รัน `openclaw googlemeet auth login --json` อีกครั้งหลังเพิ่ม scope `meetings.space.settings` ลงในหน้าจอขอความยินยอม Google OAuth ของคุณ

สร้างเฉพาะ URL โดยไม่เข้าร่วม:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` มีสองเส้นทาง:

- สร้างผ่าน API: ใช้เมื่อกำหนดค่าข้อมูลรับรอง Google Meet OAuth แล้ว นี่คือเส้นทางที่กำหนดผลได้แน่นอนที่สุดและไม่ขึ้นกับสถานะ UI ของเบราว์เซอร์
- เบราว์เซอร์สำรอง: ใช้เมื่อไม่มีข้อมูลรับรอง OAuth OpenClaw ใช้ Node Chrome ที่ปักหมุดไว้ เปิด `https://meet.google.com/new` รอให้ Google เปลี่ยนเส้นทางไปยัง URL รหัสการประชุมจริง แล้วส่งคืน URL นั้น เส้นทางนี้ต้องให้โปรไฟล์ Chrome ของ OpenClaw บน Node ลงชื่อเข้าใช้ Google อยู่แล้ว ระบบอัตโนมัติของเบราว์เซอร์จัดการพรอมป์ไมโครโฟนครั้งแรกของ Meet เอง; พรอมป์นั้นไม่ถือเป็นความล้มเหลวในการเข้าสู่ระบบ Google
  โฟลว์เข้าร่วมและสร้างจะพยายามใช้แท็บ Meet ที่มีอยู่ซ้ำก่อนเปิดแท็บใหม่ด้วย การจับคู่จะละเว้นสตริงคิวรี URL ที่ไม่เป็นอันตราย เช่น `authuser` ดังนั้นการลองใหม่ของเอเจนต์ควรโฟกัสการประชุมที่เปิดอยู่แล้วแทนที่จะสร้างแท็บ Chrome ที่สอง

เอาต์พุตของคำสั่ง/เครื่องมือมีฟิลด์ `source` (`api` หรือ `browser`) เพื่อให้เอเจนต์อธิบายได้ว่าใช้เส้นทางใด `create` จะเข้าร่วมการประชุมใหม่โดยค่าเริ่มต้น และส่งคืน `joined: true` พร้อมเซสชันการเข้าร่วม หากต้องการสร้างเฉพาะ URL ให้ใช้ `create --no-join` บน CLI หรือส่ง `"join": false` ให้เครื่องมือ

หรือบอกเอเจนต์ว่า: "สร้าง Google Meet เข้าร่วมด้วยโหมดตอบกลับของเอเจนต์ และส่งลิงก์ให้ฉัน" เอเจนต์ควรเรียก `google_meet` ด้วย `action: "create"` แล้วแชร์ `meetingUri` ที่ส่งคืนมา

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

สำหรับการเข้าร่วมแบบสังเกตการณ์อย่างเดียว/ควบคุมเบราว์เซอร์ ให้ตั้งค่า `"mode": "transcribe"` โหมดนี้ไม่เริ่มสะพานเสียงเรียลไทม์แบบสองทาง ไม่ต้องใช้ BlackHole หรือ SoX และจะไม่ตอบกลับเข้าไปในการประชุม การเข้าร่วมผ่าน Chrome ในโหมดนี้ยังหลีกเลี่ยงการให้สิทธิ์ไมโครโฟน/กล้องของ OpenClaw และหลีกเลี่ยงเส้นทาง **Use microphone** ของ Meet หาก Meet แสดงหน้าคั่นสำหรับเลือกเสียง ระบบอัตโนมัติจะพยายามใช้เส้นทางไม่มีไมโครโฟน และมิฉะนั้นจะรายงานการกระทำด้วยตนเองแทนการเปิดไมโครโฟนในเครื่อง ในโหมด transcribe ทรานสปอร์ต Chrome ที่จัดการยังติดตั้งตัวสังเกตการณ์คำบรรยาย Meet แบบพยายามให้ดีที่สุดด้วย `googlemeet status --json` และ `googlemeet doctor` แสดง `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` และส่วนท้าย `recentTranscript` สั้น ๆ เพื่อให้ผู้ปฏิบัติงานบอกได้ว่าเบราว์เซอร์เข้าร่วมสายแล้วหรือไม่ และคำบรรยาย Meet กำลังสร้างข้อความหรือไม่
ใช้ `openclaw googlemeet test-listen <meet-url> --transport chrome-node` เมื่อคุณต้องการโพรบแบบใช่/ไม่ใช่: มันเข้าร่วมในโหมด transcribe รอการเคลื่อนไหวของคำบรรยายหรือทรานสคริปต์ใหม่ แล้วส่งคืน `listenVerified`, `listenTimedOut`, ฟิลด์การกระทำด้วยตนเอง และสถานะคำบรรยายล่าสุด

ระหว่างเซสชันแบบเรียลไทม์ สถานะ `google_meet` มีสุขภาพของเบราว์เซอร์และสะพานเสียง เช่น `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, ประทับเวลาอินพุต/เอาต์พุตล่าสุด ตัวนับไบต์ และสถานะปิดของสะพาน หากพรอมป์หน้า Meet ที่ปลอดภัยปรากฏขึ้น ระบบอัตโนมัติของเบราว์เซอร์จะจัดการเมื่อทำได้ การเข้าสู่ระบบ การยอมรับจากโฮสต์ และพรอมป์สิทธิ์ของเบราว์เซอร์/OS จะถูกรายงานเป็นการกระทำด้วยตนเองพร้อมเหตุผลและข้อความเพื่อให้เอเจนต์ถ่ายทอดต่อ เซสชัน Chrome ที่จัดการจะส่งอินโทรหรือวลีทดสอบหลังจากสุขภาพเบราว์เซอร์รายงาน `inCall: true` เท่านั้น; มิฉะนั้นสถานะจะรายงาน `speechReady: false` และการพยายามพูดจะถูกบล็อก แทนที่จะแสร้งว่าเอเจนต์พูดเข้าไปในการประชุมแล้ว

การเข้าร่วมผ่าน Chrome ในเครื่องใช้โปรไฟล์เบราว์เซอร์ OpenClaw ที่ลงชื่อเข้าใช้แล้ว โหมดเรียลไทม์ต้องใช้ `BlackHole 2ch` สำหรับเส้นทางไมโครโฟน/ลำโพงที่ OpenClaw ใช้ สำหรับเสียงสองทางที่สะอาด ให้ใช้อุปกรณ์เสมือนแยกกันหรือกราฟแบบ Loopback; อุปกรณ์ BlackHole ตัวเดียวเพียงพอสำหรับการทดสอบ smoke ครั้งแรก แต่อาจเกิดเสียงสะท้อน

### Gateway ในเครื่อง + Chrome บน Parallels

คุณ **ไม่** จำเป็นต้องมี OpenClaw Gateway เต็มรูปแบบหรือคีย์ API ของโมเดลภายใน VM macOS เพียงเพื่อให้ VM เป็นเจ้าของ Chrome รัน Gateway และเอเจนต์ในเครื่อง แล้วรันโฮสต์ Node ใน VM เปิดใช้ Plugin ที่รวมมาด้วยบน VM หนึ่งครั้งเพื่อให้ Node ประกาศคำสั่ง Chrome:

สิ่งที่รันในแต่ละที่:

- โฮสต์ Gateway: OpenClaw Gateway, เวิร์กสเปซเอเจนต์, คีย์โมเดล/API, ผู้ให้บริการเรียลไทม์ และ config ของ Plugin Google Meet
- VM macOS ของ Parallels: OpenClaw CLI/โฮสต์ Node, Google Chrome, SoX, BlackHole 2ch และโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้ Google
- ไม่จำเป็นใน VM: บริการ Gateway, config เอเจนต์, คีย์ OpenAI/GPT หรือการตั้งค่าผู้ให้บริการโมเดล

ติดตั้งดีเพนเดนซีของ VM:

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

หาก `<gateway-host>` เป็น IP ของ LAN และคุณไม่ได้ใช้ TLS, Node จะปฏิเสธ WebSocket แบบ plaintext เว้นแต่คุณเลือกเปิดใช้สำหรับเครือข่ายส่วนตัวที่เชื่อถือได้นั้น:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` เป็นสภาพแวดล้อมของกระบวนการ ไม่ใช่การตั้งค่า `openclaw.json` `openclaw node install` จะเก็บค่านี้ในสภาพแวดล้อม LaunchAgent เมื่อมีอยู่ในคำสั่งติดตั้ง

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

หรือขอให้เอเจนต์ใช้เครื่องมือ `google_meet` ด้วย `transport: "chrome-node"`

สำหรับการทดสอบ smoke คำสั่งเดียวที่สร้างหรือใช้เซสชันซ้ำ พูดวลีที่ทราบ และพิมพ์สุขภาพเซสชัน:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

ระหว่างการเข้าร่วมแบบเรียลไทม์ ระบบอัตโนมัติของเบราว์เซอร์ OpenClaw จะกรอกชื่อผู้เข้าร่วม คลิก
Join/Ask to join และยอมรับตัวเลือก "Use microphone" ของ Meet ในการใช้งานครั้งแรกเมื่อ
พรอมต์นั้นปรากฏ ระหว่างการเข้าร่วมแบบสังเกตการณ์เท่านั้นหรือการสร้างการประชุมด้วยเบราว์เซอร์เท่านั้น ระบบจะ
ดำเนินต่อผ่านพรอมต์เดียวกันโดยไม่ใช้ไมโครโฟนเมื่อตัวเลือกนั้นมีให้
หากโปรไฟล์เบราว์เซอร์ยังไม่ได้ลงชื่อเข้าใช้ Meet กำลังรอการอนุมัติจากโฮสต์
Chrome ต้องการสิทธิ์ไมโครโฟน/กล้องสำหรับการเข้าร่วมแบบเรียลไทม์ หรือ Meet ค้างอยู่
ที่พรอมต์ซึ่งระบบอัตโนมัติแก้ไขไม่ได้ ผลลัพธ์ join/test-speech จะรายงาน
`manualActionRequired: true` พร้อม `manualActionReason` และ
`manualActionMessage` Agents ควรหยุดลองเข้าร่วมซ้ำ รายงานข้อความนั้นตามจริง
พร้อม `browserUrl`/`browserTitle` ปัจจุบัน และลองใหม่เฉพาะหลังจาก
การดำเนินการด้วยตนเองในเบราว์เซอร์เสร็จสมบูรณ์แล้ว

หากละเว้น `chromeNode.node` OpenClaw จะเลือกอัตโนมัติเฉพาะเมื่อมี
โหนดที่เชื่อมต่ออยู่เพียงหนึ่งโหนดที่ประกาศทั้ง `googlemeet.chrome` และการควบคุมเบราว์เซอร์
หากมีโหนดที่รองรับหลายโหนดเชื่อมต่ออยู่ ให้ตั้ง `chromeNode.node` เป็นรหัสโหนด
ชื่อที่แสดง หรือ IP ระยะไกล

การตรวจสอบความล้มเหลวที่พบบ่อย:

- `Configured Google Meet node ... is not usable: offline`: โหนดที่ปักหมุดไว้เป็น
  ที่รู้จักของ Gateway แต่ไม่พร้อมใช้งาน Agents ควรมองโหนดนั้นเป็น
  สถานะสำหรับวินิจฉัย ไม่ใช่โฮสต์ Chrome ที่ใช้งานได้ และรายงานตัวบล็อกการตั้งค่า
  แทนที่จะถอยกลับไปใช้การขนส่งอื่น เว้นแต่ผู้ใช้จะขอเช่นนั้น
- `No connected Google Meet-capable node`: เริ่ม `openclaw node run` ใน VM
  อนุมัติการจับคู่ และตรวจสอบให้แน่ใจว่าได้รัน `openclaw plugins enable google-meet` และ
  `openclaw plugins enable browser` ใน VM แล้ว ยืนยันด้วยว่า
  โฮสต์ Gateway อนุญาตคำสั่งโหนดทั้งสองด้วย
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`
- `BlackHole 2ch audio device not found`: ติดตั้ง `blackhole-2ch` บนโฮสต์
  ที่กำลังตรวจสอบและรีบูตก่อนใช้เสียง Chrome ภายในเครื่อง
- `BlackHole 2ch audio device not found on the node`: ติดตั้ง `blackhole-2ch`
  ใน VM และรีบูต VM
- Chrome เปิดขึ้นแต่เข้าร่วมไม่ได้: ลงชื่อเข้าใช้โปรไฟล์เบราว์เซอร์ภายใน VM หรือ
  ตั้งค่า `chrome.guestName` ไว้สำหรับการเข้าร่วมแบบผู้เข้าร่วม Guest auto-join ใช้ระบบอัตโนมัติ
  ของเบราว์เซอร์ OpenClaw ผ่านพร็อกซีเบราว์เซอร์ของโหนด ตรวจสอบให้แน่ใจว่าคอนฟิกเบราว์เซอร์ของโหนด
  ชี้ไปยังโปรไฟล์ที่คุณต้องการ เช่น
  `browser.defaultProfile: "user"` หรือโปรไฟล์ existing-session ที่มีชื่ออยู่แล้ว
- แท็บ Meet ซ้ำ: เปิดใช้ `chrome.reuseExistingTab: true` ไว้ OpenClaw
  จะเปิดใช้งานแท็บที่มีอยู่สำหรับ URL Meet เดียวกันก่อนเปิดแท็บใหม่ และ
  การสร้างการประชุมผ่านเบราว์เซอร์จะใช้แท็บ `https://meet.google.com/new`
  หรือแท็บพรอมต์บัญชี Google ที่กำลังดำเนินการอยู่ซ้ำก่อนเปิดอีกแท็บ
- ไม่มีเสียง: ใน Meet ให้ส่งไมโครโฟน/ลำโพงผ่านเส้นทางอุปกรณ์เสียงเสมือน
  ที่ OpenClaw ใช้ ใช้อุปกรณ์เสมือนแยกกันหรือการกำหนดเส้นทางแบบ Loopback
  เพื่อเสียงดูเพล็กซ์ที่สะอาด

## หมายเหตุการติดตั้ง

ค่าเริ่มต้น Chrome talk-back ใช้เครื่องมือภายนอกสองรายการ:

- `sox`: ยูทิลิตีเสียงแบบบรรทัดคำสั่ง Plugin ใช้คำสั่งอุปกรณ์ CoreAudio
  ที่ระบุชัดเจนสำหรับบริดจ์เสียง PCM16 24 kHz ค่าเริ่มต้น
- `blackhole-2ch`: ไดรเวอร์เสียงเสมือนของ macOS ซึ่งสร้างอุปกรณ์เสียง `BlackHole 2ch`
  ที่ Chrome/Meet สามารถกำหนดเส้นทางผ่านได้

OpenClaw ไม่ได้รวมแพ็กเกจหรือแจกจ่ายแพ็กเกจใดแพ็กเกจหนึ่ง เอกสารขอให้ผู้ใช้
ติดตั้งเป็น dependency ของโฮสต์ผ่าน Homebrew SoX อยู่ภายใต้สัญญาอนุญาต
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole เป็น GPL-3.0 หากคุณสร้าง
ตัวติดตั้งหรือ appliance ที่รวม BlackHole กับ OpenClaw ให้ตรวจสอบเงื่อนไขสัญญาอนุญาต
ต้นทางของ BlackHole หรือรับสัญญาอนุญาตแยกต่างหากจาก Existential Audio

## การขนส่ง

### Chrome

การขนส่ง Chrome เปิด URL Meet ผ่านการควบคุมเบราว์เซอร์ของ OpenClaw และเข้าร่วม
ในฐานะโปรไฟล์เบราว์เซอร์ OpenClaw ที่ลงชื่อเข้าใช้แล้ว บน macOS Plugin จะตรวจสอบ
`BlackHole 2ch` ก่อนเปิดใช้งาน หากกำหนดค่าไว้ ระบบจะรันคำสั่งตรวจสุขภาพบริดจ์เสียง
และคำสั่งเริ่มต้นก่อนเปิด Chrome ด้วย ใช้ `chrome` เมื่อ
Chrome/เสียงอยู่บนโฮสต์ Gateway; ใช้ `chrome-node` เมื่อ Chrome/เสียงอยู่
บนโหนดที่จับคู่ เช่น VM macOS ของ Parallels สำหรับ Chrome ภายในเครื่อง ให้เลือก
โปรไฟล์ด้วย `browser.defaultProfile`; `chrome.browserProfile` จะถูกส่งต่อไปยัง
โฮสต์ `chrome-node`

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

กำหนดเส้นทางเสียงไมโครโฟนและลำโพงของ Chrome ผ่านบริดจ์เสียง OpenClaw ภายในเครื่อง
หากไม่ได้ติดตั้ง `BlackHole 2ch` การเข้าร่วมจะล้มเหลวพร้อมข้อผิดพลาดการตั้งค่า
แทนที่จะเข้าร่วมแบบเงียบ ๆ โดยไม่มีเส้นทางเสียง

### Twilio

การขนส่ง Twilio เป็นแผนการโทรที่เข้มงวดซึ่งมอบหมายให้ Plugin Voice Call
ไม่แยกวิเคราะห์หน้า Meet เพื่อค้นหาหมายเลขโทรศัพท์

ใช้ตัวเลือกนี้เมื่อไม่สามารถเข้าร่วมผ่าน Chrome ได้ หรือคุณต้องการทางเลือกสำรอง
แบบโทรเข้า Google Meet ต้องแสดงหมายเลขโทรเข้าและ PIN สำหรับ
การประชุม OpenClaw จะไม่ค้นหาข้อมูลเหล่านั้นจากหน้า Meet

เปิดใช้ Plugin Voice Call บนโฮสต์ Gateway ไม่ใช่บนโหนด Chrome:

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

ระบุข้อมูลรับรอง Twilio ผ่าน environment หรือคอนฟิก Environment ช่วยเก็บ
ความลับออกจาก `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

ใช้ `realtime.provider: "openai"` กับ Plugin ผู้ให้บริการ OpenAI และ
`OPENAI_API_KEY` แทน หากนั่นคือผู้ให้บริการเสียงเรียลไทม์ของคุณ

รีสตาร์ตหรือโหลด Gateway ใหม่หลังเปิดใช้ `voice-call`; การเปลี่ยนแปลงคอนฟิก Plugin
จะไม่ปรากฏในโปรเซส Gateway ที่กำลังรันอยู่จนกว่าจะโหลดใหม่

จากนั้นตรวจสอบ:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

เมื่อการมอบหมาย Twilio เชื่อมต่อแล้ว `googlemeet setup` จะรวมการตรวจสอบ
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

OAuth เป็นทางเลือกสำหรับการสร้างลิงก์ Meet เพราะ `googlemeet create` สามารถถอยกลับ
ไปใช้ระบบอัตโนมัติของเบราว์เซอร์ได้ กำหนดค่า OAuth เมื่อคุณต้องการการสร้างผ่าน API อย่างเป็นทางการ
การแก้ไข space หรือการตรวจสอบ preflight ของ Meet Media API

การเข้าถึง Google Meet API ใช้ OAuth ของผู้ใช้: สร้างไคลเอ็นต์ OAuth ของ Google Cloud
ขอขอบเขตที่จำเป็น อนุญาตบัญชี Google แล้วจัดเก็บ
refresh token ที่ได้ไว้ในคอนฟิก Plugin Google Meet หรือระบุ
ตัวแปร environment `OPENCLAW_GOOGLE_MEET_*`

OAuth ไม่ได้แทนที่เส้นทางเข้าร่วมของ Chrome การขนส่ง Chrome และ Chrome-node
ยังคงเข้าร่วมผ่านโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้แล้ว, BlackHole/SoX และโหนดที่เชื่อมต่อ
เมื่อคุณใช้การเข้าร่วมผ่านเบราว์เซอร์ OAuth ใช้เฉพาะสำหรับเส้นทาง Google
Meet API อย่างเป็นทางการ: สร้าง meeting spaces, แก้ไข spaces และรันการตรวจสอบ
preflight ของ Meet Media API

### สร้างข้อมูลรับรอง Google

ใน Google Cloud Console:

1. สร้างหรือเลือกโปรเจกต์ Google Cloud
2. เปิดใช้ **Google Meet REST API** สำหรับโปรเจกต์นั้น
3. กำหนดค่าหน้าจอขอความยินยอม OAuth
   - **Internal** ง่ายที่สุดสำหรับองค์กร Google Workspace
   - **External** ใช้ได้กับการตั้งค่าส่วนบุคคล/ทดสอบ; ขณะที่แอปอยู่ใน Testing
     ให้เพิ่มบัญชี Google แต่ละบัญชีที่จะอนุญาตแอปเป็นผู้ใช้ทดสอบ
4. เพิ่มขอบเขตที่ OpenClaw ขอ:
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
`meetings.space.readonly` ให้ OpenClaw แก้ไข URL/รหัส Meet เป็น spaces
`meetings.space.settings` ให้ OpenClaw ส่งการตั้งค่า `SpaceConfig` เช่น
`accessType` ระหว่างการสร้างห้องผ่าน API
`meetings.conference.media.readonly` ใช้สำหรับ preflight ของ Meet Media API และงานสื่อ
Google อาจกำหนดให้ลงทะเบียน Developer Preview สำหรับการใช้ Media API จริง
หากคุณต้องการเพียงการเข้าร่วม Chrome ผ่านเบราว์เซอร์ ให้ข้าม OAuth ทั้งหมด

### สร้าง refresh token

กำหนดค่า `oauth.clientId` และเลือกกำหนด `oauth.clientSecret` หรือส่งผ่านเป็น
ตัวแปร environment จากนั้นรัน:

```bash
openclaw googlemeet auth login --json
```

คำสั่งจะพิมพ์บล็อกคอนฟิก `oauth` พร้อม refresh token คำสั่งนี้ใช้ PKCE,
callback localhost ที่ `http://localhost:8085/oauth2callback` และโฟลว์
คัดลอก/วางด้วยตนเองพร้อม `--manual`

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

จัดเก็บออบเจ็กต์ `oauth` ไว้ใต้คอนฟิก Plugin Google Meet:

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
หากมีค่าทั้งในคอนฟิกและ environment Plugin จะเลือกคอนฟิกก่อน
แล้วจึงใช้ environment fallback

ความยินยอม OAuth รวมถึงการสร้าง Meet space, สิทธิ์อ่าน Meet space และสิทธิ์อ่าน
สื่อการประชุม Meet หากคุณยืนยันตัวตนก่อนที่การรองรับการสร้างการประชุม
จะมีอยู่ ให้รัน `openclaw googlemeet auth login --json` อีกครั้งเพื่อให้ refresh
token มีขอบเขต `meetings.space.created`

### ตรวจสอบ OAuth ด้วย doctor

รัน OAuth doctor เมื่อคุณต้องการตรวจสุขภาพที่รวดเร็วและไม่เปิดเผยความลับ:

```bash
openclaw googlemeet doctor --oauth --json
```

คำสั่งนี้จะไม่โหลด runtime ของ Chrome หรือกำหนดให้มีโหนด Chrome ที่เชื่อมต่ออยู่
คำสั่งตรวจสอบว่ามีคอนฟิก OAuth และ refresh token สามารถสร้าง access
token ได้ รายงาน JSON รวมเฉพาะฟิลด์สถานะ เช่น `ok`, `configured`,
`tokenSource`, `expiresAt` และข้อความตรวจสอบ; ไม่พิมพ์ access
token, refresh token หรือ client secret

ผลลัพธ์ที่พบบ่อย:

| การตรวจสอบ                | ความหมาย                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | มี `oauth.clientId` รวมกับ `oauth.refreshToken` หรือโทเค็นการเข้าถึงที่แคชไว้       |
| `oauth-token`        | โทเค็นการเข้าถึงที่แคชไว้ยังคงใช้ได้ หรือโทเค็นรีเฟรชออกโทเค็นการเข้าถึงใหม่ |
| `meet-spaces-get`    | การตรวจสอบ `--meeting` ที่ไม่บังคับแปลงเป็นพื้นที่ Meet ที่มีอยู่แล้ว                             |
| `meet-spaces-create` | การตรวจสอบ `--create-space` ที่ไม่บังคับสร้างพื้นที่ Meet ใหม่                               |

หากต้องการพิสูจน์การเปิดใช้งาน Google Meet API และขอบเขต `spaces.create` ด้วย ให้รันการตรวจสอบการสร้างที่มีผลข้างเคียง:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` สร้าง URL Meet ชั่วคราว ใช้เมื่อคุณต้องยืนยันว่าโปรเจกต์ Google Cloud เปิดใช้งาน Meet API แล้ว และบัญชีที่อนุญาตมีขอบเขต `meetings.space.created`

หากต้องการพิสูจน์สิทธิ์อ่านสำหรับพื้นที่การประชุมที่มีอยู่:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` และ `resolve-space` พิสูจน์สิทธิ์อ่านพื้นที่ที่มีอยู่ซึ่งบัญชี Google ที่อนุญาตเข้าถึงได้ `403` จากการตรวจสอบเหล่านี้มักหมายความว่า Google Meet REST API ถูกปิดใช้งาน โทเค็นรีเฟรชที่ให้ความยินยอมไว้ไม่มีขอบเขตที่จำเป็น หรือบัญชี Google ไม่สามารถเข้าถึงพื้นที่ Meet นั้นได้ ข้อผิดพลาดของโทเค็นรีเฟรชหมายความว่าให้รัน `openclaw googlemeet auth login
--json` อีกครั้งและจัดเก็บบล็อก `oauth` ใหม่

ไม่ต้องใช้ข้อมูลรับรอง OAuth สำหรับ browser fallback ในโหมดนั้น การยืนยันตัวตน Google มาจากโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้บนโหนดที่เลือก ไม่ใช่จากการกำหนดค่า OpenClaw

ตัวแปรสภาพแวดล้อมเหล่านี้ยอมรับเป็น fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` หรือ `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` หรือ `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` หรือ
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` หรือ `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` หรือ `GOOGLE_MEET_PREVIEW_ACK`

แปลง URL Meet, รหัส หรือ `spaces/{id}` ผ่าน `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

รัน preflight ก่อนงานสื่อ:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

แสดงรายการสิ่งประดิษฐ์การประชุมและการเข้าร่วมหลังจาก Meet สร้างระเบียนการประชุมแล้ว:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

เมื่อใช้ `--meeting`, `artifacts` และ `attendance` จะใช้ระเบียนการประชุมล่าสุดตามค่าเริ่มต้น ส่ง `--all-conference-records` เมื่อคุณต้องการระเบียนที่เก็บไว้ทั้งหมดสำหรับการประชุมนั้น

การค้นหา Calendar สามารถแปลง URL การประชุมจาก Google Calendar ก่อนอ่านสิ่งประดิษฐ์ Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` ค้นหาปฏิทิน `primary` ของวันนี้เพื่อหาเหตุการณ์ Calendar ที่มีลิงก์ Google Meet ใช้ `--event <query>` เพื่อค้นหาข้อความเหตุการณ์ที่ตรงกัน และ `--calendar <id>` สำหรับปฏิทินที่ไม่ใช่ปฏิทินหลัก การค้นหา Calendar ต้องใช้การเข้าสู่ระบบ OAuth ใหม่ที่รวมขอบเขตอ่านอย่างเดียวของเหตุการณ์ Calendar
`calendar-events` แสดงตัวอย่างเหตุการณ์ Meet ที่ตรงกันและทำเครื่องหมายเหตุการณ์ที่ `latest`, `artifacts`, `attendance` หรือ `export` จะเลือก

หากคุณทราบ id ระเบียนการประชุมแล้ว ให้ระบุโดยตรง:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

จบการประชุมที่ใช้งานอยู่สำหรับพื้นที่ที่สร้างด้วย API เมื่อคุณต้องการปิดห้องหลังการโทร:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

คำสั่งนี้เรียก Google Meet `spaces.endActiveConference` และต้องใช้ OAuth ที่มีขอบเขต `meetings.space.created` สำหรับพื้นที่ที่บัญชีที่อนุญาตจัดการได้ OpenClaw รับอินพุตเป็น URL Meet, รหัสการประชุม หรือ `spaces/{id}` และแปลงเป็นทรัพยากรพื้นที่ API ก่อนจบการประชุมที่ใช้งานอยู่
คำสั่งนี้แยกจาก `googlemeet leave`: `leave` หยุดการเข้าร่วมภายในเครื่อง/เซสชันของ OpenClaw ส่วน `end-active-conference` ขอให้ Google Meet จบการประชุมที่ใช้งานอยู่สำหรับพื้นที่นั้น

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

`artifacts` ส่งคืนเมตาดาทาระเบียนการประชุม รวมถึงเมตาดาทาทรัพยากรของผู้เข้าร่วม การบันทึก ทรานสคริปต์ รายการทรานสคริปต์แบบมีโครงสร้าง และ smart-note เมื่อ Google เปิดเผยข้อมูลนั้นสำหรับการประชุม ใช้ `--no-transcript-entries` เพื่อข้ามการค้นหารายการสำหรับการประชุมขนาดใหญ่ `attendance` ขยายผู้เข้าร่วมเป็นแถวเซสชันผู้เข้าร่วม พร้อมเวลาที่เห็นครั้งแรก/ครั้งล่าสุด ระยะเวลาเซสชันรวม แฟล็กมาสาย/ออกก่อนเวลา และรวมทรัพยากรผู้เข้าร่วมที่ซ้ำกันตามผู้ใช้ที่ลงชื่อเข้าใช้หรือชื่อที่แสดง ส่ง `--no-merge-duplicates` เพื่อแยกทรัพยากรผู้เข้าร่วมดิบไว้ต่างหาก, `--late-after-minutes` เพื่อปรับการตรวจจับการมาสาย และ `--early-before-minutes` เพื่อปรับการตรวจจับการออกก่อนเวลา

`export` เขียนโฟลเดอร์ที่มี `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` และ `manifest.json`
`manifest.json` บันทึกอินพุตที่เลือก ตัวเลือกการส่งออก ระเบียนการประชุม ไฟล์เอาต์พุต จำนวน แหล่งที่มาของโทเค็น เหตุการณ์ Calendar เมื่อมีการใช้ และคำเตือนการดึงข้อมูลบางส่วน ส่ง `--zip` เพื่อเขียนอาร์ไคฟ์แบบพกพาข้างโฟลเดอร์ด้วย ส่ง `--include-doc-bodies` เพื่อส่งออกข้อความ Google Docs ของทรานสคริปต์และ smart-note ที่ลิงก์ไว้ผ่าน Google Drive `files.export`; ต้องใช้การเข้าสู่ระบบ OAuth ใหม่ที่รวมขอบเขตอ่านอย่างเดียวของ Drive Meet หากไม่มี `--include-doc-bodies` การส่งออกจะรวมเฉพาะเมตาดาทา Meet และรายการทรานสคริปต์แบบมีโครงสร้างเท่านั้น หาก Google ส่งคืนความล้มเหลวของสิ่งประดิษฐ์บางส่วน เช่น ข้อผิดพลาดในการแสดงรายการ smart-note, รายการทรานสคริปต์ หรือเนื้อหาเอกสาร Drive สรุปและ manifest จะเก็บคำเตือนไว้แทนที่จะทำให้การส่งออกทั้งหมดล้มเหลว
ใช้ `--dry-run` เพื่อดึงข้อมูลสิ่งประดิษฐ์/การเข้าร่วมชุดเดียวกันและพิมพ์ JSON ของ manifest โดยไม่สร้างโฟลเดอร์หรือ ZIP สิ่งนี้มีประโยชน์ก่อนเขียนการส่งออกขนาดใหญ่ หรือเมื่อ agent ต้องการเพียงจำนวน ระเบียนที่เลือก และคำเตือน

Agent ยังสามารถสร้างบันเดิลเดียวกันผ่านเครื่องมือ `google_meet` ได้:

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

Agent ยังสามารถสร้างห้องที่รองรับด้วย API พร้อมนโยบายการเข้าถึงที่ระบุชัดเจน:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
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

สำหรับการตรวจสอบแบบฟังก่อน Agent ควรใช้ `test_listen` ก่อนอ้างว่าการประชุมนั้นมีประโยชน์:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

รัน live smoke ที่มีการป้องกันกับการประชุมจริงที่เก็บไว้:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

รันโพรบเบราว์เซอร์แบบ live listen-first กับการประชุมที่มีคนจะพูดและมีคำบรรยาย Meet พร้อมใช้งาน:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

สภาพแวดล้อม live smoke:

- `OPENCLAW_LIVE_TEST=1` เปิดใช้การทดสอบ live ที่มีการป้องกัน
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` ชี้ไปยัง URL Meet, รหัส หรือ `spaces/{id}` ที่เก็บไว้
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID` ระบุ id ไคลเอนต์ OAuth
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN` ระบุโทเค็นรีเฟรช
- ไม่บังคับ: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` และ
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ใช้ชื่อ fallback เดียวกัน
  โดยไม่มีคำนำหน้า `OPENCLAW_`

live smoke พื้นฐานสำหรับสิ่งประดิษฐ์/การเข้าร่วมต้องใช้
`https://www.googleapis.com/auth/meetings.space.readonly` และ
`https://www.googleapis.com/auth/meetings.conference.media.readonly` การค้นหา Calendar
ต้องใช้ `https://www.googleapis.com/auth/calendar.events.readonly` การส่งออกเนื้อหาเอกสาร Drive
ต้องใช้ `https://www.googleapis.com/auth/drive.meet.readonly`

สร้างพื้นที่ Meet ใหม่:

```bash
openclaw googlemeet create
```

คำสั่งจะพิมพ์ `meeting uri` ใหม่ แหล่งที่มา และเซสชันเข้าร่วม เมื่อมีข้อมูลรับรอง OAuth จะใช้ Google Meet API อย่างเป็นทางการ หากไม่มีข้อมูลรับรอง OAuth จะใช้โปรไฟล์เบราว์เซอร์ที่ลงชื่อเข้าใช้ของโหนด Chrome ที่ปักหมุดไว้เป็น fallback Agent สามารถใช้เครื่องมือ `google_meet` พร้อม `action: "create"` เพื่อสร้างและเข้าร่วมในขั้นตอนเดียว สำหรับการสร้างเฉพาะ URL ให้ส่ง `"join": false`

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

หาก browser fallback พบการเข้าสู่ระบบ Google หรือ Meet permission blocker ก่อนที่จะสร้าง URL ได้ เมธอด Gateway จะส่งคืนการตอบกลับที่ล้มเหลว และเครื่องมือ `google_meet` จะส่งคืนรายละเอียดแบบมีโครงสร้างแทนสตริงธรรมดา:

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

เมื่อ Agent เห็น `manualActionRequired: true` ควรรายงาน `manualActionMessage` พร้อมบริบทโหนด/แท็บเบราว์เซอร์ และหยุดเปิดแท็บ Meet ใหม่จนกว่าผู้ปฏิบัติงานจะทำขั้นตอนในเบราว์เซอร์ให้เสร็จ

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

การสร้าง Meet จะเข้าร่วมโดยค่าเริ่มต้น ทรานสปอร์ต Chrome หรือ Chrome-node ยังต้องใช้โปรไฟล์ Google Chrome ที่ลงชื่อเข้าใช้แล้วเพื่อเข้าร่วมผ่านเบราว์เซอร์ หากโปรไฟล์ถูกลงชื่อออก OpenClaw จะรายงาน `manualActionRequired: true` หรือข้อผิดพลาดการสำรองผ่านเบราว์เซอร์ และขอให้ผู้ปฏิบัติงานลงชื่อเข้าใช้ Google ให้เสร็จก่อนลองอีกครั้ง

ตั้งค่า `preview.enrollmentAcknowledged: true` หลังจากยืนยันแล้วเท่านั้นว่าโปรเจ็กต์ Cloud, OAuth principal และผู้เข้าร่วมประชุมของคุณได้ลงทะเบียนใน Google Workspace Developer Preview Program สำหรับ Meet media APIs แล้ว

## การกำหนดค่า

เส้นทางเอเจนต์ Chrome ทั่วไปต้องการเพียงเปิดใช้งาน Plugin, BlackHole, SoX, คีย์ผู้ให้บริการถอดเสียงแบบเรียลไทม์ และผู้ให้บริการ OpenClaw TTS ที่กำหนดค่าแล้ว OpenAI เป็นผู้ให้บริการถอดเสียงเริ่มต้น ตั้งค่า `realtime.voiceProvider` เป็น `"google"` และ `realtime.model` เพื่อใช้ Google Gemini Live สำหรับโหมด `bidi` โดยไม่เปลี่ยนผู้ให้บริการถอดเสียงเริ่มต้นของโหมดเอเจนต์:

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
- `defaultMode: "agent"` (`"realtime"` ยอมรับเฉพาะเป็นนามแฝงความเข้ากันได้แบบเดิมสำหรับ `"agent"`; การเรียกเครื่องมือใหม่ควรใช้ `"agent"`)
- `chromeNode.node`: id/name/IP ของ Node ที่เป็นทางเลือกสำหรับ `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ชื่อที่ใช้บนหน้าจอผู้เยี่ยมชม Meet ที่ยังไม่ได้ลงชื่อเข้าใช้
- `chrome.autoJoin: true`: พยายามกรอกชื่อผู้เยี่ยมชมและคลิก Join Now ผ่านระบบอัตโนมัติเบราว์เซอร์ของ OpenClaw บน `chrome-node`
- `chrome.reuseExistingTab: true`: เปิดใช้งานแท็บ Meet ที่มีอยู่แทนการเปิดซ้ำ
- `chrome.waitForInCallMs: 20000`: รอให้แท็บ Meet รายงานว่าอยู่ในสายก่อนเริ่มทริกเกอร์คำกล่าวนำตอบกลับด้วยเสียง
- `chrome.audioFormat: "pcm16-24khz"`: รูปแบบเสียงของคู่คำสั่ง ใช้ `"g711-ulaw-8khz"` เฉพาะสำหรับคู่คำสั่งเดิม/กำหนดเองที่ยังปล่อยเสียงโทรศัพท์
- `chrome.audioBufferBytes: 4096`: บัฟเฟอร์ประมวลผล SoX สำหรับคำสั่งเสียงคู่คำสั่ง Chrome ที่สร้างขึ้น ค่านี้เป็นครึ่งหนึ่งของบัฟเฟอร์เริ่มต้น 8192 ไบต์ของ SoX ซึ่งลดเวลาแฝงของ pipe เริ่มต้นแต่ยังเหลือพื้นที่ให้เพิ่มได้บนโฮสต์ที่มีภาระงานสูง ค่าที่ต่ำกว่าขั้นต่ำของ SoX จะถูกจำกัดไว้ที่ 17 ไบต์
- `chrome.audioInputCommand`: คำสั่ง SoX ที่อ่านจาก CoreAudio `BlackHole 2ch` และเขียนเสียงใน `chrome.audioFormat`
- `chrome.audioOutputCommand`: คำสั่ง SoX ที่อ่านเสียงใน `chrome.audioFormat` และเขียนไปยัง CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: คำสั่งไมโครโฟนภายในเครื่องที่เป็นทางเลือก ซึ่งเขียน PCM โมโน signed 16-bit little-endian สำหรับตรวจจับการพูดแทรกของมนุษย์ขณะการเล่นเสียงของผู้ช่วยกำลังทำงาน ขณะนี้ใช้กับบริดจ์คู่คำสั่ง `chrome` ที่โฮสต์โดย Gateway
- `chrome.bargeInRmsThreshold: 650`: ระดับ RMS ที่นับว่าเป็นการขัดจังหวะของมนุษย์บน `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: ระดับพีกที่นับว่าเป็นการขัดจังหวะของมนุษย์บน `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: หน่วงเวลาขั้นต่ำระหว่างการล้างสถานะการขัดจังหวะของมนุษย์ซ้ำ
- `mode: "agent"`: โหมดตอบกลับด้วยเสียงเริ่มต้น เสียงพูดของผู้เข้าร่วมจะถูกถอดเสียงโดยผู้ให้บริการถอดเสียงแบบเรียลไทม์ที่กำหนดค่าไว้ ส่งไปยังเอเจนต์ OpenClaw ที่กำหนดค่าไว้ในเซสชันเอเจนต์ย่อยต่อการประชุม และพูดกลับผ่าน runtime OpenClaw TTS ปกติ
- `mode: "bidi"`: โหมดสำรองของโมเดลเรียลไทม์แบบสองทิศทางโดยตรง ผู้ให้บริการเสียงเรียลไทม์ตอบเสียงพูดของผู้เข้าร่วมโดยตรงและอาจเรียก `openclaw_agent_consult` สำหรับคำตอบเชิงลึก/ที่รองรับด้วยเครื่องมือ
- `mode: "transcribe"`: โหมดสังเกตการณ์อย่างเดียวโดยไม่มีบริดจ์ตอบกลับด้วยเสียง
- `realtime.provider: "openai"`: ค่าความเข้ากันได้สำรองที่ใช้เมื่อไม่ได้ตั้งค่าฟิลด์ผู้ให้บริการแบบ scoped ด้านล่าง
- `realtime.transcriptionProvider: "openai"`: id ผู้ให้บริการที่โหมด `agent` ใช้สำหรับการถอดเสียงแบบเรียลไทม์
- `realtime.voiceProvider`: id ผู้ให้บริการที่โหมด `bidi` ใช้สำหรับเสียงเรียลไทม์โดยตรง ตั้งค่านี้เป็น `"google"` เพื่อใช้ Gemini Live ขณะที่ยังคงการถอดเสียงโหมดเอเจนต์ไว้บน OpenAI
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: คำตอบพูดสั้น ๆ พร้อม `openclaw_agent_consult` สำหรับคำตอบเชิงลึก
- `realtime.introMessage`: ข้อความพูดสั้น ๆ เพื่อตรวจสอบความพร้อมเมื่อบริดจ์เรียลไทม์เชื่อมต่อ ตั้งค่าเป็น `""` เพื่อเข้าร่วมแบบเงียบ
- `realtime.agentId`: id เอเจนต์ OpenClaw ที่เป็นทางเลือกสำหรับ `openclaw_agent_consult`; ค่าเริ่มต้นคือ `main`

การ override ที่เป็นทางเลือก:

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
        speakerVoice: "Kore",
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
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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

เสียง Meet แบบคงอยู่มาจาก `messages.tts.providers.elevenlabs.speakerVoiceId` การตอบกลับของเอเจนต์ยังสามารถใช้คำสั่งต่อคำตอบ `[[tts:speakerVoiceId=... model=eleven_v3]]` เมื่อเปิดใช้งานการ override โมเดล TTS แต่การกำหนดค่าคือค่าเริ่มต้นที่กำหนดได้แน่นอนสำหรับการประชุม เมื่อเข้าร่วม บันทึกควรแสดง `transcriptionProvider=elevenlabs` และทุกคำตอบที่พูดควรบันทึก `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`

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

`voiceCall.enabled` มีค่าเริ่มต้นเป็น `true`; เมื่อใช้ทรานสปอร์ต Twilio ระบบจะมอบหมายการโทร PSTN จริง, DTMF และคำทักทายเริ่มต้นให้กับ Voice Call Plugin Voice Call จะเล่นลำดับ DTMF ก่อนเปิดสตรีมสื่อเรียลไทม์ จากนั้นใช้ข้อความนำที่บันทึกไว้เป็นคำทักทายเรียลไทม์เริ่มต้น หากไม่ได้เปิดใช้งาน `voice-call` Google Meet ยังสามารถตรวจสอบและบันทึกแผนการโทรได้ แต่ไม่สามารถทำการโทร Twilio ได้

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

ใช้ `transport: "chrome"` เมื่อ Chrome ทำงานบนโฮสต์ Gateway ใช้ `transport: "chrome-node"` เมื่อ Chrome ทำงานบน Node ที่จับคู่ เช่น Parallels VM ในทั้งสองกรณี ผู้ให้บริการโมเดลและ `openclaw_agent_consult` จะทำงานบนโฮสต์ Gateway ดังนั้นข้อมูลประจำตัวของโมเดลจึงอยู่ที่นั่น ด้วยค่าเริ่มต้น `mode: "agent"` ผู้ให้บริการถอดเสียงแบบเรียลไทม์จะจัดการการฟัง เอเจนต์ OpenClaw ที่กำหนดค่าไว้จะสร้างคำตอบ และ OpenClaw TTS ปกติจะพูดเข้าไปใน Meet ใช้ `mode: "bidi"` เมื่อต้องการให้โมเดลเสียงเรียลไทม์ตอบโดยตรง `mode: "realtime"` แบบดิบยังคงได้รับการยอมรับเป็นนามแฝงความเข้ากันได้แบบเดิมสำหรับ `mode: "agent"` แต่จะไม่ถูกโฆษณาใน schema เครื่องมือของเอเจนต์อีกต่อไป บันทึกโหมดเอเจนต์จะรวมผู้ให้บริการ/โมเดลถอดเสียงที่ resolve แล้วเมื่อเริ่มต้นบริดจ์ และผู้ให้บริการ TTS, โมเดล, เสียง, รูปแบบเอาต์พุต และ sample rate หลังแต่ละคำตอบที่สังเคราะห์แล้ว

ใช้ `action: "status"` เพื่อแสดงรายการเซสชันที่ใช้งานอยู่หรือตรวจสอบ ID เซสชัน ใช้ `action: "speak"` พร้อม `sessionId` และ `message` เพื่อให้เอเจนต์เรียลไทม์พูดทันที ใช้ `action: "test_speech"` เพื่อสร้างหรือใช้เซสชันซ้ำ ทริกเกอร์วลีที่ทราบ และส่งคืนสถานะสุขภาพ `inCall` เมื่อโฮสต์ Chrome สามารถรายงานได้ `test_speech` จะบังคับ `mode: "agent"` เสมอ และล้มเหลวหากถูกขอให้ทำงานใน `mode: "transcribe"` เพราะเซสชันสังเกตการณ์อย่างเดียวตั้งใจไม่ให้ปล่อยเสียงพูดได้ ผลลัพธ์ `speechOutputVerified` อิงจากจำนวนไบต์เอาต์พุตเสียงเรียลไทม์ที่เพิ่มขึ้นระหว่างการเรียกทดสอบนี้ ดังนั้นเซสชันที่ใช้ซ้ำซึ่งมีเสียงเก่าจะไม่ถูกนับว่าเป็นการตรวจสอบเสียงพูดสำเร็จครั้งใหม่ ใช้ `action: "leave"` เพื่อทำเครื่องหมายว่าเซสชันสิ้นสุดแล้ว

`status` รวมสถานะสุขภาพของ Chrome เมื่อมี:

- `inCall`: Chrome ดูเหมือนอยู่ภายในสาย Meet
- `micMuted`: สถานะไมโครโฟน Meet แบบพยายามดีที่สุด
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: โปรไฟล์เบราว์เซอร์ต้องการการลงชื่อเข้าใช้ด้วยตนเอง การรับเข้าโดยโฮสต์ Meet สิทธิ์ หรือการซ่อมแซมการควบคุมเบราว์เซอร์ก่อนที่เสียงพูดจะทำงานได้
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ตอนนี้อนุญาตให้ใช้เสียงพูด Chrome ที่จัดการแล้วหรือไม่ `speechReady: false` หมายความว่า OpenClaw ไม่ได้ส่งคำกล่าวนำ/วลีทดสอบเข้าไปในบริดจ์เสียง
- `providerConnected` / `realtimeReady`: สถานะบริดจ์เสียงเรียลไทม์
- `lastInputAt` / `lastOutputAt`: เสียงล่าสุดที่เห็นจากบริดจ์หรือส่งไปยังบริดจ์
- `audioOutputRouted` / `audioOutputDeviceLabel`: เอาต์พุตสื่อของแท็บ Meet ถูกกำหนดเส้นทางอย่างใช้งานอยู่ไปยังอุปกรณ์ BlackHole ที่บริดจ์ใช้หรือไม่
- `lastSuppressedInputAt` / `suppressedInputBytes`: อินพุต loopback ที่ถูกละเว้นขณะการเล่นเสียงของผู้ช่วยกำลังทำงาน

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## โหมดเอเจนต์และ bidi

โหมด Chrome `agent` ถูกปรับให้เหมาะสำหรับพฤติกรรม "เอเจนต์ของฉันอยู่ในการประชุม" ผู้ให้บริการถอดเสียงแบบเรียลไทม์จะได้ยินเสียงการประชุม transcript สุดท้ายของผู้เข้าร่วมจะถูกส่งผ่านเอเจนต์ OpenClaw ที่กำหนดค่าไว้ และคำตอบจะถูกพูดผ่าน runtime OpenClaw TTS ปกติ ตั้งค่า `mode: "bidi"` เมื่อต้องการให้โมเดลเสียงเรียลไทม์ตอบโดยตรง เศษ transcript สุดท้ายที่อยู่ใกล้กันจะถูกรวมก่อน consult เพื่อให้หนึ่งรอบการพูดไม่สร้างคำตอบบางส่วนเก่าหลายรายการ อินพุตเรียลไทม์ยังถูกระงับขณะที่เสียงผู้ช่วยในคิวยังคงเล่นอยู่ และ echo ของ transcript ที่คล้ายผู้ช่วยเมื่อไม่นานมานี้จะถูกละเว้นก่อน agent consult เพื่อให้ BlackHole loopback ไม่ทำให้เอเจนต์ตอบเสียงของตัวเอง

| โหมด    | ใครตัดสินคำตอบ        | เส้นทางเอาต์พุตเสียงพูด                     | ใช้เมื่อ                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | เอเจนต์ OpenClaw ที่กำหนดค่าไว้ | runtime OpenClaw TTS ปกติ            | คุณต้องการพฤติกรรม "เอเจนต์ของฉันอยู่ในการประชุม"        |
| `bidi`  | โมเดลเสียงเรียลไทม์      | การตอบกลับเสียงจากผู้ให้บริการเสียงเรียลไทม์ | คุณต้องการลูปเสียงสนทนาที่มีเวลาแฝงต่ำที่สุด |

ในโหมด `bidi` เมื่อโมเดลเรียลไทม์ต้องการการให้เหตุผลที่ลึกขึ้น ข้อมูลปัจจุบัน หรือเครื่องมือ OpenClaw ปกติ โมเดลสามารถเรียก `openclaw_agent_consult` ได้

เครื่องมือ consult เรียกใช้เอเจนต์ OpenClaw ปกติอยู่เบื้องหลังพร้อมบริบทจาก
บันทึกถอดความการประชุมล่าสุด และส่งคืนคำตอบแบบพูดที่กระชับ ในโหมด `agent`
OpenClaw จะส่งคำตอบนั้นตรงไปยังรันไทม์ TTS; ในโหมด `bidi`
โมเดลเสียงเรียลไทม์สามารถพูดผลลัพธ์ consult กลับเข้าไปในการประชุมได้ เครื่องมือนี้ใช้
กลไก consult ร่วมเดียวกันกับ Voice Call

ตามค่าเริ่มต้น consult จะทำงานกับเอเจนต์ `main` ตั้งค่า `realtime.agentId` เมื่อ
เลน Meet ควร consult เวิร์กสเปซเอเจนต์ OpenClaw เฉพาะ ค่าเริ่มต้นของโมเดล
นโยบายเครื่องมือ หน่วยความจำ และประวัติเซสชัน

consult ในโหมดเอเจนต์ใช้คีย์เซสชันต่อการประชุม
`agent:<id>:subagent:google-meet:<session>` เพื่อให้คำถามต่อเนื่องคงบริบทการประชุมไว้
พร้อมสืบทอดนโยบายเอเจนต์ปกติจากเอเจนต์ที่กำหนดค่าไว้

`realtime.toolPolicy` ควบคุมการเรียกใช้ consult:

- `safe-read-only`: เปิดเผยเครื่องมือ consult และจำกัดเอเจนต์ปกติไว้ที่
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` และ
  `memory_get`
- `owner`: เปิดเผยเครื่องมือ consult และให้เอเจนต์ปกติใช้นโยบายเครื่องมือเอเจนต์ปกติ
- `none`: ไม่เปิดเผยเครื่องมือ consult ให้โมเดลเสียงเรียลไทม์

คีย์เซสชัน consult ถูกจำกัดขอบเขตต่อเซสชัน Meet ดังนั้นการเรียก consult ต่อเนื่อง
สามารถนำบริบท consult ก่อนหน้ากลับมาใช้ระหว่างการประชุมเดียวกันได้

หากต้องการบังคับให้ตรวจสอบความพร้อมแบบพูดหลังจาก Chrome เข้าร่วมสายเต็มที่แล้ว:

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

ใช้ลำดับนี้ก่อนส่งต่อการประชุมให้เอเจนต์แบบไม่มีผู้ดูแล:

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

สิ่งนี้พิสูจน์ว่า Gateway Plugin ถูกโหลดแล้ว, node ของ VM เชื่อมต่อด้วยโทเค็น
ปัจจุบัน และบริดจ์เสียง Meet พร้อมใช้งาน ก่อนที่เอเจนต์จะเปิดแท็บการประชุมจริง

สำหรับ Twilio smoke ให้ใช้การประชุมที่แสดงรายละเอียดโทรเข้าทางโทรศัพท์:

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
- `voicecall` พร้อมใช้งานใน CLI หลังโหลด Gateway ใหม่
- เซสชันที่ส่งคืนมี `transport: "twilio"` และ `twilio.voiceCallId`
- `openclaw logs --follow` แสดง DTMF TwiML ถูกเสิร์ฟก่อน realtime TwiML จากนั้นเป็น
  บริดจ์เรียลไทม์พร้อมคำทักทายเริ่มต้นที่เข้าคิวไว้
- `googlemeet leave <sessionId>` วางสาย voice call ที่มอบหมายไป

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

บนโฮสต์ Gateway ที่ไม่ใช่ macOS เครื่องมือ `google_meet` สำหรับเอเจนต์ยังคงมองเห็นได้
แต่การกระทำพูดกลับผ่าน Chrome ภายในเครื่องจะถูกบล็อกก่อนถึงบริดจ์เสียง
เสียงพูดกลับของ Chrome ภายในเครื่องปัจจุบันขึ้นกับ `BlackHole 2ch` บน macOS ดังนั้น
เอเจนต์ Linux ควรใช้ `mode: "transcribe"`, การโทรเข้า Twilio หรือโฮสต์
`chrome-node` บน macOS แทนเส้นทางเอเจนต์ Chrome ภายในเครื่องตามค่าเริ่มต้น

### ไม่มี node ที่รองรับ Google Meet เชื่อมต่ออยู่

บนโฮสต์ node ให้เรียกใช้:

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

node ต้องเชื่อมต่ออยู่และแสดง `googlemeet.chrome` พร้อม `browser.proxy`
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

หาก `googlemeet setup` ล้มเหลวที่ `chrome-node-connected` หรือบันทึก Gateway รายงาน
`gateway token mismatch` ให้ติดตั้งใหม่หรือรีสตาร์ท node ด้วยโทเค็น Gateway ปัจจุบัน
สำหรับ Gateway บน LAN โดยทั่วไปหมายถึง:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

จากนั้นโหลดบริการ node ใหม่และเรียกใช้อีกครั้ง:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### เบราว์เซอร์เปิดแต่เอเจนต์เข้าร่วมไม่ได้

เรียกใช้ `googlemeet test-listen` สำหรับการเข้าร่วมแบบสังเกตอย่างเดียว หรือ
`googlemeet test-speech` สำหรับการเข้าร่วมแบบเรียลไทม์ จากนั้นตรวจสอบสถานะสุขภาพ
Chrome ที่ส่งคืน หากโพรบใดรายงาน `manualActionRequired: true` ให้แสดง
`manualActionMessage` ให้ผู้ปฏิบัติงานและหยุดลองซ้ำจนกว่าการกระทำในเบราว์เซอร์จะเสร็จ

การกระทำด้วยตนเองที่พบบ่อย:

- ลงชื่อเข้าใช้โปรไฟล์ Chrome
- อนุญาตแขกจากบัญชีโฮสต์ Meet
- ให้สิทธิ์ไมโครโฟน/กล้องแก่ Chrome เมื่อพรอมป์สิทธิ์แบบเนทีฟของ Chrome ปรากฏ
- ปิดหรือซ่อมกล่องโต้ตอบสิทธิ์ Meet ที่ค้างอยู่

อย่ารายงานว่า "not signed in" เพียงเพราะ Meet แสดง "Do you want people to
hear you in the meeting?" นั่นคือ interstitial การเลือกเสียงของ Meet; OpenClaw
จะคลิก **Use microphone** ผ่านระบบอัตโนมัติของเบราว์เซอร์เมื่อพร้อมใช้งาน และรอ
สถานะการประชุมจริงต่อไป สำหรับ browser fallback แบบสร้างอย่างเดียว OpenClaw
อาจคลิก **Continue without microphone** เพราะการสร้าง URL ไม่ต้องใช้เส้นทางเสียง
เรียลไทม์

### การสร้างการประชุมล้มเหลว

`googlemeet create` ใช้ปลายทาง `spaces.create` ของ Google Meet API ก่อน
เมื่อมีการกำหนดค่า OAuth credentials หากไม่มี OAuth credentials จะ fallback
ไปยังเบราว์เซอร์ Chrome node ที่ปักหมุดไว้ ยืนยันว่า:

- สำหรับการสร้างผ่าน API: มีการกำหนดค่า `oauth.clientId` และ `oauth.refreshToken`
  หรือมีตัวแปรสภาพแวดล้อม `OPENCLAW_GOOGLE_MEET_*` ที่ตรงกัน
- สำหรับการสร้างผ่าน API: refresh token ถูกออกหลังจากเพิ่มการรองรับการสร้างแล้ว
  โทเค็นเก่าอาจไม่มี scope `meetings.space.created`; เรียกใช้
  `openclaw googlemeet auth login --json` อีกครั้งและอัปเดตการกำหนดค่า Plugin
- สำหรับ browser fallback: `defaultTransport: "chrome-node"` และ
  `chromeNode.node` ชี้ไปยัง node ที่เชื่อมต่ออยู่ซึ่งมี `browser.proxy` และ
  `googlemeet.chrome`
- สำหรับ browser fallback: โปรไฟล์ Chrome ของ OpenClaw บน node นั้นลงชื่อเข้าใช้
  Google แล้วและเปิด `https://meet.google.com/new` ได้
- สำหรับ browser fallback: การลองซ้ำใช้แท็บ `https://meet.google.com/new`
  ที่มีอยู่หรือแท็บพรอมป์บัญชี Google ก่อนเปิดแท็บใหม่ หากเอเจนต์หมดเวลา
  ให้ลองเรียกเครื่องมือซ้ำแทนการเปิดแท็บ Meet อีกแท็บด้วยตนเอง
- สำหรับ browser fallback: หากเครื่องมือส่งคืน `manualActionRequired: true` ให้ใช้
  `browser.nodeId`, `browser.targetId`, `browserUrl` และ `manualActionMessage`
  ที่ส่งคืนเพื่อแนะนำผู้ปฏิบัติงาน อย่าลองซ้ำเป็นลูปจนกว่าการกระทำนั้นจะเสร็จ
- สำหรับ browser fallback: หาก Meet แสดง "Do you want people to hear you in the
  meeting?" ให้เปิดแท็บทิ้งไว้ OpenClaw ควรคลิก **Use microphone** หรือสำหรับ
  fallback แบบสร้างอย่างเดียว คลิก **Continue without microphone** ผ่านระบบอัตโนมัติ
  ของเบราว์เซอร์และรอ URL Meet ที่สร้างต่อไป หากทำไม่ได้ ข้อผิดพลาดควรกล่าวถึง
  `meet-audio-choice-required` ไม่ใช่ `google-login-required`

### เอเจนต์เข้าร่วมแล้วแต่ไม่พูด

ตรวจสอบเส้นทางเรียลไทม์:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

ใช้ `mode: "agent"` สำหรับเส้นทางพูดกลับปกติ STT -> เอเจนต์ OpenClaw -> TTS
หรือ `mode: "bidi"` สำหรับ fallback เสียงเรียลไทม์โดยตรง `mode: "transcribe"`
ตั้งใจไม่เริ่มบริดจ์พูดกลับ สำหรับการดีบักแบบสังเกตอย่างเดียว ให้เรียกใช้
`openclaw googlemeet status --json <session-id>` หลังผู้เข้าร่วมพูด และตรวจสอบ
`captioning`, `transcriptLines` และ `lastCaptionText` หาก `inCall` เป็น true
แต่ `transcriptLines` ยังคงเป็น `0` คำบรรยาย Meet อาจถูกปิดใช้งาน, ยังไม่มีใคร
พูดหลังติดตั้งตัวสังเกต, UI ของ Meet เปลี่ยนไป หรือคำบรรยายสดไม่พร้อมใช้งาน
สำหรับภาษา/บัญชีของการประชุม

`googlemeet test-speech` ตรวจสอบเส้นทางเรียลไทม์เสมอและรายงานว่าพบไบต์เอาต์พุต
บริดจ์สำหรับการเรียกใช้นั้นหรือไม่ หาก `speechOutputVerified` เป็น false และ
`speechOutputTimedOut` เป็น true ผู้ให้บริการเรียลไทม์อาจยอมรับ utterance แล้ว
แต่ OpenClaw ไม่เห็นไบต์เอาต์พุตใหม่ไปถึงบริดจ์เสียง Chrome

ตรวจสอบเพิ่มเติมว่า:

- มีคีย์ผู้ให้บริการเรียลไทม์บนโฮสต์ Gateway เช่น
  `OPENAI_API_KEY` หรือ `GEMINI_API_KEY`
- `BlackHole 2ch` มองเห็นได้บนโฮสต์ Chrome
- มี `sox` อยู่บนโฮสต์ Chrome
- ไมโครโฟนและลำโพง Meet ถูกกำหนดเส้นทางผ่านเส้นทางเสียงเสมือนที่ OpenClaw ใช้
  `doctor` ควรแสดง `meet output routed: yes` สำหรับการเข้าร่วมเรียลไทม์ผ่าน
  Chrome ภายในเครื่อง

`googlemeet doctor [session-id]` พิมพ์เซสชัน, node, สถานะอยู่ในสาย,
เหตุผลการกระทำด้วยตนเอง, การเชื่อมต่อผู้ให้บริการเรียลไทม์, `realtimeReady`,
กิจกรรมอินพุต/เอาต์พุตเสียง, timestamp เสียงล่าสุด, ตัวนับไบต์ และ URL เบราว์เซอร์
ใช้ `googlemeet status [session-id] --json` เมื่อคุณต้องการ JSON ดิบ ใช้
`googlemeet doctor --oauth` เมื่อคุณต้องการตรวจสอบ refresh ของ Google Meet OAuth
โดยไม่เปิดเผยโทเค็น; เพิ่ม `--meeting` หรือ `--create-space` เมื่อคุณต้องการ
หลักฐาน Google Meet API ด้วย

หากเอเจนต์หมดเวลาและคุณเห็นว่าแท็บ Meet เปิดอยู่แล้ว ให้ตรวจสอบแท็บนั้น
โดยไม่เปิดแท็บใหม่:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

การกระทำเครื่องมือที่เทียบเท่าคือ `recover_current_tab` มันโฟกัสและตรวจสอบ
แท็บ Meet ที่มีอยู่สำหรับ transport ที่เลือก เมื่อใช้ `chrome` มันใช้การควบคุม
เบราว์เซอร์ภายในเครื่องผ่าน Gateway; เมื่อใช้ `chrome-node` มันใช้ Chrome node
ที่กำหนดค่าไว้ มันไม่เปิดแท็บใหม่หรือสร้างเซสชันใหม่; มันรายงานตัวบล็อกปัจจุบัน
เช่น การเข้าสู่ระบบ, การรับเข้า, สิทธิ์ หรือสถานะการเลือกเสียง
คำสั่ง CLI คุยกับ Gateway ที่กำหนดค่าไว้ ดังนั้น Gateway ต้องกำลังทำงาน;
`chrome-node` ยังต้องมี Chrome node เชื่อมต่ออยู่ด้วย

### การตรวจสอบการตั้งค่า Twilio ล้มเหลว

`twilio-voice-call-plugin` ล้มเหลวเมื่อ `voice-call` ไม่ได้รับอนุญาตหรือไม่ได้เปิดใช้งาน
เพิ่มลงใน `plugins.allow`, เปิดใช้งาน `plugins.entries.voice-call` และโหลด Gateway ใหม่

`twilio-voice-call-credentials` ล้มเหลวเมื่อ backend ของ Twilio ไม่มี account
SID, auth token หรือหมายเลขผู้โทร ตั้งค่าสิ่งเหล่านี้บนโฮสต์ Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` ล้มเหลวเมื่อ `voice-call` ไม่มีการเปิดเผย Webhook สาธารณะ
หรือเมื่อ `publicUrl` ชี้ไปที่ local loopback หรือพื้นที่เครือข่ายส่วนตัว
ตั้งค่า `plugins.entries.voice-call.config.publicUrl` เป็น URL ผู้ให้บริการสาธารณะ
หรือกำหนดค่า tunnel/Tailscale exposure สำหรับ `voice-call`

URL แบบ loopback และส่วนตัวไม่ถูกต้องสำหรับ callback ของผู้ให้บริการโทรศัพท์
อย่าใช้ `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
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

สำหรับการพัฒนาในเครื่อง ให้ใช้ tunnel หรือการเปิดเผยผ่าน Tailscale แทน URL
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

จากนั้นรีสตาร์ตหรือโหลด Gateway ใหม่ แล้วเรียกใช้:

```bash
openclaw googlemeet setup --transport twilio
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

### การโทร Twilio เริ่มแล้วแต่ไม่เข้าการประชุม

ยืนยันว่าอีเวนต์ Meet แสดงรายละเอียดการโทรเข้า ส่งหมายเลขโทรเข้าและ PIN
ที่ถูกต้อง หรือส่งลำดับ DTMF แบบกำหนดเอง:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

ใช้ `w` นำหน้าหรือคอมมาใน `--dtmf-sequence` หากผู้ให้บริการต้องการการหยุดพัก
ก่อนป้อน PIN

หากสร้างสายโทรศัพท์แล้ว แต่รายชื่อผู้เข้าร่วม Meet ยังไม่แสดงผู้เข้าร่วมแบบโทรเข้า:

- เรียกใช้ `openclaw googlemeet doctor <session-id>` เพื่อยืนยัน ID การโทร Twilio
  ที่มอบหมายแล้ว ตรวจว่า DTMF ถูกจัดคิวหรือไม่ และมีการขอคำทักทายเริ่มต้นหรือไม่
- เรียกใช้ `openclaw voicecall status --call-id <id>` และยืนยันว่าการโทรยังคง
  active
- เรียกใช้ `openclaw voicecall tail` และตรวจว่า Webhook ของ Twilio มาถึง
  Gateway
- เรียกใช้ `openclaw logs --follow` แล้วมองหาลำดับ Twilio Meet: Google
  Meet มอบหมายการเข้าร่วม, Voice Call จัดเก็บและให้บริการ DTMF TwiML
  ก่อนเชื่อมต่อ, Voice Call ให้บริการ TwiML แบบเรียลไทม์สำหรับการโทร Twilio
  จากนั้น Google Meet ขอเสียงแนะนำด้วย `voicecall.speak`
- เรียกใช้ `openclaw googlemeet setup --transport twilio` อีกครั้ง; การตรวจตั้งค่าที่เป็นสีเขียว
  เป็นสิ่งจำเป็น แต่ไม่ได้พิสูจน์ว่าลำดับ PIN ของการประชุมถูกต้อง
- ยืนยันว่าหมายเลขโทรเข้าเป็นของคำเชิญ Meet และภูมิภาคเดียวกับ PIN
- เพิ่ม `voiceCall.dtmfDelayMs` จากค่าเริ่มต้น 12 วินาที หาก Meet รับสายช้า
  หรือทรานสคริปต์การโทรยังแสดงพรอมต์ที่ขอ PIN หลังจากส่ง DTMF ก่อนเชื่อมต่อแล้ว
- หากผู้เข้าร่วมเข้าร่วมแล้วแต่คุณไม่ได้ยินคำทักทาย ให้ตรวจ
  `openclaw logs --follow` สำหรับคำขอ `voicecall.speak` หลัง DTMF และ
  การเล่น TTS ผ่าน media-stream หรือ fallback `<Say>` ของ Twilio หากทรานสคริปต์การโทร
  ยังมีข้อความ "enter the meeting PIN" แปลว่า leg โทรศัพท์ยังไม่ได้เข้าห้อง
  Meet ดังนั้นผู้เข้าร่วมการประชุมจะไม่ได้ยินเสียงพูด

หาก Webhook ไม่มาถึง ให้ดีบัก Plugin Voice Call ก่อน: ผู้ให้บริการต้องเข้าถึง
`plugins.entries.voice-call.config.publicUrl` หรือ tunnel ที่กำหนดค่าไว้
ดู [การแก้ปัญหาการโทรด้วยเสียง](/th/plugins/voice-call#troubleshooting)

## หมายเหตุ

API สื่อทางการของ Google Meet เน้นการรับ ดังนั้นการพูดเข้าไปในการโทร Meet
ยังคงต้องใช้เส้นทางผู้เข้าร่วม Plugin นี้ทำให้ขอบเขตนั้นมองเห็นได้ชัดเจน:
Chrome จัดการการเข้าร่วมผ่านเบราว์เซอร์และการกำหนดเส้นทางเสียงในเครื่อง; Twilio จัดการ
การเข้าร่วมแบบโทรเข้า

โหมด talk-back ของ Chrome ต้องใช้ `BlackHole 2ch` พร้อมอย่างใดอย่างหนึ่งต่อไปนี้:

- `chrome.audioInputCommand` พร้อม `chrome.audioOutputCommand`: OpenClaw เป็นเจ้าของ
  bridge และ pipe เสียงใน `chrome.audioFormat` ระหว่างคำสั่งเหล่านั้นกับ
  ผู้ให้บริการที่เลือก โหมด Agent ใช้การถอดเสียงแบบเรียลไทม์พร้อม TTS ปกติ;
  โหมด bidi ใช้ผู้ให้บริการเสียงแบบเรียลไทม์ เส้นทาง Chrome เริ่มต้นคือ PCM16 24 kHz
  พร้อม `chrome.audioBufferBytes: 4096`; G.711 mu-law 8 kHz ยังคง
  พร้อมใช้งานสำหรับคู่คำสั่งเดิม
- `chrome.audioBridgeCommand`: คำสั่ง bridge ภายนอกเป็นเจ้าของเส้นทางเสียงในเครื่อง
  ทั้งหมด และต้องออกหลังจากเริ่มหรือยืนยัน daemon แล้ว ใช้ได้เฉพาะกับ
  `bidi` เพราะโหมด `agent` ต้องเข้าถึงคู่คำสั่งโดยตรงสำหรับ TTS

เมื่อ agent เรียกเครื่องมือ `google_meet` ในโหมด agent เซสชันที่ปรึกษาการประชุม
จะ fork ทรานสคริปต์ปัจจุบันของผู้เรียกก่อนตอบเสียงพูดของผู้เข้าร่วม
เซสชัน Meet ยังคงแยกอยู่ (`agent:<agentId>:subagent:google-meet:<sessionId>`)
ดังนั้นการติดตามผลในการประชุมจะไม่แก้ไขทรานสคริปต์ของผู้เรียกโดยตรง

เพื่อเสียง duplex ที่สะอาด ให้กำหนดเส้นทางเอาต์พุต Meet และไมโครโฟน Meet ผ่าน
อุปกรณ์เสมือนแยกกัน หรือกราฟอุปกรณ์เสมือนสไตล์ Loopback อุปกรณ์ BlackHole
เดียวที่ใช้ร่วมกันอาจสะท้อนเสียงผู้เข้าร่วมคนอื่นกลับเข้าไปในการโทร

ด้วย bridge Chrome แบบคู่คำสั่ง `chrome.bargeInInputCommand` สามารถฟัง
ไมโครโฟนในเครื่องแยกต่างหาก และล้างการเล่นเสียงของ assistant เมื่อมนุษย์เริ่ม
พูด วิธีนี้ทำให้เสียงพูดของมนุษย์มาก่อนเอาต์พุตของ assistant แม้เมื่ออินพุต
BlackHole loopback ที่ใช้ร่วมกันถูกระงับชั่วคราวระหว่างการเล่นเสียงของ assistant
เช่นเดียวกับ `chrome.audioInputCommand` และ `chrome.audioOutputCommand` มันคือ
คำสั่งในเครื่องที่ operator กำหนดค่าไว้ ใช้ path คำสั่งที่เชื่อถือได้อย่างชัดเจนหรือ
รายการอาร์กิวเมนต์ และอย่าชี้ไปยังสคริปต์จากตำแหน่งที่ไม่น่าเชื่อถือ

`googlemeet speak` เรียกใช้ talk-back audio bridge ที่ active สำหรับเซสชัน Chrome
`googlemeet leave` หยุด bridge นั้น สำหรับเซสชัน Twilio ที่มอบหมายผ่าน
Plugin Voice Call, `leave` จะวางสาย voice call ที่อยู่ข้างใต้ด้วย
ใช้ `googlemeet end-active-conference` เมื่อคุณต้องการปิดการประชุม
Google Meet ที่ active สำหรับพื้นที่ที่จัดการด้วย API ด้วย

## ที่เกี่ยวข้อง

- [Plugin การโทรด้วยเสียง](/th/plugins/voice-call)
- [โหมด Talk](/th/nodes/talk)
- [การสร้าง Plugin](/th/plugins/building-plugins)
