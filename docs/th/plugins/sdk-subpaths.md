---
read_when:
    - การเลือกพาธย่อย plugin-sdk ที่เหมาะสมสำหรับการนำเข้า Plugin
    - การตรวจสอบเส้นทางย่อยของ Plugin ที่รวมมาด้วยและพื้นผิวตัวช่วย
summary: 'แคตตาล็อกเส้นทางย่อยของ Plugin SDK: การนำเข้าใดอยู่ที่ใด โดยจัดกลุ่มตามพื้นที่'
title: พาธย่อยของ Plugin SDK
x-i18n:
    generated_at: "2026-05-06T09:25:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98b16cd3fcd6babc64df20ad4e679c35553fc21894617f30907bbf0e579a4d89
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK ของ Plugin เปิดให้ใช้เป็นชุดของพาธย่อยแบบจำกัดภายใต้ `openclaw/plugin-sdk/`
หน้านี้รวบรวมพาธย่อยที่ใช้บ่อยโดยจัดกลุ่มตามวัตถุประสงค์ รายการทั้งหมดที่สร้างขึ้น
ซึ่งมีพาธย่อยมากกว่า 200 รายการอยู่ใน `scripts/lib/plugin-sdk-entrypoints.json`;
พาธย่อยตัวช่วยของ Plugin ที่บันเดิลมาและถูกสงวนไว้จะปรากฏอยู่ที่นั่น แต่ถือเป็น
รายละเอียดการใช้งานภายใน เว้นแต่หน้าเอกสารจะระบุยกระดับไว้อย่างชัดเจน ผู้ดูแลสามารถตรวจสอบ
พาธย่อยตัวช่วยที่สงวนไว้ซึ่งยังใช้งานอยู่ได้ด้วย `pnpm plugins:boundary-report:summary`; การส่งออก
ตัวช่วยที่สงวนไว้แต่ไม่ได้ใช้งานจะทำให้รายงาน CI ล้มเหลว แทนที่จะค้างอยู่ใน SDK สาธารณะ
เป็นหนี้ความเข้ากันได้ที่ไม่ทำงาน

สำหรับคู่มือการเขียน Plugin โปรดดู [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## จุดเข้าของ Plugin

| พาธย่อย                                   | การส่งออกหลัก                                                                                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
| `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
| `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
| `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
| `plugin-sdk/testing`                      | บาร์เรลความเข้ากันได้แบบกว้างสำหรับการทดสอบ Plugin เดิม; ควรใช้พาธย่อยการทดสอบที่เจาะจงสำหรับการทดสอบส่วนขยายใหม่                                                                     |
| `plugin-sdk/plugin-test-api`              | ตัวสร้างม็อก `OpenClawPluginApi` ขั้นต่ำสำหรับการทดสอบหน่วยการลงทะเบียน Plugin โดยตรง                                                                                           |
| `plugin-sdk/agent-runtime-test-contracts` | ฟิกซ์เจอร์สัญญาอะแดปเตอร์รันไทม์เอเจนต์แบบเนทีฟสำหรับโปรไฟล์การรับรองตัวตน, การระงับการส่ง, การจัดประเภท fallback, hook ของเครื่องมือ, prompt overlays, สคีมา และการซ่อมแซมทรานสคริปต์ |
| `plugin-sdk/channel-test-helpers`         | ตัวช่วยทดสอบสัญญาของช่องทางแบบทั่วไป รวมถึงวงจรชีวิตบัญชีช่องทาง, ไดเรกทอรี, การกำหนดค่าการส่ง, ม็อกรันไทม์, hook, จุดเข้าของช่องทางที่บันเดิลมา, เวลาประทับของซอง, การตอบกลับการจับคู่   |
| `plugin-sdk/channel-target-testing`       | ชุดทดสอบกรณีข้อผิดพลาดของการแก้เป้าหมายช่องทางที่ใช้ร่วมกัน                                                                                                                       |
| `plugin-sdk/plugin-test-contracts`        | ตัวช่วยสัญญาสำหรับการลงทะเบียน Plugin, แมนิเฟสต์แพ็กเกจ, อาร์ติแฟกต์สาธารณะ, API รันไทม์, side effect จากการนำเข้า และการนำเข้าโดยตรง                                                  |
| `plugin-sdk/plugin-test-runtime`          | ฟิกซ์เจอร์สำหรับการทดสอบรันไทม์ของ Plugin, รีจิสทรี, การลงทะเบียนผู้ให้บริการ, วิซาร์ดการตั้งค่า และ TaskFlow รันไทม์                                                                      |
| `plugin-sdk/provider-test-contracts`      | ตัวช่วยสัญญาสำหรับรันไทม์ผู้ให้บริการ, การรับรองตัวตน, การค้นพบ, การเริ่มใช้งาน, แค็ตตาล็อก, ความสามารถด้านสื่อ, นโยบายการเล่นซ้ำ, เสียงสด STT แบบเรียลไทม์, การค้นหา/ดึงข้อมูลเว็บ และวิซาร์ด                 |
| `plugin-sdk/provider-http-test-mocks`     | ม็อก HTTP/การรับรองตัวตนของ Vitest แบบเลือกใช้ สำหรับการทดสอบผู้ให้บริการที่ใช้งาน `plugin-sdk/provider-http`                                                                                    |
| `plugin-sdk/test-env`                     | ฟิกซ์เจอร์สภาพแวดล้อมการทดสอบ, fetch/เครือข่าย, เซิร์ฟเวอร์ HTTP แบบใช้แล้วทิ้ง, คำขอขาเข้า, การทดสอบสด, ระบบไฟล์ชั่วคราว และการควบคุมเวลา                                        |
| `plugin-sdk/test-fixtures`                | ฟิกซ์เจอร์การทดสอบทั่วไปสำหรับ CLI, แซนด์บ็อกซ์, skill, ข้อความเอเจนต์, เหตุการณ์ระบบ, การโหลดโมดูลซ้ำ, พาธ Plugin ที่บันเดิลมา, เทอร์มินัล, การแบ่งชิ้น, โทเค็นการรับรองตัวตน และเคสที่มีชนิดกำกับ                   |
| `plugin-sdk/test-node-mocks`              | ตัวช่วยม็อก built-in ของ Node แบบเจาะจงสำหรับใช้ภายในแฟกทอรี Vitest `vi.mock("node:*")`                                                                                        |
| `plugin-sdk/migration`                    | ตัวช่วยรายการผู้ให้บริการการย้ายข้อมูล เช่น `createMigrationItem`, ค่าคงที่เหตุผล, ตัวทำเครื่องหมายสถานะรายการ, ตัวช่วยการปกปิดข้อมูล และ `summarizeMigrationItems`                       |
| `plugin-sdk/migration-runtime`            | ตัวช่วยการย้ายข้อมูลระหว่างรันไทม์ เช่น `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` และ `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="พาธย่อยของช่องทาง">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | การส่งออก Zod schema ของ `openclaw.json` ระดับราก (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | ตัวช่วยตัวช่วยสร้างการตั้งค่าที่ใช้ร่วมกัน, พรอมป์ allowlist, ตัวสร้างสถานะการตั้งค่า |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | ตัวช่วยการตั้งค่า/เกตการกระทำแบบหลายบัญชี, ตัวช่วยการ fallback ไปยังบัญชีเริ่มต้น |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ตัวช่วยการทำให้ account-id เป็นรูปแบบมาตรฐาน |
    | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชีและ fallback ไปยังค่าเริ่มต้น |
    | `plugin-sdk/account-helpers` | ตัวช่วยรายการบัญชี/การกระทำของบัญชีแบบแคบ |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | ตัวช่วยไปป์ไลน์การตอบกลับแบบเดิม โค้ดไปป์ไลน์การตอบกลับของช่องทางใหม่ควรใช้ `createChannelMessageReplyPipeline` และ `resolveChannelMessageSourceReplyDeliveryMode` จาก `plugin-sdk/channel-message` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | primitive ของ schema การตั้งค่าช่องทางที่ใช้ร่วมกัน รวมถึงตัวสร้าง Zod และ JSON/TypeBox โดยตรง |
    | `plugin-sdk/bundled-channel-config-schema` | schema การตั้งค่าช่องทาง OpenClaw ที่รวมมาสำหรับ Plugin ที่รวมมาและดูแลรักษาเท่านั้น |
    | `plugin-sdk/channel-config-schema-legacy` | alias ความเข้ากันได้ที่เลิกใช้แล้วสำหรับ schema การตั้งค่าช่องทางที่รวมมา |
    | `plugin-sdk/telegram-command-config` | ตัวช่วยการทำให้เป็นมาตรฐาน/การตรวจสอบความถูกต้องของคำสั่งแบบกำหนดเองของ Telegram พร้อม fallback ของสัญญาที่รวมมา |
    | `plugin-sdk/command-gating` | ตัวช่วยเกตการอนุญาตคำสั่งแบบแคบ |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` และตัวช่วยวงจรชีวิตสตรีมแบบร่างเดิม โค้ดการสรุปตัวอย่างใหม่ควรใช้ `plugin-sdk/channel-message` |
    | `plugin-sdk/channel-message` | ตัวช่วยสัญญาวงจรชีวิตข้อความราคาถูก เช่น `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, facade ความเข้ากันได้, การสืบทอดความสามารถ durable-final, ตัวช่วยพิสูจน์ความสามารถสำหรับความสามารถด้านการส่ง/ใบรับ/ผลข้างเคียง, `MessageReceiveContext`, การพิสูจน์นโยบาย receive ack, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, การพิสูจน์ความสามารถ live-preview และ live-finalizer, สถานะการกู้คืนแบบทนทาน, `RenderedMessageBatch`, ชนิดใบรับข้อความ และตัวช่วย id ใบรับ ดู [API ข้อความช่องทาง](/th/plugins/sdk-channel-message) `createChannelTurnReplyPipeline` แบบเดิมยังคงมีไว้สำหรับตัวส่งแบบเข้ากันได้เท่านั้น |
    | `plugin-sdk/channel-message-runtime` | ตัวช่วยการส่งมอบใน runtime ที่อาจโหลดการส่งออกขาออก รวมถึง `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, `withDurableMessageSendContext`, `dispatchChannelMessageReplyWithBase` และ `recordChannelMessageReplyDispatch` ใช้จากโมดูล runtime สำหรับ monitor/send ไม่ใช่ไฟล์ bootstrap ของ Plugin ที่ร้อน |
    | `plugin-sdk/inbound-envelope` | ตัวช่วย route ขาเข้าและตัวสร้าง envelope ที่ใช้ร่วมกัน |
    | `plugin-sdk/inbound-reply-dispatch` | ตัวช่วยบันทึกและส่งต่อขาเข้าที่ใช้ร่วมกันแบบเดิม, predicate การส่งต่อแบบมองเห็น/สุดท้าย และความเข้ากันได้ `deliverDurableInboundReplyPayload` ที่เลิกใช้แล้วสำหรับตัวส่งช่องทางที่เตรียมไว้ โค้ดรับ/ส่งต่อของช่องทางใหม่ควรนำเข้าตัวช่วยวงจรชีวิต runtime จาก `plugin-sdk/channel-message-runtime` |
    | `plugin-sdk/messaging-targets` | ตัวช่วยแยกวิเคราะห์/จับคู่เป้าหมาย |
    | `plugin-sdk/outbound-media` | ตัวช่วยโหลดสื่อขาออกที่ใช้ร่วมกัน |
    | `plugin-sdk/outbound-send-deps` | การค้นหา dependency สำหรับการส่งขาออกแบบเบาสำหรับ adapter ช่องทาง |
    | `plugin-sdk/outbound-runtime` | ตัวช่วยการส่งมอบขาออก, identity, send delegate, session, การจัดรูปแบบ และการวางแผน payload |
    | `plugin-sdk/poll-runtime` | ตัวช่วยการทำให้ poll เป็นมาตรฐานแบบแคบ |
    | `plugin-sdk/thread-bindings-runtime` | ตัวช่วยวงจรชีวิตและ adapter ของ thread-binding |
    | `plugin-sdk/agent-media-payload` | ตัวสร้าง payload สื่อของ agent แบบเดิม |
    | `plugin-sdk/conversation-runtime` | ตัวช่วยการผูก conversation/thread, การจับคู่ และการผูกที่ตั้งค่าไว้ |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วยสแนปช็อตการตั้งค่า runtime |
    | `plugin-sdk/runtime-group-policy` | ตัวช่วยการ resolve group-policy ใน runtime |
    | `plugin-sdk/channel-status` | ตัวช่วยสแนปช็อต/สรุปสถานะช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/channel-config-primitives` | primitive ของ schema การตั้งค่าช่องทางแบบแคบ |
    | `plugin-sdk/channel-config-writes` | ตัวช่วยการอนุญาตการเขียนการตั้งค่าช่องทาง |
    | `plugin-sdk/channel-plugin-common` | การส่งออก prelude ของ Plugin ช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/allowlist-config-edit` | ตัวช่วยแก้ไข/อ่านการตั้งค่า allowlist |
    | `plugin-sdk/group-access` | ตัวช่วยการตัดสินใจสิทธิ์เข้าถึงกลุ่มที่ใช้ร่วมกัน |
    | `plugin-sdk/direct-dm` | ตัวช่วย auth/guard ของ direct-DM ที่ใช้ร่วมกัน |
    | `plugin-sdk/discord` | facade ความเข้ากันได้ของ Discord ที่เลิกใช้แล้วสำหรับ `@openclaw/discord@2026.3.13` ที่เผยแพร่แล้วและความเข้ากันได้ของเจ้าของที่ติดตามอยู่; Plugin ใหม่ควรใช้พาธย่อย SDK ช่องทางทั่วไป |
    | `plugin-sdk/telegram-account` | facade ความเข้ากันได้ของการ resolve บัญชี Telegram ที่เลิกใช้แล้วสำหรับความเข้ากันได้ของเจ้าของที่ติดตามอยู่; Plugin ใหม่ควรใช้ตัวช่วย runtime ที่ฉีดเข้ามาหรือพาธย่อย SDK ช่องทางทั่วไป |
    | `plugin-sdk/zalouser` | facade ความเข้ากันได้ของ Zalo Personal ที่เลิกใช้แล้วสำหรับแพ็กเกจ Lark/Zalo ที่เผยแพร่แล้วซึ่งยังนำเข้าการอนุญาตคำสั่งผู้ส่ง; Plugin ใหม่ควรใช้ `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | การนำเสนอข้อความเชิงความหมาย, การส่งมอบ และตัวช่วยการตอบกลับแบบโต้ตอบเดิม ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | barrel ความเข้ากันได้สำหรับ inbound debounce, การจับคู่ mention, ตัวช่วยนโยบาย mention และตัวช่วย envelope |
    | `plugin-sdk/channel-inbound-debounce` | ตัวช่วย inbound debounce แบบแคบ |
    | `plugin-sdk/channel-mention-gating` | ตัวช่วยนโยบาย mention, เครื่องหมาย mention และข้อความ mention แบบแคบ โดยไม่มีพื้นผิว runtime ขาเข้าที่กว้างกว่า |
    | `plugin-sdk/channel-envelope` | ตัวช่วยจัดรูปแบบ envelope ขาเข้าแบบแคบ |
    | `plugin-sdk/channel-location` | บริบทตำแหน่งช่องทางและตัวช่วยการจัดรูปแบบ |
    | `plugin-sdk/channel-logging` | ตัวช่วยการบันทึกช่องทางสำหรับการทิ้งขาเข้าและความล้มเหลวของ typing/ack |
    | `plugin-sdk/channel-send-result` | ชนิดผลลัพธ์การตอบกลับ |
    | `plugin-sdk/channel-actions` | ตัวช่วย message-action ของช่องทาง รวมถึงตัวช่วย schema native ที่เลิกใช้แล้วซึ่งคงไว้เพื่อความเข้ากันได้ของ Plugin |
    | `plugin-sdk/channel-route` | ตัวช่วยการทำ route เป็นมาตรฐานที่ใช้ร่วมกัน, การ resolve เป้าหมายที่ขับเคลื่อนด้วย parser, การทำ thread-id เป็นสตริง, คีย์ route สำหรับ dedupe/compact, ชนิด parsed-target และตัวช่วยเปรียบเทียบ route/target |
    | `plugin-sdk/channel-targets` | ตัวช่วยแยกวิเคราะห์เป้าหมาย; ผู้เรียกการเปรียบเทียบ route ควรใช้ `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | ชนิดสัญญาช่องทาง |
    | `plugin-sdk/channel-feedback` | การเชื่อมต่อ feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วย secret-contract แบบแคบ เช่น `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` และชนิดเป้าหมาย secret |
  </Accordion>

  <Accordion title="Provider subpaths">
    | เส้นทางย่อย | export หลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | facade ผู้ให้บริการ LM Studio ที่รองรับ สำหรับการตั้งค่า การค้นพบแค็ตตาล็อก และการเตรียมโมเดลขณะรันไทม์ |
    | `plugin-sdk/lmstudio-runtime` | facade รันไทม์ LM Studio ที่รองรับ สำหรับค่าเริ่มต้นของเซิร์ฟเวอร์ในเครื่อง การค้นพบโมเดล ส่วนหัวคำขอ และตัวช่วยสำหรับโมเดลที่โหลดแล้ว |
    | `plugin-sdk/provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการในเครื่อง/โฮสต์เองที่คัดสรรแล้ว |
    | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการแบบโฮสต์เองที่เข้ากันได้กับ OpenAI โดยเฉพาะ |
    | `plugin-sdk/cli-backend` | ค่าเริ่มต้นของแบ็กเอนด์ CLI + ค่าคงที่ watchdog |
    | `plugin-sdk/provider-auth-runtime` | ตัวช่วยแก้ค่า API key ขณะรันไทม์สำหรับ Plugin ผู้ให้บริการ |
    | `plugin-sdk/provider-auth-api-key` | ตัวช่วยเริ่มใช้งาน/เขียนโปรไฟล์ API key เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | ตัวสร้างผลลัพธ์การรับรองความถูกต้อง OAuth มาตรฐาน |
    | `plugin-sdk/provider-auth-login` | ตัวช่วยเข้าสู่ระบบแบบโต้ตอบที่ใช้ร่วมกันสำหรับ Plugin ผู้ให้บริการ |
    | `plugin-sdk/provider-env-vars` | ตัวช่วยค้นหาตัวแปรสภาพแวดล้อมสำหรับการรับรองความถูกต้องของผู้ให้บริการ |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, export ความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้งานแล้ว |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้างนโยบาย replay ที่ใช้ร่วมกัน, ตัวช่วย endpoint ของผู้ให้บริการ และตัวช่วยปรับ model id ให้เป็นมาตรฐาน เช่น `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | hook รันไทม์สำหรับเสริมแค็ตตาล็อกผู้ให้บริการ และจุดเชื่อม registry ของ plugin-provider สำหรับการทดสอบสัญญา |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | ตัวช่วยความสามารถ HTTP/endpoint ของผู้ให้บริการแบบทั่วไป, ข้อผิดพลาด HTTP ของผู้ให้บริการ และตัวช่วยฟอร์ม multipart สำหรับการถอดเสียงเสียง |
    | `plugin-sdk/provider-web-fetch-contract` | ตัวช่วยสัญญาการกำหนดค่า/การเลือก web-fetch แบบจำกัด เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | ตัวช่วยลงทะเบียน/แคชผู้ให้บริการ web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วยการกำหนดค่า/ข้อมูลประจำตัว web-search แบบจำกัดสำหรับผู้ให้บริการที่ไม่ต้องใช้การเชื่อมต่อเพื่อเปิดใช้ Plugin |
    | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญาการกำหนดค่า/ข้อมูลประจำตัว web-search แบบจำกัด เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวอ่านข้อมูลประจำตัวแบบมีขอบเขต |
    | `plugin-sdk/provider-web-search` | ตัวช่วยลงทะเบียน/แคช/รันไทม์ของผู้ให้บริการ web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, การล้างสคีมา Gemini + diagnostics และตัวช่วยความเข้ากันได้ของ xAI เช่น `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` และรายการที่คล้ายกัน |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ชนิดของ stream wrapper และตัวช่วย wrapper ที่ใช้ร่วมกันสำหรับ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | ตัวช่วย transport ผู้ให้บริการแบบ native เช่น guarded fetch, การแปลงข้อความ transport และ stream เหตุการณ์ transport ที่เขียนได้ |
    | `plugin-sdk/provider-onboard` | ตัวช่วย patch การกำหนดค่า onboarding |
    | `plugin-sdk/global-singleton` | ตัวช่วย singleton/map/cache ภายในโปรเซส |
    | `plugin-sdk/group-activation` | ตัวช่วยโหมดเปิดใช้งานกลุ่มและการแยกวิเคราะห์คำสั่งแบบจำกัด |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | เส้นทางย่อย | export หลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ตัวช่วย command registry รวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก, ตัวช่วยการอนุญาตผู้ส่ง |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความคำสั่ง/วิธีใช้ เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | ตัวช่วยแก้ค่าผู้อนุมัติและการรับรองความถูกต้องของการดำเนินการในแชตเดียวกัน |
    | `plugin-sdk/approval-client-runtime` | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติ native exec |
    | `plugin-sdk/approval-delivery-runtime` | adapter ความสามารถ/การส่งมอบการอนุมัติ native |
    | `plugin-sdk/approval-gateway-runtime` | ตัวช่วยแก้ค่า Gateway การอนุมัติที่ใช้ร่วมกัน |
    | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยโหลด adapter การอนุมัติ native น้ำหนักเบาสำหรับ entrypoint ของช่องทางที่ใช้งานบ่อย |
    | `plugin-sdk/approval-handler-runtime` | ตัวช่วยรันไทม์ handler การอนุมัติที่กว้างกว่า; ควรใช้จุดเชื่อม adapter/gateway ที่แคบกว่าเมื่อเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | เป้าหมายการอนุมัติ native + ตัวช่วยการผูกบัญชี |
    | `plugin-sdk/approval-reply-runtime` | ตัวช่วย payload การตอบกลับการอนุมัติ exec/plugin |
    | `plugin-sdk/approval-runtime` | ตัวช่วย payload การอนุมัติ exec/plugin, ตัวช่วยการกำหนดเส้นทาง/รันไทม์การอนุมัติ native และตัวช่วยแสดงผลการอนุมัติแบบมีโครงสร้าง เช่น `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | ตัวช่วยรีเซ็ตการลบรายการตอบกลับขาเข้าซ้ำแบบจำกัด |
    | `plugin-sdk/channel-contract-testing` | ตัวช่วยทดสอบสัญญาช่องทางแบบจำกัดโดยไม่มี barrel ทดสอบแบบกว้าง |
    | `plugin-sdk/command-auth-native` | การรับรองความถูกต้องคำสั่ง native, การจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก และตัวช่วยเป้าหมายเซสชัน native |
    | `plugin-sdk/command-detection` | ตัวช่วยตรวจจับคำสั่งที่ใช้ร่วมกัน |
    | `plugin-sdk/command-primitives-runtime` | predicate ข้อความคำสั่งน้ำหนักเบาสำหรับเส้นทางช่องทางที่ใช้งานบ่อย |
    | `plugin-sdk/command-surface` | การปรับ body ของคำสั่งให้เป็นมาตรฐานและตัวช่วยพื้นผิวคำสั่ง |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยรวบรวมสัญญา secret แบบจำกัดสำหรับพื้นผิว secret ของช่องทาง/Plugin |
    | `plugin-sdk/secret-ref-runtime` | ตัวช่วยการพิมพ์ `coerceSecretRef` และ SecretRef แบบจำกัดสำหรับการแยกวิเคราะห์สัญญา secret/การกำหนดค่า |
    | `plugin-sdk/security-runtime` | ตัวช่วยความไว้วางใจที่ใช้ร่วมกัน, การกั้น DM, ตัวช่วยไฟล์/พาธที่จำกัดอยู่ภายใต้ root รวมถึงการเขียนแบบสร้างเท่านั้น, การแทนที่ไฟล์แบบ atomic ทั้ง sync/async, การเขียน temp ข้างเคียง, fallback การย้ายข้ามอุปกรณ์, ตัวช่วยที่เก็บไฟล์ส่วนตัว, guard parent ของ symlink, เนื้อหาภายนอก, การปกปิดข้อความละเอียดอ่อน, การเปรียบเทียบ secret แบบเวลาคงที่ และตัวช่วยรวบรวม secret |
    | `plugin-sdk/ssrf-policy` | ตัวช่วย allowlist ของโฮสต์และนโยบาย SSRF สำหรับเครือข่ายส่วนตัว |
    | `plugin-sdk/ssrf-dispatcher` | ตัวช่วย pinned-dispatcher แบบจำกัดโดยไม่มีพื้นผิวรันไทม์ infra แบบกว้าง |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, fetch ที่ป้องกัน SSRF, ข้อผิดพลาด SSRF และตัวช่วยนโยบาย SSRF |
    | `plugin-sdk/secret-input` | ตัวช่วยแยกวิเคราะห์ข้อมูลป้อน secret |
    | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ/เป้าหมาย Webhook และการบังคับชนิด websocket/body แบบ raw |
    | `plugin-sdk/webhook-request-guards` | ตัวช่วยขนาด/timeout ของ body คำขอ |
  </Accordion>

  <Accordion title="พาธย่อยของรันไทม์และพื้นที่จัดเก็บ">
    | พาธย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | ตัวช่วยรันไทม์/การบันทึกล็อก/การสำรองข้อมูล/การติดตั้ง Plugin แบบกว้าง |
    | `plugin-sdk/runtime-env` | ตัวช่วย env รันไทม์, logger, timeout, retry และ backoff แบบแคบ |
    | `plugin-sdk/browser-config` | facade การกำหนดค่าเบราว์เซอร์ที่รองรับสำหรับโปรไฟล์/ค่าเริ่มต้นที่ทำให้เป็นมาตรฐาน, การแยกวิเคราะห์ URL ของ CDP และตัวช่วย auth สำหรับควบคุมเบราว์เซอร์ |
    | `plugin-sdk/channel-runtime-context` | ตัวช่วยการลงทะเบียนและค้นหา runtime-context ของช่องทางแบบทั่วไป |
    | `plugin-sdk/matrix` | facade ความเข้ากันได้กับ Matrix ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางของบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควร import `plugin-sdk/run-command` โดยตรง |
    | `plugin-sdk/mattermost` | facade ความเข้ากันได้กับ Mattermost ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางของบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควร import พาธย่อยของ SDK ทั่วไปโดยตรง |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | ตัวช่วยคำสั่ง/hook/http/interactive ของ Plugin ที่ใช้ร่วมกัน |
    | `plugin-sdk/hook-runtime` | ตัวช่วยไปป์ไลน์ Webhook/hook ภายในที่ใช้ร่วมกัน |
    | `plugin-sdk/lazy-runtime` | ตัวช่วย import/binding รันไทม์แบบ lazy เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod` และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | ตัวช่วย exec ของกระบวนการ |
    | `plugin-sdk/cli-runtime` | ตัวช่วยการจัดรูปแบบ CLI, การรอ, เวอร์ชัน, การเรียกใช้อาร์กิวเมนต์ และกลุ่มคำสั่งแบบ lazy |
    | `plugin-sdk/gateway-runtime` | ตัวช่วยไคลเอนต์ Gateway, การเริ่มไคลเอนต์ที่พร้อมสำหรับ event-loop, RPC ของ Gateway CLI, ข้อผิดพลาดโปรโตคอล Gateway และแพตช์สถานะช่องทาง |
    | `plugin-sdk/config-types` | พื้นผิว config แบบเฉพาะชนิดสำหรับรูปร่าง config ของ Plugin เช่น `OpenClawConfig` และชนิด config ของช่องทาง/ผู้ให้บริการ |
    | `plugin-sdk/plugin-config-runtime` | ตัวช่วยค้นหา plugin-config ของรันไทม์ เช่น `requireRuntimeConfig`, `resolvePluginConfigObject` และ `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | ตัวช่วยเปลี่ยนแปลง config แบบธุรกรรม เช่น `mutateConfigFile`, `replaceConfigFile` และ `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วยสแนปช็อต config ของกระบวนการปัจจุบัน เช่น `getRuntimeConfig`, `getRuntimeConfigSnapshot` และตัวตั้งค่าสแนปช็อตสำหรับการทดสอบ |
    | `plugin-sdk/telegram-command-config` | การทำให้ชื่อคำสั่ง/คำอธิบายของ Telegram เป็นมาตรฐาน และการตรวจสอบรายการซ้ำ/ข้อขัดแย้ง แม้พื้นผิวสัญญา Telegram ที่รวมมาด้วยจะไม่พร้อมใช้งาน |
    | `plugin-sdk/text-autolink-runtime` | การตรวจจับ autolink ของการอ้างอิงไฟล์โดยไม่ใช้ barrel ของ text-runtime แบบกว้าง |
    | `plugin-sdk/approval-runtime` | ตัวช่วยการอนุมัติ exec/Plugin, ตัวสร้าง capability การอนุมัติ, ตัวช่วย auth/โปรไฟล์, ตัวช่วย routing/runtime แบบ native และการจัดรูปแบบพาธแสดงผลการอนุมัติแบบมีโครงสร้าง |
    | `plugin-sdk/reply-runtime` | ตัวช่วยรันไทม์ inbound/reply ที่ใช้ร่วมกัน, chunking, dispatch, Heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วย dispatch/finalize การตอบกลับและป้ายกำกับการสนทนาแบบแคบ |
    | `plugin-sdk/reply-history` | ตัวช่วยและ marker ของประวัติการตอบกลับช่วงสั้นที่ใช้ร่วมกัน เช่น `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` และ `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ตัวช่วย chunking ข้อความ/Markdown แบบแคบ |
    | `plugin-sdk/session-store-runtime` | ตัวช่วยพาธ session store, session-key, updated-at และการเปลี่ยนแปลง store |
    | `plugin-sdk/cron-store-runtime` | ตัวช่วยพาธ/load/save ของ Cron store |
    | `plugin-sdk/state-paths` | ตัวช่วยพาธไดเรกทอรี state/OAuth |
    | `plugin-sdk/routing` | ตัวช่วย route/session-key/account binding เช่น `resolveAgentRoute`, `buildAgentSessionKey` และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ตัวช่วยสรุปสถานะช่องทาง/บัญชีที่ใช้ร่วมกัน, ค่าเริ่มต้น runtime-state และตัวช่วย metadata ของ issue |
    | `plugin-sdk/target-resolver-runtime` | ตัวช่วย target resolver ที่ใช้ร่วมกัน |
    | `plugin-sdk/string-normalization-runtime` | ตัวช่วยการทำให้ slug/string เป็นมาตรฐาน |
    | `plugin-sdk/request-url` | แยก URL แบบสตริงจาก input ที่คล้าย fetch/request |
    | `plugin-sdk/run-command` | ตัวรันคำสั่งแบบจับเวลา พร้อมผลลัพธ์ stdout/stderr ที่ทำให้เป็นมาตรฐาน |
    | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ tool/CLI ทั่วไป |
    | `plugin-sdk/tool-payload` | แยก payload ที่ทำให้เป็นมาตรฐานจากอ็อบเจกต์ผลลัพธ์ของ tool |
    | `plugin-sdk/tool-send` | แยกฟิลด์เป้าหมายการส่งแบบ canonical จากอาร์กิวเมนต์ของ tool |
    | `plugin-sdk/temp-path` | ตัวช่วยพาธ temp-download ที่ใช้ร่วมกันและ workspace ชั่วคราวที่ปลอดภัยแบบส่วนตัว |
    | `plugin-sdk/logging-core` | ตัวช่วย subsystem logger และการ redaction |
    | `plugin-sdk/markdown-table-runtime` | ตัวช่วยโหมดตาราง Markdown และการแปลง |
    | `plugin-sdk/model-session-runtime` | ตัวช่วย override โมเดล/session เช่น `applyModelOverrideToSessionEntry` และ `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | ตัวช่วยการแก้ค่า config ของผู้ให้บริการ Talk |
    | `plugin-sdk/json-store` | ตัวช่วยอ่าน/เขียน state แบบ JSON ขนาดเล็ก |
    | `plugin-sdk/file-lock` | ตัวช่วย file-lock แบบ re-entrant |
    | `plugin-sdk/persistent-dedupe` | ตัวช่วยแคช dedupe ที่มีดิสก์รองรับ |
    | `plugin-sdk/acp-runtime` | ตัวช่วยรันไทม์/session ของ ACP และ reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | ตัวช่วยการลงทะเบียน backend ของ ACP แบบเบาและ reply-dispatch สำหรับ Plugin ที่โหลดตอนเริ่มต้น |
    | `plugin-sdk/acp-binding-resolve-runtime` | การแก้ค่า binding ของ ACP แบบอ่านอย่างเดียวโดยไม่มีการ import ตอนเริ่มต้น lifecycle |
    | `plugin-sdk/agent-config-primitives` | primitive ของ config-schema รันไทม์ agent แบบแคบ |
    | `plugin-sdk/boolean-param` | ตัวอ่านพารามิเตอร์ boolean แบบยืดหยุ่น |
    | `plugin-sdk/dangerous-name-runtime` | ตัวช่วยการแก้ค่าการจับคู่ dangerous-name |
    | `plugin-sdk/device-bootstrap` | ตัวช่วย bootstrap อุปกรณ์และ token การจับคู่ |
    | `plugin-sdk/extension-shared` | primitive ตัวช่วย passive-channel, สถานะ และ ambient proxy ที่ใช้ร่วมกัน |
    | `plugin-sdk/models-provider-runtime` | ตัวช่วยการตอบกลับคำสั่ง/ผู้ให้บริการ `/models` |
    | `plugin-sdk/skill-commands-runtime` | ตัวช่วยการแสดงรายการคำสั่ง Skill |
    | `plugin-sdk/native-command-registry` | ตัวช่วย registry/build/serialize ของคำสั่ง native |
    | `plugin-sdk/agent-harness` | พื้นผิว Plugin ที่เชื่อถือได้แบบทดลองสำหรับ agent harnesses ระดับล่าง: ชนิด harness, ตัวช่วย steer/abort ของ active-run, ตัวช่วย bridge tool ของ OpenClaw, ตัวช่วยนโยบาย tool ของ runtime-plan, การจำแนกผลลัพธ์ terminal, ตัวช่วยการจัดรูปแบบ/รายละเอียดความคืบหน้า tool และยูทิลิตีผลลัพธ์ของ attempt |
    | `plugin-sdk/provider-zai-endpoint` | ตัวช่วยตรวจจับ endpoint ของ Z.AI |
    | `plugin-sdk/async-lock-runtime` | ตัวช่วย async lock ภายในกระบวนการสำหรับไฟล์ state รันไทม์ขนาดเล็ก |
    | `plugin-sdk/channel-activity-runtime` | ตัวช่วย telemetry กิจกรรมช่องทาง |
    | `plugin-sdk/concurrency-runtime` | ตัวช่วย concurrency ของงาน async แบบมีขอบเขต |
    | `plugin-sdk/dedupe-runtime` | ตัวช่วยแคช dedupe ในหน่วยความจำ |
    | `plugin-sdk/delivery-queue-runtime` | ตัวช่วย drain การนำส่งขาออกที่ค้างอยู่ |
    | `plugin-sdk/file-access-runtime` | ตัวช่วยพาธ local-file และ media-source ที่ปลอดภัย |
    | `plugin-sdk/heartbeat-runtime` | ตัวช่วยเหตุการณ์และการมองเห็นของ Heartbeat |
    | `plugin-sdk/number-runtime` | ตัวช่วย coercion ตัวเลข |
    | `plugin-sdk/secure-random-runtime` | ตัวช่วย token/UUID ที่ปลอดภัย |
    | `plugin-sdk/system-event-runtime` | ตัวช่วยคิวเหตุการณ์ระบบ |
    | `plugin-sdk/transport-ready-runtime` | ตัวช่วยรอความพร้อมของ transport |
    | `plugin-sdk/infra-runtime` | shim ความเข้ากันได้ที่เลิกใช้แล้ว; ใช้พาธย่อยรันไทม์เฉพาะด้านด้านบน |
    | `plugin-sdk/collection-runtime` | ตัวช่วยแคชขนาดเล็กแบบมีขอบเขต |
    | `plugin-sdk/diagnostic-runtime` | ตัวช่วย flag การวินิจฉัย, เหตุการณ์ และ trace-context |
    | `plugin-sdk/error-runtime` | กราฟข้อผิดพลาด, การจัดรูปแบบ, ตัวช่วยการจำแนกข้อผิดพลาดที่ใช้ร่วมกัน, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch ที่หุ้มไว้, proxy, ตัวเลือก EnvHttpProxyAgent และตัวช่วย lookup แบบ pinned |
    | `plugin-sdk/runtime-fetch` | fetch รันไทม์ที่รู้จัก dispatcher โดยไม่มีการ import proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | ตัวอ่าน response-body แบบมีขอบเขตโดยไม่ใช้พื้นผิวรันไทม์ media แบบกว้าง |
    | `plugin-sdk/session-binding-runtime` | สถานะ binding ของการสนทนาปัจจุบันโดยไม่มี routing ของ binding ที่กำหนดค่าไว้หรือ pairing store |
    | `plugin-sdk/session-store-runtime` | ตัวช่วย session-store โดยไม่มีการ import การเขียน/บำรุงรักษา config แบบกว้าง |
    | `plugin-sdk/context-visibility-runtime` | การแก้ค่าการมองเห็น context และการกรอง context เพิ่มเติมโดยไม่มีการ import config/security แบบกว้าง |
    | `plugin-sdk/string-coerce-runtime` | ตัวช่วย coercion และ normalization ของ primitive record/string แบบแคบโดยไม่มีการ import markdown/logging |
    | `plugin-sdk/host-runtime` | ตัวช่วยการทำให้ hostname และ SCP host เป็นมาตรฐาน |
    | `plugin-sdk/retry-runtime` | ตัวช่วย config การ retry และ runner การ retry |
    | `plugin-sdk/agent-runtime` | ตัวช่วยไดเรกทอรี/identity/workspace ของ agent รวมถึง `resolveAgentDir`, `resolveDefaultAgentDir` และรายการส่งออกความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว |
    | `plugin-sdk/directory-runtime` | การ query/dedup ไดเรกทอรีที่มี config รองรับ |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="พาธย่อยด้านความสามารถและการทดสอบ">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | ตัวช่วยที่ใช้ร่วมกันสำหรับการดึง/แปลง/จัดเก็บสื่อ, การตรวจสอบมิติวิดีโอที่รองรับด้วย ffprobe และตัวสร้างเพย์โหลดสื่อ |
    | `plugin-sdk/media-store` | ตัวช่วยคลังสื่อแบบเจาะจง เช่น `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | ตัวช่วยเฟลโอเวอร์สำหรับการสร้างสื่อที่ใช้ร่วมกัน, การเลือกผู้สมัคร และข้อความเมื่อไม่มีโมเดล |
    | `plugin-sdk/media-understanding` | ประเภทผู้ให้บริการการทำความเข้าใจสื่อ พร้อมการส่งออกตัวช่วยรูปภาพ/เสียงสำหรับฝั่งผู้ให้บริการ |
    | `plugin-sdk/text-runtime` | ตัวช่วยข้อความ/markdown/การบันทึกที่ใช้ร่วมกัน เช่น การลบข้อความที่ผู้ช่วยมองเห็นได้, ตัวช่วยเรนเดอร์/แบ่งชิ้น/ตาราง markdown, ตัวช่วยปกปิดข้อมูล, ตัวช่วยแท็กคำสั่ง และยูทิลิตีข้อความปลอดภัย |
    | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งชิ้นข้อความขาออก |
    | `plugin-sdk/speech` | ประเภทผู้ให้บริการเสียงพูด พร้อมการส่งออกคำสั่ง, registry, การตรวจสอบ, ตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI และตัวช่วยเสียงพูดสำหรับฝั่งผู้ให้บริการ |
    | `plugin-sdk/speech-core` | ประเภทผู้ให้บริการเสียงพูดที่ใช้ร่วมกัน, registry, คำสั่ง, การทำให้เป็นมาตรฐาน และการส่งออกตัวช่วยเสียงพูด |
    | `plugin-sdk/realtime-transcription` | ประเภทผู้ให้บริการการถอดเสียงแบบเรียลไทม์, ตัวช่วย registry และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
    | `plugin-sdk/realtime-voice` | ประเภทผู้ให้บริการเสียงแบบเรียลไทม์และตัวช่วย registry |
    | `plugin-sdk/image-generation` | ประเภทผู้ให้บริการการสร้างรูปภาพ พร้อมตัวช่วย URL ของ asset/data รูปภาพ และตัวสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
    | `plugin-sdk/image-generation-core` | ประเภทการสร้างรูปภาพที่ใช้ร่วมกัน, เฟลโอเวอร์, auth และตัวช่วย registry |
    | `plugin-sdk/music-generation` | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์การสร้างเพลง |
    | `plugin-sdk/music-generation-core` | ประเภทการสร้างเพลงที่ใช้ร่วมกัน, ตัวช่วยเฟลโอเวอร์, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref |
    | `plugin-sdk/video-generation` | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์การสร้างวิดีโอ |
    | `plugin-sdk/video-generation-core` | ประเภทการสร้างวิดีโอที่ใช้ร่วมกัน, ตัวช่วยเฟลโอเวอร์, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref |
    | `plugin-sdk/webhook-targets` | Registry เป้าหมาย Webhook และตัวช่วยติดตั้งเส้นทาง |
    | `plugin-sdk/webhook-path` | ตัวช่วยทำให้พาธ Webhook เป็นมาตรฐาน |
    | `plugin-sdk/web-media` | ตัวช่วยโหลดสื่อระยะไกล/ภายในเครื่องที่ใช้ร่วมกัน |
    | `plugin-sdk/zod` | `zod` ที่ส่งออกซ้ำสำหรับผู้ใช้ plugin SDK |
    | `plugin-sdk/testing` | Barrel ความเข้ากันได้แบบกว้างสำหรับการทดสอบปลั๊กอินรุ่นเก่า การทดสอบ extension ใหม่ควรนำเข้าพาธย่อย SDK แบบเจาะจงแทน เช่น `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` หรือ `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | ตัวช่วย `createTestPluginApi` ขั้นต่ำสำหรับการทดสอบหน่วยการลงทะเบียนปลั๊กอินโดยตรง โดยไม่ต้องนำเข้า bridge ตัวช่วยทดสอบของ repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture สัญญา adapter ของ agent-runtime แบบเนทีฟสำหรับการทดสอบ auth, การส่งมอบ, fallback, tool-hook, prompt-overlay, schema และการฉาย transcript |
    | `plugin-sdk/channel-test-helpers` | ตัวช่วยทดสอบที่เน้นช่องทางสำหรับสัญญา action/setup/status ทั่วไป, การยืนยันไดเรกทอรี, วงจรชีวิตการเริ่มบัญชี, send-config threading, runtime mocks, ปัญหา status, การส่งมอบขาออก และการลงทะเบียน hook |
    | `plugin-sdk/channel-target-testing` | ชุดกรณีข้อผิดพลาดการแก้เป้าหมายที่ใช้ร่วมกันสำหรับการทดสอบช่องทาง |
    | `plugin-sdk/plugin-test-contracts` | ตัวช่วยสัญญาแพ็กเกจปลั๊กอิน, การลงทะเบียน, artifact สาธารณะ, การนำเข้าโดยตรง, runtime API และผลข้างเคียงจากการนำเข้า |
    | `plugin-sdk/provider-test-contracts` | ตัวช่วยสัญญา provider runtime, auth, discovery, onboard, catalog, wizard, ความสามารถด้านสื่อ, นโยบาย replay, เสียงสด STT แบบเรียลไทม์, web-search/fetch และ stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/auth ของ Vitest แบบเลือกใช้สำหรับการทดสอบผู้ให้บริการที่ทดสอบ `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture ทั่วไปสำหรับการจับ runtime ของ CLI, บริบท sandbox, ตัวเขียน skill, agent-message, system-event, การโหลดโมดูลใหม่, พาธปลั๊กอินที่ bundled, terminal-text, chunking, auth-token และ typed-case |
    | `plugin-sdk/test-node-mocks` | ตัวช่วย mock Node builtin แบบเจาะจงสำหรับใช้ภายใน factory ของ Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="พาธย่อยหน่วยความจำ">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/memory-core` | พื้นผิวตัวช่วย memory-core ที่ bundled สำหรับตัวช่วย manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime ดัชนี/ค้นหาหน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-foundation` | การส่งออกเอนจิน foundation ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | สัญญา embedding ของ host หน่วยความจำ, การเข้าถึง registry, ผู้ให้บริการภายในเครื่อง และตัวช่วย batch/remote ทั่วไป |
    | `plugin-sdk/memory-core-host-engine-qmd` | การส่งออกเอนจิน QMD ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-storage` | การส่งออกเอนจิน storage ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วย multimodal ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-query` | ตัวช่วย query ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-secret` | ตัวช่วย secret ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-events` | ตัวช่วย event journal ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-status` | ตัวช่วย status ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-cli` | ตัวช่วย runtime CLI ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-core` | ตัวช่วย runtime core ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วย file/runtime ของ host หน่วยความจำ |
    | `plugin-sdk/memory-host-core` | นามแฝงที่ไม่ผูกกับ vendor สำหรับตัวช่วย runtime core ของ host หน่วยความจำ |
    | `plugin-sdk/memory-host-events` | นามแฝงที่ไม่ผูกกับ vendor สำหรับตัวช่วย event journal ของ host หน่วยความจำ |
    | `plugin-sdk/memory-host-files` | นามแฝงที่ไม่ผูกกับ vendor สำหรับตัวช่วย file/runtime ของ host หน่วยความจำ |
    | `plugin-sdk/memory-host-markdown` | ตัวช่วย managed-markdown ที่ใช้ร่วมกันสำหรับปลั๊กอินที่อยู่ใกล้เคียงกับหน่วยความจำ |
    | `plugin-sdk/memory-host-search` | Facade runtime ของ Active memory สำหรับการเข้าถึง search-manager |
    | `plugin-sdk/memory-host-status` | นามแฝงที่ไม่ผูกกับ vendor สำหรับตัวช่วย status ของ host หน่วยความจำ |
  </Accordion>

  <Accordion title="พาธย่อยตัวช่วย bundled ที่สงวนไว้">
    ขณะนี้ยังไม่มีพาธย่อย SDK สำหรับตัวช่วย bundled ที่สงวนไว้ ตัวช่วยเฉพาะเจ้าของ
    อยู่ภายในแพ็กเกจปลั๊กอินที่เป็นเจ้าของ ส่วนสัญญา host ที่ใช้ซ้ำได้
    ใช้พาธย่อย SDK ทั่วไป เช่น `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` และ `plugin-sdk/plugin-config-runtime`
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้างปลั๊กอิน](/th/plugins/building-plugins)
