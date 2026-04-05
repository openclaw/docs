---
read_when:
    - Genel günlük düzeylerini yükseltmeden hedefli hata ayıklama günlüklerine ihtiyacınız var
    - Destek için alt sistemlere özgü günlükleri yakalamanız gerekiyor
summary: Hedefli hata ayıklama günlükleri için tanılama bayrakları
title: Tanılama Bayrakları
x-i18n:
    generated_at: "2026-04-05T13:52:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: daf0eca0e6bd1cbc2c400b2e94e1698709a96b9cdba1a8cf00bd580a61829124
    source_path: diagnostics/flags.md
    workflow: 15
---

# Tanılama Bayrakları

Tanılama bayrakları, her yerde ayrıntılı günlüklemeyi açmadan hedefli hata ayıklama günlüklerini etkinleştirmenizi sağlar. Bayraklar isteğe bağlıdır ve bir alt sistem bunları denetlemediği sürece etkileri olmaz.

## Nasıl çalışır

- Bayraklar dizelerdir (büyük/küçük harfe duyarsız).
- Bayrakları yapılandırmada veya bir env geçersiz kılmasıyla etkinleştirebilirsiniz.
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

Birden çok bayrak:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Bayrakları değiştirdikten sonra gateway'i yeniden başlatın.

## Env geçersiz kılması (tek seferlik)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Tüm bayrakları devre dışı bırakma:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Günlükler nereye gider

Bayraklar günlükleri standart tanılama günlük dosyasına yazar. Varsayılan olarak:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file` ayarlarsanız bunun yerine o yolu kullanın. Günlükler JSONL biçimindedir (satır başına bir JSON nesnesi). Sansürleme, `logging.redactSensitive` temelinde yine de uygulanır.

## Günlükleri ayıklama

En son günlük dosyasını seçin:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP tanılama günlükleri için filtreleme:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Veya yeniden üretirken takip edin:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Uzak gateway'ler için `openclaw logs --follow` da kullanabilirsiniz (bkz. [/cli/logs](/cli/logs)).

## Notlar

- `logging.level`, `warn` değerinden daha yüksek bir değere ayarlanmışsa bu günlükler bastırılabilir. Varsayılan `info` uygundur.
- Bayrakları etkin bırakmak güvenlidir; yalnızca belirli alt sistem için günlük hacmini etkilerler.
- Günlük hedeflerini, düzeyleri ve sansürlemeyi değiştirmek için [/logging](/logging) kullanın.
