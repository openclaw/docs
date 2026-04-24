---
read_when:
    - Gelen mesajların nasıl yanıta dönüştüğünü açıklama
    - Oturumları, kuyruk modlarını veya akış davranışını netleştirme
    - Akıl yürütme görünürlüğünü ve kullanım etkilerini belgeleme
summary: Mesaj akışı, oturumlar, kuyruklama ve akıl yürütme görünürlüğü
title: Mesajlar
x-i18n:
    generated_at: "2026-04-24T09:05:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22a154246f47b5841dc9d4b9f8e3c5698e5e56bc0b2dbafe19fec45799dbbba9
    source_path: concepts/messages.md
    workflow: 15
---

Bu sayfa, OpenClaw'ın gelen mesajları, oturumları, kuyruklamayı,
akışı ve akıl yürütme görünürlüğünü nasıl ele aldığını bir araya getirir.

## Mesaj akışı (üst düzey)

```
Gelen mesaj
  -> yönlendirme/bindings -> oturum anahtarı
  -> kuyruk (bir çalıştırma etkinse)
  -> ajan çalıştırması (akış + araçlar)
  -> giden yanıtlar (kanal sınırları + parçalama)
```

Temel ayarlar yapılandırmada bulunur:

- önekler, kuyruklama ve grup davranışı için `messages.*`
- blok akışı ve parçalama varsayılanları için `agents.defaults.*`
- üst sınırlar ve akış geçişleri için kanal geçersiz kılmaları (`channels.whatsapp.*`, `channels.telegram.*` vb.)

Tam şema için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

## Gelen yineleme önleme

Kanallar, yeniden bağlanmalardan sonra aynı mesajı yeniden teslim edebilir. OpenClaw,
yinelenen teslimlerin başka bir ajan çalıştırmasını tetiklememesi için kanal/hesap/eş düzeyi/oturum/mesaj kimliği anahtarlı
kısa ömürlü bir önbellek tutar.

## Gelen debounce

**Aynı gönderenden** hızla art arda gelen mesajlar, `messages.inbound` aracılığıyla tek bir
ajan dönüşünde toplu işlenebilir. Debounce kanal + konuşma başına kapsamlanır
ve yanıt iş parçacığı/kimlikleri için en son mesajı kullanır.

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

- Debounce **yalnızca metin** mesajlarına uygulanır; medya/ekler hemen boşaltılır.
- Denetim komutları, bağımsız kalmaları için debounce'u atlar — **ancak** bir kanal açıkça aynı gönderenin DM birleştirmesine katılırsa (ör. [BlueBubbles `coalesceSameSenderDms`](/tr/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), bölünmüş gönderim yükünün aynı ajan dönüşüne katılabilmesi için DM komutları debounce penceresi içinde bekler.

## Oturumlar ve cihazlar

Oturumlar istemcilere değil, Gateway'e aittir.

- Doğrudan sohbetler ajanın ana oturum anahtarında birleşir.
- Gruplar/kanallar kendi oturum anahtarlarını alır.
- Oturum deposu ve transkriptler Gateway ana makinesinde bulunur.

Birden çok cihaz/kanal aynı oturuma eşlenebilir, ancak geçmiş her istemciye tam olarak
senkronize edilmez. Öneri: ayrışan bağlamdan kaçınmak için uzun konuşmalarda tek birincil cihaz kullanın. Control UI ve TUI her zaman
Gateway destekli oturum transkriptini gösterir, bu yüzden doğruluk kaynağı onlardır.

Ayrıntılar: [Oturum yönetimi](/tr/concepts/session).

## Gelen gövdeler ve geçmiş bağlamı

OpenClaw, **istem gövdesi** ile **komut gövdesini** ayırır:

- `Body`: ajana gönderilen istem metni. Bu, kanal zarflarını ve
  isteğe bağlı geçmiş sarmalayıcılarını içerebilir.
- `CommandBody`: yönerge/komut ayrıştırması için ham kullanıcı metni.
- `RawBody`: `CommandBody` için eski takma ad (uyumluluk için korunur).

Bir kanal geçmiş sağladığında, paylaşılan bir sarmalayıcı kullanır:

- `[Son yanıtınızdan beri gelen sohbet mesajları - bağlam için]`
- `[Geçerli mesaj - buna yanıt verin]`

**Doğrudan olmayan sohbetlerde** (gruplar/kanallar/odalar), **geçerli mesaj gövdesinin** başına
gönderen etiketi eklenir (geçmiş girdileriyle aynı stil). Bu, gerçek zamanlı ve kuyruklanmış/geçmiş
mesajlarını ajan isteminde tutarlı tutar.

Geçmiş arabellekleri **yalnızca bekleyenler** içindir: çalıştırmayı _tetiklemeyen_
grup mesajlarını içerir (örneğin, bahsetme geçidinden geçen mesajlar değil) ve
zaten oturum transkriptinde bulunan mesajları **hariç tutar**.

Yönerge ayıklama yalnızca **geçerli mesaj** bölümüne uygulanır; böylece geçmiş
bozulmadan kalır. Geçmişi saran kanallar, `CommandBody` (veya
`RawBody`) değerini özgün mesaj metnine ayarlamalı ve `Body` değerini birleşik istem olarak tutmalıdır.
Geçmiş arabellekleri `messages.groupChat.historyLimit` (genel
varsayılan) ve `channels.slack.historyLimit` veya
`channels.telegram.accounts.<id>.historyLimit` gibi kanal başına geçersiz kılmalarla yapılandırılır (`0` devre dışı bırakır).

## Kuyruklama ve takip mesajları

Bir çalıştırma zaten etkinken, gelen mesajlar kuyruklanabilir, geçerli
çalıştırmaya yönlendirilebilir veya takip dönüşü için toplanabilir.

- `messages.queue` (ve `messages.queue.byChannel`) ile yapılandırılır.
- Modlar: `interrupt`, `steer`, `followup`, `collect` ve backlog varyantları.

Ayrıntılar: [Kuyruklama](/tr/concepts/queue).

## Akış, parçalama ve toplu gönderim

Blok akışı, model metin blokları ürettikçe kısmi yanıtlar gönderir.
Parçalama, kanal metin sınırlarına uyar ve çitle çevrili kodu bölmekten kaçınır.

Temel ayarlar:

- `agents.defaults.blockStreamingDefault` (`on|off`, varsayılan kapalı)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (boşta kalma tabanlı toplu gönderim)
- `agents.defaults.humanDelay` (blok yanıtları arasında insan benzeri duraklama)
- Kanal geçersiz kılmaları: `*.blockStreaming` ve `*.blockStreamingCoalesce` (Telegram dışı kanallar açık `*.blockStreaming: true` gerektirir)

Ayrıntılar: [Akış + parçalama](/tr/concepts/streaming).

## Akıl yürütme görünürlüğü ve token'lar

OpenClaw, model akıl yürütmesini görünür yapabilir veya gizleyebilir:

- `/reasoning on|off|stream` görünürlüğü kontrol eder.
- Model tarafından üretildiğinde akıl yürütme içeriği yine de token kullanımına sayılır.
- Telegram, taslak baloncuğu içine akıl yürütme akışını destekler.

Ayrıntılar: [Düşünme + akıl yürütme yönergeleri](/tr/tools/thinking) ve [Token kullanımı](/tr/reference/token-use).

## Önekler, iş parçacıkları ve yanıtlar

Giden mesaj biçimlendirmesi `messages` altında merkezileştirilmiştir:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` ve `channels.<channel>.accounts.<id>.responsePrefix` (giden önek zinciri), ayrıca `channels.whatsapp.messagePrefix` (WhatsApp gelen öneki)
- `replyToMode` ve kanal başına varsayılanlarla yanıt iş parçacığı

Ayrıntılar: [Yapılandırma](/tr/gateway/config-agents#messages) ve kanal belgeleri.

## Sessiz yanıtlar

Tam sessiz belirteç `NO_REPLY` / `no_reply`, “kullanıcıya görünür bir yanıt teslim etme” anlamına gelir.
OpenClaw bu davranışı konuşma türüne göre çözümler:

- Doğrudan konuşmalar varsayılan olarak sessizliğe izin vermez ve çıplak sessiz
  yanıtı kısa, görünür bir yedeğe yeniden yazar.
- Gruplar/kanallar varsayılan olarak sessizliğe izin verir.
- Dahili orkestrasyon varsayılan olarak sessizliğe izin verir.

Varsayılanlar `agents.defaults.silentReply` ve
`agents.defaults.silentReplyRewrite` altında bulunur; `surfaces.<id>.silentReply` ve
`surfaces.<id>.silentReplyRewrite` bunları yüzey başına geçersiz kılabilir.

Üst oturumda bekleyen bir veya daha fazla başlatılmış alt ajan çalıştırması varsa,
gerçek yanıt çocuk tamamlanma olayıyla teslim edilene kadar üst
oturum sessiz kalsın diye, çıplak sessiz yanıtlar yeniden yazılmak yerine tüm yüzeylerde düşürülür.

## İlgili

- [Akış](/tr/concepts/streaming) — gerçek zamanlı mesaj teslimi
- [Yeniden deneme](/tr/concepts/retry) — mesaj teslim yeniden deneme davranışı
- [Kuyruk](/tr/concepts/queue) — mesaj işleme kuyruğu
- [Kanallar](/tr/channels) — mesajlaşma platformu entegrasyonları
