---
read_when:
    - BlueBubbles'tan paketle birlikte gelen iMessage Plugin'ine geçişi planlama
    - BlueBubbles yapılandırma anahtarlarını iMessage eşdeğerlerine çevirme
    - iMessage Plugin'ini etkinleştirmeden önce imsg'yi doğrulama
summary: Eski BlueBubbles yapılandırmalarını eşleştirmeyi, izin listelerini veya grup bağlamalarını kaybetmeden paketlenmiş iMessage Plugin'ine taşıyın.
title: BlueBubbles'dan Geçiş
x-i18n:
    generated_at: "2026-05-11T20:20:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 255bb79faf8e19215728c0401e6cac530f7bf4bfc8577df33518ab21a1597e90
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Paketle gelen `imessage` Plugin'i artık [`steipete/imsg`](https://github.com/steipete/imsg) aracını JSON-RPC üzerinden çalıştırarak BlueBubbles ile aynı özel API yüzeyine (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, grup yönetimi, ekler) erişir. Zaten `imsg` kurulu bir Mac çalıştırıyorsanız BlueBubbles sunucusunu kaldırıp Plugin'in doğrudan Messages.app ile konuşmasını sağlayabilirsiniz.

BlueBubbles desteği kaldırıldı. OpenClaw iMessage'ı yalnızca `imsg` üzerinden destekler. Bu kılavuz, eski `channels.bluebubbles` yapılandırmalarını `channels.imessage` yapılandırmasına geçirmek içindir; desteklenen başka bir geçiş yolu yoktur.

<Note>
Kısa duyuru ve operatör özeti için bkz. [BlueBubbles'ın kaldırılması ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage).
</Note>

## Geçiş kontrol listesi

Eski BlueBubbles yapılandırmanızı zaten biliyorsanız ve en kısa güvenli yolu istiyorsanız bu kontrol listesini kullanın:

1. `imsg` aracını Messages.app'i çalıştıran Mac üzerinde doğrudan doğrulayın (`imsg chats`, `imsg history`, `imsg send` ve `imsg rpc --help`).
2. Davranış anahtarlarını `channels.bluebubbles` içinden `channels.imessage` içine kopyalayın: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` ve `actions`.
3. Artık var olmayan aktarım anahtarlarını kaldırın: `serverUrl`, `password`, Webhook URL'leri ve BlueBubbles sunucu kurulumu.
4. Gateway, Messages Mac üzerinde çalışmıyorsa `channels.imessage.cliPath` değerini bir SSH sarmalayıcısına ayarlayın ve uzak ek getirmeleri için `remoteHost` değerini ayarlayın.
5. Gateway durdurulmuşken `channels.imessage` öğesini etkinleştirin, ardından `openclaw channels status --probe --channel imessage` komutunu çalıştırın.
6. Bir DM'yi, izin verilen bir grubu, etkinse ekleri ve ajanın kullanmasını beklediğiniz her özel API eylemini test edin.
7. iMessage yolu doğrulandıktan sonra BlueBubbles sunucusunu ve eski `channels.bluebubbles` yapılandırmasını silin.

## Bu geçiş ne zaman anlamlıdır

- Messages.app'te oturum açılmış aynı Mac üzerinde (veya SSH üzerinden erişilebilen bir Mac üzerinde) zaten `imsg` çalıştırıyorsunuz.
- Daha az hareketli parça istiyorsunuz: ayrı BlueBubbles sunucusu yok, kimlik doğrulaması yapılacak REST uç noktası yok, Webhook tesisatı yok. Sunucu + istemci uygulaması + yardımcı yerine tek bir CLI ikili dosyası.
- Özel API yoklamasının `available: true` bildirdiği [desteklenen macOS / `imsg` derlemesi](/tr/channels/imessage#requirements-and-permissions-macos) üzerindesiniz.

## imsg ne yapar

`imsg`, Messages için yerel bir macOS CLI aracıdır. OpenClaw, `imsg rpc` komutunu alt süreç olarak başlatır ve stdin/stdout üzerinden JSON-RPC ile konuşur. Açığa çıkarılacak HTTP sunucusu, Webhook URL'si, arka plan daemon'ı, launch agent'ı veya port yoktur.

- Okumalar, salt okunur SQLite tanıtıcısı kullanılarak `~/Library/Messages/chat.db` içinden gelir.
- Canlı gelen iletiler, yoklama yedeğiyle `chat.db` dosya sistemi olaylarını izleyen `imsg watch` / `watch.subscribe` üzerinden gelir.
- Gönderimler, normal metin ve dosya gönderimleri için Messages.app otomasyonunu kullanır.
- Gelişmiş eylemler, `imsg` yardımcısını Messages.app içine enjekte etmek için `imsg launch` kullanır. Okundu bilgileri, yazıyor göstergeleri, zengin gönderimler, düzenleme, geri alma, ileti dizili yanıt, tapback'ler ve grup yönetimini açan şey budur.
- Linux derlemeleri kopyalanmış bir `chat.db` dosyasını inceleyebilir, ancak gönderim yapamaz, canlı Mac veritabanını izleyemez veya Messages.app'i süremez. OpenClaw iMessage için `imsg` aracını oturum açılmış Mac üzerinde veya o Mac'e giden bir SSH sarmalayıcısı üzerinden çalıştırın.

## Başlamadan önce

1. Messages.app'i çalıştıran Mac üzerine `imsg` yükleyin:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   `imsg chats` komutu `unable to open database file`, boş çıktı veya `authorization denied` ile başarısız olursa `imsg` aracını başlatan terminale, düzenleyiciye, Node sürecine, Gateway hizmetine veya SSH üst sürecine Tam Disk Erişimi verin, ardından bu üst süreci yeniden açın.

2. OpenClaw yapılandırmasını değiştirmeden önce okuma, izleme, gönderme ve RPC yüzeylerini doğrulayın:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   `42` değerini `imsg chats` çıktısından gerçek bir sohbet kimliğiyle değiştirin. Gönderim, Messages.app için Otomasyon izni gerektirir. OpenClaw SSH üzerinden çalışacaksa bu komutları OpenClaw'un kullanacağı aynı SSH sarmalayıcısı veya kullanıcı bağlamı üzerinden çalıştırın.

3. Gelişmiş eylemlere ihtiyacınız olduğunda özel API köprüsünü etkinleştirin:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch`, SIP'nin devre dışı bırakılmasını gerektirir. Temel gönderim, geçmiş ve izleme `imsg launch` olmadan çalışır; gelişmiş eylemler çalışmaz.

4. Etkinleştirilmiş bir `channels.imessage` yapılandırması ekledikten sonra köprüyü OpenClaw üzerinden doğrulayın:

   ```bash
   openclaw channels status --probe
   ```

   `imessage.privateApi.available: true` değerini görmek istersiniz. `false` bildirirse önce bunu düzeltin; bkz. [Yetenek algılama](/tr/channels/imessage#private-api-actions). `channels status --probe` yalnızca yapılandırılmış, etkin hesapları yoklar.

5. Yapılandırmanızın anlık kopyasını alın:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Yapılandırma dönüşümü

iMessage ve BlueBubbles birçok kanal düzeyi yapılandırmayı paylaşır. Değişen anahtarlar çoğunlukla aktarımla ilgilidir (REST sunucusu yerine yerel CLI). Davranış anahtarları (`dmPolicy`, `groupPolicy`, `allowFrom` vb.) aynı anlamı korur.

| BlueBubbles                                                | birlikte gelen iMessage                   | Notlar                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Aynı semantik.                                                                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.serverUrl`                           | _(kaldırıldı)_                            | REST sunucusu yok — Plugin, stdio üzerinden `imsg rpc` başlatır.                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.password`                            | _(kaldırıldı)_                            | Webhook kimlik doğrulaması gerekmez.                                                                                                                                                                                                                                                                                                         |
| _(örtük)_                                                  | `channels.imessage.cliPath`               | `imsg` yolu (varsayılan `imsg`); SSH için bir sarmalayıcı betik kullanın.                                                                                                                                                                                                                                                                    |
| _(örtük)_                                                  | `channels.imessage.dbPath`                | İsteğe bağlı Messages.app `chat.db` geçersiz kılması; atlandığında otomatik algılanır.                                                                                                                                                                                                                                                       |
| _(örtük)_                                                  | `channels.imessage.remoteHost`            | `host` veya `user@host` — yalnızca `cliPath` bir SSH sarmalayıcısı olduğunda ve SCP ek getirmelerini istediğinizde gerekir.                                                                                                                                                                                                                  |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Aynı değerler (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Eşleştirme onayları belirtece göre değil, handle'a göre aktarılır.                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Aynı değerler (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Aynı.                                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Bunu, herhangi bir `groups: { "*": { ... } }` joker karakter girdisi dahil, birebir kopyalayın.** Grup başına `requireMention`, `tools`, `toolsBySender` aktarılır. `groupPolicy: "allowlist"` ile boş veya eksik bir `groups` bloğu her grup mesajını sessizce düşürür — aşağıdaki "Grup kayıt tuzağı" bölümüne bakın.                  |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Varsayılan `true`. Birlikte gelen Plugin ile bu yalnızca özel API yoklaması çalışır durumdayken tetiklenir.                                                                                                                                                                                                                                  |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Aynı şekil, **aynı şekilde varsayılan olarak kapalı**. BlueBubbles üzerinde ekler akıyorduysa bunu iMessage bloğunda açıkça yeniden ayarlamalısınız — örtük olarak aktarılmaz ve siz bunu yapana kadar gelen fotoğraflar/medya hiçbir `Inbound message` günlük satırı olmadan sessizce düşürülür.                                           |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Yerel kökler; aynı joker karakter kuralları.                                                                                                                                                                                                                                                                                                 |
| _(Yok)_                                                    | `channels.imessage.remoteAttachmentRoots` | Yalnızca SCP getirmeleri için `remoteHost` ayarlandığında kullanılır.                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage üzerinde varsayılan 16 MB'dir (BlueBubbles varsayılanı 8 MB idi). Daha düşük sınırı korumak istiyorsanız açıkça ayarlayın.                                                                                                                                                                                                          |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Her ikisinde de varsayılan 4000'dir.                                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Aynı katılımlı seçenek. Yalnızca DM — grup sohbetleri iki kanalda da mesaj başına anında gönderimi korur. Açık bir `messages.inbound.byChannel.imessage` olmadan etkinleştirildiğinde varsayılan gelen ileti debounce değerini 2500 ms'ye genişletir. Bkz. [iMessage belgeleri § Bölünmüş gönderimli DM'leri birleştirme](/tr/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(Yok)_                                   | iMessage, gönderen görünen adlarını zaten `chat.db` üzerinden okur.                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Eylem başına açma/kapama seçenekleri: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                        |

Çok hesaplı yapılandırmalar (`channels.bluebubbles.accounts.*`) bire bir `channels.imessage.accounts.*` değerlerine çevrilir.

## Grup kayıt tuzağı

Birlikte gelen iMessage Plugin'i **iki** ayrı grup allowlist kapısını arka arkaya çalıştırır. Bir grup mesajının agente ulaşması için ikisinin de geçmesi gerekir:

1. **Gönderen / sohbet-hedefi allowlist'i** (`channels.imessage.groupAllowFrom`) — `isAllowedIMessageSender` tarafından denetlenir. Gelen mesajları gönderen handle'ı, `chat_guid`, `chat_identifier` veya `chat_id` ile eşleştirir. BlueBubbles ile aynı şekildedir.
2. **Grup kaydı** (`channels.imessage.groups`) — `inbound-processing.ts:199` içindeki `resolveChannelGroupPolicy` tarafından denetlenir. `groupPolicy: "allowlist"` ile bu kapı şunlardan birini gerektirir:
   - bir `groups: { "*": { ... } }` joker karakter girdisi (`allowAll = true` ayarlar), veya
   - `groups` altında açık bir `chat_id` başına giriş.

Kapı 1 geçer ama kapı 2 başarısız olursa mesaj düşürülür. Plugin, bunun varsayılan günlük düzeyinde artık sessiz kalmaması için iki `warn` düzeyi sinyal yayar:

- `groupPolicy: "allowlist"` ayarlı ama `channels.imessage.groups` boş olduğunda (`"*"` joker karakteri yok, `chat_id` başına giriş yok) hesap başına bir kerelik başlangıç `warn` uyarısı — herhangi bir mesaj gelmeden önce tetiklenir.
- Belirli bir grup çalışma zamanında ilk kez düşürüldüğünde `chat_id` başına bir kerelik `warn` uyarısı; chat_id'yi ve izin vermek için `groups` öğesine eklenecek tam anahtarı belirtir.

DM'ler farklı bir kod yolu kullandıkları için çalışmaya devam eder.

Bu, en yaygın BlueBubbles → birlikte gelen iMessage geçişi hata modudur: operatörler `groupAllowFrom` ve `groupPolicy` öğelerini kopyalar ama `groups` bloğunu atlar; çünkü BlueBubbles'ın `groups: { "*": { "requireMention": true } }` ayarı alakasız bir bahsetme ayarı gibi görünür. Aslında kayıt kapısı için yük taşıyan parçadır.

`groupPolicy: "allowlist"` sonrasında grup mesajlarının akmaya devam etmesi için en küçük yapılandırma:

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

`*` altında `requireMention: true`, hiçbir mention deseni yapılandırılmadığında zararsızdır: runtime `canDetectMention = false` ayarlar ve `inbound-processing.ts:512` içinde mention düşürmeyi kısa devreye alır. Mention desenleri yapılandırıldığında (`agents.list[].groupChat.mentionPatterns`) beklendiği gibi çalışır.

Gateway günlüklerinde `imessage: dropping group message from chat_id=<id>` veya başlangıç satırı olarak `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` görünüyorsa, 2. kapı düşürüyordur; `groups` bloğunu ekleyin.

## Adım adım

1. Mevcut BlueBubbles bloğunun yanına bir iMessage bloğu ekleyin. Gateway hala BlueBubbles trafiğini yönlendirirken devre dışı tutun:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
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

2. **Trafik önemli hale gelmeden önce yoklayın** — Gateway'i durdurun, iMessage bloğunu geçici olarak etkinleştirin ve iMessage'ın CLI'dan sağlıklı raporlandığını doğrulayın:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` yalnızca yapılandırılmış, etkin hesapları yoklar. Her iki kanal monitörünün de bilerek çalışmasını istemiyorsanız Gateway'i hem BlueBubbles hem de iMessage etkin halde yeniden başlatmayın. Hemen geçiş yapmıyorsanız Gateway'i yeniden başlatmadan önce `channels.imessage.enabled` değerini tekrar `false` olarak ayarlayın. OpenClaw trafiğini etkinleştirmeden önce Mac'i doğrulamak için [Başlamadan önce](#before-you-start) içindeki doğrudan `imsg` komutlarını kullanın.

3. **Geçiş yapın.** Etkin iMessage hesabı sağlıklı raporlandıktan sonra BlueBubbles yapılandırmasını kaldırın ve iMessage'ı etkin bırakın:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Gateway'i yeniden başlatın. Gelen iMessage trafiği artık paketle gelen Plugin üzerinden akar.

4. **DM'leri doğrulayın.** Ajana doğrudan mesaj gönderin; yanıtın ulaştığını doğrulayın.

5. **Grupları ayrı doğrulayın.** DM'ler ve gruplar farklı kod yollarından geçer; DM başarısı grupların yönlendirildiğini kanıtlamaz. Ajana eşleştirilmiş bir grup sohbetinde mesaj gönderin ve yanıtın ulaştığını doğrulayın. Grup sessiz kalırsa (ajan yanıtı yok, hata yok), Gateway günlüğünde `imessage: dropping group message from chat_id=<id>` veya başlangıçta `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` satırını kontrol edin; ikisi de varsayılan günlük seviyesinde tetiklenir. İkisinden biri görünüyorsa `groups` bloğunuz eksik veya boştur; yukarıdaki "Group registry footgun" bölümüne bakın.

6. **Eylem yüzeyini doğrulayın** — eşleştirilmiş bir DM'den ajandan tepki vermesini, düzenlemesini, göndermeyi geri almasını, yanıtlamasını, fotoğraf göndermesini ve (bir grupta) grubu yeniden adlandırmasını / katılımcı eklemesini veya kaldırmasını isteyin. Her eylem Messages.app içinde yerel olarak gerçekleşmelidir. Herhangi biri "iMessage `<action>` requires the imsg private API bridge" hatası verirse `imsg launch` komutunu tekrar çalıştırın ve `channels status --probe` sonucunu yenileyin.

7. iMessage DM'leri, grupları ve eylemleri doğrulandıktan sonra **BlueBubbles sunucusunu ve yapılandırmasını kaldırın**. OpenClaw `channels.bluebubbles` kullanmaz.

## Eylem eşdeğerliğine hızlı bakış

| Eylem                                                      | eski BlueBubbles                    | paketle gelen iMessage                                                                                                  |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Metin gönderme / SMS fallback                              | ✅                                  | ✅                                                                                                                      |
| Medya gönderme (fotoğraf, video, dosya, ses)               | ✅                                  | ✅                                                                                                                      |
| Konu dizili yanıt (`reply_to_guid`)                        | ✅                                  | ✅ ([#51892](https://github.com/openclaw/openclaw/issues/51892) kapatılır)                                              |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Düzenleme / göndermeyi geri alma (macOS 13+ alıcıları)     | ✅                                  | ✅                                                                                                                      |
| Ekran efektiyle gönderme                                   | ✅                                  | ✅ ([#9394](https://github.com/openclaw/openclaw/issues/9394) öğesinin bir kısmını kapatır)                             |
| Zengin metin kalın / italik / altı çizili / üstü çizili    | ✅                                  | ✅ (attributedBody üzerinden typed-run biçimlendirme)                                                                   |
| Grubu yeniden adlandırma / grup simgesi ayarlama           | ✅                                  | ✅                                                                                                                      |
| Katılımcı ekleme / kaldırma, gruptan ayrılma               | ✅                                  | ✅                                                                                                                      |
| Okundu bilgileri ve yazıyor göstergesi                     | ✅                                  | ✅ (özel API yoklamasına bağlı)                                                                                         |
| Aynı gönderenli DM birleştirme                             | ✅                                  | ✅ (yalnızca DM; `channels.imessage.coalesceSameSenderDms` üzerinden isteğe bağlı)                                      |
| Gateway kapalıyken alınan gelen mesajların yakalanması     | ✅ (Webhook replay + history fetch) | ✅ (`channels.imessage.catchup.enabled` üzerinden isteğe bağlı; [#78649](https://github.com/openclaw/openclaw/issues/78649) kapatılır) |

iMessage catchup artık paketle gelen Plugin üzerinde isteğe bağlı bir özellik olarak kullanılabilir. Gateway başlangıcında, `channels.imessage.catchup.enabled` `true` ise Gateway, `imsg watch` tarafından kullanılan aynı JSON-RPC istemcisine karşı bir `chats.list` + sohbet başına `messages.history` geçişi çalıştırır, kaçırılan her gelen satırı canlı dispatch yolundan (izin listeleri, grup ilkesi, debouncer, echo cache) yeniden oynatır ve sonraki başlangıçların kaldığı yerden devam etmesi için hesap başına bir cursor kalıcı hale getirir. Ayarlama için [Gateway kesintisinden sonra yetişme](/tr/channels/imessage#catching-up-after-gateway-downtime) bölümüne bakın.

## Eşleştirme, oturumlar ve ACP bağlamaları

- **Eşleştirme onayları** handle üzerinden taşınır. Bilinen gönderenleri yeniden onaylamanız gerekmez; `channels.imessage.allowFrom`, BlueBubbles'ın kullandığı aynı `+15555550123` / `user@example.com` dizelerini tanır.
- **Oturumlar** ajan + sohbet başına kapsamlı kalır. DM'ler varsayılan `session.dmScope=main` altında ajanın ana oturumunda birleşir; grup oturumları `chat_id` başına yalıtılmış kalır. Oturum anahtarları farklıdır (`agent:<id>:imessage:group:<chat_id>` ile BlueBubbles eşdeğeri); BlueBubbles oturum anahtarları altındaki eski konuşma geçmişi iMessage oturumlarına taşınmaz.
- `match.channel: "bluebubbles"` öğesine başvuran **ACP bağlamaları** `"imessage"` olarak güncellenmelidir. `match.peer.id` şekilleri (`chat_id:`, `chat_guid:`, `chat_identifier:`, çıplak handle) aynıdır.

## Geri dönüş kanalı yok

Geri dönülecek desteklenen bir BlueBubbles runtime yoktur. iMessage doğrulaması başarısız olursa `channels.imessage.enabled: false` ayarlayın, Gateway'i yeniden başlatın, `imsg` engelini düzeltin ve geçişi yeniden deneyin.

Yanıt önbelleği `~/.openclaw/state/imessage/reply-cache.jsonl` konumundadır (mod `0600`, üst dizin `0700`). Temiz bir başlangıç istiyorsanız silmek güvenlidir.

## İlgili

- [BlueBubbles'ın kaldırılması ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage) — kısa duyuru ve operatör özeti.
- [iMessage](/tr/channels/imessage) — `imsg launch` kurulumu ve yetenek algılama dahil tam iMessage kanal referansı.
- `/channels/bluebubbles` — bu geçiş kılavuzuna yönlendiren eski URL.
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı.
- [Kanal Yönlendirme](/tr/channels/channel-routing) — Gateway'in giden yanıtlar için kanalı nasıl seçtiği.
