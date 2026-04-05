---
read_when:
    - Gelen mesajların nasıl yanıtlara dönüştüğünü açıklama
    - Oturumları, kuyruğa alma modlarını veya akış davranışını netleştirme
    - Muhakeme görünürlüğünü ve kullanım etkilerini belgeleme
summary: Mesaj akışı, oturumlar, kuyruğa alma ve muhakeme görünürlüğü
title: Mesajlar
x-i18n:
    generated_at: "2026-04-05T13:51:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475f892bd534fdb10a2ee5d3c57a3d4a7fb8e1ab68d695189ba186004713f6f3
    source_path: concepts/messages.md
    workflow: 15
---

# Mesajlar

Bu sayfa, OpenClaw’ın gelen mesajları, oturumları, kuyruğa almayı,
akışı ve muhakeme görünürlüğünü nasıl işlediğini bir araya getirir.

## Mesaj akışı (üst düzey)

```
Gelen mesaj
  -> yönlendirme/bağlamalar -> oturum anahtarı
  -> kuyruk (bir çalıştırma etkinse)
  -> agent çalıştırması (akış + araçlar)
  -> giden yanıtlar (kanal sınırları + parçalara ayırma)
```

Temel ayarlar yapılandırmada bulunur:

- Önekler, kuyruğa alma ve grup davranışı için `messages.*`.
- Blok akışı ve parçalara ayırma varsayılanları için `agents.defaults.*`.
- Sınırlar ve akış geçişleri için kanal geçersiz kılmaları (`channels.whatsapp.*`, `channels.telegram.*` vb.).

Tam şema için [Configuration](/gateway/configuration) belgesine bakın.

## Gelen yinelenenleri kaldırma

Kanallar, yeniden bağlanmalardan sonra aynı mesajı yeniden teslim edebilir. OpenClaw,
kanal/hesap/eş/oturum/mesaj kimliğine göre anahtarlanmış kısa ömürlü bir önbellek tutar; böylece
yinelenen teslimatlar başka bir agent çalıştırmasını tetiklemez.

## Gelen debounce işlemi

**Aynı göndericiden** hızlı arka arkaya gelen mesajlar, `messages.inbound` aracılığıyla
tek bir agent dönüşü içinde gruplanabilir. Debounce, kanal + konuşma başına kapsamlandırılır
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

- Debounce yalnızca **metin tabanlı** mesajlara uygulanır; medya/ekler hemen boşaltılır.
- Denetim komutları debounce’u atlar; böylece bağımsız kalırlar.

## Oturumlar ve cihazlar

Oturumlar istemcilere değil, gateway’e aittir.

- Doğrudan sohbetler agent ana oturum anahtarında birleşir.
- Gruplar/kanallar kendi oturum anahtarlarını alır.
- Oturum deposu ve transkriptler gateway ana bilgisayarında bulunur.

Birden fazla cihaz/kanal aynı oturuma eşlenebilir, ancak geçmiş her istemciye tam olarak
geri senkronize edilmez. Öneri: ayrışan bağlamı önlemek için uzun konuşmalarda
tek bir birincil cihaz kullanın. Control UI ve TUI her zaman gateway destekli
oturum transkriptini gösterir; dolayısıyla doğruluk kaynağı bunlardır.

Ayrıntılar: [Session management](/concepts/session).

## Gelen gövdeler ve geçmiş bağlamı

OpenClaw, **istem gövdesini** ve **komut gövdesini** ayırır:

- `Body`: agent’a gönderilen istem metni. Buna kanal zarfları ve
  isteğe bağlı geçmiş sarmalayıcıları dahil olabilir.
- `CommandBody`: yönerge/komut ayrıştırması için ham kullanıcı metni.
- `RawBody`: `CommandBody` için eski takma ad (uyumluluk için korunur).

Bir kanal geçmiş sağladığında, ortak bir sarmalayıcı kullanır:

- `[Son yanıtınızdan bu yana sohbet mesajları - bağlam için]`
- `[Geçerli mesaj - buna yanıt verin]`

**Doğrudan olmayan sohbetlerde** (gruplar/kanallar/odalar), **geçerli mesaj gövdesinin** başına
gönderici etiketi eklenir (geçmiş girdileri için kullanılan aynı stil). Bu, gerçek zamanlı ve kuyruktaki/geçmiş
mesajları agent isteminde tutarlı hale getirir.

Geçmiş arabellekleri **yalnızca bekleyenleri** içerir: bunlar, çalıştırmayı _tetiklemeyen_
grup mesajlarını da içerir (örneğin mention kapılı mesajlar) ve oturum
transkriptinde zaten bulunan mesajları **hariç tutar**.

Yönerge ayıklama yalnızca **geçerli mesaj** bölümüne uygulanır; böylece geçmiş
bozulmadan kalır. Geçmişi sarmalayan kanallar, `CommandBody` (veya
`RawBody`) alanını özgün mesaj metni olarak ayarlamalı ve `Body` alanını birleşik istem olarak korumalıdır.
Geçmiş arabellekleri `messages.groupChat.historyLimit` (genel
varsayılan) ve `channels.slack.historyLimit` veya
`channels.telegram.accounts.<id>.historyLimit` gibi kanal başına geçersiz kılmalarla yapılandırılabilir (`0` devre dışı bırakır).

## Kuyruğa alma ve takipler

Bir çalıştırma zaten etkinse, gelen mesajlar kuyruğa alınabilir, geçerli
çalıştırmaya yönlendirilebilir veya takip dönüşü için toplanabilir.

- `messages.queue` (ve `messages.queue.byChannel`) üzerinden yapılandırılır.
- Modlar: `interrupt`, `steer`, `followup`, `collect` ve backlog varyantları.

Ayrıntılar: [Queueing](/concepts/queue).

## Akış, parçalara ayırma ve toplu gönderim

Blok akışı, model metin blokları ürettikçe kısmi yanıtlar gönderir.
Parçalara ayırma, kanal metin sınırlarına uyar ve çitlenmiş kodu bölmekten kaçınır.

Temel ayarlar:

- `agents.defaults.blockStreamingDefault` (`on|off`, varsayılan kapalı)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (boşta kalma tabanlı toplu gönderim)
- `agents.defaults.humanDelay` (blok yanıtları arasında insan benzeri duraklama)
- Kanal geçersiz kılmaları: `*.blockStreaming` ve `*.blockStreamingCoalesce` (Telegram dışı kanallar açık `*.blockStreaming: true` gerektirir)

Ayrıntılar: [Streaming + chunking](/concepts/streaming).

## Muhakeme görünürlüğü ve token’lar

OpenClaw, model muhakemesini gösterebilir veya gizleyebilir:

- `/reasoning on|off|stream` görünürlüğü denetler.
- Muhakeme içeriği, model tarafından üretildiğinde yine de token kullanımına dahil edilir.
- Telegram, muhakeme akışını taslak balonunda destekler.

Ayrıntılar: [Thinking + reasoning directives](/tools/thinking) ve [Token use](/reference/token-use).

## Önekler, iş parçacıkları ve yanıtlar

Giden mesaj biçimlendirmesi `messages` içinde merkezileştirilmiştir:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` ve `channels.<channel>.accounts.<id>.responsePrefix` (giden önek zinciri) ile `channels.whatsapp.messagePrefix` (WhatsApp gelen öneki)
- `replyToMode` ve kanal başına varsayılanlar aracılığıyla yanıt iş parçacıkları

Ayrıntılar: [Configuration](/gateway/configuration-reference#messages) ve kanal belgeleri.

## İlgili

- [Streaming](/concepts/streaming) — gerçek zamanlı mesaj teslimi
- [Retry](/concepts/retry) — mesaj teslimi yeniden deneme davranışı
- [Queue](/concepts/queue) — mesaj işleme kuyruğu
- [Channels](/tr/channels) — mesajlaşma platformu entegrasyonları
