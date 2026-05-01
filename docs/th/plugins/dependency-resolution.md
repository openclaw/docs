---
read_when:
    - คุณกำลังดีบักการซ่อมแซมการพึ่งพาขณะรันไทม์ของ Plugin ที่รวมมาให้
    - คุณกำลังเปลี่ยนแปลงลักษณะการทำงานของการเริ่มทำงานของ Plugin, การตรวจวินิจฉัย หรือการติดตั้งผ่านตัวจัดการแพ็กเกจ
    - คุณกำลังดูแลการติดตั้ง OpenClaw แบบแพ็กเกจหรือไฟล์กำกับของ Plugin ที่รวมมาในชุด
sidebarTitle: Dependencies
summary: วิธีที่ OpenClaw วางแผน จัดเตรียม และซ่อมแซมการพึ่งพาของรันไทม์สำหรับ Plugin ที่มาพร้อมระบบ
title: การแก้ไขการขึ้นต่อกันของ Plugin
x-i18n:
    generated_at: "2026-05-01T10:19:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09245c2b7e2f1fb2a61d64f0f9dc77e7df7da58fd71608c391e3865345b7bc9
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw ไม่ได้ติดตั้งแผนผัง dependency ทั้งหมดของ Plugin ที่มาพร้อมแพ็กเกจทุกตัวในเวลาติดตั้งแพ็กเกจ ระบบจะอนุมานแผน Plugin ที่มีผลจริงจาก config และ metadata ของ Plugin ก่อน จากนั้นจึงจัดเตรียม runtime dependencies เฉพาะสำหรับ Plugin ที่ OpenClaw เป็นเจ้าของและมาพร้อมแพ็กเกจ ซึ่งแผนสามารถโหลดได้จริง

หน้านี้ครอบคลุม packaged runtime dependencies สำหรับ Plugin ของ OpenClaw ที่มาพร้อมแพ็กเกจ Plugin บุคคลที่สามและเส้นทาง Plugin แบบกำหนดเองยังคงใช้คำสั่งติดตั้ง Plugin อย่างชัดเจน เช่น `openclaw plugins install` และ `openclaw plugins update`

## การแบ่งความรับผิดชอบ

OpenClaw เป็นเจ้าของแผนและนโยบาย:

- Plugin ใด active สำหรับ config นี้
- dependency roots ใดเขียนได้หรืออ่านอย่างเดียว
- อนุญาตให้ repair เมื่อใด
- Plugin ids ใดถูกจัดเตรียมสำหรับ startup
- การตรวจสอบขั้นสุดท้ายก่อนนำเข้า plugin runtime modules

package manager เป็นเจ้าของการทำให้ dependencies บรรจบกัน:

- การ resolve package graph
- การจัดการ production, optional และ peer dependencies
- layout ของ `node_modules`
- ความสมบูรณ์ของ package
- lock และ install metadata

ในทางปฏิบัติ OpenClaw ควรตัดสินใจว่าสิ่งใดจำเป็นต้องมีอยู่ `pnpm` หรือ `npm` ควรทำให้ filesystem ตรงกับการตัดสินใจนั้น

OpenClaw ยังเป็นเจ้าของ coordination lock ต่อ install root แต่ละตัวด้วย Package managers ปกป้อง install transaction ของตัวเอง แต่ไม่ได้ serialize การเขียน manifest ของ OpenClaw, การ copy/rename isolated-stage, การ validation ขั้นสุดท้าย หรือการ import Plugin เทียบกับ Gateway, doctor หรือ CLI process อื่นที่แตะ runtime dependency root เดียวกัน

## แผน Plugin ที่มีผลจริง

แผน Plugin ที่มีผลจริงอนุมานจาก config รวมกับ plugin metadata ที่ค้นพบ อินพุตเหล่านี้สามารถเปิดใช้งาน runtime dependencies ของ Plugin ที่มาพร้อมแพ็กเกจ:

- `plugins.entries.<id>.enabled`
- `plugins.allow`, `plugins.deny` และ `plugins.enabled`
- config ของ channel แบบเดิม เช่น `channels.telegram.enabled`
- providers, models หรือ CLI backend references ที่กำหนดค่าไว้ซึ่งต้องใช้ Plugin
- ค่าเริ่มต้นของ bundled manifest เช่น `enabledByDefault`
- installed plugin index และ bundled manifest metadata

การปิดใช้งานอย่างชัดเจนมีผลเหนือกว่า Plugin ที่ disabled, plugin id ที่ denied, ระบบ Plugin ที่ disabled หรือ channel ที่ disabled จะไม่ trigger runtime dependency repair สถานะ auth ที่ persist ไว้เพียงอย่างเดียวก็ไม่ activate bundled channel หรือ provider เช่นกัน

แผน Plugin คืออินพุตที่ stable วัสดุ dependency materialization ที่ generate ขึ้นคือเอาต์พุตของแผนนั้น

## ลำดับการทำงานตอน Startup

Gateway startup parse config และสร้าง startup plugin lookup table ก่อนโหลด plugin runtime modules จากนั้น startup จะจัดเตรียม runtime dependencies เฉพาะสำหรับ `startupPluginIds` ที่แผนนั้นเลือกไว้

สำหรับ packaged installs อนุญาตให้ dependency staging เกิดก่อน plugin import ได้ หลังจาก staging แล้ว runtime loader จะ import startup plugins โดยปิด install repair ไว้ ณ จุดนั้น dependency materialization ที่หายไปจะถูกมองว่าเป็น load failure ไม่ใช่ repair loop อีกรอบ

เมื่อ startup dependency staging ถูก defer ไว้หลัง HTTP bind สถานะ readiness ของ Gateway จะยังถูกบล็อกด้วยเหตุผล `plugin-runtime-deps` จนกว่า dependencies ของ startup plugin ที่เลือกจะถูก materialize และ startup plugin runtime โหลดเสร็จ

## เมื่อใดที่ repair ทำงาน

runtime dependency repair ควรทำงานเมื่อข้อใดข้อหนึ่งต่อไปนี้เป็นจริง:

- แผน Plugin ที่มีผลจริงเปลี่ยนไปและเพิ่ม Plugin ที่มาพร้อมแพ็กเกจซึ่งต้องใช้ runtime dependencies
- generated dependency manifest ไม่ตรงกับแผนที่มีผลจริงอีกต่อไป
- expected installed package sentinels หายไปหรือไม่สมบูรณ์
- มีการขอ `openclaw doctor --fix` หรือ `openclaw plugins deps --repair`

runtime dependency repair ไม่ควรทำงานเพียงเพราะ OpenClaw เริ่มทำงาน startup ปกติที่มีแผนไม่เปลี่ยนและ dependency materialization ครบถ้วนควรข้ามงานของ package manager

คำสั่งที่แก้ไข config, enable Plugin หรือ repair doctor findings สามารถเข้าสู่ plugin plan mode หนึ่งครั้ง materialize bundled dependencies ที่จำเป็นใหม่ แล้วกลับสู่ normal command flow ได้ Local `openclaw onboard` และ `openclaw configure` ทำสิ่งนี้โดยอัตโนมัติหลังจากเขียน config สำเร็จ ดังนั้นการรัน Gateway ครั้งถัดไปจะไม่พบว่าแพ็กเกจ Plugin ที่มาพร้อมแพ็กเกจหายไปหลังจาก startup เริ่มขึ้นแล้ว Remote onboarding/configure ยังคงเป็น read-only สำหรับ local runtime deps

## กฎ Hot reload

เส้นทาง hot reload ที่สามารถเปลี่ยน active plugins ต้องย้อนกลับผ่าน plugin plan mode ก่อนโหลด plugin runtime การ reload ควรเปรียบเทียบแผน Plugin ที่มีผลจริงใหม่กับแผนก่อนหน้า จัดเตรียม dependencies ที่หายไปสำหรับ Plugin ที่มาพร้อมแพ็กเกจซึ่งเพิ่ง active แล้วจึงโหลดหรือ restart runtime ที่ได้รับผลกระทบ

ถ้า config reload ไม่เปลี่ยนแผน Plugin ที่มีผลจริง ก็ไม่ควร repair bundled runtime dependencies

## การทำงานของ Package manager

OpenClaw เขียน generated install manifest สำหรับ bundled runtime dependencies ที่เลือก และรัน package manager ใน runtime dependency install root ระบบจะเลือกใช้ `pnpm` เมื่อมี และ fallback ไปยัง runner ของ `npm` ที่มาพร้อม Node

เส้นทาง `pnpm` ใช้ production dependencies, ปิด lifecycle scripts, ไม่สนใจ workspace และเก็บ store ไว้ภายใน install root:

```bash
pnpm install \
  --prod \
  --ignore-scripts \
  --ignore-workspace \
  --config.frozen-lockfile=false \
  --config.minimum-release-age=0 \
  --config.store-dir=<install-root>/.openclaw-pnpm-store \
  --config.node-linker=hoisted \
  --config.virtual-store-dir=.pnpm
```

fallback ของ `npm` ใช้ safe npm install wrapper พร้อม production dependencies, ปิด lifecycle scripts, ปิด workspace mode, ปิด audit, ปิด fund output, ใช้ legacy peer dependency behavior และเปิด package-lock output สำหรับ generated install root

หลัง install แล้ว OpenClaw จะ validate staged dependency tree ก่อนทำให้มองเห็นได้ใน runtime dependency root isolated staging จะถูก copy เข้า runtime dependency root และ validate อีกครั้ง

ส่วน repair/materialization ทั้งหมดถูกป้องกันด้วย install-root lock lock owners ปัจจุบันบันทึก PID, process start-time เมื่อมี และ creation time legacy locks ที่ไม่มี process start-time หรือ creation-time evidence จะถูก reclaim ด้วย filesystem age เท่านั้น ดังนั้น recycled Docker PID 1 locks จึง recover ได้โดยไม่ทำให้ normal long-running current installs หมดอายุด้วย age เพียงอย่างเดียว

## Install roots

Packaged installs ต้องไม่ mutate package directories ที่เป็น read-only OpenClaw สามารถอ่าน dependency roots จาก packaged layers ได้ แต่เขียน generated runtime dependencies ไปยัง writable stage เช่น:

- `OPENCLAW_PLUGIN_STAGE_DIR`
- `$STATE_DIRECTORY`
- `~/.openclaw/plugin-runtime-deps`
- `/var/lib/openclaw/plugin-runtime-deps` ใน container-style installs

writable root คือเป้าหมาย materialization สุดท้าย read-only roots รุ่นเก่าจะถูกเก็บไว้เป็น compatibility layers เฉพาะเมื่อจำเป็นเท่านั้น

เมื่อ packaged OpenClaw update เปลี่ยน versioned writable root แต่ bundled-plugin dependency plan ที่เลือกยังคง satisfied โดย previous staged root ระบบ repair จะ reuse tree ของ `node_modules` ก่อนหน้าแทนการรัน package manager อีกครั้ง new versioned root ยังคงได้ current package runtime mirror ของตัวเอง ดังนั้น plugin code จะมาจาก package OpenClaw ปัจจุบัน ในขณะที่ dependency trees ที่ไม่เปลี่ยนจะถูกแชร์ข้าม updates การ reuse จะข้าม previous roots ที่มี active OpenClaw runtime-dependency lock ดังนั้น root ใหม่จะไม่ link ไปยัง dependency tree ที่ Gateway, doctor หรือ CLI process อื่นกำลัง repair อยู่ในขณะนั้น

## คำสั่ง Doctor และ CLI

ใช้ `plugins deps` เพื่อตรวจสอบหรือ repair runtime dependency materialization ของ Plugin ที่มาพร้อมแพ็กเกจ:

```bash
openclaw plugins deps
openclaw plugins deps --json
openclaw plugins deps --repair
openclaw plugins deps --prune
```

ใช้ doctor เมื่อ dependency state เป็นส่วนหนึ่งของสุขภาพการติดตั้งโดยรวม:

```bash
openclaw doctor
openclaw doctor --fix
```

`plugins deps` และ doctor ทำงานกับ runtime dependencies ของ Plugin ที่ OpenClaw เป็นเจ้าของและมาพร้อมแพ็กเกจ ซึ่งถูกเลือกโดยแผน Plugin ที่มีผลจริง คำสั่งเหล่านี้ไม่ใช่คำสั่งติดตั้งหรือ update Plugin บุคคลที่สาม

## การแก้ไขปัญหา

ถ้า packaged install รายงานว่า bundled runtime dependencies หายไป:

1. รัน `openclaw plugins deps --json` เพื่อตรวจสอบแผนที่เลือกและ packages ที่หายไป
2. รัน `openclaw plugins deps --repair` หรือ `openclaw doctor --fix` เพื่อ repair writable dependency stage
3. ถ้า install root เป็น read-only ให้ตั้ง `OPENCLAW_PLUGIN_STAGE_DIR` เป็นเส้นทางที่เขียนได้ แล้วรัน repair อีกครั้ง
4. restart Gateway หลัง repair ถ้า dependency ที่หายไปบล็อกการโหลด startup plugin

ใน source checkouts โดยปกติ workspace install จะมี dependencies ของ Plugin ที่มาพร้อมแพ็กเกจอยู่แล้ว ให้รัน `pnpm install` สำหรับ source dependency repair แทนการใช้ packaged runtime dependency repair เป็นขั้นตอนแรก
