---
read_when:
    - WhatsApp gruplarını özel olarak yapılandırma
    - WhatsApp etkinleştirme modlarını değiştirme (`mention` ile `always`)
    - WhatsApp grup oturumu anahtarlarını veya bekleyen mesaj bağlamını ayarlama
sidebarTitle: WhatsApp groups
summary: WhatsApp grup mesajı işleme — etkinleştirme, izin listeleri, oturumlar ve bağlam ekleme
title: WhatsApp grup mesajları
x-i18n:
    generated_at: "2026-07-16T16:48:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd1adb379a4cae4ee9b4b9950d7519e62e1fc0e72ece25ec1b337ee3cb803cda
    source_path: channels/group-messages.md
    workflow: 16
---

Kanallar arası gruplar modeli (Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo) için [Gruplar](/tr/channels/groups) sayfasına bakın. Bu sayfa, söz konusu modelin üzerindeki WhatsApp'a özgü davranışları ele alır: etkinleştirme, grup izin listeleri, grup başına oturum anahtarları ve bekleyen mesaj bağlamının eklenmesi.

Amaç: OpenClaw'ın WhatsApp gruplarında bulunmasını, yalnızca kendisine seslenildiğinde etkinleşmesini ve bu yazışmayı kişisel DM oturumundan ayrı tutmasını sağlamak.

<Note>
`agents.list[].groupChat.mentionPatterns`, diğer kanalların bahsetme geçidiyle paylaşılır. Çoklu ajan kurulumlarında bunu ajan başına ayarlayın veya genel geri dönüş olarak `messages.groupChat.mentionPatterns` kullanın. İkisi de ayarlanmamışsa kalıplar, ajan kimliğinin adından/emojisinden türetilir.
</Note>

## Davranış

- Etkinleştirme modları: `mention` (varsayılan) veya `always`. `mention` bir seslenme gerektirir: gerçek bir WhatsApp @-bahsetmesi (`mentionedJids`), yapılandırılmış bir regex kalıbı, metnin herhangi bir yerinde botun E.164 rakamları veya botun mesajlarından birine alıntılı yanıt (paylaşılan numarayla kendi kendine sohbet kurulumları hariç). `always` ajanı her mesajda etkinleştirir; ancak eklenen grup istemi, yalnızca değer kattığında yanıt vermesini, aksi hâlde tam sessiz belirteç olan `NO_REPLY` değerini (büyük/küçük harfe duyarsız) döndürmesini söyler. Varsayılanlar yapılandırmadan (`channels.whatsapp.groups` `requireMention`) gelir ve `/activation` aracılığıyla grup başına geçersiz kılınabilir.
- Grup izin listesi: `channels.whatsapp.groups` ayarlandığında yalnızca listelenen grup JID'leri kabul edilir (tümüne izin vermek için `"*"` ekleyin); listelenmeyen gruplardan gelen mesajlar bir günlük ipucuyla bırakılır.
- Grup ilkesi: `channels.whatsapp.groupPolicy`, grup mesajlarının kabul edilip edilmediğini denetler (`open|disabled|allowlist`). `allowlist`, `channels.whatsapp.groupAllowFrom` değerini kullanır (geri dönüş: açıkça belirtilen `channels.whatsapp.allowFrom`). Varsayılan `allowlist` değeridir (gönderen ekleyene kadar engellenir).
- Grup başına oturumlar: oturum anahtarları `agent:<agentId>:whatsapp:group:<jid>` biçimindedir (varsayılan olmayan hesaplar `:thread:whatsapp-account-<accountId>` ekler); dolayısıyla bağımsız mesaj olarak gönderilen `/verbose on`, `/trace on` veya `/think high` gibi yönergeler yalnızca o grup kapsamında geçerlidir; kişisel DM durumu değişmez.
- Bağlam ekleme: bir çalıştırmayı _tetiklememiş_, **yalnızca bekleyen** grup mesajları (varsayılan 50), `[Chat messages since your last reply - for context]` altında; tetikleyen satır ise `[Current message - respond to this]` altında başa eklenir. Bekleyenler penceresi çalıştırmadan sonra temizlenir; oturumda zaten bulunan mesajlar yeniden eklenmez.
- Gönderen ilişkilendirmesi: her grup satırı, mesaj zarfında gönderen etiketini taşır; ör. `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`. Gönderen kimliği ile grup konusu/üyeleri de güvenilmeyen konuşma meta verileri bloğunda iletilir.
- Geçici/bir kez görüntülenebilir: metin/bahsetmeler ayıklanmadan önce sarmalayıcılar açılır; böylece bunların içindeki seslenmeler yine tetikleme yapar.
- Grup sistem istemi: bir grup oturumunun ilk turunda (ve `/activation` modu değiştirdikten sonraki her turda), sistem istemine etkinleştirme yönlendirmesi eklenir (`Activation: trigger-only ...` veya `Activation: always-on ...`; ayrıca "belirli gönderene hitap et"). Kalıcı grup sohbeti teslimat yönlendirmesi ("Bir WhatsApp grup sohbetindesiniz...") her zaman eklenir.

## Yapılandırma örneği (WhatsApp)

WhatsApp, görsel `@` öğesini metin gövdesinden çıkarsa bile görünen adla seslenmelerin çalışmasını sağlayın:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // bekleyen grup bağlamı penceresi (varsayılan 50)
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Notlar:

- Regex'ler büyük/küçük harfe duyarsızdır ve diğer yapılandırma regex yüzeyleriyle aynı güvenli regex korumalarını kullanır; geçersiz kalıplar ve güvenli olmayan iç içe yinelemeler yok sayılır.
- Birisi kişiye dokunduğunda WhatsApp, standart bahsetmeleri yine `mentionedJids` aracılığıyla gönderir; bu nedenle numara geri dönüşüne nadiren ihtiyaç duyulur, ancak kullanışlı bir güvenlik ağıdır.
- Bekleyen bağlam penceresi `channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50 sırasıyla çözümlenir.

### Etkinleştirme komutu (yalnızca sahip)

Grup sohbeti komutunu kullanın:

- `/activation mention`
- `/activation always`

Bunu yalnızca sahip numaraları (`channels.whatsapp.allowFrom` içinden veya ayarlanmamışsa botun kendi E.164 numarası) değiştirebilir; başka birinden gelen `/activation` yok sayılır ve yalnızca bağlam olarak saklanır. Geçerli etkinleştirme modunu görmek için grupta `/status` değerini bağımsız bir mesaj olarak gönderin.

## Kullanım

1. WhatsApp hesabınızı (OpenClaw'ı çalıştıran hesabı) gruba ekleyin.
2. `@openclaw ...` deyin (veya numarayı ekleyin). `groupPolicy: "open"` ayarlamadığınız sürece yalnızca izin listesindeki gönderenler bunu tetikleyebilir.
3. Ajan istemi, doğru kişiye hitap edebilmesi için bekleyen grup bağlamını ve gönderen etiketli satırları içerir.
4. Oturum yönergeleri (`/verbose on`, `/trace on`, `/think high`, `/new` veya `/reset`, `/compact`) yalnızca o grubun oturumuna uygulanır; kaydedilmeleri için bunları bağımsız mesajlar olarak gönderin. Kişisel DM oturumunuz bağımsız kalır.

## Test / doğrulama

- Manuel hızlı kontrol:
  - Grupta bir `@openclaw` seslenmesi gönderin ve gönderen adına atıfta bulunan bir yanıt geldiğini doğrulayın.
  - İkinci bir seslenme gönderin ve geçmiş bloğunun eklendiğini, ardından bir sonraki turda temizlendiğini doğrulayın.
- `from: <groupJid>` ve gönderen etiketli gövdeyi gösteren `inbound web message` girdileri için Gateway günlüklerini (`--verbose` ile çalıştırın) kontrol edin.

## Bilinen hususlar

- Heartbeat'ler ajanın ana oturumunda çalışır; grup oturumlarında hiçbir zaman Heartbeat çalıştırması yapılmaz.
- Yankı önleme, botun teslim edilen kendi mesajlarının yeniden tetikleme yapmaması için birleştirilmiş istemi (geçmiş + geçerli mesaj) oturum başına hatırlar; aynı yinelenen toplu ileti yankı olarak atlanabilir.
- Oturum deposu girdileri, ajan başına SQLite oturum deposunda `agent:<agentId>:whatsapp:group:<jid>` olarak görünür; bir girdinin bulunmaması yalnızca grubun henüz bir çalıştırmayı tetiklemediği anlamına gelir.
- Yazıyor göstergeleri `session.typingMode` / `agents.defaults.typingMode` ayarlarını izler. Görünür yanıtlar yalnızca mesaj aracı moduna dahil edildiğinde, varsayılan olarak yazıyor göstergesi hemen başlar; böylece otomatik bir nihai yanıt gönderilmese bile grup üyeleri ajanın çalıştığını görebilir. Açık yazma modu yapılandırması yine önceliklidir.

## İlgili

- [Gruplar](/tr/channels/groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Yayın grupları](/tr/channels/broadcast-groups)
