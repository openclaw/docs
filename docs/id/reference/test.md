---
read_when:
    - Menjalankan atau memperbaiki pengujian
summary: Cara menjalankan pengujian secara lokal (vitest) dan kapan menggunakan mode force/coverage
title: Pengujian
x-i18n:
    generated_at: "2026-06-27T18:12:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba6d1665497bebed287e69c865407dfb233ad60d64175558d053a69c72fea217
    source_path: reference/test.md
    workflow: 16
---

- Kit pengujian lengkap (suite, langsung, Docker): [Pengujian](/id/help/testing)
- Validasi pembaruan dan paket Plugin: [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins)

- Urutan pengujian lokal rutin:
  1. `pnpm test:changed` untuk bukti Vitest cakupan-perubahan.
  2. `pnpm test <path-or-filter>` untuk satu file, direktori, atau target eksplisit.
  3. `pnpm test` hanya saat Anda sengaja membutuhkan seluruh suite Vitest lokal.
- `pnpm test:force`: Menghentikan proses gateway tersisa yang menahan port kontrol default, lalu menjalankan seluruh suite Vitest dengan port gateway terisolasi agar pengujian server tidak bentrok dengan instans yang sedang berjalan. Gunakan ini saat proses gateway sebelumnya meninggalkan port 18789 terpakai.
- `pnpm test:coverage`: Menjalankan suite unit dengan cakupan V8 (melalui `vitest.unit.config.ts`). Ini adalah gerbang cakupan lane unit default, bukan cakupan semua file seluruh repo. Ambangnya adalah 70% baris/fungsi/pernyataan dan 55% cabang. Karena `coverage.all` bernilai false dan cakupan lane default membatasi penyertaan cakupan ke pengujian unit non-cepat dengan file sumber saudara, gerbang ini mengukur sumber yang dimiliki lane ini, bukan setiap impor transitif yang kebetulan dimuatnya.
- `pnpm test:coverage:changed`: Menjalankan cakupan unit hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:changed`: proses pengujian perubahan cerdas yang murah. Ini menjalankan target presisi dari edit pengujian langsung, file saudara `*.test.ts`, pemetaan sumber eksplisit, dan graf impor lokal. Perubahan luas/konfigurasi/paket dilewati kecuali dipetakan ke pengujian presisi.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: proses pengujian perubahan luas eksplisit. Gunakan ini saat edit harness/konfigurasi/paket pengujian harus kembali ke perilaku pengujian-berubah Vitest yang lebih luas.
- `pnpm changed:lanes`: menampilkan lane arsitektural yang dipicu oleh diff terhadap `origin/main`.
- `pnpm check:changed`: mendelegasikan ke Crabbox/Testbox secara default di luar CI, lalu menjalankan gerbang pemeriksaan perubahan cerdas untuk diff terhadap `origin/main` di dalam child jarak jauh. Ini menjalankan perintah typecheck, lint, dan guard untuk lane arsitektural yang terdampak, tetapi tidak menjalankan pengujian Vitest. Gunakan `pnpm test:changed` atau `pnpm test <target>` eksplisit untuk bukti pengujian.
- Worktree Codex dan checkout tertaut/sparse: hindari `pnpm test*`, `pnpm check*`, dan `pnpm crabbox:run` lokal langsung kecuali Anda telah memverifikasi bahwa pnpm tidak akan merekonsiliasi dependensi. Untuk bukti file eksplisit kecil, gunakan `node scripts/run-vitest.mjs <path-or-filter>`; untuk gerbang perubahan atau bukti luas, gunakan `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` agar pnpm berjalan di dalam Testbox.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: menjaga serialisasi pemeriksaan berat tetap di dalam worktree saat ini, bukan di direktori umum Git, untuk perintah seperti `pnpm check:changed` dan `pnpm test ...` tertarget. Gunakan hanya pada host lokal berkapasitas tinggi saat Anda sengaja menjalankan pemeriksaan independen di beberapa worktree tertaut.
- `pnpm test`: merutekan target file/direktori eksplisit melalui lane Vitest bercakupan. Proses tanpa target adalah bukti suite penuh: menggunakan grup shard tetap, memperluas ke konfigurasi leaf untuk eksekusi paralel lokal, dan mencetak fanout shard lokal yang diharapkan sebelum mulai. Grup ekstensi selalu diperluas ke konfigurasi shard per ekstensi, bukan satu proses proyek root raksasa.
- Proses wrapper pengujian berakhir dengan ringkasan singkat `[test] passed|failed|skipped ... in ...`. Baris durasi milik Vitest sendiri tetap menjadi detail per shard.
- Status pengujian OpenClaw bersama: gunakan `src/test-utils/openclaw-test-state.ts` dari Vitest saat pengujian membutuhkan `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture konfigurasi, workspace, direktori agen, atau penyimpanan profil autentikasi yang terisolasi.
- `pnpm test:env-mutations:report`: laporan non-pemblokir tentang pengujian dan harness yang memutasi `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR`, atau kunci env OpenClaw terkait secara langsung. Gunakan ini untuk menemukan kandidat migrasi ke helper status-pengujian bersama.
- E2E tiruan UI Kontrol: gunakan `pnpm test:ui:e2e` untuk lane Vitest + Playwright yang memulai UI Kontrol Vite dan menggerakkan halaman Chromium nyata terhadap WebSocket Gateway tiruan. Pengujian berada di `ui/src/**/*.e2e.test.ts`; mock dan kontrol bersama berada di `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` mencakup lane ini. Di worktree Codex, pilih `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` untuk bukti tertarget kecil setelah dependensi terinstal, atau Testbox/Crabbox untuk bukti GUI yang lebih luas.
- Helper E2E proses: gunakan `test/helpers/openclaw-test-instance.ts` saat pengujian E2E tingkat proses Vitest membutuhkan Gateway yang berjalan, env CLI, penangkapan log, dan pembersihan di satu tempat.
- Pengujian TUI PTY: gunakan `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` untuk lane PTY backend palsu yang cepat. Gunakan `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` atau `pnpm tui:pty:test:watch --mode local` untuk smoke `tui --local` yang lebih lambat, yang hanya me-mock endpoint model eksternal. Asersi teks terlihat yang stabil atau panggilan fixture, bukan snapshot ANSI mentah.
- Helper E2E Docker/Bash: lane yang melakukan source `scripts/lib/docker-e2e-image.sh` dapat meneruskan `docker_e2e_test_state_shell_b64 <label> <scenario>` ke dalam container dan mendekodenya dengan `scripts/lib/openclaw-e2e-instance.sh`; skrip multi-home dapat meneruskan `docker_e2e_test_state_function_b64` dan memanggil `openclaw_test_state_create <label> <scenario>` di setiap alur. Pemanggil tingkat lebih rendah dapat menggunakan `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` untuk cuplikan shell dalam-container, atau `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` untuk file env host yang dapat di-source. `--` sebelum `create` mencegah runtime Node yang lebih baru memperlakukan `--env-file` sebagai flag Node. Lane Docker/Bash yang meluncurkan Gateway dapat melakukan source `scripts/lib/openclaw-e2e-instance.sh` di dalam container untuk resolusi entrypoint, startup OpenAI tiruan, peluncuran Gateway foreground/background, probe kesiapan, ekspor env status, dump log, dan pembersihan proses.
- Proses shard penuh, ekstensi, dan pola-include memperbarui data waktu lokal di `.artifacts/vitest-shard-timings.json`; proses seluruh-konfigurasi berikutnya menggunakan waktu tersebut untuk menyeimbangkan shard lambat dan cepat. Shard CI pola-include menambahkan nama shard ke kunci waktu, sehingga waktu shard terfilter tetap terlihat tanpa mengganti data waktu seluruh-konfigurasi. Setel `OPENCLAW_TEST_PROJECTS_TIMINGS=0` untuk mengabaikan artefak waktu lokal.
- File pengujian `plugin-sdk` dan `commands` terpilih kini dirutekan melalui lane ringan khusus yang hanya mempertahankan `test/setup.ts`, sehingga kasus yang berat runtime tetap berada pada lane yang sudah ada.
- File sumber dengan pengujian saudara dipetakan ke saudara tersebut sebelum kembali ke glob direktori yang lebih luas. Edit helper di bawah `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers`, dan `src/plugins/contracts` menggunakan graf impor lokal untuk menjalankan pengujian pengimpor, bukan menjalankan luas setiap shard saat jalur dependensinya presisi.
- `auto-reply` kini juga dibagi menjadi tiga konfigurasi khusus (`core`, `top-level`, `reply`) sehingga harness balasan tidak mendominasi pengujian status/token/helper tingkat-atas yang lebih ringan.
- Konfigurasi dasar Vitest kini default ke `pool: "threads"` dan `isolate: false`, dengan runner non-terisolasi bersama diaktifkan di seluruh konfigurasi repo.
- `pnpm test:channels` menjalankan `vitest.channels.config.ts`.
- `pnpm test:extensions` dan `pnpm test extensions` menjalankan semua shard ekstensi/plugin. Plugin kanal berat, plugin browser, dan OpenAI berjalan sebagai shard khusus; grup plugin lain tetap dibatch. Gunakan `pnpm test extensions/<id>` untuk satu lane plugin bundled.
- `pnpm test:perf:imports`: mengaktifkan pelaporan durasi-impor + rincian-impor Vitest, sambil tetap menggunakan perutean lane bercakupan untuk target file/direktori eksplisit.
- `pnpm test:perf:imports:changed`: profil impor yang sama, tetapi hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan performa jalur mode-perubahan yang dirutekan dengan proses proyek-root native untuk diff git committed yang sama.
- `pnpm test:perf:changed:bench -- --worktree` membandingkan performa set perubahan worktree saat ini tanpa perlu commit terlebih dahulu.
- `pnpm test:perf:profile:main`: menulis profil CPU untuk thread utama Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: menulis profil CPU + heap untuk runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: menjalankan setiap konfigurasi leaf Vitest suite penuh secara serial dan menulis data durasi berkelompok plus artefak JSON/log per konfigurasi. Agen Performa Pengujian menggunakan ini sebagai baseline sebelum mencoba perbaikan pengujian lambat.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: membandingkan laporan berkelompok setelah perubahan yang berfokus pada performa.
- `pnpm test:docker:timings <summary.json>` memeriksa lane Docker lambat setelah proses Docker all; gunakan `pnpm test:docker:rerun <run-id|summary.json|failures.json>` untuk mencetak perintah rerun tertarget murah dari artefak yang sama.
- Integrasi Gateway: ikut serta melalui `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` atau `pnpm test:gateway`.
- `pnpm test:e2e`: Menjalankan agregat E2E repo: pengujian smoke end-to-end gateway plus lane E2E browser tiruan UI Kontrol.
- `pnpm test:e2e:gateway`: Menjalankan pengujian smoke end-to-end gateway (pemasangan multi-instans WS/HTTP/node). Default ke `threads` + `isolate: false` dengan worker adaptif di `vitest.e2e.config.ts`; sesuaikan dengan `OPENCLAW_E2E_WORKERS=<n>` dan setel `OPENCLAW_E2E_VERBOSE=1` untuk log verbose.
- `pnpm test:live`: Menjalankan pengujian live provider (minimax/zai). Membutuhkan kunci API dan `LIVE=1` (atau `*_LIVE_TEST=1` khusus provider) agar tidak dilewati.
- `pnpm test:docker:all`: Membangun image live-test bersama, mengemas OpenClaw sekali sebagai tarball npm, membangun/menggunakan ulang image runner Node/Git bare plus image fungsional yang menginstal tarball tersebut ke `/app`, lalu menjalankan jalur smoke Docker dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` melalui penjadwal berbobot. Image bare (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) digunakan untuk jalur installer/update/plugin-dependency; jalur tersebut memasang tarball prabangun alih-alih menggunakan sumber repo yang disalin. Image fungsional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) digunakan untuk jalur fungsionalitas aplikasi-terbangun normal. `scripts/package-openclaw-for-docker.mjs` adalah pengemas paket lokal/CI tunggal dan memvalidasi tarball plus `dist/postinstall-inventory.json` sebelum Docker mengonsumsinya. Definisi jalur Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika perencana berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` mengeksekusi rencana yang dipilih. `node scripts/test-docker-all.mjs --plan-json` memancarkan rencana CI milik penjadwal untuk jalur terpilih, jenis image, kebutuhan paket/image live, skenario state, dan pemeriksaan kredensial tanpa membangun atau menjalankan Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` mengontrol slot proses dan default-nya 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` mengontrol pool tail yang sensitif penyedia dan default-nya 10. Batas jalur berat default ke `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; batas penyedia default ke satu jalur berat per penyedia melalui `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, dan `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Gunakan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` untuk host yang lebih besar. Jika satu jalur melampaui bobot efektif atau batas sumber daya pada host dengan paralelisme rendah, jalur itu tetap dapat dimulai dari pool kosong dan akan berjalan sendiri hingga kapasitas dilepas. Mulai jalur diberi jeda bertahap 2 detik secara default untuk menghindari badai pembuatan pada daemon Docker lokal; timpa dengan `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner menjalankan preflight Docker secara default, membersihkan kontainer E2E OpenClaw yang stale, memancarkan status jalur aktif setiap 30 detik, membagikan cache tool CLI penyedia antarjalur yang kompatibel, mencoba ulang kegagalan penyedia live yang sementara sekali secara default (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), dan menyimpan waktu jalur di `.artifacts/docker-tests/lane-timings.json` untuk pengurutan terpanjang lebih dulu pada proses berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifes jalur tanpa menjalankan Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` untuk menyetel output status, atau `OPENCLAW_DOCKER_ALL_TIMINGS=0` untuk menonaktifkan penggunaan ulang waktu. Gunakan `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` hanya untuk jalur deterministik/lokal atau `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` hanya untuk jalur penyedia live; alias paketnya adalah `pnpm test:docker:local:all` dan `pnpm test:docker:live:all`. Mode live-saja menggabungkan jalur live utama dan tail ke satu pool terpanjang lebih dulu agar bucket penyedia dapat mengemas pekerjaan Claude, Codex, dan Gemini bersama-sama. Runner berhenti menjadwalkan jalur pooled baru setelah kegagalan pertama kecuali `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` disetel, dan setiap jalur memiliki timeout fallback 120 menit yang dapat ditimpa dengan `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; jalur live/tail terpilih menggunakan batas per-jalur yang lebih ketat. Perintah penyiapan Docker backend CLI memiliki timeout sendiri melalui `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (default 180). Log per-jalur, `summary.json`, `failures.json`, dan waktu fase ditulis di bawah `.artifacts/docker-tests/<run-id>/`; gunakan `pnpm test:docker:timings <summary.json>` untuk memeriksa jalur lambat dan `pnpm test:docker:rerun <run-id|summary.json|failures.json>` untuk mencetak perintah rerun tertarget yang murah.
- `pnpm test:docker:browser-cdp-snapshot`: Membangun kontainer E2E sumber berbasis Chromium, memulai CDP mentah plus Gateway terisolasi, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP mencakup URL tautan, elemen dapat diklik yang dipromosikan kursor, referensi iframe, dan metadata frame.
- `pnpm test:docker:skill-install`: Menginstal tarball OpenClaw yang dikemas di runner Docker bare, menonaktifkan `skills.install.allowUploadedArchives`, menyelesaikan slug skill saat ini dari pencarian live ClawHub, menginstalnya melalui `openclaw skills install`, dan memverifikasi `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json`, serta `skills info --json`.
- Probe Docker live backend CLI dapat dijalankan sebagai jalur terfokus, misalnya `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume`, atau `pnpm test:docker:live-cli-backend:claude:mcp`. Gemini memiliki alias `:resume` dan `:mcp` yang sesuai.
- `pnpm test:docker:openwebui`: Memulai OpenClaw + Open WebUI dalam Docker, masuk melalui Open WebUI, memeriksa `/api/models`, lalu menjalankan chat nyata yang diproksi melalui `/api/chat/completions`. Memerlukan kunci model live yang dapat digunakan, menarik image Open WebUI eksternal, dan tidak diharapkan stabil di CI seperti rangkaian unit/e2e normal.
- `pnpm test:docker:mcp-channels`: Memulai kontainer Gateway yang sudah di-seed dan kontainer klien kedua yang menjalankan `openclaw mcp serve`, lalu memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran, perilaku antrean event live, routing kirim keluar, serta notifikasi channel + izin bergaya Claude melalui bridge stdio nyata. Asersi notifikasi Claude membaca frame MCP stdio mentah secara langsung sehingga smoke mencerminkan apa yang benar-benar dipancarkan bridge.
- `pnpm test:docker:upgrade-survivor`: Menginstal tarball OpenClaw yang dikemas di atas fixture pengguna lama yang kotor, menjalankan update paket plus doctor non-interaktif tanpa kunci penyedia live atau channel, lalu memulai Gateway loopback dan memeriksa bahwa agent, konfigurasi channel, allowlist plugin, file workspace/session, state dependensi plugin legacy yang stale, startup, dan status RPC tetap bertahan.
- `pnpm test:docker:published-upgrade-survivor`: Menginstal `openclaw@latest` secara default, melakukan seed file pengguna yang ada secara realistis tanpa kunci penyedia live atau channel, mengonfigurasi baseline tersebut dengan resep perintah `openclaw config set` yang sudah dibaked, memperbarui instalasi terpublikasi itu ke tarball OpenClaw yang dikemas, menjalankan doctor non-interaktif, menulis `.artifacts/upgrade-survivor/summary.json`, lalu memulai Gateway loopback dan memeriksa bahwa intent terkonfigurasi, file workspace/session, konfigurasi plugin stale dan state dependensi legacy, startup, `/healthz`, `/readyz`, serta status RPC bertahan atau diperbaiki dengan bersih. Timpa satu baseline dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, perluas matriks lokal yang persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` seperti `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, atau tambahkan fixture skenario dengan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; set reported-issues mencakup `configured-plugin-installs` untuk memverifikasi Plugin OpenClaw eksternal terkonfigurasi diinstal otomatis selama upgrade dan `stale-source-plugin-shadow` untuk mencegah shadow plugin khusus sumber merusak startup. Package Acceptance mengeksposnya sebagai `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, dan `published_upgrade_survivor_scenarios`, serta menyelesaikan token baseline meta seperti `last-stable-4` atau `all-since-2026.4.23` sebelum menyerahkan spesifikasi paket persis ke jalur Docker.
- `pnpm test:docker:update-migration`: Menjalankan harness published-upgrade survivor dalam skenario `plugin-deps-cleanup` yang berat pembersihan, dimulai dari `openclaw@2026.4.23` secara default. Workflow `Update Migration` terpisah memperluas jalur ini dengan `baselines=all-since-2026.4.23` sehingga setiap paket stabil terpublikasi dari `.23` dan seterusnya diperbarui ke kandidat dan membuktikan pembersihan dependensi plugin terkonfigurasi di luar Full Release CI.
- `pnpm test:docker:plugins`: Menjalankan smoke instal/update untuk path lokal, `file:`, paket registry npm dengan dependensi hoisted, ref bergerak git, fixture ClawHub, update marketplace, dan enable/inspect bundle Claude.

## Gate PR lokal

Untuk pemeriksaan land/gate PR lokal, jalankan:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jika `pnpm test` tidak stabil pada host yang terbebani, jalankan ulang sekali sebelum menganggapnya sebagai regresi, lalu isolasi dengan `pnpm test <path/to/test>`. Untuk host dengan memori terbatas, gunakan:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Bench latensi model (kunci lokal)

Skrip: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Penggunaan:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- Env opsional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt default: "Balas dengan satu kata: ok. Tanpa tanda baca atau teks tambahan."

Run terakhir (2025-12-31, 20 run):

- minimax median 1279ms (min 1114, maks 2431)
- opus median 2454ms (min 1224, maks 3170)

## Bench startup CLI

Skrip: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Penggunaan:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: kedua preset

Output mencakup `sampleCount`, rata-rata, p50, p95, min/maks, distribusi exit-code/signal, dan ringkasan RSS maks untuk setiap perintah. `--cpu-prof-dir` / `--heap-prof-dir` opsional menulis profil V8 per run sehingga pengambilan timing dan profil memakai harness yang sama.

Konvensi output tersimpan:

- `pnpm test:startup:bench:smoke` menulis artefak smoke tertarget di `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` menulis artefak suite penuh di `.artifacts/cli-startup-bench-all.json` menggunakan `runs=5` dan `warmup=1`
- `pnpm test:startup:bench:update` menyegarkan fixture baseline yang di-check-in di `test/fixtures/cli-startup-bench.json` menggunakan `runs=5` dan `warmup=1`

Fixture yang di-check-in:

- `test/fixtures/cli-startup-bench.json`
- Segarkan dengan `pnpm test:startup:bench:update`
- Bandingkan hasil saat ini dengan fixture menggunakan `pnpm test:startup:bench:check`

## Bench startup Gateway

Skrip: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

Benchmark secara default memakai entry CLI hasil build di `dist/entry.js`; jalankan
`pnpm build` sebelum memakai perintah package-script. Untuk mengukur runner
sumber sebagai gantinya, teruskan `--entry scripts/run-node.mjs` dan pisahkan
hasil tersebut dari baseline entry hasil build.

Penggunaan:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

ID kasus:

- `default`: startup Gateway normal.
- `skipChannels`: startup Gateway dengan startup channel dilewati.
- `oneInternalHook`: satu hook internal yang dikonfigurasi.
- `allInternalHooks`: semua hook internal.
- `fiftyPlugins`: 50 Plugin manifest.
- `fiftyStartupLazyPlugins`: 50 Plugin manifest startup-lazy.

Output mencakup output proses pertama, `/healthz`, `/readyz`, waktu log listen HTTP,
waktu log Gateway ready, waktu CPU, rasio core CPU, RSS maks, heap, metrik trace
startup, delay event-loop, dan metrik detail tabel lookup Plugin. Skrip ini
mengaktifkan `OPENCLAW_GATEWAY_STARTUP_TRACE=1` di lingkungan Gateway anak.

Baca `/healthz` sebagai liveness: server HTTP dapat menjawab. Baca `/readyz` sebagai
readiness yang dapat digunakan: sidecar Plugin startup, channel, dan pekerjaan
post-attach yang kritis untuk ready telah selesai. Hook startup Gateway dikirim
secara asinkron dan bukan bagian dari jaminan readiness. Waktu log ready adalah
timestamp log ready internal Gateway; ini berguna untuk atribusi sisi proses,
tetapi bukan pengganti probe eksternal `/readyz`.

Gunakan output JSON atau `--output` saat membandingkan perubahan. Gunakan `--cpu-prof-dir` hanya
setelah output trace mengarah ke import, compile, atau pekerjaan yang terikat CPU yang tidak dapat
dijelaskan hanya dari timing fase. Jangan bandingkan hasil runner sumber dengan
hasil `dist/entry.js` hasil build sebagai baseline yang sama.

## Bench restart Gateway

Skrip: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

Benchmark restart hanya didukung di macOS dan Linux. Benchmark ini memakai SIGUSR1 untuk
restart dalam proses dan langsung gagal di Windows.

Benchmark secara default memakai entry CLI hasil build di `dist/entry.js`; jalankan
`pnpm build` sebelum memakai perintah package-script. Untuk mengukur runner
sumber sebagai gantinya, teruskan `--entry scripts/run-node.mjs` dan pisahkan
hasil tersebut dari baseline entry hasil build.

Penggunaan:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

ID kasus:

- `skipChannels`: restart dengan channel dilewati.
- `skipChannelsAcpxProbe`: restart dengan channel dilewati dan probe startup ACPX aktif.
- `skipChannelsNoAcpxProbe`: restart dengan channel dilewati dan probe startup ACPX nonaktif.
- `default`: restart normal.
- `fiftyPlugins`: restart dengan 50 Plugin manifest.

Output mencakup `/healthz` berikutnya, `/readyz` berikutnya, downtime, timing ready restart,
CPU, RSS, metrik trace startup untuk proses pengganti, dan metrik trace restart
untuk penanganan signal, drain active-work, fase close, start berikutnya, timing
ready, dan snapshot memori. Skrip ini mengaktifkan
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` dan `OPENCLAW_GATEWAY_RESTART_TRACE=1` di lingkungan
Gateway anak.

Gunakan benchmark ini saat perubahan menyentuh pensinyalan restart, handler close,
startup-after-restart, shutdown sidecar, handoff layanan, atau readiness setelah
restart. Mulai dengan `skipChannels` saat mengisolasi mekanika Gateway dari startup
channel. Gunakan `default` atau kasus berat Plugin hanya setelah kasus sempit menjelaskan
jalur restart.

Metrik trace adalah petunjuk atribusi, bukan vonis. Perubahan restart harus
dinilai dari beberapa sampel, span owner yang cocok, perilaku `/healthz` dan `/readyz`,
serta kontrak restart yang terlihat oleh pengguna.

## E2E onboarding (Docker)

Docker bersifat opsional; ini hanya diperlukan untuk smoke test onboarding dalam container.

Alur cold-start penuh dalam container Linux bersih:

```bash
scripts/e2e/onboard-docker.sh
```

Skrip ini menjalankan wizard interaktif melalui pseudo-tty, memverifikasi file config/workspace/session, lalu memulai Gateway dan menjalankan `openclaw health`.

## Smoke import QR (Docker)

Memastikan helper runtime QR yang dipelihara dimuat di runtime Docker Node yang didukung (Node 24 default, Node 22 kompatibel):

```bash
pnpm test:docker:qr
```

## Terkait

- [Pengujian](/id/help/testing)
- [Pengujian live](/id/help/testing-live)
- [Pengujian pembaruan dan Plugin](/id/help/testing-updates-plugins)
