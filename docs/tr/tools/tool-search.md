---
read_when:
    - PI ajanlarının, her araç şemasını isteme eklemeden geniş bir araç kataloğu kullanmasını istiyorsunuz
    - OpenClaw araçlarının, MCP araçlarının ve istemci araçlarının tek, kompakt bir PI yüzeyi üzerinden sunulmasını istiyorsunuz
    - Pi çalıştırmaları için araç keşfini uyguluyor veya hata ayıklıyorsunuz
summary: 'Araç Araması: büyük PI araç kataloglarını search, describe ve call arkasında sıkıştırın'
title: Araç Arama
x-i18n:
    generated_at: "2026-05-11T20:39:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 410f21a4d56af163d03023f7280469e55e17e8296ee16f7b12cc2589494d0a0c
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search, deneysel bir OpenClaw PI ajanı özelliğidir. PI ajanlarına
büyük araç kataloglarını keşfetmek ve çağırmak için tek ve kompakt bir yol
sunar. Çalıştırmada çok sayıda kullanılabilir araç olduğunda, ancak modelin
bunlardan yalnızca birkaçına ihtiyaç duyması olasıysa kullanışlıdır.

Bu sayfa OpenClaw PI Tool Search özelliğini belgeler. Codex'e özgü araç arama
veya dinamik araçlar yüzeyi değildir. Codex'e özgü kod modu, araç arama,
ertelenmiş dinamik araçlar ve iç içe araç çağrıları kararlı Codex harness
yüzeyleridir ve `tools.toolSearch` öğesine bağlı değildir.

PI için etkinleştirildiğinde, model varsayılan olarak bir `tool_search_code`
aracı alır. Bu araç, yalıtılmış bir Node alt sürecinde kısa bir JavaScript
gövdesini bir `openclaw.tools` köprüsüyle çalıştırır:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Katalog OpenClaw araçlarını, Plugin araçlarını, MCP araçlarını ve istemci
tarafından sağlanan araçları içerebilir. Model her tam şemayı baştan görmez.
Bunun yerine kompakt tanımlayıcıları arar, tam şemaya ihtiyaç duyduğunda seçilen
bir aracı açıklar ve bu aracı OpenClaw üzerinden çağırır.

Codex harness çalıştırmaları bu deneysel OpenClaw Tool Search denetimlerini
almaz. OpenClaw ürün kabiliyetlerini Codex'e dinamik araçlar olarak iletir ve
kararlı yerel kod modu, yerel araç arama, ertelenmiş dinamik araçlar ve iç içe
araç çağrıları Codex'e aittir.

## Bir tur nasıl çalışır

Planlama sırasında PI yerleşik çalıştırıcısı, çalıştırma için geçerli kataloğu
oluşturur:

1. Ajan, profil, sandbox ve oturum için etkin araç politikasını çözümle.
2. Uygun OpenClaw ve Plugin araçlarını listele.
3. Oturum MCP çalışma zamanı üzerinden uygun MCP araçlarını listele.
4. Geçerli çalıştırma için sağlanan uygun istemci araçlarını ekle.
5. Arama için kompakt tanımlayıcıları dizine ekle.
6. Modele PI kod köprüsünü veya yapılandırılmış yedek araçları sun.

Yürütme sırasında her gerçek araç çağrısı OpenClaw'a geri döner. Yalıtılmış
Node çalışma zamanı Plugin uygulamalarını, MCP istemci nesnelerini veya
gizli bilgileri tutmaz. `openclaw.tools.call(...)`, köprüden geçerek Gateway'e
geri döner; burada normal politika, onay, hook, günlükleme ve sonuç işleme
geçerli olmaya devam eder.

## Modlar

`tools.toolSearch` modelin gördüğü iki moda sahiptir:

- `code`: varsayılan kompakt JavaScript köprüsü olan `tool_search_code` öğesini sunar.
- `tools`: kod almaması gereken sağlayıcılar için `tool_search`,
  `tool_describe` ve `tool_call` öğelerini düz yapılandırılmış araçlar olarak
  sunar.

Her iki mod da aynı katalog ve yürütme yolunu kullanır. Tek fark modelin gördüğü
biçimdir. Geçerli çalışma zamanı yalıtılmış Node kod modu alt sürecini
başlatamazsa, varsayılan `code` modu katalog sıkıştırmasından önce `tools`
moduna geri döner.

Her iki mod da deneyseldir. Küçük PI araç katalogları için doğrudan araç
sunumunu, Codex harness çalıştırmaları için ise Codex'e özgü kararlı yüzeyleri
tercih edin.

Ayrı bir kaynak seçimi yapılandırması yoktur. Tool Search etkinleştirildiğinde,
katalog normal politika filtrelemesinden sonra uygun OpenClaw, MCP ve istemci
araçlarını içerir.

## Bu neden var

Büyük kataloglar kullanışlıdır ancak maliyetlidir. Her araç şemasını modele
göndermek isteği büyütür, planlamayı yavaşlatır ve yanlışlıkla araç seçme
olasılığını artırır.

Tool Search biçimi değiştirir:

- doğrudan araçlar: model ilk tokenden önce seçilen her şemayı görür
- Tool Search kod modu: model tek bir kompakt kod aracı ve kısa bir API
  sözleşmesi görür
- Tool Search araçlar modu: model üç kompakt yapılandırılmış yedek araç görür
- tur sırasında: model yalnızca gerçekten ihtiyaç duyduğu araç şemalarını yükler

Küçük kataloglar için doğru varsayılan hâlâ doğrudan araç sunumudur. Tool Search,
tek bir çalıştırmanın çok sayıda aracı görebildiği durumlarda, özellikle MCP
sunucularından veya istemci tarafından sağlanan uygulama araçlarından gelen
araçlarda en uygundur.

## API

`openclaw.tools.search(query, options?)`

Geçerli çalıştırma için etkin katalogda arama yapar. Sonuçlar kompakttır ve
istem bağlamına geri koymak için güvenlidir.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Tam giriş şeması dahil olmak üzere bir arama sonucu için tam meta verileri yükler.

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

Kod köprüsü kısa ömürlü bir Node alt sürecinde çalışır. Alt süreç, Node izin
modu etkin, boş bir ortam, dosya sistemi veya ağ izni olmadan ve alt süreç ya da
worker izinleri olmadan başlar. OpenClaw üst süreç tarafında duvar saati zaman
aşımı uygular ve async devamlar sonrasında da zaman aşımında alt süreci sonlandırır.

Çalışma zamanı yalnızca şunları sunar:

- `console.log`, `console.warn` ve `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Son çağrılarda normal OpenClaw davranışı geçerli olmaya devam eder:

- araç izin verme ve reddetme politikaları
- ajan ve sandbox başına araç kısıtlamaları
- yalnızca sahip geçidi
- onay hook'ları
- Plugin `before_tool_call` hook'ları
- oturum kimliği, günlükler ve telemetri

## Yapılandırma

PI çalıştırmaları için Tool Search'ü varsayılan kod köprüsüyle etkinleştirin:

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

PI çalıştırmaları için bunun yerine yapılandırılmış yedek araçları kullanın:

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

Tool Search, doğrudan araç sunumuyla karşılaştırmak için yeterli telemetriyi
kaydeder:

- harness'a gönderilen toplam serileştirilmiş araç ve istem baytları
- katalog boyutu ve kaynak dökümü
- arama, açıklama ve çağrı sayıları
- OpenClaw üzerinden yürütülen son araç çağrıları
- seçilen araç kimlikleri ve kaynakları

Oturum günlükleri şu soruları yanıtlamayı mümkün kılmalıdır:

- model baştan kaç araç şeması gördü
- kaç arama ve açıklama işlemi yaptı
- hangi son araç çağrıldı
- sonuç OpenClaw'dan mı, MCP'den mi yoksa bir istemci aracından mı geldi

## E2E doğrulama

Gateway E2E çalıştırıcısı, PI harness ile iki yolu da kanıtlar:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Büyük bir araç kataloğuna sahip geçici bir sahte Plugin oluşturur, sahte OpenAI
sağlayıcısını başlatır, Gateway'i bir kez doğrudan modda ve bir kez Tool Search
etkin olarak başlatır, ardından sağlayıcı istek yüklerini ve oturum günlüklerini
karşılaştırır.

Regresyon şunları kanıtlar:

1. Doğrudan mod sahte Plugin aracını çağırabilir.
2. Tool Search aynı sahte Plugin aracını çağırabilir.
3. Doğrudan mod sahte Plugin araç şemalarını sağlayıcıya doğrudan sunar.
4. Tool Search yalnızca kompakt köprüyü sunar.
5. Tool Search istek yükü, büyük sahte katalog için daha küçüktür.
6. Oturum günlükleri beklenen araç çağrısı sayılarını ve köprülenmiş çağrı
   telemetrisini gösterir.

## Hata davranışı

Tool Search kapalı şekilde başarısız olmalıdır:

- bir araç etkin politikada değilse arama onu döndürmemelidir
- seçilen bir araç kullanılamaz hâle gelirse `tool_call` başarısız olmalıdır
- politika veya onay yürütmeyi engellerse çağrı sonucu bu engeli atlamak yerine
  raporlamalıdır
- kod köprüsü yalıtılmış bir çalışma zamanı oluşturamazsa bu dağıtım için
  `mode: "tools"` kullanın veya Tool Search'ü devre dışı bırakın

## İlgili

- [Araçlar ve Plugin'ler](/tr/tools)
- [Çok ajanlı sandbox ve araçlar](/tr/tools/multi-agent-sandbox-tools)
- [Exec aracı](/tr/tools/exec)
- [ACP ajanları kurulumu](/tr/tools/acp-agents-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
