---
read_when:
    - Discord kanal özellikleri üzerinde çalışma
summary: Discord bot kurulumu, yapılandırma anahtarları, bileşenler, ses ve sorun giderme
title: Discord
x-i18n:
    generated_at: "2026-07-12T12:02:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw, resmi Discord Gateway üzerinden bir bot olarak Discord'a bağlanır. DM'ler ve sunucu kanalları desteklenir.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Discord DM'leri varsayılan olarak eşleştirme modunu kullanır.
  </Card>
  <Card title="Eğik çizgi komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Kanal sorunlarını giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım akışı.
  </Card>
</CardGroup>

## Hızlı kurulum

Bot içeren bir Discord uygulaması oluşturun, botu sunucunuza ekleyin ve OpenClaw ile eşleştirin. Mümkünse özel bir sunucu kullanın; gerekirse önce [bir sunucu oluşturun](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**).

<Steps>
  <Step title="Discord uygulaması ve bot oluşturun">
    [Discord Developer Portal](https://discord.com/developers/applications) içinde **New Application** seçeneğine tıklayın ve uygulamayı adlandırın (örneğin "OpenClaw").

    Kenar çubuğunda **Bot** bölümünü açın ve **Username** alanını agent'ınızın adı olarak ayarlayın.

  </Step>

  <Step title="Ayrıcalıklı intent'leri etkinleştirin">
    **Bot** sayfasında **Privileged Gateway Intents** altında şunları etkinleştirin:

    - **Message Content Intent** (zorunlu)
    - **Server Members Intent** (önerilir; rol izin listeleri, ad-ID eşleştirmesi ve kanal kitlesi erişim grupları için zorunludur)
    - **Presence Intent** (isteğe bağlı; yalnızca iletişim durumu güncellemeleri için)

  </Step>

  <Step title="Bot token'ınızı kopyalayın">
    **Bot** sayfasında **Reset Token** seçeneğine tıklayın ve token'ı kopyalayın.

    <Note>
    Adının aksine bu işlem ilk token'ınızı oluşturur; hiçbir şey "sıfırlanmaz".
    </Note>

  </Step>

  <Step title="Davet URL'si oluşturun ve botu sunucunuza ekleyin">
    Kenar çubuğunda **OAuth2** bölümünü açın. **OAuth2 URL Generator** içinde şu kapsamları etkinleştirin:

    - `bot`
    - `applications.commands`

    Görünen **Bot Permissions** bölümünde en azından şunları etkinleştirin:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (isteğe bağlı)

    Bunlar normal metin kanalları için temel izinlerdir. Bot, bir ileti dizisi oluşturan veya sürdüren forum ya da medya kanalı iş akışları dâhil olmak üzere ileti dizilerinde gönderi paylaşacaksa **Send Messages in Threads** seçeneğini de etkinleştirin.

    Oluşturulan URL'yi kopyalayın, bir tarayıcıda açın, sunucunuzu seçin ve **Continue** seçeneğine tıklayın. Bot artık sunucunuzda görünmelidir.

  </Step>

  <Step title="Geliştirici Modu'nu etkinleştirin ve ID'lerinizi alın">
    ID'leri kopyalayabilmek için Discord uygulamasında Geliştirici Modu'nu etkinleştirin:

    1. **User Settings** (dişli simgesi) → **Developer** → **Developer Mode** seçeneğini etkinleştirin
       *(mobilde: **App Settings** → **Advanced**)*
    2. **Sunucu simgenize** sağ tıklayın → **Copy Server ID**
    3. **Kendi avatarınıza** sağ tıklayın → **Copy User ID**

    Sunucu ID'sini ve Kullanıcı ID'sini bot token'ınızla birlikte saklayın; sonraki adımda üçünün de bulunması gerekir.

  </Step>

  <Step title="Sunucu üyelerinden gelen DM'lere izin verin">
    Eşleştirmenin çalışması için Discord, botun size DM göndermesine izin vermelidir. **Sunucu simgenize** sağ tıklayın → **Privacy Settings** → **Direct Messages** seçeneğini etkinleştirin.

    OpenClaw ile Discord DM'lerini kullanıyorsanız bunu açık tutun. Yalnızca sunucu kanallarını kullanıyorsanız eşleştirmeden sonra devre dışı bırakabilirsiniz.

  </Step>

  <Step title="Bot token'ınızı güvenli biçimde ayarlayın (sohbette göndermeyin)">
    Bot token'ı gizli bir bilgidir. Agent'ınıza mesaj göndermeden önce OpenClaw'ın çalıştığı makinede ayarlayın:

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    OpenClaw zaten arka plan hizmeti olarak çalışıyorsa OpenClaw Mac uygulaması aracılığıyla veya `openclaw gateway run` sürecini durdurup yeniden başlatarak yeniden başlatın.
    Yönetilen hizmet kurulumlarında `DISCORD_BOT_TOKEN` ayarlanmış bir kabuktan `openclaw gateway install` komutunu çalıştırın veya hizmetin yeniden başlatıldıktan sonra env SecretRef'i çözebilmesi için değişkeni `~/.openclaw/.env` içinde saklayın.
    Ana makineniz Discord'un başlangıç uygulaması sorgusu tarafından engelleniyorsa veya hız sınırına tabi tutuluyorsa başlangıcın bu REST çağrısını atlayabilmesi için Developer Portal'daki uygulama/istemci ID'sini ayarlayın: varsayılan hesap için `channels.discord.applicationId` veya bot başına `channels.discord.accounts.<accountId>.applicationId`.

  </Step>

  <Step title="OpenClaw'ı yapılandırın ve eşleştirin">

    <Tabs>
      <Tab title="Agent'ınıza sorun">
        Mevcut bir kanalda (örneğin Telegram) OpenClaw agent'ınızla sohbet edin ve talimat verin. Discord ilk kanalınızsa bunun yerine CLI / yapılandırma sekmesini kullanın.

        > "Discord bot token'ımı yapılandırmada zaten ayarladım. Lütfen Kullanıcı ID'si `<user_id>` ve Sunucu ID'si `<server_id>` ile Discord kurulumunu tamamla."
      </Tab>
      <Tab title="CLI / yapılandırma">
        Dosya tabanlı yapılandırma:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        Varsayılan hesap için ortam değişkeni geri dönüşü:

```bash
DISCORD_BOT_TOKEN=...
```

        Betikle veya uzaktan kurulum için aynı JSON5 bloğunu `openclaw config patch --file ./discord.patch.json5 --dry-run` ile yazın, ardından `--dry-run` olmadan yeniden çalıştırın. Düz metin `token` dizeleri de çalışır ve env/file/exec sağlayıcılarında `channels.discord.token` için SecretRef değerleri desteklenir. Bkz. [Gizli Bilgi Yönetimi](/tr/gateway/secrets).

        Birden fazla Discord botu için her bot token'ını ve uygulama ID'sini kendi hesabının altında tutun. Üst düzey `channels.discord.applicationId` hesaplar tarafından devralınır; bu nedenle yalnızca her hesap aynı uygulama ID'sini kullanıyorsa burada ayarlayın.

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="İlk DM eşleştirmesini onaylayın">
    Gateway çalışmaya başladıktan sonra Discord'da botunuza DM gönderin. Bot bir eşleştirme koduyla yanıt verir.

    <Tabs>
      <Tab title="Agent'ınıza sorun">
        Eşleştirme kodunu mevcut kanalınızdan agent'ınıza gönderin:

        > "Şu Discord eşleştirme kodunu onayla: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Eşleştirme kodlarının süresi 1 saat sonra dolar. Onaydan sonra agent'ınızla Discord DM üzerinden sohbet edin.

  </Step>
</Steps>

<Note>
Token çözümlemesi hesapları dikkate alır. Yapılandırmadaki token değerleri ortam değişkeni geri dönüşüne göre önceliklidir ve `DISCORD_BOT_TOKEN` yalnızca varsayılan hesap için kullanılır.
Etkinleştirilmiş iki Discord hesabı aynı bot token'ına çözümlenirse OpenClaw bu token için yalnızca bir Gateway izleyicisi başlatır: yapılandırmadan alınan token, ortam değişkeni geri dönüşüne göre önceliklidir; aksi hâlde etkinleştirilen ilk hesap öncelik kazanır ve yinelenen hesap `duplicate bot token` nedeniyle devre dışı olarak bildirilir.
Gelişmiş giden çağrılarda (mesaj aracı/kanal eylemleri), çağrı başına açıkça belirtilen `token` o çağrı için kullanılır. Bu, gönderme ve okuma/yoklama türündeki eylemler (okuma/arama/getirme/ileti dizisi/sabitlenmiş öğeler/izinler) için geçerlidir. Hesap politikası ve yeniden deneme ayarları yine etkin çalışma zamanı anlık görüntüsündeki seçili hesaptan alınır.
</Note>

## Önerilen: Bir sunucu çalışma alanı kurun

DM'ler çalışmaya başladıktan sonra sunucunuzu, her kanalın kendi bağlamına sahip ayrı bir agent oturumu kullandığı eksiksiz bir çalışma alanına dönüştürebilirsiniz. Yalnızca sizin ve botunuzun bulunduğu özel sunucular için önerilir.

<Steps>
  <Step title="Sunucunuzu sunucu izin listesine ekleyin">
    Bu, agent'ınızın yalnızca DM'lerde değil, sunucunuzdaki tüm kanallarda yanıt verebilmesini sağlar.

    <Tabs>
      <Tab title="Agent'ınıza sorun">
        > "Discord Sunucu ID'm `<server_id>` değerini sunucu izin listesine ekle"
      </Tab>
      <Tab title="Yapılandırma">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="@bahsetme olmadan yanıtlara izin verin">
    Agent varsayılan olarak sunucu kanallarında yalnızca kendisinden @bahsedildiğinde yanıt verir. Özel bir sunucuda muhtemelen her mesaja yanıt vermesini istersiniz.

    Sunucu kanallarında normal yanıtlar varsayılan olarak otomatik biçimde gönderilir. Paylaşılan ve sürekli etkin odalarda agent'ın kanalı sessizce izlemesi ve yalnızca bir kanal yanıtını yararlı bulduğunda gönderi paylaşması için `messages.groupChat.visibleReplies: "message_tool"` ayarını etkinleştirin. Bu, GPT-5.6 Sol gibi araçları güvenilir biçimde kullanan en yeni nesil modellerle en iyi şekilde çalışır. Araç gönderim yapmadıkça ortam odası olayları sessiz kalır. Eksiksiz sessiz izleme modu yapılandırması için [Ortam odası olayları](/tr/channels/ambient-room-events) bölümüne bakın.

    Discord yazma göstergesini gösteriyor ve günlükler token kullanımını kaydediyor ancak mesaj gönderilmiyorsa turun bir ortam odası olayı olarak yapılandırılıp yapılandırılmadığını veya mesaj aracıyla görünür yanıtların etkinleştirilip etkinleştirilmediğini kontrol edin.

    <Tabs>
      <Tab title="Agent'ınıza sorun">
        > "Agent'ımın bu sunucuda kendisinden @bahsedilmesine gerek kalmadan yanıt vermesine izin ver"
      </Tab>
      <Tab title="Yapılandırma">
        Sunucu yapılandırmanızda `requireMention: false` değerini ayarlayın:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

        Görünür grup/kanal yanıtlarında mesaj aracı gönderimlerini zorunlu kılmak için `messages.groupChat.visibleReplies: "message_tool"` değerini ayarlayın.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Sunucu kanallarındaki bellek kullanımını planlayın">
    Uzun süreli bellek (MEMORY.md) yalnızca DM oturumlarında otomatik olarak yüklenir; sunucu kanalları bunu yüklemez.

    <Tabs>
      <Tab title="Agent'ınıza sorun">
        > "Discord kanallarında soru sorduğumda MEMORY.md dosyasındaki uzun süreli bağlama ihtiyacın olursa memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Manuel">
        Her kanalda paylaşılan bağlam için kararlı talimatları `AGENTS.md` veya `USER.md` içine yerleştirin (her oturuma eklenir). Uzun süreli notları `MEMORY.md` içinde tutun ve gerektiğinde bellek araçlarıyla erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Artık kanallar oluşturup sohbet etmeye başlayabilirsiniz. Agent kanal adını görür ve her kanal yalıtılmış bir oturumdur; iş akışınıza uygun şekilde `#coding`, `#home`, `#research` veya başka kanallar oluşturun.

## Çalışma zamanı modeli

- Discord bağlantısının sahibi Gateway'dir.
- Yanıt yönlendirmesi belirlenimlidir: Discord'dan gelen mesajların yanıtları Discord'a geri gönderilir.
- Discord sunucu/kanal meta verileri, kullanıcıya görünür bir yanıt ön eki olarak değil, güvenilmeyen bağlam olarak model istemine eklenir. Bir model bu zarfı geri kopyalarsa OpenClaw, kopyalanan meta verileri giden yanıtlardan ve gelecekte yeniden oynatılacak bağlamdan kaldırır.
- Varsayılan olarak (`session.dmScope=main`) doğrudan sohbetler agent'ın ana oturumunu (`agent:main:main`) paylaşır.
- Sunucu kanallarının oturum anahtarları yalıtılmıştır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM'leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel eğik çizgi komutları yalıtılmış komut oturumlarında (`agent:<agentId>:discord:slash:<userId>`) çalışırken yönlendirilen konuşma oturumuna ait `CommandTargetSessionKey` değerini taşımaya devam eder.
- Discord'a yalnızca metin içeren Cron/Heartbeat duyurularının teslimi, bir kez gönderilen ve asistana görünür olan son yanıta indirgenir. Agent birden fazla teslim edilebilir yük ürettiğinde medya ve yapılandırılmış bileşen yükleri birden fazla mesaj olarak kalır.

## Forum kanalları

Discord forum ve medya kanalları yalnızca ileti dizisi gönderilerini kabul eder. OpenClaw bunları oluşturmanın iki yolunu destekler:

- Otomatik olarak bir ileti dizisi oluşturmak için forum üst kanalına (`channel:<forumId>`) mesaj gönderin. İleti dizisi başlığı, mesajın boş olmayan ilk satırıdır (Discord'un 100 karakterlik ileti dizisi adı sınırına uyacak şekilde kısaltılır).
- Doğrudan bir ileti dizisi oluşturmak için `openclaw message thread create` komutunu kullanın. Forum kanalları için `--message-id` iletmeyin.

İleti dizisi oluşturmak için forum üst kanalına gönderin:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Açıkça bir forum ileti dizisi oluşturun:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum üst kanalları Discord bileşenlerini kabul etmez. Bileşenlere ihtiyacınız varsa doğrudan ileti dizisine (`channel:<threadId>`) gönderin.

## Etkileşimli bileşenler

OpenClaw, ajan mesajları için Discord bileşenleri v2 kapsayıcılarını destekler. Mesaj aracını bir `components` yüküyle kullanın. Etkileşim sonuçları normal gelen mesajlar olarak ajana geri yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Eylem satırları en fazla 5 düğmeye veya tek bir seçim menüsüne izin verir
- Seçim türleri: `string`, `user`, `role`, `mentionable`, `channel`

Bileşenler varsayılan olarak tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süreleri dolana kadar birden çok kez kullanılabilmesi için `components.reusable=true` ayarını belirleyin.

Bir düğmeye kimlerin tıklayabileceğini sınırlamak için o düğmede `allowedUsers` değerini belirleyin (Discord kullanıcı kimlikleri, etiketleri veya `*`). Eşleşmeyen kullanıcılar yalnızca kendilerine görünen bir ret bildirimi alır.

Bileşen geri çağrılarının süresi varsayılan olarak 30 dakika sonra dolar. Varsayılan hesabın geri çağrı kayıt defteri ömrünü değiştirmek için `channels.discord.agentComponents.ttlMs`, hesap bazında değiştirmek için `channels.discord.accounts.<accountId>.agentComponents.ttlMs` ayarını belirleyin. Değer milisaniye cinsindedir, pozitif bir tam sayı olmalıdır ve `86400000` (24 saat) ile sınırlandırılmıştır. Daha uzun TTL değerleri, düğmelerin kullanılabilir kalması gereken inceleme/onay iş akışlarına uygundur ancak eski bir Discord mesajının hâlâ bir eylemi tetikleyebileceği süreyi uzatır. İhtiyacı karşılayan en kısa TTL değerini tercih edin ve eski geri çağrıların beklenmedik sonuçlar doğuracağı durumlarda varsayılanı koruyun.

`/model` ve `/models` eğik çizgi komutları; sağlayıcı, model ve uyumlu çalışma zamanı açılır listelerinin yanı sıra bir Gönder adımı içeren etkileşimli bir model seçici açar. `/models add` kullanım dışıdır ve sohbetten model kaydetmek yerine kullanım dışı bırakma mesajı döndürür. Seçici yanıtı yalnızca çağıran kullanıcıya görünür ve yalnızca bu kullanıcı tarafından kullanılabilir. Discord seçim menüleri 25 seçenekle sınırlıdır; bu nedenle seçicinin dinamik olarak keşfedilen modelleri yalnızca `openai` veya `vllm` gibi seçili sağlayıcılar için göstermesini istediğinizde `agents.defaults.models` öğesine `provider/*` girdileri ekleyin.

Dosya ekleri:

- `file` blokları bir ek başvurusuna (`attachment://<filename>`) işaret etmelidir
- Eki `media`/`path`/`filePath` (tek dosya) aracılığıyla sağlayın; birden çok dosya için `media-gallery` kullanın
- Yükleme adının ek başvurusuyla eşleşmesi gerektiğinde adı geçersiz kılmak için `filename` kullanın

Kalıcı pencere formları:

- En fazla 5 alanla `components.modal` ekleyin
- Alan türleri: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw otomatik olarak bir tetikleyici düğme ekler

Örnek:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM politikası">
    `channels.discord.dmPolicy`, DM erişimini denetler. `channels.discord.allowFrom`, kurallı DM izin listesidir.

    - `pairing` (varsayılan)
    - `allowlist` (en az bir `allowFrom` göndericisi gerektirir)
    - `open` (`channels.discord.allowFrom` öğesinin `"*"` içermesini gerektirir)
    - `disabled`

    DM politikası açık değilse bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme yapmaları istenir).

    Çoklu hesap önceliği:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesabına uygulanır.
    - Tek bir hesap için `allowFrom`, eski `dm.allowFrom` ayarına göre önceliklidir.
    - Adlandırılmış hesaplar kendi `allowFrom` ve eski `dm.allowFrom` ayarları belirlenmemişse `channels.discord.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.discord.accounts.default.allowFrom` değerini devralmaz.

    Eski `channels.discord.dm.policy` ve `channels.discord.dm.allowFrom` uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiği durumlarda bunları `dmPolicy` ve `allowFrom` ayarlarına taşır.

    Teslimat için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` bahsi

    Yalın sayısal kimlikler, bir kanal varsayılanı etkinken normalde kanal kimlikleri olarak çözümlenir; ancak hesabın etkin DM `allowFrom` listesinde bulunan kimlikler uyumluluk amacıyla kullanıcı DM hedefleri olarak değerlendirilir.

  </Tab>

  <Tab title="Erişim grupları">
    Discord DM'leri ve metin komutu yetkilendirmesi, `channels.discord.allowFrom` içinde dinamik `accessGroup:<name>` girdilerini kullanabilir.

    Erişim grubu adları mesaj kanalları arasında paylaşılır. Üyeleri her kanalın normal `allowFrom` söz dizimiyle ifade edilen statik bir grup için `type: "message.senders"`; bir Discord kanalının mevcut `ViewChannel` kitlesinin üyeliği dinamik olarak belirlemesi gerektiğinde ise `type: "discord.channelAudience"` kullanın. Paylaşılan erişim grubu davranışı: [Erişim grupları](/tr/channels/access-groups).

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    Bir Discord metin kanalının ayrı bir üye listesi yoktur. `type: "discord.channelAudience"` üyeliği şöyle modeller: DM göndericisi yapılandırılan sunucunun bir üyesidir ve rol ile kanal üzerine yazmaları uygulandıktan sonra yapılandırılan kanalda etkin `ViewChannel` iznine sahiptir.

    Örnek: DM'leri diğer herkese kapalı tutarken `#maintainers` kanalını görebilen herkesin bota DM göndermesine izin verin.

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    Dinamik ve statik girdileri birlikte kullanabilirsiniz:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    Aramalar güvenli biçimde başarısız olur. Discord `Missing Access` döndürürse, üye araması başarısız olursa veya kanal farklı bir sunucuya aitse DM göndericisi yetkisiz kabul edilir.

    Kanal kitlesi erişim gruplarını kullanırken Discord Developer Portal'da **Server Members Intent** seçeneğini etkinleştirin. DM'ler sunucu üyesi durumunu içermez; bu nedenle OpenClaw, yetkilendirme sırasında üyeyi Discord REST üzerinden çözümler.

  </Tab>

  <Tab title="Sunucu politikası">
    Sunucu işleme davranışı `channels.discord.groupPolicy` tarafından denetlenir:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` mevcut olduğunda güvenli temel değer `allowlist` olur.

    `allowlist` davranışı:

    - sunucu `channels.discord.guilds` ile eşleşmelidir (`id` tercih edilir, kısa ad kabul edilir)
    - isteğe bağlı gönderici izin listeleri: `users` (kararlı kimlikler önerilir) ve `roles` (yalnızca rol kimlikleri); bunlardan herhangi biri yapılandırılmışsa göndericiler `users` VEYA `roles` ile eşleştiklerinde kabul edilir
    - doğrudan ad/etiket eşleştirmesi varsayılan olarak devre dışıdır; `channels.discord.dangerouslyAllowNameMatching: true` ayarını yalnızca acil durum uyumluluk modu olarak etkinleştirin
    - `users` için adlar/etiketler desteklenir ancak kimlikler daha güvenlidir; ad/etiket girdileri kullanıldığında `openclaw security audit` uyarı verir
    - bir sunucuda `channels` yapılandırılmışsa listelenmeyen kanallar reddedilir
    - bir sunucuda `channels` bloğu yoksa izin listesindeki o sunucunun tüm kanallarına izin verilir

    Örnek:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Eski kanal bazlı `allow` anahtarı, `openclaw doctor --fix` tarafından `enabled` anahtarına taşınır.

    Yalnızca `DISCORD_BOT_TOKEN` ayarını belirler ve bir `channels.discord` bloğu oluşturmazsanız, `channels.defaults.groupPolicy` değeri `open` olsa bile çalışma zamanı geri dönüşü `groupPolicy="allowlist"` olur (günlüklere bir uyarı yazılır).

  </Tab>

  <Tab title="Bahisler ve grup DM'leri">
    Sunucu mesajları varsayılan olarak bahse tabidir.

    Bahis algılama şunları içerir:

    - açık bot bahsi
    - yapılandırılmış bahis kalıpları (`agents.list[].groupChat.mentionPatterns`, geri dönüş olarak `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda örtük bota yanıt davranışı

    Giden Discord mesajlarını yazarken kurallı bahis söz dizimini kullanın: kullanıcılar için `<@USER_ID>`, kanallar için `<#CHANNEL_ID>` ve roller için `<@&ROLE_ID>`. Eski `<@!USER_ID>` takma ad bahsi biçimini kullanmayın.

    `requireMention`, sunucu/kanal bazında (`channels.discord.guilds...`) yapılandırılır.
    `ignoreOtherMentions`, isteğe bağlı olarak başka bir kullanıcıdan/rolden bahseden ancak bottan bahsetmeyen mesajları yok sayar (@everyone/@here hariç).

    Grup DM'leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - `dm.groupChannels` aracılığıyla isteğe bağlı izin listesi (kanal kimlikleri veya kısa adları)

  </Tab>
</Tabs>

### Rol tabanlı ajan yönlendirmesi

Discord sunucu üyelerini rol kimliğine göre farklı ajanlara yönlendirmek için `bindings[].match.roles` kullanın. Rol tabanlı bağlamalar yalnızca rol kimliklerini kabul eder ve eş veya üst eş bağlamalarından sonra, yalnızca sunucu bağlamalarından önce değerlendirilir. Bir bağlama başka eşleşme alanları da ayarlıyorsa (örneğin `peer` + `guildId` + `roles`), yapılandırılmış tüm alanlar eşleşmelidir.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Yerel komutlar ve komut yetkilendirmesi

- `commands.native` varsayılan olarak `"auto"` değerini kullanır ve Discord için etkindir.
- Kanal bazında geçersiz kılma: `channels.discord.commands.native`.
- `commands.native=false`, başlangıç sırasında Discord eğik çizgi komutlarının kaydını ve temizlenmesini atlar. Önceden kaydedilmiş komutlar, bunları Discord uygulamasından kaldırana kadar Discord'da görünür kalabilir.
- Yerel komut kimlik doğrulaması, normal mesaj işleme ile aynı Discord izin listelerini/ilkelerini kullanır.
- Komutlar, yetkisiz kullanıcılar için Discord kullanıcı arayüzünde yine de görünebilir; yürütme sırasında OpenClaw kimlik doğrulaması uygulanır ve "yetkiniz yok" yanıtı verilir.
- Varsayılan eğik çizgi komutu ayarları: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

Komut kataloğu ve davranışı için [Eğik çizgi komutları](/tr/tools/slash-commands) bölümüne bakın.

## Özellik ayrıntıları

<AccordionGroup>
  <Accordion title="Yanıt etiketleri ve yerel yanıtlar">
    Discord, ajan çıktısındaki yanıt etiketlerini destekler:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` ile denetlenir:

    - `off` (varsayılan): örtük yanıt dizisi oluşturulmaz; açık `[[reply_to_*]]` etiketleri yine de dikkate alınır
    - `first`: örtük yerel yanıt referansını turun ilk giden Discord mesajına ekler
    - `all`: bunu giden her mesaja ekler
    - `batched`: bunu yalnızca gelen olay, birden çok mesajdan oluşan gecikmeli bir toplu işlem olduğunda ekler — her tek mesajlık tur yerine esas olarak belirsiz ve yoğun sohbetlerde yerel yanıtlar istediğinizde kullanışlıdır

    Ajanların belirli mesajları hedefleyebilmesi için mesaj kimlikleri bağlamda/geçmişte gösterilir.

  </Accordion>

  <Accordion title="Bağlantı önizlemeleri">
    Discord, varsayılan olarak URL'ler için zengin bağlantı yerleştirmeleri oluşturur. OpenClaw, siz etkinleştirmediğiniz sürece ajan tarafından gönderilen URL'lerin düz bağlantılar olarak kalması için giden Discord mesajlarında oluşturulan bu yerleştirmeleri varsayılan olarak engeller:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Tek bir hesap için geçersiz kılmak üzere `channels.discord.accounts.<id>.suppressEmbeds` ayarını kullanın. Ajan mesaj aracı gönderimleri de tek bir mesaj için `suppressEmbeds: false` iletebilir. Açık Discord `embeds` yükleri, varsayılan bağlantı önizleme ayarı tarafından engellenmez.

  </Accordion>

  <Accordion title="Canlı akış önizlemesi">
    OpenClaw, geçici bir mesaj gönderip metin geldikçe bu mesajı düzenleyerek taslak yanıtları akış halinde iletebilir. `channels.discord.streaming.mode`, `off` | `partial` | `block` | `progress` değerlerini kabul eder (`streaming`/eski `streamMode` anahtarı ayarlanmamışsa varsayılan değer `progress` olur). `streamMode` eski bir diğer addır; kalıcı yapılandırmayı standart iç içe `streaming` biçimine yeniden yazmak için `openclaw doctor --fix` komutunu çalıştırın.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `off`, Discord önizleme düzenlemelerini devre dışı bırakır.
    - `partial`, belirteçler geldikçe tek bir önizleme mesajını düzenler.
    - `block`, taslak boyutunda parçalar gönderir; boyutu ve kesme noktalarını `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`) ile ayarlayın; değerler `textChunkLimit` ile sınırlandırılır. Blok akışı açıkça etkinleştirildiğinde OpenClaw, çift akışı önlemek için önizleme akışını atlar.
    - `progress`, düzenlenebilir tek bir durum taslağını korur ve nihai teslimata kadar araç ilerlemesiyle günceller; paylaşılan başlangıç etiketi kayan bir satırdır, dolayısıyla yeterli miktarda çalışma göründüğünde diğer içerikler gibi kaydırılarak görünümden çıkar.
    - Medya, hata ve açık yanıt sonuçları bekleyen önizleme düzenlemelerini iptal eder.
    - `streaming.preview.toolProgress` (varsayılan `true`), araç/ilerleme güncellemelerinin önizleme mesajını yeniden kullanıp kullanmayacağını denetler.
    - Araç/ilerleme satırları, mevcut olduğunda kompakt emoji + başlık + ayrıntı biçiminde oluşturulur; örneğin `🛠️ Bash: testleri çalıştır` veya `🔎 Web Search: "sorgu" için`.
    - `streaming.progress.commentary` (varsayılan `false`), geçici ilerleme taslağına asistan açıklama/giriş metnini dahil eder. Açıklama görüntülenmeden önce temizlenir, geçici kalır ve nihai yanıtın teslimini değiştirmez.
    - `streaming.progress.maxLineChars`, satır başına ilerleme önizlemesi sınırını denetler. Düzyazı, sözcük sınırlarında kısaltılır; komut ve yol ayrıntılarının yararlı son ekleri korunur.
    - `streaming.preview.commandText` / `streaming.progress.commandText`, kompakt ilerleme satırlarındaki komut/yürütme ayrıntısını denetler: `raw` (varsayılan) veya `status` (yalnızca araç etiketi).

    Kompakt ilerleme satırlarını korurken ham komut/yürütme metnini gizleyin:

    ```json
    {
      "channels": {
        "discord": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Önizleme akışı yalnızca metin içindir; medya yanıtları normal teslimata geri döner.

  </Accordion>

  <Accordion title="Geçmiş, bağlam ve ileti dizisi davranışı">
    Sunucu geçmişi bağlamı:

    - `channels.discord.historyLimit` varsayılanı `20`
    - geri dönüş: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    Özel mesaj geçmişi denetimleri:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    İleti dizisi davranışı:

    - Discord ileti dizileri, kanal oturumları olarak yönlendirilir ve geçersiz kılınmadığı sürece üst kanal yapılandırmasını devralır.
    - İleti dizisi oturumları, yalnızca model için geri dönüş olarak üst kanalın oturum düzeyindeki `/model` seçimini devralır; ileti dizisine özgü `/model` seçimleri önceliklidir ve döküm devralma etkinleştirilmediği sürece üst döküm geçmişi kopyalanmaz.
    - `channels.discord.thread.inheritParent` (varsayılan `false`), yeni otomatik ileti dizilerinin üst dökümden başlangıç verisi almasını sağlar. Hesap bazında geçersiz kılma: `channels.discord.accounts.<id>.thread.inheritParent`.
    - Mesaj aracı tepkileri, `user:<id>` özel mesaj hedeflerini çözümleyebilir.
    - `guilds.<guild>.channels.<channel>.requireMention: false`, yanıt aşamasında etkinleştirme geri dönüşü sırasında korunur.

    Kanal konuları, **güvenilmeyen** bağlam olarak eklenir. İzin listeleri, ajanı kimin tetikleyebileceğini sınırlar; ancak ek bağlam için eksiksiz bir sansür sınırı değildir.

  </Accordion>

  <Accordion title="Alt ajanlar için ileti dizisine bağlı oturumlar">
    Discord, bir ileti dizisini oturum hedefine bağlayabilir; böylece bu ileti dizisindeki takip mesajları aynı oturuma (alt ajan oturumları dahil) yönlendirilmeye devam eder.

    Komutlar:

    - `/focus <target>` geçerli/yeni ileti dizisini bir alt ajan/oturum hedefine bağlar
    - `/unfocus` geçerli ileti dizisi bağını kaldırır
    - `/agents` etkin çalıştırmaları ve bağ durumunu gösterir
    - `/session idle <duration|off>` odaklanmış bağlar için işlem yapılmadığında otomatik odaktan çıkarma ayarını inceler/günceller
    - `/session max-age <duration|off>` odaklanmış bağlar için kesin azami yaşı inceler/günceller

    Yapılandırma:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    Notlar:

    - `session.threadBindings.*` genel varsayılanları belirler; `channels.discord.threadBindings.*` Discord davranışını geçersiz kılar.
    - `spawnSessions`, `sessions_spawn({ thread: true })` ve ACP ileti dizisi başlatmaları için ileti dizilerinin otomatik oluşturulmasını/bağlanmasını denetler. Varsayılan: `true`.
    - `defaultSpawnContext`, ileti dizisine bağlı başlatmalar için yerel alt ajan bağlamını denetler. Varsayılan: `"fork"`.
    - Kullanımdan kaldırılan `spawnSubagentSessions`/`spawnAcpSessions` anahtarları `openclaw doctor --fix` tarafından taşınır.
    - Bir hesap için ileti dizisi bağları devre dışı bırakılmışsa `/focus` ve ilgili ileti dizisi bağlama işlemleri kullanılamaz.

    [Alt ajanlar](/tr/tools/subagents), [ACP Ajanları](/tr/tools/acp-agents) ve [Yapılandırma Başvurusu](/tr/gateway/configuration-reference) bölümlerine bakın.

  </Accordion>

  <Accordion title="Kalıcı ACP kanal bağları">
    Kararlı ve "her zaman açık" ACP çalışma alanları için Discord konuşmalarını hedefleyen üst düzey türü belirtilmiş ACP bağlarını yapılandırın.

    Yapılandırma yolu: `type: "acp"` ve `match.channel: "discord"` içeren `bindings[]`.

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Notlar:

    - `/acp spawn codex --bind here`, geçerli kanalı veya ileti dizisini bulunduğu yerde bağlar ve gelecekteki mesajları aynı ACP oturumunda tutar. İleti dizisi mesajları üst kanal bağını devralır.
    - Bağlı bir kanal veya ileti dizisinde `/new` ve `/reset`, aynı ACP oturumunu bulunduğu yerde sıfırlar. Geçici ileti dizisi bağları, etkinken hedef çözümlemesini geçersiz kılabilir.
    - `spawnSessions`, `--thread auto|here` aracılığıyla alt ileti dizisi oluşturulmasını/bağlanmasını sınırlar.

    Bağlama davranışı ayrıntıları için [ACP Ajanları](/tr/tools/acp-agents) bölümüne bakın.

  </Accordion>

  <Accordion title="Tepki bildirimleri">
    Sunucu bazında tepki bildirimi modu (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (varsayılan)
    - `all`
    - `allowlist` (`guilds.<id>.users` kullanır)

    Tepki olayları sistem olaylarına dönüştürülür ve yönlendirilen Discord oturumuna eklenir.

  </Accordion>

  <Accordion title="Alındı tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir alındı emojisi gönderir.

    Çözümleme sırası:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - ajan kimliği emojisi geri dönüşü (`agents.list[].identity.emoji`, yoksa "👀")

    Notlar:

    - Discord, Unicode emojileri veya özel emoji adlarını kabul eder.
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

    **Kapsam (`messages.ackReactionScope`):**

    Değerler: `"all"` (özel mesajlar + gruplar, ortam oda olayları dahil), `"direct"` (yalnızca özel mesajlar), `"group-all"` (ortam oda olayları hariç tüm grup mesajları, özel mesajlar yok), `"group-mentions"` (botun bahsedildiği gruplar; **özel mesajlar yok**, varsayılan), `"off"` / `"none"` (devre dışı).

    <Note>
    Varsayılan kapsam (`"group-mentions"`), doğrudan mesajlarda veya ortam oda olaylarında alındı tepkilerini tetiklemez. Gelen Discord özel mesajlarında ve sessiz oda olaylarında alındı tepkisi almak için `messages.ackReactionScope` değerini `"all"` olarak ayarlayın.
    </Note>

  </Accordion>

  <Accordion title="Yapılandırma yazmaları">
    Kanal tarafından başlatılan yapılandırma yazmaları varsayılan olarak etkindir. Bu, komut özellikleri etkinken `/config set|unset` akışlarını etkiler.

    Devre dışı bırakın:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway proxy'si">
    Discord gateway WebSocket trafiğini ve başlangıç REST aramalarını (uygulama kimliği + izin listesi çözümlemesi), `channels.discord.proxy` ile bir HTTP(S) proxy'si üzerinden yönlendirin.
    Discord gateway WebSocket proxy kullanımı açıkça yapılandırılır; WebSocket bağlantıları, Gateway işlemindeki ortam proxy değişkenlerini devralmaz. Başlangıç REST aramaları, `channels.discord.proxy` yapılandırıldığında bu proxy'yi kullanır.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Hesap bazında geçersiz kılma:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="PluralKit desteği">
    Proxy üzerinden iletilen mesajları sistem üyesi kimliğiyle eşlemek için PluralKit çözümlemesini etkinleştirin:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // isteğe bağlı; özel sistemler için gereklidir
      },
    },
  },
}
```

    Notlar:

    - izin listeleri `pk:<memberId>` kullanabilir
    - üye görünen adları yalnızca `channels.discord.dangerouslyAllowNameMatching: true` olduğunda ad/kısa ad ile eşleştirilir
    - sorgular, özgün ileti kimliğiyle PluralKit API'sine gönderilir
    - sorgu başarısız olursa, `allowBots` geçişlerine izin vermediği sürece vekil iletiler bot iletileri olarak değerlendirilir ve bırakılır

  </Accordion>

  <Accordion title="Giden bahsetme takma adları">
    Agent'ların bilinen Discord kullanıcılarından belirleyici şekilde bahsetmesi gerektiğinde `mentionAliases` kullanın. Anahtarlar başında `@` bulunmayan kullanıcı adlarıdır; değerler Discord kullanıcı kimlikleridir. Bilinmeyen kullanıcı adları, `@everyone`, `@here` ve Markdown kod parçaları içindeki bahsetmeler değiştirilmeden bırakılır.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        SupportLead: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Durum yapılandırması">
    Bir durum veya etkinlik alanı ayarladığınızda ya da otomatik durumu etkinleştirdiğinizde durum güncellemeleri uygulanır.

    Yalnızca durum:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Etkinlik (`activity` ayarlandığında varsayılan etkinlik türü özel durumdur):

```json5
{
  channels: {
    discord: {
      activity: "Odaklanma zamanı",
      activityType: 4,
    },
  },
}
```

    Yayın:

```json5
{
  channels: {
    discord: {
      activity: "Canlı kodlama",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Etkinlik türü eşlemesi:

    - 0: Oynuyor
    - 1: Yayın yapıyor (`activityUrl` gerektirir; `activityUrl` da `activityType: 1` gerektirir)
    - 2: Dinliyor
    - 3: İzliyor
    - 4: Özel (etkinlik metnini durum olarak kullanır; emoji isteğe bağlıdır)
    - 5: Yarışıyor

    Otomatik durum (çalışma zamanı sağlık sinyali):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "belirteç tükendi",
      },
    },
  },
}
```

    Otomatik durum, çalışma zamanı kullanılabilirliğini Discord durumuna eşler: sağlıklı => çevrimiçi, bozulmuş veya bilinmiyor => boşta, tükenmiş veya kullanılamıyor => rahatsız etmeyin. Varsayılanlar: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (`intervalMs` değerinden küçük veya ona eşit olmalıdır). İsteğe bağlı metin geçersiz kılmaları:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` yer tutucusunu destekler)

  </Accordion>

  <Accordion title="Discord'da onaylar">
    Discord, doğrudan iletilerde düğme tabanlı onay işlemeyi destekler ve isteğe bağlı olarak onay istemlerini kaynak kanalda yayımlayabilir.

    Yapılandırma yolu:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` kullanılır)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    `enabled` ayarlanmamış veya `"auto"` olduğunda ve `execApprovals.approvers` ya da `commands.ownerAllowFrom` üzerinden en az bir onaylayan çözümlenebildiğinde Discord, yerel çalıştırma onaylarını otomatik olarak etkinleştirir. Discord; kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan ileti `defaultTo` değerlerinden çalıştırma onaylayanlarını çıkarmaz. Discord'u yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `/diagnostics` ve `/export-trajectory` gibi yalnızca sahibe açık hassas grup komutlarında OpenClaw, onay istemlerini ve nihai sonuçları özel olarak gönderir. Komutu çağıran sahibin bir Discord sahip rotası varsa önce Discord doğrudan iletisini dener; aksi takdirde Telegram gibi `commands.ownerAllowFrom` içindeki kullanılabilir ilk sahip rotasına geri döner.

    `target`, `channel` veya `both` olduğunda onay istemi kanalda görünür. Düğmeleri yalnızca çözümlenen onaylayanlar kullanabilir; diğer kullanıcılar yalnızca kendilerinin görebildiği bir ret iletisi alır. Onay istemleri komut metnini içerir; bu nedenle kanal teslimini yalnızca güvenilir kanallarda etkinleştirin. Kanal kimliği oturum anahtarından türetilemezse OpenClaw, doğrudan ileti teslimine geri döner.

    Discord, diğer sohbet kanallarının kullandığı ortak onay düğmelerini oluşturur; yerel Discord bağdaştırıcısı temel olarak onaylayanlara doğrudan ileti yönlendirmesi ve kanal dağıtımı ekler. Bu düğmeler mevcut olduğunda birincil onay kullanıcı deneyimini oluştururlar; OpenClaw yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya elle onayın tek yol olduğunu belirttiğinde elle kullanılan bir `/approve` komutu eklemelidir. Discord'un yerel onay çalışma zamanı etkin değilse OpenClaw, yerel ve belirleyici `/approve <id> <decision>` istemini görünür tutar. Çalışma zamanı etkinse ancak yerel kart hiçbir hedefe teslim edilemiyorsa OpenClaw, bekleyen onaydaki tam `/approve` komutunu içeren, aynı sohbette bir geri dönüş bildirimi gönderir.

    Gateway kimlik doğrulaması ve onay çözümlemesi, ortak Gateway istemci sözleşmesini izler (`plugin:` kimlikleri `plugin.approval.resolve` üzerinden, diğer kimlikler `exec.approval.resolve` üzerinden çözümlenir). Onayların süresi varsayılan olarak 30 dakika sonra dolar.

    Bkz. [Çalıştırma onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Araçlar ve eylem geçitleri

Discord ileti eylemleri; iletileşme, kanal yönetimi, moderasyon, durum ve meta verileri kapsar.

Temel örnekler:

- iletileşme: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- tepkiler: `react`, `reactions`, `emojiList`
- moderasyon: `timeout`, `kick`, `ban`
- durum: `setPresence`

`event-create` eylemi, planlanmış etkinliğin kapak görselini ayarlamak için isteğe bağlı bir `image` parametresi (URL veya yerel dosya yolu) kabul eder.

Eylem geçitleri `channels.discord.actions.*` altında bulunur.

Varsayılan geçit davranışı:

| Eylem grubu                                                                                                                                                              | Varsayılan        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | etkin             |
| roles                                                                                                                                                                    | devre dışı        |
| moderation                                                                                                                                                               | devre dışı        |
| presence                                                                                                                                                                 | devre dışı        |

## Bileşenler v2 kullanıcı arayüzü

OpenClaw, çalıştırma onayları ve bağlamlar arası işaretleyiciler için Discord bileşenleri v2'yi kullanır. Discord ileti eylemleri, özel kullanıcı arayüzü için `components` değerini de kabul edebilir (ileri düzey; Discord aracı aracılığıyla bir bileşen yükü oluşturulmasını gerektirir); eski `embeds` kullanılabilir durumda kalır ancak önerilmez.

- `channels.discord.ui.components.accentColor`, Discord bileşen kapsayıcılarının kullandığı vurgu rengini (onaltılık) ayarlar. Hesap başına: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs`, gönderilen Discord bileşeni geri çağırmalarının ne kadar süreyle kayıtlı kalacağını denetler (varsayılan `1800000`, azami `86400000`). Hesap başına: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- Bileşenler v2 mevcut olduğunda `embeds` yok sayılır.
- Düz URL önizlemeleri varsayılan olarak engellenir. Tek bir giden bağlantının genişletilmesi gerektiğinde ileti eyleminde `suppressEmbeds: false` ayarlayın.

Örnek:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Ses

Discord'un birbirinden farklı iki ses yüzeyi vardır: gerçek zamanlı **ses kanalları** (sürekli konuşmalar) ve **sesli ileti ekleri** (dalga biçimi önizleme biçimi). Gateway her ikisini de destekler.

### Ses kanalları

Kurulum denetim listesi:

1. Discord Developer Portal'da Message Content Intent'i etkinleştirin.
2. Rol/kullanıcı izin listeleri kullanıldığında Server Members Intent'i etkinleştirin.
3. Botu `bot` ve `applications.commands` kapsamlarıyla davet edin.
4. Hedef ses kanalında Connect, Speak, Send Messages ve Read Message History izinlerini verin.
5. Yerel komutları (`commands.native` veya `channels.discord.commands.native`) etkinleştirin.
6. `channels.discord.voice` yapılandırmasını yapın.

Oturumları denetlemek için `/vc join|leave|status` kullanın. Komut, hesabın varsayılan agent'ını kullanır ve diğer Discord komutlarıyla aynı izin listesi ve grup ilkesi kurallarını izler.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Katılmadan önce botun geçerli izinlerini incelemek için:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Otomatik katılma örneği:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Notlar:

- Discord sesi, yalnızca metin yapılandırmalarında isteğe bağlıdır; `/vc` komutlarını, ses çalışma zamanını ve `GuildVoiceStates` Gateway niyetini etkinleştirmek için `channels.discord.voice.enabled=true` olarak ayarlayın (veya mevcut bir `channels.discord.voice` bloğunu koruyun). `channels.discord.intents.voiceStates`, niyet aboneliğini açıkça geçersiz kılabilir; etkin ses ayarını takip etmesi için ayarlamadan bırakın.
- `voice.mode`, konuşma yolunu denetler. Varsayılan değer `agent-proxy`'dir: gerçek zamanlı bir ses ön ucu, konuşma sırası zamanlamasını, kesintiyi ve oynatmayı yönetir; esas işi `openclaw_agent_consult` aracılığıyla yönlendirilen OpenClaw aracısına devreder ve sonucu, o konuşmacıdan gelen yazılı bir Discord istemi gibi ele alır. `stt-tts`, eski toplu STT ve TTS akışını korur. `bidi`, OpenClaw beyni için `openclaw_agent_consult` erişimini sunarken gerçek zamanlı modelin doğrudan konuşmasına olanak tanır.
- `voice.agentSession`, sesli konuşma sıralarını hangi OpenClaw konuşmasının alacağını denetler. Ses kanalının kendi oturumu için ayarlamadan bırakın veya ses kanalının `#maintainers` gibi mevcut bir Discord metin kanalı oturumunun mikrofon/hoparlör uzantısı olarak çalışmasını sağlamak için `{ mode: "target", target: "channel:<text-channel-id>" }` olarak ayarlayın.
- `voice.model`, Discord sesli yanıtları ve gerçek zamanlı danışmalar için OpenClaw aracı beynini geçersiz kılar. Yönlendirilen aracı modelini devralması için ayarlamadan bırakın. Bu ayar, `voice.realtime.model` ayarından ayrıdır.
- `voice.followUsers`, botun seçilen kullanıcılarla birlikte Discord sesine katılmasını, taşınmasını ve ayrılmasını sağlar. Bkz. [Sesli konuşmada kullanıcıları takip etme](#follow-users-in-voice).
- `agent-proxy`, konuşmayı `discord-voice` üzerinden yönlendirir; bu, konuşmacı ve hedef oturum için normal sahip/araç yetkilendirmesini korurken Discord sesi oynatmayı yönettiği için aracının `tts` aracını gizler. Varsayılan olarak `agent-proxy`, sahip konuşmacıların danışmasına sahip ile eşdeğer tam araç erişimi verir (`voice.realtime.toolPolicy: "owner"`) ve esas yanıtları vermeden önce OpenClaw aracısına danışılmasını güçlü biçimde tercih eder (`voice.realtime.consultPolicy: "always"`). Bu varsayılan `always` modunda gerçek zamanlı katman, danışma yanıtından önce dolgu ifadelerini otomatik olarak seslendirmez; konuşmayı yakalayıp yazıya döker, ardından yönlendirilen OpenClaw yanıtını seslendirir. Discord hâlâ ilk yanıtı oynatırken birden fazla zorunlu danışma yanıtı tamamlanırsa sonraki birebir seslendirilecek yanıtlar, cümlenin ortasında konuşmanın yerini almak yerine oynatma boşta kalana kadar kuyruğa alınır.
- `stt-tts` modunda STT, `tools.media.audio` kullanır; `voice.model`, yazıya dökümü etkilemez.
- Gerçek zamanlı modlarda `voice.realtime.provider`, `voice.realtime.model` ve `voice.realtime.speakerVoice`, gerçek zamanlı ses oturumunu yapılandırır. OpenAI Realtime 2.1 ile Codex beynini kullanmak için `voice.realtime.model: "gpt-realtime-2.1"` ve `voice.model: "openai/gpt-5.6-sol"` ayarlarını kullanın.
- Gerçek zamanlı ses modları, hızlı doğrudan konuşma sıralarının yönlendirilen OpenClaw aracısıyla aynı kimliği, kullanıcı temellendirmesini ve kişiliği koruması için varsayılan olarak küçük `IDENTITY.md`, `USER.md` ve `SOUL.md` profil dosyalarını gerçek zamanlı sağlayıcı talimatlarına dahil eder. Bunu özelleştirmek için `voice.realtime.bootstrapContextFiles` ayarını bir alt kümeye, devre dışı bırakmak içinse `[]` değerine ayarlayın. Yalnızca bu profil dosyaları desteklenir; `AGENTS.md`, normal aracı bağlamında kalır. Eklenen profil bağlamı; çalışma alanı çalışmaları, güncel bilgiler, bellek araması veya araç destekli eylemler için `openclaw_agent_consult` işlevinin yerini almaz.
- OpenAI `agent-proxy` gerçek zamanlı modunda, yazıya döküm bir uyandırma adıyla başlayana veya bitene kadar Discord gerçek zamanlı sesini sessiz tutmak için `voice.realtime.requireWakeName: true` olarak ayarlayın. Yapılandırılan uyandırma adları bir veya iki sözcük olmalıdır. `voice.realtime.wakeNames` ayarlanmamışsa OpenClaw, yönlendirilen aracının `name` değerini ve `OpenClaw` adını kullanır; bunlar yoksa aracı kimliğini ve `OpenClaw` adını kullanır. Uyandırma adı denetimi, gerçek zamanlı sağlayıcının otomatik yanıtını devre dışı bırakır, kabul edilen konuşma sıralarını OpenClaw aracı danışma yolu üzerinden yönlendirir ve son yazıya döküm gelmeden önce kısmi yazıya dökümde baştaki bir uyandırma adı tanındığında kısa bir sesli onay verir.
- OpenAI gerçek zamanlı sağlayıcısı, çıkış sesi ve yazıya döküm olayları için güncel Realtime 2 olay adlarını ve eski Codex uyumlu diğer adları kabul eder; böylece uyumlu sağlayıcı anlık görüntüleri, asistan sesinin kaybolmasına yol açmadan farklılaşabilir.
- `voice.realtime.bargeIn`, Discord konuşmacı başlangıcı olaylarının etkin gerçek zamanlı oynatmayı kesip kesmeyeceğini denetler. Ayarlanmamışsa gerçek zamanlı sağlayıcının giriş sesi kesme ayarını takip eder.
- `voice.realtime.minBargeInAudioEndMs`, OpenAI gerçek zamanlı araya girişinin sesi kısaltmasından önceki minimum asistan oynatma süresini denetler. Varsayılan: `250`. Düşük yankılı odalarda anında kesinti için `0` olarak ayarlayın; yüksek yankılı hoparlör düzenlerinde değeri artırın.
- `voice.tts`, yalnızca `stt-tts` ses oynatması için `messages.tts` ayarını geçersiz kılar; gerçek zamanlı modlar bunun yerine `voice.realtime.speakerVoice` kullanır. Discord oynatmasında bir OpenAI sesi kullanmak için `voice.tts.provider: "openai"` olarak ayarlayın ve `voice.tts.providers.openai.speakerVoice` altında bir Metinden Konuşmaya ses seçin. `cedar`, güncel OpenAI TTS modelinde erkeksi tını için iyi bir seçimdir.
- Kanal başına Discord `systemPrompt` geçersiz kılmaları, ilgili ses kanalının ses yazıya döküm konuşma sıralarına uygulanır.
- Ses yazıya döküm konuşma sıraları, sahip kısıtlamalı komutlar ve kanal eylemleri için sahip durumunu Discord `allowFrom` (veya `dm.allowFrom`) ayarından türetir. Aracı araçlarının görünürlüğü, yönlendirilen oturum için yapılandırılmış araç politikasını takip eder.
- `voice.autoJoin`, aynı sunucu için birden fazla girdi içeriyorsa OpenClaw o sunucu için son yapılandırılan kanala katılır.
- `voice.allowedChannels`, isteğe bağlı bir kalış izin listesidir. `/vc join` ile yetkilendirilmiş herhangi bir Discord ses kanalına katılmaya izin vermek için ayarlamadan bırakın. Ayarlandığında `/vc join`, başlangıçta otomatik katılım ve botun ses durumu taşımaları, listelenen `{ guildId, channelId }` girdileriyle sınırlandırılır. Tüm Discord ses katılımlarını reddetmek için boş bir dizi olarak ayarlayın. Discord botu izin listesinin dışına taşırsa OpenClaw o kanaldan ayrılır ve mevcutsa yapılandırılmış otomatik katılım hedefine yeniden katılır.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` katılım seçeneklerine doğrudan aktarılır; üst kaynak varsayılanları `daveEncryption=true` ve `decryptionFailureTolerance=24` değerleridir.
- OpenClaw, Discord ses alımı ve gerçek zamanlı ham PCM oynatması için paketlenmiş `libopus-wasm` kodlayıcı/kod çözücüsünü kullanır. Sabitlenmiş bir libopus WebAssembly derlemesiyle birlikte gelir ve yerel opus eklentileri gerektirmez.
- `voice.connectTimeoutMs`, `/vc join` ve otomatik katılım denemeleri için başlangıçtaki `@discordjs/voice` Ready bekleme süresini denetler. Varsayılan: `30000`.
- `voice.reconnectGraceMs`, OpenClaw'un bağlantısı kesilmiş bir ses oturumunu sonlandırmadan önce yeniden bağlanmaya başlamasını ne kadar bekleyeceğini denetler. Varsayılan: `15000`.
- `stt-tts` modunda ses oynatma, yalnızca başka bir kullanıcı konuşmaya başladığı için durmaz. Geri besleme döngülerini önlemek amacıyla OpenClaw, TTS oynatılırken yeni ses yakalamayı yok sayar; sonraki konuşma sırası için oynatma tamamlandıktan sonra konuşun. Gerçek zamanlı modlar, konuşmacı başlangıçlarını araya giriş sinyalleri olarak gerçek zamanlı sağlayıcıya iletir.
- Gerçek zamanlı modlarda hoparlörlerden açık mikrofona gelen yankı, araya giriş gibi görünebilir ve oynatmayı kesebilir. Yüksek yankılı Discord odalarında OpenAI'ın giriş sesi üzerine otomatik kesinti yapmasını engellemek için `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` olarak ayarlayın. Discord konuşmacı başlangıcı olaylarının etkin oynatmayı yine de kesmesini istiyorsanız `voice.realtime.bargeIn: true` ekleyin. OpenAI gerçek zamanlı köprüsü, `voice.realtime.minBargeInAudioEndMs` değerinden kısa oynatma kısaltmalarını muhtemel yankı/gürültü olarak yok sayar ve Discord oynatmasını temizlemek yerine bunları atlandı olarak günlüğe kaydeder.
- `voice.captureSilenceGraceMs`, Discord bir konuşmacının durduğunu bildirdikten sonra OpenClaw'un ilgili ses bölümünü STT için sonlandırmadan önce ne kadar bekleyeceğini denetler. Varsayılan: `2000`; Discord normal duraklamaları kesik kısmi yazıya dökümlere bölüyorsa değeri artırın.
- Seçilen TTS sağlayıcısı ElevenLabs olduğunda Discord ses oynatması akışlı TTS kullanır ve sağlayıcı yanıt akışından başlar. Akış desteği olmayan sağlayıcılar, sentezlenmiş geçici dosya yoluna geri döner.
- OpenClaw, alım şifre çözme hatalarını izler ve kısa bir zaman aralığında tekrarlanan hatalardan sonra ses kanalından ayrılıp yeniden katılarak otomatik kurtarma gerçekleştirir.
- Güncellemeden sonra alım günlüklerinde sürekli `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` gösteriliyorsa bir bağımlılık raporu ve günlükleri toplayın. Paketlenmiş `@discordjs/voice` sürümü, discord.js PR #11449 ile gelen ve discord.js issue #11419'u kapatan üst kaynak dolgu düzeltmesini içerir.
- OpenClaw yakalanan bir konuşmacı bölümünü sonlandırdığında `The operation was aborted` alım olayları beklenir; bunlar ayrıntılı tanılama iletileridir, uyarı değildir.
- Ayrıntılı Discord ses günlükleri, kabul edilen her konuşmacı bölümü için sınırlandırılmış tek satırlık bir STT yazıya döküm önizlemesi içerir; böylece hata ayıklama sırasında sınırsız yazıya döküm metni dökülmeden hem kullanıcı tarafı hem de aracı yanıtı tarafı görülür.
- `agent-proxy` modunda zorunlu danışma geri dönüşü, `...` ile biten metinler veya "ve" gibi sonda kalan bağlaçlar başta olmak üzere muhtemelen tamamlanmamış yazıya döküm parçalarını ve "hemen döneceğim" ya da "hoşça kal" gibi açıkça eylem gerektirmeyen kapanışları atlar. Bu işlem eski bir kuyruk yanıtını engellediğinde günlüklerde `forced agent consult skipped reason=...` gösterilir.

### Sesli konuşmada kullanıcıları takip etme

Discord ses botunun başlangıçta sabit bir kanala katılmak veya `/vc join` komutunu beklemek yerine bilinen bir ya da daha fazla Discord kullanıcısıyla birlikte kalmasını istediğinizde `voice.followUsers` kullanın.

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

Davranış:

- `followUsers`, ham Discord kullanıcı kimliklerini ve `discord:<id>` değerlerini kabul eder. OpenClaw, ses durumu olaylarını eşleştirmeden önce her iki biçimi de normalleştirir.
- `followUsers` yapılandırıldığında `followUsersEnabled` varsayılan olarak `true` olur. Kayıtlı listeyi koruyup otomatik sesli takibi durdurmak için `false` olarak ayarlayın.
- Takip edilen bir kullanıcı izin verilen bir ses kanalına katıldığında OpenClaw o kanala katılır. Kullanıcı taşındığında OpenClaw da onunla birlikte taşınır. Etkin takip edilen kullanıcının bağlantısı kesildiğinde OpenClaw ayrılır.
- Aynı sunucuda birden fazla takip edilen kullanıcı varsa ve etkin takip edilen kullanıcı ayrılırsa OpenClaw, sunucudan ayrılmadan önce izlenen başka bir takip edilen kullanıcının kanalına taşınır. Birkaç takip edilen kullanıcı aynı anda taşınırsa en son gözlemlenen ses durumu olayı geçerli olur.
- `allowedChannels` uygulanmaya devam eder. İzin verilmeyen bir kanaldaki takip edilen kullanıcı yok sayılır ve takip sahipliğindeki bir oturum başka bir takip edilen kullanıcıya taşınır veya ayrılır.
- OpenClaw, başlangıçta ve sınırlandırılmış aralıklarla kaçırılmış ses durumu olaylarını uzlaştırır. Uzlaştırma, yapılandırılmış sunucuları örnekler ve çalıştırma başına REST aramalarını sınırlar; bu nedenle çok büyük `followUsers` listelerinin yakınsaması birden fazla aralık sürebilir.
- Discord veya bir yönetici, bot bir kullanıcıyı takip ederken botu taşırsa OpenClaw ses oturumunu yeniden oluşturur ve hedefe izin veriliyorsa takip sahipliğini korur. Bot `allowedChannels` dışına taşınırsa OpenClaw ayrılır ve mevcut olduğunda yapılandırılmış hedefe yeniden katılır.
- DAVE alım kurtarması, tekrarlanan şifre çözme hatalarından sonra aynı kanaldan ayrılıp yeniden katılabilir. Takip sahipliğindeki oturumlar, bu kurtarma yolu boyunca takip sahipliğini korur; böylece takip edilen kullanıcının daha sonra bağlantısının kesilmesi hâlinde kanaldan yine ayrılır.

Katılım modları arasında seçim yapın:

- Botun siz sesli konuşmadayken otomatik olarak sesli konuşmada bulunması gereken kişisel veya operatör kurulumları için `followUsers` kullanın.
- İzlenen hiçbir kullanıcı sesli konuşmada bulunmadığında bile hazır bulunması gereken sabit oda botları için `autoJoin` kullanın.
- Tek seferlik katılımlar veya otomatik sesli bulunmanın şaşırtıcı olacağı odalar için `/vc join` kullanın.

Discord ses kodlayıcı/kod çözücüsü:

- Ses alım günlükleri `discord voice: opus decoder: libopus-wasm` gösterir.
- Gerçek zamanlı oynatma, paketleri `@discordjs/voice` bileşenine aktarmadan önce ham 48 kHz stereo PCM'yi aynı paketlenmiş `libopus-wasm` paketiyle Opus biçiminde kodlar.
- Dosya ve sağlayıcı akışı oynatması, ffmpeg ile ham 48 kHz stereo PCM'ye dönüştürülür ve ardından Discord'a gönderilen Opus paket akışı için `libopus-wasm` kullanılır.

STT ve TTS işlem hattı:

- Discord PCM yakalaması geçici bir WAV dosyasına dönüştürülür.
- `tools.media.audio`, örneğin `openai/gpt-4o-mini-transcribe` ile STT işlemini gerçekleştirir.
- Transkript Discord girişi ve yönlendirmesi üzerinden gönderilirken yanıt LLM'si, Discord ses özelliği son TTS oynatmasını üstlendiğinden ajan `tts` aracını gizleyen ve döndürülen metni isteyen bir ses çıkışı ilkesiyle çalışır.
- `voice.model` ayarlandığında yalnızca bu ses kanalı sırasındaki yanıt LLM'sini geçersiz kılar.
- `voice.tts`, `messages.tts` üzerine birleştirilir; akış özelliğine sahip sağlayıcılar oynatıcıyı doğrudan besler, aksi takdirde oluşturulan ses dosyası katılınan kanalda oynatılır.

Varsayılan ajan proxy'si ses kanalı oturumu örneği:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

`voice.agentSession` bloğu olmadığında her ses kanalı kendi yönlendirilmiş OpenClaw oturumuna sahip olur. Örneğin `/vc join channel:234567890123456789`, ilgili Discord ses kanalının oturumuyla konuşur. Gerçek zamanlı model yalnızca ses ön yüzüdür; esas istekler yapılandırılmış OpenClaw ajanına aktarılır. Gerçek zamanlı model danışma aracını çağırmadan nihai bir transkript üretirse OpenClaw, varsayılan davranışın hâlâ ajanla konuşuyormuş gibi çalışmasını sağlamak için geri dönüş olarak danışmayı zorunlu kılar.

Eski STT ve TTS örneği:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

Gerçek zamanlı çift yönlü örnek:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Mevcut bir Discord kanal oturumunun uzantısı olarak ses:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

`agent-proxy` modunda bot yapılandırılmış ses kanalına katılır, ancak OpenClaw ajan sıraları hedef kanalın normal yönlendirilmiş oturumunu ve ajanını kullanır. Gerçek zamanlı ses oturumu döndürülen sonucu ses kanalında seslendirir. Denetleyici ajan, ayrı bir Discord mesajı göndermek doğru eylemse bunu yapmak da dâhil olmak üzere araç ilkesine göre normal mesaj araçlarını kullanmaya devam edebilir.

Devredilmiş bir OpenClaw çalışması etkinken yeni Discord ses transkriptleri, başka bir ajan sırası başlatılmadan önce canlı çalışma denetimi olarak işlenir. "durum", "onu iptal et", "daha küçük düzeltmeyi kullan" veya "işin bittiğinde testleri de kontrol et" gibi ifadeler etkin oturum için durum, iptal, yönlendirme veya takip girdisi olarak sınıflandırılır. Durum, iptal, kabul edilen yönlendirme ve takip sonuçları ses kanalında seslendirilir; böylece arayan kişi OpenClaw'ın isteği işleyip işlemediğini bilir.

Kullanışlı hedef biçimleri:

- `target: "channel:123456789012345678"`, bir Discord metin kanalı oturumu üzerinden yönlendirir.
- `target: "123456789012345678"`, kanal hedefi olarak değerlendirilir.
- `target: "dm:123456789012345678"` veya `target: "user:123456789012345678"`, ilgili doğrudan mesaj oturumu üzerinden yönlendirir.

Yankının yoğun olduğu OpenAI Realtime örneği:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

Model açık bir mikrofon üzerinden kendi Discord oynatmasını duyduğunda, ancak konuşarak yine de sözünü kesmek istediğinizde bunu kullanın. OpenClaw, OpenAI'ın ham giriş sesi nedeniyle otomatik olarak kesintiye uğramasını engellerken `bargeIn: true`, bir sonraki yakalanan sıra OpenAI'a ulaşmadan önce Discord konuşmacı başlangıcı olaylarının ve hâlihazırda etkin olan konuşmacı sesinin etkin gerçek zamanlı yanıtları iptal etmesine olanak tanır. `audioEndMs` değeri `minBargeInAudioEndMs` değerinin altında olan çok erken söz kesme sinyalleri muhtemel yankı/gürültü olarak değerlendirilip yok sayılır; böylece model ilk oynatma karesinde kesilmez.

Beklenen ses günlükleri:

- Katılma sırasında: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Gerçek zamanlı başlatma sırasında: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Konuşmacı sesi sırasında: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` ve `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Güncelliğini yitirmiş konuşma atlandığında: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` veya `reason=non-actionable-closing ...`
- Gerçek zamanlı yanıt tamamlandığında: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Oynatma durdurulduğunda/sıfırlandığında: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Gerçek zamanlı danışma sırasında: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Ajan yanıtı sırasında: `discord voice: agent turn answer ...`
- Tam konuşma kuyruğa alındığında: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, ardından `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Söz kesme algılandığında: `discord voice: realtime barge-in detected source=speaker-start ...` veya `discord voice: realtime barge-in detected source=active-speaker-audio ...`, ardından `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Gerçek zamanlı kesinti sırasında: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, ardından `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` veya `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Yankı/gürültü yok sayıldığında: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Söz kesme devre dışı olduğunda: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Oynatma boştayken: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Kesilen ses sorunlarını ayıklamak için gerçek zamanlı ses günlüklerini bir zaman çizelgesi olarak okuyun:

1. `realtime audio playback started`, Discord'un yardımcı sesini oynatmaya başladığı anlamına gelir. Köprü bu noktadan itibaren yardımcı çıkış parçalarını, Discord PCM baytlarını, sağlayıcının gerçek zamanlı baytlarını ve sentezlenen ses süresini saymaya başlar.
2. `realtime speaker turn opened`, bir Discord konuşmacısının etkinleştiğini belirtir. Oynatma zaten etkinse ve `bargeIn` etkinleştirilmişse bunu `barge-in detected source=speaker-start` izleyebilir.
3. `realtime input audio started`, ilgili konuşmacı sırası için alınan ilk gerçek ses karesini belirtir. Buradaki `outputActive=true` veya sıfırdan farklı bir `outputAudioMs`, yardımcı oynatması hâlâ etkinken mikrofonun giriş gönderdiği anlamına gelir.
4. `barge-in detected source=active-speaker-audio`, OpenClaw'ın yardımcı oynatması etkinken canlı konuşmacı sesi algıladığı anlamına gelir. Bu, gerçek bir kesintiyi kullanılabilir ses içermeyen bir Discord konuşmacı başlangıcı olayından ayırt etmek için kullanışlıdır.
5. `barge-in requested reason=...`, OpenClaw'ın gerçek zamanlı sağlayıcıdan etkin yanıtı iptal etmesini veya kısaltmasını istediği anlamına gelir. Kesintiden önce gerçekte ne kadar yardımcı sesi oynatıldığını görebilmeniz için `outputAudioMs`, `outputActive` ve `playbackChunks` değerlerini içerir.
6. `realtime audio playback stopped reason=...`, yerel Discord oynatmasının sıfırlanma noktasıdır. Neden, oynatmayı kimin durdurduğunu belirtir: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` veya `session-close`.
7. `realtime speaker turn closed`, yakalanan giriş sırasını özetler. `chunks=0` veya `hasAudio=false`, konuşmacı sırasının açıldığı ancak gerçek zamanlı köprüye kullanılabilir ses ulaşmadığı anlamına gelir. `interruptedPlayback=true`, bu giriş sırasının yardımcı çıkışıyla çakıştığı ve söz kesme mantığını tetiklediği anlamına gelir.

Kullanışlı alanlar:

- `outputAudioMs`: günlük satırından önce gerçek zamanlı sağlayıcının oluşturduğu yardımcı sesi süresi.
- `audioMs`: oynatma durmadan önce OpenClaw'ın saydığı yardımcı sesi süresi.
- `elapsedMs`: oynatma akışının veya konuşmacı sırasının açılmasıyla kapanması arasındaki gerçek zaman süresi.
- `discordBytes`: Discord sesine gönderilen veya Discord sesinden alınan 48 kHz stereo PCM baytları.
- `realtimeBytes`: gerçek zamanlı sağlayıcıya gönderilen veya sağlayıcıdan alınan, sağlayıcı biçimindeki PCM baytları.
- `playbackChunks`: etkin yanıt için Discord'a iletilen yardımcı ses parçaları.
- `sinceLastAudioMs`: yakalanan son konuşmacı ses karesiyle konuşmacı sırasının kapanması arasındaki boşluk.

Yaygın örüntüler:

- `source=active-speaker-audio`, küçük bir `outputAudioMs` ve yakında aynı kullanıcı varken oluşan anında kesilme, genellikle mikrofona giren hoparlör yankısına işaret eder. `voice.realtime.minBargeInAudioEndMs` değerini yükseltin, hoparlör sesini azaltın, kulaklık kullanın veya `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` olarak ayarlayın.
- `source=speaker-start` sonrasında `speaker turn closed ... hasAudio=false` görülmesi, Discord'un bir konuşmacı başlangıcı bildirdiği ancak OpenClaw'a ses ulaşmadığı anlamına gelir. Bu, geçici bir Discord ses olayı, gürültü kapısı davranışı veya istemcinin mikrofonu kısa süreliğine etkinleştirmesi olabilir.
- Yakınında bir söz kesme veya `provider-clear-audio` olmadan `audio playback stopped reason=stream-close` görülmesi, yerel Discord oynatma akışının beklenmedik biçimde sona erdiği anlamına gelir. Önceki sağlayıcı ve Discord oynatıcı günlüklerini kontrol edin.
- `capture ignored during playback (barge-in disabled)`, yardımcı sesi etkinken OpenClaw'ın girişi kasıtlı olarak bıraktığı anlamına gelir. Konuşmanın oynatmayı kesmesini istiyorsanız `voice.realtime.bargeIn` özelliğini etkinleştirin.
- `barge-in ignored ... outputActive=false`, Discord veya sağlayıcı VAD'sinin konuşma bildirdiği ancak OpenClaw'ın kesilecek etkin bir oynatması olmadığı anlamına gelir. Bu durum sesi kesmemelidir.

Kimlik bilgileri bileşen bazında çözümlenir: `voice.model` için LLM yönlendirme kimlik doğrulaması, `tools.media.audio` için STT kimlik doğrulaması, `messages.tts`/`voice.tts` için TTS kimlik doğrulaması ve `voice.realtime.providers` ya da sağlayıcının normal kimlik doğrulama yapılandırması için gerçek zamanlı sağlayıcı kimlik doğrulaması.

### Sesli mesajlar

Discord sesli mesajları bir dalga biçimi önizlemesi gösterir ve OGG/Opus ses gerektirir. OpenClaw dalga biçimini otomatik olarak oluşturur, ancak inceleme ve dönüştürme işlemleri için Gateway ana makinesinde `ffmpeg` ve `ffprobe` bulunması gerekir.

- Bir **yerel dosya yolu** sağlayın (URL'ler reddedilir).
- Metin içeriğini eklemeyin (Discord aynı yükte metin ile sesli mesajı birlikte reddeder).
- Herhangi bir ses biçimi kabul edilir; OpenClaw gerektiğinde OGG/Opus biçimine dönüştürür.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - Message Content Intent'i etkinleştirin
    - kullanıcı/üye çözümlemesine bağımlı olduğunuzda Server Members Intent'i etkinleştirin
    - intent'leri değiştirdikten sonra Gateway'i yeniden başlatın

  </Accordion>

  <Accordion title="Sunucu mesajları beklenmedik şekilde engelleniyor">

    - `groupPolicy` değerini doğrulayın
    - `channels.discord.guilds` altındaki sunucu izin listesini doğrulayın
    - bir sunucuda `channels` eşlemesi varsa yalnızca listelenen kanallara izin verilir
    - `requireMention` davranışını ve bahsetme kalıplarını doğrulayın

    Yararlı kontroller:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Bahsetme zorunluluğu kapalı olmasına rağmen hâlâ engelleniyor">
    Yaygın nedenler:

    - eşleşen bir sunucu/kanal izin listesi olmadan `groupPolicy="allowlist"`
    - `requireMention` yanlış yerde yapılandırılmıştır (`channels.discord.guilds` veya bir kanal girdisi altında olmalıdır)
    - gönderen, sunucu/kanal `users` izin listesi tarafından engellenmiştir

  </Accordion>

  <Accordion title="Uzun süren Discord turları veya yinelenen yanıtlar">

    Tipik günlükler:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway kuyruğu ayarları:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çoklu hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - bu yalnızca Discord Gateway dinleyicisinin çalışmasını denetler, ajan turunun ömrünü değil

    Discord, kuyruğa alınmış ajan turlarına kanalın yönettiği bir zaman aşımı uygulamaz. Mesaj dinleyicileri işi hemen devreder ve kuyruğa alınan Discord çalıştırmaları, oturum/araç/çalışma zamanı yaşam döngüsü tamamlanana veya işi iptal edene kadar oturum bazındaki sıralamayı korur.

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway meta veri arama zaman aşımı uyarıları">
    OpenClaw, bağlanmadan önce Discord `/gateway/bot` meta verilerini getirir. Geçici hatalarda Discord'un varsayılan Gateway URL'sine geri dönülür ve günlüklerde hız sınırlaması uygulanır.

    Meta veri zaman aşımı ayarları:

    - tek hesap: `channels.discord.gatewayInfoTimeoutMs`
    - çoklu hesap: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - yapılandırma ayarlanmamışsa ortam değişkeni geri dönüşü: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - varsayılan: `30000` (30 saniye), en fazla: `120000`

  </Accordion>

  <Accordion title="Gateway READY zaman aşımı nedeniyle yeniden başlatmalar">
    OpenClaw, başlangıç sırasında ve çalışma zamanı yeniden bağlantılarından sonra Discord Gateway'inin `READY` olayını bekler. Başlangıçları kademeli yapılan çoklu hesap kurulumları, varsayılandan daha uzun bir başlangıç READY süresine ihtiyaç duyabilir.

    READY zaman aşımı ayarları:

    - başlangıçta tek hesap: `channels.discord.gatewayReadyTimeoutMs`
    - başlangıçta çoklu hesap: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa başlangıç ortam değişkeni geri dönüşü: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - başlangıç varsayılanı: `15000` (15 saniye), en fazla: `120000`
    - çalışma zamanında tek hesap: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - çalışma zamanında çoklu hesap: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa çalışma zamanı ortam değişkeni geri dönüşü: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - çalışma zamanı varsayılanı: `30000` (30 saniye), en fazla: `120000`

  </Accordion>

  <Accordion title="İzin denetimi uyuşmazlıkları">
    `channels status --probe` izin kontrolleri yalnızca sayısal kanal kimlikleriyle çalışır.

    Kısa ad anahtarları kullanırsanız çalışma zamanı eşleştirmesi yine çalışabilir ancak yoklama, izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM ve eşleştirme sorunları">

    - DM devre dışı: `channels.discord.dm.enabled=false`
    - DM ilkesi devre dışı: `channels.discord.dmPolicy="disabled"` (eski: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Botlar arası döngüler">
    Varsayılan olarak botlar tarafından yazılan mesajlar yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız döngü davranışını önlemek için katı bahsetme ve izin listesi kuralları kullanın.
    Yalnızca bottan bahseden bot mesajlarını kabul etmek için `channels.discord.allowBots="mentions"` tercih edin.

    OpenClaw ayrıca ortak [bot döngüsü koruması](/tr/channels/bot-loop-protection) sunar. `allowBots`, botlar tarafından yazılan mesajların dağıtıma ulaşmasına izin verdiğinde Discord, gelen olayı `(hesap, kanal, bot çifti)` olgularına eşler ve genel çift koruması, yapılandırılan olay bütçesi aşıldıktan sonra çifti baskılar. Koruma, daha önce Discord hız sınırlarıyla durdurulması gereken kontrolsüz iki botlu döngüleri önler; tek botlu dağıtımları veya bütçenin altında kalan tek seferlik bot yanıtlarını etkilemez.

    Varsayılan ayarlar (`allowBots` ayarlandığında etkin):

    - `maxEventsPerWindow: 20` -- bot çifti, kayan pencere içinde 20 mesaj alışverişi yapabilir
    - `windowSeconds: 60` -- kayan pencerenin uzunluğu
    - `cooldownSeconds: 60` -- bütçe aşıldığında her iki yöndeki tüm ek botlar arası mesajlar bir dakika boyunca bırakılır

    Ortak varsayılanı bir kez `channels.defaults.botLoopProtection` altında yapılandırın, ardından geçerli bir iş akışı daha fazla kapasite gerektiriyorsa Discord için geçersiz kılın. Öncelik sırası şöyledir:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - yerleşik varsayılanlar

    Discord genel `maxEventsPerWindow`, `windowSeconds` ve `cooldownSeconds` anahtarlarını kullanır.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // İsteğe bağlı, Discord genelinde geçersiz kılma. Hesap blokları bağımsız
      // alanları geçersiz kılar ve atlanan alanları buradan devralır.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha yalnızca kendisinden bahsettiklerinde diğer botları dinler.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo, botlar tarafından yazılan tüm Discord mesajlarını dinler.
          allowBots: true,
          mentionAliases: {
            // Bravo'nun yapılandırılmış kullanıcı kimliğiyle Alpha için Discord bahsetmesi yazmasını sağlar.
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Çifti baskılamadan önce dakikada en fazla beş mesaja izin verin.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="DecryptionFailed(...) nedeniyle ses STT kesintileri">

    - Discord ses alımı kurtarma mantığının mevcut olması için OpenClaw'ı güncel tutun (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` olduğunu doğrulayın (varsayılan)
    - `channels.discord.voice.decryptionFailureTolerance=24` (üst kaynak varsayılanı) ile başlayın ve yalnızca gerekirse ayarlayın
    - günlüklerde şunları izleyin:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - otomatik yeniden katılmadan sonra hatalar sürerse günlükleri toplayın ve [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) ile [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) içindeki üst kaynak DAVE alım geçmişiyle karşılaştırın

  </Accordion>
</AccordionGroup>

## Yapılandırma referansı

Birincil referans: [Yapılandırma referansı - Discord](/tr/gateway/config-channels#discord).

<Accordion title="Yüksek sinyalli Discord alanları">

- başlangıç/kimlik doğrulama: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- ilke: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- komut: `commands.native`, `commands.useAccessGroups` (genel), `configWrites`, `slashCommand.ephemeral`
- olay kuyruğu: `eventQueue.listenerTimeout` (dinleyici bütçesi, varsayılan `120000`), `eventQueue.maxQueueSize` (varsayılan `10000`), `eventQueue.maxConcurrency` (varsayılan `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- yanıt/geçmiş: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- teslimat: `textChunkLimit` (varsayılan `2000`), `maxLinesPerMessage` (varsayılan `17`)
- akış: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (eski düz `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` anahtarları `openclaw doctor --fix` tarafından `streaming.*` içine taşınır)
- medya/yeniden deneme: `mediaMaxMb` (giden Discord yüklemelerini sınırlar, varsayılan `100`), `retry`
- eylemler: `actions.*`
- durum: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- kullanıcı arayüzü: `ui.components.accentColor`
- özellikler: `threadBindings`, üst düzey `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Güvenlik ve işletim

- Bot token'larını gizli bilgi olarak değerlendirin (gözetimli ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- Discord izinlerini en düşük ayrıcalık ilkesiyle verin.
- Komut dağıtımı/durumu güncelliğini yitirmişse Gateway'i yeniden başlatın ve `openclaw channels status --probe` ile tekrar kontrol edin.

## İlgili

<CardGroup cols={2}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bir Discord kullanıcısını Gateway ile eşleştirin.
  </Card>
  <Card title="Gruplar" icon="users" href="/tr/channels/groups">
    Grup sohbeti ve izin listesi davranışı.
  </Card>
  <Card title="Kanal yönlendirme" icon="route" href="/tr/channels/channel-routing">
    Gelen mesajları ajanlara yönlendirin.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sağlamlaştırma.
  </Card>
  <Card title="Çok ajanlı yönlendirme" icon="sitemap" href="/tr/concepts/multi-agent">
    Sunucuları ve kanalları ajanlarla eşleyin.
  </Card>
  <Card title="Eğik çizgi komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı.
  </Card>
</CardGroup>
