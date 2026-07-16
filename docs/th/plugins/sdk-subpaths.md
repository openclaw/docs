---
read_when:
    - การเลือกพาธย่อยของ plugin-sdk ที่เหมาะสมสำหรับการนำเข้า Plugin
    - การตรวจสอบพาธย่อยของ Plugin ที่รวมมาให้และส่วนติดต่อของตัวช่วย
summary: 'แค็ตตาล็อกพาธย่อยของ Plugin SDK: การนำเข้าแต่ละรายการอยู่ที่ใด โดยจัดกลุ่มตามหมวดหมู่'
title: พาธย่อยของ Plugin SDK
x-i18n:
    generated_at: "2026-07-16T19:35:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 937b616d7a95c250f7ff328ea3faa12143272722ffa638f50214fdd72ef5f225
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK เปิดให้ใช้งานเป็นชุดพาธย่อยสาธารณะที่มีขอบเขตเฉพาะภายใต้
`openclaw/plugin-sdk/` หน้านี้รวบรวมพาธย่อยที่ใช้กันทั่วไปโดยจัดกลุ่มตาม
วัตถุประสงค์ โดยมีไฟล์สามไฟล์ที่กำหนดพื้นผิวนี้:

- `scripts/lib/plugin-sdk-entrypoints.json`: รายการจุดเข้าใช้งานที่ได้รับการดูแล
  ซึ่งระบบบิลด์จะคอมไพล์
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: พาธย่อยสำหรับ
  การทดสอบ/การใช้งานภายในเฉพาะในรีโพซิทอรี รายการส่งออกของแพ็กเกจคือรายการทั้งหมดที่หักรายการนี้ออก
- `src/plugin-sdk/entrypoints.ts`: เมทาดาทาการจำแนกประเภทสำหรับพาธย่อย
  ที่เลิกใช้แล้ว ตัวช่วยแบบรวมชุดที่สงวนไว้ facade แบบรวมชุดที่รองรับ และ
  พื้นผิวสาธารณะที่ Plugin เป็นเจ้าของ

ผู้ดูแลตรวจสอบจำนวนรายการส่งออกสาธารณะด้วย `pnpm plugin-sdk:surface` และ
พาธย่อยของตัวช่วยที่สงวนไว้ซึ่งยังใช้งานอยู่ด้วย `pnpm plugins:boundary-report:summary`;
รายการส่งออกตัวช่วยที่สงวนไว้แต่ไม่ได้ใช้งานจะทำให้รายงาน CI ล้มเหลว แทนที่จะคงอยู่ใน
SDK สาธารณะในฐานะภาระความเข้ากันได้ที่ไม่มีการใช้งาน

สำหรับคู่มือการเขียน Plugin โปรดดู[ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## จุดเข้าใช้งาน Plugin

| พาธย่อย                        | รายการส่งออกหลัก                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | ตัวช่วยรายการผู้ให้บริการการย้ายข้อมูล เช่น `createMigrationItem` ค่าคงที่ของเหตุผล เครื่องหมายสถานะรายการ ตัวช่วยปกปิดข้อมูล และ `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | ตัวช่วยการย้ายข้อมูลขณะรันไทม์ เช่น `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` และ `writeMigrationReport`                                             |
| `plugin-sdk/health`            | การลงทะเบียน การตรวจจับ การซ่อมแซม การเลือก ระดับความรุนแรง และชนิดข้อค้นพบของการตรวจสุขภาพ Doctor สำหรับตัวใช้งานด้านสุขภาพแบบรวมชุด                                                                                |
| `plugin-sdk/config-schema`     | เลิกใช้แล้ว สคีมา Zod ของ `openclaw.json` ระดับราก (`OpenClawSchema`); ให้กำหนดสคีมาเฉพาะภายใน Plugin แทน และตรวจสอบความถูกต้องด้วย `plugin-sdk/json-schema-runtime`                                                  |

### ตัวช่วยด้านความเข้ากันได้และการทดสอบที่เลิกใช้แล้ว

พาธย่อยที่เลิกใช้แล้วยังคงส่งออกไว้สำหรับ Plugin รุ่นเก่า แต่โค้ดใหม่ควรใช้
พาธย่อย SDK ที่มีขอบเขตเฉพาะด้านล่าง รายการที่ได้รับการดูแลคือ
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI จะปฏิเสธการนำเข้าสำหรับ
การใช้งานจริงแบบรวมชุดจากรายการนี้ barrel แบบกว้าง เช่น `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` และ
`plugin-sdk/text-runtime` มีไว้เพื่อความเข้ากันได้เท่านั้น และ `plugin-sdk/zod` เป็น
การส่งออกซ้ำเพื่อความเข้ากันได้: ให้นำเข้า `zod` โดยตรงจาก `zod` barrel โดเมน
แบบกว้าง ได้แก่ `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` และ
`plugin-sdk/security-runtime` ก็เลิกใช้แล้วเช่นกัน โดยให้ใช้พาธย่อยที่มีขอบเขตเฉพาะ
แทน

พาธย่อยตัวช่วยทดสอบของ OpenClaw ที่ใช้ Vitest เป็นพื้นฐานมีไว้เฉพาะในรีโพซิทอรีและ
ไม่ใช่รายการส่งออกของแพ็กเกจอีกต่อไป ได้แก่ `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` และ `testing` พื้นผิวตัวช่วยแบบรวมชุดที่เป็นส่วนตัว
`ssrf-runtime-internal` และ `codex-native-task-runtime` ก็มีไว้เฉพาะในรีโพซิทอรี
เช่นกัน

### พาธย่อยตัวช่วย Plugin แบบรวมชุดที่สงวนไว้

`plugin-sdk/codex-mcp-projection` เป็นพาธย่อยที่สงวนไว้เพียงรายการเดียว: พื้นผิว
ความเข้ากันได้ที่ Plugin เป็นเจ้าของสำหรับ Codex Plugin แบบรวมชุด ไม่ใช่ API ของ SDK ทั่วไป
การนำเข้าข้าม Plugin ที่มีเจ้าของต่างกันถูกปิดกั้นด้วยกลไกควบคุมสัญญาของแพ็กเกจ และ
CI จะล้มเหลวเมื่อไม่มีการนำเข้าพาธย่อยที่สงวนไว้อีกต่อไป
`plugin-sdk/codex-native-task-runtime` มีไว้เฉพาะในรีโพซิทอรีและไม่ใช่รายการ
ส่งออกของแพ็กเกจ

`src/plugin-sdk/entrypoints.ts` ยังติดตาม facade แบบรวมชุดที่รองรับ ซึ่งเป็นจุดเข้าใช้งาน
SDK ที่มี Plugin แบบรวมชุดของตนรองรับอยู่ จนกว่าสัญญาทั่วไปจะเข้ามาแทนที่
ได้แก่ `plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` และ `plugin-sdk/zalouser` หลายรายการในกลุ่มนี้ก็
เลิกใช้สำหรับโค้ดใหม่แล้วเช่นกัน โปรดดูหมายเหตุของแต่ละแถวด้านล่าง

  <AccordionGroup>
  <Accordion title="พาธย่อยของช่องทาง">
    | พาธย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | ตัวช่วยตรวจสอบความถูกต้องของ JSON Schema แบบแคชสำหรับสคีมาที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | ตัวช่วยวิซาร์ดการตั้งค่าที่ใช้ร่วมกัน ตัวแปลการตั้งค่า พรอมต์รายการที่อนุญาต และตัวสร้างสถานะการตั้งค่า |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | ตัวช่วยการกำหนดค่าแบบหลายบัญชี/เกตการดำเนินการ และตัวช่วยการย้อนกลับไปใช้บัญชีเริ่มต้น |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID` และตัวช่วยปรับรหัสบัญชีให้อยู่ในรูปแบบมาตรฐาน |
    | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชีและย้อนกลับไปใช้ค่าเริ่มต้น |
    | `plugin-sdk/account-helpers` | ตัวช่วยเฉพาะทางสำหรับรายการบัญชี/การดำเนินการกับบัญชี |
    | `plugin-sdk/access-groups` | ตัวช่วยแยกวิเคราะห์รายการกลุ่มการเข้าถึงที่อนุญาตและวินิจฉัยกลุ่มแบบปกปิดข้อมูล |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | ฟาซาดเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | องค์ประกอบพื้นฐานของสคีมาการกำหนดค่าช่องทางที่ใช้ร่วมกัน พร้อมด้วย Zod และตัวสร้าง JSON/TypeBox โดยตรง |
    | `plugin-sdk/bundled-channel-config-schema` | สคีมาการกำหนดค่าช่องทาง OpenClaw ที่รวมมาให้ สำหรับ Plugin แบบรวมที่ได้รับการดูแลเท่านั้น |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId` รหัสช่องทางแชตแบบรวม/ทางการที่เป็นมาตรฐาน พร้อมป้ายกำกับ/นามแฝงของตัวจัดรูปแบบสำหรับ Plugin ที่ต้องจดจำข้อความซึ่งมีคำนำหน้าซองข้อมูลโดยไม่ต้องฮาร์ดโค้ดตารางของตนเอง |
    | `plugin-sdk/channel-config-schema-legacy` | นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้วสำหรับสคีมาการกำหนดค่าช่องทางแบบรวม |
    | `plugin-sdk/telegram-command-config` | การปรับชื่อ/คำอธิบายคำสั่ง Telegram ให้อยู่ในรูปแบบมาตรฐานและการตรวจสอบรายการซ้ำ/ข้อขัดแย้งที่เลิกใช้แล้ว สำหรับโค้ด Plugin ใหม่ ให้ใช้การจัดการการกำหนดค่าคำสั่งภายใน Plugin |
    | `plugin-sdk/command-gating` | ตัวช่วยเฉพาะทางสำหรับเกตการอนุญาตคำสั่ง |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | ตัวแก้ไขรันไทม์ขาเข้าของช่องทางระดับสูงแบบทดลองและตัวสร้างข้อเท็จจริงของเส้นทางสำหรับพาธรับข้อมูลของช่องทางที่ย้ายแล้ว ควรใช้สิ่งนี้แทนการประกอบรายการที่อนุญาตที่มีผล รายการคำสั่งที่อนุญาต และโปรเจกชันแบบเดิมในแต่ละ Plugin ดู [API ขาเข้าของช่องทาง](/th/plugins/sdk-channel-ingress) |
    | `plugin-sdk/channel-lifecycle` | ฟาซาดเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-outbound` | สัญญาวงจรชีวิตของข้อความ พร้อมตัวเลือกไปป์ไลน์การตอบกลับ ใบตอบรับ ตัวอย่างแบบสด/การสตรีม ตัวช่วยวงจรชีวิต อัตลักษณ์ขาออก การวางแผนเพย์โหลด การส่งแบบคงทน และตัวช่วยบริบทการส่งข้อความ ดู [API ขาออกของช่องทาง](/th/plugins/sdk-channel-outbound) |
    | `plugin-sdk/channel-message` | นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-message-runtime` | นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/inbound-envelope` | ตัวช่วยสร้างเส้นทางขาเข้าและซองข้อมูลที่ใช้ร่วมกัน |
    | `plugin-sdk/inbound-reply-dispatch` | ฟาซาดเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-inbound` สำหรับตัวรันขาเข้าและเพรดิเคตการส่งต่อ และใช้ `plugin-sdk/channel-outbound` สำหรับตัวช่วยส่งข้อความ |
    | `plugin-sdk/messaging-targets` | นามแฝงการแยกวิเคราะห์เป้าหมายที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | ตัวช่วยโหลดสื่อขาออกและสถานะสื่อที่โฮสต์ไว้ซึ่งใช้ร่วมกัน |
    | `plugin-sdk/outbound-send-deps` | ฟาซาดเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/outbound-runtime` | ฟาซาดเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/poll-runtime` | ตัวช่วยเฉพาะทางสำหรับปรับโพลให้อยู่ในรูปแบบมาตรฐาน |
    | `plugin-sdk/thread-bindings-runtime` | ตัวช่วยวงจรชีวิตและอะแดปเตอร์สำหรับการผูกเธรด |
    | `plugin-sdk/agent-media-payload` | รูทและตัวโหลดเพย์โหลดสื่อของเอเจนต์ |
    | `plugin-sdk/conversation-runtime` | บาร์เรลแบบกว้างที่เลิกใช้แล้วสำหรับการผูกการสนทนา/เธรด การจับคู่ และตัวช่วยการผูกที่กำหนดค่าไว้ ควรใช้พาธย่อยการผูกที่เฉพาะเจาะจง เช่น `plugin-sdk/thread-bindings-runtime` และ `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | ตัวช่วยแก้ไขนโยบายกลุ่มในรันไทม์ |
    | `plugin-sdk/channel-status` | ตัวช่วยสแนปช็อต/สรุปสถานะช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/channel-config-primitives` | องค์ประกอบพื้นฐานเฉพาะทางของสคีมาการกำหนดค่าช่องทาง |
    | `plugin-sdk/channel-config-writes` | ตัวช่วยการอนุญาตให้เขียนการกำหนดค่าช่องทาง |
    | `plugin-sdk/channel-plugin-common` | รายการส่งออกส่วนเริ่มต้นของ Plugin ช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/allowlist-config-edit` | ตัวช่วยแก้ไข/อ่านการกำหนดค่ารายการที่อนุญาต |
    | `plugin-sdk/group-access` | ตัวช่วยตัดสินใจการเข้าถึงกลุ่มที่เลิกใช้แล้ว ให้ใช้ `resolveChannelMessageIngress` จาก `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | ฟาซาดเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-inbound` |
    | `plugin-sdk/direct-dm-guard-policy` | ตัวช่วยนโยบายการป้องกันก่อนเข้ารหัสสำหรับ DM โดยตรงแบบเฉพาะทาง |
    | `plugin-sdk/discord` | ฟาซาดเพื่อความเข้ากันได้ของ Discord ที่เลิกใช้แล้วสำหรับ `@openclaw/discord@2026.3.13` ที่เผยแพร่และความเข้ากันได้ของเจ้าของที่มีการติดตาม Plugin ใหม่ควรใช้พาธย่อย SDK ช่องทางแบบทั่วไป |
    | `plugin-sdk/telegram-account` | ฟาซาดเพื่อความเข้ากันได้ในการแก้ไขบัญชี Telegram ที่เลิกใช้แล้วสำหรับความเข้ากันได้ของเจ้าของที่มีการติดตาม Plugin ใหม่ควรใช้ตัวช่วยรันไทม์ที่แทรกเข้ามาหรือพาธย่อย SDK ช่องทางแบบทั่วไป |
    | `plugin-sdk/zalouser` | ฟาซาดเพื่อความเข้ากันได้ของ Zalo Personal ที่เลิกใช้แล้วสำหรับแพ็กเกจ Lark/Zalo ที่เผยแพร่ซึ่งยังคงนำเข้าการอนุญาตคำสั่งของผู้ส่ง Plugin ใหม่ควรใช้พาธย่อย SDK ช่องทางแบบทั่วไป |
    | `plugin-sdk/interactive-runtime` | ตัวช่วยการนำเสนอ การส่งมอบ และการตอบกลับแบบโต้ตอบเดิมของข้อความเชิงความหมาย ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | ตัวช่วยขาเข้าที่ใช้ร่วมกันสำหรับการจำแนกเหตุการณ์ การสร้างบริบท การจัดรูปแบบ รูท การหน่วง การจับคู่การกล่าวถึง นโยบายการกล่าวถึง และการบันทึกขาเข้า |
    | `plugin-sdk/channel-inbound-debounce` | ตัวช่วยการหน่วงขาเข้าแบบเฉพาะทาง |
    | `plugin-sdk/channel-mention-gating` | ตัวช่วยเฉพาะทางสำหรับนโยบายการกล่าวถึง เครื่องหมายการกล่าวถึง และข้อความการกล่าวถึง โดยไม่มีพื้นผิวรันไทม์ขาเข้าที่กว้างกว่า |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | ฟาซาดเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-inbound` หรือ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-pairing-paths` | ฟาซาดเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-pairing` |
    | `plugin-sdk/channel-reply-options-runtime` | ฟาซาดเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-streaming` | ฟาซาดเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-send-result` | ชนิดผลลัพธ์การตอบกลับ |
    | `plugin-sdk/channel-actions` | ตัวช่วยการดำเนินการกับข้อความของช่องทาง พร้อมตัวช่วยสคีมาเนทีฟที่เลิกใช้แล้วแต่ยังคงไว้เพื่อความเข้ากันได้ของ Plugin |
    | `plugin-sdk/channel-route` | ตัวช่วยที่ใช้ร่วมกันสำหรับการปรับเส้นทางให้อยู่ในรูปแบบมาตรฐาน การแก้ไขเป้าหมายที่ขับเคลื่อนด้วยพาร์เซอร์ การแปลงรหัสเธรดเป็นสตริง คีย์เส้นทางแบบขจัดข้อมูลซ้ำ/กระชับ ชนิดเป้าหมายที่แยกวิเคราะห์แล้ว และการเปรียบเทียบเส้นทาง/เป้าหมาย |
    | `plugin-sdk/channel-targets` | ตัวช่วยแยกวิเคราะห์เป้าหมาย ผู้เรียกใช้การเปรียบเทียบเส้นทางควรใช้ `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | ชนิดสัญญาของช่องทาง |
    | `plugin-sdk/channel-feedback` | การเชื่อมโยงข้อเสนอแนะ/ปฏิกิริยา |
  </Accordion>

ตระกูลตัวช่วยช่องทางที่เลิกใช้แล้วจะยังคงใช้งานได้เฉพาะเพื่อความเข้ากันได้กับ Plugin ที่เผยแพร่แล้วเท่านั้น แผนการนำออกคือ: คงไว้ตลอดช่วงการย้าย Plugin ภายนอก ให้ Plugin ในรีโพซิทอรี/ที่รวมมาในชุดใช้งาน `channel-inbound` และ `channel-outbound` ต่อไป จากนั้นนำพาธย่อยเพื่อความเข้ากันได้ออกในการปรับปรุง SDK ครั้งใหญ่ถัดไป ทั้งนี้ครอบคลุมตระกูลเดิมสำหรับข้อความ/รันไทม์ของช่องทาง การสตรีมของช่องทาง การเข้าถึง DM โดยตรง ตัวช่วยขาเข้าที่แยกย่อย ตัวเลือกการตอบกลับ และพาธการจับคู่

  <Accordion title="พาธย่อยของผู้ให้บริการ">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | ส่วนติดต่อผู้ให้บริการ LM Studio ที่รองรับ สำหรับการตั้งค่า การค้นพบแค็ตตาล็อก และการเตรียมโมเดลขณะรันไทม์ |
    | `plugin-sdk/lmstudio-runtime` | ส่วนติดต่อรันไทม์ LM Studio ที่รองรับ สำหรับค่าเริ่มต้นของเซิร์ฟเวอร์ภายใน การค้นพบโมเดล ส่วนหัวคำขอ และตัวช่วยสำหรับโมเดลที่โหลดแล้ว |
    | `plugin-sdk/provider-setup` | ตัวช่วยการตั้งค่าผู้ให้บริการภายใน/โฮสต์เองที่คัดสรรไว้ |
    | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยการตั้งค่าแบบโฮสต์เองที่เข้ากันได้กับ OpenAI ซึ่งเลิกใช้แล้ว ให้ใช้ `plugin-sdk/provider-setup` หรือตัวช่วยการตั้งค่าที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/cli-backend` | ค่าเริ่มต้นของแบ็กเอนด์ CLI + ค่าคงที่ของ watchdog |
    | `plugin-sdk/provider-auth-runtime` | ตัวช่วยรันไทม์การยืนยันตัวตนของผู้ให้บริการ: โฟลว์ OAuth แบบ loopback การแลกเปลี่ยนโทเค็น การคงข้อมูลการยืนยันตัวตน และการระบุ API key |
    | `plugin-sdk/provider-oauth-runtime` | ชนิดคอลแบ็ก OAuth ทั่วไปของผู้ให้บริการ การเรนเดอร์หน้าคอลแบ็ก ตัวช่วย PKCE/สถานะ การแยกวิเคราะห์อินพุตการอนุญาต ตัวช่วยการหมดอายุของโทเค็น และตัวช่วยยกเลิก |
    | `plugin-sdk/provider-auth-api-key` | ตัวช่วยการเริ่มต้นใช้งาน API key/การเขียนโปรไฟล์ เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
    | `plugin-sdk/provider-env-vars` | ตัวช่วยค้นหาตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตนของผู้ให้บริการ |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, ตัวช่วยนำเข้าการยืนยันตัวตน OpenAI Codex, การส่งออกเพื่อความเข้ากันได้ `resolveOpenClawAgentDir` ซึ่งเลิกใช้แล้ว |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, ตัวสร้างนโยบายการเล่นซ้ำที่ใช้ร่วมกัน ตัวช่วยเอนด์พอยต์ของผู้ให้บริการ และตัวช่วยปรับโมเดล ID ให้เป็นมาตรฐานที่ใช้ร่วมกัน |
    | `plugin-sdk/provider-catalog-live-runtime` | ตัวช่วยแค็ตตาล็อกโมเดลผู้ให้บริการแบบสดสำหรับการค้นพบในรูปแบบ `/models` ที่มีการป้องกัน: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, การกรองโมเดล ID, แคช TTL และทางเลือกสำรองแบบคงที่ |
    | `plugin-sdk/provider-catalog-runtime` | ฮุกรันไทม์สำหรับเสริมแค็ตตาล็อกผู้ให้บริการ และจุดเชื่อมต่อรีจิสทรีผู้ให้บริการของ Plugin สำหรับการทดสอบสัญญา |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | ตัวช่วยความสามารถ HTTP/เอนด์พอยต์ทั่วไปของผู้ให้บริการ ข้อผิดพลาด HTTP ของผู้ให้บริการ และตัวช่วยฟอร์ม multipart สำหรับการถอดเสียง |
    | `plugin-sdk/provider-web-fetch-contract` | ตัวช่วยสัญญาการกำหนดค่า/การเลือกสำหรับการดึงข้อมูลเว็บแบบเฉพาะเจาะจง เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | ตัวช่วยการลงทะเบียน/แคชผู้ให้บริการดึงข้อมูลเว็บ |
    | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วยการกำหนดค่า/ข้อมูลรับรองสำหรับการค้นหาเว็บแบบเฉพาะเจาะจง สำหรับผู้ให้บริการที่ไม่จำเป็นต้องเชื่อมโยงการเปิดใช้งาน Plugin |
    | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญาการกำหนดค่า/ข้อมูลรับรองสำหรับการค้นหาเว็บแบบเฉพาะเจาะจง เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวรับข้อมูลรับรองตามขอบเขต |
    | `plugin-sdk/provider-web-search` | ตัวช่วยการลงทะเบียน/แคช/รันไทม์ของผู้ให้บริการค้นหาเว็บ |
    | `plugin-sdk/embedding-providers` | ชนิดผู้ให้บริการ embedding ทั่วไปและตัวช่วยอ่าน รวมถึง `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` และ `listEmbeddingProviders(...)`; Plugin ลงทะเบียนผู้ให้บริการผ่าน `api.registerEmbeddingProvider(...)` เพื่อบังคับใช้ความเป็นเจ้าของ manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` และการล้างสคีมา + การวินิจฉัยสำหรับ DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | ชนิดสแนปช็อตการใช้งานของผู้ให้บริการ ตัวช่วยดึงข้อมูลการใช้งานที่ใช้ร่วมกัน และตัวดึงข้อมูลของผู้ให้บริการ เช่น `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ชนิดตัวห่อหุ้มสตรีม ความเข้ากันได้ของการเรียกเครื่องมือแบบข้อความธรรมดา และตัวช่วยตัวห่อหุ้มที่ใช้ร่วมกันสำหรับ Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | ตัวช่วยตัวห่อหุ้มสตรีมของผู้ให้บริการแบบสาธารณะที่ใช้ร่วมกัน รวมถึง `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` และยูทิลิตีสตรีมที่เข้ากันได้กับ Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | ตัวช่วยการขนส่งแบบเนทีฟของผู้ให้บริการ เช่น การดึงข้อมูลที่มีการป้องกัน การแยกข้อความผลลัพธ์ของเครื่องมือ การแปลงข้อความการขนส่ง และสตรีมเหตุการณ์การขนส่งที่เขียนได้ |
    | `plugin-sdk/provider-onboard` | ตัวช่วยแพตช์การกำหนดค่าสำหรับการเริ่มต้นใช้งาน |
    | `plugin-sdk/global-singleton` | ตัวช่วย singleton/map/cache ภายในกระบวนการ |
    | `plugin-sdk/group-activation` | ตัวช่วยโหมดการเปิดใช้งานกลุ่มและการแยกวิเคราะห์คำสั่งแบบเฉพาะเจาะจง |
  </Accordion>

โดยปกติ สแนปช็อตการใช้งานของผู้ให้บริการจะรายงานโควตา `windows` อย่างน้อยหนึ่งรายการ โดยแต่ละรายการมี
ป้ายกำกับ เปอร์เซ็นต์ที่ใช้ และเวลารีเซ็ตซึ่งระบุหรือไม่ก็ได้ ผู้ให้บริการที่แสดงยอดคงเหลือหรือ
ข้อความสถานะบัญชีแทนช่วงโควตาที่รีเซ็ตได้ ควรส่งคืน
`summary` พร้อมอาร์เรย์ `windows` ว่าง แทนการสร้างเปอร์เซ็นต์ขึ้นมา
OpenClaw จะแสดงข้อความสรุปนั้นในเอาต์พุตสถานะ ให้ใช้ `error` เฉพาะเมื่อ
เอนด์พอยต์การใช้งานล้มเหลวหรือไม่ส่งคืนข้อมูลการใช้งานที่นำไปใช้ได้

  <Accordion title="พาธย่อยสำหรับการยืนยันตัวตนและความปลอดภัย">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | พื้นผิวการอนุญาตคำสั่งแบบกว้างซึ่งเลิกใช้แล้ว (`resolveControlCommandGate`, ตัวช่วยรีจิสทรีคำสั่ง รวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก, ตัวช่วยการอนุญาตผู้ส่ง); ให้ใช้การอนุญาตที่ทางเข้าช่องทาง/รันไทม์ หรือตัวช่วยสถานะคำสั่ง |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความคำสั่ง/ความช่วยเหลือ เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | ตัวช่วยระบุผู้อนุมัติและการยืนยันตัวตนสำหรับการดำเนินการในแชตเดียวกัน |
    | `plugin-sdk/approval-client-runtime` | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติ exec แบบเนทีฟ |
    | `plugin-sdk/approval-delivery-runtime` | อะแดปเตอร์ความสามารถ/การส่งมอบการอนุมัติแบบเนทีฟ |
    | `plugin-sdk/approval-gateway-runtime` | ตัวระบุ Gateway การอนุมัติที่ใช้ร่วมกัน |
    | `plugin-sdk/approval-reference-runtime` | ตัวช่วยตัวระบุตำแหน่งถาวรแบบกำหนดแน่นอน สำหรับคอลแบ็กการอนุมัติที่ถูกจำกัดโดยการขนส่ง |
    | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยโหลดอะแดปเตอร์การอนุมัติแบบเนทีฟที่มีน้ำหนักเบา สำหรับจุดเข้าช่องทางที่ใช้งานบ่อย |
    | `plugin-sdk/approval-handler-runtime` | ตัวช่วยรันไทม์ของตัวจัดการการอนุมัติที่ครอบคลุมกว่า ควรใช้จุดเชื่อมต่ออะแดปเตอร์/Gateway ที่เฉพาะเจาะจงกว่าเมื่อเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติแบบเนทีฟ การผูกบัญชี เกตเส้นทาง ทางเลือกสำรองสำหรับการส่งต่อ และการระงับพรอมต์ exec แบบเนทีฟภายใน |
    | `plugin-sdk/approval-reaction-runtime` | การผูกรีแอ็กชันการอนุมัติแบบฮาร์ดโค้ด เพย์โหลดพรอมต์รีแอ็กชัน ที่เก็บเป้าหมายรีแอ็กชัน ตัวช่วยข้อความคำแนะนำรีแอ็กชัน และการส่งออกเพื่อความเข้ากันได้สำหรับการระงับพรอมต์ exec แบบเนทีฟภายใน |
    | `plugin-sdk/approval-reply-runtime` | ตัวช่วยเพย์โหลดการตอบกลับการอนุมัติ exec/Plugin |
    | `plugin-sdk/approval-runtime` | ตัวช่วยเพย์โหลดการอนุมัติ exec/Plugin, ตัวสร้างความสามารถการอนุมัติ, ตัวช่วยการยืนยันตัวตน/โปรไฟล์การอนุมัติ, ตัวช่วยการกำหนดเส้นทาง/รันไทม์การอนุมัติแบบเนทีฟ และตัวช่วยแสดงผลการอนุมัติแบบมีโครงสร้าง เช่น `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | ตัวช่วยรีเซ็ตการขจัดรายการซ้ำของการตอบกลับขาเข้าแบบเฉพาะเจาะจงซึ่งเลิกใช้แล้ว |
    | `plugin-sdk/command-auth-native` | การยืนยันตัวตนคำสั่งแบบเนทีฟ การจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก และตัวช่วยเป้าหมายเซสชันแบบเนทีฟ |
    | `plugin-sdk/command-detection` | ตัวช่วยตรวจจับคำสั่งที่ใช้ร่วมกัน |
    | `plugin-sdk/command-primitives-runtime` | เพรดิเคตข้อความคำสั่งที่มีน้ำหนักเบา สำหรับพาธช่องทางที่ใช้งานบ่อย |
    | `plugin-sdk/command-surface` | ตัวช่วยปรับเนื้อหาคำสั่งให้เป็นมาตรฐานและพื้นผิวคำสั่ง |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | ตัวช่วยโฟลว์เข้าสู่ระบบการยืนยันตัวตนของผู้ให้บริการแบบ lazy สำหรับการจับคู่ด้วยรหัสอุปกรณ์ในช่องทางส่วนตัวและ Web UI |
    | `plugin-sdk/channel-secret-runtime` | พื้นผิวสัญญาความลับแบบกว้างซึ่งเลิกใช้แล้ว (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, ชนิดเป้าหมายความลับ); ควรใช้พาธย่อยเฉพาะด้านล่าง |
    | `plugin-sdk/channel-secret-basic-runtime` | การส่งออกสัญญาความลับแบบเฉพาะเจาะจงและตัวสร้างรีจิสทรีเป้าหมาย สำหรับพื้นผิวความลับของช่องทาง/Plugin ที่ไม่ใช่ TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | ตัวช่วยกำหนดความลับ TTS ของช่องทางแบบซ้อนที่เฉพาะเจาะจง |
    | `plugin-sdk/secret-ref-runtime` | การกำหนดชนิด การระบุค่า และการค้นหาพาธเป้าหมายของแผนสำหรับ SecretRef แบบเฉพาะเจาะจง เพื่อใช้แยกวิเคราะห์สัญญาความลับ/การกำหนดค่า |
    | `plugin-sdk/secret-provider-integration` | สัญญา manifest และพรีเซ็ตการผสานรวมผู้ให้บริการ SecretRef แบบชนิดเท่านั้น สำหรับ Plugin ที่เผยแพร่พรีเซ็ตผู้ให้บริการความลับภายนอก |
    | `plugin-sdk/security-runtime` | barrel แบบกว้างซึ่งเลิกใช้แล้ว สำหรับความเชื่อถือ การควบคุม DM ตัวช่วยไฟล์/พาธที่จำกัดภายในรูท รวมถึงการเขียนแบบสร้างเท่านั้น การแทนที่ไฟล์แบบอะตอมมิกทั้งซิงก์/อะซิงก์ การเขียนไฟล์ชั่วคราวข้างเคียง ทางเลือกสำรองสำหรับการย้ายข้ามอุปกรณ์ ตัวช่วยที่เก็บไฟล์ส่วนตัว การป้องกันพาเรนต์ที่เป็น symlink เนื้อหาภายนอก การปกปิดข้อความละเอียดอ่อน การเปรียบเทียบความลับแบบใช้เวลาคงที่ และตัวช่วยรวบรวมความลับ; ควรใช้พาธย่อยด้านความปลอดภัย/SSRF/ความลับที่เฉพาะเจาะจง |
    | `plugin-sdk/ssrf-policy` | ตัวช่วยรายการโฮสต์ที่อนุญาตและนโยบาย SSRF สำหรับเครือข่ายส่วนตัว |
    | `plugin-sdk/ssrf-dispatcher` | ตัวช่วย pinned dispatcher แบบเฉพาะเจาะจงที่ไม่รวมพื้นผิวรันไทม์โครงสร้างพื้นฐานแบบกว้าง |
    | `plugin-sdk/ssrf-runtime` | ตัวช่วย pinned dispatcher การดึงข้อมูลที่มีการป้องกัน SSRF ข้อผิดพลาด SSRF และนโยบาย SSRF |
    | `plugin-sdk/secret-input` | ตัวช่วยแยกวิเคราะห์อินพุตความลับ |
    | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ/เป้าหมาย Webhook และการบังคับแปลง websocket/body แบบดิบ |
    | `plugin-sdk/webhook-request-guards` | ตัวช่วยขนาด/การหมดเวลาของเนื้อหาคำขอ และ `runDetachedWebhookWork` สำหรับการประมวลผลหลังการตอบรับที่มีการติดตาม |
  </Accordion>

  <Accordion title="พาธย่อยของรันไทม์และพื้นที่จัดเก็บ">
    | พาธย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | ตัวช่วยสำหรับรันไทม์/การบันทึกล็อก/การสำรองข้อมูล คำเตือนเกี่ยวกับพาธติดตั้ง Plugin และตัวช่วยสำหรับโปรเซส |
    | `plugin-sdk/runtime-env` | ตัวช่วยแบบเจาะจงสำหรับสภาพแวดล้อมรันไทม์ ตัวบันทึกล็อก การหมดเวลา การลองใหม่ และการหน่วงเวลาแบบทวีคูณ |
    | `plugin-sdk/browser-config` | Facade การกำหนดค่าเบราว์เซอร์ที่รองรับ สำหรับโปรไฟล์/ค่าเริ่มต้นที่ปรับให้เป็นมาตรฐาน การแยกวิเคราะห์ URL ของ CDP และตัวช่วยการยืนยันตัวตนสำหรับการควบคุมเบราว์เซอร์ |
    | `plugin-sdk/agent-harness-task-runtime` | ตัวช่วยทั่วไปสำหรับวงจรชีวิตของงานและการส่งมอบเมื่อเสร็จสิ้น สำหรับเอเจนต์ที่มี harness รองรับโดยใช้ขอบเขตงานที่โฮสต์กำหนด |
    | `plugin-sdk/codex-mcp-projection` | ตัวช่วย Codex แบบรวมในชุดที่สงวนไว้ สำหรับฉายการกำหนดค่าเซิร์ฟเวอร์ MCP ของผู้ใช้ไปยังการกำหนดค่าเธรด Codex ไม่ได้มีไว้สำหรับ Plugin ของบุคคลที่สาม |
    | `plugin-sdk/codex-native-task-runtime` | ตัวช่วย Codex แบบรวมในชุดและอยู่ภายในรีโพสำหรับการเชื่อมต่อมิเรอร์งานดั้งเดิม/รันไทม์ ไม่ใช่รายการส่งออกของแพ็กเกจ |
    | `plugin-sdk/channel-runtime-context` | ตัวช่วยทั่วไปสำหรับการลงทะเบียนและค้นหาบริบทรันไทม์ของช่องทาง |
    | `plugin-sdk/matrix` | Facade ความเข้ากันได้ของ Matrix ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางของบุคคลที่สามรุ่นเก่า Plugin ใหม่ควรนำเข้า `plugin-sdk/run-command` โดยตรง |
    | `plugin-sdk/mattermost` | Facade ความเข้ากันได้ของ Mattermost ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางของบุคคลที่สามรุ่นเก่า Plugin ใหม่ควรนำเข้าพาธย่อย SDK ทั่วไปโดยตรง |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Barrel แบบกว้างที่เลิกใช้แล้วสำหรับตัวช่วยคำสั่ง/ฮุก/http/การโต้ตอบของ Plugin ควรใช้พาธย่อยรันไทม์ Plugin ที่เจาะจง |
    | `plugin-sdk/hook-runtime` | Barrel แบบกว้างที่เลิกใช้แล้วสำหรับตัวช่วย Webhook/ไปป์ไลน์ฮุกภายใน ควรใช้พาธย่อยรันไทม์ฮุก/Plugin ที่เจาะจง |
    | `plugin-sdk/lazy-runtime` | ตัวช่วยการนำเข้า/ผูกมัดรันไทม์แบบ lazy เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod` และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | ตัวช่วยเรียกใช้โปรเซส |
    | `plugin-sdk/node-host` | ตัวช่วยแก้ไขตำแหน่งไฟล์ปฏิบัติการบนโฮสต์ Node และดำเนินการ PTY ต่อ |
    | `plugin-sdk/cli-runtime` | Barrel แบบกว้างที่เลิกใช้แล้วสำหรับการจัดรูปแบบ CLI การรอ เวอร์ชัน การเรียกใช้ด้วยอาร์กิวเมนต์ และตัวช่วยกลุ่มคำสั่งแบบ lazy ควรใช้พาธย่อย CLI/รันไทม์ที่เจาะจง |
    | `plugin-sdk/qa-runner-runtime` | Facade ที่รองรับซึ่งเปิดเผยสถานการณ์ QA ของ Plugin ผ่านพื้นผิวคำสั่ง CLI |
    | `plugin-sdk/tts-runtime` | Facade ที่รองรับสำหรับสคีมาการกำหนดค่าการแปลงข้อความเป็นเสียงและตัวช่วยรันไทม์ |
    | `plugin-sdk/gateway-method-runtime` | ตัวช่วยจัดส่งเมธอด Gateway ที่สงวนไว้สำหรับเส้นทาง HTTP ของ Plugin ซึ่งประกาศ `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | ไคลเอนต์ Gateway ตัวช่วยเริ่มต้นไคลเอนต์เมื่อ event loop พร้อม RPC ของ CLI สำหรับ Gateway ข้อผิดพลาดของโปรโตคอล Gateway การแก้ไขโฮสต์ LAN ที่ประกาศ และตัวช่วยแพตช์สถานะช่องทาง |
    | `plugin-sdk/config-contracts` | พื้นผิวการกำหนดค่าแบบชนิดข้อมูลเท่านั้นที่เจาะจง สำหรับรูปแบบการกำหนดค่า Plugin เช่น `OpenClawConfig` และชนิดการกำหนดค่าช่องทาง/ผู้ให้บริการ |
    | `plugin-sdk/plugin-config-runtime` | ตัวช่วยการกำหนดค่า Plugin ขณะรันไทม์ เช่น `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject` และ `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | ตัวช่วยแก้ไขการกำหนดค่าแบบธุรกรรม เช่น `mutateConfigFile`, `replaceConfigFile` และ `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | สตริงคำแนะนำเมทาดาทาการส่งมอบที่ใช้ร่วมกันสำหรับเครื่องมือข้อความ |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วยสแนปช็อตการกำหนดค่าของโปรเซสปัจจุบัน เช่น `getRuntimeConfig`, `getRuntimeConfigSnapshot` และตัวตั้งค่าสแนปช็อตสำหรับการทดสอบ |
    | `plugin-sdk/text-autolink-runtime` | การตรวจจับลิงก์อัตโนมัติของการอ้างอิงไฟล์โดยไม่ใช้ Barrel ข้อความแบบกว้าง |
    | `plugin-sdk/reply-runtime` | ตัวช่วยรันไทม์ขาเข้า/การตอบกลับที่ใช้ร่วมกัน การแบ่งเป็นส่วน การจัดส่ง Heartbeat และตัววางแผนการตอบกลับ |
    | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วยแบบเจาะจงสำหรับการจัดส่ง/ปิดท้ายการตอบกลับและป้ายกำกับการสนทนา |
    | `plugin-sdk/reply-history` | ตัวช่วยประวัติการตอบกลับในช่วงเวลาสั้นที่ใช้ร่วมกัน โค้ดรอบข้อความใหม่ควรใช้ `createChannelHistoryWindow` ส่วนตัวช่วยแผนที่ระดับล่างยังคงเป็นเพียงรายการส่งออกเพื่อความเข้ากันได้ที่เลิกใช้แล้ว |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ตัวช่วยแบบเจาะจงสำหรับแบ่งข้อความ/Markdown เป็นส่วน |
    | `plugin-sdk/session-store-runtime` | ตัวช่วยเวิร์กโฟลว์เซสชัน (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`) ตัวช่วยซ่อมแซม/วงจรชีวิต (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`) ตัวช่วยมาร์กเกอร์สำหรับค่า `sessionFile` ช่วงเปลี่ยนผ่าน การอ่านข้อความทรานสคริปต์ล่าสุดของผู้ใช้/ผู้ช่วยแบบมีขอบเขตตามข้อมูลประจำตัวของเซสชัน ตัวช่วยพาธที่เก็บเซสชัน/คีย์เซสชัน และการอ่านเวลาที่อัปเดต โดยไม่มีการนำเข้าการเขียน/บำรุงรักษาการกำหนดค่าแบบกว้าง |
    | `plugin-sdk/session-transcript-runtime` | ข้อมูลประจำตัวของทรานสคริปต์ ตัวช่วยเป้าหมาย/อ่าน/เขียนแบบมีขอบเขต การฉายรายการข้อความที่มองเห็นได้ การเผยแพร่การอัปเดต ล็อกการเขียน และคีย์การพบข้อมูลในหน่วยความจำทรานสคริปต์ |
    | `plugin-sdk/sqlite-runtime` | ตัวช่วยแบบเจาะจงสำหรับสคีมาเอเจนต์ SQLite พาธ และธุรกรรมสำหรับรันไทม์ของบุคคลที่หนึ่ง โดยไม่มีส่วนควบคุมวงจรชีวิตฐานข้อมูล |
    | `plugin-sdk/cron-store-runtime` | ตัวช่วยพาธ/โหลด/บันทึกที่เก็บ Cron |
    | `plugin-sdk/state-paths` | ตัวช่วยพาธไดเรกทอรีสถานะ/OAuth |
    | `plugin-sdk/plugin-state-runtime` | ชนิดสถานะแบบใช้คีย์ของ SQLite sidecar สำหรับ Plugin พร้อม pragma การเชื่อมต่อแบบรวมศูนย์ การบำรุงรักษา WAL ที่ผ่านการตรวจสอบ และตัวช่วยย้ายสคีมา STRICT แบบอะตอมสำหรับฐานข้อมูลที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/routing` | ตัวช่วยผูกมัดเส้นทาง/คีย์เซสชัน/บัญชี เช่น `resolveAgentRoute`, `buildAgentSessionKey` และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ตัวช่วยสรุปสถานะช่องทาง/บัญชีที่ใช้ร่วมกัน ค่าเริ่มต้นสถานะรันไทม์ และตัวช่วยเมทาดาทาปัญหา |
    | `plugin-sdk/target-resolver-runtime` | ตัวช่วยแก้ไขเป้าหมายที่ใช้ร่วมกัน |
    | `plugin-sdk/string-normalization-runtime` | ตัวช่วยปรับ slug/สตริงให้เป็นมาตรฐาน |
    | `plugin-sdk/request-url` | แยก URL แบบสตริงออกจากอินพุตที่มีลักษณะคล้าย fetch/request |
    | `plugin-sdk/run-command` | ตัวเรียกใช้คำสั่งแบบกำหนดเวลา พร้อมผลลัพธ์ stdout/stderr ที่ปรับให้เป็นมาตรฐาน |
    | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ทั่วไปของเครื่องมือ/CLI |
    | `plugin-sdk/tool-plugin` | กำหนด Plugin เครื่องมือเอเจนต์แบบมีชนิดข้อมูลอย่างง่าย และเปิดเผยเมทาดาทาคงที่สำหรับการสร้างแมนิเฟสต์ |
    | `plugin-sdk/tool-payload` | แยกเพย์โหลดที่ปรับให้เป็นมาตรฐานออกจากออบเจ็กต์ผลลัพธ์เครื่องมือ |
    | `plugin-sdk/tool-send` | แยกฟิลด์เป้าหมายการส่งแบบมาตรฐานออกจากอาร์กิวเมนต์ของเครื่องมือ |
    | `plugin-sdk/sandbox` | ชนิดแบ็กเอนด์ Sandbox และตัวช่วยคำสั่ง SSH/OpenShell รวมถึงการตรวจสอบคำสั่ง exec ล่วงหน้าแบบหยุดทันทีเมื่อผิดพลาด |
    | `plugin-sdk/temp-path` | ตัวช่วยพาธดาวน์โหลดชั่วคราวที่ใช้ร่วมกันและพื้นที่ทำงานชั่วคราวส่วนตัวที่ปลอดภัย |
    | `plugin-sdk/logging-core` | ตัวบันทึกล็อกของระบบย่อยและตัวช่วยปกปิดข้อมูล |
    | `plugin-sdk/markdown-table-runtime` | โหมดตาราง Markdown และตัวช่วยการแปลง |
    | `plugin-sdk/model-session-runtime` | ตัวช่วยแทนที่โมเดล/เซสชัน เช่น `applyModelOverrideToSessionEntry` และ `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | ตัวช่วยแก้ไขการกำหนดค่าผู้ให้บริการสนทนา |
    | `plugin-sdk/json-store` | ตัวช่วยขนาดเล็กสำหรับอ่าน/เขียนสถานะ JSON |
    | `plugin-sdk/json-unsafe-integers` | ตัวช่วยแยกวิเคราะห์ JSON ที่เก็บลิเทอรัลจำนวนเต็มที่ไม่ปลอดภัยไว้เป็นสตริง |
    | `plugin-sdk/file-lock` | ตัวช่วยล็อกไฟล์แบบกลับเข้าได้ |
    | `plugin-sdk/persistent-dedupe` | ตัวช่วยแคชขจัดรายการซ้ำที่มีดิสก์รองรับ |
    | `plugin-sdk/acp-runtime` | ตัวช่วยรันไทม์/เซสชัน ACP และการจัดส่งการตอบกลับ |
    | `plugin-sdk/acp-runtime-backend` | ตัวช่วยลงทะเบียนแบ็กเอนด์ ACP แบบน้ำหนักเบาและจัดส่งการตอบกลับสำหรับ Plugin ที่โหลดเมื่อเริ่มต้น |
    | `plugin-sdk/acp-binding-resolve-runtime` | การแก้ไขการผูกมัด ACP แบบอ่านอย่างเดียวโดยไม่นำเข้าส่วนเริ่มต้นวงจรชีวิต |
    | `plugin-sdk/agent-config-primitives` | Primitive สคีมาการกำหนดค่ารันไทม์ของเอเจนต์ที่เลิกใช้แล้ว ให้นำเข้า primitive ของสคีมาจากพื้นผิวที่ Plugin ซึ่งได้รับการบำรุงรักษาเป็นเจ้าของ |
    | `plugin-sdk/boolean-param` | ตัวอ่านพารามิเตอร์บูลีนแบบยืดหยุ่น |
    | `plugin-sdk/dangerous-name-runtime` | ตัวช่วยแก้ไขการจับคู่ชื่อที่เป็นอันตราย |
    | `plugin-sdk/device-bootstrap` | ตัวช่วยบูตสแตรปอุปกรณ์และโทเค็นการจับคู่ รวมถึง `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Primitive ตัวช่วยที่ใช้ร่วมกันสำหรับช่องทางแบบรับอย่างเดียว สถานะ และพร็อกซีแวดล้อม |
    | `plugin-sdk/models-provider-runtime` | ตัวช่วยการตอบกลับสำหรับคำสั่ง/ผู้ให้บริการ `/models` |
    | `plugin-sdk/skill-commands-runtime` | ตัวช่วยแสดงรายการคำสั่ง Skill |
    | `plugin-sdk/native-command-registry` | ตัวช่วยรีจิสทรี/สร้าง/ทำให้เป็นอนุกรมสำหรับคำสั่งดั้งเดิม |
    | `plugin-sdk/agent-harness` | พื้นผิวทดลองสำหรับ Plugin ที่เชื่อถือได้สำหรับ harness เอเจนต์ระดับล่าง: ชนิด harness ตัวช่วยควบคุมทิศทาง/ยกเลิกการทำงานที่กำลังดำเนินอยู่ ตัวช่วยบริดจ์เครื่องมือ OpenClaw ตัวช่วยนโยบายเครื่องมือแผนรันไทม์ การจัดประเภทผลลัพธ์ปลายทาง การจัดรูปแบบ/รายละเอียดความคืบหน้าของเครื่องมือ และยูทิลิตีผลลัพธ์ของความพยายาม |
    | `plugin-sdk/provider-zai-endpoint` | Facade การตรวจจับเอนด์พอยต์ที่ผู้ให้บริการ Z.AI เป็นเจ้าของซึ่งเลิกใช้แล้ว ให้ใช้ API สาธารณะของ Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | ตัวช่วยล็อกแบบอะซิงโครนัสภายในโปรเซสสำหรับไฟล์สถานะรันไทม์ขนาดเล็ก |
    | `plugin-sdk/channel-activity-runtime` | ตัวช่วยเทเลเมทรีกิจกรรมช่องทาง |
    | `plugin-sdk/concurrency-runtime` | ตัวช่วยควบคุมการทำงานพร้อมกันของงานอะซิงโครนัสแบบมีขอบเขต |
    | `plugin-sdk/dedupe-runtime` | ตัวช่วยแคชขจัดรายการซ้ำในหน่วยความจำและที่มีพื้นที่จัดเก็บถาวรรองรับ |
    | `plugin-sdk/delivery-queue-runtime` | ตัวช่วยระบายการส่งมอบขาออกที่รอดำเนินการ |
    | `plugin-sdk/file-access-runtime` | ตัวช่วยพาธไฟล์ภายในเครื่องและแหล่งสื่อที่ปลอดภัย |
    | `plugin-sdk/heartbeat-runtime` | ตัวช่วยปลุก เหตุการณ์ และการมองเห็นของ Heartbeat |
    | `plugin-sdk/expect-runtime` | ตัวช่วยยืนยันค่าที่จำเป็นสำหรับค่าคงที่รันไทม์ที่พิสูจน์ได้ |
    | `plugin-sdk/number-runtime` | ตัวช่วยบังคับแปลงเป็นตัวเลข |
    | `plugin-sdk/secure-random-runtime` | ตัวช่วยโทเค็น/UUID ที่ปลอดภัย |
    | `plugin-sdk/system-event-runtime` | ตัวช่วยคิวเหตุการณ์ระบบ |
    | `plugin-sdk/transport-ready-runtime` | ตัวช่วยรอความพร้อมของการขนส่ง |
    | `plugin-sdk/exec-approvals-runtime` | ตัวช่วยไฟล์นโยบายอนุมัติการเรียกใช้โดยไม่ใช้ Barrel infra-runtime แบบกว้าง |
    | `plugin-sdk/infra-runtime` | Shim ความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้พาธย่อยรันไทม์ที่เจาะจงด้านบน |
    | `plugin-sdk/collection-runtime` | ตัวช่วยแคชขนาดเล็กแบบมีขอบเขต |
    | `plugin-sdk/diagnostic-runtime` | ตัวช่วยแฟล็ก เหตุการณ์ และบริบทการติดตามเพื่อการวินิจฉัย |
    | `plugin-sdk/error-runtime` | ตัวช่วยกราฟข้อผิดพลาด การจัดรูปแบบ และการจัดประเภทข้อผิดพลาดที่ใช้ร่วมกัน `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ตัวช่วย fetch แบบห่อหุ้ม พร็อกซี ตัวเลือก EnvHttpProxyAgent และการค้นหาแบบตรึง |
    | `plugin-sdk/runtime-fetch` | fetch ขณะรันไทม์ที่รับรู้ Dispatcher โดยไม่นำเข้าพร็อกซี/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | ตัวช่วยล้างข้อมูล URL รูปภาพแบบอินไลน์และตรวจจับลายเซ็น โดยไม่ใช้พื้นผิวรันไทม์สื่อแบบกว้าง |
    | `plugin-sdk/response-limit-runtime` | ตัวอ่านเนื้อหาการตอบกลับที่จำกัดตามจำนวนไบต์ เวลาว่าง และกำหนดเวลา โดยไม่ใช้พื้นผิวรันไทม์สื่อแบบกว้าง |
    | `plugin-sdk/session-binding-runtime` | สถานะการผูกมัดการสนทนาปัจจุบัน โดยไม่มีการกำหนดเส้นทางการผูกมัดที่กำหนดค่าไว้หรือที่เก็บการจับคู่ |
    | `plugin-sdk/context-visibility-runtime` | การแก้ไขการมองเห็นบริบทและการกรองบริบทเสริม โดยไม่นำเข้าการกำหนดค่า/ความปลอดภัยแบบกว้าง |
    | `plugin-sdk/string-coerce-runtime` | ตัวช่วย primitive แบบเจาะจงสำหรับการบังคับแปลงและปรับเรคคอร์ด/สตริงให้เป็นมาตรฐาน โดยไม่นำเข้า Markdown/การบันทึกล็อก |
    | `plugin-sdk/html-entity-runtime` | การถอดรหัสเอนทิตี HTML5 ที่ลงท้ายด้วยเซมิโคลอนในรอบเดียว โดยไม่ใช้ยูทิลิตีข้อความแบบกว้าง |
    | `plugin-sdk/text-utility-runtime` | ตัวช่วยข้อความและพาธระดับล่าง รวมถึงการ Escape HTML ห้าเอนทิตี |
    | `plugin-sdk/widget-html` | การตรวจจับเอกสารที่สมบูรณ์ การตรวจสอบขนาด และข้อผิดพลาดอินพุตเครื่องมือสำหรับวิดเจ็ต HTML แบบสมบูรณ์ในตัว |
    | `plugin-sdk/host-runtime` | ตัวช่วยปรับชื่อโฮสต์และโฮสต์ SCP ให้เป็นมาตรฐาน |
    | `plugin-sdk/retry-runtime` | ตัวช่วยการกำหนดค่าการลองใหม่และตัวเรียกใช้การลองใหม่ |
    | `plugin-sdk/agent-runtime` | Barrel แบบกว้างที่เลิกใช้แล้วสำหรับตัวช่วยไดเรกทอรี/ข้อมูลประจำตัว/พื้นที่ทำงานของเอเจนต์ รวมถึง `resolveAgentDir`, `resolveDefaultAgentDir` และรายการส่งออกความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว ควรใช้พาธย่อยเอเจนต์/รันไทม์ที่เจาะจง |
    | `plugin-sdk/directory-runtime` | การสืบค้น/ขจัดรายการซ้ำของไดเรกทอรีที่มีการกำหนดค่ารองรับ |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="เส้นทางย่อยสำหรับความสามารถและการทดสอบ">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | barrel สื่อแบบกว้างที่เลิกใช้แล้ว ซึ่งรวมถึง `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` และ `fetchRemoteMedia` ที่เลิกใช้แล้ว ให้เลือกใช้ `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` และเส้นทางย่อยของรันไทม์ความสามารถแทน และควรเลือกใช้ตัวช่วยของสโตร์ก่อนการอ่านบัฟเฟอร์เมื่อ URL ควรถูกแปลงเป็นสื่อของ OpenClaw |
    | `plugin-sdk/media-mime` | ตัวช่วยแบบเจาะจงสำหรับการปรับ MIME ให้เป็นมาตรฐาน การแมปนามสกุลไฟล์ การตรวจหา MIME และชนิดสื่อ |
    | `plugin-sdk/media-store` | ตัวช่วยสโตร์สื่อแบบเจาะจง เช่น `saveMediaBuffer` และ `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | ตัวช่วยการสลับไปใช้ตัวสำรองร่วมกันสำหรับการสร้างสื่อ การเลือกตัวเลือก และข้อความแจ้งเมื่อไม่มีโมเดล |
    | `plugin-sdk/media-understanding` | ชนิดผู้ให้บริการสำหรับการทำความเข้าใจสื่อ รวมถึงรายการส่งออกของตัวช่วยสำหรับรูปภาพ เสียง และการสกัดข้อมูลแบบมีโครงสร้างที่ใช้กับผู้ให้บริการ |
    | `plugin-sdk/text-chunking` | การแบ่งข้อความขาออกและช่วงโดยรักษาออฟเซ็ต การแบ่ง Markdown และตัวช่วยเรนเดอร์ การแยกโทเค็นแท็ก HTML โดยคำนึงถึงเครื่องหมายคำพูด การแปลงตาราง Markdown การลบแท็กคำสั่ง และยูทิลิตีข้อความที่ปลอดภัย |
    | `plugin-sdk/speech` | ชนิดผู้ให้บริการเสียงพูด รวมถึงรายการส่งออกของคำสั่ง รีจิสทรี การตรวจสอบ ตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI และตัวช่วยเสียงพูดสำหรับผู้ให้บริการ |
    | `plugin-sdk/speech-core` | ชนิดผู้ให้บริการเสียงพูด รีจิสทรี คำสั่ง การปรับให้เป็นมาตรฐาน และรายการส่งออกของตัวช่วยเสียงพูดที่ใช้ร่วมกัน |
    | `plugin-sdk/realtime-transcription` | ชนิดผู้ให้บริการการถอดเสียงแบบเรียลไทม์ ตัวช่วยรีจิสทรี และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
    | `plugin-sdk/realtime-bootstrap-context` | ตัวช่วยเริ่มต้นโปรไฟล์แบบเรียลไทม์สำหรับการแทรกบริบท `IDENTITY.md`, `USER.md` และ `SOUL.md` แบบมีขอบเขต |
    | `plugin-sdk/realtime-voice` | ชนิดผู้ให้บริการเสียงแบบเรียลไทม์ ตัวช่วยรีจิสทรี และตัวช่วยพฤติกรรมเสียงแบบเรียลไทม์ที่ใช้ร่วมกัน รวมถึงการติดตามกิจกรรมเอาต์พุต |
    | `plugin-sdk/image-generation` | ชนิดผู้ให้บริการการสร้างรูปภาพ รวมถึงตัวช่วยแอสเซ็ตรูปภาพ/URL ข้อมูล และตัวสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
    | `plugin-sdk/image-generation-core` | ชนิด การสลับไปใช้ตัวสำรอง การยืนยันตัวตน และตัวช่วยรีจิสทรีสำหรับการสร้างรูปภาพที่ใช้ร่วมกัน |
    | `plugin-sdk/music-generation` | ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างเพลง |
    | `plugin-sdk/music-generation-core` | ชนิดการสร้างเพลง ตัวช่วยการสลับไปใช้ตัวสำรอง การค้นหาผู้ให้บริการ และการแยกวิเคราะห์การอ้างอิงโมเดลที่ใช้ร่วมกันซึ่งเลิกใช้แล้ว ให้เลือกใช้พื้นผิวผู้ให้บริการเพลงที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/video-generation` | ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างวิดีโอ |
    | `plugin-sdk/video-generation-core` | ชนิดการสร้างวิดีโอ ตัวช่วยการสลับไปใช้ตัวสำรอง การค้นหาผู้ให้บริการ และการแยกวิเคราะห์การอ้างอิงโมเดลที่ใช้ร่วมกัน |
    | `plugin-sdk/transcripts` | ชนิดผู้ให้บริการแหล่งที่มาของข้อความถอดเสียง ตัวช่วยรีจิสทรี ตัวอธิบายเซสชัน และเมทาดาทาของถ้อยคำที่ใช้ร่วมกัน |
    | `plugin-sdk/webhook-targets` | รีจิสทรีเป้าหมาย Webhook และตัวช่วยติดตั้งเส้นทาง |
    | `plugin-sdk/webhook-path` | นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | ตัวช่วยโหลดสื่อจากระยะไกล/ภายในเครื่องที่ใช้ร่วมกัน |
    | `plugin-sdk/zod` | การส่งออกซ้ำเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้นำเข้า `zod` จาก `zod` โดยตรง |
    | `plugin-sdk/plugin-test-api` | ตัวช่วย `createTestPluginApi` ขั้นต่ำภายในรีโปสำหรับการทดสอบหน่วยการลงทะเบียน Plugin โดยตรง โดยไม่ต้องนำเข้าบริดจ์ตัวช่วยทดสอบของรีโป |
    | `plugin-sdk/agent-runtime-test-contracts` | ฟิกซ์เจอร์สัญญาอะแดปเตอร์รันไทม์เอเจนต์แบบเนทีฟภายในรีโป สำหรับการทดสอบการยืนยันตัวตน การส่งมอบ การสลับไปใช้ตัวสำรอง ฮุกเครื่องมือ โอเวอร์เลย์พรอมต์ สคีมา และการฉายภาพทรานสคริปต์ |
    | `plugin-sdk/channel-test-helpers` | ตัวช่วยทดสอบที่เน้นช่องทางภายในรีโป สำหรับสัญญาการดำเนินการ/การตั้งค่า/สถานะทั่วไป การตรวจสอบไดเรกทอรี วงจรชีวิตการเริ่มต้นบัญชี การส่งต่อคอนฟิกการส่ง ม็อกรันไทม์ ปัญหาสถานะ การส่งมอบขาออก และการลงทะเบียนฮุก |
    | `plugin-sdk/channel-target-testing` | ชุดกรณีทดสอบข้อผิดพลาดของการแก้ไขเป้าหมายที่ใช้ร่วมกันภายในรีโปสำหรับการทดสอบช่องทาง |
    | `plugin-sdk/channel-contract-testing` | ตัวช่วยทดสอบสัญญาช่องทางแบบเจาะจงภายในรีโป โดยไม่ใช้ barrel การทดสอบแบบกว้าง |
    | `plugin-sdk/plugin-test-contracts` | ตัวช่วยสัญญาภายในรีโปสำหรับแพ็กเกจ Plugin การลงทะเบียน อาร์ติแฟกต์สาธารณะ การนำเข้าโดยตรง API รันไทม์ และผลข้างเคียงจากการนำเข้า |
    | `plugin-sdk/plugin-state-test-runtime` | ตัวช่วยทดสอบภายในรีโปสำหรับสโตร์สถานะ Plugin คิวขาเข้า และฐานข้อมูลสถานะ |
    | `plugin-sdk/provider-test-contracts` | ตัวช่วยสัญญาภายในรีโปสำหรับรันไทม์ผู้ให้บริการ การยืนยันตัวตน การค้นพบ การเริ่มต้นใช้งาน แค็ตตาล็อก วิซาร์ด ความสามารถด้านสื่อ นโยบายเล่นซ้ำ เสียงสดสำหรับ STT แบบเรียลไทม์ การค้นหา/ดึงข้อมูลเว็บ และสตรีม |
    | `plugin-sdk/provider-http-test-mocks` | ม็อก HTTP/การยืนยันตัวตนของ Vitest แบบเลือกใช้ภายในรีโป สำหรับการทดสอบผู้ให้บริการที่เรียกใช้ `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | ตัวช่วยภายในรีโปสำหรับแนบเมทาดาทากับฟิกซ์เจอร์เพย์โหลดการตอบกลับ |
    | `plugin-sdk/sqlite-runtime-testing` | ตัวช่วยวงจรชีวิต SQLite ภายในรีโปสำหรับการทดสอบของบุคคลที่หนึ่ง |
    | `plugin-sdk/test-fixtures` | ฟิกซ์เจอร์ภายในรีโปสำหรับการจับรันไทม์ CLI ทั่วไป บริบทแซนด์บ็อกซ์ ตัวเขียนสกิล ข้อความเอเจนต์ เหตุการณ์ระบบ การโหลดโมดูลใหม่ เส้นทาง Plugin ที่รวมมาให้ ข้อความเทอร์มินัล การแบ่งส่วน โทเค็นการยืนยันตัวตน และกรณีที่มีชนิด |
    | `plugin-sdk/test-node-mocks` | ตัวช่วยม็อก Node builtin แบบเจาะจงภายในรีโป สำหรับใช้ภายในแฟกทอรี `vi.mock("node:*")` ของ Vitest |
  </Accordion>

  <Accordion title="เส้นทางย่อยของหน่วยความจำ">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/memory-core` | นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | facade รันไทม์ดัชนี/การค้นหาหน่วยความจำที่เลิกใช้แล้ว ให้เลือกใช้เส้นทางย่อยของโฮสต์หน่วยความจำที่ไม่ผูกกับผู้จำหน่าย |
    | `plugin-sdk/memory-core-host-embedding-registry` | ตัวช่วยรีจิสทรีผู้ให้บริการ embedding ของหน่วยความจำแบบน้ำหนักเบา |
    | `plugin-sdk/memory-core-host-engine-foundation` | รายการส่งออกของเอนจินพื้นฐานสำหรับโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | สัญญา embedding ของโฮสต์หน่วยความจำ การเข้าถึงรีจิสทรี ผู้ให้บริการภายในเครื่อง และตัวช่วยทั่วไปสำหรับการทำงานแบบแบตช์/ระยะไกล `registerMemoryEmbeddingProvider` บนพื้นผิวนี้เลิกใช้แล้ว ให้ใช้ API ผู้ให้บริการ embedding ทั่วไปสำหรับผู้ให้บริการรายใหม่ |
    | `plugin-sdk/memory-core-host-engine-qmd` | รายการส่งออกของเอนจิน QMD สำหรับโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-storage` | รายการส่งออกของเอนจินพื้นที่จัดเก็บสำหรับโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วยมัลติโมดัลของโฮสต์หน่วยความจำที่เลิกใช้แล้ว ให้เลือกใช้เส้นทางย่อยของโฮสต์หน่วยความจำที่ไม่ผูกกับผู้จำหน่าย |
    | `plugin-sdk/memory-core-host-query` | ตัวช่วยการสืบค้นของโฮสต์หน่วยความจำที่เลิกใช้แล้ว ให้เลือกใช้เส้นทางย่อยของโฮสต์หน่วยความจำที่ไม่ผูกกับผู้จำหน่าย |
    | `plugin-sdk/memory-core-host-secret` | ตัวช่วยข้อมูลลับของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-events` | นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | ตัวช่วยสถานะของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-cli` | ตัวช่วยรันไทม์ CLI ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-core` | ตัวช่วยรันไทม์แกนหลักของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-core` | นามแฝงที่ไม่ผูกกับผู้จำหน่ายสำหรับตัวช่วยรันไทม์แกนหลักของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-events` | นามแฝงที่ไม่ผูกกับผู้จำหน่ายสำหรับตัวช่วยบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-files` | นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | ตัวช่วย Markdown ที่มีการจัดการซึ่งใช้ร่วมกันสำหรับ Plugin ที่เกี่ยวข้องกับหน่วยความจำ |
    | `plugin-sdk/memory-host-search` | facade รันไทม์ Active Memory สำหรับการเข้าถึงตัวจัดการการค้นหา |
    | `plugin-sdk/memory-host-status` | นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="เส้นทางย่อยของตัวช่วยแบบรวมที่สงวนไว้">
    เส้นทางย่อย SDK ของตัวช่วยแบบรวมที่สงวนไว้เป็นพื้นผิวแบบเจาะจงและแคบ
    สำหรับโค้ด Plugin ที่รวมมาให้ โดยมีเจ้าของเฉพาะ พื้นผิวเหล่านี้ถูกติดตามในคลังรายการ SDK เพื่อให้การบิลด์แพ็กเกจ
    และการกำหนดนามแฝงมีความแน่นอน แต่ไม่ใช่ API ทั่วไปสำหรับ
    การพัฒนา Plugin สัญญาโฮสต์ใหม่ที่นำกลับมาใช้ซ้ำได้ควรใช้เส้นทางย่อย SDK ทั่วไป
    เช่น `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` และ
    `plugin-sdk/plugin-config-runtime`

    | เส้นทางย่อย | เจ้าของและวัตถุประสงค์ |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | ตัวช่วยของ Plugin Codex ที่รวมมาให้ สำหรับฉายคอนฟิกเซิร์ฟเวอร์ MCP ของผู้ใช้ไปยังคอนฟิกเธรดของเซิร์ฟเวอร์แอป Codex (การส่งออกแพ็กเกจที่สงวนไว้) |
    | `plugin-sdk/codex-native-task-runtime` | ตัวช่วยของ Plugin Codex ที่รวมมาให้ สำหรับสะท้อนซับเอเจนต์แบบเนทีฟของเซิร์ฟเวอร์แอป Codex ไปยังสถานะงานของ OpenClaw (ใช้ภายในรีโปเท่านั้น ไม่ใช่การส่งออกแพ็กเกจ) |

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวม SDK ของ Plugin](/th/plugins/sdk-overview)
- [การตั้งค่า SDK ของ Plugin](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
