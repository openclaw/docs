---
read_when:
    - Anda perlu memahami mengapa suatu job CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
summary: Graf job CI, gate scope, dan padanan perintah lokal
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-05T13:44:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a95b6e584b4309bc249866ea436b4dfe30e0298ab8916eadbc344edae3d1194
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

CI berjalan pada setiap push ke `main` dan setiap pull request. Ini menggunakan scoping cerdas untuk melewati job mahal ketika hanya area yang tidak terkait yang berubah.

## Ikhtisar Job

| Job                      | Tujuan                                                                                   | Kapan dijalankan                    |
| ------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`              | Mendeteksi perubahan khusus docs, scope yang berubah, extension yang berubah, dan membangun manifest CI | Selalu pada push dan PR non-draft   |
| `security-fast`          | Deteksi private key, audit workflow melalui `zizmor`, audit dependensi produksi         | Selalu pada push dan PR non-draft   |
| `build-artifacts`        | Membangun `dist/` dan UI Control sekali, mengunggah artifact yang dapat digunakan ulang untuk job downstream | Perubahan yang relevan dengan Node  |
| `checks-fast-core`       | Lane korektness Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol         | Perubahan yang relevan dengan Node  |
| `checks-fast-extensions` | Mengagregasi lane shard extension setelah `checks-fast-extensions-shard` selesai         | Perubahan yang relevan dengan Node  |
| `extension-fast`         | Pengujian terfokus hanya untuk bundled plugin yang berubah                               | Saat perubahan extension terdeteksi |
| `check`                  | Gate lokal utama di CI: `pnpm check` plus `pnpm build:strict-smoke`                     | Perubahan yang relevan dengan Node  |
| `check-additional`       | Guard arsitektur dan boundary plus harness regresi gateway watch                         | Perubahan yang relevan dengan Node  |
| `build-smoke`            | Pengujian smoke CLI hasil build dan smoke memori saat startup                            | Perubahan yang relevan dengan Node  |
| `checks`                 | Lane Node Linux yang lebih berat: pengujian penuh, pengujian channel, dan kompatibilitas Node 22 khusus push | Perubahan yang relevan dengan Node  |
| `check-docs`             | Pemeriksaan format docs, lint, dan tautan rusak                                          | Docs berubah                        |
| `skills-python`          | Ruff + pytest untuk Skills berbasis Python                                               | Perubahan yang relevan dengan Skills Python |
| `checks-windows`         | Lane pengujian khusus Windows                                                            | Perubahan yang relevan dengan Windows |
| `macos-node`             | Lane pengujian TypeScript macOS menggunakan artifact build bersama                       | Perubahan yang relevan dengan macOS |
| `macos-swift`            | Lint, build, dan pengujian Swift untuk aplikasi macOS                                    | Perubahan yang relevan dengan macOS |
| `android`                | Matriks build dan pengujian Android                                                      | Perubahan yang relevan dengan Android |

## Urutan Fail-Fast

Job diurutkan sehingga pemeriksaan murah gagal sebelum job mahal berjalan:

1. `preflight` menentukan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah step di dalam job ini, bukan job terpisah.
2. `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu artifact yang lebih berat dan job matriks platform.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat sehingga konsumen downstream dapat mulai segera setelah build bersama siap.
4. Setelah itu, lane platform dan runtime yang lebih berat menyebar: `checks-fast-core`, `checks-fast-extensions`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

Logika scope berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh unit test di `src/scripts/ci-changed-scope.test.ts`.
Workflow `install-smoke` yang terpisah menggunakan ulang skrip scope yang sama melalui job `preflight` miliknya sendiri. Workflow ini menghitung `run_install_smoke` dari sinyal changed-smoke yang lebih sempit, sehingga smoke Docker/install hanya berjalan untuk perubahan yang relevan dengan install, packaging, dan container.

Pada push, matriks `checks` menambahkan lane `compat-node22` khusus push. Pada pull request, lane tersebut dilewati dan matriks tetap fokus pada lane pengujian/channel normal.

## Runner

| Runner                           | Job                                                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, pemeriksaan Linux, pemeriksaan docs, Skills Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                          |

## Padanan Lokal

```bash
pnpm check          # types + lint + format
pnpm build:strict-smoke
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # build dist when CI artifact/build-smoke lanes matter
```
