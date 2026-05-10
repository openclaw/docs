---
read_when:
    - BlueBubbles'tan birlikte gelen iMessage Plugin'ine geçişi planlama
    - BlueBubbles yapılandırma anahtarlarını iMessage eşdeğerlerine çevirme
    - iMessage Plugin'ini etkinleştirmeden önce imsg'yi doğrulama
summary: Eski BlueBubbles yapılandırmalarını eşleştirmeyi, izin listelerini veya grup bağlamalarını kaybetmeden pakete dahil iMessage Plugin’ine taşıyın.
title: BlueBubbles'tan geçiş
x-i18n:
    generated_at: "2026-05-10T19:21:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81ce77d7fe2d6fe054c1457e14624ebd2aba02f69ed7bc2cfb242cdb1de38a1e
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Birlikte gelen `imessage` Plugin'i artık [`steipete/imsg`](https://github.com/steipete/imsg)'yi JSON-RPC üzerinden çalıştırarak BlueBubbles ile aynı özel API yüzeyine (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, grup yönetimi, ekler) erişiyor. Zaten `imsg` kurulu bir Mac çalıştırıyorsanız BlueBubbles sunucusunu bırakabilir ve Plugin'in doğrudan Messages.app ile konuşmasını sağlayabilirsiniz.

BlueBubbles desteği kaldırıldı. OpenClaw iMessage desteğini yalnızca `imsg` üzerinden sağlar. Bu kılavuz, eski `channels.bluebubbles` yapılandırmalarını `channels.imessage` yapılandırmalarına taşımak içindir; desteklenen başka bir taşıma yolu yoktur.

## Bu taşıma ne zaman mantıklıdır?

- Messages.app oturumunun açık olduğu aynı Mac üzerinde (veya SSH üzerinden erişilebilen bir Mac üzerinde) zaten `imsg` çalıştırıyorsunuz.
- Daha az hareketli parça istiyorsunuz — ayrı BlueBubbles sunucusu yok, kimlik doğrulaması yapılacak REST uç noktası yok, webhook tesisatı yok. Sunucu + istemci uygulaması + yardımcı yerine tek bir CLI ikilisi.
- Özel API yoklamasının `available: true` bildirdiği [desteklenen bir macOS / `imsg` derlemesindesiniz](/tr/channels/imessage#requirements-and-permissions-macos).

## imsg ne yapar?

`imsg`, Messages için yerel bir macOS CLI aracıdır. OpenClaw, `imsg rpc` komutunu alt süreç olarak başlatır ve stdin/stdout üzerinden JSON-RPC ile konuşur. Açığa çıkarılacak HTTP sunucusu, webhook URL'si, arka plan daemon'ı, launch agent'ı veya port yoktur.

- Okumalar, salt okunur bir SQLite tanıtıcısı kullanılarak `~/Library/Messages/chat.db` dosyasından gelir.
- Canlı gelen iletiler, yoklama geri dönüşüyle birlikte `chat.db` dosya sistemi olaylarını izleyen `imsg watch` / `watch.subscribe` üzerinden gelir.
- Gönderimler, normal metin ve dosya gönderimleri için Messages.app otomasyonunu kullanır.
- Gelişmiş eylemler, `imsg` yardımcısını Messages.app içine enjekte etmek için `imsg launch` kullanır. Okundu bilgilerini, yazıyor göstergelerini, zengin gönderimleri, düzenlemeyi, göndermeyi geri almayı, konuya yanıtı, tapback'leri ve grup yönetimini açan budur.
- Linux derlemeleri kopyalanmış bir `chat.db` dosyasını inceleyebilir, ancak gönderim yapamaz, canlı Mac veritabanını izleyemez veya Messages.app'i çalıştıramaz. OpenClaw iMessage için `imsg`yi oturum açılmış Mac üzerinde veya o Mac'e giden bir SSH sarmalayıcısı üzerinden çalıştırın.

## Başlamadan önce

1. Messages.app çalıştıran Mac'e `imsg` yükleyin:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   `imsg chats` komutu `unable to open database file`, boş çıktı veya `authorization denied` ile başarısız olursa `imsg`yi başlatan terminale, düzenleyiciye, Node sürecine, Gateway hizmetine veya SSH üst sürecine Full Disk Access verin, ardından bu üst süreci yeniden açın.

2. OpenClaw yapılandırmasını değiştirmeden önce okuma, izleme, gönderme ve RPC yüzeylerini doğrulayın:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   `42` değerini `imsg chats` çıktısından gerçek bir sohbet kimliğiyle değiştirin. Gönderim, Messages.app için Automation izni gerektirir. OpenClaw SSH üzerinden çalışacaksa bu komutları OpenClaw'ın kullanacağı aynı SSH sarmalayıcısı veya kullanıcı bağlamı üzerinden çalıştırın.

3. Gelişmiş eylemlere ihtiyacınız olduğunda özel API köprüsünü etkinleştirin:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch`, SIP'nin devre dışı bırakılmasını gerektirir. Temel gönderim, geçmiş ve izleme `imsg launch` olmadan çalışır; gelişmiş eylemler çalışmaz.

4. Köprüyü OpenClaw üzerinden doğrulayın:

   ```bash
   openclaw channels status --probe
   ```

   `imessage.privateApi.available: true` görmelisiniz. `false` bildirirse önce bunu düzeltin — bkz. [Yetenek algılama](/tr/channels/imessage#private-api-actions).

5. Yapılandırmanızın anlık görüntüsünü alın:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Yapılandırma çevirisi

iMessage ve BlueBubbles birçok kanal düzeyi yapılandırmayı paylaşır. Değişen anahtarlar çoğunlukla taşıma katmanına ilişkindir (REST sunucusu yerine yerel CLI). Davranış anahtarları (`dmPolicy`, `groupPolicy`, `allowFrom` vb.) aynı anlamı korur.

| BlueBubbles                                                | paketle gelen iMessage                    | Notlar                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Aynı semantik.                                                                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.serverUrl`                           | _(kaldırıldı)_                            | REST sunucusu yok; Plugin, stdio üzerinden `imsg rpc` başlatır.                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.password`                            | _(kaldırıldı)_                            | Webhook kimlik doğrulaması gerekmez.                                                                                                                                                                                                                                                                                                         |
| _(örtük)_                                                  | `channels.imessage.cliPath`               | `imsg` yolu (varsayılan `imsg`); SSH için bir sarmalayıcı betik kullanın.                                                                                                                                                                                                                                                                    |
| _(örtük)_                                                  | `channels.imessage.dbPath`                | İsteğe bağlı Messages.app `chat.db` geçersiz kılması; atlandığında otomatik algılanır.                                                                                                                                                                                                                                                       |
| _(örtük)_                                                  | `channels.imessage.remoteHost`            | `host` veya `user@host`; yalnızca `cliPath` bir SSH sarmalayıcısıysa ve SCP ek getirmelerini istiyorsanız gerekir.                                                                                                                                                                                                                           |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Aynı değerler (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Eşleştirme onayları token'a göre değil, handle'a göre taşınır.                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Aynı değerler (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Aynı.                                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Bunu, varsa `groups: { "*": { ... } }` joker girdisi dahil olmak üzere birebir kopyalayın.** Grup bazlı `requireMention`, `tools`, `toolsBySender` taşınır. `groupPolicy: "allowlist"` ile boş veya eksik bir `groups` bloğu her grup mesajını sessizce düşürür; aşağıdaki "Grup kayıt defteri tuzağı" bölümüne bakın.                    |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Varsayılan `true`. Paketle gelen Plugin ile bu yalnızca private API yoklaması çalışır durumdayken tetiklenir.                                                                                                                                                                                                                                 |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Aynı biçim, **aynı şekilde varsayılan olarak kapalı**. BlueBubbles'ta ekler akıyorduysa bunu iMessage bloğunda açıkça yeniden ayarlamanız gerekir; örtük olarak taşınmaz ve siz bunu yapana kadar gelen fotoğraflar/medya `Inbound message` günlük satırı olmadan sessizce düşürülür.                                                        |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Yerel kökler; aynı joker kuralları.                                                                                                                                                                                                                                                                                                          |
| _(Yok)_                                                    | `channels.imessage.remoteAttachmentRoots` | Yalnızca SCP getirmeleri için `remoteHost` ayarlandığında kullanılır.                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage'ta varsayılan 16 MB'dir (BlueBubbles varsayılanı 8 MB idi). Daha düşük sınırı korumak istiyorsanız açıkça ayarlayın.                                                                                                                                                                                                                |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | İkisinde de varsayılan 4000.                                                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Aynı isteğe bağlı etkinleştirme. Yalnızca DM; grup sohbetleri iki kanalda da mesaj başına anında dispatch davranışını korur. Açık bir `messages.inbound.byChannel.imessage` olmadan etkinleştirildiğinde varsayılan gelen debounce süresini 2500 ms'ye genişletir. [iMessage belgeleri § Bölünmüş gönderimli DM'leri birleştirme](/tr/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition) bölümüne bakın. |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(Yok)_                                   | iMessage gönderen görünen adlarını zaten `chat.db` dosyasından okur.                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Eylem başına anahtarlar: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                     |

Çok hesaplı yapılandırmalar (`channels.bluebubbles.accounts.*`), bire bir `channels.imessage.accounts.*` değerlerine çevrilir.

## Grup kayıt defteri tuzağı

Paketle gelen iMessage Plugin'i, arka arkaya **iki** ayrı grup izin listesi kapısı çalıştırır. Bir grup mesajının ajana ulaşması için ikisinin de geçilmesi gerekir:

1. **Gönderen / sohbet hedefi izin listesi** (`channels.imessage.groupAllowFrom`) — `isAllowedIMessageSender` tarafından denetlenir. Gelen mesajları gönderen handle'ı, `chat_guid`, `chat_identifier` veya `chat_id` ile eşleştirir. BlueBubbles ile aynı biçimdedir.
2. **Grup kayıt defteri** (`channels.imessage.groups`) — `inbound-processing.ts:199` içinden `resolveChannelGroupPolicy` tarafından denetlenir. `groupPolicy: "allowlist"` ile bu kapı şunlardan birini gerektirir:
   - bir `groups: { "*": { ... } }` joker girdisi (`allowAll = true` ayarlar), veya
   - `groups` altında açık bir `chat_id` bazlı girdi.

Kapı 1 geçer ancak kapı 2 başarısız olursa mesaj düşürülür. Plugin, bunun varsayılan günlük seviyesinde artık sessiz olmaması için iki `warn` düzeyinde sinyal yayar:

- `groupPolicy: "allowlist"` ayarlanmış ancak `channels.imessage.groups` boş olduğunda hesap başına bir kerelik başlangıç `warn` sinyali (`"*"` jokeri yok, `chat_id` bazlı girdi yok); herhangi bir mesaj gelmeden önce tetiklenir.
- Belirli bir grup çalışma zamanında ilk kez düşürüldüğünde `chat_id` başına bir kerelik `warn` sinyali; chat_id'yi ve izin vermek için `groups` bölümüne eklenecek tam anahtarı belirtir.

DM'ler farklı bir kod yolunu kullandıkları için çalışmaya devam eder.

Bu, en yaygın BlueBubbles → paketle gelen iMessage geçiş hatası modudur: operatörler `groupAllowFrom` ve `groupPolicy` değerlerini kopyalar ama `groups` bloğunu atlar, çünkü BlueBubbles'ın `groups: { "*": { "requireMention": true } }` ayarı ilgisiz bir mention ayarı gibi görünür. Aslında kayıt defteri kapısı için yük taşıyıcıdır.

`groupPolicy: "allowlist"` sonrasında grup mesajlarının akmaya devam etmesi için minimum yapılandırma:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`*` altında `requireMention: true`, hiçbir bahsetme deseni yapılandırılmadığında zararsızdır: çalışma zamanı `canDetectMention = false` olarak ayarlar ve `inbound-processing.ts:512` konumunda bahsetme düşürmeyi kısa devreye alır. Bahsetme desenleri yapılandırıldığında (`agents.list[].groupChat.mentionPatterns`), beklendiği gibi çalışır.

Gateway günlüklerinde `imessage: dropping group message from chat_id=<id>` ya da başlangıç satırı olarak `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` görünüyorsa, 2. kapı düşürüyor demektir — `groups` bloğunu ekleyin.

## Adım adım

1. Mevcut BlueBubbles bloğunun yanına bir iMessage bloğu ekleyin. Eski bloğu yalnızca yeni yol doğrulanana kadar kopyalama kaynağı olarak tutun:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false, // turn on after the dry run below
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **Deneme çalıştırması yoklaması** — Gateway’i başlatın ve iMessage’ın sağlıklı raporladığını doğrulayın:

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # expect imessage.privateApi.available: true
   ```

   `imessage.enabled` hâlâ `false` olduğu için henüz hiçbir gelen iMessage trafiği yönlendirilmez — ancak `--probe` köprüyü çalıştırır, böylece geçişten önce izin/kurulum sorunlarını yakalarsınız.

3. **Geçiş yapın.** BlueBubbles yapılandırmasını kaldırın ve tek bir yapılandırma düzenlemesiyle iMessage’ı etkinleştirin:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Gateway’i yeniden başlatın. Gelen iMessage trafiği artık paketlenmiş Plugin üzerinden akar.

4. **DM’leri doğrulayın.** Aracıya doğrudan mesaj gönderin; yanıtın ulaştığını doğrulayın.

5. **Grupları ayrı doğrulayın.** DM’ler ve gruplar farklı kod yollarını kullanır — DM başarısı grupların yönlendirildiğini kanıtlamaz. Aracıya eşleştirilmiş bir grup sohbetinde mesaj gönderin ve yanıtın ulaştığını doğrulayın. Grup sessiz kalırsa (aracı yanıtı yok, hata yok), Gateway günlüğünde `imessage: dropping group message from chat_id=<id>` ya da başlangıçta `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` satırını kontrol edin — ikisi de varsayılan günlük düzeyinde tetiklenir. Bunlardan biri görünürse, `groups` bloğunuz eksik ya da boştur — yukarıdaki “Grup kaydı tuzağı” bölümüne bakın.

6. **Eylem yüzeyini doğrulayın** — eşleştirilmiş bir DM’den aracıdan tepki vermesini, düzenlemesini, göndermeyi geri almasını, yanıtlamasını, fotoğraf göndermesini ve (bir grupta) grubu yeniden adlandırmasını / katılımcı eklemesini ya da kaldırmasını isteyin. Her eylem Messages.app içinde yerel olarak gerçekleşmelidir. Herhangi biri "iMessage `<action>` requires the imsg private API bridge" hatasını verirse, `imsg launch` komutunu yeniden çalıştırın ve `channels status --probe` sonucunu yenileyin.

7. iMessage DM’leri, grupları ve eylemleri doğrulandıktan sonra **BlueBubbles sunucusunu ve yapılandırmasını kaldırın**. OpenClaw `channels.bluebubbles` kullanmayacaktır.

## Bir bakışta eylem eşdeğerliği

| Eylem                                                      | eski BlueBubbles                    | paketlenmiş iMessage                                                                                                    |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Metin gönder / SMS yedeği                                  | ✅                                  | ✅                                                                                                                      |
| Medya gönder (fotoğraf, video, dosya, ses)                 | ✅                                  | ✅                                                                                                                      |
| İş parçacıklı yanıt (`reply_to_guid`)                      | ✅                                  | ✅ ([#51892](https://github.com/openclaw/openclaw/issues/51892) kapatır)                                                |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Düzenle / göndermeyi geri al (macOS 13+ alıcılar)          | ✅                                  | ✅                                                                                                                      |
| Ekran efektiyle gönder                                     | ✅                                  | ✅ ([#9394](https://github.com/openclaw/openclaw/issues/9394) bir kısmını kapatır)                                      |
| Zengin metin kalın / italik / altı çizili / üstü çizili    | ✅                                  | ✅ (attributedBody ile typed-run biçimlendirmesi)                                                                       |
| Grubu yeniden adlandır / grup simgesi ayarla               | ✅                                  | ✅                                                                                                                      |
| Katılımcı ekle / kaldır, gruptan ayrıl                     | ✅                                  | ✅                                                                                                                      |
| Okundu bilgileri ve yazıyor göstergesi                     | ✅                                  | ✅ (özel API yoklamasına bağlı)                                                                                         |
| Aynı gönderenli DM birleştirme                             | ✅                                  | ✅ (yalnızca DM; `channels.imessage.coalesceSameSenderDms` ile isteğe bağlı)                                            |
| Gateway kapalıyken alınan gelen mesajları yakalama         | ✅ (Webhook yeniden oynatma + geçmiş getirme) | ✅ (`channels.imessage.catchup.enabled` ile isteğe bağlı; [#78649](https://github.com/openclaw/openclaw/issues/78649) kapatır) |

iMessage yakalama artık paketlenmiş Plugin üzerinde isteğe bağlı bir özellik olarak kullanılabilir. Gateway başlangıcında, `channels.imessage.catchup.enabled` `true` ise Gateway, `imsg watch` tarafından kullanılan aynı JSON-RPC istemcisine karşı bir `chats.list` + sohbet başına `messages.history` geçişi çalıştırır, kaçırılan her gelen satırı canlı dağıtım yolundan (izin listeleri, grup politikası, debouncer, echo cache) yeniden oynatır ve sonraki başlangıçların kaldığı yerden devam etmesi için hesap başına bir imleci kalıcı hale getirir. Ayarlama için [Gateway kesintisinden sonra yakalama](/tr/channels/imessage#catching-up-after-gateway-downtime) bölümüne bakın.

## Eşleştirme, oturumlar ve ACP bağlamaları

- **Eşleştirme onayları** handle üzerinden taşınır. Bilinen gönderenleri yeniden onaylamanız gerekmez — `channels.imessage.allowFrom`, BlueBubbles’ın kullandığı aynı `+15555550123` / `user@example.com` dizelerini tanır.
- **Oturumlar** aracı + sohbet başına kapsamlanmış kalır. DM’ler varsayılan `session.dmScope=main` altında aracının ana oturumunda birleşir; grup oturumları `chat_id` başına izole kalır. Oturum anahtarları farklıdır (`agent:<id>:imessage:group:<chat_id>` ile BlueBubbles eşdeğeri) — BlueBubbles oturum anahtarları altındaki eski konuşma geçmişi iMessage oturumlarına taşınmaz.
- `match.channel: "bluebubbles"` referansı veren **ACP bağlamaları** `"imessage"` olarak güncellenmelidir. `match.peer.id` biçimleri (`chat_id:`, `chat_guid:`, `chat_identifier:`, yalın handle) aynıdır.

## Geri dönüş kanalı yok

Geri dönmek için desteklenen bir BlueBubbles çalışma zamanı yoktur. iMessage doğrulaması başarısız olursa, `channels.imessage.enabled: false` ayarlayın, Gateway’i yeniden başlatın, `imsg` engelini düzeltin ve geçişi yeniden deneyin.

Yanıt önbelleği `~/.openclaw/state/imessage/reply-cache.jsonl` konumunda bulunur (mod `0600`, üst dizin `0700`). Temiz bir başlangıç istiyorsanız silmek güvenlidir.

## İlgili

- [iMessage](/tr/channels/imessage) — `imsg launch` kurulumu ve yetenek algılama dahil tam iMessage kanal başvurusu.
- `/channels/bluebubbles` — bu geçiş kılavuzuna yönlendiren eski URL.
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı.
- [Kanal Yönlendirme](/tr/channels/channel-routing) — Gateway’in giden yanıtlar için kanalı nasıl seçtiği.
