---
read_when:
    - iMessage desteğini ayarlama
    - iMessage gönderme/alma hata ayıklaması
summary: imsg (stdio üzerinden JSON-RPC) aracılığıyla yerel iMessage desteği; yanıtlar, tapback'ler, efektler, ekler ve grup yönetimi için özel API eylemleriyle. Ana makine gereksinimleri uygun olduğunda yeni OpenClaw iMessage kurulumları için tercih edilir.
title: iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbce499e35c3dac12e6bb3f157d624a02a9bc8c26356f3decdfe62c85db6ee15
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
OpenClaw iMessage dağıtımları için, oturum açılmış bir macOS Messages ana bilgisayarında `imsg` kullanın. Gateway Linux veya Windows üzerinde çalışıyorsa, `channels.imessage.cliPath` değerini Mac üzerinde `imsg` çalıştıran bir SSH sarmalayıcısına yönlendirin.

**Gateway kesintisi sonrası yakalama isteğe bağlıdır.** Etkinleştirildiğinde (`channels.imessage.catchup.enabled: true`), gateway çevrimdışıyken (çökme, yeniden başlatma, Mac uyku modu) `chat.db` içine düşen gelen iletileri bir sonraki başlangıçta yeniden oynatır. Varsayılan olarak devre dışıdır — bkz. [Gateway kesintisinden sonra yakalama](#catching-up-after-gateway-downtime). [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649) kapatır.
</Note>

<Warning>
BlueBubbles desteği kaldırıldı. `channels.bluebubbles` yapılandırmalarını `channels.imessage` içine taşıyın; OpenClaw iMessage’ı yalnızca `imsg` üzerinden destekler. Kısa duyuru için [BlueBubbles kaldırma ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage) ile, tam geçiş tablosu için [BlueBubbles’tan geliyorsanız](/tr/channels/imessage-from-bluebubbles) ile başlayın.
</Warning>

Durum: yerel harici CLI entegrasyonu. Gateway `imsg rpc` başlatır ve stdio üzerinden JSON-RPC ile iletişim kurar (ayrı daemon/port yoktur). Gelişmiş eylemler `imsg launch` ve başarılı bir özel API yoklaması gerektirir.

<CardGroup cols={3}>
  <Card title="Özel API eylemleri" icon="wand-sparkles" href="#private-api-actions">
    Yanıtlar, tapback’ler, efektler, ekler ve grup yönetimi.
  </Card>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    iMessage DM’leri varsayılan olarak eşleştirme modunu kullanır.
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
      <Step title="imsg kurun ve doğrulayın">

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
    OpenClaw yalnızca stdio uyumlu bir `cliPath` gerektirir; bu nedenle `cliPath` değerini uzak bir Mac’e SSH yapan ve `imsg` çalıştıran bir sarmalayıcı betiğine yönlendirebilirsiniz.

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

    `remoteHost` ayarlanmazsa, OpenClaw bunu SSH sarmalayıcı betiğini ayrıştırarak otomatik algılamaya çalışır.
    `remoteHost`, `host` veya `user@host` olmalıdır (boşluk veya SSH seçenekleri yok).
    OpenClaw SCP için katı ana bilgisayar anahtarı denetimi kullanır; bu nedenle aktarma ana bilgisayarının anahtarı `~/.ssh/known_hosts` içinde zaten bulunmalıdır.
    Ek yolları izin verilen köklere (`attachmentRoots` / `remoteAttachmentRoots`) göre doğrulanır.

  </Tab>
</Tabs>

## Gereksinimler ve izinler (macOS)

- Messages, `imsg` çalıştıran Mac üzerinde oturum açmış olmalıdır.
- OpenClaw/`imsg` çalıştıran süreç bağlamı için Tam Disk Erişimi gereklidir (Messages veritabanı erişimi).
- Messages.app üzerinden ileti göndermek için Otomasyon izni gereklidir.
- Gelişmiş eylemler (tepki / düzenleme / göndermeyi geri alma / iş parçacıklı yanıt / efektler / grup işlemleri) için System Integrity Protection devre dışı bırakılmalıdır — aşağıdaki [imsg özel API’sini etkinleştirme](#enabling-the-imsg-private-api) bölümüne bakın. Temel metin ve medya gönderme/alma onsuz çalışır.

<Tip>
İzinler süreç bağlamı başına verilir. Gateway başsız çalışıyorsa (LaunchAgent/SSH), istemleri tetiklemek için aynı bağlamda tek seferlik etkileşimli bir komut çalıştırın:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## imsg özel API’sini etkinleştirme

`imsg` iki çalışma moduyla gelir:

- **Temel mod** (varsayılan, SIP değişikliği gerekmez): `send` üzerinden giden metin ve medya, gelen izleme/geçmiş, sohbet listesi. Yeni bir `brew install steipete/tap/imsg` ve yukarıdaki standart macOS izinleriyle kutudan çıktığı gibi elde ettiğiniz budur.
- **Özel API modu**: `imsg`, dahili `IMCore` işlevlerini çağırmak için `Messages.app` içine yardımcı bir dylib enjekte eder. `react`, `edit`, `unsend`, `reply` (iş parçacıklı), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` ile yazıyor göstergeleri ve okundu bilgilerini açan budur.

Bu kanal sayfasında belgelenen gelişmiş eylem yüzeyine ulaşmak için Özel API modu gerekir. `imsg` README gereksinim konusunda açıktır:

> `read`, `typing`, `launch`, köprü destekli zengin gönderim, ileti değiştirme ve sohbet yönetimi gibi gelişmiş özellikler isteğe bağlıdır. SIP’in devre dışı bırakılmasını ve `Messages.app` içine yardımcı bir dylib enjekte edilmesini gerektirir. SIP etkinken `imsg launch` enjeksiyonu reddeder.

Yardımcı enjeksiyon tekniği, Messages özel API’lerine ulaşmak için `imsg`’nin kendi dylib’ini kullanır. OpenClaw iMessage yolunda üçüncü taraf sunucu veya BlueBubbles runtime yoktur.

<Warning>
**SIP’i devre dışı bırakmak gerçek bir güvenlik ödünleşimidir.** SIP, macOS’in değiştirilmiş sistem kodu çalıştırmaya karşı temel korumalarından biridir; sistem genelinde kapatılması ek saldırı yüzeyi ve yan etkiler açar. Özellikle **Apple Silicon Mac’lerde SIP’i devre dışı bırakmak, iOS uygulamalarını Mac’inize yükleme ve çalıştırma yeteneğini de devre dışı bırakır**.

Bunu varsayılan değil, bilinçli bir operasyonel seçim olarak değerlendirin. Tehdit modeliniz SIP’in kapalı olmasını tolere edemiyorsa, paketli iMessage temel modla sınırlıdır — yalnızca metin ve medya gönderme/alma, tepki / düzenleme / göndermeyi geri alma / efekt / grup işlemleri yoktur.
</Warning>

### Kurulum

1. Messages.app çalıştıran Mac üzerinde **`imsg` kurun (veya yükseltin)**:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` çıktısı, başlamadan önce mevcut derlemenin neyi desteklediğini görebilmeniz için `bridge_version`, `rpc_methods` ve yöntem başına `selectors` bildirir.

2. **System Integrity Protection’ı devre dışı bırakın.** Bu, macOS sürümüne özgüdür çünkü alttaki Apple gereksinimi işletim sistemine ve donanıma bağlıdır:
   - **macOS 10.13–10.15 (Sierra–Catalina):** Terminal üzerinden Library Validation’ı devre dışı bırakın, Recovery Mode’a yeniden başlatın, `csrutil disable` çalıştırın, yeniden başlatın.
   - **macOS 11+ (Big Sur ve sonrası), Intel:** Recovery Mode (veya Internet Recovery), `csrutil disable`, yeniden başlatma.
   - **macOS 11+, Apple Silicon:** Recovery’ye girmek için güç düğmesi başlangıç dizisi; son macOS sürümlerinde Continue’a tıklarken **Left Shift** tuşunu basılı tutun, ardından `csrutil disable`. Sanal makine kurulumları ayrı bir akış izler — önce bir VM anlık görüntüsü alın.
   - **macOS 26 / Tahoe:** library-validation ilkeleri ve `imagent` özel yetki denetimleri daha da sıkılaştırıldı; `imsg` ayak uydurmak için güncellenmiş bir derlemeye ihtiyaç duyabilir. Bir macOS ana sürüm yükseltmesinden sonra `imsg launch` enjeksiyonu veya belirli `selectors` false döndürmeye başlarsa, SIP adımının başarılı olduğunu varsaymadan önce `imsg` sürüm notlarını kontrol edin.

   `imsg launch` çalıştırmadan önce SIP’i devre dışı bırakmak için Mac’inize yönelik Apple Recovery-mode akışını izleyin.

3. **Yardımcıyı enjekte edin.** SIP devre dışıyken ve Messages.app oturum açmışken:

   ```bash
   imsg launch
   ```

   SIP hâlâ etkinken `imsg launch` enjeksiyonu reddeder; bu nedenle bu, 2. adımın gerçekleştiğine dair bir onay olarak da iş görür.

4. **OpenClaw’dan köprüyü doğrulayın:**

   ```bash
   openclaw channels status --probe
   ```

   iMessage girdisi `works` bildirmeli ve `imsg status --json | jq '.selectors'`, `retractMessagePart: true` ile macOS derlemenizin sunduğu düzenleme / yazıyor / okundu selector’larını göstermelidir. `actions.ts` içindeki OpenClaw Plugin yöntem başına kapılama yalnızca alttaki selector’ı `true` olan eylemleri ilan eder; bu yüzden ajanın araç listesinde gördüğünüz eylem yüzeyi, köprünün bu ana bilgisayarda gerçekten yapabildiklerini yansıtır.

`openclaw channels status --probe` kanalı `works` olarak bildiriyor ancak belirli eylemler dağıtım zamanında "iMessage `<action>` requires the imsg private API bridge" hatası veriyorsa, `imsg launch` komutunu tekrar çalıştırın — yardımcı devreden çıkabilir (Messages.app yeniden başlatma, işletim sistemi güncellemesi vb.) ve önbelleğe alınmış `available: true` durumu, bir sonraki yoklama yenileyene kadar eylemleri ilan etmeyi sürdürür.

### SIP’i devre dışı bırakamadığınızda

SIP’in devre dışı olması tehdit modeliniz için kabul edilebilir değilse:

- `imsg` temel moda geri döner — yalnızca metin + medya + alma.
- OpenClaw Plugin hâlâ metin/medya gönderimini ve gelen izlemeyi ilan eder; yalnızca `react`, `edit`, `unsend`, `reply`, `sendWithEffect` ve grup işlemlerini eylem yüzeyinden gizler (yöntem başına capability kapısına göre).
- Birincil aygıtlarınızda SIP etkin kalırken iMessage iş yükü için SIP kapalı ayrı bir Apple Silicon olmayan Mac (veya adanmış bir bot Mac) çalıştırabilirsiniz. Aşağıdaki [Adanmış bot macOS kullanıcısı (ayrı iMessage kimliği)](#deployment-patterns) bölümüne bakın.

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.imessage.dmPolicy` doğrudan iletileri denetler:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    İzin listesi alanı: `channels.imessage.allowFrom`.

    İzin listesi girdileri tanıtıcılar, statik gönderen erişim grupları (`accessGroup:<name>`) veya sohbet hedefleri (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) olabilir.

  </Tab>

  <Tab title="Grup ilkesi + bahsetmeler">
    `channels.imessage.groupPolicy` grup işlemeyi denetler:

    - `allowlist` (yapılandırıldığında varsayılan)
    - `open`
    - `disabled`

    Grup gönderen izin listesi: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom` girdileri statik gönderen erişim gruplarına da başvurabilir (`accessGroup:<name>`).

    Runtime geri dönüşü: `groupAllowFrom` ayarlanmamışsa, iMessage grup gönderen denetimleri mevcut olduğunda `allowFrom` değerine geri döner.
    Runtime notu: `channels.imessage` tamamen eksikse, runtime `groupPolicy="allowlist"` değerine geri döner ve bir uyarı günlüğe yazar (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

    <Warning>
    Grup yönlendirmede arka arkaya çalışan **iki** izin listesi kapısı vardır ve ikisi de geçmelidir:

    1. **Gönderen / sohbet hedefi izin listesi** (`channels.imessage.groupAllowFrom`) — tanıtıcı, `chat_guid`, `chat_identifier` veya `chat_id`.
    2. **Grup kayıt defteri** (`channels.imessage.groups`) — `groupPolicy: "allowlist"` ile bu kapı ya bir `groups: { "*": { ... } }` joker girdisi (`allowAll = true` ayarlar) ya da `groups` altında açık bir `chat_id` girdisi gerektirir.

    2. kapının içinde hiçbir şey yoksa, her grup iletisi düşürülür. Plugin varsayılan günlük düzeyinde iki `warn` düzeyi sinyal yayar:

    - başlangıçta hesap başına bir kez: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - runtime sırasında `chat_id` başına bir kez: `imessage: dropping group message from chat_id=<id> ...`

    DM’ler farklı bir kod yolu kullandıkları için çalışmaya devam eder.

    `groupPolicy: "allowlist"` altında grupların akmaya devam etmesi için en düşük yapılandırma:

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

    Bu `warn` satırları Gateway günlüğünde görünüyorsa, 2. kapı düşürüyor — `groups` bloğunu ekleyin.
    </Warning>

    Gruplar için bahsetme denetiminden söz edin:

    - iMessage yerel bahsetme meta verisine sahip değildir
    - bahsetme algılama regex desenlerini kullanır (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - yapılandırılmış desen yoksa, bahsetme denetimi zorunlu kılınamaz

    Yetkili gönderenlerden gelen kontrol komutları gruplarda bahsetme denetimini atlayabilir.

    Grup başına `systemPrompt`:

    `channels.imessage.groups.*` altındaki her giriş isteğe bağlı bir `systemPrompt` dizesi kabul eder. Değer, o gruptaki bir iletiyi işleyen her turda ajanın sistem istemine enjekte edilir. Çözümleme, `channels.whatsapp.groups` tarafından kullanılan grup başına istem çözümlemesini yansıtır:

    1. **Gruba özel sistem istemi** (`groups["<chat_id>"].systemPrompt`): belirli grup girişi haritada mevcut olduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş bir dizeyse (`""`) joker bastırılır ve o gruba hiçbir sistem istemi uygulanmaz.
    2. **Grup joker sistem istemi** (`groups["*"].systemPrompt`): belirli grup girişi haritada tamamen yoksa veya mevcut olup `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

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

    Grup başına istemler yalnızca grup iletilerine uygulanır — bu kanaldaki doğrudan iletiler etkilenmez.

  </Tab>

  <Tab title="Oturumlar ve belirlenimci yanıtlar">
    - DM'ler doğrudan yönlendirme kullanır; gruplar grup yönlendirmesi kullanır.
    - Varsayılan `session.dmScope=main` ile iMessage DM'leri ajanın ana oturumunda birleşir.
    - Grup oturumları yalıtılmıştır (`agent:<agentId>:imessage:group:<chat_id>`).
    - Yanıtlar, kaynak kanal/hedef meta verileri kullanılarak iMessage'a geri yönlendirilir.

    Grup benzeri iş parçacığı davranışı:

    Bazı çok katılımcılı iMessage iş parçacıkları `is_group=false` ile gelebilir.
    Bu `chat_id`, `channels.imessage.groups` altında açıkça yapılandırılmışsa, OpenClaw bunu grup trafiği olarak ele alır (grup denetimi + grup oturumu yalıtımı).

  </Tab>
</Tabs>

## ACP konuşma bağlamaları

Eski iMessage sohbetleri ACP oturumlarına da bağlanabilir.

Hızlı operatör akışı:

- DM veya izin verilen grup sohbeti içinde `/acp spawn codex --bind here` çalıştırın.
- Aynı iMessage konuşmasındaki gelecekteki iletiler oluşturulan ACP oturumuna yönlendirilir.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Yapılandırılmış kalıcı bağlamalar, `type: "acp"` ve `match.channel: "imessage"` içeren üst düzey `bindings[]` girişleri aracılığıyla desteklenir.

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

## Dağıtım desenleri

<AccordionGroup>
  <Accordion title="Ayrılmış bot macOS kullanıcısı (ayrı iMessage kimliği)">
    Bot trafiğini kişisel Messages profilinizden yalıtmak için ayrılmış bir Apple ID ve macOS kullanıcısı kullanın.

    Tipik akış:

    1. Ayrılmış bir macOS kullanıcısı oluşturun/oturum açın.
    2. Bu kullanıcıda bot Apple ID ile Messages'a giriş yapın.
    3. Bu kullanıcıda `imsg` yükleyin.
    4. OpenClaw'ın `imsg` komutunu o kullanıcı bağlamında çalıştırabilmesi için SSH sarmalayıcısı oluşturun.
    5. `channels.imessage.accounts.<id>.cliPath` ve `.dbPath` değerlerini o kullanıcı profiline yönlendirin.

    İlk çalıştırma, o bot kullanıcı oturumunda GUI onayları gerektirebilir (Automation + Full Disk Access).

  </Accordion>

  <Accordion title="Tailscale üzerinden uzak Mac (örnek)">
    Yaygın topoloji:

    - Gateway Linux/VM üzerinde çalışır
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

    SSH ve SCP'nin etkileşimsiz olması için SSH anahtarları kullanın.
    Önce ana makine anahtarına güvenildiğinden emin olun (örneğin `ssh bot@mac-mini.tailnet-1234.ts.net`), böylece `known_hosts` doldurulur.

  </Accordion>

  <Accordion title="Çoklu hesap deseni">
    iMessage, `channels.imessage.accounts` altında hesap başına yapılandırmayı destekler.

    Her hesap `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, geçmiş ayarları ve ek kök izin listeleri gibi alanları geçersiz kılabilir.

  </Accordion>
</AccordionGroup>

## Medya, parçalara ayırma ve teslim hedefleri

<AccordionGroup>
  <Accordion title="Ekler ve medya">
    - gelen ek alımı **varsayılan olarak kapalıdır** — fotoğrafları, sesli notları, videoları ve diğer ekleri ajana iletmek için `channels.imessage.includeAttachments: true` ayarlayın. Devre dışı olduğunda, yalnızca ek içeren iMessage'lar ajana ulaşmadan önce düşürülür ve hiç `Inbound message` günlük satırı üretmeyebilir.
    - `remoteHost` ayarlandığında uzak ek yolları SCP ile getirilebilir
    - ek yolları izin verilen köklerle eşleşmelidir:
      - `channels.imessage.attachmentRoots` (yerel)
      - `channels.imessage.remoteAttachmentRoots` (uzak SCP modu)
      - varsayılan kök deseni: `/Users/*/Library/Messages/Attachments`
    - SCP sıkı ana makine anahtarı denetimi kullanır (`StrictHostKeyChecking=yes`)
    - giden medya boyutu `channels.imessage.mediaMaxMb` kullanır (varsayılan 16 MB)

  </Accordion>

  <Accordion title="Giden parçalara ayırma">
    - metin parça sınırı: `channels.imessage.textChunkLimit` (varsayılan 4000)
    - parça modu: `channels.imessage.chunkMode`
      - `length` (varsayılan)
      - `newline` (paragraf öncelikli bölme)

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

`imsg launch` çalışırken ve `openclaw channels status --probe` `privateApi.available: true` bildirirken, ileti aracı normal metin göndermelerine ek olarak iMessage yerel eylemlerini kullanabilir.

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
    - **react**: iMessage tapback'leri ekleyin/kaldırın (`messageId`, `emoji`, `remove`). Desteklenen tapback'ler love, like, dislike, laugh, emphasize ve question değerlerine eşlenir.
    - **reply**: Mevcut bir iletiye iş parçacıklı yanıt gönderin (`messageId`, `text` veya `message`, ayrıca `chatGuid`, `chatId`, `chatIdentifier` veya `to`).
    - **sendWithEffect**: iMessage efektiyle metin gönderin (`text` veya `message`, `effect` veya `effectId`).
    - **edit**: Desteklenen macOS/özel API sürümlerinde gönderilmiş bir iletiyi düzenleyin (`messageId`, `text` veya `newText`).
    - **unsend**: Desteklenen macOS/özel API sürümlerinde gönderilmiş bir iletiyi geri çekin (`messageId`).
    - **upload-file**: Medya/dosya gönderin (`buffer` base64 olarak veya doldurulmuş bir `media`/`path`/`filePath`, `filename`, isteğe bağlı `asVoice`). Eski takma ad: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Geçerli hedef bir grup konuşması olduğunda grup sohbetlerini yönetin.

  </Accordion>

  <Accordion title="İleti kimlikleri">
    Gelen iMessage bağlamı, kullanılabilir olduğunda hem kısa `MessageSid` değerlerini hem de tam ileti GUID'lerini içerir. Kısa kimlikler son bellek içi yanıt önbelleği kapsamındadır ve kullanılmadan önce geçerli sohbete göre denetlenir. Kısa bir kimliğin süresi dolmuşsa veya başka bir sohbete aitse, tam `MessageSidFull` ile yeniden deneyin.

  </Accordion>

  <Accordion title="Yetenek algılama">
    OpenClaw özel API eylemlerini yalnızca önbelleğe alınan yoklama durumu köprünün kullanılamadığını söylediğinde gizler. Durum bilinmiyorsa, eylemler görünür kalır ve gönderim yoklamaları tembel şekilde yapar; böylece ilk eylem ayrı bir manuel durum yenilemesi olmadan `imsg launch` sonrasında başarılı olabilir.

  </Accordion>

  <Accordion title="Okundu bilgileri ve yazıyor göstergesi">
    Özel API köprüsü açık olduğunda, kabul edilen gelen sohbetler gönderimden önce okundu olarak işaretlenir ve ajan üretim yaparken gönderene bir yazıyor balonu gösterilir. Okundu işaretlemeyi şu şekilde devre dışı bırakın:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Yöntem başına yetenek listesinden daha eski `imsg` derlemeleri yazıyor/okundu özelliklerini sessizce kapatır; OpenClaw, eksik okundu bilgisinin nedeninin anlaşılabilmesi için yeniden başlatma başına bir kez uyarı günlüğe kaydeder.

  </Accordion>
</AccordionGroup>

## Yapılandırma yazmaları

iMessage varsayılan olarak kanal tarafından başlatılan yapılandırma yazmalarına izin verir (`commands.config: true` olduğunda `/config set|unset` için).

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

## Bölünmüş gönderilen DM'leri birleştirme (tek kompozisyonda komut + URL)

Bir kullanıcı bir komutu ve URL'yi birlikte yazdığında — ör. `Dump https://example.com/article` — Apple'ın Messages uygulaması gönderimi **iki ayrı `chat.db` satırına** böler:

1. Bir metin iletisi (`"Dump"`).
2. OG önizleme görsellerini ek olarak içeren bir URL önizleme balonu (`"https://..."`).

İki satır çoğu kurulumda OpenClaw'a yaklaşık 0,8-2,0 sn arayla ulaşır. Birleştirme olmadan, ajan 1. turda yalnızca komutu alır, yanıtlar (genellikle "URL'yi bana gönderin") ve URL'yi yalnızca 2. turda görür — bu noktada komut bağlamı zaten kaybolmuştur. Bu, OpenClaw veya `imsg` tarafından eklenen bir şey değil, Apple'ın gönderim hattıdır.

`channels.imessage.coalesceSameSenderDms`, bir DM'i aynı gönderenin ardışık satırlarını tek bir ajan turunda birleştirmeye dahil eder. Çok kullanıcılı tur yapısının korunması için grup sohbetleri ileti başına gönderilmeye devam eder.

<Tabs>
  <Tab title="Ne zaman etkinleştirilmeli">
    Şu durumlarda etkinleştirin:

    - Tek iletide `command + payload` bekleyen Skills gönderiyorsanız (dump, paste, save, queue vb.).
    - Kullanıcılarınız komutların yanına URL'ler, görseller veya uzun içerikler yapıştırıyorsa.
    - Eklenen DM tur gecikmesini kabul edebiliyorsanız (aşağıya bakın).

    Şu durumlarda devre dışı bırakın:

    - Tek sözcüklü DM tetikleyicileri için minimum komut gecikmesine ihtiyacınız varsa.
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

    Bayrak açıkken ve açıkça belirtilmiş `messages.inbound.byChannel.imessage` yokken bekletme penceresi **2500 ms** değerine genişler (eski varsayılan 0 ms'dir — bekletme yok). Daha geniş pencere gerekir çünkü Apple'ın 0.8-2.0 s'lik bölünmüş gönderim temposu daha dar bir varsayılana sığmaz.

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
  <Tab title="Ödünleşimler">
    - **DM mesajları için ek gecikme.** Bayrak açıkken, her DM (tek başına kontrol komutları ve tek metinli takipler dahil) bir yük satırı gelebileceği ihtimaline karşı gönderilmeden önce bekletme penceresine kadar bekler. Grup sohbeti mesajları anında gönderilmeye devam eder.
    - **Birleştirilmiş çıktı sınırlıdır.** Birleştirilmiş metin açık bir `…[truncated]` işaretiyle 4000 karakterde sınırlandırılır; ekler 20 ile sınırlandırılır; kaynak girdileri 10 ile sınırlandırılır (bunun ötesinde ilk-artı-en-son tutulur). Aşağı akış telemetrisi için her kaynak GUID'si `coalescedMessageGuids` içinde izlenir.
    - **Yalnızca DM.** Birden fazla kişi yazarken botun yanıt verebilir kalması için grup sohbetleri mesaj başına gönderime düşer.
    - **Kanal başına, isteğe bağlı.** Diğer kanallar (Telegram, WhatsApp, Slack, …) etkilenmez. `channels.bluebubbles.coalesceSameSenderDms` ayarlayan eski BlueBubbles yapılandırmaları bu değeri `channels.imessage.coalesceSameSenderDms` içine taşımalıdır.

  </Tab>
</Tabs>

### Senaryolar ve ajanın gördükleri

| Kullanıcının oluşturduğu                                           | `chat.db` şunları üretir | Bayrak kapalı (varsayılan)             | Bayrak açık + 2500 ms pencere                                           |
| ------------------------------------------------------------------ | ------------------------ | -------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (tek gönderim)                          | Aralarında ~1 s olan 2 satır | İki ajan turu: yalnızca "Dump", sonra URL | Tek tur: birleştirilmiş metin `Dump https://example.com`                |
| `Save this 📎image.jpg caption` (ek + metin)                       | 2 satır                  | İki tur (birleştirmede ek atılır)      | Tek tur: metin + görüntü korunur                                        |
| `/status` (tek başına komut)                                       | 1 satır                  | Anında gönderim                        | **Pencere süresine kadar bekle, sonra gönder**                          |
| URL tek başına yapıştırıldı                                        | 1 satır                  | Anında gönderim                        | Anında gönderim (grupta yalnızca bir girdi)                             |
| Metin + URL, aralarında dakikalar olacak şekilde kasıtlı iki ayrı mesaj olarak gönderildi | Pencere dışında 2 satır | İki tur                                | İki tur (pencere aralarında sona erer)                                  |
| Hızlı yoğunluk (pencere içinde >10 küçük DM)                       | N satır                  | N tur                                  | Tek tur, sınırlı çıktı (ilk + en son, metin/ek sınırları uygulanır)     |
| Grup sohbetinde iki kişi yazıyor                                   | M gönderenden N satır    | M+ tur (gönderen grubu başına bir tane) | M+ tur — grup sohbetleri birleştirilmez                                 |

## Gateway kesintisinden sonra arayı kapatma

Gateway çevrimdışıyken (çökme, yeniden başlatma, Mac uyku modu, makinenin kapalı olması), Gateway yeniden açıldığında `imsg watch` mevcut `chat.db` durumundan devam eder — aralık sırasında gelen her şey varsayılan olarak hiç görülmez. Arayı kapatma, ajan gelen trafiği sessizce kaçırmasın diye bu mesajları bir sonraki başlangıçta yeniden işler.

Arayı kapatma **varsayılan olarak devre dışıdır**. Kanal başına etkinleştirin:

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

Her `monitorIMessageProvider` başlangıcı için bir geçiş yapılır ve sıra şöyledir: `imsg launch` hazır → `watch.subscribe` → `performIMessageCatchup` → canlı gönderim döngüsü. Arayı kapatma, `imsg watch` tarafından kullanılan aynı JSON-RPC istemcisi üzerinden `chats.list` + sohbet başına `messages.history` kullanır. Arayı kapatma geçişi sırasında gelen her şey normal şekilde canlı gönderimden akar; mevcut gelenleri tekilleştirme önbelleği, yeniden işlenen satırlarla olası çakışmaları emer.

Yeniden işlenen her satır canlı gönderim yolundan (`evaluateIMessageInbound` + `dispatchInboundMessage`) geçirilir; bu nedenle izin listeleri, grup ilkesi, bekletme mekanizması, yankı önbelleği ve okundu bilgileri yeniden işlenen ve canlı mesajlarda aynı şekilde davranır.

### İmleç ve yeniden deneme semantiği

Arayı kapatma, hesap başına imleci `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` konumunda tutar (OpenClaw durum dizini varsayılan olarak `~/.openclaw` olur, `OPENCLAW_STATE_DIR` ile geçersiz kılınabilir):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- İmleç her başarılı gönderimde ilerler ve bir satırın gönderimi hata fırlattığında tutulur — bir sonraki başlangıç aynı satırı tutulan imleçten yeniden dener.
- Aynı `guid` için art arda `maxFailureRetries` hata fırlatıldıktan sonra, arayı kapatma bir `warn` günlüğü yazar ve sonraki başlangıçların ilerleyebilmesi için imleci takılı kalan mesajın ötesine zorla ilerletir.
- Zaten vazgeçilmiş guid'ler sonraki çalıştırmalarda görüldükleri anda atlanır (gönderim denemesi yapılmaz) ve çalışma özetinde `skippedGivenUp` altında sayılır.

### Operatörün görebileceği sinyaller

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Bir `WARN ... capped to perRunLimit` satırı, tek bir başlangıcın tüm birikimi boşaltmadığı anlamına gelir. Aralıklarınız düzenli olarak varsayılan 50 satırlık geçişi aşıyorsa `perRunLimit` değerini yükseltin (en fazla 500).

### Ne zaman kapalı bırakmalı

- Gateway, gözetleyici otomatik yeniden başlatmasıyla sürekli çalışır ve aralıklar her zaman birkaç saniyeden kısadır — kapalı varsayılanı uygundur.
- DM hacmi düşüktür ve kaçırılan mesajlar ajan davranışını değiştirmez — `firstRunLookbackMinutes` ilk penceresi, ilk etkinleştirmede beklenmedik eski bağlamı gönderebilir.

Arayı kapatmayı açtığınızda, imleç yoksa ilk başlangıç tam `maxAgeMinutes` penceresine değil yalnızca `firstRunLookbackMinutes` değerine (varsayılan 30 dk) geriye bakar — bu, etkinleştirme öncesi uzun bir mesaj geçmişinin yeniden işlenmesini önler.

## Sorun giderme

<AccordionGroup>
  <Accordion title="imsg bulunamadı veya RPC desteklenmiyor">
    İkili dosyayı ve RPC desteğini doğrulayın:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Probe RPC'nin desteklenmediğini bildirirse `imsg` aracını güncelleyin. Özel API eylemleri kullanılamıyorsa oturum açmış macOS kullanıcısı oturumunda `imsg launch` çalıştırın ve yeniden probe yapın. Gateway macOS üzerinde çalışmıyorsa varsayılan yerel `imsg` yolu yerine yukarıdaki SSH üzerinden Uzak Mac kurulumunu kullanın.

  </Accordion>

  <Accordion title="Gateway macOS üzerinde çalışmıyor">
    Varsayılan `cliPath: "imsg"`, Messages'a giriş yapılmış Mac üzerinde çalışmalıdır. Linux veya Windows üzerinde, `channels.imessage.cliPath` değerini o Mac'e SSH ile bağlanıp `imsg "$@"` çalıştıran bir sarmalayıcı betiğe ayarlayın.

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
    - ana makine anahtarı Gateway ana makinesinde `~/.ssh/known_hosts` içinde mevcut
    - Messages çalıştıran Mac'te uzak yolun okunabilirliği

  </Accordion>

  <Accordion title="macOS izin istemleri kaçırıldı">
    Aynı kullanıcı/oturum bağlamındaki etkileşimli bir GUI terminalinde yeniden çalıştırın ve istemleri onaylayın:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    OpenClaw/`imsg` çalıştıran süreç bağlamı için Tam Disk Erişimi + Otomasyon izinlerinin verildiğini doğrulayın.

  </Accordion>
</AccordionGroup>

## Yapılandırma başvuru bağlantıları

- [Yapılandırma başvurusu - iMessage](/tr/gateway/config-channels#imessage)
- [Gateway yapılandırması](/tr/gateway/configuration)
- [Eşleştirme](/tr/channels/pairing)

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [BlueBubbles'ın kaldırılması ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage) — duyuru ve geçiş özeti
- [BlueBubbles'dan Geçiş](/tr/channels/imessage-from-bluebubbles) — yapılandırma çeviri tablosu ve adım adım geçiş
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme denetimi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sıkılaştırma
