---
read_when:
    - OpenClaw'da gizlilik odaklı çıkarım istiyorsunuz
    - Venice AI kurulum rehberi istiyorsunuz
summary: OpenClaw'da Venice AI gizlilik odaklı modellerini kullanın
title: Venice AI
x-i18n:
    generated_at: "2026-04-05T14:05:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53313e45e197880feb7e90764ee8fd6bb7f5fd4fe03af46b594201c77fbc8eab
    source_path: providers/venice.md
    workflow: 15
---

# Venice AI (Venice öne çıkan)

**Venice**, isteğe bağlı anonimleştirilmiş sahipli modellere erişim ile gizlilik öncelikli çıkarım için öne çıkan Venice kurulumumuzdur.

Venice AI, sansürsüz modeller desteği ve anonimleştirilmiş proxy üzerinden büyük sahipli modellere erişim ile gizlilik odaklı AI çıkarımı sağlar. Tüm çıkarımlar varsayılan olarak gizlidir — verileriniz üzerinde eğitim yapılmaz, günlük tutulmaz.

## OpenClaw'da neden Venice

- Açık kaynak modeller için **özel çıkarım** (günlük tutulmaz).
- İhtiyaç duyduğunuzda **sansürsüz modeller**.
- Kalite önemli olduğunda sahipli modellere **anonimleştirilmiş erişim** (Opus/GPT/Gemini).
- OpenAI uyumlu `/v1` uç noktaları.

## Gizlilik Modları

Venice iki gizlilik düzeyi sunar — modelinizi seçmek için bunu anlamak önemlidir:

| Mod            | Açıklama                                                                                                                          | Modeller                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Özel**       | Tamamen özeldir. İstemler/yanıtlar **asla saklanmaz veya günlüğe kaydedilmez**. Geçicidir.                                       | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored vb.   |
| **Anonimleştirilmiş** | Metadata ayıklanmış olarak Venice üzerinden proxy'lenir. Temel sağlayıcı (OpenAI, Anthropic, Google, xAI) anonimleştirilmiş istekleri görür. | Claude, GPT, Gemini, Grok                                     |

## Özellikler

- **Gizlilik odaklı**: "özel" (tamamen özel) ve "anonimleştirilmiş" (proxy'lenmiş) modlar arasında seçim yapın
- **Sansürsüz modeller**: İçerik kısıtlamaları olmayan modellere erişim
- **Büyük modellere erişim**: Claude, GPT, Gemini ve Grok'u Venice'in anonimleştirilmiş proxy'si üzerinden kullanın
- **OpenAI uyumlu API**: Kolay entegrasyon için standart `/v1` uç noktaları
- **Akış**: ✅ Tüm modellerde desteklenir
- **Fonksiyon çağırma**: ✅ Seçili modellerde desteklenir (model yeteneklerini kontrol edin)
- **Görsel**: ✅ Görsel yeteneği olan modellerde desteklenir
- **Katı hız sınırı yok**: Aşırı kullanımda adil kullanım yavaşlatması uygulanabilir

## Kurulum

### 1. API anahtarı alın

1. [venice.ai](https://venice.ai) adresinde kaydolun
2. **Settings → API Keys → Create new key** bölümüne gidin
3. API anahtarınızı kopyalayın (biçim: `vapi_xxxxxxxxxxxx`)

### 2. OpenClaw'ı yapılandırın

**Seçenek A: Ortam Değişkeni**

```bash
export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
```

**Seçenek B: Etkileşimli Kurulum (Önerilen)**

```bash
openclaw onboard --auth-choice venice-api-key
```

Bu işlem şunları yapar:

1. API anahtarınızı ister (veya mevcut `VENICE_API_KEY` değerini kullanır)
2. Kullanılabilir tüm Venice modellerini gösterir
3. Varsayılan modelinizi seçmenize izin verir
4. Sağlayıcıyı otomatik olarak yapılandırır

**Seçenek C: Etkileşimsiz**

```bash
openclaw onboard --non-interactive \
  --auth-choice venice-api-key \
  --venice-api-key "vapi_xxxxxxxxxxxx"
```

### 3. Kurulumu doğrulayın

```bash
openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
```

## Model Seçimi

Kurulumdan sonra OpenClaw kullanılabilir tüm Venice modellerini gösterir. İhtiyaçlarınıza göre seçim yapın:

- **Varsayılan model**: Güçlü özel akıl yürütme ve görsel için `venice/kimi-k2-5`.
- **Yüksek yetenekli seçenek**: En güçlü anonimleştirilmiş Venice yolu için `venice/claude-opus-4-6`.
- **Gizlilik**: Tamamen özel çıkarım için "özel" modelleri seçin.
- **Yetenek**: Venice'in proxy'si üzerinden Claude, GPT, Gemini erişimi için "anonimleştirilmiş" modelleri seçin.

Varsayılan modelinizi istediğiniz zaman değiştirin:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Kullanılabilir tüm modelleri listeleyin:

```bash
openclaw models list | grep venice
```

## `openclaw configure` ile yapılandırın

1. `openclaw configure` çalıştırın
2. **Model/auth** seçin
3. **Venice AI** seçin

## Hangi modeli kullanmalıyım?

| Kullanım Durumu            | Önerilen Model                   | Neden                                        |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **Genel sohbet (varsayılan)** | `kimi-k2-5`                   | Güçlü özel akıl yürütme ve görsel            |
| **Genel olarak en iyi kalite** | `claude-opus-4-6`            | En güçlü anonimleştirilmiş Venice seçeneği   |
| **Gizlilik + kodlama**     | `qwen3-coder-480b-a35b-instruct` | Geniş bağlamlı özel kodlama modeli           |
| **Özel görsel**            | `kimi-k2-5`                      | Özel moddan çıkmadan görsel desteği          |
| **Hızlı + ucuz**           | `qwen3-4b`                       | Hafif akıl yürütme modeli                    |
| **Karmaşık özel görevler** | `deepseek-v3.2`                  | Güçlü akıl yürütme, ancak Venice araç desteği yok |
| **Sansürsüz**              | `venice-uncensored`              | İçerik kısıtlaması yok                       |

## Kullanılabilir Modeller (Toplam 41)

### Özel Modeller (26) - Tamamen Özel, Günlük Yok

| Model Kimliği                          | Ad                                  | Bağlam  | Özellikler                |
| -------------------------------------- | ----------------------------------- | ------- | ------------------------- |
| `kimi-k2-5`                            | Kimi K2.5                           | 256k    | Varsayılan, akıl yürütme, görsel |
| `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Akıl yürütme              |
| `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | Genel                     |
| `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | Genel                     |
| `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k    | Genel, araçlar devre dışı |
| `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k    | Akıl yürütme              |
| `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k    | Genel                     |
| `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k    | Kodlama                   |
| `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k    | Kodlama                   |
| `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k    | Akıl yürütme, görsel      |
| `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k    | Genel                     |
| `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Görsel)              | 256k    | Görsel                    |
| `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k     | Hızlı, akıl yürütme       |
| `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k    | Akıl yürütme, araçlar devre dışı |
| `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Sansürsüz, araçlar devre dışı |
| `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k    | Görsel                    |
| `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k    | Görsel                    |
| `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k    | Genel                     |
| `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k    | Genel                     |
| `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k    | Akıl yürütme              |
| `zai-org-glm-4.6`                      | GLM 4.6                             | 198k    | Genel                     |
| `zai-org-glm-4.7`                      | GLM 4.7                             | 198k    | Akıl yürütme              |
| `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k    | Akıl yürütme              |
| `zai-org-glm-5`                        | GLM 5                               | 198k    | Akıl yürütme              |
| `minimax-m21`                          | MiniMax M2.1                        | 198k    | Akıl yürütme              |
| `minimax-m25`                          | MiniMax M2.5                        | 198k    | Akıl yürütme              |

### Anonimleştirilmiş Modeller (15) - Venice Proxy Üzerinden

| Model Kimliği                   | Ad                             | Bağlam  | Özellikler                |
| ------------------------------- | ------------------------------ | ------- | ------------------------- |
| `claude-opus-4-6`               | Claude Opus 4.6 (Venice üzerinden)   | 1M      | Akıl yürütme, görsel      |
| `claude-opus-4-5`               | Claude Opus 4.5 (Venice üzerinden)   | 198k    | Akıl yürütme, görsel      |
| `claude-sonnet-4-6`             | Claude Sonnet 4.6 (Venice üzerinden) | 1M      | Akıl yürütme, görsel      |
| `claude-sonnet-4-5`             | Claude Sonnet 4.5 (Venice üzerinden) | 198k    | Akıl yürütme, görsel      |
| `openai-gpt-54`                 | GPT-5.4 (Venice üzerinden)           | 1M      | Akıl yürütme, görsel      |
| `openai-gpt-53-codex`           | GPT-5.3 Codex (Venice üzerinden)     | 400k    | Akıl yürütme, görsel, kodlama |
| `openai-gpt-52`                 | GPT-5.2 (Venice üzerinden)           | 256k    | Akıl yürütme              |
| `openai-gpt-52-codex`           | GPT-5.2 Codex (Venice üzerinden)     | 256k    | Akıl yürütme, görsel, kodlama |
| `openai-gpt-4o-2024-11-20`      | GPT-4o (Venice üzerinden)            | 128k    | Görsel                    |
| `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (Venice üzerinden)       | 128k    | Görsel                    |
| `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (Venice üzerinden)    | 1M      | Akıl yürütme, görsel      |
| `gemini-3-pro-preview`          | Gemini 3 Pro (Venice üzerinden)      | 198k    | Akıl yürütme, görsel      |
| `gemini-3-flash-preview`        | Gemini 3 Flash (Venice üzerinden)    | 256k    | Akıl yürütme, görsel      |
| `grok-41-fast`                  | Grok 4.1 Fast (Venice üzerinden)     | 1M      | Akıl yürütme, görsel      |
| `grok-code-fast-1`              | Grok Code Fast 1 (Venice üzerinden)  | 256k    | Akıl yürütme, kodlama     |

## Model Keşfi

`VENICE_API_KEY` ayarlandığında OpenClaw, Venice API'den modelleri otomatik olarak keşfeder. API'ye ulaşılamazsa statik bir kataloğa geri döner.

`/models` uç noktası herkese açıktır (listeleme için kimlik doğrulama gerekmez), ancak çıkarım için geçerli bir API anahtarı gerekir.

## Akış ve Araç Desteği

| Özellik              | Destek                                                  |
| -------------------- | ------------------------------------------------------- |
| **Akış**             | ✅ Tüm modeller                                         |
| **Fonksiyon çağırma** | ✅ Çoğu model (`supportsFunctionCalling` değerini API'de kontrol edin) |
| **Görsel/Resimler**  | ✅ "Vision" özelliğiyle işaretlenen modeller            |
| **JSON modu**        | ✅ `response_format` üzerinden desteklenir              |

## Fiyatlandırma

Venice kredi tabanlı bir sistem kullanır. Güncel fiyatlar için [venice.ai/pricing](https://venice.ai/pricing) sayfasını kontrol edin:

- **Özel modeller**: Genellikle daha düşük maliyet
- **Anonimleştirilmiş modeller**: Doğrudan API fiyatlandırmasına benzer + küçük bir Venice ücreti

## Karşılaştırma: Venice ve Doğrudan API

| Yön          | Venice (Anonimleştirilmiş)      | Doğrudan API       |
| ------------ | ------------------------------- | ------------------ |
| **Gizlilik** | Metadata ayıklanır, anonimleştirilir | Hesabınız bağlanır |
| **Gecikme**  | +10-50 ms (proxy)               | Doğrudan           |
| **Özellikler** | Çoğu özellik desteklenir      | Tüm özellikler     |
| **Faturalandırma** | Venice kredileri         | Sağlayıcı faturalandırması |

## Kullanım Örnekleri

```bash
# Varsayılan özel modeli kullan
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Venice üzerinden Claude Opus kullan (anonimleştirilmiş)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Sansürsüz model kullan
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Görselli modeli görselle kullan
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Kodlama modeli kullan
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Sorun Giderme

### API anahtarı tanınmıyor

```bash
echo $VENICE_API_KEY
openclaw models list | grep venice
```

Anahtarın `vapi_` ile başladığından emin olun.

### Model kullanılamıyor

Venice model kataloğu dinamik olarak güncellenir. O anda kullanılabilen modelleri görmek için `openclaw models list` çalıştırın. Bazı modeller geçici olarak çevrimdışı olabilir.

### Bağlantı sorunları

Venice API `https://api.venice.ai/api/v1` adresindedir. Ağınızın HTTPS bağlantılarına izin verdiğinden emin olun.

## Yapılandırma dosyası örneği

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

## Bağlantılar

- [Venice AI](https://venice.ai)
- [API Belgeleri](https://docs.venice.ai)
- [Fiyatlandırma](https://venice.ai/pricing)
- [Durum](https://status.venice.ai)
