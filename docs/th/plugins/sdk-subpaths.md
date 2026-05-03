---
read_when:
    - การเลือกเส้นทางย่อยของ plugin-sdk ที่เหมาะสมสำหรับการนำเข้า Plugin
    - การตรวจสอบเส้นทางย่อยของ Plugin ที่รวมมาในชุดและอินเทอร์เฟซตัวช่วย
summary: 'แค็ตตาล็อกพาธย่อยของ Plugin SDK: การนำเข้าใดอยู่ที่ไหน โดยจัดกลุ่มตามพื้นที่'
title: เส้นทางย่อยของ Plugin SDK
x-i18n:
    generated_at: "2026-05-03T10:18:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: b3c6d139523f060795a60bce79d124def6461c0bf6a03a7a06244604101f7eff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Plugin SDK ถูกเปิดเผยเป็นชุดพาธย่อยแบบแคบภายใต้ `openclaw/plugin-sdk/`
  หน้านี้จัดทำรายการพาธย่อยที่ใช้กันทั่วไปโดยจัดกลุ่มตามวัตถุประสงค์ รายการฉบับเต็มที่สร้างขึ้น
  ซึ่งมีพาธย่อยมากกว่า 200 รายการอยู่ใน `scripts/lib/plugin-sdk-entrypoints.json`;
  พาธย่อยตัวช่วยของ bundled-plugin ที่สงวนไว้ปรากฏอยู่ที่นั่น แต่ถือเป็นรายละเอียดการใช้งานภายใน
  เว้นแต่หน้าด็อกจะยกระดับให้ใช้อย่างชัดเจน ผู้ดูแลสามารถตรวจสอบพาธย่อยตัวช่วยที่สงวนไว้และยังใช้งานอยู่ได้ด้วย `pnpm plugins:boundary-report:summary`; export ตัวช่วยที่สงวนไว้แต่ไม่ได้ใช้งาน
  จะทำให้รายงาน CI ล้มเหลว แทนที่จะค้างอยู่ใน SDK สาธารณะเป็นหนี้ความเข้ากันได้ที่ไม่ทำงาน

  สำหรับคู่มือการสร้าง Plugin โปรดดู [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

  ## จุดเข้า Plugin

  | พาธย่อย                                   | export หลัก                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | barrel ความเข้ากันได้แบบกว้างสำหรับการทดสอบ Plugin เดิม; สำหรับการทดสอบส่วนขยายใหม่ ให้ใช้พาธย่อยสำหรับการทดสอบแบบเจาะจงมากกว่า                                                                     |
  | `plugin-sdk/plugin-test-api`              | ตัวสร้าง mock `OpenClawPluginApi` แบบขั้นต่ำสำหรับการทดสอบหน่วยของการลงทะเบียน Plugin โดยตรง                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | fixture สัญญา adapter ของ agent-runtime ดั้งเดิมสำหรับโปรไฟล์ auth, การระงับการส่ง, การจัดประเภท fallback, hook เครื่องมือ, overlay prompt, schema และการซ่อม transcript |
  | `plugin-sdk/channel-test-helpers`         | ตัวช่วยทดสอบสัญญา channel แบบทั่วไป และตัวช่วยบัญชี channel lifecycle, ไดเรกทอรี, send-config, runtime mock, hook, จุดเข้า channel แบบ bundled, เวลาประทับ envelope และการตอบกลับ pairing   |
  | `plugin-sdk/channel-target-testing`       | ชุดทดสอบกรณีข้อผิดพลาดของการแก้ target ของ channel ที่ใช้ร่วมกัน                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | ตัวช่วยสัญญาสำหรับการลงทะเบียน Plugin, package manifest, อาร์ติแฟกต์สาธารณะ, runtime API, side effect จาก import และ direct import                                                  |
  | `plugin-sdk/plugin-test-runtime`          | fixture สำหรับการทดสอบของ Plugin runtime, registry, provider-registration, setup-wizard และ runtime task-flow                                                                      |
  | `plugin-sdk/provider-test-contracts`      | ตัวช่วยสัญญาสำหรับ provider runtime, auth, discovery, onboard, catalog, ความสามารถด้าน media, replay policy, realtime STT live-audio, web-search/fetch และ wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | mock HTTP/auth สำหรับ Vitest แบบเลือกใช้ สำหรับการทดสอบ provider ที่เรียกใช้ `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | fixture สำหรับสภาพแวดล้อมทดสอบ, fetch/network, เซิร์ฟเวอร์ HTTP แบบใช้แล้วทิ้ง, incoming request, live-test, ระบบไฟล์ชั่วคราว และ time-control                                        |
  | `plugin-sdk/test-fixtures`                | fixture ทดสอบทั่วไปสำหรับ CLI, sandbox, skill, agent-message, system-event, การ reload module, พาธ Plugin แบบ bundled, terminal, chunking, auth-token และ typed-case                   |
  | `plugin-sdk/test-node-mocks`              | ตัวช่วย mock builtin ของ Node แบบเจาะจงสำหรับใช้ภายใน factory ของ Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | ตัวช่วย item ของ provider สำหรับ migration เช่น `createMigrationItem`, ค่าคงที่ reason, marker สถานะ item, ตัวช่วย redaction และ `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | ตัวช่วย migration ฝั่ง runtime เช่น `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` และ `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="พาธย่อยของ Channel">
    | พาธย่อย | export หลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | export schema Zod ของ `openclaw.json` ระดับราก (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | ตัวช่วย setup wizard ที่ใช้ร่วมกัน, prompt allowlist, ตัวสร้างสถานะ setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | ตัวช่วย config/action-gate แบบหลายบัญชี, ตัวช่วย default-account fallback |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ตัวช่วยทำ account-id ให้เป็นมาตรฐาน |
    | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชีและ default-fallback |
    | `plugin-sdk/account-helpers` | ตัวช่วย account-list/account-action แบบแคบ |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | primitive ของ schema config channel ที่ใช้ร่วมกัน รวมถึงตัวสร้าง Zod และ JSON/TypeBox โดยตรง |
    | `plugin-sdk/bundled-channel-config-schema` | schema config channel ของ OpenClaw แบบ bundled สำหรับ Plugin แบบ bundled ที่ได้รับการดูแลเท่านั้น |
    | `plugin-sdk/channel-config-schema-legacy` | alias ความเข้ากันได้ที่เลิกใช้แล้วสำหรับ schema config ของ bundled-channel |
    | `plugin-sdk/telegram-command-config` | ตัวช่วยทำให้คำสั่งกำหนดเองของ Telegram เป็นมาตรฐาน/ตรวจสอบความถูกต้อง พร้อม bundled-contract fallback |
    | `plugin-sdk/command-gating` | ตัวช่วย gate การอนุญาตคำสั่งแบบแคบ |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, ตัวช่วย lifecycle/finalization ของ draft stream |
    | `plugin-sdk/inbound-envelope` | ตัวช่วย inbound route และตัวสร้าง envelope ที่ใช้ร่วมกัน |
    | `plugin-sdk/inbound-reply-dispatch` | ตัวช่วย record-and-dispatch ของ inbound ที่ใช้ร่วมกัน |
    | `plugin-sdk/messaging-targets` | ตัวช่วย parse/match target |
    | `plugin-sdk/outbound-media` | ตัวช่วยโหลด media outbound ที่ใช้ร่วมกัน |
    | `plugin-sdk/outbound-send-deps` | การค้นหา dependency สำหรับ outbound send แบบเบาสำหรับ adapter ของ channel |
    | `plugin-sdk/outbound-runtime` | ตัวช่วยวางแผนการส่ง outbound, identity, send delegate, session, formatting และ payload |
    | `plugin-sdk/poll-runtime` | ตัวช่วยทำ poll ให้เป็นมาตรฐานแบบแคบ |
    | `plugin-sdk/thread-bindings-runtime` | ตัวช่วย lifecycle และ adapter ของ thread-binding |
    | `plugin-sdk/agent-media-payload` | ตัวสร้าง payload media ของ agent แบบเดิม |
    | `plugin-sdk/conversation-runtime` | ตัวช่วย conversation/thread binding, pairing และ configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วย snapshot config ฝั่ง runtime |
    | `plugin-sdk/runtime-group-policy` | ตัวช่วยแก้ group-policy ฝั่ง runtime |
    | `plugin-sdk/channel-status` | ตัวช่วย snapshot/summary สถานะ channel ที่ใช้ร่วมกัน |
    | `plugin-sdk/channel-config-primitives` | primitive ของ channel config-schema แบบแคบ |
    | `plugin-sdk/channel-config-writes` | ตัวช่วยการอนุญาตเขียน config channel |
    | `plugin-sdk/channel-plugin-common` | export prelude ของ Plugin channel ที่ใช้ร่วมกัน |
    | `plugin-sdk/allowlist-config-edit` | ตัวช่วยแก้ไข/อ่าน config allowlist |
    | `plugin-sdk/group-access` | ตัวช่วยตัดสินใจ group-access ที่ใช้ร่วมกัน |
    | `plugin-sdk/direct-dm` | ตัวช่วย auth/guard ของ direct-DM ที่ใช้ร่วมกัน |
    | `plugin-sdk/discord` | facade ความเข้ากันได้ของ Discord ที่เลิกใช้แล้วสำหรับ `@openclaw/discord@2026.3.13` ที่เผยแพร่แล้วและความเข้ากันได้ของเจ้าของที่ติดตามอยู่; Plugin ใหม่ควรใช้พาธย่อย SDK ของ channel แบบทั่วไป |
    | `plugin-sdk/telegram-account` | facade ความเข้ากันได้ของการแก้บัญชี Telegram ที่เลิกใช้แล้วสำหรับความเข้ากันได้ของเจ้าของที่ติดตามอยู่; Plugin ใหม่ควรใช้ตัวช่วย runtime ที่ inject เข้ามาหรือพาธย่อย SDK ของ channel แบบทั่วไป |
    | `plugin-sdk/zalouser` | facade ความเข้ากันได้ของ Zalo Personal ที่เลิกใช้แล้วสำหรับแพ็กเกจ Lark/Zalo ที่เผยแพร่แล้วซึ่งยัง import การอนุญาตคำสั่งของผู้ส่ง; Plugin ใหม่ควรใช้ `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | ตัวช่วยการนำเสนอข้อความเชิง semantic, การส่ง และการตอบกลับแบบ interactive เดิม ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | barrel ความเข้ากันได้สำหรับ inbound debounce, การจับคู่ mention, ตัวช่วย mention-policy และตัวช่วย envelope |
    | `plugin-sdk/channel-inbound-debounce` | ตัวช่วย inbound debounce แบบแคบ |
    | `plugin-sdk/channel-mention-gating` | ตัวช่วย mention-policy, marker ของ mention และข้อความ mention แบบแคบ โดยไม่มีพื้นผิว inbound runtime ที่กว้างกว่า |
    | `plugin-sdk/channel-envelope` | ตัวช่วยจัดรูปแบบ inbound envelope แบบแคบ |
    | `plugin-sdk/channel-location` | ตัวช่วยบริบทและการจัดรูปแบบตำแหน่งของ channel |
    | `plugin-sdk/channel-logging` | ตัวช่วย logging ของ channel สำหรับ inbound drops และความล้มเหลวของ typing/ack |
    | `plugin-sdk/channel-send-result` | ประเภทผลลัพธ์การตอบกลับ |
    | `plugin-sdk/channel-actions` | ตัวช่วย message-action ของ channel รวมถึงตัวช่วย schema ดั้งเดิมที่เลิกใช้แล้วซึ่งคงไว้เพื่อความเข้ากันได้ของ Plugin |
    | `plugin-sdk/channel-route` | ตัวช่วยทำ route ให้เป็นมาตรฐานที่ใช้ร่วมกัน, การแก้ target ที่ขับเคลื่อนด้วย parser, การแปลง thread-id เป็น string, คีย์ route สำหรับ dedupe/compact, ประเภท parsed-target และตัวช่วยเปรียบเทียบ route/target |
    | `plugin-sdk/channel-targets` | ตัวช่วย parse target; ผู้เรียกที่เปรียบเทียบ route ควรใช้ `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | ประเภทสัญญา channel |
    | `plugin-sdk/channel-feedback` | การเชื่อมต่อ feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วย secret-contract แบบแคบ เช่น `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` และประเภท secret target |
  </Accordion>

  <Accordion title="เส้นทางย่อยของผู้ให้บริการ">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | ฟาซาดผู้ให้บริการ LM Studio ที่รองรับสำหรับการตั้งค่า การค้นพบแค็ตตาล็อก และการเตรียมโมเดลรันไทม์ |
    | `plugin-sdk/lmstudio-runtime` | ฟาซาดรันไทม์ LM Studio ที่รองรับสำหรับค่าเริ่มต้นของเซิร์ฟเวอร์ภายใน การค้นพบโมเดล ส่วนหัวคำขอ และตัวช่วยโมเดลที่โหลดแล้ว |
    | `plugin-sdk/provider-setup` | ตัวช่วยการตั้งค่าผู้ให้บริการภายใน/โฮสต์เองที่คัดสรรไว้ |
    | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยการตั้งค่าผู้ให้บริการโฮสต์เองที่เข้ากันได้กับ OpenAI แบบเฉพาะเจาะจง |
    | `plugin-sdk/cli-backend` | ค่าเริ่มต้นของแบ็กเอนด์ CLI + ค่าคงที่ของ watchdog |
    | `plugin-sdk/provider-auth-runtime` | ตัวช่วยการแก้ไข API key ในรันไทม์สำหรับ Plugin ผู้ให้บริการ |
    | `plugin-sdk/provider-auth-api-key` | ตัวช่วยการเริ่มใช้งาน API key/การเขียนโปรไฟล์ เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | ตัวสร้างผลลัพธ์การตรวจสอบสิทธิ์ OAuth มาตรฐาน |
    | `plugin-sdk/provider-auth-login` | ตัวช่วยเข้าสู่ระบบแบบโต้ตอบที่ใช้ร่วมกันสำหรับ Plugin ผู้ให้บริการ |
    | `plugin-sdk/provider-env-vars` | ตัวช่วยค้นหาตัวแปรสภาพแวดล้อมสำหรับการตรวจสอบสิทธิ์ของผู้ให้บริการ |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้างนโยบาย replay ที่ใช้ร่วมกัน, ตัวช่วย endpoint ของผู้ให้บริการ และตัวช่วยทำให้ model-id เป็นมาตรฐาน เช่น `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | ฮุกเพิ่มแต่งแค็ตตาล็อกผู้ให้บริการในรันไทม์และจุดเชื่อม registry ของ plugin-provider สำหรับการทดสอบสัญญา |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | ตัวช่วยความสามารถ HTTP/endpoint ทั่วไปของผู้ให้บริการ ข้อผิดพลาด HTTP ของผู้ให้บริการ และตัวช่วยฟอร์ม multipart สำหรับการถอดเสียงเสียง |
    | `plugin-sdk/provider-web-fetch-contract` | ตัวช่วยสัญญาการกำหนดค่า/การเลือก web-fetch แบบแคบ เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | ตัวช่วยการลงทะเบียน/แคชผู้ให้บริการ web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วยการกำหนดค่า/ข้อมูลรับรอง web-search แบบแคบสำหรับผู้ให้บริการที่ไม่ต้องการการเชื่อมต่อการเปิดใช้ Plugin |
    | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญาการกำหนดค่า/ข้อมูลรับรอง web-search แบบแคบ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวอ่านข้อมูลรับรองแบบมีขอบเขต |
    | `plugin-sdk/provider-web-search` | ตัวช่วยการลงทะเบียน/แคช/รันไทม์ของผู้ให้บริการ web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, การล้าง schema ของ Gemini + การวินิจฉัย และตัวช่วยความเข้ากันได้ของ xAI เช่น `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` และรายการที่คล้ายกัน |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ประเภท wrapper ของสตรีม และตัวช่วย wrapper ที่ใช้ร่วมกันสำหรับ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | ตัวช่วยการขนส่งของผู้ให้บริการแบบเนทีฟ เช่น fetch ที่มีการป้องกัน การแปลงข้อความขนส่ง และสตรีมเหตุการณ์ขนส่งที่เขียนได้ |
    | `plugin-sdk/provider-onboard` | ตัวช่วยแพตช์การกำหนดค่าการเริ่มใช้งาน |
    | `plugin-sdk/global-singleton` | ตัวช่วย singleton/map/cache ภายในโปรเซส |
    | `plugin-sdk/group-activation` | โหมดการเปิดใช้งานกลุ่มแบบแคบและตัวช่วยแยกวิเคราะห์คำสั่ง |
  </Accordion>

  <Accordion title="เส้นทางย่อยของการตรวจสอบสิทธิ์และความปลอดภัย">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ตัวช่วย registry คำสั่ง รวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก, ตัวช่วยการอนุญาตผู้ส่ง |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความคำสั่ง/ความช่วยเหลือ เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | ตัวช่วยการแก้ไขผู้อนุมัติและการตรวจสอบสิทธิ์การกระทำในแชตเดียวกัน |
    | `plugin-sdk/approval-client-runtime` | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติ exec แบบเนทีฟ |
    | `plugin-sdk/approval-delivery-runtime` | อะแดปเตอร์ความสามารถ/การส่งมอบการอนุมัติแบบเนทีฟ |
    | `plugin-sdk/approval-gateway-runtime` | ตัวช่วยการแก้ไข Gateway การอนุมัติที่ใช้ร่วมกัน |
    | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยโหลดอะแดปเตอร์การอนุมัติแบบเนทีฟน้ำหนักเบาสำหรับ entrypoint ของช่องทางที่ร้อน |
    | `plugin-sdk/approval-handler-runtime` | ตัวช่วยรันไทม์ของตัวจัดการการอนุมัติที่กว้างกว่า; ให้ใช้จุดเชื่อมอะแดปเตอร์/Gateway ที่แคบกว่าเมื่อเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติแบบเนทีฟ + การผูกบัญชี |
    | `plugin-sdk/approval-reply-runtime` | ตัวช่วย payload การตอบกลับการอนุมัติ exec/Plugin |
    | `plugin-sdk/approval-runtime` | ตัวช่วย payload การอนุมัติ exec/Plugin, ตัวช่วยการกำหนดเส้นทาง/รันไทม์การอนุมัติแบบเนทีฟ และตัวช่วยแสดงการอนุมัติแบบมีโครงสร้าง เช่น `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | ตัวช่วยรีเซ็ตการตัดข้อความตอบกลับขาเข้าที่ซ้ำแบบแคบ |
    | `plugin-sdk/channel-contract-testing` | ตัวช่วยทดสอบสัญญาช่องทางแบบแคบโดยไม่มี barrel การทดสอบแบบกว้าง |
    | `plugin-sdk/command-auth-native` | การตรวจสอบสิทธิ์คำสั่งแบบเนทีฟ การจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก และตัวช่วยเป้าหมายเซสชันแบบเนทีฟ |
    | `plugin-sdk/command-detection` | ตัวช่วยตรวจจับคำสั่งที่ใช้ร่วมกัน |
    | `plugin-sdk/command-primitives-runtime` | predicate ข้อความคำสั่งน้ำหนักเบาสำหรับเส้นทางช่องทางที่ร้อน |
    | `plugin-sdk/command-surface` | การทำให้เนื้อหาคำสั่งเป็นมาตรฐานและตัวช่วยพื้นผิวคำสั่ง |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยเก็บรวบรวมสัญญาความลับแบบแคบสำหรับพื้นผิวความลับของช่องทาง/Plugin |
    | `plugin-sdk/secret-ref-runtime` | ตัวช่วย `coerceSecretRef` แบบแคบและการกำหนดชนิด SecretRef สำหรับการแยกวิเคราะห์สัญญาความลับ/การกำหนดค่า |
    | `plugin-sdk/security-runtime` | ตัวช่วยที่ใช้ร่วมกันสำหรับความไว้วางใจ การควบคุม DM เนื้อหาภายนอก การปกปิดข้อความละเอียดอ่อน การเปรียบเทียบความลับแบบเวลาคงที่ และการเก็บรวบรวมความลับ |
    | `plugin-sdk/ssrf-policy` | ตัวช่วย allowlist ของโฮสต์และนโยบาย SSRF ของเครือข่ายส่วนตัว |
    | `plugin-sdk/ssrf-dispatcher` | ตัวช่วย pinned-dispatcher แบบแคบโดยไม่มีพื้นผิวรันไทม์โครงสร้างพื้นฐานแบบกว้าง |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, fetch ที่มีการป้องกัน SSRF, ข้อผิดพลาด SSRF และตัวช่วยนโยบาย SSRF |
    | `plugin-sdk/secret-input` | ตัวช่วยแยกวิเคราะห์อินพุตความลับ |
    | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ/เป้าหมายของ Webhook และการบังคับรูปแบบ websocket/body ดิบ |
    | `plugin-sdk/webhook-request-guards` | ตัวช่วยขนาด/หมดเวลาของเนื้อหาคำขอ |
  </Accordion>

  <Accordion title="พาธย่อยของรันไทม์และพื้นที่จัดเก็บข้อมูล">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | ตัวช่วยรันไทม์/การบันทึก/การสำรองข้อมูล/การติดตั้ง Plugin แบบกว้าง |
    | `plugin-sdk/runtime-env` | ตัวช่วย env ของรันไทม์, logger, timeout, retry และ backoff แบบแคบ |
    | `plugin-sdk/browser-config` | ฟาซาด config เบราว์เซอร์ที่รองรับสำหรับโปรไฟล์/ค่าเริ่มต้นที่ทำให้เป็นมาตรฐาน, การแยกวิเคราะห์ URL ของ CDP และตัวช่วย auth สำหรับการควบคุมเบราว์เซอร์ |
    | `plugin-sdk/channel-runtime-context` | ตัวช่วยลงทะเบียนและค้นหา runtime-context ของช่องทางทั่วไป |
    | `plugin-sdk/matrix` | ฟาซาดความเข้ากันได้กับ Matrix ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางของบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควร import `plugin-sdk/run-command` โดยตรง |
    | `plugin-sdk/mattermost` | ฟาซาดความเข้ากันได้กับ Mattermost ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางของบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควร import พาธย่อย SDK ทั่วไปโดยตรง |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | ตัวช่วยคำสั่ง/hook/http/แบบโต้ตอบของ Plugin ที่ใช้ร่วมกัน |
    | `plugin-sdk/hook-runtime` | ตัวช่วย Webhook/ไปป์ไลน์ hook ภายในที่ใช้ร่วมกัน |
    | `plugin-sdk/lazy-runtime` | ตัวช่วย import/binding รันไทม์แบบ lazy เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod` และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | ตัวช่วย exec ของโปรเซส |
    | `plugin-sdk/cli-runtime` | ตัวช่วยการจัดรูปแบบ CLI, การรอ, เวอร์ชัน, การเรียกใช้งานด้วยอาร์กิวเมนต์ และกลุ่มคำสั่งแบบ lazy |
    | `plugin-sdk/gateway-runtime` | ไคลเอนต์ Gateway, ตัวช่วยเริ่มไคลเอนต์ที่พร้อมสำหรับ event loop, RPC ของ CLI สำหรับ Gateway, ข้อผิดพลาดโปรโตคอล Gateway และตัวช่วยแพตช์สถานะช่องทาง |
    | `plugin-sdk/config-types` | พื้นผิว config แบบชนิดเท่านั้นสำหรับรูปร่าง config ของ Plugin เช่น `OpenClawConfig` และชนิด config ของช่องทาง/ผู้ให้บริการ |
    | `plugin-sdk/plugin-config-runtime` | ตัวช่วยค้นหา plugin-config ขณะรันไทม์ เช่น `requireRuntimeConfig`, `resolvePluginConfigObject` และ `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | ตัวช่วยเปลี่ยนแปลง config แบบทรานแซกชัน เช่น `mutateConfigFile`, `replaceConfigFile` และ `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วยสแนปช็อต config ของโปรเซสปัจจุบัน เช่น `getRuntimeConfig`, `getRuntimeConfigSnapshot` และตัวตั้งค่าสแนปช็อตสำหรับการทดสอบ |
    | `plugin-sdk/telegram-command-config` | การทำให้ชื่อคำสั่ง/คำอธิบายของ Telegram เป็นมาตรฐาน และการตรวจสอบการซ้ำ/ความขัดแย้ง แม้เมื่อพื้นผิวสัญญา Telegram ที่รวมมาไม่พร้อมใช้งาน |
    | `plugin-sdk/text-autolink-runtime` | การตรวจจับ autolink สำหรับการอ้างอิงไฟล์โดยไม่ใช้ barrel ของ text-runtime แบบกว้าง |
    | `plugin-sdk/approval-runtime` | ตัวช่วยการอนุมัติ exec/Plugin, ตัวสร้าง approval-capability, ตัวช่วย auth/profile, ตัวช่วย routing/runtime แบบ native และการจัดรูปแบบพาธแสดงผลการอนุมัติแบบมีโครงสร้าง |
    | `plugin-sdk/reply-runtime` | ตัวช่วยรันไทม์ inbound/reply ที่ใช้ร่วมกัน, การแบ่งชิ้น, dispatch, Heartbeat, ตัววางแผน reply |
    | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วย dispatch/finalize ของ reply และป้ายกำกับบทสนทนาแบบแคบ |
    | `plugin-sdk/reply-history` | ตัวช่วยและมาร์กเกอร์ reply-history แบบหน้าต่างสั้นที่ใช้ร่วมกัน เช่น `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` และ `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ตัวช่วยแบ่งชิ้นข้อความ/markdown แบบแคบ |
    | `plugin-sdk/session-store-runtime` | ตัวช่วยพาธ session store, session-key, updated-at และการเปลี่ยนแปลง store |
    | `plugin-sdk/cron-store-runtime` | ตัวช่วยพาธ/load/save ของ Cron store |
    | `plugin-sdk/state-paths` | ตัวช่วยพาธไดเรกทอรี State/OAuth |
    | `plugin-sdk/routing` | ตัวช่วย route/session-key/account binding เช่น `resolveAgentRoute`, `buildAgentSessionKey` และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ตัวช่วยสรุปสถานะช่องทาง/บัญชีที่ใช้ร่วมกัน, ค่าเริ่มต้น runtime-state และตัวช่วย metadata ของปัญหา |
    | `plugin-sdk/target-resolver-runtime` | ตัวช่วย target resolver ที่ใช้ร่วมกัน |
    | `plugin-sdk/string-normalization-runtime` | ตัวช่วยทำให้ slug/string เป็นมาตรฐาน |
    | `plugin-sdk/request-url` | ดึง URL แบบสตริงจากอินพุตที่คล้าย fetch/request |
    | `plugin-sdk/run-command` | ตัวรันคำสั่งแบบจับเวลาพร้อมผลลัพธ์ stdout/stderr ที่ทำให้เป็นมาตรฐาน |
    | `plugin-sdk/param-readers` | ตัวอ่าน param ของเครื่องมือ/CLI ทั่วไป |
    | `plugin-sdk/tool-payload` | ดึง payload ที่ทำให้เป็นมาตรฐานจากออบเจ็กต์ผลลัพธ์ของเครื่องมือ |
    | `plugin-sdk/tool-send` | ดึงฟิลด์เป้าหมายการส่งแบบ canonical จาก args ของเครื่องมือ |
    | `plugin-sdk/temp-path` | ตัวช่วยพาธ temp-download ที่ใช้ร่วมกัน |
    | `plugin-sdk/logging-core` | ตัวช่วย logger ของ subsystem และการปกปิดข้อมูล |
    | `plugin-sdk/markdown-table-runtime` | ตัวช่วยโหมดตาราง Markdown และการแปลง |
    | `plugin-sdk/model-session-runtime` | ตัวช่วย override ของโมเดล/เซสชัน เช่น `applyModelOverrideToSessionEntry` และ `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | ตัวช่วยแก้ config ของผู้ให้บริการ Talk |
    | `plugin-sdk/json-store` | ตัวช่วยอ่าน/เขียนสถานะ JSON ขนาดเล็ก |
    | `plugin-sdk/file-lock` | ตัวช่วย file-lock แบบ re-entrant |
    | `plugin-sdk/persistent-dedupe` | ตัวช่วยแคช dedupe ที่มีดิสก์รองรับ |
    | `plugin-sdk/acp-runtime` | ตัวช่วย ACP runtime/session และ reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | ตัวช่วยลงทะเบียนแบ็กเอนด์ ACP แบบเบาและ reply-dispatch สำหรับ Plugin ที่โหลดตอนเริ่มต้น |
    | `plugin-sdk/acp-binding-resolve-runtime` | การแก้ ACP binding แบบอ่านอย่างเดียวโดยไม่ import lifecycle startup |
    | `plugin-sdk/agent-config-primitives` | primitive ของ config-schema สำหรับรันไทม์ agent แบบแคบ |
    | `plugin-sdk/boolean-param` | ตัวอ่าน param บูลีนแบบหลวม |
    | `plugin-sdk/dangerous-name-runtime` | ตัวช่วยแก้การจับคู่ dangerous-name |
    | `plugin-sdk/device-bootstrap` | ตัวช่วย bootstrap อุปกรณ์และ token สำหรับการจับคู่ |
    | `plugin-sdk/extension-shared` | primitive ตัวช่วย passive-channel, สถานะ และ ambient proxy ที่ใช้ร่วมกัน |
    | `plugin-sdk/models-provider-runtime` | ตัวช่วย reply ของคำสั่ง/ผู้ให้บริการ `/models` |
    | `plugin-sdk/skill-commands-runtime` | ตัวช่วยแสดงรายการคำสั่ง Skill |
    | `plugin-sdk/native-command-registry` | ตัวช่วย registry/build/serialize ของคำสั่ง native |
    | `plugin-sdk/agent-harness` | พื้นผิว Plugin ที่เชื่อถือได้แบบทดลองสำหรับ agent harnesses ระดับต่ำ: ชนิด harness, ตัวช่วย steer/abort ของ active-run, ตัวช่วย bridge เครื่องมือ OpenClaw, ตัวช่วยนโยบายเครื่องมือ runtime-plan, การจัดประเภทผลลัพธ์ terminal, ตัวช่วยจัดรูปแบบ/รายละเอียดความคืบหน้าของเครื่องมือ และยูทิลิตีผลลัพธ์ของ attempt |
    | `plugin-sdk/provider-zai-endpoint` | ตัวช่วยตรวจจับ endpoint ของ Z.AI |
    | `plugin-sdk/async-lock-runtime` | ตัวช่วย async lock แบบ local ต่อโปรเซสสำหรับไฟล์สถานะรันไทม์ขนาดเล็ก |
    | `plugin-sdk/channel-activity-runtime` | ตัวช่วย telemetry กิจกรรมช่องทาง |
    | `plugin-sdk/concurrency-runtime` | ตัวช่วย concurrency ของงาน async แบบมีขอบเขต |
    | `plugin-sdk/dedupe-runtime` | ตัวช่วยแคช dedupe ในหน่วยความจำ |
    | `plugin-sdk/delivery-queue-runtime` | ตัวช่วย drain pending-delivery ขาออก |
    | `plugin-sdk/file-access-runtime` | ตัวช่วยพาธ local-file และ media-source ที่ปลอดภัย |
    | `plugin-sdk/heartbeat-runtime` | ตัวช่วยเหตุการณ์ Heartbeat และการมองเห็น |
    | `plugin-sdk/number-runtime` | ตัวช่วย coercion ตัวเลข |
    | `plugin-sdk/secure-random-runtime` | ตัวช่วย token/UUID ที่ปลอดภัย |
    | `plugin-sdk/system-event-runtime` | ตัวช่วยคิวเหตุการณ์ระบบ |
    | `plugin-sdk/transport-ready-runtime` | ตัวช่วยรอความพร้อมของ transport |
    | `plugin-sdk/infra-runtime` | compatibility shim ที่เลิกใช้แล้ว; ใช้พาธย่อยรันไทม์เฉพาะด้านข้างต้น |
    | `plugin-sdk/collection-runtime` | ตัวช่วยแคชขนาดเล็กแบบมีขอบเขต |
    | `plugin-sdk/diagnostic-runtime` | ตัวช่วย flag วินิจฉัย, event และ trace-context |
    | `plugin-sdk/error-runtime` | ตัวช่วยกราฟข้อผิดพลาด, การจัดรูปแบบ, การจัดประเภทข้อผิดพลาดที่ใช้ร่วมกัน, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ตัวช่วย fetch ที่ห่อไว้, proxy, ตัวเลือก EnvHttpProxyAgent และ pinned lookup |
    | `plugin-sdk/runtime-fetch` | runtime fetch ที่รับรู้ dispatcher โดยไม่ import proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | ตัวอ่าน response-body แบบมีขอบเขตโดยไม่ใช้พื้นผิว media runtime แบบกว้าง |
    | `plugin-sdk/session-binding-runtime` | สถานะ binding ของบทสนทนาปัจจุบันโดยไม่มี configured binding routing หรือ pairing stores |
    | `plugin-sdk/session-store-runtime` | ตัวช่วย session-store โดยไม่ import การเขียน/บำรุงรักษา config แบบกว้าง |
    | `plugin-sdk/context-visibility-runtime` | การแก้ context visibility และการกรอง context เสริมโดยไม่ import config/security แบบกว้าง |
    | `plugin-sdk/string-coerce-runtime` | ตัวช่วย coercion และการทำให้ primitive record/string เป็นมาตรฐานแบบแคบโดยไม่ import markdown/logging |
    | `plugin-sdk/host-runtime` | ตัวช่วยทำให้ hostname และ host ของ SCP เป็นมาตรฐาน |
    | `plugin-sdk/retry-runtime` | ตัวช่วย config retry และ runner retry |
    | `plugin-sdk/agent-runtime` | ตัวช่วยไดเรกทอรี/identity/workspace ของ agent |
    | `plugin-sdk/directory-runtime` | query/dedup ของไดเรกทอรีที่อิง config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="เส้นทางย่อยของความสามารถและการทดสอบ">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | ตัวช่วยดึง/แปลง/จัดเก็บสื่อที่ใช้ร่วมกัน, การตรวจสอบขนาดวิดีโอที่รองรับด้วย ffprobe และตัวสร้างเพย์โหลดสื่อ |
    | `plugin-sdk/media-store` | ตัวช่วยจัดเก็บสื่อแบบจำกัดขอบเขต เช่น `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | ตัวช่วย failover การสร้างสื่อที่ใช้ร่วมกัน, การเลือกตัวเลือก และข้อความแจ้งโมเดลที่ขาดหาย |
    | `plugin-sdk/media-understanding` | ชนิดของผู้ให้บริการการทำความเข้าใจสื่อ รวมถึงรายการส่งออกตัวช่วยรูปภาพ/เสียงสำหรับผู้ให้บริการ |
    | `plugin-sdk/text-runtime` | ตัวช่วยข้อความ/markdown/การบันทึกที่ใช้ร่วมกัน เช่น การลบข้อความที่ผู้ช่วยมองเห็น, ตัวช่วยเรนเดอร์/แบ่งชิ้น/ตาราง markdown, ตัวช่วยปกปิดข้อมูล, ตัวช่วยแท็กคำสั่ง และยูทิลิตีข้อความปลอดภัย |
    | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งชิ้นข้อความขาออก |
    | `plugin-sdk/speech` | ชนิดของผู้ให้บริการเสียงพูด รวมถึงรายการส่งออกคำสั่ง, registry, การตรวจสอบความถูกต้อง, ตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI และตัวช่วยเสียงพูดสำหรับผู้ให้บริการ |
    | `plugin-sdk/speech-core` | ชนิดของผู้ให้บริการเสียงพูดที่ใช้ร่วมกัน, registry, คำสั่ง, การทำให้เป็นมาตรฐาน และรายการส่งออกตัวช่วยเสียงพูด |
    | `plugin-sdk/realtime-transcription` | ชนิดของผู้ให้บริการการถอดเสียงแบบเรียลไทม์, ตัวช่วย registry และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
    | `plugin-sdk/realtime-voice` | ชนิดของผู้ให้บริการเสียงแบบเรียลไทม์และตัวช่วย registry |
    | `plugin-sdk/image-generation` | ชนิดของผู้ให้บริการการสร้างรูปภาพ รวมถึงตัวช่วย asset รูปภาพ/URL ข้อมูล และตัวสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
    | `plugin-sdk/image-generation-core` | ชนิดการสร้างรูปภาพ, failover, auth และตัวช่วย registry ที่ใช้ร่วมกัน |
    | `plugin-sdk/music-generation` | ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์การสร้างเพลง |
    | `plugin-sdk/music-generation-core` | ชนิดการสร้างเพลง, ตัวช่วย failover, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref ที่ใช้ร่วมกัน |
    | `plugin-sdk/video-generation` | ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์การสร้างวิดีโอ |
    | `plugin-sdk/video-generation-core` | ชนิดการสร้างวิดีโอ, ตัวช่วย failover, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref ที่ใช้ร่วมกัน |
    | `plugin-sdk/webhook-targets` | registry เป้าหมาย Webhook และตัวช่วยติดตั้ง route |
    | `plugin-sdk/webhook-path` | ตัวช่วยทำให้เส้นทาง Webhook เป็นมาตรฐาน |
    | `plugin-sdk/web-media` | ตัวช่วยโหลดสื่อระยะไกล/ในเครื่องที่ใช้ร่วมกัน |
    | `plugin-sdk/zod` | `zod` ที่ส่งออกซ้ำสำหรับผู้ใช้ plugin SDK |
    | `plugin-sdk/testing` | barrel ความเข้ากันได้แบบกว้างสำหรับการทดสอบ plugin เดิม การทดสอบ extension ใหม่ควรนำเข้าเส้นทางย่อย SDK ที่เจาะจง เช่น `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` หรือ `plugin-sdk/test-fixtures` แทน |
    | `plugin-sdk/plugin-test-api` | ตัวช่วย `createTestPluginApi` ขั้นต่ำสำหรับการทดสอบหน่วยการลงทะเบียน plugin โดยตรง โดยไม่ต้องนำเข้า bridge ตัวช่วยทดสอบของ repo |
    | `plugin-sdk/agent-runtime-test-contracts` | fixture สัญญา adapter agent-runtime แบบเนทีฟสำหรับการทดสอบ auth, การส่งมอบ, fallback, tool-hook, prompt-overlay, schema และการฉาย transcript |
    | `plugin-sdk/channel-test-helpers` | ตัวช่วยทดสอบที่เน้นช่องทางสำหรับสัญญา action/setup/status ทั่วไป, การยืนยันไดเรกทอรี, วงจรชีวิตการเริ่มบัญชี, send-config threading, mock runtime, ปัญหาสถานะ, การส่งขาออก และการลงทะเบียน hook |
    | `plugin-sdk/channel-target-testing` | ชุดกรณีทดสอบข้อผิดพลาดการ resolve เป้าหมายที่ใช้ร่วมกันสำหรับการทดสอบช่องทาง |
    | `plugin-sdk/plugin-test-contracts` | ตัวช่วยสัญญา package ของ Plugin, การลงทะเบียน, artifact สาธารณะ, การนำเข้าโดยตรง, runtime API และ side effect ของการนำเข้า |
    | `plugin-sdk/provider-test-contracts` | ตัวช่วยสัญญา runtime ของผู้ให้บริการ, auth, discovery, onboard, catalog, wizard, ความสามารถด้านสื่อ, นโยบาย replay, เสียงสด STT แบบเรียลไทม์, การค้นหา/ดึงข้อมูลเว็บ และ stream |
    | `plugin-sdk/provider-http-test-mocks` | mock HTTP/auth ของ Vitest แบบเลือกใช้สำหรับการทดสอบผู้ให้บริการที่ทดสอบ `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | fixture ทั่วไปสำหรับการจับ runtime ของ CLI, บริบท sandbox, skill writer, agent-message, system-event, การโหลดโมดูลซ้ำ, เส้นทาง plugin ที่รวมมา, terminal-text, chunking, auth-token และ typed-case |
    | `plugin-sdk/test-node-mocks` | ตัวช่วย mock builtin ของ Node แบบเจาะจงสำหรับใช้ภายใน factory ของ Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="เส้นทางย่อยของหน่วยความจำ">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/memory-core` | พื้นผิวตัวช่วย memory-core ที่รวมมาสำหรับตัวช่วย manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade runtime ของดัชนี/การค้นหาหน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-foundation` | รายการส่งออก engine พื้นฐานของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | สัญญา embedding ของโฮสต์หน่วยความจำ, การเข้าถึง registry, ผู้ให้บริการในเครื่อง และตัวช่วย batch/remote ทั่วไป |
    | `plugin-sdk/memory-core-host-engine-qmd` | รายการส่งออก engine QMD ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-storage` | รายการส่งออก engine ที่จัดเก็บของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วย multimodal ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-query` | ตัวช่วย query ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-secret` | ตัวช่วย secret ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-events` | ตัวช่วยบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-status` | ตัวช่วยสถานะของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-cli` | ตัวช่วย runtime CLI ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-core` | ตัวช่วย runtime core ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วย file/runtime ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-core` | alias ที่เป็นกลางต่อ vendor สำหรับตัวช่วย runtime core ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-events` | alias ที่เป็นกลางต่อ vendor สำหรับตัวช่วยบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-files` | alias ที่เป็นกลางต่อ vendor สำหรับตัวช่วย file/runtime ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-markdown` | ตัวช่วย managed-markdown ที่ใช้ร่วมกันสำหรับ plugin ที่อยู่ใกล้เคียงกับหน่วยความจำ |
    | `plugin-sdk/memory-host-search` | facade runtime ของ active memory สำหรับการเข้าถึง search-manager |
    | `plugin-sdk/memory-host-status` | alias ที่เป็นกลางต่อ vendor สำหรับตัวช่วยสถานะของโฮสต์หน่วยความจำ |
  </Accordion>

  <Accordion title="เส้นทางย่อยของตัวช่วยที่รวมมาและสงวนไว้">
    ขณะนี้ไม่มีเส้นทางย่อย SDK ของตัวช่วยที่รวมมาและสงวนไว้ ตัวช่วยเฉพาะเจ้าของ
    จะอยู่ภายใน package plugin ที่เป็นเจ้าของ ขณะที่สัญญา host ที่ใช้ซ้ำได้
    ใช้เส้นทางย่อย SDK ทั่วไป เช่น `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` และ `plugin-sdk/plugin-config-runtime`
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง plugins](/th/plugins/building-plugins)
