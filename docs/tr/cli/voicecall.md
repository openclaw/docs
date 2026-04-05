---
read_when:
    - Sesli arama eklentisini kullanıyorsanız ve CLI giriş noktalarını istiyorsanız
    - '`voicecall call|continue|status|tail|expose` için hızlı örnekler istediğinizde'
summary: '`openclaw voicecall` için CLI başvurusu (sesli arama eklentisi komut yüzeyi)'
title: voicecall
x-i18n:
    generated_at: "2026-04-05T13:49:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c99e7a3d256e1c74a0f07faba9675cc5a88b1eb2fc6e22993caf3874d4f340a
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall`, eklenti tarafından sağlanan bir komuttur. Yalnızca sesli arama eklentisi kurulu ve etkinse görünür.

Birincil doküman:

- Sesli arama eklentisi: [Voice Call](/plugins/voice-call)

## Yaygın komutlar

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## Webhook'ları açığa çıkarma (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Güvenlik notu: webhook uç noktasını yalnızca güvendiğiniz ağlara açın. Mümkün olduğunda Funnel yerine Tailscale Serve tercih edin.
