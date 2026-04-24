---
read_when:
    - voice-call Plugin'ini kullanıyorsunuz ve CLI giriş noktalarını istiyorsunuz
    - '`voicecall call|continue|dtmf|status|tail|expose` için hızlı örnekler istiyorsunuz'
summary: '`openclaw voicecall` için CLI başvurusu (voice-call Plugin komut yüzeyi)'
title: Voicecall
x-i18n:
    generated_at: "2026-04-24T09:04:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03773f46d1c9ab407a9734cb2bbe13d2a36bf0da8e6c9c68c18c05e285912c88
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall`, Plugin tarafından sağlanan bir komuttur. Yalnızca voice-call Plugin'i kurulu ve etkinse görünür.

Birincil belge:

- Voice-call Plugin'i: [Voice Call](/tr/plugins/voice-call)

## Yaygın komutlar

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

## Webhook'ları açığa çıkarma (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Güvenlik notu: Webhook uç noktasını yalnızca güvendiğiniz ağlara açın. Mümkün olduğunda Funnel yerine Tailscale Serve tercih edin.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Voice call Plugin'i](/tr/plugins/voice-call)
