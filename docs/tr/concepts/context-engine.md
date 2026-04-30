---
read_when:
    - OpenClaw'ın model bağlamını nasıl bir araya getirdiğini anlamak istiyorsunuz
    - Eski motor ile Plugin motoru arasında geçiş yapıyorsunuz
    - Bir bağlam motoru Plugin geliştiriyorsunuz
sidebarTitle: Context engine
summary: 'Bağlam motoru: eklentiyle genişletilebilir bağlam derleme, Compaction ve alt ajan yaşam döngüsü'
title: Bağlam motoru
x-i18n:
    generated_at: "2026-04-30T09:16:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f192c6b28ad2b5960b504811926fb5e30fe8da9d985d8eec3ad4b65c9f7cae5
    source_path: concepts/context-engine.md
    workflow: 16
---

Bir **bağlam motoru**, OpenClaw'ın her çalıştırma için model bağlamını nasıl oluşturduğunu kontrol eder: hangi iletilerin dahil edileceği, eski geçmişin nasıl özetleneceği ve alt ajan sınırları boyunca bağlamın nasıl yönetileceği.

OpenClaw, yerleşik bir `legacy` motoruyla gelir ve varsayılan olarak onu kullanır — çoğu kullanıcının bunu değiştirmesi gerekmez. Yalnızca farklı derleme, Compaction veya oturumlar arası geri çağırma davranışı istediğinizde bir Plugin motoru kurup seçin.

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
    Bağlam motoru Plugin'leri, diğer tüm OpenClaw Plugin'leri gibi kurulur.

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

    Kurulum ve yapılandırmadan sonra Gateway'i yeniden başlatın.

  </Step>
  <Step title="legacy'ye geri dönün (isteğe bağlı)">
    `contextEngine` değerini `"legacy"` olarak ayarlayın (veya anahtarı tamamen kaldırın — `"legacy"` varsayılandır).
  </Step>
</Steps>

## Nasıl çalışır

OpenClaw her model istemi çalıştırdığında, bağlam motoru dört yaşam döngüsü noktasında sürece katılır:

<AccordionGroup>
  <Accordion title="1. Alma">
    Oturuma yeni bir ileti eklendiğinde çağrılır. Motor, iletiyi kendi veri deposunda saklayabilir veya dizine ekleyebilir.
  </Accordion>
  <Accordion title="2. Derleme">
    Her model çalıştırmasından önce çağrılır. Motor, token bütçesine sığan sıralı bir ileti kümesi (ve isteğe bağlı bir `systemPromptAddition`) döndürür.
  </Accordion>
  <Accordion title="3. Compact">
    Bağlam penceresi dolduğunda veya kullanıcı `/compact` çalıştırdığında çağrılır. Motor, yer açmak için eski geçmişi özetler.
  </Accordion>
  <Accordion title="4. Turdan sonra">
    Bir çalıştırma tamamlandıktan sonra çağrılır. Motor durumu kalıcı hale getirebilir, arka plan Compaction işlemini tetikleyebilir veya dizinleri güncelleyebilir.
  </Accordion>
</AccordionGroup>

Paketle gelen ACP olmayan Codex yürütme düzeni için OpenClaw, derlenmiş bağlamı Codex geliştirici talimatlarına ve geçerli tur istemine yansıtarak aynı yaşam döngüsünü uygular. Codex yine de kendi yerel iş parçacığı geçmişine ve yerel sıkıştırıcısına sahiptir.

### Alt ajan yaşam döngüsü (isteğe bağlı)

OpenClaw iki isteğe bağlı alt ajan yaşam döngüsü kancasını çağırır:

<ParamField path="prepareSubagentSpawn" type="method">
  Bir alt çalıştırma başlamadan önce paylaşılan bağlam durumunu hazırlar. Kanca üst/alt oturum anahtarlarını, `contextMode` değerini (`isolated` veya `fork`), kullanılabilir transkript kimliklerini/dosyalarını ve isteğe bağlı TTL'yi alır. Bir geri alma tanıtıcısı döndürürse, hazırlık başarılı olduktan sonra başlatma başarısız olduğunda OpenClaw bunu çağırır.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Bir alt ajan oturumu tamamlandığında veya süpürüldüğünde temizlik yapar.
</ParamField>

### Sistem istemi eklemesi

`assemble` yöntemi bir `systemPromptAddition` dizesi döndürebilir. OpenClaw bunu çalıştırmanın sistem isteminin başına ekler. Bu, motorların statik çalışma alanı dosyaları gerektirmeden dinamik geri çağırma rehberliği, getirme talimatları veya bağlama duyarlı ipuçları enjekte etmesini sağlar.

## legacy motoru

Yerleşik `legacy` motoru, OpenClaw'ın özgün davranışını korur:

- **Alma**: işlem yok (oturum yöneticisi ileti kalıcılığını doğrudan yönetir).
- **Derleme**: geçiş (çalışma zamanındaki mevcut temizle → doğrula → sınırla işlem hattı bağlam derlemesini yönetir).
- **Compact**: eski iletilerin tek bir özetini oluşturan ve son iletileri olduğu gibi tutan yerleşik özetleme Compaction işlemine devreder.
- **Turdan sonra**: işlem yok.

legacy motoru araç kaydetmez veya bir `systemPromptAddition` sağlamaz.

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

Fabrika `ctx`, isteğe bağlı `config`, `agentDir` ve `workspaceDir`
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
| `ingest(params)`   | Yöntem   | Tek bir iletiyi saklar                                  |
| `assemble(params)` | Yöntem   | Bir model çalıştırması için bağlam oluşturur (`AssembleResult` döndürür) |
| `compact(params)`  | Yöntem   | Bağlamı özetler/azaltır                                 |

`assemble`, şunları içeren bir `AssembleResult` döndürür:

<ParamField path="messages" type="Message[]" required>
  Modele gönderilecek sıralı iletiler.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Motorun derlenmiş bağlamdaki toplam token sayısı tahmini. OpenClaw bunu Compaction eşiği kararları ve tanılama raporlaması için kullanır.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Sistem isteminin başına eklenir.
</ParamField>

`compact` bir `CompactResult` döndürür. Compaction etkin
transkripti döndürdüğünde, `result.sessionId` ve `result.sessionFile` sonraki
yeniden denemenin veya turun kullanması gereken ardıl oturumu tanımlar.

İsteğe bağlı üyeler:

| Üye                            | Tür    | Amaç                                                                                                            |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Yöntem | Bir oturum için motor durumunu başlatır. Motor bir oturumu ilk gördüğünde bir kez çağrılır (ör. geçmişi içe aktarma). |
| `ingestBatch(params)`          | Yöntem | Tamamlanmış bir turu toplu olarak alır. Bir çalıştırma tamamlandıktan sonra, o turdaki tüm iletilerle birlikte çağrılır. |
| `afterTurn(params)`            | Yöntem | Çalıştırma sonrası yaşam döngüsü işi (durumu kalıcı hale getirme, arka plan Compaction işlemini tetikleme).     |
| `prepareSubagentSpawn(params)` | Yöntem | Bir alt oturum başlamadan önce paylaşılan durumu ayarlar.                                                       |
| `onSubagentEnded(params)`      | Yöntem | Bir alt ajan sona erdikten sonra temizlik yapar.                                                                |
| `dispose()`                    | Yöntem | Kaynakları serbest bırakır. Gateway kapatılırken veya Plugin yeniden yüklenirken çağrılır — oturum başına değil. |

### ownsCompaction

`ownsCompaction`, Pi'nin yerleşik deneme içi otomatik Compaction özelliğinin çalıştırma için etkin kalıp kalmayacağını kontrol eder:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Motor Compaction davranışının sahibidir. OpenClaw, o çalıştırma için Pi'nin yerleşik otomatik Compaction özelliğini devre dışı bırakır ve motorun `compact()` uygulaması `/compact`, taşma kurtarma Compaction işlemi ve `afterTurn()` içinde yapmak istediği proaktif Compaction işlemlerinden sorumludur. OpenClaw yine de istem öncesi taşma korumasını çalıştırabilir; tam transkriptin taşacağını öngördüğünde, kurtarma yolu başka bir istem göndermeden önce etkin motorun `compact()` yöntemini çağırır.
  </Accordion>
  <Accordion title="ownsCompaction: false veya ayarlanmamış">
    Pi'nin yerleşik otomatik Compaction özelliği istem yürütmesi sırasında yine çalışabilir, ancak etkin motorun `compact()` yöntemi `/compact` ve taşma kurtarma için yine de çağrılır.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false`, OpenClaw'ın otomatik olarak legacy motorunun Compaction yoluna geri döneceği anlamına **gelmez**.
</Warning>

Bu, iki geçerli Plugin kalıbı olduğu anlamına gelir:

<Tabs>
  <Tab title="Sahiplenme modu">
    Kendi Compaction algoritmanızı uygulayın ve `ownsCompaction: true` ayarlayın.
  </Tab>
  <Tab title="Devretme modu">
    `ownsCompaction: false` ayarlayın ve `compact()` yönteminin OpenClaw'ın yerleşik Compaction davranışını kullanmak için `openclaw/plugin-sdk/core` içinden `delegateCompactionToRuntime(...)` çağırmasını sağlayın.
  </Tab>
</Tabs>

İşlem yapmayan bir `compact()`, etkin ve sahiplenmeyen bir motor için güvenli değildir çünkü bu motor yuvası için normal `/compact` ve taşma kurtarma Compaction yolunu devre dışı bırakır.

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
Yuva çalışma zamanında özeldir — belirli bir çalıştırma veya Compaction işlemi için yalnızca bir kayıtlı bağlam motoru çözümlenir. Etkin olan diğer `kind: "context-engine"` Plugin'leri yine de yüklenebilir ve kayıt kodlarını çalıştırabilir; `plugins.slots.contextEngine` yalnızca OpenClaw'ın bir bağlam motoruna ihtiyaç duyduğunda hangi kayıtlı motor kimliğini çözümleyeceğini seçer.
</Note>

<Note>
**Plugin kaldırma:** şu anda `plugins.slots.contextEngine` olarak seçili Plugin'i kaldırdığınızda OpenClaw yuvayı varsayılana (`legacy`) geri sıfırlar. Aynı sıfırlama davranışı `plugins.slots.memory` için de geçerlidir. Elle yapılandırma düzenlemesi gerekmez.
</Note>

## Compaction ve bellekle ilişkisi

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction, bağlam motorunun sorumluluklarından biridir. Eski motor, OpenClaw'ın yerleşik özetlemesine devreder. Plugin motorları herhangi bir compaction stratejisi (DAG özetleri, vektörle getirme vb.) uygulayabilir.
  </Accordion>
  <Accordion title="Bellek Plugin'leri">
    Bellek Plugin'leri (`plugins.slots.memory`) bağlam motorlarından ayrıdır. Bellek Plugin'leri arama/getirme sağlar; bağlam motorları modelin ne göreceğini kontrol eder. Birlikte çalışabilirler — bir bağlam motoru, derleme sırasında bellek Plugin verilerini kullanabilir. Active Memory istem yolunu isteyen Plugin motorları, active memory istem bölümlerini başa eklenmeye hazır bir `systemPromptAddition` öğesine dönüştüren `openclaw/plugin-sdk/core` içindeki `buildMemorySystemPromptAddition(...)` öğesini tercih etmelidir. Bir motor daha düşük seviyeli denetime ihtiyaç duyarsa, `buildActiveMemoryPromptSection(...)` aracılığıyla `openclaw/plugin-sdk/memory-host-core` içinden ham satırları yine de çekebilir.
  </Accordion>
  <Accordion title="Oturum budaması">
    Bellek içindeki eski araç sonuçlarını kırpma, hangi bağlam motoru etkin olursa olsun çalışmaya devam eder.
  </Accordion>
</AccordionGroup>

## İpuçları

- Motorunuzun doğru yüklendiğini doğrulamak için `openclaw doctor` kullanın.
- Motor değiştirirken, mevcut oturumlar geçerli geçmişleriyle devam eder. Yeni motor gelecekteki çalıştırmalar için devralır.
- Motor hataları günlüğe kaydedilir ve tanılamalarda gösterilir. Bir Plugin motoru kaydedilemezse veya seçilen motor kimliği çözümlenemezse, OpenClaw otomatik olarak geri dönmez; Plugin'i düzeltinceye veya `plugins.slots.contextEngine` öğesini tekrar `"legacy"` olarak değiştirinceye kadar çalıştırmalar başarısız olur.
- Geliştirme için, yerel bir Plugin dizinini kopyalamadan bağlamak üzere `openclaw plugins install -l ./my-engine` kullanın.

## İlgili

- [Compaction](/tr/concepts/compaction) — uzun konuşmaları özetleme
- [Bağlam](/tr/concepts/context) — agent turları için bağlamın nasıl oluşturulduğu
- [Plugin Mimarisi](/tr/plugins/architecture) — bağlam motoru Plugin'lerini kaydetme
- [Plugin manifesti](/tr/plugins/manifest) — Plugin manifest alanları
- [Plugin'ler](/tr/tools/plugin) — Plugin genel bakışı
