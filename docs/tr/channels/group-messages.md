---
read_when:
    - Grup mesajı kurallarını veya bahsetmeleri değiştirirken
summary: WhatsApp grup mesajı işleme için davranış ve yapılandırma (`mentionPatterns` yüzeyler arasında paylaşılır)
title: Grup Mesajları
x-i18n:
    generated_at: "2026-04-05T13:43:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2543be5bc4c6f188f955df580a6fef585ecbfc1be36ade5d34b1a9157e021bc5
    source_path: channels/group-messages.md
    workflow: 15
---

# Grup mesajları (WhatsApp web kanalı)

Amaç: Clawd'un WhatsApp gruplarında bulunmasını sağlamak, yalnızca pinglendiğinde uyanmak ve o ileti dizisini kişisel DM oturumundan ayrı tutmak.

Not: `agents.list[].groupChat.mentionPatterns` artık Telegram/Discord/Slack/iMessage tarafından da kullanılıyor; bu belge WhatsApp'e özgü davranışa odaklanır. Çoklu ajan kurulumlarında `agents.list[].groupChat.mentionPatterns` değerini ajan başına ayarlayın (veya genel bir geri dönüş olarak `messages.groupChat.mentionPatterns` kullanın).

## Geçerli uygulama (2025-12-03)

- Etkinleştirme kipleri: `mention` (varsayılan) veya `always`. `mention`, bir ping gerektirir (gerçek WhatsApp @ bahsetmeleri `mentionedJids` üzerinden, güvenli regex kalıpları veya metnin herhangi bir yerinde botun E.164 numarası). `always`, ajanı her mesajda uyandırır ancak yalnızca anlamlı bir katkı sağlayabildiğinde yanıt vermelidir; aksi takdirde tam olarak `NO_REPLY` / `no_reply` sessiz belirtecini döndürür. Varsayılanlar yapılandırmada (`channels.whatsapp.groups`) ayarlanabilir ve grup başına `/activation` ile geçersiz kılınabilir. `channels.whatsapp.groups` ayarlandığında aynı zamanda grup izin listesi olarak da davranır (tümüne izin vermek için `"*"` ekleyin).
- Grup ilkesi: `channels.whatsapp.groupPolicy`, grup mesajlarının kabul edilip edilmeyeceğini kontrol eder (`open|disabled|allowlist`). `allowlist`, `channels.whatsapp.groupAllowFrom` kullanır (geri dönüş: açık `channels.whatsapp.allowFrom`). Varsayılan `allowlist`tir (gönderenleri ekleyene kadar engellenir).
- Grup başına oturumlar: oturum anahtarları `agent:<agentId>:whatsapp:group:<jid>` biçimindedir; böylece `/verbose on` veya `/think high` gibi komutlar (bağımsız mesajlar olarak gönderildiğinde) o gruba özel kapsamda olur; kişisel DM durumu etkilenmez. Heartbeat grup ileti dizileri için atlanır.
- Bağlam ekleme: bir çalıştırmayı _tetiklememiş_ **yalnızca bekleyen** grup mesajları (varsayılan 50), `[Chat messages since your last reply - for context]` altında öneklenir; tetikleyen satır ise `[Current message - respond to this]` altında yer alır. Oturumda zaten bulunan mesajlar yeniden eklenmez.
- Gönderenin gösterilmesi: artık her grup toplu mesajı `[from: Gönderen Adı (+E164)]` ile biter, böylece Pi kimin konuştuğunu bilir.
- Geçici/view-once: metin/bahsetme ayıklamadan önce bunları açarız, böylece içlerindeki ping'ler de tetiklenir.
- Grup sistem istemi: bir grup oturumunun ilk turunda (ve `/activation` kip değişikliğinde) sistem istemine şu gibi kısa bir metin ekleriz: `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Meta veriler mevcut değilse yine de ajana bunun bir grup sohbeti olduğunu söyleriz.

## Yapılandırma örneği (WhatsApp)

WhatsApp metin gövdesinde görsel `@` işaretini kaldırsa bile görünen adla ping'lerin çalışması için `~/.openclaw/openclaw.json` dosyasına bir `groupChat` bloğu ekleyin:

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

- Regex'ler büyük/küçük harfe duyarsızdır ve diğer yapılandırma regex yüzeyleriyle aynı güvenli regex korumalarını kullanır; geçersiz kalıplar ve güvenli olmayan iç içe tekrarlar yok sayılır.
- Birisi kişiye dokunduğunda WhatsApp yine de `mentionedJids` üzerinden kanonik bahsetmeler gönderir; bu yüzden numara geri dönüşü nadiren gerekir ama yararlı bir güvenlik ağıdır.

### Etkinleştirme komutu (yalnızca sahip)

Grup sohbeti komutunu kullanın:

- `/activation mention`
- `/activation always`

Bunu yalnızca sahip numarası (`channels.whatsapp.allowFrom` içinden veya ayarlanmamışsa botun kendi E.164 numarası) değiştirebilir. Geçerli etkinleştirme kipini görmek için grupta bağımsız mesaj olarak `/status` gönderin.

## Nasıl kullanılır

1. WhatsApp hesabınızı (OpenClaw çalıştıran hesabı) gruba ekleyin.
2. `@openclaw …` deyin (veya numarayı ekleyin). `groupPolicy: "open"` ayarlamadığınız sürece yalnızca izin listesindeki gönderenler bunu tetikleyebilir.
3. Ajan istemi, doğru kişiye hitap edebilmesi için son grup bağlamını ve sondaki `[from: …]` işaretini içerecektir.
4. Oturum düzeyindeki yönergeler (`/verbose on`, `/think high`, `/new` veya `/reset`, `/compact`) yalnızca o grubun oturumuna uygulanır; kaydolmaları için bunları bağımsız mesajlar olarak gönderin. Kişisel DM oturumunuz bağımsız kalır.

## Test / doğrulama

- Manuel smoke testi:
  - Grupta bir `@openclaw` pingi gönderin ve gönderen adına atıfta bulunan bir yanıtı doğrulayın.
  - İkinci bir ping gönderin ve geçmiş bloğunun eklendiğini, ardından sonraki turda temizlendiğini doğrulayın.
- `from: <groupJid>` ve `[from: …]` son ekini gösteren `inbound web message` girdilerini görmek için gateway günlüklerini kontrol edin (`--verbose` ile çalıştırın).

## Bilinen hususlar

- Gürültülü yayınlardan kaçınmak için Heartbeat gruplar için bilerek atlanır.
- Yankı bastırma, birleştirilmiş toplu dizeyi kullanır; aynı metni bahsetme olmadan iki kez gönderirseniz yalnızca ilkine yanıt gelir.
- Oturum deposu girdileri, oturum deposunda (`~/.openclaw/agents/<agentId>/sessions/sessions.json` varsayılan olarak) `agent:<agentId>:whatsapp:group:<jid>` olarak görünür; eksik bir girdi yalnızca grubun henüz bir çalıştırmayı tetiklemediği anlamına gelir.
- Gruplardaki yazıyor göstergeleri `agents.defaults.typingMode` ayarını izler (varsayılan: bahsedilmediğinde `message`).
