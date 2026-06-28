---
read_when:
    - Betiklerden bir ajan turu çalıştırmak istiyorsunuz (isteğe bağlı olarak yanıtı iletin)
summary: 'CLI referansı: `openclaw agent` (Gateway aracılığıyla bir ajan turu gönderin)'
title: Ajan
x-i18n:
    generated_at: "2026-06-28T00:20:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be2aad94ba288d14b4b18086dae54eb10c1cd0a6c7b27a836d07f39200e651d8
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Gateway üzerinden bir ajan turu çalıştırın (gömülü kullanım için `--local` kullanın).
Yapılandırılmış bir ajanı doğrudan hedeflemek için `--agent <id>` kullanın.

En az bir oturum seçici geçirin:

- `--to <dest>`
- `--session-key <key>`
- `--session-id <id>`
- `--agent <id>`

İlgili:

- Ajan gönderme aracı: [Ajan gönderme](/tr/tools/agent-send)

## Seçenekler

- `-m, --message <text>`: ileti gövdesi
- `--message-file <path>`: ileti gövdesini bir UTF-8 dosyasından oku
- `-t, --to <dest>`: oturum anahtarını türetmek için kullanılan alıcı
- `--session-key <key>`: yönlendirme için kullanılacak açık oturum anahtarı
- `--session-id <id>`: açık oturum kimliği
- `--agent <id>`: ajan kimliği; yönlendirme bağlamalarını geçersiz kılar
- `--model <id>`: bu çalıştırma için model geçersiz kılması (`provider/model` veya model kimliği)
- `--thinking <level>`: ajan düşünme düzeyi (`off`, `minimal`, `low`, `medium`, `high` ve `xhigh`, `adaptive` veya `max` gibi sağlayıcı destekli özel düzeyler)
- `--verbose <on|off>`: oturum için ayrıntılılık düzeyini kalıcı hale getir
- `--channel <channel>`: teslim kanalı; ana oturum kanalını kullanmak için atlayın
- `--reply-to <target>`: teslim hedefi geçersiz kılması
- `--reply-channel <channel>`: teslim kanalı geçersiz kılması
- `--reply-account <id>`: teslim hesabı geçersiz kılması
- `--local`: gömülü ajanı doğrudan çalıştır (Plugin kayıt defteri ön yüklemesinden sonra)
- `--deliver`: yanıtı seçilen kanala/hedefe geri gönder
- `--timeout <seconds>`: ajan zaman aşımını geçersiz kıl (varsayılan 600 veya yapılandırma değeri)
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

- `--message` veya `--message-file` seçeneklerinden tam olarak birini geçirin. `--message-file`, isteğe bağlı bir UTF-8 BOM'u kaldırdıktan sonra çok satırlı dosya içeriğini korur ve geçerli UTF-8 olmayan dosyaları reddeder.
- Gateway isteği başarısız olduğunda Gateway modu gömülü ajana geri döner. Gömülü yürütmeyi baştan zorlamak için `--local` kullanın.
- `--local` yine de önce Plugin kayıt defterini önceden yükler; böylece Plugin tarafından sağlanan sağlayıcılar, araçlar ve kanallar gömülü çalıştırmalar sırasında kullanılabilir kalır.
- `--local` ve gömülü geri dönüş çalıştırmaları tek seferlik çalıştırmalar olarak ele alınır. Bu yerel süreç için açılan paketli MCP loopback kaynakları ve sıcak Claude stdio oturumları yanıttan sonra sonlandırılır; böylece betikli çağrılar yerel alt süreçleri canlı tutmaz.
- Gateway destekli çalıştırmalar, Gateway sahibi MCP loopback kaynaklarını çalışan Gateway süreci altında bırakır; eski istemciler geçmiş temizleme bayrağını hâlâ gönderebilir, ancak Gateway bunu uyumluluk amaçlı etkisiz işlem olarak kabul eder.
- `--channel`, `--reply-channel` ve `--reply-account` oturum yönlendirmesini değil, yanıt teslimini etkiler.
- `--session-key` açık bir oturum anahtarı seçer. Ajan önekli anahtarlar `agent:<agent-id>:<session-key>` kullanmalıdır ve ikisi de sağlandığında `--agent`, anahtarın ajan kimliğiyle eşleşmelidir. Çıplak sentinel olmayan anahtarlar, sağlandığında `--agent` kapsamına, aksi halde yapılandırılmış varsayılan ajan kapsamına alınır; örneğin `--agent ops --session-key incident-42`, `agent:ops:incident-42` hedefine yönlendirir. Sabit `global` ve `unknown` yalnızca `--agent` sağlanmadığında kapsam dışı kalır; bu durumda gömülü geri dönüş ve depo sahipliği yapılandırılmış varsayılan ajanı kullanır.
- `--json`, stdout'u JSON yanıtı için ayrılmış tutar. Gateway, Plugin ve gömülü geri dönüş tanılamaları stderr'e yönlendirilir; böylece betikler stdout'u doğrudan ayrıştırabilir.
- Gömülü geri dönüş JSON'u `meta.transport: "embedded"` ve `meta.fallbackFrom: "gateway"` içerir; böylece betikler geri dönüş çalıştırmalarını Gateway çalıştırmalarından ayırt edebilir.
- Gateway bir ajan çalıştırmasını kabul eder ancak CLI son yanıtı beklerken zaman aşımına uğrarsa, gömülü geri dönüş yeni bir açık `gateway-fallback-*` oturum/çalıştırma kimliği kullanır ve `meta.fallbackReason: "gateway_timeout"` ile geri dönüş oturum alanlarını raporlar. Bu, Gateway sahibi transcript kilidiyle yarışmayı veya özgün yönlendirilmiş konuşma oturumunu sessizce değiştirmeyi önler.
- Gateway destekli çalıştırmalar için `SIGTERM` ve `SIGINT`, bekleyen CLI isteğini keser. Gateway çalıştırmayı zaten kabul etmişse CLI, çıkmadan önce kabul edilen çalıştırma kimliği için `chat.abort` da gönderir. Yerel `--local` çalıştırmaları ve gömülü geri dönüş çalıştırmaları aynı abort sinyalini alır, ancak `chat.abort` göndermez. Özgün ajan çalıştırması hâlâ etkinken yinelenen bir `--run-id` Gateway'e ulaşırsa, yinelenen yanıt `status: "in_flight"` raporlar ve JSON olmayan CLI boş yanıt yerine stderr tanılaması yazdırır. Harici cron/systemd sarmalayıcıları için `timeout -k 60 600 openclaw agent ...` gibi dış bir zorla sonlandırma güvenlik önlemi tutun; böylece kapatma boşaltılamazsa supervisor süreci yine de temizleyebilir.
- Bu komut `models.json` yeniden oluşturmasını tetiklediğinde, SecretRef tarafından yönetilen sağlayıcı kimlik bilgileri çözümlenmiş gizli düz metin olarak değil, gizli olmayan işaretleyiciler olarak kalıcı hale getirilir (örneğin env var adları, `secretref-env:ENV_VAR_NAME` veya `secretref-managed`).
- İşaretleyici yazımları kaynak-yetkilidir: OpenClaw işaretleyicileri çözümlenmiş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden kalıcı hale getirir.

## JSON teslim durumu

`--json --deliver` kullanıldığında, CLI JSON yanıtı betiklerin teslim edilmiş, bastırılmış, kısmi ve başarısız gönderimleri ayırt edebilmesi için üst düzey `deliveryStatus` içerebilir:

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

`deliveryStatus.status`, `sent`, `suppressed`, `partial_failed` veya `failed` değerlerinden biridir. `suppressed`, teslimin kasıtlı olarak gönderilmediği anlamına gelir; örneğin ileti gönderme hook'u bunu iptal etmiş veya görünür bir sonuç olmamıştır; yine de bu, yeniden deneme yapılmayan terminal bir sonuçtur. `partial_failed`, sonraki bir payload başarısız olmadan önce en az bir payload'un gönderildiği anlamına gelir. `failed`, kalıcı hiçbir gönderimin tamamlanmadığı veya teslim ön denetiminin başarısız olduğu anlamına gelir.

Gateway destekli CLI yanıtları, aynı nesnenin `result.deliveryStatus` konumunda kullanılabildiği ham Gateway sonuç şeklini de korur.

Yaygın alanlar:

- `requested`: nesne mevcut olduğunda her zaman `true`.
- `attempted`: kalıcı gönderim yolu çalıştıktan sonra `true`; ön denetim hataları veya görünür payload olmadığında `false`.
- `succeeded`: `true`, `false` veya `"partial"`; `"partial"`, `status: "partial_failed"` ile eşleşir.
- `reason`: kalıcı teslimden veya ön denetim doğrulamasından gelen küçük harfli snake-case neden. Bilinen nedenler arasında `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` ve `no_delivery_target` bulunur; başarısız kalıcı gönderimler başarısız aşamayı da raporlayabilir. Küme genişleyebileceği için bilinmeyen değerleri opak olarak ele alın.
- `resultCount`: kullanılabilir olduğunda kanal gönderim sonuçlarının sayısı.
- `sentBeforeError`: kısmi bir hata, hatadan önce en az bir payload gönderdiğinde `true`.
- `error`: başarısız veya kısmi başarısız gönderimler için boolean `true`.
- `errorMessage`: yalnızca altta yatan bir teslim hatası iletisi yakalandığında dahil edilir. Ön denetim hataları `error` ve `reason` taşır, ancak `errorMessage` taşımaz.
- `payloadOutcomes`: kullanılabilir olduğunda `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` veya hook metadata içeren isteğe bağlı payload başına sonuçlar.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Ajan çalışma zamanı](/tr/concepts/agent)
