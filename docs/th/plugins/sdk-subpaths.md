---
read_when:
    - การเลือก plugin-sdk subpath ที่เหมาะสมสำหรับการ import ของ Plugin
    - การตรวจสอบ plugin-sdk subpath และพื้นผิวตัวช่วยของ bundled-plugin
summary: 'แค็ตตาล็อก SDK subpath ของ Plugin: import ใดอยู่ที่ใด จัดกลุ่มตามพื้นที่'
title: Plugin SDK subpaths
x-i18n:
    generated_at: "2026-04-25T13:56:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f2e655d660a37030c53826b8ff156ac1897ecd3e753c1b0b43c75d456e2dfba
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK ถูกเปิดเผยเป็นชุดของ subpath แบบแคบภายใต้ `openclaw/plugin-sdk/`
  หน้านี้รวบรวม subpath ที่ใช้บ่อยโดยจัดกลุ่มตามจุดประสงค์ รายการแบบเต็มที่สร้างอัตโนมัติ
  ซึ่งมีมากกว่า 200 subpath อยู่ใน `scripts/lib/plugin-sdk-entrypoints.json`;
  subpath สำหรับตัวช่วยของ bundled-plugin ที่สงวนไว้ก็ปรากฏอยู่ที่นั่นเช่นกัน แต่เป็นเพียง
  รายละเอียดการติดตั้งใช้งาน เว้นแต่หน้าคู่มือใดจะยกระดับมันอย่างชัดเจน

  สำหรับคู่มือการเขียน Plugin ดู [Plugin SDK overview](/th/plugins/sdk-overview)

  ## Plugin entry

  | Subpath                     | export หลัก                                                                                                                         |
  | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                 |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                    |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                   |

  <AccordionGroup>
  <Accordion title="Channel subpath">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | export ของ root Zod schema สำหรับ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, พร้อม `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | ตัวช่วย setup wizard ที่ใช้ร่วมกัน, prompt ของ allowlist, ตัวสร้างสถานะ setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | ตัวช่วยสำหรับ config/action-gate แบบหลายบัญชี และตัวช่วย fallback บัญชีเริ่มต้น |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ตัวช่วย normalize account-id |
    | `plugin-sdk/account-resolution` | ตัวช่วยสำหรับ lookup บัญชี + default-fallback |
    | `plugin-sdk/account-helpers` | ตัวช่วยแบบแคบสำหรับ account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | ชนิดของ channel config schema |
    | `plugin-sdk/telegram-command-config` | ตัวช่วย normalize/validate คำสั่งแบบกำหนดเองของ Telegram พร้อม bundled-contract fallback |
    | `plugin-sdk/command-gating` | ตัวช่วย authorization gate สำหรับคำสั่งแบบแคบ |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, ตัวช่วย lifecycle/finalization ของ draft stream |
    | `plugin-sdk/inbound-envelope` | ตัวช่วย shared inbound route + envelope builder |
    | `plugin-sdk/inbound-reply-dispatch` | ตัวช่วย shared inbound record-and-dispatch |
    | `plugin-sdk/messaging-targets` | ตัวช่วย parse/match เป้าหมาย |
    | `plugin-sdk/outbound-media` | ตัวช่วยโหลด outbound media แบบใช้ร่วมกัน |
    | `plugin-sdk/outbound-runtime` | ตัวช่วยสำหรับ outbound delivery, identity, send delegate, session, formatting และ payload planning |
    | `plugin-sdk/poll-runtime` | ตัวช่วย normalize poll แบบแคบ |
    | `plugin-sdk/thread-bindings-runtime` | ตัวช่วย lifecycle และ adapter ของ thread-binding |
    | `plugin-sdk/agent-media-payload` | ตัวสร้าง agent media payload แบบเดิม |
    | `plugin-sdk/conversation-runtime` | ตัวช่วยสำหรับ conversation/thread binding, pairing และ configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วย runtime config snapshot |
    | `plugin-sdk/runtime-group-policy` | ตัวช่วย resolve runtime group-policy |
    | `plugin-sdk/channel-status` | ตัวช่วย shared channel status snapshot/summary |
    | `plugin-sdk/channel-config-primitives` | primitive แบบแคบสำหรับ channel config-schema |
    | `plugin-sdk/channel-config-writes` | ตัวช่วย authorization สำหรับการเขียน channel config |
    | `plugin-sdk/channel-plugin-common` | export prelude ที่ใช้ร่วมกันของ channel plugin |
    | `plugin-sdk/allowlist-config-edit` | ตัวช่วยอ่าน/แก้ไข allowlist config |
    | `plugin-sdk/group-access` | ตัวช่วยการตัดสิน group-access แบบใช้ร่วมกัน |
    | `plugin-sdk/direct-dm` | ตัวช่วย auth/guard สำหรับ direct-DM แบบใช้ร่วมกัน |
    | `plugin-sdk/interactive-runtime` | ตัวช่วย semantic message presentation, delivery และ legacy interactive reply ดู [Message Presentation](/th/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | compatibility barrel สำหรับ inbound debounce, mention matching, ตัวช่วย mention-policy และตัวช่วย envelope |
    | `plugin-sdk/channel-inbound-debounce` | ตัวช่วย inbound debounce แบบแคบ |
    | `plugin-sdk/channel-mention-gating` | ตัวช่วย mention-policy และ mention text แบบแคบโดยไม่มีพื้นผิว inbound runtime ที่กว้างกว่า |
    | `plugin-sdk/channel-envelope` | ตัวช่วยจัดรูปแบบ inbound envelope แบบแคบ |
    | `plugin-sdk/channel-location` | ตัวช่วย context และการจัดรูปแบบ location ของ channel |
    | `plugin-sdk/channel-logging` | ตัวช่วย logging ของ channel สำหรับ inbound drop และความล้มเหลวของ typing/ack |
    | `plugin-sdk/channel-send-result` | ชนิดของผลลัพธ์การตอบกลับ |
    | `plugin-sdk/channel-actions` | ตัวช่วย channel message-action พร้อม native schema helper แบบ deprecated ที่เก็บไว้เพื่อความเข้ากันได้ของ Plugin |
    | `plugin-sdk/channel-targets` | ตัวช่วย parse/match เป้าหมาย |
    | `plugin-sdk/channel-contract` | ชนิดของ channel contract |
    | `plugin-sdk/channel-feedback` | การต่อสาย feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วย secret-contract แบบแคบ เช่น `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` และชนิดของ secret target |
  </Accordion>

  <Accordion title="Provider subpath">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | ตัวช่วย curated setup สำหรับ provider แบบ local/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วย setup แบบ focused สำหรับ provider self-hosted ที่เข้ากันได้กับ OpenAI |
    | `plugin-sdk/cli-backend` | ค่าเริ่มต้นของ CLI backend + ค่าคงที่ของ watchdog |
    | `plugin-sdk/provider-auth-runtime` | ตัวช่วย resolve API key ขณะ runtime สำหรับ provider plugin |
    | `plugin-sdk/provider-auth-api-key` | ตัวช่วย onboarding/profile-write ของ API key เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | ตัวสร้างผลลัพธ์ auth แบบ OAuth มาตรฐาน |
    | `plugin-sdk/provider-auth-login` | ตัวช่วย interactive login แบบใช้ร่วมกันสำหรับ provider plugin |
    | `plugin-sdk/provider-env-vars` | ตัวช่วย lookup env var สำหรับ auth ของ provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้าง replay-policy แบบใช้ร่วมกัน, ตัวช่วย endpoint ของ provider และตัวช่วย normalize model-id เช่น `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | ตัวช่วย capability ของ HTTP/endpoint สำหรับ provider แบบทั่วไป, provider HTTP error และตัวช่วย multipart form สำหรับ audio transcription |
    | `plugin-sdk/provider-web-fetch-contract` | ตัวช่วย contract แบบแคบสำหรับ config/selection ของ web-fetch เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | ตัวช่วย register/cache/runtime ของ provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วย config/credential แบบแคบสำหรับ web-search สำหรับ provider ที่ไม่ต้องใช้การเปิด Plugin |
    | `plugin-sdk/provider-web-search-contract` | ตัวช่วย contract แบบแคบสำหรับ config/credential ของ web-search เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และ scoped credential setter/getter |
    | `plugin-sdk/provider-web-search` | ตัวช่วย registration/cache/runtime ของ provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema cleanup + diagnostics และตัวช่วย compat ของ xAI เช่น `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` และอื่นที่คล้ายกัน |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ชนิดของ stream wrapper และตัวช่วย wrapper แบบใช้ร่วมกันสำหรับ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | ตัวช่วย transport ของ provider แบบเนทีฟ เช่น guarded fetch, transport message transform และ writable transport event stream |
    | `plugin-sdk/provider-onboard` | ตัวช่วย patch config สำหรับ onboarding |
    | `plugin-sdk/global-singleton` | ตัวช่วย singleton/map/cache ภายในโปรเซส |
    | `plugin-sdk/group-activation` | ตัวช่วย mode การเปิดใช้งานกลุ่มและการ parse คำสั่งแบบแคบ |
  </Accordion>

  <Accordion title="เส้นทางย่อยด้านการยืนยันตัวตนและความปลอดภัย">
    | เส้นทางย่อย | เอ็กซ์พอร์ตหลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ตัวช่วยรีจิสทรีคำสั่งรวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก, ตัวช่วยการอนุญาตผู้ส่ง |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความคำสั่ง/วิธีใช้ เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | การ resolve ผู้อนุมัติและตัวช่วย action-auth ภายในแชตเดียวกัน |
    | `plugin-sdk/approval-client-runtime` | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติ Native exec |
    | `plugin-sdk/approval-delivery-runtime` | อะแดปเตอร์ความสามารถ/การส่งการอนุมัติแบบ Native |
    | `plugin-sdk/approval-gateway-runtime` | ตัวช่วย resolve Gateway การอนุมัติแบบใช้ร่วมกัน |
    | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยโหลดอะแดปเตอร์การอนุมัติแบบ Native น้ำหนักเบาสำหรับ entrypoint ของ channel แบบ hot |
    | `plugin-sdk/approval-handler-runtime` | ตัวช่วย runtime ตัวจัดการการอนุมัติที่ครอบคลุมกว่า; ควรเลือกใช้ seam แบบ adapter/gateway ที่แคบกว่านี้เมื่อเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติแบบ Native + การผูกบัญชี |
    | `plugin-sdk/approval-reply-runtime` | ตัวช่วย payload การตอบกลับการอนุมัติ exec/plugin |
    | `plugin-sdk/approval-runtime` | ตัวช่วย payload การอนุมัติ exec/plugin, ตัวช่วย routing/runtime การอนุมัติแบบ Native, และตัวช่วยแสดงผลการอนุมัติแบบมีโครงสร้าง เช่น `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | ตัวช่วยรีเซ็ตการ dedupe คำตอบขาเข้าแบบเฉพาะทาง |
    | `plugin-sdk/channel-contract-testing` | ตัวช่วยทดสอบสัญญา channel แบบเฉพาะทางโดยไม่ใช้ testing barrel ขนาดใหญ่ |
    | `plugin-sdk/command-auth-native` | การยืนยันตัวตนคำสั่งแบบ Native, การจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก, และตัวช่วยเป้าหมายเซสชันแบบ Native |
    | `plugin-sdk/command-detection` | ตัวช่วยตรวจจับคำสั่งแบบใช้ร่วมกัน |
    | `plugin-sdk/command-primitives-runtime` | เพรดิเคตข้อความคำสั่งแบบน้ำหนักเบาสำหรับเส้นทาง channel แบบ hot |
    | `plugin-sdk/command-surface` | การทำให้เนื้อหาคำสั่งเป็นมาตรฐานและตัวช่วยพื้นผิวคำสั่ง |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยรวบรวมสัญญา secret แบบเฉพาะทางสำหรับพื้นผิว secret ของ channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | ตัวช่วย `coerceSecretRef` และชนิด SecretRef แบบเฉพาะทางสำหรับการแยกวิเคราะห์ secret-contract/config |
    | `plugin-sdk/security-runtime` | ตัวช่วยด้าน trust, การจำกัด DM, เนื้อหาภายนอก, และการรวบรวม secret แบบใช้ร่วมกัน |
    | `plugin-sdk/ssrf-policy` | ตัวช่วยนโยบาย SSRF สำหรับ allowlist ของโฮสต์และเครือข่ายส่วนตัว |
    | `plugin-sdk/ssrf-dispatcher` | ตัวช่วย dispatcher แบบ pinned เฉพาะทางโดยไม่ใช้พื้นผิว infra runtime ขนาดใหญ่ |
    | `plugin-sdk/ssrf-runtime` | dispatcher แบบ pinned, fetch ที่มีการป้องกัน SSRF, และตัวช่วยนโยบาย SSRF |
    | `plugin-sdk/secret-input` | ตัวช่วยแยกวิเคราะห์อินพุต secret |
    | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ/เป้าหมาย Webhook |
    | `plugin-sdk/webhook-request-guards` | ตัวช่วยขนาด body/timeout ของคำขอ |
  </Accordion>

  <Accordion title="เส้นทางย่อยด้าน runtime และ storage">
    | เส้นทางย่อย | เอ็กซ์พอร์ตหลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | ตัวช่วย runtime/logging/backup/การติดตั้ง plugin แบบครอบคลุม |
    | `plugin-sdk/runtime-env` | ตัวช่วย env, logger, timeout, retry, และ backoff ของ runtime แบบเฉพาะทาง |
    | `plugin-sdk/channel-runtime-context` | ตัวช่วยลงทะเบียนและค้นหา runtime-context ของ channel แบบทั่วไป |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | ตัวช่วยคำสั่ง/hook/http/interactive ของ plugin แบบใช้ร่วมกัน |
    | `plugin-sdk/hook-runtime` | ตัวช่วยไปป์ไลน์ Webhook/internal hook แบบใช้ร่วมกัน |
    | `plugin-sdk/lazy-runtime` | ตัวช่วย import/binding แบบ lazy ของ runtime เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod`, และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | ตัวช่วย exec ของ process |
    | `plugin-sdk/cli-runtime` | ตัวช่วยการจัดรูปแบบ, การรอ, เวอร์ชัน, การเรียกใช้อาร์กิวเมนต์, และกลุ่มคำสั่งแบบ lazy ของ CLI |
    | `plugin-sdk/gateway-runtime` | ตัวช่วยไคลเอนต์ Gateway และการแพตช์สถานะ channel |
    | `plugin-sdk/config-runtime` | ตัวช่วยโหลด/เขียน config และตัวช่วยค้นหา config ของ plugin |
    | `plugin-sdk/telegram-command-config` | การทำให้ชื่อ/คำอธิบายคำสั่ง Telegram เป็นมาตรฐาน และการตรวจสอบความซ้ำซ้อน/ความขัดแย้ง แม้เมื่อพื้นผิวสัญญา Telegram ที่รวมมาไม่มีให้ใช้งาน |
    | `plugin-sdk/text-autolink-runtime` | การตรวจจับ autolink ของการอ้างอิงไฟล์โดยไม่ใช้ text-runtime barrel ขนาดใหญ่ |
    | `plugin-sdk/approval-runtime` | ตัวช่วยการอนุมัติ exec/plugin, ตัวสร้างความสามารถการอนุมัติ, ตัวช่วย auth/profile, ตัวช่วย routing/runtime แบบ Native, และการจัดรูปแบบเส้นทางแสดงผลการอนุมัติแบบมีโครงสร้าง |
    | `plugin-sdk/reply-runtime` | ตัวช่วย runtime สำหรับขาเข้า/การตอบกลับแบบใช้ร่วมกัน, การแบ่ง chunk, การส่งต่อ, Heartbeat, ตัววางแผนการตอบกลับ |
    | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วยการส่งต่อ/สรุปผลการตอบกลับและตัวช่วยป้ายกำกับการสนทนาแบบเฉพาะทาง |
    | `plugin-sdk/reply-history` | ตัวช่วยประวัติการตอบกลับในช่วงเวลาสั้นแบบใช้ร่วมกัน เช่น `buildHistoryContext`, `recordPendingHistoryEntry`, และ `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ตัวช่วยแบ่ง chunk ข้อความ/Markdown แบบเฉพาะทาง |
    | `plugin-sdk/session-store-runtime` | ตัวช่วยเส้นทาง session store + updated-at |
    | `plugin-sdk/state-paths` | ตัวช่วยเส้นทางไดเรกทอรี state/OAuth |
    | `plugin-sdk/routing` | ตัวช่วย route/session-key/account binding เช่น `resolveAgentRoute`, `buildAgentSessionKey`, และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ตัวช่วยสรุปสถานะ channel/account แบบใช้ร่วมกัน, ค่าเริ่มต้นของ runtime-state, และตัวช่วยเมทาดาทาปัญหา |
    | `plugin-sdk/target-resolver-runtime` | ตัวช่วย target resolver แบบใช้ร่วมกัน |
    | `plugin-sdk/string-normalization-runtime` | ตัวช่วยทำให้ slug/string เป็นมาตรฐาน |
    | `plugin-sdk/request-url` | แยก URL แบบสตริงจากอินพุตลักษณะ fetch/request |
    | `plugin-sdk/run-command` | ตัวรันคำสั่งแบบจับเวลา พร้อมผล stdout/stderr ที่ทำให้เป็นมาตรฐานแล้ว |
    | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ทั่วไปของ tool/CLI |
    | `plugin-sdk/tool-payload` | แยก payload ที่ทำให้เป็นมาตรฐานจากอ็อบเจ็กต์ผลลัพธ์ของ tool |
    | `plugin-sdk/tool-send` | แยกฟิลด์เป้าหมายการส่งแบบ canonical จากอาร์กิวเมนต์ของ tool |
    | `plugin-sdk/temp-path` | ตัวช่วยเส้นทาง temp-download แบบใช้ร่วมกัน |
    | `plugin-sdk/logging-core` | ตัวช่วย logger ของ subsystem และการปกปิดข้อมูล |
    | `plugin-sdk/markdown-table-runtime` | ตัวช่วยโหมดและการแปลงตาราง Markdown |
    | `plugin-sdk/json-store` | ตัวช่วยอ่าน/เขียนสถานะ JSON ขนาดเล็ก |
    | `plugin-sdk/file-lock` | ตัวช่วย file-lock แบบ re-entrant |
    | `plugin-sdk/persistent-dedupe` | ตัวช่วยแคช dedupe แบบเก็บบนดิสก์ |
    | `plugin-sdk/acp-runtime` | ตัวช่วย ACP runtime/session และการส่งต่อการตอบกลับ |
    | `plugin-sdk/acp-binding-resolve-runtime` | การ resolve ACP binding แบบอ่านอย่างเดียวโดยไม่ต้อง import การเริ่มต้น lifecycle |
    | `plugin-sdk/agent-config-primitives` | primitive ของสคีมา config runtime ของ agent แบบเฉพาะทาง |
    | `plugin-sdk/boolean-param` | ตัวอ่านพารามิเตอร์ boolean แบบยืดหยุ่น |
    | `plugin-sdk/dangerous-name-runtime` | ตัวช่วย resolve การจับคู่ dangerous-name |
    | `plugin-sdk/device-bootstrap` | ตัวช่วย bootstrap อุปกรณ์และ pairing token |
    | `plugin-sdk/extension-shared` | primitive ตัวช่วยแบบใช้ร่วมกันสำหรับ passive-channel, สถานะ, และ ambient proxy |
    | `plugin-sdk/models-provider-runtime` | ตัวช่วยการตอบกลับของคำสั่ง `/models`/provider |
    | `plugin-sdk/skill-commands-runtime` | ตัวช่วยแสดงรายการคำสั่ง Skills |
    | `plugin-sdk/native-command-registry` | ตัวช่วยรีจิสทรี/การสร้าง/การ serialize คำสั่งแบบ Native |
    | `plugin-sdk/agent-harness` | พื้นผิว trusted-plugin เชิงทดลองสำหรับ agent harness ระดับต่ำ: ชนิด harness, ตัวช่วย steer/abort ของ active-run, ตัวช่วยสะพานเชื่อม OpenClaw tool, การจัดรูปแบบ/รายละเอียดความคืบหน้าของ tool, และยูทิลิตีผลลัพธ์ของ attempt |
    | `plugin-sdk/provider-zai-endpoint` | ตัวช่วยตรวจจับ endpoint ของ Z.AI |
    | `plugin-sdk/infra-runtime` | ตัวช่วย system event/Heartbeat |
    | `plugin-sdk/collection-runtime` | ตัวช่วยแคชแบบมีขอบเขตขนาดเล็ก |
    | `plugin-sdk/diagnostic-runtime` | ตัวช่วยแฟล็กและ event สำหรับการวินิจฉัย |
    | `plugin-sdk/error-runtime` | กราฟข้อผิดพลาด, การจัดรูปแบบ, ตัวช่วยจัดหมวดหมู่ข้อผิดพลาดแบบใช้ร่วมกัน, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ตัวช่วย fetch, proxy, และ pinned lookup แบบห่อหุ้ม |
    | `plugin-sdk/runtime-fetch` | runtime fetch ที่รับรู้ dispatcher โดยไม่ต้อง import proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | ตัวอ่าน body การตอบกลับแบบมีขอบเขตโดยไม่ใช้พื้นผิว media runtime ขนาดใหญ่ |
    | `plugin-sdk/session-binding-runtime` | สถานะ binding ของการสนทนาปัจจุบันโดยไม่ใช้ routing การ binding หรือ pairing store ที่ตั้งค่าไว้ |
    | `plugin-sdk/session-store-runtime` | ตัวช่วยอ่าน session-store โดยไม่ใช้ import การเขียน/ดูแลรักษา config แบบครอบคลุม |
    | `plugin-sdk/context-visibility-runtime` | การ resolve การมองเห็น context และการกรอง context เสริมโดยไม่ใช้ import config/security แบบครอบคลุม |
    | `plugin-sdk/string-coerce-runtime` | ตัวช่วย coercion และ normalization ของ primitive record/string แบบเฉพาะทางโดยไม่ใช้ import markdown/logging |
    | `plugin-sdk/host-runtime` | ตัวช่วยทำให้ชื่อโฮสต์และโฮสต์ SCP เป็นมาตรฐาน |
    | `plugin-sdk/retry-runtime` | ตัวช่วย config และตัวรัน retry |
    | `plugin-sdk/agent-runtime` | ตัวช่วยไดเรกทอรี/ตัวตน/workspace ของ agent |
    | `plugin-sdk/directory-runtime` | การ query/dedup ไดเรกทอรีที่อิง config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="เส้นทางย่อยด้านความสามารถและการทดสอบ">
    | เส้นทางย่อย | เอ็กซ์พอร์ตหลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | ตัวช่วย fetch/transform/store สื่อแบบใช้ร่วมกัน พร้อมตัวสร้าง payload ของสื่อ |
    | `plugin-sdk/media-store` | ตัวช่วย media store แบบเฉพาะทาง เช่น `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | ตัวช่วย failover การสร้างสื่อแบบใช้ร่วมกัน, การเลือก candidate, และข้อความเมื่อไม่มีโมเดล |
    | `plugin-sdk/media-understanding` | ชนิด provider สำหรับการทำความเข้าใจสื่อ พร้อมเอ็กซ์พอร์ตตัวช่วยภาพ/เสียงที่มุ่งให้ provider ใช้งาน |
    | `plugin-sdk/text-runtime` | ตัวช่วยข้อความ/Markdown/logging แบบใช้ร่วมกัน เช่น การลบข้อความที่ผู้ช่วยมองเห็นได้, ตัวช่วย render/chunking/table ของ Markdown, ตัวช่วยปกปิดข้อมูล, ตัวช่วย directive-tag, และยูทิลิตีข้อความปลอดภัย |
    | `plugin-sdk/text-chunking` | ตัวช่วยแบ่ง chunk ข้อความขาออก |
    | `plugin-sdk/speech` | ชนิด provider ด้าน speech พร้อมเอ็กซ์พอร์ต directive, registry, validation, และตัวช่วย speech ที่มุ่งให้ provider ใช้งาน |
    | `plugin-sdk/speech-core` | ชนิด provider ด้าน speech แบบใช้ร่วมกัน, registry, directive, normalization, และเอ็กซ์พอร์ตตัวช่วย speech |
    | `plugin-sdk/realtime-transcription` | ชนิด provider สำหรับการถอดเสียงแบบเรียลไทม์, ตัวช่วย registry, และตัวช่วยเซสชัน WebSocket แบบใช้ร่วมกัน |
    | `plugin-sdk/realtime-voice` | ชนิด provider สำหรับเสียงแบบเรียลไทม์และตัวช่วย registry |
    | `plugin-sdk/image-generation` | ชนิด provider สำหรับการสร้างภาพ |
    | `plugin-sdk/image-generation-core` | ชนิดการสร้างภาพแบบใช้ร่วมกัน, failover, การยืนยันตัวตน, และตัวช่วย registry |
    | `plugin-sdk/music-generation` | ชนิด provider/request/result สำหรับการสร้างเพลง |
    | `plugin-sdk/music-generation-core` | ชนิดการสร้างเพลงแบบใช้ร่วมกัน, ตัวช่วย failover, การค้นหา provider, และการแยกวิเคราะห์ model-ref |
    | `plugin-sdk/video-generation` | ชนิด provider/request/result สำหรับการสร้างวิดีโอ |
    | `plugin-sdk/video-generation-core` | ชนิดการสร้างวิดีโอแบบใช้ร่วมกัน, ตัวช่วย failover, การค้นหา provider, และการแยกวิเคราะห์ model-ref |
    | `plugin-sdk/webhook-targets` | ตัวช่วยรีจิสทรีเป้าหมาย Webhook และการติดตั้ง route |
    | `plugin-sdk/webhook-path` | ตัวช่วยทำให้เส้นทาง Webhook เป็นมาตรฐาน |
    | `plugin-sdk/web-media` | ตัวช่วยโหลดสื่อระยะไกล/ภายในเครื่องแบบใช้ร่วมกัน |
    | `plugin-sdk/zod` | ส่งออก `zod` ซ้ำสำหรับผู้ใช้ plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="เส้นทางย่อยด้านหน่วยความจำ">
    | เส้นทางย่อย | เอ็กซ์พอร์ตหลัก |
    | --- | --- |
    | `plugin-sdk/memory-core` | พื้นผิวตัวช่วย memory-core แบบบันเดิลสำหรับตัวช่วย manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | ฟาซาด runtime สำหรับดัชนี/การค้นหา Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | เอ็กซ์พอร์ตเอนจินพื้นฐานของโฮสต์ Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | สัญญา embedding ของโฮสต์ Memory, การเข้าถึง registry, provider ภายในเครื่อง, และตัวช่วยทั่วไปสำหรับ batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | เอ็กซ์พอร์ตเอนจิน QMD ของโฮสต์ Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | เอ็กซ์พอร์ตเอนจิน storage ของโฮสต์ Memory |
    | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วย multimodal ของโฮสต์ Memory |
    | `plugin-sdk/memory-core-host-query` | ตัวช่วย query ของโฮสต์ Memory |
    | `plugin-sdk/memory-core-host-secret` | ตัวช่วย secret ของโฮสต์ Memory |
    | `plugin-sdk/memory-core-host-events` | ตัวช่วย event journal ของโฮสต์ Memory |
    | `plugin-sdk/memory-core-host-status` | ตัวช่วยสถานะของโฮสต์ Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | ตัวช่วย CLI runtime ของโฮสต์ Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | ตัวช่วย core runtime ของโฮสต์ Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วยไฟล์/runtime ของโฮสต์ Memory |
    | `plugin-sdk/memory-host-core` | alias ที่เป็นกลางต่อผู้ให้บริการสำหรับตัวช่วย core runtime ของโฮสต์ Memory |
    | `plugin-sdk/memory-host-events` | alias ที่เป็นกลางต่อผู้ให้บริการสำหรับตัวช่วย event journal ของโฮสต์ Memory |
    | `plugin-sdk/memory-host-files` | alias ที่เป็นกลางต่อผู้ให้บริการสำหรับตัวช่วยไฟล์/runtime ของโฮสต์ Memory |
    | `plugin-sdk/memory-host-markdown` | ตัวช่วย managed-markdown แบบใช้ร่วมกันสำหรับ plugin ที่เกี่ยวข้องกับ memory |
    | `plugin-sdk/memory-host-search` | ฟาซาด runtime ของ Active Memory สำหรับการเข้าถึง search-manager |
    | `plugin-sdk/memory-host-status` | alias ที่เป็นกลางต่อผู้ให้บริการสำหรับตัวช่วยสถานะของโฮสต์ Memory |
    | `plugin-sdk/memory-lancedb` | พื้นผิวตัวช่วย memory-lancedb แบบบันเดิล |
  </Accordion>

  <Accordion title="เส้นทางย่อยตัวช่วยแบบบันเดิลที่สงวนไว้">
    | กลุ่ม | เส้นทางย่อยปัจจุบัน | การใช้งานที่ตั้งใจไว้ |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | ตัวช่วยสนับสนุน plugin Browser แบบบันเดิล `browser-profiles` ส่งออก `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile`, และ `ResolvedBrowserTabCleanupConfig` สำหรับรูปแบบ `browser.tabCleanup` ที่ถูกทำให้เป็นมาตรฐาน `browser-support` ยังคงเป็น compatibility barrel |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | พื้นผิวตัวช่วย/runtime ของ Matrix แบบบันเดิล |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | พื้นผิวตัวช่วย/runtime ของ LINE แบบบันเดิล |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | พื้นผิวตัวช่วย IRC แบบบันเดิล |
    | ตัวช่วยเฉพาะ channel | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | seam สำหรับความเข้ากันได้/ตัวช่วยของ channel แบบบันเดิล |
    | ตัวช่วยเฉพาะ auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | seam ของตัวช่วยฟีเจอร์/plugin แบบบันเดิล; ปัจจุบัน `plugin-sdk/github-copilot-token` ส่งออก `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, และ `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง plugin](/th/plugins/building-plugins)
