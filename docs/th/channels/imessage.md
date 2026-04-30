---
read_when:
    - การตั้งค่าการรองรับ iMessage
    - การดีบักการส่ง/รับ iMessage
summary: การรองรับ iMessage แบบเดิมผ่าน imsg (JSON-RPC ผ่าน stdio) การตั้งค่าใหม่ควรใช้ BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-30T09:36:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60eeb3553a6511d56b8177ca4eafbedfed2d0852ac64c230c250911cd18ce17e
    source_path: channels/imessage.md
    workflow: 16
---

<Warning>
สำหรับการติดตั้ง iMessage ใหม่ ให้ใช้ <a href="/th/channels/bluebubbles">BlueBubbles</a>

การผสานรวม `imsg` เป็นแบบเดิมและอาจถูกนำออกในรุ่นอนาคต
</Warning>

สถานะ: การผสานรวม CLI ภายนอกแบบเดิม Gateway จะสร้าง `imsg rpc` และสื่อสารผ่าน JSON-RPC บน stdio (ไม่มีดีมอน/พอร์ตแยกต่างหาก)

<CardGroup cols={3}>
  <Card title="BlueBubbles (แนะนำ)" icon="message-circle" href="/th/channels/bluebubbles">
    เส้นทาง iMessage ที่แนะนำสำหรับการตั้งค่าใหม่
  </Card>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ iMessage ใช้โหมดจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" icon="settings" href="/th/gateway/config-channels#imessage">
    ข้อมูลอ้างอิงฟิลด์ iMessage ทั้งหมด
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="Mac ในเครื่อง (เส้นทางเร็ว)">
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
    OpenClaw ต้องการเพียง `cliPath` ที่เข้ากันได้กับ stdio ดังนั้นคุณจึงชี้ `cliPath` ไปยังสคริปต์ wrapper ที่ SSH ไปยัง Mac ระยะไกลและเรียกใช้ `imsg` ได้

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

    หากไม่ได้ตั้งค่า `remoteHost` OpenClaw จะพยายามตรวจหาอัตโนมัติโดยแยกวิเคราะห์สคริปต์ SSH wrapper
    `remoteHost` ต้องเป็น `host` หรือ `user@host` (ไม่มีช่องว่างหรือตัวเลือก SSH)
    OpenClaw ใช้การตรวจสอบ host-key แบบเข้มงวดสำหรับ SCP ดังนั้นคีย์ของโฮสต์รีเลย์ต้องมีอยู่แล้วใน `~/.ssh/known_hosts`
    เส้นทางไฟล์แนบจะถูกตรวจสอบกับรากที่อนุญาต (`attachmentRoots` / `remoteAttachmentRoots`)

  </Tab>
</Tabs>

## ข้อกำหนดและสิทธิ์ (macOS)

- Messages ต้องลงชื่อเข้าใช้อยู่บน Mac ที่เรียกใช้ `imsg`
- จำเป็นต้องมี Full Disk Access สำหรับบริบทของโปรเซสที่เรียกใช้ OpenClaw/`imsg` (การเข้าถึงฐานข้อมูล Messages)
- จำเป็นต้องมีสิทธิ์ Automation เพื่อส่งข้อความผ่าน Messages.app

<Tip>
สิทธิ์จะถูกให้ตามบริบทของโปรเซส หาก Gateway ทำงานแบบ headless (LaunchAgent/SSH) ให้เรียกใช้คำสั่งแบบโต้ตอบครั้งเดียวในบริบทเดียวกันนั้นเพื่อเรียกพรอมป์:

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

    รายการ allowlist อาจเป็น handle หรือเป้าหมายแชต (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`)

  </Tab>

  <Tab title="นโยบายกลุ่ม + การกล่าวถึง">
    `channels.imessage.groupPolicy` ควบคุมการจัดการกลุ่ม:

    - `allowlist` (ค่าเริ่มต้นเมื่อกำหนดค่าไว้)
    - `open`
    - `disabled`

    allowlist ผู้ส่งกลุ่ม: `channels.imessage.groupAllowFrom`

    ทางเลือกสำรองขณะรันไทม์: หากไม่ได้ตั้งค่า `groupAllowFrom` การตรวจสอบผู้ส่งกลุ่มของ iMessage จะถอยกลับไปใช้ `allowFrom` เมื่อมีอยู่
    หมายเหตุขณะรันไทม์: หาก `channels.imessage` หายไปทั้งหมด รันไทม์จะถอยกลับไปใช้ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` แล้วก็ตาม)

    การกั้นด้วยการกล่าวถึงสำหรับกลุ่ม:

    - iMessage ไม่มีเมทาดาต้าการกล่าวถึงแบบเนทีฟ
    - การตรวจจับการกล่าวถึงใช้แพตเทิร์น regex (`agents.list[].groupChat.mentionPatterns`, สำรองเป็น `messages.groupChat.mentionPatterns`)
    - หากไม่มีแพตเทิร์นที่กำหนดค่าไว้ จะไม่สามารถบังคับใช้การกั้นด้วยการกล่าวถึงได้

    คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตสามารถข้ามการกั้นด้วยการกล่าวถึงในกลุ่มได้

  </Tab>

  <Tab title="เซสชันและการตอบกลับแบบกำหนดได้แน่นอน">
    - DM ใช้การกำหนดเส้นทางโดยตรง กลุ่มใช้การกำหนดเส้นทางกลุ่ม
    - ด้วยค่าเริ่มต้น `session.dmScope=main` DM ของ iMessage จะถูกรวมเข้าในเซสชันหลักของ agent
    - เซสชันกลุ่มถูกแยกออกจากกัน (`agent:<agentId>:imessage:group:<chat_id>`)
    - การตอบกลับจะถูกส่งกลับไปยัง iMessage โดยใช้เมทาดาต้าช่องทาง/เป้าหมายต้นทาง

    พฤติกรรมเธรดที่คล้ายกลุ่ม:

    เธรด iMessage ที่มีผู้เข้าร่วมหลายคนบางรายการอาจเข้ามาพร้อม `is_group=false`
    หาก `chat_id` นั้นถูกกำหนดค่าไว้อย่างชัดเจนใต้ `channels.imessage.groups` OpenClaw จะถือว่าเป็นทราฟฟิกกลุ่ม (การกั้นกลุ่ม + การแยกเซสชันกลุ่ม)

  </Tab>
</Tabs>

## การผูกการสนทนา ACP

แชต iMessage แบบเดิมยังสามารถผูกกับเซสชัน ACP ได้ด้วย

โฟลว์ผู้ปฏิบัติงานแบบเร็ว:

- เรียกใช้ `/acp spawn codex --bind here` ภายใน DM หรือแชตกลุ่มที่อนุญาต
- ข้อความในอนาคตในการสนทนา iMessage เดียวกันนั้นจะถูกส่งไปยังเซสชัน ACP ที่สร้างขึ้น
- `/new` และ `/reset` รีเซ็ตเซสชัน ACP ที่ผูกไว้เดิมในที่เดิม
- `/acp close` ปิดเซสชัน ACP และลบการผูก

รองรับการผูกถาวรที่กำหนดค่าไว้ผ่านรายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` และ `match.channel: "imessage"`

`match.peer.id` สามารถใช้:

- handle DM ที่ปรับให้อยู่ในรูปแบบมาตรฐาน เช่น `+15555550123` หรือ `user@example.com`
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

ดู [ACP Agents](/th/tools/acp-agents) สำหรับพฤติกรรมการผูก ACP ที่ใช้ร่วมกัน

## รูปแบบการติดตั้ง

<AccordionGroup>
  <Accordion title="ผู้ใช้ macOS สำหรับบอทโดยเฉพาะ (ตัวตน iMessage แยกต่างหาก)">
    ใช้ Apple ID และผู้ใช้ macOS เฉพาะเพื่อแยกทราฟฟิกบอทออกจากโปรไฟล์ Messages ส่วนตัวของคุณ

    โฟลว์ทั่วไป:

    1. สร้าง/ลงชื่อเข้าใช้ผู้ใช้ macOS เฉพาะ
    2. ลงชื่อเข้าใช้ Messages ด้วย Apple ID ของบอทในผู้ใช้นั้น
    3. ติดตั้ง `imsg` ในผู้ใช้นั้น
    4. สร้าง SSH wrapper เพื่อให้ OpenClaw เรียกใช้ `imsg` ในบริบทของผู้ใช้นั้นได้
    5. ชี้ `channels.imessage.accounts.<id>.cliPath` และ `.dbPath` ไปยังโปรไฟล์ผู้ใช้นั้น

    การรันครั้งแรกอาจต้องมีการอนุมัติผ่าน GUI (Automation + Full Disk Access) ในเซสชันผู้ใช้บอทนั้น

  </Accordion>

  <Accordion title="Mac ระยะไกลผ่าน Tailscale (ตัวอย่าง)">
    โทโพโลยีทั่วไป:

    - Gateway ทำงานบน Linux/VM
    - iMessage + `imsg` ทำงานบน Mac ใน tailnet ของคุณ
    - wrapper `cliPath` ใช้ SSH เพื่อเรียกใช้ `imsg`
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

    ใช้คีย์ SSH เพื่อให้ทั้ง SSH และ SCP ไม่ต้องโต้ตอบ
    ตรวจให้แน่ใจว่าคีย์ของโฮสต์ได้รับความเชื่อถือก่อน (เช่น `ssh bot@mac-mini.tailnet-1234.ts.net`) เพื่อให้ `known_hosts` ถูกเติมข้อมูล

  </Accordion>

  <Accordion title="รูปแบบหลายบัญชี">
    iMessage รองรับการกำหนดค่าต่อบัญชีใต้ `channels.imessage.accounts`

    แต่ละบัญชีสามารถ override ฟิลด์ต่างๆ เช่น `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, การตั้งค่าประวัติ และ allowlist รากของไฟล์แนบ

  </Accordion>
</AccordionGroup>

## สื่อ การแบ่งส่วน และเป้าหมายการส่งมอบ

<AccordionGroup>
  <Accordion title="ไฟล์แนบและสื่อ">
    - การนำเข้าไฟล์แนบขาเข้าเป็นตัวเลือก: `channels.imessage.includeAttachments`
    - เส้นทางไฟล์แนบระยะไกลสามารถดึงผ่าน SCP ได้เมื่อตั้งค่า `remoteHost`
    - เส้นทางไฟล์แนบต้องตรงกับรากที่อนุญาต:
      - `channels.imessage.attachmentRoots` (ในเครื่อง)
      - `channels.imessage.remoteAttachmentRoots` (โหมด SCP ระยะไกล)
      - แพตเทิร์นรากเริ่มต้น: `/Users/*/Library/Messages/Attachments`
    - SCP ใช้การตรวจสอบ host-key แบบเข้มงวด (`StrictHostKeyChecking=yes`)
    - ขนาดสื่อขาออกใช้ `channels.imessage.mediaMaxMb` (ค่าเริ่มต้น 16 MB)

  </Accordion>

  <Accordion title="การแบ่งส่วนขาออก">
    - ขีดจำกัดส่วนข้อความ: `channels.imessage.textChunkLimit` (ค่าเริ่มต้น 4000)
    - โหมดแบ่งส่วน: `channels.imessage.chunkMode`
      - `length` (ค่าเริ่มต้น)
      - `newline` (การแบ่งโดยให้ย่อหน้ามาก่อน)

  </Accordion>

  <Accordion title="รูปแบบการระบุที่อยู่">
    เป้าหมายแบบชัดเจนที่แนะนำ:

    - `chat_id:123` (แนะนำสำหรับการกำหนดเส้นทางที่เสถียร)
    - `chat_guid:...`
    - `chat_identifier:...`

    รองรับเป้าหมาย handle ด้วย:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## การเขียนการกำหนดค่า

iMessage อนุญาตการเขียนการกำหนดค่าที่เริ่มจากช่องทางโดยค่าเริ่มต้น (สำหรับ `/config set|unset` เมื่อ `commands.config: true`)

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
    - การยืนยันตัวตนด้วยคีย์ SSH/SCP จากโฮสต์ Gateway
    - คีย์ของโฮสต์มีอยู่ใน `~/.ssh/known_hosts` บนโฮสต์ Gateway
    - การอ่านเส้นทางระยะไกลได้บน Mac ที่เรียกใช้ Messages

  </Accordion>

  <Accordion title="พลาดพรอมป์สิทธิ์ของ macOS">
    รันอีกครั้งในเทอร์มินัล GUI แบบโต้ตอบในบริบทผู้ใช้/เซสชันเดียวกันและอนุมัติพรอมป์:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    ยืนยันว่าให้ Full Disk Access + Automation สำหรับบริบทของโปรเซสที่เรียกใช้ OpenClaw/`imsg` แล้ว

  </Accordion>
</AccordionGroup>

## ตัวชี้ไปยังข้อมูลอ้างอิงการกำหนดค่า

- [ข้อมูลอ้างอิงการกำหนดค่า - iMessage](/th/gateway/config-channels#imessage)
- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [การจับคู่](/th/channels/pairing)
- [BlueBubbles](/th/channels/bluebubbles)

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการกั้นด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
