---
read_when:
    - OpenClaw'ın model bağlamını nasıl birleştirdiğini anlamak istiyorsunuz
    - Eski motor ile bir Plugin motoru arasında geçiş yapıyorsunuz
    - Bir bağlam motoru Plugin'i geliştiriyorsunuz
summary: 'Bağlam motoru: takılabilir bağlam birleştirme, Compaction ve alt aracı yaşam döngüsü'
title: Bağlam motoru
x-i18n:
    generated_at: "2026-04-24T09:04:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f4e5f01f945f7fe3056587f2aa60bec607dd0dd64b29e9ab2afe8e77b5d2f1e
    source_path: concepts/context-engine.md
    workflow: 15
---

Bir **bağlam motoru**, OpenClaw'ın her çalıştırma için model bağlamını nasıl oluşturduğunu denetler:
hangi mesajların dahil edileceği, eski geçmişin nasıl özetleneceği ve
alt aracı sınırları boyunca bağlamın nasıl yönetileceği.

OpenClaw, yerleşik bir `legacy` motoruyla birlikte gelir ve varsayılan olarak onu kullanır — çoğu
kullanıcının bunu değiştirmesi gerekmez. Yalnızca farklı birleştirme, Compaction veya oturumlar arası geri çağırma davranışı
istediğinizde bir Plugin motoru kurup seçin.

## Hızlı başlangıç

Hangi motorun etkin olduğunu kontrol edin:

```bash
openclaw doctor
# veya config'i doğrudan inceleyin:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Bir bağlam motoru Plugin'i kurma

Bağlam motoru Plugin'leri diğer OpenClaw Plugin'leri gibi kurulur. Önce
kurun, ardından slottaki motoru seçin:

```bash
# npm'den kur
openclaw plugins install @martian-engineering/lossless-claw

# Veya yerel bir yoldan kur (geliştirme için)
openclaw plugins install -l ./my-context-engine
```

Ardından Plugin'i etkinleştirin ve config içinde etkin motor olarak seçin:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // Plugin'in kaydettiği motor kimliğiyle eşleşmelidir
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Plugin'e özgü config buraya gelir (Plugin'in belgelerine bakın)
      },
    },
  },
}
```

Kurulum ve yapılandırmadan sonra gateway'i yeniden başlatın.

Yerleşik motora geri dönmek için `contextEngine` değerini `"legacy"` yapın (veya
anahtarı tamamen kaldırın — varsayılan `"legacy"`'dir).

## Nasıl çalışır

OpenClaw her model prompt'unu çalıştırdığında, bağlam motoru
dört yaşam döngüsü noktasında sürece katılır:

1. **Ingest** — oturuma yeni bir mesaj eklendiğinde çağrılır. Motor,
   mesajı kendi veri deposunda saklayabilir veya indeksleyebilir.
2. **Assemble** — her model çalıştırmasından önce çağrılır. Motor,
   token bütçesine sığan sıralı bir mesaj kümesi (ve isteğe bağlı bir `systemPromptAddition`)
   döndürür.
3. **Compact** — bağlam penceresi dolduğunda veya kullanıcı
   `/compact` çalıştırdığında çağrılır. Motor, yer açmak için eski geçmişi özetler.
4. **After turn** — bir çalıştırma tamamlandıktan sonra çağrılır. Motor durumunu kalıcılaştırabilir,
   arka plan Compaction tetikleyebilir veya indeksleri güncelleyebilir.

Paketlenmiş ACP olmayan Codex harness için OpenClaw, aynı yaşam döngüsünü
birleştirilmiş bağlamı Codex geliştirici talimatlarına ve geçerli tur prompt'una yansıtarak uygular.
Codex yine de kendi yerel thread geçmişine ve yerel compactor'ına sahiptir.

### Alt aracı yaşam döngüsü (isteğe bağlı)

OpenClaw iki isteğe bağlı alt aracı yaşam döngüsü kancasını çağırır:

- **prepareSubagentSpawn** — bir alt çalıştırma
  başlamadan önce paylaşılan bağlam durumunu hazırlar. Kanca üst/alt oturum anahtarlarını, `contextMode`
  (`isolated` veya `fork`), kullanılabilir transcript kimliklerini/dosyalarını ve isteğe bağlı TTL'yi alır.
  Bir rollback tanıtıcısı döndürürse, OpenClaw hazırlık başarıyla tamamlandıktan sonra spawn başarısız olduğunda
  onu çağırır.
- **onSubagentEnded** — bir alt aracı oturumu tamamlandığında veya temizlendiğinde temizlik yapar.

### Sistem prompt eklemesi

`assemble` yöntemi bir `systemPromptAddition` dizesi döndürebilir. OpenClaw
bunu çalıştırmanın sistem prompt'unun başına ekler. Bu, motorların
dinamik geri çağırma rehberliği, getirme talimatları veya bağlama duyarlı ipuçları eklemesine
olanak tanır; üstelik statik çalışma alanı dosyaları gerektirmez.

## Legacy motoru

Yerleşik `legacy` motoru, OpenClaw'ın özgün davranışını korur:

- **Ingest**: no-op (mesaj kalıcılaştırmayı doğrudan oturum yöneticisi ele alır).
- **Assemble**: pass-through (çalışma zamanındaki mevcut sanitize → validate → limit hattı
  bağlam birleştirmeyi yönetir).
- **Compact**: yerleşik özetleme Compaction'ına devreder; bu,
  eski mesajların tek bir özetini oluşturur ve son mesajları olduğu gibi korur.
- **After turn**: no-op.

Legacy motoru araç kaydetmez ve `systemPromptAddition` sağlamaz.

`plugins.slots.contextEngine` ayarlanmadığında (veya `"legacy"` olarak ayarlandığında),
bu motor otomatik olarak kullanılır.

## Plugin motorları

Bir Plugin, Plugin API'yi kullanarak bir bağlam motoru kaydedebilir:

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

| Üye               | Tür      | Amaç                                                     |
| ----------------- | -------- | -------------------------------------------------------- |
| `info`            | Özellik  | Motor kimliği, adı, sürümü ve Compaction'a sahip olup olmadığı |
| `ingest(params)`   | Yöntem   | Tek bir mesajı sakla                                     |
| `assemble(params)` | Yöntem   | Bir model çalıştırması için bağlam oluşturur (`AssembleResult` döndürür) |
| `compact(params)`  | Yöntem   | Bağlamı özetler/azaltır                                  |

`assemble`, şu alanlarla bir `AssembleResult` döndürür:

- `messages` — modele gönderilecek sıralı mesajlar.
- `estimatedTokens` (zorunlu, `number`) — motorun birleştirilmiş bağlamdaki toplam
  token sayısına ilişkin tahmini. OpenClaw bunu Compaction eşiği
  kararları ve tanılama raporlaması için kullanır.
- `systemPromptAddition` (isteğe bağlı, `string`) — sistem prompt'unun başına eklenir.

İsteğe bağlı üyeler:

| Üye                           | Tür    | Amaç                                                                                                            |
| ----------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`           | Yöntem | Bir oturum için motor durumunu başlatır. Motor bir oturumu ilk kez gördüğünde çağrılır (ör. geçmişi içe aktarma). |
| `ingestBatch(params)`         | Yöntem | Tamamlanmış bir turu toplu olarak içeri alır. Bir çalıştırma tamamlandıktan sonra, o turdaki tüm mesajlarla tek seferde çağrılır. |
| `afterTurn(params)`           | Yöntem | Çalıştırma sonrası yaşam döngüsü işleri (durumu kalıcılaştırma, arka plan Compaction tetikleme).               |
| `prepareSubagentSpawn(params)` | Yöntem | Bir alt oturum başlamadan önce paylaşılan durumu kurar.                                                          |
| `onSubagentEnded(params)`     | Yöntem | Bir alt aracı sona erdikten sonra temizlik yapar.                                                                |
| `dispose()`                   | Yöntem | Kaynakları serbest bırakır. Gateway kapanışı veya Plugin yeniden yüklemesi sırasında çağrılır — oturum başına değil. |

### ownsCompaction

`ownsCompaction`, Pi'nin yerleşik deneme içi otomatik Compaction'ının
çalıştırma için etkin kalıp kalmayacağını denetler:

- `true` — motor Compaction davranışına sahiptir. OpenClaw, Pi'nin yerleşik
  otomatik Compaction'ını bu çalıştırma için devre dışı bırakır ve motorun `compact()` uygulaması
  `/compact`, taşma kurtarma Compaction'ı ve `afterTurn()` içinde yapmak isteyebileceği
  tüm proaktif Compaction'dan sorumludur.
- `false` veya ayarsız — Pi'nin yerleşik otomatik Compaction'ı prompt
  yürütme sırasında yine çalışabilir, ancak etkin motorun `compact()` yöntemi yine de
  `/compact` ve taşma kurtarma için çağrılır.

`ownsCompaction: false`, OpenClaw'ın otomatik olarak
legacy motorun Compaction yoluna geri düştüğü anlamına **gelmez**.

Bu, iki geçerli Plugin deseni olduğu anlamına gelir:

- **Sahip olan mod** — kendi Compaction algoritmanızı uygulayın ve
  `ownsCompaction: true` ayarlayın.
- **Delege eden mod** — `ownsCompaction: false` ayarlayın ve
  OpenClaw'ın yerleşik Compaction davranışını kullanmak için `openclaw/plugin-sdk/core`
  içinden `delegateCompactionToRuntime(...)` çağıran bir `compact()` kullanın.

No-op bir `compact()`, etkin ve sahip olmayan bir motor için güvenli değildir çünkü
o motor slotu için normal `/compact` ve taşma kurtarma Compaction yolunu
devre dışı bırakır.

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

Slot çalışma zamanında özeldir — belirli bir çalıştırma veya Compaction işlemi için
yalnızca kayıtlı tek bir bağlam motoru çözülür. Etkin olan diğer
`kind: "context-engine"` Plugin'leri yine de yüklenebilir ve kayıt
kodlarını çalıştırabilir; `plugins.slots.contextEngine`, yalnızca OpenClaw'ın
bir bağlam motoruna ihtiyaç duyduğunda hangi kayıtlı motor kimliğini
çözeceğini seçer.

## Compaction ve bellekle ilişkisi

- **Compaction**, bağlam motorunun sorumluluklarından biridir. Legacy motor
  bunu OpenClaw'ın yerleşik özetlemesine devreder. Plugin motorları
  herhangi bir Compaction stratejisini uygulayabilir (DAG özetleri, vektör getirimi vb.).
- **Bellek Plugin'leri** (`plugins.slots.memory`) bağlam motorlarından ayrıdır.
  Bellek Plugin'leri arama/getirme sağlar; bağlam motorları ise modelin
  ne göreceğini denetler. Birlikte çalışabilirler — bir bağlam motoru
  birleştirme sırasında bellek Plugin verilerini kullanabilir. Etkin bellek
  prompt yolunu isteyen Plugin motorları, tercih olarak
  `openclaw/plugin-sdk/core` içinden `buildMemorySystemPromptAddition(...)` kullanmalıdır; bu,
  etkin bellek prompt bölümlerini başa eklemeye hazır bir `systemPromptAddition` öğesine dönüştürür. Bir motor daha düşük seviyeli
  denetime ihtiyaç duyarsa, ham satırları yine de
  `openclaw/plugin-sdk/memory-host-core` içinden
  `buildActiveMemoryPromptSection(...)` aracılığıyla çekebilir.
- **Oturum budama** (eski araç sonuçlarını bellekte kırpma), hangi bağlam motoru etkin olursa olsun
  yine çalışır.

## İpuçları

- Motorunuzun doğru yüklendiğini doğrulamak için `openclaw doctor` kullanın.
- Motor değiştiriyorsanız, mevcut oturumlar geçerli geçmişleriyle devam eder.
  Yeni motor gelecekteki çalıştırmalar için devralır.
- Motor hataları günlüğe kaydedilir ve tanılamada gösterilir. Bir Plugin motoru
  kaydolamazsa veya seçilen motor kimliği çözümlenemezse, OpenClaw
  otomatik olarak geri düşmez; Plugin'i düzeltinceye veya
  `plugins.slots.contextEngine` değerini yeniden `"legacy"` yapıncaya kadar çalıştırmalar başarısız olur.
- Geliştirme için, yerel bir Plugin dizinini kopyalamadan
  bağlamak üzere `openclaw plugins install -l ./my-engine` kullanın.

Ayrıca bkz.: [Compaction](/tr/concepts/compaction), [Context](/tr/concepts/context),
[Plugins](/tr/tools/plugin), [Plugin manifest](/tr/plugins/manifest).

## İlgili

- [Context](/tr/concepts/context) — aracı turları için bağlamın nasıl oluşturulduğu
- [Plugin Architecture](/tr/plugins/architecture) — bağlam motoru Plugin'lerini kaydetme
- [Compaction](/tr/concepts/compaction) — uzun konuşmaları özetleme
