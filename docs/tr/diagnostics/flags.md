---
read_when:
    - Genel günlük düzeylerini yükseltmeden hedefli hata ayıklama günlüklerine ihtiyacınız var
    - Destek için alt sistemlere özgü günlükleri yakalamanız gerekiyor
summary: Hedefli hata ayıklama günlükleri için tanılama bayrakları
title: Tanılama bayrakları
x-i18n:
    generated_at: "2026-04-24T09:07:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7e5ec9c5e28ef51f1e617baf62412897df8096f227a74d86a0824e269aafd9d
    source_path: diagnostics/flags.md
    workflow: 15
---

Tanılama bayrakları, her yerde ayrıntılı günlüklemeyi açmadan hedefli hata ayıklama günlüklerini etkinleştirmenizi sağlar. Bayraklar katılımlıdır ve bir alt sistem bunları denetlemedikçe etkisi olmaz.

## Nasıl çalışır

- Bayraklar dizgedir (büyük/küçük harf duyarsız).
- Bayrakları yapılandırmada veya bir ortam değişkeni geçersiz kılmasıyla etkinleştirebilirsiniz.
- Joker karakterler desteklenir:
  - `telegram.*`, `telegram.http` ile eşleşir
  - `*`, tüm bayrakları etkinleştirir

## Yapılandırma ile etkinleştirme

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Birden fazla bayrak:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Bayrakları değiştirdikten sonra Gateway’i yeniden başlatın.

## Ortam değişkeni geçersiz kılması (tek seferlik)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Tüm bayrakları devre dışı bırakma:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Günlüklerin gittiği yer

Bayraklar standart tanılama günlük dosyasına günlük üretir. Varsayılan olarak:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file` ayarlarsanız bunun yerine o yolu kullanın. Günlükler JSONL biçimindedir (satır başına bir JSON nesnesi). `logging.redactSensitive` temelinde sansürleme yine uygulanır.

## Günlükleri ayıklama

En son günlük dosyasını seçin:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP tanılama günlükleri için filtreleyin:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Veya yeniden üretirken takip edin:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Uzak Gateway’ler için `openclaw logs --follow` da kullanabilirsiniz (bkz. [/cli/logs](/tr/cli/logs)).

## Notlar

- `logging.level`, `warn` düzeyinden yüksek ayarlanmışsa bu günlükler bastırılabilir. Varsayılan `info` uygundur.
- Bayrakları etkin bırakmak güvenlidir; yalnızca belirli alt sistem için günlük hacmini etkilerler.
- Günlük hedeflerini, düzeyleri ve sansürlemeyi değiştirmek için [/logging](/tr/logging) kullanın.

## İlgili

- [Gateway tanılamaları](/tr/gateway/diagnostics)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
