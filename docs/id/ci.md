---
read_when:
    - Anda perlu memahami mengapa sebuah job CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
    - Anda sedang mengoordinasikan proses validasi rilis atau menjalankannya ulang
    - Anda mengubah dispatch ClawSweeper atau penerusan aktivitas GitHub
summary: Graf pekerjaan CI, gerbang cakupan, payung rilis, dan padanan perintah lokal
title: Pipeline CI
x-i18n:
    generated_at: "2026-06-30T14:25:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 885202dd0f52b237e93a520999ac98ef3ad0fc1f8a03ccaceae9d38a2a4aca3b
    source_path: ci.md
    workflow: 16
---

OpenClaw CI berjalan pada setiap push ke `main` dan setiap pull request. Push
`main` kanonis terlebih dahulu melewati jendela penerimaan hosted-runner selama 90 detik.
Grup concurrency `CI` yang ada membatalkan run yang sedang menunggu itu saat commit
yang lebih baru masuk, sehingga merge berurutan tidak masing-masing mendaftarkan
matriks Blacksmith penuh. Pull request dan dispatch manual melewati penantian tersebut. Job `preflight`
kemudian mengklasifikasikan diff dan mematikan lane mahal saat hanya area yang tidak terkait
berubah. Run `workflow_dispatch` manual sengaja melewati scoping cerdas
dan menyebarkan seluruh graph untuk kandidat rilis dan validasi luas.
Lane Android tetap opt-in melalui `include_android`. Cakupan Plugin khusus rilis
berada di workflow [`Plugin Prerelease`](#plugin-prerelease) terpisah
dan hanya berjalan dari [`Full Release Validation`](#full-release-validation)
atau dispatch manual eksplisit.

## Ikhtisar pipeline

| Job                                | Tujuan                                                                                                   | Kapan berjalan                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Mendeteksi perubahan khusus docs, scope yang berubah, extension yang berubah, dan membangun manifes CI                   | Selalu pada push dan PR non-draft                  |
| `runner-admission`                 | Debounce hosted 90 detik untuk push `main` kanonis sebelum pekerjaan Blacksmith didaftarkan                | Setiap run CI; sleep hanya pada push `main` kanonis |
| `security-fast`                    | Deteksi private key, audit workflow yang berubah melalui `zizmor`, dan audit lockfile produksi                 | Selalu pada push dan PR non-draft                  |
| `check-dependencies`               | Pass Knip khusus dependency produksi plus penjaga allowlist file yang tidak digunakan                                 | Perubahan yang relevan dengan Node                               |
| `build-artifacts`                  | Membangun `dist/`, Control UI, pemeriksaan smoke built-CLI, pemeriksaan artefak build tertanam, dan artefak yang dapat digunakan ulang | Perubahan yang relevan dengan Node                               |
| `checks-fast-core`                 | Lane kebenaran Linux cepat seperti bundled, protocol, QA Smoke CI, dan pemeriksaan routing CI                | Perubahan yang relevan dengan Node                               |
| `checks-fast-contracts-plugins-*`  | Dua pemeriksaan kontrak Plugin yang di-shard                                                                        | Perubahan yang relevan dengan Node                               |
| `checks-fast-contracts-channels-*` | Dua pemeriksaan kontrak channel yang di-shard                                                                       | Perubahan yang relevan dengan Node                               |
| `checks-node-core-*`               | Shard pengujian Node core, mengecualikan lane channel, bundled, contract, dan extension                          | Perubahan yang relevan dengan Node                               |
| `check-*`                          | Padanan gate lokal utama yang di-shard: tipe prod, lint, guard, tipe pengujian, dan smoke ketat                | Perubahan yang relevan dengan Node                               |
| `check-additional-*`               | Arsitektur, drift boundary/prompt yang di-shard, guard extension, boundary package, dan topologi runtime     | Perubahan yang relevan dengan Node                               |
| `checks-node-compat-node22`        | Build kompatibilitas Node 22 dan lane smoke                                                                | Dispatch CI manual untuk rilis                     |
| `check-docs`                       | Pemeriksaan format docs, lint, dan tautan rusak                                                             | Docs berubah                                        |
| `skills-python`                    | Ruff + pytest untuk skills berbasis Python                                                                    | Perubahan yang relevan dengan skill Python                       |
| `checks-windows`                   | Pengujian process/path khusus Windows plus regresi import specifier runtime bersama                      | Perubahan yang relevan dengan Windows                            |
| `macos-node`                       | Lane pengujian TypeScript macOS menggunakan artefak build bersama                                               | Perubahan yang relevan dengan macOS                              |
| `macos-swift`                      | Lint, build, dan pengujian Swift untuk aplikasi macOS                                                            | Perubahan yang relevan dengan macOS                              |
| `ios-build`                        | Pembuatan proyek Xcode plus build simulator aplikasi iOS                                                 | Aplikasi iOS, shared app kit, atau perubahan Swabble         |
| `android`                          | Pengujian unit Android untuk kedua flavor plus satu build APK debug                                              | Perubahan yang relevan dengan Android                            |
| `test-performance-agent`           | Optimisasi pengujian lambat Codex harian setelah aktivitas tepercaya                                                 | CI main berhasil atau dispatch manual                  |
| `openclaw-performance`             | Laporan performa runtime Kova harian/sesuai permintaan dengan lane mock-provider, deep-profile, dan live GPT 5.5 | Terjadwal dan dispatch manual                       |

## Urutan fail-fast

1. `runner-admission` menunggu hanya untuk push `main` kanonis; push yang lebih baru membatalkan run sebelum pendaftaran Blacksmith.
2. `preflight` memutuskan lane mana yang benar-benar ada. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job mandiri.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu job matriks artefak dan platform yang lebih berat.
4. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat sehingga konsumen downstream dapat mulai segera setelah build bersama siap.
5. Lane platform dan runtime yang lebih berat menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, dan `android`.

GitHub dapat menandai job yang tergantikan sebagai `cancelled` saat push yang lebih baru masuk pada PR atau ref `main` yang sama. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Job matriks menggunakan `fail-fast: false`, dan `build-artifacts` melaporkan kegagalan channel tertanam, core-support-boundary, dan gateway-watch secara langsung alih-alih mengantre job verifier kecil. Kunci concurrency CI otomatis diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub di grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas. Run full-suite manual menggunakan `CI-manual-v1-*` dan tidak membatalkan run yang sedang berjalan.

Gunakan `pnpm ci:timings`, `pnpm ci:timings:recent`, atau `node scripts/ci-run-timings.mjs <run-id>` untuk merangkum waktu wall, waktu antrean, job paling lambat, kegagalan, dan barrier fanout `pnpm-store-warmup` dari GitHub Actions. CI juga mengunggah ringkasan run yang sama sebagai artefak `ci-timings-summary`. Untuk timing build, periksa langkah `Build dist` milik job `build-artifacts`: `pnpm build:ci-artifacts` mencetak `[build-all] phase timings:` dan menyertakan `ui:build`; job tersebut juga mengunggah artefak `startup-memory`.

Untuk run pull request, job timing-summary terminal menjalankan helper dari revisi base tepercaya sebelum meneruskan `GH_TOKEN` ke `gh run view`. Ini menjaga kueri bertoken keluar dari kode yang dikontrol branch sambil tetap merangkum run CI pull request saat ini.

## Konteks PR dan bukti

PR kontributor eksternal menjalankan gate konteks PR dan bukti dari
`.github/workflows/real-behavior-proof.yml`. Workflow melakukan checkout commit base tepercaya
dan hanya mengevaluasi body PR; workflow tidak mengeksekusi kode dari
branch kontributor.

Gate berlaku untuk penulis PR yang bukan pemilik repository, member,
collaborator, atau bot. Gate lulus saat body PR berisi bagian yang ditulis penulis
`What Problem This Solves` dan `Evidence`. Bukti dapat berupa
pengujian terfokus, hasil CI, tangkapan layar, rekaman, output terminal, observasi live,
log yang disunting, atau tautan artefak. Body menyediakan intent dan validasi yang berguna;
reviewer memeriksa kode, pengujian, dan CI untuk menilai kebenaran.

Saat pemeriksaan gagal, perbarui body PR alih-alih mendorong commit kode lain.

## Scope dan routing

Logika scope berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh pengujian unit di `src/scripts/ci-changed-scope.test.ts`. Dispatch manual melewati deteksi changed-scope dan membuat manifes preflight bertindak seolah setiap area berscope berubah.

- **Edit workflow CI** memvalidasi graph CI Node plus linting workflow, tetapi tidak memaksa build native Windows, iOS, Android, atau macOS dengan sendirinya; lane platform tersebut tetap berscope ke perubahan sumber platform.
- **Workflow Sanity** menjalankan `actionlint`, `zizmor` atas semua file YAML workflow, guard interpolasi composite-action, dan guard conflict-marker. Job `security-fast` berscope PR juga menjalankan `zizmor` atas file workflow yang berubah sehingga temuan keamanan workflow gagal lebih awal di graph CI utama.
- **Docs pada push `main`** diperiksa oleh workflow `Docs` mandiri dengan mirror docs ClawHub yang sama seperti yang digunakan CI, sehingga push campuran kode+docs tidak juga mengantre shard `check-docs` CI. Pull request dan CI manual tetap menjalankan `check-docs` dari CI saat docs berubah.
- **TUI PTY** berjalan di shard Linux Node `checks-node-core-runtime-tui-pty` untuk perubahan TUI. Shard menjalankan `test/vitest/vitest.tui-pty.config.ts` dengan `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, sehingga mencakup lane fixture `TuiBackend` deterministik dan smoke `tui --local` yang lebih lambat yang hanya melakukan mock pada endpoint model eksternal.
- **Edit khusus routing CI, edit fixture core-test murah terpilih, dan edit helper/test-routing kontrak Plugin yang sempit** menggunakan jalur manifes cepat khusus Node: `preflight`, security, dan satu tugas `checks-fast-core`. Jalur itu melewati artefak build, kompatibilitas Node 22, kontrak channel, shard core penuh, shard bundled-plugin, dan matriks guard tambahan saat perubahan terbatas pada permukaan routing atau helper yang langsung diuji oleh tugas cepat.
- **Pemeriksaan Node Windows** berscope ke wrapper process/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan permukaan workflow CI yang mengeksekusi lane tersebut; perubahan source, Plugin, install-smoke, dan khusus pengujian yang tidak terkait tetap berada di lane Linux Node.

Keluarga pengujian Node paling lambat dipecah atau diseimbangkan agar setiap job tetap kecil tanpa mencadangkan runner secara berlebihan: kontrak plugin dan kontrak channel masing-masing berjalan sebagai dua shard berbobot yang didukung Blacksmith dengan fallback runner GitHub standar, lane core unit fast/support berjalan terpisah, infra runtime core dipecah antara state, process/config, shared, dan tiga shard domain cron, auto-reply berjalan sebagai worker seimbang (dengan subtree reply dipecah menjadi shard agent-runner, dispatch, dan commands/state-routing), dan konfigurasi gateway/server agentik dipecah ke lane chat/auth/model/http-plugin/runtime/startup alih-alih menunggu artefak yang dibangun. CI normal kemudian hanya mengemas shard include-pattern infra terisolasi ke dalam bundel deterministik berisi paling banyak 64 file pengujian, mengurangi matriks Node tanpa menggabungkan suite command/cron yang tidak terisolasi, agents-core yang stateful, atau gateway/server; suite tetap yang berat tetap memakai 8 vCPU sementara lane yang dibundel dan berbobot lebih rendah memakai 4 vCPU. Pull request pada repositori kanonik menggunakan rencana admisi ringkas tambahan: grup per-config yang sama berjalan dalam subprocess terisolasi di dalam rencana Linux Node 34-job saat ini, sehingga satu PR tidak mendaftarkan seluruh matriks Node 70-lebih-job. Push `main`, dispatch manual, dan gate rilis mempertahankan matriks penuh. Pengujian browser, QA, media, dan plugin lain-lain yang luas memakai konfigurasi Vitest khususnya, bukan catch-all plugin bersama. Shard include-pattern mencatat entri timing menggunakan nama shard CI, sehingga `.artifacts/vitest-shard-timings.json` dapat membedakan config penuh dari shard yang difilter. `check-additional-*` menjaga pekerjaan compile/canary batas paket tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; daftar boundary guard distrip menjadi satu shard berat-prompt dan satu shard gabungan untuk sisa guard stripe, masing-masing menjalankan guard independen terpilih secara bersamaan dan mencetak timing per-check. Pemeriksaan drift snapshot prompt happy-path Codex yang mahal berjalan sebagai job tambahan tersendiri untuk CI manual dan hanya untuk perubahan yang memengaruhi prompt, sehingga perubahan Node normal yang tidak terkait tidak menunggu di belakang pembuatan snapshot prompt dingin dan shard boundary tetap seimbang sementara drift prompt tetap dikaitkan ke PR yang menyebabkannya; flag yang sama melewati pembuatan Vitest snapshot prompt di dalam shard support-boundary core artefak-terbangun. Gateway watch, pengujian channel, dan shard support-boundary core berjalan bersamaan di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun.

Setelah diterima, CI Linux kanonik mengizinkan hingga 24 job pengujian Node secara bersamaan dan
12 untuk lane fast/check yang lebih kecil; Windows dan Android tetap dua karena
pool runner tersebut lebih sempit.

Rencana PR ringkas menghasilkan 18 job Node untuk suite saat ini: grup whole-config
dibatch dalam subprocess terisolasi dengan timeout batch 120 menit,
sementara grup include-pattern berbagi anggaran job terbatas yang sama.

CI Android menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor pihak ketiga tidak memiliki source set atau manifest terpisah; lane unit-test-nya tetap mengompilasi flavor dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging APK debug duplikat pada setiap push yang relevan dengan Android.

Shard `check-dependencies` menjalankan `pnpm deadcode:dependencies` (pass khusus dependency Knip produksi yang dipatok ke versi Knip terbaru, dengan minimum release age pnpm dinonaktifkan untuk instalasi `dlx`) dan `pnpm deadcode:unused-files`, yang membandingkan temuan unused-file produksi Knip terhadap `scripts/deadcode-unused-files.allowlist.mjs`. Guard unused-file gagal saat PR menambahkan file unused baru yang belum ditinjau atau meninggalkan entri allowlist usang, sambil mempertahankan permukaan plugin dinamis, generated, build, live-test, dan package bridge yang memang disengaja dan tidak dapat diselesaikan Knip secara statis.

## Penerusan aktivitas ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` adalah bridge sisi target dari aktivitas repositori OpenClaw ke ClawSweeper. Workflow ini tidak melakukan checkout atau mengeksekusi kode pull request yang tidak tepercaya. Workflow membuat token GitHub App dari `CLAWSWEEPER_APP_PRIVATE_KEY`, lalu mengirim payload `repository_dispatch` ringkas ke `openclaw/clawsweeper`.

Workflow ini memiliki empat lane:

- `clawsweeper_item` untuk permintaan peninjauan issue dan pull request yang spesifik;
- `clawsweeper_comment` untuk perintah ClawSweeper eksplisit dalam komentar issue;
- `clawsweeper_commit_review` untuk permintaan peninjauan tingkat commit pada push `main`;
- `github_activity` untuk aktivitas GitHub umum yang dapat diperiksa agen ClawSweeper.

Lane `github_activity` hanya meneruskan metadata yang dinormalisasi: jenis event, action, actor, repositori, nomor item, URL, judul, state, dan kutipan singkat untuk komentar atau review jika ada. Lane ini sengaja menghindari penerusan body webhook penuh. Workflow penerima di `openclaw/clawsweeper` adalah `.github/workflows/github-activity.yml`, yang memposting event yang dinormalisasi ke hook OpenClaw Gateway untuk agen ClawSweeper.

Aktivitas umum adalah observasi, bukan pengiriman secara default. Agen ClawSweeper menerima target Discord dalam prompt-nya dan sebaiknya memposting ke `#clawsweeper` hanya ketika event tersebut mengejutkan, dapat ditindaklanjuti, berisiko, atau berguna secara operasional. Pembukaan rutin, edit, churn bot, noise webhook duplikat, dan traffic review normal sebaiknya menghasilkan `NO_REPLY`.

Perlakukan judul, komentar, body, teks review, nama branch, dan pesan commit GitHub sebagai data yang tidak tepercaya di sepanjang jalur ini. Semua itu adalah input untuk peringkasan dan triase, bukan instruksi untuk workflow atau runtime agen.

## Dispatch manual

Dispatch CI manual menjalankan grafik job yang sama dengan CI normal tetapi memaksa setiap lane terskoped non-Android aktif: shard Linux Node, shard bundled-plugin, shard kontrak plugin dan channel, kompatibilitas Node 22, `check-*`, `check-additional-*`, pemeriksaan smoke artefak-terbangun, pemeriksaan docs, Skills Python, Windows, macOS, build iOS, dan i18n Control UI. Dispatch CI manual standalone hanya menjalankan Android dengan `include_android=true`; payung rilis penuh mengaktifkan Android dengan meneruskan `include_android=true`. Pemeriksaan statis prerelease plugin, shard `agentic-plugins` khusus rilis, sweep batch ekstensi penuh, dan lane Docker prerelease plugin dikecualikan dari CI. Suite prerelease Docker hanya berjalan ketika `Full Release Validation` men-dispatch workflow `Plugin Prerelease` terpisah dengan gate validasi rilis diaktifkan.

Run manual memakai grup concurrency unik sehingga suite penuh release-candidate tidak dibatalkan oleh run push atau PR lain pada ref yang sama. Input opsional `target_ref` memungkinkan pemanggil tepercaya menjalankan grafik itu terhadap branch, tag, atau SHA commit penuh sambil memakai file workflow dari ref dispatch yang dipilih.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                          | Job                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Dispatch CI manual dan fallback repositori non-kanonik, scan kualitas CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow docs di luar CI, dan preflight install-smoke agar matriks Blacksmith dapat masuk antrean lebih awal                               |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shard ekstensi berbobot lebih rendah, `checks-fast-core`, shard kontrak plugin/channel, sebagian besar shard Linux Node bundled/berbobot lebih rendah, `check-guards`, `check-prod-types`, `check-test-types`, shard `check-additional-*` terpilih, dan `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suite Linux Node berat yang dipertahankan, shard `check-additional-*` yang berat pada boundary/ekstensi, dan `android`                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (cukup sensitif CPU sehingga 8 vCPU lebih mahal daripada penghematannya); build Docker install-smoke (waktu antrean 32-vCPU lebih mahal daripada penghematannya)                                                                                     |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` pada `openclaw/openclaw`; fork fallback ke `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` dan `ios-build` pada `openclaw/openclaw`; fork fallback ke `macos-26`                                                                                                                                                                                                  |

## Anggaran pendaftaran runner

Bucket pendaftaran runner GitHub OpenClaw saat ini melaporkan 10.000 pendaftaran
runner self-hosted per 5 menit di `ghx api rate_limit`. Periksa ulang
`actions_runner_registration` sebelum setiap pass tuning karena GitHub dapat mengubah
bucket ini. Batas ini dibagi oleh semua pendaftaran runner Blacksmith dalam organisasi
`openclaw`, sehingga menambahkan instalasi Blacksmith lain tidak menambahkan
bucket baru.

Perlakukan label Blacksmith sebagai resource langka untuk kontrol burst. Job yang
hanya merutekan, memberi notifikasi, merangkum, memilih shard, atau menjalankan scan CodeQL singkat sebaiknya
tetap di runner GitHub-hosted kecuali memiliki kebutuhan spesifik Blacksmith yang terukur.
Setiap matriks Blacksmith baru, `max-parallel` yang lebih besar, atau workflow frekuensi tinggi
harus menunjukkan jumlah pendaftaran worst-case-nya dan menjaga target tingkat organisasi
di bawah sekitar 60% dari bucket live. Dengan bucket 10.000 pendaftaran saat ini,
itu berarti target operasi 6.000 pendaftaran, menyisakan ruang untuk
repositori bersamaan, retry, dan overlap burst.

CI repo kanonik mempertahankan Blacksmith sebagai jalur runner default untuk run push dan pull-request normal. `workflow_dispatch` dan run repositori non-kanonik memakai runner GitHub-hosted, tetapi run kanonik normal saat ini tidak memeriksa kesehatan antrean Blacksmith atau otomatis fallback ke label GitHub-hosted ketika Blacksmith tidak tersedia.

## Padanan lokal

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Performa OpenClaw

`OpenClaw Performance` adalah alur kerja performa produk/runtime. Alur ini berjalan setiap hari di `main` dan dapat dijalankan secara manual:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Dispatch manual biasanya melakukan benchmark pada ref alur kerja. Atur `target_ref` untuk melakukan benchmark pada tag rilis atau branch lain dengan implementasi alur kerja saat ini. Jalur laporan yang dipublikasikan dan pointer terbaru dikunci berdasarkan ref yang diuji, dan setiap `index.md` mencatat ref/SHA yang diuji, ref/SHA alur kerja, ref Kova, profil, mode auth lane, model, jumlah pengulangan, dan filter skenario.

Alur kerja ini menginstal OCM dari rilis yang dipin dan Kova dari `openclaw/Kova` pada input `kova_ref` yang dipin, lalu menjalankan tiga lane:

- `mock-provider`: Skenario diagnostik Kova terhadap runtime build lokal dengan auth kompatibel OpenAI palsu yang deterministik.
- `mock-deep-profile`: Profiling CPU/heap/trace untuk hotspot startup, Gateway, dan giliran agen.
- `live-openai-candidate`: Giliran agen OpenAI `openai/gpt-5.5` nyata, dilewati saat `OPENAI_API_KEY` tidak tersedia.

Lane mock-provider juga menjalankan probe sumber asli OpenClaw setelah lintasan Kova: timing boot Gateway dan memori pada kasus startup default, hook, dan 50-Plugin; RSS impor Plugin bawaan, loop hello `channel-chat-baseline` mock-OpenAI berulang, perintah startup CLI terhadap Gateway yang sudah diboot, dan probe performa smoke status SQLite. Saat laporan sumber mock-provider yang sebelumnya dipublikasikan tersedia untuk ref yang diuji, ringkasan sumber membandingkan nilai RSS dan heap saat ini dengan baseline tersebut dan menandai peningkatan RSS besar sebagai `watch`. Ringkasan Markdown probe sumber berada di `source/index.md` dalam bundel laporan, dengan JSON mentah di sebelahnya.

Setiap lane mengunggah artefak GitHub. Saat `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi, alur kerja ini juga melakukan commit `report.json`, `report.md`, bundel, `index.md`, dan artefak probe sumber ke `openclaw/clawgrit-reports` di bawah `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Pointer ref yang sedang diuji ditulis sebagai `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validasi Rilis Penuh

`Full Release Validation` adalah alur kerja payung manual untuk "menjalankan semuanya sebelum rilis." Alur ini menerima branch, tag, atau SHA commit penuh, menjalankan alur kerja manual `CI` dengan target tersebut, menjalankan `Plugin Prerelease` untuk bukti khusus rilis terkait Plugin/paket/statis/Docker, dan menjalankan `OpenClaw Release Checks` untuk smoke instalasi, penerimaan paket, pemeriksaan paket lintas OS, rendering scorecard maturitas dari bukti profil QA, paritas QA Lab, Matrix, dan lane Telegram. Profil stable dan full selalu menyertakan cakupan soak jalur rilis live/E2E dan Docker yang menyeluruh; profil beta dapat ikut serta dengan `run_release_soak=true`. E2E Telegram paket kanonis berjalan di dalam Package Acceptance, sehingga kandidat penuh tidak memulai poller live duplikat. Setelah publikasi, berikan `release_package_spec` untuk menggunakan ulang paket npm yang sudah dikirim di seluruh release checks, Package Acceptance, Docker, lintas OS, dan Telegram tanpa membangun ulang. Gunakan `npm_telegram_package_spec` hanya untuk rerun Telegram paket terpublikasi yang terfokus. Lane paket live Plugin Codex menggunakan status terpilih yang sama secara default: `release_package_spec=openclaw@<tag>` terpublikasi menurunkan `codex_plugin_spec=npm:@openclaw/codex@<tag>`, sementara run SHA/artefak mengemas `extensions/codex` dari ref terpilih. Atur `codex_plugin_spec` secara eksplisit untuk sumber Plugin kustom seperti spesifikasi `npm:`, `npm-pack:`, atau `git:`.

Lihat [validasi rilis penuh](/id/reference/full-release-validation) untuk
matriks tahap, nama job alur kerja yang persis, perbedaan profil, artefak, dan
handle rerun terfokus.

`OpenClaw Release Publish` adalah alur kerja rilis manual yang memutasi. Jalankan
dari `release/YYYY.M.PATCH` atau `main` setelah tag rilis ada dan setelah
preflight npm OpenClaw berhasil. Alur ini memverifikasi `pnpm plugins:sync:check`,
menjalankan `Plugin NPM Release` untuk semua paket Plugin yang dapat dipublikasikan, menjalankan
`Plugin ClawHub Release` untuk SHA rilis yang sama, dan baru setelah itu menjalankan
`OpenClaw NPM Release` dengan `preflight_run_id` yang disimpan. Publikasi stable juga
memerlukan `windows_node_tag` yang persis; alur kerja memverifikasi rilis sumber Windows
dan membandingkan installer x64/ARM64-nya dengan input
`windows_node_installer_digests` yang disetujui kandidat sebelum child publish apa pun, lalu mempromosikan
dan memverifikasi digest installer yang dipin sama tersebut plus aset pendamping persis
dan kontrak checksum sebelum memublikasikan draf rilis GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Untuk bukti commit yang dipin pada branch yang bergerak cepat, gunakan helper alih-alih
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Ref dispatch alur kerja GitHub harus berupa branch atau tag, bukan SHA commit mentah. Helper
mendorong branch sementara `release-ci/<sha>-...` pada SHA target,
menjalankan `Full Release Validation` dari ref yang dipin tersebut, memverifikasi setiap
`headSha` alur kerja child cocok dengan target, dan menghapus branch sementara saat
run selesai. Verifier payung juga gagal jika ada alur kerja child yang berjalan pada
SHA berbeda.

`release_profile` mengontrol keluasan live/provider yang diteruskan ke release checks. Alur kerja
rilis manual secara default menggunakan `stable`; gunakan `full` hanya saat Anda
secara sengaja menginginkan matriks provider/media advisory yang luas. Release checks stable dan full
selalu menjalankan soak jalur rilis live/E2E dan Docker yang menyeluruh;
profil beta dapat ikut serta dengan `run_release_soak=true`.

- `minimum` mempertahankan lane OpenAI/core tercepat yang kritis untuk rilis.
- `stable` menambahkan set provider/backend stable.
- `full` menjalankan matriks provider/media advisory yang luas.

Payung mencatat ID run child yang dijalankan, dan job akhir `Verify full validation` memeriksa ulang conclusion run child saat ini dan menambahkan tabel job terlambat untuk setiap run child. Jika alur kerja child dijalankan ulang dan berubah hijau, jalankan ulang hanya job verifier parent untuk menyegarkan hasil payung dan ringkasan timing.

Untuk pemulihan, baik `Full Release Validation` maupun `OpenClaw Release Checks` menerima `rerun_group`. Gunakan `all` untuk kandidat rilis, `ci` hanya untuk child CI penuh normal, `plugin-prerelease` hanya untuk child prerelease Plugin, `release-checks` untuk setiap child rilis, atau grup yang lebih sempit: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, atau `npm-telegram` pada payung. Ini menjaga rerun kotak rilis yang gagal tetap terbatas setelah perbaikan terfokus. Untuk satu lane lintas OS yang gagal, gabungkan `rerun_group=cross-os` dengan `cross_os_suite_filter`, misalnya `windows/packaged-upgrade`; perintah lintas OS yang panjang memancarkan baris Heartbeat dan ringkasan packaged-upgrade menyertakan timing per fase. Lane release-check QA bersifat advisory kecuali gate cakupan tool runtime standar, yang memblokir saat tool dinamis OpenClaw yang diperlukan bergeser atau hilang dari ringkasan tier standar.

`OpenClaw Release Checks` menggunakan ref alur kerja tepercaya untuk meresolusikan ref terpilih sekali menjadi tarball `release-package-under-test`, lalu meneruskan artefak tersebut ke pemeriksaan lintas OS dan Package Acceptance, ditambah alur kerja Docker jalur rilis live/E2E saat cakupan soak berjalan. Ini menjaga byte paket tetap konsisten di seluruh kotak rilis dan menghindari pengemasan ulang kandidat yang sama dalam beberapa job child. Untuk lane live Codex npm-Plugin, release checks meneruskan spesifikasi Plugin terpublikasi yang cocok yang diturunkan dari `release_package_spec`, meneruskan `codex_plugin_spec` yang diberikan operator, atau membiarkan input kosong agar skrip Docker mengemas Plugin Codex dari checkout terpilih.

Run `Full Release Validation` duplikat untuk `ref=main` dan `rerun_group=all`
menggantikan payung yang lebih lama. Monitor parent membatalkan alur kerja child apa pun yang
sudah dijalankannya saat parent dibatalkan, sehingga validasi main yang lebih baru
tidak antre di belakang run release-check lama berdurasi dua jam. Validasi branch/tag
rilis dan grup rerun terfokus mempertahankan `cancel-in-progress: false`.

## Shard Live dan E2E

Child live/E2E rilis mempertahankan cakupan native `pnpm test:live` yang luas, tetapi menjalankannya sebagai shard bernama melalui `scripts/test-live-shard.mjs` alih-alih satu job serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- job `native-live-src-gateway-profiles` yang difilter provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shard media audio/video terpisah dan shard musik yang difilter provider

Ini mempertahankan cakupan file yang sama sekaligus membuat kegagalan provider live yang lambat lebih mudah dijalankan ulang dan didiagnosis. Nama shard agregat `native-live-extensions-o-z`, `native-live-extensions-media`, dan `native-live-extensions-media-music` tetap valid untuk rerun manual sekali jalan.

Shard media live native berjalan di `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang dibangun oleh alur kerja `Live Media Runner Image`. Image tersebut sudah menginstal `ffmpeg` dan `ffprobe`; job media hanya memverifikasi biner sebelum setup. Pertahankan suite live berbasis Docker pada runner Blacksmith normal — job container bukan tempat yang tepat untuk menjalankan pengujian Docker bersarang.

Shard model/backend live berbasis Docker menggunakan image bersama `ghcr.io/openclaw/openclaw-live-test:<sha>` yang terpisah untuk setiap commit yang dipilih. Alur kerja rilis live membangun dan mendorong image itu sekali, lalu shard model live Docker, Gateway yang di-shard per penyedia, backend CLI, bind ACP, dan harness Codex berjalan dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shard Gateway Docker membawa batas `timeout` tingkat skrip eksplisit di bawah timeout job alur kerja sehingga container yang macet atau jalur pembersihan gagal cepat alih-alih menghabiskan seluruh anggaran pemeriksaan rilis. Jika shard tersebut membangun ulang target Docker sumber penuh secara independen, run rilis salah konfigurasi dan akan membuang waktu nyata untuk build image duplikat.

## Penerimaan Paket

Gunakan `Package Acceptance` saat pertanyaannya adalah "apakah paket OpenClaw yang dapat diinstal ini berfungsi sebagai produk?" Ini berbeda dari CI normal: CI normal memvalidasi pohon sumber, sedangkan penerimaan paket memvalidasi satu tarball melalui harness E2E Docker yang sama yang digunakan pengguna setelah instalasi atau pembaruan.

### Job

1. `resolve_package` melakukan checkout `workflow_ref`, menyelesaikan satu kandidat paket, menulis `.artifacts/docker-e2e-package/openclaw-current.tgz`, menulis `.artifacts/docker-e2e-package/package-candidate.json`, mengunggah keduanya sebagai artefak `package-under-test`, dan mencetak sumber, ref alur kerja, ref paket, versi, SHA-256, dan profil di ringkasan langkah GitHub.
2. `docker_acceptance` memanggil `openclaw-live-and-e2e-checks-reusable.yml` dengan `ref=workflow_ref` dan `package_artifact_name=package-under-test`. Alur kerja yang dapat digunakan ulang mengunduh artefak itu, memvalidasi inventaris tarball, menyiapkan image Docker package-digest bila diperlukan, dan menjalankan jalur Docker yang dipilih terhadap paket tersebut alih-alih mengemas checkout alur kerja. Saat sebuah profil memilih beberapa `docker_lanes` bertarget, alur kerja yang dapat digunakan ulang menyiapkan paket dan image bersama sekali, lalu menyebarkan jalur tersebut sebagai job Docker bertarget paralel dengan artefak unik.
3. `package_telegram` secara opsional memanggil `NPM Telegram Beta E2E`. Ini berjalan saat `telegram_mode` bukan `none` dan menginstal artefak `package-under-test` yang sama saat Penerimaan Paket menyelesaikan satu; dispatch Telegram mandiri tetap dapat menginstal spesifikasi npm yang telah dipublikasikan.
4. `summary` menggagalkan alur kerja jika penyelesaian paket, penerimaan Docker, atau jalur Telegram opsional gagal.

### Sumber kandidat

- `source=npm` hanya menerima `openclaw@beta`, `openclaw@latest`, atau versi rilis OpenClaw yang tepat seperti `openclaw@2026.4.27-beta.2`. Gunakan ini untuk penerimaan prarilis/stabil yang telah dipublikasikan.
- `source=ref` mengemas branch, tag, atau SHA commit penuh `package_ref` tepercaya. Resolver mengambil branch/tag OpenClaw, memverifikasi commit yang dipilih dapat dijangkau dari riwayat branch repositori atau tag rilis, menginstal dependensi di worktree terpisah, dan mengemasnya dengan `scripts/package-openclaw-for-docker.mjs`.
- `source=url` mengunduh `.tgz` HTTPS publik; `package_sha256` wajib. Jalur ini menolak kredensial URL, port HTTPS non-default, hostname atau IP yang diselesaikan yang bersifat privat/internal/special-use, dan pengalihan di luar kebijakan keamanan publik yang sama.
- `source=trusted-url` mengunduh `.tgz` HTTPS dari kebijakan trusted-source bernama di `.github/package-trusted-sources.json`; `package_sha256` dan `trusted_source_id` wajib. Gunakan ini hanya untuk mirror perusahaan milik maintainer atau repositori paket privat yang membutuhkan host, port, prefiks path, host pengalihan, atau resolusi jaringan privat yang dikonfigurasi. Jika kebijakan mendeklarasikan auth bearer, alur kerja menggunakan secret tetap `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; kredensial yang disematkan dalam URL tetap ditolak.
- `source=artifact` mengunduh satu `.tgz` dari `artifact_run_id` dan `artifact_name`; `package_sha256` opsional tetapi sebaiknya disediakan untuk artefak yang dibagikan secara eksternal.

Pisahkan `workflow_ref` dan `package_ref`. `workflow_ref` adalah kode alur kerja/harness tepercaya yang menjalankan pengujian. `package_ref` adalah commit sumber yang dikemas saat `source=ref`. Ini memungkinkan harness pengujian saat ini memvalidasi commit sumber tepercaya yang lebih lama tanpa menjalankan logika alur kerja lama.

### Profil suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk jalur rilis Docker penuh dengan OpenWebUI
- `custom` — `docker_lanes` persis; wajib saat `suite_profile=custom`

Profil `package` menggunakan cakupan Plugin offline sehingga validasi paket yang dipublikasikan tidak bergantung pada ketersediaan ClawHub live. Jalur Telegram opsional menggunakan kembali artefak `package-under-test` di `NPM Telegram Beta E2E`, dengan jalur spesifikasi npm yang dipublikasikan tetap dipertahankan untuk dispatch mandiri.

Untuk kebijakan pengujian pembaruan dan Plugin khusus, termasuk perintah lokal,
jalur Docker, input Penerimaan Paket, default rilis, dan triase kegagalan,
lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins).

Pemeriksaan rilis memanggil Penerimaan Paket dengan `source=artifact`, artefak paket rilis yang telah disiapkan, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, dan `telegram_mode=mock-openai`. Ini menjaga bukti migrasi paket, pembaruan, instalasi skill ClawHub live, pembersihan dependensi Plugin usang, perbaikan instalasi Plugin yang dikonfigurasi, Plugin offline, pembaruan Plugin, dan Telegram pada tarball paket yang sama yang telah diselesaikan. Tetapkan `release_package_spec` pada Validasi Rilis Penuh atau Pemeriksaan Rilis OpenClaw setelah memublikasikan beta untuk menjalankan matriks yang sama terhadap paket npm yang telah dikirim tanpa membangun ulang; tetapkan `package_acceptance_package_spec` hanya saat Penerimaan Paket membutuhkan paket yang berbeda dari validasi rilis lainnya. Pemeriksaan rilis lintas OS tetap mencakup onboarding, installer, dan perilaku platform spesifik OS; validasi produk paket/pembaruan sebaiknya dimulai dengan Penerimaan Paket. Jalur Docker `published-upgrade-survivor` memvalidasi satu baseline paket yang dipublikasikan per run di jalur rilis yang memblokir. Dalam Penerimaan Paket, tarball `package-under-test` yang diselesaikan selalu menjadi kandidat dan `published_upgrade_survivor_baseline` memilih baseline publikasi fallback, dengan default `openclaw@latest`; perintah rerun jalur yang gagal mempertahankan baseline itu. Validasi Rilis Penuh dengan `run_release_soak=true` atau `release_profile=full` menetapkan `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` dan `published_upgrade_survivor_scenarios=reported-issues` untuk memperluas ke empat rilis npm stabil terbaru plus rilis batas kompatibilitas Plugin yang dipin dan fixture berbentuk isu untuk konfigurasi Feishu, file bootstrap/persona yang dipertahankan, instalasi Plugin OpenClaw yang dikonfigurasi, path log tilde, dan root dependensi Plugin legacy yang usang. Pilihan survivor published-upgrade multi-baseline di-shard berdasarkan baseline ke job runner Docker bertarget terpisah. Alur kerja `Update Migration` yang terpisah menggunakan jalur Docker `update-migration` dengan `all-since-2026.4.23` dan `plugin-deps-cleanup` saat pertanyaannya adalah pembersihan pembaruan publikasi yang menyeluruh, bukan cakupan CI Rilis Penuh normal. Run agregat lokal dapat meneruskan spesifikasi paket persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mempertahankan satu jalur dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` seperti `openclaw@2026.4.15`, atau menetapkan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` untuk matriks skenario. Jalur publikasi mengonfigurasi baseline dengan resep perintah `openclaw config set` yang telah dipanggang, mencatat langkah resep di `summary.json`, dan memeriksa `/healthz`, `/readyz`, plus status RPC setelah Gateway dimulai. Jalur fresh paket dan installer Windows juga memverifikasi bahwa paket terinstal dapat mengimpor override kontrol browser dari path Windows absolut mentah. Smoke agent-turn lintas OS OpenAI secara default menggunakan `OPENCLAW_CROSS_OS_OPENAI_MODEL` saat disetel, jika tidak `openai/gpt-5.5`, sehingga bukti instalasi dan Gateway tetap memakai model pengujian GPT-5 sambil menghindari default GPT-4.x.

### Jendela kompatibilitas legacy

Penerimaan Paket memiliki jendela kompatibilitas legacy terbatas untuk paket yang sudah dipublikasikan. Paket hingga `2026.4.25`, termasuk `2026.4.25-beta.*`, dapat menggunakan jalur kompatibilitas:

- entri QA privat yang diketahui di `dist/postinstall-inventory.json` dapat menunjuk ke file yang dihilangkan dari tarball;
- `doctor-switch` dapat melewati subkasus persistensi `gateway install --wrapper` saat paket tidak mengekspos flag itu;
- `update-channel-switch` dapat memangkas `patchedDependencies` pnpm yang hilang dari fixture git palsu turunan tarball dan dapat mencatat `update.channel` tersimpan yang hilang;
- smoke Plugin dapat membaca lokasi install-record legacy atau menerima persistensi install-record marketplace yang hilang;
- `plugin-update` dapat mengizinkan migrasi metadata konfigurasi sambil tetap mewajibkan install record dan perilaku tanpa instal ulang tetap tidak berubah.

Paket `2026.4.26` yang dipublikasikan juga dapat memperingatkan untuk file stempel metadata build lokal yang sudah dikirim. Paket yang lebih baru harus memenuhi kontrak modern; kondisi yang sama akan gagal alih-alih memperingatkan atau melewati.

### Contoh

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Saat men-debug run penerimaan paket yang gagal, mulai dari ringkasan `resolve_package` untuk mengonfirmasi sumber paket, versi, dan SHA-256. Lalu periksa run anak `docker_acceptance` dan artefak Docker-nya: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log jalur, timing fase, dan perintah rerun. Lebih baik jalankan ulang profil paket yang gagal atau jalur Docker persis daripada menjalankan ulang validasi rilis penuh.

## Smoke instalasi

Alur kerja `Install Smoke` yang terpisah menggunakan kembali skrip cakupan yang sama melalui job `preflight` miliknya sendiri. Ini membagi cakupan smoke menjadi `run_fast_install_smoke` dan `run_full_install_smoke`.

- **Jalur cepat** berjalan untuk pull request yang menyentuh permukaan Docker/paket, perubahan paket/manifest plugin bawaan, atau permukaan inti plugin/channel/gateway/Plugin SDK yang diuji oleh job smoke Docker. Perubahan plugin bawaan khusus sumber, edit khusus pengujian, dan edit khusus dokumentasi tidak mencadangkan worker Docker. Jalur cepat membangun image Dockerfile root satu kali, memeriksa CLI, menjalankan smoke CLI agents delete shared-workspace, menjalankan e2e gateway-network container, memverifikasi arg build ekstensi bawaan, dan menjalankan profil Docker plugin bawaan terbatas dengan batas waktu perintah agregat 240 detik (setiap Docker run skenario dibatasi secara terpisah).
- **Jalur penuh** mempertahankan cakupan instal paket QR dan Docker/update installer untuk run terjadwal malam, dispatch manual, pemeriksaan rilis workflow-call, dan pull request yang benar-benar menyentuh permukaan installer/paket/Docker. Dalam mode penuh, install-smoke menyiapkan atau menggunakan ulang satu image smoke Dockerfile root GHCR target-SHA, lalu menjalankan instal paket QR, smoke Dockerfile/gateway root, smoke installer/update, dan E2E Docker plugin bawaan cepat sebagai job terpisah sehingga pekerjaan installer tidak menunggu di belakang smoke image root.

Push `main` (termasuk commit merge) tidak memaksa jalur penuh; ketika logika cakupan-perubahan akan meminta cakupan penuh pada push, workflow mempertahankan smoke Docker cepat dan menyerahkan smoke instal penuh ke validasi malam atau rilis.

Smoke image-provider instal global Bun yang lambat digating secara terpisah oleh `run_bun_global_install_smoke`. Ini berjalan pada jadwal malam dan dari workflow pemeriksaan rilis, dan dispatch manual `Install Smoke` dapat memilih untuk menyertakannya, tetapi pull request dan push `main` tidak. CI PR normal tetap menjalankan lane regresi launcher Bun cepat untuk perubahan yang relevan dengan Node. Pengujian Docker QR dan installer mempertahankan Dockerfile berfokus-instal masing-masing.

## E2E Docker Lokal

`pnpm test:docker:all` melakukan prebuild satu image live-test bersama, mengemas OpenClaw satu kali sebagai tarball npm, dan membangun dua image `scripts/e2e/Dockerfile` bersama:

- runner Node/Git kosong untuk lane installer/update/plugin-dependency;
- image fungsional yang menginstal tarball yang sama ke `/app` untuk lane fungsionalitas normal.

Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`, logika perencana berada di `scripts/lib/docker-e2e-plan.mjs`, dan runner hanya mengeksekusi rencana yang dipilih. Scheduler memilih image per lane dengan `OPENCLAW_DOCKER_E2E_BARE_IMAGE` dan `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, lalu menjalankan lane dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parameter yang Dapat Disetel

| Variable                               | Default | Purpose                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Jumlah slot pool utama untuk lane normal.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Jumlah slot tail-pool yang sensitif terhadap provider.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Batas lane live bersamaan agar provider tidak melakukan throttle.                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Batas lane instal npm bersamaan.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Batas lane multi-service bersamaan.                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Jeda bertahap antar-start lane untuk menghindari lonjakan create daemon Docker; setel `0` untuk tanpa jeda. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout fallback per-lane (120 menit); lane live/tail tertentu menggunakan batas yang lebih ketat. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` mencetak rencana scheduler tanpa menjalankan lane.                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Daftar lane persis yang dipisahkan koma; melewati smoke cleanup agar agent dapat mereproduksi satu lane yang gagal. |

Lane yang lebih berat daripada batas efektifnya masih dapat dimulai dari pool kosong, lalu berjalan sendiri hingga melepas kapasitas. Preflight agregat lokal memeriksa Docker, menghapus container E2E OpenClaw usang, memancarkan status lane aktif, menyimpan timing lane untuk pengurutan terpanjang-terlebih-dahulu, dan berhenti menjadwalkan lane pool baru setelah kegagalan pertama secara default.

### Workflow live/E2E yang dapat digunakan ulang

Workflow live/E2E yang dapat digunakan ulang menanyakan `scripts/test-docker-all.mjs --plan-json` paket, jenis image, image live, lane, dan cakupan kredensial mana yang diperlukan. `scripts/docker-e2e.mjs` lalu mengonversi rencana tersebut menjadi output dan ringkasan GitHub. Ini mengemas OpenClaw melalui `scripts/package-openclaw-for-docker.mjs`, mengunduh artefak paket dari run saat ini, atau mengunduh artefak paket dari `package_artifact_run_id`; memvalidasi inventaris tarball; membangun dan mendorong image E2E Docker GHCR bare/functional bertag digest paket melalui cache layer Docker Blacksmith ketika rencana membutuhkan lane dengan paket terinstal; dan menggunakan ulang input `docker_e2e_bare_image`/`docker_e2e_functional_image` yang disediakan atau image digest paket yang sudah ada alih-alih membangun ulang. Pull image Docker dicoba ulang dengan timeout per-upaya terbatas 180 detik sehingga stream registry/cache yang macet dicoba ulang dengan cepat alih-alih menghabiskan sebagian besar jalur kritis CI.

### Chunk Jalur Rilis

Cakupan Docker rilis menjalankan job lebih kecil yang dipecah menjadi chunk dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` sehingga setiap chunk hanya menarik jenis image yang dibutuhkannya dan mengeksekusi beberapa lane melalui scheduler berbobot yang sama:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Chunk Docker rilis saat ini adalah `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, dan `plugins-runtime-install-a` hingga `plugins-runtime-install-h`. `package-update-openai` mencakup lane paket plugin Codex live, yang menginstal paket kandidat OpenClaw, menginstal plugin Codex dari `codex_plugin_spec` atau tarball same-ref dengan persetujuan instal CLI Codex eksplisit, menjalankan preflight CLI Codex, lalu menjalankan beberapa giliran agent OpenClaw dalam sesi yang sama terhadap OpenAI. `plugins-runtime-core`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat plugin/runtime. Alias lane `install-e2e` tetap menjadi alias rerun manual agregat untuk kedua lane installer provider.

OpenWebUI digabungkan ke dalam `plugins-runtime-services` ketika cakupan release-path penuh memintanya, dan mempertahankan chunk mandiri `openwebui` hanya untuk dispatch khusus OpenWebUI. Lane update channel bawaan mencoba ulang satu kali untuk kegagalan jaringan npm sementara.

Setiap chunk mengunggah `.artifacts/docker-tests/` dengan log lane, timing, `summary.json`, `failures.json`, timing fase, JSON rencana scheduler, tabel lane lambat, dan perintah rerun per-lane. Input workflow `docker_lanes` menjalankan lane yang dipilih terhadap image yang disiapkan alih-alih job chunk, yang menjaga debugging lane gagal tetap terbatas pada satu job Docker tertarget dan menyiapkan, mengunduh, atau menggunakan ulang artefak paket untuk run tersebut; jika lane yang dipilih adalah lane Docker live, job tertarget membangun image live-test secara lokal untuk rerun itu. Perintah rerun GitHub per-lane yang dihasilkan menyertakan `package_artifact_run_id`, `package_artifact_name`, dan input image yang disiapkan ketika nilai tersebut ada, sehingga lane yang gagal dapat menggunakan ulang paket dan image persis dari run yang gagal.

```bash
pnpm test:docker:rerun <run-id>      # unduh artefak Docker dan cetak perintah rerun tertarget gabungan/per-lane
pnpm test:docker:timings <summary>   # ringkasan jalur kritis fase dan lane lambat
```

Workflow live/E2E terjadwal menjalankan suite Docker release-path penuh setiap hari.

## Prarilis Plugin

`Plugin Prerelease` adalah cakupan produk/paket yang lebih mahal, sehingga menjadi workflow terpisah yang didispatch oleh `Full Release Validation` atau oleh operator eksplisit. Pull request normal, push `main`, dan dispatch CI manual mandiri menonaktifkan suite tersebut. Ini menyeimbangkan pengujian plugin bawaan di delapan worker ekstensi; job shard ekstensi tersebut menjalankan hingga dua grup konfigurasi plugin sekaligus dengan satu worker Vitest per grup dan heap Node yang lebih besar sehingga batch plugin yang berat impor tidak membuat job CI tambahan. Jalur prarilis Docker khusus rilis membatch lane Docker tertarget dalam grup kecil untuk menghindari pencadangan puluhan runner untuk job satu hingga tiga menit. Workflow juga mengunggah artefak informasional `plugin-inspector-advisory` dari `@openclaw/plugin-inspector`; temuan inspector adalah input triase dan tidak mengubah gate Plugin Prerelease yang memblokir.

## QA Lab

QA Lab memiliki lane CI khusus di luar workflow utama yang dicakup secara cerdas. Paritas agentic berada di bawah harness QA dan rilis yang luas, bukan workflow PR mandiri. Gunakan `Full Release Validation` dengan `rerun_group=qa-parity` ketika paritas harus berjalan bersama run validasi luas.

- Workflow `QA-Lab - All Lanes` berjalan setiap malam pada `main` dan pada dispatch manual; workflow ini memecah lane paritas mock, lane Matrix live, serta lane Telegram dan Discord live sebagai job paralel. Job live menggunakan environment `qa-live-shared`, dan Telegram/Discord menggunakan lease Convex.

Pemeriksaan rilis menjalankan lane transport Matrix dan Telegram live dengan provider mock deterministik dan model yang memenuhi syarat mock (`mock-openai/gpt-5.5` dan `mock-openai/gpt-5.5-alt`) sehingga kontrak channel terisolasi dari latensi model live dan startup plugin provider normal. Gateway transport live menonaktifkan pencarian memori karena paritas QA mencakup perilaku memori secara terpisah; konektivitas provider dicakup oleh suite model live, provider native, dan provider Docker terpisah.

Matrix menggunakan `--profile fast` untuk gate terjadwal dan rilis, menambahkan `--fail-fast` hanya ketika CLI yang di-checkout mendukungnya. Default CLI dan input workflow manual tetap `all`; dispatch manual `matrix_profile=all` selalu membagi cakupan Matrix penuh ke dalam job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`.

`OpenClaw Release Checks` juga menjalankan lane QA Lab yang kritis untuk rilis sebelum persetujuan rilis; gate paritas QA-nya menjalankan paket kandidat dan baseline sebagai job lane paralel, lalu mengunduh kedua artefak ke job laporan kecil untuk perbandingan paritas final.

Untuk PR normal, ikuti bukti CI/check tercakup alih-alih memperlakukan paritas sebagai status wajib.

## CodeQL

Workflow `CodeQL` sengaja merupakan pemindai keamanan first-pass yang sempit, bukan sweep repositori penuh. Run harian, manual, dan guard pull request non-draft memindai kode workflow Actions plus permukaan JavaScript/TypeScript berisiko tertinggi dengan kueri keamanan keyakinan tinggi yang difilter ke `security-severity` tinggi/kritis.

Guard pull request tetap ringan: guard ini hanya dimulai untuk perubahan di bawah `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, atau `src`, dan menjalankan matriks keamanan keyakinan tinggi yang sama dengan workflow terjadwal. CodeQL Android dan macOS tetap di luar default PR.

### Kategori keamanan

| Kategori                                         | Permukaan                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autentikasi, secret, sandbox, Cron, dan baseline Gateway                                                                            |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrak implementasi channel inti plus runtime Plugin channel, Gateway, Plugin SDK, secret, titik sentuh audit                      |
| `/codeql-security-high/network-ssrf-boundary`     | Permukaan kebijakan SSRF inti, parsing IP, penjaga jaringan, web-fetch, dan SSRF Plugin SDK                                         |
| `/codeql-security-high/mcp-process-tool-boundary` | Server MCP, helper eksekusi proses, pengiriman keluar, dan gate eksekusi tool agen                                                  |
| `/codeql-security-high/plugin-trust-boundary`     | Permukaan kepercayaan instalasi Plugin, loader, manifes, registry, instalasi package-manager, pemuatan sumber, dan kontrak paket Plugin SDK |

### Shard keamanan khusus platform

- `CodeQL Android Critical Security` — shard keamanan Android terjadwal. Membangun aplikasi Android secara manual untuk CodeQL pada runner Blacksmith Linux terkecil yang diterima oleh sanity workflow. Mengunggah di bawah `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard keamanan macOS mingguan/manual. Membangun aplikasi macOS secara manual untuk CodeQL di Blacksmith macOS, memfilter hasil build dependensi dari SARIF yang diunggah, dan mengunggah di bawah `/codeql-critical-security/macos`. Disimpan di luar default harian karena build macOS mendominasi runtime bahkan saat bersih.

### Kategori Kualitas Kritis

`CodeQL Critical Quality` adalah shard non-keamanan yang sepadan. Ini hanya menjalankan kueri kualitas JavaScript/TypeScript non-keamanan dengan severity error pada permukaan sempit bernilai tinggi di runner Linux yang di-host GitHub agar pemindaian kualitas tidak menghabiskan anggaran registrasi runner Blacksmith. Guard pull request-nya sengaja lebih kecil daripada profil terjadwal: PR non-draft hanya menjalankan shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, dan `plugin-sdk-reply-runtime` yang sesuai untuk perubahan kode eksekusi perintah/model/tool agen dan dispatch balasan, kode skema/migrasi/IO config, kode autentikasi/secret/sandbox/keamanan, channel inti dan runtime Plugin channel bawaan, metode server/protokol Gateway, runtime memori/glue SDK, pengiriman MCP/proses/keluar, runtime provider/katalog model, diagnostik sesi/antrean pengiriman, loader Plugin, kontrak paket/Plugin SDK, atau runtime balasan Plugin SDK. Perubahan config CodeQL dan workflow kualitas menjalankan semua dua belas shard kualitas PR.

Dispatch manual menerima:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profil sempit adalah hook pengajaran/iterasi untuk menjalankan satu shard kualitas secara terpisah.

| Kategori                                               | Permukaan                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kode batas keamanan autentikasi, secret, sandbox, Cron, dan Gateway                                                                                               |
| `/codeql-critical-quality/config-boundary`              | Kontrak skema config, migrasi, normalisasi, dan IO                                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Skema protokol Gateway dan kontrak metode server                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrak implementasi channel inti dan Plugin channel bawaan                                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | Kontrak runtime eksekusi perintah, dispatch model/provider, dispatch dan antrean auto-reply, serta control plane ACP                                              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Server MCP dan bridge tool, helper supervisi proses, dan kontrak pengiriman keluar                                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host memori, facade runtime memori, alias Plugin SDK memori, glue aktivasi runtime memori, dan perintah doctor memori                                         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internal antrean balasan, antrean pengiriman sesi, helper binding/pengiriman sesi keluar, permukaan bundle event/log diagnostik, dan kontrak CLI doctor sesi     |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch balasan masuk Plugin SDK, helper payload/chunking/runtime balasan, opsi balasan channel, antrean pengiriman, dan helper binding sesi/thread              |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisasi katalog model, autentikasi dan discovery provider, registrasi runtime provider, default/katalog provider, dan registry web/search/fetch/embedding     |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI kontrol, persistensi lokal, alur kontrol Gateway, dan kontrak runtime control plane tugas                                                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrak runtime fetch/search web inti, IO media, pemahaman media, pembuatan gambar, dan pembuatan media                                                           |
| `/codeql-critical-quality/plugin-boundary`              | Kontrak loader, registry, permukaan publik, dan entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Sumber Plugin SDK sisi paket yang dipublikasikan dan helper kontrak paket Plugin                                                                                  |

Kualitas tetap terpisah dari keamanan agar temuan kualitas dapat dijadwalkan, diukur, dinonaktifkan, atau diperluas tanpa mengaburkan sinyal keamanan. Ekspansi CodeQL Swift, Python, dan Plugin bawaan harus ditambahkan kembali sebagai pekerjaan lanjutan yang terskoup atau di-shard hanya setelah profil sempit memiliki runtime dan sinyal yang stabil.

## Workflow pemeliharaan

### Agen Docs

Workflow `Docs Agent` adalah lane pemeliharaan Codex berbasis event untuk menjaga dokumen yang ada tetap selaras dengan perubahan yang baru mendarat. Ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil pada `main` dapat memicunya, dan dispatch manual dapat menjalankannya langsung. Invokasi workflow-run dilewati ketika `main` sudah bergerak maju atau ketika run Docs Agent non-skipped lain dibuat dalam satu jam terakhir. Saat berjalan, ini meninjau rentang commit dari SHA sumber Docs Agent non-skipped sebelumnya hingga `main` saat ini, sehingga satu run per jam dapat mencakup semua perubahan main yang terakumulasi sejak pass docs terakhir.

### Agen Performa Tes

Workflow `Test Performance Agent` adalah lane pemeliharaan Codex berbasis event untuk tes lambat. Ini tidak memiliki jadwal murni: run CI push non-bot yang berhasil pada `main` dapat memicunya, tetapi dilewati jika invokasi workflow-run lain sudah berjalan atau sedang berjalan pada hari UTC tersebut. Dispatch manual melewati gate aktivitas harian itu. Lane ini membangun laporan performa Vitest full-suite yang dikelompokkan, membiarkan Codex hanya membuat perbaikan performa tes kecil yang mempertahankan cakupan alih-alih refactor luas, lalu menjalankan ulang laporan full-suite dan menolak perubahan yang mengurangi jumlah tes baseline yang lulus. Laporan yang dikelompokkan mencatat wall time per-config dan RSS maksimum di Linux dan macOS, sehingga perbandingan sebelum/sesudah menampilkan delta memori tes berdampingan dengan delta durasi. Jika baseline memiliki tes gagal, Codex hanya boleh memperbaiki kegagalan yang jelas dan laporan full-suite setelah agen harus lulus sebelum apa pun di-commit. Ketika `main` maju sebelum push bot mendarat, lane me-rebase patch yang sudah divalidasi, menjalankan ulang `pnpm check:changed`, dan mencoba ulang push; patch basi yang konflik dilewati. Ini menggunakan Ubuntu yang di-host GitHub agar action Codex dapat mempertahankan postur keamanan drop-sudo yang sama seperti agen docs.

### PR Duplikat Setelah Merge

Workflow `Duplicate PRs After Merge` adalah workflow maintainer manual untuk pembersihan duplikat setelah land. Default-nya adalah dry-run dan hanya menutup PR yang dicantumkan secara eksplisit ketika `apply=true`. Sebelum memutasi GitHub, ini memverifikasi bahwa PR yang mendarat sudah di-merge dan bahwa setiap duplikat memiliki issue referensi bersama atau hunk perubahan yang tumpang tindih.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate pemeriksaan lokal dan routing perubahan

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dieksekusi oleh `scripts/check-changed.mjs`. Gate pemeriksaan lokal itu lebih ketat tentang batas arsitektur daripada scope platform CI yang luas:

- perubahan produksi inti menjalankan typecheck prod inti dan tes inti plus lint/guard inti;
- perubahan khusus tes inti hanya menjalankan typecheck tes inti plus lint inti;
- perubahan produksi extension menjalankan typecheck prod extension dan tes extension plus lint extension;
- perubahan khusus tes extension menjalankan typecheck tes extension plus lint extension;
- perubahan Plugin SDK publik atau kontrak Plugin diperluas ke typecheck extension karena extension bergantung pada kontrak inti tersebut (sweep extension Vitest tetap menjadi pekerjaan tes eksplisit);
- bump versi khusus metadata rilis menjalankan pemeriksaan versi/config/dependensi root yang ditargetkan;
- perubahan root/config yang tidak dikenal fail safe ke semua lane pemeriksaan.

Routing changed-test lokal berada di `scripts/test-projects.test-support.mjs` dan sengaja lebih murah daripada `check:changed`: edit tes langsung menjalankan dirinya sendiri, edit sumber mengutamakan pemetaan eksplisit, lalu tes sibling dan dependent import-graph. Config pengiriman group-room bersama adalah salah satu pemetaan eksplisit: perubahan pada config balasan yang terlihat grup, mode pengiriman balasan sumber, atau prompt sistem message-tool dirutekan melalui tes balasan inti plus regresi pengiriman Discord dan Slack sehingga perubahan default bersama gagal sebelum push PR pertama. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika perubahan cukup luas di harness sehingga set murah yang dipetakan bukan proxy yang tepercaya.

## Validasi Testbox

Crabbox adalah wrapper remote-box milik repo untuk proof Linux maintainer. Gunakan dari root repo ketika pemeriksaan terlalu luas untuk loop edit lokal, ketika paritas CI penting, atau ketika proof membutuhkan secret, Docker, lane paket, box yang dapat digunakan ulang, atau log remote. Backend OpenClaw normal adalah `blacksmith-testbox`; kapasitas AWS/Hetzner milik sendiri adalah fallback untuk gangguan Blacksmith, masalah kuota, atau pengujian kapasitas milik sendiri yang eksplisit.

Jalankan berbasis Crabbox Blacksmith menghangatkan, mengklaim, menyinkronkan, menjalankan, melaporkan, dan membersihkan Testbox sekali pakai. Pemeriksaan kewarasan sinkronisasi bawaan akan gagal cepat saat file root yang diperlukan seperti `pnpm-lock.yaml` hilang atau saat `git status --short` menampilkan setidaknya 200 penghapusan terlacak. Untuk PR penghapusan besar yang disengaja, tetapkan `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` untuk perintah jarak jauh.

Crabbox juga menghentikan pemanggilan CLI Blacksmith lokal yang tetap berada dalam fase sinkronisasi selama lebih dari lima menit tanpa output pascasinkronisasi. Tetapkan `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` untuk menonaktifkan pelindung tersebut, atau gunakan nilai milidetik yang lebih besar untuk diff lokal yang luar biasa besar.

Sebelum menjalankan pertama kali, periksa wrapper dari root repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repo menolak biner Crabbox usang yang tidak mengiklankan `blacksmith-testbox`. Teruskan provider secara eksplisit meskipun `.crabbox.yaml` memiliki default cloud milik sendiri. Di worktree Codex atau checkout tertaut/sparse, hindari skrip `pnpm crabbox:run` lokal karena pnpm dapat merekonsiliasi dependensi sebelum Crabbox dimulai; panggil wrapper node secara langsung sebagai gantinya:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Jalankan berbasis Blacksmith memerlukan Crabbox 0.22.0 atau yang lebih baru agar wrapper mendapatkan perilaku sinkronisasi, antrean, dan pembersihan Testbox saat ini. Saat menggunakan checkout saudara, bangun ulang biner lokal yang diabaikan sebelum pekerjaan pengaturan waktu atau pembuktian:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Gate perubahan:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm check:changed"
```

Jalankan ulang pengujian terfokus:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

Suite lengkap:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

Baca ringkasan JSON final. Field yang berguna adalah `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, dan `totalMs`. Untuk jalankan Blacksmith Testbox yang didelegasikan, kode keluar wrapper Crabbox dan ringkasan JSON adalah hasil perintah. Jalankan GitHub Actions yang tertaut memiliki hidrasi dan keepalive; ia dapat selesai sebagai `cancelled` saat Testbox dihentikan secara eksternal setelah perintah SSH sudah kembali. Perlakukan itu sebagai artefak pembersihan/status kecuali `exitCode` wrapper bukan nol atau output perintah menunjukkan pengujian gagal. Jalankan Crabbox sekali pakai berbasis Blacksmith seharusnya menghentikan Testbox secara otomatis; jika jalankan terinterupsi atau pembersihan tidak jelas, periksa box live dan hentikan hanya box yang Anda buat:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Gunakan ulang hanya saat Anda sengaja membutuhkan beberapa perintah pada box terhidrasi yang sama:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Jika Crabbox adalah lapisan yang rusak tetapi Blacksmith sendiri berfungsi, gunakan Blacksmith langsung hanya untuk diagnostik seperti `list`, `status`, dan pembersihan. Perbaiki jalur Crabbox sebelum memperlakukan jalankan Blacksmith langsung sebagai bukti maintainer.

Jika `blacksmith testbox list --all` dan `blacksmith testbox status` berfungsi tetapi warmup baru tetap `queued` tanpa IP atau URL jalankan Actions setelah beberapa menit, perlakukan sebagai tekanan provider, antrean, billing, atau batas org Blacksmith. Hentikan id antrean yang Anda buat, hindari memulai lebih banyak Testbox, dan pindahkan pembuktian ke jalur kapasitas Crabbox milik sendiri di bawah sementara seseorang memeriksa dasbor, billing, dan batas org Blacksmith.

Eskalasi ke kapasitas Crabbox milik sendiri hanya saat Blacksmith sedang down, dibatasi kuota, tidak memiliki environment yang diperlukan, atau kapasitas milik sendiri secara eksplisit menjadi tujuan:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Di bawah tekanan AWS, hindari `class=beast` kecuali tugas benar-benar membutuhkan CPU kelas 48xlarge. Permintaan `beast` dimulai dari 192 vCPU dan merupakan cara termudah untuk memicu kuota regional EC2 Spot atau On-Demand Standard. Default `.crabbox.yaml` milik repo ke `standard`, beberapa region kapasitas, dan `capacity.hints: true` sehingga lease AWS yang diperantarai mencetak region/market yang dipilih, tekanan kuota, fallback Spot, dan peringatan kelas tekanan tinggi. Gunakan `fast` untuk pemeriksaan luas yang lebih berat, `large` hanya setelah standard/fast tidak cukup, dan `beast` hanya untuk lane luar biasa yang terikat CPU seperti matriks Docker suite lengkap atau semua plugin, validasi rilis/blocker eksplisit, atau profiling performa high-core. Jangan gunakan `beast` untuk `pnpm check:changed`, pengujian terfokus, pekerjaan khusus docs, lint/typecheck biasa, repro E2E kecil, atau triase gangguan Blacksmith. Gunakan `--market on-demand` untuk diagnosis kapasitas agar churn pasar Spot tidak tercampur ke dalam sinyal.

`.crabbox.yaml` memiliki default provider, sinkronisasi, dan hidrasi GitHub Actions untuk lane cloud milik sendiri. File ini mengecualikan `.git` lokal sehingga checkout Actions yang terhidrasi mempertahankan metadata Git jarak jauhnya sendiri alih-alih menyinkronkan remote dan object store lokal maintainer, dan mengecualikan artefak runtime/build lokal yang tidak boleh pernah ditransfer. `.github/workflows/crabbox-hydrate.yml` memiliki checkout, penyiapan Node/pnpm, fetch `origin/main`, dan serah terima environment non-rahasia untuk perintah cloud milik sendiri `crabbox run --id <cbx_id>`.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Channel pengembangan](/id/install/development-channels)
