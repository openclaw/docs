---
read_when:
    - Menyiapkan laporan bug atau permintaan dukungan
    - Men-debug crash, mulai ulang, tekanan memori, atau payload berukuran terlalu besar pada Gateway
    - Meninjau data diagnostik apa yang dicatat atau disunting untuk kerahasiaan
summary: Buat bundel diagnostik Gateway yang dapat dibagikan untuk laporan bug
title: Ekspor diagnostik
x-i18n:
    generated_at: "2026-07-20T03:52:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 97a805fed8d51de2e63e5c6a12ce03e91701d69654882cca7795c9f3553b1c55
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw dapat membuat `.zip` diagnostik lokal untuk laporan bug: status, kesehatan, log, bentuk konfigurasi, dan peristiwa stabilitas terbaru tanpa payload dari Gateway yang telah disanitasi.

Perlakukan bundel diagnostik seperti rahasia hingga ditinjau. Payload dan kredensial disamarkan secara bawaan, tetapi bundel tersebut tetap merangkum log Gateway lokal dan status runtime tingkat host.

## Mulai cepat

```bash
openclaw gateway diagnostics export
```

Mencetak jalur zip yang ditulis. Pilih jalur keluaran:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Untuk otomatisasi:

```bash
openclaw gateway diagnostics export --json
```

## Perintah chat

Pemilik dapat menjalankan `/diagnostics [note]` dalam percakapan apa pun untuk meminta ekspor Gateway lokal sebagai satu laporan dukungan yang dapat disalin dan ditempel:

1. Kirim `/diagnostics`, secara opsional dengan catatan singkat (`/diagnostics bad tool choice`).
2. OpenClaw mengirimkan pengantar dan meminta satu persetujuan eksekusi eksplisit, yang menjalankan
   `openclaw gateway diagnostics export --json`. Jangan menyetujui diagnostik melalui
   aturan izinkan-semua.
3. Setelah disetujui, OpenClaw membalas dengan jalur bundel lokal, ringkasan manifes, catatan privasi, dan id sesi yang relevan.

Dalam chat grup, pemilik tetap dapat menjalankan `/diagnostics`, tetapi OpenClaw mengirimkan hasil ekspor, permintaan persetujuan, dan rincian sesi/utas Codex kepada pemilik secara pribadi. Grup hanya melihat pemberitahuan singkat bahwa diagnostik dikirim secara pribadi. Jika tidak ada rute pribadi ke pemilik, perintah gagal secara tertutup dan meminta pemilik menjalankannya dari DM.

Ketika sesi aktif menggunakan harness OpenAI Codex native, persetujuan eksekusi yang sama juga mencakup pengunggahan umpan balik OpenAI untuk utas Codex yang diketahui OpenClaw. Pengunggahan tersebut terpisah dari zip Gateway lokal dan hanya terjadi untuk sesi harness Codex. Permintaan persetujuan menyatakan bahwa persetujuan juga mengirimkan umpan balik Codex, tanpa mencantumkan id sesi atau utas Codex. Setelah disetujui, balasan mencantumkan channel, id sesi OpenClaw, id utas Codex, dan perintah pelanjutan lokal untuk utas yang dikirim ke OpenAI. Menolak atau mengabaikan persetujuan akan melewati ekspor, pengunggahan umpan balik Codex, dan daftar id Codex.

Hal tersebut mempersingkat siklus debugging Codex: perhatikan perilaku buruk pada suatu channel, jalankan `/diagnostics`, setujui sekali, bagikan laporan, lalu jalankan perintah `codex resume <thread-id>` yang dicetak secara lokal jika Anda ingin memeriksa sendiri utas tersebut. Lihat [harness Codex](/id/plugins/codex-harness#inspect-codex-threads-locally).

## Isi ekspor

- `summary.md`: ikhtisar yang mudah dibaca untuk dukungan.
- `diagnostics.json`: ringkasan konfigurasi, log, status, kesehatan, dan data stabilitas yang dapat dibaca mesin.
- `manifest.json`: metadata ekspor dan daftar berkas.
- Bentuk konfigurasi yang telah disanitasi dan detail konfigurasi nonrahasia.
- Ringkasan log yang telah disanitasi dan baris log terbaru yang telah disamarkan.
- Snapshot status dan kesehatan Gateway dengan upaya terbaik.
- `stability/latest.json`: bundel stabilitas tersimpan terbaru, jika tersedia.

Ekspor tetap berguna ketika Gateway tidak sehat: jika permintaan status/kesehatan gagal, log lokal, bentuk konfigurasi, dan bundel stabilitas terbaru tetap dikumpulkan jika tersedia.

## Model privasi

Dipertahankan: nama subsistem, id plugin, id penyedia, id channel, mode yang dikonfigurasi, kode status, durasi, jumlah byte, status antrean, pembacaan memori, metadata log yang telah disanitasi, pesan operasional yang telah disamarkan, bentuk konfigurasi, dan pengaturan fitur nonrahasia.

Dihilangkan atau disamarkan: teks chat, prompt, instruksi, isi webhook, keluaran alat, kredensial, kunci API, token, cookie, nilai rahasia, isi mentah permintaan/respons, id akun, id pesan, id sesi mentah, nama host, dan nama pengguna lokal.

Ketika pesan log tampak seperti teks payload pengguna, chat, prompt, atau alat, ekspor hanya menyimpan informasi bahwa suatu pesan dihilangkan beserta jumlah byte-nya.

## Perekam stabilitas

Gateway secara bawaan merekam aliran stabilitas terbatas tanpa payload ketika diagnostik diaktifkan. Aliran ini merekam fakta operasional, bukan konten.

Heartbeat yang sama juga mengambil sampel keaktifan ketika event loop atau CPU tampak jenuh, dengan memancarkan peristiwa `diagnostic.liveness.warning` yang berisi penundaan event loop, utilisasi event loop, rasio inti CPU, jumlah sesi aktif/menunggu/diantrekan, fase startup/runtime saat ini (jika diketahui), rentang fase terbaru, dan label pekerjaan terbatas. Peristiwa ini menjadi baris log tingkat `warn` Gateway hanya ketika pekerjaan sedang menunggu atau diantrekan, atau ketika pekerjaan aktif tumpang tindih dengan penundaan event loop yang berkelanjutan; jika tidak, peristiwa dicatat pada `debug`. Sampel keaktifan saat menganggur tetap dicatat sebagai peristiwa diagnostik, tetapi tidak pernah meningkat menjadi peringatan dengan sendirinya.

Fase startup memancarkan peristiwa `diagnostic.phase.completed` dengan pengaturan waktu jam dinding dan CPU. Diagnostik eksekusi tertanam yang macet menandai `terminalProgressStale=true` ketika progres bridge terakhir tampak terminal (misalnya item respons mentah atau peristiwa penyelesaian respons), tetapi Gateway masih menganggap eksekusi tertanam tersebut aktif.

Periksa perekam langsung:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Periksa bundel tersimpan terbaru setelah keluar fatal, batas waktu penghentian, atau kegagalan startup saat memulai ulang:

```bash
openclaw gateway stability --bundle latest
```

Buat zip diagnostik dari bundel tersimpan terbaru:

```bash
openclaw gateway stability --bundle latest --export
```

Bundel tersimpan berada di bawah `~/.openclaw/logs/stability/` ketika terdapat peristiwa.

## Opsi yang berguna

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| Flag                    | Bawaan                                                                        | Deskripsi                                             |
| ----------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------- |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | Tulis ke jalur zip (atau direktori) tertentu.          |
| `--log-lines <count>`   | `5000`                                                                        | Jumlah maksimum baris log tersanitasi yang disertakan. |
| `--log-bytes <bytes>`   | `1000000`                                                                     | Jumlah maksimum byte log yang diperiksa.               |
| `--url <url>`           | -                                                                             | URL WebSocket Gateway untuk snapshot status/kesehatan. |
| `--token <token>`       | -                                                                             | Token Gateway untuk snapshot status/kesehatan.         |
| `--password <password>` | -                                                                             | Kata sandi Gateway untuk snapshot status/kesehatan.    |
| `--timeout <ms>`        | `3000`                                                                        | Batas waktu snapshot status/kesehatan.                 |
| `--no-stability-bundle` | nonaktif                                                                      | Lewati pencarian bundel stabilitas tersimpan.          |
| `--json`                | nonaktif                                                                      | Cetak metadata ekspor yang dapat dibaca mesin.         |

## Menonaktifkan diagnostik

Diagnostik diaktifkan secara bawaan. Untuk menonaktifkan perekam stabilitas dan pengumpulan peristiwa diagnostik:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Menonaktifkan diagnostik mengurangi detail laporan bug; hal ini tidak memengaruhi pencatatan log Gateway normal.

Peristiwa tekanan memori mencatat fakta RSS, heap, ambang batas, dan pertumbuhan (`rss_threshold`, `heap_threshold`, `rss_growth`) tanpa melakukan pemindaian sistem berkas atau menulis snapshot pra-OOM.

## Terkait

- [Pemeriksaan kesehatan](/id/gateway/health)
- [CLI Gateway](/id/cli/gateway#gateway-diagnostics-export)
- [Protokol Gateway](/id/gateway/protocol#rpc-method-families)
- [Pencatatan log](/id/logging)
- [Ekspor OpenTelemetry](/id/gateway/opentelemetry) - alur terpisah untuk mengalirkan diagnostik ke kolektor
