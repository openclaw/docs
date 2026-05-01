---
read_when:
    - voice-call Plugin'ini kullanıyor ve CLI giriş noktalarını istiyorsunuz
    - '`voicecall setup|smoke|call|continue|dtmf|status|tail|expose` için hızlı örnekler istiyorsunuz'
summary: '`openclaw voicecall` için CLI referansı (voice-call Plugin komut yüzeyi)'
title: Sesli arama
x-i18n:
    generated_at: "2026-05-01T09:00:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: c040cf4cd984ad6d6dd302923494a7c8ee131390b803fe20a9894b077f08d5bb
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall`, Plugin tarafından sağlanan bir komuttur. Yalnızca voice-call Plugin'i yüklü ve etkinse görünür.

Gateway çalışırken, operasyonel komutlar (`call`, `start`,
`continue`, `speak`, `dtmf`, `end` ve `status`) o Gateway'in
voice-call runtime'ına gönderilir. Ulaşılabilir bir Gateway yoksa, bağımsız bir
CLI runtime'ına geri dönerler.

Birincil doküman:

- Voice-call Plugin'i: [Sesli Arama](/tr/plugins/voice-call)

## Yaygın komutlar

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

`setup`, varsayılan olarak insanlar tarafından okunabilir hazırlık denetimlerini yazdırır. Script'ler için `--json` kullanın:

```bash
openclaw voicecall setup --json
```

`status`, varsayılan olarak etkin aramaları JSON olarak yazdırır. Tek bir aramayı incelemek için `--call-id <id>` iletin.

Harici sağlayıcılar (`twilio`, `telnyx`, `plivo`) için setup, `publicUrl`, bir tünel veya Tailscale açıklığı üzerinden herkese açık bir
Webhook URL'si çözümlemelidir. Operatörler buna erişemeyeceği için loopback/özel
serve geri dönüşü reddedilir.

`smoke` aynı hazırlık denetimlerini çalıştırır. Hem `--to` hem de `--yes` mevcut değilse gerçek bir telefon araması yapmaz:

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## Webhook'ları açığa çıkarma (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Güvenlik notu: Webhook uç noktasını yalnızca güvendiğiniz ağlara açığa çıkarın. Mümkün olduğunda Funnel yerine Tailscale Serve kullanmayı tercih edin.

## İlgili

- [CLI referansı](/tr/cli)
- [Sesli arama Plugin'i](/tr/plugins/voice-call)
