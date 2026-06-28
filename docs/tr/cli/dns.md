---
read_when:
    - Tailscale + CoreDNS aracılığıyla geniş alan keşfi (DNS-SD) istiyorsunuz
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns` için CLI referansı (geniş alan keşif yardımcıları)'
title: DNS
x-i18n:
    generated_at: "2026-05-06T09:04:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 460bdcbaa2c0c0fc1a4f5bdd76b904d8ac35195a25324c66421abfdc2044bb07
    source_path: cli/dns.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw dns`

Geniş alan keşfi için DNS yardımcıları (Tailscale + CoreDNS). Şu anda macOS + Homebrew CoreDNS odaklıdır.

İlgili:

- Gateway keşfi: [Keşif](/tr/gateway/discovery)
- Geniş alan keşfi yapılandırması: [Yapılandırma](/tr/gateway/configuration)

## Kurulum

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Unicast DNS-SD keşfi için CoreDNS kurulumunu planlayın veya uygulayın.

Seçenekler:

- `--domain <domain>`: geniş alan keşfi alan adı (örneğin `openclaw.internal`)
- `--apply`: CoreDNS yapılandırmasını yükle veya güncelle ve hizmeti yeniden başlat (sudo gerektirir; yalnızca macOS)

Gösterdikleri:

- çözümlenen keşif alan adı
- bölge dosyası yolu
- mevcut tailnet IP’leri
- önerilen `openclaw.json` keşif yapılandırması
- ayarlanacak Tailscale Split DNS ad sunucusu/alan adı değerleri

Notlar:

- `--apply` olmadan komut yalnızca bir planlama yardımcısıdır ve önerilen kurulumu yazdırır.
- `--domain` atlanırsa OpenClaw yapılandırmadaki `discovery.wideArea.domain` değerini kullanır.
- `--apply` şu anda yalnızca macOS destekler ve Homebrew CoreDNS bekler.
- `--apply`, gerekirse bölge dosyasını önyükler, CoreDNS içe aktarma bendinin mevcut olmasını sağlar ve `coredns` brew hizmetini yeniden başlatır.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Keşif](/tr/gateway/discovery)
