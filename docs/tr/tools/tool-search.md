---
read_when:
    - PI ajanlarının, her araç şemasını isteme eklemeden büyük bir araç kataloğu kullanmasını istiyorsunuz
    - OpenClaw araçlarının, MCP araçlarının ve istemci araçlarının tek bir kompakt PI yüzeyi üzerinden sunulmasını istiyorsunuz
    - PI çalıştırmaları için araç keşfi uyguluyor veya hata ayıklıyorsunuz
summary: 'Araç Arama: büyük PI araç kataloglarını search, describe ve call arkasında sıkıştırın'
title: Araç Arama
x-i18n:
    generated_at: "2026-05-10T19:59:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 182b850db5a1d6c9a769d5d50ccae914bc65416c1fd9368f0aeeb43663c0c0ae
    source_path: tools/tool-search.md
    workflow: 16
---

Araç Arama, PI ajanlarına büyük araç kataloglarını keşfetmek ve çağırmak için tek ve kompakt bir yol sunar. Çalıştırmada çok sayıda kullanılabilir araç olduğunda, ancak modelin bunlardan yalnızca birkaçına ihtiyaç duyması muhtemel olduğunda kullanışlıdır.

PI için etkinleştirildiğinde, model varsayılan olarak bir `tool_search_code` aracı alır. Bu araç, yalıtılmış bir Node alt sürecinde `openclaw.tools` köprüsüyle kısa bir JavaScript gövdesi çalıştırır:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Katalog OpenClaw araçlarını, Plugin araçlarını, MCP araçlarını ve istemci tarafından sağlanan araçları içerebilir. Model, her tam şemayı baştan görmez. Bunun yerine kompakt tanımlayıcıları arar, tam şemaya ihtiyaç duyduğunda seçilen bir aracı açıklar ve bu aracı OpenClaw üzerinden çağırır.

Codex harness çalıştırmaları bu OpenClaw Araç Arama kontrollerini almaz. OpenClaw, ürün yeteneklerini Codex'e dinamik araçlar olarak iletir; yerel kod modu, yerel araç araması, ertelenmiş dinamik araçlar ve iç içe araç çağrıları Codex'e aittir.

## Bir turun çalışması

Planlama sırasında PI gömülü çalıştırıcısı, çalıştırma için etkin kataloğu oluşturur:

1. Ajan, profil, sandbox ve oturum için etkin araç politikasını çözümler.
2. Uygun OpenClaw ve Plugin araçlarını listeler.
3. Oturum MCP çalışma zamanı üzerinden uygun MCP araçlarını listeler.
4. Geçerli çalıştırma için sağlanan uygun istemci araçlarını ekler.
5. Arama için kompakt tanımlayıcıları dizine ekler.
6. Modele PI kod köprüsünü veya yapılandırılmış yedek araçları sunar.

Yürütme sırasında her gerçek araç çağrısı OpenClaw'a geri döner. Yalıtılmış Node çalışma zamanı, Plugin uygulamalarını, MCP istemci nesnelerini veya gizli bilgileri tutmaz. `openclaw.tools.call(...)`, köprüden Gateway'e geri geçer; burada normal politika, onay, hook, günlükleme ve sonuç işleme yine uygulanır.

## Modlar

`tools.toolSearch` model tarafında iki moda sahiptir:

- `code`: varsayılan kompakt JavaScript köprüsü olan `tool_search_code` öğesini sunar.
- `tools`: kod almaması gereken sağlayıcılar için `tool_search`, `tool_describe` ve `tool_call` öğelerini düz yapılandırılmış araçlar olarak sunar.

Her iki mod da aynı kataloğu ve yürütme yolunu kullanır. Tek fark, modelin gördüğü biçimdir. Geçerli çalışma zamanı yalıtılmış Node kod modu alt sürecini başlatamazsa, varsayılan `code` modu katalog sıkıştırmasından önce `tools` moduna geri döner.

Ayrı bir kaynak seçimi yapılandırması yoktur. Araç Arama etkinleştirildiğinde katalog, normal politika filtrelemesinden sonra uygun OpenClaw, MCP ve istemci araçlarını içerir.

## Neden var

Büyük kataloglar kullanışlıdır ancak maliyetlidir. Her araç şemasını modele göndermek isteği büyütür, planlamayı yavaşlatır ve yanlışlıkla araç seçimi olasılığını artırır.

Araç Arama biçimi değiştirir:

- doğrudan araçlar: model ilk tokenden önce seçilen her şemayı görür
- Araç Arama kod modu: model tek bir kompakt kod aracı ve kısa bir API sözleşmesi görür
- Araç Arama araçlar modu: model üç kompakt yapılandırılmış yedek araç görür
- tur sırasında: model yalnızca gerçekten ihtiyaç duyduğu araç şemalarını yükler

Doğrudan araç sunumu küçük kataloglar için hâlâ doğru varsayılandır. Araç Arama, özellikle MCP sunucularından veya istemci tarafından sağlanan uygulama araçlarından bir çalıştırmanın çok sayıda aracı görebildiği durumlarda en uygunudur.

## API

`openclaw.tools.search(query, options?)`

Geçerli çalıştırma için etkin kataloğu arar. Sonuçlar kompakttır ve istem bağlamına geri konması güvenlidir.

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

Yapılandırılmış yedek mod aynı işlemleri araçlar olarak sunar:

- `tool_search`
- `tool_describe`
- `tool_call`

## Çalışma zamanı sınırı

Kod köprüsü kısa ömürlü bir Node alt sürecinde çalışır. Alt süreç, Node izin modu etkin, boş bir ortam, dosya sistemi veya ağ izni olmadan ve alt süreç ya da worker izni olmadan başlar. OpenClaw, üst süreçte duvar saati zaman aşımı uygular ve zaman aşımında, async devamlar sonrasında da dahil olmak üzere alt süreci sonlandırır.

Çalışma zamanı yalnızca şunları sunar:

- `console.log`, `console.warn` ve `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Son çağrılarda normal OpenClaw davranışı yine uygulanır:

- araç izin verme ve reddetme politikaları
- ajan başına ve sandbox başına araç kısıtlamaları
- yalnızca sahip kapısı
- onay hook'ları
- Plugin `before_tool_call` hook'ları
- oturum kimliği, günlükler ve telemetri

## Yapılandırma

Varsayılan kod köprüsüyle PI çalıştırmaları için Araç Arama'yı etkinleştirin:

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

Bunun yerine PI çalıştırmaları için yapılandırılmış yedek araçları kullanın:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
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

Araç Arama, doğrudan araç sunumuyla karşılaştırmak için yeterli telemetri kaydeder:

- harness'a gönderilen toplam serileştirilmiş araç ve istem baytı
- katalog boyutu ve kaynak dökümü
- arama, açıklama ve çağrı sayıları
- OpenClaw üzerinden yürütülen son araç çağrıları
- seçilen araç kimlikleri ve kaynakları

Oturum günlükleri şunları yanıtlamayı mümkün kılmalıdır:

- modelin baştan kaç araç şeması gördüğü
- kaç arama ve açıklama işlemi gerçekleştirdiği
- hangi son aracın çağrıldığı
- sonucun OpenClaw, MCP veya bir istemci aracından gelip gelmediği

## E2E doğrulaması

Gateway E2E çalıştırıcısı, PI harness ile her iki yolu da kanıtlar:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Büyük bir araç kataloğuna sahip geçici bir sahte Plugin oluşturur, sahte OpenAI sağlayıcısını başlatır, Gateway'i bir kez doğrudan modda ve bir kez Araç Arama etkin olarak başlatır, ardından sağlayıcı istek yüklerini ve oturum günlüklerini karşılaştırır.

Regresyon şunları kanıtlar:

1. Doğrudan mod sahte Plugin aracını çağırabilir.
2. Araç Arama aynı sahte Plugin aracını çağırabilir.
3. Doğrudan mod sahte Plugin araç şemalarını doğrudan sağlayıcıya sunar.
4. Araç Arama yalnızca kompakt köprüyü sunar.
5. Araç Arama istek yükü, büyük sahte katalog için daha küçüktür.
6. Oturum günlükleri beklenen araç çağrısı sayılarını ve köprülenmiş çağrı telemetrisini gösterir.

## Hata davranışı

Araç Arama kapalı hata vermelidir:

- bir araç etkin politikada değilse, arama onu döndürmemelidir
- seçilen bir araç kullanılamaz hâle gelirse, `tool_call` başarısız olmalıdır
- politika veya onay yürütmeyi engellerse, çağrı sonucu bunu atlamak yerine bu engeli bildirmelidir
- kod köprüsü yalıtılmış bir çalışma zamanı oluşturamazsa, o dağıtım için `mode: "tools"` kullanın veya Araç Arama'yı devre dışı bırakın

## İlgili

- [Araçlar ve Plugin'ler](/tr/tools)
- [Çok ajanlı sandbox ve araçlar](/tr/tools/multi-agent-sandbox-tools)
- [Exec aracı](/tr/tools/exec)
- [ACP ajanları kurulumu](/tr/tools/acp-agents-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
