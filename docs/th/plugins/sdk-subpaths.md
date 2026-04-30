---
read_when:
    - การเลือกพาธย่อย plugin-sdk ที่เหมาะสมสำหรับการนำเข้า Plugin
    - การตรวจสอบพาธย่อยของ Plugin ที่รวมมาในชุดและส่วนติดต่อของตัวช่วย
summary: 'แค็ตตาล็อกเส้นทางย่อยของ Plugin SDK: การ import ใดอยู่ที่ไหน โดยจัดกลุ่มตามพื้นที่'
title: เส้นทางย่อยของ Plugin SDK
x-i18n:
    generated_at: "2026-04-30T10:09:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a8c431c1835fff6720a00984171e3f55886363654074d81859f50ca28a35104
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Plugin SDK ถูกเปิดเผยเป็นชุดเส้นทางย่อยแบบแคบภายใต้ `openclaw/plugin-sdk/`
  หน้านี้จัดทำรายการเส้นทางย่อยที่ใช้บ่อยโดยจัดกลุ่มตามวัตถุประสงค์ รายการเต็มที่สร้างขึ้น
  ของเส้นทางย่อยมากกว่า 200 รายการอยู่ใน `scripts/lib/plugin-sdk-entrypoints.json`;
  เส้นทางย่อยตัวช่วยของ Plugin ที่มาพร้อมระบบซึ่งสงวนไว้จะปรากฏอยู่ที่นั่น แต่ถือเป็นรายละเอียดการใช้งานภายใน
  เว้นแต่หน้าเอกสารจะยกระดับให้เป็นสาธารณะอย่างชัดเจน ผู้ดูแลสามารถตรวจสอบเส้นทางย่อยตัวช่วยที่สงวนไว้และยังใช้งานอยู่
  ด้วย `pnpm plugins:boundary-report:summary`; การ export ตัวช่วยที่สงวนไว้แต่ไม่ได้ใช้งาน
  จะทำให้รายงาน CI ล้มเหลวแทนที่จะค้างอยู่ใน SDK สาธารณะ
  ในฐานะหนี้ความเข้ากันได้ที่ไม่ทำงาน

  สำหรับคู่มือการเขียน Plugin โปรดดู [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

  ## จุดเข้า Plugin

  | เส้นทางย่อย                                   | export หลัก                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | barrel ความเข้ากันได้แบบกว้างสำหรับการทดสอบ Plugin รุ่นเก่า; สำหรับการทดสอบ Plugin ใหม่ควรใช้เส้นทางย่อยทดสอบที่เจาะจงมากกว่า                                                                     |
  | `plugin-sdk/plugin-test-api`              | ตัวสร้าง mock `OpenClawPluginApi` ขั้นต่ำสำหรับ unit test การลงทะเบียน Plugin โดยตรง                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | fixture สัญญา adapter ของ agent-runtime แบบ native สำหรับโปรไฟล์ auth, การระงับการส่ง, การจัดประเภท fallback, hook ของ tool, prompt overlay, schema และการซ่อม transcript |
  | `plugin-sdk/channel-test-helpers`         | ตัวช่วยทดสอบวงจรชีวิตบัญชีช่องทาง, ไดเรกทอรี, send-config, runtime mock, hook, รายการช่องทางที่มาพร้อมระบบ, timestamp ของ envelope, คำตอบ pairing และสัญญาช่องทางทั่วไป   |
  | `plugin-sdk/channel-target-testing`       | ชุดทดสอบร่วมสำหรับกรณีข้อผิดพลาดของการแก้ target ช่องทาง                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | ตัวช่วยสัญญาสำหรับการลงทะเบียน Plugin, manifest ของแพ็กเกจ, artifact สาธารณะ, runtime API, side effect ของการ import และการ import โดยตรง                                                  |
  | `plugin-sdk/plugin-test-runtime`          | fixture สำหรับการทดสอบ runtime ของ Plugin, registry, การลงทะเบียน provider, setup-wizard และ runtime task-flow                                                                      |
  | `plugin-sdk/provider-test-contracts`      | ตัวช่วยสัญญาสำหรับ runtime ของ provider, auth, discovery, onboard, catalog, ความสามารถด้าน media, นโยบาย replay, เสียงสด realtime STT, web-search/fetch และ wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | mock HTTP/auth ของ Vitest แบบ opt-in สำหรับการทดสอบ provider ที่ใช้ `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | fixture สำหรับสภาพแวดล้อมทดสอบ, fetch/network, เซิร์ฟเวอร์ HTTP แบบใช้แล้วทิ้ง, คำขอขาเข้า, live-test, filesystem ชั่วคราว และการควบคุมเวลา                                        |
  | `plugin-sdk/test-fixtures`                | fixture ทดสอบทั่วไปสำหรับ CLI, sandbox, skill, agent-message, system-event, การโหลด module ใหม่, path ของ Plugin ที่มาพร้อมระบบ, terminal, chunking, auth-token และ typed-case                   |
  | `plugin-sdk/test-node-mocks`              | ตัวช่วย mock builtin ของ Node แบบเจาะจงสำหรับใช้ภายใน factory ของ Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | ตัวช่วยรายการ provider สำหรับ migration เช่น `createMigrationItem`, ค่าคงที่ reason, marker สถานะรายการ, ตัวช่วย redaction และ `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | ตัวช่วย migration สำหรับ runtime เช่น `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` และ `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | เส้นทางย่อย | export หลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | export schema Zod ของ `openclaw.json` ระดับ root (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | ตัวช่วย setup wizard ร่วม, prompt allowlist, ตัวสร้างสถานะ setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | ตัวช่วย config/action-gate สำหรับหลายบัญชี, ตัวช่วย fallback บัญชีเริ่มต้น |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ตัวช่วย normalization ของ account-id |
    | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชีและ default-fallback |
    | `plugin-sdk/account-helpers` | ตัวช่วยรายการบัญชี/account-action แบบแคบ |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | primitive ของ schema config ช่องทางร่วมและตัวสร้างทั่วไป |
    | `plugin-sdk/bundled-channel-config-schema` | schema config ช่องทาง OpenClaw ที่มาพร้อมระบบสำหรับ Plugin ที่มาพร้อมระบบและดูแลอยู่เท่านั้น |
    | `plugin-sdk/channel-config-schema-legacy` | alias ความเข้ากันได้ที่เลิกใช้แล้วสำหรับ schema config ช่องทางที่มาพร้อมระบบ |
    | `plugin-sdk/telegram-command-config` | ตัวช่วย normalization/validation สำหรับคำสั่งกำหนดเองของ Telegram พร้อม fallback สัญญาที่มาพร้อมระบบ |
    | `plugin-sdk/command-gating` | ตัวช่วย gate การอนุญาตคำสั่งแบบแคบ |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, ตัวช่วยวงจรชีวิต/การ finalization ของ draft stream |
    | `plugin-sdk/inbound-envelope` | ตัวช่วยร่วมสำหรับเส้นทางขาเข้าและตัวสร้าง envelope |
    | `plugin-sdk/inbound-reply-dispatch` | ตัวช่วยร่วมสำหรับบันทึกและ dispatch ขาเข้า |
    | `plugin-sdk/messaging-targets` | ตัวช่วย parsing/matching ของ target |
    | `plugin-sdk/outbound-media` | ตัวช่วยโหลด media ขาออกร่วม |
    | `plugin-sdk/outbound-send-deps` | การค้นหา dependency สำหรับส่งขาออกแบบเบาสำหรับ adapter ช่องทาง |
    | `plugin-sdk/outbound-runtime` | ตัวช่วยสำหรับการส่งขาออก, identity, send delegate, session, formatting และการวางแผน payload |
    | `plugin-sdk/poll-runtime` | ตัวช่วย normalization ของ poll แบบแคบ |
    | `plugin-sdk/thread-bindings-runtime` | ตัวช่วยวงจรชีวิต thread-binding และ adapter |
    | `plugin-sdk/agent-media-payload` | ตัวสร้าง payload media ของ agent รุ่นเก่า |
    | `plugin-sdk/conversation-runtime` | ตัวช่วย conversation/thread binding, pairing และ configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วย snapshot config ของ runtime |
    | `plugin-sdk/runtime-group-policy` | ตัวช่วยแก้ group-policy ของ runtime |
    | `plugin-sdk/channel-status` | ตัวช่วย snapshot/summary สถานะช่องทางร่วม |
    | `plugin-sdk/channel-config-primitives` | primitive ของ config-schema ช่องทางแบบแคบ |
    | `plugin-sdk/channel-config-writes` | ตัวช่วยการอนุญาตเขียน config ช่องทาง |
    | `plugin-sdk/channel-plugin-common` | export prelude ของ Plugin ช่องทางร่วม |
    | `plugin-sdk/allowlist-config-edit` | ตัวช่วยแก้ไข/อ่าน config allowlist |
    | `plugin-sdk/group-access` | ตัวช่วยตัดสินใจ group-access ร่วม |
    | `plugin-sdk/direct-dm` | ตัวช่วย auth/guard สำหรับ direct-DM ร่วม |
    | `plugin-sdk/discord` | facade ความเข้ากันได้ของ Discord ที่เลิกใช้แล้วสำหรับ `@openclaw/discord@2026.3.13` ที่เผยแพร่แล้วและความเข้ากันได้ของเจ้าของที่ติดตามอยู่; Plugin ใหม่ควรใช้เส้นทางย่อย SDK ช่องทางทั่วไป |
    | `plugin-sdk/telegram-account` | facade ความเข้ากันได้ของการแก้บัญชี Telegram ที่เลิกใช้แล้วสำหรับความเข้ากันได้ของเจ้าของที่ติดตามอยู่; Plugin ใหม่ควรใช้ตัวช่วย runtime ที่ inject เข้ามาหรือเส้นทางย่อย SDK ช่องทางทั่วไป |
    | `plugin-sdk/zalouser` | facade ความเข้ากันได้ของ Zalo Personal ที่เลิกใช้แล้วสำหรับแพ็กเกจ Lark/Zalo ที่เผยแพร่แล้วซึ่งยัง import การอนุญาตคำสั่งผู้ส่ง; Plugin ใหม่ควรใช้ `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | ตัวช่วยการนำเสนอข้อความ การส่ง และการตอบแบบ interactive รุ่นเก่าในเชิง semantic ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | barrel ความเข้ากันได้สำหรับ inbound debounce, mention matching, ตัวช่วย mention-policy และตัวช่วย envelope |
    | `plugin-sdk/channel-inbound-debounce` | ตัวช่วย inbound debounce แบบแคบ |
    | `plugin-sdk/channel-mention-gating` | ตัวช่วย mention-policy, marker ของ mention และข้อความ mention แบบแคบโดยไม่มีพื้นผิว runtime ขาเข้าที่กว้างกว่า |
    | `plugin-sdk/channel-envelope` | ตัวช่วย formatting envelope ขาเข้าแบบแคบ |
    | `plugin-sdk/channel-location` | บริบทตำแหน่งช่องทางและตัวช่วย formatting |
    | `plugin-sdk/channel-logging` | ตัวช่วย logging ช่องทางสำหรับการ drop ขาเข้าและความล้มเหลวของ typing/ack |
    | `plugin-sdk/channel-send-result` | ประเภทผลลัพธ์การตอบกลับ |
    | `plugin-sdk/channel-actions` | ตัวช่วย message-action ของช่องทาง พร้อมตัวช่วย schema แบบ native ที่เลิกใช้แล้วซึ่งคงไว้เพื่อความเข้ากันได้ของ Plugin |
    | `plugin-sdk/channel-route` | ตัวช่วยร่วมสำหรับ route normalization, การแก้ target ที่ขับเคลื่อนด้วย parser, การแปลง thread-id เป็น string, คีย์ route สำหรับ dedupe/compact, ประเภท parsed-target และตัวช่วยเปรียบเทียบ route/target |
    | `plugin-sdk/channel-targets` | ตัวช่วย parsing ของ target; ผู้เรียกใช้การเปรียบเทียบ route ควรใช้ `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | ประเภทสัญญาช่องทาง |
    | `plugin-sdk/channel-feedback` | การเชื่อม feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วย secret-contract แบบแคบ เช่น `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` และประเภท target ของ secret |
  </Accordion>

  <Accordion title="เส้นทางย่อยของผู้ให้บริการ">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | facade ผู้ให้บริการ LM Studio ที่รองรับสำหรับการตั้งค่า การค้นพบแค็ตตาล็อก และการเตรียมโมเดลขณะรันไทม์ |
    | `plugin-sdk/lmstudio-runtime` | facade รันไทม์ LM Studio ที่รองรับสำหรับค่าเริ่มต้นของเซิร์ฟเวอร์ภายใน การค้นพบโมเดล ส่วนหัวคำขอ และตัวช่วยสำหรับโมเดลที่โหลดแล้ว |
    | `plugin-sdk/provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการแบบภายใน/โฮสต์เองที่คัดสรรไว้ |
    | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการแบบโฮสต์เองที่เข้ากันได้กับ OpenAI โดยเฉพาะ |
    | `plugin-sdk/cli-backend` | ค่าเริ่มต้นของแบ็กเอนด์ CLI + ค่าคงที่ของ watchdog |
    | `plugin-sdk/provider-auth-runtime` | ตัวช่วยแก้ค่า API key ขณะรันไทม์สำหรับ Plugin ผู้ให้บริการ |
    | `plugin-sdk/provider-auth-api-key` | ตัวช่วยเริ่มใช้งาน/เขียนโปรไฟล์ API key เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
    | `plugin-sdk/provider-auth-login` | ตัวช่วยเข้าสู่ระบบแบบโต้ตอบร่วมกันสำหรับ Plugin ผู้ให้บริการ |
    | `plugin-sdk/provider-env-vars` | ตัวช่วยค้นหาตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตนของผู้ให้บริการ |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้าง replay-policy ร่วมกัน, ตัวช่วย provider-endpoint และตัวช่วยปรับ model-id ให้เป็นมาตรฐาน เช่น `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | ฮุกขณะรันไทม์สำหรับเสริมแค็ตตาล็อกผู้ให้บริการ และ seam ของรีจิสทรี plugin-provider สำหรับการทดสอบสัญญา |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | ตัวช่วยความสามารถ HTTP/endpoint ของผู้ให้บริการทั่วไป, ข้อผิดพลาด HTTP ของผู้ให้บริการ และตัวช่วยฟอร์ม multipart สำหรับการถอดเสียงจากเสียง |
    | `plugin-sdk/provider-web-fetch-contract` | ตัวช่วยสัญญาการกำหนดค่า/การเลือก web-fetch แบบเฉพาะ เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | ตัวช่วยลงทะเบียน/แคชผู้ให้บริการ web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วยการกำหนดค่า/ข้อมูลรับรอง web-search แบบเฉพาะสำหรับผู้ให้บริการที่ไม่ต้องมีการเชื่อมต่อเพื่อเปิดใช้ Plugin |
    | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญาการกำหนดค่า/ข้อมูลรับรอง web-search แบบเฉพาะ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวอ่านข้อมูลรับรองแบบมีขอบเขต |
    | `plugin-sdk/provider-web-search` | ตัวช่วยลงทะเบียน/แคช/รันไทม์ของผู้ให้บริการ web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, การล้างสคีมา Gemini + การวินิจฉัย และตัวช่วยความเข้ากันได้ของ xAI เช่น `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` และรายการที่คล้ายกัน |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ชนิดตัวครอบ stream และตัวช่วยตัวครอบ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ที่ใช้ร่วมกัน |
    | `plugin-sdk/provider-transport-runtime` | ตัวช่วย transport ผู้ให้บริการแบบ native เช่น guarded fetch, การแปลงข้อความ transport และ stream เหตุการณ์ transport ที่เขียนได้ |
    | `plugin-sdk/provider-onboard` | ตัวช่วยแพตช์การกำหนดค่า onboarding |
    | `plugin-sdk/global-singleton` | ตัวช่วย singleton/map/cache ภายในโปรเซส |
    | `plugin-sdk/group-activation` | ตัวช่วยโหมดเปิดใช้งานกลุ่มแบบเฉพาะและการแยกวิเคราะห์คำสั่ง |
  </Accordion>

  <Accordion title="เส้นทางย่อยการยืนยันตัวตนและความปลอดภัย">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ตัวช่วยรีจิสทรีคำสั่ง รวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก, ตัวช่วยการอนุญาตผู้ส่ง |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความคำสั่ง/ความช่วยเหลือ เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | ตัวช่วยแก้ผู้อนุมัติและการยืนยันตัวตนการดำเนินการในแชตเดียวกัน |
    | `plugin-sdk/approval-client-runtime` | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติ native exec |
    | `plugin-sdk/approval-delivery-runtime` | อะแดปเตอร์ความสามารถ/การส่งมอบการอนุมัติแบบ native |
    | `plugin-sdk/approval-gateway-runtime` | ตัวช่วยแก้ Gateway การอนุมัติที่ใช้ร่วมกัน |
    | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยโหลดอะแดปเตอร์การอนุมัติแบบ native น้ำหนักเบาสำหรับ entrypoint ช่องทางที่ร้อน |
    | `plugin-sdk/approval-handler-runtime` | ตัวช่วยรันไทม์ตัวจัดการการอนุมัติที่กว้างกว่า; ควรใช้ seam อะแดปเตอร์/Gateway ที่แคบกว่าเมื่อเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติแบบ native + การผูกบัญชี |
    | `plugin-sdk/approval-reply-runtime` | ตัวช่วย payload การตอบกลับการอนุมัติ exec/Plugin |
    | `plugin-sdk/approval-runtime` | ตัวช่วย payload การอนุมัติ exec/Plugin, ตัวช่วย routing/runtime การอนุมัติแบบ native และตัวช่วยแสดงผลการอนุมัติแบบมีโครงสร้าง เช่น `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | ตัวช่วยรีเซ็ตการตัดรายการตอบกลับขาเข้าที่ซ้ำแบบเฉพาะ |
    | `plugin-sdk/channel-contract-testing` | ตัวช่วยทดสอบสัญญาช่องทางแบบเฉพาะโดยไม่มี barrel การทดสอบแบบกว้าง |
    | `plugin-sdk/command-auth-native` | การยืนยันตัวตนคำสั่งแบบ native, การจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก และตัวช่วยเป้าหมายเซสชันแบบ native |
    | `plugin-sdk/command-detection` | ตัวช่วยตรวจจับคำสั่งที่ใช้ร่วมกัน |
    | `plugin-sdk/command-primitives-runtime` | predicate ข้อความคำสั่งน้ำหนักเบาสำหรับเส้นทางช่องทางที่ร้อน |
    | `plugin-sdk/command-surface` | ตัวช่วยการทำให้เนื้อหาคำสั่งเป็นมาตรฐานและ command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยรวบรวม secret-contract แบบเฉพาะสำหรับพื้นผิว secret ของช่องทาง/Plugin |
    | `plugin-sdk/secret-ref-runtime` | ตัวช่วยการพิมพ์ `coerceSecretRef` และ SecretRef แบบเฉพาะสำหรับการแยกวิเคราะห์ secret-contract/config |
    | `plugin-sdk/security-runtime` | ตัวช่วย trust, การกั้น DM, external-content, การปกปิดข้อความอ่อนไหว, การเปรียบเทียบ secret แบบเวลาคงที่ และการรวบรวม secret ที่ใช้ร่วมกัน |
    | `plugin-sdk/ssrf-policy` | ตัวช่วยนโยบาย SSRF สำหรับ allowlist ของโฮสต์และเครือข่ายส่วนตัว |
    | `plugin-sdk/ssrf-dispatcher` | ตัวช่วย pinned-dispatcher แบบเฉพาะโดยไม่มีพื้นผิวรันไทม์ infra แบบกว้าง |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, fetch ที่มีการป้องกัน SSRF, ข้อผิดพลาด SSRF และตัวช่วยนโยบาย SSRF |
    | `plugin-sdk/secret-input` | ตัวช่วยแยกวิเคราะห์อินพุต secret |
    | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ/เป้าหมาย Webhook และการแปลง websocket/body แบบ raw |
    | `plugin-sdk/webhook-request-guards` | ตัวช่วยขนาด/หมดเวลาของเนื้อหาคำขอ |
  </Accordion>

  <Accordion title="พาธย่อยของรันไทม์และพื้นที่จัดเก็บ">
    | พาธย่อย | เอ็กซ์พอร์ตหลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | ตัวช่วยรันไทม์/การบันทึกล็อก/การสำรองข้อมูล/การติดตั้ง Plugin แบบกว้าง |
    | `plugin-sdk/runtime-env` | ตัวช่วย env รันไทม์, logger, timeout, retry และ backoff แบบแคบ |
    | `plugin-sdk/browser-config` | facade การตั้งค่าเบราว์เซอร์ที่รองรับสำหรับโปรไฟล์/ค่าเริ่มต้นที่ทำให้เป็นมาตรฐาน, การแยกวิเคราะห์ URL ของ CDP และตัวช่วย auth สำหรับการควบคุมเบราว์เซอร์ |
    | `plugin-sdk/channel-runtime-context` | ตัวช่วยลงทะเบียนและค้นหา runtime-context ของช่องทางทั่วไป |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | ตัวช่วยคำสั่ง/hook/http/interactive ของ Plugin ที่ใช้ร่วมกัน |
    | `plugin-sdk/hook-runtime` | ตัวช่วย pipeline ของ webhook/hook ภายในที่ใช้ร่วมกัน |
    | `plugin-sdk/lazy-runtime` | ตัวช่วยนำเข้า/ผูก runtime แบบ lazy เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod` และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | ตัวช่วย exec ของ process |
    | `plugin-sdk/cli-runtime` | ตัวช่วยการจัดรูปแบบ CLI, การรอ, เวอร์ชัน, การเรียกใช้ด้วยอาร์กิวเมนต์ และกลุ่มคำสั่งแบบ lazy |
    | `plugin-sdk/gateway-runtime` | ตัวช่วย client ของ Gateway, การเริ่ม client ที่พร้อมสำหรับ event loop, RPC ของ CLI สำหรับ Gateway, ข้อผิดพลาดของโปรโตคอล Gateway และแพตช์สถานะช่องทาง |
    | `plugin-sdk/config-types` | พื้นผิวการตั้งค่าแบบ type-only สำหรับรูปร่างการตั้งค่า Plugin เช่น `OpenClawConfig` และชนิดการตั้งค่าช่องทาง/ผู้ให้บริการ |
    | `plugin-sdk/plugin-config-runtime` | ตัวช่วยค้นหาการตั้งค่า Plugin ขณะรันไทม์ เช่น `requireRuntimeConfig`, `resolvePluginConfigObject` และ `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | ตัวช่วยเปลี่ยนแปลงการตั้งค่าแบบธุรกรรม เช่น `mutateConfigFile`, `replaceConfigFile` และ `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วยสแนปช็อตการตั้งค่าของ process ปัจจุบัน เช่น `getRuntimeConfig`, `getRuntimeConfigSnapshot` และตัวตั้งค่าสแนปช็อตสำหรับการทดสอบ |
    | `plugin-sdk/telegram-command-config` | การทำให้ชื่อ/คำอธิบายคำสั่ง Telegram เป็นมาตรฐาน และการตรวจสอบซ้ำ/ขัดแย้ง แม้เมื่อไม่มีพื้นผิว contract ของ Telegram ที่รวมมาให้ใช้ |
    | `plugin-sdk/text-autolink-runtime` | การตรวจจับ autolink ของการอ้างอิงไฟล์โดยไม่ใช้ barrel text-runtime แบบกว้าง |
    | `plugin-sdk/approval-runtime` | ตัวช่วยการอนุมัติ exec/Plugin, builder สำหรับความสามารถการอนุมัติ, ตัวช่วย auth/โปรไฟล์, ตัวช่วย routing/runtime แบบ native และการจัดรูปแบบพาธแสดงผลการอนุมัติแบบมีโครงสร้าง |
    | `plugin-sdk/reply-runtime` | ตัวช่วย runtime ขาเข้า/ตอบกลับที่ใช้ร่วมกัน, การแบ่ง chunk, การ dispatch, Heartbeat, ตัววางแผนการตอบกลับ |
    | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วย dispatch/finalize การตอบกลับ และป้ายกำกับบทสนทนาแบบแคบ |
    | `plugin-sdk/reply-history` | ตัวช่วยและ marker ประวัติการตอบกลับช่วงสั้นที่ใช้ร่วมกัน เช่น `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` และ `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ตัวช่วยแบ่ง chunk ข้อความ/markdown แบบแคบ |
    | `plugin-sdk/session-store-runtime` | ตัวช่วยพาธ session store, session-key, updated-at และการเปลี่ยนแปลง store |
    | `plugin-sdk/cron-store-runtime` | ตัวช่วยพาธ/โหลด/บันทึก Cron store |
    | `plugin-sdk/state-paths` | ตัวช่วยพาธไดเรกทอรี State/OAuth |
    | `plugin-sdk/routing` | ตัวช่วยผูก route/session-key/account เช่น `resolveAgentRoute`, `buildAgentSessionKey` และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ตัวช่วยสรุปสถานะช่องทาง/account ที่ใช้ร่วมกัน, ค่าเริ่มต้น runtime-state และตัวช่วย metadata ของปัญหา |
    | `plugin-sdk/target-resolver-runtime` | ตัวช่วย target resolver ที่ใช้ร่วมกัน |
    | `plugin-sdk/string-normalization-runtime` | ตัวช่วยทำให้ slug/string เป็นมาตรฐาน |
    | `plugin-sdk/request-url` | แยก URL แบบ string จาก input ที่คล้าย fetch/request |
    | `plugin-sdk/run-command` | ตัวรันคำสั่งแบบจับเวลาพร้อมผลลัพธ์ stdout/stderr ที่ทำให้เป็นมาตรฐาน |
    | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ tool/CLI ทั่วไป |
    | `plugin-sdk/tool-payload` | แยก payload ที่ทำให้เป็นมาตรฐานจากอ็อบเจ็กต์ผลลัพธ์ของ tool |
    | `plugin-sdk/tool-send` | แยกฟิลด์เป้าหมายการส่งแบบ canonical จากอาร์กิวเมนต์ของ tool |
    | `plugin-sdk/temp-path` | ตัวช่วยพาธ temp-download ที่ใช้ร่วมกัน |
    | `plugin-sdk/logging-core` | ตัวช่วย logger ของ subsystem และการปกปิดข้อมูล |
    | `plugin-sdk/markdown-table-runtime` | ตัวช่วยโหมดและการแปลงตาราง Markdown |
    | `plugin-sdk/model-session-runtime` | ตัวช่วย override model/session เช่น `applyModelOverrideToSessionEntry` และ `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | ตัวช่วยแก้ไขการตั้งค่าผู้ให้บริการ Talk |
    | `plugin-sdk/json-store` | ตัวช่วยอ่าน/เขียนสถานะ JSON ขนาดเล็ก |
    | `plugin-sdk/file-lock` | ตัวช่วย file-lock แบบ re-entrant |
    | `plugin-sdk/persistent-dedupe` | ตัวช่วยแคช dedupe ที่สำรองด้วยดิสก์ |
    | `plugin-sdk/acp-runtime` | ตัวช่วย runtime/session และ reply-dispatch ของ ACP |
    | `plugin-sdk/acp-runtime-backend` | ตัวช่วยลงทะเบียน backend ACP แบบเบา และ reply-dispatch สำหรับ Plugin ที่โหลดตอนเริ่มต้น |
    | `plugin-sdk/acp-binding-resolve-runtime` | การแก้ไข binding ของ ACP แบบอ่านอย่างเดียวโดยไม่มีการ import startup ของ lifecycle |
    | `plugin-sdk/agent-config-primitives` | primitive ของ config-schema สำหรับ runtime ของ agent แบบแคบ |
    | `plugin-sdk/boolean-param` | ตัวอ่านพารามิเตอร์ boolean แบบยืดหยุ่น |
    | `plugin-sdk/dangerous-name-runtime` | ตัวช่วยแก้ไขการจับคู่ dangerous-name |
    | `plugin-sdk/device-bootstrap` | ตัวช่วย bootstrap อุปกรณ์และ token การจับคู่ |
    | `plugin-sdk/extension-shared` | primitive ตัวช่วย passive-channel, สถานะ และ proxy โดยรอบที่ใช้ร่วมกัน |
    | `plugin-sdk/models-provider-runtime` | ตัวช่วยการตอบกลับคำสั่ง/ผู้ให้บริการ `/models` |
    | `plugin-sdk/skill-commands-runtime` | ตัวช่วยแสดงรายการคำสั่ง Skill |
    | `plugin-sdk/native-command-registry` | ตัวช่วย registry/build/serialize คำสั่ง native |
    | `plugin-sdk/agent-harness` | พื้นผิว Plugin ที่เชื่อถือได้แบบทดลองสำหรับ harness ของ agent ระดับล่าง: ชนิด harness, ตัวช่วย steer/abort ของ active-run, ตัวช่วย bridge ของ tool OpenClaw, ตัวช่วยนโยบาย tool ของ runtime-plan, การจัดประเภทผลลัพธ์ terminal, ตัวช่วยการจัดรูปแบบ/รายละเอียดความคืบหน้า tool และยูทิลิตีผลลัพธ์ attempt |
    | `plugin-sdk/provider-zai-endpoint` | ตัวช่วยตรวจจับ endpoint ของ Z.AI |
    | `plugin-sdk/async-lock-runtime` | ตัวช่วยล็อก async เฉพาะ process สำหรับไฟล์สถานะ runtime ขนาดเล็ก |
    | `plugin-sdk/channel-activity-runtime` | ตัวช่วย telemetry กิจกรรมช่องทาง |
    | `plugin-sdk/concurrency-runtime` | ตัวช่วยจำกัด concurrency ของงาน async |
    | `plugin-sdk/dedupe-runtime` | ตัวช่วยแคช dedupe ในหน่วยความจำ |
    | `plugin-sdk/delivery-queue-runtime` | ตัวช่วยระบาย pending-delivery ขาออก |
    | `plugin-sdk/file-access-runtime` | ตัวช่วยพาธ local-file และ media-source ที่ปลอดภัย |
    | `plugin-sdk/heartbeat-runtime` | ตัวช่วย event และ visibility ของ Heartbeat |
    | `plugin-sdk/number-runtime` | ตัวช่วย coercion ตัวเลข |
    | `plugin-sdk/secure-random-runtime` | ตัวช่วย token/UUID ที่ปลอดภัย |
    | `plugin-sdk/system-event-runtime` | ตัวช่วยคิว system event |
    | `plugin-sdk/transport-ready-runtime` | ตัวช่วยรอความพร้อมของ transport |
    | `plugin-sdk/infra-runtime` | shim ความเข้ากันได้ที่เลิกใช้แล้ว; ใช้พาธย่อย runtime แบบเฉพาะด้านด้านบน |
    | `plugin-sdk/collection-runtime` | ตัวช่วยแคชขนาดเล็กแบบมีขอบเขต |
    | `plugin-sdk/diagnostic-runtime` | ตัวช่วย flag, event และ trace-context สำหรับ diagnostic |
    | `plugin-sdk/error-runtime` | ตัวช่วยกราฟข้อผิดพลาด, การจัดรูปแบบ, การจัดประเภทข้อผิดพลาดที่ใช้ร่วมกัน, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch ที่ wrap แล้ว, proxy, ตัวเลือก EnvHttpProxyAgent และตัวช่วย pinned lookup |
    | `plugin-sdk/runtime-fetch` | runtime fetch ที่รับรู้ dispatcher โดยไม่มีการ import proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | ตัวอ่าน response-body แบบมีขอบเขตโดยไม่ใช้พื้นผิว media runtime แบบกว้าง |
    | `plugin-sdk/session-binding-runtime` | สถานะ binding ของบทสนทนาปัจจุบันโดยไม่มี configured binding routing หรือ pairing store |
    | `plugin-sdk/session-store-runtime` | ตัวช่วย session-store โดยไม่มีการ import การเขียน/บำรุงรักษา config แบบกว้าง |
    | `plugin-sdk/context-visibility-runtime` | การแก้ไข context visibility และการกรอง context เสริมโดยไม่มีการ import config/security แบบกว้าง |
    | `plugin-sdk/string-coerce-runtime` | ตัวช่วย coercion และการทำให้ primitive record/string เป็นมาตรฐานแบบแคบโดยไม่มีการ import markdown/logging |
    | `plugin-sdk/host-runtime` | ตัวช่วยทำให้ hostname และ SCP host เป็นมาตรฐาน |
    | `plugin-sdk/retry-runtime` | ตัวช่วย config การ retry และตัวรัน retry |
    | `plugin-sdk/agent-runtime` | ตัวช่วยไดเรกทอรี/identity/workspace ของ agent |
    | `plugin-sdk/directory-runtime` | การ query/dedup ไดเรกทอรีที่รองรับด้วย config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="พาธย่อยด้านความสามารถและการทดสอบ">
    | พาธย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | ตัวช่วยดึงข้อมูล/แปลง/จัดเก็บสื่อที่ใช้ร่วมกัน, การตรวจสอบมิติวิดีโอที่ใช้ ffprobe เป็นฐาน และตัวสร้างเพย์โหลดสื่อ |
    | `plugin-sdk/media-store` | ตัวช่วยจัดเก็บสื่อแบบจำกัดขอบเขต เช่น `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | ตัวช่วย failover สำหรับการสร้างสื่อที่ใช้ร่วมกัน, การเลือก candidate และข้อความเมื่อโมเดลหายไป |
    | `plugin-sdk/media-understanding` | ประเภทผู้ให้บริการความเข้าใจสื่อ รวมถึงรายการส่งออกตัวช่วยรูปภาพ/เสียงสำหรับผู้ให้บริการ |
    | `plugin-sdk/text-runtime` | ตัวช่วยข้อความ/markdown/การบันทึกที่ใช้ร่วมกัน เช่น การลบข้อความที่ผู้ช่วยมองเห็นได้, ตัวช่วยเรนเดอร์/chunking/ตาราง markdown, ตัวช่วยปกปิดข้อมูล, ตัวช่วยแท็กคำสั่ง และยูทิลิตีข้อความปลอดภัย |
    | `plugin-sdk/text-chunking` | ตัวช่วย chunking ข้อความขาออก |
    | `plugin-sdk/speech` | ประเภทผู้ให้บริการเสียงพูด รวมถึงรายการส่งออกคำสั่ง, registry, การตรวจสอบความถูกต้อง, ตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI และตัวช่วยเสียงพูดสำหรับผู้ให้บริการ |
    | `plugin-sdk/speech-core` | ประเภทผู้ให้บริการเสียงพูดที่ใช้ร่วมกัน, registry, คำสั่ง, การทำให้เป็นมาตรฐาน และรายการส่งออกตัวช่วยเสียงพูด |
    | `plugin-sdk/realtime-transcription` | ประเภทผู้ให้บริการการถอดเสียงแบบเรียลไทม์, ตัวช่วย registry และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
    | `plugin-sdk/realtime-voice` | ประเภทผู้ให้บริการเสียงแบบเรียลไทม์และตัวช่วย registry |
    | `plugin-sdk/image-generation` | ประเภทผู้ให้บริการการสร้างรูปภาพ รวมถึงตัวช่วย asset รูปภาพ/data URL และตัวสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
    | `plugin-sdk/image-generation-core` | ประเภทการสร้างรูปภาพที่ใช้ร่วมกัน, failover, auth และตัวช่วย registry |
    | `plugin-sdk/music-generation` | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์การสร้างเพลง |
    | `plugin-sdk/music-generation-core` | ประเภทการสร้างเพลงที่ใช้ร่วมกัน, ตัวช่วย failover, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref |
    | `plugin-sdk/video-generation` | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์การสร้างวิดีโอ |
    | `plugin-sdk/video-generation-core` | ประเภทการสร้างวิดีโอที่ใช้ร่วมกัน, ตัวช่วย failover, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref |
    | `plugin-sdk/webhook-targets` | registry เป้าหมาย Webhook และตัวช่วยติดตั้ง route |
    | `plugin-sdk/webhook-path` | ตัวช่วยทำให้พาธ Webhook เป็นมาตรฐาน |
    | `plugin-sdk/web-media` | ตัวช่วยโหลดสื่อระยะไกล/ภายในเครื่องที่ใช้ร่วมกัน |
    | `plugin-sdk/zod` | `zod` ที่ส่งออกซ้ำสำหรับผู้ใช้ SDK ของ Plugin |
    | `plugin-sdk/testing` | barrel ความเข้ากันได้แบบกว้างสำหรับการทดสอบ Plugin แบบเดิม การทดสอบส่วนขยายใหม่ควรนำเข้าพาธย่อย SDK ที่เจาะจง เช่น `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` หรือ `plugin-sdk/test-fixtures` แทน |
    | `plugin-sdk/plugin-test-api` | ตัวช่วย `createTestPluginApi` ขั้นต่ำสำหรับการทดสอบหน่วยการลงทะเบียน Plugin โดยตรงโดยไม่นำเข้า bridge ตัวช่วยทดสอบของ repo |
    | `plugin-sdk/agent-runtime-test-contracts` | fixture สัญญา adapter agent-runtime แบบเนทีฟสำหรับการทดสอบ auth, delivery, fallback, tool-hook, prompt-overlay, schema และ transcript projection |
    | `plugin-sdk/channel-test-helpers` | ตัวช่วยทดสอบที่เน้น channel สำหรับสัญญา actions/setup/status ทั่วไป, การยืนยันไดเรกทอรี, วงจรชีวิตการเริ่มบัญชี, send-config threading, mock runtime, ปัญหาสถานะ, การส่งมอบขาออก และการลงทะเบียน hook |
    | `plugin-sdk/channel-target-testing` | ชุดกรณีข้อผิดพลาดการ resolve เป้าหมายที่ใช้ร่วมกันสำหรับการทดสอบ channel |
    | `plugin-sdk/plugin-test-contracts` | ตัวช่วยสัญญาแพ็กเกจ Plugin, การลงทะเบียน, artifact สาธารณะ, การนำเข้าโดยตรง, runtime API และผลข้างเคียงจากการนำเข้า |
    | `plugin-sdk/provider-test-contracts` | ตัวช่วยสัญญา provider runtime, auth, discovery, onboard, catalog, wizard, ความสามารถด้านสื่อ, นโยบาย replay, realtime STT live-audio, web-search/fetch และ stream |
    | `plugin-sdk/provider-http-test-mocks` | mock HTTP/auth ของ Vitest แบบเลือกใช้สำหรับการทดสอบผู้ให้บริการที่ทดสอบ `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | fixture ทั่วไปสำหรับการจับภาพ CLI runtime, บริบท sandbox, ตัวเขียน skill, agent-message, system-event, การโหลดโมดูลซ้ำ, พาธ Plugin ที่ bundled, terminal-text, chunking, auth-token และ typed-case |
    | `plugin-sdk/test-node-mocks` | ตัวช่วย mock builtin ของ Node แบบเจาะจงสำหรับใช้ภายใน factory ของ Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="พาธย่อยของหน่วยความจำ">
    | พาธย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/memory-core` | พื้นผิวตัวช่วย memory-core ที่ bundled สำหรับตัวช่วย manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade runtime สำหรับดัชนี/การค้นหาหน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-foundation` | รายการส่งออกเอนจิน foundation ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | สัญญา embedding ของ host หน่วยความจำ, การเข้าถึง registry, ผู้ให้บริการภายในเครื่อง และตัวช่วย batch/remote ทั่วไป |
    | `plugin-sdk/memory-core-host-engine-qmd` | รายการส่งออกเอนจิน QMD ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-storage` | รายการส่งออกเอนจิน storage ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วย multimodal ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-query` | ตัวช่วย query ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-secret` | ตัวช่วย secret ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-events` | ตัวช่วย event journal ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-status` | ตัวช่วย status ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-cli` | ตัวช่วย CLI runtime ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-core` | ตัวช่วย core runtime ของ host หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วย file/runtime ของ host หน่วยความจำ |
    | `plugin-sdk/memory-host-core` | alias ที่เป็นกลางต่อ vendor สำหรับตัวช่วย core runtime ของ host หน่วยความจำ |
    | `plugin-sdk/memory-host-events` | alias ที่เป็นกลางต่อ vendor สำหรับตัวช่วย event journal ของ host หน่วยความจำ |
    | `plugin-sdk/memory-host-files` | alias ที่เป็นกลางต่อ vendor สำหรับตัวช่วย file/runtime ของ host หน่วยความจำ |
    | `plugin-sdk/memory-host-markdown` | ตัวช่วย managed-markdown ที่ใช้ร่วมกันสำหรับ Plugin ที่เกี่ยวข้องกับหน่วยความจำ |
    | `plugin-sdk/memory-host-search` | facade runtime ของ active memory สำหรับการเข้าถึง search-manager |
    | `plugin-sdk/memory-host-status` | alias ที่เป็นกลางต่อ vendor สำหรับตัวช่วย status ของ host หน่วยความจำ |
  </Accordion>

  <Accordion title="พาธย่อยของตัวช่วย bundled ที่สงวนไว้">
    ปัจจุบันไม่มีพาธย่อย SDK ของตัวช่วย bundled ที่สงวนไว้ ตัวช่วยเฉพาะเจ้าของ
    อยู่ภายในแพ็กเกจ Plugin เจ้าของ ขณะที่สัญญา host ที่ใช้ซ้ำได้
    ใช้พาธย่อย SDK ทั่วไป เช่น `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` และ `plugin-sdk/plugin-config-runtime`
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวม SDK ของ Plugin](/th/plugins/sdk-overview)
- [การตั้งค่า SDK ของ Plugin](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
