---
read_when:
    - Anda perlu memahami mengapa sebuah pekerjaan CI dijalankan atau tidak dijalankan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
summary: Grafik pekerjaan CI, gerbang cakupan, dan padanan perintah lokal
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-21T19:20:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d01a178402976cdf7c3c864695e8a12d3f7d1d069a77ea1b02a8aef2a3497f7
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

CI berjalan pada setiap push ke `main` dan setiap pull request. CI menggunakan cakupan cerdas untuk melewati pekerjaan mahal ketika hanya area yang tidak terkait yang berubah.

## Gambaran Umum Pekerjaan

| Pekerjaan                        | Tujuan                                                                                      | Kapan dijalankan                    |
| -------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Mendeteksi perubahan khusus docs, cakupan yang berubah, extension yang berubah, dan membangun manifes CI | Selalu pada push dan PR non-draf    |
| `security-scm-fast`              | Deteksi private key dan audit workflow melalui `zizmor`                                     | Selalu pada push dan PR non-draf    |
| `security-dependency-audit`      | Audit lockfile produksi bebas dependensi terhadap advisory npm                              | Selalu pada push dan PR non-draf    |
| `security-fast`                  | Agregat wajib untuk pekerjaan keamanan cepat                                                | Selalu pada push dan PR non-draf    |
| `build-artifacts`                | Membangun `dist/` dan UI Control sekali, lalu mengunggah artifact yang dapat digunakan ulang untuk pekerjaan hilir | Perubahan yang relevan dengan Node  |
| `checks-fast-core`               | Lane koreksi Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol               | Perubahan yang relevan dengan Node  |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel yang di-shard dengan hasil pemeriksaan agregat yang stabil      | Perubahan yang relevan dengan Node  |
| `checks-node-extensions`         | Shard pengujian Plugin bawaan penuh di seluruh suite extension                              | Perubahan yang relevan dengan Node  |
| `checks-node-core-test`          | Shard pengujian core Node, tidak termasuk lane channel, bundled, kontrak, dan extension    | Perubahan yang relevan dengan Node  |
| `extension-fast`                 | Pengujian terfokus hanya untuk Plugin bawaan yang berubah                                   | Saat perubahan extension terdeteksi |
| `check`                          | Padanan gerbang lokal utama yang di-shard: tipe produksi, lint, guard, tipe pengujian, dan smoke ketat | Perubahan yang relevan dengan Node  |
| `check-additional`               | Guard arsitektur, boundary, permukaan extension, package-boundary, dan shard gateway-watch | Perubahan yang relevan dengan Node  |
| `build-smoke`                    | Pengujian smoke CLI hasil build dan smoke memori saat startup                               | Perubahan yang relevan dengan Node  |
| `checks`                         | Lane Linux Node yang tersisa: pengujian channel dan kompatibilitas Node 22 khusus push      | Perubahan yang relevan dengan Node  |
| `check-docs`                     | Pemeriksaan format docs, lint, dan tautan rusak                                             | Docs berubah                        |
| `skills-python`                  | Ruff + pytest untuk Skills berbasis Python                                                  | Perubahan yang relevan dengan skill Python |
| `checks-windows`                 | Lane pengujian khusus Windows                                                               | Perubahan yang relevan dengan Windows |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan artifact build bersama                          | Perubahan yang relevan dengan macOS |
| `macos-swift`                    | Lint, build, dan pengujian Swift untuk aplikasi macOS                                       | Perubahan yang relevan dengan macOS |
| `android`                        | Matriks build dan pengujian Android                                                         | Perubahan yang relevan dengan Android |

## Urutan Gagal Cepat

Pekerjaan diurutkan agar pemeriksaan murah gagal lebih dulu sebelum pekerjaan mahal berjalan:

1. `preflight` menentukan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam pekerjaan ini, bukan pekerjaan terpisah.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu artifact yang lebih berat dan pekerjaan matriks platform.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat agar konsumen hilir bisa mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat kemudian menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh unit test di `src/scripts/ci-changed-scope.test.ts`.
Workflow `install-smoke` yang terpisah menggunakan kembali skrip cakupan yang sama melalui pekerjaan `preflight` miliknya sendiri. Workflow ini menghitung `run_install_smoke` dari sinyal changed-smoke yang lebih sempit, sehingga smoke Docker/install hanya berjalan untuk perubahan yang relevan dengan install, packaging, dan container.

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dijalankan oleh `scripts/check-changed.mjs`. Gerbang lokal tersebut lebih ketat terhadap boundary arsitektur dibanding cakupan platform CI yang luas: perubahan produksi core menjalankan typecheck produksi core plus pengujian core, perubahan khusus pengujian core hanya menjalankan typecheck/pengujian core test, perubahan produksi extension menjalankan typecheck produksi extension plus pengujian extension, dan perubahan khusus pengujian extension hanya menjalankan typecheck/pengujian extension test. Perubahan Plugin SDK publik atau plugin-contract memperluas validasi ke extension karena extension bergantung pada kontrak core tersebut. Perubahan root/config yang tidak dikenal akan fail-safe ke semua lane.

Pada push, matriks `checks` menambahkan lane `compat-node22` yang khusus push. Pada pull request, lane itu dilewati dan matriks tetap berfokus pada lane pengujian/channel normal.

Keluarga pengujian Node yang paling lambat dipecah menjadi shard include-file agar setiap pekerjaan tetap kecil: kontrak channel membagi cakupan registry dan core menjadi masing-masing delapan shard berbobot, pengujian perintah balasan auto-reply dipecah menjadi empat shard pola-include, dan kelompok prefix balasan auto-reply besar lainnya dipecah menjadi masing-masing dua shard. `check-additional` juga memisahkan pekerjaan compile/canary package-boundary dari pekerjaan gateway/architecture topologi runtime.

GitHub dapat menandai pekerjaan yang tergantikan sebagai `cancelled` ketika push yang lebih baru masuk ke PR atau ref `main` yang sama. Anggap itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan agregat shard secara eksplisit menandai kasus pembatalan ini agar lebih mudah dibedakan dari kegagalan pengujian.

## Runner

| Runner                           | Pekerjaan                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, pemeriksaan Linux, pemeriksaan docs, Skills Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` pada `openclaw/openclaw`; fork akan kembali menggunakan `macos-latest`                                                  |

## Padanan Lokal

```bash
pnpm changed:lanes   # periksa pengklasifikasi changed-lane lokal untuk origin/main...HEAD
pnpm check:changed   # gerbang lokal cerdas: typecheck/lint/pengujian yang berubah berdasarkan lane boundary
pnpm check          # gerbang lokal cepat: tsgo produksi + lint ter-shard + guard cepat paralel
pnpm check:test-types
pnpm check:timed    # gerbang yang sama dengan timing per tahap
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # pengujian vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format docs + lint + tautan rusak
pnpm build          # bangun dist saat lane artifact/build-smoke CI relevan
```
