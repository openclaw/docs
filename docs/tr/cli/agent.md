---
read_when:
    - Betiklerden tek bir ajan turu çalıştırmak istiyorsunuz (isteğe bağlı olarak yanıtı iletin)
summary: '`openclaw agent` için CLI referansı (Gateway üzerinden tek bir ajan turu gönderme)'
title: Ajan
x-i18n:
    generated_at: "2026-07-12T12:09:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Gateway üzerinden bir agent turu çalıştırın. Gateway isteği başarısız olursa gömülü agente geri döner; baştan gömülü yürütmeyi zorlamak için `--local` iletin.

En az bir oturum seçici iletin: `--to`, `--session-key`, `--session-id` veya `--agent`.

İlgili: [Agent gönderme aracı](/tr/tools/agent-send)

## Seçenekler

- `-m, --message <text>`: ileti gövdesi
- `--message-file <path>`: ileti gövdesini bir UTF-8 dosyasından oku
- `-t, --to <dest>`: oturum anahtarını türetmek için kullanılan alıcı
- `--session-key <key>`: yönlendirme için kullanılacak açık oturum anahtarı
- `--session-id <id>`: açık oturum kimliği
- `--agent <id>`: agent kimliği; yönlendirme bağlamalarını geçersiz kılar
- `--model <id>`: bu çalıştırma için model geçersiz kılması (`provider/model` veya model kimliği)
- `--thinking <level>`: agent düşünme düzeyi (`off`, `minimal`, `low`, `medium`, `high` ve `xhigh`, `adaptive` veya `max` gibi sağlayıcı tarafından desteklenen özel düzeyler)
- `--verbose <on|off>`: ayrıntı düzeyini oturum için kalıcı hâle getir
- `--channel <channel>`: teslimat kanalı; ana oturum kanalını kullanmak için belirtmeyin
- `--reply-to <target>`: teslimat hedefini geçersiz kıl
- `--reply-channel <channel>`: teslimat kanalını geçersiz kıl
- `--reply-account <id>`: teslimat hesabını geçersiz kıl
- `--local`: gömülü agenti doğrudan çalıştır (plugin kayıt defteri önceden yüklendikten sonra)
- `--deliver`: yanıtı seçilen kanala/hedefe geri gönder
- `--timeout <seconds>`: agent zaman aşımını geçersiz kıl (varsayılan 600 veya `agents.defaults.timeoutSeconds`); `0` zaman aşımını devre dışı bırakır
- `--json`: JSON çıktısı ver

## Örnekler

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Notlar

- `--message` veya `--message-file` seçeneklerinden tam olarak birini iletin. `--message-file`, baştaki UTF-8 BOM'u kaldırır ve çok satırlı içeriği korur; geçerli UTF-8 olmayan dosyaları reddeder.
- Eğik çizgi komutları (örneğin `/compact`) `--message` üzerinden çalıştırılamaz. CLI bunları reddeder ve bunun yerine birinci sınıf komuta yönlendirir (Compaction için `openclaw sessions compact <key>`).
- `--local` ve gömülü geri dönüş çalıştırmaları tek seferliktir: çalıştırma için açılan paketlenmiş MCP local loopback kaynakları ve sıcak Claude stdio oturumları yanıttan sonra kapatılır; böylece betikli çağrılar yerel alt süreçleri çalışır durumda bırakmaz. Gateway destekli çalıştırmalar ise Gateway'e ait MCP local loopback kaynaklarını çalışan Gateway süreci altında tutar.
- `--agent`, `--channel` ve `--to` birlikte kullanıldığında oturum yönlendirmesi, kanalın standart alıcısını ve `session.dmScope` değerini izler. Yalnızca giden iletiler için kararlı bir alıcı kimliğine sahip kanallar, agentin ana oturumundan yalıtılmış ve sağlayıcıya ait bir oturum kullanır. `--reply-channel` ve `--reply-account` yalnızca teslimatı etkiler.
- `--session-key`, açık bir oturum anahtarı seçer. Agent ön ekli anahtarlar `agent:<agent-id>:<session-key>` biçimini kullanmalıdır ve ikisi birlikte verildiğinde `--agent`, anahtarın agent kimliğiyle eşleşmelidir. İşaretçi olmayan yalın anahtarların kapsamı, sağlanmışsa `--agent` ile; aksi takdirde yapılandırılmış varsayılan agent ile belirlenir. Örneğin `--agent ops --session-key incident-42`, `agent:ops:incident-42` hedefine yönlendirilir. `global` ve `unknown` sabit anahtarları yalnızca `--agent` sağlanmadığında kapsamsız kalır.
- `--json`, stdout'u JSON yanıtına ayırır; Gateway, plugin ve gömülü geri dönüş tanılamaları stderr'e gider, böylece betikler stdout'u doğrudan ayrıştırabilir.
- Gömülü geri dönüş JSON'u, betiklerin geri dönüş çalıştırmasını algılayabilmesi için `meta.transport: "embedded"` ve `meta.fallbackFrom: "gateway"` alanlarını içerir.
- Gateway bir çalıştırmayı kabul eder ancak CLI son yanıtı beklerken zaman aşımına uğrarsa gömülü geri dönüş, yeni bir `gateway-fallback-*` oturum/çalıştırma kimliği kullanır ve Gateway'e ait dökümle yarışmak veya özgün oturumu sessizce değiştirmek yerine `meta.fallbackReason: "gateway_timeout"` ile geri dönüş oturumu alanlarını bildirir.
- `SIGTERM`/`SIGINT`, bekleyen Gateway destekli bir isteği keser; Gateway çalıştırmayı zaten kabul etmişse CLI çıkmadan önce bu çalıştırma kimliği için ayrıca `chat.abort` gönderir. `--local` ve gömülü geri dönüş çalıştırmaları aynı sinyali alır ancak `chat.abort` göndermez. Dahili çalıştırma tekilleştirme anahtarında bu oturum için zaten etkin bir çalıştırma varsa yanıt `status: "in_flight"` bildirir ve JSON olmayan CLI, boş yanıt yerine stderr'e bir tanılama yazdırır. Harici cron/systemd sarmalayıcılarında, kapanış tamamlanamazsa gözetmenin süreci sonlandırabilmesi için `timeout -k 60 600 openclaw agent ...` gibi zorla sonlandırma desteği kullanın.
- Bu komut `models.json` dosyasının yeniden oluşturulmasını tetiklediğinde SecretRef tarafından yönetilen sağlayıcı kimlik bilgileri, çözümlenmiş gizli düz metin olarak hiçbir zaman değil, gizli olmayan işaretçiler (örneğin ortam değişkeni adları, `secretref-env:ENV_VAR_NAME` veya `secretref-managed`) olarak kalıcılaştırılır. İşaretçi yazımları, çözümlenmiş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden gelir.

## JSON teslimat durumu

`--json --deliver` kullanıldığında CLI JSON yanıtı, betiklerin teslim edilen, engellenen, kısmi ve başarısız gönderimleri ayırt edebilmesi için üst düzey `deliveryStatus` alanını içerir:

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

Gateway destekli CLI yanıtları ayrıca ham Gateway sonuç biçimini `result.deliveryStatus` konumunda korur.

`deliveryStatus.status` aşağıdakilerden biridir:

| Durum            | Anlamı                                                                                                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sent`           | Teslimat tamamlandı.                                                                                                                                                        |
| `suppressed`     | Teslimat kasıtlı olarak gönderilmedi (örneğin ileti gönderme kancası teslimatı iptal etti veya görünür bir sonuç yoktu). Son durumdur, yeniden denenmez.                     |
| `partial_failed` | Daha sonraki bir yük başarısız olmadan önce en az bir yük gönderildi.                                                                                                       |
| `failed`         | Kalıcı hiçbir gönderim tamamlanmadı veya teslimat ön kontrolü başarısız oldu.                                                                                                |

Ortak alanlar:

- `requested`: nesne mevcut olduğunda her zaman `true`.
- `attempted`: kalıcı gönderim yolu çalıştıktan sonra `true`; ön kontrol hatalarında veya görünür yük olmadığında `false`.
- `succeeded`: `true`, `false` veya `"partial"`; `"partial"`, `status: "partial_failed"` ile eşleşir.
- `reason`: kalıcı teslimattan veya ön kontrol doğrulamasından gelen küçük harfli snake-case neden. Bilinen değerler arasında `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` ve `no_delivery_target` bulunur; başarısız kalıcı gönderimler ayrıca başarısız aşamayı da bildirebilir. Küme genişleyebileceğinden bilinmeyen değerleri opak kabul edin.
- `resultCount`: mevcut olduğunda kanal gönderim sonuçlarının sayısı.
- `sentBeforeError`: kısmi bir hata, hata oluşmadan önce en az bir yük gönderdiyse `true`.
- `error`: başarısız veya kısmen başarısız gönderimlerde `true`.
- `errorMessage`: yalnızca temel teslimat hata iletisi yakalandığında bulunur. Ön kontrol hataları `error`/`reason` taşır ancak `errorMessage` içermez.
- `payloadOutcomes`: mevcut olduğunda `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` veya kanca meta verilerini içeren, yük başına isteğe bağlı sonuçlar.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Agent çalışma zamanı](/tr/concepts/agent)
