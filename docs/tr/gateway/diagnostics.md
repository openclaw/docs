---
read_when:
    - Bir hata raporu veya destek isteği hazırlama
    - Gateway çökmeleri, yeniden başlatmalar, bellek baskısı veya aşırı büyük yükler için hata ayıklama
    - Hangi tanılama verilerinin kaydedildiğini veya redakte edildiğini gözden geçirme
summary: Hata raporları için paylaşılabilir Gateway tanılama paketleri oluşturun
title: Tanılama dışa aktarımı
x-i18n:
    generated_at: "2026-04-24T09:08:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3773b623a3f94a1f1340f2d278d9f5236f18fbf9aa38f84ec9ddbe41aea44e8c
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw, hata raporlarına güvenle eklenebilecek yerel bir tanılama zip'i oluşturabilir.
Bu dosya temizlenmiş Gateway durumu, sağlık, günlükler, yapılandırma şekli ve
yakın tarihli yük içermeyen kararlılık olaylarını birleştirir.

## Hızlı başlangıç

```bash
openclaw gateway diagnostics export
```

Komut, yazılan zip yolunu yazdırır. Bir yol seçmek için:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Otomasyon için:

```bash
openclaw gateway diagnostics export --json
```

## Dışa aktarılanların içeriği

Zip şunları içerir:

- `summary.md`: destek için insan tarafından okunabilir genel bakış.
- `diagnostics.json`: yapılandırma, günlükler, durum, sağlık
  ve kararlılık verilerinin makine tarafından okunabilir özeti.
- `manifest.json`: dışa aktarma meta verileri ve dosya listesi.
- Temizlenmiş yapılandırma şekli ve gizli olmayan yapılandırma ayrıntıları.
- Temizlenmiş günlük özetleri ve yakın tarihli redakte edilmiş günlük satırları.
- En iyi çabayla alınmış Gateway durum ve sağlık anlık görüntüleri.
- `stability/latest.json`: varsa en yeni kalıcı kararlılık paketi.

Gateway sağlıksız olsa bile dışa aktarma yararlıdır. Gateway
durum veya sağlık isteklerine yanıt veremiyorsa, yerel günlükler, yapılandırma şekli ve en son
kararlılık paketi yine de mevcutsa toplanır.

## Gizlilik modeli

Tanılamalar paylaşılabilir olacak şekilde tasarlanmıştır. Dışa aktarma, hata ayıklamaya yardımcı olan
operasyonel verileri korur; örneğin:

- alt sistem adları, Plugin kimlikleri, sağlayıcı kimlikleri, kanal kimlikleri ve yapılandırılmış modlar
- durum kodları, süreler, bayt sayıları, kuyruk durumu ve bellek okumaları
- temizlenmiş günlük meta verileri ve redakte edilmiş operasyonel mesajlar
- yapılandırma şekli ve gizli olmayan özellik ayarları

Dışa aktarma şunları atlar veya redakte eder:

- sohbet metni, istemler, talimatlar, Webhook gövdeleri ve araç çıktıları
- kimlik bilgileri, API anahtarları, token'lar, çerezler ve gizli değerler
- ham istek veya yanıt gövdeleri
- hesap kimlikleri, mesaj kimlikleri, ham oturum kimlikleri, ana makine adları ve yerel kullanıcı adları

Bir günlük mesajı kullanıcı, sohbet, istem veya araç yük metnine benziyorsa,
dışa aktarma yalnızca bir mesajın atlandığını ve bayt sayısını korur.

## Kararlılık kaydedicisi

Gateway, tanılamalar etkin olduğunda varsayılan olarak sınırlı, yük içermeyen bir kararlılık akışı kaydeder.
Bu içerik için değil, operasyonel gerçekler içindir.

Canlı kaydediciyi inceleyin:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Ölümcül çıkış, kapanma zaman aşımı veya yeniden başlatma başlangıç hatasından sonra
en yeni kalıcı kararlılık paketini inceleyin:

```bash
openclaw gateway stability --bundle latest
```

En yeni kalıcı paketten bir tanılama zip'i oluşturun:

```bash
openclaw gateway stability --bundle latest --export
```

Kalıcı paketler, olay varsa `~/.openclaw/logs/stability/` altında bulunur.

## Yararlı seçenekler

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: belirli bir zip yoluna yaz.
- `--log-lines <count>`: eklenecek en fazla temizlenmiş günlük satırı sayısı.
- `--log-bytes <bytes>`: incelenecek en fazla günlük baytı.
- `--url <url>`: durum ve sağlık anlık görüntüleri için Gateway WebSocket URL'si.
- `--token <token>`: durum ve sağlık anlık görüntüleri için Gateway token'ı.
- `--password <password>`: durum ve sağlık anlık görüntüleri için Gateway parolası.
- `--timeout <ms>`: durum ve sağlık anlık görüntüsü zaman aşımı.
- `--no-stability-bundle`: kalıcı kararlılık paketi aramasını atla.
- `--json`: makine tarafından okunabilir dışa aktarma meta verilerini yazdır.

## Tanılamaları devre dışı bırakma

Tanılamalar varsayılan olarak etkindir. Kararlılık kaydedicisini ve
tanılama olay toplamasını devre dışı bırakmak için:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Tanılamaları devre dışı bırakmak hata raporu ayrıntısını azaltır. Normal
Gateway günlük kaydını etkilemez.

## İlgili belgeler

- [Sağlık Denetimleri](/tr/gateway/health)
- [Gateway CLI](/tr/cli/gateway#gateway-diagnostics-export)
- [Gateway Protokolü](/tr/gateway/protocol#system-and-identity)
- [Günlükleme](/tr/logging)
