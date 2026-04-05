---
read_when:
    - OpenClaw ile Volcano Engine veya Doubao modellerini kullanmak istiyorsunuz
    - Volcengine API anahtarı kurulumuna ihtiyacınız var
summary: Volcano Engine kurulumu (Doubao modelleri, genel + kodlama uç noktaları)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-05T14:05:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85d9e737e906cd705fb31479d6b78d92b68c9218795ea9667516c1571dcaaf3a
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Volcengine sağlayıcısı, Volcano Engine üzerinde barındırılan Doubao modellerine ve üçüncü taraf modellere erişim sağlar; genel ve kodlama iş yükleri için ayrı uç noktalar sunar.

- Sağlayıcılar: `volcengine` (genel) + `volcengine-plan` (kodlama)
- Kimlik doğrulama: `VOLCANO_ENGINE_API_KEY`
- API: OpenAI uyumlu

## Hızlı başlangıç

1. API anahtarını ayarlayın:

```bash
openclaw onboard --auth-choice volcengine-api-key
```

2. Varsayılan bir model ayarlayın:

```json5
{
  agents: {
    defaults: {
      model: { primary: "volcengine-plan/ark-code-latest" },
    },
  },
}
```

## Etkileşimsiz örnek

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

## Sağlayıcılar ve uç noktalar

| Sağlayıcı        | Uç nokta                                  | Kullanım durumu |
| ---------------- | ----------------------------------------- | --------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Genel modeller  |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Kodlama modelleri |

Her iki sağlayıcı da tek bir API anahtarından yapılandırılır. Kurulum her ikisini de otomatik olarak kaydeder.

## Kullanılabilir modeller

Genel sağlayıcı (`volcengine`):

| Model ref                                    | Ad                              | Girdi       | Bağlam  |
| -------------------------------------------- | ------------------------------- | ----------- | ------- |
| `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | metin, görsel | 256,000 |
| `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | metin, görsel | 256,000 |
| `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | metin, görsel | 256,000 |
| `volcengine/glm-4-7-251222`                  | GLM 4.7                         | metin, görsel | 200,000 |
| `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | metin, görsel | 128,000 |

Kodlama sağlayıcısı (`volcengine-plan`):

| Model ref                                         | Ad                       | Girdi | Bağlam  |
| ------------------------------------------------- | ------------------------ | ----- | ------- |
| `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | metin | 256,000 |
| `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | metin | 256,000 |
| `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | metin | 200,000 |
| `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | metin | 256,000 |
| `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | metin | 256,000 |
| `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | metin | 256,000 |

`openclaw onboard --auth-choice volcengine-api-key` şu anda varsayılan model olarak `volcengine-plan/ark-code-latest` ayarlarken genel `volcengine` kataloğunu da kaydeder.

İlk kurulum/model yapılandırma seçimi sırasında Volcengine kimlik doğrulama seçeneği hem `volcengine/*` hem de `volcengine-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse OpenClaw, boş bir sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş kataloğa geri döner.

## Ortam notu

Gateway bir daemon olarak çalışıyorsa (launchd/systemd), `VOLCANO_ENGINE_API_KEY` değerinin bu süreç için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` üzerinden).
