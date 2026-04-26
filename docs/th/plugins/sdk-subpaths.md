---
read_when:
    - |-
      การเลือก subpath ของ plugin-sdk ที่เหมาะสมสำหรับ import ของ Plugin♀♀♀user to=functions.read in commentary _植物百科通 开号网址json
      {"path":"docs/.i18n/glossary.th.json"}
    - การตรวจสอบ subpath และพื้นผิวตัวช่วยของ bundled-plugin
summary: 'แค็ตตาล็อก subpath ของ Plugin SDK: import ใดอยู่ที่ใด จัดกลุ่มตามพื้นที่ ფუნქ្យonalิตี้'
title: subpath ของ Plugin SDK
x-i18n:
    generated_at: "2026-04-26T11:39:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcb49ee51301b79985d43470cd8c149c858e79d685908605317de253121d4736
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK ถูกเปิดเผยเป็นชุดของ subpath แบบแคบภายใต้ `openclaw/plugin-sdk/`
  หน้านี้รวบรวม subpath ที่ใช้บ่อยโดยจัดกลุ่มตามวัตถุประสงค์ รายการเต็มแบบสร้างอัตโนมัติ
  ซึ่งมีมากกว่า 200 subpath อยู่ใน `scripts/lib/plugin-sdk-entrypoints.json`;
  subpath ตัวช่วยของ bundled-plugin ที่สงวนไว้ก็ปรากฏอยู่ที่นั่นเช่นกัน แต่ถือเป็น
  รายละเอียดการทำงานภายใน เว้นแต่หน้าเอกสารจะยกระดับให้ใช้งานอย่างชัดเจน

  สำหรับคู่มือการสร้าง Plugin ดู [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

  ## จุดเริ่มต้นของ Plugin

  | Subpath                     | export หลัก                                                                                                                           |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="subpath ของ Channel">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | export ของ Zod schema รากของ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, พร้อม `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | ตัวช่วย shared setup wizard, พรอมป์ allowlist, ตัวสร้างสถานะ setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | ตัวช่วย config/action-gate แบบหลายบัญชี และตัวช่วย fallback บัญชีค่าเริ่มต้น |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ตัวช่วย normalize account-id |
    | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชี + fallback ค่าเริ่มต้น |
    | `plugin-sdk/account-helpers` | ตัวช่วยแบบแคบสำหรับ account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | ประเภท schema ของคอนฟิก Channel |
    | `plugin-sdk/telegram-command-config` | ตัวช่วย normalize/validate custom-command ของ Telegram พร้อม bundled-contract fallback |
    | `plugin-sdk/command-gating` | ตัวช่วย authorization gate ของคำสั่งแบบแคบ |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, ตัวช่วยวงจรชีวิต/finalization ของ draft stream |
    | `plugin-sdk/inbound-envelope` | ตัวช่วย shared inbound route + ตัวสร้าง envelope |
    | `plugin-sdk/inbound-reply-dispatch` | ตัวช่วย shared สำหรับบันทึกและ dispatch ขาเข้า |
    | `plugin-sdk/messaging-targets` | ตัวช่วย parse/match เป้าหมาย |
    | `plugin-sdk/outbound-media` | ตัวช่วย shared สำหรับโหลดสื่อขาออก |
    | `plugin-sdk/outbound-send-deps` | การค้นหา dependency แบบเบาสำหรับการส่งขาออกของ channel adapter |
    | `plugin-sdk/outbound-runtime` | ตัวช่วยสำหรับการส่งขาออก, identity, send delegate, session, การจัดรูปแบบ และการวางแผน payload |
    | `plugin-sdk/poll-runtime` | ตัวช่วย normalize poll แบบแคบ |
    | `plugin-sdk/thread-bindings-runtime` | ตัวช่วยวงจรชีวิตและ adapter ของ thread-binding |
    | `plugin-sdk/agent-media-payload` | ตัวสร้าง payload สื่อของเอเจนต์แบบ legacy |
    | `plugin-sdk/conversation-runtime` | ตัวช่วยสำหรับ conversation/thread binding, pairing และ configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วย runtime config snapshot |
    | `plugin-sdk/runtime-group-policy` | ตัวช่วย resolve group-policy ตอน runtime |
    | `plugin-sdk/channel-status` | ตัวช่วย shared สำหรับ snapshot/summary สถานะของ channel |
    | `plugin-sdk/channel-config-primitives` | primitive แบบแคบของ channel config-schema |
    | `plugin-sdk/channel-config-writes` | ตัวช่วย authorization สำหรับการเขียนคอนฟิก Channel |
    | `plugin-sdk/channel-plugin-common` | export prelude แบบใช้ร่วมกันของ channel plugin |
    | `plugin-sdk/allowlist-config-edit` | ตัวช่วยอ่าน/แก้ไขคอนฟิก allowlist |
    | `plugin-sdk/group-access` | ตัวช่วย shared สำหรับการตัดสินใจเรื่อง group-access |
    | `plugin-sdk/direct-dm` | ตัวช่วย shared สำหรับ auth/guard ของ direct-DM |
    | `plugin-sdk/interactive-runtime` | ตัวช่วยสำหรับการนำเสนอข้อความเชิงความหมาย การส่งต่อ และการตอบกลับแบบ interactive legacy ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | compatibility barrel สำหรับ inbound debounce, mention matching, ตัวช่วย mention-policy และตัวช่วย envelope |
    | `plugin-sdk/channel-inbound-debounce` | ตัวช่วย inbound debounce แบบแคบ |
    | `plugin-sdk/channel-mention-gating` | ตัวช่วย mention-policy และข้อความ mention แบบแคบ โดยไม่ดึงพื้นผิว inbound runtime ที่กว้างกว่า |
    | `plugin-sdk/channel-envelope` | ตัวช่วยจัดรูปแบบ inbound envelope แบบแคบ |
    | `plugin-sdk/channel-location` | ตัวช่วยบริบทและการจัดรูปแบบ location ของ channel |
    | `plugin-sdk/channel-logging` | ตัวช่วย logging ของ channel สำหรับ inbound drops และความล้มเหลวของ typing/ack |
    | `plugin-sdk/channel-send-result` | ประเภทของผลลัพธ์การตอบกลับ |
    | `plugin-sdk/channel-actions` | ตัวช่วย action ของข้อความใน channel พร้อม native schema helper แบบเลิกใช้แล้วที่ยังคงไว้เพื่อความเข้ากันได้ของ Plugin |
    | `plugin-sdk/channel-targets` | ตัวช่วย parse/match เป้าหมาย |
    | `plugin-sdk/channel-contract` | ประเภท contract ของ Channel |
    | `plugin-sdk/channel-feedback` | การเชื่อมต่อ feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วย contract ของ secret แบบแคบ เช่น `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` และประเภทของ secret target |
  </Accordion>

  <Accordion title="subpath ของ Provider">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | ตัวช่วย setup ที่คัดสรรแล้วสำหรับ provider แบบ local/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วย setup แบบเฉพาะสำหรับ provider self-hosted ที่เข้ากันได้กับ OpenAI |
    | `plugin-sdk/cli-backend` | ค่าเริ่มต้นของ CLI backend + ค่าคงที่ของ watchdog |
    | `plugin-sdk/provider-auth-runtime` | ตัวช่วย resolve API key ตอน runtime สำหรับ provider plugin |
    | `plugin-sdk/provider-auth-api-key` | ตัวช่วย onboarding/เขียนโปรไฟล์ API key เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | ตัวสร้างผลลัพธ์ auth มาตรฐานของ OAuth |
    | `plugin-sdk/provider-auth-login` | ตัวช่วย interactive login แบบ shared สำหรับ provider plugin |
    | `plugin-sdk/provider-env-vars` | ตัวช่วยค้นหา env var สำหรับ auth ของ provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้าง replay-policy แบบ shared, ตัวช่วย provider-endpoint และตัวช่วย normalize model-id เช่น `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | ตัวช่วยทั่วไปสำหรับความสามารถของ HTTP/endpoint ของ provider, ข้อผิดพลาด HTTP ของ provider และตัวช่วย multipart form สำหรับการถอดเสียงเสียง |
    | `plugin-sdk/provider-web-fetch-contract` | ตัวช่วย contract แบบแคบสำหรับคอนฟิก/การเลือก web-fetch เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | ตัวช่วยลงทะเบียน/แคช provider ของ web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วยแบบแคบสำหรับคอนฟิก/ข้อมูลรับรองของ web-search สำหรับ provider ที่ไม่ต้องการการเชื่อมต่อ plugin-enable |
    | `plugin-sdk/provider-web-search-contract` | ตัวช่วย contract แบบแคบสำหรับคอนฟิก/ข้อมูลรับรองของ web-search เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และ setter/getter ของข้อมูลรับรองแบบจำกัดขอบเขต |
    | `plugin-sdk/provider-web-search` | ตัวช่วยลงทะเบียน/แคช/runtime ของ provider สำหรับ web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, การ cleanup + diagnostics ของ Gemini schema และตัวช่วย compat ของ xAI เช่น `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` และอื่น ๆ ที่คล้ายกัน |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ประเภท stream wrapper และตัวช่วย wrapper แบบ shared สำหรับ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | ตัวช่วย native provider transport เช่น guarded fetch, การแปลง transport message และ writable transport event stream |
    | `plugin-sdk/provider-onboard` | ตัวช่วย patch คอนฟิกระหว่าง onboarding |
    | `plugin-sdk/global-singleton` | ตัวช่วย singleton/map/cache แบบ process-local |
    | `plugin-sdk/group-activation` | ตัวช่วยแบบแคบสำหรับโหมด group activation และการ parse คำสั่ง |
  </Accordion>

  <Accordion title="subpath ของ Auth และความปลอดภัย">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ตัวช่วย registry ของคำสั่งรวมถึงการจัดรูปแบบเมนู argument แบบไดนามิก, ตัวช่วย authorization ของผู้ส่ง |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความคำสั่ง/วิธีใช้ เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | การ resolve ผู้อนุมัติและตัวช่วย action-auth แบบ same-chat |
    | `plugin-sdk/approval-client-runtime` | ตัวช่วยโปรไฟล์/ตัวกรอง native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | adapter สำหรับความสามารถ/การส่งของ native approval |
    | `plugin-sdk/approval-gateway-runtime` | ตัวช่วย shared สำหรับการ resolve gateway ของ approval |
    | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยโหลด native approval adapter แบบ lightweight สำหรับ hot channel entrypoints |
    | `plugin-sdk/approval-handler-runtime` | ตัวช่วย runtime ของ approval handler ที่กว้างกว่า; ควรเลือกใช้ seam แบบ adapter/gateway ที่แคบกว่านี้เมื่อเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | ตัวช่วย native approval target + account-binding |
    | `plugin-sdk/approval-reply-runtime` | ตัวช่วย payload สำหรับการตอบกลับ approval ของ exec/plugin |
    | `plugin-sdk/approval-runtime` | ตัวช่วย payload ของ approval สำหรับ exec/plugin, ตัวช่วย routing/runtime ของ native approval และตัวช่วยการแสดง approval แบบมีโครงสร้าง เช่น `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | ตัวช่วยรีเซ็ต dedupe ของการตอบกลับขาเข้าแบบแคบ |
    | `plugin-sdk/channel-contract-testing` | ตัวช่วยทดสอบ contract ของ channel แบบแคบ โดยไม่ใช้ testing barrel ขนาดใหญ่ |
    | `plugin-sdk/command-auth-native` | native command auth, การจัดรูปแบบเมนู argument แบบไดนามิก และตัวช่วย native session-target |
    | `plugin-sdk/command-detection` | ตัวช่วย shared สำหรับตรวจจับคำสั่ง |
    | `plugin-sdk/command-primitives-runtime` | predicate ของข้อความคำสั่งแบบ lightweight สำหรับ hot channel paths |
    | `plugin-sdk/command-surface` | ตัวช่วย normalize command-body และ command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยเก็บรวบรวม secret-contract แบบแคบสำหรับพื้นผิว secret ของ channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | ตัวช่วย `coerceSecretRef` แบบแคบและตัวช่วยประเภท SecretRef สำหรับการ parse secret-contract/config |
    | `plugin-sdk/security-runtime` | ตัวช่วย shared สำหรับ trust, DM gating, external-content และการเก็บรวบรวม secret |
    | `plugin-sdk/ssrf-policy` | ตัวช่วย host allowlist และนโยบาย SSRF สำหรับ private-network |
    | `plugin-sdk/ssrf-dispatcher` | ตัวช่วย pinned-dispatcher แบบแคบ โดยไม่ใช้ infra runtime ขนาดใหญ่ |
    | `plugin-sdk/ssrf-runtime` | ตัวช่วย pinned-dispatcher, fetch ที่ป้องกัน SSRF และนโยบาย SSRF |
    | `plugin-sdk/secret-input` | ตัวช่วย parse อินพุตของ secret |
    | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ/เป้าหมายของ Webhook |
    | `plugin-sdk/webhook-request-guards` | ตัวช่วยขนาด body/timeout ของคำขอ |
  </Accordion>

  <Accordion title="subpath ของ Runtime และที่เก็บข้อมูล">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | ตัวช่วยทั่วไปสำหรับ runtime/logging/backup/plugin-install |
    | `plugin-sdk/runtime-env` | ตัวช่วย runtime env, logger, timeout, retry และ backoff แบบแคบ |
    | `plugin-sdk/channel-runtime-context` | ตัวช่วยทั่วไปสำหรับการลงทะเบียนและค้นหา channel runtime-context |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | ตัวช่วย shared สำหรับคำสั่ง/hook/http/interactive ของ Plugin |
    | `plugin-sdk/hook-runtime` | ตัวช่วย shared สำหรับ pipeline ของ Webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | ตัวช่วยสำหรับ lazy runtime import/binding เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod` และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | ตัวช่วย exec ของโพรเซส |
    | `plugin-sdk/cli-runtime` | ตัวช่วย CLI สำหรับ formatting, wait, version, argument-invocation และ lazy command-group |
    | `plugin-sdk/gateway-runtime` | ตัวช่วย client ของ Gateway และ channel-status patch |
    | `plugin-sdk/config-runtime` | ตัวช่วยโหลด/เขียนคอนฟิก และตัวช่วยค้นหา plugin-config |
    | `plugin-sdk/telegram-command-config` | ตัวช่วย normalize ชื่อ/คำอธิบายคำสั่งของ Telegram และตรวจสอบความซ้ำ/ความขัดแย้ง แม้เมื่อพื้นผิว contract ของ Telegram แบบ bundled ไม่พร้อมใช้งาน |
    | `plugin-sdk/text-autolink-runtime` | การตรวจจับ autolink ของการอ้างอิงไฟล์โดยไม่ใช้ text-runtime barrel ขนาดใหญ่ |
    | `plugin-sdk/approval-runtime` | ตัวช่วย approval ของ exec/plugin, ตัวสร้าง approval-capability, ตัวช่วย auth/profile, ตัวช่วย native routing/runtime และการจัดรูปแบบ path ของ approval display แบบมีโครงสร้าง |
    | `plugin-sdk/reply-runtime` | ตัวช่วย shared สำหรับ runtime ขาเข้า/การตอบกลับ, chunking, dispatch, Heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วย reply dispatch/finalize และ conversation-label แบบแคบ |
    | `plugin-sdk/reply-history` | ตัวช่วย shared สำหรับ reply-history ระยะหน้าต่างสั้น เช่น `buildHistoryContext`, `recordPendingHistoryEntry` และ `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ตัวช่วย text/markdown chunking แบบแคบ |
    | `plugin-sdk/session-store-runtime` | ตัวช่วย path ของ session store + `updatedAt` |
    | `plugin-sdk/state-paths` | ตัวช่วย path ของไดเรกทอรี state/OAuth |
    | `plugin-sdk/routing` | ตัวช่วย route/session-key/account binding เช่น `resolveAgentRoute`, `buildAgentSessionKey` และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ตัวช่วย shared สำหรับสรุปสถานะ channel/account, ค่าเริ่มต้นของ runtime-state และ metadata ของ issue |
    | `plugin-sdk/target-resolver-runtime` | ตัวช่วย shared สำหรับ target resolver |
    | `plugin-sdk/string-normalization-runtime` | ตัวช่วย normalize slug/string |
    | `plugin-sdk/request-url` | ดึง URL แบบสตริงจากอินพุตที่คล้าย fetch/request |
    | `plugin-sdk/run-command` | ตัวรันคำสั่งแบบมีเวลา พร้อมผลลัพธ์ stdout/stderr ที่ normalize แล้ว |
    | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ทั่วไปสำหรับ tool/CLI |
    | `plugin-sdk/tool-payload` | ดึง payload ที่ normalize แล้วจากอ็อบเจ็กต์ผลลัพธ์ของ tool |
    | `plugin-sdk/tool-send` | ดึงฟิลด์เป้าหมายการส่งแบบ canonical จากอาร์กิวเมนต์ของ tool |
    | `plugin-sdk/temp-path` | ตัวช่วย shared สำหรับ path ดาวน์โหลดชั่วคราว |
    | `plugin-sdk/logging-core` | ตัวช่วย subsystem logger และการปิดข้อมูลสำคัญ |
    | `plugin-sdk/markdown-table-runtime` | ตัวช่วยโหมดและการแปลงตาราง Markdown |
    | `plugin-sdk/json-store` | ตัวช่วยอ่าน/เขียนสถานะ JSON ขนาดเล็ก |
    | `plugin-sdk/file-lock` | ตัวช่วย file-lock แบบ re-entrant |
    | `plugin-sdk/persistent-dedupe` | ตัวช่วย dedupe cache ที่เก็บบนดิสก์ |
    | `plugin-sdk/acp-runtime` | ตัวช่วย ACP runtime/session และ reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | การ resolve ACP binding แบบอ่านอย่างเดียว โดยไม่ดึง import ของการเริ่ม lifecycle |
    | `plugin-sdk/agent-config-primitives` | primitive ของ agent runtime config-schema แบบแคบ |
    | `plugin-sdk/boolean-param` | ตัวอ่านพารามิเตอร์ boolean แบบยืดหยุ่น |
    | `plugin-sdk/dangerous-name-runtime` | ตัวช่วย resolve การจับคู่ dangerous-name |
    | `plugin-sdk/device-bootstrap` | ตัวช่วย bootstrap ของอุปกรณ์และ pairing token |
    | `plugin-sdk/extension-shared` | primitive ตัวช่วยแบบ shared สำหรับ passive-channel, status และ ambient proxy |
    | `plugin-sdk/models-provider-runtime` | ตัวช่วยตอบกลับสำหรับคำสั่ง `/models`/provider |
    | `plugin-sdk/skill-commands-runtime` | ตัวช่วยแสดงรายการคำสั่งของ Skills |
    | `plugin-sdk/native-command-registry` | ตัวช่วย native command registry/build/serialize |
    | `plugin-sdk/agent-harness` | พื้นผิว trusted-plugin แบบทดลองสำหรับ agent harness ระดับล่าง: ประเภท harness, ตัวช่วย steer/abort การรันที่กำลังทำงาน, ตัวช่วยสะพาน OpenClaw tool, ตัวช่วยนโยบาย tool ของ runtime-plan, การจัดประเภทผลลัพธ์ terminal, ตัวช่วยจัดรูปแบบ/รายละเอียดความคืบหน้าของ tool และยูทิลิตีผลลัพธ์ของความพยายาม |
    | `plugin-sdk/provider-zai-endpoint` | ตัวช่วยตรวจจับ endpoint ของ Z.AI |
    | `plugin-sdk/infra-runtime` | ตัวช่วย system event/Heartbeat |
    | `plugin-sdk/collection-runtime` | ตัวช่วย cache ขนาดเล็กแบบมีขอบเขต |
    | `plugin-sdk/diagnostic-runtime` | ตัวช่วยแฟล็กและเหตุการณ์ของ diagnostics |
    | `plugin-sdk/error-runtime` | ตัวช่วย error graph, formatting, การจัดประเภทข้อผิดพลาดแบบใช้ร่วมกัน, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ตัวช่วย wrapped fetch, proxy และ pinned lookup |
    | `plugin-sdk/runtime-fetch` | runtime fetch ที่รับรู้ dispatcher โดยไม่ดึง import ของ proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | ตัวอ่าน response-body แบบมีขอบเขต โดยไม่ใช้ media runtime ขนาดใหญ่ |
    | `plugin-sdk/session-binding-runtime` | สถานะการ bind การสนทนาปัจจุบัน โดยไม่มี configured binding routing หรือ pairing stores |
    | `plugin-sdk/session-store-runtime` | ตัวช่วยอ่าน session-store โดยไม่ดึง import การเขียนคอนฟิก/การบำรุงรักษาขนาดใหญ่ |
    | `plugin-sdk/context-visibility-runtime` | การ resolve การมองเห็นของบริบทและการกรองบริบทเสริม โดยไม่ดึง import ของ config/security ขนาดใหญ่ |
    | `plugin-sdk/string-coerce-runtime` | ตัวช่วยแคบสำหรับการแปลง/normalize primitive record/string โดยไม่ดึง import ของ markdown/logging |
    | `plugin-sdk/host-runtime` | ตัวช่วย normalize hostname และโฮสต์ของ SCP |
    | `plugin-sdk/retry-runtime` | ตัวช่วยคอนฟิก retry และตัวรัน retry |
    | `plugin-sdk/agent-runtime` | ตัวช่วย agent dir/identity/workspace |
    | `plugin-sdk/directory-runtime` | การ query/dedup ของไดเรกทอรีที่อิงกับคอนฟิก |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="subpath ของความสามารถและการทดสอบ">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | ตัวช่วย shared สำหรับ fetch/transform/store ของสื่อ พร้อมตัวสร้าง media payload |
    | `plugin-sdk/media-store` | ตัวช่วย media store แบบแคบ เช่น `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | ตัวช่วย shared สำหรับ failover ในการสร้างสื่อ, การเลือก candidate และข้อความเมื่อไม่มีโมเดล |
    | `plugin-sdk/media-understanding` | ประเภท provider สำหรับการทำความเข้าใจสื่อ พร้อม export ตัวช่วยด้านภาพ/เสียงสำหรับฝั่ง provider |
    | `plugin-sdk/text-runtime` | ตัวช่วย shared สำหรับ text/markdown/logging เช่น การตัดข้อความที่มองเห็นได้โดย assistant, ตัวช่วย render/chunking/table ของ Markdown, ตัวช่วยการปิดข้อมูลสำคัญ, ตัวช่วย directive-tag และยูทิลิตีข้อความปลอดภัย |
    | `plugin-sdk/text-chunking` | ตัวช่วย chunking ข้อความขาออก |
    | `plugin-sdk/speech` | ประเภท speech provider พร้อม export ตัวช่วยด้าน directive, registry, validation และ speech สำหรับฝั่ง provider |
    | `plugin-sdk/speech-core` | export ตัวช่วย shared สำหรับประเภท speech provider, registry, directive, normalization และ speech |
    | `plugin-sdk/realtime-transcription` | ประเภท provider สำหรับ realtime transcription, ตัวช่วย registry และตัวช่วย shared สำหรับ WebSocket session |
    | `plugin-sdk/realtime-voice` | ประเภท realtime voice provider และตัวช่วย registry |
    | `plugin-sdk/image-generation` | ประเภท provider สำหรับการสร้างภาพ |
    | `plugin-sdk/image-generation-core` | ตัวช่วย shared สำหรับประเภทการสร้างภาพ, failover, auth และ registry |
    | `plugin-sdk/music-generation` | ประเภท provider/request/result สำหรับการสร้างเพลง |
    | `plugin-sdk/music-generation-core` | ตัวช่วย shared สำหรับประเภทการสร้างเพลง, ตัวช่วย failover, การค้นหา provider และการ parse model-ref |
    | `plugin-sdk/video-generation` | ประเภท provider/request/result สำหรับการสร้างวิดีโอ |
    | `plugin-sdk/video-generation-core` | ตัวช่วย shared สำหรับประเภทการสร้างวิดีโอ, ตัวช่วย failover, การค้นหา provider และการ parse model-ref |
    | `plugin-sdk/webhook-targets` | ตัวช่วย registry ของเป้าหมาย Webhook และการติดตั้ง route |
    | `plugin-sdk/webhook-path` | ตัวช่วย normalize path ของ Webhook |
    | `plugin-sdk/web-media` | ตัวช่วย shared สำหรับการโหลดสื่อจากระยะไกล/ในเครื่อง |
    | `plugin-sdk/zod` | `zod` ที่ re-export สำหรับผู้ใช้ Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="subpath ของ Memory">
    | Subpath | export หลัก |
    | --- | --- |
    | `plugin-sdk/memory-core` | พื้นผิวตัวช่วยของ memory-core แบบ bundled สำหรับตัวช่วย manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade ของ memory index/search runtime |
    | `plugin-sdk/memory-core-host-engine-foundation` | export ของ foundation engine สำหรับ memory host |
    | `plugin-sdk/memory-core-host-engine-embeddings` | contract ของ memory host embedding, การเข้าถึง registry, local provider และตัวช่วยทั่วไปสำหรับ batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | export ของ QMD engine สำหรับ memory host |
    | `plugin-sdk/memory-core-host-engine-storage` | export ของ storage engine สำหรับ memory host |
    | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วย multimodal สำหรับ memory host |
    | `plugin-sdk/memory-core-host-query` | ตัวช่วย query สำหรับ memory host |
    | `plugin-sdk/memory-core-host-secret` | ตัวช่วย secret สำหรับ memory host |
    | `plugin-sdk/memory-core-host-events` | ตัวช่วย event journal สำหรับ memory host |
    | `plugin-sdk/memory-core-host-status` | ตัวช่วยสถานะสำหรับ memory host |
    | `plugin-sdk/memory-core-host-runtime-cli` | ตัวช่วย CLI runtime สำหรับ memory host |
    | `plugin-sdk/memory-core-host-runtime-core` | ตัวช่วย core runtime สำหรับ memory host |
    | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วย file/runtime สำหรับ memory host |
    | `plugin-sdk/memory-host-core` | alias แบบไม่ขึ้นกับผู้จำหน่ายสำหรับตัวช่วย core runtime ของ memory host |
    | `plugin-sdk/memory-host-events` | alias แบบไม่ขึ้นกับผู้จำหน่ายสำหรับตัวช่วย event journal ของ memory host |
    | `plugin-sdk/memory-host-files` | alias แบบไม่ขึ้นกับผู้จำหน่ายสำหรับตัวช่วย file/runtime ของ memory host |
    | `plugin-sdk/memory-host-markdown` | ตัวช่วย managed-markdown แบบ shared สำหรับ Plugin ที่อยู่ใกล้กับ Memory |
    | `plugin-sdk/memory-host-search` | Active Memory runtime facade สำหรับการเข้าถึง search-manager |
    | `plugin-sdk/memory-host-status` | alias แบบไม่ขึ้นกับผู้จำหน่ายสำหรับตัวช่วยสถานะของ memory host |
    | `plugin-sdk/memory-lancedb` | พื้นผิวตัวช่วยของ memory-lancedb แบบ bundled |
  </Accordion>

  <Accordion title="subpath ของ bundled-helper ที่สงวนไว้">
    | ตระกูล | subpath ปัจจุบัน | การใช้งานที่ตั้งใจไว้ |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | ตัวช่วยสนับสนุนของ bundled browser plugin `browser-profiles` export `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` และ `ResolvedBrowserTabCleanupConfig` สำหรับรูปแบบ `browser.tabCleanup` ที่ normalize แล้ว ส่วน `browser-support` ยังคงเป็น compatibility barrel |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | พื้นผิวตัวช่วย/runtime ของ Matrix แบบ bundled |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | พื้นผิวตัวช่วย/runtime ของ LINE แบบ bundled |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | พื้นผิวตัวช่วยของ IRC แบบ bundled |
    | ตัวช่วยเฉพาะ Channel | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | seam สำหรับความเข้ากันได้/ตัวช่วยของ channel แบบ bundled |
    | ตัวช่วยเฉพาะ auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | seam ของตัวช่วยฟีเจอร์/Plugin แบบ bundled; ปัจจุบัน `plugin-sdk/github-copilot-token` export `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` และ `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
