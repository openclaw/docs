---
read_when:
    - Menyiapkan laporan bug atau permintaan dukungan
    - Men-debug crash, mulai ulang, tekanan memori, atau payload berukuran terlalu besar pada Gateway
    - Meninjau data diagnostik apa yang direkam atau disunting
summary: Buat bundel diagnostik Gateway yang dapat dibagikan untuk laporan bug
title: Ekspor diagnostik
x-i18n:
    generated_at: "2026-07-12T14:09:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw dapat membuat `.zip` diagnostik lokal untuk laporan bug: status Gateway
yang telah disanitasi, kesehatan, log, struktur konfigurasi, dan peristiwa stabilitas
terbaru tanpa payload.

Perlakukan bundel diagnostik seperti rahasia hingga ditinjau. Payload dan kredensial
disunting secara bawaan, tetapi bundel tersebut tetap merangkum log Gateway lokal dan
status runtime tingkat host.

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

## Perintah obrolan

Pemilik dapat menjalankan `/diagnostics [note]` dalam percakapan apa pun untuk meminta
ekspor Gateway lokal sebagai satu laporan dukungan yang dapat disalin dan ditempel:

1. Kirim `/diagnostics`, dengan catatan singkat jika perlu (`/diagnostics bad tool choice`).
2. OpenClaw mengirim pengantar dan meminta satu persetujuan eksekusi eksplisit, yang
   menjalankan `openclaw gateway diagnostics export --json`. Jangan menyetujui diagnostik
   melalui aturan izinkan-semua.
3. Setelah disetujui, OpenClaw membalas dengan jalur bundel lokal, ringkasan manifes,
   catatan privasi, dan ID sesi yang relevan.

Dalam obrolan grup, pemilik tetap dapat menjalankan `/diagnostics`, tetapi OpenClaw
mengirim hasil ekspor, permintaan persetujuan, serta perincian sesi/utas Codex kepada
pemilik secara privat. Grup hanya melihat pemberitahuan singkat bahwa diagnostik telah
dikirim secara privat. Jika tidak tersedia rute privat ke pemilik, perintah gagal secara
tertutup dan meminta pemilik menjalankannya dari DM.

Saat sesi aktif menggunakan harness OpenAI Codex native, persetujuan eksekusi yang sama
juga mencakup pengunggahan umpan balik OpenAI untuk utas Codex yang diketahui OpenClaw.
Pengunggahan tersebut terpisah dari zip Gateway lokal dan hanya terjadi untuk sesi
harness Codex. Permintaan persetujuan menyatakan bahwa persetujuan juga mengirim umpan
balik Codex, tanpa mencantumkan ID sesi atau utas Codex. Setelah disetujui, balasan
mencantumkan channel, ID sesi OpenClaw, ID utas Codex, dan perintah pelanjutan lokal
untuk utas yang dikirim ke OpenAI. Menolak atau mengabaikan persetujuan akan melewati
ekspor, pengunggahan umpan balik Codex, dan daftar ID Codex.

Hal ini mempersingkat siklus debugging Codex: temukan perilaku buruk di suatu channel,
jalankan `/diagnostics`, setujui sekali, bagikan laporan, lalu jalankan perintah
`codex resume <thread-id>` yang dicetak secara lokal jika Anda ingin memeriksa sendiri
utas tersebut. Lihat [harness Codex](/id/plugins/codex-harness#inspect-codex-threads-locally).

## Isi ekspor

- `summary.md`: ikhtisar yang mudah dibaca manusia untuk dukungan.
- `diagnostics.json`: ringkasan konfigurasi, log, status, kesehatan, dan data stabilitas
  yang dapat dibaca mesin.
- `manifest.json`: metadata ekspor dan daftar berkas.
- Struktur konfigurasi yang disanitasi dan detail konfigurasi yang bukan rahasia.
- Ringkasan log yang disanitasi dan baris log terbaru yang telah disunting.
- Snapshot status dan kesehatan Gateway berdasarkan upaya terbaik.
- `stability/latest.json`: bundel stabilitas tersimpan terbaru, jika tersedia.

Ekspor tetap berguna ketika Gateway tidak sehat: jika permintaan status/kesehatan
gagal, log lokal, struktur konfigurasi, dan bundel stabilitas terbaru tetap dikumpulkan
jika tersedia.

## Model privasi

Dipertahankan: nama subsistem, ID plugin, ID penyedia, ID channel, mode yang
dikonfigurasi, kode status, durasi, jumlah bita, status antrean, pembacaan memori,
metadata log yang disanitasi, pesan operasional yang disunting, struktur konfigurasi,
dan pengaturan fitur yang bukan rahasia.

Dihilangkan atau disunting: teks obrolan, prompt, instruksi, isi webhook, keluaran alat,
kredensial, kunci API, token, cookie, nilai rahasia, isi mentah permintaan/respons, ID
akun, ID pesan, ID sesi mentah, nama host, dan nama pengguna lokal.

Saat pesan log tampak seperti teks payload pengguna, obrolan, prompt, atau alat,
ekspor hanya mencatat bahwa sebuah pesan dihilangkan beserta jumlah bitanya.

## Perekam stabilitas

Secara bawaan, Gateway merekam aliran stabilitas terbatas tanpa payload saat diagnostik
diaktifkan. Aliran ini merekam fakta operasional, bukan konten.

Heartbeat yang sama juga mengambil sampel keaktifan saat event loop atau CPU tampak
jenuh, dengan memancarkan peristiwa `diagnostic.liveness.warning` yang berisi penundaan
event loop, utilisasi event loop, rasio inti CPU, jumlah sesi aktif/menunggu/diantrekan,
fase startup/runtime saat ini (jika diketahui), rentang fase terbaru, dan label pekerjaan
terbatas. Peristiwa ini hanya menjadi baris log Gateway tingkat `warn` saat ada pekerjaan
yang menunggu atau diantrekan, atau saat pekerjaan aktif berimpitan dengan penundaan
event loop yang berkelanjutan; jika tidak, peristiwa dicatat pada tingkat `debug`.
Sampel keaktifan saat menganggur tetap direkam sebagai peristiwa diagnostik, tetapi
tidak pernah meningkat menjadi peringatan dengan sendirinya.

Fase startup memancarkan peristiwa `diagnostic.phase.completed` dengan pengukuran waktu
jam dinding dan CPU. Diagnostik eksekusi tertanam yang macet menandai
`terminalProgressStale=true` saat progres bridge terakhir tampak terminal (misalnya item
respons mentah atau peristiwa penyelesaian respons), tetapi Gateway masih menganggap
eksekusi tertanam tersebut aktif.

Periksa perekam langsung:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Periksa bundel tersimpan terbaru setelah penghentian fatal, batas waktu penonaktifan,
atau kegagalan startup setelah dimulai ulang:

```bash
openclaw gateway stability --bundle latest
```

Buat zip diagnostik dari bundel tersimpan terbaru:

```bash
openclaw gateway stability --bundle latest --export
```

Bundel tersimpan berada di bawah `~/.openclaw/logs/stability/` saat terdapat peristiwa.

## Opsi yang berguna

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| Flag                    | Bawaan                                                                        | Deskripsi                                                   |
| ----------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | Tulis ke jalur zip (atau direktori) tertentu.                |
| `--log-lines <count>`   | `5000`                                                                        | Jumlah maksimum baris log tersanitasi yang disertakan.       |
| `--log-bytes <bytes>`   | `1000000`                                                                     | Jumlah maksimum bita log yang diperiksa.                     |
| `--url <url>`           | -                                                                             | URL WebSocket Gateway untuk snapshot status/kesehatan.       |
| `--token <token>`       | -                                                                             | Token Gateway untuk snapshot status/kesehatan.               |
| `--password <password>` | -                                                                             | Kata sandi Gateway untuk snapshot status/kesehatan.          |
| `--timeout <ms>`        | `3000`                                                                        | Batas waktu snapshot status/kesehatan.                       |
| `--no-stability-bundle` | nonaktif                                                                      | Lewati pencarian bundel stabilitas tersimpan.                |
| `--json`                | nonaktif                                                                      | Cetak metadata ekspor yang dapat dibaca mesin.               |

## Menonaktifkan diagnostik

Diagnostik diaktifkan secara bawaan. Untuk menonaktifkan perekam stabilitas dan
pengumpulan peristiwa diagnostik:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Menonaktifkan diagnostik mengurangi detail laporan bug; hal ini tidak memengaruhi
pencatatan log Gateway normal.

Snapshot tekanan memori kritis dinonaktifkan secara bawaan. Untuk merekam snapshot
stabilitas pra-OOM selain peristiwa diagnostik normal:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Gunakan ini hanya pada host yang dapat menoleransi pemindaian sistem berkas tambahan
dan penulisan snapshot selama tekanan memori kritis. Peristiwa tekanan memori normal
tetap merekam fakta RSS, heap, ambang batas, dan pertumbuhan (`rss_threshold`,
`heap_threshold`, `rss_growth`) saat snapshot dinonaktifkan.

## Terkait

- [Pemeriksaan kesehatan](/id/gateway/health)
- [CLI Gateway](/id/cli/gateway#gateway-diagnostics-export)
- [Protokol Gateway](/id/gateway/protocol#rpc-method-families)
- [Pencatatan log](/id/logging)
- [Ekspor OpenTelemetry](/id/gateway/opentelemetry) - alur terpisah untuk mengalirkan diagnostik ke pengumpul
