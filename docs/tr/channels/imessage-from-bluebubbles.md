---
read_when:
    - BlueBubbles'dan paketle birlikte gelen iMessage Plugin'ine geçişi planlama
    - BlueBubbles yapılandırma anahtarlarını iMessage eşdeğerlerine dönüştürme
    - iMessage Pluginini etkinleştirmeden önce imsg'yi doğrulama
summary: 'Eski BlueBubbles yapılandırmalarını paketle birlikte gelen iMessage pluginine taşıyın: anahtar eşlemesi, grup izin listesi denetimleri ve geçiş doğrulaması.'
title: BlueBubbles'dan Geçiş
x-i18n:
    generated_at: "2026-07-12T11:28:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

BlueBubbles desteği kaldırıldı. OpenClaw, iMessage'ı yalnızca paketle birlikte gelen `imessage` Plugin'i üzerinden destekler; bu Plugin, [`steipete/imsg`](https://github.com/steipete/imsg) aracını JSON-RPC üzerinden çalıştırır ve BlueBubbles'ın eriştiği özel API yüzeyinin aynısına erişir (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, yerel anketler, grup yönetimi, ekler). Tek bir CLI ikili dosyası; BlueBubbles sunucusunun, istemci uygulamasının ve webhook bağlantı düzeninin yerini alır: REST uç noktası ve webhook kimlik doğrulaması yoktur.

Bu kılavuz, eski `channels.bluebubbles` yapılandırmalarını `channels.imessage` yapılandırmasına taşır. Desteklenen başka bir taşıma yolu yoktur. Güncel OpenClaw sürümünde geride kalan bir `channels.bluebubbles` bloğu etkisizdir; çalışma zamanında hiçbir bileşen bunu okumaz.

<Note>
Kısa duyuru ve operatör özeti için [BlueBubbles'ın kaldırılması ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage) sayfasına bakın.
</Note>

## Taşıma kontrol listesi

Eski BlueBubbles yapılandırmanızı zaten biliyorsanız en kısa ve güvenli yol şudur:

1. `imsg` aracını doğrudan Messages.app uygulamasının çalıştığı Mac'te doğrulayın (`imsg chats`, `imsg history`, `imsg send`, `imsg rpc --help`).
2. Davranış anahtarlarını `channels.bluebubbles` üzerinden `channels.imessage` altına kopyalayın: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` ve `actions`.
3. Artık mevcut olmayan aktarım anahtarlarını kaldırın: `serverUrl`, `password`, webhook URL'leri ve BlueBubbles sunucu kurulumu.
4. Gateway, Messages'ın bulunduğu Mac'te çalışmıyorsa `channels.imessage.cliPath` değerini bir SSH sarmalayıcısına ayarlayın ve uzaktaki ekleri almak için `remoteHost` değerini belirleyin.
5. `channels.imessage` kanalını etkinleştirin, Gateway'i yeniden başlatın ve ardından `openclaw channels status --probe --channel imessage` komutunu çalıştırın.
6. Bir doğrudan mesajı, izin verilen bir grubu, etkinse ekleri ve aracının kullanmasını beklediğiniz her özel API eylemini test edin.
7. iMessage yolu doğrulandıktan sonra BlueBubbles sunucusunu ve eski `channels.bluebubbles` yapılandırmasını silin.

## imsg ne yapar?

`imsg`, Messages için yerel bir macOS CLI aracıdır. OpenClaw, `imsg rpc` işlemini alt süreç olarak başlatır ve stdin/stdout üzerinden JSON-RPC ile iletişim kurar. Açığa çıkarılması gereken bir HTTP sunucusu, webhook URL'si, arka plan hizmeti, başlatma aracısı veya bağlantı noktası yoktur.

- Okuma işlemleri, salt okunur bir SQLite tanıtıcısı kullanılarak `~/Library/Messages/chat.db` üzerinden gerçekleştirilir.
- Canlı gelen mesajlar, `chat.db` dosya sistemi olaylarını yoklama yedeğiyle izleyen `imsg watch` / `watch.subscribe` üzerinden gelir.
- Normal metin ve dosya gönderimleri için Messages.app otomasyonu kullanılır.
- Gelişmiş eylemler, `imsg` yardımcısını Messages.app içine enjekte etmek için `imsg launch` komutunu kullanır. Okundu bilgilerini, yazıyor göstergelerini, zengin gönderimleri, düzenlemeyi, göndermeyi geri almayı, ileti dizili yanıtları, tapback'leri, anketleri ve grup yönetimini etkinleştiren budur.
- Linux derlemeleri, kopyalanmış bir `chat.db` dosyasını inceleyebilir ancak gönderim yapamaz, canlı Mac veritabanını izleyemez veya Messages.app uygulamasını çalıştıramaz. OpenClaw iMessage için `imsg` aracını oturum açılmış Mac'te veya bu Mac'e bağlanan bir SSH sarmalayıcısı üzerinden çalıştırın.

## Başlamadan önce

1. `imsg` aracını Messages.app uygulamasının çalıştığı Mac'e yükleyin:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   Olağan yerel kurulumda OpenClaw kurulumu, Messages oturumu açık Mac'te `imsg` için kullanıcı onaylı bir Homebrew yüklemesi veya güncellemesi sunabilir. El ile kurulum ve SSH sarmalayıcısı topolojileri operatör tarafından yönetilmeye devam eder: Homebrew güncellemesini, `imsg` aracını çalıştıracak aynı yerel veya uzak kullanıcı bağlamında yineleyin. `imsg chats` komutu `unable to open database file`, boş çıktı veya `authorization denied` hatasıyla başarısız olursa `imsg` aracını başlatan terminale, düzenleyiciye, Node işlemine, Gateway hizmetine veya SSH üst sürecine Tam Disk Erişimi verin ve ardından bu üst süreci yeniden açın.

2. OpenClaw yapılandırmasını değiştirmeden önce okuma, izleme, gönderme ve RPC yüzeylerini doğrulayın:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   `42` değerini `imsg chats` çıktısındaki gerçek bir sohbet kimliğiyle değiştirin. Gönderim için Messages.app uygulamasına Otomasyon izni verilmesi gerekir. OpenClaw SSH üzerinden çalışacaksa bu komutları OpenClaw'ın kullanacağı SSH sarmalayıcısı veya kullanıcı bağlamı üzerinden çalıştırın. Okuma çalışıyor ancak gönderimler AppleEvents `-1743` hatasıyla başarısız oluyorsa Otomasyon izninin `/usr/libexec/sshd-keygen-wrapper` üzerine verilip verilmediğini kontrol edin; [SSH sarmalayıcısı üzerinden gönderimler AppleEvents -1743 hatasıyla başarısız oluyor](/tr/channels/imessage#requirements-and-permissions-macos) bölümüne bakın.

3. Özel API köprüsünü etkinleştirin. Yanıtlar, tapback'ler, efektler, anketler, eklere verilen yanıtlar ve grup eylemleri buna bağlı olduğundan OpenClaw iMessage için kesinlikle önerilir:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch`, SIP'nin devre dışı bırakılmasını gerektirir (ve modern macOS sürümlerinde kitaplık doğrulamasının gevşetilmesini de gerektirir; bkz. [imsg özel API'sini etkinleştirme](/tr/channels/imessage#enabling-the-imsg-private-api)). Temel gönderim, geçmiş ve izleme işlevleri `imsg launch` olmadan çalışır; OpenClaw iMessage eylem yüzeyinin tamamı çalışmaz.

4. `channels.imessage` kanalını etkinleştirip Gateway'i başlattıktan sonra köprüyü OpenClaw üzerinden doğrulayın:

   ```bash
   openclaw channels status --probe
   ```

   iMessage hesabı `works` bildirmelidir; `--json` kullanıldığında yoklama yükü `privateApi.available: true` değerini içerir. `false` bildirirse önce bunu düzeltin; [Yetenek algılama](/tr/channels/imessage#private-api-actions) bölümüne bakın. Yoklama için erişilebilir bir Gateway gerekir (aksi takdirde CLI yalnızca yapılandırmaya dayalı çıktıya geri döner) ve yalnızca yapılandırılmış, etkin hesaplar yoklanır.

5. Yapılandırmanızın anlık görüntüsünü alın:

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## Yapılandırma dönüşümü

iMessage ve BlueBubbles, kanal düzeyindeki davranış anahtarlarının çoğunu paylaşır. Değişen unsurlar aktarım yöntemi (REST sunucusu yerine yerel CLI) ve grup kayıt defteri anahtarının biçimidir.

| BlueBubbles                                                | paketlenmiş iMessage                       | Notlar                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`                | Aynı anlam yapısı (blok mevcut olduğunda varsayılan `true`).                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.serverUrl`                           | _(kaldırıldı)_                             | REST sunucusu yoktur — Plugin, stdio üzerinden `imsg rpc` başlatır.                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.password`                            | _(kaldırıldı)_                             | Webhook kimlik doğrulaması gerekmez.                                                                                                                                                                                                                                                                                  |
| _(örtük)_                                                  | `channels.imessage.cliPath`                | `imsg` yolu (varsayılan `imsg`); SSH için bir sarmalayıcı betik kullanın.                                                                                                                                                                                                                                             |
| _(örtük)_                                                  | `channels.imessage.dbPath`                 | İsteğe bağlı Messages.app `chat.db` geçersiz kılma yolu; belirtilmediğinde otomatik algılanır.                                                                                                                                                                                                                         |
| _(örtük)_                                                  | `channels.imessage.remoteHost`             | `host` veya `user@host` — yalnızca `cliPath` bir SSH sarmalayıcısıysa ve ekleri SCP ile almak istiyorsanız gereklidir.                                                                                                                                                                                                 |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`               | Aynı değerler (`pairing` / `allowlist` / `open` / `disabled`); varsayılan `pairing`.                                                                                                                                                                                                                                  |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`              | Aynı tanıtıcı biçimleri (`+15555550123`, `user@example.com`). Eşleştirme deposundaki onaylar aktarılmaz — aşağıya bakın.                                                                                                                                                                                               |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`            | Aynı değerler (`allowlist` / `open` / `disabled`); varsayılan `allowlist`.                                                                                                                                                                                                                                            |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`         | Aynıdır. Ayarlanmadığında iMessage, `allowFrom` değerine geri döner; açıkça boş bir `groupAllowFrom: []`, `groupPolicy: "allowlist"` kapsamında tüm grupları engeller.                                                                                                                                                  |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                 | `"*"` joker karakteri girdisini olduğu gibi kopyalayın; grup başına girdilerin anahtarlarını sayısal iMessage `chat_id` değerleriyle yeniden belirleyin — bkz. "Grup kayıt defteri tuzağı". `requireMention`, `tools`, `toolsBySender`, `systemPrompt` aynen aktarılır.                                                     |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`       | Varsayılan `true`. Paketlenmiş Plugin ile bu yalnızca özel API yoklaması çalışır durumdayken tetiklenir.                                                                                                                                                                                                                |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`     | Aynı yapı ve varsayılan olarak kapalıdır. Ekler BlueBubbles üzerinde aktarılıyorsa bunu açıkça ayarlayın — bunu yapana kadar gelen fotoğraflar/medya sessizce atılır (`Inbound message` günlük satırı yazılmaz).                                                                                                        |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`        | Yerel kökler; aynı joker karakteri kuralları.                                                                                                                                                                                                                                                                         |
| _(Geçerli değil)_                                         | `channels.imessage.remoteAttachmentRoots`  | Yalnızca SCP ile alma işlemleri için `remoteHost` ayarlandığında kullanılır.                                                                                                                                                                                                                                          |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`             | iMessage üzerinde varsayılan 16 MB'dir (BlueBubbles varsayılanı 8 MB idi). Daha düşük sınırı korumak için açıkça ayarlayın.                                                                                                                                                                                            |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`         | Her ikisinde de varsayılan 4000'dir.                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms`  | Aynı isteğe bağlı etkinleştirme davranışı. Yalnızca DM'ler içindir — gruplarda ileti başına yönlendirme korunur. `messages.inbound.byChannel.imessage` veya genel bir `messages.inbound.debounceMs` ayarlanmadıkça varsayılan gelen ileti bekletme süresini 7000 ms'ye çıkarır. Bkz. [Bölünerek gönderilen DM'leri birleştirme](/tr/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(Geçerli değil)_                          | `imsg`, gönderenlerin görünen adlarını zaten `chat.db` üzerinden sunar.                                                                                                                                                                                                                                               |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`              | Aynı eylem başına açma/kapama ayarları (`reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`) ve yeni `polls`. Tümü varsayılan olarak etkindir; özel API eylemleri yine de köprü gerektirir.                    |

Çok hesaplı yapılandırmalar (`channels.bluebubbles.accounts.*`), bire bir `channels.imessage.accounts.*` biçimine dönüştürülür.

## Grup kayıt defteri tuzağı

Paketlenmiş iMessage Plugin'i iki grup geçidini art arda çalıştırır. Bir grup iletisinin ajana ulaşması için ikisini de geçmesi gerekir:

1. **Gönderen / sohbet hedefi izin listesi** (`channels.imessage.groupAllowFrom`) — gönderen tanıtıcısıyla veya sohbet hedefiyle (`chat_id:`, `chat_guid:`, `chat_identifier:` girdileri) eşleşir. `groupAllowFrom` ayarlanmadığında bu geçit `allowFrom` değerine geri döner; açık bir `groupAllowFrom: []`, bu geri dönüşü devre dışı bırakır ve `groupPolicy: "allowlist"` kapsamındaki tüm grup iletilerini atar.
2. **Grup kayıt defteri** (`channels.imessage.groups`) — sayısal iMessage `chat_id` değerleriyle anahtarlanır:
   - `groups` bloğu yoksa (veya boşsa): 1. geçitte boş olmayan etkin bir gönderen izin listesi bulunduğu sürece gruplar bu geçidi geçer; erişimi gönderen filtrelemesi yönetir ve başlangıçta tümünü atma uyarısı verilmez.
   - Girdiler içeren ancak `"*"` içermeyen `groups`: yalnızca listelenen `chat_id` anahtarları geçer. Herhangi bir grubu listelemek, `groupPolicy: "open"` altında bile kayıt defterini bir izin listesine dönüştürür.
   - `groups: { "*": { ... } }`: her grup bu geçidi geçer.

Geçiş tuzağı şudur: BlueBubbles, `groups` girdilerini sohbet GUID'si / sohbet tanımlayıcısıyla anahtarlarken iMessage kayıt defteri sayısal `chat_id` değerlerini kullanır. Grup başına girdileri olduğu gibi kopyalamak, anahtarları hiçbir zaman eşleşmeyen, boş olmayan bir kayıt defteri oluşturur; dolayısıyla her grup iletisi 2. geçitte atılır. `"*"` joker karakteri girdisini olduğu gibi kopyalayın; belirli grup girdilerinin anahtarlarını `imsg chats` çıktısındaki `chat_id` değerleriyle yeniden belirleyin.

Her iki atma yolu da varsayılan günlük düzeyinde `warn` satırlarıyla görülebilir:

- Başlangıçta hesap başına bir kez, `groupPolicy: "allowlist"` ayarlanmış ancak etkin grup gönderen izin listesi boş olduğunda: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`. Gönderenleri kabul etmek için `groupAllowFrom` (veya `allowFrom`) ayarlayın; yalnızca `groups` eklemek gönderen geçidini karşılamaz.
- Çalışma zamanında `chat_id` başına bir kez, kayıt defteri bir grubu attığında: `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`; eklenecek tam anahtarı belirtir.

DM'ler her iki durumda da çalışmaya devam eder — farklı bir kod yolunu izledikleri için DM başarısı grup yönlendirmesinin çalıştığını kanıtlamaz.

`groupPolicy: "allowlist"` ile gönderen kapsamlı asgari yapılandırma:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
    },
  },
}
```

Bu, yapılandırılmış gönderenleri herhangi bir grupta kabul eder. İzin verilen sohbetlerin kapsamını sınırlamak veya `requireMention` gibi sohbet başına seçenekleri ayarlamak için `groups` girdileri ekleyin; BlueBubbles `"*"` girdisini olduğu gibi kopyalayın ancak belirli girdilerin anahtarlarını sayısal iMessage `chat_id` değerleriyle yeniden belirleyin.

## Adım adım

1. Yapılandırmayı dönüştürün. Düzenleme yaparken yeni bloğu devre dışı bırakın; eski `channels.bluebubbles` bloğu mevcut OpenClaw tarafından yok sayılır ve referans olarak yanında kalabilir:

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // geçiş yapmaya hazır olduğunuzda true olarak değiştirin
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // bluebubbles.allowFrom değerinden kopyalayın
         groupPolicy: "allowlist",
         groupAllowFrom: [], // bluebubbles.groupAllowFrom değerinden kopyalayın
         groups: { "*": { requireMention: true } }, // joker karakteri olduğu gibi kopyalanır; sohbet başına girdileri chat_id ile yeniden anahtarlayın
         // eylemler varsayılan olarak etkindir; devre dışı bırakmak için ilgili anahtarı false olarak ayarlayın
       },
     },
   }
   ```

2. **Geçiş yapın ve yoklayın.** `channels.imessage.enabled: true` olarak ayarlayın, Gateway'i yeniden başlatın ve kanalın sağlıklı olarak raporlandığını doğrulayın:

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # "works" beklenir; --json, privateApi.available: true gösterir
   ```

   Yoklama, erişilebilir bir Gateway gerektirir ve yalnızca yapılandırılmış, etkin hesapları yoklar. Mac'in kendisini doğrulamak için [Başlamadan önce](#before-you-start) bölümündeki doğrudan `imsg` komutlarını kullanın.

3. **DM'leri doğrulayın.** Aracıya doğrudan mesaj gönderin; yanıtın ulaştığını doğrulayın.

4. **Grupları ayrı olarak doğrulayın.** DM'ler ve gruplar farklı kod yollarını kullanır; DM'nin başarılı olması, grupların yönlendirildiğini kanıtlamaz. İzin verilen bir grup sohbetinde mesaj gönderin ve yanıtın ulaştığını doğrulayın. Grup sessiz kalırsa (aracı yanıtı ve hata yoksa), yukarıdaki "Grup kayıt defteri tuzağı" bölümünde belirtilen iki `warn` satırı için Gateway günlüğünü denetleyin. Başlangıç uyarısı, etkin gönderen izin listesinin boş olduğu anlamına gelir; `chat_id` başına uyarı ise doldurulmuş bir `groups` kayıt defterinin ilgili sohbeti içermediği anlamına gelir.

5. **Eylem yüzeyini doğrulayın.** Eşleştirilmiş bir DM'den aracıdan tepki vermesini, düzenleme yapmasını, göndermeyi geri almasını, yanıt vermesini, fotoğraf göndermesini ve (bir grupta) grubun adını değiştirmesini veya katılımcı ekleyip kaldırmasını isteyin. Her eylem Messages.app içinde yerel olarak gerçekleşmelidir. Herhangi bir eylem `iMessage <action> requires the imsg private API bridge` hatası verirse `imsg launch` komutunu yeniden çalıştırın ve `openclaw channels status --probe` ile durumu yenileyin.

6. iMessage DM'leri, grupları ve eylemleri doğrulandıktan sonra **BlueBubbles sunucusunu ve `channels.bluebubbles` bloğunu kaldırın**. OpenClaw, `channels.bluebubbles` yapılandırmasını okumaz.

## Eylem eşdeğerliğine genel bakış

| Eylem                                               | eski BlueBubbles    | paketlenmiş iMessage                                                           |
| --------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------ |
| Metin gönderme / SMS'e geri dönüş                   | ✅                  | ✅                                                                             |
| Medya gönderme (fotoğraf, video, dosya, ses)        | ✅                  | ✅                                                                             |
| Konu dizili yanıt (`reply_to_guid`)                 | ✅                  | ✅ ([#51892](https://github.com/openclaw/openclaw/issues/51892) kapatıldı)      |
| Tapback (`react`)                                   | ✅                  | ✅                                                                             |
| Düzenleme / göndermeyi geri alma (macOS 13+ alıcıları) | ✅               | ✅                                                                             |
| Ekran efektiyle gönderme                            | ✅                  | ✅ ([#9394](https://github.com/openclaw/openclaw/issues/9394) kısmen kapatıldı) |
| Zengin metinde kalın / italik / altı çizili / üstü çizili | ✅            | ✅ (attributedBody aracılığıyla türlenmiş çalıştırma biçimlendirmesi)           |
| Yerel Messages anketleri (oluşturma ve oy verme)    | ❌                  | ✅ (`actions.polls`; yerel görüntüleme için alıcılarda iOS/macOS 26+ gerekir)   |
| Grubu yeniden adlandırma / grup simgesini ayarlama  | ✅                  | ✅                                                                             |
| Katılımcı ekleme / kaldırma, gruptan ayrılma        | ✅                  | ✅                                                                             |
| Okundu bilgileri ve yazıyor göstergesi              | ✅                  | ✅ (özel API yoklamasına bağlıdır)                                              |
| Aynı gönderenin DM'lerini birleştirme               | ✅                  | ✅ (yalnızca DM; `channels.imessage.coalesceSameSenderDms` ile isteğe bağlı)    |
| Yeniden başlatma sonrasında gelen iletileri kurtarma | ✅                 | ✅ (otomatik: `since_rowid` yeniden oynatma + GUID tekilleştirme; yerelde daha geniş pencere) |

iMessage, Gateway kapalıyken kaçırılan mesajları kurtarır: başlangıçta `imsg watch.subscribe` `since_rowid` aracılığıyla son dağıtılan rowid'den itibaren yeniden oynatır, GUID'ye göre tekilleştirir ve eski birikmiş işler için yaş sınırı, Push temizlemesinin oluşturabileceği "birikmiş iş bombası"nı engeller. Bu işlem `imsg` RPC bağlantısı üzerinden çalıştığından uzak SSH `cliPath` kurulumlarında da çalışır; yerel kurulumlar `chat.db` dosyasını okuyabildiği için daha geniş bir kurtarma penceresine sahiptir. Bkz. [Köprü veya Gateway yeniden başlatıldıktan sonra gelen iletileri kurtarma](/tr/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Eşleştirme, oturumlar ve ACP bağlamaları

- **İzin listeleri tanıtıcıya göre aktarılır.** `channels.imessage.allowFrom`, BlueBubbles'ın kullandığı aynı `+15555550123` / `user@example.com` dizelerini tanır; bunları olduğu gibi kopyalayın.
- **Eşleştirme deposu onayları aktarılmaz.** Eşleştirme deposu kanal başınadır ve eski BlueBubbles deposunu hiçbir şey taşımaz. Yalnızca eşleştirme yoluyla onaylanmış gönderenlerin iMessage altında yeniden eşleştirme yapması veya tanıtıcılarının `allowFrom` alanına eklenmesi gerekir.
- **Oturumlar** aracı + sohbet başına kapsamlandırılmış olarak kalır. Varsayılan `session.dmScope=main` altında DM'ler aracının ana oturumunda birleşir; grup oturumları `chat_id` başına yalıtılmış kalır (`agent:<agentId>:imessage:group:<chat_id>`). BlueBubbles oturum anahtarları altındaki eski konuşma geçmişi, iMessage oturumlarına aktarılmaz.
- `match.channel: "bluebubbles"` başvurusunda bulunan **ACP bağlamaları** `"imessage"` olarak değiştirilmelidir. `match.peer.id` biçimleri (`chat_id:`, `chat_guid:`, `chat_identifier:`, çıplak tanıtıcı) aynıdır.

## Geri dönüş kanalı yoktur

Geri dönülebilecek desteklenen bir BlueBubbles çalışma zamanı yoktur. iMessage doğrulaması başarısız olursa `channels.imessage.enabled: false` olarak ayarlayın, Gateway'i yeniden başlatın, `imsg` engelini giderin ve geçişi yeniden deneyin.

Yanıt önbelleği SQLite Plugin durumunda bulunur. `openclaw doctor --fix`, mevcutsa eski `imessage/reply-cache.jsonl` yardımcı dosyasını içe aktarır ve arşivler.

## İlgili kaynaklar

- [BlueBubbles'ın kaldırılması ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage) — kısa duyuru ve operatör özeti.
- [iMessage](/tr/channels/imessage) — `imsg launch` kurulumu ve yetenek algılama dâhil tam iMessage kanal başvurusu.
- `/channels/bluebubbles` — bu geçiş kılavuzuna yönlendiren eski URL.
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı.
- [Kanal Yönlendirme](/tr/channels/channel-routing) — Gateway'in giden yanıtlar için kanalı nasıl seçtiği.
