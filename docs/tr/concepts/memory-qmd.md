---
read_when:
    - QMD'yi bellek arka ucunuz olarak yapılandırmak istiyorsunuz
    - Yeniden sıralama veya ek dizinlenmiş yollar gibi gelişmiş bellek özellikleri istiyorsunuz
summary: Yerel öncelikli, BM25, vektörler, yeniden sıralama ve sorgu genişletme özellikli arama yan bileşeni
title: QMD bellek motoru
x-i18n:
    generated_at: "2026-06-28T00:28:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 101a29a88a34ebbb6f9414fc91f599db2a6f098bd8c320737d3c8fbc78785f4a
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd), OpenClaw ile birlikte çalışan yerel öncelikli bir arama yan bileşenidir. BM25, vektör araması ve yeniden sıralamayı tek bir ikili dosyada birleştirir ve çalışma alanı bellek dosyalarınızın ötesindeki içerikleri dizine ekleyebilir.

## Yerleşiğe göre ne ekler

- Daha iyi geri çağırma için **yeniden sıralama ve sorgu genişletme**.
- **Ek dizinleri dizine ekleme** -- proje belgeleri, ekip notları, diskteki herhangi bir şey.
- **Oturum dökümlerini dizine ekleme** -- önceki konuşmaları hatırlama.
- **Tamamen yerel** -- resmi llama.cpp sağlayıcı Plugin ile çalışır ve GGUF modellerini otomatik indirir.
- **Otomatik geri dönüş** -- QMD kullanılamıyorsa OpenClaw sorunsuz biçimde yerleşik motora geri döner.

## Başlarken

### Ön koşullar

- QMD'yi yükleyin: `npm install -g @tobilu/qmd` veya `bun install -g @tobilu/qmd`
- Eklentilere izin veren SQLite derlemesi (macOS'te `brew install sqlite`).
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

OpenClaw, `~/.openclaw/agents/<agentId>/qmd/` altında bağımsız bir QMD ana dizini oluşturur ve yan bileşen yaşam döngüsünü otomatik yönetir -- koleksiyonlar, güncellemeler ve embedding çalıştırmaları sizin için ele alınır. Geçerli QMD koleksiyonu ve MCP sorgu biçimlerini tercih eder, ancak gerektiğinde alternatif koleksiyon kalıbı bayraklarına ve eski MCP araç adlarına yine de geri döner. Önyükleme zamanı uzlaştırması, aynı ada sahip daha eski bir QMD koleksiyonu hâlâ mevcut olduğunda eskimiş yönetilen koleksiyonları yeniden kanonik kalıplarına da oluşturur.

## Yan bileşen nasıl çalışır

- OpenClaw, çalışma alanı bellek dosyalarınızdan ve yapılandırılmış tüm `memory.qmd.paths` değerlerinden koleksiyonlar oluşturur; ardından QMD yöneticisi açıldığında ve sonrasında düzenli aralıklarla (varsayılan olarak her 5 dakikada bir) `qmd update` çalıştırır. Bu yenilemeler, süreç içi dosya sistemi taramasıyla değil QMD alt süreçleri üzerinden çalışır. Semantik modlar ayrıca `qmd embed` çalıştırır.
- Varsayılan çalışma alanı koleksiyonu, `MEMORY.md` ile `memory/` ağacını izler. Küçük harfli `memory.md`, kök bellek dosyası olarak dizine eklenmez.
- QMD'nin kendi tarayıcısı gizli yolları ve `.git`, `.cache`, `node_modules`, `vendor`, `dist` ve `build` gibi yaygın bağımlılık/derleme dizinlerini yok sayar. Gateway başlangıcı varsayılan olarak QMD'yi başlatmaz; bu nedenle soğuk önyükleme, bellek ilk kez kullanılmadan önce bellek çalışma zamanını içe aktarmaktan veya uzun ömürlü izleyiciyi oluşturmaktan kaçınır.
- Yine de QMD'nin Gateway başlangıcında başlatılmasını istiyorsanız `memory.qmd.update.startup` değerini `idle` veya `immediate` olarak ayarlayın. `memory.qmd.update.onBoot: true` ile başlangıç ilk yenilemeyi çalıştırır. `onBoot: false` ile başlangıç bu anlık yenilemeyi atlar, ancak güncelleme veya embed aralıkları yapılandırıldığında uzun ömürlü yöneticiyi yine de açar; böylece QMD kendi düzenli izleyicisini ve zamanlayıcılarını sahiplenebilir.
- Aramalar yapılandırılmış `searchMode` değerini kullanır (varsayılan: `search`; `vsearch` ve `query` de desteklenir). `search` yalnızca BM25'tir, bu nedenle OpenClaw bu modda semantik vektör hazır olma yoklamalarını ve embedding bakımını atlar. Bir mod başarısız olursa OpenClaw `qmd query` ile yeniden dener.
- `searchMode` değeri `query` olduğunda, QMD'nin karma sorgu yolunu yeniden sıralayıcı olmadan kullanmak için `memory.qmd.rerank` değerini `false` yapın. OpenClaw, doğrudan QMD CLI yoluna `--no-rerank`, QMD'nin MCP sorgu aracına ise `rerank: false` geçirir. Bu seçenek QMD 2.1 veya daha yeni sürüm gerektirir.
- Çoklu koleksiyon filtrelerini duyuran QMD sürümlerinde OpenClaw, aynı kaynaklı koleksiyonları tek bir QMD arama çağrısında gruplar. Eski QMD sürümleri uyumlu koleksiyon başına geri dönüşü korur.
- QMD tamamen başarısız olursa OpenClaw yerleşik SQLite motoruna geri döner. Tekrarlanan sohbet turu denemeleri, açma hatasından sonra kısa süreli geri çekilir; böylece eksik bir ikili dosya veya bozuk yan bileşen bağımlılığı yeniden deneme fırtınası oluşturmaz. `openclaw memory status` ve tek seferlik CLI yoklamaları QMD'yi yine de doğrudan yeniden kontrol eder.

<Info>
İlk arama yavaş olabilir -- QMD, ilk `qmd query` çalıştırmasında yeniden sıralama ve sorgu genişletme için GGUF modellerini (~2 GB) otomatik indirir.
</Info>

## Arama performansı ve uyumluluk

OpenClaw, QMD arama yolunu hem güncel hem de eski QMD kurulumlarıyla uyumlu tutar.

Başlangıçta OpenClaw, kurulu QMD yardım metnini yönetici başına bir kez kontrol eder. İkili dosya birden fazla koleksiyon filtresi desteği duyuruyorsa OpenClaw aynı kaynaklı tüm koleksiyonları tek komutla arar:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Bu, her dayanıklı bellek koleksiyonu için bir QMD alt süreci başlatmayı önler. Oturum dökümü koleksiyonları kendi kaynak gruplarında kalır; böylece karma `memory` + `sessions` aramaları sonuç çeşitlendiricisine her iki kaynaktan da girdi sağlamaya devam eder.

Eski QMD derlemeleri yalnızca bir koleksiyon filtresi kabul eder. OpenClaw bu derlemelerden birini algıladığında uyumluluk yolunu korur ve sonuçları birleştirip yinelenenleri kaldırmadan önce her koleksiyonu ayrı ayrı arar.

Kurulu sözleşmeyi elle incelemek için şunu çalıştırın:

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

Embedding modelini değiştirdikten sonra, dizinin yeni vektör uzayıyla eşleşmesi için embedding'leri yeniden çalıştırın.

## Ek yolları dizine ekleme

Aranabilir olmaları için QMD'yi ek dizinlere yönlendirin:

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

Ek yollardan gelen parçalar arama sonuçlarında `qmd/<collection>/<relative-path>` olarak görünür. `memory_get` bu öneki anlar ve doğru koleksiyon kökünden okur.

## Oturum dökümlerini dizine ekleme

Önceki konuşmaları hatırlamak için oturum dizinlemeyi etkinleştirin:

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

Dökümler, ayrılmış bir QMD koleksiyonuna temizlenmiş Kullanıcı/Asistan turları olarak `~/.openclaw/agents/<id>/qmd/sessions/` altında dışa aktarılır.

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

Kapsam bir aramayı reddettiğinde OpenClaw, boş sonuçların hata ayıklamasını kolaylaştırmak için türetilen kanal ve sohbet türüyle birlikte bir uyarı günlüğe yazar.

## Alıntılar

`memory.citations` değeri `auto` veya `on` olduğunda arama parçaları `Source: <path#line>` altbilgisi içerir. Yolu aracıya dahili olarak geçirmeye devam ederken altbilgiyi atlamak için `memory.citations = "off"` ayarlayın.

## Ne zaman kullanılmalı

Şunlara ihtiyacınız olduğunda QMD'yi seçin:

- Daha yüksek kaliteli sonuçlar için yeniden sıralama.
- Çalışma alanı dışındaki proje belgelerini veya notları arama.
- Geçmiş oturum konuşmalarını hatırlama.
- API anahtarları olmadan tamamen yerel arama.

Daha basit kurulumlar için [yerleşik motor](/tr/concepts/memory-builtin) ek bağımlılık olmadan iyi çalışır.

## Sorun giderme

**QMD bulunamadı mı?** İkili dosyanın Gateway'in `PATH` içinde olduğundan emin olun. OpenClaw bir servis olarak çalışıyorsa bir sembolik bağlantı oluşturun:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

`qmd --version` kabuğunuzda çalışıyor ancak OpenClaw hâlâ `spawn qmd ENOENT` bildiriyorsa Gateway sürecinin `PATH` değeri büyük olasılıkla etkileşimli kabuğunuzdan farklıdır. İkili dosyayı açıkça sabitleyin:

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

QMD'nin yüklü olduğu ortamda `command -v qmd` kullanın, ardından `openclaw memory status --deep` ile yeniden kontrol edin.

**İlk arama çok mu yavaş?** QMD, ilk kullanımda GGUF modellerini indirir. OpenClaw'ın kullandığı aynı XDG dizinleriyle `qmd query "test"` kullanarak ön ısıtma yapın.

**Arama sırasında çok sayıda QMD alt süreci mi var?** Mümkünse QMD'yi güncelleyin. OpenClaw, aynı kaynaklı çoklu koleksiyon aramaları için tek süreci yalnızca kurulu QMD birden fazla `-c` filtresi desteği duyurduğunda kullanır; aksi halde doğruluk için eski koleksiyon başına geri dönüşü korur.

**Yalnızca BM25 QMD hâlâ llama.cpp derlemeye mi çalışıyor?** `memory.qmd.searchMode = "search"` ayarlayın. OpenClaw bu modu yalnızca sözcüksel olarak ele alır, QMD vektör durum yoklamaları veya embedding bakımı çalıştırmaz ve semantik hazır olma kontrollerini `vsearch` veya `query` kurulumlarına bırakır.

**Arama zaman aşımına mı uğruyor?** `memory.qmd.limits.timeoutMs` değerini artırın (varsayılan: 4000ms). Daha yavaş donanım için `120000` olarak ayarlayın.

**Grup sohbetlerinde boş sonuçlar mı var?** `memory.qmd.scope` değerini kontrol edin -- varsayılan yalnızca doğrudan ve kanal oturumlarına izin verir.

**Kök bellek araması aniden çok mu genişledi?** Gateway'i yeniden başlatın veya bir sonraki başlangıç uzlaştırmasını bekleyin. OpenClaw, aynı ada sahip bir çakışma algıladığında eskimiş yönetilen koleksiyonları yeniden kanonik `MEMORY.md` ve `memory/` kalıplarına oluşturur.

**Çalışma alanında görünen geçici repolar `ENAMETOOLONG` veya bozuk dizinlemeye mi neden oluyor?** QMD geçişi şu anda OpenClaw'ın yerleşik sembolik bağlantı kuralları yerine temel QMD tarayıcı davranışını izler. QMD döngü güvenli geçiş veya açık dışlama denetimleri sunana kadar geçici monorepo checkout'larını `.tmp/` gibi gizli dizinlerin altında veya dizine eklenen QMD köklerinin dışında tutun.

## Yapılandırma

Tam yapılandırma yüzeyi (`memory.qmd.*`), arama modları, güncelleme aralıkları, kapsam kuralları ve diğer tüm ayarlar için [Bellek yapılandırma başvurusu](/tr/reference/memory-config) bölümüne bakın.

## İlgili

- [Belleğe genel bakış](/tr/concepts/memory)
- [Yerleşik bellek motoru](/tr/concepts/memory-builtin)
- [Honcho belleği](/tr/concepts/memory-honcho)
