---
read_when:
    - Anda ingin menjalankan satu giliran agen dari skrip (opsional mengirimkan balasan)
summary: Referensi CLI untuk `openclaw agent` (kirim satu giliran agen melalui Gateway)
title: Agen
x-i18n:
    generated_at: "2026-05-10T19:27:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae5c2f895cadf70a6253e49a3c7c698a04840a24231076cf8ef5bab340162f52
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Jalankan satu giliran agen melalui Gateway (gunakan `--local` untuk tertanam).
Gunakan `--agent <id>` untuk menargetkan agen yang dikonfigurasi secara langsung.

Berikan setidaknya satu pemilih sesi:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Terkait:

- Alat kirim agen: [Kirim agen](/id/tools/agent-send)

## Opsi

- `-m, --message <text>`: isi pesan wajib
- `-t, --to <dest>`: penerima yang digunakan untuk menurunkan kunci sesi
- `--session-id <id>`: id sesi eksplisit
- `--agent <id>`: id agen; menimpa pengikatan perutean
- `--model <id>`: penimpaan model untuk eksekusi ini (`provider/model` atau id model)
- `--thinking <level>`: tingkat berpikir agen (`off`, `minimal`, `low`, `medium`, `high`, ditambah tingkat kustom yang didukung penyedia seperti `xhigh`, `adaptive`, atau `max`)
- `--verbose <on|off>`: simpan tingkat verbose untuk sesi
- `--channel <channel>`: kanal pengiriman; hilangkan untuk menggunakan kanal sesi utama
- `--reply-to <target>`: penimpaan target pengiriman
- `--reply-channel <channel>`: penimpaan kanal pengiriman
- `--reply-account <id>`: penimpaan akun pengiriman
- `--local`: jalankan agen tertanam secara langsung (setelah pramuat registri Plugin)
- `--deliver`: kirim balasan kembali ke kanal/target yang dipilih
- `--timeout <seconds>`: timpa batas waktu agen (default 600 atau nilai konfigurasi)
- `--json`: keluarkan JSON

## Contoh

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Catatan

- Mode Gateway kembali ke agen tertanam ketika permintaan Gateway gagal. Gunakan `--local` untuk memaksa eksekusi tertanam sejak awal.
- `--local` tetap memuat lebih dulu registri Plugin, sehingga penyedia, alat, dan kanal yang disediakan Plugin tetap tersedia selama eksekusi tertanam.
- `--local` dan eksekusi fallback tertanam diperlakukan sebagai eksekusi sekali jalan. Sumber daya loopback MCP bawaan dan sesi stdio Claude hangat yang dibuka untuk proses lokal tersebut dihentikan setelah balasan, sehingga pemanggilan terskrip tidak mempertahankan proses anak lokal tetap hidup.
- Eksekusi yang didukung Gateway membiarkan sumber daya loopback MCP milik Gateway di bawah proses Gateway yang sedang berjalan; klien lama mungkin masih mengirim flag pembersihan historis, tetapi Gateway menerimanya sebagai no-op kompatibilitas.
- `--channel`, `--reply-channel`, dan `--reply-account` memengaruhi pengiriman balasan, bukan perutean sesi.
- `--json` menjaga stdout khusus untuk respons JSON. Diagnostik Gateway, Plugin, dan fallback tertanam diarahkan ke stderr sehingga skrip dapat mengurai stdout secara langsung.
- JSON fallback tertanam menyertakan `meta.transport: "embedded"` dan `meta.fallbackFrom: "gateway"` sehingga skrip dapat membedakan eksekusi fallback dari eksekusi Gateway.
- Jika Gateway menerima eksekusi agen tetapi CLI habis waktu saat menunggu balasan akhir, fallback tertanam menggunakan id sesi/eksekusi eksplisit baru `gateway-fallback-*` dan melaporkan `meta.fallbackReason: "gateway_timeout"` beserta bidang sesi fallback. Ini menghindari perlombaan dengan kunci transkrip milik Gateway atau penggantian diam-diam atas sesi percakapan terarah asli.
- Saat perintah ini memicu regenerasi `models.json`, kredensial penyedia yang dikelola SecretRef disimpan sebagai penanda non-rahasia (misalnya nama variabel env, `secretref-env:ENV_VAR_NAME`, atau `secretref-managed`), bukan teks polos rahasia yang diselesaikan.
- Penulisan penanda bersifat otoritatif-sumber: OpenClaw menyimpan penanda dari snapshot konfigurasi sumber aktif, bukan dari nilai rahasia runtime yang diselesaikan.

## Status pengiriman JSON

Saat `--json --deliver` digunakan, respons JSON CLI dapat menyertakan `deliveryStatus` tingkat atas sehingga skrip dapat membedakan pengiriman yang terkirim, ditekan, sebagian, dan gagal:

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

`deliveryStatus.status` adalah salah satu dari `sent`, `suppressed`, `partial_failed`, atau `failed`. `suppressed` berarti pengiriman sengaja tidak dikirim, misalnya hook pengiriman pesan membatalkannya atau tidak ada hasil yang terlihat; ini tetap merupakan hasil terminal tanpa percobaan ulang. `partial_failed` berarti setidaknya satu payload dikirim sebelum payload berikutnya gagal. `failed` berarti tidak ada pengiriman tahan lama yang selesai atau pra-pemeriksaan pengiriman gagal.

Respons CLI yang didukung Gateway juga mempertahankan bentuk hasil Gateway mentah, dengan objek yang sama tersedia di `result.deliveryStatus`.

Bidang umum:

- `requested`: selalu `true` ketika objek ada.
- `attempted`: `true` setelah jalur pengiriman tahan lama berjalan; `false` untuk kegagalan pra-pemeriksaan atau tidak ada payload yang terlihat.
- `succeeded`: `true`, `false`, atau `"partial"`; `"partial"` berpasangan dengan `status: "partial_failed"`.
- `reason`: alasan snake-case huruf kecil dari pengiriman tahan lama atau validasi pra-pemeriksaan. Alasan yang diketahui mencakup `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target`, dan `no_delivery_target`; pengiriman tahan lama yang gagal juga dapat melaporkan tahap yang gagal. Perlakukan nilai yang tidak diketahui sebagai opak karena himpunannya dapat bertambah.
- `resultCount`: jumlah hasil pengiriman kanal saat tersedia.
- `sentBeforeError`: `true` ketika kegagalan sebagian mengirim setidaknya satu payload sebelum error.
- `error`: boolean `true` untuk pengiriman gagal atau gagal sebagian.
- `errorMessage`: disertakan hanya ketika pesan error pengiriman yang mendasari tertangkap. Kegagalan pra-pemeriksaan membawa `error` dan `reason` tetapi tanpa `errorMessage`.
- `payloadOutcomes`: hasil opsional per payload dengan `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError`, atau metadata hook saat tersedia.

## Terkait

- [Referensi CLI](/id/cli)
- [Runtime agen](/id/concepts/agent)
