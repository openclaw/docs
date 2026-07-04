---
read_when:
    - 'OpenClaw belgeleri i18n girdisi üzerinde çalışılıyor: telemetri / gizlilik denetimleri'
    - Hangi verilerin toplandığıyla ilgili sorular
summary: ClawHub CLI tarafından toplanan kurulum telemetrisi ve devre dışı bırakma yöntemi.
x-i18n:
    generated_at: "2026-07-04T04:02:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub, toplu kurulum sayılarını hesaplamak için minimum CLI telemetrisi kullanır.

## Telemetrinin toplandığı durumlar

Telemetri yalnızca şu durumlarda gönderilir:

- CLI'da oturum açmış olmanız.
- `clawhub install <slug>` çalıştırmanız.
- Telemetrinin **devre dışı bırakılmamış** olması (aşağıdaki “Nasıl devre dışı bırakılır” bölümüne bakın).

Oturum açmadıysanız hiçbir şey raporlanmaz.

## Neleri topluyoruz

Raporlanan her `clawhub install` için CLI, en iyi çabayla bir kurulum olayı gönderir.

Olay şunları içerir:

- `slug`: kurulan becerinin slug değeri.
- `version`: biliniyorsa kurulan sürüm.

### Neleri _toplamıyoruz_

- Klasör yolları veya klasörden türetilmiş tanımlayıcılar yok.
- Dosya içerikleri yok.
- Çalıştırma başına günlükler, istemler veya diğer CLI çıktıları yok.

## Kurulum sayıları

ClawHub, beceri başına toplu sayaçlar tutar:

- `installsAllTime`: beceri için en az bir CLI kurulumu raporlamış benzersiz kullanıcılar.
- `installsCurrent`: bir kurulum raporlamış ve telemetrisini silmemiş benzersiz kullanıcılar.

## Şeffaflık + kullanıcı kontrolleri

Herkes yalnızca **toplu kurulum sayaçlarını** görür.

Hesabınızı silmek telemetri verilerinizi de siler.

## Telemetri nasıl devre dışı bırakılır

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayar varken CLI kurulum telemetrisi göndermez.
