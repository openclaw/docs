---
read_when:
    - การเลือกเส้นทางย่อย plugin-sdk ที่เหมาะสมสำหรับการนำเข้า Plugin
    - กำลังตรวจสอบเส้นทางย่อยของ bundled Plugin และพื้นผิวตัวช่วย
summary: 'แค็ตตาล็อกพาธย่อยของ Plugin SDK: import ใดอยู่ที่ไหน โดยจัดกลุ่มตามพื้นที่'
title: พาธย่อยของ Plugin SDK
x-i18n:
    generated_at: "2026-07-01T08:44:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 689af6c9c17eb6b3231c5f445d7de0af97d1a8a087bdbc26640851d4b11ada2b
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK ถูกเปิดเผยเป็นชุดพาธย่อยสาธารณะแบบแคบภายใต้
`openclaw/plugin-sdk/` หน้านี้จัดทำแคตตาล็อกพาธย่อยที่ใช้กันทั่วไป โดยจัดกลุ่มตาม
วัตถุประสงค์ รายการจุดเข้าของคอมไพเลอร์ที่สร้างขึ้นอยู่ใน
`scripts/lib/plugin-sdk-entrypoints.json`; exports ของแพ็กเกจคือส่วนย่อยสาธารณะ
หลังจากหักพาธย่อยสำหรับการทดสอบ/ภายในที่ใช้เฉพาะในรีโป ซึ่งแสดงอยู่ใน
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` ผู้ดูแลสามารถตรวจสอบ
จำนวน export สาธารณะได้ด้วย `pnpm plugin-sdk:surface` และตรวจสอบพาธย่อยตัวช่วยที่สงวนไว้ซึ่งยังใช้งานอยู่ได้ด้วย
`pnpm plugins:boundary-report:summary`; export ตัวช่วยที่สงวนไว้แต่ไม่ได้ใช้งานจะทำให้รายงาน CI ล้มเหลว
แทนที่จะคงอยู่ใน SDK สาธารณะในฐานะหนี้ความเข้ากันได้ที่หยุดนิ่ง

สำหรับคู่มือการสร้าง Plugin โปรดดู [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## จุดเข้า Plugin

| พาธย่อย                        | exports สำคัญ                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | ตัวช่วยรายการผู้ให้บริการการย้ายข้อมูล เช่น `createMigrationItem`, ค่าคงที่เหตุผล, ตัวทำเครื่องหมายสถานะรายการ, ตัวช่วยการปกปิดข้อมูล และ `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | ตัวช่วยการย้ายข้อมูลของรันไทม์ เช่น `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` และ `writeMigrationReport`                                              |
| `plugin-sdk/health`            | การลงทะเบียน การตรวจจับ การซ่อมแซม การเลือก ความรุนแรง และชนิดของผลตรวจสำหรับการตรวจสุขภาพของ doctor สำหรับผู้บริโภคสุขภาพที่บันเดิลไว้                                               |

### ตัวช่วยความเข้ากันได้ที่เลิกใช้แล้วและตัวช่วยทดสอบ

พาธย่อยที่เลิกใช้แล้วจะยังคงถูก export สำหรับ Plugin รุ่นเก่า แต่โค้ดใหม่ควรใช้
พาธย่อย SDK ที่มีขอบเขตชัดเจนด้านล่าง รายการที่ดูแลอยู่คือ
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI จะปฏิเสธการ import
สำหรับโปรดักชันที่บันเดิลไว้จากรายการนี้ barrel แบบกว้าง เช่น `compat`, `config-types`,
`infra-runtime`, `text-runtime` และ `zod` มีไว้เพื่อความเข้ากันได้เท่านั้น ให้ import `zod`
โดยตรงจาก `zod`

พาธย่อยตัวช่วยทดสอบของ OpenClaw ที่รองรับด้วย Vitest ใช้เฉพาะในรีโปเท่านั้น และไม่ใช่
exports ของแพ็กเกจอีกต่อไป: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` และ `testing`

### พาธย่อยตัวช่วย Plugin ที่บันเดิลไว้ซึ่งถูกสงวนไว้

พาธย่อยเหล่านี้เป็นพื้นผิวความเข้ากันได้ที่ Plugin เป็นเจ้าของ สำหรับ Plugin ที่บันเดิลไว้ซึ่งเป็นเจ้าของ
ไม่ใช่ API ของ SDK ทั่วไป: `plugin-sdk/codex-mcp-projection` และ
`plugin-sdk/codex-native-task-runtime` การ import ข้ามส่วนขยายที่มีเจ้าของคนละรายจะถูกบล็อก
โดยแนวป้องกันสัญญาของแพ็กเกจ

<AccordionGroup>
  <Accordion title="พาธย่อยของช่องทาง">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | การส่งออกสคีมา Zod ของ `openclaw.json` ระดับราก (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | ตัวช่วยตรวจสอบ JSON Schema แบบแคชสำหรับสคีมาที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | ตัวช่วยวิซาร์ดตั้งค่าที่ใช้ร่วมกัน ตัวแปลการตั้งค่า พรอมป์รายการอนุญาต และตัวสร้างสถานะการตั้งค่า |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | นามแฝงสำหรับความเข้ากันได้ที่เลิกใช้แล้ว; ใช้ `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | ตัวช่วยคอนฟิกหลายบัญชี/เกตการดำเนินการ และตัวช่วย fallback บัญชีเริ่มต้น |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID` และตัวช่วยปรับ account-id ให้เป็นมาตรฐาน |
    | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชีและ default-fallback |
    | `plugin-sdk/account-helpers` | ตัวช่วยรายการบัญชี/การดำเนินการบัญชีแบบแคบ |
    | `plugin-sdk/access-groups` | ตัวช่วยแยกวิเคราะห์รายการอนุญาตของกลุ่มการเข้าถึงและวินิจฉัยกลุ่มแบบปกปิดข้อมูล |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | ฟาซาดสำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | พื้นฐานสคีมาคอนฟิกช่องทางที่ใช้ร่วมกัน รวมถึงตัวสร้าง Zod และ JSON/TypeBox โดยตรง |
    | `plugin-sdk/bundled-channel-config-schema` | สคีมาคอนฟิกช่องทาง OpenClaw ที่รวมมาในชุด สำหรับ Plugin แบบรวมชุดที่ดูแลอยู่เท่านั้น |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId` id ช่องแชทแบบรวมชุด/ทางการตามแบบแผน รวมถึงป้ายกำกับ/นามแฝงตัวจัดรูปแบบสำหรับ Plugin ที่ต้องรู้จำข้อความที่มีคำนำหน้า envelope โดยไม่ต้องฮาร์ดโค้ดตารางของตนเอง |
    | `plugin-sdk/channel-config-schema-legacy` | นามแฝงสำหรับความเข้ากันได้ที่เลิกใช้แล้วสำหรับสคีมาคอนฟิกช่องทางแบบรวมชุด |
    | `plugin-sdk/telegram-command-config` | ตัวช่วยปรับคำสั่งกำหนดเองของ Telegram ให้เป็นมาตรฐาน/ตรวจสอบความถูกต้อง พร้อม fallback ตามสัญญาแบบรวมชุด |
    | `plugin-sdk/command-gating` | ตัวช่วยเกตการอนุญาตคำสั่งแบบแคบ |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | ฟาซาดความเข้ากันได้สำหรับ ingress ช่องทางระดับต่ำที่เลิกใช้แล้ว พาธรับใหม่ควรใช้ `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/channel-ingress-runtime` | ตัวแก้ไข runtime ingress ช่องทางระดับสูงแบบทดลอง และตัวสร้างข้อเท็จจริงของเส้นทางสำหรับพาธรับช่องทางที่ย้ายแล้ว ควรใช้สิ่งนี้แทนการประกอบรายการอนุญาตที่มีผลจริง รายการอนุญาตคำสั่ง และการฉายภาพ legacy ในแต่ละ Plugin ดู [API ingress ช่องทาง](/th/plugins/sdk-channel-ingress) |
    | `plugin-sdk/channel-lifecycle` | ฟาซาดสำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-outbound` | สัญญาวงจรชีวิตข้อความ รวมถึงตัวเลือก reply pipeline, ใบรับ, พรีวิวสด/สตรีมมิง, ตัวช่วยวงจรชีวิต, อัตลักษณ์ขาออก, การวางแผน payload, การส่งแบบคงทน และตัวช่วยบริบทการส่งข้อความ ดู [API ขาออกของช่องทาง](/th/plugins/sdk-channel-outbound) |
    | `plugin-sdk/channel-message` | นามแฝงสำหรับความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `plugin-sdk/channel-outbound` รวมถึงฟาซาดส่งต่อ reply แบบ legacy |
    | `plugin-sdk/channel-message-runtime` | นามแฝงสำหรับความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `plugin-sdk/channel-outbound` รวมถึงฟาซาดส่งต่อ reply แบบ legacy |
    | `plugin-sdk/inbound-envelope` | ตัวช่วย route ขาเข้าและตัวสร้าง envelope ที่ใช้ร่วมกัน |
    | `plugin-sdk/inbound-reply-dispatch` | ฟาซาดสำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-inbound` สำหรับตัวรันขาเข้าและ predicate การส่งต่อ และใช้ `plugin-sdk/channel-outbound` สำหรับตัวช่วยส่งข้อความ |
    | `plugin-sdk/messaging-targets` | นามแฝงการแยกวิเคราะห์เป้าหมายที่เลิกใช้แล้ว; ใช้ `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | ตัวช่วยโหลดสื่อขาออกและสถานะ hosted-media ที่ใช้ร่วมกัน |
    | `plugin-sdk/outbound-send-deps` | ฟาซาดสำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/outbound-runtime` | ฟาซาดสำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/poll-runtime` | ตัวช่วยปรับ poll ให้เป็นมาตรฐานแบบแคบ |
    | `plugin-sdk/thread-bindings-runtime` | ตัวช่วยวงจรชีวิต thread-binding และอะแดปเตอร์ |
    | `plugin-sdk/agent-media-payload` | ตัวสร้าง payload สื่อของเอเจนต์แบบ legacy |
    | `plugin-sdk/conversation-runtime` | ตัวช่วย conversation/thread binding, pairing และ configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วย snapshot คอนฟิก runtime |
    | `plugin-sdk/runtime-group-policy` | ตัวช่วยแก้ไข group-policy ของ runtime |
    | `plugin-sdk/channel-status` | ตัวช่วย snapshot/summary สถานะช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/channel-config-primitives` | พื้นฐาน channel config-schema แบบแคบ |
    | `plugin-sdk/channel-config-writes` | ตัวช่วยอนุญาตการเขียนคอนฟิกช่องทาง |
    | `plugin-sdk/channel-plugin-common` | การส่งออก prelude ของ Plugin ช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/allowlist-config-edit` | ตัวช่วยแก้ไข/อ่านคอนฟิกรายการอนุญาต |
    | `plugin-sdk/group-access` | ตัวช่วยตัดสินใจ group-access ที่ใช้ร่วมกัน |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | ฟาซาดสำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-inbound` |
    | `plugin-sdk/direct-dm-guard-policy` | ตัวช่วยนโยบาย guard ของ direct-DM ก่อนเข้ารหัสแบบแคบ |
    | `plugin-sdk/discord` | ฟาซาดความเข้ากันได้ของ Discord ที่เลิกใช้แล้วสำหรับ `@openclaw/discord@2026.3.13` ที่เผยแพร่แล้วและความเข้ากันได้ของเจ้าของที่ติดตามอยู่; Plugin ใหม่ควรใช้พาธย่อย SDK ช่องทางทั่วไป |
    | `plugin-sdk/telegram-account` | ฟาซาดความเข้ากันได้ของการแก้ไขบัญชี Telegram ที่เลิกใช้แล้วสำหรับความเข้ากันได้ของเจ้าของที่ติดตามอยู่; Plugin ใหม่ควรใช้ตัวช่วย runtime ที่ฉีดเข้ามาหรือพาธย่อย SDK ช่องทางทั่วไป |
    | `plugin-sdk/zalouser` | ฟาซาดความเข้ากันได้ของ Zalo Personal ที่เลิกใช้แล้วสำหรับแพ็กเกจ Lark/Zalo ที่เผยแพร่แล้วซึ่งยังนำเข้าการอนุญาตคำสั่งผู้ส่ง; Plugin ใหม่ควรใช้ `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | การนำเสนอ การส่งมอบ และตัวช่วย reply แบบโต้ตอบ legacy ที่มีความหมายเชิง semantic ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | ตัวช่วยขาเข้าที่ใช้ร่วมกันสำหรับการจำแนกเหตุการณ์ การสร้างบริบท การจัดรูปแบบ ราก debounce การจับคู่ mention นโยบาย mention และการบันทึกขาเข้า |
    | `plugin-sdk/channel-inbound-debounce` | ตัวช่วย debounce ขาเข้าแบบแคบ |
    | `plugin-sdk/channel-mention-gating` | ตัวช่วยนโยบาย mention, marker mention และข้อความ mention แบบแคบ โดยไม่มีพื้นผิว runtime ขาเข้าที่กว้างกว่า |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | ฟาซาดสำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-inbound` หรือ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-pairing-paths` | ฟาซาดสำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-pairing` |
    | `plugin-sdk/channel-reply-options-runtime` | ฟาซาดสำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-streaming` | ฟาซาดสำหรับความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-send-result` | ชนิดผลลัพธ์ reply |
    | `plugin-sdk/channel-actions` | ตัวช่วย message-action ของช่องทาง รวมถึงตัวช่วยสคีมา native ที่เลิกใช้แล้วซึ่งเก็บไว้เพื่อความเข้ากันได้ของ Plugin |
    | `plugin-sdk/channel-route` | ตัวช่วยการปรับ route ให้เป็นมาตรฐาน การแก้ไขเป้าหมายที่ขับเคลื่อนด้วย parser การแปลง thread-id เป็นสตริง คีย์ route แบบกำจัดซ้ำ/ย่อ ชนิด parsed-target และการเปรียบเทียบ route/target ที่ใช้ร่วมกัน |
    | `plugin-sdk/channel-targets` | ตัวช่วยแยกวิเคราะห์เป้าหมาย; ผู้เรียกที่เปรียบเทียบ route ควรใช้ `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | ชนิดสัญญาช่องทาง |
    | `plugin-sdk/channel-feedback` | การเชื่อมต่อ feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วย secret-contract แบบแคบ เช่น `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` และชนิดเป้าหมาย secret |
  </Accordion>

ตระกูลตัวช่วยช่องทางที่เลิกใช้แล้วยังคงพร้อมใช้งานเฉพาะเพื่อความเข้ากันได้กับ Plugin ที่เผยแพร่แล้วเท่านั้น แผนการนำออกคือ: เก็บไว้ตลอดช่วงเวลาการย้าย Plugin ภายนอก รักษา Plugin ใน repo/แบบรวมชุดให้อยู่บน `channel-inbound` และ `channel-outbound` จากนั้นนำพาธย่อยความเข้ากันได้ออกในการทำความสะอาด SDK ครั้งใหญ่ถัดไป ข้อนี้ใช้กับตระกูล channel message/runtime, channel streaming, direct-DM access, ชิ้นส่วนตัวช่วยขาเข้า, reply-options และ pairing-path แบบเก่า

  <Accordion title="พาธย่อยของผู้ให้บริการ">
    | พาธย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | ฟาซาดผู้ให้บริการ LM Studio ที่รองรับสำหรับการตั้งค่า การค้นพบแคตตาล็อก และการเตรียมโมเดลในรันไทม์ |
    | `plugin-sdk/lmstudio-runtime` | ฟาซาดรันไทม์ LM Studio ที่รองรับสำหรับค่าเริ่มต้นของเซิร์ฟเวอร์ภายใน การค้นพบโมเดล ส่วนหัวคำขอ และตัวช่วยสำหรับโมเดลที่โหลดแล้ว |
    | `plugin-sdk/provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการภายใน/โฮสต์เองที่คัดสรรแล้ว |
    | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการที่โฮสต์เองและเข้ากันได้กับ OpenAI แบบเจาะจง |
    | `plugin-sdk/cli-backend` | ค่าเริ่มต้นของแบ็กเอนด์ CLI + ค่าคงที่ watchdog |
    | `plugin-sdk/provider-auth-runtime` | ตัวช่วยแก้ไข API key ในรันไทม์สำหรับ Plugin ผู้ให้บริการ |
    | `plugin-sdk/provider-oauth-runtime` | ชนิด callback OAuth ทั่วไปของผู้ให้บริการ การเรนเดอร์หน้า callback ตัวช่วย PKCE/state การแยกวิเคราะห์ authorization input ตัวช่วย token expiry และตัวช่วย abort |
    | `plugin-sdk/provider-auth-api-key` | ตัวช่วย onboarding/API-key profile-write เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | ตัวสร้าง auth-result มาตรฐานของ OAuth |
    | `plugin-sdk/provider-env-vars` | ตัวช่วยค้นหา env-var สำหรับการยืนยันตัวตนของผู้ให้บริการ |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, ตัวช่วยนำเข้าการยืนยันตัวตน OpenAI Codex, รายการส่งออกความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้าง replay-policy ที่ใช้ร่วมกัน, ตัวช่วย provider-endpoint และตัวช่วย normalization สำหรับ model-id ที่ใช้ร่วมกัน |
    | `plugin-sdk/provider-catalog-live-runtime` | ตัวช่วยแคตตาล็อกโมเดลผู้ให้บริการแบบสดสำหรับการค้นพบสไตล์ `/models` ที่มีการป้องกัน: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, การกรอง model-id, แคช TTL และ fallback แบบสแตติก |
    | `plugin-sdk/provider-catalog-runtime` | hook รันไทม์สำหรับการเสริมแคตตาล็อกผู้ให้บริการ และ seam ของ registry plugin-provider สำหรับการทดสอบ contract |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | ตัวช่วยความสามารถ HTTP/endpoint ของผู้ให้บริการทั่วไป ข้อผิดพลาด HTTP ของผู้ให้บริการ และตัวช่วยฟอร์ม multipart สำหรับถอดเสียงเสียง |
    | `plugin-sdk/provider-web-fetch-contract` | ตัวช่วย contract สำหรับ config/selection ของ web-fetch แบบแคบ เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | ตัวช่วยลงทะเบียน/แคชผู้ให้บริการ web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วย config/credential ของ web-search แบบแคบสำหรับผู้ให้บริการที่ไม่ต้องใช้การต่อสาย plugin-enable |
    | `plugin-sdk/provider-web-search-contract` | ตัวช่วย contract สำหรับ config/credential ของ web-search แบบแคบ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และ setter/getter ของ credential แบบกำหนดขอบเขต |
    | `plugin-sdk/provider-web-search` | ตัวช่วยลงทะเบียน/แคช/รันไทม์สำหรับผู้ให้บริการ web-search |
    | `plugin-sdk/embedding-providers` | ชนิดผู้ให้บริการ embedding ทั่วไปและตัวช่วยอ่าน รวมถึง `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` และ `listEmbeddingProviders(...)`; Plugin ลงทะเบียนผู้ให้บริการผ่าน `api.registerEmbeddingProvider(...)` เพื่อบังคับใช้ความเป็นเจ้าของตาม manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` และการล้าง schema + diagnostics ของ DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | ชนิด snapshot การใช้งานของผู้ให้บริการ ตัวช่วย fetch การใช้งานที่ใช้ร่วมกัน และ fetcher ของผู้ให้บริการ เช่น `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ชนิด stream wrapper, ความเข้ากันได้ของ tool-call แบบข้อความล้วน และตัวช่วย wrapper ที่ใช้ร่วมกันสำหรับ Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | ตัวช่วย provider stream wrapper สาธารณะที่ใช้ร่วมกัน รวมถึง `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` และยูทิลิตี stream ที่เข้ากันได้กับ Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | ตัวช่วย transport ผู้ให้บริการแบบ native เช่น guarded fetch, การแยกข้อความ tool-result, การแปลงข้อความ transport และสตรีมเหตุการณ์ transport ที่เขียนได้ |
    | `plugin-sdk/provider-onboard` | ตัวช่วย patch config สำหรับ onboarding |
    | `plugin-sdk/global-singleton` | ตัวช่วย singleton/map/cache ภายในกระบวนการ |
    | `plugin-sdk/group-activation` | ตัวช่วย mode การเปิดใช้งานกลุ่มและการแยกวิเคราะห์คำสั่งแบบแคบ |
  </Accordion>

snapshot การใช้งานของผู้ให้บริการโดยปกติจะรายงาน quota `windows` อย่างน้อยหนึ่งรายการ โดยแต่ละรายการมี
ป้ายกำกับ เปอร์เซ็นต์ที่ใช้แล้ว และเวลารีเซ็ตที่ระบุได้ ผู้ให้บริการที่เปิดเผยข้อความยอดคงเหลือหรือ
สถานะบัญชีแทนหน้าต่าง quota ที่รีเซ็ตได้ ควรคืนค่า
`summary` พร้อมอาร์เรย์ `windows` ว่าง แทนการสร้างเปอร์เซ็นต์ขึ้นมาเอง
OpenClaw จะแสดงข้อความสรุปนั้นในเอาต์พุตสถานะ; ใช้ `error` เฉพาะเมื่อ
endpoint การใช้งานล้มเหลวหรือไม่ส่งคืนข้อมูลการใช้งานที่ใช้ได้

  <Accordion title="พาธย่อยการยืนยันตัวตนและความปลอดภัย">
    | พาธย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, ตัวช่วย command registry รวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก, ตัวช่วย sender-authorization |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความคำสั่ง/ความช่วยเหลือ เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | ตัวช่วยแก้ไขผู้อนุมัติและ action-auth ในแชตเดียวกัน |
    | `plugin-sdk/approval-client-runtime` | ตัวช่วย profile/filter สำหรับการอนุมัติ native exec |
    | `plugin-sdk/approval-delivery-runtime` | อะแดปเตอร์ capability/delivery สำหรับการอนุมัติแบบ native |
    | `plugin-sdk/approval-gateway-runtime` | ตัวช่วยแก้ไข Gateway การอนุมัติที่ใช้ร่วมกัน |
    | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยโหลดอะแดปเตอร์การอนุมัติแบบ native น้ำหนักเบาสำหรับ entrypoint ของช่องทางที่เป็น hot path |
    | `plugin-sdk/approval-handler-runtime` | ตัวช่วยรันไทม์ approval handler ที่กว้างกว่า; ควรใช้ seam ของ adapter/gateway ที่แคบกว่าเมื่อเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | ตัวช่วย target การอนุมัติแบบ native, account-binding, route-gate, forwarding fallback และการระงับ prompt ของ local native exec |
    | `plugin-sdk/approval-reaction-runtime` | การผูก reaction การอนุมัติแบบ hardcoded, payload prompt ของ reaction, store ของ target reaction และรายการส่งออกความเข้ากันได้สำหรับการระงับ prompt ของ local native exec |
    | `plugin-sdk/approval-reply-runtime` | ตัวช่วย payload ตอบกลับการอนุมัติ exec/plugin |
    | `plugin-sdk/approval-runtime` | ตัวช่วย payload การอนุมัติ exec/plugin, ตัวช่วย routing/runtime การอนุมัติแบบ native และตัวช่วยแสดงผลการอนุมัติแบบมีโครงสร้าง เช่น `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | ตัวช่วยรีเซ็ต dedupe ของการตอบกลับ inbound แบบแคบ |
    | `plugin-sdk/channel-contract-testing` | ตัวช่วยทดสอบ channel contract แบบแคบ โดยไม่มี barrel ทดสอบขนาดใหญ่ |
    | `plugin-sdk/command-auth-native` | การยืนยันตัวตนคำสั่งแบบ native, การจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก และตัวช่วย session-target แบบ native |
    | `plugin-sdk/command-detection` | ตัวช่วยตรวจจับคำสั่งที่ใช้ร่วมกัน |
    | `plugin-sdk/command-primitives-runtime` | predicate ข้อความคำสั่งน้ำหนักเบาสำหรับ path ช่องทางที่เป็น hot path |
    | `plugin-sdk/command-surface` | การทำให้ command-body เป็นรูปแบบมาตรฐานและตัวช่วย command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | ตัวช่วยรวบรวม secret-contract แบบแคบสำหรับพื้นผิว secret ของ channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | ตัวช่วย `coerceSecretRef` แบบแคบและตัวช่วย typing ของ SecretRef สำหรับการแยกวิเคราะห์ secret-contract/config |
    | `plugin-sdk/secret-provider-integration` | contract manifest และ preset ของการผสานรวมผู้ให้บริการ SecretRef แบบ type-only สำหรับ Plugin ที่เผยแพร่ preset ผู้ให้บริการ secret ภายนอก |
    | `plugin-sdk/security-runtime` | ตัวช่วย trust ที่ใช้ร่วมกัน, การกั้น DM, ตัวช่วยไฟล์/พาธที่จำกัดด้วย root รวมถึงการเขียนแบบ create-only, การแทนที่ไฟล์ atomic แบบ sync/async, การเขียน temp sibling, fallback สำหรับการย้ายข้ามอุปกรณ์, ตัวช่วย private file-store, guard สำหรับ symlink-parent, external-content, การปกปิดข้อความละเอียดอ่อน, การเปรียบเทียบ secret แบบ constant-time และตัวช่วยรวบรวม secret |
    | `plugin-sdk/ssrf-policy` | ตัวช่วย allowlist ของโฮสต์และนโยบาย SSRF สำหรับเครือข่ายส่วนตัว |
    | `plugin-sdk/ssrf-dispatcher` | ตัวช่วย pinned-dispatcher แบบแคบโดยไม่มีพื้นผิวรันไทม์ infra ขนาดใหญ่ |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, fetch ที่มี SSRF guard, ข้อผิดพลาด SSRF และตัวช่วยนโยบาย SSRF |
    | `plugin-sdk/secret-input` | ตัวช่วยแยกวิเคราะห์อินพุต secret |
    | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ/target ของ Webhook และการบังคับ raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | ตัวช่วยขนาด/timeout ของ request body |
  </Accordion>

  <Accordion title="เส้นทางย่อยของรันไทม์และพื้นที่จัดเก็บ">
    | เส้นทางย่อย | เอ็กซ์พอร์ตหลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | ตัวช่วยรันไทม์/การบันทึก/การสำรอง/การติดตั้ง Plugin แบบกว้าง |
    | `plugin-sdk/runtime-env` | ตัวช่วย env ของรันไทม์, ตัวบันทึก, timeout, retry และ backoff แบบแคบ |
    | `plugin-sdk/browser-config` | facade การกำหนดค่าเบราว์เซอร์ที่รองรับ สำหรับโปรไฟล์/ค่าเริ่มต้นที่ปรับให้เป็นมาตรฐาน, การแยกวิเคราะห์ CDP URL และตัวช่วย auth สำหรับการควบคุมเบราว์เซอร์ |
    | `plugin-sdk/agent-harness-task-runtime` | ตัวช่วยวงจรชีวิตงานและการส่งมอบการเสร็จสิ้นแบบทั่วไป สำหรับเอเจนต์ที่มี harness รองรับโดยใช้ขอบเขตงานที่โฮสต์ออกให้ |
    | `plugin-sdk/codex-mcp-projection` | ตัวช่วย Codex แบบ bundled ที่สงวนไว้สำหรับฉายการกำหนดค่าเซิร์ฟเวอร์ MCP ของผู้ใช้ไปยังการกำหนดค่าเธรด Codex; ไม่ใช่สำหรับ Plugin บุคคลที่สาม |
    | `plugin-sdk/codex-native-task-runtime` | ตัวช่วย Codex แบบ bundled ส่วนตัวสำหรับการเดินสาย mirror/runtime ของงาน native; ไม่ใช่สำหรับ Plugin บุคคลที่สาม |
    | `plugin-sdk/channel-runtime-context` | ตัวช่วยการลงทะเบียนและค้นหา runtime-context ของช่องทางแบบทั่วไป |
    | `plugin-sdk/matrix` | facade ความเข้ากันได้ของ Matrix ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควร import `plugin-sdk/run-command` โดยตรง |
    | `plugin-sdk/mattermost` | facade ความเข้ากันได้ของ Mattermost ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควร import เส้นทางย่อย SDK ทั่วไปโดยตรง |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | ตัวช่วยคำสั่ง/hook/http/interactive ของ Plugin ที่ใช้ร่วมกัน |
    | `plugin-sdk/hook-runtime` | ตัวช่วยไปป์ไลน์ Webhook/hook ภายในที่ใช้ร่วมกัน |
    | `plugin-sdk/lazy-runtime` | ตัวช่วย import/binding รันไทม์แบบ lazy เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod` และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | ตัวช่วย exec ของโปรเซส |
    | `plugin-sdk/cli-runtime` | ตัวช่วยการจัดรูปแบบ CLI, การรอ, เวอร์ชัน, การเรียกด้วยอาร์กิวเมนต์ และกลุ่มคำสั่งแบบ lazy |
    | `plugin-sdk/qa-live-transport-scenarios` | รหัสสถานการณ์ QA ของ live transport ที่ใช้ร่วมกัน, ตัวช่วยความครอบคลุม baseline และตัวช่วยการเลือกสถานการณ์ |
    | `plugin-sdk/gateway-method-runtime` | ตัวช่วย dispatch เมธอด Gateway ที่สงวนไว้สำหรับ route HTTP ของ Plugin ที่ประกาศ `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | ไคลเอนต์ Gateway, ตัวช่วยเริ่มไคลเอนต์ที่พร้อมสำหรับ event loop, RPC ของ CLI สำหรับ gateway, ข้อผิดพลาดโปรโตคอล gateway และตัวช่วย patch สถานะช่องทาง |
    | `plugin-sdk/config-contracts` | พื้นผิว config แบบ type-only ที่โฟกัสสำหรับรูปทรง config ของ Plugin เช่น `OpenClawConfig` และชนิด config ของช่องทาง/provider |
    | `plugin-sdk/plugin-config-runtime` | ตัวช่วยค้นหา plugin-config ในรันไทม์ เช่น `requireRuntimeConfig`, `resolvePluginConfigObject` และ `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | ตัวช่วยแก้ไข config แบบธุรกรรม เช่น `mutateConfigFile`, `replaceConfigFile` และ `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | สตริง hint metadata การส่งมอบ message-tool ที่ใช้ร่วมกัน |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วย snapshot config ของโปรเซสปัจจุบัน เช่น `getRuntimeConfig`, `getRuntimeConfigSnapshot` และตัวตั้งค่า snapshot สำหรับทดสอบ |
    | `plugin-sdk/telegram-command-config` | การปรับชื่อ/คำอธิบายคำสั่ง Telegram ให้เป็นมาตรฐาน และการตรวจสอบซ้ำ/ขัดแย้ง แม้เมื่อพื้นผิวสัญญา Telegram แบบ bundled ไม่พร้อมใช้งาน |
    | `plugin-sdk/text-autolink-runtime` | การตรวจจับ autolink ของการอ้างอิงไฟล์โดยไม่ใช้ text barrel แบบกว้าง |
    | `plugin-sdk/approval-reaction-runtime` | binding รีแอ็กชันอนุมัติแบบ hardcoded, payload prompt รีแอ็กชัน, store เป้าหมายรีแอ็กชัน และเอ็กซ์พอร์ตความเข้ากันได้สำหรับระงับ prompt native exec ภายในเครื่อง |
    | `plugin-sdk/approval-runtime` | ตัวช่วยอนุมัติ exec/Plugin, ตัวสร้าง approval-capability, ตัวช่วย auth/profile, ตัวช่วย native routing/runtime และการจัดรูปแบบ path แสดงผลการอนุมัติแบบมีโครงสร้าง |
    | `plugin-sdk/reply-runtime` | ตัวช่วยรันไทม์ inbound/reply ที่ใช้ร่วมกัน, chunking, dispatch, Heartbeat, ตัววางแผน reply |
    | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วย dispatch/finalize reply และ label การสนทนาแบบแคบ |
    | `plugin-sdk/reply-history` | ตัวช่วย reply-history ช่วงสั้นที่ใช้ร่วมกัน โค้ด message-turn ใหม่ควรใช้ `createChannelHistoryWindow`; ตัวช่วย map ระดับล่างยังคงเป็นเอ็กซ์พอร์ตความเข้ากันได้ที่เลิกใช้แล้วเท่านั้น |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ตัวช่วย chunking ข้อความ/markdown แบบแคบ |
    | `plugin-sdk/session-store-runtime` | ตัวช่วย workflow ของ session (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), การอ่านข้อความ transcript ของผู้ใช้/ผู้ช่วยล่าสุดแบบจำกัดตามอัตลักษณ์ session, ตัวช่วย path/session-key ของ legacy session store, การอ่าน updated-at และตัวช่วยความเข้ากันได้ทั้ง store/file-path สำหรับช่วงเปลี่ยนผ่านเท่านั้น |
    | `plugin-sdk/session-transcript-runtime` | อัตลักษณ์ transcript, ตัวช่วย scoped target/read/write, การเผยแพร่การอัปเดต, write lock และคีย์ hit ของหน่วยความจำ transcript |
    | `plugin-sdk/sqlite-runtime` | ตัวช่วย SQLite agent-schema, path และธุรกรรมที่โฟกัสสำหรับรันไทม์ first-party |
    | `plugin-sdk/cron-store-runtime` | ตัวช่วย path/load/save ของ Cron store |
    | `plugin-sdk/state-paths` | ตัวช่วย path ของไดเรกทอรี State/OAuth |
    | `plugin-sdk/plugin-state-runtime` | ชนิด keyed-state ของ SQLite sidecar สำหรับ Plugin พร้อมการตั้งค่า pragma การเชื่อมต่อแบบรวมศูนย์และการบำรุงรักษา WAL สำหรับฐานข้อมูลที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/routing` | ตัวช่วย binding route/session-key/account เช่น `resolveAgentRoute`, `buildAgentSessionKey` และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ตัวช่วยสรุปสถานะช่องทาง/บัญชีที่ใช้ร่วมกัน, ค่าเริ่มต้น runtime-state และตัวช่วย metadata ของ issue |
    | `plugin-sdk/target-resolver-runtime` | ตัวช่วย target resolver ที่ใช้ร่วมกัน |
    | `plugin-sdk/string-normalization-runtime` | ตัวช่วยปรับ slug/string ให้เป็นมาตรฐาน |
    | `plugin-sdk/request-url` | ดึง URL แบบสตริงจากอินพุตที่คล้าย fetch/request |
    | `plugin-sdk/run-command` | ตัวรันคำสั่งแบบจับเวลาพร้อมผลลัพธ์ stdout/stderr ที่ปรับให้เป็นมาตรฐาน |
    | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ tool/CLI ทั่วไป |
    | `plugin-sdk/tool-plugin` | กำหนด Plugin agent-tool แบบ typed อย่างง่ายและเปิดเผย metadata แบบ static สำหรับการสร้าง manifest |
    | `plugin-sdk/tool-payload` | ดึง payload ที่ปรับให้เป็นมาตรฐานจากอ็อบเจ็กต์ผลลัพธ์ของ tool |
    | `plugin-sdk/tool-send` | ดึงฟิลด์เป้าหมายการส่งแบบ canonical จาก args ของ tool |
    | `plugin-sdk/sandbox` | ชนิด backend ของ sandbox และตัวช่วยคำสั่ง SSH/OpenShell รวมถึง preflight คำสั่ง exec แบบ fail-fast |
    | `plugin-sdk/temp-path` | ตัวช่วย path สำหรับ temp-download ที่ใช้ร่วมกันและ workspace temp ที่ปลอดภัยแบบส่วนตัว |
    | `plugin-sdk/logging-core` | ตัวช่วยตัวบันทึก subsystem และการ redaction |
    | `plugin-sdk/markdown-table-runtime` | ตัวช่วยโหมดตาราง Markdown และการแปลง |
    | `plugin-sdk/model-session-runtime` | ตัวช่วย override model/session เช่น `applyModelOverrideToSessionEntry` และ `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | ตัวช่วย resolve config ของ talk provider |
    | `plugin-sdk/json-store` | ตัวช่วยอ่าน/เขียน state JSON ขนาดเล็ก |
    | `plugin-sdk/json-unsafe-integers` | ตัวช่วยแยกวิเคราะห์ JSON ที่รักษา literal จำนวนเต็มที่ไม่ปลอดภัยไว้เป็นสตริง |
    | `plugin-sdk/file-lock` | ตัวช่วย file-lock แบบ re-entrant |
    | `plugin-sdk/persistent-dedupe` | ตัวช่วยแคช dedupe ที่มีดิสก์รองรับ |
    | `plugin-sdk/acp-runtime` | ตัวช่วยรันไทม์/session และ reply-dispatch ของ ACP |
    | `plugin-sdk/acp-runtime-backend` | ตัวช่วยการลงทะเบียน backend ACP แบบ lightweight และ reply-dispatch สำหรับ Plugin ที่โหลดตอน startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | การ resolve binding ACP แบบอ่านอย่างเดียวโดยไม่มี import startup ของ lifecycle |
    | `plugin-sdk/agent-config-primitives` | primitive ของ config-schema รันไทม์เอเจนต์แบบแคบ |
    | `plugin-sdk/boolean-param` | ตัวอ่านพารามิเตอร์ boolean แบบ loose |
    | `plugin-sdk/dangerous-name-runtime` | ตัวช่วย resolve การจับคู่ dangerous-name |
    | `plugin-sdk/device-bootstrap` | ตัวช่วย bootstrap อุปกรณ์และ token การจับคู่ |
    | `plugin-sdk/extension-shared` | primitive ตัวช่วย passive-channel, สถานะ และ ambient proxy ที่ใช้ร่วมกัน |
    | `plugin-sdk/models-provider-runtime` | ตัวช่วยตอบกลับคำสั่ง/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | ตัวช่วยแสดงรายการคำสั่ง Skill |
    | `plugin-sdk/native-command-registry` | ตัวช่วย registry/build/serialize คำสั่ง native |
    | `plugin-sdk/agent-harness` | พื้นผิว trusted-plugin แบบทดลองสำหรับ agent harnesses ระดับต่ำ: ชนิด harness, ตัวช่วย steer/abort active-run, ตัวช่วย bridge เครื่องมือ OpenClaw, ตัวช่วยนโยบายเครื่องมือ runtime-plan, การจัดประเภท terminal outcome, ตัวช่วยจัดรูปแบบ/รายละเอียดความคืบหน้าเครื่องมือ และยูทิลิตีผลลัพธ์ attempt |
    | `plugin-sdk/provider-zai-endpoint` | facade ตรวจจับ endpoint ที่ provider Z.AI เป็นเจ้าของซึ่งเลิกใช้แล้ว; ใช้ API สาธารณะของ Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | ตัวช่วย async lock ภายในโปรเซสสำหรับไฟล์ state รันไทม์ขนาดเล็ก |
    | `plugin-sdk/channel-activity-runtime` | ตัวช่วย telemetry กิจกรรมช่องทาง |
    | `plugin-sdk/concurrency-runtime` | ตัวช่วย concurrency ของงาน async แบบจำกัด |
    | `plugin-sdk/dedupe-runtime` | ตัวช่วยแคช dedupe ในหน่วยความจำ |
    | `plugin-sdk/delivery-queue-runtime` | ตัวช่วย drain pending-delivery ขาออก |
    | `plugin-sdk/file-access-runtime` | ตัวช่วย path สำหรับไฟล์ภายในเครื่องและ media-source ที่ปลอดภัย |
    | `plugin-sdk/heartbeat-runtime` | ตัวช่วย wake, event และ visibility ของ Heartbeat |
    | `plugin-sdk/number-runtime` | ตัวช่วย coercion แบบตัวเลข |
    | `plugin-sdk/secure-random-runtime` | ตัวช่วย token/UUID ที่ปลอดภัย |
    | `plugin-sdk/system-event-runtime` | ตัวช่วยคิว system event |
    | `plugin-sdk/transport-ready-runtime` | ตัวช่วยรอความพร้อมของ transport |
    | `plugin-sdk/exec-approvals-runtime` | ตัวช่วยไฟล์นโยบายการอนุมัติ exec โดยไม่มี infra-runtime barrel แบบกว้าง |
    | `plugin-sdk/infra-runtime` | shim ความเข้ากันได้ที่เลิกใช้แล้ว; ใช้เส้นทางย่อยรันไทม์ที่โฟกัสด้านบน |
    | `plugin-sdk/collection-runtime` | ตัวช่วยแคชขนาดเล็กแบบจำกัด |
    | `plugin-sdk/diagnostic-runtime` | ตัวช่วย diagnostic flag, event และ trace-context |
    | `plugin-sdk/error-runtime` | กราฟข้อผิดพลาด, การจัดรูปแบบ, ตัวช่วยการจัดประเภทข้อผิดพลาดที่ใช้ร่วมกัน, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | fetch แบบ wrapped, proxy, ตัวเลือก EnvHttpProxyAgent และตัวช่วย pinned lookup |
    | `plugin-sdk/runtime-fetch` | runtime fetch ที่รู้จัก dispatcher โดยไม่มี import proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | ตัวช่วย sanitizer ของ inline image data URL และการ sniff signature โดยไม่มีพื้นผิว media runtime แบบกว้าง |
    | `plugin-sdk/response-limit-runtime` | ตัวอ่าน response-body แบบจำกัดโดยไม่มีพื้นผิว media runtime แบบกว้าง |
    | `plugin-sdk/session-binding-runtime` | สถานะ binding การสนทนาปัจจุบันโดยไม่มี configured binding routing หรือ pairing stores |
    | `plugin-sdk/session-store-runtime` | ตัวช่วย session-store โดยไม่มี import การเขียน/บำรุงรักษา config แบบกว้าง |
    | `plugin-sdk/sqlite-runtime` | ตัวช่วย SQLite agent-schema, path และธุรกรรมที่โฟกัสโดยไม่มีการควบคุม lifecycle ของฐานข้อมูล |
    | `plugin-sdk/context-visibility-runtime` | การ resolve context visibility และการกรอง supplemental context โดยไม่มี import config/security แบบกว้าง |
    | `plugin-sdk/string-coerce-runtime` | ตัวช่วย coercion และ normalization ของ primitive record/string แบบแคบ โดยไม่มี import markdown/logging |
    | `plugin-sdk/host-runtime` | ตัวช่วย normalization ของ hostname และ SCP host |
    | `plugin-sdk/retry-runtime` | ตัวช่วย config retry และตัวรัน retry |
    | `plugin-sdk/agent-runtime` | ตัวช่วย dir/identity/workspace ของเอเจนต์ รวมถึง `resolveAgentDir`, `resolveDefaultAgentDir` และเอ็กซ์พอร์ตความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว |
    | `plugin-sdk/directory-runtime` | query/dedup ไดเรกทอรีที่มี config รองรับ |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="เส้นทางย่อยด้านความสามารถและการทดสอบ">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | helper ร่วมสำหรับดึง/แปลง/จัดเก็บสื่อ รวมถึง `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` และ `fetchRemoteMedia` ที่เลิกแนะนำให้ใช้แล้ว; ควรใช้ helper สำหรับ store ก่อนอ่าน buffer เมื่อ URL ควรถูกแปลงเป็นสื่อของ OpenClaw |
    | `plugin-sdk/media-mime` | การปรับ MIME ให้เป็นมาตรฐานแบบแคบ การแมปนามสกุลไฟล์ การตรวจจับ MIME และ helper สำหรับชนิดสื่อ |
    | `plugin-sdk/media-store` | helper สำหรับ store สื่อแบบแคบ เช่น `saveMediaBuffer` และ `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | helper ร่วมสำหรับการ failover ของการสร้างสื่อ การเลือก candidate และข้อความแจ้งโมเดลที่ขาดหาย |
    | `plugin-sdk/media-understanding` | ชนิดของผู้ให้บริการด้านการทำความเข้าใจสื่อ พร้อมการส่งออก helper สำหรับรูปภาพ/เสียง/การสกัดข้อมูลแบบมีโครงสร้างที่หันหน้าเข้าหาผู้ให้บริการ |
    | `plugin-sdk/text-chunking` | helper สำหรับแบ่ง chunk/render ข้อความและ markdown, การแปลงตาราง markdown, การตัดแท็ก directive และยูทิลิตีข้อความที่ปลอดภัย |
    | `plugin-sdk/text-chunking` | helper สำหรับแบ่ง chunk ข้อความขาออก |
    | `plugin-sdk/speech` | ชนิดของผู้ให้บริการ speech พร้อมการส่งออก directive, registry, validation, ตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI และ helper ด้าน speech ที่หันหน้าเข้าหาผู้ให้บริการ |
    | `plugin-sdk/speech-core` | การส่งออกชนิดผู้ให้บริการ speech, registry, directive, normalization และ helper ด้าน speech ร่วม |
    | `plugin-sdk/realtime-transcription` | ชนิดของผู้ให้บริการการถอดเสียงแบบเรียลไทม์, helper สำหรับ registry และ helper session WebSocket ร่วม |
    | `plugin-sdk/realtime-bootstrap-context` | helper สำหรับ bootstrap โปรไฟล์เรียลไทม์สำหรับการฉีด context แบบจำกัดของ `IDENTITY.md`, `USER.md` และ `SOUL.md` |
    | `plugin-sdk/realtime-voice` | ชนิดของผู้ให้บริการเสียงเรียลไทม์, helper สำหรับ registry และ helper พฤติกรรมเสียงเรียลไทม์ร่วม รวมถึงการติดตามกิจกรรมขาออก |
    | `plugin-sdk/image-generation` | ชนิดของผู้ให้บริการการสร้างรูปภาพ พร้อม helper สำหรับ asset รูปภาพ/data URL และตัวสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
    | `plugin-sdk/image-generation-core` | ชนิดการสร้างรูปภาพ, failover, auth และ helper สำหรับ registry ร่วม |
    | `plugin-sdk/music-generation` | ชนิดของผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างเพลง |
    | `plugin-sdk/music-generation-core` | ชนิดการสร้างเพลงร่วม, helper สำหรับ failover, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref |
    | `plugin-sdk/video-generation` | ชนิดของผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างวิดีโอ |
    | `plugin-sdk/video-generation-core` | ชนิดการสร้างวิดีโอร่วม, helper สำหรับ failover, การค้นหาผู้ให้บริการ และการแยกวิเคราะห์ model-ref |
    | `plugin-sdk/transcripts` | ชนิดผู้ให้บริการแหล่ง transcript ร่วม, helper สำหรับ registry, descriptor ของ session และ metadata ของ utterance |
    | `plugin-sdk/webhook-targets` | registry เป้าหมาย Webhook และ helper สำหรับติดตั้ง route |
    | `plugin-sdk/webhook-path` | alias ความเข้ากันได้ที่เลิกแนะนำให้ใช้แล้ว; ใช้ `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | helper ร่วมสำหรับโหลดสื่อระยะไกล/ในเครื่อง |
    | `plugin-sdk/zod` | การ re-export เพื่อความเข้ากันได้ที่เลิกแนะนำให้ใช้แล้ว; import `zod` จาก `zod` โดยตรง |
    | `plugin-sdk/testing` | barrel ความเข้ากันได้ที่เลิกแนะนำให้ใช้แล้วเฉพาะ repo สำหรับการทดสอบ OpenClaw รุ่นเก่า การทดสอบใหม่ใน repo ควร import เส้นทางย่อยการทดสอบในเครื่องที่เจาะจงแทน เช่น `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` หรือ `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | helper `createTestPluginApi` แบบขั้นต่ำเฉพาะ repo สำหรับ unit test การลงทะเบียน Plugin โดยตรง โดยไม่ต้อง import bridge ของ helper ทดสอบใน repo |
    | `plugin-sdk/agent-runtime-test-contracts` | fixture สัญญา adapter ของ agent-runtime แบบ native เฉพาะ repo สำหรับการทดสอบ auth, delivery, fallback, tool-hook, prompt-overlay, schema และการ project transcript |
    | `plugin-sdk/channel-test-helpers` | helper ทดสอบที่เน้น channel เฉพาะ repo สำหรับสัญญา actions/setup/status ทั่วไป, assertion ของ directory, lifecycle การเริ่มต้นบัญชี, threading ของ send-config, mock รันไทม์, ปัญหา status, การส่งขาออก และการลงทะเบียน hook |
    | `plugin-sdk/channel-target-testing` | ชุดกรณีข้อผิดพลาด target-resolution ร่วมเฉพาะ repo สำหรับการทดสอบ channel |
    | `plugin-sdk/plugin-test-contracts` | helper สัญญาเฉพาะ repo สำหรับแพ็กเกจ Plugin, การลงทะเบียน, artifact สาธารณะ, direct import, runtime API และ side effect จากการ import |
    | `plugin-sdk/provider-test-contracts` | helper สัญญาเฉพาะ repo สำหรับรันไทม์ผู้ให้บริการ, auth, discovery, onboard, catalog, wizard, ความสามารถด้านสื่อ, นโยบาย replay, เสียงสดสำหรับ STT เรียลไทม์, web-search/fetch และ stream |
    | `plugin-sdk/provider-http-test-mocks` | mock HTTP/auth ของ Vitest แบบ opt-in เฉพาะ repo สำหรับการทดสอบผู้ให้บริการที่ทดสอบ `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | fixture ทั่วไปเฉพาะ repo สำหรับ capture รันไทม์ CLI, context sandbox, skill writer, agent-message, system-event, module reload, path ของ Plugin ที่ bundled, terminal-text, chunking, auth-token และ typed-case |
    | `plugin-sdk/test-node-mocks` | helper mock builtin ของ Node ที่เจาะจงเฉพาะ repo สำหรับใช้ภายใน factory ของ Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="เส้นทางย่อยของ Memory">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/memory-core` | พื้นผิว helper memory-core ที่ bundled สำหรับ helper ด้าน manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | facade รันไทม์สำหรับ index/search ของ Memory |
    | `plugin-sdk/memory-core-host-embedding-registry` | helper registry ผู้ให้บริการ embedding ของ Memory แบบเบา |
    | `plugin-sdk/memory-core-host-engine-foundation` | การส่งออก engine foundation ของ host Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | สัญญา embedding ของ host Memory, การเข้าถึง registry, ผู้ให้บริการในเครื่อง และ helper batch/remote ทั่วไป `registerMemoryEmbeddingProvider` บนพื้นผิวนี้เลิกแนะนำให้ใช้แล้ว; ใช้ API ผู้ให้บริการ embedding ทั่วไปสำหรับผู้ให้บริการใหม่ |
    | `plugin-sdk/memory-core-host-engine-qmd` | การส่งออก engine QMD ของ host Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | การส่งออก engine storage ของ host Memory |
    | `plugin-sdk/memory-core-host-multimodal` | helper multimodal ของ host Memory |
    | `plugin-sdk/memory-core-host-query` | helper query ของ host Memory |
    | `plugin-sdk/memory-core-host-secret` | helper secret ของ host Memory |
    | `plugin-sdk/memory-core-host-events` | alias ความเข้ากันได้ที่เลิกแนะนำให้ใช้แล้ว; ใช้ `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | helper status ของ host Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | helper รันไทม์ CLI ของ host Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | helper รันไทม์ core ของ host Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | helper file/runtime ของ host Memory |
    | `plugin-sdk/memory-host-core` | alias ที่เป็นกลางต่อ vendor สำหรับ helper รันไทม์ core ของ host Memory |
    | `plugin-sdk/memory-host-events` | alias ที่เป็นกลางต่อ vendor สำหรับ helper event journal ของ host Memory |
    | `plugin-sdk/memory-host-files` | alias ความเข้ากันได้ที่เลิกแนะนำให้ใช้แล้ว; ใช้ `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | helper managed-markdown ร่วมสำหรับ Plugin ที่เกี่ยวข้องกับ Memory |
    | `plugin-sdk/memory-host-search` | facade รันไทม์ของ Active Memory สำหรับการเข้าถึง search-manager |
    | `plugin-sdk/memory-host-status` | alias ความเข้ากันได้ที่เลิกแนะนำให้ใช้แล้ว; ใช้ `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="เส้นทางย่อย bundled-helper ที่สงวนไว้">
    เส้นทางย่อย SDK ของ bundled-helper ที่สงวนไว้เป็นพื้นผิวแบบแคบที่เฉพาะเจาะจงตาม owner สำหรับ
    โค้ด Plugin ที่ bundled เส้นทางเหล่านี้ถูกติดตามใน inventory ของ SDK เพื่อให้การ build
    แพ็กเกจและการทำ alias คงความกำหนดแน่นอน แต่ไม่ใช่ API ทั่วไปสำหรับการเขียน Plugin
    สัญญา host ที่นำกลับมาใช้ใหม่ได้ควรใช้เส้นทางย่อย SDK ทั่วไป
    เช่น `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` และ
    `plugin-sdk/plugin-config-runtime`

    | เส้นทางย่อย | Owner และวัตถุประสงค์ |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | helper ของ Plugin Codex ที่ bundled สำหรับ project config เซิร์ฟเวอร์ MCP ของผู้ใช้ไปยัง config thread ของ app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | helper ของ Plugin Codex ที่ bundled สำหรับ mirror subagent แบบ native ของ app-server Codex ไปยัง state ของงาน OpenClaw |

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
