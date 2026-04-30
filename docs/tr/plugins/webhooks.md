---
read_when:
    - Harici bir sistemden TaskFlow'ları tetiklemek veya yürütmek istiyorsunuz
    - Birlikte gelen webhooks Plugin'ini yapılandırıyorsunuz
summary: 'Webhooks Plugin''i: güvenilir harici otomasyon için kimliği doğrulanmış TaskFlow girişi'
title: Webhook Plugin
x-i18n:
    generated_at: "2026-04-30T09:39:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70b195e330264af48a9e9c619bb5a0937bb15b2640edd3dd2b5517a13424e9fe
    source_path: plugins/webhooks.md
    workflow: 16
---

# Webhook'lar (Plugin)

Webhooks Plugin'i, harici otomasyonu OpenClaw TaskFlow'larına bağlayan kimliği doğrulanmış HTTP rotaları ekler.

Önce özel bir Plugin yazmadan, Zapier, n8n, bir CI işi veya dahili bir hizmet gibi güvenilir bir sistemin yönetilen TaskFlow'lar oluşturmasını ve yürütmesini istediğinizde kullanın.

## Nerede çalışır

Webhooks Plugin'i Gateway işleminin içinde çalışır.

Gateway'iniz başka bir makinede çalışıyorsa Plugin'i o Gateway ana makinesine kurup yapılandırın, ardından Gateway'i yeniden başlatın.

## Rotaları yapılandırma

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

Rota alanları:

- `enabled`: isteğe bağlıdır, varsayılanı `true`
- `path`: isteğe bağlıdır, varsayılanı `/plugins/webhooks/<routeId>`
- `sessionKey`: bağlı TaskFlow'ların sahibi olan zorunlu oturum
- `secret`: zorunlu paylaşılan gizli değer veya SecretRef
- `controllerId`: oluşturulan yönetilen akışlar için isteğe bağlı denetleyici kimliği
- `description`: isteğe bağlı operatör notu

Desteklenen `secret` girdileri:

- Düz dize
- `source: "env" | "file" | "exec"` ile SecretRef

Gizli değer destekli bir rota başlangıçta gizli değerini çözümleyemezse Plugin bozuk bir uç nokta açığa çıkarmak yerine o rotayı atlar ve bir uyarı kaydeder.

## Güvenlik modeli

Her rota, yapılandırılmış `sessionKey` değerinin TaskFlow yetkisiyle hareket etmek üzere güvenilir kabul edilir.

Bu, rotanın ilgili oturuma ait TaskFlow'ları inceleyip değiştirebileceği anlamına gelir; bu nedenle şunları yapmalısınız:

- Her rota için güçlü ve benzersiz bir gizli değer kullanın
- Satır içi düz metin gizli değerler yerine gizli değer referanslarını tercih edin
- Rotaları iş akışına uyan en dar oturuma bağlayın
- Yalnızca ihtiyaç duyduğunuz belirli Webhook yolunu açığa çıkarın

Plugin şunları uygular:

- Paylaşılan gizli değerle kimlik doğrulama
- İstek gövdesi boyutu ve zaman aşımı korumaları
- Sabit pencereli hız sınırlama
- Devam eden istek sınırlama
- `api.runtime.tasks.managedFlows.bindSession(...)` üzerinden sahibe bağlı TaskFlow erişimi

## İstek biçimi

`POST` isteklerini şunlarla gönderin:

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

Rotanın bağlı oturumu için yönetilen bir TaskFlow oluşturur.

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

İzin verilen çalışma zamanları şunlardır:

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

Plugin, Webhook yanıtlarından sahip/oturum üst verilerini bilinçli olarak temizler.

## İlgili belgeler

- [Plugin çalışma zamanı SDK'sı](/tr/plugins/sdk-runtime)
- [Hook'lar ve Webhook'lara genel bakış](/tr/automation/hooks)
- [CLI Webhook'ları](/tr/cli/webhooks)
