---
read_when:
    - Tailscale + CoreDNS üzerinden geniş alan keşfi (DNS-SD) istiyorsunuz
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns` için CLI başvurusu (geniş alan keşif yardımcıları)'
title: dns
x-i18n:
    generated_at: "2026-04-05T13:48:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4831fbb7791adfed5195bc4ba36bb248d2bc8830958334211d3c96f824617927
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

Geniş alan keşfi için DNS yardımcıları (Tailscale + CoreDNS). Şu anda macOS + Homebrew CoreDNS'e odaklanmıştır.

İlgili:

- Gateway discovery: [Discovery](/gateway/discovery)
- Geniş alan keşif yapılandırması: [Configuration](/gateway/configuration)

## Kurulum

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Unicast DNS-SD discovery için CoreDNS kurulumunu planlayın veya uygulayın.

Seçenekler:

- `--domain <domain>`: geniş alan discovery etki alanı (örneğin `openclaw.internal`)
- `--apply`: CoreDNS yapılandırmasını kurun veya güncelleyin ve hizmeti yeniden başlatın (sudo gerektirir; yalnızca macOS)

Gösterdikleri:

- çözümlenen discovery etki alanı
- zone dosyası yolu
- geçerli tailnet IP'leri
- önerilen `openclaw.json` discovery yapılandırması
- ayarlanacak Tailscale Split DNS nameserver/domain değerleri

Notlar:

- `--apply` olmadan, komut yalnızca bir planlama yardımcısıdır ve önerilen kurulumu yazdırır.
- `--domain` atlanırsa, OpenClaw yapılandırmadan `discovery.wideArea.domain` kullanır.
- `--apply` şu anda yalnızca macOS'u destekler ve Homebrew CoreDNS bekler.
- `--apply`, gerekirse zone dosyasını önyükler, CoreDNS import stanza'sının mevcut olmasını sağlar ve `coredns` brew hizmetini yeniden başlatır.
