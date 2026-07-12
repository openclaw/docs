---
read_when:
    - Telemetri / gizlilik denetimleri üzerinde çalışma
    - Hangi verilerin toplandığına ilişkin sorular
summary: ClawHub CLI tarafından toplanan kurulum telemetrisi ve bunun nasıl devre dışı bırakılacağı.
x-i18n:
    generated_at: "2026-07-12T12:09:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub, toplam yükleme sayılarını hesaplamak için asgari düzeyde CLI telemetrisi kullanır.

## Telemetri ne zaman toplanır?

Telemetri yalnızca şu durumlarda gönderilir:

- CLI'da oturum açmış olmanız.
- `clawhub install <slug>` komutunu çalıştırmanız.
- Telemetrinin **devre dışı bırakılmamış** olması (aşağıdaki “Nasıl devre dışı bırakılır?” bölümüne bakın).

Oturum açmadıysanız hiçbir bilgi bildirilmez.

## Neleri topluyoruz?

CLI, bildirilen her `clawhub install` işlemi için teslim garantisi olmadan bir yükleme olayı gönderir.

Olay şunları içerir:

- `slug`: Yüklenen skill'in kısa adı.
- `version`: Biliniyorsa yüklenen sürüm.

### Neleri _toplamıyoruz_?

- Klasör yolları veya klasörlerden türetilen tanımlayıcılar.
- Dosya içerikleri.
- Çalıştırma başına günlükler, istemler veya diğer CLI çıktıları.

## Yükleme sayıları

ClawHub, her skill için toplu sayaçlar tutar:

- `installsAllTime`: Skill için en az bir CLI yüklemesi bildirmiş benzersiz kullanıcılar.
- `installsCurrent`: Bir yükleme bildirmiş ve telemetri verilerini silmemiş benzersiz kullanıcılar.

## Şeffaflık + kullanıcı denetimleri

Herkes yalnızca **toplu yükleme sayaçlarını** görür.

Hesabınızı silmeniz telemetri verilerinizi de siler.

## Telemetri nasıl devre dışı bırakılır?

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayar etkinken CLI, yükleme telemetrisi göndermez.
