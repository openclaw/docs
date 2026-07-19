---
read_when:
    - การสร้างหรือย้าย Plugin ช่องทางรับส่งข้อความ
    - การเปลี่ยนรายการอนุญาตของ DM หรือกลุ่ม เกตรูต การตรวจสอบสิทธิ์คำสั่ง การตรวจสอบสิทธิ์อีเวนต์ หรือการเปิดใช้งานด้วยการกล่าวถึง
    - การตรวจสอบการปกปิดข้อมูลขาเข้าของช่องทางหรือขอบเขตความเข้ากันได้ของ SDK
sidebarTitle: Channel Ingress
summary: API ขาเข้าของช่องทางรุ่นทดลองสำหรับการอนุญาตข้อความขาเข้า
title: API ขาเข้าของช่องทาง
x-i18n:
    generated_at: "2026-07-19T07:23:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 60feecb7bcf203cf37d2543a7855e89b5bfb2eb9d8263d804219e140facb8fc6
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

Channel ingress เป็นขอบเขตการควบคุมการเข้าถึงแบบทดลองสำหรับเหตุการณ์ขาเข้าของ
ช่องทาง Plugins เป็นเจ้าของข้อเท็จจริงของแพลตฟอร์มและผลข้างเคียง ส่วน core เป็นเจ้าของ
นโยบายทั่วไป ได้แก่ รายการอนุญาตของ DM/กลุ่ม, รายการ DM ใน pairing store, เกตเส้นทาง,
เกตคำสั่ง, การอนุญาตเหตุการณ์, การเปิดใช้งานด้วยการกล่าวถึง, การวินิจฉัยที่ปกปิดข้อมูล และ
การรับเข้า

ใช้ `openclaw/plugin-sdk/channel-ingress-runtime` สำหรับเส้นทางการรับ

## ตัวแก้ไข Runtime

```ts
import {
  defineStableChannelIngressIdentity,
  resolveChannelMessageIngress,
} from "openclaw/plugin-sdk/channel-ingress-runtime";

const identity = defineStableChannelIngressIdentity({
  key: "platform-user-id",
  normalize: normalizePlatformUserId,
  sensitivity: "pii",
});

const result = await resolveChannelMessageIngress({
  channelId: "my-channel",
  accountId,
  identity,
  subject: { stableId: platformUserId },
  conversation: { kind: isGroup ? "group" : "direct", id: conversationId },
  event: { kind: "message", authMode: "inbound", mayPair: !isGroup },
  policy: {
    dmPolicy: config.dmPolicy,
    groupPolicy: config.groupPolicy,
    groupAllowFromFallbackToAllowFrom: true,
  },
  allowFrom: config.allowFrom,
  groupAllowFrom: config.groupAllowFrom,
  accessGroups: cfg.accessGroups,
  route,
  readStoreAllowFrom,
  command: hasControlCommand ? { allowTextCommands: true, hasControlCommand } : undefined,
});
```

อย่าคำนวณรายการอนุญาตที่มีผล เจ้าของคำสั่ง หรือกลุ่มคำสั่งไว้ล่วงหน้า
ตัวแก้ไขจะหาอนุพันธ์ของค่าเหล่านี้จากรายการอนุญาตดิบ, callback ของ store, ตัวอธิบายเส้นทาง,
กลุ่มการเข้าถึง, นโยบาย และชนิดการสนทนา

## ผลลัพธ์

Plugins ที่รวมมากับระบบควรใช้ projection สมัยใหม่โดยตรง:

| ฟิลด์              | ความหมาย                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | การตัดสินใจของเกตตามลำดับและการรับเข้า                                |
| `senderAccess`     | การอนุญาตผู้ส่ง/การสนทนาเท่านั้น                             |
| `routeAccess`      | projection ของเส้นทางและผู้ส่งตามเส้นทาง                                  |
| `commandAccess`    | การอนุญาตคำสั่ง; `requested: false` เมื่อไม่ได้เรียกใช้เกตคำสั่ง |
| `activationAccess` | ผลลัพธ์การกล่าวถึง/การเปิดใช้งาน                                          |

การอนุญาตเหตุการณ์ยังคงมีอยู่ใน `ingress.graph` ตามลำดับและ
`ingress.reasonCode` ที่เป็นข้อยุติ โดยไม่มีการส่งออก projection ของเหตุการณ์แยกต่างหาก

ตัวช่วย SDK ของบุคคลที่สามที่เลิกใช้แล้วอาจสร้างโครงสร้างรุ่นเก่าขึ้นใหม่ภายใน เส้นทางการรับใหม่
ที่รวมมากับระบบไม่ควรแปลงผลลัพธ์สมัยใหม่กลับเป็น DTO
ภายในเครื่อง

## กลุ่มการเข้าถึง

รายการ `accessGroup:<name>` ยังคงถูกปกปิดข้อมูลไว้ Core จะแก้ไขกลุ่ม
`message.senders` แบบคงที่ด้วยตัวเอง และเรียก `resolveAccessGroupMembership` เฉพาะ
สำหรับกลุ่มแบบไดนามิกที่ต้องค้นหาจากแพลตฟอร์มเท่านั้น กลุ่มที่ไม่มีอยู่ ไม่รองรับ หรือ
ล้มเหลวจะปฏิเสธโดยปริยาย

## โหมดเหตุการณ์

| `authMode`       | ความหมาย                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | เกตผู้ส่งขาเข้าตามปกติ                      |
| `command`        | เกตคำสั่งสำหรับ callback หรือปุ่มที่จำกัดขอบเขต    |
| `origin-subject` | ผู้ดำเนินการต้องตรงกับ subject ของข้อความต้นฉบับ    |
| `route-only`     | เฉพาะเกตเส้นทางสำหรับเหตุการณ์ที่เชื่อถือได้และจำกัดขอบเขตตามเส้นทาง |
| `none`           | เหตุการณ์ภายในที่ Plugin เป็นเจ้าของจะข้ามการอนุญาตที่ใช้ร่วมกัน  |

ใช้ `mayPair: false` สำหรับรีแอ็กชัน, ปุ่ม, callback และคำสั่งแบบเนทีฟ

## เส้นทางและการเปิดใช้งาน

ใช้ตัวอธิบายเส้นทางสำหรับนโยบายห้อง, หัวข้อ, guild, เธรด หรือเส้นทางที่ซ้อนกัน:

```ts
route: {
  id: "room",
  allowed: roomAllowed,
  enabled: roomEnabled,
  senderPolicy: "replace",
  senderAllowFrom: roomAllowFrom,
  blockReason: "room_sender_not_allowlisted",
}
```

ใช้ `channelIngressRoutes(...)` เมื่อ Plugin มีตัวอธิบายเส้นทางแบบเลือกใช้ได้
หลายรายการ โดยจะกรองแขนงที่ปิดใช้งานออก พร้อมคงข้อเท็จจริงของเส้นทางให้เป็นข้อมูลทั่วไป
และเรียงลำดับตาม `precedence` ของตัวอธิบายแต่ละรายการ

เกตการกล่าวถึงเป็นเกตการเปิดใช้งาน การไม่พบการกล่าวถึงจะคืนค่า
`admission: "skip"` เพื่อไม่ให้เคอร์เนลของเทิร์นประมวลผลเทิร์นที่มีไว้สังเกตการณ์เท่านั้น
ช่องทางส่วนใหญ่ควรวางการเปิดใช้งานไว้หลังเกตผู้ส่งและเกตคำสั่ง พื้นที่แชตสาธารณะ
ที่ต้องระงับทราฟฟิกซึ่งไม่ได้กล่าวถึงก่อนเกิดสัญญาณรบกวนจากรายการอนุญาตผู้ส่ง
สามารถเลือกใช้ `activation.order: "before-sender"` เมื่อปิดใช้งานการข้าม
ด้วยคำสั่งข้อความ ช่องทางที่มีการเปิดใช้งานโดยปริยาย เช่น การตอบกลับใน
เธรดของบอต จะแก้ไข `channels.defaults.implicitMentions` ร่วมกับค่าที่เขียนทับของช่องทางและบัญชี
ด้วย `resolveChannelImplicitMentions(...)` แล้วส่งผลลัพธ์เป็น
`activation.implicitMentions` ส่วน
`activationAccess.shouldBypassMention` ที่ฉายออกมาจะรายงานเมื่อคำสั่งหรือการเปิดใช้งาน
โดยปริยายข้ามข้อกำหนดการกล่าวถึงอย่างชัดแจ้ง

## การปกปิดข้อมูล

ค่าผู้ส่งดิบและรายการในรายการอนุญาตดิบเป็นเพียงอินพุตของตัวแก้ไขเท่านั้น ค่าเหล่านี้
ต้องไม่ปรากฏในสถานะที่แก้ไขแล้ว, การตัดสินใจ, การวินิจฉัย, snapshot หรือ
ข้อเท็จจริงด้านความเข้ากันได้ ให้ใช้ subject id, entry id, route id และ
diagnostic id ที่ไม่เปิดเผยข้อมูล

## การตรวจสอบ

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
