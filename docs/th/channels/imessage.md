---
read_when:
    - การตั้งค่าการรองรับ iMessage
    - การดีบักการส่ง/รับ iMessage
summary: รองรับ iMessage แบบเนทีฟผ่าน imsg (JSON-RPC ผ่าน stdio) พร้อมการกระทำของ API ส่วนตัวสำหรับการตอบกลับ, tapbacks, เอฟเฟกต์, โพล, ไฟล์แนบ และการจัดการกลุ่ม เหมาะเป็นตัวเลือกที่แนะนำสำหรับการตั้งค่า OpenClaw iMessage ใหม่เมื่อข้อกำหนดของโฮสต์เหมาะสม
title: iMessage
x-i18n:
    generated_at: "2026-07-01T13:27:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
สำหรับการปรับใช้ OpenClaw iMessage ให้ใช้ `imsg` บนโฮสต์ Messages ของ macOS ที่ลงชื่อเข้าใช้แล้ว หาก Gateway ของคุณทำงานบน Linux หรือ Windows ให้ชี้ `channels.imessage.cliPath` ไปยัง SSH wrapper ที่รัน `imsg` บน Mac

**การกู้คืนขาเข้าเป็นแบบอัตโนมัติ** หลังจาก bridge หรือ gateway รีสตาร์ต iMessage จะเล่นข้อความที่พลาดไประหว่างที่ระบบหยุดทำงานซ้ำ และระงับ "backlog bomb" เก่าที่ Apple อาจปล่อยออกมาหลังการกู้คืน Push พร้อมทำ dedupe เพื่อไม่ให้มีสิ่งใดถูก dispatch ซ้ำ ไม่มี config ที่ต้องเปิดใช้ — ดู [การกู้คืนขาเข้าหลังจาก bridge หรือ gateway รีสตาร์ต](#inbound-recovery-after-a-bridge-or-gateway-restart)
</Note>

<Warning>
การรองรับ BlueBubbles ถูกลบออกแล้ว ย้าย config `channels.bluebubbles` ไปยัง `channels.imessage`; OpenClaw รองรับ iMessage ผ่าน `imsg` เท่านั้น เริ่มจาก [การลบ BlueBubbles และเส้นทาง imsg สำหรับ iMessage](/th/announcements/bluebubbles-imessage) สำหรับประกาศฉบับสั้น หรือ [ย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) สำหรับตารางการย้ายฉบับเต็ม
</Warning>

สถานะ: การผสานรวม CLI ภายนอกแบบ native Gateway จะ spawn `imsg rpc` และสื่อสารผ่าน JSON-RPC บน stdio (ไม่มี daemon/port แยกต่างหาก) การดำเนินการขั้นสูงต้องใช้ `imsg launch` และการ probe private API ที่สำเร็จ

<CardGroup cols={3}>
  <Card title="การดำเนินการ Private API" icon="wand-sparkles" href="#private-api-actions">
    การตอบกลับ, tapbacks, เอฟเฟกต์, โพล, ไฟล์แนบ และการจัดการกลุ่ม
  </Card>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ iMessage ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="Mac ระยะไกล" icon="terminal" href="#remote-mac-over-ssh">
    ใช้ SSH wrapper เมื่อ Gateway ไม่ได้ทำงานบน Mac ที่รัน Messages
  </Card>
  <Card title="อ้างอิงการกำหนดค่า" icon="settings" href="/th/gateway/config-channels#imessage">
    อ้างอิงฟิลด์ iMessage ฉบับเต็ม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="Mac ภายในเครื่อง (เส้นทางเร็ว)">
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

      <Step title="เริ่ม gateway">

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
    OpenClaw ต้องการเพียง `cliPath` ที่เข้ากันได้กับ stdio ดังนั้นคุณสามารถชี้ `cliPath` ไปยังสคริปต์ wrapper ที่ SSH ไปยัง Mac ระยะไกลและรัน `imsg`

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    config ที่แนะนำเมื่อเปิดใช้ไฟล์แนบ:

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

    หากไม่ได้ตั้งค่า `remoteHost` OpenClaw จะพยายามตรวจหาโดยอัตโนมัติด้วยการ parse สคริปต์ SSH wrapper
    `remoteHost` ต้องเป็น `host` หรือ `user@host` (ไม่มีช่องว่างหรือ option ของ SSH)
    OpenClaw ใช้การตรวจสอบ host-key แบบเข้มงวดสำหรับ SCP ดังนั้น key ของโฮสต์ relay ต้องมีอยู่แล้วใน `~/.ssh/known_hosts`
    เส้นทางไฟล์แนบจะถูกตรวจสอบกับ roots ที่อนุญาต (`attachmentRoots` / `remoteAttachmentRoots`)

<Warning>
`cliPath` wrapper หรือ SSH proxy ใดๆ ที่คุณวางไว้หน้า `imsg` ต้องทำงานเหมือนท่อ stdio แบบโปร่งใสสำหรับ JSON-RPC ที่ทำงานยาวนาน OpenClaw แลกเปลี่ยนข้อความ JSON-RPC ขนาดเล็กที่คั่นด้วย newline ผ่าน stdin/stdout ของ wrapper ตลอดอายุของ channel:

- ส่งต่อ stdin chunk/line แต่ละรายการ **ทันทีที่มี bytes พร้อมใช้งาน** — อย่ารอ EOF
- ส่งต่อ stdout chunk/line แต่ละรายการอย่างรวดเร็วในทิศทางกลับกัน
- รักษา newlines ไว้
- หลีกเลี่ยงการอ่านแบบ blocking ขนาดคงที่ (`read(4096)`, `cat | buffer`, `read` เริ่มต้นของ shell) ที่อาจทำให้ frame ขนาดเล็กอดรอ
- แยก stderr ออกจาก stream stdout ของ JSON-RPC

wrapper ที่ buffer stdin จนกว่าบล็อกขนาดใหญ่จะเต็มจะทำให้เกิดอาการที่ดูเหมือน iMessage ล่ม — `imsg rpc timeout (chats.list)` หรือ channel รีสตาร์ตซ้ำ — แม้ว่า `imsg rpc` เองจะปกติ `ssh -T host imsg "$@"` (ด้านบน) ปลอดภัยเพราะส่งต่ออาร์กิวเมนต์ `cliPath` ของ OpenClaw เช่น `rpc` และ `--db` pipeline อย่าง `ssh host imsg | grep -v '^DEBUG'` ไม่ปลอดภัย — เครื่องมือแบบ line-buffered ยังอาจกัก frame ไว้ได้; ใช้ `stdbuf -oL -eL` ในทุก stage หากคุณจำเป็นต้อง filter
</Warning>

  </Tab>
</Tabs>

## ข้อกำหนดและสิทธิ์ (macOS)

- Messages ต้องลงชื่อเข้าใช้บน Mac ที่รัน `imsg`
- ต้องมี Full Disk Access สำหรับ process context ที่รัน OpenClaw/`imsg` (การเข้าถึง Messages DB)
- ต้องมีสิทธิ์ Automation เพื่อส่งข้อความผ่าน Messages.app
- สำหรับการดำเนินการขั้นสูง (react / edit / unsend / threaded reply / effects / polls / group ops) ต้องปิด System Integrity Protection — ดู [การเปิดใช้ imsg private API](#enabling-the-imsg-private-api) ด้านล่าง การส่ง/รับข้อความและสื่อพื้นฐานทำงานได้โดยไม่ต้องปิด

<Tip>
สิทธิ์จะถูกให้ตาม process context หาก gateway ทำงานแบบ headless (LaunchAgent/SSH) ให้รันคำสั่งแบบ interactive ครั้งเดียวใน context เดียวกันนั้นเพื่อเรียก prompt:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="การส่งผ่าน SSH wrapper ล้มเหลวด้วย AppleEvents -1743">
  การตั้งค่า remote-SSH อาจอ่านแชท ผ่าน `channels status --probe` และประมวลผลข้อความขาเข้าได้ ในขณะที่การส่งขาออกยังล้มเหลวด้วยข้อผิดพลาดการอนุญาต AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

ตรวจสอบฐานข้อมูล TCC ของผู้ใช้ Mac ที่ลงชื่อเข้าใช้ หรือ System Settings > Privacy & Security > Automation หากรายการ Automation ถูกบันทึกสำหรับ `/usr/libexec/sshd-keygen-wrapper` แทนที่จะเป็น process `imsg` หรือ shell ภายในเครื่อง macOS อาจไม่แสดง toggle ของ Messages ที่ใช้งานได้สำหรับ client ฝั่งเซิร์ฟเวอร์ SSH นั้น:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

ในสถานะนั้น การรัน `tccutil reset AppleEvents` ซ้ำหรือรัน `imsg send` ผ่าน SSH wrapper เดิมอีกครั้งอาจยังล้มเหลว เพราะ process context ที่ต้องการ Messages Automation คือ SSH wrapper ไม่ใช่แอปที่ UI สามารถให้สิทธิ์ได้

ใช้หนึ่งใน process context ของ `imsg` ที่รองรับแทน:

- รัน Gateway หรืออย่างน้อย bridge ของ `imsg` ใน session ภายในเครื่องของผู้ใช้ Messages ที่ล็อกอินอยู่
- เริ่ม Gateway ด้วย LaunchAgent สำหรับผู้ใช้นั้นหลังจากให้ Full Disk Access และ Automation จาก session เดียวกัน
- หากคุณยังคงใช้ topology SSH แบบสองผู้ใช้ ให้ตรวจสอบว่า `imsg send` ขาออกจริงสำเร็จผ่าน wrapper ที่ตรงกันทุกประการก่อนเปิดใช้ channel หากไม่สามารถให้สิทธิ์ Automation ได้ ให้ปรับเป็นการตั้งค่า `imsg` แบบผู้ใช้เดียวแทนการพึ่งพา SSH wrapper สำหรับการส่ง

</Accordion>

## การเปิดใช้ imsg private API

`imsg` มาพร้อมโหมดการทำงานสองแบบ:

- **โหมดพื้นฐาน** (ค่าเริ่มต้น ไม่ต้องเปลี่ยน SIP): ข้อความและสื่อขาออกผ่าน `send`, การ watch/history ขาเข้า, รายการแชท นี่คือสิ่งที่ได้ทันทีจาก `brew install steipete/tap/imsg` ใหม่พร้อมสิทธิ์ macOS มาตรฐานด้านบน
- **โหมด Private API**: `imsg` inject helper dylib เข้าไปใน `Messages.app` เพื่อเรียกฟังก์ชัน `IMCore` ภายใน นี่คือสิ่งที่ปลดล็อก `react`, `edit`, `unsend`, `reply` (แบบ thread), `sendWithEffect`, `poll` และ `poll-vote` (โพล native ของ Messages), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` รวมถึง typing indicators และ read receipts

เพื่อเข้าถึงพื้นผิวการดำเนินการขั้นสูงที่หน้า channel นี้บันทึกไว้ คุณต้องใช้โหมด Private API README ของ `imsg` ระบุข้อกำหนดไว้อย่างชัดเจน:

> ฟีเจอร์ขั้นสูง เช่น `read`, `typing`, `launch`, การส่ง rich send ที่มี bridge รองรับ, การแก้ไขข้อความ และการจัดการแชท เป็นแบบ opt-in ฟีเจอร์เหล่านี้ต้องปิด SIP และ inject helper dylib เข้าไปใน `Messages.app` `imsg launch` จะปฏิเสธการ inject เมื่อเปิดใช้ SIP อยู่

เทคนิค helper-injection ใช้ dylib ของ `imsg` เองเพื่อเข้าถึง private APIs ของ Messages ไม่มีเซิร์ฟเวอร์บุคคลที่สามหรือ runtime ของ BlueBubbles ในเส้นทาง OpenClaw iMessage

<Warning>
**การปิด SIP เป็น tradeoff ด้านความปลอดภัยจริง** SIP เป็นหนึ่งในการป้องกันหลักของ macOS ต่อการรันโค้ดระบบที่ถูกแก้ไข; การปิดทั้งระบบจะเปิดพื้นที่โจมตีและผลข้างเคียงเพิ่มเติม โดยเฉพาะอย่างยิ่ง **การปิด SIP บน Mac ที่ใช้ Apple Silicon จะปิดความสามารถในการติดตั้งและรันแอป iOS บน Mac ของคุณด้วย**

ให้มองว่านี่เป็นการตัดสินใจด้านปฏิบัติการโดยเจตนา ไม่ใช่ค่าเริ่มต้น หาก threat model ของคุณไม่สามารถยอมรับการปิด SIP ได้ iMessage ที่ bundled จะจำกัดอยู่ที่โหมดพื้นฐาน — ส่ง/รับข้อความและสื่อเท่านั้น ไม่มี reactions / edit / unsend / effects / group ops
</Warning>

### การตั้งค่า

1. **ติดตั้ง (หรืออัปเกรด) `imsg`** บน Mac ที่รัน Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   output ของ `imsg status --json` รายงาน `bridge_version`, `rpc_methods` และ `selectors` ราย method เพื่อให้คุณเห็นว่า build ปัจจุบันรองรับอะไรบ้างก่อนเริ่ม

2. **ปิด System Integrity Protection และ (บน macOS รุ่นใหม่) Library Validation** การ inject helper dylib ที่ไม่ใช่ของ Apple เข้าไปใน `Messages.app` ที่ signed โดย Apple ต้องปิด SIP **และ** ผ่อนคลาย library validation ขั้นตอน SIP ใน Recovery mode ขึ้นอยู่กับเวอร์ชัน macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** ปิด Library Validation ผ่าน Terminal, reboot เข้าสู่ Recovery Mode, รัน `csrutil disable`, restart
   - **macOS 11+ (Big Sur และใหม่กว่า), Intel:** Recovery Mode (หรือ Internet Recovery), `csrutil disable`, restart
   - **macOS 11+, Apple Silicon:** ลำดับการเริ่มต้นด้วยปุ่ม power เพื่อเข้าสู่ Recovery; บน macOS เวอร์ชันล่าสุดให้กดปุ่ม **Left Shift** ค้างไว้เมื่อคุณคลิก Continue แล้วจึง `csrutil disable` การตั้งค่า virtual machine ใช้ flow แยกต่างหาก ดังนั้นให้สร้าง VM snapshot ก่อน

   **บน macOS 11 และใหม่กว่า โดยปกติ `csrutil disable` เพียงอย่างเดียวไม่พอ** Apple ยังบังคับใช้ library validation กับ `Messages.app` ในฐานะ platform binary ดังนั้น helper ที่ signed แบบ adhoc จะถูกปฏิเสธ (`Library Validation failed: ... platform binary, but mapped file is not`) แม้จะปิด SIP แล้ว หลังจากปิด SIP ให้ปิด library validation ด้วยและ reboot:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), ตรวจสอบแล้วบน 26.5.1:** การปิด SIP **ร่วมกับ** คำสั่ง `DisableLibraryValidation` ด้านบนเพียงพอสำหรับ inject helper ตลอดช่วง 26.0 ถึง 26.5.x **ไม่ต้องใช้ boot-args** plist คือปัจจัยชี้ขาดและเป็นขั้นตอนที่มักขาดมากที่สุดเมื่อ injection ล้มเหลวบน Tahoe:
   - **เมื่อมี plist:** `imsg launch` inject ได้ และ `imsg status` รายงาน `advanced_features: true`
   - **เมื่อไม่มี plist (แม้จะปิด SIP แล้ว):** `imsg launch` ล้มเหลวด้วย `Failed to launch: Timeout waiting for Messages.app to initialize` AMFI ปฏิเสธ helper แบบ adhoc ตอน load ดังนั้น bridge จึงไม่พร้อมและ launch timeout timeout นั้นคืออาการที่คนส่วนใหญ่เจอบน Tahoe และวิธีแก้คือ plist ด้านบน ไม่ใช่อะไรที่รุนแรงกว่านั้น

   สิ่งนี้ได้รับการยืนยันด้วยการควบคุมก่อน/หลังบน macOS 26.5.1 (Apple Silicon): เมื่อมี plist dylib จะ map เข้าไปใน `Messages.app` และ bridge จะเริ่มทำงาน; ลบ plist แล้ว reboot แล้ว `imsg launch` จะสร้าง timeout failure ด้านบนพร้อมกับ dylib ที่ไม่ถูก map

   หากการฉีด `imsg launch` หรือ `selectors` เฉพาะเริ่มคืนค่า false หลังอัปเกรด macOS เกตนี้มักเป็นสาเหตุปกติ ตรวจสอบสถานะ SIP และ library-validation ของคุณก่อนสรุปว่าขั้นตอน SIP เองล้มเหลว หากการตั้งค่าเหล่านั้นถูกต้องและบริดจ์ยังฉีดไม่ได้ ให้เก็บ `imsg status --json` พร้อมเอาต์พุต `imsg launch` แล้วรายงานไปยังโปรเจกต์ `imsg` แทนการลดความแข็งแรงของการควบคุมความปลอดภัยระดับระบบเพิ่มเติม

   ทำตามขั้นตอนโหมด Recovery ของ Apple สำหรับ Mac ของคุณเพื่อปิดใช้งาน SIP ก่อนรัน `imsg launch`

3. **ฉีดตัวช่วย** เมื่อปิดใช้งาน SIP แล้วและ Messages.app ลงชื่อเข้าใช้แล้ว:

   ```bash
   imsg launch
   ```

   `imsg launch` จะปฏิเสธการฉีดเมื่อ SIP ยังเปิดใช้งานอยู่ ดังนั้นคำสั่งนี้จึงใช้ยืนยันได้ด้วยว่าขั้นตอนที่ 2 มีผลแล้ว

4. **ตรวจสอบบริดจ์จาก OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   รายการ iMessage ควรรายงาน `works` และ `imsg status --json | jq '{rpc_methods, selectors}'` ควรแสดงความสามารถที่เปิดเผยโดยบิลด์ macOS ของคุณ การสร้างโพลต้องใช้ `selectors.pollPayloadMessage`; การโหวตต้องใช้ทั้ง `selectors.pollVoteMessage` และเมธอด RPC `poll.vote` Plugin ของ OpenClaw จะประกาศเฉพาะการกระทำที่รองรับโดยการโพรบที่แคชไว้ ส่วนแคชว่างจะยังมองในแง่บวกและโพรบเมื่อส่งครั้งแรก

หาก `openclaw channels status --probe` รายงานว่าช่องทางเป็น `works` แต่การกระทำเฉพาะโยนข้อผิดพลาด "iMessage `<action>` requires the imsg private API bridge" ตอนส่ง ให้รัน `imsg launch` อีกครั้ง — ตัวช่วยอาจหลุดออกได้ (Messages.app รีสตาร์ต, อัปเดต OS ฯลฯ) และสถานะ `available: true` ที่แคชไว้จะยังคงประกาศการกระทำต่อไปจนกว่าการโพรบครั้งถัดไปจะรีเฟรช

### เมื่อคุณปิดใช้งาน SIP ไม่ได้

หากการปิดใช้งาน SIP ไม่เป็นที่ยอมรับสำหรับโมเดลภัยคุกคามของคุณ:

- `imsg` จะถอยกลับไปใช้โหมดพื้นฐาน — ข้อความ + สื่อ + รับเท่านั้น
- Plugin ของ OpenClaw ยังประกาศการส่งข้อความ/สื่อและการเฝ้าติดตามขาเข้า เพียงแต่ซ่อน `react`, `edit`, `unsend`, `reply`, `sendWithEffect` และการทำงานกลุ่มออกจากพื้นผิวการกระทำ (ตามเกตความสามารถรายเมธอด)
- คุณสามารถรัน Mac ที่ไม่ใช่ Apple Silicon แยกต่างหาก (หรือ Mac สำหรับบอตโดยเฉพาะ) โดยปิด SIP สำหรับภาระงาน iMessage ขณะที่ยังคงเปิด SIP บนอุปกรณ์หลักของคุณ ดู [Dedicated bot macOS user (separate iMessage identity)](#deployment-patterns) ด้านล่าง

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` ควบคุมข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` รวม `"*"`)
    - `disabled`

    ฟิลด์ allowlist: `channels.imessage.allowFrom`

    รายการ allowlist ต้องระบุผู้ส่ง: แฮนเดิลหรือกลุ่มการเข้าถึงผู้ส่งแบบคงที่ (`accessGroup:<name>`) ใช้ `channels.imessage.groupAllowFrom` สำหรับเป้าหมายแชต เช่น `chat_id:*`, `chat_guid:*` หรือ `chat_identifier:*`; ใช้ `channels.imessage.groups` สำหรับคีย์รีจิสทรี `chat_id` แบบตัวเลข

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` ควบคุมการจัดการกลุ่ม:

    - `allowlist` (ค่าเริ่มต้นเมื่อกำหนดค่า)
    - `open`
    - `disabled`

    allowlist ผู้ส่งกลุ่ม: `channels.imessage.groupAllowFrom`

    รายการ `groupAllowFrom` ยังสามารถอ้างอิงกลุ่มการเข้าถึงผู้ส่งแบบคงที่ได้ (`accessGroup:<name>`)

    การถอยกลับขณะรันไทม์: หากไม่ได้ตั้งค่า `groupAllowFrom` การตรวจสอบผู้ส่งกลุ่ม iMessage จะใช้ `allowFrom`; ตั้งค่า `groupAllowFrom` เมื่อการอนุญาตเข้า DM และกลุ่มควรแตกต่างกัน
    หมายเหตุขณะรันไทม์: หาก `channels.imessage` หายไปทั้งหมด รันไทม์จะถอยกลับไปใช้ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` แล้วก็ตาม)

    <Warning>
    การกำหนดเส้นทางกลุ่มมีเกต allowlist **สอง** ชั้นที่ทำงานต่อเนื่องกัน และทั้งสองต้องผ่าน:

    1. **allowlist ผู้ส่ง / เป้าหมายแชต** (`channels.imessage.groupAllowFrom`) — แฮนเดิล, `chat_guid`, `chat_identifier` หรือ `chat_id`
    2. **รีจิสทรีกลุ่ม** (`channels.imessage.groups`) — เมื่อใช้ `groupPolicy: "allowlist"` เกตนี้ต้องมีรายการไวลด์การ์ด `groups: { "*": { ... } }` (ตั้งค่า `allowAll = true`) หรือรายการต่อ `chat_id` แบบชัดเจนภายใต้ `groups`

    หากเกต 2 ไม่มีอะไรเลย ข้อความกลุ่มทุกข้อความจะถูกทิ้ง Plugin จะส่งสัญญาณระดับ `warn` สองรายการที่ระดับล็อกเริ่มต้น:

    - หนึ่งครั้งต่อบัญชีตอนเริ่มต้น: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - หนึ่งครั้งต่อ `chat_id` ขณะรันไทม์: `imessage: dropping group message from chat_id=<id> ...`

    DM ยังคงทำงานต่อไปเพราะใช้เส้นทางโค้ดคนละแบบ

    การกำหนดค่าขั้นต่ำเพื่อให้กลุ่มยังไหลภายใต้ `groupPolicy: "allowlist"`:

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

    หากบรรทัด `warn` เหล่านั้นปรากฏในล็อก Gateway แสดงว่าเกต 2 กำลังทิ้งข้อความ — เพิ่มบล็อก `groups`
    </Warning>

    เกตการกล่าวถึงสำหรับกลุ่ม:

    - iMessage ไม่มีเมทาดาทาการกล่าวถึงแบบเนทีฟ
    - การตรวจจับการกล่าวถึงใช้แพตเทิร์น regex (`agents.list[].groupChat.mentionPatterns`, ถอยกลับไปใช้ `messages.groupChat.mentionPatterns`)
    - หากไม่มีแพตเทิร์นที่กำหนดค่าไว้ จะไม่สามารถบังคับใช้เกตการกล่าวถึงได้

    คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตสามารถข้ามเกตการกล่าวถึงในกลุ่มได้

    `systemPrompt` รายกลุ่ม:

    แต่ละรายการภายใต้ `channels.imessage.groups.*` รับสตริง `systemPrompt` แบบไม่บังคับ ค่าจะถูกฉีดเข้าไปใน system prompt ของเอเจนต์ในทุกเทิร์นที่จัดการข้อความในกลุ่มนั้น การแก้ค่าจะสะท้อนการแก้ prompt รายกลุ่มที่ใช้โดย `channels.whatsapp.groups`:

    1. **system prompt เฉพาะกลุ่ม** (`groups["<chat_id>"].systemPrompt`): ใช้เมื่อรายการกลุ่มเฉพาะมีอยู่ในแมป **และ** คีย์ `systemPrompt` ของรายการนั้นถูกกำหนดไว้ หาก `systemPrompt` เป็นสตริงว่าง (`""`) ไวลด์การ์ดจะถูกระงับและจะไม่มีการใช้ system prompt กับกลุ่มนั้น
    2. **system prompt ไวลด์การ์ดของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อรายการกลุ่มเฉพาะไม่มีอยู่ในแมปเลย หรือเมื่อมีอยู่แต่ไม่ได้กำหนดคีย์ `systemPrompt`

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

    prompt รายกลุ่มใช้กับข้อความกลุ่มเท่านั้น — ข้อความโดยตรงในช่องทางนี้จะไม่ได้รับผลกระทบ

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DM ใช้การกำหนดเส้นทางโดยตรง; กลุ่มใช้การกำหนดเส้นทางกลุ่ม
    - เมื่อใช้ค่าเริ่มต้น `session.dmScope=main` DM ของ iMessage จะถูกรวมเข้าในเซสชันหลักของเอเจนต์
    - เซสชันกลุ่มถูกแยกออกจากกัน (`agent:<agentId>:imessage:group:<chat_id>`)
    - การตอบกลับจะถูกส่งกลับไปยัง iMessage โดยใช้เมทาดาทาช่องทาง/เป้าหมายต้นทาง

    พฤติกรรมเธรดคล้ายกลุ่ม:

    เธรด iMessage ที่มีผู้เข้าร่วมหลายคนบางรายการอาจมาพร้อม `is_group=false`
    หาก `chat_id` นั้นถูกกำหนดค่าอย่างชัดเจนภายใต้ `channels.imessage.groups` OpenClaw จะถือว่าเป็นทราฟฟิกกลุ่ม (เกตกลุ่ม + การแยกเซสชันกลุ่ม)

  </Tab>
</Tabs>

## การผูกการสนทนา ACP

แชต iMessage แบบเดิมยังสามารถผูกกับเซสชัน ACP ได้ด้วย

ขั้นตอนด่วนสำหรับโอเปอเรเตอร์:

- รัน `/acp spawn codex --bind here` ภายใน DM หรือแชตกลุ่มที่อนุญาต
- ข้อความในอนาคตในบทสนทนา iMessage เดียวกันจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ถูกสร้างขึ้น
- `/new` และ `/reset` รีเซ็ตเซสชัน ACP ที่ผูกอยู่เดิมในที่เดิม
- `/acp close` ปิดเซสชัน ACP และลบการผูก

รองรับการผูกแบบคงอยู่ที่กำหนดค่าไว้ผ่านรายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` และ `match.channel: "imessage"`

`match.peer.id` สามารถใช้:

- แฮนเดิล DM ที่ถูกนอร์มัลไลซ์ เช่น `+15555550123` หรือ `user@example.com`
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

ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับพฤติกรรมการผูก ACP ร่วมกัน

## รูปแบบการปรับใช้

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    ใช้ Apple ID และผู้ใช้ macOS เฉพาะ เพื่อแยกทราฟฟิกบอตออกจากโปรไฟล์ Messages ส่วนตัวของคุณ

    ขั้นตอนทั่วไป:

    1. สร้าง/ลงชื่อเข้าใช้ผู้ใช้ macOS เฉพาะ
    2. ลงชื่อเข้าใช้ Messages ด้วย Apple ID ของบอตในผู้ใช้นั้น
    3. ติดตั้ง `imsg` ในผู้ใช้นั้น
    4. สร้าง SSH wrapper เพื่อให้ OpenClaw รัน `imsg` ในบริบทผู้ใช้นั้นได้
    5. ชี้ `channels.imessage.accounts.<id>.cliPath` และ `.dbPath` ไปยังโปรไฟล์ผู้ใช้นั้น

    การรันครั้งแรกอาจต้องมีการอนุมัติผ่าน GUI (Automation + Full Disk Access) ในเซสชันผู้ใช้บอตนั้น

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
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
    ตรวจสอบให้แน่ใจก่อนว่าโฮสต์คีย์เชื่อถือได้ (เช่น `ssh bot@mac-mini.tailnet-1234.ts.net`) เพื่อให้ `known_hosts` ถูกเติมข้อมูล

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage รองรับการกำหนดค่ารายบัญชีภายใต้ `channels.imessage.accounts`

    แต่ละบัญชีสามารถ override ฟิลด์ เช่น `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, การตั้งค่าประวัติ และ allowlist รากไฟล์แนบ

  </Accordion>

  <Accordion title="Direct-message history">
    ตั้งค่า `channels.imessage.dmHistoryLimit` เพื่อป้อนประวัติ `imsg` ที่ถอดรหัสล่าสุดสำหรับบทสนทนานั้นให้กับเซสชันข้อความโดยตรงใหม่ ใช้ `channels.imessage.dms["<sender>"].historyLimit` สำหรับการ override รายผู้ส่ง รวมถึง `0` เพื่อปิดใช้งานประวัติสำหรับผู้ส่งหนึ่งราย

    ประวัติ DM ของ iMessage จะถูกดึงตามต้องการจาก `imsg` การไม่ตั้งค่า `dmHistoryLimit` จะปิดใช้งานการป้อนประวัติ DM แบบรวม แต่ `channels.imessage.dms["<sender>"].historyLimit` รายผู้ส่งที่เป็นค่าบวกยังคงเปิดใช้งานการป้อนประวัติสำหรับผู้ส่งนั้น

  </Accordion>
</AccordionGroup>

## สื่อ การแบ่งชิ้น และเป้าหมายการส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบและสื่อ">
    - การรับไฟล์แนบขาเข้าถูก**ปิดเป็นค่าเริ่มต้น** — ตั้งค่า `channels.imessage.includeAttachments: true` เพื่อส่งต่อรูปภาพ บันทึกเสียง วิดีโอ และไฟล์แนบอื่น ๆ ไปยังเอเจนต์ เมื่อปิดอยู่ iMessage ที่มีเฉพาะไฟล์แนบจะถูกทิ้งก่อนถึงเอเจนต์ และอาจไม่สร้างบรรทัดล็อก `Inbound message` เลย
    - สามารถดึงพาธไฟล์แนบระยะไกลผ่าน SCP ได้เมื่อกำหนด `remoteHost`
    - พาธไฟล์แนบต้องตรงกับรากที่อนุญาต:
      - `channels.imessage.attachmentRoots` (ภายในเครื่อง)
      - `channels.imessage.remoteAttachmentRoots` (โหมด SCP ระยะไกล)
      - รูปแบบรากเริ่มต้น: `/Users/*/Library/Messages/Attachments`
    - SCP ใช้การตรวจสอบคีย์โฮสต์แบบเข้มงวด (`StrictHostKeyChecking=yes`)
    - ขนาดสื่อขาออกใช้ `channels.imessage.mediaMaxMb` (ค่าเริ่มต้น 16 MB)

  </Accordion>

  <Accordion title="การแบ่งข้อความขาออก">
    - ขีดจำกัดชิ้นข้อความ: `channels.imessage.textChunkLimit` (ค่าเริ่มต้น 4000)
    - โหมดแบ่งชิ้น: `channels.imessage.chunkMode`
      - `length` (ค่าเริ่มต้น)
      - `newline` (แยกโดยยึดย่อหน้าก่อน)

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

## การดำเนินการ Private API

เมื่อ `imsg launch` ทำงานอยู่และ `openclaw channels status --probe` รายงาน `privateApi.available: true` เครื่องมือข้อความสามารถใช้การดำเนินการแบบเนทีฟของ iMessage นอกเหนือจากการส่งข้อความปกติได้

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
  <Accordion title="การดำเนินการที่มีให้ใช้">
    - **react**: เพิ่ม/ลบ tapback ของ iMessage (`messageId`, `emoji`, `remove`) tapback ที่รองรับแมปไปยัง love, like, dislike, laugh, emphasize และ question
    - **reply**: ส่งคำตอบแบบเธรดไปยังข้อความที่มีอยู่ (`messageId`, `text` หรือ `message` รวมถึง `chatGuid`, `chatId`, `chatIdentifier` หรือ `to`)
    - **sendWithEffect**: ส่งข้อความพร้อมเอฟเฟกต์ iMessage (`text` หรือ `message`, `effect` หรือ `effectId`)
    - **edit**: แก้ไขข้อความที่ส่งแล้วบนเวอร์ชัน macOS/private API ที่รองรับ (`messageId`, `text` หรือ `newText`)
    - **unsend**: ถอนข้อความที่ส่งแล้วบนเวอร์ชัน macOS/private API ที่รองรับ (`messageId`)
    - **upload-file**: ส่งสื่อ/ไฟล์ (`buffer` เป็น base64 หรือ `media`/`path`/`filePath` ที่เติมข้อมูลแล้ว, `filename`, ตัวเลือก `asVoice`) ชื่อแทนเดิม: `sendAttachment`
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: จัดการแชตกลุ่มเมื่อเป้าหมายปัจจุบันเป็นการสนทนากลุ่ม
    - **poll**: สร้างโพลเนทีฟของ Apple Messages (`pollQuestion`, `pollOption` ซ้ำ 2 ถึง 12 ครั้ง รวมถึง `chatGuid`, `chatId`, `chatIdentifier` หรือ `to`) ผู้รับบน iOS/iPadOS/macOS 26+ จะเห็นและโหวตได้แบบเนทีฟ เวอร์ชัน OS ที่เก่ากว่าจะได้รับข้อความสำรอง "ส่งโพลแล้ว" ต้องใช้ `selectors.pollPayloadMessage`
    - **poll-vote**: โหวตในโพลที่มีอยู่ (`pollId` หรือ `messageId` รวมถึงอย่างใดอย่างหนึ่งเท่านั้นจาก `pollOptionIndex`, `pollOptionId` หรือ `pollOptionText`) ต้องใช้ `selectors.pollVoteMessage` และเมธอด RPC `poll.vote`

    โพลขาเข้าที่ถูกยอมรับจะแสดงผลให้เอเจนต์พร้อมคำถาม ป้ายกำกับตัวเลือกแบบมีหมายเลข จำนวนโหวต และ ID ข้อความโพลที่ `poll-vote` ต้องใช้

  </Accordion>

  <Accordion title="ID ข้อความ">
    บริบท iMessage ขาเข้าจะมีทั้งค่า `MessageSid` แบบสั้นและ GUID ข้อความแบบเต็มเมื่อมีให้ใช้ ID แบบสั้นมีขอบเขตอยู่ในแคชการตอบกลับล่าสุดที่หนุนด้วย SQLite และจะถูกตรวจสอบกับแชตปัจจุบันก่อนใช้งาน หาก ID แบบสั้นหมดอายุหรือเป็นของแชตอื่น ให้ลองใหม่ด้วย `MessageSidFull` แบบเต็ม

  </Accordion>

  <Accordion title="การตรวจจับความสามารถ">
    OpenClaw ซ่อนการดำเนินการ Private API เฉพาะเมื่อสถานะโพรบที่แคชไว้ระบุว่า bridge ไม่พร้อมใช้งาน หากสถานะไม่ทราบ การดำเนินการจะยังคงมองเห็นได้และการจัดส่งจะโพรบแบบหน่วงเวลา เพื่อให้การดำเนินการแรกสำเร็จได้หลัง `imsg launch` โดยไม่ต้องรีเฟรชสถานะเองแยกต่างหาก

  </Accordion>

  <Accordion title="ใบตอบรับการอ่านและการพิมพ์">
    เมื่อ bridge ของ Private API พร้อมใช้งาน แชตขาเข้าที่ถูกยอมรับจะถูกทำเครื่องหมายว่าอ่านแล้ว และแชตโดยตรงจะแสดงฟองกำลังพิมพ์ทันทีที่เทิร์นถูกยอมรับ ขณะที่เอเจนต์เตรียมบริบทและสร้างคำตอบ ปิดการทำเครื่องหมายว่าอ่านแล้วด้วย:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    บิลด์ `imsg` รุ่นเก่าที่มีมาก่อนรายการความสามารถรายเมธอดจะปิดการพิมพ์/การอ่านอย่างเงียบ ๆ; OpenClaw จะบันทึกคำเตือนหนึ่งครั้งต่อการรีสตาร์ต เพื่อให้ทราบสาเหตุของใบตอบรับที่หายไป

  </Accordion>

  <Accordion title="Tapback ขาเข้า">
    OpenClaw สมัครรับ tapback ของ iMessage และกำหนดเส้นทางปฏิกิริยาที่ถูกยอมรับเป็นเหตุการณ์ระบบแทนข้อความปกติ ดังนั้น tapback จากผู้ใช้จะไม่ทริกเกอร์ลูปการตอบกลับตามปกติ

    โหมดการแจ้งเตือนควบคุมโดย `channels.imessage.reactionNotifications`:

    - `"own"` (ค่าเริ่มต้น): แจ้งเตือนเฉพาะเมื่อผู้ใช้ตอบสนองต่อข้อความที่บอตเป็นผู้เขียน
    - `"all"`: แจ้งเตือนสำหรับ tapback ขาเข้าทั้งหมดจากผู้ส่งที่ได้รับอนุญาต
    - `"off"`: ไม่สนใจ tapback ขาเข้า

    การแทนที่รายบัญชีใช้ `channels.imessage.accounts.<id>.reactionNotifications`

  </Accordion>

  <Accordion title="ปฏิกิริยาอนุมัติ (👍 / 👎)">
    เมื่อ `approvals.exec.enabled` หรือ `approvals.plugin.enabled` เป็น true และคำขอถูกกำหนดเส้นทางไปยัง iMessage, gateway จะส่งพรอมต์อนุมัติแบบเนทีฟและยอมรับ tapback เพื่อสรุปผล:

    - `👍` (Tapback ถูกใจ) → `allow-once`
    - `👎` (Tapback ไม่ถูกใจ) → `deny`
    - `allow-always` ยังคงเป็นทางเลือกสำรองแบบแมนนวล: ส่ง `/approve <id> allow-always` เป็นการตอบกลับปกติ

    การจัดการปฏิกิริยาต้องให้แฮนเดิลของผู้ใช้ที่ตอบสนองเป็นผู้อนุมัติที่ระบุชัดเจน รายชื่อผู้อนุมัติอ่านจาก `channels.imessage.allowFrom` (หรือ `channels.imessage.accounts.<id>.allowFrom`); เพิ่มหมายเลขโทรศัพท์ของผู้ใช้ในรูปแบบ E.164 หรืออีเมล Apple ID ของพวกเขา รายการไวลด์การ์ด `"*"` จะถูกใช้ แต่อนุญาตให้ผู้ส่งใดก็ได้อนุมัติ ทางลัดปฏิกิริยาจงใจข้าม `reactionNotifications`, `dmPolicy` และ `groupAllowFrom` เพราะ allowlist ของผู้อนุมัติที่ระบุชัดเจนเป็นด่านเดียวที่สำคัญต่อการสรุปผลการอนุมัติ

    **การเปลี่ยนแปลงพฤติกรรมในรีลีสนี้:** เมื่อ `channels.imessage.allowFrom` ไม่ว่าง คำสั่งข้อความ `/approve <id> <decision>` จะได้รับอนุญาตเทียบกับรายชื่อผู้อนุมัตินั้นแล้ว (ไม่ใช่ allowlist ของ DM ที่กว้างกว่า) ผู้ส่งที่ได้รับอนุญาตใน allowlist ของ DM แต่ไม่ได้อยู่ใน `allowFrom` จะได้รับการปฏิเสธอย่างชัดเจน เพิ่มผู้ปฏิบัติงานทุกคนที่ควรอนุมัติผ่าน `/approve` (และผ่านปฏิกิริยา) ลงใน `allowFrom` เพื่อคงพฤติกรรมเดิมไว้ เมื่อ `allowFrom` ว่าง ทางเลือกสำรองเดิมแบบ "แชตเดียวกัน" จะยังมีผล และ `/approve` จะยังอนุญาตทุกคนที่ allowlist ของ DM อนุญาต

    หมายเหตุสำหรับผู้ปฏิบัติงาน:
    - การผูกปฏิกิริยาถูกเก็บทั้งในหน่วยความจำ (พร้อม TTL ที่ตรงกับเวลาหมดอายุของการอนุมัติ) และในที่เก็บแบบคีย์ถาวรของ gateway ดังนั้น tapback ที่มาถึงไม่นานหลัง gateway รีสตาร์ตจะยังสรุปผลการอนุมัติได้
    - tapback แบบข้ามอุปกรณ์ที่ `is_from_me=true` (ปฏิกิริยาของผู้ปฏิบัติงานเองบนอุปกรณ์ Apple ที่จับคู่ไว้) จะถูกละเว้นโดยเจตนา เพื่อไม่ให้บอตอนุมัติตัวเองได้
    - tapback แบบข้อความเดิม (`Liked "…"` เป็นข้อความธรรมดาจากไคลเอนต์ Apple รุ่นเก่ามาก) ไม่สามารถสรุปผลการอนุมัติได้ เพราะไม่มี GUID ข้อความ; การสรุปผลด้วยปฏิกิริยาต้องใช้เมทาดาทา tapback แบบมีโครงสร้างที่ไคลเอนต์ macOS / iOS ปัจจุบันปล่อยออกมา

  </Accordion>
</AccordionGroup>

## การเขียนค่า config

iMessage อนุญาตให้ช่องทางเริ่มการเขียนค่า config ตามค่าเริ่มต้น (สำหรับ `/config set|unset` เมื่อ `commands.config: true`)

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

## การรวม DM ที่ถูกแบ่งส่ง (คำสั่ง + URL ในการเขียนครั้งเดียว)

เมื่อผู้ใช้พิมพ์คำสั่งและ URL พร้อมกัน — เช่น `Dump https://example.com/article` — แอป Messages ของ Apple จะแยกการส่งเป็น**สองแถว `chat.db` ที่แยกกัน**:

1. ข้อความตัวอักษร (`"Dump"`)
2. บอลลูนพรีวิว URL (`"https://..."`) พร้อมรูปภาพ OG-preview เป็นไฟล์แนบ

สองแถวนี้มาถึง OpenClaw ห่างกันประมาณ 0.8-2.0 วินาทีในสภาพแวดล้อมส่วนใหญ่ หากไม่มีการรวม เอเจนต์จะได้รับเฉพาะคำสั่งในเทิร์น 1 แล้วตอบกลับ (มักเป็น "ส่ง URL มาให้ฉัน") และเพิ่งเห็น URL ในเทิร์น 2 — ซึ่งในตอนนั้นบริบทคำสั่งหายไปแล้ว นี่เป็นไปป์ไลน์การส่งของ Apple ไม่ใช่สิ่งที่ OpenClaw หรือ `imsg` เพิ่มเข้ามา

`channels.imessage.coalesceSameSenderDms` เลือกให้ DM บัฟเฟอร์แถวต่อเนื่องจากผู้ส่งเดียวกัน เมื่อ `imsg` เปิดเผยตัวทำเครื่องหมายโครงสร้างของพรีวิว URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` บนแถวต้นทางแถวใดแถวหนึ่ง OpenClaw จะรวมเฉพาะ split-send จริงนั้น และคงแถวอื่นที่บัฟเฟอร์ไว้เป็นเทิร์นแยกกัน บนบิลด์ `imsg` รุ่นเก่าที่ไม่ปล่อยเมทาดาทา balloon เลย OpenClaw ไม่สามารถแยก split-send ออกจากการส่งแยกกันได้ จึงถอยกลับไปเป็นการรวม bucket วิธีนี้คงพฤติกรรมก่อนมีเมทาดาทาไว้ แทนที่จะถดถอย split-send แบบ `Dump <url>` ให้กลายเป็นสองเทิร์น แชตกลุ่มยังคงจัดส่งแบบรายข้อความเพื่อรักษาโครงสร้างเทิร์นของผู้ใช้หลายคนไว้

<Tabs>
  <Tab title="ควรเปิดใช้เมื่อใด">
    เปิดใช้เมื่อ:

    - คุณจัดส่ง skills ที่คาดหวัง `command + payload` ในข้อความเดียว (dump, paste, save, queue ฯลฯ)
    - ผู้ใช้ของคุณวาง URL ควบคู่กับคำสั่ง
    - คุณยอมรับ latency ของเทิร์น DM ที่เพิ่มขึ้นได้ (ดูด้านล่าง)

    ปล่อยให้ปิดอยู่เมื่อ:

    - คุณต้องการ latency ของคำสั่งต่ำที่สุดสำหรับทริกเกอร์ DM คำเดียว
    - โฟลว์ทั้งหมดของคุณเป็นคำสั่งครั้งเดียวโดยไม่มี payload ตามมา

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

    เมื่อเปิดแฟล็กและไม่มี `messages.inbound.byChannel.imessage` แบบชัดเจนหรือ `messages.inbound.debounceMs` ส่วนกลาง หน้าต่าง debounce จะขยายเป็น **7000 ms** (ค่าเริ่มต้นเดิมคือ 0 ms — ไม่มี debounce) ต้องใช้หน้าต่างที่กว้างขึ้นเพราะจังหวะ split-send ของพรีวิว URL ของ Apple อาจยืดไปหลายวินาทีขณะที่ Messages.app ปล่อยแถวพรีวิว

    หากต้องการปรับหน้าต่างเอง:

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
    - **การผสานอย่างแม่นยำต้องใช้เมตาดาต้าเพย์โหลด `imsg` ปัจจุบัน** เมื่อแถว URL มี `balloon_bundle_id` เฉพาะการส่งแบบแยกจริงนั้นเท่านั้นที่จะถูกผสาน และแถวอื่นที่พักไว้จะยังแยกกันอยู่ บนบิลด์ `imsg` รุ่นเก่าที่ไม่เปิดเผยเมตาดาต้า balloon OpenClaw จะย้อนกลับไปผสานบัคเก็ตที่พักไว้ เพื่อไม่ให้การส่งแยก `Dump <url>` ถดถอยเป็นสองเทิร์น (ความเข้ากันได้ย้อนหลังชั่วคราว จะลบออกเมื่อ `imsg` รวมการส่งแยกที่ต้นทางแล้ว)
    - **เพิ่มเวลาแฝงสำหรับข้อความ DM** เมื่อเปิดแฟล็ก DM ทุกข้อความ (รวมถึงคำสั่งควบคุมเดี่ยวและการติดตามผลแบบข้อความเดียว) จะรอได้สูงสุดเท่ากับหน้าต่าง debounce ก่อนส่งต่อ เผื่อว่ากำลังจะมีแถวตัวอย่าง URL เข้ามา ข้อความแชตกลุ่มยังคงส่งต่อทันที
    - **เอาต์พุตที่ผสานมีขอบเขตจำกัด** ข้อความที่ผสานจำกัดที่ 4000 อักขระพร้อมเครื่องหมาย `…[truncated]` อย่างชัดเจน ไฟล์แนบจำกัดที่ 20 รายการ รายการแหล่งที่มาจำกัดที่ 10 รายการ (เก็บรายการแรกบวกกับรายการล่าสุดไว้เมื่อเกินกว่านั้น) GUID ของแหล่งที่มาทุกตัวจะถูกติดตามใน `coalescedMessageGuids` สำหรับเทเลเมทรีปลายน้ำ
    - **เฉพาะ DM** แชตกลุ่มจะผ่านไปยังการส่งต่อแยกตามข้อความ เพื่อให้บอตยังตอบสนองได้เมื่อมีหลายคนกำลังพิมพ์
    - **เลือกเปิดใช้ต่อช่องทาง** ช่องทางอื่น (Telegram, WhatsApp, Slack, …) ไม่ได้รับผลกระทบ คอนฟิก BlueBubbles เดิมที่ตั้งค่า `channels.bluebubbles.coalesceSameSenderDms` ควรย้ายค่านั้นไปที่ `channels.imessage.coalesceSameSenderDms`

  </Tab>
</Tabs>

### สถานการณ์และสิ่งที่เอเจนต์เห็น

คอลัมน์ "เปิดแฟล็ก" แสดงพฤติกรรมบนบิลด์ `imsg` ที่ปล่อย `balloon_bundle_id` บนบิลด์ `imsg` รุ่นเก่าที่ไม่ปล่อยเมตาดาต้า balloon เลย แถวด้านล่างที่ระบุว่า "สองเทิร์น" / "N เทิร์น" จะย้อนกลับไปใช้การผสานแบบเดิมแทน (หนึ่งเทิร์น): OpenClaw ไม่สามารถแยกเชิงโครงสร้างได้ว่าการส่งนั้นเป็นการส่งแยกหรือการส่งแยกข้อความกัน จึงรักษาการผสานก่อนมีเมตาดาต้าไว้ การแยกอย่างแม่นยำจะเริ่มทำงานเมื่อบิลด์ปล่อยเมตาดาต้า balloon

| ผู้ใช้เขียน                                                        | `chat.db` สร้าง                     | ปิดแฟล็ก (ค่าเริ่มต้น)                       | เปิดแฟล็ก + หน้าต่าง (imsg ปล่อยเมตาดาต้า balloon)                                                       |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (ส่งครั้งเดียว)                              | 2 แถว ห่างกัน ~1 วินาที                   | สองเทิร์นเอเจนต์: "Dump" เดี่ยว ๆ แล้วตามด้วย URL | หนึ่งเทิร์น: ข้อความที่ผสาน `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (ไฟล์แนบ + ข้อความ)                | 2 แถวโดยไม่มีเมตาดาต้า URL balloon | สองเทิร์น                               | สองเทิร์นหลังสังเกตพบเมตาดาต้า; หนึ่งเทิร์นที่ผสานบนเซสชันเก่าหรือก่อน latch ที่ไม่มีเมตาดาต้า       |
| `/status` (คำสั่งเดี่ยว)                                     | 1 แถว                               | ส่งต่อทันที                        | **รอได้สูงสุดเท่ากับหน้าต่าง แล้วส่งต่อ**                                                                |
| วาง URL เพียงอย่างเดียว                                                   | 1 แถว                               | ส่งต่อทันที                        | รอได้สูงสุดเท่ากับหน้าต่าง แล้วส่งต่อ                                                                    |
| ข้อความ + URL ที่ตั้งใจส่งเป็นสองข้อความแยกกัน ห่างกันหลายนาที | 2 แถวนอกหน้าต่าง               | สองเทิร์น                               | สองเทิร์น (หน้าต่างหมดอายุระหว่างกัน)                                                             |
| ส่ง DM เล็ก ๆ รัวเร็ว (>10 รายการภายในหน้าต่าง)                          | N แถวโดยไม่มีเมตาดาต้า URL balloon | N เทิร์น                                 | N เทิร์นหลังสังเกตพบเมตาดาต้า; หนึ่งเทิร์นที่ผสานแบบมีขอบเขตบนเซสชันเก่าหรือก่อน latch ที่ไม่มีเมตาดาต้า |
| สองคนกำลังพิมพ์ในแชตกลุ่ม                                  | N แถวจากผู้ส่ง M คน               | M+ เทิร์น (หนึ่งเทิร์นต่อบัคเก็ตผู้ส่ง)        | M+ เทิร์น — แชตกลุ่มจะไม่ถูกผสาน                                                            |

## การกู้คืนขาเข้าหลังบริดจ์หรือ Gateway รีสตาร์ต

iMessage กู้คืนข้อความที่พลาดไประหว่างที่ Gateway ล่ม และในขณะเดียวกันก็ระงับ "backlog bomb" เก่าที่ Apple อาจปล่อยออกมาหลังการกู้คืน Push พฤติกรรมเริ่มต้นเปิดใช้อยู่เสมอ โดยสร้างบนการลบรายการซ้ำขาเข้า

- **การลบรายการซ้ำจากการเล่นซ้ำ** ข้อความขาเข้าทุกข้อความที่ถูกส่งต่อจะถูกบันทึกด้วย Apple GUID ในสถานะ Plugin แบบถาวร (`imessage.inbound-dedupe`) โดยถูกอ้างสิทธิ์เมื่อรับเข้าและคอมมิตหลังจัดการเสร็จ (ปล่อยสิทธิ์เมื่อเกิดความล้มเหลวชั่วคราวเพื่อให้ลองใหม่ได้) สิ่งใดที่จัดการไปแล้วจะถูกทิ้งแทนการส่งต่อซ้ำ นี่คือสิ่งที่ทำให้การกู้คืนเล่นซ้ำได้อย่างเข้มข้นโดยไม่ต้องทำบัญชีรายข้อความ
- **การกู้คืนช่วงหยุดทำงาน** เมื่อเริ่มทำงาน มอนิเตอร์จะจำ `chat.db` rowid ล่าสุดที่ส่งต่อแล้ว (เคอร์เซอร์รายบัญชีที่บันทึกถาวร) และส่งไปยัง `imsg watch.subscribe` เป็น `since_rowid` เพื่อให้ imsg เล่นซ้ำแถวที่เข้ามาระหว่างที่ Gateway ล่ม จากนั้นติดตามแบบสด การเล่นซ้ำถูกจำกัดให้อยู่ในแถวล่าสุดและข้อความที่เก่าไม่เกิน ~2 ชั่วโมง และการลบรายการซ้ำจะทิ้งสิ่งที่จัดการไปแล้ว
- **รั้วอายุสำหรับ backlog เก่า** แถวเหนือขอบเขตเริ่มต้นเป็นข้อมูลสดจริง ๆ แถวที่วันที่ส่งเก่ากว่าเวลามาถึงมากกว่า ~15 นาทีคือ backlog จากการ flush ของ Push และจะถูกระงับ แถวที่เล่นซ้ำ (อยู่ที่หรือใต้ขอบเขต) จะใช้หน้าต่างกู้คืนที่กว้างกว่าแทน เพื่อให้ข้อความที่เพิ่งพลาดไปถูกส่งถึง ขณะที่ประวัติเก่าแก่มากจะไม่ถูกส่ง

การกู้คืนทำงานได้ทั้งการตั้งค่า `cliPath` แบบ local และระยะไกล เพราะการเล่นซ้ำ `since_rowid` ทำงานผ่านการเชื่อมต่อ RPC ของ `imsg` เดียวกัน ความแตกต่างคือหน้าต่าง: เมื่อ Gateway อ่าน `chat.db` ได้ (local) จะยึดขอบเขต rowid ตอนเริ่มต้น จำกัดช่วงการเล่นซ้ำ และส่งข้อความที่พลาดไปซึ่งเก่าไม่เกินราวสองชั่วโมงได้ เมื่อใช้ `cliPath` แบบ SSH ระยะไกล จะอ่านฐานข้อมูลไม่ได้ ดังนั้นการเล่นซ้ำจึงไม่ถูกจำกัด และทุกแถวใช้รั้วอายุแบบสด — ยังสามารถกู้คืนข้อความที่เพิ่งพลาดไปและยังระงับ backlog เก่าได้ เพียงแต่ใช้หน้าต่างสดที่แคบกว่า ให้รัน Gateway บน Mac ที่ใช้งาน Messages เพื่อได้หน้าต่างกู้คืนที่กว้างกว่า

### สัญญาณที่โอเปอเรเตอร์มองเห็น

backlog ที่ถูกระงับจะถูกบันทึกที่ระดับเริ่มต้นเสมอ ไม่ถูกทิ้งแบบเงียบ ๆ (แฟล็ก `recovery` แสดงว่าหน้าต่างใดถูกใช้):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### การย้ายระบบ

`channels.imessage.catchup.*` เลิกใช้แล้ว — ตอนนี้การกู้คืนช่วงหยุดทำงานเป็นอัตโนมัติและไม่ต้องใช้คอนฟิกสำหรับการตั้งค่าใหม่ คอนฟิกที่มีอยู่พร้อม `catchup.enabled: true` ยังได้รับการรองรับในฐานะโปรไฟล์ความเข้ากันได้สำหรับหน้าต่างการเล่นซ้ำเพื่อกู้คืน บล็อก catchup ที่ปิดใช้ (`enabled: false` หรือไม่มี `enabled: true`) ถูกปลดระวางแล้ว; `openclaw doctor --fix` จะลบรายการเหล่านั้น

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่พบ imsg หรือไม่รองรับ RPC">
    ตรวจสอบไบนารีและการรองรับ RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    หาก probe รายงานว่าไม่รองรับ RPC ให้อัปเดต `imsg` หากการกระทำผ่าน private API ใช้งานไม่ได้ ให้รัน `imsg launch` ในเซสชันผู้ใช้ macOS ที่ล็อกอินอยู่ แล้ว probe อีกครั้ง หาก Gateway ไม่ได้รันบน macOS ให้ใช้การตั้งค่า Remote Mac ผ่าน SSH ด้านบนแทนพาธ `imsg` แบบ local เริ่มต้น

  </Accordion>

  <Accordion title="ส่ง Messages ได้แต่ iMessages ขาเข้าไม่มาถึง">
    ขั้นแรกพิสูจน์ว่าข้อความมาถึง Mac local หรือไม่ หาก `chat.db` ไม่เปลี่ยน OpenClaw จะรับข้อความไม่ได้ แม้ว่า `imsg status --json` จะรายงานว่าบริดจ์ปกติก็ตาม

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    หากข้อความที่ส่งจากโทรศัพท์ไม่สร้างแถวใหม่ ให้ซ่อมชั้น macOS Messages และ Apple Push ก่อนเปลี่ยนคอนฟิก OpenClaw การรีเฟรชบริการแบบครั้งเดียวมักเพียงพอ:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    ส่ง iMessage ใหม่จากโทรศัพท์และยืนยันว่ามีแถว `chat.db` ใหม่หรือเหตุการณ์ `imsg watch` ก่อนดีบักเซสชัน OpenClaw อย่ารันสิ่งนี้เป็นลูปเปิดบริดจ์ซ้ำเป็นระยะ; การรัน `imsg launch` ซ้ำพร้อมรีสตาร์ต Gateway ระหว่างงานที่กำลังทำอยู่อาจขัดจังหวะการส่งมอบและทำให้การรันช่องทางที่กำลังดำเนินอยู่ค้างได้

  </Accordion>

  <Accordion title="Gateway ไม่ได้รันบน macOS">
    ค่าเริ่มต้น `cliPath: "imsg"` ต้องรันบน Mac ที่ลงชื่อเข้าใช้ Messages บน Linux หรือ Windows ให้ตั้งค่า `channels.imessage.cliPath` เป็นสคริปต์ wrapper ที่ SSH ไปยัง Mac นั้นและรัน `imsg "$@"`

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
    - คอนฟิกรูปแบบการ mention (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="ไฟล์แนบระยะไกลล้มเหลว">
    ตรวจสอบ:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - การยืนยันตัวตนคีย์ SSH/SCP จากโฮสต์ Gateway
    - มี host key อยู่ใน `~/.ssh/known_hosts` บนโฮสต์ Gateway
    - ความสามารถในการอ่านพาธระยะไกลบน Mac ที่รัน Messages

  </Accordion>

  <Accordion title="พลาดพรอมป์สิทธิ์ macOS">
    รันอีกครั้งในเทอร์มินัล GUI แบบโต้ตอบในบริบทผู้ใช้/เซสชันเดียวกัน และอนุมัติพรอมป์:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    ยืนยันว่า Full Disk Access + Automation ได้รับสิทธิ์สำหรับบริบทโปรเซสที่รัน OpenClaw/`imsg`

  </Accordion>
</AccordionGroup>

## ตัวชี้อ้างอิงคอนฟิก

- [เอกสารอ้างอิงคอนฟิก - iMessage](/th/gateway/config-channels#imessage)
- [คอนฟิก Gateway](/th/gateway/configuration)
- [การจับคู่](/th/channels/pairing)

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การนำ BlueBubbles ออกและพาธ iMessage ของ imsg](/th/announcements/bluebubbles-imessage) — ประกาศและสรุปการย้ายระบบ
- [ย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) — ตารางแปลคอนฟิกและการเปลี่ยนผ่านทีละขั้นตอน
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการควบคุมด้วย mention
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
