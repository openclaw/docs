---
read_when:
    - การเลือกพาธย่อย plugin-sdk ที่เหมาะสมสำหรับการนำเข้า Plugin
    - การตรวจสอบพาธย่อยของ Plugin ที่รวมมาให้และส่วนติดต่อของตัวช่วย
summary: 'แค็ตตาล็อกพาธย่อยของ Plugin SDK: การนำเข้าแต่ละรายการอยู่ที่ใด โดยจัดกลุ่มตามหมวดหมู่'
title: พาธย่อยของ Plugin SDK
x-i18n:
    generated_at: "2026-07-19T07:23:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3fa26ace32ca7e555508ec3869e67bd6ae2e5b3b2bfd0edb050e6d1ebfb61824
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK ของ Plugin เปิดให้ใช้งานเป็นชุดพาธย่อยสาธารณะที่มีขอบเขตแคบภายใต้
`openclaw/plugin-sdk/` หน้านี้รวบรวมพาธย่อยที่ใช้กันทั่วไปโดยจัดกลุ่มตาม
วัตถุประสงค์ มีไฟล์สามไฟล์ที่กำหนดพื้นผิวนี้:

- `scripts/lib/plugin-sdk-entrypoints.json`: รายการจุดเข้าใช้งานที่ได้รับการบำรุงรักษา
  ซึ่งบิลด์จะคอมไพล์
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: พาธย่อยภายในที่ใช้เฉพาะ
  การทดสอบ/ภายในรีโพ แพ็กเกจจะส่งออกตามรายการข้างต้นโดยหักรายการนี้ออก
- `src/plugin-sdk/entrypoints.ts`: เมทาดาทาการจำแนกประเภทสำหรับพาธย่อย
  ที่เลิกใช้แล้ว ตัวช่วยแบบบันเดิลที่สงวนไว้ facade แบบบันเดิลที่รองรับ และ
  พื้นผิวสาธารณะที่ Plugin เป็นเจ้าของ

ผู้ดูแลตรวจสอบจำนวนการส่งออกสาธารณะด้วย `pnpm plugin-sdk:surface` และ
พาธย่อยของตัวช่วยที่สงวนไว้ซึ่งยังใช้งานอยู่ด้วย `pnpm plugins:boundary-report:summary`;
การส่งออกตัวช่วยที่สงวนไว้แต่ไม่ได้ใช้จะทำให้รายงาน CI ล้มเหลว แทนที่จะคงอยู่ใน
SDK สาธารณะในฐานะภาระความเข้ากันได้ที่ไม่ได้ใช้งาน

สำหรับคู่มือการสร้าง Plugin โปรดดู [ภาพรวม SDK ของ Plugin](/th/plugins/sdk-overview)

## จุดเข้าใช้งาน Plugin

| พาธย่อย                        | การส่งออกหลัก                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | ตัวช่วยรายการของผู้ให้บริการการย้ายข้อมูล เช่น `createMigrationItem` ค่าคงที่ของเหตุผล ตัวทำเครื่องหมายสถานะรายการ ตัวช่วยปกปิดข้อมูล และ `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | ตัวช่วยการย้ายข้อมูลขณะรันไทม์ เช่น `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` และ `writeMigrationReport`                                             |
| `plugin-sdk/health`            | การลงทะเบียน การตรวจจับ การซ่อมแซม การเลือก ระดับความรุนแรง และประเภทข้อค้นพบของการตรวจสอบสุขภาพด้วย Doctor สำหรับผู้ใช้ข้อมูลสุขภาพแบบบันเดิล                                                                                |
| `plugin-sdk/config-schema`     | เลิกใช้แล้ว สคีมา Zod ของ `openclaw.json` ระดับราก (`OpenClawSchema`); ให้กำหนดสคีมาภายใน Plugin แทนและตรวจสอบความถูกต้องด้วย `plugin-sdk/json-schema-runtime`                                                  |

### ตัวช่วยด้านความเข้ากันได้และการทดสอบที่เลิกใช้แล้ว

พาธย่อยที่เลิกใช้แล้วยังคงส่งออกสำหรับ Plugin รุ่นเก่า แต่โค้ดใหม่ควรใช้
พาธย่อย SDK ที่มีขอบเขตเฉพาะด้านล่าง รายการที่ได้รับการบำรุงรักษาคือ
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI จะปฏิเสธการนำเข้า
สำหรับการใช้งานจริงแบบบันเดิลจากรายการนี้ barrel แบบกว้าง เช่น `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` และ
`plugin-sdk/text-runtime` มีไว้เพื่อความเข้ากันได้เท่านั้น และ `plugin-sdk/zod` เป็น
การส่งออกซ้ำเพื่อความเข้ากันได้: ให้นำเข้า `zod` โดยตรงจาก `zod` barrel โดเมน
แบบกว้าง ได้แก่ `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` และ
`plugin-sdk/security-runtime` ก็เลิกใช้สำหรับโค้ดใหม่เช่นกัน โดยให้ใช้
พาธย่อยที่มีขอบเขตเฉพาะแทน

พาธย่อยตัวช่วยทดสอบของ OpenClaw ที่ใช้ Vitest รองรับมีไว้เฉพาะภายในรีโพและ
ไม่ได้เป็นการส่งออกของแพ็กเกจอีกต่อไป ได้แก่ `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-live`, `test-live-auth`, `test-media-generation`,
`test-media-understanding`, `test-node-mocks` และ `testing` พื้นผิวตัวช่วยแบบบันเดิลที่เป็นส่วนตัว
`ssrf-runtime-internal` และ `codex-native-task-runtime` ก็มีไว้เฉพาะภายในรีโพ
เช่นกัน

### พาธย่อยตัวช่วยของ Plugin แบบบันเดิลที่สงวนไว้

`plugin-sdk/codex-mcp-projection` เป็นพาธย่อยที่สงวนไว้เพียงรายการเดียว: พื้นผิว
ความเข้ากันได้ที่ Plugin เป็นเจ้าของสำหรับ Plugin Codex แบบบันเดิล ไม่ใช่ API ของ SDK ทั่วไป
การนำเข้าข้าม Plugin ที่มีเจ้าของต่างกันถูกปิดกั้นด้วยข้อบังคับตามสัญญาของแพ็กเกจ และ
CI จะล้มเหลวเมื่อไม่มีการนำเข้าพาธย่อยที่สงวนไว้อีกต่อไป
`plugin-sdk/codex-native-task-runtime` มีไว้เฉพาะภายในรีโพและไม่ใช่การส่งออก
ของแพ็กเกจ

`src/plugin-sdk/entrypoints.ts` ยังติดตาม facade แบบบันเดิลที่รองรับ ซึ่งเป็นจุดเข้าใช้งาน
SDK ที่มี Plugin แบบบันเดิลของตนรองรับอยู่จนกว่าสัญญาทั่วไปจะเข้ามาแทนที่
ได้แก่ `plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` และ `plugin-sdk/zalouser` หลายรายการในนี้ก็
เลิกใช้สำหรับโค้ดใหม่เช่นกัน โปรดดูหมายเหตุของแต่ละแถวด้านล่าง

  <AccordionGroup>
  <Accordion title="พาธย่อยของช่องทาง">
    | พาธย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | ตัวช่วยตรวจสอบความถูกต้องด้วย JSON Schema แบบแคชสำหรับสคีมาที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | ตัวช่วยร่วมสำหรับวิซาร์ดการตั้งค่า ตัวแปลการตั้งค่า พรอมต์รายการที่อนุญาต และตัวสร้างสถานะการตั้งค่า |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | ตัวช่วยสำหรับการกำหนดค่าแบบหลายบัญชี/เกตการดำเนินการ และตัวช่วยสำรองไปยังบัญชีเริ่มต้น |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID` และตัวช่วยปรับรหัสบัญชีให้อยู่ในรูปแบบมาตรฐาน |
    | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชีและสำรองไปยังค่าเริ่มต้น |
    | `plugin-sdk/account-helpers` | ตัวช่วยแบบขอบเขตแคบสำหรับรายการบัญชี/การดำเนินการกับบัญชี |
    | `plugin-sdk/access-groups` | ตัวช่วยแยกวิเคราะห์รายการกลุ่มการเข้าถึงที่อนุญาตและวินิจฉัยกลุ่มโดยปกปิดข้อมูล |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | ส่วนหน้าความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | องค์ประกอบพื้นฐานร่วมของสคีมาการกำหนดค่าช่องทาง พร้อมด้วย Zod และตัวสร้าง JSON/TypeBox โดยตรง |
    | `plugin-sdk/bundled-channel-config-schema` | สคีมาการกำหนดค่าช่องทาง OpenClaw ที่รวมมาให้ สำหรับ Plugin ที่รวมมาให้และยังได้รับการดูแลเท่านั้น |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId` รหัสช่องทางแชตแบบมาตรฐานที่รวมมาให้/เป็นทางการ พร้อมป้ายกำกับ/นามแฝงของตัวจัดรูปแบบสำหรับ Plugin ที่ต้องจดจำข้อความซึ่งมีคำนำหน้าซองข้อความโดยไม่ต้องฮาร์ดโค้ดตารางของตนเอง |
    | `plugin-sdk/channel-config-schema-legacy` | นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้วสำหรับสคีมาการกำหนดค่าช่องทางที่รวมมาให้ |
    | `plugin-sdk/telegram-command-config` | การปรับชื่อ/คำอธิบายคำสั่ง Telegram ให้อยู่ในรูปแบบมาตรฐานและการตรวจสอบรายการซ้ำ/ข้อขัดแย้งที่เลิกใช้แล้ว สำหรับโค้ด Plugin ใหม่ให้ใช้การจัดการการกำหนดค่าคำสั่งภายใน Plugin |
    | `plugin-sdk/command-gating` | ตัวช่วยแบบขอบเขตแคบสำหรับเกตการอนุญาตคำสั่ง |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | ตัวแก้ไขรันไทม์ขาเข้าของช่องทางระดับสูงแบบทดลอง ตัวแก้ไขนโยบายการกล่าวถึงโดยนัย และตัวสร้างข้อเท็จจริงของเส้นทางสำหรับพาธรับข้อมูลของช่องทางที่ย้ายแล้ว ควรใช้สิ่งนี้แทนการประกอบรายการที่อนุญาตที่มีผลจริง รายการคำสั่งที่อนุญาต และโปรเจกชันแบบเดิมในแต่ละ Plugin ดู[API ขาเข้าของช่องทาง](/th/plugins/sdk-channel-ingress) |
    | `plugin-sdk/channel-lifecycle` | ส่วนหน้าความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-outbound` | สัญญาวงจรชีวิตของข้อความ พร้อมตัวเลือกไปป์ไลน์การตอบกลับ ใบรับ การแสดงตัวอย่างสด/การสตรีม ตัวช่วยวงจรชีวิต อัตลักษณ์ขาออก การวางแผนเพย์โหลด การส่งแบบคงทน และตัวช่วยบริบทการส่งข้อความ ดู[API ขาออกของช่องทาง](/th/plugins/sdk-channel-outbound) |
    | `plugin-sdk/channel-message` | นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-message-runtime` | นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/inbound-envelope` | ตัวช่วยร่วมสำหรับเส้นทางขาเข้าและตัวสร้างซองข้อความ |
    | `plugin-sdk/inbound-reply-dispatch` | ส่วนหน้าความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-inbound` สำหรับตัวรันขาเข้าและเพรดิเคตการส่งต่อ และใช้ `plugin-sdk/channel-outbound` สำหรับตัวช่วยส่งมอบข้อความ |
    | `plugin-sdk/messaging-targets` | นามแฝงการแยกวิเคราะห์เป้าหมายที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | ตัวช่วยร่วมสำหรับการโหลดสื่อขาออกและสถานะสื่อที่โฮสต์ |
    | `plugin-sdk/outbound-send-deps` | ส่วนหน้าความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/outbound-runtime` | ส่วนหน้าความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/poll-runtime` | ตัวช่วยแบบขอบเขตแคบสำหรับปรับโพลให้อยู่ในรูปแบบมาตรฐาน |
    | `plugin-sdk/thread-bindings-runtime` | วงจรชีวิตและตัวช่วยอะแดปเตอร์สำหรับการผูกเธรด |
    | `plugin-sdk/agent-media-payload` | รากเพย์โหลดสื่อของเอเจนต์และตัวโหลด |
    | `plugin-sdk/conversation-runtime` | บาร์เรลแบบกว้างที่เลิกใช้แล้วสำหรับการผูกการสนทนา/เธรด การจับคู่ และตัวช่วยการผูกที่กำหนดค่าไว้ ควรใช้พาธย่อยการผูกที่เจาะจง เช่น `plugin-sdk/thread-bindings-runtime` และ `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | ตัวช่วยแก้ไขนโยบายกลุ่มขณะรันไทม์ |
    | `plugin-sdk/channel-status` | ตัวช่วยร่วมสำหรับสแนปช็อต/สรุปสถานะช่องทาง |
    | `plugin-sdk/channel-config-primitives` | องค์ประกอบพื้นฐานแบบขอบเขตแคบของสคีมาการกำหนดค่าช่องทาง |
    | `plugin-sdk/channel-config-writes` | ตัวช่วยอนุญาตการเขียนการกำหนดค่าช่องทาง |
    | `plugin-sdk/channel-plugin-common` | รายการส่งออกบทนำร่วมของ Plugin ช่องทาง |
    | `plugin-sdk/allowlist-config-edit` | ตัวช่วยแก้ไข/อ่านการกำหนดค่ารายการที่อนุญาต |
    | `plugin-sdk/group-access` | ตัวช่วยตัดสินใจการเข้าถึงกลุ่มที่เลิกใช้แล้ว ให้ใช้ `resolveChannelMessageIngress` จาก `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | ส่วนหน้าความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-inbound` |
    | `plugin-sdk/direct-dm-guard-policy` | ตัวช่วยนโยบายการป้องกันก่อนเข้ารหัสสำหรับข้อความส่วนตัวโดยตรงแบบขอบเขตแคบ |
    | `plugin-sdk/discord` | ส่วนหน้าความเข้ากันได้ของ Discord ที่เลิกใช้แล้วสำหรับ `@openclaw/discord@2026.3.13` ที่เผยแพร่และความเข้ากันได้ของเจ้าของที่ติดตามอยู่ Plugin ใหม่ควรใช้พาธย่อย SDK ช่องทางแบบทั่วไป |
    | `plugin-sdk/telegram-account` | ส่วนหน้าความเข้ากันได้สำหรับการแก้ไขบัญชี Telegram ที่เลิกใช้แล้วเพื่อรองรับความเข้ากันได้ของเจ้าของที่ติดตามอยู่ Plugin ใหม่ควรใช้ตัวช่วยรันไทม์ที่ฉีดเข้ามาหรือพาธย่อย SDK ช่องทางแบบทั่วไป |
    | `plugin-sdk/zalouser` | ส่วนหน้าความเข้ากันได้ของ Zalo Personal ที่เลิกใช้แล้วสำหรับแพ็กเกจ Lark/Zalo ที่เผยแพร่ซึ่งยังคงนำเข้าการอนุญาตคำสั่งของผู้ส่ง Plugin ใหม่ควรใช้พาธย่อย SDK ช่องทางแบบทั่วไป |
    | `plugin-sdk/interactive-runtime` | ตัวช่วยการนำเสนอ การส่งมอบ และการตอบกลับแบบโต้ตอบเดิมของข้อความเชิงความหมาย ดู[การนำเสนอข้อความ](/th/plugins/message-presentation) |
    | `plugin-sdk/question-gateway-runtime` | แก้ไขตัวเลือก `ask_user` ที่รันไทม์สร้างขึ้นผ่าน Gateway จากตัวจัดการการโต้ตอบของช่องทาง |
    | `plugin-sdk/channel-inbound` | ตัวช่วยขาเข้าร่วมสำหรับการจำแนกเหตุการณ์ การสร้างบริบท การจัดรูปแบบ ราก การหน่วง การจับคู่การกล่าวถึง นโยบายการกล่าวถึง และการบันทึกขาเข้า |
    | `plugin-sdk/channel-inbound-debounce` | ตัวช่วยหน่วงขาเข้าแบบขอบเขตแคบ |
    | `plugin-sdk/channel-mention-gating` | ตัวช่วยแบบขอบเขตแคบสำหรับนโยบายการกล่าวถึง เครื่องหมายการกล่าวถึง และข้อความการกล่าวถึง โดยไม่รวมพื้นผิวรันไทม์ขาเข้าที่กว้างกว่า |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | ส่วนหน้าความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-inbound` หรือ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-pairing-paths` | ส่วนหน้าความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-pairing` |
    | `plugin-sdk/channel-reply-options-runtime` | ส่วนหน้าความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-streaming` | ส่วนหน้าความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-send-result` | ชนิดผลลัพธ์การตอบกลับ |
    | `plugin-sdk/channel-actions` | ตัวช่วยการดำเนินการกับข้อความของช่องทาง พร้อมตัวช่วยสคีมาเนทีฟที่เลิกใช้แล้วแต่ยังคงไว้เพื่อความเข้ากันได้ของ Plugin |
    | `plugin-sdk/channel-route` | การปรับเส้นทางให้อยู่ในรูปแบบมาตรฐานร่วม การแก้ไขเป้าหมายที่ขับเคลื่อนด้วยพาร์เซอร์ การแปลงรหัสเธรดเป็นสตริง คีย์เส้นทางแบบตัดรายการซ้ำ/กระชับ ชนิดเป้าหมายที่แยกวิเคราะห์แล้ว และตัวช่วยเปรียบเทียบเส้นทาง/เป้าหมาย |
    | `plugin-sdk/channel-targets` | ตัวช่วยแยกวิเคราะห์เป้าหมาย ผู้เรียกใช้การเปรียบเทียบเส้นทางควรใช้ `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | ชนิดสัญญาของช่องทาง |
    | `plugin-sdk/channel-feedback` | การเชื่อมต่อฟีดแบ็ก/รีแอ็กชัน |
  </Accordion>

กลุ่มตัวช่วยสำหรับช่องทางที่เลิกใช้แล้วจะยังคงพร้อมใช้งานเฉพาะเพื่อความเข้ากันได้กับ Plugin ที่เผยแพร่แล้วเท่านั้น แผนการนำออกคือ: คงไว้ตลอดช่วงเวลาการย้ายข้อมูลของ Plugin ภายนอก ให้ Plugin ใน repo/ที่รวมมากับระบบใช้ `channel-inbound` และ `channel-outbound` ต่อไป จากนั้นนำพาธย่อยสำหรับความเข้ากันได้ออกในการปรับปรุง SDK ครั้งใหญ่ครั้งถัดไป ทั้งนี้ครอบคลุมกลุ่มเดิมสำหรับข้อความ/รันไทม์ของช่องทาง การสตรีมของช่องทาง การเข้าถึง DM โดยตรง ตัวช่วยขาเข้าที่แยกย่อย ตัวเลือกการตอบกลับ และพาธการจับคู่

  <Accordion title="พาธย่อยของผู้ให้บริการ">
    | พาธย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | facade ของผู้ให้บริการ LM Studio ที่รองรับสำหรับการตั้งค่า การค้นพบแค็ตตาล็อก และการเตรียมโมเดลขณะรันไทม์ |
    | `plugin-sdk/lmstudio-runtime` | facade รันไทม์ LM Studio ที่รองรับสำหรับค่าเริ่มต้นของเซิร์ฟเวอร์ภายใน การค้นพบโมเดล ส่วนหัวคำขอ และตัวช่วยสำหรับโมเดลที่โหลดแล้ว |
    | `plugin-sdk/provider-setup` | ตัวช่วยตั้งค่าผู้ให้บริการภายใน/โฮสต์เองที่คัดสรรไว้ |
    | `plugin-sdk/self-hosted-provider-setup` | ตัวช่วยตั้งค่าแบบโฮสต์เองที่เข้ากันได้กับ OpenAI ซึ่งเลิกใช้แล้ว ให้ใช้ `plugin-sdk/provider-setup` หรือตัวช่วยตั้งค่าที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/cli-backend` | ค่าเริ่มต้นของแบ็กเอนด์ CLI + ค่าคงที่ watchdog |
    | `plugin-sdk/provider-auth-runtime` | ตัวช่วยรันไทม์การยืนยันตัวตนของผู้ให้บริการ: ขั้นตอน OAuth แบบ loopback, การแลกเปลี่ยนโทเค็น, การบันทึกการยืนยันตัวตน และการหา API key |
    | `plugin-sdk/provider-oauth-runtime` | ชนิด callback OAuth ทั่วไปของผู้ให้บริการ, การเรนเดอร์หน้า callback, ตัวช่วย PKCE/state, การแยกวิเคราะห์อินพุตการอนุญาต, ตัวช่วยการหมดอายุของโทเค็น และตัวช่วยยกเลิก |
    | `plugin-sdk/provider-auth-api-key` | ตัวช่วย onboarding/เขียนโปรไฟล์ด้วย API key เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
    | `plugin-sdk/provider-env-vars` | ตัวช่วยค้นหาตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตนของผู้ให้บริการ |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, ตัวช่วยนำเข้าการยืนยันตัวตน OpenAI Codex, รายการส่งออกเพื่อความเข้ากันได้ `resolveOpenClawAgentDir` ซึ่งเลิกใช้แล้ว |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `selectPreferredLocalModelId`, `normalizeModelCompat`, ตัวสร้างนโยบาย replay ที่ใช้ร่วมกัน, ตัวช่วย endpoint ของผู้ให้บริการ และตัวช่วยปรับรูปแบบ model ID ที่ใช้ร่วมกัน |
    | `plugin-sdk/provider-catalog-live-runtime` | ตัวช่วยแค็ตตาล็อกโมเดลของผู้ให้บริการแบบสดสำหรับการค้นพบลักษณะ `/models` ที่มีการป้องกัน: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, การกรอง model ID, แคช TTL และค่าทดแทนแบบคงที่ |
    | `plugin-sdk/provider-catalog-runtime` | ฮุกเสริมแค็ตตาล็อกผู้ให้บริการขณะรันไทม์ และจุดเชื่อมต่อรีจิสทรีผู้ให้บริการของ Plugin สำหรับการทดสอบสัญญา |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | ตัวช่วยความสามารถ HTTP/endpoint ทั่วไปของผู้ให้บริการ, ข้อผิดพลาด HTTP ของผู้ให้บริการ และตัวช่วยฟอร์ม multipart สำหรับการถอดเสียง |
    | `plugin-sdk/provider-web-fetch-contract` | ตัวช่วยสัญญาการกำหนดค่า/การเลือก web fetch แบบจำกัดขอบเขต เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | ตัวช่วยการลงทะเบียน/แคชผู้ให้บริการ web fetch |
    | `plugin-sdk/provider-web-search-config-contract` | ตัวช่วยการกำหนดค่า/ข้อมูลประจำตัวสำหรับ web search แบบจำกัดขอบเขต สำหรับผู้ให้บริการที่ไม่ต้องเชื่อมโยงการเปิดใช้งาน Plugin |
    | `plugin-sdk/provider-web-search-contract` | ตัวช่วยสัญญาการกำหนดค่า/ข้อมูลประจำตัวสำหรับ web search แบบจำกัดขอบเขต เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวรับข้อมูลประจำตัวตามขอบเขต |
    | `plugin-sdk/provider-web-search` | ตัวช่วยการลงทะเบียน/แคช/รันไทม์ของผู้ให้บริการ web search |
    | `plugin-sdk/embedding-providers` | ชนิดและตัวช่วยอ่านสำหรับผู้ให้บริการ embedding ทั่วไป รวมถึง `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` และ `listEmbeddingProviders(...)`; Plugin ลงทะเบียนผู้ให้บริการผ่าน `api.registerEmbeddingProvider(...)` เพื่อบังคับใช้ความเป็นเจ้าของตาม manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` และการล้างสคีมา + การวินิจฉัยสำหรับ DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | ชนิดสแนปช็อตการใช้งานของผู้ให้บริการ, ตัวช่วยดึงข้อมูลการใช้งานที่ใช้ร่วมกัน และตัวดึงข้อมูลของผู้ให้บริการ เช่น `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ชนิดตัวครอบสตรีม, ความเข้ากันได้ของการเรียกเครื่องมือแบบข้อความธรรมดา และตัวช่วยตัวครอบที่ใช้ร่วมกันสำหรับ Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | ตัวช่วยสาธารณะสำหรับตัวครอบสตรีมของผู้ให้บริการที่ใช้ร่วมกัน รวมถึง `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` และยูทิลิตีสตรีมที่เข้ากันได้กับ Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | ตัวช่วยการขนส่งแบบเนทีฟของผู้ให้บริการ เช่น การ fetch ที่มีการป้องกัน, การแยกข้อความผลลัพธ์จากเครื่องมือ, การแปลงข้อความสำหรับการขนส่ง และสตรีมเหตุการณ์การขนส่งที่เขียนได้ |
    | `plugin-sdk/provider-onboard` | ตัวช่วยแพตช์การกำหนดค่า onboarding |
    | `plugin-sdk/global-singleton` | ตัวช่วย singleton/map/cache ภายในโปรเซส |
    | `plugin-sdk/group-activation` | ตัวช่วยโหมดการเปิดใช้งานกลุ่มและการแยกวิเคราะห์คำสั่งแบบจำกัดขอบเขต |
  </Accordion>

โดยปกติสแนปช็อตการใช้งานของผู้ให้บริการจะรายงานโควตา `windows` อย่างน้อยหนึ่งรายการ โดยแต่ละรายการมี
ป้ายกำกับ เปอร์เซ็นต์ที่ใช้ และเวลารีเซ็ตซึ่งระบุหรือไม่ก็ได้ ผู้ให้บริการที่แสดงข้อความยอดคงเหลือหรือ
สถานะบัญชีแทนช่วงโควตาที่รีเซ็ตได้ ควรส่งคืน
`summary` พร้อมอาร์เรย์ `windows` ว่าง แทนการสร้างเปอร์เซ็นต์ขึ้นเอง
OpenClaw แสดงข้อความสรุปดังกล่าวในเอาต์พุตสถานะ ให้ใช้ `error` เฉพาะเมื่อ
endpoint การใช้งานล้มเหลวหรือไม่ส่งคืนข้อมูลการใช้งานที่ใช้ได้

  <Accordion title="พาธย่อยของการยืนยันตัวตนและความปลอดภัย">
    | พาธย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | พื้นผิวการอนุญาตคำสั่งแบบกว้างซึ่งเลิกใช้แล้ว (`resolveControlCommandGate`, ตัวช่วยรีจิสทรีคำสั่ง รวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก, ตัวช่วยการอนุญาตผู้ส่ง); ให้ใช้การอนุญาตที่จุดรับเข้าของช่องทาง/รันไทม์ หรือตัวช่วยสถานะคำสั่ง |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความคำสั่ง/วิธีใช้ เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | ตัวช่วยหาผู้อนุมัติและยืนยันสิทธิ์การดำเนินการภายในแชตเดียวกัน |
    | `plugin-sdk/approval-client-runtime` | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติการดำเนินการแบบเนทีฟ |
    | `plugin-sdk/approval-delivery-runtime` | อะแดปเตอร์ความสามารถ/การนำส่งการอนุมัติแบบเนทีฟ |
    | `plugin-sdk/approval-gateway-runtime` | ตัวหาค่า Gateway การอนุมัติที่ใช้ร่วมกัน |
    | `plugin-sdk/approval-reference-runtime` | ตัวช่วยระบุตำแหน่งแบบคงทนและให้ผลลัพธ์แน่นอน สำหรับ callback การอนุมัติที่ถูกจำกัดด้วยการขนส่ง |
    | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยโหลดอะแดปเตอร์การอนุมัติแบบเนทีฟน้ำหนักเบา สำหรับจุดเข้าช่องทางที่มีการใช้งานสูง |
    | `plugin-sdk/approval-handler-runtime` | ตัวช่วยรันไทม์สำหรับตัวจัดการการอนุมัติที่ครอบคลุมกว่า; ควรใช้จุดเชื่อมต่ออะแดปเตอร์/Gateway ที่แคบกว่าเมื่อเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติแบบเนทีฟ, การผูกบัญชี, เกตเส้นทาง, ทางเลือกสำรองสำหรับการส่งต่อ และการระงับพรอมต์การดำเนินการแบบเนทีฟภายใน |
    | `plugin-sdk/approval-reaction-runtime` | การผูกรีแอ็กชันการอนุมัติแบบฮาร์ดโค้ด, เพย์โหลดพรอมต์รีแอ็กชัน, ที่เก็บเป้าหมายรีแอ็กชัน, ตัวช่วยข้อความคำแนะนำรีแอ็กชัน และรายการส่งออกเพื่อความเข้ากันได้สำหรับการระงับพรอมต์การดำเนินการแบบเนทีฟภายใน |
    | `plugin-sdk/approval-reply-runtime` | ตัวช่วยเพย์โหลดการตอบกลับการอนุมัติการดำเนินการ/Plugin |
    | `plugin-sdk/approval-runtime` | ตัวช่วยเพย์โหลดการอนุมัติการดำเนินการ/Plugin, ตัวสร้างความสามารถการอนุมัติ, ตัวช่วยการยืนยันตัวตน/โปรไฟล์การอนุมัติ, ตัวช่วยการกำหนดเส้นทาง/รันไทม์การอนุมัติแบบเนทีฟ และตัวช่วยแสดงผลการอนุมัติแบบมีโครงสร้าง เช่น `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | ตัวช่วยรีเซ็ตการขจัดรายการตอบกลับขาเข้าที่ซ้ำกันแบบจำกัดขอบเขต ซึ่งเลิกใช้แล้ว |
    | `plugin-sdk/command-auth-native` | การยืนยันสิทธิ์คำสั่งแบบเนทีฟ, การจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก และตัวช่วยเป้าหมายเซสชันแบบเนทีฟ |
    | `plugin-sdk/command-detection` | ตัวช่วยตรวจหาคำสั่งที่ใช้ร่วมกัน |
    | `plugin-sdk/command-primitives-runtime` | เพรดิเคตข้อความคำสั่งน้ำหนักเบาสำหรับเส้นทางช่องทางที่มีการใช้งานสูง |
    | `plugin-sdk/command-surface` | ตัวช่วยปรับรูปแบบเนื้อหาคำสั่งและพื้นผิวคำสั่ง |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | ตัวช่วยขั้นตอนการเข้าสู่ระบบเพื่อยืนยันตัวตนกับผู้ให้บริการแบบ lazy สำหรับช่องทางส่วนตัวและการจับคู่ด้วยรหัสอุปกรณ์ใน Web UI |
    | `plugin-sdk/channel-secret-runtime` | พื้นผิวสัญญาข้อมูลลับแบบกว้างซึ่งเลิกใช้แล้ว (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, ชนิดเป้าหมายข้อมูลลับ); ควรใช้พาธย่อยเฉพาะด้านล่าง |
    | `plugin-sdk/channel-secret-basic-runtime` | รายการส่งออกสัญญาข้อมูลลับแบบจำกัดขอบเขต และตัวสร้างรีจิสทรีเป้าหมายสำหรับพื้นผิวข้อมูลลับของช่องทาง/Plugin ที่ไม่ใช่ TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | ตัวช่วยกำหนดข้อมูลลับ TTS ของช่องทางแบบซ้อนและจำกัดขอบเขต |
    | `plugin-sdk/secret-ref-runtime` | การกำหนดชนิด SecretRef, การหา SecretRef และการค้นหาพาธเป้าหมายของแผนแบบจำกัดขอบเขต สำหรับการแยกวิเคราะห์สัญญาข้อมูลลับ/การกำหนดค่า |
    | `plugin-sdk/secret-provider-integration` | สัญญา manifest และ preset สำหรับการผสานรวมผู้ให้บริการ SecretRef แบบเฉพาะชนิด สำหรับ Plugin ที่เผยแพร่ preset ผู้ให้บริการข้อมูลลับภายนอก |
    | `plugin-sdk/security-runtime` | barrel แบบกว้างซึ่งเลิกใช้แล้วสำหรับความไว้วางใจ, การควบคุม DM, ตัวช่วยไฟล์/พาธที่จำกัดภายในรูท รวมถึงการเขียนแบบสร้างใหม่เท่านั้น, การแทนที่ไฟล์แบบอะตอมมิกทั้งแบบซิงก์/อะซิงก์, การเขียนไฟล์ชั่วคราวข้างเคียง, ทางเลือกสำรองสำหรับการย้ายข้ามอุปกรณ์, ตัวช่วยที่เก็บไฟล์ส่วนตัว, การป้องกันพาเรนต์ที่เป็น symlink, เนื้อหาภายนอก, การปกปิดข้อความละเอียดอ่อน, การเปรียบเทียบข้อมูลลับแบบใช้เวลาคงที่ และตัวช่วยรวบรวมข้อมูลลับ; ควรใช้พาธย่อยด้านความปลอดภัย/SSRF/ข้อมูลลับแบบเฉพาะเจาะจง |
    | `plugin-sdk/ssrf-policy` | ตัวช่วย allowlist ของโฮสต์และนโยบาย SSRF สำหรับเครือข่ายส่วนตัว |
    | `plugin-sdk/ssrf-dispatcher` | ตัวช่วย pinned dispatcher แบบจำกัดขอบเขตที่ไม่มีพื้นผิวรันไทม์โครงสร้างพื้นฐานแบบกว้าง |
    | `plugin-sdk/ssrf-runtime` | ตัวช่วย pinned dispatcher, การ fetch ที่มีการป้องกัน SSRF, ข้อผิดพลาด SSRF และนโยบาย SSRF |
    | `plugin-sdk/secret-input` | ตัวช่วยแยกวิเคราะห์อินพุตข้อมูลลับ |
    | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ/เป้าหมาย Webhook และการแปลง websocket/body ดิบ |
    | `plugin-sdk/webhook-request-guards` | ตัวช่วยขนาด/หมดเวลาของเนื้อหาคำขอ และ `runDetachedWebhookWork` สำหรับการประมวลผลหลังการตอบรับที่มีการติดตาม |
  </Accordion>

  <Accordion title="พาธย่อยสำหรับรันไทม์และพื้นที่จัดเก็บ">
    | พาธย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | ตัวช่วยสำหรับรันไทม์/การบันทึกล็อก/การสำรองข้อมูล คำเตือนเกี่ยวกับพาธติดตั้ง Plugin และตัวช่วยสำหรับโปรเซส |
    | `plugin-sdk/runtime-env` | ตัวช่วยแบบจำกัดขอบเขตสำหรับสภาพแวดล้อมรันไทม์ ตัวบันทึกล็อก การหมดเวลา การลองใหม่ และการหน่วงเวลาถอยกลับ |
    | `plugin-sdk/browser-config` | Facade การกำหนดค่าเบราว์เซอร์ที่รองรับสำหรับโปรไฟล์/ค่าเริ่มต้นที่ปรับเป็นมาตรฐาน การแยกวิเคราะห์ URL ของ CDP และตัวช่วยการยืนยันตัวตนสำหรับการควบคุมเบราว์เซอร์ |
    | `plugin-sdk/agent-harness-task-runtime` | ตัวช่วยทั่วไปสำหรับวงจรชีวิตงานและการส่งมอบเมื่อเสร็จสมบูรณ์สำหรับเอเจนต์ที่ใช้ฮาร์เนส โดยใช้ขอบเขตงานที่โฮสต์ออกให้ |
    | `plugin-sdk/codex-mcp-projection` | ตัวช่วย Codex แบบรวมชุดที่สงวนไว้สำหรับฉายการกำหนดค่าเซิร์ฟเวอร์ MCP ของผู้ใช้ไปยังการกำหนดค่าเธรด Codex ไม่ได้มีไว้สำหรับ Plugin ของบุคคลที่สาม |
    | `plugin-sdk/codex-native-task-runtime` | ตัวช่วย Codex แบบรวมชุดภายในรีโพสำหรับการเชื่อมต่อมิเรอร์งานเนทีฟ/รันไทม์ ไม่ใช่รายการส่งออกของแพ็กเกจ |
    | `plugin-sdk/channel-runtime-context` | ตัวช่วยทั่วไปสำหรับการลงทะเบียนและค้นหาบริบทรันไทม์ของช่องทาง |
    | `plugin-sdk/matrix` | Facade ความเข้ากันได้ของ Matrix ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางของบุคคลที่สามรุ่นเก่า Plugin ใหม่ควรนำเข้า `plugin-sdk/run-command` โดยตรง |
    | `plugin-sdk/mattermost` | Facade ความเข้ากันได้ของ Mattermost ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางของบุคคลที่สามรุ่นเก่า Plugin ใหม่ควรนำเข้าพาธย่อย SDK ทั่วไปโดยตรง |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Barrel แบบกว้างที่เลิกใช้แล้วสำหรับตัวช่วยคำสั่ง/ฮุก/http/การโต้ตอบของ Plugin ควรใช้พาธย่อยรันไทม์ Plugin ที่เจาะจงแทน |
    | `plugin-sdk/hook-runtime` | Barrel แบบกว้างที่เลิกใช้แล้วสำหรับตัวช่วยไปป์ไลน์ Webhook/ฮุกภายใน ควรใช้พาธย่อยรันไทม์ฮุก/Plugin ที่เจาะจงแทน |
    | `plugin-sdk/lazy-runtime` | ตัวช่วยนำเข้า/ผูกรันไทม์แบบ Lazy เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod` และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | ตัวช่วยเรียกใช้โปรเซส |
    | `plugin-sdk/node-host` | ตัวช่วยแก้ไขตำแหน่งไฟล์ปฏิบัติการบนโฮสต์ Node และดำเนินการ PTY ต่อ |
    | `plugin-sdk/cli-runtime` | Barrel แบบกว้างที่เลิกใช้แล้วสำหรับการจัดรูปแบบ CLI การรอ เวอร์ชัน การเรียกใช้ด้วยอาร์กิวเมนต์ และตัวช่วยกลุ่มคำสั่งแบบ Lazy ควรใช้พาธย่อย CLI/รันไทม์ที่เจาะจงแทน |
    | `plugin-sdk/qa-runner-runtime` | Facade ที่รองรับสำหรับเปิดเผยสถานการณ์ QA ของ Plugin ผ่านพื้นผิวคำสั่ง CLI |
    | `plugin-sdk/tts-runtime` | Facade ที่รองรับสำหรับสคีมาการกำหนดค่าการแปลงข้อความเป็นเสียงและตัวช่วยรันไทม์ |
    | `plugin-sdk/gateway-method-runtime` | ตัวช่วยส่งต่อเมธอด Gateway ที่สงวนไว้สำหรับเส้นทาง HTTP ของ Plugin ซึ่งประกาศ `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | ไคลเอนต์ Gateway ตัวช่วยเริ่มต้นไคลเอนต์เมื่อวงรอบเหตุการณ์พร้อม RPC ของ CLI สำหรับ Gateway ข้อผิดพลาดของโปรโตคอล Gateway การแก้ไขโฮสต์ LAN ที่ประกาศ และตัวช่วยแพตช์สถานะช่องทาง |
    | `plugin-sdk/config-contracts` | พื้นผิวการกำหนดค่าแบบชนิดเท่านั้นที่เจาะจงสำหรับรูปแบบการกำหนดค่า Plugin เช่น `OpenClawConfig` และชนิดการกำหนดค่าช่องทาง/ผู้ให้บริการ |
    | `plugin-sdk/plugin-config-runtime` | ตัวช่วยการกำหนดค่า Plugin สำหรับรันไทม์ เช่น `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject` และ `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | ตัวช่วยแก้ไขการกำหนดค่าแบบทรานแซกชัน เช่น `mutateConfigFile`, `replaceConfigFile` และ `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | สตริงคำใบ้เมทาดาทาการส่งมอบร่วมกันสำหรับเครื่องมือข้อความ |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วยสแนปช็อตการกำหนดค่าของโปรเซสปัจจุบัน เช่น `getRuntimeConfig`, `getRuntimeConfigSnapshot` และตัวตั้งค่าสแนปช็อตสำหรับการทดสอบ |
    | `plugin-sdk/text-autolink-runtime` | การตรวจจับลิงก์อัตโนมัติสำหรับการอ้างอิงไฟล์โดยไม่ใช้ Barrel ข้อความแบบกว้าง |
    | `plugin-sdk/reply-runtime` | ตัวช่วยรันไทม์ร่วมกันสำหรับข้อความขาเข้า/การตอบกลับ การแบ่งส่วน การส่งต่อ Heartbeat และเครื่องมือวางแผนการตอบกลับ |
    | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วยแบบจำกัดขอบเขตสำหรับส่งต่อ/สรุปการตอบกลับและป้ายกำกับการสนทนา |
    | `plugin-sdk/reply-history` | ตัวช่วยประวัติการตอบกลับร่วมกันในช่วงเวลาสั้น โค้ดรอบข้อความใหม่ควรใช้ `createChannelHistoryWindow`; ตัวช่วยแมประดับล่างยังคงเป็นเพียงรายการส่งออกเพื่อความเข้ากันได้ที่เลิกใช้แล้ว |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ตัวช่วยแบบจำกัดขอบเขตสำหรับแบ่งส่วนข้อความ/Markdown |
    | `plugin-sdk/session-store-runtime` | ตัวช่วยเวิร์กโฟลว์เซสชัน (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`) ตัวช่วยซ่อมแซม/วงจรชีวิต (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`) ตัวช่วยมาร์กเกอร์สำหรับค่า `sessionFile` ระยะเปลี่ยนผ่าน การอ่านข้อความบทสนทนาล่าสุดของผู้ใช้/ผู้ช่วยตามอัตลักษณ์เซสชันแบบจำกัดขอบเขต ตัวช่วยพาธที่เก็บเซสชัน/คีย์เซสชัน และการอ่านเวลาที่อัปเดต โดยไม่ต้องนำเข้าการเขียน/บำรุงรักษาการกำหนดค่าแบบกว้าง |
    | `plugin-sdk/session-transcript-runtime` | อัตลักษณ์บทสนทนา เคอร์เซอร์ข้อมูลดิบและข้อมูลที่มองเห็นได้แบบจำกัดขอบเขต ตัวช่วยเป้าหมาย/อ่าน/เขียนแบบกำหนดขอบเขต การฉายรายการข้อความที่มองเห็นได้ การเผยแพร่การอัปเดต ล็อกการเขียน และคีย์การพบหน่วยความจำบทสนทนา |
    | `plugin-sdk/sqlite-runtime` | ตัวช่วยแบบเจาะจงสำหรับสคีมาเอเจนต์ SQLite พาธ และทรานแซกชันสำหรับรันไทม์ของบุคคลที่หนึ่ง โดยไม่มีการควบคุมวงจรชีวิตฐานข้อมูล |
    | `plugin-sdk/cron-store-runtime` | ตัวช่วยพาธ/โหลด/บันทึกที่เก็บ Cron |
    | `plugin-sdk/state-paths` | ตัวช่วยพาธไดเรกทอรีสถานะ/OAuth |
    | `plugin-sdk/plugin-state-runtime` | สัญญาสำหรับสถานะแบบมีคีย์ BLOB และลีส SQLite แบบร่วมมือที่กำหนดขอบเขตตาม Plugin รวมถึง pragma การเชื่อมต่อ การบำรุงรักษา WAL ที่ผ่านการตรวจสอบ และตัวช่วยย้ายสคีมา STRICT แบบอะตอมมิก คอลแบ็กลีสจะได้รับสัญญาณยกเลิก และข้อผิดพลาดแบบระบุชนิดจะแยกแยะการหมดเวลา การยกเลิก การสูญเสียความเป็นเจ้าของ อินพุตไม่ถูกต้อง และความล้มเหลวของพื้นที่จัดเก็บ |
    | `plugin-sdk/routing` | ตัวช่วยผูกเส้นทาง/คีย์เซสชัน/บัญชี เช่น `resolveAgentRoute`, `buildAgentSessionKey` และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ตัวช่วยสรุปสถานะช่องทาง/บัญชีร่วมกัน ค่าเริ่มต้นของสถานะรันไทม์ และตัวช่วยเมทาดาทาปัญหา |
    | `plugin-sdk/target-resolver-runtime` | ตัวช่วยแก้ไขเป้าหมายร่วมกัน |
    | `plugin-sdk/string-normalization-runtime` | ตัวช่วยปรับ Slug/สตริงให้เป็นมาตรฐาน |
    | `plugin-sdk/request-url` | แยก URL แบบสตริงจากอินพุตที่มีลักษณะคล้าย fetch/request |
    | `plugin-sdk/run-command` | ตัวเรียกใช้คำสั่งแบบจับเวลาพร้อมผลลัพธ์ stdout/stderr ที่ปรับเป็นมาตรฐาน |
    | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ทั่วไปสำหรับเครื่องมือ/CLI |
    | `plugin-sdk/tool-plugin` | กำหนด Plugin เครื่องมือเอเจนต์แบบระบุชนิดอย่างง่ายและเปิดเผยเมทาดาทาแบบคงที่สำหรับการสร้าง Manifest |
    | `plugin-sdk/tool-payload` | แยกเพย์โหลดที่ปรับเป็นมาตรฐานจากออบเจ็กต์ผลลัพธ์ของเครื่องมือ |
    | `plugin-sdk/tool-send` | แยกฟิลด์เป้าหมายการส่งแบบมาตรฐานจากอาร์กิวเมนต์ของเครื่องมือ |
    | `plugin-sdk/sandbox` | ชนิดแบ็กเอนด์ Sandbox และตัวช่วยคำสั่ง SSH/OpenShell รวมถึงการตรวจสอบคำสั่ง exec ล่วงหน้าแบบหยุดทันทีเมื่อพบข้อผิดพลาด |
    | `plugin-sdk/temp-path` | ตัวช่วยพาธดาวน์โหลดชั่วคราวร่วมกันและพื้นที่ทำงานชั่วคราวส่วนตัวที่ปลอดภัย |
    | `plugin-sdk/logging-core` | ตัวบันทึกล็อกของระบบย่อยและตัวช่วยปกปิดข้อมูล |
    | `plugin-sdk/markdown-table-runtime` | โหมดตาราง Markdown และตัวช่วยแปลง |
    | `plugin-sdk/model-session-runtime` | ตัวช่วยเขียนทับโมเดล/เซสชัน เช่น `applyModelOverrideToSessionEntry` และ `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | ตัวช่วยแก้ไขการกำหนดค่าผู้ให้บริการการสนทนา |
    | `plugin-sdk/json-store` | ตัวช่วยขนาดเล็กสำหรับอ่าน/เขียนสถานะ JSON |
    | `plugin-sdk/json-unsafe-integers` | ตัวช่วยแยกวิเคราะห์ JSON ที่เก็บลิเทอรัลจำนวนเต็มที่ไม่ปลอดภัยไว้เป็นสตริง |
    | `plugin-sdk/file-lock` | ตัวช่วยล็อกไฟล์แบบกลับเข้าได้ พร้อมการเรียกคืน Sidecar ล็อกที่เลิกใช้แล้วซึ่งล้าสมัยอย่างแน่นอนและไม่เปลี่ยนแปลงอย่างปลอดภัยสำหรับ Doctor |
    | `plugin-sdk/persistent-dedupe` | ตัวช่วยแคชขจัดรายการซ้ำที่ใช้ดิสก์เป็นแบ็กเอนด์ |
    | `plugin-sdk/ingress-effect-once` | ตัวป้องกันการอ้างสิทธิ์/คอมมิตแบบคงทนสำหรับผลข้างเคียงขาเข้าที่ไม่เป็นไอดอมโพเทนต์ |
    | `plugin-sdk/acp-runtime` | ตัวช่วยรันไทม์/เซสชัน ACP และการส่งต่อการตอบกลับ |
    | `plugin-sdk/acp-runtime-backend` | ตัวช่วยขนาดเบาสำหรับลงทะเบียนแบ็กเอนด์ ACP และส่งต่อการตอบกลับสำหรับ Plugin ที่โหลดระหว่างการเริ่มต้น |
    | `plugin-sdk/acp-binding-resolve-runtime` | การแก้ไขการผูก ACP แบบอ่านอย่างเดียวโดยไม่นำเข้าการเริ่มต้นวงจรชีวิต |
    | `plugin-sdk/agent-config-primitives` | พริมิตีฟสคีมาการกำหนดค่ารันไทม์ของเอเจนต์ที่เลิกใช้แล้ว ให้นำเข้าพริมิตีฟสคีมาจากพื้นผิวที่ Plugin เป็นเจ้าของและยังได้รับการบำรุงรักษา |
    | `plugin-sdk/boolean-param` | ตัวอ่านพารามิเตอร์บูลีนแบบยืดหยุ่น |
    | `plugin-sdk/dangerous-name-runtime` | ตัวช่วยแก้ไขการจับคู่ชื่ออันตราย |
    | `plugin-sdk/device-bootstrap` | ตัวช่วยบูตสแตรปอุปกรณ์และโทเค็นการจับคู่ รวมถึง `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | พริมิตีฟตัวช่วยร่วมกันสำหรับช่องทางแบบพาสซีฟ สถานะ และพร็อกซีแวดล้อม |
    | `plugin-sdk/models-provider-runtime` | ตัวช่วยตอบกลับสำหรับคำสั่ง/ผู้ให้บริการ `/models` |
    | `plugin-sdk/skill-commands-runtime` | ตัวช่วยแสดงรายการคำสั่ง Skill |
    | `plugin-sdk/native-command-registry` | ตัวช่วยรีจิสทรี/สร้าง/ทำให้เป็นอนุกรมสำหรับคำสั่งเนทีฟ |
    | `plugin-sdk/agent-harness` | พื้นผิวทดลองสำหรับ Plugin ที่เชื่อถือได้สำหรับฮาร์เนสเอเจนต์ระดับล่าง: ชนิดฮาร์เนส ตัวช่วยควบคุมทิศทาง/ยกเลิกการทำงานที่แอ็กทีฟ ตัวช่วยบริดจ์เครื่องมือ OpenClaw ตัวช่วยนโยบายเครื่องมือแผนรันไทม์ การจำแนกผลลัพธ์ปลายทาง ตัวช่วยจัดรูปแบบ/รายละเอียดความคืบหน้าของเครื่องมือ และยูทิลิตีผลลัพธ์การลอง |
    | `plugin-sdk/provider-zai-endpoint` | Facade ตรวจจับเอนด์พอยต์ที่ผู้ให้บริการ Z.AI เป็นเจ้าของซึ่งเลิกใช้แล้ว ให้ใช้ API สาธารณะของ Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | ตัวช่วยล็อกแบบอะซิงโครนัสภายในโปรเซสสำหรับไฟล์สถานะรันไทม์ขนาดเล็ก |
    | `plugin-sdk/channel-activity-runtime` | ตัวช่วยเทเลเมทรีกิจกรรมช่องทาง |
    | `plugin-sdk/concurrency-runtime` | ตัวช่วยควบคุมภาวะพร้อมกันของงานอะซิงโครนัสแบบจำกัดขอบเขต |
    | `plugin-sdk/dedupe-runtime` | ตัวช่วยแคชขจัดรายการซ้ำในหน่วยความจำและแบบมีพื้นที่จัดเก็บถาวรรองรับ |
    | `plugin-sdk/delivery-queue-runtime` | ตัวช่วยระบายรายการส่งมอบขาออกที่รอดำเนินการ |
    | `plugin-sdk/file-access-runtime` | ตัวช่วยพาธไฟล์ภายในและแหล่งสื่อที่ปลอดภัย |
    | `plugin-sdk/heartbeat-runtime` | ตัวช่วยปลุก Heartbeat เหตุการณ์ และการมองเห็น |
    | `plugin-sdk/expect-runtime` | ตัวช่วยยืนยันค่าที่จำเป็นสำหรับอินวาเรียนต์รันไทม์ที่พิสูจน์ได้ |
    | `plugin-sdk/number-runtime` | ตัวช่วยบังคับแปลงเป็นตัวเลข |
    | `plugin-sdk/secure-random-runtime` | ตัวช่วยโทเค็น/UUID ที่ปลอดภัย |
    | `plugin-sdk/system-event-runtime` | ตัวช่วยคิวเหตุการณ์ระบบ |
    | `plugin-sdk/transport-ready-runtime` | ตัวช่วยรอความพร้อมของทรานสปอร์ต |
    | `plugin-sdk/exec-approvals-runtime` | ตัวช่วยไฟล์นโยบายอนุมัติ exec โดยไม่ใช้ Barrel รันไทม์โครงสร้างพื้นฐานแบบกว้าง |
    | `plugin-sdk/infra-runtime` | ชิมความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้พาธย่อยรันไทม์ที่เจาะจงด้านบน |
    | `plugin-sdk/collection-runtime` | ตัวช่วยแคชขนาดเล็กแบบจำกัดขอบเขต |
    | `plugin-sdk/diagnostic-runtime` | ตัวช่วยแฟล็กการวินิจฉัย เหตุการณ์ และบริบทการติดตาม |
    | `plugin-sdk/error-runtime` | กราฟข้อผิดพลาด การจัดรูปแบบ ตัวช่วยจำแนกข้อผิดพลาดร่วมกัน `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | ตัวช่วย fetch แบบห่อหุ้ม พร็อกซี ตัวเลือก EnvHttpProxyAgent และการค้นหาแบบตรึง |
    | `plugin-sdk/runtime-fetch` | fetch สำหรับรันไทม์ที่รับรู้ Dispatcher โดยไม่นำเข้าพร็อกซี/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | ตัวช่วยทำความสะอาด URL ข้อมูลรูปภาพแบบอินไลน์และตรวจหาลายเซ็น โดยไม่ใช้พื้นผิวรันไทม์สื่อแบบกว้าง |
    | `plugin-sdk/response-limit-runtime` | ตัวอ่านเนื้อหาการตอบกลับที่จำกัดตามจำนวนไบต์ เวลาว่าง และกำหนดเวลา โดยไม่ใช้พื้นผิวรันไทม์สื่อแบบกว้าง |
    | `plugin-sdk/session-binding-runtime` | สถานะการผูกการสนทนาปัจจุบันโดยไม่มีการกำหนดเส้นทางการผูกที่ตั้งค่าไว้หรือที่เก็บการจับคู่ |
    | `plugin-sdk/context-visibility-runtime` | การแก้ไขการมองเห็นบริบทและการกรองบริบทเสริม โดยไม่นำเข้าการกำหนดค่า/ความปลอดภัยแบบกว้าง |
    | `plugin-sdk/string-coerce-runtime` | พริมิตีฟแบบจำกัดขอบเขตสำหรับการบังคับแปลงและปรับเรคคอร์ด/สตริงให้เป็นมาตรฐาน โดยไม่นำเข้า Markdown/การบันทึกล็อก |
    | `plugin-sdk/html-entity-runtime` | การถอดรหัสเอนทิตี HTML5 ที่ลงท้ายด้วยอัฒภาคในรอบเดียว โดยไม่ใช้ยูทิลิตีข้อความแบบกว้าง |
    | `plugin-sdk/text-utility-runtime` | ตัวช่วยข้อความและพาธระดับล่าง รวมถึงการ Escape HTML ห้าเอนทิตี |
    | `plugin-sdk/widget-html` | การตรวจจับเอกสารที่สมบูรณ์ การตรวจสอบขนาด และข้อผิดพลาดอินพุตของเครื่องมือสำหรับวิดเจ็ต HTML ที่มีทุกอย่างในตัว |
    | `plugin-sdk/host-runtime` | ตัวช่วยปรับชื่อโฮสต์และโฮสต์ SCP ให้เป็นมาตรฐาน |
    | `plugin-sdk/retry-runtime` | ตัวช่วยการกำหนดค่าการลองใหม่และตัวเรียกใช้การลองใหม่ |
    | `plugin-sdk/agent-runtime` | Barrel แบบกว้างที่เลิกใช้แล้วสำหรับตัวช่วยไดเรกทอรี/อัตลักษณ์/พื้นที่ทำงานของเอเจนต์ รวมถึง `resolveAgentDir`, `resolveDefaultAgentDir` และรายการส่งออกเพื่อความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว ควรใช้พาธย่อยเอเจนต์/รันไทม์ที่เจาะจงแทน |
    | `plugin-sdk/directory-runtime` | การสืบค้น/ขจัดรายการซ้ำของไดเรกทอรีที่อิงการกำหนดค่า |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="พาธย่อยด้านความสามารถและการทดสอบ">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | barrel สื่อแบบกว้างที่เลิกใช้แล้ว ซึ่งรวม `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` และ `fetchRemoteMedia` ที่เลิกใช้แล้ว ควรใช้ `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` และพาธย่อยของรันไทม์ความสามารถแทน และควรใช้ตัวช่วยของสโตรก่อนอ่านบัฟเฟอร์เมื่อ URL ควรถูกแปลงเป็นสื่อของ OpenClaw |
    | `plugin-sdk/media-mime` | ตัวช่วยแบบจำกัดขอบเขตสำหรับการทำ MIME ให้เป็นมาตรฐาน การแมปนามสกุลไฟล์ การตรวจหา MIME และชนิดสื่อ |
    | `plugin-sdk/media-store` | ตัวช่วยสโตรสื่อแบบจำกัดขอบเขต เช่น `saveMediaBuffer` และ `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | ตัวช่วยส่วนกลางสำหรับการสลับสำรองในการสร้างสื่อ การเลือกตัวเลือก และข้อความเมื่อไม่มีโมเดล |
    | `plugin-sdk/media-understanding` | ชนิดผู้ให้บริการสำหรับการทำความเข้าใจสื่อ พร้อมการส่งออกตัวช่วยด้านรูปภาพ/เสียง/การสกัดข้อมูลแบบมีโครงสร้างสำหรับผู้ให้บริการ |
    | `plugin-sdk/text-chunking` | การแบ่งข้อความขาออกและช่วงโดยคงค่าออฟเซ็ต การแบ่ง Markdown และตัวช่วยเรนเดอร์ การแยกโทเค็นแท็ก HTML โดยคำนึงถึงเครื่องหมายคำพูด การแปลงตาราง Markdown การลบแท็กคำสั่ง และยูทิลิตีข้อความที่ปลอดภัย |
    | `plugin-sdk/speech` | ชนิดผู้ให้บริการเสียงพูด พร้อมการส่งออกคำสั่ง รีจิสทรี การตรวจสอบ ตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI และตัวช่วยเสียงพูดสำหรับผู้ให้บริการ |
    | `plugin-sdk/speech-core` | ชนิดผู้ให้บริการเสียงพูด รีจิสทรี คำสั่ง การทำให้เป็นมาตรฐาน และการส่งออกตัวช่วยเสียงพูดที่ใช้ร่วมกัน |
    | `plugin-sdk/speech-settings` | องค์ประกอบพื้นฐานสำหรับการแก้ไขและทำให้การกำหนดค่า TTS เป็นมาตรฐานแบบน้ำหนักเบา โดยไม่มีรีจิสทรีผู้ให้บริการหรือรันไทม์การสังเคราะห์ |
    | `plugin-sdk/realtime-transcription` | ชนิดผู้ให้บริการถอดเสียงแบบเรียลไทม์ ตัวช่วยรีจิสทรี และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
    | `plugin-sdk/realtime-bootstrap-context` | ตัวช่วยเริ่มต้นโปรไฟล์เรียลไทม์สำหรับการแทรกบริบท `IDENTITY.md`, `USER.md` และ `SOUL.md` แบบจำกัดขอบเขต |
    | `plugin-sdk/realtime-voice` | ชนิดผู้ให้บริการเสียงแบบเรียลไทม์ ตัวช่วยรีจิสทรี เกตพลังงานเสียง/การเริ่มพูดที่ใช้ร่วมกัน และตัวช่วยพฤติกรรมเสียงแบบเรียลไทม์ รวมถึงชุดทดสอบเซสชันที่ไม่ขึ้นกับการขนส่งและการติดตามกิจกรรมเอาต์พุต |
    | `plugin-sdk/meeting-runtime` | รันไทม์เซสชันการประชุมผ่านเบราว์เซอร์ เอนจิน/การขนส่งเสียงแบบเรียลไทม์ `MeetingPlatformAdapter` การควบคุมเบราว์เซอร์/Node การปรึกษาเอเจนต์ การมอบหมายสายสนทนาด้วยเสียง การตรวจสอบการตั้งค่า และตัวช่วยคำสั่ง SoX |
    | `plugin-sdk/image-generation` | ชนิดผู้ให้บริการสร้างรูปภาพ พร้อมตัวช่วยแอสเซ็ตรูปภาพ/URL ข้อมูล และตัวสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
    | `plugin-sdk/image-generation-core` | ชนิด การสลับสำรอง การยืนยันตัวตน และตัวช่วยรีจิสทรีสำหรับการสร้างรูปภาพที่ใช้ร่วมกัน |
    | `plugin-sdk/music-generation` | ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างเพลง |
    | `plugin-sdk/music-generation-core` | ชนิดส่วนกลางสำหรับการสร้างเพลง ตัวช่วยสลับสำรอง การค้นหาผู้ให้บริการ และการแยกวิเคราะห์การอ้างอิงโมเดลที่เลิกใช้แล้ว ควรใช้พื้นผิวผู้ให้บริการเพลงที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/video-generation` | ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างวิดีโอ |
    | `plugin-sdk/video-generation-core` | ชนิดส่วนกลางสำหรับการสร้างวิดีโอ ตัวช่วยสลับสำรอง การค้นหาผู้ให้บริการ และการแยกวิเคราะห์การอ้างอิงโมเดล |
    | `plugin-sdk/transcripts` | ชนิดผู้ให้บริการแหล่งที่มาของบทถอดเสียง ตัวช่วยรีจิสทรี ตัวอธิบายเซสชัน และข้อมูลเมตาของถ้อยคำที่ใช้ร่วมกัน |
    | `plugin-sdk/webhook-targets` | รีจิสทรีเป้าหมาย Webhook และตัวช่วยติดตั้งเส้นทาง |
    | `plugin-sdk/webhook-path` | นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | ตัวช่วยโหลดสื่อระยะไกล/ภายในเครื่องที่ใช้ร่วมกัน |
    | `plugin-sdk/zod` | การส่งออกซ้ำเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้นำเข้า `zod` จาก `zod` โดยตรง |
    | `plugin-sdk/plugin-test-api` | ตัวช่วย `createTestPluginApi` ขั้นต่ำภายในรีโพสำหรับการทดสอบหน่วยการลงทะเบียน Plugin โดยตรง โดยไม่ต้องนำเข้าบริดจ์ตัวช่วยทดสอบของรีโพ |
    | `plugin-sdk/agent-runtime-test-contracts` | ฟิกซ์เจอร์สัญญาอะแดปเตอร์รันไทม์เอเจนต์แบบเนทีฟภายในรีโพ สำหรับการทดสอบการยืนยันตัวตน การส่งมอบ การสลับสำรอง ฮุกเครื่องมือ โอเวอร์เลย์พรอมต์ สคีมา และการฉายภาพบทถอดเสียง |
    | `plugin-sdk/channel-test-helpers` | ตัวช่วยทดสอบที่เน้นช่องทางภายในรีโพ สำหรับสัญญาการดำเนินการ/การตั้งค่า/สถานะทั่วไป การยืนยันไดเรกทอรี วงจรชีวิตการเริ่มต้นบัญชี การส่งต่อการกำหนดค่าการส่ง ม็อกรันไทม์ ปัญหาสถานะ การส่งมอบขาออก และการลงทะเบียนฮุก |
    | `plugin-sdk/channel-target-testing` | ชุดกรณีข้อผิดพลาดในการแก้ไขเป้าหมายที่ใช้ร่วมกันภายในรีโพสำหรับการทดสอบช่องทาง |
    | `plugin-sdk/channel-contract-testing` | ตัวช่วยทดสอบสัญญาช่องทางแบบจำกัดขอบเขตภายในรีโพ โดยไม่ใช้ barrel การทดสอบแบบกว้าง |
    | `plugin-sdk/plugin-test-contracts` | ตัวช่วยสัญญาภายในรีโพสำหรับแพ็กเกจ Plugin การลงทะเบียน อาร์ติแฟกต์สาธารณะ การนำเข้าโดยตรง API รันไทม์ และผลข้างเคียงจากการนำเข้า |
    | `plugin-sdk/plugin-state-test-runtime` | ตัวช่วยทดสอบภายในรีโพสำหรับสโตรสถานะ Plugin คิวขาเข้า และฐานข้อมูลสถานะ |
    | `plugin-sdk/provider-test-contracts` | ตัวช่วยสัญญาภายในรีโพสำหรับรันไทม์ผู้ให้บริการ การยืนยันตัวตน การค้นพบ การเริ่มต้นใช้งาน แค็ตตาล็อก วิซาร์ด ความสามารถด้านสื่อ นโยบายการเล่นซ้ำ STT แบบเรียลไทม์ด้วยเสียงสด การค้นหา/ดึงข้อมูลเว็บ และสตรีม |
    | `plugin-sdk/provider-http-test-mocks` | ม็อก HTTP/การยืนยันตัวตนของ Vitest แบบเลือกใช้ภายในรีโพ สำหรับการทดสอบผู้ให้บริการที่เรียกใช้ `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | ตัวช่วยภายในรีโพสำหรับแนบข้อมูลเมตาเข้ากับฟิกซ์เจอร์เพย์โหลดการตอบกลับ |
    | `plugin-sdk/sqlite-runtime-testing` | ตัวช่วยวงจรชีวิต SQLite ภายในรีโพสำหรับการทดสอบของผู้พัฒนาโดยตรง |
    | `plugin-sdk/test-fixtures` | ฟิกซ์เจอร์ภายในรีโพสำหรับการบันทึกรันไทม์ CLI ทั่วไป บริบทแซนด์บ็อกซ์ ตัวเขียน Skills ข้อความเอเจนต์ เหตุการณ์ระบบ การโหลดโมดูลซ้ำ พาธ Plugin ที่รวมมาให้ ข้อความเทอร์มินัล การแบ่งส่วน โทเค็นการยืนยันตัวตน และกรณีที่มีชนิด |
    | `plugin-sdk/test-node-mocks` | ตัวช่วยม็อก Node builtin แบบเจาะจงภายในรีโพ สำหรับใช้ภายในแฟกทอรี `vi.mock("node:*")` ของ Vitest |
  </Accordion>

  <Accordion title="พาธย่อยของหน่วยความจำ">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/memory-core` | นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | ฟาซาดรันไทม์ดัชนี/การค้นหาหน่วยความจำที่เลิกใช้แล้ว ควรใช้พาธย่อยของโฮสต์หน่วยความจำที่ไม่ขึ้นกับผู้จำหน่าย |
    | `plugin-sdk/memory-core-host-embedding-registry` | ตัวช่วยรีจิสทรีผู้ให้บริการเอ็มเบดดิงหน่วยความจำแบบน้ำหนักเบา |
    | `plugin-sdk/memory-core-host-engine-foundation` | การส่งออกเอนจินพื้นฐานของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | สัญญาเอ็มเบดดิงของโฮสต์หน่วยความจำ การเข้าถึงรีจิสทรี ผู้ให้บริการภายในเครื่อง และตัวช่วยทั่วไปแบบแบตช์/ระยะไกล `registerMemoryEmbeddingProvider` บนพื้นผิวนี้เลิกใช้แล้ว สำหรับผู้ให้บริการใหม่ให้ใช้ API ผู้ให้บริการเอ็มเบดดิงทั่วไป |
    | `plugin-sdk/memory-core-host-engine-qmd` | การส่งออกเอนจิน QMD ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-storage` | การส่งออกเอนจินพื้นที่จัดเก็บของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-multimodal` | ตัวช่วยหลายรูปแบบของโฮสต์หน่วยความจำที่เลิกใช้แล้ว ควรใช้พาธย่อยของโฮสต์หน่วยความจำที่ไม่ขึ้นกับผู้จำหน่าย |
    | `plugin-sdk/memory-core-host-query` | ตัวช่วยคิวรีของโฮสต์หน่วยความจำที่เลิกใช้แล้ว ควรใช้พาธย่อยของโฮสต์หน่วยความจำที่ไม่ขึ้นกับผู้จำหน่าย |
    | `plugin-sdk/memory-core-host-secret` | ตัวช่วยข้อมูลลับของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-events` | นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | ตัวช่วยสถานะของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-cli` | ตัวช่วยรันไทม์ CLI ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-core` | ตัวช่วยรันไทม์หลักของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-files` | ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-core` | นามแฝงที่ไม่ขึ้นกับผู้จำหน่ายสำหรับตัวช่วยรันไทม์หลักของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-events` | นามแฝงที่ไม่ขึ้นกับผู้จำหน่ายสำหรับตัวช่วยบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-files` | นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | ตัวช่วย Markdown ที่มีการจัดการและใช้ร่วมกันสำหรับ Plugin ที่เกี่ยวข้องกับหน่วยความจำ |
    | `plugin-sdk/memory-host-search` | ฟาซาดรันไทม์ Active Memory สำหรับการเข้าถึงตัวจัดการการค้นหา |
    | `plugin-sdk/memory-host-status` | นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้ใช้ `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="พาธย่อยตัวช่วยแบบรวมที่สงวนไว้">
    พาธย่อย SDK สำหรับตัวช่วยแบบรวมที่สงวนไว้เป็นพื้นผิวเฉพาะเจ้าของที่มีขอบเขตจำกัดสำหรับ
    โค้ด Plugin ที่รวมมาให้ พาธเหล่านี้ถูกติดตามในบัญชีรายการ SDK เพื่อให้การบิลด์
    แพ็กเกจและการกำหนดนามแฝงคงความแน่นอน แต่ไม่ใช่ API ทั่วไปสำหรับ
    การสร้าง Plugin สัญญาโฮสต์ใหม่ที่นำกลับมาใช้ซ้ำได้ควรใช้พาธย่อย SDK ทั่วไป
    เช่น `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` และ
    `plugin-sdk/plugin-config-runtime`

    | พาธย่อย | เจ้าของและวัตถุประสงค์ |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | ตัวช่วย Plugin Codex ที่รวมมาให้ สำหรับฉายการกำหนดค่าเซิร์ฟเวอร์ MCP ของผู้ใช้ไปยังการกำหนดค่าเธรดของ app-server ของ Codex (การส่งออกแพ็กเกจที่สงวนไว้) |
    | `plugin-sdk/codex-native-task-runtime` | ตัวช่วย Plugin Codex ที่รวมมาให้ สำหรับมิเรอร์ซับเอเจนต์แบบเนทีฟของ app-server ของ Codex ไปยังสถานะงานของ OpenClaw (ใช้ภายในรีโพเท่านั้น ไม่ใช่การส่งออกแพ็กเกจ) |

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
