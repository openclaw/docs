---
read_when:
    - Bir ajan çalıştırması için OpenClaw kod modunu etkinleştirmek istiyorsunuz
    - Kod modunun Codex Kod modundan neden farklı olduğunu açıklamanız gerekir
    - exec/wait sözleşmesini, QuickJS-WASI sandbox ortamını, TypeScript dönüşümünü veya gizli araç kataloğu köprüsünü inceliyorsunuz
    - Dahili bir kod modu ad alanı kayıt defteri entegrasyonu ekliyor veya gözden geçiriyorsunuz
sidebarTitle: Code mode
summary: 'OpenClaw kod modu: QuickJS-WASI tarafından desteklenen ve gizli, çalıştırma kapsamlı bir araç kataloğuna dayanan, isteğe bağlı etkinleştirilen bir exec/wait araç yüzeyi'
title: Kod modu
x-i18n:
    generated_at: "2026-06-28T01:15:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 859d56eb09e21c9277961ac5178c1458ce669de114e8cc3f2c8d4b104f428a74
    source_path: reference/code-mode.md
    workflow: 16
---

Kod modu, deneysel bir OpenClaw aracı-çalışma zamanı özelliğidir. Varsayılan olarak
kapalıdır. Etkinleştirdiğinizde OpenClaw, modelin tek bir çalıştırmada gördüklerini
değiştirir: etkinleştirilen her araç şemasını doğrudan göstermek yerine model yalnızca
`exec` ve `wait` görür.

Bu sayfa OpenClaw kod modunu belgeler. Codex Code mode değildir. İki özellik
aynı adı paylaşır, ancak farklı çalışma zamanları tarafından uygulanır ve farklı
`exec` sözleşmeleri sunar:

- Codex Code Mode, yerel kod modunu kısıtlı araç ilkesi devre dışı bırakmadığı sürece
  Codex uygulama-sunucusu iş parçacıkları için etkindir. Modelin shell komutlarını
  bir `exec.command` sözleşmesi üzerinden yazdığı Codex kodlama harness’inde çalışır.
- OpenClaw kod modu, `tools.codeMode.enabled: true` yapılandırılmadıkça devre dışıdır.
  Modelin JavaScript veya TypeScript programlarını bir `exec.code` sözleşmesi üzerinden
  yazdığı OpenClaw genel aracı çalışma zamanında çalışır.

Codex Code Mode ve Codex’e özgü dinamik araç araması kararlı Codex harness
yüzeyleridir. OpenClaw kod modu, genel OpenClaw çalıştırmaları için OpenClaw’a ait
deneysel bir araç-yüzeyi adaptörüdür. `quickjs-wasi`, gizli bir OpenClaw araç
kataloğu ve normal OpenClaw araç yürütücüsünü kullanır.

## Bu nedir?

OpenClaw kod modu, modelin uzun bir araç listesinden doğrudan seçim yapmak yerine
küçük bir JavaScript veya TypeScript programı yazmasını sağlar.

Kod modu etkinken:

- Modelin görebildiği araç listesi tam olarak `exec` ve `wait` olur.
- `exec`, model tarafından üretilen JavaScript veya TypeScript’i kısıtlı bir
  QuickJS-WASI worker içinde değerlendirir.
- Normal OpenClaw araçları model isteminden gizlenir ve konuk programın içinde
  `ALL_TOOLS` ve `tools` üzerinden sunulur.
- Konuk kod gizli kataloğu arayabilir, bir aracı açıklayabilir ve normal aracı
  dönüşlerinde kullanılan aynı OpenClaw yürütme yolu üzerinden bir aracı çağırabilir.
- MCP araçları `MCP` ad alanı altında gruplanır. Kod modunda bu ad alanı,
  MCP araçlarını çağırmanın desteklenen tek yoludur.
- `wait`, iç içe araç çağrıları hâlâ beklemedeyken askıya alınmış bir kod modu
  çalıştırmasını sürdürür.

Önemli ayrım: kod modu, modelle karşılaşan orkestrasyon yüzeyini değiştirir.
OpenClaw araçlarının, Plugin araçlarının, MCP araçlarının, kimlik doğrulamanın,
onay ilkesinin, kanal davranışının veya model seçiminin yerine geçmez.

## Bu neden iyi?

Kod modu, büyük araç kataloglarının modeller tarafından kullanılmasını kolaylaştırır.

- Daha küçük istem yüzeyi: sağlayıcılar, onlarca veya yüzlerce tam araç şeması
  yerine iki kontrol aracı alır.
- Daha iyi orkestrasyon: model tek bir kod hücresinde döngüler, birleştirmeler,
  küçük dönüşümler, koşullu mantık ve paralel iç içe araç çağrıları kullanabilir.
- Sağlayıcıdan bağımsız: sağlayıcıya özgü kod yürütmeye bağlı olmadan OpenClaw,
  Plugin, MCP ve istemci araçları için çalışır.
- Mevcut ilke geçerliliğini korur: iç içe araç çağrıları yine OpenClaw ilkesi,
  onaylar, hook’lar, oturum bağlamı ve denetim yollarından geçer.
- Net hata modu: kod modu açıkça etkinleştirildiğinde ve çalışma zamanı kullanılamadığında,
  OpenClaw geniş doğrudan araç gösterimine geri dönmek yerine kapalı başarısız olur.

Kod modu, özellikle büyük bir etkin araç kataloğuna sahip aracılar veya modelin
yanıt üretmeden önce araçları tekrar tekrar araması, birleştirmesi ve çağırması
gereken iş akışları için kullanışlıdır.

## Nasıl etkinleştirilir?

Aracı veya çalışma zamanı yapılandırmasına `tools.codeMode.enabled: true` ekleyin:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Kısa biçim de kabul edilir:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

`tools.codeMode` atlandığında, `false` olduğunda veya `enabled: true` içermeyen
bir nesne olduğunda kod modu kapalı kalır.

Yapılandırılmış MCP sunucularına sahip sandbox’lı aracılar kullandığınızda, sandbox
araç ilkesinin paketlenmiş MCP Plugin’ine de izin verdiğinden emin olun; örneğin
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]` ile. Bkz.
[Yapılandırma - araçlar ve özel sağlayıcılar](/tr/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Daha sıkı sınırlar istediğinizde açık limitler kullanın:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
      timeoutMs: 10000,
      memoryLimitBytes: 67108864,
      maxOutputBytes: 65536,
      maxSnapshotBytes: 10485760,
      maxPendingToolCalls: 16,
      snapshotTtlSeconds: 900,
      searchDefaultLimit: 8,
      maxSearchLimit: 50,
    },
  },
}
```

Hata ayıklarken model yükü şeklini doğrulamak için Gateway’i hedefli günlükleme ile
çalıştırın:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Kod modu etkinken, günlüğe yazılan modelle karşılaşan araç adları `exec` ve
`wait` olmalıdır. Redakte edilmiş sağlayıcı yüküne ihtiyacınız varsa kısa bir
hata ayıklama oturumu için `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` ekleyin.

## Teknik tur

Bu sayfanın geri kalanı çalışma zamanı sözleşmesini ve uygulama ayrıntılarını
açıklar. Bakımcılar, araç görünürlüğünde hata ayıklayan Plugin yazarları ve
yüksek riskli dağıtımları doğrulayan operatörler için hazırlanmıştır.

## Çalışma zamanı durumu

- Çalışma zamanı: [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi).
- Varsayılan durum: devre dışı.
- Kararlılık: deneysel OpenClaw yüzeyi; Codex Code mode ayrı ve kararlı bir
  Codex harness yüzeyidir.
- Hedef yüzey: genel OpenClaw aracı çalıştırmaları.
- Güvenlik duruşu: model kodu düşmancadır.
- Kullanıcıya dönük vaat: kod modunu etkinleştirmek hiçbir zaman sessizce geniş
  doğrudan araç gösterimine geri dönmez.

## Kapsam

Kod modu, hazırlanmış bir çalıştırma için modelle karşılaşan orkestrasyon şeklini
sahiplenir. Model seçimini, kanal davranışını, kimlik doğrulamayı, araç ilkesini
veya araç uygulamalarını sahiplenmez.

Kapsam içi:

- modelin görebildiği `exec` ve `wait` araç tanımları
- gizli araç kataloğu oluşturma
- JavaScript ve TypeScript konuk yürütmesi
- QuickJS-WASI worker çalışma zamanı
- katalog araması, şema açıklama ve araç çağrısı için host geri çağrıları
- askıya alınmış konuk programlar için sürdürülebilir durum
- çıktı, zaman aşımı, bellek, bekleyen çağrı ve snapshot limitleri
- iç içe araç çağrıları için telemetri ve yörünge projeksiyonu

Kapsam dışı:

- sağlayıcıya özgü uzak kod yürütme
- shell yürütme semantiği
- mevcut araç yetkilendirmesini değiştirme
- kalıcı kullanıcı yazımlı betikler
- konuk kodda paket yöneticisi, dosya, ağ veya modül erişimi
- Codex Code mode iç yapılarının doğrudan yeniden kullanımı

Uzak Python sandbox’ları gibi sağlayıcıya ait araçlar ayrı araçlar olarak kalır.
Bkz. [Kod yürütme](/tr/tools/code-execution).

## Terimler

**Kod modu**, normal model araçlarını gizleyen ve yalnızca `exec` ile `wait`
sunan OpenClaw çalışma zamanı modudur.

**Konuk çalışma zamanı**, model kodunu değerlendiren QuickJS-WASI JavaScript VM’idir.

**Host köprüsü**, konuk koddan OpenClaw’a geri dönen dar JSON uyumlu geri çağrı yüzeyidir.

**Katalog**, normal araç ilkesi, Plugin, MCP ve istemci aracı çözümlemesinden sonra
geçerli araçların çalıştırma kapsamlı listesidir.

**İç içe araç çağrısı**, host köprüsü üzerinden konuk koddan yapılan bir araç çağrısıdır.

**Snapshot**, `wait` işleminin askıya alınmış kod modu çalıştırmasını sürdürebilmesi
için kaydedilen serileştirilmiş QuickJS-WASI VM durumudur.

## Yapılandırma

`tools.codeMode.enabled` etkinleştirme kapısıdır. Diğer kod modu alanlarını ayarlamak
özelliği etkinleştirmez.

Desteklenen alanlar:

- `enabled`: boolean. Varsayılan `false`. Kod modunu yalnızca `true` olduğunda etkinleştirir.
- `runtime`: `"quickjs-wasi"`. Desteklenen tek çalışma zamanı.
- `mode`: `"only"`. `exec` ve `wait` sunar, normal model araçlarını gizler.
- `languages`: `"javascript"` ve `"typescript"` dizisi. Varsayılan ikisini de içerir.
- `timeoutMs`: bir `exec` veya `wait` için duvar saati üst sınırı. Varsayılan `10000`.
  Çalışma zamanı kısıtı: `100` ile `60000`.
- `memoryLimitBytes`: QuickJS heap üst sınırı. Varsayılan `67108864`. Çalışma zamanı kısıtı:
  `1048576` ile `1073741824`.
- `maxOutputBytes`: döndürülen metin, JSON ve günlükler için üst sınır. Varsayılan `65536`.
  Çalışma zamanı kısıtı: `1024` ile `10485760`.
- `maxSnapshotBytes`: serileştirilmiş VM snapshot’ları için üst sınır. Varsayılan `10485760`.
  Çalışma zamanı kısıtı: `1024` ile `268435456`.
- `maxPendingToolCalls`: eşzamanlı iç içe araç çağrıları için üst sınır. Varsayılan `16`.
  Çalışma zamanı kısıtı: `1` ile `128`.
- `snapshotTtlSeconds`: askıya alınmış bir VM’in ne kadar süre sürdürülebileceği. Varsayılan `900`.
  Çalışma zamanı kısıtı: `1` ile `86400`.
- `searchDefaultLimit`: varsayılan gizli katalog arama sonucu sayısı. Varsayılan `8`.
  Çalışma zamanı bunu `maxSearchLimit` değerine kısıtlar.
- `maxSearchLimit`: en fazla gizli katalog arama sonucu sayısı. Varsayılan `50`.
  Çalışma zamanı kısıtı: `1` ile `50`.

Kod modu etkinse ancak QuickJS-WASI yüklenemiyorsa OpenClaw o çalıştırma için kapalı
başarısız olur. Normal araçları sessizce bir geri dönüş olarak göstermez.

## Etkinleştirme

Kod modu, geçerli araç ilkesi bilindikten sonra ve son model isteği oluşturulmadan
önce değerlendirilir.

Etkinleştirme sırası:

1. Aracı, model, sağlayıcı, sandbox, kanal, gönderen ve çalıştırma ilkesini çözümle.
2. Geçerli OpenClaw araç listesini oluştur.
3. Uygun Plugin, MCP ve istemci araçlarını ekle.
4. İzin ve reddetme ilkesini uygula.
5. `tools.codeMode.enabled` false ise normal araç gösterimiyle devam et.
6. Etkinse ve araçlar çalıştırma için aktifse, geçerli araçları kod modu kataloğuna kaydet.
7. Tüm normal araçları modelin görebildiği araç listesinden kaldır.
8. Kod modu `exec` ve `wait` ekle.

Ham model çağrıları, `disableTools` veya boş izin listesi gibi kasıtlı olarak aracı
olmayan çalıştırmalar, yapılandırma `tools.codeMode.enabled: true` içerse bile
kod modu yüzeyini etkinleştirmez.

Kod modu kataloğu çalıştırma kapsamlıdır. Başka bir aracıdan, oturumdan, gönderenden
veya çalıştırmadan araç sızdırmamalıdır.

## Modelin görebildiği araçlar

Kod modu etkinken model tam olarak şu üst düzey araçları görür:

- `exec`
- `wait`

Diğer tüm etkin araçlar, modelle karşılaşan araç listesinden gizlenir ve kod modu
kataloğuna kaydedilir.

Model, araç orkestrasyonu, veri birleştirme, döngüler, paralel iç içe çağrılar ve
yapılandırılmış dönüşümler için `exec` kullanmalıdır. Model, `wait` aracını yalnızca
`exec` sürdürülebilir bir `waiting` sonucu döndürdüğünde kullanmalıdır.

## `exec`

`exec` bir kod modu hücresi başlatır ve tek bir sonuç döndürür. Girdi kodu model
tarafından üretilir ve düşmanca kabul edilmelidir.

Girdi:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Girdi kuralları:

- `code` veya `command` alanlarından biri boş olmamalıdır.
- `code`, belgelenmiş modelle karşılaşan alandır.
- `command`, hook ilkeleri ve güvenilir yeniden yazımlar için exec uyumlu bir alias
  olarak kabul edilir; ikisi de varsa değerler eşleşmelidir.
- Dış kod modu `exec` hook olayları `toolKind: "code_mode_exec"` içerir ve girdi
  dili bilindiğinde `toolInputKind: "javascript" | "typescript"` içerir; böylece
  ilkeler, kod modu hücrelerini aynı araç adını paylaşan shell tarzı `exec`
  çağrılarından ayırt edebilir.
- `language` varsayılan olarak `"javascript"` olur.
- `language` `"typescript"` ise OpenClaw değerlendirmeden önce transpile eder.
- `exec`, v1’de `import`, `require`, dinamik import ve modül yükleyici örüntülerini reddeder.
- `exec`, normal shell `exec` uygulamasını özyinelemeli olarak sunmaz.

Sonuç:

```typescript
type CodeModeResult = CodeModeCompletedResult | CodeModeWaitingResult | CodeModeFailedResult;

type CodeModeCompletedResult = {
  status: "completed";
  value: unknown;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeWaitingResult = {
  status: "waiting";
  runId: string;
  reason: "pending_tools" | "yield";
  pendingToolCalls?: CodeModePendingToolCall[];
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeFailedResult = {
  status: "failed";
  error: string;
  code?: CodeModeErrorCode;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};
```

`exec`, QuickJS VM hâlâ modelin görebildiği bir sürdürmeye ihtiyaç duyan sürdürülebilir
durumla askıya alındığında `waiting` döndürür. Sonuç, `wait` için bir `runId` içerir.
MCP ad alanı çağrıları dahil ad alanı köprüsü çağrıları, hazır oldukları sürece aynı
`exec`/`wait` çağrısı içinde otomatik olarak boşaltılır; böylece kompakt bir kod bloğu,
ad alanı başına bir model araç çağrısını zorlamadan `$api()` değerini inceleyebilir
ve bir MCP aracı çağırabilir.

`exec`, yalnızca konuk VM'nin bekleyen işi kalmadığında ve son değer OpenClaw'ın çıktı bağdaştırıcısı çalıştıktan sonra JSON uyumlu olduğunda `completed` döndürür.

## `wait`

`wait`, askıya alınmış bir kod modu VM'sini sürdürür.

Girdi:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

Çıktı, `exec` tarafından döndürülen aynı `CodeModeResult` birleşimidir.

`wait` vardır çünkü iç içe OpenClaw araçları yavaş, etkileşimli, onaya bağlı olabilir veya kısmi güncellemeler akıtabilir. Modelin, konak dış işleri beklerken uzun bir `exec` çağrısını açık tutması gerekmemelidir.

QuickJS-WASI anlık görüntü ve geri yükleme, v1 sürdürme mekanizmasıdır:

1. `exec`, kodu tamamlanana, başarısız olana veya askıya alınana kadar değerlendirir.
2. Askıya alma sırasında OpenClaw, QuickJS VM'nin anlık görüntüsünü alır ve bekleyen konak işlerini kaydeder.
3. Bekleyen iş tamamlandığında `wait`, VM anlık görüntüsünü geri yükler.
4. OpenClaw, konak geri çağrılarını kararlı adlarla yeniden kaydeder.
5. OpenClaw, iç içe araç sonuçlarını geri yüklenen VM'ye teslim eder.
6. OpenClaw, QuickJS bekleyen işlerini boşaltır.
7. `wait`, `completed`, `failed` veya başka bir `waiting` sonucu döndürür.

Anlık görüntüler, kullanıcı yapıtları değil çalışma zamanı durumudur. Boyutları sınırlıdır, süreleri dolar ve onları oluşturan çalıştırma ve oturumla kapsamlandırılır.

`wait` şu durumlarda başarısız olur:

- `runId` bilinmiyor.
- anlık görüntünün süresi doldu.
- üst çalıştırma veya oturum iptal edildi.
- çağıran aynı çalıştırma/oturum kapsamında değil.
- QuickJS-WASI geri yükleme başarısız olur.
- geri yükleme yapılandırılmış sınırları aşardı.

## Konuk çalışma zamanı API'si

Konuk çalışma zamanı küçük bir global API sunar:

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS`, çalıştırma kapsamlı katalog için kompakt meta veridir. Varsayılan olarak tam şemalar içermez.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "plugin" | "mcp" | "client";
  sourceName?: string;
};
```

Tam şema yalnızca istek üzerine yüklenir:

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

Katalog yardımcıları:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

Kolaylık sağlayan araç işlevleri yalnızca belirsiz olmayan güvenli adlar için kurulur:

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

MCP katalog girdileri, kod modunda `tools.call(...)` veya kolaylık işlevleri üzerinden çağrılamaz. Yalnızca oluşturulan `MCP` ad alanı üzerinden sunulurlar. TypeScript tarzı bildirim dosyaları salt okunur `API` sanal dosya yüzeyi üzerinden kullanılabilir; böylece ajanlar, MCP şemalarını isteme eklemeden MCP imzalarını inceleyebilir:

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Investigate gateway logs",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")`, MCP araç meta verilerinden çıkarılan kompakt bildirimler döndürür:

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Return this TypeScript-style API header. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Create a GitHub issue.
   * @param owner Repository owner
   * @param repo Repository name
   * @param title Issue title
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

Bildirim dosyaları sanaldır; çalışma alanı veya durum dizini altına yazılan dosyalar değildir. Her kod modu `exec` çağrısı için OpenClaw, çalıştırma kapsamlı araç kataloğunu oluşturur, görünür MCP girdilerini tutar, görünür her sunucu için bir `mcp/<server>.d.ts` bildirimiyle birlikte `mcp/index.d.ts` üretir ve bu küçük salt okunur tabloyu QuickJS çalışanına enjekte eder. Konuk kod yalnızca `API` nesnesini görür: `API.list(prefix?)` dosya meta verilerini döndürür ve `API.read(path)` seçilen bildirim içeriğini döndürür. Bilinmeyen yollar ve `.` / `..` segmentleri reddedilir.

Bu, büyük MCP şemalarını model isteminin dışında tutar. Ajan, sanal API'nin varlığını `exec` araç açıklamasından öğrenir, yalnızca gereken bildirim dosyasını okur ve ardından tek bir nesne bağımsız değişkeniyle `MCP.<server>.<tool>()` çağırır. `MCP.<server>.$api()`, ajanın program içinde tek araçlık bir şema yanıtına ihtiyaç duyması durumunda satır içi yedek olarak kullanılmaya devam eder.

Konuk çalışma zamanı, konak nesnelerini doğrudan açığa çıkarmamalıdır. Girdiler ve çıktılar köprüden açık boyut sınırları olan JSON uyumlu değerler olarak geçer.

## Dahili ad alanları

Dahili ad alanları, daha fazla model görünür araç eklemeden kod moduna kısa bir alan API'si verir. Yükleyiciye ait bir entegrasyon `Issues`, `Fictions` veya `Calendar` gibi bir ad alanı kaydedebilir; konuk kod daha sonra bu ad alanını QuickJS programı içinde çağırır, OpenClaw ise modele hâlâ yalnızca `exec` ve `wait` gösterir.

Ad alanları şimdilik dahilidir. Herkese açık bir Plugin SDK ad alanı API'si yoktur: harici Plugin ad alanları yükleyiciye ait bir sözleşmeye ihtiyaç duyar; böylece Plugin kimliği, kurulu manifestler, kimlik doğrulama durumu ve önbelleğe alınmış katalog tanımlayıcıları, ad alanını destekleyen Plugin araçlarından sapamaz. Çekirdek kod modu yalnızca sandbox'ı, serileştirmeyi, katalog kapılamasını ve köprü yönlendirmesini sahiplenir.

Konuk kod daha sonra doğrudan globali veya `namespaces` haritasını kullanabilir:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Kayıt yaşam döngüsü

Ad alanı kaydı süreç yereldir ve ad alanı kimliğiyle anahtarlanır. Tipik bir çalıştırma şu yolu izler:

1. Güvenilir bir yükleyici `registerCodeModeNamespaceForPlugin(pluginId, registration)` çağırır.
2. Kod modu, çalıştırma için gizli `ToolSearchRuntime` oluşturur ve çalıştırma kapsamlı kataloğunu okur.
3. `createCodeModeNamespaceRuntime(ctx, catalog)`, yalnızca tüm `requiredToolNames` değerleri görünür olan ve aynı `pluginId` tarafından sahiplenilen kayıtları tutar.
4. Her görünür ad alanı, geçerli çalıştırma için `createScope(ctx)` çağırır. Kapsam `agentId`, `sessionKey`, `sessionId`, `runId`, yapılandırma ve iptal durumu gibi çalıştırma bağlamı alır.
5. Kapsam verileri düz bir tanımlayıcıya serileştirilir ve doğrudan globaller ile `namespaces.<globalName>` olarak QuickJS'e enjekte edilir.
6. Konuk çağrıları çalışan köprüsü üzerinden askıya alınır, konakta ad alanı yolunu çözer, çağrıyı bildirilen Plugin tarafından sahiplenilen bir katalog aracına eşler ve bu aracı `ToolSearchRuntime.call` üzerinden yürütür.
7. OpenClaw, etkin `exec`/`wait` araç çağrısı içinde hazır ad alanı köprü çağrılarını otomatik olarak boşaltır. Ad alanı işi zaman aşımında hâlâ bekliyorsa veya konuk açıkça denetimi bırakırsa `wait`, aynı ad alanı çalışma zamanını daha sonra sürdürür.
8. Plugin geri alma veya kaldırma, `clearCodeModeNamespacesForPlugin(pluginId)` çağırır; böylece bayat globaller başarısız bir Plugin yüklemesinden sonra hayatta kalmaz.

Önemli değişmez: ad alanı çağrıları katalog araç çağrılarıdır. `tools.call(...)` ile aynı ilke kancalarını, onayları, iptal işlemeyi, telemetriyi, döküm projeksiyonunu ve askıya alma/sürdürme davranışını kullanırlar.

### Kayıt şekli

Ad alanlarını, destekleyen araçların sahibi olan entegrasyondan kaydedin. Kapsamı küçük tutun ve yalnızca bildirilen katalog araçlarına eşlenen alan fiillerini açığa çıkarın.

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "GitHub issue helpers for the current repository.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Use Issues.list(params) and Issues.update(number, patch).",
  createScope: (ctx) => ({
    repository: ctx.config,
    list: createCodeModeNamespaceTool("github_list_issues", ([params]) => params ?? {}),
    update: createCodeModeNamespaceTool("github_update_issue", ([number, patch]) => ({
      number,
      patch,
    })),
  }),
});
```

`createCodeModeNamespaceTool(toolName, inputMapper)`, bir kapsam üyesini çağrılabilir ad alanı işlevi olarak işaretler. İsteğe bağlı `inputMapper`, konuk bağımsız değişkenlerini alır ve destekleyen katalog aracı için girdi nesnesini döndürür. Girdi eşleyici olmadan ilk konuk bağımsız değişkeni kullanılır; atlanırsa `{}` kullanılır.

Ham konak işlevleri, konuk kod çalışmadan önce reddedilir:

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### Sahiplik ve görünürlük

Ad alanı sahipliği, kayıt çağırıcısının `pluginId` değerine bağlıdır. `requiredToolNames` hem görünürlük kapısı hem de sahiplik denetimidir:

- her gerekli araç çalıştırma kataloğunda bulunmalıdır
- her gerekli araçta `sourceName === pluginId` olmalıdır
- herhangi bir gerekli araç yoksa veya başka bir Plugin tarafından sahipleniliyorsa ad alanı gizlenir
- her çağrılabilir yol yalnızca `requiredToolNames` içinde adlandırılan bir aracı hedefleyebilir

Bu, başka bir Plugin'in aynı adlı bir araç kaydederek ad alanı açığa çıkarmasını önler. Ayrıca ad alanlarını olağan ajan ilkesiyle hizalı tutar: çalıştırma destekleyen araçları göremiyorsa ad alanını da göremez.

Örneğin bir GitHub ad alanı, GitHub kimlik doğrulamasını, REST veya GraphQL istemcilerini, hız sınırlarını, yazma onaylarını ve testleri sahiplenen GitHub'a ait bir uzantının arkasında yaşamalıdır. Çekirdek kod modu, GitHub'a özgü API'leri, belirteç işlemeyi veya sağlayıcı ilkesini içine gömmemelidir.

### Kapsam serileştirme kuralları

`createScope(ctx)`, JSON uyumlu değerler, diziler, iç içe nesneler ve `createCodeModeNamespaceTool(...)` çağrı işaretçileri içeren düz bir nesne döndürebilir. Konak nesneleri QuickJS'e asla doğrudan girmez.

Serileştirici şunları reddeder:

- ham işlevler
- döngüsel nesne grafikleri
- güvenli olmayan yol segmentleri: `__proto__`, `constructor`, `prototype`, boş anahtarlar veya dahili yol ayırıcısını içeren anahtarlar
- JavaScript tanımlayıcısı olmayan `globalName` değerleri
- `tools`, `namespaces`, `text`, `json`, `yield_control` veya `__openclaw*` gibi yerleşik kod modu globalleriyle `globalName` çakışmaları

JSON'a serileştirilemeyen değerler, köprüden geçmeden önce JSON güvenli yedek değerlere dönüştürülür. İkili veri, tanıtıcılar, soketler, istemciler ve sınıf örnekleri olağan katalog araçlarının arkasında kalmalıdır.

### İstemler

Ad alanı `description` ve isteğe bağlı `prompt`, yalnızca ad alanı o çalıştırma için görünür olduğunda model tarafından görülebilen `exec` şemasına eklenir. Bunları en küçük kullanışlı yüzeyi öğretmek için kullanın:

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

İstemleri kimlik doğrulama kurulumu, uygulama geçmişi veya ilgisiz Plugin davranışı hakkında değil, ad alanı sözleşmesi hakkında tutun.

### Temizlik

Ad alanları süreç yerelinde yapılan kayıtlardır. Sahip Plugin devre dışı bırakıldığında, kaldırıldığında veya geri alındığında bunları kaldırın:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

Kod modu temizliği Plugin tarafından sahiplenilir; yaşam döngüsü sona erdiğinde ad alanı başına kapatma tutamaçları tutmak yerine Plugin'in ad alanı kayıtlarını temizleyin. Testler, vakalar arasında kayıt sızıntısını önlemek için `clearCodeModeNamespacesForTest()` çağırabilir.

### Test kontrol listesi

Ad alanı değişiklikleri güvenlik sınırını ve konuk davranışını kapsamalıdır:

- ad alanı istem metni yalnızca arkasındaki araçlar görünür olduğunda görünür
- başka bir `sourceName` içindeki aynı adlı araçlar ad alanını açığa çıkarmaz
- ham kapsam işlevleri reddedilir
- sahte ad alanı kimlikleri ve sahte yollar reddedilir
- çağrılabilir yollar beyan edilmemiş araçları hedefleyemez
- iç içe nesneler ve paylaşılan referanslar doğru şekilde serileştirilir
- ad alanı çağrıları katalog araçları üzerinden yürütülür ve JSON açısından güvenli ayrıntılar döndürür
- hatalar konuk kod tarafından yakalanabilir
- askıya alınmış ad alanı çağrıları `wait` üzerinden sürdürülür
- Plugin geri alma işlemi, sahip olunan ad alanı kayıtlarını temizler

Ad alanları genel `tools.search` / `tools.call` kataloğunu tamamlar. Etkinleştirilmiş rastgele OpenClaw, Plugin ve istemci araçları için kataloğu; MCP araçları için `MCP`'yi; tekrarlanan şema aramalarına göre kısa kodun daha güvenilir olduğu Plugin sahipli, belgelenmiş etki alanı API'leri için diğer ad alanlarını kullanın.

## Çıktı API'si

`text(value)`, insan tarafından okunabilir çıktıyı `output` dizisine ekler.

`json(value)`, JSON uyumlu serileştirmeden sonra yapılandırılmış bir çıktı öğesi ekler.

Konuk kodun döndürdüğü son değer, `completed` sonucunda `value` olur.

Çıktı öğesi:

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Çıktı kuralları:

- çıktı sırası konuk çağrılarıyla eşleşir
- çıktı `maxOutputBytes` ile sınırlandırılır
- serileştirilemeyen değerler düz dizelere veya hatalara dönüştürülür
- ikili değerler v1'de desteklenmez
- görüntüler ve dosyalar kod modu köprüsü üzerinden değil, sıradan OpenClaw araçları üzerinden taşınır

## Araç kataloğu

Gizli katalog, etkili ilke filtrelemesinden sonra araçları içerir:

1. OpenClaw çekirdek araçları.
2. Paketlenmiş Plugin araçları.
3. Harici Plugin araçları.
4. MCP araçları.
5. Geçerli çalıştırma için istemci tarafından sağlanan araçlar.

Katalog kimlikleri tek bir çalıştırma içinde kararlıdır ve mümkün olduğunda eşdeğer araç kümeleri arasında deterministiktir.

Önerilen kimlik biçimi:

```text
<source>:<owner>:<tool-name>
```

Örnekler:

```text
openclaw:core:message
plugin:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

Katalog, kod modu denetim araçlarını atlar:

- `exec`
- `wait`
- `tool_search_code`
- `tool_search`
- `tool_describe`
- `tool_call`

Bu, özyinelemeyi önler ve modele dönük sözleşmeyi dar tutar.

MCP girdileri çalıştırma kapsamlı katalogda kalır; böylece ilke, onaylar, kancalar, telemetri, transkript projeksiyonu ve kesin araç kimlikleri normal araç yürütmeyle paylaşılmış kalır. Konuğa dönük `ALL_TOOLS`, `tools.search(...)`, `tools.describe(...)` ve `tools.call(...)` görünümleri MCP girdilerini atlar. Üretilen `MCP.<server>.<tool>({ ...input })` ad alanı, kesin katalog kimliğine geri çözümlenir ve ardından aynı yürütücü yolu üzerinden gönderilir.

## Araç Arama etkileşimi

Kod modu, etkin olduğu çalıştırmalarda OpenClaw Araç Arama model yüzeyinin yerini alır.

`tools.codeMode.enabled` true olduğunda ve kod modu etkinleştiğinde:

- OpenClaw, `tool_search_code`, `tool_search`, `tool_describe` veya `tool_call` araçlarını model tarafından görünür araçlar olarak açığa çıkarmaz.
- Aynı kataloglama fikri konuk çalışma zamanının içine taşınır.
- Konuk çalışma zamanı, MCP dışı araçlar için kompakt `ALL_TOOLS` meta verileri ve arama, açıklama ve çağrı yardımcıları alır.
- MCP çağrıları, `tools.call(...)` yerine üretilen `MCP` ad alanını ve onun `$api()` başlıklarını kullanır.
- İç içe çağrılar, Araç Arama'nın kullandığı aynı OpenClaw yürütücü yolu üzerinden gönderilir.

Mevcut [Araç Arama](/tr/tools/tool-search) sayfası, OpenClaw kompakt katalog köprüsünü açıklar. Kod modu, `exec` ve `wait` kullanabilen çalıştırmalar için genel OpenClaw alternatifidir.

## Araç adları ve çakışmalar

Model tarafından görünen `exec` aracı kod modu aracıdır. Normal OpenClaw kabuk `exec` aracı etkinse, modelden gizlenir ve diğer araçlar gibi kataloglanır.

Konuk çalışma zamanı içinde:

- `tools.call("openclaw:core:exec", input)`, ilke izin veriyorsa kabuk exec aracını çağırabilir.
- `tools.exec(...)`, yalnızca kabuk exec katalog girdisinin belirsiz olmayan güvenli bir adı varsa kurulur.
- kod modu `exec` aracı, `tools` üzerinden hiçbir zaman özyinelemeli olarak kullanılamaz.

İki araç aynı güvenli kolaylık adına normalleştirilirse OpenClaw kolaylık işlevini atlar ve `tools.call(id, input)` kullanılmasını gerektirir.

## İç içe araç yürütme

Her iç içe araç çağrısı ana makine köprüsünden geçer ve OpenClaw'a yeniden girer.

İç içe yürütme şunları korur:

- etkin ajan kimliği
- oturum kimliği ve oturum anahtarı
- gönderen ve kanal bağlamı
- korumalı alan ilkesi
- onay ilkesi
- Plugin `before_tool_call` kancaları
- iptal sinyali
- mevcut olduğunda akış güncellemeleri
- yörünge ve denetim olayları

İç içe çağrılar, destek paketlerinin ne olduğunu gösterebilmesi için transkripte gerçek araç çağrıları olarak yansıtılır. Projeksiyon, üst kod modu araç çağrısını ve iç içe araç kimliğini tanımlar.

Paralel iç içe çağrılara `maxPendingToolCalls` değerine kadar izin verilir.

## Çalışma zamanı durumu

Her kod modu çalıştırmasının bir durum makinesi vardır:

- `running`: VM yürütülüyor veya iç içe çağrılar devam ediyor.
- `waiting`: VM anlık görüntüsü var ve `wait` ile sürdürülebilir.
- `completed`: son değer döndürüldü; anlık görüntü silindi.
- `failed`: hata döndürüldü; anlık görüntü silindi.
- `expired`: anlık görüntü veya bekleyen durum saklama süresini aştı; sürdürülemez.
- `aborted`: üst çalıştırma/oturum iptal edildi; anlık görüntü silindi.

Durum ajan çalıştırması, oturum ve araç çağrı kimliğiyle kapsamlandırılır. Farklı bir çalıştırma veya oturumdan gelen `wait` çağrısı başarısız olur.

Anlık görüntü depolaması sınırlandırılmıştır:

- çalıştırma başına maksimum anlık görüntü baytı
- süreç başına maksimum canlı anlık görüntü
- anlık görüntü TTL'i
- çalıştırma sonunda temizleme
- kalıcılığın desteklenmediği durumlarda Gateway kapatılırken temizleme

## QuickJS-WASI çalışma zamanı

OpenClaw, `quickjs-wasi` paketini sahip pakette doğrudan bağımlılık olarak yükler. Çalışma zamanı, proxy, PAC veya başka ilgisiz bağımlılıklar için kurulmuş geçişli bir kopyaya dayanmaz.

Çalışma zamanı sorumlulukları:

- QuickJS-WASI WebAssembly modülünü derlemek veya yüklemek
- her kod modu çalıştırması veya sürdürmesi için bir yalıtılmış VM oluşturmak
- ana makine geri çağrılarını kararlı adlarla kaydetmek
- bellek ve kesme sınırlarını ayarlamak
- JavaScript değerlendirmek
- bekleyen işleri boşaltmak
- askıya alınmış VM durumunun anlık görüntüsünü almak
- `wait` için anlık görüntüleri geri yüklemek
- terminal durumlardan sonra VM tutamaçlarını ve anlık görüntüleri elden çıkarmak

Çalışma zamanı, OpenClaw'ın ana olay döngüsünün dışında bir worker içinde yürütülür. Konuk tarafındaki sonsuz döngü Gateway sürecini süresiz olarak engellememelidir.

## TypeScript

TypeScript desteği yalnızca bir kaynak dönüştürmedir:

- kabul edilen girdi: bir TypeScript kod dizesi
- çıktı: QuickJS-WASI tarafından değerlendirilen JavaScript dizesi
- typechecking yok
- modül çözümleme yok
- v1'de `import` veya `require` yok
- tanılamalar `failed` sonuçları olarak döndürülür

TypeScript derleyicisi yalnızca TypeScript hücreleri için tembel olarak yüklenir. Düz JavaScript hücreleri ve devre dışı kod modu derleyiciyi yüklemez.

Dönüştürme, mümkün olduğunda yararlı satır numaralarını korumalıdır.

## Güvenlik sınırı

Model kodu düşmancadır. Çalışma zamanı derinlemesine savunma kullanır:

- QuickJS-WASI'yi ana olay döngüsünün dışında çalıştır
- `quickjs-wasi` paketini Codex veya geçişli bir paket üzerinden değil, doğrudan bağımlılık olarak yükle
- konukta dosya sistemi, ağ, alt süreç, modül içe aktarma, ortam değişkenleri veya ana makine global nesneleri yok
- QuickJS bellek ve kesme sınırlarını kullan
- üst süreç duvar saati zaman aşımını uygula
- çıktı, anlık görüntü, günlük ve bekleyen çağrı üst sınırlarını uygula
- ana makine köprüsü değerlerini dar bir JSON bağdaştırıcısı üzerinden serileştir
- ana makine hatalarını ana makine realm nesneleri yerine düz konuk hatalarına dönüştür
- zaman aşımı, iptal, oturum sonu veya süre dolumunda anlık görüntüleri bırak
- `exec`, `wait` ve Araç Arama denetim araçlarına özyinelemeli erişimi reddet
- kolaylık adı çakışmalarının katalog yardımcılarını gölgelemesini önle

Korumalı alan bir güvenlik katmanıdır. Operatörler yüksek riskli dağıtımlar için yine de işletim sistemi düzeyinde sağlamlaştırmaya ihtiyaç duyabilir.

## Hata kodları

```typescript
type CodeModeErrorCode =
  | "runtime_unavailable"
  | "invalid_config"
  | "invalid_input"
  | "unsupported_language"
  | "typescript_transform_failed"
  | "module_access_denied"
  | "timeout"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "snapshot_expired"
  | "snapshot_restore_failed"
  | "too_many_pending_tool_calls"
  | "nested_tool_failed"
  | "aborted"
  | "internal_error";
```

Konuğa döndürülen hatalar düz veridir. Ana makine `Error` örnekleri, stack nesneleri, prototipler ve ana makine işlevleri QuickJS içine geçmez.

## Telemetri

Kod modu şunları bildirir:

- modele gönderilen görünür araç adları
- gizli katalog boyutu ve kaynak dökümü
- `exec` ve `wait` sayıları
- iç içe arama, açıklama ve çağrı sayıları
- çağrılan iç içe araç kimlikleri
- zaman aşımı, bellek, anlık görüntü ve çıktı üst sınırı hataları
- anlık görüntü yaşam döngüsü olayları

Telemetri; sırlar, ham ortam değerleri veya mevcut OpenClaw yörünge ilkesinin ötesinde redakte edilmemiş araç girdileri içermemelidir.

## Hata ayıklama

Kod modu normal bir araç çalıştırmasından farklı davrandığında hedefli model taşıma günlüklemesi kullanın:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Yük biçimi hata ayıklaması için `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` kullanın. Bu, model isteğinin sınırlandırılmış, redakte edilmiş bir JSON anlık görüntüsünü günlüğe yazar; istemler ve ileti metni yine de görünebileceği için yalnızca hata ayıklarken kullanılmalıdır.

Akış hata ayıklaması için ilk beş redakte edilmiş SSE olayını günlüğe yazmak üzere `OPENCLAW_DEBUG_SSE=peek` kullanın. Kod modu ayrıca, kod modu yüzeyi etkinleştikten sonra son sağlayıcı yükü tam olarak `exec` ve `wait` içermiyorsa kapalı şekilde başarısız olur.

## Uygulama yerleşimi

Uygulama birimleri:

- yapılandırma sözleşmesi: `tools.codeMode`
- katalog oluşturucu: etkili araçlardan kompakt girdilere ve kimlik haritasına
- model yüzeyi bağdaştırıcısı: görünür araçları `exec` ve `wait` ile değiştir
- QuickJS-WASI çalışma zamanı bağdaştırıcısı: yükle, değerlendir, anlık görüntü al, geri yükle, elden çıkar
- worker gözetmeni: zaman aşımı, iptal, çökme yalıtımı
- köprü bağdaştırıcısı: JSON açısından güvenli ana makine geri çağrıları ve sonuç teslimi
- TypeScript dönüştürme bağdaştırıcısı
- anlık görüntü deposu: TTL, boyut üst sınırları, çalıştırma/oturum kapsamlandırması
- iç içe araç çağrıları için yörünge projeksiyonu
- telemetri sayaçları ve tanılamalar

Uygulama, Araç Arama'daki katalog ve yürütücü kavramlarını yeniden kullanır, ancak korumalı alan olarak `node:vm` alt sürecini kullanmaz.

## Doğrulama kontrol listesi

Kod modu kapsamı şunları kanıtlamalıdır:

- devre dışı yapılandırma mevcut araç görünürlüğünü değiştirmez
- `enabled: true` içermeyen nesne yapılandırması kod modunu devre dışı bırakır
- etkin yapılandırma, çalıştırma için araçlar aktif olduğunda modele yalnızca `exec` ve `wait` sunar
- ham araçsız çalıştırmalar, `disableTools` ve boş izin listeleri kod modu yük zorlamasını tetiklemez
- tüm etkili MCP dışı araçlar `ALL_TOOLS` içinde görünür
- reddedilen araçlar `ALL_TOOLS` içinde görünmez
- `tools.search`, `tools.describe` ve `tools.call`, OpenClaw araçları için çalışır
- `API.list("mcp")` ve `API.read("mcp/<server>.d.ts")`, köprü/araç çağrısı olmadan TypeScript tarzı MCP bildirimlerini sunar
- MCP ad alanı `$api()`, şemalar için satır içi geri dönüş olarak kullanılabilir kalır
- MCP ad alanı çağrıları, tek nesne girdisine sahip görünür MCP araçları için çalışır; doğrudan MCP katalog girdileri ise `tools.*` içinde bulunmaz
- Araç Arama kontrol araçları hem model yüzeyinden hem de gizli katalogdan gizlenir
- iç içe çağrılar onay ve hook davranışını korur
- kabuk `exec` modelden gizlenir, ancak izin verildiğinde katalog kimliğiyle çağrılabilir
- özyinelemeli kod modu `exec` ve `wait`, konuk koddan çağrılamaz
- TypeScript girdisi, devre dışı veya yalnızca JavaScript yollarında TypeScript yüklenmeden dönüştürülür ve değerlendirilir
- `import`, `require`, dosya sistemi, ağ ve ortam erişimi başarısız olur
- sonsuz döngüler zaman aşımına uğrar ve Gateway’i engelleyemez
- bellek sınırı hataları konuk VM’yi sonlandırır
- çıktı ve anlık görüntü sınırları tamamlanan ve askıya alınan çağrılar için uygulanır
- `wait`, askıya alınmış bir anlık görüntüyü sürdürür ve nihai değeri döndürür
- süresi dolmuş, iptal edilmiş, yanlış oturumlu ve bilinmeyen `runId` değerleri başarısız olur
- transkript yeniden oynatma ve kalıcılık kod modu kontrol çağrılarını korur
- transkript ve telemetri, iç içe araç çağrılarını açıkça gösterir

## E2E test planı

Çalışma zamanını değiştirirken bunları entegrasyon veya uçtan uca testler olarak çalıştırın:

1. `tools.codeMode.enabled: false` ile bir Gateway başlatın.
2. Küçük bir doğrudan araç kümesiyle bir ajan turu gönderin.
3. Model tarafından görülebilen araçların değişmediğini doğrulayın.
4. `tools.codeMode.enabled: true` ile yeniden başlatın.
5. OpenClaw, Plugin, MCP ve istemci test araçlarıyla bir ajan turu gönderin.
6. Model tarafından görülebilen araç listesinin tam olarak `exec`, `wait` olduğunu doğrulayın.
7. `exec` içinde `ALL_TOOLS` değerini okuyun ve etkili test araçlarının mevcut olduğunu doğrulayın.
8. `exec` içinde OpenClaw/Plugin/istemci araçlarını `tools.search`, `tools.describe` ve `tools.call` üzerinden çağırın.
9. `exec` içinde `API.list("mcp")` ve `API.read("mcp/<server>.d.ts")` çağırın ve bildirim dosyalarının görünür MCP araçlarını tanımladığını doğrulayın.
10. `exec` içinde MCP araçlarını `MCP.<server>.<tool>({ ...input })` üzerinden çağırın ve doğrudan MCP katalog girdilerinin `ALL_TOOLS` ve `tools.*` içinde bulunmadığını doğrulayın.
11. Reddedilen araçların bulunmadığını ve tahmin edilen kimlikle çağrılamadığını doğrulayın.
12. `exec`, `waiting` döndürdükten sonra çözümlenen iç içe bir araç çağrısı başlatın.
13. `wait` çağırın ve geri yüklenen VM’nin araç sonucunu aldığını doğrulayın.
14. Nihai yanıtın geri yüklemeden sonra üretilen çıktıyı içerdiğini doğrulayın.
15. Zaman aşımı, iptal ve anlık görüntü süresinin dolmasının çalışma zamanı durumunu temizlediğini doğrulayın.
16. Yörüngeyi dışa aktarın ve iç içe çağrıların üst kod modu çağrısı altında görünür olduğunu doğrulayın.

Bu sayfaya yapılan yalnızca dokümantasyon değişiklikleri yine de `pnpm check:docs` çalıştırmalıdır.

## İlgili

- [Araç Arama](/tr/tools/tool-search)
- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes)
- [Exec aracı](/tr/tools/exec)
- [Kod yürütme](/tr/tools/code-execution)
