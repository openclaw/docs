---
read_when:
    - OpenClaw'ın model bağlamını nasıl bir araya getirdiğini anlamak istiyorsunuz
    - Eski motor ile bir Plugin motoru arasında geçiş yapıyorsunuz
    - Bir bağlam motoru Plugin'i oluşturuyorsunuz
sidebarTitle: Context engine
summary: 'Bağlam motoru: takılabilir bağlam derleme, Compaction ve alt ajan yaşam döngüsü'
title: Bağlam motoru
x-i18n:
    generated_at: "2026-06-28T00:27:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 124b6daf52f3d58f756352e2e169697541a8b6e67aecaa5a219bed15bda801cd
    source_path: concepts/context-engine.md
    workflow: 16
---

Bir **bağlam motoru**, OpenClaw’ın her çalıştırma için model bağlamını nasıl oluşturduğunu denetler: hangi iletilerin dahil edileceğini, eski geçmişin nasıl özetleneceğini ve alt ajan sınırları boyunca bağlamın nasıl yönetileceğini.

OpenClaw, yerleşik bir `legacy` motoruyla gelir ve varsayılan olarak bunu kullanır; çoğu kullanıcının bunu değiştirmesi gerekmez. Yalnızca farklı derleme, sıkıştırma veya oturumlar arası hatırlama davranışı istediğinizde bir Plugin motoru kurup seçin.

## Hızlı başlangıç

<Steps>
  <Step title="Hangi motorun etkin olduğunu denetleyin">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Bir Plugin motoru kurun">
    Bağlam motoru Plugin’leri, diğer tüm OpenClaw Plugin’leri gibi kurulur.

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
  <Step title="Motoru etkinleştirin ve seçin">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // must match the plugin's registered engine id
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-specific config goes here (see the plugin's docs)
          },
        },
      },
    }
    ```

    Kurulum ve yapılandırmadan sonra Gateway’i yeniden başlatın.

  </Step>
  <Step title="Legacy’ye geri dönün (isteğe bağlı)">
    `contextEngine` değerini `"legacy"` olarak ayarlayın (veya anahtarı tamamen kaldırın; `"legacy"` varsayılandır).
  </Step>
</Steps>

## Nasıl çalışır

OpenClaw her model istemi çalıştırdığında, bağlam motoru dört yaşam döngüsü noktasında devreye girer:

<AccordionGroup>
  <Accordion title="1. İçeri al">
    Oturuma yeni bir ileti eklendiğinde çağrılır. Motor, iletiyi kendi veri deposunda saklayabilir veya dizine ekleyebilir.
  </Accordion>
  <Accordion title="2. Birleştir">
    Her model çalıştırmasından önce çağrılır. Motor, token bütçesine sığan sıralı bir ileti kümesi (ve isteğe bağlı bir `systemPromptAddition`) döndürür.
  </Accordion>
  <Accordion title="3. Sıkıştır">
    Bağlam penceresi dolduğunda veya kullanıcı `/compact` çalıştırdığında çağrılır. Motor, yer açmak için eski geçmişi özetler.
  </Accordion>
  <Accordion title="4. Turdan sonra">
    Bir çalıştırma tamamlandıktan sonra çağrılır. Motor durumu kalıcılaştırabilir, arka plan sıkıştırmasını tetikleyebilir veya dizinleri güncelleyebilir.
  </Accordion>
</AccordionGroup>

Paketle gelen ACP dışı Codex donanımı için OpenClaw, birleştirilmiş bağlamı Codex geliştirici talimatlarına ve geçerli tur istemine yansıtarak aynı yaşam döngüsünü uygular. Codex, kendi yerel iş parçacığı geçmişine ve yerel sıkıştırıcısına sahip olmaya devam eder.

### Alt ajan yaşam döngüsü (isteğe bağlı)

OpenClaw iki isteğe bağlı alt ajan yaşam döngüsü kancasını çağırır:

<ParamField path="prepareSubagentSpawn" type="method">
  Bir alt çalıştırma başlamadan önce paylaşılan bağlam durumunu hazırlar. Kanca üst/alt oturum anahtarlarını, `contextMode` değerini (`isolated` veya `fork`), kullanılabilir transkript kimliklerini/dosyalarını ve isteğe bağlı TTL’yi alır. Bir geri alma tanıtıcısı döndürürse OpenClaw, hazırlık başarılı olduktan sonra oluşturma başarısız olduğunda bunu çağırır. `lightContext` isteyen ve `contextMode="isolated"` olarak çözümlenen yerel alt ajan oluşturma işlemleri, alt öğenin bağlam motoru tarafından yönetilen oluşturma öncesi durum olmadan hafif başlangıç bağlamından başlaması için bu kancayı bilinçli olarak atlar.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Bir alt ajan oturumu tamamlandığında veya süpürüldüğünde temizleme yapar.
</ParamField>

### Sistem istemi eklemesi

`assemble` yöntemi bir `systemPromptAddition` dizesi döndürebilir. OpenClaw bunu çalıştırmanın sistem isteminin başına ekler. Bu, motorların statik çalışma alanı dosyaları gerektirmeden dinamik hatırlama yönlendirmesi, alma talimatları veya bağlama duyarlı ipuçları enjekte etmesini sağlar.

## Legacy motor

Yerleşik `legacy` motoru, OpenClaw’ın özgün davranışını korur:

- **İçeri al**: işlem yoktur (oturum yöneticisi ileti kalıcılığını doğrudan yönetir).
- **Birleştir**: geçişli çalışır (çalışma zamanındaki mevcut temizle → doğrula → sınırla hattı bağlam birleştirmeyi yönetir).
- **Sıkıştır**: eski iletilerin tek bir özetini oluşturan ve yakın zamandaki iletileri olduğu gibi tutan yerleşik özetleme sıkıştırmasına devreder.
- **Turdan sonra**: işlem yoktur.

Legacy motor araç kaydetmez veya `systemPromptAddition` sağlamaz.

`plugins.slots.contextEngine` ayarlanmadığında (veya `"legacy"` olarak ayarlandığında), bu motor otomatik olarak kullanılır.

## Plugin motorları

Bir Plugin, Plugin API’sini kullanarak bir bağlam motoru kaydedebilir:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

`ctx` fabrikası, ilk yaşam döngüsü kancası çalışmadan önce Plugin’lerin ajan başına veya çalışma alanı başına durum başlatabilmesi için isteğe bağlı `config`, `agentDir` ve `workspaceDir` değerlerini içerir.

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

| Üye                | Tür      | Amaç                                                     |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Özellik  | Motor kimliği, adı, sürümü ve sıkıştırmaya sahip olup olmadığı |
| `ingest(params)`   | Yöntem   | Tek bir iletiyi saklar                                  |
| `assemble(params)` | Yöntem   | Bir model çalıştırması için bağlam oluşturur (`AssembleResult` döndürür) |
| `compact(params)`  | Yöntem   | Bağlamı özetler/azaltır                                 |

`assemble`, şunları içeren bir `AssembleResult` döndürür:

<ParamField path="messages" type="Message[]" required>
  Modele gönderilecek sıralı iletiler.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Motorun, birleştirilmiş bağlamdaki toplam token sayısına ilişkin tahmini. OpenClaw bunu sıkıştırma eşiği kararları ve tanılama raporlaması için kullanır.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Sistem isteminin başına eklenir.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Çalıştırıcının önleyici taşma ön denetimleri için hangi token tahminini kullanacağını denetler. Varsayılan değer `"assembled"`’dır; bu, yalnızca birleştirilmiş istemin tahmininin denetlendiği anlamına gelir ve pencerelenmiş, kendi içinde yeterli bir bağlam döndüren motorlar için uygundur. Birleştirilmiş görünümünüz yalnızca alttaki transkriptte taşma riskini gizleyebildiğinde `"preassembly_may_overflow"` olarak ayarlayın; çalıştırıcı bu durumda önleyici olarak sıkıştırma yapıp yapmayacağına karar verirken birleştirilmiş tahmin ile birleştirme öncesi (pencerelenmemiş) oturum geçmişi tahmininin maksimumunu alır. Her iki durumda da döndürdüğünüz iletiler modelin gördüğü şey olmaya devam eder; `promptAuthority` yalnızca ön denetimi etkiler.
</ParamField>

`compact` bir `CompactResult` döndürür. Sıkıştırma etkin transkripti döndürdüğünde, `result.sessionId` ve `result.sessionFile`, sonraki yeniden denemenin veya turun kullanması gereken ardıl oturumu tanımlar.

İsteğe bağlı üyeler:

| Üye                            | Tür    | Amaç                                                                                                            |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Yöntem | Bir oturum için motor durumunu başlatır. Motor bir oturumu ilk kez gördüğünde bir kez çağrılır (ör. geçmiş içe aktarma). |
| `ingestBatch(params)`          | Yöntem | Tamamlanmış bir turu toplu olarak içeri alır. Bir çalıştırma tamamlandıktan sonra, o turdaki tüm iletilerle birlikte çağrılır. |
| `afterTurn(params)`            | Yöntem | Çalıştırma sonrası yaşam döngüsü işi (durumu kalıcılaştırma, arka plan sıkıştırmasını tetikleme).              |
| `prepareSubagentSpawn(params)` | Yöntem | Başlamadan önce bir alt oturum için paylaşılan durumu ayarlar.                                                  |
| `onSubagentEnded(params)`      | Yöntem | Bir alt ajan sona erdikten sonra temizleme yapar.                                                              |
| `dispose()`                    | Yöntem | Kaynakları serbest bırakır. Gateway kapatılırken veya Plugin yeniden yüklenirken çağrılır; oturum başına değildir. |

### Çalışma zamanı ayarları

OpenClaw içinde çalışan yaşam döngüsü kancaları isteğe bağlı bir `runtimeSettings` nesnesi alır. Bu, sürümlü, salt okunur bir dahili üretici/tüketici API yüzeyidir: OpenClaw bunu seçili bağlam motoru için üretir ve bağlam motoru bunu yaşam döngüsü kancaları içinde tüketir. Doğrudan kullanıcılara işlenmez ve özel bir raporlama yüzeyi oluşturmaz.

- `schemaVersion`: şu anda `1`
- `runtime`: OpenClaw ana makinesi, çalışma zamanı modu (`normal`, `fallback` veya `degraded`) ve isteğe bağlı donanım/çalışma zamanı kimlikleri
- `contextEngineSelection`: seçili bağlam motoru kimliği ve seçim kaynağı
- `executionHost`: kancayı çağıran yüzey için ana makine kimliği ve etiketi
- `model`: istenen model, çözümlenen model, sağlayıcı ve isteğe bağlı model ailesi
- `limits`: bilindiğinde istem token bütçesi ve maksimum çıktı token sayısı
- `diagnostics`: bilindiğinde kapalı fallback ve degraded neden kodları

Bilinmeyebilecek alanlar `null` olarak temsil edilir; çalışma zamanı modu ve seçim kaynağı gibi ayırıcı alanlar null olamaz. Eski motorlar uyumlu kalır: katı bir legacy motor `runtimeSettings` değerini bilinmeyen bir özellik olarak reddederse OpenClaw, motoru karantinaya almak yerine yaşam döngüsü çağrısını bu olmadan yeniden dener.

### Ana makine gereksinimleri

Bağlam motorları, `info.hostRequirements` üzerinde ana makine yetenek gereksinimleri bildirebilir. OpenClaw bu gereksinimleri işlemi başlatmadan önce denetler ve seçili çalışma zamanı bunları karşılayamadığında açıklayıcı bir hatayla kapalı başarısız olur.

Ajan çalıştırmaları için, motorun gerçek model istemini `assemble()` üzerinden denetlemesi gerektiğinde `assemble-before-prompt` bildirin:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

Yerel Codex ve OpenClaw gömülü ajan çalıştırmaları `assemble-before-prompt` değerini karşılar. Genel CLI arka uçları bunu karşılamaz; bu nedenle bunu gerektiren motorlar CLI süreci başlamadan önce reddedilir.

### Hata yalıtımı

OpenClaw, seçili Plugin motorunu çekirdek yanıt yolundan yalıtır. Legacy olmayan bir motor eksikse, sözleşme doğrulamasında başarısız olursa, fabrika oluşturma sırasında hata fırlatırsa veya bir yaşam döngüsü yönteminden hata fırlatırsa OpenClaw bu motoru geçerli Gateway süreci için karantinaya alır ve bağlam motoru işini yerleşik `legacy` motora düşürür. Hata, başarısız işlemle birlikte günlüğe yazılır; böylece operatör ajan sessizleşmeden Plugin’i onarabilir, güncelleyebilir veya devre dışı bırakabilir.

Ana makine gereksinimi hataları farklıdır: bir motor, bir çalışma zamanının gerekli bir yetenekten yoksun olduğunu bildirdiğinde, OpenClaw çalıştırmayı başlatmadan önce kapalı şekilde başarısız olur. Bu, desteklenmeyen bir ana makinede çalıştıklarında durumu bozabilecek motorları korur.

### ownsCompaction

`ownsCompaction`, OpenClaw çalışma zamanının yerleşik deneme içi otomatik Compaction özelliğinin çalıştırma için etkin kalıp kalmayacağını denetler:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Motor, Compaction davranışının sahibidir. OpenClaw, o çalıştırma için OpenClaw çalışma zamanının yerleşik otomatik Compaction özelliğini devre dışı bırakır ve motorun `compact()` uygulaması `/compact`, taşma kurtarma Compaction işlemi ve `afterTurn()` içinde yapmak istediği proaktif Compaction işlemlerinden sorumludur. OpenClaw yine de ön istem taşma korumasını çalıştırabilir; tam dökümün taşacağını öngördüğünde, kurtarma yolu başka bir istem göndermeden önce etkin motorun `compact()` yöntemini çağırır.
  </Accordion>
  <Accordion title="ownsCompaction: false veya ayarlanmamış">
    OpenClaw çalışma zamanının yerleşik otomatik Compaction özelliği istem yürütmesi sırasında yine çalışabilir, ancak etkin motorun `compact()` yöntemi `/compact` ve taşma kurtarma için yine çağrılır.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false`, OpenClaw'ın otomatik olarak eski motorun Compaction yoluna geri döneceği anlamına **gelmez**.
</Warning>

Bu, iki geçerli Plugin deseni olduğu anlamına gelir:

<Tabs>
  <Tab title="Sahiplenme modu">
    Kendi Compaction algoritmanızı uygulayın ve `ownsCompaction: true` olarak ayarlayın.
  </Tab>
  <Tab title="Devretme modu">
    `ownsCompaction: false` olarak ayarlayın ve OpenClaw'ın yerleşik Compaction davranışını kullanmak için `compact()` yönteminin `openclaw/plugin-sdk/core` içinden `delegateCompactionToRuntime(...)` çağırmasını sağlayın.
  </Tab>
</Tabs>

İşlem yapmayan bir `compact()`, etkin ve sahiplenmeyen bir motor için güvenli değildir; çünkü o motor yuvası için normal `/compact` ve taşma kurtarma Compaction yolunu devre dışı bırakır.

## Yapılandırma başvurusu

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Yuva çalışma zamanında özeldir - belirli bir çalıştırma veya Compaction işlemi için yalnızca bir kayıtlı bağlam motoru çözümlenir. Etkinleştirilmiş diğer `kind: "context-engine"` Plugin'leri yine yüklenebilir ve kayıt kodlarını çalıştırabilir; `plugins.slots.contextEngine` yalnızca OpenClaw bir bağlam motoruna ihtiyaç duyduğunda hangi kayıtlı motor kimliğini çözümleyeceğini seçer.
</Note>

<Note>
**Plugin kaldırma:** şu anda `plugins.slots.contextEngine` olarak seçili Plugin'i kaldırdığınızda, OpenClaw yuvayı varsayılana (`legacy`) geri sıfırlar. Aynı sıfırlama davranışı `plugins.slots.memory` için de geçerlidir. Elle yapılandırma düzenlemesi gerekmez.
</Note>

## Compaction ve bellekle ilişki

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction, bağlam motorunun sorumluluklarından biridir. Eski motor, OpenClaw'ın yerleşik özetlemesine devreder. Plugin motorları herhangi bir Compaction stratejisi uygulayabilir (DAG özetleri, vektör getirimi vb.).
  </Accordion>
  <Accordion title="Bellek Plugin'leri">
    Bellek Plugin'leri (`plugins.slots.memory`) bağlam motorlarından ayrıdır. Bellek Plugin'leri arama/getirim sağlar; bağlam motorları modelin ne gördüğünü denetler. Birlikte çalışabilirler - bir bağlam motoru derleme sırasında bellek Plugin verilerini kullanabilir. Etkin bellek istem yolunu isteyen Plugin motorları, etkin bellek istem bölümlerini başa eklemeye hazır bir `systemPromptAddition` değerine dönüştüren `openclaw/plugin-sdk/core` içindeki `buildMemorySystemPromptAddition(...)` yöntemini tercih etmelidir. Bir motor daha düşük düzeyli denetime ihtiyaç duyarsa, `openclaw/plugin-sdk/memory-host-core` üzerinden `buildActiveMemoryPromptSection(...)` ile ham satırları yine çekebilir.
  </Accordion>
  <Accordion title="Oturum budama">
    Eski araç sonuçlarını bellekte kırpma, hangi bağlam motoru etkin olursa olsun çalışmaya devam eder.
  </Accordion>
</AccordionGroup>

## İpuçları

- Motorunuzun doğru yüklendiğini doğrulamak için `openclaw doctor` kullanın.
- Motor değiştiriyorsanız, mevcut oturumlar geçerli geçmişleriyle devam eder. Yeni motor gelecekteki çalıştırmaları devralır.
- Motor hataları günlüğe kaydedilir ve seçili Plugin motoru geçerli Gateway süreci için karantinaya alınır. OpenClaw, kullanıcı dönüşlerinde yanıtların devam edebilmesi için `legacy` motoruna geri döner; ancak yine de bozuk Plugin'i onarmalı, güncellemeli, devre dışı bırakmalı veya kaldırmalısınız.
- Geliştirme için, yerel bir Plugin dizinini kopyalamadan bağlamak üzere `openclaw plugins install -l ./my-engine` kullanın.

## İlgili

- [Compaction](/tr/concepts/compaction) - uzun konuşmaları özetleme
- [Bağlam](/tr/concepts/context) - ajan dönüşleri için bağlamın nasıl oluşturulduğu
- [Plugin Mimarisi](/tr/plugins/architecture) - bağlam motoru Plugin'lerini kaydetme
- [Plugin manifesti](/tr/plugins/manifest) - Plugin manifesti alanları
- [Plugin'ler](/tr/tools/plugin) - Plugin genel bakışı
