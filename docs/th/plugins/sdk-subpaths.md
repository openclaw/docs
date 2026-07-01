---
read_when:
    - การเลือกเส้นทางย่อยของ plugin-sdk ที่เหมาะสมสำหรับการนำเข้า Plugin
    - ตรวจสอบซับพาธของ Plugin ที่บันเดิลมาและพื้นผิวของตัวช่วย
summary: 'แค็ตตาล็อกพาธย่อยของ Plugin SDK: import ใดอยู่ที่ไหน โดยจัดกลุ่มตามพื้นที่'
title: เส้นทางย่อยของ Plugin SDK
x-i18n:
    generated_at: "2026-07-01T20:40:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d67ec0c9d837fa23a80abe46e5bab981e82e6c7a29cfbf84ff47a9eca5cc582f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK ถูกเปิดเผยเป็นชุดของ subpath สาธารณะแบบแคบภายใต้
`openclaw/plugin-sdk/` หน้านี้จัดทำรายการ subpath ที่ใช้กันทั่วไปโดยจัดกลุ่มตาม
วัตถุประสงค์ inventory entrypoint ของ compiler ที่สร้างขึ้นอยู่ใน
`scripts/lib/plugin-sdk-entrypoints.json`; package exports คือชุดย่อยสาธารณะ
หลังจากหัก subpath สำหรับ test/internal ภายใน repo ที่ระบุไว้ใน
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` ผู้ดูแลสามารถ audit
จำนวน public export ได้ด้วย `pnpm plugin-sdk:surface` และ subpath helper ที่สงวนไว้และยังใช้งานอยู่
ด้วย `pnpm plugins:boundary-report:summary`; helper export ที่สงวนไว้แต่ไม่ได้ใช้จะทำให้รายงาน CI ล้มเหลว
แทนที่จะค้างอยู่ใน SDK สาธารณะในฐานะหนี้ compatibility ที่ไม่ทำงาน

สำหรับคู่มือการเขียน Plugin โปรดดู [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## รายการ Plugin

| Subpath                        | export หลัก                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | helper รายการ migration provider เช่น `createMigrationItem`, ค่าคงที่ reason, marker สถานะรายการ, helper สำหรับ redaction และ `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | helper สำหรับ runtime migration เช่น `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` และ `writeMigrationReport`                                              |
| `plugin-sdk/health`            | การลงทะเบียน health-check ของ Doctor, detection, repair, selection, severity และชนิด finding สำหรับ bundled health consumer                                               |

### helper สำหรับ compatibility ที่เลิกใช้แล้วและ test

subpath ที่เลิกใช้แล้วยังคงถูก export สำหรับ Plugin รุ่นเก่า แต่โค้ดใหม่ควรใช้
subpath ของ SDK แบบเจาะจงด้านล่าง รายการที่ดูแลอยู่คือ
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI ปฏิเสธ bundled
production import จากรายการนี้ barrel แบบกว้าง เช่น `compat`, `config-types`,
`infra-runtime`, `text-runtime` และ `zod` มีไว้สำหรับ compatibility เท่านั้น ให้ import `zod`
โดยตรงจาก `zod`

subpath test-helper ที่รองรับด้วย Vitest ของ OpenClaw เป็นแบบ repo-local เท่านั้น และไม่ใช่
package export อีกต่อไป: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` และ `testing`

### subpath helper ของ bundled Plugin ที่สงวนไว้

subpath เหล่านี้เป็นพื้นผิว compatibility ที่ Plugin เป็นเจ้าของสำหรับ bundled
Plugin เจ้าของ ไม่ใช่ API ของ SDK ทั่วไป: `plugin-sdk/codex-mcp-projection` และ
`plugin-sdk/codex-native-task-runtime` การ import extension ข้ามเจ้าของถูกบล็อก
ด้วย guardrail ของ package contract

<AccordionGroup>
  <Accordion title="พาธย่อยของช่องทาง">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | การส่งออกสคีมา Zod ของ `openclaw.json` ราก (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | ตัวช่วยตรวจสอบ JSON Schema แบบแคชสำหรับสคีมาที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | ตัวช่วยวิซาร์ดการตั้งค่าที่ใช้ร่วมกัน, ตัวแปลการตั้งค่า, พรอมต์รายการอนุญาต, ตัวสร้างสถานะการตั้งค่า |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | ตัวช่วยการกำหนดค่า/เกตการดำเนินการแบบหลายบัญชี, ตัวช่วยสำรองไปยังบัญชีเริ่มต้น |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ตัวช่วยทำให้รหัสบัญชีเป็นมาตรฐาน |
    | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชี + สำรองไปยังค่าเริ่มต้น |
    | `plugin-sdk/account-helpers` | ตัวช่วยรายการบัญชี/การดำเนินการบัญชีแบบแคบ |
    | `plugin-sdk/access-groups` | ตัวช่วยแยกวิเคราะห์รายการอนุญาตของกลุ่มการเข้าถึงและวินิจฉัยกลุ่มแบบปกปิดข้อมูล |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | พื้นฐานสคีมาการกำหนดค่าช่องทางที่ใช้ร่วมกัน รวมถึงตัวสร้าง Zod และ JSON/TypeBox โดยตรง |
    | `plugin-sdk/bundled-channel-config-schema` | สคีมาการกำหนดค่าช่องทาง OpenClaw แบบบันเดิลสำหรับ Plugin แบบบันเดิลที่ดูแลอยู่เท่านั้น |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. รหัสช่องทางแชทแบบบันเดิล/ทางการที่เป็นมาตรฐาน รวมถึงป้ายตัวจัดรูปแบบ/นามแฝงสำหรับ Plugin ที่ต้องจดจำข้อความที่มีคำนำหน้าเอนเวโลปโดยไม่ต้องฮาร์ดโค้ดตารางของตัวเอง |
    | `plugin-sdk/channel-config-schema-legacy` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้วสำหรับสคีมาการกำหนดค่าช่องทางแบบบันเดิล |
    | `plugin-sdk/telegram-command-config` | ตัวช่วยทำให้คำสั่งกำหนดเองของ Telegram เป็นมาตรฐาน/ตรวจสอบความถูกต้อง พร้อมตัวสำรองตามสัญญาแบบบันเดิล |
    | `plugin-sdk/command-gating` | ตัวช่วยเกตการอนุญาตคำสั่งแบบแคบ |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | ฟาซาดความเข้ากันได้ของทางเข้าช่องทางระดับต่ำที่เลิกใช้แล้ว พาธรับใหม่ควรใช้ `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/channel-ingress-runtime` | ตัวแก้ไขรันไทม์ทางเข้าช่องทางระดับสูงเชิงทดลองและตัวสร้างข้อเท็จจริงเส้นทางสำหรับพาธรับของช่องทางที่ย้ายแล้ว ควรใช้สิ่งนี้แทนการประกอบรายการอนุญาตที่มีผล, รายการอนุญาตคำสั่ง, และโปรเจกชันแบบดั้งเดิมในแต่ละ Plugin ดู [API ทางเข้าช่องทาง](/th/plugins/sdk-channel-ingress) |
    | `plugin-sdk/channel-lifecycle` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-outbound` | สัญญาวงจรชีวิตข้อความ รวมถึงตัวเลือกไปป์ไลน์ตอบกลับ, ใบรับ, ตัวอย่างสด/สตรีมมิง, ตัวช่วยวงจรชีวิต, อัตลักษณ์ขาออก, การวางแผนเพย์โหลด, การส่งแบบทนทาน, และตัวช่วยบริบทการส่งข้อความ ดู [API ช่องทางขาออก](/th/plugins/sdk-channel-outbound) |
    | `plugin-sdk/channel-message` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `plugin-sdk/channel-outbound` รวมถึงฟาซาดการกระจายการตอบกลับแบบดั้งเดิม |
    | `plugin-sdk/channel-message-runtime` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `plugin-sdk/channel-outbound` รวมถึงฟาซาดการกระจายการตอบกลับแบบดั้งเดิม |
    | `plugin-sdk/inbound-envelope` | ตัวช่วยเส้นทางขาเข้า + ตัวสร้างเอนเวโลปที่ใช้ร่วมกัน |
    | `plugin-sdk/inbound-reply-dispatch` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-inbound` สำหรับตัวรันขาเข้าและเพรดิเคตการกระจาย และใช้ `plugin-sdk/channel-outbound` สำหรับตัวช่วยส่งข้อความ |
    | `plugin-sdk/messaging-targets` | นามแฝงการแยกวิเคราะห์เป้าหมายที่เลิกใช้แล้ว; ใช้ `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | ตัวช่วยโหลดสื่อขาออกและสถานะสื่อที่โฮสต์ที่ใช้ร่วมกัน |
    | `plugin-sdk/outbound-send-deps` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/outbound-runtime` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/poll-runtime` | ตัวช่วยทำให้โพลเป็นมาตรฐานแบบแคบ |
    | `plugin-sdk/thread-bindings-runtime` | ตัวช่วยวงจรชีวิตการผูกเธรดและอะแดปเตอร์ |
    | `plugin-sdk/agent-media-payload` | ตัวสร้างเพย์โหลดสื่อของเอเจนต์แบบดั้งเดิม |
    | `plugin-sdk/conversation-runtime` | ตัวช่วยการผูกบทสนทนา/เธรด, การจับคู่, และการผูกที่กำหนดค่าไว้ |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วยสแนปช็อตการกำหนดค่ารันไทม์ |
    | `plugin-sdk/runtime-group-policy` | ตัวช่วยแก้ไขนโยบายกลุ่มของรันไทม์ |
    | `plugin-sdk/channel-status` | ตัวช่วยสแนปช็อต/สรุปสถานะช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/channel-config-primitives` | พื้นฐานสคีมาการกำหนดค่าช่องทางแบบแคบ |
    | `plugin-sdk/channel-config-writes` | ตัวช่วยการอนุญาตเขียนการกำหนดค่าช่องทาง |
    | `plugin-sdk/channel-plugin-common` | การส่งออกพรีลูด Plugin ช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/allowlist-config-edit` | ตัวช่วยแก้ไข/อ่านการกำหนดค่ารายการอนุญาต |
    | `plugin-sdk/group-access` | ตัวช่วยตัดสินใจการเข้าถึงกลุ่มที่ใช้ร่วมกัน |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-inbound` |
    | `plugin-sdk/direct-dm-guard-policy` | ตัวช่วยนโยบายการ์ด direct-DM ก่อนการเข้ารหัสแบบแคบ |
    | `plugin-sdk/discord` | ฟาซาดความเข้ากันได้ของ Discord ที่เลิกใช้แล้วสำหรับ `@openclaw/discord@2026.3.13` ที่เผยแพร่แล้วและความเข้ากันได้ของเจ้าของที่ติดตามอยู่; Plugin ใหม่ควรใช้พาธย่อย SDK ช่องทางแบบทั่วไป |
    | `plugin-sdk/telegram-account` | ฟาซาดความเข้ากันได้ของการแก้ไขบัญชี Telegram ที่เลิกใช้แล้วสำหรับความเข้ากันได้ของเจ้าของที่ติดตามอยู่; Plugin ใหม่ควรใช้ตัวช่วยรันไทม์ที่ฉีดเข้ามาหรือพาธย่อย SDK ช่องทางแบบทั่วไป |
    | `plugin-sdk/zalouser` | ฟาซาดความเข้ากันได้ของ Zalo Personal ที่เลิกใช้แล้วสำหรับแพ็กเกจ Lark/Zalo ที่เผยแพร่แล้วซึ่งยังนำเข้าการอนุญาตคำสั่งผู้ส่ง; Plugin ใหม่ควรใช้ `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | การนำเสนอข้อความเชิงความหมาย, การส่งมอบ, และตัวช่วยตอบกลับแบบโต้ตอบดั้งเดิม ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | ตัวช่วยขาเข้าที่ใช้ร่วมกันสำหรับการจำแนกเหตุการณ์, การสร้างบริบท, การจัดรูปแบบ, ราก, debounce, การจับคู่การกล่าวถึง, นโยบายการกล่าวถึง, และการบันทึกขาเข้า |
    | `plugin-sdk/channel-inbound-debounce` | ตัวช่วย debounce ขาเข้าแบบแคบ |
    | `plugin-sdk/channel-mention-gating` | ตัวช่วยนโยบายการกล่าวถึง, เครื่องหมายการกล่าวถึง, และข้อความการกล่าวถึงแบบแคบ โดยไม่มีพื้นผิวรันไทม์ขาเข้าที่กว้างกว่า |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-inbound` หรือ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-pairing-paths` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-pairing` |
    | `plugin-sdk/channel-reply-options-runtime` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-streaming` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-send-result` | ประเภทผลลัพธ์การตอบกลับ |
    | `plugin-sdk/channel-actions` | ตัวช่วยการดำเนินการกับข้อความช่องทาง รวมถึงตัวช่วยสคีมาเนทีฟที่เลิกใช้แล้วแต่เก็บไว้เพื่อความเข้ากันได้ของ Plugin |
    | `plugin-sdk/channel-route` | การทำให้เส้นทางเป็นมาตรฐานที่ใช้ร่วมกัน, การแก้ไขเป้าหมายที่ขับเคลื่อนด้วยพาร์เซอร์, การแปลงรหัสเธรดเป็นสตริง, คีย์เส้นทางสำหรับ dedupe/compact, ประเภทเป้าหมายที่แยกวิเคราะห์แล้ว, และตัวช่วยเปรียบเทียบเส้นทาง/เป้าหมาย |
    | `plugin-sdk/channel-targets` | ตัวช่วยแยกวิเคราะห์เป้าหมาย; ผู้เรียกการเปรียบเทียบเส้นทางควรใช้ `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | ประเภทสัญญาช่องทาง |
    | `plugin-sdk/channel-feedback` | การเชื่อมต่อฟีดแบ็ก/รีแอ็กชัน |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยสัญญาความลับแบบแคบ เช่น `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, และประเภทเป้าหมายความลับ |
  </Accordion>

ตระกูลตัวช่วยช่องทางที่เลิกใช้แล้วจะยังคงพร้อมใช้งานเฉพาะเพื่อความเข้ากันได้ของ Plugin ที่เผยแพร่แล้วเท่านั้น แผนการลบคือ: เก็บไว้ตลอดช่วงเวลาการย้าย Plugin ภายนอก, ให้ Plugin ใน repo/แบบบันเดิลอยู่บน `channel-inbound` และ `channel-outbound`, จากนั้นลบพาธย่อยความเข้ากันได้ในการล้าง SDK ครั้งใหญ่ครั้งถัดไป สิ่งนี้ใช้กับตระกูลข้อความ/รันไทม์ช่องทางแบบเก่า, การสตรีมช่องทาง, การเข้าถึง direct-DM, ส่วนย่อยตัวช่วยขาเข้า, ตัวเลือกการตอบกลับ, และพาธการจับคู่

  <Accordion title="Provider subpaths">
    | เส้นทางย่อย | เอ็กซ์พอร์ตหลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | facade ของผู้ให้บริการ LM Studio ที่รองรับสำหรับการตั้งค่า การค้นพบแค็ตตาล็อก และการเตรียมโมเดลขณะรันไทม์ |
    | `plugin-sdk/lmstudio-runtime` | facade รันไทม์ LM Studio ที่รองรับสำหรับค่าเริ่มต้นของเซิร์ฟเวอร์ในเครื่อง การค้นพบโมเดล ส่วนหัวคำขอ และตัวช่วยสำหรับโมเดลที่โหลดแล้ว |
    | `plugin-sdk/provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการในเครื่อง/โฮสต์เองที่คัดสรรแล้ว |
    | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการแบบโฮสต์เองที่เข้ากันได้กับ OpenAI แบบเฉพาะเจาะจง |
    | `plugin-sdk/cli-backend` | ค่าเริ่มต้นของแบ็กเอนด์ CLI + ค่าคงที่ watchdog |
    | `plugin-sdk/provider-auth-runtime` | ตัวช่วยแก้ค่า API key ขณะรันไทม์สำหรับ Plugin ผู้ให้บริการ |
    | `plugin-sdk/provider-oauth-runtime` | ประเภท callback OAuth ของผู้ให้บริการทั่วไป การเรนเดอร์หน้า callback ตัวช่วย PKCE/state การแยกวิเคราะห์ authorization-input ตัวช่วยการหมดอายุของ token และตัวช่วย abort |
    | `plugin-sdk/provider-auth-api-key` | ตัวช่วย onboarding/เขียนโปรไฟล์สำหรับ API key เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
    | `plugin-sdk/provider-env-vars` | ตัวช่วยค้นหา env var สำหรับการยืนยันตัวตนของผู้ให้บริการ |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, ตัวช่วยนำเข้าการยืนยันตัวตน OpenAI Codex, เอ็กซ์พอร์ตความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้าง replay-policy ที่ใช้ร่วมกัน, ตัวช่วย provider-endpoint และตัวช่วยทำให้ model-id เป็นมาตรฐานที่ใช้ร่วมกัน |
    | `plugin-sdk/provider-catalog-live-runtime` | ตัวช่วยแค็ตตาล็อกโมเดลผู้ให้บริการแบบ live สำหรับการค้นพบแบบ `/models` ที่มีการป้องกัน: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, การกรอง model-id, แคช TTL และ fallback แบบคงที่ |
    | `plugin-sdk/provider-catalog-runtime` | hook รันไทม์สำหรับเพิ่มข้อมูลแค็ตตาล็อกผู้ให้บริการ และ seam ของรีจิสทรี plugin-provider สำหรับการทดสอบสัญญา |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | ตัวช่วยความสามารถ HTTP/endpoint ของผู้ให้บริการทั่วไป, ข้อผิดพลาด HTTP ของผู้ให้บริการ และตัวช่วยฟอร์ม multipart สำหรับการถอดเสียงเสียง |
    | `plugin-sdk/provider-web-fetch-contract` | ตัวช่วยสัญญา config/selection ของ web-fetch แบบแคบ เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | ตัวช่วยลงทะเบียน/แคชผู้ให้บริการ web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วย config/credential ของ web-search แบบแคบสำหรับผู้ให้บริการที่ไม่ต้องมีการเชื่อม enable plugin |
    | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญา config/credential ของ web-search แบบแคบ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวอ่าน credential แบบมีขอบเขต |
    | `plugin-sdk/provider-web-search` | ตัวช่วยลงทะเบียน/แคช/รันไทม์ผู้ให้บริการ web-search |
    | `plugin-sdk/embedding-providers` | ประเภทผู้ให้บริการ embedding ทั่วไปและตัวช่วยอ่าน รวมถึง `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` และ `listEmbeddingProviders(...)`; plugins ลงทะเบียนผู้ให้บริการผ่าน `api.registerEmbeddingProvider(...)` เพื่อบังคับใช้ความเป็นเจ้าของตาม manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` และการล้าง schema + diagnostics สำหรับ DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | ประเภท snapshot การใช้งานของผู้ให้บริการ, ตัวช่วยดึงข้อมูลการใช้งานที่ใช้ร่วมกัน และ fetcher ของผู้ให้บริการ เช่น `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ประเภท wrapper ของ stream, ความเข้ากันได้กับ tool-call แบบข้อความล้วน และตัวช่วย wrapper ที่ใช้ร่วมกันสำหรับ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | ตัวช่วย wrapper ของ stream ผู้ให้บริการแบบสาธารณะที่ใช้ร่วมกัน รวมถึง `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` และยูทิลิตี stream ที่เข้ากันได้กับ Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | ตัวช่วย transport ของผู้ให้บริการเนทีฟ เช่น guarded fetch, การดึงข้อความผลลัพธ์ของเครื่องมือ, การแปลงข้อความ transport และ stream เหตุการณ์ transport ที่เขียนได้ |
    | `plugin-sdk/provider-onboard` | ตัวช่วย patch config สำหรับ onboarding |
    | `plugin-sdk/global-singleton` | ตัวช่วย singleton/map/cache ภายในโปรเซส |
    | `plugin-sdk/group-activation` | ตัวช่วยโหมดเปิดใช้งานกลุ่มแบบแคบและการแยกวิเคราะห์คำสั่ง |
  </Accordion>

snapshot การใช้งานของผู้ให้บริการโดยปกติจะรายงาน quota `windows` อย่างน้อยหนึ่งรายการ แต่ละรายการมี
ป้ายกำกับ เปอร์เซ็นต์ที่ใช้ไป และเวลา reset ที่เป็นทางเลือก ผู้ให้บริการที่เปิดเผยข้อความยอดคงเหลือหรือ
สถานะบัญชีแทนหน้าต่าง quota ที่ reset ได้ควรคืนค่า
`summary` พร้อมอาร์เรย์ `windows` ว่าง แทนการสร้างเปอร์เซ็นต์ขึ้นเอง
OpenClaw จะแสดงข้อความสรุปนั้นในเอาต์พุตสถานะ; ใช้ `error` เฉพาะเมื่อ
endpoint การใช้งานล้มเหลวหรือไม่คืนข้อมูลการใช้งานที่ใช้ได้

  <Accordion title="Auth and security subpaths">
    | เส้นทางย่อย | เอ็กซ์พอร์ตหลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ตัวช่วยรีจิสทรีคำสั่ง รวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก, ตัวช่วยการอนุญาตผู้ส่ง |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความคำสั่ง/ความช่วยเหลือ เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | ตัวช่วยแก้ค่า approver และ action-auth ในแชตเดียวกัน |
    | `plugin-sdk/approval-client-runtime` | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติ exec เนทีฟ |
    | `plugin-sdk/approval-delivery-runtime` | adapter ความสามารถ/การส่งมอบการอนุมัติเนทีฟ |
    | `plugin-sdk/approval-gateway-runtime` | ตัวช่วยแก้ค่า Gateway การอนุมัติที่ใช้ร่วมกัน |
    | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยโหลด adapter การอนุมัติเนทีฟแบบเบาสำหรับ entrypoint ของช่องทาง hot |
    | `plugin-sdk/approval-handler-runtime` | ตัวช่วยรันไทม์ handler การอนุมัติที่กว้างกว่า; ควรใช้ seam adapter/gateway ที่แคบกว่าเมื่อเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติเนทีฟ, การผูกบัญชี, route-gate, fallback การส่งต่อ และการระงับ prompt exec เนทีฟในเครื่อง |
    | `plugin-sdk/approval-reaction-runtime` | การผูก reaction การอนุมัติแบบ hardcoded, payload prompt ของ reaction, store เป้าหมาย reaction และเอ็กซ์พอร์ตความเข้ากันได้สำหรับการระงับ prompt exec เนทีฟในเครื่อง |
    | `plugin-sdk/approval-reply-runtime` | ตัวช่วย payload ตอบกลับการอนุมัติ exec/plugin |
    | `plugin-sdk/approval-runtime` | ตัวช่วย payload การอนุมัติ exec/plugin, ตัวช่วย routing/runtime การอนุมัติเนทีฟ และตัวช่วยแสดงผลการอนุมัติแบบมีโครงสร้าง เช่น `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | ตัวช่วย reset การ dedupe reply ขาเข้าแบบแคบ |
    | `plugin-sdk/channel-contract-testing` | ตัวช่วยทดสอบสัญญาช่องทางแบบแคบโดยไม่มี barrel การทดสอบที่กว้าง |
    | `plugin-sdk/command-auth-native` | การยืนยันตัวตนคำสั่งเนทีฟ, การจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก และตัวช่วย session-target เนทีฟ |
    | `plugin-sdk/command-detection` | ตัวช่วยตรวจจับคำสั่งที่ใช้ร่วมกัน |
    | `plugin-sdk/command-primitives-runtime` | predicate ข้อความคำสั่งแบบเบาสำหรับ path ช่องทาง hot |
    | `plugin-sdk/command-surface` | การทำให้ command-body เป็นมาตรฐานและตัวช่วย command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | ตัวช่วย flow ล็อกอินการยืนยันตัวตนผู้ให้บริการแบบ lazy สำหรับช่องทางส่วนตัวและการจับคู่ device-code ของ Web UI |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยรวบรวม secret-contract แบบแคบสำหรับพื้นผิว secret ของช่องทาง/plugin |
    | `plugin-sdk/secret-ref-runtime` | ตัวช่วย typing `coerceSecretRef` และ SecretRef แบบแคบสำหรับการแยกวิเคราะห์ secret-contract/config |
    | `plugin-sdk/secret-provider-integration` | สัญญา manifest และ preset สำหรับการผสานผู้ให้บริการ SecretRef แบบ type-only สำหรับ plugins ที่เผยแพร่ preset ของผู้ให้บริการ secret ภายนอก |
    | `plugin-sdk/security-runtime` | ตัวช่วย trust, การ gate DM, ไฟล์/path ที่จำกัดภายใต้ root ที่ใช้ร่วมกัน รวมถึงการเขียนแบบ create-only, การแทนที่ไฟล์แบบ atomic ทั้ง sync/async, การเขียน temp ข้างเคียง, fallback การย้ายข้ามอุปกรณ์, ตัวช่วย private file-store, guard สำหรับ symlink-parent, external-content, การปกปิดข้อความอ่อนไหว, การเปรียบเทียบ secret แบบ constant-time และตัวช่วยรวบรวม secret |
    | `plugin-sdk/ssrf-policy` | ตัวช่วย allowlist ของ host และนโยบาย SSRF สำหรับ private-network |
    | `plugin-sdk/ssrf-dispatcher` | ตัวช่วย pinned-dispatcher แบบแคบโดยไม่มีพื้นผิวรันไทม์ infra ที่กว้าง |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, fetch ที่มีการป้องกัน SSRF, ข้อผิดพลาด SSRF และตัวช่วยนโยบาย SSRF |
    | `plugin-sdk/secret-input` | ตัวช่วยแยกวิเคราะห์อินพุต secret |
    | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ/เป้าหมาย Webhook และการบังคับชนิด websocket/body ดิบ |
    | `plugin-sdk/webhook-request-guards` | ตัวช่วยขนาด/timeout ของ body คำขอ |
  </Accordion>

  <Accordion title="เส้นทางย่อยของรันไทม์และพื้นที่จัดเก็บ">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | ตัวช่วยรันไทม์/การบันทึกล็อก/การสำรองข้อมูล/การติดตั้ง Plugin แบบกว้าง |
    | `plugin-sdk/runtime-env` | ตัวช่วย env รันไทม์, ตัวบันทึกล็อก, ระยะหมดเวลา, การลองซ้ำ และ backoff แบบจำกัดขอบเขต |
    | `plugin-sdk/browser-config` | facade การตั้งค่าเบราว์เซอร์ที่รองรับสำหรับโปรไฟล์/ค่าเริ่มต้นที่ทำให้เป็นมาตรฐาน, การแยกวิเคราะห์ URL ของ CDP และตัวช่วยยืนยันตัวตนสำหรับการควบคุมเบราว์เซอร์ |
    | `plugin-sdk/agent-harness-task-runtime` | ตัวช่วยวงจรชีวิตงานทั่วไปและการส่งผลการเสร็จสิ้นสำหรับเอเจนต์ที่มี harness รองรับโดยใช้ขอบเขตงานที่โฮสต์ออกให้ |
    | `plugin-sdk/codex-mcp-projection` | ตัวช่วย Codex ที่รวมมาและสงวนไว้ สำหรับฉายการตั้งค่าเซิร์ฟเวอร์ MCP ของผู้ใช้ไปเป็นการตั้งค่าเธรด Codex; ไม่ใช่สำหรับ Plugin ของบุคคลที่สาม |
    | `plugin-sdk/codex-native-task-runtime` | ตัวช่วย Codex ที่รวมมาแบบส่วนตัวสำหรับการเชื่อมสายงาน mirror/รันไทม์ของงาน native; ไม่ใช่สำหรับ Plugin ของบุคคลที่สาม |
    | `plugin-sdk/channel-runtime-context` | ตัวช่วยลงทะเบียนและค้นหาบริบท-รันไทม์ของช่องทางแบบทั่วไป |
    | `plugin-sdk/matrix` | facade ความเข้ากันได้กับ Matrix ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางของบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควรนำเข้า `plugin-sdk/run-command` โดยตรง |
    | `plugin-sdk/mattermost` | facade ความเข้ากันได้กับ Mattermost ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางของบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควรนำเข้าเส้นทางย่อย SDK ทั่วไปโดยตรง |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | ตัวช่วยร่วมสำหรับคำสั่ง/ฮุก/http/การโต้ตอบของ Plugin |
    | `plugin-sdk/hook-runtime` | ตัวช่วยร่วมสำหรับ Webhook/ไปป์ไลน์ฮุกภายใน |
    | `plugin-sdk/lazy-runtime` | ตัวช่วยนำเข้า/ผูกมัดรันไทม์แบบ lazy เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod` และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | ตัวช่วย exec กระบวนการ |
    | `plugin-sdk/cli-runtime` | ตัวช่วย CLI สำหรับการจัดรูปแบบ, การรอ, เวอร์ชัน, การเรียกใช้ด้วยอาร์กิวเมนต์ และกลุ่มคำสั่งแบบ lazy |
    | `plugin-sdk/qa-live-transport-scenarios` | id สถานการณ์ QA การขนส่งแบบ live ที่ใช้ร่วมกัน, ตัวช่วยความครอบคลุม baseline และตัวช่วยเลือกสถานการณ์ |
    | `plugin-sdk/gateway-method-runtime` | ตัวช่วย dispatch เมธอด Gateway ที่สงวนไว้สำหรับเส้นทาง HTTP ของ Plugin ที่ประกาศ `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | ไคลเอนต์ Gateway, ตัวช่วยเริ่มไคลเอนต์ที่พร้อมสำหรับลูปเหตุการณ์, RPC ของ CLI สำหรับ Gateway, ข้อผิดพลาดโปรโตคอล Gateway, การแก้ host LAN ที่ประกาศไว้ และตัวช่วยแพตช์สถานะช่องทาง |
    | `plugin-sdk/config-contracts` | พื้นผิวการตั้งค่าแบบ type-only ที่เน้นเฉพาะสำหรับรูปทรงการตั้งค่า Plugin เช่น `OpenClawConfig` และชนิดการตั้งค่าช่องทาง/ผู้ให้บริการ |
    | `plugin-sdk/plugin-config-runtime` | ตัวช่วยค้นหาการตั้งค่า Plugin ขณะรันไทม์ เช่น `requireRuntimeConfig`, `resolvePluginConfigObject` และ `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | ตัวช่วยเปลี่ยนแปลงการตั้งค่าแบบธุรกรรม เช่น `mutateConfigFile`, `replaceConfigFile` และ `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | สตริงคำใบ้ metadata การส่งมอบ message-tool ที่ใช้ร่วมกัน |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วยสแนปช็อตการตั้งค่ากระบวนการปัจจุบัน เช่น `getRuntimeConfig`, `getRuntimeConfigSnapshot` และตัวตั้งค่าสแนปช็อตสำหรับการทดสอบ |
    | `plugin-sdk/telegram-command-config` | การทำให้ชื่อ/คำอธิบายคำสั่ง Telegram เป็นมาตรฐาน และการตรวจสอบรายการซ้ำ/ความขัดแย้ง แม้พื้นผิวสัญญา Telegram ที่รวมมาจะไม่พร้อมใช้งาน |
    | `plugin-sdk/text-autolink-runtime` | การตรวจจับ autolink ของการอ้างอิงไฟล์โดยไม่ใช้ barrel ข้อความแบบกว้าง |
    | `plugin-sdk/approval-reaction-runtime` | การผูก reaction การอนุมัติที่ hardcode ไว้, payload พรอมป์ reaction, ที่เก็บเป้าหมาย reaction และการส่งออกความเข้ากันได้สำหรับการระงับพรอมป์ native exec ภายในเครื่อง |
    | `plugin-sdk/approval-runtime` | ตัวช่วยการอนุมัติ exec/Plugin, ตัวสร้างความสามารถการอนุมัติ, ตัวช่วย auth/โปรไฟล์, ตัวช่วย routing/รันไทม์ native และการจัดรูปแบบเส้นทางแสดงผลการอนุมัติแบบมีโครงสร้าง |
    | `plugin-sdk/reply-runtime` | ตัวช่วยรันไทม์ inbound/reply ที่ใช้ร่วมกัน, การแบ่งชิ้น, dispatch, Heartbeat, ตัววางแผนการตอบกลับ |
    | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วย dispatch/finalize การตอบกลับ และป้ายกำกับการสนทนาแบบจำกัดขอบเขต |
    | `plugin-sdk/reply-history` | ตัวช่วยประวัติการตอบกลับช่วงสั้นที่ใช้ร่วมกัน โค้ด message-turn ใหม่ควรใช้ `createChannelHistoryWindow`; ตัวช่วย map ระดับล่างยังคงเป็นการส่งออกความเข้ากันได้ที่เลิกใช้แล้วเท่านั้น |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ตัวช่วยแบ่งชิ้นข้อความ/Markdown แบบจำกัดขอบเขต |
    | `plugin-sdk/session-store-runtime` | ตัวช่วยเวิร์กโฟลว์เซสชัน (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), การอ่านข้อความ transcript ล่าสุดของผู้ใช้/ผู้ช่วยแบบมีขอบเขตตามตัวตนเซสชัน, ตัวช่วยเส้นทางที่เก็บเซสชันเดิม/session-key เดิม, การอ่าน updated-at และตัวช่วยความเข้ากันได้ทั้ง store/เส้นทางไฟล์สำหรับช่วงเปลี่ยนผ่านเท่านั้น |
    | `plugin-sdk/session-transcript-runtime` | ตัวช่วยตัวตน transcript, เป้าหมาย/read/write ตามขอบเขต, การเผยแพร่การอัปเดต, write lock และคีย์ hit ของหน่วยความจำ transcript |
    | `plugin-sdk/sqlite-runtime` | ตัวช่วย SQLite ที่เน้น schema เอเจนต์, เส้นทาง และธุรกรรมสำหรับรันไทม์ first-party |
    | `plugin-sdk/cron-store-runtime` | ตัวช่วยเส้นทาง/load/save ของที่เก็บ Cron |
    | `plugin-sdk/state-paths` | ตัวช่วยเส้นทางไดเรกทอรี state/OAuth |
    | `plugin-sdk/plugin-state-runtime` | ชนิด keyed-state ของ SQLite sidecar สำหรับ Plugin พร้อมการตั้งค่า pragma การเชื่อมต่อแบบรวมศูนย์และการบำรุงรักษา WAL สำหรับฐานข้อมูลที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/routing` | ตัวช่วยการผูก route/session-key/account เช่น `resolveAgentRoute`, `buildAgentSessionKey` และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ตัวช่วยสรุปสถานะช่องทาง/บัญชีที่ใช้ร่วมกัน, ค่าเริ่มต้น runtime-state และตัวช่วย metadata ของ issue |
    | `plugin-sdk/target-resolver-runtime` | ตัวช่วย resolver เป้าหมายที่ใช้ร่วมกัน |
    | `plugin-sdk/string-normalization-runtime` | ตัวช่วยทำให้ slug/สตริงเป็นมาตรฐาน |
    | `plugin-sdk/request-url` | ดึง URL แบบสตริงจากอินพุตที่คล้าย fetch/request |
    | `plugin-sdk/run-command` | ตัวรันคำสั่งแบบมีเวลา พร้อมผลลัพธ์ stdout/stderr ที่ทำให้เป็นมาตรฐาน |
    | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ tool/CLI ทั่วไป |
    | `plugin-sdk/tool-plugin` | กำหนด Plugin เครื่องมือเอเจนต์แบบ typed อย่างง่าย และเปิดเผย metadata แบบ static สำหรับการสร้าง manifest |
    | `plugin-sdk/tool-payload` | ดึง payload ที่ทำให้เป็นมาตรฐานจากอ็อบเจ็กต์ผลลัพธ์ของเครื่องมือ |
    | `plugin-sdk/tool-send` | ดึงฟิลด์เป้าหมายการส่งแบบ canonical จากอาร์กิวเมนต์ของเครื่องมือ |
    | `plugin-sdk/sandbox` | ชนิด backend ของ sandbox และตัวช่วยคำสั่ง SSH/OpenShell รวมถึง preflight คำสั่ง exec แบบ fail-fast |
    | `plugin-sdk/temp-path` | ตัวช่วยเส้นทางดาวน์โหลดชั่วคราวที่ใช้ร่วมกันและ workspace ชั่วคราวแบบปลอดภัยส่วนตัว |
    | `plugin-sdk/logging-core` | ตัวบันทึกล็อก subsystem และตัวช่วย redaction |
    | `plugin-sdk/markdown-table-runtime` | โหมดตาราง Markdown และตัวช่วยแปลง |
    | `plugin-sdk/model-session-runtime` | ตัวช่วย override model/session เช่น `applyModelOverrideToSessionEntry` และ `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | ตัวช่วยแก้การตั้งค่าผู้ให้บริการ Talk |
    | `plugin-sdk/json-store` | ตัวช่วยอ่าน/เขียน state JSON ขนาดเล็ก |
    | `plugin-sdk/json-unsafe-integers` | ตัวช่วยแยกวิเคราะห์ JSON ที่เก็บ literal จำนวนเต็มที่ไม่ปลอดภัยเป็นสตริง |
    | `plugin-sdk/file-lock` | ตัวช่วย file-lock แบบ re-entrant |
    | `plugin-sdk/persistent-dedupe` | ตัวช่วยแคช dedupe ที่มีดิสก์รองรับ |
    | `plugin-sdk/acp-runtime` | ตัวช่วยรันไทม์/เซสชัน ACP และ reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | ตัวช่วยลงทะเบียน backend ACP แบบเบาและ reply-dispatch สำหรับ Plugin ที่โหลดตอนเริ่มต้น |
    | `plugin-sdk/acp-binding-resolve-runtime` | การแก้ binding ACP แบบอ่านอย่างเดียวโดยไม่ต้องนำเข้า startup ของวงจรชีวิต |
    | `plugin-sdk/agent-config-primitives` | primitive ของ config-schema รันไทม์เอเจนต์แบบจำกัดขอบเขต |
    | `plugin-sdk/boolean-param` | ตัวอ่านพารามิเตอร์ boolean แบบหลวม |
    | `plugin-sdk/dangerous-name-runtime` | ตัวช่วยแก้การจับคู่ dangerous-name |
    | `plugin-sdk/device-bootstrap` | ตัวช่วย bootstrap อุปกรณ์และ token การจับคู่ |
    | `plugin-sdk/extension-shared` | primitive ตัวช่วย passive-channel, สถานะ และพร็อกซี ambient ที่ใช้ร่วมกัน |
    | `plugin-sdk/models-provider-runtime` | ตัวช่วยการตอบกลับคำสั่ง/ผู้ให้บริการ `/models` |
    | `plugin-sdk/skill-commands-runtime` | ตัวช่วยแสดงรายการคำสั่ง Skill |
    | `plugin-sdk/native-command-registry` | ตัวช่วย registry/build/serialize คำสั่ง native |
    | `plugin-sdk/agent-harness` | พื้นผิว Plugin ที่เชื่อถือได้แบบทดลองสำหรับ harness เอเจนต์ระดับต่ำ: ชนิด harness, ตัวช่วย steer/abort ของ active-run, ตัวช่วย bridge เครื่องมือ OpenClaw, ตัวช่วยนโยบายเครื่องมือ runtime-plan, การจำแนก terminal outcome, ตัวช่วยจัดรูปแบบ/รายละเอียดความคืบหน้าเครื่องมือ และยูทิลิตีผลลัพธ์ attempt |
    | `plugin-sdk/provider-zai-endpoint` | facade การตรวจจับ endpoint ที่ผู้ให้บริการ Z.AI เป็นเจ้าของซึ่งเลิกใช้แล้ว; ใช้ API สาธารณะของ Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | ตัวช่วย async lock เฉพาะกระบวนการสำหรับไฟล์ state รันไทม์ขนาดเล็ก |
    | `plugin-sdk/channel-activity-runtime` | ตัวช่วย telemetry กิจกรรมช่องทาง |
    | `plugin-sdk/concurrency-runtime` | ตัวช่วย concurrency ของงาน async แบบมีขอบเขต |
    | `plugin-sdk/dedupe-runtime` | ตัวช่วยแคช dedupe ในหน่วยความจำ |
    | `plugin-sdk/delivery-queue-runtime` | ตัวช่วย drain การส่งมอบขาออกที่ค้างอยู่ |
    | `plugin-sdk/file-access-runtime` | ตัวช่วยเส้นทางไฟล์ภายในเครื่องและแหล่งสื่ออย่างปลอดภัย |
    | `plugin-sdk/heartbeat-runtime` | ตัวช่วย wake, เหตุการณ์ และการมองเห็นของ Heartbeat |
    | `plugin-sdk/number-runtime` | ตัวช่วย coercion ตัวเลข |
    | `plugin-sdk/secure-random-runtime` | ตัวช่วย token/UUID ที่ปลอดภัย |
    | `plugin-sdk/system-event-runtime` | ตัวช่วยคิวเหตุการณ์ระบบ |
    | `plugin-sdk/transport-ready-runtime` | ตัวช่วยรอความพร้อมของการขนส่ง |
    | `plugin-sdk/exec-approvals-runtime` | ตัวช่วยไฟล์นโยบายการอนุมัติ exec โดยไม่ใช้ barrel infra-runtime แบบกว้าง |
    | `plugin-sdk/infra-runtime` | shim ความเข้ากันได้ที่เลิกใช้แล้ว; ใช้เส้นทางย่อยรันไทม์ที่เน้นเฉพาะด้านบน |
    | `plugin-sdk/collection-runtime` | ตัวช่วยแคชขนาดเล็กแบบมีขอบเขต |
    | `plugin-sdk/diagnostic-runtime` | ตัวช่วย flag การวินิจฉัย, เหตุการณ์ และ trace-context |
    | `plugin-sdk/error-runtime` | ตัวช่วยกราฟข้อผิดพลาด, การจัดรูปแบบ, การจำแนกข้อผิดพลาดร่วม และ `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch ที่ห่อไว้, พร็อกซี, ตัวเลือก EnvHttpProxyAgent และตัวช่วย lookup แบบ pinned |
    | `plugin-sdk/runtime-fetch` | fetch รันไทม์ที่รับรู้ dispatcher โดยไม่ต้องนำเข้า proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | ตัวช่วย sanitizer URL ข้อมูลรูปภาพ inline และการ sniff ลายเซ็น โดยไม่ใช้พื้นผิวรันไทม์สื่อแบบกว้าง |
    | `plugin-sdk/response-limit-runtime` | ตัวอ่าน response-body แบบมีขอบเขตโดยไม่ใช้พื้นผิวรันไทม์สื่อแบบกว้าง |
    | `plugin-sdk/session-binding-runtime` | state การผูกการสนทนาปัจจุบันโดยไม่มี routing การผูกที่ตั้งค่าไว้หรือที่เก็บการจับคู่ |
    | `plugin-sdk/session-store-runtime` | ตัวช่วย session-store โดยไม่ต้องนำเข้าการเขียน/บำรุงรักษาการตั้งค่าแบบกว้าง |
    | `plugin-sdk/sqlite-runtime` | ตัวช่วย SQLite ที่เน้น schema เอเจนต์, เส้นทาง และธุรกรรม โดยไม่มีการควบคุมวงจรชีวิตฐานข้อมูล |
    | `plugin-sdk/context-visibility-runtime` | การแก้การมองเห็นบริบทและการกรองบริบทเสริมโดยไม่ต้องนำเข้าการตั้งค่า/ความปลอดภัยแบบกว้าง |
    | `plugin-sdk/string-coerce-runtime` | ตัวช่วย coercion และการทำให้เป็นมาตรฐานของ primitive record/สตริงแบบจำกัดขอบเขต โดยไม่ต้องนำเข้า markdown/logging |
    | `plugin-sdk/host-runtime` | ตัวช่วยทำให้ชื่อโฮสต์และโฮสต์ SCP เป็นมาตรฐาน |
    | `plugin-sdk/retry-runtime` | ตัวช่วยการตั้งค่า retry และตัวรัน retry |
    | `plugin-sdk/agent-runtime` | ตัวช่วยไดเรกทอรี/ตัวตน/workspace ของเอเจนต์ รวมถึง `resolveAgentDir`, `resolveDefaultAgentDir` และการส่งออกความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว |
    | `plugin-sdk/directory-runtime` | การ query/dedup ไดเรกทอรีที่อิงการตั้งค่า |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="เส้นทางย่อยของความสามารถและการทดสอบ">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | ตัวช่วยที่ใช้ร่วมกันสำหรับดึง/แปลง/จัดเก็บสื่อ รวมถึง `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` และ `fetchRemoteMedia` ที่เลิกใช้แล้ว; ควรใช้ตัวช่วยจัดเก็บก่อนการอ่านบัฟเฟอร์เมื่อ URL ควรถูกแปลงเป็นสื่อของ OpenClaw |
    | `plugin-sdk/media-mime` | การปรับ MIME ให้เป็นมาตรฐานแบบจำกัด การแมปนามสกุลไฟล์ การตรวจจับ MIME และตัวช่วยชนิดสื่อ |
    | `plugin-sdk/media-store` | ตัวช่วยที่เก็บสื่อแบบจำกัด เช่น `saveMediaBuffer` และ `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | ตัวช่วยที่ใช้ร่วมกันสำหรับ failover การสร้างสื่อ การเลือกตัวเลือกที่เป็นไปได้ และข้อความเมื่อไม่มีโมเดล |
    | `plugin-sdk/media-understanding` | ประเภทของผู้ให้บริการการทำความเข้าใจสื่อ รวมถึงรายการส่งออกตัวช่วยรูปภาพ/เสียง/การสกัดข้อมูลแบบมีโครงสร้างสำหรับผู้ให้บริการ |
    | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งส่วน/เรนเดอร์ข้อความและมาร์กดาวน์ การแปลงตารางมาร์กดาวน์ การลบแท็กคำสั่ง และยูทิลิตีข้อความปลอดภัย |
    | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งส่วนข้อความขาออก |
    | `plugin-sdk/speech` | ประเภทของผู้ให้บริการเสียงพูด รวมถึงรายการส่งออกคำสั่ง รีจิสทรี การตรวจสอบ ตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI และตัวช่วยเสียงพูดสำหรับผู้ให้บริการ |
    | `plugin-sdk/speech-core` | รายการส่งออกที่ใช้ร่วมกันสำหรับประเภทผู้ให้บริการเสียงพูด รีจิสทรี คำสั่ง การปรับมาตรฐาน และตัวช่วยเสียงพูด |
    | `plugin-sdk/realtime-transcription` | ประเภทของผู้ให้บริการการถอดเสียงแบบเรียลไทม์ ตัวช่วยรีจิสทรี และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
    | `plugin-sdk/realtime-bootstrap-context` | ตัวช่วยบูตสแตรปโปรไฟล์แบบเรียลไทม์สำหรับการฉีดคอนเท็กซ์ `IDENTITY.md`, `USER.md` และ `SOUL.md` แบบมีขอบเขต |
    | `plugin-sdk/realtime-voice` | ประเภทของผู้ให้บริการเสียงแบบเรียลไทม์ ตัวช่วยรีจิสทรี และตัวช่วยพฤติกรรมเสียงแบบเรียลไทม์ที่ใช้ร่วมกัน รวมถึงการติดตามกิจกรรมเอาต์พุต |
    | `plugin-sdk/image-generation` | ประเภทของผู้ให้บริการสร้างภาพ รวมถึงตัวช่วย asset/data URL ของรูปภาพ และตัวสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
    | `plugin-sdk/image-generation-core` | ตัวช่วยประเภทการสร้างภาพ failover การยืนยันตัวตน และรีจิสทรีที่ใช้ร่วมกัน |
    | `plugin-sdk/music-generation` | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างเพลง |
    | `plugin-sdk/music-generation-core` | ประเภทการสร้างเพลงที่ใช้ร่วมกัน ตัวช่วย failover การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref |
    | `plugin-sdk/video-generation` | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างวิดีโอ |
    | `plugin-sdk/video-generation-core` | ประเภทการสร้างวิดีโอที่ใช้ร่วมกัน ตัวช่วย failover การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref |
    | `plugin-sdk/transcripts` | ประเภทของผู้ให้บริการแหล่งที่มาทรานสคริปต์ที่ใช้ร่วมกัน ตัวช่วยรีจิสทรี ตัวอธิบายเซสชัน และเมทาดาทาของถ้อยคำ |
    | `plugin-sdk/webhook-targets` | รีจิสทรีเป้าหมาย Webhook และตัวช่วยติดตั้งเส้นทาง |
    | `plugin-sdk/webhook-path` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | ตัวช่วยโหลดสื่อระยะไกล/ภายในเครื่องที่ใช้ร่วมกัน |
    | `plugin-sdk/zod` | การส่งออกซ้ำเพื่อความเข้ากันได้ที่เลิกใช้แล้ว; นำเข้า `zod` จาก `zod` โดยตรง |
    | `plugin-sdk/testing` | barrel ความเข้ากันได้ที่เลิกใช้แล้วเฉพาะในรีโปสำหรับการทดสอบ OpenClaw เดิม การทดสอบใหม่ในรีโปควรนำเข้าเส้นทางย่อยการทดสอบภายในที่เจาะจง เช่น `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` หรือ `plugin-sdk/test-fixtures` แทน |
    | `plugin-sdk/plugin-test-api` | ตัวช่วย `createTestPluginApi` ขั้นต่ำเฉพาะในรีโปสำหรับการทดสอบหน่วยการลงทะเบียน Plugin โดยตรงโดยไม่ต้องนำเข้า bridge ตัวช่วยทดสอบของรีโป |
    | `plugin-sdk/agent-runtime-test-contracts` | fixture สัญญาอะแดปเตอร์ agent-runtime ดั้งเดิมเฉพาะในรีโปสำหรับการทดสอบการยืนยันตัวตน การส่งมอบ fallback, tool-hook, prompt-overlay, schema และการฉายภาพทรานสคริปต์ |
    | `plugin-sdk/channel-test-helpers` | ตัวช่วยทดสอบที่เน้น channel เฉพาะในรีโปสำหรับสัญญา action/setup/status ทั่วไป assertion ไดเรกทอรี วงจรชีวิตการเริ่มต้นบัญชี threading ของ send-config mock รันไทม์ ปัญหาสถานะ การส่งมอบขาออก และการลงทะเบียน hook |
    | `plugin-sdk/channel-target-testing` | ชุดกรณีข้อผิดพลาดของการแก้เป้าหมายที่ใช้ร่วมกันเฉพาะในรีโปสำหรับการทดสอบ channel |
    | `plugin-sdk/plugin-test-contracts` | ตัวช่วยสัญญาเฉพาะในรีโปสำหรับแพ็กเกจ Plugin การลงทะเบียน artifact สาธารณะ การนำเข้าโดยตรง runtime API และผลข้างเคียงของการนำเข้า |
    | `plugin-sdk/provider-test-contracts` | ตัวช่วยสัญญาเฉพาะในรีโปสำหรับ runtime ของผู้ให้บริการ การยืนยันตัวตน การค้นพบ onboard แค็ตตาล็อก wizard ความสามารถด้านสื่อ นโยบาย replay เสียงสดสำหรับ realtime STT การค้นหา/ดึงข้อมูลเว็บ และสตรีม |
    | `plugin-sdk/provider-http-test-mocks` | mock HTTP/auth ของ Vitest แบบ opt-in เฉพาะในรีโปสำหรับการทดสอบผู้ให้บริการที่ทดสอบ `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | fixture เฉพาะในรีโปสำหรับการจับ runtime ของ CLI ทั่วไป คอนเท็กซ์ sandbox ตัวเขียน skill, agent-message, system-event การโหลดโมดูลซ้ำ เส้นทาง Plugin ที่บันเดิล terminal-text การแบ่งส่วน auth-token และ typed-case |
    | `plugin-sdk/test-node-mocks` | ตัวช่วย mock Node builtin แบบเจาะจงเฉพาะในรีโปสำหรับใช้ภายใน factory ของ Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="เส้นทางย่อยของหน่วยความจำ">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/memory-core` | พื้นผิวตัวช่วย memory-core ที่บันเดิลสำหรับตัวช่วย manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade runtime สำหรับดัชนี/การค้นหาหน่วยความจำ |
    | `plugin-sdk/memory-core-host-embedding-registry` | ตัวช่วยรีจิสทรีผู้ให้บริการ embedding หน่วยความจำน้ำหนักเบา |
    | `plugin-sdk/memory-core-host-engine-foundation` | รายการส่งออกเอนจิน foundation ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | สัญญา embedding ของโฮสต์หน่วยความจำ การเข้าถึงรีจิสทรี ผู้ให้บริการภายใน และตัวช่วย batch/remote ทั่วไป `registerMemoryEmbeddingProvider` บนพื้นผิวนี้เลิกใช้แล้ว; ใช้ API ผู้ให้บริการ embedding ทั่วไปสำหรับผู้ให้บริการใหม่ |
    | `plugin-sdk/memory-core-host-engine-qmd` | รายการส่งออกเอนจิน QMD ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-storage` | รายการส่งออกเอนจิน storage ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วย multimodal ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-query` | ตัวช่วย query ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-secret` | ตัวช่วย secret ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-events` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | ตัวช่วย status ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-cli` | ตัวช่วย runtime ของ CLI สำหรับโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-core` | ตัวช่วย runtime แกนกลางของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วย file/runtime ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-core` | นามแฝงที่เป็นกลางต่อ vendor สำหรับตัวช่วย runtime แกนกลางของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-events` | นามแฝงที่เป็นกลางต่อ vendor สำหรับตัวช่วย event journal ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-files` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | ตัวช่วย managed-markdown ที่ใช้ร่วมกันสำหรับ Plugin ที่อยู่ใกล้เคียงกับหน่วยความจำ |
    | `plugin-sdk/memory-host-search` | facade runtime ของ Active Memory สำหรับการเข้าถึง search-manager |
    | `plugin-sdk/memory-host-status` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="เส้นทางย่อยตัวช่วยที่บันเดิลและสงวนไว้">
    เส้นทางย่อย SDK ของตัวช่วยที่บันเดิลและสงวนไว้เป็นพื้นผิวเฉพาะเจ้าของแบบจำกัดสำหรับ
    โค้ด Plugin ที่บันเดิล เส้นทางเหล่านี้ถูกติดตามใน inventory ของ SDK เพื่อให้การ build
    แพ็กเกจและการทำ alias คงความกำหนดได้ แต่ไม่ใช่ API สำหรับการเขียน Plugin ทั่วไป
    สัญญาโฮสต์ที่นำกลับมาใช้ใหม่ได้ควรใช้เส้นทางย่อย SDK ทั่วไป
    เช่น `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` และ
    `plugin-sdk/plugin-config-runtime`

    | เส้นทางย่อย | เจ้าของและวัตถุประสงค์ |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | ตัวช่วย Plugin Codex ที่บันเดิลสำหรับฉาย config เซิร์ฟเวอร์ MCP ของผู้ใช้เข้าไปใน config เธรด app-server ของ Codex |
    | `plugin-sdk/codex-native-task-runtime` | ตัวช่วย Plugin Codex ที่บันเดิลสำหรับมิเรอร์ subagent แบบ native ของ app-server Codex เข้าไปในสถานะงานของ OpenClaw |

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
