---
read_when:
    - Anda menggunakan plugin panggilan suara dan menginginkan entry point CLI-nya
    - Anda menginginkan contoh cepat untuk `voicecall call|continue|status|tail|expose`
summary: Referensi CLI untuk `openclaw voicecall` (permukaan perintah plugin panggilan suara)
title: voicecall
x-i18n:
    generated_at: "2026-04-05T13:49:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c99e7a3d256e1c74a0f07faba9675cc5a88b1eb2fc6e22993caf3874d4f340a
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` adalah perintah yang disediakan plugin. Perintah ini hanya muncul jika plugin panggilan suara terpasang dan diaktifkan.

Dokumen utama:

- Plugin panggilan suara: [Voice Call](/plugins/voice-call)

## Perintah umum

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## Mengekspos webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Catatan keamanan: hanya ekspos endpoint webhook ke jaringan yang Anda percayai. Sebaiknya gunakan Tailscale Serve daripada Funnel jika memungkinkan.
