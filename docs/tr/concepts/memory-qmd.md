---
read_when:
    - QMD'yi bellek backend'iniz olarak kurmak istiyorsunuz
    - Yeniden sıralama veya ek dizinlenmiş yollar gibi gelişmiş bellek özellikleri istiyorsunuz
summary: BM25, vektörler, yeniden sıralama ve sorgu genişletme ile local-first arama yan hizmeti
title: QMD bellek motoru
x-i18n:
    generated_at: "2026-04-24T09:05:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d7af326291e194a04a17aa425901bf7e2517c23bae8282cd504802d24e9e522
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd), OpenClaw ile birlikte çalışan local-first bir arama yan hizmetidir. Tek bir ikili dosyada BM25, vektör araması ve yeniden sıralamayı birleştirir ve çalışma alanı bellek dosyalarınızın ötesindeki içeriği dizinleyebilir.

## Yerleşik olana göre ne ekler

- Daha iyi geri çağırma için **yeniden sıralama ve sorgu genişletme**.
- **Ek dizinleri dizinleme** -- proje belgeleri, ekip notları, diskteki her şey.
- **Oturum transkriptlerini dizinleme** -- önceki konuşmaları geri çağırma.
- **Tamamen yerel** -- Bun + node-llama-cpp ile çalışır, GGUF modellerini otomatik indirir.
- **Otomatik fallback** -- QMD kullanılamazsa OpenClaw sorunsuz şekilde yerleşik motora geri düşer.

## Başlangıç

### Ön koşullar

- QMD'yi kurun: `npm install -g @tobilu/qmd` veya `bun install -g @tobilu/qmd`
- Uzantılara izin veren bir SQLite yapısı (`macOS` üzerinde `brew install sqlite`).
- QMD, gateway'in `PATH` değişkeninde olmalıdır.
- macOS ve Linux kutudan çıktığı gibi çalışır. Windows en iyi WSL2 üzerinden desteklenir.

### Etkinleştirme

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw, `~/.openclaw/agents/<agentId>/qmd/` altında kendi kendine yeterli bir QMD ana dizini oluşturur ve yan hizmet yaşam döngüsünü otomatik olarak yönetir -- koleksiyonlar, güncellemeler ve embedding çalıştırmaları sizin için ele alınır.
Güncel QMD koleksiyonunu ve MCP sorgu şekillerini tercih eder, ancak gerektiğinde eski `--mask` koleksiyon bayraklarına ve daha eski MCP araç adlarına yine geri düşer.
Önyükleme zamanı uzlaştırması ayrıca, aynı ada sahip eski bir QMD koleksiyonu hâlâ mevcut olduğunda eski yönetilen koleksiyonları yeniden kanonik desenlerine oluşturur.

## Yan hizmet nasıl çalışır

- OpenClaw, çalışma alanı bellek dosyalarınızdan ve yapılandırılmış
  `memory.qmd.paths` girişlerinden koleksiyonlar oluşturur, ardından önyüklemede
  ve periyodik olarak (`varsayılan 5 dakikada bir`) `qmd update` + `qmd embed` çalıştırır.
- Varsayılan çalışma alanı koleksiyonu `MEMORY.md` ile `memory/`
  ağacını izler. Küçük harfli `memory.md`, kök bellek dosyası olarak dizinlenmez.
- Önyükleme yenilemesi arka planda çalışır, böylece sohbet başlangıcı engellenmez.
- Aramalar yapılandırılmış `searchMode` değerini kullanır (varsayılan: `search`; ayrıca
  `vsearch` ve `query` de desteklenir). Bir mod başarısız olursa OpenClaw `qmd query` ile yeniden dener.
- QMD tamamen başarısız olursa OpenClaw yerleşik SQLite motoruna geri düşer.

<Info>
İlk arama yavaş olabilir -- QMD, ilk `qmd query` çalıştırmasında
yeniden sıralama ve sorgu genişletme için GGUF modellerini (~2 GB) otomatik indirir.
</Info>

## Model geçersiz kılmaları

QMD model ortam değişkenleri gateway sürecinden değişmeden geçirilir, böylece yeni bir OpenClaw yapılandırması eklemeden QMD'yi genel olarak ayarlayabilirsiniz:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Embedding modelini değiştirdikten sonra, dizinin yeni vektör uzayıyla eşleşmesi için embedding'leri yeniden çalıştırın.

## Ek yolları dizinleme

Ek dizinleri aranabilir hâle getirmek için QMD'yi onlara yönlendirin:

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

Ek yollardan alınan parçacıklar arama sonuçlarında `qmd/<collection>/<relative-path>` olarak görünür. `memory_get`, bu öneki anlar ve doğru koleksiyon kökünden okur.

## Oturum transkriptlerini dizinleme

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

Transkriptler, `~/.openclaw/agents/<id>/qmd/sessions/` altındaki ayrılmış bir QMD koleksiyonuna sanitize edilmiş User/Assistant turları olarak dışa aktarılır.

## Arama kapsamı

Varsayılan olarak, QMD arama sonuçları doğrudan ve kanal oturumlarında
(gruplarda değil) yüzeye çıkarılır. Bunu değiştirmek için `memory.qmd.scope` yapılandırın:

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

Kapsam bir aramayı reddettiğinde OpenClaw, boş sonuçların hata ayıklaması kolay olsun diye türetilmiş kanal ve sohbet türüyle birlikte bir uyarı günlüğe yazar.

## Atıflar

`memory.citations`, `auto` veya `on` olduğunda arama parçacıkları
`Source: <path#line>` alt bilgisini içerir. Alt bilgiyi çıkarmak ama yolu yine de içten ajana geçirmek için `memory.citations = "off"` ayarlayın.

## Ne zaman kullanılmalı

Şunlara ihtiyacınız olduğunda QMD'yi seçin:

- Daha yüksek kaliteli sonuçlar için yeniden sıralama.
- Çalışma alanı dışındaki proje belgeleri veya notlarda arama.
- Geçmiş oturum konuşmalarını geri çağırma.
- API anahtarı gerektirmeyen tamamen yerel arama.

Daha basit kurulumlar için [yerleşik motor](/tr/concepts/memory-builtin), ek bağımlılık olmadan iyi çalışır.

## Sorun giderme

**QMD bulunamadı mı?** İkili dosyanın gateway'in `PATH` değişkeninde olduğundan emin olun. OpenClaw
bir servis olarak çalışıyorsa bir symlink oluşturun:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**İlk arama çok mu yavaş?** QMD ilk kullanımda GGUF modellerini indirir. OpenClaw'ın kullandığı aynı XDG dizinleriyle `qmd query "test"` çalıştırarak önceden ısıtın.

**Arama zaman aşımına mı uğruyor?** `memory.qmd.limits.timeoutMs` değerini artırın (varsayılan: 4000ms).
Daha yavaş donanım için `120000` olarak ayarlayın.

**Grup sohbetlerinde boş sonuçlar mı var?** `memory.qmd.scope` değerini kontrol edin -- varsayılan olarak yalnızca
doğrudan ve kanal oturumlarına izin verilir.

**Kök bellek araması birden çok genişledi mi?** Gateway'i yeniden başlatın veya
bir sonraki başlangıç uzlaştırmasını bekleyin. OpenClaw, aynı adlı
bir çakışma algıladığında eski yönetilen koleksiyonları yeniden kanonik `MEMORY.md` ve `memory/`
desenlerine oluşturur.

**Çalışma alanında görünür geçici depolar `ENAMETOOLONG` veya bozuk dizinlemeye mi neden oluyor?**
QMD dolaşımı şu anda OpenClaw'ın yerleşik symlink kuralları yerine alttaki QMD tarayıcı davranışını izler. QMD
döngü güvenli dolaşımı veya açık dışlama denetimleri sunana kadar geçici monorepo checkout'larını
`.tmp/` gibi gizli dizinler altında veya dizinlenen QMD köklerinin dışında tutun.

## Yapılandırma

Tam yapılandırma yüzeyi (`memory.qmd.*`), arama modları, güncelleme aralıkları,
kapsam kuralları ve diğer tüm düğmeler için
[Bellek yapılandırma başvurusu](/tr/reference/memory-config) bölümüne bakın.

## İlgili

- [Belleğe genel bakış](/tr/concepts/memory)
- [Yerleşik bellek motoru](/tr/concepts/memory-builtin)
- [Honcho bellek](/tr/concepts/memory-honcho)
