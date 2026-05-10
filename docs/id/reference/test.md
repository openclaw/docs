---
read_when:
    - Menjalankan atau memperbaiki pengujian
summary: Cara menjalankan tes secara lokal (vitest) dan kapan menggunakan mode force/coverage
title: Pengujian
x-i18n:
    generated_at: "2026-05-10T19:52:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: be939951f186df407aca8b3e4abbdbbd50f2f87c538c28c91745f9c6833df0d7
    source_path: reference/test.md
    workflow: 16
---

- Kit pengujian lengkap (suite, langsung, Docker): [Pengujian](/id/help/testing)
- Validasi pembaruan dan paket Plugin: [Pengujian pembaruan dan Plugin](/id/help/testing-updates-plugins)

- `pnpm test:force`: Mematikan proses Gateway tersisa yang menahan port kontrol default, lalu menjalankan seluruh suite Vitest dengan port Gateway terisolasi agar pengujian server tidak bertabrakan dengan instans yang sedang berjalan. Gunakan ini ketika proses Gateway sebelumnya membuat port 18789 tetap terpakai.
- `pnpm test:coverage`: Menjalankan suite unit dengan cakupan V8 (melalui `vitest.unit.config.ts`). Ini adalah gate cakupan jalur unit default, bukan cakupan semua file seluruh repo. Ambangnya adalah 70% baris/fungsi/pernyataan dan 55% cabang. Karena `coverage.all` bernilai false dan cakupan jalur default menyertakan pengujian unit non-cepat dengan file sumber saudara, gate ini mengukur sumber yang dimiliki jalur ini, bukan setiap impor transitif yang kebetulan dimuat.
- `pnpm test:coverage:changed`: Menjalankan cakupan unit hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:changed`: menjalankan pengujian perubahan cerdas yang murah. Ini menjalankan target presisi dari edit pengujian langsung, file `*.test.ts` saudara, pemetaan sumber eksplisit, dan grafik impor lokal. Perubahan luas/konfigurasi/paket dilewati kecuali memetakan ke pengujian presisi.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: menjalankan pengujian perubahan luas secara eksplisit. Gunakan ketika edit harness/konfigurasi/paket pengujian harus kembali ke perilaku pengujian perubahan Vitest yang lebih luas.
- `pnpm changed:lanes`: menampilkan jalur arsitektur yang dipicu oleh diff terhadap `origin/main`.
- `pnpm check:changed`: menjalankan gate pemeriksaan perubahan cerdas untuk diff terhadap `origin/main`. Ini menjalankan typecheck, lint, dan perintah guard untuk jalur arsitektur yang terdampak, tetapi tidak menjalankan pengujian Vitest. Gunakan `pnpm test:changed` atau `pnpm test <target>` eksplisit untuk bukti pengujian.
- `pnpm test`: merutekan target file/direktori eksplisit melalui jalur Vitest terskop. Proses tanpa target menggunakan grup shard tetap dan diperluas ke konfigurasi daun untuk eksekusi paralel lokal; grup ekstensi selalu diperluas ke konfigurasi shard per-ekstensi, bukan satu proses proyek root raksasa.
- Proses wrapper pengujian berakhir dengan ringkasan singkat `[test] passed|failed|skipped ... in ...`. Baris durasi milik Vitest tetap menjadi detail per-shard.
- Status pengujian OpenClaw bersama: gunakan `src/test-utils/openclaw-test-state.ts` dari Vitest ketika pengujian memerlukan `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture konfigurasi, workspace, direktori agen, atau penyimpanan auth-profile yang terisolasi.
- Helper E2E proses: gunakan `test/helpers/openclaw-test-instance.ts` ketika pengujian E2E tingkat proses Vitest memerlukan Gateway berjalan, env CLI, penangkapan log, dan pembersihan di satu tempat.
- Helper E2E Docker/Bash: jalur yang mengambil sumber `scripts/lib/docker-e2e-image.sh` dapat meneruskan `docker_e2e_test_state_shell_b64 <label> <scenario>` ke dalam container dan mendekodenya dengan `scripts/lib/openclaw-e2e-instance.sh`; skrip multi-home dapat meneruskan `docker_e2e_test_state_function_b64` dan memanggil `openclaw_test_state_create <label> <scenario>` di tiap alur. Pemanggil tingkat lebih rendah dapat menggunakan `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` untuk cuplikan shell dalam container, atau `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` untuk file env host yang dapat di-source. `--` sebelum `create` mencegah runtime Node yang lebih baru memperlakukan `--env-file` sebagai flag Node. Jalur Docker/Bash yang meluncurkan Gateway dapat mengambil sumber `scripts/lib/openclaw-e2e-instance.sh` di dalam container untuk resolusi entrypoint, startup OpenAI tiruan, peluncuran Gateway foreground/background, probe kesiapan, ekspor env status, dump log, dan pembersihan proses.
- Proses shard penuh, ekstensi, dan pola-include memperbarui data waktu lokal di `.artifacts/vitest-shard-timings.json`; proses seluruh konfigurasi berikutnya menggunakan waktu tersebut untuk menyeimbangkan shard lambat dan cepat. Shard CI pola-include menambahkan nama shard ke kunci waktu, sehingga waktu shard terfilter tetap terlihat tanpa mengganti data waktu seluruh konfigurasi. Setel `OPENCLAW_TEST_PROJECTS_TIMINGS=0` untuk mengabaikan artefak waktu lokal.
- File pengujian `plugin-sdk` dan `commands` terpilih kini dirutekan melalui jalur ringan khusus yang hanya mempertahankan `test/setup.ts`, sementara kasus yang berat runtime tetap berada di jalur yang sudah ada.
- File sumber dengan pengujian saudara dipetakan ke saudara tersebut sebelum kembali ke glob direktori yang lebih luas. Edit helper di bawah `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers`, dan `src/plugins/contracts` menggunakan grafik impor lokal untuk menjalankan pengujian yang mengimpor, bukan menjalankan luas setiap shard ketika jalur dependensinya presisi.
- `auto-reply` kini juga dipisah menjadi tiga konfigurasi khusus (`core`, `top-level`, `reply`) agar harness balasan tidak mendominasi pengujian status/token/helper tingkat atas yang lebih ringan.
- Konfigurasi Vitest dasar kini secara default menggunakan `pool: "threads"` dan `isolate: false`, dengan runner non-terisolasi bersama diaktifkan di seluruh konfigurasi repo.
- `pnpm test:channels` menjalankan `vitest.channels.config.ts`.
- `pnpm test:extensions` dan `pnpm test extensions` menjalankan semua shard ekstensi/Plugin. Plugin kanal berat, Plugin browser, dan OpenAI berjalan sebagai shard khusus; grup Plugin lain tetap dibatch. Gunakan `pnpm test extensions/<id>` untuk satu jalur Plugin bawaan.
- `pnpm test:perf:imports`: mengaktifkan pelaporan durasi impor + rincian impor Vitest, sambil tetap menggunakan perutean jalur terskop untuk target file/direktori eksplisit.
- `pnpm test:perf:imports:changed`: pembuatan profil impor yang sama, tetapi hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan performa jalur mode perubahan yang dirutekan dengan proses proyek root native untuk diff git ter-commit yang sama.
- `pnpm test:perf:changed:bench -- --worktree` membandingkan performa set perubahan worktree saat ini tanpa melakukan commit terlebih dahulu.
- `pnpm test:perf:profile:main`: menulis profil CPU untuk thread utama Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: menulis profil CPU + heap untuk runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: menjalankan setiap konfigurasi daun Vitest suite penuh secara serial dan menulis data durasi terkelompok plus artefak JSON/log per-konfigurasi. Agen Performa Pengujian menggunakan ini sebagai baseline sebelum mencoba perbaikan pengujian lambat.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: membandingkan laporan terkelompok setelah perubahan yang berfokus pada performa.
- Integrasi Gateway: ikut serta melalui `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` atau `pnpm test:gateway`.
- `pnpm test:e2e`: Menjalankan pengujian smoke end-to-end Gateway (pemasangan multi-instans WS/HTTP/node). Default ke `threads` + `isolate: false` dengan worker adaptif di `vitest.e2e.config.ts`; sesuaikan dengan `OPENCLAW_E2E_WORKERS=<n>` dan setel `OPENCLAW_E2E_VERBOSE=1` untuk log verbose.
- `pnpm test:live`: Menjalankan pengujian live provider (minimax/zai). Memerlukan kunci API dan `LIVE=1` (atau `*_LIVE_TEST=1` spesifik provider) agar tidak dilewati.
- `pnpm test:docker:all`: Membangun image live-test bersama, mengemas OpenClaw sekali sebagai tarball npm, membangun/menggunakan ulang image runner Node/Git polos plus image fungsional yang menginstal tarball tersebut ke `/app`, lalu menjalankan jalur smoke Docker dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` melalui penjadwal berbobot. Image polos (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) digunakan untuk jalur installer/update/dependensi-Plugin; jalur tersebut memasang tarball prabangun, bukan menggunakan sumber repo yang disalin. Image fungsional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) digunakan untuk jalur fungsionalitas aplikasi-terbangun normal. `scripts/package-openclaw-for-docker.mjs` adalah pengemas paket lokal/CI tunggal dan memvalidasi tarball plus `dist/postinstall-inventory.json` sebelum Docker mengonsumsinya. Definisi jalur Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika perencana berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` mengeksekusi rencana terpilih. `node scripts/test-docker-all.mjs --plan-json` memancarkan rencana CI milik penjadwal untuk jalur terpilih, jenis image, kebutuhan paket/live-image, skenario status, dan pemeriksaan kredensial tanpa membangun atau menjalankan Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` mengontrol slot proses dan default ke 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` mengontrol pool ekor yang sensitif provider dan default ke 10. Batas jalur berat default ke `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; batas provider default ke satu jalur berat per provider melalui `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, dan `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Gunakan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` untuk host yang lebih besar. Jika satu jalur melebihi batas bobot atau sumber daya efektif pada host dengan paralelisme rendah, jalur itu tetap dapat dimulai dari pool kosong dan akan berjalan sendiri sampai melepas kapasitas. Awal jalur diberi jeda 2 detik secara default untuk menghindari lonjakan pembuatan daemon Docker lokal; timpa dengan `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner melakukan preflight Docker secara default, membersihkan container E2E OpenClaw usang, memancarkan status jalur aktif setiap 30 detik, berbagi cache alat CLI provider antarjalur yang kompatibel, mencoba ulang kegagalan live-provider sementara sekali secara default (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), dan menyimpan waktu jalur di `.artifacts/docker-tests/lane-timings.json` untuk pengurutan terlama-dulu pada proses berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifes jalur tanpa menjalankan Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` untuk menyesuaikan output status, atau `OPENCLAW_DOCKER_ALL_TIMINGS=0` untuk menonaktifkan penggunaan ulang waktu. Gunakan `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` hanya untuk jalur deterministik/lokal atau `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` hanya untuk jalur live-provider; alias paketnya adalah `pnpm test:docker:local:all` dan `pnpm test:docker:live:all`. Mode hanya-live menggabungkan jalur live utama dan ekor ke satu pool terlama-dulu sehingga bucket provider dapat mengemas pekerjaan Claude, Codex, dan Gemini bersama-sama. Runner berhenti menjadwalkan jalur pool baru setelah kegagalan pertama kecuali `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` disetel, dan setiap jalur memiliki timeout fallback 120 menit yang dapat ditimpa dengan `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; jalur live/ekor terpilih menggunakan batas per-jalur yang lebih ketat. Perintah setup Docker backend CLI memiliki timeout sendiri melalui `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (default 180). Log per-jalur, `summary.json`, `failures.json`, dan waktu fase ditulis di bawah `.artifacts/docker-tests/<run-id>/`; gunakan `pnpm test:docker:timings <summary.json>` untuk memeriksa jalur lambat dan `pnpm test:docker:rerun <run-id|summary.json|failures.json>` untuk mencetak perintah rerun tertarget yang murah.
- `pnpm test:docker:browser-cdp-snapshot`: Membangun container E2E sumber berbasis Chromium, memulai CDP mentah plus Gateway terisolasi, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP menyertakan URL tautan, elemen dapat diklik yang dipromosikan kursor, referensi iframe, dan metadata frame.
- `pnpm test:docker:skill-install`: Menginstal tarball OpenClaw yang dikemas di runner Docker polos, menonaktifkan `skills.install.allowUploadedArchives`, menyelesaikan slug skill saat ini dari pencarian ClawHub live, menginstalnya melalui `openclaw skills install`, dan memverifikasi `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json`, serta `skills info --json`.
- Probe Docker live backend CLI dapat dijalankan sebagai jalur terfokus, misalnya `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume`, atau `pnpm test:docker:live-cli-backend:codex:mcp`. Claude dan Gemini memiliki alias `:resume` dan `:mcp` yang sesuai.
- `pnpm test:docker:openwebui`: Memulai OpenClaw + Open WebUI dalam Docker, masuk melalui Open WebUI, memeriksa `/api/models`, lalu menjalankan chat nyata yang diproksi melalui `/api/chat/completions`. Memerlukan kunci model live yang dapat digunakan (misalnya OpenAI di `~/.profile`), menarik image Open WebUI eksternal, dan tidak diharapkan stabil di CI seperti suite unit/e2e normal.
- `pnpm test:docker:mcp-channels`: Memulai container Gateway berseed dan container klien kedua yang men-spawn `openclaw mcp serve`, lalu memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran, perilaku antrean peristiwa live, perutean pengiriman keluar, serta notifikasi kanal + izin bergaya Claude melalui bridge stdio nyata. Assertion notifikasi Claude membaca frame MCP stdio mentah secara langsung sehingga smoke mencerminkan apa yang benar-benar dipancarkan oleh bridge.
- `pnpm test:docker:upgrade-survivor`: Menginstal tarball OpenClaw yang dipaketkan di atas fixture pengguna lama yang kotor, menjalankan pembaruan paket plus doctor non-interaktif tanpa kunci penyedia atau kanal live, lalu memulai Gateway loopback dan memeriksa bahwa agent, konfigurasi kanal, allowlist plugin, file workspace/session, status dependensi plugin legacy yang usang, startup, dan status RPC tetap bertahan.
- `pnpm test:docker:published-upgrade-survivor`: Menginstal `openclaw@latest` secara default, men-seed file pengguna yang sudah ada secara realistis tanpa kunci penyedia atau kanal live, mengonfigurasi baseline itu dengan resep perintah `openclaw config set` bawaan, memperbarui instalasi terpublikasi itu ke tarball OpenClaw yang dipaketkan, menjalankan doctor non-interaktif, menulis `.artifacts/upgrade-survivor/summary.json`, lalu memulai Gateway loopback dan memeriksa bahwa intent yang dikonfigurasi, file workspace/session, konfigurasi plugin usang dan status dependensi legacy, startup, `/healthz`, `/readyz`, dan status RPC tetap bertahan atau diperbaiki dengan bersih. Timpa satu baseline dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, perluas matriks lokal eksak dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` seperti `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, atau tambahkan fixture skenario dengan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; set reported-issues mencakup `configured-plugin-installs` untuk memverifikasi bahwa plugin OpenClaw eksternal yang dikonfigurasi otomatis terinstal selama upgrade dan `stale-source-plugin-shadow` untuk menjaga shadow plugin khusus sumber agar tidak merusak startup. Package Acceptance mengeksposnya sebagai `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, dan `published_upgrade_survivor_scenarios`, serta me-resolve token baseline meta seperti `last-stable-4` atau `all-since-2026.4.23` sebelum menyerahkan spec paket eksak ke lane Docker.
- `pnpm test:docker:update-migration`: Menjalankan harness published-upgrade survivor dalam skenario `plugin-deps-cleanup` yang berat pembersihan, dimulai dari `openclaw@2026.4.23` secara default. Workflow `Update Migration` terpisah memperluas lane ini dengan `baselines=all-since-2026.4.23` sehingga setiap paket terpublikasi stabil dari `.23` dan seterusnya diperbarui ke kandidat dan membuktikan pembersihan dependensi plugin yang dikonfigurasi di luar Full Release CI.
- `pnpm test:docker:plugins`: Menjalankan smoke install/update untuk jalur lokal, `file:`, paket registry npm dengan dependensi yang di-hoist, ref git bergerak, fixture ClawHub, pembaruan marketplace, dan enable/inspect bundle Claude.

## Gerbang PR lokal

Untuk pemeriksaan pelandasan/gerbang PR lokal, jalankan:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jika `pnpm test` flake pada host yang terbebani, jalankan ulang sekali sebelum menganggapnya sebagai regresi, lalu isolasi dengan `pnpm test <path/to/test>`. Untuk host dengan memori terbatas, gunakan:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark latensi model (kunci lokal)

Skrip: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Penggunaan:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opsional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt bawaan: "Balas dengan satu kata: ok. Tanpa tanda baca atau teks tambahan."

Eksekusi terakhir (2025-12-31, 20 run):

- minimax median 1279ms (min 1114, maks 2431)
- opus median 2454ms (min 1224, maks 3170)

## Benchmark startup CLI

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

Output mencakup `sampleCount`, rata-rata, p50, p95, min/maks, distribusi exit-code/signal, dan ringkasan RSS maks untuk setiap perintah. `--cpu-prof-dir` / `--heap-prof-dir` opsional menulis profil V8 per run sehingga pengaturan waktu dan penangkapan profil menggunakan harness yang sama.

Konvensi output tersimpan:

- `pnpm test:startup:bench:smoke` menulis artefak smoke yang ditargetkan di `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` menulis artefak suite penuh di `.artifacts/cli-startup-bench-all.json` menggunakan `runs=5` dan `warmup=1`
- `pnpm test:startup:bench:update` menyegarkan fixture baseline yang di-check-in di `test/fixtures/cli-startup-bench.json` menggunakan `runs=5` dan `warmup=1`

Fixture yang di-check-in:

- `test/fixtures/cli-startup-bench.json`
- Segarkan dengan `pnpm test:startup:bench:update`
- Bandingkan hasil saat ini dengan fixture menggunakan `pnpm test:startup:bench:check`

## E2E onboarding (Docker)

Docker bersifat opsional; ini hanya diperlukan untuk uji smoke onboarding yang dikontainerisasi.

Alur cold-start penuh dalam kontainer Linux yang bersih:

```bash
scripts/e2e/onboard-docker.sh
```

Skrip ini menjalankan wizard interaktif melalui pseudo-tty, memverifikasi file config/workspace/session, lalu memulai gateway dan menjalankan `openclaw health`.

## Smoke impor QR (Docker)

Memastikan helper runtime QR yang dipelihara dimuat di runtime Docker Node yang didukung (Node 24 default, Node 22 kompatibel):

```bash
pnpm test:docker:qr
```

## Terkait

- [Pengujian](/id/help/testing)
- [Pengujian live](/id/help/testing-live)
- [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins)
