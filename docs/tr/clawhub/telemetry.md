---
read_when:
    - Telemetri / gizlilik kontrolleri üzerinde çalışılıyor
    - Hangi verilerin toplandığına dair sorular
summary: ClawHub CLI tarafından toplanan kurulum telemetrisi ve bundan nasıl çıkılacağı.
x-i18n:
    generated_at: "2026-07-01T15:29:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub, toplam kurulum sayılarını hesaplamak için asgari CLI telemetrisi kullanır.

## Telemetri ne zaman toplanır

Telemetri yalnızca şu durumlarda gönderilir:

- CLI'da oturum açmış olmanız.
- `clawhub install <slug>` çalıştırmanız.
- Telemetrinin **devre dışı bırakılmamış** olması (aşağıdaki “Nasıl devre dışı bırakılır” bölümüne bakın).

Oturum açmadıysanız hiçbir şey raporlanmaz.

## Ne topluyoruz

Raporlanan her `clawhub install` işleminde CLI, en iyi çabayla bir kurulum olayı gönderir.

Olay şunları içerir:

- `slug`: kurulan skill slug'ı.
- `version`: bilindiğinde kurulan sürüm.

### Neleri _toplamıyoruz_

- Klasör yolları veya klasörden türetilmiş tanımlayıcılar yok.
- Dosya içerikleri yok.
- Çalıştırma başına günlükler, istemler veya başka CLI çıktıları yok.

## Kurulum sayıları

ClawHub, skill başına toplam sayaçlar tutar:

- `installsAllTime`: skill için en az bir CLI kurulumu raporlamış benzersiz kullanıcılar.
- `installsCurrent`: kurulum raporlamış ve telemetrisini silmemiş benzersiz kullanıcılar.

## Şeffaflık + kullanıcı kontrolleri

Herkes yalnızca **toplanmış kurulum sayaçlarını** görür.

Hesabınızı silmek telemetri verilerinizi de siler.

## Telemetri nasıl devre dışı bırakılır

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayar yapıldığında CLI kurulum telemetrisi göndermez.
