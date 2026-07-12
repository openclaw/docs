---
read_when:
    - OpenClaw ajanlarının her araç şemasını isteme eklemeden geniş bir araç kataloğu kullanmasını istiyorsunuz
    - OpenClaw araçlarının, MCP araçlarının ve istemci araçlarının tek bir kompakt çalışma zamanı yüzeyi üzerinden sunulmasını istiyorsunuz
    - OpenClaw çalıştırmalarında araç keşfini uyguluyor veya hatalarını ayıklıyorsunuz
summary: 'Araç Arama: büyük OpenClaw araç kataloglarını arama, açıklama ve çağırma işlevlerinin ardında kompakt hâle getirin'
title: Araç Arama
x-i18n:
    generated_at: "2026-07-12T12:20:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search, deneysel bir OpenClaw ajan çalışma zamanı özelliğidir. Ajanlara büyük araç kataloglarını keşfetmek ve çağırmak için tek ve kompakt bir yöntem sunar. Çalıştırmada çok sayıda kullanılabilir araç bulunduğunda ancak modelin bunlardan yalnızca birkaçına ihtiyaç duyması muhtemel olduğunda kullanışlıdır.

Bu sayfa OpenClaw Tool Search özelliğini belgeler. Bu, Codex'e özgü araç arama veya dinamik araçlar yüzeyi değildir. Codex'e özgü kod modu, araç arama, ertelenmiş dinamik araçlar ve iç içe araç çağrıları kararlı Codex çalıştırma ortamı yüzeyleridir ve `tools.toolSearch` ayarına bağlı değildir.

OpenClaw çalıştırmaları için etkinleştirildiğinde model, varsayılan olarak bir `tool_search_code` aracının yanı sıra yapılandırılmış sonuçları kompakt köprüden geçemeyen yalnızca doğrudan kullanımlı araçları alır. Kod aracı, `openclaw.tools` köprüsüne sahip yalıtılmış bir Node alt işleminde kısa bir JavaScript gövdesi çalıştırır:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Katalog; kataloğa uygun OpenClaw araçlarını, Plugin araçlarını, MCP araçlarını ve istemci tarafından sağlanan araçları içerebilir. Model, kataloglanan her şemayı başlangıçta görmez. Bunun yerine kompakt tanımlayıcılarda arama yapar, tam şemaya ihtiyaç duyduğunda seçilen bir aracı açıklar ve bu aracı OpenClaw üzerinden çağırır. Yalnızca doğrudan kullanımlı araçlar modele görünür kalır ve kataloğa eklenmez.

Codex çalıştırma ortamı çalıştırmaları bu deneysel OpenClaw Tool Search denetimlerini almaz. OpenClaw, ürün yeteneklerini Codex'e dinamik araçlar olarak aktarır; kararlı yerel kod modu, yerel araç arama, ertelenmiş dinamik araçlar ve iç içe araç çağrıları Codex tarafından yönetilir.

## Bir tur nasıl çalışır?

Planlama sırasında OpenClaw gömülü çalıştırıcısı, çalıştırma için geçerli kataloğu oluşturur:

1. Ajan, profil, korumalı alan ve oturum için etkin araç politikasını çözümler.
2. Uygun OpenClaw ve Plugin araçlarını listeler.
3. Oturumun MCP çalışma zamanı üzerinden uygun MCP araçlarını listeler.
4. Geçerli çalıştırma için sağlanan uygun istemci araçlarını ekler.
5. Yalnızca doğrudan kullanımlı araçları modele görünür tutar ve kalan kataloğa uygun araçlar için kompakt tanımlayıcıları dizine ekler.
6. OpenClaw kod köprüsünü, yapılandırılmış yedek araçları veya kompakt dizin yüzeyini bu yalnızca doğrudan kullanımlı araçlarla birlikte sunar.

Yürütme sırasında her gerçek araç çağrısı OpenClaw'a geri döner. Yalıtılmış Node çalışma zamanı Plugin uygulamalarını, MCP istemci nesnelerini veya gizli bilgileri barındırmaz. `openclaw.tools.call(...)`, köprü üzerinden Gateway'e geri geçer; burada normal politika, onay, kanca, günlük kaydı ve sonuç işleme süreçleri uygulanmaya devam eder.

## Modlar

`tools.toolSearch`, modele yönelik üç moda sahiptir:

- `code`: yalnızca doğrudan kullanımlı araçlarla birlikte varsayılan kompakt JavaScript köprüsü olan `tool_search_code` aracını sunar.
- `tools`: kod almaması gereken sağlayıcılar için `tool_search`, `tool_describe` ve `tool_call` araçlarını yalnızca doğrudan kullanımlı araçlarla birlikte düz yapılandırılmış araçlar olarak sunar.
- `directory`: her tam şema olmadan araç adlarını görmesi gereken sağlayıcılar için `tool_search`, `tool_describe` ve `tool_call` araçlarının yanı sıra kullanılabilir araç adları ile açıklamalarından oluşan sınırlı bir istem dizini sunar. OpenClaw ayrıca geçerli tur için muhtemel veya gerekli araç şemalarından oluşan küçük ve sınırlı bir kümeyi doğrudan sunabilir. Yalnızca doğrudan kullanımlı araçlar bu modda da görünür kalır.

Tüm modlar, politikaya göre filtrelenmiş aynı kataloğu ve normal OpenClaw yürütme yolunu kullanır. `catalogMode: "direct-only"` olarak işaretlenmiş araçlar bu kataloğun dışında kalır ve modele görünür olmaya devam eder. Geçerli çalışma zamanı yalıtılmış Node kod modu alt işlemini başlatamazsa varsayılan `code` modu, katalog Compaction işleminden önce `tools` moduna geri döner. `directory` modunda, istemci tarafından sağlanan araçlar geçerli çalıştırma için doğrudan görünür kalırken OpenClaw araçları, Plugin araçları ve MCP araçları dizin kataloğunun arkasında sıkıştırılabilir. Tam bir gizli dizin adına yapılan doğrudan çağrı, yürütmeden önce aynı yetkilendirilmiş katalogdan yüklenir.

Tüm modlar deneyseldir. Küçük OpenClaw araç katalogları için araçların doğrudan sunulmasını, Codex çalıştırma ortamı çalıştırmaları için ise Codex'e özgü kararlı yüzeyleri tercih edin.

Ayrı bir kaynak seçimi yapılandırması yoktur. Tool Search etkinleştirildiğinde katalog, normal politika filtrelemesinden sonra kataloğa uygun OpenClaw, MCP ve istemci araçlarını içerir; yalnızca doğrudan kullanımlı araçlar ayrı tutulur.

## Bu neden var?

Büyük kataloglar kullanışlı ancak maliyetlidir. Her araç şemasını modele göndermek isteği büyütür, planlamayı yavaşlatır ve yanlışlıkla araç seçme olasılığını artırır.

Tool Search bu yapıyı değiştirir:

- doğrudan araçlar: model, ilk belirteçten önce seçilen her şemayı görür
- Tool Search kod modu: model, tek bir kompakt kod aracını, kısa bir API sözleşmesini ve yalnızca doğrudan kullanımlı araçları görür
- Tool Search araçlar modu: model, üç kompakt yapılandırılmış yedek aracı ve yalnızca doğrudan kullanımlı araçları görür
- Tool Search dizin modu: model, sınırlı bir dizinin yanı sıra arama/açıklama/çağırma denetimlerini, muhtemel veya gerekli şemalardan oluşan küçük ve sınırlı bir kümeyi ve yalnızca doğrudan kullanımlı araçları görür
- tur sırasında: model kalan şemaları gerektiğinde yükleyebilir

Küçük kataloglar için araçların doğrudan sunulması hâlâ doğru varsayılandır. Tool Search, özellikle MCP sunucularından veya istemci tarafından sağlanan uygulama araçlarından gelen çok sayıda aracın tek bir çalıştırmada görülebildiği durumlarda en iyi sonucu verir.

## API

`openclaw.tools.search(query, options?)`

Geçerli çalıştırmanın etkin kataloğunda arama yapar. Sonuçlar kompakttır ve istem bağlamına güvenle geri eklenebilir.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Tam girdi şeması dâhil olmak üzere bir arama sonucunun tüm meta verilerini yükler.

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

Yapılandırılmış yedek mod, aynı işlemleri araçlar olarak sunar:

- `tool_search`
- `tool_describe`
- `tool_call`

Dizin modu şunları sunar:

- `tool_search`
- `tool_describe`
- `tool_call`

Ayrıca istemci tarafından sağlanan araçları ve yalnızca doğrudan kullanımlı tüm araçları doğrudan görünür tutar ve geçerli tur için muhtemel veya gerekli katalog aracı şemalarından oluşan küçük ve sınırlı bir kümeyi doğrudan sunabilir. Sınırlı dizin bazı girdileri içermiyorsa bunları bulmak için `tool_search` kullanın. Model tam bir gizli dizin aracı adını doğrudan isterse OpenClaw, normal yürütmeden önce aracı yetkilendirilmiş katalogdan yükler.
Ertelenmiş tam gönderim bu adları kullandığından, dizin modundaki istemci aracı adları OpenClaw, Plugin veya MCP araç adlarıyla çakışmamalıdır.

## Çalışma zamanı sınırı

Kod köprüsü kısa ömürlü bir Node alt işleminde çalışır. Alt işlem; Node izin modu etkin, ortamı boş, dosya sistemi veya ağ izinleri olmadan ve alt işlem ya da çalışan izinleri bulunmadan başlatılır. OpenClaw, üst işlemde geçen gerçek süre için bir zaman aşımı uygular ve asenkron devam işlemleri sonrasında da dâhil olmak üzere zaman aşımında alt işlemi sonlandırır.

Çalışma zamanı yalnızca şunları sunar:

- `console.log`, `console.warn` ve `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Son çağrılarda normal OpenClaw davranışı uygulanmaya devam eder:

- araç izin ve ret politikaları
- ajan ve korumalı alan başına araç kısıtlamaları
- kanal/çalışma zamanı araç politikası
- onay kancaları
- Plugin `before_tool_call` kancaları
- oturum kimliği, günlükler ve telemetri

## Yapılandırma

OpenClaw çalıştırmalarında Tool Search özelliğini varsayılan kod köprüsüyle etkinleştirin:

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

OpenClaw çalıştırmalarında bunun yerine yapılandırılmış yedek araçları kullanın:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

OpenClaw çalıştırmalarında bunun yerine kompakt dizin yüzeyini kullanın:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Kod modu zaman aşımını ve arama sonucu sınırlarını ayarlayın (gösterilen değerler varsayılanlardır):

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

Çalışma zamanı `codeTimeoutMs` değerini 1000-60000, `maxSearchLimit` değerini 1-50 ve `searchDefaultLimit` değerini 1..`maxSearchLimit` aralığıyla sınırlar.

Devre dışı bırakın:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## İstem ve telemetri

Tool Search, doğrudan araç sunumuyla karşılaştırma yapmaya yetecek kadar telemetri kaydeder:

- çalıştırma ortamına gönderilen serileştirilmiş araç ve istem baytlarının toplamı
- katalog boyutu ve kaynak dağılımı
- arama, açıklama ve çağrı sayıları
- OpenClaw üzerinden yürütülen son araç çağrıları
- seçilen araç kimlikleri ve kaynakları

Oturum günlükleri şu soruların yanıtlanmasını mümkün kılmalıdır:

- model başlangıçta kaç araç şeması gördü?
- kaç arama ve açıklama işlemi gerçekleştirdi?
- son olarak hangi araç çağrıldı?
- sonuç OpenClaw, MCP veya bir istemci aracından mı geldi?

## Uçtan uca doğrulama

QA Lab Gateway senaryosu, OpenClaw çalışma zamanı ile her iki yolu da doğrular:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Büyük bir araç kataloğuna sahip geçici bir sahte Plugin oluşturur, sahte OpenAI sağlayıcısını başlatır, Gateway'i bir kez doğrudan modda ve bir kez Tool Search etkin olarak başlatır, ardından sağlayıcı istek yüklerini ve oturum günlüklerini karşılaştırır.

Regresyon testi şunları doğrular:

1. Doğrudan mod sahte Plugin aracını çağırabilir.
2. Tool Search aynı sahte Plugin aracını çağırabilir.
3. Doğrudan mod, sahte Plugin araç şemalarını sağlayıcıya doğrudan sunar.
4. Tool Search yalnızca kompakt köprüyü ve yalnızca doğrudan kullanımlı araçları sunar.
5. Büyük sahte katalog için Tool Search istek yükü daha küçüktür.
6. Oturum günlükleri beklenen araç çağrısı sayılarını ve köprülenmiş çağrı telemetrisini gösterir.

## Hata davranışı

Tool Search güvenli biçimde kapalı kalmalıdır:

- bir araç etkin politikada değilse arama bu aracı döndürmemelidir
- seçilen bir araç kullanılamaz hâle gelirse `tool_call` başarısız olmalıdır
- politika veya onay yürütmeyi engellerse çağrı sonucu engeli atlamak yerine bu engeli bildirmelidir
- kod köprüsü yalıtılmış bir çalışma zamanı oluşturamıyorsa bu dağıtım için `mode: "tools"` kullanın veya Tool Search özelliğini devre dışı bırakın

## İlgili

- [Araçlar ve Plugin'ler](/tr/tools)
- [Çok ajanlı korumalı alan ve araçlar](/tr/tools/multi-agent-sandbox-tools)
- [Exec aracı](/tr/tools/exec)
- [ACP ajanları kurulumu](/tr/tools/acp-agents-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
