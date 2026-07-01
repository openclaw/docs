---
read_when:
    - การเลือกเส้นทางย่อย plugin-sdk ที่ถูกต้องสำหรับการนำเข้า Plugin
    - การตรวจสอบเส้นทางย่อยของ Plugin ที่รวมมาและพื้นผิวตัวช่วย
summary: 'แคตตาล็อกพาธย่อยของ Plugin SDK: การนำเข้าใดอยู่ที่ไหน จัดกลุ่มตามส่วนงาน'
title: เส้นทางย่อยของ Plugin SDK
x-i18n:
    generated_at: "2026-07-01T13:30:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589b5581626e50ddb5056ff2aaa60a0af48b92e09c0ca5aa22e2dbf2aed736db
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK ถูกเปิดเผยเป็นชุดของ subpath สาธารณะแบบแคบภายใต้
`openclaw/plugin-sdk/` หน้านี้จัดทำแค็ตตาล็อก subpath ที่ใช้กันทั่วไปโดยจัดกลุ่มตาม
วัตถุประสงค์ รายการ entrypoint ของคอมไพเลอร์ที่สร้างขึ้นอยู่ใน
`scripts/lib/plugin-sdk-entrypoints.json`; package exports คือส่วนย่อยสาธารณะ
หลังจากหัก subpath สำหรับการทดสอบ/ภายในเฉพาะ repo-local ที่ระบุไว้ใน
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` Maintainer สามารถตรวจสอบ
จำนวน public export ได้ด้วย `pnpm plugin-sdk:surface` และ subpath ตัวช่วยที่สงวนไว้และใช้งานอยู่
ได้ด้วย `pnpm plugins:boundary-report:summary`; helper export ที่สงวนไว้แต่ไม่ได้ใช้
จะทำให้รายงาน CI ล้มเหลวแทนที่จะค้างอยู่ใน SDK สาธารณะเป็น
หนี้ compatibility ที่ dormant

สำหรับคู่มือการเขียน Plugin โปรดดู [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## เอนทรี Plugin

| Subpath                        | export สำคัญ                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | ตัวช่วยรายการผู้ให้บริการ migration เช่น `createMigrationItem`, ค่าคงที่ reason, marker สถานะรายการ, ตัวช่วย redaction และ `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | ตัวช่วย runtime migration เช่น `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` และ `writeMigrationReport`                                              |
| `plugin-sdk/health`            | การลงทะเบียน health-check ของ Doctor, detection, repair, selection, severity และประเภท finding สำหรับ bundled health consumer                                               |

### Compatibility และตัวช่วยทดสอบที่เลิกใช้แล้ว

subpath ที่เลิกใช้แล้วยังคงถูก export สำหรับ Plugin รุ่นเก่า แต่โค้ดใหม่ควรใช้
subpath SDK ที่เจาะจงด้านล่าง รายการที่ดูแลอยู่คือ
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI จะปฏิเสธการ import สำหรับ production แบบ bundled
จากรายการนั้น barrel แบบกว้าง เช่น `compat`, `config-types`,
`infra-runtime`, `text-runtime` และ `zod` มีไว้เพื่อ compatibility เท่านั้น ให้ import `zod`
โดยตรงจาก `zod`

subpath ตัวช่วยทดสอบที่รองรับด้วย Vitest ของ OpenClaw เป็นแบบ repo-local เท่านั้น และไม่เป็น
package exports อีกต่อไป: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` และ `testing`

### subpath ตัวช่วย Plugin แบบ bundled ที่สงวนไว้

subpath เหล่านี้เป็นพื้นผิว compatibility ที่ Plugin เป็นเจ้าของสำหรับ bundled
Plugin เจ้าของของตน ไม่ใช่ API SDK ทั่วไป: `plugin-sdk/codex-mcp-projection` และ
`plugin-sdk/codex-native-task-runtime` การ import extension ข้ามเจ้าของจะถูกบล็อก
โดย guardrail สัญญาของ package

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | การส่งออกสคีมา Zod รากของ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | ตัวช่วยตรวจสอบ JSON Schema แบบแคชสำหรับสคีมาที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | ตัวช่วยตัวช่วยตั้งค่าแบบวิซาร์ดที่ใช้ร่วมกัน, ตัวแปลการตั้งค่า, พรอมต์ allowlist, ตัวสร้างสถานะการตั้งค่า |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | alias สำหรับความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | ตัวช่วย config/action-gate แบบหลายบัญชี, ตัวช่วย fallback บัญชีเริ่มต้น |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ตัวช่วยปรับ account-id ให้เป็นรูปแบบปกติ |
    | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชี + fallback เริ่มต้น |
    | `plugin-sdk/account-helpers` | ตัวช่วย account-list/account-action แบบแคบ |
    | `plugin-sdk/access-groups` | ตัวช่วยแยกวิเคราะห์ allowlist ของ access-group และตัวช่วยวินิจฉัยกลุ่มแบบปกปิดข้อมูล |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | facade สำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | primitives ของสคีมา config ช่องทางที่ใช้ร่วมกัน พร้อมตัวสร้าง Zod และ JSON/TypeBox โดยตรง |
    | `plugin-sdk/bundled-channel-config-schema` | สคีมา config ช่องทาง OpenClaw ที่บันเดิลไว้สำหรับ Plugin ที่บันเดิลและดูแลอยู่เท่านั้น |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId` id ช่องแชทแบบบันเดิล/ทางการที่เป็นมาตรฐาน พร้อมป้ายกำกับ/alias ของ formatter สำหรับ Plugin ที่ต้องรู้จักข้อความที่ขึ้นต้นด้วย envelope prefix โดยไม่ต้อง hardcode ตารางของตัวเอง |
    | `plugin-sdk/channel-config-schema-legacy` | alias สำหรับความเข้ากันได้ที่เลิกใช้แล้วสำหรับสคีมา config ช่องทางแบบบันเดิล |
    | `plugin-sdk/telegram-command-config` | ตัวช่วยปรับรูปแบบ/ตรวจสอบความถูกต้องของคำสั่งกำหนดเองของ Telegram พร้อม fallback ตามสัญญาแบบบันเดิล |
    | `plugin-sdk/command-gating` | ตัวช่วย gate การอนุญาตคำสั่งแบบแคบ |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | facade ความเข้ากันได้ของ channel ingress ระดับต่ำที่เลิกใช้แล้ว พาธรับใหม่ควรใช้ `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/channel-ingress-runtime` | ตัวแก้ runtime ของ channel ingress ระดับสูงแบบทดลองและตัวสร้าง route fact สำหรับพาธรับของช่องทางที่ย้ายแล้ว ควรใช้สิ่งนี้แทนการประกอบ effective allowlists, command allowlists และ legacy projections ในแต่ละ Plugin ดู [API ของ Channel ingress](/th/plugins/sdk-channel-ingress) |
    | `plugin-sdk/channel-lifecycle` | facade สำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-outbound` | สัญญา lifecycle ของข้อความ รวมถึงตัวเลือก reply pipeline, receipts, live preview/streaming, ตัวช่วย lifecycle, outbound identity, การวางแผน payload, durable sends และตัวช่วย context การส่งข้อความ ดู [API ของ Channel outbound](/th/plugins/sdk-channel-outbound) |
    | `plugin-sdk/channel-message` | alias สำหรับความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `plugin-sdk/channel-outbound` พร้อม facade การ dispatch reply แบบเดิม |
    | `plugin-sdk/channel-message-runtime` | alias สำหรับความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `plugin-sdk/channel-outbound` พร้อม facade การ dispatch reply แบบเดิม |
    | `plugin-sdk/inbound-envelope` | ตัวช่วย route inbound + ตัวสร้าง envelope ที่ใช้ร่วมกัน |
    | `plugin-sdk/inbound-reply-dispatch` | facade สำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-inbound` สำหรับ inbound runners และ dispatch predicates และใช้ `plugin-sdk/channel-outbound` สำหรับตัวช่วยส่งข้อความ |
    | `plugin-sdk/messaging-targets` | alias การแยกวิเคราะห์เป้าหมายที่เลิกใช้แล้ว; ใช้ `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | ตัวช่วยโหลดสื่อ outbound และสถานะ hosted-media ที่ใช้ร่วมกัน |
    | `plugin-sdk/outbound-send-deps` | facade สำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/outbound-runtime` | facade สำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/poll-runtime` | ตัวช่วยปรับ poll ให้เป็นรูปแบบปกติแบบแคบ |
    | `plugin-sdk/thread-bindings-runtime` | ตัวช่วย lifecycle และ adapter ของ thread-binding |
    | `plugin-sdk/agent-media-payload` | ตัวสร้าง payload สื่อของ agent แบบเก่า |
    | `plugin-sdk/conversation-runtime` | ตัวช่วย binding ของการสนทนา/thread, pairing และ configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วย snapshot config ของ runtime |
    | `plugin-sdk/runtime-group-policy` | ตัวช่วยแก้นโยบายกลุ่มของ runtime |
    | `plugin-sdk/channel-status` | ตัวช่วย snapshot/summary สถานะช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/channel-config-primitives` | primitives ของ channel config-schema แบบแคบ |
    | `plugin-sdk/channel-config-writes` | ตัวช่วยการอนุญาตการเขียน config ช่องทาง |
    | `plugin-sdk/channel-plugin-common` | การส่งออก prelude ของ channel Plugin ที่ใช้ร่วมกัน |
    | `plugin-sdk/allowlist-config-edit` | ตัวช่วยแก้ไข/อ่าน config allowlist |
    | `plugin-sdk/group-access` | ตัวช่วยตัดสินใจ group-access ที่ใช้ร่วมกัน |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | facade สำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-inbound` |
    | `plugin-sdk/direct-dm-guard-policy` | ตัวช่วยนโยบาย guard ก่อน crypto สำหรับ direct-DM แบบแคบ |
    | `plugin-sdk/discord` | facade ความเข้ากันได้ของ Discord ที่เลิกใช้แล้วสำหรับ `@openclaw/discord@2026.3.13` ที่เผยแพร่แล้วและความเข้ากันได้ของเจ้าของที่ติดตามอยู่; Plugin ใหม่ควรใช้พาธย่อย SDK ช่องทางแบบทั่วไป |
    | `plugin-sdk/telegram-account` | facade ความเข้ากันได้ของการแก้บัญชี Telegram ที่เลิกใช้แล้วสำหรับความเข้ากันได้ของเจ้าของที่ติดตามอยู่; Plugin ใหม่ควรใช้ตัวช่วย runtime ที่ฉีดเข้ามาหรือพาธย่อย SDK ช่องทางแบบทั่วไป |
    | `plugin-sdk/zalouser` | facade ความเข้ากันได้ของ Zalo Personal ที่เลิกใช้แล้วสำหรับแพ็กเกจ Lark/Zalo ที่เผยแพร่แล้วซึ่งยัง import การอนุญาตคำสั่งผู้ส่ง; Plugin ใหม่ควรใช้ `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | การนำเสนอข้อความเชิง semantic, การส่งมอบ และตัวช่วยตอบกลับแบบ interactive รุ่นเดิม ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | ตัวช่วย inbound ที่ใช้ร่วมกันสำหรับการจัดประเภท event, การสร้าง context, การจัดรูปแบบ, roots, debounce, การจับคู่ mention, mention-policy และ logging inbound |
    | `plugin-sdk/channel-inbound-debounce` | ตัวช่วย debounce inbound แบบแคบ |
    | `plugin-sdk/channel-mention-gating` | ตัวช่วย mention-policy, mention marker และข้อความ mention แบบแคบ โดยไม่มีพื้นผิว runtime inbound ที่กว้างกว่า |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | facade สำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-inbound` หรือ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-pairing-paths` | facade สำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-pairing` |
    | `plugin-sdk/channel-reply-options-runtime` | facade สำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-streaming` | facade สำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-send-result` | ชนิดผลลัพธ์ reply |
    | `plugin-sdk/channel-actions` | ตัวช่วย message-action ของช่องทาง พร้อมตัวช่วยสคีมา native ที่เลิกใช้แล้วแต่เก็บไว้เพื่อความเข้ากันได้ของ Plugin |
    | `plugin-sdk/channel-route` | ตัวช่วยปรับ route ให้เป็นรูปแบบปกติที่ใช้ร่วมกัน, การแก้ target ที่ขับเคลื่อนด้วย parser, การแปลง thread-id เป็น string, คีย์ route สำหรับ dedupe/compact, ชนิด parsed-target และตัวช่วยเปรียบเทียบ route/target |
    | `plugin-sdk/channel-targets` | ตัวช่วยแยกวิเคราะห์ target; caller ที่เปรียบเทียบ route ควรใช้ `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | ชนิดสัญญาของช่องทาง |
    | `plugin-sdk/channel-feedback` | การเชื่อมต่อ feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยสัญญา secret แบบแคบ เช่น `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` และชนิดเป้าหมาย secret |
  </Accordion>

ตระกูลตัวช่วยช่องทางที่เลิกใช้แล้วยังคงพร้อมใช้งานเฉพาะเพื่อความเข้ากันได้กับ Plugin ที่เผยแพร่แล้วเท่านั้น
แผนการนำออกคือ: เก็บไว้ตลอดช่วงเวลาการย้าย Plugin ภายนอก
คง Plugin ใน repo/แบบบันเดิลไว้บน `channel-inbound` และ
`channel-outbound` จากนั้นนำพาธย่อยสำหรับความเข้ากันได้ออกในการ cleanup SDK major ครั้งถัดไป
สิ่งนี้ใช้กับตระกูล channel message/runtime เดิม, channel
streaming, การเข้าถึง direct-DM, เศษส่วนตัวช่วย inbound, reply-options,
และ pairing-path

  <Accordion title="พาธย่อยของผู้ให้บริการ">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | facade ผู้ให้บริการ LM Studio ที่รองรับสำหรับการตั้งค่า การค้นพบแค็ตตาล็อก และการเตรียมโมเดลระหว่างรันไทม์ |
    | `plugin-sdk/lmstudio-runtime` | facade รันไทม์ LM Studio ที่รองรับสำหรับค่าเริ่มต้นของเซิร์ฟเวอร์ในเครื่อง การค้นพบโมเดล ส่วนหัวคำขอ และตัวช่วยสำหรับโมเดลที่โหลดแล้ว |
    | `plugin-sdk/provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการภายในเครื่อง/โฮสต์เองที่คัดสรรแล้ว |
    | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการแบบโฮสต์เองที่เข้ากันได้กับ OpenAI โดยเฉพาะ |
    | `plugin-sdk/cli-backend` | ค่าเริ่มต้นของแบ็กเอนด์ CLI + ค่าคงที่ watchdog |
    | `plugin-sdk/provider-auth-runtime` | ตัวช่วยแก้ไข API key ระหว่างรันไทม์สำหรับ Plugin ผู้ให้บริการ |
    | `plugin-sdk/provider-oauth-runtime` | ชนิด callback OAuth ของผู้ให้บริการทั่วไป การเรนเดอร์หน้า callback ตัวช่วย PKCE/state การแยกวิเคราะห์ authorization-input ตัวช่วยการหมดอายุของโทเค็น และตัวช่วยยกเลิก |
    | `plugin-sdk/provider-auth-api-key` | ตัวช่วย onboarding/เขียนโปรไฟล์สำหรับ API key เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
    | `plugin-sdk/provider-env-vars` | ตัวช่วยค้นหา env var สำหรับการยืนยันตัวตนของผู้ให้บริการ |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, ตัวช่วยนำเข้าการยืนยันตัวตน OpenAI Codex, การส่งออกความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้างนโยบาย replay ที่ใช้ร่วมกัน, ตัวช่วย endpoint ของผู้ให้บริการ และตัวช่วย normalization ของ model-id ที่ใช้ร่วมกัน |
    | `plugin-sdk/provider-catalog-live-runtime` | ตัวช่วยแค็ตตาล็อกโมเดลผู้ให้บริการแบบสดสำหรับการค้นพบแบบมีการป้องกันสไตล์ `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, การกรอง model-id, แคช TTL และทางสำรองแบบสแตติก |
    | `plugin-sdk/provider-catalog-runtime` | hook รันไทม์สำหรับการเสริมแค็ตตาล็อกผู้ให้บริการ และ seam รีจิสทรี plugin-provider สำหรับการทดสอบสัญญา |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | ตัวช่วยความสามารถ HTTP/endpoint ของผู้ให้บริการทั่วไป ข้อผิดพลาด HTTP ของผู้ให้บริการ และตัวช่วยฟอร์ม multipart สำหรับการถอดเสียงจากเสียง |
    | `plugin-sdk/provider-web-fetch-contract` | ตัวช่วยสัญญาการกำหนดค่า/การเลือก web-fetch แบบแคบ เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | ตัวช่วยการลงทะเบียน/แคชผู้ให้บริการ web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วยการกำหนดค่า/ข้อมูลรับรอง web-search แบบแคบสำหรับผู้ให้บริการที่ไม่ต้องการการเชื่อมสาย enable ของ Plugin |
    | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญาการกำหนดค่า/ข้อมูลรับรอง web-search แบบแคบ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวอ่านข้อมูลรับรองแบบมีขอบเขต |
    | `plugin-sdk/provider-web-search` | ตัวช่วยการลงทะเบียน/แคช/รันไทม์ของผู้ให้บริการ web-search |
    | `plugin-sdk/embedding-providers` | ชนิดผู้ให้บริการ embedding ทั่วไปและตัวช่วยอ่าน รวมถึง `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` และ `listEmbeddingProviders(...)`; Plugin ลงทะเบียนผู้ให้บริการผ่าน `api.registerEmbeddingProvider(...)` เพื่อบังคับใช้ ownership ของ manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` และการล้าง schema + diagnostics ของ DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | ชนิด snapshot การใช้งานของผู้ให้บริการ ตัวช่วย fetch การใช้งานที่ใช้ร่วมกัน และ fetcher ของผู้ให้บริการ เช่น `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ชนิด wrapper ของ stream, ความเข้ากันได้กับ tool-call แบบข้อความล้วน และตัวช่วย wrapper ที่ใช้ร่วมกันของ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | ตัวช่วย wrapper ของ stream ผู้ให้บริการแบบใช้ร่วมกันสาธารณะ รวมถึง `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` และยูทิลิตี stream ที่เข้ากันได้กับ Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | ตัวช่วย transport ผู้ให้บริการแบบ native เช่น guarded fetch, การดึงข้อความ tool-result, การแปลงข้อความ transport และ stream เหตุการณ์ transport ที่เขียนได้ |
    | `plugin-sdk/provider-onboard` | ตัวช่วย patch การกำหนดค่า onboarding |
    | `plugin-sdk/global-singleton` | ตัวช่วย singleton/map/cache เฉพาะกระบวนการ |
    | `plugin-sdk/group-activation` | โหมด group activation แบบแคบและตัวช่วยแยกวิเคราะห์คำสั่ง |
  </Accordion>

โดยปกติ snapshot การใช้งานของผู้ให้บริการจะรายงาน quota `windows` อย่างน้อยหนึ่งรายการ โดยแต่ละรายการมีป้ายกำกับ เปอร์เซ็นต์ที่ใช้ และเวลา reset ที่ไม่บังคับ ผู้ให้บริการที่แสดงยอดคงเหลือหรือข้อความสถานะบัญชีแทนหน้าต่าง quota ที่ reset ได้ควรคืนค่า `summary` พร้อมอาร์เรย์ `windows` ว่าง แทนที่จะสร้างเปอร์เซ็นต์ขึ้นเอง OpenClaw จะแสดงข้อความสรุปนั้นในเอาต์พุตสถานะ; ใช้ `error` เฉพาะเมื่อ endpoint การใช้งานล้มเหลวหรือไม่คืนข้อมูลการใช้งานที่ใช้ได้

  <Accordion title="พาธย่อยการยืนยันตัวตนและความปลอดภัย">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ตัวช่วยรีจิสทรีคำสั่ง รวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก ตัวช่วยการอนุญาตผู้ส่ง |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความคำสั่ง/ความช่วยเหลือ เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | ตัวช่วยแก้ไขผู้อนุมัติและ action-auth ในแชตเดียวกัน |
    | `plugin-sdk/approval-client-runtime` | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติ native exec |
    | `plugin-sdk/approval-delivery-runtime` | adapter ความสามารถ/การส่งมอบการอนุมัติแบบ native |
    | `plugin-sdk/approval-gateway-runtime` | ตัวช่วยแก้ไข Gateway การอนุมัติที่ใช้ร่วมกัน |
    | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยโหลด adapter การอนุมัติแบบ native ที่เบาสำหรับ entrypoint ช่องทางที่ใช้งานบ่อย |
    | `plugin-sdk/approval-handler-runtime` | ตัวช่วยรันไทม์ handler การอนุมัติที่กว้างกว่า; ควรใช้ seam adapter/Gateway ที่แคบกว่าเมื่อเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติแบบ native, การผูกบัญชี, route-gate, ทางสำรองการส่งต่อ และการระงับพรอมต์ native exec ภายในเครื่อง |
    | `plugin-sdk/approval-reaction-runtime` | binding reaction การอนุมัติแบบ hardcoded, payload พรอมต์ reaction, store เป้าหมาย reaction และการส่งออกความเข้ากันได้สำหรับการระงับพรอมต์ native exec ภายในเครื่อง |
    | `plugin-sdk/approval-reply-runtime` | ตัวช่วย payload การตอบกลับการอนุมัติ exec/Plugin |
    | `plugin-sdk/approval-runtime` | ตัวช่วย payload การอนุมัติ exec/Plugin, ตัวช่วย routing/รันไทม์การอนุมัติแบบ native และตัวช่วยแสดงผลการอนุมัติแบบมีโครงสร้าง เช่น `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | ตัวช่วย reset การลบ reply ขาเข้าซ้ำแบบแคบ |
    | `plugin-sdk/channel-contract-testing` | ตัวช่วยทดสอบสัญญาช่องทางแบบแคบโดยไม่มี testing barrel แบบกว้าง |
    | `plugin-sdk/command-auth-native` | การยืนยันตัวตนคำสั่งแบบ native, การจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก และตัวช่วย session-target แบบ native |
    | `plugin-sdk/command-detection` | ตัวช่วยตรวจจับคำสั่งที่ใช้ร่วมกัน |
    | `plugin-sdk/command-primitives-runtime` | predicate ข้อความคำสั่งแบบเบาสำหรับพาธช่องทางที่ใช้งานบ่อย |
    | `plugin-sdk/command-surface` | การ normalize command-body และตัวช่วย command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยรวบรวมสัญญา secret แบบแคบสำหรับพื้นผิว secret ของช่องทาง/Plugin |
    | `plugin-sdk/secret-ref-runtime` | ตัวช่วย typing `coerceSecretRef` และ SecretRef แบบแคบสำหรับการแยกวิเคราะห์ secret-contract/config |
    | `plugin-sdk/secret-provider-integration` | manifest การผสานผู้ให้บริการ SecretRef แบบชนิดเท่านั้น และสัญญา preset สำหรับ Plugin ที่เผยแพร่ preset ผู้ให้บริการ secret ภายนอก |
    | `plugin-sdk/security-runtime` | ตัวช่วย trust ที่ใช้ร่วมกัน, การกั้น DM, ตัวช่วยไฟล์/พาธที่จำกัดอยู่ภายใต้ root รวมถึงการเขียนแบบ create-only, การแทนที่ไฟล์แบบ atomic ทั้ง sync/async, การเขียน temp ข้างเคียง, ทางสำรองการย้ายข้ามอุปกรณ์, ตัวช่วย file-store ส่วนตัว, guard สำหรับ symlink-parent, external-content, การปกปิดข้อความอ่อนไหว, การเปรียบเทียบ secret แบบ constant-time และตัวช่วยรวบรวม secret |
    | `plugin-sdk/ssrf-policy` | ตัวช่วย allowlist ของโฮสต์และนโยบาย SSRF เครือข่ายส่วนตัว |
    | `plugin-sdk/ssrf-dispatcher` | ตัวช่วย pinned-dispatcher แบบแคบโดยไม่มีพื้นผิวรันไทม์โครงสร้างพื้นฐานแบบกว้าง |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, fetch ที่มี SSRF guard, ข้อผิดพลาด SSRF และตัวช่วยนโยบาย SSRF |
    | `plugin-sdk/secret-input` | ตัวช่วยแยกวิเคราะห์ input ของ secret |
    | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ/เป้าหมาย Webhook และการบังคับชนิด websocket/body ดิบ |
    | `plugin-sdk/webhook-request-guards` | ตัวช่วยขนาด/timeout ของ request body |
  </Accordion>

  <Accordion title="ซับพาธของรันไทม์และพื้นที่จัดเก็บ">
    | ซับพาธ | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | ตัวช่วยรันไทม์/การบันทึกล็อก/การสำรองข้อมูล/การติดตั้ง Plugin แบบกว้าง |
    | `plugin-sdk/runtime-env` | ตัวช่วย env ของรันไทม์, logger, timeout, retry และ backoff แบบแคบ |
    | `plugin-sdk/browser-config` | facade การกำหนดค่าเบราว์เซอร์ที่รองรับ สำหรับโปรไฟล์/ค่าเริ่มต้นที่ทำให้เป็นมาตรฐาน, การแยกวิเคราะห์ URL ของ CDP และตัวช่วย auth สำหรับควบคุมเบราว์เซอร์ |
    | `plugin-sdk/agent-harness-task-runtime` | ตัวช่วยวงจรชีวิตงานทั่วไปและการส่งมอบการเสร็จสิ้นสำหรับเอเจนต์ที่มี harness รองรับ ซึ่งใช้ขอบเขตงานที่โฮสต์ออกให้ |
    | `plugin-sdk/codex-mcp-projection` | ตัวช่วย Codex แบบบันเดิลที่สงวนไว้ สำหรับฉายการกำหนดค่าเซิร์ฟเวอร์ MCP ของผู้ใช้ไปยังการกำหนดค่าเธรด Codex; ไม่ใช่สำหรับ Plugin บุคคลที่สาม |
    | `plugin-sdk/codex-native-task-runtime` | ตัวช่วย Codex แบบบันเดิลส่วนตัว สำหรับการต่อสาย mirror/รันไทม์ของงานเนทีฟ; ไม่ใช่สำหรับ Plugin บุคคลที่สาม |
    | `plugin-sdk/channel-runtime-context` | ตัวช่วยทั่วไปสำหรับการลงทะเบียนและค้นหา runtime-context ของช่องทาง |
    | `plugin-sdk/matrix` | facade ความเข้ากันได้กับ Matrix ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควรนำเข้า `plugin-sdk/run-command` โดยตรง |
    | `plugin-sdk/mattermost` | facade ความเข้ากันได้กับ Mattermost ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควรนำเข้าซับพาธ SDK ทั่วไปโดยตรง |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | ตัวช่วยคำสั่ง/hook/http/interactive ของ Plugin ที่ใช้ร่วมกัน |
    | `plugin-sdk/hook-runtime` | ตัวช่วย pipeline สำหรับ Webhook/hook ภายในที่ใช้ร่วมกัน |
    | `plugin-sdk/lazy-runtime` | ตัวช่วยการนำเข้า/การผูกแบบ lazy ของรันไทม์ เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod` และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | ตัวช่วย exec ของโปรเซส |
    | `plugin-sdk/cli-runtime` | ตัวช่วยการจัดรูปแบบ CLI, การรอ, เวอร์ชัน, การเรียกใช้งานด้วยอาร์กิวเมนต์ และกลุ่มคำสั่งแบบ lazy |
    | `plugin-sdk/qa-live-transport-scenarios` | id ของสถานการณ์ QA การขนส่งสดที่ใช้ร่วมกัน, ตัวช่วยความครอบคลุม baseline และตัวช่วยเลือกสถานการณ์ |
    | `plugin-sdk/gateway-method-runtime` | ตัวช่วย dispatch เมธอด Gateway ที่สงวนไว้สำหรับเส้นทาง HTTP ของ Plugin ที่ประกาศ `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | ไคลเอนต์ Gateway, ตัวช่วยเริ่มไคลเอนต์ที่พร้อมสำหรับ event loop, RPC ของ CLI สำหรับ gateway, ข้อผิดพลาดโปรโตคอล gateway, การแก้ host LAN ที่ประกาศไว้ และตัวช่วย patch สถานะช่องทาง |
    | `plugin-sdk/config-contracts` | พื้นผิวการกำหนดค่าแบบ type-only ที่โฟกัสสำหรับ shape การกำหนดค่า Plugin เช่น `OpenClawConfig` และชนิดการกำหนดค่าช่องทาง/provider |
    | `plugin-sdk/plugin-config-runtime` | ตัวช่วยค้นหาการกำหนดค่า Plugin ในรันไทม์ เช่น `requireRuntimeConfig`, `resolvePluginConfigObject` และ `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | ตัวช่วย mutation การกำหนดค่าแบบธุรกรรม เช่น `mutateConfigFile`, `replaceConfigFile` และ `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | สตริง hint metadata การส่งมอบเครื่องมือข้อความที่ใช้ร่วมกัน |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วย snapshot การกำหนดค่าโปรเซสปัจจุบัน เช่น `getRuntimeConfig`, `getRuntimeConfigSnapshot` และตัวตั้งค่า snapshot สำหรับทดสอบ |
    | `plugin-sdk/telegram-command-config` | การทำให้ชื่อคำสั่ง/คำอธิบายของ Telegram เป็นมาตรฐาน และการตรวจสอบรายการซ้ำ/ข้อขัดแย้ง แม้เมื่อพื้นผิวสัญญา Telegram แบบบันเดิลไม่พร้อมใช้งาน |
    | `plugin-sdk/text-autolink-runtime` | การตรวจจับ autolink สำหรับการอ้างอิงไฟล์โดยไม่มี text barrel แบบกว้าง |
    | `plugin-sdk/approval-reaction-runtime` | การผูก reaction อนุมัติแบบฮาร์ดโค้ด, payload พรอมต์ reaction, ที่เก็บเป้าหมาย reaction และ export ความเข้ากันได้สำหรับการระงับพรอมต์ exec เนทีฟในเครื่อง |
    | `plugin-sdk/approval-runtime` | ตัวช่วยการอนุมัติ exec/Plugin, ตัวสร้าง approval-capability, ตัวช่วย auth/profile, ตัวช่วยการกำหนดเส้นทาง/รันไทม์เนทีฟ และการจัดรูปแบบพาธแสดงการอนุมัติแบบมีโครงสร้าง |
    | `plugin-sdk/reply-runtime` | ตัวช่วยรันไทม์ inbound/reply ที่ใช้ร่วมกัน, การแบ่ง chunk, dispatch, Heartbeat, ตัววางแผน reply |
    | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วย dispatch/finalize การตอบกลับและตัวช่วย label การสนทนาแบบแคบ |
    | `plugin-sdk/reply-history` | ตัวช่วย reply-history ช่วงเวลาสั้นที่ใช้ร่วมกัน โค้ด message-turn ใหม่ควรใช้ `createChannelHistoryWindow`; ตัวช่วย map ระดับต่ำกว่ายังคงเป็น export ความเข้ากันได้ที่เลิกใช้แล้วเท่านั้น |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ตัวช่วย chunking ข้อความ/Markdown แบบแคบ |
    | `plugin-sdk/session-store-runtime` | ตัวช่วย workflow ของเซสชัน (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), การอ่านข้อความ transcript ผู้ใช้/ผู้ช่วยล่าสุดแบบมีขอบเขตตาม identity ของเซสชัน, ตัวช่วยพาธ store เซสชันเดิม/session-key, การอ่าน updated-at และตัวช่วยความเข้ากันได้ช่วงเปลี่ยนผ่านสำหรับทั้ง store/พาธไฟล์ |
    | `plugin-sdk/session-transcript-runtime` | identity ของ transcript, ตัวช่วย target/read/write ตามขอบเขต, การเผยแพร่การอัปเดต, write lock และคีย์ hit ของหน่วยความจำ transcript |
    | `plugin-sdk/sqlite-runtime` | ตัวช่วย schema ของเอเจนต์, พาธ และธุรกรรม SQLite ที่โฟกัสสำหรับรันไทม์ first-party |
    | `plugin-sdk/cron-store-runtime` | ตัวช่วยพาธ/load/save ของ store Cron |
    | `plugin-sdk/state-paths` | ตัวช่วยพาธไดเรกทอรี State/OAuth |
    | `plugin-sdk/plugin-state-runtime` | ชนิด keyed-state ของ SQLite sidecar สำหรับ Plugin รวมถึงการตั้งค่า connection pragma และการบำรุงรักษา WAL แบบรวมศูนย์สำหรับฐานข้อมูลที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/routing` | ตัวช่วยการผูก route/session-key/account เช่น `resolveAgentRoute`, `buildAgentSessionKey` และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ตัวช่วยสรุปสถานะช่องทาง/account ที่ใช้ร่วมกัน, ค่าเริ่มต้น runtime-state และตัวช่วย metadata ของ issue |
    | `plugin-sdk/target-resolver-runtime` | ตัวช่วย target resolver ที่ใช้ร่วมกัน |
    | `plugin-sdk/string-normalization-runtime` | ตัวช่วยการทำ slug/string ให้เป็นมาตรฐาน |
    | `plugin-sdk/request-url` | แยก URL แบบสตริงจาก input ที่คล้าย fetch/request |
    | `plugin-sdk/run-command` | ตัวรันคำสั่งแบบจับเวลา พร้อมผลลัพธ์ stdout/stderr ที่ทำให้เป็นมาตรฐาน |
    | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์เครื่องมือ/CLI ทั่วไป |
    | `plugin-sdk/tool-plugin` | กำหนด Plugin เครื่องมือเอเจนต์แบบ typed อย่างง่าย และเปิดเผย metadata แบบ static สำหรับการสร้าง manifest |
    | `plugin-sdk/tool-payload` | แยก payload ที่ทำให้เป็นมาตรฐานจากอ็อบเจ็กต์ผลลัพธ์เครื่องมือ |
    | `plugin-sdk/tool-send` | แยกฟิลด์เป้าหมายการส่งแบบ canonical จากอาร์กิวเมนต์เครื่องมือ |
    | `plugin-sdk/sandbox` | ชนิด backend ของ sandbox และตัวช่วยคำสั่ง SSH/OpenShell รวมถึง preflight คำสั่ง exec แบบ fail-fast |
    | `plugin-sdk/temp-path` | ตัวช่วยพาธ temp-download ที่ใช้ร่วมกัน และ workspace ชั่วคราวที่ปลอดภัยแบบส่วนตัว |
    | `plugin-sdk/logging-core` | logger ของ subsystem และตัวช่วย redaction |
    | `plugin-sdk/markdown-table-runtime` | โหมดตาราง Markdown และตัวช่วยการแปลง |
    | `plugin-sdk/model-session-runtime` | ตัวช่วย override model/session เช่น `applyModelOverrideToSessionEntry` และ `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | ตัวช่วยแก้การกำหนดค่า provider สำหรับ talk |
    | `plugin-sdk/json-store` | ตัวช่วยอ่าน/เขียน state JSON ขนาดเล็ก |
    | `plugin-sdk/json-unsafe-integers` | ตัวช่วยแยกวิเคราะห์ JSON ที่คง literal จำนวนเต็มที่ไม่ปลอดภัยไว้เป็นสตริง |
    | `plugin-sdk/file-lock` | ตัวช่วย file-lock แบบ re-entrant |
    | `plugin-sdk/persistent-dedupe` | ตัวช่วยแคช dedupe ที่มี disk รองรับ |
    | `plugin-sdk/acp-runtime` | ตัวช่วยรันไทม์/เซสชัน ACP และ reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | ตัวช่วยการลงทะเบียน backend ACP แบบเบาและ reply-dispatch สำหรับ Plugin ที่โหลดตอนเริ่มต้น |
    | `plugin-sdk/acp-binding-resolve-runtime` | การแก้ binding ของ ACP แบบอ่านอย่างเดียวโดยไม่มีการนำเข้า startup ของวงจรชีวิต |
    | `plugin-sdk/agent-config-primitives` | primitive ของ schema การกำหนดค่ารันไทม์เอเจนต์แบบแคบ |
    | `plugin-sdk/boolean-param` | ตัวอ่านพารามิเตอร์ boolean แบบหลวม |
    | `plugin-sdk/dangerous-name-runtime` | ตัวช่วยแก้การจับคู่ชื่ออันตราย |
    | `plugin-sdk/device-bootstrap` | ตัวช่วย bootstrap อุปกรณ์และ token จับคู่ |
    | `plugin-sdk/extension-shared` | primitive ตัวช่วย passive-channel, status และ ambient proxy ที่ใช้ร่วมกัน |
    | `plugin-sdk/models-provider-runtime` | ตัวช่วยตอบกลับคำสั่ง/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | ตัวช่วยแสดงรายการคำสั่ง Skills |
    | `plugin-sdk/native-command-registry` | ตัวช่วย registry/build/serialize คำสั่งเนทีฟ |
    | `plugin-sdk/agent-harness` | พื้นผิว trusted-plugin แบบทดลองสำหรับ harness เอเจนต์ระดับต่ำ: ชนิด harness, ตัวช่วย steer/abort ของ active-run, ตัวช่วย bridge เครื่องมือ OpenClaw, ตัวช่วยนโยบายเครื่องมือ runtime-plan, การจัดประเภทผลลัพธ์ terminal, ตัวช่วยการจัดรูปแบบ/รายละเอียดความคืบหน้าเครื่องมือ และ utility ผลลัพธ์ attempt |
    | `plugin-sdk/provider-zai-endpoint` | facade การตรวจจับ endpoint ที่ provider Z.AI เป็นเจ้าของซึ่งเลิกใช้แล้ว; ใช้ API สาธารณะของ Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | ตัวช่วย async lock ภายในโปรเซสสำหรับไฟล์ state รันไทม์ขนาดเล็ก |
    | `plugin-sdk/channel-activity-runtime` | ตัวช่วย telemetry กิจกรรมช่องทาง |
    | `plugin-sdk/concurrency-runtime` | ตัวช่วย concurrency ของงาน async แบบมีขอบเขต |
    | `plugin-sdk/dedupe-runtime` | ตัวช่วยแคช dedupe ในหน่วยความจำ |
    | `plugin-sdk/delivery-queue-runtime` | ตัวช่วย drain การส่งมอบขาออกที่รอดำเนินการ |
    | `plugin-sdk/file-access-runtime` | ตัวช่วยพาธไฟล์ในเครื่องและ media-source ที่ปลอดภัย |
    | `plugin-sdk/heartbeat-runtime` | ตัวช่วย wake, event และ visibility ของ Heartbeat |
    | `plugin-sdk/number-runtime` | ตัวช่วย coercion ตัวเลข |
    | `plugin-sdk/secure-random-runtime` | ตัวช่วย token/UUID ที่ปลอดภัย |
    | `plugin-sdk/system-event-runtime` | ตัวช่วยคิว event ระบบ |
    | `plugin-sdk/transport-ready-runtime` | ตัวช่วยรอความพร้อมของ transport |
    | `plugin-sdk/exec-approvals-runtime` | ตัวช่วยไฟล์นโยบายการอนุมัติ exec โดยไม่มี infra-runtime barrel แบบกว้าง |
    | `plugin-sdk/infra-runtime` | shim ความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ซับพาธรันไทม์ที่โฟกัสด้านบน |
    | `plugin-sdk/collection-runtime` | ตัวช่วยแคชขนาดเล็กแบบมีขอบเขต |
    | `plugin-sdk/diagnostic-runtime` | ตัวช่วย flag, event และ trace-context สำหรับ diagnostic |
    | `plugin-sdk/error-runtime` | กราฟข้อผิดพลาด, การจัดรูปแบบ, ตัวช่วยจัดประเภทข้อผิดพลาดที่ใช้ร่วมกัน, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch แบบ wrapped, proxy, ตัวเลือก EnvHttpProxyAgent และตัวช่วย lookup แบบ pinned |
    | `plugin-sdk/runtime-fetch` | fetch ของรันไทม์ที่รับรู้ dispatcher โดยไม่มีการนำเข้า proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | ตัวช่วย sanitizer URL ข้อมูลรูปภาพ inline และการ sniff signature โดยไม่มีพื้นผิว media runtime แบบกว้าง |
    | `plugin-sdk/response-limit-runtime` | ตัวอ่าน response-body แบบมีขอบเขตโดยไม่มีพื้นผิว media runtime แบบกว้าง |
    | `plugin-sdk/session-binding-runtime` | สถานะ binding การสนทนาปัจจุบันโดยไม่มีการกำหนดเส้นทาง binding ที่ตั้งค่าไว้หรือ store การจับคู่ |
    | `plugin-sdk/session-store-runtime` | ตัวช่วย session-store โดยไม่มีการนำเข้าการเขียน/บำรุงรักษาการกำหนดค่าแบบกว้าง |
    | `plugin-sdk/sqlite-runtime` | ตัวช่วย schema ของเอเจนต์, พาธ และธุรกรรม SQLite ที่โฟกัส โดยไม่มีการควบคุมวงจรชีวิตฐานข้อมูล |
    | `plugin-sdk/context-visibility-runtime` | การแก้ context visibility และการกรอง context เพิ่มเติมโดยไม่มีการนำเข้าการกำหนดค่า/ความปลอดภัยแบบกว้าง |
    | `plugin-sdk/string-coerce-runtime` | ตัวช่วย coercion และการทำ primitive record/string ให้เป็นมาตรฐานแบบแคบ โดยไม่มีการนำเข้า markdown/logging |
    | `plugin-sdk/host-runtime` | ตัวช่วยการทำ hostname และ host ของ SCP ให้เป็นมาตรฐาน |
    | `plugin-sdk/retry-runtime` | ตัวช่วยการกำหนดค่า retry และตัวรัน retry |
    | `plugin-sdk/agent-runtime` | ตัวช่วยไดเรกทอรี/identity/workspace ของเอเจนต์ รวมถึง `resolveAgentDir`, `resolveDefaultAgentDir` และ export ความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว |
    | `plugin-sdk/directory-runtime` | การ query/dedup ไดเรกทอรีที่มีการกำหนดค่ารองรับ |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="เส้นทางย่อยของความสามารถและการทดสอบ">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | ตัวช่วยดึง/แปลง/จัดเก็บสื่อที่ใช้ร่วมกัน รวมถึง `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` และ `fetchRemoteMedia` ที่เลิกแนะนำแล้ว; ควรใช้ตัวช่วยจัดเก็บก่อนอ่านบัฟเฟอร์เมื่อ URL ควรกลายเป็นสื่อของ OpenClaw |
    | `plugin-sdk/media-mime` | การปรับ MIME ให้เป็นมาตรฐานแบบแคบ การแมปนามสกุลไฟล์ การตรวจจับ MIME และตัวช่วยชนิดสื่อ |
    | `plugin-sdk/media-store` | ตัวช่วยที่เก็บสื่อแบบแคบ เช่น `saveMediaBuffer` และ `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | ตัวช่วย failover การสร้างสื่อที่ใช้ร่วมกัน การเลือกตัวเลือก และข้อความเมื่อไม่มีโมเดล |
    | `plugin-sdk/media-understanding` | ชนิดของผู้ให้บริการความเข้าใจสื่อ พร้อมการส่งออกตัวช่วยด้านรูปภาพ/เสียง/การดึงข้อมูลแบบมีโครงสร้างสำหรับผู้ให้บริการ |
    | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งส่วน/เรนเดอร์ข้อความและ markdown การแปลงตาราง markdown การลบแท็ก directive และยูทิลิตีข้อความปลอดภัย |
    | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งส่วนข้อความขาออก |
    | `plugin-sdk/speech` | ชนิดของผู้ให้บริการเสียงพูด พร้อมการส่งออก directive, registry, validation, ตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI และตัวช่วยเสียงพูดสำหรับผู้ให้บริการ |
    | `plugin-sdk/speech-core` | ชนิดของผู้ให้บริการเสียงพูดที่ใช้ร่วมกัน registry, directive, normalization และการส่งออกตัวช่วยเสียงพูด |
    | `plugin-sdk/realtime-transcription` | ชนิดของผู้ให้บริการถอดเสียงแบบเรียลไทม์ ตัวช่วย registry และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
    | `plugin-sdk/realtime-bootstrap-context` | ตัวช่วยเริ่มต้นโปรไฟล์แบบเรียลไทม์สำหรับการฉีดบริบท `IDENTITY.md`, `USER.md` และ `SOUL.md` แบบมีขอบเขต |
    | `plugin-sdk/realtime-voice` | ชนิดของผู้ให้บริการเสียงแบบเรียลไทม์ ตัวช่วย registry และตัวช่วยพฤติกรรมเสียงแบบเรียลไทม์ที่ใช้ร่วมกัน รวมถึงการติดตามกิจกรรมเอาต์พุต |
    | `plugin-sdk/image-generation` | ชนิดของผู้ให้บริการสร้างรูปภาพ พร้อมตัวช่วย URL ของแอสเซ็ตรูปภาพ/ข้อมูล และตัวสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
    | `plugin-sdk/image-generation-core` | ชนิดการสร้างรูปภาพ, failover, auth และตัวช่วย registry ที่ใช้ร่วมกัน |
    | `plugin-sdk/music-generation` | ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์การสร้างเพลง |
    | `plugin-sdk/music-generation-core` | ชนิดการสร้างเพลง ตัวช่วย failover การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref ที่ใช้ร่วมกัน |
    | `plugin-sdk/video-generation` | ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์การสร้างวิดีโอ |
    | `plugin-sdk/video-generation-core` | ชนิดการสร้างวิดีโอ ตัวช่วย failover การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref ที่ใช้ร่วมกัน |
    | `plugin-sdk/transcripts` | ชนิดของผู้ให้บริการแหล่งถอดความที่ใช้ร่วมกัน ตัวช่วย registry ตัวอธิบายเซสชัน และเมทาดาทาคำพูด |
    | `plugin-sdk/webhook-targets` | Webhook target registry และตัวช่วยติดตั้ง route |
    | `plugin-sdk/webhook-path` | นามแฝงความเข้ากันได้ที่เลิกแนะนำแล้ว; ใช้ `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | ตัวช่วยโหลดสื่อระยะไกล/ภายในเครื่องที่ใช้ร่วมกัน |
    | `plugin-sdk/zod` | การ re-export เพื่อความเข้ากันได้ที่เลิกแนะนำแล้ว; นำเข้า `zod` จาก `zod` โดยตรง |
    | `plugin-sdk/testing` | barrel ความเข้ากันได้ที่เลิกแนะนำแล้วเฉพาะภายใน repo สำหรับการทดสอบ OpenClaw แบบเดิม การทดสอบใหม่ใน repo ควรนำเข้าเส้นทางย่อยการทดสอบภายในที่เจาะจง เช่น `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` หรือ `plugin-sdk/test-fixtures` แทน |
    | `plugin-sdk/plugin-test-api` | ตัวช่วย `createTestPluginApi` ขั้นต่ำเฉพาะภายใน repo สำหรับการทดสอบหน่วยการลงทะเบียน Plugin โดยตรงโดยไม่นำเข้า bridge ตัวช่วยทดสอบของ repo |
    | `plugin-sdk/agent-runtime-test-contracts` | fixture สัญญา adapter agent-runtime แบบเนทีฟเฉพาะภายใน repo สำหรับการทดสอบ auth, delivery, fallback, tool-hook, prompt-overlay, schema และ transcript projection |
    | `plugin-sdk/channel-test-helpers` | ตัวช่วยทดสอบที่มุ่งเน้น channel เฉพาะภายใน repo สำหรับสัญญา actions/setup/status ทั่วไป การยืนยันไดเรกทอรี วงจรชีวิตการเริ่มต้นบัญชี send-config threading, runtime mocks, status issues, outbound delivery และ hook registration |
    | `plugin-sdk/channel-target-testing` | ชุดกรณีข้อผิดพลาด target-resolution ที่ใช้ร่วมกันเฉพาะภายใน repo สำหรับการทดสอบ channel |
    | `plugin-sdk/plugin-test-contracts` | ตัวช่วยสัญญา package, registration, public artifact, direct import, runtime API และ import side-effect ของ Plugin เฉพาะภายใน repo |
    | `plugin-sdk/provider-test-contracts` | ตัวช่วยสัญญา provider runtime, auth, discovery, onboard, catalog, wizard, ความสามารถด้านสื่อ, replay policy, realtime STT live-audio, web-search/fetch และ stream เฉพาะภายใน repo |
    | `plugin-sdk/provider-http-test-mocks` | HTTP/auth mocks ของ Vitest แบบ opt-in เฉพาะภายใน repo สำหรับการทดสอบผู้ให้บริการที่ทดสอบ `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | fixture ทั่วไปเฉพาะภายใน repo สำหรับการจับ runtime ของ CLI, sandbox context, skill writer, agent-message, system-event, module reload, bundled plugin path, terminal-text, chunking, auth-token และ typed-case |
    | `plugin-sdk/test-node-mocks` | ตัวช่วย mock builtin ของ Node แบบเจาะจงเฉพาะภายใน repo สำหรับใช้ภายใน factory ของ Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="เส้นทางย่อยของหน่วยความจำ">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/memory-core` | พื้นผิวตัวช่วย memory-core ที่บันเดิลไว้สำหรับตัวช่วย manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade runtime สำหรับดัชนี/การค้นหาหน่วยความจำ |
    | `plugin-sdk/memory-core-host-embedding-registry` | ตัวช่วย registry ผู้ให้บริการ embedding หน่วยความจำแบบเบา |
    | `plugin-sdk/memory-core-host-engine-foundation` | การส่งออก engine foundation ของ memory host |
    | `plugin-sdk/memory-core-host-engine-embeddings` | สัญญา embedding ของ memory host การเข้าถึง registry ผู้ให้บริการภายในเครื่อง และตัวช่วย batch/remote ทั่วไป `registerMemoryEmbeddingProvider` บนพื้นผิวนี้เลิกแนะนำแล้ว; ใช้ API ผู้ให้บริการ embedding ทั่วไปสำหรับผู้ให้บริการใหม่ |
    | `plugin-sdk/memory-core-host-engine-qmd` | การส่งออก QMD engine ของ memory host |
    | `plugin-sdk/memory-core-host-engine-storage` | การส่งออก storage engine ของ memory host |
    | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วย multimodal ของ memory host |
    | `plugin-sdk/memory-core-host-query` | ตัวช่วย query ของ memory host |
    | `plugin-sdk/memory-core-host-secret` | ตัวช่วย secret ของ memory host |
    | `plugin-sdk/memory-core-host-events` | นามแฝงความเข้ากันได้ที่เลิกแนะนำแล้ว; ใช้ `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | ตัวช่วย status ของ memory host |
    | `plugin-sdk/memory-core-host-runtime-cli` | ตัวช่วย CLI runtime ของ memory host |
    | `plugin-sdk/memory-core-host-runtime-core` | ตัวช่วย core runtime ของ memory host |
    | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วย file/runtime ของ memory host |
    | `plugin-sdk/memory-host-core` | นามแฝงที่ไม่ผูกกับ vendor สำหรับตัวช่วย core runtime ของ memory host |
    | `plugin-sdk/memory-host-events` | นามแฝงที่ไม่ผูกกับ vendor สำหรับตัวช่วย event journal ของ memory host |
    | `plugin-sdk/memory-host-files` | นามแฝงความเข้ากันได้ที่เลิกแนะนำแล้ว; ใช้ `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | ตัวช่วย managed-markdown ที่ใช้ร่วมกันสำหรับ Plugin ที่อยู่ใกล้กับหน่วยความจำ |
    | `plugin-sdk/memory-host-search` | facade runtime ของ Active Memory สำหรับการเข้าถึง search-manager |
    | `plugin-sdk/memory-host-status` | นามแฝงความเข้ากันได้ที่เลิกแนะนำแล้ว; ใช้ `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="เส้นทางย่อยของตัวช่วยที่บันเดิลและสงวนไว้">
    เส้นทางย่อย SDK ของตัวช่วยที่บันเดิลและสงวนไว้เป็นพื้นผิวแบบแคบเฉพาะเจ้าของสำหรับ
    โค้ด Plugin ที่บันเดิลไว้ เส้นทางเหล่านี้ถูกติดตามใน inventory ของ SDK เพื่อให้การ build
    package และการทำ alias คงความกำหนดซ้ำได้ แต่ไม่ใช่ API สำหรับการเขียน Plugin
    ทั่วไป สัญญา host ใหม่ที่นำกลับมาใช้ซ้ำได้ควรใช้เส้นทางย่อย SDK ทั่วไป
    เช่น `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` และ
    `plugin-sdk/plugin-config-runtime`

    | เส้นทางย่อย | เจ้าของและวัตถุประสงค์ |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | ตัวช่วย Plugin Codex ที่บันเดิลไว้สำหรับฉาย config เซิร์ฟเวอร์ MCP ของผู้ใช้เข้าไปใน config thread ของ Codex app-server |
    | `plugin-sdk/codex-native-task-runtime` | ตัวช่วย Plugin Codex ที่บันเดิลไว้สำหรับสะท้อน subagent เนทีฟของ Codex app-server เข้าไปยังสถานะงานของ OpenClaw |

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
