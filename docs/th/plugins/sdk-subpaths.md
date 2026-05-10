---
read_when:
    - การเลือกพาธย่อย plugin-sdk ที่เหมาะสมสำหรับการนำเข้า Plugin
    - การตรวจสอบเส้นทางย่อยของ Plugin ที่รวมมาในชุดและส่วนต่อประสานตัวช่วย
summary: 'แค็ตตาล็อกพาธย่อยของ Plugin SDK: การนำเข้าใดอยู่ที่ไหน จัดกลุ่มตามพื้นที่'
title: เส้นทางย่อยของ Plugin SDK
x-i18n:
    generated_at: "2026-05-10T19:52:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddcb1223ce9f749e57e866cc0ed3329a1aeeb5d90d00568b5942f7f779086f1f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK ของ Plugin เปิดเผยเป็นชุดพาธย่อยสาธารณะแบบแคบภายใต้
`openclaw/plugin-sdk/` หน้านี้รวบรวมพาธย่อยที่ใช้กันทั่วไปโดยจัดกลุ่มตาม
วัตถุประสงค์ รายการ entrypoint ของคอมไพเลอร์ที่สร้างขึ้นอยู่ใน
`scripts/lib/plugin-sdk-entrypoints.json`; package exports คือชุดย่อยสาธารณะ
หลังจากหักพาธย่อยสำหรับการทดสอบ/ภายในเฉพาะ repo-local ที่ระบุไว้ใน
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` ผู้ดูแลสามารถตรวจสอบ
จำนวน public export ด้วย `pnpm plugin-sdk:surface` และพาธย่อย helper ที่สงวนไว้และใช้งานอยู่
ด้วย `pnpm plugins:boundary-report:summary`; helper exports ที่สงวนไว้แต่ไม่ได้ใช้งาน
จะทำให้รายงาน CI ล้มเหลว แทนที่จะคงอยู่ใน SDK สาธารณะเป็น
หนี้ความเข้ากันได้ที่หลับอยู่

สำหรับคู่มือการเขียน Plugin โปรดดู [ภาพรวม SDK ของ Plugin](/th/plugins/sdk-overview)

## รายการ Plugin

| พาธย่อย                        | exports หลัก                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | helper สำหรับรายการ migration provider เช่น `createMigrationItem`, ค่าคงที่ reason, ตัวทำเครื่องหมายสถานะรายการ, helper สำหรับการปกปิดข้อมูล และ `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | helper สำหรับ runtime migration เช่น `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` และ `writeMigrationReport`                                              |

### ความเข้ากันได้และ helper ทดสอบที่เลิกแนะนำแล้ว

พาธย่อยเหล่านี้ยังคงเป็น package exports สำหรับ Plugin รุ่นเก่าและชุดทดสอบของ OpenClaw
แต่โค้ดใหม่ไม่ควรเพิ่มการนำเข้าจากพาธเหล่านี้: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime` และ `zod` ในโค้ด Plugin ใหม่ให้นำเข้า `zod` โดยตรงจาก `zod`
`plugin-test-runtime` ยังคงเป็นพาธย่อย helper ทดสอบแบบเจาะจงที่ใช้งานอยู่

### พาธย่อยสาธารณะที่ไม่ได้ใช้งานและเลิกแนะนำแล้ว

พาธย่อยสาธารณะเหล่านี้มีอยู่มาอย่างน้อยหนึ่งเดือน และปัจจุบันไม่มี
การนำเข้าใน production ของ bundled extension พาธเหล่านี้ยังนำเข้าได้เพื่อความเข้ากันได้
แต่โค้ด Plugin ใหม่ควรใช้พาธย่อย SDK แบบเจาะจงที่มีการใช้งานจริงแทน:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config` และ `zalouser`

### พาธย่อยสาธารณะที่ใช้น้อยและเลิกแนะนำแล้ว

พาธย่อยสาธารณะที่ปัจจุบันใช้โดยเจ้าของ bundled plugin เพียงหนึ่งหรือสองราย
ก็เลิกแนะนำสำหรับโค้ด Plugin ใหม่เช่นกัน พาธเหล่านี้ยังคงเป็น package exports เพื่อความเข้ากันได้
แต่โค้ดใหม่ควรเลือกใช้ SDK seams ที่ใช้ร่วมกันและใช้งานอยู่ หรือ API ของแพ็กเกจที่ Plugin เป็นเจ้าของ
ผู้ดูแลติดตามชุดที่แน่นอนไว้ใน
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` และงบประมาณปัจจุบัน
ด้วย `pnpm plugin-sdk:surface`

### barrel กว้างที่เลิกแนะนำแล้ว

barrel re-export กว้างเหล่านี้ยังคง build ได้สำหรับซอร์สของ OpenClaw และ
การตรวจสอบความเข้ากันได้ แต่โค้ดใหม่ควรเลือกใช้พาธย่อย SDK แบบเจาะจง:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime` และ
`text-runtime` `channel-runtime`, `compat`, `config-types`, `infra-runtime`
และ `text-runtime` ยังคงเป็น package exports เพื่อความเข้ากันได้ย้อนหลังเท่านั้น; ให้ใช้
พาธย่อย channel/runtime แบบเจาะจง, `config-contracts`, `string-coerce-runtime`,
`text-chunking`, `text-utility-runtime` และ `logging-core` แทน

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | พาธย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | รายการส่งออกสคีมา Zod ของ `openclaw.json` ระดับราก (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | ตัวช่วยตรวจสอบความถูกต้องของ JSON Schema แบบแคชสำหรับสคีมาที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | ตัวช่วยวิซาร์ดตั้งค่าที่ใช้ร่วมกัน, พรอมต์ allowlist, ตัวสร้างสถานะการตั้งค่า |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | ตัวช่วยคอนฟิกหลายบัญชี/เกตการดำเนินการ, ตัวช่วยสำรองเป็นบัญชีเริ่มต้น |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ตัวช่วยทำให้ account-id เป็นรูปแบบมาตรฐาน |
    | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชี + สำรองเป็นค่าเริ่มต้น |
    | `plugin-sdk/account-helpers` | ตัวช่วยรายการบัญชี/การดำเนินการบัญชีแบบจำกัดขอบเขต |
    | `plugin-sdk/access-groups` | ตัวช่วยแยกวิเคราะห์ allowlist ของกลุ่มการเข้าถึงและวินิจฉัยกลุ่มแบบปกปิดข้อมูล |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | ตัวช่วยไปป์ไลน์การตอบกลับแบบเก่า โค้ดไปป์ไลน์การตอบกลับของช่องทางใหม่ควรใช้ `createChannelMessageReplyPipeline` และ `resolveChannelMessageSourceReplyDeliveryMode` จาก `plugin-sdk/channel-message` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | พริมิทีฟสคีมาคอนฟิกช่องทางที่ใช้ร่วมกัน รวมถึงตัวสร้าง Zod และ JSON/TypeBox โดยตรง |
    | `plugin-sdk/bundled-channel-config-schema` | สคีมาคอนฟิกช่องทาง OpenClaw ที่บันเดิลไว้สำหรับ Plugin ที่บันเดิลและดูแลอยู่เท่านั้น |
    | `plugin-sdk/channel-config-schema-legacy` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้วสำหรับสคีมาคอนฟิกช่องทางที่บันเดิลไว้ |
    | `plugin-sdk/telegram-command-config` | ตัวช่วยทำให้คำสั่งกำหนดเองของ Telegram เป็นรูปแบบมาตรฐาน/ตรวจสอบความถูกต้อง พร้อมการสำรองตามสัญญาที่บันเดิลไว้ |
    | `plugin-sdk/command-gating` | ตัวช่วยเกตการอนุญาตคำสั่งแบบจำกัดขอบเขต |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | facade ความเข้ากันได้ของการรับเข้าช่องทางระดับต่ำที่เลิกใช้แล้ว พาธรับใหม่ควรใช้ `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/channel-ingress-runtime` | ตัวแก้ไข runtime การรับเข้าช่องทางระดับสูงเชิงทดลอง และตัวสร้างข้อเท็จจริงของเส้นทางสำหรับพาธรับช่องทางที่ย้ายแล้ว แนะนำให้ใช้รายการนี้แทนการประกอบ allowlist ที่มีผล, allowlist ของคำสั่ง, และโปรเจกชันแบบเก่าในแต่ละ Plugin ดู [API การรับเข้าช่องทาง](/th/plugins/sdk-channel-ingress) |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, และตัวช่วยวงจรชีวิตสตรีมร่างแบบเก่า โค้ดสรุปผลพรีวิวใหม่ควรใช้ `plugin-sdk/channel-message` |
    | `plugin-sdk/channel-message` | ตัวช่วยสัญญาวงจรชีวิตข้อความราคาถูก เช่น `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, การอนุมาน capability แบบ durable-final, ตัวช่วยพิสูจน์ capability สำหรับ capability ด้านการส่ง/ใบรับ/ผลข้างเคียง, `MessageReceiveContext`, หลักฐานนโยบาย receive ack, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, หลักฐาน capability ของ live-preview และ live-finalizer, สถานะการกู้คืนแบบ durable, `RenderedMessageBatch`, ชนิดใบรับข้อความ, และตัวช่วย id ใบรับ ดู [API ข้อความช่องทาง](/th/plugins/sdk-channel-message) facade การกระจายการตอบกลับแบบเก่าเป็นเพียงความเข้ากันได้ที่เลิกใช้แล้ว |
    | `plugin-sdk/channel-message-runtime` | ตัวช่วยส่งมอบ runtime ที่อาจโหลดการส่งออก รวมถึง `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, และ `withDurableMessageSendContext` บริดจ์การกระจายการตอบกลับที่เลิกใช้แล้วยังคงนำเข้าได้สำหรับตัวกระจายความเข้ากันได้เท่านั้น ใช้จากโมดูล monitor/send runtime ไม่ใช่ไฟล์ bootstrap ของ Plugin ที่เป็น hot path |
    | `plugin-sdk/inbound-envelope` | ตัวช่วยเส้นทางขาเข้า + ตัวสร้าง envelope ที่ใช้ร่วมกัน |
    | `plugin-sdk/inbound-reply-dispatch` | ตัวช่วยบันทึกและกระจายขาเข้าที่ใช้ร่วมกันแบบเก่า, เพรดิเคตการกระจายแบบมองเห็นได้/สุดท้าย, และความเข้ากันได้ของ `deliverDurableInboundReplyPayload` ที่เลิกใช้แล้วสำหรับตัวกระจายช่องทางที่เตรียมไว้ โค้ดรับ/กระจายช่องทางใหม่ควรนำเข้าตัวช่วยวงจรชีวิต runtime จาก `plugin-sdk/channel-message-runtime` |
    | `plugin-sdk/messaging-targets` | ตัวช่วยแยกวิเคราะห์/จับคู่เป้าหมาย |
    | `plugin-sdk/outbound-media` | ตัวช่วยโหลดสื่อขาออกที่ใช้ร่วมกัน |
    | `plugin-sdk/outbound-send-deps` | การค้นหา dependency สำหรับการส่งขาออกแบบเบาสำหรับอะแดปเตอร์ช่องทาง |
    | `plugin-sdk/outbound-runtime` | ตัวช่วยตัวตนขาออก, delegate การส่ง, เซสชัน, การจัดรูปแบบ, และการวางแผน payload ตัวช่วยการส่งมอบโดยตรง เช่น `deliverOutboundPayloads` เป็น substrate ความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/channel-message-runtime` สำหรับพาธส่งใหม่ |
    | `plugin-sdk/poll-runtime` | ตัวช่วยทำให้ poll เป็นรูปแบบมาตรฐานแบบจำกัดขอบเขต |
    | `plugin-sdk/thread-bindings-runtime` | ตัวช่วยวงจรชีวิตและอะแดปเตอร์ของ thread-binding |
    | `plugin-sdk/agent-media-payload` | ตัวสร้าง payload สื่อของเอเจนต์แบบเก่า |
    | `plugin-sdk/conversation-runtime` | ตัวช่วยการผูก conversation/thread, การจับคู่, และ binding ที่กำหนดค่าไว้ |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วย snapshot คอนฟิก runtime |
    | `plugin-sdk/runtime-group-policy` | ตัวช่วยแก้ไข group-policy runtime |
    | `plugin-sdk/channel-status` | ตัวช่วย snapshot/สรุปสถานะช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/channel-config-primitives` | พริมิทีฟสคีมาคอนฟิกช่องทางแบบจำกัดขอบเขต |
    | `plugin-sdk/channel-config-writes` | ตัวช่วยอนุญาตการเขียนคอนฟิกช่องทาง |
    | `plugin-sdk/channel-plugin-common` | รายการส่งออก prelude ของ Plugin ช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/allowlist-config-edit` | ตัวช่วยแก้ไข/อ่านคอนฟิก allowlist |
    | `plugin-sdk/group-access` | ตัวช่วยตัดสินใจการเข้าถึงกลุ่มที่ใช้ร่วมกัน |
    | `plugin-sdk/direct-dm` | ตัวช่วย auth/guard ของ DM โดยตรงที่ใช้ร่วมกัน |
    | `plugin-sdk/discord` | facade ความเข้ากันได้ของ Discord ที่เลิกใช้แล้วสำหรับ `@openclaw/discord@2026.3.13` ที่เผยแพร่แล้วและความเข้ากันได้ของ owner ที่ติดตามอยู่; Plugin ใหม่ควรใช้พาธย่อย SDK ช่องทางทั่วไป |
    | `plugin-sdk/telegram-account` | facade ความเข้ากันได้ของการแก้ไขบัญชี Telegram ที่เลิกใช้แล้วสำหรับความเข้ากันได้ของ owner ที่ติดตามอยู่; Plugin ใหม่ควรใช้ตัวช่วย runtime ที่ฉีดเข้ามาหรือพาธย่อย SDK ช่องทางทั่วไป |
    | `plugin-sdk/zalouser` | facade ความเข้ากันได้ของ Zalo Personal ที่เลิกใช้แล้วสำหรับแพ็กเกจ Lark/Zalo ที่เผยแพร่แล้วซึ่งยังคงนำเข้าการอนุญาตคำสั่งผู้ส่ง; Plugin ใหม่ควรใช้ `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | การนำเสนอข้อความเชิงความหมาย, การส่งมอบ, และตัวช่วยตอบกลับแบบโต้ตอบแบบเก่า ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | barrel ความเข้ากันได้สำหรับ inbound debounce, การจับคู่ mention, ตัวช่วย mention-policy, และตัวช่วย envelope |
    | `plugin-sdk/channel-inbound-debounce` | ตัวช่วย inbound debounce แบบจำกัดขอบเขต |
    | `plugin-sdk/channel-mention-gating` | mention-policy, เครื่องหมาย mention, และตัวช่วยข้อความ mention แบบจำกัดขอบเขต โดยไม่มีพื้นผิว inbound runtime ที่กว้างกว่า |
    | `plugin-sdk/channel-envelope` | ตัวช่วยจัดรูปแบบ envelope ขาเข้าแบบจำกัดขอบเขต |
    | `plugin-sdk/channel-location` | ตัวช่วยบริบทตำแหน่งช่องทางและการจัดรูปแบบ |
    | `plugin-sdk/channel-logging` | ตัวช่วยบันทึกช่องทางสำหรับการทิ้งขาเข้าและความล้มเหลวของ typing/ack |
    | `plugin-sdk/channel-send-result` | ชนิดผลลัพธ์การตอบกลับ |
    | `plugin-sdk/channel-actions` | ตัวช่วย message-action ของช่องทาง รวมถึงตัวช่วยสคีมา native ที่เลิกใช้แล้วซึ่งเก็บไว้เพื่อความเข้ากันได้ของ Plugin |
    | `plugin-sdk/channel-route` | ตัวช่วยทำให้เส้นทางเป็นรูปแบบมาตรฐานที่ใช้ร่วมกัน, การแก้ไขเป้าหมายที่ขับเคลื่อนด้วย parser, การแปลง thread-id เป็นสตริง, คีย์เส้นทาง dedupe/compact, ชนิด parsed-target, และตัวช่วยเปรียบเทียบเส้นทาง/เป้าหมาย |
    | `plugin-sdk/channel-targets` | ตัวช่วยแยกวิเคราะห์เป้าหมาย; ผู้เรียกเปรียบเทียบเส้นทางควรใช้ `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | ชนิดสัญญาช่องทาง |
    | `plugin-sdk/channel-feedback` | การเชื่อมต่อ feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยสัญญา secret แบบจำกัดขอบเขต เช่น `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, และชนิดเป้าหมาย secret |
  </Accordion>

  <Accordion title="Provider subpaths">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | facade ของ provider LM Studio ที่รองรับ สำหรับการตั้งค่า การค้นพบแคตตาล็อก และการเตรียมโมเดลขณะรันไทม์ |
    | `plugin-sdk/lmstudio-runtime` | facade รันไทม์ของ LM Studio ที่รองรับ สำหรับค่าเริ่มต้นของเซิร์ฟเวอร์ในเครื่อง การค้นพบโมเดล ส่วนหัวคำขอ และตัวช่วยสำหรับโมเดลที่โหลดแล้ว |
    | `plugin-sdk/provider-setup` | ตัวช่วยตั้งค่า provider แบบ local/self-hosted ที่คัดสรรแล้ว |
    | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยตั้งค่า provider แบบ self-hosted ที่เข้ากันได้กับ OpenAI โดยเฉพาะ |
    | `plugin-sdk/cli-backend` | ค่าเริ่มต้นของแบ็กเอนด์ CLI + ค่าคงที่ของ watchdog |
    | `plugin-sdk/provider-auth-runtime` | ตัวช่วยแก้ค่า API-key ขณะรันไทม์สำหรับ Plugin ของ provider |
    | `plugin-sdk/provider-auth-api-key` | ตัวช่วย onboarding/เขียนโปรไฟล์สำหรับ API-key เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
    | `plugin-sdk/provider-env-vars` | ตัวช่วยค้นหา env-var สำหรับการยืนยันตัวตนของ provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, รายการส่งออกความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้าง replay-policy ที่ใช้ร่วมกัน, ตัวช่วย provider-endpoint และตัวช่วยปรับ model-id ให้เป็นมาตรฐานที่ใช้ร่วมกัน |
    | `plugin-sdk/provider-catalog-runtime` | hook รันไทม์สำหรับเสริมแคตตาล็อก provider และ seam ของรีจิสทรี plugin-provider สำหรับการทดสอบสัญญา |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | ตัวช่วยความสามารถ HTTP/endpoint ทั่วไปของ provider, ข้อผิดพลาด HTTP ของ provider และตัวช่วยฟอร์ม multipart สำหรับถอดเสียงเสียง |
    | `plugin-sdk/provider-web-fetch-contract` | ตัวช่วยสัญญา config/selection ของ web-fetch แบบแคบ เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | ตัวช่วยลงทะเบียน/แคช provider ของ web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วย config/credential ของ web-search แบบแคบสำหรับ provider ที่ไม่ต้องมีการต่อสายเปิดใช้งาน Plugin |
    | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญา config/credential ของ web-search แบบแคบ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวอ่าน credential แบบกำหนดขอบเขต |
    | `plugin-sdk/provider-web-search` | ตัวช่วยลงทะเบียน/แคช/รันไทม์ของ provider สำหรับ web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` และการล้าง schema + การวินิจฉัยของ Gemini |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` และรายการที่คล้ายกัน |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ประเภท wrapper ของสตรีม และตัวช่วย wrapper ที่ใช้ร่วมกันสำหรับ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | ตัวช่วย transport ดั้งเดิมของ provider เช่น fetch ที่มีการป้องกัน, การแปลงข้อความ transport และสตรีมเหตุการณ์ transport ที่เขียนได้ |
    | `plugin-sdk/provider-onboard` | ตัวช่วยแพตช์ config สำหรับ onboarding |
    | `plugin-sdk/global-singleton` | ตัวช่วย singleton/map/cache ภายในโปรเซส |
    | `plugin-sdk/group-activation` | โหมดเปิดใช้งานกลุ่มแบบแคบและตัวช่วยแยกวิเคราะห์คำสั่ง |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ตัวช่วยรีจิสทรีคำสั่ง รวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก, ตัวช่วยอนุญาตผู้ส่ง |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความคำสั่ง/ความช่วยเหลือ เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | ตัวช่วยแก้ค่า approver และยืนยันตัวตนการกระทำในแชตเดียวกัน |
    | `plugin-sdk/approval-client-runtime` | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติ exec ดั้งเดิม |
    | `plugin-sdk/approval-delivery-runtime` | อะแดปเตอร์ความสามารถ/การส่งมอบการอนุมัติดั้งเดิม |
    | `plugin-sdk/approval-gateway-runtime` | ตัวช่วยแก้ค่า Gateway การอนุมัติที่ใช้ร่วมกัน |
    | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยโหลดอะแดปเตอร์การอนุมัติดั้งเดิมแบบเบาสำหรับ entrypoint ของช่องทางที่เป็น hot path |
    | `plugin-sdk/approval-handler-runtime` | ตัวช่วยรันไทม์ของ handler การอนุมัติที่กว้างกว่า; ควรใช้ seam ของอะแดปเตอร์/Gateway ที่แคบกว่าเมื่อเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติดั้งเดิม + การผูกบัญชี |
    | `plugin-sdk/approval-reply-runtime` | ตัวช่วย payload ตอบกลับการอนุมัติ exec/plugin |
    | `plugin-sdk/approval-runtime` | ตัวช่วย payload การอนุมัติ exec/plugin, ตัวช่วยการกำหนดเส้นทาง/รันไทม์การอนุมัติดั้งเดิม และตัวช่วยแสดงผลการอนุมัติแบบมีโครงสร้าง เช่น `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | ตัวช่วยรีเซ็ตการขจัดรายการซ้ำของการตอบกลับขาเข้าแบบแคบ |
    | `plugin-sdk/channel-contract-testing` | ตัวช่วยทดสอบสัญญาช่องทางแบบแคบโดยไม่มี barrel การทดสอบแบบกว้าง |
    | `plugin-sdk/command-auth-native` | การยืนยันตัวตนคำสั่งดั้งเดิม, การจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก และตัวช่วย session-target ดั้งเดิม |
    | `plugin-sdk/command-detection` | ตัวช่วยตรวจจับคำสั่งที่ใช้ร่วมกัน |
    | `plugin-sdk/command-primitives-runtime` | predicate ข้อความคำสั่งแบบเบาสำหรับเส้นทางช่องทางที่เป็น hot path |
    | `plugin-sdk/command-surface` | การปรับ command-body ให้เป็นมาตรฐานและตัวช่วย command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยรวบรวม secret-contract แบบแคบสำหรับพื้นผิว secret ของช่องทาง/Plugin |
    | `plugin-sdk/secret-ref-runtime` | ตัวช่วยการพิมพ์ `coerceSecretRef` แบบแคบและ SecretRef สำหรับการแยกวิเคราะห์ secret-contract/config |
    | `plugin-sdk/security-runtime` | ความไว้วางใจที่ใช้ร่วมกัน, การ gate DM, ตัวช่วยไฟล์/พาธที่จำกัดด้วย root รวมถึงการเขียนแบบ create-only, การแทนที่ไฟล์แบบ atomic ทั้ง sync/async, การเขียน temp ข้างเคียง, fallback การย้ายข้ามอุปกรณ์, ตัวช่วย file-store ส่วนตัว, guard สำหรับ parent ของ symlink, external-content, การปกปิดข้อความอ่อนไหว, การเปรียบเทียบ secret แบบ constant-time และตัวช่วยรวบรวม secret |
    | `plugin-sdk/ssrf-policy` | ตัวช่วย allowlist ของโฮสต์และนโยบาย SSRF สำหรับเครือข่ายส่วนตัว |
    | `plugin-sdk/ssrf-dispatcher` | ตัวช่วย pinned-dispatcher แบบแคบโดยไม่มีพื้นผิวรันไทม์ infra แบบกว้าง |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, fetch ที่มี SSRF-guard, ข้อผิดพลาด SSRF และตัวช่วยนโยบาย SSRF |
    | `plugin-sdk/secret-input` | ตัวช่วยแยกวิเคราะห์อินพุต secret |
    | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ/เป้าหมาย Webhook และการบังคับชนิด websocket/body ดิบ |
    | `plugin-sdk/webhook-request-guards` | ตัวช่วยขนาด/timeout ของเนื้อหาคำขอ |
  </Accordion>

  <Accordion title="พาธย่อยของรันไทม์และพื้นที่จัดเก็บ">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | ตัวช่วยรันไทม์/การบันทึกล็อก/การสำรองข้อมูล/การติดตั้ง Plugin แบบกว้าง |
    | `plugin-sdk/runtime-env` | ตัวช่วย env รันไทม์, logger, timeout, retry และ backoff แบบแคบ |
    | `plugin-sdk/browser-config` | facade การกำหนดค่าเบราว์เซอร์ที่รองรับ สำหรับโปรไฟล์/ค่าเริ่มต้นที่ทำให้เป็นมาตรฐาน, การแยกวิเคราะห์ URL ของ CDP และตัวช่วย auth สำหรับการควบคุมเบราว์เซอร์ |
    | `plugin-sdk/channel-runtime-context` | ตัวช่วยลงทะเบียนและค้นหา runtime-context ของแชนเนลแบบทั่วไป |
    | `plugin-sdk/matrix` | facade ความเข้ากันได้กับ Matrix ที่เลิกใช้แล้วสำหรับแพ็กเกจแชนเนลของบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควร import `plugin-sdk/run-command` โดยตรง |
    | `plugin-sdk/mattermost` | facade ความเข้ากันได้กับ Mattermost ที่เลิกใช้แล้วสำหรับแพ็กเกจแชนเนลของบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควร import พาธย่อย SDK ทั่วไปโดยตรง |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | ตัวช่วยคำสั่ง/hook/http/interactive ของ Plugin ที่ใช้ร่วมกัน |
    | `plugin-sdk/hook-runtime` | ตัวช่วยไปป์ไลน์ webhook/hook ภายในที่ใช้ร่วมกัน |
    | `plugin-sdk/lazy-runtime` | ตัวช่วย import/binding รันไทม์แบบ lazy เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod` และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | ตัวช่วย exec ของกระบวนการ |
    | `plugin-sdk/cli-runtime` | ตัวช่วย CLI สำหรับการจัดรูปแบบ, การรอ, เวอร์ชัน, การเรียกใช้งานอาร์กิวเมนต์ และกลุ่มคำสั่งแบบ lazy |
    | `plugin-sdk/gateway-runtime` | ไคลเอนต์ Gateway, ตัวช่วยเริ่มไคลเอนต์เมื่อ event loop พร้อม, RPC ของ CLI สำหรับ gateway, ข้อผิดพลาดของโปรโตคอล gateway และตัวช่วย patch สถานะแชนเนล |
    | `plugin-sdk/config-contracts` | พื้นผิว config แบบ type-only ที่เน้นเฉพาะสำหรับรูปร่าง config ของ Plugin เช่น `OpenClawConfig` และประเภท config ของแชนเนล/ผู้ให้บริการ |
    | `plugin-sdk/plugin-config-runtime` | ตัวช่วยค้นหา plugin-config ขณะรันไทม์ เช่น `requireRuntimeConfig`, `resolvePluginConfigObject` และ `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | ตัวช่วยเปลี่ยนแปลง config แบบทรานแซกชัน เช่น `mutateConfigFile`, `replaceConfigFile` และ `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วยสแนปชอต config ของกระบวนการปัจจุบัน เช่น `getRuntimeConfig`, `getRuntimeConfigSnapshot` และตัวตั้งค่าสแนปชอตสำหรับการทดสอบ |
    | `plugin-sdk/telegram-command-config` | การทำให้ชื่อ/คำอธิบายคำสั่ง Telegram เป็นมาตรฐาน และการตรวจสอบรายการซ้ำ/ข้อขัดแย้ง แม้เมื่อไม่มีพื้นผิวสัญญา Telegram ที่รวมมาให้ใช้งาน |
    | `plugin-sdk/text-autolink-runtime` | การตรวจจับ autolink สำหรับการอ้างอิงไฟล์โดยไม่ใช้ barrel ข้อความแบบกว้าง |
    | `plugin-sdk/approval-runtime` | ตัวช่วยการอนุมัติ exec/Plugin, ตัวสร้าง approval-capability, ตัวช่วย auth/profile, ตัวช่วยการกำหนดเส้นทาง/รันไทม์แบบ native และการจัดรูปแบบพาธแสดงผลการอนุมัติแบบมีโครงสร้าง |
    | `plugin-sdk/reply-runtime` | ตัวช่วยรันไทม์ขาเข้า/การตอบกลับที่ใช้ร่วมกัน, การแบ่ง chunk, การ dispatch, heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วย dispatch/finalize การตอบกลับและป้ายกำกับการสนทนาแบบแคบ |
    | `plugin-sdk/reply-history` | ตัวช่วยและ marker ประวัติการตอบกลับช่วงสั้นที่ใช้ร่วมกัน เช่น `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` และ `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ตัวช่วยแบ่ง chunk ข้อความ/markdown แบบแคบ |
    | `plugin-sdk/session-store-runtime` | ตัวช่วยพาธของ session store, session-key, updated-at และการเปลี่ยนแปลง store |
    | `plugin-sdk/cron-store-runtime` | ตัวช่วยพาธ/load/save ของ Cron store |
    | `plugin-sdk/state-paths` | ตัวช่วยพาธไดเรกทอรี State/OAuth |
    | `plugin-sdk/routing` | ตัวช่วยผูก route/session-key/account เช่น `resolveAgentRoute`, `buildAgentSessionKey` และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ตัวช่วยสรุปสถานะแชนเนล/account ที่ใช้ร่วมกัน, ค่าเริ่มต้น runtime-state และตัวช่วย metadata ของ issue |
    | `plugin-sdk/target-resolver-runtime` | ตัวช่วย target resolver ที่ใช้ร่วมกัน |
    | `plugin-sdk/string-normalization-runtime` | ตัวช่วยทำให้ slug/string เป็นมาตรฐาน |
    | `plugin-sdk/request-url` | แยก URL แบบสตริงจากอินพุตที่คล้าย fetch/request |
    | `plugin-sdk/run-command` | ตัวรันคำสั่งแบบมีเวลา พร้อมผลลัพธ์ stdout/stderr ที่ทำให้เป็นมาตรฐาน |
    | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ tool/CLI ทั่วไป |
    | `plugin-sdk/tool-payload` | แยก payload ที่ทำให้เป็นมาตรฐานจากอ็อบเจกต์ผลลัพธ์ของ tool |
    | `plugin-sdk/tool-send` | แยกฟิลด์เป้าหมายการส่งแบบ canonical จากอาร์กิวเมนต์ของ tool |
    | `plugin-sdk/temp-path` | ตัวช่วยพาธดาวน์โหลดชั่วคราวที่ใช้ร่วมกัน และพื้นที่ทำงานชั่วคราวแบบส่วนตัวที่ปลอดภัย |
    | `plugin-sdk/logging-core` | ตัวช่วย logger ของระบบย่อยและการปกปิดข้อมูล |
    | `plugin-sdk/markdown-table-runtime` | ตัวช่วยโหมดตาราง Markdown และการแปลง |
    | `plugin-sdk/model-session-runtime` | ตัวช่วย override โมเดล/session เช่น `applyModelOverrideToSessionEntry` และ `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | ตัวช่วย resolve config ของผู้ให้บริการ Talk |
    | `plugin-sdk/json-store` | ตัวช่วยอ่าน/เขียนสถานะ JSON ขนาดเล็ก |
    | `plugin-sdk/file-lock` | ตัวช่วย file-lock แบบ re-entrant |
    | `plugin-sdk/persistent-dedupe` | ตัวช่วยแคช dedupe ที่สำรองด้วยดิสก์ |
    | `plugin-sdk/acp-runtime` | ตัวช่วยรันไทม์/session และ reply-dispatch ของ ACP |
    | `plugin-sdk/acp-runtime-backend` | ตัวช่วยลงทะเบียน backend ของ ACP และ reply-dispatch แบบเบาสำหรับ Plugin ที่โหลดตอน startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | การ resolve binding ของ ACP แบบอ่านอย่างเดียวโดยไม่ import lifecycle startup |
    | `plugin-sdk/agent-config-primitives` | primitive ของ config-schema รันไทม์ agent แบบแคบ |
    | `plugin-sdk/boolean-param` | ตัวอ่านพารามิเตอร์ boolean แบบหลวม |
    | `plugin-sdk/dangerous-name-runtime` | ตัวช่วย resolve การจับคู่ dangerous-name |
    | `plugin-sdk/device-bootstrap` | ตัวช่วย bootstrap อุปกรณ์และโทเค็นจับคู่ |
    | `plugin-sdk/extension-shared` | primitive ตัวช่วย passive-channel, status และ ambient proxy ที่ใช้ร่วมกัน |
    | `plugin-sdk/models-provider-runtime` | ตัวช่วยการตอบกลับคำสั่ง/ผู้ให้บริการ `/models` |
    | `plugin-sdk/skill-commands-runtime` | ตัวช่วยแสดงรายการคำสั่ง Skill |
    | `plugin-sdk/native-command-registry` | ตัวช่วย registry/build/serialize ของคำสั่ง native |
    | `plugin-sdk/agent-harness` | พื้นผิว trusted-plugin แบบทดลองสำหรับ harness ของ agent ระดับต่ำ: ประเภท harness, ตัวช่วย steer/abort ของ active-run, ตัวช่วย bridge ของ OpenClaw tool, ตัวช่วยนโยบาย tool ของ runtime-plan, การจัดประเภทผลลัพธ์ terminal, ตัวช่วยจัดรูปแบบ/รายละเอียดความคืบหน้าของ tool และยูทิลิตี้ผลลัพธ์ของ attempt |
    | `plugin-sdk/provider-zai-endpoint` | facade การตรวจจับ endpoint ที่ Z.AI provider เป็นเจ้าของซึ่งเลิกใช้แล้ว; ใช้ API สาธารณะของ Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | ตัวช่วย async lock เฉพาะกระบวนการสำหรับไฟล์สถานะรันไทม์ขนาดเล็ก |
    | `plugin-sdk/channel-activity-runtime` | ตัวช่วย telemetry กิจกรรมแชนเนล |
    | `plugin-sdk/concurrency-runtime` | ตัวช่วยควบคุม concurrency ของงาน async แบบจำกัด |
    | `plugin-sdk/dedupe-runtime` | ตัวช่วยแคช dedupe ในหน่วยความจำ |
    | `plugin-sdk/delivery-queue-runtime` | ตัวช่วย drain pending-delivery ขาออก |
    | `plugin-sdk/file-access-runtime` | ตัวช่วยพาธไฟล์ในเครื่องและแหล่งสื่ออย่างปลอดภัย |
    | `plugin-sdk/heartbeat-runtime` | ตัวช่วย wake, event และ visibility ของ Heartbeat |
    | `plugin-sdk/number-runtime` | ตัวช่วย coercion ตัวเลข |
    | `plugin-sdk/secure-random-runtime` | ตัวช่วยโทเค็น/UUID ที่ปลอดภัย |
    | `plugin-sdk/system-event-runtime` | ตัวช่วยคิวเหตุการณ์ระบบ |
    | `plugin-sdk/transport-ready-runtime` | ตัวช่วยรอความพร้อมของ transport |
    | `plugin-sdk/infra-runtime` | shim ความเข้ากันได้ที่เลิกใช้แล้ว; ใช้พาธย่อยรันไทม์ที่เน้นเฉพาะด้านบน |
    | `plugin-sdk/collection-runtime` | ตัวช่วยแคชขนาดเล็กแบบมีขอบเขต |
    | `plugin-sdk/diagnostic-runtime` | ตัวช่วย flag, event และ trace-context สำหรับ diagnostic |
    | `plugin-sdk/error-runtime` | ตัวช่วยกราฟข้อผิดพลาด, การจัดรูปแบบ, การจัดประเภทข้อผิดพลาดที่ใช้ร่วมกัน, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch แบบ wrapper, proxy, ตัวเลือก EnvHttpProxyAgent และตัวช่วย lookup แบบปักหมุด |
    | `plugin-sdk/runtime-fetch` | fetch ของรันไทม์ที่รับรู้ dispatcher โดยไม่ import proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | ตัวอ่าน response-body แบบมีขอบเขตโดยไม่ใช้พื้นผิวรันไทม์สื่อแบบกว้าง |
    | `plugin-sdk/session-binding-runtime` | สถานะ binding ของการสนทนาปัจจุบันโดยไม่ใช้ routing ของ binding ที่กำหนดค่าไว้หรือ pairing store |
    | `plugin-sdk/session-store-runtime` | ตัวช่วย session-store โดยไม่ import การเขียน/บำรุงรักษา config แบบกว้าง |
    | `plugin-sdk/context-visibility-runtime` | การ resolve context visibility และการกรอง context เสริมโดยไม่ import config/security แบบกว้าง |
    | `plugin-sdk/string-coerce-runtime` | ตัวช่วย coercion และ normalization ของ primitive record/string แบบแคบโดยไม่ import markdown/logging |
    | `plugin-sdk/host-runtime` | ตัวช่วยทำให้ hostname และ SCP host เป็นมาตรฐาน |
    | `plugin-sdk/retry-runtime` | ตัวช่วย config การ retry และตัวรัน retry |
    | `plugin-sdk/agent-runtime` | ตัวช่วยไดเรกทอรี/identity/workspace ของ agent รวมถึง `resolveAgentDir`, `resolveDefaultAgentDir` และ export ความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว |
    | `plugin-sdk/directory-runtime` | การ query/dedup ไดเรกทอรีที่อิงตาม config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="เส้นทางย่อยสำหรับความสามารถและการทดสอบ">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | ตัวช่วยสื่อที่ใช้ร่วมกันสำหรับดึงข้อมูล/แปลง/จัดเก็บ, การตรวจสอบมิติวิดีโอที่ใช้ ffprobe รองรับ และตัวสร้างเพย์โหลดสื่อ |
    | `plugin-sdk/media-mime` | การทำให้ MIME เป็นมาตรฐานแบบจำกัดขอบเขต, การแมปนามสกุลไฟล์, การตรวจจับ MIME และตัวช่วยชนิดสื่อ |
    | `plugin-sdk/media-store` | ตัวช่วยจัดเก็บสื่อแบบจำกัดขอบเขต เช่น `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | ตัวช่วยการสร้างสื่อที่ใช้ร่วมกันสำหรับการสลับเมื่อเกิดความล้มเหลว, การเลือกตัวเลือก และข้อความเมื่อไม่มีโมเดล |
    | `plugin-sdk/media-understanding` | ประเภทผู้ให้บริการการทำความเข้าใจสื่อ รวมถึงการส่งออกตัวช่วยรูปภาพ/เสียงสำหรับผู้ให้บริการ |
    | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งกลุ่ม/เรนเดอร์ข้อความและมาร์กดาวน์, การแปลงตารางมาร์กดาวน์, การลบแท็กคำสั่ง และยูทิลิตีข้อความปลอดภัย |
    | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งกลุ่มข้อความขาออก |
    | `plugin-sdk/speech` | ประเภทผู้ให้บริการเสียงพูด รวมถึงการส่งออกคำสั่ง, รีจิสทรี, การตรวจสอบความถูกต้อง, ตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI และตัวช่วยเสียงพูดสำหรับผู้ให้บริการ |
    | `plugin-sdk/speech-core` | ประเภทผู้ให้บริการเสียงพูดที่ใช้ร่วมกัน, รีจิสทรี, คำสั่ง, การทำให้เป็นมาตรฐาน และการส่งออกตัวช่วยเสียงพูด |
    | `plugin-sdk/realtime-transcription` | ประเภทผู้ให้บริการการถอดเสียงเรียลไทม์, ตัวช่วยรีจิสทรี และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
    | `plugin-sdk/realtime-voice` | ประเภทผู้ให้บริการเสียงเรียลไทม์และตัวช่วยรีจิสทรี |
    | `plugin-sdk/image-generation` | ประเภทผู้ให้บริการการสร้างรูปภาพ รวมถึงตัวช่วยสินทรัพย์รูปภาพ/URL ข้อมูล และตัวสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
    | `plugin-sdk/image-generation-core` | ประเภทการสร้างรูปภาพที่ใช้ร่วมกัน, การสลับเมื่อเกิดความล้มเหลว, การยืนยันตัวตน และตัวช่วยรีจิสทรี |
    | `plugin-sdk/music-generation` | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์การสร้างเพลง |
    | `plugin-sdk/music-generation-core` | ประเภทการสร้างเพลงที่ใช้ร่วมกัน, ตัวช่วยการสลับเมื่อเกิดความล้มเหลว, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์การอ้างอิงโมเดล |
    | `plugin-sdk/video-generation` | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์การสร้างวิดีโอ |
    | `plugin-sdk/video-generation-core` | ประเภทการสร้างวิดีโอที่ใช้ร่วมกัน, ตัวช่วยการสลับเมื่อเกิดความล้มเหลว, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์การอ้างอิงโมเดล |
    | `plugin-sdk/webhook-targets` | รีจิสทรีเป้าหมาย Webhook และตัวช่วยติดตั้งเส้นทาง |
    | `plugin-sdk/webhook-path` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | ตัวช่วยโหลดสื่อระยะไกล/ภายในเครื่องที่ใช้ร่วมกัน |
    | `plugin-sdk/zod` | การส่งออกซ้ำเพื่อความเข้ากันได้ที่เลิกใช้แล้ว; นำเข้า `zod` จาก `zod` โดยตรง |
    | `plugin-sdk/testing` | barrel ความเข้ากันได้ที่เลิกใช้แล้วภายใน repo สำหรับการทดสอบ OpenClaw แบบเดิม การทดสอบใหม่ใน repo ควรนำเข้าเส้นทางย่อยการทดสอบภายในเครื่องที่เจาะจง เช่น `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` หรือ `plugin-sdk/test-fixtures` แทน |
    | `plugin-sdk/plugin-test-api` | ตัวช่วย `createTestPluginApi` ขั้นต่ำภายใน repo สำหรับการทดสอบหน่วยการลงทะเบียน Plugin โดยตรง โดยไม่ต้องนำเข้า bridge ของตัวช่วยทดสอบใน repo |
    | `plugin-sdk/agent-runtime-test-contracts` | fixture สัญญาอะแดปเตอร์ agent-runtime ดั้งเดิมภายใน repo สำหรับการทดสอบการยืนยันตัวตน, การส่งมอบ, fallback, tool-hook, prompt-overlay, schema และการฉาย transcript |
    | `plugin-sdk/channel-test-helpers` | ตัวช่วยทดสอบที่เน้นช่องทางภายใน repo สำหรับสัญญา actions/setup/status ทั่วไป, การยืนยันไดเรกทอรี, วงจรชีวิตการเริ่มบัญชี, เธรด send-config, mock รันไทม์, ปัญหาสถานะ, การส่งมอบขาออก และการลงทะเบียน hook |
    | `plugin-sdk/channel-target-testing` | ชุดกรณีข้อผิดพลาดของการแก้ไขเป้าหมายที่ใช้ร่วมกันภายใน repo สำหรับการทดสอบช่องทาง |
    | `plugin-sdk/plugin-test-contracts` | ตัวช่วยสัญญาแพ็กเกจ Plugin, การลงทะเบียน, artifact สาธารณะ, การนำเข้าโดยตรง, API รันไทม์ และผลข้างเคียงจากการนำเข้าภายใน repo |
    | `plugin-sdk/provider-test-contracts` | ตัวช่วยสัญญารันไทม์ผู้ให้บริการ, การยืนยันตัวตน, การค้นพบ, onboard, แคตตาล็อก, wizard, ความสามารถด้านสื่อ, นโยบาย replay, เสียงสด STT เรียลไทม์, web-search/fetch และ stream ภายใน repo |
    | `plugin-sdk/provider-http-test-mocks` | mock HTTP/การยืนยันตัวตนของ Vitest แบบเลือกใช้ภายใน repo สำหรับการทดสอบผู้ให้บริการที่ใช้งาน `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | fixture ทั่วไปภายใน repo สำหรับการจับรันไทม์ CLI, บริบท sandbox, ตัวเขียน skill, agent-message, system-event, การโหลดโมดูลซ้ำ, เส้นทาง Plugin ที่รวมมา, terminal-text, chunking, auth-token และ typed-case |
    | `plugin-sdk/test-node-mocks` | ตัวช่วย mock บิลต์อินของ Node แบบเจาะจงภายใน repo สำหรับใช้ภายใน factory ของ Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="เส้นทางย่อยของหน่วยความจำ">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/memory-core` | พื้นผิวตัวช่วย memory-core ที่รวมมา สำหรับตัวช่วย manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade รันไทม์ดัชนี/การค้นหาหน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-foundation` | การส่งออกเอนจิน foundation ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | สัญญา embedding ของโฮสต์หน่วยความจำ, การเข้าถึงรีจิสทรี, ผู้ให้บริการภายในเครื่อง และตัวช่วย batch/remote ทั่วไป |
    | `plugin-sdk/memory-core-host-engine-qmd` | การส่งออกเอนจิน QMD ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-storage` | การส่งออกเอนจิน storage ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วยมัลติโหมดของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-query` | ตัวช่วย query ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-secret` | ตัวช่วย secret ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-events` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | ตัวช่วยสถานะของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-cli` | ตัวช่วยรันไทม์ CLI ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-core` | ตัวช่วยรันไทม์ core ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-core` | นามแฝงที่เป็นกลางต่อผู้ขายสำหรับตัวช่วยรันไทม์ core ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-events` | นามแฝงที่เป็นกลางต่อผู้ขายสำหรับตัวช่วยสมุดบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-files` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | ตัวช่วย managed-markdown ที่ใช้ร่วมกันสำหรับ Plugin ที่อยู่ใกล้เคียงกับหน่วยความจำ |
    | `plugin-sdk/memory-host-search` | facade รันไทม์ Active Memory สำหรับการเข้าถึง search-manager |
    | `plugin-sdk/memory-host-status` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="เส้นทางย่อยตัวช่วยที่รวมมาและสงวนไว้">
    ขณะนี้ยังไม่มีเส้นทางย่อย SDK ของตัวช่วยที่รวมมาและสงวนไว้ ตัวช่วยเฉพาะเจ้าของ
    อยู่ภายในแพ็กเกจ Plugin ที่เป็นเจ้าของ ขณะที่สัญญาโฮสต์ที่นำกลับมาใช้ใหม่ได้
    ใช้เส้นทางย่อย SDK ทั่วไป เช่น `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` และ `plugin-sdk/plugin-config-runtime`
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
