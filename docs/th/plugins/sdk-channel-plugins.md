---
read_when:
    - คุณกำลังสร้าง Plugin ช่องทางการรับส่งข้อความใหม่
    - คุณต้องการเชื่อมต่อ OpenClaw กับแพลตฟอร์มการรับส่งข้อความ
    - คุณต้องทำความเข้าใจขอบเขตอินเทอร์เฟซของอะแดปเตอร์ ChannelPlugin
sidebarTitle: Channel Plugins
summary: คู่มือทีละขั้นตอนสำหรับการสร้าง Plugin ช่องทางการรับส่งข้อความสำหรับ OpenClaw
title: การสร้าง Plugin สำหรับช่องทาง
x-i18n:
    generated_at: "2026-05-06T09:24:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69fae0587adfca0b704aea96a2a838cd175a09e4532ad3a9527fb3a21905e4f6
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

คู่มือนี้อธิบายการสร้าง Plugin ช่องทางที่เชื่อม OpenClaw เข้ากับ
แพลตฟอร์มส่งข้อความ เมื่อจบคู่มือนี้ คุณจะมีช่องทางที่ใช้งานได้พร้อมความปลอดภัยของ DM,
การจับคู่, การจัดเธรดการตอบกลับ และการส่งข้อความขาออก

<Info>
  หากคุณยังไม่เคยสร้าง Plugin ของ OpenClaw มาก่อน ให้อ่าน
  [เริ่มต้นใช้งาน](/th/plugins/building-plugins) ก่อนสำหรับโครงสร้างแพ็กเกจพื้นฐาน
  และการตั้งค่า manifest
</Info>

## วิธีการทำงานของ Plugin ช่องทาง

Plugin ช่องทางไม่จำเป็นต้องมีเครื่องมือส่ง/แก้ไข/แสดงปฏิกิริยาเป็นของตัวเอง OpenClaw เก็บเครื่องมือ
`message` ที่ใช้ร่วมกันไว้ในแกนกลาง Plugin ของคุณรับผิดชอบ:

- **การกำหนดค่า** - การระบุบัญชีและตัวช่วยตั้งค่า
- **ความปลอดภัย** - นโยบาย DM และ allowlist
- **การจับคู่** - โฟลว์การอนุมัติ DM
- **ไวยากรณ์เซสชัน** - วิธีที่ id การสนทนาเฉพาะผู้ให้บริการแมปกับแชตฐาน, id เธรด และตัวเลือกสำรองของพาเรนต์
- **ขาออก** - การส่งข้อความ สื่อ และโพลไปยังแพลตฟอร์ม
- **การจัดเธรด** - วิธีจัดเธรดของการตอบกลับ
- **การพิมพ์สำหรับ Heartbeat** - สัญญาณกำลังพิมพ์/ไม่ว่างที่เป็นทางเลือกสำหรับเป้าหมายการส่ง Heartbeat

แกนกลางรับผิดชอบเครื่องมือข้อความที่ใช้ร่วมกัน, การเชื่อมต่อพรอมป์, รูปทรง session-key ภายนอก,
การบันทึกทั่วไปแบบ `:thread:` และการกระจายงาน

Plugin ช่องทางใหม่ควรเปิดเผยอะแดปเตอร์ `message` ด้วย
`defineChannelMessageAdapter` จาก `openclaw/plugin-sdk/channel-message` ด้วย
อะแดปเตอร์นี้ประกาศว่าการส่งสุดท้ายแบบคงทนใดที่การขนส่ง native รองรับจริง
และชี้การส่งข้อความ/สื่อไปยังฟังก์ชันขนส่งเดียวกับอะแดปเตอร์ `outbound` เดิม
ให้ประกาศความสามารถเฉพาะเมื่อมีการทดสอบสัญญาที่ยืนยัน side effect ฝั่ง native
และใบรับที่ส่งคืนแล้วเท่านั้น
สำหรับสัญญา API ฉบับเต็ม, ตัวอย่าง, เมทริกซ์ความสามารถ, กฎของใบรับ, การสรุป live
preview, นโยบาย receive ack, การทดสอบ และตารางการย้ายข้อมูล โปรดดู
[API ข้อความช่องทาง](/th/plugins/sdk-channel-message)
หากอะแดปเตอร์ `outbound` ที่มีอยู่มีเมธอดส่งและเมทาดาทาความสามารถที่ถูกต้องอยู่แล้ว ให้ใช้
`createChannelMessageAdapterFromOutbound(...)` เพื่อสร้างอะแดปเตอร์ `message`
แทนการเขียน bridge อีกตัวด้วยมือ
การส่งของอะแดปเตอร์ควรคืนค่า `MessageReceipt` เมื่อโค้ดความเข้ากันได้
ยังต้องใช้ id แบบเดิม ให้สร้าง id เหล่านั้นด้วย `listMessageReceiptPlatformIds(...)`
หรือ `resolveMessageReceiptPrimaryId(...)` แทนการเก็บฟิลด์
`messageIds` คู่ขนานไว้ในโค้ด lifecycle ใหม่
ช่องทางที่รองรับ preview ควรประกาศ `message.live.capabilities` พร้อม
live lifecycle ที่ตัวเองรับผิดชอบอย่างตรงตัวด้วย เช่น `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` หรือ
`quietFinalization` ช่องทางที่สรุป draft preview แทนที่เดิมควร
ประกาศ `message.live.finalizer.capabilities` ด้วย เช่น `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` และ
`retainOnAmbiguousFailure` และกำหนดเส้นทางตรรกะ runtime ผ่าน
`defineFinalizableLivePreviewAdapter(...)` รวมถึง
`deliverWithFinalizableLivePreviewAdapter(...)` รักษาความสามารถเหล่านั้นให้มี
การทดสอบ `verifyChannelMessageLiveCapabilityAdapterProofs(...)` และ
`verifyChannelMessageLiveFinalizerProofs(...)` รองรับ เพื่อไม่ให้พฤติกรรมของ native preview,
progress, edit, fallback/retention, cleanup และใบรับคลาดเคลื่อนไปอย่างเงียบ ๆ
ตัวรับขาเข้าที่เลื่อนการยืนยันของแพลตฟอร์มควรประกาศ
`message.receive.defaultAckPolicy` และ `supportedAckPolicies` แทนการซ่อน
จังหวะ ack ไว้ในสถานะเฉพาะ monitor ครอบคลุมนโยบายที่ประกาศทุกแบบด้วย
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`

ตัวช่วยตอบกลับ/turn แบบเดิม เช่น `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` และ `recordInboundSessionAndDispatchReply`
ยังคงมีให้ใช้สำหรับ dispatcher ที่ต้องเข้ากันได้ย้อนหลัง อย่าใช้ชื่อเหล่านั้นกับ
โค้ดช่องทางใหม่; Plugin ใหม่ควรเริ่มจากอะแดปเตอร์ `message`, ใบรับ และ
ตัวช่วย receive/send lifecycle บน `openclaw/plugin-sdk/channel-message`

หากช่องทางของคุณรองรับตัวบ่งชี้การพิมพ์นอกเหนือจากการตอบกลับขาเข้า ให้เปิดเผย
`heartbeat.sendTyping(...)` บน Plugin ช่องทาง แกนกลางเรียกใช้งานด้วย
เป้าหมายการส่ง Heartbeat ที่ resolve แล้วก่อนการรันโมเดล Heartbeat จะเริ่ม
และใช้ lifecycle การ keepalive/cleanup การพิมพ์ที่ใช้ร่วมกัน เพิ่ม `heartbeat.clearTyping(...)`
เมื่อแพลตฟอร์มต้องการสัญญาณหยุดแบบชัดเจน

หากช่องทางของคุณเพิ่มพารามิเตอร์ของเครื่องมือข้อความที่พาแหล่งสื่อ ให้เปิดเผย
ชื่อพารามิเตอร์เหล่านั้นผ่าน `describeMessageTool(...).mediaSourceParams` แกนกลางใช้
รายการที่ชัดเจนนี้สำหรับการทำ sandbox path normalization และนโยบาย media-access ขาออก
ดังนั้น Plugin จึงไม่จำเป็นต้องมีกรณีพิเศษใน shared-core สำหรับพารามิเตอร์เฉพาะผู้ให้บริการ
อย่าง avatar, attachment หรือ cover-image
ควรคืนค่าแมปที่ใช้ action เป็นคีย์ เช่น
`{ "set-profile": ["avatarUrl", "avatarPath"] }` เพื่อไม่ให้ action ที่ไม่เกี่ยวข้อง
รับอาร์กิวเมนต์สื่อของอีก action หนึ่งโดยอัตโนมัติ อาร์เรย์แบบแบนยังใช้ได้สำหรับพารามิเตอร์ที่
ตั้งใจให้ใช้ร่วมกันในทุก action ที่เปิดเผย

หากช่องทางของคุณต้องการการจัดรูปเฉพาะผู้ให้บริการสำหรับ `message(action="send")`,
ควรใช้ `actions.prepareSendPayload(...)` วางการ์ด, บล็อก, embed หรือ
ข้อมูลคงทนอื่น ๆ แบบ native ไว้ใต้ `payload.channelData.<channel>` แล้วให้แกนกลางดำเนินการ
ส่งจริงผ่านอะแดปเตอร์ outbound/message ใช้
`actions.handleAction(...)` สำหรับการส่งเฉพาะเป็น fallback ด้านความเข้ากันได้สำหรับ
payload ที่ไม่สามารถ serialize และลองใหม่ได้

หากแพลตฟอร์มของคุณเก็บขอบเขตเพิ่มเติมไว้ใน id การสนทนา ให้คงการ parse นั้น
ไว้ใน Plugin ด้วย `messaging.resolveSessionConversation(...)` นั่นคือ hook
หลักสำหรับแมป `rawId` ไปยัง id การสนทนาฐาน, id เธรดที่เป็นทางเลือก,
`baseConversationId` แบบชัดเจน และ `parentConversationCandidates` ใด ๆ
เมื่อคุณคืนค่า `parentConversationCandidates` ให้เรียงจากพาเรนต์ที่แคบที่สุด
ไปยังการสนทนาที่กว้างที่สุด/ฐาน

ใช้ `openclaw/plugin-sdk/channel-route` เมื่อโค้ด Plugin จำเป็นต้อง normalize
ฟิลด์ที่คล้าย route, เปรียบเทียบเธรดย่อยกับ route พาเรนต์ หรือสร้างคีย์ dedupe
ที่เสถียรจาก `{ channel, to, accountId, threadId }` ตัวช่วยนี้ normalize
id เธรดแบบตัวเลขในวิธีเดียวกับที่แกนกลางทำ ดังนั้น Plugin ควรใช้วิธีนี้แทน
การเปรียบเทียบแบบเฉพาะกิจอย่าง `String(threadId)`
Plugin ที่มีไวยากรณ์เป้าหมายเฉพาะผู้ให้บริการสามารถ inject parser ของตัวเองเข้าใน
`resolveChannelRouteTargetWithParser(...)` และยังคงได้รูปทรงเป้าหมาย route
และความหมาย fallback ของเธรดแบบเดียวกับที่แกนกลางใช้

Plugin ที่ bundled ซึ่งต้องใช้การ parse เดียวกันก่อนที่ registry ช่องทางจะบูต
ยังสามารถเปิดเผยไฟล์ระดับบนสุด `session-key-api.ts` ที่มี export
`resolveSessionConversation(...)` ที่ตรงกันได้ แกนกลางใช้พื้นผิวที่ปลอดภัยต่อ bootstrap นี้
เฉพาะเมื่อไม่มี registry Plugin ใน runtime เท่านั้น

`messaging.resolveParentConversationCandidates(...)` ยังคงมีให้ใช้เป็น
fallback ความเข้ากันได้แบบเดิมเมื่อ Plugin ต้องการเพียง parent fallback บน
id ทั่วไป/raw หากมี hook ทั้งสองแบบ แกนกลางจะใช้
`resolveSessionConversation(...).parentConversationCandidates` ก่อน และจะ fallback
ไปยัง `resolveParentConversationCandidates(...)` เฉพาะเมื่อ hook หลักละเว้นค่าเหล่านั้น

## การอนุมัติและความสามารถของช่องทาง

Plugin ช่องทางส่วนใหญ่ไม่จำเป็นต้องมีโค้ดเฉพาะสำหรับการอนุมัติ

- แกนหลักเป็นเจ้าของ `/approve` ในแชตเดียวกัน, payload ของปุ่มอนุมัติที่ใช้ร่วมกัน, และการส่ง fallback ทั่วไป
- ให้ใช้วัตถุ `approvalCapability` หนึ่งรายการบน Plugin ของช่องทางเมื่อช่องทางต้องมีพฤติกรรมเฉพาะด้านการอนุมัติ
- `ChannelPlugin.approvals` ถูกนำออกแล้ว ให้วางข้อเท็จจริงด้านการส่ง/เนทีฟ/การเรนเดอร์/auth ของการอนุมัติไว้บน `approvalCapability`
- `plugin.auth` ใช้เฉพาะการเข้าสู่ระบบ/ออกจากระบบเท่านั้น; แกนหลักไม่อ่าน hook auth ของการอนุมัติจากวัตถุนั้นอีกต่อไป
- `approvalCapability.authorizeActorAction` และ `approvalCapability.getActionAvailabilityState` คือ seam มาตรฐานสำหรับ approval-auth
- ใช้ `approvalCapability.getActionAvailabilityState` สำหรับความพร้อมใช้งานของ auth การอนุมัติในแชตเดียวกัน
- หากช่องทางของคุณเปิดเผยการอนุมัติ exec แบบเนทีฟ ให้ใช้ `approvalCapability.getExecInitiatingSurfaceState` สำหรับสถานะ initiating-surface/native-client เมื่อสถานะนั้นแตกต่างจาก auth การอนุมัติในแชตเดียวกัน แกนหลักใช้ hook เฉพาะ exec นั้นเพื่อแยก `enabled` กับ `disabled`, ตัดสินใจว่าช่องทางที่เริ่มต้นรองรับการอนุมัติ exec แบบเนทีฟหรือไม่, และรวมช่องทางนั้นไว้ในคำแนะนำ fallback ของ native-client `createApproverRestrictedNativeApprovalCapability(...)` เติมค่านี้ให้สำหรับกรณีทั่วไป
- ใช้ `outbound.shouldSuppressLocalPayloadPrompt` หรือ `outbound.beforeDeliverPayload` สำหรับพฤติกรรมวงจรชีวิต payload เฉพาะช่องทาง เช่น การซ่อนพรอมป์อนุมัติภายในเครื่องที่ซ้ำกัน หรือการส่งตัวบ่งชี้ว่ากำลังพิมพ์ก่อนส่ง
- ใช้ `approvalCapability.delivery` เฉพาะสำหรับการกำหนดเส้นทางการอนุมัติแบบเนทีฟหรือการระงับ fallback
- ใช้ `approvalCapability.nativeRuntime` สำหรับข้อเท็จจริงการอนุมัติแบบเนทีฟที่ช่องทางเป็นเจ้าของ รักษาให้เป็น lazy บนจุดเข้าช่องทางที่ร้อนด้วย `createLazyChannelApprovalNativeRuntimeAdapter(...)` ซึ่งสามารถ import โมดูล runtime ของคุณตามต้องการ ขณะยังให้แกนหลักประกอบวงจรชีวิตการอนุมัติได้
- ใช้ `approvalCapability.render` เฉพาะเมื่อช่องทางต้องการ payload การอนุมัติแบบกำหนดเองจริงๆ แทน renderer ที่ใช้ร่วมกัน
- ใช้ `approvalCapability.describeExecApprovalSetup` เมื่อช่องทางต้องการให้การตอบกลับในเส้นทาง disabled อธิบาย knob ของ config ที่จำเป็นอย่างแน่นอนเพื่อเปิดใช้การอนุมัติ exec แบบเนทีฟ hook ได้รับ `{ channel, channelLabel, accountId }`; ช่องทางแบบบัญชีที่มีชื่อควรเรนเดอร์ path ที่มีขอบเขตตามบัญชี เช่น `channels.<channel>.accounts.<id>.execApprovals.*` แทนค่าเริ่มต้นระดับบนสุด
- หากช่องทางสามารถอนุมานตัวตน DM แบบคล้ายเจ้าของที่เสถียรจาก config ที่มีอยู่ ให้ใช้ `createResolvedApproverActionAuthAdapter` จาก `openclaw/plugin-sdk/approval-runtime` เพื่อจำกัด `/approve` ในแชตเดียวกันโดยไม่เพิ่ม logic ของแกนหลักที่เฉพาะกับการอนุมัติ
- หากช่องทางต้องการการส่งการอนุมัติแบบเนทีฟ ให้ให้โค้ดช่องทางโฟกัสที่การทำให้ target เป็นรูปแบบปกติ รวมถึงข้อเท็จจริงด้าน transport/presentation ใช้ `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, และ `createApproverRestrictedNativeApprovalCapability` จาก `openclaw/plugin-sdk/approval-runtime` วางข้อเท็จจริงเฉพาะช่องทางไว้หลัง `approvalCapability.nativeRuntime` โดยเหมาะที่สุดผ่าน `createChannelApprovalNativeRuntimeAdapter(...)` หรือ `createLazyChannelApprovalNativeRuntimeAdapter(...)` เพื่อให้แกนหลักประกอบ handler และเป็นเจ้าของการกรองคำขอ, การกำหนดเส้นทาง, dedupe, การหมดอายุ, การสมัครรับข้อมูล Gateway, และการแจ้งเตือนว่าถูกกำหนดเส้นทางไปที่อื่น `nativeRuntime` ถูกแบ่งเป็น seam ที่เล็กลงสองสามส่วน:
- `createChannelNativeOriginTargetResolver` ใช้ matcher เส้นทางช่องทางที่ใช้ร่วมกันโดยค่าเริ่มต้นสำหรับ target `{ to, accountId, threadId }` ส่ง `targetsMatch` เฉพาะเมื่อช่องทางมีกฎความเทียบเท่าเฉพาะ provider เช่น การจับคู่ prefix timestamp ของ Slack
- ส่ง `normalizeTargetForMatch` ไปยัง `createChannelNativeOriginTargetResolver` เมื่อช่องทางต้อง canonicalize id ของ provider ก่อนที่ matcher เส้นทางเริ่มต้นหรือ callback `targetsMatch` แบบกำหนดเองจะทำงาน ขณะคง target เดิมไว้สำหรับการส่ง ใช้ `normalizeTarget` เฉพาะเมื่อ target สำหรับการส่งที่ resolve แล้วควรถูก canonicalize เอง
- `availability` - บัญชีถูก config แล้วหรือไม่ และควรจัดการคำขอหรือไม่
- `presentation` - map view model การอนุมัติที่ใช้ร่วมกันเป็น payload เนทีฟหรือ action สุดท้ายในสถานะ pending/resolved/expired
- `transport` - เตรียม target พร้อมส่ง/อัปเดต/ลบข้อความการอนุมัติแบบเนทีฟ
- `interactions` - hook bind/unbind/clear-action แบบไม่บังคับสำหรับปุ่มหรือ reaction แบบเนทีฟ
- `observe` - hook diagnostics การส่งแบบไม่บังคับ
- หากช่องทางต้องการวัตถุที่ runtime เป็นเจ้าของ เช่น client, token, Bolt app, หรือ webhook receiver ให้ลงทะเบียนผ่าน `openclaw/plugin-sdk/channel-runtime-context` registry runtime-context ทั่วไปช่วยให้แกนหลัก bootstrap handler ที่ขับเคลื่อนด้วย capability จากสถานะเริ่มต้นของช่องทางโดยไม่เพิ่ม glue wrapper ที่เฉพาะกับการอนุมัติ
- ใช้ `createChannelApprovalHandler` หรือ `createChannelNativeApprovalRuntime` ระดับต่ำกว่าเฉพาะเมื่อ seam ที่ขับเคลื่อนด้วย capability ยังสื่อความได้ไม่พอ
- ช่องทางการอนุมัติแบบเนทีฟต้อง route ทั้ง `accountId` และ `approvalKind` ผ่าน helper เหล่านั้น `accountId` ทำให้นโยบายการอนุมัติหลายบัญชีมีขอบเขตกับบัญชีบอทที่ถูกต้อง และ `approvalKind` ทำให้พฤติกรรมการอนุมัติ exec เทียบกับ Plugin พร้อมใช้งานกับช่องทางโดยไม่ต้องมี branch แบบ hardcoded ในแกนหลัก
- ตอนนี้แกนหลักเป็นเจ้าของการแจ้งเตือน reroute การอนุมัติด้วย Plugin ของช่องทางไม่ควรส่งข้อความ follow-up ของตัวเองว่า "การอนุมัติถูกส่งไปยัง DM / ช่องทางอื่น" จาก `createChannelNativeApprovalRuntime`; แทนที่จะทำเช่นนั้น ให้เปิดเผยการกำหนดเส้นทาง origin + approver-DM ที่ถูกต้องผ่าน helper capability การอนุมัติที่ใช้ร่วมกัน และให้แกนหลัก aggregate การส่งจริงก่อนโพสต์การแจ้งเตือนใดๆ กลับไปยังแชตที่เริ่มต้น
- รักษาชนิด id ของการอนุมัติที่ส่งแล้วแบบ end-to-end native client ไม่ควร
  เดาหรือ rewrite การกำหนดเส้นทางการอนุมัติ exec เทียบกับ Plugin จากสถานะเฉพาะช่องทาง
- ชนิดการอนุมัติที่แตกต่างกันสามารถตั้งใจเปิดเผย surface เนทีฟที่แตกต่างกันได้
  ตัวอย่างที่ bundled ปัจจุบัน:
  - Slack คงให้การกำหนดเส้นทางการอนุมัติแบบเนทีฟพร้อมใช้งานสำหรับทั้ง id exec และ Plugin
  - Matrix คงการกำหนดเส้นทาง DM/ช่องทางแบบเนทีฟและ UX reaction เดียวกันสำหรับ exec
    และการอนุมัติ Plugin ขณะยังให้อาจมี auth แตกต่างกันตามชนิดการอนุมัติ
- `createApproverRestrictedNativeApprovalAdapter` ยังคงมีอยู่ในฐานะ wrapper เพื่อความเข้ากันได้ แต่โค้ดใหม่ควรใช้ capability builder และเปิดเผย `approvalCapability` บน Plugin

สำหรับจุดเข้าช่องทางที่ร้อน ให้ใช้ subpath runtime ที่แคบกว่าเมื่อคุณต้องการเพียง
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

เช่นเดียวกัน ให้ใช้ `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, และ
`openclaw/plugin-sdk/reply-chunking` เมื่อคุณไม่ต้องการ umbrella
surface ที่กว้างกว่า

สำหรับ setup โดยเฉพาะ:

- `openclaw/plugin-sdk/setup-runtime` ครอบคลุม helper สำหรับ setup ที่ปลอดภัยสำหรับ runtime:
  adapter patch setup ที่ import ได้อย่างปลอดภัย (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), เอาต์พุต lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries`, และ builder
  setup-proxy ที่มอบหมายแล้ว
- `openclaw/plugin-sdk/setup-adapter-runtime` คือ seam adapter
  ที่แคบและรับรู้ env สำหรับ `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` ครอบคลุม builder setup
  แบบ optional-install พร้อม primitive ที่ปลอดภัยสำหรับ setup อีกเล็กน้อย:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

หากช่องทางของคุณรองรับ setup หรือ auth ที่ขับเคลื่อนด้วย env และ flow startup/config
ทั่วไปควรรู้ชื่อ env เหล่านั้นก่อน runtime โหลด ให้ประกาศใน
manifest ของ Plugin ด้วย `channelEnvVars` เก็บ `envVars` ของ runtime ช่องทางหรือ
ค่าคงที่ภายในเครื่องไว้สำหรับข้อความที่แสดงต่อ operator เท่านั้น

หากช่องทางของคุณสามารถปรากฏใน `status`, `channels list`, `channels status`, หรือ
การสแกน SecretRef ก่อนที่ runtime ของ Plugin จะเริ่ม ให้เพิ่ม `openclaw.setupEntry` ใน
`package.json` จุดเข้านั้นควร import ได้อย่างปลอดภัยใน path คำสั่งแบบอ่านอย่างเดียว
และควรคืน metadata ของช่องทาง, adapter config ที่ปลอดภัยสำหรับ setup, adapter สถานะ,
และ metadata target ของ secret ของช่องทางที่จำเป็นสำหรับสรุปเหล่านั้น อย่า
เริ่ม client, listener, หรือ runtime ของ transport จาก entry setup

รักษา path import จุดเข้าหลักของช่องทางให้แคบด้วย การค้นพบสามารถประเมิน
entry และโมดูล Plugin ของช่องทางเพื่อลงทะเบียน capability โดยไม่เปิดใช้งาน
ช่องทาง ไฟล์เช่น `channel-plugin-api.ts` ควร export วัตถุ Plugin ของช่องทาง
โดยไม่ import wizard setup, client transport, listener ของ socket,
launcher ของ subprocess, หรือโมดูล startup ของ service วางชิ้นส่วน runtime
เหล่านั้นไว้ในโมดูลที่โหลดจาก `registerFull(...)`, setter ของ runtime, หรือ adapter
capability แบบ lazy

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, และ
`splitSetupEntries`

- ใช้ seam `openclaw/plugin-sdk/setup` ที่กว้างกว่าเฉพาะเมื่อคุณต้องการ
  helper setup/config ที่ใช้ร่วมกันและหนักกว่า เช่น
  `moveSingleAccountChannelSectionToDefaultAccount(...)` ด้วย

หากช่องทางของคุณต้องการเพียงโฆษณา "ติดตั้ง Plugin นี้ก่อน" ใน surface
setup ให้ใช้ `createOptionalChannelSetupSurface(...)` adapter/wizard
ที่สร้างขึ้นจะ fail closed บนการเขียน config และการ finalize และใช้
ข้อความ install-required เดียวกันซ้ำในการตรวจสอบ, finalize, และข้อความ
docs-link

สำหรับ path ช่องทางร้อนอื่นๆ ให้ใช้ helper ที่แคบแทน surface legacy
ที่กว้างกว่า:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, และ
  `openclaw/plugin-sdk/account-helpers` สำหรับ config หลายบัญชีและ
  fallback ของบัญชีเริ่มต้น
- `openclaw/plugin-sdk/inbound-envelope` และ
  `openclaw/plugin-sdk/inbound-reply-dispatch` สำหรับ route/envelope ขาเข้าและ
  wiring แบบบันทึกแล้ว dispatch
- `openclaw/plugin-sdk/messaging-targets` สำหรับการ parse/match target
- `openclaw/plugin-sdk/outbound-media` และ
  `openclaw/plugin-sdk/outbound-runtime` สำหรับการโหลด media พร้อม
  delegate identity/send ขาออกและการวางแผน payload
- `buildThreadAwareOutboundSessionRoute(...)` จาก
  `openclaw/plugin-sdk/channel-core` เมื่อ route ขาออกควรรักษา
  `replyToId`/`threadId` ที่ระบุชัดเจน หรือกู้คืน session `:thread:` ปัจจุบัน
  หลังจาก base session key ยัง match อยู่ Plugin ของ provider สามารถ override
  precedence, พฤติกรรม suffix, และการทำให้ thread id เป็นรูปแบบปกติเมื่อแพลตฟอร์มของตน
  มี semantics การส่ง thread แบบเนทีฟ
- `openclaw/plugin-sdk/thread-bindings-runtime` สำหรับวงจรชีวิต thread-binding
  และการลงทะเบียน adapter
- `openclaw/plugin-sdk/agent-media-payload` เฉพาะเมื่อยังต้องใช้ layout
  field ของ payload agent/media แบบ legacy
- `openclaw/plugin-sdk/telegram-command-config` สำหรับการทำให้ custom-command
  ของ Telegram เป็นรูปแบบปกติ, การตรวจสอบ duplicate/conflict, และ contract
  config command ที่เสถียรสำหรับ fallback

ช่องทางแบบ auth-only มักหยุดที่ path เริ่มต้นได้: แกนหลักจัดการการอนุมัติ และ Plugin เพียงเปิดเผย capability ขาออก/auth ช่องทางการอนุมัติแบบเนทีฟ เช่น Matrix, Slack, Telegram, และ chat transport แบบกำหนดเองควรใช้ helper เนทีฟที่ใช้ร่วมกันแทนการสร้างวงจรชีวิตการอนุมัติเอง

## นโยบายการ mention ขาเข้า

ให้แยกการจัดการ mention ขาเข้าเป็นสองชั้น:

- การรวบรวมหลักฐานที่ Plugin เป็นเจ้าของ
- การประเมินนโยบายที่ใช้ร่วมกัน

ใช้ `openclaw/plugin-sdk/channel-mention-gating` สำหรับการตัดสินใจนโยบาย mention
ใช้ `openclaw/plugin-sdk/channel-inbound` เฉพาะเมื่อคุณต้องการ barrel helper
ขาเข้าที่กว้างกว่า

เหมาะกับ logic ภายใน Plugin:

- การตรวจจับ reply-to-bot
- การตรวจจับ quoted-bot
- การตรวจสอบ thread-participation
- การยกเว้น service/system-message
- cache แบบแพลตฟอร์มเนทีฟที่จำเป็นเพื่อพิสูจน์การมีส่วนร่วมของบอท

เหมาะกับ helper ที่ใช้ร่วมกัน:

- `requireMention`
- ผลลัพธ์การกล่าวถึงแบบชัดเจน
- รายการอนุญาตการกล่าวถึงแบบโดยนัย
- การข้ามข้อกำหนดด้วยคำสั่ง
- การตัดสินใจข้ามขั้นสุดท้าย

ขั้นตอนที่แนะนำ:

1. คำนวณข้อเท็จจริงเกี่ยวกับการกล่าวถึงภายในเครื่อง
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
Plugin ช่องทางที่บันเดิลมา ซึ่งพึ่งพา runtime injection อยู่แล้ว:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

หากคุณต้องการเพียง `implicitMentionKindWhen` และ
`resolveInboundMentionDecision` ให้นำเข้าจาก
`openclaw/plugin-sdk/channel-mention-gating` เพื่อหลีกเลี่ยงการโหลดตัวช่วย runtime
ขาเข้าที่ไม่เกี่ยวข้อง

ตัวช่วย `resolveMentionGating*` รุ่นเก่ายังคงอยู่บน
`openclaw/plugin-sdk/channel-inbound` ในฐานะ export เพื่อความเข้ากันได้เท่านั้น โค้ดใหม่
ควรใช้ `resolveInboundMentionDecision({ facts, policy })`

## คำแนะนำทีละขั้นตอน

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="แพ็กเกจและ manifest">
    สร้างไฟล์ Plugin มาตรฐาน ฟิลด์ `channel` ใน `package.json` คือสิ่งที่ทำให้สิ่งนี้เป็น Plugin ช่องทาง สำหรับพื้นผิวข้อมูลเมตาของแพ็กเกจแบบเต็ม
    ดู [การตั้งค่าและการกำหนดค่า Plugin](/th/plugins/sdk-setup#openclaw-channel):

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

    `configSchema` ตรวจสอบ `plugins.entries.acme-chat.config` ใช้สิ่งนี้สำหรับ
    การตั้งค่าที่ Plugin เป็นเจ้าของ ซึ่งไม่ใช่การกำหนดค่าบัญชีช่องทาง `channelConfigs`
    ตรวจสอบ `channels.acme-chat` และเป็นแหล่งข้อมูล cold-path ที่ config
    schema, การตั้งค่า และพื้นผิว UI ใช้ก่อนที่ runtime ของ Plugin จะโหลด

  </Step>

  <Step title="สร้างออบเจ็กต์ Plugin ช่องทาง">
    อินเทอร์เฟซ `ChannelPlugin` มีพื้นผิว adapter แบบไม่บังคับจำนวนมาก เริ่มจาก
    ขั้นต่ำสุดคือ `id` และ `setup` แล้วเพิ่ม adapter ตามที่คุณต้องใช้

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

    สำหรับช่องทางที่รับทั้งคีย์ DM ระดับบนสุดแบบ canonical และคีย์ซ้อนรุ่นเก่า ให้ใช้ตัวช่วยจาก `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` และ `normalizeChannelDmPolicy` จะรักษาค่าภายในบัญชีให้อยู่ก่อนค่ารากที่สืบทอดมา จับคู่ resolver เดียวกันกับการซ่อมแซมของ doctor ผ่าน `normalizeLegacyDmAliases` เพื่อให้ runtime และการย้ายข้อมูลอ่านสัญญาเดียวกัน

    <Accordion title="สิ่งที่ createChatChannelPlugin ทำให้คุณ">
      แทนที่จะใช้อินเทอร์เฟซ adapter ระดับต่ำด้วยตัวเอง คุณส่ง
      ตัวเลือกแบบประกาศ แล้ว builder จะประกอบเข้าด้วยกัน:

      | ตัวเลือก | สิ่งที่เชื่อมต่อให้ |
      | --- | --- |
      | `security.dm` | resolver ความปลอดภัย DM แบบมีขอบเขตจากฟิลด์ config |
      | `pairing.text` | โฟลว์การจับคู่ DM แบบข้อความพร้อมการแลกเปลี่ยนโค้ด |
      | `threading` | resolver โหมด reply-to (แบบคงที่, มีขอบเขตตามบัญชี หรือกำหนดเอง) |
      | `outbound.attachedResults` | ฟังก์ชันส่งที่ส่งคืนข้อมูลเมตาของผลลัพธ์ (ID ข้อความ) |

      คุณยังสามารถส่งออบเจ็กต์ adapter ดิบแทนตัวเลือกแบบประกาศได้
      หากคุณต้องการควบคุมอย่างเต็มที่

      adapter ขาออกดิบอาจกำหนดฟังก์ชัน `chunker(text, limit, ctx)` ได้
      `ctx.formatting` ที่ไม่บังคับจะพกการตัดสินใจด้านการจัดรูปแบบ ณ เวลาส่ง
      เช่น `maxLinesPerMessage`; ให้นำไปใช้ก่อนส่ง เพื่อให้การเรียงเธรดการตอบกลับ
      และขอบเขต chunk ถูกแก้ไขครั้งเดียวโดยการส่งขาออกที่ใช้ร่วมกัน
      บริบทการส่งยังรวม `replyToIdSource` (`implicit` หรือ `explicit`)
      เมื่อเป้าหมายการตอบกลับแบบ native ถูกแก้ไขแล้ว เพื่อให้ตัวช่วย payload สามารถรักษา
      แท็กการตอบกลับแบบชัดเจนไว้ได้โดยไม่ใช้ช่องตอบกลับแบบโดยนัยที่ใช้ได้ครั้งเดียว
    </Accordion>

  </Step>

  <Step title="เชื่อมต่อ entry point">
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
    แสดงในวิธีใช้ระดับรากได้โดยไม่ต้องเปิดใช้งาน runtime ช่องทางแบบเต็ม
    ขณะที่การโหลดแบบเต็มตามปกติยังคงรับ descriptor เดียวกันสำหรับการลงทะเบียนคำสั่งจริง
    เก็บ `registerFull(...)` ไว้สำหรับงานเฉพาะ runtime
    หาก `registerFull(...)` ลงทะเบียนเมธอด RPC ของ Gateway ให้ใช้
    prefix เฉพาะ Plugin namespace ผู้ดูแลของ core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) จะสงวนไว้และ
    resolve เป็น `operator.admin` เสมอ
    `defineChannelPluginEntry` จัดการการแยกโหมดการลงทะเบียนโดยอัตโนมัติ ดู
    [Entry Points](/th/plugins/sdk-entrypoints#definechannelpluginentry) สำหรับตัวเลือกทั้งหมด

  </Step>

  <Step title="เพิ่ม setup entry">
    สร้าง `setup-entry.ts` สำหรับการโหลดแบบเบาระหว่าง onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw โหลดสิ่งนี้แทน entry แบบเต็มเมื่อช่องทางถูกปิดใช้งาน
    หรือยังไม่ได้กำหนดค่า สิ่งนี้หลีกเลี่ยงการดึงโค้ด runtime หนักเข้ามาระหว่างโฟลว์การตั้งค่า
    ดู [การตั้งค่าและการกำหนดค่า](/th/plugins/sdk-setup#setup-entry) สำหรับรายละเอียด

    ช่องทางใน workspace ที่บันเดิลมา ซึ่งแยก export ที่ปลอดภัยสำหรับ setup ไว้ในโมดูล sidecar
    สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก
    `openclaw/plugin-sdk/channel-entry-contract` เมื่อยังต้องการ
    setter ของ runtime ณ เวลา setup แบบชัดเจนด้วย

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
      การจัดการข้อความขาเข้าเป็นเรื่องเฉพาะช่องทาง แต่ละ Plugin ช่องทางเป็นเจ้าของ
      ไปป์ไลน์ขาเข้าของตัวเอง ดู Plugin ช่องทางที่บันเดิลมา
      (เช่น แพ็กเกจ Plugin Microsoft Teams หรือ Google Chat) เพื่อดูรูปแบบจริง
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="ทดสอบ">
เขียนการทดสอบแบบวางไว้ร่วมกันใน `src/channel.test.ts`:

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
  <Card title="ตัวเลือกเธรด" icon="git-branch" href="/th/plugins/sdk-entrypoints#registration-mode">
    โหมดตอบกลับแบบคงที่ แบบจำกัดตามบัญชี หรือแบบกำหนดเอง
  </Card>
  <Card title="การผสานรวมเครื่องมือข้อความ" icon="puzzle" href="/th/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool และการค้นพบการดำเนินการ
  </Card>
  <Card title="การระบุเป้าหมาย" icon="crosshair" href="/th/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="ตัวช่วยรันไทม์" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, STT, สื่อ, เอเจนต์ย่อยผ่าน api.runtime
  </Card>
  <Card title="เคอร์เนลเทิร์นของช่องทาง" icon="bolt" href="/th/plugins/sdk-channel-turn">
    วงจรชีวิตเทิร์นขาเข้าที่ใช้ร่วมกัน: รับเข้า, ระบุ, บันทึก, ส่งต่อ, ปิดท้าย
  </Card>
</CardGroup>

<Note>
บางจุดเชื่อมต่อตัวช่วยที่บันเดิลมายังคงมีอยู่สำหรับการดูแลรักษา Plugin ที่บันเดิลมาและ
ความเข้ากันได้ จุดเชื่อมต่อเหล่านี้ไม่ใช่รูปแบบที่แนะนำสำหรับ Plugin ช่องทางใหม่
ให้ใช้พาธย่อย channel/setup/reply/runtime แบบทั่วไปจากพื้นผิว SDK ร่วม
เว้นแต่ว่าคุณกำลังดูแลตระกูล Plugin ที่บันเดิลมานั้นโดยตรง
</Note>

## ขั้นตอนถัดไป

- [Provider Plugins](/th/plugins/sdk-provider-plugins) - หาก Plugin ของคุณยังให้โมเดลด้วย
- [ภาพรวม SDK](/th/plugins/sdk-overview) - เอกสารอ้างอิงการนำเข้าพาธย่อยทั้งหมด
- [การทดสอบ SDK](/th/plugins/sdk-testing) - ยูทิลิตีทดสอบและการทดสอบสัญญา
- [Manifest ของ Plugin](/th/plugins/manifest) - สคีมา Manifest ทั้งหมด

## ที่เกี่ยวข้อง

- [การตั้งค่า SDK ของ Plugin](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [Plugin ฮาร์เนสของ Agent](/th/plugins/sdk-agent-harness)
