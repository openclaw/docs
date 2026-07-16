---
read_when:
    - Telemetri / gizlilik denetimleri üzerinde çalışılıyor
    - Hangi verilerin toplandığına ilişkin sorular
summary: ClawHub CLI tarafından toplanan yükleme telemetrisi ve bundan nasıl vazgeçileceği.
x-i18n:
    generated_at: "2026-07-16T17:13:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub, toplu kurulum sayılarını hesaplamak için minimum düzeyde CLI telemetrisi kullanır.

## Telemetri ne zaman toplanır?

Telemetri yalnızca şu durumlarda gönderilir:

- CLI'da oturum açmış olmanız.
- `clawhub install <slug>` çalıştırmanız.
- Telemetrinin **devre dışı bırakılmamış** olması (aşağıdaki “Devre dışı bırakma” bölümüne bakın).

Oturum açmadıysanız hiçbir veri bildirilmez.

## Neleri topluyoruz?

Bildirilen her `clawhub install` işleminde CLI, teslim edilmesi garanti edilmeyen tek bir kurulum olayı gönderir.

Olay şunları içerir:

- `slug`: yüklenen skill'in kısa adı.
- `version`: biliniyorsa yüklenen sürüm.

### Neleri _toplamıyoruz_?

- Klasör yolları veya klasörlerden türetilen tanımlayıcılar.
- Dosya içerikleri.
- Çalıştırma bazında günlükler, istemler veya diğer CLI çıktıları.

## Kurulum sayıları

ClawHub, her skill için toplu sayaçlar tutar:

- `installsAllTime`: skill için en az bir CLI kurulumu bildiren benzersiz kullanıcılar.
- `installsCurrent`: bir kurulum bildiren ve telemetri verilerini silmemiş benzersiz kullanıcılar.

## Şeffaflık ve kullanıcı denetimleri

Herkes yalnızca **toplu kurulum sayaçlarını** görür.

Hesabınızı silmeniz telemetri verilerinizi de siler.

## Telemetriyi devre dışı bırakma

Ortam değişkenini ayarlayın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Bu değişken ayarlandığında CLI, kurulum telemetrisi göndermez.
