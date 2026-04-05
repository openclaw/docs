---
read_when:
    - OpenClaw'ın model bağlamını nasıl oluşturduğunu anlamak istiyorsunuz
    - Eski motor ile bir eklenti motoru arasında geçiş yapıyorsunuz
    - Bir bağlam motoru eklentisi oluşturuyorsunuz
summary: 'Bağlam motoru: takılabilir bağlam oluşturma, sıkıştırma ve alt ajan yaşam döngüsü'
title: Context Engine
x-i18n:
    generated_at: "2026-04-05T13:50:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd8cbb0e953f58fd84637fc4ceefc65984312cf2896d338318bc8cf860e6d9
    source_path: concepts/context-engine.md
    workflow: 15
---

# Context Engine

Bir **bağlam motoru**, OpenClaw'ın her çalıştırma için model bağlamını nasıl oluşturduğunu kontrol eder.
Hangi mesajların dahil edileceğine, eski geçmişin nasıl özetleneceğine ve
alt ajan sınırları boyunca bağlamın nasıl yönetileceğine karar verir.

OpenClaw, yerleşik bir `legacy` motoruyla gelir. Eklentiler,
etkin bağlam motoru yaşam döngüsünün yerini alan alternatif motorlar kaydedebilir.

## Hızlı başlangıç

Hangi motorun etkin olduğunu kontrol edin:

```bash
openclaw doctor
# veya yapılandırmayı doğrudan inceleyin:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Bir bağlam motoru eklentisi yükleme

Bağlam motoru eklentileri, diğer tüm OpenClaw eklentileri gibi yüklenir. Önce
yükleyin, ardından yuvadaki motoru seçin:

```bash
# npm'den yükleyin
openclaw plugins install @martian-engineering/lossless-claw

# Veya yerel bir yoldan yükleyin (geliştirme için)
openclaw plugins install -l ./my-context-engine
```

Ardından eklentiyi etkinleştirin ve yapılandırmanızda etkin motor olarak seçin:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // eklentinin kaydettiği motor kimliğiyle eşleşmelidir
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Eklentiye özgü yapılandırma buraya gelir (eklentinin belgelerine bakın)
      },
    },
  },
}
```

Yükleyip yapılandırdıktan sonra gateway'i yeniden başlatın.

Yerleşik motora geri dönmek için `contextEngine` değerini `"legacy"` yapın (veya
anahtarı tamamen kaldırın — varsayılan `"legacy"` değeridir).

## Nasıl çalışır

OpenClaw bir model istemi her çalıştırdığında, bağlam motoru
dört yaşam döngüsü noktasında devreye girer:

1. **Ingest** — oturuma yeni bir mesaj eklendiğinde çağrılır. Motor,
   mesajı kendi veri deposunda saklayabilir veya indeksleyebilir.
2. **Assemble** — her model çalıştırmasından önce çağrılır. Motor,
   belirteç bütçesine sığan sıralı bir mesaj kümesi (ve isteğe bağlı bir `systemPromptAddition`)
   döndürür.
3. **Compact** — bağlam penceresi dolduğunda veya kullanıcı
   `/compact` çalıştırdığında çağrılır. Motor, yer açmak için eski geçmişi özetler.
4. **After turn** — bir çalıştırma tamamlandıktan sonra çağrılır. Motor durumu kalıcı hale getirebilir,
   arka plan sıkıştırmasını tetikleyebilir veya indeksleri güncelleyebilir.

### Alt ajan yaşam döngüsü (isteğe bağlı)

OpenClaw şu anda bir alt ajan yaşam döngüsü hook'u çağırır:

- **onSubagentEnded** — bir alt ajan oturumu tamamlandığında veya temizlendiğinde temizleme yapar.

`prepareSubagentSpawn` hook'u gelecekte kullanılmak üzere arayüzün bir parçasıdır, ancak
çalışma zamanı bunu henüz çağırmaz.

### Sistem istemi eklemesi

`assemble` yöntemi bir `systemPromptAddition` dizgesi döndürebilir. OpenClaw
bunu çalıştırma için sistem isteminin başına ekler. Bu, motorların
statik çalışma alanı dosyaları gerektirmeden dinamik geri çağırma rehberliği,
geri getirme talimatları veya bağlama duyarlı ipuçları eklemesine olanak tanır.

## Legacy motoru

Yerleşik `legacy` motoru, OpenClaw'ın özgün davranışını korur:

- **Ingest**: işlem yok (mesaj kalıcılığını doğrudan oturum yöneticisi işler).
- **Assemble**: olduğu gibi geçirme (çalışma zamanındaki mevcut sanitize → validate → limit işlem hattı
  bağlam oluşturmayı işler).
- **Compact**: yerleşik özetleme sıkıştırmasına devreder; bu işlem
  eski mesajların tek bir özetini oluşturur ve son mesajları olduğu gibi tutar.
- **After turn**: işlem yok.

Legacy motoru araç kaydetmez ve bir `systemPromptAddition` sağlamaz.

`plugins.slots.contextEngine` ayarlanmamışsa (veya `"legacy"` olarak ayarlanmışsa), bu
motor otomatik olarak kullanılır.

## Eklenti motorları

Bir eklenti, eklenti API'sini kullanarak bir bağlam motoru kaydedebilir:

```ts
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

    async assemble({ sessionId, messages, tokenBudget }) {
      // Bütçeye sığan mesajları döndürün
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: "Use lcm_grep to search history...",
      };
    },

    async compact({ sessionId, force }) {
      // Eski bağlamı özetleyin
      return { ok: true, compacted: true };
    },
  }));
}
```

Ardından bunu yapılandırmada etkinleştirin:

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
| `info`             | Özellik  | Motor kimliği, adı, sürümü ve sıkıştırmanın ona ait olup olmadığı |
| `ingest(params)`   | Yöntem   | Tek bir mesajı depolama                                  |
| `assemble(params)` | Yöntem   | Bir model çalıştırması için bağlam oluşturma (`AssembleResult` döndürür) |
| `compact(params)`  | Yöntem   | Bağlamı özetleme/azaltma                                 |

`assemble`, şu alanları içeren bir `AssembleResult` döndürür:

- `messages` — modele gönderilecek sıralı mesajlar.
- `estimatedTokens` (zorunlu, `number`) — motorun oluşturulan bağlamdaki toplam
  belirteç sayısı tahmini. OpenClaw bunu sıkıştırma eşiği
  kararları ve tanılama raporlaması için kullanır.
- `systemPromptAddition` (isteğe bağlı, `string`) — sistem isteminin başına eklenir.

İsteğe bağlı üyeler:

| Üye                            | Tür    | Amaç                                                                                                            |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Yöntem | Bir oturum için motor durumunu başlatma. Motor bir oturumu ilk kez gördüğünde bir kez çağrılır (ör. geçmişi içe aktarma). |
| `ingestBatch(params)`          | Yöntem | Tamamlanmış bir turu toplu olarak alma. Bir çalıştırma tamamlandıktan sonra, o turdaki tüm mesajlarla tek seferde çağrılır. |
| `afterTurn(params)`            | Yöntem | Çalıştırma sonrası yaşam döngüsü işi (durumu kalıcı hale getirme, arka plan sıkıştırmasını tetikleme).          |
| `prepareSubagentSpawn(params)` | Yöntem | Bir alt oturum için paylaşılan durumu hazırlama.                                                                |
| `onSubagentEnded(params)`      | Yöntem | Bir alt ajan sona erdikten sonra temizleme.                                                                     |
| `dispose()`                    | Yöntem | Kaynakları serbest bırakma. Gateway kapanışı veya eklenti yeniden yüklemesi sırasında çağrılır — oturum başına değil. |

### ownsCompaction

`ownsCompaction`, Pi'nin yerleşik deneme içi otomatik sıkıştırmasının
çalıştırma için etkin kalıp kalmayacağını kontrol eder:

- `true` — sıkıştırma davranışı motora aittir. OpenClaw, o çalıştırma için Pi'nin yerleşik
  otomatik sıkıştırmasını devre dışı bırakır ve motorun `compact()` uygulaması
  `/compact`, taşma kurtarma sıkıştırması ve
  `afterTurn()` içinde yapmak istediği proaktif sıkıştırmadan sorumlu olur.
- `false` veya ayarlanmamış — Pi'nin yerleşik otomatik sıkıştırması istem
  yürütme sırasında yine de çalışabilir, ancak etkin motorun `compact()` yöntemi
  `/compact` ve taşma kurtarma için yine çağrılır.

`ownsCompaction: false`, OpenClaw'ın otomatik olarak
legacy motorunun sıkıştırma yoluna geri düştüğü anlamına **gelmez**.

Bu, iki geçerli eklenti modeli olduğu anlamına gelir:

- **Sahiplenen mod** — kendi sıkıştırma algoritmanızı uygulayın ve
  `ownsCompaction: true` ayarlayın.
- **Devreden mod** — `ownsCompaction: false` ayarlayın ve
  OpenClaw'ın yerleşik sıkıştırma davranışını kullanmak için `compact()` içinde
  `openclaw/plugin-sdk/core` içinden `delegateCompactionToRuntime(...)` çağırın.

İşlem yapmayan bir `compact()`, etkin ve sahiplenmeyen bir motor için güvenli değildir çünkü
o motor yuvası için normal `/compact` ve taşma kurtarma sıkıştırma yolunu
devre dışı bırakır.

## Yapılandırma başvurusu

```json5
{
  plugins: {
    slots: {
      // Etkin bağlam motorunu seçin. Varsayılan: "legacy".
      // Bir eklenti motoru kullanmak için bunu bir eklenti kimliğine ayarlayın.
      contextEngine: "legacy",
    },
  },
}
```

Yuva çalışma zamanında özeldir — belirli bir çalıştırma veya sıkıştırma işlemi için
yalnızca bir kayıtlı bağlam motoru çözülür. Etkin olan diğer
`kind: "context-engine"` eklentileri yine de yüklenebilir ve kayıt
kodlarını çalıştırabilir; `plugins.slots.contextEngine`, yalnızca OpenClaw'ın bir bağlam motoruna ihtiyaç duyduğunda
hangi kayıtlı motor kimliğini çözeceğini seçer.

## Sıkıştırma ve bellekle ilişkisi

- **Sıkıştırma**, bağlam motorunun sorumluluklarından biridir. Legacy motoru
  OpenClaw'ın yerleşik özetlemesine devreder. Eklenti motorları
  herhangi bir sıkıştırma stratejisini uygulayabilir (DAG özetleri, vektör geri getirme vb.).
- **Bellek eklentileri** (`plugins.slots.memory`) bağlam motorlarından ayrıdır.
  Bellek eklentileri arama/geri getirme sağlar; bağlam motorları modelin
  ne gördüğünü kontrol eder. Birlikte çalışabilirler — bir bağlam motoru
  oluşturma sırasında bellek eklentisi verilerini kullanabilir.
- **Oturum budama** (bellekte eski araç sonuçlarını kırpma), hangi bağlam motoru etkin olursa olsun
  yine de çalışır.

## İpuçları

- Motorunuzun düzgün yüklendiğini doğrulamak için `openclaw doctor` kullanın.
- Motor değiştiriyorsanız mevcut oturumlar, geçerli geçmişleriyle devam eder.
  Yeni motor gelecekteki çalıştırmaları devralır.
- Motor hataları günlüğe kaydedilir ve tanılamalarda gösterilir. Bir eklenti motoru
  kaydedilemezse veya seçilen motor kimliği çözülemezse, OpenClaw
  otomatik olarak geri dönmez; eklentiyi düzeltene veya
  `plugins.slots.contextEngine` değerini yeniden `"legacy"` olarak değiştirene kadar çalıştırmalar başarısız olur.
- Geliştirme için, yerel bir eklenti dizinini kopyalamadan bağlamak üzere
  `openclaw plugins install -l ./my-engine` kullanın.

Ayrıca bakın: [Compaction](/concepts/compaction), [Context](/concepts/context),
[Plugins](/tools/plugin), [Plugin manifest](/plugins/manifest).

## İlgili

- [Context](/concepts/context) — ajan turları için bağlamın nasıl oluşturulduğu
- [Plugin Architecture](/plugins/architecture) — bağlam motoru eklentilerini kaydetme
- [Compaction](/concepts/compaction) — uzun konuşmaları özetleme
