---
read_when:
    - Telemetri / gizlilik kontrolleri üzerinde çalışılıyor
    - Toplanan verilerle ilgili sorular
summary: ClawHub CLI tarafından toplanan kurulum telemetrisi ve bundan nasıl çıkılacağı.
x-i18n:
    generated_at: "2026-07-03T02:56:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub, toplam kurulum sayılarını hesaplamak için minimal CLI telemetrisi kullanır.

## Telemetri ne zaman toplanır

Telemetri yalnızca şu durumlarda gönderilir:

- CLI'da oturum açmışsınızdır.
- `clawhub install <slug>` komutunu çalıştırırsınız.
- Telemetri **devre dışı bırakılmamıştır** (aşağıdaki “Devre dışı bırakma” bölümüne bakın).

Oturum açmadıysanız hiçbir şey bildirilmez.

## Ne topluyoruz

Bildirilen her `clawhub install` için CLI, en iyi çabayla bir kurulum olayı gönderir.

Olay şunları içerir:

- `slug`: kurulan becerinin slug değeri.
- `version`: bilindiğinde kurulan sürüm.

### Neleri _toplamıyoruz_

- Klasör yolları veya klasörden türetilmiş tanımlayıcılar yoktur.
- Dosya içerikleri yoktur.
- Çalıştırma başına günlükler, istemler veya diğer CLI çıktıları yoktur.

## Kurulum sayıları

ClawHub, beceri başına toplam sayaçlar tutar:

- `installsAllTime`: beceri için en az bir CLI kurulumu bildirmiş benzersiz kullanıcılar.
- `installsCurrent`: kurulum bildirmiş ve telemetrisini silmemiş benzersiz kullanıcılar.

## Şeffaflık + kullanıcı kontrolleri

Herkes yalnızca **toplu kurulum sayaçlarını** görür.

Hesabınızı silmek telemetri verilerinizi de siler.

## Telemetriyi devre dışı bırakma

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayar etkinleştirildiğinde CLI kurulum telemetrisi göndermez.
