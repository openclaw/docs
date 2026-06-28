---
read_when:
    - WhatsApp gruplarını özel olarak yapılandırma
    - WhatsApp etkinleştirme modlarını değiştirme (`mention` ve `always`)
    - WhatsApp grup oturumu anahtarlarını veya bekleyen ileti bağlamını ayarlama
sidebarTitle: WhatsApp groups
summary: WhatsApp grup mesajı işleme — etkinleştirme, izin listeleri, oturumlar ve bağlam enjeksiyonu
title: WhatsApp grup mesajları
x-i18n:
    generated_at: "2026-06-28T00:12:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 790866fd959b43d94b745082f3c90920b81c0a016492e9e164c600663f1b2eee
    source_path: channels/group-messages.md
    workflow: 16
---

Kanallar arası gruplar modeli (Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo) için bkz. [Gruplar](/tr/channels/groups). Bu sayfa, bu modelin üzerindeki WhatsApp'a özgü davranışı kapsar: etkinleştirme, grup izin listeleri, grup başına oturum anahtarları ve bekleyen ileti bağlamı ekleme.

Amaç: OpenClaw'ın WhatsApp gruplarında bulunmasını, yalnızca ping atıldığında uyanmasını ve bu yazışmayı kişisel DM oturumundan ayrı tutmasını sağlamak.

<Note>
`agents.list[].groupChat.mentionPatterns` Telegram, Discord, Slack ve iMessage tarafından da kullanılır. Çok aracılı kurulumlar için bunu aracı başına ayarlayın veya genel yedek olarak `messages.groupChat.mentionPatterns` kullanın.
</Note>

## Davranış

- Etkinleştirme modları: `mention` (varsayılan) veya `always`. `mention` bir ping gerektirir (`mentionedJids` üzerinden gerçek WhatsApp @-bahsetmeleri, güvenli regex kalıpları veya metnin herhangi bir yerindeki botun E.164 numarası). `always` aracıyı her iletide uyandırır, ancak yalnızca anlamlı değer katabildiğinde yanıt vermelidir; aksi halde tam sessiz token olan `NO_REPLY` / `no_reply` değerini döndürür. Varsayılanlar yapılandırmada (`channels.whatsapp.groups`) ayarlanabilir ve grup başına `/activation` ile geçersiz kılınabilir. `channels.whatsapp.groups` ayarlandığında, grup izin listesi olarak da davranır (tümüne izin vermek için `"*"` ekleyin).
- Grup ilkesi: `channels.whatsapp.groupPolicy`, grup iletilerinin kabul edilip edilmeyeceğini denetler (`open|disabled|allowlist`). `allowlist`, `channels.whatsapp.groupAllowFrom` kullanır (yedek: açık `channels.whatsapp.allowFrom`). Varsayılan `allowlist` değeridir (gönderenleri ekleyene kadar engellenir).
- Grup başına oturumlar: oturum anahtarları `agent:<agentId>:whatsapp:group:<jid>` biçimindedir; böylece `/verbose on`, `/trace on` veya `/think high` gibi komutlar (bağımsız iletiler olarak gönderildiklerinde) o gruba kapsamlanır; kişisel DM durumu değişmez. Heartbeat'ler grup yazışmaları için atlanır.
- Bağlam ekleme: bir çalıştırmayı tetiklemeyen **yalnızca bekleyen** grup iletileri (varsayılan 50), `[Chat messages since your last reply - for context]` altında öneklenir; tetikleyen satır ise `[Current message - respond to this]` altında yer alır. Oturumda zaten bulunan iletiler yeniden eklenmez.
- Gönderenin gösterilmesi: her grup toplu iletisi artık `[from: Sender Name (+E164)]` ile biter, böylece OpenClaw kimin konuştuğunu bilir.
- Geçici/bir kez görüntüle: metin/bahsetme çıkarmadan önce bunları açarız; bu nedenle içlerindeki ping'ler yine de tetikler.
- Grup sistem istemi: bir grup oturumunun ilk turunda (ve `/activation` modu değiştirdiğinde) sistem istemine `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` benzeri kısa bir açıklama ekleriz. Meta veri yoksa da aracıya bunun bir grup sohbeti olduğunu söyleriz.

## Yapılandırma örneği (WhatsApp)

WhatsApp metin gövdesindeki görsel `@` işaretini kaldırdığında bile görünen ad ping'lerinin çalışması için `~/.openclaw/openclaw.json` dosyasına bir `groupChat` bloğu ekleyin:

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

- Regex'ler büyük/küçük harfe duyarsızdır ve diğer yapılandırma regex yüzeyleriyle aynı güvenli-regex korumalarını kullanır; geçersiz kalıplar ve güvenli olmayan iç içe tekrarlar yok sayılır.
- Birisi kişiye dokunduğunda WhatsApp hâlâ `mentionedJids` üzerinden kanonik bahsetmeler gönderir; bu yüzden numara yedeği nadiren gerekir, ancak kullanışlı bir güvenlik ağıdır.

### Etkinleştirme komutu (yalnızca sahip)

Grup sohbeti komutunu kullanın:

- `/activation mention`
- `/activation always`

Bunu yalnızca sahip numarası (`channels.whatsapp.allowFrom` içinden veya ayarlanmamışsa botun kendi E.164 numarası) değiştirebilir. Geçerli etkinleştirme modunu görmek için grupta bağımsız ileti olarak `/status` gönderin.

## Nasıl kullanılır

1. WhatsApp hesabınızı (OpenClaw'ı çalıştıran hesap) gruba ekleyin.
2. `@openclaw …` deyin (veya numarayı ekleyin). `groupPolicy: "open"` ayarlamadığınız sürece yalnızca izin listesindeki gönderenler bunu tetikleyebilir.
3. Aracı istemi, doğru kişiye hitap edebilmesi için son grup bağlamını ve sondaki `[from: …]` işaretçisini içerir.
4. Oturum düzeyi yönergeler (`/verbose on`, `/trace on`, `/think high`, `/new` veya `/reset`, `/compact`) yalnızca o grubun oturumuna uygulanır; kaydedilmeleri için bunları bağımsız iletiler olarak gönderin. Kişisel DM oturumunuz bağımsız kalır.

## Test / doğrulama

- Manuel duman testi:
  - Grupta bir `@openclaw` ping'i gönderin ve gönderen adına referans veren bir yanıtı doğrulayın.
  - İkinci bir ping gönderin ve geçmiş bloğunun eklendiğini, ardından sonraki turda temizlendiğini doğrulayın.
- `from: <groupJid>` ve `[from: …]` son ekini gösteren `inbound web message` girdilerini görmek için Gateway günlüklerini kontrol edin (`--verbose` ile çalıştırın).

## Bilinen noktalar

- Gürültülü yayınları önlemek için Heartbeat'ler gruplarda kasıtlı olarak atlanır.
- Yankı bastırma birleşik toplu ileti dizesini kullanır; aynı metni bahsetme olmadan iki kez gönderirseniz yalnızca ilki yanıt alır.
- Oturum deposu girdileri oturum deposunda varsayılan olarak `agent:<agentId>:whatsapp:group:<jid>` biçiminde görünür (`~/.openclaw/agents/<agentId>/sessions/sessions.json`); eksik bir girdi yalnızca grubun henüz bir çalıştırma tetiklemediği anlamına gelir.
- Gruplardaki yazıyor göstergeleri `agents.defaults.typingMode` ayarını izler. Görünür yanıtlar yalnızca ileti aracı moduna dahil edildiğinde, varsayılan olarak yazıyor göstergesi hemen başlar; böylece otomatik nihai yanıt gönderilmese bile grup üyeleri aracının çalıştığını görebilir. Açık yazıyor modu yapılandırması yine de önceliklidir.

## İlgili

- [Gruplar](/tr/channels/groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Yayın grupları](/tr/channels/broadcast-groups)
