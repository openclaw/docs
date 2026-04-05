---
read_when:
    - QMD'yi bellek arka ucunuz olarak kurmak istiyorsunuz
    - Yeniden sıralama veya ek dizinlenen yollar gibi gelişmiş bellek özellikleri istiyorsunuz
summary: BM25, vektörler, yeniden sıralama ve sorgu genişletme ile local-first arama sidecar'ı
title: QMD Bellek Motoru
x-i18n:
    generated_at: "2026-04-05T13:50:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa8a31ec1a6cc83b6ab413b7dbed6a88055629251664119bfd84308ed166c58e
    source_path: concepts/memory-qmd.md
    workflow: 15
---

# QMD Bellek Motoru

[QMD](https://github.com/tobi/qmd), OpenClaw ile birlikte çalışan bir local-first arama sidecar'ıdır. BM25, vektör araması ve yeniden sıralamayı tek bir ikili dosyada birleştirir ve çalışma alanı bellek dosyalarınızın ötesindeki içerikleri dizinleyebilir.

## Yerleşik motora göre ekledikleri

- Daha iyi geri çağırma için **yeniden sıralama ve sorgu genişletme**.
- **Ek dizinleri dizinleme** -- proje belgeleri, ekip notları, diskteki her şey.
- **Oturum dökümlerini dizinleme** -- önceki konuşmaları hatırlama.
- **Tamamen yerel** -- Bun + node-llama-cpp ile çalışır, GGUF modellerini otomatik indirir.
- **Otomatik geri dönüş** -- QMD kullanılamıyorsa OpenClaw sorunsuz şekilde yerleşik motora geri döner.

## Başlangıç

### Ön koşullar

- QMD'yi yükleyin: `bun install -g @tobilu/qmd`
- Eklentilere izin veren SQLite derlemesi (`brew install sqlite` macOS'ta).
- QMD, gateway'in `PATH`'inde olmalıdır.
- macOS ve Linux kutudan çıktığı gibi çalışır. Windows en iyi WSL2 üzerinden desteklenir.

### Etkinleştirme

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw, `~/.openclaw/agents/<agentId>/qmd/` altında kendine yeterli bir QMD ana dizini oluşturur ve sidecar yaşam döngüsünü otomatik olarak yönetir -- koleksiyonlar, güncellemeler ve embedding çalıştırmaları sizin için ele alınır.

## Sidecar nasıl çalışır

- OpenClaw, çalışma alanı bellek dosyalarınızdan ve yapılandırılmış `memory.qmd.paths` girdilerinden koleksiyonlar oluşturur, ardından açılışta ve düzenli aralıklarla (varsayılan her 5 dakikada bir) `qmd update` + `qmd embed` çalıştırır.
- Açılış yenilemesi arka planda çalışır, böylece sohbet başlatma engellenmez.
- Aramalar yapılandırılmış `searchMode` kullanır (varsayılan: `search`; ayrıca `vsearch` ve `query` de desteklenir). Bir mod başarısız olursa OpenClaw `qmd query` ile yeniden dener.
- QMD tamamen başarısız olursa OpenClaw yerleşik SQLite motoruna geri döner.

<Info>
İlk arama yavaş olabilir -- QMD, ilk `qmd query` çalıştırmasında yeniden sıralama ve sorgu genişletme için GGUF modellerini (~2 GB) otomatik indirir.
</Info>

## Ek yolları dizinleme

Ek dizinleri aranabilir yapmak için QMD'yi bunlara yönlendirin:

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

## Oturum dökümlerini dizinleme

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

Dökümler, `~/.openclaw/agents/<id>/qmd/sessions/` altında ayrılmış bir QMD koleksiyonuna temizlenmiş User/Assistant turları olarak dışa aktarılır.

## Arama kapsamı

Varsayılan olarak QMD arama sonuçları yalnızca DM oturumlarında gösterilir (gruplarda veya kanallarda değil). Bunu değiştirmek için `memory.qmd.scope` yapılandırın:

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

Kapsam bir aramayı reddettiğinde OpenClaw, boş sonuçların hata ayıklamasını kolaylaştırmak için türetilen kanal ve sohbet türüyle birlikte bir uyarı günlüğe kaydeder.

## Alıntılar

`memory.citations` değeri `auto` veya `on` olduğunda, arama parçacıkları `Source: <path#line>` alt bilgisini içerir. Alt bilgiyi çıkarmak ama yolu aracıya dahili olarak aktarmaya devam etmek için `memory.citations = "off"` ayarlayın.

## Ne zaman kullanılmalı

Şunlara ihtiyacınız varsa QMD'yi seçin:

- Daha yüksek kaliteli sonuçlar için yeniden sıralama.
- Çalışma alanı dışındaki proje belgelerinde veya notlarda arama.
- Geçmiş oturum konuşmalarını hatırlama.
- API anahtarları olmadan tamamen yerel arama.

Daha basit kurulumlar için [yerleşik motor](/concepts/memory-builtin) ek bağımlılık olmadan iyi çalışır.

## Sorun giderme

**QMD bulunamıyor mu?** İkili dosyanın gateway'in `PATH`'inde olduğundan emin olun. OpenClaw bir hizmet olarak çalışıyorsa şu sembolik bağlantıyı oluşturun:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**İlk arama çok mu yavaş?** QMD ilk kullanımda GGUF modellerini indirir. OpenClaw'ın kullandığı aynı XDG dizinleriyle `qmd query "test"` çalıştırarak önceden ısıtın.

**Arama zaman aşımına mı uğruyor?** `memory.qmd.limits.timeoutMs` değerini artırın (varsayılan: `4000ms`). Daha yavaş donanımlar için `120000` olarak ayarlayın.

**Grup sohbetlerinde boş sonuçlar mı var?** `memory.qmd.scope` ayarını kontrol edin -- varsayılan yalnızca DM oturumlarına izin verir.

**Çalışma alanında görünen geçici depolar `ENAMETOOLONG` veya bozuk dizinlemeye mi neden oluyor?**
QMD dolaşımı şu anda OpenClaw'ın yerleşik sembolik bağlantı kuralları yerine alttaki QMD tarayıcı davranışını izler. QMD, döngü güvenli dolaşımı veya açık hariç tutma kontrollerini sunana kadar geçici monorepo checkout'larını `.tmp/` gibi gizli dizinler altında veya dizinlenen QMD köklerinin dışında tutun.

## Yapılandırma

Tam yapılandırma yüzeyi (`memory.qmd.*`), arama modları, güncelleme aralıkları,
kapsam kuralları ve diğer tüm seçenekler için bkz.
[Bellek yapılandırma başvurusu](/reference/memory-config).
