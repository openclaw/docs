---
read_when:
    - การเลือกเส้นทางย่อย plugin-sdk ที่เหมาะสมสำหรับการนำเข้า Plugin
    - การตรวจสอบเส้นทางย่อยของ Plugin ที่รวมมาด้วยและอินเทอร์เฟซตัวช่วย
summary: 'แค็ตตาล็อกพาธย่อยของ Plugin SDK: การ import ใดอยู่ที่ใด จัดกลุ่มตามหมวดหมู่'
title: พาธย่อยของ Plugin SDK
x-i18n:
    generated_at: "2026-05-02T20:59:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc0d2dcf030796d2c73d4d679b9f8d7f6a8aaf71c6b5232b60afbbb50f42b348
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK ของ Plugin ถูกเปิดเผยเป็นชุด subpath ขอบเขตแคบภายใต้ `openclaw/plugin-sdk/`
  หน้านี้จัดรายการ subpath ที่ใช้กันทั่วไป โดยจัดกลุ่มตามวัตถุประสงค์ รายการฉบับเต็มที่สร้างขึ้น
  ของ subpath มากกว่า 200 รายการอยู่ใน `scripts/lib/plugin-sdk-entrypoints.json`;
  subpath ตัวช่วยสำหรับ bundled-plugin ที่สงวนไว้ปรากฏอยู่ที่นั่น แต่เป็นรายละเอียดการใช้งานภายใน
  เว้นแต่หน้าคู่มือจะโปรโมตอย่างชัดเจน ผู้ดูแลสามารถตรวจสอบ subpath ตัวช่วยที่สงวนไว้ซึ่งใช้งานอยู่
  ด้วย `pnpm plugins:boundary-report:summary`; export ตัวช่วยที่สงวนไว้แต่ไม่ได้ใช้งาน
  จะทำให้รายงาน CI ล้มเหลว แทนที่จะค้างอยู่ใน SDK สาธารณะ
  เป็นหนี้ความเข้ากันได้ที่ไม่ทำงาน

  สำหรับคู่มือการเขียน Plugin โปรดดู [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

  ## จุดเข้า Plugin

  | Subpath                                   | export หลัก                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | barrel ความเข้ากันได้แบบกว้างสำหรับการทดสอบ Plugin แบบเดิม; ควรใช้ subpath ทดสอบที่เจาะจงสำหรับการทดสอบ extension ใหม่                                                                     |
  | `plugin-sdk/plugin-test-api`              | ตัวสร้าง mock `OpenClawPluginApi` แบบขั้นต่ำสำหรับ unit test การลงทะเบียน Plugin โดยตรง                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | fixture สัญญา adapter ของ agent-runtime แบบ native สำหรับโปรไฟล์ auth, การระงับการส่ง, การจัดประเภท fallback, hook เครื่องมือ, prompt overlay, schema และการซ่อม transcript |
  | `plugin-sdk/channel-test-helpers`         | ตัวช่วยทดสอบวงจรชีวิตบัญชี channel, ไดเรกทอรี, send-config, runtime mock, hook, รายการ channel ที่ bundled, timestamp ของ envelope, การตอบกลับการ pairing และสัญญา channel ทั่วไป   |
  | `plugin-sdk/channel-target-testing`       | ชุดทดสอบกรณีข้อผิดพลาดของการ resolve target channel ที่ใช้ร่วมกัน                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | ตัวช่วยสัญญาการลงทะเบียน Plugin, package manifest, artifact สาธารณะ, runtime API, side effect ของการ import และการ import โดยตรง                                                  |
  | `plugin-sdk/plugin-test-runtime`          | fixture สำหรับทดสอบ runtime ของ Plugin, registry, การลงทะเบียน provider, setup-wizard และ runtime task-flow                                                                      |
  | `plugin-sdk/provider-test-contracts`      | ตัวช่วยสัญญา runtime ของ provider, auth, discovery, onboard, catalog, media capability, replay policy, realtime STT live-audio, web-search/fetch และ wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | mock HTTP/auth ของ Vitest แบบเลือกใช้สำหรับการทดสอบ provider ที่ exercise `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | fixture สำหรับสภาพแวดล้อมทดสอบ, fetch/network, เซิร์ฟเวอร์ HTTP แบบใช้แล้วทิ้ง, คำขอขาเข้า, live-test, filesystem ชั่วคราว และการควบคุมเวลา                                        |
  | `plugin-sdk/test-fixtures`                | fixture ทดสอบ CLI, sandbox, skill, agent-message, system-event, module reload, path ของ bundled Plugin, terminal, chunking, auth-token และ typed-case แบบทั่วไป                   |
  | `plugin-sdk/test-node-mocks`              | ตัวช่วย mock builtin ของ Node แบบเจาะจงสำหรับใช้ภายใน factory ของ Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | ตัวช่วยรายการ migration provider เช่น `createMigrationItem`, ค่าคงที่เหตุผล, marker สถานะรายการ, ตัวช่วย redaction และ `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | ตัวช่วย migration ใน runtime เช่น `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` และ `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Subpath ของ channel">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | export schema Zod ของ root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | ตัวช่วย setup wizard ที่ใช้ร่วมกัน, prompt allowlist, ตัวสร้างสถานะ setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | ตัวช่วย config/action-gate หลายบัญชี, ตัวช่วย fallback บัญชีเริ่มต้น |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ตัวช่วย normalization ของ account-id |
    | `plugin-sdk/account-resolution` | ตัวช่วย lookup บัญชี + default-fallback |
    | `plugin-sdk/account-helpers` | ตัวช่วย account-list/account-action แบบขอบเขตแคบ |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | primitive ของ schema config channel ที่ใช้ร่วมกัน รวมถึงตัวสร้าง Zod และ JSON/TypeBox โดยตรง |
    | `plugin-sdk/bundled-channel-config-schema` | schema config channel ของ OpenClaw ที่ bundled สำหรับ Plugin bundled ที่ดูแลอยู่เท่านั้น |
    | `plugin-sdk/channel-config-schema-legacy` | alias ความเข้ากันได้ที่เลิกใช้แล้วสำหรับ schema config ของ bundled-channel |
    | `plugin-sdk/telegram-command-config` | ตัวช่วย normalization/validation ของคำสั่งกำหนดเอง Telegram พร้อม fallback ของ bundled-contract |
    | `plugin-sdk/command-gating` | ตัวช่วย gate การอนุญาตคำสั่งแบบขอบเขตแคบ |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, ตัวช่วยวงจรชีวิต/finalization ของ draft stream |
    | `plugin-sdk/inbound-envelope` | ตัวช่วย route ขาเข้า + ตัวสร้าง envelope ที่ใช้ร่วมกัน |
    | `plugin-sdk/inbound-reply-dispatch` | ตัวช่วย record-and-dispatch ขาเข้าที่ใช้ร่วมกัน |
    | `plugin-sdk/messaging-targets` | ตัวช่วย parsing/matching ของ target |
    | `plugin-sdk/outbound-media` | ตัวช่วยโหลด media ขาออกที่ใช้ร่วมกัน |
    | `plugin-sdk/outbound-send-deps` | การ lookup dependency การส่งขาออกแบบเบาสำหรับ adapter ของ channel |
    | `plugin-sdk/outbound-runtime` | ตัวช่วยการส่งขาออก, identity, send delegate, session, formatting และการวางแผน payload |
    | `plugin-sdk/poll-runtime` | ตัวช่วย normalization ของ poll แบบขอบเขตแคบ |
    | `plugin-sdk/thread-bindings-runtime` | ตัวช่วยวงจรชีวิตและ adapter ของ thread-binding |
    | `plugin-sdk/agent-media-payload` | ตัวสร้าง payload media ของ agent แบบเดิม |
    | `plugin-sdk/conversation-runtime` | ตัวช่วย conversation/thread binding, pairing และ configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วย snapshot config runtime |
    | `plugin-sdk/runtime-group-policy` | ตัวช่วยการ resolve group-policy ใน runtime |
    | `plugin-sdk/channel-status` | ตัวช่วย snapshot/summary สถานะ channel ที่ใช้ร่วมกัน |
    | `plugin-sdk/channel-config-primitives` | primitive ของ schema config channel แบบขอบเขตแคบ |
    | `plugin-sdk/channel-config-writes` | ตัวช่วยการอนุญาตการเขียน config channel |
    | `plugin-sdk/channel-plugin-common` | export prelude ของ Plugin channel ที่ใช้ร่วมกัน |
    | `plugin-sdk/allowlist-config-edit` | ตัวช่วยแก้ไข/อ่าน config allowlist |
    | `plugin-sdk/group-access` | ตัวช่วยการตัดสินใจ group-access ที่ใช้ร่วมกัน |
    | `plugin-sdk/direct-dm` | ตัวช่วย auth/guard สำหรับ direct-DM ที่ใช้ร่วมกัน |
    | `plugin-sdk/discord` | facade ความเข้ากันได้ Discord ที่เลิกใช้แล้วสำหรับ `@openclaw/discord@2026.3.13` ที่เผยแพร่แล้ว และความเข้ากันได้ของ owner ที่ติดตามอยู่; Plugin ใหม่ควรใช้ subpath SDK ของ channel ทั่วไป |
    | `plugin-sdk/telegram-account` | facade ความเข้ากันได้ของการ resolve บัญชี Telegram ที่เลิกใช้แล้วสำหรับความเข้ากันได้ของ owner ที่ติดตามอยู่; Plugin ใหม่ควรใช้ตัวช่วย runtime ที่ inject เข้ามาหรือ subpath SDK ของ channel ทั่วไป |
    | `plugin-sdk/zalouser` | facade ความเข้ากันได้ Zalo Personal ที่เลิกใช้แล้วสำหรับแพ็กเกจ Lark/Zalo ที่เผยแพร่แล้วซึ่งยัง import การอนุญาตคำสั่งของผู้ส่ง; Plugin ใหม่ควรใช้ `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | ตัวช่วยการนำเสนอข้อความเชิง semantic, การส่ง และการตอบกลับ interactive แบบเดิม ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | barrel ความเข้ากันได้สำหรับ inbound debounce, การจับคู่ mention, ตัวช่วย mention-policy และตัวช่วย envelope |
    | `plugin-sdk/channel-inbound-debounce` | ตัวช่วย inbound debounce แบบขอบเขตแคบ |
    | `plugin-sdk/channel-mention-gating` | ตัวช่วย mention-policy, marker ของ mention และข้อความ mention แบบขอบเขตแคบ โดยไม่มี surface runtime ขาเข้าที่กว้างกว่า |
    | `plugin-sdk/channel-envelope` | ตัวช่วย formatting envelope ขาเข้าแบบขอบเขตแคบ |
    | `plugin-sdk/channel-location` | บริบทตำแหน่ง channel และตัวช่วย formatting |
    | `plugin-sdk/channel-logging` | ตัวช่วย logging ของ channel สำหรับ inbound drops และความล้มเหลว typing/ack |
    | `plugin-sdk/channel-send-result` | ประเภทผลลัพธ์ reply |
    | `plugin-sdk/channel-actions` | ตัวช่วย message-action ของ channel รวมถึงตัวช่วย schema native ที่เลิกใช้แล้วซึ่งเก็บไว้เพื่อความเข้ากันได้ของ Plugin |
    | `plugin-sdk/channel-route` | ตัวช่วย normalization ของ route, การ resolve target ที่ขับด้วย parser, การแปลง thread-id เป็น string, คีย์ route แบบ dedupe/compact, ประเภท parsed-target และตัวช่วยเปรียบเทียบ route/target ที่ใช้ร่วมกัน |
    | `plugin-sdk/channel-targets` | ตัวช่วย parsing target; caller ที่เปรียบเทียบ route ควรใช้ `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | ประเภทสัญญา channel |
    | `plugin-sdk/channel-feedback` | การเชื่อมสาย feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วย secret-contract แบบขอบเขตแคบ เช่น `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` และประเภท secret target |
  </Accordion>

  <Accordion title="เส้นทางย่อยของผู้ให้บริการ">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | facade ของผู้ให้บริการ LM Studio ที่รองรับ สำหรับการตั้งค่า การค้นพบแค็ตตาล็อก และการเตรียมโมเดลขณะรันไทม์ |
    | `plugin-sdk/lmstudio-runtime` | facade รันไทม์ของ LM Studio ที่รองรับ สำหรับค่าเริ่มต้นของเซิร์ฟเวอร์ภายในเครื่อง การค้นพบโมเดล ส่วนหัวคำขอ และตัวช่วยสำหรับโมเดลที่โหลดแล้ว |
    | `plugin-sdk/provider-setup` | ตัวช่วยการตั้งค่าผู้ให้บริการภายในเครื่อง/โฮสต์เองแบบคัดสรร |
    | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยการตั้งค่าผู้ให้บริการแบบโฮสต์เองที่เข้ากันได้กับ OpenAI โดยเฉพาะ |
    | `plugin-sdk/cli-backend` | ค่าเริ่มต้นของแบ็กเอนด์ CLI + ค่าคงที่ watchdog |
    | `plugin-sdk/provider-auth-runtime` | ตัวช่วยการแก้ไข API key ขณะรันไทม์สำหรับ Plugin ผู้ให้บริการ |
    | `plugin-sdk/provider-auth-api-key` | ตัวช่วยการเริ่มต้นใช้งาน API key/การเขียนโปรไฟล์ เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
    | `plugin-sdk/provider-auth-login` | ตัวช่วยเข้าสู่ระบบแบบโต้ตอบที่ใช้ร่วมกันสำหรับ Plugin ผู้ให้บริการ |
    | `plugin-sdk/provider-env-vars` | ตัวช่วยค้นหาตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตนของผู้ให้บริการ |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้างนโยบาย replay ที่ใช้ร่วมกัน, ตัวช่วย endpoint ของผู้ให้บริการ และตัวช่วยปรับ model id ให้เป็นมาตรฐาน เช่น `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | hook รันไทม์สำหรับเสริมแค็ตตาล็อกผู้ให้บริการ และ seam ของรีจิสทรี plugin-provider สำหรับการทดสอบสัญญา |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | ตัวช่วยความสามารถ HTTP/endpoint ทั่วไปของผู้ให้บริการ ข้อผิดพลาด HTTP ของผู้ให้บริการ และตัวช่วยแบบฟอร์ม multipart สำหรับการถอดเสียงเสียง |
    | `plugin-sdk/provider-web-fetch-contract` | ตัวช่วยสัญญา config/การเลือก web-fetch แบบแคบ เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | ตัวช่วยการลงทะเบียน/แคชผู้ให้บริการ web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วย config/ข้อมูลรับรอง web-search แบบแคบสำหรับผู้ให้บริการที่ไม่ต้องใช้การเดินสายเปิดใช้ Plugin |
    | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญา config/ข้อมูลรับรอง web-search แบบแคบ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวรับข้อมูลรับรองตามขอบเขต |
    | `plugin-sdk/provider-web-search` | ตัวช่วยการลงทะเบียน/แคช/รันไทม์ผู้ให้บริการ web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, การล้างสคีมา Gemini + การวินิจฉัย และตัวช่วย compat ของ xAI เช่น `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` และสิ่งที่คล้ายกัน |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ประเภทตัวห่อ stream และตัวช่วยตัวห่อ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ที่ใช้ร่วมกัน |
    | `plugin-sdk/provider-transport-runtime` | ตัวช่วย transport ดั้งเดิมของผู้ให้บริการ เช่น guarded fetch การแปลงข้อความ transport และ stream เหตุการณ์ transport ที่เขียนได้ |
    | `plugin-sdk/provider-onboard` | ตัวช่วยแพตช์ config สำหรับการเริ่มต้นใช้งาน |
    | `plugin-sdk/global-singleton` | ตัวช่วย singleton/map/cache ภายในโปรเซส |
    | `plugin-sdk/group-activation` | ตัวช่วยโหมดการเปิดใช้งานกลุ่มและการแยกวิเคราะห์คำสั่งแบบแคบ |
  </Accordion>

  <Accordion title="เส้นทางย่อยการยืนยันตัวตนและความปลอดภัย">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ตัวช่วยรีจิสทรีคำสั่ง รวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก, ตัวช่วยการอนุญาตผู้ส่ง |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความคำสั่ง/ความช่วยเหลือ เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | ตัวช่วยการแก้ไขผู้อนุมัติและ action-auth ในแชตเดียวกัน |
    | `plugin-sdk/approval-client-runtime` | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติ native exec |
    | `plugin-sdk/approval-delivery-runtime` | อะแดปเตอร์ความสามารถ/การส่งมอบการอนุมัติแบบ native |
    | `plugin-sdk/approval-gateway-runtime` | ตัวช่วยการแก้ไข Gateway การอนุมัติที่ใช้ร่วมกัน |
    | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยโหลดอะแดปเตอร์การอนุมัติแบบ native น้ำหนักเบาสำหรับ entrypoint ช่องทางที่ร้อน |
    | `plugin-sdk/approval-handler-runtime` | ตัวช่วยรันไทม์ตัวจัดการการอนุมัติที่กว้างกว่า; ควรใช้ seam ของอะแดปเตอร์/Gateway ที่แคบกว่าเมื่อเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติแบบ native + การผูกบัญชี |
    | `plugin-sdk/approval-reply-runtime` | ตัวช่วย payload การตอบกลับการอนุมัติ exec/plugin |
    | `plugin-sdk/approval-runtime` | ตัวช่วย payload การอนุมัติ exec/plugin, ตัวช่วยการกำหนดเส้นทาง/รันไทม์การอนุมัติแบบ native และตัวช่วยการแสดงผลการอนุมัติแบบมีโครงสร้าง เช่น `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | ตัวช่วยรีเซ็ตการลบการตอบกลับขาเข้าซ้ำแบบแคบ |
    | `plugin-sdk/channel-contract-testing` | ตัวช่วยทดสอบสัญญาช่องทางแบบแคบโดยไม่มี barrel การทดสอบแบบกว้าง |
    | `plugin-sdk/command-auth-native` | การยืนยันตัวตนคำสั่งแบบ native, การจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก และตัวช่วยเป้าหมายเซสชันแบบ native |
    | `plugin-sdk/command-detection` | ตัวช่วยการตรวจจับคำสั่งที่ใช้ร่วมกัน |
    | `plugin-sdk/command-primitives-runtime` | เพรดิเคตข้อความคำสั่งน้ำหนักเบาสำหรับเส้นทางช่องทางที่ร้อน |
    | `plugin-sdk/command-surface` | ตัวช่วยการปรับเนื้อหาคำสั่งให้เป็นมาตรฐานและ command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยรวบรวมสัญญาข้อมูลลับแบบแคบสำหรับพื้นผิวข้อมูลลับของช่องทาง/plugin |
    | `plugin-sdk/secret-ref-runtime` | ตัวช่วย `coerceSecretRef` แบบแคบและการพิมพ์ SecretRef สำหรับการแยกวิเคราะห์สัญญาข้อมูลลับ/config |
    | `plugin-sdk/security-runtime` | ตัวช่วย trust ที่ใช้ร่วมกัน, การควบคุม DM, external-content, การปกปิดข้อความละเอียดอ่อน, การเปรียบเทียบข้อมูลลับแบบ constant-time และการรวบรวมข้อมูลลับ |
    | `plugin-sdk/ssrf-policy` | ตัวช่วยนโยบาย allowlist โฮสต์และ SSRF เครือข่ายส่วนตัว |
    | `plugin-sdk/ssrf-dispatcher` | ตัวช่วย pinned-dispatcher แบบแคบโดยไม่มีพื้นผิวรันไทม์ infra แบบกว้าง |
    | `plugin-sdk/ssrf-runtime` | ตัวช่วย pinned-dispatcher, SSRF-guarded fetch, ข้อผิดพลาด SSRF และนโยบาย SSRF |
    | `plugin-sdk/secret-input` | ตัวช่วยการแยกวิเคราะห์อินพุตข้อมูลลับ |
    | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ/เป้าหมาย Webhook และการบังคับ websocket/body ดิบ |
    | `plugin-sdk/webhook-request-guards` | ตัวช่วยขนาด/หมดเวลาของ request body |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | ตัวช่วย runtime/logging/backup/การติดตั้ง Plugin แบบกว้าง |
    | `plugin-sdk/runtime-env` | ตัวช่วย env ของ runtime, logger, timeout, retry และ backoff แบบแคบ |
    | `plugin-sdk/browser-config` | facade การตั้งค่าเบราว์เซอร์ที่รองรับ สำหรับโปรไฟล์/ค่าเริ่มต้นที่ผ่านการทำให้เป็นมาตรฐาน, การแยกวิเคราะห์ CDP URL และตัวช่วย auth สำหรับควบคุมเบราว์เซอร์ |
    | `plugin-sdk/channel-runtime-context` | ตัวช่วยลงทะเบียนและค้นหา runtime-context ของช่องทางแบบทั่วไป |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | ตัวช่วยคำสั่ง/hook/http/interactive ของ Plugin แบบใช้ร่วมกัน |
    | `plugin-sdk/hook-runtime` | ตัวช่วย pipeline ของ Webhook/hook ภายในแบบใช้ร่วมกัน |
    | `plugin-sdk/lazy-runtime` | ตัวช่วยนำเข้า/ผูก runtime แบบ lazy เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod` และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | ตัวช่วย exec ของกระบวนการ |
    | `plugin-sdk/cli-runtime` | ตัวช่วยการจัดรูปแบบ CLI, การรอ, เวอร์ชัน, การเรียกด้วยอาร์กิวเมนต์ และกลุ่มคำสั่งแบบ lazy |
    | `plugin-sdk/gateway-runtime` | ไคลเอนต์ Gateway, ตัวช่วยเริ่มไคลเอนต์ที่พร้อมสำหรับ event-loop, RPC ของ CLI สำหรับ Gateway, ข้อผิดพลาดของโปรโตคอล Gateway และตัวช่วยแพตช์สถานะช่องทาง |
    | `plugin-sdk/config-types` | พื้นผิวการตั้งค่าแบบชนิดเท่านั้นสำหรับรูปร่างการตั้งค่า Plugin เช่น `OpenClawConfig` และชนิดการตั้งค่าช่องทาง/ผู้ให้บริการ |
    | `plugin-sdk/plugin-config-runtime` | ตัวช่วยค้นหา plugin-config ตอน runtime เช่น `requireRuntimeConfig`, `resolvePluginConfigObject` และ `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | ตัวช่วยแก้ไขการตั้งค่าแบบธุรกรรม เช่น `mutateConfigFile`, `replaceConfigFile` และ `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วย snapshot การตั้งค่ากระบวนการปัจจุบัน เช่น `getRuntimeConfig`, `getRuntimeConfigSnapshot` และตัวตั้งค่า snapshot สำหรับทดสอบ |
    | `plugin-sdk/telegram-command-config` | การทำให้ชื่อ/คำอธิบายคำสั่ง Telegram เป็นมาตรฐาน และการตรวจสอบซ้ำ/ขัดแย้ง แม้เมื่อพื้นผิวสัญญา Telegram ที่ bundled ไม่พร้อมใช้งาน |
    | `plugin-sdk/text-autolink-runtime` | การตรวจจับ autolink ของการอ้างอิงไฟล์โดยไม่ใช้ barrel ของ text-runtime แบบกว้าง |
    | `plugin-sdk/approval-runtime` | ตัวช่วยการอนุมัติ exec/Plugin, ตัวสร้างความสามารถการอนุมัติ, ตัวช่วย auth/โปรไฟล์, ตัวช่วย routing/runtime แบบ native และการจัดรูปแบบพาธแสดงผลการอนุมัติแบบมีโครงสร้าง |
    | `plugin-sdk/reply-runtime` | ตัวช่วย runtime สำหรับขาเข้า/ตอบกลับแบบใช้ร่วมกัน, การแบ่งชิ้น, การ dispatch, Heartbeat, ตัววางแผนการตอบกลับ |
    | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วย dispatch/finalize การตอบกลับและป้ายกำกับการสนทนาแบบแคบ |
    | `plugin-sdk/reply-history` | ตัวช่วยประวัติการตอบกลับช่วงสั้นแบบใช้ร่วมกัน และ marker เช่น `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` และ `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ตัวช่วยแบ่งชิ้นข้อความ/markdown แบบแคบ |
    | `plugin-sdk/session-store-runtime` | ตัวช่วยพาธ store ของ session, session-key, updated-at และการแก้ไข store |
    | `plugin-sdk/cron-store-runtime` | ตัวช่วยพาธ/โหลด/บันทึก store ของ Cron |
    | `plugin-sdk/state-paths` | ตัวช่วยพาธไดเรกทอรี state/OAuth |
    | `plugin-sdk/routing` | ตัวช่วย route/session-key/การผูกบัญชี เช่น `resolveAgentRoute`, `buildAgentSessionKey` และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ตัวช่วยสรุปสถานะช่องทาง/บัญชีแบบใช้ร่วมกัน, ค่าเริ่มต้น runtime-state และตัวช่วย metadata ของปัญหา |
    | `plugin-sdk/target-resolver-runtime` | ตัวช่วย target resolver แบบใช้ร่วมกัน |
    | `plugin-sdk/string-normalization-runtime` | ตัวช่วยทำให้ slug/string เป็นมาตรฐาน |
    | `plugin-sdk/request-url` | แยก URL แบบสตริงจากอินพุตที่คล้าย fetch/request |
    | `plugin-sdk/run-command` | ตัวรันคำสั่งแบบมีเวลา พร้อมผลลัพธ์ stdout/stderr ที่ทำให้เป็นมาตรฐาน |
    | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ tool/CLI ทั่วไป |
    | `plugin-sdk/tool-payload` | แยก payload ที่ทำให้เป็นมาตรฐานจากออบเจ็กต์ผลลัพธ์ของ tool |
    | `plugin-sdk/tool-send` | แยกฟิลด์เป้าหมายการส่งแบบ canonical จากอาร์กิวเมนต์ของ tool |
    | `plugin-sdk/temp-path` | ตัวช่วยพาธดาวน์โหลดชั่วคราวแบบใช้ร่วมกัน |
    | `plugin-sdk/logging-core` | ตัวช่วย logger ของระบบย่อยและการปกปิดข้อมูล |
    | `plugin-sdk/markdown-table-runtime` | ตัวช่วยโหมดตาราง Markdown และการแปลง |
    | `plugin-sdk/model-session-runtime` | ตัวช่วย override model/session เช่น `applyModelOverrideToSessionEntry` และ `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | ตัวช่วยแก้ไขการตั้งค่าผู้ให้บริการ talk |
    | `plugin-sdk/json-store` | ตัวช่วยอ่าน/เขียน state แบบ JSON ขนาดเล็ก |
    | `plugin-sdk/file-lock` | ตัวช่วย file-lock แบบ re-entrant |
    | `plugin-sdk/persistent-dedupe` | ตัวช่วยแคช dedupe ที่มีดิสก์รองรับ |
    | `plugin-sdk/acp-runtime` | ตัวช่วย runtime/session และ reply-dispatch ของ ACP |
    | `plugin-sdk/acp-runtime-backend` | ตัวช่วยลงทะเบียน backend ของ ACP แบบเบา และ reply-dispatch สำหรับ Plugin ที่โหลดตอนเริ่มต้น |
    | `plugin-sdk/acp-binding-resolve-runtime` | การแก้ไข binding ของ ACP แบบอ่านอย่างเดียวโดยไม่ต้องนำเข้า lifecycle startup |
    | `plugin-sdk/agent-config-primitives` | primitive ของ config-schema สำหรับ runtime ของ agent แบบแคบ |
    | `plugin-sdk/boolean-param` | ตัวอ่านพารามิเตอร์ boolean แบบผ่อนปรน |
    | `plugin-sdk/dangerous-name-runtime` | ตัวช่วยแก้ไขการจับคู่ dangerous-name |
    | `plugin-sdk/device-bootstrap` | ตัวช่วย bootstrap อุปกรณ์และ pairing token |
    | `plugin-sdk/extension-shared` | primitive ของตัวช่วย passive-channel, สถานะ และ ambient proxy แบบใช้ร่วมกัน |
    | `plugin-sdk/models-provider-runtime` | ตัวช่วยตอบกลับคำสั่ง/ผู้ให้บริการ `/models` |
    | `plugin-sdk/skill-commands-runtime` | ตัวช่วยแสดงรายการคำสั่งของ Skills |
    | `plugin-sdk/native-command-registry` | ตัวช่วย registry/build/serialize ของคำสั่ง native |
    | `plugin-sdk/agent-harness` | พื้นผิว Plugin ที่เชื่อถือได้แบบทดลองสำหรับ harness ของ agent ระดับต่ำ: ชนิด harness, ตัวช่วย steer/abort ของ active-run, ตัวช่วย bridge tool ของ OpenClaw, ตัวช่วย policy ของ runtime-plan tool, การจัดประเภทผลลัพธ์ terminal, ตัวช่วยจัดรูปแบบ/รายละเอียดความคืบหน้าของ tool และยูทิลิตีผลลัพธ์ของ attempt |
    | `plugin-sdk/provider-zai-endpoint` | ตัวช่วยตรวจจับ endpoint ของ Z.AI |
    | `plugin-sdk/async-lock-runtime` | ตัวช่วย async lock ภายในกระบวนการสำหรับไฟล์ state ตอน runtime ขนาดเล็ก |
    | `plugin-sdk/channel-activity-runtime` | ตัวช่วย telemetry ของกิจกรรมช่องทาง |
    | `plugin-sdk/concurrency-runtime` | ตัวช่วย concurrency ของงาน async แบบมีขอบเขต |
    | `plugin-sdk/dedupe-runtime` | ตัวช่วยแคช dedupe ในหน่วยความจำ |
    | `plugin-sdk/delivery-queue-runtime` | ตัวช่วย drain การส่งมอบขาออกที่รอดำเนินการ |
    | `plugin-sdk/file-access-runtime` | ตัวช่วยพาธไฟล์ในเครื่องและ media-source ที่ปลอดภัย |
    | `plugin-sdk/heartbeat-runtime` | ตัวช่วย event และ visibility ของ Heartbeat |
    | `plugin-sdk/number-runtime` | ตัวช่วยบังคับแปลงเป็นตัวเลข |
    | `plugin-sdk/secure-random-runtime` | ตัวช่วย token/UUID ที่ปลอดภัย |
    | `plugin-sdk/system-event-runtime` | ตัวช่วยคิว event ของระบบ |
    | `plugin-sdk/transport-ready-runtime` | ตัวช่วยรอความพร้อมของ transport |
    | `plugin-sdk/infra-runtime` | shim ความเข้ากันได้ที่เลิกใช้แล้ว; ใช้พาธย่อยของ runtime ที่เจาะจงด้านบน |
    | `plugin-sdk/collection-runtime` | ตัวช่วยแคชขนาดเล็กแบบมีขอบเขต |
    | `plugin-sdk/diagnostic-runtime` | ตัวช่วย flag, event และ trace-context สำหรับการวินิจฉัย |
    | `plugin-sdk/error-runtime` | กราฟข้อผิดพลาด, การจัดรูปแบบ, ตัวช่วยจัดประเภทข้อผิดพลาดแบบใช้ร่วมกัน, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch ที่ wrap แล้ว, proxy, ตัวเลือก EnvHttpProxyAgent และตัวช่วย lookup แบบ pinned |
    | `plugin-sdk/runtime-fetch` | fetch ตอน runtime ที่รับรู้ dispatcher โดยไม่ต้องนำเข้า proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | ตัวอ่าน response-body แบบมีขอบเขตโดยไม่ใช้พื้นผิว media runtime แบบกว้าง |
    | `plugin-sdk/session-binding-runtime` | state การผูกการสนทนาปัจจุบันโดยไม่มี routing ของ binding ที่ตั้งค่าไว้หรือ store สำหรับ pairing |
    | `plugin-sdk/session-store-runtime` | ตัวช่วย session-store โดยไม่ต้องนำเข้าการเขียน/บำรุงรักษาการตั้งค่าแบบกว้าง |
    | `plugin-sdk/context-visibility-runtime` | การแก้ไข visibility ของ context และการกรอง context เสริมโดยไม่ต้องนำเข้าการตั้งค่า/ความปลอดภัยแบบกว้าง |
    | `plugin-sdk/string-coerce-runtime` | ตัวช่วย coercion และ normalization ของ record/string แบบ primitive ที่แคบ โดยไม่ต้องนำเข้า markdown/logging |
    | `plugin-sdk/host-runtime` | ตัวช่วยทำให้ hostname และ host ของ SCP เป็นมาตรฐาน |
    | `plugin-sdk/retry-runtime` | ตัวช่วยการตั้งค่า retry และ runner สำหรับ retry |
    | `plugin-sdk/agent-runtime` | ตัวช่วยไดเรกทอรี/identity/workspace ของ agent |
    | `plugin-sdk/directory-runtime` | การ query/dedup ไดเรกทอรีที่รองรับด้วย config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="เส้นทางย่อยสำหรับความสามารถและการทดสอบ">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | ตัวช่วยร่วมสำหรับดึง/แปลง/จัดเก็บสื่อ การตรวจสอบขนาดวิดีโอที่ใช้ ffprobe และตัวสร้างเพย์โหลดสื่อ |
    | `plugin-sdk/media-store` | ตัวช่วยที่มีขอบเขตแคบสำหรับที่เก็บสื่อ เช่น `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | ตัวช่วย failover ร่วมสำหรับการสร้างสื่อ การเลือกแคนดิเดต และข้อความแจ้งเมื่อไม่มีโมเดล |
    | `plugin-sdk/media-understanding` | ชนิดของผู้ให้บริการสำหรับการทำความเข้าใจสื่อ พร้อมการส่งออกตัวช่วยรูปภาพ/เสียงที่หันหน้าให้ผู้ให้บริการ |
    | `plugin-sdk/text-runtime` | ตัวช่วยร่วมสำหรับข้อความ/Markdown/การบันทึก เช่น การลบข้อความที่ผู้ช่วยมองเห็น ตัวช่วยเรนเดอร์/แบ่งชิ้น/ตารางของ Markdown ตัวช่วยปกปิดข้อมูล ตัวช่วยแท็กคำสั่ง และยูทิลิตีข้อความปลอดภัย |
    | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งชิ้นข้อความขาออก |
    | `plugin-sdk/speech` | ชนิดของผู้ให้บริการเสียงพูด พร้อมการส่งออกคำสั่ง รีจิสทรี การตรวจสอบความถูกต้อง ตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI และตัวช่วยเสียงพูดที่หันหน้าให้ผู้ให้บริการ |
    | `plugin-sdk/speech-core` | ชนิดผู้ให้บริการเสียงพูดร่วม รีจิสทรี คำสั่ง การทำให้เป็นรูปแบบปกติ และการส่งออกตัวช่วยเสียงพูด |
    | `plugin-sdk/realtime-transcription` | ชนิดของผู้ให้บริการถอดเสียงแบบเรียลไทม์ ตัวช่วยรีจิสทรี และตัวช่วยเซสชัน WebSocket ร่วม |
    | `plugin-sdk/realtime-voice` | ชนิดของผู้ให้บริการเสียงแบบเรียลไทม์และตัวช่วยรีจิสทรี |
    | `plugin-sdk/image-generation` | ชนิดของผู้ให้บริการสร้างรูปภาพ พร้อมตัวช่วย URL สำหรับแอสเซ็ตรูปภาพ/ข้อมูล และตัวสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
    | `plugin-sdk/image-generation-core` | ชนิดร่วมสำหรับการสร้างรูปภาพ, failover, การยืนยันตัวตน และตัวช่วยรีจิสทรี |
    | `plugin-sdk/music-generation` | ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างเพลง |
    | `plugin-sdk/music-generation-core` | ชนิดร่วมสำหรับการสร้างเพลง ตัวช่วย failover การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref |
    | `plugin-sdk/video-generation` | ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างวิดีโอ |
    | `plugin-sdk/video-generation-core` | ชนิดร่วมสำหรับการสร้างวิดีโอ ตัวช่วย failover การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref |
    | `plugin-sdk/webhook-targets` | รีจิสทรีเป้าหมาย Webhook และตัวช่วยติดตั้งเส้นทาง |
    | `plugin-sdk/webhook-path` | ตัวช่วยทำให้เส้นทาง Webhook เป็นรูปแบบปกติ |
    | `plugin-sdk/web-media` | ตัวช่วยร่วมสำหรับโหลดสื่อระยะไกล/ในเครื่อง |
    | `plugin-sdk/zod` | ส่งออก `zod` ซ้ำสำหรับผู้ใช้ SDK ของ Plugin |
    | `plugin-sdk/testing` | Barrel ความเข้ากันได้แบบกว้างสำหรับการทดสอบ Plugin รุ่นเดิม การทดสอบ Plugin ใหม่ควรนำเข้าเส้นทางย่อย SDK ที่เฉพาะเจาะจง เช่น `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` หรือ `plugin-sdk/test-fixtures` แทน |
    | `plugin-sdk/plugin-test-api` | ตัวช่วย `createTestPluginApi` ขั้นต่ำสำหรับการทดสอบหน่วยการลงทะเบียน Plugin โดยตรง โดยไม่ต้องนำเข้าบริดจ์ตัวช่วยทดสอบของรีโป |
    | `plugin-sdk/agent-runtime-test-contracts` | ฟิกซ์เจอร์สัญญาอะแดปเตอร์ agent-runtime แบบเนทีฟสำหรับการทดสอบการยืนยันตัวตน การส่งมอบ fallback, tool-hook, prompt-overlay, schema และการฉาย transcript |
    | `plugin-sdk/channel-test-helpers` | ตัวช่วยทดสอบที่เน้นแชนเนลสำหรับสัญญาการดำเนินการ/การตั้งค่า/สถานะทั่วไป การยืนยันไดเรกทอรี วงจรชีวิตการเริ่มต้นบัญชี การทำเธรด send-config ม็อกรันไทม์ ปัญหาสถานะ การส่งมอบขาออก และการลงทะเบียน hook |
    | `plugin-sdk/channel-target-testing` | ชุดกรณีข้อผิดพลาดการแก้ปลายทางร่วมสำหรับการทดสอบแชนเนล |
    | `plugin-sdk/plugin-test-contracts` | ตัวช่วยสัญญาสำหรับแพ็กเกจ Plugin การลงทะเบียน อาร์ติแฟกต์สาธารณะ การนำเข้าโดยตรง API รันไทม์ และผลข้างเคียงจากการนำเข้า |
    | `plugin-sdk/provider-test-contracts` | ตัวช่วยสัญญาสำหรับรันไทม์ผู้ให้บริการ การยืนยันตัวตน การค้นพบ การเริ่มใช้งาน แค็ตตาล็อก วิซาร์ด ความสามารถด้านสื่อ นโยบาย replay, realtime STT live-audio, web-search/fetch และสตรีม |
    | `plugin-sdk/provider-http-test-mocks` | ม็อก HTTP/การยืนยันตัวตนของ Vitest แบบเลือกใช้สำหรับการทดสอบผู้ให้บริการที่ทดสอบ `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | ฟิกซ์เจอร์ทั่วไปสำหรับการจับเอาต์พุตรันไทม์ CLI บริบท sandbox ตัวเขียน skill, agent-message, system-event, การโหลดโมดูลใหม่ เส้นทาง Plugin ที่รวมมา terminal-text, chunking, auth-token และ typed-case |
    | `plugin-sdk/test-node-mocks` | ตัวช่วยม็อก Node builtin ที่เฉพาะเจาะจงสำหรับใช้ภายใน factory ของ Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="เส้นทางย่อยของหน่วยความจำ">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/memory-core` | พื้นผิวตัวช่วย memory-core ที่รวมมาสำหรับตัวช่วย manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | ฟาซาดรันไทม์ดัชนี/ค้นหาหน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-foundation` | การส่งออกเอนจินพื้นฐานของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | สัญญา embedding ของโฮสต์หน่วยความจำ การเข้าถึงรีจิสทรี ผู้ให้บริการในเครื่อง และตัวช่วยแบตช์/ระยะไกลทั่วไป |
    | `plugin-sdk/memory-core-host-engine-qmd` | การส่งออกเอนจิน QMD ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-storage` | การส่งออกเอนจินจัดเก็บข้อมูลของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วยมัลติโมดัลของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-query` | ตัวช่วยคิวรีของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-secret` | ตัวช่วยข้อมูลลับของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-events` | ตัวช่วยบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-status` | ตัวช่วยสถานะของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-cli` | ตัวช่วยรันไทม์ CLI ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-core` | ตัวช่วยรันไทม์แกนหลักของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-core` | นามแฝงที่เป็นกลางต่อผู้ขายสำหรับตัวช่วยรันไทม์แกนหลักของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-events` | นามแฝงที่เป็นกลางต่อผู้ขายสำหรับตัวช่วยบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-files` | นามแฝงที่เป็นกลางต่อผู้ขายสำหรับตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-markdown` | ตัวช่วย managed-markdown ร่วมสำหรับ Plugin ที่อยู่ใกล้เคียงกับหน่วยความจำ |
    | `plugin-sdk/memory-host-search` | ฟาซาดรันไทม์ Active Memory สำหรับการเข้าถึง search-manager |
    | `plugin-sdk/memory-host-status` | นามแฝงที่เป็นกลางต่อผู้ขายสำหรับตัวช่วยสถานะของโฮสต์หน่วยความจำ |
  </Accordion>

  <Accordion title="เส้นทางย่อยตัวช่วยที่รวมมาและสงวนไว้">
    ขณะนี้ไม่มีเส้นทางย่อย SDK สำหรับตัวช่วยที่รวมมาและสงวนไว้ ตัวช่วยเฉพาะเจ้าของ
    อยู่ภายในแพ็กเกจ Plugin ที่เป็นเจ้าของ ขณะที่สัญญาโฮสต์ที่ใช้ซ้ำได้
    ใช้เส้นทางย่อย SDK ทั่วไป เช่น `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` และ `plugin-sdk/plugin-config-runtime`
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวม SDK ของ Plugin](/th/plugins/sdk-overview)
- [การตั้งค่า SDK ของ Plugin](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
