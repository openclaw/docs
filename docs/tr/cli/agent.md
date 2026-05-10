---
read_when:
    - Betiklerden tek bir ajan turu çalıştırmak istiyorsunuz (isteğe bağlı olarak yanıtı iletmek)
summary: '`openclaw agent` için CLI referansı (Gateway üzerinden bir ajan turu gönder)'
title: Ajan
x-i18n:
    generated_at: "2026-05-10T19:27:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae5c2f895cadf70a6253e49a3c7c698a04840a24231076cf8ef5bab340162f52
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Gateway üzerinden bir agent turn çalıştırın (gömülü için `--local` kullanın).
Yapılandırılmış bir ajanı doğrudan hedeflemek için `--agent <id>` kullanın.

En az bir oturum seçici geçirin:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

İlgili:

- Ajan gönderme aracı: [Ajan gönderme](/tr/tools/agent-send)

## Seçenekler

- `-m, --message <text>`: gerekli ileti gövdesi
- `-t, --to <dest>`: oturum anahtarını türetmek için kullanılan alıcı
- `--session-id <id>`: açık oturum kimliği
- `--agent <id>`: ajan kimliği; yönlendirme bağlamalarını geçersiz kılar
- `--model <id>`: bu çalıştırma için model geçersiz kılması (`provider/model` veya model kimliği)
- `--thinking <level>`: ajan düşünme seviyesi (`off`, `minimal`, `low`, `medium`, `high`; ayrıca sağlayıcının desteklediği `xhigh`, `adaptive` veya `max` gibi özel seviyeler)
- `--verbose <on|off>`: oturum için ayrıntılı seviyesi kalıcı hale getir
- `--channel <channel>`: teslimat kanalı; ana oturum kanalını kullanmak için atlayın
- `--reply-to <target>`: teslimat hedefi geçersiz kılması
- `--reply-channel <channel>`: teslimat kanalı geçersiz kılması
- `--reply-account <id>`: teslimat hesabı geçersiz kılması
- `--local`: gömülü ajanı doğrudan çalıştır (Plugin kayıt defteri ön yüklemesinden sonra)
- `--deliver`: yanıtı seçilen kanala/hedefe geri gönder
- `--timeout <seconds>`: ajan zaman aşımını geçersiz kıl (varsayılan 600 veya yapılandırma değeri)
- `--json`: JSON çıktısı ver

## Örnekler

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Notlar

- Gateway modu, Gateway isteği başarısız olduğunda gömülü ajana geri döner. Baştan gömülü yürütmeyi zorlamak için `--local` kullanın.
- `--local` yine de önce Plugin kayıt defterini önceden yükler; böylece Plugin tarafından sağlanan sağlayıcılar, araçlar ve kanallar gömülü çalıştırmalar sırasında kullanılabilir kalır.
- `--local` ve gömülü geri dönüş çalıştırmaları tek seferlik çalıştırmalar olarak değerlendirilir. Yerel süreç için açılan paketli MCP loopback kaynakları ve sıcak Claude stdio oturumları yanıttan sonra kaldırılır; böylece betikli çağrılar yerel alt süreçleri canlı tutmaz.
- Gateway destekli çalıştırmalar, Gateway'in sahip olduğu MCP loopback kaynaklarını çalışan Gateway süreci altında bırakır; eski istemciler hâlâ geçmiş temizleme bayrağını gönderebilir, ancak Gateway bunu uyumluluk için işlem yapmayan bir seçenek olarak kabul eder.
- `--channel`, `--reply-channel` ve `--reply-account` oturum yönlendirmesini değil, yanıt teslimatını etkiler.
- `--json`, stdout'u JSON yanıtı için ayrılmış tutar. Gateway, Plugin ve gömülü geri dönüş tanı çıktıları stderr'e yönlendirilir; böylece betikler stdout'u doğrudan ayrıştırabilir.
- Gömülü geri dönüş JSON'u `meta.transport: "embedded"` ve `meta.fallbackFrom: "gateway"` içerir; böylece betikler geri dönüş çalıştırmalarını Gateway çalıştırmalarından ayırt edebilir.
- Gateway bir ajan çalıştırmasını kabul eder ancak CLI son yanıtı beklerken zaman aşımına uğrarsa, gömülü geri dönüş yeni ve açık bir `gateway-fallback-*` oturum/çalıştırma kimliği kullanır ve `meta.fallbackReason: "gateway_timeout"` ile geri dönüş oturumu alanlarını bildirir. Bu, Gateway'in sahip olduğu transcript kilidiyle yarışmayı veya özgün yönlendirilmiş konuşma oturumunu sessizce değiştirmeyi önler.
- Bu komut `models.json` yeniden oluşturmayı tetiklediğinde, SecretRef tarafından yönetilen sağlayıcı kimlik bilgileri çözümlenmiş gizli düz metin olarak değil, gizli olmayan işaretçiler olarak kalıcı hale getirilir (örneğin env var adları, `secretref-env:ENV_VAR_NAME` veya `secretref-managed`).
- İşaretçi yazımları kaynak açısından belirleyicidir: OpenClaw işaretçileri çözümlenmiş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden kalıcı hale getirir.

## JSON teslimat durumu

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

`deliveryStatus.status`, `sent`, `suppressed`, `partial_failed` veya `failed` değerlerinden biridir. `suppressed`, teslimatın kasıtlı olarak gönderilmediği anlamına gelir; örneğin ileti gönderme hook'u bunu iptal etmiş olabilir veya görünür sonuç olmayabilir. Yine de bu, yeniden deneme yapılmayan terminal bir sonuçtur. `partial_failed`, daha sonraki bir payload başarısız olmadan önce en az bir payload'ın gönderildiği anlamına gelir. `failed`, dayanıklı hiçbir gönderimin tamamlanmadığı veya teslimat ön kontrolünün başarısız olduğu anlamına gelir.

Gateway destekli CLI yanıtları ham Gateway sonuç şeklini de korur; burada aynı nesne `result.deliveryStatus` konumunda bulunur.

Ortak alanlar:

- `requested`: nesne mevcut olduğunda her zaman `true`.
- `attempted`: dayanıklı gönderim yolu çalıştıktan sonra `true`; ön kontrol hataları veya görünür payload olmaması durumunda `false`.
- `succeeded`: `true`, `false` veya `"partial"`; `"partial"`, `status: "partial_failed"` ile eşleşir.
- `reason`: dayanıklı teslimattan veya ön kontrol doğrulamasından gelen küçük harfli snake-case neden. Bilinen nedenler arasında `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` ve `no_delivery_target` bulunur; başarısız dayanıklı gönderimler ayrıca başarısız aşamayı bildirebilir. Küme genişleyebileceğinden bilinmeyen değerleri opak olarak ele alın.
- `resultCount`: kullanılabildiğinde kanal gönderim sonuçlarının sayısı.
- `sentBeforeError`: kısmi bir hata, hatadan önce en az bir payload gönderdiyse `true`.
- `error`: başarısız veya kısmen başarısız gönderimler için boolean `true`.
- `errorMessage`: yalnızca altta yatan bir teslimat hata iletisi yakalandığında eklenir. Ön kontrol hataları `error` ve `reason` taşır ancak `errorMessage` içermez.
- `payloadOutcomes`: kullanılabildiğinde `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` veya hook meta verileriyle isteğe bağlı payload başına sonuçlar.

## İlgili

- [CLI referansı](/tr/cli)
- [Ajan çalışma zamanı](/tr/concepts/agent)
