---
read_when:
    - การตั้งค่าการผสานรวมแชต Twitch สำหรับ OpenClaw
sidebarTitle: Twitch
summary: 'บอตแชต Twitch: การติดตั้ง ข้อมูลรับรอง การควบคุมการเข้าถึง และการรีเฟรชโทเค็น'
title: Twitch
x-i18n:
    generated_at: "2026-07-12T15:56:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

รองรับแชต Twitch ผ่านอินเทอร์เฟซแชต (IRC) ของ Twitch โดยใช้ไคลเอนต์ Twurple OpenClaw ลงชื่อเข้าใช้ด้วยบัญชีบอต Twitch เข้าร่วมหนึ่งช่องต่อบัญชีที่กำหนดค่า และตอบกลับในช่องนั้น

## การติดตั้ง

Twitch จัดส่งในรูปแบบ Plugin อย่างเป็นทางการ และไม่ได้เป็นส่วนหนึ่งของการติดตั้งแกนหลัก

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

`plugins install` จะลงทะเบียนและเปิดใช้ Plugin เมื่อเลือก Twitch ระหว่าง `openclaw onboard` หรือ `openclaw channels add` ระบบจะติดตั้งให้ตามต้องการ ใช้ชื่อแพ็กเกจล้วนเพื่อติดตามรุ่นปัจจุบัน และตรึงเวอร์ชันที่แน่นอนเฉพาะเมื่อต้องการให้การติดตั้งทำซ้ำได้ ต้องใช้ OpenClaw 2026.4.10 หรือใหม่กว่า

รายละเอียด: [Plugin](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง Plugin">
    ดู[การติดตั้ง](#install)ด้านบน
  </Step>
  <Step title="สร้างบัญชีบอต Twitch">
    สร้างบัญชี Twitch เฉพาะสำหรับบอต (หรือใช้บัญชีที่มีอยู่)
  </Step>
  <Step title="สร้างข้อมูลรับรอง">
    ใช้ [Twitch Token Generator](https://twitchtokengenerator.com/):

    - เลือก **Bot Token**
    - ตรวจสอบว่าได้เลือกขอบเขต `chat:read` และ `chat:write`
    - คัดลอก **Client ID** และ **Access Token**

  </Step>
  <Step title="ค้นหา ID ผู้ใช้ Twitch ของคุณ">
    ใช้ [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) เพื่อแปลงชื่อผู้ใช้เป็น ID ผู้ใช้ Twitch
  </Step>
  <Step title="กำหนดค่าโทเค็น">
    - ตัวแปรสภาพแวดล้อม: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (เฉพาะบัญชีเริ่มต้น)
    - หรือการกำหนดค่า: `channels.twitch.accessToken`

    หากตั้งค่าทั้งสองอย่าง การกำหนดค่าจะมีลำดับความสำคัญสูงกว่า (ตัวแปรสภาพแวดล้อมเป็นเพียงตัวสำรองสำหรับบัญชีเริ่มต้น)

  </Step>
  <Step title="เริ่ม Gateway">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
เพิ่มการควบคุมการเข้าถึง (`allowFrom` หรือ `allowedRoles`) เพื่อป้องกันไม่ให้ผู้ใช้ที่ไม่ได้รับอนุญาตเรียกใช้บอต ค่าเริ่มต้นของ `requireMention` คือ `true`
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

## สิ่งนี้คืออะไร

- ช่อง Twitch ที่ Gateway เป็นเจ้าของ
- การกำหนดเส้นทางแบบกำหนดแน่นอน: การตอบกลับจะกลับไปยังช่อง Twitch ต้นทางของข้อความเสมอ
- แต่ละช่องที่เข้าร่วมจะเชื่อมโยงกับคีย์เซสชันกลุ่มที่แยกจากกัน `agent:<agentId>:twitch:group:<channel>`
- `username` คือบัญชีของบอต (บัญชีที่ใช้ยืนยันตัวตน) ส่วน `channel` คือห้องแชตที่จะเข้าร่วม รายการบัญชีหนึ่งรายการจะเข้าร่วมได้หนึ่งช่องเท่านั้น
- โทเค็นใช้ได้ทั้งแบบมีและไม่มีคำนำหน้า `oauth:` โดย OpenClaw จะปรับทั้งสองรูปแบบให้เป็นมาตรฐาน (ตัวช่วยตั้งค่าคาดหวังรูปแบบ `oauth:`)

## การรีเฟรชโทเค็น (ไม่บังคับ)

OpenClaw ไม่สามารถรีเฟรชโทเค็นจาก [Twitch Token Generator](https://twitchtokengenerator.com/) ได้ โปรดสร้างใหม่เมื่อหมดอายุ (โทเค็นมีอายุไม่กี่ชั่วโมงและไม่ต้องลงทะเบียนแอป)

สำหรับการรีเฟรชอัตโนมัติ ให้สร้างแอปของคุณเองที่ [Twitch Developer Console](https://dev.twitch.tv/console) แล้วเพิ่ม:

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

เมื่อตั้งค่าทั้งสองอย่าง Plugin จะใช้ผู้ให้บริการยืนยันตัวตนที่รองรับการรีเฟรช ซึ่งต่ออายุโทเค็นก่อนหมดอายุและบันทึกการรีเฟรชแต่ละครั้ง หากไม่มี `refreshToken` ระบบจะบันทึก `token refresh disabled (no refresh token)` และหากไม่มี `clientSecret` ระบบจะย้อนกลับไปใช้โทเค็นแบบคงที่ (ไม่รีเฟรช)

## การรองรับหลายบัญชี

ใช้ `channels.twitch.accounts` พร้อมข้อมูลรับรองแยกตามบัญชี ดูรูปแบบที่ใช้ร่วมกันได้ที่[การกำหนดค่า](/th/gateway/configuration)

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
รายการบัญชีแต่ละรายการต้องมี `accessToken` ของตนเอง (ตัวแปรสภาพแวดล้อมครอบคลุมเฉพาะบัญชีเริ่มต้น) บัญชีหนึ่งจะเข้าร่วมได้หนึ่งช่องเท่านั้น ดังนั้นการเข้าร่วมสองช่องจึงต้องใช้สองบัญชี `channels.twitch.defaultAccount` ใช้เลือกบัญชีเริ่มต้น
</Note>

## การควบคุมการเข้าถึง

`allowFrom` คือรายการอนุญาตแบบบังคับของ ID ผู้ใช้ Twitch เมื่อตั้งค่าแล้ว ระบบจะไม่ใช้ `allowedRoles` หากต้องการใช้การเข้าถึงตามบทบาท ให้เว้น `allowFrom` ไว้โดยไม่ตั้งค่า

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
  <Tab title="ปิดข้อกำหนดการกล่าวถึงด้วย @">
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
**เหตุใดจึงใช้ ID ผู้ใช้?** ชื่อผู้ใช้สามารถเปลี่ยนได้ ซึ่งเปิดโอกาสให้มีการสวมรอย ส่วน ID ผู้ใช้เป็นค่าถาวร

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
    - **ตรวจสอบการควบคุมการเข้าถึง:** ตรวจสอบว่า ID ผู้ใช้ของคุณอยู่ใน `allowFrom` หรือนำ `allowFrom` ออกชั่วคราวแล้วตั้งค่า `allowedRoles: ["all"]` เพื่อทดสอบ
    - **ตรวจสอบด่านการกล่าวถึง:** เมื่อใช้ `requireMention: true` (ค่าเริ่มต้น) ข้อความต้องกล่าวถึงชื่อผู้ใช้ของบอตด้วย @
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
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
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
  โทเค็นการเข้าถึง OAuth ที่มี `chat:read` และ `chat:write` (จากการกำหนดค่าหรือตัวแปรสภาพแวดล้อมสำหรับบัญชีเริ่มต้น)
</ParamField>
<ParamField path="clientId" type="string" required>
  Client ID ของ Twitch (จาก Token Generator หรือแอปของคุณ) ไม่บังคับในสคีมา แต่จำเป็นต่อการเชื่อมต่อ
</ParamField>
<ParamField path="channel" type="string" required>
  ช่องที่จะเข้าร่วม
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  เปิดใช้บัญชีนี้
</ParamField>
<ParamField path="clientSecret" type="string">
  ไม่บังคับ: สำหรับการรีเฟรชโทเค็นอัตโนมัติ
</ParamField>
<ParamField path="refreshToken" type="string">
  ไม่บังคับ: สำหรับการรีเฟรชโทเค็นอัตโนมัติ
</ParamField>
<ParamField path="expiresIn" type="number">
  ระยะเวลาก่อนโทเค็นหมดอายุเป็นวินาที (สำหรับติดตามการรีเฟรช)
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  การประทับเวลาที่ได้รับโทเค็น (สำหรับติดตามการรีเฟรช)
</ParamField>
<ParamField path="allowFrom" type="string[]">
  รายการอนุญาต ID ผู้ใช้ เมื่อตั้งค่าแล้ว ระบบจะไม่ใช้บทบาท
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  การควบคุมการเข้าถึงตามบทบาท
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  กำหนดให้ต้องกล่าวถึงด้วย @ เพื่อเรียกใช้บอต
</ParamField>
<ParamField path="responsePrefix" type="string">
  ค่าที่ใช้แทนคำนำหน้าการตอบกลับขาออกสำหรับบัญชีนี้
</ParamField>

### ตัวเลือกผู้ให้บริการ

- `channels.twitch.enabled` - เปิด/ปิดการเริ่มทำงานของช่อง
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - การกำหนดค่าแบบบัญชีเดียวอย่างง่าย (ใช้บัญชี `default` โดยปริยาย และมีลำดับความสำคัญสูงกว่า `accounts.default`)
- `channels.twitch.accounts.<accountName>` - การกำหนดค่าหลายบัญชี (ฟิลด์บัญชีทั้งหมดด้านบน)
- `channels.twitch.defaultAccount` - ชื่อบัญชีที่จะใช้เป็นบัญชีเริ่มต้น
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

## การดำเนินการของเครื่องมือ

เอเจนต์สามารถส่งข้อความ Twitch ผ่านการดำเนินการ `send` ของเครื่องมือส่งข้อความ:

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

`to` ไม่บังคับ และมีค่าเริ่มต้นเป็น `channel` ที่กำหนดค่าไว้ของบัญชี

## ความปลอดภัยและการปฏิบัติการ

- **ปฏิบัติต่อโทเค็นเหมือนรหัสผ่าน** - ห้ามคอมมิตโทเค็นไปยัง git
- **ใช้การรีเฟรชโทเค็นอัตโนมัติ** สำหรับบอตที่ทำงานเป็นเวลานาน
- **ใช้รายการอนุญาต ID ผู้ใช้** แทนชื่อผู้ใช้สำหรับการควบคุมการเข้าถึง
- **เฝ้าติดตามบันทึก** สำหรับเหตุการณ์การรีเฟรชโทเค็นและสถานะการเชื่อมต่อ
- **จำกัดขอบเขตโทเค็นให้น้อยที่สุด** - ขอเฉพาะ `chat:read` และ `chat:write`
- **หากติดขัด**: เริ่ม Gateway ใหม่หลังจากยืนยันว่าไม่มีกระบวนการอื่นเป็นเจ้าของเซสชัน

## ขีดจำกัด

- **500 อักขระ** ต่อข้อความ การตอบกลับที่ยาวกว่าจะถูกแบ่งเป็นส่วนตามขอบเขตของคำ
- Markdown จะถูกนำออกก่อนส่ง (แชต Twitch เป็นข้อความธรรมดา และบรรทัดใหม่จะเปลี่ยนเป็นช่องว่าง)
- OpenClaw ไม่เพิ่มการจำกัดอัตราด้วยตัวเอง ไคลเอนต์แชต Twurple จะจัดการขีดจำกัดอัตราของ Twitch

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่อง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ภาพรวมช่อง](/th/channels) — ช่องทั้งหมดที่รองรับ
- [กลุ่ม](/th/channels/groups) — ลักษณะการทำงานของแชตกลุ่มและด่านการกล่าวถึง
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตนผ่านข้อความส่วนตัวและขั้นตอนการจับคู่
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่ง
