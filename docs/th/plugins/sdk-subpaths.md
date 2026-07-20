---
read_when:
    - การเลือกพาธย่อย plugin-sdk ที่เหมาะสมสำหรับการนำเข้า Plugin
    - การตรวจสอบเส้นทางย่อยและส่วนติดต่อของตัวช่วยใน Plugin ที่รวมมาให้
summary: 'แค็ตตาล็อกพาธย่อยของ Plugin SDK: การนำเข้าแต่ละรายการอยู่ที่ใด โดยจัดกลุ่มตามส่วนงาน'
title: พาธย่อยของ Plugin SDK
x-i18n:
    generated_at: "2026-07-20T06:08:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 17f09b2095cbef8f330dbb500c11bd86ff79cb2d93b1f1d2feadb2b3e44127c2
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK ของ Plugin ประกอบด้วยพาธย่อยสาธารณะที่มีขอบเขตแคบ และตัวช่วยแบบรวมชุดที่ใช้เฉพาะในรีโพซิทอรี
ภายใต้ `openclaw/plugin-sdk/` หน้านี้จัดทำรายการทั้งสองประเภทและระบุ
รายการ private-local อย่างชัดเจน มีไฟล์สามไฟล์ที่กำหนดขอบเขตนี้:

- `scripts/lib/plugin-sdk-entrypoints.json`: รายการจุดเข้าใช้งานที่ได้รับการดูแล
  ซึ่งบิลด์จะคอมไพล์
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: พาธย่อยสำหรับการทดสอบ/ภายใน
  ที่ใช้เฉพาะในรีโพซิทอรี การส่งออกแพ็กเกจคือรายการทั้งหมดหักด้วยรายการนี้
- `src/plugin-sdk/entrypoints.ts`: เมทาดาทาการจัดประเภทสำหรับพาธย่อย
  ที่เลิกใช้แล้ว ตัวช่วยแบบรวมชุดที่สงวนไว้ facade แบบรวมชุดที่รองรับ และ
  พื้นผิวสาธารณะที่ Plugin เป็นเจ้าของ

ผู้ดูแลตรวจสอบจำนวนการส่งออกสาธารณะด้วย `pnpm plugin-sdk:surface` และ
พาธย่อยของตัวช่วยที่สงวนไว้ซึ่งใช้งานอยู่ด้วย `pnpm plugins:boundary-report:summary`;
การส่งออกตัวช่วยที่สงวนไว้แต่ไม่ได้ใช้จะทำให้รายงาน CI ล้มเหลว แทนที่จะคงอยู่ใน
SDK สาธารณะในฐานะหนี้ความเข้ากันได้ที่ไม่ได้ใช้งาน

สำหรับคู่มือการสร้าง Plugin โปรดดู [ภาพรวม SDK ของ Plugin](/th/plugins/sdk-overview)

## จุดเข้าใช้งาน Plugin

| พาธย่อย                        | การส่งออกหลัก                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | เป็น private-local หลังเดือนกรกฎาคม 2026; `defineSingleProviderPluginEntry`                                                                                                                                        |
| `plugin-sdk/migration`         | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยรายการของผู้ให้บริการการย้ายข้อมูล เช่น `createMigrationItem`, ค่าคงที่เหตุผล, เครื่องหมายสถานะรายการ, ตัวช่วยปกปิดข้อมูล และ `summarizeMigrationItems`                   |
| `plugin-sdk/migration-runtime` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยการย้ายข้อมูลขณะรันไทม์ เช่น `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` และ `writeMigrationReport`              |
| `plugin-sdk/health`            | การลงทะเบียน การตรวจจับ การซ่อมแซม การเลือก ระดับความรุนแรง และประเภทข้อค้นพบของการตรวจสอบสถานะ Doctor สำหรับผู้ใช้สถานะแบบรวมชุด                                                                                |

### ตัวช่วยด้านความเข้ากันได้และ private-local

ยังคงส่งออกเฉพาะพาธย่อยที่เลิกใช้แล้วในช่วงเวลาหลังเท่านั้น alias และ
พาธย่อยที่ไม่ได้ใช้ของเดือนกรกฎาคม 2026 ถูกลบแล้ว ส่วนตัวช่วยที่ใช้เฉพาะแบบรวมชุดถูกนำออกจาก
แพ็กเกจสาธารณะและระบุเป็น private-local ด้านล่าง รายการที่ได้รับการดูแลคือ
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI ปฏิเสธรายการแบบรวมชุด
`plugin-sdk/text-runtime` มีไว้เพื่อความเข้ากันได้เท่านั้น และ `plugin-sdk/zod` เป็น
การส่งออกซ้ำเพื่อความเข้ากันได้: ให้นำเข้า `zod` โดยตรงจาก `zod` ส่วน barrel ของโดเมนแบบกว้าง
`plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` และ
`plugin-sdk/security-runtime` ก็เลิกใช้แล้วเช่นกัน โดยให้ใช้
พาธย่อยที่เจาะจงแทน

พาธย่อยตัวช่วยทดสอบของ OpenClaw ที่รองรับด้วย Vitest ใช้เฉพาะในรีโพซิทอรี และ
ไม่ใช่การส่งออกของแพ็กเกจอีกต่อไป ได้แก่ `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-live`, `test-live-auth`, `test-media-generation`,
`test-media-understanding`, `test-node-mocks` และ `testing` พื้นผิวตัวช่วยแบบรวมชุดส่วนตัว
`ssrf-runtime-internal` และ `codex-native-task-runtime` ก็ใช้เฉพาะในรีโพซิทอรี
เช่นกัน

### พาธย่อยตัวช่วยของ Plugin แบบรวมชุด

โมดูลตัวช่วยที่ใช้เฉพาะแบบรวมชุดเป็น private-local หลังการกวาดล้างในเดือนกรกฎาคม 2026 การนำเข้าข้ามเจ้าของถูกบล็อกด้วยกลไกป้องกันของสัญญาแพ็กเกจ `src/plugin-sdk/entrypoints.ts` ติดตาม facade แบบรวมชุดที่รองรับและยังคงเป็นสาธารณะแยกต่างหาก ซึ่งเป็นจุดเข้าใช้งาน
SDK ที่ได้รับการรองรับโดย Plugin แบบรวมชุดของตนจนกว่าสัญญาทั่วไปจะเข้ามาแทนที่
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
เลิกใช้แล้วสำหรับโค้ดใหม่ โปรดดูหมายเหตุในแต่ละแถวด้านล่าง

<AccordionGroup>
  <Accordion title="พาธย่อยของช่องทาง">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยตรวจสอบความถูกต้องของ JSON Schema แบบแคชสำหรับสคีมาที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | ตัวช่วยวิซาร์ดการตั้งค่าที่ใช้ร่วมกัน ตัวแปลการตั้งค่า พรอมต์รายการที่อนุญาต และตัวสร้างสถานะการตั้งค่า |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | ตัวช่วยการกำหนดค่า/เกตการดำเนินการสำหรับหลายบัญชี และตัวช่วย fallback ของบัญชีเริ่มต้น |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ตัวช่วยปรับรหัสบัญชีให้เป็นมาตรฐาน |
    | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชีและ fallback ไปยังค่าเริ่มต้น |
    | `plugin-sdk/account-helpers` | ตัวช่วยรายการบัญชี/การดำเนินการกับบัญชีที่มีขอบเขตแคบ |
    | `plugin-sdk/access-groups` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยแยกวิเคราะห์รายการที่อนุญาตของกลุ่มการเข้าถึง และการวินิจฉัยกลุ่มแบบปกปิดข้อมูล |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | facade ความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | องค์ประกอบพื้นฐานของสคีมาการกำหนดค่าช่องทางที่ใช้ร่วมกัน รวมถึง Zod และตัวสร้าง JSON/TypeBox โดยตรง |
    | `plugin-sdk/bundled-channel-config-schema` | เป็น private-local หลังเดือนกรกฎาคม 2026; สคีมาการกำหนดค่าช่องทาง OpenClaw แบบรวมชุดสำหรับ Plugin แบบรวมชุดที่ได้รับการดูแลเท่านั้น |
    | `plugin-sdk/chat-channel-ids` | เป็น private-local หลังเดือนกรกฎาคม 2026; `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId` รหัสช่องทางแชตแบบรวมชุด/ทางการที่เป็นมาตรฐาน รวมถึงป้ายกำกับ/alias ของตัวจัดรูปแบบ สำหรับ Plugin ที่ต้องจำแนกข้อความซึ่งมีคำนำหน้า envelope โดยไม่ต้องฮาร์ดโค้ดตารางของตนเอง |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | ตัวแก้ไขรันไทม์การรับเข้าช่องทางระดับสูงแบบทดลอง ตัวแก้ไขนโยบายการกล่าวถึงโดยนัย และตัวสร้างข้อเท็จจริงของเส้นทางสำหรับพาธรับข้อมูลของช่องทางที่ย้ายแล้ว ควรใช้สิ่งนี้แทนการประกอบรายการที่อนุญาตที่มีผล รายการคำสั่งที่อนุญาต และการฉายข้อมูลแบบเดิมในแต่ละ Plugin ดู [API การรับเข้าช่องทาง](/th/plugins/sdk-channel-ingress) |
    | `plugin-sdk/channel-lifecycle` | facade ความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-outbound` | สัญญาวงจรชีวิตข้อความ รวมถึงตัวเลือกไปป์ไลน์การตอบกลับ ใบรับ ทรีวิวสด/สตรีมมิง ตัวช่วยวงจรชีวิต อัตลักษณ์ขาออก การวางแผนเพย์โหลด การส่งแบบคงทน และตัวช่วยบริบทการส่งข้อความ ดู [API ขาออกของช่องทาง](/th/plugins/sdk-channel-outbound) |
    | `plugin-sdk/channel-message` | alias ความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/inbound-envelope` | ตัวช่วยตัวสร้างเส้นทางขาเข้าและ envelope ที่ใช้ร่วมกัน |
    | `plugin-sdk/inbound-reply-dispatch` | facade ความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-inbound` สำหรับตัวรันขาเข้าและเพรดิเคตการส่งต่อ และใช้ `plugin-sdk/channel-outbound` สำหรับตัวช่วยส่งข้อความ |
    | `plugin-sdk/messaging-targets` | alias การแยกวิเคราะห์เป้าหมายที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยโหลดสื่อขาออกที่ใช้ร่วมกันและสถานะสื่อที่โฮสต์ |
    | `plugin-sdk/poll-runtime` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยปรับโพลให้เป็นมาตรฐานที่มีขอบเขตแคบ |
    | `plugin-sdk/thread-bindings-runtime` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยวงจรชีวิตและอะแดปเตอร์สำหรับการผูกเธรด |
    | `plugin-sdk/agent-media-payload` | facade ความเข้ากันได้ที่เลิกใช้แล้วสำหรับรากและตัวโหลดเพย์โหลดสื่อของเอเจนต์ Plugin ช่องทางใหม่ใช้การวางแผนเพย์โหลดขาออกแบบมีชนิดจาก `plugin-sdk/channel-outbound`; การโหลดสื่อภายในเครื่องที่ผู้ปฏิบัติงานระบุยังคงใช้ facade ที่เก็บไว้จนกว่าจะมี seam สาธารณะสำหรับรากภายในเครื่องที่เจาะจง |
    | `plugin-sdk/conversation-runtime` | barrel แบบกว้างที่เลิกใช้แล้วสำหรับการผูกการสนทนา/เธรด การจับคู่ และตัวช่วยการผูกที่กำหนดค่าไว้ ควรใช้พาธย่อยการผูกที่เจาะจง เช่น `plugin-sdk/thread-bindings-runtime` และ `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | ตัวช่วยแก้ไขนโยบายกลุ่มขณะรันไทม์ |
    | `plugin-sdk/channel-status` | ตัวช่วยสแนปชอต/สรุปสถานะช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/channel-config-primitives` | องค์ประกอบพื้นฐานของสคีมาการกำหนดค่าช่องทางที่มีขอบเขตแคบ |
    | `plugin-sdk/channel-config-writes` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยการให้สิทธิ์เขียนการกำหนดค่าช่องทาง |
    | `plugin-sdk/channel-plugin-common` | การส่งออกบทนำของ Plugin ช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/allowlist-config-edit` | ตัวช่วยแก้ไข/อ่านการกำหนดค่ารายการที่อนุญาต |
    | `plugin-sdk/group-access` | ตัวช่วยตัดสินใจการเข้าถึงกลุ่มที่เลิกใช้แล้ว ใช้ `resolveChannelMessageIngress` จาก `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm-guard-policy` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยนโยบายตัวป้องกันก่อนเข้ารหัสสำหรับ DM โดยตรงที่มีขอบเขตแคบ |
    | `plugin-sdk/discord` | facade ความเข้ากันได้ของ Discord ที่เลิกใช้แล้วสำหรับ `@openclaw/discord@2026.3.13` ที่เผยแพร่และความเข้ากันได้ของเจ้าของที่ติดตามอยู่ Plugin ใหม่ควรใช้พาธย่อย SDK ช่องทางทั่วไป |
    | `plugin-sdk/telegram-account` | facade ความเข้ากันได้ในการแก้ไขบัญชี Telegram ที่เลิกใช้แล้วสำหรับความเข้ากันได้ของเจ้าของที่ติดตามอยู่ Plugin ใหม่ควรใช้ตัวช่วยรันไทม์ที่ฉีดเข้ามาหรือพาธย่อย SDK ช่องทางทั่วไป |
    | `plugin-sdk/interactive-runtime` | การนำเสนอและการส่งข้อความเชิงความหมาย รวมถึงตัวช่วยตอบกลับแบบโต้ตอบเดิม ดู [การนำเสนอข้อความ](/th/plugins/message-presentation) |
    | `plugin-sdk/question-gateway-runtime` | แก้ไขตัวเลือก `ask_user` ที่รันไทม์สร้างขึ้นผ่าน Gateway จากตัวจัดการการโต้ตอบของช่องทาง |
    | `plugin-sdk/channel-inbound` | ตัวช่วยขาเข้าที่ใช้ร่วมกันสำหรับการจัดประเภทเหตุการณ์ การสร้างบริบท การจัดรูปแบบ ราก การหน่วง การจับคู่การกล่าวถึง นโยบายการกล่าวถึง และการบันทึกขาเข้า |
    | `plugin-sdk/channel-inbound-debounce` | ตัวช่วยการหน่วงขาเข้าที่มีขอบเขตแคบ |
    | `plugin-sdk/channel-mention-gating` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยนโยบายการกล่าวถึง เครื่องหมายการกล่าวถึง และข้อความการกล่าวถึงที่มีขอบเขตแคบ โดยไม่มีพื้นผิวรันไทม์ขาเข้าที่กว้างกว่า |
    | `plugin-sdk/channel-streaming` | facade ความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-send-result` | ประเภทผลลัพธ์การตอบกลับ |
    | `plugin-sdk/channel-actions` | ตัวช่วยการดำเนินการกับข้อความของช่องทาง รวมถึงตัวช่วยสคีมาแบบเนทีฟที่เลิกใช้แล้วแต่ยังคงไว้เพื่อความเข้ากันได้ของ Plugin |
    | `plugin-sdk/channel-route` | เป็น private-local หลังเดือนกรกฎาคม 2026; การปรับเส้นทางให้เป็นมาตรฐาน การแก้ไขเป้าหมายโดยใช้ตัวแยกวิเคราะห์ การแปลงรหัสเธรดเป็นสตริง คีย์เส้นทางสำหรับการขจัดข้อมูลซ้ำ/แบบกระชับ ประเภทเป้าหมายที่แยกวิเคราะห์แล้ว และตัวช่วยเปรียบเทียบเส้นทาง/เป้าหมายที่ใช้ร่วมกัน |
    | `plugin-sdk/channel-targets` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยแยกวิเคราะห์เป้าหมาย ผู้เรียกใช้การเปรียบเทียบเส้นทางควรใช้ `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | ประเภทสัญญาช่องทาง |
    | `plugin-sdk/channel-feedback` | การเชื่อมต่อฟีดแบ็ก/รีแอ็กชัน |
  </Accordion>

พาธย่อยด้านความเข้ากันได้ของช่องทางในช่วงเวลาหลังยังคงเป็นสาธารณะเฉพาะจนถึง
วันที่ในรีจิสทรีของแต่ละรายการ alias ของเดือนกรกฎาคม เช่น การเข้าถึง DM โดยตรง ตัวเลือกการตอบกลับ พาธการจับคู่
และส่วนแยกรันไทม์ของช่องทางถูกลบแล้ว ส่วนตัวช่วยที่ใช้เฉพาะแบบรวมชุด
เป็น private-local

  <Accordion title="เส้นทางย่อยของผู้ให้บริการ">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วยตั้งค่าผู้ให้บริการภายใน/ที่โฮสต์เองซึ่งคัดสรรไว้ |
    | `plugin-sdk/cli-backend` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ค่าเริ่มต้นของแบ็กเอนด์ CLI + ค่าคงที่ watchdog |
    | `plugin-sdk/provider-auth-runtime` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วยรันไทม์การยืนยันตัวตนของผู้ให้บริการ: ขั้นตอน OAuth แบบ loopback, การแลกเปลี่ยนโทเค็น, การคงข้อมูลการยืนยันตัวตน และการหาค่า API key |
    | `plugin-sdk/provider-oauth-runtime` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ชนิด callback ของ OAuth สำหรับผู้ให้บริการทั่วไป, การเรนเดอร์หน้า callback, ตัวช่วย PKCE/state, การแยกวิเคราะห์ข้อมูลป้อนเข้าสำหรับการอนุญาต, ตัวช่วยการหมดอายุของโทเค็น และตัวช่วยยกเลิก |
    | `plugin-sdk/provider-auth-api-key` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วยเริ่มต้นใช้งานด้วย API key/เขียนโปรไฟล์ เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
    | `plugin-sdk/provider-env-vars` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วยค้นหาตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตนของผู้ให้บริการ |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, ตัวช่วยนำเข้าการยืนยันตัวตนของ OpenAI Codex, การส่งออกเพื่อความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว |
    | `plugin-sdk/provider-model-shared` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `selectPreferredLocalModelId`, `normalizeModelCompat`, ตัวสร้างนโยบาย replay ที่ใช้ร่วมกัน, ตัวช่วย endpoint ของผู้ให้บริการ และตัวช่วยปรับรหัสโมเดลให้เป็นมาตรฐานที่ใช้ร่วมกัน |
    | `plugin-sdk/provider-catalog-live-runtime` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วยแค็ตตาล็อกโมเดลแบบสดของผู้ให้บริการสำหรับการค้นหาแบบ `/models` ที่มีการป้องกัน: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, การกรองรหัสโมเดล, แคช TTL และค่าทดแทนแบบคงที่ |
    | `plugin-sdk/provider-catalog-runtime` | ฮุกเสริมแค็ตตาล็อกผู้ให้บริการขณะรันไทม์และจุดเชื่อมรีจิสทรีผู้ให้บริการของ Plugin สำหรับการทดสอบสัญญา |
    | `plugin-sdk/provider-catalog-shared` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วยความสามารถ HTTP/endpoint ของผู้ให้บริการทั่วไป, ข้อผิดพลาด HTTP ของผู้ให้บริการ และตัวช่วยแบบฟอร์ม multipart สำหรับการถอดเสียง |
    | `plugin-sdk/provider-web-fetch-contract` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วยสัญญาการกำหนดค่า/การเลือกสำหรับการดึงข้อมูลเว็บแบบจำกัด เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วยลงทะเบียน/แคชผู้ให้บริการการดึงข้อมูลเว็บ |
    | `plugin-sdk/provider-web-search-config-contract` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วยการกำหนดค่า/ข้อมูลประจำตัวสำหรับการค้นหาเว็บแบบจำกัด สำหรับผู้ให้บริการที่ไม่ต้องใช้การเชื่อมโยงเพื่อเปิดใช้ Plugin |
    | `plugin-sdk/provider-web-search-contract` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วยสัญญาการกำหนดค่า/ข้อมูลประจำตัวสำหรับการค้นหาเว็บแบบจำกัด เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวอ่านข้อมูลประจำตัวตามขอบเขต |
    | `plugin-sdk/provider-web-search` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วยลงทะเบียน/แคช/รันไทม์ของผู้ให้บริการการค้นหาเว็บ |
    | `plugin-sdk/embedding-providers` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ชนิดผู้ให้บริการ embedding ทั่วไปและตัวช่วยอ่าน รวมถึง `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` และ `listEmbeddingProviders(...)`; Plugin ลงทะเบียนผู้ให้บริการผ่าน `api.registerEmbeddingProvider(...)` เพื่อบังคับใช้ความเป็นเจ้าของ manifest |
    | `plugin-sdk/provider-tools` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` และการล้างสคีมา + การวินิจฉัยสำหรับ DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ชนิดสแนปช็อตการใช้งานของผู้ให้บริการ, ตัวช่วยดึงข้อมูลการใช้งานที่ใช้ร่วมกัน และตัวดึงข้อมูลของผู้ให้บริการ เช่น `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ชนิด wrapper ของสตรีม, ความเข้ากันได้กับการเรียกเครื่องมือแบบข้อความธรรมดา และตัวช่วย wrapper ที่ใช้ร่วมกันสำหรับ Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วย wrapper ของสตรีมผู้ให้บริการแบบสาธารณะที่ใช้ร่วมกัน รวมถึง `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` และยูทิลิตีสตรีมที่เข้ากันได้กับ Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วยการรับส่งข้อมูลแบบเนทีฟของผู้ให้บริการ เช่น การดึงข้อมูลที่มีการป้องกัน, การแยกข้อความผลลัพธ์ของเครื่องมือ, การแปลงข้อความสำหรับการรับส่งข้อมูล และสตรีมเหตุการณ์การรับส่งข้อมูลที่เขียนได้ |
    | `plugin-sdk/provider-onboard` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วยแพตช์การกำหนดค่าสำหรับการเริ่มต้นใช้งาน |
    | `plugin-sdk/global-singleton` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วย singleton/map/cache ภายในโปรเซส |
    | `plugin-sdk/group-activation` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วยโหมดการเปิดใช้งานกลุ่มและการแยกวิเคราะห์คำสั่งแบบจำกัด |
  </Accordion>

โดยปกติสแนปช็อตการใช้งานของผู้ให้บริการจะรายงานโควตา `windows` อย่างน้อยหนึ่งรายการ โดยแต่ละรายการมี
ป้ายกำกับ เปอร์เซ็นต์ที่ใช้ไป และเวลารีเซ็ตซึ่งระบุหรือไม่ก็ได้ ผู้ให้บริการที่แสดงยอดคงเหลือหรือ
ข้อความสถานะบัญชีแทนช่วงโควตาที่รีเซ็ตได้ควรส่งคืน
`summary` พร้อมอาร์เรย์ `windows` ว่าง แทนการสร้างเปอร์เซ็นต์ขึ้นมา
OpenClaw แสดงข้อความสรุปดังกล่าวในเอาต์พุตสถานะ; ใช้ `error` เฉพาะเมื่อ
endpoint การใช้งานล้มเหลวหรือไม่ส่งคืนข้อมูลการใช้งานที่นำไปใช้ได้

  <Accordion title="เส้นทางย่อยด้านการยืนยันตัวตนและความปลอดภัย">
    | เส้นทางย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | พื้นผิวการอนุญาตคำสั่งแบบกว้างที่เลิกใช้แล้ว (`resolveControlCommandGate`, ตัวช่วยรีจิสทรีคำสั่งรวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก, ตัวช่วยการอนุญาตผู้ส่ง); ให้ใช้การอนุญาตที่จุดรับเข้า/รันไทม์ของช่องทางหรือตัวช่วยสถานะคำสั่ง |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความคำสั่ง/ความช่วยเหลือ เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | ตัวช่วยระบุผู้อนุมัติและการยืนยันสิทธิ์การดำเนินการภายในแชตเดียวกัน |
    | `plugin-sdk/approval-client-runtime` | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติการดำเนินการแบบเนทีฟ |
    | `plugin-sdk/approval-delivery-runtime` | อะแดปเตอร์ความสามารถ/การส่งมอบการอนุมัติแบบเนทีฟ |
    | `plugin-sdk/approval-gateway-runtime` | ตัวแก้ไข Gateway การอนุมัติที่ใช้ร่วมกัน |
    | `plugin-sdk/approval-reference-runtime` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วยตัวระบุตำแหน่งแบบถาวรและกำหนดผลได้แน่นอนสำหรับ callback การอนุมัติที่ถูกจำกัดโดยการรับส่งข้อมูล |
    | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยโหลดอะแดปเตอร์การอนุมัติแบบเนทีฟน้ำหนักเบาสำหรับจุดเข้าช่องทางที่ใช้งานบ่อย |
    | `plugin-sdk/approval-handler-runtime` | ตัวช่วยรันไทม์ของตัวจัดการการอนุมัติที่กว้างกว่า; ควรใช้จุดเชื่อมอะแดปเตอร์/Gateway ที่จำกัดกว่าหากเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติแบบเนทีฟ, การผูกบัญชี, เกตเส้นทาง, ค่าทดแทนการส่งต่อ และการระงับพรอมต์การดำเนินการแบบเนทีฟเฉพาะที่ |
    | `plugin-sdk/approval-reaction-runtime` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; การผูกรีแอ็กชันการอนุมัติแบบฮาร์ดโค้ด, เพย์โหลดพรอมต์รีแอ็กชัน, ที่เก็บเป้าหมายรีแอ็กชัน, ตัวช่วยข้อความคำแนะนำรีแอ็กชัน และการส่งออกเพื่อความเข้ากันได้สำหรับการระงับพรอมต์การดำเนินการแบบเนทีฟเฉพาะที่ |
    | `plugin-sdk/approval-reply-runtime` | ตัวช่วยเพย์โหลดการตอบกลับการอนุมัติการดำเนินการ/Plugin |
    | `plugin-sdk/approval-runtime` | ตัวช่วยเพย์โหลดการอนุมัติการดำเนินการ/Plugin, ตัวสร้างความสามารถในการอนุมัติ, ตัวช่วยการยืนยันตัวตน/โปรไฟล์สำหรับการอนุมัติ, ตัวช่วยการกำหนดเส้นทาง/รันไทม์การอนุมัติแบบเนทีฟ และตัวช่วยแสดงการอนุมัติแบบมีโครงสร้าง เช่น `formatApprovalDisplayPath` |
    | `plugin-sdk/command-auth-native` | การยืนยันสิทธิ์คำสั่งแบบเนทีฟ, การจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก และตัวช่วยเป้าหมายเซสชันแบบเนทีฟ |
    | `plugin-sdk/command-detection` | ตัวช่วยตรวจจับคำสั่งที่ใช้ร่วมกัน |
    | `plugin-sdk/command-primitives-runtime` | เพรดิเคตข้อความคำสั่งน้ำหนักเบาสำหรับเส้นทางช่องทางที่ใช้งานบ่อย |
    | `plugin-sdk/command-surface` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วยปรับเนื้อหาคำสั่งให้เป็นมาตรฐานและพื้นผิวคำสั่ง |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วยขั้นตอนเข้าสู่ระบบการยืนยันตัวตนของผู้ให้บริการแบบ lazy สำหรับการจับคู่ด้วยรหัสอุปกรณ์ในช่องทางส่วนตัวและ Web UI |
    | `plugin-sdk/channel-secret-runtime` | พื้นผิวสัญญาข้อมูลลับแบบกว้างที่เลิกใช้แล้ว (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, ชนิดเป้าหมายข้อมูลลับ); ควรใช้เส้นทางย่อยเฉพาะด้านด้านล่าง |
    | `plugin-sdk/channel-secret-basic-runtime` | การส่งออกสัญญาข้อมูลลับแบบจำกัดและตัวสร้างรีจิสทรีเป้าหมายสำหรับพื้นผิวข้อมูลลับของช่องทาง/Plugin ที่ไม่ใช่ TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วยกำหนดข้อมูลลับ TTS ของช่องทางที่ซ้อนกันแบบจำกัด |
    | `plugin-sdk/secret-ref-runtime` | การกำหนดชนิด SecretRef แบบจำกัด, การแก้ค่า และการค้นหาเส้นทางเป้าหมายของแผนสำหรับการแยกวิเคราะห์สัญญาข้อมูลลับ/การกำหนดค่า |
    | `plugin-sdk/security-runtime` | barrel แบบกว้างที่เลิกใช้แล้วสำหรับความเชื่อถือ, การควบคุม DM, ตัวช่วยไฟล์/เส้นทางที่จำกัดอยู่ภายในรูท รวมถึงการเขียนแบบสร้างเท่านั้น, การแทนที่ไฟล์แบบอะตอมมิกทั้งซิงก์/อะซิงก์, การเขียนไฟล์ชั่วคราวข้างเคียง, ค่าทดแทนการย้ายข้ามอุปกรณ์, ตัวช่วยที่เก็บไฟล์ส่วนตัว, การป้องกันพาเรนต์ที่เป็น symlink, เนื้อหาภายนอก, การปกปิดข้อความละเอียดอ่อน, การเปรียบเทียบข้อมูลลับแบบเวลาคงที่ และตัวช่วยรวบรวมข้อมูลลับ; ควรใช้เส้นทางย่อยเฉพาะด้านความปลอดภัย/SSRF/ข้อมูลลับ |
    | `plugin-sdk/ssrf-policy` | ตัวช่วยรายการอนุญาตโฮสต์และนโยบาย SSRF สำหรับเครือข่ายส่วนตัว |
    | `plugin-sdk/ssrf-dispatcher` | เป็นแบบภายในเฉพาะที่หลังเดือนกรกฎาคม 2026; ตัวช่วย dispatcher แบบตรึงที่จำกัด โดยไม่มีพื้นผิวรันไทม์โครงสร้างพื้นฐานแบบกว้าง |
    | `plugin-sdk/ssrf-runtime` | ตัวช่วย dispatcher แบบตรึง, การดึงข้อมูลที่มีการป้องกัน SSRF, ข้อผิดพลาด SSRF และนโยบาย SSRF |
    | `plugin-sdk/secret-input` | ตัวช่วยแยกวิเคราะห์ข้อมูลป้อนเข้าที่เป็นข้อมูลลับ |
    | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ/เป้าหมาย Webhook และการแปลง websocket/body แบบดิบ |
    | `plugin-sdk/webhook-request-guards` | ตัวช่วยขนาด/ระยะหมดเวลาของเนื้อหาคำขอ และ `runDetachedWebhookWork` สำหรับการประมวลผลหลังการตอบรับที่มีการติดตาม |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | ตัวช่วยรันไทม์/การบันทึกล็อก/การสำรองข้อมูล คำเตือนเกี่ยวกับพาธการติดตั้ง Plugin และตัวช่วยกระบวนการ |
    | `plugin-sdk/runtime-env` | ตัวช่วยแบบจำกัดขอบเขตสำหรับสภาพแวดล้อมรันไทม์ ตัวบันทึกล็อก การหมดเวลา การลองใหม่ และการหน่วงเวลาแบบทวีคูณ |
    | `plugin-sdk/browser-config` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; facade การกำหนดค่าเบราว์เซอร์ที่รองรับสำหรับโปรไฟล์/ค่าเริ่มต้นที่ปรับเป็นมาตรฐาน การแยกวิเคราะห์ URL ของ CDP และตัวช่วยการยืนยันตัวตนเพื่อควบคุมเบราว์เซอร์ |
    | `plugin-sdk/agent-harness-task-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยวงจรชีวิตและการส่งมอบเมื่อเสร็จสิ้นของงานทั่วไปสำหรับเอเจนต์ที่ใช้ harness โดยใช้ขอบเขตงานที่โฮสต์ออกให้ |
    | `plugin-sdk/codex-mcp-projection` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วย Codex แบบรวมชุดที่สงวนไว้สำหรับฉายการกำหนดค่าเซิร์ฟเวอร์ MCP ของผู้ใช้ไปยังการกำหนดค่าเธรด Codex; ไม่ใช่สำหรับ Plugin ของบุคคลที่สาม |
    | `plugin-sdk/codex-native-task-runtime` | ตัวช่วย Codex แบบรวมชุดภายในรีโพสำหรับการเชื่อมต่อมิเรอร์งานเนทีฟ/รันไทม์; ไม่ใช่การส่งออกแพ็กเกจ |
    | `plugin-sdk/channel-runtime-context` | ตัวช่วยลงทะเบียนและค้นหาบริบทรันไทม์ของช่องทางทั่วไป |
    | `plugin-sdk/matrix` | facade ความเข้ากันได้ของ Matrix ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางของบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควรนำเข้า `plugin-sdk/run-command` โดยตรง |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | barrel แบบกว้างที่เลิกใช้แล้วสำหรับคำสั่ง Plugin/ฮุก/HTTP/ตัวช่วยแบบโต้ตอบ; ควรใช้พาธย่อยรันไทม์ของ Plugin ที่เจาะจง |
    | `plugin-sdk/hook-runtime` | barrel แบบกว้างที่เลิกใช้แล้วสำหรับตัวช่วย Webhook/ไปป์ไลน์ฮุกภายใน; ควรใช้พาธย่อยรันไทม์ของฮุก/Plugin ที่เจาะจง |
    | `plugin-sdk/lazy-runtime` | ตัวช่วยการนำเข้า/ผูกโยงรันไทม์แบบ lazy เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod` และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยเรียกใช้กระบวนการ |
    | `plugin-sdk/node-host` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยการค้นหาไฟล์ปฏิบัติการบนโฮสต์ Node และการดำเนินการ PTY ต่อ |
    | `plugin-sdk/cli-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; barrel แบบกว้างที่เลิกใช้แล้วสำหรับการจัดรูปแบบ CLI การรอ เวอร์ชัน การเรียกใช้ด้วยอาร์กิวเมนต์ และตัวช่วยกลุ่มคำสั่งแบบ lazy; ควรใช้พาธย่อย CLI/รันไทม์ที่เจาะจง |
    | `plugin-sdk/qa-runner-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; facade ที่รองรับซึ่งเปิดเผยสถานการณ์ QA ของ Plugin ผ่านพื้นผิวคำสั่ง CLI |
    | `plugin-sdk/tts-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; facade ที่รองรับสำหรับสคีมาการกำหนดค่าการแปลงข้อความเป็นเสียงและตัวช่วยรันไทม์ |
    | `plugin-sdk/gateway-method-runtime` | ตัวช่วยส่งต่อเมธอด Gateway ที่สงวนไว้สำหรับเส้นทาง HTTP ของ Plugin ซึ่งประกาศ `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | ไคลเอนต์ Gateway ตัวช่วยเริ่มไคลเอนต์เมื่อ event loop พร้อม RPC ของ CLI สำหรับ Gateway ข้อผิดพลาดของโปรโตคอล Gateway การค้นหาโฮสต์ LAN ที่ประกาศไว้ และตัวช่วยแพตช์สถานะช่องทาง |
    | `plugin-sdk/config-contracts` | พื้นผิวการกำหนดค่าเฉพาะชนิดที่เจาะจงสำหรับรูปแบบการกำหนดค่า Plugin เช่น `OpenClawConfig` และชนิดการกำหนดค่าช่องทาง/ผู้ให้บริการ |
    | `plugin-sdk/plugin-config-runtime` | facade ความเข้ากันได้ที่เลิกใช้แล้วสำหรับตัวช่วยการกำหนดค่า Plugin ในรันไทม์; Plugin ใหม่ใช้ `api.pluginConfig` ร่วมกับสัญญาการกำหนดค่า สแนปช็อต และตัวช่วยการเปลี่ยนแปลงที่เจาะจง |
    | `plugin-sdk/config-mutation` | ตัวช่วยเปลี่ยนแปลงการกำหนดค่าแบบทรานแซกชัน เช่น `mutateConfigFile`, `replaceConfigFile` และ `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; สตริงคำใบ้เมทาดาทาการส่งมอบของเครื่องมือข้อความที่ใช้ร่วมกัน |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วยสแนปช็อตการกำหนดค่ากระบวนการปัจจุบัน เช่น `getRuntimeConfig`, `getRuntimeConfigSnapshot` และตัวตั้งค่าสแนปช็อตสำหรับการทดสอบ |
    | `plugin-sdk/text-autolink-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; การตรวจหาลิงก์อัตโนมัติของการอ้างอิงไฟล์โดยไม่ใช้ barrel ข้อความแบบกว้าง |
    | `plugin-sdk/reply-runtime` | ตัวช่วยรันไทม์ขาเข้า/การตอบกลับที่ใช้ร่วมกัน การแบ่งส่วน การส่งต่อ Heartbeat และตัววางแผนการตอบกลับ |
    | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วยการส่งต่อ/สรุปการตอบกลับและป้ายกำกับการสนทนาแบบจำกัดขอบเขต |
    | `plugin-sdk/reply-history` | ตัวช่วยประวัติการตอบกลับในช่วงเวลาสั้นที่ใช้ร่วมกัน โค้ดรอบข้อความใหม่ควรใช้ `createChannelHistoryWindow`; ตัวช่วยแผนที่ระดับล่างยังคงเป็นเพียงการส่งออกเพื่อความเข้ากันได้ที่เลิกใช้แล้ว |
    | `plugin-sdk/reply-reference` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ตัวช่วยแบ่งส่วนข้อความ/Markdown แบบจำกัดขอบเขต |
    | `plugin-sdk/session-store-runtime` | ตัวช่วยเวิร์กโฟลว์เซสชัน (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`) ตัวช่วยซ่อมแซม/วงจรชีวิต (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`) ตัวช่วยมาร์กเกอร์สำหรับค่า `sessionFile` ในช่วงเปลี่ยนผ่าน การอ่านข้อความทรานสคริปต์ล่าสุดของผู้ใช้/ผู้ช่วยแบบจำกัดขอบเขตตามข้อมูลประจำตัวเซสชัน ตัวช่วยพาธที่เก็บเซสชัน/คีย์เซสชัน และการอ่านค่า updated-at โดยไม่ต้องนำเข้าการเขียน/บำรุงรักษาการกำหนดค่าแบบกว้าง |
    | `plugin-sdk/session-transcript-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ข้อมูลประจำตัวทรานสคริปต์ เคอร์เซอร์ดิบและเคอร์เซอร์ที่มองเห็นได้แบบจำกัดขอบเขต ตัวช่วยเป้าหมาย/อ่าน/เขียนแบบกำหนดขอบเขต การฉายรายการข้อความที่มองเห็นได้ การเผยแพร่การอัปเดต ล็อกการเขียน และคีย์การพบหน่วยความจำทรานสคริปต์ |
    | `plugin-sdk/sqlite-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยสคีมาเอเจนต์ SQLite พาธ และทรานแซกชันที่เจาะจงสำหรับรันไทม์ของบุคคลที่หนึ่ง โดยไม่มีการควบคุมวงจรชีวิตฐานข้อมูล |
    | `plugin-sdk/cron-store-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยพาธ/โหลด/บันทึกที่เก็บ Cron |
    | `plugin-sdk/state-paths` | ตัวช่วยพาธไดเรกทอรีสถานะ/OAuth |
    | `plugin-sdk/plugin-state-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; สัญญาสถานะแบบคีย์ BLOB และสัญญาเช่า SQLite แบบร่วมมือที่กำหนดขอบเขตตาม Plugin รวมถึง pragma การเชื่อมต่อ การบำรุงรักษา WAL ที่ผ่านการตรวจสอบ และตัวช่วยย้ายสคีมา STRICT แบบอะตอมมิก คอลแบ็กสัญญาเช่าจะได้รับสัญญาณยกเลิก และข้อผิดพลาดแบบระบุชนิดจะแยกความแตกต่างระหว่างการหมดเวลา การยกเลิก การสูญเสียความเป็นเจ้าของ อินพุตไม่ถูกต้อง และความล้มเหลวของพื้นที่จัดเก็บ |
    | `plugin-sdk/routing` | ตัวช่วยการผูกเส้นทาง/คีย์เซสชัน/บัญชี เช่น `resolveAgentRoute`, `buildAgentSessionKey` และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ตัวช่วยสรุปสถานะช่องทาง/บัญชีที่ใช้ร่วมกัน ค่าเริ่มต้นของสถานะรันไทม์ และตัวช่วยเมทาดาทาของปัญหา |
    | `plugin-sdk/target-resolver-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยแก้ไขเป้าหมายที่ใช้ร่วมกัน |
    | `plugin-sdk/string-normalization-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยปรับ slug/สตริงให้เป็นมาตรฐาน |
    | `plugin-sdk/request-url` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; แยก URL แบบสตริงจากอินพุตที่มีลักษณะคล้าย fetch/request |
    | `plugin-sdk/run-command` | ตัวเรียกใช้คำสั่งแบบกำหนดเวลาพร้อมผลลัพธ์ stdout/stderr ที่ปรับเป็นมาตรฐาน |
    | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์ทั่วไปของเครื่องมือ/CLI |
    | `plugin-sdk/tool-plugin` | กำหนด Plugin เครื่องมือเอเจนต์แบบระบุชนิดอย่างง่าย และเปิดเผยเมทาดาทาคงที่สำหรับการสร้าง manifest |
    | `plugin-sdk/tool-payload` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; แยกเพย์โหลดที่ปรับเป็นมาตรฐานจากอ็อบเจ็กต์ผลลัพธ์ของเครื่องมือ |
    | `plugin-sdk/tool-send` | แยกฟิลด์เป้าหมายการส่งแบบมาตรฐานจากอาร์กิวเมนต์ของเครื่องมือ |
    | `plugin-sdk/sandbox` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ชนิดแบ็กเอนด์แซนด์บ็อกซ์และตัวช่วยคำสั่ง SSH/OpenShell รวมถึงการตรวจสอบล่วงหน้าของคำสั่งเรียกใช้แบบล้มเหลวทันที |
    | `plugin-sdk/temp-path` | ตัวช่วยพาธดาวน์โหลดชั่วคราวที่ใช้ร่วมกันและพื้นที่ทำงานชั่วคราวส่วนตัวที่ปลอดภัย |
    | `plugin-sdk/logging-core` | ตัวช่วยตัวบันทึกล็อกระบบย่อยและการปกปิดข้อมูล |
    | `plugin-sdk/markdown-table-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; โหมดตาราง Markdown และตัวช่วยการแปลง |
    | `plugin-sdk/model-session-runtime` | ตัวช่วยแทนที่โมเดล/เซสชัน เช่น `applyModelOverrideToSessionEntry` และ `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยแก้ไขการกำหนดค่าผู้ให้บริการการพูด |
    | `plugin-sdk/json-store` | ตัวช่วยอ่าน/เขียนสถานะ JSON ขนาดเล็ก |
    | `plugin-sdk/json-unsafe-integers` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยแยกวิเคราะห์ JSON ที่เก็บลิเทอรัลจำนวนเต็มที่ไม่ปลอดภัยไว้เป็นสตริง |
    | `plugin-sdk/file-lock` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยล็อกไฟล์แบบกลับเข้าใช้ซ้ำได้ รวมถึงการเรียกคืน sidecar ล็อกที่เลิกใช้แล้วซึ่งล้าสมัยแน่นอนและไม่มีการเปลี่ยนแปลงอย่างปลอดภัยสำหรับ Doctor |
    | `plugin-sdk/persistent-dedupe` | ตัวช่วยแคชขจัดรายการซ้ำที่จัดเก็บบนดิสก์ |
    | `plugin-sdk/ingress-effect-once` | ตัวป้องกันการอ้างสิทธิ์/คอมมิตที่คงทนสำหรับผลข้างเคียงขาเข้าที่ไม่เป็น idempotent |
    | `plugin-sdk/acp-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยรันไทม์/เซสชัน ACP และการส่งต่อการตอบกลับ |
    | `plugin-sdk/acp-runtime-backend` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยลงทะเบียนแบ็กเอนด์ ACP แบบน้ำหนักเบาและการส่งต่อการตอบกลับสำหรับ Plugin ที่โหลดเมื่อเริ่มต้น |
    | `plugin-sdk/acp-binding-resolve-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; การแก้ไขการผูก ACP แบบอ่านอย่างเดียวโดยไม่ต้องนำเข้าการเริ่มต้นวงจรชีวิต |
    | `plugin-sdk/agent-config-primitives` | พื้นฐานสคีมาการกำหนดค่ารันไทม์เอเจนต์ที่เลิกใช้แล้ว; ให้นำเข้าพื้นฐานสคีมาจากพื้นผิวที่มีการบำรุงรักษาซึ่ง Plugin เป็นเจ้าของ |
    | `plugin-sdk/boolean-param` | ตัวอ่านพารามิเตอร์บูลีนแบบยืดหยุ่น |
    | `plugin-sdk/dangerous-name-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยแก้ไขการจับคู่ชื่อที่เป็นอันตราย |
    | `plugin-sdk/device-bootstrap` | ตัวช่วยบูตสแตรปอุปกรณ์และโทเค็นการจับคู่ รวมถึง `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | พื้นฐานตัวช่วยที่ใช้ร่วมกันสำหรับช่องทางแบบพาสซีฟ สถานะ และพร็อกซีแวดล้อม |
    | `plugin-sdk/models-provider-runtime` | ตัวช่วยการตอบกลับคำสั่ง/ผู้ให้บริการของ `/models` |
    | `plugin-sdk/skill-commands-runtime` | ตัวช่วยแสดงรายการคำสั่ง Skill |
    | `plugin-sdk/native-command-registry` | ตัวช่วยรีจิสทรี/สร้าง/ซีเรียลไลซ์คำสั่งเนทีฟ |
    | `plugin-sdk/agent-harness` | พื้นผิวทดลองสำหรับ Plugin ที่เชื่อถือได้เพื่อใช้กับ harness เอเจนต์ระดับต่ำ: ชนิด harness ตัวช่วยควบคุมทิศทาง/ยกเลิกการทำงานที่กำลังใช้งาน ตัวช่วยบริดจ์เครื่องมือ OpenClaw ตัวช่วยนโยบายเครื่องมือตามแผนรันไทม์ การจำแนกผลลัพธ์เทอร์มินัล การจัดรูปแบบ/รายละเอียดความคืบหน้าของเครื่องมือ และยูทิลิตีผลลัพธ์ของความพยายาม |
    | `plugin-sdk/async-lock-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยล็อกแบบอะซิงโครนัสภายในกระบวนการสำหรับไฟล์สถานะรันไทม์ขนาดเล็ก |
    | `plugin-sdk/channel-activity-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยโทรมาตรกิจกรรมช่องทาง |
    | `plugin-sdk/concurrency-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยจำกัดงานอะซิงโครนัสที่ทำพร้อมกัน |
    | `plugin-sdk/dedupe-runtime` | ตัวช่วยแคชขจัดรายการซ้ำแบบในหน่วยความจำและแบบมีพื้นที่จัดเก็บถาวรรองรับ |
    | `plugin-sdk/delivery-queue-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยระบายการส่งมอบขาออกที่รอดำเนินการ |
    | `plugin-sdk/file-access-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยพาธไฟล์ภายในเครื่องและแหล่งสื่อที่ปลอดภัย |
    | `plugin-sdk/heartbeat-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยปลุก Heartbeat เหตุการณ์ และการมองเห็น |
    | `plugin-sdk/expect-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยยืนยันค่าที่จำเป็นสำหรับอินวาเรียนต์รันไทม์ที่พิสูจน์ได้ |
    | `plugin-sdk/number-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยบังคับแปลงเป็นตัวเลข |
    | `plugin-sdk/secure-random-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยโทเค็น/UUID ที่ปลอดภัย |
    | `plugin-sdk/system-event-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยคิวเหตุการณ์ระบบ |
    | `plugin-sdk/transport-ready-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยรอความพร้อมของการขนส่ง |
    | `plugin-sdk/exec-approvals-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยไฟล์นโยบายการอนุมัติการเรียกใช้โดยไม่ใช้ barrel รันไทม์โครงสร้างพื้นฐานแบบกว้าง |
    | `plugin-sdk/infra-runtime` | shim ความเข้ากันได้ที่เลิกใช้แล้ว; ใช้พาธย่อยรันไทม์ที่เจาะจงด้านบน |
    | `plugin-sdk/collection-runtime` | ตัวช่วยแคชขนาดเล็กแบบจำกัดขอบเขต |
    | `plugin-sdk/diagnostic-runtime` | ตัวช่วยแฟล็กการวินิจฉัย เหตุการณ์ และบริบทการติดตาม |
    | `plugin-sdk/error-runtime` | ตัวช่วยกราฟข้อผิดพลาด การจัดรูปแบบ การจำแนกข้อผิดพลาดที่ใช้ร่วมกัน `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วย fetch แบบห่อหุ้ม พร็อกซี ตัวเลือก EnvHttpProxyAgent และการค้นหาแบบตรึง |
    | `plugin-sdk/runtime-fetch` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; fetch รันไทม์ที่รับรู้ dispatcher โดยไม่ต้องนำเข้าพร็อกซี/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยทำความสะอาด URL ข้อมูลรูปภาพแบบอินไลน์และตรวจหาลายเซ็นโดยไม่ใช้พื้นผิวรันไทม์สื่อแบบกว้าง |
    | `plugin-sdk/response-limit-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวอ่านเนื้อหาการตอบกลับที่จำกัดตามจำนวนไบต์ เวลาว่าง และเส้นตาย โดยไม่ใช้พื้นผิวรันไทม์สื่อแบบกว้าง |
    | `plugin-sdk/session-binding-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; สถานะการผูกการสนทนาปัจจุบันโดยไม่มีการกำหนดเส้นทางการผูกที่กำหนดค่าไว้หรือที่เก็บการจับคู่ |
    | `plugin-sdk/context-visibility-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; การแก้ไขการมองเห็นบริบทและการกรองบริบทเพิ่มเติมโดยไม่ต้องนำเข้าการกำหนดค่า/ความปลอดภัยแบบกว้าง |
    | `plugin-sdk/string-coerce-runtime` | ตัวช่วยบังคับแปลงและปรับเรคคอร์ด/สตริงพื้นฐานให้เป็นมาตรฐานแบบจำกัดขอบเขต โดยไม่ต้องนำเข้า Markdown/การบันทึกล็อก |
    | `plugin-sdk/html-entity-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; การถอดรหัสเอนทิตี HTML5 ที่ลงท้ายด้วยอัฒภาคในรอบเดียว โดยไม่ใช้ยูทิลิตีข้อความแบบกว้าง |
    | `plugin-sdk/text-utility-runtime` | ใช้ภายในแบบส่วนตัวหลังเดือนกรกฎาคม 2026; ตัวช่วยข้อความและพาธระดับล่าง รวมถึงการหลีกอักขระ HTML สำหรับเอนทิตีห้ารายการ |
    | `plugin-sdk/widget-html` | การตรวจหาเอกสารฉบับสมบูรณ์ การตรวจสอบขนาด และข้อผิดพลาดของอินพุตเครื่องมือสำหรับวิดเจ็ต HTML แบบเบ็ดเสร็จในตัว |
    | `plugin-sdk/host-runtime` | ใช้ภายในแบบส่วนตัวหลังเดือนกรกฎาคม 2026; ตัวช่วยปรับชื่อโฮสต์และโฮสต์ SCP ให้เป็นรูปแบบมาตรฐาน |
    | `plugin-sdk/retry-runtime` | ใช้ภายในแบบส่วนตัวหลังเดือนกรกฎาคม 2026; ตัวช่วยการกำหนดค่าการลองใหม่และตัวดำเนินการลองใหม่ |
    | `plugin-sdk/agent-runtime` | Barrel แบบครอบคลุมที่เลิกใช้แล้วสำหรับตัวช่วยไดเรกทอรี/ข้อมูลประจำตัว/พื้นที่ทำงานของเอเจนต์ รวมถึง `resolveAgentDir`, `resolveDefaultAgentDir` และการส่งออกเพื่อความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว; ควรเลือกใช้พาธย่อยเฉพาะด้านของเอเจนต์/รันไทม์ |
    | `plugin-sdk/directory-runtime` | การค้นหาไดเรกทอรีและการขจัดรายการซ้ำโดยอิงการกำหนดค่า |
    | `plugin-sdk/keyed-async-queue` | ใช้ภายในแบบส่วนตัวหลังเดือนกรกฎาคม 2026; `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="เส้นทางย่อยด้านความสามารถและการทดสอบ">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | barrel สื่อแบบกว้างที่เลิกใช้แล้ว ซึ่งรวมถึง `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` และ `fetchRemoteMedia` ที่เลิกใช้แล้ว; ควรใช้ `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` และเส้นทางย่อยรันไทม์ความสามารถแทน และควรใช้ตัวช่วยที่เก็บข้อมูลก่อนอ่านบัฟเฟอร์เมื่อ URL ควรเปลี่ยนเป็นสื่อของ OpenClaw |
    | `plugin-sdk/media-mime` | ตัวช่วยแบบขอบเขตแคบสำหรับการปรับ MIME ให้เป็นมาตรฐาน การแมปนามสกุลไฟล์ การตรวจหา MIME และชนิดสื่อ |
    | `plugin-sdk/media-store` | ตัวช่วยที่เก็บสื่อแบบขอบเขตแคบ เช่น `saveMediaBuffer` และ `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ตัวช่วยที่ใช้ร่วมกันสำหรับการสลับไปใช้ระบบสำรองในการสร้างสื่อ การเลือกตัวเลือก และข้อความเมื่อไม่มีโมเดล |
    | `plugin-sdk/media-understanding` | facade ความเข้ากันได้ที่เลิกใช้แล้วสำหรับชนิดและตัวช่วยของผู้ให้บริการการทำความเข้าใจสื่อ; ผู้ให้บริการใหม่ลงทะเบียนผ่าน API ของ Plugin ที่ฉีดเข้ามา และเก็บตัวช่วยคำขอไว้ภายใต้ความเป็นเจ้าของของ Plugin |
    | `plugin-sdk/text-chunking` | การแบ่งข้อความขาออกและช่วงโดยรักษาออฟเซ็ต การแบ่ง markdown/ตัวช่วยเรนเดอร์ การแยกโทเค็นแท็ก HTML โดยคำนึงถึงเครื่องหมายคำพูด การแปลงตาราง markdown การลบแท็กคำสั่ง และยูทิลิตีข้อความที่ปลอดภัย |
    | `plugin-sdk/speech` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ชนิดผู้ให้บริการเสียงพูด รวมถึงรายการส่งออกคำสั่ง รีจิสทรี การตรวจสอบ ตัวสร้าง TTS ที่เข้ากันได้กับ OpenAI และตัวช่วยเสียงพูดสำหรับผู้ให้บริการ |
    | `plugin-sdk/speech-core` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ชนิดผู้ให้บริการเสียงพูด รีจิสทรี คำสั่ง การปรับให้เป็นมาตรฐาน และรายการส่งออกตัวช่วยเสียงพูดที่ใช้ร่วมกัน |
    | `plugin-sdk/speech-settings` | องค์ประกอบพื้นฐานน้ำหนักเบาสำหรับการแก้ไขและปรับการกำหนดค่า TTS ให้เป็นมาตรฐาน โดยไม่มีรีจิสทรีผู้ให้บริการหรือรันไทม์การสังเคราะห์ |
    | `plugin-sdk/realtime-transcription` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ชนิดผู้ให้บริการการถอดเสียงแบบเรียลไทม์ ตัวช่วยรีจิสทรี และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
    | `plugin-sdk/realtime-bootstrap-context` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ตัวช่วยบูตสแตรปโปรไฟล์แบบเรียลไทม์สำหรับการฉีดบริบท `IDENTITY.md`, `USER.md` และ `SOUL.md` แบบมีขอบเขต |
    | `plugin-sdk/realtime-voice` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ชนิดผู้ให้บริการเสียงแบบเรียลไทม์ ตัวช่วยรีจิสทรี เกตพลังงานเสียง/การเริ่มพูดที่ใช้ร่วมกัน และตัวช่วยพฤติกรรมเสียงแบบเรียลไทม์ รวมถึงชุดทดสอบเซสชันที่ไม่ขึ้นกับการขนส่งและการติดตามกิจกรรมเอาต์พุต |
    | `plugin-sdk/meeting-runtime` | รันไทม์เซสชันการประชุมผ่านเบราว์เซอร์ เอนจิน/การขนส่งเสียงแบบเรียลไทม์ `MeetingPlatformAdapter` การควบคุมเบราว์เซอร์/Node การปรึกษาเอเจนต์ การมอบหมายสายสนทนาด้วยเสียง การตรวจสอบการตั้งค่า และตัวช่วยคำสั่ง SoX |
    | `plugin-sdk/image-generation` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ชนิดผู้ให้บริการสร้างรูปภาพ รวมถึงตัวช่วยแอสเซ็ตรูปภาพ/URL ข้อมูล และตัวสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
    | `plugin-sdk/image-generation-core` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ชนิด การสลับไปใช้ระบบสำรอง การยืนยันตัวตน และตัวช่วยรีจิสทรีสำหรับการสร้างรูปภาพที่ใช้ร่วมกัน |
    | `plugin-sdk/music-generation` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างเพลง |
    | `plugin-sdk/video-generation` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างวิดีโอ |
    | `plugin-sdk/video-generation-core` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ชนิดการสร้างวิดีโอ ตัวช่วยการสลับไปใช้ระบบสำรอง การค้นหาผู้ให้บริการ และการแยกวิเคราะห์การอ้างอิงโมเดลที่ใช้ร่วมกัน |
    | `plugin-sdk/transcripts` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ชนิดผู้ให้บริการแหล่งที่มาของข้อความถอดเสียง ตัวช่วยรีจิสทรี ตัวอธิบายเซสชัน และเมทาดาทาคำพูดที่ใช้ร่วมกัน |
    | `plugin-sdk/webhook-targets` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; รีจิสทรีเป้าหมาย Webhook และตัวช่วยติดตั้งเส้นทาง |
    | `plugin-sdk/web-media` | ตัวช่วยโหลดสื่อระยะไกล/ภายในเครื่องที่ใช้ร่วมกัน |
    | `plugin-sdk/zod` | การส่งออกซ้ำเพื่อความเข้ากันได้ที่เลิกใช้แล้ว; ให้นำเข้า `zod` จาก `zod` โดยตรง |
    | `plugin-sdk/plugin-test-api` | ตัวช่วย `createTestPluginApi` ขั้นต่ำภายใน repo สำหรับการทดสอบหน่วยการลงทะเบียน Plugin โดยตรง โดยไม่นำเข้าบริดจ์ตัวช่วยทดสอบของ repo |
    | `plugin-sdk/agent-runtime-test-contracts` | ฟิกซ์เจอร์สัญญาอะแดปเตอร์รันไทม์เอเจนต์เนทีฟภายใน repo สำหรับการทดสอบการยืนยันตัวตน การส่งมอบ การสำรอง ฮุกเครื่องมือ โอเวอร์เลย์พรอมต์ สคีมา และการฉายภาพข้อความถอดเสียง |
    | `plugin-sdk/channel-test-helpers` | ตัวช่วยทดสอบที่เน้นช่องทางภายใน repo สำหรับสัญญาการดำเนินการ/การตั้งค่า/สถานะทั่วไป การตรวจสอบไดเรกทอรี วงจรชีวิตการเริ่มต้นบัญชี การส่งต่อการกำหนดค่าการส่ง ม็อกของรันไทม์ ปัญหาสถานะ การส่งมอบขาออก และการลงทะเบียนฮุก |
    | `plugin-sdk/channel-target-testing` | ชุดกรณีข้อผิดพลาดการแก้ไขเป้าหมายที่ใช้ร่วมกันภายใน repo สำหรับการทดสอบช่องทาง |
    | `plugin-sdk/channel-contract-testing` | ตัวช่วยทดสอบสัญญาช่องทางแบบขอบเขตแคบภายใน repo โดยไม่ใช้ barrel การทดสอบแบบกว้าง |
    | `plugin-sdk/plugin-test-contracts` | ตัวช่วยสัญญาภายใน repo สำหรับแพ็กเกจ Plugin การลงทะเบียน อาร์ติแฟกต์สาธารณะ การนำเข้าโดยตรง API รันไทม์ และผลข้างเคียงจากการนำเข้า |
    | `plugin-sdk/plugin-state-test-runtime` | ตัวช่วยทดสอบที่เก็บสถานะ Plugin คิวขาเข้า และฐานข้อมูลสถานะภายใน repo |
    | `plugin-sdk/provider-test-contracts` | ตัวช่วยสัญญาภายใน repo สำหรับรันไทม์ผู้ให้บริการ การยืนยันตัวตน การค้นพบ การเริ่มต้นใช้งาน แค็ตตาล็อก วิซาร์ด ความสามารถด้านสื่อ นโยบายการเล่นซ้ำ STT แบบเรียลไทม์จากเสียงสด การค้นหา/ดึงข้อมูลเว็บ และสตรีม |
    | `plugin-sdk/provider-http-test-mocks` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ม็อก HTTP/การยืนยันตัวตนของ Vitest แบบเลือกใช้ภายใน repo สำหรับการทดสอบผู้ให้บริการที่ใช้งาน `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | ตัวช่วยภายใน repo สำหรับแนบเมทาดาทาเข้ากับฟิกซ์เจอร์เพย์โหลดการตอบกลับ |
    | `plugin-sdk/sqlite-runtime-testing` | ตัวช่วยวงจรชีวิต SQLite ภายใน repo สำหรับการทดสอบของบุคคลที่หนึ่ง |
    | `plugin-sdk/test-fixtures` | ฟิกซ์เจอร์ภายใน repo สำหรับการจับรันไทม์ CLI ทั่วไป บริบทแซนด์บ็อกซ์ ตัวเขียนสกิล ข้อความเอเจนต์ เหตุการณ์ระบบ การโหลดโมดูลซ้ำ เส้นทาง Plugin แบบรวม ข้อความเทอร์มินัล การแบ่งส่วน โทเค็นการยืนยันตัวตน และกรณีแบบมีชนิด |
    | `plugin-sdk/test-node-mocks` | ตัวช่วยม็อก Node builtin แบบเจาะจงภายใน repo สำหรับใช้ภายในแฟกทอรี `vi.mock("node:*")` ของ Vitest |
  </Accordion>

  <Accordion title="เส้นทางย่อยหน่วยความจำ">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/memory-core-host-embedding-registry` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ตัวช่วยรีจิสทรีผู้ให้บริการ embedding หน่วยความจำน้ำหนักเบา |
    | `plugin-sdk/memory-core-host-engine-foundation` | รายการส่งออกเอนจินพื้นฐานของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; สัญญา embedding ของโฮสต์หน่วยความจำ การเข้าถึงรีจิสทรี ผู้ให้บริการภายในเครื่อง และตัวช่วยแบบแบตช์/ระยะไกลทั่วไป `registerMemoryEmbeddingProvider` บนพื้นผิวนี้เลิกใช้แล้ว; ใช้ API ผู้ให้บริการ embedding ทั่วไปสำหรับผู้ให้บริการใหม่ |
    | `plugin-sdk/memory-core-host-engine-qmd` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; รายการส่งออกเอนจิน QMD ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-storage` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; รายการส่งออกเอนจินพื้นที่จัดเก็บของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-secret` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ตัวช่วยข้อมูลลับของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-status` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ตัวช่วยสถานะของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-cli` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ตัวช่วยรันไทม์ CLI ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-core` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ตัวช่วยรันไทม์แกนหลักของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-files` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-core` | facade ความเข้ากันได้ที่เลิกใช้แล้วสำหรับตัวช่วยโฮสต์หน่วยความจำที่เป็นกลางต่อผู้จำหน่าย Plugin หน่วยความจำใหม่ใช้ความสามารถด้านหน่วยความจำที่ฉีดเข้ามาและพรอมต์ที่โฮสต์เตรียมไว้; Plugin คู่หูยังคงใช้ facade ที่เก็บไว้สำหรับการค้นหาอาร์ติแฟกต์สาธารณะ จนกว่าจะมีช่องทางการอ่านแบบเจาะจง |
    | `plugin-sdk/memory-host-events` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; นามแฝงที่เป็นกลางต่อผู้จำหน่ายสำหรับตัวช่วยบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-markdown` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ตัวช่วย markdown ที่มีการจัดการและใช้ร่วมกันสำหรับ Plugin ที่เกี่ยวข้องกับหน่วยความจำ |
    | `plugin-sdk/memory-host-search` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; facade รันไทม์ Active Memory สำหรับการเข้าถึงตัวจัดการการค้นหา |
  </Accordion>

  <Accordion title="เส้นทางย่อยของตัวช่วยแบบรวมที่สงวนไว้">
    เส้นทางย่อย SDK ของตัวช่วยแบบรวมที่สงวนไว้เป็นพื้นผิวเฉพาะเจ้าของที่มีขอบเขตแคบสำหรับ
    โค้ด Plugin แบบรวม โดยมีการติดตามในรายการ SDK เพื่อให้การสร้างแพ็กเกจ
    และการกำหนดนามแฝงคงความแน่นอน แต่ไม่ใช่ API ทั่วไปสำหรับ
    การสร้าง Plugin สัญญาโฮสต์ใหม่ที่ใช้ซ้ำได้ควรใช้เส้นทางย่อย SDK ทั่วไป
    เช่น `plugin-sdk/gateway-runtime` และ `plugin-sdk/ssrf-runtime`

    | เส้นทางย่อย | เจ้าของและวัตถุประสงค์ |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | เป็นแบบส่วนตัวภายในหลังเดือนกรกฎาคม 2026; ตัวช่วย Plugin Codex แบบรวมสำหรับฉายการกำหนดค่าเซิร์ฟเวอร์ MCP ของผู้ใช้ไปยังการกำหนดค่าเธรดเซิร์ฟเวอร์แอป Codex (การส่งออกแพ็กเกจที่สงวนไว้) |
    | `plugin-sdk/codex-native-task-runtime` | ตัวช่วย Plugin Codex แบบรวมสำหรับมิเรอร์เอเจนต์ย่อยเนทีฟของเซิร์ฟเวอร์แอป Codex ไปยังสถานะงานของ OpenClaw (ภายใน repo เท่านั้น ไม่ใช่การส่งออกแพ็กเกจ) |

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวม SDK ของ Plugin](/th/plugins/sdk-overview)
- [การตั้งค่า SDK ของ Plugin](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
