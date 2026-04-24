---
read_when:
    - Grup mesajı kurallarını veya bahsetmeleri değiştirme
summary: WhatsApp grup mesajı işleme için davranış ve yapılandırma (`mentionPatterns` yüzeyler arasında paylaşılır)
title: Grup mesajları
x-i18n:
    generated_at: "2026-04-24T08:57:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: f67ed72c0e61aef18a529cb1d9dbc98909e213352ff7cbef93fe4c9bf8357186
    source_path: channels/group-messages.md
    workflow: 15
---

# Grup mesajları (WhatsApp web kanalı)

Amaç: Clawd'ın WhatsApp gruplarında bulunmasını, yalnızca pinglendiğinde uyanmasını ve bu ileti dizisini kişisel DM oturumundan ayrı tutmasını sağlamak.

Not: `agents.list[].groupChat.mentionPatterns` artık Telegram/Discord/Slack/iMessage tarafından da kullanılıyor; bu belge WhatsApp'e özgü davranışa odaklanır. Çok ajanlı kurulumlarda, `agents.list[].groupChat.mentionPatterns` değerini her ajan için ayarlayın (veya genel yedek olarak `messages.groupChat.mentionPatterns` kullanın).

## Mevcut uygulama (2025-12-03)

- Etkinleştirme modları: `mention` (varsayılan) veya `always`. `mention`, bir ping gerektirir (gerçek WhatsApp @-bahsetmeleri `mentionedJids` üzerinden, güvenli regex desenleri veya metin içinde herhangi bir yerde botun E.164 numarası). `always`, her mesajda ajanı uyandırır ancak yalnızca anlamlı değer katabildiğinde yanıt vermelidir; aksi durumda tam olarak `NO_REPLY` / `no_reply` sessiz belirtecini döndürür. Varsayılanlar yapılandırmada (`channels.whatsapp.groups`) ayarlanabilir ve grup bazında `/activation` ile geçersiz kılınabilir. `channels.whatsapp.groups` ayarlandığında aynı zamanda grup izin listesi olarak da çalışır (tümüne izin vermek için `"*"` ekleyin).
- Grup ilkesi: `channels.whatsapp.groupPolicy`, grup mesajlarının kabul edilip edilmeyeceğini kontrol eder (`open|disabled|allowlist`). `allowlist`, `channels.whatsapp.groupAllowFrom` kullanır (yedek: açıkça belirtilmiş `channels.whatsapp.allowFrom`). Varsayılan `allowlist` değeridir (gönderenleri ekleyene kadar engellenir).
- Grup başına oturumlar: oturum anahtarları `agent:<agentId>:whatsapp:group:<jid>` şeklindedir; bu nedenle `/verbose on`, `/trace on` veya `/think high` gibi komutlar (tek başına mesaj olarak gönderildiğinde) o grupla sınırlıdır; kişisel DM durumu etkilenmez. Heartbeat grup ileti dizileri için atlanır.
- Bağlam ekleme: çalıştırmayı tetiklememiş **yalnızca bekleyen** grup mesajları (varsayılan 50), `[Chat messages since your last reply - for context]` altında öneklenir; tetikleyici satır ise `[Current message - respond to this]` altında yer alır. Oturumda zaten bulunan mesajlar yeniden enjekte edilmez.
- Gönderenin gösterilmesi: artık her grup toplu mesajı `[from: Gönderen Adı (+E164)]` ile biter; böylece Pi kimin konuştuğunu bilir.
- Geçici/view-once: metin/bahsetmeleri çıkarmadan önce bunları açıyoruz; böylece içlerindeki ping'ler de tetikleme yapar.
- Grup sistem istemi: bir grup oturumunun ilk turunda (ve `/activation` modu ne zaman değişirse) sistem istemine şu tür kısa bir açıklama enjekte ederiz: `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Meta veriler mevcut değilse bile ajana bunun bir grup sohbeti olduğunu yine söyleriz.

## Yapılandırma örneği (WhatsApp)

WhatsApp metin gövdesindeki görsel `@` işaretini kaldırsa bile görünen ad ping'lerinin çalışması için `~/.openclaw/openclaw.json` dosyasına bir `groupChat` bloğu ekleyin:

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

- Regex'ler büyük/küçük harfe duyarsızdır ve diğer yapılandırma regex yüzeyleriyle aynı güvenli regex korumalarını kullanır; geçersiz desenler ve güvenli olmayan iç içe tekrarlar yok sayılır.
- Birisi kişiye dokunduğunda WhatsApp yine de `mentionedJids` üzerinden kanonik bahsetmeleri gönderir; bu yüzden numara yedeğine nadiren ihtiyaç duyulur ancak faydalı bir güvenlik ağıdır.

### Etkinleştirme komutu (yalnızca sahip)

Grup sohbeti komutunu kullanın:

- `/activation mention`
- `/activation always`

Bunu yalnızca sahip numarası (`channels.whatsapp.allowFrom` içinden veya ayarlanmamışsa botun kendi E.164 numarası) değiştirebilir. Geçerli etkinleştirme modunu görmek için grupta tek başına bir mesaj olarak `/status` gönderin.

## Nasıl kullanılır

1. WhatsApp hesabınızı (OpenClaw'ı çalıştıran hesap) gruba ekleyin.
2. `@openclaw …` deyin (veya numarayı ekleyin). `groupPolicy: "open"` ayarlamadığınız sürece bunu yalnızca izin listesindeki gönderenler tetikleyebilir.
3. Ajan istemi, doğru kişiye hitap edebilmesi için son grup bağlamını ve sondaki `[from: …]` işaretçisini içerir.
4. Oturum düzeyindeki yönergeler (`/verbose on`, `/trace on`, `/think high`, `/new` veya `/reset`, `/compact`) yalnızca o grubun oturumuna uygulanır; kaydedilmeleri için bunları tek başına mesaj olarak gönderin. Kişisel DM oturumunuz bağımsız kalır.

## Test / doğrulama

- Manuel smoke testi:
  - Grupta bir `@openclaw` pingi gönderin ve gönderen adına atıfta bulunan bir yanıtı doğrulayın.
  - İkinci bir ping gönderin ve geçmiş bloğunun eklendiğini, ardından sonraki turda temizlendiğini doğrulayın.
- `from: <groupJid>` ve `[from: …]` son ekini gösteren `inbound web message` girdilerini görmek için Gateway günlüklerini (`--verbose` ile çalıştırın) kontrol edin.

## Bilinen noktalar

- Gürültülü yayınları önlemek için Heartbeat kasıtlı olarak gruplarda atlanır.
- Echo bastırma, birleştirilmiş toplu iş dizesini kullanır; bahsetme olmadan aynı metni iki kez gönderirseniz yalnızca ilkine yanıt verilir.
- Oturum deposu girdileri, oturum deposunda (varsayılan olarak `~/.openclaw/agents/<agentId>/sessions/sessions.json`) `agent:<agentId>:whatsapp:group:<jid>` olarak görünür; eksik bir girdi yalnızca grubun henüz bir çalıştırma tetiklemediği anlamına gelir.
- Gruplardaki yazma göstergeleri `agents.defaults.typingMode` ayarını izler (varsayılan: bahsedilmediğinde `message`).

## İlgili

- [Gruplar](/tr/channels/groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Yayın grupları](/tr/channels/broadcast-groups)
