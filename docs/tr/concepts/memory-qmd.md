---
read_when:
    - QMD'yi bellek arka ucunuz olarak ayarlamak istiyorsunuz
    - Yeniden sıralama veya ek dizinlenmiş yollar gibi gelişmiş bellek özellikleri istiyorsunuz
summary: BM25, vektörler, yeniden sıralama ve sorgu genişletme ile local-first arama sidecar'ı
title: QMD Memory Engine
x-i18n:
    generated_at: "2026-04-12T23:28:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27afc996b959d71caed964a3cae437e0e29721728b30ebe7f014db124c88da04
    source_path: concepts/memory-qmd.md
    workflow: 15
---

# QMD Memory Engine

[QMD](https://github.com/tobi/qmd), OpenClaw ile birlikte çalışan local-first bir arama sidecar'ıdır. BM25, vektör araması ve yeniden sıralamayı tek bir binary içinde birleştirir ve çalışma alanı bellek dosyalarınızın ötesindeki içeriği dizinleyebilir.

## Yerleşik olana kıyasla ekledikleri

- **Daha iyi geri çağırma için yeniden sıralama ve sorgu genişletme**.
- **Ek dizinleri dizinleyin** -- proje belgeleri, ekip notları, diskteki herhangi bir şey.
- **Oturum transkriptlerini dizinleyin** -- önceki konuşmaları geri çağırın.
- **Tamamen local** -- Bun + node-llama-cpp aracılığıyla çalışır, GGUF modellerini otomatik indirir.
- **Otomatik fallback** -- QMD kullanılamıyorsa, OpenClaw yerleşik motora sorunsuz şekilde fallback yapar.

## Başlarken

### Önkoşullar

- QMD'yi yükleyin: `npm install -g @tobilu/qmd` veya `bun install -g @tobilu/qmd`
- Uzantılara izin veren bir SQLite derlemesi (`macOS` üzerinde `brew install sqlite`).
- QMD, Gateway'in `PATH` değişkeninde olmalıdır.
- macOS ve Linux kutudan çıktığı gibi çalışır. Windows en iyi WSL2 üzerinden desteklenir.

### Etkinleştirme

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw, `~/.openclaw/agents/<agentId>/qmd/` altında kendi kendine yeterli bir QMD ana dizini oluşturur ve sidecar yaşam döngüsünü otomatik olarak yönetir -- koleksiyonlar, güncellemeler ve embedding çalıştırmaları sizin için yönetilir. Mevcut QMD koleksiyonu ve MCP sorgu şekillerini tercih eder, ancak gerektiğinde eski `--mask` koleksiyon bayraklarına ve daha eski MCP araç adlarına yine de fallback yapar.

## Sidecar nasıl çalışır

- OpenClaw, çalışma alanı bellek dosyalarınızdan ve yapılandırılmış `memory.qmd.paths` girdilerinden koleksiyonlar oluşturur, ardından açılışta ve düzenli aralıklarla (`varsayılan` her 5 dakikada bir) `qmd update` + `qmd embed` çalıştırır.
- Varsayılan çalışma alanı koleksiyonu `MEMORY.md` ile `memory/` ağacını izler. Küçük harfli `memory.md`, ayrı bir QMD koleksiyonu değil, bootstrap fallback olarak kalır.
- Açılış yenilemesi arka planda çalışır, böylece sohbet başlatma engellenmez.
- Aramalar yapılandırılmış `searchMode` kullanır (`varsayılan`: `search`; ayrıca `vsearch` ve `query` de desteklenir). Bir mod başarısız olursa, OpenClaw `qmd query` ile yeniden dener.
- QMD tamamen başarısız olursa, OpenClaw yerleşik SQLite motoruna fallback yapar.

<Info>
İlk arama yavaş olabilir -- QMD, ilk `qmd query` çalıştırmasında yeniden sıralama ve sorgu genişletme için GGUF modellerini (~2 GB) otomatik indirir.
</Info>

## Model geçersiz kılmaları

QMD model ortam değişkenleri, Gateway işleminden değişmeden geçirilir; böylece yeni bir OpenClaw yapılandırması eklemeden QMD'yi global olarak ayarlayabilirsiniz:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Embedding modelini değiştirdikten sonra, dizinin yeni vektör uzayıyla eşleşmesi için embedding'leri yeniden çalıştırın.

## Ek yolları dizinleme

Ek dizinleri aranabilir hale getirmek için QMD'yi bu dizinlere yönlendirin:

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

Transkriptler, temizlenmiş User/Assistant dönüşleri olarak `~/.openclaw/agents/<id>/qmd/sessions/` altında ayrılmış bir QMD koleksiyonuna aktarılır.

## Arama kapsamı

Varsayılan olarak, QMD arama sonuçları doğrudan ve kanal oturumlarında gösterilir (gruplarda değil). Bunu değiştirmek için `memory.qmd.scope` yapılandırın:

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

Kapsam bir aramayı reddettiğinde, OpenClaw türetilen kanal ve sohbet türü ile birlikte bir uyarı günlüğe kaydeder; böylece boş sonuçları hata ayıklamak daha kolay olur.

## Atıflar

`memory.citations` değeri `auto` veya `on` olduğunda, arama parçacıkları `Source: <path#line>` alt bilgisini içerir. Alt bilgiyi kaldırmak ancak yolu yine de agente dahili olarak iletmek için `memory.citations = "off"` ayarlayın.

## Ne zaman kullanılmalı

Şunlara ihtiyaç duyduğunuzda QMD'yi seçin:

- Daha yüksek kaliteli sonuçlar için yeniden sıralama.
- Çalışma alanı dışındaki proje belgeleri veya notlarda arama yapma.
- Geçmiş oturum konuşmalarını geri çağırma.
- API anahtarları olmadan tamamen local arama.

Daha basit kurulumlar için [yerleşik motor](/tr/concepts/memory-builtin), ek bağımlılık olmadan iyi çalışır.

## Sorun giderme

**QMD bulunamadı mı?** Binary'nin Gateway'in `PATH` değişkeninde olduğundan emin olun. OpenClaw bir servis olarak çalışıyorsa, bir symlink oluşturun:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**İlk arama çok mu yavaş?** QMD, ilk kullanımda GGUF modellerini indirir. OpenClaw'ın kullandığı aynı XDG dizinleriyle `qmd query "test"` çalıştırarak önceden ısıtın.

**Arama zaman aşımına mı uğruyor?** `memory.qmd.limits.timeoutMs` değerini artırın (`varsayılan`: 4000ms). Daha yavaş donanım için `120000` olarak ayarlayın.

**Grup sohbetlerinde boş sonuçlar mı var?** `memory.qmd.scope` ayarını kontrol edin -- varsayılan yalnızca doğrudan ve kanal oturumlarına izin verir.

**Çalışma alanında görünen geçici repolar `ENAMETOOLONG` veya bozuk dizinlemeye mi neden oluyor?** QMD geçişi şu anda OpenClaw'ın yerleşik symlink kuralları yerine, alttaki QMD tarayıcı davranışını izler. QMD döngü güvenli geçiş veya açık dışlama denetimleri sunana kadar geçici monorepo checkout'larını `.tmp/` gibi gizli dizinlerin altında veya dizinlenmiş QMD köklerinin dışında tutun.

## Yapılandırma

Tam yapılandırma yüzeyi (`memory.qmd.*`), arama modları, güncelleme aralıkları, kapsam kuralları ve diğer tüm ayarlar için [Memory yapılandırma başvurusu](/tr/reference/memory-config) sayfasına bakın.
