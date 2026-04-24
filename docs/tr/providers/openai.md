---
read_when:
    - OpenClaw'da OpenAI modellerini kullanmak istiyorsunuz
    - API key'ler yerine Codex abonelik kimlik doğrulaması istiyorsunuz
    - Daha sıkı GPT-5 ajan yürütme davranışına ihtiyacınız var
summary: OpenClaw'da API key'ler veya Codex aboneliği aracılığıyla OpenAI kullanın
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T09:26:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3d533338fa15d866bb69584706162ce099bb4a1edc9851183fb5442730ebdd9b
    source_path: providers/openai.md
    workflow: 15
---

OpenAI, GPT modelleri için geliştirici API'leri sunar. OpenClaw, üç OpenAI ailesi yolunu destekler. Model öneki yolu seçer:

- **API key** — kullanım bazlı faturalandırma ile doğrudan OpenAI Platform erişimi (`openai/*` modelleri)
- **PI üzerinden Codex aboneliği** — abonelik erişimiyle ChatGPT/Codex oturum açma (`openai-codex/*` modelleri)
- **Codex app-server harness** — yerel Codex app-server yürütmesi (`openai/*` modelleri artı `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI, OpenClaw gibi harici araçlarda ve iş akışlarında abonelik OAuth kullanımını açıkça destekler.

<Note>
GPT-5.5 şu anda OpenClaw'da abonelik/OAuth yolları üzerinden kullanılabilir:
PI çalıştırıcısıyla `openai-codex/gpt-5.5` veya
Codex app-server harness ile `openai/gpt-5.5`. `openai/gpt-5.5` için doğrudan
API key erişimi, OpenAI herkese açık API'de GPT-5.5'i etkinleştirdiğinde
desteklenir; o zamana kadar `OPENAI_API_KEY` kurulumları için
`openai/gpt-5.4` gibi API etkin bir model kullanın.
</Note>

<Note>
OpenAI Plugin'ini etkinleştirmek veya bir `openai-codex/*` modeli seçmek,
paketlenmiş Codex app-server Plugin'ini etkinleştirmez. OpenClaw bu Plugin'i yalnızca
yerel Codex harness'i açıkça
`embeddedHarness.runtime: "codex"` ile seçtiğinizde veya eski bir `codex/*` model başvurusu kullandığınızda etkinleştirir.
</Note>

## OpenClaw özellik kapsamı

| OpenAI yeteneği         | OpenClaw yüzeyi                                           | Durum                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Sohbet / Responses          | `openai/<model>` model sağlayıcısı                            | Evet                                                    |
| Codex abonelik modelleri | `openai-codex/<model>` ile `openai-codex` OAuth           | Evet                                                    |
| Codex app-server harness  | `openai/<model>` ile `embeddedHarness.runtime: codex`     | Evet                                                    |
| Sunucu tarafı web araması    | Yerel OpenAI Responses aracı                               | Evet, web araması etkin olduğunda ve sağlayıcı sabitlenmediğinde |
| Görseller                    | `image_generate`                                           | Evet                                                    |
| Videolar                    | `video_generate`                                           | Evet                                                    |
| Metinden konuşmaya            | `messages.tts.provider: "openai"` / `tts`                  | Evet                                                    |
| Toplu konuşmadan metne      | `tools.media.audio` / medya anlama                  | Evet                                                    |
| Akışlı konuşmadan metne  | Voice Call `streaming.provider: "openai"`                  | Evet                                                    |
| Gerçek zamanlı ses            | Voice Call `realtime.provider: "openai"` / Control UI Talk | Evet                                                    |
| Embeddings                | bellek embedding sağlayıcısı                                  | Evet                                                    |

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Şunlar için en uygunu:** doğrudan API erişimi ve kullanım bazlı faturalandırma.

    <Steps>
      <Step title="API key'inizi alın">
        [OpenAI Platform dashboard](https://platform.openai.com/api-keys) üzerinden bir API key oluşturun veya kopyalayın.
      </Step>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Veya anahtarı doğrudan iletin:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Yol özeti

    | Model başvurusu | Yol | Kimlik doğrulama |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Doğrudan OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | Doğrudan OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | OpenAI, API üzerinde GPT-5.5'i etkinleştirdiğinde gelecekteki doğrudan API yolu | `OPENAI_API_KEY` |

    <Note>
    Açıkça
    Codex app-server harness'i zorlamadığınız sürece `openai/*`, doğrudan OpenAI API key yoludur. GPT-5.5'in kendisi şu anda yalnızca abonelik/OAuth
    yoluyla kullanılabilir; varsayılan PI çalıştırıcısı üzerinden Codex OAuth için `openai-codex/*` kullanın.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw, `openai/gpt-5.3-codex-spark` modelini **sunmaz**. Canlı OpenAI API istekleri bu modeli reddeder ve mevcut Codex kataloğu da bunu sunmaz.
    </Warning>

  </Tab>

  <Tab title="Codex aboneliği">
    **Şunlar için en uygunu:** ayrı bir API key yerine ChatGPT/Codex aboneliğinizi kullanmak. Codex cloud, ChatGPT oturum açmayı gerektirir.

    <Steps>
      <Step title="Codex OAuth'u çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Veya OAuth'u doğrudan çalıştırın:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Başsız veya callback'e elverişsiz kurulumlar için localhost tarayıcı callback'i yerine ChatGPT device-code akışıyla oturum açmak üzere `--device-code` ekleyin:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Varsayılan modeli ayarlayın">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Yol özeti

    | Model başvurusu | Yol | Kimlik doğrulama |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | PI üzerinden ChatGPT/Codex OAuth | Codex oturum açma |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | Codex app-server kimlik doğrulaması |

    <Note>
    Kimlik doğrulama/profil komutları için `openai-codex` sağlayıcı kimliğini kullanmaya devam edin.
    `openai-codex/*` model öneki de Codex OAuth için açık PI yoludur.
    Paketlenmiş Codex app-server harness'i seçmez veya otomatik etkinleştirmez.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding artık OAuth materyalini `~/.codex` içinden içe aktarmıyor. Tarayıcı OAuth'u (varsayılan) veya yukarıdaki device-code akışını kullanarak oturum açın — OpenClaw oluşan kimlik bilgilerini kendi ajan kimlik doğrulama deposunda yönetir.
    </Note>

    ### Durum göstergesi

    Sohbet `/status`, geçerli oturum için hangi gömülü harness'in etkin olduğunu gösterir.
    Varsayılan PI harness `Runner: pi (embedded)` olarak görünür ve ayrı
    bir rozet eklemez. Paketlenmiş Codex app-server harness seçildiğinde
    `/status`, örneğin
    `Fast · codex` biçiminde `Fast` yanına PI olmayan harness kimliğini ekler.
    Mevcut oturumlar kaydedilmiş harness kimliğini korur, bu yüzden `/status`'un
    yeni bir PI/Codex seçimini yansıtmasını istiyorsanız `embeddedHarness` değiştirdikten sonra
    `/new` veya `/reset` kullanın.

    ### Bağlam penceresi üst sınırı

    OpenClaw, model meta verilerini ve çalışma zamanı bağlam üst sınırını ayrı değerler olarak ele alır.

    Codex OAuth üzerinden `openai-codex/gpt-5.5` için:

    - Yerel `contextWindow`: `1000000`
    - Varsayılan çalışma zamanı `contextTokens` üst sınırı: `272000`

    Daha küçük varsayılan üst sınır pratikte daha iyi gecikme ve kalite özelliklerine sahiptir. Bunu `contextTokens` ile geçersiz kılın:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Yerel model meta verilerini bildirmek için `contextWindow` kullanın. Çalışma zamanı bağlam bütçesini sınırlamak için `contextTokens` kullanın.
    </Note>

  </Tab>
</Tabs>

## Görsel üretimi

Paketlenmiş `openai` Plugin'i, `image_generate` aracı üzerinden görsel üretimini kaydeder.
Hem OpenAI API key görsel üretimini hem de Codex OAuth görsel
üretimini aynı `openai/gpt-image-2` model başvurusu üzerinden destekler.

| Yetenek                | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model başvurusu                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Kimlik doğrulama                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth oturum açma           |
| Taşıma                 | OpenAI Images API                  | Codex Responses arka ucu              |
| İstek başına en fazla görsel    | 4                                  | 4                                    |
| Düzenleme modu                 | Etkin (en fazla 5 referans görsel) | Etkin (en fazla 5 referans görsel)   |
| Boyut geçersiz kılmaları            | 2K/4K boyutlar dahil desteklenir   | 2K/4K boyutlar dahil desteklenir     |
| En-boy oranı / çözünürlük | OpenAI Images API'ye iletilmez | Güvenli olduğunda desteklenen bir boyuta eşlenir |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için bkz. [Image Generation](/tr/tools/image-generation).
</Note>

`gpt-image-2`, hem OpenAI metinden görsel üretimi hem de görsel
düzenleme için varsayılandır. `gpt-image-1`, açık bir model geçersiz kılması olarak kullanılabilir olmaya devam eder, ancak yeni
OpenAI görsel iş akışları `openai/gpt-image-2` kullanmalıdır.

Codex OAuth kurulumlarında aynı `openai/gpt-image-2` başvurusunu kullanın. Bir
`openai-codex` OAuth profili yapılandırıldığında OpenClaw, depolanmış bu OAuth
erişim belirtecini çözümler ve görsel isteklerini Codex Responses arka ucu üzerinden gönderir. Bu
istek için önce `OPENAI_API_KEY` denemez veya sessizce bir API key'e geri dönmez.
Doğrudan OpenAI Images API
yolunu istediğinizde `models.providers.openai` içinde açıkça API key,
özel base URL veya Azure uç noktası yapılandırın.
Bu özel görsel uç noktası güvenilir bir LAN/özel adreste ise ayrıca
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ayarlayın; OpenClaw,
bu açık onay yoksa özel/iç OpenAI uyumlu görsel uç noktalarını engelli tutar.

Üret:

```text
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Düzenle:

```text
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Video üretimi

Paketlenmiş `openai` Plugin'i, `video_generate` aracı üzerinden video üretimini kaydeder.

| Yetenek       | Değer                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Varsayılan model    | `openai/sora-2`                                                                   |
| Modlar            | Metinden videoya, görselden videoya, tek video düzenleme                                  |
| Referans girdileri | 1 görsel veya 1 video                                                                |
| Boyut geçersiz kılmaları   | Desteklenir                                                                         |
| Diğer geçersiz kılmalar  | `aspectRatio`, `resolution`, `audio`, `watermark` bir araç uyarısıyla yok sayılır |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için bkz. [Video Generation](/tr/tools/video-generation).
</Note>

## GPT-5 istem katkısı

OpenClaw, sağlayıcılar genelinde GPT-5 ailesi çalıştırmaları için paylaşılan bir GPT-5 istem katkısı ekler. Model kimliğine göre uygulanır; bu nedenle `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` ve diğer uyumlu GPT-5 başvuruları aynı katmanı alır. Eski GPT-4.x modelleri almaz.

Paketlenmiş yerel Codex harness, Codex app-server geliştirici yönergeleri aracılığıyla aynı GPT-5 davranışını ve Heartbeat katmanını kullanır; bu nedenle `embeddedHarness.runtime: "codex"` üzerinden zorlanan `openai/gpt-5.x` oturumları, istemin geri kalanını Codex yönetse bile aynı takip etme ve proaktif Heartbeat rehberliğini korur.

GPT-5 katkısı; persona sürekliliği, yürütme güvenliği, araç disiplini, çıktı şekli, tamamlama denetimleri ve doğrulama için etiketli bir davranış sözleşmesi ekler. Kanala özgü yanıt ve sessiz mesaj davranışı, paylaşılan OpenClaw sistem isteminde ve giden teslim ilkesinde kalır. GPT-5 rehberliği eşleşen modeller için her zaman etkindir. Dostça etkileşim tarzı katmanı ayrıdır ve yapılandırılabilir.

| Değer                  | Etki                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (varsayılan) | Dostça etkileşim tarzı katmanını etkinleştir |
| `"on"`                 | `"friendly"` için takma ad                      |
| `"off"`                | Yalnızca dostça tarz katmanını devre dışı bırak       |

<Tabs>
  <Tab title="Yapılandırma">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Değerler çalışma zamanında büyük/küçük harfe duyarsızdır; bu nedenle hem `"Off"` hem de `"off"` dostça tarz katmanını devre dışı bırakır.
</Tip>

<Note>
Eski `plugins.entries.openai.config.personality`, paylaşılan `agents.defaults.promptOverlays.gpt5.personality` ayarı yapılmadığında uyumluluk fallback'i olarak hâlâ okunur.
</Note>

## Ses ve konuşma

<AccordionGroup>
  <Accordion title="Konuşma sentezi (TTS)">
    Paketlenmiş `openai` Plugin'i, `messages.tts` yüzeyi için konuşma sentezini kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Ses | `messages.tts.providers.openai.voice` | `coral` |
    | Hız | `messages.tts.providers.openai.speed` | (ayarlanmamış) |
    | Yönergeler | `messages.tts.providers.openai.instructions` | (ayarlanmamış, yalnızca `gpt-4o-mini-tts`) |
    | Biçim | `messages.tts.providers.openai.responseFormat` | ses notları için `opus`, dosyalar için `mp3` |
    | API key | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` değerine fallback yapar |
    | Temel URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Kullanılabilir modeller: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Kullanılabilir sesler: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Sohbet API uç noktasını etkilemeden TTS temel URL'sini geçersiz kılmak için `OPENAI_TTS_BASE_URL` ayarlayın.
    </Note>

  </Accordion>

  <Accordion title="Konuşmadan metne">
    Paketlenmiş `openai` Plugin'i, toplu konuşmadan metne özelliğini
    OpenClaw'ın medya anlama transkripsiyon yüzeyi üzerinden kaydeder.

    - Varsayılan model: `gpt-4o-transcribe`
    - Uç nokta: OpenAI REST `/v1/audio/transcriptions`
    - Girdi yolu: multipart ses dosyası yükleme
    - OpenClaw'da, gelen ses transkripsiyonunun
      `tools.media.audio` kullandığı her yerde desteklenir; buna Discord ses kanalı segmentleri ve kanal
      ses ekleri dahildir

    Gelen ses transkripsiyonu için OpenAI'ı zorlamak amacıyla:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Dil ve istem ipuçları, paylaşılan ses medya yapılandırması veya çağrı başına transkripsiyon isteği tarafından sağlandığında OpenAI'a iletilir.

  </Accordion>

  <Accordion title="Gerçek zamanlı transkripsiyon">
    Paketlenmiş `openai` Plugin'i, Voice Call Plugin'i için gerçek zamanlı transkripsiyonu kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Dil | `...openai.language` | (ayarlanmamış) |
    | İstem | `...openai.prompt` | (ayarlanmamış) |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `800` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | `OPENAI_API_KEY` değerine fallback yapar |

    <Note>
    `wss://api.openai.com/v1/realtime` adresine G.711 u-law (`g711_ulaw` / `audio/pcmu`) ses ile bir WebSocket bağlantısı kullanır. Bu akış sağlayıcısı, Voice Call'ın gerçek zamanlı transkripsiyon yolu içindir; Discord voice şu anda kısa segmentler kaydeder ve bunun yerine toplu `tools.media.audio` transkripsiyon yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="Gerçek zamanlı ses">
    Paketlenmiş `openai` Plugin'i, Voice Call Plugin'i için gerçek zamanlı sesi kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Ses | `...openai.voice` | `alloy` |
    | Sıcaklık | `...openai.temperature` | `0.8` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | `OPENAI_API_KEY` değerine fallback yapar |

    <Note>
    `azureEndpoint` ve `azureDeployment` yapılandırma anahtarları üzerinden Azure OpenAI'ı destekler. Çift yönlü araç çağrımını destekler. G.711 u-law ses biçimini kullanır.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI uç noktaları

Paketlenmiş `openai` sağlayıcısı, temel URL'yi geçersiz kılarak bir Azure OpenAI kaynağını görsel
üretimi için hedefleyebilir. Görsel üretim yolunda OpenClaw,
`models.providers.openai.baseUrl` üzerinde Azure ana makine adlarını algılar ve otomatik olarak
Azure'nun istek şekline geçer.

<Note>
Gerçek zamanlı ses ayrı bir yapılandırma yolu kullanır
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ve `models.providers.openai.baseUrl` değerinden etkilenmez. Azure
ayarları için [Ses ve konuşma](#voice-and-speech) altındaki **Gerçek zamanlı
ses** akordeonuna bakın.
</Note>

Azure OpenAI'ı şu durumlarda kullanın:

- Zaten bir Azure OpenAI aboneliğiniz, kotanız veya kurumsal anlaşmanız varsa
- Azure'un sağladığı bölgesel veri yerleşimi veya uyumluluk denetimlerine ihtiyacınız varsa
- Trafiği mevcut bir Azure tenant'ı içinde tutmak istiyorsanız

### Yapılandırma

Paketlenmiş `openai` sağlayıcısı üzerinden Azure görsel üretimi için
`models.providers.openai.baseUrl` değerini Azure kaynağınıza yönlendirin ve `apiKey` değerini
Azure OpenAI anahtarı olarak ayarlayın (OpenAI Platform anahtarı değil):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw, Azure görsel üretim
yolu için şu Azure ana makine soneklerini tanır:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Tanınan bir Azure ana makinesindeki görsel üretim istekleri için OpenClaw:

- `Authorization: Bearer` yerine `api-key` başlığını gönderir
- Deployment kapsamlı yollar kullanır (`/openai/deployments/{deployment}/...`)
- Her isteğe `?api-version=...` ekler

Diğer temel URL'ler (herkese açık OpenAI, OpenAI uyumlu proxy'ler) standart
OpenAI görsel istek şeklini korur.

<Note>
`openai` sağlayıcısının görsel üretim yolu için Azure yönlendirmesi
OpenClaw 2026.4.22 veya sonrasını gerektirir. Daha eski sürümler herhangi bir özel
`openai.baseUrl` değerini herkese açık OpenAI uç noktası gibi değerlendirir ve Azure
görsel deployment'larına karşı başarısız olur.
</Note>

### API sürümü

Azure görsel üretim yolu için belirli bir Azure önizleme veya GA sürümünü
sabitlemek amacıyla `AZURE_OPENAI_API_VERSION` ayarlayın:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Değişken ayarlanmamışsa varsayılan `2024-12-01-preview` olur.

### Model adları deployment adlarıdır

Azure OpenAI, modelleri deployment'lara bağlar. Paketlenmiş `openai` sağlayıcısı üzerinden yönlendirilen Azure görsel üretim istekleri için OpenClaw'daki `model` alanı,
Azure portalında yapılandırdığınız **Azure deployment adı** olmalıdır; herkese açık
OpenAI model kimliği değil.

`gpt-image-2` sunan `gpt-image-2-prod` adlı bir deployment oluşturursanız:

```text
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Aynı deployment adı kuralı, paketlenmiş `openai` sağlayıcısı üzerinden yönlendirilen
görsel üretim çağrıları için de geçerlidir.

### Bölgesel kullanılabilirlik

Azure görsel üretimi şu anda yalnızca bazı bölgelerde kullanılabilir
(örneğin `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Bir deployment oluşturmadan önce Microsoft'un güncel bölge listesini denetleyin
ve belirli modelin bölgenizde sunulduğunu doğrulayın.

### Parametre farklılıkları

Azure OpenAI ve herkese açık OpenAI her zaman aynı görsel parametrelerini kabul etmez.
Azure, herkese açık OpenAI'ın izin verdiği seçenekleri reddedebilir (örneğin
`gpt-image-2` üzerindeki bazı `background` değerleri) veya bunları yalnızca belirli model
sürümlerinde sunabilir. Bu farklar Azure'dan ve alttaki modelden kaynaklanır,
OpenClaw'dan değil. Bir Azure isteği doğrulama hatasıyla başarısız olursa,
Azure portalında belirli deployment ve API sürümünüz tarafından desteklenen
parametre kümesini denetleyin.

<Note>
Azure OpenAI yerel taşıma ve uyumluluk davranışını kullanır ancak
OpenClaw'ın gizli atıf başlıklarını almaz — bkz. [Gelişmiş yapılandırma](#advanced-configuration) altındaki **Yerel ve OpenAI uyumlu
yollar** akordeonu.

Azure üzerinde sohbet veya Responses trafiği için (görsel üretimin ötesinde),
onboarding akışını veya ayrılmış bir Azure sağlayıcı yapılandırmasını kullanın — `openai.baseUrl` tek başına Azure API/kimlik doğrulama şeklini almaz. Ayrı bir
`azure-openai-responses/*` sağlayıcısı vardır; bkz.
aşağıdaki Sunucu tarafı Compaction akordeonu.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Taşıma (WebSocket ve SSE)">
    OpenClaw, hem `openai/*` hem de `openai-codex/*` için WebSocket-öncelikli ve SSE fallback (`"auto"`) kullanır.

    `"auto"` modunda OpenClaw:
    - SSE'ye fallback yapmadan önce erken bir WebSocket hatasını bir kez yeniden dener
    - Bir hatadan sonra WebSocket'i yaklaşık 60 saniye boyunca bozulmuş olarak işaretler ve soğuma süresince SSE kullanır
    - Yeniden denemeler ve yeniden bağlantılar için kararlı oturum ve dönüş kimlik başlıkları ekler
    - Taşıma varyantları arasında kullanım sayaçlarını (`input_tokens` / `prompt_tokens`) normalize eder

    | Değer | Davranış |
    |-------|----------|
    | `"auto"` (varsayılan) | Önce WebSocket, SSE fallback |
    | `"sse"` | Yalnızca SSE'yi zorla |
    | `"websocket"` | Yalnızca WebSocket'i zorla |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    İlgili OpenAI belgeleri:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket hazırlığı">
    OpenClaw, ilk dönüş gecikmesini azaltmak için `openai/*` ve `openai-codex/*` için varsayılan olarak WebSocket hazırlığını etkinleştirir.

    ```json5
    // Hazırlığı devre dışı bırak
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Hızlı mod">
    OpenClaw, `openai/*` ve `openai-codex/*` için paylaşılan bir hızlı mod anahtarı sunar:

    - **Sohbet/UI:** `/fast status|on|off`
    - **Yapılandırma:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Etkinleştirildiğinde OpenClaw, hızlı modu OpenAI öncelikli işlemeye eşler (`service_tier = "priority"`). Mevcut `service_tier` değerleri korunur ve hızlı mod `reasoning` veya `text.verbosity` alanlarını yeniden yazmaz.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Oturum geçersiz kılmaları yapılandırmaya üstün gelir. Sessions UI içinde oturum geçersiz kılmasını temizlemek, oturumu yapılandırılmış varsayılana geri döndürür.
    </Note>

  </Accordion>

  <Accordion title="Öncelikli işleme (service_tier)">
    OpenAI API'si, öncelikli işlemeyi `service_tier` üzerinden sunar. Bunu OpenClaw'da model başına ayarlayın:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Desteklenen değerler: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` yalnızca yerel OpenAI uç noktalarına (`api.openai.com`) ve yerel Codex uç noktalarına (`chatgpt.com/backend-api`) iletilir. Herhangi bir sağlayıcıyı bir proxy üzerinden yönlendirirseniz OpenClaw, `service_tier` alanını değiştirmeden bırakır.
    </Warning>

  </Accordion>

  <Accordion title="Sunucu tarafı Compaction (Responses API)">
    Doğrudan OpenAI Responses modelleri için (`api.openai.com` üzerindeki `openai/*`), OpenAI Plugin'inin Pi-harness akış sarmalayıcısı sunucu tarafı Compaction'ı otomatik etkinleştirir:

    - `store: true` değerini zorlar (`supportsStore: false` olarak ayarlayan model uyumluluğu yoksa)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` enjekte eder
    - Varsayılan `compact_threshold`: `contextWindow` değerinin %70'i (veya yoksa `80000`)

    Bu, yerleşik Pi harness yoluna ve gömülü çalıştırmalar tarafından kullanılan OpenAI sağlayıcı kancalarına uygulanır. Yerel Codex app-server harness kendi bağlamını Codex üzerinden yönetir ve `agents.defaults.embeddedHarness.runtime` ile ayrı yapılandırılır.

    <Tabs>
      <Tab title="Açıkça etkinleştirin">
        Azure OpenAI Responses gibi uyumlu uç noktalar için kullanışlıdır:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Özel eşik">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Devre dışı bırak">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` yalnızca `context_management` eklemeyi denetler. Doğrudan OpenAI Responses modelleri, uyumluluk `supportsStore: false` ayarlamadıkça yine de `store: true` değerini zorlar.
    </Note>

  </Accordion>

  <Accordion title="Sıkı ajan tabanlı GPT modu">
    `openai/*` üzerindeki GPT-5 ailesi çalıştırmaları için OpenClaw, daha sıkı bir gömülü yürütme sözleşmesi kullanabilir:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` ile OpenClaw:
    - Bir araç eylemi mevcut olduğunda yalnızca plan içeren bir dönüşü artık başarılı ilerleme olarak görmez
    - Dönüşü şimdi-harekete-geç yönlendirmesiyle yeniden dener
    - Kayda değer işler için `update_plan` özelliğini otomatik etkinleştirir
    - Model eyleme geçmeden plan yapmaya devam ederse açık bir engellenmiş durum gösterir

    <Note>
    Yalnızca OpenAI ve Codex GPT-5 ailesi çalıştırmalarıyla sınırlıdır. Diğer sağlayıcılar ve daha eski model aileleri varsayılan davranışı korur.
    </Note>

  </Accordion>

  <Accordion title="Yerel ve OpenAI uyumlu yollar">
    OpenClaw, doğrudan OpenAI, Codex ve Azure OpenAI uç noktalarını genel OpenAI uyumlu `/v1` proxy'lerden farklı ele alır:

    **Yerel yollar** (`openai/*`, Azure OpenAI):
    - `reasoning: { effort: "none" }` değerini yalnızca OpenAI `none` effort'u destekleyen modeller için korur
    - `reasoning.effort: "none"` değerini reddeden modeller veya proxy'ler için devre dışı reasoning'i çıkarır
    - Araç şemalarını varsayılan olarak sıkı moda ayarlar
    - Gizli atıf başlıklarını yalnızca doğrulanmış yerel ana makinelerde ekler
    - OpenAI'ya özel istek şekillendirmesini korur (`service_tier`, `store`, reasoning-compat, prompt-cache ipuçları)

    **Proxy/uyumlu yollar:**
    - Daha gevşek uyumluluk davranışı kullanır
    - Sıkı araç şemalarını veya yalnızca yerel başlıkları zorlamaz

    Azure OpenAI yerel taşıma ve uyumluluk davranışını kullanır ancak gizli atıf başlıklarını almaz.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve failover davranışını seçme.
  </Card>
  <Card title="Görsel üretimi" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görsel araç parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video araç parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
