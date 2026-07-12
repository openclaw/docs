---
read_when:
    - Bir çalışma alanını manuel olarak başlatma
summary: HEARTBEAT.md için çalışma alanı şablonu
title: HEARTBEAT.md şablonu
x-i18n:
    generated_at: "2026-07-12T12:14:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md şablonu

`HEARTBEAT.md`, ajan çalışma alanında bulunur ve periyodik Heartbeat kontrol listesini içerir. OpenClaw'ın Heartbeat model çağrısını tamamen atlaması (`reason=empty-heartbeat-file`) için dosyayı boş bırakın veya yalnızca boşluk, Markdown yorumları, ATX başlıkları, boş liste taslakları (`- `, `* [ ]`) ya da çit işaretleri içerecek şekilde tutun.

Dağıtılan varsayılan içerik:

```markdown
<!-- Heartbeat şablonu; yalnızca yorum içeren içerik, zamanlanmış Heartbeat API çağrılarını önler. -->

# Heartbeat API çağrılarını atlamak için bu dosyayı boş (veya yalnızca yorumlar içerecek şekilde) tutun.

# Ajanın bir şeyi periyodik olarak kontrol etmesini istediğinizde görevleri aşağıya ekleyin.
```

Yalnızca periyodik kontroller istediğinizde yorum satırlarının altına kısa görevler ekleyin. İçeriği küçük tutun: Heartbeat çalışmaları bu dosyayı her tetiklemede (varsayılan olarak 30 dakikada bir) okur; bu nedenle gereğinden fazla uzun talimatlar her uyanmada token tüketir.

Sade bir kontrol listesi yerine yalnızca zamanı gelen kontroller için görev başına `interval` ve `prompt` alanları içeren yapılandırılmış bir `tasks:` bloğu kullanın; biçim ve davranış için [HEARTBEAT.md](/tr/gateway/heartbeat#heartbeatmd-optional) bölümüne bakın.

## İlgili

- [Heartbeat](/tr/gateway/heartbeat)
- [Heartbeat yapılandırması](/tr/gateway/config-agents)
