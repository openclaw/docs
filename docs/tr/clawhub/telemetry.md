---
read_when:
    - Telemetri / gizlilik kontrolleri üzerinde çalışma
    - Toplanan veriler hakkında sorular
summary: ClawHub CLI tarafından toplanan kurulum telemetrisi ve bundan nasıl çıkılacağı.
x-i18n:
    generated_at: "2026-06-28T07:42:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub, toplu kurulum sayılarını hesaplamak için minimum CLI telemetrisi kullanır.

## Telemetri ne zaman toplanır

Telemetri yalnızca şu durumlarda gönderilir:

- CLI’da oturum açmışsınızdır.
- `clawhub install <slug>` komutunu çalıştırırsınız.
- Telemetri **devre dışı bırakılmamıştır** (aşağıdaki “Nasıl devre dışı bırakılır” bölümüne bakın).

Oturum açmadıysanız hiçbir şey raporlanmaz.

## Ne topluyoruz

Raporlanan her `clawhub install` işleminde CLI, en iyi çaba esasına dayalı bir kurulum olayı gönderir.

Olay şunları içerir:

- `slug`: kurulan skill slug’ı.
- `version`: biliniyorsa kurulan sürüm.

### Neleri _toplamıyoruz_

- Klasör yolları veya klasörden türetilmiş tanımlayıcılar yoktur.
- Dosya içerikleri yoktur.
- Çalıştırma başına günlükler, istemler veya diğer CLI çıktıları yoktur.

## Kurulum sayıları

ClawHub, skill başına toplu sayaçlar tutar:

- `installsAllTime`: Skill için en az bir CLI kurulumu raporlamış benzersiz kullanıcılar.
- `installsCurrent`: Bir kurulum raporlamış ve telemetrisini silmemiş benzersiz kullanıcılar.

## Şeffaflık + kullanıcı denetimleri

Herkes yalnızca **toplu kurulum sayaçlarını** görür.

Hesabınızı silmek telemetri verilerinizi de siler.

## Telemetri nasıl devre dışı bırakılır

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayar yapıldığında CLI kurulum telemetrisi göndermez.
