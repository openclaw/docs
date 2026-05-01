---
read_when:
    - Anda menggunakan Plugin voice-call dan menginginkan titik masuk CLI
    - Anda ingin contoh cepat untuk `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Referensi CLI untuk `openclaw voicecall` (antarmuka perintah Plugin panggilan suara)
title: Panggilan suara
x-i18n:
    generated_at: "2026-05-01T09:23:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: c040cf4cd984ad6d6dd302923494a7c8ee131390b803fe20a9894b077f08d5bb
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` adalah perintah yang disediakan Plugin. Perintah ini hanya muncul jika Plugin panggilan suara diinstal dan diaktifkan.

Saat Gateway berjalan, perintah operasional (`call`, `start`,
`continue`, `speak`, `dtmf`, `end`, dan `status`) dikirim ke runtime
panggilan suara milik Gateway tersebut. Jika tidak ada Gateway yang dapat dijangkau, perintah tersebut menggunakan runtime CLI mandiri sebagai fallback.

Dokumen utama:

- Plugin panggilan suara: [Panggilan Suara](/id/plugins/voice-call)

## Perintah umum

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` secara default mencetak pemeriksaan kesiapan yang mudah dibaca manusia. Gunakan `--json` untuk
skrip:

```bash
openclaw voicecall setup --json
```

`status` secara default mencetak panggilan aktif sebagai JSON. Berikan `--call-id <id>` untuk memeriksa
satu panggilan.

Untuk penyedia eksternal (`twilio`, `telnyx`, `plivo`), setup harus mendapatkan URL
webhook publik dari `publicUrl`, tunnel, atau eksposur Tailscale. Fallback penyajian
loopback/pribadi ditolak karena operator tidak dapat menjangkaunya.

`smoke` menjalankan pemeriksaan kesiapan yang sama. Perintah ini tidak akan melakukan panggilan telepon sungguhan
kecuali `--to` dan `--yes` sama-sama ada:

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## Mengekspos webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Catatan keamanan: hanya ekspos endpoint webhook ke jaringan yang Anda percayai. Utamakan Tailscale Serve daripada Funnel jika memungkinkan.

## Terkait

- [Referensi CLI](/id/cli)
- [Plugin panggilan suara](/id/plugins/voice-call)
