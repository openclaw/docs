---
read_when:
    - Grup mesajı kurallarını veya bahsetmeleri değiştirme
summary: WhatsApp grup mesajı işleme için davranış ve yapılandırma (`mentionPatterns` yüzeyler arasında paylaşılır)
title: Grup Mesajları
x-i18n:
    generated_at: "2026-04-12T23:28:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5d9484dd1de74d42f8dce4c3ac80d60c24864df30a7802e64893ef55506230fe
    source_path: channels/group-messages.md
    workflow: 15
---

# Grup mesajları (WhatsApp web kanalı)

Amaç: Clawd’un WhatsApp gruplarında bulunmasını, yalnızca etiketlendiğinde uyanmasını ve bu iş parçacığını kişisel DM oturumundan ayrı tutmasını sağlamak.

Not: `agents.list[].groupChat.mentionPatterns` artık Telegram/Discord/Slack/iMessage tarafından da kullanılıyor; bu belge WhatsApp’a özgü davranışa odaklanır. Çoklu ajan kurulumlarında, `agents.list[].groupChat.mentionPatterns` değerini her ajan için ayarlayın (veya genel geri dönüş olarak `messages.groupChat.mentionPatterns` kullanın).

## Mevcut uygulama (2025-12-03)

- Etkinleştirme modları: `mention` (varsayılan) veya `always`. `mention`, bir etiketleme gerektirir (gerçek WhatsApp @-etiketlemeleri `mentionedJids` üzerinden, güvenli regex kalıpları veya metnin herhangi bir yerindeki botun E.164 numarası). `always`, ajanı her mesajda uyandırır ancak yalnızca anlamlı bir katkı sunabildiğinde yanıt vermelidir; aksi halde tam olarak sessiz belirteç `NO_REPLY` / `no_reply` döndürür. Varsayılanlar yapılandırmada (`channels.whatsapp.groups`) ayarlanabilir ve grup bazında `/activation` ile geçersiz kılınabilir. `channels.whatsapp.groups` ayarlandığında, bir grup izin listesi olarak da işlev görür (tümüne izin vermek için `"*"` ekleyin).
- Grup politikası: `channels.whatsapp.groupPolicy`, grup mesajlarının kabul edilip edilmeyeceğini kontrol eder (`open|disabled|allowlist`). `allowlist`, `channels.whatsapp.groupAllowFrom` kullanır (geri dönüş: açık `channels.whatsapp.allowFrom`). Varsayılan `allowlist` değeridir (gönderenleri ekleyene kadar engellenir).
- Grup başına oturumlar: oturum anahtarları `agent:<agentId>:whatsapp:group:<jid>` biçimindedir; bu nedenle `/verbose on`, `/trace on` veya `/think high` gibi komutlar (bağımsız mesajlar olarak gönderildiğinde) o grupla sınırlıdır; kişisel DM durumu etkilenmez. Grup iş parçacıkları için Heartbeat atlanır.
- Bağlam ekleme: çalıştırmayı _tetiklememiş_ **yalnızca bekleyen** grup mesajları (varsayılan 50), `[Chat messages since your last reply - for context]` altında öneklenir; tetikleyen satır ise `[Current message - respond to this]` altında yer alır. Oturumda zaten bulunan mesajlar yeniden eklenmez.
- Gönderenin gösterilmesi: artık her grup kümesinin sonunda `[from: Sender Name (+E164)]` bulunur, böylece Pi kimin konuştuğunu bilir.
- Geçici/view-once: metni/etiketlemeleri çıkarmadan önce bunları açıyoruz; böylece içlerindeki etiketlemeler yine de tetiklenir.
- Grup sistem istemi: bir grup oturumunun ilk turunda (ve `/activation` modu her değiştiğinde), sistem istemine şu gibi kısa bir açıklama ekliyoruz: `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Meta veriler mevcut değilse bile yine de ajana bunun bir grup sohbeti olduğunu söylüyoruz.

## Yapılandırma örneği (WhatsApp)

WhatsApp metin gövdesindeki görsel `@` işaretini kaldırsa bile görünen adla etiketlemelerin çalışması için `~/.openclaw/openclaw.json` dosyasına bir `groupChat` bloğu ekleyin:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Notlar:

- Regex’ler büyük/küçük harfe duyarsızdır ve diğer yapılandırma regex yüzeyleriyle aynı güvenli regex korumalarını kullanır; geçersiz kalıplar ve güvenli olmayan iç içe tekrarlar yok sayılır.
- Birisi kişiye dokunduğunda WhatsApp yine de `mentionedJids` üzerinden kanonik etiketlemeleri gönderir; bu yüzden numara geri dönüşü nadiren gerekir ancak yararlı bir güvenlik ağıdır.

### Etkinleştirme komutu (yalnızca sahip)

Grup sohbeti komutunu kullanın:

- `/activation mention`
- `/activation always`

Bunu yalnızca sahip numarası (`channels.whatsapp.allowFrom` içinden veya ayarlanmamışsa botun kendi E.164 numarası) değiştirebilir. Geçerli etkinleştirme modunu görmek için grupta bağımsız bir mesaj olarak `/status` gönderin.

## Nasıl kullanılır

1. WhatsApp hesabınızı (OpenClaw’u çalıştıran hesap) gruba ekleyin.
2. `@openclaw …` deyin (veya numarayı ekleyin). `groupPolicy: "open"` ayarlamadığınız sürece yalnızca izin verilen gönderenler bunu tetikleyebilir.
3. Ajan istemi, doğru kişiye hitap edebilmesi için son grup bağlamını ve sondaki `[from: …]` işaretleyicisini içerecektir.
4. Oturum düzeyindeki yönergeler (`/verbose on`, `/trace on`, `/think high`, `/new` veya `/reset`, `/compact`) yalnızca o grubun oturumuna uygulanır; kaydedilmeleri için bunları bağımsız mesajlar olarak gönderin. Kişisel DM oturumunuz bağımsız kalır.

## Test / doğrulama

- Manuel smoke testi:
  - Grupta bir `@openclaw` etiketi gönderin ve gönderen adına referans veren bir yanıtı doğrulayın.
  - İkinci bir etiket gönderin ve geçmiş bloğunun dahil edildiğini, ardından bir sonraki turda temizlendiğini doğrulayın.
- `from: <groupJid>` ve `[from: …]` son ekini gösteren `inbound web message` girdilerini görmek için gateway günlüklerini kontrol edin (`--verbose` ile çalıştırın).

## Bilinen noktalar

- Gürültülü yayınları önlemek için gruplarda Heartbeat kasıtlı olarak atlanır.
- Yankı bastırma, birleştirilmiş küme dizesini kullanır; etiketleme olmadan aynı metni iki kez gönderirseniz yalnızca ilkine yanıt verilir.
- Oturum deposu girdileri, oturum deposunda (varsayılan olarak `~/.openclaw/agents/<agentId>/sessions/sessions.json`) `agent:<agentId>:whatsapp:group:<jid>` olarak görünür; eksik bir girdi yalnızca grubun henüz bir çalıştırmayı tetiklemediği anlamına gelir.
- Gruplardaki yazıyor göstergeleri `agents.defaults.typingMode` değerini izler (varsayılan: etiketlenmediğinde `message`).
