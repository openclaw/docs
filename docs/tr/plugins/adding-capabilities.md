---
read_when:
    - Yeni bir çekirdek yetenek ve Plugin kayıt yüzeyi ekleme
    - Kodun çekirdeğe, bir tedarikçi Plugin'ine veya bir özellik Plugin'ine ait olup olmadığına karar verme
    - Kanallar veya araçlar için yeni bir çalışma zamanı yardımcısı bağlama
sidebarTitle: Adding capabilities
summary: OpenClaw Plugin sistemine yeni bir paylaşılan yetenek eklemek için katkıda bulunan rehberi
title: Yetenek ekleme (katkıda bulunan kılavuzu)
x-i18n:
    generated_at: "2026-06-28T00:50:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8a25122a7b76ff5bbb7616748d5fad2397502f9accb5428134a75d65e872034
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Bu, OpenClaw çekirdek geliştiricileri için bir **katkıda bulunan kılavuzudur**. Harici bir Plugin
  oluşturuyorsanız, bunun yerine [Plugin oluşturma](/tr/plugins/building-plugins)
  bölümüne bakın. Derin mimari başvurusu (yetenek modeli, sahiplik,
  yükleme hattı, çalışma zamanı yardımcıları) için [Plugin iç yapıları](/tr/plugins/architecture) bölümüne bakın.
</Info>

Bunu, OpenClaw embeddings, görüntü üretimi, video üretimi veya gelecekteki
tedarikçi destekli bir özellik alanı gibi yeni bir paylaşılan alana ihtiyaç duyduğunda kullanın.

Kural:

- **Plugin** = sahiplik sınırı
- **yetenek** = paylaşılan çekirdek sözleşmesi

Bir tedarikçiyi doğrudan bir kanala veya araca bağlayarak başlamayın. Yeteneği tanımlayarak başlayın.

## Ne zaman yetenek oluşturulmalı

Aşağıdakilerin **tümü** doğru olduğunda yeni bir yetenek oluşturun:

1. Birden fazla tedarikçi bunu makul şekilde uygulayabilir.
2. Kanallar, araçlar veya özellik Pluginleri tedarikçiyi önemsemeden bunu tüketebilmelidir.
3. Çekirdeğin fallback, ilke, yapılandırma veya teslim davranışını sahiplenmesi gerekir.

İş yalnızca tedarikçiye özgüyse ve henüz paylaşılan bir sözleşme yoksa durun ve önce sözleşmeyi tanımlayın.

## Standart sıra

1. Tipli çekirdek sözleşmesini tanımlayın.
2. Bu sözleşme için Plugin kaydı ekleyin.
3. Paylaşılan bir çalışma zamanı yardımcısı ekleyin.
4. Kanıt olarak bir gerçek tedarikçi Pluginini bağlayın.
5. Özellik/kanal tüketicilerini çalışma zamanı yardımcısına taşıyın.
6. Sözleşme testleri ekleyin.
7. Operatöre yönelik yapılandırmayı ve sahiplik modelini belgeleyin.

## Ne nereye gider

**Çekirdek:**

- İstek/yanıt türleri.
- Sağlayıcı kaydı + çözümleme.
- Fallback davranışı.
- İç içe nesne, joker karakter, dizi öğesi ve bileşim düğümlerinde yayılan `title` / `description` dokümantasyon meta verileriyle yapılandırma şeması.
- Çalışma zamanı yardımcısı yüzeyi.

**Tedarikçi Plugini:**

- Tedarikçi API çağrıları.
- Tedarikçi kimlik doğrulama yönetimi.
- Tedarikçiye özgü istek normalleştirme.
- Yetenek uygulamasının kaydı.

**Özellik/kanal Plugini:**

- `api.runtime.*` veya eşleşen `plugin-sdk/*-runtime` yardımcısını çağırır.
- Bir tedarikçi uygulamasını asla doğrudan çağırmaz.

## Sağlayıcı ve harness bağlantı noktaları

Davranış genel ajan döngüsünden ziyade model sağlayıcısı sözleşmesine ait olduğunda **sağlayıcı hooklarını** kullanın. Örnekler arasında taşıma seçimi sonrası sağlayıcıya özgü istek parametreleri, kimlik doğrulama profili tercihi, prompt katmanları ve model/profil failover sonrası takip fallback yönlendirmesi bulunur.

Davranış bir turu yürüten çalışma zamanına ait olduğunda **ajan harness hooklarını** kullanın. Harnessler, dış model fallback ilkesinin yeniden deneme kararını verebilmesi için boş çıktı, görünür çıktı olmadan reasoning veya final yanıt olmadan yapılandırılmış plan gibi açık protokol sonuçlarını sınıflandırabilir.

Her iki bağlantı noktasını da dar tutun:

- Çekirdek yeniden deneme/fallback ilkesini sahiplenir.
- Sağlayıcı Pluginleri sağlayıcıya özgü istek/kimlik doğrulama/yönlendirme ipuçlarını sahiplenir.
- Harness Pluginleri çalışma zamanına özgü deneme sınıflandırmasını sahiplenir.
- Üçüncü taraf Pluginler çekirdek durumunu doğrudan değiştirmez, ipuçları döndürür.

## Dosya kontrol listesi

Yeni bir yetenek için şu alanlara dokunmayı bekleyin:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- Bir veya daha fazla paketlenmiş Plugin paketi.
- Yapılandırma, dokümanlar, testler.

## Çalışılmış örnek: görüntü üretimi

Görüntü üretimi standart biçimi izler:

1. Çekirdek `ImageGenerationProvider` tanımlar.
2. Çekirdek `registerImageGenerationProvider(...)` dışa açar.
3. Çekirdek `runtime.imageGeneration.generate(...)` dışa açar.
4. `openai`, `google`, `fal` ve `minimax` Pluginleri tedarikçi destekli uygulamaları kaydeder.
5. Gelecekteki tedarikçiler kanalları/araçları değiştirmeden aynı sözleşmeyi kaydeder.

Yapılandırma anahtarı, vision-analysis yönlendirmesinden kasıtlı olarak ayrıdır:

- `agents.defaults.imageModel` görüntüleri analiz eder.
- `agents.defaults.imageGenerationModel` görüntüler üretir.

Fallback ve ilke açık kalması için bunları ayrı tutun.

## Embedding sağlayıcıları

Yeniden kullanılabilir vektör embedding sağlayıcıları için `embeddingProviders` kullanın. Bu sözleşme
bilerek bellekten daha geniştir: araçlar, arama, retrieval, içe aktarıcılar veya
gelecekteki özellik Pluginleri bellek motoruna bağlı olmadan embeddingleri tüketebilir.

Bellek araması genel `embeddingProviders` tüketebilir. Eski
`memoryEmbeddingProviders` sözleşmesi, mevcut belleğe özgü sağlayıcılar geçiş yaparken
kullanımdan kaldırılmış uyumluluktur; yeni yeniden kullanılabilir embedding sağlayıcıları
`embeddingProviders` kullanmalıdır.

## İnceleme kontrol listesi

Yeni bir yetenek yayınlamadan önce şunları doğrulayın:

- Hiçbir kanal/araç tedarikçi kodunu doğrudan içe aktarmıyor.
- Çalışma zamanı yardımcısı paylaşılan yoldur.
- En az bir sözleşme testi paketlenmiş sahipliği doğrular.
- Yapılandırma dokümanları yeni model/yapılandırma anahtarını adlandırır.
- Plugin dokümanları sahiplik sınırını açıklar.

Bir PR yetenek katmanını atlayıp tedarikçi davranışını bir kanala/araca sabit kodluyorsa, geri gönderin ve önce sözleşmeyi tanımlayın.

## İlgili

- [Plugin iç yapıları](/tr/plugins/architecture) — yetenek modeli, sahiplik, yükleme hattı, çalışma zamanı yardımcıları.
- [Plugin oluşturma](/tr/plugins/building-plugins) — ilk Plugin öğreticisi.
- [SDK genel bakışı](/tr/plugins/sdk-overview) — içe aktarma haritası ve kayıt API başvurusu.
- [Skills oluşturma](/tr/tools/creating-skills) — eşlik eden katkıda bulunan yüzeyi.
