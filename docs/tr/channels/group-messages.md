---
read_when:
    - Grup mesajı kurallarını veya bahsetmeleri değiştirme
summary: WhatsApp grup mesajı işleme için davranış ve yapılandırma (mentionPatterns, yüzeyler arasında paylaşılır)
title: Grup mesajları
x-i18n:
    generated_at: "2026-04-30T09:06:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb7713f83b3bf309336c4b09add17835b13facb17a5a1e3db48c25d892988ee4
    source_path: channels/group-messages.md
    workflow: 16
---

Amaç: Clawd’ın WhatsApp gruplarında durmasını, yalnızca pinglendiğinde uyanmasını ve o yazışmayı kişisel DM oturumundan ayrı tutmasını sağlamak.

<Note>
`agents.list[].groupChat.mentionPatterns` Telegram, Discord, Slack ve iMessage tarafından da kullanılır. Bu belge WhatsApp’a özgü davranışa odaklanır. Çok ajanlı kurulumlar için `agents.list[].groupChat.mentionPatterns` değerini ajan başına ayarlayın veya genel yedek olarak `messages.groupChat.mentionPatterns` kullanın.
</Note>

## Geçerli uygulama (2025-12-03)

- Etkinleştirme modları: `mention` (varsayılan) veya `always`. `mention` bir ping gerektirir (gerçek WhatsApp @-bahsetmeleri `mentionedJids` üzerinden, güvenli regex desenleri veya metnin herhangi bir yerinde botun E.164 numarası). `always` ajanı her mesajda uyandırır ancak yalnızca anlamlı değer katabiliyorsa yanıt vermelidir; aksi halde tam sessiz belirteci `NO_REPLY` / `no_reply` döndürür. Varsayılanlar yapılandırmada (`channels.whatsapp.groups`) ayarlanabilir ve grup başına `/activation` ile geçersiz kılınabilir. `channels.whatsapp.groups` ayarlandığında grup izin listesi olarak da davranır (tümüne izin vermek için `"*"` ekleyin).
- Grup ilkesi: `channels.whatsapp.groupPolicy`, grup mesajlarının kabul edilip edilmeyeceğini denetler (`open|disabled|allowlist`). `allowlist`, `channels.whatsapp.groupAllowFrom` kullanır (yedek: açık `channels.whatsapp.allowFrom`). Varsayılan `allowlist` değeridir (gönderenleri ekleyene kadar engellenir).
- Grup başına oturumlar: oturum anahtarları `agent:<agentId>:whatsapp:group:<jid>` gibi görünür, böylece `/verbose on`, `/trace on` veya `/think high` gibi komutlar (bağımsız mesaj olarak gönderildiğinde) o grupla sınırlanır; kişisel DM durumu etkilenmez. Heartbeat’ler grup yazışmaları için atlanır.
- Bağlam ekleme: bir çalıştırmayı tetiklemeyen **yalnızca bekleyen** grup mesajları (varsayılan 50), tetikleyen satır `[Current message - respond to this]` altında olacak şekilde `[Chat messages since your last reply - for context]` altında öneklenir. Zaten oturumda olan mesajlar yeniden eklenmez.
- Gönderenin gösterilmesi: her grup toplu iletisi artık `[from: Sender Name (+E164)]` ile biter, böylece Pi kimin konuştuğunu bilir.
- Geçici/tek görüntülemelik: metin/bahsetmeleri çıkarmadan önce bunları açarız, bu yüzden içlerindeki pingler yine de tetikler.
- Grup sistem istemi: bir grup oturumunun ilk turunda (ve `/activation` modu değiştirdiğinde) sistem istemine `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` gibi kısa bir açıklama ekleriz. Meta veriler kullanılabilir değilse ajana bunun bir grup sohbeti olduğunu yine de söyleriz.

## Yapılandırma örneği (WhatsApp)

WhatsApp metin gövdesindeki görsel `@` işaretini kaldırsa bile görünen ad pinglerinin çalışması için `~/.openclaw/openclaw.json` dosyasına bir `groupChat` bloğu ekleyin:

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

- Regex’ler büyük/küçük harfe duyarsızdır ve diğer yapılandırma regex yüzeyleriyle aynı güvenli-regex koruma sınırlarını kullanır; geçersiz desenler ve güvenli olmayan iç içe tekrarlar yok sayılır.
- WhatsApp, biri kişiye dokunduğunda kanonik bahsetmeleri yine de `mentionedJids` üzerinden gönderir, bu yüzden numara yedeği nadiren gerekir ancak kullanışlı bir güvenlik ağıdır.

### Etkinleştirme komutu (yalnızca sahip)

Grup sohbeti komutunu kullanın:

- `/activation mention`
- `/activation always`

Bunu yalnızca sahip numarası (`channels.whatsapp.allowFrom` içinden veya ayarlanmamışsa botun kendi E.164 numarası) değiştirebilir. Geçerli etkinleştirme modunu görmek için grupta bağımsız bir mesaj olarak `/status` gönderin.

## Nasıl kullanılır

1. WhatsApp hesabınızı (OpenClaw çalıştıran hesap) gruba ekleyin.
2. `@openclaw …` deyin (veya numarayı ekleyin). `groupPolicy: "open"` ayarlamadığınız sürece yalnızca izin listesindeki gönderenler bunu tetikleyebilir.
3. Ajan istemi, doğru kişiye hitap edebilmesi için son grup bağlamını ve sondaki `[from: …]` işaretçisini içerir.
4. Oturum düzeyi yönergeler (`/verbose on`, `/trace on`, `/think high`, `/new` veya `/reset`, `/compact`) yalnızca o grubun oturumuna uygulanır; kaydolmaları için bunları bağımsız mesajlar olarak gönderin. Kişisel DM oturumunuz bağımsız kalır.

## Test / doğrulama

- Elle duman testi:
  - Grupta bir `@openclaw` pingi gönderin ve gönderen adına atıfta bulunan bir yanıtı doğrulayın.
  - İkinci bir ping gönderin ve geçmiş bloğunun dahil edildiğini, ardından sonraki turda temizlendiğini doğrulayın.
- `from: <groupJid>` değerini ve `[from: …]` son ekini gösteren `inbound web message` girdilerini görmek için Gateway günlüklerini (`--verbose` ile çalıştırın) kontrol edin.

## Bilinen noktalar

- Gürültülü yayınları önlemek için Heartbeat’ler gruplarda kasıtlı olarak atlanır.
- Yankı bastırma birleşik toplu ileti dizesini kullanır; bahsetme olmadan aynı metni iki kez gönderirseniz yalnızca ilki yanıt alır.
- Oturum deposu girdileri, oturum deposunda (varsayılan olarak `~/.openclaw/agents/<agentId>/sessions/sessions.json`) `agent:<agentId>:whatsapp:group:<jid>` olarak görünür; eksik bir girdi yalnızca grubun henüz bir çalıştırma tetiklemediği anlamına gelir.
- Gruplardaki yazıyor göstergeleri `agents.defaults.typingMode` ayarını izler. Görünür yanıtlar varsayılan yalnızca-mesaj-aracı modunu kullandığında, yazıyor göstergesi varsayılan olarak hemen başlar; böylece otomatik son yanıt gönderilmese bile grup üyeleri ajanın çalıştığını görebilir. Açık yazıyor modu yapılandırması yine de önceliklidir.

## İlgili

- [Gruplar](/tr/channels/groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Yayın grupları](/tr/channels/broadcast-groups)
