---
read_when:
    - Anda ingin menjalankan satu giliran agen dari skrip (opsional mengirimkan balasan)
summary: Referensi CLI untuk `openclaw agent` (kirim satu giliran agen melalui Gateway)
title: Agen
x-i18n:
    generated_at: "2026-04-30T09:37:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: b77668949040933c5281f2f183e48cc2593d09252470483b9ae38dcffd13d071
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Jalankan giliran agen melalui Gateway (gunakan `--local` untuk mode tertanam).
Gunakan `--agent <id>` untuk menargetkan agen yang dikonfigurasi secara langsung.

Berikan setidaknya satu pemilih sesi:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Terkait:

- Alat pengiriman agen: [Pengiriman agen](/id/tools/agent-send)

## Opsi

- `-m, --message <text>`: isi pesan yang wajib ada
- `-t, --to <dest>`: penerima yang digunakan untuk menurunkan kunci sesi
- `--session-id <id>`: id sesi eksplisit
- `--agent <id>`: id agen; menimpa pengikatan perutean
- `--model <id>`: penimpaan model untuk eksekusi ini (`provider/model` atau id model)
- `--thinking <level>`: tingkat berpikir agen (`off`, `minimal`, `low`, `medium`, `high`, ditambah tingkat khusus yang didukung penyedia seperti `xhigh`, `adaptive`, atau `max`)
- `--verbose <on|off>`: simpan tingkat verbose untuk sesi
- `--channel <channel>`: kanal pengiriman; hilangkan untuk menggunakan kanal sesi utama
- `--reply-to <target>`: penimpaan target pengiriman
- `--reply-channel <channel>`: penimpaan kanal pengiriman
- `--reply-account <id>`: penimpaan akun pengiriman
- `--local`: jalankan agen tertanam secara langsung (setelah pramuat registry plugin)
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

- Mode Gateway beralih ke agen tertanam ketika permintaan Gateway gagal. Gunakan `--local` untuk memaksa eksekusi tertanam sejak awal.
- `--local` tetap memuat registry plugin terlebih dahulu, sehingga penyedia, alat, dan kanal yang disediakan plugin tetap tersedia selama eksekusi tertanam.
- `--local` dan eksekusi fallback tertanam diperlakukan sebagai eksekusi sekali jalan. Resource loopback MCP terbundel dan sesi stdio Claude hangat yang dibuka untuk proses lokal tersebut dihentikan setelah balasan, sehingga pemanggilan berskrip tidak membuat proses turunan lokal tetap hidup.
- Eksekusi yang didukung Gateway membiarkan resource loopback MCP milik Gateway berada di bawah proses Gateway yang sedang berjalan; klien lama mungkin masih mengirim flag pembersihan historis, tetapi Gateway menerimanya sebagai no-op kompatibilitas.
- `--channel`, `--reply-channel`, dan `--reply-account` memengaruhi pengiriman balasan, bukan perutean sesi.
- `--json` menjaga stdout khusus untuk respons JSON. Diagnostik Gateway, plugin, dan fallback tertanam diarahkan ke stderr sehingga skrip dapat mengurai stdout secara langsung.
- JSON fallback tertanam menyertakan `meta.transport: "embedded"` dan `meta.fallbackFrom: "gateway"` sehingga skrip dapat membedakan eksekusi fallback dari eksekusi Gateway.
- Jika Gateway menerima eksekusi agen tetapi CLI kehabisan waktu saat menunggu balasan akhir, fallback tertanam menggunakan id sesi/eksekusi eksplisit baru `gateway-fallback-*` dan melaporkan `meta.fallbackReason: "gateway_timeout"` beserta kolom sesi fallback. Ini menghindari perlombaan dengan kunci transkrip milik Gateway atau penggantian diam-diam atas sesi percakapan asli yang telah dirutekan.
- Ketika perintah ini memicu regenerasi `models.json`, kredensial penyedia yang dikelola SecretRef disimpan sebagai penanda non-rahasia (misalnya nama variabel env, `secretref-env:ENV_VAR_NAME`, atau `secretref-managed`), bukan plaintext rahasia yang di-resolve.
- Penulisan penanda bersifat otoritatif sumber: OpenClaw menyimpan penanda dari snapshot konfigurasi sumber aktif, bukan dari nilai rahasia runtime yang telah di-resolve.

## Terkait

- [Referensi CLI](/id/cli)
- [Runtime agen](/id/concepts/agent)
