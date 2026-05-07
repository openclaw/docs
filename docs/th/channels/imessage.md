---
read_when:
    - การตั้งค่าการรองรับ iMessage
    - การดีบักการส่ง/รับ iMessage
summary: รองรับ iMessage แบบเนทีฟผ่าน imsg (JSON-RPC ผ่าน stdio). แนะนำสำหรับการตั้งค่า OpenClaw iMessage ใหม่เมื่อข้อกำหนดของโฮสต์เหมาะสม.
title: iMessage
x-i18n:
    generated_at: "2026-05-07T01:50:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39a3d6350333292c147d7986568eb539aa8ce562405092b71b8cecbbf7584450
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
สำหรับการปรับใช้ OpenClaw iMessage ใหม่ ให้เริ่มที่นี่เมื่อคุณสามารถเรียกใช้ `imsg` บนโฮสต์ macOS Messages ที่ลงชื่อเข้าใช้แล้วได้ BlueBubbles ยังพร้อมใช้งานเป็นทางเลือกสำรองแบบเดิมสำหรับการตั้งค่าที่มีอยู่ซึ่งพึ่งพาเซิร์ฟเวอร์ HTTP, Webhook หรือการกระทำ private-API ที่สมบูรณ์กว่าของ BlueBubbles
</Note>

สถานะ: การผสานรวม CLI ภายนอกแบบเนทีฟ Gateway สร้าง `imsg rpc` และสื่อสารผ่าน JSON-RPC บน stdio (ไม่มี daemon/พอร์ตแยกต่างหาก)

<CardGroup cols={3}>
  <Card title="BlueBubbles (ทางเลือกสำรองแบบเดิม)" icon="message-circle" href="/th/channels/bluebubbles">
    ใช้ต่อไปสำหรับการกำหนดเส้นทางที่มีอยู่ซึ่งรองรับด้วย BlueBubbles; หลีกเลี่ยงสำหรับการตั้งค่าใหม่เมื่อ imsg เหมาะสม
  </Card>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ iMessage ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" icon="settings" href="/th/gateway/config-channels#imessage">
    เอกสารอ้างอิงฟิลด์ iMessage แบบเต็ม
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

      <Step title="อนุมัติการจับคู่ DM ครั้งแรก (dmPolicy ค่าเริ่มต้น)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        คำขอจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac ระยะไกลผ่าน SSH">
    OpenClaw ต้องการเพียง `cliPath` ที่เข้ากันได้กับ stdio ดังนั้นคุณจึงสามารถชี้ `cliPath` ไปยังสคริปต์ wrapper ที่ SSH ไปยัง Mac ระยะไกลและเรียกใช้ `imsg`

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    การกำหนดค่าที่แนะนำเมื่อเปิดใช้งานไฟล์แนบ:

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

    หากไม่ได้ตั้งค่า `remoteHost` OpenClaw จะพยายามตรวจจับโดยอัตโนมัติด้วยการแยกวิเคราะห์สคริปต์ SSH wrapper
    `remoteHost` ต้องเป็น `host` หรือ `user@host` (ไม่มีช่องว่างหรือตัวเลือก SSH)
    OpenClaw ใช้การตรวจสอบ host-key อย่างเข้มงวดสำหรับ SCP ดังนั้นคีย์ของโฮสต์ relay ต้องมีอยู่แล้วใน `~/.ssh/known_hosts`
    เส้นทางไฟล์แนบจะถูกตรวจสอบกับรากที่อนุญาต (`attachmentRoots` / `remoteAttachmentRoots`)

  </Tab>
</Tabs>

## ข้อกำหนดและสิทธิ์ (macOS)

- ต้องลงชื่อเข้าใช้ Messages บน Mac ที่เรียกใช้ `imsg`
- ต้องมี Full Disk Access สำหรับบริบทกระบวนการที่เรียกใช้ OpenClaw/`imsg` (การเข้าถึง DB ของ Messages)
- ต้องมีสิทธิ์ Automation เพื่อส่งข้อความผ่าน Messages.app

<Tip>
สิทธิ์จะมอบให้ตามบริบทกระบวนการ หาก Gateway ทำงานแบบไม่มีหน้าจอ (LaunchAgent/SSH) ให้เรียกใช้คำสั่งแบบโต้ตอบหนึ่งครั้งในบริบทเดียวกันนั้นเพื่อทริกเกอร์พรอมป์:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.imessage.dmPolicy` ควบคุมข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` รวม `"*"`)
    - `disabled`

    ฟิลด์ allowlist: `channels.imessage.allowFrom`

    รายการ allowlist อาจเป็น handle หรือเป้าหมายแชท (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`)

  </Tab>

  <Tab title="นโยบายกลุ่ม + การกล่าวถึง">
    `channels.imessage.groupPolicy` ควบคุมการจัดการกลุ่ม:

    - `allowlist` (ค่าเริ่มต้นเมื่อกำหนดค่าแล้ว)
    - `open`
    - `disabled`

    allowlist ผู้ส่งกลุ่ม: `channels.imessage.groupAllowFrom`

    การสำรองขณะรันไทม์: หากไม่ได้ตั้งค่า `groupAllowFrom` การตรวจสอบผู้ส่งกลุ่ม iMessage จะถอยกลับไปใช้ `allowFrom` เมื่อพร้อมใช้งาน
    หมายเหตุขณะรันไทม์: หาก `channels.imessage` หายไปทั้งหมด รันไทม์จะถอยกลับไปใช้ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

    การควบคุมการกล่าวถึงสำหรับกลุ่ม:

    - iMessage ไม่มีเมตาดาต้าการกล่าวถึงแบบเนทีฟ
    - การตรวจจับการกล่าวถึงใช้แพตเทิร์น regex (`agents.list[].groupChat.mentionPatterns`, สำรองเป็น `messages.groupChat.mentionPatterns`)
    - หากไม่มีแพตเทิร์นที่กำหนดค่าไว้ จะไม่สามารถบังคับใช้การควบคุมการกล่าวถึงได้

    คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตสามารถข้ามการควบคุมการกล่าวถึงในกลุ่มได้

  </Tab>

  <Tab title="เซสชันและการตอบกลับแบบกำหนดแน่นอน">
    - DM ใช้การกำหนดเส้นทางโดยตรง; กลุ่มใช้การกำหนดเส้นทางกลุ่ม
    - ด้วยค่าเริ่มต้น `session.dmScope=main` DM ของ iMessage จะถูกรวมเข้าในเซสชันหลักของเอเจนต์
    - เซสชันกลุ่มถูกแยกออกจากกัน (`agent:<agentId>:imessage:group:<chat_id>`)
    - การตอบกลับจะส่งกลับไปยัง iMessage โดยใช้เมตาดาต้าช่องทาง/เป้าหมายต้นทาง

    พฤติกรรมเธรดที่คล้ายกลุ่ม:

    เธรด iMessage ที่มีผู้เข้าร่วมหลายคนบางรายการอาจมาถึงพร้อม `is_group=false`
    หาก `chat_id` นั้นถูกกำหนดค่าไว้อย่างชัดเจนภายใต้ `channels.imessage.groups` OpenClaw จะถือว่าเป็นทราฟฟิกกลุ่ม (การควบคุมกลุ่ม + การแยกเซสชันกลุ่ม)

  </Tab>
</Tabs>

## การผูกการสนทนา ACP

แชท iMessage แบบเดิมยังสามารถผูกกับเซสชัน ACP ได้ด้วย

โฟลว์ผู้ปฏิบัติงานแบบเร็ว:

- เรียกใช้ `/acp spawn codex --bind here` ภายใน DM หรือแชทกลุ่มที่อนุญาต
- ข้อความในอนาคตในบทสนทนา iMessage เดียวกันนั้นจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่สร้างขึ้น
- `/new` และ `/reset` รีเซ็ตเซสชัน ACP ที่ผูกไว้เดิมในตำแหน่งเดิม
- `/acp close` ปิดเซสชัน ACP และลบการผูก

รองรับการผูกถาวรที่กำหนดค่าไว้ผ่านรายการระดับบนสุด `bindings[]` ที่มี `type: "acp"` และ `match.channel: "imessage"`

`match.peer.id` สามารถใช้:

- handle DM ที่ปรับให้เป็นรูปแบบมาตรฐาน เช่น `+15555550123` หรือ `user@example.com`
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

ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับพฤติกรรมการผูก ACP ที่ใช้ร่วมกัน

## รูปแบบการปรับใช้

<AccordionGroup>
  <Accordion title="ผู้ใช้ macOS สำหรับบอทโดยเฉพาะ (ข้อมูลประจำตัว iMessage แยกต่างหาก)">
    ใช้ Apple ID และผู้ใช้ macOS โดยเฉพาะเพื่อให้ทราฟฟิกของบอทแยกออกจากโปรไฟล์ Messages ส่วนตัวของคุณ

    โฟลว์ทั่วไป:

    1. สร้าง/ลงชื่อเข้าใช้ผู้ใช้ macOS โดยเฉพาะ
    2. ลงชื่อเข้าใช้ Messages ด้วย Apple ID ของบอทในผู้ใช้นั้น
    3. ติดตั้ง `imsg` ในผู้ใช้นั้น
    4. สร้าง SSH wrapper เพื่อให้ OpenClaw เรียกใช้ `imsg` ในบริบทผู้ใช้นั้นได้
    5. ชี้ `channels.imessage.accounts.<id>.cliPath` และ `.dbPath` ไปยังโปรไฟล์ผู้ใช้นั้น

    การเรียกใช้ครั้งแรกอาจต้องมีการอนุมัติ GUI (Automation + Full Disk Access) ในเซสชันผู้ใช้บอทนั้น

  </Accordion>

  <Accordion title="Mac ระยะไกลผ่าน Tailscale (ตัวอย่าง)">
    โทโพโลยีทั่วไป:

    - Gateway ทำงานบน Linux/VM
    - iMessage + `imsg` ทำงานบน Mac ใน tailnet ของคุณ
    - wrapper ของ `cliPath` ใช้ SSH เพื่อเรียกใช้ `imsg`
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
    ตรวจสอบให้แน่ใจก่อนว่าคีย์โฮสต์เชื่อถือได้แล้ว (เช่น `ssh bot@mac-mini.tailnet-1234.ts.net`) เพื่อให้ `known_hosts` ถูกเติมข้อมูล

  </Accordion>

  <Accordion title="รูปแบบหลายบัญชี">
    iMessage รองรับการกำหนดค่ารายบัญชีภายใต้ `channels.imessage.accounts`

    แต่ละบัญชีสามารถ override ฟิลด์ เช่น `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, การตั้งค่าประวัติ และ allowlist รากไฟล์แนบได้

  </Accordion>
</AccordionGroup>

## สื่อ การแบ่งชิ้น และเป้าหมายการส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบและสื่อ">
    - การรับไฟล์แนบขาเข้าเป็นตัวเลือก: `channels.imessage.includeAttachments`
    - สามารถดึงเส้นทางไฟล์แนบระยะไกลผ่าน SCP เมื่อมีการตั้งค่า `remoteHost`
    - เส้นทางไฟล์แนบต้องตรงกับรากที่อนุญาต:
      - `channels.imessage.attachmentRoots` (ภายในเครื่อง)
      - `channels.imessage.remoteAttachmentRoots` (โหมด SCP ระยะไกล)
      - แพตเทิร์นรากค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`
    - SCP ใช้การตรวจสอบ host-key อย่างเข้มงวด (`StrictHostKeyChecking=yes`)
    - ขนาดสื่อขาออกใช้ `channels.imessage.mediaMaxMb` (ค่าเริ่มต้น 16 MB)

  </Accordion>

  <Accordion title="การแบ่งขาออกเป็นชิ้น">
    - ขีดจำกัดชิ้นข้อความ: `channels.imessage.textChunkLimit` (ค่าเริ่มต้น 4000)
    - โหมดการแบ่งชิ้น: `channels.imessage.chunkMode`
      - `length` (ค่าเริ่มต้น)
      - `newline` (การแบ่งโดยให้ย่อหน้ามาก่อน)

  </Accordion>

  <Accordion title="รูปแบบการระบุที่อยู่">
    เป้าหมายแบบชัดเจนที่แนะนำ:

    - `chat_id:123` (แนะนำสำหรับการกำหนดเส้นทางที่เสถียร)
    - `chat_guid:...`
    - `chat_identifier:...`

    รองรับเป้าหมายแบบ handle ด้วย:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## การเขียนการกำหนดค่า

iMessage อนุญาตให้ช่องทางเริ่มเขียนการกำหนดค่าได้ตามค่าเริ่มต้น (สำหรับ `/config set|unset` เมื่อ `commands.config: true`)

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

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่พบ imsg หรือไม่รองรับ RPC">
    ตรวจสอบไบนารีและการรองรับ RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    หาก probe รายงานว่าไม่รองรับ RPC ให้อัปเดต `imsg`

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
    - การกำหนดค่าแพตเทิร์นการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="ไฟล์แนบระยะไกลล้มเหลว">
    ตรวจสอบ:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - การรับรองความถูกต้องด้วยคีย์ SSH/SCP จากโฮสต์ Gateway
    - คีย์โฮสต์มีอยู่ใน `~/.ssh/known_hosts` บนโฮสต์ Gateway
    - ความสามารถในการอ่านเส้นทางระยะไกลบน Mac ที่เรียกใช้ Messages

  </Accordion>

  <Accordion title="พลาดพรอมป์สิทธิ์ macOS">
    เรียกใช้อีกครั้งในเทอร์มินัล GUI แบบโต้ตอบในบริบทผู้ใช้/เซสชันเดียวกัน และอนุมัติพรอมป์:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    ยืนยันว่า Full Disk Access + Automation ได้รับการอนุญาตสำหรับบริบทกระบวนการที่เรียกใช้ OpenClaw/`imsg`

  </Accordion>
</AccordionGroup>

## ตัวชี้ไปยังเอกสารอ้างอิงการกำหนดค่า

- [เอกสารอ้างอิงการกำหนดค่า - iMessage](/th/gateway/config-channels#imessage)
- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [การจับคู่](/th/channels/pairing)
- [BlueBubbles](/th/channels/bluebubbles)

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนผ่าน DM และขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
