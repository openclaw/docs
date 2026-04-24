---
read_when:
    - Tailscale + CoreDNS aracılığıyla geniş alan keşfi (DNS-SD) istiyorsunuz
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns` için CLI başvurusu (geniş alan keşif yardımcıları)'
title: DNS
x-i18n:
    generated_at: "2026-04-24T09:02:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99dcf7c8c76833784a2b712b02f9e40c6c0548c37c9743a89b9d650fe503d385
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

Geniş alan keşfi için DNS yardımcıları (Tailscale + CoreDNS). Şu anda macOS + Homebrew CoreDNS odaklıdır.

İlgili:

- Gateway keşfi: [Discovery](/tr/gateway/discovery)
- Geniş alan keşfi yapılandırması: [Configuration](/tr/gateway/configuration)

## Kurulum

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Unicast DNS-SD keşfi için CoreDNS kurulumunu planlayın veya uygulayın.

Seçenekler:

- `--domain <domain>`: geniş alan keşfi etki alanı (örneğin `openclaw.internal`)
- `--apply`: CoreDNS yapılandırmasını kur veya güncelle ve hizmeti yeniden başlat (sudo gerektirir; yalnızca macOS)

Gösterdikleri:

- çözümlenen keşif etki alanı
- zone dosya yolu
- geçerli tailnet IP'leri
- önerilen `openclaw.json` keşif yapılandırması
- ayarlanacak Tailscale Split DNS nameserver/domain değerleri

Notlar:

- `--apply` olmadan komut yalnızca bir planlama yardımcısıdır ve önerilen kurulumu yazdırır.
- `--domain` atlanırsa OpenClaw yapılandırmadan `discovery.wideArea.domain` değerini kullanır.
- `--apply` şu anda yalnızca macOS'u destekler ve Homebrew CoreDNS bekler.
- `--apply`, gerekirse zone dosyasını bootstrap eder, CoreDNS import stanza'sının mevcut olmasını sağlar ve `coredns` brew hizmetini yeniden başlatır.

## İlgili

- [CLI reference](/tr/cli)
- [Discovery](/tr/gateway/discovery)
