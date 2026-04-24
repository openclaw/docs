---
read_when:
    - OpenClaw'da gizlilik odaklı çıkarım istiyorsunuz
    - Venice AI kurulumu için yönlendirme istiyorsunuz
summary: OpenClaw'da Venice AI gizlilik odaklı modellerini kullanın
title: Venice AI
x-i18n:
    generated_at: "2026-04-24T09:28:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab50c76ce33bd67d51bd897ac574e08d4e4e394470bed9fe686758ce39aded91
    source_path: providers/venice.md
    workflow: 15
---

Venice AI, **gizlilik odaklı AI çıkarımı** sunar; sansürsüz modelleri ve anonimleştirilmiş proxy üzerinden büyük tescilli modellere erişimi destekler. Tüm çıkarım varsayılan olarak özeldir — verileriniz üzerinde eğitim yapılmaz, günlük tutulmaz.

## OpenClaw'da neden Venice

- Açık kaynak modeller için **özel çıkarım** (günlük yok).
- Gerekli olduğunda **sansürsüz modeller**.
- Kalitenin önemli olduğu yerlerde tescilli modellere (Opus/GPT/Gemini) **anonimleştirilmiş erişim**.
- OpenAI uyumlu `/v1` uç noktaları.

## Gizlilik kipleri

Venice iki gizlilik düzeyi sunar — doğru modeli seçmek için bunu anlamak önemlidir:

| Kip            | Açıklama                                                                                                                        | Modeller                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Private**    | Tamamen özel. İstemler/yanıtlar **asla saklanmaz veya günlüğe alınmaz**. Geçicidir.                                             | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored vb.   |
| **Anonymized** | Venice üzerinden metadata'sı temizlenmiş şekilde proxy'lenir. Alttaki sağlayıcı (OpenAI, Anthropic, Google, xAI) anonimleştirilmiş istekleri görür. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Anonymized modeller **tamamen özel değildir**. Venice iletmeden önce metadata'yı temizler, ancak alttaki sağlayıcı (OpenAI, Anthropic, Google, xAI) yine de isteği işler. Tam gizlilik gerektiğinde **Private** modelleri seçin.
</Warning>

## Özellikler

- **Gizlilik odaklı**: "private" (tam özel) ve "anonymized" (proxy'lenmiş) kipleri arasında seçim
- **Sansürsüz modeller**: içerik kısıtları olmayan modellere erişim
- **Büyük model erişimi**: Claude, GPT, Gemini ve Grok'u Venice'in anonimleştirilmiş proxy'si üzerinden kullanma
- **OpenAI uyumlu API**: kolay entegrasyon için standart `/v1` uç noktaları
- **Akış**: tüm modellerde desteklenir
- **Function calling**: seçili modellerde desteklenir (model yeteneklerini kontrol edin)
- **Vision**: vision yeteneği olan modellerde desteklenir
- **Kesin hız sınırı yok**: aşırı kullanımda adil kullanım kısıtlaması uygulanabilir

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    1. [venice.ai](https://venice.ai) adresinde kaydolun
    2. **Settings > API Keys > Create new key** bölümüne gidin
    3. API anahtarınızı kopyalayın (biçim: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="OpenClaw'ı yapılandırın">
    Tercih ettiğiniz kurulum yöntemini seçin:

    <Tabs>
      <Tab title="Etkileşimli (önerilen)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Bu işlem:
        1. API anahtarınızı ister (veya mevcut `VENICE_API_KEY` kullanır)
        2. Mevcut tüm Venice modellerini gösterir
        3. Varsayılan modelinizi seçmenize izin verir
        4. Sağlayıcıyı otomatik olarak yapılandırır
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

Kurulumdan sonra OpenClaw kullanılabilir tüm Venice modellerini gösterir. İhtiyacınıza göre seçin:

- **Varsayılan model**: güçlü özel akıl yürütme ve vision için `venice/kimi-k2-5`.
- **Yüksek yetenek seçeneği**: en güçlü anonimleştirilmiş Venice yolu için `venice/claude-opus-4-6`.
- **Gizlilik**: tamamen özel çıkarım için "private" modelleri seçin.
- **Yetenek**: Claude, GPT, Gemini'ye Venice proxy'si üzerinden erişmek için "anonymized" modelleri seçin.

Varsayılan modelinizi istediğiniz zaman değiştirin:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Tüm kullanılabilir modelleri listeleyin:

```bash
openclaw models list | grep venice
```

Ayrıca `openclaw configure` çalıştırıp **Model/auth** seçebilir ve **Venice AI** seçebilirsiniz.

<Tip>
Kullanım durumunuz için doğru modeli seçmek üzere aşağıdaki tabloyu kullanın.

| Kullanım Durumu            | Önerilen Model                   | Neden                                         |
| -------------------------- | -------------------------------- | --------------------------------------------- |
| **Genel sohbet (varsayılan)** | `kimi-k2-5`                   | Güçlü özel akıl yürütme + vision              |
| **En iyi genel kalite**    | `claude-opus-4-6`                | En güçlü anonimleştirilmiş Venice seçeneği    |
| **Gizlilik + kodlama**     | `qwen3-coder-480b-a35b-instruct` | Geniş bağlama sahip özel kodlama modeli       |
| **Özel vision**            | `kimi-k2-5`                      | Özel kipten çıkmadan vision desteği           |
| **Hızlı + ucuz**           | `qwen3-4b`                       | Hafif akıl yürütme modeli                     |
| **Karmaşık özel görevler** | `deepseek-v3.2`                  | Güçlü akıl yürütme, ama Venice araç desteği yok |
| **Sansürsüz**              | `venice-uncensored`              | İçerik kısıtı yok                             |

</Tip>

## Yerleşik katalog (toplam 41)

<AccordionGroup>
  <Accordion title="Private modeller (26) — tam özel, günlük yok">
    | Model ID                               | Adı                                 | Bağlam | Özellikler                 |
    | -------------------------------------- | ----------------------------------- | ------ | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k   | Varsayılan, akıl yürütme, vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k   | Akıl yürütme               |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k   | Genel                      |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k   | Genel                      |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k   | Genel, araçlar devre dışı  |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k   | Akıl yürütme               |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k   | Genel                      |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k   | Kodlama                    |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k   | Kodlama                    |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k   | Akıl yürütme, vision       |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k   | Genel                      |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k   | Vision                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k    | Hızlı, akıl yürütme        |
    | `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k   | Akıl yürütme, araçlar devre dışı |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k    | Sansürsüz, araçlar devre dışı |
    | `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k   | Vision                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k   | Vision                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k   | Genel                      |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k   | Genel                      |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k   | Akıl yürütme               |
    | `zai-org-glm-4.6`                      | GLM 4.6                             | 198k   | Genel                      |
    | `zai-org-glm-4.7`                      | GLM 4.7                             | 198k   | Akıl yürütme               |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k   | Akıl yürütme               |
    | `zai-org-glm-5`                        | GLM 5                               | 198k   | Akıl yürütme               |
    | `minimax-m21`                          | MiniMax M2.1                        | 198k   | Akıl yürütme               |
    | `minimax-m25`                          | MiniMax M2.5                        | 198k   | Akıl yürütme               |
  </Accordion>

  <Accordion title="Anonymized modeller (15) — Venice proxy üzerinden">
    | Model ID                        | Adı                            | Bağlam | Özellikler                |
    | ------------------------------- | ------------------------------ | ------ | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (Venice üzerinden)   | 1M     | Akıl yürütme, vision      |
    | `claude-opus-4-5`               | Claude Opus 4.5 (Venice üzerinden)   | 198k   | Akıl yürütme, vision      |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (Venice üzerinden) | 1M     | Akıl yürütme, vision      |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (Venice üzerinden) | 198k   | Akıl yürütme, vision      |
    | `openai-gpt-54`                 | GPT-5.4 (Venice üzerinden)           | 1M     | Akıl yürütme, vision      |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (Venice üzerinden)     | 400k   | Akıl yürütme, vision, kodlama |
    | `openai-gpt-52`                 | GPT-5.2 (Venice üzerinden)           | 256k   | Akıl yürütme              |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (Venice üzerinden)     | 256k   | Akıl yürütme, vision, kodlama |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (Venice üzerinden)            | 128k   | Vision                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (Venice üzerinden)       | 128k   | Vision                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (Venice üzerinden)    | 1M     | Akıl yürütme, vision      |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (Venice üzerinden)      | 198k   | Akıl yürütme, vision      |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (Venice üzerinden)    | 256k   | Akıl yürütme, vision      |
    | `grok-41-fast`                  | Grok 4.1 Fast (Venice üzerinden)     | 1M     | Akıl yürütme, vision      |
    | `grok-code-fast-1`              | Grok Code Fast 1 (Venice üzerinden)  | 256k   | Akıl yürütme, kodlama     |
  </Accordion>
</AccordionGroup>

## Model keşfi

OpenClaw, `VENICE_API_KEY` ayarlandığında modelleri Venice API'den otomatik olarak keşfeder. API'ye ulaşılamazsa sabit bir kataloğa geri düşer.

`/models` uç noktası herkese açıktır (listeleme için kimlik doğrulama gerekmez), ancak çıkarım için geçerli bir API anahtarı gerekir.

## Akış ve araç desteği

| Özellik              | Destek                                              |
| -------------------- | --------------------------------------------------- |
| **Akış**             | Tüm modeller                                        |
| **Function calling** | Çoğu model (API içindeki `supportsFunctionCalling` alanını kontrol edin) |
| **Vision/Images**    | "Vision" özelliğiyle işaretlenmiş modeller          |
| **JSON mode**        | `response_format` üzerinden desteklenir             |

## Fiyatlandırma

Venice kredi tabanlı bir sistem kullanır. Güncel fiyatlar için [venice.ai/pricing](https://venice.ai/pricing) sayfasına bakın:

- **Private modeller**: genellikle daha düşük maliyetlidir
- **Anonymized modeller**: doğrudan API fiyatlandırmasına benzer + küçük bir Venice ücreti

### Venice (anonymized) ve doğrudan API

| Yön         | Venice (Anonymized)              | Doğrudan API         |
| ------------ | -------------------------------- | -------------------- |
| **Gizlilik** | Metadata temizlenir, anonimleştirilir | Hesabınız bağlantılı |
| **Gecikme**  | +10-50ms (proxy)                 | Doğrudan             |
| **Özellikler** | Çoğu özellik desteklenir       | Tam özellikler       |
| **Faturalama** | Venice kredileri               | Sağlayıcı faturalaması |

## Kullanım örnekleri

```bash
# Varsayılan private modeli kullan
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Venice üzerinden Claude Opus kullan (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Sansürsüz model kullan
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Görselle vision modeli kullan
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Kodlama modeli kullan
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
    Venice model kataloğu dinamik olarak güncellenir. Şu anda kullanılabilir modelleri görmek için `openclaw models list` çalıştırın. Bazı modeller geçici olarak çevrimdışı olabilir.
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
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve devretme davranışını seçme.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Venice AI ana sayfası ve hesap kaydı.
  </Card>
  <Card title="API belgeleri" href="https://docs.venice.ai" icon="book">
    Venice API başvurusu ve geliştirici belgeleri.
  </Card>
  <Card title="Fiyatlandırma" href="https://venice.ai/pricing" icon="credit-card">
    Güncel Venice kredi ücretleri ve planları.
  </Card>
</CardGroup>
