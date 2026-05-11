---
read_when:
    - การเลือกพาธย่อยของ plugin-sdk ที่เหมาะสมสำหรับการนำเข้า Plugin
    - การตรวจสอบพาธย่อยของ Plugin ที่รวมมาในชุดและอินเทอร์เฟซตัวช่วย
summary: 'แค็ตตาล็อกพาธย่อยของ Plugin SDK: การนำเข้าใดอยู่ที่ใด จัดกลุ่มตามส่วน'
title: พาธย่อยของ Plugin SDK
x-i18n:
    generated_at: "2026-05-11T20:36:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2ef3c37e00ca59a567e55b3b47962803e43514d6791d8fda75c7bfeffb1e142
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK ของ Plugin ถูกเปิดเผยเป็นชุดพาธย่อยสาธารณะแบบแคบภายใต้
`openclaw/plugin-sdk/` หน้านี้จัดทำรายการพาธย่อยที่ใช้กันทั่วไปโดยจัดกลุ่มตาม
วัตถุประสงค์ รายการ entrypoint ของคอมไพเลอร์ที่สร้างขึ้นอยู่ใน
`scripts/lib/plugin-sdk-entrypoints.json`; package exports เป็นชุดย่อยสาธารณะ
หลังจากหักลบพาธย่อยสำหรับการทดสอบ/ภายในที่ใช้เฉพาะใน repo ซึ่งระบุไว้ใน
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` ผู้ดูแลสามารถตรวจสอบ
จำนวน public export ได้ด้วย `pnpm plugin-sdk:surface` และพาธย่อย helper ที่สงวนไว้และใช้งานอยู่
ได้ด้วย `pnpm plugins:boundary-report:summary`; helper exports ที่สงวนไว้แต่ไม่ได้ใช้งาน
จะทำให้รายงาน CI ล้มเหลว แทนที่จะคงอยู่ใน SDK สาธารณะในฐานะหนี้ความเข้ากันได้ที่ไม่ทำงาน

สำหรับคู่มือการเขียน Plugin โปรดดู [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## จุดเข้าใช้งานของ Plugin

| พาธย่อย                        | รายการส่งออกหลัก                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | helper สำหรับรายการ provider การย้ายข้อมูล เช่น `createMigrationItem`, ค่าคงที่ reason, marker สถานะรายการ, helper สำหรับการปกปิดข้อมูล และ `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | helper การย้ายข้อมูลขณะ runtime เช่น `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` และ `writeMigrationReport`                                              |

### ความเข้ากันได้และ helper สำหรับการทดสอบที่เลิกใช้แล้ว

พาธย่อยเหล่านี้ยังคงเป็น package exports สำหรับ Plugin รุ่นเก่าและชุดทดสอบของ OpenClaw
แต่โค้ดใหม่ไม่ควรเพิ่ม import จากพาธเหล่านี้: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime` และ `zod` ในโค้ด Plugin ใหม่ ให้ import `zod` โดยตรงจาก `zod`
`plugin-test-runtime` ยังคงเป็นพาธย่อย helper สำหรับการทดสอบแบบเฉพาะจุดที่ใช้งานอยู่

### พาธย่อยสาธารณะที่เลิกใช้แล้วและไม่ได้ใช้งาน

พาธย่อยสาธารณะเหล่านี้มีอยู่มาอย่างน้อยหนึ่งเดือนและปัจจุบันไม่มี
import สำหรับการใช้งานจริงจาก extension ที่มาพร้อมกัน พาธเหล่านี้ยังคง import ได้เพื่อความเข้ากันได้
แต่โค้ด Plugin ใหม่ควรใช้พาธย่อย SDK แบบเฉพาะจุดที่มีการใช้งานจริงแทน:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config` และ `zalouser`

### พาธย่อยสาธารณะที่เลิกใช้แล้วและพบได้ไม่บ่อย

พาธย่อยสาธารณะที่ปัจจุบันใช้โดยเจ้าของ Plugin ที่มาพร้อมกันเพียงหนึ่งหรือสองราย
ก็เลิกใช้สำหรับโค้ด Plugin ใหม่เช่นกัน พาธเหล่านี้ยังคงเป็น package exports เพื่อความเข้ากันได้
แต่โค้ดใหม่ควรเลือกใช้ seam ของ SDK ที่แชร์และมีการใช้งานจริง หรือ API ของแพ็กเกจที่ Plugin เป็นเจ้าของ
ผู้ดูแลติดตามชุดที่แน่นอนใน
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` และงบประมาณปัจจุบัน
ด้วย `pnpm plugin-sdk:surface`

### barrel กว้างที่เลิกใช้แล้ว

barrel re-export แบบกว้างเหล่านี้ยังคง build ได้สำหรับซอร์สของ OpenClaw และ
การตรวจสอบความเข้ากันได้ แต่โค้ดใหม่ควรใช้พาธย่อย SDK แบบเฉพาะจุด:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime` และ
`text-runtime` `channel-runtime`, `compat`, `config-types`, `infra-runtime`
และ `text-runtime` ยังคงเป็น package exports เพื่อความเข้ากันได้ย้อนหลังเท่านั้น; ให้ใช้
พาธย่อย channel/runtime แบบเฉพาะจุด, `config-contracts`, `string-coerce-runtime`,
`text-chunking`, `text-utility-runtime` และ `logging-core` แทน

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ส่งออกสคีมา Zod `openclaw.json` ราก (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | ตัวช่วยตรวจสอบ JSON Schema แบบแคชสำหรับสคีมาที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | ตัวช่วยตัวช่วยสร้างการตั้งค่าที่ใช้ร่วมกัน, พรอมต์รายการอนุญาต, ตัวสร้างสถานะการตั้งค่า |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | ตัวช่วยคอนฟิกหลายบัญชี/เกตการกระทำ, ตัวช่วยสำรองไปยังบัญชีเริ่มต้น |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ตัวช่วยปรับ account-id ให้เป็นรูปแบบมาตรฐาน |
    | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชี + สำรองไปยังค่าเริ่มต้น |
    | `plugin-sdk/account-helpers` | ตัวช่วยรายการบัญชี/การกระทำของบัญชีแบบจำกัดขอบเขต |
    | `plugin-sdk/access-groups` | ตัวช่วยแยกวิเคราะห์รายการอนุญาตของกลุ่มการเข้าถึงและวินิจฉัยกลุ่มแบบปกปิดข้อมูล |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | ตัวช่วยไปป์ไลน์การตอบกลับแบบเดิม โค้ดไปป์ไลน์การตอบกลับช่องทางใหม่ควรใช้ `createChannelMessageReplyPipeline` และ `resolveChannelMessageSourceReplyDeliveryMode` จาก `plugin-sdk/channel-message` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | พริมิทีฟสคีมาคอนฟิกช่องทางที่ใช้ร่วมกัน รวมถึงตัวสร้าง Zod และ JSON/TypeBox โดยตรง |
    | `plugin-sdk/bundled-channel-config-schema` | สคีมาคอนฟิกช่องทาง OpenClaw ที่รวมมา สำหรับ Plugin ที่รวมมาและมีการดูแลเท่านั้น |
    | `plugin-sdk/channel-config-schema-legacy` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้วสำหรับสคีมาคอนฟิกช่องทางที่รวมมา |
    | `plugin-sdk/telegram-command-config` | ตัวช่วยปรับคำสั่งแบบกำหนดเองของ Telegram ให้เป็นมาตรฐาน/ตรวจสอบความถูกต้อง พร้อมการสำรองตามสัญญาที่รวมมา |
    | `plugin-sdk/command-gating` | ตัวช่วยเกตการอนุญาตคำสั่งแบบจำกัดขอบเขต |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | ฟาซาดความเข้ากันได้สำหรับทางเข้าช่องทางระดับล่างที่เลิกใช้แล้ว เส้นทางรับใหม่ควรใช้ `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/channel-ingress-runtime` | ตัวแก้ runtime ทางเข้าช่องทางระดับสูงเชิงทดลองและตัวสร้างข้อเท็จจริงเส้นทางสำหรับเส้นทางรับของช่องทางที่ย้ายแล้ว ควรใช้สิ่งนี้แทนการประกอบรายการอนุญาตที่มีผล, รายการอนุญาตคำสั่ง, และโปรเจ็กชันเดิมในแต่ละ Plugin ดู [API ทางเข้าช่องทาง](/th/plugins/sdk-channel-ingress) |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, และตัวช่วยวงจรชีวิตสตรีมฉบับร่างแบบเดิม โค้ดปิดท้ายการแสดงตัวอย่างใหม่ควรใช้ `plugin-sdk/channel-message` |
    | `plugin-sdk/channel-message` | ตัวช่วยสัญญาวงจรชีวิตข้อความราคาถูก เช่น `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, การอนุมานความสามารถ durable-final, ตัวช่วยพิสูจน์ความสามารถสำหรับความสามารถส่ง/ใบรับ/ผลข้างเคียง, `MessageReceiveContext`, หลักฐานนโยบาย receive ack, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, หลักฐานความสามารถ live-preview และ live-finalizer, สถานะการกู้คืนแบบทนทาน, `RenderedMessageBatch`, ชนิดใบรับข้อความ, และตัวช่วย id ใบรับ ดู [API ข้อความช่องทาง](/th/plugins/sdk-channel-message) ฟาซาดส่งต่อการตอบกลับแบบเดิมมีไว้เพื่อความเข้ากันได้เท่านั้นและเลิกใช้แล้ว |
    | `plugin-sdk/channel-message-runtime` | ตัวช่วยส่งมอบ runtime ที่อาจโหลดการส่งมอบขาออก รวมถึง `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, และ `withDurableMessageSendContext` บริดจ์ส่งต่อการตอบกลับที่เลิกใช้แล้วยังนำเข้าได้สำหรับตัวส่งต่อเพื่อความเข้ากันได้เท่านั้น ใช้จากโมดูล runtime สำหรับมอนิเตอร์/ส่ง ไม่ใช่ไฟล์บูตสแตรป Plugin เส้นทางร้อน |
    | `plugin-sdk/inbound-envelope` | ตัวช่วยเส้นทางขาเข้า + ตัวสร้างซองข้อความที่ใช้ร่วมกัน |
    | `plugin-sdk/inbound-reply-dispatch` | ตัวช่วยบันทึกและส่งต่อขาเข้าที่ใช้ร่วมกันแบบเดิม, เพรดิเคตการส่งต่อแบบมองเห็นได้/สุดท้าย, และความเข้ากันได้ `deliverDurableInboundReplyPayload` ที่เลิกใช้แล้วสำหรับตัวส่งต่อช่องทางที่เตรียมไว้ โค้ดรับ/ส่งต่อช่องทางใหม่ควรนำเข้าตัวช่วยวงจรชีวิต runtime จาก `plugin-sdk/channel-message-runtime` |
    | `plugin-sdk/messaging-targets` | ตัวช่วยแยกวิเคราะห์/จับคู่เป้าหมาย |
    | `plugin-sdk/outbound-media` | ตัวช่วยโหลดสื่อขาออกที่ใช้ร่วมกัน |
    | `plugin-sdk/outbound-send-deps` | การค้นหาดีเพนเดนซีการส่งขาออกแบบเบาสำหรับอะแดปเตอร์ช่องทาง |
    | `plugin-sdk/outbound-runtime` | ตัวช่วยตัวตนขาออก, ผู้รับมอบหมายการส่ง, เซสชัน, การจัดรูปแบบ, และการวางแผนเพย์โหลด ตัวช่วยส่งมอบโดยตรง เช่น `deliverOutboundPayloads` เป็นฐานรองความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/channel-message-runtime` สำหรับเส้นทางส่งใหม่ |
    | `plugin-sdk/poll-runtime` | ตัวช่วยปรับโพลให้เป็นมาตรฐานแบบจำกัดขอบเขต |
    | `plugin-sdk/thread-bindings-runtime` | ตัวช่วยวงจรชีวิตและอะแดปเตอร์การผูกเธรด |
    | `plugin-sdk/agent-media-payload` | ตัวสร้างเพย์โหลดสื่อของเอเจนต์แบบเดิม |
    | `plugin-sdk/conversation-runtime` | ตัวช่วยการผูก, การจับคู่, และการผูกที่คอนฟิกไว้ของการสนทนา/เธรด |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วยสแนปช็อตคอนฟิก runtime |
    | `plugin-sdk/runtime-group-policy` | ตัวช่วยแก้ไขนโยบายกลุ่มของ runtime |
    | `plugin-sdk/channel-status` | ตัวช่วยสแนปช็อต/สรุปสถานะช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/channel-config-primitives` | พริมิทีฟสคีมาคอนฟิกช่องทางแบบจำกัดขอบเขต |
    | `plugin-sdk/channel-config-writes` | ตัวช่วยการอนุญาตเขียนคอนฟิกช่องทาง |
    | `plugin-sdk/channel-plugin-common` | การส่งออกพรีลูด Plugin ช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/allowlist-config-edit` | ตัวช่วยแก้ไข/อ่านคอนฟิกรายการอนุญาต |
    | `plugin-sdk/group-access` | ตัวช่วยตัดสินใจการเข้าถึงกลุ่มที่ใช้ร่วมกัน |
    | `plugin-sdk/direct-dm` | ตัวช่วย auth/guard สำหรับ DM โดยตรงที่ใช้ร่วมกัน |
    | `plugin-sdk/discord` | ฟาซาดความเข้ากันได้ Discord ที่เลิกใช้แล้วสำหรับ `@openclaw/discord@2026.3.13` ที่เผยแพร่แล้วและความเข้ากันได้ของเจ้าของที่ติดตามอยู่; Plugin ใหม่ควรใช้เส้นทางย่อย SDK ช่องทางทั่วไป |
    | `plugin-sdk/telegram-account` | ฟาซาดความเข้ากันได้ Telegram สำหรับการแก้ไขบัญชีที่เลิกใช้แล้วสำหรับความเข้ากันได้ของเจ้าของที่ติดตามอยู่; Plugin ใหม่ควรใช้ตัวช่วย runtime ที่ฉีดเข้ามาหรือเส้นทางย่อย SDK ช่องทางทั่วไป |
    | `plugin-sdk/zalouser` | ฟาซาดความเข้ากันได้ Zalo Personal ที่เลิกใช้แล้วสำหรับแพ็กเกจ Lark/Zalo ที่เผยแพร่แล้วซึ่งยังคงนำเข้าการอนุญาตคำสั่งผู้ส่ง; Plugin ใหม่ควรใช้ `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | การนำเสนอข้อความเชิงความหมาย, การส่งมอบ, และตัวช่วยตอบกลับแบบโต้ตอบเดิม ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | barrel ความเข้ากันได้สำหรับการ debounce ขาเข้า, การจับคู่การกล่าวถึง, ตัวช่วยนโยบายการกล่าวถึง, และตัวช่วยซองข้อความ |
    | `plugin-sdk/channel-inbound-debounce` | ตัวช่วย debounce ขาเข้าแบบจำกัดขอบเขต |
    | `plugin-sdk/channel-mention-gating` | ตัวช่วยนโยบายการกล่าวถึง, เครื่องหมายการกล่าวถึง, และข้อความการกล่าวถึงแบบจำกัดขอบเขต โดยไม่มีพื้นผิว runtime ขาเข้าที่กว้างกว่า |
    | `plugin-sdk/channel-envelope` | ตัวช่วยจัดรูปแบบซองข้อความขาเข้าแบบจำกัดขอบเขต |
    | `plugin-sdk/channel-location` | ตัวช่วยบริบทตำแหน่งช่องทางและการจัดรูปแบบ |
    | `plugin-sdk/channel-logging` | ตัวช่วยบันทึกช่องทางสำหรับการดรอปขาเข้าและความล้มเหลวในการพิมพ์/ack |
    | `plugin-sdk/channel-send-result` | ชนิดผลลัพธ์การตอบกลับ |
    | `plugin-sdk/channel-actions` | ตัวช่วยการกระทำข้อความช่องทาง รวมถึงตัวช่วยสคีมาเนทีฟที่เลิกใช้แล้วซึ่งคงไว้เพื่อความเข้ากันได้ของ Plugin |
    | `plugin-sdk/channel-route` | ตัวช่วยปรับเส้นทางให้เป็นมาตรฐานที่ใช้ร่วมกัน, การแก้ไขเป้าหมายที่ขับเคลื่อนด้วยตัวแยกวิเคราะห์, การแปลง thread-id เป็นสตริง, คีย์เส้นทาง dedupe/compact, ชนิดเป้าหมายที่แยกวิเคราะห์แล้ว, และตัวช่วยเปรียบเทียบเส้นทาง/เป้าหมาย |
    | `plugin-sdk/channel-targets` | ตัวช่วยแยกวิเคราะห์เป้าหมาย; ผู้เรียกการเปรียบเทียบเส้นทางควรใช้ `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | ชนิดสัญญาช่องทาง |
    | `plugin-sdk/channel-feedback` | การเชื่อมสาย feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยสัญญาความลับแบบจำกัดขอบเขต เช่น `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, และชนิดเป้าหมายความลับ |
  </Accordion>

  <Accordion title="เส้นทางย่อยของผู้ให้บริการ">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | facade ผู้ให้บริการ LM Studio ที่รองรับสำหรับการตั้งค่า การค้นหา catalog และการเตรียมโมเดลขณะรันไทม์ |
    | `plugin-sdk/lmstudio-runtime` | facade รันไทม์ LM Studio ที่รองรับสำหรับค่าเริ่มต้นของเซิร์ฟเวอร์ภายในเครื่อง การค้นหาโมเดล ส่วนหัวคำขอ และตัวช่วยสำหรับโมเดลที่โหลดแล้ว |
    | `plugin-sdk/provider-setup` | ตัวช่วยการตั้งค่าผู้ให้บริการแบบภายในเครื่อง/โฮสต์เองที่คัดสรรแล้ว |
    | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยการตั้งค่าผู้ให้บริการแบบโฮสต์เองที่เข้ากันได้กับ OpenAI แบบเฉพาะจุด |
    | `plugin-sdk/cli-backend` | ค่าเริ่มต้นของแบ็กเอนด์ CLI + ค่าคงที่ watchdog |
    | `plugin-sdk/provider-auth-runtime` | ตัวช่วยการแก้ไขคีย์ API ขณะรันไทม์สำหรับ Plugin ผู้ให้บริการ |
    | `plugin-sdk/provider-auth-api-key` | ตัวช่วยการเริ่มต้นใช้งานคีย์ API/การเขียนโปรไฟล์ เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | ตัวสร้างผลลัพธ์การรับรองความถูกต้อง OAuth มาตรฐาน |
    | `plugin-sdk/provider-env-vars` | ตัวช่วยค้นหาตัวแปรสภาพแวดล้อมสำหรับการรับรองความถูกต้องของผู้ให้บริการ |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, รายการส่งออกความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้างนโยบาย replay ที่ใช้ร่วมกัน, ตัวช่วย endpoint ของผู้ให้บริการ และตัวช่วยการ normalize ID โมเดลที่ใช้ร่วมกัน |
    | `plugin-sdk/provider-catalog-runtime` | hook รันไทม์สำหรับเสริม catalog ของผู้ให้บริการ และจุดเชื่อมรีจิสทรี plugin-provider สำหรับการทดสอบสัญญา |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | ตัวช่วยความสามารถ HTTP/endpoint ของผู้ให้บริการทั่วไป, ข้อผิดพลาด HTTP ของผู้ให้บริการ และตัวช่วยฟอร์ม multipart สำหรับถอดเสียงเสียง |
    | `plugin-sdk/provider-web-fetch-contract` | ตัวช่วยสัญญา config/selection ของ web-fetch แบบแคบ เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | ตัวช่วยการลงทะเบียน/แคชของผู้ให้บริการ web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วย config/credential ของ web-search แบบแคบสำหรับผู้ให้บริการที่ไม่ต้องการการต่อสาย plugin-enable |
    | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญา config/credential ของ web-search แบบแคบ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวรับข้อมูลรับรองแบบมีขอบเขต |
    | `plugin-sdk/provider-web-search` | ตัวช่วยการลงทะเบียน/แคช/รันไทม์ของผู้ให้บริการ web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` และการล้างสคีมา Gemini + การวินิจฉัย |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` และรายการที่คล้ายกัน |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ประเภท wrapper ของสตรีม และตัวช่วย wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ที่ใช้ร่วมกัน |
    | `plugin-sdk/provider-transport-runtime` | ตัวช่วย transport ดั้งเดิมของผู้ให้บริการ เช่น fetch แบบมี guard, การแปลงข้อความ transport และสตรีมเหตุการณ์ transport ที่เขียนได้ |
    | `plugin-sdk/provider-onboard` | ตัวช่วยแพตช์ config สำหรับการเริ่มต้นใช้งาน |
    | `plugin-sdk/global-singleton` | ตัวช่วย singleton/map/cache ภายในโปรเซส |
    | `plugin-sdk/group-activation` | ตัวช่วยโหมดการเปิดใช้งานกลุ่มและการแยกวิเคราะห์คำสั่งแบบแคบ |
  </Accordion>

  <Accordion title="เส้นทางย่อยของการรับรองความถูกต้องและความปลอดภัย">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ตัวช่วยรีจิสทรีคำสั่งรวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก, ตัวช่วยการอนุญาตผู้ส่ง |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความคำสั่ง/ความช่วยเหลือ เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | ตัวช่วยการแก้ไขผู้อนุมัติและการรับรองความถูกต้องของการกระทำในแชตเดียวกัน |
    | `plugin-sdk/approval-client-runtime` | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติ exec ดั้งเดิม |
    | `plugin-sdk/approval-delivery-runtime` | อะแดปเตอร์ความสามารถ/การส่งมอบการอนุมัติดั้งเดิม |
    | `plugin-sdk/approval-gateway-runtime` | ตัวช่วยการแก้ไข Gateway การอนุมัติที่ใช้ร่วมกัน |
    | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยโหลดอะแดปเตอร์การอนุมัติดั้งเดิมแบบเบาสำหรับ entrypoint ของช่องทางที่ร้อน |
    | `plugin-sdk/approval-handler-runtime` | ตัวช่วยรันไทม์ handler การอนุมัติที่กว้างขึ้น; ควรใช้จุดเชื่อม adapter/gateway ที่แคบกว่าเมื่อเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | เป้าหมายการอนุมัติดั้งเดิม + ตัวช่วยการผูกบัญชี |
    | `plugin-sdk/approval-reply-runtime` | ตัวช่วย payload การตอบกลับการอนุมัติ exec/plugin |
    | `plugin-sdk/approval-runtime` | ตัวช่วย payload การอนุมัติ exec/plugin, ตัวช่วยการกำหนดเส้นทาง/รันไทม์การอนุมัติดั้งเดิม และตัวช่วยการแสดงผลการอนุมัติแบบมีโครงสร้าง เช่น `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | ตัวช่วยรีเซ็ตการ dedupe การตอบกลับขาเข้าแบบแคบ |
    | `plugin-sdk/channel-contract-testing` | ตัวช่วยการทดสอบสัญญาช่องทางแบบแคบโดยไม่มี barrel การทดสอบแบบกว้าง |
    | `plugin-sdk/command-auth-native` | การรับรองความถูกต้องของคำสั่งดั้งเดิม, การจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก และตัวช่วยเป้าหมายเซสชันดั้งเดิม |
    | `plugin-sdk/command-detection` | ตัวช่วยการตรวจจับคำสั่งที่ใช้ร่วมกัน |
    | `plugin-sdk/command-primitives-runtime` | predicate ข้อความคำสั่งแบบเบาสำหรับเส้นทางช่องทางที่ร้อน |
    | `plugin-sdk/command-surface` | การ normalize เนื้อหาคำสั่งและตัวช่วยพื้นผิวคำสั่ง |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยการรวบรวมสัญญาความลับแบบแคบสำหรับพื้นผิวความลับของช่องทาง/plugin |
    | `plugin-sdk/secret-ref-runtime` | ตัวช่วยการพิมพ์ `coerceSecretRef` และ SecretRef แบบแคบสำหรับการแยกวิเคราะห์สัญญาความลับ/config |
    | `plugin-sdk/security-runtime` | ความไว้วางใจที่ใช้ร่วมกัน, การ gate DM, ตัวช่วยไฟล์/เส้นทางที่จำกัดด้วย root รวมถึงการเขียนแบบสร้างเท่านั้น, การแทนที่ไฟล์แบบ atomic ทั้ง sync/async, การเขียน temp แบบ sibling, fallback การย้ายข้ามอุปกรณ์, ตัวช่วยที่เก็บไฟล์ส่วนตัว, guard สำหรับ parent ของ symlink, external-content, การปกปิดข้อความที่ละเอียดอ่อน, การเปรียบเทียบความลับแบบเวลาคงที่ และตัวช่วยการรวบรวมความลับ |
    | `plugin-sdk/ssrf-policy` | ตัวช่วย allowlist ของโฮสต์และนโยบาย SSRF เครือข่ายส่วนตัว |
    | `plugin-sdk/ssrf-dispatcher` | ตัวช่วย pinned-dispatcher แบบแคบโดยไม่มีพื้นผิวรันไทม์ infra แบบกว้าง |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, fetch ที่มี SSRF guard, ข้อผิดพลาด SSRF และตัวช่วยนโยบาย SSRF |
    | `plugin-sdk/secret-input` | ตัวช่วยการแยกวิเคราะห์อินพุตความลับ |
    | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ/เป้าหมาย Webhook และการบังคับแปลง websocket/body ดิบ |
    | `plugin-sdk/webhook-request-guards` | ตัวช่วยขนาด/timeout ของ request body |
  </Accordion>

  <Accordion title="พาธย่อยของรันไทม์และพื้นที่จัดเก็บ">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | ตัวช่วยแบบกว้างสำหรับรันไทม์/การบันทึก/การสำรองข้อมูล/การติดตั้ง Plugin |
    | `plugin-sdk/runtime-env` | ตัวช่วยแบบแคบสำหรับ env ของรันไทม์, logger, timeout, retry และ backoff |
    | `plugin-sdk/browser-config` | facade การกำหนดค่าเบราว์เซอร์ที่รองรับ สำหรับโปรไฟล์/ค่าเริ่มต้นที่ทำให้เป็นมาตรฐาน, การแยกวิเคราะห์ CDP URL และตัวช่วย auth สำหรับการควบคุมเบราว์เซอร์ |
    | `plugin-sdk/channel-runtime-context` | ตัวช่วยทั่วไปสำหรับการลงทะเบียนและค้นหา runtime-context ของช่องทาง |
    | `plugin-sdk/matrix` | facade ความเข้ากันได้กับ Matrix ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางของบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควร import `plugin-sdk/run-command` โดยตรง |
    | `plugin-sdk/mattermost` | facade ความเข้ากันได้กับ Mattermost ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางของบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควร import พาธย่อย SDK ทั่วไปโดยตรง |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | ตัวช่วยที่ใช้ร่วมกันสำหรับคำสั่ง/hook/http/interactive ของ Plugin |
    | `plugin-sdk/hook-runtime` | ตัวช่วยที่ใช้ร่วมกันสำหรับไปป์ไลน์ Webhook/hook ภายใน |
    | `plugin-sdk/lazy-runtime` | ตัวช่วยสำหรับ import/binding รันไทม์แบบ lazy เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod` และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | ตัวช่วย exec ของกระบวนการ |
    | `plugin-sdk/cli-runtime` | ตัวช่วยสำหรับการจัดรูปแบบ CLI, wait, version, argument-invocation และกลุ่มคำสั่งแบบ lazy |
    | `plugin-sdk/gateway-runtime` | ตัวช่วยไคลเอนต์ Gateway, การเริ่มไคลเอนต์ที่พร้อมสำหรับ event-loop, Gateway CLI RPC, ข้อผิดพลาดของโปรโตคอล Gateway และแพตช์สถานะช่องทาง |
    | `plugin-sdk/config-contracts` | พื้นผิว config แบบเน้นเฉพาะชนิดเท่านั้นสำหรับรูปร่าง config ของ Plugin เช่น `OpenClawConfig` และชนิด config ของช่องทาง/ผู้ให้บริการ |
    | `plugin-sdk/plugin-config-runtime` | ตัวช่วยค้นหา plugin-config ในรันไทม์ เช่น `requireRuntimeConfig`, `resolvePluginConfigObject` และ `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | ตัวช่วยแก้ไข config แบบ transactional เช่น `mutateConfigFile`, `replaceConfigFile` และ `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วยสแนปชอต config ของกระบวนการปัจจุบัน เช่น `getRuntimeConfig`, `getRuntimeConfigSnapshot` และตัวตั้งค่าสแนปชอตสำหรับการทดสอบ |
    | `plugin-sdk/telegram-command-config` | การทำให้ชื่อคำสั่ง/คำอธิบายของ Telegram เป็นมาตรฐาน และการตรวจสอบรายการซ้ำ/ข้อขัดแย้ง แม้เมื่อพื้นผิวสัญญา Telegram ที่รวมมาด้วยไม่พร้อมใช้งาน |
    | `plugin-sdk/text-autolink-runtime` | การตรวจจับ autolink ของการอ้างอิงไฟล์โดยไม่ใช้ barrel ข้อความแบบกว้าง |
    | `plugin-sdk/approval-runtime` | ตัวช่วยอนุมัติ exec/Plugin, ตัวสร้าง approval-capability, ตัวช่วย auth/profile, ตัวช่วย native routing/runtime และการจัดรูปแบบพาธแสดงผลการอนุมัติแบบมีโครงสร้าง |
    | `plugin-sdk/reply-runtime` | ตัวช่วยรันไทม์ขาเข้า/ตอบกลับที่ใช้ร่วมกัน, การแบ่งชิ้น, dispatch, Heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วยแบบแคบสำหรับ dispatch/finalize การตอบกลับ และป้ายกำกับการสนทนา |
    | `plugin-sdk/reply-history` | ตัวช่วยประวัติการตอบกลับแบบหน้าต่างสั้นที่ใช้ร่วมกัน และ marker เช่น `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` และ `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ตัวช่วยแบ่งชิ้น text/markdown แบบแคบ |
    | `plugin-sdk/session-store-runtime` | ตัวช่วยพาธ session store, session-key, updated-at และการแก้ไข store |
    | `plugin-sdk/cron-store-runtime` | ตัวช่วยพาธ/โหลด/บันทึกของ Cron store |
    | `plugin-sdk/state-paths` | ตัวช่วยพาธไดเรกทอรี State/OAuth |
    | `plugin-sdk/routing` | ตัวช่วย route/session-key/account binding เช่น `resolveAgentRoute`, `buildAgentSessionKey` และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ตัวช่วยสรุปสถานะช่องทาง/บัญชีที่ใช้ร่วมกัน, ค่าเริ่มต้น runtime-state และตัวช่วย metadata ของปัญหา |
    | `plugin-sdk/target-resolver-runtime` | ตัวช่วย target resolver ที่ใช้ร่วมกัน |
    | `plugin-sdk/string-normalization-runtime` | ตัวช่วยทำให้ slug/string เป็นมาตรฐาน |
    | `plugin-sdk/request-url` | ดึง string URL จากอินพุตที่คล้าย fetch/request |
    | `plugin-sdk/run-command` | ตัวรันคำสั่งแบบจับเวลา พร้อมผลลัพธ์ stdout/stderr ที่ทำให้เป็นมาตรฐาน |
    | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ทั่วไปสำหรับ tool/CLI |
    | `plugin-sdk/tool-payload` | ดึง payload ที่ทำให้เป็นมาตรฐานจากออบเจ็กต์ผลลัพธ์ของ tool |
    | `plugin-sdk/tool-send` | ดึงฟิลด์เป้าหมายการส่งแบบ canonical จาก args ของ tool |
    | `plugin-sdk/temp-path` | ตัวช่วยพาธดาวน์โหลดชั่วคราวที่ใช้ร่วมกัน และ workspace ชั่วคราวแบบปลอดภัยส่วนตัว |
    | `plugin-sdk/logging-core` | ตัวช่วย logger ของระบบย่อยและการปกปิดข้อมูล |
    | `plugin-sdk/markdown-table-runtime` | ตัวช่วยโหมดตาราง Markdown และการแปลง |
    | `plugin-sdk/model-session-runtime` | ตัวช่วย override model/session เช่น `applyModelOverrideToSessionEntry` และ `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | ตัวช่วยแปลง config ของผู้ให้บริการ Talk |
    | `plugin-sdk/json-store` | ตัวช่วยอ่าน/เขียนสถานะ JSON ขนาดเล็ก |
    | `plugin-sdk/file-lock` | ตัวช่วย file-lock แบบ re-entrant |
    | `plugin-sdk/persistent-dedupe` | ตัวช่วยแคช dedupe ที่มีดิสก์หนุนหลัง |
    | `plugin-sdk/acp-runtime` | ตัวช่วยรันไทม์/เซสชัน ACP และ reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | ตัวช่วยลงทะเบียนแบ็กเอนด์ ACP แบบเบา และ reply-dispatch สำหรับ Plugin ที่โหลดเมื่อเริ่มต้น |
    | `plugin-sdk/acp-binding-resolve-runtime` | การแปลง binding ของ ACP แบบอ่านอย่างเดียวโดยไม่ import lifecycle startup |
    | `plugin-sdk/agent-config-primitives` | primitive ของ config-schema สำหรับรันไทม์ agent แบบแคบ |
    | `plugin-sdk/boolean-param` | ตัวอ่านพารามิเตอร์ boolean แบบยืดหยุ่น |
    | `plugin-sdk/dangerous-name-runtime` | ตัวช่วยแปลงการจับคู่ dangerous-name |
    | `plugin-sdk/device-bootstrap` | ตัวช่วย bootstrap อุปกรณ์และ token การจับคู่ |
    | `plugin-sdk/extension-shared` | primitive ตัวช่วยที่ใช้ร่วมกันสำหรับ passive-channel, status และ ambient proxy |
    | `plugin-sdk/models-provider-runtime` | ตัวช่วยตอบกลับคำสั่ง/ผู้ให้บริการ `/models` |
    | `plugin-sdk/skill-commands-runtime` | ตัวช่วยแสดงรายการคำสั่ง Skill |
    | `plugin-sdk/native-command-registry` | ตัวช่วย registry/build/serialize ของคำสั่ง native |
    | `plugin-sdk/agent-harness` | พื้นผิว trusted-plugin เชิงทดลองสำหรับ agent harness ระดับต่ำ: ชนิด harness, ตัวช่วย steer/abort ของ active-run, ตัวช่วยสะพาน tool ของ OpenClaw, ตัวช่วยนโยบาย tool ของ runtime-plan, การจัดประเภทผลลัพธ์ terminal, ตัวช่วยจัดรูปแบบ/รายละเอียดความคืบหน้า tool และยูทิลิตีผลลัพธ์ของ attempt |
    | `plugin-sdk/provider-zai-endpoint` | facade การตรวจจับ endpoint ที่ผู้ให้บริการ Z.AI เป็นเจ้าของซึ่งเลิกใช้แล้ว; ใช้ API สาธารณะของ Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | ตัวช่วย async lock ภายในกระบวนการสำหรับไฟล์สถานะรันไทม์ขนาดเล็ก |
    | `plugin-sdk/channel-activity-runtime` | ตัวช่วย telemetry กิจกรรมช่องทาง |
    | `plugin-sdk/concurrency-runtime` | ตัวช่วย concurrency ของงาน async แบบมีขอบเขต |
    | `plugin-sdk/dedupe-runtime` | ตัวช่วยแคช dedupe ในหน่วยความจำ |
    | `plugin-sdk/delivery-queue-runtime` | ตัวช่วย drain การส่งขาออกที่ค้างอยู่ |
    | `plugin-sdk/file-access-runtime` | ตัวช่วยพาธไฟล์ภายในเครื่องและ media-source ที่ปลอดภัย |
    | `plugin-sdk/heartbeat-runtime` | ตัวช่วย wake, event และ visibility ของ Heartbeat |
    | `plugin-sdk/number-runtime` | ตัวช่วย coercion ตัวเลข |
    | `plugin-sdk/secure-random-runtime` | ตัวช่วย token/UUID ที่ปลอดภัย |
    | `plugin-sdk/system-event-runtime` | ตัวช่วยคิวเหตุการณ์ระบบ |
    | `plugin-sdk/transport-ready-runtime` | ตัวช่วยรอความพร้อมของ transport |
    | `plugin-sdk/infra-runtime` | shim ความเข้ากันได้ที่เลิกใช้แล้ว; ใช้พาธย่อยรันไทม์แบบเน้นเฉพาะด้านบน |
    | `plugin-sdk/collection-runtime` | ตัวช่วยแคชขนาดเล็กแบบมีขอบเขต |
    | `plugin-sdk/diagnostic-runtime` | ตัวช่วย diagnostic flag, event และ trace-context |
    | `plugin-sdk/error-runtime` | ตัวช่วยกราฟข้อผิดพลาด, การจัดรูปแบบ, การจัดประเภทข้อผิดพลาดที่ใช้ร่วมกัน, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch ที่ห่อไว้, proxy, ตัวเลือก EnvHttpProxyAgent และตัวช่วย lookup แบบ pinned |
    | `plugin-sdk/runtime-fetch` | fetch ของรันไทม์ที่รับรู้ dispatcher โดยไม่ import proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | ตัวอ่าน response-body แบบมีขอบเขตโดยไม่ใช้พื้นผิวรันไทม์สื่อแบบกว้าง |
    | `plugin-sdk/session-binding-runtime` | สถานะ binding ของการสนทนาปัจจุบันโดยไม่มี configured binding routing หรือ pairing store |
    | `plugin-sdk/session-store-runtime` | ตัวช่วย session-store โดยไม่ import การเขียน/บำรุงรักษา config แบบกว้าง |
    | `plugin-sdk/context-visibility-runtime` | การแปลง context visibility และการกรอง context เสริมโดยไม่ import config/security แบบกว้าง |
    | `plugin-sdk/string-coerce-runtime` | ตัวช่วย coercion และ normalization ของ primitive record/string แบบแคบโดยไม่ import markdown/logging |
    | `plugin-sdk/host-runtime` | ตัวช่วยทำให้ hostname และ SCP host เป็นมาตรฐาน |
    | `plugin-sdk/retry-runtime` | ตัวช่วย config retry และตัวรัน retry |
    | `plugin-sdk/agent-runtime` | ตัวช่วยไดเรกทอรี/identity/workspace ของ agent รวมถึง `resolveAgentDir`, `resolveDefaultAgentDir` และการส่งออกความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว |
    | `plugin-sdk/directory-runtime` | การ query/dedup ไดเรกทอรีที่มี config หนุนหลัง |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="เส้นทางย่อยสำหรับความสามารถและการทดสอบ">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | ตัวช่วยร่วมสำหรับดึงข้อมูล/แปลง/จัดเก็บสื่อ การตรวจสอบมิติวิดีโอที่ใช้ ffprobe รองรับ และตัวสร้างเพย์โหลดสื่อ |
    | `plugin-sdk/media-mime` | การปรับ MIME ให้เป็นมาตรฐานแบบจำกัด การแมปนามสกุลไฟล์ การตรวจจับ MIME และตัวช่วยชนิดสื่อ |
    | `plugin-sdk/media-store` | ตัวช่วยคลังสื่อแบบจำกัด เช่น `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | ตัวช่วยร่วมสำหรับการสลับสำรองของการสร้างสื่อ การเลือกตัวเลือก และข้อความเมื่อไม่มีโมเดล |
    | `plugin-sdk/media-understanding` | ประเภทผู้ให้บริการความเข้าใจสื่อ พร้อมการส่งออกตัวช่วยรูปภาพ/เสียง/การสกัดข้อมูลแบบมีโครงสร้างสำหรับผู้ให้บริการ |
    | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งส่วน/เรนเดอร์ข้อความและ markdown การแปลงตาราง markdown การตัดแท็กคำสั่ง และยูทิลิตีข้อความที่ปลอดภัย |
    | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งส่วนข้อความขาออก |
    | `plugin-sdk/speech` | ประเภทผู้ให้บริการเสียงพูด พร้อมการส่งออกคำสั่ง รีจิสทรี การตรวจสอบความถูกต้อง ตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI และตัวช่วยเสียงพูดสำหรับผู้ให้บริการ |
    | `plugin-sdk/speech-core` | ประเภทผู้ให้บริการเสียงพูดร่วม รีจิสทรี คำสั่ง การปรับให้เป็นมาตรฐาน และการส่งออกตัวช่วยเสียงพูด |
    | `plugin-sdk/realtime-transcription` | ประเภทผู้ให้บริการการถอดเสียงแบบเรียลไทม์ ตัวช่วยรีจิสทรี และตัวช่วยเซสชัน WebSocket ร่วม |
    | `plugin-sdk/realtime-voice` | ประเภทผู้ให้บริการเสียงแบบเรียลไทม์และตัวช่วยรีจิสทรี |
    | `plugin-sdk/image-generation` | ประเภทผู้ให้บริการการสร้างรูปภาพ พร้อมตัวช่วย asset รูปภาพ/data URL และตัวสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
    | `plugin-sdk/image-generation-core` | ประเภทการสร้างรูปภาพร่วม การสลับสำรอง การตรวจสอบสิทธิ์ และตัวช่วยรีจิสทรี |
    | `plugin-sdk/music-generation` | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์ของการสร้างเพลง |
    | `plugin-sdk/music-generation-core` | ประเภทการสร้างเพลงร่วม ตัวช่วยสลับสำรอง การค้นหาผู้ให้บริการ และการแยกวิเคราะห์การอ้างอิงโมเดล |
    | `plugin-sdk/video-generation` | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์ของการสร้างวิดีโอ |
    | `plugin-sdk/video-generation-core` | ประเภทการสร้างวิดีโอร่วม ตัวช่วยสลับสำรอง การค้นหาผู้ให้บริการ และการแยกวิเคราะห์การอ้างอิงโมเดล |
    | `plugin-sdk/webhook-targets` | รีจิสทรีเป้าหมาย Webhook และตัวช่วยติดตั้งเส้นทาง |
    | `plugin-sdk/webhook-path` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | ตัวช่วยร่วมสำหรับโหลดสื่อระยะไกล/ภายในเครื่อง |
    | `plugin-sdk/zod` | การส่งออกซ้ำเพื่อความเข้ากันได้ที่เลิกใช้แล้ว นำเข้า `zod` จาก `zod` โดยตรง |
    | `plugin-sdk/testing` | barrel ความเข้ากันได้ที่เลิกใช้แล้วแบบภายใน repo สำหรับการทดสอบ OpenClaw รุ่นเก่า การทดสอบ repo ใหม่ควรนำเข้าเส้นทางย่อยการทดสอบภายในเครื่องแบบเจาะจงแทน เช่น `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` หรือ `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | ตัวช่วย `createTestPluginApi` ขั้นต่ำแบบภายใน repo สำหรับการทดสอบหน่วยการลงทะเบียน Plugin โดยตรง โดยไม่ต้องนำเข้า bridge ตัวช่วยทดสอบของ repo |
    | `plugin-sdk/agent-runtime-test-contracts` | fixture สัญญา adapter ของ agent-runtime ดั้งเดิมแบบภายใน repo สำหรับการทดสอบการตรวจสอบสิทธิ์ การส่งมอบ fallback, tool-hook, prompt-overlay, schema และการฉาย transcript |
    | `plugin-sdk/channel-test-helpers` | ตัวช่วยทดสอบแบบเน้น channel ภายใน repo สำหรับสัญญาการกระทำ/การตั้งค่า/สถานะทั่วไป การยืนยันไดเรกทอรี วงจรชีวิตการเริ่มต้นบัญชี send-config threading, runtime mocks, status issues, outbound delivery และ hook registration |
    | `plugin-sdk/channel-target-testing` | ชุดกรณีข้อผิดพลาดการแก้เป้าหมายร่วมแบบภายใน repo สำหรับการทดสอบ channel |
    | `plugin-sdk/plugin-test-contracts` | ตัวช่วยสัญญาแพ็กเกจ Plugin การลงทะเบียน artifact สาธารณะ การนำเข้าโดยตรง runtime API และ side effect จากการนำเข้า แบบภายใน repo |
    | `plugin-sdk/provider-test-contracts` | ตัวช่วยสัญญา runtime ของผู้ให้บริการ การตรวจสอบสิทธิ์ การค้นพบ onboard, catalog, wizard ความสามารถสื่อ นโยบาย replay, STT เสียงสดแบบเรียลไทม์ web-search/fetch และ stream แบบภายใน repo |
    | `plugin-sdk/provider-http-test-mocks` | mock HTTP/auth ของ Vitest แบบ opt-in ภายใน repo สำหรับการทดสอบผู้ให้บริการที่ทดสอบ `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | fixture ทั่วไปแบบภายใน repo สำหรับการบันทึก runtime ของ CLI, sandbox context, skill writer, agent-message, system-event, module reload, bundled plugin path, terminal-text, chunking, auth-token และ typed-case |
    | `plugin-sdk/test-node-mocks` | ตัวช่วย mock Node builtin แบบเจาะจงภายใน repo สำหรับใช้ใน factory ของ Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="เส้นทางย่อยของหน่วยความจำ">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/memory-core` | พื้นผิวตัวช่วย memory-core ที่รวมมาให้สำหรับตัวช่วย manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade runtime สำหรับดัชนี/การค้นหาหน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-foundation` | การส่งออกเอนจิน foundation ของ memory host |
    | `plugin-sdk/memory-core-host-engine-embeddings` | สัญญา embedding ของ memory host การเข้าถึงรีจิสทรี ผู้ให้บริการภายในเครื่อง และตัวช่วย batch/remote ทั่วไป |
    | `plugin-sdk/memory-core-host-engine-qmd` | การส่งออกเอนจิน QMD ของ memory host |
    | `plugin-sdk/memory-core-host-engine-storage` | การส่งออกเอนจิน storage ของ memory host |
    | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วย multimodal ของ memory host |
    | `plugin-sdk/memory-core-host-query` | ตัวช่วย query ของ memory host |
    | `plugin-sdk/memory-core-host-secret` | ตัวช่วย secret ของ memory host |
    | `plugin-sdk/memory-core-host-events` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | ตัวช่วย status ของ memory host |
    | `plugin-sdk/memory-core-host-runtime-cli` | ตัวช่วย runtime CLI ของ memory host |
    | `plugin-sdk/memory-core-host-runtime-core` | ตัวช่วย runtime core ของ memory host |
    | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วย file/runtime ของ memory host |
    | `plugin-sdk/memory-host-core` | นามแฝงที่เป็นกลางต่อผู้ขายสำหรับตัวช่วย runtime core ของ memory host |
    | `plugin-sdk/memory-host-events` | นามแฝงที่เป็นกลางต่อผู้ขายสำหรับตัวช่วย event journal ของ memory host |
    | `plugin-sdk/memory-host-files` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | ตัวช่วย managed-markdown ร่วมสำหรับ Plugin ที่อยู่ใกล้กับหน่วยความจำ |
    | `plugin-sdk/memory-host-search` | facade runtime ของ active memory สำหรับการเข้าถึง search-manager |
    | `plugin-sdk/memory-host-status` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="เส้นทางย่อยตัวช่วยที่รวมมาให้ซึ่งสงวนไว้">
    ขณะนี้ยังไม่มีเส้นทางย่อย SDK ของตัวช่วยที่รวมมาให้ซึ่งสงวนไว้ ตัวช่วยเฉพาะเจ้าของ
    อยู่ภายในแพ็กเกจ Plugin ที่เป็นเจ้าของ ขณะที่สัญญา host ที่ใช้ซ้ำได้
    ใช้เส้นทางย่อย SDK ทั่วไป เช่น `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` และ `plugin-sdk/plugin-config-runtime`
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวม SDK ของ Plugin](/th/plugins/sdk-overview)
- [การตั้งค่า SDK ของ Plugin](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
