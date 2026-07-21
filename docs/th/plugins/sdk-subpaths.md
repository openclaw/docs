---
read_when:
    - การเลือกพาธย่อย plugin-sdk ที่เหมาะสมสำหรับการนำเข้า Plugin
    - การตรวจสอบพาธย่อยของ Plugin ที่รวมมาให้และส่วนติดต่อของตัวช่วย
summary: 'แค็ตตาล็อกพาธย่อยของ Plugin SDK: การนำเข้าแต่ละรายการอยู่ที่ใด โดยจัดกลุ่มตามส่วนงาน'
title: พาธย่อยของ Plugin SDK
x-i18n:
    generated_at: "2026-07-21T15:21:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4b39919e7e12be394ed8f384dcd99bec5ce801e32d9de2ed1e9add7c2d644932
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK ของ Plugin มีพาธย่อยสาธารณะที่จำกัดขอบเขตและตัวช่วยแบบรวมชุดที่ใช้เฉพาะในรีโพซิทอรี
ภายใต้ `openclaw/plugin-sdk/` หน้านี้จัดทำรายการทั้งสองประเภทและระบุ
รายการ private-local อย่างชัดเจน มีไฟล์สามไฟล์ที่กำหนดขอบเขตนี้:

- `scripts/lib/plugin-sdk-entrypoints.json`: รายการจุดเข้าที่ได้รับการดูแล
  ซึ่งบิลด์จะคอมไพล์
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: พาธย่อยภายใน
  ที่ไม่รวมอยู่ใน SDK แบบมีชนิดและมีเอกสารประกอบ รายการสำหรับการใช้งานจริงยังคงพร้อมใช้
  ในรูปแบบเอ็กซ์พอร์ตของรันไทม์โฮสต์ที่เป็น JavaScript เท่านั้น สำหรับ Plugin ทางการ
  ที่เผยแพร่แยกต่างหาก ส่วนรายการสำหรับการทดสอบเท่านั้นจะยังคงไม่ถูกเอ็กซ์พอร์ต
- `src/plugin-sdk/entrypoints.ts`: เมทาดาทาการจัดประเภทสำหรับพาธย่อย
  ที่เลิกใช้แล้ว ตัวช่วยแบบรวมชุดที่สงวนไว้ facade แบบรวมชุดที่รองรับ และ
  พื้นผิวสาธารณะที่ Plugin เป็นเจ้าของ

ผู้ดูแลตรวจสอบจำนวนเอ็กซ์พอร์ตสาธารณะด้วย `pnpm plugin-sdk:surface` และ
พาธย่อยของตัวช่วยที่สงวนไว้ซึ่งยังใช้งานอยู่ด้วย `pnpm plugins:boundary-report:summary`;
เอ็กซ์พอร์ตตัวช่วยที่สงวนไว้แต่ไม่ได้ใช้จะทำให้รายงาน CI ล้มเหลว แทนที่จะคงอยู่ใน
SDK สาธารณะในฐานะภาระความเข้ากันได้ที่ไม่ได้ใช้งาน

สำหรับคู่มือการสร้าง Plugin โปรดดู [ภาพรวม SDK ของ Plugin](/th/plugins/sdk-overview)

## จุดเข้าของ Plugin

| พาธย่อย                        | เอ็กซ์พอร์ตหลัก                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | เป็น private-local หลังเดือนกรกฎาคม 2026; `defineSingleProviderPluginEntry`                                                                                                                                        |
| `plugin-sdk/migration`         | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยรายการผู้ให้บริการการย้ายข้อมูล เช่น `createMigrationItem`, ค่าคงที่เหตุผล เครื่องหมายสถานะรายการ ตัวช่วยปกปิดข้อมูล และ `summarizeMigrationItems`                   |
| `plugin-sdk/migration-runtime` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยการย้ายข้อมูลรันไทม์ เช่น `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` และ `writeMigrationReport`              |
| `plugin-sdk/health`            | การลงทะเบียน การตรวจหา การซ่อมแซม การเลือก ระดับความรุนแรง และชนิดผลการตรวจของการตรวจสุขภาพ Doctor สำหรับผู้ใช้ข้อมูลสุขภาพแบบรวมชุด                                                                                |

### ตัวช่วยความเข้ากันได้และ private-local

เฉพาะพาธย่อยที่เลิกใช้แล้วในช่วงหลังเท่านั้นที่ยังคงถูกเอ็กซ์พอร์ต นามแฝงและ
พาธย่อยที่ไม่ได้ใช้ของเดือนกรกฎาคม 2026 ถูกลบแล้ว ขณะที่ตัวช่วยสำหรับแบบรวมชุดเท่านั้นถูกนำออกจาก
แพ็กเกจสาธารณะและระบุเป็น private-local ด้านล่าง รายการที่ได้รับการดูแลคือ
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI ปฏิเสธแบบรวมชุด
`plugin-sdk/text-runtime` มีไว้เพื่อความเข้ากันได้เท่านั้น และ `plugin-sdk/zod` เป็น
การ re-export เพื่อความเข้ากันได้: ให้นำเข้า `zod` โดยตรงจาก `zod` barrel ของโดเมนแบบกว้าง
`plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` และ
`plugin-sdk/security-runtime` ก็เลิกใช้แล้วเช่นกัน โดยให้ใช้พาธย่อยที่จำกัดขอบเขตแทน

พาธย่อยตัวช่วยทดสอบของ OpenClaw ที่ใช้ Vitest เป็นแบบใช้เฉพาะในรีโพซิทอรีและ
ไม่ใช่เอ็กซ์พอร์ตของแพ็กเกจอีกต่อไป: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-live`, `test-live-auth`, `test-media-generation`,
`test-media-understanding`, `test-node-mocks` และ `testing` พื้นผิวตัวช่วยแบบรวมชุดที่เป็นส่วนตัว
`ssrf-runtime-internal` และ `codex-native-task-runtime` ก็ใช้เฉพาะในรีโพซิทอรี
เช่นกัน

### พาธย่อยตัวช่วยของ Plugin แบบรวมชุด

โมดูลตัวช่วยสำหรับแบบรวมชุดเท่านั้นเป็น private-local หลังการกวาดล้างในเดือนกรกฎาคม 2026 การนำเข้าข้ามเจ้าของถูกบล็อกโดยกลไกป้องกันตามสัญญาของแพ็กเกจ `src/plugin-sdk/entrypoints.ts` ติดตาม facade แบบรวมชุดที่รองรับและยังคงเป็นสาธารณะแยกต่างหาก ซึ่งเป็นจุดเข้า SDK
ที่ได้รับการรองรับโดย Plugin แบบรวมชุดของตน จนกว่าสัญญาทั่วไปจะมาแทนที่
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
เลิกใช้แล้วสำหรับโค้ดใหม่ โปรดดูหมายเหตุของแต่ละแถวด้านล่าง

<AccordionGroup>
  <Accordion title="พาธย่อยของช่องทาง">
    | พาธย่อย | เอ็กซ์พอร์ตหลัก |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยตรวจสอบความถูกต้องของ JSON Schema แบบแคชสำหรับสคีมาที่ Plugin เป็นเจ้าของ |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` รวมถึง `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | ตัวช่วยวิซาร์ดการตั้งค่าที่ใช้ร่วมกัน ตัวแปลการตั้งค่า พรอมต์รายการที่อนุญาต ตัวสร้างสถานะการตั้งค่า |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | ตัวช่วยการกำหนดค่าแบบหลายบัญชี/เกตการดำเนินการ ตัวช่วย fallback ไปยังบัญชีเริ่มต้น |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, ตัวช่วยทำให้รหัสบัญชีเป็นรูปแบบมาตรฐาน |
    | `plugin-sdk/account-resolution` | ตัวช่วยค้นหาบัญชีและ fallback ไปยังค่าเริ่มต้น |
    | `plugin-sdk/account-helpers` | ตัวช่วยรายการบัญชี/การดำเนินการกับบัญชีที่จำกัดขอบเขต |
    | `plugin-sdk/access-groups` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยแยกวิเคราะห์รายการกลุ่มการเข้าถึงที่อนุญาตและการวินิจฉัยกลุ่มแบบปกปิดข้อมูล |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | facade ความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | องค์ประกอบพื้นฐานของสคีมาการกำหนดค่าช่องทางที่ใช้ร่วมกัน รวมถึง Zod และตัวสร้าง JSON/TypeBox โดยตรง |
    | `plugin-sdk/bundled-channel-config-schema` | เป็น private-local หลังเดือนกรกฎาคม 2026; สคีมาการกำหนดค่าช่องทาง OpenClaw แบบรวมชุดสำหรับ Plugin แบบรวมชุดที่ได้รับการดูแลเท่านั้น |
    | `plugin-sdk/chat-channel-ids` | เป็น private-local หลังเดือนกรกฎาคม 2026; `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId` รหัสช่องทางแชตแบบรวมชุด/ทางการที่เป็นรูปแบบมาตรฐาน รวมถึงป้ายกำกับ/นามแฝงของตัวจัดรูปแบบสำหรับ Plugin ที่ต้องรู้จักข้อความซึ่งมีคำนำหน้าเอนเวโลปโดยไม่ต้องฮาร์ดโค้ดตารางของตนเอง |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | ตัวแก้ไขรันไทม์ขาเข้าของช่องทางระดับสูงแบบทดลอง ตัวแก้ไขนโยบายการกล่าวถึงโดยนัย และตัวสร้างข้อเท็จจริงเส้นทางสำหรับพาธรับข้อมูลของช่องทางที่ย้ายแล้ว ควรใช้สิ่งนี้แทนการประกอบรายการที่อนุญาตที่มีผล รายการคำสั่งที่อนุญาต และการฉายภาพแบบเดิมในแต่ละ Plugin โปรดดู [API ขาเข้าของช่องทาง](/th/plugins/sdk-channel-ingress) |
    | `plugin-sdk/channel-lifecycle` | facade ความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-outbound` | สัญญาวงจรชีวิตของข้อความ รวมถึงตัวเลือกไปป์ไลน์การตอบกลับ ใบตอบรับ การแสดงตัวอย่างสด/การสตรีม ตัวช่วยวงจรชีวิต ข้อมูลระบุตัวตนขาออก การวางแผนเพย์โหลด การส่งแบบคงทน และตัวช่วยบริบทการส่งข้อความ โปรดดู [API ขาออกของช่องทาง](/th/plugins/sdk-channel-outbound) |
    | `plugin-sdk/channel-message` | นามแฝงความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/inbound-envelope` | ตัวช่วยเส้นทางขาเข้าและตัวสร้างเอนเวโลปที่ใช้ร่วมกัน |
    | `plugin-sdk/inbound-reply-dispatch` | facade ความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-inbound` สำหรับตัวรันขาเข้าและเพรดิเคตการส่งต่อ และใช้ `plugin-sdk/channel-outbound` สำหรับตัวช่วยส่งข้อความ |
    | `plugin-sdk/messaging-targets` | นามแฝงการแยกวิเคราะห์เป้าหมายที่เลิกใช้แล้ว; ใช้ `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยโหลดสื่อขาออกและสถานะสื่อที่โฮสต์ซึ่งใช้ร่วมกัน |
    | `plugin-sdk/poll-runtime` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยทำให้โพลเป็นรูปแบบมาตรฐานที่จำกัดขอบเขต |
    | `plugin-sdk/thread-bindings-runtime` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยวงจรชีวิตและอะแดปเตอร์สำหรับการผูกเธรด |
    | `plugin-sdk/agent-media-payload` | facade ความเข้ากันได้ที่เลิกใช้แล้วสำหรับรูทและตัวโหลดเพย์โหลดสื่อของเอเจนต์ Plugin ช่องทางใหม่ใช้การวางแผนเพย์โหลดขาออกแบบมีชนิดจาก `plugin-sdk/channel-outbound`; การโหลดสื่อภายในเครื่องที่ผู้ดำเนินการระบุยังคงใช้ facade ที่เก็บไว้ จนกว่าจะมี seam สาธารณะสำหรับรูทภายในเครื่องที่จำกัดขอบเขต |
    | `plugin-sdk/conversation-runtime` | barrel แบบกว้างที่เลิกใช้แล้วสำหรับการผูกการสนทนา/เธรด การจับคู่ และตัวช่วยการผูกที่กำหนดค่าไว้; ควรใช้พาธย่อยการผูกที่จำกัดขอบเขต เช่น `plugin-sdk/thread-bindings-runtime` และ `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | ตัวช่วยแก้ไขนโยบายกลุ่มของรันไทม์ |
    | `plugin-sdk/channel-status` | ตัวช่วยสแนปช็อต/สรุปสถานะช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/channel-config-primitives` | องค์ประกอบพื้นฐานของสคีมาการกำหนดค่าช่องทางที่จำกัดขอบเขต |
    | `plugin-sdk/channel-config-writes` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยการอนุญาตให้เขียนการกำหนดค่าช่องทาง |
    | `plugin-sdk/channel-plugin-common` | เอ็กซ์พอร์ตส่วนเตรียมของ Plugin ช่องทางที่ใช้ร่วมกัน |
    | `plugin-sdk/allowlist-config-edit` | ตัวช่วยแก้ไข/อ่านการกำหนดค่ารายการที่อนุญาต |
    | `plugin-sdk/group-access` | ตัวช่วยตัดสินใจการเข้าถึงกลุ่มที่เลิกใช้แล้ว; ใช้ `resolveChannelMessageIngress` จาก `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm-guard-policy` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยนโยบายป้องกันก่อนการเข้ารหัสสำหรับ DM โดยตรงที่จำกัดขอบเขต |
    | `plugin-sdk/discord` | facade ความเข้ากันได้ของ Discord ที่เลิกใช้แล้วสำหรับ `@openclaw/discord@2026.3.13` ที่เผยแพร่และความเข้ากันได้ของเจ้าของที่ติดตามไว้; Plugin ใหม่ควรใช้พาธย่อย SDK ของช่องทางทั่วไป |
    | `plugin-sdk/telegram-account` | facade ความเข้ากันได้ในการแก้ไขบัญชี Telegram ที่เลิกใช้แล้วสำหรับความเข้ากันได้ของเจ้าของที่ติดตามไว้; Plugin ใหม่ควรใช้ตัวช่วยรันไทม์ที่ฉีดเข้ามาหรือพาธย่อย SDK ของช่องทางทั่วไป |
    | `plugin-sdk/interactive-runtime` | ตัวช่วยการนำเสนอ การส่ง และการตอบกลับแบบโต้ตอบรุ่นเดิมของข้อความเชิงความหมาย โปรดดู [การนำเสนอข้อความ](/th/plugins/message-presentation) |
    | `plugin-sdk/question-gateway-runtime` | แก้ไขตัวเลือก `ask_user` ที่สร้างโดยรันไทม์ผ่าน Gateway จากตัวจัดการการโต้ตอบของช่องทาง |
    | `plugin-sdk/channel-inbound` | ตัวช่วยขาเข้าที่ใช้ร่วมกันสำหรับการจัดประเภทเหตุการณ์ การสร้างบริบท การจัดรูปแบบ รูท การหน่วง การจับคู่การกล่าวถึง นโยบายการกล่าวถึง และการบันทึกขาเข้า |
    | `plugin-sdk/channel-inbound-debounce` | ตัวช่วยหน่วงขาเข้าที่จำกัดขอบเขต |
    | `plugin-sdk/channel-mention-gating` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยนโยบายการกล่าวถึง เครื่องหมายการกล่าวถึง และข้อความการกล่าวถึงที่จำกัดขอบเขต โดยไม่มีพื้นผิวรันไทม์ขาเข้าแบบกว้าง |
    | `plugin-sdk/channel-streaming` | facade ความเข้ากันได้ที่เลิกใช้แล้ว ใช้ `plugin-sdk/channel-outbound` |
    | `plugin-sdk/channel-send-result` | ชนิดผลลัพธ์การตอบกลับ |
    | `plugin-sdk/channel-actions` | ตัวช่วยการดำเนินการกับข้อความของช่องทาง รวมถึงตัวช่วยสคีมาแบบเนทีฟที่เลิกใช้แล้วแต่ยังคงไว้เพื่อความเข้ากันได้ของ Plugin |
    | `plugin-sdk/channel-route` | เป็น private-local หลังเดือนกรกฎาคม 2026; การทำให้เส้นทางเป็นรูปแบบมาตรฐาน ตัวแก้ไขเป้าหมายที่ขับเคลื่อนด้วยตัวแยกวิเคราะห์ การแปลงรหัสเธรดเป็นสตริง คีย์เส้นทางสำหรับการขจัดข้อมูลซ้ำ/แบบกระชับ ชนิดเป้าหมายที่แยกวิเคราะห์แล้ว และตัวช่วยเปรียบเทียบเส้นทาง/เป้าหมายที่ใช้ร่วมกัน |
    | `plugin-sdk/channel-targets` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยแยกวิเคราะห์เป้าหมาย; ผู้เรียกใช้การเปรียบเทียบเส้นทางควรใช้ `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | ชนิดสัญญาของช่องทาง |
    | `plugin-sdk/channel-feedback` | การเชื่อมต่อข้อเสนอแนะ/ปฏิกิริยา |
  </Accordion>

พาธย่อยความเข้ากันได้ของช่องทางในช่วงหลังยังคงเป็นสาธารณะเฉพาะจนถึง
วันที่ในรีจิสทรีเท่านั้น นามแฝงของเดือนกรกฎาคม เช่น การเข้าถึง DM โดยตรง ตัวเลือกการตอบกลับ พาธการจับคู่
และส่วนแยกรันไทม์ของช่องทางถูกลบแล้ว; ตัวช่วยสำหรับแบบรวมชุดเท่านั้น
เป็น private-local.

  <Accordion title="พาธย่อยของผู้ให้บริการ">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/provider-entry` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยตั้งค่าผู้ให้บริการแบบภายใน/โฮสต์เองที่คัดสรรแล้ว |
    | `plugin-sdk/cli-backend` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ค่าเริ่มต้นแบ็กเอนด์ CLI + ค่าคงที่ watchdog |
    | `plugin-sdk/provider-auth-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยรันไทม์การยืนยันตัวตนของผู้ให้บริการ: โฟลว์ OAuth แบบ loopback, การแลกเปลี่ยนโทเค็น, การเก็บการยืนยันตัวตน และการหา API key |
    | `plugin-sdk/provider-oauth-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ชนิดคอลแบ็ก OAuth ทั่วไปของผู้ให้บริการ, การเรนเดอร์หน้าคอลแบ็ก, ตัวช่วย PKCE/state, การแยกวิเคราะห์อินพุตการอนุญาต, ตัวช่วยการหมดอายุของโทเค็น และตัวช่วยยกเลิก |
    | `plugin-sdk/provider-auth-api-key` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยเริ่มต้นใช้งาน API key/เขียนโปรไฟล์ เช่น `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวสร้างผลลัพธ์การยืนยันตัวตน OAuth มาตรฐาน |
    | `plugin-sdk/provider-env-vars` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยค้นหาตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตนของผู้ให้บริการ |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, ตัวช่วยนำเข้าการยืนยันตัวตน OpenAI Codex, การส่งออกเพื่อความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว |
    | `plugin-sdk/provider-model-shared` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `selectPreferredLocalModelId`, `normalizeModelCompat`, ตัวสร้างนโยบาย replay ที่ใช้ร่วมกัน, ตัวช่วยเอนด์พอยต์ของผู้ให้บริการ และตัวช่วยปรับ model ID ให้เป็นมาตรฐานที่ใช้ร่วมกัน |
    | `plugin-sdk/provider-catalog-live-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยแค็ตตาล็อกโมเดลสดของผู้ให้บริการสำหรับการค้นหาแบบมีการป้องกันในลักษณะ `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, การกรอง model ID, แคช TTL และ fallback แบบคงที่ |
    | `plugin-sdk/provider-catalog-runtime` | ฮุกเสริมแค็ตตาล็อกผู้ให้บริการในรันไทม์และจุดเชื่อมต่อรีจิสทรีผู้ให้บริการของ Plugin สำหรับการทดสอบสัญญา |
    | `plugin-sdk/provider-catalog-shared` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยความสามารถ HTTP/เอนด์พอยต์ทั่วไปของผู้ให้บริการ, ข้อผิดพลาด HTTP ของผู้ให้บริการ และตัวช่วยฟอร์ม multipart สำหรับการถอดเสียง |
    | `plugin-sdk/provider-web-fetch-contract` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยสัญญาการกำหนดค่า/การเลือกสำหรับ web-fetch แบบขอบเขตแคบ เช่น `enablePluginInConfig` และ `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยลงทะเบียน/แคชผู้ให้บริการ web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยการกำหนดค่า/ข้อมูลประจำตัวสำหรับ web-search แบบขอบเขตแคบ สำหรับผู้ให้บริการที่ไม่ต้องเชื่อมโยงการเปิดใช้ Plugin |
    | `plugin-sdk/provider-web-search-contract` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยสัญญาการกำหนดค่า/ข้อมูลประจำตัวสำหรับ web-search แบบขอบเขตแคบ เช่น `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` และตัวตั้งค่า/ตัวอ่านข้อมูลประจำตัวตามขอบเขต |
    | `plugin-sdk/provider-web-search` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยลงทะเบียน/แคช/รันไทม์ของผู้ให้บริการ web-search |
    | `plugin-sdk/embedding-providers` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ชนิดผู้ให้บริการ embedding ทั่วไปและตัวช่วยอ่าน รวมถึง `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` และ `listEmbeddingProviders(...)`; Plugin ลงทะเบียนผู้ให้บริการผ่าน `api.registerEmbeddingProvider(...)` เพื่อบังคับใช้ความเป็นเจ้าของ manifest |
    | `plugin-sdk/provider-tools` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` และการล้างสคีมา + การวินิจฉัยสำหรับ DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ชนิดสแนปช็อตการใช้งานของผู้ให้บริการ, ตัวช่วยดึงข้อมูลการใช้งานที่ใช้ร่วมกัน และตัวดึงข้อมูลของผู้ให้บริการ เช่น `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, ชนิด wrapper ของสตรีม, ความเข้ากันได้กับการเรียกเครื่องมือแบบข้อความล้วน และตัวช่วย wrapper ที่ใช้ร่วมกันสำหรับ Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วย wrapper ของสตรีมผู้ให้บริการแบบสาธารณะที่ใช้ร่วมกัน รวมถึง `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` และยูทิลิตีสตรีมที่เข้ากันได้กับ Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยการรับส่งข้อมูลแบบเนทีฟของผู้ให้บริการ เช่น การดึงข้อมูลแบบมีการป้องกัน, การแยกข้อความผลลัพธ์จากเครื่องมือ, การแปลงข้อความสำหรับการรับส่งข้อมูล และสตรีมเหตุการณ์การรับส่งข้อมูลแบบเขียนได้ |
    | `plugin-sdk/provider-onboard` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยแพตช์การกำหนดค่าสำหรับการเริ่มต้นใช้งาน |
    | `plugin-sdk/global-singleton` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วย singleton/map/cache ภายในโปรเซส |
    | `plugin-sdk/group-activation` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยโหมดเปิดใช้งานกลุ่มและการแยกวิเคราะห์คำสั่งแบบขอบเขตแคบ |
  </Accordion>

โดยปกติสแนปช็อตการใช้งานของผู้ให้บริการจะรายงานโควตา `windows` อย่างน้อยหนึ่งรายการ โดยแต่ละรายการมี
ป้ายกำกับ เปอร์เซ็นต์ที่ใช้ไป และเวลารีเซ็ตซึ่งระบุหรือไม่ก็ได้ ผู้ให้บริการที่เปิดเผยยอดคงเหลือหรือ
ข้อความสถานะบัญชีแทนช่วงโควตาที่รีเซ็ตได้ ควรคืนค่า
`summary` พร้อมอาร์เรย์ `windows` ว่าง แทนการสร้างเปอร์เซ็นต์ขึ้นมาเอง
OpenClaw แสดงข้อความสรุปนั้นในเอาต์พุตสถานะ; ใช้ `error` เฉพาะเมื่อ
เอนด์พอยต์การใช้งานล้มเหลวหรือไม่ส่งคืนข้อมูลการใช้งานที่ใช้ได้

  <Accordion title="พาธย่อยด้านการยืนยันตัวตนและความปลอดภัย">
    | พาธย่อย | การส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/command-auth` | พื้นผิวการอนุญาตคำสั่งแบบกว้างที่เลิกใช้แล้ว (`resolveControlCommandGate`, ตัวช่วยรีจิสทรีคำสั่ง รวมถึงการจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก, ตัวช่วยการอนุญาตผู้ส่ง); ให้ใช้การอนุญาตที่จุดรับเข้า/รันไทม์ของช่องทางหรือตัวช่วยสถานะคำสั่ง |
    | `plugin-sdk/command-status` | ตัวสร้างข้อความคำสั่ง/ความช่วยเหลือ เช่น `buildCommandsMessagePaginated` และ `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | ตัวช่วยหาผู้อนุมัติและยืนยันสิทธิ์การดำเนินการภายในแชตเดียวกัน |
    | `plugin-sdk/approval-client-runtime` | ตัวช่วยโปรไฟล์/ตัวกรองการอนุมัติ exec แบบเนทีฟ |
    | `plugin-sdk/approval-delivery-runtime` | อะแดปเตอร์ความสามารถ/การนำส่งการอนุมัติแบบเนทีฟ |
    | `plugin-sdk/approval-gateway-runtime` | ตัวหาค่า Gateway สำหรับการอนุมัติที่ใช้ร่วมกัน |
    | `plugin-sdk/approval-reference-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยระบุตำแหน่งแบบถาวรและกำหนดผลลัพธ์ได้แน่นอนสำหรับคอลแบ็กการอนุมัติที่ถูกจำกัดโดยการรับส่งข้อมูล |
    | `plugin-sdk/approval-handler-adapter-runtime` | ตัวช่วยโหลดอะแดปเตอร์การอนุมัติแบบเนทีฟขนาดเบาสำหรับจุดเข้าของช่องทางที่ใช้งานบ่อย |
    | `plugin-sdk/approval-handler-runtime` | ตัวช่วยรันไทม์ของตัวจัดการการอนุมัติแบบกว้างกว่า; ควรใช้จุดเชื่อมต่ออะแดปเตอร์/Gateway ที่แคบกว่าเมื่อเพียงพอ |
    | `plugin-sdk/approval-native-runtime` | ตัวช่วยเป้าหมายการอนุมัติแบบเนทีฟ, การผูกบัญชี, เกตเส้นทาง, fallback การส่งต่อ และการระงับพรอมต์ exec แบบเนทีฟภายใน |
    | `plugin-sdk/approval-reaction-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; การผูกรีแอ็กชันการอนุมัติแบบฮาร์ดโค้ด, เพย์โหลดพรอมต์รีแอ็กชัน, ที่เก็บเป้าหมายรีแอ็กชัน, ตัวช่วยข้อความคำใบ้รีแอ็กชัน และการส่งออกเพื่อความเข้ากันได้สำหรับการระงับพรอมต์ exec แบบเนทีฟภายใน |
    | `plugin-sdk/approval-reply-runtime` | ตัวช่วยเพย์โหลดการตอบกลับการอนุมัติ exec/Plugin |
    | `plugin-sdk/approval-runtime` | ตัวช่วยเพย์โหลดการอนุมัติ exec/Plugin, ตัวสร้างความสามารถการอนุมัติ, ตัวช่วยการยืนยันตัวตน/โปรไฟล์สำหรับการอนุมัติ, ตัวช่วยการกำหนดเส้นทาง/รันไทม์การอนุมัติแบบเนทีฟ และตัวช่วยแสดงการอนุมัติแบบมีโครงสร้าง เช่น `formatApprovalDisplayPath` |
    | `plugin-sdk/command-auth-native` | การยืนยันสิทธิ์คำสั่งแบบเนทีฟ, การจัดรูปแบบเมนูอาร์กิวเมนต์แบบไดนามิก และตัวช่วยเป้าหมายเซสชันแบบเนทีฟ |
    | `plugin-sdk/command-detection` | ตัวช่วยตรวจจับคำสั่งที่ใช้ร่วมกัน |
    | `plugin-sdk/command-primitives-runtime` | เพรดิเคตข้อความคำสั่งขนาดเบาสำหรับพาธช่องทางที่ใช้งานบ่อย |
    | `plugin-sdk/command-surface` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; การปรับเนื้อหาคำสั่งให้เป็นมาตรฐานและตัวช่วยพื้นผิวคำสั่ง |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยโฟลว์เข้าสู่ระบบการยืนยันตัวตนของผู้ให้บริการแบบโหลดเมื่อใช้ สำหรับการจับคู่ด้วยรหัสอุปกรณ์ในช่องทางส่วนตัวและ Web UI |
    | `plugin-sdk/channel-secret-runtime` | พื้นผิวสัญญาข้อมูลลับแบบกว้างที่เลิกใช้แล้ว (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, ชนิดเป้าหมายข้อมูลลับ); ควรใช้พาธย่อยเฉพาะด้านล่าง |
    | `plugin-sdk/channel-secret-basic-runtime` | การส่งออกสัญญาข้อมูลลับแบบขอบเขตแคบและตัวสร้างรีจิสทรีเป้าหมายสำหรับพื้นผิวข้อมูลลับของช่องทาง/Plugin ที่ไม่ใช่ TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยกำหนดข้อมูลลับ TTS ของช่องทางที่ซ้อนกันแบบขอบเขตแคบ |
    | `plugin-sdk/secret-ref-runtime` | การกำหนดชนิด การแก้ค่า และการค้นหาพาธเป้าหมายแผนของ SecretRef แบบขอบเขตแคบ สำหรับการแยกวิเคราะห์สัญญาข้อมูลลับ/การกำหนดค่า |
    | `plugin-sdk/security-runtime` | barrel แบบกว้างที่เลิกใช้แล้วสำหรับความเชื่อถือ, การควบคุม DM, ตัวช่วยไฟล์/พาธที่จำกัดภายในราก รวมถึงการเขียนแบบสร้างเท่านั้น, การแทนที่ไฟล์แบบอะตอมมิกทั้งซิงก์/อะซิงก์, การเขียนไฟล์ชั่วคราวข้างเคียง, fallback การย้ายข้ามอุปกรณ์, ตัวช่วยที่เก็บไฟล์ส่วนตัว, ตัวป้องกันพาเรนต์ที่เป็น symlink, เนื้อหาภายนอก, การปกปิดข้อความละเอียดอ่อน, การเปรียบเทียบข้อมูลลับแบบเวลาคงที่ และตัวช่วยรวบรวมข้อมูลลับ; ควรใช้พาธย่อยเฉพาะด้านความปลอดภัย/SSRF/ข้อมูลลับ |
    | `plugin-sdk/ssrf-policy` | ตัวช่วยรายการโฮสต์ที่อนุญาตและนโยบาย SSRF สำหรับเครือข่ายส่วนตัว |
    | `plugin-sdk/ssrf-dispatcher` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วย pinned dispatcher แบบขอบเขตแคบที่ไม่มีพื้นผิวรันไทม์โครงสร้างพื้นฐานแบบกว้าง |
    | `plugin-sdk/ssrf-runtime` | ตัวช่วย pinned dispatcher, การดึงข้อมูลที่ป้องกัน SSRF, ข้อผิดพลาด SSRF และนโยบาย SSRF |
    | `plugin-sdk/secret-input` | ตัวช่วยแยกวิเคราะห์อินพุตข้อมูลลับ |
    | `plugin-sdk/webhook-ingress` | ตัวช่วยคำขอ/เป้าหมาย Webhook และการแปลง websocket/body ดิบ |
    | `plugin-sdk/webhook-request-guards` | ตัวช่วยขนาด/ระยะหมดเวลาของเนื้อหาคำขอ และ `runDetachedWebhookWork` สำหรับการประมวลผลหลังการตอบรับที่มีการติดตาม |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | พาธย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/runtime` | ตัวช่วยรันไทม์/การบันทึกล็อก/การสำรองข้อมูล คำเตือนพาธติดตั้ง Plugin และตัวช่วยกระบวนการ |
    | `plugin-sdk/runtime-env` | ตัวช่วยแบบเจาะจงสำหรับสภาพแวดล้อมรันไทม์ ตัวบันทึกล็อก การหมดเวลา การลองใหม่ และการหน่วงเวลาแบบเพิ่มขึ้น |
    | `plugin-sdk/browser-config` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; facade การกำหนดค่าเบราว์เซอร์ที่รองรับสำหรับโปรไฟล์/ค่าเริ่มต้นที่ปรับให้อยู่ในรูปแบบมาตรฐาน การแยกวิเคราะห์ URL ของ CDP และตัวช่วยการยืนยันตัวตนสำหรับการควบคุมเบราว์เซอร์ |
    | `plugin-sdk/agent-harness-task-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยทั่วไปสำหรับวงจรชีวิตงานและการส่งมอบเมื่อเสร็จสมบูรณ์สำหรับเอเจนต์ที่ใช้ harness โดยใช้ขอบเขตงานที่โฮสต์ออกให้ |
    | `plugin-sdk/codex-mcp-projection` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วย Codex แบบบันเดิลที่สงวนไว้สำหรับฉายการกำหนดค่าเซิร์ฟเวอร์ MCP ของผู้ใช้ไปยังการกำหนดค่าเธรด Codex; ไม่ใช่สำหรับ Plugin ของบุคคลที่สาม |
    | `plugin-sdk/codex-native-task-runtime` | ตัวช่วย Codex แบบบันเดิลภายในรีโพสำหรับการเชื่อมต่อมิเรอร์งาน/รันไทม์แบบเนทีฟ; ไม่ใช่รายการส่งออกของแพ็กเกจ |
    | `plugin-sdk/channel-runtime-context` | ตัวช่วยทั่วไปสำหรับการลงทะเบียนและค้นหาบริบทรันไทม์ของช่องทาง |
    | `plugin-sdk/matrix` | facade ความเข้ากันได้ของ Matrix ที่เลิกใช้แล้วสำหรับแพ็กเกจช่องทางของบุคคลที่สามรุ่นเก่า; Plugin ใหม่ควรนำเข้า `plugin-sdk/run-command` โดยตรง |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | barrel แบบกว้างที่เลิกใช้แล้วสำหรับตัวช่วยคำสั่ง/ฮุก/HTTP/การโต้ตอบของ Plugin; ควรใช้พาธย่อยรันไทม์ของ Plugin แบบเจาะจง |
    | `plugin-sdk/hook-runtime` | barrel แบบกว้างที่เลิกใช้แล้วสำหรับตัวช่วยไปป์ไลน์ Webhook/ฮุกภายใน; ควรใช้พาธย่อยฮุก/รันไทม์ของ Plugin แบบเจาะจง |
    | `plugin-sdk/lazy-runtime` | ตัวช่วยนำเข้า/ผูกรันไทม์แบบ Lazy เช่น `createLazyRuntimeModule`, `createLazyRuntimeMethod` และ `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยเรียกใช้กระบวนการ |
    | `plugin-sdk/node-host` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยแก้ไขตำแหน่งไฟล์ปฏิบัติการบนโฮสต์ Node และกลับมาทำงานต่อใน PTY |
    | `plugin-sdk/cli-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; barrel แบบกว้างที่เลิกใช้แล้วสำหรับการจัดรูปแบบ CLI การรอ เวอร์ชัน การเรียกใช้ด้วยอาร์กิวเมนต์ และตัวช่วยกลุ่มคำสั่งแบบ Lazy; ควรใช้พาธย่อย CLI/รันไทม์แบบเจาะจง |
    | `plugin-sdk/qa-runner-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; facade ที่รองรับสำหรับเปิดเผยสถานการณ์ QA ของ Plugin ผ่านพื้นผิวคำสั่ง CLI |
    | `plugin-sdk/tts-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; facade ที่รองรับสำหรับสคีมาการกำหนดค่าและตัวช่วยรันไทม์การแปลงข้อความเป็นเสียงพูด |
    | `plugin-sdk/gateway-method-runtime` | ตัวช่วยส่งต่อเมธอด Gateway ที่สงวนไว้สำหรับเส้นทาง HTTP ของ Plugin ซึ่งประกาศ `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | ไคลเอ็นต์ Gateway ตัวช่วยเริ่มไคลเอ็นต์เมื่อ event loop พร้อม RPC ของ CLI สำหรับ Gateway ข้อผิดพลาดโปรโตคอล Gateway การแก้ไขโฮสต์ LAN ที่ประกาศ และตัวช่วยแพตช์สถานะช่องทาง |
    | `plugin-sdk/config-contracts` | พื้นผิวการกำหนดค่าแบบเจาะจงเฉพาะชนิดสำหรับโครงสร้างการกำหนดค่าของ Plugin เช่น `OpenClawConfig` และชนิดการกำหนดค่าช่องทาง/ผู้ให้บริการ |
    | `plugin-sdk/plugin-config-runtime` | facade ความเข้ากันได้ที่เลิกใช้แล้วสำหรับตัวช่วยการกำหนดค่า Plugin ของรันไทม์; Plugin ใหม่ใช้ `api.pluginConfig` ร่วมกับสัญญาการกำหนดค่า สแนปช็อต และตัวช่วยการเปลี่ยนแปลงแบบเจาะจง |
    | `plugin-sdk/config-mutation` | ตัวช่วยเปลี่ยนแปลงการกำหนดค่าแบบทรานแซกชัน เช่น `mutateConfigFile`, `replaceConfigFile` และ `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; สตริงคำแนะนำเมทาดาทาการส่งมอบของเครื่องมือข้อความที่ใช้ร่วมกัน |
    | `plugin-sdk/runtime-config-snapshot` | ตัวช่วยสแนปช็อตการกำหนดค่ากระบวนการปัจจุบัน เช่น `getRuntimeConfig`, `getRuntimeConfigSnapshot` และตัวตั้งค่าสแนปช็อตสำหรับการทดสอบ |
    | `plugin-sdk/text-autolink-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; การตรวจจับลิงก์อัตโนมัติสำหรับการอ้างอิงไฟล์โดยไม่ใช้ barrel ข้อความแบบกว้าง |
    | `plugin-sdk/reply-runtime` | ตัวช่วยรันไทม์ขาเข้า/การตอบกลับที่ใช้ร่วมกัน การแบ่งส่วน การส่งต่อ Heartbeat และตัววางแผนการตอบกลับ |
    | `plugin-sdk/reply-dispatch-runtime` | ตัวช่วยแบบเจาะจงสำหรับการส่งต่อ/ปิดท้ายการตอบกลับและป้ายกำกับการสนทนา |
    | `plugin-sdk/reply-history` | ตัวช่วยประวัติการตอบกลับช่วงเวลาสั้นที่ใช้ร่วมกัน โค้ดรอบข้อความใหม่ควรใช้ `createChannelHistoryWindow`; ตัวช่วยแมประดับล่างยังคงเป็นเพียงรายการส่งออกเพื่อความเข้ากันได้ที่เลิกใช้แล้ว |
    | `plugin-sdk/reply-reference` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | ตัวช่วยแบ่งส่วนข้อความ/Markdown แบบเจาะจง |
    | `plugin-sdk/session-store-runtime` | ตัวช่วยเวิร์กโฟลว์เซสชัน (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`) ตัวช่วยซ่อมแซม/วงจรชีวิต (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`) ตัวช่วยมาร์กเกอร์สำหรับค่า `sessionFile` ช่วงเปลี่ยนผ่าน การอ่านข้อความทรานสคริปต์ล่าสุดของผู้ใช้/ผู้ช่วยแบบจำกัดขอบเขตตามข้อมูลประจำตัวเซสชัน ตัวช่วยพาธที่เก็บเซสชัน/คีย์เซสชัน และการอ่านค่าเวลาที่อัปเดต โดยไม่นำเข้าการเขียน/บำรุงรักษาการกำหนดค่าแบบกว้าง |
    | `plugin-sdk/session-transcript-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ข้อมูลประจำตัวทรานสคริปต์ เคอร์เซอร์ข้อมูลดิบและข้อมูลที่มองเห็นแบบจำกัดขอบเขต ตัวช่วยเป้าหมาย/อ่าน/เขียนตามขอบเขต การฉายรายการข้อความที่มองเห็น การเผยแพร่การอัปเดต ล็อกการเขียน และคีย์การพบหน่วยความจำทรานสคริปต์ |
    | `plugin-sdk/sqlite-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยแบบเจาะจงสำหรับสคีมาเอเจนต์ พาธ และทรานแซกชันของ SQLite สำหรับรันไทม์ของบุคคลที่หนึ่ง โดยไม่มีการควบคุมวงจรชีวิตฐานข้อมูล |
    | `plugin-sdk/cron-store-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยพาธ/โหลด/บันทึกที่เก็บ Cron |
    | `plugin-sdk/state-paths` | ตัวช่วยพาธไดเรกทอรีสถานะ/OAuth |
    | `plugin-sdk/plugin-state-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; สัญญาสถานะแบบมีคีย์ BLOB และสัญญาเช่า SQLite แบบร่วมมือที่กำหนดขอบเขตตาม Plugin รวมถึง pragma การเชื่อมต่อ การบำรุงรักษา WAL ที่ผ่านการตรวจสอบ และตัวช่วยย้ายสคีมา STRICT แบบอะตอมมิก ฟังก์ชันเรียกกลับของสัญญาเช่าจะได้รับสัญญาณยกเลิก และข้อผิดพลาดแบบมีชนิดจะแยกแยะการหมดเวลา การยกเลิก การสูญเสียความเป็นเจ้าของ อินพุตไม่ถูกต้อง และความล้มเหลวของที่เก็บข้อมูล |
    | `plugin-sdk/routing` | ตัวช่วยการผูกเส้นทาง/คีย์เซสชัน/บัญชี เช่น `resolveAgentRoute`, `buildAgentSessionKey` และ `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | ตัวช่วยสรุปสถานะช่องทาง/บัญชีที่ใช้ร่วมกัน ค่าเริ่มต้นของสถานะรันไทม์ และตัวช่วยเมทาดาทาปัญหา |
    | `plugin-sdk/target-resolver-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยแก้ไขเป้าหมายที่ใช้ร่วมกัน |
    | `plugin-sdk/string-normalization-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยปรับ slug/สตริงให้อยู่ในรูปแบบมาตรฐาน |
    | `plugin-sdk/request-url` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; แยก URL แบบสตริงจากอินพุตที่มีลักษณะคล้าย fetch/request |
    | `plugin-sdk/run-command` | ตัวเรียกใช้คำสั่งแบบกำหนดเวลาพร้อมผลลัพธ์ stdout/stderr ที่ปรับให้อยู่ในรูปแบบมาตรฐาน |
    | `plugin-sdk/param-readers` | ตัวอ่านพารามิเตอร์เครื่องมือ/CLI ทั่วไป |
    | `plugin-sdk/tool-plugin` | กำหนด Plugin เครื่องมือเอเจนต์แบบมีชนิดอย่างง่ายและเปิดเผยเมทาดาทาคงที่สำหรับการสร้าง manifest |
    | `plugin-sdk/tool-payload` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; แยกเพย์โหลดที่ปรับให้อยู่ในรูปแบบมาตรฐานจากออบเจ็กต์ผลลัพธ์เครื่องมือ |
    | `plugin-sdk/tool-send` | แยกฟิลด์เป้าหมายการส่งแบบบัญญัติจากอาร์กิวเมนต์เครื่องมือ |
    | `plugin-sdk/sandbox` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ชนิดแบ็กเอนด์แซนด์บ็อกซ์และตัวช่วยคำสั่ง SSH/OpenShell รวมถึงการตรวจสอบล่วงหน้าของคำสั่งเรียกใช้แบบล้มเหลวทันที |
    | `plugin-sdk/temp-path` | ตัวช่วยพาธดาวน์โหลดชั่วคราวที่ใช้ร่วมกันและพื้นที่ทำงานชั่วคราวแบบส่วนตัวที่ปลอดภัย |
    | `plugin-sdk/logging-core` | ตัวบันทึกล็อกของระบบย่อยและตัวช่วยปกปิดข้อมูล |
    | `plugin-sdk/markdown-table-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยโหมดและการแปลงตาราง Markdown |
    | `plugin-sdk/model-session-runtime` | ตัวช่วยแทนที่โมเดล/เซสชัน เช่น `applyModelOverrideToSessionEntry` และ `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยแก้ไขการกำหนดค่าผู้ให้บริการการสนทนา |
    | `plugin-sdk/json-store` | ตัวช่วยอ่าน/เขียนสถานะ JSON ขนาดเล็ก |
    | `plugin-sdk/json-unsafe-integers` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยแยกวิเคราะห์ JSON ที่รักษาลิเทอรัลจำนวนเต็มซึ่งไม่ปลอดภัยไว้เป็นสตริง |
    | `plugin-sdk/file-lock` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยล็อกไฟล์แบบเข้าใช้ซ้ำได้ พร้อมการเรียกคืนไฟล์ sidecar ล็อกที่เลิกใช้แล้วซึ่งล้าสมัยอย่างแน่นอนและไม่มีการเปลี่ยนแปลงอย่างปลอดภัยสำหรับ Doctor |
    | `plugin-sdk/persistent-dedupe` | ตัวช่วยแคชขจัดข้อมูลซ้ำที่มีดิสก์รองรับ |
    | `plugin-sdk/ingress-effect-once` | ตัวป้องกันการอ้างสิทธิ์/คอมมิตแบบคงทนสำหรับผลข้างเคียงของข้อมูลขาเข้าที่ไม่เป็น idempotent |
    | `plugin-sdk/acp-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยรันไทม์/เซสชันและการส่งต่อการตอบกลับของ ACP |
    | `plugin-sdk/acp-runtime-backend` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยขนาดเล็กสำหรับการลงทะเบียนแบ็กเอนด์ ACP และการส่งต่อการตอบกลับสำหรับ Plugin ที่โหลดเมื่อเริ่มต้น |
    | `plugin-sdk/acp-binding-resolve-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; การแก้ไขการผูก ACP แบบอ่านอย่างเดียวโดยไม่นำเข้าการเริ่มต้นวงจรชีวิต |
    | `plugin-sdk/agent-config-primitives` | พื้นฐานสคีมาการกำหนดค่ารันไทม์เอเจนต์ที่เลิกใช้แล้ว; ให้นำเข้าพื้นฐานสคีมาจากพื้นผิวที่ Plugin เป็นเจ้าของและยังได้รับการดูแล |
    | `plugin-sdk/boolean-param` | ตัวอ่านพารามิเตอร์บูลีนแบบยืดหยุ่น |
    | `plugin-sdk/dangerous-name-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยแก้ไขการจับคู่ชื่อที่เป็นอันตราย |
    | `plugin-sdk/device-bootstrap` | ตัวช่วยบูตสแตรปอุปกรณ์และโทเค็นการจับคู่ รวมถึง `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | พื้นฐานตัวช่วยช่องทางแบบพาสซีฟ สถานะ และพร็อกซีแวดล้อมที่ใช้ร่วมกัน |
    | `plugin-sdk/models-provider-runtime` | ตัวช่วยการตอบกลับคำสั่ง/ผู้ให้บริการ `/models` |
    | `plugin-sdk/skill-commands-runtime` | ตัวช่วยแสดงรายการคำสั่ง Skill |
    | `plugin-sdk/native-command-registry` | ตัวช่วยรีจิสทรี/สร้าง/ซีเรียลไลซ์คำสั่งแบบเนทีฟ |
    | `plugin-sdk/agent-harness` | พื้นผิวทดลองสำหรับ Plugin ที่เชื่อถือได้สำหรับ harness เอเจนต์ระดับล่าง: ชนิด harness ตัวช่วยควบคุมทิศทาง/ยกเลิกการทำงานที่กำลังดำเนินอยู่ ตัวช่วยบริดจ์เครื่องมือ OpenClaw ตัวช่วยนโยบายเครื่องมือตามแผนรันไทม์ การจำแนกผลลัพธ์ปลายทาง การจัดรูปแบบ/รายละเอียดความคืบหน้าของเครื่องมือ และยูทิลิตีผลลัพธ์การพยายาม |
    | `plugin-sdk/async-lock-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยล็อกแบบอะซิงโครนัสภายในกระบวนการสำหรับไฟล์สถานะรันไทม์ขนาดเล็ก |
    | `plugin-sdk/channel-activity-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยโทรมาตรการทำงานของช่องทาง |
    | `plugin-sdk/concurrency-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยควบคุมจำนวนงานอะซิงโครนัสพร้อมกันแบบมีขอบเขต |
    | `plugin-sdk/dedupe-runtime` | ตัวช่วยแคชขจัดข้อมูลซ้ำในหน่วยความจำและแบบมีที่เก็บถาวรรองรับ |
    | `plugin-sdk/delivery-queue-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยระบายการส่งมอบขาออกที่รอดำเนินการ |
    | `plugin-sdk/file-access-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยพาธไฟล์ในเครื่องและแหล่งสื่อที่ปลอดภัย |
    | `plugin-sdk/heartbeat-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยปลุก เหตุการณ์ และการมองเห็นของ Heartbeat |
    | `plugin-sdk/expect-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยยืนยันค่าที่จำเป็นสำหรับค่าคงที่ของรันไทม์ที่พิสูจน์ได้ |
    | `plugin-sdk/number-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยบังคับแปลงเป็นตัวเลข |
    | `plugin-sdk/secure-random-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยโทเค็น/UUID ที่ปลอดภัย |
    | `plugin-sdk/system-event-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยคิวเหตุการณ์ระบบ |
    | `plugin-sdk/transport-ready-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยรอความพร้อมของทรานสปอร์ต |
    | `plugin-sdk/exec-approvals-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยไฟล์นโยบายการอนุมัติการเรียกใช้โดยไม่ใช้ barrel รันไทม์โครงสร้างพื้นฐานแบบกว้าง |
    | `plugin-sdk/infra-runtime` | shim ความเข้ากันได้ที่เลิกใช้แล้ว; ใช้พาธย่อยรันไทม์แบบเจาะจงข้างต้น |
    | `plugin-sdk/collection-runtime` | ตัวช่วยแคชขนาดเล็กแบบมีขอบเขต |
    | `plugin-sdk/diagnostic-runtime` | ตัวช่วยแฟล็กการวินิจฉัย เหตุการณ์ และบริบทการติดตาม |
    | `plugin-sdk/error-runtime` | กราฟข้อผิดพลาด การจัดรูปแบบ ตัวช่วยจำแนกข้อผิดพลาดที่ใช้ร่วมกัน `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วย fetch แบบห่อหุ้ม พร็อกซี ตัวเลือก EnvHttpProxyAgent และการค้นหาที่ตรึงไว้ |
    | `plugin-sdk/runtime-fetch` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; fetch รันไทม์ที่รองรับ dispatcher โดยไม่นำเข้าพร็อกซี/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยทำความสะอาด URL ข้อมูลรูปภาพแบบอินไลน์และตรวจจับลายเซ็น โดยไม่ใช้พื้นผิวรันไทม์สื่อแบบกว้าง |
    | `plugin-sdk/response-limit-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวอ่านเนื้อหาการตอบกลับที่จำกัดตามจำนวนไบต์ เวลาว่าง และกำหนดเวลา โดยไม่ใช้พื้นผิวรันไทม์สื่อแบบกว้าง |
    | `plugin-sdk/session-binding-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; สถานะการผูกการสนทนาปัจจุบันโดยไม่มีการกำหนดเส้นทางการผูกที่กำหนดค่าไว้หรือที่เก็บการจับคู่ |
    | `plugin-sdk/context-visibility-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; การแก้ไขการมองเห็นบริบทและการกรองบริบทเสริม โดยไม่นำเข้าการกำหนดค่า/ความปลอดภัยแบบกว้าง |
    | `plugin-sdk/string-coerce-runtime` | ตัวช่วยแบบเจาะจงสำหรับการบังคับแปลงและปรับเรคคอร์ด/สตริงพื้นฐานให้อยู่ในรูปแบบมาตรฐาน โดยไม่นำเข้า Markdown/การบันทึกล็อก |
    | `plugin-sdk/html-entity-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; การถอดรหัสเอนทิตี HTML5 ที่ลงท้ายด้วยอัฒภาคแบบรอบเดียว โดยไม่ใช้ยูทิลิตีข้อความแบบกว้าง |
    | `plugin-sdk/text-utility-runtime` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยระดับล่างสำหรับข้อความและพาธ รวมถึงการหลีกอักขระ HTML สำหรับเอนทิตีห้ารายการ |
    | `plugin-sdk/widget-html` | การตรวจจับเอกสารแบบสมบูรณ์ การตรวจสอบขนาด และข้อผิดพลาดอินพุตของเครื่องมือสำหรับวิดเจ็ต HTML ที่ทำงานได้ในตัว |
    | `plugin-sdk/host-runtime` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยปรับชื่อโฮสต์และโฮสต์ SCP ให้เป็นรูปแบบมาตรฐาน |
    | `plugin-sdk/retry-runtime` | เป็น private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยสำหรับการกำหนดค่าการลองใหม่และตัวดำเนินการลองใหม่ |
    | `plugin-sdk/agent-runtime` | barrel แบบกว้างที่เลิกใช้แล้วสำหรับตัวช่วยไดเรกทอรี/ข้อมูลประจำตัว/พื้นที่ทำงานของเอเจนต์ รวมถึง `resolveAgentDir`, `resolveDefaultAgentDir` และ export สำหรับความเข้ากันได้ `resolveOpenClawAgentDir` ที่เลิกใช้แล้ว; ควรใช้พาธย่อยเฉพาะด้านของเอเจนต์/รันไทม์ |
    | `plugin-sdk/directory-runtime` | การค้นหาไดเรกทอรีที่อิงการกำหนดค่า/การลบรายการซ้ำ |
    | `plugin-sdk/keyed-async-queue` | เป็น private-local หลังเดือนกรกฎาคม 2026; `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="เส้นทางย่อยด้านความสามารถและการทดสอบ">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/media-runtime` | barrel สื่อแบบกว้างที่เลิกใช้แล้ว ซึ่งรวม `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` และ `fetchRemoteMedia` ที่เลิกใช้แล้ว ควรใช้ `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` และเส้นทางย่อยของรันไทม์ความสามารถแทน และควรใช้ตัวช่วยของที่เก็บก่อนอ่านบัฟเฟอร์ เมื่อ URL ควรถูกแปลงเป็นสื่อของ OpenClaw |
    | `plugin-sdk/media-mime` | ตัวช่วยแบบเจาะจงสำหรับการปรับ MIME ให้เป็นมาตรฐาน การแมปนามสกุลไฟล์ การตรวจหา MIME และชนิดสื่อ |
    | `plugin-sdk/media-store` | ตัวช่วยที่เก็บสื่อแบบเจาะจง เช่น `saveMediaBuffer` และ `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยการสลับไปใช้ทางเลือกสำรองร่วมสำหรับการสร้างสื่อ การเลือกตัวเลือก และข้อความเมื่อไม่มีโมเดล |
    | `plugin-sdk/media-understanding` | facade ความเข้ากันได้ที่เลิกใช้แล้วสำหรับชนิดและตัวช่วยของผู้ให้บริการด้านการทำความเข้าใจสื่อ ผู้ให้บริการใหม่ลงทะเบียนผ่าน API ของ Plugin ที่ฉีดเข้ามา และเก็บตัวช่วยคำขอไว้ภายใต้การดูแลของ Plugin |
    | `plugin-sdk/text-chunking` | การแบ่งข้อความขาออกและช่วงโดยคงออฟเซ็ต การแบ่ง markdown ตัวช่วยแบ่ง/เรนเดอร์ markdown การแยกโทเค็นแท็ก HTML โดยคำนึงถึงเครื่องหมายคำพูด การแปลงตาราง markdown การลบแท็กคำสั่ง และยูทิลิตีข้อความที่ปลอดภัย |
    | `plugin-sdk/speech` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ชนิดผู้ให้บริการเสียงพูด รวมถึงรายการส่งออกด้านคำสั่ง รีจิสทรี การตรวจสอบ เครื่องมือสร้าง TTS ที่เข้ากันได้กับ OpenAI และตัวช่วยเสียงพูดสำหรับผู้ให้บริการ |
    | `plugin-sdk/speech-core` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; รายการส่งออกร่วมของชนิดผู้ให้บริการเสียงพูด รีจิสทรี คำสั่ง การปรับให้เป็นมาตรฐาน และตัวช่วยเสียงพูด |
    | `plugin-sdk/speech-settings` | องค์ประกอบพื้นฐานขนาดเล็กสำหรับการแก้ไขและปรับการกำหนดค่า TTS ให้เป็นมาตรฐาน โดยไม่มีรีจิสทรีผู้ให้บริการหรือรันไทม์สังเคราะห์ |
    | `plugin-sdk/realtime-transcription` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ชนิดผู้ให้บริการถอดเสียงแบบเรียลไทม์ ตัวช่วยรีจิสทรี และตัวช่วยเซสชัน WebSocket ที่ใช้ร่วมกัน |
    | `plugin-sdk/realtime-bootstrap-context` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยบูตสแตรปโปรไฟล์แบบเรียลไทม์สำหรับการฉีดบริบท `IDENTITY.md`, `USER.md` และ `SOUL.md` แบบมีขอบเขตจำกัด |
    | `plugin-sdk/realtime-voice` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ชนิดผู้ให้บริการเสียงแบบเรียลไทม์ ตัวช่วยรีจิสทรี เกตที่ใช้ร่วมกันสำหรับพลังงานเสียง/การเริ่มต้นเสียงพูด และตัวช่วยพฤติกรรมเสียงแบบเรียลไทม์ รวมถึงชุดทดสอบเซสชันที่ไม่ขึ้นกับการขนส่งและการติดตามกิจกรรมเอาต์พุต |
    | `plugin-sdk/meeting-runtime` | รันไทม์เซสชันการประชุมผ่านเบราว์เซอร์ เอนจิน/การขนส่งเสียงแบบเรียลไทม์ `MeetingPlatformAdapter` การควบคุมเบราว์เซอร์/Node การปรึกษาเอเจนต์ การมอบหมายสายสนทนาด้วยเสียง การตรวจสอบการตั้งค่า และตัวช่วยคำสั่ง SoX |
    | `plugin-sdk/image-generation` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ชนิดผู้ให้บริการสร้างรูปภาพ รวมถึงตัวช่วยแอสเซ็ตรูปภาพ/URL ข้อมูล และเครื่องมือสร้างผู้ให้บริการรูปภาพที่เข้ากันได้กับ OpenAI |
    | `plugin-sdk/image-generation-core` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ชนิด การสลับไปใช้ทางเลือกสำรอง การยืนยันตัวตน และตัวช่วยรีจิสทรีที่ใช้ร่วมกันสำหรับการสร้างรูปภาพ |
    | `plugin-sdk/music-generation` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างเพลง |
    | `plugin-sdk/video-generation` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ชนิดผู้ให้บริการ/คำขอ/ผลลัพธ์สำหรับการสร้างวิดีโอ |
    | `plugin-sdk/video-generation-core` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ชนิดที่ใช้ร่วมกันสำหรับการสร้างวิดีโอ ตัวช่วยการสลับไปใช้ทางเลือกสำรอง การค้นหาผู้ให้บริการ และการแยกวิเคราะห์การอ้างอิงโมเดล |
    | `plugin-sdk/transcripts` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ชนิดผู้ให้บริการแหล่งที่มาของบทถอดเสียงที่ใช้ร่วมกัน ตัวช่วยรีจิสทรี ตัวอธิบายเซสชัน และข้อมูลเมตาของถ้อยคำ |
    | `plugin-sdk/webhook-targets` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; รีจิสทรีเป้าหมาย Webhook และตัวช่วยติดตั้งเส้นทาง |
    | `plugin-sdk/web-media` | ตัวช่วยโหลดสื่อจากระยะไกล/ภายในเครื่องที่ใช้ร่วมกัน |
    | `plugin-sdk/zod` | การส่งออกซ้ำเพื่อความเข้ากันได้ที่เลิกใช้แล้ว ให้นำเข้า `zod` จาก `zod` โดยตรง |
    | `plugin-sdk/plugin-test-api` | ตัวช่วย `createTestPluginApi` ขั้นต่ำภายในรีโพสำหรับการทดสอบหน่วยการลงทะเบียน Plugin โดยตรง โดยไม่ต้องนำเข้าบริดจ์ตัวช่วยทดสอบของรีโพ |
    | `plugin-sdk/agent-runtime-test-contracts` | ฟิกซ์เจอร์สัญญาอะแดปเตอร์รันไทม์เอเจนต์แบบเนทีฟภายในรีโพ สำหรับการทดสอบการยืนยันตัวตน การส่งมอบ ทางเลือกสำรอง ฮุกเครื่องมือ โอเวอร์เลย์พรอมต์ สคีมา และการฉายภาพบทถอดเสียง |
    | `plugin-sdk/channel-test-helpers` | ตัวช่วยทดสอบที่เน้นช่องทางภายในรีโพ สำหรับสัญญาการดำเนินการ/การตั้งค่า/สถานะทั่วไป การตรวจสอบไดเรกทอรี วงจรชีวิตการเริ่มต้นบัญชี การส่งต่อการกำหนดค่าการส่ง ม็อกของรันไทม์ ปัญหาสถานะ การส่งมอบขาออก และการลงทะเบียนฮุก |
    | `plugin-sdk/channel-target-testing` | ชุดกรณีข้อผิดพลาดในการแก้ไขเป้าหมายร่วมภายในรีโพสำหรับการทดสอบช่องทาง |
    | `plugin-sdk/channel-contract-testing` | ตัวช่วยทดสอบสัญญาช่องทางแบบเจาะจงภายในรีโพ โดยไม่ใช้ barrel การทดสอบแบบกว้าง |
    | `plugin-sdk/plugin-test-contracts` | ตัวช่วยสัญญาภายในรีโพสำหรับแพ็กเกจ Plugin การลงทะเบียน อาร์ติแฟกต์สาธารณะ การนำเข้าโดยตรง API รันไทม์ และผลข้างเคียงจากการนำเข้า |
    | `plugin-sdk/plugin-state-test-runtime` | ตัวช่วยทดสอบภายในรีโพสำหรับที่เก็บสถานะของ Plugin คิวขาเข้า และฐานข้อมูลสถานะ |
    | `plugin-sdk/provider-test-contracts` | ตัวช่วยสัญญาภายในรีโพสำหรับรันไทม์ผู้ให้บริการ การยืนยันตัวตน การค้นพบ การเริ่มใช้งาน แค็ตตาล็อก วิซาร์ด ความสามารถด้านสื่อ นโยบายเล่นซ้ำ STT แบบเรียลไทม์ด้วยเสียงสด การค้นหา/ดึงข้อมูลเว็บ และสตรีม |
    | `plugin-sdk/provider-http-test-mocks` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ม็อก HTTP/การยืนยันตัวตนของ Vitest แบบเลือกใช้ภายในรีโพ สำหรับการทดสอบผู้ให้บริการที่ใช้ `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | ตัวช่วยภายในรีโพสำหรับแนบข้อมูลเมตาเข้ากับฟิกซ์เจอร์เพย์โหลดการตอบกลับ |
    | `plugin-sdk/sqlite-runtime-testing` | ตัวช่วยวงจรชีวิต SQLite ภายในรีโพสำหรับการทดสอบของบุคคลที่หนึ่ง |
    | `plugin-sdk/test-fixtures` | ฟิกซ์เจอร์ภายในรีโพสำหรับการจับรันไทม์ CLI ทั่วไป บริบทแซนด์บ็อกซ์ ตัวเขียนสกิล ข้อความเอเจนต์ เหตุการณ์ระบบ การโหลดโมดูลซ้ำ เส้นทาง Plugin ที่รวมมาให้ ข้อความเทอร์มินัล การแบ่งส่วน โทเค็นยืนยันตัวตน และกรณีแบบมีชนิด |
    | `plugin-sdk/test-node-mocks` | ตัวช่วยม็อก Node builtin แบบเจาะจงภายในรีโพ สำหรับใช้ภายในแฟกทอรี `vi.mock("node:*")` ของ Vitest |
  </Accordion>

  <Accordion title="เส้นทางย่อยของหน่วยความจำ">
    | เส้นทางย่อย | รายการส่งออกหลัก |
    | --- | --- |
    | `plugin-sdk/memory-core-host-embedding-registry` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยรีจิสทรีผู้ให้บริการ embedding สำหรับหน่วยความจำแบบขนาดเล็ก |
    | `plugin-sdk/memory-core-host-engine-foundation` | รายการส่งออกเอนจินพื้นฐานของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-embeddings` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; สัญญา embedding ของโฮสต์หน่วยความจำ การเข้าถึงรีจิสทรี ผู้ให้บริการภายในเครื่อง และตัวช่วยแบบแบตช์/ระยะไกลทั่วไป `registerMemoryEmbeddingProvider` บนพื้นผิวนี้เลิกใช้แล้ว สำหรับผู้ให้บริการใหม่ให้ใช้ API ผู้ให้บริการ embedding ทั่วไป |
    | `plugin-sdk/memory-core-host-engine-qmd` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; รายการส่งออกเอนจิน QMD ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-engine-storage` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; รายการส่งออกเอนจินพื้นที่จัดเก็บของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-secret` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยข้อมูลลับของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-status` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยสถานะของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-cli` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยรันไทม์ CLI ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-core` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยรันไทม์แกนหลักของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-core-host-runtime-files` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วยไฟล์/รันไทม์ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-core` | facade ความเข้ากันได้ที่เลิกใช้แล้วสำหรับตัวช่วยโฮสต์หน่วยความจำที่ไม่ผูกกับผู้จำหน่าย Plugin หน่วยความจำใหม่ใช้ความสามารถหน่วยความจำที่ฉีดเข้ามาและพรอมต์ที่โฮสต์จัดเตรียม ส่วน Plugin คู่หูยังคงใช้ facade ที่เก็บไว้สำหรับการค้นพบอาร์ติแฟกต์สาธารณะ จนกว่าจะมีจุดเชื่อมต่อการอ่านแบบเจาะจง |
    | `plugin-sdk/memory-host-events` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; นามแฝงที่ไม่ผูกกับผู้จำหน่ายสำหรับตัวช่วยบันทึกเหตุการณ์ของโฮสต์หน่วยความจำ |
    | `plugin-sdk/memory-host-markdown` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วย managed-markdown ที่ใช้ร่วมกันสำหรับ Plugin ที่เกี่ยวข้องกับหน่วยความจำ |
    | `plugin-sdk/memory-host-search` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; facade รันไทม์ Active Memory สำหรับการเข้าถึงตัวจัดการการค้นหา |
  </Accordion>

  <Accordion title="เส้นทางย่อยของตัวช่วยแบบรวมที่สงวนไว้">
    เส้นทางย่อย SDK ของตัวช่วยแบบรวมที่สงวนไว้เป็นพื้นผิวเฉพาะเจ้าของแบบเจาะจงสำหรับ
    โค้ด Plugin ที่รวมมาให้ เส้นทางเหล่านี้ถูกติดตามในรายการสินค้าคงคลังของ SDK เพื่อให้การสร้าง
    แพ็กเกจและการสร้างนามแฝงคงความเป็นเชิงกำหนด แต่ไม่ใช่ API สำหรับการพัฒนา Plugin
    โดยทั่วไป สัญญาโฮสต์ใหม่ที่นำกลับมาใช้ซ้ำได้ควรใช้เส้นทางย่อย SDK ทั่วไป
    เช่น `plugin-sdk/gateway-runtime` และ `plugin-sdk/ssrf-runtime`

    | เส้นทางย่อย | เจ้าของและวัตถุประสงค์ |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | เป็นแบบ private-local หลังเดือนกรกฎาคม 2026; ตัวช่วย Plugin Codex ที่รวมมาให้ สำหรับฉายการกำหนดค่าเซิร์ฟเวอร์ MCP ของผู้ใช้ไปยังการกำหนดค่าเธรด app-server ของ Codex (รายการส่งออกแพ็กเกจที่สงวนไว้) |
    | `plugin-sdk/codex-native-task-runtime` | ตัวช่วย Plugin Codex ที่รวมมาให้ สำหรับสะท้อนซับเอเจนต์แบบเนทีฟของ app-server ของ Codex ไปยังสถานะงานของ OpenClaw (เฉพาะภายในรีโพ ไม่ใช่รายการส่งออกแพ็กเกจ) |

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
