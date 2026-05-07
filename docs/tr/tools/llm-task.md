---
read_when:
    - İş akışları içinde yalnızca JSON döndüren bir LLM adımı istiyorsunuz
    - Otomasyon için şema doğrulamalı LLM çıktısına ihtiyacınız var
summary: İş akışları için yalnızca JSON kullanan LLM görevleri (isteğe bağlı Plugin aracı)
title: LLM görevi
x-i18n:
    generated_at: "2026-05-07T13:26:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4f5efe399165e31a7f5966b93c2f83bced4fd96b7f04f5156412fd321bf5f403
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task`, JSON-only bir LLM görevi çalıştıran ve yapılandırılmış çıktı döndüren (isteğe bağlı olarak JSON Schema ile doğrulanan) **isteğe bağlı bir Plugin aracıdır**.

Bu, Lobster gibi iş akışı motorları için idealdir: her iş akışı için özel OpenClaw kodu yazmadan tek bir LLM adımı ekleyebilirsiniz.

## Plugin'i etkinleştirin

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

2. İsteğe bağlı araca izin verin:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`tools.allow` öğesini yalnızca kısıtlayıcı izin listesi modunu istediğinizde kullanın.

## Yapılandırma (isteğe bağlı)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels`, `provider/model` dizelerinden oluşan bir izin listesidir. Ayarlanırsa, listenin dışındaki tüm istekler reddedilir.

## Araç parametreleri

- `prompt` (dize, zorunlu)
- `input` (herhangi bir değer, isteğe bağlı)
- `schema` (nesne, isteğe bağlı JSON Schema)
- `provider` (dize, isteğe bağlı)
- `model` (dize, isteğe bağlı)
- `thinking` (dize, isteğe bağlı)
- `authProfileId` (dize, isteğe bağlı)
- `temperature` (sayı, isteğe bağlı)
- `maxTokens` (sayı, isteğe bağlı)
- `timeoutMs` (sayı, isteğe bağlı)

`thinking`, `low` veya `medium` gibi standart OpenClaw muhakeme ön ayarlarını kabul eder.

## Çıktı

Ayrıştırılmış JSON'u içeren `details.json` döndürür (ve sağlandığında `schema` ile doğrular).

## Örnek: Lobster iş akışı adımı

### Önemli sınırlama

Aşağıdaki örnek, **bağımsız Lobster CLI**'nin `openclaw.invoke` için doğru gateway URL'sinin/kimlik doğrulama bağlamının zaten bulunduğu bir ortamda çalıştığını varsayar.

OpenClaw içindeki paketlenmiş **gömülü** Lobster çalıştırıcısı için bu iç içe CLI deseni **şu anda güvenilir değildir**:

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

- Araç **yalnızca JSON** kullanır ve modele yalnızca JSON çıktısı üretmesini söyler (kod blokları yok, yorum yok).
- Bu çalıştırma için modele hiçbir araç sunulmaz.
- `schema` ile doğrulamadığınız sürece çıktıyı güvenilmeyen kabul edin.
- Yan etkisi olan herhangi bir adımdan (gönder, yayınla, yürüt) önce onayları yerleştirin.

## İlgili

- [Düşünme düzeyleri](/tr/tools/thinking)
- [Alt ajanlar](/tr/tools/subagents)
- [Slash komutları](/tr/tools/slash-commands)
