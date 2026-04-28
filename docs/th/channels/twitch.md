---
read_when:
    - การตั้งค่าการเชื่อมต่อแชต Twitch สำหรับ OpenClaw
sidebarTitle: Twitch
summary: การกำหนดค่าและการตั้งค่าแชตบอต Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-26T11:24:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d5f4bbad04e04cccc82fc1e2b1057acae3bf7b7684a8e7a4b1f54101731974a
    source_path: channels/twitch.md
    workflow: 15
---

รองรับแชต Twitch ผ่านการเชื่อมต่อ IRC โดย OpenClaw จะเชื่อมต่อในฐานะผู้ใช้ Twitch (บัญชีบอต) เพื่อรับและส่งข้อความในช่องแชต

## Bundled plugin

<Note>
Twitch มาพร้อมเป็น Plugin ที่ bundle มาในรีลีส OpenClaw ปัจจุบัน ดังนั้นโดยปกติแล้ว build แบบแพ็กเกจไม่จำเป็นต้องติดตั้งแยก
</Note>

หากคุณใช้ build เก่ากว่า หรือการติดตั้งแบบกำหนดเองที่ไม่รวม Twitch ให้ติดตั้งด้วยตนเอง:

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

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

<Steps>
  <Step title="ตรวจสอบให้แน่ใจว่า Plugin พร้อมใช้งาน">
    รีลีส OpenClaw แบบแพ็กเกจในปัจจุบันได้รวมไว้แล้ว สำหรับการติดตั้งแบบเก่าหรือกำหนดเองสามารถเพิ่มเองได้ด้วยคำสั่งด้านบน
  </Step>
  <Step title="สร้างบัญชีบอต Twitch">
    สร้างบัญชี Twitch แยกสำหรับบอตโดยเฉพาะ (หรือใช้บัญชีที่มีอยู่แล้ว)
  </Step>
  <Step title="สร้างข้อมูลรับรอง">
    ใช้ [Twitch Token Generator](https://twitchtokengenerator.com/):

    - เลือก **Bot Token**
    - ตรวจสอบว่าเลือก scope `chat:read` และ `chat:write` แล้ว
    - คัดลอก **Client ID** และ **Access Token**

  </Step>
  <Step title="ค้นหา Twitch user ID ของคุณ">
    ใช้ [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) เพื่อแปลง username เป็น Twitch user ID
  </Step>
  <Step title="กำหนดค่า token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (เฉพาะบัญชีค่าเริ่มต้น)
    - หรือ config: `channels.twitch.accessToken`

    หากตั้งค่าไว้ทั้งคู่ config จะมีลำดับความสำคัญสูงกว่า (env เป็น fallback สำหรับบัญชีค่าเริ่มต้นเท่านั้น)

  </Step>
  <Step title="เริ่ม Gateway">
    เริ่ม Gateway โดยเปิดใช้ช่องทางที่ตั้งค่าไว้
  </Step>
</Steps>

<Warning>
เพิ่มการควบคุมการเข้าถึง (`allowFrom` หรือ `allowedRoles`) เพื่อป้องกันไม่ให้ผู้ใช้ที่ไม่ได้รับอนุญาตทริกเกอร์บอตได้ โดย `requireMention` มีค่าเริ่มต้นเป็น `true`
</Warning>

การกำหนดค่าขั้นต่ำ:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // บัญชี Twitch ของบอต
      accessToken: "oauth:abc123...", // OAuth Access Token (หรือใช้ตัวแปร env OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID จาก Token Generator
      channel: "vevisk", // จะเข้าร่วมแชตของช่อง Twitch ใด (จำเป็น)
      allowFrom: ["123456789"], // (แนะนำ) อนุญาตเฉพาะ Twitch user ID ของคุณ - หาได้จาก https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## มันคืออะไร

- ช่อง Twitch ที่ Gateway เป็นเจ้าของ
- การกำหนดเส้นทางแบบกำหนดแน่นอน: การตอบกลับจะส่งกลับไปที่ Twitch เสมอ
- แต่ละบัญชีจะแมปกับคีย์เซสชันแบบแยก `agent:<agentId>:twitch:<accountName>`
- `username` คือบัญชีของบอต (ผู้ที่ใช้ยืนยันตัวตน) ส่วน `channel` คือห้องแชตที่จะเข้าร่วม

## การตั้งค่า (แบบละเอียด)

### สร้างข้อมูลรับรอง

ใช้ [Twitch Token Generator](https://twitchtokengenerator.com/):

- เลือก **Bot Token**
- ตรวจสอบว่าเลือก scope `chat:read` และ `chat:write` แล้ว
- คัดลอก **Client ID** และ **Access Token**

<Note>
ไม่จำเป็นต้องลงทะเบียนแอปเองแบบ manual token จะหมดอายุภายในไม่กี่ชั่วโมง
</Note>

### กำหนดค่าบอต

<Tabs>
  <Tab title="Env var (เฉพาะบัญชีค่าเริ่มต้น)">
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

หากตั้งค่าไว้ทั้ง env และ config แล้ว config จะมีลำดับความสำคัญสูงกว่า

### การควบคุมการเข้าถึง (แนะนำ)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (แนะนำ) อนุญาตเฉพาะ Twitch user ID ของคุณ
    },
  },
}
```

แนะนำให้ใช้ `allowFrom` สำหรับ allowlist แบบเข้มงวด หากคุณต้องการการเข้าถึงตามบทบาท ให้ใช้ `allowedRoles` แทน

**บทบาทที่ใช้ได้:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**ทำไมต้องใช้ user ID?** Username เปลี่ยนได้ ทำให้เกิดการปลอมตัวได้ แต่ user ID เป็นค่าถาวร

ค้นหา Twitch user ID ของคุณ: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (แปลง Twitch username ของคุณเป็น ID)
</Note>

## การรีเฟรช token (ไม่บังคับ)

token จาก [Twitch Token Generator](https://twitchtokengenerator.com/) ไม่สามารถรีเฟรชอัตโนมัติได้ — ให้สร้างใหม่เมื่อหมดอายุ

หากต้องการรีเฟรช token อัตโนมัติ ให้สร้างแอป Twitch ของคุณเองที่ [Twitch Developer Console](https://dev.twitch.tv/console) แล้วเพิ่มลงใน config:

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

บอตจะรีเฟรช token อัตโนมัติก่อนหมดอายุ และบันทึกเหตุการณ์การรีเฟรชลงใน log

## รองรับหลายบัญชี

ใช้ `channels.twitch.accounts` พร้อม token แยกต่อบัญชี ดูรูปแบบที่ใช้ร่วมกันได้ที่ [Configuration](/th/gateway/configuration)

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
แต่ละบัญชีต้องใช้ token ของตัวเอง (หนึ่ง token ต่อหนึ่งช่อง)
</Note>

## การควบคุมการเข้าถึง

<Tabs>
  <Tab title="allowlist ด้วย User ID (ปลอดภัยที่สุด)">
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
  <Tab title="อิงตามบทบาท">
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

    `allowFrom` เป็น allowlist แบบเข้มงวด เมื่อมีการตั้งค่าไว้ จะอนุญาตเฉพาะ user ID เหล่านั้นเท่านั้น หากคุณต้องการการเข้าถึงตามบทบาท ให้ปล่อย `allowFrom` ว่างไว้ แล้วกำหนด `allowedRoles` แทน

  </Tab>
  <Tab title="ปิดข้อกำหนด @mention">
    โดยค่าเริ่มต้น `requireMention` จะเป็น `true` หากต้องการปิดและตอบกลับทุกข้อความ:

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

## การแก้ปัญหา

เริ่มจากรันคำสั่งวินิจฉัย:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="บอตไม่ตอบข้อความ">
    - **ตรวจสอบการควบคุมการเข้าถึง:** ตรวจสอบให้แน่ใจว่า user ID ของคุณอยู่ใน `allowFrom` หรือทดลองเอา `allowFrom` ออกชั่วคราวแล้วตั้ง `allowedRoles: ["all"]` เพื่อทดสอบ
    - **ตรวจสอบว่าบอตอยู่ในช่องแล้ว:** บอตต้องเข้าร่วมช่องที่ระบุไว้ใน `channel`

  </Accordion>
  <Accordion title="ปัญหาเกี่ยวกับ token">
    เกิดข้อผิดพลาด "Failed to connect" หรือข้อผิดพลาดการยืนยันตัวตน:

    - ตรวจสอบว่า `accessToken` เป็นค่า OAuth access token (โดยทั่วไปจะขึ้นต้นด้วย prefix `oauth:`)
    - ตรวจสอบว่า token มี scope `chat:read` และ `chat:write`
    - หากใช้การรีเฟรช token ให้ตรวจสอบว่าตั้งค่า `clientSecret` และ `refreshToken` แล้ว

  </Accordion>
  <Accordion title="การรีเฟรช token ไม่ทำงาน">
    ตรวจสอบ log สำหรับเหตุการณ์การรีเฟรช:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    หากคุณเห็น "token refresh disabled (no refresh token)":

    - ตรวจสอบว่าได้ระบุ `clientSecret` แล้ว
    - ตรวจสอบว่าได้ระบุ `refreshToken` แล้ว

  </Accordion>
</AccordionGroup>

## Config

### การกำหนดค่าบัญชี

<ParamField path="username" type="string">
  username ของบอต
</ParamField>
<ParamField path="accessToken" type="string">
  OAuth access token ที่มี `chat:read` และ `chat:write`
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID (จาก Token Generator หรือจากแอปของคุณ)
</ParamField>
<ParamField path="channel" type="string" required>
  ช่องที่จะเข้าร่วม
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  เปิดใช้งานบัญชีนี้
</ParamField>
<ParamField path="clientSecret" type="string">
  ไม่บังคับ: สำหรับการรีเฟรช token อัตโนมัติ
</ParamField>
<ParamField path="refreshToken" type="string">
  ไม่บังคับ: สำหรับการรีเฟรช token อัตโนมัติ
</ParamField>
<ParamField path="expiresIn" type="number">
  เวลาหมดอายุของ token เป็นวินาที
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  เวลาที่ได้รับ token
</ParamField>
<ParamField path="allowFrom" type="string[]">
  allowlist ของ user ID
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  การควบคุมการเข้าถึงตามบทบาท
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  ต้องมี @mention
</ParamField>

### ตัวเลือกของ provider

- `channels.twitch.enabled` - เปิด/ปิดการเริ่มต้นช่องทาง
- `channels.twitch.username` - username ของบอต (config แบบบัญชีเดียวอย่างย่อ)
- `channels.twitch.accessToken` - OAuth access token (config แบบบัญชีเดียวอย่างย่อ)
- `channels.twitch.clientId` - Twitch Client ID (config แบบบัญชีเดียวอย่างย่อ)
- `channels.twitch.channel` - ช่องที่จะเข้าร่วม (config แบบบัญชีเดียวอย่างย่อ)
- `channels.twitch.accounts.<accountName>` - config แบบหลายบัญชี (ใช้ฟิลด์บัญชีทั้งหมดด้านบน)

ตัวอย่างแบบเต็ม:

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

## การทำงานของ tool

เอเจนต์สามารถเรียก `twitch` ด้วย action ดังนี้:

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

## ความปลอดภัยและการปฏิบัติการ

- **ปฏิบัติต่อ token เหมือนรหัสผ่าน** — อย่า commit token ลง git
- **ใช้การรีเฟรช token อัตโนมัติ** สำหรับบอตที่ทำงานต่อเนื่องระยะยาว
- **ใช้ allowlist แบบ user ID** แทน username สำหรับการควบคุมการเข้าถึง
- **ติดตาม log** สำหรับเหตุการณ์การรีเฟรช token และสถานะการเชื่อมต่อ
- **ขอ scope ของ token เท่าที่จำเป็น** — ขอเฉพาะ `chat:read` และ `chat:write`
- **หากยังติดปัญหา**: รีสตาร์ต Gateway หลังจากยืนยันแล้วว่าไม่มีโปรเซสอื่นครอบครองเซสชันอยู่

## ข้อจำกัด

- **500 อักขระ** ต่อข้อความ (แบ่งข้อความอัตโนมัติตามขอบเขตคำ)
- Markdown จะถูกลบออกก่อนแบ่งข้อความ
- ไม่มีการจำกัดอัตราเพิ่มเติม (ใช้ rate limits ที่ Twitch มีมาให้)

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอนการจับคู่
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
