---
read_when:
    - การตั้งค่าการรองรับ iMessage
    - การดีบักการส่ง/รับ iMessage
summary: รองรับ iMessage แบบเนทีฟผ่าน imsg (JSON-RPC ผ่าน stdio) พร้อมการดำเนินการผ่าน API ส่วนตัวสำหรับการตอบกลับ tapback เอฟเฟกต์ แบบสำรวจ ไฟล์แนบ และการจัดการกลุ่ม แนะนำสำหรับการตั้งค่า OpenClaw iMessage ใหม่เมื่อโฮสต์ตรงตามข้อกำหนด
title: iMessage
x-i18n:
    generated_at: "2026-07-19T07:02:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 215364b4a0424db3fccb27e29815f2a94c55ebe66d1eec21ed85e4b7947ea1ab
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
สำหรับการติดตั้งใช้งาน OpenClaw iMessage ตามปกติ ให้เรียกใช้ Gateway และ `imsg` บนโฮสต์ macOS Messages เครื่องเดียวกันที่ลงชื่อเข้าใช้แล้ว หาก Gateway ทำงานที่อื่น ให้กำหนด `channels.imessage.cliPath` ให้ชี้ไปยัง Wrapper SSH แบบโปร่งใสที่เรียกใช้ `imsg` บน Mac

**การกู้คืนขาเข้าเป็นไปโดยอัตโนมัติ** หลังจากรีสตาร์ตบริดจ์หรือ Gateway แล้ว iMessage จะเล่นซ้ำข้อความที่พลาดไปขณะระบบหยุดทำงาน และระงับ "backlog bomb" ที่ค้างอยู่ซึ่ง Apple อาจปล่อยออกมาหลังการกู้คืน Push พร้อมตัดรายการซ้ำเพื่อไม่ให้มีสิ่งใดถูกส่งต่อสองครั้ง ไม่ต้องเปิดใช้ด้วยการกำหนดค่า — ดู [การกู้คืนขาเข้าหลังจากรีสตาร์ตบริดจ์หรือ Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart)
</Note>

<Warning>
เลิกการรองรับ BlueBubbles แล้ว ให้ย้ายการกำหนดค่า `channels.bluebubbles` ไปยัง `channels.imessage`; OpenClaw รองรับ iMessage ผ่าน `imsg` เท่านั้น เริ่มจาก [การนำ BlueBubbles ออกและเส้นทาง imsg สำหรับ iMessage](/th/announcements/bluebubbles-imessage) สำหรับประกาศฉบับย่อ หรือ [การย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) สำหรับตารางการย้ายฉบับเต็ม
</Warning>

สถานะ: การผสานรวม CLI ภายนอกแบบเนทีฟ Gateway จะสร้างโปรเซส `imsg rpc` และสื่อสารด้วย JSON-RPC ผ่าน stdio — ไม่มีดีมอนหรือพอร์ตแยกต่างหาก ขอแนะนำอย่างยิ่งให้ใช้โหมด Private API เพื่อให้ช่องทาง iMessage ทำงานได้อย่างสมบูรณ์ การตอบกลับ tapback เอฟเฟกต์ แบบสำรวจ การตอบกลับไฟล์แนบ และการดำเนินการกับกลุ่มต้องใช้ `imsg launch` และการตรวจสอบ Private API ที่สำเร็จ

สำหรับการตั้งค่าในเครื่องโดยทั่วไป การตั้งค่า OpenClaw สามารถเสนอให้ติดตั้งหรืออัปเดต `imsg` ผ่าน Homebrew โดยให้ผู้ใช้ยืนยัน บน Mac ที่ลงชื่อเข้าใช้ Messages แล้ว การตั้งค่าด้วยตนเองและโครงสร้างที่ใช้ Wrapper SSH ยังคงอยู่ในการดูแลของผู้ปฏิบัติงาน: ติดตั้งหรืออัปเดต `imsg` ภายใต้บริบทผู้ใช้เดียวกับที่จะเรียกใช้ Gateway หรือ Wrapper

<CardGroup cols={3}>
  <Card title="การดำเนินการของ Private API" icon="wand-sparkles" href="#private-api-actions">
    การตอบกลับ tapback เอฟเฟกต์ แบบสำรวจ ไฟล์แนบ และการจัดการกลุ่ม
  </Card>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ iMessage ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="Mac ระยะไกล" icon="terminal" href="#remote-mac-over-ssh">
    ใช้ Wrapper SSH เมื่อ Gateway ไม่ได้ทำงานบน Mac ที่ใช้ Messages
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" icon="settings" href="/th/gateway/config-channels#imessage">
    ข้อมูลอ้างอิงฟิลด์ iMessage ฉบับเต็ม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="Mac ในเครื่อง (เส้นทางด่วน)">
    <Steps>
      <Step title="ติดตั้งและตรวจสอบ imsg">

```bash
brew install steipete/tap/imsg
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        เมื่อตัวช่วยตั้งค่าในเครื่องตรวจพบว่าคำสั่งเริ่มต้น `imsg` ขาดหายไป ระบบสามารถแจ้งให้ติดตั้ง `steipete/tap/imsg` ผ่าน Homebrew ได้ หากตรวจพบ `imsg` ที่จัดการโดย Homebrew ระบบสามารถแจ้งให้ติดตั้งใหม่หรืออัปเดตได้ Wrapper `cliPath` แบบกำหนดเองจะไม่ถูกแก้ไข

      </Step>

      <Step title="กำหนดค่า OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="เริ่ม Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="อนุมัติการจับคู่ DM ครั้งแรก (dmPolicy เริ่มต้น)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        คำขอจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac ระยะไกลผ่าน SSH">
    การตั้งค่าส่วนใหญ่ไม่จำเป็นต้องใช้ SSH ใช้โครงสร้างนี้เฉพาะเมื่อ Gateway ไม่สามารถทำงานบน Mac ที่ลงชื่อเข้าใช้ Messages ได้ OpenClaw ต้องการเพียง `cliPath` ที่เข้ากันได้กับ stdio ดังนั้นจึงสามารถกำหนด `cliPath` ให้ชี้ไปยังสคริปต์ Wrapper ที่เชื่อมต่อ SSH ไปยัง Mac ระยะไกลและเรียกใช้ `imsg`
    ติดตั้งและอัปเดต `imsg` บน Mac ระยะไกลเครื่องนั้น ไม่ใช่บนโฮสต์ Gateway:

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    การกำหนดค่าที่แนะนำเมื่อเปิดใช้ไฟล์แนบ:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: extra allowed attachment roots (merged with the default
      // /Users/*/Library/Messages/Attachments).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    หากไม่ได้กำหนด `remoteHost` OpenClaw จะพยายามตรวจหาโดยอัตโนมัติด้วยการแยกวิเคราะห์สคริปต์ Wrapper SSH
    `remoteHost` ต้องเป็น `host` หรือ `user@host` (ไม่มีช่องว่างหรือตัวเลือก SSH) ค่าที่ไม่ปลอดภัยจะถูกละเว้น
    OpenClaw ใช้การตรวจสอบคีย์โฮสต์อย่างเคร่งครัดสำหรับ SCP ดังนั้นคีย์ของโฮสต์รีเลย์ต้องมีอยู่ใน `~/.ssh/known_hosts` แล้ว
    ระบบจะตรวจสอบเส้นทางไฟล์แนบเทียบกับรากที่อนุญาต (`attachmentRoots` / `remoteAttachmentRoots`)

<Warning>
Wrapper `cliPath` หรือพร็อกซี SSH ใดก็ตามที่วางไว้หน้า `imsg` **ต้อง** ทำงานเสมือนท่อ stdio แบบโปร่งใสสำหรับ JSON-RPC ที่ทำงานยาวนาน OpenClaw แลกเปลี่ยนข้อความ JSON-RPC ขนาดเล็กที่แบ่งเฟรมด้วยขึ้นบรรทัดใหม่ผ่าน stdin/stdout ของ Wrapper ตลอดอายุการทำงานของช่องทาง:

- ส่งต่อแต่ละส่วน/บรรทัดของ stdin **ทันทีที่มีไบต์พร้อมใช้งาน** — อย่ารอ EOF
- ส่งต่อแต่ละส่วน/บรรทัดของ stdout อย่างทันท่วงทีในทิศทางย้อนกลับ
- รักษาอักขระขึ้นบรรทัดใหม่ไว้
- หลีกเลี่ยงการอ่านแบบบล็อกด้วยขนาดคงที่ (`read(4096)`, `cat | buffer`, `read` เริ่มต้นของเชลล์) ซึ่งอาจทำให้เฟรมขนาดเล็กไม่ได้รับการประมวลผล
- แยก stderr ออกจากสตรีม stdout ของ JSON-RPC

Wrapper ที่บัฟเฟอร์ stdin จนกว่าจะเต็มบล็อกขนาดใหญ่จะทำให้เกิดอาการคล้าย iMessage หยุดให้บริการ — `imsg rpc timeout (chats.list)` หรือช่องทางรีสตาร์ตซ้ำ ๆ — แม้ว่า `imsg rpc` จะทำงานปกติก็ตาม `ssh -T host imsg "$@"` (ด้านบน) ปลอดภัยเพราะส่งต่ออาร์กิวเมนต์ `cliPath` ของ OpenClaw เช่น `rpc` และ `--db` ส่วนไปป์ไลน์อย่าง `ssh host imsg | grep -v '^DEBUG'` **ไม่ปลอดภัย** — เครื่องมือที่บัฟเฟอร์เป็นบรรทัดยังคงพักเฟรมไว้ได้ หากจำเป็นต้องกรอง ให้ใช้ `stdbuf -oL -eL` ในทุกขั้นตอน
</Warning>

  </Tab>
</Tabs>

## ข้อกำหนดและสิทธิ์ (macOS)

- ต้องลงชื่อเข้าใช้ Messages บน Mac ที่เรียกใช้ `imsg`
- บริบทโปรเซสที่เรียกใช้ OpenClaw/`imsg` ต้องมีสิทธิ์ Full Disk Access (สำหรับเข้าถึงฐานข้อมูล Messages)
- ต้องมีสิทธิ์ Automation เพื่อส่งข้อความผ่าน Messages.app
- สำหรับการดำเนินการขั้นสูง (แสดงความรู้สึก / แก้ไข / ยกเลิกการส่ง / ตอบกลับในเธรด / เอฟเฟกต์ / แบบสำรวจ / การดำเนินการกับกลุ่ม) ต้องปิดใช้งาน System Integrity Protection — ดู [การเปิดใช้ Private API ของ imsg](#enabling-the-imsg-private-api) การส่งและรับข้อความกับสื่อพื้นฐานทำงานได้โดยไม่ต้องปิด

<Tip>
ระบบให้สิทธิ์แยกตามบริบทโปรเซส หาก Gateway ทำงานแบบไม่มีส่วนติดต่อผู้ใช้ (LaunchAgent/SSH) ให้เรียกใช้คำสั่งแบบโต้ตอบหนึ่งครั้งภายใต้บริบทเดียวกันเพื่อให้ระบบแสดงข้อความขอสิทธิ์:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="การส่งผ่าน Wrapper SSH ล้มเหลวด้วย AppleEvents -1743">
  การตั้งค่า SSH ระยะไกลอาจอ่านแชต ผ่าน `channels status --probe` และประมวลผลข้อความขาเข้าได้ แต่การส่งขาออกยังคงล้มเหลวด้วยข้อผิดพลาดการอนุญาต AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

ตรวจสอบฐานข้อมูล TCC ของผู้ใช้ Mac ที่ลงชื่อเข้าใช้ หรือ System Settings > Privacy & Security > Automation หากรายการ Automation ถูกบันทึกไว้สำหรับ `/usr/libexec/sshd-keygen-wrapper` แทนโปรเซส `imsg` หรือเชลล์ในเครื่อง macOS อาจไม่แสดงสวิตช์ Messages ที่ใช้งานได้สำหรับไคลเอนต์ฝั่งเซิร์ฟเวอร์ SSH นั้น:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

ในสถานะนี้ การทำ `tccutil reset AppleEvents` ซ้ำหรือเรียกใช้ `imsg send` อีกครั้งผ่าน Wrapper SSH เดิมอาจยังคงล้มเหลว เนื่องจากบริบทโปรเซสที่ต้องใช้ Messages Automation คือ Wrapper SSH ไม่ใช่แอปที่ UI สามารถให้สิทธิ์ได้

ให้ใช้บริบทโปรเซส `imsg` ที่รองรับอย่างใดอย่างหนึ่งแทน:

- เรียกใช้ Gateway หรืออย่างน้อยบริดจ์ `imsg` ในเซสชันภายในเครื่องของผู้ใช้ Messages ที่เข้าสู่ระบบอยู่
- เริ่ม Gateway ด้วย LaunchAgent สำหรับผู้ใช้นั้น หลังจากให้สิทธิ์ Full Disk Access และ Automation จากเซสชันเดียวกัน
- หากยังคงใช้โครงสร้าง SSH แบบผู้ใช้สองราย ให้ตรวจสอบว่าการส่งขาออกจริงด้วย `imsg send` สำเร็จผ่าน Wrapper ที่ใช้จริงก่อนเปิดใช้ช่องทาง หากไม่สามารถให้สิทธิ์ Automation ได้ ให้กำหนดค่าใหม่เป็นการตั้งค่า `imsg` แบบผู้ใช้รายเดียว แทนการพึ่งพา Wrapper SSH เพื่อส่งข้อความ

</Accordion>

## การเปิดใช้ Private API ของ imsg

`imsg` มีโหมดการทำงานสองโหมด สำหรับ OpenClaw ขอแนะนำให้ตั้งค่าเป็นโหมด Private API เนื่องจากทำให้ช่องทางรองรับการดำเนินการแบบเนทีฟของ iMessage ที่ผู้ใช้คาดหวัง โหมดพื้นฐานยังคงมีประโยชน์สำหรับการติดตั้งที่มีความเสี่ยงต่ำ การตรวจสอบเบื้องต้น หรือโฮสต์ที่ไม่สามารถปิดใช้ SIP ได้

- **โหมดพื้นฐาน** (ค่าเริ่มต้น ไม่ต้องเปลี่ยนแปลง SIP): ข้อความและสื่อขาออกผ่าน `send` การเฝ้าดู/ประวัติขาเข้า และรายการแชต นี่คือความสามารถที่พร้อมใช้งานทันทีจาก `brew install steipete/tap/imsg` ที่ติดตั้งใหม่ ร่วมกับสิทธิ์มาตรฐานของ macOS ข้างต้น
- **โหมด Private API**: `imsg` จะแทรก dylib ตัวช่วยลงใน `Messages.app` เพื่อเรียกใช้ฟังก์ชันภายในของ `IMCore` ซึ่งจะปลดล็อก `react`, `edit`, `unsend`, `reply` (แบบเธรด), `sendWithEffect`, `poll` และ `poll-vote` (แบบสำรวจเนทีฟของ Messages), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` รวมถึงตัวบ่งชี้การพิมพ์และใบตอบรับการอ่าน

พื้นผิวการดำเนินการที่แนะนำในหน้านี้ต้องใช้โหมด Private API README ของ `imsg` ระบุข้อกำหนดไว้อย่างชัดเจน:

> ฟีเจอร์ขั้นสูง เช่น `read`, `typing`, `launch`, การส่งเนื้อหาแบบสมบูรณ์ที่มีบริดจ์รองรับ การเปลี่ยนแปลงข้อความ และการจัดการแชต เป็นแบบเลือกรับ ต้องปิดใช้งาน SIP และแทรก dylib ตัวช่วยลงใน `Messages.app` โดย `imsg launch` จะปฏิเสธการแทรกเมื่อ SIP เปิดใช้งานอยู่

เทคนิคการแทรกตัวช่วยใช้ dylib ของ `imsg` เองเพื่อเข้าถึง Private API ของ Messages ไม่มีเซิร์ฟเวอร์บุคคลที่สามหรือรันไทม์ BlueBubbles ในเส้นทาง iMessage ของ OpenClaw

<Warning>
**การปิดใช้ SIP มีผลแลกเปลี่ยนด้านความปลอดภัยจริง** SIP เป็นหนึ่งในกลไกป้องกันหลักของ macOS ที่ช่วยป้องกันการเรียกใช้โค้ดระบบที่ถูกดัดแปลง การปิดใช้งานทั้งระบบจะเพิ่มพื้นผิวการโจมตีและผลข้างเคียงอื่น ๆ ที่สำคัญคือ **การปิดใช้ SIP บน Mac ที่ใช้ Apple Silicon จะปิดความสามารถในการติดตั้งและเรียกใช้แอป iOS บน Mac ด้วย**

ควรมองว่านี่เป็นตัวเลือกด้านการปฏิบัติงานที่ต้องพิจารณาอย่างรอบคอบ โดยเฉพาะบน Mac ส่วนตัวเครื่องหลัก สำหรับ OpenClaw iMessage ระดับใช้งานจริง ควรใช้ Mac โดยเฉพาะหรือผู้ใช้บอต macOS ที่ยอมรับการเปิดใช้บริดจ์ได้ หากแบบจำลองภัยคุกคามไม่สามารถยอมรับการปิด SIP บนอุปกรณ์ใด ๆ ได้ iMessage ที่ให้มาพร้อมระบบจะจำกัดอยู่ที่โหมดพื้นฐาน — ส่งและรับเฉพาะข้อความกับสื่อเท่านั้น ไม่มีการแสดงความรู้สึก / แก้ไข / ยกเลิกการส่ง / เอฟเฟกต์ / การดำเนินการกับกลุ่ม
</Warning>

### การตั้งค่า

1. **ติดตั้ง (หรืออัปเกรด) `imsg`** บน Mac ที่เรียกใช้ Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   เอาต์พุต `imsg status --json` รายงาน `bridge_version`, `rpc_methods` และ `selectors` แยกตามเมธอด เพื่อให้ตรวจสอบได้ว่าบิลด์ปัจจุบันรองรับอะไรบ้างก่อนเริ่มใช้งาน

2. **ปิดใช้งาน System Integrity Protection และ (บน macOS รุ่นใหม่) Library Validation** การแทรก dylib ตัวช่วยที่ไม่ใช่ของ Apple เข้าไปใน `Messages.app` ที่ลงนามโดย Apple จำเป็นต้องปิด SIP **และ** ผ่อนปรนการตรวจสอบไลบรารี ขั้นตอน SIP ในโหมด Recovery จะแตกต่างกันตามเวอร์ชันของ macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** ปิดใช้งาน Library Validation ผ่าน Terminal รีบูตเข้าสู่ Recovery Mode เรียกใช้ `csrutil disable` แล้วรีสตาร์ต
   - **macOS 11+ (Big Sur และใหม่กว่า), Intel:** เข้า Recovery Mode (หรือ Internet Recovery) เรียกใช้ `csrutil disable` แล้วรีสตาร์ต
   - **macOS 11+, Apple Silicon:** ใช้ลำดับการเริ่มต้นระบบด้วยปุ่มเปิด/ปิดเพื่อเข้าสู่ Recovery; บน macOS เวอร์ชันล่าสุด ให้กดปุ่ม **Left Shift** ค้างไว้ขณะคลิก Continue จากนั้นเรียกใช้ `csrutil disable` การตั้งค่าเครื่องเสมือนใช้ขั้นตอนแยกต่างหาก ดังนั้นให้สร้างสแนปช็อต VM ก่อน

   **บน macOS 11 และใหม่กว่า การใช้ `csrutil disable` เพียงอย่างเดียวมักไม่เพียงพอ** Apple ยังคงบังคับใช้การตรวจสอบไลบรารีกับ `Messages.app` ในฐานะไบนารีของแพลตฟอร์ม ดังนั้นตัวช่วยที่ลงนามแบบ adhoc จะถูกปฏิเสธ (`Library Validation failed: ... platform binary, but mapped file is not`) แม้จะปิด SIP แล้ว หลังจากปิดใช้งาน SIP ให้ปิดใช้งานการตรวจสอบไลบรารีด้วยแล้วรีบูต:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), ตรวจสอบแล้วบน 26.5.1:** การปิด SIP **ร่วมกับ** คำสั่ง `DisableLibraryValidation` ข้างต้นเพียงพอสำหรับการแทรกตัวช่วยในเวอร์ชัน 26.0 ถึง 26.5.x **ไม่จำเป็นต้องใช้ boot-args** plist เป็นปัจจัยชี้ขาดและเป็นขั้นตอนที่มักขาดหายไปมากที่สุดเมื่อการแทรกล้มเหลวบน Tahoe:
   - **เมื่อมี plist:** `imsg launch` จะแทรกสำเร็จและ `imsg status` จะรายงาน `advanced_features: true`
   - **เมื่อไม่มี plist (แม้จะปิด SIP แล้ว):** `imsg launch` จะล้มเหลวพร้อม `Failed to launch: Timeout waiting for Messages.app to initialize` AMFI ปฏิเสธตัวช่วย adhoc ขณะโหลด ทำให้บริดจ์ไม่พร้อมทำงานและการเปิดใช้หมดเวลา การหมดเวลานี้เป็นอาการที่คนส่วนใหญ่พบบน Tahoe; วิธีแก้คือใช้ plist ข้างต้น ไม่ใช่มาตรการที่รุนแรงกว่านั้น

   หากการแทรก `imsg launch` หรือ `selectors` บางรายการเริ่มส่งคืนค่า false หลังอัปเกรด macOS สาเหตุตามปกติคือเกตนี้ ตรวจสอบสถานะ SIP และการตรวจสอบไลบรารีก่อนสรุปว่าขั้นตอน SIP ล้มเหลว หากการตั้งค่าเหล่านั้นถูกต้องแต่บริดจ์ยังแทรกไม่ได้ ให้รวบรวม `imsg status --json` พร้อมเอาต์พุตของ `imsg launch` และรายงานไปยังโครงการ `imsg` แทนการลดความเข้มงวดของการควบคุมความปลอดภัยทั่วทั้งระบบเพิ่มเติม

3. **แทรกตัวช่วย** เมื่อปิดใช้งาน SIP และลงชื่อเข้าใช้ Messages.app แล้ว:

   ```bash
   imsg launch
   ```

   `imsg launch` จะปฏิเสธการแทรกหาก SIP ยังเปิดใช้งานอยู่ ดังนั้นขั้นตอนนี้จึงใช้ยืนยันได้ด้วยว่าขั้นตอนที่ 2 สำเร็จ

4. **ตรวจสอบบริดจ์จาก OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   รายการ iMessage ควรรายงาน `works` และ `imsg status --json | jq '{rpc_methods, selectors}'` ควรแสดงความสามารถที่บิลด์ macOS ของคุณรองรับ การสร้างโพลต้องใช้ `selectors.pollPayloadMessage`; การลงคะแนนต้องใช้ทั้ง `selectors.pollVoteMessage` และเมธอด RPC `poll.vote` Plugin ของ OpenClaw จะประกาศเฉพาะการดำเนินการที่โพรบในแคชรองรับ ส่วนแคชว่างจะยังคงมองในแง่ดีและทำการโพรบเมื่อส่งครั้งแรก

หาก `openclaw channels status --probe` รายงานแชนเนลเป็น `works` แต่การดำเนินการบางอย่างแสดงข้อผิดพลาด "iMessage `<action>` requires the imsg private API bridge" ขณะส่ง ให้เรียกใช้ `imsg launch` อีกครั้ง — ตัวช่วยอาจหลุดออกได้ (Messages.app รีสตาร์ต, อัปเดตระบบปฏิบัติการ ฯลฯ) และสถานะ `available: true` ในแคชจะยังคงประกาศการดำเนินการจนกว่าการโพรบครั้งถัดไปจะรีเฟรช

### เมื่อยังคงเปิดใช้ SIP

หากการปิด SIP ไม่เป็นที่ยอมรับสำหรับโมเดลภัยคุกคามของคุณ:

- `imsg` จะถอยกลับไปใช้โหมดพื้นฐาน — ส่งข้อความ + สื่อ + รับเท่านั้น
- Plugin ของ OpenClaw ยังคงประกาศการส่งข้อความ/สื่อและการติดตามขาเข้า; โดยซ่อน `react`, `edit`, `unsend`, `reply`, `sendWithEffect` และการดำเนินการแบบกลุ่มออกจากพื้นผิวการดำเนินการ (ตามเกตความสามารถรายเมธอด)
- คุณสามารถใช้ Mac ที่ไม่ใช่ Apple Silicon แยกต่างหาก (หรือ Mac สำหรับบอตโดยเฉพาะ) โดยปิด SIP สำหรับเวิร์กโหลด iMessage ขณะที่ยังเปิด SIP บนอุปกรณ์หลัก โปรดดู [ผู้ใช้ macOS สำหรับบอตโดยเฉพาะ (ข้อมูลประจำตัว iMessage แยกต่างหาก)](#deployment-patterns) ด้านล่าง

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.imessage.dmPolicy` ควบคุมข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist` (ต้องมีรายการ `allowFrom` อย่างน้อยหนึ่งรายการ)
    - `open` (กำหนดให้ `allowFrom` ต้องมี `"*"`)
    - `disabled`

    ฟิลด์รายการอนุญาต: `channels.imessage.allowFrom`

    รายการในรายการอนุญาตต้องระบุผู้ส่ง: แฮนเดิลหรือกลุ่มการเข้าถึงของผู้ส่งแบบคงที่ (`accessGroup:<name>`) ใช้ `channels.imessage.groupAllowFrom` สำหรับเป้าหมายแชต เช่น `chat_id:*`, `chat_guid:*` หรือ `chat_identifier:*`; ใช้ `channels.imessage.groups` สำหรับคีย์รีจิสทรี `chat_id` แบบตัวเลข

  </Tab>

  <Tab title="นโยบายกลุ่ม + การกล่าวถึง">
    `channels.imessage.groupPolicy` ควบคุมการจัดการกลุ่ม:

    - `allowlist` (ค่าเริ่มต้น)
    - `open`
    - `disabled`

    รายการอนุญาตผู้ส่งของกลุ่ม: `channels.imessage.groupAllowFrom`

    รายการ `groupAllowFrom` สามารถอ้างอิงกลุ่มการเข้าถึงของผู้ส่งแบบคงที่ (`accessGroup:<name>`) ได้เช่นกัน

    การถอยกลับขณะรันไทม์: หากไม่ได้ตั้งค่า `groupAllowFrom` การตรวจสอบผู้ส่งในกลุ่ม iMessage จะใช้ `allowFrom`; ให้ตั้งค่า `groupAllowFrom` เมื่อต้องการให้การอนุญาต DM และกลุ่มแตกต่างกัน `groupAllowFrom: []` ที่กำหนดเป็นค่าว่างอย่างชัดเจนจะไม่ถอยกลับ — แต่จะบล็อกผู้ส่งในกลุ่มทั้งหมดภายใต้ `allowlist`
    หมายเหตุเกี่ยวกับรันไทม์: หากไม่มี `channels.imessage` อยู่เลย รันไทม์จะถอยกลับไปใช้ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` แล้วก็ตาม)

    <Warning>
    การกำหนดเส้นทางกลุ่มภายใต้ `groupPolicy: "allowlist"` ใช้เกต **สอง** ชั้นต่อเนื่องกัน:

    1. **รายการอนุญาตผู้ส่ง** (`channels.imessage.groupAllowFrom`) — แฮนเดิล, `accessGroup:<name>`, `chat_guid`, `chat_identifier` หรือ `chat_id` รายการที่มีผลเป็นค่าว่าง (ไม่มี `groupAllowFrom` และไม่มีการถอยกลับไปใช้ `allowFrom`) จะบล็อกผู้ส่งในกลุ่มทุกคน
    2. **รีจิสทรีกลุ่ม** (`channels.imessage.groups`) — บังคับใช้เมื่อแมปมีรายการ: แชตต้องตรงกับรายการ `chat_id` ที่ระบุอย่างชัดเจน หรือไวลด์การ์ด `groups: { "*": { ... } }` เมื่อ `groups` ว่างเปล่าหรือไม่มีอยู่ การอนุญาตจะตัดสินด้วยรายการอนุญาตผู้ส่งเพียงอย่างเดียว

    หากไม่ได้กำหนดรายการอนุญาตผู้ส่งในกลุ่มที่มีผล ข้อความกลุ่มทั้งหมดจะถูกทิ้งก่อนถึงเกตรีจิสทรี แต่ละเกตมีสัญญาณระดับ `warn` ของตนเองที่ระดับบันทึกเริ่มต้น และแต่ละรายการจะระบุวิธีแก้ต่างกัน:

    - หนึ่งครั้งต่อบัญชีเมื่อเริ่มต้นระบบ เมื่อรายการอนุญาตผู้ส่งในกลุ่มที่มีผลว่างเปล่า: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — แก้ไขโดยตั้งค่า `channels.imessage.groupAllowFrom` (หรือ `allowFrom`); การเพิ่มเพียงรายการ `groups` จะยังทำให้เกต 1 บล็อกผู้ส่งทุกคน
    - หนึ่งครั้งต่อ `chat_id` ขณะรันไทม์ เมื่อผู้ส่งผ่านเกต 1 แต่ไม่มีแชตในรีจิสทรี `groups` ที่มีข้อมูล: `imessage: dropping group message from chat_id=<id> ...` — แก้ไขโดยเพิ่ม `chat_id` นั้น (หรือ `"*"`) ภายใต้ `channels.imessage.groups`

    DM ไม่ได้รับผลกระทบ — ใช้เส้นทางโค้ดอื่น

    การกำหนดค่าที่แนะนำสำหรับโฟลว์กลุ่มภายใต้ `groupPolicy: "allowlist"`:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    `groupAllowFrom` เพียงอย่างเดียวจะอนุญาตผู้ส่งเหล่านั้นในทุกกลุ่ม; เพิ่มบล็อก `groups` เพื่อจำกัดว่าอนุญาตแชตใดบ้าง (และตั้งค่าตัวเลือกเฉพาะแชต เช่น `requireMention`)
    </Warning>

    เกตการกล่าวถึงสำหรับกลุ่ม:

    - iMessage ไม่มีเมทาดาทาการกล่าวถึงโดยตรง
    - การตรวจจับการกล่าวถึงใช้รูปแบบนิพจน์ทั่วไป (`agents.list[].groupChat.mentionPatterns`, ถอยกลับไปใช้ `messages.groupChat.mentionPatterns`)
    - หากไม่มีรูปแบบที่กำหนดไว้ จะไม่สามารถบังคับใช้เกตการกล่าวถึงได้
    - คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตจะข้ามเกตการกล่าวถึง

    `systemPrompt` รายกลุ่ม:

    แต่ละรายการภายใต้ `channels.imessage.groups.*` รับสตริง `systemPrompt` ที่เป็นตัวเลือกได้ ซึ่งจะถูกแทรกลงในพรอมต์ระบบของเอเจนต์ในทุกเทิร์นที่จัดการข้อความในกลุ่มนั้น การแก้ค่าจะสอดคล้องกับ `channels.whatsapp.groups`:

    1. **พรอมต์ระบบเฉพาะกลุ่ม** (`groups["<chat_id>"].systemPrompt`): ใช้เมื่อมีรายการของกลุ่มนั้นอยู่ในแมป **และ** มีการกำหนดคีย์ `systemPrompt` หาก `systemPrompt` เป็นสตริงว่าง (`""`) ไวลด์การ์ดจะถูกระงับและจะไม่มีการใช้พรอมต์ระบบกับกลุ่มนั้น
    2. **พรอมต์ระบบไวลด์การ์ดของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อไม่มีรายการของกลุ่มนั้นอยู่ในแมปเลย หรือเมื่อมีรายการแต่ไม่ได้กำหนดคีย์ `systemPrompt`

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "ใช้การสะกดแบบอังกฤษ" },
            "8421": {
              requireMention: true,
              systemPrompt: "นี่คือแชตเวรพร้อมรับสาย ให้ตอบไม่เกิน 3 ประโยค",
            },
            "9907": {
              // ระงับอย่างชัดเจน: ไวลด์การ์ด "ใช้การสะกดแบบอังกฤษ" จะไม่ถูกนำมาใช้ที่นี่
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    พรอมต์รายกลุ่มใช้กับข้อความกลุ่มเท่านั้น — ข้อความโดยตรงไม่ได้รับผลกระทบ

  </Tab>

  <Tab title="เซสชันและการตอบกลับแบบกำหนดผลลัพธ์แน่นอน">
    - DM ใช้การกำหนดเส้นทางโดยตรง; กลุ่มใช้การกำหนดเส้นทางกลุ่ม
    - เมื่อใช้ `session.dmScope=main` เริ่มต้น DM ของ iMessage จะถูกรวมเข้าในเซสชันหลักของเอเจนต์
    - เซสชันกลุ่มจะแยกออกจากกัน (`agent:<agentId>:imessage:group:<chat_id>`)
    - การตอบกลับจะถูกกำหนดเส้นทางกลับไปยัง iMessage โดยใช้เมทาดาทาแชนเนล/เป้าหมายต้นทาง

    ลักษณะการทำงานของเธรดที่คล้ายกลุ่ม:

    เธรด iMessage ที่มีผู้เข้าร่วมหลายคนบางรายการอาจเข้ามาพร้อม `is_group=false`
    หากมีการกำหนด `chat_id` นั้นไว้อย่างชัดเจนภายใต้ `channels.imessage.groups` OpenClaw จะถือว่าเป็นทราฟฟิกกลุ่ม (เกตกลุ่ม + การแยกเซสชันกลุ่ม)

  </Tab>
</Tabs>

## การผูกการสนทนา ACP

แชต iMessage สามารถผูกกับเซสชัน ACP ได้

ขั้นตอนด่วนสำหรับผู้ปฏิบัติงาน:

- เรียกใช้ `/acp spawn codex --bind here` ภายใน DM หรือแชตกลุ่มที่อนุญาต
- ข้อความในอนาคตภายในการสนทนา iMessage เดียวกันนั้นจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่สร้างขึ้น
- `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP ที่ผูกอยู่เดิมโดยไม่เปลี่ยนเซสชัน
- `/acp close` จะปิดเซสชัน ACP และนำการผูกออก

การผูกแบบถาวรที่กำหนดค่าไว้ใช้รายการ `bindings[]` ระดับบนสุดร่วมกับ `type: "acp"` และ `match.channel: "imessage"`

`match.peer.id` สามารถใช้:

- แฮนเดิล DM ที่ปรับให้อยู่ในรูปแบบมาตรฐาน เช่น `+15555550123` หรือ `user@example.com`
- `chat_id:<id>` (แนะนำสำหรับการผูกกลุ่มที่เสถียร)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

ตัวอย่าง:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

โปรดดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับลักษณะการผูก ACP ที่ใช้ร่วมกัน

## รูปแบบการติดตั้งใช้งาน

<AccordionGroup>
  <Accordion title="ผู้ใช้ macOS สำหรับบอตโดยเฉพาะ (ข้อมูลประจำตัว iMessage แยกต่างหาก)">
    ใช้ Apple ID และผู้ใช้ macOS โดยเฉพาะ เพื่อแยกทราฟฟิกของบอตออกจากโปรไฟล์ Messages ส่วนตัว

    ขั้นตอนทั่วไป:

    1. สร้าง/ลงชื่อเข้าใช้ผู้ใช้ macOS เฉพาะ
    2. ลงชื่อเข้าใช้ Messages ด้วย Apple ID ของบอตในผู้ใช้นั้น
    3. ติดตั้ง `imsg` ในผู้ใช้นั้น
    4. สร้างตัวห่อหุ้ม SSH เพื่อให้ OpenClaw เรียกใช้ `imsg` ในบริบทของผู้ใช้นั้นได้
    5. กำหนดให้ `channels.imessage.accounts.<id>.cliPath` และ `.dbPath` ชี้ไปยังโปรไฟล์ผู้ใช้นั้น

    การเรียกใช้ครั้งแรกอาจต้องให้สิทธิ์ผ่าน GUI (Automation + Full Disk Access) ในเซสชันของผู้ใช้บอตนั้น

  </Accordion>

  <Accordion title="Mac ระยะไกลผ่าน Tailscale (ตัวอย่าง)">
    โทโพโลยีทั่วไป:

    - gateway ทำงานบน Linux/VM
    - iMessage + `imsg` ทำงานบน Mac ใน tailnet ของคุณ
    - ตัวห่อหุ้ม `cliPath` ใช้ SSH เพื่อเรียกใช้ `imsg`
    - `remoteHost` เปิดใช้การดึงไฟล์แนบผ่าน SCP

    ตัวอย่าง:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    ใช้คีย์ SSH เพื่อให้ทั้ง SSH และ SCP ทำงานแบบไม่ต้องโต้ตอบ
    ตรวจสอบให้แน่ใจก่อนว่าเชื่อถือคีย์โฮสต์แล้ว (เช่น `ssh bot@mac-mini.tailnet-1234.ts.net`) เพื่อให้ `known_hosts` มีข้อมูล

  </Accordion>

  <Accordion title="รูปแบบหลายบัญชี">
    iMessage รองรับการกำหนดค่ารายบัญชีภายใต้ `channels.imessage.accounts`

    แต่ละบัญชีสามารถแทนที่ฟิลด์ต่าง ๆ เช่น `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, การตั้งค่าประวัติ และรายการอนุญาตของรากไฟล์แนบ

  </Accordion>

  <Accordion title="ประวัติข้อความโดยตรง">
    ตั้งค่า `channels.imessage.dmHistoryLimit` เพื่อเติมประวัติ `imsg` ที่ถอดรหัสแล้วล่าสุดของการสนทนานั้นให้กับเซสชันข้อความโดยตรงใหม่ ใช้ `channels.imessage.dms["<sender>"].historyLimit` เพื่อแทนค่ารายผู้ส่ง รวมถึง `0` เพื่อปิดใช้ประวัติสำหรับผู้ส่งรายหนึ่ง

    ระบบจะดึงประวัติ DM ของ iMessage จาก `imsg` เมื่อต้องการ การไม่ตั้งค่า `dmHistoryLimit` จะปิดใช้การเติมประวัติ DM ส่วนกลาง แต่ค่า `channels.imessage.dms["<sender>"].historyLimit` รายผู้ส่งที่เป็นบวกยังคงเปิดใช้การเติมประวัติสำหรับผู้ส่งรายนั้น

  </Accordion>
</AccordionGroup>

## สื่อ การแบ่งส่วน และปลายทางการส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบและสื่อ">
    - การรับไฟล์แนบขาเข้า **ปิดอยู่โดยค่าเริ่มต้น** — ตั้งค่า `channels.imessage.includeAttachments: true` เพื่อส่งต่อรูปภาพ บันทึกเสียง วิดีโอ และไฟล์แนบอื่น ๆ ไปยังเอเจนต์ เมื่อปิดใช้งาน iMessage ที่มีเฉพาะไฟล์แนบจะถูกทิ้งก่อนถึงเอเจนต์ และอาจไม่มีบรรทัดบันทึก `Inbound message` เลย
    - สามารถดึงเส้นทางไฟล์แนบระยะไกลผ่าน SCP ได้เมื่อตั้งค่า `remoteHost`
    - เส้นทางไฟล์แนบต้องตรงกับรากที่อนุญาต:
      - `channels.imessage.attachmentRoots` (ภายในเครื่อง)
      - `channels.imessage.remoteAttachmentRoots` (โหมด SCP ระยะไกล)
      - รากที่กำหนดค่าจะขยายรูปแบบรากเริ่มต้น `/Users/*/Library/Messages/Attachments` (ผสาน ไม่ใช่แทนที่)
    - SCP ใช้การตรวจสอบคีย์โฮสต์อย่างเคร่งครัด (`StrictHostKeyChecking=yes`)
    - ขนาดสื่อขาออกใช้ `channels.imessage.mediaMaxMb` (ค่าเริ่มต้น 16 MB)

  </Accordion>

  <Accordion title="ข้อความขาออกและการแบ่งส่วน">
    - ขีดจำกัดส่วนข้อความ: `channels.imessage.textChunkLimit` (ค่าเริ่มต้น 4000)
    - โหมดการแบ่งส่วน: `channels.imessage.streaming.chunkMode`
      - `length` (ค่าเริ่มต้น)
      - `newline` (แบ่งตามย่อหน้าก่อน)
    - ตัวหนา/ตัวเอียง/ขีดเส้นใต้/ขีดฆ่าของ Markdown ขาออกจะถูกแปลงเป็นข้อความที่มีรูปแบบแบบเนทีฟ (ผู้รับที่ใช้ macOS 15+ จะแสดงรูปแบบดังกล่าว ส่วนผู้รับที่ใช้เวอร์ชันเก่ากว่าจะเห็นข้อความธรรมดาโดยไม่มีเครื่องหมาย); ตาราง Markdown จะถูกแปลงตามโหมดตาราง Markdown ของช่องทาง
    - `channels.imessage.sendTransport` (`auto` เป็นค่าเริ่มต้น, `bridge`, `applescript`) เลือกวิธีที่ `imsg` ใช้ส่งข้อความ

  </Accordion>

  <Accordion title="รูปแบบการระบุที่อยู่">
    แนะนำให้ระบุปลายทางอย่างชัดเจน:

    - `chat_id:123` (แนะนำสำหรับการกำหนดเส้นทางที่เสถียร)
    - `chat_guid:...`
    - `chat_identifier:...`

    รองรับปลายทางแบบแฮนเดิลด้วย:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## การดำเนินการผ่าน API ส่วนตัว

เมื่อ `imsg launch` ทำงานอยู่และ `openclaw channels status --probe` รายงาน `privateApi.available: true` เครื่องมือข้อความสามารถใช้การดำเนินการแบบเนทีฟของ iMessage เพิ่มเติมจากการส่งข้อความปกติได้

การดำเนินการทั้งหมดเปิดใช้โดยค่าเริ่มต้น ใช้ `channels.imessage.actions` เพื่อปิดการดำเนินการแต่ละรายการ:

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="การดำเนินการที่ใช้ได้">
    - **react**: เพิ่ม/ลบ tapback ของ iMessage (`messageId`, `emoji`, `remove`) tapback ที่รองรับจะจับคู่กับรัก ชอบ ไม่ชอบ หัวเราะ เน้น และสงสัย การลบโดยไม่ระบุอีโมจิจะล้าง tapback ใดก็ตามที่ตั้งไว้
    - **reply**: ส่งการตอบกลับแบบเธรดไปยังข้อความที่มีอยู่ (`messageId`, `text` หรือ `message` ร่วมกับ `chatGuid`, `chatId`, `chatIdentifier` หรือ `to`) การตอบกลับพร้อมไฟล์แนบต้องใช้บิลด์ `imsg` ที่มี `send-rich` รองรับ `--file` เพิ่มเติม
    - **sendWithEffect**: ส่งข้อความพร้อมเอฟเฟกต์ iMessage (`text` หรือ `message`, `effect` หรือ `effectId`) ชื่อย่อ: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight
    - **edit**: แก้ไขข้อความที่ส่งแล้วบนเวอร์ชัน macOS/API ส่วนตัวที่รองรับ (`messageId`, `text` หรือ `newText`) แก้ไขได้เฉพาะข้อความที่ gateway ส่งเองเท่านั้น
    - **unsend**: เรียกคืนข้อความที่ส่งแล้วบนเวอร์ชัน macOS/API ส่วนตัวที่รองรับ (`messageId`) เรียกคืนได้เฉพาะข้อความที่ gateway ส่งเองเท่านั้น
    - **upload-file**: ส่งสื่อ/ไฟล์ (`buffer` ในรูปแบบ base64 หรือ `media`/`path`/`filePath` ที่เติมข้อมูลแล้ว, `filename`, และ `asVoice` ที่ระบุหรือไม่ก็ได้) นามแฝงเดิม: `sendAttachment`
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: จัดการแชตกลุ่มเมื่อปลายทางปัจจุบันเป็นการสนทนากลุ่ม การดำเนินการเหล่านี้เปลี่ยนแปลงข้อมูลประจำตัว Messages ของโฮสต์ จึงต้องใช้ผู้ส่งที่เป็นเจ้าของหรือไคลเอนต์ Gateway ที่มี `operator.admin`
    - **poll**: สร้างแบบสำรวจแบบเนทีฟของ Apple Messages (`pollQuestion`, `pollOption` ซ้ำ 2 ถึง 12 ครั้ง ร่วมกับ `chatGuid`, `chatId`, `chatIdentifier` หรือ `to`) ผู้รับบน iOS/iPadOS/macOS 26+ จะเห็นและลงคะแนนได้แบบเนทีฟ ส่วนระบบปฏิบัติการเวอร์ชันเก่าจะได้รับข้อความสำรอง "ส่งแบบสำรวจแล้ว" ต้องใช้ `selectors.pollPayloadMessage`
    - **poll-vote**: ลงคะแนนในแบบสำรวจที่มีอยู่ (`pollId` หรือ `messageId` ร่วมกับค่าใดค่าหนึ่งจาก `pollOptionIndex`, `pollOptionId` หรือ `pollOptionText` เท่านั้น) ต้องใช้ `selectors.pollVoteMessage` และเมธอด RPC `poll.vote`

    แบบสำรวจขาเข้าที่ได้รับการยอมรับจะแสดงต่อเอเจนต์พร้อมคำถาม ป้ายตัวเลือกที่มีหมายเลข จำนวนคะแนน และ ID ข้อความแบบสำรวจที่ `poll-vote` ต้องใช้

  </Accordion>

  <Accordion title="ID ข้อความ">
    บริบท iMessage ขาเข้ามีทั้งค่า `MessageSid` แบบสั้นและ GUID ข้อความแบบเต็ม (`MessageSidFull`) เมื่อมี ID แบบสั้นมีขอบเขตอยู่ในแคชการตอบกลับล่าสุดที่ใช้ SQLite และจะถูกตรวจสอบกับแชตปัจจุบันก่อนใช้งาน หาก ID แบบสั้นหมดอายุ ให้ลองอีกครั้งด้วย `MessageSidFull` ของ ID นั้นโดยกำหนดเป้าหมายไปยังการสนทนาที่ให้ ID ดังกล่าว ID แบบเต็มไม่ข้ามการผูกกับการสนทนาหรือบัญชี ดังนั้นให้แทนที่ ID จากแชตอื่นด้วย ID จากปลายทางปัจจุบัน การเรียกแบบมอบหมายจากระยะไกลอาจปฏิเสธ ID แบบเต็มที่เก่าเมื่อไม่มีหลักฐานของการสนทนาปัจจุบัน

  </Accordion>

  <Accordion title="การตรวจหาความสามารถ">
    OpenClaw ซ่อนการดำเนินการ API ส่วนตัวเฉพาะเมื่อสถานะโพรบที่แคชไว้ระบุว่าบริดจ์ไม่พร้อมใช้งาน หากไม่ทราบสถานะ การดำเนินการจะยังคงมองเห็นได้และการส่งคำสั่งจะโพรบแบบล่าช้า เพื่อให้การดำเนินการแรกสำเร็จได้หลังจาก `imsg launch` โดยไม่ต้องรีเฟรชสถานะด้วยตนเองแยกต่างหาก

  </Accordion>

  <Accordion title="ใบตอบรับการอ่านและสถานะกำลังพิมพ์">
    เมื่อบริดจ์ API ส่วนตัวทำงาน แชตขาเข้าที่ได้รับการยอมรับจะถูกทำเครื่องหมายว่าอ่านแล้ว และแชตโดยตรงจะแสดงฟองสถานะกำลังพิมพ์ทันทีที่ยอมรับรอบการทำงาน ขณะที่เอเจนต์เตรียมบริบทและสร้างคำตอบ ปิดการทำเครื่องหมายว่าอ่านแล้วด้วย:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    บิลด์ `imsg` รุ่นเก่าที่สร้างก่อนมีรายการความสามารถรายเมธอดจะปิดสถานะกำลังพิมพ์/การอ่านโดยไม่มีข้อความแจ้ง OpenClaw จะบันทึกคำเตือนหนึ่งครั้งต่อการรีสตาร์ตเพื่อให้ระบุสาเหตุของใบตอบรับที่หายไปได้

  </Accordion>

  <Accordion title="tapback ขาเข้า">
    OpenClaw สมัครรับ tapback ของ iMessage และกำหนดเส้นทางรีแอ็กชันที่ได้รับการยอมรับเป็นเหตุการณ์ระบบแทนข้อความปกติ เพื่อให้ tapback ของผู้ใช้ไม่กระตุ้นวงจรการตอบกลับตามปกติ

    โหมดการแจ้งเตือนควบคุมโดย `channels.imessage.reactionNotifications`:

    - `"own"` (ค่าเริ่มต้น): แจ้งเตือนเฉพาะเมื่อผู้ใช้แสดงรีแอ็กชันต่อข้อความที่บอตเขียน
    - `"all"`: แจ้งเตือนสำหรับ tapback ขาเข้าทั้งหมดจากผู้ส่งที่ได้รับอนุญาต
    - `"off"`: ละเว้น tapback ขาเข้า

    การแทนค่ารายบัญชีใช้ `channels.imessage.accounts.<id>.reactionNotifications`

  </Accordion>

  <Accordion title="รีแอ็กชันการอนุมัติ (👍 / 👎)">
    เมื่อ `approvals.exec.enabled` หรือ `approvals.plugin.enabled` เป็น true และคำขอถูกกำหนดเส้นทางไปยัง iMessage gateway จะส่งพรอมต์การอนุมัติแบบเนทีฟและยอมรับ tapback เพื่อดำเนินการให้เสร็จสิ้น:

    - `👍` (tapback แบบชอบ) → `allow-once`
    - `👎` (tapback แบบไม่ชอบ) → `deny`
    - `allow-always` ยังคงเป็นทางเลือกสำรองแบบดำเนินการด้วยตนเอง: ส่ง `/approve <id> allow-always` เป็นการตอบกลับปกติ

    การจัดการรีแอ็กชันกำหนดให้แฮนเดิลของผู้ใช้ที่แสดงรีแอ็กชันต้องเป็นผู้อนุมัติที่ระบุไว้อย่างชัดเจน ระบบอ่านรายการผู้อนุมัติจาก `channels.imessage.allowFrom` (หรือ `channels.imessage.accounts.<id>.allowFrom`) ให้เพิ่มหมายเลขโทรศัพท์ของผู้ใช้ในรูปแบบ E.164 หรืออีเมล Apple ID ของผู้ใช้ (ปลายทางแชต เช่น `chat_id:*` ไม่ใช่รายการผู้อนุมัติที่ถูกต้อง) รองรับรายการไวลด์การ์ด `"*"` แต่จะอนุญาตให้ผู้ส่งทุกรายอนุมัติได้ หากรายการผู้อนุมัติว่าง ทางลัดด้วยรีแอ็กชันจะถูกปิดใช้งานทั้งหมด ทางลัดด้วยรีแอ็กชันจะข้าม `reactionNotifications`, `dmPolicy` และ `groupAllowFrom` โดยเจตนา เพราะรายการอนุญาตของผู้อนุมัติที่ระบุไว้อย่างชัดเจนเป็นเงื่อนไขเดียวที่ใช้ตัดสินการอนุมัติ

    การอนุญาตคำสั่งข้อความ `/approve` ใช้รายการเดียวกัน: เมื่อ `channels.imessage.allowFrom` ไม่ว่าง ระบบจะตรวจสอบสิทธิ์ `/approve <id> <decision>` กับรายการผู้อนุมัตินั้น (ไม่ใช่รายการอนุญาต DM ที่กว้างกว่า) และผู้ส่งที่ได้รับอนุญาตในรายการอนุญาต DM แต่ไม่อยู่ใน `allowFrom` จะได้รับการปฏิเสธอย่างชัดเจน เมื่อ `allowFrom` ว่าง ทางเลือกสำรองสำหรับแชตเดียวกันจะยังมีผล และ `/approve` จะอนุญาตทุกคนที่รายการอนุญาต DM อนุญาต เพิ่มผู้ดำเนินการทุกคนที่ควรอนุมัติ — ผ่าน `/approve` หรือผ่านรีแอ็กชัน — ไปยัง `allowFrom`

    หมายเหตุสำหรับผู้ดูแลระบบ:
    - การเชื่อมโยงรีแอ็กชันจะถูกจัดเก็บทั้งในหน่วยความจำและในที่เก็บแบบมีคีย์ถาวรของ Gateway (โดยตั้งค่า TTL ให้ตรงกับเวลาหมดอายุของการอนุมัติ) และ Gateway ยังสำรวจพรอมต์ที่รอดำเนินการเพื่อหา tapback ด้วย ดังนั้น tapback ที่มาถึงไม่นานหลังจาก Gateway รีสตาร์ตจึงยังคงใช้ตัดสินการอนุมัติได้
    - tapback `is_from_me=true` ของผู้ดูแลระบบเอง (เช่น จากอุปกรณ์ Apple ที่จับคู่ไว้) ใช้ตัดสินการอนุมัติได้เมื่อแฮนเดิลนั้นเป็นผู้อนุมัติที่ระบุไว้อย่างชัดเจน
    - พรอมต์การอนุมัติจะถูกส่งไปยังการสนทนากลุ่มเฉพาะเมื่อกำหนดผู้อนุมัติไว้อย่างชัดเจน มิฉะนั้นสมาชิกกลุ่มคนใดก็อาจอนุมัติได้
    - tapback รูปแบบข้อความแบบเก่า (`Liked "…"` ข้อความธรรมดาจากไคลเอ็นต์ Apple รุ่นเก่ามาก) ไม่สามารถใช้ตัดสินการอนุมัติได้ เนื่องจากไม่มี GUID ของข้อความ การตัดสินผ่านรีแอ็กชันต้องใช้ข้อมูลเมตา tapback แบบมีโครงสร้างที่ไคลเอ็นต์ macOS / iOS ปัจจุบันส่งออกมา

  </Accordion>

  <Accordion title="รีแอ็กชันสำหรับคำถาม (1️⃣ / 2️⃣ / 3️⃣ / 4️⃣)">
    สำหรับพรอมต์ `ask_user` ที่มีคำถามแบบเลือกได้หนึ่งคำตอบซึ่งไม่เป็นความลับจำนวนหนึ่งข้อ และมีตัวเลือกหนึ่งถึงสี่ตัวเลือก OpenClaw จะเพิ่มตัวเลือกอีโมจิที่มีหมายเลข ให้แสดงรีแอ็กชันต่อพรอมต์ที่ส่งถึงด้วยหมายเลขที่ตรงกันเพื่อตอบคำถาม รีแอ็กชันต้องมี GUID ที่คงที่ของข้อความที่บอตสร้าง จากนั้น OpenClaw จะจับคู่หมายเลขกับตัวเลือกมาตรฐานผ่าน Gateway การแตะที่ล้าสมัยหรือซ้ำจะถูกละเว้น

    พรอมต์แบบหลายคำถาม หลายตัวเลือก และข้อความอิสระยังคงตอบได้ด้วยข้อความเท่านั้น รีแอ็กชันสำหรับคำถามเป็นไปตามกฎการอนุญาต DM/กลุ่มตามปกติของ iMessage ระบบจะจดจำรีแอ็กชันเหล่านี้แม้เมื่อ `reactionNotifications` ทั่วไปเป็น `"off"` โดยไม่เปลี่ยนรีแอ็กชันที่ไม่เกี่ยวข้องให้เป็นเหตุการณ์ของเอเจนต์

  </Accordion>
</AccordionGroup>

## การเขียนค่ากำหนด

โดยค่าเริ่มต้น iMessage อนุญาตให้ช่องทางเป็นผู้เริ่มเขียนค่ากำหนด (สำหรับ `/config set|unset` เมื่อ `commands.config: true`)

วิธีปิดใช้งาน:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## การรวม DM ที่ถูกแยกส่ง (คำสั่ง + URL ในการพิมพ์ครั้งเดียว)

เมื่อผู้ใช้พิมพ์คำสั่งและ URL พร้อมกัน เช่น `Dump https://example.com/article` แอป Messages ของ Apple จะแยกการส่งออกเป็น **สองแถว `chat.db` แยกกัน**:

1. ข้อความหนึ่งรายการ (`"Dump"`)
2. บอลลูนแสดงตัวอย่าง URL (`"https://..."`) ซึ่งมีรูปภาพตัวอย่าง OG เป็นไฟล์แนบ

ในการตั้งค่าส่วนใหญ่ แถวทั้งสองจะมาถึง OpenClaw ห่างกันประมาณ 0.8-2.0 วินาที หากไม่มีการรวม เอเจนต์จะได้รับเฉพาะคำสั่งในรอบที่ 1 (และมักตอบว่า "ส่ง URL มาให้ฉัน") ก่อนที่ URL จะมาถึงในรอบที่ 2 ลักษณะนี้เกิดจากไปป์ไลน์การส่งของ Apple ไม่ใช่สิ่งที่ OpenClaw หรือ `imsg` สร้างขึ้น

`channels.imessage.coalesceSameSenderDms` กำหนดให้ DM บัฟเฟอร์แถวต่อเนื่องจากผู้ส่งคนเดียวกัน เมื่อ `imsg` แสดงมาร์กเกอร์ตัวอย่าง URL เชิงโครงสร้าง `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` ในแถวต้นทางแถวใดแถวหนึ่ง OpenClaw จะรวมเฉพาะการแยกส่งจริงนั้น และคงแถวอื่นที่อยู่ในบัฟเฟอร์ไว้เป็นรอบแยกกัน ในบิลด์ `imsg` รุ่นเก่าที่ไม่ส่งข้อมูลเมตาของบอลลูนเลย OpenClaw ไม่สามารถแยกแยะการแยกส่งจากการส่งแยกกันได้ จึงใช้วิธีสำรองโดยรวมรายการในบัคเก็ต การทำเช่นนี้รักษาพฤติกรรมก่อนมีข้อมูลเมตาไว้ แทนที่จะทำให้การแยกส่ง `Dump <url>` ถดถอยเป็นสองรอบ แชตกลุ่มยังคงส่งต่อแยกตามแต่ละข้อความเพื่อรักษาโครงสร้างรอบการสนทนาของผู้ใช้หลายคน

<Tabs>
  <Tab title="ควรเปิดใช้งานเมื่อใด">
    เปิดใช้งานเมื่อ:

    - คุณเผยแพร่ Skills ที่คาดว่าจะได้รับ `command + payload` ในข้อความเดียว (ถ่ายโอนข้อมูล วาง บันทึก เข้าคิว เป็นต้น)
    - ผู้ใช้วาง URL พร้อมกับคำสั่ง
    - คุณยอมรับเวลาแฝงที่เพิ่มขึ้นของรอบ DM ได้ (ดูด้านล่าง)

    ปล่อยให้ปิดใช้งานเมื่อ:

    - คุณต้องการเวลาแฝงของคำสั่งต่ำที่สุดสำหรับทริกเกอร์ DM แบบคำเดียว
    - โฟลว์ทั้งหมดเป็นคำสั่งที่ทำงานครั้งเดียวโดยไม่มีเพย์โหลดตามมา

  </Tab>
  <Tab title="การเปิดใช้งาน">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // เลือกเปิดใช้ (ค่าเริ่มต้น: false)
        },
      },
    }
    ```

    เมื่อเปิดแฟล็กนี้โดยไม่ได้กำหนด `messages.inbound.byChannel.imessage` หรือ `messages.inbound.debounceMs` ส่วนกลางอย่างชัดเจน หน้าต่างดีบาวซ์จะขยายเป็น **7000 ms** (ค่าเริ่มต้นแบบเดิมคือ 0 ms — ไม่มีการดีบาวซ์) จำเป็นต้องใช้หน้าต่างที่กว้างขึ้น เนื่องจากจังหวะการแยกส่งตัวอย่าง URL ของ Apple อาจกินเวลาหลายวินาทีระหว่างที่ Messages.app ส่งแถวตัวอย่างออกมา

    หากต้องการปรับหน้าต่างด้วยตนเอง:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms ครอบคลุมความล่าช้าของตัวอย่าง URL จาก Messages.app ที่ตรวจพบ
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="ข้อแลกเปลี่ยน">
    - **การรวมอย่างแม่นยำต้องใช้ข้อมูลเมตาเพย์โหลด `imsg` ปัจจุบัน** เมื่อมี `balloon_bundle_id` ระบบจะรวมเฉพาะการแยกส่งจริง ส่วนการรวมสำรองสำหรับความเข้ากันได้ย้อนหลังในกรณีไม่มีข้อมูลเมตาตามที่อธิบายไว้ข้างต้นเป็นมาตรการชั่วคราว และจะถูกนำออกเมื่อ `imsg` รวมการแยกส่งที่ต้นทางแล้ว
    - **เวลาแฝงที่เพิ่มขึ้นสำหรับข้อความ DM** เมื่อเปิดแฟล็ก ทุก DM (รวมถึงคำสั่งควบคุมเดี่ยวและข้อความติดตามผลเพียงข้อความเดียว) จะรอจนถึงระยะเวลาสูงสุดของหน้าต่างดีบาวซ์ก่อนส่งต่อ เผื่อว่าจะมีแถวตัวอย่าง URL ตามมา ข้อความแชตกลุ่มยังคงส่งต่อทันที
    - **เอาต์พุตที่รวมแล้วมีขอบเขตจำกัด** ข้อความที่รวมแล้วจำกัดที่ 4000 อักขระ พร้อมมาร์กเกอร์ `…[truncated]` ที่ชัดเจน ไฟล์แนบจำกัดที่ 20 รายการ และรายการต้นทางจำกัดที่ 10 รายการ (หากเกินกว่านั้นจะเก็บรายการแรกและรายการล่าสุดไว้) GUID ต้นทางทุกรายการจะถูกติดตามใน `coalescedMessageGuids` สำหรับเทเลเมทรีปลายทาง
    - **เฉพาะ DM** แชตกลุ่มจะส่งต่อแยกตามแต่ละข้อความ เพื่อให้บอตยังตอบสนองได้ดีเมื่อมีหลายคนกำลังพิมพ์
    - **เลือกเปิดใช้แยกตามช่องทาง** ช่องทางอื่น (Discord, Slack, Telegram, WhatsApp, …) ไม่ได้รับผลกระทบ ค่ากำหนด BlueBubbles แบบเดิมที่ตั้งค่า `channels.bluebubbles.coalesceSameSenderDms` ควรย้ายค่านั้นไปยัง `channels.imessage.coalesceSameSenderDms`

  </Tab>
</Tabs>

### สถานการณ์และสิ่งที่เอเจนต์เห็น

คอลัมน์ "เปิดแฟล็ก" แสดงพฤติกรรมบนบิลด์ `imsg` ที่ส่ง `balloon_bundle_id` ในบิลด์ `imsg` รุ่นเก่าที่ไม่ส่งข้อมูลเมตาของบอลลูนเลย แถวด้านล่างที่ระบุว่า "สองรอบ" / "N รอบ" จะใช้วิธีสำรองเป็นการรวมแบบเดิม (หนึ่งรอบ) แทน เนื่องจาก OpenClaw ไม่สามารถแยกแยะการแยกส่งจากการส่งแยกกันในเชิงโครงสร้างได้ จึงรักษาพฤติกรรมการรวมก่อนมีข้อมูลเมตาไว้ การแยกอย่างแม่นยำจะเริ่มทำงานเมื่อบิลด์ส่งข้อมูลเมตาของบอลลูน

| สิ่งที่ผู้ใช้พิมพ์                                                   | สิ่งที่ `chat.db` สร้าง              | ปิดแฟล็ก (ค่าเริ่มต้น)                       | เปิดแฟล็ก + หน้าต่าง (imsg ส่งข้อมูลเมตาของบอลลูน)                                                        |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (ส่งครั้งเดียว)                              | 2 แถวห่างกันประมาณ 1 วินาที                   | เอเจนต์ทำงานสองรอบ: มีเฉพาะ "Dump" แล้วจึงเป็น URL | หนึ่งรอบ: ข้อความที่รวมแล้ว `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (ไฟล์แนบ + ข้อความ)                | 2 แถวที่ไม่มีข้อมูลเมตาของบอลลูน URL | สองรอบ                               | สองรอบหลังจากตรวจพบข้อมูลเมตา หนึ่งรอบที่รวมแล้วในเซสชันเก่า/ก่อนการล็อกค่าที่ไม่มีข้อมูลเมตา       |
| `/status` (คำสั่งเดี่ยว)                                     | 1 แถว                               | ส่งต่อทันที                        | **รอจนถึงระยะเวลาสูงสุดของหน้าต่าง แล้วจึงส่งต่อ**                                                                |
| วาง URL เพียงอย่างเดียว                                                   | 1 แถว                               | ส่งต่อทันที                        | รอจนถึงระยะเวลาสูงสุดของหน้าต่าง แล้วจึงส่งต่อ                                                                    |
| ส่งข้อความ + URL เป็นสองข้อความแยกกันโดยตั้งใจ ห่างกันหลายนาที | 2 แถวอยู่นอกหน้าต่าง               | สองรอบ                               | สองรอบ (หน้าต่างหมดอายุในช่วงระหว่างสองข้อความ)                                                             |
| ส่ง DM ขนาดเล็กอย่างรวดเร็ว (>10 รายการภายในหน้าต่าง)                          | N แถวที่ไม่มีข้อมูลเมตาของบอลลูน URL | N รอบ                                 | N รอบหลังจากตรวจพบข้อมูลเมตา หนึ่งรอบแบบรวมที่มีขอบเขตจำกัดในเซสชันเก่า/ก่อนการล็อกค่าที่ไม่มีข้อมูลเมตา |
| คนสองคนพิมพ์ในแชตกลุ่ม                                  | N แถวจากผู้ส่ง M คน               | M+ รอบ (หนึ่งรอบต่อบัคเก็ตของผู้ส่ง)        | M+ รอบ — แชตกลุ่มจะไม่ถูกรวม                                                            |

## การกู้คืนขาเข้าหลังจากบริดจ์หรือ Gateway รีสตาร์ต

iMessage กู้คืนข้อความที่พลาดไปในช่วงที่ Gateway หยุดทำงาน และในขณะเดียวกันก็ระงับ "การถล่มของข้อความค้าง" ที่ล้าสมัยซึ่ง Apple อาจปล่อยออกมาหลังการกู้คืน Push พฤติกรรมเริ่มต้นนี้เปิดใช้งานเสมอ โดยสร้างอยู่บนการรับข้อมูลที่คงทนร่วมกับแนวกั้นตามอายุ

- **การป้องกันการเล่นซ้ำอย่างคงทน** ก่อนเลื่อนเคอร์เซอร์การกู้คืน OpenClaw จะบันทึกแต่ละแถวดิบลงในคิวรับเข้าของ SQLite ที่ใช้ร่วมกัน โดยใช้ GUID ของ Apple เป็นรหัสเหตุการณ์ แถวที่ประมวลผลเสร็จแล้วจะทิ้งทูมสโตนไว้นานประมาณ 4 ชั่วโมง โดยจำกัดสูงสุด 10,000 รายการ เพื่อให้การเล่นซ้ำที่มี GUID เดิมถูกทิ้งแม้หลังรีสตาร์ต แถวที่รอดำเนินการยังคงกู้คืนได้จนกว่าการส่งต่อจะรับช่วงไป
- **การกู้คืนหลังหยุดทำงาน** เมื่อเริ่มต้น มอนิเตอร์จะจดจำ rowid ของแถว `chat.db` ล่าสุดที่รับเข้าอย่างคงทน (เคอร์เซอร์แยกตามบัญชีที่จัดเก็บถาวร) และส่งให้ `imsg watch.subscribe` เป็น `since_rowid` เพื่อให้ imsg เล่นซ้ำแถวที่ยังไม่ได้บันทึก แล้วจึงติดตามข้อมูลสดต่อ แถวที่บันทึกก่อนเกิดการขัดข้องจะทำงานต่อจาก SQLite การเล่นซ้ำจำกัดอยู่ที่ 500 แถวล่าสุดและข้อความที่มีอายุไม่เกินประมาณ 2 ชั่วโมง ส่วนทูมสโตน GUID จะทิ้งรายการที่จัดการไปแล้ว
- **แนวกั้นอายุของข้อความค้างที่ล้าสมัย** แถวที่อยู่เหนือขอบเขตการเริ่มต้นเป็นข้อมูลสดจริง หากวันที่ส่งของแถวใดเก่ากว่าเวลาที่มาถึงมากกว่าประมาณ 15 นาที แถวนั้นคือข้อความค้างที่ถูกปล่อยจาก Push และจะถูกระงับ แถวที่เล่นซ้ำ (อยู่ที่หรือต่ำกว่าขอบเขต) จะใช้หน้าต่างการกู้คืนที่กว้างกว่าแทน เพื่อให้ส่งข้อความที่เพิ่งพลาดไปได้โดยไม่ส่งประวัติเก่ามาก

การกู้คืนทำงานได้ทั้งกับการตั้งค่า `cliPath` แบบภายในเครื่องและระยะไกล เนื่องจากการเล่นซ้ำ `since_rowid` ทำงานผ่านการเชื่อมต่อ RPC `imsg` เดียวกัน ความแตกต่างอยู่ที่หน้าต่าง เมื่อ Gateway อ่าน `chat.db` ได้ (ภายในเครื่อง) ระบบจะยึดขอบเขต rowid ตอนเริ่มต้น จำกัดช่วงการเล่นซ้ำ และส่งข้อความที่พลาดไปซึ่งมีอายุไม่เกินประมาณสองชั่วโมง สำหรับ `cliPath` ผ่าน SSH ระยะไกล ระบบไม่สามารถอ่านฐานข้อมูลได้ ดังนั้นการเล่นซ้ำจึงไม่มีขีดจำกัดและทุกแถวใช้แนวกั้นอายุของข้อมูลสด ระบบยังคงกู้คืนข้อความที่เพิ่งพลาดและระงับข้อความค้างเก่าได้ เพียงแต่ใช้หน้าต่างข้อมูลสดที่แคบกว่า ให้เรียกใช้ Gateway บน Mac ที่ใช้ Messages เพื่อให้ได้หน้าต่างการกู้คืนที่กว้างกว่า

### สัญญาณที่ผู้ดูแลระบบมองเห็น

ข้อความค้างที่ถูกระงับจะถูกบันทึกในระดับเริ่มต้นเสมอ โดยไม่ถูกทิ้งอย่างเงียบ ๆ (แฟล็ก `recovery` แสดงว่ามีการใช้หน้าต่างใด):

```text
imessage: ระงับข้อความขาเข้าค้างที่ล้าสมัย account=<id> sent=<iso> recovery=<bool> (ระงับแล้ว <N> รายการนับตั้งแต่เริ่มต้น)
```

### การย้ายข้อมูล

`channels.imessage.catchup.*` เลิกแนะนำให้ใช้แล้ว — การกู้คืนหลังหยุดทำงานเป็นไปโดยอัตโนมัติและไม่ต้องใช้ค่ากำหนดสำหรับการตั้งค่าใหม่ ค่ากำหนดเดิมที่มี `catchup.enabled: true` จะยังคงได้รับการรองรับในฐานะโปรไฟล์ความเข้ากันได้สำหรับหน้าต่างการเล่นซ้ำเพื่อการกู้คืน บล็อก catchup ที่ปิดใช้งาน (`enabled: false` หรือไม่มี `enabled: true`) ถูกเลิกใช้แล้ว โดย `openclaw doctor --fix` จะนำบล็อกเหล่านั้นออก

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่พบ imsg หรือไม่รองรับ RPC">
    ตรวจสอบไบนารีและการรองรับ RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    หากการตรวจสอบรายงานว่าไม่รองรับ RPC ให้อัปเดต `imsg` หากการดำเนินการของ API ส่วนตัวไม่พร้อมใช้งาน ให้เรียกใช้ `imsg launch` ในเซสชันผู้ใช้ macOS ที่เข้าสู่ระบบอยู่ แล้วตรวจสอบอีกครั้ง หาก Gateway ไม่ได้ทำงานบน macOS ให้ใช้การตั้งค่า Mac ระยะไกลผ่าน SSH ด้านบนแทนเส้นทาง `imsg` ภายในเครื่องตามค่าเริ่มต้น

  </Accordion>

  <Accordion title="ส่งข้อความได้ แต่ไม่ได้รับ iMessage ขาเข้า">
    ก่อนอื่นให้ยืนยันว่าข้อความไปถึง Mac ภายในเครื่องหรือไม่ หาก `chat.db` ไม่เปลี่ยนแปลง OpenClaw จะไม่สามารถรับข้อความได้ แม้ว่า `imsg status --json` จะรายงานว่าบริดจ์มีสถานะปกติก็ตาม

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    หากข้อความที่ส่งจากโทรศัพท์ไม่สร้างแถวใหม่ ให้ซ่อมแซมชั้น Messages และ Apple Push ของ macOS ก่อนเปลี่ยนการกำหนดค่า OpenClaw โดยทั่วไปการรีเฟรชบริการครั้งเดียวก็เพียงพอ:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    ส่ง iMessage ใหม่จากโทรศัพท์ และยืนยันว่ามีแถว `chat.db` หรือเหตุการณ์ `imsg watch` ใหม่ก่อนดีบักเซสชัน OpenClaw อย่าเรียกใช้ขั้นตอนนี้เป็นลูปเปิดบริดจ์ใหม่ตามรอบเวลา การเรียก `imsg launch` ซ้ำพร้อมกับรีสตาร์ต Gateway ระหว่างที่กำลังทำงานอยู่อาจขัดจังหวะการส่งและทำให้การทำงานของช่องทางที่กำลังดำเนินอยู่ค้าง

  </Accordion>

  <Accordion title="Gateway ไม่ได้ทำงานบน macOS">
    `cliPath: "imsg"` ตามค่าเริ่มต้นต้องทำงานบน Mac ที่เข้าสู่ระบบ Messages อยู่ บน Linux หรือ Windows ให้ตั้งค่า `channels.imessage.cliPath` เป็นสคริปต์ตัวห่อหุ้มที่เชื่อมต่อไปยัง Mac เครื่องนั้นผ่าน SSH และเรียกใช้ `imsg "$@"`

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    จากนั้นเรียกใช้:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="ข้อความส่วนตัวถูกละเว้น">
    ตรวจสอบ:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - การอนุมัติการจับคู่ (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกละเว้น">
    ตรวจสอบ:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - ลักษณะการทำงานของรายการที่อนุญาต `channels.imessage.groups`
    - การกำหนดค่ารูปแบบการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="ไฟล์แนบระยะไกลล้มเหลว">
    ตรวจสอบ:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - การยืนยันตัวตนด้วยคีย์ SSH/SCP จากโฮสต์ Gateway
    - มีคีย์โฮสต์อยู่ใน `~/.ssh/known_hosts` บนโฮสต์ Gateway
    - ความสามารถในการอ่านพาธระยะไกลบน Mac ที่ใช้งาน Messages

  </Accordion>

  <Accordion title="พลาดข้อความแจ้งขอสิทธิ์ของ macOS">
    เรียกใช้อีกครั้งในเทอร์มินัล GUI แบบโต้ตอบภายใต้บริบทผู้ใช้/เซสชันเดียวกัน แล้วอนุมัติข้อความแจ้ง:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    ยืนยันว่าได้ให้สิทธิ์ Full Disk Access + Automation แก่บริบทกระบวนการที่เรียกใช้ OpenClaw/`imsg`

  </Accordion>
</AccordionGroup>

## ตัวชี้ไปยังเอกสารอ้างอิงการกำหนดค่า

- [เอกสารอ้างอิงการกำหนดค่า - iMessage](/th/gateway/config-channels#imessage)
- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [การจับคู่](/th/channels/pairing)

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การนำ BlueBubbles ออกและเส้นทาง iMessage ของ imsg](/th/announcements/bluebubbles-imessage) — ประกาศและสรุปการย้ายข้อมูล
- [การย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) — ตารางแปลงการกำหนดค่าและการเปลี่ยนระบบแบบทีละขั้นตอน
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนสำหรับข้อความส่วนตัวและขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) — ลักษณะการทำงานของแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
