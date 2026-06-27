---
read_when:
    - Anda ingin menjalankan satu giliran agen dari skrip (opsional mengirimkan balasan)
summary: Referensi CLI untuk `openclaw agent` (kirim satu giliran agen melalui Gateway)
title: Agen
x-i18n:
    generated_at: "2026-06-27T17:17:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be2aad94ba288d14b4b18086dae54eb10c1cd0a6c7b27a836d07f39200e651d8
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Jalankan giliran agen melalui Gateway (gunakan `--local` untuk tertanam).
Gunakan `--agent <id>` untuk menargetkan agen terkonfigurasi secara langsung.

Berikan setidaknya satu pemilih sesi:

- `--to <dest>`
- `--session-key <key>`
- `--session-id <id>`
- `--agent <id>`

Terkait:

- Alat kirim agen: [Kirim agen](/id/tools/agent-send)

## Opsi

- `-m, --message <text>`: isi pesan
- `--message-file <path>`: baca isi pesan dari file UTF-8
- `-t, --to <dest>`: penerima yang digunakan untuk menurunkan kunci sesi
- `--session-key <key>`: kunci sesi eksplisit yang digunakan untuk perutean
- `--session-id <id>`: id sesi eksplisit
- `--agent <id>`: id agen; mengesampingkan ikatan perutean
- `--model <id>`: pengesampingan model untuk proses ini (`provider/model` atau id model)
- `--thinking <level>`: tingkat berpikir agen (`off`, `minimal`, `low`, `medium`, `high`, ditambah tingkat khusus yang didukung penyedia seperti `xhigh`, `adaptive`, atau `max`)
- `--verbose <on|off>`: simpan tingkat verbose untuk sesi
- `--channel <channel>`: kanal pengiriman; hilangkan untuk menggunakan kanal sesi utama
- `--reply-to <target>`: pengesampingan target pengiriman
- `--reply-channel <channel>`: pengesampingan kanal pengiriman
- `--reply-account <id>`: pengesampingan akun pengiriman
- `--local`: jalankan agen tertanam secara langsung (setelah pramuat registri Plugin)
- `--deliver`: kirim balasan kembali ke kanal/target yang dipilih
- `--timeout <seconds>`: kesampingkan batas waktu agen (default 600 atau nilai konfigurasi)
- `--json`: keluarkan JSON

## Contoh

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Catatan

- Berikan tepat salah satu dari `--message` atau `--message-file`. `--message-file` mempertahankan konten file multi-baris setelah menghapus BOM UTF-8 opsional, dan menolak file yang bukan UTF-8 valid.
- Mode Gateway kembali ke agen tertanam ketika permintaan Gateway gagal. Gunakan `--local` untuk memaksa eksekusi tertanam sejak awal.
- `--local` tetap memuat registri Plugin terlebih dahulu, sehingga penyedia, alat, dan kanal yang disediakan Plugin tetap tersedia selama proses tertanam.
- `--local` dan proses fallback tertanam diperlakukan sebagai proses sekali jalan. Resource loopback MCP bawaan dan sesi stdio Claude hangat yang dibuka untuk proses lokal itu dihentikan setelah balasan, sehingga pemanggilan berskrip tidak membiarkan proses anak lokal tetap hidup.
- Proses yang didukung Gateway meninggalkan resource loopback MCP milik Gateway di bawah proses Gateway yang berjalan; klien lama mungkin masih mengirim tanda pembersihan historis, tetapi Gateway menerimanya sebagai no-op kompatibilitas.
- `--channel`, `--reply-channel`, dan `--reply-account` memengaruhi pengiriman balasan, bukan perutean sesi.
- `--session-key` memilih kunci sesi eksplisit. Kunci berprefiks agen harus menggunakan `agent:<agent-id>:<session-key>`, dan `--agent` harus cocok dengan id agen milik kunci ketika keduanya diberikan. Kunci non-sentinel polos dicakupkan ke `--agent` ketika disediakan, atau ke agen default terkonfigurasi jika tidak; misalnya, `--agent ops --session-key incident-42` dirutekan ke `agent:ops:incident-42`. Literal `global` dan `unknown` tetap tidak dicakupkan hanya ketika tidak ada `--agent` yang disediakan; dalam kasus itu, fallback tertanam dan kepemilikan penyimpanan menggunakan agen default terkonfigurasi.
- `--json` menjaga stdout khusus untuk respons JSON. Diagnostik Gateway, Plugin, dan fallback tertanam dirutekan ke stderr sehingga skrip dapat mengurai stdout secara langsung.
- JSON fallback tertanam menyertakan `meta.transport: "embedded"` dan `meta.fallbackFrom: "gateway"` sehingga skrip dapat membedakan proses fallback dari proses Gateway.
- Jika Gateway menerima proses agen tetapi CLI kehabisan waktu saat menunggu balasan akhir, fallback tertanam menggunakan id sesi/proses eksplisit `gateway-fallback-*` yang baru dan melaporkan `meta.fallbackReason: "gateway_timeout"` ditambah bidang sesi fallback. Ini menghindari perebutan kunci transkrip milik Gateway atau penggantian diam-diam sesi percakapan terute asli.
- Untuk proses yang didukung Gateway, `SIGTERM` dan `SIGINT` menginterupsi permintaan CLI yang sedang menunggu. Jika Gateway sudah menerima proses, CLI juga mengirim `chat.abort` untuk id proses yang diterima itu sebelum keluar. Proses `--local` lokal dan proses fallback tertanam menerima sinyal abort yang sama, tetapi tidak mengirim `chat.abort`. Jika duplikat `--run-id` mencapai Gateway saat proses agen asli masih aktif, respons duplikat melaporkan `status: "in_flight"` dan CLI non-JSON mencetak diagnostik stderr alih-alih balasan kosong. Untuk pembungkus cron/systemd eksternal, pertahankan penahan hard-kill luar seperti `timeout -k 60 600 openclaw agent ...` agar supervisor tetap dapat menuai proses jika penghentian tidak dapat selesai.
- Ketika perintah ini memicu regenerasi `models.json`, kredensial penyedia yang dikelola SecretRef disimpan sebagai penanda non-rahasia (misalnya nama variabel env, `secretref-env:ENV_VAR_NAME`, atau `secretref-managed`), bukan plaintext rahasia yang terselesaikan.
- Penulisan penanda bersifat otoritatif sumber: OpenClaw menyimpan penanda dari snapshot konfigurasi sumber aktif, bukan dari nilai rahasia runtime yang terselesaikan.

## Status pengiriman JSON

Ketika `--json --deliver` digunakan, respons JSON CLI dapat menyertakan `deliveryStatus` tingkat atas sehingga skrip dapat membedakan pengiriman yang terkirim, ditekan, sebagian, dan gagal:

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
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

`deliveryStatus.status` adalah salah satu dari `sent`, `suppressed`, `partial_failed`, atau `failed`. `suppressed` berarti pengiriman sengaja tidak dikirim, misalnya hook pengiriman pesan membatalkannya atau tidak ada hasil yang terlihat; ini tetap merupakan hasil terminal tanpa coba ulang. `partial_failed` berarti setidaknya satu payload dikirim sebelum payload berikutnya gagal. `failed` berarti tidak ada pengiriman tahan lama yang selesai atau preflight pengiriman gagal.

Respons CLI yang didukung Gateway juga mempertahankan bentuk hasil mentah Gateway, tempat objek yang sama tersedia di `result.deliveryStatus`.

Bidang umum:

- `requested`: selalu `true` ketika objek ada.
- `attempted`: `true` setelah jalur pengiriman tahan lama berjalan; `false` untuk kegagalan preflight atau tidak ada payload yang terlihat.
- `succeeded`: `true`, `false`, atau `"partial"`; `"partial"` berpasangan dengan `status: "partial_failed"`.
- `reason`: alasan snake-case huruf kecil dari pengiriman tahan lama atau validasi preflight. Alasan yang diketahui mencakup `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target`, dan `no_delivery_target`; pengiriman tahan lama yang gagal juga dapat melaporkan tahap yang gagal. Perlakukan nilai tidak dikenal sebagai opaque karena himpunannya dapat bertambah.
- `resultCount`: jumlah hasil pengiriman kanal jika tersedia.
- `sentBeforeError`: `true` ketika kegagalan sebagian mengirim setidaknya satu payload sebelum kesalahan.
- `error`: boolean `true` untuk pengiriman yang gagal atau sebagian gagal.
- `errorMessage`: disertakan hanya ketika pesan kesalahan pengiriman yang mendasari tertangkap. Kegagalan preflight membawa `error` dan `reason` tetapi tanpa `errorMessage`.
- `payloadOutcomes`: hasil opsional per-payload dengan `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError`, atau metadata hook jika tersedia.

## Terkait

- [Referensi CLI](/id/cli)
- [Runtime agen](/id/concepts/agent)
