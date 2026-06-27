---
read_when:
    - การตั้งค่าการรองรับ iMessage
    - การดีบักการส่ง/รับ iMessage
summary: รองรับ iMessage แบบเนทีฟผ่าน imsg (JSON-RPC ผ่าน stdio) พร้อมการดำเนินการ API ส่วนตัวสำหรับการตอบกลับ, tapbacks, เอฟเฟกต์, ไฟล์แนบ, และการจัดการกลุ่ม แนะนำสำหรับการตั้งค่า OpenClaw iMessage ใหม่เมื่อข้อกำหนดของโฮสต์เหมาะสม
title: iMessage
x-i18n:
    generated_at: "2026-06-27T17:10:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
สำหรับการปรับใช้ OpenClaw iMessage ให้ใช้ `imsg` บนโฮสต์ macOS Messages ที่ลงชื่อเข้าใช้อยู่ หาก Gateway ของคุณทำงานบน Linux หรือ Windows ให้ชี้ `channels.imessage.cliPath` ไปยังตัวครอบ SSH ที่รัน `imsg` บน Mac

**การกู้คืนขาเข้าเป็นอัตโนมัติ** หลังจากรีสตาร์ทบริดจ์หรือ Gateway แล้ว iMessage จะเล่นซ้ำข้อความที่พลาดไประหว่างที่ระบบหยุดทำงาน และระงับ "backlog bomb" ที่ล้าสมัยซึ่ง Apple อาจปล่อยออกมาหลังการกู้คืน Push พร้อมทำการลบรายการซ้ำเพื่อไม่ให้มีสิ่งใดถูกส่งซ้ำสองครั้ง ไม่มีการตั้งค่าให้เปิดใช้งาน — ดู [การกู้คืนขาเข้าหลังจากรีสตาร์ทบริดจ์หรือ Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart)
</Note>

<Warning>
การรองรับ BlueBubbles ถูกลบออกแล้ว ย้ายคอนฟิก `channels.bluebubbles` ไปยัง `channels.imessage`; OpenClaw รองรับ iMessage ผ่าน `imsg` เท่านั้น เริ่มจาก [การลบ BlueBubbles และเส้นทาง imsg iMessage](/th/announcements/bluebubbles-imessage) สำหรับประกาศแบบย่อ หรือ [ย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) สำหรับตารางการย้ายแบบเต็ม
</Warning>

สถานะ: การผสานรวม CLI ภายนอกแบบเนทีฟ Gateway จะเรียกใช้ `imsg rpc` และสื่อสารผ่าน JSON-RPC บน stdio (ไม่มี daemon/port แยกต่างหาก) การดำเนินการขั้นสูงต้องใช้ `imsg launch` และการตรวจสอบ private API ที่สำเร็จ

<CardGroup cols={3}>
  <Card title="การดำเนินการ Private API" icon="wand-sparkles" href="#private-api-actions">
    การตอบกลับ, tapback, เอฟเฟกต์, ไฟล์แนบ และการจัดการกลุ่ม
  </Card>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ iMessage ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="Mac ระยะไกล" icon="terminal" href="#remote-mac-over-ssh">
    ใช้ตัวครอบ SSH เมื่อ Gateway ไม่ได้ทำงานบน Messages Mac
  </Card>
  <Card title="อ้างอิงการกำหนดค่า" icon="settings" href="/th/gateway/config-channels#imessage">
    อ้างอิงฟิลด์ iMessage ฉบับเต็ม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="Mac ภายในเครื่อง (เส้นทางที่เร็ว)">
    <Steps>
      <Step title="ติดตั้งและตรวจสอบ imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

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
    OpenClaw ต้องการเพียง `cliPath` ที่เข้ากันได้กับ stdio ดังนั้นคุณจึงสามารถชี้ `cliPath` ไปยังสคริปต์ตัวครอบที่ SSH ไปยัง Mac ระยะไกลและรัน `imsg`

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    คอนฟิกที่แนะนำเมื่อเปิดใช้ไฟล์แนบ:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    หากไม่ได้ตั้งค่า `remoteHost` OpenClaw จะพยายามตรวจจับโดยอัตโนมัติจากการแยกวิเคราะห์สคริปต์ตัวครอบ SSH
    `remoteHost` ต้องเป็น `host` หรือ `user@host` (ไม่มีช่องว่างหรือตัวเลือก SSH)
    OpenClaw ใช้การตรวจสอบ host-key แบบเข้มงวดสำหรับ SCP ดังนั้นคีย์ของโฮสต์รีเลย์ต้องมีอยู่แล้วใน `~/.ssh/known_hosts`
    เส้นทางไฟล์แนบจะถูกตรวจสอบกับ root ที่อนุญาต (`attachmentRoots` / `remoteAttachmentRoots`)

<Warning>
ตัวครอบ `cliPath` หรือพร็อกซี SSH ใดๆ ที่คุณวางไว้หน้า `imsg` ต้องทำงานเหมือนท่อ stdio แบบโปร่งใสสำหรับ JSON-RPC ที่ทำงานยาวนาน OpenClaw แลกเปลี่ยนข้อความ JSON-RPC ขนาดเล็กที่คั่นด้วยบรรทัดใหม่ผ่าน stdin/stdout ของตัวครอบตลอดอายุของช่องทาง:

- ส่งต่อแต่ละชิ้น/บรรทัดของ stdin **ทันทีที่มีไบต์พร้อมใช้งาน** — อย่ารอ EOF
- ส่งต่อแต่ละชิ้น/บรรทัดของ stdout ทันทีในทิศทางกลับกัน
- รักษาบรรทัดใหม่ไว้
- หลีกเลี่ยงการอ่านแบบบล็อกขนาดคงที่ (`read(4096)`, `cat | buffer`, `read` เริ่มต้นของเชลล์) ที่อาจทำให้เฟรมขนาดเล็กรอค้าง
- แยก stderr ออกจากสตรีม stdout ของ JSON-RPC

ตัวครอบที่บัฟเฟอร์ stdin จนกว่าบล็อกขนาดใหญ่จะเต็ม จะทำให้เกิดอาการที่ดูเหมือน iMessage ล่ม — `imsg rpc timeout (chats.list)` หรือช่องทางรีสตาร์ทซ้ำๆ — แม้ว่า `imsg rpc` เองจะปกติดี `ssh -T host imsg "$@"` (ด้านบน) ปลอดภัยเพราะส่งต่ออาร์กิวเมนต์ `cliPath` ของ OpenClaw เช่น `rpc` และ `--db` ส่วนไปป์ไลน์อย่าง `ssh host imsg | grep -v '^DEBUG'` ไม่ปลอดภัย — เครื่องมือที่บัฟเฟอร์ตามบรรทัดยังอาจกักเฟรมไว้ได้; ใช้ `stdbuf -oL -eL` ในทุกสเตจหากคุณจำเป็นต้องกรอง
</Warning>

  </Tab>
</Tabs>

## ข้อกำหนดและสิทธิ์ (macOS)

- Messages ต้องลงชื่อเข้าใช้อยู่บน Mac ที่รัน `imsg`
- ต้องมี Full Disk Access สำหรับบริบทกระบวนการที่รัน OpenClaw/`imsg` (การเข้าถึง DB ของ Messages)
- ต้องมีสิทธิ์ Automation เพื่อส่งข้อความผ่าน Messages.app
- สำหรับการดำเนินการขั้นสูง (react / edit / unsend / threaded reply / effects / group ops) ต้องปิดใช้งาน System Integrity Protection — ดู [การเปิดใช้ imsg private API](#enabling-the-imsg-private-api) ด้านล่าง การส่ง/รับข้อความและสื่อพื้นฐานทำงานได้โดยไม่ต้องปิด

<Tip>
สิทธิ์จะถูกให้ตามบริบทกระบวนการ หาก Gateway ทำงานแบบไม่มีหน้าจอ (LaunchAgent/SSH) ให้รันคำสั่งแบบโต้ตอบหนึ่งครั้งในบริบทเดียวกันนั้นเพื่อเรียกพรอมป์:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="การส่งผ่านตัวครอบ SSH ล้มเหลวด้วย AppleEvents -1743">
  การตั้งค่า remote-SSH อาจอ่านแชต, ผ่าน `channels status --probe`, และประมวลผลข้อความขาเข้าได้ ในขณะที่การส่งออกยังล้มเหลวด้วยข้อผิดพลาดการอนุญาต AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

ตรวจสอบฐานข้อมูล TCC ของผู้ใช้ Mac ที่ลงชื่อเข้าใช้ หรือ System Settings > Privacy & Security > Automation หากรายการ Automation ถูกบันทึกสำหรับ `/usr/libexec/sshd-keygen-wrapper` แทนที่จะเป็นกระบวนการ `imsg` หรือเชลล์ภายในเครื่อง macOS อาจไม่แสดงสวิตช์ Messages ที่ใช้งานได้สำหรับไคลเอนต์ฝั่งเซิร์ฟเวอร์ SSH นั้น:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

ในสถานะนั้น การทำ `tccutil reset AppleEvents` ซ้ำ หรือรัน `imsg send` อีกครั้งผ่านตัวครอบ SSH เดิมอาจยังล้มเหลวต่อไป เพราะบริบทกระบวนการที่ต้องการ Messages Automation คือตัวครอบ SSH ไม่ใช่แอปที่ UI สามารถให้สิทธิ์ได้

ให้ใช้บริบทกระบวนการ `imsg` ที่รองรับแทน:

- รัน Gateway หรืออย่างน้อยบริดจ์ `imsg` ในเซสชันภายในเครื่องของผู้ใช้ Messages ที่ล็อกอินอยู่
- เริ่ม Gateway ด้วย LaunchAgent สำหรับผู้ใช้นั้นหลังจากให้ Full Disk Access และ Automation จากเซสชันเดียวกัน
- หากคุณยังคงใช้โทโพโลยี SSH แบบสองผู้ใช้ ให้ตรวจสอบว่า `imsg send` ขาออกจริงสำเร็จผ่านตัวครอบเดียวกันทุกประการก่อนเปิดใช้งานช่องทาง หากไม่สามารถให้สิทธิ์ Automation ได้ ให้กำหนดค่าใหม่เป็นการตั้งค่า `imsg` แบบผู้ใช้เดียวแทนการพึ่งพาตัวครอบ SSH สำหรับการส่ง

</Accordion>

## การเปิดใช้ imsg private API

`imsg` มาพร้อมโหมดการทำงานสองแบบ:

- **โหมดพื้นฐาน** (ค่าเริ่มต้น ไม่ต้องเปลี่ยน SIP): ข้อความและสื่อขาออกผ่าน `send`, การดู/ประวัติขาเข้า, รายการแชต นี่คือสิ่งที่คุณได้ทันทีจาก `brew install steipete/tap/imsg` ใหม่พร้อมสิทธิ์ macOS มาตรฐานด้านบน
- **โหมด Private API**: `imsg` ฉีด dylib ตัวช่วยเข้าไปใน `Messages.app` เพื่อเรียกฟังก์ชันภายในของ `IMCore` นี่คือสิ่งที่ปลดล็อก `react`, `edit`, `unsend`, `reply` (แบบเธรด), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` รวมถึงตัวบ่งชี้การพิมพ์และใบตอบรับการอ่าน

เพื่อเข้าถึงพื้นผิวการดำเนินการขั้นสูงที่หน้า channel นี้บันทึกไว้ คุณต้องใช้โหมด Private API README ของ `imsg` ระบุข้อกำหนดไว้อย่างชัดเจน:

> ฟีเจอร์ขั้นสูง เช่น `read`, `typing`, `launch`, การส่งแบบริชที่มีบริดจ์รองรับ, การแก้ไขข้อความ และการจัดการแชต เป็นแบบเลือกเปิดใช้ ฟีเจอร์เหล่านี้ต้องปิดใช้งาน SIP และฉีด dylib ตัวช่วยเข้าไปใน `Messages.app` `imsg launch` จะปฏิเสธการฉีดเมื่อเปิดใช้งาน SIP อยู่

เทคนิคการฉีดตัวช่วยใช้ dylib ของ `imsg` เองเพื่อเข้าถึง private API ของ Messages ไม่มีเซิร์ฟเวอร์บุคคลที่สามหรือรันไทม์ BlueBubbles ในเส้นทาง OpenClaw iMessage

<Warning>
**การปิด SIP เป็นการแลกเปลี่ยนด้านความปลอดภัยที่แท้จริง** SIP เป็นหนึ่งในการป้องกันหลักของ macOS ต่อการรันโค้ดระบบที่ถูกดัดแปลง; การปิดแบบทั้งระบบจะเปิดพื้นผิวการโจมตีและผลข้างเคียงเพิ่มเติม โดยเฉพาะอย่างยิ่ง **การปิด SIP บน Mac ที่ใช้ Apple Silicon ยังปิดความสามารถในการติดตั้งและรันแอป iOS บน Mac ของคุณด้วย**

ให้ถือว่านี่เป็นทางเลือกด้านปฏิบัติการโดยเจตนา ไม่ใช่ค่าเริ่มต้น หาก threat model ของคุณยอมรับการปิด SIP ไม่ได้ iMessage ที่ bundled มาจะจำกัดอยู่ที่โหมดพื้นฐาน — ส่ง/รับข้อความและสื่อเท่านั้น ไม่มี reactions / edit / unsend / effects / group ops
</Warning>

### การตั้งค่า

1. **ติดตั้ง (หรืออัปเกรด) `imsg`** บน Mac ที่รัน Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   เอาต์พุต `imsg status --json` จะรายงาน `bridge_version`, `rpc_methods` และ `selectors` ต่อเมธอด เพื่อให้คุณดูได้ว่าบิลด์ปัจจุบันรองรับอะไรบ้างก่อนเริ่มใช้งาน

2. **ปิดใช้งาน System Integrity Protection และ (บน macOS รุ่นใหม่) Library Validation** การฉีด dylib ตัวช่วยที่ไม่ใช่ของ Apple เข้าไปใน `Messages.app` ที่ลงนามโดย Apple ต้องปิด SIP **และ** ผ่อนคลาย library validation ขั้นตอน SIP ใน Recovery mode ขึ้นอยู่กับเวอร์ชัน macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** ปิดใช้งาน Library Validation ผ่าน Terminal, รีบูตเข้าสู่ Recovery Mode, รัน `csrutil disable`, รีสตาร์ท
   - **macOS 11+ (Big Sur และใหม่กว่า), Intel:** Recovery Mode (หรือ Internet Recovery), `csrutil disable`, รีสตาร์ท
   - **macOS 11+, Apple Silicon:** ใช้ลำดับการเริ่มต้นด้วยปุ่มเปิดเครื่องเพื่อเข้าสู่ Recovery; บน macOS เวอร์ชันล่าสุดให้กดปุ่ม **Left Shift** ค้างไว้เมื่อคลิก Continue แล้วจึง `csrutil disable` การตั้งค่าเครื่องเสมือนมีขั้นตอนแยกต่างหาก ดังนั้นให้สร้าง snapshot ของ VM ก่อน

   **บน macOS 11 และใหม่กว่า โดยปกติ `csrutil disable` อย่างเดียวไม่พอ** Apple ยังคงบังคับใช้ library validation กับ `Messages.app` ในฐานะไบนารีแพลตฟอร์ม ดังนั้นตัวช่วยที่ลงนามแบบ adhoc จะถูกปฏิเสธ (`Library Validation failed: ... platform binary, but mapped file is not`) แม้จะปิด SIP แล้ว หลังจากปิด SIP ให้ปิด library validation ด้วยแล้วรีบูต:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), ตรวจสอบแล้วบน 26.5.1:** การปิด SIP **พร้อมกับ** คำสั่ง `DisableLibraryValidation` ด้านบนเพียงพอสำหรับฉีดตัวช่วยใน 26.0 ถึง 26.5.x **ไม่ต้องใช้ boot-args** plist คือปัจจัยชี้ขาดและเป็นขั้นตอนที่มักขาดที่สุดเมื่อการฉีดล้มเหลวบน Tahoe:
   - **เมื่อมี plist:** `imsg launch` ฉีดสำเร็จและ `imsg status` รายงาน `advanced_features: true`
   - **เมื่อไม่มี plist (แม้จะปิด SIP แล้ว):** `imsg launch` ล้มเหลวด้วย `Failed to launch: Timeout waiting for Messages.app to initialize` AMFI ปฏิเสธตัวช่วย adhoc ขณะโหลด ดังนั้นบริดจ์จึงไม่พร้อมใช้งานและการ launch หมดเวลา timeout นั้นคืออาการที่คนส่วนใหญ่เจอบน Tahoe และวิธีแก้คือ plist ด้านบน ไม่ใช่อะไรที่รุนแรงกว่านั้น

   สิ่งนี้ได้รับการยืนยันด้วยการควบคุมก่อน/หลังบน macOS 26.5.1 (Apple Silicon): เมื่อมี plist, dylib จะ map เข้าไปใน `Messages.app` และบริดจ์เริ่มทำงาน; เมื่อลบ plist แล้วรีบูต, `imsg launch` จะเกิด timeout failure ข้างต้นโดยที่ dylib ไม่ถูก map

   หากการฉีด `imsg launch` หรือ `selectors` บางรายการเริ่มคืนค่า false หลังอัปเกรด macOS เกตนี้มักเป็นสาเหตุปกติ ตรวจสอบสถานะ SIP และ library-validation ก่อนสรุปว่าขั้นตอน SIP เองล้มเหลว หากการตั้งค่าเหล่านั้นถูกต้องแล้วแต่ bridge ยังฉีดไม่ได้ ให้รวบรวม `imsg status --json` พร้อมเอาต์พุต `imsg launch` แล้วรายงานไปยังโปรเจกต์ `imsg` แทนการลดระดับการควบคุมความปลอดภัยทั่วทั้งระบบเพิ่มเติม

   ทำตามขั้นตอนโหมด Recovery ของ Apple สำหรับ Mac ของคุณเพื่อปิดใช้งาน SIP ก่อนเรียกใช้ `imsg launch`

3. **ฉีด helper** เมื่อปิดใช้งาน SIP แล้ว และลงชื่อเข้าใช้ Messages.app แล้ว:

   ```bash
   imsg launch
   ```

   `imsg launch` จะปฏิเสธการฉีดเมื่อ SIP ยังเปิดใช้งานอยู่ ดังนั้นคำสั่งนี้จึงใช้ยืนยันได้ด้วยว่าขั้นตอนที่ 2 มีผลแล้ว

4. **ตรวจสอบ bridge จาก OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   รายการ iMessage ควรรายงาน `works` และ `imsg status --json | jq '.selectors'` ควรแสดง `retractMessagePart: true` พร้อม selector สำหรับแก้ไข / กำลังพิมพ์ / อ่าน แล้วแต่ที่บิลด์ macOS ของคุณเปิดเผย การ gate แบบรายเมธอดของ Plugin OpenClaw ใน `actions.ts` จะโฆษณาเฉพาะ action ที่ selector เบื้องหลังเป็น `true` เท่านั้น ดังนั้นพื้นผิว action ที่คุณเห็นในรายการเครื่องมือของ agent จึงสะท้อนสิ่งที่ bridge ทำได้จริงบนโฮสต์นี้

หาก `openclaw channels status --probe` รายงานช่องทางเป็น `works` แต่ action บางรายการโยนข้อผิดพลาด "iMessage `<action>` requires the imsg private API bridge" ตอน dispatch ให้เรียกใช้ `imsg launch` อีกครั้ง — helper อาจหลุดออกได้ (Messages.app รีสตาร์ต, อัปเดต OS ฯลฯ) และสถานะ `available: true` ที่แคชไว้จะยังโฆษณา action ต่อไปจนกว่า probe ครั้งถัดไปจะรีเฟรช

### เมื่อคุณไม่สามารถปิดใช้งาน SIP

หากสถานะปิด SIP ไม่เหมาะกับโมเดลภัยคุกคามของคุณ:

- `imsg` จะ fallback ไปยังโหมดพื้นฐาน — ข้อความ + สื่อ + รับเท่านั้น
- Plugin OpenClaw ยังโฆษณาการส่งข้อความ/สื่อ และการมอนิเตอร์ขาเข้า เพียงแต่ซ่อน `react`, `edit`, `unsend`, `reply`, `sendWithEffect` และการทำงานกลุ่มจากพื้นผิว action (ตาม gate ความสามารถแบบรายเมธอด)
- คุณสามารถรัน Mac ที่ไม่ใช่ Apple Silicon แยกต่างหาก (หรือ Mac สำหรับบอตโดยเฉพาะ) โดยปิด SIP สำหรับงาน iMessage ขณะที่ยังเปิด SIP บนอุปกรณ์หลักของคุณ ดู [ผู้ใช้ macOS สำหรับบอตโดยเฉพาะ (ตัวตน iMessage แยกต่างหาก)](#deployment-patterns) ด้านล่าง

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.imessage.dmPolicy` ควบคุมข้อความส่วนตัว:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` รวม `"*"`)
    - `disabled`

    ฟิลด์ allowlist: `channels.imessage.allowFrom`

    รายการ allowlist ต้องระบุผู้ส่ง: handle หรือกลุ่มการเข้าถึงผู้ส่งแบบคงที่ (`accessGroup:<name>`) ใช้ `channels.imessage.groupAllowFrom` สำหรับเป้าหมายแชต เช่น `chat_id:*`, `chat_guid:*` หรือ `chat_identifier:*`; ใช้ `channels.imessage.groups` สำหรับคีย์รีจิสทรี `chat_id` แบบตัวเลข

  </Tab>

  <Tab title="นโยบายกลุ่ม + การกล่าวถึง">
    `channels.imessage.groupPolicy` ควบคุมการจัดการกลุ่ม:

    - `allowlist` (ค่าเริ่มต้นเมื่อกำหนดค่าไว้)
    - `open`
    - `disabled`

    allowlist ผู้ส่งกลุ่ม: `channels.imessage.groupAllowFrom`

    รายการ `groupAllowFrom` สามารถอ้างถึงกลุ่มการเข้าถึงผู้ส่งแบบคงที่ได้ด้วย (`accessGroup:<name>`)

    Runtime fallback: หากไม่ได้ตั้งค่า `groupAllowFrom` การตรวจสอบผู้ส่งกลุ่ม iMessage จะใช้ `allowFrom`; ตั้งค่า `groupAllowFrom` เมื่อการรับ DM และกลุ่มควรแตกต่างกัน
    หมายเหตุ Runtime: หาก `channels.imessage` หายไปทั้งหมด runtime จะ fallback เป็น `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้ตั้งค่า `channels.defaults.groupPolicy` แล้วก็ตาม)

    <Warning>
    การกำหนดเส้นทางกลุ่มมี gate allowlist **สอง** ชั้นที่ทำงานต่อเนื่องกัน และทั้งสองชั้นต้องผ่าน:

    1. **Allowlist ผู้ส่ง / เป้าหมายแชต** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` หรือ `chat_id`
    2. **รีจิสทรีกลุ่ม** (`channels.imessage.groups`) — เมื่อใช้ `groupPolicy: "allowlist"` gate นี้ต้องมีรายการ wildcard `groups: { "*": { ... } }` (ตั้งค่า `allowAll = true`) หรือรายการต่อ `chat_id` ที่ระบุชัดภายใต้ `groups`

    หาก gate 2 ไม่มีรายการใดเลย ข้อความกลุ่มทุกข้อความจะถูกทิ้ง Plugin จะปล่อยสัญญาณระดับ `warn` สองรายการที่ระดับ log เริ่มต้น:

    - หนึ่งครั้งต่อบัญชีตอนเริ่มต้น: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - หนึ่งครั้งต่อ `chat_id` ตอน runtime: `imessage: dropping group message from chat_id=<id> ...`

    DM ยังทำงานต่อไปเพราะใช้เส้นทางโค้ดคนละแบบ

    คอนฟิกขั้นต่ำเพื่อให้กลุ่มยังไหลต่อภายใต้ `groupPolicy: "allowlist"`:

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

    หากบรรทัด `warn` เหล่านั้นปรากฏใน log ของ Gateway แปลว่า gate 2 กำลังทิ้งข้อความ — ให้เพิ่มบล็อก `groups`
    </Warning>

    การ gate การกล่าวถึงสำหรับกลุ่ม:

    - iMessage ไม่มีเมตาดาต้าการกล่าวถึงแบบ native
    - การตรวจจับการกล่าวถึงใช้รูปแบบ regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - เมื่อไม่มีรูปแบบที่กำหนดค่าไว้ จะบังคับใช้การ gate การกล่าวถึงไม่ได้

    คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตสามารถข้ามการ gate การกล่าวถึงในกลุ่มได้

    `systemPrompt` ต่อกลุ่ม:

    แต่ละรายการภายใต้ `channels.imessage.groups.*` รับสตริง `systemPrompt` แบบไม่บังคับ ค่านี้จะถูกฉีดเข้าใน system prompt ของ agent ในทุก turn ที่จัดการข้อความในกลุ่มนั้น การ resolve สะท้อนการ resolve prompt ต่อกลุ่มที่ใช้โดย `channels.whatsapp.groups`:

    1. **System prompt เฉพาะกลุ่ม** (`groups["<chat_id>"].systemPrompt`): ใช้เมื่อมีรายการกลุ่มเฉพาะใน map **และ** กำหนดคีย์ `systemPrompt` ไว้ หาก `systemPrompt` เป็นสตริงว่าง (`""`) wildcard จะถูกระงับและจะไม่ใช้ system prompt กับกลุ่มนั้น
    2. **System prompt wildcard ของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อไม่มีรายการกลุ่มเฉพาะใน map เลย หรือเมื่อมีรายการอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Prompt ต่อกลุ่มใช้กับข้อความกลุ่มเท่านั้น — ข้อความส่วนตัวในช่องทางนี้จะไม่ได้รับผลกระทบ

  </Tab>

  <Tab title="เซสชันและการตอบกลับแบบกำหนดแน่นอน">
    - DM ใช้การกำหนดเส้นทางโดยตรง; กลุ่มใช้การกำหนดเส้นทางกลุ่ม
    - เมื่อใช้ค่าเริ่มต้น `session.dmScope=main` DM ของ iMessage จะถูกรวมเข้าในเซสชันหลักของ agent
    - เซสชันกลุ่มจะแยกออกจากกัน (`agent:<agentId>:imessage:group:<chat_id>`)
    - การตอบกลับจะกำหนดเส้นทางกลับไปยัง iMessage โดยใช้เมตาดาต้าช่องทาง/เป้าหมายต้นทาง

    พฤติกรรมเธรดที่คล้ายกลุ่ม:

    เธรด iMessage ที่มีผู้เข้าร่วมหลายคนบางรายการอาจมาถึงพร้อม `is_group=false`
    หาก `chat_id` นั้นถูกกำหนดค่าอย่างชัดเจนภายใต้ `channels.imessage.groups` OpenClaw จะถือว่าเป็นทราฟฟิกกลุ่ม (การ gate กลุ่ม + การแยกเซสชันกลุ่ม)

  </Tab>
</Tabs>

## การผูกการสนทนา ACP

แชต iMessage แบบ legacy ยังสามารถผูกกับเซสชัน ACP ได้ด้วย

โฟลว์ผู้ปฏิบัติงานแบบเร็ว:

- เรียกใช้ `/acp spawn codex --bind here` ภายใน DM หรือแชตกลุ่มที่อนุญาต
- ข้อความในอนาคตในบทสนทนา iMessage เดียวกันจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ spawn ไว้
- `/new` และ `/reset` รีเซ็ตเซสชัน ACP ที่ผูกไว้นั้นในตำแหน่งเดิม
- `/acp close` ปิดเซสชัน ACP และลบการผูก

รองรับการผูกแบบถาวรที่กำหนดค่าไว้ผ่านรายการ `bindings[]` ระดับบน โดยมี `type: "acp"` และ `match.channel: "imessage"`

`match.peer.id` สามารถใช้:

- handle DM ที่ normalize แล้ว เช่น `+15555550123` หรือ `user@example.com`
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

ดู [Agent ACP](/th/tools/acp-agents) สำหรับพฤติกรรมการผูก ACP ที่ใช้ร่วมกัน

## รูปแบบการปรับใช้

<AccordionGroup>
  <Accordion title="ผู้ใช้ macOS สำหรับบอตโดยเฉพาะ (ตัวตน iMessage แยกต่างหาก)">
    ใช้ Apple ID และผู้ใช้ macOS โดยเฉพาะเพื่อแยกทราฟฟิกบอตออกจากโปรไฟล์ Messages ส่วนตัวของคุณ

    โฟลว์ทั่วไป:

    1. สร้าง/ลงชื่อเข้าใช้ผู้ใช้ macOS โดยเฉพาะ
    2. ลงชื่อเข้าใช้ Messages ด้วย Apple ID ของบอตในผู้ใช้นั้น
    3. ติดตั้ง `imsg` ในผู้ใช้นั้น
    4. สร้าง SSH wrapper เพื่อให้ OpenClaw เรียกใช้ `imsg` ในบริบทของผู้ใช้นั้นได้
    5. ชี้ `channels.imessage.accounts.<id>.cliPath` และ `.dbPath` ไปยังโปรไฟล์ผู้ใช้นั้น

    การรันครั้งแรกอาจต้องอนุมัติผ่าน GUI (Automation + Full Disk Access) ในเซสชันผู้ใช้บอตนั้น

  </Accordion>

  <Accordion title="Mac ระยะไกลผ่าน Tailscale (ตัวอย่าง)">
    โทโพโลยีทั่วไป:

    - Gateway รันบน Linux/VM
    - iMessage + `imsg` รันบน Mac ใน tailnet ของคุณ
    - wrapper `cliPath` ใช้ SSH เพื่อรัน `imsg`
    - `remoteHost` เปิดใช้งานการดึงไฟล์แนบผ่าน SCP

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

    ใช้คีย์ SSH เพื่อให้ทั้ง SSH และ SCP ไม่ต้องโต้ตอบ
    ตรวจสอบให้แน่ใจก่อนว่า host key เชื่อถือได้ (เช่น `ssh bot@mac-mini.tailnet-1234.ts.net`) เพื่อให้ `known_hosts` ถูกเติมข้อมูล

  </Accordion>

  <Accordion title="รูปแบบหลายบัญชี">
    iMessage รองรับคอนฟิกต่อบัญชีภายใต้ `channels.imessage.accounts`

    แต่ละบัญชีสามารถ override ฟิลด์ต่าง ๆ เช่น `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, การตั้งค่าประวัติ และ allowlist รากไฟล์แนบ

  </Accordion>

  <Accordion title="ประวัติข้อความส่วนตัว">
    ตั้งค่า `channels.imessage.dmHistoryLimit` เพื่อเติมข้อมูลเริ่มต้นให้เซสชันข้อความส่วนตัวใหม่ด้วยประวัติ `imsg` ที่ถอดรหัสล่าสุดสำหรับบทสนทนานั้น ใช้ `channels.imessage.dms["<sender>"].historyLimit` สำหรับการ override ต่อผู้ส่ง รวมถึง `0` เพื่อปิดใช้งานประวัติสำหรับผู้ส่งรายหนึ่ง

    ประวัติ DM ของ iMessage จะถูกดึงจาก `imsg` ตามต้องการ การไม่ตั้งค่า `dmHistoryLimit` จะปิดใช้งานการเติมประวัติ DM แบบ global แต่ `channels.imessage.dms["<sender>"].historyLimit` ต่อผู้ส่งที่เป็นค่าบวกยังคงเปิดใช้งานการเติมประวัติสำหรับผู้ส่งรายนั้น

  </Accordion>
</AccordionGroup>

## สื่อ การแบ่งชิ้นส่วน และเป้าหมายการส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบและสื่อ">
    - การรับไฟล์แนบขาเข้าจะ **ปิดอยู่โดยค่าเริ่มต้น** — ตั้งค่า `channels.imessage.includeAttachments: true` เพื่อส่งต่อรูปภาพ วอยซ์เมโม วิดีโอ และไฟล์แนบอื่น ๆ ไปยังเอเจนต์ เมื่อปิดอยู่ iMessage ที่มีเฉพาะไฟล์แนบจะถูกทิ้งก่อนถึงเอเจนต์ และอาจไม่สร้างบรรทัดบันทึก `Inbound message` เลย
    - สามารถดึงพาธไฟล์แนบระยะไกลผ่าน SCP ได้เมื่อตั้งค่า `remoteHost`
    - พาธไฟล์แนบต้องตรงกับรากที่อนุญาต:
      - `channels.imessage.attachmentRoots` (ภายในเครื่อง)
      - `channels.imessage.remoteAttachmentRoots` (โหมด SCP ระยะไกล)
      - รูปแบบรากเริ่มต้น: `/Users/*/Library/Messages/Attachments`
    - SCP ใช้การตรวจสอบ host-key แบบเข้มงวด (`StrictHostKeyChecking=yes`)
    - ขนาดสื่อขาออกใช้ `channels.imessage.mediaMaxMb` (ค่าเริ่มต้น 16 MB)

  </Accordion>

  <Accordion title="การแบ่งข้อความขาออกเป็นช่วง">
    - ขีดจำกัดช่วงข้อความ: `channels.imessage.textChunkLimit` (ค่าเริ่มต้น 4000)
    - โหมดช่วง: `channels.imessage.chunkMode`
      - `length` (ค่าเริ่มต้น)
      - `newline` (แยกโดยให้ย่อหน้ามาก่อน)

  </Accordion>

  <Accordion title="รูปแบบการระบุที่อยู่">
    เป้าหมายแบบระบุชัดเจนที่แนะนำ:

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

## การกระทำ Private API

เมื่อ `imsg launch` กำลังทำงานและ `openclaw channels status --probe` รายงาน `privateApi.available: true` เครื่องมือข้อความจะใช้การกระทำแบบเนทีฟของ iMessage เพิ่มเติมจากการส่งข้อความปกติได้

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
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="การกระทำที่ใช้ได้">
    - **react**: เพิ่ม/ลบ tapback ของ iMessage (`messageId`, `emoji`, `remove`) tapback ที่รองรับจะจับคู่กับ love, like, dislike, laugh, emphasize และ question
    - **reply**: ส่งคำตอบแบบเธรดไปยังข้อความที่มีอยู่ (`messageId`, `text` หรือ `message` พร้อม `chatGuid`, `chatId`, `chatIdentifier` หรือ `to`)
    - **sendWithEffect**: ส่งข้อความพร้อมเอฟเฟกต์ iMessage (`text` หรือ `message`, `effect` หรือ `effectId`)
    - **edit**: แก้ไขข้อความที่ส่งแล้วบนเวอร์ชัน macOS/Private API ที่รองรับ (`messageId`, `text` หรือ `newText`)
    - **unsend**: ถอนข้อความที่ส่งแล้วบนเวอร์ชัน macOS/Private API ที่รองรับ (`messageId`)
    - **upload-file**: ส่งสื่อ/ไฟล์ (`buffer` เป็น base64 หรือ `media`/`path`/`filePath` ที่เติมข้อมูลแล้ว, `filename`, `asVoice` เป็นทางเลือก) นามแฝงเดิม: `sendAttachment`
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: จัดการแชทกลุ่มเมื่อเป้าหมายปัจจุบันเป็นการสนทนากลุ่ม

  </Accordion>

  <Accordion title="รหัสข้อความ">
    บริบท iMessage ขาเข้ามีทั้งค่า `MessageSid` แบบสั้นและ GUID ข้อความแบบเต็มเมื่อมีให้ใช้ รหัสแบบสั้นถูกจำกัดขอบเขตไว้ที่แคชการตอบกลับล่าสุดที่รองรับด้วย SQLite และจะถูกตรวจสอบกับแชทปัจจุบันก่อนใช้งาน หากรหัสแบบสั้นหมดอายุหรือเป็นของแชทอื่น ให้ลองใหม่ด้วย `MessageSidFull` แบบเต็ม

  </Accordion>

  <Accordion title="การตรวจจับความสามารถ">
    OpenClaw ซ่อนการกระทำ Private API เฉพาะเมื่อสถานะโพรบที่แคชไว้ระบุว่า bridge ใช้ไม่ได้ หากสถานะไม่ทราบ การกระทำจะยังคงแสดงอยู่และจะส่งโพรบแบบ lazy เพื่อให้การกระทำแรกสำเร็จได้หลัง `imsg launch` โดยไม่ต้องรีเฟรชสถานะด้วยตนเองแยกต่างหาก

  </Accordion>

  <Accordion title="ใบตอบรับการอ่านและการพิมพ์">
    เมื่อ bridge ของ Private API พร้อมใช้งาน แชทขาเข้าที่ได้รับการยอมรับจะถูกทำเครื่องหมายว่าอ่านแล้ว และแชทโดยตรงจะแสดงฟองกำลังพิมพ์ทันทีที่รอบงานได้รับการยอมรับ ระหว่างที่เอเจนต์เตรียมบริบทและสร้างคำตอบ ปิดการทำเครื่องหมายว่าอ่านแล้วด้วย:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    บิลด์ `imsg` รุ่นเก่าที่มาก่อนรายการความสามารถรายเมธอดจะปิดการพิมพ์/การอ่านแบบเงียบ ๆ; OpenClaw จะบันทึกคำเตือนหนึ่งครั้งต่อการรีสตาร์ท เพื่อให้ระบุสาเหตุของใบตอบรับที่ขาดหายได้

  </Accordion>

  <Accordion title="tapback ขาเข้า">
    OpenClaw สมัครรับ tapback ของ iMessage และกำหนดเส้นทางรีแอ็กชันที่ได้รับการยอมรับเป็นอีเวนต์ระบบแทนข้อความปกติ ดังนั้น tapback จากผู้ใช้จะไม่ทริกเกอร์ลูปการตอบกลับตามปกติ

    โหมดการแจ้งเตือนควบคุมด้วย `channels.imessage.reactionNotifications`:

    - `"own"` (ค่าเริ่มต้น): แจ้งเตือนเฉพาะเมื่อผู้ใช้รีแอ็กต์ต่อข้อความที่บอตเป็นผู้เขียน
    - `"all"`: แจ้งเตือนสำหรับ tapback ขาเข้าทั้งหมดจากผู้ส่งที่ได้รับอนุญาต
    - `"off"`: ไม่สนใจ tapback ขาเข้า

    การแทนที่รายบัญชีใช้ `channels.imessage.accounts.<id>.reactionNotifications`

  </Accordion>

  <Accordion title="รีแอ็กชันอนุมัติ (👍 / 👎)">
    เมื่อ `approvals.exec.enabled` หรือ `approvals.plugin.enabled` เป็นจริงและคำขอถูกกำหนดเส้นทางไปยัง iMessage, Gateway จะส่งพรอมป์อนุมัติแบบเนทีฟและยอมรับ tapback เพื่อแก้ผลลัพธ์:

    - `👍` (tapback แบบ Like) → `allow-once`
    - `👎` (tapback แบบ Dislike) → `deny`
    - `allow-always` ยังคงเป็นทางสำรองแบบทำเอง: ส่ง `/approve <id> allow-always` เป็นการตอบกลับปกติ

    การจัดการรีแอ็กชันกำหนดให้แฮนเดิลของผู้ใช้ที่รีแอ็กต์ต้องเป็นผู้อนุมัติที่ระบุชัดเจน รายการผู้อนุมัติอ่านจาก `channels.imessage.allowFrom` (หรือ `channels.imessage.accounts.<id>.allowFrom`); เพิ่มหมายเลขโทรศัพท์ของผู้ใช้ในรูปแบบ E.164 หรืออีเมล Apple ID ของผู้ใช้ รายการไวลด์การ์ด `"*"` จะถูกใช้ แต่อนุญาตให้ผู้ส่งใดก็ได้อนุมัติ ทางลัดรีแอ็กชันตั้งใจข้าม `reactionNotifications`, `dmPolicy` และ `groupAllowFrom` เพราะ allowlist ของผู้อนุมัติที่ระบุชัดเจนเป็นเกตเดียวที่สำคัญต่อการแก้ผลการอนุมัติ

    **การเปลี่ยนแปลงพฤติกรรมในรุ่นนี้:** เมื่อ `channels.imessage.allowFrom` ไม่ว่าง คำสั่งข้อความ `/approve <id> <decision>` จะถูกอนุญาตเทียบกับรายการผู้อนุมัตินั้นแล้ว (ไม่ใช่ allowlist ของ DM ที่กว้างกว่า) ผู้ส่งที่อนุญาตใน allowlist ของ DM แต่ไม่ได้อยู่ใน `allowFrom` จะได้รับการปฏิเสธอย่างชัดเจน เพิ่มโอเปอเรเตอร์ทุกคนที่ควรอนุมัติผ่าน `/approve` (และผ่านรีแอ็กชัน) ลงใน `allowFrom` เพื่อรักษาพฤติกรรมก่อนหน้า เมื่อ `allowFrom` ว่าง ทางสำรองเดิมแบบ “แชทเดียวกัน” จะยังมีผล และ `/approve` จะยังคงอนุญาตทุกคนที่ allowlist ของ DM อนุญาต

    หมายเหตุสำหรับโอเปอเรเตอร์:
    - การผูกรีแอ็กชันถูกเก็บทั้งในหน่วยความจำ (พร้อม TTL ที่ตรงกับเวลาหมดอายุของการอนุมัติ) และในที่เก็บแบบ key-value ถาวรของ Gateway ดังนั้น tapback ที่เข้ามาหลัง Gateway รีสตาร์ทไม่นานจะยังแก้ผลการอนุมัติได้
    - tapback ข้ามอุปกรณ์ที่มี `is_from_me=true` (รีแอ็กชันของโอเปอเรเตอร์เองบนอุปกรณ์ Apple ที่จับคู่ไว้) จะถูกละเว้นโดยตั้งใจ เพื่อไม่ให้บอตอนุมัติตัวเองได้
    - tapback แบบข้อความเดิม (`Liked "…"` เป็นข้อความธรรมดาจากไคลเอนต์ Apple ที่เก่ามาก) ไม่สามารถแก้ผลการอนุมัติได้ เพราะไม่มี GUID ข้อความ; การแก้ผลด้วยรีแอ็กชันต้องใช้เมตาดาต้า tapback แบบมีโครงสร้างที่ไคลเอนต์ macOS / iOS ปัจจุบันส่งออกมา

  </Accordion>
</AccordionGroup>

## การเขียนการกำหนดค่า

iMessage อนุญาตให้ช่องทางเริ่มการเขียนการกำหนดค่าได้โดยค่าเริ่มต้น (สำหรับ `/config set|unset` เมื่อ `commands.config: true`)

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

## การรวม DM แบบส่งแยก (คำสั่ง + URL ในการเขียนครั้งเดียว)

เมื่อผู้ใช้พิมพ์คำสั่งและ URL พร้อมกัน เช่น `Dump https://example.com/article` แอป Messages ของ Apple จะแยกการส่งเป็น **สองแถว `chat.db` ที่แยกกัน**:

1. ข้อความ (`"Dump"`)
2. บอลลูนพรีวิว URL (`"https://..."`) พร้อมรูปภาพพรีวิว OG เป็นไฟล์แนบ

สองแถวนี้มาถึง OpenClaw ห่างกันประมาณ 0.8-2.0 วินาทีในสภาพแวดล้อมส่วนใหญ่ หากไม่มีการรวม เอเจนต์จะได้รับเฉพาะคำสั่งในรอบงานที่ 1 ตอบกลับ (มักเป็น “ส่ง URL มาให้ฉัน”) และเห็น URL เฉพาะในรอบงานที่ 2 ซึ่งเมื่อถึงตอนนั้นบริบทของคำสั่งก็หายไปแล้ว นี่เป็นไปป์ไลน์การส่งของ Apple ไม่ใช่สิ่งที่ OpenClaw หรือ `imsg` เพิ่มเข้ามา

`channels.imessage.coalesceSameSenderDms` เลือกให้ DM บัฟเฟอร์แถวต่อเนื่องจากผู้ส่งคนเดียวกัน เมื่อ `imsg` เปิดเผยตัวทำเครื่องหมายพรีวิว URL เชิงโครงสร้าง `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` บนหนึ่งในแถวต้นทาง OpenClaw จะรวมเฉพาะการส่งแยกจริงนั้น และคงแถวอื่นที่บัฟเฟอร์ไว้เป็นรอบงานแยก บนบิลด์ `imsg` รุ่นเก่าที่ไม่ส่งเมตาดาต้าบอลลูนเลย OpenClaw ไม่สามารถแยกการส่งแยกออกจากการส่งแยกกันได้ จึงถอยกลับไปเป็นการรวมบักเก็ต การทำเช่นนี้รักษาพฤติกรรมก่อนมีเมตาดาต้า แทนที่จะทำให้การส่งแยก `Dump <url>` ถดถอยเป็นสองรอบงาน แชทกลุ่มยังคงส่งต่อแบบรายข้อความเพื่อรักษาโครงสร้างรอบงานของผู้ใช้หลายคน

<Tabs>
  <Tab title="ควรเปิดใช้เมื่อใด">
    เปิดใช้เมื่อ:

    - คุณจัดส่ง Skills ที่คาดหวัง `command + payload` ในข้อความเดียว (dump, paste, save, queue ฯลฯ)
    - ผู้ใช้ของคุณวาง URL ควบคู่กับคำสั่ง
    - คุณยอมรับเวลาแฝงของรอบงาน DM ที่เพิ่มขึ้นได้ (ดูด้านล่าง)

    ปล่อยให้ปิดไว้เมื่อ:

    - คุณต้องการเวลาแฝงคำสั่งขั้นต่ำสำหรับทริกเกอร์ DM คำเดียว
    - โฟลว์ทั้งหมดของคุณเป็นคำสั่งครั้งเดียวจบโดยไม่มี payload ตามมา

  </Tab>
  <Tab title="การเปิดใช้">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    เมื่อเปิดแฟล็กและไม่มี `messages.inbound.byChannel.imessage` แบบชัดเจนหรือ `messages.inbound.debounceMs` แบบส่วนกลาง หน้าต่าง debounce จะขยายเป็น **7000 ms** (ค่าเริ่มต้นเดิมคือ 0 ms — ไม่มี debounce) จำเป็นต้องใช้หน้าต่างที่กว้างขึ้น เพราะจังหวะการส่งแยกพรีวิว URL ของ Apple อาจยืดไปหลายวินาทีขณะ Messages.app ส่งแถวพรีวิวออกมา

    หากต้องการปรับหน้าต่างด้วยตนเอง:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="ข้อแลกเปลี่ยน">
    - **การรวมอย่างแม่นยำต้องใช้เมตาดาต้า payload ปัจจุบันของ `imsg`** เมื่อแถว URL มี `balloon_bundle_id` ระบบจะรวมเฉพาะการส่งแยกจริงนั้น และแถวอื่นที่บัฟเฟอร์ไว้จะยังแยกกันอยู่ บนบิลด์ `imsg` รุ่นเก่าที่ไม่เปิดเผยเมตาดาต้าบอลลูน OpenClaw จะถอยกลับไปเป็นการรวมบักเก็ตที่บัฟเฟอร์ไว้ เพื่อไม่ให้การส่งแยก `Dump <url>` ถดถอยเป็นสองรอบงาน (ความเข้ากันได้ย้อนหลังชั่วคราว จะลบออกเมื่อ `imsg` รวมการส่งแยกที่ต้นทางแล้ว)
    - **เวลาแฝงเพิ่มขึ้นสำหรับข้อความ DM** เมื่อเปิดแฟล็ก ทุก DM (รวมถึงคำสั่งควบคุมแบบเดี่ยวและการติดตามผลแบบข้อความเดียว) จะรอได้จนถึงหน้าต่าง debounce ก่อนส่งต่อ เผื่อว่ากำลังจะมีแถวพรีวิว URL เข้ามา ข้อความแชทกลุ่มยังคงส่งต่อทันที
    - **ผลลัพธ์ที่รวมมีขอบเขตจำกัด** ข้อความที่รวมจำกัดที่ 4000 อักขระพร้อมตัวทำเครื่องหมาย `…[truncated]` อย่างชัดเจน; ไฟล์แนบจำกัดที่ 20; รายการต้นทางจำกัดที่ 10 (เก็บรายการแรกและรายการล่าสุดไว้เมื่อเกินกว่านั้น) GUID ต้นทางทุกตัวถูกติดตามใน `coalescedMessageGuids` สำหรับเทเลเมทรีปลายทาง
    - **เฉพาะ DM** แชทกลุ่มจะไหลผ่านเป็นการส่งต่อรายข้อความ เพื่อให้บอตยังตอบสนองได้ดีเมื่อมีหลายคนกำลังพิมพ์
    - **เลือกเปิดใช้ รายช่องทาง** ช่องทางอื่น (Telegram, WhatsApp, Slack, …) ไม่ได้รับผลกระทบ การกำหนดค่า BlueBubbles เดิมที่ตั้ง `channels.bluebubbles.coalesceSameSenderDms` ควรย้ายค่านั้นไปที่ `channels.imessage.coalesceSameSenderDms`

  </Tab>
</Tabs>

### สถานการณ์และสิ่งที่เอเจนต์เห็น

คอลัมน์ "Flag on" แสดงลักษณะการทำงานบนบิลด์ `imsg` ที่ส่งออก `balloon_bundle_id` บนบิลด์ `imsg` รุ่นเก่าที่ไม่ส่งออกเมทาดาทา balloon เลย แถวด้านล่างที่ทำเครื่องหมาย "Two turns" / "N turns" จะถอยกลับไปใช้การรวมแบบเดิมแทน (หนึ่งเทิร์น): OpenClaw ไม่สามารถบอกเชิงโครงสร้างได้ว่าการส่งที่ถูกแยกเป็นส่วน ๆ ต่างจากการส่งแยกกันอย่างไร จึงคงการรวมก่อนมีเมทาดาทาไว้ การแยกอย่างแม่นยำจะเริ่มทำงานเมื่อบิลด์ส่งออกเมทาดาทา balloon

| ผู้ใช้เขียน                                                      | `chat.db` สร้าง                  | ปิด Flag (ค่าเริ่มต้น)                      | เปิด Flag + หน้าต่างเวลา (`imsg` ส่งออกเมทาดาทา balloon)                                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (ส่งครั้งเดียว)                              | 2 แถว ห่างกัน ~1 วินาที                   | สองเทิร์นของเอเจนต์: "Dump" อย่างเดียว แล้วตามด้วย URL | หนึ่งเทิร์น: ข้อความที่รวมแล้ว `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (ไฟล์แนบ + ข้อความ)                | 2 แถวโดยไม่มีเมทาดาทา URL balloon | สองเทิร์น                               | สองเทิร์นหลังจากสังเกตพบเมทาดาทา; หนึ่งเทิร์นที่รวมแล้วในเซสชันเก่า/ก่อน latch ที่ไม่มีเมทาดาทา       |
| `/status` (คำสั่งเดี่ยว)                                     | 1 แถว                               | ส่งต่อทันที                        | **รอสูงสุดถึงหน้าต่างเวลา แล้วจึงส่งต่อ**                                                                |
| วาง URL เพียงอย่างเดียว                                                   | 1 แถว                               | ส่งต่อทันที                        | รอสูงสุดถึงหน้าต่างเวลา แล้วจึงส่งต่อ                                                                    |
| ข้อความ + URL ที่ส่งเป็นสองข้อความแยกกันโดยตั้งใจ ห่างกันหลายนาที | 2 แถวนอกหน้าต่างเวลา               | สองเทิร์น                               | สองเทิร์น (หน้าต่างเวลาหมดอายุระหว่างสองข้อความ)                                                             |
| การส่งรัวอย่างรวดเร็ว (>10 DM สั้น ๆ ภายในหน้าต่างเวลา)                          | N แถวโดยไม่มีเมทาดาทา URL balloon | N เทิร์น                                 | N เทิร์นหลังจากสังเกตพบเมทาดาทา; หนึ่งเทิร์นที่รวมแบบมีขอบเขตในเซสชันเก่า/ก่อน latch ที่ไม่มีเมทาดาทา |
| สองคนกำลังพิมพ์ในแชตกลุ่ม                                  | N แถวจากผู้ส่ง M คน               | M+ เทิร์น (หนึ่งเทิร์นต่อ bucket ผู้ส่ง)        | M+ เทิร์น — แชตกลุ่มจะไม่ถูกผสานรวม                                                            |

## การกู้คืนขาเข้าหลังจาก bridge หรือ Gateway รีสตาร์ต

iMessage กู้คืนข้อความที่พลาดไประหว่างที่ Gateway หยุดทำงาน และในขณะเดียวกันก็ระงับ "backlog bomb" เก่าที่ Apple อาจปล่อยออกมาหลังการกู้คืน Push พฤติกรรมเริ่มต้นจะเปิดใช้งานเสมอ โดยสร้างบน dedupe ขาเข้า

- **Replay dedupe.** ข้อความขาเข้าทุกข้อความที่ถูกส่งต่อจะถูกบันทึกตาม Apple GUID ในสถานะ Plugin แบบถาวร (`imessage.inbound-dedupe`) ถูกอ้างสิทธิ์ตอนรับเข้า และ commit หลังจัดการเสร็จ (ปล่อยเมื่อเกิดความล้มเหลวชั่วคราวเพื่อให้ลองใหม่ได้) สิ่งใดที่จัดการไปแล้วจะถูกทิ้งแทนการส่งต่อซ้ำสองครั้ง นี่คือสิ่งที่ทำให้การกู้คืน replay ได้อย่างจริงจังโดยไม่ต้องทำ bookkeeping ต่อข้อความ
- **Downtime recovery.** ตอนเริ่มต้น monitor จะจำ `chat.db` rowid ล่าสุดที่ส่งต่อแล้ว (เคอร์เซอร์ต่อบัญชีที่คงอยู่ถาวร) และส่งให้ `imsg watch.subscribe` เป็น `since_rowid` เพื่อให้ imsg replay แถวที่เข้ามาระหว่างที่ Gateway หยุดทำงาน แล้วจึง tail แบบ live การ replay ถูกจำกัดไว้ที่แถวล่าสุดและข้อความที่เก่าไม่เกิน ~2 ชั่วโมง และ dedupe จะทิ้งสิ่งที่จัดการไปแล้ว
- **Stale-backlog age fence.** แถวที่อยู่เหนือขอบเขตตอนเริ่มต้นเป็นข้อมูล live จริง ๆ; แถวใดที่วันที่ส่งเก่ากว่าเวลามาถึงเกิน ~15 นาทีคือ backlog จาก Push-flush และจะถูกระงับ แถวที่ replay (ที่ขอบเขตหรือต่ำกว่า) จะใช้หน้าต่างการกู้คืนที่กว้างกว่าแทน เพื่อให้ข้อความที่พลาดไปไม่นานถูกส่งมอบ ในขณะที่ประวัติเก่าแก่มากจะไม่ถูกส่ง

การกู้คืนทำงานได้ทั้งกับการตั้งค่า `cliPath` แบบ local และ remote เพราะ replay ด้วย `since_rowid` ทำงานผ่านการเชื่อมต่อ RPC ของ `imsg` เดียวกัน ความแตกต่างคือหน้าต่างเวลา: เมื่อ Gateway อ่าน `chat.db` ได้ (local) ระบบจะยึดขอบเขต rowid ตอนเริ่มต้น จำกัดช่วง replay และส่งมอบข้อความที่พลาดไปซึ่งเก่าได้ถึงสองสามชั่วโมง เมื่อใช้ `cliPath` แบบ SSH ระยะไกล ระบบจะอ่านฐานข้อมูลไม่ได้ ดังนั้น replay จะไม่ถูกจำกัด และทุกแถวจะใช้ age fence แบบ live โดยยังคงกู้คืนข้อความที่พลาดไปไม่นานและยังคงระงับ backlog เก่า เพียงแต่ใช้หน้าต่าง live ที่แคบกว่า ให้รัน Gateway บน Mac ที่ใช้ Messages เพื่อให้ได้หน้าต่างการกู้คืนที่กว้างกว่า

### สัญญาณที่ operator มองเห็นได้

backlog ที่ถูกระงับจะถูกบันทึก log ที่ระดับเริ่มต้น และจะไม่ถูกทิ้งอย่างเงียบ ๆ (`recovery` flag แสดงว่าหน้าต่างใดถูกใช้):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### การย้ายระบบ

`channels.imessage.catchup.*` ถูกเลิกใช้แล้ว — downtime recovery ตอนนี้เป็นแบบอัตโนมัติและไม่ต้องใช้ config สำหรับการตั้งค่าใหม่ config เดิมที่มี `catchup.enabled: true` จะยังคงได้รับการรองรับเป็นโปรไฟล์ความเข้ากันได้สำหรับหน้าต่าง replay การกู้คืน บล็อก catchup ที่ปิดใช้งาน (`enabled: false` หรือไม่มี `enabled: true`) ถูกเลิกใช้แล้ว; `openclaw doctor --fix` จะลบรายการเหล่านั้น

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่พบ imsg หรือไม่รองรับ RPC">
    ตรวจสอบ binary และการรองรับ RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    หาก probe รายงานว่าไม่รองรับ RPC ให้อัปเดต `imsg` หาก action ของ private API ใช้งานไม่ได้ ให้รัน `imsg launch` ในเซสชันผู้ใช้ macOS ที่ล็อกอินอยู่ แล้ว probe อีกครั้ง หาก Gateway ไม่ได้รันบน macOS ให้ใช้การตั้งค่า Mac ระยะไกลผ่าน SSH ด้านบนแทน path `imsg` แบบ local เริ่มต้น

  </Accordion>

  <Accordion title="Messages ส่งได้ แต่ iMessage ขาเข้าไม่มาถึง">
    ก่อนอื่นให้พิสูจน์ว่าข้อความมาถึง Mac local หรือไม่ หาก `chat.db` ไม่เปลี่ยน OpenClaw จะรับข้อความไม่ได้แม้ `imsg status --json` จะรายงานว่า bridge ทำงานปกติ

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    หากข้อความที่ส่งจากโทรศัพท์ไม่สร้างแถวใหม่ ให้ซ่อมเลเยอร์ macOS Messages และ Apple Push ก่อนเปลี่ยน config ของ OpenClaw การ refresh service แบบครั้งเดียวมักเพียงพอ:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    ส่ง iMessage ใหม่จากโทรศัพท์ และยืนยันว่ามีแถว `chat.db` ใหม่หรือ event จาก `imsg watch` ก่อน debug เซสชัน OpenClaw อย่ารันสิ่งนี้เป็นลูป relaunch bridge ตามรอบเวลา; การรัน `imsg launch` ซ้ำพร้อมกับรีสตาร์ต Gateway ระหว่างมีงาน active อาจขัดจังหวะการส่งมอบและทำให้ channel runs ที่กำลังดำเนินอยู่ค้างได้

  </Accordion>

  <Accordion title="Gateway ไม่ได้รันบน macOS">
    ค่าเริ่มต้น `cliPath: "imsg"` ต้องรันบน Mac ที่ลงชื่อเข้าใช้ Messages บน Linux หรือ Windows ให้ตั้ง `channels.imessage.cliPath` เป็นสคริปต์ wrapper ที่ SSH ไปยัง Mac เครื่องนั้นแล้วรัน `imsg "$@"`

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    จากนั้นรัน:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM ถูกละเว้น">
    ตรวจสอบ:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - การอนุมัติการจับคู่ (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกละเว้น">
    ตรวจสอบ:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - พฤติกรรม allowlist ของ `channels.imessage.groups`
    - การตั้งค่า mention pattern (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="ไฟล์แนบระยะไกลล้มเหลว">
    ตรวจสอบ:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - การยืนยันตัวตนด้วยคีย์ SSH/SCP จากโฮสต์ Gateway
    - มี host key อยู่ใน `~/.ssh/known_hosts` บนโฮสต์ Gateway
    - ความสามารถในการอ่าน path ระยะไกลบน Mac ที่รัน Messages

  </Accordion>

  <Accordion title="พลาด prompt สิทธิ์ของ macOS">
    รันอีกครั้งใน terminal GUI แบบ interactive ภายในบริบทผู้ใช้/เซสชันเดียวกัน และอนุมัติ prompt:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    ยืนยันว่า Full Disk Access + Automation ได้รับอนุญาตสำหรับบริบท process ที่รัน OpenClaw/`imsg`

  </Accordion>
</AccordionGroup>

## ตัวชี้ไปยังข้อมูลอ้างอิงการกำหนดค่า

- [ข้อมูลอ้างอิงการกำหนดค่า - iMessage](/th/gateway/config-channels#imessage)
- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [การจับคู่](/th/channels/pairing)

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การนำ BlueBubbles ออกและ path iMessage ของ imsg](/th/announcements/bluebubbles-imessage) — ประกาศและสรุปการย้ายระบบ
- [ย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) — ตารางแปล config และขั้นตอน cutover ทีละขั้น
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และ flow การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการ gate ด้วย mention
- [Channel Routing](/th/channels/channel-routing) — การ routing เซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการ hardening
