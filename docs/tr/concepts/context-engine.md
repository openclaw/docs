---
read_when:
    - OpenClaw'ın model bağlamını nasıl derlediğini anlamak istiyorsunuz
    - Eski motor ile bir Plugin motoru arasında geçiş yapıyorsunuz
    - Bir bağlam motoru Plugin'i oluşturuyorsunuz
sidebarTitle: Context engine
summary: 'Bağlam motoru: takılabilir bağlam derleme, Compaction ve alt agent yaşam döngüsü'
title: Bağlam motoru
x-i18n:
    generated_at: "2026-04-26T11:27:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a362f26cde3abca7c15487fa43a411f21e3114491e27a752ca06454add60481
    source_path: concepts/context-engine.md
    workflow: 15
---

Bir **bağlam motoru**, OpenClaw'ın her çalıştırma için model bağlamını nasıl oluşturduğunu denetler: hangi mesajların dahil edileceği, eski geçmişin nasıl özetleneceği ve alt agent sınırları boyunca bağlamın nasıl yönetileceği.

OpenClaw, yerleşik bir `legacy` motoruyla gelir ve varsayılan olarak bunu kullanır — çoğu kullanıcının bunu değiştirmesi gerekmez. Yalnızca farklı derleme, Compaction veya oturumlar arası geri çağırma davranışı istediğinizde bir Plugin motoru kurup seçin.

## Hızlı başlangıç

<Steps>
  <Step title="Hangi motorun etkin olduğunu denetleyin">
    ```bash
    openclaw doctor
    # veya config'i doğrudan inceleyin:
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
  <Step title="Motoru etkinleştirin ve seçin">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // Plugin'in kayıtlı motor kimliğiyle eşleşmelidir
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin'e özgü config buraya gider (Plugin'in docs'una bakın)
          },
        },
      },
    }
    ```

    Kurulum ve yapılandırmadan sonra gateway'i yeniden başlatın.

  </Step>
  <Step title="Legacy'ye geri dönün (isteğe bağlı)">
    `contextEngine` değerini `"legacy"` olarak ayarlayın (veya anahtarı tamamen kaldırın — varsayılan `"legacy"` değeridir).
  </Step>
</Steps>

## Nasıl çalışır

OpenClaw her model istemini çalıştırdığında, bağlam motoru dört yaşam döngüsü noktasına katılır:

<AccordionGroup>
  <Accordion title="1. Alım">
    Oturuma yeni bir mesaj eklendiğinde çağrılır. Motor mesajı kendi veri deposunda saklayabilir veya indeksleyebilir.
  </Accordion>
  <Accordion title="2. Derleme">
    Her model çalıştırmasından önce çağrılır. Motor, token bütçesine sığan sıralı bir mesaj kümesi (ve isteğe bağlı bir `systemPromptAddition`) döndürür.
  </Accordion>
  <Accordion title="3. Compaction">
    Bağlam penceresi dolduğunda veya kullanıcı `/compact` çalıştırdığında çağrılır. Motor, alan açmak için eski geçmişi özetler.
  </Accordion>
  <Accordion title="4. Tur sonrası">
    Bir çalıştırma tamamlandıktan sonra çağrılır. Motor durumu kalıcılaştırabilir, arka planda Compaction tetikleyebilir veya indeksleri güncelleyebilir.
  </Accordion>
</AccordionGroup>

Paketlenmiş ACP dışı Codex harness için OpenClaw, derlenmiş bağlamı Codex geliştirici talimatlarına ve geçerli tur istemine yansıtarak aynı yaşam döngüsünü uygular. Codex yine de kendi yerel thread geçmişine ve yerel compactörüne sahiptir.

### Alt agent yaşam döngüsü (isteğe bağlı)

OpenClaw iki isteğe bağlı alt agent yaşam döngüsü hook'u çağırır:

<ParamField path="prepareSubagentSpawn" type="method">
  Bir alt çalıştırma başlamadan önce paylaşılan bağlam durumunu hazırlar. Hook; üst/alt oturum anahtarlarını, `contextMode` (`isolated` veya `fork`), kullanılabilir transcript kimliklerini/dosyalarını ve isteğe bağlı TTL'yi alır. Hazırlık başarılı olduktan sonra spawn başarısız olursa ve bir geri alma tanıtıcısı döndürürse, OpenClaw bunu çağırır.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Bir alt agent oturumu tamamlandığında veya temizlendiğinde temizlik yapar.
</ParamField>

### Sistem istemi eklemesi

`assemble` yöntemi bir `systemPromptAddition` dizesi döndürebilir. OpenClaw bunu çalıştırmanın sistem isteminin başına ekler. Bu, motorların statik workspace dosyaları gerektirmeden dinamik geri çağırma rehberliği, alma talimatları veya bağlama duyarlı ipuçları enjekte etmesini sağlar.

## Legacy motor

Yerleşik `legacy` motor, OpenClaw'ın özgün davranışını korur:

- **Alım**: no-op (mesaj kalıcılaştırmasını doğrudan oturum yöneticisi ele alır).
- **Derleme**: geçişli (çalışma zamanındaki mevcut sanitize → validate → limit hattı bağlam derlemesini ele alır).
- **Compact**: yerleşik özetleme Compaction'ına devreder; bu, eski mesajların tek bir özetini oluşturur ve son mesajları bozulmadan tutar.
- **Tur sonrası**: no-op.

Legacy motor, tool kaydetmez veya bir `systemPromptAddition` sağlamaz.

`plugins.slots.contextEngine` ayarlanmadığında (veya `"legacy"` olarak ayarlandığında), bu motor otomatik olarak kullanılır.

## Plugin motorları

Bir Plugin, Plugin API'sini kullanarak bir bağlam motoru kaydedebilir:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Mesajı veri deponuzda saklayın
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Bütçeye sığan mesajları döndürün
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
      // Eski bağlamı özetleyin
      return { ok: true, compacted: true };
    },
  }));
}
```

Ardından config içinde etkinleştirin:

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

| Üye               | Tür      | Amaç                                                      |
| ----------------- | -------- | --------------------------------------------------------- |
| `info`            | Özellik  | Motor kimliği, adı, sürümü ve Compaction'ın sahibi olup olmadığı |
| `ingest(params)`   | Yöntem   | Tek bir mesajı depolama                                   |
| `assemble(params)` | Yöntem   | Bir model çalıştırması için bağlam oluşturma (`AssembleResult` döndürür) |
| `compact(params)`  | Yöntem   | Bağlamı özetleme/azaltma                                  |

`assemble`, şunları içeren bir `AssembleResult` döndürür:

<ParamField path="messages" type="Message[]" required>
  Modele gönderilecek sıralı mesajlar.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Motorun derlenen bağlamdaki toplam token tahmini. OpenClaw bunu Compaction eşik kararları ve tanı raporlaması için kullanır.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Sistem isteminin başına eklenir.
</ParamField>

İsteğe bağlı üyeler:

| Üye                           | Tür    | Amaç                                                                                                            |
| ----------------------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Yöntem | Bir oturum için motor durumunu başlatma. Motor bir oturumu ilk kez gördüğünde çağrılır (örn. geçmiş içe aktarma). |
| `ingestBatch(params)`          | Yöntem | Tamamlanmış bir turu toplu olarak alma. Bir çalıştırma tamamlandıktan sonra, o turdaki tüm mesajlarla birlikte tek seferde çağrılır. |
| `afterTurn(params)`            | Yöntem | Çalıştırma sonrası yaşam döngüsü işleri (durumu kalıcılaştırma, arka planda Compaction tetikleme).             |
| `prepareSubagentSpawn(params)` | Yöntem | Bir alt oturum başlamadan önce paylaşılan durumu hazırlama.                                                     |
| `onSubagentEnded(params)`      | Yöntem | Bir alt agent sona erdikten sonra temizlik yapma.                                                               |
| `dispose()`                    | Yöntem | Kaynakları serbest bırakma. Gateway kapanışı veya Plugin yeniden yüklemesi sırasında çağrılır — oturum başına değil. |

### ownsCompaction

`ownsCompaction`, Pi'ın yerleşik deneme içi otomatik Compaction özelliğinin çalıştırma için etkin kalıp kalmayacağını denetler:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Motor, Compaction davranışının sahibidir. OpenClaw, o çalıştırma için Pi'ın yerleşik otomatik Compaction'ını devre dışı bırakır ve motorun `compact()` uygulaması `/compact`, taşma kurtarma Compaction'ı ve `afterTurn()` içinde yapmak istediği her türlü proaktif Compaction'dan sorumlu olur. OpenClaw yine de istem öncesi taşma korumasını çalıştırabilir; tam transcript'in taşacağını öngördüğünde kurtarma yolu başka bir istem göndermeden önce etkin motorun `compact()` yöntemini çağırır.
  </Accordion>
  <Accordion title="ownsCompaction: false veya ayarlanmamış">
    Pi'ın yerleşik otomatik Compaction'ı istem yürütmesi sırasında yine de çalışabilir, ancak etkin motorun `compact()` yöntemi `/compact` ve taşma kurtarma için yine de çağrılır.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false`, OpenClaw'ın otomatik olarak legacy motorun Compaction yoluna fallback yaptığı anlamına **gelmez**.
</Warning>

Bu, iki geçerli Plugin kalıbı olduğu anlamına gelir:

<Tabs>
  <Tab title="Sahiplenen mod">
    Kendi Compaction algoritmanızı uygulayın ve `ownsCompaction: true` ayarlayın.
  </Tab>
  <Tab title="Devreden mod">
    `ownsCompaction: false` ayarlayın ve OpenClaw'ın yerleşik Compaction davranışını kullanmak için `openclaw/plugin-sdk/core` içinden `delegateCompactionToRuntime(...)` çağıran bir `compact()` yazın.
  </Tab>
</Tabs>

Etkin ve sahiplenmeyen bir motor için no-op `compact()` güvenli değildir; çünkü bu, o motor yuvası için normal `/compact` ve taşma kurtarma Compaction yolunu devre dışı bırakır.

## Yapılandırma referansı

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
Yuva çalışma zamanında özeldir — belirli bir çalıştırma veya Compaction işlemi için yalnızca tek bir kayıtlı bağlam motoru çözülür. Etkin diğer `kind: "context-engine"` Plugin'leri yine de yüklenebilir ve kayıt kodlarını çalıştırabilir; `plugins.slots.contextEngine` yalnızca OpenClaw'ın bir bağlam motoruna ihtiyaç duyduğunda hangi kayıtlı motor kimliğini çözeceğini seçer.
</Note>

<Note>
**Plugin kaldırma:** şu anda `plugins.slots.contextEngine` olarak seçili Plugin'i kaldırdığınızda OpenClaw yuvayı varsayılana (`legacy`) geri sıfırlar. Aynı sıfırlama davranışı `plugins.slots.memory` için de geçerlidir. Elle config düzenlemesi gerekmez.
</Note>

## Compaction ve bellek ile ilişkisi

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction, bağlam motorunun sorumluluklarından biridir. Legacy motor, OpenClaw'ın yerleşik özetlemesine devreder. Plugin motorları herhangi bir Compaction stratejisini uygulayabilir (DAG özetleri, vektör alma vb.).
  </Accordion>
  <Accordion title="Bellek Plugin'leri">
    Bellek Plugin'leri (`plugins.slots.memory`), bağlam motorlarından ayrıdır. Bellek Plugin'leri arama/alma sağlar; bağlam motorları ise modelin ne gördüğünü denetler. Birlikte çalışabilirler — bir bağlam motoru derleme sırasında bellek Plugin verilerini kullanabilir. Etkin bellek istem yolunu isteyen Plugin motorları, `openclaw/plugin-sdk/core` içinden `buildMemorySystemPromptAddition(...)` tercih etmelidir; bu, etkin bellek istem bölümlerini başa eklenmeye hazır bir `systemPromptAddition` değerine dönüştürür. Bir motor daha düşük düzey denetim gerektiriyorsa, `openclaw/plugin-sdk/memory-host-core` üzerinden `buildActiveMemoryPromptSection(...)` ile ham satırları yine çekebilir.
  </Accordion>
  <Accordion title="Oturum budama">
    Etkin bağlam motoru hangisi olursa olsun, bellekteki eski tool sonuçlarını kırpma işlemi yine de çalışır.
  </Accordion>
</AccordionGroup>

## İpuçları

- Motorunuzun doğru yüklendiğini doğrulamak için `openclaw doctor` kullanın.
- Motor değiştiriyorsanız mevcut oturumlar geçerli geçmişleriyle devam eder. Yeni motor, gelecekteki çalıştırmalar için devralır.
- Motor hataları günlüğe yazılır ve tanılamada gösterilir. Bir Plugin motoru kaydolamazsa veya seçili motor kimliği çözülemezse OpenClaw otomatik olarak fallback yapmaz; Plugin'i düzeltinceye veya `plugins.slots.contextEngine` değerini tekrar `"legacy"` yapıncaya kadar çalıştırmalar başarısız olur.
- Geliştirme için, kopyalama yapmadan yerel bir Plugin dizinini bağlamak üzere `openclaw plugins install -l ./my-engine` kullanın.

## İlgili

- [Compaction](/tr/concepts/compaction) — uzun konuşmaları özetleme
- [Bağlam](/tr/concepts/context) — agent turları için bağlamın nasıl oluşturulduğu
- [Plugin Mimarisi](/tr/plugins/architecture) — bağlam motoru Plugin'lerini kaydetme
- [Plugin manifest](/tr/plugins/manifest) — Plugin manifest alanları
- [Plugins](/tr/tools/plugin) — Plugin genel bakışı
