---
read_when:
    - Bir hata raporu veya destek isteği hazırlama
    - Gateway çökmelerini, yeniden başlatmaları, bellek baskısını veya aşırı büyük yükleri hata ayıklama
    - Hangi tanılama verilerinin kaydedildiğini veya sansürlendiğini inceleme
summary: Hata raporları için paylaşılabilir Gateway tanılama paketleri oluşturun
title: Tanılama dışa aktarma
x-i18n:
    generated_at: "2026-04-26T11:28:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64866d929ed42f8484aa7c153e3056bad7b594d9e02705c095b7005f3094ec36
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw, hata raporlarına eklemek için güvenli olan yerel bir tanılama zip'i oluşturabilir. Bu paket; temizlenmiş Gateway durumu, sağlık bilgisi, günlükler, yapılandırma şekli ve son yük içermeyen kararlılık olaylarını birleştirir.

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

## Dışa aktarmanın içerdiği veriler

Zip şunları içerir:

- `summary.md`: destek için insan tarafından okunabilir genel bakış.
- `diagnostics.json`: yapılandırma, günlükler, durum, sağlık
  ve kararlılık verilerinin makine tarafından okunabilir özeti.
- `manifest.json`: dışa aktarma meta verileri ve dosya listesi.
- Temizlenmiş yapılandırma şekli ve gizli olmayan yapılandırma ayrıntıları.
- Temizlenmiş günlük özetleri ve son sansürlenmiş günlük satırları.
- En iyi çabayla alınmış Gateway durum ve sağlık anlık görüntüleri.
- `stability/latest.json`: varsa en yeni kalıcı kararlılık paketi.

Dışa aktarma, Gateway sağlıksız olduğunda bile kullanışlıdır. Gateway,
durum veya sağlık isteklerine yanıt veremiyorsa, yerel günlükler, yapılandırma şekli ve en yeni
kararlılık paketi mevcutsa yine de toplanır.

## Gizlilik modeli

Tanılamalar paylaşılabilir olacak şekilde tasarlanmıştır. Dışa aktarma, hata ayıklamaya yardımcı olan şu operasyonel verileri korur:

- alt sistem adları, Plugin kimlikleri, sağlayıcı kimlikleri, kanal kimlikleri ve yapılandırılmış modlar
- durum kodları, süreler, bayt sayıları, kuyruk durumu ve bellek ölçümleri
- temizlenmiş günlük meta verileri ve sansürlenmiş operasyonel mesajlar
- yapılandırma şekli ve gizli olmayan özellik ayarları

Dışa aktarma şu verileri çıkarır veya sansürler:

- sohbet metni, istemler, talimatlar, Webhook gövdeleri ve araç çıktıları
- kimlik bilgileri, API anahtarları, token'lar, çerezler ve gizli değerler
- ham istek veya yanıt gövdeleri
- hesap kimlikleri, mesaj kimlikleri, ham oturum kimlikleri, ana bilgisayar adları ve yerel kullanıcı adları

Bir günlük mesajı kullanıcı, sohbet, istem veya araç yükü metni gibi görünüyorsa, dışa aktarma yalnızca bir mesajın çıkarıldığını ve bayt sayısını korur.

## Kararlılık kaydedicisi

Gateway, tanılama etkin olduğunda varsayılan olarak sınırlı, yük içermeyen bir kararlılık akışı kaydeder. Bu içerik için değil, operasyonel gerçekler içindir.

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

Kalıcı paketler, olaylar mevcut olduğunda `~/.openclaw/logs/stability/` altında bulunur.

## Yararlı seçenekler

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: belirli bir zip yoluna yazar.
- `--log-lines <count>`: dahil edilecek en fazla temizlenmiş günlük satırı sayısı.
- `--log-bytes <bytes>`: incelenecek en fazla günlük baytı.
- `--url <url>`: durum ve sağlık anlık görüntüleri için Gateway WebSocket URL'si.
- `--token <token>`: durum ve sağlık anlık görüntüleri için Gateway token'ı.
- `--password <password>`: durum ve sağlık anlık görüntüleri için Gateway parolası.
- `--timeout <ms>`: durum ve sağlık anlık görüntüsü zaman aşımı.
- `--no-stability-bundle`: kalıcı kararlılık paketi aramasını atlar.
- `--json`: makine tarafından okunabilir dışa aktarma meta verilerini yazdırır.

## Tanılamayı devre dışı bırakma

Tanılamalar varsayılan olarak etkindir. Kararlılık kaydedicisini ve
tanılama olayı toplamayı devre dışı bırakmak için:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Tanılamayı devre dışı bırakmak hata raporu ayrıntılarını azaltır. Bu, normal
Gateway günlük kaydını etkilemez.

## İlgili

- [Sağlık kontrolleri](/tr/gateway/health)
- [Gateway CLI](/tr/cli/gateway#gateway-diagnostics-export)
- [Gateway protokolü](/tr/gateway/protocol#system-and-identity)
- [Günlükleme](/tr/logging)
- [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry) — tanılamaları bir toplayıcıya akıtmak için ayrı akış
