---
read_when:
    - Genel günlükleme düzeylerini yükseltmeden hedefe yönelik hata ayıklama günlüklerine ihtiyacınız var
    - Destek için alt sisteme özgü günlükleri yakalamanız gerekir
summary: Hedefli hata ayıklama günlükleri için tanılama bayrakları
title: Tanılama bayrakları
x-i18n:
    generated_at: "2026-06-28T00:32:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c78c5c2f90fb1d601d0a3ef94919310759d58c9f9c70a093c91f31594bc777fb
    source_path: diagnostics/flags.md
    workflow: 16
---

Tanılama bayrakları, her yerde ayrıntılı günlüklemeyi açmadan hedefli hata ayıklama günlüklerini etkinleştirmenizi sağlar. Bayraklar isteğe bağlıdır ve bir alt sistem onları denetlemediği sürece etkili olmaz.

## Nasıl çalışır

- Bayraklar dizelerdir (büyük/küçük harfe duyarsız).
- Bayrakları yapılandırmada veya bir ortam geçersiz kılmasıyla etkinleştirebilirsiniz.
- Joker karakterler desteklenir:
  - `telegram.*`, `telegram.http` ile eşleşir
  - `*` tüm bayrakları etkinleştirir

## Yapılandırma üzerinden etkinleştirme

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

## Ortam geçersiz kılması (tek seferlik)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Tüm bayrakları devre dışı bırakın:

```bash
OPENCLAW_DIAGNOSTICS=0
```

`OPENCLAW_DIAGNOSTICS=0`, süreç düzeyinde bir devre dışı bırakma geçersiz kılmasıdır: o süreç için hem ortamdan hem de yapılandırmadan gelen
bayrakları devre dışı bırakır.

## Profil oluşturma bayrakları

Profil oluşturucu bayrakları, genel günlükleme düzeylerini yükseltmeden hedefli zamanlama aralıklarını etkinleştirir. Varsayılan olarak devre dışıdırlar.

Tek bir Gateway çalıştırması için profil oluşturucu tarafından denetlenen tüm aralıkları etkinleştirin:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Yalnızca yanıt gönderimi profil oluşturucu aralıklarını etkinleştirin:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Yalnızca Codex uygulama sunucusu başlatma/araç/iş parçacığı profil oluşturucu aralıklarını etkinleştirin:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

Profil oluşturucu bayraklarını yapılandırmadan etkinleştirin:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Yapılandırma bayraklarını değiştirdikten sonra Gateway'i yeniden başlatın. Bir profil oluşturucu bayrağını devre dışı bırakmak için
onu `diagnostics.flags` içinden kaldırın ve yeniden başlatın. Yapılandırma profil oluşturucu bayraklarını etkinleştirmiş olsa bile tüm
tanılama bayraklarını geçici olarak devre dışı bırakmak için süreci şu şekilde başlatın:

```bash
OPENCLAW_DIAGNOSTICS=0 openclaw gateway run
```

## Zaman çizelgesi yapıtları

`timeline` bayrağı, harici QA test altyapıları için yapılandırılmış başlatma ve çalışma zamanı zamanlama olayları yazar:

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

Zaman çizelgesi dosya yolu yine
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` üzerinden gelir. `timeline` yalnızca
yapılandırmadan etkinleştirildiğinde, OpenClaw yapılandırmayı henüz okumamış olduğu için en erken yapılandırma yükleme aralıkları yayılmaz; sonraki başlatma aralıkları yapılandırma bayrağını kullanır.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` ve
`OPENCLAW_DIAGNOSTICS=*` de tüm tanılama bayraklarını etkinleştirdikleri için zaman çizelgesini etkinleştirir. Yalnızca JSONL zamanlama yapıtını istiyorsanız `timeline` tercih edin.

Zaman çizelgesi kayıtları `openclaw.diagnostics.v1` zarfını kullanır. Olaylar
süreç kimliklerini, aşama adlarını, aralık adlarını, süreleri, Plugin kimliklerini, bağımlılık sayılarını,
olay döngüsü gecikme örneklerini, sağlayıcı işlem adlarını, alt süreç çıkış durumunu
ve başlatma hatası adlarını/iletilerini içerebilir. Zaman çizelgesi dosyalarını yerel tanılama
yapıtları olarak ele alın; makinenizin dışında paylaşmadan önce gözden geçirin.

## Günlükler nereye gider

Bayraklar günlükleri standart tanılama günlük dosyasına yayar. Varsayılan olarak:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file` ayarlarsanız bunun yerine o yolu kullanın. Günlükler JSONL biçimindedir (satır başına bir JSON nesnesi). Redaksiyon yine `logging.redactSensitive` temelinde uygulanır.

## Günlükleri çıkarma

En son günlük dosyasını seçin:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP tanılamaları için filtreleyin:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Brave Search HTTP tanılamaları için filtreleyin:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Veya yeniden üretirken takip edin:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Uzak Gateway'ler için `openclaw logs --follow` komutunu da kullanabilirsiniz (bkz. [/cli/logs](/tr/cli/logs)).

## Notlar

- `logging.level`, `warn` değerinden daha yüksek ayarlanırsa bu günlükler bastırılabilir. Varsayılan `info` uygundur.
- `brave.http`, Brave Search istek URL'lerini/sorgu parametrelerini, yanıt durumunu/zamanlamasını ve önbellek isabet/kaçırma/yazma olaylarını günlüğe kaydeder. API anahtarlarını veya yanıt gövdelerini günlüğe kaydetmez, ancak arama sorguları hassas olabilir.
- Bayrakları etkin bırakmak güvenlidir; yalnızca belirli alt sistem için günlük hacmini etkilerler.
- Günlük hedeflerini, düzeylerini ve redaksiyonu değiştirmek için [/logging](/tr/logging) kullanın.

## İlgili

- [Gateway tanılamaları](/tr/gateway/diagnostics)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
