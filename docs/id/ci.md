---
read_when:
    - Anda perlu memahami mengapa sebuah job CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
summary: Grafik job CI, gerbang cakupan, dan padanan perintah lokal
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-11T02:44:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca7e355b7f73bfe8ea8c6971e78164b8b2e68cbb27966964955e267fed89fce6
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

CI berjalan pada setiap push ke `main` dan setiap pull request. CI menggunakan cakupan cerdas untuk melewati job mahal ketika hanya area yang tidak terkait yang berubah.

## Ikhtisar Job

| Job                      | Tujuan                                                                                  | Kapan dijalankan                     |
| ------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`              | Mendeteksi perubahan khusus dokumen, cakupan yang berubah, ekstensi yang berubah, dan membangun manifes CI | Selalu pada push dan PR non-draf     |
| `security-fast`          | Deteksi private key, audit workflow melalui `zizmor`, audit dependensi produksi         | Selalu pada push dan PR non-draf     |
| `build-artifacts`        | Membangun `dist/` dan Control UI sekali, mengunggah artefak yang dapat digunakan ulang untuk job downstream | Perubahan yang relevan dengan Node   |
| `checks-fast-core`       | Jalur pemeriksaan Linux cepat seperti bundled/plugin-contract/protocol                  | Perubahan yang relevan dengan Node   |
| `checks-node-extensions` | Shard pengujian bundled-plugin penuh di seluruh rangkaian ekstensi                      | Perubahan yang relevan dengan Node   |
| `checks-node-core-test`  | Shard pengujian inti Node, tidak termasuk jalur channel, bundled, contract, dan extension | Perubahan yang relevan dengan Node   |
| `extension-fast`         | Pengujian terfokus hanya untuk bundled plugin yang berubah                              | Saat perubahan ekstensi terdeteksi   |
| `check`                  | Gerbang lokal utama di CI: `pnpm check` plus `pnpm build:strict-smoke`                 | Perubahan yang relevan dengan Node   |
| `check-additional`       | Pengaman arsitektur, boundary, import-cycle, ditambah harness regresi gateway watch     | Perubahan yang relevan dengan Node   |
| `build-smoke`            | Pengujian smoke CLI hasil build dan smoke memori saat startup                           | Perubahan yang relevan dengan Node   |
| `checks`                 | Jalur Linux Node sisanya: pengujian channel dan kompatibilitas Node 22 khusus push      | Perubahan yang relevan dengan Node   |
| `check-docs`             | Pemformatan dokumen, lint, dan pemeriksaan tautan rusak                                 | Dokumen berubah                      |
| `skills-python`          | Ruff + pytest untuk Skills berbasis Python                                              | Perubahan yang relevan dengan Skills Python |
| `checks-windows`         | Jalur pengujian khusus Windows                                                          | Perubahan yang relevan dengan Windows |
| `macos-node`             | Jalur pengujian TypeScript macOS menggunakan artefak hasil build bersama                | Perubahan yang relevan dengan macOS  |
| `macos-swift`            | Lint, build, dan pengujian Swift untuk aplikasi macOS                                   | Perubahan yang relevan dengan macOS  |
| `android`                | Matriks build dan pengujian Android                                                     | Perubahan yang relevan dengan Android |

## Urutan Fail-Fast

Job diurutkan agar pemeriksaan murah gagal lebih dulu sebelum yang mahal dijalankan:

1. `preflight` menentukan jalur mana yang benar-benar ada. Logika `docs-scope` dan `changed-scope` adalah step di dalam job ini, bukan job terpisah.
2. `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal dengan cepat tanpa menunggu job artefak dan matriks platform yang lebih berat.
3. `build-artifacts` berjalan paralel dengan jalur Linux cepat sehingga konsumen downstream dapat mulai segera setelah build bersama siap.
4. Setelah itu, jalur platform dan runtime yang lebih berat menyebar: `checks-fast-core`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh unit test di `src/scripts/ci-changed-scope.test.ts`.
Workflow `install-smoke` yang terpisah menggunakan kembali skrip cakupan yang sama melalui job `preflight` miliknya sendiri. Workflow ini menghitung `run_install_smoke` dari sinyal changed-smoke yang lebih sempit, sehingga smoke Docker/install hanya berjalan untuk perubahan yang relevan dengan install, packaging, dan container.

Pada push, matriks `checks` menambahkan jalur `compat-node22` yang khusus untuk push. Pada pull request, jalur itu dilewati dan matriks tetap berfokus pada jalur pengujian/channel normal.

## Runner

| Runner                           | Jobs                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, pemeriksaan Linux, pemeriksaan dokumen, Skills Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                          |

## Padanan Lokal

```bash
pnpm check          # types + lint + format
pnpm build:strict-smoke
pnpm check:import-cycles
pnpm test:gateway:watch-regression
pnpm test           # pengujian vitest
pnpm test:channels
pnpm check:docs     # format dokumen + lint + tautan rusak
pnpm build          # build dist saat jalur artefak/build-smoke CI relevan
```
