---
read_when:
    - İş akışları içinde yalnızca JSON olan bir LLM adımı istiyorsunuz
    - Otomasyon için şema doğrulamalı LLM çıktısına ihtiyacınız var
summary: İş akışları için yalnızca JSON LLM görevleri (isteğe bağlı plugin aracı)
title: LLM Görevi
x-i18n:
    generated_at: "2026-04-05T14:12:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbe9b286a8e958494de06a59b6e7b750a82d492158df344c7afe30fce24f0584
    source_path: tools/llm-task.md
    workflow: 15
---

# LLM Görevi

`llm-task`, yalnızca JSON üreten bir LLM görevi çalıştıran ve
yapılandırılmış çıktı döndüren (isteğe bağlı olarak JSON Schema'ya göre doğrulanan)
**isteğe bağlı bir plugin aracıdır**.

Bu, Lobster gibi iş akışı motorları için idealdir: her iş akışı için özel OpenClaw kodu
yazmadan tek bir LLM adımı ekleyebilirsiniz.

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

2. Aracı izin listesine ekleyin (`optional: true` ile kaydedilir):

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## Yapılandırma (isteğe bağlı)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.4",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai-codex/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels`, `provider/model` dizelerinden oluşan bir izin listesidir. Ayarlanırsa,
liste dışındaki tüm istekler reddedilir.

## Araç parametreleri

- `prompt` (string, zorunlu)
- `input` (any, isteğe bağlı)
- `schema` (object, isteğe bağlı JSON Schema)
- `provider` (string, isteğe bağlı)
- `model` (string, isteğe bağlı)
- `thinking` (string, isteğe bağlı)
- `authProfileId` (string, isteğe bağlı)
- `temperature` (number, isteğe bağlı)
- `maxTokens` (number, isteğe bağlı)
- `timeoutMs` (number, isteğe bağlı)

`thinking`, `low` veya `medium` gibi standart OpenClaw akıl yürütme önayarlarını kabul eder.

## Çıktı

Ayrıştırılmış JSON'u içeren `details.json` döndürür (ve sağlandığında
`schema`'ya göre doğrular).

## Örnek: Lobster iş akışı adımı

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

- Bu araç **yalnızca JSON** üretir ve modele yalnızca JSON çıktı vermesini söyler (kod çitleri yok, yorum yok).
- Bu çalıştırmada modele hiçbir araç açığa çıkarılmaz.
- `schema` ile doğrulamadığınız sürece çıktıyı güvenilmez kabul edin.
- Yan etki oluşturan her adımdan (gönder, yayınla, exec) önce onayları yerleştirin.
