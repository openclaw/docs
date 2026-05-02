---
read_when:
    - Menjalankan atau memperbaiki pengujian
summary: Cara menjalankan pengujian secara lokal (vitest) dan kapan menggunakan mode force/coverage
title: Pengujian
x-i18n:
    generated_at: "2026-05-02T21:00:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a88599d079e1ca42d73d354b582d67dd85be40fc92eed5abe6dcef37dc21f4f
    source_path: reference/test.md
    workflow: 16
---

- Perangkat pengujian lengkap (suite, live, Docker): [Pengujian](/id/help/testing)
- Validasi pembaruan dan paket Plugin: [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins)

- `pnpm test:force`: Menghentikan proses gateway tersisa yang menahan port kontrol default, lalu menjalankan suite Vitest penuh dengan port gateway terisolasi agar pengujian server tidak bertabrakan dengan instance yang sedang berjalan. Gunakan ini saat proses gateway sebelumnya membuat port 18789 tetap terpakai.
- `pnpm test:coverage`: Menjalankan suite unit dengan cakupan V8 (melalui `vitest.unit.config.ts`). Ini adalah gerbang cakupan unit untuk berkas yang dimuat, bukan cakupan seluruh berkas di seluruh repo. Ambangnya adalah 70% untuk baris/fungsi/pernyataan dan 55% untuk cabang. Karena `coverage.all` bernilai false, gerbang ini mengukur berkas yang dimuat oleh suite cakupan unit, bukan menganggap setiap berkas sumber split-lane sebagai tidak tercakup.
- `pnpm test:coverage:changed`: Menjalankan cakupan unit hanya untuk berkas yang berubah sejak `origin/main`.
- `pnpm test:changed`: eksekusi pengujian perubahan cerdas yang murah. Ini menjalankan target presisi dari edit pengujian langsung, berkas saudara `*.test.ts`, pemetaan sumber eksplisit, dan grafik impor lokal. Perubahan luas/config/package dilewati kecuali perubahan itu memetakan ke pengujian presisi.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: eksekusi pengujian perubahan luas yang eksplisit. Gunakan ini saat edit harness/config/package pengujian perlu jatuh balik ke perilaku changed-test Vitest yang lebih luas.
- `pnpm changed:lanes`: menampilkan lane arsitektural yang dipicu oleh diff terhadap `origin/main`.
- `pnpm check:changed`: menjalankan gerbang pemeriksaan perubahan cerdas untuk diff terhadap `origin/main`. Ini menjalankan typecheck, lint, dan perintah guard untuk lane arsitektural yang terdampak, tetapi tidak menjalankan pengujian Vitest. Gunakan `pnpm test:changed` atau `pnpm test <target>` eksplisit untuk bukti pengujian.
- `pnpm test`: merutekan target berkas/direktori eksplisit melalui lane Vitest berskup. Eksekusi tanpa target memakai grup shard tetap dan diperluas ke config leaf untuk eksekusi paralel lokal; grup ekstensi selalu diperluas ke config shard per ekstensi, bukan satu proses root-project besar.
- Eksekusi pembungkus pengujian berakhir dengan ringkasan singkat `[test] passed|failed|skipped ... in ...`. Baris durasi milik Vitest tetap menjadi detail per shard.
- Status pengujian OpenClaw bersama: gunakan `src/test-utils/openclaw-test-state.ts` dari Vitest saat pengujian memerlukan `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture config, workspace, direktori agen, atau penyimpanan auth-profile yang terisolasi.
- Helper E2E proses: gunakan `test/helpers/openclaw-test-instance.ts` saat pengujian E2E level proses Vitest memerlukan Gateway yang berjalan, env CLI, penangkapan log, dan pembersihan di satu tempat.
- Helper E2E Docker/Bash: lane yang melakukan source `scripts/lib/docker-e2e-image.sh` dapat meneruskan `docker_e2e_test_state_shell_b64 <label> <scenario>` ke dalam container dan mendekodenya dengan `scripts/lib/openclaw-e2e-instance.sh`; skrip multi-home dapat meneruskan `docker_e2e_test_state_function_b64` dan memanggil `openclaw_test_state_create <label> <scenario>` di setiap alur. Pemanggil tingkat lebih rendah dapat menggunakan `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` untuk snippet shell dalam container, atau `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` untuk berkas env host yang dapat di-source. `--` sebelum `create` mencegah runtime Node yang lebih baru memperlakukan `--env-file` sebagai flag Node. Lane Docker/Bash yang meluncurkan Gateway dapat melakukan source `scripts/lib/openclaw-e2e-instance.sh` di dalam container untuk resolusi entrypoint, startup OpenAI tiruan, peluncuran Gateway foreground/background, probe kesiapan, ekspor env status, dump log, dan pembersihan proses.
- Eksekusi shard penuh, ekstensi, dan include-pattern memperbarui data timing lokal di `.artifacts/vitest-shard-timings.json`; eksekusi whole-config berikutnya memakai timing tersebut untuk menyeimbangkan shard lambat dan cepat. Shard CI include-pattern menambahkan nama shard ke kunci timing, sehingga timing shard terfilter tetap terlihat tanpa mengganti data timing whole-config. Setel `OPENCLAW_TEST_PROJECTS_TIMINGS=0` untuk mengabaikan artefak timing lokal.
- Berkas pengujian `plugin-sdk` dan `commands` terpilih kini dirutekan melalui lane ringan khusus yang hanya mempertahankan `test/setup.ts`, sementara kasus berat-runtime tetap berada di lane yang sudah ada.
- Berkas sumber dengan pengujian saudara dipetakan ke saudara tersebut sebelum jatuh balik ke glob direktori yang lebih luas. Edit helper di bawah `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers`, dan `src/plugins/contracts` memakai grafik impor lokal untuk menjalankan pengujian yang mengimpor, bukan menjalankan luas setiap shard ketika jalur dependensi presisi.
- `auto-reply` kini juga dibagi menjadi tiga config khusus (`core`, `top-level`, `reply`) sehingga harness reply tidak mendominasi pengujian status/token/helper top-level yang lebih ringan.
- Config dasar Vitest kini default ke `pool: "threads"` dan `isolate: false`, dengan runner non-terisolasi bersama diaktifkan di seluruh config repo.
- `pnpm test:channels` menjalankan `vitest.channels.config.ts`.
- `pnpm test:extensions` dan `pnpm test extensions` menjalankan semua shard ekstensi/plugin. Plugin kanal berat, Plugin browser, dan OpenAI berjalan sebagai shard khusus; grup Plugin lain tetap dibatch. Gunakan `pnpm test extensions/<id>` untuk satu lane Plugin bundel.
- `pnpm test:perf:imports`: mengaktifkan pelaporan durasi impor + rincian impor Vitest, sambil tetap memakai routing lane berskup untuk target berkas/direktori eksplisit.
- `pnpm test:perf:imports:changed`: profiling impor yang sama, tetapi hanya untuk berkas yang berubah sejak `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` membenchmark jalur changed-mode yang dirutekan terhadap eksekusi root-project native untuk diff git committed yang sama.
- `pnpm test:perf:changed:bench -- --worktree` membenchmark set perubahan worktree saat ini tanpa perlu commit terlebih dahulu.
- `pnpm test:perf:profile:main`: menulis profil CPU untuk thread utama Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: menulis profil CPU + heap untuk runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: menjalankan setiap config leaf Vitest full-suite secara serial dan menulis data durasi terkelompok plus artefak JSON/log per config. Test Performance Agent memakai ini sebagai baseline sebelum mencoba perbaikan pengujian lambat.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: membandingkan laporan terkelompok setelah perubahan yang berfokus pada performa.
- Integrasi Gateway: ikut serta melalui `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` atau `pnpm test:gateway`.
- `pnpm test:e2e`: Menjalankan smoke test end-to-end gateway (pairing multi-instance WS/HTTP/node). Default ke `threads` + `isolate: false` dengan worker adaptif di `vitest.e2e.config.ts`; sesuaikan dengan `OPENCLAW_E2E_WORKERS=<n>` dan setel `OPENCLAW_E2E_VERBOSE=1` untuk log verbose.
- `pnpm test:live`: Menjalankan pengujian live provider (minimax/zai). Memerlukan kunci API dan `LIVE=1` (atau `*_LIVE_TEST=1` khusus provider) agar tidak dilewati.
- `pnpm test:docker:all`: Membangun image live-test bersama, mengemas OpenClaw sekali sebagai tarball npm, membangun/memakai ulang image runner Node/Git kosong plus image fungsional yang memasang tarball itu ke `/app`, lalu menjalankan lane smoke Docker dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` melalui scheduler berbobot. Image kosong (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) dipakai untuk lane installer/update/plugin-dependency; lane tersebut memasang tarball prabangun, bukan memakai sumber repo yang disalin. Image fungsional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) dipakai untuk lane fungsionalitas built-app normal. `scripts/package-openclaw-for-docker.mjs` adalah satu-satunya packer package lokal/CI dan memvalidasi tarball plus `dist/postinstall-inventory.json` sebelum Docker mengonsumsinya. Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika planner berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` mengeksekusi rencana terpilih. `node scripts/test-docker-all.mjs --plan-json` memancarkan rencana CI milik scheduler untuk lane terpilih, jenis image, kebutuhan package/live-image, skenario status, dan pemeriksaan kredensial tanpa membangun atau menjalankan Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` mengontrol slot proses dan default ke 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` mengontrol pool tail sensitif-provider dan default ke 10. Batas lane berat default ke `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; batas provider default ke satu lane berat per provider melalui `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, dan `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Gunakan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` untuk host yang lebih besar. Jika satu lane melebihi batas bobot atau sumber daya efektif pada host dengan paralelisme rendah, lane itu masih dapat dimulai dari pool kosong dan akan berjalan sendiri sampai melepaskan kapasitas. Mulai lane dijeda 2 detik secara default untuk menghindari lonjakan create daemon Docker lokal; timpa dengan `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner melakukan preflight Docker secara default, membersihkan container E2E OpenClaw yang usang, memancarkan status active-lane setiap 30 detik, berbagi cache tool CLI provider antar lane yang kompatibel, mencoba ulang kegagalan live-provider sementara satu kali secara default (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), dan menyimpan timing lane di `.artifacts/docker-tests/lane-timings.json` untuk pengurutan paling lama terlebih dahulu pada eksekusi berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifes lane tanpa menjalankan Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` untuk menyesuaikan output status, atau `OPENCLAW_DOCKER_ALL_TIMINGS=0` untuk menonaktifkan penggunaan ulang timing. Gunakan `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` hanya untuk lane deterministik/lokal atau `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` hanya untuk lane live-provider; alias package adalah `pnpm test:docker:local:all` dan `pnpm test:docker:live:all`. Mode live-only menggabungkan lane live utama dan tail menjadi satu pool paling lama terlebih dahulu sehingga bucket provider dapat memadatkan pekerjaan Claude, Codex, dan Gemini bersama-sama. Runner berhenti menjadwalkan lane pooled baru setelah kegagalan pertama kecuali `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` disetel, dan setiap lane memiliki timeout fallback 120 menit yang dapat ditimpa dengan `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lane live/tail terpilih memakai batas per-lane yang lebih ketat. Perintah setup Docker backend CLI memiliki timeout sendiri melalui `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (default 180). Log per lane, `summary.json`, `failures.json`, dan timing fase ditulis di bawah `.artifacts/docker-tests/<run-id>/`; gunakan `pnpm test:docker:timings <summary.json>` untuk memeriksa lane lambat dan `pnpm test:docker:rerun <run-id|summary.json|failures.json>` untuk mencetak perintah rerun tertarget yang murah.
- `pnpm test:docker:browser-cdp-snapshot`: Membangun container E2E sumber berbasis Chromium, memulai CDP mentah plus Gateway terisolasi, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP menyertakan URL tautan, clickable yang dipromosikan kursor, ref iframe, dan metadata frame.
- Probe Docker live backend CLI dapat dijalankan sebagai lane terfokus, misalnya `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume`, atau `pnpm test:docker:live-cli-backend:codex:mcp`. Claude dan Gemini memiliki alias `:resume` dan `:mcp` yang sesuai.
- `pnpm test:docker:openwebui`: Memulai OpenClaw + Open WebUI dalam Docker, masuk melalui Open WebUI, memeriksa `/api/models`, lalu menjalankan chat terproksi nyata melalui `/api/chat/completions`. Memerlukan kunci model live yang dapat digunakan (misalnya OpenAI di `~/.profile`), menarik image Open WebUI eksternal, dan tidak diharapkan stabil untuk CI seperti suite unit/e2e normal.
- `pnpm test:docker:mcp-channels`: Memulai container Gateway berseed dan container klien kedua yang menjalankan `openclaw mcp serve`, lalu memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran, perilaku antrean event live, routing kirim outbound, serta notifikasi kanal + izin bergaya Claude melalui bridge stdio nyata. Assertion notifikasi Claude membaca frame MCP stdio mentah secara langsung sehingga smoke mencerminkan apa yang benar-benar dipancarkan bridge.
- `pnpm test:docker:upgrade-survivor`: Menginstal tarball OpenClaw yang sudah dipaketkan di atas fixture pengguna lama yang kotor, menjalankan pembaruan paket plus `doctor` non-interaktif tanpa kunci penyedia atau kanal live, lalu memulai Gateway loopback dan memeriksa bahwa agen, konfigurasi kanal, daftar izin Plugin, file workspace/sesi, status dependensi Plugin lama yang usang, startup, dan status RPC tetap bertahan.
- `pnpm test:docker:published-upgrade-survivor`: Menginstal `openclaw@latest` secara default, melakukan seed file pengguna yang sudah ada secara realistis tanpa kunci penyedia atau kanal live, mengonfigurasi baseline tersebut dengan resep perintah `openclaw config set` bawaan, memperbarui instalasi terbitan tersebut ke tarball OpenClaw yang sudah dipaketkan, menjalankan `doctor` non-interaktif, menulis `.artifacts/upgrade-survivor/summary.json`, lalu memulai Gateway loopback dan memeriksa bahwa intent yang dikonfigurasi, file workspace/sesi, konfigurasi Plugin usang dan status dependensi lama, startup, `/healthz`, `/readyz`, dan status RPC tetap bertahan atau diperbaiki dengan bersih. Timpa satu baseline dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, perluas matriks persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` seperti `all-since-2026.4.23`, atau tambahkan fixture skenario dengan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; set reported-issues mencakup `configured-plugin-installs` untuk memverifikasi bahwa Plugin OpenClaw eksternal yang dikonfigurasi terinstal secara otomatis selama pemutakhiran. Package Acceptance mengeksposnya sebagai `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, dan `published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration`: Menjalankan harness published-upgrade survivor dalam skenario `plugin-deps-cleanup` yang berat pembersihan, dimulai dari `openclaw@2026.4.23` secara default. Workflow `Update Migration` terpisah memperluas lane ini dengan `baselines=all-since-2026.4.23` sehingga setiap paket stabil yang sudah diterbitkan dari `.23` dan seterusnya diperbarui ke kandidat dan membuktikan pembersihan dependensi Plugin yang dikonfigurasi di luar Full Release CI.
- `pnpm test:docker:plugins`: Menjalankan smoke instal/pembaruan untuk path lokal, paket registry npm `file:` dengan dependensi yang di-hoist, ref git yang bergerak, fixture ClawHub, pembaruan marketplace, serta enable/inspect bundle Claude.

## Gerbang PR lokal

Untuk pemeriksaan pendaratan/gerbang PR lokal, jalankan:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jika `pnpm test` mengalami kegagalan tidak stabil pada host berbeban tinggi, jalankan ulang sekali sebelum memperlakukannya sebagai regresi, lalu isolasi dengan `pnpm test <path/to/test>`. Untuk host dengan memori terbatas, gunakan:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark latensi model (kunci lokal)

Skrip: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Penggunaan:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opsional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt default: “Balas dengan satu kata: ok. Tanpa tanda baca atau teks tambahan.”

Jalankan terakhir (2025-12-31, 20 kali jalan):

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

Output mencakup `sampleCount`, rata-rata, p50, p95, min/maks, distribusi kode keluar/sinyal, dan ringkasan RSS maks untuk setiap perintah. `--cpu-prof-dir` / `--heap-prof-dir` opsional menulis profil V8 per jalan sehingga pengambilan waktu dan profil menggunakan harness yang sama.

Konvensi output tersimpan:

- `pnpm test:startup:bench:smoke` menulis artefak smoke tertarget di `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` menulis artefak suite lengkap di `.artifacts/cli-startup-bench-all.json` menggunakan `runs=5` dan `warmup=1`
- `pnpm test:startup:bench:update` menyegarkan fixture baseline yang disimpan di repo pada `test/fixtures/cli-startup-bench.json` menggunakan `runs=5` dan `warmup=1`

Fixture yang disimpan di repo:

- `test/fixtures/cli-startup-bench.json`
- Segarkan dengan `pnpm test:startup:bench:update`
- Bandingkan hasil saat ini dengan fixture menggunakan `pnpm test:startup:bench:check`

## E2E onboarding (Docker)

Docker bersifat opsional; ini hanya diperlukan untuk uji smoke onboarding dalam container.

Alur cold-start penuh dalam container Linux yang bersih:

```bash
scripts/e2e/onboard-docker.sh
```

Skrip ini mengendalikan wizard interaktif melalui pseudo-tty, memverifikasi file config/workspace/session, lalu memulai Gateway dan menjalankan `openclaw health`.

## Smoke impor QR (Docker)

Memastikan helper runtime QR yang dipelihara dimuat di runtime Docker Node yang didukung (Node 24 default, Node 22 kompatibel):

```bash
pnpm test:docker:qr
```

## Terkait

- [Pengujian](/id/help/testing)
- [Pengujian live](/id/help/testing-live)
- [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins)
