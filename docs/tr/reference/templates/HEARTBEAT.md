---
read_when:
    - Bir çalışma alanını elle önyükleme
summary: HEARTBEAT.md için çalışma alanı şablonu
title: HEARTBEAT.md şablonu
x-i18n:
    generated_at: "2026-06-28T01:17:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md şablonu

`HEARTBEAT.md`, ajan çalışma alanında bulunur. OpenClaw’ın heartbeat model çağrılarını atlamasını istediğinizde dosyayı boş ya da yalnızca Markdown yorumları ve başlıkları içerecek şekilde bırakın.

Varsayılan çalışma zamanı şablonu şöyledir:

```markdown
# Heartbeat API çağrılarını atlamak için bu dosyayı boş bırakın (veya yalnızca yorumlar ekleyin).

# Ajanın belirli aralıklarla bir şeyi kontrol etmesini istediğinizde görevleri aşağıya ekleyin.
```

Kısa görevleri yalnızca ajanın belirli aralıklarla bir şeyi kontrol etmesini istediğinizde yorumların altına ekleyin. Heartbeat yönergelerini kısa tutun, çünkü bunlar yinelenen uyanmalarda okunur.

## İlgili

- [Heartbeat yapılandırması](/tr/gateway/config-agents)
