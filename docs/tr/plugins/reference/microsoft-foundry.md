---
read_when:
    - microsoft-foundry Plugin'ini kuruyor, yapılandırıyor veya denetliyorsunuz
summary: OpenClaw’a Microsoft Foundry model sağlayıcısı desteği ekler.
title: Microsoft Foundry Plugin
x-i18n:
    generated_at: "2026-06-28T01:01:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft Foundry Plugin

OpenClaw'a Microsoft Foundry model sağlayıcısı desteği ekler.

## Dağıtım

- Paket: `@openclaw/microsoft-foundry`
- Kurulum yolu: OpenClaw'a dahildir

## Yüzey

sağlayıcılar: microsoft-foundry; sözleşmeler: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Görüntü oluşturma sağlayıcısı: `microsoft-foundry`

## Gereksinimler

- Dağıtımları olan bir Microsoft Foundry veya Azure AI Foundry kaynağı.
- `AZURE_OPENAI_API_KEY` veya yapılandırılmış bir sağlayıcı API anahtarı üzerinden API anahtarı kimlik doğrulaması.
- Entra ID kimlik doğrulaması için Azure CLI'yi kurun ve
  katılımdan önce `az login` çalıştırın. OpenClaw, Microsoft Foundry çalışma zamanı belirteçlerini
  `az account get-access-token` üzerinden yeniler.

## Sohbet modelleri

Microsoft Foundry sohbet dağıtımları `microsoft-foundry/<deployment-name>`
sağlayıcı model başvurusunu kullanır. Katılım, Azure CLI ile Foundry kaynaklarını
ve dağıtımlarını keşfeder, ardından seçilen dağıtım adını model yapılandırmasına
yazar.

OpenClaw, desteklenen OpenAI uyumlu sohbet API'leri için Foundry `/openai/v1`
uç noktasını kullanır:

- GPT, `o*`, `computer-use-preview` ve DeepSeek-V4 model aileleri varsayılan olarak
  `openai-responses` kullanır.
- MAI-DS-R1 ve diğer sohbet tamamlama dağıtımları, açıkça desteklenen bir API
  yapılandırılmadığı sürece `openai-completions` kullanır.
- MAI-DS-R1, `reasoning_effort` üzerinden değil, akıl yürütme içeriği üzerinden
  akıl yürütme yetenekli olarak kaydedilir. Bağlam ve çıktı belirteci meta verileri
  163.840 belirteçtir.

Microsoft Foundry'deki Anthropic Claude dağıtımları, OpenAI uyumlu `/openai/v1`
biçimini değil Anthropic Messages API biçimini kullanır. Microsoft Foundry Plugin
yerel bir Anthropic çalışma zamanı kazanana kadar bunları özel bir
`anthropic-messages` sağlayıcısı olarak yapılandırın. Foundry dağıtım adı Claude
model kimliğinden farklı olduğunda, OpenClaw'ın modele özgü kablo sözleşmelerini
uygulayabilmesi, `/think off` eşlemesini doğru yapabilmesi ve imzalı düşünmeyi
güvenli şekilde koruyabilmesi için model girdisinde `params.canonicalModelId`
ayarlayın.

## MAI görüntü oluşturma

Plugin, mevcut Microsoft AI görüntü modelleriyle `image_generate` için
`microsoft-foundry` kaydeder:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Model başvurusu olarak dağıtılmış bir MAI görüntü dağıtım adı kullanın. Sağlayıcı
varsayılan bir görüntü modeli bildirmez çünkü MAI API, isteğin `model` alanında
dağıtım adınızı gerektirir:

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

Yalnızca istemle oluşturma çağrıları Microsoft Foundry'nin MAI oluşturma uç
noktasını çağırır: `/mai/v1/images/generations`. Referans görüntü düzenlemeleri
`/mai/v1/images/edits` çağırır ve `MAI-Image-2.5-Flash` ile `MAI-Image-2.5`
dağıtımlarıyla sınırlıdır.

Yalnızca istemle oluşturma, sadece Foundry uç noktası yapılandırılmışken özel bir
dağıtım adı kullanabilir. Özel dağıtım adıyla görüntü düzenlemeleri için dağıtımı
katılım üzerinden seçin veya OpenClaw'ın dağıtımın `MAI-Image-2.5-Flash` ya da
`MAI-Image-2.5` tarafından desteklendiğini doğrulayabilmesi için model meta
verilerini ekleyin.

MAI görüntü kısıtlamaları:

- Çıktı: istek başına bir PNG görüntüsü.
- Boyut: varsayılan `1024x1024`; hem genişlik hem yükseklik en az 768 px olmalıdır.
- Toplam piksel: genişlik × yükseklik en fazla 1.048.576 olmalıdır.
- Düzenlemeler: bir PNG veya JPEG giriş görüntüsü.
- `aspectRatio`, `resolution`, `quality`, `background` ve PNG olmayan
  `outputFormat` gibi desteklenmeyen ortak ipuçları Microsoft Foundry'ye gönderilmez.

## Sorun giderme

- `az: command not found`: Azure CLI'yi kurun veya API anahtarı kimlik doğrulaması kullanın.
- `Microsoft Foundry endpoint missing for MAI image generation`: katılım üzerinden bir
  Foundry dağıtımı seçin veya `models.providers.microsoft-foundry.baseUrl` ekleyin.
- `supports MAI image deployments only`: seçilen görüntü modeli MAI olmayan bir
  dağıtımı işaret ediyor. `image_generate` için dağıtılmış bir MAI görüntü modeli kullanın.

<!-- openclaw-plugin-reference:manual-end -->
