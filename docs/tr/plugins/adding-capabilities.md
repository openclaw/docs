---
read_when:
    - Yeni bir çekirdek yeteneği ve Plugin kayıt yüzeyi ekleme
    - Kodun çekirdeğe, bir sağlayıcı Plugin'ine veya bir özellik Plugin'ine ait olup olmadığına karar verme
    - Kanallar veya araçlar için yeni bir çalışma zamanı yardımcısını bağlama
sidebarTitle: Adding capabilities
summary: OpenClaw plugin sistemine yeni bir paylaşılan yetenek eklemeye yönelik katkıda bulunanlar kılavuzu
title: Yetenek ekleme (katkıda bulunanlar için kılavuz)
x-i18n:
    generated_at: "2026-07-12T11:57:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3534b7521ab8183d91399cded8a3b397be46bf9bd18f2fdb88a8947bad67ffaa
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Bu, OpenClaw çekirdek geliştiricileri için bir **katkıda bulunanlar kılavuzudur**. Harici
  bir plugin geliştiriyorsanız bunun yerine [Plugin geliştirme](/tr/plugins/building-plugins)
  bölümüne bakın. Ayrıntılı mimari başvurusu (yetenek modeli, sahiplik,
  yükleme işlem hattı, çalışma zamanı yardımcıları) için [Plugin iç yapısı](/tr/plugins/architecture)
  bölümüne bakın.
</Info>

OpenClaw; gömmeler, görüntü oluşturma, video oluşturma veya gelecekte
tedarikçi destekli başka bir özellik alanı gibi yeni bir paylaşılan etki alanına ihtiyaç duyduğunda bunu kullanın.

Kural:

- **plugin** = sahiplik sınırı
- **yetenek** = paylaşılan çekirdek sözleşmesi

Bir tedarikçiyi doğrudan bir kanala veya araca bağlamayın. Önce yeteneği tanımlayın.

## Ne zaman yetenek oluşturulmalı?

Yalnızca aşağıdakilerin **tümü** doğru olduğunda yeni bir yetenek oluşturun:

1. Birden fazla tedarikçinin bunu uygulayabilmesi makul olmalıdır.
2. Kanallar, araçlar veya özellik pluginleri, tedarikçiyi önemsemeden bunu tüketebilmelidir.
3. Çekirdeğin geri dönüş, politika, yapılandırma veya teslim davranışının sahipliğini üstlenmesi gerekir.

Çalışma yalnızca tedarikçiye özgüyse ve henüz paylaşılan bir sözleşme yoksa önce sözleşmeyi tanımlayın.

## Standart sıra

1. Türü belirlenmiş çekirdek sözleşmesini tanımlayın.
2. Bu sözleşme için plugin kaydını ekleyin.
3. Paylaşılan bir çalışma zamanı yardımcısı ekleyin.
4. Kanıt olarak gerçek bir tedarikçi plugini bağlayın.
5. Özellik/kanal tüketicilerini çalışma zamanı yardımcısına taşıyın.
6. Sözleşme testleri ekleyin.
7. Operatöre yönelik yapılandırmayı ve sahiplik modelini belgelendirin.

## Ne nereye yerleştirilir?

| Katman                     | Sorumluluk                                                                                                                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Çekirdek**               | İstek/yanıt türleri; sağlayıcı kayıt defteri ve çözümleme; geri dönüş davranışı; iç içe nesne, joker karakter, dizi öğesi ve bileşim düğümlerinde yayılan `title`/`description` dokümantasyon meta verilerine sahip yapılandırma şeması; çalışma zamanı yardımcısı yüzeyi. |
| **Tedarikçi plugini**      | Tedarikçi API çağrıları, tedarikçi kimlik doğrulama işlemleri, tedarikçiye özgü istek normalleştirmesi ve yetenek uygulamasının kaydı.                                                                                                    |
| **Özellik/kanal plugini**  | `api.runtime.*` veya eşleşen `plugin-sdk/*-runtime` yardımcısını çağırır. Bir tedarikçi uygulamasını hiçbir zaman doğrudan çağırmaz.                                                                                                     |

## Sağlayıcı ve yürütme düzeneği bağlantı noktaları

Davranış genel ajan döngüsü yerine model sağlayıcısı sözleşmesine ait olduğunda **sağlayıcı kancalarını** kullanın. Aktarım seçiminden sonraki sağlayıcıya özgü istek parametreleri, kimlik doğrulama profili tercihi, istem katmanları ve model/profil yük devretmesinden sonraki izleme geri dönüşü yönlendirmesi buna örnektir.

Davranış, bir turu yürüten çalışma zamanına ait olduğunda **ajan yürütme düzeneği kancalarını** kullanın. Yürütme düzenekleri; görünür çıktı olmadan boş çıktı, görünür çıktı olmadan akıl yürütme veya nihai yanıt içermeyen yapılandırılmış plan gibi açık protokol sonuçlarını sınıflandırabilir; böylece dış model geri dönüş politikası yeniden deneme kararını verebilir.

Her iki bağlantı noktasını da dar kapsamlı tutun:

- Yeniden deneme/geri dönüş politikasının sahipliği çekirdeğe aittir.
- Sağlayıcı pluginleri, sağlayıcıya özgü istek/kimlik doğrulama/yönlendirme ipuçlarının sahipliğini üstlenir.
- Yürütme düzeneği pluginleri, çalışma zamanına özgü deneme sınıflandırmasının sahipliğini üstlenir.
- Üçüncü taraf pluginleri çekirdek durumunu doğrudan değiştirmek yerine ipuçları döndürür.

## Dosya denetim listesi

Yeni bir yetenek için şu alanlara dokunmanız beklenir:

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
- Bir veya daha fazla paketlenmiş plugin paketi.
- Yapılandırma, dokümantasyon ve testler.

## Uygulamalı örnek: görüntü oluşturma

Görüntü oluşturma standart yapıyı izler:

1. Çekirdek `ImageGenerationProvider` öğesini tanımlar.
2. Çekirdek `registerImageGenerationProvider(...)` öğesini sunar.
3. Çekirdek `api.runtime.imageGeneration.generate(...)` ve `.listProviders(...)` öğelerini sunar.
4. Tedarikçi pluginleri (`comfy`, `deepinfra`, `fal`, `google`, `litellm`, `microsoft-foundry`, `minimax`, `openai`, `openrouter`, `vydra`, `xai`) tedarikçi destekli uygulamaları kaydeder.
5. Gelecekteki tedarikçiler, kanalları/araçları değiştirmeden aynı sözleşmeyi kaydeder.

Yapılandırma anahtarı, görsel analiz yönlendirmesinden kasıtlı olarak ayrıdır:

- `agents.defaults.imageModel` görüntüleri analiz eder.
- `agents.defaults.imageGenerationModel` görüntüler oluşturur.

Geri dönüş ve politikanın açık kalması için bunları ayrı tutun.

## Gömme sağlayıcıları

Yeniden kullanılabilir vektör gömme sağlayıcıları için `registerEmbeddingProvider(...)` /
`embeddingProviders` sözleşmesini kullanın. Bu sözleşme kasıtlı olarak bellekten
daha geniş kapsamlıdır: araçlar, arama, getirme, içe aktarıcılar veya gelecekteki özellik pluginleri,
bellek motoruna bağımlı olmadan gömmeleri tüketebilir. Bellek araması
da genel `embeddingProviders` sağlayıcılarını tüketir.

Eski belleğe özgü kayıt API'si ve `memoryEmbeddingProviders`
sözleşmesi kullanımdan kaldırılmıştır. Tüm yeni gömme sağlayıcıları için
`registerEmbeddingProvider` ve `embeddingProviders` kullanın.

## İnceleme denetim listesi

Yeni bir yeteneği yayımlamadan önce şunları doğrulayın:

- Hiçbir kanal/araç tedarikçi kodunu doğrudan içe aktarmıyor.
- Paylaşılan yol, çalışma zamanı yardımcısıdır.
- En az bir sözleşme testi paketlenmiş sahipliği doğruluyor.
- Yapılandırma dokümantasyonu yeni model/yapılandırma anahtarını belirtiyor.
- Plugin dokümantasyonu sahiplik sınırını açıklıyor.

Bir PR yetenek katmanını atlayıp tedarikçi davranışını bir kanala/araca sabit kodluyorsa geri gönderin ve önce sözleşmeyi tanımlayın.

## İlgili

- [Plugin iç yapısı](/tr/plugins/architecture) — yetenek modeli, sahiplik, yükleme işlem hattı, çalışma zamanı yardımcıları.
- [Plugin geliştirme](/tr/plugins/building-plugins) — ilk plugin öğreticisi.
- [SDK'ye genel bakış](/tr/plugins/sdk-overview) — içe aktarma eşlemesi ve kayıt API'si başvurusu.
- [Skills oluşturma](/tr/tools/creating-skills) — tamamlayıcı katkıda bulunan yüzeyi.
