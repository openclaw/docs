---
read_when:
    - Yeni bir çekirdek yetenek ve Plugin kayıt yüzeyi ekleme
    - Kodun çekirdeğe mi, satıcı Plugin'ine mi yoksa özellik Plugin'ine mi ait olduğuna karar verme
    - Kanallar veya araçlar için yeni bir çalışma zamanı yardımcısını bağlama
sidebarTitle: Adding Capabilities
summary: OpenClaw Plugin sistemine yeni bir paylaşılan yetenek eklemek için katkıcı rehberi
title: Yetenek ekleme (katkıcı rehberi)
x-i18n:
    generated_at: "2026-04-24T09:33:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 864506dd3f61aa64e7c997c9d9e05ce0ad70c80a26a734d4f83b2e80331be4ab
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Bu, OpenClaw çekirdek geliştiricileri için bir **katkıcı rehberidir**. Harici bir Plugin oluşturuyorsanız bunun yerine [Building Plugins](/tr/plugins/building-plugins) sayfasına bakın.
</Info>

OpenClaw'ın görsel üretimi, video
üretimi veya gelecekte satıcı destekli başka bir özellik alanı gibi yeni bir etki alanına ihtiyaç duyduğunda bunu kullanın.

Kural:

- plugin = sahiplik sınırı
- capability = paylaşılan çekirdek sözleşmesi

Bu, işe bir satıcıyı doğrudan bir kanala veya bir
araca bağlayarak başlamamanız gerektiği anlamına gelir. Önce yeteneği tanımlayarak başlayın.

## Ne zaman bir yetenek oluşturulmalı

Şu koşulların tümü doğruysa yeni bir yetenek oluşturun:

1. birden fazla satıcı bunu makul biçimde uygulayabilir
2. kanalların, araçların veya özellik Plugin'lerinin satıcıyı
   umursamadan bunu tüketmesi gerekir
3. geri düşme, ilke, yapılandırma veya teslim davranışının sahibi çekirdek olmalıdır

Çalışma yalnızca satıcıya özgüyse ve henüz paylaşılan bir sözleşme yoksa durun ve önce sözleşmeyi tanımlayın.

## Standart sıra

1. Tiplenmiş çekirdek sözleşmeyi tanımlayın.
2. Bu sözleşme için Plugin kaydı ekleyin.
3. Ortak bir çalışma zamanı yardımcısı ekleyin.
4. Kanıt olarak gerçek bir satıcı Plugin'i bağlayın.
5. Özellik/kanal tüketicilerini çalışma zamanı yardımcısına taşıyın.
6. Sözleşme testleri ekleyin.
7. Operatöre dönük yapılandırmayı ve sahiplik modelini belgeleyin.

## Ne nereye ait

Çekirdek:

- istek/yanıt türleri
- sağlayıcı kayıt defteri + çözümleme
- geri düşme davranışı
- iç içe nesne, joker, dizi öğesi ve birleşim düğümlerinde yayılan `title` / `description` belge meta verileri ile birlikte yapılandırma şeması
- çalışma zamanı yardımcı yüzeyi

Satıcı Plugin'i:

- satıcı API çağrıları
- satıcı auth işleme
- satıcıya özgü istek normalizasyonu
- yetenek uygulamasının kaydı

Özellik/kanal Plugin'i:

- `api.runtime.*` veya eşleşen `plugin-sdk/*-runtime` yardımcısını çağırır
- asla doğrudan bir satıcı uygulamasını çağırmaz

## Sağlayıcı ve Harness Sınırları

Davranış genel ajan döngüsünden ziyade model sağlayıcı sözleşmesine aitse sağlayıcı hook'larını kullanın. Örnekler arasında taşıma seçimi sonrası sağlayıcıya özgü istek parametreleri, auth-profile tercihi, istem katmanları ve model/profil devretmesinden sonra takip geri düşme yönlendirmesi bulunur.

Davranış bir turu yürüten çalışma zamanına aitse agent harness hook'larını kullanın. Harness'ler, boş, yalnızca akıl yürütme içeren veya yalnızca plan içeren yanıtlar gibi başarılı ama kullanılamaz deneme sonuçlarını sınıflandırabilir; böylece dış model geri düşme ilkesi yeniden deneme kararını verebilir.

Her iki sınırı da dar tutun:

- yeniden deneme/geri düşme ilkesinin sahibi çekirdektir
- sağlayıcı Plugin'leri sağlayıcıya özgü istek/auth/yönlendirme ipuçlarının sahibidir
- harness Plugin'leri çalışma zamanına özgü deneme sınıflandırmasının sahibidir
- üçüncü taraf Plugin'leri çekirdek durumu doğrudan değiştirmek yerine ipuçları döndürür

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
- bir veya daha fazla paketlenmiş Plugin paketi
- yapılandırma/belgeler/testler

## Örnek: görsel üretimi

Görsel üretimi standart biçimi izler:

1. çekirdek `ImageGenerationProvider` tanımlar
2. çekirdek `registerImageGenerationProvider(...)` açığa çıkarır
3. çekirdek `runtime.imageGeneration.generate(...)` açığa çıkarır
4. `openai`, `google`, `fal` ve `minimax` Plugin'leri satıcı destekli uygulamaları kaydeder
5. gelecekteki satıcılar kanalları/araçları değiştirmeden aynı sözleşmeyi kaydedebilir

Yapılandırma anahtarı, vision-analysis yönlendirmesinden ayrıdır:

- `agents.defaults.imageModel` = görselleri analiz et
- `agents.defaults.imageGenerationModel` = görsel üret

Geri düşme ve ilke açık kalsın diye bunları ayrı tutun.

## Gözden geçirme kontrol listesi

Yeni bir yeteneği yayımlamadan önce şunları doğrulayın:

- hiçbir kanal/araç satıcı kodunu doğrudan içe aktarmıyor
- çalışma zamanı yardımcısı ortak yol
- en az bir sözleşme testi paketlenmiş sahipliği doğruluyor
- yapılandırma belgeleri yeni model/yapılandırma anahtarını adlandırıyor
- Plugin belgeleri sahiplik sınırını açıklıyor

Bir PR yetenek katmanını atlıyor ve satıcı davranışını bir
kanal/araca sert kodluyorsa, geri gönderin ve önce sözleşmeyi tanımlayın.

## İlgili

- [Plugin](/tr/tools/plugin)
- [Skills oluşturma](/tr/tools/creating-skills)
- [Araçlar ve Plugin'ler](/tr/tools)
