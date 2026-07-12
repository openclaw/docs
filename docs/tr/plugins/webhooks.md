---
read_when:
    - TaskFlow'ları harici bir sistemden tetiklemek veya yönetmek istiyorsunuz
    - Paketle birlikte gelen webhook'lar pluginini yapılandırıyorsunuz
summary: 'Webhooks Plugin''i: güvenilir harici otomasyon için kimliği doğrulanmış TaskFlow girişi'
title: Webhook'lar Plugin'i
x-i18n:
    generated_at: "2026-07-12T12:41:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

Webhooks plugin'i, güvenilir bir harici sistemin (Zapier, n8n, bir CI işi, dahili bir hizmet) özel bir plugin yazmadan HTTP üzerinden yönetilen OpenClaw TaskFlow'ları oluşturabilmesi ve yönlendirebilmesi için kimliği doğrulanmış HTTP rotaları ekler.

Plugin, Gateway işlemi içinde çalışır. Uzak bir Gateway için plugin'i söz konusu ana makineye kurup yapılandırın, ardından Gateway'i yeniden başlatın. Yapılandırılmış hiçbir rota olmadan sunulduğundan, en az bir rota ekleyene kadar hiçbir işlem yapmaz.

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

| Alan           | Zorunlu | Varsayılan                    | Notlar                                                  |
| -------------- | ------- | ----------------------------- | ------------------------------------------------------- |
| `enabled`      | hayır   | `true`                        |                                                         |
| `path`         | hayır   | `/plugins/webhooks/<routeId>` | Rotalar arasında benzersiz olmalıdır.                   |
| `sessionKey`   | evet    | -                             | Bağlı TaskFlow'ların sahibi olan oturum.                 |
| `secret`       | evet    | -                             | Düz metin dizesi veya bir SecretRef (aşağıda).          |
| `controllerId` | hayır   | `webhooks/<routeId>`          | Varsayılan `create_flow` denetleyicisi olarak kullanılır. |
| `description`  | hayır   | -                             | Yalnızca operatör notu.                                  |

`secret`, düz metin dizesini veya bir SecretRef'i kabul eder: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

Yapılandırılan her rota, gizli değeri o anda çözümlenebiliyor olsun veya olmasın başlangıçta kaydedilir. Çözümlenemeyen bir gizli değer rotayı devre dışı bırakmaz veya atlamaz; gizli değer çözümlenebilene kadar rotaya yapılan isteklerin kimlik doğrulaması başarısız olur (`401`). SecretRef değerleri her istekte yeniden çözümlenir; dolayısıyla temel gizli değerin (ortam değişkeni, dosya veya exec çıktısı) yenilenmesi Gateway'in yeniden başlatılmasına gerek kalmadan etkili olur.

## Güvenlik modeli

Her rota, yapılandırılmış `sessionKey` değerinin TaskFlow yetkisiyle hareket eder: söz konusu oturumun sahip olduğu tüm TaskFlow'ları inceleyebilir ve değiştirebilir. TaskFlow erişimi her zaman `api.runtime.tasks.managedFlows.bindSession(...)` üzerinden gerçekleşir; böylece rota hiçbir zaman bağlı olduğu oturumun dışında hareket edemez. Etki alanını sınırlamak için:

- Her rota için güçlü ve benzersiz bir gizli değer kullanın.
- Satır içi düz metin gizli değer yerine SecretRef'i tercih edin.
- Rotaları iş akışına uyan en dar kapsamlı oturuma bağlayın.
- Yalnızca ihtiyaç duyduğunuz belirli Webhook yolunu dışarı açın.

Her yol için istek işleme sırası: HTTP yöntemi (yalnızca `POST`) ve `Content-Type: application/json` kontrolleri, ardından sabit pencereli hız sınırlaması (yol+istemci-IP anahtarı başına 60 saniyelik pencerede 120 istek, en fazla 4.096 izlenen anahtar), ardından devam eden istek sınırlaması (anahtar başına eşzamanlı 8 istek, en fazla 4.096 izlenen anahtar), ardından paylaşılan gizli değerle kimlik doğrulama, son olarak 256 KB / 15 saniyelik JSON gövde okuması. Daha önceki bir kontrolde başarısız olan istekler sonraki kontrollere hiçbir zaman ulaşmaz.

## İstek biçimi

`Content-Type: application/json` ve `Authorization: Bearer <secret>` veya `x-openclaw-webhook-secret: <secret>` ile `POST` istekleri gönderin:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Desteklenen eylemler

| Eylem              | Amaç                                                                         |
| ------------------ | ---------------------------------------------------------------------------- |
| `create_flow`      | Rotanın oturumu için yönetilen bir TaskFlow oluşturur.                       |
| `get_flow`         | Kimliğine göre bir TaskFlow getirir.                                         |
| `list_flows`       | Rotanın oturumuna ait TaskFlow'ları listeler.                                |
| `find_latest_flow` | En son güncellenen TaskFlow'u getirir.                                       |
| `resolve_flow`     | Opak belirtece göre bir TaskFlow'u çözümler.                                 |
| `get_task_summary` | Bir TaskFlow'un görev özetini getirir.                                       |
| `set_waiting`      | İsteğe bağlı durum/bekleme verileriyle bir TaskFlow'u bekliyor olarak işaretler. |
| `resume_flow`      | Bekleyen/engellenmiş bir TaskFlow'u sürdürür.                                |
| `finish_flow`      | Bir TaskFlow'u tamamlandı olarak işaretler.                                  |
| `fail_flow`        | Bir TaskFlow'u başarısız olarak işaretler.                                   |
| `request_cancel`   | İş birliğine dayalı iptal isteğinde bulunur.                                 |
| `cancel_flow`      | Bir TaskFlow'u iptal eder (alt öğeler hâlâ etkinse `202` döndürebilir).      |
| `run_task`         | Mevcut bir TaskFlow içinde yönetilen bir alt görev oluşturur.                |

Değişiklik yapan eylemler (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`, `request_cancel`) iyimser eşzamanlılık için `flowId` ve `expectedRevision` gerektirir; eski bir revizyon `409 revision_conflict` döndürür.

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

İzin verilen `runtime` değerleri: `subagent`, `acp`. `startedAt`, `lastEventAt` ve `progressSummary` yalnızca `status`, `"running"` olduğunda geçerlidir; bunların başka bir durumla gönderilmesi `400 invalid_request` döndürür.

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Yanıt yapısı

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Akış ve görev görünümleri hiçbir zaman sahip/oturum meta verilerini içermez; böylece yanıtlar rotanın bağlı `sessionKey` değerini açığa çıkaramaz. `code` değerleri arasında `not_found`, `not_managed`, `revision_conflict`, `persist_failed`, `cancel_requested`, `cancel_pending`, `terminal`, `invalid_request`, `request_rejected` ve bir değişiklik yukarıdaki adlandırılmış kodların kapsamadığı bir nedenle reddedildiğinde eyleme özgü geri dönüş kodları (`mutation_rejected`, `create_rejected`, `task_not_created`, `cancel_rejected`) bulunur.

## İlgili içerikler

- [Hook'lar](/tr/automation/hooks) - dahili olay güdümlü Hook'lar ile bu HTTP tabanlı TaskFlow köprüsünün karşılaştırması
- [Gateway Webhook'ları (`hooks.*` yapılandırması)](/tr/automation/cron-jobs#webhooks) - ayrı bir genel Gateway HTTP uç noktası özelliğidir; bu plugin'in rotalarıyla aynı değildir
- [Plugin çalışma zamanı SDK'sı](/tr/plugins/sdk-runtime)
- [CLI Webhook'ları](/tr/cli/webhooks)
