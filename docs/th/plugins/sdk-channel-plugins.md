---
read_when:
    - คุณกำลังสร้าง Plugin ช่องทางการรับส่งข้อความใหม่
    - คุณต้องการเชื่อมต่อ OpenClaw กับแพลตฟอร์มรับส่งข้อความ
    - คุณต้องเข้าใจพื้นผิวอะแดปเตอร์ของ ChannelPlugin
sidebarTitle: Channel Plugins
summary: คู่มือแบบทีละขั้นตอนในการสร้าง Plugin ช่องทางการส่งข้อความสำหรับ OpenClaw
title: การสร้าง Plugin ช่องทาง
x-i18n:
    generated_at: "2026-06-27T18:06:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2148141910d4a275ee800d084d60d7174146140f57ecc5c57cc12824115238be
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

คู่มือนี้อธิบายขั้นตอนการสร้าง Plugin ช่องทางที่เชื่อม OpenClaw กับ
แพลตฟอร์มรับส่งข้อความ เมื่อจบแล้ว คุณจะมีช่องทางที่ใช้งานได้ พร้อมความปลอดภัยของ DM,
การจับคู่, เธรดการตอบกลับ และการส่งข้อความขาออก

<Info>
  หากคุณยังไม่เคยสร้าง Plugin ของ OpenClaw มาก่อน โปรดอ่าน
  [เริ่มต้นใช้งาน](/th/plugins/building-plugins) ก่อน เพื่อทำความเข้าใจโครงสร้างแพ็กเกจ
  และการตั้งค่า manifest พื้นฐาน
</Info>

## Plugin ช่องทางทำงานอย่างไร

Plugin ช่องทางไม่จำเป็นต้องมีเครื่องมือ send/edit/react ของตัวเอง OpenClaw เก็บเครื่องมือ
`message` ที่ใช้ร่วมกันหนึ่งตัวไว้ใน core Plugin ของคุณรับผิดชอบ:

- **Config** - การระบุบัญชีและตัวช่วยตั้งค่า
- **Security** - นโยบาย DM และ allowlist
- **Pairing** - โฟลว์อนุมัติ DM
- **Session grammar** - วิธีที่รหัสบทสนทนาเฉพาะผู้ให้บริการแมปไปยังแชตฐาน, รหัสเธรด และ parent fallback
- **Outbound** - การส่งข้อความ, สื่อ และโพลไปยังแพลตฟอร์ม
- **Threading** - วิธีจัดเธรดให้การตอบกลับ
- **Heartbeat typing** - สัญญาณ typing/busy แบบไม่บังคับสำหรับเป้าหมายการส่ง Heartbeat

Core รับผิดชอบเครื่องมือ message ที่ใช้ร่วมกัน, การเชื่อม prompt, รูปร่าง session-key ภายนอก,
การทำบัญชี `:thread:` แบบทั่วไป และการ dispatch

Plugin ช่องทางใหม่ควรเปิดเผย adapter `message` ด้วย
`defineChannelMessageAdapter` จาก `openclaw/plugin-sdk/channel-outbound` ด้วย
adapter จะประกาศว่าการส่งสุดท้ายแบบคงทนใดที่ transport ดั้งเดิมรองรับจริง
และชี้การส่งข้อความ/สื่อไปยังฟังก์ชัน transport เดียวกับ adapter `outbound` เดิม
ประกาศ capability เฉพาะเมื่อมี contract test พิสูจน์ side effect ฝั่งดั้งเดิมและ receipt ที่ส่งคืนแล้วเท่านั้น
สำหรับสัญญา API ฉบับเต็ม, ตัวอย่าง, ตาราง capability, กฎ receipt,
การสรุป live preview, นโยบาย receive ack, การทดสอบ และตาราง migration โปรดดู
[Channel outbound API](/th/plugins/sdk-channel-outbound)
หาก adapter `outbound` ที่มีอยู่มีเมธอดส่งและ metadata ของ capability ที่ถูกต้องอยู่แล้ว ให้ใช้
`createChannelMessageAdapterFromOutbound(...)` เพื่อสร้าง adapter `message`
แทนการเขียน bridge อีกตัวด้วยมือ
การส่งของ adapter ควรคืนค่า `MessageReceipt` เมื่อโค้ดความเข้ากันได้
ยังต้องใช้รหัสเดิม ให้แปลงด้วย `listMessageReceiptPlatformIds(...)`
หรือ `resolveMessageReceiptPrimaryId(...)` แทนการเก็บฟิลด์
`messageIds` แบบขนานในโค้ด lifecycle ใหม่
ช่องทางที่รองรับ preview ควรประกาศ `message.live.capabilities` ด้วย
lifecycle แบบ live ที่ตนรับผิดชอบอย่างแม่นยำ เช่น `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` หรือ
`quietFinalization` ช่องทางที่สรุป draft preview ณ ตำแหน่งเดิมควรประกาศ
`message.live.finalizer.capabilities` ด้วย เช่น `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` และ
`retainOnAmbiguousFailure` และกำหนดให้ runtime logic ผ่าน
`defineFinalizableLivePreviewAdapter(...)` พร้อม
`deliverWithFinalizableLivePreviewAdapter(...)` รองรับ capability เหล่านั้นด้วยการทดสอบ
`verifyChannelMessageLiveCapabilityAdapterProofs(...)` และ
`verifyChannelMessageLiveFinalizerProofs(...)` เพื่อไม่ให้พฤติกรรม native preview,
progress, edit, fallback/retention, cleanup และ receipt คลาดเคลื่อนไปอย่างเงียบ ๆ
ตัวรับขาเข้าที่เลื่อนการ acknowledge ของแพลตฟอร์มควรประกาศ
`message.receive.defaultAckPolicy` และ `supportedAckPolicies` แทนการซ่อน
จังหวะ ack ไว้ในสถานะเฉพาะ monitor ครอบคลุมทุกนโยบายที่ประกาศด้วย
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`

ตัวช่วยตอบกลับเดิม เช่น `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` และ `recordInboundSessionAndDispatchReply`
ยังมีให้ใช้สำหรับ dispatcher เพื่อความเข้ากันได้ อย่าใช้ชื่อเหล่านั้นสำหรับโค้ดช่องทางใหม่;
Plugin ใหม่ควรเริ่มจาก adapter `message`, receipt และตัวช่วย lifecycle รับ/ส่งใน
`openclaw/plugin-sdk/channel-outbound`

ช่องทางที่กำลังย้ายการอนุญาตขาเข้าสามารถใช้ subpath ทดลอง
`openclaw/plugin-sdk/channel-ingress-runtime` จากเส้นทาง receive ของ runtime ได้
subpath นี้เก็บการค้นหาแพลตฟอร์มและ side effect ไว้ใน Plugin ขณะเดียวกันก็ใช้
การระบุสถานะ allowlist, การตัดสินใจ route/sender/command/event/activation,
diagnostic ที่ redact แล้ว และการแมป turn-admission ร่วมกัน เก็บการ normalize
ตัวตนของ Plugin ไว้ใน descriptor ที่คุณส่งให้ resolver; อย่า serialize ค่า match ดิบ
จากสถานะหรือการตัดสินใจที่ resolve แล้ว โปรดดู
[Channel ingress API](/th/plugins/sdk-channel-ingress) สำหรับการออกแบบ API,
ขอบเขตความเป็นเจ้าของ และความคาดหวังด้านการทดสอบ

หากช่องทางของคุณรองรับ typing indicator นอกเหนือจากการตอบกลับขาเข้า ให้เปิดเผย
`heartbeat.sendTyping(...)` บน Plugin ช่องทาง Core จะเรียกใช้พร้อมเป้าหมาย
การส่ง Heartbeat ที่ resolve แล้วก่อนที่การรันโมเดล Heartbeat จะเริ่ม และใช้ lifecycle
typing keepalive/cleanup ที่ใช้ร่วมกัน เพิ่ม `heartbeat.clearTyping(...)`
เมื่อแพลตฟอร์มต้องการสัญญาณหยุดอย่างชัดเจน

หากช่องทางของคุณเพิ่มพารามิเตอร์ของ message-tool ที่มีแหล่งสื่อ ให้เปิดเผย
ชื่อพารามิเตอร์เหล่านั้นผ่าน `describeMessageTool(...).mediaSourceParams` Core ใช้
รายการที่ชัดเจนนี้สำหรับการ normalize path ของ sandbox และนโยบายการเข้าถึงสื่อขาออก
ดังนั้น Plugin จึงไม่ต้องมีกรณีพิเศษใน shared-core สำหรับพารามิเตอร์ avatar, attachment
หรือ cover-image เฉพาะผู้ให้บริการ
ควรคืนค่าเป็น map ตาม action key เช่น
`{ "set-profile": ["avatarUrl", "avatarPath"] }` เพื่อไม่ให้ action ที่ไม่เกี่ยวข้อง
รับ media args ของ action อื่นโดยปริยาย array แบบแบนยังใช้ได้สำหรับพารามิเตอร์ที่
ตั้งใจให้ใช้ร่วมกันในทุก action ที่เปิดเผย
ช่องทางที่ต้องเปิดเผย URL สาธารณะชั่วคราวสำหรับการดึงสื่อฝั่งแพลตฟอร์ม
สามารถใช้ `createHostedOutboundMediaStore(...)` จาก
`openclaw/plugin-sdk/outbound-media` กับ state store ของ Plugin ได้ เก็บการ parse
route ของแพลตฟอร์มและการบังคับใช้ token ไว้ใน Plugin ช่องทาง; ตัวช่วยที่ใช้ร่วมกัน
รับผิดชอบเฉพาะการโหลดสื่อ, metadata การหมดอายุ, แถว chunk และ cleanup

หากช่องทางของคุณต้องการการจัดรูปเฉพาะผู้ให้บริการสำหรับ `message(action="send")`,
ควรใช้ `actions.prepareSendPayload(...)` ใส่ native card, block, embed หรือ
ข้อมูลคงทนอื่น ๆ ไว้ใต้ `payload.channelData.<channel>` แล้วให้ core ส่งจริงผ่าน
adapter outbound/message ใช้ `actions.handleAction(...)` สำหรับ send เฉพาะเป็น
compatibility fallback สำหรับ payload ที่ไม่สามารถ serialize และ retry ได้

หากแพลตฟอร์มของคุณเก็บ scope เพิ่มเติมไว้ภายในรหัสบทสนทนา ให้เก็บการ parse นั้น
ไว้ใน Plugin ด้วย `messaging.resolveSessionConversation(...)` นี่คือ hook มาตรฐาน
สำหรับแมป `rawId` ไปยังรหัสบทสนทนาฐาน, รหัสเธรดแบบไม่บังคับ,
`baseConversationId` แบบชัดเจน และ `parentConversationCandidates` ใด ๆ
เมื่อคุณคืนค่า `parentConversationCandidates` ให้เรียงจาก parent ที่แคบที่สุด
ไปยังบทสนทนาที่กว้างที่สุด/ฐาน

ใช้ `openclaw/plugin-sdk/channel-route` เมื่อโค้ด Plugin ต้อง normalize
ฟิลด์ที่คล้าย route, เปรียบเทียบเธรดย่อยกับ route ของ parent หรือสร้าง dedupe key
ที่เสถียรจาก `{ channel, to, accountId, threadId }` ตัวช่วยนี้ normalize รหัสเธรด
แบบตัวเลขเหมือนกับที่ core ทำ ดังนั้น Plugin ควรใช้สิ่งนี้แทนการเปรียบเทียบ
`String(threadId)` แบบเฉพาะกิจ
Plugin ที่มี target grammar เฉพาะผู้ให้บริการควรเปิดเผย
`messaging.resolveOutboundSessionRoute(...)` เพื่อให้ core ได้ตัวตน session
และ thread แบบดั้งเดิมของผู้ให้บริการโดยไม่ใช้ parser shim

Plugin ที่ bundled ซึ่งต้องใช้การ parse เดียวกันก่อน channel registry เริ่มทำงาน
ยังสามารถเปิดเผยไฟล์ `session-key-api.ts` ระดับบนสุดที่มี export
`resolveSessionConversation(...)` ตรงกันได้ Core ใช้พื้นผิวที่ bootstrap ได้อย่างปลอดภัยนี้
เฉพาะเมื่อ registry ของ Plugin ใน runtime ยังไม่พร้อมใช้งานเท่านั้น

`messaging.resolveParentConversationCandidates(...)` ยังคงมีให้ใช้เป็น
legacy compatibility fallback เมื่อ Plugin ต้องการเฉพาะ parent fallback บน generic/raw id
หากมี hook ทั้งสองตัว Core จะใช้
`resolveSessionConversation(...).parentConversationCandidates` ก่อน และ fallback ไปยัง
`resolveParentConversationCandidates(...)` เฉพาะเมื่อ hook มาตรฐานละไว้เท่านั้น

## การอนุมัติและ capability ของช่องทาง

Plugin ช่องทางส่วนใหญ่ไม่จำเป็นต้องมีโค้ดเฉพาะการอนุมัติ

- แกนหลักเป็นเจ้าของ `/approve` ในแชตเดียวกัน, เพย์โหลดปุ่มอนุมัติที่ใช้ร่วมกัน, และการส่งผ่านกลไกสำรองทั่วไป
- ให้เลือกใช้ออบเจ็กต์ `approvalCapability` หนึ่งรายการบน Plugin ช่องทางเมื่อช่องทางต้องการพฤติกรรมเฉพาะสำหรับการอนุมัติ
- `ChannelPlugin.approvals` ถูกลบแล้ว ให้วางข้อเท็จจริงเกี่ยวกับการส่งการอนุมัติ/เนทีฟ/การเรนเดอร์/การยืนยันตัวตนไว้บน `approvalCapability`
- `plugin.auth` มีไว้สำหรับล็อกอิน/ล็อกเอาต์เท่านั้น; แกนหลักจะไม่อ่านฮุกยืนยันตัวตนสำหรับการอนุมัติจากออบเจ็กต์นั้นอีกต่อไป
- `approvalCapability.authorizeActorAction` และ `approvalCapability.getActionAvailabilityState` คือ seam มาตรฐานสำหรับการยืนยันตัวตนการอนุมัติ
- ใช้ `approvalCapability.getActionAvailabilityState` สำหรับความพร้อมใช้งานของการยืนยันตัวตนการอนุมัติในแชตเดียวกัน
- หากช่องทางของคุณเปิดเผยการอนุมัติ exec แบบเนทีฟ ให้ใช้ `approvalCapability.getExecInitiatingSurfaceState` สำหรับสถานะพื้นผิวเริ่มต้น/ไคลเอนต์เนทีฟเมื่อแตกต่างจากการยืนยันตัวตนการอนุมัติในแชตเดียวกัน แกนหลักใช้ฮุกเฉพาะ exec นี้เพื่อแยกความแตกต่างระหว่าง `enabled` กับ `disabled`, ตัดสินใจว่าช่องทางเริ่มต้นรองรับการอนุมัติ exec แบบเนทีฟหรือไม่, และรวมช่องทางนั้นไว้ในคำแนะนำกลไกสำรองของไคลเอนต์เนทีฟ `createApproverRestrictedNativeApprovalCapability(...)` จะเติมส่วนนี้ให้สำหรับกรณีทั่วไป
- ใช้ `outbound.shouldSuppressLocalPayloadPrompt` หรือ `outbound.beforeDeliverPayload` สำหรับพฤติกรรมวงจรชีวิตเพย์โหลดเฉพาะช่องทาง เช่น การซ่อนพรอมป์การอนุมัติภายในที่ซ้ำกัน หรือการส่งตัวบ่งชี้ว่ากำลังพิมพ์ก่อนส่ง
- ใช้ `approvalCapability.delivery` เฉพาะสำหรับการกำหนดเส้นทางการอนุมัติแบบเนทีฟหรือการระงับกลไกสำรอง
- ใช้ `approvalCapability.nativeRuntime` สำหรับข้อเท็จจริงการอนุมัติแบบเนทีฟที่ช่องทางเป็นเจ้าของ ให้คงความ lazy บน entrypoint ช่องทางที่เป็น hot path ด้วย `createLazyChannelApprovalNativeRuntimeAdapter(...)` ซึ่งสามารถนำเข้าโมดูล runtime ของคุณเมื่อจำเป็น ขณะยังให้แกนหลักประกอบวงจรชีวิตการอนุมัติได้
- ใช้ `approvalCapability.render` เฉพาะเมื่อช่องทางจำเป็นต้องมีเพย์โหลดการอนุมัติแบบกำหนดเองจริง ๆ แทนตัวเรนเดอร์ที่ใช้ร่วมกัน
- ใช้ `approvalCapability.describeExecApprovalSetup` เมื่อช่องทางต้องการให้การตอบกลับของเส้นทางที่ถูกปิดใช้งานอธิบายปุ่มปรับแต่ง config ที่แน่นอนซึ่งจำเป็นต่อการเปิดใช้การอนุมัติ exec แบบเนทีฟ ฮุกจะได้รับ `{ channel, channelLabel, accountId }`; ช่องทางที่ใช้บัญชีแบบมีชื่อควรเรนเดอร์พาธแบบ scoped ตามบัญชี เช่น `channels.<channel>.accounts.<id>.execApprovals.*` แทนค่าเริ่มต้นระดับบนสุด
- หากช่องทางสามารถอนุมานตัวตน DM ที่คล้ายเจ้าของและเสถียรจาก config ที่มีอยู่ ให้ใช้ `createResolvedApproverActionAuthAdapter` จาก `openclaw/plugin-sdk/approval-runtime` เพื่อจำกัด `/approve` ในแชตเดียวกันโดยไม่เพิ่มตรรกะแกนหลักเฉพาะสำหรับการอนุมัติ
- หากการยืนยันตัวตนการอนุมัติแบบกำหนดเองตั้งใจอนุญาตเฉพาะกลไกสำรองในแชตเดียวกัน ให้คืนค่า `markImplicitSameChatApprovalAuthorization({ authorized: true })` จาก `openclaw/plugin-sdk/approval-auth-runtime`; ไม่เช่นนั้นแกนหลักจะถือว่าผลลัพธ์เป็นการอนุญาตผู้อนุมัติแบบชัดเจน
- หาก callback เนทีฟที่ช่องทางเป็นเจ้าของ resolve การอนุมัติโดยตรง ให้ใช้ `isImplicitSameChatApprovalAuthorization(...)` ก่อน resolve เพื่อให้กลไกสำรองแบบนัยยังผ่านการอนุญาต actor ตามปกติของช่องทาง
- หากช่องทางต้องการการส่งการอนุมัติแบบเนทีฟ ให้โค้ดช่องทางมุ่งเน้นที่การ normalize เป้าหมายและข้อเท็จจริง transport/presentation ใช้ `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, และ `createApproverRestrictedNativeApprovalCapability` จาก `openclaw/plugin-sdk/approval-runtime` วางข้อเท็จจริงเฉพาะช่องทางไว้หลัง `approvalCapability.nativeRuntime` โดยควรผ่าน `createChannelApprovalNativeRuntimeAdapter(...)` หรือ `createLazyChannelApprovalNativeRuntimeAdapter(...)` เพื่อให้แกนหลักประกอบ handler และเป็นเจ้าของการกรองคำขอ, การกำหนดเส้นทาง, การ dedupe, การหมดอายุ, การสมัครใช้งาน Gateway, และประกาศว่าถูกส่งไปที่อื่น `nativeRuntime` ถูกแยกเป็น seam ที่เล็กลงสองสามส่วน:
- ใช้ `createNativeApprovalChannelRouteGates` จาก `openclaw/plugin-sdk/approval-native-runtime` เมื่อช่องทางรองรับทั้งการส่งแบบเนทีฟจากต้นทาง session และเป้าหมายส่งต่อการอนุมัติแบบชัดเจน helper นี้รวมศูนย์การเลือก config การอนุมัติ, การจัดการ `mode`, ตัวกรอง agent/session, การผูกบัญชี, การจับคู่เป้าหมาย session, และการจับคู่รายการเป้าหมาย ขณะที่ caller ยังเป็นเจ้าของ id ช่องทาง, โหมดส่งต่อเริ่มต้น, การค้นหาบัญชี, การตรวจว่าเปิดใช้ transport แล้วหรือไม่, การ normalize เป้าหมาย, และการ resolve เป้าหมายจากแหล่งที่มาของ turn อย่าใช้สิ่งนี้เพื่อสร้างค่าเริ่มต้นนโยบายช่องทางที่แกนหลักเป็นเจ้าของ; ให้ส่งโหมดเริ่มต้นที่ช่องทางบันทึกไว้ในเอกสารอย่างชัดเจน
- `createChannelNativeOriginTargetResolver` ใช้ตัวจับคู่ route ช่องทางที่ใช้ร่วมกันเป็นค่าเริ่มต้นสำหรับเป้าหมาย `{ to, accountId, threadId }` ส่ง `targetsMatch` เฉพาะเมื่อช่องทางมีกฎความเทียบเท่าเฉพาะ provider เช่น การจับคู่ prefix timestamp ของ Slack
- ส่ง `normalizeTargetForMatch` ให้ `createChannelNativeOriginTargetResolver` เมื่อช่องทางต้อง canonicalize id ของ provider ก่อนที่ตัวจับคู่ route เริ่มต้นหรือ callback `targetsMatch` แบบกำหนดเองจะทำงาน โดยยังรักษาเป้าหมายเดิมไว้สำหรับการส่ง ใช้ `normalizeTarget` เฉพาะเมื่อเป้าหมายการส่งที่ resolve แล้วควรถูก canonicalize เอง
- `availability` - บัญชีถูก config แล้วหรือไม่ และคำขอควรถูกจัดการหรือไม่
- `presentation` - แมป view model การอนุมัติที่ใช้ร่วมกันเป็นเพย์โหลดเนทีฟหรือ action สุดท้ายในสถานะ pending/resolved/expired
- `transport` - เตรียมเป้าหมาย รวมถึงส่ง/อัปเดต/ลบข้อความอนุมัติแบบเนทีฟ
- `interactions` - ฮุก bind/unbind/clear-action แบบเลือกได้สำหรับปุ่มหรือ reaction แบบเนทีฟ รวมถึงฮุก `cancelDelivered` แบบเลือกได้ ให้ implement `cancelDelivered` เมื่อ `deliverPending` ลงทะเบียนสถานะใน process หรือสถานะถาวร เช่น ที่เก็บเป้าหมาย reaction เพื่อให้ปล่อยสถานะนั้นได้หากการหยุด handler ยกเลิกการส่งก่อน `bindPending` ทำงาน หรือเมื่อ `bindPending` ไม่คืน handle
- `observe` - ฮุกวินิจฉัยการส่งแบบเลือกได้
- หากช่องทางต้องการออบเจ็กต์ที่ runtime เป็นเจ้าของ เช่น client, token, แอป Bolt, หรือ webhook receiver ให้ลงทะเบียนผ่าน `openclaw/plugin-sdk/channel-runtime-context` registry runtime-context ทั่วไปช่วยให้แกนหลัก bootstrap handler ที่ขับเคลื่อนด้วย capability จากสถานะเริ่มต้นของช่องทางได้โดยไม่ต้องเพิ่ม glue wrapper เฉพาะการอนุมัติ
- หยิบใช้ `createChannelApprovalHandler` หรือ `createChannelNativeApprovalRuntime` ระดับล่างเฉพาะเมื่อ seam ที่ขับเคลื่อนด้วย capability ยังไม่สามารถอธิบายสิ่งที่ต้องการได้เพียงพอ
- ช่องทางการอนุมัติแบบเนทีฟต้อง route ทั้ง `accountId` และ `approvalKind` ผ่าน helper เหล่านั้น `accountId` ทำให้นโยบายการอนุมัติหลายบัญชีถูก scoped ไปยังบัญชี bot ที่ถูกต้อง และ `approvalKind` ทำให้พฤติกรรมการอนุมัติ exec เทียบกับ plugin ยังพร้อมให้ช่องทางใช้โดยไม่ต้องมี branch แบบ hardcoded ในแกนหลัก
- ตอนนี้แกนหลักเป็นเจ้าของประกาศ reroute การอนุมัติด้วย Plugin ช่องทางไม่ควรส่งข้อความติดตามของตนเองว่า "การอนุมัติถูกส่งไปที่ DM / ช่องทางอื่น" จาก `createChannelNativeApprovalRuntime`; ให้เปิดเผยการกำหนดเส้นทาง origin + approver-DM ที่ถูกต้องผ่าน helper capability การอนุมัติที่ใช้ร่วมกัน และให้แกนหลักรวมการส่งจริงก่อนโพสต์ประกาศใด ๆ กลับไปยังแชตเริ่มต้น
- รักษาชนิด id การอนุมัติที่ส่งแล้วแบบ end-to-end ไคลเอนต์เนทีฟไม่ควร
  เดาหรือเขียนทับการกำหนดเส้นทางการอนุมัติ exec เทียบกับ plugin จากสถานะภายในช่องทาง
- ชนิดการอนุมัติที่แตกต่างกันสามารถตั้งใจเปิดเผยพื้นผิวเนทีฟที่แตกต่างกันได้
  ตัวอย่างที่ bundled ในปัจจุบัน:
  - Slack คงการกำหนดเส้นทางการอนุมัติแบบเนทีฟไว้สำหรับทั้ง id exec และ plugin
  - Matrix คงการกำหนดเส้นทาง DM/ช่องทางแบบเนทีฟและ UX reaction เดียวกันสำหรับการอนุมัติ exec
    และ plugin ขณะยังอนุญาตให้ auth แตกต่างกันตามชนิดการอนุมัติ
- `createApproverRestrictedNativeApprovalAdapter` ยังมีอยู่ในฐานะ wrapper สำหรับความเข้ากันได้ แต่โค้ดใหม่ควรเลือกใช้ capability builder และเปิดเผย `approvalCapability` บน plugin

สำหรับ entrypoint ช่องทางที่เป็น hot path ให้เลือกใช้ subpath runtime ที่แคบกว่าเมื่อคุณต้องการ
เพียงส่วนเดียวของตระกูลนั้น:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

เช่นเดียวกัน ให้เลือก `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, และ
`openclaw/plugin-sdk/reply-chunking` เมื่อคุณไม่ต้องการพื้นผิว umbrella
ที่กว้างกว่า

สำหรับ setup โดยเฉพาะ:

- `openclaw/plugin-sdk/setup-runtime` ครอบคลุม helper setup ที่ปลอดภัยสำหรับ runtime:
  `createSetupTranslator`, adapter แพตช์ setup ที่ปลอดภัยต่อการ import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), เอาต์พุต lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries`, และ builder
  setup-proxy ที่มอบหมายงาน
- `openclaw/plugin-sdk/setup-runtime` รวม seam adapter ที่รับรู้ env สำหรับ
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` ครอบคลุม builder setup สำหรับ optional-install
  รวมถึง primitive ที่ปลอดภัยสำหรับ setup อีกสองสามรายการ:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

หากช่องทางของคุณรองรับ setup หรือ auth ที่ขับเคลื่อนด้วย env และ flow startup/config
ทั่วไปควรรู้ชื่อ env เหล่านั้นก่อน runtime โหลด ให้ประกาศไว้ใน
manifest ของ plugin ด้วย `channelEnvVars` เก็บ `envVars` ของ runtime ช่องทางหรือ
ค่าคงที่ภายในไว้เฉพาะสำหรับข้อความที่แสดงต่อ operator เท่านั้น

หากช่องทางของคุณสามารถปรากฏใน `status`, `channels list`, `channels status`, หรือ
การสแกน SecretRef ก่อน runtime ของ plugin เริ่ม ให้เพิ่ม `openclaw.setupEntry` ใน
`package.json` entrypoint นั้นควรปลอดภัยต่อการ import ในพาธคำสั่งแบบอ่านอย่างเดียว
และควรคืน metadata ของช่องทาง, adapter config ที่ปลอดภัยสำหรับ setup, adapter status,
และ metadata เป้าหมาย secret ของช่องทางที่จำเป็นสำหรับสรุปเหล่านั้น อย่า
เริ่ม client, listener, หรือ runtime transport จาก entry setup

รักษาพาธ import ของ entry ช่องทางหลักให้แคบด้วย Discovery สามารถประเมิน
entry และโมดูล plugin ช่องทางเพื่อลงทะเบียน capability โดยไม่เปิดใช้งาน
ช่องทาง ไฟล์เช่น `channel-plugin-api.ts` ควร export ออบเจ็กต์ plugin ช่องทาง
โดยไม่นำเข้า setup wizard, transport client, socket
listener, subprocess launcher, หรือโมดูล startup ของบริการ วางชิ้นส่วน runtime
เหล่านั้นไว้ในโมดูลที่โหลดจาก `registerFull(...)`, runtime setter, หรือ adapter
capability แบบ lazy

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, และ
`splitSetupEntries`

- ใช้ seam `openclaw/plugin-sdk/setup` ที่กว้างกว่าเฉพาะเมื่อคุณต้องการ
  helper setup/config ที่ใช้ร่วมกันและหนักกว่า เช่น
  `moveSingleAccountChannelSectionToDefaultAccount(...)` ด้วย

หากช่องทางของคุณต้องการเพียงโฆษณาว่า "ติดตั้ง plugin นี้ก่อน" ในพื้นผิว
setup ให้เลือก `createOptionalChannelSetupSurface(...)` adapter/wizard ที่สร้างขึ้น
จะ fail closed เมื่อเขียน config และ finalization และนำข้อความ install-required
เดียวกันกลับมาใช้ใน validation, finalize, และข้อความลิงก์เอกสาร

สำหรับพาธช่องทาง hot path อื่น ๆ ให้เลือก helper ที่แคบแทนพื้นผิว legacy
ที่กว้างกว่า:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` และ
  `openclaw/plugin-sdk/account-helpers` สำหรับการกำหนดค่าหลายบัญชีและ
  การย้อนกลับไปใช้บัญชีเริ่มต้น
- `openclaw/plugin-sdk/inbound-envelope` และ
  `openclaw/plugin-sdk/channel-inbound` สำหรับเส้นทาง/เอนเวโลปขาเข้าและ
  การต่อสาย record-and-dispatch
- `openclaw/plugin-sdk/channel-targets` สำหรับตัวช่วยแยกวิเคราะห์เป้าหมาย
- `openclaw/plugin-sdk/outbound-media` สำหรับการโหลดสื่อและ
  `openclaw/plugin-sdk/channel-outbound` สำหรับผู้มอบหมายตัวตน/การส่งขาออก
  และการวางแผนเพย์โหลด
- `buildThreadAwareOutboundSessionRoute(...)` จาก
  `openclaw/plugin-sdk/channel-core` เมื่อเส้นทางขาออกควรรักษา
  `replyToId`/`threadId` ที่ระบุชัดเจน หรือกู้คืนเซสชัน `:thread:` ปัจจุบัน
  หลังจากคีย์เซสชันพื้นฐานยังคงตรงกัน Provider plugins สามารถแทนที่
  ลำดับความสำคัญ พฤติกรรมส่วนต่อท้าย และการทำให้รหัสเธรดเป็นมาตรฐาน
  เมื่อแพลตฟอร์มของตนมีความหมายเชิงการส่งเธรดแบบเนทีฟ
- `openclaw/plugin-sdk/thread-bindings-runtime` สำหรับวงจรชีวิตของการผูกเธรด
  และการลงทะเบียนอะแดปเตอร์
- `openclaw/plugin-sdk/agent-media-payload` เฉพาะเมื่อยังจำเป็นต้องใช้
  โครงร่างฟิลด์เพย์โหลด agent/media แบบดั้งเดิม
- `openclaw/plugin-sdk/telegram-command-config` สำหรับการทำคำสั่งกำหนดเองของ Telegram
  ให้เป็นมาตรฐาน การตรวจสอบรายการซ้ำ/ข้อขัดแย้ง และสัญญาการกำหนดค่าคำสั่ง
  ที่เสถียรเมื่อใช้ fallback

ช่องทางที่ใช้เฉพาะการยืนยันตัวตนมักหยุดที่เส้นทางเริ่มต้นได้: core จัดการการอนุมัติ และ Plugin เพียงเปิดเผยความสามารถขาออก/การยืนยันตัวตน ช่องทางการอนุมัติแบบเนทีฟ เช่น Matrix, Slack, Telegram และทรานสปอร์ตแชตแบบกำหนดเอง ควรใช้ตัวช่วยเนทีฟที่ใช้ร่วมกันแทนการสร้างวงจรชีวิตการอนุมัติของตนเอง

## นโยบายการกล่าวถึงขาเข้า

แยกการจัดการการกล่าวถึงขาเข้าไว้สองชั้น:

- การรวบรวมหลักฐานที่ Plugin เป็นเจ้าของ
- การประเมินนโยบายที่ใช้ร่วมกัน

ใช้ `openclaw/plugin-sdk/channel-mention-gating` สำหรับการตัดสินใจเกี่ยวกับนโยบายการกล่าวถึง
ใช้ `openclaw/plugin-sdk/channel-inbound` เฉพาะเมื่อคุณต้องการ helper barrel ขาเข้า
ที่กว้างกว่า

เหมาะกับตรรกะภายใน Plugin:

- การตรวจจับการตอบกลับถึงบอต
- การตรวจจับการอ้างอิงบอต
- การตรวจสอบการมีส่วนร่วมในเธรด
- การยกเว้นข้อความบริการ/ระบบ
- แคชเนทีฟของแพลตฟอร์มที่จำเป็นต่อการพิสูจน์การมีส่วนร่วมของบอต

เหมาะกับตัวช่วยที่ใช้ร่วมกัน:

- `requireMention`
- ผลลัพธ์การกล่าวถึงโดยชัดเจน
- รายการอนุญาตการกล่าวถึงโดยนัย
- การข้ามคำสั่ง
- การตัดสินใจข้ามขั้นสุดท้าย

ลำดับที่แนะนำ:

1. คำนวณข้อเท็จจริงการกล่าวถึงภายในเครื่อง
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
bundled channel plugins ที่พึ่งพาการฉีด runtime อยู่แล้ว:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

หากคุณต้องการเพียง `implicitMentionKindWhen` และ
`resolveInboundMentionDecision` ให้นำเข้าจาก
`openclaw/plugin-sdk/channel-mention-gating` เพื่อหลีกเลี่ยงการโหลดตัวช่วย runtime
ขาเข้าที่ไม่เกี่ยวข้อง

ใช้ `resolveInboundMentionDecision({ facts, policy })` สำหรับการกั้นการกล่าวถึง.

  ## คำแนะนำทีละขั้นตอน

  <Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="แพ็กเกจและแมนิเฟสต์">
    สร้างไฟล์ Plugin มาตรฐาน ฟิลด์ `channel` ใน `package.json` คือสิ่งที่ทำให้สิ่งนี้เป็น Plugin ช่องทาง สำหรับพื้นผิวเมทาดาทาแพ็กเกจแบบครบถ้วน ดู [การตั้งค่าและการกำหนดค่า Plugin](/th/plugins/sdk-setup#openclaw-channel):

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

    `configSchema` ตรวจสอบความถูกต้องของ `plugins.entries.acme-chat.config` ใช้สำหรับการตั้งค่าที่ Plugin เป็นเจ้าของซึ่งไม่ใช่การกำหนดค่าบัญชีช่องทาง `channelConfigs` ตรวจสอบความถูกต้องของ `channels.acme-chat` และเป็นแหล่งข้อมูลใน cold-path ที่สคีมาการกำหนดค่า การตั้งค่า และพื้นผิว UI ใช้ก่อนที่รันไทม์ของ Plugin จะโหลด

  </Step>

  <Step title="สร้างอ็อบเจกต์ Plugin ช่องทาง">
    อินเทอร์เฟซ `ChannelPlugin` มีพื้นผิวอะแดปเตอร์ทางเลือกหลายรายการ เริ่มจากขั้นต่ำสุด - `id` และ `setup` - แล้วเพิ่มอะแดปเตอร์ตามที่จำเป็น

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

    สำหรับช่องทางที่ยอมรับทั้งคีย์ DM ระดับบนสุดตามรูปแบบมาตรฐานและคีย์แบบซ้อนเดิม ให้ใช้ตัวช่วยจาก `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` และ `normalizeChannelDmPolicy` จะรักษาค่าระดับบัญชีให้อยู่ก่อนค่าระดับรากที่สืบทอดมา จับคู่ตัวแก้ค่าเดียวกันกับการซ่อมแซมโดย doctor ผ่าน `normalizeLegacyDmAliases` เพื่อให้รันไทม์และการย้ายข้อมูลอ่านสัญญาเดียวกัน

    <Accordion title="createChatChannelPlugin ทำอะไรให้คุณ">
      แทนที่จะต้องใช้งานอินเทอร์เฟซอะแดปเตอร์ระดับต่ำด้วยตนเอง คุณส่งตัวเลือกเชิงประกาศ แล้วตัวสร้างจะประกอบให้:

      | ตัวเลือก | สิ่งที่เชื่อมต่อ |
      | --- | --- |
      | `security.dm` | ตัวแก้ความปลอดภัย DM แบบมีขอบเขตจากฟิลด์การกำหนดค่า |
      | `pairing.text` | โฟลว์การจับคู่ DM แบบข้อความพร้อมการแลกเปลี่ยนโค้ด |
      | `threading` | ตัวแก้โหมดตอบกลับถึง (แบบคงที่ แบบผูกกับบัญชี หรือแบบกำหนดเอง) |
      | `outbound.attachedResults` | ฟังก์ชันส่งที่คืนเมทาดาทาผลลัพธ์ (ID ข้อความ) |

      คุณยังสามารถส่งอ็อบเจกต์อะแดปเตอร์ดิบแทนตัวเลือกเชิงประกาศได้ หากต้องการควบคุมเต็มรูปแบบ

      อะแดปเตอร์ขาออกดิบอาจกำหนดฟังก์ชัน `chunker(text, limit, ctx)` ได้ `ctx.formatting` ที่เป็นทางเลือกจะพกการตัดสินใจด้านการจัดรูปแบบ ณ เวลาส่ง เช่น `maxLinesPerMessage`; ให้นำไปใช้ก่อนส่ง เพื่อให้การโยงเธรดของการตอบกลับและขอบเขตชังก์ถูกแก้เพียงครั้งเดียวโดยการส่งขาออกที่ใช้ร่วมกัน คอนเท็กซ์การส่งยังรวม `replyToIdSource` (`implicit` หรือ `explicit`) เมื่อแก้เป้าหมายการตอบกลับแบบเนทีฟแล้ว เพื่อให้ตัวช่วยเพย์โหลดสามารถรักษาแท็กตอบกลับแบบชัดเจนไว้ได้โดยไม่ใช้สล็อตตอบกลับแบบใช้ครั้งเดียวโดยนัย
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

    ใส่ตัวอธิบาย CLI ที่ช่องเป็นเจ้าของไว้ใน `registerCliMetadata(...)` เพื่อให้ OpenClaw
    แสดงในวิธีใช้ระดับรากได้โดยไม่ต้องเปิดใช้งานรันไทม์ช่องทั้งหมด
    ขณะที่การโหลดเต็มรูปแบบตามปกติยังคงดึงตัวอธิบายเดียวกันไปใช้สำหรับการลงทะเบียนคำสั่งจริง
    เก็บ `registerFull(...)` ไว้สำหรับงานเฉพาะรันไทม์
    หาก `registerFull(...)` ลงทะเบียนเมธอด RPC ของ Gateway ให้ใช้คำนำหน้า
    เฉพาะ Plugin เนมสเปซผู้ดูแลหลัก (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ยังคงถูกสงวนไว้และจะ
    resolve เป็น `operator.admin` เสมอ
    `defineChannelPluginEntry` จัดการการแยกโหมดการลงทะเบียนโดยอัตโนมัติ ดู
    [จุดเข้าใช้งาน](/th/plugins/sdk-entrypoints#definechannelpluginentry) สำหรับตัวเลือกทั้งหมด

  </Step>

  <Step title="เพิ่มรายการตั้งค่า">
    สร้าง `setup-entry.ts` สำหรับการโหลดแบบเบาระหว่างการเริ่มต้นใช้งาน:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw จะโหลดรายการนี้แทนรายการแบบเต็มเมื่อช่องถูกปิดใช้งาน
    หรือยังไม่ได้กำหนดค่า วิธีนี้หลีกเลี่ยงการดึงโค้ดรันไทม์ขนาดใหญ่เข้ามาระหว่างโฟลว์การตั้งค่า
    ดูรายละเอียดที่ [การตั้งค่าและการกำหนดค่า](/th/plugins/sdk-setup#setup-entry)

    ช่องในเวิร์กสเปซที่บันเดิลมาซึ่งแยก export ที่ปลอดภัยสำหรับการตั้งค่าออกเป็นโมดูลข้างเคียง
    สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก
    `openclaw/plugin-sdk/channel-entry-contract` ได้ เมื่อยังต้องการ
    ตัวตั้งค่ารันไทม์แบบชัดเจนในช่วงตั้งค่า

  </Step>

  <Step title="จัดการข้อความขาเข้า">
    Plugin ของคุณต้องรับข้อความจากแพลตฟอร์มและส่งต่อไปยัง
    OpenClaw รูปแบบทั่วไปคือ Webhook ที่ตรวจสอบคำขอและ
    dispatch ผ่านตัวจัดการขาเข้าของช่องของคุณ:

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
      การจัดการข้อความขาเข้าเป็นเรื่องเฉพาะของแต่ละช่อง Plugin ช่องแต่ละตัวเป็นเจ้าของ
      ไปป์ไลน์ขาเข้าของตนเอง ดู Plugin ช่องที่บันเดิลมา
      (เช่น แพ็กเกจ Plugin ของ Microsoft Teams หรือ Google Chat) สำหรับรูปแบบจริง
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="ทดสอบ">
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

    สำหรับ helper การทดสอบที่ใช้ร่วมกัน ดู [การทดสอบ](/th/plugins/sdk-testing)

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
    describeMessageTool และการค้นพบ action
  </Card>
  <Card title="การ resolve เป้าหมาย" icon="crosshair" href="/th/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="helper รันไทม์" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, STT, สื่อ, subagent ผ่าน api.runtime
  </Card>
  <Card title="API ขาเข้าของช่อง" icon="bolt" href="/th/plugins/sdk-channel-inbound">
    วงจรชีวิตเหตุการณ์ขาเข้าที่ใช้ร่วมกัน: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
seam helper ที่บันเดิลมาบางส่วนยังคงมีอยู่สำหรับการบำรุงรักษาและ
ความเข้ากันได้ของ Plugin ที่บันเดิลมา สิ่งเหล่านี้ไม่ใช่รูปแบบที่แนะนำสำหรับ Plugin ช่องใหม่
ควรใช้ subpath ช่อง/ตั้งค่า/ตอบกลับ/รันไทม์แบบทั่วไปจากพื้นผิว SDK
ร่วม เว้นแต่คุณจะดูแลตระกูล Plugin ที่บันเดิลมานั้นโดยตรง
</Note>

## ขั้นตอนถัดไป

- [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) - หาก Plugin ของคุณให้บริการโมเดลด้วย
- [ภาพรวม SDK](/th/plugins/sdk-overview) - อ้างอิง import subpath ทั้งหมด
- [การทดสอบ SDK](/th/plugins/sdk-testing) - ยูทิลิตีการทดสอบและการทดสอบสัญญา
- [Manifest ของ Plugin](/th/plugins/manifest) - schema manifest ทั้งหมด

## ที่เกี่ยวข้อง

- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [Plugin harness ของ Agent](/th/plugins/sdk-agent-harness)
