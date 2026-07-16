---
read_when:
    - การตั้งค่าการรองรับ iMessage
    - การดีบักการส่ง/รับ iMessage
summary: รองรับ iMessage แบบเนทีฟผ่าน imsg (JSON-RPC ผ่าน stdio) พร้อมการดำเนินการผ่าน API ส่วนตัวสำหรับการตอบกลับ การแสดงความรู้สึกด้วย Tapback เอฟเฟกต์ แบบสำรวจ ไฟล์แนบ และการจัดการกลุ่ม แนะนำให้ใช้สำหรับการตั้งค่า OpenClaw iMessage ใหม่เมื่อข้อกำหนดของโฮสต์สอดคล้องกัน
title: iMessage
x-i18n:
    generated_at: "2026-07-16T18:37:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78b7ff7621e66e3b0122b5581c097140b7f62998b78981741bd3edbc0e1608bd
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
สำหรับการติดตั้ง iMessage ของ OpenClaw แบบทั่วไป ให้เรียกใช้ Gateway และ `imsg` บนโฮสต์ macOS ที่ลงชื่อเข้าใช้ Messages เดียวกัน หาก Gateway ทำงานอยู่ที่อื่น ให้กำหนด `channels.imessage.cliPath` ให้ชี้ไปยังตัวห่อหุ้ม SSH แบบโปร่งใสที่เรียกใช้ `imsg` บน Mac

**การกู้คืนข้อความขาเข้าเป็นไปโดยอัตโนมัติ** หลังจากบริดจ์หรือ Gateway เริ่มทำงานใหม่ iMessage จะเล่นซ้ำข้อความที่พลาดไปในช่วงที่ระบบหยุดทำงาน และระงับ "backlog bomb" เก่าที่ Apple อาจปล่อยออกมาหลังการกู้คืน Push พร้อมขจัดรายการซ้ำเพื่อไม่ให้มีสิ่งใดถูกส่งต่อสองครั้ง ไม่ต้องมีการกำหนดค่าเพื่อเปิดใช้ — ดู [การกู้คืนข้อความขาเข้าหลังจากบริดจ์หรือ Gateway เริ่มทำงานใหม่](#inbound-recovery-after-a-bridge-or-gateway-restart)
</Note>

<Warning>
การรองรับ BlueBubbles ถูกนำออกแล้ว โปรดย้ายการกำหนดค่า `channels.bluebubbles` ไปยัง `channels.imessage`; OpenClaw รองรับ iMessage ผ่าน `imsg` เท่านั้น เริ่มจาก [การนำ BlueBubbles ออกและเส้นทาง iMessage ผ่าน imsg](/th/announcements/bluebubbles-imessage) สำหรับประกาศฉบับย่อ หรือ [การย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) สำหรับตารางการย้ายฉบับเต็ม
</Warning>

สถานะ: การผสานรวม CLI ภายนอกแบบเนทีฟ Gateway จะสร้างโปรเซส `imsg rpc` และสื่อสารด้วย JSON-RPC ผ่าน stdio โดยไม่ต้องมีดีมอนหรือพอร์ตแยกต่างหาก ขอแนะนำอย่างยิ่งให้ใช้โหมด Private API เพื่อให้ช่องทาง iMessage ทำงานได้อย่างสมบูรณ์ การตอบกลับ tapback เอฟเฟกต์ โพล การตอบกลับไฟล์แนบ และการดำเนินการกับกลุ่ม ต้องใช้ `imsg launch` และการตรวจสอบ Private API ที่สำเร็จ

สำหรับการตั้งค่าในเครื่องที่ใช้กันทั่วไป ตัวตั้งค่า OpenClaw สามารถเสนอให้ติดตั้งหรืออัปเดต `imsg` ผ่าน Homebrew โดยผู้ใช้ยืนยัน บน Mac ที่ลงชื่อเข้าใช้ Messages การตั้งค่าด้วยตนเองและโทโพโลยีแบบตัวห่อหุ้ม SSH ยังคงอยู่ภายใต้การจัดการของผู้ดูแลระบบ: ติดตั้งหรืออัปเดต `imsg` ภายใต้บริบทผู้ใช้เดียวกับที่จะเรียกใช้ Gateway หรือตัวห่อหุ้ม

<CardGroup cols={3}>
  <Card title="การดำเนินการของ Private API" icon="wand-sparkles" href="#private-api-actions">
    การตอบกลับ tapback เอฟเฟกต์ โพล ไฟล์แนบ และการจัดการกลุ่ม
  </Card>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ iMessage ใช้โหมดจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="Mac ระยะไกล" icon="terminal" href="#remote-mac-over-ssh">
    ใช้ตัวห่อหุ้ม SSH เมื่อ Gateway ไม่ได้ทำงานบน Mac ที่ใช้ Messages
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" icon="settings" href="/th/gateway/config-channels#imessage">
    เอกสารอ้างอิงฟิลด์ iMessage ฉบับเต็ม
  </Card>
</CardGroup>

## การตั้งค่าแบบรวดเร็ว

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

        เมื่อตัวช่วยตั้งค่าในเครื่องตรวจพบว่าคำสั่งเริ่มต้น `imsg` หายไป ระบบสามารถแจ้งให้ติดตั้ง `steipete/tap/imsg` ผ่าน Homebrew ได้ หากตรวจพบ `imsg` ที่จัดการโดย Homebrew ระบบสามารถแจ้งให้ติดตั้งใหม่หรืออัปเดตได้ ตัวห่อหุ้ม `cliPath` แบบกำหนดเองจะไม่ถูกแก้ไข

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
    การตั้งค่าส่วนใหญ่ไม่จำเป็นต้องใช้ SSH ใช้โทโพโลยีนี้เฉพาะเมื่อ Gateway ไม่สามารถทำงานบน Mac ที่ลงชื่อเข้าใช้ Messages ได้ OpenClaw ต้องการเพียง `cliPath` ที่เข้ากันได้กับ stdio ดังนั้นจึงสามารถกำหนด `cliPath` ให้ชี้ไปยังสคริปต์ตัวห่อหุ้มที่เชื่อมต่อ SSH ไปยัง Mac ระยะไกลและเรียกใช้ `imsg`
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
      remoteHost: "user@gateway-host", // ใช้สำหรับดึงไฟล์แนบผ่าน SCP
      includeAttachments: true,
      // ไม่บังคับ: รากไฟล์แนบเพิ่มเติมที่อนุญาต (รวมกับค่าเริ่มต้น
      // /Users/*/Library/Messages/Attachments)
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    หากไม่ได้กำหนด `remoteHost` OpenClaw จะพยายามตรวจหาโดยอัตโนมัติด้วยการแยกวิเคราะห์สคริปต์ตัวห่อหุ้ม SSH
    `remoteHost` ต้องเป็น `host` หรือ `user@host` (ไม่มีช่องว่างหรือตัวเลือก SSH) ค่าที่ไม่ปลอดภัยจะถูกละเว้น
    OpenClaw ใช้การตรวจสอบคีย์โฮสต์อย่างเข้มงวดสำหรับ SCP ดังนั้นคีย์ของโฮสต์รีเลย์ต้องมีอยู่ใน `~/.ssh/known_hosts` แล้ว
    เส้นทางไฟล์แนบจะถูกตรวจสอบเทียบกับรากที่อนุญาต (`attachmentRoots` / `remoteAttachmentRoots`)

<Warning>
ตัวห่อหุ้ม `cliPath` หรือพร็อกซี SSH ใดก็ตามที่วางไว้ด้านหน้า `imsg` **ต้อง** ทำงานเสมือนเป็นไปป์ stdio แบบโปร่งใสสำหรับ JSON-RPC ที่ทำงานต่อเนื่องเป็นเวลานาน OpenClaw แลกเปลี่ยนข้อความ JSON-RPC ขนาดเล็กที่แบ่งเฟรมด้วยอักขระขึ้นบรรทัดใหม่ ผ่าน stdin/stdout ของตัวห่อหุ้มตลอดอายุการทำงานของช่องทาง:

- ส่งต่อข้อมูล stdin แต่ละส่วน/บรรทัด **ทันทีที่มีไบต์พร้อมใช้งาน** — อย่ารอ EOF
- ส่งต่อข้อมูล stdout แต่ละส่วน/บรรทัดกลับไปอีกทิศทางโดยทันที
- คงอักขระขึ้นบรรทัดใหม่ไว้
- หลีกเลี่ยงการอ่านแบบบล็อกด้วยขนาดคงที่ (`read(4096)`, `cat | buffer`, `read` เริ่มต้นของเชลล์) ซึ่งอาจทำให้เฟรมขนาดเล็กไม่ได้รับการประมวลผล
- แยก stderr ออกจากสตรีม stdout ของ JSON-RPC

ตัวห่อหุ้มที่บัฟเฟอร์ stdin จนเต็มบล็อกขนาดใหญ่จะทำให้เกิดอาการคล้าย iMessage หยุดทำงาน เช่น `imsg rpc timeout (chats.list)` หรือช่องทางเริ่มทำงานใหม่ซ้ำ ๆ แม้ว่า `imsg rpc` เองจะทำงานเป็นปกติ `ssh -T host imsg "$@"` (ด้านบน) ปลอดภัย เพราะส่งต่ออาร์กิวเมนต์ `cliPath` ของ OpenClaw เช่น `rpc` และ `--db` ไปป์ไลน์อย่าง `ssh host imsg | grep -v '^DEBUG'` **ไม่ปลอดภัย** เพราะเครื่องมือที่บัฟเฟอร์ระดับบรรทัดยังอาจกักเฟรมไว้ได้ หากจำเป็นต้องกรอง ให้ใช้ `stdbuf -oL -eL` ในทุกขั้นตอน
</Warning>

  </Tab>
</Tabs>

## ข้อกำหนดและสิทธิ์ (macOS)

- ต้องลงชื่อเข้าใช้ Messages บน Mac ที่เรียกใช้ `imsg`
- บริบทโปรเซสที่เรียกใช้ OpenClaw/`imsg` ต้องมีสิทธิ์ Full Disk Access (เพื่อเข้าถึงฐานข้อมูล Messages)
- ต้องมีสิทธิ์ Automation เพื่อส่งข้อความผ่าน Messages.app
- สำหรับการดำเนินการขั้นสูง (แสดงปฏิกิริยา / แก้ไข / ยกเลิกการส่ง / ตอบกลับในเธรด / เอฟเฟกต์ / โพล / การดำเนินการกับกลุ่ม) ต้องปิดใช้ System Integrity Protection — ดู [การเปิดใช้ Private API ของ imsg](#enabling-the-imsg-private-api) การส่งและรับข้อความกับสื่อแบบพื้นฐานทำงานได้โดยไม่ต้องปิดใช้

<Tip>
สิทธิ์จะมอบให้แยกตามบริบทโปรเซส หาก Gateway ทำงานโดยไม่มีส่วนติดต่อผู้ใช้ (LaunchAgent/SSH) ให้เรียกใช้คำสั่งแบบโต้ตอบหนึ่งครั้งในบริบทเดียวกันเพื่อให้ระบบแสดงข้อความขอสิทธิ์:

```bash
imsg chats --limit 1
# หรือ
imsg send <handle> "ทดสอบ"
```

</Tip>

<Accordion title="การส่งผ่านตัวห่อหุ้ม SSH ล้มเหลวด้วย AppleEvents -1743">
  การตั้งค่า SSH ระยะไกลอาจอ่านข้อความ ส่งผ่าน `channels status --probe` และประมวลผลข้อความขาเข้าได้ ขณะที่การส่งขาออกยังคงล้มเหลวด้วยข้อผิดพลาดการอนุญาต AppleEvents:

```text
ไม่ได้รับอนุญาตให้ส่ง Apple events ไปยัง Messages (-1743)
```

ตรวจสอบฐานข้อมูล TCC ของผู้ใช้ Mac ที่ลงชื่อเข้าใช้ หรือ System Settings > Privacy & Security > Automation หากรายการ Automation ถูกบันทึกไว้สำหรับ `/usr/libexec/sshd-keygen-wrapper` แทนโปรเซส `imsg` หรือเชลล์ในเครื่อง macOS อาจไม่แสดงสวิตช์ Messages ที่ใช้งานได้สำหรับไคลเอนต์ฝั่งเซิร์ฟเวอร์ SSH ดังกล่าว:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

ในสถานะนี้ การทำ `tccutil reset AppleEvents` ซ้ำหรือเรียกใช้ `imsg send` ใหม่ผ่านตัวห่อหุ้ม SSH เดิมอาจยังคงล้มเหลว เพราะบริบทโปรเซสที่ต้องใช้ Automation ของ Messages คือตัวห่อหุ้ม SSH ไม่ใช่แอปที่ UI สามารถมอบสิทธิ์ให้ได้

ให้ใช้บริบทโปรเซส `imsg` ที่รองรับอย่างใดอย่างหนึ่งแทน:

- เรียกใช้ Gateway หรืออย่างน้อยบริดจ์ `imsg` ในเซสชันภายในเครื่องของผู้ใช้ที่ลงชื่อเข้าใช้ Messages
- เริ่ม Gateway ด้วย LaunchAgent สำหรับผู้ใช้รายนั้น หลังจากมอบสิทธิ์ Full Disk Access และ Automation จากเซสชันเดียวกัน
- หากยังคงใช้โทโพโลยี SSH แบบสองผู้ใช้ ให้ตรวจสอบว่าการส่งขาออกจริงด้วย `imsg send` ผ่านตัวห่อหุ้มเดียวกันสำเร็จก่อนเปิดใช้ช่องทาง หากไม่สามารถมอบสิทธิ์ Automation ได้ ให้กำหนดค่าใหม่เป็นการตั้งค่า `imsg` แบบผู้ใช้เดียว แทนการพึ่งพาตัวห่อหุ้ม SSH สำหรับการส่ง

</Accordion>

## การเปิดใช้ Private API ของ imsg

`imsg` มีโหมดการทำงานสองโหมด สำหรับ OpenClaw ขอแนะนำให้ตั้งค่าเป็นโหมด Private API เพราะทำให้ช่องทางมีการดำเนินการ iMessage แบบเนทีฟตามที่ผู้ใช้คาดหวัง โหมดพื้นฐานยังคงเหมาะสำหรับการติดตั้งที่มีความเสี่ยงต่ำ การตรวจสอบเริ่มต้น หรือโฮสต์ที่ไม่สามารถปิดใช้ SIP ได้

- **โหมดพื้นฐาน** (ค่าเริ่มต้น ไม่ต้องเปลี่ยนแปลง SIP): ส่งข้อความและสื่อขาออกผ่าน `send` รวมถึงการเฝ้าดู/ประวัติขาเข้าและรายการแชต นี่คือความสามารถที่พร้อมใช้งานทันทีจาก `brew install steipete/tap/imsg` ที่ติดตั้งใหม่ พร้อมสิทธิ์มาตรฐานของ macOS ข้างต้น
- **โหมด Private API**: `imsg` จะแทรก dylib ตัวช่วยเข้าไปใน `Messages.app` เพื่อเรียกใช้ฟังก์ชันภายในของ `IMCore` ซึ่งจะปลดล็อก `react`, `edit`, `unsend`, `reply` (แบบเธรด), `sendWithEffect`, `poll` และ `poll-vote` (โพลแบบเนทีฟของ Messages), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` รวมถึงตัวบ่งชี้การพิมพ์และใบตอบรับการอ่าน

ชุดการดำเนินการที่แนะนำในหน้านี้ต้องใช้โหมด Private API README ของ `imsg` ระบุข้อกำหนดไว้อย่างชัดเจน:

> คุณสมบัติขั้นสูง เช่น `read`, `typing`, `launch`, การส่งเนื้อหาสมบูรณ์ที่มีบริดจ์รองรับ, การแก้ไขข้อความ และการจัดการแชต เป็นแบบเลือกใช้ คุณสมบัติเหล่านี้ต้องปิดใช้ SIP และแทรก dylib ตัวช่วยเข้าไปใน `Messages.app` โดย `imsg launch` จะปฏิเสธการแทรกเมื่อ SIP เปิดใช้อยู่

เทคนิคการแทรกตัวช่วยใช้ dylib ของ `imsg` เองเพื่อเข้าถึง Private API ของ Messages ไม่มีเซิร์ฟเวอร์บุคคลที่สามหรือรันไทม์ BlueBubbles ในเส้นทาง iMessage ของ OpenClaw

<Warning>
**การปิดใช้ SIP เป็นการแลกเปลี่ยนด้านความปลอดภัยที่มีผลจริง** SIP เป็นหนึ่งในการป้องกันหลักของ macOS ต่อการเรียกใช้โค้ดระบบที่ถูกแก้ไข การปิดใช้ทั่วทั้งระบบจะเพิ่มพื้นผิวการโจมตีและผลข้างเคียง โดยเฉพาะอย่างยิ่ง **การปิดใช้ SIP บน Mac ที่ใช้ Apple Silicon จะปิดความสามารถในการติดตั้งและเรียกใช้แอป iOS บน Mac ด้วย**

ให้ถือว่านี่เป็นการตัดสินใจด้านการปฏิบัติงานโดยเจตนา โดยเฉพาะบน Mac ส่วนตัวเครื่องหลัก สำหรับ iMessage ของ OpenClaw ที่มีคุณภาพระดับใช้งานจริง ควรใช้ Mac เฉพาะหรือผู้ใช้บอต macOS ที่สามารถยอมรับการเปิดใช้บริดจ์ได้ หากแบบจำลองภัยคุกคามไม่สามารถยอมรับการปิด SIP ได้ไม่ว่าที่ใด iMessage ที่รวมมาให้จะถูกจำกัดไว้ที่โหมดพื้นฐาน คือส่งและรับข้อความกับสื่อเท่านั้น โดยไม่มีปฏิกิริยา / การแก้ไข / การยกเลิกการส่ง / เอฟเฟกต์ / การดำเนินการกับกลุ่ม
</Warning>

### การตั้งค่า

1. **ติดตั้ง (หรืออัปเกรด) `imsg`** บน Mac ที่เรียกใช้ Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   เอาต์พุต `imsg status --json` รายงาน `bridge_version`, `rpc_methods` และ `selectors` แยกตามเมธอด เพื่อให้สามารถตรวจสอบได้ว่าบิลด์ปัจจุบันรองรับอะไรบ้างก่อนเริ่มใช้งาน

2. **ปิดใช้งาน System Integrity Protection และ (บน macOS รุ่นใหม่) Library Validation** การแทรก dylib ตัวช่วยที่ไม่ใช่ของ Apple เข้าไปใน `Messages.app` ซึ่งลงนามโดย Apple จำเป็นต้องปิด SIP **และ** ผ่อนคลายการตรวจสอบไลบรารี ขั้นตอน SIP ในโหมด Recovery จะแตกต่างกันตามเวอร์ชันของ macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** ปิดใช้งาน Library Validation ผ่าน Terminal, รีบูตเข้าสู่ Recovery Mode, เรียกใช้ `csrutil disable` แล้วรีสตาร์ต
   - **macOS 11+ (Big Sur และใหม่กว่า), Intel:** เข้า Recovery Mode (หรือ Internet Recovery), เรียกใช้ `csrutil disable` แล้วรีสตาร์ต
   - **macOS 11+, Apple Silicon:** ใช้ลำดับการเริ่มต้นด้วยปุ่มเปิด/ปิดเพื่อเข้าสู่ Recovery; บน macOS เวอร์ชันล่าสุด ให้กดปุ่ม **Left Shift** ค้างไว้เมื่อคลิก Continue จากนั้นเรียกใช้ `csrutil disable` การตั้งค่าเครื่องเสมือนใช้ขั้นตอนแยกต่างหาก ดังนั้นให้สร้างสแนปช็อต VM ก่อน

   **บน macOS 11 และใหม่กว่า การใช้ `csrutil disable` เพียงอย่างเดียวมักไม่เพียงพอ** Apple ยังคงบังคับใช้การตรวจสอบไลบรารีกับ `Messages.app` ในฐานะไบนารีแพลตฟอร์ม ดังนั้นตัวช่วยที่ลงนามแบบ adhoc จึงถูกปฏิเสธ (`Library Validation failed: ... platform binary, but mapped file is not`) แม้จะปิด SIP แล้ว หลังจากปิดใช้งาน SIP ให้ปิดใช้งานการตรวจสอบไลบรารีด้วย แล้วรีบูต:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), ตรวจสอบแล้วบน 26.5.1:** การปิด SIP **ร่วมกับ** คำสั่ง `DisableLibraryValidation` ด้านบนเพียงพอสำหรับการแทรกตัวช่วยในเวอร์ชัน 26.0 ถึง 26.5.x **ไม่จำเป็นต้องใช้ boot-args** plist เป็นปัจจัยชี้ขาดและเป็นขั้นตอนที่มักขาดหายไปมากที่สุดเมื่อการแทรกล้มเหลวบน Tahoe:
   - **เมื่อมี plist:** `imsg launch` จะแทรกได้ และ `imsg status` จะรายงาน `advanced_features: true`
   - **เมื่อไม่มี plist (แม้จะปิด SIP แล้ว):** `imsg launch` จะล้มเหลวพร้อม `Failed to launch: Timeout waiting for Messages.app to initialize` AMFI ปฏิเสธตัวช่วย adhoc ขณะโหลด ดังนั้นบริดจ์จึงไม่พร้อมใช้งานและการเปิดใช้งานหมดเวลา การหมดเวลานี้เป็นอาการที่คนส่วนใหญ่พบบน Tahoe วิธีแก้คือใช้ plist ด้านบน ไม่ใช่ดำเนินการที่รุนแรงกว่านั้น

   หากการแทรก `imsg launch` หรือ `selectors` บางรายการเริ่มคืนค่า false หลังอัปเกรด macOS สาเหตุทั่วไปมักเป็นเกตนี้ ตรวจสอบสถานะ SIP และการตรวจสอบไลบรารีก่อนสรุปว่าขั้นตอน SIP ล้มเหลว หากการตั้งค่าเหล่านั้นถูกต้องแต่บริดจ์ยังแทรกไม่ได้ ให้รวบรวม `imsg status --json` พร้อมเอาต์พุต `imsg launch` และรายงานไปยังโปรเจกต์ `imsg` แทนการลดความเข้มงวดของการควบคุมความปลอดภัยทั่วทั้งระบบเพิ่มเติม

3. **แทรกตัวช่วย** เมื่อปิดใช้งาน SIP และลงชื่อเข้าใช้ Messages.app แล้ว:

   ```bash
   imsg launch
   ```

   `imsg launch` จะปฏิเสธการแทรกหากยังเปิดใช้งาน SIP อยู่ ดังนั้นขั้นตอนนี้จึงใช้ยืนยันได้ด้วยว่าขั้นตอนที่ 2 สำเร็จแล้ว

4. **ตรวจสอบบริดจ์จาก OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   รายการ iMessage ควรรายงาน `works` และ `imsg status --json | jq '{rpc_methods, selectors}'` ควรแสดงความสามารถที่บิลด์ macOS ของคุณเปิดให้ใช้ การสร้างโพลต้องใช้ `selectors.pollPayloadMessage`; การโหวตต้องใช้ทั้ง `selectors.pollVoteMessage` และเมธอด RPC `poll.vote` Plugin ของ OpenClaw จะประกาศเฉพาะการดำเนินการที่โพรบในแคชรองรับ ส่วนแคชว่างจะยังคงมองในแง่ดีและทำการโพรบเมื่อส่งครั้งแรก

หาก `openclaw channels status --probe` รายงานช่องทางเป็น `works` แต่การดำเนินการบางอย่างส่งข้อผิดพลาด "iMessage `<action>` requires the imsg private API bridge" ขณะส่ง ให้เรียกใช้ `imsg launch` อีกครั้ง — ตัวช่วยอาจหลุดออกได้ (เช่น Messages.app รีสตาร์ต, อัปเดต OS เป็นต้น) และสถานะ `available: true` ในแคชจะยังคงประกาศการดำเนินการจนกว่าโพรบครั้งถัดไปจะรีเฟรช

### เมื่อยังเปิดใช้งาน SIP

หากโมเดลภัยคุกคามของคุณไม่ยอมรับการปิดใช้งาน SIP:

- `imsg` จะย้อนกลับไปใช้โหมดพื้นฐาน — รองรับเฉพาะข้อความ + สื่อ + การรับ
- Plugin ของ OpenClaw ยังคงประกาศการส่งข้อความ/สื่อและการติดตามขาเข้า แต่จะซ่อน `react`, `edit`, `unsend`, `reply`, `sendWithEffect` และการดำเนินการกลุ่มจากพื้นผิวการดำเนินการ (ตามเกตความสามารถรายเมธอด)
- คุณสามารถใช้ Mac ที่ไม่ใช่ Apple Silicon อีกเครื่องหนึ่ง (หรือ Mac สำหรับบอตโดยเฉพาะ) โดยปิด SIP สำหรับเวิร์กโหลด iMessage ขณะที่ยังเปิด SIP บนอุปกรณ์หลัก ดู [ผู้ใช้ macOS สำหรับบอตโดยเฉพาะ (ข้อมูลประจำตัว iMessage แยกต่างหาก)](#deployment-patterns) ด้านล่าง

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.imessage.dmPolicy` ควบคุมข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist` (ต้องมีรายการ `allowFrom` อย่างน้อยหนึ่งรายการ)
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    ฟิลด์รายการอนุญาต: `channels.imessage.allowFrom`

    รายการในรายการอนุญาตต้องระบุผู้ส่ง ได้แก่ แฮนเดิลหรือกลุ่มการเข้าถึงของผู้ส่งแบบคงที่ (`accessGroup:<name>`) ใช้ `channels.imessage.groupAllowFrom` สำหรับเป้าหมายแชต เช่น `chat_id:*`, `chat_guid:*` หรือ `chat_identifier:*`; ใช้ `channels.imessage.groups` สำหรับคีย์รีจิสทรี `chat_id` แบบตัวเลข

  </Tab>

  <Tab title="นโยบายกลุ่ม + การกล่าวถึง">
    `channels.imessage.groupPolicy` ควบคุมการจัดการกลุ่ม:

    - `allowlist` (ค่าเริ่มต้น)
    - `open`
    - `disabled`

    รายการอนุญาตผู้ส่งในกลุ่ม: `channels.imessage.groupAllowFrom`

    รายการ `groupAllowFrom` ยังสามารถอ้างอิงกลุ่มการเข้าถึงของผู้ส่งแบบคงที่ (`accessGroup:<name>`) ได้ด้วย

    การย้อนกลับขณะรันไทม์: หากไม่ได้ตั้งค่า `groupAllowFrom` การตรวจสอบผู้ส่งในกลุ่ม iMessage จะใช้ `allowFrom`; ให้ตั้งค่า `groupAllowFrom` เมื่อต้องการให้การรับ DM และกลุ่มแตกต่างกัน `groupAllowFrom: []` ที่กำหนดเป็นค่าว่างอย่างชัดเจนจะไม่ย้อนกลับ — แต่จะบล็อกผู้ส่งในกลุ่มทั้งหมดภายใต้ `allowlist`
    หมายเหตุเกี่ยวกับรันไทม์: หากไม่มี `channels.imessage` โดยสิ้นเชิง รันไทม์จะย้อนกลับไปใช้ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` แล้วก็ตาม)

    <Warning>
    การกำหนดเส้นทางกลุ่มภายใต้ `groupPolicy: "allowlist"` จะเรียกใช้เกต **สอง** ชั้นต่อเนื่องกัน:

    1. **รายการอนุญาตผู้ส่ง** (`channels.imessage.groupAllowFrom`) — แฮนเดิล, `accessGroup:<name>`, `chat_guid`, `chat_identifier` หรือ `chat_id` รายการที่มีผลเป็นค่าว่าง (ไม่มี `groupAllowFrom` และไม่มีการย้อนกลับไปใช้ `allowFrom`) จะบล็อกผู้ส่งในกลุ่มทุกราย
    2. **รีจิสทรีกลุ่ม** (`channels.imessage.groups`) — บังคับใช้เมื่อแมปมีรายการ: แชตต้องตรงกับรายการต่อ `chat_id` ที่ระบุไว้อย่างชัดเจนหรือไวลด์การ์ด `groups: { "*": { ... } }` เมื่อ `groups` ว่างเปล่าหรือไม่มีอยู่ รายการอนุญาตผู้ส่งเพียงอย่างเดียวจะเป็นตัวตัดสินการรับเข้า

    หากไม่ได้กำหนดรายการอนุญาตผู้ส่งในกลุ่มที่มีผล ข้อความกลุ่มทั้งหมดจะถูกทิ้งก่อนถึงเกตรีจิสทรี แต่ละเกตมีสัญญาณระดับ `warn` ของตนเองที่ระดับบันทึกเริ่มต้น และแต่ละสัญญาณระบุวิธีแก้ที่ต่างกัน:

    - หนึ่งครั้งต่อบัญชีเมื่อเริ่มต้นระบบ เมื่อรายการอนุญาตผู้ส่งในกลุ่มที่มีผลว่างเปล่า: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — แก้โดยตั้งค่า `channels.imessage.groupAllowFrom` (หรือ `allowFrom`); การเพิ่มเฉพาะรายการ `groups` จะยังปล่อยให้เกต 1 บล็อกผู้ส่งทุกราย
    - หนึ่งครั้งต่อ `chat_id` ขณะรันไทม์ เมื่อผู้ส่งผ่านเกต 1 แต่ไม่มีแชตในรีจิสทรี `groups` ที่มีข้อมูล: `imessage: dropping group message from chat_id=<id> ...` — แก้โดยเพิ่ม `chat_id` นั้น (หรือ `"*"`) ภายใต้ `channels.imessage.groups`

    DM ไม่ได้รับผลกระทบ — ใช้เส้นทางโค้ดที่ต่างกัน

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

    `groupAllowFrom` เพียงอย่างเดียวจะอนุญาตผู้ส่งเหล่านั้นในทุกกลุ่ม; เพิ่มบล็อก `groups` เพื่อกำหนดขอบเขตว่าอนุญาตแชตใดบ้าง (และตั้งค่าตัวเลือกต่อแชต เช่น `requireMention`)
    </Warning>

    เกตการกล่าวถึงสำหรับกลุ่ม:

    - iMessage ไม่มีเมทาดาทาการกล่าวถึงแบบเนทีฟ
    - การตรวจจับการกล่าวถึงใช้รูปแบบนิพจน์ทั่วไป (`agents.list[].groupChat.mentionPatterns`, ย้อนกลับไปใช้ `messages.groupChat.mentionPatterns`)
    - หากไม่ได้กำหนดรูปแบบ จะไม่สามารถบังคับใช้เกตการกล่าวถึงได้
    - คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตจะข้ามเกตการกล่าวถึง

    `systemPrompt` ต่อกลุ่ม:

    แต่ละรายการภายใต้ `channels.imessage.groups.*` รับสตริง `systemPrompt` แบบไม่บังคับ ซึ่งจะแทรกลงในพรอมต์ระบบของเอเจนต์ทุกเทิร์นที่จัดการข้อความในกลุ่มนั้น การแก้ค่าทำงานเหมือน `channels.whatsapp.groups`:

    1. **พรอมต์ระบบเฉพาะกลุ่ม** (`groups["<chat_id>"].systemPrompt`): ใช้เมื่อมีรายการเฉพาะกลุ่มนั้นอยู่ในแมป **และ** มีการกำหนดคีย์ `systemPrompt` หาก `systemPrompt` เป็นสตริงว่าง (`""`) ไวลด์การ์ดจะถูกระงับและจะไม่มีการใช้พรอมต์ระบบกับกลุ่มนั้น
    2. **พรอมต์ระบบไวลด์การ์ดของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อไม่มีรายการเฉพาะกลุ่มนั้นอยู่ในแมปเลย หรือเมื่อมีรายการแต่ไม่ได้กำหนดคีย์ `systemPrompt`

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
              // ระงับอย่างชัดเจน: ไวลด์การ์ด "ใช้การสะกดแบบอังกฤษ" ไม่มีผลที่นี่
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    พรอมต์ต่อกลุ่มใช้กับข้อความกลุ่มเท่านั้น — ข้อความโดยตรงไม่ได้รับผลกระทบ

  </Tab>

  <Tab title="เซสชันและการตอบกลับแบบกำหนดผลลัพธ์ได้">
    - DM ใช้การกำหนดเส้นทางโดยตรง; กลุ่มใช้การกำหนดเส้นทางกลุ่ม
    - เมื่อใช้ `session.dmScope=main` เริ่มต้น DM ของ iMessage จะรวมเข้าสู่เซสชันหลักของเอเจนต์
    - เซสชันกลุ่มแยกจากกัน (`agent:<agentId>:imessage:group:<chat_id>`)
    - การตอบกลับจะถูกกำหนดเส้นทางกลับไปยัง iMessage โดยใช้เมทาดาทาช่องทาง/เป้าหมายต้นทาง

    ลักษณะการทำงานของเธรดแบบกลุ่ม:

    เธรด iMessage ที่มีผู้เข้าร่วมหลายคนบางเธรดอาจมาพร้อม `is_group=false`
    หากกำหนด `chat_id` นั้นไว้อย่างชัดเจนภายใต้ `channels.imessage.groups` OpenClaw จะถือว่าเป็นทราฟฟิกกลุ่ม (เกตกลุ่ม + การแยกเซสชันกลุ่ม)

  </Tab>
</Tabs>

## การผูกการสนทนา ACP

สามารถผูกแชต iMessage กับเซสชัน ACP ได้

โฟลว์ด่วนสำหรับผู้ปฏิบัติงาน:

- เรียกใช้ `/acp spawn codex --bind here` ภายใน DM หรือแชตกลุ่มที่ได้รับอนุญาต
- ข้อความในอนาคตภายในการสนทนา iMessage เดิมจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่สร้างขึ้น
- `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP ที่ผูกไว้เดิมโดยไม่เปลี่ยนการผูก
- `/acp close` จะปิดเซสชัน ACP และลบการผูก

การผูกถาวรที่กำหนดค่าไว้ใช้รายการ `bindings[]` ระดับบนสุดร่วมกับ `type: "acp"` และ `match.channel: "imessage"`

`match.peer.id` สามารถใช้:

- แฮนเดิล DM ที่ปรับเป็นมาตรฐาน เช่น `+15555550123` หรือ `user@example.com`
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

ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับลักษณะการทำงานร่วมกันของการผูก ACP

## รูปแบบการปรับใช้

<AccordionGroup>
  <Accordion title="ผู้ใช้ macOS สำหรับบอตโดยเฉพาะ (ข้อมูลประจำตัว iMessage แยกต่างหาก)">
    ใช้ Apple ID และผู้ใช้ macOS โดยเฉพาะ เพื่อแยกทราฟฟิกของบอตออกจากโปรไฟล์ Messages ส่วนตัว

    โฟลว์ทั่วไป:

    1. สร้าง/ลงชื่อเข้าใช้ผู้ใช้ macOS เฉพาะ
    2. ลงชื่อเข้าใช้ Messages ด้วย Apple ID ของบอตในผู้ใช้นั้น
    3. ติดตั้ง `imsg` ในผู้ใช้นั้น
    4. สร้างตัวห่อหุ้ม SSH เพื่อให้ OpenClaw เรียกใช้ `imsg` ในบริบทของผู้ใช้นั้นได้
    5. กำหนดให้ `channels.imessage.accounts.<id>.cliPath` และ `.dbPath` ชี้ไปยังโปรไฟล์ผู้ใช้นั้น

    การเรียกใช้ครั้งแรกอาจต้องอนุมัติผ่าน GUI (Automation + Full Disk Access) ในเซสชันผู้ใช้ของบอตนั้น

  </Accordion>

  <Accordion title="Mac ระยะไกลผ่าน Tailscale (ตัวอย่าง)">
    โทโพโลยีทั่วไป:

    - Gateway ทำงานบน Linux/VM
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

    ใช้คีย์ SSH เพื่อให้ทั้ง SSH และ SCP ทำงานแบบไม่โต้ตอบ
    ตรวจสอบให้แน่ใจว่าเชื่อถือคีย์ของโฮสต์ก่อน (เช่น `ssh bot@mac-mini.tailnet-1234.ts.net`) เพื่อให้มีการเติมข้อมูลใน `known_hosts`

  </Accordion>

  <Accordion title="รูปแบบหลายบัญชี">
    iMessage รองรับการกำหนดค่าต่อบัญชีภายใต้ `channels.imessage.accounts`

    แต่ละบัญชีสามารถแทนที่ฟิลด์ต่างๆ เช่น `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, การตั้งค่าประวัติ และรายการอนุญาตของรูทไฟล์แนบ

  </Accordion>

  <Accordion title="ประวัติข้อความส่วนตัว">
    ตั้งค่า `channels.imessage.dmHistoryLimit` เพื่อเติมประวัติ `imsg` ที่ถอดรหัสล่าสุดของการสนทนานั้นเป็นข้อมูลเริ่มต้นให้เซสชันข้อความส่วนตัวใหม่ ใช้ `channels.imessage.dms["<sender>"].historyLimit` สำหรับการแทนค่าต่อผู้ส่ง รวมถึง `0` เพื่อปิดใช้ประวัติสำหรับผู้ส่งรายหนึ่ง

    ระบบจะดึงประวัติ DM ของ iMessage ตามต้องการจาก `imsg` การไม่ตั้งค่า `dmHistoryLimit` จะปิดการเติมประวัติ DM ส่วนกลางเป็นข้อมูลเริ่มต้น แต่ค่า `channels.imessage.dms["<sender>"].historyLimit` ต่อผู้ส่งที่เป็นค่าบวกจะยังคงเปิดใช้การเติมข้อมูลเริ่มต้นสำหรับผู้ส่งรายนั้น

  </Accordion>
</AccordionGroup>

## สื่อ การแบ่งส่วน และเป้าหมายการส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบและสื่อ">
    - การรับไฟล์แนบขาเข้า **ปิดอยู่โดยค่าเริ่มต้น** — ตั้งค่า `channels.imessage.includeAttachments: true` เพื่อส่งต่อรูปภาพ บันทึกเสียง วิดีโอ และไฟล์แนบอื่นๆ ไปยังเอเจนต์ เมื่อปิดอยู่ iMessage ที่มีเฉพาะไฟล์แนบจะถูกละทิ้งก่อนถึงเอเจนต์ และอาจไม่มีบรรทัดบันทึก `Inbound message` เลย
    - สามารถดึงพาธไฟล์แนบระยะไกลผ่าน SCP ได้เมื่อตั้งค่า `remoteHost`
    - พาธไฟล์แนบต้องตรงกับรูทที่อนุญาต:
      - `channels.imessage.attachmentRoots` (ภายในเครื่อง)
      - `channels.imessage.remoteAttachmentRoots` (โหมด SCP ระยะไกล)
      - รูทที่กำหนดค่าจะขยายรูปแบบรูทเริ่มต้น `/Users/*/Library/Messages/Attachments` (ผสาน ไม่ใช่แทนที่)
    - SCP ใช้การตรวจสอบคีย์โฮสต์แบบเข้มงวด (`StrictHostKeyChecking=yes`)
    - ขนาดสื่อขาออกใช้ `channels.imessage.mediaMaxMb` (ค่าเริ่มต้น 16 MB)

  </Accordion>

  <Accordion title="ข้อความขาออกและการแบ่งส่วน">
    - ขีดจำกัดส่วนข้อความ: `channels.imessage.textChunkLimit` (ค่าเริ่มต้น 4000)
    - โหมดการแบ่งส่วน: `channels.imessage.streaming.chunkMode`
      - `length` (ค่าเริ่มต้น)
      - `newline` (แบ่งตามย่อหน้าก่อน)
    - ตัวหนา/ตัวเอียง/ขีดเส้นใต้/ขีดทับแบบ Markdown ขาออกจะถูกแปลงเป็นข้อความที่มีรูปแบบเนทีฟ (ผู้รับที่ใช้ macOS 15+ จะแสดงรูปแบบ ส่วนผู้รับที่ใช้เวอร์ชันเก่ากว่าจะแสดงข้อความธรรมดาโดยไม่มีเครื่องหมาย); ตาราง Markdown จะถูกแปลงตามโหมดตาราง Markdown ของช่องทาง
    - `channels.imessage.sendTransport` (ค่าเริ่มต้น `auto`, `bridge`, `applescript`) เลือกวิธีที่ `imsg` ใช้ส่งข้อความ

  </Accordion>

  <Accordion title="รูปแบบการระบุที่อยู่">
    เป้าหมายแบบชัดเจนที่แนะนำ:

    - `chat_id:123` (แนะนำสำหรับการกำหนดเส้นทางที่เสถียร)
    - `chat_guid:...`
    - `chat_identifier:...`

    รองรับเป้าหมายแบบแฮนเดิลด้วย:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## การดำเนินการของ API ส่วนตัว

เมื่อ `imsg launch` ทำงานอยู่และ `openclaw channels status --probe` รายงาน `privateApi.available: true` เครื่องมือข้อความจะสามารถใช้การดำเนินการแบบเนทีฟของ iMessage เพิ่มเติมจากการส่งข้อความปกติได้

การดำเนินการทั้งหมดเปิดใช้อยู่โดยค่าเริ่มต้น ใช้ `channels.imessage.actions` เพื่อปิดการดำเนินการแต่ละรายการ:

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
    - **react**: เพิ่ม/ลบ Tapback ของ iMessage (`messageId`, `emoji`, `remove`) Tapback ที่รองรับจะจับคู่กับรัก ถูกใจ ไม่ถูกใจ หัวเราะ เน้น และคำถาม การลบโดยไม่ระบุอีโมจิจะล้าง Tapback ใดก็ตามที่ตั้งไว้
    - **reply**: ส่งการตอบกลับแบบเธรดไปยังข้อความที่มีอยู่ (`messageId`, `text` หรือ `message` พร้อมด้วย `chatGuid`, `chatId`, `chatIdentifier` หรือ `to`) การตอบกลับพร้อมไฟล์แนบยังต้องใช้บิลด์ `imsg` ที่ `send-rich` รองรับ `--file`
    - **sendWithEffect**: ส่งข้อความพร้อมเอฟเฟ็กต์ iMessage (`text` หรือ `message`, `effect` หรือ `effectId`) ชื่อย่อ: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight
    - **edit**: แก้ไขข้อความที่ส่งแล้วบน macOS/เวอร์ชัน API ส่วนตัวที่รองรับ (`messageId`, `text` หรือ `newText`) แก้ไขได้เฉพาะข้อความที่ Gateway ส่งเองเท่านั้น
    - **unsend**: ถอนข้อความที่ส่งแล้วบน macOS/เวอร์ชัน API ส่วนตัวที่รองรับ (`messageId`) ยกเลิกการส่งได้เฉพาะข้อความที่ Gateway ส่งเองเท่านั้น
    - **upload-file**: ส่งสื่อ/ไฟล์ (`buffer` ในรูปแบบ base64 หรือ `media`/`path`/`filePath` ที่เติมข้อมูลแล้ว, `filename`, และ `asVoice` ซึ่งระบุหรือไม่ก็ได้) นามแฝงแบบเดิม: `sendAttachment`
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: จัดการแชตกลุ่มเมื่อเป้าหมายปัจจุบันเป็นการสนทนากลุ่ม การดำเนินการเหล่านี้จะเปลี่ยนข้อมูลประจำตัว Messages ของโฮสต์ จึงต้องใช้ผู้ส่งที่เป็นเจ้าของหรือไคลเอ็นต์ Gateway `operator.admin`
    - **poll**: สร้างแบบสำรวจเนทีฟของ Apple Messages (`pollQuestion`, ทำซ้ำ `pollOption` 2 ถึง 12 ครั้ง พร้อมด้วย `chatGuid`, `chatId`, `chatIdentifier` หรือ `to`) ผู้รับบน iOS/iPadOS/macOS 26+ จะเห็นและลงคะแนนแบบเนทีฟ ส่วนระบบปฏิบัติการเวอร์ชันเก่ากว่าจะได้รับข้อความสำรอง "ส่งแบบสำรวจแล้ว" ต้องใช้ `selectors.pollPayloadMessage`
    - **poll-vote**: ลงคะแนนในแบบสำรวจที่มีอยู่ (`pollId` หรือ `messageId` พร้อมกับหนึ่งรายการจาก `pollOptionIndex`, `pollOptionId` หรือ `pollOptionText` เท่านั้น) ต้องใช้ `selectors.pollVoteMessage` และเมธอด RPC `poll.vote`

    แบบสำรวจขาเข้าที่ได้รับการยอมรับจะแสดงแก่เอเจนต์พร้อมคำถาม ป้ายกำกับตัวเลือกแบบมีหมายเลข จำนวนคะแนน และ ID ข้อความแบบสำรวจที่ `poll-vote` ต้องใช้

  </Accordion>

  <Accordion title="ID ข้อความ">
    บริบท iMessage ขาเข้ามีทั้งค่า `MessageSid` แบบสั้นและ GUID ข้อความแบบเต็ม (`MessageSidFull`) เมื่อมี ID แบบสั้นมีขอบเขตอยู่ในแคชการตอบกลับล่าสุดที่ใช้ SQLite และจะถูกตรวจสอบกับแชตปัจจุบันก่อนใช้งาน หาก ID แบบสั้นหมดอายุ ให้ลองใหม่ด้วย `MessageSidFull` ของ ID นั้นโดยกำหนดเป้าหมายเป็นการสนทนาที่ให้ ID ดังกล่าว ID แบบเต็มไม่สามารถข้ามการผูกกับการสนทนาหรือบัญชีได้ ดังนั้นให้แทนที่ ID จากแชตอื่นด้วย ID จากเป้าหมายปัจจุบัน การเรียกที่มอบหมายจากระยะไกลอาจปฏิเสธ ID แบบเต็มที่ล้าสมัยเมื่อไม่มีหลักฐานของการสนทนาปัจจุบัน

  </Accordion>

  <Accordion title="การตรวจหาความสามารถ">
    OpenClaw จะซ่อนการดำเนินการของ API ส่วนตัวก็ต่อเมื่อสถานะโพรบที่แคชไว้ระบุว่าบริดจ์ไม่พร้อมใช้งานเท่านั้น หากไม่ทราบสถานะ การดำเนินการจะยังคงแสดงอยู่และจะส่งโพรบแบบเลซี เพื่อให้การดำเนินการครั้งแรกสำเร็จได้หลังจาก `imsg launch` โดยไม่ต้องรีเฟรชสถานะด้วยตนเองแยกต่างหาก

  </Accordion>

  <Accordion title="ใบตอบรับการอ่านและสถานะกำลังพิมพ์">
    เมื่อบริดจ์ API ส่วนตัวทำงาน แชตขาเข้าที่ได้รับการยอมรับจะถูกทำเครื่องหมายว่าอ่านแล้ว และแชตโดยตรงจะแสดงฟองสถานะกำลังพิมพ์ทันทีที่รับเทิร์น ขณะที่เอเจนต์เตรียมบริบทและสร้างคำตอบ ปิดการทำเครื่องหมายว่าอ่านแล้วด้วย:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    บิลด์ `imsg` รุ่นเก่าที่มีมาก่อนรายการความสามารถต่อเมธอดจะปิดสถานะกำลังพิมพ์/การอ่านโดยไม่แจ้งให้ทราบ OpenClaw จะบันทึกคำเตือนหนึ่งครั้งต่อการรีสตาร์ต เพื่อให้ระบุสาเหตุของใบตอบรับที่หายไปได้

  </Accordion>

  <Accordion title="Tapback ขาเข้า">
    OpenClaw สมัครรับ Tapback ของ iMessage และกำหนดเส้นทางรีแอ็กชันที่ได้รับการยอมรับเป็นเหตุการณ์ระบบแทนข้อความปกติ ดังนั้น Tapback ของผู้ใช้จะไม่กระตุ้นลูปการตอบกลับตามปกติ

    โหมดการแจ้งเตือนควบคุมโดย `channels.imessage.reactionNotifications`:

    - `"own"` (ค่าเริ่มต้น): แจ้งเตือนเฉพาะเมื่อผู้ใช้แสดงรีแอ็กชันต่อข้อความที่บอตเขียน
    - `"all"`: แจ้งเตือน Tapback ขาเข้าทั้งหมดจากผู้ส่งที่ได้รับอนุญาต
    - `"off"`: ละเว้น Tapback ขาเข้า

    การแทนค่าต่อบัญชีใช้ `channels.imessage.accounts.<id>.reactionNotifications`

  </Accordion>

  <Accordion title="รีแอ็กชันการอนุมัติ (👍 / 👎)">
    เมื่อ `approvals.exec.enabled` หรือ `approvals.plugin.enabled` เป็น true และคำขอถูกกำหนดเส้นทางไปยัง iMessage Gateway จะส่งพรอมต์การอนุมัติแบบเนทีฟและยอมรับ Tapback เพื่อดำเนินการให้เสร็จสิ้น:

    - `👍` (Tapback ถูกใจ) → `allow-once`
    - `👎` (Tapback ไม่ถูกใจ) → `deny`
    - `allow-always` ยังคงเป็นทางเลือกสำรองแบบดำเนินการเอง: ส่ง `/approve <id> allow-always` เป็นการตอบกลับปกติ

    การจัดการรีแอ็กชันกำหนดให้แฮนเดิลของผู้ใช้ที่แสดงรีแอ็กชันต้องเป็นผู้อนุมัติที่ระบุไว้อย่างชัดเจน ระบบจะอ่านรายชื่อผู้อนุมัติจาก `channels.imessage.allowFrom` (หรือ `channels.imessage.accounts.<id>.allowFrom`) ให้เพิ่มหมายเลขโทรศัพท์ของผู้ใช้ในรูปแบบ E.164 หรืออีเมล Apple ID ของผู้ใช้ (เป้าหมายแชต เช่น `chat_id:*` ใช้เป็นรายการผู้อนุมัติไม่ได้) รองรับรายการไวลด์การ์ด `"*"` แต่จะอนุญาตให้ผู้ส่งคนใดก็ได้อนุมัติ หากรายชื่อผู้อนุมัติว่างเปล่า ทางลัดด้วยรีแอ็กชันจะถูกปิดทั้งหมด ทางลัดด้วยรีแอ็กชันจงใจข้าม `reactionNotifications`, `dmPolicy` และ `groupAllowFrom` เนื่องจากรายการอนุญาตของผู้อนุมัติที่ระบุไว้อย่างชัดเจนเป็นด่านตรวจสอบเดียวที่มีผลต่อการดำเนินการอนุมัติให้เสร็จสิ้น

    การอนุญาตคำสั่งข้อความ `/approve` ใช้รายการเดียวกัน: เมื่อ `channels.imessage.allowFrom` ไม่ว่างเปล่า ระบบจะตรวจสอบสิทธิ์ `/approve <id> <decision>` กับรายชื่อผู้อนุมัตินั้น (ไม่ใช่รายการอนุญาต DM ที่กว้างกว่า) และผู้ส่งที่ได้รับอนุญาตในรายการอนุญาต DM แต่ไม่มีอยู่ใน `allowFrom` จะได้รับการปฏิเสธอย่างชัดเจน เมื่อ `allowFrom` ว่างเปล่า ทางเลือกสำรองในแชตเดียวกันจะยังคงมีผล และ `/approve` จะอนุญาตทุกคนที่รายการอนุญาต DM อนุญาต เพิ่มผู้ปฏิบัติงานทุกคนที่ควรอนุมัติ — ผ่าน `/approve` หรือผ่านรีแอ็กชัน — ลงใน `allowFrom`

    หมายเหตุสำหรับผู้ปฏิบัติงาน:
    - การผูกรีแอ็กชันจะถูกจัดเก็บทั้งในหน่วยความจำและในที่เก็บแบบคีย์ถาวรของ Gateway (กำหนด TTL ให้ตรงกับเวลาหมดอายุของการอนุมัติ) และ Gateway ยังสำรวจพรอมต์ที่รอดำเนินการเพื่อหา tapback ด้วย ดังนั้น tapback ที่มาถึงไม่นานหลังจาก Gateway รีสตาร์ตจะยังคงดำเนินการอนุมัติได้
    - tapback `is_from_me=true` ของผู้ปฏิบัติงานเอง (ตัวอย่างเช่น จากอุปกรณ์ Apple ที่จับคู่ไว้) จะดำเนินการอนุมัติเมื่อแฮนเดิลนั้นเป็นผู้อนุมัติที่ระบุไว้อย่างชัดเจน
    - พรอมต์การอนุมัติจะถูกส่งไปยังการสนทนากลุ่มเฉพาะเมื่อมีการกำหนดผู้อนุมัติไว้อย่างชัดเจน มิฉะนั้นสมาชิกกลุ่มคนใดก็สามารถอนุมัติได้
    - tapback แบบข้อความรุ่นเก่า (ข้อความธรรมดา `Liked "…"` จากไคลเอนต์ Apple รุ่นเก่ามาก) ไม่สามารถดำเนินการอนุมัติได้ เนื่องจากไม่มี GUID ของข้อความ การดำเนินการผ่านรีแอ็กชันต้องใช้ข้อมูลเมตา tapback ที่มีโครงสร้างซึ่งไคลเอนต์ macOS / iOS ปัจจุบันส่งออกมา

  </Accordion>
</AccordionGroup>

## การเขียนการกำหนดค่า

ตามค่าเริ่มต้น iMessage อนุญาตให้ช่องทางเริ่มเขียนการกำหนดค่าได้ (สำหรับ `/config set|unset` เมื่อ `commands.config: true`)

ปิดใช้งาน:

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

## การรวม DM ที่ถูกแยกส่ง (คำสั่ง + URL ในการเขียนครั้งเดียว)

เมื่อผู้ใช้พิมพ์คำสั่งและ URL พร้อมกัน เช่น `Dump https://example.com/article` แอป Messages ของ Apple จะแยกการส่งออกเป็น **แถว `chat.db` สองแถวแยกกัน**:

1. ข้อความตัวอักษร (`"Dump"`)
2. บอลลูนตัวอย่าง URL (`"https://..."`) พร้อมรูปภาพตัวอย่าง OG เป็นไฟล์แนบ

ในการตั้งค่าส่วนใหญ่ แถวทั้งสองจะมาถึง OpenClaw ห่างกันประมาณ 0.8-2.0 วินาที หากไม่มีการรวม เอเจนต์จะได้รับเฉพาะคำสั่งในเทิร์นที่ 1 (และมักตอบว่า "ส่ง URL มาให้ฉัน") ก่อนที่ URL จะมาถึงในเทิร์นที่ 2 นี่เป็นไปป์ไลน์การส่งของ Apple ไม่ใช่สิ่งที่ OpenClaw หรือ `imsg` ทำให้เกิดขึ้น

`channels.imessage.coalesceSameSenderDms` เลือกให้ DM บัฟเฟอร์แถวต่อเนื่องจากผู้ส่งคนเดียวกัน เมื่อ `imsg` เปิดเผยเครื่องหมายตัวอย่าง URL เชิงโครงสร้าง `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` ในแถวต้นทางแถวหนึ่ง OpenClaw จะรวมเฉพาะการแยกส่งจริงนั้น และคงแถวอื่นที่บัฟเฟอร์ไว้เป็นเทิร์นแยกกัน ในบิลด์ `imsg` รุ่นเก่าที่ไม่ส่งข้อมูลเมตาบอลลูนเลย OpenClaw ไม่สามารถแยกแยะการแยกส่งออกจากการส่งแยกกันได้ จึงย้อนกลับไปใช้การรวมบัคเก็ต วิธีนี้รักษาพฤติกรรมก่อนมีข้อมูลเมตาไว้ แทนที่จะทำให้การแยกส่ง `Dump <url>` ถดถอยกลายเป็นสองเทิร์น แชตกลุ่มยังคงส่งต่อทีละข้อความเพื่อรักษาโครงสร้างเทิร์นที่มีผู้ใช้หลายคน

<Tabs>
  <Tab title="ควรเปิดใช้เมื่อใด">
    เปิดใช้เมื่อ:

    - คุณเผยแพร่ Skills ที่คาดหวัง `command + payload` ภายในข้อความเดียว (dump, paste, save, queue เป็นต้น)
    - ผู้ใช้ของคุณวาง URL พร้อมกับคำสั่ง
    - คุณยอมรับเวลาแฝงเพิ่มเติมของเทิร์น DM ได้ (ดูด้านล่าง)

    ปิดไว้เมื่อ:

    - คุณต้องการเวลาแฝงของคำสั่งต่ำที่สุดสำหรับทริกเกอร์ DM แบบคำเดียว
    - โฟลว์ทั้งหมดของคุณเป็นคำสั่งแบบครั้งเดียวที่ไม่มีเพย์โหลดตามมา

  </Tab>
  <Tab title="การเปิดใช้">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // เลือกเปิดใช้ (ค่าเริ่มต้น: false)
        },
      },
    }
    ```

    เมื่อเปิดแฟล็กและไม่ได้กำหนด `messages.inbound.byChannel.imessage` หรือ `messages.inbound.debounceMs` ส่วนกลางไว้อย่างชัดเจน ช่วงดีบาวซ์จะขยายเป็น **7000 ms** (ค่าเริ่มต้นเดิมคือ 0 ms — ไม่มีการดีบาวซ์) จำเป็นต้องใช้ช่วงที่กว้างขึ้น เนื่องจากจังหวะการแยกส่งตัวอย่าง URL ของ Apple อาจยืดออกไปหลายวินาทีระหว่างที่ Messages.app ส่งแถวตัวอย่างออกมา

    หากต้องการปรับช่วงด้วยตนเอง:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms ครอบคลุมความล่าช้าของตัวอย่าง URL ใน Messages.app ที่พบจากการสังเกต
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="ข้อแลกเปลี่ยน">
    - **การรวมอย่างแม่นยำต้องใช้ข้อมูลเมตาเพย์โหลด `imsg` ปัจจุบัน** เมื่อมี `balloon_bundle_id` ระบบจะรวมเฉพาะการแยกส่งจริงเท่านั้น การรวมสำรองแบบไม่มีข้อมูลเมตาที่อธิบายข้างต้นเป็นความเข้ากันได้ย้อนหลังชั่วคราว และจะถูกนำออกเมื่อ `imsg` รวมการแยกส่งที่ต้นทางแล้ว
    - **เวลาแฝงเพิ่มเติมสำหรับข้อความ DM** เมื่อเปิดแฟล็ก DM ทุกข้อความ (รวมถึงคำสั่งควบคุมแบบเดี่ยวและข้อความติดตามผลแบบข้อความเดียว) จะรอได้นานถึงช่วงดีบาวซ์ก่อนส่งต่อ เผื่อมีแถวตัวอย่าง URL กำลังจะมาถึง ข้อความแชตกลุ่มยังคงส่งต่อทันที
    - **เอาต์พุตที่รวมแล้วมีขอบเขตจำกัด** ข้อความที่รวมจำกัดไว้ที่ 4000 อักขระพร้อมเครื่องหมาย `…[truncated]` ที่ชัดเจน ไฟล์แนบจำกัดที่ 20 รายการ และรายการต้นทางจำกัดที่ 10 รายการ (หากเกินกว่านั้นจะเก็บรายการแรกและรายการล่าสุดไว้) GUID ต้นทางทุกรายการจะถูกติดตามใน `coalescedMessageGuids` สำหรับเทเลเมทรีปลายทาง
    - **เฉพาะ DM** แชตกลุ่มจะใช้การส่งต่อทีละข้อความ เพื่อให้บอตยังตอบสนองได้เมื่อมีหลายคนกำลังพิมพ์
    - **เลือกเปิดใช้แยกตามช่องทาง** ช่องทางอื่น (Discord, Slack, Telegram, WhatsApp, …) จะไม่ได้รับผลกระทบ การกำหนดค่า BlueBubbles รุ่นเก่าที่ตั้งค่า `channels.bluebubbles.coalesceSameSenderDms` ควรย้ายค่านั้นไปยัง `channels.imessage.coalesceSameSenderDms`

  </Tab>
</Tabs>

### สถานการณ์และสิ่งที่เอเจนต์เห็น

คอลัมน์ "เปิดแฟล็ก" แสดงพฤติกรรมในบิลด์ `imsg` ที่ส่ง `balloon_bundle_id` ในบิลด์ `imsg` รุ่นเก่าที่ไม่ส่งข้อมูลเมตาบอลลูนเลย แถวด้านล่างที่ระบุว่า "สองเทิร์น" / "N เทิร์น" จะย้อนกลับไปใช้การรวมแบบเดิมแทน (หนึ่งเทิร์น): OpenClaw ไม่สามารถแยกการแยกส่งออกจากการส่งแยกกันในเชิงโครงสร้างได้ จึงรักษาการรวมก่อนมีข้อมูลเมตาไว้ การแยกอย่างแม่นยำจะเริ่มทำงานเมื่อบิลด์ส่งข้อมูลเมตาบอลลูน

| สิ่งที่ผู้ใช้เขียน                                                      | สิ่งที่ `chat.db` สร้าง                  | ปิดแฟล็ก (ค่าเริ่มต้น)                      | เปิดแฟล็ก + ช่วงเวลา (imsg ส่งข้อมูลเมตาบอลลูน)                                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (ส่งครั้งเดียว)                              | 2 แถวห่างกันประมาณ 1 วินาที                   | เอเจนต์สองเทิร์น: "Dump" อย่างเดียว แล้วจึง URL | หนึ่งเทิร์น: ข้อความที่รวมแล้ว `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (ไฟล์แนบ + ข้อความ)                | 2 แถวที่ไม่มีข้อมูลเมตาบอลลูน URL | สองเทิร์น                               | สองเทิร์นหลังตรวจพบข้อมูลเมตา หนึ่งเทิร์นที่รวมแล้วในเซสชันเก่า/ก่อนการล็อกที่ไม่มีข้อมูลเมตา       |
| `/status` (คำสั่งเดี่ยว)                                     | 1 แถว                               | ส่งต่อทันที                        | **รอได้นานถึงช่วงเวลา แล้วจึงส่งต่อ**                                                                |
| วาง URL เพียงอย่างเดียว                                                   | 1 แถว                               | ส่งต่อทันที                        | รอได้นานถึงช่วงเวลา แล้วจึงส่งต่อ                                                                    |
| ส่งข้อความ + URL เป็นสองข้อความแยกกันโดยเจตนา ห่างกันหลายนาที | 2 แถวที่อยู่นอกช่วงเวลา               | สองเทิร์น                               | สองเทิร์น (ช่วงเวลาหมดระหว่างสองข้อความ)                                                             |
| ส่ง DM ขนาดเล็กอย่างรวดเร็ว (>10 ข้อความภายในช่วงเวลา)                          | N แถวที่ไม่มีข้อมูลเมตาบอลลูน URL | N เทิร์น                                 | N เทิร์นหลังตรวจพบข้อมูลเมตา หนึ่งเทิร์นที่รวมแบบมีขอบเขตในเซสชันเก่า/ก่อนการล็อกที่ไม่มีข้อมูลเมตา |
| คนสองคนกำลังพิมพ์ในแชตกลุ่ม                                  | N แถวจากผู้ส่ง M คน               | M+ เทิร์น (หนึ่งเทิร์นต่อบัคเก็ตผู้ส่ง)        | M+ เทิร์น — แชตกลุ่มจะไม่ถูกรวม                                                            |

## การกู้คืนขาเข้าหลังบริดจ์หรือ Gateway รีสตาร์ต

iMessage กู้คืนข้อความที่พลาดไประหว่าง Gateway หยุดทำงาน และในขณะเดียวกันก็ระงับ "ระเบิดแบ็กล็อก" เก่าที่ Apple อาจปล่อยออกมาหลังการกู้คืน Push พฤติกรรมเริ่มต้นจะเปิดอยู่เสมอและสร้างขึ้นบนการขจัดรายการซ้ำขาเข้า

- **การขจัดรายการซ้ำจากการเล่นซ้ำ** ข้อความขาเข้าทุกข้อความที่ส่งต่อจะถูกบันทึกด้วย Apple GUID ในสถานะ Plugin แบบถาวร (`imessage.inbound-dedupe`) โดยจะถูกอ้างสิทธิ์เมื่อรับเข้าและคอมมิตหลังประมวลผล (ปล่อยสิทธิ์เมื่อเกิดความล้มเหลวชั่วคราวเพื่อให้ลองใหม่ได้) รายการใดก็ตามที่ประมวลผลแล้วจะถูกทิ้งแทนที่จะส่งต่อซ้ำ นี่คือสิ่งที่ช่วยให้การกู้คืนเล่นซ้ำได้อย่างเต็มที่โดยไม่ต้องทำบัญชีแยกแต่ละข้อความ
- **การกู้คืนช่วงหยุดทำงาน** เมื่อเริ่มต้น มอนิเตอร์จะจดจำ rowid ล่าสุดของ `chat.db` ที่ส่งต่อแล้ว (เคอร์เซอร์แยกตามบัญชีที่จัดเก็บถาวร) และส่งไปยัง `imsg watch.subscribe` เป็น `since_rowid` เพื่อให้ imsg เล่นซ้ำแถวที่มาถึงระหว่าง Gateway หยุดทำงาน จากนั้นจึงติดตามข้อมูลสด การเล่นซ้ำถูกจำกัดไว้ที่ 500 แถวล่าสุดและข้อความที่มีอายุไม่เกินประมาณ 2 ชั่วโมง และการขจัดรายการซ้ำจะทิ้งรายการที่ประมวลผลแล้ว
- **แนวกั้นอายุของแบ็กล็อกเก่า** แถวเหนือขอบเขตการเริ่มต้นเป็นข้อมูลสดจริง หากแถวใดมีวันที่ส่งเก่ากว่าเวลาที่มาถึงมากกว่าประมาณ 15 นาที แถวนั้นคือแบ็กล็อกที่ Push ปล่อยออกมาและจะถูกระงับ แถวที่เล่นซ้ำ (ที่ขอบเขตหรือต่ำกว่า) จะใช้ช่วงการกู้คืนที่กว้างกว่าแทน เพื่อส่งข้อความที่เพิ่งพลาดไปพร้อมกับไม่ส่งประวัติเก่า

การกู้คืนทำงานได้ทั้งกับการตั้งค่า `cliPath` ในเครื่องและระยะไกล เนื่องจากการเล่นซ้ำ `since_rowid` ทำงานผ่านการเชื่อมต่อ RPC `imsg` เดียวกัน ความแตกต่างอยู่ที่ช่วงเวลา: เมื่อ Gateway สามารถอ่าน `chat.db` ได้ (ในเครื่อง) ระบบจะยึดขอบเขต rowid เริ่มต้น จำกัดช่วงการเล่นซ้ำ และส่งข้อความที่พลาดไปซึ่งมีอายุไม่เกินสองสามชั่วโมง เมื่อใช้ `cliPath` ระยะไกลผ่าน SSH ระบบไม่สามารถอ่านฐานข้อมูลได้ ดังนั้นการเล่นซ้ำจึงไม่มีขีดจำกัดและทุกแถวจะใช้แนวกั้นอายุของข้อมูลสด ระบบยังคงกู้คืนข้อความที่เพิ่งพลาดไปและยังคงระงับแบ็กล็อกเก่า เพียงแต่ใช้ช่วงข้อมูลสดที่แคบกว่า เรียกใช้ Gateway บน Mac ที่ใช้ Messages เพื่อให้ได้ช่วงการกู้คืนที่กว้างกว่า

### สัญญาณที่ผู้ปฏิบัติงานมองเห็น

แบ็กล็อกที่ถูกระงับจะถูกบันทึกในระดับเริ่มต้นเสมอ ไม่เคยถูกทิ้งโดยไม่มีการแจ้งเตือน (แฟล็ก `recovery` แสดงว่ามีการใช้ช่วงใด):

```text
imessage: ระงับแบ็กล็อกขาเข้าที่เก่าแล้ว account=<id> sent=<iso> recovery=<bool> (ระงับแล้ว <N> รายการนับตั้งแต่เริ่มต้น)
```

### การย้ายข้อมูล

`channels.imessage.catchup.*` เลิกใช้แล้ว — การกู้คืนช่วงหยุดทำงานเป็นแบบอัตโนมัติและไม่ต้องกำหนดค่าสำหรับการตั้งค่าใหม่ การกำหนดค่าที่มีอยู่ซึ่งระบุ `catchup.enabled: true` จะยังคงได้รับการรองรับในฐานะโปรไฟล์ความเข้ากันได้สำหรับช่วงการเล่นซ้ำเพื่อกู้คืน บล็อก catchup ที่ปิดใช้งาน (`enabled: false` หรือไม่มี `enabled: true`) ถูกยกเลิกแล้ว และ `openclaw doctor --fix` จะลบบล็อกเหล่านั้น

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่พบ imsg หรือไม่รองรับ RPC">
    ตรวจสอบไบนารีและการรองรับ RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    หากโพรบรายงานว่าไม่รองรับ RPC ให้อัปเดต `imsg` หากการดำเนินการ API ส่วนตัวใช้งานไม่ได้ ให้เรียกใช้ `imsg launch` ในเซสชันผู้ใช้ macOS ที่เข้าสู่ระบบอยู่ แล้วโพรบอีกครั้ง หาก Gateway ไม่ได้ทำงานบน macOS ให้ใช้การตั้งค่า Mac ระยะไกลผ่าน SSH ข้างต้นแทนพาธ `imsg` ในเครื่องตามค่าเริ่มต้น

  </Accordion>

  <Accordion title="ส่ง Messages ได้ แต่ iMessage ขาเข้าไม่มาถึง">
    ขั้นแรก ให้พิสูจน์ว่าข้อความมาถึง Mac ในเครื่องหรือไม่ หาก `chat.db` ไม่เปลี่ยนแปลง OpenClaw จะไม่สามารถรับข้อความได้ แม้ `imsg status --json` จะรายงานว่าบริดจ์ทำงานปกติก็ตาม

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    หากข้อความที่ส่งจากโทรศัพท์ไม่สร้างแถวใหม่ ให้ซ่อมแซมชั้น macOS Messages และ Apple Push ก่อนเปลี่ยนการกำหนดค่า OpenClaw การรีเฟรชบริการเพียงครั้งเดียวมักเพียงพอ:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    ส่ง iMessage ใหม่จากโทรศัพท์และยืนยันว่ามีแถว `chat.db` ใหม่หรือเหตุการณ์ `imsg watch` ก่อนแก้ไขข้อบกพร่องของเซสชัน OpenClaw อย่าเรียกใช้ขั้นตอนนี้เป็นลูปเปิดบริดจ์ใหม่เป็นระยะ การดำเนินการ `imsg launch` ซ้ำร่วมกับการรีสตาร์ต Gateway ระหว่างที่กำลังทำงานอาจขัดจังหวะการส่งและทำให้การทำงานของช่องทางที่อยู่ระหว่างดำเนินการค้างอยู่

  </Accordion>

  <Accordion title="Gateway ไม่ทำงานบน macOS">
    `cliPath: "imsg"` เริ่มต้นต้องทำงานบน Mac ที่ลงชื่อเข้าใช้ Messages บน Linux หรือ Windows ให้ตั้งค่า `channels.imessage.cliPath` เป็นสคริปต์ตัวห่อที่เชื่อมต่อผ่าน SSH ไปยัง Mac เครื่องนั้นและเรียกใช้ `imsg "$@"`

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    จากนั้นเรียกใช้:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="ระบบเพิกเฉยต่อ DM">
    ตรวจสอบ:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - การอนุมัติการจับคู่ (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="ระบบเพิกเฉยต่อข้อความกลุ่ม">
    ตรวจสอบ:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - ลักษณะการทำงานของรายการอนุญาต `channels.imessage.groups`
    - การกำหนดค่ารูปแบบการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="ไฟล์แนบจากระยะไกลล้มเหลว">
    ตรวจสอบ:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - การยืนยันตัวตนด้วยคีย์ SSH/SCP จากโฮสต์ Gateway
    - มีคีย์โฮสต์อยู่ใน `~/.ssh/known_hosts` บนโฮสต์ Gateway
    - สิทธิ์ในการอ่านพาธระยะไกลบน Mac ที่ใช้งาน Messages

  </Accordion>

  <Accordion title="พลาดข้อความแจ้งขอสิทธิ์ของ macOS">
    เรียกใช้อีกครั้งในเทอร์มินัล GUI แบบโต้ตอบภายใต้บริบทผู้ใช้/เซสชันเดียวกันและอนุมัติข้อความแจ้ง:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    ยืนยันว่าได้ให้สิทธิ์ Full Disk Access + Automation แก่บริบทของกระบวนการที่เรียกใช้ OpenClaw/`imsg`

  </Accordion>
</AccordionGroup>

## ตัวชี้ไปยังเอกสารอ้างอิงการกำหนดค่า

- [เอกสารอ้างอิงการกำหนดค่า - iMessage](/th/gateway/config-channels#imessage)
- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [การจับคู่](/th/channels/pairing)

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การนำ BlueBubbles ออกและพาธ iMessage ของ imsg](/th/announcements/bluebubbles-imessage) — ประกาศและสรุปการย้ายระบบ
- [การย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) — ตารางแปลงการกำหนดค่าและขั้นตอนการเปลี่ยนระบบ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) — ลักษณะการทำงานของแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
