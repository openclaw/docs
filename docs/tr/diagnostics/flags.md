---
read_when:
    - Genel günlük kaydı düzeylerini yükseltmeden hedefe yönelik hata ayıklama günlüklerine ihtiyacınız var
    - Destek için alt sisteme özgü günlükleri yakalamanız gerekir
summary: Hedefli hata ayıklama günlükleri için tanılama bayrakları
title: Tanılama bayrakları
x-i18n:
    generated_at: "2026-07-12T12:15:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9847f464fde89d9e639b089fe54fb933deb9debad2a6d8b120ab01bacff181a8
    source_path: diagnostics/flags.md
    workflow: 16
---

Tanılama bayrakları, genel olarak `logging.level` düzeyini yükseltmeden tek bir alt sistem için ek günlük kaydını etkinleştirir. Bir alt sistem tarafından denetlenmediği sürece bayrağın hiçbir etkisi olmaz.

## Nasıl çalışır?

- Bayraklar büyük/küçük harfe duyarsız dizelerdir; yapılandırmadaki `diagnostics.flags` ile `OPENCLAW_DIAGNOSTICS` ortam değişkeni geçersiz kılma değerinden çözümlenir, yinelenenler kaldırılır ve küçük harfe dönüştürülür.
- `name.*`, hem `name` değerinin kendisiyle hem de `name.` altındaki her şeyle eşleşir (örneğin `telegram.*`, `telegram.http` ile eşleşir).
- `*` veya `all`, tüm bayrakları etkinleştirir.
- Yapılandırmada `diagnostics.flags` değiştirildikten sonra Gateway'i yeniden başlatın; bu ayar çalışırken yeniden yüklenmez.

## Bilinen bayraklar

| Bayrak           | Etkinleştirdiği                                           |
| ---------------- | --------------------------------------------------------- |
| `telegram.http`  | Telegram Bot API HTTP hata günlükleri                     |
| `brave.http`     | Brave Search istek/yanıt/önbellek günlükleri              |
| `profiler`       | Yanıt aşaması profilleyicisi ve Codex uygulama sunucusu profilleyicisi (ikisi de) |
| `reply.profiler` | Yalnızca yanıt aşaması profilleyicisi                     |
| `codex.profiler` | Yalnızca Codex uygulama sunucusu profilleyicisi           |
| `timeline`       | Yapılandırılmış JSONL zaman çizelgesi yapıtı (aşağıya bakın) |

## Yapılandırma üzerinden etkinleştirme

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
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

## Ortam değişkeniyle geçersiz kılma (tek seferlik)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

Değerler virgül veya boşluklardan bölünür. Özel değerler:

| Değer                       | Etki                                                     |
| --------------------------- | -------------------------------------------------------- |
| `0`, `false`, `off`, `none` | Yapılandırmayı da geçersiz kılarak tüm bayrakları devre dışı bırakır |
| `1`, `true`, `all`, `*`     | Tüm bayrakları etkinleştirir                             |

`OPENCLAW_DIAGNOSTICS=0`, söz konusu işlem için hem ortam değişkeninden hem de yapılandırmadan gelen bayrakları devre dışı bırakır. Bu, dosyayı düzenlemeden yapılandırmada açık bırakılan bir profilleyici bayrağını geçici olarak susturmak için kullanışlıdır.

## Profilleyici bayrakları

Profilleyici bayrakları, düşük maliyetli zamanlama aralıklarını denetler; kapalı olduklarında ek yük oluşturmazlar.

Tek bir Gateway çalıştırmasında profilleyici tarafından denetlenen tüm aralıkları etkinleştirin:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Yalnızca yanıt dağıtımı profilleyici aralıklarını etkinleştirin:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Yalnızca Codex uygulama sunucusunun başlangıç/araç/iş parçacığı profilleyici aralıklarını etkinleştirin:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler`, hem yanıt profilleyicisini hem de Codex profilleyicisini etkinleştirir; yalnızca birini etkinleştirmek için kapsamı belirtilmiş bayrak adlarını kullanın.

Alternatif olarak yapılandırmada ayarlayın:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Yapılandırma bayraklarını değiştirdikten sonra Gateway'i yeniden başlatın. Bir profilleyici bayrağını devre dışı bırakmak için bayrağı `diagnostics.flags` içinden kaldırıp yeniden başlatın veya söz konusu çalıştırmada tüm tanılama bayraklarını geçersiz kılmak için işlemi `OPENCLAW_DIAGNOSTICS=0` ile başlatın.

## Zaman çizelgesi yapıtları

`timeline` bayrağı (`diagnostics.timeline` diğer adı), harici kalite güvencesi düzenekleri için yapılandırılmış başlangıç ve çalışma zamanı zamanlama olaylarını JSONL olarak yazar:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Alternatif olarak yapılandırmada etkinleştirin:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Bayrağın kendisi yapılandırmada ayarlanmış olsa bile çıktı yolu her zaman `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` üzerinden alınır; yol için bir yapılandırma anahtarı yoktur. `timeline` yalnızca yapılandırmadan etkinleştirildiğinde OpenClaw henüz yapılandırmayı okumamış olduğundan en erken yapılandırma yükleme aralıkları eksik olur; sonraki başlangıç aralıkları normal şekilde kaydedilir.

`OPENCLAW_DIAGNOSTICS=1`, `=all` ve `=*` de tüm bayrakları etkinleştirdikleri için zaman çizelgesini etkinleştirir. Yalnızca JSONL yapıtını istiyor, diğer tüm tanılama bayraklarını istemiyorsanız kapsamı belirtilmiş `timeline` bayrağını tercih edin.

Zaman çizelgesindeki olay döngüsü gecikmesi örnekleri için `timeline` dışında bir ek etkinleştirme daha gerekir: zaman çizelgesini etkinleştirmenin yanı sıra `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` (veya `on`/`true`/`yes`) ayarlayın.

Zaman çizelgesi kayıtları `openclaw.diagnostics.v1` zarfını kullanır ve işlem kimliklerini, aşama adlarını, aralık adlarını, süreleri, Plugin kimliklerini, bağımlılık sayılarını, olay döngüsü gecikmesi örneklerini, sağlayıcı işlem adlarını, alt işlem çıkış durumunu ve başlangıç hatası adlarını/iletilerini içerebilir. Zaman çizelgesi dosyalarını yerel tanılama yapıtları olarak değerlendirin; makinenizin dışında paylaşmadan önce inceleyin.

## Günlüklerin konumu

Bayraklar günlükleri standart tanılama günlük dosyasına yazar. Varsayılan olarak:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file` ayarlarsanız bunun yerine o yolu kullanın. Günlükler JSONL biçimindedir (satır başına bir JSON nesnesi). `logging.redactSensitive` ayarına göre gizleme uygulanmaya devam eder. Günlük yolu çözümleme, döndürme ve gizleme modelinin tamamı için [Günlük Kaydı](/tr/logging) bölümüne bakın.

## Günlükleri çıkarma

En son günlük dosyasını seçin:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP tanılamalarını filtreleyin:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Brave Search HTTP tanılamalarını filtreleyin:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Alternatif olarak sorunu yeniden oluştururken günlüğü canlı izleyin:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Uzak Gateway'ler için bunun yerine `openclaw logs --follow` kullanın (bkz. [/cli/logs](/tr/cli/logs)).

## Notlar

- `logging.level`, `warn` düzeyinden daha yüksek bir düzeye ayarlanırsa bayrakla denetlenen günlükler bastırılabilir. Varsayılan `info` uygundur.
- `brave.http`, Brave Search istek URL'lerini/sorgu parametrelerini, yanıt durumunu/zamanlamasını ve önbellek isabeti/ıskalaması/yazma olaylarını günlüğe kaydeder. API anahtarını (istek başlığı olarak gönderilir) veya yanıt gövdelerini günlüğe kaydetmez; ancak arama sorguları hassas olabilir.
- Bayrakları etkin bırakmak güvenlidir; yalnızca ilgili alt sistemin günlük hacmini etkilerler.
- Günlük hedeflerini, düzeylerini ve gizlemeyi değiştirmek için [/logging](/tr/logging) bölümünü kullanın.

## İlgili konular

- [Gateway tanılaması](/tr/gateway/diagnostics)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
