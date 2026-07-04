---
read_when:
    - Menjalankan pnpm openclaw qa matrix secara lokal
    - Menambahkan atau memilih skenario QA Matrix
    - Melakukan triase kegagalan Matrix QA, timeout, atau pembersihan yang macet
summary: 'Referensi pemelihara untuk jalur QA langsung Matrix yang didukung Docker: CLI, profil, variabel env, skenario, dan artefak keluaran.'
title: Matriks QA
x-i18n:
    generated_at: "2026-07-04T20:44:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4f7fd98b5e7fef7a30c8820c5a1fc48c199e4d09db34255e8b2287a047b339f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Lane QA Matrix menjalankan plugin `@openclaw/matrix` bawaan terhadap homeserver Tuwunel sekali pakai di Docker, dengan akun driver, SUT, dan observer sementara plus room yang telah di-seed. Ini adalah cakupan live transport-real untuk Matrix.

Ini adalah tooling khusus maintainer. Rilis OpenClaw terpaket sengaja menghilangkan `qa-lab`, jadi `openclaw qa` hanya tersedia dari checkout sumber. Checkout sumber memuat runner bawaan secara langsung - tidak diperlukan langkah instal plugin.

Untuk konteks framework QA yang lebih luas, lihat [ikhtisar QA](/id/concepts/qa-e2e-automation).

## Mulai cepat

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

`pnpm openclaw qa matrix` biasa menjalankan `--profile all` dan tidak berhenti pada kegagalan pertama. Gunakan `--profile fast --fail-fast` untuk gate rilis; shard katalog dengan `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` saat menjalankan seluruh inventaris secara paralel.

## Yang dilakukan lane

1. Memprovisikan homeserver Tuwunel sekali pakai di Docker (image default `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nama server `matrix-qa.test`, port `28008`) di balik perekam permintaan/respons terbatas yang melakukan redaksi.
2. Mendaftarkan tiga pengguna sementara - `driver` (mengirim lalu lintas inbound), `sut` (akun OpenClaw Matrix yang diuji), `observer` (capture lalu lintas pihak ketiga).
3. Melakukan seed room yang diperlukan oleh skenario terpilih (main, threading, media, restart, secondary, allowlist, E2EE, DM verifikasi, dll.).
4. Menjalankan probe protokol `matrix-qa-v1` yang netral substrate terhadap batas Tuwunel yang direkam. Unit test membuktikan kontrak probe dengan fixture protokol Matrix; host adapter transport QA kanonis di [#99707](https://github.com/openclaw/openclaw/pull/99707) memiliki wiring target Crabline nyata.
5. Memulai gateway OpenClaw child dengan plugin Matrix nyata yang dibatasi ke akun SUT; `qa-channel` tidak dimuat di child.
6. Menjalankan skenario secara berurutan, mengamati event melalui klien Matrix driver/observer dan menurunkan ekspektasi route/state dari lalu lintas yang direkam.
7. Membongkar homeserver, menulis report dan artefak evidence, lalu keluar.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Flag umum

| Flag                  | Default                                       | Deskripsi                                                                                                                                                 |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Profil skenario. Lihat [Profil](#profiles).                                                                                                               |
| `--fail-fast`         | off                                           | Berhenti setelah check atau skenario pertama yang gagal.                                                                                                   |
| `--scenario <id>`     | -                                             | Jalankan hanya skenario ini. Dapat diulang. Lihat [Skenario](#scenarios).                                                                                  |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Tempat report, ringkasan, inventaris route/state, event yang diamati, dan log output ditulis. Path relatif di-resolve terhadap `--repo-root`.              |
| `--repo-root <path>`  | `process.cwd()`                               | Root repositori saat dipanggil dari direktori kerja netral.                                                                                                |
| `--sut-account <id>`  | `sut`                                         | ID akun Matrix di dalam konfigurasi gateway QA.                                                                                                           |

### Flag provider

Lane menggunakan transport Matrix nyata tetapi provider model dapat dikonfigurasi:

| Flag                     | Default          | Deskripsi                                                                                                                                     |
| ------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` untuk dispatch mock deterministik atau `live-frontier` untuk provider frontier live. Alias lama `live-openai` masih berfungsi. |
| `--model <ref>`          | default provider | Ref `provider/model` utama.                                                                                                                    |
| `--alt-model <ref>`      | default provider | Ref `provider/model` alternatif saat skenario beralih di tengah run.                                                                           |
| `--fast`                 | off              | Aktifkan mode cepat provider jika didukung.                                                                                                    |

QA Matrix tidak menerima `--credential-source` atau `--credential-role`. Lane memprovisikan pengguna sekali pakai secara lokal; tidak ada pool kredensial bersama untuk disewa.

## Profil

Profil terpilih menentukan skenario mana yang berjalan.

| Profile         | Gunakan untuk                                                                                                                                                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (default) | Katalog penuh. Lambat tetapi menyeluruh.                                                                                                                                                                                                        |
| `fast`          | Subset gate rilis yang menguji kontrak transport live: canary, mention gating, blok allowlist, bentuk balasan, resume restart, tindak lanjut thread, isolasi thread, observasi reaksi, dan pengiriman metadata persetujuan exec.              |
| `transport`     | Skenario threading tingkat transport, DM, room, autojoin, mention/allowlist, persetujuan, dan reaksi.                                                                                                                                           |
| `media`         | Cakupan lampiran gambar, audio, video, PDF, EPUB.                                                                                                                                                                                               |
| `e2ee-smoke`    | Cakupan E2EE minimum - balasan terenkripsi dasar, tindak lanjut thread, keberhasilan bootstrap.                                                                                                                                                 |
| `e2ee-deep`     | Skenario E2EE menyeluruh untuk kehilangan state, backup, kunci, dan pemulihan.                                                                                                                                                                  |
| `e2ee-cli`      | Skenario CLI `openclaw matrix encryption setup` dan `verify *` yang dijalankan melalui harness QA.                                                                                                                                              |

Pemetaan persisnya ada di `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Skenario

Daftar ID skenario lengkap adalah union `MatrixQaScenarioId` di `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Kategori mencakup:

- threading - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- level teratas / DM / room - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming dan progres tool - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reaksi - `matrix-reaction-*`
- persetujuan - `matrix-approval-*` (metadata exec/plugin, fallback chunked, reaksi penolakan, thread, dan routing `target: "both"`)
- restart dan replay - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention gating, bot-ke-bot, dan allowlist - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (balasan dasar, tindak lanjut thread, bootstrap, siklus hidup recovery key, varian kehilangan state, perilaku backup server, higienitas perangkat, verifikasi SAS / QR / DM, restart, redaksi artefak)
- CLI E2EE - `matrix-e2ee-cli-*` (setup enkripsi, setup idempoten, kegagalan bootstrap, siklus hidup recovery-key, multi-akun, round-trip gateway-reply, verifikasi mandiri)

Berikan `--scenario <id>` (dapat diulang) untuk menjalankan set pilihan manual; kombinasikan dengan `--profile all` untuk mengabaikan gating profil.

## Variabel lingkungan

| Variabel                                | Default                                   | Efek                                                                                                                                                                                        |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 mnt)                        | Batas atas keras untuk seluruh proses berjalan.                                                                                                                                             |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Batas untuk balasan canary awal. CI rilis menaikkan ini pada runner bersama agar giliran gateway pertama yang lambat tidak gagal sebelum cakupan skenario dimulai.                         |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Jendela hening untuk asersi negatif tanpa balasan. Dibatasi hingga `≤` timeout proses berjalan.                                                                                            |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Batas untuk pembongkaran Docker. Permukaan kegagalan mencakup perintah pemulihan `docker compose ... down --remove-orphans`.                                                               |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Timpa image homeserver saat memvalidasi terhadap versi Tuwunel yang berbeda.                                                                                                                |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | aktif                                     | `0` membisukan baris progres `[matrix-qa] ...` di stderr. `1` memaksanya aktif.                                                                                                             |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | disunting                                 | `1` mempertahankan isi pesan dan `formatted_body` di `matrix-qa-observed-events.json`. Default menyuntingnya agar artefak CI tetap aman.                                                   |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | nonaktif                                  | `1` melewati `process.exit` deterministik setelah penulisan artefak. Default memaksa keluar karena handle kripto native matrix-js-sdk dapat membuat event loop tetap hidup setelah artefak selesai. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | tidak disetel                             | Saat disetel oleh launcher luar (mis. `scripts/run-node.mjs`), Matrix QA menggunakan ulang jalur log itu alih-alih memulai tee sendiri.                                                     |

## Artefak keluaran

Ditulis ke `--output-dir`:

- `matrix-qa-report.md` - Laporan protokol Markdown (apa yang lulus, gagal, dilewati, dan alasannya).
- `matrix-qa-summary.json` - Ringkasan terstruktur yang cocok untuk parsing CI dan dasbor.
- `matrix-qa-route-state-manifest.json` - Inventaris `matrix-qa-v1` dinamis yang dikunci berdasarkan id skenario. Ini mencatat bentuk rute/isi yang disunting, urutan permintaan, percobaan ulang yang diamati, error, kontinuitas token sinkronisasi, serta keluarga status perangkat/kunci/media/cadangan yang diamati selama proses berjalan tersebut. Ini adalah bukti yang dapat dieksekusi, bukan baseline yang diperiksa masuk.
- `matrix-qa-observed-events.json` - Event Matrix yang diamati dari klien driver dan observer. Isi disunting kecuali `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; metadata persetujuan diringkas dengan kolom aman terpilih dan pratinjau perintah yang dipotong.
- `matrix-qa-output.log` - Gabungan stdout/stderr dari proses berjalan. Jika `OPENCLAW_RUN_NODE_OUTPUT_LOG` disetel, log launcher luar digunakan ulang sebagai gantinya.

Direktori keluaran default adalah `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` sehingga proses berjalan berurutan tidak saling menimpa.

## Tips triase

- **Proses berjalan macet mendekati akhir:** handle kripto native `matrix-js-sdk` dapat hidup lebih lama daripada harness. Default memaksa `process.exit` yang bersih setelah penulisan artefak; jika Anda telah menghapus setelan `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, proses mungkin tetap bertahan.
- **Error pembersihan:** cari perintah pemulihan yang dicetak (pemanggilan `docker compose ... down --remove-orphans`) dan jalankan secara manual untuk melepaskan port homeserver.
- **Jendela asersi negatif flaky di CI:** turunkan `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (default 8 dtk) saat CI cepat; naikkan pada runner bersama yang lambat.
- **Memerlukan isi yang disunting untuk laporan bug:** jalankan ulang dengan `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` dan lampirkan `matrix-qa-observed-events.json`. Perlakukan artefak yang dihasilkan sebagai sensitif.
- **Versi Tuwunel berbeda:** arahkan `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ke versi yang diuji. Lane hanya memeriksa image default yang dipin.

## Kontrak transport live

Matrix adalah salah satu dari tiga lane transport live (Matrix, Telegram, Discord) yang berbagi satu daftar periksa kontrak yang didefinisikan di [Ikhtisar QA → Cakupan transport live](/id/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` tetap menjadi suite sintetis yang luas dan sengaja tidak menjadi bagian dari matriks tersebut.

## Terkait

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) - stack QA keseluruhan dan kontrak transport live
- [QA Channel](/id/channels/qa-channel) - adapter kanal sintetis untuk skenario yang didukung repo
- [Pengujian](/id/help/testing) - menjalankan pengujian dan menambahkan cakupan QA
- [Matrix](/id/channels/matrix) - Plugin kanal yang sedang diuji
