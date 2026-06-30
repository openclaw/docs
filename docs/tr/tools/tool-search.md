---
read_when:
    - OpenClaw ajanlarının her araç şemasını isteme eklemeden büyük bir araç kataloğu kullanmasını istiyorsunuz
    - OpenClaw araçlarının, MCP araçlarının ve istemci araçlarının tek bir kompakt çalışma zamanı yüzeyi üzerinden sunulmasını istiyorsunuz
    - OpenClaw çalıştırmaları için araç keşfini uyguluyor veya hata ayıklıyorsunuz
summary: 'Araç Arama: büyük OpenClaw araç kataloglarını arama, açıklama ve çağrı arkasında sıkıştır'
title: Araç Arama
x-i18n:
    generated_at: "2026-06-30T14:24:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81036277d763be8040526b42c116b2e503589921a58b3f765ff38670554a751c
    source_path: tools/tool-search.md
    workflow: 16
---

Araç Arama, deneysel bir OpenClaw ajan çalışma zamanı özelliğidir. Ajanlara büyük araç kataloglarını keşfetmek ve çağırmak için tek ve
kompakt bir yol sunar. Çalıştırmada çok sayıda kullanılabilir araç olduğunda, ancak modelin bunlardan yalnızca birkaçına ihtiyaç duyması muhtemel olduğunda kullanışlıdır.

Bu sayfa OpenClaw Araç Arama'yı belgeler. Bu, Codex'e özgü araç
arama veya dinamik araçlar yüzeyi değildir. Codex'e özgü kod modu, araç arama, ertelenmiş
dinamik araçlar ve iç içe araç çağrıları kararlı Codex harness yüzeyleridir ve
`tools.toolSearch` değerine bağlı değildir.

OpenClaw çalıştırmaları için etkinleştirildiğinde, model varsayılan olarak bir `tool_search_code` aracı
alır. Bu araç, `openclaw.tools` köprüsü bulunan yalıtılmış bir Node
alt sürecinde kısa bir JavaScript gövdesi çalıştırır:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Katalog OpenClaw araçlarını, Plugin araçlarını, MCP araçlarını ve
istemci tarafından sağlanan araçları içerebilir. Model her tam şemayı baştan görmez.
Bunun yerine kompakt tanımlayıcılarda arama yapar, kesin şemaya ihtiyaç duyduğunda
seçilen bir aracı açıklar ve bu aracı OpenClaw üzerinden çağırır.

Codex harness çalıştırmaları bu deneysel OpenClaw Araç Arama
kontrollerini almaz. OpenClaw ürün kabiliyetlerini Codex'e dinamik araçlar olarak iletir ve
kararlı yerel kod modu, yerel araç arama, ertelenmiş dinamik
araçlar ve iç içe araç çağrıları Codex'e aittir.

## Bir dönüş nasıl çalışır

Planlama sırasında OpenClaw gömülü çalıştırıcısı, çalıştırma için geçerli kataloğu oluşturur:

1. Ajan, profil, sandbox ve oturum için etkin araç politikasını çözümle.
2. Uygun OpenClaw ve Plugin araçlarını listele.
3. Oturum MCP çalışma zamanı üzerinden uygun MCP araçlarını listele.
4. Geçerli çalıştırma için sağlanan uygun istemci araçlarını ekle.
5. Arama için kompakt tanımlayıcıları dizine ekle.
6. OpenClaw kod köprüsünü, yapılandırılmış yedek araçları veya
   kompakt dizin yüzeyini modele aç.

Yürütme sırasında her gerçek araç çağrısı OpenClaw'a döner. Yalıtılmış Node
çalışma zamanı Plugin uygulamalarını, MCP istemci nesnelerini veya gizli değerleri tutmaz.
`openclaw.tools.call(...)`, köprü üzerinden Gateway'e geri geçer; burada
normal politika, onay, hook, günlükleme ve sonuç işleme hâlâ uygulanır.

## Modlar

`tools.toolSearch` modele görünen üç moda sahiptir:

- `code`: varsayılan kompakt JavaScript köprüsü olan `tool_search_code` aracını açar.
- `tools`: kod almaması gereken sağlayıcılar için `tool_search`, `tool_describe` ve `tool_call` değerlerini düz
  yapılandırılmış araçlar olarak açar.
- `directory`: her tam şema olmadan araç adlarını görmesi gereken sağlayıcılar için
  `tool_search`, `tool_describe` ve `tool_call` değerlerinin yanı sıra
  kullanılabilir araç adları ve açıklamalarından oluşan sınırlı bir istem dizini açar. OpenClaw,
  geçerli dönüş için muhtemel veya gerekli araç şemalarından oluşan küçük ve sınırlı bir kümeyi de
  doğrudan açabilir.

Tüm modlar aynı politika filtreli kataloğu ve normal OpenClaw yürütme
yolunu kullanır. Geçerli çalışma zamanı yalıtılmış Node kod modu alt
sürecini başlatamazsa, varsayılan `code` modu katalog
Compaction öncesinde `tools` moduna geri döner. `directory` modunda, istemci tarafından sağlanan araçlar
geçerli çalıştırma için doğrudan görünür kalırken OpenClaw araçları, Plugin araçları ve MCP araçları
dizin kataloğunun arkasında sıkıştırılabilir. Kesin bir gizli
dizin adına yapılan doğrudan çağrı, yürütme öncesinde aynı yetkilendirilmiş katalogdan doldurulur.

Tüm modlar deneyseldir. Küçük OpenClaw araç katalogları için doğrudan araç
açmayı, Codex harness çalıştırmaları için ise Codex'e özgü kararlı yüzeyleri tercih edin.

Ayrı bir kaynak seçimi yapılandırması yoktur. Araç Arama etkinleştirildiğinde,
katalog normal politika filtrelemesinden sonra uygun OpenClaw, MCP ve istemci araçlarını içerir.

## Bu neden var

Büyük kataloglar kullanışlıdır ama maliyetlidir. Her araç şemasını modele göndermek
isteği büyütür, planlamayı yavaşlatır ve yanlışlıkla araç
seçimi olasılığını artırır.

Araç Arama biçimi değiştirir:

- doğrudan araçlar: model ilk belirteçten önce seçilen her şemayı görür
- Araç Arama kod modu: model tek bir kompakt kod aracı ve kısa bir API
  sözleşmesi görür
- Araç Arama araçlar modu: model üç kompakt yapılandırılmış yedek
  araç görür
- Araç Arama dizin modu: model sınırlı bir dizin ile
  arama/açıklama/çağrı kontrollerini ve muhtemel ya da gerekli
  şemalardan oluşan küçük ve sınırlı bir kümeyi görür
- dönüş sırasında: model kalan şemaları gerektiğinde yükleyebilir

Küçük kataloglar için doğru varsayılan hâlâ doğrudan araç açmadır. Araç Arama,
özellikle MCP sunucularından veya istemci tarafından sağlanan uygulama araçlarından gelen birçok aracı
tek bir çalıştırmanın görebildiği durumlarda en uygundur.

## API

`openclaw.tools.search(query, options?)`

Geçerli çalıştırma için geçerli katalogda arama yapar. Sonuçlar kompakttır ve
istem bağlamına geri koymak için güvenlidir.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Kesin girdi şeması dahil olmak üzere bir arama sonucu için tam metaveriyi yükler.

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

Yapılandırılmış yedek mod, aynı işlemleri araçlar olarak açar:

- `tool_search`
- `tool_describe`
- `tool_call`

Dizin modu şunları açar:

- `tool_search`
- `tool_describe`
- `tool_call`

Ayrıca istemci tarafından sağlanan araçları doğrudan görünür tutar ve geçerli
dönüş için muhtemel veya gerekli katalog araç şemalarından oluşan küçük ve
sınırlı bir kümeyi doğrudan açabilir. Sınırlı dizin girdileri atlıyorsa, bunları bulmak için `tool_search` kullanın. Model
kesin bir gizli dizin araç adını doğrudan isterse OpenClaw,
normal yürütme öncesinde bunu yetkilendirilmiş katalogdan doldurur.
Dizin modu istemci araç adları OpenClaw, Plugin veya MCP
araç adlarıyla çakışmamalıdır; çünkü kesin ertelenmiş dağıtım bu adları kullanır.

## Çalışma zamanı sınırı

Kod köprüsü kısa ömürlü bir Node alt sürecinde çalışır. Alt süreç,
Node izin modu etkin, boş bir ortam, dosya sistemi veya
ağ izni olmadan ve alt süreç ya da worker izni olmadan başlar. OpenClaw,
üst süreç duvar saati zaman aşımını uygular ve zaman aşımında, async devamları sonrasında dahil,
alt süreci sonlandırır.

Çalışma zamanı yalnızca şunları açar:

- `console.log`, `console.warn` ve `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Son çağrılara normal OpenClaw davranışı hâlâ uygulanır:

- araç izin verme ve reddetme politikaları
- ajan başına ve sandbox başına araç kısıtlamaları
- kanal/çalışma zamanı araç politikası
- onay hook'ları
- Plugin `before_tool_call` hook'ları
- oturum kimliği, günlükler ve telemetri

## Yapılandırma

OpenClaw çalıştırmaları için varsayılan kod köprüsüyle Araç Arama'yı etkinleştirin:

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

OpenClaw çalıştırmaları için bunun yerine yapılandırılmış yedek araçları kullanın:

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

## İstem ve telemetri

Araç Arama, doğrudan araç açma ile karşılaştırmaya yetecek kadar telemetri kaydeder:

- harness'a gönderilen toplam serileştirilmiş araç ve istem baytları
- katalog boyutu ve kaynak dağılımı
- arama, açıklama ve çağrı sayıları
- OpenClaw üzerinden yürütülen son araç çağrıları
- seçilen araç kimlikleri ve kaynakları

Oturum günlükleri şu soruları yanıtlamayı mümkün kılmalıdır:

- modelin baştan kaç araç şeması gördüğü
- kaç arama ve açıklama işlemi gerçekleştirdiği
- hangi son aracın çağrıldığı
- sonucun OpenClaw, MCP veya istemci aracından gelip gelmediği

## E2E doğrulama

QA Lab Gateway senaryosu, OpenClaw çalışma zamanı ile iki yolu da kanıtlar:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Büyük bir araç kataloğu olan geçici bir sahte Plugin oluşturur, sahte
OpenAI sağlayıcısını başlatır, Gateway'i bir kez doğrudan modda ve bir kez Araç Arama
etkin olarak başlatır, ardından sağlayıcı istek yüklerini ve oturum günlüklerini karşılaştırır.

Regresyon şunları kanıtlar:

1. Doğrudan mod sahte Plugin aracını çağırabilir.
2. Araç Arama aynı sahte Plugin aracını çağırabilir.
3. Doğrudan mod sahte Plugin araç şemalarını sağlayıcıya doğrudan açar.
4. Araç Arama yalnızca kompakt köprüyü açar.
5. Büyük sahte katalog için Araç Arama istek yükü daha küçüktür.
6. Oturum günlükleri beklenen araç çağrısı sayılarını ve köprülenmiş çağrı telemetrisini gösterir.

## Hata davranışı

Araç Arama kapalı başarısız olmalıdır:

- bir araç geçerli politikada değilse arama onu döndürmemelidir
- seçilen bir araç kullanılamaz hâle gelirse `tool_call` başarısız olmalıdır
- politika veya onay yürütmeyi engellerse çağrı sonucu, bunu atlatmak yerine
  bu engeli bildirmelidir
- kod köprüsü yalıtılmış bir çalışma zamanı oluşturamazsa, bu dağıtım için `mode: "tools"` kullanın veya
  Araç Arama'yı devre dışı bırakın

## İlgili

- [Araçlar ve Plugin'ler](/tr/tools)
- [Çok ajanlı sandbox ve araçlar](/tr/tools/multi-agent-sandbox-tools)
- [Exec aracı](/tr/tools/exec)
- [ACP ajanları kurulumu](/tr/tools/acp-agents-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
