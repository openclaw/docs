---
read_when:
    - คุณต้องเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังแก้ไขข้อบกพร่องของการตรวจสอบ GitHub Actions ที่ล้มเหลว
summary: กราฟงาน CI, scope gates และคำสั่งในเครื่องที่เทียบเท่ากัน
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-04-26T11:25:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a6c14f785434585f2b3a72bcd2cff3a281e51fe12cc4c14aa7613d47cd8efc4
    source_path: ci.md
    workflow: 15
---

CI จะทำงานทุกครั้งที่มีการ push ไปยัง `main` และทุก pull request โดยใช้การกำหนดขอบเขตอัจฉริยะเพื่อข้ามงานที่มีค่าใช้จ่ายสูงเมื่อมีการเปลี่ยนแปลงเฉพาะส่วนที่ไม่เกี่ยวข้องเท่านั้น

QA Lab มี lane ของ CI โดยเฉพาะแยกออกจาก workflow หลักที่ใช้การกำหนดขอบเขตอัจฉริยะ โดย workflow `Parity gate` จะทำงานเมื่อมีการเปลี่ยนแปลง PR ที่ตรงเงื่อนไขและเมื่อสั่งรันด้วยตนเอง; มันจะ build runtime QA แบบ private และเปรียบเทียบแพ็ก agentic ของ mock GPT-5.5 และ Opus 4.6 ส่วน workflow `QA-Lab - All Lanes` จะทำงานทุกคืนบน `main` และเมื่อสั่งรันด้วยตนเอง; มันจะแตกงานออกเป็น mock parity gate, live Matrix lane และ live Telegram lane แบบขนาน งานแบบ live จะใช้ environment `qa-live-shared` และ Telegram lane จะใช้ Convex leases นอกจากนี้ `OpenClaw Release Checks` ก็จะรัน lane ของ QA Lab เดียวกันก่อนการอนุมัติ release ด้วย

workflow `Duplicate PRs After Merge` เป็น workflow สำหรับผู้ดูแลที่รันด้วยตนเองเพื่อจัดการ PR ซ้ำหลังการ merge โดยมีค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุไว้อย่างชัดเจนเมื่อ `apply=true` ก่อนที่จะเปลี่ยนแปลงสถานะบน GitHub ระบบจะตรวจสอบว่า PR ที่ land แล้วถูก merge เรียบร้อย และแต่ละรายการที่ซ้ำกันมี issue อ้างอิงร่วมกันหรือมี hunk การเปลี่ยนแปลงที่ทับซ้อนกัน

workflow `Docs Agent` เป็น lane การบำรุงรักษา Codex ที่ขับเคลื่อนด้วยเหตุการณ์ เพื่อคงความสอดคล้องของเอกสารที่มีอยู่กับการเปลี่ยนแปลงที่เพิ่ง land ไป โดยไม่มี schedule ล้วน ๆ: การรัน CI ที่สำเร็จจากการ push แบบ non-bot บน `main` สามารถเป็นตัวกระตุ้นได้ และการสั่งรันด้วยตนเองสามารถเรียกใช้โดยตรงได้ การเรียกใช้แบบ workflow-run จะข้ามเมื่อ `main` มีการเปลี่ยนแปลงต่อจากนั้นแล้ว หรือเมื่อมี Docs Agent run แบบ non-skipped อื่นถูกสร้างขึ้นในช่วงหนึ่งชั่วโมงที่ผ่านมา เมื่อมันทำงาน มันจะตรวจสอบช่วง commit ตั้งแต่ source SHA ของ Docs Agent แบบ non-skipped ครั้งก่อนจนถึง `main` ปัจจุบัน ดังนั้นการรันหนึ่งครั้งต่อชั่วโมงจึงครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมมาตั้งแต่การผ่านเอกสารครั้งล่าสุดได้

workflow `Test Performance Agent` เป็น lane การบำรุงรักษา Codex ที่ขับเคลื่อนด้วยเหตุการณ์สำหรับการทดสอบที่ช้า โดยไม่มี schedule ล้วน ๆ: การรัน CI ที่สำเร็จจากการ push แบบ non-bot บน `main` สามารถเป็นตัวกระตุ้นได้ แต่จะข้ามหากมีการเรียกใช้แบบ workflow-run อื่นที่ได้รันไปแล้วหรือกำลังรันอยู่ในวัน UTC นั้น การสั่งรันด้วยตนเองจะข้าม daily activity gate นี้ lane นี้จะ build รายงานประสิทธิภาพ Vitest แบบ full-suite ที่จัดกลุ่มไว้ เปิดให้ Codex ทำเฉพาะการแก้ไขประสิทธิภาพการทดสอบขนาดเล็กที่ยังคง coverage แทนการรีแฟกเตอร์ขนาดใหญ่ จากนั้นจึงรันรายงาน full-suite อีกครั้งและปฏิเสธการเปลี่ยนแปลงที่ทำให้จำนวนการทดสอบพื้นฐานที่ผ่านลดลง หาก baseline มีการทดสอบที่ล้มเหลวอยู่แล้ว Codex สามารถแก้ได้เฉพาะความล้มเหลวที่เห็นได้ชัด และรายงาน full-suite หลังการทำงานของเอเจนต์ต้องผ่านก่อนจึงจะ commit อะไรได้ เมื่อ `main` เปลี่ยนไปก่อนที่ bot push จะ land lane นี้จะ rebase แพตช์ที่ตรวจสอบแล้ว รัน `pnpm check:changed` อีกครั้ง และพยายาม push ใหม่; แพตช์เก่าที่มี conflict จะถูกข้าม มันใช้ GitHub-hosted Ubuntu เพื่อให้ action ของ Codex รักษาแนวปฏิบัติด้านความปลอดภัยแบบ drop-sudo เดียวกับ docs agent ได้

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ภาพรวมของงาน

| งาน                              | วัตถุประสงค์                                                                                 | ทำงานเมื่อใด                           |
| -------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------- |
| `preflight`                      | ตรวจหาการเปลี่ยนแปลงเฉพาะ docs, ขอบเขตที่เปลี่ยน, extensions ที่เปลี่ยน และสร้าง CI manifest | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-scm-fast`              | ตรวจจับ private key และตรวจสอบ workflow ผ่าน `zizmor`                                        | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-dependency-audit`      | ตรวจสอบ production lockfile โดยไม่พึ่ง dependency เทียบกับ npm advisories                     | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-fast`                  | งานรวมที่จำเป็นสำหรับงานความปลอดภัยแบบรวดเร็ว                                                | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `build-artifacts`                | build `dist/`, Control UI, การตรวจสอบ built-artifact และ artifacts แบบใช้ซ้ำสำหรับงานปลายทาง   | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks-fast-core`               | lane ตรวจสอบความถูกต้องบน Linux แบบรวดเร็ว เช่น bundled/plugin-contract/protocol checks       | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks-fast-contracts-channels` | การตรวจสอบ channel contract แบบ sharded พร้อมผลตรวจสอบรวมที่คงที่                            | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks-node-extensions`         | shard การทดสอบ bundled-plugin แบบเต็มสำหรับทั้งชุด extension                                  | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks-node-core-test`          | shard การทดสอบ Node core โดยไม่รวม lane ของ channel, bundled, contract และ extension          | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `extension-fast`                 | การทดสอบแบบเจาะจงสำหรับ bundled plugins ที่เปลี่ยนเท่านั้น                                    | Pull requests ที่มีการเปลี่ยนแปลง extension |
| `check`                          | งานเทียบเท่า local gate หลักแบบ sharded: prod types, lint, guards, test types และ strict smoke | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `check-additional`               | shard ของ architecture, boundary, extension-surface guards, package-boundary และ gateway-watch | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `build-smoke`                    | การทดสอบ smoke ของ CLI ที่ build แล้วและ smoke ด้านหน่วยความจำขณะเริ่มต้น                     | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `checks`                         | ตัวตรวจสอบสำหรับการทดสอบ channel ของ built-artifact พร้อมความเข้ากันได้กับ Node 22 เฉพาะ push | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node |
| `check-docs`                     | การจัดรูปแบบ docs, lint และตรวจสอบลิงก์เสีย                                                  | เมื่อ docs มีการเปลี่ยนแปลง               |
| `skills-python`                  | Ruff + pytest สำหรับ Skills ที่รองรับด้วย Python                                               | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Python skill |
| `checks-windows`                 | lane การทดสอบเฉพาะ Windows                                                                    | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows |
| `macos-node`                     | lane การทดสอบ TypeScript บน macOS โดยใช้ built artifacts ที่ใช้ร่วมกัน                         | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS |
| `macos-swift`                    | Swift lint, build และ tests สำหรับแอป macOS                                                   | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS |
| `android`                        | Android unit tests สำหรับทั้งสอง flavor พร้อมการ build debug APK หนึ่งชุด                      | เมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องกับ Android |
| `test-performance-agent`         | การปรับประสิทธิภาพการทดสอบที่ช้ารายวันโดย Codex หลังจากมีกิจกรรมที่เชื่อถือได้               | เมื่อ Main CI สำเร็จหรือสั่งรันด้วยตนเอง   |

## ลำดับ fail-fast

งานต่าง ๆ ถูกจัดลำดับเพื่อให้การตรวจสอบราคาถูกกว่าล้มเหลวก่อนที่งานราคาแพงจะเริ่มทำงาน:

1. `preflight` ตัดสินว่า lane ใดจะมีอยู่บ้าง ตรรกะ `docs-scope` และ `changed-scope` เป็นขั้นตอนภายในงานนี้ ไม่ใช่งานแยก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` ล้มเหลวได้อย่างรวดเร็วโดยไม่ต้องรอ artifact และงาน matrix ของแพลตฟอร์มที่หนักกว่า
3. `build-artifacts` ทำงานซ้อนกับ lane Linux แบบรวดเร็ว เพื่อให้ผู้ใช้ปลายทาง downstream เริ่มทำงานได้ทันทีที่ shared build พร้อม
4. จากนั้น lane ของแพลตฟอร์มและรันไทม์ที่หนักกว่าจะกระจายออกแบบขนาน: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` เฉพาะ PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

ตรรกะของ scope อยู่ใน `scripts/ci-changed-scope.mjs` และมี unit tests ครอบคลุมใน `src/scripts/ci-changed-scope.test.ts`
การแก้ไข CI workflow จะตรวจสอบกราฟ Node CI และ workflow linting แต่จะไม่บังคับให้รัน Windows, Android หรือ macOS native builds ด้วยตัวมันเอง; lane ของแต่ละแพลตฟอร์มยังคงผูกกับการเปลี่ยนแปลงของซอร์สเฉพาะแพลตฟอร์มนั้น
การแก้ไขเฉพาะ CI routing, การแก้ไข fixture ของ core-test แบบเลือกเฉพาะที่มีต้นทุนต่ำ, และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ จะใช้เส้นทาง manifest แบบ fast Node-only: preflight, security และงาน `checks-fast-core` เพียงงานเดียว เส้นทางนี้จะหลีกเลี่ยง build artifacts, ความเข้ากันได้กับ Node 22, channel contracts, full core shards, bundled-plugin shards และ additional guard matrices เมื่อไฟล์ที่เปลี่ยนมีจำกัดอยู่เฉพาะพื้นผิว routing หรือ helper ที่งานแบบเร็วตรวจสอบโดยตรง
การตรวจสอบ Windows Node จะจำกัด scope ไปยัง process/path wrappers เฉพาะ Windows, npm/pnpm/UI runner helpers, การกำหนดค่า package manager และพื้นผิวของ CI workflow ที่ใช้รัน lane นั้น; การเปลี่ยนแปลงซอร์ส, Plugin, install-smoke และการเปลี่ยนแปลงเฉพาะ tests ที่ไม่เกี่ยวข้องจะยังคงอยู่ใน Linux Node lanes เพื่อไม่ให้จอง Windows worker แบบ 16-vCPU สำหรับ coverage ที่ถูกตรวจอยู่แล้วโดย test shards ปกติ
workflow `install-smoke` แยกต่างหากจะใช้ scope script เดียวกันซ้ำผ่านงาน `preflight` ของตัวเอง โดยแยก smoke coverage ออกเป็น `run_fast_install_smoke` และ `run_full_install_smoke` pull requests จะใช้เส้นทางเร็วสำหรับพื้นผิว Docker/package, การเปลี่ยนแปลง package/manifest ของ bundled plugin และพื้นผิว core plugin/channel/gateway/Plugin SDK ที่งาน Docker smoke ใช้ตรวจสอบ การเปลี่ยนแปลง bundled plugin แบบ source-only, การแก้ไขเฉพาะ tests และการแก้ไขเฉพาะ docs จะไม่จอง Docker workers เส้นทางเร็วจะ build อิมเมจ root Dockerfile หนึ่งครั้ง ตรวจสอบ CLI รัน smoke ของ CLI สำหรับ agents delete shared-workspace รัน e2e ของ container gateway-network ตรวจสอบ bundled extension build arg และรัน bounded bundled-plugin Docker profile ภายใต้ command timeout รวม 240 วินาที โดยแต่ละสถานการณ์มีการจำกัดเวลา Docker run แยกกัน เส้นทางเต็มจะคง coverage ของ QR package install และ installer Docker/update ไว้สำหรับการรันตาม schedule รายคืน, manual dispatches, workflow-call release checks และ pull requests ที่แตะพื้นผิว installer/package/Docker จริง ๆ การ push ไปยัง `main` รวมถึง merge commits จะไม่บังคับเส้นทางเต็ม; เมื่อ changed-scope logic ต้องการ full coverage บน push workflow จะยังคงใช้ fast Docker smoke และปล่อย full install smoke ให้กับการตรวจสอบรายคืนหรือการตรวจสอบ release smoke ของ Bun global install image-provider ที่ช้าจะถูกควบคุมแยกต่างหากด้วย `run_bun_global_install_smoke`; มันจะรันตาม schedule รายคืนและจาก workflow ของ release checks และ manual `install-smoke` dispatches สามารถเลือกเปิดใช้ได้ แต่ pull requests และการ push ไปยัง `main` จะไม่รันมัน การทดสอบ QR และ installer Docker ยังคงใช้ Dockerfiles ที่เน้นการติดตั้งของตัวเอง ในเครื่อง `test:docker:all` จะ prebuild live-test image ที่ใช้ร่วมกันหนึ่งชุดและ built-app image จาก `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันอีกหนึ่งชุด จากนั้นรัน live/E2E smoke lanes ด้วย weighted scheduler และ `OPENCLAW_SKIP_DOCKER_BUILD=1`; ปรับจำนวน slot เริ่มต้นของ main-pool ที่ 10 ด้วย `OPENCLAW_DOCKER_ALL_PARALLELISM` และจำนวน slot ของ tail-pool ที่ไวต่อ provider ซึ่งตั้งต้นที่ 10 ด้วย `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` เพดานของ heavy lane มีค่าเริ่มต้นเป็น `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` และ `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` เพื่อไม่ให้ npm install และ lanes แบบหลายบริการใช้ Docker เกินกำลัง ขณะที่ lanes ที่เบากว่ายังคงใช้ slot ที่มีอยู่ได้เต็มที่ การเริ่ม lane จะถูกหน่วงห่างกัน 2 วินาทีโดยค่าเริ่มต้นเพื่อหลีกเลี่ยง create storm ของ Docker daemon ในเครื่อง; override ได้ด้วย `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` หรือค่ามิลลิวินาทีอื่น ตัวรวมในเครื่องจะ preflight Docker ลบ OpenClaw E2E containers เก่าที่ค้างอยู่ แสดงสถานะ active-lane บันทึกเวลาแต่ละ lane เพื่อจัดลำดับแบบ longest-first และรองรับ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` สำหรับตรวจสอบ scheduler โดยค่าเริ่มต้นมันจะหยุดจัดตาราง pooled lanes ใหม่หลังจากความล้มเหลวครั้งแรก และแต่ละ lane มี fallback timeout 120 นาที ซึ่ง override ได้ด้วย `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; live/tail lanes บางรายการใช้เพดานต่อ lane ที่ต่ำกว่า reusable live/E2E workflow สะท้อนรูปแบบ shared-image โดย build และ push Docker E2E image ที่ติดแท็ก SHA ไปยัง GHCR หนึ่งครั้งก่อน Docker matrix จากนั้นจึงรัน matrix ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` scheduled live/E2E workflow จะรัน release-path Docker suite แบบเต็มทุกวัน bundled update matrix ถูกแยกตาม update target เพื่อให้การรัน npm update ซ้ำและ doctor repair passes สามารถ shard ร่วมกับ bundled checks อื่นได้

ตรรกะ changed-lane ในเครื่องอยู่ใน `scripts/changed-lanes.mjs` และถูกเรียกใช้โดย `scripts/check-changed.mjs` local gate นี้เข้มงวดกว่าการกำหนด scope ของแพลตฟอร์ม CI แบบกว้างในด้านขอบเขตสถาปัตยกรรม: การเปลี่ยนแปลง production ของ core จะรัน core prod typecheck พร้อม core tests, การเปลี่ยนแปลงเฉพาะ tests ของ core จะรันเฉพาะ core test typecheck/tests, การเปลี่ยนแปลง production ของ extension จะรัน extension prod typecheck พร้อม extension tests, และการเปลี่ยนแปลงเฉพาะ tests ของ extension จะรันเฉพาะ extension test typecheck/tests การเปลี่ยนแปลงใน public Plugin SDK หรือ plugin-contract จะขยายไปสู่การตรวจสอบ extension เพราะ extensions พึ่งพา core contracts เหล่านั้น version bumps ที่เป็น release metadata-only จะรัน targeted version/config/root-dependency checks ส่วนการเปลี่ยนแปลง root/config ที่ไม่รู้จักจะ fail safe ไปยังทุก lanes

บน pushes, matrix `checks` จะเพิ่ม lane `compat-node22` ที่รันเฉพาะ push ส่วนบน pull requests lane นี้จะถูกข้ามและ matrix จะเน้นเฉพาะ lanes การทดสอบ/channel ปกติ

ตระกูล Node tests ที่ช้าที่สุดถูกแยกหรือถ่วงดุลเพื่อให้งานแต่ละงานมีขนาดเล็กโดยไม่จอง runners เกินจำเป็น: channel contracts รันเป็นสาม weighted shards, bundled plugin tests ถ่วงดุลข้าม extension workers หกตัว, small core unit lanes ถูกจับคู่กัน, auto-reply รันเป็นสี่ workers แบบสมดุลโดยแยก subtree ของ reply ออกเป็น shards สำหรับ agent-runner, dispatch และ commands/state-routing และ agentic gateway/plugin configs ถูกกระจายไปยัง source-only agentic Node jobs ที่มีอยู่แทนที่จะรอ built artifacts browser, QA, media และ miscellaneous plugin tests แบบกว้างจะใช้ Vitest configs เฉพาะของตนเองแทน shared plugin catch-all งาน extension shard จะรันได้สูงสุดครั้งละสอง plugin config groups โดยมี Vitest worker หนึ่งตัวต่อกลุ่มและ Node heap ที่ใหญ่ขึ้น เพื่อให้ batches ของ Plugin ที่มี imports หนาแน่นไม่สร้างงาน CI เพิ่มเกินจำเป็น broad agents lane ใช้ shared Vitest file-parallel scheduler เพราะถูกครอบงำด้วย import/scheduling มากกว่าจะมีไฟล์ทดสอบช้าไฟล์เดียว `runtime-config` รันร่วมกับ infra core-runtime shard เพื่อไม่ให้ shared runtime shard กลายเป็นคอขวดท้ายสุด shards แบบ include-pattern จะบันทึก timing entries โดยใช้ชื่อ CI shard ดังนั้น `.artifacts/vitest-shard-timings.json` จึงสามารถแยกทั้ง config ออกจาก filtered shard ได้ `check-additional` จะเก็บงาน compile/canary ของ package-boundary ไว้ด้วยกัน และแยก runtime topology architecture ออกจาก gateway watch coverage; shard ของ boundary guard จะรัน guards อิสระขนาดเล็กของมันพร้อมกันภายในงานเดียว Gateway watch, channel tests และ core support-boundary shard จะรันพร้อมกันภายใน `build-artifacts` หลังจาก build `dist/` และ `dist-runtime/` แล้ว โดยคงชื่อ check เดิมของมันไว้เป็นงาน verifier น้ำหนักเบา ขณะเดียวกันก็หลีกเลี่ยง Blacksmith workers เพิ่มอีกสองตัวและคิว artifact-consumer ชุดที่สอง
Android CI จะรันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` จากนั้น build Play debug APK โดย third-party flavor ไม่มี source set หรือ manifest แยกต่างหาก; lane unit-test ของมันยังคง compile flavor นั้นพร้อม BuildConfig flags สำหรับ SMS/call-log ขณะเดียวกันก็หลีกเลี่ยงงาน package debug APK ซ้ำบนทุก push ที่เกี่ยวข้องกับ Android
`extension-fast` มีเฉพาะใน PR เพราะการรันบน push ได้รัน bundled plugin shards แบบเต็มอยู่แล้ว ซึ่งช่วยให้ได้ feedback สำหรับ Plugin ที่เปลี่ยนระหว่างการรีวิว โดยไม่ต้องจอง Blacksmith worker เพิ่มบน `main` สำหรับ coverage ที่มีอยู่แล้วใน `checks-node-extensions`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่ว่า `cancelled` เมื่อมี push ใหม่กว่ามาถึงบน PR หรือ ref `main` เดียวกัน ให้ถือว่านี่เป็น noise ของ CI เว้นแต่ว่าการรันล่าสุดสำหรับ ref เดียวกันนั้นก็ล้มเหลวด้วย aggregate shard checks ใช้ `!cancelled() && always()` เพื่อให้ยังรายงาน shard failures ปกติได้ แต่จะไม่เข้าคิวหลังจากทั้ง workflow ถูกแทนที่ไปแล้ว
คีย์ concurrency ของ CI มีการใส่เวอร์ชันไว้ (`CI-v7-*`) ดังนั้น zombie ฝั่ง GitHub ใน queue group เก่าจะไม่สามารถบล็อกการรันบน main ที่ใหม่กว่าได้ไม่มีกำหนด

## Runners

| Runner                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, งานความปลอดภัยแบบรวดเร็วและงานรวม (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจสอบ protocol/contract/bundled แบบรวดเร็ว, การตรวจสอบ channel contract แบบ sharded, shards ของ `check` ยกเว้น lint, shards และงานรวมของ `check-additional`, ตัวตรวจสอบรวมของ Node tests, การตรวจสอบ docs, Python Skills, workflow-sanity, labeler, auto-response; preflight ของ install-smoke ก็ใช้ GitHub-hosted Ubuntu เช่นกัน เพื่อให้ Blacksmith matrix เข้าคิวได้เร็วขึ้น |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` ซึ่งยังไวต่อ CPU มากพอจนการใช้ 8 vCPU มีต้นทุนมากกว่าที่ประหยัดได้; install-smoke Docker builds ซึ่งเวลาเข้าคิวของ 32-vCPU มีต้นทุนมากกว่าที่ประหยัดได้                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; forks จะ fallback ไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; forks จะ fallback ไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |

## คำสั่งในเครื่องที่เทียบเท่ากัน

```bash
pnpm changed:lanes   # ตรวจสอบตัวจัดประเภท changed-lane ในเครื่องสำหรับ origin/main...HEAD
pnpm check:changed   # local gate อัจฉริยะ: รัน typecheck/lint/tests ที่เปลี่ยนตาม boundary lane
pnpm check          # local gate แบบเร็ว: production tsgo + sharded lint + fast guards แบบขนาน
pnpm check:test-types
pnpm check:timed    # gate เดียวกันพร้อมเวลาในแต่ละขั้น
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # การทดสอบ vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format + lint + ตรวจสอบลิงก์เสียของ docs
pnpm build          # build dist เมื่อ lanes ของ CI artifact/build-smoke มีความสำคัญ
pnpm ci:timings                               # สรุปการรัน push CI ล่าสุดของ origin/main
pnpm ci:timings:recent                        # เปรียบเทียบการรัน main CI ที่สำเร็จล่าสุดหลายครั้ง
node scripts/ci-run-timings.mjs <run-id>      # สรุป wall time, queue time และงานที่ช้าที่สุด
node scripts/ci-run-timings.mjs --latest-main # ไม่สนใจ noise จาก issue/comment และเลือก push CI ของ origin/main
node scripts/ci-run-timings.mjs --recent 10   # เปรียบเทียบการรัน main CI ที่สำเร็จล่าสุด
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางรีลีส](/th/install/development-channels)
