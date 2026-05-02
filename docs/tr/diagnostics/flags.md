---
read_when:
    - Genel günlükleme düzeylerini yükseltmeden hedefli hata ayıklama günlüklerine ihtiyacınız var
    - Destek için alt sisteme özgü günlükleri yakalamanız gerekir
summary: Hedefli hata ayıklama günlükleri için tanılama bayrakları
title: Tanılama bayrakları
x-i18n:
    generated_at: "2026-05-02T08:53:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1d0ff92d45cf1c5a12a7103ba5b97d656a55a13a7a4f2e86e26ba3a9cfae7687
    source_path: diagnostics/flags.md
    workflow: 16
---

Tanılama bayrakları, her yerde ayrıntılı günlük kaydını açmadan hedeflenmiş hata ayıklama günlüklerini etkinleştirmenizi sağlar. Bayraklar isteğe bağlıdır ve bir alt sistem bunları denetlemediği sürece etkili olmaz.

## Nasıl çalışır?

- Bayraklar dizelerdir (büyük/küçük harfe duyarsız).
- Bayrakları yapılandırmada veya bir ortam değişkeni geçersiz kılmasıyla etkinleştirebilirsiniz.
- Joker karakterler desteklenir:
  - `telegram.*`, `telegram.http` ile eşleşir
  - `*` tüm bayrakları etkinleştirir

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
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

Bayrakları değiştirdikten sonra Gateway'i yeniden başlatın.

## Ortam değişkeni geçersiz kılması (tek seferlik)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Tüm bayrakları devre dışı bırakma:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Zaman çizelgesi artefaktları

`timeline` bayrağı, harici QA donanımları için yapılandırılmış başlangıç ve çalışma zamanı zamanlama olayları yazar:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Bunu yapılandırmada da etkinleştirebilirsiniz:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Zaman çizelgesi dosya yolu yine `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` değerinden gelir. `timeline` yalnızca yapılandırmadan etkinleştirildiğinde, OpenClaw yapılandırmayı henüz okumamış olduğundan en erken yapılandırma yükleme aralıkları yayımlanmaz; sonraki başlangıç aralıkları yapılandırma bayrağını kullanır.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` ve `OPENCLAW_DIAGNOSTICS=*` de her tanılama bayrağını etkinleştirdikleri için zaman çizelgesini etkinleştirir. Yalnızca JSONL zamanlama artefaktını istiyorsanız `timeline` tercih edin.

Zaman çizelgesi kayıtları `openclaw.diagnostics.v1` zarfını kullanır. Olaylar işlem kimlikleri, aşama adları, aralık adları, süreler, Plugin kimlikleri, bağımlılık sayıları, olay döngüsü gecikme örnekleri, sağlayıcı işlem adları, alt işlem çıkış durumu ve başlangıç hatası adları/iletileri içerebilir. Zaman çizelgesi dosyalarını yerel tanılama artefaktları olarak ele alın; makinenizin dışında paylaşmadan önce gözden geçirin.

## Günlükler nereye gider?

Bayraklar, günlükleri standart tanılama günlük dosyasına yazar. Varsayılan olarak:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file` ayarlarsanız bunun yerine o yolu kullanın. Günlükler JSONL biçimindedir (satır başına bir JSON nesnesi). Sansürleme yine `logging.redactSensitive` değerine göre uygulanır.

## Günlükleri çıkarma

En son günlük dosyasını seçin:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP tanılaması için filtreleyin:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Brave Search HTTP tanılaması için filtreleyin:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Veya yeniden üretirken takip edin:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Uzak Gateway'ler için `openclaw logs --follow` da kullanabilirsiniz (bkz. [/cli/logs](/tr/cli/logs)).

## Notlar

- `logging.level`, `warn` değerinden daha yüksek ayarlanmışsa bu günlükler bastırılabilir. Varsayılan `info` uygundur.
- `brave.http`, Brave Search istek URL'lerini/sorgu parametrelerini, yanıt durumunu/zamanlamasını ve önbellek isabet/kaçırma/yazma olaylarını günlüğe kaydeder. API anahtarlarını veya yanıt gövdelerini günlüğe kaydetmez, ancak arama sorguları hassas olabilir.
- Bayrakları etkin bırakmak güvenlidir; yalnızca ilgili alt sistemin günlük hacmini etkilerler.
- Günlük hedeflerini, düzeylerini ve sansürlemeyi değiştirmek için [/logging](/tr/logging) kullanın.

## İlgili

- [Gateway tanılaması](/tr/gateway/diagnostics)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
