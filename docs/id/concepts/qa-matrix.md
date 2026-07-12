---
read_when:
    - Menjalankan pnpm openclaw qa matrix secara lokal
    - Menambahkan atau memilih skenario QA Matrix
    - Menangani kegagalan, batas waktu, atau pembersihan yang macet pada QA Matrix
summary: 'Referensi pengelola untuk jalur QA langsung Matrix berbasis Docker: CLI, profil, variabel lingkungan, skenario, dan artefak keluaran.'
title: QA Matrix
x-i18n:
    generated_at: "2026-07-12T14:11:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8034570f5a52619c88bee1f6708bd710744d3cb52a1eb82726aa118844045ef
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Jalur QA Matrix menjalankan plugin bawaan `@openclaw/matrix` terhadap homeserver Tuwunel sekali pakai di Docker, dengan akun driver, SUT, dan pengamat sementara serta ruang yang telah diisi sebelumnya. Jalur ini merupakan cakupan nyata dengan transport langsung untuk Matrix.

Peralatan khusus pengelola. Rilis OpenClaw dalam bentuk paket tidak menyertakan `qa-lab`, sehingga `openclaw qa` hanya berjalan dari checkout sumber, yang memuat runner bawaan secara langsung tanpa langkah instalasi plugin.

Untuk konteks kerangka kerja QA yang lebih luas, lihat [ikhtisar QA](/id/concepts/qa-e2e-automation).

## Mulai cepat

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Perintah biasa `pnpm openclaw qa matrix` menjalankan `--profile all` dan tidak berhenti pada kegagalan pertama. Bagi seluruh inventaris ke beberapa tugas paralel dengan `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`.

## Yang dilakukan jalur ini

1. Menyediakan homeserver Tuwunel sekali pakai di Docker (citra bawaan `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nama server `matrix-qa.test`, port `28008`) di belakang perekam permintaan/respons terbatas yang menyamarkan data sensitif.
2. Mendaftarkan tiga pengguna sementara: `driver` (mengirim lalu lintas masuk), `sut` (akun Matrix OpenClaw yang diuji), `observer` (menangkap lalu lintas pihak ketiga).
3. Mengisi ruang yang diperlukan oleh skenario terpilih (utama, percakapan berutas, media, mulai ulang, sekunder, daftar izin, E2EE, DM verifikasi, dan sebagainya).
4. Menjalankan pemeriksaan protokol `matrix-qa-v1` yang netral terhadap substrat pada batas Tuwunel yang direkam. Pengujian unit membuktikan kontrak pemeriksaan dengan perlengkapan protokol Matrix; host adaptor transport QA kanonis dalam [#99707](https://github.com/openclaw/openclaw/pull/99707) memiliki pengawatan target Crabline yang sebenarnya.
5. Memulai Gateway OpenClaw turunan dengan plugin Matrix sebenarnya yang dicakup untuk akun SUT.
6. Menjalankan skenario secara berurutan, mengamati peristiwa melalui klien Matrix driver/pengamat, serta memperoleh ekspektasi rute/status dari lalu lintas yang direkam.
7. Menghentikan homeserver, menulis artefak laporan dan bukti, lalu keluar.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Flag umum

| Flag                  | Bawaan                                        | Deskripsi                                                                                                                                                             |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Profil skenario. Lihat [Profil](#profiles).                                                                                                                            |
| `--fail-fast`         | nonaktif                                      | Berhenti setelah pemeriksaan atau skenario pertama yang gagal.                                                                                                        |
| `--scenario <id>`     | -                                             | Jalankan hanya skenario ini. Dapat diulang. Lihat [Skenario](#scenarios).                                                                                              |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Lokasi penulisan laporan, ringkasan, inventaris rute/status, peristiwa yang diamati, dan log keluaran. Jalur relatif diselesaikan terhadap `--repo-root`.               |
| `--repo-root <path>`  | `process.cwd()`                               | Root repositori saat menjalankan dari direktori kerja netral.                                                                                                         |
| `--sut-account <id>`  | `sut`                                         | ID akun Matrix di dalam konfigurasi Gateway QA.                                                                                                                       |

### Flag penyedia

Jalur ini menggunakan transport Matrix sebenarnya, tetapi penyedia model dapat dikonfigurasi:

| Flag                     | Bawaan            | Deskripsi                                                                                                                                                                                  |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--provider-mode <mode>` | `live-frontier`   | `mock-openai` untuk pengiriman tiruan deterministik atau `live-frontier` untuk penyedia frontier langsung. Alias lama `live-openai` masih berfungsi.                                       |
| `--model <ref>`          | bawaan penyedia   | Referensi `provider/model` utama.                                                                                                                                                           |
| `--alt-model <ref>`      | bawaan penyedia   | Referensi `provider/model` alternatif ketika skenario beralih di tengah proses.                                                                                                            |
| `--fast`                 | nonaktif          | Aktifkan mode cepat penyedia jika didukung.                                                                                                                                                |

QA Matrix tidak menerima `--credential-source` atau `--credential-role`. Jalur ini menyediakan pengguna sekali pakai secara lokal; tidak ada kumpulan kredensial bersama yang dapat disewa.

## Profil

| Profil          | Kegunaan                                                                                                                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (bawaan)  | Katalog lengkap. Lambat tetapi menyeluruh.                                                                                                                                                                                                                 |
| `fast`          | Subset gerbang rilis yang menguji kontrak transport langsung imperatif: pemfilteran penyebutan, pemblokiran daftar izin, bentuk balasan, pelanjutan setelah mulai ulang, pengamatan reaksi, pengiriman metadata persetujuan eksekusi, dan balasan dasar E2EE. |
| `transport`     | Skenario percakapan berutas, DM, ruang, bergabung otomatis, penyebutan/daftar izin, persetujuan, dan reaksi pada tingkat transport.                                                                                                                        |
| `media`         | Cakupan lampiran gambar, audio, video, PDF, dan EPUB.                                                                                                                                                                                                      |
| `e2ee-smoke`    | Cakupan E2EE minimum: balasan terenkripsi dasar, tindak lanjut utas, dan keberhasilan bootstrap.                                                                                                                                                           |
| `e2ee-deep`     | Skenario menyeluruh untuk kehilangan status, cadangan, kunci, dan pemulihan E2EE.                                                                                                                                                                         |
| `e2ee-cli`      | Skenario CLI `openclaw matrix encryption setup` dan `verify *` yang dijalankan melalui harness QA.                                                                                                                                                         |

Pemetaan persisnya berada di `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Skenario

Adaptor Matrix bersama mengekspos skenario YAML kanonis berikut melalui `openclaw qa suite --channel-driver live --channel matrix`:

- `channel-chat-baseline`
- `thread-follow-up`
- `thread-isolation`
- `thread-reply-override`
- `dm-shared-session`
- `dm-per-room-session`

`subagent-thread-spawn` tetap tersedia melalui pemilihan eksplisit `--scenario subagent-thread-spawn`,
tetapi belum menjadi bagian dari kumpulan Matrix bersama bawaan hingga bukti penyelesaian turunan langsung stabil.

Daftar ID skenario imperatif lainnya adalah union `MatrixQaScenarioId` dalam `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`. Kategori:

- percakapan berutas: `matrix-thread-root-preservation`, `matrix-thread-nested-reply-shape`
- tingkat atas / DM / ruang: `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming dan progres alat: `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media: `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- perutean: `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reaksi: `matrix-reaction-*`
- persetujuan: `matrix-approval-*` (metadata eksekusi/plugin, fallback terpotong, reaksi penolakan, utas, dan perutean `target: "both"`)
- mulai ulang dan pemutaran ulang: `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- pemfilteran penyebutan, bot-ke-bot, dan daftar izin: `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE: `matrix-e2ee-*` (balasan dasar, tindak lanjut utas, bootstrap, siklus hidup kunci pemulihan, varian kehilangan status, perilaku cadangan server, kebersihan perangkat, verifikasi SAS / QR / DM, mulai ulang, penyamaran artefak)
- CLI E2EE: `matrix-e2ee-cli-*` (penyiapan enkripsi, penyiapan idempoten, kegagalan bootstrap, siklus hidup kunci pemulihan, multiakun, perjalanan pulang-pergi balasan Gateway, verifikasi mandiri)

Berikan `--scenario <id>` (dapat diulang) untuk menjalankan kumpulan pilihan; kombinasikan dengan `--profile all` untuk mengabaikan pemfilteran profil.

## Variabel lingkungan

| Variabel                                | Nilai default                              | Efek                                                                                                                                                                                          |
| --------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 menit)                       | Batas atas mutlak untuk keseluruhan proses.                                                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                    | Batas waktu untuk balasan canary awal. CI rilis menaikkan nilai ini pada runner bersama agar giliran Gateway pertama yang lambat tidak gagal sebelum cakupan skenario dimulai.                |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                     | Jendela tanpa aktivitas untuk asersi negatif tanpa balasan. Dibatasi agar `<=` waktu habis proses.                                                                                            |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                    | Batas waktu untuk pembongkaran Docker. Informasi kegagalan mencakup perintah pemulihan `docker compose ... down --remove-orphans`.                                                            |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1`  | Ganti image homeserver saat memvalidasi dengan versi Tuwunel yang berbeda.                                                                                                                    |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | aktif                                      | `0` menonaktifkan baris progres `[matrix-qa] ...` di stderr. `1` memaksa baris tersebut ditampilkan.                                                                                          |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | disunting                                  | `1` mempertahankan isi pesan dan `formatted_body` dalam `matrix-qa-observed-events.json`. Secara default, konten disunting agar artefak CI tetap aman.                                        |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | nonaktif                                   | `1` melewati `process.exit` deterministik setelah artefak ditulis. Secara default, proses dipaksa berhenti karena handle kriptografi native matrix-js-sdk dapat mempertahankan event loop tetap aktif setelah artefak selesai dibuat. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | tidak ditetapkan                           | Jika ditetapkan oleh peluncur luar (misalnya `scripts/run-node.mjs`), QA Matrix menggunakan kembali jalur log tersebut alih-alih memulai tee sendiri.                                         |

## Artefak keluaran

Ditulis ke `--output-dir` (default `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` agar proses berturut-turut tidak saling menimpa):

- `matrix-qa-report.md`: Laporan protokol Markdown (apa yang berhasil, gagal, dilewati, dan alasannya).
- `matrix-qa-summary.json`: Ringkasan terstruktur yang sesuai untuk penguraian CI dan dasbor.
- `matrix-qa-route-state-manifest.json`: Inventaris `matrix-qa-v1` dinamis yang dikunci berdasarkan ID skenario. File ini mencatat bentuk rute/isi yang disunting, urutan permintaan, percobaan ulang yang diamati, kesalahan, kesinambungan token sinkronisasi, serta kelompok status perangkat/kunci/media/cadangan yang diamati selama proses tersebut. Ini adalah bukti yang dapat dieksekusi, bukan baseline yang dimasukkan ke repositori.
- `matrix-qa-observed-events.json`: Peristiwa Matrix yang diamati dari klien pengendali dan pengamat. Isi disunting kecuali `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; metadata persetujuan diringkas dengan bidang aman yang dipilih dan pratinjau perintah yang dipotong.
- `matrix-qa-output.log`: Gabungan stdout/stderr dari proses. Jika `OPENCLAW_RUN_NODE_OUTPUT_LOG` ditetapkan, log peluncur luar digunakan kembali.

## Kiat triase

- **Proses macet menjelang akhir:** handle kriptografi native `matrix-js-sdk` dapat tetap aktif lebih lama daripada harness. Secara default, proses memaksa `process.exit` yang bersih setelah artefak ditulis; jika Anda menetapkan `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, proses diperkirakan akan tetap berjalan.
- **Kesalahan pembersihan:** cari perintah pemulihan yang dicetak (pemanggilan `docker compose ... down --remove-orphans`) dan jalankan secara manual untuk membebaskan port homeserver.
- **Jendela asersi negatif tidak stabil di CI:** turunkan `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (default 8 dtk) saat CI cepat; naikkan nilainya pada runner bersama yang lambat.
- **Memerlukan isi yang disunting untuk laporan bug:** jalankan ulang dengan `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` dan lampirkan `matrix-qa-observed-events.json`. Perlakukan artefak yang dihasilkan sebagai data sensitif.
- **Versi Tuwunel berbeda:** arahkan `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ke versi yang sedang diuji. Lane hanya memasukkan image default yang disematkan ke repositori.

## Kontrak transportasi langsung

Matrix adalah salah satu dari tiga lane transportasi langsung (Matrix, Telegram, Discord) yang berbagi satu daftar periksa kontrak yang ditetapkan dalam [Ikhtisar QA: Cakupan transportasi langsung](/id/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` tetap menjadi rangkaian sintetis yang luas dan sengaja tidak menjadi bagian dari matriks tersebut.

## Terkait

- [Ikhtisar QA](/id/concepts/qa-e2e-automation): keseluruhan tumpukan QA dan kontrak transportasi langsung
- [Kanal QA](/id/channels/qa-channel): adaptor kanal sintetis untuk skenario berbasis repositori
- [Pengujian](/id/help/testing): menjalankan pengujian dan menambahkan cakupan QA
- [Matrix](/id/channels/matrix): Plugin kanal yang sedang diuji
