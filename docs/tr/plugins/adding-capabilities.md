---
read_when:
    - Yeni bir çekirdek yeteneği ve Plugin kayıt yüzeyi ekleme
    - Kodun çekirdeğe, bir sağlayıcı Plugin'e veya bir özellik Plugin'ine ait olup olmadığına karar verme
    - Kanallar veya araçlar için yeni bir çalışma zamanı yardımcısını bağlama
sidebarTitle: Adding capabilities
summary: OpenClaw Plugin sistemine yeni bir paylaşılan yetenek eklemek için katkıda bulunanlar kılavuzu
title: Yetenekler ekleme (katkıda bulunan rehberi)
x-i18n:
    generated_at: "2026-05-06T09:23:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e289c95d9dc5924b5cc7b67428386660b83052b6cf6f14fc4f838fc88b7a25c
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Bu, OpenClaw çekirdek geliştiricileri için bir **katkıda bulunan kılavuzudur**. Harici bir Plugin
  geliştiriyorsanız bunun yerine [Plugin oluşturma](/tr/plugins/building-plugins)
  bölümüne bakın. Derin mimari başvurusu (yetenek modeli, sahiplik,
  yükleme hattı, çalışma zamanı yardımcıları) için [Plugin iç yapısı](/tr/plugins/architecture) bölümüne bakın.
</Info>

Bunu, OpenClaw görüntü üretimi, video üretimi veya gelecekte tedarikçi destekli başka bir özellik alanı gibi yeni bir paylaşılan etki alanına ihtiyaç duyduğunda kullanın.

Kural:

- **plugin** = sahiplik sınırı
- **capability** = paylaşılan çekirdek sözleşme

Bir tedarikçiyi doğrudan bir kanala veya araca bağlayarak başlamayın. Yetenek tanımlayarak başlayın.

## Ne zaman yetenek oluşturulmalı

Aşağıdakilerin **tümü** doğru olduğunda yeni bir yetenek oluşturun:

1. Birden fazla tedarikçi bunu makul biçimde uygulayabilir.
2. Kanallar, araçlar veya özellik Plugin'leri tedarikçiyi önemsemeden bunu tüketebilmelidir.
3. Çekirdeğin geri dönüş, ilke, yapılandırma veya teslim davranışını sahiplenmesi gerekir.

İş yalnızca tedarikçiye özgüyse ve henüz paylaşılan bir sözleşme yoksa, durun ve önce sözleşmeyi tanımlayın.

## Standart sıra

1. Tiplendirilmiş çekirdek sözleşmeyi tanımlayın.
2. Bu sözleşme için Plugin kaydı ekleyin.
3. Paylaşılan bir çalışma zamanı yardımcısı ekleyin.
4. Kanıt olarak bir gerçek tedarikçi Plugin'i bağlayın.
5. Özellik/kanal tüketicilerini çalışma zamanı yardımcısına taşıyın.
6. Sözleşme testleri ekleyin.
7. Operatöre dönük yapılandırmayı ve sahiplik modelini belgeleyin.

## Ne nereye gider

**Çekirdek:**

- İstek/yanıt tipleri.
- Sağlayıcı kayıt defteri + çözümleme.
- Geri dönüş davranışı.
- İç içe nesne, joker karakter, dizi öğesi ve bileşim düğümlerinde yayılan `title` / `description` belge meta verileriyle yapılandırma şeması.
- Çalışma zamanı yardımcısı yüzeyi.

**Tedarikçi Plugin'i:**

- Tedarikçi API çağrıları.
- Tedarikçi kimlik doğrulama işlemleri.
- Tedarikçiye özgü istek normalleştirmesi.
- Yetenek uygulamasının kaydı.

**Özellik/kanal Plugin'i:**

- `api.runtime.*` veya eşleşen `plugin-sdk/*-runtime` yardımcısını çağırır.
- Bir tedarikçi uygulamasını asla doğrudan çağırmaz.

## Sağlayıcı ve harness sınırları

Davranış genel ajan döngüsü yerine model sağlayıcı sözleşmesine ait olduğunda **sağlayıcı hook'ları** kullanın. Örnekler arasında taşıma seçimi sonrası sağlayıcıya özgü istek parametreleri, auth-profile tercihi, istem katmanları ve model/profil failover sonrası takip geri dönüş yönlendirmesi bulunur.

Davranış bir turu yürüten çalışma zamanına ait olduğunda **ajan harness hook'ları** kullanın. Harness'ler boş, yalnızca akıl yürütme içeren veya yalnızca planlama içeren yanıtlar gibi başarılı ama kullanılamaz deneme sonuçlarını sınıflandırabilir; böylece dış model geri dönüş ilkesi yeniden deneme kararını verebilir.

Her iki sınırı da dar tutun:

- Çekirdek yeniden deneme/geri dönüş ilkesini sahiplenir.
- Sağlayıcı Plugin'leri sağlayıcıya özgü istek/kimlik doğrulama/yönlendirme ipuçlarını sahiplenir.
- Harness Plugin'leri çalışma zamanına özgü deneme sınıflandırmasını sahiplenir.
- Üçüncü taraf Plugin'ler çekirdek durumunda doğrudan değişiklikler değil, ipuçları döndürür.

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
- Yapılandırma, belgeler, testler.

## Çalışılmış örnek: görüntü üretimi

Görüntü üretimi standart şekli izler:

1. Çekirdek `ImageGenerationProvider` tanımlar.
2. Çekirdek `registerImageGenerationProvider(...)` sunar.
3. Çekirdek `runtime.imageGeneration.generate(...)` sunar.
4. `openai`, `google`, `fal` ve `minimax` Plugin'leri tedarikçi destekli uygulamalar kaydeder.
5. Gelecekteki tedarikçiler kanalları/araçları değiştirmeden aynı sözleşmeyi kaydeder.

Yapılandırma anahtarı, görsel analiz yönlendirmesinden bilinçli olarak ayrıdır:

- `agents.defaults.imageModel` görüntüleri analiz eder.
- `agents.defaults.imageGenerationModel` görüntüler üretir.

Bunları ayrı tutun ki geri dönüş ve ilke açık kalsın.

## İnceleme kontrol listesi

Yeni bir yeteneği yayımlamadan önce şunları doğrulayın:

- Hiçbir kanal/araç tedarikçi kodunu doğrudan içe aktarmıyor.
- Çalışma zamanı yardımcısı paylaşılan yoldur.
- En az bir sözleşme testi paketlenmiş sahipliği doğrular.
- Yapılandırma belgeleri yeni model/yapılandırma anahtarını adlandırır.
- Plugin belgeleri sahiplik sınırını açıklar.

Bir PR yetenek katmanını atlayıp tedarikçi davranışını bir kanala/araca sabit kodlarsa, geri gönderin ve önce sözleşmeyi tanımlayın.

## İlgili

- [Plugin iç yapısı](/tr/plugins/architecture) — yetenek modeli, sahiplik, yükleme hattı, çalışma zamanı yardımcıları.
- [Plugin oluşturma](/tr/plugins/building-plugins) — ilk Plugin öğreticisi.
- [SDK genel bakışı](/tr/plugins/sdk-overview) — içe aktarma eşlemi ve kayıt API başvurusu.
- [Skills oluşturma](/tr/tools/creating-skills) — eşlik eden katkıda bulunan yüzeyi.
