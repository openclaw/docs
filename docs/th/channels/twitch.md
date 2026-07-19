---
read_when:
    - การตั้งค่าการผสานรวมแชต Twitch สำหรับ OpenClaw
sidebarTitle: Twitch
summary: 'บอตแชต Twitch: การติดตั้ง ข้อมูลประจำตัว การควบคุมการเข้าถึง และการรีเฟรชโทเค็น'
title: Twitch
x-i18n:
    generated_at: "2026-07-19T06:58:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d827c742ded5fd0b071443dead27b975e2414419b0facb486d7f9c0c9800b060
    source_path: channels/twitch.md
    workflow: 16
---

รองรับแชต Twitch ผ่านอินเทอร์เฟซแชต (IRC) ของ Twitch โดยใช้ไคลเอนต์ Twurple โดย OpenClaw จะลงชื่อเข้าใช้ด้วยบัญชีบอต Twitch เข้าร่วมหนึ่งช่องต่อหนึ่งบัญชีที่กำหนดค่า และตอบกลับในช่องนั้น

## การติดตั้ง

Twitch จัดส่งในรูปแบบ Plugin อย่างเป็นทางการ โดยไม่ได้เป็นส่วนหนึ่งของการติดตั้งแกนหลัก

<Tabs>
  <Tab title="รีจิสทรี npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="เช็กเอาต์ในเครื่อง">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

`plugins install` จะลงทะเบียนและเปิดใช้งาน Plugin การเลือก Twitch ระหว่าง `openclaw onboard` หรือ `openclaw channels add` จะติดตั้ง Plugin เมื่อต้องการ ใช้ชื่อแพ็กเกจเปล่าเพื่อติดตามรุ่นปัจจุบัน และตรึงเวอร์ชันแบบเจาะจงเฉพาะเมื่อต้องการให้การติดตั้งทำซ้ำได้อย่างแน่นอน ต้องใช้ OpenClaw 2026.4.10 หรือใหม่กว่า

รายละเอียด: [Plugin](/th/tools/plugin)

## การตั้งค่าด่วน

<Steps>
  <Step title="ติดตั้ง Plugin">
    ดู[การติดตั้ง](#install)ด้านบน
  </Step>
  <Step title="สร้างบัญชีบอต Twitch">
    สร้างบัญชี Twitch แยกสำหรับบอตโดยเฉพาะ (หรือใช้บัญชีที่มีอยู่)
  </Step>
  <Step title="สร้างข้อมูลรับรอง">
    ใช้ [Twitch Token Generator](https://twitchtokengenerator.com/):

    - เลือก **Bot Token**
    - ตรวจสอบว่าได้เลือกขอบเขต `chat:read` และ `chat:write`
    - คัดลอก **Client ID** และ **Access Token**

  </Step>
  <Step title="ค้นหา ID ผู้ใช้ Twitch">
    ใช้ [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) เพื่อแปลงชื่อผู้ใช้เป็น ID ผู้ใช้ Twitch
  </Step>
  <Step title="กำหนดค่าโทเค็น">
    - สภาพแวดล้อม: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (เฉพาะบัญชีเริ่มต้น)
    - หรือการกำหนดค่า: `channels.twitch.accessToken`

    หากตั้งค่าทั้งสองอย่าง การกำหนดค่าจะมีลำดับความสำคัญสูงกว่า (ตัวแปรสภาพแวดล้อมเป็นเพียงทางเลือกสำรองสำหรับบัญชีเริ่มต้น)

  </Step>
  <Step title="เริ่ม Gateway">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
เพิ่มการควบคุมการเข้าถึง (`allowFrom` หรือ `allowedRoles`) เพื่อป้องกันไม่ให้ผู้ใช้ที่ไม่ได้รับอนุญาตเรียกใช้บอต โดย `requireMention` มีค่าเริ่มต้นเป็น `true`
</Warning>

การกำหนดค่าขั้นต่ำ:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // บัญชี Twitch ของบอต (ใช้ยืนยันตัวตน)
      accessToken: "oauth:abc123...", // โทเค็นการเข้าถึง OAuth (หรือใช้ตัวแปรสภาพแวดล้อม OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID จาก Token Generator
      channel: "yourchannel", // แชตของช่อง Twitch ที่จะเข้าร่วม (จำเป็น)
      allowFrom: ["123456789"], // (แนะนำ) เฉพาะ ID ผู้ใช้ Twitch ของคุณ
    },
  },
}
```

## คืออะไร

- ช่อง Twitch ที่ Gateway เป็นเจ้าของ
- การกำหนดเส้นทางแบบตายตัว: การตอบกลับจะส่งกลับไปยังช่อง Twitch ที่เป็นต้นทางของข้อความเสมอ
- แต่ละช่องที่เข้าร่วมจะจับคู่กับคีย์เซสชันกลุ่มที่แยกจากกัน `agent:<agentId>:twitch:group:<channel>`
- `username` คือบัญชีของบอต (บัญชีที่ใช้ยืนยันตัวตน) ส่วน `channel` คือห้องแชตที่จะเข้าร่วม รายการบัญชีหนึ่งรายการจะเข้าร่วมเพียงหนึ่งช่องเท่านั้น
- โทเค็นใช้ได้ทั้งแบบมีและไม่มีคำนำหน้า `oauth:`; OpenClaw จะปรับให้เป็นรูปแบบมาตรฐานได้ทั้งสองแบบ (ตัวช่วยตั้งค่าคาดหวังรูปแบบ `oauth:`)

## ความทนทานของข้อความขาเข้า

OpenClaw จะจัดคิวข้อความแชต Twitch ที่ยอมรับแต่ละข้อความแบบคงทนก่อนส่งต่อไปยังกระบวนการปกติ ข้อความที่รอดำเนินการหรือสามารถลองใหม่ได้จะยังคงอยู่หลัง Gateway รีสตาร์ต ประมวลผลตามลำดับสำหรับช่องที่กำหนดค่า และใช้ ID ข้อความของ Twitch เพื่อระงับรายการคิวซ้ำตราบใดที่ยังมีระเบียนการดำเนินการเสร็จสมบูรณ์ที่กำลังใช้งานหรือเก็บรักษาอยู่

แชต Twitch จะไม่เล่น `PRIVMSG` ซ้ำหลังจากไคลเอนต์ยอมรับแล้ว วิธีนี้ช่วยป้องกันช่วงที่ระบบอาจล่มระหว่างการยอมรับในเครื่องกับการส่งต่อ แต่ไม่สามารถกู้คืนข้อความที่พลาดไปก่อนการรับเข้าแบบคงทน หากการเพิ่มลงในคิวล้มเหลว OpenClaw จะบันทึกความล้มเหลว การเชื่อมต่อใหม่จะไม่ขอให้ Twitch ส่งข้อความนั้นอีกครั้ง

## การรีเฟรชโทเค็น (ไม่บังคับ)

OpenClaw ไม่สามารถรีเฟรชโทเค็นจาก [Twitch Token Generator](https://twitchtokengenerator.com/) ได้ ให้สร้างใหม่เมื่อหมดอายุ (โทเค็นมีอายุไม่กี่ชั่วโมงและไม่ต้องลงทะเบียนแอป)

สำหรับการรีเฟรชอัตโนมัติ ให้สร้างแอปของคุณเองที่ [Twitch Developer Console](https://dev.twitch.tv/console) และเพิ่ม:

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

เมื่อตั้งค่าทั้งสองอย่าง Plugin จะใช้ผู้ให้บริการการยืนยันตัวตนที่รองรับการรีเฟรช ซึ่งจะต่ออายุโทเค็นก่อนหมดอายุและบันทึกการรีเฟรชแต่ละครั้ง หากไม่มี `refreshToken` ระบบจะบันทึก `token refresh disabled (no refresh token)`; หากไม่มี `clientSecret` ระบบจะกลับไปใช้โทเค็นแบบคงที่ (ไม่รีเฟรช)

## การรองรับหลายบัญชี

ใช้ `channels.twitch.accounts` พร้อมข้อมูลรับรองแยกสำหรับแต่ละบัญชี ดูรูปแบบที่ใช้ร่วมกันได้ที่[การกำหนดค่า](/th/gateway/configuration)

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
          channel: "yourchannel",
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
แต่ละรายการบัญชีต้องมี `accessToken` ของตนเอง (ตัวแปรสภาพแวดล้อมครอบคลุมเฉพาะบัญชีเริ่มต้น) หนึ่งบัญชีจะเข้าร่วมได้เพียงหนึ่งช่อง ดังนั้นการเข้าร่วมสองช่องจึงต้องใช้สองบัญชี `channels.twitch.defaultAccount` ใช้เลือกว่าบัญชีใดเป็นบัญชีเริ่มต้น
</Note>

## การควบคุมการเข้าถึง

`allowFrom` คือรายการอนุญาตแบบตายตัวของ ID ผู้ใช้ Twitch เมื่อตั้งค่านี้ ระบบจะไม่สนใจ `allowedRoles`; หากต้องการใช้การเข้าถึงตามบทบาทแทน ให้ไม่ต้องตั้งค่า `allowFrom`

**บทบาทที่ใช้ได้:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`

<Tabs>
  <Tab title="รายการอนุญาต ID ผู้ใช้ (ปลอดภัยที่สุด)">
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
  <Tab title="ตามบทบาท">
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
  </Tab>
  <Tab title="ปิดข้อกำหนดให้ @mention">
    โดยค่าเริ่มต้น `requireMention` คือ `true` หากต้องการตอบกลับข้อความที่ได้รับอนุญาตทั้งหมด:

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

<Note>
**เหตุใดจึงใช้ ID ผู้ใช้?** ชื่อผู้ใช้เปลี่ยนแปลงได้ ซึ่งอาจทำให้มีการแอบอ้างตัวตน ส่วน ID ผู้ใช้เป็นค่าถาวร

ค้นหา ID ของคุณด้วย[เครื่องมือแปลงชื่อผู้ใช้เป็น ID](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
</Note>

## การแก้ไขปัญหา

ขั้นแรก ให้เรียกใช้คำสั่งวินิจฉัย:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="บอตไม่ตอบกลับข้อความ">
    - **ตรวจสอบการควบคุมการเข้าถึง:** ตรวจสอบว่า ID ผู้ใช้ของคุณอยู่ใน `allowFrom` หรือลบ `allowFrom` ชั่วคราวและตั้งค่า `allowedRoles: ["all"]` เพื่อทดสอบ
    - **ตรวจสอบด่านการกล่าวถึง:** เมื่อใช้ `requireMention: true` (ค่าเริ่มต้น) ข้อความต้อง @mention ชื่อผู้ใช้ของบอต
    - **ตรวจสอบว่าบอตอยู่ในช่อง:** บอตจะเข้าร่วมเฉพาะช่องที่ระบุใน `channel`

  </Accordion>
  <Accordion title="ปัญหาเกี่ยวกับโทเค็น">
    ข้อผิดพลาด "Failed to connect" หรือข้อผิดพลาดในการยืนยันตัวตน:

    - ตรวจสอบว่า `accessToken` เป็นค่าโทเค็นการเข้าถึง OAuth (คำนำหน้า `oauth:` ไม่บังคับ)
    - ตรวจสอบว่าโทเค็นมีขอบเขต `chat:read` และ `chat:write`
    - หากใช้การรีเฟรชโทเค็น ให้ตรวจสอบว่าได้ตั้งค่า `clientSecret` และ `refreshToken`

  </Accordion>
  <Accordion title="การรีเฟรชโทเค็นไม่ทำงาน">
    ตรวจสอบบันทึกเพื่อหาเหตุการณ์การรีเฟรช:

    ```text
    ใช้แหล่งโทเค็นจากสภาพแวดล้อมสำหรับ mybot
    รีเฟรชโทเค็นการเข้าถึงสำหรับผู้ใช้ 123456 แล้ว (หมดอายุใน 14400s)
    ```

    หากพบ `token refresh disabled (no refresh token)`:

    - ตรวจสอบว่าได้ระบุ `clientSecret`
    - ตรวจสอบว่าได้ระบุ `refreshToken`

  </Accordion>
</AccordionGroup>

## การกำหนดค่า

### การกำหนดค่าบัญชี

<ParamField path="username" type="string" required>
  ชื่อผู้ใช้ของบอต (บัญชีที่ใช้ยืนยันตัวตน)
</ParamField>
<ParamField path="accessToken" type="string" required>
  โทเค็นการเข้าถึง OAuth ที่มี `chat:read` และ `chat:write` (การกำหนดค่าหรือตัวแปรสภาพแวดล้อมสำหรับบัญชีเริ่มต้น)
</ParamField>
<ParamField path="clientId" type="string" required>
  Client ID ของ Twitch (จาก Token Generator หรือแอปของคุณ) ไม่บังคับในสคีมา แต่จำเป็นสำหรับการเชื่อมต่อ
</ParamField>
<ParamField path="channel" type="string" required>
  ช่องที่จะเข้าร่วม
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  เปิดใช้งานบัญชีนี้
</ParamField>
<ParamField path="clientSecret" type="string">
  ไม่บังคับ: สำหรับการรีเฟรชโทเค็นอัตโนมัติ
</ParamField>
<ParamField path="refreshToken" type="string">
  ไม่บังคับ: สำหรับการรีเฟรชโทเค็นอัตโนมัติ
</ParamField>
<ParamField path="expiresIn" type="number">
  ระยะเวลาจนโทเค็นหมดอายุเป็นวินาที (การติดตามการรีเฟรช)
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  การประทับเวลาเมื่อได้รับโทเค็น (การติดตามการรีเฟรช)
</ParamField>
<ParamField path="allowFrom" type="string[]">
  รายการอนุญาต ID ผู้ใช้ เมื่อตั้งค่าแล้ว ระบบจะไม่สนใจบทบาท
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  การควบคุมการเข้าถึงตามบทบาท
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  กำหนดให้ต้อง @mention เพื่อเรียกใช้บอต
</ParamField>
<ParamField path="responsePrefix" type="string">
  เขียนทับคำนำหน้าการตอบกลับขาออกสำหรับบัญชีนี้
</ParamField>

### ตัวเลือกผู้ให้บริการ

- `channels.twitch.enabled` - เปิด/ปิดการเริ่มต้นช่อง
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - การกำหนดค่าบัญชีเดียวแบบเรียบง่าย (บัญชี `default` โดยนัย; มีลำดับความสำคัญเหนือ `accounts.default`)
- `channels.twitch.accounts.<accountName>` - การกำหนดค่าหลายบัญชี (ฟิลด์บัญชีทั้งหมดด้านบน)
- `channels.twitch.defaultAccount` - ชื่อบัญชีที่จะใช้เป็นค่าเริ่มต้น
- `channels.twitch.markdown.tables` - โหมดการแสดงผลตาราง Markdown (`off` | `bullets` | `code` | `block`)

ตัวอย่างฉบับเต็ม:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "yourchannel",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      accounts: {
        second: {
          username: "mybot",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "your_channel",
          enabled: true,
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## การทำงานของเครื่องมือ

เอเจนต์สามารถส่งข้อความ Twitch ผ่านการดำเนินการ `send` ของเครื่องมือข้อความ:

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

`to` ไม่บังคับและมีค่าเริ่มต้นเป็น `channel` ที่กำหนดค่าไว้สำหรับบัญชี

## ความปลอดภัยและการปฏิบัติการ

- **ปฏิบัติต่อโทเค็นเสมือนรหัสผ่าน** - ห้ามคอมมิตโทเค็นไปยัง git
- **ใช้การรีเฟรชโทเค็นอัตโนมัติ** สำหรับบอตที่ทำงานเป็นเวลานาน
- **ใช้รายการอนุญาตของ ID ผู้ใช้** แทนชื่อผู้ใช้เพื่อควบคุมการเข้าถึง
- **ตรวจสอบบันทึก** เพื่อดูเหตุการณ์การรีเฟรชโทเค็นและสถานะการเชื่อมต่อ
- **จำกัดขอบเขตโทเค็นให้น้อยที่สุด** - ขอเฉพาะ `chat:read` และ `chat:write`
- **หากติดขัด**: รีสตาร์ต Gateway หลังจากยืนยันว่าไม่มีกระบวนการอื่นครอบครองเซสชันอยู่

## ขีดจำกัด

- **500 อักขระ** ต่อข้อความ การตอบกลับที่ยาวกว่านี้จะถูกแบ่งตามขอบเขตคำ
- Markdown จะถูกนำออกก่อนส่ง (แชต Twitch เป็นข้อความธรรมดา และการขึ้นบรรทัดใหม่จะเปลี่ยนเป็นช่องว่าง)
- OpenClaw ไม่ได้เพิ่มการจำกัดอัตราของตนเอง โดยไคลเอนต์แชต Twurple จะจัดการขีดจำกัดอัตราของ Twitch

## เนื้อหาที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ภาพรวมช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [กลุ่ม](/th/channels/groups) — ลักษณะการทำงานของแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนทาง DM และขั้นตอนการจับคู่
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
