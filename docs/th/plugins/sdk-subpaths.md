---
read_when:
    - การเลือกพาธย่อย plugin-sdk ที่เหมาะสมสำหรับการ import ของ Plugin
    - การตรวจสอบเส้นทางย่อยของ Plugin ที่บันเดิลมาและส่วนติดต่อของตัวช่วย
summary: 'แค็ตตาล็อกพาธย่อยของ Plugin SDK: การนำเข้าใดอยู่ที่ไหน จัดกลุ่มตามหมวดหมู่'
title: เส้นทางย่อยของ Plugin SDK
x-i18n:
    generated_at: "2026-07-04T11:08:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a77f70197aca279d44d2b9db62bf9f936594311bb46c3da682413c3fa1378e5
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK ถูกเปิดเผยเป็นชุดของ subpath สาธารณะแบบแคบภายใต้
`openclaw/plugin-sdk/` หน้านี้จัดทำบัญชี subpath ที่ใช้กันทั่วไปโดยจัดกลุ่มตาม
วัตถุประสงค์ รายการ entrypoint สำหรับคอมไพเลอร์ที่สร้างขึ้นอยู่ใน
`scripts/lib/plugin-sdk-entrypoints.json`; package exports เป็นชุดย่อยสาธารณะ
หลังหัก subpath สำหรับทดสอบ/ภายในเฉพาะ repo ที่ระบุไว้ใน
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` ผู้ดูแลสามารถตรวจนับ
public export ได้ด้วย `pnpm plugin-sdk:surface` และตรวจ subpath ตัวช่วยที่สงวนไว้และยังใช้งานอยู่ได้ด้วย
`pnpm plugins:boundary-report:summary`; helper exports ที่สงวนไว้แต่ไม่ได้ใช้งาน
จะทำให้รายงาน CI ล้มเหลว แทนที่จะค้างอยู่ใน SDK สาธารณะเป็นหนี้ความเข้ากันได้ที่หลับอยู่

สำหรับคู่มือการเขียน Plugin โปรดดู [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## จุดเข้า Plugin

| Subpath                        | exports หลัก                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | ตัวช่วยรายการ migration provider เช่น `createMigrationItem`, ค่าคงที่ของเหตุผล, ตัวทำเครื่องหมายสถานะรายการ, ตัวช่วย redaction และ `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | ตัวช่วย runtime migration เช่น `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` และ `writeMigrationReport`            |
| `plugin-sdk/health`            | การลงทะเบียน health-check ของ Doctor, การตรวจจับ, การซ่อมแซม, การเลือก, ระดับความรุนแรง และประเภท finding สำหรับผู้ใช้ health ที่มาพร้อมชุด                                               |

### ตัวช่วยความเข้ากันได้ที่เลิกใช้แล้วและตัวช่วยทดสอบ

subpath ที่เลิกใช้แล้วจะยังคงถูก export สำหรับ Plugin รุ่นเก่า แต่โค้ดใหม่ควรใช้
subpath SDK แบบเจาะจงด้านล่าง รายการที่ดูแลอยู่คือ
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI จะปฏิเสธการ import
สำหรับ production ที่มาพร้อมชุดจากรายการนี้ barrel แบบกว้าง เช่น `compat`, `config-types`,
`infra-runtime`, `text-runtime` และ `zod` มีไว้เพื่อความเข้ากันได้เท่านั้น ให้ import `zod`
โดยตรงจาก `zod`

subpath ตัวช่วยทดสอบที่รองรับด้วย Vitest ของ OpenClaw เป็นแบบเฉพาะ repo เท่านั้น และไม่ใช่
package exports อีกต่อไป: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` และ `testing`

### subpath ตัวช่วย Plugin ที่มาพร้อมชุดซึ่งสงวนไว้

subpath เหล่านี้เป็นพื้นผิวความเข้ากันได้ที่ Plugin เป็นเจ้าของสำหรับ Plugin ที่มาพร้อมชุด
ซึ่งเป็นเจ้าของ subpath นั้น ไม่ใช่ API ของ SDK ทั่วไป: `plugin-sdk/codex-mcp-projection` และ
`plugin-sdk/codex-native-task-runtime` การ import extension ข้ามเจ้าของถูกบล็อก
โดย guardrails ของสัญญา package

<AccordionGroup>
  <Accordion title="พาธย่อยของช่องทาง">
    | พาธย่อย | รายการ export หลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | การ export สคีมา Zod ของ `openclaw.json` ระดับรูท (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | ตัวช่วยตรวจสอบความถูกต้องของ JSON Schema แบบแคชสำหรับสคีมาที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | ตัวช่วยวิซาร์ดการตั้งค่าที่ใช้ร่วมกัน, ตัวแปลการตั้งค่า, พรอมป์ allowlist, ตัวสร้างสถานะการตั้งค่า |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | alias ความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | ตัวช่วย config หลายบัญชี/action-gate, ตัวช่วย fallback บัญชีเริ่มต้น |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ตัวช่วยทำให้ account-id เป็นมาตรฐาน |
    | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชี + default-fallback |
    | `plugin-sdk/account-helpers` | ตัวช่วย account-list/account-action แบบแคบ |
    | `plugin-sdk/access-groups` | ตัวช่วยแยกวิเคราะห์ allowlist ของ access-group และวินิจฉัยกลุ่มแบบปกปิดข้อมูล |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | facade ความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | primitive ของสคีมา config ช่องทางที่ใช้ร่วมกัน รวมถึงตัวสร้าง Zod และ JSON/TypeBox โดยตรง |
    | `plugin-sdk/bundled-channel-config-schema` | สคีมา config ช่องทาง OpenClaw ที่ bundled สำหรับ Plugin bundled ที่ดูแลอยู่เท่านั้น |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId` รหัสช่องทางแชต bundled/official แบบ canonical รวมถึงป้ายกำกับ/alias สำหรับ formatter สำหรับ Plugin ที่ต้องจำแนกข้อความที่มีคำนำหน้า envelope โดยไม่ต้อง hardcode ตารางของตัวเอง |
    | `plugin-sdk/channel-config-schema-legacy` | alias ความเข้ากันได้ที่เลิกใช้แล้วสำหรับสคีมา config ช่องทาง bundled-channel |
    | `plugin-sdk/telegram-command-config` | ตัวช่วยทำให้คำสั่งแบบกำหนดเองของ Telegram เป็นมาตรฐาน/ตรวจสอบความถูกต้อง พร้อม fallback ตามสัญญา bundled |
    | `plugin-sdk/command-gating` | ตัวช่วย gate การอนุญาตคำสั่งแบบแคบ |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | facade ความเข้ากันได้ของ ingress ช่องทางระดับต่ำที่เลิกใช้แล้ว เส้นทางรับใหม่ควรใช้ `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/channel-ingress-runtime` | ตัว resolve runtime ingress ช่องทางระดับสูงแบบทดลองและตัวสร้าง route fact สำหรับเส้นทางรับช่องทางที่ย้ายแล้ว ควรใช้สิ่งนี้แทนการประกอบ effective allowlist, command allowlist, และ projection แบบ legacy ในแต่ละ Plugin ดู [API ingress ช่องทาง](/th/plugins/sdk-channel-ingress) |
    | `plugin-sdk/channel-lifecycle` | facade ความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-outbound` | สัญญา lifecycle ของข้อความ รวมถึงตัวเลือก reply pipeline, receipt, live preview/streaming, ตัวช่วย lifecycle, identity ขาออก, การวางแผน payload, การส่งแบบ durable, และตัวช่วย context การส่งข้อความ ดู [API ขาออกของช่องทาง](/th/plugins/sdk-channel-outbound) |
    | `plugin-sdk/channel-message` | alias ความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `plugin-sdk/channel-outbound` รวมถึง facade reply-dispatch แบบ legacy |
    | `plugin-sdk/channel-message-runtime` | alias ความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `plugin-sdk/channel-outbound` รวมถึง facade reply-dispatch แบบ legacy |
    | `plugin-sdk/inbound-envelope` | ตัวช่วย route ขาเข้า + ตัวสร้าง envelope ที่ใช้ร่วมกัน |
    | `plugin-sdk/inbound-reply-dispatch` | facade ความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-inbound` สำหรับ runner ขาเข้าและ dispatch predicate และใช้ `plugin-sdk/channel-outbound` สำหรับตัวช่วยส่งข้อความ |
    | `plugin-sdk/messaging-targets` | alias การแยกวิเคราะห์เป้าหมายที่เลิกใช้แล้ว; ใช้ `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | ตัวช่วยโหลดสื่อขาออกและสถานะ hosted-media ที่ใช้ร่วมกัน |
    | `plugin-sdk/outbound-send-deps` | facade ความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/outbound-runtime` | facade ความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/poll-runtime` | ตัวช่วยทำให้ poll เป็นมาตรฐานแบบแคบ |
    | `plugin-sdk/thread-bindings-runtime` | lifecycle ของ thread-binding และตัวช่วย adapter |
    | `plugin-sdk/agent-media-payload` | ตัวสร้าง payload สื่อของ agent แบบ legacy |
    | `plugin-sdk/conversation-runtime` | ตัวช่วย binding ของ conversation/thread, pairing, และ configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วย snapshot ของ runtime config |
    | `plugin-sdk/runtime-group-policy` | ตัวช่วย resolve group-policy ของ runtime |
    | `plugin-sdk/channel-status` | ตัวช่วย snapshot/summary สถานะช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/channel-config-primitives` | primitive ของ channel config-schema แบบแคบ |
    | `plugin-sdk/channel-config-writes` | ตัวช่วยการอนุญาตเขียน config ช่องทาง |
    | `plugin-sdk/channel-plugin-common` | การ export prelude ของ Plugin ช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/allowlist-config-edit` | ตัวช่วยแก้ไข/อ่าน config allowlist |
    | `plugin-sdk/group-access` | ตัวช่วยตัดสินใจ group-access ที่ใช้ร่วมกัน |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | facade ความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-inbound` |
    | `plugin-sdk/direct-dm-guard-policy` | ตัวช่วยนโยบาย guard ก่อน crypto สำหรับ direct-DM แบบแคบ |
    | `plugin-sdk/discord` | facade ความเข้ากันได้ของ Discord ที่เลิกใช้แล้วสำหรับ `@openclaw/discord@2026.3.13` ที่เผยแพร่แล้วและความเข้ากันได้ของ owner ที่ติดตามอยู่; Plugin ใหม่ควรใช้พาธย่อยของ SDK ช่องทางแบบทั่วไป |
    | `plugin-sdk/telegram-account` | facade ความเข้ากันได้ของการ resolve บัญชี Telegram ที่เลิกใช้แล้วสำหรับความเข้ากันได้ของ owner ที่ติดตามอยู่; Plugin ใหม่ควรใช้ตัวช่วย runtime ที่ฉีดเข้ามาหรือพาธย่อยของ SDK ช่องทางแบบทั่วไป |
    | `plugin-sdk/zalouser` | facade ความเข้ากันได้ของ Zalo Personal ที่เลิกใช้แล้วสำหรับแพ็กเกจ Lark/Zalo ที่เผยแพร่แล้วซึ่งยัง import การอนุญาตคำสั่งผู้ส่ง; Plugin ใหม่ควรใช้ `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | การนำเสนอข้อความเชิงความหมาย, การส่งมอบ, และตัวช่วยตอบกลับแบบ interactive legacy ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | ตัวช่วยขาเข้าที่ใช้ร่วมกันสำหรับการจัดประเภท event, การสร้าง context, การจัดรูปแบบ, root, debounce, การจับคู่ mention, mention-policy, และการบันทึก log ขาเข้า |
    | `plugin-sdk/channel-inbound-debounce` | ตัวช่วย debounce ขาเข้าแบบแคบ |
    | `plugin-sdk/channel-mention-gating` | ตัวช่วย mention-policy, mention marker, และข้อความ mention แบบแคบ โดยไม่มีพื้นผิว runtime ขาเข้าที่กว้างกว่า |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | facade ความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-inbound` หรือ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-pairing-paths` | facade ความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-pairing` |
    | `plugin-sdk/channel-reply-options-runtime` | facade ความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-streaming` | facade ความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-send-result` | ประเภทผลลัพธ์การตอบกลับ |
    | `plugin-sdk/channel-actions` | ตัวช่วย message-action ของช่องทาง รวมถึงตัวช่วยสคีมา native ที่เลิกใช้แล้วซึ่งเก็บไว้เพื่อความเข้ากันได้ของ Plugin |
    | `plugin-sdk/channel-route` | ตัวช่วยทำให้ route เป็นมาตรฐานที่ใช้ร่วมกัน, การ resolve เป้าหมายที่ขับเคลื่อนด้วย parser, การแปลง thread-id เป็น string, คีย์ route สำหรับ dedupe/compact, ประเภท parsed-target, และตัวช่วยเปรียบเทียบ route/target |
    | `plugin-sdk/channel-targets` | ตัวช่วยแยกวิเคราะห์เป้าหมาย; caller ที่เปรียบเทียบ route ควรใช้ `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | ประเภทสัญญาของช่องทาง |
    | `plugin-sdk/channel-feedback` | การ wiring feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วย secret-contract แบบแคบ เช่น `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, และประเภทเป้าหมาย secret |
  </Accordion>

ตระกูลตัวช่วยช่องทางที่เลิกใช้แล้วยังคงมีให้ใช้เฉพาะเพื่อความเข้ากันได้กับ
Plugin ที่เผยแพร่แล้วเท่านั้น แผนการนำออกคือ: เก็บไว้ตลอดช่วงเวลาการย้าย
Plugin ภายนอก, ให้ Plugin ใน repo/bundled ใช้ `channel-inbound` และ
`channel-outbound`, จากนั้นนำพาธย่อยความเข้ากันได้ออกในการล้าง SDK ครั้งใหญ่ถัดไป
สิ่งนี้ใช้กับตระกูล channel message/runtime เดิม, channel
streaming, direct-DM access, ส่วนย่อยของตัวช่วยขาเข้า, reply-options,
และ pairing-path

  <Accordion title="Provider subpaths">
    | พาธย่อย | เอ็กซ์พอร์ตหลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | ฟาซาดผู้ให้บริการ LM Studio ที่รองรับสำหรับการตั้งค่า การค้นพบแค็ตตาล็อก และการเตรียมโมเดลรันไทม์ |
    | `plugin-sdk/lmstudio-runtime` | ฟาซาดรันไทม์ LM Studio ที่รองรับสำหรับค่าเริ่มต้นของเซิร์ฟเวอร์ภายในเครื่อง การค้นพบโมเดล ส่วนหัวคำขอ และตัวช่วยสำหรับโมเดลที่โหลดแล้ว |
    | `plugin-sdk/provider-setup` | ตัวช่วยการตั้งค่าผู้ให้บริการภายในเครื่อง/แบบโฮสต์เองที่คัดสรรแล้ว |
    | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยการตั้งค่าผู้ให้บริการแบบโฮสต์เองที่เข้ากันได้กับ OpenAI แบบเฉพาะจุด |
    | `plugin-sdk/cli-backend` | ค่าเริ่มต้นของแบ็กเอนด์ CLI + ค่าคงที่ watchdog |
    | `plugin-sdk/provider-auth-runtime` | ตัวช่วยการแก้ไขคีย์ API ขณะรันไทม์สำหรับ Plugin ผู้ให้บริการ |
    | `plugin-sdk/provider-oauth-runtime` | ชนิด callback ของ OAuth ผู้ให้บริการทั่วไป การเรนเดอร์หน้า callback ตัวช่วย PKCE/state การแยกวิเคราะห์อินพุตการอนุญาต ตัวช่วยการหมดอายุของโทเค็น และตัวช่วยการยกเลิก |
    | `plugin-sdk/provider-auth-api-key` | ตัวช่วย onboarding/การเขียนโปรไฟล์สำหรับคีย์ API เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
    | `plugin-sdk/provider-env-vars` | ตัวช่วยค้นหา env-var สำหรับการยืนยันตัวตนผู้ให้บริการ |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, ตัวช่วยนำเข้าการยืนยันตัวตน OpenAI Codex, เอ็กซ์พอร์ตความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้างนโยบาย replay ที่ใช้ร่วมกัน, ตัวช่วย endpoint ของผู้ให้บริการ และตัวช่วย normalization ของ model-id ที่ใช้ร่วมกัน |
    | `plugin-sdk/provider-catalog-live-runtime` | ตัวช่วยแค็ตตาล็อกโมเดลผู้ให้บริการแบบสดสำหรับการค้นพบสไตล์ `/models` ที่มีการป้องกัน: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, การกรอง model-id, แคช TTL และ fallback แบบสแตติก |
    | `plugin-sdk/provider-catalog-runtime` | hook รันไทม์การเสริมแค็ตตาล็อกผู้ให้บริการ และจุดเชื่อมต่อรีจิสทรี plugin-provider สำหรับการทดสอบสัญญา |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | ตัวช่วยความสามารถ HTTP/endpoint ของผู้ให้บริการทั่วไป ข้อผิดพลาด HTTP ของผู้ให้บริการ และตัวช่วยฟอร์ม multipart สำหรับการถอดเสียงเสียง |
    | `plugin-sdk/provider-web-fetch-contract` | ตัวช่วยสัญญา config/selection ของ web-fetch แบบแคบ เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | ตัวช่วยการลงทะเบียน/แคชผู้ให้บริการ web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วย config/credential ของ web-search แบบแคบสำหรับผู้ให้บริการที่ไม่ต้องการการเชื่อมต่อการเปิดใช้ Plugin |
    | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญา config/credential ของ web-search แบบแคบ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวอ่าน credential แบบมีขอบเขต |
    | `plugin-sdk/provider-web-search` | ตัวช่วยการลงทะเบียน/แคช/รันไทม์ผู้ให้บริการ web-search |
    | `plugin-sdk/embedding-providers` | ชนิดผู้ให้บริการ embedding ทั่วไปและตัวช่วยอ่าน รวมถึง `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` และ `listEmbeddingProviders(...)`; Plugin ลงทะเบียนผู้ให้บริการผ่าน `api.registerEmbeddingProvider(...)` เพื่อบังคับใช้ความเป็นเจ้าของ manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` และการล้าง schema + diagnostics ของ DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | ชนิด snapshot การใช้งานผู้ให้บริการ ตัวช่วย fetch การใช้งานที่ใช้ร่วมกัน และ fetcher ของผู้ให้บริการ เช่น `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ชนิด stream wrapper, ความเข้ากันได้ของ tool-call แบบข้อความล้วน และตัวช่วย wrapper ที่ใช้ร่วมกันของ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | ตัวช่วย stream wrapper ของผู้ให้บริการแบบใช้ร่วมกันสาธารณะ รวมถึง `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` และยูทิลิตี stream ที่เข้ากันได้กับ Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | ตัวช่วย transport ผู้ให้บริการแบบ native เช่น guarded fetch, การดึงข้อความผลลัพธ์เครื่องมือ, การแปลงข้อความ transport และ stream เหตุการณ์ transport ที่เขียนได้ |
    | `plugin-sdk/provider-onboard` | ตัวช่วยแพตช์ config สำหรับ onboarding |
    | `plugin-sdk/global-singleton` | ตัวช่วย singleton/map/cache ภายในกระบวนการ |
    | `plugin-sdk/group-activation` | ตัวช่วยโหมดการเปิดใช้กลุ่มแบบแคบและการแยกวิเคราะห์คำสั่ง |
  </Accordion>

snapshot การใช้งานผู้ให้บริการโดยทั่วไปจะรายงาน `windows` โควตาหนึ่งรายการหรือมากกว่า โดยแต่ละรายการมี
ป้ายกำกับ เปอร์เซ็นต์ที่ใช้แล้ว และเวลารีเซ็ตที่เป็นตัวเลือก ผู้ให้บริการที่เปิดเผยข้อความยอดคงเหลือหรือ
สถานะบัญชีแทนหน้าต่างโควตาที่รีเซ็ตได้ ควรคืนค่า
`summary` พร้อมอาร์เรย์ `windows` ว่าง แทนที่จะสร้างเปอร์เซ็นต์ขึ้นมาเอง
OpenClaw แสดงข้อความสรุปนั้นในเอาต์พุตสถานะ; ใช้ `error` เฉพาะเมื่อ
endpoint การใช้งานล้มเหลวหรือไม่ส่งคืนข้อมูลการใช้งานที่ใช้ได้

  <Accordion title="Auth and security subpaths">
    | พาธย่อย | เอ็กซ์พอร์ตหลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ตัวช่วยรีจิสทรีคำสั่ง รวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก, ตัวช่วยการอนุญาตผู้ส่ง |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความคำสั่ง/วิธีใช้ เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | ตัวช่วยการแก้ไขผู้อนุมัติและการยืนยันตัวตนการกระทำในแชตเดียวกัน |
    | `plugin-sdk/approval-client-runtime` | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติ exec แบบ native |
    | `plugin-sdk/approval-delivery-runtime` | อะแดปเตอร์ความสามารถ/การส่งมอบการอนุมัติแบบ native |
    | `plugin-sdk/approval-gateway-runtime` | ตัวช่วยการแก้ไข Gateway การอนุมัติที่ใช้ร่วมกัน |
    | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยโหลดอะแดปเตอร์การอนุมัติแบบ native ที่เบาสำหรับ entrypoint ช่องทางร้อน |
    | `plugin-sdk/approval-handler-runtime` | ตัวช่วยรันไทม์ handler การอนุมัติที่กว้างกว่า; ควรใช้จุดเชื่อมต่อ adapter/gateway ที่แคบกว่าเมื่อเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติแบบ native, การผูกบัญชี, route-gate, forwarding fallback และการระงับ prompt ของ local native exec |
    | `plugin-sdk/approval-reaction-runtime` | binding reaction การอนุมัติแบบฮาร์ดโค้ด, payload prompt ของ reaction, store เป้าหมาย reaction, ตัวช่วยข้อความ hint ของ reaction และเอ็กซ์พอร์ตความเข้ากันได้สำหรับการระงับ prompt ของ local native exec |
    | `plugin-sdk/approval-reply-runtime` | ตัวช่วย payload การตอบกลับการอนุมัติ exec/Plugin |
    | `plugin-sdk/approval-runtime` | ตัวช่วย payload การอนุมัติ exec/Plugin, ตัวช่วยการกำหนดเส้นทาง/รันไทม์การอนุมัติแบบ native และตัวช่วยการแสดงผลการอนุมัติแบบมีโครงสร้าง เช่น `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | ตัวช่วยรีเซ็ตการ dedupe การตอบกลับขาเข้าแบบแคบ |
    | `plugin-sdk/channel-contract-testing` | ตัวช่วยทดสอบสัญญาช่องทางแบบแคบโดยไม่มี barrel ทดสอบแบบกว้าง |
    | `plugin-sdk/command-auth-native` | การยืนยันตัวตนคำสั่งแบบ native, การจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก และตัวช่วยเป้าหมายเซสชันแบบ native |
    | `plugin-sdk/command-detection` | ตัวช่วยการตรวจจับคำสั่งที่ใช้ร่วมกัน |
    | `plugin-sdk/command-primitives-runtime` | predicate ข้อความคำสั่งที่เบาสำหรับพาธช่องทางร้อน |
    | `plugin-sdk/command-surface` | การ normalize body คำสั่งและตัวช่วย command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | ตัวช่วยโฟลว์เข้าสู่ระบบการยืนยันตัวตนผู้ให้บริการแบบ lazy สำหรับการจับคู่อุปกรณ์ด้วย code ในช่องทางส่วนตัวและ Web UI |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยรวบรวมสัญญา secret แบบแคบสำหรับพื้นผิว secret ของช่องทาง/Plugin |
    | `plugin-sdk/secret-ref-runtime` | ตัวช่วย typing ของ `coerceSecretRef` และ SecretRef แบบแคบสำหรับการแยกวิเคราะห์ secret-contract/config |
    | `plugin-sdk/secret-provider-integration` | สัญญา manifest และ preset การผสานรวมผู้ให้บริการ SecretRef แบบ type-only สำหรับ Plugin ที่เผยแพร่ preset ผู้ให้บริการ secret ภายนอก |
    | `plugin-sdk/security-runtime` | ตัวช่วย trust, การกั้น DM, ไฟล์/พาธที่จำกัดใน root ที่ใช้ร่วมกัน รวมถึงการเขียนแบบ create-only, การแทนที่ไฟล์ atomic แบบ sync/async, การเขียน temp แบบ sibling, fallback การย้ายข้ามอุปกรณ์, ตัวช่วย file-store ส่วนตัว, guard ของ symlink-parent, external-content, การ redact ข้อความอ่อนไหว, การเปรียบเทียบ secret แบบ constant-time และตัวช่วยการรวบรวม secret |
    | `plugin-sdk/ssrf-policy` | ตัวช่วยนโยบาย allowlist โฮสต์และ SSRF ของเครือข่ายส่วนตัว |
    | `plugin-sdk/ssrf-dispatcher` | ตัวช่วย pinned-dispatcher แบบแคบโดยไม่มีพื้นผิวรันไทม์ infra แบบกว้าง |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, fetch ที่ป้องกัน SSRF, ข้อผิดพลาด SSRF และตัวช่วยนโยบาย SSRF |
    | `plugin-sdk/secret-input` | ตัวช่วยแยกวิเคราะห์อินพุต secret |
    | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ/เป้าหมาย Webhook และการบังคับชนิด websocket/body แบบ raw |
    | `plugin-sdk/webhook-request-guards` | ตัวช่วยขนาด/timeout ของ body คำขอ |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | เส้นทางย่อย | เอ็กซ์พอร์ตหลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | ตัวช่วยรันไทม์/การบันทึก/การสำรองข้อมูล/การติดตั้ง Plugin แบบกว้าง |
    | `plugin-sdk/runtime-env` | ตัวช่วย env รันไทม์, logger, timeout, retry และ backoff แบบแคบ |
    | `plugin-sdk/browser-config` | ฟาซาดคอนฟิกเบราว์เซอร์ที่รองรับสำหรับโปรไฟล์/ค่าเริ่มต้นที่ทำให้เป็นมาตรฐานแล้ว, การแยกวิเคราะห์ URL ของ CDP และตัวช่วย auth สำหรับการควบคุมเบราว์เซอร์ |
    | `plugin-sdk/agent-harness-task-runtime` | ตัวช่วยวงจรชีวิตงานและการส่งมอบเมื่อเสร็จสิ้นทั่วไปสำหรับเอเจนต์ที่มี harness หนุนหลังซึ่งใช้ขอบเขตงานที่ host ออกให้ |
    | `plugin-sdk/codex-mcp-projection` | ตัวช่วย Codex แบบ bundled ที่สงวนไว้สำหรับฉายคอนฟิกเซิร์ฟเวอร์ MCP ของผู้ใช้เข้าไปในคอนฟิกเธรดของ Codex; ไม่ใช่สำหรับ Plugin ของบุคคลที่สาม |
    | `plugin-sdk/codex-native-task-runtime` | ตัวช่วย Codex แบบ bundled ส่วนตัวสำหรับการเดินสาย task mirror/รันไทม์แบบ native; ไม่ใช่สำหรับ Plugin ของบุคคลที่สาม |
    | `plugin-sdk/channel-runtime-context` | ตัวช่วยลงทะเบียนและค้นหา runtime-context ของช่องทางทั่วไป |
    | `plugin-sdk/matrix` | ฟาซาดความเข้ากันได้ของ Matrix ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางของบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควรอิมพอร์ต `plugin-sdk/run-command` โดยตรง |
    | `plugin-sdk/mattermost` | ฟาซาดความเข้ากันได้ของ Mattermost ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางของบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควรอิมพอร์ตเส้นทางย่อย SDK ทั่วไปโดยตรง |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | ตัวช่วยคำสั่ง/hook/http/interactive ของ Plugin ที่ใช้ร่วมกัน |
    | `plugin-sdk/hook-runtime` | ตัวช่วยไปป์ไลน์ Webhook/hook ภายในที่ใช้ร่วมกัน |
    | `plugin-sdk/lazy-runtime` | ตัวช่วยอิมพอร์ต/ผูกค่ารันไทม์แบบ lazy เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod` และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | ตัวช่วย exec ของ process |
    | `plugin-sdk/cli-runtime` | ตัวช่วยการจัดรูปแบบ CLI, การรอ, เวอร์ชัน, การเรียกด้วยอาร์กิวเมนต์ และกลุ่มคำสั่งแบบ lazy |
    | `plugin-sdk/qa-live-transport-scenarios` | ids สถานการณ์ QA ของ live transport ที่ใช้ร่วมกัน, ตัวช่วย baseline coverage และตัวช่วยเลือกสถานการณ์ |
    | `plugin-sdk/gateway-method-runtime` | ตัวช่วย dispatch เมธอด Gateway ที่สงวนไว้สำหรับ route HTTP ของ Plugin ที่ประกาศ `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | ไคลเอนต์ Gateway, ตัวช่วยเริ่มไคลเอนต์ที่พร้อม event loop, RPC ของ CLI สำหรับ gateway, ข้อผิดพลาดโปรโตคอล gateway, การระบุ host LAN ที่ประกาศ และตัวช่วยแพตช์สถานะช่องทาง |
    | `plugin-sdk/config-contracts` | พื้นผิวคอนฟิกแบบ type-only ที่เจาะจงสำหรับรูปทรงคอนฟิกของ Plugin เช่น `OpenClawConfig` และชนิดคอนฟิกช่องทาง/ผู้ให้บริการ |
    | `plugin-sdk/plugin-config-runtime` | ตัวช่วยค้นหาคอนฟิก Plugin ระหว่างรันไทม์ เช่น `requireRuntimeConfig`, `resolvePluginConfigObject` และ `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | ตัวช่วยแก้ไขคอนฟิกแบบ transactional เช่น `mutateConfigFile`, `replaceConfigFile` และ `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | สตริง hint เมตาดาต้าการส่งมอบ message-tool ที่ใช้ร่วมกัน |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วย snapshot คอนฟิก process ปัจจุบัน เช่น `getRuntimeConfig`, `getRuntimeConfigSnapshot` และ setter สำหรับ test snapshot |
    | `plugin-sdk/telegram-command-config` | การทำให้ชื่อคำสั่ง/คำอธิบายของ Telegram เป็นมาตรฐาน และการตรวจสอบรายการซ้ำ/ข้อขัดแย้ง แม้พื้นผิวสัญญา Telegram แบบ bundled จะไม่พร้อมใช้งาน |
    | `plugin-sdk/text-autolink-runtime` | การตรวจจับ autolink ของการอ้างอิงไฟล์โดยไม่ใช้ text barrel แบบกว้าง |
    | `plugin-sdk/approval-reaction-runtime` | binding ของ approval reaction ที่ฮาร์ดโค้ด, payload ของ prompt reaction, store ของเป้าหมาย reaction, ตัวช่วยข้อความ hint ของ reaction และเอ็กซ์พอร์ตความเข้ากันได้สำหรับการระงับ prompt exec native ภายในเครื่อง |
    | `plugin-sdk/approval-runtime` | ตัวช่วย approval สำหรับ exec/Plugin, builder ของ approval-capability, ตัวช่วย auth/profile, ตัวช่วย routing/รันไทม์แบบ native และการจัดรูปแบบเส้นทางแสดง approval แบบมีโครงสร้าง |
    | `plugin-sdk/reply-runtime` | ตัวช่วยรันไทม์ inbound/reply ที่ใช้ร่วมกัน, chunking, dispatch, Heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วย dispatch/finalize reply และ label การสนทนาแบบแคบ |
    | `plugin-sdk/reply-history` | ตัวช่วยประวัติ reply ช่วงสั้นที่ใช้ร่วมกัน โค้ด message-turn ใหม่ควรใช้ `createChannelHistoryWindow`; ตัวช่วย map ระดับต่ำกว่ายังคงเป็นเอ็กซ์พอร์ตความเข้ากันได้ที่เลิกใช้แล้วเท่านั้น |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ตัวช่วย chunking ข้อความ/markdown แบบแคบ |
    | `plugin-sdk/session-store-runtime` | ตัวช่วย workflow ของเซสชัน (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), การอ่านข้อความ transcript ผู้ใช้/ผู้ช่วยล่าสุดแบบมีขอบเขตตามอัตลักษณ์เซสชัน, ตัวช่วยเส้นทาง store เซสชันเดิม/session-key, การอ่าน updated-at และตัวช่วยความเข้ากันได้ทั้ง store/เส้นทางไฟล์เฉพาะช่วงเปลี่ยนผ่าน |
    | `plugin-sdk/session-transcript-runtime` | อัตลักษณ์ transcript, ตัวช่วย target/read/write แบบ scoped, การเผยแพร่การอัปเดต, write locks และ key สำหรับ transcript memory hit |
    | `plugin-sdk/sqlite-runtime` | ตัวช่วย schema, เส้นทาง และ transaction ของเอเจนต์ SQLite ที่เจาะจงสำหรับรันไทม์ first-party |
    | `plugin-sdk/cron-store-runtime` | ตัวช่วยเส้นทาง/load/save ของ Cron store |
    | `plugin-sdk/state-paths` | ตัวช่วยเส้นทางไดเรกทอรี State/OAuth |
    | `plugin-sdk/plugin-state-runtime` | ชนิด keyed-state ของ SQLite sidecar สำหรับ Plugin พร้อมการตั้งค่า pragma การเชื่อมต่อและการบำรุงรักษา WAL แบบรวมศูนย์สำหรับฐานข้อมูลที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/routing` | ตัวช่วย binding ของ route/session-key/account เช่น `resolveAgentRoute`, `buildAgentSessionKey` และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ตัวช่วยสรุปสถานะช่องทาง/account ที่ใช้ร่วมกัน, ค่าเริ่มต้น runtime-state และตัวช่วยเมตาดาต้าของ issue |
    | `plugin-sdk/target-resolver-runtime` | ตัวช่วย resolver เป้าหมายที่ใช้ร่วมกัน |
    | `plugin-sdk/string-normalization-runtime` | ตัวช่วยทำ slug/string ให้เป็นมาตรฐาน |
    | `plugin-sdk/request-url` | ดึง URL แบบสตริงจากอินพุตที่คล้าย fetch/request |
    | `plugin-sdk/run-command` | ตัวรันคำสั่งแบบจับเวลาพร้อมผลลัพธ์ stdout/stderr ที่ทำให้เป็นมาตรฐานแล้ว |
    | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ tool/CLI ทั่วไป |
    | `plugin-sdk/tool-plugin` | กำหนด Plugin agent-tool แบบ typed อย่างง่าย และเปิดเผยเมตาดาต้าแบบ static สำหรับการสร้าง manifest |
    | `plugin-sdk/tool-payload` | ดึง payload ที่ทำให้เป็นมาตรฐานแล้วจากออบเจ็กต์ผลลัพธ์ของ tool |
    | `plugin-sdk/tool-send` | ดึงฟิลด์เป้าหมายการส่งแบบ canonical จากอาร์กิวเมนต์ของ tool |
    | `plugin-sdk/sandbox` | ชนิด backend ของ sandbox และตัวช่วยคำสั่ง SSH/OpenShell รวมถึง preflight คำสั่ง exec แบบ fail-fast |
    | `plugin-sdk/temp-path` | ตัวช่วยเส้นทาง temp-download ที่ใช้ร่วมกันและพื้นที่ทำงาน temp ที่ปลอดภัยแบบส่วนตัว |
    | `plugin-sdk/logging-core` | ตัวช่วย logger และการปกปิดข้อมูลของ subsystem |
    | `plugin-sdk/markdown-table-runtime` | ตัวช่วยโหมดและการแปลงตาราง Markdown |
    | `plugin-sdk/model-session-runtime` | ตัวช่วย override model/เซสชัน เช่น `applyModelOverrideToSessionEntry` และ `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | ตัวช่วย resolve คอนฟิก talk provider |
    | `plugin-sdk/json-store` | ตัวช่วยอ่าน/เขียนสถานะ JSON ขนาดเล็ก |
    | `plugin-sdk/json-unsafe-integers` | ตัวช่วยแยกวิเคราะห์ JSON ที่เก็บ literal จำนวนเต็มที่ไม่ปลอดภัยเป็นสตริง |
    | `plugin-sdk/file-lock` | ตัวช่วย file-lock แบบ re-entrant |
    | `plugin-sdk/persistent-dedupe` | ตัวช่วย dedupe cache ที่มีดิสก์หนุนหลัง |
    | `plugin-sdk/acp-runtime` | ตัวช่วยรันไทม์/เซสชัน ACP และ reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | ตัวช่วยลงทะเบียน ACP backend และ reply-dispatch แบบ lightweight สำหรับ Plugin ที่โหลดตอนเริ่มต้น |
    | `plugin-sdk/acp-binding-resolve-runtime` | การ resolve binding ของ ACP แบบ read-only โดยไม่มีการอิมพอร์ต lifecycle startup |
    | `plugin-sdk/agent-config-primitives` | primitive schema คอนฟิกรันไทม์เอเจนต์แบบแคบ |
    | `plugin-sdk/boolean-param` | ตัวอ่านพารามิเตอร์ boolean แบบหลวม |
    | `plugin-sdk/dangerous-name-runtime` | ตัวช่วย resolve การจับคู่ชื่ออันตราย |
    | `plugin-sdk/device-bootstrap` | ตัวช่วย bootstrap อุปกรณ์และ pairing token |
    | `plugin-sdk/extension-shared` | primitive ตัวช่วย passive-channel, สถานะ และ ambient proxy ที่ใช้ร่วมกัน |
    | `plugin-sdk/models-provider-runtime` | ตัวช่วย reply ของคำสั่ง/ผู้ให้บริการ `/models` |
    | `plugin-sdk/skill-commands-runtime` | ตัวช่วยแสดงรายการคำสั่ง Skill |
    | `plugin-sdk/native-command-registry` | ตัวช่วย registry/build/serialize คำสั่ง native |
    | `plugin-sdk/agent-harness` | พื้นผิว trusted-plugin แบบทดลองสำหรับ agent harness ระดับต่ำ: ชนิด harness, ตัวช่วย steer/abort ของ active-run, ตัวช่วย bridge tool ของ OpenClaw, ตัวช่วยนโยบาย tool ของ runtime-plan, การจำแนก terminal outcome, ตัวช่วยจัดรูปแบบ/รายละเอียดความคืบหน้าของ tool และยูทิลิตี้ผลลัพธ์ของ attempt |
    | `plugin-sdk/provider-zai-endpoint` | ฟาซาดการตรวจจับ endpoint ที่ Z.AI provider เป็นเจ้าของซึ่งเลิกใช้แล้ว; ใช้ API สาธารณะของ Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | ตัวช่วย async lock ภายใน process สำหรับไฟล์สถานะรันไทม์ขนาดเล็ก |
    | `plugin-sdk/channel-activity-runtime` | ตัวช่วย telemetry กิจกรรมช่องทาง |
    | `plugin-sdk/concurrency-runtime` | ตัวช่วย concurrency ของงาน async แบบมีขอบเขต |
    | `plugin-sdk/dedupe-runtime` | ตัวช่วย dedupe cache แบบ in-memory และแบบมี persistent-backed |
    | `plugin-sdk/delivery-queue-runtime` | ตัวช่วย drain การส่งมอบ outbound ที่รอดำเนินการ |
    | `plugin-sdk/file-access-runtime` | ตัวช่วยเส้นทาง local-file และ media-source ที่ปลอดภัย |
    | `plugin-sdk/heartbeat-runtime` | ตัวช่วย wake, event และ visibility ของ Heartbeat |
    | `plugin-sdk/number-runtime` | ตัวช่วยบังคับแปลงเป็นตัวเลข |
    | `plugin-sdk/secure-random-runtime` | ตัวช่วย token/UUID ที่ปลอดภัย |
    | `plugin-sdk/system-event-runtime` | ตัวช่วยคิว event ระบบ |
    | `plugin-sdk/transport-ready-runtime` | ตัวช่วยรอความพร้อมของ transport |
    | `plugin-sdk/exec-approvals-runtime` | ตัวช่วยไฟล์นโยบาย exec approval โดยไม่มี infra-runtime barrel แบบกว้าง |
    | `plugin-sdk/infra-runtime` | shim ความเข้ากันได้ที่เลิกใช้แล้ว; ใช้เส้นทางย่อยรันไทม์ที่เจาะจงด้านบน |
    | `plugin-sdk/collection-runtime` | ตัวช่วย cache ขนาดเล็กแบบมีขอบเขต |
    | `plugin-sdk/diagnostic-runtime` | ตัวช่วย flag วินิจฉัย, event และ trace-context |
    | `plugin-sdk/error-runtime` | กราฟข้อผิดพลาด, การจัดรูปแบบ, ตัวช่วยจำแนกข้อผิดพลาดที่ใช้ร่วมกัน, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | wrapped fetch, proxy, ตัวเลือก EnvHttpProxyAgent และตัวช่วย lookup แบบ pinned |
    | `plugin-sdk/runtime-fetch` | fetch รันไทม์ที่รับรู้ dispatcher โดยไม่มีการอิมพอร์ต proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | ตัวช่วย sanitizer ของ URL ข้อมูลภาพ inline และ sniffing ลายเซ็น โดยไม่มีพื้นผิวรันไทม์ media แบบกว้าง |
    | `plugin-sdk/response-limit-runtime` | ตัวอ่าน response-body แบบมีขอบเขตโดยไม่มีพื้นผิวรันไทม์ media แบบกว้าง |
    | `plugin-sdk/session-binding-runtime` | สถานะ binding การสนทนาปัจจุบันโดยไม่มี routing ของ binding ที่กำหนดค่าไว้หรือ pairing stores |
    | `plugin-sdk/session-store-runtime` | ตัวช่วย session-store โดยไม่มีการอิมพอร์ตการเขียน/บำรุงรักษาคอนฟิกแบบกว้าง |
    | `plugin-sdk/sqlite-runtime` | ตัวช่วย schema, เส้นทาง และ transaction ของเอเจนต์ SQLite ที่เจาะจงโดยไม่มีการควบคุม lifecycle ของฐานข้อมูล |
    | `plugin-sdk/context-visibility-runtime` | การ resolve การมองเห็นบริบทและการกรองบริบทเสริมโดยไม่มีการอิมพอร์ตคอนฟิก/security แบบกว้าง |
    | `plugin-sdk/string-coerce-runtime` | ตัวช่วยบังคับแปลงและทำ primitive record/string ให้เป็นมาตรฐานแบบแคบ โดยไม่มีการอิมพอร์ต markdown/logging |
    | `plugin-sdk/host-runtime` | ตัวช่วยทำ hostname และ host ของ SCP ให้เป็นมาตรฐาน |
    | `plugin-sdk/retry-runtime` | ตัวช่วยคอนฟิก retry และตัวรัน retry |
    | `plugin-sdk/agent-runtime` | ตัวช่วยไดเรกทอรี/อัตลักษณ์/พื้นที่ทำงานของเอเจนต์ รวมถึง `resolveAgentDir`, `resolveDefaultAgentDir` และเอ็กซ์พอร์ตความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว |
    | `plugin-sdk/directory-runtime` | การ query/dedup ไดเรกทอรีที่มีคอนฟิกหนุนหลัง |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="เส้นทางย่อยสำหรับความสามารถและการทดสอบ">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | ตัวช่วยร่วมสำหรับดึง/แปลง/จัดเก็บสื่อ รวมถึง `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` และ `fetchRemoteMedia` ที่เลิกใช้แล้ว; ควรใช้ตัวช่วยจัดเก็บก่อนการอ่านบัฟเฟอร์เมื่อ URL ควรถูกแปลงเป็นสื่อของ OpenClaw |
    | `plugin-sdk/media-mime` | การทำให้ MIME เป็นมาตรฐานแบบจำกัด, การแมปนามสกุลไฟล์, การตรวจจับ MIME และตัวช่วยชนิดสื่อ |
    | `plugin-sdk/media-store` | ตัวช่วยจัดเก็บสื่อแบบจำกัด เช่น `saveMediaBuffer` และ `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | ตัวช่วยร่วมสำหรับการสลับไปใช้ตัวสำรองในการสร้างสื่อ, การเลือกตัวเลือกที่เป็นไปได้ และข้อความเมื่อไม่มีโมเดล |
    | `plugin-sdk/media-understanding` | ประเภทผู้ให้บริการสำหรับความเข้าใจสื่อ พร้อมการส่งออกตัวช่วยด้านรูปภาพ/เสียง/การสกัดข้อมูลแบบมีโครงสร้างสำหรับผู้ให้บริการ |
    | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งชิ้น/เรนเดอร์ข้อความและ markdown, การแปลงตาราง markdown, การลบแท็กคำสั่ง และยูทิลิตีข้อความที่ปลอดภัย |
    | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งชิ้นข้อความขาออก |
    | `plugin-sdk/speech` | ประเภทผู้ให้บริการเสียงพูด พร้อมการส่งออกตัวช่วยด้านคำสั่ง, รีจิสทรี, การตรวจสอบความถูกต้อง, ตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI และตัวช่วยเสียงพูดสำหรับผู้ให้บริการ |
    | `plugin-sdk/speech-core` | การส่งออกร่วมของประเภทผู้ให้บริการเสียงพูด, รีจิสทรี, คำสั่ง, การทำให้เป็นมาตรฐาน และตัวช่วยเสียงพูด |
    | `plugin-sdk/realtime-transcription` | ประเภทผู้ให้บริการถอดเสียงแบบเรียลไทม์, ตัวช่วยรีจิสทรี และตัวช่วยเซสชัน WebSocket ร่วม |
    | `plugin-sdk/realtime-bootstrap-context` | ตัวช่วยบูตสแตรปโปรไฟล์แบบเรียลไทม์สำหรับการฉีดบริบท `IDENTITY.md`, `USER.md` และ `SOUL.md` แบบมีขอบเขต |
    | `plugin-sdk/realtime-voice` | ประเภทผู้ให้บริการเสียงแบบเรียลไทม์, ตัวช่วยรีจิสทรี และตัวช่วยพฤติกรรมเสียงแบบเรียลไทม์ร่วม รวมถึงการติดตามกิจกรรมเอาต์พุต |
    | `plugin-sdk/image-generation` | ประเภทผู้ให้บริการสร้างรูปภาพ พร้อมตัวช่วย URL สำหรับแอสเซตรูปภาพ/ข้อมูล และตัวสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
    | `plugin-sdk/image-generation-core` | ประเภทร่วมสำหรับการสร้างรูปภาพ, การสลับไปใช้ตัวสำรอง, การยืนยันตัวตน และตัวช่วยรีจิสทรี |
    | `plugin-sdk/music-generation` | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างเพลง |
    | `plugin-sdk/music-generation-core` | ประเภทร่วมสำหรับการสร้างเพลง, ตัวช่วยการสลับไปใช้ตัวสำรอง, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์การอ้างอิงโมเดล |
    | `plugin-sdk/video-generation` | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างวิดีโอ |
    | `plugin-sdk/video-generation-core` | ประเภทร่วมสำหรับการสร้างวิดีโอ, ตัวช่วยการสลับไปใช้ตัวสำรอง, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์การอ้างอิงโมเดล |
    | `plugin-sdk/transcripts` | ประเภทผู้ให้บริการแหล่งที่มาทรานสคริปต์ร่วม, ตัวช่วยรีจิสทรี, ตัวอธิบายเซสชัน และเมตาดาต้าถ้อยคำ |
    | `plugin-sdk/webhook-targets` | รีจิสทรีเป้าหมาย Webhook และตัวช่วยติดตั้งเส้นทาง |
    | `plugin-sdk/webhook-path` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | ตัวช่วยร่วมสำหรับโหลดสื่อระยะไกล/ในเครื่อง |
    | `plugin-sdk/zod` | การส่งออกซ้ำเพื่อความเข้ากันได้ที่เลิกใช้แล้ว; นำเข้า `zod` จาก `zod` โดยตรง |
    | `plugin-sdk/testing` | จุดรวมการส่งออกความเข้ากันได้ที่เลิกใช้แล้วภายในรีโพสำหรับการทดสอบ OpenClaw แบบเดิม การทดสอบใหม่ในรีโพควรนำเข้าเส้นทางย่อยการทดสอบในเครื่องที่เจาะจงแทน เช่น `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` หรือ `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | ตัวช่วย `createTestPluginApi` ขั้นต่ำภายในรีโพสำหรับการทดสอบหน่วยของการลงทะเบียน Plugin โดยตรงโดยไม่ต้องนำเข้าบริดจ์ตัวช่วยทดสอบของรีโพ |
    | `plugin-sdk/agent-runtime-test-contracts` | ฟิกซ์เจอร์สัญญาอะแดปเตอร์รันไทม์เอเจนต์เนทีฟภายในรีโพสำหรับการทดสอบการยืนยันตัวตน, การส่งมอบ, การสำรอง, ฮุกเครื่องมือ, โอเวอร์เลย์พรอมป์, สคีมา และการฉายทรานสคริปต์ |
    | `plugin-sdk/channel-test-helpers` | ตัวช่วยทดสอบที่มุ่งเน้นช่องทางภายในรีโพสำหรับสัญญาการกระทำ/การตั้งค่า/สถานะทั่วไป, การยืนยันไดเรกทอรี, วงจรชีวิตการเริ่มต้นบัญชี, เธรดดิ้งคอนฟิกการส่ง, ม็อกรันไทม์, ปัญหาสถานะ, การส่งมอบขาออก และการลงทะเบียนฮุก |
    | `plugin-sdk/channel-target-testing` | ชุดกรณีข้อผิดพลาดการแปลงเป้าหมายร่วมภายในรีโพสำหรับการทดสอบช่องทาง |
    | `plugin-sdk/plugin-test-contracts` | ตัวช่วยสัญญาภายในรีโพสำหรับแพ็กเกจ Plugin, การลงทะเบียน, อาร์ติแฟกต์สาธารณะ, การนำเข้าโดยตรง, API รันไทม์ และผลข้างเคียงจากการนำเข้า |
    | `plugin-sdk/provider-test-contracts` | ตัวช่วยสัญญาภายในรีโพสำหรับรันไทม์ผู้ให้บริการ, การยืนยันตัวตน, การค้นพบ, ออนบอร์ด, แคตตาล็อก, วิซาร์ด, ความสามารถด้านสื่อ, นโยบายเล่นซ้ำ, เสียงสด STT แบบเรียลไทม์, การค้นหา/ดึงข้อมูลเว็บ และสตรีม |
    | `plugin-sdk/provider-http-test-mocks` | ม็อก HTTP/การยืนยันตัวตนของ Vitest แบบเลือกใช้ภายในรีโพสำหรับการทดสอบผู้ให้บริการที่ใช้ `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | ฟิกซ์เจอร์ทั่วไปภายในรีโพสำหรับการจับรันไทม์ CLI, บริบทแซนด์บ็อกซ์, ตัวเขียน skill, ข้อความเอเจนต์, เหตุการณ์ระบบ, การโหลดโมดูลใหม่, เส้นทาง Plugin ที่บันเดิลมา, ข้อความเทอร์มินัล, การแบ่งชิ้น, โทเค็นการยืนยันตัวตน และเคสแบบมีชนิด |
    | `plugin-sdk/test-node-mocks` | ตัวช่วยม็อกบิวต์อิน Node แบบเจาะจงภายในรีโพสำหรับใช้ภายในแฟกทอรี `vi.mock("node:*")` ของ Vitest |
  </Accordion>

  <Accordion title="เส้นทางย่อยหน่วยความจำ">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/memory-core` | พื้นผิวตัวช่วย memory-core ที่บันเดิลมาสำหรับตัวช่วยตัวจัดการ/คอนฟิก/ไฟล์/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | ฟาซาดรันไทม์ดัชนี/การค้นหาหน่วยความจำ |
    | `plugin-sdk/memory-core-host-embedding-registry` | ตัวช่วยรีจิสทรีผู้ให้บริการ embedding หน่วยความจำขนาดเบา |
    | `plugin-sdk/memory-core-host-engine-foundation` | การส่งออกเอนจิน foundation ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | สัญญา embedding ของโฮสต์หน่วยความจำ, การเข้าถึงรีจิสทรี, ผู้ให้บริการในเครื่อง และตัวช่วยแบตช์/ระยะไกลทั่วไป `registerMemoryEmbeddingProvider` บนพื้นผิวนี้เลิกใช้แล้ว; ใช้ API ผู้ให้บริการ embedding ทั่วไปสำหรับผู้ให้บริการใหม่ |
    | `plugin-sdk/memory-core-host-engine-qmd` | การส่งออกเอนจิน QMD ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-storage` | การส่งออกเอนจินจัดเก็บของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วยมัลติโหมดของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-query` | ตัวช่วยคิวรีของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-secret` | ตัวช่วยความลับของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-events` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | ตัวช่วยสถานะของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-cli` | ตัวช่วยรันไทม์ CLI ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-core` | ตัวช่วยรันไทม์แกนหลักของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-core` | นามแฝงที่เป็นกลางต่อผู้ขายสำหรับตัวช่วยรันไทม์แกนหลักของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-events` | นามแฝงที่เป็นกลางต่อผู้ขายสำหรับตัวช่วยบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-files` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | ตัวช่วย managed-markdown ร่วมสำหรับ Plugin ที่อยู่ใกล้กับหน่วยความจำ |
    | `plugin-sdk/memory-host-search` | ฟาซาดรันไทม์ Active Memory สำหรับการเข้าถึงตัวจัดการการค้นหา |
    | `plugin-sdk/memory-host-status` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="เส้นทางย่อยตัวช่วยที่บันเดิลมาและสงวนไว้">
    เส้นทางย่อย SDK สำหรับตัวช่วยที่บันเดิลมาและสงวนไว้เป็นพื้นผิวเฉพาะเจ้าของแบบจำกัดสำหรับ
    โค้ด Plugin ที่บันเดิลมา เส้นทางเหล่านี้ถูกติดตามในรายการสินค้าคงคลังของ SDK เพื่อให้การสร้าง
    แพ็กเกจและการตั้งนามแฝงยังคงกำหนดได้แน่นอน แต่ไม่ใช่ API สำหรับการเขียน Plugin
    ทั่วไป สัญญาโฮสต์ที่นำกลับมาใช้ใหม่ได้ควรใช้เส้นทางย่อย SDK ทั่วไป
    เช่น `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` และ
    `plugin-sdk/plugin-config-runtime`

    | เส้นทางย่อย | เจ้าของและวัตถุประสงค์ |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | ตัวช่วย Plugin Codex ที่บันเดิลมาสำหรับฉายคอนฟิกเซิร์ฟเวอร์ MCP ของผู้ใช้เข้าสู่คอนฟิกเธรด app-server ของ Codex |
    | `plugin-sdk/codex-native-task-runtime` | ตัวช่วย Plugin Codex ที่บันเดิลมาสำหรับมิเรอร์ซับเอเจนต์เนทีฟ app-server ของ Codex เข้าสู่สถานะงานของ OpenClaw |

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
