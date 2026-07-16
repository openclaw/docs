---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw เข้าร่วมการประชุมทาง Google Meet
    - คุณต้องการให้เอเจนต์ OpenClaw สร้างการประชุม Google Meet ใหม่
    - คุณกำลังกำหนดค่า Chrome, Node ของ Chrome หรือ Twilio ให้เป็นช่องทางรับส่งข้อมูลสำหรับ Google Meet
summary: 'Plugin Google Meet: เข้าร่วมผ่าน URL ของ Meet ที่ระบุอย่างชัดเจนโดยใช้ Chrome หรือ Twilio พร้อมค่าเริ่มต้นสำหรับการตอบกลับด้วยเสียงของเอเจนต์'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-07-16T19:26:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5a3a0d2675bdfaeaa869652593fd1931c3afdefe0ed95f13935dade976ff038c
    source_path: plugins/google-meet.md
    workflow: 16
---

Plugin `google-meet` เข้าร่วม URL ของ Meet ที่ระบุไว้อย่างชัดเจนในนามของเอเจนต์ OpenClaw โดยตั้งใจจำกัดขอบเขตไว้ดังนี้:

- เข้าร่วมเฉพาะ URL `https://meet.google.com/...` เท่านั้น และจะไม่โทรเข้าการประชุมจากหมายเลขโทรศัพท์ที่ค้นพบด้วยตนเอง
- `googlemeet create` สามารถสร้าง URL ของ Meet ใหม่ผ่าน Google Meet API (หรือใช้เบราว์เซอร์เป็นทางเลือกสำรอง) และเข้าร่วมโดยค่าเริ่มต้น
- การเข้าร่วมผ่าน Chrome ใช้โปรไฟล์ Chrome ที่ลงชื่อเข้าใช้แล้ว โดยอาจทำงานบน Node ที่จับคู่ไว้ ส่วนการเข้าร่วมผ่าน Twilio จะโทรไปยังหมายเลขโทรศัพท์พร้อม PIN/DTMF ผ่าน [Plugin การโทรด้วยเสียง](/th/plugins/voice-call) และไม่สามารถโทรไปยัง URL ของ Meet ได้โดยตรง
- `mode: "agent"` (ค่าเริ่มต้น) ถอดเสียงคำพูดของผู้เข้าร่วมด้วยผู้ให้บริการแบบเรียลไทม์ ส่งต่อไปยังเอเจนต์ OpenClaw ที่กำหนดค่าไว้ และพูดคำตอบด้วย TTS ปกติของ OpenClaw ส่วน `mode: "bidi"` อนุญาตให้โมเดลเสียงแบบเรียลไทม์ตอบโดยตรง และ `mode: "transcribe"` เข้าร่วมเพื่อสังเกตการณ์เท่านั้นโดยไม่มีการตอบกลับด้วยเสียง
- ไม่มีการประกาศขอความยินยอมโดยอัตโนมัติเมื่อ Plugin เข้าร่วมสาย
- คำสั่ง CLI คือ `googlemeet` ส่วน `meet` สงวนไว้สำหรับเวิร์กโฟลว์การประชุมทางไกลของเอเจนต์ที่ครอบคลุมกว่านี้

## เริ่มต้นอย่างรวดเร็ว

ติดตั้งการขึ้นต่อกันด้านเสียงในเครื่อง จากนั้นตั้งค่าคีย์ของผู้ให้บริการแบบเรียลไทม์ OpenAI เป็นผู้ให้บริการถอดเสียงเริ่มต้นสำหรับโหมด `agent` ส่วน Google Gemini Live พร้อมใช้งานเป็นผู้ให้บริการเสียงในโหมด `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# จำเป็นเฉพาะเมื่อ realtime.voiceProvider เป็น "google" สำหรับโหมด bidi
export GEMINI_API_KEY=...
```

`blackhole-2ch` ติดตั้งอุปกรณ์เสียงเสมือน `BlackHole 2ch` ที่ Chrome ใช้กำหนดเส้นทางเสียง โปรแกรมติดตั้งของ Homebrew ต้องรีบูตก่อนที่ macOS จะแสดงอุปกรณ์:

```bash
sudo reboot
```

หลังรีบูต ให้ตรวจสอบทั้งสองรายการ:

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

ตรวจสอบการตั้งค่า แล้วจึงเข้าร่วม:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

เอาต์พุตของ `setup` สามารถอ่านได้โดยเอเจนต์และรับรู้โหมด/การรับส่ง โดยรายงานโปรไฟล์ Chrome การตรึง Node และสำหรับการเข้าร่วม Chrome แบบเรียลไทม์ จะรายงานบริดจ์เสียง BlackHole/SoX และการตรวจสอบบทนำที่หน่วงเวลาไว้ การเข้าร่วมแบบสังเกตการณ์เท่านั้นจะข้ามข้อกำหนดเบื้องต้นของระบบเรียลไทม์:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

เมื่อกำหนดค่าการมอบหมายให้ Twilio แล้ว `setup` จะรายงานด้วยว่า `voice-call` ข้อมูลรับรอง Twilio และการเปิดเผย Webhook สาธารณะพร้อมใช้งานหรือไม่ ให้ถือว่าการตรวจสอบ `ok: false` ใดๆ เป็นตัวขัดขวางสำหรับการรับส่ง/โหมดนั้นก่อนที่เอเจนต์จะเข้าร่วม ใช้ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้ และใช้ `--transport chrome|chrome-node|twilio` เพื่อตรวจสอบการรับส่งที่ระบุล่วงหน้า:

```bash
openclaw googlemeet setup --transport twilio
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

บนโฮสต์ Gateway ที่ไม่ใช่ macOS นั้น `google_meet` ยังคงมองเห็นได้สำหรับการดำเนินการเกี่ยวกับอาร์ติแฟกต์ ปฏิทิน การตั้งค่า การถอดเสียง Twilio และ `chrome-node` แต่การตอบกลับด้วยเสียงผ่าน Chrome ในเครื่อง (`transport: "chrome"` พร้อม `mode: "agent"` หรือ `"bidi"`) จะถูกบล็อกก่อนถึงบริดจ์เสียง เนื่องจากเส้นทางนี้ปัจจุบันขึ้นอยู่กับ `BlackHole 2ch` ของ macOS ให้ใช้ `mode: "transcribe"` การโทรเข้าผ่าน Twilio หรือโฮสต์ `chrome-node` ที่เป็น macOS แทน

### สร้างการประชุม

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` มีสองเส้นทาง ซึ่งรายงานในฟิลด์ `source` ของผลลัพธ์:

- **`api`**: ใช้เมื่อกำหนดค่าข้อมูลรับรอง OAuth ของ Google Meet แล้ว มีพฤติกรรมที่กำหนดแน่นอนและไม่ขึ้นอยู่กับสถานะ UI ของเบราว์เซอร์
- **`browser`**: ใช้เมื่อไม่มีข้อมูลรับรอง OAuth โดย OpenClaw จะเปิด `https://meet.google.com/new` บน Node ของ Chrome ที่ตรึงไว้และรอให้ Google เปลี่ยนเส้นทางไปยัง URL ที่มีรหัสการประชุมจริง โปรไฟล์ Chrome ของ OpenClaw บน Node นั้นต้องลงชื่อเข้าใช้ Google ไว้แล้ว ทั้งการเข้าร่วมและการสร้างจะนำแท็บ Meet ที่มีอยู่กลับมาใช้ใหม่ (หรือแท็บพรอมต์ `.../new` / บัญชี Google ที่กำลังดำเนินการอยู่) ก่อนเปิดแท็บใหม่ การจับคู่แท็บจะไม่สนใจสตริงคำค้นที่ไม่มีผล เช่น `authuser`

`create` เข้าร่วมโดยค่าเริ่มต้นและส่งคืน `joined: true` พร้อมเซสชันการเข้าร่วม ส่ง `--no-join` (CLI) หรือ `"join": false` (เครื่องมือ) เพื่อสร้างเฉพาะ URL

สำหรับห้องที่สร้างด้วย API ให้ตั้งค่านโยบายการเข้าถึงอย่างชัดเจนแทนการสืบทอดค่าเริ่มต้นของบัญชี Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | ผู้ที่เข้าร่วมได้โดยไม่ต้องขออนุญาต                                |
| --------------- | ------------------------------------------------------------------- |
| `OPEN`          | ทุกคนที่มี URL ของ Meet                                            |
| `TRUSTED`       | ผู้ใช้ที่เชื่อถือได้ในองค์กรของโฮสต์ ผู้ใช้ภายนอกที่ได้รับเชิญ และผู้ใช้ที่โทรเข้า |
| `RESTRICTED`    | เฉพาะผู้ได้รับเชิญ                                                  |

ตัวเลือกนี้ใช้เฉพาะกับห้องที่สร้างด้วย API ดังนั้นจึงต้องกำหนดค่า OAuth หากยืนยันตัวตนก่อนที่จะมีตัวเลือกนี้ ให้เรียกใช้ `openclaw googlemeet auth login --json` อีกครั้งหลังเพิ่มขอบเขต `meetings.space.settings` ในหน้าจอขอความยินยอม OAuth

หากทางเลือกสำรองของเบราว์เซอร์พบหน้าลงชื่อเข้าใช้ Google หรือตัวขัดขวางสิทธิ์ของ Meet เครื่องมือจะส่งคืน `manualActionRequired: true` พร้อม `manualActionReason`, `manualActionMessage` และ `browser.nodeId`/`browser.targetId`/`browserUrl` ให้รายงานข้อความดังกล่าวและหยุดเปิดแท็บ Meet ใหม่จนกว่าผู้ปฏิบัติงานจะดำเนินขั้นตอนในเบราว์เซอร์เสร็จสิ้น

### เข้าร่วมเพื่อสังเกตการณ์เท่านั้น

ตั้งค่า `"mode": "transcribe"` เพื่อข้ามบริดจ์เรียลไทม์แบบสองทิศทาง (ไม่ต้องใช้ BlackHole/SoX และไม่มีการตอบกลับด้วยเสียง) การเข้าร่วม Chrome ในโหมดถอดเสียงจะข้ามการให้สิทธิ์ไมโครโฟน/กล้องของ OpenClaw และเส้นทาง **Use microphone** ของ Meet ด้วย หาก Meet แสดงหน้าคั่นสำหรับเลือกเสียง ระบบอัตโนมัติจะลอง **Continue without microphone** ก่อน การรับส่ง Chrome ที่มีการจัดการในโหมดนี้จะติดตั้งตัวสังเกตคำบรรยายของ Meet แบบพยายามอย่างเต็มที่ `googlemeet status --json` และ `googlemeet doctor` รายงาน `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` และส่วนท้าย `recentTranscript`

สำหรับทรานสคริปต์ของเซสชันที่มีขอบเขตจำกัด ให้อ่านแท็บ Meet ที่ติดตามไว้อย่างถูกต้อง:

```bash
openclaw googlemeet transcript <session-id>
openclaw googlemeet transcript <session-id> --since <next-index> --json
```

ตัวสังเกตจะเก็บบรรทัดคำบรรยายที่เสร็จสมบูรณ์ไว้ในหน้า Meet ได้สูงสุด 2,000 บรรทัด ข้อความที่กำลังเพิ่มขึ้นและมองเห็นได้จะคงอยู่ในส่วนท้ายสถานะความพร้อมจนกว่าแถวคำบรรยายจะเสร็จสมบูรณ์ ดังนั้นการบันทึก `nextIndex` จะไม่ข้ามการขยายข้อความในภายหลัง และการออกจากการประชุมจะทำให้แถวที่มองเห็นได้เสร็จสมบูรณ์ก่อนสร้างสแนปช็อต `droppedLines` รายงานบรรทัดที่สูญหายจากส่วนต้นเมื่อเกินขีดจำกัด ทรานสคริปต์ของสี่เซสชันที่สิ้นสุดล่าสุดยังคงอ่านได้จนกว่า Gateway จะรีสตาร์ต ทรานสคริปต์ของเซสชันเก่ากว่านั้นจะส่งคืน `evicted: true` ทั้งหมดนี้ตั้งใจให้เป็นหน่วยความจำขณะรันไทม์ ไม่ใช่พื้นที่จัดเก็บประวัติการประชุมแบบถาวร การรีสตาร์ต Gateway การปิดแท็บก่อนสร้างสแนปช็อต หรือการเกินขีดจำกัดที่ระบุไว้อาจทำให้คำบรรยายสูญหาย

สำหรับการตรวจสอบการฟังแบบใช่/ไม่ใช่:

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

คำสั่งนี้เข้าร่วมในโหมดถอดเสียง รอการเคลื่อนไหวใหม่ของคำบรรยาย/ทรานสคริปต์ และส่งคืน `listenVerified`, `listenTimedOut`, ฟิลด์การดำเนินการด้วยตนเอง และสถานะความพร้อมของคำบรรยายปัจจุบัน

### สถานะความพร้อมของเซสชันแบบเรียลไทม์

ระหว่างเซสชันที่มีการตอบกลับด้วยเสียง สถานะ `google_meet` จะรายงานสถานะความพร้อมของ Chrome/บริดจ์เสียง ได้แก่ `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, เวลาประทับอินพุต/เอาต์พุตล่าสุด ตัวนับไบต์ และสถานะการปิดบริดจ์ เซสชัน Chrome ที่มีการจัดการจะพูดวลีแนะนำ/ทดสอบหลังจากสถานะความพร้อมรายงาน `inCall: true` เท่านั้น มิฉะนั้น `speechReady: false` และความพยายามพูดจะถูกบล็อก แทนที่จะไม่มีการดำเนินการโดยไม่แจ้งให้ทราบ

การเข้าร่วมผ่าน Chrome ในเครื่องใช้โปรไฟล์เบราว์เซอร์ OpenClaw ที่ลงชื่อเข้าใช้แล้ว และต้องใช้ `BlackHole 2ch` สำหรับเส้นทางไมโครโฟน/ลำโพง อุปกรณ์ BlackHole เพียงเครื่องเดียวก็เพียงพอสำหรับการทดสอบเบื้องต้นครั้งแรก แต่อาจเกิดเสียงสะท้อน ให้ใช้อุปกรณ์เสมือนแยกกันหรือกราฟแบบ Loopback เพื่อให้ได้เสียงสองทิศทางที่คมชัด

## Gateway ในเครื่อง + Chrome บน Parallels

ไม่จำเป็นต้องมี Gateway แบบเต็มหรือคีย์ API ของโมเดลภายใน VM ของ macOS เพียงเพื่อให้ VM ใช้งาน Chrome ให้เรียกใช้ Gateway และเอเจนต์ในเครื่อง และเรียกใช้โฮสต์ Node ใน VM

| ทำงานที่ใด           | สิ่งที่ทำงาน                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| โฮสต์ Gateway         | OpenClaw Gateway พื้นที่ทำงานของเอเจนต์ คีย์โมเดล/API ผู้ให้บริการแบบเรียลไทม์ และการกำหนดค่า Plugin Google Meet |
| VM ของ Parallels macOS   | โฮสต์ CLI/Node ของ OpenClaw, Chrome, SoX, BlackHole 2ch และโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้ Google แล้ว |
| สิ่งที่ไม่จำเป็นใน VM | บริการ Gateway การกำหนดค่าเอเจนต์ และการตั้งค่าผู้ให้บริการโมเดล                         |

ติดตั้งการขึ้นต่อกันใน VM รีบูต แล้วตรวจสอบ:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

เปิดใช้งาน Plugin ใน VM และเริ่มโฮสต์ Node:

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

หาก `<gateway-host>` เป็น IP ของ LAN ที่ไม่มี TLS ให้เลือกอนุญาตเครือข่ายส่วนตัวที่เชื่อถือได้นั้น:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

ใช้แฟล็กเดียวกันเมื่อติดตั้งเป็น LaunchAgent (ค่านี้เป็นสภาพแวดล้อมของกระบวนการ ซึ่งจะถูกจัดเก็บในสภาพแวดล้อมของ LaunchAgent เมื่อมีอยู่ในคำสั่งติดตั้ง ไม่ใช่การตั้งค่า `openclaw.json`):

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

อนุมัติ Node จากโฮสต์ Gateway จากนั้นยืนยันว่า Node ประกาศทั้ง `googlemeet.chrome` และความสามารถของเบราว์เซอร์/`browser.proxy`:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

กำหนดเส้นทาง Meet ผ่าน Node นั้น:

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

จากนั้นเข้าร่วมตามปกติจากโฮสต์ Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

สำหรับการทดสอบเบื้องต้นด้วยคำสั่งเดียว ซึ่งสร้างหรือนำเซสชันกลับมาใช้ใหม่ พูดวลีที่กำหนดไว้ และพิมพ์สถานะความพร้อมของเซสชัน:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

ระหว่างการเข้าร่วมแบบเรียลไทม์ ระบบอัตโนมัติของเบราว์เซอร์จะกรอกชื่อผู้เข้าร่วม คลิก Join/Ask to join และยอมรับพรอมต์ "Use microphone" เมื่อใช้งาน Meet ครั้งแรกหากพรอมต์ปรากฏขึ้น (หรือ "Continue without microphone" ระหว่างการเข้าร่วมแบบสังเกตการณ์เท่านั้นและการสร้างการประชุมผ่านเบราว์เซอร์เท่านั้น) หากโปรไฟล์ออกจากระบบ Meet กำลังรอการอนุมัติจากโฮสต์ Chrome ต้องการสิทธิ์ไมโครโฟน/กล้อง หรือ Meet ค้างอยู่ที่พรอมต์ซึ่งยังไม่ได้รับการแก้ไข ผลลัพธ์จะรายงาน `manualActionRequired: true` พร้อม `manualActionReason` และ `manualActionMessage` ให้หยุดลองใหม่ รายงานข้อความดังกล่าวพร้อม `browserUrl`/`browserTitle` และลองใหม่หลังจากดำเนินการด้วยตนเองเสร็จสิ้นเท่านั้น

หากละเว้น `chromeNode.node` OpenClaw จะเลือกอัตโนมัติเฉพาะเมื่อมีโหนดที่เชื่อมต่ออยู่เพียงหนึ่งโหนดซึ่งประกาศทั้ง `googlemeet.chrome` และการควบคุมเบราว์เซอร์ ให้ตรึง `chromeNode.node` (รหัสโหนด ชื่อที่แสดง หรือ IP ระยะไกล) เมื่อมีหลายโหนดที่รองรับเชื่อมต่ออยู่

### การตรวจสอบความล้มเหลวที่พบบ่อย

| อาการ                                                  | วิธีแก้ไข                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | รู้จักโหนดที่ตรึงไว้แล้ว แต่โหนดไม่พร้อมใช้งาน ให้รายงานสิ่งที่ขัดขวางการตั้งค่า อย่าสลับไปใช้การรับส่งแบบอื่นโดยไม่แจ้ง เว้นแต่จะได้รับคำขอ                                                                                                                                    |
| `No connected Google Meet-capable node`                  | เรียกใช้ `openclaw node run` ใน VM อนุมัติการจับคู่ แล้วเรียกใช้ `openclaw plugins enable google-meet` และ `openclaw plugins enable browser` ที่นั่น ยืนยันว่า `gateway.nodes.allowCommands` มี `googlemeet.chrome` และ `browser.proxy`                              |
| `BlackHole 2ch audio device not found`                   | ติดตั้ง `blackhole-2ch` บนโฮสต์ที่กำลังตรวจสอบแล้วรีบูต                                                                                                                                                                                                       |
| `BlackHole 2ch audio device not found on the node`       | ติดตั้ง `blackhole-2ch` ใน VM แล้วรีบูต VM                                                                                                                                                                                                                |
| Chrome เปิดขึ้นแต่เข้าร่วมไม่ได้                             | ลงชื่อเข้าใช้โปรไฟล์เบราว์เซอร์ใน VM หรือคงการตั้งค่า `chrome.guestName` ไว้ การเข้าร่วมอัตโนมัติของเกสต์ใช้ระบบอัตโนมัติเบราว์เซอร์ของ OpenClaw ผ่านพร็อกซีเบราว์เซอร์ของโหนด ให้ชี้ `browser.defaultProfile` ของโหนด (หรือโปรไฟล์เซสชันที่มีอยู่ซึ่งมีชื่อกำกับ) ไปยังโปรไฟล์ที่ต้องการ |
| มีแท็บ Meet ซ้ำ                                      | คง `chrome.reuseExistingTab: true` ไว้ OpenClaw จะเปิดใช้งานแท็บเดิมสำหรับ URL เดียวกัน และการสร้างจะนำ `.../new` ที่กำลังดำเนินอยู่หรือแท็บข้อความแจ้งบัญชี Google กลับมาใช้ ก่อนเปิดแท็บอื่น                                                                      |
| ไม่มีเสียง                                                 | กำหนดเส้นทางไมโครโฟน/ลำโพงของ Meet ผ่านเส้นทางเสียงเสมือนที่ OpenClaw ใช้ ใช้อุปกรณ์เสมือนแยกกันหรือการกำหนดเส้นทางแบบ Loopback เพื่อให้ได้เสียงสองทิศทางที่ชัดเจน                                                                                                              |

## หมายเหตุการติดตั้ง

ค่าเริ่มต้นการตอบกลับด้วยเสียงผ่าน Chrome ใช้เครื่องมือภายนอกสองรายการที่ OpenClaw ไม่ได้รวมชุดหรือแจกจ่ายต่อ ให้ติดตั้งเป็นการขึ้นต่อกันของโฮสต์ผ่าน Homebrew:

- `sox`: ยูทิลิตีเสียงแบบบรรทัดคำสั่ง Plugin จะส่งคำสั่งอุปกรณ์ CoreAudio อย่างชัดเจนสำหรับบริดจ์เสียง PCM16 เริ่มต้นที่ 24 kHz
- `blackhole-2ch`: ไดรเวอร์เสียงเสมือนของ macOS ซึ่งให้อุปกรณ์ `BlackHole 2ch` ที่ Chrome/Meet ใช้กำหนดเส้นทางผ่าน

SoX ใช้สัญญาอนุญาต `LGPL-2.0-only AND GPL-2.0-only`; BlackHole ใช้ GPL-3.0 หากสร้างโปรแกรมติดตั้งหรืออุปกรณ์ที่รวม BlackHole มากับ OpenClaw ให้ตรวจสอบสัญญาอนุญาตต้นทางของ BlackHole หรือขอรับสัญญาอนุญาตแยกต่างหากจาก Existential Audio

## การรับส่ง

| การรับส่ง     | ใช้เมื่อ                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `chrome`      | Chrome/เสียงทำงานอยู่บนโฮสต์ Gateway                                                        |
| `chrome-node` | Chrome/เสียงทำงานอยู่บนโหนดที่จับคู่แล้ว (เช่น VM macOS ของ Parallels)                        |
| `twilio`      | การโทรเข้าสำรองผ่าน Plugin Voice Call เมื่อไม่สามารถเข้าร่วมด้วย Chrome ได้ |

### Chrome

เปิด URL ของ Meet ผ่านการควบคุมเบราว์เซอร์ของ OpenClaw และเข้าร่วมด้วยโปรไฟล์เบราว์เซอร์ OpenClaw ที่ลงชื่อเข้าใช้แล้ว บน macOS Plugin จะตรวจสอบ `BlackHole 2ch` ก่อนเปิดใช้งาน และหากกำหนดค่าไว้ จะเรียกใช้คำสั่งตรวจสอบสถานะ/เริ่มต้นบริดจ์เสียงก่อนเปิด Chrome สำหรับ Chrome ในเครื่อง ให้เลือกโปรไฟล์ด้วย `browser.defaultProfile`; ส่วน `chrome.browserProfile` จะถูกส่งไปยังโฮสต์ `chrome-node` แทน

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

เสียงไมโครโฟน/ลำโพงของ Chrome จะถูกกำหนดเส้นทางผ่านบริดจ์เสียง OpenClaw ในเครื่อง หากไม่ได้ติดตั้ง `BlackHole 2ch` การเข้าร่วมจะล้มเหลวพร้อมข้อผิดพลาดการตั้งค่า แทนที่จะเข้าร่วมโดยไม่มีเส้นทางเสียง

### Twilio

แผนการโทรที่เข้มงวดซึ่งมอบหมายให้ [Plugin Voice Call](/th/plugins/voice-call) โดยจะไม่แยกวิเคราะห์หน้าของ Meet เพื่อค้นหาหมายเลขโทรศัพท์ Google Meet ต้องแสดงหมายเลขโทรเข้าและ PIN สำหรับการประชุม

เปิดใช้ Voice Call บนโฮสต์ Gateway ไม่ใช่โหนด Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // หรือตั้งค่าเป็น "twilio" หากต้องการให้ Twilio เป็นค่าเริ่มต้น
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
            instructions: "เข้าร่วม Google Meet นี้ในฐานะเอเจนต์ OpenClaw ตอบให้กระชับ",
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

ระบุข้อมูลประจำตัว Twilio ผ่านสภาพแวดล้อมเพื่อไม่ให้ข้อมูลลับอยู่ใน `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

หาก OpenAI เป็นผู้ให้บริการเสียงแบบเรียลไทม์ ให้ใช้ `realtime.provider: "openai"` ร่วมกับ `OPENAI_API_KEY` แทน

รีสตาร์ตหรือโหลด Gateway ใหม่หลังจากเปิดใช้ `voice-call` การเปลี่ยนแปลงการกำหนดค่า Plugin จะไม่มีผลจนกว่าจะโหลดใหม่ ตรวจสอบด้วย:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

เมื่อเชื่อมต่อการมอบหมายให้ Twilio แล้ว `googlemeet setup` จะมีการตรวจสอบ `twilio-voice-call-plugin`, `twilio-voice-call-credentials` และ `twilio-voice-call-webhook`

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

ใช้ `--dtmf-sequence` สำหรับลำดับแบบกำหนดเอง โดยนำหน้าด้วย `w` หรือเครื่องหมายจุลภาคเพื่อหยุดชั่วคราวก่อน PIN:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth และการตรวจสอบล่วงหน้า

OAuth เป็นตัวเลือกเสริมสำหรับการสร้างลิงก์ Meet เนื่องจาก `googlemeet create` สามารถสำรองไปใช้ระบบอัตโนมัติเบราว์เซอร์ได้ กำหนดค่า OAuth เพื่อสร้างผ่าน API อย่างเป็นทางการ แปลงข้อมูลพื้นที่ หรือใช้การตรวจสอบล่วงหน้าของ Meet Media API การเข้าร่วมผ่าน Chrome/Chrome-node ไม่ต้องพึ่งพา OAuth โดยจะใช้โปรไฟล์ Chrome ที่ลงชื่อเข้าใช้แล้ว BlackHole/SoX และ (สำหรับ `chrome-node`) โหนดที่เชื่อมต่ออยู่ไม่ว่าในกรณีใด

### สร้างข้อมูลประจำตัว Google

ใน Google Cloud Console:

<Steps>
<Step title="สร้างหรือเลือกโปรเจกต์">
</Step>
<Step title="เปิดใช้ Google Meet REST API">
</Step>
<Step title="กำหนดค่าหน้าจอคำยินยอม OAuth">
Internal เป็นตัวเลือกที่ง่ายที่สุดสำหรับองค์กร Google Workspace ส่วน External ใช้ได้กับการตั้งค่าส่วนบุคคล/การทดสอบ ขณะที่แอปอยู่ในสถานะ Testing ให้เพิ่มบัญชี Google แต่ละบัญชีที่จะอนุญาตแอปเป็นผู้ใช้ทดสอบ
</Step>
<Step title="เพิ่มขอบเขตที่ร้องขอ">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly` (ค้นหาปฏิทิน)
- `https://www.googleapis.com/auth/drive.meet.readonly` (ส่งออกเนื้อหาเอกสารถอดเสียง/บันทึกอัจฉริยะ)

</Step>
<Step title="สร้าง OAuth client ID">
ประเภทแอปพลิเคชัน **Web application** URI เปลี่ยนเส้นทางที่ได้รับอนุญาต:

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="คัดลอก client ID และ client secret">
</Step>
</Steps>

`spaces.create` ต้องใช้ `meetings.space.created` ส่วน `meetings.space.readonly` ใช้แปลง URL/รหัส Meet เป็นพื้นที่ `meetings.space.settings` ช่วยให้ OpenClaw ส่งการตั้งค่า `SpaceConfig` เช่น `accessType` ระหว่างการสร้างห้องผ่าน API ได้ `meetings.conference.media.readonly` ใช้สำหรับการตรวจสอบล่วงหน้าของ Meet Media API และงานสื่อ โดย Google อาจกำหนดให้ลงทะเบียน Developer Preview เพื่อใช้งาน Media API จริง `calendar.events.readonly` จำเป็นเฉพาะสำหรับการค้นหาปฏิทินด้วย `--today`/`--event` เท่านั้น `drive.meet.readonly` จำเป็นเฉพาะสำหรับการส่งออก `--include-doc-bodies` เท่านั้น หากต้องการเพียงเข้าร่วมผ่าน Chrome โดยใช้เบราว์เซอร์ ให้ข้าม OAuth ทั้งหมด

### สร้างโทเค็นรีเฟรช

กำหนดค่า `oauth.clientId` และ `oauth.clientSecret` เป็นตัวเลือกเสริม (หรือส่งผ่านเป็นตัวแปรสภาพแวดล้อม) แล้วเรียกใช้:

```bash
openclaw googlemeet auth login --json
```

คำสั่งนี้จะเรียกใช้โฟลว์ PKCE พร้อมคอลแบ็ก localhost บน `http://localhost:8085/oauth2callback` และพิมพ์บล็อกการกำหนดค่า `oauth` ที่มีโทเค็นรีเฟรช เพิ่ม `--manual` เพื่อใช้โฟลว์คัดลอก/วางเมื่อเบราว์เซอร์ไม่สามารถเข้าถึงคอลแบ็กในเครื่องได้:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

เอาต์พุต JSON:

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

จัดเก็บออบเจ็กต์ `oauth` ไว้ใต้การกำหนดค่า Plugin:

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

ควรใช้ตัวแปรสภาพแวดล้อมเมื่อไม่ต้องการให้โทเค็นรีเฟรชอยู่ในการกำหนดค่า ระบบจะแก้ไขค่าจากการกำหนดค่าก่อน แล้วจึงใช้สภาพแวดล้อมเป็นทางเลือกสำรอง หากยืนยันตัวตนก่อนที่จะมีการรองรับการสร้างการประชุม การค้นหาปฏิทิน หรือการส่งออกเนื้อหาเอกสาร ให้เรียกใช้ `openclaw googlemeet auth login --json` อีกครั้งเพื่อให้โทเค็นรีเฟรชครอบคลุมชุดขอบเขตปัจจุบัน

### ตรวจสอบ OAuth ด้วย doctor

```bash
openclaw googlemeet doctor --oauth --json
```

คำสั่งนี้ตรวจสอบว่ามีการกำหนดค่า OAuth และโทเค็นรีเฟรชสามารถสร้างโทเค็นการเข้าถึงได้ โดยไม่โหลดรันไทม์ Chrome หรือกำหนดให้มีโหนดที่เชื่อมต่อ รายงานจะมีเฉพาะฟิลด์สถานะ (`ok`, `configured`, `tokenSource`, `expiresAt`, ข้อความการตรวจสอบ) และจะไม่พิมพ์โทเค็นการเข้าถึง โทเค็นรีเฟรช หรือ client secret

| การตรวจสอบ                | ความหมาย                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `oauth-config`       | มี `oauth.clientId` พร้อม `oauth.refreshToken` หรือมีโทเค็นการเข้าถึงที่แคชไว้ |
| `oauth-token`        | โทเค็นการเข้าถึงที่แคชไว้ยังใช้ได้ หรือโทเค็นรีเฟรชสร้างโทเค็นใหม่สำเร็จ    |
| `meet-spaces-get`    | การตรวจสอบ `--meeting` ซึ่งเป็นตัวเลือกเสริมแปลงข้อมูลพื้นที่ Meet ที่มีอยู่สำเร็จ                       |
| `meet-spaces-create` | การตรวจสอบ `--create-space` ซึ่งเป็นตัวเลือกเสริมสร้างพื้นที่ Meet ใหม่สำเร็จ                         |

พิสูจน์การเปิดใช้งาน Meet API และขอบเขต `spaces.create` ด้วยการตรวจสอบการสร้างที่ก่อให้เกิดผลข้างเคียง:

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

พิสูจน์สิทธิ์การอ่านพื้นที่ที่มีอยู่:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`403` จากการตรวจสอบเหล่านี้มักหมายความว่า Meet REST API ถูกปิดใช้งาน, refresh token ไม่มีขอบเขตที่จำเป็น หรือบัญชี Google ไม่สามารถเข้าถึงพื้นที่นั้นได้ ข้อผิดพลาดเกี่ยวกับ refresh token หมายความว่าต้องเรียกใช้ `openclaw googlemeet auth login --json` อีกครั้งและจัดเก็บบล็อก `oauth` ใหม่

ไม่จำเป็นต้องใช้ OAuth สำหรับทางเลือกสำรองผ่านเบราว์เซอร์ การยืนยันตัวตน Google ในกรณีนี้มาจากโปรไฟล์ Chrome ที่ลงชื่อเข้าใช้อยู่บน Node ที่เลือก ไม่ใช่จากการกำหนดค่า OpenClaw

ตัวแปรสภาพแวดล้อมเหล่านี้ใช้เป็นค่าทางเลือกสำรองได้:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` หรือ `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` หรือ `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` หรือ `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` หรือ `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` หรือ `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` หรือ `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` หรือ `GOOGLE_MEET_PREVIEW_ACK`

### แก้ไขข้อมูลอ้างอิง ตรวจสอบล่วงหน้า และอ่านอาร์ติแฟกต์

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

หลังจาก Meet สร้างระเบียนการประชุมแล้ว:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

เมื่อใช้ `--meeting`, `artifacts` และ `attendance` ระบบจะใช้ระเบียนการประชุมล่าสุดโดยค่าเริ่มต้น ให้ส่ง `--all-conference-records` เพื่อใช้ทุกระเบียนที่เก็บรักษาไว้

การค้นหาปฏิทินจะแก้ไข URL การประชุมจาก Google Calendar ก่อนอ่านอาร์ติแฟกต์ (ต้องใช้ refresh token ที่มีขอบเขตอ่านอย่างเดียวสำหรับกิจกรรม Calendar):

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` ค้นหาเหตุการณ์ที่มีลิงก์ Meet ในปฏิทิน `primary` ของวันนี้ ส่วน `--event <query>` ค้นหาข้อความเหตุการณ์ที่ตรงกัน และ `--calendar <id>` ระบุปฏิทินที่ไม่ใช่ปฏิทินหลัก `calendar-events` แสดงตัวอย่างเหตุการณ์ที่ตรงกันและทำเครื่องหมายว่า `latest`/`artifacts`/`attendance`/`export` จะเลือกเหตุการณ์ใด

หากทราบ ID ระเบียนการประชุมอยู่แล้ว ให้ระบุโดยตรง:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

ปิดห้องสำหรับพื้นที่ที่สร้างผ่าน API:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

เรียกใช้ `spaces.endActiveConference` และต้องใช้ OAuth ที่มีขอบเขต `meetings.space.created` สำหรับพื้นที่ที่บัญชีซึ่งได้รับอนุญาตสามารถจัดการได้ รองรับ URL ของ Meet, รหัสการประชุม หรือ `spaces/{id}` และจะแก้ไขเป็นทรัพยากรพื้นที่ของ API ก่อน การดำเนินการนี้แยกจาก `googlemeet leave`: `leave` จะหยุดการเข้าร่วมภายในเครื่อง/เซสชันของ OpenClaw ส่วน `end-active-conference` จะขอให้ Google Meet ยุติการประชุมที่กำลังดำเนินอยู่สำหรับพื้นที่นั้น

เขียนรายงานที่อ่านได้:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` ส่งคืนข้อมูลเมตาของระเบียนการประชุม รวมถึงข้อมูลเมตาทรัพยากรของผู้เข้าร่วม การบันทึกเสียง/วิดีโอ บทถอดเสียง รายการบทถอดเสียงแบบมีโครงสร้าง และบันทึกอัจฉริยะ เมื่อ Google เปิดเผยข้อมูลดังกล่าว `--no-transcript-entries` จะข้ามการค้นหารายการสำหรับการประชุมขนาดใหญ่ `attendance` จะขยายผู้เข้าร่วมเป็นแถวเซสชันของผู้เข้าร่วม พร้อมเวลาที่พบครั้งแรก/ล่าสุด ระยะเวลารวมของเซสชัน แฟล็กการมาสาย/ออกก่อนเวลา และรวมทรัพยากรผู้เข้าร่วมที่ซ้ำกันตามผู้ใช้ที่ลงชื่อเข้าใช้หรือชื่อที่แสดง ส่วน `--no-merge-duplicates` จะแยกทรัพยากรดิบออกจากกัน และ `--late-after-minutes`/`--early-before-minutes` ใช้ปรับค่าเกณฑ์

`export` เขียนโฟลเดอร์ที่มี `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` และ `manifest.json` โดย `manifest.json` จะบันทึกอินพุตที่เลือก ตัวเลือกการส่งออก ระเบียนการประชุม ไฟล์เอาต์พุต จำนวน แหล่งที่มาของโทเค็น เหตุการณ์ Calendar ที่ใช้ และคำเตือนเกี่ยวกับการเรียกข้อมูลบางส่วน `--zip` ยังเขียนไฟล์เก็บถาวรแบบพกพาไว้ข้างโฟลเดอร์ด้วย `--include-doc-bodies` ส่งออกข้อความ Google Docs ของบทถอดเสียง/บันทึกอัจฉริยะที่เชื่อมโยงผ่าน Drive `files.export` (ต้องใช้ขอบเขตอ่านอย่างเดียวของ Drive Meet) หากไม่มีขอบเขตนี้ การส่งออกจะมีเฉพาะข้อมูลเมตาของ Meet และรายการบทถอดเสียงแบบมีโครงสร้าง ความล้มเหลวบางส่วนของอาร์ติแฟกต์ (ข้อผิดพลาดในการแสดงรายการบันทึกอัจฉริยะ รายการบทถอดเสียง หรือเนื้อหาเอกสาร) จะเก็บคำเตือนไว้ในข้อมูลสรุป/ไฟล์ manifest แทนที่จะทำให้การส่งออกทั้งหมดล้มเหลว `--dry-run` เรียกข้อมูลชุดเดียวกันและพิมพ์ JSON ของ manifest โดยไม่สร้างโฟลเดอร์หรือไฟล์ ZIP

Agent ใช้การดำเนินการเดียวกันผ่านเครื่องมือ `google_meet` (`export`, `create` พร้อม `accessType`, `end_active_conference`, `test_listen`) โปรดดู [เครื่องมือ](#tool)

### การทดสอบแบบ Smoke กับระบบจริง

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| ตัวแปร                                                                                                                  | วัตถุประสงค์                                                                |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | เปิดใช้งานการทดสอบกับระบบจริงที่มีการป้องกัน                                             |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | URL ของ Meet, รหัส หรือ `spaces/{id}` ที่เก็บรักษาไว้                              |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | ID ไคลเอนต์ OAuth                                                        |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | Refresh token                                                          |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | ไม่บังคับ ชื่อทางเลือกสำรองเดียวกันที่ไม่มีคำนำหน้า `OPENCLAW_` ก็ใช้งานได้ |

การทดสอบแบบ Smoke พื้นฐานสำหรับอาร์ติแฟกต์/การเข้าร่วมต้องใช้ `meetings.space.readonly` และ `meetings.conference.media.readonly` การค้นหา Calendar ต้องใช้ `calendar.events.readonly` การส่งออกเนื้อหาเอกสาร Drive ต้องใช้ `drive.meet.readonly`

### ตัวอย่างการสร้าง

```bash
openclaw googlemeet create
```

พิมพ์ URI การประชุมใหม่ แหล่งที่มา และเซสชันการเข้าร่วม เมื่อใช้ OAuth คำสั่งจะใช้ Meet API หากไม่ใช้ OAuth คำสั่งจะใช้โปรไฟล์ที่ลงชื่อเข้าใช้อยู่ของ Node Chrome ที่ปักหมุดไว้ JSON ของทางเลือกสำรองผ่านเบราว์เซอร์:

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

หากทางเลือกสำรองผ่านเบราว์เซอร์พบหน้าลงชื่อเข้าใช้ Google หรือตัวบล็อกสิทธิ์ Meet ก่อน `google_meet` จะส่งคืนรายละเอียดแบบมีโครงสร้างแทนสตริงธรรมดา:

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

JSON สำหรับการสร้างผ่าน API:

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

การสร้างจะเข้าร่วมโดยค่าเริ่มต้น แต่ Chrome/Chrome-node ยังคงต้องใช้โปรไฟล์ Google ที่ลงชื่อเข้าใช้แล้วเพื่อเข้าร่วมผ่านเบราว์เซอร์ หากออกจากระบบ OpenClaw จะรายงาน `manualActionRequired: true` หรือข้อผิดพลาดของทางเลือกสำรองผ่านเบราว์เซอร์ และขอให้ผู้ปฏิบัติงานลงชื่อเข้าใช้ Google ให้เสร็จก่อนลองอีกครั้ง

ตั้งค่า `preview.enrollmentAcknowledged: true` หลังจากยืนยันแล้วเท่านั้นว่าโปรเจกต์ Cloud, principal ของ OAuth และผู้เข้าร่วมการประชุมได้ลงทะเบียนใน Google Workspace Developer Preview Program สำหรับ Meet media APIs

## การกำหนดค่า

เส้นทาง Agent ของ Chrome ทั่วไปต้องการเพียงการเปิดใช้งาน Plugin, BlackHole, SoX, คีย์ของผู้ให้บริการแบบเรียลไทม์ และผู้ให้บริการ TTS ของ OpenClaw ที่กำหนดค่าไว้:

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

### ค่าเริ่มต้น

| คีย์                               | ค่าเริ่มต้น                                  | หมายเหตุ                                                                                                                                                                                                             |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                   |
| `defaultMode`                     | `"agent"`                                | ยอมรับ `"realtime"` เป็นนามแฝงแบบเก่าสำหรับ `"agent"`; ผู้เรียกใหม่ควรใช้ `"agent"`                                                                                                                        |
| `chromeNode.node`                 | ไม่ได้ตั้งค่า                                    | ID/ชื่อ/IP ของ Node สำหรับ `chrome-node`; จำเป็นเมื่ออาจมี Node ที่รองรับเชื่อมต่ออยู่มากกว่าหนึ่ง Node                                                                                                                      |
| `chrome.launch`                   | `true`                                   | เปิด Chrome เพื่อเข้าร่วม; ตั้งค่า `false` เฉพาะเมื่อนำเซสชันที่เปิดอยู่แล้วกลับมาใช้                                                                                                                                 |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                   |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | แสดงบนหน้าจอผู้เข้าร่วม Meet ที่ออกจากระบบ                                                                                                                                                                         |
| `chrome.autoJoin`                 | `true`                                   | พยายามกรอกชื่อผู้เข้าร่วมและคลิก Join Now บน `chrome-node` เท่าที่ทำได้                                                                                                                                                   |
| `chrome.reuseExistingTab`         | `true`                                   | เปิดใช้งานแท็บ Meet ที่มีอยู่แทนการเปิดแท็บซ้ำ                                                                                                                                                      |
| `chrome.waitForInCallMs`          | `20000`                                  | รอให้แท็บ Meet รายงานว่าอยู่ในการโทรก่อนเริ่มข้อความแนะนำการตอบกลับด้วยเสียง                                                                                                                                          |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | รูปแบบเสียงของคู่คำสั่ง; `"g711-ulaw-8khz"` ใช้เฉพาะกับคู่คำสั่งแบบเก่า/แบบกำหนดเองที่ส่งออกเสียงโทรศัพท์                                                                                                   |
| `chrome.audioBufferBytes`         | `4096`                                   | บัฟเฟอร์ประมวลผล SoX สำหรับคำสั่งเสียงของคู่คำสั่งที่สร้างขึ้น (ครึ่งหนึ่งของบัฟเฟอร์เริ่มต้น 8192 ไบต์ของ SoX ซึ่งช่วยลดเวลาแฝงของไปป์); ค่าจะถูกจำกัดให้ไม่น้อยกว่า 17 ไบต์                                         |
| `chrome.audioInputCommand`        | คำสั่ง SoX ที่สร้างขึ้น                    | อ่านจาก CoreAudio `BlackHole 2ch` และเขียนเสียงใน `chrome.audioFormat`                                                                                                                                        |
| `chrome.audioOutputCommand`       | คำสั่ง SoX ที่สร้างขึ้น                    | อ่านเสียงใน `chrome.audioFormat` และเขียนไปยัง CoreAudio `BlackHole 2ch`                                                                                                                                          |
| `chrome.bargeInInputCommand`      | ไม่ได้ตั้งค่า                                    | คำสั่งไมโครโฟนภายในเครื่องแบบไม่บังคับ ซึ่งเขียน PCM โมโนแบบ little-endian 16 บิตชนิดมีเครื่องหมาย สำหรับตรวจจับการพูดแทรกของมนุษย์ระหว่างที่ผู้ช่วยกำลังเล่นเสียง; ใช้กับบริดจ์คู่คำสั่งที่โฮสต์โดย Gateway                          |
| `chrome.bargeInRmsThreshold`      | `650`                                    | ระดับ RMS ที่นับเป็นการขัดจังหวะโดยมนุษย์                                                                                                                                                                           |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | ระดับสูงสุดที่นับเป็นการขัดจังหวะโดยมนุษย์                                                                                                                                                                          |
| `chrome.bargeInCooldownMs`        | `900`                                    | ระยะหน่วงขั้นต่ำระหว่างการล้างสถานะการขัดจังหวะซ้ำ                                                                                                                                                                |
| `mode` (ต่อคำขอ)              | `"agent"`                                | โหมดตอบกลับด้วยเสียง; ดูตาราง [โหมด Agent และ bidi](#agent-and-bidi-modes)                                                                                                                                       |
| `realtime.provider`               | `"openai"`                               | ค่าสำรองเพื่อความเข้ากันได้ที่ใช้เมื่อไม่ได้ตั้งค่าฟิลด์ที่มีขอบเขตด้านล่าง                                                                                                                                                |
| `realtime.transcriptionProvider`  | `"openai"`                               | ID ผู้ให้บริการที่โหมด `agent` ใช้สำหรับการถอดเสียงแบบเรียลไทม์                                                                                                                                                       |
| `realtime.voiceProvider`          | ไม่ได้ตั้งค่า                                    | ID ผู้ให้บริการที่โหมด `bidi` ใช้สำหรับเสียงเรียลไทม์โดยตรง; ตั้งเป็น `"google"` สำหรับ Gemini Live โดยยังคงใช้ OpenAI สำหรับการถอดเสียงในโหมด Agent จับคู่กับ `realtime.model` เพื่อเลือกรุ่น Gemini Live ที่เฉพาะเจาะจง |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | ดู [โหมด Agent และ bidi](#agent-and-bidi-modes)                                                                                                                                                                 |
| `realtime.instructions`           | คำสั่งให้ตอบด้วยเสียงแบบกระชับ          | บอกโมเดลให้พูดอย่างกระชับและใช้ `openclaw_agent_consult` สำหรับคำตอบเชิงลึก                                                                                                                              |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | พูดหนึ่งครั้งเมื่อบริดจ์เรียลไทม์เชื่อมต่อ; ตั้งเป็น `""` เพื่อเข้าร่วมโดยไม่มีเสียง                                                                                                                                       |
| `realtime.agentId`                | `"main"`                                 | ID Agent ของ OpenClaw ที่ใช้สำหรับ `openclaw_agent_consult`                                                                                                                                                               |
| `voiceCall.enabled`               | `true`                                   | มอบหมายการโทร Twilio PSTN, DTMF และคำทักทายแนะนำให้แก่ Plugin Voice Call                                                                                                                                 |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | ระยะรอเริ่มต้นก่อนเล่นลำดับ DTMF ที่ได้มาจาก PIN ผ่าน Twilio                                                                                                                                               |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | ระยะหน่วงก่อนขอคำทักทายแนะนำแบบเรียลไทม์ หลังจาก Voice Call เริ่มช่วงการโทร Twilio                                                                                                                        |

`chrome.audioBridgeCommand` และ `chrome.audioBridgeHealthCommand` ช่วยให้บริดจ์ภายนอกควบคุมเส้นทางเสียงภายในเครื่องทั้งหมดแทน `chrome.audioInputCommand`/`chrome.audioOutputCommand`; ดูข้อจำกัดว่าโหมดใดใช้ได้ใน [หมายเหตุ](#notes)

มีการย้ายข้อมูล `openclaw doctor --fix` สำหรับโครงสร้าง `realtime.provider: "google"` แบบเก่า: ระบบจะย้ายเจตนานั้นไปยัง `realtime.voiceProvider: "google"` ร่วมกับ `realtime.transcriptionProvider: "openai"` เมื่อฟิลด์เหล่านั้นยังไม่ได้ตั้งค่า

### การกำหนดค่าทับแบบไม่บังคับ

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
    model: "gemini-3.1-flash-live-preview",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "พูดตามนี้ทุกคำ: ฉันอยู่นี่แล้ว",
    providers: {
      google: {
        speakerVoice: "Kore",
      },
    },
  },
}
```

ElevenLabs สำหรับทั้งการฟังและการพูดในโหมด Agent:

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

เสียง Meet แบบถาวรมาจาก `messages.tts.providers.elevenlabs.speakerVoiceId` การตอบกลับของ Agent ยังใช้คำสั่ง `[[tts:speakerVoiceId=... model=eleven_v3]]` แบบต่อคำตอบได้เมื่อเปิดใช้การกำหนดค่าโมเดล TTS ทับ แต่การกำหนดค่าคือค่าเริ่มต้นที่กำหนดผลลัพธ์แน่นอนสำหรับการประชุม เมื่อเข้าร่วม บันทึกจะแสดง `transcriptionProvider=elevenlabs` และการตอบกลับด้วยเสียงแต่ละครั้งจะบันทึก `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`

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

เมื่อใช้ `voiceCall.enabled: true` (ค่าเริ่มต้น) และการส่งผ่าน Twilio Voice Call จะส่งลำดับ DTMF ก่อนเปิดสตรีมสื่อแบบเรียลไทม์ จากนั้นใช้ข้อความแนะนำที่บันทึกไว้เป็นคำทักทายเริ่มต้นแบบเรียลไทม์ หากไม่ได้เปิดใช้ `voice-call` Google Meet ยังคงตรวจสอบและบันทึกแผนการโทรได้ แต่ไม่สามารถโทรผ่าน Twilio ได้

ปล่อย `voiceCall.gatewayUrl` ไว้โดยไม่ตั้งค่าเพื่อใช้รันไทม์ Gateway ที่เชื่อถือได้ภายในเครื่อง ซึ่งจะคงเอเจนต์ที่เรียกใช้ไว้ตลอดการเรียกทั้งหมด URL ของ Gateway ที่กำหนดค่าไว้ยังคงเป็นเป้าหมาย WebSocket ที่ระบุอย่างชัดเจนและไม่สามารถยืนยันที่มาของ Plugin ได้ การเข้าร่วมด้วยเอเจนต์ที่ไม่ใช่ค่าเริ่มต้นจะล้มเหลวแบบปิด แทนที่จะใช้เอเจนต์อื่นโดยไม่แจ้งให้ทราบ เรียกใช้ Google Meet และ Voice Call ในกระบวนการ Gateway เดียวกันเมื่อต้องใช้การกำหนดเส้นทางต่อเอเจนต์

## เครื่องมือ

เอเจนต์ใช้เครื่องมือ `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | วัตถุประสงค์                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `join`                  | เข้าร่วมผ่าน URL ของ Meet ที่ระบุอย่างชัดเจน                                                                         |
| `create`                | สร้างพื้นที่ (และเข้าร่วมโดยค่าเริ่มต้น) รองรับ `accessType`/`entryPointAccess`                    |
| `status`                | แสดงรายการเซสชันที่ใช้งานอยู่ หรือตรวจสอบเซสชันหนึ่งด้วย `sessionId`                                               |
| `setup_status`          | เรียกใช้การตรวจสอบเดียวกับ `googlemeet setup`                                                         |
| `resolve_space`         | แปลง URL/รหัส/`spaces/{id}` ผ่าน `spaces.get`                                                 |
| `preflight`             | ตรวจสอบ OAuth และข้อกำหนดเบื้องต้นสำหรับการแปลงข้อมูลการประชุม                                                 |
| `latest`                | ค้นหาระเบียนการประชุมล่าสุดของการประชุม                                                   |
| `calendar_events`       | แสดงตัวอย่างกิจกรรมใน Calendar ที่มีลิงก์ Meet                                                           |
| `artifacts`             | แสดงรายการระเบียนการประชุมและข้อมูลเมตาของผู้เข้าร่วม/การบันทึก/บทถอดเสียง/บันทึกอัจฉริยะ                  |
| `attendance`            | แสดงรายการผู้เข้าร่วมและเซสชันของผู้เข้าร่วม                                                        |
| `export`                | เขียนชุดอาร์ติแฟกต์/การเข้าร่วม/บทถอดเสียง/ไฟล์กำกับ ตั้งค่า `"dryRun": true` เพื่อสร้างเฉพาะไฟล์กำกับ |
| `recover_current_tab`   | โฟกัส/ตรวจสอบแท็บ Meet ที่มีอยู่โดยไม่เปิดแท็บใหม่                                      |
| `transcript`            | อ่านบทถอดเสียงคำบรรยายตามขอบเขตที่กำหนด `sinceIndex` จะอ่านต่อจาก `nextIndex` ก่อนหน้า           |
| `leave`                 | สิ้นสุดเซสชัน (Chrome คลิกปุ่ม Leave ปิดเฉพาะแท็บที่ตนเปิด ส่วน Twilio จะวางสาย)                  |
| `end_active_conference` | สิ้นสุดการประชุม Google Meet ที่ใช้งานอยู่สำหรับพื้นที่ซึ่งจัดการด้วย API                                    |
| `speak`                 | ให้เอเจนต์แบบเรียลไทม์พูดทันที โดยใช้ `sessionId` และ `message`                        |
| `test_speech`           | สร้าง/ใช้เซสชันเดิม เรียกวลีที่ทราบ และส่งคืนสถานะความพร้อมของ Chrome                              |
| `test_listen`           | สร้าง/ใช้เซสชันเดิมแบบสังเกตการณ์เท่านั้น และรอให้คำบรรยาย/บทถอดเสียงมีการเปลี่ยนแปลง                        |

`test_speech` จะบังคับใช้ `mode: "agent"` หรือ `"bidi"` เสมอ และจะล้มเหลวหากขอให้ทำงานใน `mode: "transcribe"` เนื่องจากเซสชันแบบสังเกตการณ์เท่านั้นไม่สามารถส่งเสียงพูดได้ ผลลัพธ์ `speechOutputVerified` จะอิงจากการที่จำนวนไบต์ของเอาต์พุตเสียงแบบเรียลไทม์เพิ่มขึ้นระหว่างการเรียกนั้น ดังนั้นเซสชันที่นำกลับมาใช้ซ้ำและมีเสียงเก่าอยู่แล้วจะไม่นับเป็นการตรวจสอบใหม่

สำหรับการรับส่งข้อมูลผ่าน Chrome นั้น `leave` จะเปิดแท็บที่ผู้ใช้เป็นเจ้าของและนำกลับมาใช้ซ้ำไว้หลังจากคลิกปุ่ม Leave ของ Meet ส่วนแท็บที่ OpenClaw เปิดจะถูกปิดหลังออกจากการประชุม

ใช้ `transport: "chrome"` เมื่อ Chrome ทำงานบนโฮสต์ Gateway และใช้ `transport: "chrome-node"` เมื่อทำงานบน Node ที่จับคู่แล้ว ในทั้งสองกรณี ผู้ให้บริการโมเดลและ `openclaw_agent_consult` จะทำงานบนโฮสต์ Gateway ดังนั้นข้อมูลประจำตัวของโมเดลจะอยู่ที่นั่น บันทึกโหมดเอเจนต์จะระบุผู้ให้บริการ/โมเดลการถอดเสียงที่แปลงค่าแล้วเมื่อบริดจ์เริ่มทำงาน และระบุผู้ให้บริการ/โมเดล/เสียง/รูปแบบเอาต์พุต/อัตราการสุ่มตัวอย่างของ TTS หลังการตอบที่สังเคราะห์แต่ละครั้ง ระบบยังยอมรับ `mode: "realtime"` แบบดิบเป็นนามแฝงเพื่อความเข้ากันได้แบบเดิมของ `mode: "agent"` แต่จะไม่แสดงใน enum `mode` ของเครื่องมืออีกต่อไป

`create` พร้อมห้องที่รองรับด้วย API และนโยบายการเข้าถึงที่ระบุอย่างชัดเจน:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

การสิ้นสุดการประชุมที่ใช้งานอยู่ของห้องที่ทราบ:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

การตรวจสอบโดยฟังก่อน ก่อนอ้างว่าการประชุมพร้อมใช้งาน:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

การพูดตามคำสั่ง:

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "พูดตามนี้ทุกคำ: ฉันอยู่ที่นี่และกำลังฟังอยู่"
}
```

`status` จะรวมสถานะความพร้อมของ Chrome เมื่อมีข้อมูล:

| ฟิลด์                                                                 | ความหมาย                                                                                                                |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | ดูเหมือนว่า Chrome อยู่ภายในการโทรของ Meet                                                                              |
| `micMuted`                                                            | สถานะไมโครโฟนของ Meet แบบพยายามให้ดีที่สุด                                                                                      |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | โปรไฟล์เบราว์เซอร์ต้องเข้าสู่ระบบด้วยตนเอง ต้องได้รับอนุญาตจากโฮสต์ Meet ต้องให้สิทธิ์ หรือซ่อมแซมการควบคุมเบราว์เซอร์ ก่อนที่การพูดจะทำงานได้ |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | ขณะนี้อนุญาตให้ Chrome ที่จัดการอยู่ส่งเสียงพูดหรือไม่ โดย `speechReady: false` หมายถึง OpenClaw ไม่ได้ส่งวลีแนะนำตัว/วลีทดสอบ   |
| `providerConnected` / `realtimeReady`                                 | สถานะบริดจ์เสียงแบบเรียลไทม์                                                                                            |
| `lastInputAt` / `lastOutputAt`                                        | เสียงล่าสุดที่รับจาก/ส่งไปยังบริดจ์                                                                                |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | มีการกำหนดเส้นทางเอาต์พุตสื่อของแท็บ Meet ไปยังอุปกรณ์ BlackHole ของบริดจ์อยู่หรือไม่                               |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | ละเว้นอินพุตลูปแบ็กขณะที่กำลังเล่นเสียงของผู้ช่วย                                                              |

## โหมดเอเจนต์และโหมดสองทิศทาง

| โหมด    | ผู้ตัดสินใจเลือกคำตอบ        | เส้นทางเอาต์พุตเสียง                     | ใช้เมื่อ                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | เอเจนต์ OpenClaw ที่กำหนดค่าไว้ | รันไทม์ TTS ปกติของ OpenClaw            | ต้องการลักษณะการทำงานแบบ "เอเจนต์ของฉันอยู่ในการประชุม"        |
| `bidi`  | โมเดลเสียงแบบเรียลไทม์      | การตอบกลับด้วยเสียงจากผู้ให้บริการเสียงแบบเรียลไทม์ | ต้องการวงรอบการสนทนาด้วยเสียงที่มีความหน่วงต่ำที่สุด |

โหมด `agent`: ผู้ให้บริการถอดเสียงแบบเรียลไทม์จะรับฟังเสียงการประชุม บทถอดเสียงสุดท้ายของผู้เข้าร่วมจะถูกส่งผ่านเอเจนต์ OpenClaw ที่กำหนดค่าไว้ และคำตอบจะถูกพูดผ่าน TTS ปกติของ OpenClaw ส่วนย่อยของบทถอดเสียงสุดท้ายที่อยู่ใกล้กันจะถูกรวมก่อนการปรึกษา เพื่อให้การพูดหนึ่งช่วงไม่สร้างคำตอบบางส่วนที่ล้าสมัยหลายรายการ อินพุตแบบเรียลไทม์จะถูกระงับขณะที่เสียงของผู้ช่วยในคิวยังคงเล่นอยู่ และเสียงสะท้อนของบทถอดเสียงล่าสุดที่คล้ายเสียงผู้ช่วยจะถูกละเว้นก่อนการปรึกษา เพื่อไม่ให้ลูปแบ็กของ BlackHole ทำให้เอเจนต์ตอบเสียงพูดของตนเอง

โหมด `bidi`: โมเดลเสียงแบบเรียลไทม์จะตอบโดยตรงและสามารถเรียก `openclaw_agent_consult` เพื่อใช้การให้เหตุผลที่ลึกขึ้น ข้อมูลปัจจุบัน หรือเครื่องมือปกติของ OpenClaw เครื่องมือปรึกษาจะเรียกเอเจนต์ OpenClaw ปกติเบื้องหลัง พร้อมบริบทบทถอดเสียงการประชุมล่าสุด และส่งคืนคำตอบแบบพูดที่กระชับ ในโหมด `agent` OpenClaw จะส่งคำตอบนั้นไปยัง TTS โดยตรง ส่วนในโหมด `bidi` โมเดลเสียงแบบเรียลไทม์สามารถพูดคำตอบนั้นกลับมาได้ โดยใช้กลไกการปรึกษาที่ใช้ร่วมกันแบบเดียวกับ Voice Call

โดยค่าเริ่มต้น การปรึกษาจะทำงานกับเอเจนต์ `main` ตั้งค่า `realtime.agentId` เพื่อชี้ช่องทาง Meet ไปยังพื้นที่ทำงานของเอเจนต์ ค่าเริ่มต้นของโมเดล นโยบายเครื่องมือ หน่วยความจำ และประวัติเซสชันโดยเฉพาะ การปรึกษาในโหมดเอเจนต์ใช้คีย์เซสชัน `agent:<id>:subagent:google-meet:<session>` แยกตามการประชุม เพื่อให้คำถามต่อเนื่องคงบริบทการประชุมไว้พร้อมสืบทอดนโยบายปกติของเอเจนต์ เมื่อเอเจนต์เรียก `google_meet` ในโหมดเอเจนต์ เซสชันผู้ให้คำปรึกษาจะแยกสาขาจากบทถอดเสียงปัจจุบันของผู้เรียก ก่อนตอบเสียงพูดของผู้เข้าร่วม เซสชัน Meet จะยังคงแยกต่างหาก เพื่อให้คำถามต่อเนื่องในการประชุมไม่แก้ไขบทถอดเสียงของผู้เรียกโดยตรง

`realtime.toolPolicy` ควบคุมการเรียกใช้การปรึกษา:

| นโยบาย           | ลักษณะการทำงาน                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | เปิดให้ใช้เครื่องมือปรึกษา จำกัดเอเจนต์ปกติให้ใช้เฉพาะ `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get` |
| `owner`          | เปิดให้ใช้เครื่องมือปรึกษา และอนุญาตให้เอเจนต์ปกติใช้นโยบายเครื่องมือตามปกติ                                                        |
| `none`           | ไม่เปิดให้โมเดลเสียงแบบเรียลไทม์ใช้เครื่องมือปรึกษา                                                                       |

คีย์เซสชันการปรึกษาจะมีขอบเขตแยกตามเซสชัน Meet ดังนั้นการเรียกปรึกษาต่อเนื่องจะใช้บริบทการปรึกษาก่อนหน้าอีกครั้งระหว่างการประชุมเดียวกัน

บังคับตรวจสอบความพร้อมด้วยเสียงหลังจาก Chrome เข้าร่วมเสร็จสมบูรณ์:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

การทดสอบเบื้องต้นแบบเข้าร่วมและพูดครบวงจร:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## รายการตรวจสอบการทดสอบจริง

ก่อนส่งมอบการประชุมให้เอเจนต์ที่ไม่มีผู้ดูแล:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

สถานะ Chrome-node ที่คาดหวัง:

- `googlemeet setup` เป็นสีเขียวทั้งหมด และรวม `chrome-node-connected` เมื่อ Chrome-node เป็นการรับส่งข้อมูลเริ่มต้นหรือมีการปักหมุด Node
- `nodes status` แสดงว่า Node ที่เลือกเชื่อมต่ออยู่ และประกาศทั้ง `googlemeet.chrome` และ `browser.proxy`
- แท็บ Meet เข้าร่วม และ `test-speech` ส่งคืนสถานะความพร้อมของ Chrome พร้อม `inCall: true`

สำหรับโฮสต์ Chrome ระยะไกล เช่น VM macOS บน Parallels การตรวจสอบที่ปลอดภัยและสั้นที่สุดหลังจากอัปเดต Gateway หรือ VM คือ:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

ขั้นตอนนี้พิสูจน์ว่าโหลด Plugin ของ Gateway แล้ว, Node ของ VM เชื่อมต่อด้วยโทเค็นปัจจุบัน และบริดจ์เสียง Meet พร้อมใช้งานก่อนที่เอเจนต์จะเปิดแท็บการประชุมจริง

สำหรับการทดสอบเบื้องต้นของ Twilio ให้ใช้การประชุมที่แสดงรายละเอียดการโทรเข้าทางโทรศัพท์:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

สถานะ Twilio ที่คาดไว้:

- `googlemeet setup` มีการตรวจสอบ `twilio-voice-call-plugin`, `twilio-voice-call-credentials` และ `twilio-voice-call-webhook` เป็นสีเขียว
- `voicecall` พร้อมใช้งานใน CLI หลังจากโหลด Gateway ใหม่
- เซสชันที่ส่งคืนมี `transport: "twilio"` และ `twilio.voiceCallId`
- `openclaw logs --follow` แสดงว่า DTMF TwiML ถูกให้บริการก่อน TwiML แบบเรียลไทม์ จากนั้นเป็นบริดจ์แบบเรียลไทม์ที่มีคำทักทายเริ่มต้นอยู่ในคิว
- `googlemeet leave <sessionId>` วางสายการโทรด้วยเสียงที่มอบหมาย

## การแก้ไขปัญหา

### เอเจนต์มองไม่เห็นเครื่องมือ Google Meet

ยืนยันว่าเปิดใช้ Plugin แล้วและโหลด Gateway ใหม่ เอเจนต์ที่กำลังทำงานจะเห็นเฉพาะเครื่องมือ Plugin ที่ลงทะเบียนโดยกระบวนการ Gateway ปัจจุบันเท่านั้น:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

บนโฮสต์ Gateway ที่ไม่ใช่ macOS นั้น `google_meet` จะยังคงมองเห็นได้ แต่การดำเนินการพูดตอบกลับผ่าน Chrome ภายในเครื่องจะถูกบล็อกก่อนถึงบริดจ์เสียง ใช้ `mode: "transcribe"`, การโทรเข้า Twilio หรือโฮสต์ `chrome-node` ที่ใช้ macOS แทนเส้นทางเอเจนต์ Chrome ภายในเครื่องซึ่งเป็นค่าเริ่มต้น

### ไม่มี Node ที่เชื่อมต่อและรองรับ Google Meet

บนโฮสต์ Node:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

บนโฮสต์ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node ต้องเชื่อมต่ออยู่และแสดงรายการ `googlemeet.chrome` พร้อมกับ `browser.proxy` และการกำหนดค่า Gateway ต้องอนุญาตทั้งสองรายการ:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

หาก `googlemeet setup` ไม่ผ่าน `chrome-node-connected` หรือบันทึก Gateway รายงาน `gateway token mismatch` ให้ติดตั้งใหม่หรือรีสตาร์ต Node ด้วยโทเค็น Gateway ปัจจุบัน:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

จากนั้นโหลดบริการ Node ใหม่และเรียกใช้อีกครั้ง:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### เบราว์เซอร์เปิดขึ้นแต่เอเจนต์เข้าร่วมไม่ได้

เรียกใช้ `googlemeet test-listen` สำหรับการเข้าร่วมแบบสังเกตการณ์เท่านั้น หรือ `googlemeet test-speech` สำหรับการเข้าร่วมแบบเรียลไทม์ จากนั้นตรวจสอบสถานะความพร้อมของ Chrome ที่ส่งคืน หากรายการใดรายงาน `manualActionRequired: true` ให้แสดง `manualActionMessage` แก่ผู้ดำเนินการและหยุดลองซ้ำจนกว่าการดำเนินการในเบราว์เซอร์จะเสร็จสมบูรณ์

การดำเนินการด้วยตนเองที่พบบ่อย: ลงชื่อเข้าใช้โปรไฟล์ Chrome; อนุญาตให้ผู้เข้าร่วมเข้าสู่การประชุมจากบัญชีโฮสต์ Meet; ให้สิทธิ์ไมโครโฟน/กล้องแก่ Chrome เมื่อพรอมต์ของระบบปรากฏขึ้น; ปิดหรือแก้ไขกล่องโต้ตอบสิทธิ์ Meet ที่ค้างอยู่

อย่ารายงานว่า "not signed in" เพียงเพราะ Meet ถามว่า "Do you want people to hear you in the meeting?"; นั่นคือหน้าคั่นสำหรับเลือกเสียงของ Meet OpenClaw คลิก **Use microphone** ผ่านระบบอัตโนมัติของเบราว์เซอร์เมื่อทำได้ และรอสถานะการประชุมจริงต่อไป สำหรับการใช้เบราว์เซอร์สำรองเพื่อสร้างการประชุมเท่านั้น ระบบอาจคลิก **Continue without microphone** แทน เนื่องจากการสร้าง URL ไม่จำเป็นต้องใช้เส้นทางเสียงแบบเรียลไทม์

### การสร้างการประชุมล้มเหลว

`googlemeet create` ใช้ Meet API `spaces.create` เมื่อกำหนดค่า OAuth แล้ว มิฉะนั้นจะใช้เบราว์เซอร์ Chrome ของ Node ที่ตรึงไว้ โปรดยืนยันว่า:

- **การสร้างผ่าน API**: มี `oauth.clientId` และ `oauth.refreshToken` (หรือตัวแปรสภาพแวดล้อม `OPENCLAW_GOOGLE_MEET_*` ที่ตรงกัน) และโทเค็นรีเฟรชถูกสร้างหลังจากเพิ่มการรองรับการสร้างแล้ว โทเค็นเก่าอาจไม่มี `meetings.space.created` ดังนั้นให้เรียกใช้ `openclaw googlemeet auth login --json` อีกครั้ง
- **การใช้เบราว์เซอร์สำรอง**: `defaultTransport: "chrome-node"` และ `chromeNode.node` ชี้ไปยัง Node ที่เชื่อมต่ออยู่ซึ่งมี `browser.proxy` และ `googlemeet.chrome`; โปรไฟล์ OpenClaw Chrome บน Node นั้นลงชื่อเข้าใช้แล้วและสามารถเปิด `https://meet.google.com/new` ได้
- **การลองใช้เบราว์เซอร์สำรองอีกครั้ง**: ใช้แท็บพรอมต์ `.../new` หรือบัญชี Google ที่มีอยู่ซ้ำก่อนเปิดแท็บใหม่ ให้ลองเรียกเครื่องมืออีกครั้งแทนการเปิดแท็บใหม่ด้วยตนเอง
- **การดำเนินการด้วยตนเอง**: หากเครื่องมือส่งคืน `manualActionRequired: true` ให้ใช้ `browser.nodeId`, `browser.targetId`, `browserUrl` และ `manualActionMessage` เพื่อแนะนำผู้ดำเนินการ อย่าลองซ้ำเป็นลูป
- **หน้าคั่นสำหรับเลือกเสียง**: หาก Meet แสดง "Do you want people to hear you in the meeting?" ให้เปิดแท็บนั้นไว้ OpenClaw ควรคลิก **Use microphone** หรือ (สำหรับการสร้างเท่านั้น) **Continue without microphone** และรอ URL ที่สร้างขึ้นต่อไป หากไม่สามารถทำได้ ข้อผิดพลาดควรกล่าวถึง `meet-audio-choice-required` ไม่ใช่ `google-login-required`

### เอเจนต์เข้าร่วมแล้วแต่ไม่พูด

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

ใช้ `mode: "agent"` สำหรับเส้นทาง STT -> เอเจนต์ OpenClaw -> TTS และใช้ `mode: "bidi"` สำหรับเส้นทางสำรองเสียงแบบเรียลไทม์โดยตรง `mode: "transcribe"` ตั้งใจไม่เริ่มบริดจ์พูดตอบกลับ สำหรับการแก้ไขจุดบกพร่องแบบสังเกตการณ์เท่านั้น ให้เรียกใช้ `openclaw googlemeet status --json <session-id>` หลังจากผู้เข้าร่วมพูด แล้วตรวจสอบ `captioning`, `transcriptLines`, `lastCaptionText` หาก `inCall` เป็น true แต่ `transcriptLines` ยังคงเป็น `0` อาจเป็นเพราะปิดใช้คำบรรยาย Meet, ยังไม่มีใครพูดตั้งแต่ติดตั้งตัวสังเกตการณ์, UI ของ Meet เปลี่ยนแปลง หรือคำบรรยายสดไม่พร้อมใช้งานสำหรับภาษา/บัญชีของการประชุม

`googlemeet test-speech` ตรวจสอบเส้นทางแบบเรียลไทม์เสมอและรายงานว่าพบไบต์เอาต์พุตของบริดจ์สำหรับการเรียกใช้นั้นหรือไม่ หาก `speechOutputVerified` เป็น false และ `speechOutputTimedOut` เป็น true ผู้ให้บริการแบบเรียลไทม์อาจยอมรับถ้อยคำแล้ว แต่ OpenClaw ไม่พบไบต์เอาต์พุตใหม่ที่ส่งถึงบริดจ์เสียง Chrome

โปรดตรวจสอบด้วยว่า: มีคีย์ผู้ให้บริการแบบเรียลไทม์ (`OPENAI_API_KEY` หรือ `GEMINI_API_KEY`) บนโฮสต์ Gateway; มองเห็น `BlackHole 2ch` บนโฮสต์ Chrome; มี `sox` อยู่ที่นั่น; ไมโครโฟน/ลำโพงของ Meet ถูกกำหนดเส้นทางผ่านเส้นทางเสียงเสมือน (`doctor` ควรแสดง `meet output routed: yes` สำหรับการเข้าร่วม Chrome ภายในเครื่องแบบเรียลไทม์)

`googlemeet doctor [session-id]` แสดงเซสชัน, Node, สถานะอยู่ในสาย, เหตุผลที่ต้องดำเนินการด้วยตนเอง, การเชื่อมต่อผู้ให้บริการแบบเรียลไทม์, `realtimeReady`, กิจกรรมอินพุต/เอาต์พุตเสียง, การประทับเวลาเสียงล่าสุด, ตัวนับไบต์ และ URL ของเบราว์เซอร์ ใช้ `googlemeet status [session-id] --json` สำหรับ JSON ดิบ และใช้ `googlemeet doctor --oauth` (เพิ่ม `--meeting` หรือ `--create-space`) เพื่อตรวจสอบการรีเฟรช OAuth โดยไม่เปิดเผยโทเค็น

หากเอเจนต์หมดเวลาและมีแท็บ Meet เปิดอยู่แล้ว ให้ตรวจสอบแท็บนั้นโดยไม่เปิดแท็บใหม่:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

การดำเนินการของเครื่องมือที่เทียบเท่าคือ `recover_current_tab`: ระบบจะโฟกัสและตรวจสอบแท็บ Meet ที่มีอยู่สำหรับวิธีการรับส่งที่เลือก (การควบคุมเบราว์เซอร์ภายในเครื่องสำหรับ `chrome`, Node ที่กำหนดค่าไว้สำหรับ `chrome-node`) โดยไม่เปิดแท็บหรือเซสชันใหม่ และรายงานสิ่งที่ขัดขวางอยู่ในปัจจุบัน (การเข้าสู่ระบบ, การอนุญาตให้เข้าร่วม, สิทธิ์, สถานะการเลือกเสียง) คำสั่ง CLI สื่อสารกับ Gateway ที่กำหนดค่าไว้ ซึ่งต้องกำลังทำงานอยู่ และ `chrome-node` ยังต้องให้ Node เชื่อมต่ออยู่ด้วย

### การตรวจสอบการตั้งค่า Twilio ล้มเหลว

`twilio-voice-call-plugin` ล้มเหลวเมื่อ `voice-call` ไม่ได้รับอนุญาตหรือไม่ได้เปิดใช้: เพิ่มรายการดังกล่าวใน `plugins.allow`, เปิดใช้ `plugins.entries.voice-call` และโหลด Gateway ใหม่

`twilio-voice-call-credentials` ล้มเหลวเมื่อแบ็กเอนด์ Twilio ไม่มี SID บัญชี, โทเค็นการตรวจสอบสิทธิ์ หรือหมายเลขผู้โทร:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` ล้มเหลวเมื่อ `voice-call` ไม่มีการเปิดเผย Webhook สู่สาธารณะ หรือ `publicUrl` ชี้ไปยังพื้นที่เครือข่ายลูปแบ็ก/ส่วนตัว อย่าใช้ `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` หรือ `fd00::/8` เป็น `publicUrl` เนื่องจากการเรียกกลับของผู้ให้บริการเครือข่ายไม่สามารถเข้าถึงปลายทางเหล่านั้นได้ ตั้งค่า `plugins.entries.voice-call.config.publicUrl` เป็น URL สาธารณะ หรือกำหนดค่าการเปิดเผยผ่านทันเนล/Tailscale:

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

สำหรับการพัฒนาภายในเครื่อง ให้ใช้ทันเนลหรือการเปิดเผยผ่าน Tailscale แทน URL ของโฮสต์ส่วนตัว:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // หรือ
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

รีสตาร์ตหรือโหลด Gateway ใหม่ จากนั้น:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

โดยค่าเริ่มต้น `voicecall smoke` ใช้ตรวจสอบความพร้อมเท่านั้น ทดลองทำงานกับหมายเลขที่ระบุโดยไม่ดำเนินการจริง:

```bash
openclaw voicecall smoke --to "+15555550123"
```

เพิ่ม `--yes` เฉพาะเมื่อต้องการโทรออกจริงโดยเจตนา:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### การโทร Twilio เริ่มขึ้นแต่ไม่เข้าสู่การประชุม

ยืนยันว่ากิจกรรม Meet แสดงรายละเอียดการโทรเข้าทางโทรศัพท์ และส่งหมายเลขโทรเข้าที่ถูกต้องพร้อม PIN หรือลำดับ DTMF ที่กำหนดเอง:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

ใช้ `w` นำหน้าหรือใช้จุลภาคใน `--dtmf-sequence` เพื่อหยุดชั่วคราวก่อนป้อน PIN

หากสร้างการโทรแล้ว แต่รายชื่อผู้เข้าร่วม Meet ไม่แสดงผู้เข้าร่วมที่โทรเข้า:

- `openclaw googlemeet doctor <session-id>`: ยืนยัน ID การโทร Twilio ที่มอบหมาย ว่า DTMF ถูกจัดคิวไว้หรือไม่ และมีการร้องขอคำทักทายเบื้องต้นหรือไม่
- `openclaw voicecall status --call-id <id>`: ยืนยันว่าการโทรยังทำงานอยู่
- `openclaw voicecall tail`: ยืนยันว่า Webhook ของ Twilio มาถึง Gateway
- `openclaw logs --follow`: มองหาลำดับ Twilio Meet ดังนี้: Google Meet มอบหมายการเข้าร่วม, Voice Call จัดเก็บและให้บริการ DTMF TwiML ก่อนเชื่อมต่อ, Voice Call ให้บริการ TwiML แบบเรียลไทม์สำหรับการโทร Twilio จากนั้น Google Meet ร้องขอเสียงพูดแนะนำด้วย `voicecall.speak`
- เรียกใช้ `openclaw googlemeet setup --transport twilio` อีกครั้ง การตรวจสอบการตั้งค่าที่เป็นสีเขียวเป็นข้อกำหนด แต่ไม่ได้พิสูจน์ว่าลำดับ PIN ของการประชุมถูกต้อง
- ยืนยันว่าหมายเลขโทรเข้าเป็นของคำเชิญ Meet และภูมิภาคเดียวกับ PIN
- เพิ่ม `voiceCall.dtmfDelayMs` จากค่าเริ่มต้น 12 วินาที หาก Meet รับสายช้าหรือบทถอดเสียงการโทรยังแสดงพรอมต์ PIN หลังจากส่ง DTMF ก่อนเชื่อมต่อแล้ว
- หากผู้เข้าร่วมเข้าร่วมแล้วแต่ไม่ได้ยินคำทักทาย ให้ตรวจสอบ `openclaw logs --follow` สำหรับคำขอ `voicecall.speak` หลัง DTMF และตรวจสอบการเล่น TTS ผ่านสตรีมสื่อหรือทางเลือกสำรอง `<Say>` ของ Twilio หากบทถอดเสียงยังแสดง "enter the meeting PIN" แสดงว่าฝั่งโทรศัพท์ยังไม่ได้เข้าร่วมห้อง Meet ดังนั้นผู้เข้าร่วมจะไม่ได้ยินเสียงพูด

หาก Webhook ไม่มาถึง ให้แก้ไขจุดบกพร่องของ Plugin Voice Call ก่อน ผู้ให้บริการต้องเข้าถึง `plugins.entries.voice-call.config.publicUrl` หรือทันเนลที่กำหนดค่าไว้ ดู[การแก้ไขปัญหาการโทรด้วยเสียง](/th/plugins/voice-call#troubleshooting)

## หมายเหตุ

API สื่ออย่างเป็นทางการของ Google Meet มุ่งเน้นการรับข้อมูล ดังนั้นการพูดเข้าสู่สายจึงยังต้องใช้เส้นทางของผู้เข้าร่วม Plugin นี้ทำให้ขอบเขตดังกล่าวชัดเจน: Chrome จัดการการเข้าร่วมผ่านเบราว์เซอร์และการกำหนดเส้นทางเสียงภายในเครื่อง ส่วน Twilio จัดการการเข้าร่วมด้วยการโทรเข้าทางโทรศัพท์

โหมดพูดตอบกลับของ Chrome ต้องใช้ `BlackHole 2ch` พร้อมกับอย่างใดอย่างหนึ่งต่อไปนี้:

- `chrome.audioInputCommand` ร่วมกับ `chrome.audioOutputCommand`: OpenClaw เป็นเจ้าของบริดจ์และส่งผ่านเสียงใน `chrome.audioFormat` ระหว่างคำสั่งเหล่านั้นกับผู้ให้บริการที่เลือก โหมด `agent` ใช้การถอดเสียงแบบเรียลไทม์ร่วมกับ TTS ปกติ ส่วนโหมด `bidi` ใช้ผู้ให้บริการเสียงแบบเรียลไทม์ เส้นทางเริ่มต้นคือ PCM16 ที่ 24 kHz พร้อม `chrome.audioBufferBytes: 4096`; G.711 mu-law ที่ 8 kHz ยังคงพร้อมใช้งานสำหรับคู่คำสั่งแบบเดิม
- `chrome.audioBridgeCommand`: คำสั่งบริดจ์ภายนอกเป็นเจ้าของเส้นทางเสียงภายในเครื่องทั้งหมด และต้องสิ้นสุดการทำงานหลังจากเริ่มต้นหรือตรวจสอบเดมอนของตน ใช้ได้เฉพาะกับ `bidi` เนื่องจากโหมด `agent` ต้องเข้าถึงคู่คำสั่งโดยตรงสำหรับ TTS

เมื่อใช้บริดจ์ Chrome แบบคู่คำสั่ง `chrome.bargeInInputCommand` สามารถรับฟังไมโครโฟนภายในเครื่องที่แยกต่างหากและหยุดเสียงที่ผู้ช่วยกำลังเล่นเมื่อมนุษย์เริ่มพูด ทำให้เสียงพูดของมนุษย์มีลำดับความสำคัญเหนือเอาต์พุตของผู้ช่วย แม้อินพุตลูปแบ็กร่วมของ BlackHole จะถูกระงับชั่วคราวระหว่างที่ผู้ช่วยเล่นเสียง เช่นเดียวกับ `chrome.audioInputCommand`/`chrome.audioOutputCommand` นี่คือคำสั่งภายในเครื่องที่ผู้ปฏิบัติงานกำหนดค่า: ใช้พาธคำสั่งหรือรายการอาร์กิวเมนต์ที่เชื่อถือได้อย่างชัดเจน และห้ามใช้สคริปต์จากตำแหน่งที่ไม่น่าเชื่อถือ

เพื่อให้ได้เสียงแบบสองทางที่ชัดเจน ให้กำหนดเส้นทางเอาต์พุตของ Meet และไมโครโฟนของ Meet ผ่านอุปกรณ์เสมือนที่แยกจากกันหรือกราฟอุปกรณ์เสมือนแบบ Loopback; อุปกรณ์ BlackHole ที่ใช้ร่วมกันเพียงเครื่องเดียวอาจสะท้อนเสียงของผู้เข้าร่วมคนอื่นกลับเข้าไปในการโทร

`googlemeet speak` เรียกใช้บริดจ์เสียงโต้ตอบที่ทำงานอยู่สำหรับเซสชัน Chrome; `googlemeet leave` จะหยุดบริดจ์ดังกล่าว (และสำหรับเซสชัน Twilio ที่มอบหมายผ่าน Voice Call จะวางสายการโทรเบื้องหลัง) ใช้ `googlemeet end-active-conference` เพื่อปิดการประชุม Google Meet ที่ทำงานอยู่สำหรับพื้นที่ซึ่งจัดการผ่าน API ด้วย

## ที่เกี่ยวข้อง

- [Plugin การโทรด้วยเสียง](/th/plugins/voice-call)
- [โหมดสนทนา](/th/nodes/talk)
- [การสร้าง Plugin](/th/plugins/building-plugins)
