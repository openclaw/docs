---
read_when:
    - Gelen mesajların nasıl yanıtlara dönüştüğünü açıklama
    - Oturumları, kuyruklama modlarını veya akış davranışını açıklığa kavuşturma
    - Muhakeme görünürlüğünü ve kullanım etkilerini belgeleme
summary: Mesaj akışı, oturumlar, kuyruklama ve muhakeme görünürlüğü
title: Mesajlar
x-i18n:
    generated_at: "2026-04-26T11:27:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b77d344ed0cab80566582f43127c91ec987e892eeed788aeb9988b377a96e06
    source_path: concepts/messages.md
    workflow: 15
---

Bu sayfa, OpenClaw'ın gelen mesajları, oturumları, kuyruklamayı, akışı ve muhakeme görünürlüğünü nasıl ele aldığını bir araya getirir.

## Mesaj akışı (üst düzey)

```
Gelen mesaj
  -> yönlendirme/bindings -> oturum anahtarı
  -> kuyruk (etkin bir çalıştırma varsa)
  -> ajan çalıştırması (akış + araçlar)
  -> giden yanıtlar (kanal sınırları + parçalama)
```

Temel ayarlar yapılandırmada bulunur:

- Önekler, kuyruklama ve grup davranışı için `messages.*`.
- Blok akışı ve parçalama varsayılanları için `agents.defaults.*`.
- Sınırlar ve akış geçişleri için kanal geçersiz kılmaları (`channels.whatsapp.*`, `channels.telegram.*` vb.).

Tam şema için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

## Gelen tekrar ayıklama

Kanallar yeniden bağlanmalardan sonra aynı mesajı yeniden teslim edebilir. OpenClaw, yinelenen teslimatların başka bir ajan çalıştırmasını tetiklememesi için kanal/hesap/eş/oturum/mesaj kimliğine göre anahtarlanan kısa ömürlü bir önbellek tutar.

## Gelen debounce

**Aynı gönderenden** hızlı art arda gelen mesajlar, `messages.inbound` aracılığıyla tek bir ajan turunda gruplanabilir. Debounce, kanal + konuşma başına kapsamlıdır ve yanıt iş parçacığı/kimlikleri için en son mesajı kullanır.

Yapılandırma (genel varsayılan + kanal başına geçersiz kılmalar):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Notlar:

- Debounce **yalnızca metin** mesajlara uygulanır; medya/ekler hemen boşaltılır.
- Denetim komutları debounce'u atlar ve böylece bağımsız kalır — ancak bir kanal açıkça aynı gönderenli DM birleştirmesine katılıyorsa (ör. [BlueBubbles `coalesceSameSenderDms`](/tr/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), burada DM komutları debounce penceresi içinde bekler; böylece bölünmüş gönderim yükü aynı ajan turuna katılabilir.

## Oturumlar ve cihazlar

Oturumlar istemcilerin değil, Gateway'in sahipliğindedir.

- Doğrudan sohbetler ajanın ana oturum anahtarında birleşir.
- Gruplar/kanallar kendi oturum anahtarlarını alır.
- Oturum deposu ve transkriptler Gateway ana bilgisayarında bulunur.

Birden çok cihaz/kanal aynı oturuma eşlenebilir, ancak geçmiş her istemciye tam olarak geri senkronize edilmez. Öneri: bağlam ayrışmasını önlemek için uzun konuşmalarda birincil tek bir cihaz kullanın. Control UI ve TUI her zaman Gateway destekli oturum transkriptini gösterir; bu yüzden doğruluk kaynağı onlardır.

Ayrıntılar: [Oturum yönetimi](/tr/concepts/session).

## Araç sonucu meta verisi

Araç sonucu `content`, model tarafından görülebilen sonuçtur. Araç sonucu `details` ise UI işleme, tanılama, medya teslimatı ve Plugins için çalışma zamanı meta verisidir.

OpenClaw bu sınırı açık tutar:

- `toolResult.details`, sağlayıcı yeniden oynatımından ve Compaction girdisinden çıkarılır.
- Kalıcı oturum transkriptleri yalnızca sınırlı `details` tutar; büyük boyutlu meta veri, `persistedDetailsTruncated: true` ile işaretlenen kompakt bir özetle değiştirilir.
- Plugins ve araçlar, modelin okuması gereken metni yalnızca `details` içine değil, `content` içine koymalıdır.

## Gelen gövdeler ve geçmiş bağlamı

OpenClaw **istem gövdesini** ile **komut gövdesini** ayırır:

- `Body`: ajana gönderilen istem metni. Bu, kanal zarflarını ve isteğe bağlı geçmiş sarmalayıcılarını içerebilir.
- `CommandBody`: yönerge/komut ayrıştırması için ham kullanıcı metni.
- `RawBody`: `CommandBody` için eski diğer ad (uyumluluk için korunur).

Bir kanal geçmiş sağladığında ortak bir sarmalayıcı kullanır:

- `[Son yanıtınızdan bu yana olan sohbet mesajları - bağlam için]`
- `[Geçerli mesaj - buna yanıt verin]`

**Doğrudan olmayan sohbetlerde** (gruplar/kanallar/odalar), **geçerli mesaj gövdesine** gönderen etiketi öneki eklenir (geçmiş girdileriyle aynı stil). Bu, gerçek zamanlı ve kuyruklu/geçmiş mesajlarını ajan isteminde tutarlı kılar.

Geçmiş tamponları **yalnızca bekleyen** ile sınırlıdır: çalıştırmayı tetiklemeyen grup mesajlarını (örneğin mention geçitlemeli mesajlar) içerir ve oturum transkriptinde zaten bulunan mesajları **hariç tutar**.

Yönerge çıkarma yalnızca **geçerli mesaj** bölümüne uygulanır; böylece geçmiş bozulmadan kalır. Geçmişi saran kanallar `CommandBody` (veya `RawBody`) alanını özgün mesaj metnine ayarlamalı ve `Body` alanını birleşik istem olarak tutmalıdır. Geçmiş tamponları `messages.groupChat.historyLimit` (genel varsayılan) ve `channels.slack.historyLimit` veya `channels.telegram.accounts.<id>.historyLimit` gibi kanal başına geçersiz kılmalarla yapılandırılabilir (devre dışı bırakmak için `0` ayarlayın).

## Kuyruklama ve takip mesajları

Bir çalıştırma zaten etkinse gelen mesajlar kuyruğa alınabilir, geçerli çalıştırmaya yönlendirilebilir veya takip turu için toplanabilir.

- `messages.queue` (ve `messages.queue.byChannel`) ile yapılandırılır.
- Modlar: `interrupt`, `steer`, `followup`, `collect` ve backlog varyantları.

Ayrıntılar: [Kuyruklama](/tr/concepts/queue).

## Akış, parçalama ve toplu gönderim

Blok akışı, model metin blokları ürettikçe kısmi yanıtlar gönderir.
Parçalama, kanal metin sınırlarına uyar ve çevrili kod bloklarını bölmekten kaçınır.

Temel ayarlar:

- `agents.defaults.blockStreamingDefault` (`on|off`, varsayılan off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (boşta kalma tabanlı toplu gönderim)
- `agents.defaults.humanDelay` (blok yanıtları arasında insan benzeri duraklama)
- Kanal geçersiz kılmaları: `*.blockStreaming` ve `*.blockStreamingCoalesce` (Telegram dışı kanallar açık `*.blockStreaming: true` gerektirir)

Ayrıntılar: [Akış + parçalama](/tr/concepts/streaming).

## Muhakeme görünürlüğü ve token'lar

OpenClaw, model muhakemesini açığa çıkarabilir veya gizleyebilir:

- `/reasoning on|off|stream`, görünürlüğü denetler.
- Muhakeme içeriği, model tarafından üretildiğinde yine de token kullanımına dahil olur.
- Telegram, taslak balonunda muhakeme akışını destekler.

Ayrıntılar: [Thinking + muhakeme yönergeleri](/tr/tools/thinking) ve [Token kullanımı](/tr/reference/token-use).

## Önekler, başlıklandırma ve yanıtlar

Giden mesaj biçimlendirmesi `messages` altında merkezileştirilmiştir:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` ve `channels.<channel>.accounts.<id>.responsePrefix` (giden önek kademesi), ayrıca `channels.whatsapp.messagePrefix` (WhatsApp gelen öneki)
- `replyToMode` ve kanal başına varsayılanlar aracılığıyla yanıt başlıklandırması

Ayrıntılar: [Yapılandırma](/tr/gateway/config-agents#messages) ve kanal belgeleri.

## Sessiz yanıtlar

Tam sessiz token `NO_REPLY` / `no_reply`, “kullanıcıya görünür bir yanıt teslim etme” anlamına gelir.
Bir turda üretilen TTS sesi gibi bekleyen araç medyası da varsa OpenClaw sessiz metni kaldırır ama medya ekini yine de teslim eder.
OpenClaw bu davranışı konuşma türüne göre çözümler:

- Doğrudan konuşmalar varsayılan olarak sessizliğe izin vermez ve yalın sessiz yanıtı kısa, görünür bir geri dönüşe yeniden yazar.
- Gruplar/kanallar varsayılan olarak sessizliğe izin verir.
- Dahili orkestrasyon varsayılan olarak sessizliğe izin verir.

OpenClaw ayrıca, doğrudan olmayan sohbetlerde herhangi bir asistan yanıtından önce gerçekleşen dahili çalıştırıcı hataları için sessiz yanıtlar kullanır; böylece gruplar/kanallar Gateway hata şablonunu görmez. Doğrudan sohbetler varsayılan olarak kompakt hata metni gösterir; ham çalıştırıcı ayrıntıları yalnızca `/verbose`, `on` veya `full` olduğunda gösterilir.

Varsayılanlar `agents.defaults.silentReply` ve `agents.defaults.silentReplyRewrite` altında bulunur; `surfaces.<id>.silentReply` ve `surfaces.<id>.silentReplyRewrite` bunları yüzey başına geçersiz kılabilir.

Üst oturumda bekleyen bir veya daha fazla oluşturulmuş alt ajan çalıştırması olduğunda, yalın sessiz yanıtlar yeniden yazılmak yerine tüm yüzeylerde düşürülür; böylece çocuk tamamlanma olayı gerçek yanıtı teslim edene kadar üst oturum sessiz kalır.

## İlgili

- [Akış](/tr/concepts/streaming) — gerçek zamanlı mesaj teslimatı
- [Yeniden deneme](/tr/concepts/retry) — mesaj teslimi yeniden deneme davranışı
- [Kuyruk](/tr/concepts/queue) — mesaj işleme kuyruğu
- [Kanallar](/tr/channels) — mesajlaşma platformu entegrasyonları
