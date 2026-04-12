---
read_when:
    - OpenClaw'da gizlilik odaklı çıkarım istiyorsunuz
    - Venice AI kurulum rehberliği istiyorsunuz
summary: OpenClaw'da gizlilik odaklı Venice AI modellerini kullanın
title: Venice AI
x-i18n:
    generated_at: "2026-04-12T23:33:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f8005edb1d7781316ce8b5432bf4f9375c16113594a2a588912dce82234a9e5
    source_path: providers/venice.md
    workflow: 15
---

# Venice AI

Venice AI, sansürsüz modeller desteği ve kendi anonimleştirilmiş proxy'si üzerinden büyük özel modellere erişim ile **gizlilik odaklı AI çıkarımı** sağlar. Tüm çıkarımlar varsayılan olarak özeldir — verileriniz üzerinde eğitim yok, günlükleme yok.

## OpenClaw içinde neden Venice

- Açık kaynak modeller için **özel çıkarım** (günlükleme yok).
- İhtiyacınız olduğunda **sansürsüz modeller**.
- Kalite önemli olduğunda özel modellere (Opus/GPT/Gemini) **anonimleştirilmiş erişim**.
- OpenAI uyumlu `/v1` uç noktaları.

## Gizlilik modları

Venice iki gizlilik düzeyi sunar — bunu anlamak, modelinizi seçmek için kritiktir:

| Mod            | Açıklama                                                                                                                       | Modeller                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Özel**       | Tamamen özel. İstemler/yanıtlar **asla depolanmaz veya günlüğe kaydedilmez**. Geçicidir.                                        | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored vb.   |
| **Anonimleştirilmiş** | Venice üzerinden metadata ayıklanarak proxy'lenir. Alttaki sağlayıcı (OpenAI, Anthropic, Google, xAI) anonimleştirilmiş istekleri görür. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Anonimleştirilmiş modeller tamamen özel **değildir**. Venice iletmeden önce metadata'yı ayıklar, ancak alttaki sağlayıcı (OpenAI, Anthropic, Google, xAI) yine de isteği işler. Tam gizlilik gerektiğinde **Özel** modelleri seçin.
</Warning>

## Özellikler

- **Gizlilik odaklı**: "özel" (tamamen özel) ve "anonimleştirilmiş" (proxy'lenmiş) modlar arasında seçim yapın
- **Sansürsüz modeller**: İçerik kısıtlaması olmayan modellere erişim
- **Büyük model erişimi**: Venice'in anonimleştirilmiş proxy'si üzerinden Claude, GPT, Gemini ve Grok kullanın
- **OpenAI uyumlu API**: Kolay entegrasyon için standart `/v1` uç noktaları
- **Akış**: Tüm modellerde desteklenir
- **Function calling**: Seçili modellerde desteklenir (model yeteneklerini kontrol edin)
- **Vision**: Vision yeteneği olan modellerde desteklenir
- **Katı hız sınırı yok**: Aşırı kullanımda adil kullanım kısıtlaması uygulanabilir

## Başlangıç

<Steps>
  <Step title="API anahtarınızı alın">
    1. [venice.ai](https://venice.ai) üzerinde kaydolun
    2. **Settings > API Keys > Create new key** bölümüne gidin
    3. API anahtarınızı kopyalayın (biçim: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="OpenClaw yapılandırın">
    Tercih ettiğiniz kurulum yöntemini seçin:

    <Tabs>
      <Tab title="Etkileşimli (önerilen)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Bu işlem:
        1. API anahtarınızı ister (veya mevcut `VENICE_API_KEY` değerini kullanır)
        2. Kullanılabilir tüm Venice modellerini gösterir
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
    openclaw agent --model venice/kimi-k2-5 --message "Merhaba, çalışıyor musun?"
    ```
  </Step>
</Steps>

## Model seçimi

Kurulumdan sonra OpenClaw, kullanılabilir tüm Venice modellerini gösterir. İhtiyaçlarınıza göre seçin:

- **Varsayılan model**: güçlü özel akıl yürütme ve vision için `venice/kimi-k2-5`.
- **Yüksek yetenek seçeneği**: en güçlü anonimleştirilmiş Venice yolu için `venice/claude-opus-4-6`.
- **Gizlilik**: tamamen özel çıkarım için "özel" modelleri seçin.
- **Yetenek**: Venice proxy'si üzerinden Claude, GPT, Gemini'ye erişmek için "anonimleştirilmiş" modelleri seçin.

Varsayılan modelinizi istediğiniz zaman değiştirin:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Kullanılabilir tüm modelleri listeleyin:

```bash
openclaw models list | grep venice
```

Ayrıca `openclaw configure` komutunu çalıştırabilir, **Model/auth** seçebilir ve **Venice AI** seçeneğini seçebilirsiniz.

<Tip>
Kullanım durumunuza uygun modeli seçmek için aşağıdaki tabloyu kullanın.

| Kullanım Durumu            | Önerilen Model                   | Neden                                        |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **Genel sohbet (varsayılan)** | `kimi-k2-5`                   | Güçlü özel akıl yürütme ve vision            |
| **En iyi genel kalite**    | `claude-opus-4-6`                | En güçlü anonimleştirilmiş Venice seçeneği   |
| **Gizlilik + kodlama**     | `qwen3-coder-480b-a35b-instruct` | Geniş bağlama sahip özel kodlama modeli      |
| **Özel vision**            | `kimi-k2-5`                      | Özel moddan çıkmadan vision desteği          |
| **Hızlı + ucuz**           | `qwen3-4b`                       | Hafif akıl yürütme modeli                    |
| **Karmaşık özel görevler** | `deepseek-v3.2`                  | Güçlü akıl yürütme, ancak Venice araç desteği yok |
| **Sansürsüz**              | `venice-uncensored`              | İçerik kısıtlaması yok                       |

</Tip>

## Kullanılabilir modeller (toplam 41)

<AccordionGroup>
  <Accordion title="Özel modeller (26) — tamamen özel, günlükleme yok">
    | Model ID                               | Ad                                  | Bağlam | Özellikler                 |
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

  <Accordion title="Anonimleştirilmiş modeller (15) — Venice proxy üzerinden">
    | Model ID                        | Ad                               | Bağlam | Özellikler                |
    | ------------------------------- | -------------------------------- | ------ | ------------------------- |
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

## Model bulma

`VENICE_API_KEY` ayarlı olduğunda OpenClaw modelleri Venice API'den otomatik olarak bulur. API'ye ulaşılamazsa statik bir kataloğa geri döner.

`/models` uç noktası herkese açıktır (listeleme için kimlik doğrulama gerekmez), ancak çıkarım için geçerli bir API anahtarı gerekir.

## Akış ve araç desteği

| Özellik             | Destek                                              |
| ------------------- | --------------------------------------------------- |
| **Akış**            | Tüm modeller                                        |
| **Function calling** | Çoğu model (`supportsFunctionCalling` değerini API'de kontrol edin) |
| **Vision/Görüntüler** | "Vision" özelliğiyle işaretlenmiş modeller        |
| **JSON modu**       | `response_format` aracılığıyla desteklenir          |

## Fiyatlandırma

Venice kredi tabanlı bir sistem kullanır. Güncel oranlar için [venice.ai/pricing](https://venice.ai/pricing) sayfasına bakın:

- **Özel modeller**: Genellikle daha düşük maliyet
- **Anonimleştirilmiş modeller**: Doğrudan API fiyatlandırmasına benzer + küçük Venice ücreti

### Venice (anonimleştirilmiş) ile doğrudan API karşılaştırması

| Aspect       | Venice (Anonymized)           | Direct API            |
| ------------ | ----------------------------- | --------------------- |
| **Gizlilik** | Metadata ayıklanır, anonimleştirilir | Hesabınız bağlantılı |
| **Gecikme**  | +10-50ms (proxy)              | Doğrudan              |
| **Özellikler** | Çoğu özellik desteklenir    | Tüm özellikler        |
| **Faturalandırma** | Venice kredileri         | Sağlayıcı faturalandırması |

## Kullanım örnekleri

```bash
# Varsayılan özel modeli kullan
openclaw agent --model venice/kimi-k2-5 --message "Hızlı sağlık denetimi"

# Claude Opus'u Venice üzerinden kullan (anonimleştirilmiş)
openclaw agent --model venice/claude-opus-4-6 --message "Bu görevi özetle"

# Sansürsüz modeli kullan
openclaw agent --model venice/venice-uncensored --message "Seçenek taslakları hazırla"

# Görselli modeli görüntüyle kullan
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Ekli görüntüyü incele"

# Kodlama modelini kullan
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Bu fonksiyonu yeniden düzenle"
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
    Venice model kataloğu dinamik olarak güncellenir. O anda kullanılabilir modelleri görmek için `openclaw models list` çalıştırın. Bazı modeller geçici olarak çevrimdışı olabilir.
  </Accordion>

  <Accordion title="Bağlantı sorunları">
    Venice API adresi `https://api.venice.ai/api/v1` şeklindedir. Ağınızın HTTPS bağlantılarına izin verdiğinden emin olun.
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
    Sağlayıcıları, model başvurularını ve devralma davranışını seçme.
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
