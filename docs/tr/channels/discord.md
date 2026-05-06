---
read_when:
    - Discord kanalı özellikleri üzerinde çalışma
summary: Discord bot desteği durumu, yetenekleri ve yapılandırması
title: Discord
x-i18n:
    generated_at: "2026-05-06T17:52:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 11cc911dbc569db7a31ce4a16de167bc8ea771d1dd7842cb151f666f3cb9285b
    source_path: channels/discord.md
    workflow: 16
---

DM'ler ve guild kanalları için resmi Discord gateway üzerinden hazır.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Discord DM'leri varsayılan olarak eşleştirme moduna geçer.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım akışı.
  </Card>
</CardGroup>

## Hızlı kurulum

Bot içeren yeni bir uygulama oluşturmanız, botu sunucunuza eklemeniz ve OpenClaw ile eşleştirmeniz gerekir. Botunuzu kendi özel sunucunuza eklemenizi öneririz. Henüz yoksa [önce bir tane oluşturun](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** seçeneğini seçin).

<Steps>
  <Step title="Create a Discord application and bot">
    [Discord Developer Portal](https://discord.com/developers/applications) adresine gidin ve **New Application** seçeneğine tıklayın. "OpenClaw" gibi bir ad verin.

    Kenar çubuğunda **Bot** seçeneğine tıklayın. **Username** değerini OpenClaw agent'ınız için kullandığınız ada ayarlayın.

  </Step>

  <Step title="Enable privileged intents">
    Hala **Bot** sayfasındayken **Privileged Gateway Intents** bölümüne kaydırın ve şunları etkinleştirin:

    - **Message Content Intent** (gerekli)
    - **Server Members Intent** (önerilir; rol izin listeleri ve ad-ID eşleştirmesi için gereklidir)
    - **Presence Intent** (isteğe bağlı; yalnızca durum güncellemeleri için gerekir)

  </Step>

  <Step title="Copy your bot token">
    **Bot** sayfasında tekrar yukarı kaydırın ve **Reset Token** seçeneğine tıklayın.

    <Note>
    Adına rağmen bu işlem ilk token'ınızı oluşturur; hiçbir şey "resetlenmiyor."
    </Note>

    Token'ı kopyalayın ve bir yere kaydedin. Bu sizin **Bot Token** değerinizdir ve kısa süre sonra buna ihtiyacınız olacak.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    Kenar çubuğunda **OAuth2** seçeneğine tıklayın. Botu sunucunuza eklemek için doğru izinlere sahip bir davet URL'si oluşturacaksınız.

    **OAuth2 URL Generator** bölümüne kaydırın ve şunları etkinleştirin:

    - `bot`
    - `applications.commands`

    Aşağıda bir **Bot Permissions** bölümü görünür. En az şunları etkinleştirin:

    **Genel İzinler**
      - Kanalları Görüntüle
    **Metin İzinleri**
      - Mesaj Gönder
      - Mesaj Geçmişini Oku
      - Bağlantıları Yerleştir
      - Dosya Ekle
      - Tepki Ekle (isteğe bağlı)

    Bu, normal metin kanalları için temel kümedir. Forum veya medya kanalı iş akışları dahil bir konu oluşturan ya da sürdüren Discord konularında paylaşım yapmayı planlıyorsanız **Send Messages in Threads** seçeneğini de etkinleştirin.
    Altta oluşturulan URL'yi kopyalayın, tarayıcınıza yapıştırın, sunucunuzu seçin ve bağlanmak için **Continue** seçeneğine tıklayın. Artık botunuzu Discord sunucusunda görmelisiniz.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    Discord uygulamasına geri dönün; dahili ID'leri kopyalayabilmek için Developer Mode'u etkinleştirmeniz gerekir.

    1. **User Settings** seçeneğine tıklayın (avatarınızın yanındaki dişli simgesi) → **Advanced** → **Developer Mode** seçeneğini açın
    2. Kenar çubuğundaki **sunucu simgenize** sağ tıklayın → **Copy Server ID**
    3. **Kendi avatarınıza** sağ tıklayın → **Copy User ID**

    **Server ID** ve **User ID** değerlerinizi Bot Token'ınızın yanına kaydedin; sonraki adımda üçünü de OpenClaw'a göndereceksiniz.

  </Step>

  <Step title="Allow DMs from server members">
    Eşleştirmenin çalışması için Discord'un botunuzun size DM göndermesine izin vermesi gerekir. **Sunucu simgenize** sağ tıklayın → **Privacy Settings** → **Direct Messages** seçeneğini açın.

    Bu, sunucu üyelerinin (botlar dahil) size DM göndermesine izin verir. OpenClaw ile Discord DM'lerini kullanmak istiyorsanız bunu etkin bırakın. Yalnızca guild kanallarını kullanmayı planlıyorsanız eşleştirmeden sonra DM'leri devre dışı bırakabilirsiniz.

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    Discord bot token'ınız bir sırdır (parola gibi). Agent'ınıza mesaj göndermeden önce bunu OpenClaw çalıştıran makinede ayarlayın.

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

    OpenClaw zaten arka plan servisi olarak çalışıyorsa OpenClaw Mac uygulaması üzerinden veya `openclaw gateway run` sürecini durdurup yeniden başlatarak yeniden başlatın.
    Yönetilen servis kurulumları için `DISCORD_BOT_TOKEN` değerinin bulunduğu bir kabuktan `openclaw gateway install` çalıştırın ya da değişkeni `~/.openclaw/.env` içinde saklayın; böylece servis yeniden başlatıldıktan sonra env SecretRef değerini çözebilir.
    Ana makineniz Discord'un başlangıç uygulama araması tarafından engelleniyor veya hız sınırına takılıyorsa, başlangıcın bu REST çağrısını atlayabilmesi için Discord uygulama/client ID'sini Developer Portal'dan ayarlayın. Varsayılan hesap için `channels.discord.applicationId`, birden fazla Discord botu çalıştırdığınızda ise `channels.discord.accounts.<accountId>.applicationId` kullanın.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        OpenClaw agent'ınızla mevcut herhangi bir kanalda (ör. Telegram) sohbet edin ve ona söyleyin. Discord ilk kanalınızsa bunun yerine CLI / config sekmesini kullanın.

        > "Discord bot token'ımı config içinde zaten ayarladım. Lütfen User ID `<user_id>` ve Server ID `<server_id>` ile Discord kurulumunu tamamla."
      </Tab>
      <Tab title="CLI / config">
        Dosya tabanlı config tercih ediyorsanız şunu ayarlayın:

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

        Varsayılan hesap için env yedeği:

```bash
DISCORD_BOT_TOKEN=...
```

        Betikli veya uzak kurulum için aynı JSON5 bloğunu `openclaw config patch --file ./discord.patch.json5 --dry-run` ile yazın ve ardından `--dry-run` olmadan yeniden çalıştırın. Düz metin `token` değerleri desteklenir. SecretRef değerleri de env/file/exec sağlayıcıları genelinde `channels.discord.token` için desteklenir. Bkz. [Secrets Management](/tr/gateway/secrets).

        Birden fazla Discord botu için her bot token'ını ve uygulama ID'sini kendi hesabı altında tutun. Üst düzey `channels.discord.applicationId` hesaplar tarafından devralınır; bu nedenle yalnızca her hesabın aynı uygulama ID'sini kullanması gerektiğinde orada ayarlayın.

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

  <Step title="Approve first DM pairing">
    Gateway çalışana kadar bekleyin, ardından Discord'da botunuza DM gönderin. Bir eşleştirme koduyla yanıt verir.

    <Tabs>
      <Tab title="Ask your agent">
        Eşleştirme kodunu mevcut kanalınızda agent'ınıza gönderin:

        > "Bu Discord eşleştirme kodunu onayla: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Eşleştirme kodlarının süresi 1 saat sonra dolar.

    Artık Discord'da DM üzerinden agent'ınızla sohbet edebilmelisiniz.

  </Step>
</Steps>

<Note>
Token çözümleme hesap farkındadır. Config token değerleri env yedeğine göre önceliklidir. `DISCORD_BOT_TOKEN` yalnızca varsayılan hesap için kullanılır.
Etkinleştirilmiş iki Discord hesabı aynı bot token'ına çözümlenirse OpenClaw bu token için yalnızca bir gateway izleyicisi başlatır. Config kaynaklı token, varsayılan env yedeğine göre önceliklidir; aksi takdirde ilk etkin hesap kazanır ve yinelenen hesap devre dışı olarak raporlanır.
Gelişmiş giden çağrılar (mesaj aracı/kanal eylemleri) için çağrı başına açık bir `token` kullanılır. Bu, gönderme ve okuma/yoklama tarzı eylemler için geçerlidir (örneğin read/search/fetch/thread/pins/permissions). Hesap ilkesi/yeniden deneme ayarları yine etkin çalışma zamanı anlık görüntüsünde seçilen hesaptan gelir.
</Note>

## Önerilir: Bir guild çalışma alanı ayarlayın

DM'ler çalıştıktan sonra Discord sunucunuzu her kanalın kendi bağlamıyla kendi agent oturumunu aldığı tam bir çalışma alanı olarak ayarlayabilirsiniz. Bu, yalnızca siz ve botunuzun olduğu özel sunucular için önerilir.

<Steps>
  <Step title="Add your server to the guild allowlist">
    Bu, agent'ınızın yalnızca DM'lerde değil, sunucunuzdaki herhangi bir kanalda yanıt vermesini sağlar.

    <Tabs>
      <Tab title="Ask your agent">
        > "Discord Server ID `<server_id>` değerimi guild allowlist'e ekle"
      </Tab>
      <Tab title="Config">

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

  <Step title="Allow responses without @mention">
    Varsayılan olarak agent'ınız guild kanallarında yalnızca @mention edildiğinde yanıt verir. Özel bir sunucu için muhtemelen her mesaja yanıt vermesini istersiniz.

    Guild kanallarında, normal asistan final yanıtları varsayılan olarak özel kalır. Görünür Discord çıktısı `message` aracıyla açıkça gönderilmelidir; böylece agent varsayılan olarak sessizce izleyebilir ve yalnızca kanal yanıtının yararlı olduğuna karar verdiğinde paylaşım yapabilir.

    Bu, seçilen modelin araçları güvenilir şekilde çağırması gerektiği anlamına gelir. Discord yazıyor gösteriyor ve log'lar token kullanımını gösteriyor ancak hiçbir mesaj paylaşılmıyorsa, oturum log'unda `didSendViaMessagingTool: false` ile asistan metnini kontrol edin. Bu, modelin `message(action=send)` çağırmak yerine özel bir final yanıtı ürettiği anlamına gelir. Daha güçlü bir araç çağırma modeline geçin veya eski otomatik final yanıtlarını geri yüklemek için aşağıdaki config'i kullanın.

    <Tabs>
      <Tab title="Ask your agent">
        > "Agent'ımın bu sunucuda @mention edilmek zorunda kalmadan yanıt vermesine izin ver"
      </Tab>
      <Tab title="Config">
        Guild config'inizde `requireMention: false` ayarlayın:

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

        Grup/kanal odaları için eski otomatik final yanıtlarını geri yüklemek üzere `messages.groupChat.visibleReplies: "automatic"` ayarlayın.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    Varsayılan olarak uzun vadeli bellek (MEMORY.md) yalnızca DM oturumlarında yüklenir. Guild kanalları MEMORY.md dosyasını otomatik yüklemez.

    <Tabs>
      <Tab title="Ask your agent">
        > "Discord kanallarında soru sorduğumda MEMORY.md dosyasından uzun vadeli bağlama ihtiyacın olursa memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Manual">
        Her kanalda paylaşılan bağlama ihtiyacınız varsa kararlı talimatları `AGENTS.md` veya `USER.md` içine koyun (her oturuma enjekte edilirler). Uzun vadeli notları `MEMORY.md` içinde tutun ve gerektiğinde bellek araçlarıyla erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Şimdi Discord sunucunuzda birkaç kanal oluşturun ve sohbete başlayın. Agent'ınız kanal adını görebilir ve her kanal kendi yalıtılmış oturumunu alır; böylece `#coding`, `#home`, `#research` veya iş akışınıza uyan herhangi bir şeyi ayarlayabilirsiniz.

## Çalışma zamanı modeli

- Gateway, Discord bağlantısının sahibidir.
- Yanıt yönlendirme deterministiktir: Discord gelen yanıtları Discord'a geri döner.
- Discord sunucu/kanal meta verileri, kullanıcıya görünür bir yanıt öneki olarak değil, güvenilmeyen
  bağlam olarak model istemine eklenir. Bir model bu zarfı
  geri kopyalarsa OpenClaw, kopyalanan meta verileri giden yanıtlardan ve
  gelecekteki yeniden oynatma bağlamından çıkarır.
- Varsayılan olarak (`session.dmScope=main`), doğrudan sohbetler aracının ana oturumunu paylaşır (`agent:main:main`).
- Sunucu kanalları izole oturum anahtarlarıdır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM'leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel slash komutları izole komut oturumlarında çalışır (`agent:<agentId>:discord:slash:<userId>`), ancak yönlendirilen konuşma oturumuna `CommandTargetSessionKey` taşımaya devam eder.
- Discord'a metin tabanlı cron/heartbeat duyuru teslimi, son
  yardımcıya görünür yanıtı bir kez kullanır. Medya ve yapılandırılmış bileşen yükleri,
  aracı birden çok teslim edilebilir yük yaydığında çok mesajlı kalır.

## Forum kanalları

Discord forum ve medya kanalları yalnızca thread gönderilerini kabul eder. OpenClaw bunları oluşturmak için iki yolu destekler:

- Otomatik olarak thread oluşturmak için forum üst öğesine (`channel:<forumId>`) bir mesaj gönderin. Thread başlığı, mesajınızın ilk boş olmayan satırını kullanır.
- Doğrudan thread oluşturmak için `openclaw message thread create` kullanın. Forum kanalları için `--message-id` geçmeyin.

Örnek: thread oluşturmak için forum üst öğesine gönderin

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Örnek: açıkça bir forum thread'i oluşturun

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum üst öğeleri Discord bileşenlerini kabul etmez. Bileşenlere ihtiyacınız varsa thread'in kendisine gönderin (`channel:<threadId>`).

## Etkileşimli bileşenler

OpenClaw, aracı mesajları için Discord components v2 kapsayıcılarını destekler. Mesaj aracını bir `components` yüküyle kullanın. Etkileşim sonuçları aracıya normal gelen mesajlar olarak geri yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Eylem satırları en fazla 5 düğmeye veya tek bir seçim menüsüne izin verir
- Seçim türleri: `string`, `user`, `role`, `mentionable`, `channel`

Varsayılan olarak bileşenler tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süreleri dolana kadar birden çok kez kullanılmasına izin vermek için `components.reusable=true` ayarlayın.

Bir düğmeye kimin tıklayabileceğini kısıtlamak için o düğmede `allowedUsers` ayarlayın (Discord kullanıcı kimlikleri, etiketleri veya `*`). Yapılandırıldığında, eşleşmeyen kullanıcılar geçici bir ret alır.

`/model` ve `/models` slash komutları; sağlayıcı, model ve uyumlu çalışma zamanı açılır listeleri ile bir Gönder adımı içeren etkileşimli bir model seçici açar. `/models add` kullanımdan kaldırılmıştır ve artık sohbetten model kaydetmek yerine kullanımdan kaldırma mesajı döndürür. Seçici yanıtı geçicidir ve yalnızca komutu çağıran kullanıcı kullanabilir.

Dosya ekleri:

- `file` blokları bir ek referansına işaret etmelidir (`attachment://<filename>`)
- Eki `media`/`path`/`filePath` aracılığıyla sağlayın (tek dosya); birden çok dosya için `media-gallery` kullanın
- Yükleme adının ek referansıyla eşleşmesi gerektiğinde geçersiz kılmak için `filename` kullanın

Modal formlar:

- En fazla 5 alanla `components.modal` ekleyin
- Alan türleri: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw otomatik olarak bir tetikleyici düğmesi ekler

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
  <Tab title="DM ilkesi">
    `channels.discord.dmPolicy` DM erişimini denetler. `channels.discord.allowFrom` kanonik DM izin listesidir.

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` öğesinin `"*"` içermesini gerektirir)
    - `disabled`

    DM ilkesi açık değilse bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme için yönlendirilir).

    Çok hesaplı öncelik sırası:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesabına uygulanır.
    - Tek bir hesap için `allowFrom`, eski `dm.allowFrom` üzerinde önceliklidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` ve eski `dm.allowFrom` ayarlanmamışsa `channels.discord.allowFrom` öğesini devralır.
    - Adlandırılmış hesaplar `channels.discord.accounts.default.allowFrom` öğesini devralmaz.

    Eski `channels.discord.dm.policy` ve `channels.discord.dm.allowFrom` uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` öğelerine taşır.

    Teslim için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` mention

    Çıplak sayısal kimlikler normalde bir kanal varsayılanı etkin olduğunda kanal kimlikleri olarak çözümlenir, ancak hesabın etkin DM `allowFrom` listesinde yer alan kimlikler uyumluluk için kullanıcı DM hedefleri olarak ele alınır.

  </Tab>

  <Tab title="DM erişim grupları">
    Discord DM'leri `channels.discord.allowFrom` içinde dinamik `accessGroup:<name>` girdileri kullanabilir.

    Erişim grubu adları mesaj kanalları arasında paylaşılır. Üyeleri her kanalın normal `allowFrom` sözdiziminde ifade edilen statik bir grup için `type: "message.senders"` kullanın veya bir Discord kanalının geçerli `ViewChannel` kitlesi üyeliği dinamik olarak tanımlamalıysa `type: "discord.channelAudience"` kullanın. Paylaşılan erişim grubu davranışı burada belgelenmiştir: [Erişim grupları](/tr/channels/access-groups).

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

    Bir Discord metin kanalının ayrı bir üye listesi yoktur. `type: "discord.channelAudience"` üyeliği şöyle modeller: DM göndereni yapılandırılmış sunucunun bir üyesidir ve rol ile kanal üzerine yazmaları uygulandıktan sonra yapılandırılmış kanalda şu anda etkin `ViewChannel` iznine sahiptir.

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

    Dinamik ve statik girdileri karıştırabilirsiniz:

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

    Aramalar kapalı başarısız olur. Discord `Missing Access` döndürürse, üye araması başarısız olursa veya kanal farklı bir sunucuya aitse DM göndereni yetkisiz olarak ele alınır.

    Kanal kitlesi erişim grupları kullanılırken bot için Discord Developer Portal **Server Members Intent** seçeneğini etkinleştirin. DM'ler sunucu üyesi durumu içermez, bu nedenle OpenClaw yetkilendirme sırasında üyeyi Discord REST üzerinden çözer.

  </Tab>

  <Tab title="Sunucu ilkesi">
    Sunucu işleme `channels.discord.groupPolicy` tarafından denetlenir:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` mevcut olduğunda güvenli temel değer `allowlist` olur.

    `allowlist` davranışı:

    - sunucu `channels.discord.guilds` ile eşleşmelidir (`id` tercih edilir, slug kabul edilir)
    - isteğe bağlı gönderen izin listeleri: `users` (kararlı kimlikler önerilir) ve `roles` (yalnızca rol kimlikleri); ikisinden biri yapılandırılmışsa gönderenler `users` VEYA `roles` ile eşleştiğinde izin verilir
    - doğrudan ad/etiket eşleştirme varsayılan olarak devre dışıdır; `channels.discord.dangerouslyAllowNameMatching: true` öğesini yalnızca acil uyumluluk modu olarak etkinleştirin
    - `users` için adlar/etiketler desteklenir, ancak kimlikler daha güvenlidir; ad/etiket girdileri kullanıldığında `openclaw security audit` uyarır
    - bir sunucuda `channels` yapılandırılmışsa listelenmeyen kanallar reddedilir
    - bir sunucuda `channels` bloğu yoksa izin verilenler listesindeki o sunucudaki tüm kanallara izin verilir

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
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Yalnızca `DISCORD_BOT_TOKEN` ayarlarsanız ve bir `channels.discord` bloğu oluşturmazsanız, çalışma zamanı geri dönüşü `channels.defaults.groupPolicy` `open` olsa bile `groupPolicy="allowlist"` olur (günlüklerde bir uyarıyla).

  </Tab>

  <Tab title="Mention'lar ve grup DM'leri">
    Sunucu mesajları varsayılan olarak mention kapılıdır.

    Mention algılama şunları içerir:

    - açık bot mention'ı
    - yapılandırılmış mention desenleri (`agents.list[].groupChat.mentionPatterns`, geri dönüş `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda örtük bota yanıt davranışı

    Giden Discord mesajları yazarken kanonik mention sözdizimini kullanın: kullanıcılar için `<@USER_ID>`, kanallar için `<#CHANNEL_ID>` ve roller için `<@&ROLE_ID>`. Eski `<@!USER_ID>` takma ad mention biçimini kullanmayın.

    `requireMention` sunucu/kanal başına yapılandırılır (`channels.discord.guilds...`).
    `ignoreOtherMentions`, isteğe bağlı olarak başka bir kullanıcıdan/rolden mention eden ancak bottan mention etmeyen mesajları bırakır (@everyone/@here hariç).

    Grup DM'leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - `dm.groupChannels` aracılığıyla isteğe bağlı izin listesi (kanal kimlikleri veya slug'lar)

  </Tab>
</Tabs>

### Rol tabanlı aracı yönlendirme

Discord sunucu üyelerini rol kimliğine göre farklı aracılara yönlendirmek için `bindings[].match.roles` kullanın. Rol tabanlı bağlamalar yalnızca rol kimliklerini kabul eder ve eş veya üst-eş bağlamalarından sonra, yalnızca sunucu bağlamalarından önce değerlendirilir. Bir bağlama başka eşleştirme alanları da ayarlarsa (örneğin `peer` + `guildId` + `roles`), yapılandırılmış tüm alanlar eşleşmelidir.

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

- `commands.native` varsayılan olarak `"auto"` değerini alır ve Discord için etkinleştirilmiştir.
- Kanal başına geçersiz kılma: `channels.discord.commands.native`.
- `commands.native=false`, başlangıç sırasında Discord eğik çizgi komutu kaydını ve temizliğini atlar. Daha önce kaydedilmiş komutlar, siz bunları Discord uygulamasından kaldırana kadar Discord içinde görünür kalabilir.
- Yerel komut kimlik doğrulaması, normal ileti işleme ile aynı Discord izin listelerini/politikalarını kullanır.
- Komutlar, yetkili olmayan kullanıcılar için Discord arayüzünde hâlâ görünür olabilir; yürütme yine de OpenClaw kimlik doğrulamasını uygular ve "yetkili değil" döndürür.

Komut kataloğu ve davranışı için [Eğik çizgi komutları](/tr/tools/slash-commands) bölümüne bakın.

Varsayılan eğik çizgi komutu ayarları:

- `ephemeral: true`

## Özellik ayrıntıları

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord, agent çıktısında yanıt etiketlerini destekler:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` ile denetlenir:

    - `off` (varsayılan)
    - `first`
    - `all`
    - `batched`

    Not: `off`, örtük yanıt iş parçacığı oluşturmayı devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.
    `first`, dönüş için ilk giden Discord iletisine her zaman örtük yerel yanıt referansını ekler.
    `batched`, yalnızca gelen dönüş birden çok iletiden oluşan geciktirilmiş bir grup olduğunda Discord'un örtük yerel yanıt referansını ekler. Bu, yerel yanıtları her tek iletili dönüşte değil, özellikle belirsiz ve yoğun sohbet patlamaları için istediğinizde kullanışlıdır.

    İleti kimlikleri bağlamda/geçmişte sunulur; böylece agent'lar belirli iletileri hedefleyebilir.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw, geçici bir ileti gönderip metin geldikçe bunu düzenleyerek taslak yanıtları akış olarak iletebilir. `channels.discord.streaming`, `off` (varsayılan) | `partial` | `block` | `progress` değerlerini alır. `progress`, düzenlenebilir tek bir durum taslağını tutar ve nihai teslimata kadar bunu araç ilerlemesiyle günceller; `streamMode` eski bir çalışma zamanı takma adıdır. Kalıcı yapılandırmayı kanonik anahtara yeniden yazmak için `openclaw doctor --fix` çalıştırın.

    Varsayılan `off` olarak kalır, çünkü birden çok bot veya Gateway aynı hesabı paylaştığında Discord önizleme düzenlemeleri hız sınırlarına hızla takılır.

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial`, token'lar geldikçe tek bir önizleme iletisini düzenler.
    - `block`, taslak boyutunda parçalar yayar (boyutu ve kırılma noktalarını ayarlamak için `draftChunk` kullanın; `textChunkLimit` ile sınırlandırılır).
    - Medya, hata ve açık yanıt final iletileri, bekleyen önizleme düzenlemelerini iptal eder.
    - `streaming.preview.toolProgress` (varsayılan `true`), araç/ilerleme güncellemelerinin önizleme iletisini yeniden kullanıp kullanmayacağını denetler.
    - `streaming.preview.commandText` / `streaming.progress.commandText`, kompakt ilerleme satırlarında komut/çalıştırma ayrıntısını denetler: `raw` (varsayılan) veya `status` (yalnızca araç etiketi).

    Kompakt ilerleme satırlarını korurken ham komut/çalıştırma metnini gizleyin:

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

    Önizleme akışı yalnızca metin içindir; medya yanıtları normal teslimata geri döner. `block` akışı açıkça etkinleştirildiğinde OpenClaw, çift akışı önlemek için önizleme akışını atlar.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Sunucu geçmişi bağlamı:

    - `channels.discord.historyLimit` varsayılanı `20`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    DM geçmişi denetimleri:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    İş parçacığı davranışı:

    - Discord iş parçacıkları kanal oturumları olarak yönlendirilir ve geçersiz kılınmadıkça üst kanal yapılandırmasını devralır.
    - İş parçacığı oturumları, üst kanalın oturum düzeyi `/model` seçimini yalnızca model yedeği olarak devralır; iş parçacığına yerel `/model` seçimleri yine de önceliklidir ve döküm kalıtımı etkinleştirilmedikçe üst döküm geçmişi kopyalanmaz.
    - `channels.discord.thread.inheritParent` (varsayılan `false`), yeni otomatik iş parçacıklarının üst dökümden başlatılmasını sağlar. Hesap başına geçersiz kılmalar `channels.discord.accounts.<id>.thread.inheritParent` altında bulunur.
    - İleti aracı tepkileri `user:<id>` DM hedeflerini çözümleyebilir.
    - `guilds.<guild>.channels.<channel>.requireMention: false`, yanıt aşaması etkinleştirme yedeği sırasında korunur.

    Kanal konuları **güvenilmeyen** bağlam olarak eklenir. İzin listeleri agent'ı kimin tetikleyebileceğini belirler; tam bir ek bağlam redaksiyonu sınırı değildir.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord, bir iş parçacığını bir oturum hedefine bağlayabilir; böylece o iş parçacığındaki takip iletileri aynı oturuma yönlendirilmeye devam eder (subagent oturumları dahil).

    Komutlar:

    - `/focus <target>` geçerli/yeni iş parçacığını bir subagent/oturum hedefine bağlar
    - `/unfocus` geçerli iş parçacığı bağını kaldırır
    - `/agents` etkin çalıştırmaları ve bağ durumunu gösterir
    - `/session idle <duration|off>` odaklanmış bağlar için etkin olmama durumunda otomatik odağı kaldırmayı inceler/günceller
    - `/session max-age <duration|off>` odaklanmış bağlar için katı azami yaşı inceler/günceller

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

    - `session.threadBindings.*` genel varsayılanları ayarlar.
    - `channels.discord.threadBindings.*` Discord davranışını geçersiz kılar.
    - `spawnSessions`, `sessions_spawn({ thread: true })` ve ACP iş parçacığı başlatmaları için iş parçacıklarının otomatik oluşturulmasını/bağlanmasını denetler. Varsayılan: `true`.
    - `defaultSpawnContext`, iş parçacığına bağlı başlatmalar için yerel subagent bağlamını denetler. Varsayılan: `"fork"`.
    - Kullanımdan kaldırılmış `spawnSubagentSessions`/`spawnAcpSessions` anahtarları `openclaw doctor --fix` tarafından taşınır.
    - Bir hesap için iş parçacığı bağları devre dışıysa `/focus` ve ilgili iş parçacığı bağlama işlemleri kullanılamaz.

    Bkz. [Alt agent'lar](/tr/tools/subagents), [ACP Agent'ları](/tr/tools/acp-agents) ve [Yapılandırma Başvurusu](/tr/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Kararlı ve "her zaman açık" ACP çalışma alanları için Discord konuşmalarını hedefleyen üst düzey yazılmış ACP bağları yapılandırın.

    Yapılandırma yolu:

    - `type: "acp"` ve `match.channel: "discord"` ile `bindings[]`

    Örnek:

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

    - `/acp spawn codex --bind here`, geçerli kanalı veya iş parçacığını yerinde bağlar ve gelecekteki iletileri aynı ACP oturumunda tutar. İş parçacığı iletileri üst kanal bağını devralır.
    - Bağlı bir kanalda veya iş parçacığında `/new` ve `/reset`, aynı ACP oturumunu yerinde sıfırlar. Geçici iş parçacığı bağları, etkinken hedef çözümlemeyi geçersiz kılabilir.
    - `spawnSessions`, `--thread auto|here` üzerinden alt iş parçacığı oluşturmayı/bağlamayı sınırlar.

    Bağlama davranışı ayrıntıları için [ACP Agent'ları](/tr/tools/acp-agents) bölümüne bakın.

  </Accordion>

  <Accordion title="Reaction notifications">
    Sunucu başına tepki bildirimi modu:

    - `off`
    - `own` (varsayılan)
    - `all`
    - `allowlist` (`guilds.<id>.users` kullanır)

    Tepki olayları sistem olaylarına dönüştürülür ve yönlendirilen Discord oturumuna eklenir.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction`, OpenClaw gelen bir iletiyi işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - agent kimliği emoji yedeği (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Discord unicode emoji veya özel emoji adlarını kabul eder.
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Config writes">
    Kanal tarafından başlatılan yapılandırma yazmaları varsayılan olarak etkindir.

    Bu, `/config set|unset` akışlarını etkiler (komut özellikleri etkin olduğunda).

    Devre dışı bırakma:

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

  <Accordion title="Gateway proxy">
    Discord Gateway WebSocket trafiğini ve başlangıç REST aramalarını (uygulama kimliği + izin listesi çözümlemesi) `channels.discord.proxy` ile bir HTTP(S) proxy üzerinden yönlendirin.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Hesap başına geçersiz kılma:

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

  <Accordion title="PluralKit support">
    Proxy'lenmiş iletileri sistem üyesi kimliğine eşlemek için PluralKit çözümlemesini etkinleştirin:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    Notlar:

    - izin listeleri `pk:<memberId>` kullanabilir
    - üye görünen adları yalnızca `channels.discord.dangerouslyAllowNameMatching: true` olduğunda ada/slug'a göre eşleştirilir
    - aramalar özgün ileti kimliğini kullanır ve zaman penceresiyle sınırlandırılır
    - arama başarısız olursa proxy'lenmiş iletiler bot iletileri olarak değerlendirilir ve `allowBots=true` olmadığı sürece düşürülür

  </Accordion>

  <Accordion title="Outbound mention aliases">
    Agent'ların bilinen Discord kullanıcıları için deterministik giden bahsetmelere ihtiyaç duyması durumunda `mentionAliases` kullanın. Anahtarlar baştaki `@` olmadan tanıtıcılardır; değerler Discord kullanıcı kimlikleridir. Bilinmeyen tanıtıcılar, `@everyone`, `@here` ve Markdown kod aralıkları içindeki bahsetmeler değiştirilmeden bırakılır.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
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

  <Accordion title="Presence configuration">
    Durum veya etkinlik alanı ayarladığınızda ya da otomatik varlığı etkinleştirdiğinizde varlık güncellemeleri uygulanır.

    Yalnızca durum örneği:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Etkinlik örneği (özel durum varsayılan etkinlik türüdür):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    Akış örneği:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Etkinlik türü haritası:

    - 0: Oynuyor
    - 1: Akış yapıyor (`activityUrl` gerektirir)
    - 2: Dinliyor
    - 3: İzliyor
    - 4: Özel (etkinlik metnini durum hali olarak kullanır; emoji isteğe bağlıdır)
    - 5: Yarışıyor

    Otomatik varlık örneği (çalışma zamanı sağlık sinyali):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    Otomatik durum, çalışma zamanı kullanılabilirliğini Discord durumuna eşler: sağlıklı => çevrimiçi, degraded veya bilinmiyor => boşta, exhausted veya unavailable => dnd. İsteğe bağlı metin geçersiz kılmaları:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` yer tutucusunu destekler)

  </Accordion>

  <Accordion title="Discord'da onaylar">
    Discord, DM'lerde düğme tabanlı onay işlemeyi destekler ve isteğe bağlı olarak onay istemlerini kaynak kanalda paylaşabilir.

    Yapılandırma yolu:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord, `enabled` ayarlanmamış veya `"auto"` olduğunda ve `execApprovals.approvers` ya da `commands.ownerAllowFrom` üzerinden en az bir onaylayıcı çözümlenebildiğinde yerel exec onaylarını otomatik olarak etkinleştirir. Discord, exec onaylayıcılarını kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan ileti `defaultTo` değerinden çıkarmaz. Discord'u yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `/diagnostics` ve `/export-trajectory` gibi hassas, yalnızca sahiplerin kullanabildiği grup komutları için OpenClaw onay istemlerini ve nihai sonuçları özel olarak gönderir. Çağıran sahibin bir Discord sahip rotası olduğunda önce Discord DM'yi dener; bu kullanılabilir değilse Telegram gibi `commands.ownerAllowFrom` içindeki ilk kullanılabilir sahip rotasına geri döner.

    `target` `channel` veya `both` olduğunda onay istemi kanalda görünür. Düğmeleri yalnızca çözümlenmiş onaylayıcılar kullanabilir; diğer kullanıcılar geçici bir ret alır. Onay istemleri komut metnini içerir, bu nedenle kanal teslimini yalnızca güvenilir kanallarda etkinleştirin. Kanal kimliği oturum anahtarından türetilemezse OpenClaw DM teslimine geri döner.

    Discord, diğer sohbet kanallarının kullandığı paylaşılan onay düğmelerini de işler. Yerel Discord adaptörü temel olarak onaylayıcı DM yönlendirmesi ve kanal dağıtımı ekler.
    Bu düğmeler mevcut olduğunda birincil onay UX'i bunlardır; OpenClaw
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu söylediğinde
    manuel bir `/approve` komutu içermelidir.
    Discord yerel onay çalışma zamanı etkin değilse OpenClaw
    yerel deterministik `/approve <id> <decision>` istemini görünür tutar. Çalışma zamanı
    etkinse ancak herhangi bir hedefe yerel kart teslim edilemiyorsa,
    OpenClaw bekleyen onaydaki tam `/approve`
    komutuyla aynı sohbette bir geri dönüş bildirimi gönderir.

    Gateway kimlik doğrulaması ve onay çözümlemesi paylaşılan Gateway istemci sözleşmesini izler (`plugin:` kimlikleri `plugin.approval.resolve` üzerinden; diğer kimlikler `exec.approval.resolve` üzerinden çözümlenir). Onayların süresi varsayılan olarak 30 dakika sonra dolar.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Araçlar ve eylem kapıları

Discord ileti eylemleri mesajlaşma, kanal yönetimi, moderasyon, durum ve meta veri eylemlerini içerir.

Temel örnekler:

- mesajlaşma: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- tepkiler: `react`, `reactions`, `emojiList`
- moderasyon: `timeout`, `kick`, `ban`
- durum: `setPresence`

`event-create` eylemi, planlanan etkinlik kapak görselini ayarlamak için isteğe bağlı bir `image` parametresi (URL veya yerel dosya yolu) kabul eder.

Eylem kapıları `channels.discord.actions.*` altında bulunur.

Varsayılan kapı davranışı:

| Eylem grubu                                                                                                                                                             | Varsayılan  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | etkin  |
| roles                                                                                                                                                                    | devre dışı |
| moderation                                                                                                                                                               | devre dışı |
| presence                                                                                                                                                                 | devre dışı |

## Bileşenler v2 UI

OpenClaw, exec onayları ve bağlamlar arası işaretleyiciler için Discord bileşenleri v2'yi kullanır. Discord ileti eylemleri özel UI için `components` da kabul edebilir (ileri düzey; discord aracı üzerinden bir bileşen yükü oluşturmayı gerektirir), eski `embeds` ise kullanılabilir kalır ancak önerilmez.

- `channels.discord.ui.components.accentColor`, Discord bileşen kapsayıcıları tarafından kullanılan vurgu rengini ayarlar (onaltılık).
- Hesap başına `channels.discord.accounts.<id>.ui.components.accentColor` ile ayarlayın.
- Bileşenler v2 mevcut olduğunda `embeds` yok sayılır.

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

Discord'un iki ayrı ses yüzeyi vardır: gerçek zamanlı **ses kanalları** (sürekli konuşmalar) ve **sesli ileti ekleri** (dalga biçimi önizleme biçimi). Gateway ikisini de destekler.

### Ses kanalları

Kurulum kontrol listesi:

1. Discord Developer Portal'da Message Content Intent'i etkinleştirin.
2. Rol/kullanıcı izin listeleri kullanıldığında Server Members Intent'i etkinleştirin.
3. Botu `bot` ve `applications.commands` kapsamlarıyla davet edin.
4. Hedef ses kanalında Connect, Speak, Send Messages ve Read Message History izinlerini verin.
5. Yerel komutları etkinleştirin (`commands.native` veya `channels.discord.commands.native`).
6. `channels.discord.voice` yapılandırmasını yapın.

Oturumları denetlemek için `/vc join|leave|status` kullanın. Komut, hesap varsayılan ajanını kullanır ve diğer Discord komutlarıyla aynı izin listesi ve grup ilkesi kurallarını izler.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Otomatik katılma örneği:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        tts: {
          provider: "openai",
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

Notlar:

- `voice.tts`, yalnızca ses oynatma için `messages.tts` değerini geçersiz kılar.
- `voice.model`, yalnızca Discord ses kanalı yanıtları için kullanılan LLM'yi geçersiz kılar. Yönlendirilmiş ajan modelini devralmak için ayarlanmamış bırakın.
- STT `tools.media.audio` kullanır; `voice.model` transkripsiyonu etkilemez.
- Kanal başına Discord `systemPrompt` geçersiz kılmaları, ilgili ses kanalındaki ses transkripti dönüşlerine uygulanır.
- Ses transkripti dönüşleri sahip durumunu Discord `allowFrom` (veya `dm.allowFrom`) üzerinden türetir; sahip olmayan konuşmacılar yalnızca sahip araçlarına erişemez (örneğin `gateway` ve `cron`).
- Discord sesi, yalnızca metin yapılandırmaları için isteğe bağlıdır; `/vc` komutlarını, ses çalışma zamanını ve `GuildVoiceStates` Gateway intent'ini etkinleştirmek için `channels.discord.voice.enabled=true` ayarlayın (veya mevcut bir `channels.discord.voice` bloğunu koruyun).
- `channels.discord.intents.voiceStates`, ses durumu intent aboneliğini açıkça geçersiz kılabilir. Intent'in etkin ses etkinleştirmesini izlemesi için ayarlanmamış bırakın.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` katılma seçeneklerine geçirilir.
- Ayarlanmamışsa `@discordjs/voice` varsayılanları `daveEncryption=true` ve `decryptionFailureTolerance=24` şeklindedir.
- `voice.connectTimeoutMs`, `/vc join` ve otomatik katılma denemeleri için ilk `@discordjs/voice` Ready beklemesini denetler. Varsayılan: `30000`.
- `voice.reconnectGraceMs`, OpenClaw'un bağlantısı kesilmiş bir ses oturumunu yok etmeden önce yeniden bağlanmaya başlamasını ne kadar süre bekleyeceğini denetler. Varsayılan: `15000`.
- OpenClaw ayrıca alma tarafındaki şifre çözme hatalarını izler ve kısa bir zaman aralığında tekrarlanan hatalardan sonra ses kanalından ayrılıp yeniden katılarak otomatik kurtarma yapar.
- Alma günlükleri güncellemeden sonra tekrar tekrar `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` gösteriyorsa bir bağımlılık raporu ve günlükleri toplayın. Paketlenen `@discordjs/voice` serisi, discord.js sorunu #11419'u kapatan discord.js PR #11449'daki yukarı akış padding düzeltmesini içerir.

Ses kanalı işlem hattı:

- Discord PCM yakalama, geçici bir WAV dosyasına dönüştürülür.
- `tools.media.audio`, STT'yi işler; örneğin `openai/gpt-4o-mini-transcribe`.
- Transkript, Discord girişinden ve yönlendirmeden geçirilir; bu sırada yanıt LLM'si, ajan `tts` aracını gizleyen ve döndürülen metni isteyen bir ses çıkışı ilkesiyle çalışır, çünkü Discord sesi nihai TTS oynatımına sahiptir.
- `voice.model` ayarlandığında yalnızca bu ses kanalı dönüşü için yanıt LLM'sini geçersiz kılar.
- `voice.tts`, `messages.tts` üzerine birleştirilir; oluşan ses katılınan kanalda çalınır.

Kimlik bilgileri bileşen başına çözümlenir: `voice.model` için LLM rota kimlik doğrulaması, `tools.media.audio` için STT kimlik doğrulaması ve `messages.tts`/`voice.tts` için TTS kimlik doğrulaması.

### Sesli iletiler

Discord sesli iletileri bir dalga biçimi önizlemesi gösterir ve OGG/Opus ses gerektirir. OpenClaw dalga biçimini otomatik olarak oluşturur, ancak incelemek ve dönüştürmek için Gateway ana makinesinde `ffmpeg` ve `ffprobe` gerekir.

- Bir **yerel dosya yolu** sağlayın (URL'ler reddedilir).
- Metin içeriğini atlayın (Discord aynı yükte metin + sesli iletiyi reddeder).
- Herhangi bir ses biçimi kabul edilir; OpenClaw gerektiğinde OGG/Opus'a dönüştürür.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="İzin verilmeyen intent'ler kullanıldı veya bot hiçbir guild iletisi görmüyor">

    - Message Content Intent'i etkinleştirin
    - kullanıcı/üye çözümlemesine bağlı olduğunuzda Server Members Intent'i etkinleştirin
    - intent'leri değiştirdikten sonra Gateway'i yeniden başlatın

  </Accordion>

  <Accordion title="Guild iletileri beklenmedik şekilde engelleniyor">

    - `groupPolicy` değerini doğrulayın
    - `channels.discord.guilds` altındaki guild izin listesini doğrulayın
    - guild `channels` haritası varsa yalnızca listelenen kanallara izin verilir
    - `requireMention` davranışını ve mention desenlerini doğrulayın

    Yararlı kontroller:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false ancak hâlâ engelleniyor">
    Yaygın nedenler:

    - eşleşen guild/kanal izin listesi olmadan `groupPolicy="allowlist"`
    - `requireMention` yanlış yerde yapılandırılmış (mutlaka `channels.discord.guilds` veya kanal girdisi altında olmalıdır)
    - gönderen, guild/kanal `users` izin listesi tarafından engellenmiş

  </Accordion>

  <Accordion title="Uzun süren Discord dönüşleri veya yinelenen yanıtlar">

    Tipik günlükler:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway kuyruk ayarları:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çoklu hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - bu yalnızca Discord Gateway dinleyici işini denetler, ajan dönüş ömrünü değil

    Discord, kuyruğa alınmış ajan dönüşlerine kanala ait bir zaman aşımı uygulamaz. İleti dinleyicileri hemen devreder ve kuyruğa alınmış Discord çalıştırmaları, oturum/araç/çalışma zamanı yaşam döngüsü tamamlanana veya işi durdurana kadar oturum başına sıralamayı korur.

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
    - yapılandırma ayarlanmamışsa env yedeği: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - varsayılan: `30000` (30 saniye), en fazla: `120000`

  </Accordion>

  <Accordion title="Gateway READY zaman aşımı yeniden başlatmaları">
    OpenClaw, başlangıç sırasında ve çalışma zamanı yeniden bağlantılarından sonra Discord'un Gateway `READY` olayını bekler. Başlangıçta kademelendirme kullanan çoklu hesap kurulumları, varsayılandan daha uzun bir başlangıç READY penceresine ihtiyaç duyabilir.

    READY zaman aşımı ayarları:

    - başlangıç tek hesap: `channels.discord.gatewayReadyTimeoutMs`
    - başlangıç çoklu hesap: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa başlangıç env yedeği: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - başlangıç varsayılanı: `15000` (15 saniye), en fazla: `120000`
    - çalışma zamanı tek hesap: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - çalışma zamanı çoklu hesap: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa çalışma zamanı env yedeği: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - çalışma zamanı varsayılanı: `30000` (30 saniye), en fazla: `120000`

  </Accordion>

  <Accordion title="İzin denetimi uyumsuzlukları">
    `channels status --probe` izin kontrolleri yalnızca sayısal kanal ID'leri için çalışır.

    Slug anahtarları kullanırsanız çalışma zamanı eşleştirmesi yine de çalışabilir, ancak probe izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM ve eşleştirme sorunları">

    - DM devre dışı: `channels.discord.dm.enabled=false`
    - DM ilkesi devre dışı: `channels.discord.dmPolicy="disabled"` (eski: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Bot-bot döngüleri">
    Varsayılan olarak bot tarafından yazılan mesajlar yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız döngü davranışından kaçınmak için katı mention ve izin listesi kuralları kullanın.
    Yalnızca bottan bahseden bot mesajlarını kabul etmek için `channels.discord.allowBots="mentions"` tercih edin.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write "@Mantis" and send a real Discord mention.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="DecryptionFailed(...) ile ses STT düşmeleri">

    - Discord ses alma kurtarma mantığının mevcut olması için OpenClaw'ı güncel tutun (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` olduğunu doğrulayın (varsayılan)
    - `channels.discord.voice.decryptionFailureTolerance=24` değerinden başlayın (upstream varsayılanı) ve yalnızca gerekirse ayarlayın
    - günlüklerde şunları izleyin:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - otomatik yeniden katılımdan sonra hatalar devam ederse günlükleri toplayın ve [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) ile [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) içindeki upstream DAVE alma geçmişiyle karşılaştırın

  </Accordion>
</AccordionGroup>

## Yapılandırma başvurusu

Birincil başvuru: [Yapılandırma başvurusu - Discord](/tr/gateway/config-channels#discord).

<Accordion title="Yüksek sinyalli Discord alanları">

- başlangıç/kimlik doğrulama: `enabled`, `token`, `accounts.*`, `allowBots`
- ilke: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- komut: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- olay kuyruğu: `eventQueue.listenerTimeout` (dinleyici bütçesi), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- yanıt/geçmiş: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- teslimat: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- akış: `streaming` (eski takma ad: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medya/yeniden deneme: `mediaMaxMb` (giden Discord yüklemelerini sınırlar, varsayılan `100MB`), `retry`
- eylemler: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- özellikler: `threadBindings`, üst düzey `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Güvenlik ve operasyonlar

- Bot token'larını gizli bilgi olarak ele alın (denetimli ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- Discord izinlerini en az ayrıcalıkla verin.
- Komut dağıtımı/durumu eskiyse Gateway'i yeniden başlatın ve `openclaw channels status --probe` ile yeniden kontrol edin.

## İlgili

<CardGroup cols={2}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bir Discord kullanıcısını Gateway ile eşleştirin.
  </Card>
  <Card title="Gruplar" icon="users" href="/tr/channels/groups">
    Grup sohbeti ve izin listesi davranışı.
  </Card>
  <Card title="Kanal yönlendirme" icon="route" href="/tr/channels/channel-routing">
    Gelen mesajları agent'lara yönlendirin.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sağlamlaştırma.
  </Card>
  <Card title="Çok agent'lı yönlendirme" icon="sitemap" href="/tr/concepts/multi-agent">
    Guild'leri ve kanalları agent'larla eşleyin.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı.
  </Card>
</CardGroup>
