---
read_when:
    - OpenClaw'ın model bağlamını nasıl bir araya getirdiğini anlamak istiyorsunuz
    - Eski motor ile bir Plugin motoru arasında geçiş yapıyorsunuz
    - Bir bağlam motoru Plugin oluşturuyorsunuz
sidebarTitle: Context engine
summary: 'Bağlam motoru: takılabilir bağlam oluşturma, Compaction ve alt ajan yaşam döngüsü'
title: Bağlam motoru
x-i18n:
    generated_at: "2026-05-02T08:52:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7477dd1d48f9633586dce67204912a810e0931d7bc9f2d6719ba465fe19681b
    source_path: concepts/context-engine.md
    workflow: 16
---

Bir **bağlam motoru**, OpenClaw'ın her çalıştırma için model bağlamını nasıl oluşturduğunu kontrol eder: hangi mesajların dahil edileceği, eski geçmişin nasıl özetleneceği ve alt ajan sınırlarında bağlamın nasıl yönetileceği.

OpenClaw, yerleşik bir `legacy` motoruyla gelir ve varsayılan olarak onu kullanır — çoğu kullanıcının bunu değiştirmesi gerekmez. Yalnızca farklı bir derleme, Compaction veya oturumlar arası hatırlama davranışı istediğinizde bir Plugin motoru kurup seçin.

## Hızlı başlangıç

<Steps>
  <Step title="Hangi motorun etkin olduğunu kontrol edin">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Bir Plugin motoru kurun">
    Bağlam motoru Plugin'leri, diğer OpenClaw Plugin'leri gibi kurulur.

    <Tabs>
      <Tab title="npm üzerinden">
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

    Kurulum ve yapılandırmadan sonra Gateway'i yeniden başlatın.

  </Step>
  <Step title="legacy'ye geri dönün (isteğe bağlı)">
    `contextEngine` değerini `"legacy"` olarak ayarlayın (veya anahtarı tamamen kaldırın — `"legacy"` varsayılandır).
  </Step>
</Steps>

## Nasıl çalışır?

OpenClaw her model istemi çalıştırdığında, bağlam motoru dört yaşam döngüsü noktasına katılır:

<AccordionGroup>
  <Accordion title="1. Alma">
    Oturuma yeni bir mesaj eklendiğinde çağrılır. Motor, mesajı kendi veri deposunda saklayabilir veya dizine ekleyebilir.
  </Accordion>
  <Accordion title="2. Derleme">
    Her model çalıştırmasından önce çağrılır. Motor, token bütçesine sığan sıralı bir mesaj kümesi (ve isteğe bağlı bir `systemPromptAddition`) döndürür.
  </Accordion>
  <Accordion title="3. Compact">
    Bağlam penceresi dolduğunda veya kullanıcı `/compact` çalıştırdığında çağrılır. Motor, yer açmak için eski geçmişi özetler.
  </Accordion>
  <Accordion title="4. Tur sonrası">
    Bir çalıştırma tamamlandıktan sonra çağrılır. Motor durum bilgisini kalıcı hale getirebilir, arka plan Compaction tetikleyebilir veya dizinleri güncelleyebilir.
  </Accordion>
</AccordionGroup>

Paketle gelen ACP olmayan Codex koşum takımı için OpenClaw, derlenmiş bağlamı Codex geliştirici talimatlarına ve mevcut tur istemine yansıtarak aynı yaşam döngüsünü uygular. Codex hâlâ kendi yerel ileti dizisi geçmişinin ve yerel sıkıştırıcısının sahibidir.

### Alt ajan yaşam döngüsü (isteğe bağlı)

OpenClaw iki isteğe bağlı alt ajan yaşam döngüsü kancasını çağırır:

<ParamField path="prepareSubagentSpawn" type="method">
  Alt çalıştırma başlamadan önce paylaşılan bağlam durumunu hazırlayın. Kanca ebeveyn/alt oturum anahtarlarını, `contextMode` değerini (`isolated` veya `fork`), kullanılabilir transkript kimliklerini/dosyalarını ve isteğe bağlı TTL'yi alır. Bir geri alma tanıtıcısı döndürürse OpenClaw, hazırlık başarılı olduktan sonra başlatma başarısız olduğunda bunu çağırır.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Bir alt ajan oturumu tamamlandığında veya temizlendiğinde temizlik yapın.
</ParamField>

### Sistem istemi eki

`assemble` yöntemi bir `systemPromptAddition` dizesi döndürebilir. OpenClaw bunu çalıştırmanın sistem isteminin başına ekler. Bu, motorların statik çalışma alanı dosyaları gerektirmeden dinamik hatırlama yönlendirmesi, geri getirme talimatları veya bağlama duyarlı ipuçları enjekte etmesini sağlar.

## legacy motoru

Yerleşik `legacy` motoru, OpenClaw'ın özgün davranışını korur:

- **Alma**: işlem yok (oturum yöneticisi mesaj kalıcılığını doğrudan yönetir).
- **Derleme**: doğrudan geçiş (çalışma zamanındaki mevcut temizle → doğrula → sınırla hattı bağlam derlemesini yönetir).
- **Compact**: eski mesajların tek bir özetini oluşturan ve son mesajları olduğu gibi tutan yerleşik özetleme Compaction mekanizmasına devreder.
- **Tur sonrası**: işlem yok.

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

`ctx` fabrikası isteğe bağlı `config`, `agentDir` ve `workspaceDir`
değerlerini içerir; böylece Plugin'ler ilk yaşam döngüsü kancası çalışmadan önce
ajan veya çalışma alanı başına durumu başlatabilir.

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
| `info`             | Özellik  | Motor kimliği, adı, sürümü ve Compaction sahibi olup olmadığı |
| `ingest(params)`   | Yöntem   | Tek bir mesajı saklama                                  |
| `assemble(params)` | Yöntem   | Bir model çalıştırması için bağlam oluşturma (`AssembleResult` döndürür) |
| `compact(params)`  | Yöntem   | Bağlamı özetleme/azaltma                                |

`assemble`, şunları içeren bir `AssembleResult` döndürür:

<ParamField path="messages" type="Message[]" required>
  Modele gönderilecek sıralı mesajlar.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Motorun, derlenmiş bağlamdaki toplam token sayısına ilişkin tahmini. OpenClaw bunu Compaction eşiği kararları ve tanılama raporlaması için kullanır.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Sistem isteminin başına eklenir.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Çalıştırıcının önleyici taşma ön kontrolleri için hangi token tahminini
  kullanacağını denetler. Varsayılan değer `"assembled"` olur; bu, yalnızca
  derlenmiş istemin tahmininin kontrol edildiği anlamına gelir — pencereleme
  uygulanmış, kendi içinde tamamlanmış bir bağlam döndüren motorlar için uygundur.
  Derlenmiş görünümünüz, alttaki transkriptteki taşma riskini gizleyebildiğinde
  yalnızca `"preassembly_may_overflow"` olarak ayarlayın; bu durumda çalıştırıcı,
  önleyici olarak Compact yapıp yapmayacağına karar verirken derlenmiş tahmin ile
  derleme öncesi (penceresiz) oturum geçmişi tahmininin maksimumunu alır.
  Her iki durumda da modelin gördüğü şey hâlâ döndürdüğünüz mesajlardır —
  `promptAuthority` yalnızca ön kontrolü etkiler.
</ParamField>

`compact`, bir `CompactResult` döndürür. Compaction etkin transkripti
döndürdüğünde, `result.sessionId` ve `result.sessionFile` sonraki yeniden deneme
veya turun kullanması gereken ardıl oturumu tanımlar.

İsteğe bağlı üyeler:

| Üye                            | Tür    | Amaç                                                                                                            |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Yöntem | Bir oturum için motor durumunu başlatma. Motor bir oturumu ilk gördüğünde bir kez çağrılır (örn. geçmişi içe aktarma). |
| `ingestBatch(params)`          | Yöntem | Tamamlanmış bir turu toplu olarak alma. Bir çalıştırma tamamlandıktan sonra, o turdaki tüm mesajlarla birlikte çağrılır. |
| `afterTurn(params)`            | Yöntem | Çalıştırma sonrası yaşam döngüsü işi (durumu kalıcı hale getirme, arka plan Compaction tetikleme).              |
| `prepareSubagentSpawn(params)` | Yöntem | Bir alt oturum başlamadan önce paylaşılan durumu ayarlama.                                                      |
| `onSubagentEnded(params)`      | Yöntem | Bir alt ajan sona erdikten sonra temizlik yapma.                                                                |
| `dispose()`                    | Yöntem | Kaynakları serbest bırakma. Gateway kapatılırken veya Plugin yeniden yüklenirken çağrılır — oturum başına değil. |

### ownsCompaction

`ownsCompaction`, Pi'nin yerleşik deneme içi otomatik Compaction özelliğinin çalıştırma için etkin kalıp kalmayacağını denetler:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Motor, Compaction davranışının sahibidir. OpenClaw, o çalıştırma için Pi'nin yerleşik otomatik Compaction özelliğini devre dışı bırakır ve motorun `compact()` uygulaması `/compact`, taşma kurtarma Compaction ve `afterTurn()` içinde yapmak istediği tüm proaktif Compaction işlemlerinden sorumludur. OpenClaw, istem öncesi taşma korumasını yine de çalıştırabilir; bunun tam transkriptin taşacağını öngörmesi halinde kurtarma yolu, başka bir istem göndermeden önce etkin motorun `compact()` yöntemini çağırır.
  </Accordion>
  <Accordion title="ownsCompaction: false veya ayarlanmamış">
    Pi'nin yerleşik otomatik Compaction özelliği istem yürütme sırasında yine de çalışabilir, ancak etkin motorun `compact()` yöntemi `/compact` ve taşma kurtarma için yine de çağrılır.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false`, OpenClaw'ın otomatik olarak legacy motorunun Compaction yoluna geri döneceği anlamına **gelmez**.
</Warning>

Bu, iki geçerli Plugin kalıbı olduğu anlamına gelir:

<Tabs>
  <Tab title="Sahiplenme modu">
    Kendi Compaction algoritmanızı uygulayın ve `ownsCompaction: true` olarak ayarlayın.
  </Tab>
  <Tab title="Devretme modu">
    `ownsCompaction: false` olarak ayarlayın ve OpenClaw'ın yerleşik Compaction davranışını kullanmak için `compact()` içinde `openclaw/plugin-sdk/core` paketinden `delegateCompactionToRuntime(...)` çağırın.
  </Tab>
</Tabs>

İşlem yapmayan bir `compact()`, etkin ve sahip olmayan bir motor için güvenli değildir; çünkü o motor yuvasının normal `/compact` ve taşma kurtarma Compaction yolunu devre dışı bırakır.

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
Yuva çalışma zamanında münhasırdır — belirli bir çalıştırma veya Compaction işlemi için yalnızca bir kayıtlı bağlam motoru çözümlenir. Etkinleştirilmiş diğer `kind: "context-engine"` Plugin'leri hâlâ yüklenebilir ve kayıt kodlarını çalıştırabilir; `plugins.slots.contextEngine` yalnızca OpenClaw bir bağlam motoruna ihtiyaç duyduğunda hangi kayıtlı motor kimliğini çözeceğini seçer.
</Note>

<Note>
**Plugin kaldırma:** `plugins.slots.contextEngine` olarak şu anda seçili olan Plugin'i kaldırdığınızda OpenClaw yuvayı varsayılana (`legacy`) geri ayarlar. Aynı sıfırlama davranışı `plugins.slots.memory` için de geçerlidir. Elle yapılandırma düzenlemesi gerekmez.
</Note>

## Compaction ve bellekle ilişkisi

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction, bağlam motorunun sorumluluklarından biridir. Eski motor, OpenClaw'ın yerleşik özetlemesine devreder. Plugin motorları herhangi bir sıkıştırma stratejisi (DAG özetleri, vektör geri getirme vb.) uygulayabilir.
  </Accordion>
  <Accordion title="Bellek Plugin'leri">
    Bellek Plugin'leri (`plugins.slots.memory`) bağlam motorlarından ayrıdır. Bellek Plugin'leri arama/geri getirme sağlar; bağlam motorları modelin ne gördüğünü kontrol eder. Birlikte çalışabilirler — bir bağlam motoru derleme sırasında bellek Plugin'i verilerini kullanabilir. Etkin bellek istemi yolunu isteyen Plugin motorları, etkin bellek istemi bölümlerini başa eklenmeye hazır bir `systemPromptAddition` değerine dönüştüren `openclaw/plugin-sdk/core` içindeki `buildMemorySystemPromptAddition(...)` öğesini tercih etmelidir. Bir motor daha alt düzey denetime ihtiyaç duyarsa, yine de `buildActiveMemoryPromptSection(...)` aracılığıyla `openclaw/plugin-sdk/memory-host-core` içinden ham satırları alabilir.
  </Accordion>
  <Accordion title="Oturum budama">
    Eski araç sonuçlarını bellekte kırpma, hangi bağlam motoru etkin olursa olsun çalışmaya devam eder.
  </Accordion>
</AccordionGroup>

## İpuçları

- Motorunuzun doğru yüklendiğini doğrulamak için `openclaw doctor` kullanın.
- Motor değiştirirken, mevcut oturumlar geçerli geçmişleriyle devam eder. Yeni motor gelecekteki çalıştırmalar için devralır.
- Motor hataları günlüğe kaydedilir ve tanılamalarda gösterilir. Bir Plugin motoru kaydedilemezse veya seçilen motor kimliği çözümlenemezse, OpenClaw otomatik olarak geri dönmez; Plugin'i düzeltene veya `plugins.slots.contextEngine` değerini tekrar `"legacy"` olarak değiştirene kadar çalıştırmalar başarısız olur.
- Geliştirme için, yerel bir Plugin dizinini kopyalamadan bağlamak üzere `openclaw plugins install -l ./my-engine` kullanın.

## İlgili

- [Compaction](/tr/concepts/compaction) — uzun konuşmaları özetleme
- [Bağlam](/tr/concepts/context) — ajan turları için bağlamın nasıl oluşturulduğu
- [Plugin Mimarisi](/tr/plugins/architecture) — bağlam motoru Plugin'lerini kaydetme
- [Plugin manifesti](/tr/plugins/manifest) — Plugin manifest alanları
- [Plugin'ler](/tr/tools/plugin) — Plugin genel bakışı
