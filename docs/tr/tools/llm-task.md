---
read_when:
    - İş akışları içinde yalnızca JSON döndüren bir LLM adımı istiyorsunuz
    - Otomasyon için şema doğrulamalı büyük dil modeli çıktısına ihtiyacınız var
summary: İş akışları için yalnızca JSON LLM görevleri (isteğe bağlı Plugin aracı)
title: LLM görevi
x-i18n:
    generated_at: "2026-05-04T07:08:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cdc5d4feef17fb6d6d90d819d4c92d26a4ec43e4f5364c6acbaad1934a89269
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task`, yalnızca JSON döndüren bir LLM görevini çalıştıran ve yapılandırılmış çıktı döndüren **isteğe bağlı bir Plugin aracıdır** (isteğe bağlı olarak JSON Schema ile doğrulanır).

Bu, Lobster gibi iş akışı motorları için idealdir: Her iş akışı için özel OpenClaw kodu yazmadan tek bir LLM adımı ekleyebilirsiniz.

## Plugin’i etkinleştirin

1. Plugin’i etkinleştirin:

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

`tools.allow` değerini yalnızca kısıtlayıcı izin listesi modunu istediğinizde kullanın.

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

`allowedModels`, `provider/model` dizelerinden oluşan bir izin listesidir. Ayarlanırsa listenin dışındaki tüm istekler reddedilir.

## Araç parametreleri

- `prompt` (dize, gerekli)
- `input` (herhangi biri, isteğe bağlı)
- `schema` (nesne, isteğe bağlı JSON Schema)
- `provider` (dize, isteğe bağlı)
- `model` (dize, isteğe bağlı)
- `thinking` (dize, isteğe bağlı)
- `authProfileId` (dize, isteğe bağlı)
- `temperature` (sayı, isteğe bağlı)
- `maxTokens` (sayı, isteğe bağlı)
- `timeoutMs` (sayı, isteğe bağlı)

`thinking`, `low` veya `medium` gibi standart OpenClaw akıl yürütme ön ayarlarını kabul eder.

## Çıktı

Ayrıştırılmış JSON’u içeren `details.json` döndürür (ve sağlandığında `schema` ile doğrular).

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

- Araç **yalnızca JSON** kullanır ve modele yalnızca JSON çıktısı üretmesini söyler (kod blokları veya yorum yoktur).
- Bu çalıştırma için modele hiçbir araç açılmaz.
- `schema` ile doğrulamadığınız sürece çıktıyı güvenilmez kabul edin.
- Yan etkisi olan herhangi bir adımdan önce onayları yerleştirin (gönderme, yayımlama, çalıştırma).

## İlgili

- [Düşünme düzeyleri](/tr/tools/thinking)
- [Alt aracılar](/tr/tools/subagents)
- [Slash komutları](/tr/tools/slash-commands)
