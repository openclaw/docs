---
read_when:
    - การตั้งค่า Slack หรือการแก้ไขข้อบกพร่องของโหมดซ็อกเก็ต HTTP หรือรีเลย์ของ Slack
summary: การตั้งค่า Slack และลักษณะการทำงานขณะรันไทม์ (Socket Mode, HTTP Request URLs และโหมดรีเลย์)
title: Slack
x-i18n:
    generated_at: "2026-07-19T18:12:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99fa9375bba29f3f333bc626b58db945c2f2bcd8b7f8c3365fabd3089415adc2
    source_path: channels/slack.md
    workflow: 16
---

Slack รองรับ DM และช่องผ่านการผสานรวมแอป Slack การรับส่งเริ่มต้นคือ Socket Mode และยังรองรับ HTTP Request URLs ด้วย โหมดรีเลย์มีไว้สำหรับการติดตั้งใช้งานแบบมีการจัดการ ซึ่งเราเตอร์ที่เชื่อถือได้เป็นผู้ดูแลทราฟฟิกขาเข้าจาก Slack

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    DM ของ Slack ใช้โหมดการจับคู่เป็นค่าเริ่มต้น
  </Card>
  <Card title="คำสั่ง Slash" icon="terminal" href="/th/tools/slash-commands">
    ลักษณะการทำงานของคำสั่งเนทีฟและแค็ตตาล็อกคำสั่ง
  </Card>
  <Card title="การแก้ปัญหาช่อง" icon="wrench" href="/th/channels/troubleshooting">
    แนวทางวินิจฉัยและคู่มือการแก้ไขปัญหาข้ามช่อง
  </Card>
</CardGroup>

## การเลือกวิธีรับส่ง

Socket Mode และ HTTP Request URLs มีความสามารถเทียบเท่ากันสำหรับการส่งข้อความ คำสั่ง Slash, App Home และการโต้ตอบ ให้เลือกตามรูปแบบการติดตั้งใช้งาน ไม่ใช่ตามฟีเจอร์

| ประเด็น                      | Socket Mode (ค่าเริ่มต้น)                                                                                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL สาธารณะของ Gateway           | ไม่จำเป็น                                                                                                                                         | จำเป็น (DNS, TLS, reverse proxy หรือ tunnel)                                                                   |
| เครือข่ายขาออก             | ต้องเข้าถึง WSS ขาออกไปยัง `wss-primary.slack.com` ได้                                                                                            | ไม่มี WS ขาออก ใช้เฉพาะ HTTPS ขาเข้า                                                                             |
| โทเค็นที่จำเป็น                | ข้อมูลประจำตัวบอต: bot token + App-Level Token ที่มี `connections:write`; ข้อมูลประจำตัวผู้ใช้: user token + App-Level Token                                      | ข้อมูลประจำตัวบอต: bot token + Signing Secret; ข้อมูลประจำตัวผู้ใช้: user token + Signing Secret                           |
| แล็ปท็อปสำหรับพัฒนา / อยู่หลังไฟร์วอลล์ | ใช้งานได้ทันที                                                                                                                                          | ต้องมี tunnel สาธารณะ (ngrok, Cloudflare Tunnel, Tailscale Funnel) หรือ Gateway สำหรับ staging                          |
| การปรับขนาดแนวนอน           | หนึ่งเซสชัน Socket Mode ต่อแอปต่อโฮสต์; Gateway หลายตัวต้องใช้แอป Slack แยกกัน                                                                 | ตัวจัดการ POST แบบไร้สถานะ; สำเนา Gateway หลายตัวสามารถใช้แอปเดียวกันร่วมกันหลัง load balancer                     |
| หลายบัญชีบน Gateway เดียว | รองรับ แต่ละบัญชีจะเปิด WS ของตนเอง                                                                                                             | รองรับ แต่ละบัญชีต้องมี `webhookPath` ที่ไม่ซ้ำกัน (ค่าเริ่มต้น `/slack/events`) เพื่อไม่ให้การลงทะเบียนชนกัน |
| การรับส่งคำสั่ง Slash      | ส่งผ่านการเชื่อมต่อ WS; `slash_commands[].url` จะถูกละเว้น                                                                                  | Slack ส่ง POST ไปยัง `slash_commands[].url`; ต้องระบุฟิลด์นี้เพื่อให้ส่งต่อคำสั่งได้                           |
| การลงนามคำขอ              | ไม่ใช้ (การตรวจสอบสิทธิ์ใช้ App-Level Token)                                                                                                               | Slack ลงนามทุกคำขอ; OpenClaw ตรวจสอบด้วย `signingSecret`                                              |
| การกู้คืนเมื่อการเชื่อมต่อหลุด  | เปิดใช้การเชื่อมต่อใหม่อัตโนมัติของ Slack SDK; OpenClaw จะรีสตาร์ตเซสชัน Socket Mode ที่ล้มเหลวด้วยการหน่วงถอยหลังแบบมีขอบเขตด้วย การปรับแต่งการรับส่งสำหรับการหมดเวลา Pong มีผล | ไม่มีการเชื่อมต่อถาวรให้หลุด; Slack จะลองใหม่เป็นรายคำขอ                                           |

<Note>
  **เลือก Socket Mode** สำหรับโฮสต์ที่มี Gateway เดียว แล็ปท็อปสำหรับพัฒนา และเครือข่ายภายในองค์กรที่เข้าถึง `*.slack.com` แบบขาออกได้ แต่ไม่สามารถรับ HTTPS ขาเข้าได้

**เลือก HTTP Request URLs** เมื่อเรียกใช้สำเนา Gateway หลายตัวหลัง load balancer เมื่อ WSS ขาออกถูกบล็อกแต่อนุญาต HTTPS ขาเข้า หรือเมื่อมีการสิ้นสุด Slack webhooks ที่ reverse proxy อยู่แล้ว
</Note>

<Warning>
  Slack สามารถรักษาการเชื่อมต่อ Socket Mode หลายรายการสำหรับแอปเดียว และอาจส่งแต่ละเพย์โหลดไปยังการเชื่อมต่อใดก็ได้ ดังนั้น Gateway ของ OpenClaw ที่แยกจากกันแต่ใช้แอป Slack ร่วมกัน จึงต้องมีการกำหนดค่าการกำหนดเส้นทางและการอนุญาตที่เทียบเท่ากัน มิฉะนั้น ให้ใช้แอป Slack แยกสำหรับแต่ละ Gateway, จุดรับเข้ารีเลย์เดียว หรือ HTTP Request URLs หลัง load balancer ดู [การใช้ Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections)
</Warning>

### โหมดรีเลย์

โหมดรีเลย์แยกทราฟฟิกขาเข้าจาก Slack ออกจาก Gateway ของ OpenClaw เราเตอร์ที่เชื่อถือได้เป็นผู้ดูแลการเชื่อมต่อ Slack Socket Mode เพียงรายการเดียว เลือก Gateway ปลายทาง และส่งต่อเหตุการณ์แบบมีชนิดผ่าน websocket ที่ผ่านการตรวจสอบสิทธิ์ Gateway ยังคงใช้ bot token ของตนเองสำหรับการเรียก Slack Web API ขาออก

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

URL รีเลย์ต้องใช้ `wss://` เว้นแต่จะชี้ไปยัง localhost ให้ถือว่า bearer token และตารางเส้นทางของเราเตอร์เป็นส่วนหนึ่งของขอบเขตการอนุญาตของ Slack: เหตุการณ์ที่กำหนดเส้นทางแล้วจะเข้าสู่ตัวจัดการข้อความ Slack ปกติในฐานะการเรียกใช้งานที่ได้รับอนุญาต `slack_identity` ที่เราเตอร์ส่งมาในเฟรม `hello` ของ websocket สามารถกำหนดชื่อผู้ใช้และไอคอนขาออกเริ่มต้นได้ แต่ข้อมูลประจำตัวที่ผู้เรียกระบุอย่างชัดเจนยังคงมีลำดับความสำคัญสูงกว่า การเชื่อมต่อรีเลย์จะเชื่อมต่อใหม่ด้วยจังหวะการหน่วงถอยหลังแบบมีขอบเขตเช่นเดียวกับ Socket Mode และล้างข้อมูลประจำตัวที่เราเตอร์ส่งมาเมื่อใดก็ตามที่ตัดการเชื่อมต่อ

### การติดตั้งทั่วทั้งองค์กร Enterprise Grid

บัญชี Slack หนึ่งบัญชีสามารถรับข้อความจากทุก workspace ที่ครอบคลุมโดยการติดตั้งทั่วทั้งองค์กร Enterprise Grid ได้ เลือก Socket Mode โดยตรงหรือ HTTP Request URLs; โหมดรีเลย์ไม่รองรับบัญชีองค์กร ไฟล์ manifest แบบสิทธิ์ขั้นต่ำทั้งสองรายการด้านล่างเปิดใช้เฉพาะเส้นทางเหตุการณ์ V1 `message` และ `app_mention` การตอบกลับทันที และรีแอ็กชันสถานะที่ listener เป็นผู้ดูแล

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

ให้ Enterprise Grid Org Admin หรือ Org Owner อนุมัติแอป ติดตั้งในระดับองค์กร และเลือก workspace ที่การติดตั้งครอบคลุม ยืนยันว่าแอปพร้อมใช้งานในทุก workspace ที่ต้องการก่อนเริ่ม OpenClaw สร้าง app-level token ที่มี `connections:write` สำหรับ Socket Mode จากนั้นคัดลอก bot token จากการติดตั้งระดับองค์กร กำหนดค่าบัญชีที่ใช้ bot token ที่ติดตั้งระดับองค์กร:

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

ใช้โหมด HTTP เมื่อ Gateway มีปลายทาง HTTPS สาธารณะและไม่ได้เปิดการเชื่อมต่อ Socket Mode แทนที่ URL ตัวอย่างด้วย URL สาธารณะ `webhookPath` ของ Gateway (ค่าเริ่มต้น `/slack/events`):

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

ให้ Enterprise Grid Org Admin หรือ Org Owner อนุมัติแอป ติดตั้งในระดับองค์กร และเลือก workspace ที่การติดตั้งครอบคลุม หลังจาก Slack ตรวจสอบ Request URL แล้ว ให้คัดลอก bot token ของการติดตั้งระดับองค์กรและ **Basic Information -> App Credentials -> Signing Secret** ของแอป กำหนดค่าบัญชีองค์กรด้วยพาธ Request URL เดียวกัน:

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

เมื่อเริ่มต้น OpenClaw จะตรวจสอบ `enterpriseOrgInstall` ด้วย `auth.test` ของ Slack โทเค็นที่ติดตั้งระดับองค์กรแต่ไม่มีแฟล็ก หรือโทเค็น workspace ที่มีแฟล็ก จะทำให้การเริ่มต้นล้มเหลว Slack ยังคงเป็นแหล่งข้อมูลจริงสำหรับ workspace ที่อนุญาตการติดตั้ง จากนั้น OpenClaw จะใช้นโยบายช่อง ผู้ใช้ DM และการกล่าวถึงที่กำหนดค่าไว้กับแต่ละเหตุการณ์ที่ส่งเข้ามา Enterprise V1 ปฏิเสธเหตุการณ์ `message` และ `app_mention` ทั้งหมดที่บอตเป็นผู้สร้างก่อนส่งต่อ โดยไม่คำนึงถึง `allowBots` เนื่องจากการติดตั้งระดับองค์กรไม่มีข้อมูลประจำตัวบอตแบบระบุ workspace ที่เสถียรสำหรับป้องกันลูป

การรองรับองค์กรถูกจำกัดโดยเจตนาไว้เฉพาะ Socket Mode โดยตรงหรือเหตุการณ์ HTTP `message` และ `app_mention` พร้อมการตอบกลับทันทีเท่านั้น โหมดรีเลย์ คำสั่ง Slash การโต้ตอบ App Home, listener เหตุการณ์รีแอ็กชัน หมุด เครื่องมือการดำเนินการ Slack การอนุมัติแบบเนทีฟของ Slack การผูก การส่งแบบเข้าคิวหรือตามกำหนดเวลา และการส่งเชิงรุก ไม่พร้อมใช้งานสำหรับบัญชีองค์กร รองรับรีแอ็กชันการตอบรับ การพิมพ์ และสถานะขาออกผ่านไคลเอนต์ Slack ที่ listener เป็นผู้ดูแล และต้องใช้ `reactions:write`; การแจ้งเตือนรีแอ็กชันขาเข้าและเครื่องมือการดำเนินการรีแอ็กชันยังคงไม่พร้อมใช้งาน

การตอบกลับทันทีจะใช้พฤติกรรมการส่งมาตรฐานของ Slack ซ้ำสำหรับส่วนข้อความ
สื่อ เมทาดาทา การใช้ข้อมูลประจำตัวสำรอง การแสดงตัวอย่างลิงก์ และใบรับ แต่เฉพาะขณะที่
ไคลเอนต์ที่ Listener เป็นเจ้าของและผ่านการตรวจสอบแล้วยังคงอยู่ในรอบเหตุการณ์ที่ทำงานอยู่เท่านั้น คิวส่ง
ในหน่วยความจำและระเบียนการเข้าร่วมเธรดจะแบ่งตามเวิร์กสเปซของ
เหตุการณ์นั้น โดยตัวไคลเอนต์เองจะไม่ถูกทำให้เป็นอนุกรมหรือจัดเก็บถาวร

คีย์นโยบายช่องและรายการ `dm.groupChannels` ต้องใช้ ID ช่อง Slack แบบดิบที่เสถียรหรือรูปแบบ
`channel:<id>` OpenClaw จะปรับทั้งสองรูปแบบให้เป็น ID ช่องแบบดิบเพื่อ
จับคู่ขณะรันไทม์ ส่วนคำนำหน้า `slack:`, `group:` และ `mpim:` จะทำให้การเริ่มต้นล้มเหลว
รายการนโยบายผู้ใช้ต้องใช้ ID ผู้ใช้ Slack ที่เสถียร ชื่อ slug ชื่อที่แสดง
และที่อยู่อีเมลจะทำให้การเริ่มต้นล้มเหลว ID ต้องใช้คำนำหน้าและส่วนเนื้อหาแบบตัวพิมพ์ใหญ่ตามมาตรฐาน
ของ Slack (ตัวอย่างเช่น `C0123456789` หรือ `U0123456789`) ตัวพิมพ์เล็กและ
รูปแบบสั้นที่ดูคล้ายกันจะทำให้การเริ่มต้นล้มเหลว บัญชี Enterprise ไม่สามารถเปิดใช้
`dangerouslyAllowNameMatching` ได้ บัญชี Enterprise สามารถตั้งค่า
`mentionPatterns.mode` ส่วนกลางได้ แต่ `mentionPatterns.allowIn` และ
`mentionPatterns.denyIn` จะทำให้การเริ่มต้นล้มเหลว เนื่องจาก ID ช่อง Slack เปล่าไม่ได้
ระบุเวิร์กสเปซและอาจถูกใช้ซ้ำในหลายเวิร์กสเปซ การติดตั้งระดับเวิร์กสเปซ
ยังคงใช้พฤติกรรมรูปแบบการกล่าวถึงตามขอบเขตที่มีอยู่ แต่ละเวิร์กสเปซที่ยอมรับ
จะมีข้อมูลประจำตัวสำหรับการกำหนดเส้นทาง เซสชัน บันทึกบทสนทนา การขจัดรายการซ้ำ ประวัติ และแคช
แยกกัน แม้ ID ของ Slack จะซ้ำกัน ภายในสตรีม `message` รองรับข้อความผู้ใช้ทั่วไป
และเหตุการณ์ `file_share` ที่ผู้ใช้สร้าง ส่วนประเภทย่อยของข้อความอื่น
จะถูกปฏิเสธก่อนการตรวจสอบสิทธิ์หรือการจัดการเหตุการณ์ระบบ

DM ระดับ Enterprise ต้องปิดใช้งาน (`dm.enabled=false` หรือ
`dmPolicy="disabled"`) หรือเปิดอย่างชัดเจนด้วย `dmPolicy="open"` และ
บัญชีที่มีผล `allowFrom` ซึ่งมีค่าตรงตัว `"*"` รายการอนุญาตที่ว่างเปล่า
หรือ ID เฉพาะผู้ใช้ที่ไม่มี `"*"` จะทำให้การเริ่มต้นล้มเหลว การจับคู่และ
รายการอนุญาต DM รายผู้ใช้จะถูกปฏิเสธ เนื่องจาก ID ผู้ใช้ Slack ไม่ได้
ระบุเวิร์กสเปซในที่จัดเก็บการให้สิทธิ์เหล่านั้น นโยบายช่องและผู้ส่ง
ยังคงมีผลกับข้อความในช่อง

## การติดตั้ง

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` จะลงทะเบียนและเปิดใช้ Plugin โดยจะยังไม่ทำงานจนกว่าจะกำหนดค่าแอป Slack และการตั้งค่าช่องด้านล่าง ดูกฎทั่วไปในการติดตั้ง Plugin ที่ [Plugin](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว

ไฟล์ manifest ในส่วนนี้จะสร้างการติดตั้งที่มีขอบเขตระดับเวิร์กสเปซ สำหรับการติดตั้ง
ทั่วทั้งองค์กร Enterprise Grid ให้ใช้
[manifest และขั้นตอนการทำงานสำหรับทั้งองค์กรโดยเฉพาะ](#enterprise-grid-org-wide-installs) แทน

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
        { "title": "คุณทำอะไรได้บ้าง", "message": "คุณช่วยอะไรฉันได้บ้าง" },
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
        { "title": "คุณทำอะไรได้บ้าง", "message": "คุณช่วยอะไรฉันได้บ้าง" },
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
          **แนะนำ** ตรงกับชุดคุณสมบัติทั้งหมดของ Plugin Slack ได้แก่ App Home, คำสั่ง slash, ไฟล์, รีแอ็กชัน, หมุด, DM แบบกลุ่ม และการอ่านอีโมจิ/กลุ่มผู้ใช้ เลือก **ขั้นต่ำ** เมื่อนโยบายเวิร์กสเปซจำกัดขอบเขตสิทธิ์ โดยครอบคลุม DM, ประวัติช่อง/กลุ่ม, การกล่าวถึง และคำสั่ง slash แต่ไม่รวมไฟล์ รีแอ็กชัน หมุด DM แบบกลุ่ม (`mpim:*`), `emoji:read` และ `usergroups:read` ดูเหตุผลของแต่ละขอบเขตสิทธิ์และตัวเลือกเสริม เช่น คำสั่ง slash เพิ่มเติมได้ที่ [รายการตรวจสอบ manifest และขอบเขตสิทธิ์](#manifest-and-scope-checklist)
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

        การใช้ตัวแปรสภาพแวดล้อมสำรอง (เฉพาะบัญชีเริ่มต้น):

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
        เปิด [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → เลือกเวิร์กสเปซ → วาง manifest รายการใดรายการหนึ่งด้านล่าง → แทนที่ `https://gateway-host.example.com/slack/events` ด้วย URL Gateway สาธารณะ → **Next** → **Create**

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
        { "title": "คุณทำอะไรได้บ้าง", "message": "คุณช่วยอะไรฉันได้บ้าง" },
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
        { "title": "คุณทำอะไรได้บ้าง", "message": "คุณช่วยอะไรฉันได้บ้าง" },
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
          **แนะนำ** รองรับชุดความสามารถทั้งหมดของ Plugin Slack ส่วน **ขั้นต่ำ** จะตัดไฟล์ รีแอ็กชัน หมุด DM แบบกลุ่ม (`mpim:*`) `emoji:read` และ `usergroups:read` ออก สำหรับเวิร์กสเปซที่มีข้อจำกัด โปรดดูเหตุผลของแต่ละขอบเขตสิทธิ์ที่ [รายการตรวจสอบ Manifest และขอบเขตสิทธิ์](#manifest-and-scope-checklist)
        </Note>

        <Info>
          ช่อง URL ทั้งสามช่อง (`slash_commands[].url`, `event_subscriptions.request_url` และ `interactivity.request_url` / `message_menu_options_url`) ชี้ไปยังปลายทาง OpenClaw เดียวกัน สคีมา Manifest ของ Slack กำหนดให้ตั้งชื่อแยกกัน แต่ OpenClaw กำหนดเส้นทางตามประเภทเพย์โหลด ดังนั้น `webhookPath` เพียงค่าเดียว (ค่าเริ่มต้น `/slack/events`) จึงเพียงพอ คำสั่ง Slash ที่ไม่มี `slash_commands[].url` จะไม่ดำเนินการใดๆ โดยไม่มีการแจ้งเตือนในโหมด HTTP
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

## ข้อมูลประจำตัวผู้ใช้ (โพสต์ในฐานะบุคคลจริง)

ข้อมูลประจำตัวผู้ใช้ช่วยให้ OpenClaw อ่านและโพสต์ในฐานะบุคคลที่ให้สิทธิ์แก่แอป Slack โดย `userToken` คือข้อมูลประจำตัวที่ใช้ดำเนินการ ส่วนแอป Slack คู่หูจะรับส่งทราฟฟิก Events API ผ่าน Socket Mode หรือ HTTP Request URL แอปคู่หูไม่จำเป็นต้องมีผู้ใช้บอตหรือโทเค็นบอต

ตั้งค่าแอปคู่หูดังนี้:

1. ภายใต้ **OAuth & Permissions -> User Token Scopes** ให้เพิ่มสิทธิ์ที่มีขอบเขตระดับผู้ใช้ต่อไปนี้:

   - ประวัติ: `channels:history`, `groups:history`, `im:history`, `mpim:history`
   - การค้นหาการสนทนา: `channels:read`, `groups:read`, `im:read`, `mpim:read`
   - บุคคล: `users:read`
   - การโพสต์: `chat:write` (ข้อความจะถูกโพสต์ในฐานะผู้ใช้ที่ให้สิทธิ์)
   - การเปิด DM: `im:write`, `mpim:write`

2. ภายใต้ **Event Subscriptions -> Subscribe to events on behalf of users** ให้เพิ่มเหตุการณ์ผู้ใช้ต่อไปนี้ อย่าเพิ่มเหตุการณ์เหล่านี้เฉพาะในรายการเหตุการณ์ของบอต:

   - `message.channels`
   - `message.groups`
   - `message.im`
   - `message.mpim`

3. เลือกวิธีรับส่งเหตุการณ์หนึ่งวิธี:

   - **Socket Mode:** เปิดใช้ Socket Mode และสร้างโทเค็นระดับแอปที่มี `connections:write` กำหนดค่าเป็น `appToken`
   - **HTTP Request URL:** กำหนดให้ Event Subscriptions ชี้ไปยังปลายทาง Slack สาธารณะของ OpenClaw และคัดลอก **Basic Information -> App Credentials -> Signing Secret** กำหนดค่าเป็น `signingSecret`

4. ติดตั้งหรือติดตั้งแอปใหม่ ให้สิทธิ์ในฐานะบุคคลที่ต้องการ แล้วคัดลอกโทเค็น OAuth ของผู้ใช้ที่ได้ไปยัง `userToken`

การกำหนดค่า Socket Mode:

```json5
{
  channels: {
    slack: {
      identity: "user",
      userToken: "<xoxp>",
      appToken: "<xapp>",
    },
  },
}
```

การกำหนดค่า HTTP Request URL:

```json5
{
  channels: {
    slack: {
      identity: "user",
      mode: "http",
      userToken: "<xoxp>",
      signingSecret: "<signing-secret>",
      webhookPath: "/slack/events",
    },
  },
}
```

<Warning>
  DM และ DM แบบกลุ่มทำงานผ่านการสมัครรับเหตุการณ์ในขอบเขตผู้ใช้ข้างต้นเท่านั้น บอตไม่สามารถเข้าร่วม DM แบบ 1:1 ของบุคคลหรือถูกเพิ่มเข้าไปใน DM แบบกลุ่มที่มีอยู่แล้วได้ แอปคู่หูเป็นกลไกเบื้องหลังที่มองไม่เห็น สมาชิก Slack คนอื่นจะเห็นข้อความจากบุคคลที่ให้สิทธิ์ ไม่ใช่จากบอต OpenClaw
</Warning>

OpenClaw จะละทิ้งเหตุการณ์ข้อความในขอบเขตผู้ใช้ที่สร้างโดยข้อมูลประจำตัวบุคคลที่ระบุได้โดยอัตโนมัติ ดังนั้นข้อความที่ OpenClaw ส่งจะไม่กระตุ้นให้ตอบกลับตัวเอง

## การปรับแต่งการรับส่งผ่าน Socket Mode

โดยค่าเริ่มต้น OpenClaw กำหนดเวลาหมดอายุในการรอ pong ของไคลเอนต์ Slack SDK เป็น 15 วินาทีสำหรับ Socket Mode ให้ปรับการตั้งค่าการรับส่งเฉพาะเมื่อต้องปรับแต่งสำหรับเวิร์กสเปซหรือโฮสต์เป็นการเฉพาะ:

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

ใช้การตั้งค่านี้เฉพาะกับเวิร์กสเปซ Socket Mode ที่บันทึกข้อผิดพลาดเวลาหมดอายุของ pong/server-ping ของ WebSocket จาก Slack หรือทำงานบนโฮสต์ที่ทราบว่ามีภาวะ event loop ขาดทรัพยากร `clientPingTimeout` คือเวลารอ pong หลังจาก SDK ส่ง ping จากไคลเอนต์ ส่วน `serverPingTimeout` คือเวลารอ ping จากเซิร์ฟเวอร์ Slack ข้อความและเหตุการณ์ของแอปยังคงเป็นสถานะแอปพลิเคชัน ไม่ใช่สัญญาณความพร้อมทำงานของการรับส่ง

หมายเหตุ:

- `socketMode` จะถูกละเว้นในโหมด HTTP Request URL
- การตั้งค่าพื้นฐาน `channels.slack.socketMode` มีผลกับบัญชี Slack ทั้งหมด เว้นแต่จะมีการแทนที่ การแทนที่รายบัญชีใช้ `channels.slack.accounts.<accountId>.socketMode` เนื่องจากเป็นการแทนที่ด้วยออบเจ็กต์ จึงต้องระบุทุกฟิลด์สำหรับปรับแต่ง Socket ที่ต้องการใช้กับบัญชีนั้น
- มีเพียง `clientPingTimeout` เท่านั้นที่มีค่าเริ่มต้นจาก OpenClaw (`15000`) ส่วน `serverPingTimeout` และ `pingPongLoggingEnabled` จะถูกส่งไปยัง Slack SDK เฉพาะเมื่อมีการกำหนดค่า
- ระยะหน่วงก่อนเริ่ม Socket Mode ใหม่เริ่มต้นที่ประมาณ 2 วินาทีและจำกัดสูงสุดที่ประมาณ 30 วินาที ความล้มเหลวที่กู้คืนได้ระหว่างการเริ่มต้น การรอเริ่มต้น และการตัดการเชื่อมต่อจะลองใหม่จนกว่าช่องจะหยุดทำงาน ข้อผิดพลาดถาวรเกี่ยวกับบัญชีและข้อมูลรับรอง เช่น การยืนยันตัวตนไม่ถูกต้อง โทเค็นถูกเพิกถอน หรือไม่มีขอบเขตสิทธิ์ที่จำเป็น จะล้มเหลวทันทีแทนที่จะลองใหม่ตลอดไป

## รายการตรวจสอบ Manifest และขอบเขตสิทธิ์

Manifest พื้นฐานของแอป Slack เหมือนกันทั้งสำหรับ Socket Mode และ HTTP Request URL มีเพียงบล็อก `settings` (และ `url` ของคำสั่ง Slash) ที่แตกต่างกัน

Manifest พื้นฐาน (ค่าเริ่มต้นของ Socket Mode):

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
        { "title": "คุณทำอะไรได้บ้าง", "message": "คุณช่วยอะไรฉันได้บ้าง" },
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

สำหรับ **โหมด HTTP Request URL** ให้แทนที่ `settings` ด้วยรูปแบบ HTTP และเพิ่ม `url` ให้กับคำสั่ง Slash แต่ละคำสั่ง จำเป็นต้องมี URL สาธารณะ:

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

### การตั้งค่า Manifest เพิ่มเติม

แสดงความสามารถต่างๆ ที่ต่อยอดจากค่าเริ่มต้นข้างต้น

ไฟล์ manifest เริ่มต้นเปิดใช้งานแท็บ **Home** ของ Slack App Home และสมัครรับ `app_home_opened` เมื่อสมาชิกเวิร์กสเปซเปิดแท็บ Home OpenClaw จะเผยแพร่มุมมอง Home เริ่มต้นที่ปลอดภัยพร้อม `views.publish` โดยไม่มีเพย์โหลดการสนทนาหรือการกำหนดค่าส่วนตัวรวมอยู่ด้วย เมื่อเปิดใช้งานโหมดคำสั่ง slash เดียว คำแนะนำคำสั่งจะใช้ `channels.slack.slashCommand.name` ส่วนการติดตั้งที่ใช้คำสั่งแบบเนทีฟหรือไม่มีคำสั่ง slash จะละเว้นคำแนะนำดังกล่าว แท็บ **Messages** ยังคงเปิดใช้งานสำหรับ DM ของ Slack นอกจากนี้ manifest ยังเปิดใช้งานเธรดผู้ช่วยของ Slack ด้วย `features.assistant_view`, `assistant:write`, `assistant_thread_started` และ `assistant_thread_context_changed` โดยเธรดผู้ช่วยจะกำหนดเส้นทางไปยังเซสชันเธรด OpenClaw ของตนเอง และเก็บบริบทเธรดที่ Slack ให้ไว้ให้พร้อมใช้งานสำหรับเอเจนต์

<AccordionGroup>
  <Accordion title="คำสั่ง slash แบบเนทีฟที่ไม่บังคับ">

    สามารถใช้[คำสั่ง slash แบบเนทีฟ](#commands-and-slash-behavior)หลายรายการแทนคำสั่งเดียวที่กำหนดค่าไว้ โดยมีข้อควรพิจารณาดังนี้:

    - ใช้ `/agentstatus` แทน `/status` เนื่องจากคำสั่ง `/status` ถูกสงวนไว้
    - แอป Slack หนึ่งแอปลงทะเบียนคำสั่ง slash พร้อมกันได้ไม่เกิน 25 คำสั่ง (ข้อจำกัดของแพลตฟอร์ม Slack)

    OpenClaw ลงทะเบียนตัวจัดการสำหรับคำสั่งแบบเนทีฟที่เปิดใช้งาน แต่รายการใน Slack manifest ยังคงอยู่ภายใต้การจัดการของผู้ดูแลระบบและจะไม่ซิงค์ขณะรันไทม์ เพิ่ม `/login` ลงใน manifest ด้วยตนเอง ตัวอย่างด้านล่างรวมรายการนี้แทนนามแฝง `/side` ที่ไม่บังคับ เพื่อให้จำนวนคำสั่งคงอยู่ที่ 25 คำสั่ง สามารถแสดง `/login` ได้ทุกที่ แต่จะออกโค้ดการจับคู่เฉพาะในแชตส่วนตัวหรือ Web UI เท่านั้น

    แทนที่ส่วน `features.slash_commands` ที่มีอยู่ด้วยชุดย่อยของ[คำสั่งที่พร้อมใช้งาน](/th/tools/slash-commands#command-list):

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
      "description": "หยุดการรันปัจจุบัน"
    },
    {
      "command": "/session",
      "description": "จัดการเวลาหมดอายุของการผูกเธรด",
      "usage_hint": "ไม่มีการใช้งาน <duration|off> หรืออายุสูงสุด <duration|off>"
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
      "description": "แสดงหรือตั้งค่าเริ่มต้นของการดำเนินการ",
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
      "description": "แสดงสรุปความช่วยเหลือแบบสั้น"
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
      "description": "แสดงรายการงานเบื้องหลังที่ทำงานอยู่/ล่าสุดสำหรับเซสชันปัจจุบัน"
    },
    {
      "command": "/context",
      "description": "อธิบายวิธีประกอบบริบท",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "แสดงข้อมูลระบุตัวตนของผู้ส่ง"
    },
    {
      "command": "/skill",
      "description": "เรียกใช้สกิลตามชื่อ",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "ถามคำถามแทรกโดยไม่เปลี่ยนบริบทของเซสชัน",
      "usage_hint": "<question>"
    },
    {
      "command": "/login",
      "description": "จับคู่การเข้าสู่ระบบ Codex",
      "usage_hint": "[codex|openai]"
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
        ใช้รายการ `slash_commands` เดียวกับ Socket Mode ด้านบน และเพิ่ม `"url": "https://gateway-host.example.com/slack/events"` ในทุกรายการ ตัวอย่าง:

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
      "description": "แสดงสรุปความช่วยเหลือแบบสั้น",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        ใช้ค่า `url` นั้นซ้ำกับทุกคำสั่งในรายการ

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="ขอบเขตการระบุผู้เขียนที่ไม่บังคับ (การดำเนินการเขียน)">
    เพิ่มขอบเขตบอต `chat:write.customize` หากต้องการให้ข้อความขาออกใช้ข้อมูลระบุตัวตนของเอเจนต์ที่ทำงานอยู่ (ชื่อผู้ใช้และไอคอนที่กำหนดเอง) แทนข้อมูลระบุตัวตนเริ่มต้นของแอป Slack

    หากใช้ไอคอนอีโมจิ Slack ต้องการรูปแบบไวยากรณ์ `:emoji_name:`

  </Accordion>
  <Accordion title="ขอบเขตโทเค็นผู้ใช้ที่ไม่บังคับ (การดำเนินการอ่าน)">
    หากกำหนดค่า `channels.slack.userToken` ขอบเขตการอ่านทั่วไปได้แก่:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (หากพึ่งพาการอ่านผลการค้นหาของ Slack)

  </Accordion>
</AccordionGroup>

## รูปแบบโทเค็น

- ข้อมูลระบุตัวตนของบอต (ค่าเริ่มต้น) ต้องใช้ `botToken` + `appToken` สำหรับ Socket Mode หรือ `botToken` + `signingSecret` สำหรับโหมด HTTP
- ข้อมูลระบุตัวตนของผู้ใช้ต้องใช้ `userToken` + `appToken` สำหรับ Socket Mode หรือ `userToken` + `signingSecret` สำหรับโหมด HTTP โดยไม่ใช้โทเค็นบอต
- โหมดรีเลย์ต้องใช้ `botToken` พร้อมกับ `relay.url`, `relay.authToken` และ `relay.gatewayId` โดยไม่ใช้โทเค็นแอปหรือข้อมูลลับสำหรับการลงนาม
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` และ `userToken` รองรับสตริงข้อความธรรมดา
  หรือออบเจ็กต์ SecretRef
- โทเค็นในไฟล์กำหนดค่ามีลำดับความสำคัญเหนือค่าทดแทนจากตัวแปรสภาพแวดล้อม
- ค่าทดแทนจากตัวแปรสภาพแวดล้อม `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` และ `SLACK_USER_TOKEN` แต่ละรายการใช้กับบัญชีเริ่มต้นเท่านั้น
- `userToken` มีค่าเริ่มต้นเป็นลักษณะการทำงานแบบอ่านอย่างเดียว (`userTokenReadOnly: true`)

ลักษณะการทำงานของสแนปช็อตสถานะ:

- การตรวจสอบบัญชี Slack ติดตามฟิลด์ `*Source` และ `*Status` แยกตามข้อมูลประจำตัว
  (`botToken`, `appToken`, `signingSecret`, `userToken`)
- สถานะคือ `available`, `configured_unavailable` หรือ `missing`
- `configured_unavailable` หมายความว่าบัญชีได้รับการกำหนดค่าผ่าน SecretRef
  หรือแหล่งข้อมูลลับอื่นที่ไม่ได้ระบุค่าไว้โดยตรง แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบัน
  ไม่สามารถแปลงเป็นค่าจริงได้
- ในโหมด HTTP จะรวม `signingSecretStatus` ไว้ด้วย ส่วน Socket Mode ใช้
  `botTokenStatus` + `appTokenStatus` สำหรับข้อมูลระบุตัวตนของบอต และ
  `userTokenStatus` + `appTokenStatus` สำหรับข้อมูลระบุตัวตนของผู้ใช้

<Tip>
สำหรับข้อมูลระบุตัวตนของบอต การดำเนินการและการอ่านไดเรกทอรีสามารถเลือกใช้โทเค็นผู้ใช้ที่ไม่บังคับก่อน ส่วนการเขียนจะยังคงใช้โทเค็นบอต เว้นแต่ `userTokenReadOnly: false` จะอนุญาตให้ใช้ค่าทดแทน สำหรับ `identity: "user"` การอ่านและการเขียนจะใช้ `userToken` เสมอ
</Tip>

## การดำเนินการและเกต

การดำเนินการของ Slack ควบคุมโดย `channels.slack.actions.*`

กลุ่มการดำเนินการที่พร้อมใช้งานในเครื่องมือ Slack ปัจจุบัน:

| กลุ่ม      | ค่าเริ่มต้น |
| ---------- | ------- |
| messages   | เปิดใช้งาน |
| reactions  | เปิดใช้งาน |
| pins       | เปิดใช้งาน |
| memberInfo | เปิดใช้งาน |
| emojiList  | เปิดใช้งาน |

การดำเนินการกับข้อความ Slack ปัจจุบันประกอบด้วย `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` และ `emoji-list` โดย `download-file` รองรับ ID ไฟล์ Slack ที่แสดงในตัวยึดตำแหน่งไฟล์ขาเข้า และส่งคืนตัวอย่างรูปภาพสำหรับไฟล์ภาพหรือข้อมูลเมตาของไฟล์ในเครื่องสำหรับไฟล์ประเภทอื่น

## การควบคุมการเข้าถึงและการกำหนดเส้นทาง

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.slack.dmPolicy` ควบคุมการเข้าถึง DM ส่วน `channels.slack.allowFrom` คือรายการอนุญาต DM มาตรฐาน

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (กำหนดให้ `channels.slack.allowFrom` ต้องมี `"*"`)
    - `disabled`

    แฟล็ก DM:

    - `dm.enabled` (ค่าเริ่มต้นเป็น true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (แบบเดิม)
    - `dm.groupEnabled` (DM แบบกลุ่มมีค่าเริ่มต้นเป็น false)
    - `dm.groupChannels` (รายการอนุญาต MPIM ที่ไม่บังคับ)

    ลำดับความสำคัญของหลายบัญชี:

    - `channels.slack.accounts.default.allowFrom` ใช้กับบัญชี `default` เท่านั้น
    - บัญชีที่ระบุชื่อจะสืบทอด `channels.slack.allowFrom` เมื่อไม่ได้ตั้งค่า `allowFrom` ของตนเอง
    - บัญชีที่ระบุชื่อจะไม่สืบทอด `channels.slack.accounts.default.allowFrom`

    ระบบยังคงอ่าน `channels.slack.dm.policy` และ `channels.slack.dm.allowFrom` แบบเดิมเพื่อความเข้ากันได้ โดย `openclaw doctor --fix` จะย้ายข้อมูลเหล่านี้ไปยัง `dmPolicy` และ `allowFrom` เมื่อทำได้โดยไม่เปลี่ยนแปลงการเข้าถึง

    การจับคู่ใน DM ใช้ `openclaw pairing approve slack <code>`

  </Tab>

  <Tab title="นโยบายช่อง">
    `channels.slack.groupPolicy` ควบคุมการจัดการช่อง:

    - `open`
    - `allowlist`
    - `disabled`

    รายการอนุญาตช่องอยู่ภายใต้ `channels.slack.channels` และ**ต้องใช้ ID ช่อง Slack ที่คงที่** (ตัวอย่างเช่น `C12345678`) เป็นคีย์การกำหนดค่า

    หมายเหตุเกี่ยวกับรันไทม์: หากไม่มี `channels.slack` อยู่เลย (ตั้งค่าผ่านตัวแปรสภาพแวดล้อมเท่านั้น) รันไทม์จะใช้ `groupPolicy="allowlist"` เป็นค่าทดแทนและบันทึกคำเตือน (แม้ว่าจะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม)

    การแปลงชื่อ/ID:

    - รายการในรายการอนุญาตช่องและรายการอนุญาต DM จะได้รับการแปลงเมื่อเริ่มต้นระบบ หากการเข้าถึงด้วยโทเค็นอนุญาต
    - รายการชื่อช่องที่แปลงไม่ได้จะคงอยู่ตามที่กำหนดค่าไว้ แต่จะถูกละเว้นสำหรับการกำหนดเส้นทางโดยค่าเริ่มต้น
    - โดยค่าเริ่มต้น การอนุญาตขาเข้าและการกำหนดเส้นทางช่องจะยึด ID เป็นหลัก การจับคู่ชื่อผู้ใช้/slug โดยตรงต้องใช้ `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    คีย์ที่อิงตามชื่อ (`#channel-name` หรือ `channel-name`) **จะไม่** ตรงกันภายใต้ `groupPolicy: "allowlist"` โดยค่าเริ่มต้น การค้นหาช่องจะยึด ID เป็นหลัก ดังนั้นคีย์ที่อิงตามชื่อจะไม่สามารถกำหนดเส้นทางได้สำเร็จ และข้อความทั้งหมดในช่องนั้นจะถูกบล็อกโดยไม่มีการแจ้งเตือน ซึ่งแตกต่างจาก `groupPolicy: "open"` ที่ไม่จำเป็นต้องใช้คีย์ช่องในการกำหนดเส้นทาง จึงทำให้คีย์ที่อิงตามชื่อดูเหมือนใช้งานได้

    ใช้ ID ช่อง Slack เป็นคีย์เสมอ วิธีค้นหา: คลิกขวาที่ช่องใน Slack → **Copy link** — ID (`C...`) จะอยู่ท้าย URL

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

  <Tab title="การกล่าวถึงและผู้ใช้ในช่อง">
    โดยค่าเริ่มต้น ข้อความในช่องต้องมีการกล่าวถึงจึงจะผ่านเกต

    แหล่งที่มาของการกล่าวถึง:

    - การกล่าวถึงแอปโดยตรง (`<@botId>`)
    - การกล่าวถึงกลุ่มผู้ใช้ Slack (`<!subteam^S...>`) เมื่อผู้ใช้บอตเป็นสมาชิกของกลุ่มผู้ใช้นั้น ต้องมี `usergroups:read`
    - รูปแบบนิพจน์ทั่วไปสำหรับการกล่าวถึง (`agents.list[].groupChat.mentionPatterns`, สำรองด้วย `messages.groupChat.mentionPatterns`)
    - การตอบกลับข้อความ Slack ของบอตเอง (`implicitMentions.replyToBot`)
    - ข้อความติดตามในเธรดที่บอตเคยเข้าร่วม (`implicitMentions.threadParticipation`)

    การควบคุมรายช่อง (`channels.slack.channels.<id>`; ใช้ชื่อได้เฉพาะผ่านการแก้ไขค่าเมื่อเริ่มต้นระบบหรือ `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; แทนที่โหมดตอบกลับระดับบัญชี/ประเภทแชตสำหรับช่องนี้)
    - `users` (รายการอนุญาต)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - รูปแบบคีย์ `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` หรือไวลด์การ์ด `"*"`
      (คีย์แบบเดิมที่ไม่มีคำนำหน้ายังคงแมปไปยัง `id:` เท่านั้น)

    `ignoreOtherMentions` (ค่าเริ่มต้น `false`) จะทิ้งข้อความในช่องที่กล่าวถึงผู้ใช้หรือกลุ่มผู้ใช้อื่น แต่ไม่ได้กล่าวถึงบอตนี้ DM และ DM แบบกลุ่ม (MPIM) ไม่ได้รับผลกระทบ ตัวกรองต้องใช้ ID ผู้ใช้บอตที่แก้ไขค่าแล้วจาก `auth.test`; หากไม่มีข้อมูลประจำตัวดังกล่าว (เช่น ข้อมูลประจำตัวที่มีเฉพาะโทเค็นผู้ใช้) เกตจะเปิดเมื่อเกิดข้อผิดพลาดและปล่อยข้อความผ่านโดยไม่เปลี่ยนแปลง

    `allowBots` ใช้นโยบายแบบระมัดระวังสำหรับช่องและช่องส่วนตัว: ข้อความในห้องที่บอตเป็นผู้ส่งจะได้รับการยอมรับเฉพาะเมื่อบอตผู้ส่งอยู่ในรายการอนุญาต `users` ของห้องนั้นอย่างชัดเจน หรือเมื่อ ID เจ้าของ Slack ที่ระบุอย่างชัดเจนอย่างน้อยหนึ่งรายการจาก `channels.slack.allowFrom` เป็นสมาชิกของห้องอยู่ในขณะนั้น ไวลด์การ์ดและรายการเจ้าของที่ใช้ชื่อที่แสดงไม่ถือว่าเป็นการมีอยู่ของเจ้าของ การตรวจสอบการมีอยู่ของเจ้าของใช้ `conversations.members` ของ Slack; โปรดตรวจสอบว่าแอปมีขอบเขตการอ่านที่ตรงกับประเภทห้อง (`channels:read` สำหรับช่องสาธารณะ, `groups:read` สำหรับช่องส่วนตัว) หากการค้นหาสมาชิกล้มเหลว OpenClaw จะทิ้งข้อความในห้องที่บอตเป็นผู้ส่ง

    ข้อความ Slack ที่บอตเป็นผู้ส่งและได้รับการยอมรับจะใช้ [การป้องกันบอตวนซ้ำ](/th/channels/bot-loop-protection) ร่วมกัน กำหนดค่า `channels.defaults.botLoopProtection` สำหรับงบประมาณเริ่มต้น จากนั้นแทนที่ด้วย `channels.slack.botLoopProtection` หรือ `channels.slack.channels.<id>.botLoopProtection` เมื่อเวิร์กสเปซหรือช่องต้องใช้ขีดจำกัดที่ต่างออกไป

  </Tab>
</Tabs>

## เธรด เซสชัน และแท็กตอบกลับ

- DM จะกำหนดเส้นทางเป็น `direct`; ช่องเป็น `channel`; MPIM เป็น `group`
- การผูกเส้นทาง Slack รองรับ ID เพียร์ดิบ รวมถึงรูปแบบเป้าหมาย Slack เช่น `channel:C12345678`, `user:U12345678` และ `<@U12345678>`
- เมื่อใช้ค่าเริ่มต้น `session.dmScope=main` DM ของ Slack จะรวมเข้าเป็นเซสชันหลักของเอเจนต์
- เซสชันช่อง: `agent:<agentId>:slack:channel:<channelId>`
- ข้อความระดับบนสุดตามปกติในช่องจะคงอยู่ในเซสชันรายช่อง แม้เมื่อ `replyToMode` ไม่ใช่ `off`
- การตอบกลับในเธรด Slack ใช้ `thread_ts` ของ Slack ต้นทางเป็นส่วนต่อท้ายเซสชัน (`:thread:<threadTs>`) แม้จะปิดการตอบกลับแบบเธรดขาออกด้วย `replyToMode="off"`
- OpenClaw จะใส่รูทระดับบนสุดของช่องที่เข้าเกณฑ์ลงใน `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` เมื่อคาดว่ารูทนั้นจะเริ่มเธรด Slack ที่มองเห็นได้ เพื่อให้รูทและการตอบกลับในเธรดภายหลังใช้เซสชัน OpenClaw เดียวกัน กรณีนี้ใช้กับเหตุการณ์ `app_mention`, การตรงกับรูปแบบการกล่าวถึงบอตอย่างชัดเจนหรือรูปแบบการกล่าวถึงที่กำหนดค่าไว้ และช่อง `requireMention: false` ที่มี `replyToMode` ซึ่งไม่ใช่ `off`
- ค่าเริ่มต้นของ `channels.slack.thread.historyScope` คือ `thread`; ค่าเริ่มต้นของ `thread.inheritParent` คือ `false`
- `channels.slack.thread.initialHistoryLimit` ควบคุมจำนวนข้อความในเธรดที่มีอยู่ซึ่งจะดึงมาเมื่อเริ่มเซสชันเธรดใหม่ (ค่าเริ่มต้น `20`; ตั้งเป็น `0` เพื่อปิดใช้งาน)
- `channels.slack.implicitMentions.replyToBot` ควบคุมว่าการตอบกลับข้อความของบอตเองจะข้ามเกตการกล่าวถึงหรือไม่ (ค่าเริ่มต้น `true`)
- `channels.slack.implicitMentions.threadParticipation` ควบคุมว่าข้อความติดตามในเธรดที่บอตเคยตอบแล้วจะข้ามเกตการกล่าวถึงหรือไม่ (ค่าเริ่มต้น `true`) ตั้งเป็น `false` เพื่อกำหนดให้ข้อความติดตามเหล่านั้นต้องกล่าวถึงอย่างชัดเจนอีกครั้ง `openclaw doctor --fix` จะย้ายคีย์เดิม `channels.slack.thread.requireExplicitMention` ไปยังแฟล็กมาตรฐานเชิงบวกนี้
- ค่าที่แทนที่ระดับบัญชีอยู่ที่ `channels.slack.accounts.<id>.implicitMentions`; ค่าเริ่มต้นที่ใช้ร่วมกันอยู่ที่ `channels.defaults.implicitMentions`

การควบคุมเธรดของการตอบกลับ:

- `channels.slack.channels.<id>.replyToMode`: ค่าที่แทนที่รายช่องสำหรับข้อความในช่อง/ช่องส่วนตัวของ Slack
- `channels.slack.replyToMode`: `off|first|all|batched` (ค่าเริ่มต้น `off`)
- `channels.slack.replyToModeByChatType`: ต่อ `direct|group|channel`
- ค่าสำรองแบบเดิมสำหรับแชตโดยตรง: `channels.slack.dm.replyToMode`

รองรับแท็กตอบกลับแบบกำหนดเอง:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

สำหรับการตอบกลับในเธรด Slack อย่างชัดเจนจากเครื่องมือ `message` ให้ตั้งค่า `replyBroadcast: true` พร้อม `action: "send"` และ `threadId` หรือ `replyTo` เพื่อขอให้ Slack เผยแพร่การตอบกลับในเธรดไปยังช่องต้นทางด้วย ค่านี้แมปกับแฟล็ก `reply_broadcast` ของ `chat.postMessage` ใน Slack และรองรับเฉพาะการส่งข้อความหรือ Block Kit ไม่รองรับการอัปโหลดสื่อ

เมื่อการเรียกเครื่องมือ `message` ทำงานภายในเธรด Slack และกำหนดเป้าหมายไปยังช่องเดียวกัน โดยปกติ OpenClaw จะสืบทอดเธรด Slack ปัจจุบันตาม `replyToMode` ที่มีผลในระดับบัญชี ประเภทแชต หรือรายช่อง การตอบกลับอัตโนมัติและการเรียก `send` หรือ `upload-file` ในช่องเดียวกันใช้ค่าที่แทนที่รายช่องเดียวกัน ตั้งค่า `topLevel: true` บน `action: "send"` หรือ `action: "upload-file"` เพื่อบังคับให้เป็นข้อความใหม่ในช่องต้นทางแทน นอกจากนี้ยังยอมรับ `threadId: null` เป็นการเลือกไม่ใช้ระดับบนสุดในความหมายเดียวกัน

<Note>
`replyToMode="off"` ปิดเธรดการตอบกลับ Slack ขาออก รวมถึงแท็ก `[[reply_to_*]]` ที่ระบุอย่างชัดเจน แต่จะไม่รวมเซสชันเธรด Slack ขาเข้าให้เป็นเซสชันเดียว: ข้อความที่โพสต์อยู่แล้วภายในเธรด Slack จะยังคงกำหนดเส้นทางไปยังเซสชัน `:thread:<threadTs>` ซึ่งต่างจาก Telegram ที่แท็กแบบระบุชัดเจนยังคงมีผลในโหมด `"off"` เธรด Slack ซ่อนข้อความจากช่อง ขณะที่การตอบกลับของ Telegram ยังคงแสดงอยู่ในบรรทัด
</Note>

## รีแอ็กชันรับทราบ

`ackReaction` ส่งอีโมจิรับทราบขณะที่ OpenClaw กำลังประมวลผลข้อความขาเข้า `ackReactionScope` กำหนดว่าอีโมจินั้นจะถูกส่งจริง _เมื่อใด_

โดยค่าเริ่มต้น รีแอ็กชันรับทราบจะคงที่ ขณะที่สถานะเธรดผู้ช่วยแบบเนทีฟของ Slack แสดงความคืบหน้าด้วยข้อความกำลังโหลดที่สลับกัน ตั้งค่า `messages.statusReactions.enabled: true` เพื่อเลือกใช้วงจรรีแอ็กชันรอคิว/กำลังคิด/เครื่องมือ/เสร็จสิ้น/ข้อผิดพลาดแทน

### อีโมจิ (`ackReaction`)

ลำดับการแก้ไขค่า:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- อีโมจิสำรองจากข้อมูลประจำตัวของเอเจนต์ (`agents.list[].identity.emoji`, หากไม่มีให้ใช้ `"eyes"` / 👀)

หมายเหตุ:

- Slack ต้องการรหัสย่อ (เช่น `"eyes"`)
- ใช้ `""` เพื่อปิดรีแอ็กชันสำหรับบัญชี Slack หรือทั่วทั้งระบบ

### ขอบเขต (`messages.ackReactionScope`)

ผู้ให้บริการ Slack อ่านขอบเขตจาก `messages.ackReactionScope` (ค่าเริ่มต้น `"group-mentions"`) ปัจจุบันไม่มีค่าที่แทนที่ระดับบัญชี Slack หรือช่อง Slack; ค่านี้มีผลทั่วทั้ง Gateway

ค่า:

- `"all"`: แสดงรีแอ็กชันใน DM และกลุ่ม รวมถึงเหตุการณ์แวดล้อมในห้อง
- `"direct"`: แสดงรีแอ็กชันเฉพาะใน DM
- `"group-all"`: แสดงรีแอ็กชันกับทุกข้อความกลุ่ม ยกเว้นเหตุการณ์แวดล้อมในห้อง (ไม่รวม DM)
- `"group-mentions"` (ค่าเริ่มต้น): แสดงรีแอ็กชันในกลุ่ม แต่เฉพาะเมื่อมีการกล่าวถึงบอต (หรือในกลุ่มที่กล่าวถึงได้ซึ่งเลือกใช้) **ไม่รวม DM**
- `"off"` / `"none"`: ไม่แสดงรีแอ็กชัน

<Note>
ขอบเขตเริ่มต้น (`"group-mentions"`) จะไม่เรียกใช้รีแอ็กชันรับทราบในข้อความโดยตรงหรือเหตุการณ์แวดล้อมในห้อง หากต้องการเห็น `ackReaction` ที่กำหนดค่าไว้ (เช่น `"eyes"`) ใน DM ขาเข้าของ Slack และเหตุการณ์ในห้องที่ไม่มีการเคลื่อนไหว ให้ตั้งค่า `messages.ackReactionScope` เป็น `"all"` ระบบจะอ่าน `messages.ackReactionScope` เมื่อผู้ให้บริการ Slack เริ่มต้น ดังนั้นต้องรีสตาร์ท Gateway เพื่อให้การเปลี่ยนแปลงมีผล
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

`channels.slack.streaming` ควบคุมลักษณะการทำงานของตัวอย่างแบบสด:

- `off`: ปิดการสตรีมตัวอย่างแบบสด
- `partial` (ค่าเริ่มต้น): แทนที่ข้อความตัวอย่างด้วยผลลัพธ์บางส่วนล่าสุด
- `block`: ต่อท้ายการอัปเดตตัวอย่างแบบแบ่งส่วน
- `progress`: แสดงข้อความสถานะความคืบหน้าระหว่างสร้าง จากนั้นส่งข้อความสุดท้าย
- `streaming.preview.toolProgress`: เมื่อเปิดใช้ตัวอย่างฉบับร่าง ให้กำหนดเส้นทางการอัปเดตเครื่องมือ/ความคืบหน้าไปยังข้อความตัวอย่างที่แก้ไขรายการเดียวกัน (ค่าเริ่มต้น: `true`) ตั้งค่า `false` เพื่อแยกข้อความเครื่องมือ/ความคืบหน้าออกจากกัน
- `streaming.preview.commandText` / `streaming.progress.commandText`: ตั้งเป็น `status` เพื่อคงบรรทัดความคืบหน้าของเครื่องมือแบบกระชับไว้ พร้อมซ่อนข้อความคำสั่ง/การดำเนินการดิบ (ค่าเริ่มต้น: `raw`)

ซ่อนข้อความคำสั่ง/การดำเนินการดิบโดยยังคงบรรทัดความคืบหน้าแบบกระชับไว้:

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

ต้องเลือกใช้การ์ดงานแสดงความคืบหน้าแบบเนทีฟของ Slack สำหรับโหมดความคืบหน้า ตั้งค่า `channels.slack.streaming.progress.nativeTaskCards` เป็น `true` พร้อม `channels.slack.streaming.mode="progress"` เพื่อส่งการ์ดแผน/งานแบบเนทีฟของ Slack ระหว่างที่งานกำลังทำงาน จากนั้นอัปเดตการ์ดงานเดิมเมื่อเสร็จสิ้น หากไม่มีแฟล็กนี้ โหมดความคืบหน้าจะยังคงใช้ลักษณะการทำงานของตัวอย่างฉบับร่างแบบพกพา

- ต้องมีเธรดตอบกลับเพื่อให้การสตรีมข้อความแบบเนทีฟและสถานะเธรดผู้ช่วยของ Slack ปรากฏ การเลือกเธรดยังคงเป็นไปตาม `replyToMode`
- รูทของช่อง แชตกลุ่ม และ DM ระดับบนสุดยังคงใช้ตัวอย่างฉบับร่างตามปกติได้เมื่อการสตรีมแบบเนทีฟไม่พร้อมใช้งานหรือไม่มีเธรดตอบกลับ
- โดยค่าเริ่มต้น DM ระดับบนสุดของ Slack จะอยู่นอกเธรด จึงไม่แสดงตัวอย่างสตรีม/สถานะแบบเนทีฟในลักษณะเธรดของ Slack; OpenClaw จะโพสต์และแก้ไขตัวอย่างฉบับร่างใน DM แทน
- สื่อและเพย์โหลดที่ไม่ใช่ข้อความจะย้อนกลับไปใช้การส่งตามปกติ
- ผลลัพธ์สุดท้ายที่เป็นสื่อ/ข้อผิดพลาดจะยกเลิกการแก้ไขตัวอย่างที่รอดำเนินการ; ผลลัพธ์สุดท้ายที่เป็นข้อความ/บล็อกและเข้าเกณฑ์จะส่งออกให้ครบเฉพาะเมื่อสามารถแก้ไขตัวอย่างเดิมได้
- หากการสตรีมล้มเหลวระหว่างการตอบกลับ OpenClaw จะย้อนกลับไปใช้การส่งตามปกติสำหรับเพย์โหลดที่เหลือ

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
- ค่าบูลีน `channels.slack.streaming` เป็นนามแฝงแบบเดิมของ `channels.slack.streaming.mode` และ `channels.slack.streaming.nativeTransport`
- `channels.slack.chunkMode` และ `channels.slack.nativeStreaming` ระดับบนสุดเป็นนามแฝงแบบเดิมของ `channels.slack.streaming.chunkMode` และ `channels.slack.streaming.nativeTransport`
- ระบบจะไม่อ่านนามแฝงแบบเดิมขณะรันไทม์ ให้เรียกใช้ `openclaw doctor --fix` เพื่อเขียนการกำหนดค่าการสตรีมของ Slack ที่บันทึกไว้ใหม่ด้วยคีย์มาตรฐาน

## ปฏิกิริยาสำรองขณะกำลังพิมพ์

`typingReaction` เพิ่มปฏิกิริยาชั่วคราวให้ข้อความ Slack ขาเข้าขณะที่ OpenClaw กำลังประมวลผลคำตอบ แล้วนำปฏิกิริยานั้นออกเมื่อการรันเสร็จสิ้น ฟีเจอร์นี้มีประโยชน์มากที่สุดนอกการตอบกลับในเธรด ซึ่งใช้ตัวบ่งชี้สถานะ "is typing..." เริ่มต้น

ลำดับการเลือกใช้:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

หมายเหตุ:

- Slack ต้องการรหัสย่อ (ตัวอย่างเช่น `"hourglass_flowing_sand"`)
- ปฏิกิริยานี้ทำงานแบบพยายามให้ดีที่สุด และระบบจะพยายามล้างออกโดยอัตโนมัติหลังจากเส้นทางการตอบกลับหรือความล้มเหลวเสร็จสิ้น

## อินพุตเสียง

หากต้องการพูดกับ OpenClaw ใน Slack ให้ส่งคลิปเสียง Slack ไปยังแอป OpenClaw ไมโครโฟนสำหรับการป้อนตามคำบอกของ Slackbot เป็นฟีเจอร์แยกต่างหากที่ Slack เป็นเจ้าของ ไม่ใช่ API ของแอป

- **[การป้อนตามคำบอกด้วยเสียงของ Slackbot](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** อยู่ภายในการสนทนา Slackbot ส่วนตัวของผู้ใช้ Slack แปลงการบันทึกเป็นพรอมต์ของ Slackbot แต่ไม่ส่งไฟล์เสียง เหตุการณ์การป้อนตามคำบอก พรอมต์ หรือเครื่องหมายระบุแหล่งอินพุตให้แอป Slack ของบุคคลที่สามผ่าน Events API Plugin Slack ของ OpenClaw ไม่สามารถเปิดใช้งานหรือรับข้อมูลดังกล่าวได้
- **[คลิปเสียง Slack](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** เป็นไฟล์ที่ Slack จัดเก็บไว้ ซึ่งสามารถโพสต์ใน DM ช่อง หรือเธรดของ OpenClaw ได้ OpenClaw ดาวน์โหลดคลิปที่เข้าถึงได้โดยใช้โทเค็นบอต ปรับข้อมูลเมตา MIME ของคลิปจาก Slack ให้เป็นมาตรฐาน และส่งผ่าน[ไปป์ไลน์การถอดเสียง](/th/nodes/audio)ที่ใช้ร่วมกัน รายการกำหนดค่าแอปที่แนะนำมีขอบเขต `files:read` ที่จำเป็น

คลิปเสียงและการป้อนตามคำบอกของ Slackbot มีความหมายด้านความเป็นส่วนตัวต่างกัน กล่าวคือ คลิปจะเป็นไปตามนโยบายการเก็บรักษาไฟล์ของ Slack และ OpenClaw จะดาวน์โหลดคลิปเพื่อถอดเสียง ขณะที่ Slack ระบุว่าไม่มีการจัดเก็บเสียงจากการป้อนตามคำบอก

ในช่องที่มี `requireMention: true` คลิปเสียงที่ไม่มีคำบรรยายสามารถผ่านเกณฑ์ได้ด้วยการพูดรูปแบบการกล่าวถึงที่กำหนดไว้ (`agents.list[].groupChat.mentionPatterns` โดยใช้ `messages.groupChat.mentionPatterns` เป็นค่าสำรอง) OpenClaw จะอนุญาตผู้ส่งก่อนดาวน์โหลดหรือถอดเสียงคลิป จากนั้นจึงยอมรับคลิปเฉพาะเมื่อข้อความถอดเสียงตรงกับรูปแบบ ระบบจะทิ้งข้อความถอดเสียงเชิงคาดการณ์ที่ล้มเหลวหรือไม่ตรงกันพร้อมกับคลิปที่ดาวน์โหลด และจะไม่เก็บไว้ในประวัติช่อง ไม่สามารถอนุมานข้อมูลประจำตัว `@bot` แบบเนทีฟของ Slack จากเสียงพูดได้ ดังนั้นให้กำหนดค่ารูปแบบชื่อที่ใช้พูดหรือใส่การกล่าวถึงด้วยข้อความ หากเปิดใช้การสะท้อนข้อความถอดเสียง ระบบจะส่งข้อความสะท้อนหลังจากยอมรับแล้วเท่านั้น

## สื่อ การแบ่งส่วน และการส่ง

<AccordionGroup>
  <Accordion title="ไฟล์แนบขาเข้า">
    ระบบจะดาวน์โหลดไฟล์แนบ Slack จาก URL ส่วนตัวที่โฮสต์โดย Slack (ขั้นตอนคำขอที่ยืนยันตัวตนด้วยโทเค็น) และเขียนลงในที่จัดเก็บสื่อเมื่อดึงข้อมูลสำเร็จและขนาดอยู่ภายในขีดจำกัด ตัวยึดตำแหน่งไฟล์มี `fileId` ของ Slack เพื่อให้เอเจนต์ดึงไฟล์ต้นฉบับด้วย `download-file` ได้

    การดาวน์โหลดใช้การหมดเวลาขณะไม่ได้ใช้งานและการหมดเวลารวมที่มีขอบเขตจำกัด หากการดึงไฟล์จาก Slack ค้างหรือล้มเหลว OpenClaw จะประมวลผลข้อความต่อและใช้ตัวยึดตำแหน่งไฟล์เป็นค่าสำรอง

    ขีดจำกัดขนาดขาเข้าขณะรันไทม์มีค่าเริ่มต้นเป็น `20MB` เว้นแต่จะถูกแทนที่ด้วย `channels.slack.mediaMaxMb`

  </Accordion>

  <Accordion title="ข้อความและไฟล์ขาออก">
    - ส่วนข้อความใช้ `channels.slack.textChunkLimit` (ค่าเริ่มต้น `8000` โดยจำกัดไม่เกินขีดจำกัดความยาวข้อความของ Slack)
    - `channels.slack.streaming.chunkMode="newline"` เปิดใช้การแบ่งโดยให้ย่อหน้ามาก่อน
    - การส่งไฟล์ใช้ API อัปโหลดของ Slack และสามารถรวมการตอบกลับในเธรดได้ (`thread_ts`)
    - คำบรรยายไฟล์ที่ยาวจะใช้ส่วนข้อความแรกที่ปลอดภัยสำหรับ Slack เป็นความคิดเห็นของการอัปโหลด และส่งส่วนที่เหลือเป็นข้อความติดตามผล
    - ขีดจำกัดสื่อขาออกใช้ `channels.slack.mediaMaxMb` เมื่อกำหนดค่าไว้ มิฉะนั้นการส่งผ่านช่องจะใช้ค่าเริ่มต้นตามชนิด MIME จากไปป์ไลน์สื่อ

  </Accordion>

  <Accordion title="เป้าหมายการส่ง">
    เป้าหมายแบบระบุชัดเจนที่แนะนำ:

    - `user:<id>` สำหรับ DM
    - `channel:<id>` สำหรับช่อง

    DM ของ Slack ที่มีเฉพาะข้อความ/บล็อกสามารถโพสต์ไปยัง ID ผู้ใช้ได้โดยตรง ส่วนการอัปโหลดไฟล์และการส่งในเธรดจะเปิด DM ผ่าน API การสนทนาของ Slack ก่อน เนื่องจากเส้นทางเหล่านั้นต้องใช้ ID การสนทนาที่เจาะจง

  </Accordion>
</AccordionGroup>

## คำสั่งและลักษณะการทำงานของเครื่องหมายทับ

คำสั่งเครื่องหมายทับปรากฏใน Slack เป็นคำสั่งเดียวที่กำหนดค่าไว้หรือหลายคำสั่งแบบเนทีฟ กำหนดค่า `channels.slack.slashCommand` เพื่อเปลี่ยนค่าเริ่มต้นของคำสั่ง:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

คำสั่งแบบเนทีฟต้องมี[การตั้งค่ารายการกำหนดค่าเพิ่มเติม](#additional-manifest-settings)ในแอป Slack และเปิดใช้งานด้วย `channels.slack.commands.native: true` หรือ `commands.native: true` ในการกำหนดค่าส่วนกลางแทน

- โหมดอัตโนมัติของคำสั่งแบบเนทีฟถูกตั้งเป็น **ปิด** สำหรับ Slack ดังนั้น `commands.native: "auto"` จะไม่เปิดใช้คำสั่งแบบเนทีฟของ Slack

```txt
/help
```

เมนูอาร์กิวเมนต์แบบเนทีฟจะแสดงผลเป็นหนึ่งในรูปแบบต่อไปนี้ตามลำดับความสำคัญ:

- ตัวเลือกที่สั้นเพียงพอ 3-5 รายการ: เมนูรายการเพิ่มเติม ("...")
- ตัวเลือกมากกว่า 100 รายการและมีการกรองตัวเลือกแบบอะซิงโครนัส: รายการเลือกภายนอก
- ตัวเลือก 1-2 รายการ หรือตัวเลือกใดก็ตามที่ค่าที่เข้ารหัสยาวเกินไปสำหรับรายการเลือก: บล็อกปุ่ม
- กรณีอื่น (ตัวเลือก 6-100 รายการ หรือมากกว่า 100 รายการโดยไม่มีการกรองแบบอะซิงโครนัส): เมนูรายการเลือกแบบคงที่ โดยแบ่งเป็นเมนูละ 100 ตัวเลือก

```txt
/think
```

เซสชันคำสั่งเครื่องหมายทับใช้คีย์แยกต่างหาก เช่น `agent:<agentId>:slack:slash:<userId>` และยังคงกำหนดเส้นทางการดำเนินการคำสั่งไปยังเซสชันการสนทนาเป้าหมายโดยใช้ `CommandTargetSessionKey`

## แผนภูมิแบบเนทีฟ

[บล็อก Block Kit `data_visualization`](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/) สาธารณะของ Slack
แสดงผลแผนภูมิเส้น แท่ง พื้นที่ และวงกลมในข้อความ OpenClaw จะแมปบล็อก
`presentation` `chart` แบบพกพาไปเป็นรูปแบบเนทีฟดังกล่าว โดยไม่จำเป็นต้องมีขอบเขต OAuth เพิ่มเติม
การอัปโหลดไฟล์ ตัวเรนเดอร์รูปภาพ หรือการกำหนดค่า Slack นอกเหนือจากสิทธิ์เข้าถึงข้อความ
`chat:write` ตามปกติ

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "Quarterly revenue",
      "categories": ["Q1", "Q2"],
      "series": [{ "name": "Revenue", "values": [120, 145] }],
      "xLabel": "Quarter"
    }
  ]
}
```

ระบบจะบังคับใช้ขีดจำกัดของ Slack ก่อนการแสดงผลแบบเนทีฟ:

- ชื่อและป้ายกำกับแกนที่ไม่บังคับ: 50 อักขระ
- วงกลม: ส่วนที่เป็นค่าบวก 1-12 ส่วน
- เส้น/แท่ง/พื้นที่: ชุดข้อมูลที่มีชื่อไม่ซ้ำกัน 1-12 ชุด และหมวดหมู่ที่ใช้ร่วมกัน 1-20 หมวดหมู่
- ป้ายกำกับส่วน หมวดหมู่ และชุดข้อมูล: 20 อักขระ
- ทุกชุดข้อมูลต้องมีค่าจำกัดหนึ่งค่าสำหรับแต่ละหมวดหมู่ ค่าที่ไม่ใช่วงกลม
  สามารถเป็นค่าลบได้

แผนภูมิแบบเนทีฟทุกแผนภูมิยังมีการแสดงผลเป็นข้อความระดับบนสุดสำหรับโปรแกรม
อ่านหน้าจอ การแจ้งเตือน การมิเรอร์เซสชัน และไคลเอนต์ที่ไม่สามารถแสดงผล
บล็อกได้ การส่งงานนำเสนอแบบมาตรฐานไปยังช่องอื่นของ OpenClaw จะได้รับ
ข้อมูลแผนภูมิแบบกำหนดแน่นอนชุดเดียวกันในรูปแบบข้อความ เว้นแต่ช่องนั้นจะประกาศว่ารองรับแผนภูมิแบบเนทีฟ หาก
Slack ปฏิเสธแผนภูมิด้วย `invalid_blocks` ระหว่างการทยอยเปิดใช้ OpenClaw
จะนำบล็อกข้อมูลแบบเนทีฟที่ถูกปฏิเสธออก เก็บตัวควบคุมข้างเคียงไว้ และส่ง
การแสดงผลแผนภูมิทั้งหมดเป็นข้อความที่มองเห็นได้

ปัจจุบัน Slack ยอมรับบล็อก `data_visualization` ได้สูงสุดสองบล็อกต่อข้อความ เมื่อ
งานนำเสนอมีแผนภูมิที่ถูกต้องมากกว่าสองแผนภูมิ OpenClaw จะรักษาลำดับ
และแสดงผลแบบเนทีฟต่อในข้อความติดตามผล โดยแต่ละข้อความมีแผนภูมิ
ไม่เกินสองแผนภูมิ

[การเปิดตัวสำหรับนักพัฒนาของ Slack](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
ระบุว่าบล็อกนี้เป็นฟีเจอร์ Block Kit สำหรับแอป และไม่ได้เผยแพร่ข้อจำกัด
ด้านแผนแบบชำระเงิน ข้อความเรื่องสิทธิ์ใช้งาน Business+/Enterprise ใช้กับ
การสร้างแผนภูมิด้วย AI อัตโนมัติของ Slackbot ซึ่งแยกจากการที่แอปส่ง
แผนภูมิ Block Kit ที่มีโครงสร้างอยู่แล้ว แผนภูมิเป็นบล็อกสำหรับข้อความเท่านั้น ไม่ใช่เนื้อหาใน App
Home โมดอล หรือ Canvas

## ตารางแบบเนทีฟ

[บล็อก Block Kit `data_table`](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/) ปัจจุบันของ Slack
แสดงผลแถวและคอลัมน์ที่มีโครงสร้างในข้อความ OpenClaw จะแมป
บล็อก `presentation` `table` แบบพกพาที่ระบุชัดเจนไปยัง `data_table` โดยไม่ใช้
[บล็อก `table`](https://docs.slack.dev/reference/block-kit/blocks/table-block/) แบบเดิมของ Slack
ไม่จำเป็นต้องมีขอบเขต OAuth หรือการกำหนดค่า Slack เพิ่มเติมนอกเหนือจาก
สิทธิ์เข้าถึงข้อความ `chat:write` ตามปกติ

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "Open pipeline",
      "headers": ["Account", "Stage", "ARR"],
      "rows": [
        ["Acme", "Won", 125000],
        ["Globex", "Review", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw จะแมปส่วนหัวและเซลล์สตริงไปยังเซลล์ `raw_text` ของ Slack เซลล์ตัวเลข
จะแมปไปยัง `raw_number` โดยรักษาค่าตัวเลขจำกัดไว้สำหรับการเรียงลำดับ
และการกรองแบบเนทีฟ เมื่อมี `rowHeaderColumnIndex` ค่านี้จะกำหนดให้คอลัมน์
ฐานศูนย์ดังกล่าวเป็นส่วนหัวแถวของ Slack

ระบบจะบังคับใช้ขีดจำกัด `data_table` ที่ Slack เผยแพร่ก่อนการแสดงผลแบบเนทีฟ:

- 1-20 คอลัมน์
- แถวข้อมูล 1-100 แถว รวมกับแถวส่วนหัว
- ทุกแถวต้องมีจำนวนเซลล์เท่ากัน
- อักขระรวมสูงสุด 10,000 อักขระในเซลล์ตารางทั้งหมดของหนึ่งข้อความ

บล็อกตารางที่ถูกต้องหลายบล็อกสามารถแสดงผลแบบเนทีฟได้ตราบใดที่ข้อความ
ยังอยู่ภายในขีดจำกัดอักขระรวม ตารางที่ไม่สามารถแสดงผลภายในขอบเขต
แบบเนทีฟจะกลายเป็นข้อความแบบกำหนดแน่นอนที่สมบูรณ์แทน เพื่อไม่ให้แถวหรือ
เซลล์สูญหาย หากข้อความดังกล่าวยาวเกินหนึ่งข้อความ Slack การส่งและการตอบกลับคำสั่งเครื่องหมายทับจะใช้
ส่วนข้อความตามลำดับ การแก้ไขตารางจะล้มเหลวพร้อมข้อผิดพลาดด้านขนาดที่ชัดเจน แทนที่จะ
ตัดแถวออกจากข้อความที่มีอยู่โดยไม่แจ้งให้ทราบ

ตารางแบบเนทีฟทุกตารางที่สร้างจากงานนำเสนอแบบพกพายังมี
การแสดงผลเป็นข้อความระดับบนสุดสำหรับโปรแกรมอ่านหน้าจอ การแจ้งเตือน การมิเรอร์เซสชัน และ
ไคลเอนต์ที่ไม่สามารถแสดงผลบล็อกได้ ค่าแผนภูมิและตารางดิบจะคงรูปแบบตามตัวอักษร
ในข้อความสำรอง เพื่อให้ข้อมูลเซลล์ เช่น `<@U123>` ไม่กลายเป็นการกล่าวถึงใน Slack
หาก Slack ปฏิเสธบล็อกแผนภูมิหรือตารางแบบเนทีฟด้วย `invalid_blocks` OpenClaw
จะนำบล็อกข้อมูลแบบเนทีฟทั้งหมดออกในขั้นตอนการกู้คืนที่มีขอบเขตจำกัดเพียงครั้งเดียว เก็บ
บล็อกข้างเคียงที่ถูกต้อง เช่น ปุ่มและรายการเลือก และส่งข้อความแผนภูมิ
และตารางที่มองเห็นได้อย่างครบถ้วนโดยปิดการจัดรูปแบบของ Slack การส่งคำสั่งเครื่องหมายทับ
จะติดตามงบประมาณ `response_url` จำนวนห้าครั้งของ Slack ตลอดทั้งคำสั่ง ก่อนการตอบกลับ
แต่ละชุด ระบบจะเลือกแผนที่สมบูรณ์ซึ่งใช้จำนวนครั้งที่เหลือได้พอดี หรือแจ้งความล้มเหลว
ก่อนโพสต์ชุดนั้น

เฉพาะบล็อกตาราง `presentation` ที่ระบุชัดเจนเท่านั้นที่จะถูกยกระดับเป็นตารางแบบเนทีฟ
ตารางแบบไปป์ของ Markdown ยังคงเป็นข้อความตามที่เขียน OpenClaw จะไม่คาดเดาโครงสร้าง
ตารางหรือชนิดเซลล์ ผู้สร้างเนื้อหาแบบเนทีฟของ Slack ที่เชื่อถือได้ซึ่งมีอยู่แล้วสามารถ
ส่งบล็อกดิบผ่าน `channelData.slack.blocks` ต่อไปได้ OpenClaw จะสร้างข้อความสำรอง
จากเซลล์ `data_table` ดิบที่ถูกต้อง ส่วนบล็อกแบบกำหนดเองที่มีรูปแบบไม่ถูกต้องอาจ
ลดระดับเหลือเพียงคำบรรยายหรือข้อความสำรองทั่วไปของ Block Kit เอาต์พุตจากเอเจนต์ CLI
และ Plugin แบบพกพาควรใช้ `presentation`

## การตอบกลับแบบโต้ตอบ

Slack สามารถแสดงตัวควบคุมการตอบกลับแบบโต้ตอบที่เอเจนต์สร้างขึ้นได้ แต่ฟีเจอร์นี้ปิดใช้งานโดยค่าเริ่มต้น
สำหรับเอาต์พุตใหม่จากเอเจนต์, CLI และ Plugin ให้เลือกใช้บล็อกปุ่มหรือบล็อกตัวเลือก
`presentation` ที่ใช้ร่วมกัน บล็อกเหล่านี้ใช้เส้นทางการโต้ตอบของ Slack เดียวกัน
และยังลดระดับการทำงานได้ในช่องทางอื่น

เปิดใช้งานทั่วทั้งระบบ:

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

หรือเปิดใช้งานเฉพาะบัญชี Slack บัญชีเดียว:

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

เมื่อเปิดใช้งาน เอเจนต์ยังคงสามารถส่งไดเรกทีฟการตอบกลับที่ใช้ได้เฉพาะกับ Slack ซึ่งเลิกแนะนำให้ใช้แล้ว:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

ไดเรกทีฟเหล่านี้จะคอมไพล์เป็น Slack Block Kit และส่งต่อการคลิกหรือการเลือก
กลับผ่านเส้นทางเหตุการณ์การโต้ตอบของ Slack ที่มีอยู่ เก็บไว้สำหรับพรอมต์เก่า
และช่องทางสำรองเฉพาะ Slack ส่วนตัวควบคุมแบบพกพาใหม่ให้ใช้การนำเสนอที่ใช้ร่วมกัน

API ของคอมไพเลอร์ไดเรกทีฟก็เลิกแนะนำให้ใช้สำหรับโค้ดผู้สร้างใหม่เช่นกัน:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

ใช้เพย์โหลด `presentation` และ `buildSlackPresentationBlocks(...)` สำหรับตัวควบคุมใหม่
ที่แสดงผลใน Slack

หมายเหตุ:

- นี่คือ UI แบบเดิมเฉพาะ Slack ช่องทางอื่นจะไม่แปลงไดเรกทีฟ Slack Block
  Kit เป็นระบบปุ่มของตนเอง
- ค่าคอลแบ็กแบบโต้ตอบเป็นโทเค็นทึบที่ OpenClaw สร้างขึ้น ไม่ใช่ค่าดิบที่เอเจนต์สร้างขึ้น
- หากบล็อกแบบโต้ตอบที่สร้างขึ้นจะเกินขีดจำกัดของ Slack Block Kit OpenClaw จะย้อนกลับไปใช้ข้อความตอบกลับเดิมแทนการส่งเพย์โหลดบล็อกที่ไม่ถูกต้อง

### การส่งโมดอลที่ Plugin เป็นเจ้าของ

Plugin ของ Slack ที่ลงทะเบียนตัวจัดการแบบโต้ตอบยังสามารถรับเหตุการณ์วงจรชีวิตของโมดอล
`view_submission` และ `view_closed` ก่อนที่ OpenClaw จะทำ Compaction
เพย์โหลดสำหรับเหตุการณ์ระบบที่เอเจนต์มองเห็น ใช้รูปแบบการกำหนดเส้นทางอย่างใดอย่างหนึ่งต่อไปนี้
เมื่อเปิดโมดอล Slack:

- ตั้งค่า `callback_id` เป็น `openclaw:<namespace>:<payload>`
- หรือคง `callback_id` ที่มีอยู่ไว้ และใส่ `pluginInteractiveData:
"<namespace>:<payload>"` ใน `private_metadata` ของโมดอล

ตัวจัดการจะได้รับ `ctx.interaction.kind` ในรูปแบบ `view_submission` หรือ
`view_closed`, `inputs` ที่ปรับให้เป็นมาตรฐานแล้ว และออบเจ็กต์ดิบ `stateValues` แบบเต็มจาก
Slack การกำหนดเส้นทางด้วยรหัสคอลแบ็กเพียงอย่างเดียวก็เพียงพอสำหรับเรียกตัวจัดการ Plugin; ให้รวม
ฟิลด์การกำหนดเส้นทางผู้ใช้/เซสชัน `private_metadata` ของโมดอลที่มีอยู่
เมื่อโมดอลควรสร้างเหตุการณ์ระบบที่เอเจนต์มองเห็นด้วย เอเจนต์จะได้รับ
เหตุการณ์ระบบ `Slack interaction: ...` แบบย่อและปกปิดข้อมูล หากตัวจัดการส่งคืน
`systemEvent.summary`, `systemEvent.reference` หรือ `systemEvent.data`
ฟิลด์เหล่านั้นจะรวมอยู่ในเหตุการณ์แบบย่อ เพื่อให้เอเจนต์อ้างอิง
พื้นที่จัดเก็บที่ Plugin เป็นเจ้าของได้โดยไม่เห็นเพย์โหลดแบบฟอร์มทั้งหมด

## การอนุมัติแบบเนทีฟใน Slack

Slack สามารถทำหน้าที่เป็นไคลเอนต์การอนุมัติแบบเนทีฟที่มีปุ่มและการโต้ตอบ แทนการย้อนกลับไปใช้ Web UI หรือเทอร์มินัล

- การอนุมัติ Exec และ Plugin สามารถแสดงเป็นพรอมต์ Block Kit แบบเนทีฟของ Slack
- `channels.slack.execApprovals.*` ยังคงเป็นการตั้งค่าเปิดใช้งานไคลเอนต์การอนุมัติ Exec แบบเนทีฟและการกำหนดเส้นทาง DM/ช่องทาง
- DM การอนุมัติ Exec ใช้ `channels.slack.execApprovals.approvers` หรือ `commands.ownerAllowFrom`
- การอนุมัติ Plugin ใช้ปุ่มแบบเนทีฟของ Slack เมื่อเปิดใช้งาน Slack เป็นไคลเอนต์การอนุมัติแบบเนทีฟสำหรับเซสชันต้นทาง หรือเมื่อ `approvals.plugin` กำหนดเส้นทางไปยังเซสชัน Slack ต้นทางหรือเป้าหมาย Slack
- DM การอนุมัติ Plugin ใช้ผู้อนุมัติ Plugin ของ Slack จาก `channels.slack.allowFrom`, `allowFrom` ของบัญชีที่ระบุชื่อ หรือเส้นทางเริ่มต้นของบัญชี
- ยังคงบังคับใช้การให้สิทธิ์ผู้อนุมัติ: ผู้อนุมัติเฉพาะ Exec ไม่สามารถอนุมัติคำขอ Plugin ได้ เว้นแต่จะเป็นผู้อนุมัติ Plugin ด้วย

การทำงานนี้ใช้พื้นผิวปุ่มอนุมัติที่ใช้ร่วมกันแบบเดียวกับช่องทางอื่น เมื่อเปิดใช้งาน `interactivity` ในการตั้งค่าแอป Slack ของคุณ พรอมต์การอนุมัติจะแสดงเป็นปุ่ม Block Kit โดยตรงในการสนทนา
เมื่อมีปุ่มเหล่านั้น ปุ่มจะเป็น UX หลักสำหรับการอนุมัติ; OpenClaw
ควรรวมคำสั่ง `/approve` แบบดำเนินการเองเฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่า
การอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบดำเนินการเองเป็นเส้นทางเดียว

เส้นทางการกำหนดค่า:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (ไม่บังคับ; ย้อนกลับไปใช้ `commands.ownerAllowFrom` เมื่อทำได้)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
- `agentFilter`, `sessionFilter`

Slack เปิดใช้งานการอนุมัติ Exec แบบเนทีฟโดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `enabled` หรือเป็น `"auto"` และสามารถระบุ
ผู้อนุมัติ Exec ได้อย่างน้อยหนึ่งราย Slack ยังสามารถจัดการการอนุมัติ Plugin แบบเนทีฟผ่านเส้นทางไคลเอนต์แบบเนทีฟนี้
เมื่อสามารถระบุผู้อนุมัติ Plugin ของ Slack ได้และคำขอตรงกับตัวกรองของไคลเอนต์แบบเนทีฟ ตั้งค่า
`enabled: false` เพื่อปิดใช้ Slack เป็นไคลเอนต์การอนุมัติแบบเนทีฟอย่างชัดเจน ตั้งค่า `enabled: true` เพื่อ
บังคับเปิดการอนุมัติแบบเนทีฟเมื่อสามารถระบุผู้อนุมัติได้ การปิดการอนุมัติ Exec ของ Slack ไม่ได้ปิด
การส่งการอนุมัติ Plugin แบบเนทีฟของ Slack ที่เปิดใช้งานผ่าน `approvals.plugin`; การส่งการอนุมัติ Plugin
จะใช้ผู้อนุมัติ Plugin ของ Slack แทน

พฤติกรรมเริ่มต้นเมื่อไม่มีการกำหนดค่าการอนุมัติ Exec ของ Slack อย่างชัดเจน:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

จำเป็นต้องมีการกำหนดค่าแบบเนทีฟของ Slack อย่างชัดเจนเฉพาะเมื่อต้องการแทนที่ผู้อนุมัติ เพิ่มตัวกรอง หรือ
เลือกใช้การส่งไปยังแชตต้นทาง:

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

การส่งต่อ `approvals.exec` ที่ใช้ร่วมกันเป็นอีกส่วนหนึ่ง ใช้เฉพาะเมื่อพรอมต์การอนุมัติ Exec ต้อง
กำหนดเส้นทางไปยังแชตอื่นหรือเป้าหมายนอกแบนด์ที่ระบุอย่างชัดเจนด้วย การส่งต่อ `approvals.plugin` ที่ใช้ร่วมกันก็เป็น
อีกส่วนหนึ่งเช่นกัน; การส่งแบบเนทีฟของ Slack จะระงับทางเลือกสำรองนั้นเฉพาะเมื่อ Slack สามารถจัดการคำขอ
อนุมัติ Plugin แบบเนทีฟได้

`/approve` ในแชตเดียวกันยังทำงานในช่องทาง Slack และ DM ที่รองรับคำสั่งอยู่แล้ว ดูโมเดลการส่งต่อการอนุมัติทั้งหมดได้ที่ [การอนุมัติ Exec](/th/tools/exec-approvals)

## เหตุการณ์และพฤติกรรมการดำเนินงาน

- การแก้ไข/ลบข้อความจะถูกแมปเป็นเหตุการณ์ระบบ
- การเผยแพร่เธรด ("Also send to channel" สำหรับการตอบกลับในเธรด) จะถูกประมวลผลเป็นข้อความผู้ใช้ปกติ
- เหตุการณ์เพิ่ม/ลบรีแอ็กชันจะถูกแมปเป็นเหตุการณ์ระบบ
- เหตุการณ์สมาชิกเข้าร่วม/ออกจากระบบ การสร้าง/เปลี่ยนชื่อช่องทาง และการเพิ่ม/ลบหมุดจะถูกแมปเป็นเหตุการณ์ระบบ
- การสำรวจสถานะแบบเลือกใช้สามารถแมปการเปลี่ยน `away` เป็น `active` ของผู้เข้าร่วมที่เป็นมนุษย์ซึ่งตรวจพบ ไปยังเซสชัน Slack ที่มีสิทธิ์และใช้งานล่าสุดของผู้เข้าร่วมนั้น ค่าเริ่มต้นคือปิด
- `channel_id_changed` สามารถย้ายคีย์การกำหนดค่าช่องทางเมื่อเปิดใช้งาน `configWrites`
- ข้อมูลเมตาหัวข้อ/วัตถุประสงค์ของช่องทางถือเป็นบริบทที่ไม่น่าเชื่อถือและสามารถแทรกเข้าในบริบทการกำหนดเส้นทางได้
- บริบทเริ่มต้นของเธรดและการเติมบริบทจากประวัติเธรดช่วงแรกจะถูกกรองตามรายการผู้ส่งที่อนุญาตซึ่งกำหนดค่าไว้เมื่อเกี่ยวข้อง
- การดำเนินการกับบล็อก ทางลัด และการโต้ตอบกับโมดอลจะส่งเหตุการณ์ระบบ `Slack interaction: ...` แบบมีโครงสร้างพร้อมฟิลด์เพย์โหลดที่สมบูรณ์:
  - การดำเนินการกับบล็อก: ค่าที่เลือก ป้ายกำกับ ค่าตัวเลือก และข้อมูลเมตา `workflow_*`
  - ทางลัดส่วนกลาง: ข้อมูลเมตาคอลแบ็กและผู้ดำเนินการ ซึ่งกำหนดเส้นทางไปยังเซสชันโดยตรงของผู้ดำเนินการ
  - ทางลัดข้อความ: บริบทของคอลแบ็ก ผู้ดำเนินการ ช่องทาง เธรด และข้อความที่เลือก
  - เหตุการณ์โมดอล `view_submission` และ `view_closed` พร้อมข้อมูลเมตาช่องทางที่กำหนดเส้นทางและอินพุตแบบฟอร์ม

กำหนดทางลัดส่วนกลางหรือทางลัดข้อความในการกำหนดค่าแอป Slack และใช้รหัสคอลแบ็กใดก็ได้ที่ไม่ว่าง OpenClaw จะรับทราบเพย์โหลดทางลัดที่ตรงกัน ใช้นโยบายผู้ส่งสำหรับ DM/ช่องทางแบบเดียวกับการโต้ตอบอื่นของ Slack และจัดคิวเหตุการณ์ที่ผ่านการล้างข้อมูลสำหรับเซสชันเอเจนต์ที่กำหนดเส้นทาง Trigger ID และ URL ตอบกลับจะถูกปกปิดจากบริบทของเอเจนต์

### เหตุการณ์สถานะ

Slack ไม่ส่งการเปลี่ยนแปลงสถานะผ่าน Events API หรือ Socket Mode แต่ OpenClaw สามารถสำรวจ [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/) สำหรับผู้เข้าร่วมที่เป็นมนุษย์ซึ่งข้อความผ่านการตรวจสอบการเข้าถึงและการกำหนดเส้นทางปกติของ Slack

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
- `auto`: ตรวจสอบ DM, MPIM และเธรด Slack ที่ใช้งานในช่วง 24 ชั่วโมงล่าสุด โดยมีผู้เข้าร่วมที่เป็นมนุษย์ซึ่งตรวจพบได้สูงสุด 8 คน ไม่รวมเซสชันช่องทางระดับบนสุด
- `on`: ตรวจสอบการสนทนาเดียวกันโดยไม่จำกัดจำนวนผู้เข้าร่วมและรวมเซสชันช่องทางระดับบนสุด ใช้การแทนที่ต่อช่องทางเพื่อบังคับใช้หรือระงับช่องทางหนึ่ง

OpenClaw สำรวจผู้ใช้ที่ไม่ซ้ำกันสูงสุด 45 คนต่อนาทีต่อบัญชี Slack เติมผลลัพธ์แรกโดยไม่ปลุกเอเจนต์ และปลุกเฉพาะเมื่อพบการเปลี่ยนจาก `away` เป็น `active` มีคูลดาวน์ถาวร 8 ชั่วโมงต่อบัญชี Slack และต่อผู้ใช้ แม้ว่าบุคคลนั้นจะเข้าร่วมหลายเธรดก็ตาม เหตุการณ์จะถูกกำหนดเส้นทางไปยังการสนทนาที่มีสิทธิ์และใช้งานล่าสุดของบุคคลนั้นเท่านั้น และแจ้งให้เอเจนต์ตรวจสอบหน่วยความจำ/วิกิและบริบทเขตเวลาที่ทราบ ก่อนตัดสินใจว่าจะส่งคำทักทายสั้น ๆ หนึ่งข้อความหรือไม่ เอเจนต์อาจไม่ตอบ

โทเค็นบอตต้องมี `users:read` ซึ่งรวมอยู่ในแมนิเฟสต์ที่แนะนำแล้ว เหตุการณ์สถานะไม่พร้อมใช้งานสำหรับการติดตั้งทั่วทั้งองค์กร Enterprise Grid

## ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก: [ข้อมูลอ้างอิงการกำหนดค่า - Slack](/th/gateway/config-channels#slack)

<Accordion title="ฟิลด์ Slack ที่มีสัญญาณสูง">

- โหมด/การยืนยันตัวตน: `identity`, `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `userToken`, `signingSecret`, `webhookPath`, `accounts.*`
- การเข้าถึง DM: `dm.enabled`, `dmPolicy`, `allowFrom` (แบบเดิม: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- ตัวสลับความเข้ากันได้: `dangerouslyAllowNameMatching` (ใช้ในกรณีฉุกเฉิน; ปิดไว้เว้นแต่จำเป็น)
- การเข้าถึงช่องทาง: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`, `implicitMentions.*`
- เธรด/ประวัติ: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- การปลุกด้วยสถานะ: `presenceEvents.mode`, `channels.*.presenceEvents.mode` (`off|auto|on`; ค่าเริ่มต้น `off`)
- การส่ง: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- การขยายตัวอย่าง: `unfurlLinks` (ค่าเริ่มต้น: `false`), `unfurlMedia` สำหรับการควบคุมตัวอย่างลิงก์/สื่อ `chat.postMessage`; ตั้งค่า `unfurlLinks: true` เพื่อเลือกกลับมาใช้ตัวอย่างลิงก์
- การดำเนินงาน/ฟีเจอร์: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการตอบกลับในช่องทาง">
    ตรวจสอบตามลำดับ:

    - `groupPolicy`
    - รายการอนุญาตของช่อง (`channels.slack.channels`) — **คีย์ต้องเป็น ID ของช่อง** (`C12345678`) ไม่ใช่ชื่อ (`#channel-name`) คีย์ที่อิงชื่อล้มเหลวโดยไม่แสดงข้อผิดพลาดภายใต้ `groupPolicy: "allowlist"` เนื่องจากโดยค่าเริ่มต้นการกำหนดเส้นทางช่องจะใช้ ID ก่อน วิธีค้นหา ID: คลิกขวาที่ช่องใน Slack → **Copy link** — ค่า `C...` ที่ท้าย URL คือ ID ของช่อง
    - `requireMention`
    - รายการอนุญาต `users` แยกตามช่อง
    - `messages.groupChat.visibleReplies`: คำขอทั่วไปในกลุ่ม/ช่องมีค่าเริ่มต้นเป็น `"automatic"` หากเลือกใช้ `"message_tool"` และบันทึกแสดงข้อความของผู้ช่วยโดยไม่มีการเรียก `message(action=send)` แสดงว่าโมเดลพลาดเส้นทางเครื่องมือส่งข้อความที่มองเห็นได้ ในโหมดนี้ข้อความสุดท้ายจะยังคงเป็นส่วนตัว ให้ตรวจสอบบันทึกแบบละเอียดของ Gateway เพื่อดูข้อมูลเมตาของเพย์โหลดที่ถูกระงับ หรือตั้งค่าเป็น `"automatic"` หากต้องการให้ทุกคำตอบสุดท้ายตามปกติของผู้ช่วยโพสต์ผ่านเส้นทางแบบเดิม
    - `messages.groupChat.unmentionedInbound`: หากเป็น `"room_event"` ข้อความสนทนาในช่องที่อนุญาตซึ่งไม่ได้กล่าวถึงบอตจะเป็นบริบทแวดล้อมและไม่มีการตอบกลับ เว้นแต่เอเจนต์จะเรียกเครื่องมือ `message` ดู [เหตุการณ์ห้องแวดล้อม](/th/channels/ambient-room-events)

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    คำสั่งที่เป็นประโยชน์:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="ข้อความ DM ถูกละเว้น">
    ตรวจสอบ:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (หรือ `channels.slack.dm.policy` แบบเดิม)
    - การอนุมัติการจับคู่/รายการอนุญาต (`dmPolicy: "open"` ยังคงต้องใช้ `channels.slack.allowFrom: ["*"]`)
    - DM แบบกลุ่มใช้การจัดการ MPIM ให้เปิดใช้ `channels.slack.dm.groupEnabled` และหากมีการกำหนดค่าไว้ ให้รวม MPIM ไว้ใน `channels.slack.dm.groupChannels`
    - เหตุการณ์ DM ของ Slack Assistant: บันทึกแบบละเอียดที่กล่าวถึง `drop message_changed`
      มักหมายความว่า Slack ส่งเหตุการณ์เธรด Assistant ที่มีการแก้ไขโดยไม่มี
      ผู้ส่งที่เป็นมนุษย์ซึ่งกู้คืนได้ในข้อมูลเมตาของข้อความ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="โหมด Socket เชื่อมต่อไม่ได้">
    ตรวจสอบโทเค็นบอตและโทเค็นแอป รวมถึงการเปิดใช้ Socket Mode ในการตั้งค่าแอป Slack
    App-Level Token ต้องมี `connections:write` และ Bot User OAuth Token
    ซึ่งเป็นโทเค็นบอตต้องเป็นของแอป/เวิร์กสเปซ Slack เดียวกันกับโทเค็นแอป

    หาก `openclaw channels status --probe --json` แสดง `botTokenStatus` หรือ
    `appTokenStatus: "configured_unavailable"` แสดงว่าบัญชี Slack
    ได้รับการกำหนดค่าแล้ว แต่รันไทม์ปัจจุบันไม่สามารถแก้ไขค่าที่อ้างอิงผ่าน SecretRef
    ได้

    บันทึกอย่าง `slack socket mode failed to start; retry ...` เป็นความล้มเหลว
    ในการเริ่มต้นที่กู้คืนได้ ส่วนขอบเขตสิทธิ์ที่ขาดหาย โทเค็นที่ถูกเพิกถอน และการยืนยันตัวตนที่ไม่ถูกต้องจะล้มเหลวทันที
    บันทึก `slack token mismatch ...` หมายความว่าโทเค็นบอตและโทเค็นแอป
    ดูเหมือนจะเป็นของแอป Slack คนละแอป ให้แก้ไขข้อมูลประจำตัวของแอป Slack

  </Accordion>

  <Accordion title="โหมด HTTP ไม่ได้รับเหตุการณ์">
    ตรวจสอบ:

    - ข้อมูลลับสำหรับการลงนาม
    - พาธ Webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - `webhookPath` ที่ไม่ซ้ำกันสำหรับแต่ละบัญชี HTTP
    - URL สาธารณะยุติ TLS และส่งต่อคำขอไปยังพาธของ Gateway
    - พาธ `request_url` ของแอป Slack ตรงกับ `channels.slack.webhookPath` ทุกประการ (ค่าเริ่มต้น `/slack/events`)

    หาก `signingSecretStatus: "configured_unavailable"` ปรากฏในสแนปช็อตบัญชี
    แสดงว่าบัญชี HTTP ได้รับการกำหนดค่าแล้ว แต่รันไทม์ปัจจุบันไม่สามารถ
    แก้ไขข้อมูลลับสำหรับการลงนามที่อ้างอิงผ่าน SecretRef ได้

    บันทึก `slack: webhook path ... already registered` ที่เกิดซ้ำหมายความว่าบัญชี HTTP สองบัญชี
    ใช้ `webhookPath` เดียวกัน ให้กำหนดพาธที่แตกต่างกันสำหรับแต่ละบัญชี

  </Accordion>

  <Accordion title="คำสั่งเนทีฟ/คำสั่งแบบสแลชไม่ทำงาน">
    ตรวจสอบว่าต้องการใช้แบบใด:

    - โหมดคำสั่งเนทีฟ (`channels.slack.commands.native: true`) พร้อมคำสั่งแบบสแลชที่ตรงกันซึ่งลงทะเบียนไว้ใน Slack
    - หรือโหมดคำสั่งแบบสแลชเดียว (`channels.slack.slashCommand.enabled: true`)

    Slack ไม่สร้างหรือลบคำสั่งแบบสแลชโดยอัตโนมัติ `commands.native: "auto"` ไม่ได้เปิดใช้คำสั่งเนทีฟของ Slack ให้ใช้ `true` และสร้างคำสั่งที่ตรงกันในแอป Slack ในโหมด HTTP คำสั่งแบบสแลชทุกคำสั่งของ Slack ต้องมี URL ของ Gateway ใน Socket Mode เพย์โหลดคำสั่งจะมาถึงผ่าน websocket และ Slack จะละเว้น `slash_commands[].url`

    ตรวจสอบ `commands.useAccessGroups` การให้สิทธิ์ DM รายการอนุญาตของช่อง
    และรายการอนุญาต `users` แยกตามช่องด้วย Slack ส่งคืนข้อผิดพลาดแบบชั่วคราวสำหรับ
    ผู้ส่งคำสั่งแบบสแลชที่ถูกบล็อก รวมถึง:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## ข้อมูลอ้างอิงสื่อแนบ

Slack สามารถแนบสื่อที่ดาวน์โหลดแล้วไปยังรอบการทำงานของเอเจนต์ได้ เมื่อการดาวน์โหลดไฟล์จาก Slack สำเร็จและขนาดไม่เกินขีดจำกัด คลิปเสียงสามารถถอดเสียงได้ ไฟล์ภาพสามารถส่งผ่านเส้นทางการทำความเข้าใจสื่อหรือส่งโดยตรงไปยังโมเดลตอบกลับที่รองรับการมองเห็น ส่วนไฟล์อื่นจะยังพร้อมใช้งานเป็นบริบทไฟล์ที่ดาวน์โหลดได้

### ประเภทสื่อที่รองรับ

| ประเภทสื่อ                     | แหล่งที่มา               | พฤติกรรมปัจจุบัน                                                                  | หมายเหตุ                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| คลิปเสียง Slack              | URL ไฟล์ Slack       | ดาวน์โหลดและกำหนดเส้นทางผ่านการถอดเสียงร่วม                          | ต้องใช้ `files:read` และโมเดลหรือ CLI `tools.media.audio` ที่ทำงานได้      |
| ภาพ JPEG / PNG / GIF / WebP | URL ไฟล์ Slack       | ดาวน์โหลดและแนบไปกับรอบการทำงานเพื่อการจัดการที่รองรับการมองเห็น                   | ขีดจำกัดต่อไฟล์: `channels.slack.mediaMaxMb` (ค่าเริ่มต้น 20 MB)                 |
| ไฟล์ PDF                      | URL ไฟล์ Slack       | ดาวน์โหลดและเปิดให้ใช้เป็นบริบทไฟล์สำหรับเครื่องมืออย่าง `download-file` หรือ `pdf` | ข้อมูลขาเข้าจาก Slack ไม่แปลง PDF เป็นอินพุตการมองเห็นภาพโดยอัตโนมัติ |
| ไฟล์อื่น                    | URL ไฟล์ Slack       | ดาวน์โหลดเมื่อทำได้และเปิดให้ใช้เป็นบริบทไฟล์                              | ไฟล์ไบนารีจะไม่ถูกจัดการเป็นอินพุตรูปภาพ                               |
| การตอบกลับในเธรด                 | ไฟล์ของข้อความเริ่มต้นเธรด | ไฟล์ของข้อความรากสามารถเติมเป็นบริบทได้เมื่อการตอบกลับไม่มีสื่อโดยตรง  | ข้อความเริ่มต้นที่มีเฉพาะไฟล์ใช้ตัวยึดตำแหน่งไฟล์แนบ                          |
| ข้อความหลายไฟล์            | ไฟล์ Slack หลายไฟล์ | แต่ละไฟล์ได้รับการประเมินแยกกัน                                              | การประมวลผลของ Slack จำกัดที่แปดไฟล์ต่อข้อความ                     |

### ไปป์ไลน์ขาเข้า

เมื่อข้อความ Slack ที่มีไฟล์แนบมาถึง:

1. OpenClaw ดาวน์โหลดไฟล์จาก URL ส่วนตัวของ Slack โดยใช้โทเค็นบอต
2. เมื่อสำเร็จ ระบบจะเขียนไฟล์ไปยังพื้นที่เก็บสื่อ
3. พาธสื่อที่ดาวน์โหลดและประเภทเนื้อหาจะถูกเพิ่มลงในบริบทขาเข้า
4. คลิปเสียงจะถูกกำหนดเส้นทางไปยังไปป์ไลน์การถอดเสียงร่วม ส่วนเส้นทางโมเดล/เครื่องมือที่รองรับภาพสามารถใช้ไฟล์แนบรูปภาพจากบริบทเดียวกันได้
5. ไฟล์อื่นจะยังพร้อมใช้งานเป็นข้อมูลเมตาของไฟล์หรือข้อมูลอ้างอิงสื่อสำหรับเครื่องมือที่จัดการไฟล์เหล่านั้นได้

### การสืบทอดไฟล์แนบจากรากของเธรด

เมื่อข้อความมาถึงในเธรด (มีพาเรนต์ `thread_ts`):

- หากการตอบกลับไม่มีสื่อโดยตรงและข้อความรากที่รวมไว้มีไฟล์ Slack สามารถเติมไฟล์รากเป็นบริบทของข้อความเริ่มต้นเธรดได้
- ไฟล์รากจะถูกเติมเฉพาะขณะเริ่มต้นเซสชันเธรดใหม่หรือเซสชันที่รีเซ็ตแล้ว การตอบกลับที่มีเฉพาะข้อความในภายหลังจะใช้บริบทเซสชันเดิมซ้ำและไม่แนบไฟล์รากอีกครั้งเป็นสื่อใหม่
- ไฟล์แนบโดยตรงในการตอบกลับมีลำดับความสำคัญเหนือไฟล์แนบของข้อความราก
- ข้อความรากที่มีเฉพาะไฟล์และไม่มีข้อความจะแสดงด้วยตัวยึดตำแหน่งไฟล์แนบ เพื่อให้เส้นทางสำรองยังสามารถรวมไฟล์ของข้อความนั้นได้

### การจัดการไฟล์แนบหลายไฟล์

เมื่อข้อความ Slack เดียวมีไฟล์แนบหลายไฟล์:

- ไฟล์แนบแต่ละไฟล์จะได้รับการประมวลผลแยกกันผ่านไปป์ไลน์สื่อ
- ข้อมูลอ้างอิงสื่อที่ดาวน์โหลดจะถูกรวมไว้ในบริบทข้อความ
- ลำดับการประมวลผลเป็นไปตามลำดับไฟล์ของ Slack ในเพย์โหลดเหตุการณ์
- ความล้มเหลวในการดาวน์โหลดไฟล์แนบหนึ่งไฟล์จะไม่ขัดขวางไฟล์อื่น

### ขีดจำกัดด้านขนาด การดาวน์โหลด และโมเดล

- **ขีดจำกัดขนาด**: ค่าเริ่มต้น 20 MB ต่อไฟล์ กำหนดค่าได้ผ่าน `channels.slack.mediaMaxMb`
- **ขีดจำกัดการถอดเสียง**: `tools.media.audio.maxBytes` จะมีผลด้วยเมื่อไฟล์ที่ดาวน์โหลดถูกส่งไปยังผู้ให้บริการถอดเสียงหรือ CLI
- **การดาวน์โหลดล้มเหลว**: ไฟล์ที่ Slack ไม่สามารถให้บริการได้, URL ที่หมดอายุ, ไฟล์ที่เข้าถึงไม่ได้, ไฟล์ที่มีขนาดเกินกำหนด และการตอบกลับ HTML สำหรับการยืนยันตัวตน/เข้าสู่ระบบ Slack จะถูกข้ามแทนที่จะรายงานว่าเป็นรูปแบบที่ไม่รองรับ
- **โมเดลการมองเห็น**: การวิเคราะห์ภาพใช้โมเดลตอบกลับที่ใช้งานอยู่เมื่อโมเดลนั้นรองรับการมองเห็น หรือใช้โมเดลรูปภาพที่กำหนดค่าไว้ที่ `agents.defaults.imageModel`

### ขีดจำกัดที่ทราบ

| สถานการณ์                                      | พฤติกรรมปัจจุบัน                                                                   | วิธีแก้ชั่วคราว                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| URL ไฟล์ Slack หมดอายุ                        | ข้ามไฟล์และไม่แสดงข้อผิดพลาด                                                       | อัปโหลดไฟล์ใน Slack อีกครั้ง                                                   |
| การถอดเสียงไม่พร้อมใช้งาน               | คลิปยังคงแนบอยู่แต่ไม่มีการสร้างข้อความถอดเสียง                                | กำหนดค่า `tools.media.audio` หรือติดตั้ง CLI ถอดเสียงภายในเครื่องที่รองรับ  |
| คลิปที่ไม่มีคำบรรยายไม่ผ่านเกตการกล่าวถึง | ถูกทิ้งหลังการถอดเสียงเชิงคาดการณ์แบบส่วนตัว โดยข้อความถอดเสียงและไฟล์ที่ดาวน์โหลดจะถูกลบ | กำหนดรูปแบบการกล่าวถึงชื่อด้วยเสียง เพิ่มการกล่าวถึงบอตด้วยข้อความ หรือใช้ DM |
| ไม่ได้กำหนดค่าโมเดลการมองเห็น                   | ไฟล์แนบรูปภาพถูกจัดเก็บเป็นข้อมูลอ้างอิงสื่อ แต่ไม่ได้รับการวิเคราะห์เป็นภาพ       | กำหนดค่า `agents.defaults.imageModel` หรือใช้โมเดลตอบกลับที่รองรับการมองเห็น    |
| รูปภาพขนาดใหญ่มาก (> 20 MB โดยค่าเริ่มต้น)        | ถูกข้ามตามขีดจำกัดขนาด                                                               | เพิ่ม `channels.slack.mediaMaxMb` หาก Slack อนุญาต                          |
| ไฟล์แนบที่ส่งต่อ/แชร์                  | ข้อความและสื่อรูปภาพ/ไฟล์ที่โฮสต์โดย Slack จะทำงานแบบพยายามอย่างดีที่สุด                             | แชร์โดยตรงอีกครั้งในเธรด OpenClaw                                      |
| ไฟล์แนบ PDF                               | จัดเก็บเป็นบริบทไฟล์/สื่อ โดยไม่ถูกกำหนดเส้นทางผ่านการมองเห็นภาพโดยอัตโนมัติ        | ใช้ `download-file` สำหรับข้อมูลเมตาของไฟล์ หรือเครื่องมือ `pdf` สำหรับการวิเคราะห์ PDF      |

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
    ลักษณะการทำงานของช่องทางและ DM แบบกลุ่ม
  </Card>
  <Card title="การกำหนดเส้นทางช่องทาง" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="ความปลอดภัย" icon="shield" href="/th/gateway/security">
    แบบจำลองภัยคุกคามและการเสริมความแข็งแกร่ง
  </Card>
  <Card title="การกำหนดค่า" icon="sliders" href="/th/gateway/configuration">
    โครงสร้างและลำดับความสำคัญของการกำหนดค่า
  </Card>
  <Card title="คำสั่งแบบสแลช" icon="terminal" href="/th/tools/slash-commands">
    รายการคำสั่งและลักษณะการทำงาน
  </Card>
</CardGroup>
