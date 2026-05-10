---
read_when:
    - คุณกำลังสร้าง Plugin ช่องทางการรับส่งข้อความใหม่
    - คุณต้องการเชื่อมต่อ OpenClaw เข้ากับแพลตฟอร์มรับส่งข้อความ
    - คุณต้องเข้าใจส่วนติดต่อของอะแดปเตอร์ ChannelPlugin
sidebarTitle: Channel Plugins
summary: คู่มือแบบทีละขั้นตอนในการสร้าง Plugin ช่องทางการรับส่งข้อความสำหรับ OpenClaw
title: การสร้าง Plugin สำหรับช่องทาง
x-i18n:
    generated_at: "2026-05-10T19:49:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 769ccd09eea0df78337822f41da58dc20ec2950409d39d4d19a5f92a35ec49ed
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

คู่มือนี้จะแนะนำขั้นตอนการสร้าง Plugin ช่องทางที่เชื่อมต่อ OpenClaw กับ
แพลตฟอร์มรับส่งข้อความ เมื่อจบแล้ว คุณจะมีช่องทางที่ใช้งานได้ พร้อมความปลอดภัยของ DM,
การจับคู่, การจัดเธรดการตอบกลับ และการส่งข้อความขาออก

<Info>
  หากคุณยังไม่เคยสร้าง Plugin ของ OpenClaw มาก่อน โปรดอ่าน
  [เริ่มต้นใช้งาน](/th/plugins/building-plugins) ก่อน เพื่อดูโครงสร้างแพ็กเกจ
  พื้นฐานและการตั้งค่าไฟล์ประกาศ
</Info>

## Plugin ช่องทางทำงานอย่างไร

Plugin ช่องทางไม่จำเป็นต้องมีเครื่องมือส่ง/แก้ไข/แสดงปฏิกิริยาเป็นของตัวเอง OpenClaw มีเครื่องมือ
`message` ที่ใช้ร่วมกันหนึ่งตัวในแกนหลัก Plugin ของคุณเป็นเจ้าของ:

- **การกำหนดค่า** - การระบุบัญชีและตัวช่วยตั้งค่า
- **ความปลอดภัย** - นโยบาย DM และรายการอนุญาต
- **การจับคู่** - โฟลว์อนุมัติผ่าน DM
- **ไวยากรณ์เซสชัน** - วิธีที่รหัสการสนทนาเฉพาะผู้ให้บริการแมปไปยังแชตฐาน, รหัสเธรด และทางเลือกสำรองของผู้ปกครอง
- **ขาออก** - การส่งข้อความ, สื่อ และโพลไปยังแพลตฟอร์ม
- **การจัดเธรด** - วิธีจัดเธรดการตอบกลับ
- **การพิมพ์ Heartbeat** - สัญญาณกำลังพิมพ์/ไม่ว่างแบบไม่บังคับสำหรับเป้าหมายการส่ง Heartbeat

แกนหลักเป็นเจ้าของเครื่องมือข้อความที่ใช้ร่วมกัน, การเดินสายพรอมป์, รูปร่างคีย์เซสชันชั้นนอก,
การทำบัญชี `:thread:` ทั่วไป และการส่งต่อ

Plugin ช่องทางใหม่ควรเปิดเผยอะแดปเตอร์ `message` ด้วย
`defineChannelMessageAdapter` จาก `openclaw/plugin-sdk/channel-message` ด้วย
อะแดปเตอร์ประกาศความสามารถในการส่งขั้นสุดท้ายแบบคงทนที่ทรานสปอร์ตเนทีฟ
รองรับจริง และชี้การส่งข้อความ/สื่อไปยังฟังก์ชันทรานสปอร์ตเดียวกับ
อะแดปเตอร์ `outbound` เดิม ประกาศความสามารถเฉพาะเมื่อมีการทดสอบสัญญา
พิสูจน์ผลข้างเคียงฝั่งเนทีฟและใบรับที่ส่งคืนแล้วเท่านั้น
สำหรับสัญญา API ฉบับเต็ม, ตัวอย่าง, เมทริกซ์ความสามารถ, กฎใบรับ, การสรุปผลตัวอย่างสด,
นโยบายการยืนยันการรับ, การทดสอบ และตารางการย้าย โปรดดู
[API ข้อความช่องทาง](/th/plugins/sdk-channel-message)
หากอะแดปเตอร์ `outbound` ที่มีอยู่มีเมธอดส่งและเมทาดาทาความสามารถที่ถูกต้องแล้ว
ให้ใช้ `createChannelMessageAdapterFromOutbound(...)` เพื่อ
สร้างอะแดปเตอร์ `message` แทนการเขียนบริดจ์อีกตัวด้วยมือ
การส่งของอะแดปเตอร์ควรคืนค่า `MessageReceipt` เมื่อโค้ดความเข้ากันได้
ยังต้องใช้รหัสแบบเดิม ให้สร้างจาก `listMessageReceiptPlatformIds(...)`
หรือ `resolveMessageReceiptPrimaryId(...)` แทนการเก็บฟิลด์
`messageIds` คู่ขนานในโค้ดวงจรชีวิตใหม่
ช่องทางที่รองรับตัวอย่างควรประกาศ `message.live.capabilities` ด้วย
วงจรชีวิตสดที่ตนเป็นเจ้าของอย่างแน่นอน เช่น `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` หรือ
`quietFinalization` ช่องทางที่สรุปผลตัวอย่างฉบับร่างในตำแหน่งเดิมควร
ประกาศ `message.live.finalizer.capabilities` ด้วย เช่น `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` และ
`retainOnAmbiguousFailure` และกำหนดเส้นทางตรรกะรันไทม์ผ่าน
`defineFinalizableLivePreviewAdapter(...)` พร้อม
`deliverWithFinalizableLivePreviewAdapter(...)` รักษาความสามารถเหล่านั้นให้มี
การทดสอบ `verifyChannelMessageLiveCapabilityAdapterProofs(...)` และ
`verifyChannelMessageLiveFinalizerProofs(...)` รองรับ เพื่อไม่ให้พฤติกรรมตัวอย่างเนทีฟ,
ความคืบหน้า, การแก้ไข, ทางเลือกสำรอง/การคงไว้, การล้างข้อมูล และใบรับ
คลาดเคลื่อนไปอย่างเงียบๆ
ตัวรับขาเข้าที่เลื่อนการยืนยันของแพลตฟอร์มควรประกาศ
`message.receive.defaultAckPolicy` และ `supportedAckPolicies` แทนการซ่อน
เวลาการยืนยันไว้ในสถานะเฉพาะมอนิเตอร์ ครอบคลุมนโยบายที่ประกาศทุกนโยบายด้วย
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`

ตัวช่วยตอบกลับ/เทิร์นแบบเดิม เช่น `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` และ `recordInboundSessionAndDispatchReply`
ยังคงพร้อมใช้งานสำหรับดิสแพตเชอร์ที่ต้องเข้ากันได้ อย่าใช้ชื่อเหล่านั้นสำหรับโค้ดช่องทางใหม่;
Plugin ใหม่ควรเริ่มจากอะแดปเตอร์ `message`, ใบรับ และ
ตัวช่วยวงจรชีวิตรับ/ส่งบน `openclaw/plugin-sdk/channel-message`

ช่องทางที่กำลังย้ายการอนุญาตขาเข้าสามารถใช้ซับพาธทดลอง
`openclaw/plugin-sdk/channel-ingress-runtime` จากพาธรับของรันไทม์ได้
ซับพาธนี้เก็บการค้นหาแพลตฟอร์มและผลข้างเคียงไว้ใน Plugin ขณะที่
ใช้การระบุสถานะรายการอนุญาต, การตัดสินใจเส้นทาง/ผู้ส่ง/คำสั่ง/เหตุการณ์/การเปิดใช้งาน,
การวินิจฉัยที่ปกปิดข้อมูล และการแมปการรับเทิร์นร่วมกัน รักษาการทำให้ตัวตนของ Plugin
เป็นรูปแบบมาตรฐานไว้ในตัวบรรยายที่คุณส่งให้ตัวแก้ไข อย่า
ซีเรียลไลซ์ค่าการจับคู่ดิบจากสถานะหรือการตัดสินใจที่แก้ไขแล้ว โปรดดู
[API ทางเข้าช่องทาง](/th/plugins/sdk-channel-ingress) สำหรับการออกแบบ API,
ขอบเขตความเป็นเจ้าของ และความคาดหวังด้านการทดสอบ

หากช่องทางของคุณรองรับตัวบ่งชี้การพิมพ์นอกการตอบกลับขาเข้า ให้เปิดเผย
`heartbeat.sendTyping(...)` บน Plugin ช่องทาง แกนหลักจะเรียกด้วย
เป้าหมายการส่ง Heartbeat ที่แก้ไขแล้วก่อนที่การรันโมเดล Heartbeat จะเริ่ม
และใช้วงจรชีวิต keepalive/cleanup การพิมพ์ที่ใช้ร่วมกัน เพิ่ม `heartbeat.clearTyping(...)`
เมื่อแพลตฟอร์มต้องการสัญญาณหยุดอย่างชัดเจน

หากช่องทางของคุณเพิ่มพารามิเตอร์เครื่องมือข้อความที่มีแหล่งสื่อ ให้เปิดเผย
ชื่อพารามิเตอร์เหล่านั้นผ่าน `describeMessageTool(...).mediaSourceParams` แกนหลักใช้
รายการที่ชัดเจนนั้นสำหรับการทำให้พาธแซนด์บ็อกซ์เป็นรูปแบบมาตรฐานและนโยบายการเข้าถึงสื่อขาออก
ดังนั้น Plugin จึงไม่จำเป็นต้องมีกรณีพิเศษในแกนหลักที่ใช้ร่วมกันสำหรับพารามิเตอร์เฉพาะผู้ให้บริการ
อย่างอวาตาร์, ไฟล์แนบ หรือภาพปก
ควรคืนค่าแมปตามคีย์แอ็กชัน เช่น
`{ "set-profile": ["avatarUrl", "avatarPath"] }` เพื่อไม่ให้แอ็กชันที่ไม่เกี่ยวข้อง
รับอาร์กิวเมนต์สื่อของอีกแอ็กชันหนึ่ง อาร์เรย์แบบแบนยังคงใช้ได้สำหรับพารามิเตอร์ที่
ตั้งใจให้ใช้ร่วมกันในทุกแอ็กชันที่เปิดเผย

หากช่องทางของคุณต้องการการจัดรูปเฉพาะผู้ให้บริการสำหรับ `message(action="send")`
ควรใช้ `actions.prepareSendPayload(...)` ใส่การ์ดเนทีฟ, บล็อก, ฝัง หรือ
ข้อมูลคงทนอื่นไว้ใต้ `payload.channelData.<channel>` และปล่อยให้แกนหลักดำเนินการ
ส่งจริงผ่านอะแดปเตอร์ขาออก/ข้อความ ใช้
`actions.handleAction(...)` สำหรับการส่งเฉพาะเป็นทางเลือกสำรองด้านความเข้ากันได้สำหรับ
เพย์โหลดที่ไม่สามารถซีเรียลไลซ์และลองใหม่ได้

หากแพลตฟอร์มของคุณเก็บขอบเขตเพิ่มเติมไว้ในรหัสการสนทนา ให้เก็บการแยกวิเคราะห์นั้น
ไว้ใน Plugin ด้วย `messaging.resolveSessionConversation(...)` นี่คือฮุก
มาตรฐานสำหรับแมป `rawId` ไปยังรหัสการสนทนาฐาน, รหัสเธรดแบบไม่บังคับ,
`baseConversationId` แบบชัดเจน และ `parentConversationCandidates` ใดๆ
เมื่อคุณคืนค่า `parentConversationCandidates` ให้เรียงจากผู้ปกครองที่แคบที่สุด
ไปยังการสนทนาที่กว้างที่สุด/ฐาน

ใช้ `openclaw/plugin-sdk/channel-route` เมื่อโค้ด Plugin ต้องทำให้
ฟิลด์ที่คล้ายเส้นทางเป็นรูปแบบมาตรฐาน, เปรียบเทียบเธรดย่อยกับเส้นทางผู้ปกครอง หรือสร้าง
คีย์กำจัดซ้ำที่เสถียรจาก `{ channel, to, accountId, threadId }` ตัวช่วยนี้
ทำให้รหัสเธรดตัวเลขเป็นรูปแบบมาตรฐานแบบเดียวกับที่แกนหลักทำ ดังนั้น Plugin ควรใช้
แทนการเปรียบเทียบ `String(threadId)` แบบเฉพาะกิจ
Plugin ที่มีไวยากรณ์เป้าหมายเฉพาะผู้ให้บริการสามารถฉีดตัวแยกวิเคราะห์ของตนเข้าไปใน
`resolveChannelRouteTargetWithParser(...)` และยังได้รูปร่างเป้าหมายเส้นทาง
และความหมายทางเลือกสำรองของเธรดแบบเดียวกับที่แกนหลักใช้

Plugin ที่รวมมาให้ซึ่งต้องใช้การแยกวิเคราะห์แบบเดียวกันก่อนที่รีจิสทรีช่องทางจะบูต
ยังสามารถเปิดเผยไฟล์ระดับบนสุด `session-key-api.ts` พร้อมเอ็กซ์พอร์ต
`resolveSessionConversation(...)` ที่ตรงกันได้ แกนหลักใช้พื้นผิวที่ปลอดภัยต่อการบูตนี้
เฉพาะเมื่อรีจิสทรี Plugin ของรันไทม์ยังไม่พร้อมใช้งานเท่านั้น

`messaging.resolveParentConversationCandidates(...)` ยังคงพร้อมใช้งานเป็น
ทางเลือกสำรองด้านความเข้ากันได้แบบเดิมเมื่อ Plugin ต้องการเพียงทางเลือกสำรองของผู้ปกครอง
บนรหัสทั่วไป/ดิบ หากมีฮุกทั้งสอง แกนหลักจะใช้
`resolveSessionConversation(...).parentConversationCandidates` ก่อน และจะ
ย้อนกลับไปใช้ `resolveParentConversationCandidates(...)` เฉพาะเมื่อฮุกมาตรฐาน
ละเว้นค่าเหล่านั้น

## การอนุมัติและความสามารถของช่องทาง

Plugin ช่องทางส่วนใหญ่ไม่จำเป็นต้องมีโค้ดเฉพาะการอนุมัติ

- core เป็นเจ้าของ `/approve` ในแชทเดียวกัน, payload ของปุ่มอนุมัติที่ใช้ร่วมกัน, และการส่ง fallback ทั่วไป
- แนะนำให้มีออบเจ็กต์ `approvalCapability` เดียวบน Plugin ช่องทาง เมื่อช่องทางต้องการพฤติกรรมเฉพาะสำหรับการอนุมัติ
- `ChannelPlugin.approvals` ถูกลบออกแล้ว ให้วางข้อเท็จจริงด้านการส่ง/เนทีฟ/การเรนเดอร์/การยืนยันสิทธิ์ของการอนุมัติไว้บน `approvalCapability`
- `plugin.auth` ใช้เฉพาะเข้าสู่ระบบ/ออกจากระบบเท่านั้น; core จะไม่อ่าน hook การยืนยันสิทธิ์ของการอนุมัติจากออบเจ็กต์นั้นอีกต่อไป
- `approvalCapability.authorizeActorAction` และ `approvalCapability.getActionAvailabilityState` เป็น seam มาตรฐานสำหรับการยืนยันสิทธิ์การอนุมัติ
- ใช้ `approvalCapability.getActionAvailabilityState` สำหรับความพร้อมของการยืนยันสิทธิ์การอนุมัติในแชทเดียวกัน
- หากช่องทางของคุณเปิดเผยการอนุมัติ exec แบบเนทีฟ ให้ใช้ `approvalCapability.getExecInitiatingSurfaceState` สำหรับสถานะพื้นผิวเริ่มต้น/ไคลเอนต์เนทีฟเมื่อแตกต่างจากการยืนยันสิทธิ์การอนุมัติในแชทเดียวกัน core ใช้ hook เฉพาะ exec นี้เพื่อแยก `enabled` กับ `disabled`, ตัดสินว่าช่องทางที่เริ่มต้นรองรับการอนุมัติ exec แบบเนทีฟหรือไม่, และรวมช่องทางนั้นไว้ในคำแนะนำ fallback ของไคลเอนต์เนทีฟ `createApproverRestrictedNativeApprovalCapability(...)` จะเติมส่วนนี้ให้สำหรับกรณีทั่วไป
- ใช้ `outbound.shouldSuppressLocalPayloadPrompt` หรือ `outbound.beforeDeliverPayload` สำหรับพฤติกรรมวงจรชีวิตของ payload เฉพาะช่องทาง เช่น การซ่อน prompt การอนุมัติภายในที่ซ้ำกัน หรือการส่งตัวบ่งชี้ว่ากำลังพิมพ์ก่อนส่ง
- ใช้ `approvalCapability.delivery` เฉพาะสำหรับการกำหนดเส้นทางการอนุมัติแบบเนทีฟหรือการระงับ fallback
- ใช้ `approvalCapability.nativeRuntime` สำหรับข้อเท็จจริงการอนุมัติแบบเนทีฟที่ช่องทางเป็นเจ้าของ ให้คงความ lazy ไว้บน entrypoint ของช่องทางที่เป็น hot path ด้วย `createLazyChannelApprovalNativeRuntimeAdapter(...)` ซึ่งสามารถนำเข้าโมดูล runtime ของคุณตามต้องการได้ โดยยังให้ core ประกอบวงจรชีวิตการอนุมัติได้
- ใช้ `approvalCapability.render` เฉพาะเมื่อช่องทางต้องการ payload การอนุมัติแบบกำหนดเองจริง ๆ แทน renderer ที่ใช้ร่วมกัน
- ใช้ `approvalCapability.describeExecApprovalSetup` เมื่อช่องทางต้องการให้คำตอบในเส้นทาง disabled อธิบาย knob การตั้งค่าที่แน่นอนซึ่งจำเป็นต่อการเปิดใช้การอนุมัติ exec แบบเนทีฟ hook จะได้รับ `{ channel, channelLabel, accountId }`; ช่องทางแบบบัญชีที่มีชื่อควรเรนเดอร์ path ที่ผูกกับขอบเขตบัญชี เช่น `channels.<channel>.accounts.<id>.execApprovals.*` แทนค่าเริ่มต้นระดับบนสุด
- หากช่องทางสามารถอนุมานตัวตน DM ที่เสถียรคล้ายเจ้าของได้จาก config ที่มีอยู่ ให้ใช้ `createResolvedApproverActionAuthAdapter` จาก `openclaw/plugin-sdk/approval-runtime` เพื่อจำกัด `/approve` ในแชทเดียวกันโดยไม่เพิ่มตรรกะ core เฉพาะการอนุมัติ
- หากช่องทางต้องการการส่งการอนุมัติแบบเนทีฟ ให้โค้ดช่องทางเน้นที่การทำ target normalization รวมถึงข้อเท็จจริงด้านการขนส่ง/การนำเสนอ ใช้ `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, และ `createApproverRestrictedNativeApprovalCapability` จาก `openclaw/plugin-sdk/approval-runtime` วางข้อเท็จจริงเฉพาะช่องทางไว้หลัง `approvalCapability.nativeRuntime` โดยเหมาะที่สุดผ่าน `createChannelApprovalNativeRuntimeAdapter(...)` หรือ `createLazyChannelApprovalNativeRuntimeAdapter(...)` เพื่อให้ core ประกอบ handler และเป็นเจ้าของการกรองคำขอ, การกำหนดเส้นทาง, การลบรายการซ้ำ, การหมดอายุ, การสมัคร Gateway, และการแจ้งว่าถูกกำหนดเส้นทางไปที่อื่น `nativeRuntime` ถูกแยกเป็น seam ที่เล็กลงสองสามส่วน:
- `createChannelNativeOriginTargetResolver` ใช้ตัวจับคู่ route ของช่องทางที่ใช้ร่วมกันโดยค่าเริ่มต้นสำหรับ target `{ to, accountId, threadId }` ส่ง `targetsMatch` เฉพาะเมื่อช่องทางมีกฎความเทียบเท่าเฉพาะ provider เช่น การจับคู่ prefix timestamp ของ Slack
- ส่ง `normalizeTargetForMatch` ให้ `createChannelNativeOriginTargetResolver` เมื่อช่องทางต้อง canonicalize id ของ provider ก่อนที่ตัวจับคู่ route เริ่มต้นหรือ callback `targetsMatch` แบบกำหนดเองจะทำงาน ขณะยังรักษา target เดิมไว้สำหรับการส่ง ใช้ `normalizeTarget` เฉพาะเมื่อ target การส่งที่ resolve แล้วควรถูก canonicalize เอง
- `availability` - บัญชีถูกกำหนดค่าไว้หรือไม่ และควรจัดการคำขอหรือไม่
- `presentation` - แมป view model การอนุมัติที่ใช้ร่วมกันเป็น payload เนทีฟ pending/resolved/expired หรือ action สุดท้าย
- `transport` - เตรียม target รวมถึงส่ง/อัปเดต/ลบข้อความการอนุมัติแบบเนทีฟ
- `interactions` - hook เสริมสำหรับ bind/unbind/clear-action สำหรับปุ่มหรือ reaction แบบเนทีฟ
- `observe` - hook เสริมสำหรับ diagnostics การส่ง
- หากช่องทางต้องการออบเจ็กต์ที่ runtime เป็นเจ้าของ เช่น client, token, Bolt app, หรือ webhook receiver ให้ลงทะเบียนผ่าน `openclaw/plugin-sdk/channel-runtime-context` registry ของ runtime context ทั่วไปทำให้ core bootstrap handler ที่ขับเคลื่อนด้วย capability จากสถานะเริ่มต้นของช่องทางได้โดยไม่เพิ่ม glue wrapper เฉพาะการอนุมัติ
- ใช้ `createChannelApprovalHandler` หรือ `createChannelNativeApprovalRuntime` ระดับล่างเฉพาะเมื่อ seam ที่ขับเคลื่อนด้วย capability ยังแสดงออกได้ไม่พอ
- ช่องทางการอนุมัติแบบเนทีฟต้องส่งทั้ง `accountId` และ `approvalKind` ผ่าน helper เหล่านั้น `accountId` ทำให้นโยบายการอนุมัติหลายบัญชีถูกจำกัดขอบเขตไปยังบัญชีบอทที่ถูกต้อง และ `approvalKind` ทำให้พฤติกรรมการอนุมัติ exec กับ Plugin พร้อมใช้งานต่อช่องทางโดยไม่ต้องมี branch แบบ hardcode ใน core
- ตอนนี้ core เป็นเจ้าของการแจ้ง reroute การอนุมัติด้วย Plugin ช่องทางไม่ควรส่งข้อความ follow-up ของตัวเองว่า "การอนุมัติถูกส่งไปยัง DM / ช่องทางอื่น" จาก `createChannelNativeApprovalRuntime`; ให้เปิดเผยการกำหนดเส้นทาง origin + DM ของผู้อนุมัติที่ถูกต้องผ่าน helper capability การอนุมัติที่ใช้ร่วมกัน และให้ core รวมการส่งจริงก่อนโพสต์การแจ้งใด ๆ กลับไปยังแชทที่เริ่มต้น
- รักษา kind ของ id การอนุมัติที่ส่งแล้วแบบครบวงจร ไคลเอนต์เนทีฟไม่ควร
  เดาหรือเขียนการกำหนดเส้นทางการอนุมัติ exec กับ Plugin ใหม่จากสถานะภายในช่องทาง
- kind การอนุมัติที่ต่างกันสามารถเปิดเผยพื้นผิวเนทีฟที่ต่างกันโดยตั้งใจได้
  ตัวอย่างที่ bundled ปัจจุบัน:
  - Slack คงการกำหนดเส้นทางการอนุมัติแบบเนทีฟไว้สำหรับทั้ง id ของ exec และ Plugin
  - Matrix คงการกำหนดเส้นทาง DM/ช่องทางแบบเนทีฟและ UX ของ reaction เดิมไว้สำหรับการอนุมัติ exec
    และ Plugin ขณะยังยอมให้การยืนยันสิทธิ์แตกต่างกันตาม kind การอนุมัติ
- `createApproverRestrictedNativeApprovalAdapter` ยังคงมีอยู่ในฐานะ wrapper เพื่อความเข้ากันได้ แต่โค้ดใหม่ควรเลือกใช้ตัวสร้าง capability และเปิดเผย `approvalCapability` บน Plugin

สำหรับ entrypoint ของช่องทางที่เป็น hot path ให้เลือกใช้ subpath ของ runtime ที่แคบกว่าเมื่อคุณต้องการเพียง
ส่วนเดียวของกลุ่มนั้น:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

ในทำนองเดียวกัน ให้เลือกใช้ `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, และ
`openclaw/plugin-sdk/reply-chunking` เมื่อคุณไม่ต้องการพื้นผิว umbrella ที่กว้างกว่า

สำหรับ setup โดยเฉพาะ:

- `openclaw/plugin-sdk/setup-runtime` ครอบคลุม helper สำหรับ setup ที่ปลอดภัยต่อ runtime:
  adapter patch setup ที่ปลอดภัยต่อการ import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), เอาต์พุต lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries`, และตัวสร้าง
  setup-proxy แบบ delegated
- `openclaw/plugin-sdk/setup-runtime` รวม seam adapter ที่รับรู้ env สำหรับ
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` ครอบคลุมตัวสร้าง setup สำหรับ optional-install
  พร้อม primitive ที่ปลอดภัยต่อ setup อีกสองสามตัว:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

หากช่องทางของคุณรองรับ setup หรือ auth ที่ขับเคลื่อนด้วย env และ flow startup/config ทั่วไป
ควรรู้ชื่อ env เหล่านั้นก่อนโหลด runtime ให้ประกาศไว้ใน manifest ของ
Plugin ด้วย `channelEnvVars` คง `envVars` ของ runtime ช่องทางหรือค่าคงที่ภายในไว้สำหรับ
ข้อความที่ผู้ปฏิบัติการเห็นเท่านั้น

หากช่องทางของคุณสามารถปรากฏใน `status`, `channels list`, `channels status`, หรือ
การสแกน SecretRef ก่อนที่ runtime ของ Plugin จะเริ่ม ให้เพิ่ม `openclaw.setupEntry` ใน
`package.json` entrypoint นั้นควรปลอดภัยต่อการ import ใน path คำสั่งแบบอ่านอย่างเดียว
และควรคืน metadata ของช่องทาง, adapter config ที่ปลอดภัยต่อ setup, adapter สถานะ,
และ metadata target ของ secret ช่องทางที่จำเป็นสำหรับสรุปเหล่านั้น ห้าม
เริ่ม client, listener, หรือ runtime การขนส่งจาก entry สำหรับ setup

รักษา path import ของ entry หลักของช่องทางให้แคบด้วย Discovery สามารถประเมิน
entry และโมดูล Plugin ช่องทางเพื่อลงทะเบียน capability โดยไม่ activate
ช่องทาง ไฟล์อย่าง `channel-plugin-api.ts` ควร export ออบเจ็กต์ Plugin ช่องทาง
โดยไม่นำเข้า wizard สำหรับ setup, client การขนส่ง, socket
listener, subprocess launcher, หรือโมดูลเริ่มบริการ วางชิ้นส่วน runtime
เหล่านั้นไว้ในโมดูลที่โหลดจาก `registerFull(...)`, runtime setter, หรือ adapter
capability แบบ lazy

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, และ
`splitSetupEntries`

- ใช้ seam `openclaw/plugin-sdk/setup` ที่กว้างกว่าเฉพาะเมื่อคุณยังต้องการ
  helper setup/config ที่ใช้ร่วมกันและหนักกว่า เช่น
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

หากช่องทางของคุณเพียงต้องการประกาศ "ติดตั้ง Plugin นี้ก่อน" ในพื้นผิว setup
ให้เลือกใช้ `createOptionalChannelSetupSurface(...)` adapter/wizard ที่สร้างขึ้น
จะ fail closed เมื่อเขียน config และ finalize และนำข้อความว่าต้องติดตั้ง
ข้อความเดียวกันกลับมาใช้ซ้ำใน validation, finalize, และข้อความลิงก์เอกสาร

สำหรับ path ช่องทาง hot path อื่น ๆ ให้เลือกใช้ helper แบบแคบแทนพื้นผิว legacy
ที่กว้างกว่า:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, และ
  `openclaw/plugin-sdk/account-helpers` สำหรับ config หลายบัญชีและ
  fallback ของบัญชีเริ่มต้น
- `openclaw/plugin-sdk/inbound-envelope` และ
  `openclaw/plugin-sdk/inbound-reply-dispatch` สำหรับ route/envelope ขาเข้าและ
  wiring สำหรับบันทึกแล้ว dispatch
- `openclaw/plugin-sdk/messaging-targets` สำหรับการ parse/จับคู่ target
- `openclaw/plugin-sdk/outbound-media` และ
  `openclaw/plugin-sdk/outbound-runtime` สำหรับการโหลดสื่อ รวมถึง
  delegate identity/send ขาออกและการวางแผน payload
- `buildThreadAwareOutboundSessionRoute(...)` จาก
  `openclaw/plugin-sdk/channel-core` เมื่อ route ขาออกควรรักษา
  `replyToId`/`threadId` ที่ระบุชัดเจน หรือกู้คืน session `:thread:` ปัจจุบัน
  หลังจาก base session key ยังตรงกัน Plugin provider สามารถ override
  ลำดับความสำคัญ, พฤติกรรม suffix, และการทำ normalization ของ thread id เมื่อแพลตฟอร์มของตน
  มี semantics การส่ง thread แบบเนทีฟ
- `openclaw/plugin-sdk/thread-bindings-runtime` สำหรับวงจรชีวิต thread-binding
  และการลงทะเบียน adapter
- `openclaw/plugin-sdk/agent-media-payload` เฉพาะเมื่อยังต้องใช้ layout ของ field
  payload agent/media แบบ legacy
- `openclaw/plugin-sdk/telegram-command-config` สำหรับการทำ normalization ของคำสั่งกำหนดเองของ Telegram,
  การตรวจสอบ duplicate/conflict, และสัญญา config คำสั่งที่ stable ต่อ fallback

ช่องทางที่ใช้เฉพาะ auth มักหยุดที่ path เริ่มต้นได้: core จัดการการอนุมัติ และ Plugin เพียงเปิดเผย capability ขาออก/auth ช่องทางการอนุมัติแบบเนทีฟ เช่น Matrix, Slack, Telegram, และการขนส่งแชทแบบกำหนดเอง ควรใช้ helper เนทีฟที่ใช้ร่วมกันแทนการทำวงจรชีวิตการอนุมัติเอง

## นโยบาย mention ขาเข้า

คงการจัดการ mention ขาเข้าให้แยกเป็นสองเลเยอร์:

- การรวบรวมหลักฐานที่ Plugin เป็นเจ้าของ
- การประเมินนโยบายที่ใช้ร่วมกัน

ใช้ `openclaw/plugin-sdk/channel-mention-gating` สำหรับการตัดสินใจด้านนโยบาย mention
ใช้ `openclaw/plugin-sdk/channel-inbound` เฉพาะเมื่อคุณต้องการ helper barrel ขาเข้า
ที่กว้างกว่า

เหมาะกับตรรกะภายใน Plugin:

- การตรวจจับ reply-to-bot
- การตรวจจับ quoted-bot
- การตรวจสอบการเข้าร่วม thread
- การยกเว้นข้อความบริการ/ระบบ
- cache เนทีฟของแพลตฟอร์มที่จำเป็นเพื่อพิสูจน์การเข้าร่วมของบอท

เหมาะกับ helper ที่ใช้ร่วมกัน:

- `requireMention`
- ผลลัพธ์การกล่าวถึงแบบชัดเจน
- รายการอนุญาตการกล่าวถึงแบบโดยนัย
- การข้ามคำสั่ง
- การตัดสินใจข้ามขั้นสุดท้าย

โฟลว์ที่แนะนำ:

1. คำนวณข้อเท็จจริงการกล่าวถึงในเครื่อง
2. ส่งข้อเท็จจริงเหล่านั้นเข้าไปใน `resolveInboundMentionDecision({ facts, policy })`
3. ใช้ `decision.effectiveWasMentioned`, `decision.shouldBypassMention` และ `decision.shouldSkip` ในเกตขาเข้าของคุณ

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
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

`api.runtime.channel.mentions` เปิดเผยตัวช่วยการกล่าวถึงที่ใช้ร่วมกันชุดเดียวกันสำหรับ
Plugin ช่องทางที่รวมมา ซึ่งพึ่งพาการฉีด runtime อยู่แล้ว:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

หากคุณต้องการเพียง `implicitMentionKindWhen` และ
`resolveInboundMentionDecision` ให้นำเข้าจาก
`openclaw/plugin-sdk/channel-mention-gating` เพื่อหลีกเลี่ยงการโหลดตัวช่วย runtime
ขาเข้าที่ไม่เกี่ยวข้อง

ตัวช่วย `resolveMentionGating*` แบบเก่ายังคงอยู่ใน
`openclaw/plugin-sdk/channel-inbound` เฉพาะในฐานะ export สำหรับความเข้ากันได้เท่านั้น โค้ดใหม่
ควรใช้ `resolveInboundMentionDecision({ facts, policy })`

## บทสาธิต

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="แพ็กเกจและ manifest">
    สร้างไฟล์ Plugin มาตรฐาน ฟิลด์ `channel` ใน `package.json` คือสิ่งที่ทำให้สิ่งนี้เป็น Plugin ช่องทาง สำหรับพื้นผิวข้อมูลเมตาแพ็กเกจทั้งหมด
    โปรดดู [การตั้งค่าและการกำหนดค่า Plugin](/th/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
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
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` ตรวจสอบความถูกต้องของ `plugins.entries.acme-chat.config` ใช้สำหรับ
    การตั้งค่าที่ Plugin เป็นเจ้าของ ซึ่งไม่ใช่การกำหนดค่าบัญชีของช่องทาง `channelConfigs`
    ตรวจสอบความถูกต้องของ `channels.acme-chat` และเป็นแหล่งข้อมูลในเส้นทางเย็นที่ใช้โดย schema การกำหนดค่า
    การตั้งค่า และพื้นผิว UI ก่อนที่ runtime ของ Plugin จะโหลด

  </Step>

  <Step title="สร้างอ็อบเจกต์ Plugin ช่องทาง">
    อินเทอร์เฟซ `ChannelPlugin` มีพื้นผิว adapter ที่เป็นทางเลือกจำนวนมาก เริ่มด้วย
    ขั้นต่ำสุด คือ `id` และ `setup` แล้วเพิ่ม adapter ตามที่คุณต้องใช้

    สร้าง `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

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
      if (!token) throw new Error("acme-chat: token is required");
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
        setup: {
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
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
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

    สำหรับช่องทางที่ยอมรับทั้งคีย์ DM ระดับบนสุดตามแบบมาตรฐานและคีย์แบบซ้อนเดิม ให้ใช้ตัวช่วยจาก `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` และ `normalizeChannelDmPolicy` จะเก็บค่าระดับบัญชีไว้ก่อนค่าระดับรากที่สืบทอดมา จับคู่ resolver เดียวกันกับการซ่อมแซมของ doctor ผ่าน `normalizeLegacyDmAliases` เพื่อให้ runtime และการย้ายข้อมูลอ่านสัญญาเดียวกัน

    <Accordion title="สิ่งที่ createChatChannelPlugin ทำให้คุณ">
      แทนที่จะต้อง implement อินเทอร์เฟซ adapter ระดับต่ำด้วยตนเอง คุณส่ง
      ตัวเลือกแบบ declarative แล้ว builder จะประกอบสิ่งเหล่านั้นให้:

      | ตัวเลือก | สิ่งที่เชื่อมต่อให้ |
      | --- | --- |
      | `security.dm` | resolver ความปลอดภัย DM แบบกำหนดขอบเขตจากฟิลด์การกำหนดค่า |
      | `pairing.text` | โฟลว์การจับคู่ DM แบบข้อความพร้อมการแลกเปลี่ยนรหัส |
      | `threading` | resolver โหมด reply-to (คงที่, กำหนดขอบเขตตามบัญชี หรือกำหนดเอง) |
      | `outbound.attachedResults` | ฟังก์ชันส่งที่คืนข้อมูลเมตาของผลลัพธ์ (รหัสข้อความ) |

      คุณยังสามารถส่งอ็อบเจกต์ adapter ดิบแทนตัวเลือกแบบ declarative ได้
      หากคุณต้องการควบคุมทั้งหมด

      adapter ขาออกแบบดิบอาจกำหนดฟังก์ชัน `chunker(text, limit, ctx)` ได้
      `ctx.formatting` ที่เป็นทางเลือกจะพาการตัดสินใจด้านการจัดรูปแบบ ณ เวลาส่ง
      เช่น `maxLinesPerMessage`; ให้นำไปใช้ก่อนส่ง เพื่อให้การจัดเธรดการตอบกลับ
      และขอบเขตของชังก์ถูกแก้เพียงครั้งเดียวโดยการส่งขาออกที่ใช้ร่วมกัน
      บริบทการส่งยังรวม `replyToIdSource` (`implicit` หรือ `explicit`)
      เมื่อมีการแก้เป้าหมายการตอบกลับแบบ native แล้ว เพื่อให้ตัวช่วย payload สามารถรักษา
      แท็กตอบกลับแบบชัดเจนไว้ได้โดยไม่ใช้ช่องตอบกลับแบบโดยนัยที่ใช้ได้ครั้งเดียว
    </Accordion>

  </Step>

  <Step title="เชื่อมต่อจุดเข้าใช้งาน">
    สร้าง `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
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

    ใส่ descriptor ของ CLI ที่ช่องทางเป็นเจ้าของไว้ใน `registerCliMetadata(...)` เพื่อให้ OpenClaw
    แสดงในความช่วยเหลือระดับรากได้โดยไม่ต้องเปิดใช้งาน runtime ของช่องทางแบบเต็ม
    ขณะที่การโหลดเต็มตามปกติยังคงรับ descriptor เดียวกันสำหรับการลงทะเบียนคำสั่งจริง
    เก็บ `registerFull(...)` ไว้สำหรับงานที่ใช้ runtime เท่านั้น
    หาก `registerFull(...)` ลงทะเบียนเมธอด RPC ของ Gateway ให้ใช้
    คำนำหน้าที่เฉพาะกับ Plugin namespace สำหรับผู้ดูแลของ core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ยังคงสงวนไว้และจะ
    resolve เป็น `operator.admin` เสมอ
    `defineChannelPluginEntry` จัดการการแยกโหมดการลงทะเบียนให้โดยอัตโนมัติ ดู
    [จุดเข้าใช้งาน](/th/plugins/sdk-entrypoints#definechannelpluginentry) สำหรับตัวเลือกทั้งหมด

  </Step>

  <Step title="เพิ่มจุดเข้าใช้งานสำหรับการตั้งค่า">
    สร้าง `setup-entry.ts` สำหรับการโหลดแบบเบาระหว่าง onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw จะโหลดสิ่งนี้แทน entry แบบเต็มเมื่อช่องทางถูกปิดใช้งาน
    หรือยังไม่ได้กำหนดค่า วิธีนี้หลีกเลี่ยงการดึงโค้ด runtime ที่หนักเข้ามาระหว่างโฟลว์การตั้งค่า
    ดู [การตั้งค่าและการกำหนดค่า](/th/plugins/sdk-setup#setup-entry) สำหรับรายละเอียด

    ช่องทางใน workspace ที่รวมมา ซึ่งแยก export ที่ปลอดภัยสำหรับการตั้งค่าไปไว้ในโมดูล sidecar
    สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก
    `openclaw/plugin-sdk/channel-entry-contract` เมื่อยังต้องการ
    setter ของ runtime ในช่วงตั้งค่าแบบชัดเจนด้วย

  </Step>

  <Step title="จัดการข้อความขาเข้า">
    Plugin ของคุณต้องรับข้อความจากแพลตฟอร์มและส่งต่อไปยัง
    OpenClaw รูปแบบทั่วไปคือ Webhook ที่ตรวจสอบคำขอและ
    dispatch ผ่าน handler ขาเข้าของช่องทางคุณ:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      การจัดการข้อความขาเข้าขึ้นอยู่กับแต่ละช่องทาง แต่ละ Plugin ช่องทางเป็นเจ้าของ
      ไปป์ไลน์ขาเข้าของตนเอง ดู Plugin ช่องทางที่บันเดิลมา
      (ตัวอย่างเช่นแพ็กเกจ Plugin ของ Microsoft Teams หรือ Google Chat) เพื่อดูรูปแบบจริง
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
เขียนการทดสอบแบบ colocated ใน `src/channel.test.ts`:

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
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    สำหรับตัวช่วยทดสอบที่ใช้ร่วมกัน ดู [การทดสอบ](/th/plugins/sdk-testing)

</Step>
</Steps>

## โครงสร้างไฟล์

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## หัวข้อขั้นสูง

<CardGroup cols={2}>
  <Card title="Threading options" icon="git-branch" href="/th/plugins/sdk-entrypoints#registration-mode">
    โหมดการตอบกลับแบบคงที่ แบบผูกกับบัญชี หรือแบบกำหนดเอง
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/th/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool และการค้นพบการดำเนินการ
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/th/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, STT, สื่อ, subagent ผ่าน api.runtime
  </Card>
  <Card title="Channel turn kernel" icon="bolt" href="/th/plugins/sdk-channel-turn">
    วงจรชีวิตเทิร์นขาเข้าที่ใช้ร่วมกัน: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
บาง seams ตัวช่วยที่บันเดิลมายังคงมีอยู่เพื่อการบำรุงรักษา Plugin ที่บันเดิลมาและ
ความเข้ากันได้ สิ่งเหล่านี้ไม่ใช่รูปแบบที่แนะนำสำหรับ Plugin ช่องทางใหม่;
ควรใช้ subpath channel/setup/reply/runtime แบบทั่วไปจากพื้นผิว SDK ร่วม
เว้นแต่คุณจะดูแลตระกูล Plugin ที่บันเดิลมานั้นโดยตรง
</Note>

## ขั้นตอนถัดไป

- [Provider Plugins](/th/plugins/sdk-provider-plugins) - หาก Plugin ของคุณยังให้บริการโมเดลด้วย
- [ภาพรวม SDK](/th/plugins/sdk-overview) - อ้างอิงการนำเข้า subpath ทั้งหมด
- [การทดสอบ SDK](/th/plugins/sdk-testing) - ยูทิลิตีทดสอบและการทดสอบ contract
- [Manifest ของ Plugin](/th/plugins/manifest) - สคีมา manifest ทั้งหมด

## ที่เกี่ยวข้อง

- [การตั้งค่า SDK ของ Plugin](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [Plugin agent harness](/th/plugins/sdk-agent-harness)
