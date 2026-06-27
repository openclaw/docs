---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับช่อง IRC หรือ DM
    - คุณกำลังกำหนดค่ารายการที่อนุญาตของ IRC, นโยบายกลุ่ม หรือการควบคุมการกล่าวถึง
summary: การตั้งค่า Plugin IRC การควบคุมการเข้าถึง และการแก้ไขปัญหา
title: IRC
x-i18n:
    generated_at: "2026-06-27T17:11:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7182796ff92f98bd1e6c24cbd456dd1037fa304e3fca4eee13f62eea8cd946f6
    source_path: channels/irc.md
    workflow: 16
---

ใช้ IRC เมื่อคุณต้องการใช้ OpenClaw ในช่องแบบดั้งเดิม (`#room`) และข้อความโดยตรง
ติดตั้ง Plugin IRC อย่างเป็นทางการ แล้วกำหนดค่าภายใต้ `channels.irc`

## เริ่มต้นอย่างรวดเร็ว

1. ติดตั้ง Plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. เปิดใช้การกำหนดค่า IRC ใน `~/.openclaw/openclaw.json`
3. ตั้งค่าอย่างน้อย:

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

แนะนำให้ใช้เซิร์ฟเวอร์ IRC ส่วนตัวสำหรับการประสานงานของบอต หากคุณตั้งใจใช้เครือข่าย IRC สาธารณะ ตัวเลือกทั่วไปได้แก่ Libera.Chat, OFTC และ Snoonet หลีกเลี่ยงช่องสาธารณะที่คาดเดาได้สำหรับทราฟฟิกช่องทางลับของบอตหรือกลุ่มงาน

4. เริ่ม/รีสตาร์ต Gateway:

```bash
openclaw gateway run
```

## ค่าเริ่มต้นด้านความปลอดภัย

- IRC ใช้ซ็อกเก็ต TCP/TLS แบบดิบภายนอกการกำหนดเส้นทางผ่านพร็อกซีส่งต่อที่จัดการโดยผู้ปฏิบัติการ OpenClaw ในการปรับใช้ที่กำหนดให้ทราฟฟิกขาออกทั้งหมดต้องผ่านพร็อกซีส่งต่อนั้น ให้ตั้งค่า `channels.irc.enabled=false` เว้นแต่การออก IRC โดยตรงจะได้รับอนุมัติอย่างชัดเจน
- `channels.irc.dmPolicy` มีค่าเริ่มต้นเป็น `"pairing"`
- `channels.irc.groupPolicy` มีค่าเริ่มต้นเป็น `"allowlist"`
- เมื่อใช้ `groupPolicy="allowlist"` ให้ตั้งค่า `channels.irc.groups` เพื่อกำหนดช่องที่อนุญาต
- ใช้ TLS (`channels.irc.tls=true`) เว้นแต่คุณตั้งใจยอมรับการขนส่งแบบข้อความธรรมดา

## การควบคุมการเข้าถึง

มี “ด่าน” แยกกันสองส่วนสำหรับช่อง IRC:

1. **การเข้าถึงช่อง** (`groupPolicy` + `groups`): บอตจะยอมรับข้อความจากช่องหรือไม่
2. **การเข้าถึงของผู้ส่ง** (`groupAllowFrom` / `groups["#channel"].allowFrom` ต่อช่อง): ใครได้รับอนุญาตให้เรียกใช้บอตภายในช่องนั้น

คีย์การกำหนดค่า:

- รายการอนุญาตของ DM (การเข้าถึงของผู้ส่ง DM): `channels.irc.allowFrom`
- รายการอนุญาตของผู้ส่งในกลุ่ม (การเข้าถึงของผู้ส่งในช่อง): `channels.irc.groupAllowFrom`
- การควบคุมต่อช่อง (ช่อง + ผู้ส่ง + กฎการกล่าวถึง): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` อนุญาตช่องที่ไม่ได้กำหนดค่าไว้ (**ยังคงถูกกั้นด้วยการกล่าวถึงตามค่าเริ่มต้น**)

รายการอนุญาตควรใช้อัตลักษณ์ผู้ส่งที่เสถียร (`nick!user@host`)
การจับคู่ด้วยชื่อเล่นล้วนเปลี่ยนแปลงได้ และเปิดใช้เฉพาะเมื่อ `channels.irc.dangerouslyAllowNameMatching: true`

### ข้อผิดพลาดที่พบบ่อย: `allowFrom` ใช้สำหรับ DM ไม่ใช่ช่อง

หากคุณเห็นล็อกเช่น:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...หมายความว่าผู้ส่งไม่ได้รับอนุญาตสำหรับข้อความ **กลุ่ม/ช่อง** แก้ไขได้โดยทำอย่างใดอย่างหนึ่ง:

- ตั้งค่า `channels.irc.groupAllowFrom` (ส่วนกลางสำหรับทุกช่อง) หรือ
- ตั้งค่ารายการอนุญาตของผู้ส่งต่อช่อง: `channels.irc.groups["#channel"].allowFrom`

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

## การเรียกให้ตอบกลับ (การกล่าวถึง)

แม้ว่าช่องจะได้รับอนุญาตแล้ว (ผ่าน `groupPolicy` + `groups`) และผู้ส่งได้รับอนุญาตแล้ว OpenClaw มีค่าเริ่มต้นเป็นการ **กั้นด้วยการกล่าวถึง** ในบริบทกลุ่ม

นั่นหมายความว่าคุณอาจเห็นล็อกเช่น `drop channel … (missing-mention)` เว้นแต่ข้อความจะมีรูปแบบการกล่าวถึงที่ตรงกับบอต

หากต้องการให้บอตตอบกลับในช่อง IRC **โดยไม่ต้องมีการกล่าวถึง** ให้ปิดการกั้นด้วยการกล่าวถึงสำหรับช่องนั้น:

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

หรือหากต้องการอนุญาตช่อง IRC **ทั้งหมด** (ไม่มีรายการอนุญาตต่อช่อง) และยังตอบกลับโดยไม่ต้องมีการกล่าวถึง:

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

หากคุณอนุญาต `allowFrom: ["*"]` ในช่องสาธารณะ ใครก็สามารถส่งพรอมป์ถึงบอตได้
เพื่อลดความเสี่ยง ให้จำกัดเครื่องมือสำหรับช่องนั้น

### เครื่องมือเดียวกันสำหรับทุกคนในช่อง

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

### เครื่องมือต่างกันตามผู้ส่ง (เจ้าของมีสิทธิ์มากกว่า)

ใช้ `toolsBySender` เพื่อใช้นโยบายที่เข้มงวดกว่าสำหรับ `"*"` และผ่อนปรนกว่าสำหรับชื่อเล่นของคุณ:

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

- คีย์ `toolsBySender` ควรใช้ `id:` สำหรับค่าอัตลักษณ์ผู้ส่ง IRC:
  `id:eigen` หรือ `id:eigen!~eigen@174.127.248.171` เพื่อการจับคู่ที่เข้มงวดยิ่งขึ้น
- คีย์เดิมที่ไม่มีคำนำหน้ายังคงใช้ได้ และจะจับคู่เป็น `id:` เท่านั้น
- นโยบายผู้ส่งแรกที่ตรงกันจะถูกใช้; `"*"` คือทางเลือกสำรองแบบไวลด์การ์ด

ดูเพิ่มเติมเกี่ยวกับการเข้าถึงกลุ่มเทียบกับการกั้นด้วยการกล่าวถึง (และการทำงานร่วมกันของทั้งสอง): [/channels/groups](/th/channels/groups)

## NickServ

เพื่อระบุตัวตนกับ NickServ หลังเชื่อมต่อ:

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

การลงทะเบียนครั้งเดียวเมื่อเชื่อมต่อแบบไม่บังคับ:

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

ปิดใช้ `register` หลังจากชื่อเล่นถูกลงทะเบียนแล้ว เพื่อหลีกเลี่ยงความพยายาม REGISTER ซ้ำ

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

ไม่สามารถตั้งค่า `IRC_HOST` จาก workspace `.env` ได้; ดู [ไฟล์ Workspace `.env`](/th/gateway/security)

## การแก้ไขปัญหา

- หากบอตเชื่อมต่อได้แต่ไม่เคยตอบกลับในช่อง ให้ตรวจสอบ `channels.irc.groups` **และ** ตรวจสอบว่าการกั้นด้วยการกล่าวถึงกำลังทิ้งข้อความหรือไม่ (`missing-mention`) หากคุณต้องการให้ตอบกลับโดยไม่ต้อง ping ให้ตั้งค่า `requireMention:false` สำหรับช่องนั้น
- หากเข้าสู่ระบบไม่สำเร็จ ให้ตรวจสอบความพร้อมใช้งานของชื่อเล่นและรหัสผ่านเซิร์ฟเวอร์
- หาก TLS ไม่สำเร็จบนเครือข่ายแบบกำหนดเอง ให้ตรวจสอบโฮสต์/พอร์ตและการตั้งค่าใบรับรอง

## ที่เกี่ยวข้อง

- [ภาพรวมช่อง](/th/channels) — ช่องทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการกั้นด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่อง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
