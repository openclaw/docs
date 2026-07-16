---
read_when:
    - iMessage desteğini ayarlama
    - iMessage gönderme/alma sorunlarını giderme
summary: Yanıtlar, tapback'ler, efektler, anketler, ekler ve grup yönetimine yönelik özel API eylemleriyle, imsg üzerinden (stdio aracılığıyla JSON-RPC) yerel iMessage desteği. Ana makine gereksinimleri uygun olduğunda yeni OpenClaw iMessage kurulumları için tercih edilir.
title: iMessage
x-i18n:
    generated_at: "2026-07-16T16:36:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78b7ff7621e66e3b0122b5581c097140b7f62998b78981741bd3edbc0e1608bd
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Standart OpenClaw iMessage dağıtımı için Gateway'i ve `imsg` öğesini aynı oturum açılmış macOS Messages ana bilgisayarında çalıştırın. Gateway'iniz başka bir yerde çalışıyorsa `channels.imessage.cliPath` öğesini, Mac'te `imsg` çalıştıran şeffaf bir SSH sarmalayıcısına yönlendirin.

**Gelen ileti kurtarma işlemi otomatiktir.** Bir köprü veya gateway yeniden başlatıldıktan sonra iMessage, çalışmadığı sırada kaçırılan iletileri yeniden oynatır ve Apple'ın Push kurtarmasından sonra boşaltabileceği eski "birikmiş ileti bombardımanını" bastırarak hiçbir şeyin iki kez gönderilmemesi için yinelenenleri ayıklar. Etkinleştirilecek bir yapılandırma yoktur — bkz. [Bir köprü veya gateway yeniden başlatıldıktan sonra gelen ileti kurtarma](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
BlueBubbles desteği kaldırıldı. `channels.bluebubbles` yapılandırmalarını `channels.imessage` öğesine taşıyın; OpenClaw, iMessage'ı yalnızca `imsg` üzerinden destekler. Kısa duyuru için [BlueBubbles'ın kaldırılması ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage) veya tam geçiş tablosu için [BlueBubbles'tan geçiş](/tr/channels/imessage-from-bluebubbles) ile başlayın.
</Warning>

Durum: yerel harici CLI entegrasyonu. Gateway, `imsg rpc` işlemini başlatır ve stdio üzerinden JSON-RPC ile iletişim kurar — ayrı bir daemon veya bağlantı noktası yoktur. Eksiksiz bir iMessage kanalı için Özel API modu önemle önerilir; yanıtlar, tapback'ler, efektler, anketler, ek yanıtları ve grup eylemleri için `imsg launch` ve başarılı bir özel API yoklaması gerekir.

Yaygın yerel kurulumda OpenClaw kurulumu, oturum açılmış Messages Mac'inde `imsg` için kullanıcı tarafından onaylanan bir Homebrew kurulumu veya güncellemesi sunabilir. Manuel kurulum ve SSH sarmalayıcı topolojileri işletmeci tarafından yönetilmeye devam eder: `imsg` öğesini Gateway'i veya sarmalayıcıyı çalıştıracak kullanıcı bağlamında kurun ya da güncelleyin.

<CardGroup cols={3}>
  <Card title="Özel API eylemleri" icon="wand-sparkles" href="#private-api-actions">
    Yanıtlar, tapback'ler, efektler, anketler, ekler ve grup yönetimi.
  </Card>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    iMessage DM'leri varsayılan olarak eşleştirme modunu kullanır.
  </Card>
  <Card title="Uzak Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gateway, Messages Mac'inde çalışmıyorsa bir SSH sarmalayıcısı kullanın.
  </Card>
  <Card title="Yapılandırma başvurusu" icon="settings" href="/tr/gateway/config-channels#imessage">
    Tüm iMessage alanlarının başvurusu.
  </Card>
</CardGroup>

## Hızlı kurulum

<Tabs>
  <Tab title="Yerel Mac (hızlı yol)">
    <Steps>
      <Step title="imsg'yi kurun ve doğrulayın">

```bash
brew install steipete/tap/imsg
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        Yerel kurulum sihirbazı eksik bir varsayılan `imsg` komutu algıladığında, `steipete/tap/imsg` öğesini Homebrew aracılığıyla kurmayı önerebilir. Homebrew tarafından yönetilen bir `imsg` algılarsa yeniden kurmayı veya güncellemeyi önerebilir. Özel `cliPath` sarmalayıcıları değiştirilmez.

      </Step>

      <Step title="OpenClaw'ı yapılandırın">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Gateway'i başlatın">

```bash
openclaw gateway
```

      </Step>

      <Step title="İlk DM eşleştirmesini onaylayın (varsayılan dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Eşleştirme isteklerinin süresi 1 saat sonra dolar.
      </Step>
    </Steps>

  </Tab>

  <Tab title="SSH üzerinden uzak Mac">
    Çoğu kurulum SSH gerektirmez. Bu topolojiyi yalnızca Gateway oturum açılmış Messages Mac'inde çalışamıyorsa kullanın. OpenClaw yalnızca stdio uyumlu bir `cliPath` gerektirir; dolayısıyla `cliPath` öğesini uzak bir Mac'e SSH ile bağlanıp `imsg` çalıştıran bir sarmalayıcı betiğine yönlendirebilirsiniz.
    `imsg` öğesini Gateway ana bilgisayarına değil, söz konusu uzak Mac'e kurun ve orada güncelleyin:

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Ekler etkinleştirildiğinde önerilen yapılandırma:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // SCP eklerini getirmek için kullanılır
      includeAttachments: true,
      // İsteğe bağlı: izin verilen ek kök dizinleri (varsayılan
      // /Users/*/Library/Messages/Attachments ile birleştirilir).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost` ayarlanmamışsa OpenClaw, SSH sarmalayıcı betiğini ayrıştırarak bunu otomatik olarak algılamaya çalışır.
    `remoteHost`, `host` veya `user@host` olmalıdır (boşluk veya SSH seçeneği içeremez); güvenli olmayan değerler yok sayılır.
    OpenClaw, SCP için katı ana bilgisayar anahtarı denetimi kullanır; bu nedenle aktarma ana bilgisayarının anahtarı `~/.ssh/known_hosts` içinde zaten bulunmalıdır.
    Ek yolları izin verilen köklere göre doğrulanır (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
`imsg` önüne koyduğunuz herhangi bir `cliPath` sarmalayıcısı veya SSH proxy'si, uzun süreli JSON-RPC için şeffaf bir stdio hattı gibi DAVRANMALIDIR. OpenClaw, kanalın kullanım ömrü boyunca sarmalayıcının stdin/stdout akışları üzerinden yeni satırlarla çerçevelenmiş küçük JSON-RPC iletileri alışverişinde bulunur:

- Her stdin parçasını/satırını **baytlar kullanılabilir olur olmaz** iletin — EOF'u beklemeyin.
- Her stdout parçasını/satırını ters yönde derhâl iletin.
- Yeni satırları koruyun.
- Küçük çerçevelerin akışını engelleyebilecek sabit boyutlu bloklayıcı okumalardan (`read(4096)`, `cat | buffer`, varsayılan kabuk `read`) kaçının.
- stderr akışını JSON-RPC stdout akışından ayrı tutun.

Büyük bir blok dolana kadar stdin'i arabelleğe alan bir sarmalayıcı, `imsg rpc` sağlıklı olsa bile iMessage kesintisine benzeyen belirtilere — `imsg rpc timeout (chats.list)` veya kanalın tekrar tekrar yeniden başlatılması — neden olur. `ssh -T host imsg "$@"` (yukarıda), OpenClaw'ın `rpc` ve `--db` gibi `cliPath` bağımsız değişkenlerini ilettiği için güvenlidir. `ssh host imsg | grep -v '^DEBUG'` gibi işlem hatları güvenli DEĞİLDİR — satır arabellekli araçlar yine de çerçeveleri bekletebilir; filtreleme yapmanız gerekiyorsa her aşamada `stdbuf -oL -eL` kullanın.
</Warning>

  </Tab>
</Tabs>

## Gereksinimler ve izinler (macOS)

- Messages'da, `imsg` çalıştıran Mac'te oturum açılmış olmalıdır.
- OpenClaw/`imsg` çalıştıran işlem bağlamı için Tam Disk Erişimi gerekir (Messages veritabanı erişimi).
- Messages.app üzerinden ileti göndermek için Otomasyon izni gerekir.
- Gelişmiş eylemler (tepki verme / düzenleme / göndermeyi geri alma / ileti dizili yanıt / efektler / anketler / grup işlemleri) için Sistem Bütünlüğü Koruması devre dışı bırakılmalıdır — bkz. [imsg özel API'sini etkinleştirme](#enabling-the-imsg-private-api). Temel metin ve medya gönderme/alma işlemleri bu olmadan çalışır.

<Tip>
İzinler işlem bağlamı başına verilir. Gateway başsız çalışıyorsa (LaunchAgent/SSH), istemleri tetiklemek için aynı bağlamda tek seferlik etkileşimli bir komut çalıştırın:

```bash
imsg chats --limit 1
# veya
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH sarmalayıcısıyla gönderimler AppleEvents -1743 hatasıyla başarısız oluyor">
  Uzak SSH kurulumu sohbetleri okuyabilir, `channels status --probe` kontrolünden geçebilir ve gelen iletileri işleyebilir; ancak giden gönderimler yine de bir AppleEvents yetkilendirme hatasıyla başarısız olabilir:

```text
Messages'a Apple event'ları gönderme yetkisi yok. (-1743)
```

Oturum açılmış Mac kullanıcısının TCC veritabanını veya System Settings > Privacy & Security > Automation yolunu kontrol edin. Automation girdisi `imsg` veya yerel kabuk işlemi yerine `/usr/libexec/sshd-keygen-wrapper` için kaydedilmişse macOS, söz konusu SSH sunucu tarafı istemcisi için kullanılabilir bir Messages anahtarı göstermeyebilir:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

Bu durumda `tccutil reset AppleEvents` işlemini tekrarlamak veya `imsg send` öğesini aynı SSH sarmalayıcısı üzerinden yeniden çalıştırmak başarısız olmaya devam edebilir; çünkü Messages Automation iznine ihtiyaç duyan işlem bağlamı, kullanıcı arayüzünün izin verebileceği bir uygulama değil SSH sarmalayıcısıdır.

Bunun yerine desteklenen `imsg` işlem bağlamlarından birini kullanın:

- Gateway'i veya en azından `imsg` köprüsünü oturum açmış Messages kullanıcısının yerel oturumunda çalıştırın.
- Aynı oturumdan Tam Disk Erişimi ve Otomasyon izni verdikten sonra Gateway'i söz konusu kullanıcıya ait bir LaunchAgent ile başlatın.
- İki kullanıcılı SSH topolojisini korursanız kanalı etkinleştirmeden önce gerçek bir giden `imsg send` işleminin tam olarak aynı sarmalayıcı üzerinden başarılı olduğunu doğrulayın. Otomasyon izni verilemiyorsa gönderimler için SSH sarmalayıcısına güvenmek yerine tek kullanıcılı bir `imsg` kurulumu kullanacak şekilde yeniden yapılandırın.

</Accordion>

## imsg özel API'sini etkinleştirme

`imsg` iki çalışma moduyla sunulur. OpenClaw için Özel API modu önerilen kurulumdur; çünkü kanala kullanıcıların beklediği yerel iMessage eylemlerini sağlar. Temel mod, düşük riskli kurulumlar, ilk doğrulama veya SIP'in devre dışı bırakılamadığı ana bilgisayarlar için kullanışlı olmaya devam eder.

- **Temel mod** (varsayılan, SIP değişikliği gerekmez): `send` üzerinden giden metin ve medya, gelen ileti izleme/geçmişi, sohbet listesi. Yeni bir `brew install steipete/tap/imsg` kurulumu ve yukarıdaki standart macOS izinleriyle kutudan çıktığı hâliyle elde edilen budur.
- **Özel API modu**: `imsg`, dahili `IMCore` işlevlerini çağırmak için `Messages.app` içine bir yardımcı dylib enjekte eder. Bu; `react`, `edit`, `unsend`, `reply` (ileti dizili), `sendWithEffect`, `poll` ve `poll-vote` (yerel Messages anketleri), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, ayrıca yazıyor göstergeleri ve okundu bilgileri özelliklerini açar.

Bu sayfada önerilen eylem yüzeyi Özel API modunu gerektirir. `imsg` README'si bu gereksinimi açıkça belirtir:

> `read`, `typing`, `launch`, köprü destekli zengin gönderim, ileti değiştirme ve sohbet yönetimi gibi gelişmiş özellikler isteğe bağlıdır. Bunlar için SIP'in devre dışı bırakılması ve `Messages.app` içine bir yardımcı dylib enjekte edilmesi gerekir. SIP etkin olduğunda `imsg launch` enjeksiyon yapmayı reddeder.

Yardımcı enjeksiyon tekniği, Messages özel API'lerine erişmek için `imsg` öğesinin kendi dylib'ini kullanır. OpenClaw iMessage yolunda üçüncü taraf bir sunucu veya BlueBubbles çalışma zamanı yoktur.

<Warning>
**SIP'i devre dışı bırakmak gerçek bir güvenlik ödünleşimidir.** SIP, macOS'un değiştirilmiş sistem kodlarının çalıştırılmasına karşı temel korumalarından biridir; sistem genelinde kapatılması ek saldırı yüzeyleri ve yan etkiler doğurur. Özellikle **Apple Silicon Mac'lerde SIP'i devre dışı bırakmak, Mac'inize iOS uygulamaları yükleme ve çalıştırma olanağını da devre dışı bırakır**.

Bunu, özellikle birincil kişisel Mac'te bilinçli bir işletim tercihi olarak değerlendirin. Üretim kalitesinde OpenClaw iMessage için köprüyü etkinleştirme konusunda rahat olduğunuz özel bir Mac veya bot macOS kullanıcısını tercih edin. Tehdit modeliniz SIP'in herhangi bir yerde kapalı olmasına izin vermiyorsa birlikte sunulan iMessage temel modla sınırlıdır — yalnızca metin ve medya gönderme/alma; tepki / düzenleme / göndermeyi geri alma / efektler / grup işlemleri yoktur.
</Warning>

### Kurulum

1. Messages.app çalıştıran Mac'te **`imsg` öğesini kurun (veya yükseltin)**:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` çıktısı `bridge_version`, `rpc_methods` ve yöntem başına `selectors` bilgilerini bildirir; böylece başlamadan önce mevcut derlemenin neleri desteklediğini görebilirsiniz.

2. **Sistem Bütünlüğü Koruması'nı ve (modern macOS'te) Kitaplık Doğrulaması'nı devre dışı bırakın.** Apple imzalı `Messages.app` içine Apple'a ait olmayan bir yardımcı dylib eklemek için SIP'in kapalı **ve** kitaplık doğrulamasının gevşetilmiş olması gerekir. Kurtarma modundaki SIP adımı macOS sürümüne özeldir:
   - **macOS 10.13-10.15 (Sierra-Catalina):** Terminal üzerinden Kitaplık Doğrulaması'nı devre dışı bırakın, Kurtarma Modu'nda yeniden başlatın, `csrutil disable` komutunu çalıştırın, yeniden başlatın.
   - **macOS 11+ (Big Sur ve sonrası), Intel:** Kurtarma Modu'na (veya İnternet Kurtarma'ya) girin, `csrutil disable` komutunu çalıştırın, yeniden başlatın.
   - **macOS 11+, Apple Silicon:** Kurtarma'ya girmek için güç düğmesiyle başlatma sırasını uygulayın; güncel macOS sürümlerinde Continue öğesine tıklarken **Left Shift** tuşunu basılı tutun, ardından `csrutil disable` komutunu çalıştırın. Sanal makine kurulumları ayrı bir akış izlediğinden önce bir VM anlık görüntüsü alın.

   **macOS 11 ve sonrasında yalnızca `csrutil disable` genellikle yeterli değildir.** Apple, bir platform ikili dosyası olan `Messages.app` için kitaplık doğrulamasını uygulamaya devam eder; bu nedenle SIP kapalı olsa bile geçici olarak imzalanmış bir yardımcı reddedilir (`Library Validation failed: ... platform binary, but mapped file is not`). SIP'i devre dışı bıraktıktan sonra kitaplık doğrulamasını da devre dışı bırakın ve yeniden başlatın:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), 26.5.1 üzerinde doğrulandı:** SIP'in kapalı olmasıyla birlikte yukarıdaki `DisableLibraryValidation` komutu, yardımcıyı 26.0 ile 26.5.x arasındaki sürümlerin tamamında eklemek için yeterlidir. **Hiçbir boot-args gerekli değildir.** Plist belirleyici etkendir ve Tahoe'da ekleme başarısız olduğunda en sık eksik olan adımdır:
   - **Plist ile:** `imsg launch` eklemeyi gerçekleştirir ve `imsg status`, `advanced_features: true` bildirir.
   - **Plist olmadan (SIP kapalı olsa bile):** `imsg launch`, `Failed to launch: Timeout waiting for Messages.app to initialize` hatasıyla başarısız olur. AMFI, geçici olarak imzalanmış yardımcıyı yükleme sırasında reddeder; dolayısıyla köprü hiçbir zaman hazır hâle gelmez ve başlatma zaman aşımına uğrar. Bu zaman aşımı, çoğu kişinin Tahoe'da karşılaştığı belirtidir; çözüm daha sert bir işlem değil, yukarıdaki plist'tir.

   Bir macOS yükseltmesinden sonra `imsg launch` ekleme işlemi veya belirli `selectors` değerleri false döndürmeye başlarsa olağan neden bu geçittir. SIP adımının başarısız olduğunu varsaymadan önce SIP ve kitaplık doğrulaması durumunu kontrol edin. Bu ayarlar doğru olduğu hâlde köprü yine de eklenemiyorsa sistem genelindeki ek güvenlik denetimlerini zayıflatmak yerine `imsg status --json` ile `imsg launch` çıktısını toplayıp `imsg` projesine bildirin.

3. **Yardımcıyı ekleyin.** SIP devre dışıyken ve Messages.app oturumu açıkken:

   ```bash
   imsg launch
   ```

   SIP hâlâ etkinse `imsg launch` ekleme işlemini reddeder; dolayısıyla bu işlem, 2. adımın uygulandığını da doğrular.

4. **Köprüyü OpenClaw üzerinden doğrulayın:**

   ```bash
   openclaw channels status --probe
   ```

   iMessage girdisi `works` bildirmeli ve `imsg status --json | jq '{rpc_methods, selectors}'`, macOS derlemenizin sunduğu yetenekleri göstermelidir. Anket oluşturmak için `selectors.pollPayloadMessage`; oy vermek için hem `selectors.pollVoteMessage` hem de `poll.vote` RPC yöntemi gerekir. OpenClaw Plugin yalnızca önbelleğe alınmış yoklamanın desteklediği eylemleri duyurur; boş bir önbellek ise iyimser kalır ve ilk gönderimde yoklama yapar.

`openclaw channels status --probe`, kanalı `works` olarak bildiriyor ancak belirli eylemler gönderim sırasında "iMessage `<action>` requires the imsg private API bridge" hatası veriyorsa `imsg launch` komutunu yeniden çalıştırın — yardımcı devre dışı kalabilir (Messages.app yeniden başlatması, işletim sistemi güncellemesi vb.) ve önbelleğe alınmış `available: true` durumu, sonraki yoklama yenileyene kadar eylemleri duyurmaya devam eder.

### SIP etkin kaldığında

SIP'i devre dışı bırakmak tehdit modeliniz açısından kabul edilebilir değilse:

- `imsg`, temel moda geri döner — yalnızca metin + medya + alma.
- OpenClaw Plugin, metin/medya gönderimini ve gelen ileti izlemeyi duyurmaya devam eder; `react`, `edit`, `unsend`, `reply`, `sendWithEffect` ve grup işlemlerini eylem yüzeyinden gizler (yöntem başına yetenek geçidine göre).
- Birincil aygıtlarınızda SIP'i etkin tutarken iMessage iş yükü için SIP'i kapalı ayrı bir Apple Silicon olmayan Mac (veya özel bir bot Mac) çalıştırabilirsiniz. Aşağıdaki [Özel bot macOS kullanıcısı (ayrı iMessage kimliği)](#deployment-patterns) bölümüne bakın.

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM politikası">
    `channels.imessage.dmPolicy`, doğrudan mesajları denetler:

    - `pairing` (varsayılan)
    - `allowlist` (en az bir `allowFrom` girdisi gerektirir)
    - `open` (`allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    İzin verilenler listesi alanı: `channels.imessage.allowFrom`.

    İzin verilenler listesi girdileri göndericileri tanımlamalıdır: tanıtıcılar veya statik gönderici erişim grupları (`accessGroup:<name>`). `chat_id:*`, `chat_guid:*` veya `chat_identifier:*` gibi sohbet hedefleri için `channels.imessage.groupAllowFrom`; sayısal `chat_id` kayıt anahtarları için `channels.imessage.groups` kullanın.

  </Tab>

  <Tab title="Grup politikası + bahsetmeler">
    `channels.imessage.groupPolicy`, grup işlemeyi denetler:

    - `allowlist` (varsayılan)
    - `open`
    - `disabled`

    Grup göndericisi izin verilenler listesi: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom` girdileri statik gönderici erişim gruplarına da başvurabilir (`accessGroup:<name>`).

    Çalışma zamanı geri dönüşü: `groupAllowFrom` ayarlanmamışsa iMessage grup göndericisi denetimleri `allowFrom` kullanır; DM ve grup kabulünün farklı olması gerekiyorsa `groupAllowFrom` ayarlayın. Açıkça boş olan `groupAllowFrom: []` geri dönüş yapmaz — `allowlist` altında tüm grup göndericilerini engeller.
    Çalışma zamanı notu: `channels.imessage` tamamen eksikse çalışma zamanı `groupPolicy="allowlist"` değerine geri döner ve (`channels.defaults.groupPolicy` ayarlanmış olsa bile) bir uyarı günlüğe kaydeder.

    <Warning>
    `groupPolicy: "allowlist"` altındaki grup yönlendirmesi art arda **iki** geçit çalıştırır:

    1. **Gönderici izin verilenler listesi** (`channels.imessage.groupAllowFrom`) — tanıtıcı, `accessGroup:<name>`, `chat_guid`, `chat_identifier` veya `chat_id`. Etkin listenin boş olması (`groupAllowFrom` ve `allowFrom` geri dönüşünün bulunmaması) tüm grup göndericilerini engeller.
    2. **Grup kaydı** (`channels.imessage.groups`) — eşlemde girdiler bulunduğunda uygulanır: sohbet, açık bir `chat_id` başına girdisiyle veya `groups: { "*": { ... } }` joker karakteriyle eşleşmelidir. `groups` boş veya eksik olduğunda kabulü yalnızca gönderici izin verilenler listesi belirler.

    Etkin bir grup göndericisi izin verilenler listesi yapılandırılmamışsa her grup mesajı kayıt geçidine ulaşmadan bırakılır. Her geçidin varsayılan günlük düzeyinde kendi `warn` düzeyi sinyali vardır ve her biri farklı bir çözüm belirtir:

    - etkin grup göndericisi izin verilenler listesi boş olduğunda başlangıçta hesap başına bir kez: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — `channels.imessage.groupAllowFrom` (veya `allowFrom`) ayarlayarak düzeltin; yalnızca `groups` girdileri eklemek, geçit 1'in tüm göndericileri engellemeye devam etmesine neden olur.
    - bir gönderici geçit 1'i geçtiğinde ancak sohbet doldurulmuş bir `groups` kaydında bulunmadığında, çalışma zamanında `chat_id` başına bir kez: `imessage: dropping group message from chat_id=<id> ...` — ilgili `chat_id` (veya `"*"`) değerini `channels.imessage.groups` altına ekleyerek düzeltin.

    DM'ler etkilenmez — farklı bir kod yolu kullanırlar.

    `groupPolicy: "allowlist"` altında grup akışı için önerilen yapılandırma:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    Yalnızca `groupAllowFrom`, bu göndericileri herhangi bir grupta kabul eder; izin verilen sohbetlerin kapsamını belirlemek (ve `requireMention` gibi sohbet başına seçenekleri ayarlamak) için `groups` bloğunu ekleyin.
    </Warning>

    Gruplar için bahsetme geçidi:

    - iMessage yerel bahsetme meta verilerine sahip değildir
    - bahsetme algılama, regex kalıplarını kullanır (`agents.list[].groupChat.mentionPatterns`, geri dönüş `messages.groupChat.mentionPatterns`)
    - yapılandırılmış kalıp olmadığında bahsetme geçidi uygulanamaz
    - yetkili göndericilerden gelen denetim komutları bahsetme geçidini atlar

    Grup başına `systemPrompt`:

    `channels.imessage.groups.*` altındaki her girdi, o gruptaki bir mesajı işleyen her turda aracının sistem istemine eklenen isteğe bağlı bir `systemPrompt` dizesini kabul eder. Çözümleme, `channels.whatsapp.groups` davranışını yansıtır:

    1. **Gruba özgü sistem istemi** (`groups["<chat_id>"].systemPrompt`): belirli grup girdisi eşlemde bulunduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş bir dizeyse (`""`) joker karakter bastırılır ve o gruba hiçbir sistem istemi uygulanmaz.
    2. **Grup joker karakteri sistem istemi** (`groups["*"].systemPrompt`): belirli grup girdisi eşlemde hiç bulunmadığında veya bulunduğu hâlde `systemPrompt` anahtarı tanımlamadığında kullanılır.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "İngiliz İngilizcesi yazımını kullan." },
            "8421": {
              requireMention: true,
              systemPrompt: "Bu, nöbet rotasyonu sohbetidir. Yanıtları 3 cümlenin altında tut.",
            },
            "9907": {
              // açık bastırma: "İngiliz İngilizcesi yazımını kullan." joker karakteri burada geçerli değildir
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Grup başına istemler yalnızca grup mesajlarına uygulanır — doğrudan mesajlar etkilenmez.

  </Tab>

  <Tab title="Oturumlar ve belirlenimci yanıtlar">
    - DM'ler doğrudan yönlendirmeyi, gruplar ise grup yönlendirmesini kullanır.
    - Varsayılan `session.dmScope=main` ile iMessage DM'leri aracı ana oturumunda birleştirilir.
    - Grup oturumları yalıtılmıştır (`agent:<agentId>:imessage:group:<chat_id>`).
    - Yanıtlar, kaynak kanal/hedef meta verileri kullanılarak iMessage'a geri yönlendirilir.

    Grup benzeri ileti dizisi davranışı:

    Bazı çok katılımcılı iMessage ileti dizileri `is_group=false` ile gelebilir.
    Bu `chat_id`, `channels.imessage.groups` altında açıkça yapılandırılmışsa OpenClaw bunu grup trafiği olarak ele alır (grup geçidi + grup oturumu yalıtımı).

  </Tab>
</Tabs>

## ACP görüşme bağlamaları

iMessage sohbetleri ACP oturumlarına bağlanabilir.

Hızlı operatör akışı:

- DM veya izin verilen grup sohbetinin içinde `/acp spawn codex --bind here` komutunu çalıştırın.
- Aynı iMessage görüşmesindeki sonraki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Yapılandırılmış kalıcı bağlamalar, `type: "acp"` ve `match.channel: "imessage"` içeren üst düzey `bindings[]` girdilerini kullanır.

`match.peer.id` şunları kullanabilir:

- `+15555550123` veya `user@example.com` gibi normalleştirilmiş DM tanıtıcısı
- `chat_id:<id>` (kararlı grup bağlamaları için önerilir)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Örnek:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Paylaşılan ACP bağlama davranışı için [ACP Aracıları](/tr/tools/acp-agents) bölümüne bakın.

## Dağıtım kalıpları

<AccordionGroup>
  <Accordion title="Özel bot macOS kullanıcısı (ayrı iMessage kimliği)">
    Bot trafiğini kişisel Messages profilinizden yalıtmak için özel bir Apple ID ve macOS kullanıcısı kullanın.

    Tipik akış:

    1. Özel bir macOS kullanıcısı oluşturun/bu kullanıcıyla oturum açın.
    2. Bu kullanıcıda bot Apple ID'siyle Messages'a giriş yapın.
    3. Bu kullanıcıda `imsg` yükleyin.
    4. OpenClaw'un bu kullanıcı bağlamında `imsg` çalıştırabilmesi için bir SSH sarmalayıcısı oluşturun.
    5. `channels.imessage.accounts.<id>.cliPath` ve `.dbPath` ayarlarını bu kullanıcı profiline yönlendirin.

    İlk çalıştırmada, söz konusu bot kullanıcı oturumunda GUI onayları (Automation + Full Disk Access) gerekebilir.

  </Accordion>

  <Accordion title="Tailscale üzerinden uzak Mac (örnek)">
    Yaygın topoloji:

    - gateway Linux/VM üzerinde çalışır
    - iMessage + `imsg` tailnet'inizdeki bir Mac üzerinde çalışır
    - `cliPath` sarmalayıcısı, `imsg` çalıştırmak için SSH kullanır
    - `remoteHost`, SCP ile eklerin alınmasını etkinleştirir

    Örnek:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    Hem SSH'nin hem de SCP'nin etkileşimsiz çalışması için SSH anahtarları kullanın.
    `known_hosts` doldurulabilsin diye önce ana bilgisayar anahtarının güvenilir olduğundan emin olun (örneğin `ssh bot@mac-mini.tailnet-1234.ts.net`).

  </Accordion>

  <Accordion title="Çok hesaplı kullanım kalıbı">
    iMessage, `channels.imessage.accounts` altında hesap başına yapılandırmayı destekler.

    Her hesap; `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, geçmiş ayarları ve ek kökü izin listeleri gibi alanları geçersiz kılabilir.

  </Accordion>

  <Accordion title="Doğrudan mesaj geçmişi">
    Yeni doğrudan mesaj oturumlarını söz konusu konuşmanın yakın zamandaki, kodu çözülmüş `imsg` geçmişiyle başlatmak için `channels.imessage.dmHistoryLimit` ayarını belirleyin. Bir gönderen için geçmişi devre dışı bırakan `0` dâhil olmak üzere, gönderen başına geçersiz kılmalar için `channels.imessage.dms["<sender>"].historyLimit` kullanın.

    iMessage DM geçmişi, gerektiğinde `imsg` kaynağından alınır. `dmHistoryLimit` ayarının belirtilmemesi, genel DM geçmişiyle başlangıç verisi sağlamayı devre dışı bırakır; ancak gönderen başına pozitif bir `channels.imessage.dms["<sender>"].historyLimit` değeri, söz konusu gönderen için başlangıç verisi sağlamayı yine etkinleştirir.

  </Accordion>
</AccordionGroup>

## Medya, parçalara ayırma ve teslim hedefleri

<AccordionGroup>
  <Accordion title="Ekler ve medya">
    - gelen eklerin alınması **varsayılan olarak kapalıdır** — fotoğrafları, sesli notları, videoları ve diğer ekleri agente iletmek için `channels.imessage.includeAttachments: true` ayarını belirleyin. Bu ayar devre dışıyken yalnızca ek içeren iMessage'lar agente ulaşmadan bırakılır ve hiçbir `Inbound message` günlük satırı oluşturulmayabilir.
    - `remoteHost` ayarlandığında uzak ek yollarındaki dosyalar SCP aracılığıyla alınabilir
    - ek yolları izin verilen köklerle eşleşmelidir:
      - `channels.imessage.attachmentRoots` (yerel)
      - `channels.imessage.remoteAttachmentRoots` (uzak SCP modu)
      - yapılandırılan kökler, varsayılan `/Users/*/Library/Messages/Attachments` kök kalıbını genişletir (yerine geçmez, birleştirilir)
    - SCP, katı ana bilgisayar anahtarı denetimi kullanır (`StrictHostKeyChecking=yes`)
    - giden medya boyutu `channels.imessage.mediaMaxMb` kullanır (varsayılan 16 MB)

  </Accordion>

  <Accordion title="Giden metin ve parçalara ayırma">
    - metin parçası sınırı: `channels.imessage.textChunkLimit` (varsayılan 4000)
    - parçalama modu: `channels.imessage.streaming.chunkMode`
      - `length` (varsayılan)
      - `newline` (önce paragrafa göre bölme)
    - giden markdown kalın/italik/altı çizili/üstü çizili biçimlendirmesi yerel biçimlendirilmiş metne dönüştürülür (macOS 15+ alıcıları biçimlendirmeyi görüntüler; eski sürümleri kullanan alıcılar işaretçiler olmadan düz metin görür); markdown tabloları kanalın markdown tablo moduna göre dönüştürülür
    - `channels.imessage.sendTransport` (`auto` varsayılan, `bridge`, `applescript`), `imsg` öğesinin gönderimleri nasıl teslim edeceğini seçer

  </Accordion>

  <Accordion title="Adresleme biçimleri">
    Tercih edilen açık hedefler:

    - `chat_id:123` (kararlı yönlendirme için önerilir)
    - `chat_guid:...`
    - `chat_identifier:...`

    Tanıtıcı hedefleri de desteklenir:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Özel API eylemleri

`imsg launch` çalışırken ve `openclaw channels status --probe`, `privateApi.available: true` bildirirken mesaj aracı, normal metin gönderimlerine ek olarak iMessage'a özgü eylemleri kullanabilir.

Tüm eylemler varsayılan olarak etkindir; ayrı ayrı eylemleri kapatmak için `channels.imessage.actions` kullanın:

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Kullanılabilir eylemler">
    - **react**: iMessage tapback'leri ekleyin/kaldırın (`messageId`, `emoji`, `remove`). Desteklenen tapback'ler sevgi, beğenme, beğenmeme, gülme, vurgulama ve soru tepkilerine eşlenir. Emoji belirtmeden kaldırmak, ayarlanmış tapback ne olursa olsun onu temizler.
    - **reply**: Mevcut bir mesaja ileti dizili yanıt gönderin (`messageId`, `text` veya `message`; ayrıca `chatGuid`, `chatId`, `chatIdentifier` veya `to`). Ekli yanıt ayrıca `--file` destekleyen bir `send-rich` içeren `imsg` derlemesi gerektirir.
    - **sendWithEffect**: Bir iMessage efektiyle metin gönderin (`text` veya `message`, `effect` veya `effectId`). Kısa adlar: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit**: Desteklenen macOS/özel API sürümlerinde gönderilmiş bir mesajı düzenleyin (`messageId`, `text` veya `newText`). Yalnızca gateway'in kendisinin gönderdiği mesajlar düzenlenebilir.
    - **unsend**: Desteklenen macOS/özel API sürümlerinde gönderilmiş bir mesajı geri çekin (`messageId`). Yalnızca gateway'in kendisinin gönderdiği mesajlar geri çekilebilir.
    - **upload-file**: Medya/dosya gönderin (`buffer` base64 olarak veya doldurulmuş bir `media`/`path`/`filePath`, `filename`, isteğe bağlı `asVoice`). Eski takma ad: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Geçerli hedef bir grup konuşması olduğunda grup sohbetlerini yönetin. Bunlar ana bilgisayarın Messages kimliğini değiştirir; dolayısıyla sahip olan bir gönderici veya bir `operator.admin` Gateway istemcisi gerektirir.
    - **poll**: Yerel bir Apple Messages anketi oluşturun (`pollQuestion`, 2 ila 12 kez yinelenen `pollOption`; ayrıca `chatGuid`, `chatId`, `chatIdentifier` veya `to`). iOS/iPadOS/macOS 26+ kullanan alıcılar anketi yerel olarak görüp oy verebilir; eski işletim sistemi sürümleri "Anket gönderildi" metin yedeğini alır. `selectors.pollPayloadMessage` gerektirir.
    - **poll-vote**: Mevcut bir ankette oy verin (`pollId` veya `messageId`; ayrıca `pollOptionIndex`, `pollOptionId` veya `pollOptionText` seçeneklerinden tam olarak biri). `selectors.pollVoteMessage` ve `poll.vote` RPC yöntemini gerektirir.

    Kabul edilen gelen anketler, soru, numaralandırılmış seçenek etiketleri, oy sayıları ve `poll-vote` için gereken anket mesajı kimliğiyle birlikte agent için işlenir.

  </Accordion>

  <Accordion title="Mesaj kimlikleri">
    Gelen iMessage bağlamı, mevcut olduğunda hem kısa `MessageSid` değerlerini hem de tam mesaj GUID'lerini (`MessageSidFull`) içerir. Kısa kimlikler, yakın zamandaki SQLite destekli yanıt önbelleğiyle sınırlıdır ve kullanılmadan önce geçerli sohbetle karşılaştırılarak denetlenir. Kısa bir kimliğin süresi dolarsa kimliği sağlayan konuşmayı hedefleyerek ilgili `MessageSidFull` ile yeniden deneyin. Tam kimlikler konuşma veya hesap bağlamasını atlamaz; bu nedenle başka bir sohbetten gelen kimliği geçerli hedefteki bir kimlikle değiştirin. Uzakta devredilen çağrılar, geçerli konuşmaya ait kanıt bulunamadığında eski tam kimlikleri reddedebilir.

  </Accordion>

  <Accordion title="Yetenek algılama">
    OpenClaw, özel API eylemlerini yalnızca önbelleğe alınmış yoklama durumu köprünün kullanılamadığını belirttiğinde gizler. Durum bilinmiyorsa eylemler görünür kalır ve gönderim sırasında yoklamalar gerektiğinde yapılır; böylece ilk eylem, ayrı bir manuel durum yenilemesi olmadan `imsg launch` sonrasında başarılı olabilir.

  </Accordion>

  <Accordion title="Okundu bilgileri ve yazıyor göstergesi">
    Özel API köprüsü çalışırken kabul edilen gelen sohbetler okundu olarak işaretlenir ve doğrudan sohbetlerde, tur kabul edilir edilmez agent bağlamı hazırlayıp yanıt üretirken bir yazıyor balonu gösterilir. Okundu olarak işaretlemeyi şu şekilde devre dışı bırakın:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Yöntem başına yetenek listesi denetiminden önceki eski `imsg` derlemeleri, yazıyor/okundu özelliklerini sessizce devre dışı bırakır; OpenClaw, eksik okundu bilgisinin nedeni belirlenebilsin diye her yeniden başlatmada bir kez uyarı kaydeder.

  </Accordion>

  <Accordion title="Gelen tapback'ler">
    OpenClaw, iMessage tapback'lerine abone olur ve kabul edilen tepkileri normal mesaj metni yerine sistem olayları olarak yönlendirir; böylece bir kullanıcı tapback'i sıradan bir yanıt döngüsünü tetiklemez.

    Bildirim modu `channels.imessage.reactionNotifications` tarafından denetlenir:

    - `"own"` (varsayılan): yalnızca kullanıcılar bot tarafından yazılmış mesajlara tepki verdiğinde bildirim gönderin.
    - `"all"`: yetkili gönderenlerden gelen tüm tapback'ler için bildirim gönderin.
    - `"off"`: gelen tapback'leri yok sayın.

    Hesap başına geçersiz kılmalar `channels.imessage.accounts.<id>.reactionNotifications` kullanır.

  </Accordion>

  <Accordion title="Onay tepkileri (👍 / 👎)">
    `approvals.exec.enabled` veya `approvals.plugin.enabled` true olduğunda ve istek iMessage'a yönlendirildiğinde gateway, onay istemini yerel olarak teslim eder ve istemi sonuçlandırmak için bir tapback kabul eder:

    - `👍` (Beğen tapback'i) → `allow-once`
    - `👎` (Beğenme tapback'i) → `deny`
    - `allow-always` manuel bir geri dönüş olarak kalır: `/approve <id> allow-always` öğesini normal bir yanıt olarak gönderin.

    Tepki işleme, tepki veren kullanıcının tanıtıcısının açıkça onaylayan olarak belirtilmesini gerektirir. Onaylayanlar listesi `channels.imessage.allowFrom` (veya `channels.imessage.accounts.<id>.allowFrom`) kaynağından okunur; kullanıcının telefon numarasını E.164 biçiminde veya Apple ID e-posta adresini ekleyin (`chat_id:*` gibi sohbet hedefleri geçerli onaylayan girdileri değildir). `"*"` joker karakter girdisi kabul edilir ancak herhangi bir gönderenin onay vermesine izin verir; boş bir onaylayanlar listesi tepki kısayolunu tamamen devre dışı bırakır. Açık onaylayan izin listesi onay çözümlemesi için önemli olan tek denetim olduğundan, tepki kısayolu kasıtlı olarak `reactionNotifications`, `dmPolicy` ve `groupAllowFrom` denetimlerini atlar.

    `/approve` metin komutu yetkilendirmesi aynı listeyi izler: `channels.imessage.allowFrom` boş olmadığında, `/approve <id> <decision>` daha geniş DM izin listesine göre değil bu onaylayanlar listesine göre yetkilendirilir ve DM izin listesinde izin verilen ancak `allowFrom` içinde bulunmayan gönderenler açık bir ret yanıtı alır. `allowFrom` boş olduğunda aynı sohbet geri dönüşü geçerliliğini korur ve `/approve`, DM izin listesinin izin verdiği herkesi yetkilendirir. Onay vermesi gereken her operatörü — `/approve` veya tepkiler aracılığıyla — `allowFrom` listesine ekleyin.

    Operatör notları:
    - Tepki bağlaması hem bellekte hem de gateway'in kalıcı anahtarlı deposunda saklanır (TTL, onayın sona erme süresiyle eşleşir); ayrıca gateway, bekleyen istemleri tapback'ler için yoklar. Böylece gateway yeniden başlatıldıktan kısa süre sonra ulaşan bir tapback yine de onayı sonuçlandırır.
    - Operatörün kendi `is_from_me=true` tapback'i (örneğin eşlenmiş bir Apple aygıtından), ilgili tanıtıcı açıkça onaylayan olarak tanımlanmışsa onayı sonuçlandırır.
    - Onay istemleri yalnızca açık onaylayanlar yapılandırıldığında grup konuşmasına yönlendirilir; aksi takdirde herhangi bir grup üyesi onay verebilir.
    - Eski metin tarzı tapback'ler (çok eski Apple istemcilerinden gelen `Liked "…"` düz metni), mesaj GUID'si taşımadıkları için onayları sonuçlandıramaz; tepkinin çözümlenmesi, güncel macOS / iOS istemcilerinin gönderdiği yapılandırılmış tapback meta verilerini gerektirir.

  </Accordion>
</AccordionGroup>

## Yapılandırma yazmaları

iMessage, kanal tarafından başlatılan yapılandırma yazmalarına varsayılan olarak izin verir (`commands.config: true` olduğunda `/config set|unset` için).

Devre dışı bırakma:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Bölünmüş gönderimli DM'leri birleştirme (tek oluşturma işleminde komut + URL)

Bir kullanıcı bir komutla URL'yi birlikte yazdığında — ör. `Dump https://example.com/article` — Apple'ın Mesajlar uygulaması gönderimi **iki ayrı `chat.db` satırına** böler:

1. Bir metin mesajı (`"Dump"`).
2. Ek olarak OG önizleme görsellerini içeren bir URL önizleme balonu (`"https://..."`).

Çoğu kurulumda iki satır OpenClaw'a yaklaşık 0.8-2.0 sn arayla ulaşır. Birleştirme olmadan agent, 1. turda yalnızca komutu alır (ve çoğunlukla "URL'yi bana gönder" diye yanıtlar); URL ise 2. turda gelir. Bu, Apple'ın gönderim işlem hattıdır; OpenClaw veya `imsg` tarafından oluşturulmaz.

`channels.imessage.coalesceSameSenderDms`, bir DM için aynı göndericiden art arda gelen satırların arabelleğe alınmasını etkinleştirir. `imsg`, kaynak satırlardan birinde yapısal URL önizleme işaretçisi `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` değerini sunduğunda OpenClaw yalnızca bu gerçek bölünmüş gönderimi birleştirir ve arabellekteki diğer satırları ayrı turlar olarak tutar. Hiç balon meta verisi göndermeyen eski `imsg` derlemelerinde OpenClaw, bölünmüş gönderim ile ayrı gönderimleri ayırt edemez ve bu nedenle paket içeriğini birleştirmeye geri döner. Bu, `Dump <url>` bölünmüş gönderimlerini iki tura geriletmek yerine meta veri öncesindeki davranışı korur. Çok kullanıcılı tur yapısının korunması için grup sohbetleri mesaj başına dağıtılmaya devam eder.

<Tabs>
  <Tab title="Ne zaman etkinleştirilir">
    Şu durumlarda etkinleştirin:

    - Tek bir mesajda `command + payload` bekleyen Skills sağlıyorsanız (dökme, yapıştırma, kaydetme, kuyruğa alma vb.).
    - Kullanıcılarınız komutlarla birlikte URL yapıştırıyorsa.
    - Ek DM turu gecikmesini kabul edebiliyorsanız (aşağıya bakın).

    Şu durumlarda devre dışı bırakın:

    - Tek sözcüklü DM tetikleyicileri için en düşük komut gecikmesine ihtiyacınız varsa.
    - Tüm akışlarınız, ardından yük gönderilmeyen tek seferlik komutlardan oluşuyorsa.

  </Tab>
  <Tab title="Etkinleştirme">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // etkinleştirme (varsayılan: false)
        },
      },
    }
    ```

    Bayrak açıkken ve açıkça `messages.inbound.byChannel.imessage` veya genel `messages.inbound.debounceMs` belirtilmemişse geri tepme penceresi **7000 ms** değerine genişler (eski varsayılan 0 ms'dir — geri tepme uygulanmaz). Daha geniş pencere gereklidir; çünkü Apple'ın URL önizlemeli bölünmüş gönderim aralığı, Messages.app önizleme satırını gönderirken birkaç saniyeye kadar uzayabilir.

    Pencereyi kendiniz ayarlamak için:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms, gözlemlenen Messages.app URL önizleme gecikmelerini kapsar.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Ödünleşimler">
    - **Kesin birleştirme, güncel `imsg` yükü meta verilerini gerektirir.** `balloon_bundle_id` mevcut olduğunda yalnızca gerçek bölünmüş gönderim birleştirilir; yukarıda açıklanan meta verisiz geri dönüş birleştirmesi, geçici geriye dönük uyumluluktur ve `imsg` bölünmüş gönderimleri üst akışta birleştirmeye başladığında kaldırılır.
    - **DM mesajları için ek gecikme.** Bayrak açıkken her DM (bağımsız denetim komutları ve tek metinli takip iletileri dahil), bir URL önizleme satırının gelme olasılığına karşı dağıtılmadan önce geri tepme penceresinin sonuna kadar bekler. Grup sohbeti mesajları anında dağıtılmaya devam eder.
    - **Birleştirilmiş çıktı sınırlıdır.** Birleştirilmiş metin, açık bir `…[truncated]` işaretçisiyle 4000 karakterle; ekler 20 ile; kaynak girdileri ise 10 ile sınırlıdır (bu sınırın ötesinde ilk ve en son girdiler korunur). Aşağı akış telemetrisi için her kaynak GUID'si `coalescedMessageGuids` içinde izlenir.
    - **Yalnızca DM.** Grup sohbetleri mesaj başına dağıtıma geçer; böylece birden fazla kişi yazarken bot yanıt vermeye devam eder.
    - **Kanal başına etkinleştirilir.** Diğer kanallar (Discord, Slack, Telegram, WhatsApp, …) etkilenmez. `channels.bluebubbles.coalesceSameSenderDms` ayarını kullanan eski BlueBubbles yapılandırmaları bu değeri `channels.imessage.coalesceSameSenderDms` konumuna taşımalıdır.

  </Tab>
</Tabs>

### Senaryolar ve agent'ın gördükleri

"Bayrak açık" sütunu, `balloon_bundle_id` gönderen bir `imsg` derlemesindeki davranışı gösterir. Hiç balon meta verisi göndermeyen eski `imsg` derlemelerinde, aşağıda "İki tur" / "N tur" olarak işaretlenen satırlar bunun yerine eski birleştirmeye (tek tur) geri döner: OpenClaw, bölünmüş gönderim ile ayrı gönderimleri yapısal olarak ayırt edemediği için meta veri öncesindeki birleştirmeyi korur. Kesin ayırma, derleme balon meta verisi göndermeye başladığında etkinleşir.

| Kullanıcının oluşturduğu                                             | `chat.db` çıktısı                    | Bayrak kapalı (varsayılan)                      | Bayrak açık + pencere (imsg balon meta verisi gönderir)                                               |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (tek gönderim)                              | Yaklaşık 1 sn arayla 2 satır                   | İki agent turu: önce yalnızca "Dump", ardından URL | Tek tur: birleştirilmiş metin `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (ek + metin)                | URL balonu meta verisi olmadan 2 satır | İki tur                               | Meta veri gözlemlendikten sonra iki tur; eski/ön mandallama meta verisiz oturumlarda birleştirilmiş tek tur       |
| `/status` (bağımsız komut)                                     | 1 satır                               | Anında dağıtım                        | **Pencerenin sonuna kadar bekle, ardından dağıt**                                                                |
| Yalnızca URL yapıştırılmış                                             | 1 satır                               | Anında dağıtım                        | Pencerenin sonuna kadar bekle, ardından dağıt                                                                    |
| Metin + URL, dakikalar arayla kasıtlı olarak iki ayrı mesaj şeklinde gönderilmiş | Pencere dışında 2 satır               | İki tur                               | İki tur (aralarında pencerenin süresi dolar)                                                             |
| Hızlı akın (pencere içinde >10 küçük DM)                          | URL balonu meta verisi olmadan N satır | N tur                                 | Meta veri gözlemlendikten sonra N tur; eski/ön mandallama meta verisiz oturumlarda sınırlı, birleştirilmiş tek tur |
| Grup sohbetinde iki kişi yazıyor                                  | M göndericiden N satır               | M+ tur (gönderici paketi başına bir tane)        | M+ tur — grup sohbetleri birleştirilmez                                                            |

## Köprü veya gateway yeniden başlatıldıktan sonra gelen mesajları kurtarma

iMessage, gateway kapalıyken kaçırılan mesajları kurtarır ve aynı zamanda bir Push kurtarmasından sonra Apple'ın gönderebileceği eski "birikmiş iş bombası"nı bastırır. Varsayılan davranış her zaman açıktır ve gelen mesaj tekilleştirmesini temel alır.

- **Yeniden oynatma tekilleştirmesi.** Dağıtılan her gelen mesaj, Apple GUID'siyle kalıcı Plugin durumuna (`imessage.inbound-dedupe`) kaydedilir; alım sırasında sahiplenilir ve işlendikten sonra kesinleştirilir (geçici bir hatada yeniden denenebilmesi için serbest bırakılır). Daha önce işlenmiş olan her şey ikinci kez dağıtılmak yerine bırakılır. Bu, kurtarmanın mesaj başına kayıt tutmadan agresif biçimde yeniden oynatma yapabilmesini sağlar.
- **Kesinti kurtarması.** Başlangıçta izleyici, son dağıtılan `chat.db` rowid değerini (hesap başına kalıcı bir imleç) hatırlar ve bunu `imsg watch.subscribe` öğesine `since_rowid` olarak iletir; böylece imsg, gateway kapalıyken ulaşan satırları yeniden oynatır ve ardından canlı akışı izler. Yeniden oynatma, en son 500 satırla ve en fazla yaklaşık 2 saatlik mesajlarla sınırlıdır; tekilleştirme ise daha önce işlenmiş olanları bırakır.
- **Eski birikmiş işler için yaş sınırı.** Başlangıç sınırının üzerindeki satırlar gerçekten canlıdır; gönderim tarihi, varışından yaklaşık 15 dakikadan daha eski olan bir satır Push boşaltma birikmiş işidir ve bastırılır. Yeniden oynatılan satırlar (sınırda veya sınırın altında) bunun yerine daha geniş kurtarma penceresini kullanır; böylece yakın zamanda kaçırılan bir mesaj teslim edilirken çok eski geçmiş teslim edilmez.

Kurtarma hem yerel hem de uzak `cliPath` kurulumlarında çalışır; çünkü `since_rowid` yeniden oynatması aynı `imsg` RPC bağlantısı üzerinden yürütülür. Fark pencerededir: gateway, `chat.db` öğesini okuyabildiğinde (yerel) başlangıç rowid sınırını sabitler, yeniden oynatma aralığını sınırlar ve birkaç saate kadar eski kaçırılmış mesajları teslim eder. Uzak SSH `cliPath` üzerinden veritabanını okuyamaz; bu nedenle yeniden oynatma sınırsızdır ve her satır canlı yaş sınırını kullanır. Yine de yakın zamanda kaçırılan mesajları kurtarır ve eski birikmiş işleri bastırır, ancak daha dar canlı pencereyi kullanır. Daha geniş kurtarma penceresi için gateway'i Mesajlar'ın çalıştığı Mac üzerinde çalıştırın.

### Operatörün görebildiği sinyal

Bastırılan birikmiş işler varsayılan düzeyde günlüğe kaydedilir, asla sessizce bırakılmaz (`recovery` bayrağı hangi pencerenin uygulandığını gösterir):

```text
imessage: eski gelen birikmiş işler bastırıldı account=<id> sent=<iso> recovery=<bool> (başlangıçtan beri <N> bastırıldı)
```

### Geçiş

`channels.imessage.catchup.*` kullanımdan kaldırılmıştır — kesinti kurtarması otomatiktir ve yeni kurulumlarda yapılandırma gerektirmez. `catchup.enabled: true` içeren mevcut yapılandırmalar, kurtarma yeniden oynatma penceresi için uyumluluk profili olarak desteklenmeye devam eder. Devre dışı yakalama blokları (`enabled: false` veya `enabled: true` bulunmaması) kullanımdan kaldırılmıştır; `openclaw doctor --fix` bunları kaldırır.

## Sorun giderme

<AccordionGroup>
  <Accordion title="imsg bulunamadı veya RPC desteklenmiyor">
    İkili dosyayı ve RPC desteğini doğrulayın:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Yoklama RPC'nin desteklenmediğini bildirirse `imsg` öğesini güncelleyin. Özel API eylemleri kullanılamıyorsa oturum açılmış macOS kullanıcı oturumunda `imsg launch` komutunu çalıştırıp yeniden yoklayın. Gateway macOS üzerinde çalışmıyorsa varsayılan yerel `imsg` yolu yerine yukarıdaki SSH üzerinden Uzak Mac kurulumunu kullanın.

  </Accordion>

  <Accordion title="Mesajlar gönderiliyor ancak gelen iMessage'lar ulaşmıyor">
    Önce mesajın yerel Mac'e ulaşıp ulaşmadığını kanıtlayın. `chat.db` değişmiyorsa `imsg status --json` sağlıklı bir köprü bildirse bile OpenClaw mesajı alamaz.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Telefondan gönderilen mesajlar yeni satırlar oluşturmuyorsa OpenClaw yapılandırmasını değiştirmeden önce macOS Mesajlar ve Apple Push katmanını onarın. Tek seferlik hizmet yenilemesi çoğu zaman yeterlidir:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Telefondan yeni bir iMessage gönderin ve OpenClaw oturumlarında hata ayıklamadan önce yeni bir `chat.db` satırını veya `imsg watch` olayını doğrulayın. Bunu periyodik bir köprüyü yeniden başlatma döngüsü olarak çalıştırmayın; etkin çalışma sırasında tekrarlanan `imsg launch` işlemleriyle birlikte gateway'in yeniden başlatılması, teslimatları kesintiye uğratabilir ve devam eden kanal çalıştırmalarını yarıda bırakabilir.

  </Accordion>

  <Accordion title="Gateway macOS'te çalışmıyor">
    Varsayılan `cliPath: "imsg"`, Mesajlar'a giriş yapılmış Mac'te çalışmalıdır. Linux veya Windows'ta `channels.imessage.cliPath` değerini, söz konusu Mac'e SSH ile bağlanıp `imsg "$@"` komutunu çalıştıran bir sarmalayıcı betiğe ayarlayın.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Ardından şunu çalıştırın:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM'ler yok sayılıyor">
    Şunları kontrol edin:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - eşleştirme onayları (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Grup mesajları yok sayılıyor">
    Şunları kontrol edin:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` izin listesi davranışı
    - bahsetme kalıbı yapılandırması (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Uzak ekler başarısız oluyor">
    Şunları kontrol edin:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - gateway ana makinesinden SSH/SCP anahtarıyla kimlik doğrulama
    - gateway ana makinesindeki `~/.ssh/known_hosts` içinde ana makine anahtarının bulunması
    - Mesajlar'ı çalıştıran Mac'teki uzak yolun okunabilirliği

  </Accordion>

  <Accordion title="macOS izin istemleri gözden kaçırıldı">
    Aynı kullanıcı/oturum bağlamında etkileşimli bir GUI terminalinde yeniden çalıştırın ve istemleri onaylayın:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    OpenClaw/`imsg` çalıştıran işlem bağlamına Tam Disk Erişimi + Otomasyon izinlerinin verildiğini doğrulayın.

  </Accordion>
</AccordionGroup>

## Yapılandırma referansı bağlantıları

- [Yapılandırma referansı - iMessage](/tr/gateway/config-channels#imessage)
- [Gateway yapılandırması](/tr/gateway/configuration)
- [Eşleştirme](/tr/channels/pairing)

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [BlueBubbles'ın kaldırılması ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage) — duyuru ve geçiş özeti
- [BlueBubbles'tan geçiş](/tr/channels/imessage-from-bluebubbles) — yapılandırma dönüştürme tablosu ve adım adım geçiş
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
