---
read_when:
    - Telemetri / gizlilik denetimleri üzerinde çalışılıyor
    - Hangi verilerin toplandığına ilişkin sorular
summary: ClawHub CLI tarafından toplanan kurulum telemetrisi ve bundan nasıl çıkılacağı.
x-i18n:
    generated_at: "2026-07-03T09:54:43Z"
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

- CLI içinde oturum açmış olmanız.
- `clawhub install <slug>` komutunu çalıştırmanız.
- Telemetrinin **devre dışı bırakılmamış** olması (aşağıdaki “Nasıl devre dışı bırakılır” bölümüne bakın).

Oturum açmadıysanız hiçbir şey bildirilmez.

## Ne topluyoruz

Bildirilen her `clawhub install` işleminde CLI, başarısı garanti edilmeyen tek bir kurulum olayı gönderir.

Olay şunları içerir:

- `slug`: yüklenen skill slug'ı.
- `version`: biliniyorsa yüklenen sürüm.

### Ne _toplamıyoruz_

- Klasör yolları veya klasörden türetilmiş tanımlayıcılar yok.
- Dosya içerikleri yok.
- Çalıştırma başına günlükler, istemler veya başka CLI çıktıları yok.

## Kurulum sayıları

ClawHub, skill başına toplu sayaçlar tutar:

- `installsAllTime`: skill için en az bir CLI kurulumu bildirmiş benzersiz kullanıcılar.
- `installsCurrent`: kurulum bildirmiş ve telemetri verilerini silmemiş benzersiz kullanıcılar.

## Şeffaflık + kullanıcı kontrolleri

Herkes yalnızca **toplu kurulum sayaçlarını** görür.

Hesabınızı silmek telemetri verilerinizi de siler.

## Telemetri nasıl devre dışı bırakılır

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayar yapıldığında CLI kurulum telemetrisi göndermez.
