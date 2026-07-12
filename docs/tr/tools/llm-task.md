---
read_when:
    - İş akışlarının içinde yalnızca JSON çıktısı veren bir LLM adımı istiyorsunuz
    - Otomasyon için şemaya göre doğrulanmış LLM çıktısına ihtiyacınız var
summary: İş akışları için yalnızca JSON kullanan LLM görevleri (isteğe bağlı Plugin aracı)
title: LLM görevi
x-i18n:
    generated_at: "2026-07-12T12:49:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task`, tek bir yalnızca JSON LLM çağrısı çalıştıran ve isteğe bağlı olarak bir JSON Schema'ya göre doğrulanan yapılandırılmış çıktı döndüren, paketle birlikte gelen **isteğe bağlı bir Plugin aracıdır**. Lobster gibi iş akışı motorlarına, her iş akışı için özel OpenClaw kodu gerektirmeden bir LLM adımı sağlar.

## Etkinleştirme

1. Plugin'i etkinleştirin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Araca izin verin:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`alsoAllow`, diğer çekirdek araçları kısıtlamadan etkin araç profiline `llm-task` aracını ekler. Bunun yerine yalnızca kısıtlayıcı bir izin listesi modu istiyorsanız `tools.allow` kullanın.

## Yapılandırma (isteğe bağlı)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.6-sol",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.6-sol"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels`, `provider/model` dizelerinden oluşan bir izin listesidir; diğer modeller için yapılan istekler reddedilir. Diğer tüm anahtarlar, araç çağrısının ilgili parametreyi belirtmediği durumlarda kullanılan çağrı bazlı yedek değerlerdir.

## Araç parametreleri

| Parametre       | Tür    | Notlar                                                                                                                                                             |
| --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `prompt`        | string | Zorunludur. LLM için görev talimatı.                                                                                                                                |
| `input`         | any    | İsteğe bağlı veri; JSON olarak serileştirilir ve istemin sonuna eklenir.                                                                                            |
| `schema`        | object | Ayrıştırılan çıktının doğrulanması gereken isteğe bağlı JSON Schema.                                                                                                |
| `provider`      | string | `defaultProvider` değerini / ajanın varsayılan sağlayıcısını geçersiz kılar.                                                                                        |
| `model`         | string | `defaultModel` değerini geçersiz kılar; yalın model kimliklerini, takma adları veya bir `provider/model` başvurusunu kabul eder (yinelenen sağlayıcı öneki otomatik olarak kaldırılır). |
| `thinking`      | string | Akıl yürütme düzeyi (ör. `low`, `medium`); çözümlenen modelin desteklediği düzeylerden biri olmalıdır.                                                               |
| `authProfileId` | string | `defaultAuthProfileId` değerini geçersiz kılar.                                                                                                                     |
| `temperature`   | number | Mümkün olan en iyi şekilde uygulanır; tüm sağlayıcılar bunu desteklemez.                                                                                            |
| `maxTokens`     | number | Çıktı token'ları için mümkün olan en iyi şekilde uygulanan üst sınır.                                                                                               |
| `timeoutMs`     | number | Çalıştırma zaman aşımı; varsayılan değer `30000`.                                                                                                                   |

## Çıktı

`details.json` (ayrıştırılmış ve şemaya göre doğrulanmış JSON) ile birlikte gerçekte hangi sağlayıcının ve modelin çalıştırıldığını belirten `details.provider` ve `details.model` değerlerini döndürür.

## Örnek: Lobster iş akışı adımı

### Önemli sınırlama

Aşağıdaki örnek, **bağımsız Lobster CLI**'ın `openclaw.invoke` için doğru Gateway URL'si/kimlik doğrulama bağlamının zaten bulunduğu bir ortamda çalıştığını varsayar.

OpenClaw içindeki paketle birlikte gelen **gömülü** Lobster çalıştırıcısı için bu iç içe CLI kalıbı **şu anda güvenilir değildir**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Gömülü Lobster bu akış için desteklenen bir köprüye sahip olana kadar şunlardan birini tercih edin:

- Lobster dışında doğrudan `llm-task` araç çağrıları veya
- iç içe `openclaw.invoke` çağrılarına dayanmayan Lobster adımları.

Bağımsız Lobster CLI örneği:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## Güvenlik notları

- **Yalnızca JSON**: modele kod blokları veya açıklama olmadan yalnızca bir JSON değeri döndürmesi talimatı verilir.
- **Araç yoktur**: temel çalıştırmada araçlar devre dışıdır; bu nedenle model görevin ortasında harici çağrı yapamaz.
- `schema` ile doğrulamadığınız sürece çıktıyı güvenilmeyen veri olarak değerlendirin.
- Bu çıktıyı kullanan, yan etkili her adımdan (gönderme, yayımlama, çalıştırma) önce onay alın.

## İlgili

- [Akıl yürütme düzeyleri](/tr/tools/thinking)
- [Alt ajanlar](/tr/tools/subagents)
- [Eğik çizgi komutları](/tr/tools/slash-commands)
