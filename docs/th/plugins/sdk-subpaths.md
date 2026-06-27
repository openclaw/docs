---
read_when:
    - การเลือกพาธย่อย plugin-sdk ที่เหมาะสมสำหรับการนำเข้า Plugin
    - การตรวจสอบเส้นทางย่อยของ Plugin ที่บันเดิลมาและพื้นผิวตัวช่วย
summary: 'แคตตาล็อกพาธย่อยของ Plugin SDK: การนำเข้าใดอยู่ที่ไหน โดยจัดกลุ่มตามส่วน'
title: เส้นทางย่อยของ Plugin SDK
x-i18n:
    generated_at: "2026-06-27T18:08:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK ของ Plugin ถูกเปิดเผยเป็นชุดพาธย่อยสาธารณะแบบแคบภายใต้
`openclaw/plugin-sdk/` หน้านี้จัดทำรายการพาธย่อยที่ใช้กันทั่วไปโดยจัดกลุ่มตาม
วัตถุประสงค์ รายการจุดเข้าใช้งานของคอมไพเลอร์ที่สร้างขึ้นอยู่ใน
`scripts/lib/plugin-sdk-entrypoints.json`; การส่งออกของแพ็กเกจคือชุดย่อยสาธารณะ
หลังจากหักพาธย่อยสำหรับการทดสอบ/ภายในที่ใช้เฉพาะในรีโป ซึ่งระบุไว้ใน
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` ผู้ดูแลสามารถตรวจสอบ
จำนวนการส่งออกสาธารณะได้ด้วย `pnpm plugin-sdk:surface` และพาธย่อยตัวช่วยที่สงวนไว้และใช้งานอยู่
ด้วย `pnpm plugins:boundary-report:summary`; การส่งออกตัวช่วยที่สงวนไว้แต่ไม่ได้ใช้
จะทำให้รายงาน CI ล้มเหลว แทนที่จะค้างอยู่ใน SDK สาธารณะในฐานะหนี้ความเข้ากันได้ที่ไม่ทำงาน

สำหรับคู่มือการสร้าง Plugin โปรดดู [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## รายการ Plugin

| พาธย่อย                        | การส่งออกหลัก                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | ตัวช่วยรายการผู้ให้บริการการย้ายข้อมูล เช่น `createMigrationItem`, ค่าคงที่เหตุผล, ตัวทำเครื่องหมายสถานะรายการ, ตัวช่วยการปกปิดข้อมูล และ `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | ตัวช่วยการย้ายข้อมูลขณะรัน เช่น `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` และ `writeMigrationReport`                                              |
| `plugin-sdk/health`            | การลงทะเบียน การตรวจจับ การซ่อมแซม การเลือก ระดับความรุนแรง และประเภทสิ่งที่พบสำหรับการตรวจสุขภาพของ Doctor สำหรับผู้บริโภคด้านสุขภาพที่มาพร้อมแพ็กเกจ                                               |

### ความเข้ากันได้และตัวช่วยทดสอบที่เลิกใช้แล้ว

พาธย่อยที่เลิกใช้แล้วยังคงถูกส่งออกสำหรับ Plugin รุ่นเก่า แต่โค้ดใหม่ควรใช้
พาธย่อย SDK เฉพาะด้านด้านล่าง รายการที่ดูแลอยู่คือ
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI จะปฏิเสธการนำเข้าในงานผลิตที่มาพร้อมแพ็กเกจ
จากรายการนี้ Barrel แบบกว้าง เช่น `compat`, `config-types`,
`infra-runtime`, `text-runtime` และ `zod` มีไว้เพื่อความเข้ากันได้เท่านั้น ให้นำเข้า `zod`
โดยตรงจาก `zod`

พาธย่อยตัวช่วยทดสอบของ OpenClaw ที่รองรับด้วย Vitest ใช้เฉพาะในรีโปเท่านั้น และไม่ใช่
การส่งออกของแพ็กเกจอีกต่อไป: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` และ `testing`

### พาธย่อยตัวช่วย Plugin ที่มาพร้อมแพ็กเกจซึ่งสงวนไว้

พาธย่อยเหล่านี้เป็นพื้นผิวความเข้ากันได้ที่ Plugin เป็นเจ้าของ สำหรับ Plugin ที่มาพร้อมแพ็กเกจซึ่งเป็นเจ้าของ
ไม่ใช่ API ของ SDK ทั่วไป: `plugin-sdk/codex-mcp-projection` และ
`plugin-sdk/codex-native-task-runtime` การนำเข้าส่วนขยายข้ามเจ้าของถูกบล็อก
โดยแนวป้องกันสัญญาแพ็กเกจ

<AccordionGroup>
  <Accordion title="เส้นทางย่อยของช่องทาง">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | การส่งออกสคีมา Zod รากของ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | ตัวช่วยตรวจสอบความถูกต้องของ JSON Schema แบบแคชสำหรับสคีมาที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | ตัวช่วยวิซาร์ดการตั้งค่าที่ใช้ร่วมกัน ตัวแปลการตั้งค่า พรอมป์รายการที่อนุญาต และตัวสร้างสถานะการตั้งค่า |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | ตัวช่วยการกำหนดค่าหลายบัญชี/ประตูการดำเนินการ และตัวช่วยทางเลือกสำรองบัญชีเริ่มต้น |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID` และตัวช่วยปรับบัญชีให้เป็นรูปแบบปกติ |
    | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชีและทางเลือกสำรองค่าเริ่มต้น |
    | `plugin-sdk/account-helpers` | ตัวช่วยรายการบัญชี/การดำเนินการบัญชีแบบแคบ |
    | `plugin-sdk/access-groups` | ตัวช่วยแยกวิเคราะห์รายการที่อนุญาตของกลุ่มการเข้าถึง และการวินิจฉัยกลุ่มแบบปกปิดข้อมูล |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | พริมิทีฟสคีมาการกำหนดค่าช่องทางที่ใช้ร่วมกัน รวมถึงตัวสร้าง Zod และ JSON/TypeBox โดยตรง |
    | `plugin-sdk/bundled-channel-config-schema` | สคีมาการกำหนดค่าช่องทาง OpenClaw แบบบันเดิลสำหรับ Plugin แบบบันเดิลที่ดูแลอยู่เท่านั้น |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId` รหัสช่องทางแชทแบบบันเดิล/ทางการตามหลัก รวมถึงป้ายกำกับ/นามแฝงสำหรับตัวจัดรูปแบบ สำหรับ Plugin ที่ต้องรู้จำข้อความที่มีคำนำหน้า envelope โดยไม่ต้องฮาร์ดโค้ดตารางของตนเอง |
    | `plugin-sdk/channel-config-schema-legacy` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้วสำหรับสคีมาการกำหนดค่าช่องทางแบบบันเดิล |
    | `plugin-sdk/telegram-command-config` | ตัวช่วยปรับคำสั่งกำหนดเองของ Telegram ให้เป็นรูปแบบปกติ/ตรวจสอบความถูกต้อง พร้อมทางเลือกสำรองตามสัญญาแบบบันเดิล |
    | `plugin-sdk/command-gating` | ตัวช่วยประตูอนุญาตคำสั่งแบบแคบ |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | ฟาซาดความเข้ากันได้ของขาเข้าช่องทางระดับต่ำที่เลิกใช้แล้ว เส้นทางรับใหม่ควรใช้ `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/channel-ingress-runtime` | ตัวแก้ไข runtime ขาเข้าช่องทางระดับสูงแบบทดลองและตัวสร้างข้อเท็จจริงของเส้นทาง สำหรับเส้นทางรับช่องทางที่ย้ายแล้ว แนะนำให้ใช้สิ่งนี้แทนการประกอบรายการที่อนุญาตที่มีผล รายการคำสั่งที่อนุญาต และการฉายภาพ legacy ในแต่ละ Plugin ดู [API ขาเข้าช่องทาง](/th/plugins/sdk-channel-ingress) |
    | `plugin-sdk/channel-lifecycle` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-outbound` | สัญญาวงจรชีวิตข้อความ รวมถึงตัวเลือกไปป์ไลน์ตอบกลับ ใบรับ การแสดงตัวอย่าง/สตรีมแบบสด ตัวช่วยวงจรชีวิต อัตลักษณ์ขาออก การวางแผน payload การส่งแบบทนทาน และตัวช่วยบริบทการส่งข้อความ ดู [API ขาออกช่องทาง](/th/plugins/sdk-channel-outbound) |
    | `plugin-sdk/channel-message` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `plugin-sdk/channel-outbound` รวมถึงฟาซาดการจัดส่งคำตอบแบบ legacy |
    | `plugin-sdk/channel-message-runtime` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `plugin-sdk/channel-outbound` รวมถึงฟาซาดการจัดส่งคำตอบแบบ legacy |
    | `plugin-sdk/inbound-envelope` | ตัวช่วยสร้างเส้นทางขาเข้าและ envelope ที่ใช้ร่วมกัน |
    | `plugin-sdk/inbound-reply-dispatch` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-inbound` สำหรับตัวรันขาเข้าและเพรดิเคตการจัดส่ง และใช้ `plugin-sdk/channel-outbound` สำหรับตัวช่วยส่งข้อความ |
    | `plugin-sdk/messaging-targets` | นามแฝงการแยกวิเคราะห์เป้าหมายที่เลิกใช้แล้ว; ใช้ `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | ตัวช่วยโหลดสื่อขาออกและสถานะสื่อที่โฮสต์ไว้ที่ใช้ร่วมกัน |
    | `plugin-sdk/outbound-send-deps` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/outbound-runtime` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/poll-runtime` | ตัวช่วยปรับโพลให้เป็นรูปแบบปกติแบบแคบ |
    | `plugin-sdk/thread-bindings-runtime` | ตัวช่วยวงจรชีวิตและอะแดปเตอร์ของการผูกเธรด |
    | `plugin-sdk/agent-media-payload` | ตัวสร้าง payload สื่อของเอเจนต์แบบ legacy |
    | `plugin-sdk/conversation-runtime` | ตัวช่วยการผูกบทสนทนา/เธรด การจับคู่ และการผูกที่กำหนดค่าไว้ |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วยสแนปช็อตการกำหนดค่า runtime |
    | `plugin-sdk/runtime-group-policy` | ตัวช่วยแก้นโยบายกลุ่ม runtime |
    | `plugin-sdk/channel-status` | ตัวช่วยสแนปช็อต/สรุปสถานะช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/channel-config-primitives` | พริมิทีฟสคีมาการกำหนดค่าช่องทางแบบแคบ |
    | `plugin-sdk/channel-config-writes` | ตัวช่วยอนุญาตการเขียนการกำหนดค่าช่องทาง |
    | `plugin-sdk/channel-plugin-common` | การส่งออก prelude ของ Plugin ช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/allowlist-config-edit` | ตัวช่วยแก้ไข/อ่านการกำหนดค่ารายการที่อนุญาต |
    | `plugin-sdk/group-access` | ตัวช่วยตัดสินใจการเข้าถึงกลุ่มที่ใช้ร่วมกัน |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-inbound` |
    | `plugin-sdk/direct-dm-guard-policy` | ตัวช่วยนโยบายการ์ด direct-DM ก่อนเข้ารหัสแบบแคบ |
    | `plugin-sdk/discord` | ฟาซาดความเข้ากันได้ของ Discord ที่เลิกใช้แล้วสำหรับ `@openclaw/discord@2026.3.13` ที่เผยแพร่แล้วและความเข้ากันได้ของเจ้าของที่ติดตามอยู่; Plugin ใหม่ควรใช้เส้นทางย่อย SDK ช่องทางทั่วไป |
    | `plugin-sdk/telegram-account` | ฟาซาดความเข้ากันได้ของการแก้บัญชี Telegram ที่เลิกใช้แล้วสำหรับความเข้ากันได้ของเจ้าของที่ติดตามอยู่; Plugin ใหม่ควรใช้ตัวช่วย runtime ที่ฉีดเข้ามาหรือเส้นทางย่อย SDK ช่องทางทั่วไป |
    | `plugin-sdk/zalouser` | ฟาซาดความเข้ากันได้ของ Zalo Personal ที่เลิกใช้แล้วสำหรับแพ็กเกจ Lark/Zalo ที่เผยแพร่แล้วซึ่งยังนำเข้าการอนุญาตคำสั่งผู้ส่ง; Plugin ใหม่ควรใช้ `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | การนำเสนอข้อความเชิงความหมาย การส่งมอบ และตัวช่วยตอบกลับแบบโต้ตอบ legacy ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | ตัวช่วยขาเข้าที่ใช้ร่วมกันสำหรับการจัดประเภทเหตุการณ์ การสร้างบริบท การจัดรูปแบบ ราก debounce การจับคู่การกล่าวถึง นโยบายการกล่าวถึง และการบันทึกขาเข้า |
    | `plugin-sdk/channel-inbound-debounce` | ตัวช่วย debounce ขาเข้าแบบแคบ |
    | `plugin-sdk/channel-mention-gating` | ตัวช่วยนโยบายการกล่าวถึง เครื่องหมายการกล่าวถึง และข้อความการกล่าวถึงแบบแคบ โดยไม่มีพื้นผิว runtime ขาเข้าที่กว้างกว่า |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-inbound` หรือ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-pairing-paths` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-pairing` |
    | `plugin-sdk/channel-reply-options-runtime` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-streaming` | ฟาซาดความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-send-result` | ชนิดผลลัพธ์การตอบกลับ |
    | `plugin-sdk/channel-actions` | ตัวช่วยการดำเนินการข้อความของช่องทาง รวมถึงตัวช่วยสคีมา native ที่เลิกใช้แล้วซึ่งคงไว้เพื่อความเข้ากันได้ของ Plugin |
    | `plugin-sdk/channel-route` | ตัวช่วยปรับเส้นทางให้เป็นรูปแบบปกติ การแก้เป้าหมายที่ขับเคลื่อนด้วยพาร์เซอร์ การทำ thread-id เป็นสตริง คีย์เส้นทางสำหรับ dedupe/compact ชนิดเป้าหมายที่แยกวิเคราะห์แล้ว และการเปรียบเทียบเส้นทาง/เป้าหมายที่ใช้ร่วมกัน |
    | `plugin-sdk/channel-targets` | ตัวช่วยแยกวิเคราะห์เป้าหมาย; ผู้เรียกที่เปรียบเทียบเส้นทางควรใช้ `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | ชนิดสัญญาช่องทาง |
    | `plugin-sdk/channel-feedback` | การเชื่อม feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยสัญญา secret แบบแคบ เช่น `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` และชนิดเป้าหมาย secret |
  </Accordion>

ตระกูลตัวช่วยช่องทางที่เลิกใช้แล้วยังคงพร้อมใช้งานเฉพาะเพื่อความเข้ากันได้กับ Plugin
ที่เผยแพร่แล้วเท่านั้น แผนการถอดออกคือ: คงไว้ตลอดช่วงการย้าย Plugin ภายนอก
คง Plugin ใน repo/แบบบันเดิลไว้บน `channel-inbound` และ
`channel-outbound` จากนั้นจึงลบเส้นทางย่อยความเข้ากันได้ในการล้าง SDK ครั้งใหญ่ถัดไป
สิ่งนี้มีผลกับตระกูลข้อความ/runtime ของช่องทางแบบเก่า การสตรีมช่องทาง
การเข้าถึง direct-DM ชิ้นส่วนตัวช่วยขาเข้า ตัวเลือกตอบกลับ
และเส้นทางการจับคู่

  <Accordion title="เส้นทางย่อยของผู้ให้บริการ">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | facade ของผู้ให้บริการ LM Studio ที่รองรับสำหรับการตั้งค่า การค้นพบแค็ตตาล็อก และการเตรียมโมเดลขณะรันไทม์ |
    | `plugin-sdk/lmstudio-runtime` | facade รันไทม์ของ LM Studio ที่รองรับสำหรับค่าเริ่มต้นของเซิร์ฟเวอร์ภายในเครื่อง การค้นพบโมเดล ส่วนหัวคำขอ และตัวช่วยสำหรับโมเดลที่โหลดแล้ว |
    | `plugin-sdk/provider-setup` | ตัวช่วยการตั้งค่าผู้ให้บริการภายในเครื่อง/โฮสต์เองที่คัดสรรไว้ |
    | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยการตั้งค่าผู้ให้บริการแบบโฮสต์เองที่เข้ากันได้กับ OpenAI โดยเฉพาะ |
    | `plugin-sdk/cli-backend` | ค่าเริ่มต้นของแบ็กเอนด์ CLI + ค่าคงที่ watchdog |
    | `plugin-sdk/provider-auth-runtime` | ตัวช่วยการแก้ไข API key ขณะรันไทม์สำหรับ Plugin ผู้ให้บริการ |
    | `plugin-sdk/provider-oauth-runtime` | ชนิด callback ของ OAuth สำหรับผู้ให้บริการทั่วไป, การเรนเดอร์หน้า callback, ตัวช่วย PKCE/state, การแยกวิเคราะห์ authorization-input, ตัวช่วย token-expiry และตัวช่วย abort |
    | `plugin-sdk/provider-auth-api-key` | ตัวช่วย onboarding/API-key และการเขียนโปรไฟล์ เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
    | `plugin-sdk/provider-env-vars` | ตัวช่วยค้นหา env-var สำหรับการยืนยันตัวตนของผู้ให้บริการ |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, ตัวช่วยนำเข้าการยืนยันตัวตนของ OpenAI Codex, รายการส่งออกความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้าง replay-policy ที่ใช้ร่วมกัน, ตัวช่วย provider-endpoint และตัวช่วย normalization ของ model-id ที่ใช้ร่วมกัน |
    | `plugin-sdk/provider-catalog-live-runtime` | ตัวช่วยแค็ตตาล็อกโมเดลผู้ให้บริการแบบสดสำหรับการค้นพบสไตล์ `/models` ที่มีการป้องกัน: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, การกรอง model-id, แคช TTL และ fallback แบบคงที่ |
    | `plugin-sdk/provider-catalog-runtime` | hook รันไทม์สำหรับการเติมข้อมูลแค็ตตาล็อกผู้ให้บริการ และ seam ของรีจิสทรี plugin-provider สำหรับการทดสอบสัญญา |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | ตัวช่วยความสามารถ HTTP/endpoint ของผู้ให้บริการทั่วไป, ข้อผิดพลาด HTTP ของผู้ให้บริการ และตัวช่วยฟอร์ม multipart สำหรับการถอดเสียงเสียง |
    | `plugin-sdk/provider-web-fetch-contract` | ตัวช่วยสัญญา config/selection ของ web-fetch แบบแคบ เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | ตัวช่วยการลงทะเบียน/แคชของผู้ให้บริการ web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วย config/credential ของ web-search แบบแคบสำหรับผู้ให้บริการที่ไม่ต้องใช้การเชื่อมต่อเพื่อเปิดใช้ Plugin |
    | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญา config/credential ของ web-search แบบแคบ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวอ่าน credential แบบ scoped |
    | `plugin-sdk/provider-web-search` | ตัวช่วยการลงทะเบียน/แคช/รันไทม์ของผู้ให้บริการ web-search |
    | `plugin-sdk/embedding-providers` | ชนิดผู้ให้บริการ embedding ทั่วไปและตัวช่วยอ่าน รวมถึง `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` และ `listEmbeddingProviders(...)`; Plugin ลงทะเบียนผู้ให้บริการผ่าน `api.registerEmbeddingProvider(...)` เพื่อบังคับใช้ความเป็นเจ้าของ manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` และการล้างสคีมา + diagnostics ของ DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | ชนิด snapshot การใช้งานผู้ให้บริการ, ตัวช่วยดึงการใช้งานที่ใช้ร่วมกัน และ fetcher ของผู้ให้บริการ เช่น `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ชนิด stream wrapper, compat สำหรับ tool-call แบบข้อความธรรมดา และตัวช่วย wrapper ที่ใช้ร่วมกันของ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | ตัวช่วย wrapper สตรีมผู้ให้บริการที่ใช้ร่วมกันแบบสาธารณะ รวมถึง `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` และยูทิลิตีสตรีมที่เข้ากันได้กับ Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | ตัวช่วย transport ผู้ให้บริการแบบ native เช่น fetch ที่มีการป้องกัน, การแปลงข้อความ transport และสตรีมเหตุการณ์ transport ที่เขียนได้ |
    | `plugin-sdk/provider-onboard` | ตัวช่วย patch config สำหรับ onboarding |
    | `plugin-sdk/global-singleton` | ตัวช่วย singleton/map/cache ภายในโปรเซส |
    | `plugin-sdk/group-activation` | ตัวช่วยโหมดการเปิดใช้งานกลุ่มแบบแคบและการแยกวิเคราะห์คำสั่ง |
  </Accordion>

โดยปกติ snapshot การใช้งานผู้ให้บริการจะรายงาน `windows` โควตาอย่างน้อยหนึ่งรายการ โดยแต่ละรายการมี
ป้ายกำกับ เปอร์เซ็นต์ที่ใช้แล้ว และเวลารีเซ็ตที่ระบุหรือไม่ก็ได้ ผู้ให้บริการที่เปิดเผยข้อความยอดคงเหลือหรือ
สถานะบัญชีแทนหน้าต่างโควตาที่รีเซ็ตได้ควรส่งคืน
`summary` พร้อมอาร์เรย์ `windows` ว่าง แทนการสร้างเปอร์เซ็นต์ขึ้นมาเอง
OpenClaw แสดงข้อความสรุปนั้นในเอาต์พุตสถานะ; ใช้ `error` เฉพาะเมื่อ
endpoint การใช้งานล้มเหลวหรือไม่ส่งคืนข้อมูลการใช้งานที่ใช้ได้

  <Accordion title="เส้นทางย่อยการยืนยันตัวตนและความปลอดภัย">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ตัวช่วย command registry รวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก, ตัวช่วยการอนุญาตผู้ส่ง |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความคำสั่ง/ความช่วยเหลือ เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | ตัวช่วยการแก้ไขผู้อนุมัติและการยืนยันตัวตนของ action ในแชตเดียวกัน |
    | `plugin-sdk/approval-client-runtime` | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติ exec แบบ native |
    | `plugin-sdk/approval-delivery-runtime` | adapter ความสามารถ/การส่งการอนุมัติแบบ native |
    | `plugin-sdk/approval-gateway-runtime` | ตัวช่วยการแก้ไข Gateway การอนุมัติที่ใช้ร่วมกัน |
    | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยโหลด adapter การอนุมัติแบบ native ที่เบาสำหรับ entrypoint ของช่องทางที่เป็น hot path |
    | `plugin-sdk/approval-handler-runtime` | ตัวช่วยรันไทม์ของ handler การอนุมัติที่กว้างกว่า; ให้ใช้ seam adapter/Gateway ที่แคบกว่าเมื่อเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติแบบ native, การผูกบัญชี, route-gate, forwarding fallback และการระงับ prompt exec แบบ local native |
    | `plugin-sdk/approval-reaction-runtime` | การผูก reaction การอนุมัติที่ hardcode, payload prompt ของ reaction, store เป้าหมาย reaction และรายการส่งออกความเข้ากันได้สำหรับการระงับ prompt exec แบบ local native |
    | `plugin-sdk/approval-reply-runtime` | ตัวช่วย payload ตอบกลับการอนุมัติ exec/Plugin |
    | `plugin-sdk/approval-runtime` | ตัวช่วย payload การอนุมัติ exec/Plugin, ตัวช่วย routing/runtime การอนุมัติแบบ native และตัวช่วยแสดงผลการอนุมัติแบบมีโครงสร้าง เช่น `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | ตัวช่วยรีเซ็ตการ dedupe การตอบกลับขาเข้าแบบแคบ |
    | `plugin-sdk/channel-contract-testing` | ตัวช่วยทดสอบสัญญาช่องทางแบบแคบโดยไม่มี barrel การทดสอบแบบกว้าง |
    | `plugin-sdk/command-auth-native` | การยืนยันตัวตนคำสั่งแบบ native, การจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก และตัวช่วย session-target แบบ native |
    | `plugin-sdk/command-detection` | ตัวช่วยตรวจจับคำสั่งที่ใช้ร่วมกัน |
    | `plugin-sdk/command-primitives-runtime` | predicate ข้อความคำสั่งแบบเบาสำหรับ path ของช่องทางที่เป็น hot path |
    | `plugin-sdk/command-surface` | การ normalize command-body และตัวช่วย command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยรวบรวม secret-contract แบบแคบสำหรับพื้นผิว secret ของช่องทาง/Plugin |
    | `plugin-sdk/secret-ref-runtime` | ตัวช่วย typing ของ `coerceSecretRef` และ SecretRef แบบแคบสำหรับการแยกวิเคราะห์ secret-contract/config |
    | `plugin-sdk/secret-provider-integration` | manifest การผสานรวมผู้ให้บริการ SecretRef แบบ type-only และสัญญา preset สำหรับ Plugin ที่เผยแพร่ preset ผู้ให้บริการ secret ภายนอก |
    | `plugin-sdk/security-runtime` | ตัวช่วย trust ที่ใช้ร่วมกัน, การควบคุม DM, ตัวช่วยไฟล์/path ที่จำกัดภายใน root รวมถึงการเขียนแบบ create-only, การแทนที่ไฟล์แบบ atomic ทั้ง sync/async, การเขียน temp ของ sibling, fallback การย้ายข้ามอุปกรณ์, ตัวช่วย file-store ส่วนตัว, guard สำหรับ symlink-parent, external-content, การ redaction ข้อความอ่อนไหว, การเปรียบเทียบ secret แบบ constant-time และตัวช่วยรวบรวม secret |
    | `plugin-sdk/ssrf-policy` | ตัวช่วยนโยบาย host allowlist และ SSRF สำหรับเครือข่ายส่วนตัว |
    | `plugin-sdk/ssrf-dispatcher` | ตัวช่วย pinned-dispatcher แบบแคบโดยไม่มีพื้นผิวรันไทม์ infra แบบกว้าง |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, fetch ที่ป้องกัน SSRF, ข้อผิดพลาด SSRF และตัวช่วยนโยบาย SSRF |
    | `plugin-sdk/secret-input` | ตัวช่วยการแยกวิเคราะห์อินพุต secret |
    | `plugin-sdk/webhook-ingress` | ตัวช่วย Webhook request/target และการบังคับชนิด raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | ตัวช่วยขนาด/timeout ของ request body |
  </Accordion>

  <Accordion title="เส้นทางย่อยของรันไทม์และที่เก็บข้อมูล">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | ตัวช่วยรันไทม์/การบันทึกเหตุการณ์/การสำรองข้อมูล/การติดตั้ง Plugin แบบกว้าง |
    | `plugin-sdk/runtime-env` | ตัวช่วยสภาพแวดล้อมรันไทม์ ตัวบันทึกเหตุการณ์ หมดเวลา ลองใหม่ และการถอยรอแบบแคบ |
    | `plugin-sdk/browser-config` | ส่วนครอบการตั้งค่าเบราว์เซอร์ที่รองรับ สำหรับโปรไฟล์/ค่าเริ่มต้นที่ปรับให้อยู่ในรูปมาตรฐาน การแยกวิเคราะห์ URL ของ CDP และตัวช่วยการยืนยันตัวตนสำหรับการควบคุมเบราว์เซอร์ |
    | `plugin-sdk/agent-harness-task-runtime` | ตัวช่วยวงจรชีวิตงานทั่วไปและการส่งมอบเมื่อเสร็จสิ้น สำหรับเอเจนต์ที่มีฮาร์เนสรองรับและใช้ขอบเขตงานที่โฮสต์ออกให้ |
    | `plugin-sdk/codex-mcp-projection` | ตัวช่วย Codex แบบบันเดิลที่สงวนไว้ สำหรับฉายการตั้งค่าเซิร์ฟเวอร์ MCP ของผู้ใช้ไปยังการตั้งค่าเธรด Codex; ไม่ใช่สำหรับ Plugin บุคคลที่สาม |
    | `plugin-sdk/codex-native-task-runtime` | ตัวช่วย Codex แบบบันเดิลส่วนตัว สำหรับการเชื่อมโยงมิเรอร์/รันไทม์ของงานเนทีฟ; ไม่ใช่สำหรับ Plugin บุคคลที่สาม |
    | `plugin-sdk/channel-runtime-context` | ตัวช่วยลงทะเบียนและค้นหาคอนเท็กซ์รันไทม์ของช่องทางทั่วไป |
    | `plugin-sdk/matrix` | ส่วนครอบความเข้ากันได้กับ Matrix ที่เลิกใช้แล้ว สำหรับแพ็กเกจช่องทางบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควรนำเข้า `plugin-sdk/run-command` โดยตรง |
    | `plugin-sdk/mattermost` | ส่วนครอบความเข้ากันได้กับ Mattermost ที่เลิกใช้แล้ว สำหรับแพ็กเกจช่องทางบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควรนำเข้าเส้นทางย่อย SDK ทั่วไปโดยตรง |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | ตัวช่วยคำสั่ง/ฮุก/http/แบบโต้ตอบของ Plugin ที่ใช้ร่วมกัน |
    | `plugin-sdk/hook-runtime` | ตัวช่วยไปป์ไลน์ Webhook/ฮุกภายในที่ใช้ร่วมกัน |
    | `plugin-sdk/lazy-runtime` | ตัวช่วยนำเข้า/ผูกมัดรันไทม์แบบหน่วงเวลา เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod` และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | ตัวช่วยเรียกใช้งานโพรเซส |
    | `plugin-sdk/cli-runtime` | ตัวช่วยการจัดรูปแบบ CLI การรอ เวอร์ชัน การเรียกใช้ด้วยอาร์กิวเมนต์ และกลุ่มคำสั่งแบบหน่วงเวลา |
    | `plugin-sdk/qa-live-transport-scenarios` | รหัสสถานการณ์ QA การขนส่งแบบสด ตัวช่วยความครอบคลุมฐาน และตัวช่วยเลือกสถานการณ์ที่ใช้ร่วมกัน |
    | `plugin-sdk/gateway-method-runtime` | ตัวช่วยกระจายเมธอด Gateway ที่สงวนไว้ สำหรับเส้นทาง HTTP ของ Plugin ที่ประกาศ `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | ไคลเอนต์ Gateway, ตัวช่วยเริ่มไคลเอนต์เมื่อลูปเหตุการณ์พร้อม, RPC ของ CLI สำหรับ Gateway, ข้อผิดพลาดโปรโตคอล Gateway และตัวช่วยแพตช์สถานะช่องทาง |
    | `plugin-sdk/config-contracts` | พื้นผิวการตั้งค่าแบบชนิดเท่านั้นที่เจาะจง สำหรับรูปร่างการตั้งค่า Plugin เช่น `OpenClawConfig` และชนิดการตั้งค่าช่องทาง/ผู้ให้บริการ |
    | `plugin-sdk/plugin-config-runtime` | ตัวช่วยค้นหาการตั้งค่า Plugin ขณะรันไทม์ เช่น `requireRuntimeConfig`, `resolvePluginConfigObject` และ `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | ตัวช่วยแก้ไขการตั้งค่าแบบทรานแซกชัน เช่น `mutateConfigFile`, `replaceConfigFile` และ `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | สตริงคำใบ้เมตาดาทาการส่งมอบเครื่องมือข้อความที่ใช้ร่วมกัน |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วยสแนปช็อตการตั้งค่าโพรเซสปัจจุบัน เช่น `getRuntimeConfig`, `getRuntimeConfigSnapshot` และตัวตั้งค่าสแนปช็อตสำหรับทดสอบ |
    | `plugin-sdk/telegram-command-config` | การปรับชื่อ/คำอธิบายคำสั่ง Telegram ให้อยู่ในรูปมาตรฐาน และการตรวจสอบรายการซ้ำ/ข้อขัดแย้ง แม้เมื่อพื้นผิวสัญญา Telegram แบบบันเดิลไม่พร้อมใช้งาน |
    | `plugin-sdk/text-autolink-runtime` | การตรวจจับลิงก์อัตโนมัติของการอ้างอิงไฟล์ โดยไม่ใช้บาร์เรลข้อความแบบกว้าง |
    | `plugin-sdk/approval-reaction-runtime` | การผูกปฏิกิริยาการอนุมัติแบบฮาร์ดโค้ด เพย์โหลดพรอมป์ปฏิกิริยา ที่เก็บเป้าหมายปฏิกิริยา และการส่งออกเพื่อความเข้ากันได้สำหรับการระงับพรอมป์การรันเนทีฟในเครื่อง |
    | `plugin-sdk/approval-runtime` | ตัวช่วยการอนุมัติการรัน/Plugin, ตัวสร้างความสามารถการอนุมัติ, ตัวช่วยการยืนยันตัวตน/โปรไฟล์, ตัวช่วยการกำหนดเส้นทาง/รันไทม์เนทีฟ และการจัดรูปแบบเส้นทางแสดงผลการอนุมัติแบบมีโครงสร้าง |
    | `plugin-sdk/reply-runtime` | ตัวช่วยรันไทม์ขาเข้า/ตอบกลับที่ใช้ร่วมกัน การแบ่งชิ้น การกระจาย Heartbeat ตัววางแผนการตอบกลับ |
    | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วยกระจาย/สรุปการตอบกลับและป้ายกำกับบทสนทนาแบบแคบ |
    | `plugin-sdk/reply-history` | ตัวช่วยประวัติการตอบกลับช่วงสั้นที่ใช้ร่วมกัน โค้ดรอบข้อความใหม่ควรใช้ `createChannelHistoryWindow`; ตัวช่วยแผนที่ระดับต่ำกว่ายังคงเป็นเพียงการส่งออกเพื่อความเข้ากันได้ที่เลิกใช้แล้ว |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ตัวช่วยแบ่งชิ้นข้อความ/Markdown แบบแคบ |
    | `plugin-sdk/session-store-runtime` | ตัวช่วยเวิร์กโฟลว์เซสชัน (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), การอ่านข้อความถอดเสียงผู้ใช้/ผู้ช่วยล่าสุดแบบมีขอบเขตตามตัวตนเซสชัน, ตัวช่วยเส้นทางที่เก็บเซสชันเดิม/คีย์เซสชัน, การอ่านค่า updated-at และตัวช่วยความเข้ากันได้ทั้งสโตร์/เส้นทางไฟล์สำหรับช่วงเปลี่ยนผ่านเท่านั้น |
    | `plugin-sdk/session-transcript-runtime` | ตัวตนข้อความถอดเสียง ตัวช่วยเป้าหมาย/อ่าน/เขียนตามขอบเขต การเผยแพร่การอัปเดต ล็อกการเขียน และคีย์การพบหน่วยความจำข้อความถอดเสียง |
    | `plugin-sdk/sqlite-runtime` | ตัวช่วยสคีมาเอเจนต์ เส้นทาง และทรานแซกชัน SQLite ที่เจาะจงสำหรับรันไทม์ของบุคคลที่หนึ่ง |
    | `plugin-sdk/cron-store-runtime` | ตัวช่วยเส้นทาง/โหลด/บันทึกที่เก็บ Cron |
    | `plugin-sdk/state-paths` | ตัวช่วยเส้นทางไดเรกทอรีสถานะ/OAuth |
    | `plugin-sdk/plugin-state-runtime` | ชนิดสถานะแบบคีย์ใน SQLite ไซด์คาร์ของ Plugin พร้อมการตั้งค่า pragma ของการเชื่อมต่อแบบรวมศูนย์และการบำรุงรักษา WAL สำหรับฐานข้อมูลที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/routing` | ตัวช่วยการผูกเส้นทาง/คีย์เซสชัน/บัญชี เช่น `resolveAgentRoute`, `buildAgentSessionKey` และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ตัวช่วยสรุปสถานะช่องทาง/บัญชีที่ใช้ร่วมกัน ค่าเริ่มต้นสถานะรันไทม์ และตัวช่วยเมตาดาทาปัญหา |
    | `plugin-sdk/target-resolver-runtime` | ตัวช่วยตัวแก้เป้าหมายที่ใช้ร่วมกัน |
    | `plugin-sdk/string-normalization-runtime` | ตัวช่วยปรับ slug/สตริงให้อยู่ในรูปมาตรฐาน |
    | `plugin-sdk/request-url` | ดึง URL แบบสตริงจากอินพุตที่คล้าย fetch/request |
    | `plugin-sdk/run-command` | ตัวรันคำสั่งแบบมีเวลา พร้อมผลลัพธ์ stdout/stderr ที่ปรับให้อยู่ในรูปมาตรฐาน |
    | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์เครื่องมือ/CLI ทั่วไป |
    | `plugin-sdk/tool-plugin` | กำหนด Plugin เครื่องมือเอเจนต์แบบมีชนิดอย่างง่าย และเปิดเผยเมตาดาทาคงที่สำหรับการสร้างแมนิเฟสต์ |
    | `plugin-sdk/tool-payload` | ดึงเพย์โหลดที่ปรับให้อยู่ในรูปมาตรฐานจากออบเจ็กต์ผลลัพธ์เครื่องมือ |
    | `plugin-sdk/tool-send` | ดึงฟิลด์เป้าหมายการส่งแบบ canonical จากอาร์กิวเมนต์เครื่องมือ |
    | `plugin-sdk/sandbox` | ชนิดแบ็กเอนด์แซนด์บ็อกซ์และตัวช่วยคำสั่ง SSH/OpenShell รวมถึงการตรวจล่วงหน้าคำสั่งรันแบบล้มเหลวเร็ว |
    | `plugin-sdk/temp-path` | ตัวช่วยเส้นทางดาวน์โหลดชั่วคราวที่ใช้ร่วมกันและพื้นที่ทำงานชั่วคราวที่ปลอดภัยแบบส่วนตัว |
    | `plugin-sdk/logging-core` | ตัวบันทึกเหตุการณ์ของระบบย่อยและตัวช่วยปกปิดข้อมูล |
    | `plugin-sdk/markdown-table-runtime` | โหมดตาราง Markdown และตัวช่วยแปลง |
    | `plugin-sdk/model-session-runtime` | ตัวช่วยแทนที่โมเดล/เซสชัน เช่น `applyModelOverrideToSessionEntry` และ `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | ตัวช่วยแก้การตั้งค่าผู้ให้บริการพูดคุย |
    | `plugin-sdk/json-store` | ตัวช่วยอ่าน/เขียนสถานะ JSON ขนาดเล็ก |
    | `plugin-sdk/json-unsafe-integers` | ตัวช่วยแยกวิเคราะห์ JSON ที่คงลิเทอรัลจำนวนเต็มที่ไม่ปลอดภัยไว้เป็นสตริง |
    | `plugin-sdk/file-lock` | ตัวช่วยล็อกไฟล์แบบเข้าใหม่ได้ |
    | `plugin-sdk/persistent-dedupe` | ตัวช่วยแคชตัดรายการซ้ำที่มีดิสก์รองรับ |
    | `plugin-sdk/acp-runtime` | ตัวช่วยรันไทม์/เซสชัน ACP และการกระจายการตอบกลับ |
    | `plugin-sdk/acp-runtime-backend` | ตัวช่วยลงทะเบียนแบ็กเอนด์ ACP แบบเบาและการกระจายการตอบกลับสำหรับ Plugin ที่โหลดตอนเริ่มต้น |
    | `plugin-sdk/acp-binding-resolve-runtime` | การแก้การผูก ACP แบบอ่านอย่างเดียวโดยไม่นำเข้าการเริ่มต้นวงจรชีวิต |
    | `plugin-sdk/agent-config-primitives` | primitive ของสคีมาการตั้งค่ารันไทม์เอเจนต์แบบแคบ |
    | `plugin-sdk/boolean-param` | ตัวอ่านพารามิเตอร์บูลีนแบบยืดหยุ่น |
    | `plugin-sdk/dangerous-name-runtime` | ตัวช่วยแก้การจับคู่ชื่ออันตราย |
    | `plugin-sdk/device-bootstrap` | ตัวช่วยบูตสแตรปอุปกรณ์และโทเค็นจับคู่ |
    | `plugin-sdk/extension-shared` | primitive ตัวช่วยช่องทางแบบพาสซีฟ สถานะ และพร็อกซีแวดล้อมที่ใช้ร่วมกัน |
    | `plugin-sdk/models-provider-runtime` | ตัวช่วยคำสั่ง/การตอบกลับของผู้ให้บริการ `/models` |
    | `plugin-sdk/skill-commands-runtime` | ตัวช่วยแสดงรายการคำสั่ง Skill |
    | `plugin-sdk/native-command-registry` | ตัวช่วยรีจิสทรี/สร้าง/ทำให้เป็นอนุกรมของคำสั่งเนทีฟ |
    | `plugin-sdk/agent-harness` | พื้นผิว Plugin ที่เชื่อถือได้แบบทดลองสำหรับฮาร์เนสเอเจนต์ระดับต่ำ: ชนิดฮาร์เนส, ตัวช่วยควบคุม/ยกเลิกงานที่กำลังทำงาน, ตัวช่วยบริดจ์เครื่องมือ OpenClaw, ตัวช่วยนโยบายเครื่องมือของแผนรันไทม์, การจัดประเภทผลลัพธ์เทอร์มินัล, ตัวช่วยจัดรูปแบบ/รายละเอียดความคืบหน้าเครื่องมือ และยูทิลิตีผลลัพธ์ความพยายาม |
    | `plugin-sdk/provider-zai-endpoint` | ส่วนครอบการตรวจจับ endpoint ที่ Z.AI provider เป็นเจ้าของซึ่งเลิกใช้แล้ว; ใช้ API สาธารณะของ Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | ตัวช่วยล็อก async เฉพาะโพรเซสสำหรับไฟล์สถานะรันไทม์ขนาดเล็ก |
    | `plugin-sdk/channel-activity-runtime` | ตัวช่วย telemetry กิจกรรมช่องทาง |
    | `plugin-sdk/concurrency-runtime` | ตัวช่วยจำกัด concurrency ของงาน async |
    | `plugin-sdk/dedupe-runtime` | ตัวช่วยแคชตัดรายการซ้ำในหน่วยความจำ |
    | `plugin-sdk/delivery-queue-runtime` | ตัวช่วย drain การส่งมอบขาออกที่รอดำเนินการ |
    | `plugin-sdk/file-access-runtime` | ตัวช่วยเส้นทางไฟล์ในเครื่องและแหล่งสื่อที่ปลอดภัย |
    | `plugin-sdk/heartbeat-runtime` | ตัวช่วยการปลุก เหตุการณ์ และการมองเห็นของ Heartbeat |
    | `plugin-sdk/number-runtime` | ตัวช่วยแปลงค่าบังคับเป็นตัวเลข |
    | `plugin-sdk/secure-random-runtime` | ตัวช่วยโทเค็น/UUID ที่ปลอดภัย |
    | `plugin-sdk/system-event-runtime` | ตัวช่วยคิวเหตุการณ์ระบบ |
    | `plugin-sdk/transport-ready-runtime` | ตัวช่วยรอความพร้อมของการขนส่ง |
    | `plugin-sdk/exec-approvals-runtime` | ตัวช่วยไฟล์นโยบายการอนุมัติการรัน โดยไม่ใช้บาร์เรล infra-runtime แบบกว้าง |
    | `plugin-sdk/infra-runtime` | ชิมความเข้ากันได้ที่เลิกใช้แล้ว; ใช้เส้นทางย่อยรันไทม์ที่เจาะจงด้านบน |
    | `plugin-sdk/collection-runtime` | ตัวช่วยแคชแบบมีขอบเขตขนาดเล็ก |
    | `plugin-sdk/diagnostic-runtime` | ตัวช่วยแฟล็กวินิจฉัย เหตุการณ์ และคอนเท็กซ์การติดตาม |
    | `plugin-sdk/error-runtime` | กราฟข้อผิดพลาด การจัดรูปแบบ ตัวช่วยจัดประเภทข้อผิดพลาดที่ใช้ร่วมกัน, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch ที่ครอบไว้ พร็อกซี ตัวเลือก EnvHttpProxyAgent และตัวช่วยค้นหาแบบตรึง |
    | `plugin-sdk/runtime-fetch` | fetch ของรันไทม์ที่รับรู้ dispatcher โดยไม่นำเข้าพร็อกซี/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | ตัวทำความสะอาด URL ข้อมูลรูปภาพแบบอินไลน์และตัวช่วยตรวจลายเซ็น โดยไม่มีพื้นผิวรันไทม์สื่อแบบกว้าง |
    | `plugin-sdk/response-limit-runtime` | ตัวอ่านเนื้อหาการตอบกลับแบบมีขอบเขต โดยไม่มีพื้นผิวรันไทม์สื่อแบบกว้าง |
    | `plugin-sdk/session-binding-runtime` | สถานะการผูกบทสนทนาปัจจุบัน โดยไม่มีการกำหนดเส้นทางการผูกที่ตั้งค่าไว้หรือที่เก็บการจับคู่ |
    | `plugin-sdk/session-store-runtime` | ตัวช่วยที่เก็บเซสชัน โดยไม่มีการเขียน/บำรุงรักษาการตั้งค่าแบบกว้าง |
    | `plugin-sdk/sqlite-runtime` | ตัวช่วยสคีมาเอเจนต์ เส้นทาง และทรานแซกชัน SQLite ที่เจาะจง โดยไม่มีการควบคุมวงจรชีวิตฐานข้อมูล |
    | `plugin-sdk/context-visibility-runtime` | การแก้การมองเห็นคอนเท็กซ์และการกรองคอนเท็กซ์เสริม โดยไม่นำเข้าการตั้งค่า/ความปลอดภัยแบบกว้าง |
    | `plugin-sdk/string-coerce-runtime` | ตัวช่วยบังคับแปลงและปรับ primitive record/สตริงให้อยู่ในรูปมาตรฐานแบบแคบ โดยไม่นำเข้า Markdown/การบันทึกเหตุการณ์ |
    | `plugin-sdk/host-runtime` | ตัวช่วยปรับชื่อโฮสต์และโฮสต์ SCP ให้อยู่ในรูปมาตรฐาน |
    | `plugin-sdk/retry-runtime` | ตัวช่วยการตั้งค่าการลองใหม่และตัวรันการลองใหม่ |
    | `plugin-sdk/agent-runtime` | ตัวช่วยไดเรกทอรี/ตัวตน/พื้นที่ทำงานของเอเจนต์ รวมถึง `resolveAgentDir`, `resolveDefaultAgentDir` และการส่งออกเพื่อความเข้ากันได้ที่เลิกใช้แล้ว `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | การค้นหา/ตัดรายการซ้ำของไดเรกทอรีที่อิงการตั้งค่า |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability and testing subpaths">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | ตัวช่วยที่ใช้ร่วมกันสำหรับดึง/แปลง/จัดเก็บสื่อ รวมถึง `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` และ `fetchRemoteMedia` ที่เลิกแนะนำแล้ว; ควรใช้ตัวช่วยการจัดเก็บก่อนอ่านบัฟเฟอร์เมื่อ URL ควรกลายเป็นสื่อของ OpenClaw |
    | `plugin-sdk/media-mime` | การทำให้ MIME เป็นมาตรฐานแบบจำกัด, การแมปนามสกุลไฟล์, การตรวจหา MIME และตัวช่วยชนิดสื่อ |
    | `plugin-sdk/media-store` | ตัวช่วยจัดเก็บสื่อแบบจำกัด เช่น `saveMediaBuffer` และ `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | ตัวช่วย failover สำหรับการสร้างสื่อที่ใช้ร่วมกัน, การเลือกตัวเลือก และข้อความเมื่อไม่มีโมเดล |
    | `plugin-sdk/media-understanding` | ประเภทผู้ให้บริการการทำความเข้าใจสื่อ พร้อมการส่งออกตัวช่วยสำหรับรูปภาพ/เสียง/การดึงข้อมูลแบบมีโครงสร้างที่มุ่งใช้กับผู้ให้บริการ |
    | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งส่วน/เรนเดอร์ข้อความและมาร์กดาวน์, การแปลงตารางมาร์กดาวน์, การลบแท็กคำสั่ง และยูทิลิตีข้อความที่ปลอดภัย |
    | `plugin-sdk/text-chunking` | ตัวช่วยแบ่งส่วนข้อความขาออก |
    | `plugin-sdk/speech` | ประเภทผู้ให้บริการเสียงพูด พร้อมการส่งออกคำสั่ง, registry, การตรวจสอบความถูกต้อง, ตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI และตัวช่วยเสียงพูดที่มุ่งใช้กับผู้ให้บริการ |
    | `plugin-sdk/speech-core` | ประเภทผู้ให้บริการเสียงพูด, registry, คำสั่ง, การทำให้เป็นมาตรฐาน และการส่งออกตัวช่วยเสียงพูดที่ใช้ร่วมกัน |
    | `plugin-sdk/realtime-transcription` | ประเภทผู้ให้บริการถอดเสียงแบบเรียลไทม์, ตัวช่วย registry และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
    | `plugin-sdk/realtime-bootstrap-context` | ตัวช่วยบูตสแตรปโปรไฟล์แบบเรียลไทม์สำหรับการฉีดบริบท `IDENTITY.md`, `USER.md` และ `SOUL.md` แบบมีขอบเขต |
    | `plugin-sdk/realtime-voice` | ประเภทผู้ให้บริการเสียงแบบเรียลไทม์, ตัวช่วย registry และตัวช่วยพฤติกรรมเสียงแบบเรียลไทม์ที่ใช้ร่วมกัน รวมถึงการติดตามกิจกรรมเอาต์พุต |
    | `plugin-sdk/image-generation` | ประเภทผู้ให้บริการสร้างรูปภาพ พร้อมตัวช่วย asset รูปภาพ/URL ข้อมูล และตัวสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
    | `plugin-sdk/image-generation-core` | ประเภทการสร้างรูปภาพ, failover, auth และตัวช่วย registry ที่ใช้ร่วมกัน |
    | `plugin-sdk/music-generation` | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างเพลง |
    | `plugin-sdk/music-generation-core` | ประเภทการสร้างเพลง, ตัวช่วย failover, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref ที่ใช้ร่วมกัน |
    | `plugin-sdk/video-generation` | ประเภทผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างวิดีโอ |
    | `plugin-sdk/video-generation-core` | ประเภทการสร้างวิดีโอ, ตัวช่วย failover, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref ที่ใช้ร่วมกัน |
    | `plugin-sdk/transcripts` | ประเภทผู้ให้บริการแหล่งที่มาของ transcript, ตัวช่วย registry, ตัวบรรยายเซสชัน และเมทาดาทาของถ้อยคำที่ใช้ร่วมกัน |
    | `plugin-sdk/webhook-targets` | registry เป้าหมาย Webhook และตัวช่วยติดตั้ง route |
    | `plugin-sdk/webhook-path` | alias ความเข้ากันได้ที่เลิกแนะนำแล้ว; ใช้ `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | ตัวช่วยโหลดสื่อระยะไกล/ภายในเครื่องที่ใช้ร่วมกัน |
    | `plugin-sdk/zod` | การส่งออกซ้ำเพื่อความเข้ากันได้ที่เลิกแนะนำแล้ว; import `zod` จาก `zod` โดยตรง |
    | `plugin-sdk/testing` | barrel ความเข้ากันได้แบบ repo-local ที่เลิกแนะนำแล้วสำหรับการทดสอบ OpenClaw แบบเดิม การทดสอบใหม่ใน repo ควร import เส้นทางย่อยทดสอบภายในที่เฉพาะเจาะจง เช่น `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` หรือ `plugin-sdk/test-fixtures` แทน |
    | `plugin-sdk/plugin-test-api` | ตัวช่วย `createTestPluginApi` ขั้นต่ำแบบ repo-local สำหรับการทดสอบหน่วยการลงทะเบียน Plugin โดยตรง โดยไม่ต้อง import bridge ตัวช่วยทดสอบของ repo |
    | `plugin-sdk/agent-runtime-test-contracts` | fixture สัญญา adapter ของ agent-runtime แบบเนทีฟ repo-local สำหรับการทดสอบ auth, การส่งมอบ, fallback, tool-hook, prompt-overlay, schema และการฉาย transcript |
    | `plugin-sdk/channel-test-helpers` | ตัวช่วยทดสอบแบบ repo-local ที่มุ่งเน้น channel สำหรับสัญญา action/setup/status ทั่วไป, การยืนยัน directory, วงจรชีวิตการเริ่มต้นบัญชี, send-config threading, mock runtime, ปัญหา status, การส่งมอบขาออก และการลงทะเบียน hook |
    | `plugin-sdk/channel-target-testing` | ชุดกรณีข้อผิดพลาดการแก้เป้าหมายที่ใช้ร่วมกันแบบ repo-local สำหรับการทดสอบ channel |
    | `plugin-sdk/plugin-test-contracts` | ตัวช่วยสัญญาแบบ repo-local สำหรับแพ็กเกจ Plugin, การลงทะเบียน, artifact สาธารณะ, direct import, runtime API และผลข้างเคียงจากการ import |
    | `plugin-sdk/provider-test-contracts` | ตัวช่วยสัญญาแบบ repo-local สำหรับ runtime ผู้ให้บริการ, auth, discovery, onboard, catalog, wizard, ความสามารถสื่อ, นโยบาย replay, realtime STT live-audio, web-search/fetch และ stream |
    | `plugin-sdk/provider-http-test-mocks` | mock HTTP/auth ของ Vitest แบบ opt-in repo-local สำหรับการทดสอบผู้ให้บริการที่ทดสอบ `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | fixture แบบ repo-local ทั่วไปสำหรับการจับ runtime ของ CLI, บริบท sandbox, ตัวเขียน skill, agent-message, system-event, การโหลดโมดูลซ้ำ, เส้นทาง Plugin ที่บันเดิลไว้, terminal-text, การแบ่งส่วน, auth-token และ typed-case |
    | `plugin-sdk/test-node-mocks` | ตัวช่วย mock builtin ของ Node แบบเฉพาะเจาะจง repo-local สำหรับใช้ภายใน factory ของ Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Memory subpaths">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/memory-core` | พื้นผิวตัวช่วย memory-core ที่บันเดิลไว้สำหรับตัวช่วย manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade runtime สำหรับดัชนี/การค้นหา memory |
    | `plugin-sdk/memory-core-host-embedding-registry` | ตัวช่วย registry ผู้ให้บริการ embedding ของ memory แบบน้ำหนักเบา |
    | `plugin-sdk/memory-core-host-engine-foundation` | การส่งออก engine foundation ของ host memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | สัญญา embedding ของ host memory, การเข้าถึง registry, ผู้ให้บริการภายในเครื่อง และตัวช่วย batch/remote ทั่วไป `registerMemoryEmbeddingProvider` บนพื้นผิวนี้เลิกแนะนำแล้ว; ใช้ API ผู้ให้บริการ embedding ทั่วไปสำหรับผู้ให้บริการใหม่ |
    | `plugin-sdk/memory-core-host-engine-qmd` | การส่งออก engine QMD ของ host memory |
    | `plugin-sdk/memory-core-host-engine-storage` | การส่งออก engine storage ของ host memory |
    | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วย multimodal ของ host memory |
    | `plugin-sdk/memory-core-host-query` | ตัวช่วย query ของ host memory |
    | `plugin-sdk/memory-core-host-secret` | ตัวช่วย secret ของ host memory |
    | `plugin-sdk/memory-core-host-events` | alias ความเข้ากันได้ที่เลิกแนะนำแล้ว; ใช้ `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | ตัวช่วย status ของ host memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | ตัวช่วย runtime CLI ของ host memory |
    | `plugin-sdk/memory-core-host-runtime-core` | ตัวช่วย runtime core ของ host memory |
    | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วย file/runtime ของ host memory |
    | `plugin-sdk/memory-host-core` | alias ที่เป็นกลางต่อ vendor สำหรับตัวช่วย runtime core ของ host memory |
    | `plugin-sdk/memory-host-events` | alias ที่เป็นกลางต่อ vendor สำหรับตัวช่วย event journal ของ host memory |
    | `plugin-sdk/memory-host-files` | alias ความเข้ากันได้ที่เลิกแนะนำแล้ว; ใช้ `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | ตัวช่วย managed-markdown ที่ใช้ร่วมกันสำหรับ Plugin ที่อยู่ใกล้เคียงกับ memory |
    | `plugin-sdk/memory-host-search` | facade runtime ของ Active Memory สำหรับการเข้าถึง search-manager |
    | `plugin-sdk/memory-host-status` | alias ความเข้ากันได้ที่เลิกแนะนำแล้ว; ใช้ `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Reserved bundled-helper subpaths">
    เส้นทางย่อย SDK ของ bundled-helper ที่สงวนไว้เป็นพื้นผิวเฉพาะเจ้าของแบบจำกัดสำหรับ
    โค้ด Plugin ที่บันเดิลไว้ เส้นทางเหล่านี้ถูกติดตามใน inventory ของ SDK เพื่อให้การ build
    แพ็กเกจและการทำ alias คงความกำหนดได้ แต่ไม่ใช่ API สำหรับสร้าง Plugin
    ทั่วไป สัญญา host ที่ใช้ซ้ำได้ใหม่ควรใช้เส้นทางย่อย SDK ทั่วไป
    เช่น `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` และ
    `plugin-sdk/plugin-config-runtime`

    | เส้นทางย่อย | เจ้าของและวัตถุประสงค์ |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | ตัวช่วย Plugin Codex ที่บันเดิลไว้สำหรับฉาย config เซิร์ฟเวอร์ MCP ของผู้ใช้เข้าสู่ config thread ของ app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | ตัวช่วย Plugin Codex ที่บันเดิลไว้สำหรับสะท้อน subagent แบบเนทีฟของ app-server Codex ไปยังสถานะงานของ OpenClaw |

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
