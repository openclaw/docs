---
read_when:
    - iMessage desteğini ayarlama
    - iMessage gönderme/alma hata ayıklaması
summary: imsg üzerinden yerel iMessage desteği (stdio üzerinden JSON-RPC), yanıtlar, tapback'ler, efektler, anketler, ekler ve grup yönetimi için özel API eylemleriyle. Ana makine gereksinimleri uygun olduğunda yeni OpenClaw iMessage kurulumları için tercih edilir.
title: iMessage
x-i18n:
    generated_at: "2026-07-01T13:16:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
OpenClaw iMessage dağıtımları için, oturum açılmış bir macOS Messages ana makinesinde `imsg` kullanın. Gateway Linux veya Windows üzerinde çalışıyorsa, `channels.imessage.cliPath` değerini Mac üzerinde `imsg` çalıştıran bir SSH sarmalayıcısına yönlendirin.

**Gelen ileti kurtarma otomatiktir.** Bir köprü veya Gateway yeniden başlatıldıktan sonra iMessage, kapalı olduğu sırada kaçırılan iletileri yeniden oynatır ve Apple'ın bir Push kurtarmasından sonra boşaltabileceği eski "backlog bomb" yığınını bastırır; hiçbir şeyin iki kez gönderilmemesi için tekilleştirme yapar. Etkinleştirilecek bir yapılandırma yoktur — bkz. [Bir köprü veya Gateway yeniden başlatıldıktan sonra gelen ileti kurtarma](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
BlueBubbles desteği kaldırıldı. `channels.bluebubbles` yapılandırmalarını `channels.imessage` öğesine taşıyın; OpenClaw iMessage'ı yalnızca `imsg` üzerinden destekler. Kısa duyuru için [BlueBubbles kaldırma ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage) ile, tam geçiş tablosu için [BlueBubbles'dan gelenler](/tr/channels/imessage-from-bluebubbles) ile başlayın.
</Warning>

Durum: yerel harici CLI entegrasyonu. Gateway `imsg rpc` sürecini başlatır ve stdio üzerinde JSON-RPC ile iletişim kurar (ayrı daemon/port yoktur). Gelişmiş eylemler `imsg launch` ve başarılı bir özel API yoklaması gerektirir.

<CardGroup cols={3}>
  <Card title="Özel API eylemleri" icon="wand-sparkles" href="#private-api-actions">
    Yanıtlar, tapback'ler, efektler, anketler, ekler ve grup yönetimi.
  </Card>
  <Card title="Eşleme" icon="link" href="/tr/channels/pairing">
    iMessage DM'leri varsayılan olarak eşleme modunu kullanır.
  </Card>
  <Card title="SSH üzerinden uzak Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gateway Messages Mac üzerinde çalışmıyorsa bir SSH sarmalayıcısı kullanın.
  </Card>
  <Card title="Yapılandırma başvurusu" icon="settings" href="/tr/gateway/config-channels#imessage">
    Tam iMessage alan başvurusu.
  </Card>
</CardGroup>

## Hızlı kurulum

<Tabs>
  <Tab title="Yerel Mac (hızlı yol)">
    <Steps>
      <Step title="imsg yükleyin ve doğrulayın">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="OpenClaw yapılandırın">

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

      <Step title="Gateway başlatın">

```bash
openclaw gateway
```

      </Step>

      <Step title="İlk DM eşlemesini onaylayın (varsayılan dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Eşleme isteklerinin süresi 1 saat sonra dolar.
      </Step>
    </Steps>

  </Tab>

  <Tab title="SSH üzerinden uzak Mac">
    OpenClaw yalnızca stdio uyumlu bir `cliPath` gerektirir; bu nedenle `cliPath` değerini uzak bir Mac'e SSH yapan ve `imsg` çalıştıran bir sarmalayıcı betiğine yönlendirebilirsiniz.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Ekler etkinleştirildiğinde önerilen yapılandırma:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost` ayarlanmazsa OpenClaw, SSH sarmalayıcı betiğini ayrıştırarak bunu otomatik algılamaya çalışır.
    `remoteHost`, `host` veya `user@host` olmalıdır (boşluk veya SSH seçeneği yok).
    OpenClaw, SCP için katı ana makine anahtarı denetimi kullanır; bu nedenle aktarma ana makinesi anahtarı `~/.ssh/known_hosts` içinde zaten bulunmalıdır.
    Ek yolları izin verilen köklere göre doğrulanır (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
`imsg` önüne koyduğunuz herhangi bir `cliPath` sarmalayıcısı veya SSH proxy'si, uzun ömürlü JSON-RPC için şeffaf bir stdio borusu gibi davranmak ZORUNDADIR. OpenClaw, kanalın ömrü boyunca sarmalayıcının stdin/stdout akışları üzerinden küçük, yeni satırla çerçevelenmiş JSON-RPC iletileri değiş tokuş eder:

- Her stdin parçasını/satırını **baytlar kullanılabilir olur olmaz** iletin — EOF beklemeyin.
- Her stdout parçasını/satırını ters yönde hızla iletin.
- Yeni satırları koruyun.
- Küçük çerçeveleri aç bırakabilecek sabit boyutlu engelleyici okumalardan (`read(4096)`, `cat | buffer`, varsayılan shell `read`) kaçının.
- stderr akışını JSON-RPC stdout akışından ayrı tutun.

Büyük bir blok dolana kadar stdin'i arabelleğe alan bir sarmalayıcı, `imsg rpc` kendisi sağlıklı olsa bile iMessage kesintisi gibi görünen belirtiler üretir: `imsg rpc timeout (chats.list)` veya yinelenen kanal yeniden başlatmaları. `ssh -T host imsg "$@"` (yukarıda) güvenlidir çünkü OpenClaw'ın `rpc` ve `--db` gibi `cliPath` bağımsız değişkenlerini iletir. `ssh host imsg | grep -v '^DEBUG'` gibi ardışık düzenler güvenli DEĞİLDİR — satır arabellekli araçlar çerçeveleri yine de tutabilir; filtreleme yapmanız gerekiyorsa her aşamada `stdbuf -oL -eL` kullanın.
</Warning>

  </Tab>
</Tabs>

## Gereksinimler ve izinler (macOS)

- `imsg` çalıştıran Mac üzerinde Messages oturumu açılmış olmalıdır.
- OpenClaw/`imsg` çalıştıran süreç bağlamı için Tam Disk Erişimi gereklidir (Messages DB erişimi).
- Messages.app üzerinden ileti göndermek için Otomasyon izni gereklidir.
- Gelişmiş eylemler için (tepki / düzenleme / göndermeyi geri alma / konu içinde yanıt / efektler / anketler / grup işlemleri), Sistem Bütünlüğü Koruması devre dışı bırakılmalıdır — aşağıdaki [imsg özel API'sini etkinleştirme](#enabling-the-imsg-private-api) bölümüne bakın. Temel metin ve medya gönderme/alma bunun olmadan çalışır.

<Tip>
İzinler süreç bağlamı başına verilir. Gateway başsız çalışıyorsa (LaunchAgent/SSH), istemleri tetiklemek için aynı bağlamda bir kez etkileşimli komut çalıştırın:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH sarmalayıcı gönderimleri AppleEvents -1743 ile başarısız oluyor">
  Uzak SSH kurulumu sohbetleri okuyabilir, `channels status --probe` denetiminden geçebilir ve gelen iletileri işleyebilir; ancak giden gönderimler yine de bir AppleEvents yetkilendirme hatasıyla başarısız olabilir:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Oturum açmış Mac kullanıcısının TCC veritabanını veya Sistem Ayarları > Gizlilik ve Güvenlik > Otomasyon bölümünü denetleyin. Otomasyon girdisi `imsg` veya yerel shell süreci yerine `/usr/libexec/sshd-keygen-wrapper` için kaydedilmişse macOS, bu SSH sunucu tarafı istemcisi için kullanılabilir bir Messages anahtarı göstermeyebilir:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

Bu durumda, `tccutil reset AppleEvents` komutunu tekrarlamak veya aynı SSH sarmalayıcısı üzerinden `imsg send` komutunu yeniden çalıştırmak başarısız olmaya devam edebilir; çünkü Messages Otomasyonu'na ihtiyaç duyan süreç bağlamı, kullanıcı arayüzünün izin verebileceği bir uygulama değil SSH sarmalayıcısıdır.

Bunun yerine desteklenen `imsg` süreç bağlamlarından birini kullanın:

- Gateway'i veya en azından `imsg` köprüsünü, oturum açmış Messages kullanıcısının yerel oturumunda çalıştırın.
- Aynı oturumdan Tam Disk Erişimi ve Otomasyon izni verdikten sonra Gateway'i bu kullanıcı için bir LaunchAgent ile başlatın.
- İki kullanıcılı SSH topolojisini koruyorsanız kanalı etkinleştirmeden önce, gerçek bir giden `imsg send` komutunun tam olarak aynı sarmalayıcı üzerinden başarılı olduğunu doğrulayın. Otomasyon izni verilemiyorsa gönderimler için SSH sarmalayıcısına güvenmek yerine tek kullanıcılı bir `imsg` kurulumuna yeniden yapılandırın.

</Accordion>

## imsg özel API'sini etkinleştirme

`imsg` iki çalışma moduyla gelir:

- **Temel mod** (varsayılan, SIP değişikliği gerekmez): `send` üzerinden giden metin ve medya, gelen izleme/geçmiş, sohbet listesi. Yeni bir `brew install steipete/tap/imsg` kurulumundan ve yukarıdaki standart macOS izinlerinden sonra kutudan çıktığı gibi elde ettiğiniz budur.
- **Özel API modu**: `imsg`, dahili `IMCore` işlevlerini çağırmak için `Messages.app` içine bir yardımcı dylib enjekte eder. Bu, `react`, `edit`, `unsend`, `reply` (konu içinde), `sendWithEffect`, `poll` ve `poll-vote` (yerel Messages anketleri), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` ile yazıyor göstergelerini ve okundu bilgilerini açar.

Bu kanal sayfasının belgelediği gelişmiş eylem yüzeyine ulaşmak için Özel API modu gerekir. `imsg` README gereksinim konusunda açıktır:

> `read`, `typing`, `launch`, köprü destekli zengin gönderim, ileti mutasyonu ve sohbet yönetimi gibi gelişmiş özellikler isteğe bağlıdır. SIP'in devre dışı bırakılmasını ve `Messages.app` içine bir yardımcı dylib enjekte edilmesini gerektirir. SIP etkin olduğunda `imsg launch` enjeksiyonu reddeder.

Yardımcı enjeksiyon tekniği, Messages özel API'lerine erişmek için `imsg`'nin kendi dylib'ini kullanır. OpenClaw iMessage yolunda üçüncü taraf sunucu veya BlueBubbles çalışma zamanı yoktur.

<Warning>
**SIP'i devre dışı bırakmak gerçek bir güvenlik ödünleşimidir.** SIP, macOS'un değiştirilmiş sistem kodu çalıştırılmasına karşı temel korumalarından biridir; sistem genelinde kapatmak ek saldırı yüzeyi ve yan etkiler açar. Özellikle, **Apple Silicon Mac'lerde SIP'i devre dışı bırakmak Mac'inize iOS uygulamaları yükleme ve çalıştırma yeteneğini de devre dışı bırakır**.

Bunu varsayılan değil, bilinçli bir operasyonel tercih olarak ele alın. Tehdit modeliniz SIP'in kapalı olmasını tolere edemiyorsa, paketli iMessage temel modla sınırlıdır — yalnızca metin ve medya gönderme/alma, tepki / düzenleme / göndermeyi geri alma / efekt / grup işlemi yok.
</Warning>

### Kurulum

1. Messages.app çalıştıran Mac üzerinde **`imsg` yükleyin (veya yükseltin)**:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` çıktısı `bridge_version`, `rpc_methods` ve yöntem başına `selectors` bildirir; böylece başlamadan önce geçerli derlemenin neyi desteklediğini görebilirsiniz.

2. **Sistem Bütünlüğü Koruması'nı ve (modern macOS'ta) Kitaplık Doğrulamasını devre dışı bırakın.** Apple imzalı `Messages.app` içine Apple olmayan bir yardımcı dylib enjekte etmek için SIP'in kapalı olması **ve** kitaplık doğrulamasının gevşetilmesi gerekir. Recovery-mode SIP adımı macOS sürümüne özeldir:
   - **macOS 10.13-10.15 (Sierra-Catalina):** Kitaplık Doğrulamasını Terminal üzerinden devre dışı bırakın, Recovery Mode'a yeniden başlatın, `csrutil disable` çalıştırın, yeniden başlatın.
   - **macOS 11+ (Big Sur ve sonrası), Intel:** Recovery Mode (veya Internet Recovery), `csrutil disable`, yeniden başlatın.
   - **macOS 11+, Apple Silicon:** Recovery'ye girmek için güç düğmesi başlangıç dizisini kullanın; son macOS sürümlerinde Continue'a tıklarken **Left Shift** tuşunu basılı tutun, ardından `csrutil disable` çalıştırın. Sanal makine kurulumları ayrı bir akış izler; bu nedenle önce bir VM anlık görüntüsü alın.

   **macOS 11 ve sonrasında, yalnızca `csrutil disable` genellikle yeterli değildir.** Apple, `Messages.app` bir platform ikilisi olduğundan kitaplık doğrulamasını hâlâ uygular; bu nedenle adhoc imzalı bir yardımcı, SIP kapalı olsa bile reddedilir (`Library Validation failed: ... platform binary, but mapped file is not`). SIP'i devre dışı bıraktıktan sonra kitaplık doğrulamasını da devre dışı bırakın ve yeniden başlatın:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), 26.5.1 üzerinde doğrulandı:** SIP kapalı **artı** yukarıdaki `DisableLibraryValidation` komutu, yardımcının 26.0'dan 26.5.x'e kadar enjekte edilmesi için yeterlidir. **boot-args gerekmez.** plist belirleyici etkendir ve Tahoe'da enjeksiyon başarısız olduğunda en sık eksik olan adımdır:
   - **plist ile:** `imsg launch` enjekte eder ve `imsg status`, `advanced_features: true` bildirir.
   - **plist olmadan (SIP kapalı olsa bile):** `imsg launch`, `Failed to launch: Timeout waiting for Messages.app to initialize` ile başarısız olur. AMFI, adhoc yardımcıyı yükleme sırasında reddeder; bu nedenle köprü hiçbir zaman hazır olmaz ve başlatma zaman aşımına uğrar. Tahoe'da çoğu kişinin karşılaştığı belirti bu zaman aşımıdır ve düzeltme yukarıdaki plist'tir, daha sert bir şey değil.

   Bu, macOS 26.5.1 (Apple Silicon) üzerinde kontrollü bir önce/sonra ile doğrulandı: plist varken dylib `Messages.app` içine eşlenir ve köprü çalışır; plist'i kaldırıp yeniden başlatınca `imsg launch`, dylib eşlenmeden yukarıdaki zaman aşımı hatasını üretir.

   If `imsg launch` enjeksiyonu veya belirli `selectors` değerleri bir macOS yükseltmesinden sonra false döndürmeye başlarsa, olağan neden bu geçittir. SIP ve library-validation durumunuzu, SIP adımının kendisinin başarısız olduğunu varsaymadan önce kontrol edin. Bu ayarlar doğruysa ve köprü hâlâ enjekte edemiyorsa, `imsg status --json` ile `imsg launch` çıktısını toplayın ve ek sistem genelindeki güvenlik denetimlerini zayıflatmak yerine bunu `imsg` projesine bildirin.

   `imsg launch` çalıştırmadan önce SIP'yi devre dışı bırakmak için Apple'ın Mac'inize yönelik Recovery-mode akışını izleyin.

3. **Yardımcıyı enjekte edin.** SIP devre dışıyken ve Messages.app oturum açmış durumdayken:

   ```bash
   imsg launch
   ```

   `imsg launch`, SIP hâlâ etkin olduğunda enjeksiyonu reddeder; bu nedenle bu, 2. adımın uygulandığına dair bir doğrulama işlevi de görür.

4. **Köprüyü OpenClaw'dan doğrulayın:**

   ```bash
   openclaw channels status --probe
   ```

   iMessage girdisi `works` bildirmeli ve `imsg status --json | jq '{rpc_methods, selectors}'` macOS derlemenizin sunduğu yetenekleri göstermelidir. Anket oluşturma `selectors.pollPayloadMessage` gerektirir; oy verme hem `selectors.pollVoteMessage` hem de `poll.vote` RPC yöntemini gerektirir. OpenClaw Plugin yalnızca önbelleğe alınmış yoklamanın desteklediği eylemleri duyurur; boş bir önbellek ise iyimser kalır ve ilk gönderimde yoklama yapar.

`openclaw channels status --probe` kanalı `works` olarak bildiriyor ancak belirli eylemler gönderim sırasında "iMessage `<action>` requires the imsg private API bridge" hatası veriyorsa, `imsg launch` komutunu yeniden çalıştırın — yardımcı devreden çıkabilir (Messages.app yeniden başlatması, işletim sistemi güncellemesi vb.) ve önbelleğe alınmış `available: true` durumu, bir sonraki yoklama yenilenene kadar eylemleri duyurmaya devam eder.

### SIP'yi devre dışı bırakamadığınızda

SIP'nin devre dışı olması tehdit modeliniz için kabul edilebilir değilse:

- `imsg` temel moda geri döner — yalnızca metin + medya + alma.
- OpenClaw Plugin, metin/medya gönderimini ve gelen izlemeyi duyurmaya devam eder; yalnızca `react`, `edit`, `unsend`, `reply`, `sendWithEffect` ve grup işlemlerini eylem yüzeyinden gizler (yöntem başına yetenek geçidine göre).
- Birincil cihazlarınızda SIP'yi etkin tutarken, iMessage iş yükü için SIP kapalı ayrı bir Apple Silicon olmayan Mac (veya ayrılmış bir bot Mac) çalıştırabilirsiniz. Aşağıdaki [Dedicated bot macOS user (separate iMessage identity)](#deployment-patterns) bölümüne bakın.

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` doğrudan mesajları denetler:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    İzin listesi alanı: `channels.imessage.allowFrom`.

    İzin listesi girdileri gönderenleri tanımlamalıdır: tanıtıcılar veya statik gönderen erişim grupları (`accessGroup:<name>`). `chat_id:*`, `chat_guid:*` veya `chat_identifier:*` gibi sohbet hedefleri için `channels.imessage.groupAllowFrom` kullanın; sayısal `chat_id` kayıt anahtarları için `channels.imessage.groups` kullanın.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` grup işlemeyi denetler:

    - `allowlist` (yapılandırıldığında varsayılan)
    - `open`
    - `disabled`

    Grup gönderen izin listesi: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom` girdileri statik gönderen erişim gruplarına da başvurabilir (`accessGroup:<name>`).

    Çalışma zamanı geri dönüşü: `groupAllowFrom` ayarlanmamışsa, iMessage grup gönderen denetimleri `allowFrom` kullanır; DM ve grup kabulü farklı olmalıysa `groupAllowFrom` ayarlayın.
    Çalışma zamanı notu: `channels.imessage` tamamen eksikse, çalışma zamanı `groupPolicy="allowlist"` değerine geri döner ve bir uyarı günlüğe kaydeder (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

    <Warning>
    Grup yönlendirmesinde arka arkaya çalışan **iki** izin listesi geçidi vardır ve ikisi de geçmelidir:

    1. **Gönderen / sohbet hedefi izin listesi** (`channels.imessage.groupAllowFrom`) — tanıtıcı, `chat_guid`, `chat_identifier` veya `chat_id`.
    2. **Grup kaydı** (`channels.imessage.groups`) — `groupPolicy: "allowlist"` ile bu geçit ya `groups: { "*": { ... } }` joker girdisini (`allowAll = true` ayarlar) ya da `groups` altında açık bir `chat_id` girdisini gerektirir.

    2. geçitte hiçbir şey yoksa, her grup mesajı bırakılır. Plugin varsayılan günlük düzeyinde iki `warn` düzeyi sinyal yayar:

    - başlangıçta hesap başına bir kez: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - çalışma zamanında `chat_id` başına bir kez: `imessage: dropping group message from chat_id=<id> ...`

    DM'ler farklı bir kod yolunu kullandıkları için çalışmaya devam eder.

    `groupPolicy: "allowlist"` altında grupların akmaya devam etmesi için minimum yapılandırma:

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

    Bu `warn` satırları gateway günlüğünde görünüyorsa, 2. geçit bırakıyor demektir — `groups` bloğunu ekleyin.
    </Warning>

    Gruplar için bahsetme geçidi:

    - iMessage yerel bahsetme meta verisine sahip değildir
    - bahsetme algılama regex kalıplarını kullanır (`agents.list[].groupChat.mentionPatterns`, geri dönüş `messages.groupChat.mentionPatterns`)
    - yapılandırılmış kalıp yoksa, bahsetme geçidi zorlanamaz

    Yetkili gönderenlerden gelen denetim komutları gruplarda bahsetme geçidini atlayabilir.

    Grup başına `systemPrompt`:

    `channels.imessage.groups.*` altındaki her girdi isteğe bağlı bir `systemPrompt` dizesi kabul eder. Değer, o gruptaki bir mesajı işleyen her turda aracının sistem prompt'una enjekte edilir. Çözümleme, `channels.whatsapp.groups` tarafından kullanılan grup başına prompt çözümlemesini yansıtır:

    1. **Gruba özgü sistem prompt'u** (`groups["<chat_id>"].systemPrompt`): belirli grup girdisi haritada mevcut olduğunda **ve** `systemPrompt` anahtarı tanımlandığında kullanılır. `systemPrompt` boş bir dizeyse (`""`) joker bastırılır ve o gruba sistem prompt'u uygulanmaz.
    2. **Grup joker sistem prompt'u** (`groups["*"].systemPrompt`): belirli grup girdisi haritada tamamen yoksa veya mevcut olup `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Grup başına prompt'lar yalnızca grup mesajlarına uygulanır — bu kanaldaki doğrudan mesajlar etkilenmez.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DM'ler doğrudan yönlendirme kullanır; gruplar grup yönlendirmesi kullanır.
    - Varsayılan `session.dmScope=main` ile iMessage DM'leri aracının ana oturumunda birleşir.
    - Grup oturumları izoledir (`agent:<agentId>:imessage:group:<chat_id>`).
    - Yanıtlar, kaynak kanal/hedef meta verileri kullanılarak iMessage'a geri yönlendirilir.

    Grup benzeri ileti dizisi davranışı:

    Bazı çok katılımcılı iMessage ileti dizileri `is_group=false` ile gelebilir.
    Bu `chat_id`, `channels.imessage.groups` altında açıkça yapılandırılmışsa, OpenClaw bunu grup trafiği olarak ele alır (grup geçidi + grup oturumu izolasyonu).

  </Tab>
</Tabs>

## ACP konuşma bağlamaları

Eski iMessage sohbetleri ACP oturumlarına da bağlanabilir.

Hızlı operatör akışı:

- DM veya izin verilen grup sohbeti içinde `/acp spawn codex --bind here` çalıştırın.
- Aynı iMessage konuşmasındaki gelecekteki mesajlar, oluşturulan ACP oturumuna yönlendirilir.
- `/new` ve `/reset` aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close` ACP oturumunu kapatır ve bağlamayı kaldırır.

Yapılandırılmış kalıcı bağlamalar, `type: "acp"` ve `match.channel: "imessage"` içeren üst düzey `bindings[]` girdileri aracılığıyla desteklenir.

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

Paylaşılan ACP bağlama davranışı için [ACP Agents](/tr/tools/acp-agents) bölümüne bakın.

## Dağıtım kalıpları

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Bot trafiğinin kişisel Messages profilinizden izole edilmesi için ayrılmış bir Apple ID ve macOS kullanıcısı kullanın.

    Tipik akış:

    1. Ayrılmış bir macOS kullanıcısı oluşturun/oturum açın.
    2. Bu kullanıcıda bot Apple ID'siyle Messages oturumu açın.
    3. Bu kullanıcıda `imsg` kurun.
    4. OpenClaw'ın `imsg` komutunu bu kullanıcı bağlamında çalıştırabilmesi için SSH sarmalayıcısı oluşturun.
    5. `channels.imessage.accounts.<id>.cliPath` ve `.dbPath` değerlerini bu kullanıcı profiline yönlendirin.

    İlk çalıştırma, bu bot kullanıcı oturumunda GUI onayları (Automation + Full Disk Access) gerektirebilir.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Yaygın topoloji:

    - gateway Linux/VM üzerinde çalışır
    - iMessage + `imsg`, tailnet'inizdeki bir Mac üzerinde çalışır
    - `cliPath` sarmalayıcısı `imsg` çalıştırmak için SSH kullanır
    - `remoteHost`, SCP ek getirmelerini etkinleştirir

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

    Hem SSH hem de SCP'nin etkileşimsiz olması için SSH anahtarları kullanın.
    Önce ana makine anahtarının güvenilir olduğundan emin olun (örneğin `ssh bot@mac-mini.tailnet-1234.ts.net`) ki `known_hosts` doldurulsun.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage, `channels.imessage.accounts` altında hesap başına yapılandırmayı destekler.

    Her hesap `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, geçmiş ayarları ve ek kökü izin listeleri gibi alanları geçersiz kılabilir.

  </Accordion>

  <Accordion title="Direct-message history">
    Yeni doğrudan mesaj oturumlarını o konuşmaya ait yakın zamanda çözümlenmiş `imsg` geçmişiyle başlatmak için `channels.imessage.dmHistoryLimit` ayarlayın. Gönderen başına geçersiz kılmalar için `channels.imessage.dms["<sender>"].historyLimit` kullanın; bir gönderen için geçmişi devre dışı bırakmak üzere `0` dahil.

    iMessage DM geçmişi, gerektikçe `imsg` üzerinden getirilir. `dmHistoryLimit` değerini ayarlamamak genel DM geçmişi başlatmayı devre dışı bırakır, ancak pozitif bir gönderen başına `channels.imessage.dms["<sender>"].historyLimit` değeri yine de o gönderen için başlatmayı etkinleştirir.

  </Accordion>
</AccordionGroup>

## Medya, parçalama ve teslim hedefleri

<AccordionGroup>
  <Accordion title="Ekler ve medya">
    - gelen ek alımı **varsayılan olarak kapalıdır** — fotoğrafları, sesli notları, videoları ve diğer ekleri ajana iletmek için `channels.imessage.includeAttachments: true` ayarlayın. Devre dışıyken, yalnızca ek içeren iMessage'lar ajana ulaşmadan bırakılır ve hiç `Inbound message` günlük satırı üretmeyebilir.
    - `remoteHost` ayarlandığında uzak ek yolları SCP ile alınabilir
    - ek yolları izin verilen köklerle eşleşmelidir:
      - `channels.imessage.attachmentRoots` (yerel)
      - `channels.imessage.remoteAttachmentRoots` (uzak SCP modu)
      - varsayılan kök deseni: `/Users/*/Library/Messages/Attachments`
    - SCP katı ana makine anahtarı denetimi kullanır (`StrictHostKeyChecking=yes`)
    - giden medya boyutu `channels.imessage.mediaMaxMb` kullanır (varsayılan 16 MB)

  </Accordion>

  <Accordion title="Giden parçalama">
    - metin parçası sınırı: `channels.imessage.textChunkLimit` (varsayılan 4000)
    - parça modu: `channels.imessage.chunkMode`
      - `length` (varsayılan)
      - `newline` (önce paragraf bölme)

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

`imsg launch` çalışırken ve `openclaw channels status --probe` çıktısı `privateApi.available: true` bildirirken, ileti aracı normal metin göndermelerine ek olarak iMessage'a özgü eylemleri kullanabilir.

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
    - **react**: iMessage tapback'leri ekleyin/kaldırın (`messageId`, `emoji`, `remove`). Desteklenen tapback'ler sevgi, beğenme, beğenmeme, gülme, vurgulama ve soru ile eşleşir.
    - **reply**: Mevcut bir iletiye iş parçacıklı yanıt gönderin (`messageId`, `text` veya `message`, artı `chatGuid`, `chatId`, `chatIdentifier` veya `to`).
    - **sendWithEffect**: Bir iMessage efektiyle metin gönderin (`text` veya `message`, `effect` veya `effectId`).
    - **edit**: Desteklenen macOS/özel API sürümlerinde gönderilmiş bir iletiyi düzenleyin (`messageId`, `text` veya `newText`).
    - **unsend**: Desteklenen macOS/özel API sürümlerinde gönderilmiş bir iletiyi geri çekin (`messageId`).
    - **upload-file**: Medya/dosya gönderin (`buffer` base64 olarak veya hydrate edilmiş `media`/`path`/`filePath`, `filename`, isteğe bağlı `asVoice`). Eski takma ad: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Geçerli hedef bir grup sohbetiyse grup sohbetlerini yönetin.
    - **poll**: Yerel bir Apple Messages anketi oluşturun (`pollQuestion`, 2 ila 12 kez yinelenen `pollOption`, artı `chatGuid`, `chatId`, `chatIdentifier` veya `to`). iOS/iPadOS/macOS 26+ üzerindeki alıcılar bunu yerel olarak görür ve oylar; daha eski OS sürümleri `"Sent a poll"` metin yedeği alır. `selectors.pollPayloadMessage` gerektirir.
    - **poll-vote**: Mevcut bir ankette oy verin (`pollId` veya `messageId`, artı `pollOptionIndex`, `pollOptionId` veya `pollOptionText` öğelerinden tam olarak biri). `selectors.pollVoteMessage` ve `poll.vote` RPC yöntemini gerektirir.

    Kabul edilen gelen anketler, soru, numaralı seçenek etiketleri, oy sayıları ve `poll-vote` için gereken anket ileti kimliğiyle ajan için işlenir.

  </Accordion>

  <Accordion title="İleti kimlikleri">
    Gelen iMessage bağlamı, kullanılabilir olduğunda hem kısa `MessageSid` değerlerini hem de tam ileti GUID'lerini içerir. Kısa kimlikler son SQLite destekli yanıt önbelleği kapsamındadır ve kullanılmadan önce geçerli sohbetle denetlenir. Kısa kimliğin süresi dolmuşsa veya başka bir sohbete aitse, tam `MessageSidFull` ile yeniden deneyin.

  </Accordion>

  <Accordion title="Yetenek algılama">
    OpenClaw özel API eylemlerini yalnızca önbelleğe alınmış yoklama durumu köprünün kullanılamadığını söylediğinde gizler. Durum bilinmiyorsa, eylemler görünür kalır ve gönderim yoklamaları tembel biçimde yapar; böylece ilk eylem `imsg launch` sonrasında ayrı bir elle durum yenilemesi olmadan başarılı olabilir.

  </Accordion>

  <Accordion title="Okundu bilgileri ve yazıyor göstergesi">
    Özel API köprüsü çalışıyorsa, kabul edilen gelen sohbetler okundu olarak işaretlenir ve doğrudan sohbetler, ajan bağlamı hazırlayıp üretirken tur kabul edilir edilmez yazıyor balonu gösterir. Okundu işaretlemeyi şu şekilde devre dışı bırakın:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Yöntem başına yetenek listesinden önceki eski `imsg` derlemeleri, yazıyor/okundu bilgisini sessizce kapatır; OpenClaw, eksik okundu bilgisinin nedeni anlaşılabilsin diye her yeniden başlatmada bir kez uyarı günlüğe yazar.

  </Accordion>

  <Accordion title="Gelen tapback'ler">
    OpenClaw iMessage tapback'lerine abone olur ve kabul edilen tepkileri normal ileti metni yerine sistem olayları olarak yönlendirir; böylece bir kullanıcı tapback'i olağan bir yanıt döngüsünü tetiklemez.

    Bildirim modu `channels.imessage.reactionNotifications` ile denetlenir:

    - `"own"` (varsayılan): yalnızca kullanıcılar bot tarafından yazılmış iletilere tepki verdiğinde bildir.
    - `"all"`: yetkili gönderenlerden gelen tüm tapback'ler için bildir.
    - `"off"`: gelen tapback'leri yok say.

    Hesap başına geçersiz kılmalar `channels.imessage.accounts.<id>.reactionNotifications` kullanır.

  </Accordion>

  <Accordion title="Onay tepkileri (👍 / 👎)">
    `approvals.exec.enabled` veya `approvals.plugin.enabled` true olduğunda ve istek iMessage'a yönlendirildiğinde, Gateway onay istemini yerel olarak iletir ve bunu çözmek için bir tapback kabul eder:

    - `👍` (Beğen tapback'i) → `allow-once`
    - `👎` (Beğenme tapback'i) → `deny`
    - `allow-always` elle kullanılan bir yedek olarak kalır: normal yanıt olarak `/approve <id> allow-always` gönderin.

    Tepki işleme, tepki veren kullanıcının tanıtıcısının açık bir onaylayıcı olmasını gerektirir. Onaylayıcı listesi `channels.imessage.allowFrom` içinden (veya `channels.imessage.accounts.<id>.allowFrom` içinden) okunur; kullanıcının telefon numarasını E.164 biçiminde veya Apple ID e-postasını ekleyin. Joker giriş `"*"` dikkate alınır ancak herhangi bir gönderenin onaylamasına izin verir. Tepki kısayolu, `reactionNotifications`, `dmPolicy` ve `groupAllowFrom` değerlerini kasıtlı olarak atlar; çünkü onay çözümlemesi için önemli olan tek kapı açık onaylayıcı izin listesidir.

    **Bu sürümle gelen davranış değişikliği:** `channels.imessage.allowFrom` boş değilse, `/approve <id> <decision>` metin komutu artık daha geniş DM izin listesine göre değil, bu onaylayıcı listesine göre yetkilendirilir. DM izin listesinde izin verilen ancak `allowFrom` içinde olmayan gönderenler açık bir ret alır. Önceki davranışı korumak için `/approve` ile (ve tepkilerle) onay verebilmesi gereken her operatörü `allowFrom` içine ekleyin. `allowFrom` boş olduğunda eski "aynı sohbet yedeği" yürürlükte kalır ve `/approve`, DM izin listesinin izin verdiği herkesi yetkilendirmeye devam eder.

    Operatör notları:
    - Tepki bağlaması hem bellekte (onay süresiyle eşleşen TTL ile) hem de Gateway'in kalıcı anahtarlı deposunda saklanır; böylece Gateway yeniden başlatıldıktan kısa süre sonra gelen bir tapback yine de onayı çözer.
    - Cihazlar arası `is_from_me=true` tapback'leri (operatörün eşleştirilmiş bir Apple cihazındaki kendi tepkisi), botun kendi kendini onaylayamaması için kasıtlı olarak yok sayılır.
    - Eski metin tarzı tapback'ler (çok eski Apple istemcilerinden gelen `Liked "…"` düz metni), ileti GUID'i taşımadıkları için onayları çözemez; tepki çözümlemesi, güncel macOS / iOS istemcilerinin yaydığı yapılandırılmış tapback meta verilerini gerektirir.

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

## Bölünmüş gönderimli DM'leri birleştirme (tek kompozisyonda komut + URL)

Bir kullanıcı bir komut ve URL'yi birlikte yazdığında — ör. `Dump https://example.com/article` — Apple'ın Messages uygulaması gönderimi **iki ayrı `chat.db` satırına** böler:

1. Bir metin iletisi (`"Dump"`).
2. OG önizleme görsellerinin ek olarak bulunduğu bir URL önizleme balonu (`"https://..."`).

İki satır çoğu kurulumda OpenClaw'a yaklaşık 0.8-2.0 sn arayla ulaşır. Birleştirme olmadan, ajan 1. turda yalnızca komutu alır, yanıt verir (çoğu zaman "URL'yi bana gönder" der) ve URL'yi ancak 2. turda görür — o noktada komut bağlamı zaten kaybolmuştur. Bu, Apple'ın gönderim işlem hattıdır; OpenClaw veya `imsg` tarafından eklenen bir şey değildir.

`channels.imessage.coalesceSameSenderDms`, bir DM'yi aynı gönderenden gelen ardışık satırları arabelleğe almaya dahil eder. `imsg`, kaynak satırlardan birinde yapısal URL önizleme işaretçisi `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` değerini sunduğunda, OpenClaw yalnızca bu gerçek bölünmüş gönderimi birleştirir ve arabelleğe alınmış diğer satırları ayrı turlar olarak tutar. Hiç balon meta verisi yaymayan daha eski `imsg` derlemelerinde OpenClaw, bölünmüş gönderimi ayrı gönderimlerden ayırt edemez; bu yüzden kovayı birleştirmeye geri döner. Bu, `Dump <url>` bölünmüş gönderimlerini iki tura geriletmek yerine meta veri öncesi davranışı korur. Grup sohbetleri, çok kullanıcılı tur yapısının korunması için ileti başına gönderilmeye devam eder.

<Tabs>
  <Tab title="Ne zaman etkinleştirilmeli">
    Şu durumlarda etkinleştirin:

    - Tek iletide `command + payload` bekleyen Skills gönderiyorsanız (dump, paste, save, queue vb.).
    - Kullanıcılarınız komutların yanına URL yapıştırıyorsa.
    - Eklenen DM tur gecikmesini kabul edebiliyorsanız (aşağıya bakın).

    Şu durumlarda devre dışı bırakılmış bırakın:

    - Tek kelimelik DM tetikleyicileri için en düşük komut gecikmesine ihtiyacınız varsa.
    - Tüm akışlarınız yük devamı olmayan tek seferlik komutlarsa.

  </Tab>
  <Tab title="Etkinleştirme">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // dahil ol (varsayılan: false)
        },
      },
    }
    ```

    Bayrak açıkken ve açık bir `messages.inbound.byChannel.imessage` veya genel `messages.inbound.debounceMs` yokken, geri sekme önleme penceresi **7000 ms** değerine genişler (eski varsayılan 0 ms'dir — geri sekme önleme yoktur). Daha geniş pencere gereklidir, çünkü Apple'ın URL önizlemeli bölünmüş gönderim temposu, Messages.app önizleme satırını yayarken birkaç saniyeye uzayabilir.

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
  <Tab title="Ödünler">
    - **Kesin birleştirme güncel `imsg` yük metaverisi gerektirir.** URL satırı `balloon_bundle_id` içerdiğinde yalnızca o gerçek bölünmüş gönderim birleştirilir ve diğer tamponlanan satırlar ayrı kalır. Balon metaverisi göstermeyen eski `imsg` derlemelerinde OpenClaw tamponlanan kovayı birleştirmeye geri döner; böylece `Dump <url>` bölünmüş gönderimleri iki tura gerilemez (geçici geriye dönük uyumluluk, `imsg` bölünmüş gönderimleri yukarı akışta birleştirdiğinde kaldırılır).
    - **DM iletileri için ek gecikme.** Bayrak açıkken her DM (bağımsız denetim komutları ve tek metinli takipler dahil), bir URL önizleme satırı gelme olasılığına karşı gönderilmeden önce en fazla debounce penceresi kadar bekler. Grup sohbeti iletileri anında gönderilmeye devam eder.
    - **Birleştirilmiş çıktı sınırlıdır.** Birleştirilmiş metin, açık bir `…[truncated]` işaretçisiyle 4000 karakterde sınırlandırılır; ekler 20 ile sınırlıdır; kaynak girdileri 10 ile sınırlıdır (bunun ötesinde ilk ve en son korunur). Her kaynak GUID'i aşağı akış telemetrisi için `coalescedMessageGuids` içinde izlenir.
    - **Yalnızca DM.** Grup sohbetleri ileti başına gönderime düşer; böylece birden çok kişi yazarken bot duyarlı kalır.
    - **İsteğe bağlı, kanal başına.** Diğer kanallar (Telegram, WhatsApp, Slack, …) etkilenmez. `channels.bluebubbles.coalesceSameSenderDms` ayarlayan eski BlueBubbles yapılandırmaları bu değeri `channels.imessage.coalesceSameSenderDms` konumuna taşımalıdır.

  </Tab>
</Tabs>

### Senaryolar ve aracının gördükleri

"Bayrak açık" sütunu, `balloon_bundle_id` yayan bir `imsg` derlemesindeki davranışı gösterir. Hiç balon metaverisi yaymayan eski `imsg` derlemelerinde, aşağıda "İki tur" / "N tur" olarak işaretlenen satırlar bunun yerine eski bir birleştirmeye (tek tur) geri döner: OpenClaw, bölünmüş gönderimi ayrı gönderimlerden yapısal olarak ayırt edemez, bu yüzden metaveri öncesi birleştirmeyi korur. Kesin ayırma, derleme balon metaverisi yaymaya başladığında etkinleşir.

| Kullanıcı şunu oluşturur                                          | `chat.db` şunu üretir               | Bayrak kapalı (varsayılan)              | Bayrak açık + pencere (`imsg` balon metaverisi yayar)                                               |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (tek gönderim)                          | ~1 sn arayla 2 satır                | İki aracı turu: önce yalnızca "Dump", sonra URL | Tek tur: birleştirilmiş metin `Dump https://example.com`                                            |
| `Save this 📎image.jpg caption` (ek + metin)                       | URL balon metaverisi olmadan 2 satır | İki tur                                 | Metaveri gözlendikten sonra iki tur; eski/mandal öncesi metaverisiz oturumlarda tek birleştirilmiş tur |
| `/status` (bağımsız komut)                                        | 1 satır                             | Anında gönderim                         | **Pencereye kadar bekle, sonra gönder**                                                             |
| Tek başına yapıştırılan URL                                        | 1 satır                             | Anında gönderim                         | Pencereye kadar bekle, sonra gönder                                                                 |
| Dakikalar arayla kasıtlı olarak iki ayrı ileti halinde gönderilen metin + URL | Pencere dışında 2 satır             | İki tur                                 | İki tur (pencere aralarında sona erer)                                                              |
| Hızlı akış (pencere içinde >10 küçük DM)                           | URL balon metaverisi olmadan N satır | N tur                                   | Metaveri gözlendikten sonra N tur; eski/mandal öncesi metaverisiz oturumlarda tek sınırlı birleştirilmiş tur |
| Grup sohbetinde iki kişi yazıyor                                   | M gönderenden N satır               | M+ tur (gönderen kovası başına bir)     | M+ tur — grup sohbetleri birleştirilmez                                                             |

## Köprü veya Gateway yeniden başlatıldıktan sonra gelen ileti kurtarma

iMessage, Gateway kapalıyken kaçırılan iletileri kurtarır ve aynı anda Apple'ın bir Push kurtarmasından sonra boşaltabileceği bayat "birikmiş işler bombası"nı bastırır. Varsayılan davranış her zaman açıktır ve gelen tekilleştirme üzerine kuruludur.

- **Yeniden oynatma tekilleştirmesi.** Gönderilen her gelen ileti, Apple GUID'iyle kalıcı Plugin durumuna (`imessage.inbound-dedupe`) kaydedilir; alım sırasında sahiplenilir ve işlendikten sonra işlenmiş olarak kaydedilir (geçici hatada yeniden deneyebilmesi için serbest bırakılır). Zaten işlenmiş olan her şey, iki kez gönderilmek yerine düşürülür. Kurtarmanın ileti başına defter tutmadan agresif biçimde yeniden oynatabilmesini sağlayan şey budur.
- **Kesinti süresi kurtarması.** Başlangıçta izleyici, son gönderilen `chat.db` rowid değerini (hesap başına kalıcı imleç) hatırlar ve bunu `since_rowid` olarak `imsg watch.subscribe` öğesine geçirir; böylece `imsg`, Gateway kapalıyken gelen satırları yeniden oynatır ve ardından canlı kuyruğu izler. Yeniden oynatma en son satırlarla ve yaklaşık 2 saate kadar eski iletilerle sınırlıdır; tekilleştirme de zaten işlenmiş olan her şeyi düşürür.
- **Bayat birikmiş işler yaş sınırı.** Başlangıç sınırının üzerindeki satırlar gerçekten canlıdır; gönderim tarihi varışından yaklaşık 15 dakikadan daha eski olanlar Push boşaltma birikmiş işleridir ve bastırılır. Yeniden oynatılan satırlar (sınırda veya altında olanlar) bunun yerine daha geniş kurtarma penceresini kullanır; böylece yakın zamanda kaçırılan bir ileti teslim edilirken kadim geçmiş teslim edilmez.

Kurtarma hem yerel hem uzak `cliPath` kurulumlarında çalışır, çünkü `since_rowid` yeniden oynatması aynı `imsg` RPC bağlantısı üzerinden yürür. Fark pencerededir: Gateway `chat.db` okuyabildiğinde (yerel), başlangıç rowid sınırını sabitler, yeniden oynatma aralığını sınırlar ve birkaç saate kadar eski kaçırılmış iletileri teslim eder. Uzak SSH `cliPath` üzerinden veritabanını okuyamaz; bu yüzden yeniden oynatma sınırsızdır ve her satır canlı yaş sınırını kullanır — yakın zamanda kaçırılan iletileri yine kurtarır ve eski birikmiş işleri yine bastırır, yalnızca daha dar canlı pencereyle. Daha geniş kurtarma penceresi için Gateway'i Messages Mac üzerinde çalıştırın.

### Operatöre görünen sinyal

Bastırılan birikmiş işler varsayılan düzeyde günlüklenir, asla sessizce düşürülmez (`recovery` bayrağı hangi pencerenin uygulandığını gösterir):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migrasyon

`channels.imessage.catchup.*` kullanımdan kaldırıldı — kesinti süresi kurtarması artık otomatiktir ve yeni kurulumlar için yapılandırma gerektirmez. `catchup.enabled: true` içeren mevcut yapılandırmalar, kurtarma yeniden oynatma penceresi için uyumluluk profili olarak desteklenmeye devam eder. Devre dışı catchup blokları (`enabled: false` veya `enabled: true` olmayanlar) emekliye ayrıldı; `openclaw doctor --fix` bunları kaldırır.

## Sorun giderme

<AccordionGroup>
  <Accordion title="imsg bulunamadı veya RPC desteklenmiyor">
    İkiliyi ve RPC desteğini doğrulayın:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Probe RPC'nin desteklenmediğini bildirirse `imsg` öğesini güncelleyin. Özel API eylemleri kullanılamıyorsa oturum açmış macOS kullanıcı oturumunda `imsg launch` çalıştırın ve yeniden probe edin. Gateway macOS üzerinde çalışmıyorsa varsayılan yerel `imsg` yolu yerine yukarıdaki SSH üzerinden Uzak Mac kurulumunu kullanın.

  </Accordion>

  <Accordion title="İletiler gönderiliyor ama gelen iMessage'lar ulaşmıyor">
    Önce iletinin yerel Mac'e ulaşıp ulaşmadığını kanıtlayın. `chat.db` değişmiyorsa, `imsg status --json` sağlıklı bir köprü bildirse bile OpenClaw iletiyi alamaz.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Telefondan gönderilen iletiler yeni satır oluşturmuyorsa OpenClaw yapılandırmasını değiştirmeden önce macOS Messages ve Apple Push katmanını onarın. Tek seferlik bir servis yenilemesi çoğu zaman yeterlidir:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Telefondan yeni bir iMessage gönderin ve OpenClaw oturumlarında hata ayıklamadan önce yeni bir `chat.db` satırını veya `imsg watch` olayını doğrulayın. Bunu periyodik köprü yeniden başlatma döngüsü olarak çalıştırmayın; etkin çalışma sırasında tekrarlanan `imsg launch` ve Gateway yeniden başlatmaları teslimatları kesintiye uğratabilir ve devam eden kanal çalıştırmalarını yarıda bırakabilir.

  </Accordion>

  <Accordion title="Gateway macOS üzerinde çalışmıyor">
    Varsayılan `cliPath: "imsg"`, Messages oturumu açılmış Mac üzerinde çalışmalıdır. Linux veya Windows üzerinde, `channels.imessage.cliPath` değerini o Mac'e SSH yapan ve `imsg "$@"` çalıştıran bir sarmalayıcı betiğe ayarlayın.

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
    Kontrol edin:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - eşleştirme onayları (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Grup iletileri yok sayılıyor">
    Kontrol edin:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` izin listesi davranışı
    - bahsetme deseni yapılandırması (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Uzak ekler başarısız oluyor">
    Kontrol edin:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway ana makinesinden SSH/SCP anahtar kimlik doğrulaması
    - Gateway ana makinesinde `~/.ssh/known_hosts` içinde ana makine anahtarı var
    - Messages çalıştıran Mac üzerinde uzak yolun okunabilirliği

  </Accordion>

  <Accordion title="macOS izin istemleri kaçırıldı">
    Aynı kullanıcı/oturum bağlamında etkileşimli bir GUI terminalinde yeniden çalıştırın ve istemleri onaylayın:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    OpenClaw/`imsg` çalıştıran süreç bağlamı için Full Disk Access + Automation izinlerinin verildiğini doğrulayın.

  </Accordion>
</AccordionGroup>

## Yapılandırma referansı işaretçileri

- [Yapılandırma referansı - iMessage](/tr/gateway/config-channels#imessage)
- [Gateway yapılandırması](/tr/gateway/configuration)
- [Eşleştirme](/tr/channels/pairing)

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [BlueBubbles'ın kaldırılması ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage) — duyuru ve migrasyon özeti
- [BlueBubbles'tan geçiş](/tr/channels/imessage-from-bluebubbles) — yapılandırma çeviri tablosu ve adım adım geçiş
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — iletiler için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sıkılaştırma
