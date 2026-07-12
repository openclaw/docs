---
read_when:
    - Anda ingin menjalankan satu giliran agen dari skrip (dengan opsi mengirimkan balasan)
summary: Referensi CLI untuk `openclaw agent` (kirim satu giliran agen melalui Gateway)
title: Agen
x-i18n:
    generated_at: "2026-07-12T14:04:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Jalankan satu giliran agen melalui Gateway. Beralih ke agen tertanam jika permintaan Gateway gagal; berikan `--local` untuk memaksa eksekusi tertanam sejak awal.

Berikan setidaknya satu pemilih sesi: `--to`, `--session-key`, `--session-id`, atau `--agent`.

Terkait: [Alat pengiriman agen](/id/tools/agent-send)

## Opsi

- `-m, --message <text>`: isi pesan
- `--message-file <path>`: baca isi pesan dari berkas UTF-8
- `-t, --to <dest>`: penerima yang digunakan untuk memperoleh kunci sesi
- `--session-key <key>`: kunci sesi eksplisit yang digunakan untuk perutean
- `--session-id <id>`: id sesi eksplisit
- `--agent <id>`: id agen; menggantikan pengikatan perutean
- `--model <id>`: penggantian model untuk eksekusi ini (`provider/model` atau id model)
- `--thinking <level>`: tingkat pemikiran agen (`off`, `minimal`, `low`, `medium`, `high`, serta tingkat khusus yang didukung penyedia seperti `xhigh`, `adaptive`, atau `max`)
- `--verbose <on|off>`: pertahankan tingkat verbositas untuk sesi
- `--channel <channel>`: saluran pengiriman; hilangkan untuk menggunakan saluran sesi utama
- `--reply-to <target>`: penggantian target pengiriman
- `--reply-channel <channel>`: penggantian saluran pengiriman
- `--reply-account <id>`: penggantian akun pengiriman
- `--local`: jalankan agen tertanam secara langsung (setelah pramuat registri plugin)
- `--deliver`: kirim balasan kembali ke saluran/target yang dipilih
- `--timeout <seconds>`: ganti batas waktu agen (bawaan 600, atau `agents.defaults.timeoutSeconds`); `0` menonaktifkan batas waktu
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

- Berikan tepat salah satu dari `--message` atau `--message-file`. `--message-file` menghapus BOM UTF-8 di awal dan mempertahankan konten multibaris; opsi ini menolak berkas yang bukan UTF-8 valid.
- Perintah garis miring (misalnya `/compact`) tidak dapat dijalankan melalui `--message`. CLI menolaknya dan mengarahkan Anda ke perintah khusus sebagai gantinya (`openclaw sessions compact <key>` untuk Compaction).
- Eksekusi `--local` dan peralihan tertanam bersifat sekali jalan: sumber daya loopback MCP bawaan dan sesi stdio Claude siap pakai yang dibuka untuk eksekusi dihentikan setelah balasan, sehingga pemanggilan berskrip tidak membiarkan proses turunan lokal tetap berjalan. Sebaliknya, eksekusi yang didukung Gateway mempertahankan sumber daya loopback MCP milik Gateway di bawah proses Gateway yang sedang berjalan.
- Dengan `--agent`, `--channel`, dan `--to` secara bersamaan, perutean sesi mengikuti penerima kanonis saluran dan `session.dmScope`. Saluran dengan identitas penerima stabil yang hanya untuk pengiriman keluar menggunakan sesi milik penyedia yang terisolasi dari sesi utama agen. `--reply-channel` dan `--reply-account` hanya memengaruhi pengiriman.
- `--session-key` memilih kunci sesi eksplisit. Kunci berawalan agen harus menggunakan `agent:<agent-id>:<session-key>`, dan `--agent` harus cocok dengan id agen pada kunci ketika keduanya diberikan. Kunci biasa yang bukan sentinel dicakup ke `--agent` jika diberikan, atau ke agen bawaan yang dikonfigurasi jika tidak; misalnya, `--agent ops --session-key incident-42` dirutekan ke `agent:ops:incident-42`. Kunci literal `global` dan `unknown` tetap tidak tercakup hanya ketika `--agent` tidak diberikan.
- `--json` mencadangkan stdout untuk respons JSON; diagnostik Gateway, Plugin, dan peralihan tertanam dikirim ke stderr agar skrip dapat mengurai stdout secara langsung.
- JSON peralihan tertanam menyertakan `meta.transport: "embedded"` dan `meta.fallbackFrom: "gateway"` agar skrip dapat mendeteksi eksekusi peralihan.
- Jika Gateway menerima eksekusi tetapi CLI kehabisan waktu saat menunggu balasan akhir, peralihan tertanam menggunakan id sesi/eksekusi `gateway-fallback-*` baru dan melaporkan `meta.fallbackReason: "gateway_timeout"` beserta kolom sesi peralihan, alih-alih berlomba dengan transkrip milik Gateway atau secara diam-diam mengganti sesi asli.
- `SIGTERM`/`SIGINT` menginterupsi permintaan yang didukung Gateway dan sedang menunggu; jika Gateway telah menerima eksekusi, CLI juga mengirim `chat.abort` untuk id eksekusi tersebut sebelum keluar. Eksekusi `--local` dan peralihan tertanam menerima sinyal yang sama tetapi tidak mengirim `chat.abort`. Jika kunci deduplikasi eksekusi internal sudah memiliki eksekusi aktif untuk sesi ini, respons melaporkan `status: "in_flight"` dan CLI non-JSON mencetak diagnostik stderr alih-alih balasan kosong. Untuk pembungkus cron/systemd eksternal, pertahankan penghentian paksa cadangan seperti `timeout -k 60 600 openclaw agent ...` agar pengawas dapat membersihkan proses jika penghentian tidak dapat diselesaikan.
- Ketika perintah ini memicu pembuatan ulang `models.json`, kredensial penyedia yang dikelola SecretRef disimpan sebagai penanda nonrahasia (misalnya nama variabel lingkungan, `secretref-env:ENV_VAR_NAME`, atau `secretref-managed`), bukan teks biasa rahasia yang telah diuraikan. Penulisan penanda berasal dari snapshot konfigurasi sumber aktif, bukan dari nilai rahasia waktu proses yang telah diuraikan.

## Status pengiriman JSON

Dengan `--json --deliver`, respons JSON CLI menyertakan `deliveryStatus` tingkat teratas agar skrip dapat membedakan pengiriman yang terkirim, dibatalkan, gagal sebagian, dan gagal:

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

Respons CLI yang didukung Gateway juga mempertahankan bentuk hasil mentah Gateway di `result.deliveryStatus`.

`deliveryStatus.status` adalah salah satu dari:

| Status           | Arti                                                                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sent`           | Pengiriman selesai.                                                                                                                                                        |
| `suppressed`     | Pengiriman sengaja tidak dilakukan (misalnya hook pengiriman pesan membatalkannya, atau tidak ada hasil yang terlihat). Bersifat terminal, tanpa percobaan ulang.           |
| `partial_failed` | Setidaknya satu muatan terkirim sebelum muatan berikutnya gagal.                                                                                                           |
| `failed`         | Tidak ada pengiriman persisten yang selesai, atau pemeriksaan awal pengiriman gagal.                                                                                       |

Kolom umum:

- `requested`: selalu `true` ketika objek tersedia.
- `attempted`: `true` setelah jalur pengiriman persisten dijalankan; `false` untuk kegagalan pemeriksaan awal atau ketika tidak ada muatan yang terlihat.
- `succeeded`: `true`, `false`, atau `"partial"`; `"partial"` berpasangan dengan `status: "partial_failed"`.
- `reason`: alasan berformat snake-case huruf kecil dari pengiriman persisten atau validasi pemeriksaan awal. Nilai yang diketahui mencakup `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target`, dan `no_delivery_target`; pengiriman persisten yang gagal juga dapat melaporkan tahap yang gagal. Perlakukan nilai yang tidak dikenal sebagai data buram karena kumpulannya dapat bertambah.
- `resultCount`: jumlah hasil pengiriman saluran, jika tersedia.
- `sentBeforeError`: `true` ketika kegagalan sebagian telah mengirim setidaknya satu muatan sebelum terjadi galat.
- `error`: `true` untuk pengiriman yang gagal atau gagal sebagian.
- `errorMessage`: hanya tersedia ketika pesan galat pengiriman yang mendasarinya berhasil direkam. Kegagalan pemeriksaan awal menyertakan `error`/`reason`, tetapi tidak menyertakan `errorMessage`.
- `payloadOutcomes`: hasil opsional per muatan dengan `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError`, atau metadata hook jika tersedia.

## Terkait

- [Referensi CLI](/id/cli)
- [Waktu proses agen](/id/concepts/agent)
