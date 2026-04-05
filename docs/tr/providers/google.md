---
read_when:
    - OpenClaw ile Google Gemini modellerini kullanmak istediğinizde
    - API anahtarı veya OAuth kimlik doğrulama akışına ihtiyaç duyduğunuzda
summary: Google Gemini kurulumu (API anahtarı + OAuth, görüntü oluşturma, medya anlama, web arama)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-05T14:03:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa3c4326e83fad277ae4c2cb9501b6e89457afcfa7e3e1d57ae01c9c0c6846e2
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Google plugin'i, Google AI Studio üzerinden Gemini modellerine erişim sağlar; ayrıca
Gemini Grounding üzerinden görüntü oluşturma, medya anlama (görüntü/ses/video) ve web aramayı da destekler.

- Sağlayıcı: `google`
- Kimlik doğrulama: `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- API: Google Gemini API
- Alternatif sağlayıcı: `google-gemini-cli` (OAuth)

## Hızlı başlangıç

1. API anahtarını ayarlayın:

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. Varsayılan bir model ayarlayın:

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## Etkileşimsiz örnek

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## OAuth (Gemini CLI)

Alternatif bir sağlayıcı olan `google-gemini-cli`, API anahtarı yerine PKCE OAuth kullanır.
Bu, resmi olmayan bir entegrasyondur; bazı kullanıcılar hesap
kısıtlamaları bildirmektedir. Riski size aittir.

- Varsayılan model: `google-gemini-cli/gemini-3.1-pro-preview`
- Takma ad: `gemini-cli`
- Kurulum ön koşulu: yerel Gemini CLI'nin `gemini` olarak kullanılabilir olması
  - Homebrew: `brew install gemini-cli`
  - npm: `npm install -g @google/gemini-cli`
- Giriş:

```bash
openclaw models auth login --provider google-gemini-cli --set-default
```

Ortam değişkenleri:

- `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
- `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

(Veya `GEMINI_CLI_*` varyantları.)

Girişten sonra Gemini CLI OAuth istekleri başarısız olursa gateway host üzerinde
`GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın ve
yeniden deneyin.

Tarayıcı akışı başlamadan önce giriş başarısız olursa yerel `gemini`
komutunun kurulu ve `PATH` üzerinde olduğundan emin olun. OpenClaw hem Homebrew kurulumlarını
hem de genel npm kurulumlarını, yaygın Windows/npm düzenleri dahil, destekler.

Gemini CLI JSON kullanım notları:

- Yanıt metni CLI JSON `response` alanından gelir.
- CLI `usage` alanını boş bıraktığında kullanım, `stats` alanına geri döner.
- `stats.cached`, OpenClaw `cacheRead` içine normalize edilir.
- `stats.input` yoksa OpenClaw giriş token'larını
  `stats.input_tokens - stats.cached` üzerinden türetir.

## Yetenekler

| Yetenek                | Destek durumu     |
| ---------------------- | ----------------- |
| Sohbet tamamlama       | Evet              |
| Görüntü oluşturma      | Evet              |
| Görüntü anlama         | Evet              |
| Ses transkripsiyonu    | Evet              |
| Video anlama           | Evet              |
| Web arama (Grounding)  | Evet              |
| Düşünme/muhakeme       | Evet (Gemini 3.1+) |

## Doğrudan Gemini önbellek yeniden kullanımı

Doğrudan Gemini API çalıştırmaları için (`api: "google-generative-ai"`), OpenClaw artık
yapılandırılmış bir `cachedContent` tanıtıcısını Gemini isteklerine iletir.

- Model başına veya genel parametreleri
  `cachedContent` ya da eski `cached_content` ile yapılandırın
- Her ikisi de varsa `cachedContent` önceliklidir
- Örnek değer: `cachedContents/prebuilt-context`
- Gemini önbellek isabeti kullanımı, yukarı akış `cachedContentTokenCount` değerinden
  OpenClaw `cacheRead` alanına normalize edilir

Örnek:

```json5
{
  agents: {
    defaults: {
      models: {
        "google/gemini-2.5-pro": {
          params: {
            cachedContent: "cachedContents/prebuilt-context",
          },
        },
      },
    },
  },
}
```

## Görüntü oluşturma

Paketlenmiş `google` görüntü oluşturma sağlayıcısı varsayılan olarak
`google/gemini-3.1-flash-image-preview` kullanır.

- Ayrıca `google/gemini-3-pro-image-preview` desteği de vardır
- Oluşturma: istek başına en fazla 4 görüntü
- Düzenleme modu: etkin, en fazla 5 giriş görüntüsü
- Geometri kontrolleri: `size`, `aspectRatio` ve `resolution`

Yalnızca OAuth kullanan `google-gemini-cli` sağlayıcısı ayrı bir metin çıkarımı
yüzeyidir. Görüntü oluşturma, medya anlama ve Gemini Grounding,
`google` sağlayıcı kimliğinde kalır.

## Ortam notu

Gateway bir daemon (launchd/systemd) olarak çalışıyorsa `GEMINI_API_KEY`
değerinin bu süreç için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
`env.shellEnv` aracılığıyla).
