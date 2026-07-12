---
read_when:
    - Bellek arka ucunuz olarak QMD'yi ayarlamak istiyorsunuz
    - Yeniden sıralama veya ek dizinlenmiş yollar gibi gelişmiş bellek özellikleri istiyorsunuz
summary: BM25, vektörler, yeniden sıralama ve sorgu genişletme özelliklerine sahip, öncelikle yerel çalışan arama yardımcı hizmeti
title: QMD bellek motoru
x-i18n:
    generated_at: "2026-07-12T12:15:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd), OpenClaw ile birlikte çalışan, yerel öncelikli bir arama yardımcı hizmetidir. BM25, vektör araması ve yeniden sıralamayı tek bir çalıştırılabilir dosyada birleştirir ve çalışma alanı bellek dosyalarınızın ötesindeki içerikleri dizine ekleyebilir.

## Yerleşik motora kıyasla sundukları

- Daha iyi geri çağırma için **yeniden sıralama ve sorgu genişletme**.
- **Ek dizinleri dizine ekleme** - proje belgeleri, ekip notları ve diskteki diğer her şey.
- **Oturum dökümlerini dizine ekleme** - önceki konuşmaları hatırlama.
- **Tamamen yerel** - resmi llama.cpp sağlayıcı Plugin'iyle çalışır ve GGUF modellerini otomatik olarak indirir.
- **Otomatik geri dönüş** - QMD kullanılamıyorsa OpenClaw sorunsuzca yerleşik motora geri döner.

## Başlarken

### Ön koşullar

- QMD'yi yükleyin: `npm install -g @tobilu/qmd` veya `bun install -g @tobilu/qmd`
- Uzantılara izin veren bir SQLite derlemesi (macOS'ta `brew install sqlite`).
- QMD, Gateway'in `PATH` değişkeninde bulunmalıdır.
- macOS ve Linux doğrudan çalışır. Windows en iyi WSL2 aracılığıyla desteklenir.

### Etkinleştirme

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw, `~/.openclaw/agents/<agentId>/qmd/` altında kendi kendine yeten bir QMD ana dizini oluşturur ve yardımcı hizmetin yaşam döngüsünü otomatik olarak yönetir; koleksiyonlar, güncellemeler ve gömme çalıştırmaları sizin için gerçekleştirilir. Güncel QMD koleksiyon ve MCP sorgu biçimlerini tercih eder ancak gerektiğinde alternatif koleksiyon kalıbı bayraklarına ve eski MCP araç adlarına geri döner. Başlangıç uzlaştırması ayrıca aynı ada sahip eski bir QMD koleksiyonu hâlâ mevcut olduğunda, güncelliğini yitirmiş yönetilen koleksiyonları kurallı kalıplarına göre yeniden oluşturur.

## Yardımcı hizmetin çalışma biçimi

- OpenClaw, çalışma alanı bellek dosyalarınızdan ve yapılandırılmış `memory.qmd.paths` yollarından koleksiyonlar oluşturur; ardından QMD yöneticisi açıldığında ve sonrasında düzenli aralıklarla (`memory.qmd.update.interval`, varsayılan `5m`) `qmd update` çalıştırır. Yenilemeler, süreç içi dosya sistemi taramasıyla değil, QMD alt süreçleri aracılığıyla yürütülür. Anlamsal arama modları ayrıca `qmd embed` çalıştırır (`memory.qmd.update.embedInterval`, varsayılan `60m`).
- Varsayılan çalışma alanı koleksiyonu, `MEMORY.md` dosyasını ve `memory/` ağacını izler. Küçük harfli `memory.md`, kök bellek dosyası olarak dizine eklenmez.
- QMD'nin kendi tarayıcısı gizli yolları ve `.git`, `.cache`, `node_modules`, `vendor`, `dist` ve `build` gibi yaygın bağımlılık/derleme dizinlerini yok sayar. Gateway başlangıcı varsayılan olarak QMD'yi başlatmaz (`memory.qmd.update.startup` varsayılan olarak `off` değerindedir); böylece soğuk başlatma, bellek ilk kez kullanılmadan önce bellek çalışma zamanını içe aktarmaktan veya uzun ömürlü izleyiciyi oluşturmaktan kaçınır.
- QMD'yi yine de Gateway başlangıcında başlatmak için `memory.qmd.update.startup` değerini `idle` veya `immediate` olarak ayarlayın. `memory.qmd.update.onBoot` varsayılan olarak `true` değerindedir ve ilk yenilemeyi başlangıçta çalıştırır; bu anlık yenilemeyi atlamak için değeri `false` olarak ayarlayın (güncelleme veya gömme aralıkları yapılandırılmışsa uzun ömürlü yönetici yine açılır; böylece QMD, düzenli izleyicisini/zamanlayıcılarını yönetmeye devam eder).
- Aramalar yapılandırılmış `searchMode` değerini kullanır (varsayılan: `search`; `vsearch` ve `query` de desteklenir). `search` yalnızca BM25 kullandığından OpenClaw bu modda anlamsal vektör hazırlık yoklamalarını ve gömme bakımını atlar. Bir mod başarısız olursa OpenClaw `qmd query` ile yeniden dener.
- `searchMode`, `query` olduğunda QMD'nin hibrit sorgu yolunu yeniden sıralayıcı olmadan kullanmak için `memory.qmd.rerank` değerini `false` olarak ayarlayın (QMD 2.1 veya daha yenisini gerektirir). OpenClaw, doğrudan QMD CLI yoluna `--no-rerank`, QMD'nin MCP sorgu aracına ise `rerank: false` iletir.
- Çoklu koleksiyon filtrelerini desteklediğini bildiren QMD sürümlerinde OpenClaw, aynı kaynaklı koleksiyonları tek bir QMD arama çağrısında gruplandırır. Eski QMD sürümleri, uyumlu koleksiyon başına geri dönüş yolunu kullanmaya devam eder.
- QMD tamamen başarısız olursa OpenClaw yerleşik SQLite motoruna geri döner. Eksik bir çalıştırılabilir dosyanın veya bozuk bir yardımcı hizmet bağımlılığının yeniden deneme fırtınası oluşturmaması için, açılış hatasından sonra tekrarlanan sohbet turu denemeleri kısa süreliğine geri çekilir; `openclaw memory status` ve tek seferlik CLI yoklamaları ise QMD'yi doğrudan yeniden denetlemeye devam eder.

<Info>
İlk arama yavaş olabilir; QMD, ilk `qmd query` çalıştırmasında yeniden sıralama ve sorgu genişletme için GGUF modellerini (~2 GB) otomatik olarak indirir.
</Info>

## Arama performansı ve uyumluluk

OpenClaw, QMD arama yolunu hem güncel hem de eski QMD kurulumlarıyla uyumlu tutar.

Başlangıçta OpenClaw, kurulu QMD yardım metnini yönetici başına bir kez denetler. Çalıştırılabilir dosya birden fazla koleksiyon filtresini desteklediğini bildiriyorsa OpenClaw, aynı kaynaklı tüm koleksiyonları tek bir komutla arar:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Bu, her kalıcı bellek koleksiyonu için ayrı bir QMD alt süreci başlatılmasını önler. Oturum dökümü koleksiyonları kendi kaynak gruplarında kalır; böylece karma `memory` + `sessions` aramaları, sonuç çeşitlendiricisine her iki kaynaktan da girdi sağlamaya devam eder.

Eski QMD derlemeleri yalnızca tek bir koleksiyon filtresi kabul eder. OpenClaw bu derlemelerden birini algıladığında uyumluluk yolunu korur ve sonuçları birleştirip yinelenenleri kaldırmadan önce her koleksiyonu ayrı ayrı arar.

Kurulu sözleşmeyi elle incelemek için şunu çalıştırın:

```bash
qmd --help | grep -i collection
```

Güncel QMD yardımında bir veya daha fazla koleksiyonun hedeflenmesinden söz edilir. Eski yardım genellikle tek bir koleksiyonu açıklar.

## Model geçersiz kılmaları

QMD model ortam değişkenleri Gateway sürecinden değiştirilmeden aktarılır; böylece yeni OpenClaw yapılandırması eklemeden QMD'yi genel olarak ayarlayabilirsiniz:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Gömme modelini değiştirdikten sonra, dizinin yeni vektör uzayıyla eşleşmesi için gömmeleri yeniden çalıştırın.

## Ek yolları dizine ekleme

Aranabilir hâle getirmek istediğiniz ek dizinleri QMD'ye yönlendirin:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Ek yollardan gelen parçacıklar, arama sonuçlarında `qmd/<collection>/<relative-path>` biçiminde görünür. `memory_get` bu öneki tanır ve doğru koleksiyon kökünden okur.

## Oturum dökümlerini dizine ekleme

Önceki konuşmaları hatırlamak için oturum dizinlemeyi etkinleştirin. QMD hem genel `memorySearch` oturum kaynağına hem de QMD döküm dışa aktarıcısına ihtiyaç duyar:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        experimental: { sessionMemory: true },
        sources: ["memory", "sessions"],
      },
    },
  },
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Dökümler, temizlenmiş Kullanıcı/Asistan turları olarak `~/.openclaw/agents/<id>/qmd/sessions/` altındaki özel bir QMD koleksiyonuna aktarılır. Yalnızca `memorySearch.experimental.sessionMemory` ayarının yapılması, dökümleri QMD'ye aktarmaz.

Oturum eşleşmeleri yine [`tools.sessions.visibility`](/tr/gateway/config-tools#toolssessions) tarafından filtrelenir. Varsayılan `tree` görünürlüğü, aynı ajana ait ilgisiz oturumları göstermez. Gateway tarafından yönlendirilen bir oturumun ayrı bir DM oturumundan hatırlanabilmesi gerekiyorsa `tools.sessions.visibility: "agent"` ayarını bilinçli olarak yapın.

## Arama kapsamı

Varsayılan olarak QMD arama sonuçları yalnızca doğrudan oturumlarda gösterilir (grup veya kanal sohbetlerinde gösterilmez). Bunu değiştirmek için `memory.qmd.scope` değerini yapılandırın:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Yukarıdaki parça gerçek varsayılan kuraldır. Kapsam bir aramayı reddettiğinde OpenClaw, boş sonuçların hata ayıklamasını kolaylaştırmak için türetilen kanal ve sohbet türünü içeren bir uyarı günlüğü oluşturur.

## Atıflar

`memory.citations`, `auto` veya `on` olduğunda arama parçacıklarının sonuna `Source: <path>#L<line>` (veya `#L<start>-L<end>`) alt bilgisi eklenir. `auto` modunda alt bilgi yalnızca doğrudan sohbet oturumları için eklenir. Yol ajana dâhilî olarak iletilmeye devam ederken alt bilgiyi kaldırmak için `memory.citations = "off"` ayarını yapın.

## Ne zaman kullanılmalı

Şunlara ihtiyaç duyduğunuzda QMD'yi seçin:

- Daha yüksek kaliteli sonuçlar için yeniden sıralama.
- Çalışma alanı dışındaki proje belgelerinde veya notlarda arama yapma.
- Geçmiş oturum konuşmalarını hatırlama.
- API anahtarları olmadan tamamen yerel arama.

Daha basit kurulumlarda [yerleşik motor](/tr/concepts/memory-builtin), ek bağımlılıklar olmadan iyi çalışır.

## Sorun giderme

**QMD bulunamadı mı?** Çalıştırılabilir dosyanın Gateway'in `PATH` değişkeninde olduğundan emin olun. OpenClaw bir hizmet olarak çalışıyorsa sembolik bağlantı oluşturun:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

`qmd --version` kabuğunuzda çalışıyor ancak OpenClaw hâlâ `spawn qmd ENOENT` bildiriyorsa Gateway süreci muhtemelen etkileşimli kabuğunuzdan farklı bir `PATH` değerine sahiptir. Çalıştırılabilir dosyayı açıkça sabitleyin:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

QMD'nin kurulu olduğu ortamda `command -v qmd` komutunu kullanın, ardından `openclaw memory status --deep` ile yeniden denetleyin.

**İlk arama çok mu yavaş?** QMD, ilk kullanımda GGUF modellerini indirir. OpenClaw'ın kullandığı XDG dizinlerini kullanarak `qmd query "test"` ile önceden ısıtın.

**Arama sırasında çok sayıda QMD alt süreci mi oluşuyor?** Mümkünse QMD'yi güncelleyin. OpenClaw, yalnızca kurulu QMD birden fazla `-c` filtresini desteklediğini bildirdiğinde aynı kaynaklı çoklu koleksiyon aramalarında tek süreç kullanır; aksi hâlde doğruluk için eski koleksiyon başına geri dönüş yolunu korur.

**Yalnızca BM25 kullanan QMD yine de llama.cpp derlemeye mi çalışıyor?** `memory.qmd.searchMode = "search"` ayarını yapın. OpenClaw bu modu yalnızca sözcüksel olarak değerlendirir, QMD vektör durum yoklamalarını ve gömme bakımını atlar ve anlamsal hazırlık denetimlerini `vsearch` veya `query` kurulumlarına bırakır.

**Arama zaman aşımına mı uğruyor?** `memory.qmd.limits.timeoutMs` değerini artırın (varsayılan: 4000 ms). Daha yavaş donanımlar için örneğin `120000` gibi daha yüksek bir değer ayarlayın.

**Grup veya kanal sohbetlerinde sonuçlar boş mu?** Yalnızca doğrudan oturumlara izin veren varsayılan `memory.qmd.scope` ile bu beklenen bir durumdur. QMD sonuçlarını bu sohbetlerde de istiyorsanız `group` veya `channel` sohbet türleri için bir `allow` kuralı ekleyin.

**Kök bellek araması birdenbire fazla mı genişledi?** Gateway'i yeniden başlatın veya bir sonraki başlangıç uzlaştırmasını bekleyin. OpenClaw, aynı adla bir çakışma algıladığında güncelliğini yitirmiş yönetilen koleksiyonları kurallı `MEMORY.md` ve `memory/` kalıplarına göre yeniden oluşturur.

**Çalışma alanında görünen geçici depolar `ENAMETOOLONG` hatasına veya bozuk dizinlemeye mi neden oluyor?** QMD gezinmesi, OpenClaw'ın yerleşik sembolik bağlantı kuralları yerine temel QMD tarayıcısını izler. QMD, döngü güvenli gezinme veya açık hariç tutma denetimleri sunana kadar geçici tek depo çalışma kopyalarını `.tmp/` gibi gizli dizinlerin altında veya dizine eklenen QMD köklerinin dışında tutun.

## Yapılandırma

Tam yapılandırma yüzeyi (`memory.qmd.*`), arama modları, güncelleme aralıkları, kapsam kuralları ve diğer tüm ayarlar için [Bellek yapılandırması başvurusuna](/tr/reference/memory-config) bakın.

## İlgili

- [Belleğe genel bakış](/tr/concepts/memory)
- [Yerleşik bellek motoru](/tr/concepts/memory-builtin)
- [Honcho belleği](/tr/concepts/memory-honcho)
