---
read_when:
    - Harici bir sistemden TaskFlow’ları tetiklemek veya yönlendirmek istiyorsunuz
    - Paketlenmiş webhooks Plugin’ini yapılandırıyorsunuz
summary: 'Webhooks Plugin: güvenilir harici otomasyon için kimliği doğrulanmış TaskFlow girişi'
title: Webhooks Plugin’i
x-i18n:
    generated_at: "2026-04-24T09:24:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: a35074f256e0664ee73111bcb93ce1a2311dbd4db2231200a1a385e15ed5e6c4
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhooks (Plugin)

Webhooks Plugin’i, harici otomasyonu OpenClaw TaskFlow’larına bağlayan kimliği doğrulanmış HTTP yolları ekler.

Zapier, n8n, bir CI işi veya dahili bir servis gibi güvenilir bir sistemin, önce özel bir Plugin yazmadan yönetilen TaskFlow’lar oluşturmasını ve yönlendirmesini istediğinizde bunu kullanın.

## Nerede çalışır

Webhooks Plugin’i Gateway süreci içinde çalışır.

Gateway’iniz başka bir makinede çalışıyorsa, Plugin’i o Gateway ana makinesine kurup yapılandırın, ardından Gateway’i yeniden başlatın.

## Yolları yapılandırma

Yapılandırmayı `plugins.entries.webhooks.config` altında ayarlayın:

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Zapier TaskFlow bridge",
            },
          },
        },
      },
    },
  },
}
```

Yol alanları:

- `enabled`: isteğe bağlıdır, varsayılan olarak `true`
- `path`: isteğe bağlıdır, varsayılan olarak `/plugins/webhooks/<routeId>`
- `sessionKey`: bağlı TaskFlow’ların sahibi olan gerekli oturum
- `secret`: gerekli paylaşılan sır veya SecretRef
- `controllerId`: oluşturulan yönetilen akışlar için isteğe bağlı denetleyici kimliği
- `description`: isteğe bağlı operatör notu

Desteklenen `secret` girdileri:

- Düz metin dizgesi
- `source: "env" | "file" | "exec"` içeren SecretRef

Sır destekli bir yol başlangıçta sırrını çözemiyorsa, Plugin bozuk bir uç nokta açığa çıkarmak yerine o yolu atlar ve bir uyarı günlüğe kaydeder.

## Güvenlik modeli

Her yol, yapılandırılmış `sessionKey` değerinin TaskFlow yetkisiyle hareket etmek üzere güvenilir kabul edilir.

Bu, yolun o oturuma ait TaskFlow’ları inceleyebileceği ve değiştirebileceği anlamına gelir; bu nedenle şunları yapmalısınız:

- Her yol için güçlü ve benzersiz bir sır kullanın
- Satır içi düz metin sırlar yerine sır başvurularını tercih edin
- Yolları, iş akışına uyan en dar oturuma bağlayın
- Yalnızca ihtiyaç duyduğunuz belirli Webhook yolunu açığa çıkarın

Plugin şunları uygular:

- Paylaşılan sır kimlik doğrulaması
- İstek gövdesi boyutu ve zaman aşımı korumaları
- Sabit pencere hız sınırlaması
- Devam eden istek sınırlandırması
- `api.runtime.taskFlow.bindSession(...)` üzerinden sahip bağlı TaskFlow erişimi

## İstek biçimi

Şunlarla `POST` istekleri gönderin:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` veya `x-openclaw-webhook-secret: <secret>`

Örnek:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Desteklenen eylemler

Plugin şu anda şu JSON `action` değerlerini kabul eder:

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

Yolun bağlı oturumu için yönetilen bir TaskFlow oluşturur.

Örnek:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Mevcut bir yönetilen TaskFlow içinde yönetilen bir alt görev oluşturur.

İzin verilen çalışma zamanları:

- `subagent`
- `acp`

Örnek:

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Yanıt şekli

Başarılı yanıtlar şunu döndürür:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

Reddedilen istekler şunu döndürür:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Plugin, sahip/oturum metaverilerini Webhook yanıtlarından kasıtlı olarak temizler.

## İlgili belgeler

- [Plugin runtime SDK](/tr/plugins/sdk-runtime)
- [Hooks and webhooks overview](/tr/automation/hooks)
- [CLI webhooks](/tr/cli/webhooks)
