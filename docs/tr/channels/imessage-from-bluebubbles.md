---
read_when:
    - BlueBubbles'dan paketle birlikte gelen iMessage plugin'ine geçiş planlama
    - BlueBubbles yapılandırma anahtarlarını iMessage eşdeğerlerine çevirme
    - iMessage Plugin'ini etkinleştirmeden önce imsg'yi doğrulama
summary: Eski BlueBubbles yapılandırmalarını eşleştirmeyi, izin listelerini veya grup bağlamalarını kaybetmeden paketlenmiş iMessage plugin'ine taşıyın.
title: BlueBubbles'dan Geçiş
x-i18n:
    generated_at: "2026-06-28T00:12:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dae45911686697a064b19265b11acb87d377992f762256c44a22dd3f1b4c4b08
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Paketle gelen `imessage` Plugin'i artık [`steipete/imsg`](https://github.com/steipete/imsg) aracını JSON-RPC üzerinden çalıştırarak BlueBubbles ile aynı özel API yüzeyine (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, grup yönetimi, ekler) erişir. Zaten `imsg` yüklü bir Mac çalıştırıyorsanız BlueBubbles sunucusunu kaldırabilir ve Plugin'in doğrudan Messages.app ile konuşmasına izin verebilirsiniz.

BlueBubbles desteği kaldırıldı. OpenClaw, iMessage'ı yalnızca `imsg` üzerinden destekler. Bu kılavuz, eski `channels.bluebubbles` yapılandırmalarını `channels.imessage` yapılandırmasına taşımak içindir; desteklenen başka bir geçiş yolu yoktur.

<Note>
Kısa duyuru ve operatör özeti için bkz. [BlueBubbles’ın kaldırılması ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage).
</Note>

## Geçiş kontrol listesi

Eski BlueBubbles yapılandırmanızı zaten biliyorsanız ve en kısa güvenli yolu istiyorsanız bu kontrol listesini kullanın:

1. Messages.app çalıştıran Mac üzerinde `imsg` aracını doğrudan doğrulayın (`imsg chats`, `imsg history`, `imsg send` ve `imsg rpc --help`).
2. Davranış anahtarlarını `channels.bluebubbles` içinden `channels.imessage` içine kopyalayın: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` ve `actions`.
3. Artık mevcut olmayan aktarım anahtarlarını kaldırın: `serverUrl`, `password`, Webhook URL’leri ve BlueBubbles sunucu kurulumu.
4. Gateway, Messages Mac üzerinde çalışmıyorsa `channels.imessage.cliPath` değerini bir SSH sarmalayıcısına ayarlayın ve uzaktan ek getirmeleri için `remoteHost` değerini belirleyin.
5. Gateway durdurulmuşken `channels.imessage` kanalını etkinleştirin, ardından `openclaw channels status --probe --channel imessage` komutunu çalıştırın.
6. Bir DM’yi, izin verilen bir grubu, etkinse ekleri ve aracının kullanmasını beklediğiniz her özel API eylemini test edin.
7. iMessage yolu doğrulandıktan sonra BlueBubbles sunucusunu ve eski `channels.bluebubbles` yapılandırmasını silin.

## Bu geçiş ne zaman anlamlıdır?

- Messages.app oturumu açık olan aynı Mac üzerinde (veya SSH üzerinden erişilebilen bir Mac üzerinde) zaten `imsg` çalıştırıyorsunuz.
- Daha az hareketli parça istiyorsunuz: ayrı BlueBubbles sunucusu yok, kimlik doğrulaması gerektiren REST uç noktası yok, Webhook tesisatı yok. Sunucu + istemci uygulaması + yardımcı yerine tek bir CLI ikilisi.
- Özel API yoklamasının `available: true` bildirdiği [desteklenen macOS / `imsg` derlemesi](/tr/channels/imessage#requirements-and-permissions-macos) kullanıyorsunuz.

## imsg ne yapar?

`imsg`, Messages için yerel bir macOS CLI aracıdır. OpenClaw, `imsg rpc` komutunu alt süreç olarak başlatır ve stdin/stdout üzerinden JSON-RPC ile konuşur. Açığa çıkarılacak HTTP sunucusu, Webhook URL’si, arka plan daemon’u, launch agent’ı veya port yoktur.

- Okumalar, salt okunur bir SQLite tanıtıcısı kullanılarak `~/Library/Messages/chat.db` içinden gelir.
- Canlı gelen iletiler, yoklama geri dönüşüyle `chat.db` dosya sistemi olaylarını izleyen `imsg watch` / `watch.subscribe` üzerinden gelir.
- Gönderimler, normal metin ve dosya gönderimleri için Messages.app otomasyonunu kullanır.
- Gelişmiş eylemler, `imsg` yardımcısını Messages.app içine enjekte etmek için `imsg launch` kullanır. Okundu bilgileri, yazıyor göstergeleri, zengin gönderimler, düzenleme, geri alma, konu içi yanıt, tapback’ler ve grup yönetimini açan şey budur.
- Linux derlemeleri kopyalanmış bir `chat.db` dosyasını inceleyebilir, ancak gönderim yapamaz, canlı Mac veritabanını izleyemez veya Messages.app aracını süremez. OpenClaw iMessage için `imsg` aracını oturum açılmış Mac üzerinde ya da o Mac’e giden bir SSH sarmalayıcısı üzerinden çalıştırın.

## Başlamadan önce

1. Messages.app çalıştıran Mac üzerine `imsg` yükleyin:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   `imsg chats` komutu `unable to open database file`, boş çıktı veya `authorization denied` hatasıyla başarısız olursa `imsg` aracını başlatan terminale, düzenleyiciye, Node sürecine, Gateway hizmetine veya SSH üst sürecine Tam Disk Erişimi verin, ardından bu üst süreci yeniden açın.

2. OpenClaw yapılandırmasını değiştirmeden önce okuma, izleme, gönderme ve RPC yüzeylerini doğrulayın:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   `42` değerini `imsg chats` çıktısından gerçek bir sohbet kimliğiyle değiştirin. Gönderim, Messages.app için Automation izni gerektirir. OpenClaw SSH üzerinden çalışacaksa bu komutları OpenClaw’ın kullanacağı aynı SSH sarmalayıcısı veya kullanıcı bağlamı üzerinden çalıştırın. Okumalar/yoklamalar çalışıyor ancak gönderimler AppleEvents `-1743` ile başarısız oluyorsa Automation izninin `/usr/libexec/sshd-keygen-wrapper` üzerine düşüp düşmediğini kontrol edin; bkz. [SSH sarmalayıcı gönderimleri AppleEvents -1743 ile başarısız oluyor](/tr/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

3. Gelişmiş eylemlere ihtiyacınız olduğunda özel API köprüsünü etkinleştirin:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch`, SIP’in devre dışı bırakılmış olmasını gerektirir. Temel gönderim, geçmiş ve izleme `imsg launch` olmadan çalışır; gelişmiş eylemler çalışmaz.

4. Etkin bir `channels.imessage` yapılandırması ekledikten sonra köprüyü OpenClaw üzerinden doğrulayın:

   ```bash
   openclaw channels status --probe
   ```

   İstenen değer `imessage.privateApi.available: true` değeridir. `false` bildirirse önce bunu düzeltin; bkz. [Yetenek algılama](/tr/channels/imessage#private-api-actions). `channels status --probe` yalnızca yapılandırılmış ve etkin hesapları yoklar.

5. Yapılandırmanızın anlık kopyasını alın:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Yapılandırma çevirisi

iMessage ve BlueBubbles çok sayıda kanal düzeyi yapılandırmayı paylaşır. Değişen anahtarlar çoğunlukla aktarım ile ilgilidir (REST sunucusu ve yerel CLI). Davranış anahtarları (`dmPolicy`, `groupPolicy`, `allowFrom` vb.) aynı anlamı korur.

| BlueBubbles                                                | paketle gelen iMessage                    | Notlar                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Aynı semantik.                                                                                                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.serverUrl`                           | _(kaldırıldı)_                            | REST sunucusu yok; Plugin, stdio üzerinden `imsg rpc` başlatır.                                                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.password`                            | _(kaldırıldı)_                            | Webhook kimlik doğrulaması gerekmez.                                                                                                                                                                                                                                                                                                                                                    |
| _(örtük)_                                                  | `channels.imessage.cliPath`               | `imsg` yolu (varsayılan `imsg`); SSH için bir sarmalayıcı betik kullanın.                                                                                                                                                                                                                                                                                                                       |
| _(örtük)_                                                  | `channels.imessage.dbPath`                | İsteğe bağlı Messages.app `chat.db` geçersiz kılması; atlandığında otomatik algılanır.                                                                                                                                                                                                                                                                                                                |
| _(örtük)_                                                  | `channels.imessage.remoteHost`            | `host` veya `user@host`; yalnızca `cliPath` bir SSH sarmalayıcısıysa ve SCP ek getirmeleri istiyorsanız gerekir.                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Aynı değerler (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Eşleştirme onayları token ile değil, handle ile taşınır.                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Aynı değerler (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Aynı.                                                                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Bunu, varsa `groups: { "*": { ... } }` joker girdisi dahil olmak üzere bire bir kopyalayın.** Grup başına `requireMention`, `tools`, `toolsBySender` taşınır. `groupPolicy: "allowlist"` ile boş veya eksik bir `groups` bloğu her grup iletisini sessizce düşürür; aşağıdaki "Grup kayıt defteri tuzağı" bölümüne bakın.                                                                                       |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Varsayılan `true`. Paketle gelen Plugin ile bu yalnızca özel API probu çalışır durumdayken tetiklenir.                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Aynı şekil, **aynı şekilde varsayılan olarak kapalı**. BlueBubbles üzerinde ekler akıyorduysa bunu iMessage bloğunda açıkça yeniden ayarlamanız gerekir; örtük olarak taşınmaz ve bunu yapana kadar gelen fotoğraflar/medyalar `Inbound message` günlük satırı olmadan sessizce düşürülür.                                                                                                     |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Yerel kökler; aynı joker kuralları.                                                                                                                                                                                                                                                                                                                                                    |
| _(Yok)_                                                    | `channels.imessage.remoteAttachmentRoots` | Yalnızca SCP getirmeleri için `remoteHost` ayarlandığında kullanılır.                                                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage üzerinde varsayılan 16 MB (BlueBubbles varsayılanı 8 MB idi). Daha düşük sınırı korumak istiyorsanız açıkça ayarlayın.                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Her ikisinde de varsayılan 4000.                                                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Aynı isteğe bağlı davranış. Yalnızca DM; grup sohbetleri her iki kanalda da ileti başına anında dağıtımı korur. Açık bir `messages.inbound.byChannel.imessage` veya genel `messages.inbound.debounceMs` olmadan etkinleştirildiğinde varsayılan gelen debounce değerini 7000 ms'ye genişletir. [iMessage belgeleri § Bölünmüş gönderimli DM'leri birleştirme](/tr/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition) bölümüne bakın. |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(Yok)_                                   | iMessage, gönderen görünen adlarını zaten `chat.db` içinden okur.                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Eylem başına açma/kapama ayarları: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                                                                  |

Çok hesaplı yapılandırmalar (`channels.bluebubbles.accounts.*`), bire bir `channels.imessage.accounts.*` olarak çevrilir.

## Grup kayıt defteri tuzağı

Paketle gelen iMessage Plugin, **iki** ayrı grup izin listesi kapısını arka arkaya çalıştırır. Bir grup iletisinin ajana ulaşması için ikisinden de geçmesi gerekir:

1. **Gönderen / sohbet hedefi izin listesi** (`channels.imessage.groupAllowFrom`) — `isAllowedIMessageSender` tarafından denetlenir. Gelen iletileri gönderen handle, `chat_guid`, `chat_identifier` veya `chat_id` ile eşleştirir. BlueBubbles ile aynı şekle sahiptir.
2. **Grup kayıt defteri** (`channels.imessage.groups`) — `inbound-processing.ts:199` içindeki `resolveChannelGroupPolicy` tarafından denetlenir. `groupPolicy: "allowlist"` ile bu kapı şunlardan birini gerektirir:
   - bir `groups: { "*": { ... } }` joker girdisi (`allowAll = true` ayarlar), veya
   - `groups` altında açık bir `chat_id` başına girdi.

Kapı 1 geçer ama kapı 2 başarısız olursa ileti düşürülür. Plugin, bunun varsayılan günlük düzeyinde artık sessiz olmaması için iki `warn` düzeyi sinyal yayar:

- `groupPolicy: "allowlist"` ayarlanmışken `channels.imessage.groups` boşsa (`"*"` jokeri yok, `chat_id` başına girdi yok) hesap başına bir defalık başlangıç `warn` iletisi; herhangi bir ileti ulaşmadan önce tetiklenir.
- Belirli bir grup çalışma zamanında ilk kez düşürüldüğünde `chat_id` başına bir defalık `warn` iletisi; chat_id'yi ve buna izin vermek için `groups` içine eklenecek tam anahtarı belirtir.

DM'ler farklı bir kod yolu kullandıkları için çalışmaya devam eder.

Bu, en yaygın BlueBubbles → paketlenmiş-iMessage geçiş hatası modudur: operatörler `groupAllowFrom` ve `groupPolicy` değerlerini kopyalar ama `groups` bloğunu atlar, çünkü BlueBubbles'ın `groups: { "*": { "requireMention": true } }` ayarı ilgisiz bir bahsetme ayarı gibi görünür. Aslında kayıt kapısı için kritik önemdedir.

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

`*` altındaki `requireMention: true`, bahsetme desenleri yapılandırılmamışsa zararsızdır: çalışma zamanı `canDetectMention = false` değerini ayarlar ve `inbound-processing.ts:512` konumundaki bahsetme düşürmesini kısa devre yapar. Bahsetme desenleri yapılandırıldığında (`agents.list[].groupChat.mentionPatterns`), beklendiği gibi çalışır.

Gateway günlükleri `imessage: dropping group message from chat_id=<id>` ya da başlangıç satırı olarak `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` gösteriyorsa, kapı 2 düşürüyordur — `groups` bloğunu ekleyin.

## Adım adım

1. Mevcut BlueBubbles bloğunun yanına bir iMessage bloğu ekleyin. Gateway hâlâ BlueBubbles trafiğini yönlendirirken bunu devre dışı bırakılmış tutun:

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

2. **Trafik önemli hale gelmeden önce yoklayın** — Gateway'i durdurun, iMessage bloğunu geçici olarak etkinleştirin ve iMessage'ın CLI üzerinden sağlıklı raporlandığını doğrulayın:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` yalnızca yapılandırılmış ve etkin hesapları yoklar. Her iki kanal izleyicisinin de çalışmasını bilinçli olarak istemiyorsanız Gateway'i BlueBubbles ve iMessage aynı anda etkin durumdayken yeniden başlatmayın. Hemen geçiş yapmıyorsanız Gateway'i yeniden başlatmadan önce `channels.imessage.enabled` değerini tekrar `false` olarak ayarlayın. OpenClaw trafiğini etkinleştirmeden önce Mac'i doğrulamak için [Başlamadan önce](#before-you-start) bölümündeki doğrudan `imsg` komutlarını kullanın.

3. **Geçiş yapın.** Etkin iMessage hesabı sağlıklı raporlandıktan sonra BlueBubbles yapılandırmasını kaldırın ve iMessage'ı etkin tutun:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Gateway'i yeniden başlatın. Gelen iMessage trafiği artık paketlenmiş Plugin üzerinden akar.

4. **DM'leri doğrulayın.** Aracıya doğrudan mesaj gönderin; yanıtın ulaştığını doğrulayın.

5. **Grupları ayrı doğrulayın.** DM'ler ve gruplar farklı kod yolları kullanır — DM başarısı grupların yönlendirildiğini kanıtlamaz. Aracıya eşleştirilmiş bir grup sohbetinde mesaj gönderin ve yanıtın ulaştığını doğrulayın. Grup sessiz kalırsa (aracı yanıtı yok, hata yok), Gateway günlüğünde `imessage: dropping group message from chat_id=<id>` ya da başlangıçta `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` satırı olup olmadığını kontrol edin — ikisi de varsayılan günlük düzeyinde tetiklenir. İkisinden biri görünüyorsa `groups` bloğunuz eksik ya da boştur — yukarıdaki "Grup kayıt tuzağı" bölümüne bakın.

6. **Eylem yüzeyini doğrulayın** — eşleştirilmiş bir DM'den aracıdan tepki vermesini, düzenlemesini, göndermeyi geri almasını, yanıtlamasını, fotoğraf göndermesini ve (bir grupta) grubu yeniden adlandırmasını / katılımcı eklemesini ya da kaldırmasını isteyin. Her eylem Messages.app içinde yerel olarak gerçekleşmelidir. Herhangi biri "iMessage `<action>` requires the imsg private API bridge" hatası verirse `imsg launch` komutunu yeniden çalıştırın ve `channels status --probe` durumunu yenileyin.

7. iMessage DM'leri, grupları ve eylemleri doğrulandıktan sonra **BlueBubbles sunucusunu ve yapılandırmasını kaldırın**. OpenClaw `channels.bluebubbles` kullanmaz.

## Bir bakışta eylem eşliği

| Eylem                                               | eski BlueBubbles                    | paketlenmiş iMessage                                                          |
| --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| Metin gönderme / SMS geri dönüşü                    | ✅                                  | ✅                                                                            |
| Medya gönderme (fotoğraf, video, dosya, ses)        | ✅                                  | ✅                                                                            |
| Konulu yanıt (`reply_to_guid`)                      | ✅                                  | ✅ ([#51892](https://github.com/openclaw/openclaw/issues/51892) kapatır)      |
| Tapback (`react`)                                   | ✅                                  | ✅                                                                            |
| Düzenleme / göndermeyi geri alma (macOS 13+ alıcılar) | ✅                                | ✅                                                                            |
| Ekran efektiyle gönderme                            | ✅                                  | ✅ ([#9394](https://github.com/openclaw/openclaw/issues/9394) bölümünü kapatır) |
| Zengin metin kalın / italik / altı çizili / üstü çizili | ✅                               | ✅ (attributedBody üzerinden typed-run biçimlendirme)                         |
| Grubu yeniden adlandırma / grup simgesi ayarlama    | ✅                                  | ✅                                                                            |
| Katılımcı ekleme / kaldırma, gruptan ayrılma        | ✅                                  | ✅                                                                            |
| Okundu bilgileri ve yazıyor göstergesi              | ✅                                  | ✅ (özel API yoklamasına bağlı)                                               |
| Aynı gönderenden DM birleştirme                     | ✅                                  | ✅ (yalnızca DM; `channels.imessage.coalesceSameSenderDms` ile isteğe bağlı)  |
| Yeniden başlatma sonrası gelen ileti kurtarma       | ✅ (Webhook yeniden oynatma + geçmiş alma) | ✅ (otomatik: kaçırılanları since_rowid + tekilleştirme ile yeniden oynatır; yerelde daha geniş pencere) |

iMessage, Gateway kapalıyken kaçırılan iletileri kurtarır: başlangıçta `imsg watch.subscribe` `since_rowid` üzerinden son gönderilen rowid'den itibaren yeniden oynatır ve GUID ile tekilleştirir; bu sırada eski-birikim yaş sınırı Push-flush "birikim bombası"nı bastırır. Bu, `imsg` RPC bağlantısı üzerinden çalışır; dolayısıyla uzak SSH `cliPath` kurulumlarında da çalışır. Yerel kurulumlar `chat.db` okuyabildiği için daha geniş bir kurtarma penceresi elde eder. Bkz. [Köprü veya Gateway yeniden başlatması sonrası gelen ileti kurtarma](/tr/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Eşleştirme, oturumlar ve ACP bağları

- **Eşleştirme onayları** tanıtıcıya göre taşınır. Bilinen gönderenleri yeniden onaylamanız gerekmez — `channels.imessage.allowFrom`, BlueBubbles'ın kullandığı aynı `+15555550123` / `user@example.com` dizelerini tanır.
- **Oturumlar** aracı + sohbet başına kapsamlandırılmış kalır. DM'ler varsayılan `session.dmScope=main` altında aracı ana oturumuna daralır; grup oturumları `chat_id` başına izole kalır. Oturum anahtarları farklıdır (`agent:<id>:imessage:group:<chat_id>` ve BlueBubbles eşdeğeri) — BlueBubbles oturum anahtarları altındaki eski konuşma geçmişi iMessage oturumlarına taşınmaz.
- `match.channel: "bluebubbles"` referansı veren **ACP bağları** `"imessage"` olarak güncellenmelidir. `match.peer.id` biçimleri (`chat_id:`, `chat_guid:`, `chat_identifier:`, çıplak tanıtıcı) aynıdır.

## Geri dönüş kanalı yok

Geri dönülecek desteklenen bir BlueBubbles çalışma zamanı yoktur. iMessage doğrulaması başarısız olursa `channels.imessage.enabled: false` ayarlayın, Gateway'i yeniden başlatın, `imsg` engelleyicisini düzeltin ve geçişi yeniden deneyin.

Yanıt önbelleği SQLite Plugin durumunda yaşar. `openclaw doctor --fix`, varsa eski `imessage/reply-cache.jsonl` yan dosyasını içe aktarır ve arşivler.

## İlgili

- [BlueBubbles kaldırma ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage) — kısa duyuru ve operatör özeti.
- [iMessage](/tr/channels/imessage) — `imsg launch` kurulumu ve yetenek algılama dahil tam iMessage kanal başvurusu.
- `/channels/bluebubbles` — bu geçiş kılavuzuna yönlendiren eski URL.
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı.
- [Kanal Yönlendirme](/tr/channels/channel-routing) — Gateway'in giden yanıtlar için kanalı nasıl seçtiği.
