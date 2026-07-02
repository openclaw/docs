---
read_when:
    - Telemetri / gizlilik denetimleri üzerinde çalışılıyor
    - Hangi verilerin toplandığıyla ilgili sorular
summary: ClawHub CLI tarafından toplanan kurulum telemetrisi ve nasıl devre dışı bırakılacağı.
x-i18n:
    generated_at: "2026-07-02T17:45:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub, toplu yükleme sayılarını hesaplamak için minimum CLI telemetrisi kullanır.

## Telemetri ne zaman toplanır

Telemetri yalnızca şu durumlarda gönderilir:

- CLI'de oturum açmış olmanız.
- `clawhub install <slug>` komutunu çalıştırmanız.
- Telemetrinin **devre dışı bırakılmamış** olması (aşağıdaki “Nasıl devre dışı bırakılır” bölümüne bakın).

Oturum açmadıysanız hiçbir şey bildirilmez.

## Ne topluyoruz

Bildirilen her `clawhub install` işleminde CLI, en iyi çabayla bir yükleme olayı gönderir.

Olay şunları içerir:

- `slug`: yüklenen skill slug'ı.
- `version`: biliniyorsa yüklenen sürüm.

### Neleri _toplamıyoruz_

- Klasör yolları veya klasörden türetilmiş tanımlayıcılar yok.
- Dosya içerikleri yok.
- Çalıştırma başına günlükler, istemler veya başka CLI çıktıları yok.

## Yükleme sayıları

ClawHub, skill başına toplu sayaçlar tutar:

- `installsAllTime`: skill için en az bir CLI yüklemesi bildirmiş benzersiz kullanıcılar.
- `installsCurrent`: yükleme bildirmiş ve telemetrisini silmemiş benzersiz kullanıcılar.

## Şeffaflık + kullanıcı denetimleri

Herkes yalnızca **toplu yükleme sayaçlarını** görür.

Hesabınızı silmek telemetri verilerinizi de siler.

## Telemetri nasıl devre dışı bırakılır

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayar etkinken CLI yükleme telemetrisi göndermez.
