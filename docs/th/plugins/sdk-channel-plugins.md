---
read_when:
    - คุณกำลังสร้าง Plugin ช่องทางการรับส่งข้อความใหม่
    - คุณต้องการเชื่อมต่อ OpenClaw กับแพลตฟอร์มส่งข้อความ
    - คุณต้องเข้าใจพื้นผิวอะแดปเตอร์ ChannelPlugin
sidebarTitle: Channel Plugins
summary: คู่มือทีละขั้นตอนสำหรับการสร้าง Plugin ช่องทางรับส่งข้อความสำหรับ OpenClaw
title: การสร้าง Plugin ช่องทาง
x-i18n:
    generated_at: "2026-07-02T22:54:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

คู่มือนี้อธิบายขั้นตอนการสร้าง channel plugin ที่เชื่อมต่อ OpenClaw กับแพลตฟอร์มรับส่งข้อความ เมื่อทำเสร็จ คุณจะมีช่องทางที่ใช้งานได้ พร้อมความปลอดภัยของ DM, การจับคู่, การจัดเธรดการตอบกลับ และการส่งข้อความออก

<Info>
  หากคุณยังไม่เคยสร้าง OpenClaw plugin มาก่อน โปรดอ่าน
  [เริ่มต้นใช้งาน](/th/plugins/building-plugins) ก่อน เพื่อทำความเข้าใจโครงสร้างแพ็กเกจ
  และการตั้งค่า manifest พื้นฐาน
</Info>

## การทำงานของ channel plugin

Channel plugin ไม่จำเป็นต้องมีเครื่องมือส่ง/แก้ไข/ตอบสนองเป็นของตัวเอง OpenClaw เก็บเครื่องมือ
`message` ที่ใช้ร่วมกันหนึ่งตัวไว้ใน core Plugin ของคุณรับผิดชอบ:

- **การกำหนดค่า** - การระบุบัญชีและตัวช่วยตั้งค่า
- **ความปลอดภัย** - นโยบาย DM และ allowlist
- **การจับคู่** - โฟลว์อนุมัติผ่าน DM
- **ไวยากรณ์ของเซสชัน** - วิธีที่ id การสนทนาเฉพาะ provider แมปไปยังแชตฐาน, thread id และ fallback ของ parent
- **ขาออก** - การส่งข้อความ, สื่อ และโพลไปยังแพลตฟอร์ม
- **การจัดเธรด** - วิธีจัดเธรดการตอบกลับ
- **การพิมพ์ Heartbeat** - สัญญาณกำลังพิมพ์/ไม่ว่างแบบไม่บังคับสำหรับเป้าหมายการส่ง Heartbeat

Core รับผิดชอบเครื่องมือ message ที่ใช้ร่วมกัน, การต่อสาย prompt, รูปทรง session-key ภายนอก,
การทำบัญชี `:thread:` แบบทั่วไป และ dispatch

Channel plugin ใหม่ควรเปิดเผย adapter `message` ด้วย
`defineChannelMessageAdapter` จาก `openclaw/plugin-sdk/channel-outbound` ด้วย
adapter จะประกาศความสามารถ final-send แบบคงทนที่ native transport รองรับจริง
และชี้การส่งข้อความ/สื่อไปยังฟังก์ชัน transport เดียวกับ adapter `outbound` แบบเดิม
ให้ประกาศความสามารถก็ต่อเมื่อ contract test พิสูจน์ side effect ฝั่ง native และ receipt ที่ส่งกลับแล้วเท่านั้น
สำหรับสัญญา API แบบเต็ม, ตัวอย่าง, capability matrix, กฎ receipt, การ finalize live preview,
นโยบาย receive ack, การทดสอบ และตาราง migration โปรดดู
[API ขาออกของช่องทาง](/th/plugins/sdk-channel-outbound)
หาก adapter `outbound` ที่มีอยู่มีเมธอดส่งและ metadata ความสามารถที่ถูกต้องอยู่แล้ว ให้ใช้
`createChannelMessageAdapterFromOutbound(...)` เพื่อสร้าง adapter `message`
แทนการเขียนสะพานเชื่อมอีกตัวด้วยมือ
การส่งของ adapter ควรส่งค่า `MessageReceipt` กลับ เมื่อโค้ด compatibility
ยังต้องใช้ id แบบเดิม ให้สร้างจาก `listMessageReceiptPlatformIds(...)`
หรือ `resolveMessageReceiptPrimaryId(...)` แทนการเก็บฟิลด์
`messageIds` ขนานกันในโค้ด lifecycle ใหม่
ช่องทางที่รองรับ preview ควรประกาศ `message.live.capabilities` พร้อม
live lifecycle ที่ตนเป็นเจ้าของอย่างตรงตัว เช่น `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` หรือ
`quietFinalization` ช่องทางที่ finalize draft preview ในตำแหน่งเดิมควร
ประกาศ `message.live.finalizer.capabilities` ด้วย เช่น `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` และ
`retainOnAmbiguousFailure` และส่ง logic ของ runtime ผ่าน
`defineFinalizableLivePreviewAdapter(...)` ร่วมกับ
`deliverWithFinalizableLivePreviewAdapter(...)` ให้คงความสามารถเหล่านั้นโดยมีการทดสอบ
`verifyChannelMessageLiveCapabilityAdapterProofs(...)` และ
`verifyChannelMessageLiveFinalizerProofs(...)` รองรับ เพื่อให้พฤติกรรม native preview,
progress, edit, fallback/retention, cleanup และ receipt ไม่คลาดเคลื่อนเงียบ ๆ
ตัวรับขาเข้าที่เลื่อนการ acknowledgement ของแพลตฟอร์มออกไปควรประกาศ
`message.receive.defaultAckPolicy` และ `supportedAckPolicies` แทนการซ่อน
จังหวะ ack ไว้ในสถานะเฉพาะ monitor ให้ครอบคลุมนโยบายที่ประกาศทุกตัวด้วย
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`

ตัวช่วย reply แบบเดิม เช่น `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` และ `recordInboundSessionAndDispatchReply`
ยังคงพร้อมใช้งานสำหรับ dispatcher เพื่อ compatibility อย่าใช้ชื่อเหล่านั้นกับ
โค้ดช่องทางใหม่; plugin ใหม่ควรเริ่มจาก adapter `message`, receipt และ
ตัวช่วย lifecycle รับ/ส่งบน `openclaw/plugin-sdk/channel-outbound`

ช่องทางที่กำลังย้าย authorization ขาเข้าสามารถใช้ subpath ทดลอง
`openclaw/plugin-sdk/channel-ingress-runtime` จาก path รับของ runtime ได้
subpath นี้เก็บการค้นหาแพลตฟอร์มและ side effect ไว้ใน plugin ขณะเดียวกันก็ใช้
การระบุสถานะ allowlist, การตัดสินใจ route/sender/command/event/activation,
diagnostics ที่ปกปิดข้อมูล และการแมป turn-admission ร่วมกัน ให้คงการ normalize
ตัวตนของ plugin ไว้ใน descriptor ที่คุณส่งให้ resolver; อย่า serialize ค่าการจับคู่ดิบ
จากสถานะหรือการตัดสินใจที่ resolve แล้ว ดู
[API ขาเข้าของช่องทาง](/th/plugins/sdk-channel-ingress) สำหรับการออกแบบ API,
ขอบเขตความเป็นเจ้าของ และความคาดหวังด้านการทดสอบ

หากช่องทางของคุณรองรับตัวบ่งชี้การพิมพ์นอกเหนือจากการตอบกลับขาเข้า ให้เปิดเผย
`heartbeat.sendTyping(...)` บน channel plugin Core จะเรียกด้วยเป้าหมายการส่ง
Heartbeat ที่ resolve แล้วก่อนการรันโมเดล Heartbeat จะเริ่ม และใช้ lifecycle
typing keepalive/cleanup ที่ใช้ร่วมกัน เพิ่ม `heartbeat.clearTyping(...)`
เมื่อแพลตฟอร์มต้องมีสัญญาณหยุดแบบชัดเจน

หากช่องทางของคุณเพิ่มพารามิเตอร์ของ message-tool ที่พกแหล่งสื่อ ให้เปิดเผย
ชื่อพารามิเตอร์เหล่านั้นผ่าน `describeMessageTool(...).mediaSourceParams` Core ใช้
รายการชัดเจนนี้สำหรับการ normalize path ของ sandbox และนโยบายการเข้าถึงสื่อขาออก
ดังนั้น plugin จึงไม่ต้องมีกรณีพิเศษใน shared-core สำหรับพารามิเตอร์ avatar,
attachment หรือ cover-image เฉพาะ provider
ควรส่งกลับเป็น map ที่ key ด้วย action เช่น
`{ "set-profile": ["avatarUrl", "avatarPath"] }` เพื่อไม่ให้ action ที่ไม่เกี่ยวข้อง
สืบทอด media args ของ action อื่น array แบบแบนยังใช้งานได้สำหรับพารามิเตอร์ที่
ตั้งใจใช้ร่วมกันกับทุก action ที่เปิดเผย
ช่องทางที่ต้องเปิดเผย URL สาธารณะชั่วคราวสำหรับการ fetch สื่อฝั่งแพลตฟอร์ม
สามารถใช้ `createHostedOutboundMediaStore(...)` จาก
`openclaw/plugin-sdk/outbound-media` ร่วมกับ state store ของ plugin ให้เก็บ
การ parse route ของแพลตฟอร์มและการบังคับใช้ token ไว้ใน channel plugin;
shared helper รับผิดชอบเฉพาะการโหลดสื่อ, metadata การหมดอายุ, แถว chunk และ cleanup

หากช่องทางของคุณต้องการการจัดรูปเฉพาะ provider สำหรับ `message(action="send")`
ให้ใช้ `actions.prepareSendPayload(...)` เป็นหลัก ใส่ native cards, blocks, embeds
หรือข้อมูลคงทนอื่นไว้ใต้ `payload.channelData.<channel>` แล้วให้ core ทำการส่งจริง
ผ่าน adapter outbound/message ใช้ `actions.handleAction(...)` สำหรับการส่งเฉพาะในฐานะ
compatibility fallback สำหรับ payload ที่ไม่สามารถ serialize และ retry ได้เท่านั้น

หากแพลตฟอร์มของคุณเก็บ scope เพิ่มเติมไว้ใน conversation id ให้เก็บการ parse นั้น
ไว้ใน plugin ด้วย `messaging.resolveSessionConversation(...)` นี่คือ hook
มาตรฐานสำหรับแมป `rawId` ไปยัง conversation id ฐาน, thread id แบบไม่บังคับ,
`baseConversationId` แบบชัดเจน และ `parentConversationCandidates` ใด ๆ
เมื่อคุณส่ง `parentConversationCandidates` กลับ ให้จัดลำดับจาก parent ที่แคบที่สุด
ไปยัง conversation ที่กว้างที่สุด/ฐาน

ใช้ `openclaw/plugin-sdk/channel-route` เมื่อโค้ด plugin ต้อง normalize
ฟิลด์ที่คล้าย route, เปรียบเทียบ thread ลูกกับ route ของ parent หรือสร้าง
dedupe key ที่เสถียรจาก `{ channel, to, accountId, threadId }` ตัวช่วยนี้
normalize numeric thread id แบบเดียวกับที่ core ทำ ดังนั้น plugin ควรใช้สิ่งนี้
แทนการเปรียบเทียบ `String(threadId)` แบบเฉพาะกิจ
Plugin ที่มีไวยากรณ์เป้าหมายเฉพาะ provider ควรเปิดเผย
`messaging.resolveOutboundSessionRoute(...)` เพื่อให้ core ได้ตัวตนของ session
และ thread แบบ native ของ provider โดยไม่ต้องใช้ parser shim

Bundled plugin ที่ต้องใช้การ parse แบบเดียวกันก่อน channel registry เริ่มทำงาน
สามารถเปิดเผยไฟล์ระดับบนสุด `session-key-api.ts` พร้อม export
`resolveSessionConversation(...)` ที่ตรงกันได้เช่นกัน Core ใช้ surface ที่ปลอดภัยสำหรับ bootstrap นี้
เฉพาะเมื่อ runtime plugin registry ยังไม่พร้อมใช้งาน

`messaging.resolveParentConversationCandidates(...)` ยังคงพร้อมใช้งานในฐานะ
legacy compatibility fallback เมื่อ plugin ต้องการแค่ parent fallback บน id
ทั่วไป/ดิบ หากมีทั้งสอง hook core จะใช้
`resolveSessionConversation(...).parentConversationCandidates` ก่อน และจะ fallback
ไปที่ `resolveParentConversationCandidates(...)` เฉพาะเมื่อ hook มาตรฐานไม่ให้ค่าเหล่านั้น

## การอนุมัติและความสามารถของช่องทาง

Channel plugin ส่วนใหญ่ไม่จำเป็นต้องมีโค้ดเฉพาะสำหรับการอนุมัติ

- Core เป็นเจ้าของ `/approve` ในแชตเดียวกัน, payload ปุ่มอนุมัติที่ใช้ร่วมกัน, และการส่ง fallback ทั่วไป
- ควรใช้วัตถุ `approvalCapability` เดียวบน channel plugin เมื่อช่องทางต้องมีพฤติกรรมเฉพาะสำหรับการอนุมัติ
- `ChannelPlugin.approvals` ถูกลบแล้ว ให้วางข้อเท็จจริงด้านการส่ง/native/render/auth ของการอนุมัติไว้บน `approvalCapability`
- `plugin.auth` ใช้สำหรับ login/logout เท่านั้น; core จะไม่อ่าน hook การยืนยันตัวตนสำหรับการอนุมัติจากวัตถุนั้นอีกต่อไป
- `approvalCapability.authorizeActorAction` และ `approvalCapability.getActionAvailabilityState` คือ seam มาตรฐานสำหรับ approval-auth
- ใช้ `approvalCapability.getActionAvailabilityState` สำหรับความพร้อมใช้งานของการยืนยันตัวตนการอนุมัติในแชตเดียวกัน ให้ผู้อนุมัติที่กำหนดค่าไว้พร้อมใช้งานสำหรับ `/approve` แม้เมื่อปิดการส่งแบบ native; ให้ใช้สถานะพื้นผิวที่เริ่มต้นแบบ native สำหรับคำแนะนำด้านการส่ง/ตั้งค่าแทน
- หากช่องทางของคุณเปิดเผยการอนุมัติ exec แบบ native ให้ใช้ `approvalCapability.getExecInitiatingSurfaceState` สำหรับสถานะพื้นผิวที่เริ่มต้น/native-client เมื่อแตกต่างจากการยืนยันตัวตนการอนุมัติในแชตเดียวกัน Core ใช้ hook เฉพาะ exec นี้เพื่อแยก `enabled` กับ `disabled`, ตัดสินว่าช่องทางที่เริ่มต้นรองรับการอนุมัติ exec แบบ native หรือไม่, และรวมช่องทางไว้ในคำแนะนำ fallback ของ native-client `createApproverRestrictedNativeApprovalCapability(...)` เติมค่านี้ให้สำหรับกรณีทั่วไป
- ใช้ `outbound.shouldSuppressLocalPayloadPrompt` หรือ `outbound.beforeDeliverPayload` สำหรับพฤติกรรมวงจรชีวิต payload เฉพาะช่องทาง เช่น การซ่อน prompt การอนุมัติในเครื่องที่ซ้ำกัน หรือการส่งตัวบ่งชี้การพิมพ์ก่อนการส่ง
- ใช้ `approvalCapability.delivery` เฉพาะสำหรับการกำหนดเส้นทางการอนุมัติแบบ native หรือการระงับ fallback
- ใช้ `approvalCapability.nativeRuntime` สำหรับข้อเท็จจริงการอนุมัติแบบ native ที่ช่องทางเป็นเจ้าของ ทำให้เป็นแบบ lazy บน entrypoint ช่องทางที่ร้อนด้วย `createLazyChannelApprovalNativeRuntimeAdapter(...)` ซึ่งสามารถ import โมดูล runtime ของคุณเมื่อจำเป็น ขณะยังให้ core ประกอบวงจรชีวิตการอนุมัติได้
- ใช้ `approvalCapability.render` เฉพาะเมื่อช่องทางต้องการ payload การอนุมัติแบบกำหนดเองจริง ๆ แทน renderer ที่ใช้ร่วมกัน
- ใช้ `approvalCapability.describeExecApprovalSetup` เมื่อช่องทางต้องการให้คำตอบใน path ที่ปิดใช้งานอธิบาย knob การกำหนดค่าที่จำเป็นอย่างแม่นยำเพื่อเปิดใช้การอนุมัติ exec แบบ native hook ได้รับ `{ channel, channelLabel, accountId }`; ช่องทางแบบ named-account ควร render path ที่จำกัดตามบัญชี เช่น `channels.<channel>.accounts.<id>.execApprovals.*` แทนค่า default ระดับบนสุด
- ใช้ `approvalCapability.describePluginApprovalSetup` เมื่อคำแนะนำความล้มเหลวของการอนุมัติ Plugin ปลอดภัยที่จะแสดงสำหรับความล้มเหลวแบบ no-route และ timeout ของการอนุมัติ Plugin `createApproverRestrictedNativeApprovalCapability(...)` จะไม่อนุมานสิ่งนี้จาก `describeExecApprovalSetup`; ส่ง helper เดียวกันอย่างชัดเจนเฉพาะเมื่อการอนุมัติ Plugin และ exec ใช้การตั้งค่า native แบบเดียวกันจริง ๆ
- หากช่องทางสามารถอนุมานตัวตน DM ที่เสถียรแบบคล้ายเจ้าของจาก config ที่มีอยู่ ให้ใช้ `createResolvedApproverActionAuthAdapter` จาก `openclaw/plugin-sdk/approval-runtime` เพื่อจำกัด `/approve` ในแชตเดียวกันโดยไม่เพิ่ม logic เฉพาะการอนุมัติลงใน core
- หาก auth การอนุมัติแบบกำหนดเองตั้งใจอนุญาตเฉพาะ fallback ในแชตเดียวกัน ให้คืน `markImplicitSameChatApprovalAuthorization({ authorized: true })` จาก `openclaw/plugin-sdk/approval-auth-runtime`; มิฉะนั้น core จะถือว่าผลลัพธ์เป็นการอนุญาตผู้อนุมัติแบบชัดเจน
- หาก callback แบบ native ที่ช่องทางเป็นเจ้าของ resolve การอนุมัติโดยตรง ให้ใช้ `isImplicitSameChatApprovalAuthorization(...)` ก่อน resolve เพื่อให้ fallback แบบ implicit ยังคงผ่านการอนุญาต actor ปกติของช่องทาง
- หากช่องทางต้องการการส่งการอนุมัติแบบ native ให้รักษา code ของช่องทางให้เน้นที่การ normalize target พร้อมข้อเท็จจริงด้าน transport/presentation ใช้ `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, และ `createApproverRestrictedNativeApprovalCapability` จาก `openclaw/plugin-sdk/approval-runtime` วางข้อเท็จจริงเฉพาะช่องทางไว้หลัง `approvalCapability.nativeRuntime` โดยเหมาะที่สุดผ่าน `createChannelApprovalNativeRuntimeAdapter(...)` หรือ `createLazyChannelApprovalNativeRuntimeAdapter(...)` เพื่อให้ core ประกอบ handler และเป็นเจ้าของการกรองคำขอ, routing, dedupe, expiry, การสมัคร Gateway, และการแจ้งว่า routed elsewhere ได้ `nativeRuntime` ถูกแยกเป็น seam ย่อยไม่กี่ส่วน:
- ใช้ `createNativeApprovalChannelRouteGates` จาก `openclaw/plugin-sdk/approval-native-runtime` เมื่อช่องทางรองรับทั้งการส่งแบบ native จาก session-origin และ target การ forward การอนุมัติแบบชัดเจน helper รวมศูนย์การเลือก config การอนุมัติ, การจัดการ `mode`, ตัวกรอง agent/session, การผูกบัญชี, การจับคู่ session-target, และการจับคู่ target-list ขณะที่ caller ยังเป็นเจ้าของ channel id, mode การ forward เริ่มต้น, การ lookup บัญชี, การตรวจสอบว่า transport เปิดใช้งาน, การ normalize target, และการ resolve target ของ turn-source อย่าใช้เพื่อสร้างค่า default นโยบายช่องทางที่ core เป็นเจ้าของ; ส่ง mode default ที่บันทึกไว้ในเอกสารของช่องทางอย่างชัดเจน
- `createChannelNativeOriginTargetResolver` ใช้ตัวจับคู่ channel-route ที่ใช้ร่วมกันโดย default สำหรับ target `{ to, accountId, threadId }` ส่ง `targetsMatch` เฉพาะเมื่อช่องทางมีกฎความเทียบเท่าเฉพาะ provider เช่น การจับคู่ prefix timestamp ของ Slack
- ส่ง `normalizeTargetForMatch` ไปยัง `createChannelNativeOriginTargetResolver` เมื่อช่องทางต้อง canonicalize provider ids ก่อนที่ตัวจับคู่ route default หรือ callback `targetsMatch` แบบกำหนดเองจะทำงาน โดยยังคง target เดิมไว้สำหรับการส่ง ใช้ `normalizeTarget` เฉพาะเมื่อ target การส่งที่ resolve แล้วเองควรถูก canonicalize
- `availability` - บัญชีถูกกำหนดค่าแล้วหรือไม่ และคำขอควรถูกจัดการหรือไม่
- `presentation` - map view model การอนุมัติที่ใช้ร่วมกันเป็น payload native แบบ pending/resolved/expired หรือ action สุดท้าย
- `transport` - เตรียม target พร้อมส่ง/อัปเดต/ลบข้อความการอนุมัติแบบ native
- `interactions` - hook bind/unbind/clear-action แบบไม่บังคับสำหรับปุ่มหรือ reaction แบบ native พร้อม hook `cancelDelivered` แบบไม่บังคับ ใช้ `cancelDelivered` เมื่อ `deliverPending` ลงทะเบียนสถานะในกระบวนการหรือสถานะถาวร (เช่นที่เก็บ target ของ reaction) เพื่อให้ปล่อยสถานะนั้นได้หากการหยุด handler ยกเลิกการส่งก่อน `bindPending` ทำงาน หรือเมื่อ `bindPending` ไม่คืน handle
- `observe` - hook diagnostics การส่งแบบไม่บังคับ
- หากช่องทางต้องการวัตถุที่ runtime เป็นเจ้าของ เช่น client, token, Bolt app, หรือ webhook receiver ให้ลงทะเบียนผ่าน `openclaw/plugin-sdk/channel-runtime-context` registry runtime-context ทั่วไปช่วยให้ core bootstrap handler ที่ขับเคลื่อนด้วย capability จากสถานะ startup ของช่องทางโดยไม่เพิ่ม wrapper glue เฉพาะการอนุมัติ
- ใช้ `createChannelApprovalHandler` หรือ `createChannelNativeApprovalRuntime` ระดับต่ำกว่าเฉพาะเมื่อ seam ที่ขับเคลื่อนด้วย capability ยังแสดงออกได้ไม่เพียงพอ
- ช่องทางการอนุมัติแบบ native ต้อง route ทั้ง `accountId` และ `approvalKind` ผ่าน helper เหล่านั้น `accountId` ทำให้นโยบายการอนุมัติแบบหลายบัญชีจำกัดอยู่กับบัญชี bot ที่ถูกต้อง และ `approvalKind` ทำให้พฤติกรรมการอนุมัติ exec เทียบกับ Plugin พร้อมใช้งานกับช่องทางโดยไม่ต้องมี branch ที่ hardcode ใน core
- ตอนนี้ Core เป็นเจ้าของ notice การ reroute การอนุมัติด้วย Channel plugin ไม่ควรส่งข้อความ follow-up ของตนเองว่า "approval went to DMs / another channel" จาก `createChannelNativeApprovalRuntime`; ให้เปิดเผย routing origin + approver-DM ที่ถูกต้องผ่าน helper capability การอนุมัติที่ใช้ร่วมกัน และให้ core รวบรวมการส่งจริงก่อนโพสต์ notice กลับไปยังแชตที่เริ่มต้น
- รักษาชนิด id การอนุมัติที่ส่งแล้วตั้งแต่ต้นจนจบ Native client ไม่ควร
  เดาหรือเขียน routing การอนุมัติ exec เทียบกับ Plugin ใหม่จากสถานะภายในช่องทาง
- ชนิดการอนุมัติที่แตกต่างกันสามารถตั้งใจเปิดเผยพื้นผิว native ที่แตกต่างกันได้
  ตัวอย่าง bundled ปัจจุบัน:
  - Slack คง routing การอนุมัติแบบ native ให้พร้อมใช้งานสำหรับทั้ง exec และ Plugin ids
  - Matrix คง routing DM/channel แบบ native และ UX reaction เดียวกันสำหรับการอนุมัติ exec
    และ Plugin ขณะที่ยังอนุญาตให้ auth แตกต่างตามชนิดการอนุมัติ
- `createApproverRestrictedNativeApprovalAdapter` ยังมีอยู่ในฐานะ wrapper เพื่อความเข้ากันได้ แต่ code ใหม่ควรใช้ capability builder และเปิดเผย `approvalCapability` บน plugin

สำหรับ entrypoint ช่องทางที่ร้อน ควรใช้ subpath runtime ที่แคบกว่าเมื่อคุณต้องการเพียง
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

เช่นเดียวกัน ควรใช้ `openclaw/plugin-sdk/setup-runtime`,
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
  `createSetupInputPresenceValidator`), output ของ lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries`, และ builder ของ setup-proxy
  ที่ delegate แล้ว
- `openclaw/plugin-sdk/setup-runtime` รวม seam adapter ที่รับรู้ env สำหรับ
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` ครอบคลุม builder setup แบบ optional-install
  พร้อม primitive ที่ปลอดภัยสำหรับ setup อีกไม่กี่ตัว:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

หากช่องทางของคุณรองรับ setup หรือ auth ที่ขับเคลื่อนด้วย env และ flow startup/config
ทั่วไปควรรู้ชื่อ env เหล่านั้นก่อน runtime โหลด ให้ประกาศใน
manifest ของ plugin ด้วย `channelEnvVars` เก็บ `envVars` ของ runtime ช่องทางหรือ
ค่าคงที่ภายในไว้สำหรับข้อความที่แสดงต่อ operator เท่านั้น

หากช่องทางของคุณสามารถปรากฏใน `status`, `channels list`, `channels status`, หรือ
การสแกน SecretRef ก่อนที่ runtime ของ plugin จะเริ่ม ให้เพิ่ม `openclaw.setupEntry` ใน
`package.json` entrypoint นั้นควรปลอดภัยต่อการ import ใน path คำสั่งแบบ read-only
และควรคืน metadata ของช่องทาง, adapter config ที่ปลอดภัยสำหรับ setup, adapter สถานะ,
และ metadata target ความลับของช่องทางที่จำเป็นสำหรับสรุปเหล่านั้น อย่า
เริ่ม client, listener, หรือ transport runtime จาก setup entry

รักษา path import ของ entry ช่องทางหลักให้แคบด้วย Discovery สามารถประเมิน
entry และโมดูล channel plugin เพื่อลงทะเบียน capability โดยไม่ activate
ช่องทาง ไฟล์เช่น `channel-plugin-api.ts` ควร export วัตถุ channel
plugin โดยไม่ import wizard setup, transport client, socket
listener, subprocess launcher, หรือโมดูล startup ของบริการ วางชิ้นส่วน runtime
เหล่านั้นไว้ในโมดูลที่โหลดจาก `registerFull(...)`, runtime setter, หรือ adapter
capability แบบ lazy

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, และ
`splitSetupEntries`

- ใช้ seam `openclaw/plugin-sdk/setup` ที่กว้างกว่าเฉพาะเมื่อคุณต้องการ
  helper setup/config ที่ใช้ร่วมกันและหนักกว่า เช่น
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

หากช่องทางของคุณต้องการเพียงโฆษณาว่า "install this plugin first" ในพื้นผิว
setup ให้ใช้ `createOptionalChannelSetupSurface(...)` adapter/wizard ที่สร้างขึ้น
จะ fail closed ต่อการเขียน config และการ finalize และใช้ข้อความ install-required
เดียวกันซ้ำทั่ว validation, finalize, และข้อความ docs-link

สำหรับ path ช่องทางร้อนอื่น ๆ ควรใช้ helper ที่แคบแทนพื้นผิว legacy
ที่กว้างกว่า:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` และ
  `openclaw/plugin-sdk/account-helpers` สำหรับการกำหนดค่าหลายบัญชีและ
  การถอยกลับไปยังบัญชีเริ่มต้น
- `openclaw/plugin-sdk/inbound-envelope` และ
  `openclaw/plugin-sdk/channel-inbound` สำหรับเส้นทาง/ซองขาเข้าและ
  การเชื่อมต่อเพื่อบันทึกและจัดส่ง
- `openclaw/plugin-sdk/channel-targets` สำหรับตัวช่วยแยกวิเคราะห์เป้าหมาย
- `openclaw/plugin-sdk/outbound-media` สำหรับการโหลดสื่อ และ
  `openclaw/plugin-sdk/channel-outbound` สำหรับ delegate ของตัวตน/การส่งขาออก
  และการวางแผน payload
- `buildThreadAwareOutboundSessionRoute(...)` จาก
  `openclaw/plugin-sdk/channel-core` เมื่อเส้นทางขาออกควรรักษา
  `replyToId`/`threadId` ที่ระบุชัดเจน หรือกู้คืนเซสชัน `:thread:` ปัจจุบัน
  หลังจากคีย์เซสชันฐานยังคงตรงกัน Plugin ผู้ให้บริการสามารถแทนที่
  ลำดับความสำคัญ ลักษณะการทำงานของ suffix และการปรับ thread id ให้เป็นมาตรฐาน
  เมื่อแพลตฟอร์มของตนมีความหมายเชิงการส่ง thread แบบ native
- `openclaw/plugin-sdk/thread-bindings-runtime` สำหรับวงจรชีวิตของ thread-binding
  และการลงทะเบียน adapter
- `openclaw/plugin-sdk/agent-media-payload` เฉพาะเมื่อยังต้องใช้เลย์เอาต์ฟิลด์ payload
  แบบเดิมของ agent/media
- `openclaw/plugin-sdk/telegram-command-config` สำหรับการปรับ custom-command ของ Telegram
  ให้เป็นมาตรฐาน การตรวจสอบรายการซ้ำ/ความขัดแย้ง และสัญญาการกำหนดค่า command
  ที่เสถียรเมื่อถอยกลับ

ช่องทางที่ใช้เฉพาะ auth มักหยุดที่เส้นทางเริ่มต้นได้: แกนหลักจัดการการอนุมัติ และ Plugin เพียงเปิดเผยความสามารถขาออก/auth ช่องทางอนุมัติแบบ native เช่น Matrix, Slack, Telegram และทรานสปอร์ตแชตแบบกำหนดเองควรใช้ตัวช่วย native ที่ใช้ร่วมกัน แทนการสร้างวงจรชีวิตการอนุมัติเอง

## นโยบายการ mention ขาเข้า

แยกการจัดการ mention ขาเข้าเป็นสองชั้น:

- การรวบรวมหลักฐานที่ Plugin เป็นเจ้าของ
- การประเมินนโยบายที่ใช้ร่วมกัน

ใช้ `openclaw/plugin-sdk/channel-mention-gating` สำหรับการตัดสินใจตาม mention-policy
ใช้ `openclaw/plugin-sdk/channel-inbound` เฉพาะเมื่อคุณต้องใช้ barrel ตัวช่วยขาเข้า
ที่กว้างกว่า

เหมาะกับตรรกะภายใน Plugin:

- การตรวจจับ reply-to-bot
- การตรวจจับ quoted-bot
- การตรวจสอบการมีส่วนร่วมใน thread
- การยกเว้น service/system-message
- แคช native ของแพลตฟอร์มที่จำเป็นเพื่อพิสูจน์การมีส่วนร่วมของบอต

เหมาะกับตัวช่วยที่ใช้ร่วมกัน:

- `requireMention`
- ผลลัพธ์ mention ที่ระบุชัดเจน
- allowlist ของ mention โดยนัย
- การข้าม command
- การตัดสินใจข้ามขั้นสุดท้าย

โฟลว์ที่แนะนำ:

1. คำนวณข้อเท็จจริง mention ภายในเครื่อง
2. ส่งข้อเท็จจริงเหล่านั้นเข้าไปใน `resolveInboundMentionDecision({ facts, policy })`
3. ใช้ `decision.effectiveWasMentioned`, `decision.shouldBypassMention` และ `decision.shouldSkip` ใน gate ขาเข้าของคุณ

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

`api.runtime.channel.mentions` เปิดเผยตัวช่วย mention ที่ใช้ร่วมกันชุดเดียวกันสำหรับ
Plugin ช่องทางแบบ bundled ที่พึ่งพาการฉีด runtime อยู่แล้ว:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

หากคุณต้องใช้เฉพาะ `implicitMentionKindWhen` และ
`resolveInboundMentionDecision` ให้นำเข้าจาก
`openclaw/plugin-sdk/channel-mention-gating` เพื่อหลีกเลี่ยงการโหลดตัวช่วย runtime
ขาเข้าที่ไม่เกี่ยวข้อง

ใช้ `resolveInboundMentionDecision({ facts, policy })` สำหรับ mention gating

## บทแนะนำทีละขั้น

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    สร้างไฟล์ Plugin มาตรฐาน ฟิลด์ `channel` ใน `package.json` คือสิ่งที่ทำให้สิ่งนี้เป็น Plugin ช่องทาง สำหรับพื้นผิว metadata ของแพ็กเกจทั้งหมด
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

    `configSchema` ตรวจสอบ `plugins.entries.acme-chat.config` ใช้สำหรับ
    การตั้งค่าที่ Plugin เป็นเจ้าของซึ่งไม่ใช่การกำหนดค่าบัญชีช่องทาง `channelConfigs`
    ตรวจสอบ `channels.acme-chat` และเป็นแหล่ง cold-path ที่ใช้โดย schema การกำหนดค่า
    การตั้งค่า และพื้นผิว UI ก่อนที่ runtime ของ Plugin จะโหลด

  </Step>

  <Step title="Build the channel plugin object">
    อินเทอร์เฟซ `ChannelPlugin` มีพื้นผิว adapter ที่เลือกใช้ได้หลายรายการ เริ่มจาก
    ขั้นต่ำสุด - `id` และ `setup` - แล้วเพิ่ม adapter ตามที่คุณต้องใช้

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

    สำหรับช่องทางที่ยอมรับทั้งคีย์ DM ระดับบนแบบ canonical และคีย์แบบซ้อนเดิม ให้ใช้ตัวช่วยจาก `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` และ `normalizeChannelDmPolicy` จะคงค่าภายในบัญชีให้อยู่ก่อนค่าระดับ root ที่สืบทอดมา จับคู่ resolver เดียวกันกับการซ่อมแซมของ doctor ผ่าน `normalizeLegacyDmAliases` เพื่อให้ runtime และ migration อ่านสัญญาเดียวกัน

    <Accordion title="What createChatChannelPlugin does for you">
      แทนที่จะ implement อินเทอร์เฟซ adapter ระดับต่ำด้วยตัวเอง คุณส่งตัวเลือกแบบประกาศเข้าไป
      และ builder จะประกอบสิ่งเหล่านั้น:

      | ตัวเลือก | สิ่งที่เชื่อมต่อ |
      | --- | --- |
      | `security.dm` | resolver ความปลอดภัย DM แบบ scoped จากฟิลด์การกำหนดค่า |
      | `pairing.text` | โฟลว์การจับคู่ DM แบบข้อความพร้อมการแลกเปลี่ยนโค้ด |
      | `threading` | resolver ของโหมด reply-to (แบบคงที่, scoped ตามบัญชี หรือกำหนดเอง) |
      | `outbound.attachedResults` | ฟังก์ชันส่งที่คืนค่า metadata ของผลลัพธ์ (message ID) |

      คุณยังสามารถส่งอ็อบเจ็กต์ adapter แบบ raw แทนตัวเลือกแบบประกาศได้
      หากคุณต้องการควบคุมทั้งหมด

      Adapter ขาออกแบบ raw อาจกำหนดฟังก์ชัน `chunker(text, limit, ctx)` ได้
      `ctx.formatting` ที่เป็นตัวเลือกจะส่งต่อการตัดสินใจด้านการจัดรูปแบบในเวลาส่ง
      เช่น `maxLinesPerMessage`; ให้นำไปใช้ก่อนส่ง เพื่อให้ reply threading
      และขอบเขต chunk ถูกแก้ครั้งเดียวโดยการส่งขาออกที่ใช้ร่วมกัน
      บริบทการส่งยังมี `replyToIdSource` (`implicit` หรือ `explicit`)
      เมื่อเป้าหมาย native reply ถูกแก้แล้ว เพื่อให้ตัวช่วย payload สามารถรักษา
      แท็ก reply ที่ระบุชัดเจนโดยไม่ใช้ช่อง reply โดยนัยแบบใช้ครั้งเดียว
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
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

    ใส่ตัวอธิบาย CLI ที่ช่องทางเป็นเจ้าของไว้ใน `registerCliMetadata(...)` เพื่อให้ OpenClaw
    แสดงในความช่วยเหลือระดับรูทได้โดยไม่ต้องเปิดใช้งานรันไทม์ช่องทางแบบเต็ม
    ขณะที่การโหลดแบบเต็มตามปกติยังคงรับตัวอธิบายเดียวกันไปใช้สำหรับการลงทะเบียนคำสั่งจริง
    เก็บ `registerFull(...)` ไว้สำหรับงานที่ใช้เฉพาะรันไทม์
    หาก `registerFull(...)` ลงทะเบียนเมธอด RPC ของ Gateway ให้ใช้
    คำนำหน้าที่เฉพาะกับ Plugin เนมสเปซผู้ดูแลระบบหลัก (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ยังคงสงวนไว้และจะ
    resolve เป็น `operator.admin` เสมอ
    `defineChannelPluginEntry` จัดการการแยกโหมดการลงทะเบียนให้โดยอัตโนมัติ ดู
    [จุดเริ่มต้น](/th/plugins/sdk-entrypoints#definechannelpluginentry) สำหรับตัวเลือกทั้งหมด.

  </Step>

  <Step title="Add a setup entry">
    สร้าง `setup-entry.ts` สำหรับการโหลดแบบเบาระหว่างการเริ่มใช้งาน:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw โหลดไฟล์นี้แทนจุดเริ่มต้นแบบเต็มเมื่อช่องทางถูกปิดใช้งาน
    หรือยังไม่ได้กำหนดค่า วิธีนี้หลีกเลี่ยงการดึงโค้ดรันไทม์ขนาดใหญ่เข้ามาระหว่างโฟลว์การตั้งค่า
    ดูรายละเอียดที่ [การตั้งค่าและการกำหนดค่า](/th/plugins/sdk-setup#setup-entry).

    ช่องทางในเวิร์กสเปซที่บันเดิลมาซึ่งแยกเอ็กซ์พอร์ตที่ปลอดภัยสำหรับการตั้งค่าไว้ในโมดูล
    sidecar สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก
    `openclaw/plugin-sdk/channel-entry-contract` เมื่อจำเป็นต้องมี
    ตัวตั้งค่ารันไทม์เวลา setup ที่ชัดเจนด้วย

  </Step>

  <Step title="Handle inbound messages">
    Plugin ของคุณต้องรับข้อความจากแพลตฟอร์มและส่งต่อไปยัง
    OpenClaw รูปแบบทั่วไปคือ Webhook ที่ตรวจสอบคำขอและ
    dispatch ผ่านตัวจัดการขาเข้าของช่องทางของคุณ:

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
      ไปป์ไลน์ขาเข้าของตนเอง ดู Plugin ช่องทางที่บันเดิลมา
      (เช่นแพ็กเกจ Plugin ของ Microsoft Teams หรือ Google Chat) สำหรับรูปแบบจริง
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
เขียนเทสต์แบบวางร่วมกันใน `src/channel.test.ts`:

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

    สำหรับตัวช่วยทดสอบที่ใช้ร่วมกัน ดู [การทดสอบ](/th/plugins/sdk-testing).

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
    โหมดตอบกลับแบบคงที่ แบบผูกกับบัญชี หรือแบบกำหนดเอง
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/th/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool และการค้นพบ action
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/th/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, STT, สื่อ, subagent ผ่าน api.runtime
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/th/plugins/sdk-channel-inbound">
    วงจรชีวิตอีเวนต์ขาเข้าที่ใช้ร่วมกัน: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
seam ตัวช่วยที่บันเดิลมาบางรายการยังคงมีอยู่สำหรับการบำรุงรักษาและ
ความเข้ากันได้ของ bundled-plugin แต่ไม่ใช่รูปแบบที่แนะนำสำหรับ Plugin ช่องทางใหม่
ให้ใช้ subpath ช่องทาง/setup/reply/runtime แบบทั่วไปจากพื้นผิว SDK ร่วม
เว้นแต่คุณจะบำรุงรักษาตระกูล Plugin ที่บันเดิลมานั้นโดยตรง
</Note>

## ขั้นตอนถัดไป

- [Provider Plugins](/th/plugins/sdk-provider-plugins) - หาก Plugin ของคุณให้บริการโมเดลด้วย
- [ภาพรวม SDK](/th/plugins/sdk-overview) - เอกสารอ้างอิงการ import subpath ฉบับเต็ม
- [การทดสอบ SDK](/th/plugins/sdk-testing) - ยูทิลิตีทดสอบและเทสต์สัญญา
- [Plugin Manifest](/th/plugins/manifest) - schema ของ manifest ฉบับเต็ม

## ที่เกี่ยวข้อง

- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [Plugin ฮาร์เนสของ Agent](/th/plugins/sdk-agent-harness)
