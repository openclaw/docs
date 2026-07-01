---
read_when:
    - Telemetri / gizlilik kontrolleri üzerinde çalışılıyor
    - Toplanan verilerle ilgili sorular
summary: ClawHub CLI tarafından toplanan kurulum telemetrisi ve nasıl devre dışı bırakılacağı.
x-i18n:
    generated_at: "2026-07-01T20:33:46Z"
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

- CLI içinde oturum açmış olmanız.
- `clawhub install <slug>` komutunu çalıştırmanız.
- Telemetrinin **devre dışı bırakılmamış** olması (aşağıdaki “Nasıl devre dışı bırakılır” bölümüne bakın).

Oturum açmadıysanız hiçbir şey raporlanmaz.

## Ne topluyoruz

Raporlanan her `clawhub install` işleminde CLI, en iyi çabayla bir kurulum olayı gönderir.

Olay şunları içerir:

- `slug`: kurulan skill slug değeri.
- `version`: bilindiğinde kurulan sürüm.

### Neleri _toplamıyoruz_

- Klasör yolları veya klasörden türetilmiş tanımlayıcılar yoktur.
- Dosya içerikleri yoktur.
- Çalıştırma bazında günlükler, istemler veya başka CLI çıktısı yoktur.

## Kurulum sayıları

ClawHub, skill başına toplu sayaçlar tutar:

- `installsAllTime`: skill için en az bir CLI kurulumu raporlamış benzersiz kullanıcılar.
- `installsCurrent`: kurulum raporlamış ve telemetrilerini silmemiş benzersiz kullanıcılar.

## Şeffaflık + kullanıcı kontrolleri

Herkes yalnızca **toplu kurulum sayaçlarını** görür.

Hesabınızı silmek telemetri verilerinizi de siler.

## Telemetri nasıl devre dışı bırakılır

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayar etkin olduğunda CLI kurulum telemetrisi göndermez.
