---
read_when:
    - İş akışları içinde yalnızca JSON kullanan bir LLM adımı istiyorsunuz
    - Otomasyon için şema doğrulamalı LLM çıktısına ihtiyacınız var
summary: İş akışları için yalnızca JSON LLM görevleri (isteğe bağlı plugin aracı)
title: LLM görevi
x-i18n:
    generated_at: "2026-04-24T09:35:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613aefd1bac5b9675821a118c11130c8bfaefb1673d0266f14ff4e91b47fed8b
    source_path: tools/llm-task.md
    workflow: 15
---

`llm-task`, yalnızca JSON üreten bir LLM görevi çalıştıran ve yapılandırılmış çıktı döndüren
(isteğe bağlı olarak JSON Schema'ya karşı doğrulanan) **isteğe bağlı bir plugin aracıdır**.

Bu, Lobster gibi iş akışı motorları için idealdir: her iş akışı için
özel OpenClaw kodu yazmadan tek bir LLM adımı ekleyebilirsiniz.

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

2. Aracı allowlist'e ekleyin (`optional: true` ile kaydedilir):

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

`allowedModels`, `provider/model` string'lerinden oluşan bir allowlist'tir. Ayarlıysa,
liste dışındaki tüm istekler reddedilir.

## Araç parametreleri

- `prompt` (string, gerekli)
- `input` (herhangi biri, isteğe bağlı)
- `schema` (object, isteğe bağlı JSON Schema)
- `provider` (string, isteğe bağlı)
- `model` (string, isteğe bağlı)
- `thinking` (string, isteğe bağlı)
- `authProfileId` (string, isteğe bağlı)
- `temperature` (number, isteğe bağlı)
- `maxTokens` (number, isteğe bağlı)
- `timeoutMs` (number, isteğe bağlı)

`thinking`, `low` veya `medium` gibi standart OpenClaw reasoning önayarlarını kabul eder.

## Çıktı

Ayrıştırılmış JSON'u içeren `details.json` döndürür (ve
verildiyse `schema`'ya göre doğrular).

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

- Araç **yalnızca JSON** üretir ve modele yalnızca JSON çıktısı vermesini söyler (kod çitleri yok, yorum yok).
- Bu çalıştırma için modele hiçbir araç açığa çıkarılmaz.
- `schema` ile doğrulama yapmadığınız sürece çıktıyı güvenilmeyen veri olarak değerlendirin.
- Yan etkili her adımdan önce (send, post, exec) onayları yerleştirin.

## İlgili

- [Thinking levels](/tr/tools/thinking)
- [Sub-agents](/tr/tools/subagents)
- [Slash commands](/tr/tools/slash-commands)
