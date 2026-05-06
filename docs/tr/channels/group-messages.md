---
read_when:
    - WhatsApp gruplarını özel olarak yapılandırma
    - WhatsApp etkinleştirme modlarını değiştirme (`mention` ile `always`)
    - WhatsApp grup oturum anahtarlarında veya bekleyen ileti bağlamında ince ayar yapma
sidebarTitle: WhatsApp groups
summary: WhatsApp grup mesajı işleme — etkinleştirme, izin listeleri, oturumlar ve bağlam enjeksiyonu
title: WhatsApp grup mesajları
x-i18n:
    generated_at: "2026-05-06T09:02:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 489f04ea9f4d0954f77eee4590d609383d5dc987eaaea5eb121b454620a2d0fe
    source_path: channels/group-messages.md
    workflow: 16
---

Kanallar arası gruplar modeli (Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo) için [Gruplar](/tr/channels/groups) bölümüne bakın. Bu sayfa, bu modelin üzerindeki WhatsApp’a özgü davranışı kapsar: etkinleştirme, grup izin listeleri, grup başına oturum anahtarları ve bekleyen ileti bağlamı enjeksiyonu.

Hedef: OpenClaw’ın WhatsApp gruplarında bulunmasını, yalnızca ping aldığında uyanmasını ve bu ileti dizisini kişisel DM oturumundan ayrı tutmasını sağlamak.

<Note>
`agents.list[].groupChat.mentionPatterns` Telegram, Discord, Slack ve iMessage tarafından da kullanılır. Çok ajanlı kurulumlarda bunu ajan başına ayarlayın veya genel geri dönüş olarak `messages.groupChat.mentionPatterns` kullanın.
</Note>

## Davranış

- Etkinleştirme modları: `mention` (varsayılan) veya `always`. `mention` bir ping gerektirir (`mentionedJids` üzerinden gerçek WhatsApp @-bahsetmeleri, güvenli regex desenleri veya botun E.164 numarasının metnin herhangi bir yerinde geçmesi). `always` ajanı her iletide uyandırır, ancak ajan yalnızca anlamlı değer katabiliyorsa yanıt vermelidir; aksi halde tam sessiz token olan `NO_REPLY` / `no_reply` döndürür. Varsayılanlar yapılandırmada (`channels.whatsapp.groups`) ayarlanabilir ve `/activation` ile grup bazında geçersiz kılınabilir. `channels.whatsapp.groups` ayarlandığında, aynı zamanda grup izin listesi işlevi görür (tümüne izin vermek için `"*"` ekleyin).
- Grup politikası: `channels.whatsapp.groupPolicy`, grup iletilerinin kabul edilip edilmeyeceğini denetler (`open|disabled|allowlist`). `allowlist`, `channels.whatsapp.groupAllowFrom` kullanır (geri dönüş: açık `channels.whatsapp.allowFrom`). Varsayılan `allowlist` değeridir (gönderenleri ekleyene kadar engellenir).
- Grup başına oturumlar: oturum anahtarları `agent:<agentId>:whatsapp:group:<jid>` biçimindedir; böylece `/verbose on`, `/trace on` veya `/think high` gibi komutlar (bağımsız iletiler olarak gönderildiklerinde) o gruba kapsamlanır; kişisel DM durumu değişmeden kalır. Grup ileti dizileri için Heartbeat atlanır.
- Bağlam enjeksiyonu: çalıştırmayı tetiklemeyen **yalnızca bekleyen** grup iletileri (varsayılan 50), `[Chat messages since your last reply - for context]` altında öneklenir; tetikleyen satır `[Current message - respond to this]` altında yer alır. Zaten oturumda bulunan iletiler yeniden enjekte edilmez.
- Göndereni görünür kılma: Pi kimin konuştuğunu bilsin diye her grup toplu iletisi artık `[from: Sender Name (+E164)]` ile biter.
- Geçici/tek görüntülemelik: metni/bahsetmeleri çıkarmadan önce bunları açarız; böylece içlerindeki pingler yine tetikler.
- Grup sistem istemi: bir grup oturumunun ilk turunda (ve `/activation` modu her değiştirdiğinde) sistem istemine `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` gibi kısa bir açıklama enjekte ederiz. Meta veri yoksa yine de ajana bunun bir grup sohbeti olduğunu söyleriz.

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

- Regex’ler büyük/küçük harfe duyarsızdır ve diğer yapılandırma regex yüzeyleriyle aynı güvenli-regex korumalarını kullanır; geçersiz desenler ve güvenli olmayan iç içe tekrarlar yok sayılır.
- Birisi kişiye dokunduğunda WhatsApp hâlâ `mentionedJids` üzerinden kanonik bahsetmeler gönderir; bu nedenle numara geri dönüşüne nadiren ihtiyaç duyulur, ancak yararlı bir güvenlik ağıdır.

### Etkinleştirme komutu (yalnızca sahip)

Grup sohbeti komutunu kullanın:

- `/activation mention`
- `/activation always`

Bunu yalnızca sahip numarası (`channels.whatsapp.allowFrom` içinden veya ayarlanmamışsa botun kendi E.164 numarası) değiştirebilir. Geçerli etkinleştirme modunu görmek için grupta bağımsız bir ileti olarak `/status` gönderin.

## Nasıl kullanılır

1. WhatsApp hesabınızı (OpenClaw çalıştıran hesap) gruba ekleyin.
2. `@openclaw …` deyin (veya numarayı ekleyin). `groupPolicy: "open"` ayarlamadığınız sürece yalnızca izin listesindeki gönderenler bunu tetikleyebilir.
3. Ajan istemi, doğru kişiye hitap edebilmesi için son grup bağlamını ve sondaki `[from: …]` işaretçisini içerir.
4. Oturum düzeyi yönergeler (`/verbose on`, `/trace on`, `/think high`, `/new` veya `/reset`, `/compact`) yalnızca o grubun oturumuna uygulanır; kaydedilmeleri için bunları bağımsız iletiler olarak gönderin. Kişisel DM oturumunuz bağımsız kalır.

## Test / doğrulama

- Manuel smoke:
  - Grupta bir `@openclaw` ping’i gönderin ve gönderen adına atıf yapan bir yanıtı doğrulayın.
  - İkinci bir ping gönderin ve geçmiş bloğunun dahil edildiğini, ardından bir sonraki turda temizlendiğini doğrulayın.
- `from: <groupJid>` ve `[from: …]` sonekini gösteren `inbound web message` girdilerini görmek için Gateway günlüklerini (`--verbose` ile çalıştırarak) kontrol edin.

## Bilinen hususlar

- Gürültülü yayınlardan kaçınmak için Heartbeat gruplar için kasıtlı olarak atlanır.
- Yankı bastırma birleştirilmiş toplu ileti dizesini kullanır; bahsetme olmadan aynı metni iki kez gönderirseniz yalnızca ilki yanıt alır.
- Oturum deposu girdileri oturum deposunda (varsayılan olarak `~/.openclaw/agents/<agentId>/sessions/sessions.json`) `agent:<agentId>:whatsapp:group:<jid>` olarak görünür; eksik bir girdi yalnızca grubun henüz bir çalıştırmayı tetiklemediği anlamına gelir.
- Gruplardaki yazıyor göstergeleri `agents.defaults.typingMode` izler. Görünür yanıtlar varsayılan yalnızca ileti-aracı modunu kullandığında, yazıyor göstergesi varsayılan olarak hemen başlar; böylece otomatik nihai yanıt gönderilmese bile grup üyeleri ajanın çalıştığını görebilir. Açık yazma modu yapılandırması yine de önceliklidir.

## İlgili

- [Gruplar](/tr/channels/groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Yayın grupları](/tr/channels/broadcast-groups)
