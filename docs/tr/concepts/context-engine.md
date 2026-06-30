---
read_when:
    - OpenClaw'ın model bağlamını nasıl oluşturduğunu anlamak istiyorsunuz
    - Eski motor ile bir Plugin motoru arasında geçiş yapıyorsunuz
    - Bir bağlam motoru Plugin'i oluşturuyorsunuz
sidebarTitle: Context engine
summary: 'Bağlam motoru: takılabilir bağlam derleme, Compaction ve alt ajan yaşam döngüsü'
title: Bağlam motoru
x-i18n:
    generated_at: "2026-06-30T14:23:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

Bir **bağlam motoru**, OpenClaw'ın her çalıştırma için model bağlamını nasıl oluşturduğunu kontrol eder: hangi iletilerin ekleneceği, eski geçmişin nasıl özetleneceği ve alt ajan sınırları arasında bağlamın nasıl yönetileceği.

OpenClaw yerleşik bir `legacy` motoruyla gelir ve bunu varsayılan olarak kullanır - çoğu kullanıcının bunu değiştirmesi gerekmez. Yalnızca farklı bir birleştirme, Compaction veya oturumlar arası hatırlama davranışı istediğinizde bir Plugin motoru kurup seçin.

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
    Bağlam motoru Plugin'leri diğer tüm OpenClaw Plugin'leri gibi kurulur.

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
          contextEngine: "lossless-claw", // plugin'in kayıtlı motor id'siyle eşleşmelidir
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin'e özgü yapılandırma buraya gelir (plugin'in belgelerine bakın)
          },
        },
      },
    }
    ```

    Kurulum ve yapılandırmadan sonra gateway'i yeniden başlatın.

  </Step>
  <Step title="legacy'ye geri dönün (isteğe bağlı)">
    `contextEngine` değerini `"legacy"` olarak ayarlayın (veya anahtarı tamamen kaldırın - `"legacy"` varsayılandır).
  </Step>
</Steps>

## Nasıl çalışır?

OpenClaw her model istemi çalıştırdığında, bağlam motoru dört yaşam döngüsü noktasında yer alır:

<AccordionGroup>
  <Accordion title="1. İçeri alma">
    Oturuma yeni bir ileti eklendiğinde çağrılır. Motor, iletiyi kendi veri deposunda saklayabilir veya dizine ekleyebilir.
  </Accordion>
  <Accordion title="2. Birleştirme">
    Her model çalıştırmasından önce çağrılır. Motor, token bütçesine sığan sıralı bir ileti kümesi (ve isteğe bağlı bir `systemPromptAddition`) döndürür.
  </Accordion>
  <Accordion title="3. Compact">
    Bağlam penceresi dolduğunda veya kullanıcı `/compact` çalıştırdığında çağrılır. Motor, yer açmak için eski geçmişi özetler.
  </Accordion>
  <Accordion title="4. Turdan sonra">
    Bir çalıştırma tamamlandıktan sonra çağrılır. Motor durumu kalıcı hale getirebilir, arka plan Compaction'ını tetikleyebilir veya dizinleri güncelleyebilir.
  </Accordion>
</AccordionGroup>

Paketle gelen ACP dışı Codex araç takımı için OpenClaw, birleştirilmiş bağlamı Codex geliştirici talimatlarına ve geçerli tur istemine yansıtarak aynı yaşam döngüsünü uygular. Codex hâlâ kendi yerel iş parçacığı geçmişinin ve yerel sıkıştırıcısının sahibidir.

### Alt ajan yaşam döngüsü (isteğe bağlı)

OpenClaw iki isteğe bağlı alt ajan yaşam döngüsü kancasını çağırır:

<ParamField path="prepareSubagentSpawn" type="method">
  Bir alt çalıştırma başlamadan önce paylaşılan bağlam durumunu hazırlar. Kanca ebeveyn/alt oturum anahtarlarını, `contextMode` değerini (`isolated` veya `fork`), kullanılabilir transkript id'lerini/dosyalarını ve isteğe bağlı TTL'yi alır. Bir geri alma tanıtıcısı döndürürse, hazırlık başarılı olduktan sonra spawn başarısız olduğunda OpenClaw bunu çağırır. `lightContext` isteyen ve `contextMode="isolated"` olarak çözümlenen yerel alt ajan spawn'ları, alt öğenin bağlam motoru tarafından yönetilen spawn öncesi durumu olmadan hafif bootstrap bağlamından başlaması için bu kancayı kasıtlı olarak atlar.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Bir alt ajan oturumu tamamlandığında veya süpürüldüğünde temizler.
</ParamField>

### Sistem istemi eklemesi

`assemble` yöntemi bir `systemPromptAddition` dizesi döndürebilir. OpenClaw bunu çalıştırmanın sistem isteminin başına ekler. Bu, motorların statik çalışma alanı dosyaları gerektirmeden dinamik hatırlama yönlendirmesi, geri getirme talimatları veya bağlama duyarlı ipuçları enjekte etmesini sağlar.

## legacy motoru

Yerleşik `legacy` motoru, OpenClaw'ın özgün davranışını korur:

- **İçeri alma**: işlem yok (oturum yöneticisi ileti kalıcılığını doğrudan işler).
- **Birleştirme**: geçiş (runtime'daki mevcut temizle → doğrula → sınırla hattı bağlam birleştirmeyi işler).
- **Compact**: eski iletilerin tek bir özetini oluşturan ve son iletileri olduğu gibi tutan yerleşik özetleme Compaction'ına devreder.
- **Turdan sonra**: işlem yok.

legacy motoru araç kaydetmez veya `systemPromptAddition` sağlamaz.

`plugins.slots.contextEngine` ayarlanmadığında (veya `"legacy"` olarak ayarlandığında), bu motor otomatik olarak kullanılır.

## Plugin motorları

Bir Plugin, Plugin API'sini kullanarak bir bağlam motoru kaydedebilir:

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

`ctx` fabrikası, Plugin'lerin ilk yaşam döngüsü kancası çalışmadan önce ajan başına veya çalışma alanı başına durumu başlatabilmesi için isteğe bağlı `config`, `agentDir` ve `workspaceDir`
değerlerini içerir.

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

Zorunlu üyeler:

| Üye                | Tür      | Amaç                                                       |
| ------------------ | -------- | ---------------------------------------------------------- |
| `info`             | Özellik  | Motor id'si, adı, sürümü ve Compaction'ın sahibi olup olmadığı |
| `ingest(params)`   | Yöntem   | Tek bir iletiyi sakla                                      |
| `assemble(params)` | Yöntem   | Bir model çalıştırması için bağlam oluştur (`AssembleResult` döndürür) |
| `compact(params)`  | Yöntem   | Bağlamı özetle/azalt                                      |

`assemble`, şunları içeren bir `AssembleResult` döndürür:

<ParamField path="messages" type="Message[]" required>
  Modele gönderilecek sıralı iletiler.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Birleştirilmiş bağlamdaki toplam token sayısına ilişkin motor tahmini. OpenClaw bunu Compaction eşiği kararları ve tanılama raporlaması için kullanır.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Sistem isteminin başına eklenir.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Çalıştırıcının önleyici taşma ön denetimleri için hangi token tahminini kullandığını kontrol eder. Varsayılan değer `"assembled"` olur; bu, Compaction'ın sahibi olmayan motorlar için yalnızca birleştirilmiş istemin tahmininin denetlendiği anlamına gelir. `ownsCompaction: true` ayarlayan motorlar kendi istem kabul süreçlerini yönetir; bu nedenle OpenClaw genel istem öncesi ön denetimi varsayılan olarak atlar. `"preassembly_may_overflow"` değerini yalnızca birleştirilmiş görünümünüz alttaki transkriptteki taşma riskini gizleyebildiğinde ayarlayın; çalıştırıcı bu durumda genel ön denetimi etkin tutar ve önleyici Compaction yapıp yapmayacağına karar verirken birleştirilmiş tahmin ile birleştirme öncesi (pencerelenmemiş) oturum geçmişi tahmininin maksimumunu alır. Her iki durumda da döndürdüğünüz iletiler modelin gördüğü şeydir - `promptAuthority` yalnızca ön denetimi etkiler.
</ParamField>

`compact`, bir `CompactResult` döndürür. Compaction etkin transkripti döndürdüğünde, `result.sessionId` ve `result.sessionFile` sonraki yeniden denemenin veya turun kullanması gereken ardıl oturumu tanımlar.

İsteğe bağlı üyeler:

| Üye                            | Tür    | Amaç                                                                                                           |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Yöntem | Bir oturum için motor durumunu başlat. Motor bir oturumu ilk gördüğünde bir kez çağrılır (örn. geçmişi içe aktarma). |
| `ingestBatch(params)`          | Yöntem | Tamamlanmış bir turu toplu olarak içeri al. Bir çalıştırma tamamlandıktan sonra, o turdaki tüm iletilerle birlikte çağrılır. |
| `afterTurn(params)`            | Yöntem | Çalıştırma sonrası yaşam döngüsü işi (durumu kalıcı hale getirme, arka plan Compaction'ını tetikleme).          |
| `prepareSubagentSpawn(params)` | Yöntem | Başlamadan önce alt oturum için paylaşılan durumu kur.                                                         |
| `onSubagentEnded(params)`      | Yöntem | Bir alt ajan sona erdikten sonra temizle.                                                                      |
| `dispose()`                    | Yöntem | Kaynakları serbest bırak. Gateway kapatma veya Plugin yeniden yükleme sırasında çağrılır - oturum başına değil. |

### Runtime ayarları

OpenClaw içinde çalışan yaşam döngüsü kancaları isteğe bağlı bir
`runtimeSettings` nesnesi alır. Bu, sürümlendirilmiş, salt okunur bir iç
üretici/tüketici API yüzeyidir: OpenClaw bunu seçili bağlam
motoru için üretir ve bağlam motoru bunu yaşam döngüsü kancaları içinde tüketir. Kullanıcılara doğrudan gösterilmez ve özel bir raporlama yüzeyi oluşturmaz.

- `schemaVersion`: şu anda `1`
- `runtime`: OpenClaw barındırıcısı, runtime modu (`normal`, `fallback` veya
  `degraded`) ve isteğe bağlı araç takımı/runtime id'leri
- `contextEngineSelection`: seçili bağlam motoru id'si ve seçim kaynağı
- `executionHost`: kancayı çağıran yüzey için barındırıcı id'si ve etiketi
- `model`: istenen model, çözümlenen model, sağlayıcı ve isteğe bağlı model ailesi
- `limits`: bilindiğinde istem token bütçesi ve maksimum çıktı token'ları
- `diagnostics`: bilindiğinde kapalı fallback ve degraded neden kodları

Bilinmeyen olabilecek alanlar `null` olarak temsil edilir; runtime modu ve seçim kaynağı gibi ayırıcı alanlar null yapılamaz kalır. Eski motorlar uyumlu kalır: katı bir eski motor `runtimeSettings` değerini bilinmeyen bir özellik olarak reddederse, OpenClaw motoru karantinaya almak yerine yaşam döngüsü çağrısını onsuz yeniden dener.

### Barındırıcı gereksinimleri

Bağlam motorları, `info.hostRequirements` üzerinde barındırıcı yetenek gereksinimleri bildirebilir.
OpenClaw, işleme başlamadan önce bu gereksinimleri denetler ve seçili runtime bunları karşılayamadığında açıklayıcı bir hatayla kapalı şekilde başarısız olur.

Ajan çalıştırmaları için, motor gerçek model istemini `assemble()` aracılığıyla kontrol etmeliyse `assemble-before-prompt` bildirin:

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

Yerel Codex ve OpenClaw gömülü ajan çalıştırmaları `assemble-before-prompt` özelliğini karşılar.
Genel CLI arka uçları karşılamaz; bu nedenle bunu gerektiren motorlar CLI süreci başlamadan önce reddedilir.

### Hata yalıtımı

OpenClaw, seçilen Plugin motorunu çekirdek yanıt yolundan yalıtır. Eski olmayan bir motor
eksikse, sözleşme doğrulamasında başarısız olursa, fabrika oluşturma sırasında hata
fırlatırsa veya bir yaşam döngüsü yönteminden hata fırlatırsa, OpenClaw bu motoru
geçerli Gateway işlemi için karantinaya alır ve bağlam motoru işini
yerleşik `legacy` motora düşürür. Hata, başarısız işlemle birlikte günlüğe yazılır; böylece
operatör, ajan sessiz kalmadan Plugin’i onarabilir, güncelleyebilir veya devre dışı bırakabilir.

Ana makine gereksinimi hataları farklıdır: Bir motor, bir çalışma zamanının gerekli
bir yetenekten yoksun olduğunu bildirirse, OpenClaw çalıştırmayı başlatmadan önce kapalı hata verir. Bu,
desteklenmeyen bir ana makinede çalıştıklarında durumu bozabilecek motorları korur.

### ownsCompaction

`ownsCompaction`, OpenClaw çalışma zamanının yerleşik deneme içi otomatik Compaction özelliğinin çalıştırma için etkin kalıp kalmayacağını denetler:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Motor, Compaction davranışının sahibidir. OpenClaw, bu çalıştırma için OpenClaw çalışma zamanının yerleşik otomatik Compaction özelliğini ve genel istem öncesi taşma ön denetimini devre dışı bırakır; motorun `compact()` uygulaması `/compact`, sağlayıcı taşma kurtarma Compaction’ı ve `afterTurn()` içinde yapmak istediği tüm proaktif Compaction işlemlerinden sorumludur. Motor `assemble()` içinden `promptAuthority: "preassembly_may_overflow"` döndürdüğünde OpenClaw istem öncesi taşma korumasını yine çalıştırır.
  </Accordion>
  <Accordion title="ownsCompaction: false veya ayarlanmamış">
    OpenClaw çalışma zamanının yerleşik otomatik Compaction özelliği istem yürütme sırasında yine çalışabilir, ancak etkin motorun `compact()` yöntemi `/compact` ve taşma kurtarma için yine de çağrılır.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false`, OpenClaw’ın otomatik olarak eski motorun Compaction yoluna geri döneceği anlamına **gelmez**.
</Warning>

Bu, iki geçerli Plugin deseni olduğu anlamına gelir:

<Tabs>
  <Tab title="Sahiplenme modu">
    Kendi Compaction algoritmanızı uygulayın ve `ownsCompaction: true` ayarlayın.
  </Tab>
  <Tab title="Yetkilendirme modu">
    `ownsCompaction: false` ayarlayın ve OpenClaw’ın yerleşik Compaction davranışını kullanmak için `compact()` içinde `openclaw/plugin-sdk/core` üzerinden `delegateCompactionToRuntime(...)` çağırın.
  </Tab>
</Tabs>

İşlem yapmayan bir `compact()`, etkin ve sahiplenmeyen bir motor için güvenli değildir; çünkü bu motor yuvası için normal `/compact` ve taşma kurtarma Compaction yolunu devre dışı bırakır.

## Yapılandırma başvurusu

```json5
{
  plugins: {
    slots: {
      // Etkin bağlam motorunu seçin. Varsayılan: "legacy".
      // Bir Plugin motoru kullanmak için bir Plugin kimliğine ayarlayın.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Yuva çalışma zamanında özeldir - belirli bir çalıştırma veya Compaction işlemi için yalnızca bir kayıtlı bağlam motoru çözümlenir. Etkinleştirilmiş diğer `kind: "context-engine"` Plugin’leri yine yüklenebilir ve kayıt kodlarını çalıştırabilir; `plugins.slots.contextEngine` yalnızca OpenClaw’ın bir bağlam motoruna ihtiyaç duyduğunda hangi kayıtlı motor kimliğini çözümleyeceğini seçer.
</Note>

<Note>
**Plugin kaldırma:** Şu anda `plugins.slots.contextEngine` olarak seçili Plugin’i kaldırdığınızda, OpenClaw yuvayı varsayılana (`legacy`) geri sıfırlar. Aynı sıfırlama davranışı `plugins.slots.memory` için de geçerlidir. Elle yapılandırma düzenlemesi gerekmez.
</Note>

## Compaction ve bellek ile ilişkisi

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction, bağlam motorunun sorumluluklarından biridir. Eski motor, OpenClaw’ın yerleşik özetleme özelliğine yetki verir. Plugin motorları herhangi bir Compaction stratejisi uygulayabilir (DAG özetleri, vektör geri getirme vb.).
  </Accordion>
  <Accordion title="Bellek Plugin’leri">
    Bellek Plugin’leri (`plugins.slots.memory`), bağlam motorlarından ayrıdır. Bellek Plugin’leri arama/geri getirme sağlar; bağlam motorları modelin ne göreceğini denetler. Birlikte çalışabilirler - bir bağlam motoru derleme sırasında bellek Plugin’i verilerini kullanabilir. Etkin bellek istem yolunu isteyen Plugin motorları, etkin bellek istem bölümlerini başa eklenmeye hazır bir `systemPromptAddition` değerine dönüştüren `openclaw/plugin-sdk/core` içindeki `buildMemorySystemPromptAddition(...)` öğesini tercih etmelidir. Bir motor daha düşük düzeyli denetime ihtiyaç duyarsa, `buildActiveMemoryPromptSection(...)` aracılığıyla `openclaw/plugin-sdk/memory-host-core` üzerinden ham satırları yine çekebilir.
  </Accordion>
  <Accordion title="Oturum budama">
    Eski araç sonuçlarının bellekte kırpılması, hangi bağlam motoru etkin olursa olsun çalışmaya devam eder.
  </Accordion>
</AccordionGroup>

## İpuçları

- Motorunuzun doğru yüklendiğini doğrulamak için `openclaw doctor` kullanın.
- Motorları değiştiriyorsanız, mevcut oturumlar geçerli geçmişleriyle devam eder. Yeni motor gelecekteki çalıştırmalar için devralır.
- Motor hataları günlüğe yazılır ve seçilen Plugin motoru geçerli Gateway işlemi için karantinaya alınır. Yanıtların devam edebilmesi için OpenClaw kullanıcı turlarında `legacy` değerine geri döner, ancak bozuk Plugin’i yine de onarmalı, güncellemeli, devre dışı bırakmalı veya kaldırmalısınız.
- Geliştirme için, yerel bir Plugin dizinini kopyalamadan bağlamak üzere `openclaw plugins install -l ./my-engine` kullanın.

## İlgili

- [Compaction](/tr/concepts/compaction) - uzun konuşmaları özetleme
- [Bağlam](/tr/concepts/context) - ajan turları için bağlamın nasıl oluşturulduğu
- [Plugin Mimarisi](/tr/plugins/architecture) - bağlam motoru Plugin’lerini kaydetme
- [Plugin manifest’i](/tr/plugins/manifest) - Plugin manifest alanları
- [Plugin’ler](/tr/tools/plugin) - Plugin genel bakışı
