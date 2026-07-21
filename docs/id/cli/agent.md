---
read_when:
    - Anda ingin menjalankan satu giliran agen dari skrip (opsional mengirimkan balasan)
summary: Referensi CLI untuk `openclaw agent` (kirim satu giliran agen melalui Gateway)
title: Agen
x-i18n:
    generated_at: "2026-07-21T12:31:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1a4c139a3b235d6a56ba63063737b80f93448c2dbb7a92c6d0756fb19a9f95e4
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Jalankan satu giliran agen melalui Gateway. Flag eksplisit `--local` adalah satu-satunya jalur eksekusi tertanam.

Berikan setidaknya satu pemilih sesi: `--to`, `--session-key`, `--session-id`, atau `--agent`.

Terkait: [Alat pengiriman agen](/id/tools/agent-send)

## Opsi

- `-m, --message <text>`: isi pesan
- `--message-file <path>`: baca isi pesan dari file UTF-8
- `-t, --to <dest>`: penerima yang digunakan untuk memperoleh kunci sesi
- `--session-key <key>`: kunci sesi eksplisit yang akan digunakan untuk perutean
- `--session-id <id>`: id sesi eksplisit
- `--agent <id>`: id agen; mengesampingkan pengikatan perutean
- `--model <id>`: penggantian model untuk proses ini (`provider/model` atau id model)
- `--thinking <level>`: tingkat pemikiran agen (`off`, `minimal`, `low`, `medium`, `high`, ditambah tingkat khusus yang didukung penyedia seperti `xhigh`, `adaptive`, atau `max`)
- `--verbose <on|off>`: pertahankan tingkat verbositas untuk sesi
- `--channel <channel>`: saluran pengiriman; hilangkan untuk menggunakan saluran sesi utama
- `--reply-to <target>`: penggantian target pengiriman
- `--reply-channel <channel>`: penggantian saluran pengiriman
- `--reply-account <id>`: penggantian akun pengiriman
- `--local`: jalankan agen tertanam secara langsung (setelah pramuat registri plugin)
- `--deliver`: kirim balasan kembali ke saluran/target yang dipilih
- `--timeout <seconds>`: ganti tenggat giliran agen perintah ini (nilai default 600, atau `agents.defaults.timeoutSeconds`); `0` menonaktifkan tenggat keseluruhan. Nilai cadangan 600 detik berlaku untuk perintah CLI ini, bukan giliran Gateway biasa, yang nilai defaultnya adalah 48 jam.
- `--json`: keluarkan JSON

## Contoh

```bash
openclaw agent --to +15555550123 --message "pembaruan status" --deliver
openclaw agent --agent ops --message "Ringkas log"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Ringkas log"
openclaw agent --session-key agent:ops:incident-42 --message "Ringkas status"
openclaw agent --agent ops --session-key incident-42 --message "Ringkas status"
openclaw agent --session-id 1234 --message "Ringkas kotak masuk" --thinking medium
openclaw agent --to +15555550123 --message "Lacak log" --verbose on --json
openclaw agent --agent ops --message "Buat laporan" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Jalankan secara lokal" --local
```

## Catatan

- Berikan tepat salah satu dari `--message` atau `--message-file`. `--message-file` menghapus BOM UTF-8 di awal dan mempertahankan konten multibaris; opsi ini menolak file yang bukan UTF-8 valid. File yang lebih besar dari 4 MiB ditolak sebelum pengiriman.
- Perintah garis miring (misalnya `/compact`) tidak dapat dijalankan melalui `--message`. CLI menolaknya dan mengarahkan Anda ke perintah khusus sebagai gantinya (`openclaw sessions compact <key>` untuk Compaction).
- Proses `--local` bersifat sekali jalan: sumber daya loopback MCP bawaan dan sesi stdio Claude siap pakai yang dibuka untuk proses tersebut dihentikan setelah balasan, sehingga pemanggilan berskrip tidak membiarkan proses anak lokal tetap berjalan. Sebaliknya, proses yang didukung Gateway mempertahankan sumber daya loopback MCP milik Gateway di bawah proses Gateway yang sedang berjalan.
- Eksekusi tertanam mandiri dengan `--local` menolak menggunakan kembali sesi utama yang ada saat pemulihan mulai ulang masih tertunda. Jalankan giliran melalui Gateway yang sehat, atau atur ulang di sana dengan `/new` atau `/reset`; proses tertanam independen tidak dapat mengoordinasikan pemilik pemulihan tersebut dengan pemindai Gateway secara aman.
- Dengan `--agent`, `--channel`, dan `--to` secara bersamaan, perutean sesi mengikuti penerima kanonis saluran dan `session.dmScope`. Saluran dengan identitas penerima khusus keluar yang stabil menggunakan sesi milik penyedia yang terisolasi dari sesi utama agen. `--reply-channel` dan `--reply-account` hanya memengaruhi pengiriman.
- `--session-key` memilih kunci sesi eksplisit. Kunci dengan awalan agen harus menggunakan `agent:<agent-id>:<session-key>`, dan `--agent` harus cocok dengan id agen pada kunci ketika keduanya diberikan. Kunci biasa non-sentinel dicakup ke `--agent` jika diberikan, atau ke agen default yang dikonfigurasi jika tidak; misalnya, `--agent ops --session-key incident-42` dirutekan ke `agent:ops:incident-42`. Kunci literal `global` dan `unknown` tetap tanpa cakupan hanya jika tidak ada `--agent` yang diberikan.
- `--json` mencadangkan stdout untuk respons JSON; diagnostik Gateway, plugin, dan `--local` dikirim ke stderr agar skrip dapat mengurai stdout secara langsung.
- Setelah percobaan ulang handshake sementara habis, waktu tunggu Gateway atau koneksi tertutup akan menggagalkan perintah; CLI tidak pernah secara diam-diam menjalankan ulang giliran secara tertanam. Kehilangan transportasi bersifat ambigu — Gateway mungkin telah menerima dan mungkin masih menyelesaikan giliran — sehingga petunjuk stderr menyarankan untuk memeriksa `openclaw gateway status` dan transkrip sesi sebelum mencoba lagi atau menjalankan ulang dengan `--local`, guna menghindari eksekusi giliran dua kali.
- `SIGTERM`/`SIGINT` menginterupsi permintaan yang didukung Gateway dan sedang menunggu; jika Gateway telah menerima proses tersebut, CLI juga mengirim `chat.abort` untuk id proses itu sebelum keluar. Proses `--local` menerima sinyal yang sama tetapi tidak mengirim `chat.abort`. Proses anak peluncur yang dihentikan oleh `SIGINT` atau `SIGTERM` pertama yang diteruskan akan keluar masing-masing dengan status 130 atau 143. Jika kunci deduplikasi proses internal sudah memiliki proses aktif untuk sesi ini, respons melaporkan `status: "in_flight"` dan CLI non-JSON mencetak diagnostik stderr alih-alih balasan kosong. Untuk pembungkus cron/systemd eksternal, pertahankan mekanisme penghentian paksa cadangan seperti `timeout -k 60 600 openclaw agent ...` agar supervisor dapat membersihkan proses jika penghentian tidak dapat dituntaskan.
- Saat perintah ini memicu regenerasi `models.json`, kredensial penyedia yang dikelola SecretRef dipertahankan sebagai penanda non-rahasia (misalnya nama variabel lingkungan, `secretref-env:ENV_VAR_NAME`, atau `secretref-managed`), tidak pernah sebagai teks polos rahasia yang telah diresolusi. Penulisan penanda berasal dari snapshot konfigurasi sumber aktif, bukan dari nilai rahasia runtime yang telah diresolusi.

## Status pengiriman JSON

Dengan `--json --deliver`, respons JSON CLI menyertakan `deliveryStatus` tingkat atas agar skrip dapat membedakan pengiriman yang berhasil, dibatalkan, sebagian, dan gagal:

```json
{
  "payloads": [{ "text": "Laporan siap", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

Respons CLI yang didukung Gateway juga mempertahankan bentuk hasil mentah Gateway di `result.deliveryStatus`.

`deliveryStatus.status` adalah salah satu dari:

| Status           | Arti                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `sent`           | Pengiriman selesai.                                                                                                                        |
| `suppressed`     | Pengiriman sengaja tidak dilakukan (misalnya hook pengiriman pesan membatalkannya, atau tidak ada hasil yang terlihat). Terminal, tanpa percobaan ulang. |
| `partial_failed` | Setidaknya satu payload terkirim sebelum payload berikutnya gagal.                                                                         |
| `failed`         | Tidak ada pengiriman persisten yang selesai, atau pemeriksaan awal pengiriman gagal.                                                        |

Kolom umum:

- `requested`: selalu `true` ketika objek tersedia.
- `attempted`: `true` setelah jalur pengiriman persisten dijalankan; `false` untuk kegagalan pemeriksaan awal atau tidak adanya payload yang terlihat.
- `succeeded`: `true`, `false`, atau `"partial"`; `"partial"` berpasangan dengan `status: "partial_failed"`.
- `reason`: alasan dalam format snake-case huruf kecil dari pengiriman persisten atau validasi awal. Nilai yang diketahui mencakup `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target`, dan `no_delivery_target`; pengiriman persisten yang gagal juga dapat melaporkan tahap yang gagal. Perlakukan nilai yang tidak dikenal sebagai opak karena himpunannya dapat bertambah.
- `resultCount`: jumlah hasil pengiriman saluran, jika tersedia.
- `sentBeforeError`: `true` ketika kegagalan sebagian telah mengirim setidaknya satu payload sebelum mengalami galat.
- `error`: `true` untuk pengiriman yang gagal atau gagal sebagian.
- `errorMessage`: hanya tersedia ketika pesan galat pengiriman yang mendasarinya berhasil ditangkap. Kegagalan pemeriksaan awal membawa `error`/`reason`, tetapi tanpa `errorMessage`.
- `payloadOutcomes`: hasil opsional per payload dengan `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError`, atau metadata hook jika tersedia.

## Terkait

- [Referensi CLI](/id/cli)
- [Runtime agen](/id/concepts/agent)
