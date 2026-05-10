---
read_when:
    - iMessage desteğini ayarlama
    - iMessage gönderme/alma işlemlerinde hata ayıklama
summary: imsg (stdio üzerinden JSON-RPC) aracılığıyla yerel iMessage desteği; yanıtlar, tepki işaretleri, efektler, ekler ve grup yönetimi için özel API eylemleriyle. Ana makine gereksinimleri uygun olduğunda yeni OpenClaw iMessage kurulumları için tercih edilir.
title: iMessage
x-i18n:
    generated_at: "2026-05-10T19:21:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 249d5faf9718e354caecaeb8ee22f66f9e24b50c6b091997d1c2286c44c1581d
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
OpenClaw iMessage dağıtımları için, oturum açılmış bir macOS Messages ana makinesinde `imsg` kullanın. Gateway'iniz Linux veya Windows üzerinde çalışıyorsa, `channels.imessage.cliPath` değerini Mac'te `imsg` çalıştıran bir SSH sarmalayıcısına yönlendirin.

**Gateway kesintisi sonrası yakalama isteğe bağlıdır.** Etkinleştirildiğinde (`channels.imessage.catchup.enabled: true`), Gateway çevrimdışıyken (çökme, yeniden başlatma, Mac uyku modu) `chat.db` içine gelen mesajları bir sonraki başlatmada yeniden oynatır. Varsayılan olarak devre dışıdır — bkz. [Gateway kesintisinden sonra yakalama](#catching-up-after-gateway-downtime). [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649) öğesini kapatır.
</Note>

<Warning>
BlueBubbles desteği kaldırıldı. `channels.bluebubbles` yapılandırmalarını `channels.imessage` öğesine taşıyın; OpenClaw iMessage'ı yalnızca `imsg` üzerinden destekler.
</Warning>

Durum: yerel harici CLI entegrasyonu. Gateway `imsg rpc` sürecini başlatır ve stdio üzerinde JSON-RPC ile iletişim kurar (ayrı daemon/port yoktur). Gelişmiş eylemler `imsg launch` ve başarılı bir özel API yoklaması gerektirir.

<CardGroup cols={3}>
  <Card title="Özel API eylemleri" icon="wand-sparkles" href="#private-api-actions">
    Yanıtlar, Tapback'ler, efektler, ekler ve grup yönetimi.
  </Card>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    iMessage DM'leri varsayılan olarak eşleştirme modunu kullanır.
  </Card>
  <Card title="Uzak Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gateway, Messages Mac üzerinde çalışmadığında bir SSH sarmalayıcısı kullanın.
  </Card>
  <Card title="Yapılandırma referansı" icon="settings" href="/tr/gateway/config-channels#imessage">
    Tam iMessage alan referansı.
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
    OpenClaw yalnızca stdio uyumlu bir `cliPath` gerektirir; bu nedenle `cliPath` değerini uzak bir Mac'e SSH ile bağlanıp `imsg` çalıştıran bir sarmalayıcı betiğine yönlendirebilirsiniz.

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

    `remoteHost` ayarlanmamışsa OpenClaw bunu SSH sarmalayıcı betiğini ayrıştırarak otomatik algılamaya çalışır.
    `remoteHost`, `host` veya `user@host` olmalıdır (boşluk veya SSH seçenekleri yok).
    OpenClaw, SCP için sıkı ana makine anahtarı denetimi kullanır; bu nedenle aktarma ana makinesi anahtarı `~/.ssh/known_hosts` içinde zaten bulunmalıdır.
    Ek yolları izin verilen köklere göre doğrulanır (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Gereksinimler ve izinler (macOS)

- Messages, `imsg` çalıştıran Mac'te oturum açmış olmalıdır.
- OpenClaw/`imsg` çalıştıran işlem bağlamı için Tam Disk Erişimi gerekir (Messages veritabanı erişimi).
- Messages.app üzerinden mesaj göndermek için Otomasyon izni gerekir.
- Gelişmiş eylemler (tepki / düzenleme / göndermeyi geri alma / yazışma dizili yanıt / efektler / grup işlemleri) için System Integrity Protection devre dışı bırakılmalıdır — aşağıdaki [imsg özel API'sini etkinleştirme](#enabling-the-imsg-private-api) bölümüne bakın. Temel metin ve medya gönderme/alma onsuz çalışır.

<Tip>
İzinler işlem bağlamı başına verilir. Gateway başsız (LaunchAgent/SSH) çalışıyorsa, istemleri tetiklemek için aynı bağlamda tek seferlik etkileşimli bir komut çalıştırın:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## imsg özel API'sini etkinleştirme

`imsg` iki çalışma moduyla gelir:

- **Temel mod** (varsayılan, SIP değişikliği gerekmez): `send` üzerinden giden metin ve medya, gelen izleme/geçmiş, sohbet listesi. Yeni bir `brew install steipete/tap/imsg` ve yukarıdaki standart macOS izinleriyle standart olarak elde edeceğiniz budur.
- **Özel API modu**: `imsg`, dahili `IMCore` işlevlerini çağırmak için `Messages.app` içine yardımcı bir dylib enjekte eder. Bu, `react`, `edit`, `unsend`, `reply` (yazışma dizili), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` ile yazıyor göstergelerini ve okundu bilgilerini açar.

Bu kanal sayfasında belgelenen gelişmiş eylem yüzeyine ulaşmak için Özel API modu gerekir. `imsg` README gereklilik konusunda nettir:

> `read`, `typing`, `launch`, köprü destekli zengin gönderim, mesaj değiştirme ve sohbet yönetimi gibi gelişmiş özellikler isteğe bağlıdır. SIP'nin devre dışı bırakılmasını ve `Messages.app` içine yardımcı bir dylib enjekte edilmesini gerektirirler. SIP etkin olduğunda `imsg launch` enjekte etmeyi reddeder.

Yardımcı enjekte etme tekniği, Messages özel API'lerine ulaşmak için `imsg`'in kendi dylib'ini kullanır. OpenClaw iMessage yolunda üçüncü taraf sunucu veya BlueBubbles çalışma zamanı yoktur.

<Warning>
**SIP'yi devre dışı bırakmak gerçek bir güvenlik ödünleşimidir.** SIP, değiştirilmiş sistem kodu çalıştırmaya karşı macOS'in temel korumalarından biridir; bunu sistem genelinde kapatmak ek saldırı yüzeyi ve yan etkiler açar. Özellikle, **Apple Silicon Mac'lerde SIP'yi devre dışı bırakmak, iOS uygulamalarını Mac'inize yükleyip çalıştırma yeteneğini de devre dışı bırakır**.

Bunu varsayılan değil, bilinçli bir operasyonel tercih olarak ele alın. Tehdit modeliniz SIP'nin kapalı olmasını tolere edemiyorsa, paketlenmiş iMessage temel modla sınırlıdır — yalnızca metin ve medya gönderme/alma; tepki / düzenleme / göndermeyi geri alma / efekt / grup işlemleri yoktur.
</Warning>

### Kurulum

1. Messages.app'i çalıştıran Mac'te **`imsg` yükleyin (veya yükseltin)**:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` çıktısı, başlamadan önce geçerli derlemenin neyi desteklediğini görebilmeniz için `bridge_version`, `rpc_methods` ve yöntem başına `selectors` bildirir.

2. **System Integrity Protection'ı devre dışı bırakın.** Bu, macOS sürümüne özeldir çünkü alttaki Apple gereksinimi işletim sistemine ve donanıma bağlıdır:
   - **macOS 10.13–10.15 (Sierra–Catalina):** Terminal üzerinden Library Validation'ı devre dışı bırakın, Kurtarma Modu'na yeniden başlatın, `csrutil disable` çalıştırın, yeniden başlatın.
   - **macOS 11+ (Big Sur ve sonrası), Intel:** Kurtarma Modu (veya İnternet Kurtarma), `csrutil disable`, yeniden başlatın.
   - **macOS 11+, Apple Silicon:** Kurtarma'ya girmek için güç düğmesiyle başlatma sırasını kullanın; güncel macOS sürümlerinde Devam'a tıklarken **Sol Shift** tuşunu basılı tutun, ardından `csrutil disable`. Sanal makine kurulumları ayrı bir akış izler — önce bir VM anlık görüntüsü alın.
   - **macOS 26 / Tahoe:** kitaplık doğrulama ilkeleri ve `imagent` özel yetki denetimleri daha da sıkılaştı; `imsg` güncel kalmak için güncellenmiş bir derlemeye ihtiyaç duyabilir. Bir macOS büyük sürüm yükseltmesinden sonra `imsg launch` enjeksiyonu veya belirli `selectors` false döndürmeye başlarsa, SIP adımının başarılı olduğunu varsaymadan önce `imsg`in sürüm notlarını kontrol edin.

   SIP'yi devre dışı bırakmak için `imsg launch` çalıştırmadan önce Mac'iniz için Apple'ın Kurtarma Modu akışını izleyin.

3. **Yardımcıyı enjekte edin.** SIP devre dışı ve Messages.app oturum açmış durumdayken:

   ```bash
   imsg launch
   ```

   SIP hâlâ etkinse `imsg launch` enjekte etmeyi reddeder; bu nedenle bu, 2. adımın gerçekleştiğini doğrulama işlevi de görür.

4. **Köprüyü OpenClaw üzerinden doğrulayın:**

   ```bash
   openclaw channels status --probe
   ```

   iMessage girdisi `works` bildirmeli ve `imsg status --json | jq '.selectors'` çıktısı `retractMessagePart: true` ile macOS derlemenizin sunduğu düzenleme / yazıyor / okundu seçicilerini göstermelidir. OpenClaw Plugin'inin `actions.ts` içindeki yöntem başına geçidi, yalnızca alttaki seçicisi `true` olan eylemleri duyurur; bu nedenle ajanın araç listesinde gördüğünüz eylem yüzeyi, köprünün bu ana makinede gerçekten yapabildiklerini yansıtır.

`openclaw channels status --probe` kanalı `works` olarak bildirir ancak belirli eylemler gönderim sırasında "iMessage `<action>` requires the imsg private API bridge" hatasını verirse `imsg launch` komutunu yeniden çalıştırın — yardımcı devreden çıkabilir (Messages.app yeniden başlatma, OS güncellemesi vb.) ve önbelleğe alınmış `available: true` durumu, bir sonraki yoklama yenileyene kadar eylemleri duyurmaya devam eder.

### SIP'yi devre dışı bırakamadığınızda

SIP'nin devre dışı olması tehdit modeliniz için kabul edilebilir değilse:

- `imsg` temel moda geri düşer — yalnızca metin + medya + alma.
- OpenClaw Plugin'i metin/medya gönderimini ve gelen izlemeyi yine de duyurur; yalnızca `react`, `edit`, `unsend`, `reply`, `sendWithEffect` ve grup işlemlerini eylem yüzeyinden gizler (yöntem başına yetenek geçidine göre).
- SIP birincil cihazlarınızda etkin kalırken, iMessage iş yükü için SIP kapalı ayrı bir Apple Silicon olmayan Mac (veya adanmış bot Mac) çalıştırabilirsiniz. Aşağıdaki [Adanmış bot macOS kullanıcısı (ayrı iMessage kimliği)](#deployment-patterns) bölümüne bakın.

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.imessage.dmPolicy` doğrudan mesajları kontrol eder:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` öğesinin `"*"` içermesini gerektirir)
    - `disabled`

    İzin listesi alanı: `channels.imessage.allowFrom`.

    İzin listesi girdileri tanıtıcılar, statik gönderici erişim grupları (`accessGroup:<name>`) veya sohbet hedefleri (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) olabilir.

  </Tab>

  <Tab title="Grup ilkesi + bahsetmeler">
    `channels.imessage.groupPolicy` grup işlemeyi kontrol eder:

    - `allowlist` (yapılandırıldığında varsayılan)
    - `open`
    - `disabled`

    Grup gönderici izin listesi: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom` girdileri statik gönderici erişim gruplarına da başvurabilir (`accessGroup:<name>`).

    Çalışma zamanı geri dönüşü: `groupAllowFrom` ayarlanmamışsa, iMessage grup gönderici denetimleri mevcut olduğunda `allowFrom` öğesine geri düşer.
    Çalışma zamanı notu: `channels.imessage` tamamen eksikse, çalışma zamanı `groupPolicy="allowlist"` değerine geri düşer ve bir uyarı günlüğe yazar (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

    <Warning>
    Grup yönlendirmesinde ardışık çalışan **iki** izin listesi kapısı vardır ve ikisinin de geçmesi gerekir:

    1. **Gönderici / sohbet hedefi izin listesi** (`channels.imessage.groupAllowFrom`) — tanıtıcı, `chat_guid`, `chat_identifier` veya `chat_id`.
    2. **Grup kayıt defteri** (`channels.imessage.groups`) — `groupPolicy: "allowlist"` ile bu kapı ya bir `groups: { "*": { ... } }` joker girdisi (`allowAll = true` ayarlar) ya da `groups` altında açık bir `chat_id` başına girdi gerektirir.

    2. kapı boşsa her grup mesajı düşürülür. Plugin varsayılan günlük seviyesinde iki `warn` seviyeli sinyal yayar:

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

    Bu `warn` satırları Gateway günlüğünde görünürse, 2. kapı mesajları düşürüyor demektir — `groups` bloğunu ekleyin.
    </Warning>

    Gruplar için bahsetme geçidi:

    - iMessage'da yerel bahsetme meta verisi yok
    - bahsetme algılama regex kalıplarını kullanır (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - yapılandırılmış kalıp yoksa bahsetme denetimi uygulanamaz

    Yetkili gönderenlerden gelen denetim komutları, gruplarda bahsetme denetimini atlayabilir.

    Grup başına `systemPrompt`:

    `channels.imessage.groups.*` altındaki her girdi isteğe bağlı bir `systemPrompt` dizesi kabul eder. Değer, o gruptaki bir mesajı işleyen her turda ajanın sistem istemine enjekte edilir. Çözümleme, `channels.whatsapp.groups` tarafından kullanılan grup başına istem çözümlemesini yansıtır:

    1. **Gruba özgü sistem istemi** (`groups["<chat_id>"].systemPrompt`): belirli grup girdisi eşlemde mevcut olduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş dizeyse (`""`) joker bastırılır ve o gruba hiçbir sistem istemi uygulanmaz.
    2. **Grup joker sistem istemi** (`groups["*"].systemPrompt`): belirli grup girdisi eşlemde tamamen yoksa veya mevcut olup `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

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

    Grup başına istemler yalnızca grup mesajlarına uygulanır; bu kanaldaki doğrudan mesajlar etkilenmez.

  </Tab>

  <Tab title="Oturumlar ve belirleyici yanıtlar">
    - DM'ler doğrudan yönlendirme kullanır; gruplar grup yönlendirmesi kullanır.
    - Varsayılan `session.dmScope=main` ile iMessage DM'leri ajan ana oturumunda birleşir.
    - Grup oturumları yalıtılmıştır (`agent:<agentId>:imessage:group:<chat_id>`).
    - Yanıtlar, kaynak kanal/hedef meta verileri kullanılarak tekrar iMessage'a yönlendirilir.

    Grup benzeri iş parçacığı davranışı:

    Bazı çok katılımcılı iMessage iş parçacıkları `is_group=false` ile gelebilir.
    Bu `chat_id`, `channels.imessage.groups` altında açıkça yapılandırılmışsa OpenClaw bunu grup trafiği olarak ele alır (grup denetimi + grup oturumu yalıtımı).

  </Tab>
</Tabs>

## ACP konuşma bağlamaları

Eski iMessage sohbetleri ACP oturumlarına da bağlanabilir.

Hızlı operatör akışı:

- DM'nin veya izin verilen grup sohbetinin içinde `/acp spawn codex --bind here` çalıştırın.
- Aynı iMessage konuşmasındaki sonraki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Yapılandırılmış kalıcı bağlamalar, `type: "acp"` ve `match.channel: "imessage"` içeren üst düzey `bindings[]` girdileri üzerinden desteklenir.

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

Paylaşılan ACP bağlama davranışı için [ACP Ajanları](/tr/tools/acp-agents) bölümüne bakın.

## Dağıtım kalıpları

<AccordionGroup>
  <Accordion title="Ayrılmış bot macOS kullanıcısı (ayrı iMessage kimliği)">
    Bot trafiğinin kişisel Messages profilinizden yalıtılması için ayrılmış bir Apple ID ve macOS kullanıcısı kullanın.

    Tipik akış:

    1. Ayrılmış bir macOS kullanıcısı oluşturun/oturum açın.
    2. Bu kullanıcıda bot Apple ID'siyle Messages'a giriş yapın.
    3. Bu kullanıcıda `imsg` yükleyin.
    4. OpenClaw'ın `imsg`'yi bu kullanıcı bağlamında çalıştırabilmesi için SSH sarmalayıcısı oluşturun.
    5. `channels.imessage.accounts.<id>.cliPath` ve `.dbPath` değerlerini bu kullanıcı profiline yönlendirin.

    İlk çalıştırma, bu bot kullanıcı oturumunda GUI onayları (Otomasyon + Tam Disk Erişimi) gerektirebilir.

  </Accordion>

  <Accordion title="Tailscale üzerinden uzak Mac (örnek)">
    Yaygın topoloji:

    - Gateway Linux/VM üzerinde çalışır
    - iMessage + `imsg` tailnet'inizdeki bir Mac üzerinde çalışır
    - `cliPath` sarmalayıcısı `imsg`'yi çalıştırmak için SSH kullanır
    - `remoteHost`, SCP ile ek getirmeyi etkinleştirir

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

    Hem SSH hem de SCP etkileşimsiz olsun diye SSH anahtarları kullanın.
    Önce ana makine anahtarının güvenilir olduğundan emin olun (örneğin `ssh bot@mac-mini.tailnet-1234.ts.net`), böylece `known_hosts` doldurulur.

  </Accordion>

  <Accordion title="Çok hesaplı kalıp">
    iMessage, `channels.imessage.accounts` altında hesap başına yapılandırmayı destekler.

    Her hesap `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, geçmiş ayarları ve ek kök izin listeleri gibi alanları geçersiz kılabilir.

  </Accordion>
</AccordionGroup>

## Medya, parçalama ve teslim hedefleri

<AccordionGroup>
  <Accordion title="Ekler ve medya">
    - gelen ek alımı **varsayılan olarak kapalıdır**; fotoğrafları, sesli notları, videoları ve diğer ekleri ajana iletmek için `channels.imessage.includeAttachments: true` ayarlayın. Devre dışıyken, yalnızca ek içeren iMessage'lar ajana ulaşmadan önce bırakılır ve hiç `Inbound message` günlük satırı üretmeyebilir.
    - `remoteHost` ayarlandığında uzak ek yolları SCP üzerinden getirilebilir
    - ek yolları izin verilen köklerle eşleşmelidir:
      - `channels.imessage.attachmentRoots` (yerel)
      - `channels.imessage.remoteAttachmentRoots` (uzak SCP modu)
      - varsayılan kök kalıbı: `/Users/*/Library/Messages/Attachments`
    - SCP katı ana makine anahtarı denetimi kullanır (`StrictHostKeyChecking=yes`)
    - giden medya boyutu `channels.imessage.mediaMaxMb` kullanır (varsayılan 16 MB)

  </Accordion>

  <Accordion title="Giden parçalama">
    - metin parçası sınırı: `channels.imessage.textChunkLimit` (varsayılan 4000)
    - parçalama modu: `channels.imessage.chunkMode`
      - `length` (varsayılan)
      - `newline` (önce paragraf bazlı bölme)

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

`imsg launch` çalışırken ve `openclaw channels status --probe` `privateApi.available: true` raporlarken, mesaj aracı normal metin gönderimlerine ek olarak iMessage'a özgü eylemleri kullanabilir.

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
    - **react**: iMessage tapback'leri ekleyin/kaldırın (`messageId`, `emoji`, `remove`). Desteklenen tapback'ler sevgi, beğeni, beğenmeme, gülme, vurgulama ve soru ile eşleşir.
    - **reply**: Mevcut bir mesaja iş parçacıklı yanıt gönderin (`messageId`, `text` veya `message`, ayrıca `chatGuid`, `chatId`, `chatIdentifier` veya `to`).
    - **sendWithEffect**: Bir iMessage efektiyle metin gönderin (`text` veya `message`, `effect` veya `effectId`).
    - **edit**: Desteklenen macOS/özel API sürümlerinde gönderilmiş bir mesajı düzenleyin (`messageId`, `text` veya `newText`).
    - **unsend**: Desteklenen macOS/özel API sürümlerinde gönderilmiş bir mesajı geri çekin (`messageId`).
    - **upload-file**: Medya/dosya gönderin (base64 olarak `buffer` veya doldurulmuş bir `media`/`path`/`filePath`, `filename`, isteğe bağlı `asVoice`). Eski diğer ad: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Geçerli hedef bir grup konuşması olduğunda grup sohbetlerini yönetin.

  </Accordion>

  <Accordion title="Mesaj ID'leri">
    Gelen iMessage bağlamı, kullanılabilir olduğunda hem kısa `MessageSid` değerlerini hem de tam mesaj GUID'lerini içerir. Kısa ID'ler, son kullanılan bellek içi yanıt önbelleğiyle sınırlıdır ve kullanılmadan önce geçerli sohbete göre denetlenir. Kısa ID'nin süresi dolduysa veya başka bir sohbete aitse tam `MessageSidFull` ile yeniden deneyin.

  </Accordion>

  <Accordion title="Yetenek algılama">
    OpenClaw, özel API eylemlerini yalnızca önbelleğe alınmış yoklama durumu köprünün kullanılamaz olduğunu söylediğinde gizler. Durum bilinmiyorsa eylemler görünür kalır ve ayrı bir manuel durum yenilemesi olmadan `imsg launch` sonrasında ilk eylemin başarılı olabilmesi için yoklamaları gerektiğinde çalıştırır.

  </Accordion>

  <Accordion title="Okundu bilgileri ve yazıyor göstergesi">
    Özel API köprüsü çalışır durumdayken, kabul edilen gelen sohbetler iletilmeden önce okundu olarak işaretlenir ve ajan üretirken gönderene bir yazıyor balonu gösterilir. Okundu olarak işaretlemeyi şu şekilde devre dışı bırakın:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Yöntem başına yetenek listesinden daha eski olan `imsg` derlemeleri, yazıyor/okundu özelliğini sessizce kapatır; OpenClaw, eksik okundu bilgisinin nedeni anlaşılabilsin diye her yeniden başlatmada bir defalık uyarı günlüğe yazar.

  </Accordion>
</AccordionGroup>

## Yapılandırma yazımları

iMessage, kanal tarafından başlatılan yapılandırma yazımlarına varsayılan olarak izin verir (`commands.config: true` olduğunda `/config set|unset` için).

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

## Bölünmüş gönderilen DM'leri birleştirme (tek oluşturma içinde komut + URL)

Bir kullanıcı bir komutu ve URL'yi birlikte yazdığında, örneğin `Dump https://example.com/article`, Apple'ın Messages uygulaması gönderimi **iki ayrı `chat.db` satırına** böler:

1. Bir metin mesajı (`"Dump"`).
2. OG önizleme görselleri ek olarak bulunan bir URL önizleme balonu (`"https://..."`).

İki satır çoğu kurulumda OpenClaw'a ~0.8-2.0 sn arayla ulaşır. Birleştirme olmadan ajan 1. turda yalnızca komutu alır, yanıt verir (çoğu zaman "bana URL'yi gönder" der) ve URL'yi ancak 2. turda görür; bu noktada komut bağlamı zaten kaybolmuştur. Bu, Apple'ın gönderim hattıdır; OpenClaw veya `imsg` tarafından getirilen bir şey değildir.

`channels.imessage.coalesceSameSenderDms`, bir DM'yi, aynı gönderenin ardışık satırlarını tek bir ajan turunda birleştirecek şekilde dahil eder. Grup sohbetleri, çok kullanıcılı tur yapısı korunsun diye mesaj başına iletilmeye devam eder.

<Tabs>
  <Tab title="Ne zaman etkinleştirilmeli">
    Şu durumlarda etkinleştirin:

    - Tek mesajda `command + payload` bekleyen Skills gönderiyorsanız (dump, paste, save, queue vb.).
    - Kullanıcılarınız komutların yanına URL'ler, görseller veya uzun içerikler yapıştırıyorsa.
    - Eklenen DM tur gecikmesini kabul edebiliyorsanız (aşağıya bakın).

    Şu durumlarda devre dışı bırakın:

    - Tek sözcüklü DM tetikleyicileri için en düşük komut gecikmesine ihtiyacınız varsa.
    - Tüm akışlarınız, yük takipleri olmayan tek seferlik komutlarsa.

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

    Bayrak açıkken ve açık bir `messages.inbound.byChannel.imessage` yokken debounce penceresi **2500 ms**'ye genişler (eski varsayılan 0 ms'dir — debounce yok). Daha geniş pencere gereklidir çünkü Apple'ın 0.8-2.0 s'lik bölünmüş gönderim temposu daha dar bir varsayılana sığmaz.

    Pencereyi kendiniz ayarlamak için:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Ödünler">
    - **DM iletileri için ek gecikme.** Bayrak açıkken, her DM (bağımsız kontrol komutları ve tek metinli takipler dahil) bir payload satırının gelmesi ihtimaline karşı gönderilmeden önce debounce penceresine kadar bekler. Grup sohbeti iletileri anında gönderilmeye devam eder.
    - **Birleştirilmiş çıktı sınırlıdır.** Birleştirilmiş metin açık bir `…[truncated]` işaretiyle 4000 karakterde sınırlandırılır; ekler 20 ile sınırlandırılır; kaynak girdileri 10 ile sınırlandırılır (bunun ötesinde ilk ve en yeni korunur). Her kaynak GUID'i aşağı akış telemetrisi için `coalescedMessageGuids` içinde izlenir.
    - **Yalnızca DM.** Grup sohbetleri ileti başına gönderime düşer, böylece birden çok kişi yazarken bot yanıt vermeyi sürdürür.
    - **İsteğe bağlı, kanal başına.** Diğer kanallar (Telegram, WhatsApp, Slack, …) etkilenmez. `channels.bluebubbles.coalesceSameSenderDms` ayarlayan eski BlueBubbles yapılandırmaları bu değeri `channels.imessage.coalesceSameSenderDms` içine taşımalıdır.

  </Tab>
</Tabs>

### Senaryolar ve aracının gördükleri

| Kullanıcının oluşturduğu                                           | `chat.db` üretir       | Bayrak kapalı (varsayılan)              | Bayrak açık + 2500 ms pencere                                           |
| ------------------------------------------------------------------ | ---------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (tek gönderim)                          | ~1 s arayla 2 satır    | İki aracı turu: yalnızca "Dump", sonra URL | Tek tur: birleştirilmiş metin `Dump https://example.com`                |
| `Save this 📎image.jpg caption` (ek + metin)                       | 2 satır                | İki tur (ek birleştirmede bırakılır)    | Tek tur: metin + görsel korunur                                         |
| `/status` (bağımsız komut)                                         | 1 satır                | Anında gönderim                         | **Pencereye kadar bekle, sonra gönder**                                 |
| URL tek başına yapıştırıldı                                        | 1 satır                | Anında gönderim                         | Anında gönderim (kovada yalnızca bir girdi)                             |
| Metin + URL dakikalar arayla iki bilinçli ayrı ileti olarak gönderildi | Pencere dışında 2 satır | İki tur                                 | İki tur (pencere aralarında sona erer)                                  |
| Hızlı taşma (pencere içinde >10 küçük DM)                          | N satır                | N tur                                   | Tek tur, sınırlı çıktı (ilk + en yeni, metin/ek sınırları uygulanır)    |
| Bir grup sohbetinde iki kişi yazıyor                               | M gönderenden N satır  | M+ tur (gönderen kovası başına bir)     | M+ tur — grup sohbetleri birleştirilmez                                 |

## Gateway kesintisinden sonra yetişme

Gateway çevrimdışıyken (çökme, yeniden başlatma, Mac uykusu, makinenin kapalı olması), Gateway yeniden açıldığında `imsg watch` mevcut `chat.db` durumundan devam eder — boşluk sırasında gelen hiçbir şey varsayılan olarak görülmez. Yetişme, aracı gelen trafiği sessizce kaçırmasın diye bu iletileri sonraki başlangıçta yeniden oynatır.

Yetişme **varsayılan olarak devre dışıdır**. Kanal başına etkinleştirin:

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### Nasıl çalışır

`monitorIMessageProvider` başlangıcı başına bir geçiş, `imsg launch` hazır → `watch.subscribe` → `performIMessageCatchup` → canlı gönderim döngüsü sırasıyla yürütülür. Yetişmenin kendisi, `imsg watch` tarafından kullanılan aynı JSON-RPC istemcisine karşı `chats.list` + sohbet başına `messages.history` kullanır. Yetişme geçişi sırasında gelen her şey normal şekilde canlı gönderimden akar; mevcut gelen-yinelenenleri-giderme önbelleği, yeniden oynatılan satırlarla her türlü çakışmayı emer.

Yeniden oynatılan her satır canlı gönderim yolundan (`evaluateIMessageInbound` + `dispatchInboundMessage`) geçirilir, bu nedenle izin listeleri, grup ilkesi, debouncer, echo önbelleği ve okundu bilgileri yeniden oynatılan ve canlı iletilerde aynı şekilde davranır.

### İmleç ve yeniden deneme semantiği

Yetişme, hesap başına bir imleci `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` konumunda tutar (OpenClaw durum dizini varsayılan olarak `~/.openclaw` olur, `OPENCLAW_STATE_DIR` ile geçersiz kılınabilir):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- İmleç her başarılı gönderimde ilerler ve bir satırın gönderimi hata fırlattığında tutulur — sonraki başlangıç aynı satırı tutulan imleçten yeniden dener.
- Aynı `guid` için art arda `maxFailureRetries` hata fırlatıldıktan sonra, yetişme bir `warn` günlüğü yazar ve sonraki başlangıçların ilerleyebilmesi için imleci takılmış iletinin ötesine zorla ilerletir.
- Zaten vazgeçilmiş guid'ler sonraki çalıştırmalarda görüldüğü anda atlanır (gönderim denemesi yok) ve çalışma özetinde `skippedGivenUp` altında sayılır.

### Operatöre görünür sinyaller

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Bir `WARN ... capped to perRunLimit` satırı, tek bir başlangıcın tüm birikmiş işleri boşaltmadığı anlamına gelir. Boşluklarınız düzenli olarak varsayılan 50 satırlık geçişi aşıyorsa `perRunLimit` değerini yükseltin (en fazla 500).

### Ne zaman kapalı bırakılmalı

- Gateway, watchdog otomatik yeniden başlatmasıyla sürekli çalışıyorsa ve boşluklar her zaman birkaç saniyeden kısaysa — kapalı varsayılanı uygundur.
- DM hacmi düşükse ve kaçırılan iletiler aracı davranışını değiştirmeyecekse — `firstRunLookbackMinutes` başlangıç penceresi ilk etkinleştirmede şaşırtıcı eski bağlamı gönderebilir.

Yetişmeyi açtığınızda, imleçsiz ilk başlangıç tam `maxAgeMinutes` penceresine değil yalnızca `firstRunLookbackMinutes` kadar geriye bakar (varsayılan 30 dk) — bu, etkinleştirme öncesi uzun bir geçmişin yeniden oynatılmasını önler.

## Sorun giderme

<AccordionGroup>
  <Accordion title="imsg bulunamadı veya RPC desteklenmiyor">
    İkiliyi ve RPC desteğini doğrulayın:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Probe RPC'nin desteklenmediğini bildirirse `imsg` aracını güncelleyin. Özel API eylemleri kullanılamıyorsa oturum açmış macOS kullanıcı oturumunda `imsg launch` çalıştırın ve yeniden probe edin. Gateway macOS üzerinde çalışmıyorsa varsayılan yerel `imsg` yolu yerine yukarıdaki SSH üzerinden Uzak Mac kurulumunu kullanın.

  </Accordion>

  <Accordion title="Gateway macOS üzerinde çalışmıyor">
    Varsayılan `cliPath: "imsg"`, Messages'a giriş yapılmış Mac üzerinde çalışmalıdır. Linux veya Windows üzerinde, `channels.imessage.cliPath` değerini o Mac'e SSH yapan ve `imsg "$@"` çalıştıran bir sarmalayıcı betiğe ayarlayın.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Sonra çalıştırın:

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

  <Accordion title="Grup iletileri yok sayılıyor">
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
    - ana makine anahtarının Gateway ana makinesindeki `~/.ssh/known_hosts` içinde mevcut olması
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
- [BlueBubbles'tan geçiş](/tr/channels/imessage-from-bluebubbles) — yapılandırma çeviri tablosu ve adım adım geçiş
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — iletiler için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
