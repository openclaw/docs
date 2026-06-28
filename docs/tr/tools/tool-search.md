---
read_when:
    - OpenClaw ajanlarının her araç şemasını prompt'a eklemeden büyük bir araç kataloğu kullanmasını istiyorsunuz
    - OpenClaw araçlarının, MCP araçlarının ve istemci araçlarının tek bir kompakt çalışma zamanı yüzeyi üzerinden sunulmasını istiyorsunuz
    - OpenClaw çalıştırmaları için araç keşfini uyguluyor veya hata ayıklıyorsunuz
summary: 'Araç Araması: büyük OpenClaw araç kataloglarını arama, açıklama ve çağırma arkasında kompakt hale getirin'
title: Araç Arama
x-i18n:
    generated_at: "2026-06-28T01:26:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23b46264bab307bbfdfeb1e358c566d498f3bcf77f187ba05d2ae319e115e1f4
    source_path: tools/tool-search.md
    workflow: 16
---

Araç Arama, deneysel bir OpenClaw ajan çalışma zamanı özelliğidir. Ajanlara büyük araç kataloglarını keşfetmek ve çağırmak için tek bir kompakt yol sağlar. Çalıştırmada çok sayıda kullanılabilir araç olduğunda ancak modelin bunlardan yalnızca birkaçına ihtiyaç duyması olası olduğunda kullanışlıdır.

Bu sayfa OpenClaw Araç Arama özelliğini belgeler. Bu, Codex'e özgü araç arama veya dinamik araçlar yüzeyi değildir. Codex'e özgü kod modu, araç arama, ertelenmiş dinamik araçlar ve iç içe araç çağrıları kararlı Codex harness yüzeyleridir ve `tools.toolSearch` öğesine bağlı değildir.

OpenClaw çalıştırmaları için etkinleştirildiğinde, model varsayılan olarak bir `tool_search_code` aracı alır. Bu araç, `openclaw.tools` köprüsüne sahip yalıtılmış bir Node alt sürecinde kısa bir JavaScript gövdesi çalıştırır:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Katalog OpenClaw araçlarını, plugin araçlarını, MCP araçlarını ve istemci tarafından sağlanan araçları içerebilir. Model her tam şemayı en baştan görmez. Bunun yerine kompakt tanımlayıcılarda arama yapar, tam şemaya ihtiyaç duyduğunda seçilen bir aracı açıklar ve bu aracı OpenClaw üzerinden çağırır.

Codex harness çalıştırmaları bu deneysel OpenClaw Araç Arama denetimlerini almaz. OpenClaw ürün yeteneklerini Codex'e dinamik araçlar olarak iletir ve kararlı yerel kod modunun, yerel araç aramanın, ertelenmiş dinamik araçların ve iç içe araç çağrılarının sahibi Codex'tir.

## Bir dönüş nasıl çalışır

Planlama zamanında OpenClaw gömülü çalıştırıcısı, çalıştırma için etkin kataloğu oluşturur:

1. Ajan, profil, sandbox ve oturum için etkin araç politikasını çözümle.
2. Uygun OpenClaw ve plugin araçlarını listele.
3. Oturum MCP çalışma zamanı üzerinden uygun MCP araçlarını listele.
4. Geçerli çalıştırma için sağlanan uygun istemci araçlarını ekle.
5. Arama için kompakt tanımlayıcıları dizine al.
6. OpenClaw kod köprüsünü, yapılandırılmış geri dönüş araçlarını veya kompakt dizin yüzeyini modele sun.

Yürütme zamanında her gerçek araç çağrısı OpenClaw'a döner. Yalıtılmış Node çalışma zamanı plugin uygulamalarını, MCP istemci nesnelerini veya sırları tutmaz. `openclaw.tools.call(...)`, köprüden geçerek Gateway'e geri döner; burada normal politika, onay, hook, günlükleme ve sonuç işleme hâlâ uygulanır.

## Modlar

`tools.toolSearch` modele görünen üç moda sahiptir:

- `code`: varsayılan kompakt JavaScript köprüsü olan `tool_search_code` aracını sunar.
- `tools`: kod almaması gereken sağlayıcılar için `tool_search`, `tool_describe` ve `tool_call` öğelerini düz yapılandırılmış araçlar olarak sunar.
- `directory`: her tam şema olmadan araç adlarını görmesi gereken sağlayıcılar için `tool_search`, `tool_describe` ve `tool_call` ile birlikte kullanılabilir araç adları ve açıklamalarından oluşan sınırlı bir prompt dizini sunar. OpenClaw ayrıca geçerli dönüş için küçük ve sınırlı bir olası veya gerekli araç şeması kümesini doğrudan sunabilir.

Tüm modlar aynı politika ile filtrelenmiş kataloğu ve normal OpenClaw yürütme yolunu kullanır. Geçerli çalışma zamanı yalıtılmış Node kod modu alt sürecini başlatamazsa, varsayılan `code` modu katalog Compaction öncesinde `tools` moduna geri döner. `directory` modunda, istemci tarafından sağlanan araçlar geçerli çalıştırma için doğrudan görünür kalırken OpenClaw araçları, plugin araçları ve MCP araçları dizin kataloğunun arkasında sıkıştırılabilir. Tam bir gizli dizin adına doğrudan çağrı, yürütmeden önce aynı yetkili katalogdan hydrate edilir.

Tüm modlar deneyseldir. Küçük OpenClaw araç katalogları için doğrudan araç sunumunu, Codex harness çalıştırmaları için ise Codex'e özgü kararlı yüzeyleri tercih edin.

Ayrı bir kaynak seçimi yapılandırması yoktur. Araç Arama etkinleştirildiğinde katalog, normal politika filtrelemesinden sonra uygun OpenClaw, MCP ve istemci araçlarını içerir.

## Bu neden var

Büyük kataloglar kullanışlıdır ancak pahalıdır. Her araç şemasını modele göndermek isteği büyütür, planlamayı yavaşlatır ve yanlışlıkla araç seçme olasılığını artırır.

Araç Arama yapıyı değiştirir:

- doğrudan araçlar: model ilk tokenden önce seçilen her şemayı görür
- Araç Arama kod modu: model tek bir kompakt kod aracı ve kısa bir API sözleşmesi görür
- Araç Arama araçlar modu: model üç kompakt yapılandırılmış geri dönüş aracı görür
- Araç Arama dizin modu: model sınırlı bir dizin, search/describe/call denetimleri ve küçük, sınırlı bir olası veya gerekli şema kümesi görür
- dönüş sırasında: model kalan şemaları gerektiğinde yükleyebilir

Küçük kataloglar için doğrudan araç sunumu hâlâ doğru varsayılandır. Araç Arama, özellikle MCP sunucularından veya istemci tarafından sağlanan uygulama araçlarından gelen çok sayıda aracı tek bir çalıştırmanın görebildiği durumlarda en uygunudur.

## API

`openclaw.tools.search(query, options?)`

Geçerli çalıştırma için etkin katalogda arama yapar. Sonuçlar kompakttır ve prompt bağlamına geri koymak için güvenlidir.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Tam girdi şeması dahil olmak üzere tek bir arama sonucu için tam meta verileri yükler.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Seçilen bir aracı OpenClaw üzerinden çağırır.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

Yapılandırılmış geri dönüş modu aynı işlemleri araçlar olarak sunar:

- `tool_search`
- `tool_describe`
- `tool_call`

Dizin modu şunları sunar:

- `tool_search`
- `tool_describe`
- `tool_call`

Ayrıca istemci tarafından sağlanan araçları doğrudan görünür tutar ve geçerli dönüş için küçük, sınırlı bir olası veya gerekli katalog araç şeması kümesini doğrudan sunabilir. Sınırlı dizin girdileri atlıyorsa, bunları bulmak için `tool_search` kullanın. Model tam bir gizli dizin araç adını doğrudan isterse OpenClaw, normal yürütmeden önce bunu yetkili katalogdan hydrate eder.
Dizin modu istemci araç adları OpenClaw, plugin veya MCP araç adlarıyla çakışmamalıdır, çünkü tam ertelenmiş dispatch bu adları kullanır.

## Çalışma zamanı sınırı

Kod köprüsü kısa ömürlü bir Node alt sürecinde çalışır. Alt süreç Node izin modu etkin, boş bir ortam, dosya sistemi veya ağ izni olmadan ve alt süreç ya da worker izni olmadan başlar. OpenClaw bir üst süreç duvar saati zaman aşımı uygular ve async devamlarından sonra dahil olmak üzere zaman aşımında alt süreci sonlandırır.

Çalışma zamanı yalnızca şunları sunar:

- `console.log`, `console.warn` ve `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Son çağrılar için normal OpenClaw davranışı hâlâ geçerlidir:

- araç izin ve reddetme politikaları
- ajan başına ve sandbox başına araç kısıtlamaları
- kanal/çalışma zamanı araç politikası
- onay hook'ları
- plugin `before_tool_call` hook'ları
- oturum kimliği, günlükler ve telemetri

## Yapılandırma

OpenClaw çalıştırmaları için Araç Arama özelliğini varsayılan kod köprüsüyle etkinleştirin:

```bash
openclaw config set tools.toolSearch true
```

Eşdeğer JSON:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

OpenClaw çalıştırmaları için bunun yerine yapılandırılmış geri dönüş araçlarını kullanın:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

OpenClaw çalıştırmaları için bunun yerine kompakt dizin yüzeyini kullanın:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Kod modu zaman aşımını ve arama sonucu sınırlarını ayarlayın:

```json5
{
  tools: {
    toolSearch: {
      mode: "code",
      codeTimeoutMs: 10000,
      searchDefaultLimit: 8,
      maxSearchLimit: 20,
    },
  },
}
```

Devre dışı bırakın:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt ve telemetri

Araç Arama, doğrudan araç sunumuyla karşılaştırmak için yeterli telemetri kaydeder:

- harness'e gönderilen toplam serileştirilmiş araç ve prompt baytları
- katalog boyutu ve kaynak dağılımı
- arama, açıklama ve çağrı sayıları
- OpenClaw üzerinden yürütülen son araç çağrıları
- seçilen araç kimlikleri ve kaynakları

Oturum günlükleri şu soruları yanıtlamayı mümkün kılmalıdır:

- modelin en başta kaç araç şeması gördüğü
- kaç arama ve açıklama işlemi gerçekleştirdiği
- hangi son aracın çağrıldığı
- sonucun OpenClaw, MCP veya bir istemci aracından gelip gelmediği

## E2E doğrulama

Gateway E2E çalıştırıcısı, OpenClaw çalışma zamanı ile her iki yolu da kanıtlar:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Büyük bir araç kataloğuna sahip geçici bir sahte plugin oluşturur, mock OpenAI sağlayıcısını başlatır, Gateway'i bir kez doğrudan modda ve bir kez Araç Arama etkinleştirilmiş olarak başlatır, ardından sağlayıcı istek payload'larını ve oturum günlüklerini karşılaştırır.

Regresyon şunları kanıtlar:

1. Doğrudan mod sahte plugin aracını çağırabilir.
2. Araç Arama aynı sahte plugin aracını çağırabilir.
3. Doğrudan mod sahte plugin araç şemalarını doğrudan sağlayıcıya sunar.
4. Araç Arama yalnızca kompakt köprüyü sunar.
5. Araç Arama istek payload'u büyük sahte katalog için daha küçüktür.
6. Oturum günlükleri beklenen araç çağrısı sayılarını ve köprülenmiş çağrı telemetrisini gösterir.

## Hata davranışı

Araç Arama kapalı yönde hata vermelidir:

- bir araç etkin politikada değilse arama onu döndürmemelidir
- seçilen bir araç kullanılamaz hâle gelirse `tool_call` başarısız olmalıdır
- politika veya onay yürütmeyi engellerse çağrı sonucu, bunu atlamak yerine bu engeli bildirmelidir
- kod köprüsü yalıtılmış bir çalışma zamanı oluşturamıyorsa, bu dağıtım için `mode: "tools"` kullanın veya Araç Arama'yı devre dışı bırakın

## İlgili

- [Araçlar ve plugin'ler](/tr/tools)
- [Çok ajanlı sandbox ve araçlar](/tr/tools/multi-agent-sandbox-tools)
- [Exec aracı](/tr/tools/exec)
- [ACP ajanları kurulumu](/tr/tools/acp-agents-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
