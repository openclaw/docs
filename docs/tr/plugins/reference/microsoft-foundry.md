---
read_when:
    - microsoft-foundry Plugin'ini kuruyor, yapılandırıyor veya denetliyorsunuz
summary: OpenClaw'a Microsoft Foundry model sağlayıcısı desteği ekler.
title: Microsoft Foundry Plugin'i
x-i18n:
    generated_at: "2026-07-12T12:02:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft Foundry Plugin'i

OpenClaw'a Microsoft Foundry model sağlayıcısı desteği ekler.

## Dağıtım

- Paket: `@openclaw/microsoft-foundry`
- Kurulum yolu: OpenClaw'a dahildir

## Yüzey

sağlayıcılar: microsoft-foundry; sözleşmeler: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Görüntü oluşturma sağlayıcısı: `microsoft-foundry`

## Gereksinimler

- Dağıtımları bulunan bir Microsoft Foundry veya Azure AI Foundry kaynağı.
- `AZURE_OPENAI_API_KEY` ya da yapılandırılmış bir sağlayıcı API anahtarı üzerinden API anahtarıyla kimlik doğrulama.
- Entra ID kimlik doğrulaması için Azure CLI'yi yükleyin ve ilk katılımdan önce
  `az login` komutunu çalıştırın. OpenClaw, Microsoft Foundry çalışma zamanı
  tokenlarını `az account get-access-token` aracılığıyla yeniler.

## Sohbet modelleri

Microsoft Foundry sohbet dağıtımları, `microsoft-foundry/<deployment-name>`
sağlayıcı model başvurusunu kullanır. İlk katılım, Azure CLI ile Foundry
kaynaklarını ve dağıtımlarını keşfeder, ardından seçilen dağıtım adını model
yapılandırmasına yazar.

OpenClaw, desteklenen OpenAI uyumlu sohbet API'leri için Foundry `/openai/v1`
uç noktasını kullanır:

- GPT, `o*`, `computer-use-preview` ve DeepSeek-V4 model aileleri varsayılan
  olarak `openai-responses` kullanır.
- MAI-DS-R1 ve diğer sohbet tamamlama dağıtımları, açıkça desteklenen bir API
  yapılandırılmadığı sürece `openai-completions` kullanır.
- MAI-DS-R1, `reasoning_effort` aracılığıyla değil, akıl yürütme içeriği
  aracılığıyla akıl yürütme yeteneğine sahip olarak kaydedilir. Bağlam ve çıktı
  tokenı meta verileri 163.840 tokendir.

Microsoft Foundry'deki Anthropic Claude dağıtımları, OpenAI uyumlu
`/openai/v1` biçimini değil, Anthropic Messages API biçimini kullanır.
Microsoft Foundry Plugin'i yerel bir Anthropic çalışma zamanı kazanana kadar
bunları özel bir `anthropic-messages` sağlayıcısı olarak yapılandırın. Foundry
dağıtım adı Claude model kimliğinden farklı olduğunda, OpenClaw'ın modele özgü
iletişim sözleşmelerini uygulayabilmesi, `/think off` komutunu doğru şekilde
eşleyebilmesi ve imzalı düşünme verilerini güvenli biçimde koruyabilmesi için
model girdisinde `params.canonicalModelId` değerini ayarlayın.

## MAI görüntü oluşturma

Plugin, güncel Microsoft AI görüntü modelleriyle `image_generate` için
`microsoft-foundry` sağlayıcısını kaydeder:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Model başvurusu olarak dağıtılmış bir MAI görüntü dağıtımının adını kullanın.
MAI API'si, istek içindeki `model` alanında dağıtım adınızı gerektirdiğinden
sağlayıcı varsayılan bir görüntü modeli bildirmez:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

Yalnızca istem içeren oluşturma işlemleri, Microsoft Foundry'nin MAI oluşturma
uç noktasını çağırır: `/mai/v1/images/generations`. Referans görüntüsü
düzenlemeleri `/mai/v1/images/edits` uç noktasını çağırır ve
`MAI-Image-2.5-Flash` ile `MAI-Image-2.5` dağıtımlarıyla sınırlıdır.

Yalnızca istem içeren oluşturma işlemleri, yalnızca Foundry uç noktası
yapılandırılmışken özel bir dağıtım adı kullanabilir. Özel bir dağıtım adıyla
görüntü düzenlemek için dağıtımı ilk katılım üzerinden seçin veya OpenClaw'ın
dağıtımın `MAI-Image-2.5-Flash` ya da `MAI-Image-2.5` tarafından desteklendiğini
doğrulayabilmesi için model meta verilerini ekleyin.

MAI görüntü kısıtlamaları:

- Çıktı: istek başına bir PNG görüntüsü.
- Boyut: varsayılan `1024x1024`; genişlik ve yükseklik en az 768 piksel olmalıdır.
- Toplam piksel: genişlik × yükseklik en fazla 1.048.576 olmalıdır.
- Düzenlemeler: bir PNG veya JPEG girdi görüntüsü.
- `aspectRatio`, `resolution`, `quality`, `background` ve PNG dışındaki
  `outputFormat` gibi desteklenmeyen ortak ipuçları Microsoft Foundry'ye
  gönderilmez.

## Sorun giderme

- `az: command not found`: Azure CLI'yi yükleyin veya API anahtarıyla kimlik doğrulamayı kullanın.
- `Microsoft Foundry endpoint missing for MAI image generation`: ilk katılım
  üzerinden bir Foundry dağıtımı seçin veya `models.providers.microsoft-foundry.baseUrl` ekleyin.
- `supports MAI image deployments only`: seçilen görüntü modeli MAI dışı bir
  dağıtımı gösteriyor. `image_generate` için dağıtılmış bir MAI görüntü modeli
  kullanın.

<!-- openclaw-plugin-reference:manual-end -->
