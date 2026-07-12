---
read_when:
    - Yerel bir Ollama sunucusu olmadan barındırılan Ollama modellerini kullanmak istiyorsunuz
    - ollama-cloud sağlayıcı kimliğine, anahtarına veya uç noktasına ihtiyacınız var
summary: Ollama Cloud'u doğrudan OpenClaw ile kullanın
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-12T12:43:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud, Ollama'nın barındırılan model API'sidir. `ollama-cloud` sağlayıcısı,
yerel bir Ollama sunucusu veya bulut modunda oturum açmış yerel bir Ollama
uygulaması olmadan, Ollama'nın yerel `/api/chat` API'si üzerinden doğrudan
`https://ollama.com` adresini çağırır. `ollama-cloud/kimi-k2.6` gibi model
referansları kullanın.

OpenClaw, yalnızca buluta özgü kimlik bilgilerinin, canlı katalog keşfinin ve
model seçiminin yerel bir `ollama` ana makinesiyle karışmaması için
`ollama-cloud` değerini ayrı bir sağlayıcı kimliği olarak kaydeder. Yerel
Ollama, karma bulut ve yerel yönlendirme, gömmeler ve özel ana makine ayrıntıları
için [Ollama](/tr/providers/ollama) sayfasına bakın.

## Kurulum

[ollama.com/settings/keys](https://ollama.com/settings/keys) adresinde bir Ollama Cloud API anahtarı oluşturun, ardından şunu çalıştırın:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Veya şunu ayarlayın:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

Etkileşimsiz ilk kurulum, anahtarı doğrudan kabul eder:

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

İlk kurulum, varsayılan modeli `ollama-cloud/kimi-k2.5:cloud` olarak ayarlar.

## Varsayılanlar

- Sağlayıcı: `ollama-cloud`
- Temel URL: `https://ollama.com`
- Ortam değişkeni: `OLLAMA_API_KEY`
- API biçimi: Ollama yerel `/api/chat`
- İlk kurulumun varsayılan modeli: `ollama-cloud/kimi-k2.5:cloud`

## Ollama Cloud ne zaman seçilmeli?

- Yerel olarak `ollama serve` çalıştırmadan barındırılan Ollama modellerini kullanmak istiyorsanız.
- OpenClaw'ın yerel Ollama için kullandığı yerel Ollama sohbet API'si biçiminin aynısını, ancak `https://ollama.com` adresine yönlendirilmiş olarak kullanmak istiyorsanız.
- Ollama'nın barındırılan kataloğunda zaten bulunan modeller için basit bir bulut yolu istiyorsanız.
- Yerel model indirmelerine, yerel GPU denetimine veya yalnızca LAN üzerinden çıkarıma ihtiyacınız yoksa.

Oturum açılmış bir Ollama ana makinesi üzerinden yalnızca yerel veya bulut ve
yerel yönlendirme istediğinizde bunun yerine [Ollama](/tr/providers/ollama)
kullanın. `/v1/chat/completions` semantiğine veya sağlayıcıya özgü OpenAI
tarzı özelliklere ihtiyaç duyduğunuzda bunun yerine OpenAI uyumlu bir sağlayıcı
kullanın.

## Modeller

Sağlayıcı bir API anahtarı gerektirir; anahtar olmadan etkin kalmaz. Bir anahtar
sağlandığında OpenClaw, Ollama Cloud modellerini barındırılan katalogdan canlı
olarak keşfeder:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Canlı katalogdaki barındırılan kimlikler arasında `deepseek-v4-flash`, `glm-5`,
`gpt-oss:20b`, `kimi-k2.6` ve `minimax-m2.7` bulunur. Canlı keşif hiçbir sonuç
döndürmediğinde OpenClaw, paketle birlikte gelen `kimi-k2.5:cloud`,
`minimax-m2.7:cloud`, `glm-5.1:cloud` ve `glm-5.2:cloud` satırlarına geri döner.

Model kimlikleri yerel indirme adları değil, bulut kataloğu kimlikleridir. Bir
model adı yerel bir Ollama ana makinesinde çalışıyor ancak barındırılan katalogda
bulunmuyorsa bunun yerine söz konusu yerel ana makineyle `ollama` sağlayıcısını
kullanın.

## Canlı test

Ollama Cloud API anahtarı duman testlerinde, Ollama canlı testini barındırılan
uç noktaya yönlendirin ve geçerli kataloğunuzdan bir model seçin:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Bulut duman testi metin, yerel akış ve web aramasını çalıştırır; web aramasını
atlamak için `OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0` ayarlayın. Ollama Cloud API
anahtarları `/api/embed` için yetki vermeyebileceğinden,
`https://ollama.com` için gömmeleri varsayılan olarak atlar; çalışmaya zorlamak
için `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` ayarlayın.

## Sorun giderme

- `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY` hataları: gerçek bir bulut API anahtarı sağlayın. Yerel `ollama-local` işareti yalnızca yerel veya özel Ollama ana makineleri içindir.
- Bilinmeyen model hataları: `openclaw models list --provider ollama-cloud` komutunu çalıştırın ve barındırılan model kimliğini tam olarak kopyalayın.
- Özel Ollama ana makinelerinde araç çağrısı veya ham JSON sorunları: yanlışlıkla OpenAI uyumlu bir `/v1` URL'si kullanıp kullanmadığınızı kontrol edin. Ollama rotaları, `/v1` son eki olmadan yerel temel URL'yi kullanmalıdır.

## İlgili

- [Ollama](/tr/providers/ollama)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [Tüm sağlayıcılar](/tr/providers/index)
