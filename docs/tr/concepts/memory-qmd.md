---
read_when:
    - Bellek arka ucunuz olarak QMD'yi ayarlamak istiyorsunuz
    - Yeniden sıralama veya ek dizine alınmış yollar gibi gelişmiş bellek özellikleri istiyorsunuz
summary: BM25, vektörler, yeniden sıralama ve sorgu genişletme özellikli yerel öncelikli arama yardımcı hizmeti
title: QMD bellek motoru
x-i18n:
    generated_at: "2026-07-16T17:04:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b13017ead7e7340624a35e603a18216a5c23405cbab09e7f53b1e15d74d59d23
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd), OpenClaw ile birlikte çalışan, önce yerel yaklaşımı benimseyen bir arama yardımcı sürecidir. BM25, vektör araması ve yeniden sıralamayı tek bir ikili dosyada birleştirir ve çalışma alanı bellek dosyalarınızın dışındaki içerikleri de dizine ekleyebilir.

## Yerleşik motora ek olarak sağladıkları

- Daha iyi geri çağırma için **yeniden sıralama ve sorgu genişletme**.
- **Ek dizinleri dizine ekleme** - proje belgeleri, ekip notları, diskteki her şey.
- **Oturum dökümlerini dizine ekleme** - önceki konuşmaları hatırlama.
- **Tamamen yerel** - resmî llama.cpp sağlayıcı pluginiyle çalışır ve
  GGUF modellerini otomatik olarak indirir.
- **Otomatik geri dönüş** - QMD kullanılamıyorsa OpenClaw sorunsuz biçimde
  yerleşik motora geri döner.

## Başlarken

### Ön koşullar

- QMD'yi yükleyin: `npm install -g @tobilu/qmd` veya `bun install -g @tobilu/qmd`
- Uzantılara izin veren SQLite derlemesi (macOS'te `brew install sqlite`).
- QMD, gateway'in `PATH` değerinde bulunmalıdır.
- macOS ve Linux doğrudan çalışır. Windows en iyi WSL2 aracılığıyla desteklenir.

### Etkinleştirme

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw, `~/.openclaw/agents/<agentId>/qmd/` altında bağımsız bir QMD ana dizini oluşturur
ve yardımcı sürecin yaşam döngüsünü otomatik olarak yönetir;
koleksiyonlar, güncellemeler ve gömme çalıştırmaları sizin yerinize gerçekleştirilir.
Güncel QMD koleksiyon ve MCP sorgu biçimlerini tercih eder, ancak gerektiğinde
alternatif koleksiyon örüntüsü bayraklarına ve eski MCP araç adlarına geri döner.
Başlangıç uzlaştırması ayrıca aynı ada sahip eski bir QMD koleksiyonu hâlâ
mevcutsa güncelliğini yitirmiş yönetilen koleksiyonları yeniden standart
örüntüleriyle oluşturur.

## Yardımcı süreç nasıl çalışır?

- OpenClaw, çalışma alanı bellek dosyalarınızdan ve yapılandırılmış
  `memory.qmd.paths` değerlerinden koleksiyonlar oluşturur; ardından QMD yöneticisi
  açıldığında ve sonrasında düzenli aralıklarla (`memory.qmd.update.interval`, varsayılan
  `5m`) `qmd update` çalıştırır. Yenilemeler, işlem içi dosya sistemi
  taramasıyla değil QMD alt süreçleri aracılığıyla çalışır. Anlamsal arama modları ayrıca
  `qmd embed` çalıştırır
  (`memory.qmd.update.embedInterval`, varsayılan `60m`).
- Varsayılan çalışma alanı koleksiyonu, `MEMORY.md` ile `memory/`
  ağacını izler. Küçük harfli `memory.md`, kök bellek dosyası olarak dizine eklenmez.
- QMD'nin kendi tarayıcısı gizli yolları ve `.git`, `.cache`,
  `node_modules`, `vendor`, `dist` ve `build` gibi yaygın bağımlılık/derleme
  dizinlerini yok sayar. Gateway başlangıcı varsayılan olarak QMD'yi başlatmaz
  (`memory.qmd.update.startup` varsayılan olarak `off` değerindedir); böylece soğuk başlatma,
  bellek ilk kez kullanılmadan önce bellek çalışma zamanını içe aktarmaktan veya
  uzun ömürlü izleyiciyi oluşturmaktan kaçınır.
- QMD'yi yine de gateway başlangıcında başlatmak için `memory.qmd.update.startup` değerini
  `idle` veya `immediate` olarak ayarlayın. `memory.qmd.update.onBoot` varsayılan olarak
  `true` değerindedir ve ilk yenilemeyi başlangıçta çalıştırır; bu anlık yenilemeyi
  atlamak için bunu `false` olarak ayarlayın (güncelleme veya gömme aralıkları
  yapılandırıldığında uzun ömürlü yönetici yine açılır; dolayısıyla QMD düzenli
  izleyicisinin/zamanlayıcılarının sahibi olmaya devam eder).
- Aramalar yapılandırılmış `searchMode` değerini kullanır (varsayılan:
  `search`; `vsearch` ve `query` değerlerini de destekler).
  `search` yalnızca BM25 kullanır; bu nedenle OpenClaw bu modda anlamsal
  vektör hazırlık yoklamalarını ve gömme bakımını atlar. Bir mod başarısız olursa
  OpenClaw `qmd query` ile yeniden dener.
- `searchMode` değeri `query` olduğunda, QMD'nin yeniden
  sıralayıcı olmadan hibrit sorgu yolunu kullanmak için `memory.qmd.rerank` değerini
  `false` olarak ayarlayın (QMD 2.1 veya daha yenisini gerektirir).
  OpenClaw, doğrudan QMD CLI yoluna `--no-rerank`, QMD'nin MCP sorgu aracına ise
  `rerank: false` iletir.
- Çoklu koleksiyon filtrelerini desteklediğini bildiren QMD sürümlerinde
  OpenClaw, aynı kaynaktan gelen koleksiyonları tek bir QMD arama çağrısında gruplandırır.
  Eski QMD sürümleri uyumlu koleksiyon başına geri dönüş yöntemini kullanmaya devam eder.
- QMD tamamen başarısız olursa OpenClaw yerleşik SQLite motoruna geri döner.
  Tekrarlanan sohbet turu girişimleri, açma hatasından sonra kısa süreliğine bekleme
  uygular; böylece eksik bir ikili dosya veya bozuk bir yardımcı süreç bağımlılığı
  yeniden deneme fırtınası oluşturmaz. `openclaw memory status` ve tek seferlik CLI yoklamaları
  QMD'yi doğrudan yeniden denetlemeye devam eder.

<Info>
İlk arama yavaş olabilir; QMD, ilk `qmd query` çalıştırmasında yeniden
sıralama ve sorgu genişletme için GGUF modellerini (~2 GB) otomatik olarak indirir.
</Info>

## Arama performansı ve uyumluluk

OpenClaw, QMD arama yolunu hem güncel hem de eski QMD kurulumlarıyla uyumlu tutar.

OpenClaw başlangıçta, kurulu QMD yardım metnini yönetici başına bir kez denetler.
İkili dosya birden çok koleksiyon filtresini desteklediğini bildirirse OpenClaw,
aynı kaynaktan gelen tüm koleksiyonları tek bir komutla arar:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Bu, her kalıcı bellek koleksiyonu için bir QMD alt süreci başlatılmasını önler.
Oturum dökümü koleksiyonları kendi kaynak gruplarında kalır; böylece karma
`memory` + `sessions` aramaları, sonuç çeşitlendiriciye her iki
kaynaktan da girdi sağlamaya devam eder.

Eski QMD derlemeleri yalnızca bir koleksiyon filtresi kabul eder. OpenClaw bu
derlemelerden birini algıladığında uyumluluk yolunu korur ve sonuçları birleştirip
yinelenenleri kaldırmadan önce her koleksiyonu ayrı ayrı arar.

Kurulu sözleşmeyi elle incelemek için şunu çalıştırın:

```bash
qmd --help | grep -i collection
```

Güncel QMD yardımında bir veya daha fazla koleksiyonun hedeflenmesinden söz edilir.
Eski yardım genellikle tek bir koleksiyonu açıklar.

## Model geçersiz kılmaları

QMD model ortam değişkenleri gateway sürecinden değiştirilmeden aktarılır;
böylece yeni OpenClaw yapılandırması eklemeden QMD'yi genel olarak ayarlayabilirsiniz:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Gömme modelini değiştirdikten sonra dizinin yeni vektör uzayıyla eşleşmesi için
gömmeleri yeniden çalıştırın.

## Ek yolları dizine ekleme

Ek dizinleri aranabilir hâle getirmek için QMD'yi bu dizinlere yönlendirin:

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

Ek yollardan gelen parçacıklar arama sonuçlarında `qmd/<collection>/<relative-path>` olarak görünür.
`memory_get` bu öneki anlar ve doğru koleksiyon kökünden okur.

## Oturum dökümlerini dizine ekleme

Önceki konuşmaları hatırlamak için oturum dizine eklemeyi etkinleştirin. QMD hem
genel `memorySearch` oturum kaynağına hem de QMD döküm dışa aktarıcısına ihtiyaç duyar:

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

Dökümler, temizlenmiş Kullanıcı/Asistan turları olarak `~/.openclaw/agents/<id>/qmd/sessions/` altındaki
özel bir QMD koleksiyonuna dışa aktarılır. Yalnızca `memorySearch.experimental.sessionMemory` ayarının
yapılması dökümleri QMD'ye dışa aktarmaz.

Oturum eşleşmeleri yine
[`tools.sessions.visibility`](/tr/gateway/config-tools#toolssessions) tarafından filtrelenir.
Varsayılan `tree` görünürlüğü, ilgisiz aynı ajan oturumlarını göstermez.
Gateway tarafından gönderilen bir oturumun ayrı bir DM oturumundan hatırlanabilmesi
gerekiyorsa `tools.sessions.visibility: "agent"` değerini bilinçli olarak ayarlayın.

## Arama kapsamı

Varsayılan olarak QMD arama sonuçları yalnızca doğrudan oturumlarda gösterilir;
grup veya kanal sohbetlerinde gösterilmez. Bunu değiştirmek için
`memory.qmd.scope` değerini yapılandırın:

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

Yukarıdaki parçacık gerçek varsayılan kuraldır. Kapsam bir aramayı reddettiğinde
OpenClaw, boş sonuçların hata ayıklamasını kolaylaştırmak için türetilen kanal ve
sohbet türüyle birlikte bir uyarı günlüğe kaydeder.

## Atıflar

`memory.citations` değeri `auto` veya `on` olduğunda,
arama parçacıklarına bir `Source: <path>#L<line>` (veya `#L<start>-L<end>`) altbilgisi
eklenir. `auto` modunda altbilgi yalnızca doğrudan sohbet oturumlarına
eklenir. Yol ajan içinde aktarılmaya devam ederken altbilgiyi kaldırmak için
`memory.citations = "off"` değerini ayarlayın.

## Ne zaman kullanılmalı?

Şunlara ihtiyacınız olduğunda QMD'yi seçin:

- Daha yüksek kaliteli sonuçlar için yeniden sıralama.
- Çalışma alanı dışındaki proje belgelerini veya notları arama.
- Geçmiş oturum konuşmalarını hatırlama.
- API anahtarı gerektirmeyen tamamen yerel arama.

Daha basit kurulumlarda [yerleşik motor](/tr/concepts/memory-builtin), ek bağımlılık
gerektirmeden iyi çalışır.

## Sorun giderme

**QMD bulunamadı mı?** İkili dosyanın gateway'in `PATH` değerinde
bulunduğundan emin olun. OpenClaw bir hizmet olarak çalışıyorsa bir sembolik bağlantı
oluşturun: `sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

`qmd --version` kabuğunuzda çalışıyor ancak OpenClaw yine de
`spawn qmd ENOENT` bildiriyorsa gateway işlemi muhtemelen etkileşimli kabuğunuzdan
farklı bir `PATH` değerine sahiptir. İkili dosyayı açıkça sabitleyin:

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

QMD'nin kurulu olduğu ortamda `command -v qmd` kullanın, ardından
`openclaw memory status --deep` ile yeniden denetleyin.

**İlk arama çok mu yavaş?** QMD, ilk kullanımda GGUF modellerini indirir.
OpenClaw'un kullandığı aynı XDG dizinleriyle `qmd query "test"` kullanarak önceden ısıtın.

**Arama sırasında çok sayıda QMD alt süreci mi var?** Mümkünse QMD'yi güncelleyin.
OpenClaw, aynı kaynaklı çoklu koleksiyon aramalarında yalnızca kurulu QMD birden çok
`-c` filtresini desteklediğini bildirirse tek bir işlem kullanır;
aksi hâlde doğruluk için eski koleksiyon başına geri dönüş yöntemini korur.

**Yalnızca BM25 kullanan QMD yine de llama.cpp'yi derlemeye mi çalışıyor?**
`memory.qmd.searchMode = "search"` değerini ayarlayın. OpenClaw bu modu yalnızca sözcüksel olarak
değerlendirir, QMD vektör durumu yoklamalarını ve gömme bakımını atlar ve anlamsal
hazırlık denetimlerini `vsearch` veya `query` kurulumlarına bırakır.

**Arama zaman aşımına mı uğruyor?** `memory.qmd.limits.timeoutMs` değerini artırın
(varsayılan: 4000ms). Daha yavaş donanımlar için bunu daha yüksek bir değere,
örneğin `120000` değerine ayarlayın. Bu sınır, ajan `memory_search`
çağrıları sırasında QMD'nin kendi arama komutlarına uygulanır; kurulum, eşitleme,
yerleşik geri dönüş ve ek derlem çalışmaları kendi daha kısa süre sınırlarını korur.

**Grup veya kanal sohbetlerinde boş sonuçlar mı var?** Yalnızca doğrudan oturumlara
izin veren varsayılan `memory.qmd.scope` ile bu beklenen bir durumdur. QMD sonuçlarını
orada da istiyorsanız `group` veya `channel` sohbet türleri için
bir `allow` kuralı ekleyin.

**Kök bellek araması aniden çok mu genişledi?** Gateway'i yeniden başlatın veya
bir sonraki başlangıç uzlaştırmasını bekleyin. OpenClaw, aynı adlı bir çakışma
algıladığında güncelliğini yitirmiş yönetilen koleksiyonları yeniden standart
`MEMORY.md` ve `memory/` örüntüleriyle oluşturur.

**Çalışma alanında görünen geçici depolar `ENAMETOOLONG` sorununa veya bozuk
dizine eklemeye mi neden oluyor?** QMD dolaşımı, OpenClaw'un yerleşik sembolik
bağlantı kuralları yerine temel QMD tarayıcısını izler. QMD döngü açısından güvenli
dolaşım veya açık dışlama denetimleri sunana kadar geçici monorepo kullanıma alma
kopyalarını `.tmp/` gibi gizli dizinlerin altında ya da dizine eklenen
QMD köklerinin dışında tutun.

## Yapılandırma

Tam yapılandırma yüzeyi (`memory.qmd.*`), arama modları, güncelleme aralıkları,
kapsam kuralları ve diğer tüm ayarlar için
[Bellek yapılandırma başvurusuna](/tr/reference/memory-config) bakın.

## İlgili içerikler

- [Belleğe genel bakış](/tr/concepts/memory)
- [Yerleşik bellek motoru](/tr/concepts/memory-builtin)
- [Honcho belleği](/tr/concepts/memory-honcho)
