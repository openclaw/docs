---
read_when:
    - OpenClaw'ın model bağlamını nasıl oluşturduğunu anlamak istiyorsunuz
    - Eski altyapı ile bir Plugin altyapısı arasında geçiş yapıyorsunuz
    - Bir bağlam motoru plugini oluşturuyorsunuz
sidebarTitle: Context engine
summary: 'Bağlam motoru: takılabilir bağlam derleme, Compaction ve alt ajan yaşam döngüsü'
title: Bağlam motoru
x-i18n:
    generated_at: "2026-07-16T16:53:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 05cb5eb01f002001354dc63b77cdb86f3e9f3bc51722bd943ac20c9e1566dc60
    source_path: concepts/context-engine.md
    workflow: 16
---

Bir **bağlam motoru**, OpenClaw'un her çalıştırma için model bağlamını nasıl oluşturduğunu denetler: hangi mesajların dahil edileceği, eski geçmişin nasıl özetleneceği ve alt ajan sınırları arasında bağlamın nasıl yönetileceği.

OpenClaw, yerleşik bir `legacy` motoruyla birlikte gelir ve varsayılan olarak bunu kullanır. Yalnızca farklı bir birleştirme, Compaction veya oturumlar arası hatırlama davranışı istediğinizde bir Plugin motoru kurup seçin.

## Hızlı başlangıç

<Steps>
  <Step title="Hangi motorun etkin olduğunu denetleyin">
    ```bash
    openclaw doctor
    # veya yapılandırmayı doğrudan inceleyin:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Bir Plugin motoru kurun">
    Bağlam motoru Pluginleri, diğer OpenClaw Pluginleri gibi kurulur.

    <Tabs>
      <Tab title="npm'den">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Yerel bir yoldan">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Motoru etkinleştirip seçin">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // Pluginin kayıtlı motor kimliğiyle eşleşmelidir
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugine özgü yapılandırma buraya gelir (Pluginin belgelerine bakın)
          },
        },
      },
    }
    ```

    Kurulum ve yapılandırmadan sonra Gateway'i yeniden başlatın.

  </Step>
  <Step title="Eski motora geri dönün (isteğe bağlı)">
    `contextEngine` değerini `"legacy"` olarak ayarlayın (veya anahtarı tamamen kaldırın; varsayılan değer `"legacy"` değeridir).
  </Step>
</Steps>

## Nasıl çalışır?

OpenClaw her model istemi çalıştırdığında bağlam motoru, yaşam döngüsünün dört noktasında sürece katılır:

<AccordionGroup>
  <Accordion title="1. Alma">
    Oturuma yeni bir mesaj eklendiğinde çağrılır. Motor, mesajı kendi veri deposunda saklayabilir veya dizine ekleyebilir.
  </Accordion>
  <Accordion title="2. Birleştirme">
    Her model çalıştırmasından önce çağrılır. Motor, belirteç bütçesine sığan sıralı bir mesaj kümesi (ve isteğe bağlı bir `systemPromptAddition`) döndürür.
  </Accordion>
  <Accordion title="3. Compaction">
    Bağlam penceresi dolduğunda veya kullanıcı `/compact` komutunu çalıştırdığında çağrılır. Motor, alan açmak için eski geçmişi özetler.
  </Accordion>
  <Accordion title="4. Tur sonrası">
    Bir çalıştırma tamamlandıktan sonra çağrılır. Motor durumu kalıcı hâle getirebilir, arka planda Compaction başlatabilir veya dizinleri güncelleyebilir.
  </Accordion>
</AccordionGroup>

Motorlar ayrıca önyüklemeden, başarılı bir turdan veya Compaction'dan sonra transkript bakımı (`runtimeContext.rewriteTranscriptEntries()` aracılığıyla güvenli yeniden yazımlar) için isteğe bağlı bir `maintain()` yöntemi uygulayabilir. Yanıtı engellemek yerine ertelenmiş iş olarak çalıştırmak için `info.turnMaintenanceMode: "background"` değerini ayarlayın.

Paketle birlikte gelen ACP dışı Codex çalıştırma altyapısında OpenClaw, birleştirilmiş bağlamı Codex geliştirici talimatlarına ve geçerli turun istemine yansıtarak aynı yaşam döngüsünü uygular. Codex, kendi yerel iş parçacığı geçmişinin ve yerel sıkıştırıcısının sahipliğini sürdürür.

### Alt ajan yaşam döngüsü (isteğe bağlı)

OpenClaw, isteğe bağlı iki alt ajan yaşam döngüsü kancasını çağırır:

<ParamField path="prepareSubagentSpawn" type="method">
  Bir alt çalıştırma başlamadan önce paylaşılan bağlam durumunu hazırlayın. Kanca; üst/alt oturum anahtarlarını, `contextMode` (`isolated` veya `fork`), kullanılabilir transkript kimliklerini/dosyalarını ve isteğe bağlı TTL'yi alır. Bir geri alma tanıtıcısı döndürürse OpenClaw, hazırlık başarılı olduktan sonra oluşturma başarısız olduğunda bunu çağırır. `lightContext` isteyen ve `contextMode="isolated"` olarak çözümlenen yerel alt ajan oluşturmaları, alt oturumun bağlam motoru tarafından yönetilen oluşturma öncesi durum olmadan hafif önyükleme bağlamından başlaması için bu kancayı bilinçli olarak atlar.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Bir alt ajan oturumu tamamlandığında veya temizlendiğinde temizlik yapın.
</ParamField>

### Sistem istemi eki

`assemble` yöntemi bir `systemPromptAddition` dizesi döndürebilir. OpenClaw bunu çalıştırmanın sistem isteminin başına ekler. Bu, motorların statik çalışma alanı dosyaları gerektirmeden dinamik hatırlama yönlendirmesi, erişim talimatları veya bağlama duyarlı ipuçları eklemesini sağlar.

## Eski motor

Yerleşik `legacy` motoru, OpenClaw'un özgün davranışını korur:

- **Alma**: işlem yapmaz (mesajların kalıcı hâle getirilmesini doğrudan oturum yöneticisi gerçekleştirir).
- **Birleştirme**: değişiklik yapmadan geçirir (bağlam birleştirmesini çalışma zamanındaki mevcut temizle → doğrula → sınırla işlem hattı gerçekleştirir).
- **Compaction**: eski mesajların tek bir özetini oluşturan ve son mesajları değiştirmeden koruyan yerleşik özetleme Compaction'ına devreder.
- **Tur sonrası**: işlem yapmaz.

Eski motor, araç kaydetmez veya bir `systemPromptAddition` sağlamaz.

Herhangi bir `plugins.slots.contextEngine` ayarlanmadığında (veya `"legacy"` olarak ayarlandığında) bu motor otomatik olarak kullanılır.

## Plugin motorları

Bir Plugin, Plugin API'sini kullanarak bir bağlam motoru kaydedebilir:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Mesajı veri deponuzda saklayın
      return { ingested: true };
    },

    async assemble({
      sessionId,
      sessionKey,
      messages,
      tokenBudget,
      availableTools,
      citationsMode,
    }) {
      // Bütçeye sığan mesajları döndürün
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Eski bağlamı özetleyin
      return { ok: true, compacted: true };
    },
  }));
}
```

`ctx` fabrikası, Pluginlerin ilk yaşam döngüsü kancası çalışmadan önce
ajan veya çalışma alanı bazında durumu başlatabilmesi için isteğe bağlı `config`,
`agentDir` ve `workspaceDir` değerlerini içerir.

Ardından yapılandırmada etkinleştirin:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### ContextEngine arayüzü

Gerekli üyeler:

| Üye               | Tür      | Amaç                                                        |
| ------------------ | -------- | ----------------------------------------------------------- |
| `info`             | Özellik  | Motor kimliği, adı, sürümü ve Compaction'ın sahibi olup olmadığı |
| `ingest(params)`   | Yöntem   | Tek bir mesajı saklama                                      |
| `assemble(params)` | Yöntem   | Bir model çalıştırması için bağlam oluşturma (`AssembleResult` döndürür) |
| `compact(params)`  | Yöntem   | Bağlamı özetleme/azaltma                                    |

`assemble`, şunları içeren bir `AssembleResult` döndürür:

<ParamField path="messages" type="Message[]" required>
  Modele gönderilecek sıralı mesajlar.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Motorun birleştirilmiş bağlamdaki toplam belirteç sayısı tahmini. OpenClaw bunu Compaction eşiği kararları ve tanılama raporlaması için kullanır.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Sistem isteminin başına eklenir.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Çalıştırıcının önleyici taşma ön denetimleri için hangi belirteç tahminini
  kullandığını belirler. Varsayılan değer `"assembled"` olup Compaction'ın
  sahibi olmayan motorlarda yalnızca birleştirilmiş istemin tahmininin denetlendiği
  anlamına gelir. `ownsCompaction: true` ayarını kullanan motorlar kendi istem kabulünü
  yönetir; bu nedenle OpenClaw varsayılan olarak genel istem öncesi ön denetimi atlar.
  `"preassembly_may_overflow"` değerini yalnızca birleştirilmiş görünümünüz temel transkriptteki
  taşma riskini gizleyebiliyorsa ayarlayın; bu durumda çalıştırıcı genel ön denetimi
  etkin tutar ve önleyici Compaction yapılıp yapılmayacağına karar verirken birleştirilmiş
  tahmin ile birleştirme öncesi (pencerelenmemiş) oturum geçmişi tahmininin en yüksek
  değerini alır. Her iki durumda da model, döndürdüğünüz mesajları görür;
  `promptAuthority` yalnızca ön denetimi etkiler.
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  Kalıcı arka uç iş parçacıkları bulunan ana makineler (örneğin Codex uygulama sunucusu) için isteğe bağlı yansıtma yaşam döngüsü. Kararlı bir `epoch` ile `mode: "thread_bootstrap"`, ana makineden birleştirilmiş bağlamı dönem başına bir kez eklemesini ve her turda yeniden yansıtmak yerine dönem değişene kadar arka uç iş parçacığını yeniden kullanmasını ister. Normal tur başına yansıtma için bu alanı atlayın.
</ParamField>

`compact`, bir `CompactResult` döndürür. Compaction etkin oturum
kimliğini değiştirdiğinde `result.sessionTarget` (oturum kimliğini ve depo kapsamını
taşıyan türü belirlenmiş bir `ContextEngineSessionTarget`), sonraki yeniden denemenin veya
turun kullanması gereken ardıl oturumu tanımlar; `result.sessionId` ardıl kimliğini yansıtır.

İsteğe bağlı üyeler:

| Üye                           | Tür    | Amaç                                                                                                                                             |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bootstrap(params)`            | Yöntem | Bir oturum için motor durumunu başlatma. Motor bir oturumu ilk kez gördüğünde bir kez çağrılır (ör. geçmişi içe aktarma).                         |
| `maintain(params)`             | Yöntem | Önyükleme, başarılı bir tur veya Compaction sonrasında transkript bakımı. Güvenli yeniden yazımlar için `runtimeContext.rewriteTranscriptEntries()` kullanın. |
| `ingestBatch(params)`          | Yöntem | Tamamlanmış bir turu toplu olarak alma. Bir çalıştırma tamamlandıktan sonra o turdaki tüm mesajlarla birlikte tek seferde çağrılır.                |
| `afterTurn(params)`            | Yöntem | Çalıştırma sonrası yaşam döngüsü işleri (durumu kalıcı hâle getirme, arka planda Compaction başlatma).                                            |
| `prepareSubagentSpawn(params)` | Yöntem | Alt oturum başlamadan önce onun için paylaşılan durumu hazırlama.                                                                                  |
| `onSubagentEnded(params)`      | Yöntem | Bir alt ajan sona erdikten sonra temizlik yapma.                                                                                                  |
| `dispose()`                    | Yöntem | Kaynakları serbest bırakma. Oturum başına değil, Gateway kapanırken veya Plugin yeniden yüklenirken çağrılır.                                     |

### Çalışma zamanı ayarları

OpenClaw içinde çalışan yaşam döngüsü kancaları, isteğe bağlı bir
`runtimeSettings` nesnesi alır. Bu; sürümlendirilmiş, salt okunur bir iç
üretici/tüketici API yüzeyidir: OpenClaw bunu seçili bağlam motoru için üretir
ve bağlam motoru yaşam döngüsü kancaları içinde tüketir. Doğrudan kullanıcılara
sunulmaz ve özel bir raporlama yüzeyi oluşturmaz.

- `schemaVersion`: şu anda `1`
- `runtime`: OpenClaw ana makinesi, çalışma zamanı modu (`normal`, `fallback` veya
  `degraded`) ve isteğe bağlı test düzeneği/çalışma zamanı kimlikleri
- `contextEngineSelection`: seçilen bağlam motoru kimliği ve seçim kaynağı
- `executionHost`: kancayı çağıran yüzeyin ana makine kimliği ve etiketi
- `model`: istenen model, çözümlenen model, sağlayıcı ve isteğe bağlı model ailesi
- `limits`: biliniyorsa istem belirteci bütçesi ve maksimum çıktı belirteçleri
- `diagnostics`: biliniyorsa kapalı hata durumundaki geri dönüş ve kısıtlı çalışma neden kodları

Bilinmeyebilen alanlar `null` olarak gösterilir; çalışma zamanı modu ve seçim kaynağı gibi
ayırt edici alanlar null olamaz. Eski motorlar uyumlu kalır:
katı bir eski motor `runtimeSettings` özelliğini bilinmeyen bir özellik olarak reddederse
OpenClaw, motoru karantinaya almak yerine yaşam döngüsü çağrısını bu özellik olmadan
yeniden dener.

### Ana makine gereksinimleri

Bağlam motorları, `info.hostRequirements` üzerinde ana makine yeteneği gereksinimleri bildirebilir.
OpenClaw, işlemi başlatmadan önce bu gereksinimleri denetler ve seçilen çalışma zamanı
bunları karşılayamadığında açıklayıcı bir hatayla kapalı durumda başarısız olur.

Agent çalıştırmalarında, motorun gerçek model istemini
`assemble()` aracılığıyla denetlemesi gerekiyorsa `assemble-before-prompt` bildirin:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Yerel Codex veya OpenClaw gömülü çalışma zamanını kullanın ya da eski bağlam motorunu seçin.",
    },
  },
}
```

Yerel Codex ve OpenClaw gömülü agent çalıştırmaları `assemble-before-prompt` gereksinimini karşılar.
Genel CLI arka uçları bunu karşılamaz; dolayısıyla bunu gerektiren motorlar
CLI işlemi başlamadan önce reddedilir.

### Hata yalıtımı

OpenClaw, seçilen plugin motorunu temel yanıt yolundan yalıtır. Eski olmayan bir
motor eksikse, sözleşme doğrulamasında başarısız olursa, fabrika oluşturulurken
veya bir yaşam döngüsü yönteminde hata oluşturursa OpenClaw, ilgili motoru
geçerli Gateway işlemi için karantinaya alır ve bağlam motoru işlerini
yerleşik `legacy` motoruna düşürür. Operatörün, agent sessiz kalmadan
plugini onarabilmesi, güncelleyebilmesi veya devre dışı bırakabilmesi için hata,
başarısız olan işlemle birlikte günlüğe kaydedilir.

Ana makine gereksinimi hataları farklıdır: Bir motor, çalışma zamanında gerekli
bir yeteneğin bulunmadığını bildirirse OpenClaw, çalıştırmayı başlatmadan önce
kapalı durumda başarısız olur. Bu, desteklenmeyen bir ana makinede çalıştırılmaları
durumunda durumu bozacak motorları korur.

### ownsCompaction

`ownsCompaction`, OpenClaw çalışma zamanının yerleşik deneme içi otomatik Compaction özelliğinin çalıştırma boyunca etkin kalıp kalmayacağını denetler:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Compaction davranışının sahibi motordur. OpenClaw, bu çalıştırma için OpenClaw çalışma zamanının yerleşik otomatik Compaction özelliğini ve genel istem öncesi taşma ön denetimini devre dışı bırakır; `/compact`, sağlayıcı taşması kurtarma Compaction işlemi ve `afterTurn()` içinde gerçekleştirmek istediği proaktif Compaction işlemlerinden motorun `compact()` uygulaması sorumludur. Motor, `assemble()` üzerinden `promptAuthority: "preassembly_may_overflow"` döndürdüğünde OpenClaw istem öncesi taşma korumasını yine çalıştırır.
  </Accordion>
  <Accordion title="ownsCompaction: false veya ayarlanmamış">
    OpenClaw çalışma zamanının yerleşik otomatik Compaction özelliği istem yürütülürken yine çalışabilir; ancak etkin motorun `compact()` yöntemi, `/compact` ve taşma kurtarma için yine çağrılır.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false`, OpenClaw'ın otomatik olarak eski motorun Compaction yoluna geri döndüğü anlamına **gelmez**.
</Warning>

Bu, iki geçerli plugin kalıbı olduğu anlamına gelir:

<Tabs>
  <Tab title="Sahiplenme modu">
    Kendi Compaction algoritmanızı uygulayın ve `ownsCompaction: true` olarak ayarlayın.
  </Tab>
  <Tab title="Yetkilendirme modu">
    `ownsCompaction: false` olarak ayarlayın ve OpenClaw'ın yerleşik Compaction davranışını kullanmak için `compact()` öğesinin `openclaw/plugin-sdk/core` üzerinden `delegateCompactionToRuntime(...)` çağırmasını sağlayın.
  </Tab>
</Tabs>

İşlem yapmayan bir `compact()`, söz konusu motor yuvasının normal `/compact` ve taşma kurtarma Compaction yolunu devre dışı bıraktığından, etkin ve sahiplenmeyen bir motor için güvenli değildir.

## Yapılandırma başvurusu

```json5
{
  plugins: {
    slots: {
      // Etkin bağlam motorunu seçin. Varsayılan: "legacy".
      // Bir plugin motoru kullanmak için plugin kimliğine ayarlayın.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Yuva çalışma zamanında özeldir: Belirli bir çalıştırma veya Compaction işlemi için yalnızca bir kayıtlı bağlam motoru çözümlenir. Etkinleştirilmiş diğer `kind: "context-engine"` pluginleri yine yüklenebilir ve kayıt kodlarını çalıştırabilir; `plugins.slots.contextEngine`, yalnızca OpenClaw bir bağlam motoruna ihtiyaç duyduğunda hangi kayıtlı motor kimliğini çözümleyeceğini seçer.
</Note>

<Note>
**Plugin kaldırma:** `plugins.slots.contextEngine` olarak seçili olan plugini kaldırdığınızda OpenClaw, yuvayı varsayılana (`legacy`) geri döndürür. Aynı sıfırlama davranışı `plugins.slots.memory` için de geçerlidir. Yapılandırmanın elle düzenlenmesi gerekmez.
</Note>

## Compaction ve bellekle ilişkisi

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction, bağlam motorunun sorumluluklarından biridir. Eski motor, işi OpenClaw'ın yerleşik özetleme özelliğine devreder. Plugin motorları herhangi bir Compaction stratejisi (DAG özetleri, vektör tabanlı getirme vb.) uygulayabilir.
  </Accordion>
  <Accordion title="Bellek pluginleri">
    Bellek pluginleri (`plugins.slots.memory`) bağlam motorlarından ayrıdır. Bellek pluginleri arama/getirme sağlar; bağlam motorları ise modelin ne göreceğini denetler. Birlikte çalışabilirler; bir bağlam motoru oluşturma sırasında bellek plugini verilerini kullanabilir. Etkin bellek istemi yolunu kullanmak isteyen plugin motorları, etkin bellek istemi bölümlerini başa eklenmeye hazır bir `systemPromptAddition` öğesine dönüştüren `openclaw/plugin-sdk/core` içindeki `buildMemorySystemPromptAddition(...)` öğesini tercih etmelidir. Bir motor daha düşük düzeyli denetime ihtiyaç duyarsa `buildActiveMemoryPromptSection(...)` aracılığıyla `openclaw/plugin-sdk/memory-host-core` üzerinden ham satırları almaya devam edebilir.
  </Accordion>
  <Accordion title="Oturum budama">
    Eski araç sonuçlarının bellek içinde kırpılması, hangi bağlam motorunun etkin olduğundan bağımsız olarak çalışmaya devam eder.
  </Accordion>
</AccordionGroup>

## İpuçları

- Motorunuzun doğru şekilde yüklendiğini doğrulamak için `openclaw doctor` kullanın.
- Motorlar arasında geçiş yapıldığında mevcut oturumlar geçerli geçmişleriyle devam eder. Yeni motor gelecekteki çalıştırmaları devralır.
- Motor hataları günlüğe kaydedilir ve seçilen plugin motoru geçerli Gateway işlemi için karantinaya alınır. Yanıtların devam edebilmesi amacıyla OpenClaw, kullanıcı etkileşimleri için `legacy` öğesine geri döner; ancak bozuk plugini yine de onarmanız, güncellemeniz, devre dışı bırakmanız veya kaldırmanız gerekir.
- Geliştirme amacıyla yerel bir plugin dizinini kopyalamadan bağlamak için `openclaw plugins install -l ./my-engine` kullanın.

## İlgili

- [Compaction](/tr/concepts/compaction) - uzun konuşmaları özetleme
- [Bağlam](/tr/concepts/context) - agent etkileşimleri için bağlamın nasıl oluşturulduğu
- [Plugin Mimarisi](/tr/plugins/architecture) - bağlam motoru pluginlerini kaydetme
- [Plugin manifesti](/tr/plugins/manifest) - plugin manifesti alanları
- [Pluginler](/tr/tools/plugin) - pluginlere genel bakış
