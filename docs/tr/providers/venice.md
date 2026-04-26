---
read_when:
    - OpenClaw'da gizlilik odaklı çıkarım kullanmak istiyorsunuz
    - Venice AI kurulum rehberine ihtiyacınız var
summary: OpenClaw'da Venice AI gizlilik odaklı modellerini kullanın
title: Venice AI
x-i18n:
    generated_at: "2026-04-26T11:39:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8396d17485b96262e352449d1524c2b8a8457edcdb92b0d0d6520d1032f8287
    source_path: providers/venice.md
    workflow: 15
---

Venice AI, sansürsüz modellere destek ve anonimleştirilmiş proxy üzerinden
başlıca özel modellere erişim sunan **gizlilik odaklı AI çıkarımı** sağlar. Tüm
çıkarım varsayılan olarak özeldir — verileriniz üzerinde eğitim yok, günlükleme yok.

## OpenClaw'da neden Venice

- Açık kaynak modeller için **özel çıkarım** (günlükleme yok).
- Gerektiğinde **sansürsüz modeller**.
- Kalitenin önemli olduğu durumlarda özel modellere (Opus/GPT/Gemini) **anonimleştirilmiş erişim**.
- OpenAI uyumlu `/v1` uç noktaları.

## Gizlilik modları

Venice iki gizlilik düzeyi sunar — bunu anlamak modelinizi seçmek için kritiktir:

| Mod            | Açıklama                                                                                                                           | Modeller                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Private**    | Tamamen özel. İstemler/yanıtlar **asla depolanmaz veya günlüğe yazılmaz**. Geçicidir.                                             | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored vb.   |
| **Anonymized** | Venice üzerinden metadata temizlenerek proxy'lenir. Alttaki sağlayıcı (OpenAI, Anthropic, Google, xAI) anonimleştirilmiş istekleri görür. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Anonimleştirilmiş modeller tamamen özel **değildir**. Venice iletmeden önce
metadata'yı temizler, ancak alttaki sağlayıcı (OpenAI, Anthropic, Google, xAI)
isteği yine de işler. Tam gizlilik gerekiyorsa **Private** modelleri seçin.
</Warning>

## Özellikler

- **Gizlilik odaklı**: "private" (tamamen özel) ve "anonymized" (proxy üzerinden) modları arasında seçim yapın
- **Sansürsüz modeller**: İçerik kısıtlamaları olmayan modellere erişim
- **Büyük model erişimi**: Venice'in anonimleştirilmiş proxy'si üzerinden Claude, GPT, Gemini ve Grok kullanın
- **OpenAI uyumlu API**: Kolay entegrasyon için standart `/v1` uç noktaları
- **Akış**: Tüm modellerde desteklenir
- **Function calling**: Seçili modellerde desteklenir (model yeteneklerini kontrol edin)
- **Vision**: Vision yeteneğine sahip modellerde desteklenir
- **Kesin hız sınırları yok**: Aşırı kullanımda adil kullanım daraltması uygulanabilir

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    1. [venice.ai](https://venice.ai) adresinden kaydolun
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

        Bu işlem şunları yapar:
        1. API anahtarınızı ister (veya mevcut `VENICE_API_KEY` değerini kullanır)
        2. Kullanılabilir tüm Venice modellerini gösterir
        3. Varsayılan modelinizi seçmenizi sağlar
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

Kurulumdan sonra OpenClaw kullanılabilir tüm Venice modellerini gösterir. İhtiyacınıza göre seçin:

- **Varsayılan model**: Güçlü özel akıl yürütme ve vision için `venice/kimi-k2-5`.
- **Yüksek yetenek seçeneği**: En güçlü anonimleştirilmiş Venice yolu için `venice/claude-opus-4-6`.
- **Gizlilik**: Tamamen özel çıkarım için "private" modelleri seçin.
- **Yetenek**: Venice'in proxy'si üzerinden Claude, GPT, Gemini erişimi için "anonymized" modelleri seçin.

Varsayılan modelinizi istediğiniz zaman değiştirin:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Kullanılabilir tüm modelleri listeleyin:

```bash
openclaw models list | grep venice
```

Ayrıca `openclaw configure` çalıştırabilir, **Model/auth** seçebilir ve **Venice AI** seçeneğini seçebilirsiniz.

<Tip>
Kullanım durumunuza uygun modeli seçmek için aşağıdaki tabloyu kullanın.

| Kullanım Durumu            | Önerilen Model                  | Neden                                        |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **Genel sohbet (varsayılan)** | `kimi-k2-5`                    | Güçlü özel akıl yürütme ve vision            |
| **Genel olarak en iyi kalite** | `claude-opus-4-6`             | En güçlü anonimleştirilmiş Venice seçeneği   |
| **Gizlilik + kodlama**     | `qwen3-coder-480b-a35b-instruct` | Geniş bağlamlı özel kodlama modeli           |
| **Özel vision**            | `kimi-k2-5`                      | Özel moddan çıkmadan Vision desteği          |
| **Hızlı + ucuz**           | `qwen3-4b`                       | Hafif akıl yürütme modeli                    |
| **Karmaşık özel görevler** | `deepseek-v3.2`                  | Güçlü akıl yürütme, ancak Venice araç desteği yok |
| **Sansürsüz**              | `venice-uncensored`              | İçerik kısıtlaması yok                       |

</Tip>

## DeepSeek V4 yeniden oynatma davranışı

Venice, `venice/deepseek-v4-pro` veya
`venice/deepseek-v4-flash` gibi DeepSeek V4 modellerini sunuyorsa,
proxy bunu atladığında OpenClaw, asistan araç çağrısı dönüşlerinde gerekli
DeepSeek V4 `reasoning_content` yeniden oynatma yer tutucusunu doldurur. Venice,
DeepSeek'in yerel üst düzey `thinking` denetimini reddeder; bu nedenle
OpenClaw, sağlayıcıya özgü bu yeniden oynatma düzeltmesini yerel
DeepSeek sağlayıcısının thinking denetimlerinden ayrı tutar.

## Yerleşik katalog (toplam 41)

<AccordionGroup>
  <Accordion title="Private modeller (26) — tamamen özel, günlükleme yok">
    | Model ID                               | Adı                                 | Bağlam  | Özellikler                |
    | -------------------------------------- | ----------------------------------- | ------- | ------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | Varsayılan, akıl yürütme, vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Akıl yürütme              |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | Genel                     |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | Genel                     |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k    | Genel, araçlar devre dışı |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k    | Akıl yürütme              |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k    | Genel                     |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k    | Kodlama                   |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k    | Kodlama                   |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k    | Akıl yürütme, vision      |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k    | Genel                     |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k    | Vision                    |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k     | Hızlı, akıl yürütme       |
    | `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k    | Akıl yürütme, araçlar devre dışı |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Sansürsüz, araçlar devre dışı |
    | `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k    | Vision                    |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k    | Vision                    |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k    | Genel                     |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k    | Genel                     |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k    | Akıl yürütme              |
    | `zai-org-glm-4.6`                      | GLM 4.6                             | 198k    | Genel                     |
    | `zai-org-glm-4.7`                      | GLM 4.7                             | 198k    | Akıl yürütme              |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k    | Akıl yürütme              |
    | `zai-org-glm-5`                        | GLM 5                               | 198k    | Akıl yürütme              |
    | `minimax-m21`                          | MiniMax M2.1                        | 198k    | Akıl yürütme              |
    | `minimax-m25`                          | MiniMax M2.5                        | 198k    | Akıl yürütme              |
  </Accordion>

  <Accordion title="Anonymized modeller (15) — Venice proxy üzerinden">
    | Model ID                        | Adı                            | Bağlam  | Özellikler                |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (Venice üzerinden)   | 1M      | Akıl yürütme, vision      |
    | `claude-opus-4-5`               | Claude Opus 4.5 (Venice üzerinden)   | 198k    | Akıl yürütme, vision      |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (Venice üzerinden) | 1M      | Akıl yürütme, vision      |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (Venice üzerinden) | 198k    | Akıl yürütme, vision      |
    | `openai-gpt-54`                 | GPT-5.4 (Venice üzerinden)           | 1M      | Akıl yürütme, vision      |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (Venice üzerinden)     | 400k    | Akıl yürütme, vision, kodlama |
    | `openai-gpt-52`                 | GPT-5.2 (Venice üzerinden)           | 256k    | Akıl yürütme              |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (Venice üzerinden)     | 256k    | Akıl yürütme, vision, kodlama |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (Venice üzerinden)            | 128k    | Vision                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (Venice üzerinden)       | 128k    | Vision                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (Venice üzerinden)    | 1M      | Akıl yürütme, vision      |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (Venice üzerinden)      | 198k    | Akıl yürütme, vision      |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (Venice üzerinden)    | 256k    | Akıl yürütme, vision      |
    | `grok-41-fast`                  | Grok 4.1 Fast (Venice üzerinden)     | 1M      | Akıl yürütme, vision      |
    | `grok-code-fast-1`              | Grok Code Fast 1 (Venice üzerinden)  | 256k    | Akıl yürütme, kodlama     |
  </Accordion>
</AccordionGroup>

## Model keşfi

OpenClaw, `VENICE_API_KEY` ayarlı olduğunda Venice API'den modelleri otomatik
olarak keşfeder. API'ye ulaşılamazsa statik bir kataloğa geri döner.

`/models` uç noktası herkese açıktır (listeleme için auth gerekmez), ancak
çıkarım için geçerli bir API anahtarı gerekir.

## Akış ve araç desteği

| Özellik             | Destek                                               |
| ------------------- | ---------------------------------------------------- |
| **Akış**            | Tüm modeller                                         |
| **Function calling** | Çoğu model (API'de `supportsFunctionCalling` kontrol edin) |
| **Vision/Görseller** | "Vision" özelliğiyle işaretlenmiş modeller          |
| **JSON modu**       | `response_format` üzerinden desteklenir              |

## Fiyatlandırma

Venice kredi tabanlı bir sistem kullanır. Güncel ücretler için [venice.ai/pricing](https://venice.ai/pricing) sayfasını kontrol edin:

- **Private modeller**: Genellikle daha düşük maliyet
- **Anonymized modeller**: Doğrudan API fiyatlandırmasına benzer + küçük Venice ücreti

### Venice (anonimleştirilmiş) ve doğrudan API karşılaştırması

| Boyut         | Venice (Anonymized)            | Doğrudan API        |
| ------------- | ------------------------------ | ------------------- |
| **Gizlilik**  | Metadata temizlenir, anonimleştirilir | Hesabınız bağlantılı |
| **Gecikme**   | +10-50ms (proxy)               | Doğrudan            |
| **Özellikler** | Özelliklerin çoğu desteklenir | Tüm özellikler      |
| **Faturalama** | Venice kredileri              | Sağlayıcı faturalaması |

## Kullanım örnekleri

```bash
# Varsayılan özel modeli kullan
openclaw agent --model venice/kimi-k2-5 --message "Hızlı sağlık kontrolü"

# Venice üzerinden Claude Opus kullan (anonimleştirilmiş)
openclaw agent --model venice/claude-opus-4-6 --message "Bu görevi özetle"

# Sansürsüz model kullan
openclaw agent --model venice/venice-uncensored --message "Seçenekleri taslak olarak çıkar"

# Görselle vision modeli kullan
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Ekli görseli incele"

# Kodlama modeli kullan
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
    Venice model kataloğu dinamik olarak güncellenir. Şu anda kullanılabilir modelleri görmek için `openclaw models list` çalıştırın. Bazı modeller geçici olarak çevrimdışı olabilir.
  </Accordion>

  <Accordion title="Bağlantı sorunları">
    Venice API adresi `https://api.venice.ai/api/v1` şeklindedir. Ağınızın HTTPS bağlantılarına izin verdiğinden emin olun.
  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Troubleshooting](/tr/help/troubleshooting) ve [FAQ](/tr/help/faq).
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
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
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
