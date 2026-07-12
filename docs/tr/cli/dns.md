---
read_when:
    - Tailscale + CoreDNS aracılığıyla geniş alan keşfi (DNS-SD) istiyorsunuz
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns` için CLI referansı (geniş alan keşif yardımcıları)'
title: DNS
x-i18n:
    generated_at: "2026-07-12T12:08:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

Geniş alan keşfi için DNS yardımcıları (Tailscale + CoreDNS). Şu anda yalnızca macOS + Homebrew CoreDNS desteklenir.

İlgili:

- Gateway keşfi: [Keşif](/tr/gateway/discovery)
- Geniş alan keşfi yapılandırması: [Yapılandırma](/tr/gateway/configuration)

## `dns setup`

Tek noktaya yayın DNS-SD keşfi için CoreDNS kurulumunu planlayın veya uygulayın.

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| Seçenek             | Etki                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `--domain <domain>` | Geniş alan keşif alan adı (örneğin `openclaw.internal`).                                                |
| `--apply`           | CoreDNS yapılandırmasını kurar/günceller ve hizmeti (yeniden) başlatır. sudo gerektirir, yalnızca macOS. |

`--domain` olmadan OpenClaw, yapılandırmadaki `discovery.wideArea.domain` değerini kullanır.

`--apply` olmadan komut yalnızca şunları yazdırır:

- Çözümlenen keşif alan adı ve bölge dosyası yolu
- Geçerli tailnet IP'leri
- Önerilen `openclaw.json` keşif yapılandırması
- Tailscale yönetici konsolunda ayarlanacak Tailscale Split DNS ad sunucusu/alan adı değerleri

`--apply` ile (yalnızca macOS, Homebrew CoreDNS gerektirir):

- Eksikse bölge dosyasını ilk kullanıma hazırlar
- Eksikse CoreDNS içe aktarma bölümünü ekler
- `coredns` brew hizmetini yeniden başlatır

## İlgili

- [CLI başvurusu](/tr/cli)
- [Keşif](/tr/gateway/discovery)
