---
read_when:
    - iMessage desteğini ayarlama
    - iMessage gönderme/alma hata ayıklaması
summary: imsg aracılığıyla yerel iMessage desteği (stdio üzerinden JSON-RPC); yanıtlar, tapback'ler, efektler, ekler ve grup yönetimi için özel API eylemleriyle. Ana makine gereksinimleri uygun olduğunda yeni OpenClaw iMessage kurulumları için tercih edilir.
title: iMessage
x-i18n:
    generated_at: "2026-05-12T00:56:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b0c284a5105bf9c2863f46731fb61628e264ce35c316014f25f15907142430
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
OpenClaw iMessage dağıtımları için, oturum açılmış bir macOS Messages konağında `imsg` kullanın. Gateway'iniz Linux veya Windows üzerinde çalışıyorsa `channels.imessage.cliPath` değerini Mac üzerinde `imsg` çalıştıran bir SSH sarmalayıcısına yönlendirin.

**Gateway kesinti telafisi isteğe bağlıdır.** Etkinleştirildiğinde (`channels.imessage.catchup.enabled: true`), gateway bir sonraki başlatmada çevrimdışıyken (çökme, yeniden başlatma, Mac uyku modu) `chat.db` içine düşen gelen iletileri yeniden oynatır. Varsayılan olarak devre dışıdır — bkz. [Gateway kesintisinden sonra telafi](#catching-up-after-gateway-downtime). [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649) kapatır.
</Note>

<Warning>
BlueBubbles desteği kaldırıldı. `channels.bluebubbles` yapılandırmalarını `channels.imessage` öğesine taşıyın; OpenClaw iMessage'ı yalnızca `imsg` üzerinden destekler. Kısa duyuru için [BlueBubbles kaldırılması ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage) ile veya tam geçiş tablosu için [BlueBubbles'tan geliyorsanız](/tr/channels/imessage-from-bluebubbles) ile başlayın.
</Warning>

Durum: yerel harici CLI entegrasyonu. Gateway, `imsg rpc` başlatır ve stdio üzerinde JSON-RPC ile iletişim kurar (ayrı daemon/port yok). Gelişmiş eylemler `imsg launch` ve başarılı bir özel API yoklaması gerektirir.

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    Yanıtlar, tapback'ler, efektler, ekler ve grup yönetimi.
  </Card>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    iMessage DM'leri varsayılan olarak eşleştirme modunu kullanır.
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
    OpenClaw yalnızca stdio uyumlu bir `cliPath` gerektirir; bu nedenle `cliPath` değerini uzak bir Mac'e SSH yapan ve `imsg` çalıştıran bir sarmalayıcı betiğine yönlendirebilirsiniz.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Ekler etkin olduğunda önerilen yapılandırma:

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

    `remoteHost` ayarlanmazsa OpenClaw bunu SSH sarmalayıcı betiğini ayrıştırarak otomatik algılamaya çalışır.
    `remoteHost`, `host` veya `user@host` olmalıdır (boşluk veya SSH seçenekleri yok).
    OpenClaw, SCP için katı konak anahtarı denetimi kullanır; bu nedenle aktarma konağı anahtarı `~/.ssh/known_hosts` içinde zaten mevcut olmalıdır.
    Ek yolları izin verilen köklere (`attachmentRoots` / `remoteAttachmentRoots`) göre doğrulanır.

  </Tab>
</Tabs>

## Gereksinimler ve izinler (macOS)

- Messages, `imsg` çalıştıran Mac'te oturum açmış olmalıdır.
- OpenClaw/`imsg` çalıştıran süreç bağlamı için Tam Disk Erişimi gerekir (Messages DB erişimi).
- Messages.app üzerinden ileti göndermek için Otomasyon izni gerekir.
- Gelişmiş eylemler için (tepki / düzenleme / göndermeyi geri alma / iş parçacıklı yanıt / efektler / grup işlemleri), System Integrity Protection devre dışı bırakılmalıdır — aşağıdaki [imsg özel API'sini etkinleştirme](#enabling-the-imsg-private-api) bölümüne bakın. Temel metin ve medya gönderme/alma onsuz çalışır.

<Tip>
İzinler süreç bağlamı başına verilir. Gateway başsız çalışıyorsa (LaunchAgent/SSH), istemleri tetiklemek için aynı bağlamda tek seferlik etkileşimli bir komut çalıştırın:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## imsg özel API'sini etkinleştirme

`imsg` iki çalışma moduyla gelir:

- **Temel mod** (varsayılan, SIP değişikliği gerekmez): `send` üzerinden giden metin ve medya, gelen izleme/geçmiş, sohbet listesi. Yeni bir `brew install steipete/tap/imsg` kurulumundan ve yukarıdaki standart macOS izinlerinden sonra kutudan çıktığı haliyle elde ettiğiniz budur.
- **Özel API modu**: `imsg`, dahili `IMCore` işlevlerini çağırmak için `Messages.app` içine bir yardımcı dylib enjekte eder. `react`, `edit`, `unsend`, `reply` (iş parçacıklı), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, ayrıca yazıyor göstergeleri ve okundu bilgilerini açan budur.

Bu kanal sayfasının belgelediği gelişmiş eylem yüzeyine ulaşmak için Özel API modu gerekir. `imsg` README gereksinim konusunda açıktır:

> `read`, `typing`, `launch`, köprü destekli zengin gönderim, ileti mutasyonu ve sohbet yönetimi gibi gelişmiş özellikler isteğe bağlıdır. SIP'in devre dışı bırakılmasını ve `Messages.app` içine bir yardımcı dylib enjekte edilmesini gerektirir. `imsg launch`, SIP etkinken enjekte etmeyi reddeder.

Yardımcı enjeksiyon tekniği, Messages özel API'lerine ulaşmak için `imsg`'in kendi dylib'ini kullanır. OpenClaw iMessage yolunda üçüncü taraf sunucu veya BlueBubbles çalışma zamanı yoktur.

<Warning>
**SIP'i devre dışı bırakmak gerçek bir güvenlik ödünleşimidir.** SIP, macOS'in değiştirilmiş sistem kodunu çalıştırmaya karşı temel korumalarından biridir; sistem genelinde kapatılması ek saldırı yüzeyi ve yan etkiler açar. Özellikle, **Apple Silicon Mac'lerde SIP'i devre dışı bırakmak, Mac'inize iOS uygulamaları yükleme ve çalıştırma yeteneğini de devre dışı bırakır**.

Bunu varsayılan değil, bilinçli bir operasyonel seçim olarak ele alın. Tehdit modeliniz SIP'in kapalı olmasını kaldıramıyorsa paketlenen iMessage temel modla sınırlıdır — yalnızca metin ve medya gönderme/alma, tepki / düzenleme / göndermeyi geri alma / efektler / grup işlemleri yok.
</Warning>

### Kurulum

1. Messages.app çalıştıran Mac'te **`imsg` kurun (veya yükseltin)**:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` çıktısı `bridge_version`, `rpc_methods` ve yöntem başına `selectors` bildirir; böylece başlamadan önce mevcut derlemenin neyi desteklediğini görebilirsiniz.

2. **System Integrity Protection'ı devre dışı bırakın.** Bu macOS sürümüne özgüdür çünkü temeldeki Apple gereksinimi işletim sistemine ve donanıma bağlıdır:
   - **macOS 10.13–10.15 (Sierra–Catalina):** Terminal üzerinden Library Validation'ı devre dışı bırakın, Recovery Mode'a yeniden başlatın, `csrutil disable` çalıştırın, yeniden başlatın.
   - **macOS 11+ (Big Sur ve sonrası), Intel:** Recovery Mode (veya Internet Recovery), `csrutil disable`, yeniden başlatın.
   - **macOS 11+, Apple Silicon:** Recovery'ye girmek için güç düğmesi başlatma dizisi; güncel macOS sürümlerinde Continue'a tıklarken **Sol Shift** tuşunu basılı tutun, sonra `csrutil disable`. Sanal makine kurulumları ayrı bir akış izler — önce bir VM anlık görüntüsü alın.
   - **macOS 26 / Tahoe:** library-validation ilkeleri ve `imagent` özel yetki denetimleri daha da sıkılaştı; `imsg` yetişmek için güncellenmiş bir derlemeye ihtiyaç duyabilir. Büyük bir macOS yükseltmesinden sonra `imsg launch` enjeksiyonu veya belirli `selectors` false döndürmeye başlarsa SIP adımının başarılı olduğunu varsaymadan önce `imsg` sürüm notlarını kontrol edin.

   `imsg launch` çalıştırmadan önce SIP'i devre dışı bırakmak için Mac'inize yönelik Apple Recovery-mode akışını izleyin.

3. **Yardımcıyı enjekte edin.** SIP devre dışıyken ve Messages.app oturum açmışken:

   ```bash
   imsg launch
   ```

   `imsg launch`, SIP hâlâ etkinken enjekte etmeyi reddeder; bu nedenle bu, 2. adımın tutunduğunu doğrulama işlevi de görür.

4. **Köprüyü OpenClaw'dan doğrulayın:**

   ```bash
   openclaw channels status --probe
   ```

   iMessage girdisi `works` bildirmeli ve `imsg status --json | jq '.selectors'`, `retractMessagePart: true` ile birlikte macOS derlemenizin sunduğu düzenleme / yazıyor / okundu selector'larını göstermelidir. OpenClaw Plugin içinde `actions.ts` dosyasındaki yöntem başına geçitleme yalnızca altında yatan selector'ı `true` olan eylemleri duyurur; bu nedenle ajanın araç listesinde gördüğünüz eylem yüzeyi köprünün bu konakta gerçekten yapabildiklerini yansıtır.

`openclaw channels status --probe` kanalı `works` olarak bildiriyor ama belirli eylemler gönderim sırasında "iMessage `<action>` requires the imsg private API bridge" hatası veriyorsa `imsg launch` komutunu yeniden çalıştırın — yardımcı devreden çıkabilir (Messages.app yeniden başlatma, OS güncellemesi vb.) ve önbelleğe alınmış `available: true` durumu, sonraki yoklama yenileyene kadar eylemleri duyurmaya devam eder.

### SIP'i devre dışı bırakamadığınızda

SIP'in devre dışı bırakılması tehdit modeliniz için kabul edilebilir değilse:

- `imsg` temel moda geri döner — yalnızca metin + medya + alma.
- OpenClaw Plugin metin/medya gönderimini ve gelen izlemeyi hâlâ duyurur; yalnızca `react`, `edit`, `unsend`, `reply`, `sendWithEffect` ve grup işlemlerini eylem yüzeyinden gizler (yöntem başına yetenek geçidine göre).
- Birincil cihazlarınızda SIP'i etkin tutarken iMessage iş yükü için SIP kapalı ayrı bir Apple Silicon olmayan Mac (veya ayrılmış bot Mac) çalıştırabilirsiniz. Aşağıdaki [Ayrılmış bot macOS kullanıcısı (ayrı iMessage kimliği)](#deployment-patterns) bölümüne bakın.

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` doğrudan iletileri denetler:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` öğesinin `"*"` içermesini gerektirir)
    - `disabled`

    İzin listesi alanı: `channels.imessage.allowFrom`.

    İzin listesi girdileri handle'lar, statik gönderici erişim grupları (`accessGroup:<name>`) veya sohbet hedefleri (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) olabilir.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` grup işlemeyi denetler:

    - `allowlist` (yapılandırıldığında varsayılan)
    - `open`
    - `disabled`

    Grup gönderici izin listesi: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom` girdileri statik gönderici erişim gruplarına da başvurabilir (`accessGroup:<name>`).

    Çalışma zamanı geri dönüşü: `groupAllowFrom` ayarlanmamışsa iMessage grup gönderici denetimleri, kullanılabiliyorsa `allowFrom` öğesine geri döner.
    Çalışma zamanı notu: `channels.imessage` tamamen eksikse çalışma zamanı `groupPolicy="allowlist"` değerine geri döner ve bir uyarı kaydeder (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

    <Warning>
    Grup yönlendirmesinde arka arkaya çalışan **iki** izin listesi geçidi vardır ve ikisi de geçmelidir:

    1. **Gönderici / sohbet hedefi izin listesi** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` veya `chat_id`.
    2. **Grup kayıt defteri** (`channels.imessage.groups`) — `groupPolicy: "allowlist"` ile bu geçit ya `groups: { "*": { ... } }` joker girdisi (`allowAll = true` ayarlar) ya da `groups` altında açık bir `chat_id` girdisi gerektirir.

    2. geçitte hiçbir şey yoksa her grup iletisi düşürülür. Plugin, varsayılan günlük düzeyinde iki `warn` düzeyinde sinyal yayar:

    - başlangıçta hesap başına tek seferlik: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - çalışma zamanında `chat_id` başına tek seferlik: `imessage: dropping group message from chat_id=<id> ...`

    DM'ler farklı bir kod yolunu kullandıkları için çalışmaya devam eder.

    `groupPolicy: "allowlist"` altında grupların akmasını sağlamak için minimum yapılandırma:

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

    Bu `warn` satırları Gateway günlüğünde görünüyorsa gate 2 düşüyordur; `groups` bloğunu ekleyin.
    </Warning>

    Gruplar için bahsetme geçitlemesinden söz edin:

    - iMessage yerel bahsetme meta verisine sahip değildir
    - bahsetme algılama regex desenlerini kullanır (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - yapılandırılmış desen yoksa bahsetme geçitlemesi uygulanamaz

    Yetkili gönderenlerden gelen denetim komutları, gruplarda bahsetme geçitlemesini atlayabilir.

    Grup başına `systemPrompt`:

    `channels.imessage.groups.*` altındaki her giriş isteğe bağlı bir `systemPrompt` dizesi kabul eder. Değer, o gruptaki bir iletiyi işleyen her turda ajanın sistem istemine enjekte edilir. Çözümleme, `channels.whatsapp.groups` tarafından kullanılan grup başına istem çözümlemesini yansıtır:

    1. **Gruba özgü sistem istemi** (`groups["<chat_id>"].systemPrompt`): belirli grup girişi haritada mevcut olduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş bir dizeyse (`""`) joker bastırılır ve o gruba hiçbir sistem istemi uygulanmaz.
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

    Grup başına istemler yalnızca grup iletilerine uygulanır; bu kanaldaki doğrudan iletiler etkilenmez.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DM'ler doğrudan yönlendirme kullanır; gruplar grup yönlendirmesi kullanır.
    - Varsayılan `session.dmScope=main` ile iMessage DM'leri ajanın ana oturumunda birleşir.
    - Grup oturumları yalıtılmıştır (`agent:<agentId>:imessage:group:<chat_id>`).
    - Yanıtlar, kaynak kanal/hedef meta verisi kullanılarak iMessage'a geri yönlendirilir.

    Grup benzeri iş parçacığı davranışı:

    Bazı çok katılımcılı iMessage iş parçacıkları `is_group=false` ile gelebilir.
    Bu `chat_id`, `channels.imessage.groups` altında açıkça yapılandırılmışsa OpenClaw bunu grup trafiği olarak ele alır (grup geçitlemesi + grup oturumu yalıtımı).

  </Tab>
</Tabs>

## ACP konuşma bağlamaları

Eski iMessage sohbetleri ACP oturumlarına da bağlanabilir.

Hızlı operatör akışı:

- DM veya izin verilen grup sohbeti içinde `/acp spawn codex --bind here` komutunu çalıştırın.
- Aynı iMessage konuşmasındaki gelecekteki iletiler oluşturulan ACP oturumuna yönlendirilir.
- `/new` ve `/reset` aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close` ACP oturumunu kapatır ve bağlamayı kaldırır.

Yapılandırılmış kalıcı bağlamalar, `type: "acp"` ve `match.channel: "imessage"` içeren üst düzey `bindings[]` girişleriyle desteklenir.

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
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Bot trafiğinin kişisel Messages profilinizden yalıtılması için özel bir Apple ID ve macOS kullanıcısı kullanın.

    Tipik akış:

    1. Özel bir macOS kullanıcısı oluşturun/oturum açın.
    2. Bu kullanıcıda bot Apple ID'siyle Messages'a giriş yapın.
    3. Bu kullanıcıda `imsg` yükleyin.
    4. OpenClaw'ın `imsg` komutunu bu kullanıcı bağlamında çalıştırabilmesi için SSH sarmalayıcısı oluşturun.
    5. `channels.imessage.accounts.<id>.cliPath` ve `.dbPath` değerlerini bu kullanıcı profiline yönlendirin.

    İlk çalıştırma, bot kullanıcı oturumunda GUI onayları (Automation + Full Disk Access) gerektirebilir.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Yaygın topoloji:

    - Gateway Linux/VM üzerinde çalışır
    - iMessage + `imsg` tailnet'inizdeki bir Mac üzerinde çalışır
    - `cliPath` sarmalayıcısı `imsg` çalıştırmak için SSH kullanır
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

    Hem SSH hem de SCP'nin etkileşimsiz olması için SSH anahtarları kullanın.
    `known_hosts` doldurulması için önce ana bilgisayar anahtarının güvenilir olduğundan emin olun (örneğin `ssh bot@mac-mini.tailnet-1234.ts.net`).

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage, `channels.imessage.accounts` altında hesap başına yapılandırmayı destekler.

    Her hesap `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, geçmiş ayarları ve ek kök izin listeleri gibi alanları geçersiz kılabilir.

  </Accordion>
</AccordionGroup>

## Medya, parçalama ve teslim hedefleri

<AccordionGroup>
  <Accordion title="Attachments and media">
    - gelen ek alımı **varsayılan olarak kapalıdır**; fotoğrafları, sesli notları, videoları ve diğer ekleri ajana iletmek için `channels.imessage.includeAttachments: true` ayarlayın. Devre dışıyken, yalnızca ek içeren iMessage'lar ajana ulaşmadan önce düşürülür ve hiç `Inbound message` günlük satırı üretmeyebilir.
    - `remoteHost` ayarlandığında uzak ek yolları SCP üzerinden getirilebilir
    - ek yolları izin verilen köklerle eşleşmelidir:
      - `channels.imessage.attachmentRoots` (yerel)
      - `channels.imessage.remoteAttachmentRoots` (uzak SCP modu)
      - varsayılan kök deseni: `/Users/*/Library/Messages/Attachments`
    - SCP katı ana bilgisayar anahtarı denetimi kullanır (`StrictHostKeyChecking=yes`)
    - giden medya boyutu `channels.imessage.mediaMaxMb` kullanır (varsayılan 16 MB)

  </Accordion>

  <Accordion title="Outbound chunking">
    - metin parça sınırı: `channels.imessage.textChunkLimit` (varsayılan 4000)
    - parça modu: `channels.imessage.chunkMode`
      - `length` (varsayılan)
      - `newline` (önce paragraf bölme)

  </Accordion>

  <Accordion title="Addressing formats">
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

`imsg launch` çalışıyorken ve `openclaw channels status --probe` `privateApi.available: true` bildiriyorken, ileti aracı normal metin göndermelerine ek olarak iMessage yerel eylemlerini kullanabilir.

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
  <Accordion title="Available actions">
    - **react**: iMessage tapback'leri ekle/kaldır (`messageId`, `emoji`, `remove`). Desteklenen tapback'ler sevgi, beğeni, beğenmeme, gülme, vurgulama ve soru ile eşleşir.
    - **reply**: Mevcut bir iletiye iş parçacıklı yanıt gönder (`messageId`, `text` veya `message`, ayrıca `chatGuid`, `chatId`, `chatIdentifier` veya `to`).
    - **sendWithEffect**: Bir iMessage efektiyle metin gönder (`text` veya `message`, `effect` veya `effectId`).
    - **edit**: Desteklenen macOS/özel API sürümlerinde gönderilmiş bir iletiyi düzenle (`messageId`, `text` veya `newText`).
    - **unsend**: Desteklenen macOS/özel API sürümlerinde gönderilmiş bir iletiyi geri çek (`messageId`).
    - **upload-file**: Medya/dosya gönder (`buffer` base64 olarak veya doldurulmuş `media`/`path`/`filePath`, `filename`, isteğe bağlı `asVoice`). Eski takma ad: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Geçerli hedef bir grup konuşması olduğunda grup sohbetlerini yönet.

  </Accordion>

  <Accordion title="Message IDs">
    Gelen iMessage bağlamı, kullanılabilir olduğunda hem kısa `MessageSid` değerlerini hem de tam ileti GUID'lerini içerir. Kısa ID'ler son bellek içi yanıt önbelleğiyle sınırlıdır ve kullanımdan önce geçerli sohbete göre denetlenir. Kısa bir ID'nin süresi dolmuşsa veya başka bir sohbete aitse tam `MessageSidFull` ile yeniden deneyin.

  </Accordion>

  <Accordion title="Capability detection">
    OpenClaw, özel API eylemlerini yalnızca önbelleğe alınmış probe durumu köprünün kullanılamadığını söylediğinde gizler. Durum bilinmiyorsa eylemler görünür kalır ve gönderim probe'ları tembel olarak çalıştırır; böylece ilk eylem, ayrı bir manuel durum yenilemesi olmadan `imsg launch` sonrasında başarılı olabilir.

  </Accordion>

  <Accordion title="Read receipts and typing">
    Özel API köprüsü çalışıyorken kabul edilen gelen sohbetler gönderimden önce okundu olarak işaretlenir ve ajan üretim yaparken gönderene yazıyor balonu gösterilir. Okundu işaretlemeyi şununla devre dışı bırakın:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Yöntem başına yetenek listesinden önceki eski `imsg` derlemeleri yazma/okundu bilgisini sessizce geçitleyecektir; OpenClaw, eksik bildirimin ilişkilendirilebilmesi için yeniden başlatma başına bir kez uyarı günlüğe yazar.

  </Accordion>

  <Accordion title="Inbound tapbacks">
    OpenClaw iMessage tapback'lerine abone olur ve kabul edilen tepkileri normal ileti metni yerine sistem olayları olarak yönlendirir; böylece bir kullanıcı tapback'i sıradan bir yanıt döngüsünü tetiklemez.

    Bildirim modu `channels.imessage.reactionNotifications` tarafından denetlenir:

    - `"own"` (varsayılan): yalnızca kullanıcılar bot tarafından yazılmış iletilere tepki verdiğinde bildir.
    - `"all"`: yetkili gönderenlerden gelen tüm tapback'ler için bildir.
    - `"off"`: gelen tapback'leri yok say.

    Hesap başına geçersiz kılmalar `channels.imessage.accounts.<id>.reactionNotifications` kullanır.

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

## Bölünmüş gönderilen DM'leri birleştirme (tek kompozisyonda komut + URL)

Bir kullanıcı bir komutu ve URL'yi birlikte yazdığında, örn. `Dump https://example.com/article`, Apple'ın Messages uygulaması gönderimi **iki ayrı `chat.db` satırına** böler:

1. Bir metin iletisi (`"Dump"`).
2. OG önizleme görüntülerini ek olarak içeren bir URL önizleme balonu (`"https://..."`).

İki satır çoğu kurulumda OpenClaw'a yaklaşık 0,8-2,0 sn arayla ulaşır. Birleştirme olmadan ajan 1. turda yalnızca komutu alır, yanıt verir (çoğu zaman "URL'yi bana gönder") ve URL'yi ancak 2. turda görür; bu noktada komut bağlamı zaten kaybolmuştur. Bu Apple'ın gönderim hattıdır; OpenClaw veya `imsg` tarafından eklenen bir şey değildir.

`channels.imessage.coalesceSameSenderDms`, bir DM'yi ardışık aynı gönderen satırlarını tek bir ajan turunda birleştirmeye dahil eder. Grup sohbetleri çok kullanıcılı tur yapısı korunsun diye mesaj başına dağıtmaya devam eder.

<Tabs>
  <Tab title="Ne zaman etkinleştirilmeli">
    Şu durumlarda etkinleştirin:

    - Tek mesajda `command + payload` bekleyen beceriler gönderiyorsanız (dump, paste, save, queue vb.).
    - Kullanıcılarınız komutlarla birlikte URL, görsel veya uzun içerik yapıştırıyorsa.
    - Eklenen DM tur gecikmesini kabul edebiliyorsanız (aşağıya bakın).

    Şu durumlarda devre dışı bırakın:

    - Tek sözcüklü DM tetikleyicileri için en düşük komut gecikmesine ihtiyacınız varsa.
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

    Bayrak açıkken ve açık bir `messages.inbound.byChannel.imessage` yokken, debounce penceresi **2500 ms**'ye genişler (eski varsayılan 0 ms'dir — debounce yok). Daha geniş pencere gereklidir çünkü Apple'ın 0.8-2.0 sn'lik bölünmüş gönderim temposu daha dar bir varsayılana sığmaz.

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
    - **DM mesajları için ek gecikme.** Bayrak açıkken her DM (bağımsız denetim komutları ve tek metinli takip mesajları dahil), bir yük satırı geliyor olabilir diye dağıtılmadan önce debounce penceresi kadar bekler. Grup sohbeti mesajları anında dağıtımı korur.
    - **Birleştirilmiş çıktı sınırlıdır.** Birleştirilmiş metin, açık bir `…[truncated]` işaretiyle 4000 karakterde sınırlanır; ekler 20 ile sınırlanır; kaynak girdileri 10 ile sınırlanır (bunun ötesinde ilk artı en son korunur). Aşağı akış telemetrisi için her kaynak GUID'si `coalescedMessageGuids` içinde izlenir.
    - **Yalnızca DM.** Grup sohbetleri mesaj başına dağıtıma düşer; böylece birden fazla kişi yazarken bot yanıt vermeye devam eder.
    - **Kanal başına opt-in.** Diğer kanallar (Telegram, WhatsApp, Slack, …) etkilenmez. `channels.bluebubbles.coalesceSameSenderDms` ayarlayan eski BlueBubbles yapılandırmaları bu değeri `channels.imessage.coalesceSameSenderDms` değerine taşımalıdır.

  </Tab>
</Tabs>

### Senaryolar ve ajanın gördükleri

| Kullanıcının oluşturduğu                                           | `chat.db` üretir      | Bayrak kapalı (varsayılan)              | Bayrak açık + 2500 ms pencere                                           |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (tek gönderim)                          | ~1 sn arayla 2 satır  | İki ajan turu: yalnızca "Dump", sonra URL | Tek tur: birleştirilmiş metin `Dump https://example.com`                |
| `Save this 📎image.jpg caption` (ek + metin)                       | 2 satır               | İki tur (ek birleştirmede düşer)        | Tek tur: metin + görsel korunur                                         |
| `/status` (bağımsız komut)                                         | 1 satır               | Anında dağıtım                          | **Pencere kadar bekle, sonra dağıt**                                    |
| Tek başına yapıştırılan URL                                        | 1 satır               | Anında dağıtım                          | Anında dağıtım (kovada yalnızca bir girdi)                              |
| Metin + URL, dakikalar arayla kasıtlı iki ayrı mesaj olarak gönderildi | Pencere dışında 2 satır | İki tur                               | İki tur (pencere aralarında sona erer)                                  |
| Hızlı akış (pencere içinde >10 küçük DM)                           | N satır               | N tur                                   | Tek tur, sınırlı çıktı (ilk + en son, metin/ek sınırları uygulanır)     |
| Bir grup sohbetinde iki kişi yazıyor                               | M gönderenden N satır | M+ tur (gönderen kovası başına bir)     | M+ tur — grup sohbetleri birleştirilmez                                 |

## Gateway kesintisinden sonra yetişme

Gateway çevrimdışıyken (çökme, yeniden başlatma, Mac uykusu, makinenin kapalı olması), `imsg watch` Gateway tekrar çalıştığında geçerli `chat.db` durumundan sürdürür — boşluk sırasında gelen hiçbir şey varsayılan olarak görülmez. Yetişme, bir sonraki başlangıçta bu mesajları yeniden oynatır; böylece ajan gelen trafiği sessizce kaçırmaz.

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

Her `monitorIMessageProvider` başlangıcı için bir geçiş yapılır ve sıra şöyledir: `imsg launch` hazır → `watch.subscribe` → `performIMessageCatchup` → canlı dağıtım döngüsü. Yetişmenin kendisi, `imsg watch` tarafından kullanılan aynı JSON-RPC istemcisine karşı `chats.list` + sohbet başına `messages.history` kullanır. Yetişme geçişi sırasında gelen her şey normal şekilde canlı dağıtımdan geçer; mevcut gelen yineleme önleme önbelleği, yeniden oynatılan satırlarla herhangi bir çakışmayı emer.

Yeniden oynatılan her satır canlı dağıtım yolundan (`evaluateIMessageInbound` + `dispatchInboundMessage`) geçirilir; bu nedenle izin listeleri, grup politikası, debouncer, echo cache ve okundu bilgileri yeniden oynatılan ve canlı mesajlarda aynı davranır.

### İmleç ve yeniden deneme semantiği

Yetişme, `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` konumunda hesap başına bir imleç tutar (OpenClaw durum dizini varsayılan olarak `~/.openclaw` olur, `OPENCLAW_STATE_DIR` ile geçersiz kılınabilir):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- İmleç her başarılı dağıtımda ilerler ve bir satırın dağıtımı hata fırlattığında tutulur — sonraki başlangıç aynı satırı tutulan imleçten yeniden dener.
- Aynı `guid` için art arda `maxFailureRetries` hata fırlatıldıktan sonra yetişme bir `warn` kaydeder ve sonraki başlangıçların ilerleyebilmesi için imleci sıkışmış mesajın ötesine zorla ilerletir.
- Daha önce vazgeçilmiş guid'ler sonraki çalıştırmalarda görüldüğünde atlanır (dağıtım denemesi yapılmaz) ve çalıştırma özetinde `skippedGivenUp` altında sayılır.

### Operatörün görebileceği sinyaller

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Bir `WARN ... capped to perRunLimit` satırı, tek bir başlangıcın tüm birikmiş işi boşaltmadığı anlamına gelir. Boşluklarınız düzenli olarak varsayılan 50 satırlık geçişi aşıyorsa `perRunLimit` değerini yükseltin (en fazla 500).

### Ne zaman kapalı bırakmalı

- Gateway, watchdog otomatik yeniden başlatmasıyla sürekli çalışıyorsa ve boşluklar her zaman birkaç saniyeden kısaysa — varsayılan kapalı durum uygundur.
- DM hacmi düşükse ve kaçırılan mesajlar ajan davranışını değiştirmeyecekse — `firstRunLookbackMinutes` ilk penceresi, ilk etkinleştirmede şaşırtıcı eski bağlamı dağıtabilir.

Yetişmeyi açtığınızda, imleç olmayan ilk başlangıç tam `maxAgeMinutes` penceresine değil, yalnızca `firstRunLookbackMinutes` değerine (varsayılan 30 dk) geri bakar — bu, etkinleştirme öncesi uzun bir geçmişin yeniden oynatılmasını önler.

## Sorun giderme

<AccordionGroup>
  <Accordion title="imsg bulunamadı veya RPC desteklenmiyor">
    İkiliyi ve RPC desteğini doğrulayın:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Probe, RPC'nin desteklenmediğini bildirirse `imsg` öğesini güncelleyin. Özel API eylemleri kullanılamıyorsa oturum açmış macOS kullanıcı oturumunda `imsg launch` çalıştırın ve yeniden probe yapın. Gateway macOS üzerinde çalışmıyorsa varsayılan yerel `imsg` yolu yerine yukarıdaki SSH üzerinden Uzak Mac kurulumunu kullanın.

  </Accordion>

  <Accordion title="Gateway macOS üzerinde çalışmıyor">
    Varsayılan `cliPath: "imsg"`, Mesajlar'a giriş yapılmış Mac üzerinde çalışmalıdır. Linux veya Windows üzerinde, `channels.imessage.cliPath` değerini bu Mac'e SSH yapan ve `imsg "$@"` çalıştıran bir sarmalayıcı betiğe ayarlayın.

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
    - Mesajlar'ı çalıştıran Mac üzerindeki uzak yolun okunabilirliği

  </Accordion>

  <Accordion title="macOS izin istemleri kaçırıldı">
    Aynı kullanıcı/oturum bağlamında etkileşimli bir GUI terminalinde yeniden çalıştırın ve istemleri onaylayın:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    OpenClaw/`imsg` çalıştıran süreç bağlamı için Tam Disk Erişimi + Otomasyon izinlerinin verildiğini doğrulayın.

  </Accordion>
</AccordionGroup>

## Yapılandırma başvurusu işaretçileri

- [Yapılandırma başvurusu - iMessage](/tr/gateway/config-channels#imessage)
- [Gateway yapılandırması](/tr/gateway/configuration)
- [Eşleştirme](/tr/channels/pairing)

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [BlueBubbles kaldırılması ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage) — duyuru ve geçiş özeti
- [BlueBubbles'tan geçiş](/tr/channels/imessage-from-bluebubbles) — yapılandırma çeviri tablosu ve adım adım geçiş
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
