---
read_when:
    - การตั้งค่าการผสานการทำงานของแชต Twitch สำหรับ OpenClaw
sidebarTitle: Twitch
summary: การกำหนดค่าและการตั้งค่าบอตแชต Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-30T09:39:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 897079687a243c9c2ce2be63167e59f4413bbd89735fb79f03928547023bd787
    source_path: channels/twitch.md
    workflow: 16
---

รองรับแชต Twitch ผ่านการเชื่อมต่อ IRC OpenClaw เชื่อมต่อในฐานะผู้ใช้ Twitch (บัญชีบอต) เพื่อรับและส่งข้อความในช่องต่าง ๆ

## Plugin ที่รวมมาให้

<Note>
Twitch มาพร้อมเป็น Plugin ที่รวมมาให้ในรุ่น OpenClaw ปัจจุบัน ดังนั้นบิลด์แบบแพ็กเกจปกติไม่จำเป็นต้องติดตั้งแยกต่างหาก
</Note>

หากคุณใช้บิลด์เก่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Twitch ให้ติดตั้งแพ็กเกจ npm ปัจจุบันเมื่อมีการเผยแพร่:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

หาก npm รายงานว่าแพ็กเกจที่ OpenClaw เป็นเจ้าของถูกเลิกใช้แล้ว ให้ใช้บิลด์ OpenClaw แบบแพ็กเกจปัจจุบันหรือพาธ local checkout จนกว่าจะมีการเผยแพร่แพ็กเกจ npm รุ่นใหม่กว่า

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าด่วน (ผู้เริ่มต้น)

<Steps>
  <Step title="Ensure plugin is available">
    รุ่น OpenClaw แบบแพ็กเกจปัจจุบันรวมไว้ให้อยู่แล้ว การติดตั้งเก่า/กำหนดเองสามารถเพิ่มด้วยตนเองได้ด้วยคำสั่งด้านบน
  </Step>
  <Step title="Create a Twitch bot account">
    สร้างบัญชี Twitch แยกต่างหากสำหรับบอต (หรือใช้บัญชีที่มีอยู่)
  </Step>
  <Step title="Generate credentials">
    ใช้ [Twitch Token Generator](https://twitchtokengenerator.com/):

    - เลือก **Bot Token**
    - ตรวจสอบว่าเลือก scope `chat:read` และ `chat:write` แล้ว
    - คัดลอก **Client ID** และ **Access Token**

  </Step>
  <Step title="Find your Twitch user ID">
    ใช้ [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) เพื่อแปลงชื่อผู้ใช้เป็น ID ผู้ใช้ Twitch
  </Step>
  <Step title="Configure the token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (เฉพาะบัญชีเริ่มต้น)
    - หรือ config: `channels.twitch.accessToken`

    หากตั้งค่าทั้งสองอย่าง config จะมีความสำคัญกว่า (env fallback ใช้เฉพาะบัญชีเริ่มต้น)

  </Step>
  <Step title="Start the gateway">
    เริ่ม Gateway ด้วยช่องที่กำหนดค่าไว้
  </Step>
</Steps>

<Warning>
เพิ่มการควบคุมการเข้าถึง (`allowFrom` หรือ `allowedRoles`) เพื่อป้องกันไม่ให้ผู้ใช้ที่ไม่ได้รับอนุญาตเรียกใช้บอต ค่าเริ่มต้นของ `requireMention` คือ `true`
</Warning>

config ขั้นต่ำ:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## คืออะไร

- ช่อง Twitch ที่ Gateway เป็นเจ้าของ
- การกำหนดเส้นทางแบบกำหนดแน่นอน: การตอบกลับจะกลับไปที่ Twitch เสมอ
- แต่ละบัญชีแมปกับคีย์เซสชันที่แยกกัน `agent:<agentId>:twitch:<accountName>`
- `username` คือบัญชีของบอต (ผู้ยืนยันตัวตน), `channel` คือห้องแชตที่จะเข้าร่วม

## การตั้งค่า (ละเอียด)

### สร้างข้อมูลประจำตัว

ใช้ [Twitch Token Generator](https://twitchtokengenerator.com/):

- เลือก **Bot Token**
- ตรวจสอบว่าเลือก scope `chat:read` และ `chat:write` แล้ว
- คัดลอก **Client ID** และ **Access Token**

<Note>
ไม่จำเป็นต้องลงทะเบียนแอปด้วยตนเอง Token จะหมดอายุหลังจากหลายชั่วโมง
</Note>

### กำหนดค่าบอต

<Tabs>
  <Tab title="Env var (default account only)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Config">
    ```json5
    {
      channels: {
        twitch: {
          enabled: true,
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
      },
    }
    ```
  </Tab>
</Tabs>

หากตั้งค่าทั้ง env และ config ไว้ config จะมีความสำคัญกว่า

### การควบคุมการเข้าถึง (แนะนำ)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

ควรใช้ `allowFrom` สำหรับ allowlist แบบเคร่งครัด ใช้ `allowedRoles` แทนหากคุณต้องการการเข้าถึงตามบทบาท

**บทบาทที่มีให้ใช้:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`

<Note>
**ทำไมต้องใช้ ID ผู้ใช้?** ชื่อผู้ใช้เปลี่ยนได้ ซึ่งเปิดทางให้มีการสวมรอยได้ ID ผู้ใช้เป็นค่าถาวร

ค้นหา ID ผู้ใช้ Twitch ของคุณ: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (แปลงชื่อผู้ใช้ Twitch ของคุณเป็น ID)
</Note>

## การรีเฟรช Token (ไม่บังคับ)

Token จาก [Twitch Token Generator](https://twitchtokengenerator.com/) ไม่สามารถรีเฟรชอัตโนมัติได้ - สร้างใหม่เมื่อหมดอายุ

สำหรับการรีเฟรช Token อัตโนมัติ ให้สร้างแอปพลิเคชัน Twitch ของคุณเองที่ [Twitch Developer Console](https://dev.twitch.tv/console) แล้วเพิ่มใน config:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

บอตจะรีเฟรช Token โดยอัตโนมัติก่อนหมดอายุและบันทึกเหตุการณ์การรีเฟรชใน log

## การรองรับหลายบัญชี

ใช้ `channels.twitch.accounts` พร้อม Token แยกตามบัญชี ดูรูปแบบที่ใช้ร่วมกันได้ที่ [Configuration](/th/gateway/configuration)

ตัวอย่าง (บัญชีบอตหนึ่งบัญชีในสองช่อง):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

<Note>
แต่ละบัญชีต้องมี Token ของตัวเอง (หนึ่ง Token ต่อหนึ่งช่อง)
</Note>

## การควบคุมการเข้าถึง

<Tabs>
  <Tab title="User ID allowlist (most secure)">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowFrom: ["123456789", "987654321"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Role-based">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowedRoles: ["moderator", "vip"],
            },
          },
        },
      },
    }
    ```

    `allowFrom` คือ allowlist แบบเคร่งครัด เมื่อตั้งค่าแล้ว จะอนุญาตเฉพาะ ID ผู้ใช้เหล่านั้นเท่านั้น หากคุณต้องการการเข้าถึงตามบทบาท ให้เว้น `allowFrom` ไว้และกำหนดค่า `allowedRoles` แทน

  </Tab>
  <Tab title="Disable @mention requirement">
    โดยค่าเริ่มต้น `requireMention` คือ `true` หากต้องการปิดและตอบกลับทุกข้อความ:

    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              requireMention: false,
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## การแก้ไขปัญหา

ก่อนอื่น ให้รันคำสั่งวินิจฉัย:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot does not respond to messages">
    - **ตรวจสอบการควบคุมการเข้าถึง:** ตรวจสอบให้แน่ใจว่า ID ผู้ใช้ของคุณอยู่ใน `allowFrom` หรือถอด `allowFrom` ออกชั่วคราวและตั้งค่า `allowedRoles: ["all"]` เพื่อทดสอบ
    - **ตรวจสอบว่าบอตอยู่ในช่อง:** บอตต้องเข้าร่วมช่องที่ระบุใน `channel`

  </Accordion>
  <Accordion title="Token issues">
    "เชื่อมต่อไม่สำเร็จ" หรือข้อผิดพลาดการยืนยันตัวตน:

    - ตรวจสอบว่า `accessToken` เป็นค่า OAuth access token (โดยทั่วไปขึ้นต้นด้วย prefix `oauth:`)
    - ตรวจสอบว่า Token มี scope `chat:read` และ `chat:write`
    - หากใช้การรีเฟรช Token ให้ตรวจสอบว่าตั้งค่า `clientSecret` และ `refreshToken` แล้ว

  </Accordion>
  <Accordion title="Token refresh not working">
    ตรวจสอบ log สำหรับเหตุการณ์การรีเฟรช:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    หากคุณเห็น "token refresh disabled (no refresh token)":

    - ตรวจสอบว่าระบุ `clientSecret` แล้ว
    - ตรวจสอบว่าระบุ `refreshToken` แล้ว

  </Accordion>
</AccordionGroup>

## Config

### Config บัญชี

<ParamField path="username" type="string">
  ชื่อผู้ใช้ของบอต
</ParamField>
<ParamField path="accessToken" type="string">
  OAuth access token ที่มี `chat:read` และ `chat:write`
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID (จาก Token Generator หรือแอปของคุณ)
</ParamField>
<ParamField path="channel" type="string" required>
  ช่องที่จะเข้าร่วม
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  เปิดใช้งานบัญชีนี้
</ParamField>
<ParamField path="clientSecret" type="string">
  ไม่บังคับ: สำหรับการรีเฟรช Token อัตโนมัติ
</ParamField>
<ParamField path="refreshToken" type="string">
  ไม่บังคับ: สำหรับการรีเฟรช Token อัตโนมัติ
</ParamField>
<ParamField path="expiresIn" type="number">
  การหมดอายุของ Token เป็นวินาที
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  timestamp เวลาที่ได้รับ Token
</ParamField>
<ParamField path="allowFrom" type="string[]">
  allowlist ของ ID ผู้ใช้
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  การควบคุมการเข้าถึงตามบทบาท
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  ต้องใช้ @mention
</ParamField>

### ตัวเลือก Provider

- `channels.twitch.enabled` - เปิด/ปิดการเริ่มต้นช่อง
- `channels.twitch.username` - ชื่อผู้ใช้ของบอต (config แบบบัญชีเดียวอย่างง่าย)
- `channels.twitch.accessToken` - OAuth access token (config แบบบัญชีเดียวอย่างง่าย)
- `channels.twitch.clientId` - Twitch Client ID (config แบบบัญชีเดียวอย่างง่าย)
- `channels.twitch.channel` - ช่องที่จะเข้าร่วม (config แบบบัญชีเดียวอย่างง่าย)
- `channels.twitch.accounts.<accountName>` - config หลายบัญชี (ฟิลด์บัญชีทั้งหมดด้านบน)

ตัวอย่างเต็ม:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## การกระทำของเครื่องมือ

เอเจนต์สามารถเรียก `twitch` ด้วย action:

- `send` - ส่งข้อความไปยังช่อง

ตัวอย่าง:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## ความปลอดภัยและการปฏิบัติงาน

- **ปฏิบัติกับ Token เหมือนรหัสผ่าน** — อย่า commit Token ลง git
- **ใช้การรีเฟรช Token อัตโนมัติ** สำหรับบอตที่ทำงานระยะยาว
- **ใช้ allowlist ของ ID ผู้ใช้** แทนชื่อผู้ใช้สำหรับการควบคุมการเข้าถึง
- **ตรวจสอบ log** สำหรับเหตุการณ์การรีเฟรช Token และสถานะการเชื่อมต่อ
- **จำกัด scope ของ Token ให้น้อยที่สุด** — ขอเฉพาะ `chat:read` และ `chat:write`
- **หากติดขัด**: รีสตาร์ท Gateway หลังจากยืนยันว่าไม่มี process อื่นเป็นเจ้าของเซสชัน

## ขีดจำกัด

- **500 อักขระ** ต่อข้อความ (แบ่ง chunk อัตโนมัติที่ขอบเขตคำ)
- Markdown จะถูกลบออกก่อนแบ่ง chunk
- ไม่มีการจำกัดอัตรา (ใช้ขีดจำกัดอัตราที่มีมาใน Twitch)

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่อง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ภาพรวมช่อง](/th/channels) — ช่องทั้งหมดที่รองรับ
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการกำหนดเงื่อนไข mention
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และ flow การจับคู่
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
