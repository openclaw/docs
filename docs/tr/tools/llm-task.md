---
read_when:
    - İş akışlarının içinde yalnızca JSON çıktısı veren bir LLM adımı istiyorsunuz
    - Otomasyon için şema doğrulamalı LLM çıktısına ihtiyacınız var
summary: JSON-only iş akışları için LLM görevleri (isteğe bağlı plugin aracı)
title: LLM görevi
x-i18n:
    generated_at: "2026-06-28T01:23:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab83202bd0954a948c933c80de17385eb385573b8e3974dba41ff876f91c3ddb
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task`, JSON'a özgü bir LLM görevi çalıştıran ve yapılandırılmış çıktı döndüren **isteğe bağlı bir Plugin aracıdır** (isteğe bağlı olarak JSON Schema ile doğrulanır).

Bu, Lobster gibi iş akışı motorları için idealdir: Her iş akışı için özel OpenClaw kodu yazmadan tek bir LLM adımı ekleyebilirsiniz.

## Plugin'i etkinleştirme

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

`tools.allow` değerini yalnızca kısıtlayıcı izin listesi modunu istediğinizde kullanın.

## Yapılandırma (isteğe bağlı)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.5"],
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

Ayrıştırılmış JSON'u içeren `details.json` döndürür (ve sağlandığında `schema` ile doğrular).

## Örnek: Lobster iş akışı adımı

### Önemli sınırlama

Aşağıdaki örnek, **bağımsız Lobster CLI**'nin `openclaw.invoke` için doğru gateway URL'si/kimlik doğrulama bağlamının zaten bulunduğu bir ortamda çalıştığını varsayar.

OpenClaw içindeki paketli **gömülü** Lobster çalıştırıcısı için bu iç içe CLI kalıbı **şu anda güvenilir değildir**:

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

- Araç **yalnızca JSON** kullanır ve modele yalnızca JSON çıktısı üretmesini söyler (kod bloğu yok, yorum yok).
- Bu çalıştırma için modele hiçbir araç sunulmaz.
- `schema` ile doğrulamadığınız sürece çıktıyı güvenilmeyen kabul edin.
- Yan etkisi olan herhangi bir adımdan (gönderme, yayımlama, çalıştırma) önce onayları koyun.

## İlgili

- [Düşünme düzeyleri](/tr/tools/thinking)
- [Alt ajanlar](/tr/tools/subagents)
- [Slash komutları](/tr/tools/slash-commands)
