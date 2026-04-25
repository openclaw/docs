---
read_when:
    - การตั้งค่าการรองรับ iMessage
    - การดีบักการส่ง/รับ iMessage
summary: รองรับ iMessage แบบ legacy ผ่าน imsg (JSON-RPC ผ่าน stdio) การติดตั้งใหม่ควรใช้ BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-25T13:41:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b693b222ab60fe9fee8be47ec4b347ba126f11558888d336220e39425023dcd
    source_path: channels/imessage.md
    workflow: 15
---

<Warning>
สำหรับการติดตั้ง iMessage ใหม่ ให้ใช้ <a href="/th/channels/bluebubbles">BlueBubbles</a>

การผสานรวม `imsg` เป็นแบบ legacy และอาจถูกนำออกในรุ่นอนาคต
</Warning>

สถานะ: การผสานรวม CLI ภายนอกแบบ legacy Gateway จะ spawn `imsg rpc` และสื่อสารผ่าน JSON-RPC บน stdio (ไม่มี daemon/พอร์ตแยกต่างหาก)

<CardGroup cols={3}>
  <Card title="BlueBubbles (recommended)" icon="message-circle" href="/th/channels/bluebubbles">
    เส้นทาง iMessage ที่แนะนำสำหรับการติดตั้งใหม่
  </Card>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    DM ของ iMessage ใช้โหมด pairing เป็นค่าเริ่มต้น
  </Card>
  <Card title="Configuration reference" icon="settings" href="/th/gateway/config-channels#imessage">
    ข้อมูลอ้างอิงฟิลด์ iMessage แบบครบถ้วน
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Tabs>
  <Tab title="Mac ภายในเครื่อง (เส้นทางแบบรวดเร็ว)">
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

      <Step title="เริ่มต้น gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="อนุมัติ pairing สำหรับ DM แรก (dmPolicy เริ่มต้น)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        คำขอ pairing จะหมดอายุภายใน 1 ชั่วโมง
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac ระยะไกลผ่าน SSH">
    OpenClaw ต้องการเพียง `cliPath` ที่เข้ากันได้กับ stdio เท่านั้น ดังนั้นคุณจึงสามารถชี้ `cliPath` ไปยังสคริปต์ wrapper ที่ SSH ไปยัง Mac ระยะไกลและรัน `imsg` ได้

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    ค่าคอนฟิกที่แนะนำเมื่อเปิดใช้งานไฟล์แนบ:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // ใช้สำหรับการดึงไฟล์แนบผ่าน SCP
      includeAttachments: true,
      // ทางเลือก: override allowed attachment roots
      // ค่าเริ่มต้นรวม /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    หากไม่ได้ตั้งค่า `remoteHost` ไว้ OpenClaw จะพยายามตรวจจับอัตโนมัติโดยการแยกวิเคราะห์สคริปต์ SSH wrapper
    `remoteHost` ต้องเป็น `host` หรือ `user@host` (ไม่มีช่องว่างหรือ SSH options)
    OpenClaw ใช้การตรวจสอบ host key แบบเข้มงวดสำหรับ SCP ดังนั้น relay host key ต้องมีอยู่แล้วใน `~/.ssh/known_hosts`
    พาธไฟล์แนบจะถูกตรวจสอบกับ allowed roots (`attachmentRoots` / `remoteAttachmentRoots`)

  </Tab>
</Tabs>

## ข้อกำหนดและสิทธิ์อนุญาต (macOS)

- ต้องลงชื่อเข้าใช้ Messages บน Mac ที่รัน `imsg`
- ต้องให้สิทธิ์ Full Disk Access กับบริบท process ที่รัน OpenClaw/`imsg` (เพื่อเข้าถึงฐานข้อมูล Messages)
- ต้องให้สิทธิ์ Automation เพื่อส่งข้อความผ่าน Messages.app

<Tip>
สิทธิ์อนุญาตจะถูกมอบให้ตามบริบทของ process หาก gateway ทำงานแบบ headless (LaunchAgent/SSH) ให้รันคำสั่งแบบโต้ตอบหนึ่งครั้งในบริบทเดียวกันนั้นเพื่อให้มีการแสดง prompt:

```bash
imsg chats --limit 1
# หรือ
imsg send <handle> "test"
```

</Tip>

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.imessage.dmPolicy` ใช้ควบคุมข้อความส่วนตัว:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    ฟิลด์ allowlist: `channels.imessage.allowFrom`

    รายการใน allowlist สามารถเป็น handle หรือ chat target (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ก็ได้

  </Tab>

  <Tab title="นโยบายกลุ่ม + mentions">
    `channels.imessage.groupPolicy` ใช้ควบคุมการจัดการกลุ่ม:

    - `allowlist` (ค่าเริ่มต้นเมื่อมีการกำหนดค่า)
    - `open`
    - `disabled`

    allowlist ผู้ส่งของกลุ่ม: `channels.imessage.groupAllowFrom`

    การ fallback ระหว่างรันไทม์: หากไม่ได้ตั้งค่า `groupAllowFrom` ไว้ การตรวจสอบผู้ส่งของกลุ่ม iMessage จะ fallback ไปใช้ `allowFrom` เมื่อมีให้ใช้
    หมายเหตุระหว่างรันไทม์: หาก `channels.imessage` ไม่มีอยู่เลย ระหว่างรันไทม์จะ fallback ไปใช้ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้ว่าจะตั้ง `channels.defaults.groupPolicy` ไว้ก็ตาม)

    การควบคุม mentions สำหรับกลุ่ม:

    - iMessage ไม่มีข้อมูลเมตา mention แบบเนทีฟ
    - การตรวจจับ mention ใช้รูปแบบ regex (`agents.list[].groupChat.mentionPatterns`, fallback คือ `messages.groupChat.mentionPatterns`)
    - หากไม่ได้กำหนดรูปแบบไว้ จะไม่สามารถบังคับใช้การควบคุม mentions ได้

    คำสั่งควบคุมจากผู้ส่งที่ได้รับอนุญาตสามารถข้ามการควบคุม mentions ในกลุ่มได้

  </Tab>

  <Tab title="Sessions และการตอบกลับแบบกำหนดแน่นอน">
    - DM ใช้ direct routing; กลุ่มใช้ group routing
    - ด้วยค่าเริ่มต้น `session.dmScope=main` DM ของ iMessage จะถูกรวมเข้าเป็น main session ของเอเจนต์
    - Sessions ของกลุ่มจะแยกออกจากกัน (`agent:<agentId>:imessage:group:<chat_id>`)
    - การตอบกลับจะถูกส่งกลับไปยัง iMessage โดยใช้ข้อมูลเมตาของช่องทาง/เป้าหมายต้นทาง

    พฤติกรรมของเธรดที่มีลักษณะคล้ายกลุ่ม:

    เธรด iMessage แบบหลายผู้เข้าร่วมบางรายการอาจเข้ามาพร้อม `is_group=false`
    หาก `chat_id` นั้นถูกกำหนดไว้อย่างชัดเจนภายใต้ `channels.imessage.groups` OpenClaw จะถือว่าเป็นทราฟฟิกแบบกลุ่ม (การควบคุมแบบกลุ่ม + การแยก session ของกลุ่ม)

  </Tab>
</Tabs>

## ACP conversation bindings

แชต iMessage แบบ legacy ยังสามารถผูกกับ sessions ของ ACP ได้ด้วย

โฟลว์สำหรับผู้ปฏิบัติงานแบบรวดเร็ว:

- รัน `/acp spawn codex --bind here` ภายใน DM หรือแชตกลุ่มที่ได้รับอนุญาต
- ข้อความในอนาคตภายในบทสนทนา iMessage เดียวกันนั้นจะถูกกำหนดเส้นทางไปยัง session ACP ที่ถูก spawn
- `/new` และ `/reset` จะรีเซ็ต session ACP ที่ผูกไว้เดิมแบบคงอยู่ในที่เดิม
- `/acp close` จะปิด session ACP และลบ binding

รองรับ persistent bindings ที่กำหนดค่าไว้ผ่านรายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` และ `match.channel: "imessage"`

`match.peer.id` สามารถใช้ได้ดังนี้:

- handle ของ DM ที่ผ่านการ normalize แล้ว เช่น `+15555550123` หรือ `user@example.com`
- `chat_id:<id>` (แนะนำสำหรับ group bindings ที่เสถียร)
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

ดู [ACP Agents](/th/tools/acp-agents) สำหรับพฤติกรรม ACP binding ที่ใช้ร่วมกัน

## รูปแบบการปรับใช้

<AccordionGroup>
  <Accordion title="ผู้ใช้ macOS สำหรับบอตโดยเฉพาะ (แยกตัวตน iMessage)">
    ใช้ Apple ID และผู้ใช้ macOS สำหรับบอตโดยเฉพาะ เพื่อแยกทราฟฟิกของบอตออกจากโปรไฟล์ Messages ส่วนตัวของคุณ

    โฟลว์โดยทั่วไป:

    1. สร้าง/ลงชื่อเข้าใช้ผู้ใช้ macOS สำหรับบอตโดยเฉพาะ
    2. ลงชื่อเข้าใช้ Messages ด้วย Apple ID ของบอตภายใต้ผู้ใช้นั้น
    3. ติดตั้ง `imsg` ภายใต้ผู้ใช้นั้น
    4. สร้าง SSH wrapper เพื่อให้ OpenClaw สามารถรัน `imsg` ภายใต้บริบทผู้ใช้นั้นได้
    5. ชี้ `channels.imessage.accounts.<id>.cliPath` และ `.dbPath` ไปยังโปรไฟล์ผู้ใช้นั้น

    การรันครั้งแรกอาจต้องมีการอนุมัติผ่าน GUI (Automation + Full Disk Access) ในเซสชันของผู้ใช้บอตนั้น

  </Accordion>

  <Accordion title="Mac ระยะไกลผ่าน Tailscale (ตัวอย่าง)">
    โทโพโลยีที่พบบ่อย:

    - gateway รันอยู่บน Linux/VM
    - iMessage + `imsg` รันอยู่บน Mac ใน tailnet ของคุณ
    - wrapper ของ `cliPath` ใช้ SSH เพื่อรัน `imsg`
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

    ใช้ SSH keys เพื่อให้ทั้ง SSH และ SCP ทำงานได้โดยไม่ต้องโต้ตอบ
    ตรวจสอบให้แน่ใจก่อนว่า host key ได้รับความเชื่อถือแล้ว (เช่น `ssh bot@mac-mini.tailnet-1234.ts.net`) เพื่อให้ `known_hosts` ถูกเติมข้อมูล

  </Accordion>

  <Accordion title="รูปแบบหลายบัญชี">
    iMessage รองรับค่าคอนฟิกต่อบัญชีภายใต้ `channels.imessage.accounts`

    แต่ละบัญชีสามารถ override ฟิลด์ต่างๆ เช่น `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, การตั้งค่าประวัติ และ allowlists ของ attachment root

  </Accordion>
</AccordionGroup>

## สื่อ การแบ่งข้อความ และเป้าหมายการส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบและสื่อ">
    - การรับไฟล์แนบขาเข้าเป็นทางเลือก: `channels.imessage.includeAttachments`
    - สามารถดึงพาธไฟล์แนบระยะไกลผ่าน SCP ได้เมื่อกำหนด `remoteHost`
    - พาธไฟล์แนบต้องตรงกับ allowed roots:
      - `channels.imessage.attachmentRoots` (ภายในเครื่อง)
      - `channels.imessage.remoteAttachmentRoots` (โหมด SCP ระยะไกล)
      - รูปแบบ root เริ่มต้น: `/Users/*/Library/Messages/Attachments`
    - SCP ใช้การตรวจสอบ host key แบบเข้มงวด (`StrictHostKeyChecking=yes`)
    - ขนาดสื่อขาออกใช้ `channels.imessage.mediaMaxMb` (ค่าเริ่มต้น 16 MB)
  </Accordion>

  <Accordion title="การแบ่งข้อความขาออก">
    - ขีดจำกัดการแบ่งข้อความ: `channels.imessage.textChunkLimit` (ค่าเริ่มต้น 4000)
    - โหมดการแบ่งข้อความ: `channels.imessage.chunkMode`
      - `length` (ค่าเริ่มต้น)
      - `newline` (แบ่งโดยย่อหน้าก่อน)
  </Accordion>

  <Accordion title="รูปแบบการระบุปลายทาง">
    เป้าหมายแบบ explicit ที่แนะนำ:

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

## การเขียนค่าคอนฟิก

iMessage อนุญาตให้มีการเขียนค่าคอนฟิกที่เริ่มต้นจาก channel ได้โดยค่าเริ่มต้น (สำหรับ `/config set|unset` เมื่อ `commands.config: true`)

ปิดใช้งานได้ดังนี้:

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
    ตรวจสอบ binary และการรองรับ RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    หาก probe รายงานว่าไม่รองรับ RPC ให้อัปเดต `imsg`

  </Accordion>

  <Accordion title="DM ถูกละเลย">
    ตรวจสอบ:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - การอนุมัติ pairing (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกละเลย">
    ตรวจสอบ:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - พฤติกรรม allowlist ของ `channels.imessage.groups`
    - การกำหนดค่ารูปแบบ mention (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="ไฟล์แนบระยะไกลล้มเหลว">
    ตรวจสอบ:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - การยืนยันตัวตนด้วยคีย์ SSH/SCP จากโฮสต์ gateway
    - host key มีอยู่ใน `~/.ssh/known_hosts` บนโฮสต์ gateway
    - พาธระยะไกลสามารถอ่านได้บน Mac ที่รัน Messages

  </Accordion>

  <Accordion title="พลาด prompt สิทธิ์อนุญาตของ macOS">
    รันใหม่ในเทอร์มินัล GUI แบบโต้ตอบในบริบทผู้ใช้/เซสชันเดียวกัน และอนุมัติ prompt:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    ยืนยันว่าได้ให้ Full Disk Access + Automation แก่บริบท process ที่รัน OpenClaw/`imsg` แล้ว

  </Accordion>
</AccordionGroup>

## ตัวชี้ไปยังข้อมูลอ้างอิงการกำหนดค่า

- [ข้อมูลอ้างอิงการกำหนดค่า - iMessage](/th/gateway/config-channels#imessage)
- [การกำหนดค่า Gateway](/th/gateway/configuration)
- [Pairing](/th/channels/pairing)
- [BlueBubbles](/th/channels/bluebubbles)

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — channels ที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์ pairing
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการควบคุม mentions
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทาง session สำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการทำ hardening
