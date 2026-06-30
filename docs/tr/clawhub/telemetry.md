---
read_when:
    - Telemetri / gizlilik denetimleri üzerinde çalışıyor
    - Hangi verilerin toplandığına ilişkin sorular
summary: ClawHub CLI tarafından toplanan yükleme telemetrisi ve bundan nasıl çıkılacağı.
x-i18n:
    generated_at: "2026-06-30T14:22:08Z"
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
- `clawhub install <slug>` çalıştırırsanız.
- Telemetri **devre dışı bırakılmamışsa** (aşağıdaki “Devre dışı bırakma” bölümüne bakın).

Oturum açmadıysanız hiçbir şey raporlanmaz.

## Ne topluyoruz

Raporlanan her `clawhub install` işleminde CLI, en iyi çabayla bir kurulum olayı gönderir.

Olay şunları içerir:

- `slug`: kurulan skill slug'ı.
- `version`: biliniyorsa kurulan sürüm.

### Neleri _toplamıyoruz_

- Klasör yolları veya klasörden türetilmiş tanımlayıcılar yoktur.
- Dosya içerikleri yoktur.
- Çalıştırma başına günlükler, istemler veya diğer CLI çıktıları yoktur.

## Kurulum sayıları

ClawHub, beceri başına toplu sayaçlar tutar:

- `installsAllTime`: beceri için en az bir CLI kurulumu raporlamış benzersiz kullanıcılar.
- `installsCurrent`: bir kurulum raporlamış ve telemetrisini silmemiş benzersiz kullanıcılar.

## Şeffaflık + kullanıcı kontrolleri

Herkes yalnızca **toplu kurulum sayaçlarını** görür.

Hesabınızı silmek, telemetri verilerinizi de siler.

## Telemetriyi devre dışı bırakma

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu ayar etkin olduğunda CLI kurulum telemetrisi göndermez.
