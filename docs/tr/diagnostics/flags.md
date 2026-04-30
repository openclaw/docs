---
read_when:
    - Genel günlük kaydı düzeylerini yükseltmeden hedefli hata ayıklama günlüklerine ihtiyacınız var
    - Destek için alt sisteme özgü günlükleri yakalamanız gerekir
summary: Hedefli hata ayıklama günlükleri için tanılama bayrakları
title: Tanılama bayrakları
x-i18n:
    generated_at: "2026-04-30T09:19:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 486051e54c456dedcae5dce59e253add3554d8417660bfc97a75d21fa5fdd6f5
    source_path: diagnostics/flags.md
    workflow: 16
---

Tanılama bayrakları, her yerde ayrıntılı günlüklemeyi açmadan hedefli hata ayıklama günlüklerini etkinleştirmenizi sağlar. Bayraklar isteğe bağlıdır ve bir alt sistem onları denetlemediği sürece etkisi yoktur.

## Nasıl çalışır?

- Bayraklar dizelerdir (büyük/küçük harfe duyarsız).
- Bayrakları yapılandırmada veya bir ortam geçersiz kılmasıyla etkinleştirebilirsiniz.
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
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Bayrakları değiştirdikten sonra Gateway'i yeniden başlatın.

## Ortam geçersiz kılması (tek seferlik)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Tüm bayrakları devre dışı bırakma:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Zaman çizelgesi artefaktları

`timeline` bayrağı, harici QA test düzenekleri için yapılandırılmış başlangıç ve çalışma zamanı zamanlama olayları yazar:

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

Zaman çizelgesi dosya yolu yine `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` üzerinden gelir. `timeline` yalnızca yapılandırmadan etkinleştirildiğinde, OpenClaw yapılandırmayı henüz okumadığı için en erken yapılandırma yükleme aralıkları yayımlanmaz; sonraki başlangıç aralıkları yapılandırma bayrağını kullanır.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` ve `OPENCLAW_DIAGNOSTICS=*` da zaman çizelgesini etkinleştirir çünkü bunlar her tanılama bayrağını etkinleştirir. Yalnızca JSONL zamanlama artefaktını istiyorsanız `timeline` kullanmayı tercih edin.

Zaman çizelgesi kayıtları `openclaw.diagnostics.v1` zarfını kullanır. Olaylar süreç kimliklerini, aşama adlarını, aralık adlarını, süreleri, Plugin kimliklerini, bağımlılık sayılarını, olay döngüsü gecikme örneklerini, sağlayıcı işlem adlarını, alt süreç çıkış durumunu ve başlangıç hata adlarını/iletilerini içerebilir. Zaman çizelgesi dosyalarını yerel tanılama artefaktları olarak değerlendirin; makinenizin dışında paylaşmadan önce gözden geçirin.

## Günlüklerin gittiği yer

Bayraklar, standart tanılama günlük dosyasına günlükler yayar. Varsayılan olarak:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file` ayarlarsanız bunun yerine o yolu kullanın. Günlükler JSONL biçimindedir (satır başına bir JSON nesnesi). Gizleme yine `logging.redactSensitive` temelinde uygulanır.

## Günlükleri ayıklama

En son günlük dosyasını seçin:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP tanılamaları için filtreleyin:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Veya yeniden üretirken takip edin:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Uzak Gateway'ler için `openclaw logs --follow` komutunu da kullanabilirsiniz (bkz. [/cli/logs](/tr/cli/logs)).

## Notlar

- `logging.level`, `warn` değerinden daha yüksek ayarlanırsa bu günlükler bastırılabilir. Varsayılan `info` uygundur.
- Bayrakları etkin bırakmak güvenlidir; yalnızca belirli alt sistemin günlük hacmini etkilerler.
- Günlük hedeflerini, düzeylerini ve gizlemeyi değiştirmek için [/logging](/tr/logging) kullanın.

## İlgili

- [Gateway tanılamaları](/tr/gateway/diagnostics)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
