---
read_when:
    - QMD’yi bellek arka ucunuz olarak ayarlamak istiyorsunuz
    - Yeniden sıralama veya ek dizinlenmiş yollar gibi gelişmiş bellek özellikleri istiyorsunuz
summary: BM25, vektörler, yeniden sıralama ve sorgu genişletme ile yerel öncelikli arama yan arabası
title: QMD bellek motoru
x-i18n:
    generated_at: "2026-06-28T22:33:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 14af147882829451f026f0b9b6cc052c6e2129626a4ab0d0b1c7b77a31c1c050
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd), OpenClaw ile birlikte çalışan yerel öncelikli bir arama yan bileşenidir. BM25, vektör araması ve yeniden sıralamayı tek bir ikili dosyada birleştirir ve çalışma alanı bellek dosyalarınızın ötesindeki içerikleri dizine ekleyebilir.

## Yerleşik Üzerine Ekledikleri

- Daha iyi geri çağırma için **yeniden sıralama ve sorgu genişletme**.
- **Ek dizinleri dizine ekleme** -- proje dokümanları, ekip notları, diskteki herhangi bir şey.
- **Oturum transkriptlerini dizine ekleme** -- önceki konuşmaları geri çağırma.
- **Tamamen yerel** -- resmi llama.cpp sağlayıcı Plugin ile çalışır ve GGUF modellerini otomatik indirir.
- **Otomatik geri dönüş** -- QMD kullanılamıyorsa OpenClaw sorunsuzca yerleşik motora geri döner.

## Başlarken

### Ön Koşullar

- QMD'yi kurun: `npm install -g @tobilu/qmd` veya `bun install -g @tobilu/qmd`
- Eklentilere izin veren SQLite derlemesi (macOS'ta `brew install sqlite`).
- QMD, gateway'in `PATH` içinde olmalıdır.
- macOS ve Linux kutudan çıktığı gibi çalışır. Windows en iyi WSL2 üzerinden desteklenir.

### Etkinleştirme

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw, `~/.openclaw/agents/<agentId>/qmd/` altında kendi kendine yeterli bir QMD ana dizini oluşturur ve yan bileşen yaşam döngüsünü otomatik olarak yönetir -- koleksiyonlar, güncellemeler ve embedding çalıştırmaları sizin için ele alınır. Güncel QMD koleksiyonu ve MCP sorgu şekillerini tercih eder, ancak gerektiğinde alternatif koleksiyon desen bayraklarına ve eski MCP araç adlarına yine de geri döner. Önyükleme zamanı uzlaştırması, aynı ada sahip daha eski bir QMD koleksiyonu hâlâ mevcut olduğunda bayat yönetilen koleksiyonları kanonik desenlerine yeniden oluşturur.

## Yan Bileşen Nasıl Çalışır

- OpenClaw, çalışma alanı bellek dosyalarınızdan ve yapılandırılmış tüm `memory.qmd.paths` yollarından koleksiyonlar oluşturur, ardından QMD yöneticisi açıldığında ve sonrasında periyodik olarak (varsayılan her 5 dakikada bir) `qmd update` çalıştırır. Bu yenilemeler, işlem içi dosya sistemi taramasıyla değil, QMD alt süreçleri üzerinden çalışır. Semantik modlar ayrıca `qmd embed` çalıştırır.
- Varsayılan çalışma alanı koleksiyonu, `MEMORY.md` ile `memory/` ağacını izler. Küçük harfli `memory.md`, kök bellek dosyası olarak dizine eklenmez.
- QMD'nin kendi tarayıcısı gizli yolları ve `.git`, `.cache`, `node_modules`, `vendor`, `dist` ve `build` gibi yaygın bağımlılık/derleme dizinlerini yok sayar. Gateway başlangıcı varsayılan olarak QMD'yi başlatmaz, bu nedenle soğuk önyükleme, bellek ilk kez kullanılmadan önce bellek çalışma zamanını içe aktarmaktan veya uzun ömürlü izleyiciyi oluşturmaktan kaçınır.
- Yine de gateway başlangıcında QMD'nin başlatılmasını istiyorsanız, `memory.qmd.update.startup` değerini `idle` veya `immediate` olarak ayarlayın. `memory.qmd.update.onBoot: true` ile başlangıç ilk yenilemeyi çalıştırır. `onBoot: false` ile başlangıç bu anlık yenilemeyi atlar ancak güncelleme veya embedding aralıkları yapılandırıldığında uzun ömürlü yöneticiyi yine de açar; böylece QMD, normal izleyicisini ve zamanlayıcılarını sahiplenebilir.
- Aramalar yapılandırılmış `searchMode` değerini kullanır (varsayılan: `search`; `vsearch` ve `query` de desteklenir). `search` yalnızca BM25'tir, bu yüzden OpenClaw bu modda semantik vektör hazır olma yoklamalarını ve embedding bakımını atlar. Bir mod başarısız olursa OpenClaw `qmd query` ile yeniden dener.
- `searchMode` değeri `query` olduğunda, yeniden sıralayıcı olmadan QMD'nin hibrit sorgu yolunu kullanmak için `memory.qmd.rerank` değerini `false` olarak ayarlayın. OpenClaw, doğrudan QMD CLI yoluna `--no-rerank`, QMD'nin MCP sorgu aracına ise `rerank: false` geçirir. Bu seçenek QMD 2.1 veya daha yenisini gerektirir.
- Çoklu koleksiyon filtrelerinin reklamını yapan QMD sürümlerinde OpenClaw, aynı kaynaklı koleksiyonları tek bir QMD arama çağrısında gruplar. Eski QMD sürümleri uyumlu koleksiyon başına geri dönüş yolunu korur.
- QMD tamamen başarısız olursa OpenClaw yerleşik SQLite motoruna geri döner. Yinelenen sohbet turu denemeleri, bir açma hatasından sonra kısa süre geri çekilir; böylece eksik ikili dosya veya bozuk yan bileşen bağımlılığı bir yeniden deneme fırtınası oluşturmaz. `openclaw memory status` ve tek seferlik CLI yoklamaları QMD'yi doğrudan yeniden denetlemeye devam eder.

<Info>
İlk arama yavaş olabilir -- QMD, ilk `qmd query` çalıştırmasında yeniden sıralama ve sorgu genişletme için GGUF modellerini (~2 GB) otomatik indirir.
</Info>

## Arama Performansı ve Uyumluluk

OpenClaw, QMD arama yolunu hem güncel hem de daha eski QMD kurulumlarıyla uyumlu tutar.

Başlangıçta OpenClaw, kurulu QMD yardım metnini yönetici başına bir kez denetler. İkili dosya birden fazla koleksiyon filtresi desteğini bildiriyorsa OpenClaw tüm aynı kaynaklı koleksiyonları tek komutla arar:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Bu, her dayanıklı bellek koleksiyonu için ayrı bir QMD alt süreci başlatmayı önler. Oturum transkripti koleksiyonları kendi kaynak gruplarında kalır, böylece karma `memory` + `sessions` aramaları sonuç çeşitlendiricisine her iki kaynaktan da girdi vermeye devam eder.

Eski QMD derlemeleri yalnızca bir koleksiyon filtresini kabul eder. OpenClaw bu derlemelerden birini algıladığında, uyumluluk yolunu korur ve sonuçları birleştirip tekilleştirmeden önce her koleksiyonu ayrı ayrı arar.

Kurulu sözleşmeyi elle incelemek için şunu çalıştırın:

```bash
qmd --help | grep -i collection
```

Güncel QMD yardımı, koleksiyon filtrelerinin bir veya daha fazla koleksiyonu hedefleyebileceğini söyler. Eski yardım genellikle tek bir koleksiyonu tanımlar.

## Model Geçersiz Kılmaları

QMD model ortam değişkenleri gateway sürecinden değiştirilmeden geçirilir, böylece yeni OpenClaw yapılandırması eklemeden QMD'yi genel olarak ayarlayabilirsiniz:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Embedding modelini değiştirdikten sonra, dizinin yeni vektör uzayıyla eşleşmesi için embedding'leri yeniden çalıştırın.

## Ek Yolları Dizine Ekleme

Ek dizinleri aranabilir yapmak için QMD'yi onlara yönlendirin:

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

Ek yollardan parçalar arama sonuçlarında `qmd/<collection>/<relative-path>` olarak görünür. `memory_get` bu öneki anlar ve doğru koleksiyon kökünden okur.

## Oturum Transkriptlerini Dizine Ekleme

Önceki konuşmaları geri çağırmak için oturum dizinlemeyi etkinleştirin. QMD hem genel `memorySearch` oturum kaynağına hem de QMD transkript dışa aktarıcısına ihtiyaç duyar:

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

Transkriptler, temizlenmiş Kullanıcı/Asistan turları olarak `~/.openclaw/agents/<id>/qmd/sessions/` altında ayrılmış bir QMD koleksiyonuna dışa aktarılır. Yalnızca `memorySearch.experimental.sessionMemory` ayarlamak transkriptleri QMD'ye dışa aktarmaz.

Oturum isabetleri yine de [`tools.sessions.visibility`](/tr/gateway/config-tools#toolssessions) tarafından filtrelenir. Varsayılan `tree` görünürlüğü ilgisiz aynı ajan oturumlarını açığa çıkarmaz. Gateway tarafından gönderilen bir oturumun ayrı bir DM oturumundan geri çağrılabilir olması gerekiyorsa, `tools.sessions.visibility: "agent"` değerini kasıtlı olarak ayarlayın.

## Arama Kapsamı

Varsayılan olarak QMD arama sonuçları doğrudan ve kanal oturumlarında gösterilir (gruplarda değil). Bunu değiştirmek için `memory.qmd.scope` yapılandırın:

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

Kapsam bir aramayı reddettiğinde OpenClaw, boş sonuçların hata ayıklamasını kolaylaştırmak için türetilmiş kanal ve sohbet türüyle bir uyarı günlüğe kaydeder.

## Alıntılar

`memory.citations` değeri `auto` veya `on` olduğunda, arama parçaları `Source: <path#line>` alt bilgisini içerir. Yolu ajan içine dahili olarak geçirmeye devam ederken alt bilgiyi atlamak için `memory.citations = "off"` ayarlayın.

## Ne Zaman Kullanılmalı

Şunlara ihtiyaç duyduğunuzda QMD'yi seçin:

- Daha yüksek kaliteli sonuçlar için yeniden sıralama.
- Çalışma alanı dışındaki proje dokümanlarını veya notlarını arama.
- Geçmiş oturum konuşmalarını geri çağırma.
- API anahtarı olmadan tamamen yerel arama.

Daha basit kurulumlar için [yerleşik motor](/tr/concepts/memory-builtin), ek bağımlılık gerektirmeden iyi çalışır.

## Sorun Giderme

**QMD bulunamadı mı?** İkili dosyanın gateway'in `PATH` içinde olduğundan emin olun. OpenClaw bir hizmet olarak çalışıyorsa, bir sembolik bağlantı oluşturun: `sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Kabukta `qmd --version` çalışıyor ancak OpenClaw yine de `spawn qmd ENOENT` bildiriyorsa, gateway sürecinin `PATH` değeri muhtemelen etkileşimli kabuğunuzdan farklıdır. İkili dosyayı açıkça sabitleyin:

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

QMD'nin kurulu olduğu ortamda `command -v qmd` kullanın, ardından `openclaw memory status --deep` ile yeniden denetleyin.

**İlk arama çok mu yavaş?** QMD ilk kullanımda GGUF modellerini indirir. OpenClaw'ın kullandığı aynı XDG dizinleriyle `qmd query "test"` kullanarak önceden ısıtın.

**Arama sırasında çok sayıda QMD alt süreci mi var?** Mümkünse QMD'yi güncelleyin. OpenClaw, yalnızca kurulu QMD birden fazla `-c` filtresi desteğini bildirdiğinde aynı kaynaklı çoklu koleksiyon aramaları için tek süreç kullanır; aksi takdirde doğruluk için eski koleksiyon başına geri dönüş yolunu korur.

**Yalnızca BM25 QMD hâlâ llama.cpp derlemeye mi çalışıyor?** `memory.qmd.searchMode = "search"` ayarlayın. OpenClaw bu modu yalnızca sözcüksel olarak ele alır, QMD vektör durum yoklamalarını veya embedding bakımını çalıştırmaz ve semantik hazır olma denetimlerini `vsearch` veya `query` kurulumlarına bırakır.

**Arama zaman aşımına mı uğruyor?** `memory.qmd.limits.timeoutMs` değerini artırın (varsayılan: 4000ms). Daha yavaş donanım için `120000` olarak ayarlayın.

**Grup sohbetlerinde boş sonuçlar mı var?** `memory.qmd.scope` değerini denetleyin -- varsayılan yalnızca doğrudan ve kanal oturumlarına izin verir.

**Kök bellek araması aniden çok mu genişledi?** Gateway'i yeniden başlatın veya bir sonraki başlangıç uzlaştırmasını bekleyin. OpenClaw, aynı ad çakışması algıladığında bayat yönetilen koleksiyonları kanonik `MEMORY.md` ve `memory/` desenlerine geri oluşturur.

**Çalışma alanında görünen geçici repolar `ENAMETOOLONG` veya bozuk dizinlemeye mi neden oluyor?** QMD dolaşımı şu anda OpenClaw'ın yerleşik sembolik bağlantı kuralları yerine alttaki QMD tarayıcı davranışını izler. QMD döngü güvenli dolaşım veya açık dışlama denetimleri sunana kadar geçici monorepo checkout'larını `.tmp/` gibi gizli dizinlerin altında veya dizine eklenen QMD köklerinin dışında tutun.

## Yapılandırma

Tam yapılandırma yüzeyi (`memory.qmd.*`), arama modları, güncelleme aralıkları, kapsam kuralları ve tüm diğer düğmeler için [Bellek yapılandırması başvurusu](/tr/reference/memory-config) sayfasına bakın.

## İlgili

- [Belleğe genel bakış](/tr/concepts/memory)
- [Yerleşik bellek motoru](/tr/concepts/memory-builtin)
- [Honcho belleği](/tr/concepts/memory-honcho)
