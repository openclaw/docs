---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับช่อง IRC หรือ DM
    - คุณกำลังกำหนดค่า allowlist ของ IRC นโยบายกลุ่ม หรือการจำกัดการกล่าวถึง
summary: การตั้งค่า Plugin IRC การควบคุมการเข้าถึง และการแก้ไขปัญหา
title: IRC
x-i18n:
    generated_at: "2026-04-23T10:13:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: e198c03db9aaf4ec64db462d44d42aa352a2ddba808bcd29e21eb2791d9755ad
    source_path: channels/irc.md
    workflow: 15
---

# IRC

ใช้ IRC เมื่อต้องการให้ OpenClaw อยู่ในช่องแบบดั้งเดิม (`#room`) และข้อความส่วนตัว
IRC มาพร้อมเป็น Plugin ที่รวมมาให้ แต่กำหนดค่าในคอนฟิกหลักภายใต้ `channels.irc`

## เริ่มต้นอย่างรวดเร็ว

1. เปิดใช้งานคอนฟิก IRC ใน `~/.openclaw/openclaw.json`
2. ตั้งค่าอย่างน้อย:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

ควรใช้เซิร์ฟเวอร์ IRC แบบส่วนตัวสำหรับการประสานงานของบอต หากตั้งใจใช้เครือข่าย IRC สาธารณะ ตัวเลือกที่พบบ่อยได้แก่ Libera.Chat, OFTC และ Snoonet หลีกเลี่ยงช่องสาธารณะที่คาดเดาได้ง่ายสำหรับทราฟฟิก backchannel ของบอตหรือ swarm

3. เริ่มต้น/รีสตาร์ต Gateway:

```bash
openclaw gateway run
```

## ค่าเริ่มต้นด้านความปลอดภัย

- `channels.irc.dmPolicy` มีค่าเริ่มต้นเป็น `"pairing"`
- `channels.irc.groupPolicy` มีค่าเริ่มต้นเป็น `"allowlist"`
- เมื่อ `groupPolicy="allowlist"` ให้ตั้งค่า `channels.irc.groups` เพื่อกำหนดช่องที่อนุญาต
- ใช้ TLS (`channels.irc.tls=true`) เว้นแต่คุณตั้งใจยอมรับการส่งข้อมูลแบบ plaintext

## การควบคุมการเข้าถึง

มี “ด่าน” แยกกันสองส่วนสำหรับช่อง IRC:

1. **การเข้าถึงช่อง** (`groupPolicy` + `groups`): บอตยอมรับข้อความจากช่องนั้นเลยหรือไม่
2. **การเข้าถึงผู้ส่ง** (`groupAllowFrom` / `groups["#channel"].allowFrom` รายช่อง): ใครบ้างที่ได้รับอนุญาตให้เรียกใช้บอตภายในช่องนั้น

คีย์คอนฟิก:

- allowlist ของ DM (การเข้าถึงผู้ส่ง DM): `channels.irc.allowFrom`
- allowlist ผู้ส่งแบบกลุ่ม (การเข้าถึงผู้ส่งในช่อง): `channels.irc.groupAllowFrom`
- การควบคุมรายช่อง (ช่อง + ผู้ส่ง + กฎการกล่าวถึง): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` อนุญาตช่องที่ไม่ได้กำหนดค่าไว้ (**แต่ยังคงจำกัดด้วยการกล่าวถึงเป็นค่าเริ่มต้น**)

รายการใน allowlist ควรใช้ตัวตนผู้ส่งที่เสถียร (`nick!user@host`)
การจับคู่ด้วย nick เปล่าเปลี่ยนแปลงได้ และจะเปิดใช้ก็ต่อเมื่อ `channels.irc.dangerouslyAllowNameMatching: true`

### ข้อควรระวังที่พบบ่อย: `allowFrom` ใช้สำหรับ DM ไม่ใช่ช่อง

หากคุณเห็นล็อกเช่น:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…หมายความว่าผู้ส่งไม่ได้รับอนุญาตสำหรับข้อความ **กลุ่ม/ช่อง** แก้ไขได้โดย:

- ตั้งค่า `channels.irc.groupAllowFrom` (ส่วนกลางสำหรับทุกช่อง) หรือ
- ตั้งค่า allowlist ผู้ส่งรายช่อง: `channels.irc.groups["#channel"].allowFrom`

ตัวอย่าง (อนุญาตให้ทุกคนใน `#tuirc-dev` คุยกับบอตได้):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## การกระตุ้นให้ตอบกลับ (การกล่าวถึง)

แม้ว่าช่องจะได้รับอนุญาตแล้ว (ผ่าน `groupPolicy` + `groups`) และผู้ส่งก็ได้รับอนุญาต OpenClaw จะใช้ **การจำกัดด้วยการกล่าวถึง** เป็นค่าเริ่มต้นในบริบทแบบกลุ่ม

นั่นหมายความว่าคุณอาจเห็นล็อกเช่น `drop channel … (missing-mention)` เว้นแต่ข้อความจะมีรูปแบบการกล่าวถึงที่ตรงกับบอต

หากต้องการให้บอตตอบในช่อง IRC **โดยไม่ต้องมีการกล่าวถึง** ให้ปิดการจำกัดด้วยการกล่าวถึงสำหรับช่องนั้น:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

หรือหากต้องการอนุญาต **ทุก** ช่อง IRC (ไม่มี allowlist รายช่อง) และยังตอบได้โดยไม่ต้องกล่าวถึง:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## หมายเหตุด้านความปลอดภัย (แนะนำสำหรับช่องสาธารณะ)

หากคุณอนุญาต `allowFrom: ["*"]` ในช่องสาธารณะ ใครก็สามารถส่งพรอมต์ให้บอตได้
เพื่อลดความเสี่ยง ให้จำกัดเครื่องมือสำหรับช่องนั้น

### ใช้เครื่องมือชุดเดียวกันสำหรับทุกคนในช่อง

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### ใช้เครื่องมือต่างกันตามผู้ส่ง (เจ้าของมีสิทธิ์มากกว่า)

ใช้ `toolsBySender` เพื่อใช้นโยบายที่เข้มงวดกว่ากับ `"*"` และนโยบายที่ผ่อนคลายกว่ากับ nick ของคุณ:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

หมายเหตุ:

- คีย์ของ `toolsBySender` ควรใช้ `id:` สำหรับค่าตัวตนผู้ส่ง IRC:
  `id:eigen` หรือ `id:eigen!~eigen@174.127.248.171` เพื่อการจับคู่ที่เข้มงวดยิ่งขึ้น
- คีย์แบบเดิมที่ไม่มีคำนำหน้ายังคงรองรับอยู่ และจะจับคู่เป็น `id:` เท่านั้น
- นโยบายผู้ส่งตัวแรกที่ตรงกันจะมีผล โดย `"*"` เป็นตัวสำรองแบบ wildcard

ดูรายละเอียดเพิ่มเติมเกี่ยวกับการเข้าถึงกลุ่มเทียบกับการจำกัดด้วยการกล่าวถึง (และวิธีที่ทั้งสองอย่างทำงานร่วมกัน) ได้ที่: [/channels/groups](/th/channels/groups)

## NickServ

หากต้องการยืนยันตัวตนกับ NickServ หลังจากเชื่อมต่อ:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

ตัวเลือกสำหรับการลงทะเบียนครั้งเดียวเมื่อเชื่อมต่อ:

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

ปิด `register` หลังจากลงทะเบียน nick แล้วเพื่อหลีกเลี่ยงความพยายาม REGISTER ซ้ำ ๆ

## ตัวแปรสภาพแวดล้อม

บัญชีเริ่มต้นรองรับ:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (คั่นด้วยจุลภาค)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

ไม่สามารถตั้งค่า `IRC_HOST` จาก `.env` ของ workspace ได้ ดู [ไฟล์ `.env` ของ workspace](/th/gateway/security)

## การแก้ไขปัญหา

- หากบอตเชื่อมต่อได้แต่ไม่เคยตอบในช่อง ให้ตรวจสอบ `channels.irc.groups` **และ** ตรวจสอบว่าการจำกัดด้วยการกล่าวถึงกำลังทิ้งข้อความ (`missing-mention`) หรือไม่ หากต้องการให้ตอบโดยไม่ต้อง ping ให้ตั้งค่า `requireMention:false` สำหรับช่องนั้น
- หากการเข้าสู่ระบบล้มเหลว ให้ตรวจสอบว่า nick ว่างอยู่และรหัสผ่านเซิร์ฟเวอร์ถูกต้อง
- หาก TLS ล้มเหลวบนเครือข่ายแบบกำหนดเอง ให้ตรวจสอบ host/port และการตั้งค่าใบรับรอง

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — ช่องที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอน pairing
- [Groups](/th/channels/groups) — พฤติกรรมการแชตกลุ่มและการจำกัดด้วยการกล่าวถึง
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
