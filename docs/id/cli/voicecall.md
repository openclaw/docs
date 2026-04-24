---
read_when:
    - Anda menggunakan Plugin voice-call dan menginginkan entry point CLI
    - Anda menginginkan contoh cepat untuk `voicecall call|continue|dtmf|status|tail|expose`
summary: Referensi CLI untuk `openclaw voicecall` (permukaan perintah Plugin voice-call)
title: Voicecall
x-i18n:
    generated_at: "2026-04-24T09:03:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03773f46d1c9ab407a9734cb2bbe13d2a36bf0da8e6c9c68c18c05e285912c88
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` adalah perintah yang disediakan Plugin. Perintah ini hanya muncul jika Plugin voice-call terinstal dan diaktifkan.

Dokumen utama:

- Plugin voice-call: [Voice Call](/id/plugins/voice-call)

## Perintah umum

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

## Mengekspos Webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Catatan keamanan: hanya ekspos endpoint Webhook ke jaringan yang Anda percayai. Jika memungkinkan, pilih Tailscale Serve daripada Funnel.

## Terkait

- [Referensi CLI](/id/cli)
- [Plugin voice-call](/id/plugins/voice-call)
