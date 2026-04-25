---
read_when:
    - คุณต้องเข้าใจว่าทำไมงาน CI จึงรันหรือไม่รัน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
summary: กราฟงาน CI, ขอบเขตของเกต และคำสั่งเทียบเท่าบนเครื่อง local
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-04-25T13:43:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc363efb98c9f82b585161a017ba1c599344a4e38c3fe683d81b0997d1d2fd4d
    source_path: ci.md
    workflow: 15
---

CI จะรันทุกครั้งที่มีการ push ไปยัง `main` และทุก pull request โดยใช้การกำหนดขอบเขตอัจฉริยะเพื่อข้ามงานที่มีค่าใช้จ่ายสูงเมื่อมีการเปลี่ยนแปลงเฉพาะในส่วนที่ไม่เกี่ยวข้อง

QA Lab มี lane ของ CI เฉพาะแยกออกจาก workflow แบบกำหนดขอบเขตอัจฉริยะหลัก
workflow `Parity gate` จะรันเมื่อมีการเปลี่ยนแปลง PR ที่ตรงเงื่อนไขและเมื่อสั่งรันด้วยตนเอง
โดยจะ build runtime QA แบบ private และเปรียบเทียบ agentic pack ของ mock GPT-5.4 และ Opus 4.6
workflow `QA-Lab - All Lanes` จะรันทุกคืนบน `main` และเมื่อสั่งรันด้วยตนเอง
โดยจะแตกงานออกเป็น mock parity gate, live Matrix lane และ live Telegram lane เป็นงานแบบขนาน
งาน live ใช้ environment `qa-live-shared`
และ Telegram lane ใช้ Convex leases `OpenClaw Release
Checks` ยังรัน lane ของ QA Lab ชุดเดียวกันก่อนอนุมัติ release ด้วย

workflow `Duplicate PRs After Merge` เป็น workflow สำหรับ maintainer ที่สั่งรันด้วยตนเองเพื่อจัดการ PR ซ้ำหลัง merge
ค่าเริ่มต้นคือ dry-run และจะปิดเฉพาะ PR ที่ระบุไว้อย่างชัดเจนเมื่อ `apply=true`
ก่อนเปลี่ยนแปลงสถานะบน GitHub ระบบจะตรวจสอบว่า PR ที่ merge ไปแล้วอยู่ในสถานะ merged จริง
และตรวจสอบว่าแต่ละ PR ที่ซ้ำกันมี referenced issue ร่วมกันหรือมี hunk ที่เปลี่ยนแปลงทับซ้อนกัน

workflow `Docs Agent` เป็น lane บำรุงรักษา Codex แบบขับเคลื่อนด้วยเหตุการณ์สำหรับคงความสอดคล้องของเอกสารที่มีอยู่กับการเปลี่ยนแปลงที่เพิ่ง merge ไป
ไม่มีตารางเวลาตายตัว: การรัน CI ที่สำเร็จจากการ push ไปยัง `main` ที่ไม่ใช่บอทสามารถ trigger ได้
และ manual dispatch สามารถรันได้โดยตรง
การเรียกผ่าน workflow-run จะถูกข้ามเมื่อ `main` เดินหน้าไปแล้ว หรือเมื่อมีการสร้าง Docs Agent run แบบไม่ถูกข้ามภายในหนึ่งชั่วโมงที่ผ่านมา
เมื่อมันรัน ระบบจะตรวจสอบช่วง commit ตั้งแต่ source SHA ของ Docs Agent แบบไม่ถูกข้ามครั้งก่อนจนถึง `main` ปัจจุบัน
ดังนั้นการรันหนึ่งครั้งต่อชั่วโมงสามารถครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมมาตั้งแต่การผ่าน docs ครั้งก่อน

workflow `Test Performance Agent` เป็น lane บำรุงรักษา Codex แบบขับเคลื่อนด้วยเหตุการณ์สำหรับทดสอบที่ช้า
ไม่มีตารางเวลาตายตัว: การรัน CI ที่สำเร็จจากการ push ไปยัง `main` ที่ไม่ใช่บอทสามารถ trigger ได้
แต่จะข้ามหากมีการเรียกผ่าน workflow-run อีกตัวที่รันแล้วหรือกำลังรันอยู่ในวัน UTC เดียวกัน
manual dispatch จะข้าม activity gate รายวันนี้
lane นี้จะ build รายงานประสิทธิภาพ Vitest แบบ grouped ของ full suite
ให้ Codex แก้ไขเฉพาะประสิทธิภาพการทดสอบขนาดเล็กที่ยังคง coverage แทนการ refactor ขนาดใหญ่
จากนั้นรันรายงาน full suite อีกครั้งและปฏิเสธการเปลี่ยนแปลงที่ทำให้จำนวนการทดสอบ baseline ที่ผ่านลดลง
หาก baseline มีการทดสอบที่ล้มเหลว Codex อาจแก้ได้เฉพาะความล้มเหลวที่ชัดเจนเท่านั้น และรายงาน full suite หลัง agent ต้องผ่านก่อนที่จะมีการ commit อะไรก็ตาม
เมื่อ `main` เดินหน้าต่อก่อนที่ bot push จะลงได้ lane นี้จะ rebase patch ที่ผ่านการตรวจสอบแล้ว รัน `pnpm check:changed` อีกครั้ง และลอง push ใหม่
patch เก่าที่ขัดแย้งจะถูกข้าม
มันใช้ GitHub-hosted Ubuntu เพื่อให้ Codex action รักษาแนวทางความปลอดภัย drop-sudo แบบเดียวกับ docs agent ได้

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ภาพรวมของงาน

| งาน                              | วัตถุประสงค์                                                                                 | ช่วงเวลาที่รัน                        |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงเฉพาะ docs, ขอบเขตที่เปลี่ยนแปลง, extensions ที่เปลี่ยนแปลง และสร้าง CI manifest | รันเสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-scm-fast`              | ตรวจจับ private key และ audit workflow ผ่าน `zizmor`                                          | รันเสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-dependency-audit`      | audit lockfile ของ production แบบไม่พึ่ง dependency เทียบกับ npm advisories                  | รันเสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-fast`                  | งาน aggregate ที่จำเป็นสำหรับงาน security แบบเร็ว                                             | รันเสมอบน push และ PR ที่ไม่ใช่ draft |
| `build-artifacts`                | build `dist/`, Control UI, การตรวจสอบ built-artifact และ artifacts สำหรับ downstream แบบใช้ซ้ำ | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวกับ Node |
| `checks-fast-core`               | lane ความถูกต้องบน Linux แบบเร็ว เช่น bundled/plugin-contract/protocol checks                 | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวกับ Node |
| `checks-fast-contracts-channels` | การตรวจสอบสัญญาของ channels แบบ sharded พร้อมผล aggregate check ที่เสถียร                    | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวกับ Node |
| `checks-node-extensions`         | test shards ของ bundled-plugin แบบเต็มทั่วทั้งชุด extension                                  | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวกับ Node |
| `checks-node-core-test`          | test shards ของ core บน Node โดยไม่รวม lane ของ channel, bundled, contract และ extension      | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวกับ Node |
| `extension-fast`                 | การทดสอบแบบเจาะจงสำหรับ bundled plugins ที่เปลี่ยนแปลงเท่านั้น                               | pull request ที่มีการเปลี่ยนแปลง extension |
| `check`                          | ตัวเทียบเท่า local gate หลักแบบ sharded: prod types, lint, guards, test types และ strict smoke | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวกับ Node |
| `check-additional`               | shards สำหรับ architecture, boundary, extension-surface guards, package-boundary และ gateway-watch | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวกับ Node |
| `build-smoke`                    | การทดสอบ smoke ของ CLI ที่ build แล้วและ smoke ด้านหน่วยความจำตอนเริ่มต้น                     | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวกับ Node |
| `checks`                         | ตัวตรวจสอบสำหรับ built-artifact channel tests พร้อมความเข้ากันได้กับ Node 22 แบบเฉพาะ push   | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวกับ Node |
| `check-docs`                     | ตรวจสอบการจัดรูปแบบ docs, lint และลิงก์เสีย                                                 | เมื่อ docs มีการเปลี่ยนแปลง            |
| `skills-python`                  | Ruff + pytest สำหรับ Skills ที่รองรับด้วย Python                                              | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Python skill |
| `checks-windows`                 | lane ทดสอบเฉพาะ Windows                                                                       | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows |
| `macos-node`                     | lane ทดสอบ TypeScript บน macOS โดยใช้ built artifacts ชุดเดียวกัน                            | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS |
| `macos-swift`                    | lint, build และทดสอบ Swift สำหรับแอป macOS                                                   | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS |
| `android`                        | Android unit tests สำหรับทั้งสอง flavor พร้อม debug APK build หนึ่งตัว                        | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Android |
| `test-performance-agent`         | การปรับประสิทธิภาพทดสอบที่ช้าแบบรายวันโดย Codex หลังจากมีกิจกรรมที่เชื่อถือได้               | เมื่อ main CI สำเร็จหรือเมื่อสั่งรันด้วยตนเอง |

## ลำดับการ fail-fast

งานต่าง ๆ ถูกจัดลำดับเพื่อให้การตรวจสอบราคาถูกล้มเหลวก่อนที่งานราคาแพงจะเริ่มรัน:

1. `preflight` เป็นตัวตัดสินว่าจะมี lane ใดบ้าง `docs-scope` และ `changed-scope` เป็น step ภายในงานนี้ ไม่ใช่งานแยก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` ล้มเหลวได้อย่างรวดเร็วโดยไม่ต้องรอ artifact และงาน matrix ของแพลตฟอร์มที่หนักกว่า
3. `build-artifacts` ทำงานซ้อนกับ lane Linux แบบเร็ว เพื่อให้ผู้ใช้ downstream เริ่มทำงานได้ทันทีที่ shared build พร้อม
4. จากนั้น lane ของแพลตฟอร์มและ runtime ที่หนักกว่าจะกระจายงานออกไป: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` เฉพาะ PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

ตรรกะการกำหนดขอบเขตอยู่ใน `scripts/ci-changed-scope.mjs` และมี unit tests ครอบคลุมใน `src/scripts/ci-changed-scope.test.ts`
การแก้ไข workflow ของ CI จะตรวจสอบกราฟ Node CI และ workflow linting แต่ไม่ได้บังคับให้รัน native build ของ Windows, Android หรือ macOS ด้วยตัวมันเอง; lane ของแพลตฟอร์มเหล่านั้นยังคงถูกกำหนดขอบเขตตามการเปลี่ยนแปลงของซอร์สโค้ดของแพลตฟอร์มนั้น
การแก้ไขเฉพาะการกำหนดเส้นทางของ CI, การแก้ไข fixture ของ core-test แบบราคาถูกบางรายการ และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ จะใช้เส้นทาง manifest แบบ Node-only ที่รวดเร็ว: preflight, security และงาน `checks-fast-core` เพียงงานเดียว เส้นทางนี้หลีกเลี่ยง build artifacts, ความเข้ากันได้กับ Node 22, channel contracts, full core shards, bundled-plugin shards และ additional guard matrices เมื่อไฟล์ที่เปลี่ยนแปลงจำกัดอยู่เฉพาะพื้นผิวการกำหนดเส้นทางหรือ helper ที่งานแบบเร็วนี้ตรวจสอบโดยตรง
การตรวจสอบ Node บน Windows ถูกกำหนดขอบเขตไปยัง wrapper ของ process/path ที่เฉพาะกับ Windows, helper ของ npm/pnpm/UI runner, config ของ package manager และพื้นผิว workflow ของ CI ที่รัน lane นั้น; การเปลี่ยนแปลงซอร์สโค้ด, plugin, install-smoke และการเปลี่ยนแปลงเฉพาะการทดสอบที่ไม่เกี่ยวข้อง จะยังคงอยู่บน lane ของ Linux Node เพื่อไม่ให้ต้องจอง Windows worker 16-vCPU สำหรับ coverage ที่ถูกตรวจสอบอยู่แล้วโดย test shards ปกติ
workflow `install-smoke` ที่แยกออกมาต่างหากนำสคริปต์กำหนดขอบเขตเดียวกันกลับมาใช้ผ่านงาน `preflight` ของตัวเอง มันแบ่ง smoke coverage เป็น `run_fast_install_smoke` และ `run_full_install_smoke` pull request จะรันเส้นทางแบบเร็วสำหรับพื้นผิว Docker/package, การเปลี่ยนแปลง package/manifest ของ bundled plugin และพื้นผิว core plugin/channel/Gateway/Plugin SDK ที่งาน Docker smoke ใช้งาน การเปลี่ยนแปลง bundled plugin ที่เป็น source-only, การแก้ไขเฉพาะการทดสอบ และการแก้ไขเฉพาะ docs จะไม่จอง Docker workers เส้นทางแบบเร็วจะ build อิมเมจ Dockerfile ระดับรากหนึ่งครั้ง, ตรวจสอบ CLI, รัน agents delete shared-workspace CLI smoke, รัน container gateway-network e2e, ตรวจสอบ bundled extension build arg และรัน bounded bundled-plugin Docker profile ภายใต้ timeout รวมของคำสั่ง 240 วินาที โดยแต่ละสถานการณ์ของ Docker run มีการจำกัดเวลาแยกต่างหาก เส้นทางแบบเต็มยังคง coverage ของการติดตั้ง package ผ่าน QR และ installer Docker/update ไว้สำหรับการรันตามกำหนดเวลาตอนกลางคืน, manual dispatches, workflow-call release checks และ pull requests ที่แตะพื้นผิว installer/package/Docker จริง ๆ การ push ไปยัง `main` รวมถึง merge commits จะไม่บังคับให้ใช้เส้นทางแบบเต็ม; เมื่อ changed-scope logic ต้องการ full coverage บน push workflow จะยังคงใช้ Docker smoke แบบเร็ว และปล่อย full install smoke ให้ไปรันใน nightly หรือ release validation แทน smoke ของ image-provider สำหรับ Bun global install ที่ช้า ถูกกั้นแยกด้วย `run_bun_global_install_smoke`; มันรันตาม schedule ตอนกลางคืนและจาก workflow release checks และ manual `install-smoke` dispatches สามารถเลือกเปิดได้ แต่ pull requests และ `main` pushes จะไม่รันมัน การทดสอบ QR และ installer Docker ยังคงมี Dockerfiles ที่เน้นการติดตั้งของตัวเอง Local `test:docker:all` จะ prebuild อิมเมจ live-test ที่ใช้ร่วมกันหนึ่งตัวและอิมเมจ built-app จาก `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันอีกหนึ่งตัว จากนั้นรัน live/E2E smoke lanes ด้วย weighted scheduler และ `OPENCLAW_SKIP_DOCKER_BUILD=1`; ปรับจำนวน slot เริ่มต้นของ main-pool ที่ 10 ได้ด้วย `OPENCLAW_DOCKER_ALL_PARALLELISM` และจำนวน slot ของ tail-pool ที่ไวต่อ provider ซึ่งเริ่มต้นที่ 10 ได้ด้วย `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` ขีดจำกัดของ heavy lane มีค่าเริ่มต้นเป็น `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` เพื่อไม่ให้ lane ของ npm install และ multi-service ใช้ Docker มากเกินไป ขณะที่ lane ที่เบากว่ายังเติม slot ที่มีอยู่ได้ การเริ่ม lane จะถูกหน่วงห่างกัน 2 วินาทีโดยค่าเริ่มต้น เพื่อหลีกเลี่ยง create storms ของ local Docker daemon; override ได้ด้วย `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` หรือค่าอื่นเป็นมิลลิวินาที local aggregate จะ preflight Docker, ลบ OpenClaw E2E containers ที่ค้างอยู่, แสดงสถานะ active-lane, เก็บเวลาของ lane เพื่อใช้จัดลำดับ longest-first และรองรับ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` สำหรับตรวจสอบ scheduler โดยค่าเริ่มต้น มันจะหยุดจัดคิว pooled lanes ใหม่หลังเกิดความล้มเหลวครั้งแรก และแต่ละ lane มี fallback timeout 120 นาที ซึ่ง override ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; live/tail lanes บางรายการใช้ขีดจำกัดต่อ lane ที่เข้มกว่า workflow live/E2E แบบใช้ซ้ำจะสะท้อนรูปแบบ shared-image โดย build และ push อิมเมจ GHCR Docker E2E ที่ติดแท็กด้วย SHA หนึ่งตัวก่อน Docker matrix จากนั้นรัน matrix ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` workflow live/E2E ตามกำหนดการจะรัน Docker suite แบบ release-path เต็มทุกวัน bundled update matrix ถูกแยกตาม update target เพื่อให้รอบการรัน npm update และ doctor repair ที่ซ้ำกันสามารถ shard ร่วมกับ bundled checks อื่น ๆ ได้

ตรรกะ changed-lane บนเครื่อง local อยู่ใน `scripts/changed-lanes.mjs` และถูกรันโดย `scripts/check-changed.mjs` local gate นี้เข้มงวดกว่า CI platform scope แบบกว้างในเรื่อง architecture boundaries: การเปลี่ยนแปลง production ของ core จะรัน core prod typecheck พร้อม core tests, การเปลี่ยนแปลงเฉพาะ test ของ core จะรันเฉพาะ core test typecheck/tests, การเปลี่ยนแปลง production ของ extension จะรัน extension prod typecheck พร้อม extension tests และการเปลี่ยนแปลงเฉพาะ test ของ extension จะรันเฉพาะ extension test typecheck/tests การเปลี่ยนแปลง public Plugin SDK หรือ plugin-contract จะขยายไปสู่การตรวจสอบ extension เพราะ extensions พึ่งพา core contracts เหล่านั้น การ bump เวอร์ชันที่เป็น release metadata-only จะรัน targeted version/config/root-dependency checks การเปลี่ยนแปลง root/config ที่ไม่รู้จักจะ fail safe ไปยังทุก lanes

บน pushes, matrix `checks` จะเพิ่ม lane `compat-node22` ที่ใช้เฉพาะ push บน pull requests lane นี้จะถูกข้าม และ matrix จะยังคงเน้นที่ lane ทดสอบ/channel ตามปกติ

ตระกูลการทดสอบ Node ที่ช้าที่สุดถูกแยกหรือปรับสมดุลเพื่อให้งานแต่ละงานมีขนาดเล็กโดยไม่จอง runners มากเกินไป: channel contracts รันเป็น weighted shards สามชุด, bundled plugin tests ปรับสมดุลข้าม extension workers หกตัว, small core unit lanes ถูกจับคู่กัน, auto-reply รันเป็น workers ที่สมดุลสามตัวแทนที่จะเป็น workers เล็ก ๆ หกตัว และการกำหนดค่า agentic gateway/plugin ถูกกระจายไปตาม source-only agentic Node jobs ที่มีอยู่แทนที่จะรอ built artifacts การทดสอบ browser, QA, media และ miscellaneous plugin แบบกว้าง ใช้ Vitest configs เฉพาะของตัวเองแทน shared plugin catch-all งาน extension shard จะรันได้สูงสุดสอง plugin config groups พร้อมกัน โดยมี Vitest worker หนึ่งตัวต่อ group และ Node heap ที่ใหญ่ขึ้น เพื่อไม่ให้ชุด plugin ที่มี imports หนักสร้างงาน CI เพิ่มขึ้น agents lane แบบกว้างใช้ shared Vitest file-parallel scheduler เพราะถูกครอบงำโดย imports/scheduling มากกว่าจะเป็นไฟล์ทดสอบช้าไฟล์เดียว `runtime-config` รันร่วมกับ infra core-runtime shard เพื่อไม่ให้ shared runtime shard กลายเป็นตัวถ่วงท้าย `check-additional` รวมงาน compile/canary ของ package-boundary ไว้ด้วยกัน และแยก runtime topology architecture ออกจาก gateway watch coverage; boundary guard shard จะรัน guards อิสระขนาดเล็กของมันพร้อมกันภายในงานเดียว Gateway watch, channel tests และ core support-boundary shard จะรันพร้อมกันภายใน `build-artifacts` หลังจาก build `dist/` และ `dist-runtime/` เสร็จแล้ว โดยคงชื่อ check เดิมของพวกมันไว้เป็นงาน verifier แบบเบา พร้อมหลีกเลี่ยง Blacksmith workers เพิ่มอีกสองตัวและคิว artifact-consumer ชุดที่สอง
Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` จากนั้น build Play debug APK flavor แบบ third-party ไม่มี source set หรือ manifest แยกต่างหาก; lane unit-test ของมันยังคงคอมไพล์ flavor นั้นด้วย flags ของ SMS/call-log ใน BuildConfig ขณะเดียวกันก็หลีกเลี่ยงงาน packaging ของ debug APK ที่ซ้ำซ้อนในทุก push ที่เกี่ยวข้องกับ Android
`extension-fast` เป็น PR-only เพราะการรันบน push มี full bundled plugin shards อยู่แล้ว วิธีนี้ทำให้ได้ feedback สำหรับ plugins ที่เปลี่ยนแปลงระหว่างการ review โดยไม่ต้องจอง Blacksmith worker เพิ่มบน `main` สำหรับ coverage ที่มีอยู่แล้วใน `checks-node-extensions`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่ว่า `cancelled` เมื่อมี push ใหม่กว่ามาถึง PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่านี่เป็น CI noise เว้นแต่ run ล่าสุดสำหรับ ref เดียวกันนั้นจะล้มเหลวด้วย Aggregate shard checks ใช้ `!cancelled() && always()` ดังนั้นมันยังรายงาน shard failures ปกติได้ แต่จะไม่เข้าคิวหลังจาก workflow ทั้งหมดถูกแทนที่ไปแล้ว
คีย์ concurrency ของ CI มีการใส่เวอร์ชัน (`CI-v7-*`) เพื่อไม่ให้ zombie ฝั่ง GitHub ใน queue group เก่า บล็อก main runs ที่ใหม่กว่าได้ไม่มีกำหนด

## Runners

| Runner                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, งาน security แบบเร็วและ aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจสอบ protocol/contract/bundled แบบเร็ว, การตรวจสอบ channel contract แบบ sharded, shards ของ `check` ยกเว้น lint, shards และ aggregate ของ `check-additional`, ตัว verifier aggregate ของ Node test, การตรวจสอบ docs, Python Skills, workflow-sanity, labeler, auto-response; preflight ของ install-smoke ก็ใช้ GitHub-hosted Ubuntu ด้วย เพื่อให้ Blacksmith matrix เข้าคิวได้เร็วขึ้น |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, ซึ่งยังคงไวต่อ CPU มากพอจนการใช้ 8 vCPU มีต้นทุนมากกว่าที่ช่วยประหยัดได้; install-smoke Docker builds ซึ่งเวลาเข้าคิวของ 32-vCPU มีต้นทุนมากกว่าที่ช่วยประหยัดได้                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; forks จะ fallback ไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; forks จะ fallback ไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |

## คำสั่งเทียบเท่าบนเครื่อง local

```bash
pnpm changed:lanes   # ตรวจสอบตัวจัดประเภท changed-lane บนเครื่องสำหรับ origin/main...HEAD
pnpm check:changed   # local gate อัจฉริยะ: typecheck/lint/tests ที่เปลี่ยนแปลงตาม boundary lane
pnpm check          # local gate แบบเร็ว: production tsgo + sharded lint + fast guards แบบขนาน
pnpm check:test-types
pnpm check:timed    # gate เดียวกันพร้อมเวลาแยกตามแต่ละขั้น
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # การทดสอบ vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format + lint + broken links ของ docs
pnpm build          # build dist เมื่อ lane ของ CI ที่เกี่ยวกับ artifact/build-smoke มีความสำคัญ
node scripts/ci-run-timings.mjs <run-id>      # สรุป wall time, queue time และงานที่ช้าที่สุด
node scripts/ci-run-timings.mjs --recent 10   # เปรียบเทียบ main CI runs ที่สำเร็จล่าสุด
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทาง release](/th/install/development-channels)
