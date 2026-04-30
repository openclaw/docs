---
read_when:
    - OpenClaw’da gizlilik odaklı çıkarım istiyorsunuz
    - Venice AI kurulum rehberliği istiyorsunuz
summary: OpenClaw'da Venice AI'ın gizlilik odaklı modellerini kullanın
title: Venice AI
x-i18n:
    generated_at: "2026-04-30T09:42:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87db1595ba6d34459143e7d173cca9549ad21928eaaf00605b7487ce6d33fce
    source_path: providers/venice.md
    workflow: 16
---

Venice AI, sansürsüz modeller desteği ve anonimleştirilmiş proxy üzerinden büyük tescilli modellere erişimle **gizlilik odaklı AI inference** sağlar. Tüm inference varsayılan olarak özeldir — verilerinizle eğitim yapılmaz, günlük kaydı tutulmaz.

## OpenClaw’da Neden Venice

- Açık kaynak modeller için **özel inference** (günlük kaydı yok).
- İhtiyaç duyduğunuzda **sansürsüz modeller**.
- Kalite önemli olduğunda tescilli modellere (Opus/GPT/Gemini) **anonimleştirilmiş erişim**.
- OpenAI uyumlu `/v1` endpoint’leri.

## Gizlilik modları

Venice iki gizlilik düzeyi sunar — modelinizi seçerken bunu anlamak önemlidir:

| Mod                 | Açıklama                                                                                                                                    | Modeller                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Özel**            | Tamamen özel. Prompt’lar/yanıtlar **asla saklanmaz veya günlüğe kaydedilmez**. Geçicidir.                                                   | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, vb. |
| **Anonimleştirilmiş** | Metadata temizlenerek Venice üzerinden proxy’lenir. Alttaki provider (OpenAI, Anthropic, Google, xAI) anonimleştirilmiş istekleri görür. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Anonimleştirilmiş modeller tamamen özel **değildir**. Venice iletmeden önce metadata’yı temizler, ancak alttaki provider (OpenAI, Anthropic, Google, xAI) isteği yine de işler. Tam gizlilik gerektiğinde **Özel** modelleri seçin.
</Warning>

## Özellikler

- **Gizlilik odaklı**: "özel" (tamamen özel) ve "anonimleştirilmiş" (proxy’lenmiş) modlar arasında seçim yapın
- **Sansürsüz modeller**: İçerik kısıtlamaları olmayan modellere erişim
- **Büyük modellere erişim**: Claude, GPT, Gemini ve Grok’u Venice’in anonimleştirilmiş proxy’si üzerinden kullanın
- **OpenAI uyumlu API**: Kolay entegrasyon için standart `/v1` endpoint’leri
- **Streaming**: Tüm modellerde desteklenir
- **Function calling**: Seçili modellerde desteklenir (model yeteneklerini kontrol edin)
- **Vision**: Görü yeteneği olan modellerde desteklenir
- **Katı rate limit yok**: Aşırı kullanımda adil kullanım throttling uygulanabilir

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    1. [venice.ai](https://venice.ai) adresinde kaydolun
    2. **Settings > API Keys > Create new key** yoluna gidin
    3. API anahtarınızı kopyalayın (biçim: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="OpenClaw’u yapılandırın">
    Tercih ettiğiniz kurulum yöntemini seçin:

    <Tabs>
      <Tab title="Etkileşimli (önerilir)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Bu işlem:
        1. API anahtarınızı ister (veya mevcut `VENICE_API_KEY` değerini kullanır)
        2. Kullanılabilir tüm Venice modellerini gösterir
        3. Varsayılan modelinizi seçmenizi sağlar
        4. Provider’ı otomatik olarak yapılandırır
      </Tab>
      <Tab title="Ortam değişkeni">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Etkileşimsiz">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Kurulumu doğrulayın">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## Model seçimi

Kurulumdan sonra OpenClaw kullanılabilir tüm Venice modellerini gösterir. İhtiyaçlarınıza göre seçin:

- **Varsayılan model**: Güçlü özel reasoning ve vision için `venice/kimi-k2-5`.
- **Yüksek yetenekli seçenek**: En güçlü anonimleştirilmiş Venice yolu için `venice/claude-opus-4-6`.
- **Gizlilik**: Tamamen özel inference için "özel" modelleri seçin.
- **Yetenek**: Venice proxy’si üzerinden Claude, GPT, Gemini erişimi için "anonimleştirilmiş" modelleri seçin.

Varsayılan modelinizi istediğiniz zaman değiştirin:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Kullanılabilir tüm modelleri listeleyin:

```bash
openclaw models list | grep venice
```

Ayrıca `openclaw configure` komutunu çalıştırıp **Model/auth** öğesini seçebilir ve **Venice AI** tercih edebilirsiniz.

<Tip>
Kullanım durumunuz için doğru modeli seçmek üzere aşağıdaki tabloyu kullanın.

| Kullanım Durumu              | Önerilen Model                   | Neden                                      |
| ---------------------------- | -------------------------------- | ------------------------------------------ |
| **Genel sohbet (varsayılan)** | `kimi-k2-5`                      | Güçlü özel reasoning ve vision             |
| **Genel olarak en iyi kalite** | `claude-opus-4-6`                | En güçlü anonimleştirilmiş Venice seçeneği |
| **Gizlilik + kodlama**        | `qwen3-coder-480b-a35b-instruct` | Geniş context’e sahip özel kodlama modeli  |
| **Özel vision**               | `kimi-k2-5`                      | Özel moddan çıkmadan vision desteği        |
| **Hızlı + ucuz**              | `qwen3-4b`                       | Hafif reasoning modeli                     |
| **Karmaşık özel görevler**    | `deepseek-v3.2`                  | Güçlü reasoning, ancak Venice tool desteği yok |
| **Sansürsüz**                 | `venice-uncensored`              | İçerik kısıtlamaları yok                   |

</Tip>

## DeepSeek V4 replay davranışı

Venice `venice/deepseek-v4-pro` veya
`venice/deepseek-v4-flash` gibi DeepSeek V4 modelleri sunarsa OpenClaw, proxy
bunu atladığında assistant mesajlarında gerekli DeepSeek V4
`reasoning_content` replay placeholder’ını doldurur. Venice, DeepSeek’in yerel üst düzey `thinking` kontrolünü reddeder; bu nedenle
OpenClaw bu provider’a özgü replay düzeltmesini yerel
DeepSeek provider’ının thinking kontrollerinden ayrı tutar.

## Yerleşik katalog (toplam 41)

<AccordionGroup>
  <Accordion title="Özel modeller (26) — tamamen özel, günlük kaydı yok">
    | Model ID                               | Ad                                  | Context | Özellikler                |
    | -------------------------------------- | ----------------------------------- | ------- | ------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | Varsayılan, reasoning, vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Reasoning                 |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | Genel                     |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | Genel                     |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | Genel, tools devre dışı   |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | Reasoning                 |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | Genel                     |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | Kodlama                   |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | Kodlama                   |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | Reasoning, vision         |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | Genel                     |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k    | Vision                    |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k     | Hızlı, reasoning          |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | Reasoning, tools devre dışı |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Sansürsüz, tools devre dışı |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k    | Vision                    |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | Vision                    |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k    | Genel                     |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k    | Genel                     |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k    | Reasoning                 |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k    | Genel                     |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k    | Reasoning                 |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k    | Reasoning                 |
    | `zai-org-glm-5`                        | GLM 5                              | 198k    | Reasoning                 |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k    | Reasoning                 |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k    | Reasoning                 |
  </Accordion>

  <Accordion title="Anonimleştirilmiş modeller (15) — Venice proxy üzerinden">
    | Model ID                        | Ad                             | Context | Özellikler               |
    | ------------------------------- | ------------------------------ | ------- | ------------------------ |
    | `claude-opus-4-6`               | Claude Opus 4.6 (Venice üzerinden)   | 1M      | Reasoning, vision        |
    | `claude-opus-4-5`               | Claude Opus 4.5 (Venice üzerinden)   | 198k    | Reasoning, vision        |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (Venice üzerinden) | 1M      | Reasoning, vision        |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (Venice üzerinden) | 198k    | Reasoning, vision        |
    | `openai-gpt-54`                 | GPT-5.4 (Venice üzerinden)           | 1M      | Reasoning, vision        |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (Venice üzerinden)     | 400k    | Reasoning, vision, kodlama |
    | `openai-gpt-52`                 | GPT-5.2 (Venice üzerinden)           | 256k    | Reasoning                |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (Venice üzerinden)     | 256k    | Reasoning, vision, kodlama |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (Venice üzerinden)            | 128k    | Vision                   |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (Venice üzerinden)       | 128k    | Vision                   |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (Venice üzerinden)    | 1M      | Reasoning, vision        |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (Venice üzerinden)      | 198k    | Reasoning, vision        |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (Venice üzerinden)    | 256k    | Reasoning, vision        |
    | `grok-41-fast`                  | Grok 4.1 Fast (Venice üzerinden)     | 1M      | Reasoning, vision        |
    | `grok-code-fast-1`              | Grok Code Fast 1 (Venice üzerinden)  | 256k    | Reasoning, kodlama       |
  </Accordion>
</AccordionGroup>

## Model keşfi

`VENICE_API_KEY` ayarlandığında OpenClaw modelleri Venice API’den otomatik olarak keşfeder. API’ye ulaşılamazsa statik bir kataloğa geri döner.

`/models` endpoint’i herkese açıktır (listeleme için auth gerekmez), ancak inference geçerli bir API anahtarı gerektirir.

## Streaming ve tool desteği

| Özellik              | Destek                                              |
| -------------------- | ---------------------------------------------------- |
| **Akış**        | Tüm modeller                                           |
| **Fonksiyon çağırma** | Çoğu model (API içinde `supportsFunctionCalling` değerini kontrol edin) |
| **Görme/Görseller**    | "Görme" özelliğiyle işaretlenmiş modeller                  |
| **JSON modu**        | `response_format` üzerinden desteklenir                      |

## Fiyatlandırma

Venice kredi tabanlı bir sistem kullanır. Güncel fiyatlar için [venice.ai/pricing](https://venice.ai/pricing) sayfasını kontrol edin:

- **Özel modeller**: Genellikle daha düşük maliyet
- **Anonimleştirilmiş modeller**: Doğrudan API fiyatlandırmasına benzer + küçük Venice ücreti

### Venice (anonimleştirilmiş) ve doğrudan API

| Yön       | Venice (Anonimleştirilmiş)           | Doğrudan API          |
| ------------ | ----------------------------- | ------------------- |
| **Gizlilik**  | Meta veriler kaldırılır, anonimleştirilir | Hesabınız bağlanır |
| **Gecikme**  | +10-50 ms (proxy)              | Doğrudan              |
| **Özellikler** | Çoğu özellik desteklenir       | Tüm özellikler       |
| **Faturalandırma**  | Venice kredileri                | Sağlayıcı faturalandırması    |

## Kullanım örnekleri

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="API anahtarı tanınmıyor">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Anahtarın `vapi_` ile başladığından emin olun.

  </Accordion>

  <Accordion title="Model kullanılamıyor">
    Venice model kataloğu dinamik olarak güncellenir. Şu anda kullanılabilir modelleri görmek için `openclaw models list` komutunu çalıştırın. Bazı modeller geçici olarak çevrimdışı olabilir.
  </Accordion>

  <Accordion title="Bağlantı sorunları">
    Venice API `https://api.venice.ai/api/v1` adresindedir. Ağınızın HTTPS bağlantılarına izin verdiğinden emin olun.
  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Yapılandırma dosyası örneği">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Venice AI ana sayfası ve hesap kaydı.
  </Card>
  <Card title="API dokümantasyonu" href="https://docs.venice.ai" icon="book">
    Venice API başvurusu ve geliştirici dokümanları.
  </Card>
  <Card title="Fiyatlandırma" href="https://venice.ai/pricing" icon="credit-card">
    Güncel Venice kredi oranları ve planları.
  </Card>
</CardGroup>
