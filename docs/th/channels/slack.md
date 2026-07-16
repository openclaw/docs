---
read_when:
    - การตั้งค่า Slack หรือการแก้ไขข้อบกพร่องของโหมดซ็อกเก็ต HTTP หรือรีเลย์ของ Slack
summary: การตั้งค่าและลักษณะการทำงานขณะรันของ Slack (Socket Mode, URL คำขอ HTTP และโหมดรีเลย์)
title: Slack
x-i18n:
    generated_at: "2026-07-16T18:42:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

รองรับ Slack สำหรับ DM และช่องผ่านการผสานรวมแอป Slack การรับส่งข้อมูลเริ่มต้นคือ Socket Mode และรองรับ HTTP Request URLs เช่นกัน โหมดรีเลย์มีไว้สำหรับการติดตั้งใช้งานแบบมีการจัดการ ซึ่งเราเตอร์ที่เชื่อถือได้เป็นผู้ควบคุมทราฟฟิกขาเข้าจาก Slack

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ Slack ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่งแบบสแลช" icon="terminal" href="/th/tools/slash-commands">
    ลักษณะการทำงานของคำสั่งแบบเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ไขปัญหาช่อง" icon="wrench" href="/th/channels/troubleshooting">
    แนวทางวินิจฉัยและคู่มือการซ่อมแซมที่ใช้ข้ามช่องได้
  </Card>
</CardGroup>

## การเลือกวิธีรับส่งข้อมูล

Socket Mode และ HTTP Request URLs มีความสามารถเทียบเท่ากันสำหรับการรับส่งข้อความ คำสั่งแบบสแลช App Home และการโต้ตอบ ให้เลือกตามรูปแบบการติดตั้งใช้งาน ไม่ใช่ตามคุณสมบัติ

| ประเด็น                      | Socket Mode (ค่าเริ่มต้น)                                                                                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL สาธารณะของ Gateway           | ไม่จำเป็น                                                                                                                                         | จำเป็น (DNS, TLS, reverse proxy หรือ tunnel)                                                                   |
| เครือข่ายขาออก             | ต้องเชื่อมต่อ WSS ขาออกไปยัง `wss-primary.slack.com` ได้                                                                                            | ไม่มี WS ขาออก ใช้เฉพาะ HTTPS ขาเข้า                                                                             |
| โทเค็นที่ต้องใช้                | โทเค็นบอต + App-Level Token ที่มี `connections:write`                                                                                                 | โทเค็นบอต + Signing Secret                                                                                     |
| แล็ปท็อปสำหรับพัฒนา / อยู่หลังไฟร์วอลล์ | ใช้งานได้ทันที                                                                                                                                          | ต้องมี tunnel สาธารณะ (ngrok, Cloudflare Tunnel, Tailscale Funnel) หรือ Gateway สำหรับ staging                          |
| การปรับขนาดแนวนอน           | หนึ่งเซสชัน Socket Mode ต่อแอปต่อโฮสต์ แต่ละ Gateway ต้องใช้แอป Slack แยกกัน                                                                 | ตัวจัดการ POST แบบไม่เก็บสถานะ รีพลิกา Gateway หลายตัวสามารถใช้แอปเดียวกันหลังโหลดบาลานเซอร์ได้                     |
| หลายบัญชีใน Gateway เดียว | รองรับ แต่ละบัญชีเปิด WS ของตนเอง                                                                                                             | รองรับ แต่ละบัญชีต้องมี `webhookPath` ที่ไม่ซ้ำกัน (ค่าเริ่มต้น `/slack/events`) เพื่อไม่ให้การลงทะเบียนชนกัน |
| การรับส่งคำสั่งแบบสแลช      | ส่งผ่านการเชื่อมต่อ WS โดยจะไม่ใช้ `slash_commands[].url`                                                                                  | Slack ส่ง POST ไปยัง `slash_commands[].url` โดยต้องระบุฟิลด์นี้จึงจะส่งต่อคำสั่งได้                           |
| การลงลายเซ็นคำขอ              | ไม่ใช้ (การตรวจสอบสิทธิ์ใช้ App-Level Token)                                                                                                               | Slack ลงลายเซ็นทุกคำขอ และ OpenClaw ตรวจสอบด้วย `signingSecret`                                              |
| การกู้คืนเมื่อการเชื่อมต่อหลุด  | เปิดใช้การเชื่อมต่อใหม่อัตโนมัติของ Slack SDK และ OpenClaw จะเริ่มเซสชัน Socket Mode ที่ล้มเหลวใหม่ด้วยการหน่วงเวลาแบบเพิ่มขึ้นที่มีขอบเขต การปรับแต่งการรับส่งข้อมูลสำหรับการหมดเวลา Pong จะมีผล | ไม่มีการเชื่อมต่อถาวรที่อาจหลุด การลองใหม่ดำเนินการโดย Slack แยกตามแต่ละคำขอ                                           |

<Note>
  **เลือก Socket Mode** สำหรับโฮสต์ที่มี Gateway เดียว แล็ปท็อปสำหรับพัฒนา และเครือข่ายภายในองค์กรที่เชื่อมต่อขาออกไปยัง `*.slack.com` ได้ แต่รับ HTTPS ขาเข้าไม่ได้

**เลือก HTTP Request URLs** เมื่อเรียกใช้รีพลิกา Gateway หลายตัวหลังโหลดบาลานเซอร์ เมื่อ WSS ขาออกถูกบล็อกแต่อนุญาต HTTPS ขาเข้า หรือเมื่อมี reverse proxy ที่รับ Webhook ของ Slack อยู่แล้ว
</Note>

<Warning>
  Slack สามารถคงการเชื่อมต่อ Socket Mode หลายรายการสำหรับแอปเดียว และอาจส่งแต่ละเพย์โหลดไปยังการเชื่อมต่อใดก็ได้ ดังนั้น Gateway ของ OpenClaw ที่แยกจากกันแต่ใช้แอป Slack ร่วมกันต้องมีการกำหนดค่าการกำหนดเส้นทางและการอนุญาตที่เทียบเท่ากัน มิฉะนั้น ให้ใช้แอป Slack แยกสำหรับแต่ละ Gateway ใช้จุดรับเข้ารีเลย์เดียว หรือใช้ HTTP Request URLs หลังโหลดบาลานเซอร์ ดู [การใช้ Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections)
</Warning>

### โหมดรีเลย์

โหมดรีเลย์แยกทราฟฟิกขาเข้าจาก Slack ออกจาก Gateway ของ OpenClaw เราเตอร์ที่เชื่อถือได้ควบคุมการเชื่อมต่อ Slack Socket Mode เพียงรายการเดียว เลือก Gateway ปลายทาง และส่งต่ออีเวนต์ที่มีชนิดผ่าน websocket ที่ผ่านการตรวจสอบสิทธิ์ Gateway ยังคงใช้โทเค็นบอตของตนเองสำหรับการเรียก Slack Web API ขาออก

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

URL รีเลย์ต้องใช้ `wss://` เว้นแต่จะชี้ไปยัง localhost ให้ถือว่าโทเค็น bearer และตารางเส้นทางของเราเตอร์เป็นส่วนหนึ่งของขอบเขตการอนุญาต Slack โดยอีเวนต์ที่กำหนดเส้นทางแล้วจะเข้าสู่ตัวจัดการข้อความ Slack ตามปกติในฐานะการเรียกใช้งานที่ได้รับอนุญาต `slack_identity` ที่เราเตอร์ระบุในเฟรม `hello` ของ websocket สามารถกำหนดชื่อผู้ใช้และไอคอนขาออกเริ่มต้นได้ แต่ข้อมูลประจำตัวที่ผู้เรียกระบุอย่างชัดเจนยังคงมีลำดับความสำคัญสูงกว่า การเชื่อมต่อรีเลย์จะเชื่อมต่อใหม่ด้วยจังหวะการหน่วงเวลาแบบเพิ่มขึ้นที่มีขอบเขตเช่นเดียวกับ Socket Mode และล้างข้อมูลประจำตัวที่เราเตอร์ระบุทุกครั้งที่ตัดการเชื่อมต่อ

### การติดตั้งทั่วทั้งองค์กร Enterprise Grid

บัญชี Slack หนึ่งบัญชีสามารถรับข้อความจากทุกเวิร์กสเปซที่ครอบคลุมโดย
การติดตั้งทั่วทั้งองค์กร Enterprise Grid เลือก Socket Mode โดยตรงหรือ HTTP
Request URLs โดยโหมดรีเลย์ไม่รองรับบัญชีองค์กร ทั้งสอง
แมนิเฟสต์แบบสิทธิ์ขั้นต่ำด้านล่างเปิดใช้เฉพาะเส้นทางอีเวนต์ V1 `message` และ `app_mention`
การตอบกลับทันที และรีแอ็กชันสถานะที่ตัวรับฟังเป็นเจ้าของ

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "ตัวเชื่อมต่อ Slack สำหรับ OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

ให้ Enterprise Grid Org Admin หรือ Org Owner อนุมัติแอป ติดตั้งแอปใน
ระดับองค์กร และเลือกเวิร์กสเปซที่การติดตั้งครอบคลุม
ยืนยันว่าแอปพร้อมใช้งานในทุกเวิร์กสเปซที่ต้องการก่อนเริ่ม
OpenClaw สร้างโทเค็นระดับแอปที่มี `connections:write` สำหรับ Socket Mode
จากนั้นคัดลอกโทเค็นบอตจากการติดตั้งระดับองค์กร กำหนดค่าบัญชีที่
ใช้โทเค็นบอตที่ติดตั้งระดับองค์กร:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      enterpriseOrgInstall: true,
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

#### HTTP Request URLs

ใช้โหมด HTTP เมื่อ Gateway มีปลายทาง HTTPS สาธารณะและไม่ได้เปิด
การเชื่อมต่อ Socket Mode แทนที่ URL ตัวอย่างด้วย URL
`webhookPath` สาธารณะของ Gateway (ค่าเริ่มต้น `/slack/events`):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "ตัวเชื่อมต่อ Slack สำหรับ OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

ให้ Enterprise Grid Org Admin หรือ Org Owner อนุมัติแอป ติดตั้งแอปใน
ระดับองค์กร และเลือกเวิร์กสเปซที่การติดตั้งครอบคลุม
หลังจาก Slack ตรวจสอบ Request URL แล้ว ให้คัดลอกโทเค็นบอตของการติดตั้งระดับองค์กรและ
**Basic Information -> App Credentials -> Signing Secret** ของแอป กำหนดค่า
บัญชีองค์กรด้วยพาธ Request URL เดียวกัน:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      enterpriseOrgInstall: true,
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: {
        source: "env",
        provider: "default",
        id: "SLACK_SIGNING_SECRET",
      },
      webhookPath: "/slack/events",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

เมื่อเริ่มต้น OpenClaw จะตรวจสอบ `enterpriseOrgInstall` ด้วย `auth.test` ของ Slack
โทเค็นที่ติดตั้งระดับองค์กรแต่ไม่มีแฟล็ก หรือโทเค็นเวิร์กสเปซที่มีแฟล็ก
จะทำให้การเริ่มต้นล้มเหลว Slack ยังคงเป็นแหล่งข้อมูลจริงสำหรับเวิร์กสเปซที่
อนุญาตการติดตั้ง จากนั้น OpenClaw จะใช้นโยบายช่อง ผู้ใช้
DM และการกล่าวถึงที่กำหนดค่าไว้กับแต่ละอีเวนต์ที่ส่งมา Enterprise V1 ปฏิเสธ
อีเวนต์ `message` และ `app_mention` ทั้งหมดที่บอตสร้างก่อนส่งต่อ ไม่ว่า
`allowBots` จะเป็นค่าใด เนื่องจากการติดตั้งระดับองค์กรไม่มีข้อมูลประจำตัวบอต
ที่ระบุเวิร์กสเปซและมีความเสถียรสำหรับป้องกันลูป

การรองรับองค์กรจงใจจำกัดไว้เฉพาะ Socket Mode โดยตรงหรืออีเวนต์ HTTP
`message` และ `app_mention` รวมถึงการตอบกลับทันทีของอีเวนต์เหล่านั้น โหมดรีเลย์
คำสั่งแบบสแลช การโต้ตอบ App Home ตัวรับฟังอีเวนต์รีแอ็กชัน พิน เครื่องมือการดำเนินการ Slack
การอนุมัติแบบเนทีฟของ Slack การเชื่อมโยง การส่งแบบเข้าคิวหรือกำหนดเวลา
และการส่งเชิงรุกไม่พร้อมใช้งานสำหรับบัญชีองค์กร รองรับรีแอ็กชัน
การตอบรับ การพิมพ์ และสถานะขาออกผ่านไคลเอนต์ Slack
ที่ตัวรับฟังเป็นเจ้าของและต้องใช้ `reactions:write` ส่วนการแจ้งเตือนรีแอ็กชัน
ขาเข้าและเครื่องมือการดำเนินการรีแอ็กชันยังคงไม่พร้อมใช้งาน

การตอบกลับทันทีใช้ลักษณะการส่งมาตรฐานของ Slack ซ้ำสำหรับส่วนย่อย
สื่อ เมทาดาทา การใช้ข้อมูลระบุตัวตนสำรอง การแสดงตัวอย่างลิงก์ และการยืนยันการรับ แต่เฉพาะขณะที่
ไคลเอนต์ที่ผ่านการตรวจสอบและอยู่ภายใต้การควบคุมของลิสเนอร์ยังคงอยู่ในรอบเหตุการณ์ที่ใช้งานอยู่เท่านั้น คิวส่ง
ในหน่วยความจำและระเบียนการเข้าร่วมเธรดจะถูกแบ่งตามเวิร์กสเปซของ
เหตุการณ์นั้น โดยตัวไคลเอนต์เองจะไม่ถูกซีเรียลไลซ์หรือจัดเก็บแบบถาวร

คีย์นโยบายช่องและรายการ `dm.groupChannels` ต้องใช้ ID ช่อง Slack แบบดิบที่คงที่ หรือรูปแบบ
`channel:<id>` OpenClaw จะปรับรูปแบบใดรูปแบบหนึ่งให้เป็น ID ช่องแบบดิบเพื่อ
จับคู่ขณะรันไทม์ ส่วนคำนำหน้า `slack:`, `group:` และ `mpim:` ทำให้เริ่มต้นระบบล้มเหลว
รายการนโยบายผู้ใช้ต้องใช้ ID ผู้ใช้ Slack ที่คงที่ ส่วนชื่อ slug ชื่อที่แสดง
และที่อยู่อีเมลทำให้เริ่มต้นระบบล้มเหลว ID ต้องใช้คำนำหน้าและส่วนเนื้อหาตัวพิมพ์ใหญ่ตามรูปแบบมาตรฐาน
ของ Slack (เช่น `C0123456789` หรือ `U0123456789`) ส่วนตัวพิมพ์เล็กและ
ค่าที่มีลักษณะคล้ายแต่สั้นกว่าจะทำให้เริ่มต้นระบบล้มเหลว บัญชี Enterprise ไม่สามารถเปิดใช้
`dangerouslyAllowNameMatching` ได้ บัญชี Enterprise อาจตั้งค่า `mentionPatterns.mode` ส่วนกลาง
แต่ `mentionPatterns.allowIn` และ
`mentionPatterns.denyIn` ทำให้เริ่มต้นระบบล้มเหลว เนื่องจาก ID ช่อง Slack แบบเปล่าไม่ได้
ระบุเวิร์กสเปซและอาจถูกใช้ซ้ำในหลายเวิร์กสเปซ การติดตั้งในเวิร์กสเปซ
ยังคงใช้ลักษณะการทำงานของรูปแบบการกล่าวถึงแบบจำกัดขอบเขตที่มีอยู่ แต่ละเวิร์กสเปซที่ยอมรับ
จะมีข้อมูลระบุตัวตนสำหรับการกำหนดเส้นทาง เซสชัน ทรานสคริปต์ การขจัดรายการซ้ำ ประวัติ และแคช
แยกกัน แม้ ID ของ Slack จะซ้ำกัน ภายในสตรีม `message` รองรับข้อความผู้ใช้ทั่วไป
และเหตุการณ์ `file_share` ที่ผู้ใช้เป็นผู้สร้าง ส่วนชนิดย่อยของข้อความอื่นจะถูก
ปฏิเสธก่อนการให้สิทธิ์หรือการจัดการเหตุการณ์ระบบ

DM ของ Enterprise ต้องถูกปิดใช้งาน (`dm.enabled=false` หรือ
`dmPolicy="disabled"`) หรือเปิดอย่างชัดเจนด้วย `dmPolicy="open"` และ
`allowFrom` ที่มีผลสำหรับบัญชีซึ่งมีค่าตรงตัว `"*"` รายการอนุญาตที่ว่างเปล่า
หรือ ID เฉพาะผู้ใช้ที่ไม่มี `"*"` จะทำให้เริ่มต้นระบบล้มเหลว การจับคู่และ
รายการอนุญาต DM รายผู้ใช้จะถูกปฏิเสธ เนื่องจาก ID ผู้ใช้ Slack ไม่ได้
ระบุเวิร์กสเปซในที่เก็บข้อมูลการให้สิทธิ์เหล่านั้น นโยบายช่องและผู้ส่ง
ยังคงมีผลกับข้อความในช่อง

## การติดตั้ง

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` จะลงทะเบียนและเปิดใช้ Plugin โดยจะยังไม่ทำงานจนกว่าจะกำหนดค่าแอป Slack และการตั้งค่าช่องด้านล่าง ดูกฎทั่วไปในการติดตั้ง Plugin ที่ [Plugin](/th/tools/plugin)

## การตั้งค่าด่วน

ไฟล์ manifest ในส่วนนี้สร้างการติดตั้งที่จำกัดขอบเขตภายในเวิร์กสเปซ สำหรับการติดตั้ง
ทั่วทั้งองค์กร Enterprise Grid ให้ใช้
[manifest และเวิร์กโฟลว์สำหรับทั้งองค์กรโดยเฉพาะ](#enterprise-grid-org-wide-installs) แทน

<Tabs>
  <Tab title="Socket Mode (ค่าเริ่มต้น)">
    <Steps>
      <Step title="สร้างแอป Slack ใหม่">
        เปิด [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → เลือกเวิร์กสเปซ → วาง manifest รายการใดรายการหนึ่งด้านล่าง → **Next** → **Create**

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "ตัวเชื่อมต่อ Slack สำหรับ OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw เชื่อมต่อเธรดผู้ช่วยของ Slack กับเอเจนต์ OpenClaw",
      "suggested_prompts": [
        { "title": "คุณทำอะไรได้บ้าง", "message": "คุณช่วยเรื่องอะไรได้บ้าง" },
        {
          "title": "สรุปช่องนี้",
          "message": "สรุปกิจกรรมล่าสุดในช่องนี้"
        },
        { "title": "ร่างคำตอบ", "message": "ช่วยร่างคำตอบให้ฉัน" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "ส่งข้อความไปยัง OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "ตัวเชื่อมต่อ Slack สำหรับ OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw เชื่อมต่อเธรดผู้ช่วยของ Slack กับเอเจนต์ OpenClaw",
      "suggested_prompts": [
        { "title": "คุณทำอะไรได้บ้าง", "message": "คุณช่วยเรื่องอะไรได้บ้าง" },
        {
          "title": "สรุปช่องนี้",
          "message": "สรุปกิจกรรมล่าสุดในช่องนี้"
        },
        { "title": "ร่างคำตอบ", "message": "ช่วยร่างคำตอบให้ฉัน" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "ส่งข้อความไปยัง OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Recommended** สอดคล้องกับชุดคุณสมบัติทั้งหมดของ Plugin Slack ได้แก่ App Home, คำสั่ง slash, ไฟล์, รีแอ็กชัน, หมุด, DM แบบกลุ่ม และการอ่านอีโมจิ/กลุ่มผู้ใช้ เลือก **Minimal** เมื่อนโยบายเวิร์กสเปซจำกัดขอบเขตสิทธิ์ โดยครอบคลุม DM, ประวัติช่อง/กลุ่ม, การกล่าวถึง และคำสั่ง slash แต่ตัดไฟล์ รีแอ็กชัน หมุด DM แบบกลุ่ม (`mpim:*`), `emoji:read` และ `usergroups:read` ออก ดูเหตุผลของแต่ละขอบเขตสิทธิ์และตัวเลือกเพิ่มเติม เช่น คำสั่ง slash เพิ่มเติม ที่ [รายการตรวจสอบ manifest และขอบเขตสิทธิ์](#manifest-and-scope-checklist)
        </Note>

        หลังจาก Slack สร้างแอปแล้ว:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: เพิ่ม `connections:write` บันทึก แล้วคัดลอก App-Level Token
        - **Install App -> Install to Workspace**: คัดลอก Bot User OAuth Token

      </Step>

      <Step title="กำหนดค่า OpenClaw">

        การตั้งค่า SecretRef ที่แนะนำ:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        ตัวเลือกสำรองด้วยตัวแปรสภาพแวดล้อม (เฉพาะบัญชีเริ่มต้น):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="เริ่ม Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL คำขอ HTTP">
    <Steps>
      <Step title="สร้างแอป Slack ใหม่">
        เปิด [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → เลือกเวิร์กสเปซ → วาง manifest รายการใดรายการหนึ่งด้านล่าง → แทนที่ `https://gateway-host.example.com/slack/events` ด้วย URL สาธารณะของ Gateway → **Next** → **Create**

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "ตัวเชื่อมต่อ Slack สำหรับ OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw เชื่อมต่อเธรดผู้ช่วยของ Slack กับเอเจนต์ OpenClaw",
      "suggested_prompts": [
        { "title": "คุณทำอะไรได้บ้าง", "message": "คุณช่วยเรื่องอะไรได้บ้าง" },
        {
          "title": "สรุปช่องนี้",
          "message": "สรุปกิจกรรมล่าสุดในช่องนี้"
        },
        { "title": "ร่างคำตอบ", "message": "ช่วยร่างคำตอบให้ฉัน" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "ส่งข้อความไปยัง OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "ตัวเชื่อมต่อ Slack สำหรับ OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw เชื่อมต่อเธรดผู้ช่วยของ Slack กับเอเจนต์ OpenClaw",
      "suggested_prompts": [
        { "title": "คุณทำอะไรได้บ้าง", "message": "คุณช่วยฉันเรื่องอะไรได้บ้าง" },
        {
          "title": "สรุปช่องนี้",
          "message": "สรุปกิจกรรมล่าสุดในช่องนี้"
        },
        { "title": "ร่างข้อความตอบกลับ", "message": "ช่วยฉันร่างข้อความตอบกลับ" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "ส่งข้อความถึง OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

        </CodeGroup>

        <Note>
          **แนะนำ** ตรงกับชุดฟีเจอร์ทั้งหมดของ Plugin Slack ส่วน **ขั้นต่ำ** จะตัดไฟล์ รีแอ็กชัน พิน DM แบบกลุ่ม (`mpim:*`), `emoji:read` และ `usergroups:read` ออกสำหรับเวิร์กสเปซที่มีข้อจำกัด ดูเหตุผลของแต่ละขอบเขตได้ที่ [รายการตรวจสอบแมนิเฟสต์และขอบเขต](#manifest-and-scope-checklist)
        </Note>

        <Info>
          ช่อง URL ทั้งสามช่อง (`slash_commands[].url`, `event_subscriptions.request_url` และ `interactivity.request_url` / `message_menu_options_url`) ชี้ไปยังเอนด์พอยต์ OpenClaw เดียวกัน สคีมาแมนิเฟสต์ของ Slack กำหนดให้ตั้งชื่อแยกกัน แต่ OpenClaw กำหนดเส้นทางตามประเภทเพย์โหลด ดังนั้น `webhookPath` เดียว (ค่าเริ่มต้น `/slack/events`) ก็เพียงพอ คำสั่งแบบสแลชที่ไม่มี `slash_commands[].url` จะไม่ดำเนินการใดๆ โดยไม่แสดงข้อผิดพลาดในโหมด HTTP
        </Info>

        หลังจาก Slack สร้างแอปแล้ว:

        - **Basic Information → App Credentials**: คัดลอก **Signing Secret** สำหรับตรวจสอบคำขอ
        - **Install App -> Install to Workspace**: คัดลอก Bot User OAuth Token

      </Step>

      <Step title="กำหนดค่า OpenClaw">

        การตั้งค่า SecretRef ที่แนะนำ:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        ใช้พาธ Webhook ที่ไม่ซ้ำกันสำหรับ HTTP แบบหลายบัญชี

        กำหนด `webhookPath` ที่แตกต่างกันให้แต่ละบัญชี (ค่าเริ่มต้น `/slack/events`) เพื่อไม่ให้การลงทะเบียนชนกัน
        </Note>

      </Step>

      <Step title="เริ่ม Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## การปรับแต่งการรับส่งข้อมูลใน Socket Mode

โดยค่าเริ่มต้น OpenClaw กำหนดเวลาหมดอายุในการรอ pong ของไคลเอนต์ Slack SDK สำหรับ Socket Mode ไว้ที่ 15 วินาที ปรับการตั้งค่าการรับส่งข้อมูลเฉพาะเมื่อต้องปรับให้เหมาะกับเวิร์กสเปซหรือโฮสต์เท่านั้น:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

ใช้เฉพาะกับเวิร์กสเปซ Socket Mode ที่บันทึกข้อผิดพลาดการหมดเวลาของ pong/server-ping ของเว็บซ็อกเก็ต Slack หรือทำงานบนโฮสต์ที่ทราบว่าลูปเหตุการณ์ขาดช่วง `clientPingTimeout` คือระยะเวลารอ pong หลังจาก SDK ส่ง ping ของไคลเอนต์ ส่วน `serverPingTimeout` คือระยะเวลารอ ping จากเซิร์ฟเวอร์ Slack ข้อความและเหตุการณ์ของแอปยังคงเป็นสถานะแอปพลิเคชัน ไม่ใช่สัญญาณบ่งชี้ว่าการรับส่งข้อมูลยังทำงานอยู่

หมายเหตุ:

- `socketMode` จะถูกละเว้นในโหมด HTTP Request URL
- การตั้งค่า `channels.slack.socketMode` พื้นฐานมีผลกับบัญชี Slack ทั้งหมด เว้นแต่จะมีการเขียนทับ การเขียนทับรายบัญชีใช้ `channels.slack.accounts.<accountId>.socketMode`; เนื่องจากเป็นการเขียนทับแบบออบเจ็กต์ จึงต้องระบุทุกฟิลด์การปรับแต่งซ็อกเก็ตที่ต้องการสำหรับบัญชีนั้น
- มีเพียง `clientPingTimeout` เท่านั้นที่มีค่าเริ่มต้นของ OpenClaw (`15000`) ส่วน `serverPingTimeout` และ `pingPongLoggingEnabled` จะถูกส่งไปยัง Slack SDK เฉพาะเมื่อกำหนดค่าไว้
- ระยะหน่วงก่อนลองใหม่เมื่อรีสตาร์ต Socket Mode เริ่มต้นที่ประมาณ 2 วินาทีและสูงสุดประมาณ 30 วินาที ความล้มเหลวที่กู้คืนได้ระหว่างการเริ่มต้น การรอเริ่มต้น และการตัดการเชื่อมต่อจะลองใหม่จนกว่าช่องจะหยุดทำงาน ข้อผิดพลาดถาวรของบัญชีและข้อมูลประจำตัว เช่น การยืนยันตัวตนไม่ถูกต้อง โทเค็นถูกเพิกถอน หรือขาดขอบเขต จะล้มเหลวทันทีแทนที่จะลองใหม่ตลอดไป

## รายการตรวจสอบแมนิเฟสต์และขอบเขต

แมนิเฟสต์พื้นฐานของแอป Slack เหมือนกันทั้งสำหรับ Socket Mode และ HTTP Request URLs มีเพียงบล็อก `settings` (และ `url` ของคำสั่งแบบสแลช) ที่แตกต่างกัน

แมนิเฟสต์พื้นฐาน (ค่าเริ่มต้น Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "ตัวเชื่อมต่อ Slack สำหรับ OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw เชื่อมต่อเธรดผู้ช่วยของ Slack กับเอเจนต์ OpenClaw",
      "suggested_prompts": [
        { "title": "คุณทำอะไรได้บ้าง", "message": "คุณช่วยฉันเรื่องอะไรได้บ้าง" },
        {
          "title": "สรุปช่องนี้",
          "message": "สรุปกิจกรรมล่าสุดในช่องนี้"
        },
        { "title": "ร่างข้อความตอบกลับ", "message": "ช่วยฉันร่างข้อความตอบกลับ" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "ส่งข้อความถึง OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

สำหรับ **โหมด HTTP Request URLs** ให้แทนที่ `settings` ด้วยรูปแบบ HTTP และเพิ่ม `url` ในคำสั่งแบบสแลชแต่ละรายการ ต้องมี URL สาธารณะ:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "ส่งข้อความถึง OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### การตั้งค่าแมนิเฟสต์เพิ่มเติม

แสดงฟีเจอร์ต่างๆ ที่ต่อยอดจากค่าเริ่มต้นข้างต้น

แมนิเฟสต์เริ่มต้นจะเปิดใช้งานแท็บ **Home** ใน Slack App Home และสมัครรับ `app_home_opened` เมื่อสมาชิกเวิร์กสเปซเปิดแท็บ Home OpenClaw จะเผยแพร่มุมมอง Home เริ่มต้นที่ปลอดภัยพร้อม `views.publish`; โดยไม่มีเพย์โหลดการสนทนาหรือการกำหนดค่าส่วนตัวรวมอยู่ เมื่อเปิดใช้โหมดคำสั่งแบบสแลชคำสั่งเดียว คำใบ้ของคำสั่งจะใช้ `channels.slack.slashCommand.name`; การติดตั้งที่ใช้คำสั่งเนทีฟหรือไม่มีคำสั่งแบบสแลชจะไม่แสดงคำใบ้นั้น แท็บ **Messages** ยังคงเปิดใช้งานสำหรับ DM ของ Slack แมนิเฟสต์ยังเปิดใช้งานเธรดผู้ช่วยของ Slack ด้วย `features.assistant_view`, `assistant:write`, `assistant_thread_started` และ `assistant_thread_context_changed`; เธรดผู้ช่วยจะถูกกำหนดเส้นทางไปยังเซสชันเธรด OpenClaw ของตนเอง และทำให้บริบทเธรดที่ Slack ให้มายังคงพร้อมใช้งานสำหรับเอเจนต์

<AccordionGroup>
  <Accordion title="คำสั่งแบบสแลชเนทีฟที่เลือกใช้ได้">

    สามารถใช้[คำสั่งแบบสแลชเนทีฟ](#commands-and-slash-behavior)หลายคำสั่งแทนคำสั่งเดียวที่กำหนดค่าไว้ โดยมีข้อควรพิจารณาดังนี้:

    - ใช้ `/agentstatus` แทน `/status` เนื่องจากคำสั่ง `/status` ถูกสงวนไว้
    - แอป Slack หนึ่งแอปลงทะเบียนคำสั่งแบบสแลชพร้อมกันได้ไม่เกิน 25 คำสั่ง (ข้อจำกัดของแพลตฟอร์ม Slack)

    แทนที่ส่วน `features.slash_commands` ที่มีอยู่ด้วยชุดย่อยจาก[คำสั่งที่พร้อมใช้งาน](/th/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (ค่าเริ่มต้น)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "เริ่มเซสชันใหม่",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "รีเซ็ตเซสชันปัจจุบัน"
    },
    {
      "command": "/compact",
      "description": "กระชับบริบทของเซสชัน",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "หยุดการทำงานปัจจุบัน"
    },
    {
      "command": "/session",
      "description": "จัดการเวลาหมดอายุของการผูกเธรด",
      "usage_hint": "idle <duration|off> หรือ max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "ตั้งค่าระดับการคิด",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "สลับการแสดงผลแบบละเอียด",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "แสดงหรือตั้งค่าโหมดเร็ว",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "สลับการมองเห็นกระบวนการให้เหตุผล",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "สลับโหมดสิทธิ์ระดับสูง",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "แสดงหรือตั้งค่าเริ่มต้นของ exec",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "อนุมัติหรือปฏิเสธคำขออนุมัติที่รอดำเนินการ",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "แสดงหรือตั้งค่าโมเดล",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "แสดงรายการผู้ให้บริการ/โมเดล",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "แสดงสรุปวิธีใช้แบบย่อ"
    },
    {
      "command": "/commands",
      "description": "แสดงแค็ตตาล็อกคำสั่งที่สร้างขึ้น"
    },
    {
      "command": "/tools",
      "description": "แสดงสิ่งที่เอเจนต์ปัจจุบันสามารถใช้ได้ในขณะนี้",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "แสดงสถานะรันไทม์ รวมถึงการใช้งาน/โควตาของผู้ให้บริการเมื่อมีข้อมูล"
    },
    {
      "command": "/tasks",
      "description": "แสดงรายการงานเบื้องหลังที่กำลังทำงาน/เพิ่งทำงานสำหรับเซสชันปัจจุบัน"
    },
    {
      "command": "/context",
      "description": "อธิบายวิธีประกอบบริบท",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "แสดงข้อมูลประจำตัวผู้ส่งของคุณ"
    },
    {
      "command": "/skill",
      "description": "เรียกใช้สกิลตามชื่อ",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "ถามคำถามแยกโดยไม่เปลี่ยนบริบทของเซสชัน",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "ถามคำถามแยกโดยไม่เปลี่ยนบริบทของเซสชัน",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "ควบคุมส่วนท้ายการใช้งานหรือแสดงสรุปค่าใช้จ่าย",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="URL คำขอ HTTP">
        ใช้รายการ `slash_commands` เดียวกับ Socket Mode ด้านบน และเพิ่ม `"url": "https://gateway-host.example.com/slack/events"` ให้ทุกรายการ ตัวอย่าง:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "เริ่มเซสชันใหม่",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "แสดงสรุปวิธีใช้แบบย่อ",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        ใช้ค่า `url` นั้นซ้ำกับทุกคำสั่งในรายการ

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="ขอบเขตการระบุผู้เขียนเพิ่มเติม (การเขียน)">
    เพิ่มขอบเขตบอต `chat:write.customize` หากต้องการให้ข้อความขาออกใช้ข้อมูลประจำตัวของเอเจนต์ที่ใช้งานอยู่ (ชื่อผู้ใช้และไอคอนที่กำหนดเอง) แทนข้อมูลประจำตัวเริ่มต้นของแอป Slack

    หากใช้ไอคอนอีโมจิ Slack จะใช้ไวยากรณ์ `:emoji_name:`

  </Accordion>
  <Accordion title="ขอบเขตโทเค็นผู้ใช้เพิ่มเติม (การอ่าน)">
    หากกำหนดค่า `channels.slack.userToken` ขอบเขตการอ่านทั่วไปคือ:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (หากต้องพึ่งพาการอ่านจากการค้นหาของ Slack)

  </Accordion>
</AccordionGroup>

## รูปแบบโทเค็น

- Socket Mode ต้องใช้ `botToken` + `appToken`
- โหมด HTTP ต้องใช้ `botToken` + `signingSecret`
- โหมดรีเลย์ต้องใช้ `botToken` ร่วมกับ `relay.url`, `relay.authToken` และ `relay.gatewayId`; โหมดนี้ไม่ใช้โทเค็นแอปหรือข้อมูลลับสำหรับลงนาม
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` และ `userToken` รองรับสตริง
  ข้อความธรรมดาหรือออบเจ็กต์ SecretRef
- โทเค็นในการกำหนดค่ามีลำดับความสำคัญเหนือค่าทดแทนจากสภาพแวดล้อม
- ค่าทดแทนจากสภาพแวดล้อม `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` และ `SLACK_USER_TOKEN` แต่ละค่าจะมีผลเฉพาะกับบัญชีเริ่มต้นเท่านั้น
- `userToken` มีค่าเริ่มต้นเป็นลักษณะการทำงานแบบอ่านอย่างเดียว (`userTokenReadOnly: true`)

ลักษณะการทำงานของสแนปช็อตสถานะ:

- การตรวจสอบบัญชี Slack ติดตามฟิลด์ `*Source` และ `*Status`
  แยกตามข้อมูลประจำตัว (`botToken`, `appToken`, `signingSecret`, `userToken`)
- สถานะคือ `available`, `configured_unavailable` หรือ `missing`
- `configured_unavailable` หมายความว่าบัญชีได้รับการกำหนดค่าผ่าน SecretRef
  หรือแหล่งข้อมูลลับอื่นที่ไม่ได้ระบุค่าแบบอินไลน์ แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบัน
  ไม่สามารถแก้ไขเพื่อรับค่าจริงได้
- ในโหมด HTTP จะรวม `signingSecretStatus`; ส่วนใน Socket Mode
  คู่ที่จำเป็นคือ `botTokenStatus` + `appTokenStatus`

<Tip>
สำหรับการดำเนินการ/การอ่านไดเรกทอรี ระบบสามารถเลือกใช้โทเค็นผู้ใช้ก่อนเมื่อกำหนดค่าไว้ สำหรับการเขียน ระบบยังคงเลือกใช้โทเค็นบอตก่อน โดยอนุญาตให้เขียนด้วยโทเค็นผู้ใช้เฉพาะเมื่อ `userTokenReadOnly: false` และไม่มีโทเค็นบอตเท่านั้น
</Tip>

## การดำเนินการและเกต

การดำเนินการของ Slack ควบคุมโดย `channels.slack.actions.*`

กลุ่มการดำเนินการที่พร้อมใช้ในเครื่องมือ Slack ปัจจุบัน:

| กลุ่ม      | ค่าเริ่มต้น |
| ---------- | ------- |
| messages   | เปิดใช้ |
| reactions  | เปิดใช้ |
| pins       | เปิดใช้ |
| memberInfo | เปิดใช้ |
| emojiList  | เปิดใช้ |

การดำเนินการกับข้อความ Slack ในปัจจุบันประกอบด้วย `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` และ `emoji-list` โดย `download-file` รองรับ ID ไฟล์ Slack ที่แสดงในตัวยึดตำแหน่งไฟล์ขาเข้า และส่งคืนตัวอย่างภาพสำหรับไฟล์ภาพหรือข้อมูลเมตาของไฟล์ในเครื่องสำหรับไฟล์ประเภทอื่น

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.slack.dmPolicy` ควบคุมการเข้าถึง DM โดย `channels.slack.allowFrom` คือรายการอนุญาต DM มาตรฐาน

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (กำหนดให้ `channels.slack.allowFrom` ต้องมี `"*"`)
    - `disabled`

    แฟล็ก DM:

    - `dm.enabled` (ค่าเริ่มต้นคือ true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (แบบเดิม)
    - `dm.groupEnabled` (DM แบบกลุ่มมีค่าเริ่มต้นเป็น false)
    - `dm.groupChannels` (รายการอนุญาต MPIM เพิ่มเติม)

    ลำดับความสำคัญสำหรับหลายบัญชี:

    - `channels.slack.accounts.default.allowFrom` มีผลเฉพาะกับบัญชี `default`
    - บัญชีที่มีชื่อจะสืบทอด `channels.slack.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของบัญชีนั้นเอง
    - บัญชีที่มีชื่อจะไม่สืบทอด `channels.slack.accounts.default.allowFrom`

    ระบบยังคงอ่าน `channels.slack.dm.policy` และ `channels.slack.dm.allowFrom` แบบเดิมเพื่อความเข้ากันได้ โดย `openclaw doctor --fix` จะย้ายข้อมูลเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อสามารถทำได้โดยไม่เปลี่ยนแปลงการเข้าถึง

    การจับคู่ใน DM ใช้ `openclaw pairing approve slack <code>`

  </Tab>

  <Tab title="นโยบายช่อง">
    `channels.slack.groupPolicy` ควบคุมการจัดการช่อง:

    - `open`
    - `allowlist`
    - `disabled`

    รายการอนุญาตช่องอยู่ภายใต้ `channels.slack.channels` และ **ต้องใช้ ID ช่อง Slack ที่คงที่** (เช่น `C12345678`) เป็นคีย์การกำหนดค่า

    หมายเหตุเกี่ยวกับรันไทม์: หากไม่มี `channels.slack` โดยสมบูรณ์ (ตั้งค่าผ่านสภาพแวดล้อมเท่านั้น) รันไทม์จะถอยกลับไปใช้ `groupPolicy="allowlist"` และบันทึกคำเตือน (แม้จะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

    การแก้ไขชื่อ/ID:

    - รายการในรายการอนุญาตช่องและรายการอนุญาต DM จะได้รับการแก้ไขเมื่อเริ่มต้นระบบ หากการเข้าถึงด้วยโทเค็นอนุญาต
    - รายการชื่อช่องที่แก้ไขไม่ได้จะคงอยู่ตามที่กำหนดค่าไว้ แต่จะถูกละเว้นสำหรับการกำหนดเส้นทางโดยค่าเริ่มต้น
    - การอนุญาตขาเข้าและการกำหนดเส้นทางช่องจะใช้ ID ก่อนโดยค่าเริ่มต้น การจับคู่ชื่อผู้ใช้/slug โดยตรงต้องใช้ `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    คีย์ที่อิงตามชื่อ (`#channel-name` หรือ `channel-name`) จะ **ไม่** ตรงกันภายใต้ `groupPolicy: "allowlist"` การค้นหาช่องจะใช้ ID ก่อนโดยค่าเริ่มต้น ดังนั้นคีย์ที่อิงตามชื่อจะไม่สามารถกำหนดเส้นทางได้สำเร็จ และข้อความทั้งหมดในช่องนั้นจะถูกบล็อกโดยไม่มีการแจ้งเตือน ซึ่งแตกต่างจาก `groupPolicy: "open"` ที่ไม่จำเป็นต้องใช้คีย์ช่องในการกำหนดเส้นทาง ทำให้คีย์ที่อิงตามชื่อดูเหมือนจะใช้งานได้

    ใช้ ID ช่อง Slack เป็นคีย์เสมอ วิธีค้นหา: คลิกขวาที่ช่องใน Slack → **Copy link** — ID (`C...`) จะปรากฏที่ท้าย URL

    ถูกต้อง:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```

    ไม่ถูกต้อง (ถูกบล็อกโดยไม่มีการแจ้งเตือนภายใต้ `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="การกล่าวถึงและผู้ใช้ช่อง">
    ข้อความในช่องต้องมีการกล่าวถึงโดยค่าเริ่มต้น

    แหล่งที่มาของการกล่าวถึง:

    - การกล่าวถึงแอปโดยชัดแจ้ง (`<@botId>`)
    - การกล่าวถึงกลุ่มผู้ใช้ Slack (`<!subteam^S...>`) เมื่อผู้ใช้บอตเป็นสมาชิกของกลุ่มผู้ใช้นั้น ต้องใช้ `usergroups:read`
    - รูปแบบนิพจน์ทั่วไปสำหรับการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`, ค่าทดแทน `messages.groupChat.mentionPatterns`)
    - ลักษณะการทำงานโดยนัยเมื่อตอบกลับเธรดของบอต (ปิดใช้งานเมื่อ `thread.requireExplicitMention` เป็น `true`)

    การควบคุมแยกตามช่อง (`channels.slack.channels.<id>`; ใช้ชื่อได้เฉพาะผ่านการแก้ไขเมื่อเริ่มต้นระบบหรือ `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; แทนที่โหมดตอบกลับระดับบัญชี/ประเภทแชตสำหรับช่องนี้)
    - `users` (รายการอนุญาต)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - รูปแบบคีย์ `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` หรือไวลด์การ์ด `"*"`
      (คีย์เดิมที่ไม่มีคำนำหน้ายังคงแมปไปยัง `id:` เท่านั้น)

    `ignoreOtherMentions` (ค่าเริ่มต้น `false`) จะทิ้งข้อความในช่องที่กล่าวถึงผู้ใช้หรือกลุ่มผู้ใช้อื่น แต่ไม่ได้กล่าวถึงบอตนี้ DM และ DM แบบกลุ่ม (MPIM) จะไม่ได้รับผลกระทบ ตัวกรองต้องใช้ ID ผู้ใช้ของบอตที่ระบุได้จาก `auth.test`; หากไม่มีข้อมูลประจำตัวนั้น (เช่น ข้อมูลประจำตัวที่มีเฉพาะโทเค็นผู้ใช้) เกตจะเปิดเมื่อเกิดความล้มเหลวและปล่อยให้ข้อความผ่านไปโดยไม่เปลี่ยนแปลง

    `allowBots` ใช้แนวทางระมัดระวังสำหรับช่องและช่องส่วนตัว: ข้อความในห้องที่บอตเป็นผู้เขียนจะได้รับการยอมรับเฉพาะเมื่อบอตผู้ส่งอยู่ในรายการอนุญาต `users` ของห้องนั้นอย่างชัดเจน หรือเมื่อ ID เจ้าของ Slack ที่ระบุอย่างชัดเจนอย่างน้อยหนึ่งรายการจาก `channels.slack.allowFrom` เป็นสมาชิกของห้องอยู่ในขณะนั้น ไวลด์การ์ดและรายการเจ้าของที่เป็นชื่อที่แสดงไม่ถือว่าเจ้าของอยู่ในห้อง การตรวจสอบว่าเจ้าของอยู่ในห้องใช้ Slack `conversations.members`; ตรวจสอบว่าแอปมีขอบเขตการอ่านที่ตรงกับประเภทห้อง (`channels:read` สำหรับช่องสาธารณะ และ `groups:read` สำหรับช่องส่วนตัว) หากการค้นหาสมาชิกล้มเหลว OpenClaw จะทิ้งข้อความในห้องที่บอตเป็นผู้เขียน

    ข้อความ Slack ที่บอตเป็นผู้เขียนและได้รับการยอมรับจะใช้[การป้องกันลูปของบอต](/th/channels/bot-loop-protection)ร่วมกัน กำหนดค่า `channels.defaults.botLoopProtection` สำหรับงบประมาณเริ่มต้น แล้วเขียนทับด้วย `channels.slack.botLoopProtection` หรือ `channels.slack.channels.<id>.botLoopProtection` เมื่อเวิร์กสเปซหรือช่องต้องใช้ขีดจำกัดอื่น

  </Tab>
</Tabs>

## เธรด เซสชัน และแท็กตอบกลับ

- DM จะกำหนดเส้นทางเป็น `direct`; ช่องเป็น `channel`; MPIM เป็น `group`
- การผูกเส้นทาง Slack รองรับทั้ง ID เพียร์แบบดิบและรูปแบบเป้าหมาย Slack เช่น `channel:C12345678`, `user:U12345678` และ `<@U12345678>`
- เมื่อใช้ค่าเริ่มต้น `session.dmScope=main` DM ของ Slack จะถูกรวมเข้าในเซสชันหลักของเอเจนต์
- เซสชันของช่อง: `agent:<agentId>:slack:channel:<channelId>`
- ข้อความระดับบนสุดทั่วไปในช่องจะยังคงอยู่ในเซสชันแยกตามช่อง แม้ว่า `replyToMode` จะไม่ใช่ `off`
- การตอบกลับในเธรด Slack ใช้ `thread_ts` ของ Slack จากข้อความแม่เป็นส่วนต่อท้ายเซสชัน (`:thread:<threadTs>`) แม้จะปิดใช้เธรดสำหรับการตอบกลับขาออกด้วย `replyToMode="off"`
- OpenClaw จะใส่ข้อความรากระดับบนสุดของช่องที่เข้าเกณฑ์ลงใน `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` เมื่อคาดว่าข้อความรากนั้นจะเริ่มเธรด Slack ที่มองเห็นได้ เพื่อให้ข้อความรากและการตอบกลับในเธรดภายหลังใช้เซสชัน OpenClaw เดียวกัน ซึ่งใช้กับเหตุการณ์ `app_mention` การตรงกับบอตหรือรูปแบบการกล่าวถึงที่กำหนดค่าไว้อย่างชัดเจน และช่อง `requireMention: false` ที่มี `replyToMode` ซึ่งไม่ใช่ `off`
- ค่าเริ่มต้นของ `channels.slack.thread.historyScope` คือ `thread`; ค่าเริ่มต้นของ `thread.inheritParent` คือ `false`
- `channels.slack.thread.initialHistoryLimit` ควบคุมจำนวนข้อความที่มีอยู่ในเธรดซึ่งจะดึงมาเมื่อเริ่มเซสชันเธรดใหม่ (ค่าเริ่มต้น `20`; ตั้งเป็น `0` เพื่อปิดใช้)
- `channels.slack.thread.requireExplicitMention` (ค่าเริ่มต้น `false`): เมื่อเป็น `true` ให้ระงับการกล่าวถึงโดยนัยในเธรด เพื่อให้บอตตอบสนองเฉพาะการกล่าวถึง `@bot` อย่างชัดเจนภายในเธรด แม้ว่าบอตจะเคยเข้าร่วมเธรดนั้นแล้วก็ตาม หากไม่มีตัวเลือกนี้ การตอบกลับในเธรดที่บอตเคยเข้าร่วมจะข้ามเกต `requireMention`

การควบคุมเธรดของการตอบกลับ:

- `channels.slack.channels.<id>.replyToMode`: การเขียนทับแยกตามช่องสำหรับข้อความในช่อง/ช่องส่วนตัวของ Slack
- `channels.slack.replyToMode`: `off|first|all|batched` (ค่าเริ่มต้น `off`)
- `channels.slack.replyToModeByChatType`: แยกตาม `direct|group|channel`
- ทางเลือกสำรองแบบเดิมสำหรับแชตโดยตรง: `channels.slack.dm.replyToMode`

รองรับแท็กตอบกลับแบบกำหนดเอง:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

สำหรับการตอบกลับในเธรด Slack อย่างชัดเจนจากเครื่องมือ `message` ให้ตั้งค่า `replyBroadcast: true` พร้อมกับ `action: "send"` และ `threadId` หรือ `replyTo` เพื่อขอให้ Slack กระจายการตอบกลับในเธรดไปยังช่องแม่ด้วย การตั้งค่านี้จะแมปกับแฟล็ก `reply_broadcast` ของ Slack `chat.postMessage` และรองรับเฉพาะการส่งข้อความหรือ Block Kit ไม่รองรับการอัปโหลดสื่อ

เมื่อการเรียกเครื่องมือ `message` ทำงานภายในเธรด Slack และกำหนดเป้าหมายไปยังช่องเดียวกัน โดยปกติ OpenClaw จะสืบทอดเธรด Slack ปัจจุบันตาม `replyToMode` ที่มีผลสำหรับบัญชี ประเภทแชต หรือแต่ละช่อง การตอบกลับอัตโนมัติและการเรียก `send` หรือ `upload-file` ในช่องเดียวกันใช้การเขียนทับแยกตามช่องเดียวกัน ตั้งค่า `topLevel: true` บน `action: "send"` หรือ `action: "upload-file"` เพื่อบังคับให้สร้างข้อความใหม่ในช่องแม่แทน นอกจากนี้ยังยอมรับ `threadId: null` เป็นการเลือกไม่ใช้ในระดับบนสุดแบบเดียวกัน

<Note>
`replyToMode="off"` ปิดใช้เธรดของการตอบกลับ Slack ขาออก รวมถึงแท็ก `[[reply_to_*]]` ที่ระบุอย่างชัดเจน แต่จะไม่ทำให้เซสชันเธรด Slack ขาเข้ากลายเป็นแบบราบ: ข้อความที่โพสต์อยู่แล้วภายในเธรด Slack จะยังคงกำหนดเส้นทางไปยังเซสชัน `:thread:<threadTs>` ซึ่งต่างจาก Telegram ที่แท็กที่ระบุอย่างชัดเจนยังคงมีผลในโหมด `"off"` เธรด Slack ซ่อนข้อความจากช่อง ขณะที่การตอบกลับของ Telegram ยังคงมองเห็นแบบอินไลน์
</Note>

## รีแอ็กชันการรับทราบ

`ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า `ackReactionScope` กำหนดว่าอีโมจินั้นจะถูกส่งจริง _เมื่อใด_

โดยค่าเริ่มต้น การรับทราบจะคงที่ ขณะที่สถานะเธรดผู้ช่วยแบบเนทีฟของ Slack แสดงความคืบหน้าด้วยข้อความกำลังโหลดที่หมุนเวียน ตั้งค่า `messages.statusReactions.enabled: true` เพื่อเลือกใช้วงจรรีแอ็กชันเข้าคิว/กำลังคิด/เครื่องมือ/เสร็จสิ้น/ข้อผิดพลาดแทน

### อีโมจิ (`ackReaction`)

ลำดับการกำหนดค่า:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- ใช้อีโมจิข้อมูลประจำตัวของเอเจนต์เป็นทางเลือกสำรอง (`agents.list[].identity.emoji` หากไม่มีให้ใช้ `"eyes"` / 👀)

หมายเหตุ:

- Slack ต้องการชอร์ตโค้ด (เช่น `"eyes"`)
- ใช้ `""` เพื่อปิดใช้รีแอ็กชันสำหรับบัญชี Slack หรือปิดใช้ทั่วทั้งระบบ

### ขอบเขต (`messages.ackReactionScope`)

ผู้ให้บริการ Slack อ่านขอบเขตจาก `messages.ackReactionScope` (ค่าเริ่มต้น `"group-mentions"`) ปัจจุบันไม่มีการเขียนทับในระดับบัญชี Slack หรือช่อง Slack; ค่านี้มีผลทั่วทั้ง Gateway

ค่า:

- `"all"`: แสดงรีแอ็กชันใน DM และกลุ่ม รวมถึงเหตุการณ์ทั่วไปในห้อง
- `"direct"`: แสดงรีแอ็กชันเฉพาะใน DM
- `"group-all"`: แสดงรีแอ็กชันในทุกข้อความกลุ่ม ยกเว้นเหตุการณ์ทั่วไปในห้อง (ไม่รวม DM)
- `"group-mentions"` (ค่าเริ่มต้น): แสดงรีแอ็กชันในกลุ่ม แต่เฉพาะเมื่อมีการกล่าวถึงบอต (หรือในรายการที่กล่าวถึงได้ของกลุ่มซึ่งเลือกใช้แล้ว) **ไม่รวม DM**
- `"off"` / `"none"`: ไม่แสดงรีแอ็กชัน

<Note>
ขอบเขตเริ่มต้น (`"group-mentions"`) จะไม่เรียกรีแอ็กชันการรับทราบในข้อความโดยตรงหรือเหตุการณ์ทั่วไปในห้อง หากต้องการเห็น `ackReaction` ที่กำหนดค่าไว้ (เช่น `"eyes"`) ใน DM ขาเข้าของ Slack และเหตุการณ์เงียบในห้อง ให้ตั้งค่า `messages.ackReactionScope` เป็น `"all"` ระบบจะอ่าน `messages.ackReactionScope` เมื่อผู้ให้บริการ Slack เริ่มทำงาน จึงต้องรีสตาร์ต Gateway เพื่อให้การเปลี่ยนแปลงมีผล
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // แสดงรีแอ็กชันใน DM และกลุ่ม
  },
}
```

## การสตรีมข้อความ

`channels.slack.streaming` ควบคุมลักษณะการทำงานของตัวอย่างสด:

- `off`: ปิดใช้การสตรีมตัวอย่างสด
- `partial` (ค่าเริ่มต้น): แทนที่ข้อความตัวอย่างด้วยเอาต์พุตบางส่วนล่าสุด
- `block`: ต่อท้ายการอัปเดตตัวอย่างแบบแบ่งส่วน
- `progress`: แสดงข้อความสถานะความคืบหน้าระหว่างสร้าง แล้วจึงส่งข้อความสุดท้าย
- `streaming.preview.toolProgress`: เมื่อตัวอย่างฉบับร่างทำงาน ให้กำหนดเส้นทางการอัปเดตเครื่องมือ/ความคืบหน้าไปยังข้อความตัวอย่างที่แก้ไขฉบับเดียวกัน (ค่าเริ่มต้น: `true`) ตั้งค่า `false` เพื่อแยกข้อความเครื่องมือ/ความคืบหน้าออกจากกัน
- `streaming.preview.commandText` / `streaming.progress.commandText`: ตั้งเป็น `status` เพื่อคงบรรทัดความคืบหน้าของเครื่องมือแบบกระชับไว้ ขณะซ่อนข้อความคำสั่ง/การดำเนินการแบบดิบ (ค่าเริ่มต้น: `raw`)

ซ่อนข้อความคำสั่ง/การดำเนินการแบบดิบ ขณะที่ยังคงบรรทัดความคืบหน้าแบบกระชับไว้:

```json
{
  "channels": {
    "slack": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

`channels.slack.streaming.nativeTransport` ควบคุมการสตรีมข้อความแบบเนทีฟของ Slack เมื่อ `channels.slack.streaming.mode` เป็น `partial` (ค่าเริ่มต้น: `true`)

การ์ดงานแสดงความคืบหน้าแบบเนทีฟของ Slack เป็นตัวเลือกที่ต้องเลือกใช้สำหรับโหมดความคืบหน้า ตั้งค่า `channels.slack.streaming.progress.nativeTaskCards` เป็น `true` พร้อมกับ `channels.slack.streaming.mode="progress"` เพื่อส่งการ์ดแผน/งานแบบเนทีฟของ Slack ระหว่างดำเนินงาน แล้วอัปเดตการ์ดงานเดิมเมื่อเสร็จสิ้น หากไม่มีแฟล็กนี้ โหมดความคืบหน้าจะยังคงใช้ลักษณะการทำงานของตัวอย่างฉบับร่างแบบพกพา

- ต้องมีเธรดตอบกลับเพื่อให้การสตรีมข้อความแบบเนทีฟและสถานะเธรดผู้ช่วยของ Slack ปรากฏ การเลือกเธรดยังคงเป็นไปตาม `replyToMode`
- ข้อความรากระดับบนสุดของช่อง แชตกลุ่ม และ DM ยังคงใช้ตัวอย่างฉบับร่างตามปกติได้ เมื่อการสตรีมแบบเนทีฟไม่พร้อมใช้งานหรือไม่มีเธรดตอบกลับ
- DM ระดับบนสุดของ Slack จะไม่อยู่ในเธรดโดยค่าเริ่มต้น จึงไม่แสดงตัวอย่างสตรีม/สถานะแบบเนทีฟในรูปแบบเธรดของ Slack; OpenClaw จะโพสต์และแก้ไขตัวอย่างฉบับร่างใน DM แทน
- สื่อและเพย์โหลดที่ไม่ใช่ข้อความจะเปลี่ยนไปใช้การนำส่งตามปกติ
- ผลลัพธ์สุดท้ายที่เป็นสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่รอดำเนินการ; ผลลัพธ์สุดท้ายที่เป็นข้อความ/บล็อกและเข้าเกณฑ์จะส่งออกให้ครบถ้วนเฉพาะเมื่อสามารถแก้ไขตัวอย่าง ณ ตำแหน่งเดิมได้
- หากการสตรีมล้มเหลวระหว่างการตอบกลับ OpenClaw จะเปลี่ยนไปใช้การนำส่งตามปกติสำหรับเพย์โหลดที่เหลือ

ใช้ตัวอย่างฉบับร่างแทนการสตรีมข้อความแบบเนทีฟของ Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

เลือกใช้การ์ดงานแสดงความคืบหน้าแบบเนทีฟของ Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

คีย์แบบเดิม:

- `channels.slack.streamMode` (`replace | status_final | append`) เป็นนามแฝงแบบเดิมของ `channels.slack.streaming.mode`
- บูลีน `channels.slack.streaming` เป็นนามแฝงแบบเดิมของ `channels.slack.streaming.mode` และ `channels.slack.streaming.nativeTransport`
- `channels.slack.chunkMode` และ `channels.slack.nativeStreaming` ระดับบนสุดเป็นนามแฝงแบบเดิมของ `channels.slack.streaming.chunkMode` และ `channels.slack.streaming.nativeTransport`
- ระบบจะไม่อ่านนามแฝงแบบเดิมขณะรันไทม์ ให้เรียกใช้ `openclaw doctor --fix` เพื่อเขียนการกำหนดค่าการสตรีม Slack ที่จัดเก็บไว้อีกครั้งโดยใช้คีย์มาตรฐาน

## รีแอ็กชันสำรองสำหรับสถานะกำลังพิมพ์

`typingReaction` เพิ่มรีแอ็กชันชั่วคราวให้กับข้อความ Slack ขาเข้า ขณะที่ OpenClaw กำลังประมวลผลคำตอบ แล้วนำออกเมื่อการทำงานเสร็จสิ้น ตัวเลือกนี้มีประโยชน์มากที่สุดนอกการตอบกลับในเธรด ซึ่งใช้ตัวบ่งชี้สถานะ "กำลังพิมพ์..." ตามค่าเริ่มต้น

ลำดับการกำหนดค่า:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

หมายเหตุ:

- Slack ต้องการชอร์ตโค้ด (เช่น `"hourglass_flowing_sand"`)
- รีแอ็กชันนี้เป็นการดำเนินการแบบพยายามให้ดีที่สุด และระบบจะพยายามล้างข้อมูลโดยอัตโนมัติหลังจากเส้นทางการตอบกลับหรือความล้มเหลวเสร็จสิ้น

## อินพุตเสียง

หากต้องการพูดกับ OpenClaw ใน Slack ในปัจจุบัน ให้ส่งคลิปเสียง Slack ไปยังแอป OpenClaw ไมโครโฟนสำหรับการป้อนตามคำบอกของ Slackbot เป็นฟีเจอร์แยกต่างหากที่ Slack เป็นเจ้าของ ไม่ใช่ API ของแอป

- **[การป้อนตามคำบอกด้วยเสียงของ Slackbot](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** อยู่ภายในการสนทนา Slackbot ส่วนตัวของผู้ใช้ Slack จะแปลงเสียงบันทึกเป็นพรอมต์ของ Slackbot แต่จะไม่ส่งไฟล์เสียง เหตุการณ์การป้อนตามคำบอก พรอมต์ หรือเครื่องหมายระบุแหล่งอินพุตให้แอป Slack ของบุคคลที่สามผ่าน Events API Plugin Slack ของ OpenClaw ไม่สามารถเปิดใช้หรือรับข้อมูลดังกล่าวได้
- **[คลิปเสียงของ Slack](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** คือไฟล์ Slack ที่จัดเก็บไว้และสามารถโพสต์ใน DM, ช่อง หรือเธรดของ OpenClaw ได้ OpenClaw ดาวน์โหลดคลิปที่เข้าถึงได้โดยใช้โทเค็นบอต ปรับข้อมูลเมตา MIME ของคลิปจาก Slack ให้เป็นมาตรฐาน และส่งผ่าน[ไปป์ไลน์การถอดเสียงจากเสียง](/th/nodes/audio)ที่ใช้ร่วมกัน แมนิเฟสต์แอปที่แนะนำมีขอบเขต `files:read` ที่จำเป็น

คลิปเสียงและการป้อนตามคำบอกของ Slackbot มีความหมายด้านความเป็นส่วนตัวต่างกัน กล่าวคือ คลิปเป็นไปตามนโยบายการเก็บรักษาไฟล์ของ Slack และ OpenClaw จะดาวน์โหลดคลิปเพื่อถอดเสียง ขณะที่ Slack ระบุว่าไม่มีการจัดเก็บเสียงจากการป้อนตามคำบอก

ในช่องที่มี `requireMention: true` คลิปเสียงที่ไม่มีคำบรรยายสามารถผ่านเกตได้โดยพูดรูปแบบการกล่าวถึงที่กำหนดไว้ (`agents.list[].groupChat.mentionPatterns` โดยใช้ `messages.groupChat.mentionPatterns` เป็นค่าทดแทน) OpenClaw อนุญาตสิทธิ์ผู้ส่งก่อนดาวน์โหลดหรือถอดเสียงคลิป จากนั้นจะยอมรับคลิปเฉพาะเมื่อข้อความถอดเสียงตรงกับรูปแบบเท่านั้น ข้อความถอดเสียงเชิงคาดการณ์ที่ล้มเหลวหรือไม่ตรงจะถูกทิ้งพร้อมคลิปที่ดาวน์โหลด และจะไม่ถูกเก็บไว้ในประวัติช่อง ไม่สามารถอนุมานอัตลักษณ์ `@bot` ดั้งเดิมของ Slack จากเสียงพูดได้ ดังนั้นให้กำหนดรูปแบบชื่อที่พูดหรือใส่การกล่าวถึงด้วยข้อความ หากเปิดใช้การสะท้อนข้อความถอดเสียง ระบบจะส่งข้อความสะท้อนหลังจากยอมรับแล้วเท่านั้น

## สื่อ การแบ่งส่วน และการส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบขาเข้า">
    ระบบจะดาวน์โหลดไฟล์แนบ Slack จาก URL ส่วนตัวที่โฮสต์โดย Slack (โฟลว์คำขอที่ยืนยันตัวตนด้วยโทเค็น) และเขียนลงในคลังสื่อเมื่อดึงข้อมูลสำเร็จและขนาดไม่เกินขีดจำกัด ตัวยึดตำแหน่งไฟล์มี `fileId` ของ Slack เพื่อให้เอเจนต์ดึงไฟล์ต้นฉบับด้วย `download-file` ได้

    การดาวน์โหลดใช้ระยะหมดเวลาสูงสุดทั้งขณะไม่มีความคืบหน้าและตลอดกระบวนการ หากการดึงไฟล์ Slack หยุดชะงักหรือล้มเหลว OpenClaw จะประมวลผลข้อความต่อไปและใช้ตัวยึดตำแหน่งไฟล์แทน

    ขีดจำกัดขนาดขาเข้าขณะรันมีค่าเริ่มต้นเป็น `20MB` เว้นแต่จะถูกแทนที่ด้วย `channels.slack.mediaMaxMb`

  </Accordion>

  <Accordion title="ข้อความและไฟล์ขาออก">
    - ส่วนข้อความใช้ `channels.slack.textChunkLimit` (ค่าเริ่มต้น `8000` และถูกจำกัดไม่เกินขีดจำกัดความยาวข้อความของ Slack)
    - `channels.slack.streaming.chunkMode="newline"` เปิดใช้การแบ่งตามย่อหน้าก่อน
    - การส่งไฟล์ใช้ API อัปโหลดของ Slack และสามารถรวมการตอบกลับในเธรดได้ (`thread_ts`)
    - คำบรรยายไฟล์ที่ยาวจะใช้ส่วนข้อความแรกที่ปลอดภัยสำหรับ Slack เป็นความคิดเห็นของการอัปโหลด และส่งส่วนที่เหลือเป็นข้อความติดตาม
    - ขีดจำกัดสื่อขาออกเป็นไปตาม `channels.slack.mediaMaxMb` เมื่อกำหนดค่าไว้ มิฉะนั้นการส่งผ่านช่องจะใช้ค่าเริ่มต้นตามชนิด MIME จากไปป์ไลน์สื่อ

  </Accordion>

  <Accordion title="เป้าหมายการส่ง">
    เป้าหมายแบบระบุชัดเจนที่แนะนำ:

    - `user:<id>` สำหรับ DM
    - `channel:<id>` สำหรับช่อง

    DM ของ Slack ที่มีเฉพาะข้อความ/บล็อกสามารถโพสต์ไปยัง ID ผู้ใช้ได้โดยตรง ส่วนการอัปโหลดไฟล์และการส่งในเธรดจะเปิด DM ผ่าน API การสนทนาของ Slack ก่อน เนื่องจากเส้นทางเหล่านี้ต้องใช้ ID การสนทนาที่ระบุชัดเจน

  </Accordion>
</AccordionGroup>

## คำสั่งและลักษณะการทำงานของเครื่องหมายทับ

คำสั่งเครื่องหมายทับจะแสดงใน Slack เป็นคำสั่งเดียวที่กำหนดค่าไว้หรือคำสั่งดั้งเดิมหลายคำสั่ง กำหนดค่า `channels.slack.slashCommand` เพื่อเปลี่ยนค่าเริ่มต้นของคำสั่ง:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

คำสั่งดั้งเดิมต้องมี[การตั้งค่าแมนิเฟสต์เพิ่มเติม](#additional-manifest-settings)ในแอป Slack และเปิดใช้ด้วย `channels.slack.commands.native: true` หรือ `commands.native: true` ในการกำหนดค่าส่วนกลางแทน

- โหมดอัตโนมัติของคำสั่งดั้งเดิมจะ**ปิด**สำหรับ Slack ดังนั้น `commands.native: "auto"` จะไม่เปิดใช้คำสั่งดั้งเดิมของ Slack

```txt
/help
```

เมนูอาร์กิวเมนต์ดั้งเดิมจะแสดงเป็นรูปแบบใดรูปแบบหนึ่งต่อไปนี้ตามลำดับความสำคัญ:

- ตัวเลือกสั้นเพียงพอ 3-5 รายการ: เมนูรายการเพิ่มเติม ("...")
- ตัวเลือกมากกว่า 100 รายการและมีการกรองตัวเลือกแบบอะซิงโครนัส: ตัวเลือกภายนอก
- ตัวเลือก 1-2 รายการ หรือตัวเลือกใดก็ตามที่มีค่าที่เข้ารหัสยาวเกินกว่าจะใช้กับตัวเลือก: บล็อกปุ่ม
- กรณีอื่น (ตัวเลือก 6-100 รายการ หรือมากกว่า 100 รายการโดยไม่มีการกรองแบบอะซิงโครนัส): เมนูตัวเลือกแบบคงที่ แบ่งส่วนละ 100 ตัวเลือกต่อเมนู

```txt
/think
```

เซสชันคำสั่งเครื่องหมายทับใช้คีย์แยกกัน เช่น `agent:<agentId>:slack:slash:<userId>` และยังคงกำหนดเส้นทางการเรียกใช้คำสั่งไปยังเซสชันการสนทนาเป้าหมายโดยใช้ `CommandTargetSessionKey`

## แผนภูมิดั้งเดิม

[บล็อก Block Kit `data_visualization`](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/) สาธารณะของ Slack
แสดงแผนภูมิเส้น แท่ง พื้นที่ และวงกลมในข้อความ OpenClaw แมปบล็อก
`presentation` `chart` แบบพกพาไปเป็นรูปแบบดั้งเดิมดังกล่าว โดยไม่ต้องมีขอบเขต OAuth เพิ่มเติม
การอัปโหลดไฟล์ ตัวเรนเดอร์รูปภาพ หรือการกำหนดค่า Slack เพิ่มเติม นอกเหนือจากสิทธิ์เข้าถึงข้อความ
`chat:write` ตามปกติ

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "รายได้รายไตรมาส",
      "categories": ["Q1", "Q2"],
      "series": [{ "name": "รายได้", "values": [120, 145] }],
      "xLabel": "ไตรมาส"
    }
  ]
}
```

ระบบจะบังคับใช้ขีดจำกัดของ Slack ก่อนเรนเดอร์แบบดั้งเดิม:

- ชื่อและป้ายกำกับแกนที่ไม่บังคับ: 50 อักขระ
- วงกลม: ส่วนที่มีค่าบวก 1-12 ส่วน
- เส้น/แท่ง/พื้นที่: ชุดข้อมูลที่มีชื่อไม่ซ้ำกัน 1-12 ชุด และหมวดหมู่ที่ใช้ร่วมกัน 1-20 หมวดหมู่
- ป้ายกำกับส่วน หมวดหมู่ และชุดข้อมูล: 20 อักขระ
- ทุกชุดข้อมูลต้องมีค่าจำกัดหนึ่งค่าสำหรับแต่ละหมวดหมู่ ค่าที่ไม่ใช่แผนภูมิวงกลม
  อาจเป็นค่าลบได้

แผนภูมิดั้งเดิมทุกแผนภูมิยังมีการแสดงผลเป็นข้อความระดับบนสุดสำหรับโปรแกรม
อ่านหน้าจอ การแจ้งเตือน การสะท้อนเซสชัน และไคลเอ็นต์ที่ไม่สามารถเรนเดอร์
บล็อกได้ การส่งการนำเสนอแบบมาตรฐานไปยังช่องอื่นของ OpenClaw จะได้รับข้อมูล
แผนภูมิแบบกำหนดแน่นอนชุดเดียวกันในรูปข้อความ เว้นแต่ช่องนั้นจะประกาศว่ารองรับแผนภูมิดั้งเดิม หาก
Slack ปฏิเสธแผนภูมิด้วย `invalid_blocks` ระหว่างการทยอยเปิดใช้ OpenClaw
จะนำบล็อกข้อมูลดั้งเดิมที่ถูกปฏิเสธออก เก็บตัวควบคุมข้างเคียงไว้ และส่ง
การแสดงผลแผนภูมิทั้งหมดเป็นข้อความที่มองเห็นได้

ปัจจุบัน Slack ยอมรับบล็อก `data_visualization` ได้สูงสุดสองบล็อกต่อข้อความ เมื่อ
การนำเสนอมีแผนภูมิที่ถูกต้องมากกว่าสองรายการ OpenClaw จะรักษาลำดับไว้
และเรนเดอร์แบบดั้งเดิมต่อในข้อความติดตาม โดยแต่ละข้อความมีแผนภูมิ
ไม่เกินสองรายการ

[ประกาศเปิดตัวสำหรับนักพัฒนา](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
ของ Slack ระบุว่าบล็อกนี้เป็นฟีเจอร์ Block Kit สำหรับแอปและไม่ได้เผยแพร่
ข้อจำกัดสำหรับแผนแบบชำระเงิน ข้อความเกี่ยวกับสิทธิ์ของ Business+/Enterprise ใช้กับ
การสร้างแผนภูมิด้วย AI โดยอัตโนมัติของ Slackbot ซึ่งแยกจากการที่แอปส่ง
แผนภูมิ Block Kit ที่มีโครงสร้างอยู่แล้ว แผนภูมิเป็นบล็อกสำหรับข้อความเท่านั้น ไม่ใช่เนื้อหา
ใน App Home, โมดัล หรือ Canvas

## ตารางดั้งเดิม

[บล็อก Block Kit `data_table`](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
ปัจจุบันของ Slack แสดงแถวและคอลัมน์ที่มีโครงสร้างในข้อความ OpenClaw แมปบล็อก
`presentation` `table` แบบพกพาที่ระบุชัดเจนไปยัง `data_table` โดยไม่ใช้
[บล็อก `table`](https://docs.slack.dev/reference/block-kit/blocks/table-block/) แบบเดิมของ Slack
ไม่จำเป็นต้องมีขอบเขต OAuth หรือการกำหนดค่า Slack เพิ่มเติม นอกเหนือจาก
สิทธิ์เข้าถึงข้อความ `chat:write` ตามปกติ

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "ไปป์ไลน์ที่เปิดอยู่",
      "headers": ["บัญชี", "ขั้นตอน", "ARR"],
      "rows": [
        ["Acme", "ชนะ", 125000],
        ["Globex", "ตรวจสอบ", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw แมปเซลล์ส่วนหัวและเซลล์สตริงเป็นเซลล์ `raw_text` ของ Slack ส่วนเซลล์ตัวเลข
จะถูกแมปเป็น `raw_number` โดยคงค่าตัวเลขจำกัดไว้เพื่อใช้เรียงลำดับ
และกรองแบบดั้งเดิม เมื่อมี `rowHeaderColumnIndex` ค่านี้จะกำหนดให้คอลัมน์
ที่เริ่มนับจากศูนย์ดังกล่าวเป็นส่วนหัวแถวของ Slack

ระบบจะบังคับใช้ขีดจำกัด `data_table` ที่ Slack เผยแพร่ก่อนเรนเดอร์แบบดั้งเดิม:

- 1-20 คอลัมน์
- แถวข้อมูล 1-100 แถว รวมทั้งแถวส่วนหัว
- ทุกแถวต้องมีจำนวนเซลล์เท่ากัน
- อักขระรวมสูงสุด 10,000 ตัวในเซลล์ตารางทั้งหมดภายในหนึ่งข้อความ

บล็อกตารางที่ถูกต้องหลายบล็อกสามารถเรนเดอร์แบบดั้งเดิมได้ตราบใดที่ข้อความ
ยังอยู่ภายในขีดจำกัดอักขระรวม ตารางที่ไม่สามารถเรนเดอร์ภายใน
กรอบแบบดั้งเดิมได้จะกลายเป็นข้อความแบบกำหนดแน่นอนที่ครบถ้วนแทน เพื่อไม่ให้แถวหรือ
เซลล์สูญหาย หากข้อความดังกล่าวยาวเกินหนึ่งข้อความ Slack การส่งและการตอบกลับคำสั่งเครื่องหมายทับจะใช้
ส่วนข้อความตามลำดับ การแก้ไขตารางจะล้มเหลวพร้อมข้อผิดพลาดด้านขนาดที่ชัดเจน แทนที่จะ
ตัดแถวออกจากข้อความที่มีอยู่โดยไม่แจ้งให้ทราบ

ตารางดั้งเดิมทุกตารางที่สร้างจากการนำเสนอแบบพกพายังมีการแสดงผล
เป็นข้อความระดับบนสุดสำหรับโปรแกรมอ่านหน้าจอ การแจ้งเตือน การสะท้อนเซสชัน และ
ไคลเอ็นต์ที่ไม่สามารถเรนเดอร์บล็อกได้ ค่าดิบของแผนภูมิและตารางจะยังคงเป็น
ค่าตามตัวอักษรในรูปแบบทดแทน ดังนั้นข้อมูลเซลล์ เช่น `<@U123>` จะไม่กลายเป็นการกล่าวถึงใน Slack
หาก Slack ปฏิเสธบล็อกแผนภูมิหรือตารางดั้งเดิมด้วย `invalid_blocks` OpenClaw
จะนำบล็อกข้อมูลดั้งเดิมทั้งหมดออกในการกู้คืนแบบจำกัดเพียงขั้นตอนเดียว เก็บบล็อก
ข้างเคียงที่ถูกต้อง เช่น ปุ่มและตัวเลือก และส่งข้อความแผนภูมิ
และตารางแบบมองเห็นได้อย่างครบถ้วนโดยปิดการจัดรูปแบบของ Slack การส่งคำสั่งเครื่องหมายทับ
จะติดตามงบประมาณ `response_url` จำนวนห้าครั้งของ Slack ตลอดคำสั่ง ก่อนส่งการตอบกลับ
แต่ละชุด ระบบจะเลือกแผนที่ครบถ้วนซึ่งพอดีกับจำนวนครั้งที่เหลือ หรือล้มเหลว
ก่อนโพสต์ชุดนั้น

เฉพาะบล็อกตาราง `presentation` ที่ระบุชัดเจนเท่านั้นที่จะได้รับการยกระดับเป็นตารางดั้งเดิม
ตารางแบบไปป์ของ Markdown จะยังคงเป็นข้อความที่เขียนไว้ OpenClaw จะไม่คาดเดา
โครงสร้างตารางหรือชนิดเซลล์ ผู้สร้างเนื้อหา Slack ดั้งเดิมที่เชื่อถือได้ซึ่งมีอยู่แล้วสามารถ
ส่งบล็อกดิบผ่าน `channelData.slack.blocks` ต่อไปได้ OpenClaw จะสร้างข้อความ
ทดแทนจากเซลล์ `data_table` ดิบที่ถูกต้อง ขณะที่บล็อกกำหนดเองที่ผิดรูปแบบอาจ
ลดระดับเป็นคำบรรยายหรือรูปแบบทดแทนทั่วไปของ Block Kit เอาต์พุตแบบพกพาจากเอเจนต์, CLI
และ Plugin ควรใช้ `presentation`

## การตอบกลับแบบโต้ตอบ

Slack สามารถเรนเดอร์ตัวควบคุมการตอบกลับแบบโต้ตอบที่เอเจนต์สร้างขึ้นได้ แต่ฟีเจอร์นี้ถูกปิดใช้โดยค่าเริ่มต้น
สำหรับเอาต์พุตใหม่จากเอเจนต์, CLI และ Plugin ควรเลือกใช้ปุ่ม
หรือบล็อกตัวเลือก `presentation` ที่ใช้ร่วมกัน โดยใช้เส้นทางการโต้ตอบ
ของ Slack เดียวกันและยังสามารถลดระดับบนช่องอื่นได้

เปิดใช้แบบส่วนกลาง:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

หรือเปิดใช้สำหรับบัญชี Slack เพียงบัญชีเดียว:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

เมื่อเปิดใช้แล้ว เอเจนต์ยังคงสามารถส่งไดเรกทีฟการตอบกลับเฉพาะ Slack ที่เลิกแนะนำแล้วได้:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

ไดเรกทีฟเหล่านี้จะคอมไพล์เป็น Slack Block Kit และกำหนดเส้นทางการคลิกหรือการเลือก
กลับผ่านเส้นทางเหตุการณ์การโต้ตอบของ Slack ที่มีอยู่ ให้เก็บไว้สำหรับ
พรอมต์เก่าและทางออกฉุกเฉินเฉพาะ Slack ส่วนตัวควบคุมแบบพกพาใหม่
ให้ใช้การนำเสนอที่ใช้ร่วมกัน

API คอมไพเลอร์ไดเรกทีฟก็เลิกแนะนำสำหรับโค้ดผู้สร้างใหม่เช่นกัน:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

ใช้เพย์โหลด `presentation` และ `buildSlackPresentationBlocks(...)` สำหรับตัวควบคุมใหม่
ที่เรนเดอร์โดย Slack

หมายเหตุ:

- นี่คือ UI แบบเดิมที่ใช้เฉพาะกับ Slack ช่องทางอื่นจะไม่แปลงไดเรกทีฟ Slack Block
  Kit เป็นระบบปุ่มของตนเอง
- ค่าคอลแบ็กแบบโต้ตอบเป็นโทเค็นทึบแสงที่ OpenClaw สร้างขึ้น ไม่ใช่ค่าดิบที่เอเจนต์เขียน
- หากบล็อกแบบโต้ตอบที่สร้างขึ้นจะเกินขีดจำกัดของ Slack Block Kit OpenClaw จะย้อนกลับไปใช้ข้อความตอบกลับเดิมแทนการส่งเพย์โหลดบล็อกที่ไม่ถูกต้อง

### การส่งโมดัลที่ Plugin เป็นเจ้าของ

Plugin ของ Slack ที่ลงทะเบียนตัวจัดการแบบโต้ตอบยังสามารถรับเหตุการณ์วงจรชีวิต
`view_submission` และ `view_closed` ก่อนที่ OpenClaw จะย่อ
เพย์โหลดสำหรับเหตุการณ์ระบบที่เอเจนต์มองเห็น ใช้รูปแบบการกำหนดเส้นทางอย่างใดอย่างหนึ่งต่อไปนี้
เมื่อเปิดโมดัล Slack:

- ตั้งค่า `callback_id` เป็น `openclaw:<namespace>:<payload>`
- หรือคง `callback_id` ที่มีอยู่ไว้และใส่ `pluginInteractiveData:
"<namespace>:<payload>"` ใน `private_metadata` ของโมดัล

ตัวจัดการจะได้รับ `ctx.interaction.kind` เป็น `view_submission` หรือ
`view_closed`, `inputs` ที่ปรับให้อยู่ในรูปแบบมาตรฐาน และออบเจ็กต์ดิบ `stateValues` แบบเต็มจาก
Slack การกำหนดเส้นทางด้วยรหัสคอลแบ็กเพียงอย่างเดียวก็เพียงพอสำหรับเรียกตัวจัดการของ Plugin; ให้รวม
ฟิลด์การกำหนดเส้นทางผู้ใช้/เซสชัน `private_metadata` ของโมดัลที่มีอยู่ เมื่อ
โมดัลควรสร้างเหตุการณ์ระบบที่เอเจนต์มองเห็นด้วย เอเจนต์จะได้รับ
เหตุการณ์ระบบ `Slack interaction: ...` ที่ย่อและลบข้อมูลละเอียดอ่อนแล้ว หากตัวจัดการส่งคืน
`systemEvent.summary`, `systemEvent.reference` หรือ `systemEvent.data` ฟิลด์เหล่านั้น
จะรวมอยู่ในเหตุการณ์ที่ย่อแล้ว เพื่อให้เอเจนต์อ้างอิง
พื้นที่จัดเก็บที่ Plugin เป็นเจ้าของได้โดยไม่เห็นเพย์โหลดแบบฟอร์มทั้งหมด

## การอนุมัติแบบเนทีฟใน Slack

Slack สามารถทำหน้าที่เป็นไคลเอนต์การอนุมัติแบบเนทีฟด้วยปุ่มและการโต้ตอบ แทนการย้อนกลับไปใช้ Web UI หรือเทอร์มินัล

- การอนุมัติ Exec และ Plugin สามารถแสดงผลเป็นพรอมต์ Block Kit แบบเนทีฟของ Slack
- `channels.slack.execApprovals.*` ยังคงเป็นการกำหนดค่าสำหรับเปิดใช้ไคลเอนต์การอนุมัติ Exec แบบเนทีฟและกำหนดเส้นทาง DM/ช่อง
- DM การอนุมัติ Exec ใช้ `channels.slack.execApprovals.approvers` หรือ `commands.ownerAllowFrom`
- การอนุมัติ Plugin ใช้ปุ่มแบบเนทีฟของ Slack เมื่อเปิดใช้ Slack เป็นไคลเอนต์การอนุมัติแบบเนทีฟสำหรับเซสชันต้นทาง หรือเมื่อ `approvals.plugin` กำหนดเส้นทางไปยังเซสชัน Slack ต้นทางหรือเป้าหมาย Slack
- DM การอนุมัติ Plugin ใช้ผู้อนุมัติ Plugin ของ Slack จาก `channels.slack.allowFrom`, `allowFrom` ของบัญชีที่ระบุชื่อ หรือเส้นทางเริ่มต้นของบัญชี
- ยังคงบังคับใช้การให้สิทธิ์ผู้อนุมัติ: ผู้อนุมัติที่อนุมัติได้เฉพาะ Exec จะไม่สามารถอนุมัติคำขอ Plugin เว้นแต่จะเป็นผู้อนุมัติ Plugin ด้วย

ส่วนนี้ใช้พื้นผิวปุ่มอนุมัติที่ใช้ร่วมกันแบบเดียวกับช่องทางอื่น เมื่อเปิดใช้ `interactivity` ในการตั้งค่าแอป Slack ของคุณ พรอมต์การอนุมัติจะแสดงเป็นปุ่ม Block Kit โดยตรงในการสนทนา
เมื่อมีปุ่มเหล่านั้น ปุ่มดังกล่าวคือ UX หลักสำหรับการอนุมัติ; OpenClaw
ควรใส่คำสั่ง `/approve` แบบดำเนินการเองเฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่า
ไม่สามารถอนุมัติผ่านแชตได้ หรือการอนุมัติแบบดำเนินการเองเป็นวิธีเดียว

พาธการกำหนดค่า:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (ไม่บังคับ; ย้อนกลับไปใช้ `commands.ownerAllowFrom` เมื่อทำได้)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `agentFilter`, `sessionFilter`

Slack จะเปิดใช้การอนุมัติ Exec แบบเนทีฟโดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และสามารถระบุ
ผู้อนุมัติ Exec ได้อย่างน้อยหนึ่งราย นอกจากนี้ Slack ยังสามารถจัดการการอนุมัติ Plugin แบบเนทีฟผ่านพาธไคลเอนต์แบบเนทีฟนี้
เมื่อสามารถระบุผู้อนุมัติ Plugin ของ Slack ได้และคำขอตรงกับตัวกรองของไคลเอนต์แบบเนทีฟ ตั้งค่า
`enabled: false` เพื่อปิดใช้ Slack ในฐานะไคลเอนต์การอนุมัติแบบเนทีฟอย่างชัดเจน ตั้งค่า `enabled: true` เพื่อ
บังคับเปิดการอนุมัติแบบเนทีฟเมื่อสามารถระบุผู้อนุมัติได้ การปิดใช้การอนุมัติ Exec ของ Slack ไม่ได้ปิด
การส่งการอนุมัติ Plugin แบบเนทีฟของ Slack ที่เปิดใช้ผ่าน `approvals.plugin`; การส่งการอนุมัติ Plugin
จะใช้ผู้อนุมัติ Plugin ของ Slack แทน

พฤติกรรมเริ่มต้นเมื่อไม่มีการกำหนดค่าการอนุมัติ Exec ของ Slack อย่างชัดเจน:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

จำเป็นต้องกำหนดค่าแบบเนทีฟของ Slack อย่างชัดเจนเฉพาะเมื่อต้องการแทนที่ผู้อนุมัติ เพิ่มตัวกรอง หรือ
เลือกรับการส่งไปยังแชตต้นทาง:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

การส่งต่อ `approvals.exec` ที่ใช้ร่วมกันเป็นคนละส่วน ใช้เฉพาะเมื่อพรอมต์การอนุมัติ Exec ต้อง
กำหนดเส้นทางไปยังแชตอื่นหรือเป้าหมายนอกแบนด์ที่ระบุอย่างชัดเจนด้วย การส่งต่อ `approvals.plugin` ที่ใช้ร่วมกันก็เป็น
คนละส่วนเช่นกัน; การส่งแบบเนทีฟของ Slack จะระงับกลไกสำรองนั้นเฉพาะเมื่อ Slack สามารถจัดการคำขอ
อนุมัติ Plugin แบบเนทีฟได้

`/approve` ในแชตเดียวกันยังใช้งานได้ในช่องและ DM ของ Slack ที่รองรับคำสั่งอยู่แล้ว ดูโมเดลการส่งต่อการอนุมัติฉบับเต็มได้ที่ [การอนุมัติ Exec](/th/tools/exec-approvals)

## เหตุการณ์และพฤติกรรมการทำงาน

- การแก้ไข/ลบข้อความจะถูกแมปเป็นเหตุการณ์ระบบ
- การกระจายเธรด (การตอบกลับเธรดแบบ "Also send to channel") จะได้รับการประมวลผลเป็นข้อความผู้ใช้ตามปกติ
- เหตุการณ์เพิ่ม/ลบรีแอ็กชันจะถูกแมปเป็นเหตุการณ์ระบบ
- เหตุการณ์สมาชิกเข้าร่วม/ออก ช่องถูกสร้าง/เปลี่ยนชื่อ และเพิ่ม/ลบหมุด จะถูกแมปเป็นเหตุการณ์ระบบ
- การโพลสถานะแบบไม่บังคับสามารถแมปการเปลี่ยนจาก `away` เป็น `active` ของผู้เข้าร่วมที่เป็นมนุษย์ซึ่งตรวจพบ ไปยังเซสชัน Slack ที่เข้าเกณฑ์และใช้งานล่าสุดของผู้เข้าร่วมนั้น ค่าเริ่มต้นคือปิด
- `channel_id_changed` สามารถย้ายคีย์การกำหนดค่าช่องเมื่อเปิดใช้ `configWrites`
- ข้อมูลเมตาหัวข้อ/วัตถุประสงค์ของช่องจะถือเป็นบริบทที่ไม่น่าเชื่อถือและสามารถแทรกลงในบริบทการกำหนดเส้นทางได้
- ข้อมูลเริ่มต้นของเธรดและการเตรียมบริบทประวัติเธรดช่วงแรกจะถูกกรองตามรายการอนุญาตของผู้ส่งที่กำหนดค่าไว้เมื่อเกี่ยวข้อง
- การดำเนินการกับบล็อก ทางลัด และการโต้ตอบกับโมดัล จะปล่อยเหตุการณ์ระบบ `Slack interaction: ...` แบบมีโครงสร้างพร้อมฟิลด์เพย์โหลดที่ครบถ้วน:
  - การดำเนินการกับบล็อก: ค่าที่เลือก ป้ายกำกับ ค่าตัวเลือก และข้อมูลเมตา `workflow_*`
  - ทางลัดส่วนกลาง: ข้อมูลเมตาคอลแบ็กและผู้กระทำ โดยกำหนดเส้นทางไปยังเซสชันโดยตรงของผู้กระทำ
  - ทางลัดข้อความ: บริบทคอลแบ็ก ผู้กระทำ ช่อง เธรด และข้อความที่เลือก
  - เหตุการณ์โมดัล `view_submission` และ `view_closed` พร้อมข้อมูลเมตาช่องที่กำหนดเส้นทางแล้วและอินพุตแบบฟอร์ม

กำหนดทางลัดส่วนกลางหรือทางลัดข้อความในการกำหนดค่าแอป Slack และใช้รหัสคอลแบ็กใดก็ได้ที่ไม่ว่าง OpenClaw จะตอบรับเพย์โหลดทางลัดที่ตรงกัน ใช้นโยบายผู้ส่งสำหรับ DM/ช่องแบบเดียวกับการโต้ตอบอื่นของ Slack และจัดคิวเหตุการณ์ที่ผ่านการล้างข้อมูลแล้วไปยังเซสชันเอเจนต์ที่กำหนดเส้นทางไว้ รหัสทริกเกอร์และ URL การตอบกลับจะถูกลบออกจากบริบทของเอเจนต์

### เหตุการณ์สถานะ

Slack ไม่ส่งการเปลี่ยนแปลงสถานะผ่าน Events API หรือ Socket Mode แต่ OpenClaw สามารถโพล [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/) สำหรับผู้เข้าร่วมที่เป็นมนุษย์ซึ่งข้อความผ่านการตรวจสอบการเข้าถึงและการกำหนดเส้นทางตามปกติของ Slack

```json5
{
  channels: {
    slack: {
      presenceEvents: { mode: "auto" },
      channels: {
        C0123456789: { presenceEvents: { mode: "on" } },
        C0987654321: { presenceEvents: { mode: "off" } },
      },
    },
  },
}
```

- `off` (ค่าเริ่มต้น): ไม่มีตัวจับเวลาสถานะหรือการเรียก Slack API
- `auto`: เฝ้าติดตาม DM, MPIM และเธรด Slack ที่ใช้งานในช่วง 24 ชั่วโมงที่ผ่านมา โดยมีผู้เข้าร่วมที่เป็นมนุษย์ที่ตรวจพบไม่เกิน 8 คน ไม่รวมเซสชันช่องระดับบนสุด
- `on`: เฝ้าติดตามการสนทนาเดียวกันโดยไม่จำกัดจำนวนผู้เข้าร่วมและรวมเซสชันช่องระดับบนสุด ใช้การแทนที่รายช่องเพื่อบังคับหรือระงับช่องใดช่องหนึ่ง

OpenClaw โพลผู้ใช้ที่ไม่ซ้ำกันสูงสุด 45 รายต่อนาทีต่อบัญชี Slack เตรียมผลลัพธ์แรกโดยไม่ปลุกเอเจนต์ และปลุกเฉพาะเมื่อพบการเปลี่ยนจาก `away` เป็น `active` เท่านั้น มีช่วงพัก 8 ชั่วโมงแบบถาวรต่อบัญชี Slack และผู้ใช้ แม้ว่าบุคคลนั้นจะเข้าร่วมหลายเธรด เหตุการณ์จะกำหนดเส้นทางไปยังการสนทนาที่เข้าเกณฑ์และใช้งานล่าสุดของบุคคลนั้นเท่านั้น และบอกให้เอเจนต์ตรวจสอบหน่วยความจำ/วิกิและบริบทเขตเวลาที่ทราบ ก่อนตัดสินใจว่าจะส่งคำทักทายสั้น ๆ หนึ่งข้อความหรือไม่ เอเจนต์อาจไม่ตอบ

โทเค็นบอตต้องมี `users:read` ซึ่งรวมอยู่ในแมนิเฟสต์ที่แนะนำแล้ว เหตุการณ์สถานะไม่พร้อมใช้งานสำหรับการติดตั้งทั่วทั้งองค์กร Enterprise Grid

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Slack](/th/gateway/config-channels#slack)

<Accordion title="ฟิลด์ Slack ที่ให้สัญญาณสำคัญ">

- โหมด/การยืนยันตัวตน: `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- การเข้าถึง DM: `dm.enabled`, `dmPolicy`, `allowFrom` (แบบเดิม: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- สวิตช์ความเข้ากันได้: `dangerouslyAllowNameMatching` (ใช้ในกรณีฉุกเฉิน; ปิดไว้เว้นแต่จำเป็น)
- การเข้าถึงช่อง: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- เธรด/ประวัติ: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การปลุกด้วยสถานะ: `presenceEvents.mode`, `channels.*.presenceEvents.mode` (`off|auto|on`; ค่าเริ่มต้น `off`)
- การส่ง: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- การแสดงตัวอย่าง: `unfurlLinks` (ค่าเริ่มต้น: `false`), `unfurlMedia` สำหรับควบคุมการแสดงตัวอย่างลิงก์/สื่อของ `chat.postMessage`; ตั้งค่า `unfurlLinks: true` เพื่อกลับมาเปิดใช้การแสดงตัวอย่างลิงก์
- การทำงาน/คุณลักษณะ: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับในช่อง">
    ตรวจสอบตามลำดับ:

    - `groupPolicy`
    - รายการอนุญาตของช่อง (`channels.slack.channels`) — **คีย์ต้องเป็นรหัสช่อง** (`C12345678`) ไม่ใช่ชื่อ (`#channel-name`) คีย์ที่อิงชื่อจะล้มเหลวโดยไม่มีข้อความแจ้งภายใต้ `groupPolicy: "allowlist"` เนื่องจากค่าเริ่มต้นของการกำหนดเส้นทางช่องจะใช้รหัสก่อน วิธีค้นหารหัส: คลิกขวาที่ช่องใน Slack → **Copy link** — ค่า `C...` ที่ท้าย URL คือรหัสช่อง
    - `requireMention`
    - รายการอนุญาต `users` รายช่อง
    - `messages.groupChat.visibleReplies`: คำขอกลุ่ม/ช่องตามปกติมีค่าเริ่มต้นเป็น `"automatic"` หากคุณเลือกรับ `"message_tool"` และบันทึกแสดงข้อความของผู้ช่วยโดยไม่มีการเรียก `message(action=send)` แสดงว่าโมเดลพลาดพาธเครื่องมือข้อความที่มองเห็นได้ ข้อความสุดท้ายจะยังคงเป็นส่วนตัวในโหมดนี้; ตรวจสอบบันทึกแบบละเอียดของ Gateway เพื่อดูข้อมูลเมตาเพย์โหลดที่ถูกระงับ หรือตั้งค่าเป็น `"automatic"` หากต้องการให้ทุกข้อความตอบกลับสุดท้ายตามปกติของผู้ช่วยถูกโพสต์ผ่านพาธแบบเดิม
    - `messages.groupChat.unmentionedInbound`: หากเป็น `"room_event"` การสนทนาในช่องที่อนุญาตซึ่งไม่ได้กล่าวถึงโดยตรงจะเป็นบริบทรอบข้างและจะไม่ตอบ เว้นแต่เอเจนต์จะเรียกเครื่องมือ `message` ดู [เหตุการณ์ห้องรอบข้าง](/th/channels/ambient-room-events)

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    คำสั่งที่มีประโยชน์:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="ข้อความ DM ถูกละเว้น">
    ตรวจสอบ:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (หรือแบบเดิม `channels.slack.dm.policy`)
    - การอนุมัติการจับคู่ / รายการในรายการอนุญาต (`dmPolicy: "open"` ยังคงต้องใช้ `channels.slack.allowFrom: ["*"]`)
    - DM แบบกลุ่มใช้การจัดการ MPIM; เปิดใช้ `channels.slack.dm.groupEnabled` และหากกำหนดค่าไว้ ให้รวม MPIM ไว้ใน `channels.slack.dm.groupChannels`
    - เหตุการณ์ DM ของ Slack Assistant: บันทึกแบบละเอียดที่กล่าวถึง `drop message_changed`
      มักหมายความว่า Slack ส่งเหตุการณ์เธรด Assistant ที่มีการแก้ไขมาโดยไม่มี
      ผู้ส่งที่เป็นมนุษย์ซึ่งสามารถกู้คืนได้ในข้อมูลเมตาของข้อความ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="โหมด Socket เชื่อมต่อไม่ได้">
    ตรวจสอบโทเค็นบอตและแอป รวมถึงการเปิดใช้ Socket Mode ในการตั้งค่าแอป Slack
    App-Level Token ต้องมี `connections:write` และโทเค็นบอต Bot User OAuth Token
    ต้องเป็นของแอป/เวิร์กสเปซ Slack เดียวกันกับโทเค็นแอป

    หาก `openclaw channels status --probe --json` แสดง `botTokenStatus` หรือ
    `appTokenStatus: "configured_unavailable"` หมายความว่าบัญชี Slack
    ได้รับการกำหนดค่าแล้ว แต่รันไทม์ปัจจุบันไม่สามารถแก้ไขค่าที่อ้างอิงผ่าน SecretRef
    ได้

    บันทึกอย่างเช่น `slack socket mode failed to start; retry ...` เป็นความล้มเหลว
    ในการเริ่มต้นที่กู้คืนได้ ส่วนขอบเขตสิทธิ์ที่ขาดหาย โทเค็นที่ถูกเพิกถอน และการยืนยันตัวตนที่ไม่ถูกต้อง
    จะล้มเหลวทันที บันทึก `slack token mismatch ...` หมายความว่าโทเค็นบอตและโทเค็นแอป
    ดูเหมือนจะเป็นของแอป Slack คนละแอป ให้แก้ไขข้อมูลประจำตัวของแอป Slack

  </Accordion>

  <Accordion title="โหมด HTTP ไม่ได้รับเหตุการณ์">
    ตรวจสอบ:

    - ข้อมูลลับสำหรับการลงนาม
    - พาธ Webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - `webhookPath` ที่ไม่ซ้ำกันสำหรับแต่ละบัญชี HTTP
    - URL สาธารณะยุติการเชื่อมต่อ TLS และส่งต่อคำขอไปยังพาธของ Gateway
    - พาธ `request_url` ของแอป Slack ตรงกับ `channels.slack.webhookPath` ทุกประการ (ค่าเริ่มต้น `/slack/events`)

    หาก `signingSecretStatus: "configured_unavailable"` ปรากฏในสแนปช็อตของบัญชี
    หมายความว่าบัญชี HTTP ได้รับการกำหนดค่าแล้ว แต่รันไทม์ปัจจุบันไม่สามารถ
    แก้ไขข้อมูลลับสำหรับการลงนามที่อ้างอิงผ่าน SecretRef ได้

    บันทึก `slack: webhook path ... already registered` ที่ปรากฏซ้ำหมายความว่าบัญชี HTTP สองบัญชี
    กำลังใช้ `webhookPath` เดียวกัน ให้กำหนดพาธที่แตกต่างกันแก่แต่ละบัญชี

  </Accordion>

  <Accordion title="คำสั่งเนทีฟ/คำสั่งแบบสแลชไม่ทำงาน">
    ตรวจสอบว่าต้องการใช้แบบใด:

    - โหมดคำสั่งเนทีฟ (`channels.slack.commands.native: true`) โดยมีคำสั่งแบบสแลชที่ตรงกันลงทะเบียนไว้ใน Slack
    - หรือโหมดคำสั่งแบบสแลชเดียว (`channels.slack.slashCommand.enabled: true`)

    Slack ไม่สร้างหรือลบคำสั่งแบบสแลชโดยอัตโนมัติ `commands.native: "auto"` ไม่ได้เปิดใช้คำสั่งเนทีฟของ Slack; ให้ใช้ `true` และสร้างคำสั่งที่ตรงกันในแอป Slack ในโหมด HTTP คำสั่งแบบสแลชของ Slack ทุกคำสั่งต้องมี URL ของ Gateway ใน Socket Mode เพย์โหลดของคำสั่งจะมาถึงผ่าน WebSocket และ Slack จะละเว้น `slash_commands[].url`

    ตรวจสอบ `commands.useAccessGroups`, การอนุญาต DM, รายการอนุญาตของช่อง
    และรายการอนุญาต `users` ของแต่ละช่องด้วย Slack ส่งคืนข้อผิดพลาดแบบชั่วคราวสำหรับ
    ผู้ส่งคำสั่งแบบสแลชที่ถูกบล็อก รวมถึง:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิงสื่อแนบ

Slack สามารถแนบสื่อที่ดาวน์โหลดแล้วเข้ากับรอบการทำงานของเอเจนต์ได้ เมื่อดาวน์โหลดไฟล์จาก Slack สำเร็จและขนาดไม่เกินขีดจำกัด คลิปเสียงสามารถถอดเสียงได้ ไฟล์ภาพสามารถส่งผ่านเส้นทางการทำความเข้าใจสื่อหรือส่งตรงไปยังโมเดลตอบกลับที่รองรับการมองเห็น และไฟล์อื่นๆ ยังคงพร้อมใช้งานเป็นบริบทไฟล์ที่ดาวน์โหลดได้

### ประเภทสื่อที่รองรับ

| ประเภทสื่อ                     | แหล่งที่มา               | พฤติกรรมปัจจุบัน                                                                  | หมายเหตุ                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| คลิปเสียง Slack              | URL ไฟล์ Slack       | ดาวน์โหลดและส่งผ่านการถอดเสียงร่วม                          | ต้องใช้ `files:read` และโมเดลหรือ CLI ของ `tools.media.audio` ที่ใช้งานได้      |
| ภาพ JPEG / PNG / GIF / WebP | URL ไฟล์ Slack       | ดาวน์โหลดและแนบกับรอบการทำงานเพื่อให้ระบบที่รองรับการมองเห็นประมวลผล                   | ขีดจำกัดต่อไฟล์: `channels.slack.mediaMaxMb` (ค่าเริ่มต้น 20 MB)                 |
| ไฟล์ PDF                      | URL ไฟล์ Slack       | ดาวน์โหลดและเปิดให้ใช้เป็นบริบทไฟล์สำหรับเครื่องมือ เช่น `download-file` หรือ `pdf` | ข้อมูลขาเข้าจาก Slack จะไม่แปลง PDF เป็นอินพุตภาพสำหรับการมองเห็นโดยอัตโนมัติ |
| ไฟล์อื่นๆ                    | URL ไฟล์ Slack       | ดาวน์โหลดเมื่อทำได้และเปิดให้ใช้เป็นบริบทไฟล์                              | ไฟล์ไบนารีจะไม่ถูกปฏิบัติเป็นอินพุตภาพ                               |
| การตอบกลับในเธรด                 | ไฟล์ของข้อความเริ่มต้นเธรด | สามารถโหลดไฟล์ของข้อความรากเป็นบริบทได้เมื่อการตอบกลับไม่มีสื่อโดยตรง  | ข้อความเริ่มต้นที่มีเฉพาะไฟล์จะใช้ตัวยึดตำแหน่งไฟล์แนบ                          |
| ข้อความที่มีหลายไฟล์            | ไฟล์ Slack หลายไฟล์ | ประเมินแต่ละไฟล์แยกกัน                                              | การประมวลผลของ Slack จำกัดไว้ที่แปดไฟล์ต่อข้อความ                     |

### ไปป์ไลน์ขาเข้า

เมื่อมีข้อความ Slack พร้อมไฟล์แนบเข้ามา:

1. OpenClaw ดาวน์โหลดไฟล์จาก URL ส่วนตัวของ Slack โดยใช้โทเค็นบอต
2. เมื่อสำเร็จ ไฟล์จะถูกเขียนลงในที่เก็บสื่อ
3. พาธและชนิดเนื้อหาของสื่อที่ดาวน์โหลดจะถูกเพิ่มลงในบริบทขาเข้า
4. คลิปเสียงจะถูกส่งไปยังไปป์ไลน์การถอดเสียงร่วม ส่วนเส้นทางของโมเดล/เครื่องมือที่รองรับภาพสามารถใช้ไฟล์แนบภาพจากบริบทเดียวกันได้
5. ไฟล์อื่นๆ ยังคงพร้อมใช้งานเป็นข้อมูลเมตาของไฟล์หรือข้อมูลอ้างอิงสื่อสำหรับเครื่องมือที่รองรับ

### การสืบทอดไฟล์แนบจากข้อความรากของเธรด

เมื่อข้อความเข้ามาในเธรด (มีพาเรนต์ `thread_ts`):

- หากตัวข้อความตอบกลับไม่มีสื่อโดยตรงและข้อความรากที่รวมมามีไฟล์ Slack สามารถโหลดไฟล์รากเป็นบริบทของข้อความเริ่มต้นเธรดได้
- ไฟล์รากจะถูกโหลดเฉพาะขณะเริ่มต้นเซสชันเธรดใหม่หรือรีเซ็ตเซสชัน การตอบกลับที่มีเฉพาะข้อความในภายหลังจะใช้บริบทเซสชันเดิมซ้ำ และจะไม่แนบไฟล์รากซ้ำในฐานะสื่อใหม่
- ไฟล์แนบโดยตรงของข้อความตอบกลับมีลำดับความสำคัญเหนือไฟล์แนบของข้อความราก
- ข้อความรากที่มีเฉพาะไฟล์และไม่มีข้อความจะแสดงด้วยตัวยึดตำแหน่งไฟล์แนบ เพื่อให้กลไกสำรองยังคงรวมไฟล์ของข้อความนั้นได้

### การจัดการไฟล์แนบหลายรายการ

เมื่อข้อความ Slack เดียวมีไฟล์แนบหลายรายการ:

- ไฟล์แนบแต่ละรายการจะถูกประมวลผลแยกกันผ่านไปป์ไลน์สื่อ
- ข้อมูลอ้างอิงสื่อที่ดาวน์โหลดจะถูกรวมไว้ในบริบทของข้อความ
- ลำดับการประมวลผลเป็นไปตามลำดับไฟล์ของ Slack ในเพย์โหลดเหตุการณ์
- ความล้มเหลวในการดาวน์โหลดไฟล์แนบหนึ่งรายการจะไม่ขัดขวางรายการอื่น

### ขีดจำกัดด้านขนาด การดาวน์โหลด และโมเดล

- **ขีดจำกัดขนาด**: ค่าเริ่มต้น 20 MB ต่อไฟล์ กำหนดค่าได้ผ่าน `channels.slack.mediaMaxMb`
- **ขีดจำกัดการถอดเสียง**: `tools.media.audio.maxBytes` มีผลเช่นกันเมื่อส่งไฟล์ที่ดาวน์โหลดไปยังผู้ให้บริการถอดเสียงหรือ CLI
- **การดาวน์โหลดล้มเหลว**: ไฟล์ที่ Slack ไม่สามารถให้บริการ, URL ที่หมดอายุ, ไฟล์ที่เข้าถึงไม่ได้, ไฟล์ที่มีขนาดเกินกำหนด และการตอบกลับ HTML สำหรับการยืนยันตัวตน/เข้าสู่ระบบ Slack จะถูกข้ามแทนที่จะรายงานว่าเป็นรูปแบบที่ไม่รองรับ
- **โมเดลการมองเห็น**: การวิเคราะห์ภาพใช้โมเดลตอบกลับที่ทำงานอยู่เมื่อโมเดลนั้นรองรับการมองเห็น หรือใช้โมเดลภาพที่กำหนดค่าไว้ที่ `agents.defaults.imageModel`

### ข้อจำกัดที่ทราบ

| สถานการณ์                                      | พฤติกรรมปัจจุบัน                                                                   | วิธีแก้ชั่วคราว                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| URL ไฟล์ Slack หมดอายุ                        | ข้ามไฟล์โดยไม่แสดงข้อผิดพลาด                                                       | อัปโหลดไฟล์ซ้ำใน Slack                                                   |
| ไม่สามารถถอดเสียงได้               | คลิปยังคงแนบอยู่แต่ไม่มีการสร้างข้อความถอดเสียง                                | กำหนดค่า `tools.media.audio` หรือติดตั้ง CLI สำหรับการถอดเสียงในเครื่องที่รองรับ  |
| คลิปที่ไม่มีคำบรรยายไม่ผ่านเกตการกล่าวถึง | ถูกทิ้งหลังการถอดเสียงคาดการณ์แบบส่วนตัว โดยทิ้งทั้งข้อความถอดเสียงและไฟล์ดาวน์โหลด | กำหนดรูปแบบการกล่าวถึงชื่อด้วยเสียง เพิ่มการกล่าวถึงบอตด้วยข้อความ หรือใช้ DM |
| ไม่ได้กำหนดค่าโมเดลการมองเห็น                   | ไฟล์แนบภาพถูกเก็บเป็นข้อมูลอ้างอิงสื่อ แต่ไม่ได้รับการวิเคราะห์เป็นภาพ       | กำหนดค่า `agents.defaults.imageModel` หรือใช้โมเดลตอบกลับที่รองรับการมองเห็น    |
| ภาพขนาดใหญ่มาก (> 20 MB ตามค่าเริ่มต้น)        | ข้ามตามขีดจำกัดขนาด                                                               | เพิ่ม `channels.slack.mediaMaxMb` หาก Slack อนุญาต                          |
| ไฟล์แนบที่ส่งต่อ/แชร์                  | ข้อความและสื่อภาพ/ไฟล์ที่โฮสต์โดย Slack ทำงานแบบพยายามให้ดีที่สุด                             | แชร์โดยตรงอีกครั้งในเธรด OpenClaw                                      |
| ไฟล์แนบ PDF                               | เก็บเป็นบริบทไฟล์/สื่อ โดยไม่ส่งผ่านการมองเห็นภาพโดยอัตโนมัติ        | ใช้ `download-file` สำหรับข้อมูลเมตาของไฟล์หรือเครื่องมือ `pdf` สำหรับการวิเคราะห์ PDF      |

### เอกสารที่เกี่ยวข้อง

- [ไปป์ไลน์การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
- [เสียงและบันทึกเสียง](/th/nodes/audio)
- [เครื่องมือ PDF](/th/tools/pdf)

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Slack กับ Gateway
  </Card>
  <Card title="กลุ่ม" icon="users" href="/th/channels/groups">
    พฤติกรรมของช่องและ DM แบบกลุ่ม
  </Card>
  <Card title="การกำหนดเส้นทางช่อง" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    แบบจำลองภัยคุกคามและการเสริมความปลอดภัย
  </Card>
  <Card title="การกำหนดค่า" icon="sliders" href="/th/gateway/configuration">
    โครงสร้างและลำดับความสำคัญของการกำหนดค่า
  </Card>
  <Card title="คำสั่งแบบสแลช" icon="terminal" href="/th/tools/slash-commands">
    แค็ตตาล็อกและพฤติกรรมของคำสั่ง
  </Card>
</CardGroup>
