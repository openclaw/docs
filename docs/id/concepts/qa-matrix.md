---
read_when:
    - Menjalankan pnpm openclaw qa matrix secara lokal
    - Menambahkan atau memilih skenario QA Matrix
    - Melakukan triase kegagalan Matrix QA, timeout, atau pembersihan yang macet
summary: 'Referensi pemelihara untuk jalur QA live Matrix berbasis Docker: CLI, profil, variabel lingkungan, skenario, dan artefak keluaran.'
title: Matriks QA
x-i18n:
    generated_at: "2026-04-30T09:45:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab862474e2abe45a1dcd66f025e3a3dd52a3417b0c1f42a26cd7944dd4053f5
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Lane QA Matrix menjalankan Plugin `@openclaw/matrix` yang dibundel terhadap homeserver Tuwunel sekali pakai di Docker, dengan akun driver, SUT, dan observer sementara serta room yang sudah di-seed. Ini adalah cakupan live transport-real untuk Matrix.

Ini adalah tooling khusus maintainer. Rilis OpenClaw terpaket sengaja tidak menyertakan `qa-lab`, jadi `openclaw qa` hanya tersedia dari checkout sumber. Checkout sumber memuat runner yang dibundel secara langsung — tidak diperlukan langkah instalasi Plugin.

Untuk konteks framework QA yang lebih luas, lihat [Ikhtisar QA](/id/concepts/qa-e2e-automation).

## Mulai cepat

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

`pnpm openclaw qa matrix` biasa menjalankan `--profile all` dan tidak berhenti pada kegagalan pertama. Gunakan `--profile fast --fail-fast` untuk gate rilis; shard katalog dengan `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` saat menjalankan seluruh inventaris secara paralel.

## Apa yang dilakukan lane

1. Menyediakan homeserver Tuwunel sekali pakai di Docker (image default `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nama server `matrix-qa.test`, port `28008`).
2. Mendaftarkan tiga pengguna sementara — `driver` (mengirim traffic inbound), `sut` (akun Matrix OpenClaw yang diuji), `observer` (capture traffic pihak ketiga).
3. Melakukan seed room yang diperlukan oleh skenario terpilih (main, threading, media, restart, secondary, allowlist, E2EE, verification DM, dll.).
4. Memulai Gateway OpenClaw child dengan Plugin Matrix asli yang dibatasi ke akun SUT; `qa-channel` tidak dimuat di child.
5. Menjalankan skenario secara berurutan, mengamati event melalui klien Matrix driver/observer.
6. Membongkar homeserver, menulis artefak laporan dan ringkasan, lalu keluar.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Flag umum

| Flag                  | Default                                       | Deskripsi                                                                                                              |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Profil skenario. Lihat [Profil](#profiles).                                                                            |
| `--fail-fast`         | off                                           | Berhenti setelah pemeriksaan atau skenario pertama yang gagal.                                                         |
| `--scenario <id>`     | —                                             | Jalankan hanya skenario ini. Dapat diulang. Lihat [Skenario](#scenarios).                                              |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Tempat laporan, ringkasan, event yang diamati, dan log output ditulis. Path relatif di-resolve terhadap `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Root repositori saat dipanggil dari direktori kerja netral.                                                            |
| `--sut-account <id>`  | `sut`                                         | ID akun Matrix di dalam konfigurasi Gateway QA.                                                                        |

### Flag provider

Lane menggunakan transport Matrix asli, tetapi provider model dapat dikonfigurasi:

| Flag                     | Default          | Deskripsi                                                                                                                                    |
| ------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` untuk dispatch mock deterministik atau `live-frontier` untuk provider frontier live. Alias lama `live-openai` masih berfungsi. |
| `--model <ref>`          | provider default | Ref utama `provider/model`.                                                                                                                  |
| `--alt-model <ref>`      | provider default | Ref alternatif `provider/model` ketika skenario beralih di tengah run.                                                                       |
| `--fast`                 | off              | Aktifkan mode cepat provider jika didukung.                                                                                                  |

QA Matrix tidak menerima `--credential-source` atau `--credential-role`. Lane menyediakan pengguna sekali pakai secara lokal; tidak ada pool kredensial bersama untuk di-lease.

## Profil

Profil yang dipilih menentukan skenario mana yang berjalan.

| Profil          | Gunakan untuk                                                                                                                                                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (default) | Katalog penuh. Lambat tetapi menyeluruh.                                                                                                                                                                                                     |
| `fast`          | Subset gate rilis yang menjalankan kontrak transport live: canary, mention gating, allowlist block, reply shape, restart resume, thread follow-up, thread isolation, reaction observation, dan pengiriman metadata persetujuan exec.         |
| `transport`     | Skenario threading, DM, room, autojoin, mention/allowlist, approval, dan reaction pada level transport.                                                                                                                                       |
| `media`         | Cakupan lampiran image, audio, video, PDF, EPUB.                                                                                                                                                                                             |
| `e2ee-smoke`    | Cakupan E2EE minimum — balasan terenkripsi dasar, thread follow-up, keberhasilan bootstrap.                                                                                                                                                   |
| `e2ee-deep`     | Skenario E2EE menyeluruh untuk state-loss, backup, key, dan recovery.                                                                                                                                                                        |
| `e2ee-cli`      | Skenario CLI `openclaw matrix encryption setup` dan `verify *` yang digerakkan melalui harness QA.                                                                                                                                           |

Pemetaan persisnya berada di `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Skenario

Daftar ID skenario penuh adalah union `MatrixQaScenarioId` di `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Kategorinya meliputi:

- threading — `matrix-thread-*`, `matrix-subagent-thread-spawn`
- top-level / DM / room — `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming dan progres tool — `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media — `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing — `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reactions — `matrix-reaction-*`
- approvals — `matrix-approval-*` (metadata exec/Plugin, fallback berpotongan, reaction deny, thread, dan routing `target: "both"`)
- restart dan replay — `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention gating, bot-ke-bot, dan allowlist — `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE — `matrix-e2ee-*` (balasan dasar, thread follow-up, bootstrap, lifecycle recovery key, varian state-loss, perilaku backup server, higiene perangkat, verifikasi SAS / QR / DM, restart, redaksi artefak)
- CLI E2EE — `matrix-e2ee-cli-*` (setup enkripsi, setup idempoten, kegagalan bootstrap, lifecycle recovery-key, multi-akun, round-trip gateway-reply, self-verification)

Berikan `--scenario <id>` (dapat diulang) untuk menjalankan set pilihan manual; gabungkan dengan `--profile all` untuk mengabaikan gating profil.

## Variabel lingkungan

| Variabel                                | Default                                   | Efek                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 menit)                      | Batas atas mutlak untuk seluruh proses berjalan.                                                                                                                                                      |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Batas untuk balasan canary awal. CI rilis menaikkan ini pada runner bersama agar giliran Gateway pertama yang lambat tidak gagal sebelum cakupan skenario dimulai.                                    |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Jendela senyap untuk asersi negatif tanpa balasan. Dibatasi ke `≤` timeout proses berjalan.                                                                                                          |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Batas untuk pembongkaran Docker. Permukaan kegagalan menyertakan perintah pemulihan `docker compose ... down --remove-orphans`.                                                                       |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Timpa image homeserver saat memvalidasi terhadap versi Tuwunel yang berbeda.                                                                                                                          |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | aktif                                     | `0` menonaktifkan baris progres `[matrix-qa] ...` di stderr. `1` memaksanya aktif.                                                                                                                    |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | disamarkan                                | `1` mempertahankan isi pesan dan `formatted_body` di `matrix-qa-observed-events.json`. Default menyamarkan untuk menjaga artefak CI tetap aman.                                                       |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | nonaktif                                  | `1` melewati `process.exit` deterministik setelah artefak ditulis. Default memaksa keluar karena handle crypto native matrix-js-sdk dapat membuat event loop tetap hidup setelah artefak selesai.     |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | tidak disetel                             | Saat disetel oleh launcher luar (mis. `scripts/run-node.mjs`), Matrix QA menggunakan kembali jalur log tersebut alih-alih memulai tee sendiri.                                                        |

## Artefak keluaran

Ditulis ke `--output-dir`:

- `matrix-qa-report.md` — Laporan protokol Markdown (apa yang lulus, gagal, dilewati, dan alasannya).
- `matrix-qa-summary.json` — Ringkasan terstruktur yang cocok untuk parsing CI dan dasbor.
- `matrix-qa-observed-events.json` — Event Matrix yang diamati dari klien driver dan observer. Body disamarkan kecuali `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; metadata persetujuan diringkas dengan kolom aman yang dipilih dan pratinjau perintah yang dipotong.
- `matrix-qa-output.log` — Gabungan stdout/stderr dari proses berjalan. Jika `OPENCLAW_RUN_NODE_OUTPUT_LOG` disetel, log launcher luar digunakan kembali sebagai gantinya.

Direktori keluaran default adalah `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` sehingga proses berjalan berturut-turut tidak saling menimpa.

## Kiat triase

- **Proses berjalan macet menjelang akhir:** handle crypto native `matrix-js-sdk` dapat bertahan lebih lama daripada harness. Default memaksa `process.exit` yang bersih setelah artefak ditulis; jika Anda telah meniadakan `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, proses diperkirakan akan tetap berjalan.
- **Kesalahan pembersihan:** cari perintah pemulihan yang dicetak (pemanggilan `docker compose ... down --remove-orphans`) dan jalankan secara manual untuk melepaskan port homeserver.
- **Jendela asersi negatif yang flaky di CI:** turunkan `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (default 8 dtk) saat CI cepat; naikkan pada runner bersama yang lambat.
- **Memerlukan body tersamarkan untuk laporan bug:** jalankan ulang dengan `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` dan lampirkan `matrix-qa-observed-events.json`. Perlakukan artefak yang dihasilkan sebagai sensitif.
- **Versi Tuwunel berbeda:** arahkan `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ke versi yang sedang diuji. Lane hanya memeriksa image default yang dipin.

## Kontrak transport live

Matrix adalah salah satu dari tiga lane transport live (Matrix, Telegram, Discord) yang berbagi satu daftar periksa kontrak yang didefinisikan dalam [ikhtisar QA → Cakupan transport live](/id/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` tetap menjadi suite sintetis luas dan sengaja bukan bagian dari matriks tersebut.

## Terkait

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) — keseluruhan stack QA dan kontrak transport live
- [QA Channel](/id/channels/qa-channel) — adapter channel sintetis untuk skenario berbasis repo
- [Pengujian](/id/help/testing) — menjalankan pengujian dan menambahkan cakupan QA
- [Matrix](/id/channels/matrix) — Plugin channel yang sedang diuji
