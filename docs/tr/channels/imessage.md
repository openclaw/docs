---
read_when:
    - iMessage desteğini ayarlama
    - iMessage gönderme/alma hata ayıklaması
summary: Yanıtlar, tapback'ler, efektler, ekler ve grup yönetimi için özel API eylemleriyle imsg üzerinden yerel iMessage desteği (stdio üzerinden JSON-RPC). Ana makine gereksinimleri uygun olduğunda yeni OpenClaw iMessage kurulumları için tercih edilir.
title: iMessage
x-i18n:
    generated_at: "2026-06-28T00:12:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
OpenClaw iMessage dağıtımları için, oturum açılmış bir macOS Messages ana makinesinde `imsg` kullanın. Gateway Linux veya Windows üzerinde çalışıyorsa, `channels.imessage.cliPath` değerini Mac üzerinde `imsg` çalıştıran bir SSH sarmalayıcısına yönlendirin.

**Gelen kurtarma otomatiktir.** Bir bridge veya gateway yeniden başlatıldıktan sonra iMessage, kapalıyken kaçırılan mesajları yeniden oynatır ve Apple'ın Push kurtarmasından sonra boşaltabileceği eski "birikmiş mesaj bombasını" bastırır; yinelenenleri ayıklayarak hiçbir şeyin iki kez gönderilmemesini sağlar. Etkinleştirilecek bir yapılandırma yoktur — bkz. [Bir bridge veya gateway yeniden başlatmasından sonra gelen kurtarma](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
BlueBubbles desteği kaldırıldı. `channels.bluebubbles` yapılandırmalarını `channels.imessage` değerine taşıyın; OpenClaw iMessage'ı yalnızca `imsg` üzerinden destekler. Kısa duyuru için [BlueBubbles kaldırılması ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage) ile başlayın veya tam geçiş tablosu için [BlueBubbles'tan gelenler](/tr/channels/imessage-from-bluebubbles) bölümüne bakın.
</Warning>

Durum: yerel harici CLI entegrasyonu. Gateway `imsg rpc` başlatır ve stdio üzerinde JSON-RPC ile iletişim kurar (ayrı daemon/port yok). Gelişmiş eylemler `imsg launch` ve başarılı bir özel API yoklaması gerektirir.

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    Yanıtlar, tapback'ler, efektler, ekler ve grup yönetimi.
  </Card>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    iMessage doğrudan mesajları varsayılan olarak eşleştirme modunu kullanır.
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gateway Messages Mac üzerinde çalışmıyorsa bir SSH sarmalayıcısı kullanın.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/tr/gateway/config-channels#imessage">
    Tam iMessage alan başvurusu.
  </Card>
</CardGroup>

## Hızlı kurulum

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configure OpenClaw">

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

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Eşleştirme isteklerinin süresi 1 saat sonra dolar.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw yalnızca stdio uyumlu bir `cliPath` gerektirir, bu nedenle `cliPath` değerini uzak bir Mac'e SSH yapan ve `imsg` çalıştıran bir sarmalayıcı betiğine yönlendirebilirsiniz.

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
    OpenClaw, SCP için sıkı ana makine anahtarı denetimi kullanır; bu nedenle aktarım ana makinesi anahtarı `~/.ssh/known_hosts` içinde zaten bulunmalıdır.
    Ek yolları izin verilen köklere (`attachmentRoots` / `remoteAttachmentRoots`) göre doğrulanır.

<Warning>
`imsg` önüne koyduğunuz herhangi bir `cliPath` sarmalayıcısı veya SSH proxy'si, uzun ömürlü JSON-RPC için şeffaf bir stdio borusu gibi davranmak ZORUNDADIR. OpenClaw, kanalın ömrü boyunca sarmalayıcının stdin/stdout akışları üzerinden küçük, yeni satırla çerçevelenmiş JSON-RPC mesajları alışverişi yapar:

- Her stdin parçasını/satırını **baytlar kullanılabilir olur olmaz** iletin — EOF beklemeyin.
- Her stdout parçasını/satırını ters yönde derhal iletin.
- Yeni satırları koruyun.
- Küçük çerçeveleri aç bırakabilecek sabit boyutlu engelleyici okumalardan (`read(4096)`, `cat | buffer`, varsayılan shell `read`) kaçının.
- stderr akışını JSON-RPC stdout akışından ayrı tutun.

Büyük bir blok dolana kadar stdin'i arabelleğe alan bir sarmalayıcı, `imsg rpc` sağlıklı olsa bile iMessage kesintisi gibi görünen belirtiler üretir — `imsg rpc timeout (chats.list)` veya tekrarlanan kanal yeniden başlatmaları. Yukarıdaki `ssh -T host imsg "$@"` güvenlidir, çünkü OpenClaw'ın `rpc` ve `--db` gibi `cliPath` argümanlarını iletir. `ssh host imsg | grep -v '^DEBUG'` gibi pipeline'lar güvenli DEĞİLDİR — satır arabellekli araçlar hâlâ çerçeveleri tutabilir; filtrelemek zorundaysanız her aşamada `stdbuf -oL -eL` kullanın.
</Warning>

  </Tab>
</Tabs>

## Gereksinimler ve izinler (macOS)

- `imsg` çalıştıran Mac üzerinde Messages oturum açmış olmalıdır.
- OpenClaw/`imsg` çalıştıran süreç bağlamı için Tam Disk Erişimi gerekir (Messages DB erişimi).
- Messages.app üzerinden mesaj göndermek için Otomasyon izni gerekir.
- Gelişmiş eylemler için (tepki / düzenleme / geri alma / iş parçacıklı yanıt / efektler / grup işlemleri), System Integrity Protection devre dışı bırakılmalıdır — aşağıdaki [imsg özel API'sini etkinleştirme](#enabling-the-imsg-private-api) bölümüne bakın. Temel metin ve medya gönderme/alma onsuz çalışır.

<Tip>
İzinler süreç bağlamı başına verilir. Gateway başsız çalışıyorsa (LaunchAgent/SSH), istemleri tetiklemek için aynı bağlamda tek seferlik etkileşimli bir komut çalıştırın:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH wrapper sends fail with AppleEvents -1743">
  Uzak SSH kurulumu sohbetleri okuyabilir, `channels status --probe` geçebilir ve gelen mesajları işleyebilirken giden gönderimler yine de bir AppleEvents yetkilendirme hatasıyla başarısız olabilir:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Oturum açmış Mac kullanıcısının TCC veritabanını veya System Settings > Privacy & Security > Automation bölümünü kontrol edin. Otomasyon girdisi `imsg` veya yerel shell süreci yerine `/usr/libexec/sshd-keygen-wrapper` için kaydedilmişse macOS, bu SSH sunucu tarafı istemcisi için kullanılabilir bir Messages anahtarı göstermeyebilir:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

Bu durumda, `tccutil reset AppleEvents` komutunu tekrarlamak veya aynı SSH sarmalayıcısı üzerinden `imsg send` komutunu yeniden çalıştırmak başarısız olmaya devam edebilir; çünkü Messages Otomasyonu'na ihtiyaç duyan süreç bağlamı, UI'ın izin verebileceği bir uygulama değil SSH sarmalayıcısıdır.

Bunun yerine desteklenen `imsg` süreç bağlamlarından birini kullanın:

- Gateway'i veya en azından `imsg` bridge'ini, oturum açmış Messages kullanıcısının yerel oturumunda çalıştırın.
- Aynı oturumdan Tam Disk Erişimi ve Otomasyon izni verdikten sonra Gateway'i o kullanıcı için bir LaunchAgent ile başlatın.
- İki kullanıcılı SSH topolojisini koruyorsanız, kanalı etkinleştirmeden önce gerçek bir giden `imsg send` komutunun tam sarmalayıcı üzerinden başarılı olduğunu doğrulayın. Otomasyon izni verilemiyorsa, gönderimler için SSH sarmalayıcısına güvenmek yerine tek kullanıcılı bir `imsg` kurulumuna yeniden yapılandırın.

</Accordion>

## imsg özel API'sini etkinleştirme

`imsg` iki çalışma moduyla gelir:

- **Temel mod** (varsayılan, SIP değişikliği gerekmez): `send` üzerinden giden metin ve medya, gelen izleme/geçmiş, sohbet listesi. Yeni bir `brew install steipete/tap/imsg` kurulumundan ve yukarıdaki standart macOS izinlerinden sonra kutudan çıktığı gibi elde ettiğiniz budur.
- **Özel API modu**: `imsg`, dahili `IMCore` işlevlerini çağırmak için `Messages.app` içine bir yardımcı dylib enjekte eder. `react`, `edit`, `unsend`, `reply` (iş parçacıklı), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` ile yazıyor göstergeleri ve okundu bilgilerini açan budur.

Bu kanal sayfasının belgelediği gelişmiş eylem yüzeyine ulaşmak için Özel API modu gerekir. `imsg` README gereksinim konusunda açıktır:

> `read`, `typing`, `launch`, bridge destekli zengin gönderim, mesaj mutasyonu ve sohbet yönetimi gibi gelişmiş özellikler isteğe bağlıdır. SIP'in devre dışı bırakılmasını ve `Messages.app` içine bir yardımcı dylib enjekte edilmesini gerektirir. SIP etkin olduğunda `imsg launch` enjeksiyonu reddeder.

Yardımcı enjeksiyon tekniği, Messages özel API'lerine ulaşmak için `imsg`'in kendi dylib'ini kullanır. OpenClaw iMessage yolunda üçüncü taraf sunucu veya BlueBubbles çalışma zamanı yoktur.

<Warning>
**SIP'i devre dışı bırakmak gerçek bir güvenlik takasıdır.** SIP, macOS'un değiştirilmiş sistem kodu çalıştırmaya karşı temel korumalarından biridir; sistem genelinde kapatılması ek saldırı yüzeyi ve yan etkiler açar. Özellikle, **Apple Silicon Mac'lerde SIP'i devre dışı bırakmak, iOS uygulamalarını Mac'inize yükleme ve çalıştırma yeteneğini de devre dışı bırakır**.

Bunu varsayılan değil, bilinçli bir operasyonel tercih olarak ele alın. Tehdit modeliniz SIP'in kapalı olmasını tolere edemiyorsa, yerleşik iMessage temel modla sınırlıdır — yalnızca metin ve medya gönderme/alma, tepki / düzenleme / geri alma / efektler / grup işlemleri yok.
</Warning>

### Kurulum

1. Messages.app çalıştıran Mac üzerinde **`imsg` yükleyin (veya yükseltin)**:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` çıktısı `bridge_version`, `rpc_methods` ve yöntem başına `selectors` bildirir; böylece başlamadan önce mevcut derlemenin neyi desteklediğini görebilirsiniz.

2. **System Integrity Protection'ı ve (modern macOS'ta) Library Validation'ı devre dışı bırakın.** Apple imzalı `Messages.app` içine Apple olmayan bir yardımcı dylib enjekte etmek için SIP kapalı olmalı **ve** library validation gevşetilmelidir. Recovery-mode SIP adımı macOS sürümüne özeldir:
   - **macOS 10.13-10.15 (Sierra-Catalina):** Terminal üzerinden Library Validation'ı devre dışı bırakın, Recovery Mode'a yeniden başlatın, `csrutil disable` çalıştırın, yeniden başlatın.
   - **macOS 11+ (Big Sur ve sonrası), Intel:** Recovery Mode (veya Internet Recovery), `csrutil disable`, yeniden başlatın.
   - **macOS 11+, Apple Silicon:** Recovery'ye girmek için güç düğmesi başlangıç dizisi; güncel macOS sürümlerinde Continue'a tıklarken **Sol Shift** tuşunu basılı tutun, ardından `csrutil disable`. Sanal makine kurulumları ayrı bir akış izler; bu yüzden önce bir VM anlık görüntüsü alın.

   **macOS 11 ve sonrasında, yalnızca `csrutil disable` genellikle yeterli değildir.** Apple, platform ikilisi olarak `Messages.app` için hâlâ library validation uygular; bu nedenle adhoc imzalı bir yardımcı, SIP kapalı olsa bile reddedilir (`Library Validation failed: ... platform binary, but mapped file is not`). SIP'i devre dışı bıraktıktan sonra library validation'ı da devre dışı bırakın ve yeniden başlatın:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), 26.5.1 üzerinde doğrulandı:** SIP kapalı **artı** yukarıdaki `DisableLibraryValidation` komutu, yardımcıyı 26.0'dan 26.5.x'e kadar enjekte etmek için yeterlidir. **Boot-arg gerekmez.** Plist belirleyici faktördür ve Tahoe'da enjeksiyon başarısız olduğunda en sık eksik olan adımdır:
   - **Plist ile:** `imsg launch` enjekte eder ve `imsg status`, `advanced_features: true` bildirir.
   - **Plist olmadan (SIP kapalı olsa bile):** `imsg launch`, `Failed to launch: Timeout waiting for Messages.app to initialize` ile başarısız olur. AMFI adhoc yardımcıyı yükleme sırasında reddeder; bu yüzden bridge hiçbir zaman hazır olmaz ve başlatma zaman aşımına uğrar. Tahoe'da çoğu kişinin karşılaştığı belirti bu zaman aşımıdır ve çözüm daha sert bir şey değil, yukarıdaki plist'tir.

   Bu, macOS 26.5.1 (Apple Silicon) üzerinde kontrollü bir önce/sonra ile doğrulandı: plist ile dylib `Messages.app` içine map edilir ve bridge ayağa kalkar; plist'i kaldırıp yeniden başlatınca `imsg launch`, dylib map edilmeden yukarıdaki zaman aşımı hatasını üretir.

   SIP devre dışı bırakıldıktan sonra `imsg launch` enjeksiyonu veya belirli `selectors` değerleri bir macOS yükseltmesinden sonra false döndürmeye başlarsa, olağan neden bu kapıdır. SIP adımının kendisinin başarısız olduğunu varsaymadan önce SIP ve library-validation durumunuzu kontrol edin. Bu ayarlar doğruysa ve bridge hâlâ enjekte edemiyorsa, `imsg status --json` ile `imsg launch` çıktısını toplayın ve ek sistem geneli güvenlik denetimlerini zayıflatmak yerine bunu `imsg` projesine bildirin.

   `imsg launch` çalıştırmadan önce SIP’i devre dışı bırakmak için Mac’iniz için Apple’ın Kurtarma modu akışını izleyin.

3. **Yardımcıyı enjekte edin.** SIP devre dışıyken ve Messages.app oturum açmışken:

   ```bash
   imsg launch
   ```

   `imsg launch`, SIP hâlâ etkinken enjeksiyonu reddeder; bu nedenle bu, 2. adımın uygulandığını doğrulama işlevi de görür.

4. **Bridge’i OpenClaw’dan doğrulayın:**

   ```bash
   openclaw channels status --probe
   ```

   iMessage girdisi `works` bildirmeli ve `imsg status --json | jq '.selectors'` çıktısı `retractMessagePart: true` ile macOS derlemenizin sunduğu düzenleme / yazıyor / okundu seçicilerini göstermelidir. `actions.ts` içindeki OpenClaw Plugin yöntem bazlı geçidi yalnızca temel seçicisi `true` olan eylemleri duyurur; bu nedenle ajanın araç listesinde gördüğünüz eylem yüzeyi, bridge’in bu konakta gerçekten yapabileceklerini yansıtır.

`openclaw channels status --probe` kanalı `works` olarak bildiriyor ancak belirli eylemler gönderim zamanında "iMessage `<action>` requires the imsg private API bridge" hatası veriyorsa, `imsg launch` komutunu yeniden çalıştırın — yardımcı devreden çıkabilir (Messages.app yeniden başlatması, OS güncellemesi vb.) ve önbelleğe alınmış `available: true` durumu, bir sonraki probe yenileyene kadar eylemleri duyurmaya devam eder.

### SIP’i devre dışı bırakamadığınızda

SIP’in devre dışı olması tehdit modeliniz için kabul edilebilir değilse:

- `imsg` temel moda geri döner — yalnızca metin + medya + alma.
- OpenClaw Plugin hâlâ metin/medya gönderimini ve gelen izlemeyi duyurur; yalnızca `react`, `edit`, `unsend`, `reply`, `sendWithEffect` ve grup işlemlerini eylem yüzeyinden gizler (yöntem bazlı yetenek geçidine göre).
- iMessage iş yükü için SIP kapalı ayrı bir Apple Silicon olmayan Mac (veya adanmış bir bot Mac) çalıştırabilir, birincil cihazlarınızda SIP’i etkin tutabilirsiniz. Aşağıdaki [Adanmış bot macOS kullanıcısı (ayrı iMessage kimliği)](#deployment-patterns) bölümüne bakın.

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.imessage.dmPolicy` doğrudan mesajları denetler:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    İzin listesi alanı: `channels.imessage.allowFrom`.

    İzin listesi girdileri gönderenleri tanımlamalıdır: handle’lar veya statik gönderen erişim grupları (`accessGroup:<name>`). `chat_id:*`, `chat_guid:*` veya `chat_identifier:*` gibi sohbet hedefleri için `channels.imessage.groupAllowFrom` kullanın; sayısal `chat_id` kayıt defteri anahtarları için `channels.imessage.groups` kullanın.

  </Tab>

  <Tab title="Grup ilkesi + bahsetmeler">
    `channels.imessage.groupPolicy` grup işlemeyi denetler:

    - `allowlist` (yapılandırıldığında varsayılan)
    - `open`
    - `disabled`

    Grup gönderen izin listesi: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom` girdileri statik gönderen erişim gruplarına da başvurabilir (`accessGroup:<name>`).

    Çalışma zamanı geri dönüşü: `groupAllowFrom` ayarlanmamışsa, iMessage grup gönderen denetimleri `allowFrom` kullanır; DM ve grup kabulü farklı olmalıysa `groupAllowFrom` ayarlayın.
    Çalışma zamanı notu: `channels.imessage` tamamen eksikse, çalışma zamanı `groupPolicy="allowlist"` değerine geri döner ve bir uyarı günlüğe yazar (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

    <Warning>
    Grup yönlendirmesinde arka arkaya çalışan **iki** izin listesi geçidi vardır ve ikisi de geçmelidir:

    1. **Gönderen / sohbet hedefi izin listesi** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` veya `chat_id`.
    2. **Grup kayıt defteri** (`channels.imessage.groups`) — `groupPolicy: "allowlist"` ile bu geçit ya `groups: { "*": { ... } }` joker girdisi (`allowAll = true` ayarlar) ya da `groups` altında açık bir `chat_id` başına girdi gerektirir.

    2. geçitte hiçbir şey yoksa, her grup mesajı düşürülür. Plugin varsayılan günlük düzeyinde iki `warn` düzeyi sinyal yayar:

    - başlangıçta hesap başına tek seferlik: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - çalışma zamanında `chat_id` başına tek seferlik: `imessage: dropping group message from chat_id=<id> ...`

    DM’ler farklı bir kod yolunu kullandıkları için çalışmaya devam eder.

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

    Bu `warn` satırları gateway günlüğünde görünüyorsa, 2. geçit düşürüyor demektir — `groups` bloğunu ekleyin.
    </Warning>

    Gruplar için bahsetme geçidi:

    - iMessage yerel bahsetme meta verisine sahip değildir
    - bahsetme algılama regex desenlerini kullanır (`agents.list[].groupChat.mentionPatterns`, geri dönüş `messages.groupChat.mentionPatterns`)
    - yapılandırılmış desen yoksa, bahsetme geçidi uygulanamaz

    Yetkili gönderenlerden gelen denetim komutları gruplarda bahsetme geçidini atlayabilir.

    Grup başına `systemPrompt`:

    `channels.imessage.groups.*` altındaki her girdi isteğe bağlı bir `systemPrompt` dizesi kabul eder. Değer, o gruptaki bir mesajı işleyen her turda ajanın system prompt’una enjekte edilir. Çözümleme, `channels.whatsapp.groups` tarafından kullanılan grup başına prompt çözümlemesini yansıtır:

    1. **Gruba özgü system prompt** (`groups["<chat_id>"].systemPrompt`): belirli grup girdisi map içinde varsa **ve** `systemPrompt` anahtarı tanımlıysa kullanılır. `systemPrompt` boş dizeyse (`""`) joker bastırılır ve o gruba system prompt uygulanmaz.
    2. **Grup joker system prompt’u** (`groups["*"].systemPrompt`): belirli grup girdisi map’te tamamen yoksa veya var olup `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

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

    Grup başına prompt’lar yalnızca grup mesajlarına uygulanır — bu kanaldaki doğrudan mesajlar etkilenmez.

  </Tab>

  <Tab title="Oturumlar ve deterministik yanıtlar">
    - DM’ler doğrudan yönlendirme kullanır; gruplar grup yönlendirmesi kullanır.
    - Varsayılan `session.dmScope=main` ile iMessage DM’leri ajanın ana oturumuna daraltılır.
    - Grup oturumları yalıtılmıştır (`agent:<agentId>:imessage:group:<chat_id>`).
    - Yanıtlar, kaynak kanal/hedef meta verileri kullanılarak iMessage’a geri yönlendirilir.

    Grup benzeri thread davranışı:

    Bazı çok katılımcılı iMessage thread’leri `is_group=false` ile gelebilir.
    Bu `chat_id`, `channels.imessage.groups` altında açıkça yapılandırılmışsa, OpenClaw bunu grup trafiği olarak ele alır (grup geçidi + grup oturumu yalıtımı).

  </Tab>
</Tabs>

## ACP konuşma bağlamaları

Eski iMessage sohbetleri ACP oturumlarına da bağlanabilir.

Hızlı operatör akışı:

- DM veya izin verilen grup sohbeti içinde `/acp spawn codex --bind here` çalıştırın.
- Aynı iMessage konuşmasındaki gelecekteki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- `/new` ve `/reset` aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close` ACP oturumunu kapatır ve bağlamayı kaldırır.

Yapılandırılmış kalıcı bağlamalar, `type: "acp"` ve `match.channel: "imessage"` içeren üst düzey `bindings[]` girdileri aracılığıyla desteklenir.

`match.peer.id` şunları kullanabilir:

- `+15555550123` veya `user@example.com` gibi normalize edilmiş DM handle’ı
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

Paylaşılan ACP bağlama davranışı için [ACP Ajanları](/tr/tools/acp-agents) bölümüne bakın.

## Dağıtım desenleri

<AccordionGroup>
  <Accordion title="Adanmış bot macOS kullanıcısı (ayrı iMessage kimliği)">
    Bot trafiğinin kişisel Messages profilinizden yalıtılması için adanmış bir Apple ID ve macOS kullanıcısı kullanın.

    Tipik akış:

    1. Adanmış bir macOS kullanıcısı oluşturun/oturum açın.
    2. Bu kullanıcıda bot Apple ID ile Messages’a oturum açın.
    3. Bu kullanıcıda `imsg` kurun.
    4. OpenClaw’ın `imsg` komutunu bu kullanıcı bağlamında çalıştırabilmesi için SSH wrapper oluşturun.
    5. `channels.imessage.accounts.<id>.cliPath` ve `.dbPath` değerlerini bu kullanıcı profiline yönlendirin.

    İlk çalıştırma, bu bot kullanıcı oturumunda GUI onayları (Automation + Full Disk Access) gerektirebilir.

  </Accordion>

  <Accordion title="Tailscale üzerinden uzak Mac (örnek)">
    Yaygın topoloji:

    - gateway Linux/VM üzerinde çalışır
    - iMessage + `imsg` tailnet’inizdeki bir Mac üzerinde çalışır
    - `cliPath` wrapper’ı `imsg` çalıştırmak için SSH kullanır
    - `remoteHost` SCP ek getirmelerini etkinleştirir

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

    Hem SSH hem SCP’nin etkileşimsiz olması için SSH anahtarları kullanın.
    `known_hosts` doldurulsun diye önce konak anahtarının güvenilir olduğundan emin olun (örneğin `ssh bot@mac-mini.tailnet-1234.ts.net`).

  </Accordion>

  <Accordion title="Çok hesaplı desen">
    iMessage, `channels.imessage.accounts` altında hesap başına yapılandırmayı destekler.

    Her hesap `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, geçmiş ayarları ve ek kök izin listeleri gibi alanları geçersiz kılabilir.

  </Accordion>

  <Accordion title="Doğrudan mesaj geçmişi">
    Yeni doğrudan mesaj oturumlarını o konuşma için son çözümlenmiş `imsg` geçmişiyle tohumlamak üzere `channels.imessage.dmHistoryLimit` ayarlayın. Gönderen başına geçersiz kılmalar için, bir gönderenin geçmişini devre dışı bırakmak üzere `0` dahil `channels.imessage.dms["<sender>"].historyLimit` kullanın.

    iMessage DM geçmişi `imsg` üzerinden isteğe bağlı alınır. `dmHistoryLimit` ayarlanmadan bırakılırsa genel DM geçmişi tohumlama devre dışı kalır, ancak pozitif bir gönderen başına `channels.imessage.dms["<sender>"].historyLimit` yine de o gönderen için tohumlamayı etkinleştirir.

  </Accordion>
</AccordionGroup>

## Medya, parçalama ve teslim hedefleri

<AccordionGroup>
  <Accordion title="Ekler ve medya">
    - gelen ek alımı **varsayılan olarak kapalıdır** — fotoğrafları, sesli notları, videoları ve diğer ekleri ajana iletmek için `channels.imessage.includeAttachments: true` ayarlayın. Devre dışıyken, yalnızca ek içeren iMessage'lar ajana ulaşmadan önce düşürülür ve hiç `Inbound message` günlük satırı üretmeyebilir.
    - `remoteHost` ayarlandığında uzak ek yolları SCP aracılığıyla alınabilir
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

`imsg launch` çalışırken ve `openclaw channels status --probe` `privateApi.available: true` bildirdiğinde, mesaj aracı normal metin göndermelerine ek olarak iMessage'a özgü yerel eylemleri kullanabilir.

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
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Kullanılabilir eylemler">
    - **react**: iMessage tapback'leri ekleyin/kaldırın (`messageId`, `emoji`, `remove`). Desteklenen tapback'ler love, like, dislike, laugh, emphasize ve question ile eşlenir.
    - **reply**: Mevcut bir mesaja iş parçacıklı yanıt gönderin (`messageId`, `text` veya `message`, ayrıca `chatGuid`, `chatId`, `chatIdentifier` ya da `to`).
    - **sendWithEffect**: Bir iMessage efektiyle metin gönderin (`text` veya `message`, `effect` veya `effectId`).
    - **edit**: Desteklenen macOS/özel API sürümlerinde gönderilmiş bir mesajı düzenleyin (`messageId`, `text` veya `newText`).
    - **unsend**: Desteklenen macOS/özel API sürümlerinde gönderilmiş bir mesajı geri çekin (`messageId`).
    - **upload-file**: Medya/dosya gönderin (`buffer` base64 olarak veya hydrate edilmiş `media`/`path`/`filePath`, `filename`, isteğe bağlı `asVoice`). Eski takma ad: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Geçerli hedef bir grup konuşması olduğunda grup sohbetlerini yönetin.

  </Accordion>

  <Accordion title="Mesaj kimlikleri">
    Gelen iMessage bağlamı, kullanılabilir olduğunda hem kısa `MessageSid` değerlerini hem de tam mesaj GUID'lerini içerir. Kısa kimlikler, yakın tarihli SQLite destekli yanıt önbelleğiyle sınırlıdır ve kullanılmadan önce geçerli sohbete karşı denetlenir. Kısa bir kimliğin süresi dolmuşsa veya başka bir sohbete aitse tam `MessageSidFull` ile yeniden deneyin.

  </Accordion>

  <Accordion title="Yetenek algılama">
    OpenClaw özel API eylemlerini yalnızca önbelleğe alınmış yoklama durumu köprünün kullanılamadığını söylediğinde gizler. Durum bilinmiyorsa, eylemler görünür kalır ve gönderim yoklamaları tembel biçimde yapar; böylece ilk eylem, ayrı bir manuel durum yenilemesi olmadan `imsg launch` sonrasında başarılı olabilir.

  </Accordion>

  <Accordion title="Okundu bilgileri ve yazıyor göstergesi">
    Özel API köprüsü ayaktayken, kabul edilen gelen sohbetler okundu olarak işaretlenir ve doğrudan sohbetler, ajan bağlamı hazırlayıp üretirken sıra kabul edilir edilmez bir yazıyor balonu gösterir. Okundu işaretlemeyi şu şekilde devre dışı bırakın:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Yöntem başına yetenek listesinden eski olan daha eski `imsg` derlemeleri yazıyor/okundu özelliğini sessizce kapatır; OpenClaw, eksik bildirimin nedeni anlaşılabilsin diye her yeniden başlatmada bir kez uyarı günlüğe yazar.

  </Accordion>

  <Accordion title="Gelen tapback'ler">
    OpenClaw iMessage tapback'lerine abone olur ve kabul edilen tepkileri normal mesaj metni yerine sistem olayları olarak yönlendirir; böylece kullanıcının tapback'i sıradan bir yanıt döngüsünü tetiklemez.

    Bildirim modu `channels.imessage.reactionNotifications` ile kontrol edilir:

    - `"own"` (varsayılan): yalnızca kullanıcılar bot tarafından yazılmış mesajlara tepki verdiğinde bildir.
    - `"all"`: yetkili gönderenlerden gelen tüm tapback'ler için bildir.
    - `"off"`: gelen tapback'leri yok say.

    Hesap başına geçersiz kılmalar `channels.imessage.accounts.<id>.reactionNotifications` kullanır.

  </Accordion>

  <Accordion title="Onay tepkileri (👍 / 👎)">
    `approvals.exec.enabled` veya `approvals.plugin.enabled` true olduğunda ve istek iMessage'a yönlendirildiğinde, Gateway yerel olarak bir onay istemi iletir ve bunu çözmek için bir tapback kabul eder:

    - `👍` (Like tapback) → `allow-once`
    - `👎` (Dislike tapback) → `deny`
    - `allow-always` manuel bir yedek olarak kalır: normal bir yanıt olarak `/approve <id> allow-always` gönderin.

    Tepki işleme, tepki veren kullanıcının tanıtıcısının açık bir onaylayıcı olmasını gerektirir. Onaylayıcı listesi `channels.imessage.allowFrom` (veya `channels.imessage.accounts.<id>.allowFrom`) içinden okunur; kullanıcının telefon numarasını E.164 biçiminde veya Apple ID e-postasını ekleyin. Joker karakter girdisi `"*"` dikkate alınır ancak herhangi bir gönderenin onaylamasına izin verir. Tepki kısayolu, onay çözümlemesi için önemli olan tek kapı açık onaylayıcı izin listesi olduğu için bilerek `reactionNotifications`, `dmPolicy` ve `groupAllowFrom` üzerinden geçmez.

    **Bu sürümle davranış değişikliği:** `channels.imessage.allowFrom` boş değilken, `/approve <id> <decision>` metin komutu artık bu onaylayıcı listesine göre yetkilendirilir (daha geniş DM izin listesine göre değil). DM izin listesinde izinli olup `allowFrom` içinde olmayan gönderenler açık bir ret alır. Önceki davranışı korumak için `/approve` ile (ve tepkilerle) onay verebilmesi gereken her operatörü `allowFrom` içine ekleyin. `allowFrom` boş olduğunda eski "aynı sohbet yedeği" etkili kalır ve `/approve`, DM izin listesinin izin verdiği herkesi yetkilendirmeye devam eder.

    Operatör notları:
    - Tepki bağlama hem bellekte (onay süresiyle eşleşen TTL ile) hem de Gateway'in kalıcı anahtarlı deposunda saklanır; böylece bir Gateway yeniden başlatmasından kısa süre sonra ulaşan tapback yine de onayı çözer.
    - Cihazlar arası `is_from_me=true` tapback'leri (operatörün eşleştirilmiş bir Apple cihazındaki kendi tepkisi), botun kendini onaylayamaması için bilerek yok sayılır.
    - Eski metin tarzı tapback'ler (çok eski Apple istemcilerinden gelen `Liked "…"` düz metni) mesaj GUID'i taşımadıkları için onayları çözemez; tepki çözümlemesi, güncel macOS / iOS istemcilerinin yaydığı yapılandırılmış tapback meta verisini gerektirir.

  </Accordion>
</AccordionGroup>

## Yapılandırma yazmaları

iMessage, kanal tarafından başlatılan yapılandırma yazmalarına varsayılan olarak izin verir (`commands.config: true` olduğunda `/config set|unset` için).

Devre dışı bırakın:

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

Bir kullanıcı bir komutu ve URL'yi birlikte yazdığında — ör. `Dump https://example.com/article` — Apple'ın Messages uygulaması gönderimi **iki ayrı `chat.db` satırına** böler:

1. Bir metin mesajı (`"Dump"`).
2. OG önizleme görselleri ek olarak bulunan bir URL önizleme balonu (`"https://..."`).

İki satır çoğu kurulumda OpenClaw'a yaklaşık 0,8-2,0 sn arayla ulaşır. Birleştirme olmadan ajan 1. sırada yalnızca komutu alır, yanıt verir (çoğu zaman "URL'yi gönder"), URL'yi ise yalnızca 2. sırada görür — bu noktada komut bağlamı zaten kaybolmuştur. Bu, Apple'ın gönderim hattıdır; OpenClaw veya `imsg` tarafından eklenen bir şey değildir.

`channels.imessage.coalesceSameSenderDms`, bir DM'i aynı gönderenden gelen ardışık satırları arabelleğe almaya dahil eder. `imsg`, kaynak satırlardan birinde yapısal URL önizleme işaretçisi `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` sunduğunda, OpenClaw yalnızca bu gerçek bölünmüş gönderimi birleştirir ve arabelleğe alınmış diğer satırları ayrı sıralar olarak tutar. Hiç balon meta verisi yaymayan daha eski `imsg` derlemelerinde OpenClaw bölünmüş gönderimi ayrı gönderimlerden ayırt edemez, bu yüzden sepeti birleştirmeye geri döner. Bu, `Dump <url>` bölünmüş gönderimlerini iki sıraya geriletmek yerine meta veri öncesi davranışı korur. Grup sohbetleri çok kullanıcılı sıra yapısının korunması için mesaj başına göndermeye devam eder.

<Tabs>
  <Tab title="Ne zaman etkinleştirilmeli">
    Şu durumlarda etkinleştirin:

    - Tek mesajda `command + payload` bekleyen Skills gönderiyorsanız (dump, paste, save, queue vb.).
    - Kullanıcılarınız komutların yanına URL yapıştırıyorsa.
    - Eklenen DM sıra gecikmesini kabul edebiliyorsanız (aşağıya bakın).

    Şu durumlarda devre dışı bırakılmış bırakın:

    - Tek kelimelik DM tetikleyicileri için en düşük komut gecikmesine ihtiyacınız varsa.
    - Tüm akışlarınız yük devamı olmayan tek seferlik komutlarsa.

  </Tab>
  <Tab title="Etkinleştirme">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Bayrak açıkken ve açık bir `messages.inbound.byChannel.imessage` ya da global `messages.inbound.debounceMs` yokken, debounce penceresi **7000 ms** değerine genişler (eski varsayılan 0 ms'dir — debounce yok). Daha geniş pencere gereklidir çünkü Apple'ın URL önizleme bölünmüş gönderim temposu, Messages.app önizleme satırını yayarken birkaç saniyeye uzayabilir.

    Pencereyi kendiniz ayarlamak için:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Takaslar">
    - **Kesin birleştirme güncel `imsg` yük meta verisi gerektirir.** URL satırı `balloon_bundle_id` içerdiğinde, yalnızca bu gerçek bölünmüş gönderim birleştirilir ve arabelleğe alınmış diğer satırlar ayrı kalır. Balon meta verisi sunmayan daha eski `imsg` derlemelerinde OpenClaw, `Dump <url>` bölünmüş gönderimleri iki sıraya gerilemesin diye arabelleğe alınmış sepeti birleştirmeye geri döner (geçici geriye dönük uyumluluk, `imsg` bölünmüş gönderimleri yukarı akışta birleştirdiğinde kaldırılır).
    - **DM mesajları için ek gecikme.** Bayrak açıkken, her DM (bağımsız kontrol komutları ve tek metinlik devamlar dahil), bir URL önizleme satırı geliyor olabilir diye gönderilmeden önce debounce penceresine kadar bekler. Grup sohbeti mesajları anında gönderimi korur.
    - **Birleştirilmiş çıktı sınırlıdır.** Birleştirilmiş metin, açık bir `…[truncated]` işaretçisiyle 4000 karakterde sınırlandırılır; ekler 20 ile sınırlandırılır; kaynak girdileri 10 ile sınırlandırılır (bunun ötesinde ilk ve en son olanlar tutulur). Her kaynak GUID'i aşağı akış telemetrisi için `coalescedMessageGuids` içinde izlenir.
    - **Yalnızca DM.** Grup sohbetleri mesaj başına gönderime düşer; böylece birden çok kişi yazarken bot yanıt verebilir kalır.
    - **Dahil olmalı, kanal başına.** Diğer kanallar (Telegram, WhatsApp, Slack, …) etkilenmez. `channels.bluebubbles.coalesceSameSenderDms` ayarlayan eski BlueBubbles yapılandırmaları bu değeri `channels.imessage.coalesceSameSenderDms` değerine taşımalıdır.

  </Tab>
</Tabs>

### Senaryolar ve ajanın gördükleri

"Bayrak açık" sütunu, `balloon_bundle_id` yayan bir `imsg` derlemesindeki davranışı gösterir. Hiç balon meta verisi yaymayan eski `imsg` derlemelerinde, aşağıda "İki tur" / "N tur" olarak işaretlenen satırlar bunun yerine eski bir birleştirmeye (tek tur) geri döner: OpenClaw, bölünmüş göndermeyi ayrı göndermelerden yapısal olarak ayırt edemez, bu yüzden meta veri öncesi birleştirmeyi korur. Kesin ayırma, derleme balon meta verisi yaymaya başladığında etkinleşir.

| Kullanıcı şunu oluşturur                                           | `chat.db` şunu üretir               | Bayrak kapalı (varsayılan)              | Bayrak açık + pencere (`imsg` balon meta verisi yayar)                                             |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (tek gönderim)                          | ~1 sn arayla 2 satır                | İki ajan turu: yalnızca "Dump", sonra URL | Tek tur: birleştirilmiş metin `Dump https://example.com`                                           |
| `Save this 📎image.jpg caption` (ek + metin)                       | URL balon meta verisi olmadan 2 satır | İki tur                               | Meta veri gözlemlendikten sonra iki tur; eski/mandal öncesi meta verisiz oturumlarda tek birleştirilmiş tur |
| `/status` (bağımsız komut)                                         | 1 satır                             | Anında gönderim                         | **Pencereye kadar bekle, sonra gönder**                                                            |
| URL tek başına yapıştırıldı                                        | 1 satır                             | Anında gönderim                         | Pencereye kadar bekle, sonra gönder                                                                |
| Metin + URL dakikalar arayla kasıtlı olarak iki ayrı mesaj şeklinde gönderildi | pencere dışında 2 satır | İki tur                               | İki tur (pencere aralarında sona erer)                                                             |
| Hızlı akın (pencere içinde >10 küçük DM)                           | URL balon meta verisi olmadan N satır | N tur                                 | Meta veri gözlemlendikten sonra N tur; eski/mandal öncesi meta verisiz oturumlarda tek sınırlı birleştirilmiş tur |
| Grup sohbetinde iki kişi yazıyor                                   | M göndericiden N satır              | M+ tur (gönderici kovası başına bir tane) | M+ tur — grup sohbetleri birleştirilmez                                                           |

## Bir köprü veya Gateway yeniden başlatmasından sonra gelen kurtarma

iMessage, Gateway kapalıyken kaçırılan mesajları kurtarır ve aynı anda Apple'ın Push kurtarmasından sonra boşaltabileceği eski "birikmiş iş bombası"nı bastırır. Varsayılan davranış her zaman açıktır ve gelen tekilleştirme üzerine kuruludur.

- **Yeniden oynatma tekilleştirmesi.** Gönderilen her gelen mesaj, Apple GUID'siyle kalıcı plugin durumuna (`imessage.inbound-dedupe`) kaydedilir, alım sırasında talep edilir ve işlendikten sonra işlenmiş olarak kaydedilir (geçici bir hatada yeniden denenebilmesi için serbest bırakılır). Zaten işlenmiş olan her şey iki kez gönderilmek yerine atılır. Kurtarmanın mesaj başına defter tutmadan agresif biçimde yeniden oynatma yapmasını sağlayan şey budur.
- **Kesinti kurtarması.** Başlangıçta izleyici son gönderilen `chat.db` rowid'sini (kalıcı, hesap başına bir imleç) hatırlar ve bunu `since_rowid` olarak `imsg watch.subscribe` içine geçirir; böylece imsg, Gateway kapalıyken gelen satırları yeniden oynatır ve ardından canlıyı takip eder. Yeniden oynatma en son satırlarla ve en fazla ~2 saat eski mesajlarla sınırlıdır; tekilleştirme zaten işlenmiş olan her şeyi atar.
- **Eski birikmiş iş yaş eşiği.** Başlangıç sınırının üzerindeki satırlar gerçekten canlıdır; gönderim tarihi varışından ~15 dakikadan daha eski olanlar Push boşaltma birikmiş işidir ve bastırılır. Yeniden oynatılan satırlar (sınırda veya altında) bunun yerine daha geniş kurtarma penceresini kullanır; böylece yakın zamanda kaçırılmış bir mesaj teslim edilirken çok eski geçmiş teslim edilmez.

Kurtarma hem yerel hem uzak `cliPath` kurulumlarında çalışır, çünkü `since_rowid` yeniden oynatması aynı `imsg` RPC bağlantısı üzerinden çalışır. Fark penceredir: Gateway `chat.db` okuyabildiğinde (yerel), başlangıç rowid sınırını sabitler, yeniden oynatma aralığını sınırlar ve birkaç saate kadar eski kaçırılmış mesajları teslim eder. Uzak SSH `cliPath` üzerinden veritabanını okuyamaz, bu yüzden yeniden oynatma sınırsızdır ve her satır canlı yaş eşiğini kullanır — yakın zamanda kaçırılmış mesajları yine kurtarır ve eski birikmiş işi yine bastırır, yalnızca daha dar canlı pencereyle. Daha geniş kurtarma penceresi için Gateway'i Messages Mac üzerinde çalıştırın.

### Operatörün görebileceği sinyal

Bastırılan birikmiş iş varsayılan düzeyde günlüğe yazılır, asla sessizce atılmaz (`recovery` bayrağı hangi pencerenin uygulandığını gösterir):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Geçiş

`channels.imessage.catchup.*` kullanımdan kaldırıldı — kesinti kurtarması artık otomatiktir ve yeni kurulumlar için yapılandırma gerektirmez. `catchup.enabled: true` içeren mevcut yapılandırmalar, kurtarma yeniden oynatma penceresi için uyumluluk profili olarak desteklenmeye devam eder. Devre dışı yakalama blokları (`enabled: false` veya `enabled: true` olmaması) emekliye ayrılmıştır; `openclaw doctor --fix` bunları kaldırır.

## Sorun giderme

<AccordionGroup>
  <Accordion title="imsg bulunamadı veya RPC desteklenmiyor">
    İkili dosyayı ve RPC desteğini doğrulayın:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Yoklama RPC'nin desteklenmediğini bildirirse `imsg` güncelleyin. Özel API eylemleri kullanılamıyorsa, oturum açmış macOS kullanıcı oturumunda `imsg launch` çalıştırın ve tekrar yoklayın. Gateway macOS üzerinde çalışmıyorsa, varsayılan yerel `imsg` yolu yerine yukarıdaki SSH üzerinden Uzak Mac kurulumunu kullanın.

  </Accordion>

  <Accordion title="Mesajlar gönderiliyor ama gelen iMessage'lar ulaşmıyor">
    Önce mesajın yerel Mac'e ulaşıp ulaşmadığını kanıtlayın. `chat.db` değişmiyorsa, `imsg status --json` sağlıklı bir köprü bildirse bile OpenClaw mesajı alamaz.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Telefondan gönderilen mesajlar yeni satır oluşturmuyorsa, OpenClaw yapılandırmasını değiştirmeden önce macOS Messages ve Apple Push katmanını onarın. Tek seferlik bir hizmet yenilemesi çoğu zaman yeterlidir:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    OpenClaw oturumlarında hata ayıklamadan önce telefondan yeni bir iMessage gönderin ve yeni bir `chat.db` satırı veya `imsg watch` olayı olduğunu doğrulayın. Bunu periyodik bir köprü yeniden başlatma döngüsü olarak çalıştırmayın; etkin çalışma sırasında tekrarlanan `imsg launch` ve Gateway yeniden başlatmaları teslimatları kesebilir ve devam eden kanal çalıştırmalarını yarıda bırakabilir.

  </Accordion>

  <Accordion title="Gateway macOS üzerinde çalışmıyor">
    Varsayılan `cliPath: "imsg"`, Messages oturumu açık olan Mac üzerinde çalışmalıdır. Linux veya Windows üzerinde, `channels.imessage.cliPath` değerini o Mac'e SSH yapan ve `imsg "$@"` çalıştıran bir sarmalayıcı betiğe ayarlayın.

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
    - bahsetme deseni yapılandırması (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Uzak ekler başarısız oluyor">
    Şunları kontrol edin:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway ana makinesinden SSH/SCP anahtar kimlik doğrulaması
    - ana makine anahtarının Gateway ana makinesinde `~/.ssh/known_hosts` içinde bulunması
    - Messages çalıştıran Mac üzerindeki uzak yol okunabilirliği

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

## Yapılandırma başvurusu işaretçileri

- [Yapılandırma başvurusu - iMessage](/tr/gateway/config-channels#imessage)
- [Gateway yapılandırması](/tr/gateway/configuration)
- [Eşleştirme](/tr/channels/pairing)

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [BlueBubbles kaldırma ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage) — duyuru ve geçiş özeti
- [BlueBubbles'tan geçiş](/tr/channels/imessage-from-bluebubbles) — yapılandırma çeviri tablosu ve adım adım geçiş
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sıkılaştırma
