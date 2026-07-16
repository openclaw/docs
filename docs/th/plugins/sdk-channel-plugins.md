---
read_when:
    - คุณกำลังสร้าง Plugin ช่องทางการส่งข้อความใหม่
    - คุณต้องการเชื่อมต่อ OpenClaw กับแพลตฟอร์มรับส่งข้อความ
    - คุณต้องทำความเข้าใจพื้นผิวอะแดปเตอร์ ChannelPlugin
sidebarTitle: Channel Plugins
summary: คู่มือทีละขั้นตอนสำหรับการสร้าง Plugin ช่องทางการส่งข้อความสำหรับ OpenClaw
title: การสร้าง Plugin ช่องทาง
x-i18n:
    generated_at: "2026-07-16T19:29:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c6398dd0b4789b9f4aaf7ad2d1786a7e6388cb8fbb74e8ecaecae7ac0a5eb90
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

คู่มือนี้สร้าง Plugin ช่องทางที่เชื่อมต่อ OpenClaw กับแพลตฟอร์มรับส่งข้อความ โดยครอบคลุมความปลอดภัยของ DM, การจับคู่, เธรดการตอบกลับ และการส่งข้อความขาออก

<Info>
  หากเพิ่งเริ่มใช้ Plugin ของ OpenClaw โปรดอ่าน [เริ่มต้นใช้งาน](/th/plugins/building-plugins)
  ก่อน เพื่อทำความเข้าใจโครงสร้างแพ็กเกจและการตั้งค่า manifest
</Info>

## สิ่งที่ Plugin ของคุณรับผิดชอบ

Plugin ช่องทางไม่ต้องติดตั้งใช้งานเครื่องมือส่ง/แก้ไข/แสดงปฏิกิริยา โดยแกนกลางมีเครื่องมือ
`message` ที่ใช้ร่วมกันอยู่แล้ว Plugin ของคุณรับผิดชอบ:

- **การกำหนดค่า** - การระบุบัญชีและตัวช่วยตั้งค่า
- **ความปลอดภัย** - นโยบาย DM และรายการอนุญาต
- **การจับคู่** - ขั้นตอนการอนุมัติ DM
- **ไวยากรณ์เซสชัน** - วิธีแมป ID การสนทนาเฉพาะของผู้ให้บริการกับแชต
  พื้นฐาน, ID เธรด และรายการย้อนกลับไปยังรายการแม่
- **ขาออก** - การส่งข้อความ สื่อ และแบบสำรวจไปยังแพลตฟอร์ม
- **การจัดเธรด** - วิธีจัดเธรดการตอบกลับ
- **การแสดงสถานะกำลังพิมพ์ของ Heartbeat** - สัญญาณกำลังพิมพ์/ไม่ว่างที่เลือกใช้ได้สำหรับเป้าหมาย
  การส่ง Heartbeat

แกนกลางรับผิดชอบเครื่องมือข้อความที่ใช้ร่วมกัน การเชื่อมต่อพรอมต์ รูปแบบภายนอกของคีย์เซสชัน
การเก็บข้อมูล `:thread:` แบบทั่วไป และการจัดส่ง

## อะแดปเตอร์ข้อความ

เปิดเผยอะแดปเตอร์ `message` พร้อม `defineChannelMessageAdapter` จาก
`openclaw/plugin-sdk/channel-outbound` ประกาศเฉพาะความสามารถการส่งขั้นสุดท้ายแบบคงทน
ที่การขนส่งแบบเนทีฟของคุณรองรับจริง โดยมีการทดสอบสัญญาที่พิสูจน์ผลข้างเคียง
ฝั่งเนทีฟและใบตอบรับที่ส่งคืน กำหนดให้การส่งข้อความ/สื่อใช้ฟังก์ชันการขนส่งเดียวกับที่อะแดปเตอร์
`outbound` แบบเดิมใช้ สำหรับสัญญา API ฉบับเต็ม เมทริกซ์ความสามารถ
กฎใบตอบรับ การปิดการแสดงตัวอย่างสดให้เสร็จสมบูรณ์ นโยบายการตอบรับเมื่อได้รับ
การทดสอบ และตารางการย้าย โปรดดู
[API ขาออกของช่องทาง](/th/plugins/sdk-channel-outbound)

หากอะแดปเตอร์ `outbound` ที่มีอยู่ของคุณมีเมธอดการส่งและ
ข้อมูลเมตาความสามารถที่ถูกต้องอยู่แล้ว ให้สร้างอะแดปเตอร์ `message` จาก
`createChannelMessageAdapterFromOutbound(...)` แทนการเขียนบริดจ์ใหม่ด้วยตนเอง
การส่งผ่านอะแดปเตอร์จะคืนค่า `MessageReceipt` สำหรับ ID แบบเดิม ให้สร้าง
ด้วย `listMessageReceiptPlatformIds(...)` หรือ
`resolveMessageReceiptPrimaryId(...)` แทนการเก็บฟิลด์ `messageIds`
แบบขนาน

ประกาศความสามารถแบบสดและตัวปิดงานให้แม่นยำ เพราะแกนกลางใช้สิ่งเหล่านี้เพื่อตัดสินใจ
ว่าช่องทางทำอะไรได้บ้าง และความคลาดเคลื่อนระหว่างพฤติกรรมที่ประกาศกับพฤติกรรมจริงถือเป็น
ความล้มเหลวของการทดสอบสัญญา:

| พื้นผิว                               | ค่า                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

ช่องทางที่ปิดงานการแสดงตัวอย่างฉบับร่าง ณ ตำแหน่งเดิมควรส่งต่อตรรกะรันไทม์
ผ่าน `defineFinalizableLivePreviewAdapter(...)` ร่วมกับ
`deliverWithFinalizableLivePreviewAdapter(...)` และให้ความสามารถที่ประกาศ
มีการทดสอบ `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
และ `verifyChannelMessageLiveFinalizerProofs(...)` รองรับ เพื่อไม่ให้พฤติกรรมของการแสดงตัวอย่าง
ความคืบหน้า การแก้ไข การย้อนกลับ/การเก็บรักษา การล้างข้อมูล และใบตอบรับแบบเนทีฟ
คลาดเคลื่อนไปโดยไม่มีการแจ้งเตือน

ตัวรับขาเข้าที่เลื่อนการตอบรับของแพลตฟอร์มควรประกาศ
`message.receive.defaultAckPolicy` และ `supportedAckPolicies` แทนการซ่อน
เวลาการตอบรับไว้ในสถานะเฉพาะของตัวเฝ้าติดตาม ครอบคลุมทุกนโยบายที่ประกาศด้วย
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`

ตัวช่วยตอบกลับแบบเดิม เช่น `dispatchInboundReplyWithBase` และ
`recordInboundSessionAndDispatchReply` ยังคงมีไว้สำหรับตัวจัดส่ง
ที่ต้องรองรับความเข้ากันได้ อย่าใช้ตัวช่วยเหล่านี้กับโค้ดช่องทางใหม่ ให้เริ่มจากอะแดปเตอร์
`message` ใบตอบรับ และตัวช่วยวงจรชีวิตการรับ/ส่งบน
`openclaw/plugin-sdk/channel-outbound` แทน

### การรับข้อมูลขาเข้า (ทดลอง)

ช่องทางที่กำลังย้ายการให้สิทธิ์ขาเข้าสามารถใช้พาธย่อยแบบทดลอง
`openclaw/plugin-sdk/channel-ingress-runtime` จากพาธการรับของรันไทม์
พาธนี้รับข้อเท็จจริงของแพลตฟอร์ม รายการอนุญาตดิบ ตัวอธิบายเส้นทาง ข้อเท็จจริงของคำสั่ง
และการกำหนดค่ากลุ่มการเข้าถึง จากนั้นคืนการฉายภาพผู้ส่ง/เส้นทาง/คำสั่ง/การเปิดใช้งาน
พร้อมกราฟการรับข้อมูลเข้าที่จัดลำดับแล้ว โดยการค้นหาแพลตฟอร์มและผลข้างเคียง
ยังคงอยู่ใน Plugin เก็บการปรับเอกลักษณ์ Plugin ให้เป็นมาตรฐานไว้ในตัวอธิบาย
ที่คุณส่งให้ตัวแก้ไข อย่าซีเรียลไลซ์ค่าการจับคู่ดิบจากสถานะหรือการตัดสินใจ
ที่แก้ไขแล้ว โปรดดู
[API การรับข้อมูลเข้าของช่องทาง](/th/plugins/sdk-channel-ingress) สำหรับการออกแบบ API
ขอบเขตความรับผิดชอบ และสิ่งที่คาดหวังจากการทดสอบ

### ตัวบ่งชี้การพิมพ์

หากช่องทางของคุณรองรับตัวบ่งชี้การพิมพ์นอกเหนือจากการตอบกลับขาเข้า ให้เปิดเผย
`heartbeat.sendTyping(...)` บน Plugin ช่องทาง แกนกลางจะเรียกใช้ด้วย
เป้าหมายการส่ง Heartbeat ที่ระบุแล้วก่อนเริ่มการทำงานของโมเดล Heartbeat และ
ใช้วงจรชีวิตการคงสถานะ/ล้างสถานะการพิมพ์ที่ใช้ร่วมกัน เพิ่ม
`heartbeat.clearTyping(...)` เมื่อแพลตฟอร์มต้องการสัญญาณหยุดที่ชัดเจน

### พารามิเตอร์แหล่งที่มาของสื่อ

หากช่องทางของคุณเพิ่มพารามิเตอร์เครื่องมือข้อความที่ใช้ส่งแหล่งที่มาของสื่อ ให้เปิดเผย
ชื่อพารามิเตอร์เหล่านั้นผ่าน `plugin.actions.describeMessageTool(...).mediaSourceParams`
แกนกลางใช้รายการที่ระบุชัดเจนนี้สำหรับการปรับพาธ sandbox ให้เป็นมาตรฐานและนโยบาย
การเข้าถึงสื่อขาออก เพื่อให้ Plugin ไม่ต้องเพิ่มกรณีพิเศษในแกนกลางที่ใช้ร่วมกันสำหรับ
พารามิเตอร์รูปประจำตัว ไฟล์แนบ หรือภาพหน้าปกเฉพาะของผู้ให้บริการ

ควรใช้แมปที่กำหนดคีย์ตามการดำเนินการ เช่น `{ "set-profile": ["avatarUrl", "avatarPath"] }`
เพื่อไม่ให้การดำเนินการที่ไม่เกี่ยวข้องสืบทอดอาร์กิวเมนต์สื่อของการดำเนินการอื่น อาร์เรย์แบบแบน
ยังคงใช้ได้กับพารามิเตอร์ที่ตั้งใจให้ใช้ร่วมกันในทุกการดำเนินการที่เปิดเผย

ช่องทางที่ต้องเปิดเผย URL สาธารณะชั่วคราวเพื่อให้แพลตฟอร์มดึงข้อมูลสื่อ
สามารถใช้ `createHostedOutboundMediaStore(...)` จาก
`openclaw/plugin-sdk/outbound-media` ร่วมกับที่เก็บสถานะของ Plugin เก็บการแยกวิเคราะห์
เส้นทางของแพลตฟอร์มและการบังคับใช้โทเค็นไว้ใน Plugin ช่องทาง ตัวช่วยที่ใช้ร่วมกัน
รับผิดชอบเฉพาะการโหลดสื่อ ข้อมูลเมตาการหมดอายุ แถวส่วนข้อมูล และการล้างข้อมูล

### การกำหนดรูปแบบเพย์โหลดแบบเนทีฟ

หากช่องทางของคุณต้องกำหนดรูปแบบเฉพาะของผู้ให้บริการสำหรับ `message(action="send")`
ควรใช้ `actions.prepareSendPayload(...)` ใส่การ์ด บล็อก เนื้อหาฝังตัว หรือ
ข้อมูลคงทนอื่นแบบเนทีฟไว้ใต้ `payload.channelData.<channel>` แล้วให้แกนกลางส่ง
ผ่านอะแดปเตอร์ขาออก/ข้อความ ใช้ `actions.handleAction(...)` สำหรับการส่ง
เฉพาะในฐานะทางเลือกสำรองเพื่อความเข้ากันได้สำหรับเพย์โหลดที่ไม่สามารถซีเรียลไลซ์และ
ลองใหม่ได้

### ไวยากรณ์การสนทนาของเซสชัน

หากแพลตฟอร์มของคุณเก็บขอบเขตเพิ่มเติมไว้ภายใน ID การสนทนา ให้เก็บการแยกวิเคราะห์นั้น
ไว้ใน Plugin ด้วย `messaging.resolveSessionConversation(...)` นี่คือฮุกมาตรฐาน
สำหรับแมป `rawId` ไปยัง ID การสนทนาพื้นฐาน, ID เธรดที่เลือกมีได้,
`baseConversationId` ที่ระบุชัดเจน และ
`parentConversationCandidates` ใดๆ เมื่อคืนค่า `parentConversationCandidates`
ให้เรียงจากรายการแม่ที่มีขอบเขตแคบที่สุดไปยังการสนทนาที่กว้างที่สุด/พื้นฐาน

`messaging.resolveParentConversationCandidates(...)` เป็นทางเลือกสำรอง
เพื่อความเข้ากันได้ที่เลิกแนะนำแล้ว สำหรับ Plugin ที่ต้องการเพียงรายการย้อนกลับไปยังรายการแม่
เพิ่มเติมจาก ID ทั่วไป/ดิบ หากมีฮุกทั้งสอง แกนกลางจะใช้
`resolveSessionConversation(...).parentConversationCandidates` ก่อน และย้อนกลับไปใช้
`resolveParentConversationCandidates(...)` เฉพาะเมื่อฮุกมาตรฐาน
ไม่ได้ระบุรายการเหล่านั้น

Plugin ที่รวมมากับระบบซึ่งต้องใช้การแยกวิเคราะห์เดียวกันก่อนที่รีจิสทรีช่องทางจะเริ่มทำงาน
สามารถเปิดเผยไฟล์ `session-key-api.ts` ระดับบนสุดพร้อมการส่งออก
`resolveSessionConversation(...)` ที่ตรงกันได้ (ดู Plugin Feishu และ Telegram)
แกนกลางใช้พื้นผิวที่ปลอดภัยสำหรับการเริ่มต้นระบบนี้เฉพาะเมื่อรีจิสทรี Plugin
ของรันไทม์ยังไม่พร้อมใช้งาน

ใช้ `openclaw/plugin-sdk/channel-route` เมื่อโค้ด Plugin ต้องปรับ
ฟิลด์ที่มีลักษณะเหมือนเส้นทางให้เป็นมาตรฐาน เปรียบเทียบเธรดย่อยกับเส้นทางแม่ หรือสร้าง
คีย์ขจัดข้อมูลซ้ำที่เสถียรจาก `{ channel, to, accountId, threadId }` ตัวช่วยนี้
ปรับ ID เธรดแบบตัวเลขให้เป็นมาตรฐานด้วยวิธีเดียวกับแกนกลาง จึงควรใช้แทนการเปรียบเทียบ
`String(threadId)` แบบเฉพาะกิจ Plugin ที่มีไวยากรณ์เป้าหมายเฉพาะของผู้ให้บริการ
ควรเปิดเผย `messaging.resolveOutboundSessionRoute(...)` เพื่อให้แกนกลางได้รับ
เอกลักษณ์เซสชันและเธรดแบบเนทีฟของผู้ให้บริการโดยไม่ต้องใช้ตัวช่วยแยกวิเคราะห์

### การรองรับการผูกการสนทนาตามขอบเขตบัญชี

ตั้งค่า `conversationBindings.supportsCurrentConversationBinding` เมื่อช่องทาง
รองรับการผูกการสนทนาปัจจุบันแบบทั่วไป `createChatChannelPlugin(...)`
ตั้งค่าความสามารถคงที่นี้เป็น `true` โดยค่าเริ่มต้น

หากการรองรับแตกต่างกันตามบัญชีที่กำหนดค่า ให้ติดตั้งใช้งาน
`conversationBindings.isCurrentConversationBindingSupported({ accountId })` ด้วย
แกนกลางจะประเมินฮุกแบบซิงโครนัสนี้หลังจากเปิดใช้ความสามารถคงที่แล้วเท่านั้น
การคืนค่า `false` จะทำให้การดำเนินการด้านความสามารถ การผูก การค้นหา
การแสดงรายการ การอัปเดตการใช้งาน และการยกเลิกการผูกการสนทนาปัจจุบันแบบทั่วไป
ไม่พร้อมใช้งานสำหรับบัญชีนั้น หากไม่ระบุฮุก ระบบจะใช้ความสามารถคงที่กับทุกบัญชี

หาคำตอบจากการกำหนดค่าบัญชีหรือสถานะรันไทม์ที่โหลดไว้แล้ว ฮุกนี้ควบคุมเฉพาะ
การผูกการสนทนาปัจจุบันแบบทั่วไป โดยไม่แทนที่กฎการผูกที่กำหนดค่าไว้หรือการกำหนดเส้นทาง
เซสชันที่ Plugin รับผิดชอบ การทดสอบสัญญาควรครอบคลุมบัญชีที่รองรับอย่างน้อยหนึ่งบัญชี
และบัญชีที่ไม่รองรับอย่างน้อยหนึ่งบัญชีผ่านสัญญา `ChannelPlugin["conversationBindings"]`
ที่ส่งออกโดย `openclaw/plugin-sdk/channel-core`

## การอนุมัติและความสามารถของช่องทาง

Plugin ช่องทางส่วนใหญ่ไม่ต้องมีโค้ดเฉพาะสำหรับการอนุมัติ แกนกลางรับผิดชอบ
`/approve` ภายในแชตเดียวกัน เพย์โหลดปุ่มอนุมัติที่ใช้ร่วมกัน และการส่งสำรอง
แบบทั่วไป `ChannelPlugin.approvals` ถูกนำออกแล้ว ให้ใส่ข้อเท็จจริงด้านการส่ง/เนทีฟ/
การแสดงผล/การให้สิทธิ์สำหรับการอนุมัติไว้ในอ็อบเจกต์ `approvalCapability` เดียวแทน
`plugin.auth` ใช้สำหรับเข้าสู่ระบบ/ออกจากระบบเท่านั้น แกนกลางจะไม่อ่านฮุก
การให้สิทธิ์การอนุมัติจากอ็อบเจกต์นั้นอีกต่อไป

ใช้ `approvalCapability.delivery` เฉพาะสำหรับการกำหนดเส้นทางการอนุมัติแบบเนทีฟหรือ
การระงับทางเลือกสำรอง และใช้ `approvalCapability.render` เฉพาะเมื่อช่องทางจำเป็นต้องใช้
เพย์โหลดการอนุมัติแบบกำหนดเองแทนตัวแสดงผลที่ใช้ร่วมกันจริงๆ

### การให้สิทธิ์การอนุมัติ

- `approvalCapability.authorizeActorAction` และ
  `approvalCapability.getActionAvailabilityState` เป็นจุดเชื่อมต่อมาตรฐาน
  สำหรับการให้สิทธิ์การอนุมัติ
- ใช้ `getActionAvailabilityState` สำหรับความพร้อมใช้งานของการให้สิทธิ์
  การอนุมัติภายในแชตเดียวกัน ให้ผู้อนุมัติที่กำหนดค่าไว้พร้อมใช้งานสำหรับ
  `/approve` แม้เมื่อปิดใช้การส่งแบบเนทีฟ ให้ใช้สถานะพื้นผิวเริ่มต้นแบบเนทีฟ
  สำหรับคำแนะนำด้านการส่ง/การตั้งค่าแทน
- หากช่องทางของคุณเปิดเผยการอนุมัติการดำเนินการแบบเนทีฟ ให้ใช้
  `approvalCapability.getExecInitiatingSurfaceState` สำหรับสถานะ
  พื้นผิวเริ่มต้น/ไคลเอนต์เนทีฟ เมื่อสถานะนั้นแตกต่างจากการให้สิทธิ์การอนุมัติ
  ภายในแชตเดียวกัน แกนกลางใช้ฮุกเฉพาะการดำเนินการนี้เพื่อแยกแยะ `enabled` กับ
  `disabled` ตัดสินว่าช่องทางเริ่มต้นรองรับการอนุมัติการดำเนินการแบบเนทีฟหรือไม่
  และรวมช่องทางไว้ในคำแนะนำทางเลือกสำรองสำหรับไคลเอนต์เนทีฟ
  `createApproverRestrictedNativeApprovalCapability(...)` จะเติมข้อมูลนี้ให้ใน
  กรณีทั่วไป
- หากช่องทางสามารถอนุมานเอกลักษณ์ DM ที่เสถียรและมีลักษณะเป็นเจ้าของ
  จากการกำหนดค่าที่มีอยู่ ให้ใช้ `createResolvedApproverActionAuthAdapter` จาก
  `openclaw/plugin-sdk/approval-runtime` เพื่อจำกัด `/approve` ภายในแชตเดียวกัน
  โดยไม่เพิ่มตรรกะเฉพาะการอนุมัติลงในแกนกลาง
- หากการให้สิทธิ์การอนุมัติแบบกำหนดเองตั้งใจอนุญาตเฉพาะทางเลือกสำรอง
  ภายในแชตเดียวกัน ให้คืนค่า `markImplicitSameChatApprovalAuthorization({ authorized: true })` จาก
  `openclaw/plugin-sdk/approval-auth-runtime` มิฉะนั้นแกนกลางจะถือว่า
  ผลลัพธ์เป็นการให้สิทธิ์แก่ผู้อนุมัติโดยชัดแจ้ง
- หากคอลแบ็กแบบเนทีฟที่ช่องทางรับผิดชอบแก้ไขการอนุมัติโดยตรง ให้ใช้
  `isImplicitSameChatApprovalAuthorization(...)` ก่อนแก้ไข เพื่อให้
  ทางเลือกสำรองโดยนัยยังคงผ่านการให้สิทธิ์ผู้ดำเนินการตามปกติของช่องทาง

### วงจรชีวิตเพย์โหลดและคำแนะนำการตั้งค่า

- ใช้ `outbound.shouldSuppressLocalPayloadPrompt` หรือ
  `outbound.beforeDeliverPayload` สำหรับพฤติกรรมวงจรชีวิตเพย์โหลด
  เฉพาะช่องทาง เช่น การซ่อนพรอมต์การอนุมัติภายในเครื่องที่ซ้ำกัน หรือการส่งตัวบ่งชี้
  การพิมพ์ก่อนส่ง
- ใช้ `approvalCapability.describeExecApprovalSetup` เมื่อช่องทางต้องการ
  ให้การตอบกลับในพาธที่ปิดใช้งานอธิบายค่ากำหนดที่แน่นอนซึ่งจำเป็นต่อการเปิดใช้
  การอนุมัติการดำเนินการแบบเนทีฟ ฮุกจะได้รับ `{ channel, channelLabel, accountId }`;
  ช่องทางที่มีบัญชีแบบระบุชื่อควรแสดงพาธตามขอบเขตบัญชี เช่น
  `channels.<channel>.accounts.<id>.execApprovals.*` แทนค่าเริ่มต้น
  ระดับบนสุด
- ใช้ `approvalCapability.describePluginApprovalSetup` เมื่อคำแนะนำเกี่ยวกับ
  ความล้มเหลวของการอนุมัติ Plugin ปลอดภัยที่จะแสดงสำหรับความล้มเหลวกรณีไม่มีเส้นทาง
  และหมดเวลาของการอนุมัติ Plugin `createApproverRestrictedNativeApprovalCapability(...)`
  จะไม่อนุมานสิ่งนี้จาก `describeExecApprovalSetup` ให้ส่งตัวช่วยเดียวกันอย่างชัดเจน
  เฉพาะเมื่อการอนุมัติ Plugin และการอนุมัติการดำเนินการใช้การตั้งค่าแบบเนทีฟเดียวกันจริงๆ

### การส่งการอนุมัติแบบเนทีฟ

หากช่องทางต้องใช้การส่งการอนุมัติแบบเนทีฟ ให้โค้ดช่องทางมุ่งเน้นเฉพาะ
การปรับเป้าหมายให้เป็นมาตรฐาน รวมถึงข้อเท็จจริงด้านการขนส่ง/การนำเสนอ ใช้
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` และ
`createApproverRestrictedNativeApprovalCapability` จาก
`openclaw/plugin-sdk/approval-runtime` ใส่ข้อเท็จจริงเฉพาะช่องทางไว้หลัง
`approvalCapability.nativeRuntime` โดยควรใช้
`createChannelApprovalNativeRuntimeAdapter(...)` หรือ
`createLazyChannelApprovalNativeRuntimeAdapter(...)` เพื่อให้แกนกลางประกอบ
ตัวจัดการและรับผิดชอบการกรองคำขอ การกำหนดเส้นทาง การขจัดข้อมูลซ้ำ การหมดอายุ การสมัครรับข้อมูล
Gateway และการแจ้งเตือนว่ามีการกำหนดเส้นทางไปที่อื่นแล้ว

`nativeRuntime` ถูกแบ่งออกเป็นจุดเชื่อมต่อขนาดเล็กหลายรายการ:

- `availability` - บัญชีได้รับการกำหนดค่าแล้วหรือไม่ และควรจัดการคำขอหรือไม่
- `presentation` - แมปโมเดลมุมมองการอนุมัติที่ใช้ร่วมกันเป็นเพย์โหลดแบบเนทีฟที่รอดำเนินการ/ได้รับการแก้ไข/หมดอายุ หรือการดำเนินการขั้นสุดท้าย
- `transport` - เตรียมเป้าหมาย รวมถึงส่ง/อัปเดต/ลบข้อความการอนุมัติแบบเนทีฟ
- `interactions` - ฮุกสำหรับผูก/ยกเลิกการผูก/ล้างการดำเนินการสำหรับปุ่มหรือรีแอ็กชันแบบเนทีฟซึ่งเป็นทางเลือก รวมถึงฮุก `cancelDelivered` ซึ่งเป็นทางเลือก ใช้
  `cancelDelivered` เมื่อ `deliverPending` ลงทะเบียนสถานะภายในโปรเซสหรือสถานะแบบถาวร
  (เช่น ที่เก็บเป้าหมายรีแอ็กชัน) เพื่อให้ปล่อยสถานะดังกล่าวได้หากการหยุดตัวจัดการ
  ยกเลิกการนำส่งก่อนที่ `bindPending` จะทำงาน หรือเมื่อ
  `bindPending` ไม่คืนค่าแฮนเดิล
- `observe` - ฮุกการวินิจฉัยการนำส่งซึ่งเป็นทางเลือก

ตัวช่วยการอนุมัติอื่นๆ:

- ใช้ `createNativeApprovalChannelRouteGates` จาก
  `openclaw/plugin-sdk/approval-native-runtime` เมื่อช่องทางรองรับทั้ง
  การนำส่งแบบเนทีฟจากต้นทางเซสชันและเป้าหมายการส่งต่อการอนุมัติที่ระบุไว้อย่างชัดเจน
  ตัวช่วยนี้รวมศูนย์การเลือกการกำหนดค่าการอนุมัติ การจัดการ `mode` ตัวกรองเอเจนต์/เซสชัน
  การผูกบัญชี การจับคู่เป้าหมายเซสชัน และการจับคู่รายการเป้าหมาย
  ขณะที่ผู้เรียกยังคงเป็นเจ้าของรหัสช่องทาง โหมดการส่งต่อเริ่มต้น การค้นหา
  บัญชี การตรวจสอบว่าเปิดใช้งานทรานสปอร์ตหรือไม่ การทำเป้าหมายให้เป็นมาตรฐาน และการแก้ไข
  เป้าหมายจากแหล่งที่มาของเทิร์น อย่าใช้ตัวช่วยนี้เพื่อสร้างค่าเริ่มต้นของนโยบายช่องทาง
  ที่คอร์เป็นเจ้าของ ให้ส่งโหมดเริ่มต้นที่ระบุไว้ในเอกสารของช่องทางอย่างชัดเจน
- `createChannelNativeOriginTargetResolver` ใช้ตัวจับคู่เส้นทางช่องทาง
  ที่ใช้ร่วมกันเป็นค่าเริ่มต้นสำหรับเป้าหมาย `{ to, accountId, threadId }` ส่ง
  `targetsMatch` เฉพาะเมื่อช่องทางมีกฎความเทียบเท่าเฉพาะของผู้ให้บริการ
  เช่น การจับคู่คำนำหน้าไทม์สแตมป์ของ Slack ส่ง `normalizeTargetForMatch` เมื่อ
  ช่องทางจำเป็นต้องทำรหัสผู้ให้บริการให้เป็นรูปแบบมาตรฐานก่อนที่ตัวจับคู่เส้นทางเริ่มต้น
  หรือคอลแบ็ก `targetsMatch` แบบกำหนดเองจะทำงาน โดยยังคงรักษา
  เป้าหมายเดิมไว้สำหรับการนำส่ง ใช้ `normalizeTarget` เฉพาะเมื่อควรทำให้
  เป้าหมายการนำส่งที่แก้ไขแล้วเป็นรูปแบบมาตรฐาน
- หากช่องทางต้องการออบเจ็กต์ที่รันไทม์เป็นเจ้าของ เช่น ไคลเอนต์ โทเค็น แอป Bolt
  หรือตัวรับ webhook ให้ลงทะเบียนออบเจ็กต์เหล่านั้นผ่าน
  `openclaw/plugin-sdk/channel-runtime-context` รีจิสทรีบริบทรันไทม์แบบทั่วไป
  ช่วยให้คอร์บูตสแตรปตัวจัดการที่ขับเคลื่อนด้วยความสามารถจากสถานะการเริ่มต้น
  ของช่องทางได้โดยไม่ต้องเพิ่มโค้ดเชื่อมตัวหุ้มเฉพาะการอนุมัติ
- ใช้ `createChannelApprovalHandler` หรือ
  `createChannelNativeApprovalRuntime` ระดับล่างกว่า เฉพาะเมื่อจุดเชื่อมต่อ
  ที่ขับเคลื่อนด้วยความสามารถยังไม่สามารถแสดงความต้องการได้เพียงพอ
- ช่องทางการอนุมัติแบบเนทีฟต้องกำหนดเส้นทางทั้ง `accountId` และ `approvalKind`
  ผ่านตัวช่วยเหล่านั้น `accountId` ทำให้นโยบายการอนุมัติแบบหลายบัญชี
  จำกัดขอบเขตอยู่กับบัญชีบอตที่ถูกต้อง และ `approvalKind` ทำให้พฤติกรรมการอนุมัติ
  exec เทียบกับ Plugin พร้อมใช้งานกับช่องทางโดยไม่ต้องมีแขนงที่ฮาร์ดโค้ดไว้ใน
  คอร์
- คอร์เป็นเจ้าของการแจ้งเตือนการเปลี่ยนเส้นทางการอนุมัติด้วย Plugin ช่องทางไม่ควรส่ง
  ข้อความติดตามผลของตนเองว่า "การอนุมัติถูกส่งไปยัง DM / ช่องทางอื่น" จาก
  `createChannelNativeApprovalRuntime` แต่ควรเปิดเผยการกำหนดเส้นทางต้นทาง +
  DM ของผู้อนุมัติอย่างถูกต้องผ่านตัวช่วยความสามารถการอนุมัติที่ใช้ร่วมกัน และปล่อยให้
  คอร์รวมการนำส่งจริงก่อนโพสต์การแจ้งเตือนใดๆ กลับไปยัง
  แชตที่เริ่มต้น
- รักษาชนิดของรหัสการอนุมัติที่นำส่งไว้ตั้งแต่ต้นจนจบ ไคลเอนต์แบบเนทีฟไม่ควร
  คาดเดาหรือเขียนการกำหนดเส้นทางการอนุมัติ exec เทียบกับ Plugin ใหม่จากสถานะ
  ภายในช่องทาง
- ส่ง `approvalKind` ที่ระบุไว้อย่างชัดเจนนั้นไปยัง `resolveApprovalOverGateway` การดำเนินการนี้ใช้
  บริการ `approval.resolve` มาตรฐานและคืนค่าผู้ชนะที่บันทึกไว้เมื่อ
  พื้นผิวอื่นตอบก่อน อินพุต `resolveMethod` แบบระบุชัดเจนรุ่นเก่า
  ยังคงใช้สำหรับตัวควบคุมที่รองรับด้วยคำสั่ง การดำเนินการแบบเนทีฟใหม่ต้องไม่ใช้หรือ
  อนุมานชนิดจากรหัส
- ชนิดการอนุมัติที่ต่างกันสามารถเปิดเผยพื้นผิวแบบเนทีฟที่ต่างกันโดยตั้งใจได้
  ตัวอย่างแบบรวมในปัจจุบัน: Matrix ยังคงใช้การกำหนดเส้นทาง DM/ช่องทางแบบเนทีฟ
  และ UX ของรีแอ็กชันแบบเดียวกันสำหรับการอนุมัติ exec และ Plugin ขณะเดียวกันยังอนุญาตให้
  การยืนยันตัวตนแตกต่างกันตามชนิดการอนุมัติ ส่วน Slack ยังคงเปิดให้ใช้การกำหนดเส้นทางการอนุมัติแบบเนทีฟ
  สำหรับทั้งรหัส exec และ Plugin
- `createApproverRestrictedNativeApprovalAdapter` ยังคงมีอยู่ในฐานะ
  ตัวหุ้มเพื่อความเข้ากันได้ แต่โค้ดใหม่ควรเลือกใช้ตัวสร้างความสามารถ
  และเปิดเผย `approvalCapability` บน Plugin

### พาธย่อยของรันไทม์การอนุมัติที่แคบกว่า

สำหรับจุดเข้าช่องทางที่ทำงานบ่อย ให้เลือกใช้พาธย่อยที่แคบกว่าเหล่านี้แทน barrel
`approval-runtime` ที่กว้างกว่า เมื่อคุณต้องการเพียงส่วนเดียวของกลุ่มนั้น:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-reference-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

ในทำนองเดียวกัน ให้เลือกใช้ `openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` และ
`openclaw/plugin-sdk/reply-chunking` แทนพื้นผิวแบบครอบคลุมที่กว้างกว่า เมื่อคุณ
ไม่ต้องการใช้ทั้งหมด

### พาธย่อยสำหรับการตั้งค่า

- `openclaw/plugin-sdk/setup-runtime` ครอบคลุมตัวช่วยการตั้งค่าที่ปลอดภัยสำหรับรันไทม์:
  `createSetupTranslator`, อะแดปเตอร์แพตช์การตั้งค่าที่ปลอดภัยต่อการนำเข้า
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), เอาต์พุตหมายเหตุการค้นหา,
  `promptResolvedAllowFrom`, `splitSetupEntries` และตัวสร้าง
  พร็อกซีการตั้งค่าแบบมอบหมาย
- `openclaw/plugin-sdk/channel-setup` ครอบคลุมตัวสร้างการตั้งค่า
  สำหรับการติดตั้งแบบไม่บังคับ รวมถึงพริมิทีฟที่ปลอดภัยสำหรับการตั้งค่าบางรายการ: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled` และ `splitSetupEntries`
- ใช้จุดเชื่อมต่อ `openclaw/plugin-sdk/setup` ที่กว้างกว่าเฉพาะเมื่อคุณต้องการ
  ตัวช่วยการตั้งค่า/การกำหนดค่าที่ใช้ร่วมกันและมีน้ำหนักมากกว่า เช่น
  `moveSingleAccountChannelSectionToDefaultAccount(...)` ด้วย

หากช่องทางของคุณต้องการเพียงโฆษณาว่า "ติดตั้ง Plugin นี้ก่อน" ในพื้นผิว
การตั้งค่า ให้เลือกใช้ `createOptionalChannelSetupSurface(...)` อะแดปเตอร์/ตัวช่วยสร้าง
ที่สร้างขึ้นจะปฏิเสธโดยค่าเริ่มต้นเมื่อเขียนการกำหนดค่าและดำเนินการขั้นสุดท้าย และจะนำ
ข้อความที่ระบุว่าต้องติดตั้งข้อความเดียวกันมาใช้ซ้ำในการตรวจสอบ การดำเนินการขั้นสุดท้าย และข้อความ
ลิงก์เอกสาร

หากช่องทางรองรับการตั้งค่าหรือการยืนยันตัวตนที่ขับเคลื่อนด้วยตัวแปรสภาพแวดล้อม และโฟลว์การเริ่มต้น/การกำหนดค่า
ทั่วไปควรทราบชื่อตัวแปรสภาพแวดล้อมเหล่านั้นก่อนรันไทม์โหลด ให้ประกาศชื่อเหล่านั้นใน
ไฟล์กำกับ Plugin ด้วย `channelEnvVars` เก็บ `envVars` ของรันไทม์ช่องทางหรือ
ค่าคงที่ภายในไว้สำหรับข้อความที่แสดงต่อผู้ปฏิบัติงานเท่านั้น

หากช่องทางสามารถปรากฏใน `status`, `channels list`, `channels status` หรือ
การสแกน SecretRef ก่อนรันไทม์ Plugin เริ่มทำงาน ให้เพิ่ม `openclaw.setupEntry` ใน
`package.json` จุดเข้านั้นควรนำเข้าได้อย่างปลอดภัยในพาธคำสั่งแบบ
อ่านอย่างเดียว และควรคืนข้อมูลเมตาของช่องทาง อะแดปเตอร์การกำหนดค่าที่ปลอดภัยสำหรับการตั้งค่า
อะแดปเตอร์สถานะ และข้อมูลเมตาเป้าหมายข้อมูลลับของช่องทางที่จำเป็นสำหรับ
ข้อมูลสรุปเหล่านั้น อย่าเริ่มไคลเอนต์ ลิสเทนเนอร์ หรือรันไทม์ทรานสปอร์ตจาก
จุดเข้าสำหรับการตั้งค่า

รักษาพาธนำเข้าของจุดเข้าหลักของช่องทางให้แคบด้วย การค้นพบสามารถประเมิน
จุดเข้าและโมดูล Plugin ช่องทางเพื่อลงทะเบียนความสามารถโดยไม่
เปิดใช้งานช่องทาง ไฟล์อย่าง `channel-plugin-api.ts` ควรส่งออก
ออบเจ็กต์ Plugin ช่องทางโดยไม่นำเข้าตัวช่วยสร้างการตั้งค่า ไคลเอนต์
ทรานสปอร์ต ซ็อกเก็ตลิสเทนเนอร์ ตัวเรียกใช้โปรเซสย่อย หรือโมดูลเริ่มต้นบริการ
ใส่ส่วนรันไทม์เหล่านั้นไว้ในโมดูลที่โหลดจาก `registerFull(...)`, ตัวตั้งค่า
รันไทม์ หรืออะแดปเตอร์ความสามารถแบบโหลดเมื่อใช้

### พาธย่อยช่องทางแบบแคบอื่นๆ

สำหรับพาธช่องทางที่ทำงานบ่อยอื่นๆ ให้เลือกใช้ตัวช่วยแบบแคบแทนพื้นผิวเดิม
ที่กว้างกว่า:

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` และ
  `openclaw/plugin-sdk/account-helpers` สำหรับการกำหนดค่าแบบหลายบัญชีและ
  การใช้บัญชีเริ่มต้นเป็นทางเลือกสำรอง
- `openclaw/plugin-sdk/inbound-envelope` และ
  `openclaw/plugin-sdk/channel-inbound` สำหรับเส้นทาง/เอนเวโลปขาเข้า และ
  การเชื่อมต่อเพื่อบันทึกและส่งต่อ
- `openclaw/plugin-sdk/channel-targets` สำหรับตัวช่วยแยกวิเคราะห์เป้าหมาย
- `openclaw/plugin-sdk/outbound-media` สำหรับการโหลดสื่อ และ
  `openclaw/plugin-sdk/channel-outbound` สำหรับตัวแทนข้อมูลประจำตัว/การส่งขาออก
  และการวางแผนเพย์โหลด
- `buildThreadAwareOutboundSessionRoute(...)` จาก
  `openclaw/plugin-sdk/channel-core` เมื่อเส้นทางขาออกควรรักษา
  `replyToId`/`threadId` ที่ระบุไว้อย่างชัดเจน หรือกู้คืนเซสชัน `:thread:`
  ปัจจุบันหลังจากคีย์เซสชันพื้นฐานยังคงตรงกัน Plugin ผู้ให้บริการสามารถ
  เขียนทับลำดับความสำคัญ พฤติกรรมส่วนต่อท้าย และการทำรหัสเธรดให้เป็นมาตรฐาน
  เมื่อแพลตฟอร์มของตนมีความหมายเชิงการนำส่งเธรดแบบเนทีฟ
- `openclaw/plugin-sdk/thread-bindings-runtime` สำหรับวงจรชีวิตการผูกเธรด
  และการลงทะเบียนอะแดปเตอร์
- `openclaw/plugin-sdk/agent-media-payload` เฉพาะเมื่อยังจำเป็นต้องใช้
  เค้าโครงฟิลด์เพย์โหลดเอเจนต์/สื่อแบบเดิม
- `openclaw/plugin-sdk/telegram-command-config` (เลิกใช้แล้ว: ไม่มี Plugin
  แบบรวมใดใช้ในระบบจริง) สำหรับการทำคำสั่งแบบกำหนดเองของ Telegram ให้เป็นมาตรฐาน
  การตรวจสอบความซ้ำซ้อน/ข้อขัดแย้ง และสัญญาการกำหนดค่าคำสั่งที่เสถียรเมื่อใช้ทางเลือกสำรอง
  สำหรับโค้ด Plugin ใหม่ ให้เลือกจัดการการกำหนดค่าคำสั่งภายใน Plugin

โดยทั่วไป ช่องทางที่ใช้เฉพาะการยืนยันตัวตนสามารถหยุดที่พาธเริ่มต้นได้: คอร์จัดการ
การอนุมัติ และ Plugin เพียงเปิดเผยความสามารถขาออก/การยืนยันตัวตน ช่องทาง
การอนุมัติแบบเนทีฟ เช่น Matrix, Slack, Telegram และทรานสปอร์ตแชตแบบกำหนดเอง
ควรใช้ตัวช่วยแบบเนทีฟที่ใช้ร่วมกันแทนการสร้างวงจรชีวิตการอนุมัติขึ้นเอง

## นโยบายการกล่าวถึงขาเข้า

แยกการจัดการการกล่าวถึงขาเข้าเป็นสองชั้น:

- การรวบรวมหลักฐานที่ Plugin เป็นเจ้าของ
- การประเมินนโยบายที่ใช้ร่วมกัน

ใช้ `openclaw/plugin-sdk/channel-mention-gating` สำหรับการตัดสินใจเกี่ยวกับนโยบายการกล่าวถึง
ใช้ `openclaw/plugin-sdk/channel-inbound` เฉพาะเมื่อต้องการ barrel
ตัวช่วยขาเข้าที่กว้างกว่า

เหมาะสำหรับตรรกะภายใน Plugin:

- การตรวจจับการตอบกลับบอต
- การตรวจจับการอ้างข้อความของบอต
- การตรวจสอบการมีส่วนร่วมในเธรด
- การยกเว้นข้อความบริการ/ระบบ
- แคชแบบเนทีฟของแพลตฟอร์มที่จำเป็นเพื่อพิสูจน์การมีส่วนร่วมของบอต

เหมาะสำหรับตัวช่วยที่ใช้ร่วมกัน:

- `requireMention`
- ผลการกล่าวถึงอย่างชัดเจน
- รายการอนุญาตการกล่าวถึงโดยนัย
- การข้ามด้วยคำสั่ง
- การตัดสินใจข้ามขั้นสุดท้าย

โฟลว์ที่แนะนำ:

1. คำนวณข้อเท็จจริงการกล่าวถึงภายใน
2. ส่งข้อเท็จจริงเหล่านั้นไปยัง `resolveInboundMentionDecision({ facts, policy })`
3. ใช้ `decision.effectiveWasMentioned`, `decision.shouldBypassMention` และ
   `decision.shouldSkip` ในเกตขาเข้าของคุณ

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const wasMentioned = matchesMentionWithExplicit({
  text,
  mentionRegexes,
  explicit: {
    hasAnyMention,
    isExplicitlyMentioned,
    canResolveExplicit,
  },
});

const facts = {
  canDetectMention: true,
  wasMentioned,
  hasAnyMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`matchesMentionWithExplicit(...)` คืนค่าบูลีน `hasAnyMention`,
`isExplicitlyMentioned` และ `canResolveExplicit` มาจากข้อมูลเมตาการกล่าวถึงแบบเนทีฟ
ของช่องทางเอง (เอนทิตีข้อความ แฟล็กการตอบกลับบอต และอื่นๆ ที่คล้ายกัน)
ให้ระบุค่า `false`/`undefined` เมื่อแพลตฟอร์มของคุณตรวจจับค่าเหล่านั้นไม่ได้

`api.runtime.channel.mentions` เปิดเผยตัวช่วยการกล่าวถึงที่ใช้ร่วมกันชุดเดียวกันสำหรับ
Plugin ช่องทางแบบรวมที่พึ่งพาการฉีดรันไทม์อยู่แล้ว:
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`

หากต้องการเพียง `implicitMentionKindWhen` และ `resolveInboundMentionDecision`
ให้นำเข้าจาก `openclaw/plugin-sdk/channel-mention-gating` เพื่อหลีกเลี่ยงการโหลด
ตัวช่วยรันไทม์ขาเข้าที่ไม่เกี่ยวข้อง

## คำแนะนำทีละขั้นตอน

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="แพ็กเกจและไฟล์ manifest">
    สร้างไฟล์มาตรฐานของ Plugin ฟิลด์ `channels` ใน
    `openclaw.plugin.json` (ไม่ใช่ฟิลด์ `kind`) คือสิ่งที่ระบุว่า manifest
    เป็นเจ้าของช่องทาง สำหรับพื้นผิวเมทาดาทาของแพ็กเกจทั้งหมด โปรดดู
    [การตั้งค่าและการกำหนดค่า Plugin](/th/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "เชื่อมต่อ OpenClaw กับ Acme Chat"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Plugin ช่องทาง Acme Chat",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "โทเค็นของบอต",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` ใช้ตรวจสอบ `plugins.entries.acme-chat.config` ใช้สำหรับ
    การตั้งค่าที่ Plugin เป็นเจ้าของซึ่งไม่ใช่การกำหนดค่าบัญชีช่องทาง
    `channelConfigs.acme-chat.schema` ใช้ตรวจสอบ `channels.acme-chat` และเป็น
    แหล่งข้อมูลในเส้นทางที่ไม่ได้ใช้งานบ่อย ซึ่งสคีมาการกำหนดค่า การตั้งค่า และพื้นผิว UI ใช้งานก่อนที่
    รันไทม์ของ Plugin จะโหลด โปรดดู [Plugin manifest](/th/plugins/manifest) สำหรับข้อมูลอ้างอิง
    ฟิลด์ระดับบนสุดทั้งหมด

  </Step>

  <Step title="สร้างออบเจ็กต์ Plugin ช่องทาง">
    อินเทอร์เฟซ `ChannelPlugin` มีพื้นผิวอะแดปเตอร์เสริมจำนวนมาก เริ่มจาก
    ส่วนขั้นต่ำ ได้แก่ `id`, `config` และ `setup` แล้วเพิ่มอะแดปเตอร์ตามที่
    ต้องการ

    สร้าง `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // ไคลเอนต์ API ของแพลตฟอร์มของคุณ

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: ต้องระบุโทเค็น");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        // การแก้ไข/ตรวจสอบบัญชีอยู่ใน `config` ไม่ใช่ `setup`
        // `setup` ครอบคลุมการเขียนข้อมูลระหว่างการเริ่มต้นใช้งาน (applyAccountConfig, validateInput)
        config: {
          listAccountIds: () => ["default"],
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
        setup: {
          applyAccountConfig: ({ cfg, input }) => ({
            ...cfg,
            channels: {
              ...cfg.channels,
              "acme-chat": { ...(cfg.channels as any)?.["acme-chat"], ...input },
            },
          }),
        },
      }),

      // ความปลอดภัยของ DM: ผู้ที่สามารถส่งข้อความถึงบอตได้
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // การจับคู่: ขั้นตอนการอนุมัติสำหรับผู้ติดต่อ DM รายใหม่
      pairing: {
        text: {
          idLabel: "ชื่อผู้ใช้ Acme Chat",
          message: "ส่งรหัสนี้เพื่อยืนยันตัวตนของคุณ:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `รหัสการจับคู่: ${code}`);
          },
        },
      },

      // เธรด: วิธีส่งการตอบกลับ
      threading: { topLevelReplyToMode: "reply" },

      // ขาออก: ส่งข้อความไปยังแพลตฟอร์ม
      outbound: {
        attachedResults: {
          channel: "acme-chat",
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    สำหรับช่องทางที่ยอมรับทั้งคีย์ DM ระดับบนสุดแบบมาตรฐานและคีย์ซ้อนแบบเดิม ให้ใช้ตัวช่วยจาก `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` และ `normalizeChannelDmPolicy` เพื่อให้ค่าภายในบัญชีมีลำดับความสำคัญเหนือค่าระดับรากที่สืบทอดมา จับคู่ตัวแก้ไขเดียวกันกับการซ่อมแซมโดย doctor ผ่าน `normalizeLegacyDmAliases` เพื่อให้รันไทม์และการย้ายข้อมูลอ่านสัญญาเดียวกัน

    <Accordion title="สิ่งที่ createChatChannelPlugin จัดการให้คุณ">
      แทนที่จะใช้งานอินเทอร์เฟซอะแดปเตอร์ระดับต่ำด้วยตนเอง คุณส่ง
      ตัวเลือกเชิงประกาศ แล้วตัวสร้างจะประกอบตัวเลือกเหล่านั้น:

      | ตัวเลือก | สิ่งที่เชื่อมต่อ |
      | --- | --- |
      | `security.dm` | ตัวแก้ไขความปลอดภัยของ DM แบบกำหนดขอบเขตจากฟิลด์การกำหนดค่า |
      | `pairing.text` | ขั้นตอนการจับคู่ DM แบบข้อความพร้อมการแลกเปลี่ยนรหัส |
      | `threading` | ตัวแก้ไขโหมดการตอบกลับ (ค่าคงที่ กำหนดขอบเขตตามบัญชี หรือกำหนดเอง) |
      | `outbound.attachedResults` | ฟังก์ชันส่งที่คืนค่าเมทาดาทาของผลลัพธ์ (รหัสข้อความ) โดยต้องมีรหัส `channel` ที่อยู่คู่กัน เพื่อให้แกนกลางประทับข้อมูลลงในผลลัพธ์การส่งที่คืนมาได้ |

      นอกจากนี้ยังสามารถส่งออบเจ็กต์อะแดปเตอร์โดยตรงแทนตัวเลือกเชิงประกาศได้
      หากต้องการควบคุมอย่างเต็มรูปแบบ

      อะแดปเตอร์ขาออกโดยตรงอาจกำหนดฟังก์ชัน `chunker(text, limit, ctx)`
      `ctx.formatting` ซึ่งเป็นตัวเลือกจะเก็บการตัดสินใจด้านการจัดรูปแบบขณะส่ง
      เช่น `maxLinesPerMessage` ให้นำไปใช้ก่อนส่ง เพื่อให้เธรดการตอบกลับ
      และขอบเขตของส่วนข้อความได้รับการแก้ไขเพียงครั้งเดียวโดยการส่งขาออกร่วม
      บริบทการส่งยังรวม `replyToIdSource` (`implicit` หรือ `explicit`)
      เมื่อแก้ไขเป้าหมายการตอบกลับแบบเนทีฟแล้ว เพื่อให้ตัวช่วยเพย์โหลดสามารถรักษา
      แท็กการตอบกลับที่ระบุอย่างชัดเจนไว้ โดยไม่ใช้ช่องการตอบกลับโดยนัยแบบใช้ครั้งเดียว
    </Accordion>

  </Step>

  <Step title="เชื่อมต่อจุดเริ่มต้น">
    สร้าง `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Plugin ช่องทาง Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("การจัดการ Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "การจัดการ Acme Chat",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    ใส่ตัวอธิบาย CLI ที่ช่องทางเป็นเจ้าของไว้ใน `registerCliMetadata(...)` เพื่อให้ OpenClaw
    สามารถแสดงตัวอธิบายเหล่านั้นในความช่วยเหลือระดับรากได้โดยไม่ต้องเปิดใช้งานรันไทม์ช่องทางทั้งหมด
    ขณะที่การโหลดแบบเต็มตามปกติยังคงรับตัวอธิบายชุดเดียวกันไปใช้ในการลงทะเบียนคำสั่ง
    จริง เก็บ `registerFull(...)` ไว้สำหรับงานเฉพาะรันไทม์
    `defineChannelPluginEntry` จัดการการแยกโหมดการลงทะเบียนโดยอัตโนมัติ
    หาก `registerFull(...)` ลงทะเบียนเมธอด RPC ของ Gateway ให้ใช้
    คำนำหน้าเฉพาะ Plugin เนมสเปซผู้ดูแลระบบของแกนกลาง (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ยังคงสงวนไว้และ
    แก้ไขเป็น `operator.admin` เสมอ โปรดดู
    [จุดเริ่มต้น](/th/plugins/sdk-entrypoints#definechannelpluginentry) สำหรับตัวเลือก
    ทั้งหมด

  </Step>

  <Step title="เพิ่มจุดเริ่มต้นสำหรับการตั้งค่า">
    สร้าง `setup-entry.ts` สำหรับการโหลดแบบเบาระหว่างการเริ่มต้นใช้งาน:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw โหลดรายการนี้แทนจุดเริ่มต้นแบบเต็มเมื่อช่องทางถูกปิดใช้งาน
    หรือยังไม่ได้กำหนดค่า วิธีนี้ช่วยหลีกเลี่ยงการดึงโค้ดรันไทม์ขนาดใหญ่เข้ามาระหว่างขั้นตอนการตั้งค่า
    โปรดดูรายละเอียดที่ [การตั้งค่าและการกำหนดค่า](/th/plugins/sdk-setup#setup-entry)

    ช่องทางในเวิร์กสเปซที่รวมมากับระบบซึ่งแยกเอ็กซ์พอร์ตที่ปลอดภัยสำหรับการตั้งค่าไว้ในโมดูล
    เสริม สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก
    `openclaw/plugin-sdk/channel-entry-contract` เมื่อต้องใช้
    ตัวตั้งค่ารันไทม์ขณะตั้งค่าอย่างชัดเจนด้วย

  </Step>

  <Step title="จัดการข้อความขาเข้า">
    Plugin ต้องรับข้อความจากแพลตฟอร์มและส่งต่อไปยัง
    OpenClaw รูปแบบทั่วไปคือ Webhook ที่ตรวจสอบคำขอและ
    ส่งคำขอผ่านตัวจัดการขาเข้าของช่องทาง:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // การยืนยันตัวตนที่ Plugin จัดการ (ตรวจสอบลายเซ็นด้วยตนเอง)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // ตัวจัดการขาเข้าจะส่งข้อความไปยัง OpenClaw
          // การเชื่อมต่อที่แน่นอนขึ้นอยู่กับ SDK ของแพลตฟอร์ม -
          // โปรดดูตัวอย่างจริงในแพ็กเกจ Plugin Microsoft Teams หรือ Google Chat ที่รวมมากับระบบ
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      การจัดการข้อความขาเข้าขึ้นอยู่กับแต่ละช่องทาง Plugin ช่องทางแต่ละตัวเป็นเจ้าของ
      ไปป์ไลน์ขาเข้าของตนเอง โปรดดู Plugin ช่องทางที่รวมมากับระบบ
      (เช่น แพ็กเกจ Plugin Microsoft Teams หรือ Google Chat) สำหรับรูปแบบที่ใช้จริง
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="ทดสอบ">
เขียนการทดสอบไว้ใกล้กับโค้ดใน `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    สำหรับตัวช่วยทดสอบที่ใช้ร่วมกัน โปรดดู[การทดสอบ](/th/plugins/sdk-testing)

</Step>
</Steps>

## โครงสร้างไฟล์

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # ข้อมูลเมตา openclaw.channel
├── openclaw.plugin.json      # ไฟล์ Manifest พร้อมสคีมาการกำหนดค่า
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # การส่งออกสาธารณะ (ไม่บังคับ)
├── runtime-api.ts            # การส่งออกภายในของรันไทม์ (ไม่บังคับ)
└── src/
    ├── channel.ts            # ChannelPlugin ผ่าน createChatChannelPlugin
    ├── channel.test.ts       # การทดสอบ
    ├── client.ts             # ไคลเอนต์ API ของแพลตฟอร์ม
    └── runtime.ts            # ที่เก็บรันไทม์ (หากจำเป็น)
```

## หัวข้อขั้นสูง

<CardGroup cols={2}>
  <Card title="ตัวเลือกการจัดการเธรด" icon="git-branch" href="/th/plugins/sdk-entrypoints#registration-mode">
    โหมดการตอบกลับแบบคงที่ แบบจำกัดขอบเขตตามบัญชี หรือแบบกำหนดเอง
  </Card>
  <Card title="การผสานรวมเครื่องมือข้อความ" icon="puzzle" href="/th/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool และการค้นหาการดำเนินการ
  </Card>
  <Card title="การระบุเป้าหมาย" icon="crosshair" href="/th/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="ตัวช่วยรันไทม์" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, STT, สื่อ และเอเจนต์ย่อยผ่าน api.runtime
  </Card>
  <Card title="API ขาเข้าของช่องทาง" icon="bolt" href="/th/plugins/sdk-channel-inbound">
    วงจรเหตุการณ์ขาเข้าที่ใช้ร่วมกัน: รับเข้า ระบุ บันทึก ส่งต่อ และดำเนินการให้เสร็จสิ้น
  </Card>
</CardGroup>

<Note>
ยังมีจุดเชื่อมต่อตัวช่วยที่รวมมาให้บางส่วนสำหรับการบำรุงรักษา Plugin ที่รวมมาให้และ
ความเข้ากันได้ แต่ไม่ใช่รูปแบบที่แนะนำสำหรับ Plugin ช่องทางใหม่
ควรใช้เส้นทางย่อยทั่วไปสำหรับช่องทาง/การตั้งค่า/การตอบกลับ/รันไทม์จากพื้นผิว SDK
ร่วมกัน เว้นแต่กำลังบำรุงรักษาตระกูล Plugin ที่รวมมาให้นั้นโดยตรง
</Note>

## ขั้นตอนถัดไป

- [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) - หาก Plugin ของคุณมีโมเดลให้ด้วย
- [ภาพรวม SDK](/th/plugins/sdk-overview) - เอกสารอ้างอิงการนำเข้าจากเส้นทางย่อยทั้งหมด
- [การทดสอบ SDK](/th/plugins/sdk-testing) - ยูทิลิตีการทดสอบและการทดสอบสัญญา
- [Manifest ของ Plugin](/th/plugins/manifest) - สคีมา Manifest ฉบับเต็ม

## ที่เกี่ยวข้อง

- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [Plugin สำหรับชุดเครื่องมือเอเจนต์](/th/plugins/sdk-agent-harness)
