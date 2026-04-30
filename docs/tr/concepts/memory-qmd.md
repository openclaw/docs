---
read_when:
    - QMD'yi bellek arka ucunuz olarak ayarlamak istiyorsunuz
    - Yeniden sıralama veya ek dizinlenmiş yollar gibi gelişmiş bellek özellikleri istiyorsunuz
summary: BM25, vektörler, yeniden sıralama ve sorgu genişletme içeren yerel öncelikli arama yan aracı
title: QMD bellek motoru
x-i18n:
    generated_at: "2026-04-30T09:16:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71980e3701f9a5ddcfbbfa41497ef51d2aae2993b2326591124cc0a87f9a849f
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd), OpenClaw ile birlikte çalışan yerel öncelikli bir arama yan sürecidir. BM25'i, vektör aramayı ve yeniden sıralamayı tek bir ikili dosyada birleştirir ve çalışma alanı bellek dosyalarınızın ötesindeki içerikleri dizine ekleyebilir.

## Yerleşik olana kıyasla ekledikleri

- Daha iyi geri çağırma için **yeniden sıralama ve sorgu genişletme**.
- **Ek dizinleri dizine ekleme** -- proje dokümanları, ekip notları, diskteki herhangi bir şey.
- **Oturum dökümlerini dizine ekleme** -- önceki konuşmaları geri çağırma.
- **Tamamen yerel** -- isteğe bağlı node-llama-cpp çalışma zamanı paketiyle çalışır ve GGUF modellerini otomatik indirir.
- **Otomatik geri dönüş** -- QMD kullanılamazsa OpenClaw sorunsuz biçimde yerleşik motora geri döner.

## Başlarken

### Ön koşullar

- QMD'yi yükleyin: `npm install -g @tobilu/qmd` veya `bun install -g @tobilu/qmd`
- Uzantılara izin veren SQLite derlemesi (macOS'te `brew install sqlite`).
- QMD, Gateway'in `PATH` içinde olmalıdır.
- macOS ve Linux kutudan çıktığı gibi çalışır. Windows en iyi WSL2 üzerinden desteklenir.

### Etkinleştirme

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw, `~/.openclaw/agents/<agentId>/qmd/` altında kendi kendine yeten bir QMD ana dizini oluşturur ve yan süreç yaşam döngüsünü otomatik olarak yönetir -- koleksiyonlar, güncellemeler ve embedding çalıştırmaları sizin için ele alınır. Güncel QMD koleksiyonu ve MCP sorgu biçimlerini tercih eder, ancak gerektiğinde alternatif koleksiyon kalıbı bayraklarına ve eski MCP araç adlarına da geri döner. Önyükleme zamanı uzlaştırması, aynı ada sahip daha eski bir QMD koleksiyonu hâlâ mevcut olduğunda bayat yönetilen koleksiyonları yeniden kanonik kalıplarına da oluşturur.

## Yan süreç nasıl çalışır

- OpenClaw, çalışma alanı bellek dosyalarınızdan ve yapılandırılmış herhangi bir `memory.qmd.paths` öğesinden koleksiyonlar oluşturur, ardından QMD yöneticisi açıldığında ve sonrasında periyodik olarak (varsayılan olarak her 5 dakikada bir) `qmd update` çalıştırır. Bu yenilemeler, süreç içi dosya sistemi taramasıyla değil, QMD alt süreçleri üzerinden çalışır. Anlamsal modlar ayrıca `qmd embed` çalıştırır.
- Varsayılan çalışma alanı koleksiyonu, `MEMORY.md` ile `memory/` ağacını izler. Küçük harfli `memory.md`, kök bellek dosyası olarak dizine eklenmez.
- QMD'nin kendi tarayıcısı gizli yolları ve `.git`, `.cache`, `node_modules`, `vendor`, `dist` ve `build` gibi yaygın bağımlılık/derleme dizinlerini yok sayar. Gateway başlangıcı varsayılan olarak QMD'yi başlatmaz; bu yüzden soğuk önyükleme, bellek ilk kez kullanılmadan önce bellek çalışma zamanını içe aktarmaktan veya uzun ömürlü izleyiciyi oluşturmaktan kaçınır.
- Yine de Gateway başlangıcında yenileme istiyorsanız `memory.qmd.update.startup` değerini `idle` veya `immediate` olarak ayarlayın. Tercihe bağlı başlangıç yenilemesi, tam uzun ömürlü süreç içi izleyiciyi oluşturmak yerine tek seferlik bir QMD alt süreç yolu kullanır.
- Aramalar yapılandırılmış `searchMode` değerini kullanır (varsayılan: `search`; `vsearch` ve `query` de desteklenir). `search` yalnızca BM25'tir, bu yüzden OpenClaw bu modda anlamsal vektör hazır olma yoklamalarını ve embedding bakımını atlar. Bir mod başarısız olursa OpenClaw `qmd query` ile yeniden dener.
- Çoklu koleksiyon filtrelerini duyuran QMD sürümleriyle OpenClaw, aynı kaynaklı koleksiyonları tek bir QMD arama çağrısında gruplar. Daha eski QMD sürümleri uyumlu koleksiyon başına geri dönüşü korur.
- QMD tamamen başarısız olursa OpenClaw yerleşik SQLite motoruna geri döner. Tekrarlanan sohbet turu denemeleri, eksik bir ikili dosyanın veya bozuk bir yan süreç bağımlılığının yeniden deneme fırtınası oluşturmaması için açma hatasından sonra kısa süreli geri çekilir; `openclaw memory status` ve tek seferlik CLI yoklamaları yine de QMD'yi doğrudan yeniden denetler.

<Info>
İlk arama yavaş olabilir -- QMD, ilk `qmd query` çalıştırmasında yeniden sıralama ve sorgu genişletme için GGUF modellerini (~2 GB) otomatik indirir.
</Info>

## Arama performansı ve uyumluluk

OpenClaw, QMD arama yolunu hem güncel hem de eski QMD kurulumlarıyla uyumlu tutar.

Başlangıçta OpenClaw, yüklü QMD yardım metnini yönetici başına bir kez denetler. İkili dosya birden fazla koleksiyon filtresi desteği duyuruyorsa OpenClaw, tüm aynı kaynaklı koleksiyonları tek komutla arar:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Bu, her dayanıklı bellek koleksiyonu için ayrı bir QMD alt süreci başlatmayı önler. Oturum dökümü koleksiyonları kendi kaynak gruplarında kalır, böylece karışık `memory` + `sessions` aramaları yine de sonuç çeşitlendiriciye her iki kaynaktan girdi sağlar.

Daha eski QMD derlemeleri yalnızca bir koleksiyon filtresi kabul eder. OpenClaw bu derlemelerden birini algıladığında uyumluluk yolunu korur ve sonuçları birleştirip tekilleştirmeden önce her koleksiyonu ayrı ayrı arar.

Yüklü sözleşmeyi elle incelemek için şunu çalıştırın:

```bash
qmd --help | grep -i collection
```

Güncel QMD yardımı, koleksiyon filtrelerinin bir veya daha fazla koleksiyonu hedefleyebileceğini söyler. Eski yardım genellikle tek bir koleksiyonu açıklar.

## Model geçersiz kılmaları

QMD model ortam değişkenleri Gateway sürecinden değiştirilmeden geçirilir; böylece yeni OpenClaw yapılandırması eklemeden QMD'yi genel olarak ayarlayabilirsiniz:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Embedding modelini değiştirdikten sonra dizinin yeni vektör uzayıyla eşleşmesi için embedding'leri yeniden çalıştırın.

## Ek yolları dizine ekleme

Aranabilir hale getirmek için QMD'yi ek dizinlere yönlendirin:

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

Ek yollardan alınan parçacıklar, arama sonuçlarında `qmd/<collection>/<relative-path>` olarak görünür. `memory_get` bu öneki anlar ve doğru koleksiyon kökünden okur.

## Oturum dökümlerini dizine ekleme

Önceki konuşmaları geri çağırmak için oturum dizinlemeyi etkinleştirin:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Dökümler, temizlenmiş Kullanıcı/Asistan turları olarak `~/.openclaw/agents/<id>/qmd/sessions/` altında özel bir QMD koleksiyonuna dışa aktarılır.

## Arama kapsamı

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

Kapsam bir aramayı reddettiğinde OpenClaw, boş sonuçların hata ayıklamasını kolaylaştırmak için türetilen kanal ve sohbet türüyle bir uyarı günlüğe yazar.

## Alıntılar

`memory.citations`, `auto` veya `on` olduğunda arama parçacıkları `Source: <path#line>` altbilgisi içerir. Yolu aracıya dahili olarak iletmeye devam ederken altbilgiyi atlamak için `memory.citations = "off"` olarak ayarlayın.

## Ne zaman kullanılmalı

Şunlara ihtiyacınız olduğunda QMD'yi seçin:

- Daha yüksek kaliteli sonuçlar için yeniden sıralama.
- Çalışma alanı dışındaki proje dokümanlarını veya notlarını arama.
- Geçmiş oturum konuşmalarını geri çağırma.
- API anahtarları olmadan tamamen yerel arama.

Daha basit kurulumlar için [yerleşik motor](/tr/concepts/memory-builtin), ek bağımlılık olmadan iyi çalışır.

## Sorun giderme

**QMD bulunamadı mı?** İkili dosyanın Gateway'in `PATH` içinde olduğundan emin olun. OpenClaw bir hizmet olarak çalışıyorsa bir sembolik bağlantı oluşturun:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

`qmd --version` kabuğunuzda çalışıyor ancak OpenClaw hâlâ `spawn qmd ENOENT` bildiriyorsa Gateway sürecinin `PATH` değeri muhtemelen etkileşimli kabuğunuzdan farklıdır. İkili dosyayı açıkça sabitleyin:

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

QMD'nin yüklü olduğu ortamda `command -v qmd` kullanın, ardından `openclaw memory status --deep` ile yeniden denetleyin.

**İlk arama çok mu yavaş?** QMD, ilk kullanımda GGUF modellerini indirir. OpenClaw'ın kullandığı aynı XDG dizinleriyle `qmd query "test"` kullanarak önceden ısıtın.

**Arama sırasında çok sayıda QMD alt süreci mi var?** Mümkünse QMD'yi güncelleyin. OpenClaw, aynı kaynaklı çoklu koleksiyon aramalarında tek süreci yalnızca yüklü QMD birden fazla `-c` filtresi desteği duyurduğunda kullanır; aksi halde doğruluk için eski koleksiyon başına geri dönüşü korur.

**Yalnızca BM25 QMD hâlâ llama.cpp derlemeye mi çalışıyor?** `memory.qmd.searchMode = "search"` olarak ayarlayın. OpenClaw bu modu yalnızca sözcüksel olarak ele alır, QMD vektör durum yoklamalarını veya embedding bakımını çalıştırmaz ve anlamsal hazır olma denetimlerini `vsearch` veya `query` kurulumlarına bırakır.

**Arama zaman aşımına mı uğruyor?** `memory.qmd.limits.timeoutMs` değerini artırın (varsayılan: 4000 ms). Daha yavaş donanım için `120000` olarak ayarlayın.

**Grup sohbetlerinde boş sonuçlar mı var?** `memory.qmd.scope` değerini denetleyin -- varsayılan yalnızca doğrudan ve kanal oturumlarına izin verir.

**Kök bellek araması birden çok genişledi mi?** Gateway'i yeniden başlatın veya bir sonraki başlangıç uzlaştırmasını bekleyin. OpenClaw, aynı ada sahip bir çakışma algıladığında bayat yönetilen koleksiyonları yeniden kanonik `MEMORY.md` ve `memory/` kalıplarına oluşturur.

**Çalışma alanından görünen geçici depolar `ENAMETOOLONG` veya bozuk dizinlemeye mi neden oluyor?** QMD geçişi şu anda OpenClaw'ın yerleşik sembolik bağlantı kuralları yerine alttaki QMD tarayıcı davranışını izler. QMD döngüye dayanıklı geçişi veya açık dışlama denetimlerini sunana kadar geçici monorepo checkout'larını `.tmp/` gibi gizli dizinler altında ya da dizine eklenen QMD köklerinin dışında tutun.

## Yapılandırma

Tam yapılandırma yüzeyi (`memory.qmd.*`), arama modları, güncelleme aralıkları, kapsam kuralları ve diğer tüm ayarlar için [Bellek yapılandırma başvurusu](/tr/reference/memory-config) bölümüne bakın.

## İlgili

- [Belleğe genel bakış](/tr/concepts/memory)
- [Yerleşik bellek motoru](/tr/concepts/memory-builtin)
- [Honcho belleği](/tr/concepts/memory-honcho)
