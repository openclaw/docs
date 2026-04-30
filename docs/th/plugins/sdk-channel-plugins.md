---
read_when:
    - คุณกำลังสร้าง Plugin ช่องทางการรับส่งข้อความใหม่
    - คุณต้องการเชื่อมต่อ OpenClaw กับแพลตฟอร์มรับส่งข้อความ
    - คุณจำเป็นต้องเข้าใจส่วนติดต่อของอะแดปเตอร์ ChannelPlugin
sidebarTitle: Channel Plugins
summary: คู่มือทีละขั้นตอนสำหรับการสร้าง Plugin ช่องทางการรับส่งข้อความสำหรับ OpenClaw
title: การสร้าง Plugin สำหรับช่องทาง
x-i18n:
    generated_at: "2026-04-30T10:07:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 068cd797f7761efa54f4fdeb7cb4aa784ceace959f1af12bc549c16ed2776b72
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

คู่มือนี้อธิบายการสร้าง Plugin ช่องทางที่เชื่อมต่อ OpenClaw กับ
แพลตฟอร์มรับส่งข้อความ เมื่อจบแล้ว คุณจะมีช่องทางที่ใช้งานได้ พร้อมการรักษาความปลอดภัยของ DM,
การจับคู่, การจัดเธรดของคำตอบกลับ และการส่งข้อความขาออก

<Info>
  หากคุณยังไม่เคยสร้าง Plugin OpenClaw มาก่อน ให้อ่าน
  [เริ่มต้นใช้งาน](/th/plugins/building-plugins) ก่อน เพื่อดูโครงสร้างแพ็กเกจพื้นฐาน
  และการตั้งค่า manifest
</Info>

## Plugin ช่องทางทำงานอย่างไร

Plugin ช่องทางไม่จำเป็นต้องมีเครื่องมือส่ง/แก้ไข/ตอบสนองของตัวเอง OpenClaw เก็บเครื่องมือ
`message` ที่ใช้ร่วมกันไว้หนึ่งตัวใน core Plugin ของคุณรับผิดชอบ:

- **การกำหนดค่า** — การระบุบัญชีและตัวช่วยตั้งค่า
- **ความปลอดภัย** — นโยบาย DM และ allowlist
- **การจับคู่** — โฟลว์อนุมัติผ่าน DM
- **ไวยากรณ์เซสชัน** — วิธีที่ id การสนทนาเฉพาะผู้ให้บริการแมปกับแชตฐาน, id เธรด และ parent fallback
- **ขาออก** — การส่งข้อความ, สื่อ และโพลไปยังแพลตฟอร์ม
- **การจัดเธรด** — วิธีจัดเธรดคำตอบกลับ
- **การพิมพ์ Heartbeat** — สัญญาณกำลังพิมพ์/ไม่ว่างแบบเลือกได้สำหรับเป้าหมายการส่ง Heartbeat

Core รับผิดชอบเครื่องมือ message ที่ใช้ร่วมกัน, การเชื่อม prompt, รูปร่าง session-key ชั้นนอก,
การทำบัญชี `:thread:` แบบทั่วไป และการ dispatch

หากช่องทางของคุณรองรับตัวบ่งชี้การพิมพ์นอกเหนือจากคำตอบกลับขาเข้า ให้เปิดเผย
`heartbeat.sendTyping(...)` บน Plugin ช่องทาง Core จะเรียกใช้พร้อมเป้าหมายการส่ง Heartbeat
ที่ resolve แล้วก่อนที่การรันโมเดล Heartbeat จะเริ่ม และใช้ lifecycle การ keepalive/cleanup
ของการพิมพ์ที่ใช้ร่วมกัน เพิ่ม `heartbeat.clearTyping(...)`
เมื่อแพลตฟอร์มต้องการสัญญาณหยุดแบบชัดเจน

หากช่องทางของคุณเพิ่มพารามิเตอร์ของเครื่องมือ message ที่มีแหล่งที่มาของสื่อ ให้เปิดเผย
ชื่อพารามิเตอร์เหล่านั้นผ่าน `describeMessageTool(...).mediaSourceParams` Core ใช้
รายการที่ชัดเจนนี้สำหรับการทำให้ path ของ sandbox เป็นปกติและนโยบายการเข้าถึงสื่อขาออก
ดังนั้น Plugin จึงไม่ต้องมีกรณีพิเศษใน shared-core สำหรับพารามิเตอร์ avatar, attachment หรือ cover-image
เฉพาะผู้ให้บริการ
ควรคืนค่า map ตามคีย์ action เช่น
`{ "set-profile": ["avatarUrl", "avatarPath"] }` เพื่อไม่ให้ action ที่ไม่เกี่ยวข้อง
สืบทอดอาร์กิวเมนต์สื่อของ action อื่น array แบบแบนยังใช้ได้สำหรับพารามิเตอร์ที่
ตั้งใจให้ใช้ร่วมกันในทุก action ที่เปิดเผย

หากแพลตฟอร์มของคุณเก็บขอบเขตเพิ่มเติมไว้ใน id การสนทนา ให้เก็บการ parse นั้น
ไว้ใน Plugin ด้วย `messaging.resolveSessionConversation(...)` นี่คือ hook
มาตรฐานสำหรับแมป `rawId` ไปยัง id การสนทนาฐาน, id เธรดแบบเลือกได้,
`baseConversationId` ที่ชัดเจน และ `parentConversationCandidates` ใดๆ
เมื่อคุณคืนค่า `parentConversationCandidates` ให้เรียงจาก parent ที่แคบที่สุด
ไปยังการสนทนาที่กว้างที่สุด/ฐาน

ใช้ `openclaw/plugin-sdk/channel-route` เมื่อโค้ด Plugin ต้อง normalize
ฟิลด์ที่คล้าย route, เปรียบเทียบเธรดลูกกับ route parent, หรือสร้างคีย์ dedupe
ที่เสถียรจาก `{ channel, to, accountId, threadId }` ตัวช่วยนี้ normalize id เธรดแบบตัวเลข
แบบเดียวกับ core ดังนั้น Plugin ควรใช้แทนการเปรียบเทียบ `String(threadId)` แบบเฉพาะกิจ
Plugin ที่มีไวยากรณ์เป้าหมายเฉพาะผู้ให้บริการสามารถ inject parser ของตนเข้าใน
`resolveChannelRouteTargetWithParser(...)` และยังได้รูปร่าง route target และ
ความหมาย thread fallback เดียวกับที่ core ใช้

Plugin ที่มาพร้อมชุดซึ่งต้องการการ parse เดียวกันก่อนที่ registry ช่องทางจะบูต
ยังสามารถเปิดเผยไฟล์ `session-key-api.ts` ระดับบนพร้อม export
`resolveSessionConversation(...)` ที่ตรงกัน Core ใช้พื้นผิวที่ปลอดภัยต่อ bootstrap นี้
เฉพาะเมื่อ runtime plugin registry ยังไม่พร้อมใช้งาน

`messaging.resolveParentConversationCandidates(...)` ยังคงพร้อมใช้งานเป็น
fallback ความเข้ากันได้แบบ legacy เมื่อ Plugin ต้องการเพียง parent fallback บน id ทั่วไป/raw
หากทั้งสอง hook มีอยู่ Core จะใช้
`resolveSessionConversation(...).parentConversationCandidates` ก่อน และ fallback ไปที่
`resolveParentConversationCandidates(...)` เฉพาะเมื่อ hook มาตรฐานไม่ได้ระบุไว้

## การอนุมัติและความสามารถของช่องทาง

Plugin ช่องทางส่วนใหญ่ไม่จำเป็นต้องมีโค้ดเฉพาะสำหรับการอนุมัติ

- Core รับผิดชอบ `/approve` ในแชตเดียวกัน, payload ปุ่มอนุมัติที่ใช้ร่วมกัน และการส่ง fallback ทั่วไป
- ควรใช้ object `approvalCapability` หนึ่งตัวบน Plugin ช่องทางเมื่อช่องทางต้องการพฤติกรรมเฉพาะการอนุมัติ
- `ChannelPlugin.approvals` ถูกนำออกแล้ว ให้วางข้อเท็จจริงด้านการส่ง/native/render/auth ของการอนุมัติไว้บน `approvalCapability`
- `plugin.auth` ใช้สำหรับ login/logout เท่านั้น; core ไม่อ่าน hook auth การอนุมัติจาก object นั้นอีกต่อไป
- `approvalCapability.authorizeActorAction` และ `approvalCapability.getActionAvailabilityState` คือ seam auth การอนุมัติมาตรฐาน
- ใช้ `approvalCapability.getActionAvailabilityState` สำหรับความพร้อมใช้งานของ auth การอนุมัติในแชตเดียวกัน
- หากช่องทางของคุณเปิดเผยการอนุมัติ exec แบบ native ให้ใช้ `approvalCapability.getExecInitiatingSurfaceState` สำหรับสถานะ initiating-surface/native-client เมื่อแตกต่างจาก auth การอนุมัติในแชตเดียวกัน Core ใช้ hook เฉพาะ exec นี้เพื่อแยก `enabled` กับ `disabled`, ตัดสินว่าช่องทางต้นทางรองรับการอนุมัติ exec แบบ native หรือไม่ และรวมช่องทางไว้ในคำแนะนำ fallback ของ native-client `createApproverRestrictedNativeApprovalCapability(...)` เติมส่วนนี้ให้สำหรับกรณีทั่วไป
- ใช้ `outbound.shouldSuppressLocalPayloadPrompt` หรือ `outbound.beforeDeliverPayload` สำหรับพฤติกรรม lifecycle ของ payload เฉพาะช่องทาง เช่น ซ่อน prompt การอนุมัติ local ที่ซ้ำกัน หรือส่งตัวบ่งชี้การพิมพ์ก่อนการส่ง
- ใช้ `approvalCapability.delivery` เฉพาะสำหรับการ route การอนุมัติแบบ native หรือการ suppress fallback
- ใช้ `approvalCapability.nativeRuntime` สำหรับข้อเท็จจริงการอนุมัติแบบ native ที่ช่องทางเป็นเจ้าของ เก็บให้ lazy บน entrypoint ช่องทางที่ร้อนด้วย `createLazyChannelApprovalNativeRuntimeAdapter(...)` ซึ่งสามารถ import โมดูล runtime ของคุณตามต้องการ โดยยังให้ core ประกอบ lifecycle การอนุมัติได้
- ใช้ `approvalCapability.render` เฉพาะเมื่อช่องทางต้องการ payload การอนุมัติแบบกำหนดเองจริงๆ แทน renderer ที่ใช้ร่วมกัน
- ใช้ `approvalCapability.describeExecApprovalSetup` เมื่อช่องทางต้องการให้คำตอบใน path ที่ disabled อธิบาย knob การกำหนดค่าที่แน่นอนซึ่งจำเป็นต่อการเปิดใช้การอนุมัติ exec แบบ native hook ได้รับ `{ channel, channelLabel, accountId }`; ช่องทางแบบ named-account ควร render path ที่ scoped ตามบัญชี เช่น `channels.<channel>.accounts.<id>.execApprovals.*` แทนค่าเริ่มต้นระดับบน
- หากช่องทางสามารถอนุมานตัวตน DM ที่คล้าย owner และเสถียรจาก config ที่มีอยู่ ให้ใช้ `createResolvedApproverActionAuthAdapter` จาก `openclaw/plugin-sdk/approval-runtime` เพื่อจำกัด `/approve` ในแชตเดียวกันโดยไม่เพิ่ม logic เฉพาะการอนุมัติใน core
- หากช่องทางต้องการการส่งการอนุมัติแบบ native ให้โค้ดช่องทางมุ่งเน้นที่การ normalize เป้าหมายและข้อเท็จจริงด้าน transport/presentation ใช้ `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` และ `createApproverRestrictedNativeApprovalCapability` จาก `openclaw/plugin-sdk/approval-runtime` วางข้อเท็จจริงเฉพาะช่องทางไว้หลัง `approvalCapability.nativeRuntime` โดยควรผ่าน `createChannelApprovalNativeRuntimeAdapter(...)` หรือ `createLazyChannelApprovalNativeRuntimeAdapter(...)` เพื่อให้ core ประกอบ handler และรับผิดชอบการกรองคำขอ, routing, dedupe, expiry, gateway subscription และ notice routed-elsewhere ได้ `nativeRuntime` แยกเป็น seam ย่อยไม่กี่ส่วน:
- `createChannelNativeOriginTargetResolver` ใช้ matcher channel-route ที่ใช้ร่วมกันเป็นค่าเริ่มต้นสำหรับเป้าหมาย `{ to, accountId, threadId }` ส่ง `targetsMatch` เฉพาะเมื่อช่องทางมีกฎความเทียบเท่าเฉพาะผู้ให้บริการ เช่น การ matching prefix timestamp ของ Slack
- ส่ง `normalizeTargetForMatch` ไปยัง `createChannelNativeOriginTargetResolver` เมื่อช่องทางต้อง canonicalize id ผู้ให้บริการก่อนที่ default route matcher หรือ callback `targetsMatch` แบบกำหนดเองจะทำงาน โดยยังคงรักษาเป้าหมายเดิมไว้สำหรับการส่ง ใช้ `normalizeTarget` เฉพาะเมื่อเป้าหมายการส่งที่ resolve แล้วเองควรถูก canonicalize
- `availability` — บัญชีถูกกำหนดค่าแล้วหรือไม่ และคำขอควรถูกจัดการหรือไม่
- `presentation` — แมป view model การอนุมัติที่ใช้ร่วมกันไปเป็น payload native pending/resolved/expired หรือ action สุดท้าย
- `transport` — เตรียมเป้าหมายและส่ง/อัปเดต/ลบข้อความการอนุมัติแบบ native
- `interactions` — hook bind/unbind/clear-action แบบเลือกได้สำหรับปุ่มหรือ reaction แบบ native
- `observe` — hook diagnostics การส่งแบบเลือกได้
- หากช่องทางต้องการ object ที่ runtime เป็นเจ้าของ เช่น client, token, Bolt app หรือ webhook receiver ให้ลงทะเบียนผ่าน `openclaw/plugin-sdk/channel-runtime-context` registry runtime-context ทั่วไปช่วยให้ core bootstrap handler ที่ขับเคลื่อนด้วย capability จากสถานะเริ่มต้นของช่องทางได้โดยไม่ต้องเพิ่ม glue wrapper เฉพาะการอนุมัติ
- ใช้ `createChannelApprovalHandler` หรือ `createChannelNativeApprovalRuntime` ระดับล่างเฉพาะเมื่อ seam ที่ขับเคลื่อนด้วย capability ยังแสดงออกได้ไม่พอ
- ช่องทางการอนุมัติแบบ native ต้อง route ทั้ง `accountId` และ `approvalKind` ผ่านตัวช่วยเหล่านั้น `accountId` ทำให้นโยบายการอนุมัติแบบหลายบัญชี scoped อยู่กับบัญชีบอทที่ถูกต้อง และ `approvalKind` ทำให้พฤติกรรมการอนุมัติ exec เทียบกับ Plugin พร้อมให้ช่องทางใช้โดยไม่ต้องมี branch hardcode ใน core
- ตอนนี้ Core รับผิดชอบ notice การ reroute การอนุมัติด้วย Plugin ช่องทางไม่ควรส่งข้อความ follow-up ของตัวเองว่า "การอนุมัติถูกส่งไปยัง DM / ช่องทางอื่น" จาก `createChannelNativeApprovalRuntime`; ให้เปิดเผย routing origin + approver-DM ที่ถูกต้องผ่านตัวช่วย approval capability ที่ใช้ร่วมกัน และให้ core รวบรวมการส่งจริงก่อนโพสต์ notice ใดๆ กลับไปยังแชตต้นทาง
- รักษาชนิด id การอนุมัติที่ส่งแล้วตลอดตั้งแต่ต้นจนจบ native client ไม่ควร
  เดาหรือเขียน routing การอนุมัติ exec เทียบกับ Plugin ใหม่จากสถานะ local ของช่องทาง
- ชนิดการอนุมัติที่ต่างกันสามารถตั้งใจเปิดเผยพื้นผิว native ที่ต่างกันได้
  ตัวอย่างที่มาพร้อมชุดในปัจจุบัน:
  - Slack คงการ routing การอนุมัติแบบ native ให้ใช้ได้สำหรับทั้ง id exec และ Plugin
  - Matrix คง routing native DM/ช่องทางและ UX reaction เดียวกันสำหรับการอนุมัติ exec
    และ Plugin ขณะที่ยังให้ auth แตกต่างตามชนิดการอนุมัติได้
- `createApproverRestrictedNativeApprovalAdapter` ยังคงมีอยู่เป็น wrapper ความเข้ากันได้ แต่โค้ดใหม่ควรใช้ capability builder และเปิดเผย `approvalCapability` บน Plugin

สำหรับ entrypoint ช่องทางที่ร้อน ควรใช้ subpath runtime ที่แคบกว่าเมื่อคุณต้องการเพียง
ส่วนเดียวของตระกูลนั้น:

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
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` และ
`openclaw/plugin-sdk/reply-chunking` เมื่อคุณไม่ต้องการพื้นผิว umbrella ที่กว้างกว่า

สำหรับ setup โดยเฉพาะ:

- `openclaw/plugin-sdk/setup-runtime` ครอบคลุมตัวช่วย setup ที่ปลอดภัยต่อ runtime:
  adapter patch setup ที่ปลอดภัยต่อ import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` และ delegated
  setup-proxy builder
- `openclaw/plugin-sdk/setup-adapter-runtime` คือ seam adapter ที่รู้จัก env แบบแคบ
  สำหรับ `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` ครอบคลุม builder setup แบบ optional-install
  พร้อม primitive ที่ปลอดภัยต่อ setup ไม่กี่รายการ:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

หากช่องทางของคุณรองรับ setup หรือ auth ที่ขับเคลื่อนด้วย env และโฟลว์ startup/config
ทั่วไปควรรู้ชื่อ env เหล่านั้นก่อนโหลด runtime ให้ประกาศไว้ใน
plugin manifest ด้วย `channelEnvVars` เก็บ `envVars` ใน runtime ของช่องทางหรือค่าคงที่ local
ไว้สำหรับข้อความที่แสดงต่อ operator เท่านั้น

หากช่องทางของคุณสามารถปรากฏใน `status`, `channels list`, `channels status` หรือ
การสแกน SecretRef ก่อนที่รันไทม์ของ Plugin จะเริ่มทำงาน ให้เพิ่ม `openclaw.setupEntry` ใน
`package.json` entrypoint นั้นควรปลอดภัยต่อการนำเข้าในเส้นทางคำสั่งแบบอ่านอย่างเดียว
และควรคืนค่า metadata ของช่องทาง, config adapter ที่ปลอดภัยสำหรับการตั้งค่า, status
adapter และ metadata เป้าหมาย secret ของช่องทางที่จำเป็นสำหรับสรุปเหล่านั้น ห้าม
เริ่ม clients, listeners หรือรันไทม์ transport จาก setup entry

รักษาเส้นทาง import ของ main channel entry ให้แคบเช่นกัน Discovery สามารถประเมิน
entry และโมดูล channel plugin เพื่อลงทะเบียนความสามารถโดยไม่ต้องเปิดใช้งาน
ช่องทาง ไฟล์อย่าง `channel-plugin-api.ts` ควร export อ็อบเจ็กต์ channel
plugin โดยไม่ import setup wizards, transport clients, socket
listeners, subprocess launchers หรือโมดูลเริ่มต้น service ให้วางชิ้นส่วนรันไทม์
เหล่านั้นไว้ในโมดูลที่โหลดจาก `registerFull(...)`, runtime setters หรือ lazy
capability adapters

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, และ
`splitSetupEntries`

- ใช้ seam `openclaw/plugin-sdk/setup` ที่กว้างกว่าเฉพาะเมื่อคุณต้องการ
  helper สำหรับ setup/config ที่ใช้ร่วมกันและหนักกว่า เช่น
  `moveSingleAccountChannelSectionToDefaultAccount(...)` ด้วย

หากช่องทางของคุณต้องการเพียงประกาศ "ติดตั้ง Plugin นี้ก่อน" ในพื้นผิวการตั้งค่า
ให้เลือกใช้ `createOptionalChannelSetupSurface(...)` adapter/wizard ที่สร้างขึ้น
จะ fail closed เมื่อเขียน config และ finalize และนำข้อความต้องติดตั้งเดียวกัน
กลับมาใช้ซ้ำใน validation, finalize และสำเนาลิงก์เอกสาร

สำหรับเส้นทางช่องทางร้อนอื่น ๆ ให้เลือก helper ที่แคบกว่าแทนพื้นผิว legacy
ที่กว้างกว่า:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, และ
  `openclaw/plugin-sdk/account-helpers` สำหรับ config หลายบัญชีและ
  fallback ของบัญชีเริ่มต้น
- `openclaw/plugin-sdk/inbound-envelope` และ
  `openclaw/plugin-sdk/inbound-reply-dispatch` สำหรับ route/envelope ขาเข้าและ
  การเดินสาย record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` สำหรับการ parse/จับคู่เป้าหมาย
- `openclaw/plugin-sdk/outbound-media` และ
  `openclaw/plugin-sdk/outbound-runtime` สำหรับการโหลดสื่อ รวมถึง delegates
  identity/send ขาออกและการวางแผน payload
- `buildThreadAwareOutboundSessionRoute(...)` จาก
  `openclaw/plugin-sdk/channel-core` เมื่อ route ขาออกควรรักษา
  `replyToId`/`threadId` ที่ระบุชัดเจนไว้ หรือกู้คืน session `:thread:` ปัจจุบัน
  หลังจาก base session key ยังตรงกันอยู่ Provider plugins สามารถ override
  precedence, พฤติกรรม suffix และการ normalize thread id เมื่อแพลตฟอร์มของตน
  มี semantics การส่ง thread แบบ native
- `openclaw/plugin-sdk/thread-bindings-runtime` สำหรับวงจรชีวิต thread-binding
  และการลงทะเบียน adapter
- `openclaw/plugin-sdk/agent-media-payload` เฉพาะเมื่อยังต้องใช้ layout ของ
  field payload agent/media แบบ legacy
- `openclaw/plugin-sdk/telegram-command-config` สำหรับการ normalize คำสั่งกำหนดเองของ Telegram,
  การตรวจสอบ duplicate/conflict และสัญญา command config ที่ fallback-stable

ช่องทาง auth-only มักหยุดที่เส้นทางเริ่มต้นได้: core จัดการ approvals และ Plugin เพียงแค่เปิดเผยความสามารถ outbound/auth ช่องทางอนุมัติ native เช่น Matrix, Slack, Telegram และ transport แชตแบบกำหนดเองควรใช้ helper native ที่ใช้ร่วมกัน แทนการสร้างวงจรชีวิต approval เอง

## นโยบาย mention ขาเข้า

แยกการจัดการ mention ขาเข้าไว้สองชั้น:

- การรวบรวมหลักฐานที่ Plugin เป็นเจ้าของ
- การประเมินนโยบายที่ใช้ร่วมกัน

ใช้ `openclaw/plugin-sdk/channel-mention-gating` สำหรับการตัดสินใจ mention-policy
ใช้ `openclaw/plugin-sdk/channel-inbound` เฉพาะเมื่อคุณต้องการ barrel helper
ขาเข้าที่กว้างกว่า

เหมาะกับ logic ภายใน Plugin:

- การตรวจจับ reply-to-bot
- การตรวจจับ quoted-bot
- การตรวจสอบ thread-participation
- การยกเว้น service/system-message
- cache native ของแพลตฟอร์มที่จำเป็นต่อการพิสูจน์การมีส่วนร่วมของบอท

เหมาะกับ helper ที่ใช้ร่วมกัน:

- `requireMention`
- ผลลัพธ์ mention แบบชัดเจน
- allowlist mention แบบ implicit
- command bypass
- การตัดสินใจ skip สุดท้าย

Flow ที่แนะนำ:

1. คำนวณข้อเท็จจริง mention ภายใน
2. ส่งข้อเท็จจริงเหล่านั้นเข้า `resolveInboundMentionDecision({ facts, policy })`
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

`api.runtime.channel.mentions` เปิดเผย mention helpers ที่ใช้ร่วมกันชุดเดียวกันสำหรับ
bundled channel plugins ที่พึ่งพา runtime injection อยู่แล้ว:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

หากคุณต้องการเพียง `implicitMentionKindWhen` และ
`resolveInboundMentionDecision` ให้ import จาก
`openclaw/plugin-sdk/channel-mention-gating` เพื่อหลีกเลี่ยงการโหลด helper
รันไทม์ขาเข้าที่ไม่เกี่ยวข้อง

helper `resolveMentionGating*` รุ่นเก่ายังคงอยู่บน
`openclaw/plugin-sdk/channel-inbound` ในฐานะ compatibility exports เท่านั้น โค้ดใหม่
ควรใช้ `resolveInboundMentionDecision({ facts, policy })`

## บทแนะนำแบบทีละขั้นตอน

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    สร้างไฟล์ Plugin มาตรฐาน field `channel` ใน `package.json` คือสิ่งที่ทำให้
    นี่เป็น channel plugin สำหรับพื้นผิว package-metadata แบบเต็ม โปรดดู
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
    การตั้งค่าที่ Plugin เป็นเจ้าของซึ่งไม่ใช่ config บัญชีช่องทาง `channelConfigs`
    ตรวจสอบ `channels.acme-chat` และเป็นแหล่งข้อมูล cold-path ที่ใช้โดย config
    schema, setup และพื้นผิว UI ก่อนที่รันไทม์ของ Plugin จะโหลด

  </Step>

  <Step title="Build the channel plugin object">
    interface `ChannelPlugin` มีพื้นผิว adapter แบบ optional จำนวนมาก เริ่มด้วย
    ขั้นต่ำสุด คือ `id` และ `setup` แล้วเพิ่ม adapters ตามที่คุณต้องการ

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

    สำหรับช่องทางที่ยอมรับทั้ง key DM ระดับบนแบบ canonical และ key แบบซ้อน legacy ให้ใช้ helper จาก `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` และ `normalizeChannelDmPolicy` จะรักษาค่าภายในบัญชีให้อยู่ก่อนค่าระดับ root ที่สืบทอดมา จับคู่ resolver เดียวกันกับ doctor repair ผ่าน `normalizeLegacyDmAliases` เพื่อให้ runtime และ migration อ่านสัญญาเดียวกัน

    <Accordion title="What createChatChannelPlugin does for you">
      แทนที่จะ implement interface adapter ระดับต่ำด้วยตนเอง คุณส่ง
      options แบบ declarative แล้ว builder จะประกอบสิ่งเหล่านั้น:

      | Option | สิ่งที่เดินสายให้ |
      | --- | --- |
      | `security.dm` | resolver ความปลอดภัย DM แบบ scoped จาก field config |
      | `pairing.text` | Flow pairing DM แบบข้อความพร้อมการแลกเปลี่ยนโค้ด |
      | `threading` | resolver โหมด reply-to (fixed, account-scoped หรือ custom) |
      | `outbound.attachedResults` | ฟังก์ชันส่งที่คืนค่า metadata ผลลัพธ์ (message IDs) |

      คุณยังสามารถส่งอ็อบเจ็กต์ adapter ดิบแทน options แบบ declarative
      ได้ หากต้องการควบคุมเต็มที่

      Raw outbound adapters อาจกำหนดฟังก์ชัน `chunker(text, limit, ctx)` ได้
      `ctx.formatting` ซึ่งเป็นทางเลือกจะบรรจุการตัดสินใจด้านการจัดรูปแบบ ณ เวลาส่ง
      เช่น `maxLinesPerMessage`; ให้นำไปใช้ก่อนส่ง เพื่อให้การจัดเธรดการตอบกลับ
      และขอบเขตของชังก์ถูกแก้ไขเพียงครั้งเดียวโดยการส่งขาออกที่ใช้ร่วมกัน
      บริบทการส่งยังรวม `replyToIdSource` (`implicit` หรือ `explicit`)
      เมื่อมีการระบุเป้าหมายการตอบกลับแบบเนทีฟแล้ว เพื่อให้ตัวช่วย payload สามารถคง
      แท็กตอบกลับแบบ explicit ไว้ได้โดยไม่ใช้สล็อตตอบกลับแบบ implicit ที่ใช้ได้ครั้งเดียว
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

    ใส่ตัวอธิบาย CLI ที่ channel เป็นเจ้าของไว้ใน `registerCliMetadata(...)` เพื่อให้ OpenClaw
    แสดงรายการเหล่านั้นในความช่วยเหลือระดับรากได้โดยไม่ต้องเปิดใช้งาน runtime ของ channel แบบเต็ม
    ขณะที่การโหลดแบบเต็มตามปกติยังคงรับตัวอธิบายเดียวกันไปใช้สำหรับการลงทะเบียนคำสั่งจริง
    เก็บ `registerFull(...)` ไว้สำหรับงานที่ใช้เฉพาะ runtime
    หาก `registerFull(...)` ลงทะเบียนเมธอด RPC ของ Gateway ให้ใช้คำนำหน้า
    เฉพาะ Plugin namespace สำหรับผู้ดูแลหลัก (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ยังคงถูกสงวนไว้และจะ
    resolve ไปยัง `operator.admin` เสมอ
    `defineChannelPluginEntry` จัดการการแยกโหมดการลงทะเบียนโดยอัตโนมัติ ดู
    [Entry Points](/th/plugins/sdk-entrypoints#definechannelpluginentry) สำหรับตัวเลือกทั้งหมด

  </Step>

  <Step title="Add a setup entry">
    สร้าง `setup-entry.ts` สำหรับการโหลดแบบเบาระหว่าง onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw จะโหลดรายการนี้แทนรายการแบบเต็มเมื่อ channel ถูกปิดใช้งาน
    หรือยังไม่ได้ตั้งค่า วิธีนี้ช่วยหลีกเลี่ยงการดึงโค้ด runtime ขนาดใหญ่เข้ามาระหว่างโฟลว์การตั้งค่า
    ดูรายละเอียดที่ [Setup and Config](/th/plugins/sdk-setup#setup-entry)

    channel ใน workspace ที่บันเดิลมาด้วยซึ่งแยก export ที่ปลอดภัยสำหรับ setup ออกเป็นโมดูล sidecar
    สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก
    `openclaw/plugin-sdk/channel-entry-contract` เมื่อยังต้องการ
    runtime setter ณ เวลา setup แบบชัดเจนด้วย

  </Step>

  <Step title="Handle inbound messages">
    Plugin ของคุณต้องรับข้อความจากแพลตฟอร์มและส่งต่อไปยัง
    OpenClaw รูปแบบทั่วไปคือ Webhook ที่ตรวจสอบคำขอและ
    dispatch ผ่าน handler ขาเข้าของ channel ของคุณ:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
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
      การจัดการข้อความขาเข้าเป็นเรื่องเฉพาะของแต่ละ channel Plugin ของแต่ละ channel เป็นเจ้าของ
      pipeline ขาเข้าของตัวเอง ดู Plugin ของ channel ที่บันเดิลมาด้วย
      (เช่นแพ็กเกจ Plugin ของ Microsoft Teams หรือ Google Chat) สำหรับรูปแบบการใช้งานจริง
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

    สำหรับตัวช่วยทดสอบที่ใช้ร่วมกัน ดู [Testing](/th/plugins/sdk-testing)

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
    โหมดตอบกลับแบบคงที่ แบบจำกัดขอบเขตตามบัญชี หรือแบบกำหนดเอง
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/th/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool และการค้นหา action
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/th/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, STT, media, subagent ผ่าน api.runtime
  </Card>
  <Card title="Channel turn kernel" icon="bolt" href="/th/plugins/sdk-channel-turn">
    วงจรชีวิต turn ขาเข้าที่ใช้ร่วมกัน: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
seam ตัวช่วยบางรายการที่บันเดิลมาด้วยยังคงมีอยู่สำหรับการบำรุงรักษา Plugin ที่บันเดิลมาด้วยและ
ความเข้ากันได้ สิ่งเหล่านี้ไม่ใช่รูปแบบที่แนะนำสำหรับ Plugin ของ channel ใหม่;
ให้เลือกใช้ subpath ของ channel/setup/reply/runtime แบบทั่วไปจากพื้นผิว SDK ร่วม
เว้นแต่คุณจะบำรุงรักษาตระกูล Plugin ที่บันเดิลมาด้วยนั้นโดยตรง
</Note>

## ขั้นตอนถัดไป

- [Provider Plugins](/th/plugins/sdk-provider-plugins) — หาก Plugin ของคุณให้บริการโมเดลด้วย
- [SDK Overview](/th/plugins/sdk-overview) — ข้อมูลอ้างอิงการ import subpath ทั้งหมด
- [SDK Testing](/th/plugins/sdk-testing) — ยูทิลิตีทดสอบและการทดสอบ contract
- [Plugin Manifest](/th/plugins/manifest) — schema ของ manifest แบบเต็ม

## ที่เกี่ยวข้อง

- [Plugin SDK setup](/th/plugins/sdk-setup)
- [Building plugins](/th/plugins/building-plugins)
- [Agent harness plugins](/th/plugins/sdk-agent-harness)
