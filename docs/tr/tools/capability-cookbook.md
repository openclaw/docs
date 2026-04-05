---
read_when:
    - Yeni bir çekirdek yeteneği ve eklenti kayıt yüzeyini ekleme
    - Kodun çekirdekte mi, bir üretici eklentisinde mi yoksa bir özellik eklentisinde mi olması gerektiğine karar verme
    - Kanallar veya araçlar için yeni bir çalışma zamanı yardımcısını bağlama
sidebarTitle: Adding Capabilities
summary: OpenClaw eklenti sistemine yeni bir paylaşılan yetenek eklemek için katkıda bulunan kılavuzu
title: Yetenek Ekleme (Katkıda Bulunan Kılavuzu)
x-i18n:
    generated_at: "2026-04-05T14:10:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29604d88e6df5205b835d71f3078b6223c58b6294135c3e201756c1bcac33ea3
    source_path: tools/capability-cookbook.md
    workflow: 15
---

# Yetenek Ekleme

<Info>
  Bu, OpenClaw çekirdek geliştiricileri için bir **katkıda bulunan kılavuzudur**. Harici bir eklenti
  geliştiriyorsanız bunun yerine [Building Plugins](/tr/plugins/building-plugins)
  bölümüne bakın.
</Info>

Bunu, OpenClaw'ın görsel üretimi, video
üretimi veya gelecekte üretici destekli başka bir özellik alanı gibi yeni bir etki alanına ihtiyaç duyduğunda kullanın.

Kural şudur:

- eklenti = sahiplik sınırı
- yetenek = paylaşılan çekirdek sözleşmesi

Bu, bir üreticiyi doğrudan bir kanala veya
araca bağlayarak başlamamanız gerektiği anlamına gelir. Yeteneği tanımlayarak başlayın.

## Ne zaman bir yetenek oluşturulmalı

Aşağıdakilerin tümü doğruysa yeni bir yetenek oluşturun:

1. birden fazla üretici bunu makul şekilde uygulayabilir
2. kanallar, araçlar veya özellik eklentileri, üreticiyi
   önemsemeden bunu kullanabilmelidir
3. geri dönüş, ilke, yapılandırma veya teslim davranışının sahipliği çekirdekte olmalıdır

Çalışma yalnızca üreticiye özgüyse ve henüz paylaşılan bir sözleşme yoksa, durun ve
önce sözleşmeyi tanımlayın.

## Standart sıra

1. Türlendirilmiş çekirdek sözleşmesini tanımlayın.
2. Bu sözleşme için eklenti kaydını ekleyin.
3. Paylaşılan bir çalışma zamanı yardımcısı ekleyin.
4. Kanıt olarak gerçek bir üretici eklentisi bağlayın.
5. Özellik/kanal tüketicilerini çalışma zamanı yardımcısına taşıyın.
6. Sözleşme testleri ekleyin.
7. Operatöre dönük yapılandırmayı ve sahiplik modelini belgelendirin.

## Ne nereye gider

Çekirdek:

- istek/yanıt türleri
- sağlayıcı kayıt defteri + çözümleme
- geri dönüş davranışı
- iç içe nesne, joker karakter, dizi öğesi ve bileşim düğümlerinde yayılan `title` / `description` belge meta verileriyle birlikte yapılandırma şeması
- çalışma zamanı yardımcı yüzeyi

Üretici eklentisi:

- üretici API çağrıları
- üretici kimlik doğrulama işleme
- üreticiye özgü istek normalleştirme
- yetenek uygulamasının kaydı

Özellik/kanal eklentisi:

- `api.runtime.*` veya eşleşen `plugin-sdk/*-runtime` yardımcısını çağırır
- hiçbir zaman doğrudan bir üretici uygulamasını çağırmaz

## Dosya kontrol listesi

Yeni bir yetenek için bu alanlara dokunmayı bekleyin:

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
- bir veya daha fazla paketlenmiş eklenti paketi
- yapılandırma/belgeler/testler

## Örnek: görsel üretimi

Görsel üretimi standart şekli izler:

1. çekirdek `ImageGenerationProvider` tanımlar
2. çekirdek `registerImageGenerationProvider(...)` sunar
3. çekirdek `runtime.imageGeneration.generate(...)` sunar
4. `openai`, `google`, `fal` ve `minimax` eklentileri üretici destekli uygulamaları kaydeder
5. gelecekteki üreticiler kanalları/araçları değiştirmeden aynı sözleşmeyi kaydedebilir

Yapılandırma anahtarı, vision-analysis yönlendirmesinden ayrıdır:

- `agents.defaults.imageModel` = görselleri analiz et
- `agents.defaults.imageGenerationModel` = görsel oluştur

Geri dönüş ve ilkenin açık kalması için bunları ayrı tutun.

## İnceleme kontrol listesi

Yeni bir yeteneği yayımlamadan önce şunları doğrulayın:

- hiçbir kanal/aracın doğrudan üretici kodu içe aktarmadığını
- çalışma zamanı yardımcısının paylaşılan yol olduğunu
- en az bir sözleşme testinin paketlenmiş sahipliği doğruladığını
- yapılandırma belgelerinin yeni model/yapılandırma anahtarını adlandırdığını
- eklenti belgelerinin sahiplik sınırını açıkladığını

Bir PR yetenek katmanını atlıyor ve üretici davranışını bir
kanal/araca sabit kodluyorsa, geri gönderin ve önce sözleşmeyi tanımlayın.
