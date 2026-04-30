---
read_when:
    - Betiklerden bir aracı turu çalıştırmak istiyorsunuz (isteğe bağlı olarak yanıtı iletin)
summary: '`openclaw agent` için CLI başvurusu (Gateway üzerinden bir ajan turu gönderin)'
title: Ajan
x-i18n:
    generated_at: "2026-04-30T09:10:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: b77668949040933c5281f2f183e48cc2593d09252470483b9ae38dcffd13d071
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Gateway aracılığıyla bir ajan turu çalıştırın (gömülü için `--local` kullanın).
Yapılandırılmış bir ajanı doğrudan hedeflemek için `--agent <id>` kullanın.

En az bir oturum seçicisi geçirin:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

İlgili:

- Ajan gönderme aracı: [Ajan gönder](/tr/tools/agent-send)

## Seçenekler

- `-m, --message <text>`: gerekli ileti gövdesi
- `-t, --to <dest>`: oturum anahtarını türetmek için kullanılan alıcı
- `--session-id <id>`: açık oturum kimliği
- `--agent <id>`: ajan kimliği; yönlendirme bağlarını geçersiz kılar
- `--model <id>`: bu çalıştırma için model geçersiz kılması (`provider/model` veya model kimliği)
- `--thinking <level>`: ajan düşünme düzeyi (`off`, `minimal`, `low`, `medium`, `high`, ayrıca `xhigh`, `adaptive` veya `max` gibi sağlayıcı tarafından desteklenen özel düzeyler)
- `--verbose <on|off>`: oturum için ayrıntı düzeyini kalıcı hale getirir
- `--channel <channel>`: teslim kanalı; ana oturum kanalını kullanmak için atlayın
- `--reply-to <target>`: teslim hedefi geçersiz kılması
- `--reply-channel <channel>`: teslim kanalı geçersiz kılması
- `--reply-account <id>`: teslim hesabı geçersiz kılması
- `--local`: gömülü ajanı doğrudan çalıştırır (Plugin kayıt defteri ön yüklemesinden sonra)
- `--deliver`: yanıtı seçili kanala/hedefe geri gönderir
- `--timeout <seconds>`: ajan zaman aşımını geçersiz kılar (varsayılan 600 veya yapılandırma değeri)
- `--json`: JSON çıktısı verir

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

- Gateway modu, Gateway isteği başarısız olduğunda gömülü ajana geri döner. Gömülü yürütmeyi baştan zorlamak için `--local` kullanın.
- `--local` yine de önce Plugin kayıt defterini ön yükler, böylece Plugin tarafından sağlanan sağlayıcılar, araçlar ve kanallar gömülü çalıştırmalar sırasında kullanılabilir kalır.
- `--local` ve gömülü geri dönüş çalıştırmaları tek seferlik çalıştırmalar olarak ele alınır. Bu yerel işlem için açılan paketlenmiş MCP loopback kaynakları ve sıcak Claude stdio oturumları yanıttan sonra kullanımdan kaldırılır, böylece betikli çağrılar yerel alt süreçleri canlı tutmaz.
- Gateway destekli çalıştırmalar, Gateway’in sahibi olduğu MCP loopback kaynaklarını çalışan Gateway süreci altında bırakır; eski istemciler geçmiş temizleme bayrağını hâlâ gönderebilir, ancak Gateway bunu uyumluluk amaçlı etkisiz bir işlem olarak kabul eder.
- `--channel`, `--reply-channel` ve `--reply-account` oturum yönlendirmesini değil, yanıt teslimini etkiler.
- `--json`, stdout’u JSON yanıtı için ayrılmış tutar. Gateway, Plugin ve gömülü geri dönüş tanılamaları stderr’ye yönlendirilir; böylece betikler stdout’u doğrudan ayrıştırabilir.
- Gömülü geri dönüş JSON’u `meta.transport: "embedded"` ve `meta.fallbackFrom: "gateway"` içerir; böylece betikler geri dönüş çalıştırmalarını Gateway çalıştırmalarından ayırt edebilir.
- Gateway bir ajan çalıştırmasını kabul eder ancak CLI son yanıtı beklerken zaman aşımına uğrarsa, gömülü geri dönüş yeni bir açık `gateway-fallback-*` oturum/çalıştırma kimliği kullanır ve `meta.fallbackReason: "gateway_timeout"` ile geri dönüş oturum alanlarını bildirir. Bu, Gateway’in sahibi olduğu transcript kilidiyle yarışmayı veya özgün yönlendirilmiş konuşma oturumunu sessizce değiştirmeyi önler.
- Bu komut `models.json` yeniden oluşturmayı tetiklediğinde, SecretRef tarafından yönetilen sağlayıcı kimlik bilgileri çözümlenmiş gizli düz metin olarak değil, gizli olmayan işaretçiler olarak kalıcı hale getirilir (örneğin ortam değişkeni adları, `secretref-env:ENV_VAR_NAME` veya `secretref-managed`).
- İşaretçi yazımları kaynak açısından otoritatiftir: OpenClaw işaretçileri çözümlenmiş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden kalıcı hale getirir.

## İlgili

- [CLI referansı](/tr/cli)
- [Ajan çalışma zamanı](/tr/concepts/agent)
