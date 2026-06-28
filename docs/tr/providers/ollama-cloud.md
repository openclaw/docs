---
read_when:
    - Barındırılan Ollama modellerini yerel bir Ollama sunucusu olmadan kullanmak istiyorsunuz
    - ollama-cloud sağlayıcı kimliğine, anahtarına veya uç noktasına ihtiyacınız var
summary: Ollama Cloud’u OpenClaw ile doğrudan kullanın
title: Ollama Cloud
x-i18n:
    generated_at: "2026-06-28T01:11:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24b937085de1ed805b7bb0fe76a4197030bd45cd989ede8030386f3c721b9763
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud, Ollama'nın barındırılan model API'sidir. OpenClaw'ın yerel bir Ollama sunucusu kurmadan veya yerel bir Ollama uygulamasını bulut modunda oturum açtırmadan Ollama tarafından barındırılan modelleri doğrudan çağırmasını sağlar. Sağlayıcı kimliği olarak `ollama-cloud`, model referansları olarak da `ollama-cloud/kimi-k2.6` gibi değerler kullanın.

Bu sayfa, doğrudan yalnızca bulut yönlendirmesi içindir. Sağlayıcı, OpenAI uyumlu `/v1` rotasını değil, Ollama'nın yerel `/api/chat` stilini kullanır. OpenClaw bunu ayrı bir sağlayıcı kimliği olarak kaydeder; böylece yalnızca buluta ait kimlik bilgileri, canlı katalog keşfi ve model seçimi yerel bir `ollama` ana makinesiyle karışmaz.

Yalnızca bulut yönlendirmesi istediğinizde bu sayfayı kullanın. Yerel Ollama, hibrit bulut artı yerel yönlendirme, embeddings ve özel ana makine ayrıntıları için [Ollama](/tr/providers/ollama) sayfasına bakın.

## Kurulum

[ollama.com/settings/keys](https://ollama.com/settings/keys) adresinde bir Ollama Cloud API anahtarı oluşturun, ardından şunu çalıştırın:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Ya da şunu ayarlayın:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

## Varsayılanlar

- Sağlayıcı: `ollama-cloud`
- Temel URL: `https://ollama.com`
- Ortam değişkeni: `OLLAMA_API_KEY`
- API stili: Ollama yerel `/api/chat`
- Örnek model: `ollama-cloud/kimi-k2.6`

## Ollama Cloud ne zaman seçilmeli

- Yerelde `ollama serve` çalıştırmadan barındırılan Ollama modelleri istiyorsunuz.
- OpenClaw'ın yerel Ollama için kullandığı aynı yerel Ollama sohbet API biçimini istiyorsunuz, ancak `https://ollama.com` adresine yönlendirilmiş şekilde.
- Ollama'nın barındırılan kataloğunda zaten bulunan modeller için basit bir bulut yolu istiyorsunuz.
- Yerel model çekme, yerel GPU denetimi veya yalnızca LAN üzerinden çıkarıma ihtiyacınız yok.

Oturum açılmış bir Ollama ana makinesi üzerinden yalnızca yerel veya bulut artı yerel yönlendirme istediğinizde bunun yerine [Ollama](/tr/providers/ollama) kullanın. `/v1/chat/completions` semantiğine veya sağlayıcıya özgü OpenAI tarzı özelliklere ihtiyaç duyduğunuzda bunun yerine OpenAI uyumlu bir sağlayıcı kullanın.

## Modeller

OpenClaw, Ollama Cloud modellerini canlı barındırılan katalogdan keşfeder. Yaygın olarak kullanılabilen barındırılan kimlikler şunları içerir:

- `ollama-cloud/gpt-oss:20b`
- `ollama-cloud/kimi-k2.6`
- `ollama-cloud/deepseek-v4-flash`
- `ollama-cloud/minimax-m2.7`
- `ollama-cloud/glm-5`

Geçerli barındırılan kataloğunuzdan bir model kimliği kullanın:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Model kimlikleri bulut katalog kimlikleridir, yerel çekme adları değildir. Bir model adı yerel bir Ollama ana makinesinde çalışıyor ancak barındırılan katalogda yoksa bunun yerine ilgili yerel ana makineyle `ollama` sağlayıcısını kullanın.

## Canlı test

Ollama Cloud API anahtarı smoke testleri için Ollama canlı testini barındırılan uç noktaya yönlendirin ve geçerli kataloğunuzdan bir model seçin:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Bulut smoke testi metin, yerel akış ve web aramasını çalıştırır. Ollama Cloud API anahtarları `/api/embed` için yetki vermeyebileceğinden, `https://ollama.com` için embeddings varsayılan olarak atlanır.

## Sorun giderme

- `Set OLLAMA_API_KEY` hataları: gerçek bir bulut API anahtarı sağlayın. Yerel `ollama-local` işaretçisi yalnızca yerel veya özel Ollama ana makineleri içindir.
- Bilinmeyen model hataları: `openclaw models list --provider ollama-cloud` çalıştırın ve barındırılan model kimliğini tam olarak kopyalayın.
- Özel Ollama ana makinelerinde tool-call veya ham JSON sorunları: yanlışlıkla OpenAI uyumlu bir `/v1` URL'si kullanıp kullanmadığınızı kontrol edin. Ollama rotaları, `/v1` soneki olmadan yerel temel URL'yi kullanmalıdır.

## İlgili

- [Ollama](/tr/providers/ollama)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [Tüm sağlayıcılar](/tr/providers/index)
