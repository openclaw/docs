---
read_when:
- คุณกำลังสร้าง channel Plugin สำหรับระบบส่งข้อความตัวใหม่
- You want to connect OpenClaw to a messaging platform
- คุณต้องทำความเข้าใจพื้นผิวอะแดปเตอร์ ChannelPlugin
sidebarTitle: Channel Plugins
summary: คู่มือทีละขั้นตอนสำหรับการสร้าง channel Plugin สำหรับระบบส่งข้อความให้กับ
  OpenClaw
title: การสร้าง channel plugins
x-i18n:
  generated_at: '2026-04-25T13:54:20Z'
  model: gpt-5.4
  provider: openai
  source_hash: 0a466decff828bdce1d9d3e85127867b88f43c6eca25aa97306f8bd0df39f3a9
  source_path: plugins/sdk-channel-plugins.md
  workflow: 15
---

คู่มือนี้จะพาคุณสร้าง channel plugin ที่เชื่อม OpenClaw เข้ากับ
แพลตฟอร์มรับส่งข้อความ เมื่อจบแล้วคุณจะมี channel ที่ใช้งานได้จริง พร้อมความปลอดภัยของ DM,
การจับคู่, การทำเธรดการตอบกลับ และการส่งข้อความขาออก

<Info>
  หากคุณยังไม่เคยสร้าง OpenClaw plugin มาก่อน ให้เริ่มอ่าน
  [เริ่มต้นใช้งาน](/th/plugins/building-plugins) ก่อน เพื่อทำความเข้าใจโครงสร้าง
  แพ็กเกจพื้นฐานและการตั้งค่า manifest
</Info>

## channel plugin ทำงานอย่างไร

channel plugin ไม่จำเป็นต้องมีเครื่องมือ send/edit/react ของตัวเอง OpenClaw คงไว้ซึ่ง
เครื่องมือ `message` ที่ใช้ร่วมกันเพียงตัวเดียวใน core ส่วน plugin ของคุณจะรับผิดชอบ:

- **Config** — การระบุบัญชีและวิซาร์ดการตั้งค่า
- **Security** — นโยบาย DM และ allowlist
- **Pairing** — โฟลว์การอนุมัติ DM
- **Session grammar** — วิธีที่ conversation id เฉพาะผู้ให้บริการแมปไปยัง base chat, thread id และ parent fallback
- **Outbound** — การส่งข้อความ, สื่อ และโพลไปยังแพลตฟอร์ม
- **Threading** — วิธีจัดการเธรดของการตอบกลับ
- **Heartbeat typing** — สัญญาณ typing/busy แบบไม่บังคับสำหรับเป้าหมายการส่งของ Heartbeat

core เป็นเจ้าของเครื่องมือ message ที่ใช้ร่วมกัน, การเชื่อมต่อ prompt, รูปแบบภายนอกของ session key,
การจัดเก็บ `:thread:` แบบทั่วไป และการส่งต่อ

หาก channel ของคุณรองรับตัวบ่งชี้การพิมพ์นอกเหนือจากการตอบกลับขาเข้า ให้เปิดเผย
`heartbeat.sendTyping(...)` บน channel plugin โดย core จะเรียกใช้พร้อมกับ
เป้าหมายการส่ง Heartbeat ที่ระบุแล้วก่อนที่การรันโมเดล Heartbeat จะเริ่มต้น และ
ใช้วงจรชีวิต typing keepalive/cleanup ที่ใช้ร่วมกัน เพิ่ม `heartbeat.clearTyping(...)`
เมื่อแพลตฟอร์มต้องการสัญญาณหยุดอย่างชัดเจน

หาก channel ของคุณเพิ่มพารามิเตอร์ message-tool ที่มีแหล่งที่มาของสื่อ ให้เปิดเผย
ชื่อพารามิเตอร์เหล่านั้นผ่าน `describeMessageTool(...).mediaSourceParams` โดย core จะใช้
รายการที่ระบุชัดเจนนี้สำหรับการทำ path normalization ใน sandbox และนโยบายการเข้าถึงสื่อขาออก
ดังนั้น plugin จึงไม่จำเป็นต้องมีกรณีพิเศษใน shared-core สำหรับพารามิเตอร์เฉพาะผู้ให้บริการ
อย่าง avatar, ไฟล์แนบ หรือ cover image
ควรคืนค่าเป็นแมปที่อิงตาม action เช่น
`{ "set-profile": ["avatarUrl", "avatarPath"] }` เพื่อไม่ให้ action ที่ไม่เกี่ยวข้อง
รับช่วงอาร์กิวเมนต์สื่อของอีก action หนึ่ง อาร์เรย์แบบแบนก็ยังใช้ได้สำหรับพารามิเตอร์
ที่ตั้งใจให้ใช้ร่วมกันกับทุก action ที่เปิดเผย

หากแพลตฟอร์มของคุณจัดเก็บ scope เพิ่มเติมไว้ใน conversation id ให้คงการแยกวิเคราะห์นั้น
ไว้ใน plugin ด้วย `messaging.resolveSessionConversation(...)` นี่คือ hook มาตรฐาน
สำหรับการแมป `rawId` ไปยัง base conversation id, thread id แบบไม่บังคับ,
`baseConversationId` แบบระบุชัดเจน และ `parentConversationCandidates`
ใด ๆ เมื่อคุณคืนค่า `parentConversationCandidates` ให้คงลำดับจาก
parent ที่แคบที่สุดไปจนถึง conversation แบบ broadest/base

bundled plugin ที่ต้องใช้การแยกวิเคราะห์แบบเดียวกันก่อนที่ channel registry จะบูต
ก็สามารถเปิดเผยไฟล์ `session-key-api.ts` ระดับบนสุด พร้อม export
`resolveSessionConversation(...)` ที่ตรงกันได้เช่นกัน โดย core จะใช้พื้นผิวที่ปลอดภัยต่อการบูตนี้
เฉพาะเมื่อ runtime plugin registry ยังไม่พร้อมใช้งาน

`messaging.resolveParentConversationCandidates(...)` ยังคงพร้อมใช้งานเป็น fallback
เพื่อความเข้ากันได้แบบเดิม เมื่อ plugin ต้องการเพียง parent fallback บน generic/raw id
หากมีทั้งสอง hook อยู่ core จะใช้
`resolveSessionConversation(...).parentConversationCandidates` ก่อน และจะ fallback ไปใช้
`resolveParentConversationCandidates(...)` ก็ต่อเมื่อ canonical hook
ไม่ได้ให้ค่าเหล่านั้นมา

## การอนุมัติและความสามารถของ channel

channel plugin ส่วนใหญ่ไม่จำเป็นต้องมีโค้ดเฉพาะสำหรับการอนุมัติ

- core เป็นเจ้าของ `/approve` ในแชตเดียวกัน, payload ของปุ่มอนุมัติที่ใช้ร่วมกัน และการส่ง fallback แบบทั่วไป
- ควรใช้ `approvalCapability` object เดียวบน channel plugin เมื่อ channel ต้องการพฤติกรรมเฉพาะการอนุมัติ
- `ChannelPlugin.approvals` ถูกถอดออกแล้ว ให้นำข้อเท็จจริงด้าน delivery/native/render/auth ของการอนุมัติไปไว้ที่ `approvalCapability`
- `plugin.auth` ใช้สำหรับ login/logout เท่านั้น; core จะไม่อ่าน approval auth hook จาก object นั้นอีกต่อไป
- `approvalCapability.authorizeActorAction` และ `approvalCapability.getActionAvailabilityState` คือ seam มาตรฐานของ approval-auth
- ใช้ `approvalCapability.getActionAvailabilityState` สำหรับความพร้อมใช้งานของ approval auth แบบ same-chat
- หาก channel ของคุณเปิดเผย native exec approval ให้ใช้ `approvalCapability.getExecInitiatingSurfaceState` สำหรับสถานะของ initiating-surface/native-client เมื่อแตกต่างจาก approval auth แบบ same-chat โดย core จะใช้ hook เฉพาะ exec นี้เพื่อแยก `enabled` กับ `disabled`, ตัดสินใจว่า initiating channel รองรับ native exec approval หรือไม่ และรวม channel นี้ไว้ในคำแนะนำ fallback ของ native-client `createApproverRestrictedNativeApprovalCapability(...)` จะเติมส่วนนี้ให้สำหรับกรณีทั่วไป
- ใช้ `outbound.shouldSuppressLocalPayloadPrompt` หรือ `outbound.beforeDeliverPayload` สำหรับพฤติกรรมวงจรชีวิต payload เฉพาะ channel เช่น การซ่อน local approval prompt ที่ซ้ำกัน หรือการส่งตัวบ่งชี้ typing ก่อนส่ง
- ใช้ `approvalCapability.delivery` เฉพาะสำหรับการกำหนดเส้นทาง native approval หรือการระงับ fallback
- ใช้ `approvalCapability.nativeRuntime` สำหรับข้อเท็จจริง native approval ที่ channel เป็นเจ้าของ คงให้เป็น lazy บน hot channel entrypoint ด้วย `createLazyChannelApprovalNativeRuntimeAdapter(...)` ซึ่งสามารถ import runtime module ของคุณตามต้องการ ขณะเดียวกันก็ยังให้ core ประกอบวงจรชีวิตของการอนุมัติได้
- ใช้ `approvalCapability.render` เฉพาะเมื่อ channel ต้องการ payload การอนุมัติแบบกำหนดเองจริง ๆ แทน shared renderer
- ใช้ `approvalCapability.describeExecApprovalSetup` เมื่อ channel ต้องการให้ข้อความตอบกลับในเส้นทาง disabled อธิบายปุ่ม config ที่จำเป็นอย่างชัดเจนเพื่อเปิดใช้ native exec approval hook นี้จะได้รับ `{ channel, channelLabel, accountId }`; channel แบบ named-account ควรแสดง path ที่อิงตาม account เช่น `channels.<channel>.accounts.<id>.execApprovals.*` แทนค่าเริ่มต้นระดับบนสุด
- หาก channel สามารถอนุมานตัวตน DM แบบ owner ที่เสถียรได้จาก config ที่มีอยู่ ให้ใช้ `createResolvedApproverActionAuthAdapter` จาก `openclaw/plugin-sdk/approval-runtime` เพื่อจำกัด `/approve` แบบ same-chat โดยไม่ต้องเพิ่มตรรกะ core เฉพาะการอนุมัติ
- หาก channel ต้องการ native approval delivery ให้คงโค้ด channel ให้เน้นที่การทำ target normalization พร้อมข้อเท็จจริงด้าน transport/presentation ใช้ `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` และ `createApproverRestrictedNativeApprovalCapability` จาก `openclaw/plugin-sdk/approval-runtime` ให้นำข้อเท็จจริงเฉพาะ channel ไปไว้หลัง `approvalCapability.nativeRuntime` โดยเหมาะที่สุดคือผ่าน `createChannelApprovalNativeRuntimeAdapter(...)` หรือ `createLazyChannelApprovalNativeRuntimeAdapter(...)` เพื่อให้ core ประกอบ handler และเป็นเจ้าของ request filtering, routing, dedupe, expiry, gateway subscription และ notice แบบ routed-elsewhere ได้ `nativeRuntime` ถูกแยกเป็น seam ขนาดเล็กไม่กี่ส่วน:
- `availability` — บัญชีถูกกำหนดค่าแล้วหรือไม่ และควรจัดการคำขอหรือไม่
- `presentation` — แมป shared approval view model ไปยัง pending/resolved/expired native payload หรือ final action
- `transport` — เตรียม target พร้อมส่ง/update/delete ข้อความ native approval
- `interactions` — hook สำหรับ bind/unbind/clear-action แบบไม่บังคับ สำหรับปุ่มหรือ reaction แบบ native
- `observe` — hook สำหรับวินิจฉัยการส่งแบบไม่บังคับ
- หาก channel ต้องการ object ที่ runtime เป็นเจ้าของ เช่น client, token, Bolt app หรือ Webhook receiver ให้ลงทะเบียนผ่าน `openclaw/plugin-sdk/channel-runtime-context` runtime-context registry แบบทั่วไปช่วยให้ core บูต handler ที่ขับเคลื่อนด้วย capability จากสถานะการเริ่มต้นของ channel โดยไม่ต้องเพิ่ม wrapper glue เฉพาะการอนุมัติ
- ให้ใช้ `createChannelApprovalHandler` หรือ `createChannelNativeApprovalRuntime` ระดับล่างกว่า ก็ต่อเมื่อ seam แบบขับเคลื่อนด้วย capability ยังไม่ยืดหยุ่นพอจริง ๆ
- channel สำหรับ native approval ต้องส่งผ่านทั้ง `accountId` และ `approvalKind` ผ่าน helper เหล่านั้น `accountId` ช่วยคงการกำหนดขอบเขตของนโยบายการอนุมัติแบบหลายบัญชีไว้กับบัญชีบอตที่ถูกต้อง และ `approvalKind` ช่วยให้พฤติกรรม exec กับ plugin approval พร้อมใช้งานสำหรับ channel โดยไม่ต้องมี branch แบบฮาร์ดโค้ดใน core
- ตอนนี้ core เป็นเจ้าของ notice การเปลี่ยนเส้นทาง approval ด้วยเช่นกัน channel plugin ไม่ควรส่งข้อความติดตามของตัวเองลักษณะ "approval ถูกส่งไปที่ DM / อีก channel หนึ่ง" จาก `createChannelNativeApprovalRuntime`; แต่ให้เปิดเผยการกำหนดเส้นทาง origin + approver-DM ที่ถูกต้องผ่าน helper ของ shared approval capability แล้วปล่อยให้ core รวมการส่งจริงก่อนโพสต์ notice กลับไปยังแชตต้นทาง
- คงชนิดของ approval id ที่ถูกส่งไว้แบบ end-to-end native client ไม่ควร
  เดาหรือเขียนทับการกำหนดเส้นทางของ exec กับ plugin approval จากสถานะเฉพาะภายใน channel
- approval แต่ละชนิดสามารถเปิดเผย native surface ที่แตกต่างกันได้โดยตั้งใจ
  ตัวอย่าง bundled ในปัจจุบัน:
  - Slack ยังคงเปิดใช้การกำหนดเส้นทาง native approval ได้ทั้งสำหรับ exec และ plugin id
  - Matrix คงการกำหนดเส้นทาง native DM/channel และ UX แบบ reaction เดียวกันสำหรับ exec
    และ plugin approval ขณะเดียวกันก็ยังเปิดให้ auth แตกต่างกันตาม approval kind ได้
- `createApproverRestrictedNativeApprovalAdapter` ยังคงมีอยู่ในฐานะ wrapper เพื่อความเข้ากันได้ แต่โค้ดใหม่ควรใช้ capability builder และเปิดเผย `approvalCapability` บน plugin

สำหรับ hot channel entrypoint ให้เลือกใช้ runtime subpath ที่แคบกว่าเมื่อคุณ
ต้องการเพียงส่วนเดียวของ family นั้น:

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
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` และ
`openclaw/plugin-sdk/reply-chunking` เมื่อคุณไม่ต้องการพื้นผิว umbrella
ที่กว้างกว่า

สำหรับ setup โดยเฉพาะ:

- `openclaw/plugin-sdk/setup-runtime` ครอบคลุม helper setup ที่ปลอดภัยต่อ runtime:
  setup patch adapter ที่ปลอดภัยต่อ import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), เอาต์พุต lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` และตัวสร้าง
  setup-proxy แบบ delegated
- `openclaw/plugin-sdk/setup-adapter-runtime` คือ seam ของ adapter แบบ env-aware ที่แคบ
  สำหรับ `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` ครอบคลุมตัวสร้าง setup แบบ optional-install พร้อม primitive ที่ปลอดภัยต่อ setup บางส่วน:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

หาก channel ของคุณรองรับ setup หรือ auth ที่ขับเคลื่อนด้วย env และ flow ของ startup/config แบบทั่วไป
ควรทราบชื่อ env เหล่านั้นก่อนที่ runtime จะโหลด ให้ประกาศไว้ใน
plugin manifest ด้วย `channelEnvVars` โดยคง `envVars` ของ channel runtime หรือค่าคงที่ในเครื่อง
ไว้ใช้เฉพาะกับข้อความสำหรับผู้ปฏิบัติงานเท่านั้น

หาก channel ของคุณสามารถปรากฏใน `status`, `channels list`, `channels status` หรือ
การสแกน SecretRef ก่อนที่ plugin runtime จะเริ่มต้น ให้เพิ่ม `openclaw.setupEntry` ใน
`package.json` entrypoint นั้นควรปลอดภัยต่อการ import ในเส้นทางคำสั่งแบบอ่านอย่างเดียว
และควรคืนค่า metadata ของ channel, config adapter ที่ปลอดภัยต่อ setup, status
adapter และ metadata เป้าหมาย secret ของ channel ที่จำเป็นต่อสรุปเหล่านั้น อย่า
เริ่ม client, listener หรือ transport runtime จาก setup entry

คงเส้นทาง import ของ main channel entry ให้แคบด้วยเช่นกัน การค้นพบสามารถประเมิน
entry และ channel plugin module เพื่อใช้ลงทะเบียน capability ได้โดยไม่ต้องเปิดใช้งาน
channel ไฟล์อย่าง `channel-plugin-api.ts` ควร export channel
plugin object โดยไม่ import setup wizard, transport client, socket
listener, ตัวเรียก subprocess หรือ service startup module ให้นำชิ้นส่วน runtime
เหล่านั้นไปไว้ใน module ที่โหลดจาก `registerFull(...)`, runtime setter หรือ lazy
capability adapter

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` และ
`splitSetupEntries`

- ให้ใช้ seam `openclaw/plugin-sdk/setup` ที่กว้างกว่าเฉพาะเมื่อคุณต้องการ
  helper setup/config ที่ใช้ร่วมกันซึ่งมีน้ำหนักมากกว่าด้วย เช่น
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

หาก channel ของคุณต้องการเพียงประกาศว่า "ติดตั้ง plugin นี้ก่อน" บนพื้นผิว
setup ให้เลือกใช้ `createOptionalChannelSetupSurface(...)` adapter/wizard
ที่สร้างขึ้นจะปิดแบบ fail closed เมื่อมีการเขียน config และการ finalize และยังใช้
ข้อความจำเป็นต้องติดตั้งเดียวกันซ้ำใน validation, finalize และข้อความ copy
ที่ลิงก์ไปยัง docs

สำหรับเส้นทาง hot channel อื่น ๆ ให้เลือกใช้ helper ที่แคบกว่าแทนพื้นผิวแบบเดิม
ที่กว้างกว่า:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` และ
  `openclaw/plugin-sdk/account-helpers` สำหรับ config แบบหลายบัญชีและ
  fallback ไปยังบัญชีเริ่มต้น
- `openclaw/plugin-sdk/inbound-envelope` และ
  `openclaw/plugin-sdk/inbound-reply-dispatch` สำหรับเส้นทาง/envelope ขาเข้า และ
  การเชื่อมต่อระหว่าง record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` สำหรับการแยกวิเคราะห์/จับคู่ target
- `openclaw/plugin-sdk/outbound-media` และ
  `openclaw/plugin-sdk/outbound-runtime` สำหรับการโหลดสื่อ พร้อมทั้ง
  delegate ด้าน identity/send ขาออก และการวางแผน payload
- `buildThreadAwareOutboundSessionRoute(...)` จาก
  `openclaw/plugin-sdk/channel-core` เมื่อเส้นทางขาออกควรคงค่า
  `replyToId`/`threadId` ที่ระบุไว้ชัดเจน หรือกู้คืน session `:thread:` ปัจจุบัน
  หลังจาก base session key ยังตรงกันอยู่ provider plugin สามารถ override
  precedence, พฤติกรรมของ suffix และการ normalize thread id ได้ เมื่อแพลตฟอร์มของตน
  มี semantic การส่งแบบ native thread
- `openclaw/plugin-sdk/thread-bindings-runtime` สำหรับวงจรชีวิตของ thread-binding
  และการลงทะเบียน adapter
- `openclaw/plugin-sdk/agent-media-payload` เฉพาะเมื่อยังจำเป็นต้องใช้
  layout ฟิลด์ payload ของ agent/media แบบเดิม
- `openclaw/plugin-sdk/telegram-command-config` สำหรับการ normalize
  Telegram custom-command, การตรวจสอบความซ้ำซ้อน/ความขัดแย้ง และสัญญา
  command config ที่คงเสถียรสำหรับ fallback

channel ที่มีเฉพาะ auth มักหยุดได้ที่เส้นทางปริยาย: core จัดการ approvals และ plugin เพียงเปิดเผยความสามารถด้าน outbound/auth เท่านั้น channel สำหรับ native approval เช่น Matrix, Slack, Telegram และ custom chat transport ควรใช้ shared native helper แทนการสร้างวงจรชีวิต approval ของตัวเอง

## นโยบายการ mention ขาเข้า

ให้คงการจัดการ mention ขาเข้าแยกเป็นสองชั้น:

- การรวบรวมหลักฐานที่ plugin เป็นเจ้าของ
- การประเมินนโยบายที่ใช้ร่วมกัน

ใช้ `openclaw/plugin-sdk/channel-mention-gating` สำหรับการตัดสินใจนโยบาย mention
ใช้ `openclaw/plugin-sdk/channel-inbound` เฉพาะเมื่อคุณต้องการ inbound
helper barrel ที่กว้างกว่า

สิ่งที่เหมาะกับตรรกะแบบ local ของ plugin:

- การตรวจจับ reply-to-bot
- การตรวจจับ quoted-bot
- การตรวจสอบ thread-participation
- การยกเว้น service/system-message
- แคชแบบ native ของแพลตฟอร์มที่จำเป็นต่อการพิสูจน์การมีส่วนร่วมของบอต

สิ่งที่เหมาะกับ helper ที่ใช้ร่วมกัน:

- `requireMention`
- ผลลัพธ์ของ explicit mention
- allowlist ของ implicit mention
- command bypass
- การตัดสินใจข้ามขั้นสุดท้าย

โฟลว์ที่แนะนำ:

1. คำนวณข้อเท็จจริง mention แบบ local
2. ส่งข้อเท็จจริงเหล่านั้นเข้า `resolveInboundMentionDecision({ facts, policy })`
3. ใช้ `decision.effectiveWasMentioned`, `decision.shouldBypassMention` และ `decision.shouldSkip` ใน inbound gate ของคุณ

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

`api.runtime.channel.mentions` เปิดเผย shared mention helper ชุดเดียวกันสำหรับ
bundled channel plugin ที่พึ่งพา runtime injection อยู่แล้ว:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

หากคุณต้องการเพียง `implicitMentionKindWhen` และ
`resolveInboundMentionDecision` ให้ import จาก
`openclaw/plugin-sdk/channel-mention-gating` เพื่อหลีกเลี่ยงการโหลด
helper runtime ขาเข้าอื่น ๆ ที่ไม่เกี่ยวข้อง

helper `resolveMentionGating*` รุ่นเก่ายังคงอยู่บน
`openclaw/plugin-sdk/channel-inbound` ในฐานะ compatibility export เท่านั้น โค้ดใหม่
ควรใช้ `resolveInboundMentionDecision({ facts, policy })`

## คู่มือทีละขั้นตอน

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="แพ็กเกจและ manifest">
    สร้างไฟล์ plugin มาตรฐาน ฟิลด์ `channel` ใน `package.json`
    คือสิ่งที่ทำให้สิ่งนี้เป็น channel plugin สำหรับพื้นผิว metadata ของแพ็กเกจแบบเต็ม
    โปรดดู [การตั้งค่าและ Config ของ Plugin](/th/plugins/sdk-setup#openclaw-channel):

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

    `configSchema` ใช้ตรวจสอบ `plugins.entries.acme-chat.config` ใช้สิ่งนี้กับ
    การตั้งค่าที่ plugin เป็นเจ้าของซึ่งไม่ใช่ config บัญชีของ channel `channelConfigs`
    ใช้ตรวจสอบ `channels.acme-chat` และเป็นแหล่งข้อมูลใน cold path ที่ใช้โดย config
    schema, setup และพื้นผิว UI ก่อนที่ plugin runtime จะโหลด

  </Step>

  <Step title="สร้าง object ของ channel plugin">
    อินเทอร์เฟซ `ChannelPlugin` มีพื้นผิว adapter แบบไม่บังคับอยู่หลายส่วน เริ่มจาก
    อย่างต่ำที่สุด — `id` และ `setup` — แล้วเพิ่ม adapter ตามที่ต้องการ

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

    <Accordion title="สิ่งที่ createChatChannelPlugin ช่วยจัดการให้คุณ">
      แทนที่จะต้อง implement อินเทอร์เฟซ adapter ระดับล่างด้วยตนเอง คุณเพียงส่ง
      option แบบประกาศไว้ แล้ว builder จะประกอบให้:

      | Option | สิ่งที่มันเชื่อมต่อ |
      | --- | --- |
      | `security.dm` | ตัวแก้ไข DM security แบบมีขอบเขตจากฟิลด์ config |
      | `pairing.text` | โฟลว์ DM pairing แบบข้อความพร้อมการแลกเปลี่ยนโค้ด |
      | `threading` | ตัวแก้ไขโหมด reply-to (ค่าคงที่, อิงตามบัญชี หรือกำหนดเอง) |
      | `outbound.attachedResults` | ฟังก์ชันส่งที่คืนค่า metadata ของผลลัพธ์ (message ID) |

      คุณยังสามารถส่ง raw adapter object แทน option แบบประกาศ
      หากคุณต้องการควบคุมทั้งหมด

      raw outbound adapter อาจกำหนด `chunker(text, limit, ctx)` ได้
      ค่า `ctx.formatting` แบบไม่บังคับมีการตัดสินใจเรื่อง formatting ณ เวลาส่ง
      เช่น `maxLinesPerMessage`; ให้นำไปใช้ก่อนส่ง เพื่อให้ reply threading
      และขอบเขตของ chunk ถูกตัดสินเพียงครั้งเดียวโดย shared outbound delivery
      send context ยังรวม `replyToIdSource` (`implicit` หรือ `explicit`) เมื่อมีการ resolve
      native reply target แล้ว เพื่อให้ helper ของ payload สามารถคง explicit reply tag ไว้
      โดยไม่ใช้ reply slot แบบ implicit ที่ใช้ได้ครั้งเดียวจนหมด
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

    ใส่ CLI descriptor ที่ channel เป็นเจ้าของไว้ใน `registerCliMetadata(...)` เพื่อให้ OpenClaw
    สามารถแสดงผลใน root help ได้โดยไม่ต้องเปิดใช้งาน channel runtime เต็มรูปแบบ
    ขณะที่การโหลดเต็มรูปแบบตามปกติก็ยังรับ descriptor ชุดเดิมไปใช้สำหรับการลงทะเบียนคำสั่งจริงได้
    ให้คง `registerFull(...)` ไว้สำหรับงานที่มีเฉพาะใน runtime
    หาก `registerFull(...)` ลงทะเบียน gateway RPC method ให้ใช้
    prefix ที่เฉพาะกับ plugin namespace ผู้ดูแลระบบของ core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) ยังคงถูกสงวนไว้และจะ
    resolve ไปที่ `operator.admin` เสมอ
    `defineChannelPluginEntry` จัดการการแยกโหมดการลงทะเบียนนี้ให้อัตโนมัติ โปรดดู
    [Entry Points](/th/plugins/sdk-entrypoints#definechannelpluginentry) สำหรับ
    option ทั้งหมด

  </Step>

  <Step title="เพิ่ม setup entry">
    สร้าง `setup-entry.ts` สำหรับการโหลดแบบเบาระหว่าง onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw จะโหลดสิ่งนี้แทน full entry เมื่อ channel ถูกปิดใช้งาน
    หรือยังไม่ได้กำหนดค่า วิธีนี้ช่วยหลีกเลี่ยงการดึงโค้ด runtime ที่มีน้ำหนักมากเข้ามาระหว่าง setup flow
    โปรดดู [Setup and Config](/th/plugins/sdk-setup#setup-entry) สำหรับรายละเอียด

    bundled workspace channel ที่แยก export ที่ปลอดภัยต่อ setup ออกไปไว้ใน sidecar
    module สามารถใช้ `defineBundledChannelSetupEntry(...)` จาก
    `openclaw/plugin-sdk/channel-entry-contract` ได้ เมื่อจำเป็นต้องมี
    runtime setter แบบชัดเจนในช่วง setup ด้วย

  </Step>

  <Step title="จัดการข้อความขาเข้า">
    plugin ของคุณต้องรับข้อความจากแพลตฟอร์มและส่งต่อไปยัง
    OpenClaw รูปแบบที่พบบ่อยคือ Webhook ที่ตรวจสอบคำขอและ
    dispatch ผ่าน inbound handler ของ channel ของคุณ:

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
      การจัดการข้อความขาเข้าเป็นเรื่องเฉพาะของแต่ละ channel แต่ละ channel plugin
      เป็นเจ้าของ inbound pipeline ของตนเอง ดู channel plugin ที่ bundle มาให้
      (เช่น แพ็กเกจ plugin สำหรับ Microsoft Teams หรือ Google Chat) เพื่อดูรูปแบบจริง
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

    สำหรับ helper การทดสอบที่ใช้ร่วมกัน โปรดดู [Testing](/th/plugins/sdk-testing)

  </Step>
</Steps>

## โครงสร้างไฟล์

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadata ของ openclaw.channel
├── openclaw.plugin.json      # Manifest พร้อม config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # export สาธารณะ (ไม่บังคับ)
├── runtime-api.ts            # export runtime ภายใน (ไม่บังคับ)
└── src/
    ├── channel.ts            # ChannelPlugin ผ่าน createChatChannelPlugin
    ├── channel.test.ts       # การทดสอบ
    ├── client.ts             # API client ของแพลตฟอร์ม
    └── runtime.ts            # ที่เก็บ runtime (หากจำเป็น)
```

## หัวข้อขั้นสูง

<CardGroup cols={2}>
  <Card title="ตัวเลือกการทำเธรด" icon="git-branch" href="/th/plugins/sdk-entrypoints#registration-mode">
    โหมดการตอบกลับแบบคงที่, อิงตามบัญชี หรือกำหนดเอง
  </Card>
  <Card title="การผสานรวมเครื่องมือ message" icon="puzzle" href="/th/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool และการค้นหา action
  </Card>
  <Card title="การระบุเป้าหมาย" icon="crosshair" href="/th/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="helper ของ runtime" icon="settings" href="/th/plugins/sdk-runtime">
    TTS, STT, สื่อ, subagent ผ่าน api.runtime
  </Card>
</CardGroup>

<Note>
bundled helper seam บางส่วนยังคงมีอยู่เพื่อการบำรุงรักษา bundled plugin และ
ความเข้ากันได้ แต่ไม่ใช่รูปแบบที่แนะนำสำหรับ channel plugin ใหม่
ให้เลือกใช้ subpath แบบ generic ของ channel/setup/reply/runtime จากพื้นผิว SDK
ส่วนกลาง เว้นแต่คุณกำลังดูแล bundled plugin family นั้นโดยตรง
</Note>

## ขั้นตอนถัดไป

- [Provider Plugins](/th/plugins/sdk-provider-plugins) — หาก plugin ของคุณมี models ให้ด้วย
- [ภาพรวม SDK](/th/plugins/sdk-overview) — เอกสารอ้างอิง import subpath แบบเต็ม
- [การทดสอบ SDK](/th/plugins/sdk-testing) — utility สำหรับการทดสอบและ contract test
- [Plugin Manifest](/th/plugins/manifest) — schema ของ manifest แบบเต็ม

## ที่เกี่ยวข้อง

- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง plugin](/th/plugins/building-plugins)
- [plugin ของ agent harness](/th/plugins/sdk-agent-harness)
