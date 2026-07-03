---
read_when:
    - Telemetri / gizlilik denetimleri üzerinde çalışılıyor
    - Hangi verilerin toplandığına ilişkin sorular
summary: ClawHub CLI tarafından toplanan kurulum telemetrisi ve bundan nasıl çıkılacağı.
x-i18n:
    generated_at: "2026-07-03T23:40:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub, toplu kurulum sayılarını hesaplamak için asgari CLI telemetrisi kullanır.

## Telemetri ne zaman toplanır

Telemetri yalnızca şu durumlarda gönderilir:

- CLI'da oturum açmışsanız.
- `clawhub install <slug>` komutunu çalıştırırsanız.
- Telemetri **devre dışı bırakılmamışsa** (aşağıdaki “Nasıl devre dışı bırakılır” bölümüne bakın).

Oturum açmadıysanız hiçbir şey raporlanmaz.

## Neleri topluyoruz

Raporlanan her `clawhub install` için CLI, en iyi çabayla bir kurulum olayı gönderir.

Olay şunları içerir:

- `slug`: kurulan skill slug'ı.
- `version`: biliniyorsa kurulan sürüm.

### Neleri _toplamıyoruz_

- Klasör yolu veya klasörden türetilmiş tanımlayıcı yoktur.
- Dosya içeriği yoktur.
- Çalıştırma başına günlük, prompt veya başka CLI çıktısı yoktur.

## Kurulum sayıları

ClawHub, skill başına toplu sayaçlar tutar:

- `installsAllTime`: skill için en az bir CLI kurulumu raporlamış benzersiz kullanıcılar.
- `installsCurrent`: kurulum raporlamış ve telemetrisini silmemiş benzersiz kullanıcılar.

## Şeffaflık + kullanıcı kontrolleri

Herkes yalnızca **toplu kurulum sayaçlarını** görür.

Hesabınızı silmek telemetri verilerinizi de siler.

## Telemetri nasıl devre dışı bırakılır

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayar yapıldığında CLI kurulum telemetrisi göndermez.
