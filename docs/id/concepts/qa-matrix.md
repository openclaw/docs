---
read_when:
    - Menjalankan pnpm openclaw qa matrix secara lokal
    - Menambahkan atau memilih skenario QA Matrix
    - Melakukan triase kegagalan Matrix QA, batas waktu habis, atau pembersihan yang macet
summary: 'Referensi pemelihara untuk jalur QA langsung Matrix berbasis Docker: CLI, profil, variabel lingkungan, skenario, dan artefak keluaran.'
title: Matriks QA
x-i18n:
    generated_at: "2026-05-06T09:09:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Jalur Matrix QA menjalankan Plugin bawaan `@openclaw/matrix` terhadap homeserver Tuwunel sekali pakai di Docker, dengan akun sementara untuk penggerak, SUT, dan pengamat serta ruang yang sudah diisi data awal. Ini adalah cakupan live berbasis transport nyata untuk Matrix.

Ini adalah tooling khusus maintainer. Rilis OpenClaw terpaket sengaja tidak menyertakan `qa-lab`, sehingga `openclaw qa` hanya tersedia dari checkout sumber. Checkout sumber memuat runner bawaan secara langsung - tidak diperlukan langkah pemasangan Plugin.

Untuk konteks framework QA yang lebih luas, lihat [ikhtisar QA](/id/concepts/qa-e2e-automation).

## Mulai cepat

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

`pnpm openclaw qa matrix` biasa menjalankan `--profile all` dan tidak berhenti pada kegagalan pertama. Gunakan `--profile fast --fail-fast` untuk gate rilis; bagi katalog dengan `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` saat menjalankan seluruh inventaris secara paralel.

## Yang dilakukan jalur ini

1. Menyediakan homeserver Tuwunel sekali pakai di Docker (image default `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nama server `matrix-qa.test`, port `28008`).
2. Mendaftarkan tiga pengguna sementara - `driver` (mengirim traffic masuk), `sut` (akun Matrix OpenClaw yang diuji), `observer` (penangkap traffic pihak ketiga).
3. Mengisi data awal ruang yang diperlukan oleh skenario terpilih (utama, threading, media, restart, sekunder, allowlist, E2EE, DM verifikasi, dll.).
4. Memulai Gateway OpenClaw turunan dengan Plugin Matrix nyata yang dibatasi ke akun SUT; `qa-channel` tidak dimuat di turunan tersebut.
5. Menjalankan skenario secara berurutan, mengamati event melalui klien Matrix driver/observer.
6. Membongkar homeserver, menulis artefak laporan dan ringkasan, lalu keluar.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Flag umum

| Flag                  | Default                                       | Deskripsi                                                                                                                  |
| --------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Profil skenario. Lihat [Profil](#profiles).                                                                                |
| `--fail-fast`         | nonaktif                                      | Berhenti setelah pemeriksaan atau skenario pertama yang gagal.                                                             |
| `--scenario <id>`     | -                                             | Jalankan hanya skenario ini. Dapat diulang. Lihat [Skenario](#scenarios).                                                  |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Tempat laporan, ringkasan, event yang diamati, dan log output ditulis. Path relatif diselesaikan terhadap `--repo-root`.   |
| `--repo-root <path>`  | `process.cwd()`                               | Root repositori saat dipanggil dari direktori kerja netral.                                                                |
| `--sut-account <id>`  | `sut`                                         | ID akun Matrix di dalam konfigurasi Gateway QA.                                                                            |

### Flag penyedia

Jalur ini menggunakan transport Matrix nyata, tetapi penyedia model dapat dikonfigurasi:

| Flag                     | Default          | Deskripsi                                                                                                                                           |
| ------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` untuk dispatch mock deterministik atau `live-frontier` untuk penyedia frontier live. Alias lama `live-openai` masih berfungsi.        |
| `--model <ref>`          | default penyedia | Ref `provider/model` utama.                                                                                                                        |
| `--alt-model <ref>`      | default penyedia | Ref `provider/model` alternatif saat skenario beralih di tengah eksekusi.                                                                           |
| `--fast`                 | nonaktif         | Mengaktifkan mode cepat penyedia jika didukung.                                                                                                    |

Matrix QA tidak menerima `--credential-source` atau `--credential-role`. Jalur ini menyediakan pengguna sekali pakai secara lokal; tidak ada pool kredensial bersama untuk disewa.

## Profil

Profil yang dipilih menentukan skenario mana yang berjalan.

| Profil          | Gunakan untuk                                                                                                                                                                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (default) | Katalog penuh. Lambat tetapi menyeluruh.                                                                                                                                                                                                                   |
| `fast`          | Subset gate rilis yang menguji kontrak transport live: canary, gating mention, blok allowlist, bentuk balasan, resume restart, tindak lanjut thread, isolasi thread, pengamatan reaksi, dan pengiriman metadata persetujuan exec.                         |
| `transport`     | Skenario threading, DM, ruang, autojoin, mention/allowlist, persetujuan, dan reaksi pada level transport.                                                                                                                                                  |
| `media`         | Cakupan lampiran gambar, audio, video, PDF, EPUB.                                                                                                                                                                                                          |
| `e2ee-smoke`    | Cakupan E2EE minimum - balasan terenkripsi dasar, tindak lanjut thread, keberhasilan bootstrap.                                                                                                                                                            |
| `e2ee-deep`     | Skenario E2EE menyeluruh untuk kehilangan status, cadangan, kunci, dan pemulihan.                                                                                                                                                                          |
| `e2ee-cli`      | Skenario CLI `openclaw matrix encryption setup` dan `verify *` yang dijalankan melalui harness QA.                                                                                                                                                         |

Pemetaan persisnya ada di `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Skenario

Daftar ID skenario lengkap adalah union `MatrixQaScenarioId` di `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Kategorinya mencakup:

- threading - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- level teratas / DM / ruang - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming dan progres tool - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reaksi - `matrix-reaction-*`
- persetujuan - `matrix-approval-*` (metadata exec/Plugin, fallback terpotong, reaksi penolakan, thread, dan routing `target: "both"`)
- restart dan replay - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- gating mention, bot-ke-bot, dan allowlist - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (balasan dasar, tindak lanjut thread, bootstrap, siklus hidup kunci pemulihan, varian kehilangan status, perilaku cadangan server, kebersihan perangkat, verifikasi SAS / QR / DM, restart, redaksi artefak)
- CLI E2EE - `matrix-e2ee-cli-*` (setup enkripsi, setup idempoten, kegagalan bootstrap, siklus hidup recovery-key, multi-akun, round-trip balasan Gateway, verifikasi mandiri)

Berikan `--scenario <id>` (dapat diulang) untuk menjalankan set pilihan manual; gabungkan dengan `--profile all` untuk mengabaikan gating profil.

## Variabel lingkungan

| Variabel                                | Bawaan                                   | Efek                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 menit)                        | Batas atas tegas untuk keseluruhan eksekusi.                                                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Batas untuk balasan canary awal. CI rilis menaikkan nilai ini pada runner bersama agar giliran Gateway pertama yang lambat tidak gagal sebelum cakupan skenario dimulai.                                       |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Jendela senyap untuk asersi negatif tanpa balasan. Dibatasi hingga `≤` batas waktu eksekusi.                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Batas untuk pembongkaran Docker. Permukaan kegagalan menyertakan perintah pemulihan `docker compose ... down --remove-orphans`.                                                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Timpa image homeserver saat memvalidasi terhadap versi Tuwunel yang berbeda.                                                                                                             |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | aktif                                        | `0` membisukan baris progres `[matrix-qa] ...` di stderr. `1` memaksanya aktif.                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | disunting                                  | `1` mempertahankan isi pesan dan `formatted_body` di `matrix-qa-observed-events.json`. Bawaan menyunting untuk menjaga artefak CI tetap aman.                                                                    |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | nonaktif                                       | `1` melewati `process.exit` deterministik setelah penulisan artefak. Bawaan memaksa keluar karena handle kripto native matrix-js-sdk dapat membuat event loop tetap hidup setelah artefak selesai. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | tidak disetel                                     | Saat disetel oleh peluncur luar (misalnya `scripts/run-node.mjs`), QA Matrix menggunakan kembali jalur log tersebut alih-alih memulai tee-nya sendiri.                                                                   |

## Artefak keluaran

Ditulis ke `--output-dir`:

- `matrix-qa-report.md` - Laporan protokol Markdown (apa yang lulus, gagal, dilewati, dan alasannya).
- `matrix-qa-summary.json` - Ringkasan terstruktur yang cocok untuk penguraian CI dan dashboard.
- `matrix-qa-observed-events.json` - Event Matrix yang diamati dari klien driver dan observer. Isi disunting kecuali `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; metadata persetujuan diringkas dengan field aman terpilih dan pratinjau perintah yang dipotong.
- `matrix-qa-output.log` - Gabungan stdout/stderr dari eksekusi. Jika `OPENCLAW_RUN_NODE_OUTPUT_LOG` disetel, log peluncur luar digunakan kembali sebagai gantinya.

Direktori keluaran bawaan adalah `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` sehingga eksekusi berurutan tidak saling menimpa.

## Tips triase

- **Eksekusi menggantung menjelang akhir:** handle kripto native `matrix-js-sdk` dapat bertahan lebih lama daripada harness. Bawaan memaksa `process.exit` yang bersih setelah penulisan artefak; jika Anda telah membatalkan setelan `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, proses diperkirakan akan tetap berjalan.
- **Kesalahan pembersihan:** cari perintah pemulihan yang dicetak (pemanggilan `docker compose ... down --remove-orphans`) dan jalankan secara manual untuk melepaskan port homeserver.
- **Jendela asersi negatif tidak stabil di CI:** turunkan `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (bawaan 8 dtk) saat CI cepat; naikkan pada runner bersama yang lambat.
- **Memerlukan isi yang disunting untuk laporan bug:** jalankan ulang dengan `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` dan lampirkan `matrix-qa-observed-events.json`. Perlakukan artefak yang dihasilkan sebagai sensitif.
- **Versi Tuwunel berbeda:** arahkan `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ke versi yang sedang diuji. Lane hanya memeriksa image bawaan yang dipin.

## Kontrak transport live

Matrix adalah salah satu dari tiga lane transport live (Matrix, Telegram, Discord) yang berbagi satu daftar periksa kontrak yang didefinisikan di [Ikhtisar QA → Cakupan transport live](/id/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` tetap menjadi suite sintetis yang luas dan sengaja bukan bagian dari matriks tersebut.

## Terkait

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) - stack QA keseluruhan dan kontrak transport live
- [QA Channel](/id/channels/qa-channel) - adaptor channel sintetis untuk skenario yang didukung repo
- [Pengujian](/id/help/testing) - menjalankan pengujian dan menambahkan cakupan QA
- [Matrix](/id/channels/matrix) - Plugin channel yang diuji
