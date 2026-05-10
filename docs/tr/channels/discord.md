---
read_when:
    - Discord kanal özellikleri üzerinde çalışma
summary: Discord botu desteğinin durumu, yetenekleri ve yapılandırması
title: Discord
x-i18n:
    generated_at: "2026-05-10T19:21:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121b0b46bfb0d438f6ebfba4c93410c2ecfe8f99aa257e362b8767bf0aac27ce
    source_path: channels/discord.md
    workflow: 16
---

Resmi Discord Gateway üzerinden DM’ler ve guild kanalları için hazır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Discord DM’leri varsayılan olarak eşleştirme modundadır.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Kanal sorunlarını giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım akışı.
  </Card>
</CardGroup>

## Hızlı kurulum

Bir bot içeren yeni bir uygulama oluşturmanız, botu sunucunuza eklemeniz ve OpenClaw ile eşleştirmeniz gerekir. Botunuzu kendi özel sunucunuza eklemenizi öneririz. Henüz bir sunucunuz yoksa, [önce bir tane oluşturun](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** seçeneğini seçin).

<Steps>
  <Step title="Bir Discord uygulaması ve botu oluşturun">
    [Discord Developer Portal](https://discord.com/developers/applications) sayfasına gidin ve **New Application** öğesine tıklayın. "OpenClaw" gibi bir ad verin.

    Kenar çubuğunda **Bot** öğesine tıklayın. **Username** değerini OpenClaw ajanınıza verdiğiniz ad olarak ayarlayın.

  </Step>

  <Step title="Ayrıcalıklı intent’leri etkinleştirin">
    Hâlâ **Bot** sayfasındayken **Privileged Gateway Intents** bölümüne ilerleyin ve şunları etkinleştirin:

    - **Message Content Intent** (gerekli)
    - **Server Members Intent** (önerilir; rol izin listeleri ve ad-ID eşleştirmesi için gereklidir)
    - **Presence Intent** (isteğe bağlı; yalnızca presence güncellemeleri için gerekir)

  </Step>

  <Step title="Bot token’ınızı kopyalayın">
    **Bot** sayfasında tekrar yukarı gidin ve **Reset Token** öğesine tıklayın.

    <Note>
    Adına rağmen bu, ilk token’ınızı oluşturur; hiçbir şey "sıfırlanmıyor."
    </Note>

    Token’ı kopyalayın ve bir yere kaydedin. Bu sizin **Bot Token** değerinizdir ve kısa süre sonra buna ihtiyacınız olacak.

  </Step>

  <Step title="Davet URL’si oluşturun ve botu sunucunuza ekleyin">
    Kenar çubuğunda **OAuth2** öğesine tıklayın. Botu sunucunuza eklemek için doğru izinlere sahip bir davet URL’si oluşturacaksınız.

    **OAuth2 URL Generator** bölümüne ilerleyin ve şunları etkinleştirin:

    - `bot`
    - `applications.commands`

    Aşağıda bir **Bot Permissions** bölümü görünecek. En az şunları etkinleştirin:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (isteğe bağlı)

    Bu, normal metin kanalları için temel kümedir. Forum veya medya kanalı iş akışları dahil olmak üzere Discord başlıklarında gönderi paylaşmayı planlıyorsanız, bir başlık oluşturan veya sürdüren iş akışları için **Send Messages in Threads** seçeneğini de etkinleştirin.
    Altta oluşturulan URL’yi kopyalayın, tarayıcınıza yapıştırın, sunucunuzu seçin ve bağlanmak için **Continue** öğesine tıklayın. Artık botunuzu Discord sunucusunda görmelisiniz.

  </Step>

  <Step title="Developer Mode’u etkinleştirin ve ID’lerinizi toplayın">
    Discord uygulamasına geri dönün; dahili ID’leri kopyalayabilmek için Developer Mode’u etkinleştirmeniz gerekir.

    1. **User Settings** öğesine tıklayın (avatarınızın yanındaki dişli simgesi) → **Advanced** → **Developer Mode** seçeneğini açın
    2. Kenar çubuğundaki **sunucu simgenize** sağ tıklayın → **Copy Server ID**
    3. **Kendi avatarınıza** sağ tıklayın → **Copy User ID**

    **Server ID** ve **User ID** değerlerinizi Bot Token’ınızın yanına kaydedin; sonraki adımda üçünü de OpenClaw’a göndereceksiniz.

  </Step>

  <Step title="Sunucu üyelerinden DM almaya izin verin">
    Eşleştirmenin çalışması için Discord’un botunuzun size DM göndermesine izin vermesi gerekir. **Sunucu simgenize** sağ tıklayın → **Privacy Settings** → **Direct Messages** seçeneğini açın.

    Bu, sunucu üyelerinin (botlar dahil) size DM göndermesine izin verir. Discord DM’lerini OpenClaw ile kullanmak istiyorsanız bunu etkin bırakın. Yalnızca guild kanallarını kullanmayı planlıyorsanız eşleştirmeden sonra DM’leri devre dışı bırakabilirsiniz.

  </Step>

  <Step title="Bot token’ınızı güvenli şekilde ayarlayın (sohbette göndermeyin)">
    Discord bot token’ınız bir sırdır (parola gibi). Ajanınıza mesaj göndermeden önce bunu OpenClaw’ı çalıştıran makinede ayarlayın.

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

    OpenClaw zaten arka plan hizmeti olarak çalışıyorsa, OpenClaw Mac uygulaması üzerinden veya `openclaw gateway run` sürecini durdurup yeniden başlatarak yeniden başlatın.
    Yönetilen hizmet kurulumları için `DISCORD_BOT_TOKEN` mevcut olan bir shell’den `openclaw gateway install` komutunu çalıştırın veya değişkeni `~/.openclaw/.env` içinde saklayın; böylece hizmet yeniden başlatmadan sonra env SecretRef’i çözebilir.
    Ana makineniz Discord’un başlangıç uygulama araması tarafından engelleniyor veya hız sınırına takılıyorsa, başlangıcın bu REST çağrısını atlayabilmesi için Discord application/client ID değerini Developer Portal’dan ayarlayın. Varsayılan hesap için `channels.discord.applicationId`, birden fazla Discord botu çalıştırdığınızda ise `channels.discord.accounts.<accountId>.applicationId` kullanın.

  </Step>

  <Step title="OpenClaw’ı yapılandırın ve eşleştirin">

    <Tabs>
      <Tab title="Ajanınıza sorun">
        Mevcut herhangi bir kanalda (ör. Telegram) OpenClaw ajanınızla sohbet edin ve ona söyleyin. Discord ilk kanalınızsa bunun yerine CLI / config sekmesini kullanın.

        > "Discord bot token’ımı config içinde zaten ayarladım. Lütfen User ID `<user_id>` ve Server ID `<server_id>` ile Discord kurulumunu tamamla."
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

        Varsayılan hesap için env fallback:

```bash
DISCORD_BOT_TOKEN=...
```

        Betikli veya uzaktan kurulum için aynı JSON5 bloğunu `openclaw config patch --file ./discord.patch.json5 --dry-run` ile yazın ve ardından `--dry-run` olmadan yeniden çalıştırın. Düz metin `token` değerleri desteklenir. SecretRef değerleri de env/file/exec sağlayıcıları genelinde `channels.discord.token` için desteklenir. Bkz. [Sır Yönetimi](/tr/gateway/secrets).

        Birden fazla Discord botu için her bot token’ını ve application ID değerini kendi hesabı altında tutun. Üst düzey `channels.discord.applicationId` hesaplar tarafından devralınır; bu nedenle yalnızca her hesap aynı application ID’yi kullanmalıysa orada ayarlayın.

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
    Gateway çalışana kadar bekleyin, ardından Discord’da botunuza DM gönderin. Bir eşleştirme koduyla yanıt verecek.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        Eşleştirme kodunu mevcut kanalınızda ajanınıza gönderin:

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

    Artık Discord’da DM üzerinden ajanınızla sohbet edebilmelisiniz.

  </Step>
</Steps>

<Note>
Token çözümleme hesap farkındadır. Config token değerleri env fallback’e göre önceliklidir. `DISCORD_BOT_TOKEN` yalnızca varsayılan hesap için kullanılır.
Etkinleştirilmiş iki Discord hesabı aynı bot token’ına çözümlenirse OpenClaw bu token için yalnızca bir Gateway izleyicisi başlatır. Config kaynaklı token varsayılan env fallback’e göre önceliklidir; aksi halde ilk etkinleştirilen hesap kazanır ve yinelenen hesap devre dışı olarak bildirilir.
Gelişmiş giden çağrılar (message tool/kanal eylemleri) için açık bir çağrı başına `token` o çağrıda kullanılır. Bu, gönderme ve okuma/probe tarzı eylemler için geçerlidir (örneğin read/search/fetch/thread/pins/permissions). Hesap ilkesi/yeniden deneme ayarları yine de etkin runtime snapshot’ında seçilen hesaptan gelir.
</Note>

## Önerilen: Bir guild çalışma alanı kurun

DM’ler çalışmaya başladıktan sonra Discord sunucunuzu, her kanalın kendi bağlamına sahip kendi ajan oturumunu aldığı tam bir çalışma alanı olarak kurabilirsiniz. Bu, yalnızca sizin ve botunuzun bulunduğu özel sunucular için önerilir.

<Steps>
  <Step title="Sunucunuzu guild izin listesine ekleyin">
    Bu, ajanınızın yalnızca DM’lerde değil, sunucunuzdaki herhangi bir kanalda yanıt vermesini sağlar.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        > "Discord Server ID `<server_id>` değerimi guild izin listesine ekle"
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

  <Step title="@mention olmadan yanıtlara izin verin">
    Varsayılan olarak ajanınız guild kanallarında yalnızca @mention edildiğinde yanıt verir. Özel bir sunucu için muhtemelen her mesaja yanıt vermesini istersiniz.

    Guild kanallarında normal asistan final yanıtları varsayılan olarak gizli kalır. Görünür Discord çıktısı `message` aracıyla açıkça gönderilmelidir; böylece ajan varsayılan olarak sessiz kalabilir ve yalnızca kanal yanıtının yararlı olduğuna karar verdiğinde gönderi paylaşır.

    Bu, seçilen modelin araçları güvenilir biçimde çağırması gerektiği anlamına gelir. Discord yazıyor olarak gösteriyor ve log’lar token kullanımını gösteriyor ancak mesaj gönderilmiyorsa, oturum log’unda `didSendViaMessagingTool: false` ile asistan metni olup olmadığını kontrol edin. Bu, modelin `message(action=send)` çağırmak yerine özel bir final yanıtı ürettiği anlamına gelir. Daha güçlü bir araç çağıran modele geçin veya eski otomatik final yanıtlarını geri getirmek için aşağıdaki config’i kullanın.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        > "Ajanımın bu sunucuda @mention edilmek zorunda kalmadan yanıt vermesine izin ver"
      </Tab>
      <Tab title="Config">
        Guild config’inizde `requireMention: false` ayarlayın:

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

        Grup/kanal odaları için eski otomatik final yanıtlarını geri getirmek üzere `messages.groupChat.visibleReplies: "automatic"` ayarlayın.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Guild kanallarında bellek için plan yapın">
    Varsayılan olarak uzun süreli bellek (MEMORY.md) yalnızca DM oturumlarında yüklenir. Guild kanalları MEMORY.md dosyasını otomatik olarak yüklemez.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        > "Discord kanallarında soru sorduğumda, MEMORY.md dosyasından uzun süreli bağlama ihtiyacın olursa memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Manuel">
        Her kanalda paylaşılan bağlama ihtiyacınız varsa, kararlı talimatları `AGENTS.md` veya `USER.md` içine koyun (bunlar her oturum için enjekte edilir). Uzun süreli notları `MEMORY.md` içinde tutun ve gerektiğinde bellek araçlarıyla erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Şimdi Discord sunucunuzda birkaç kanal oluşturun ve sohbete başlayın. Ajanınız kanal adını görebilir ve her kanal kendi yalıtılmış oturumunu alır; böylece iş akışınıza uyan `#coding`, `#home`, `#research` veya başka herhangi bir şeyi kurabilirsiniz.

## Runtime modeli

- Gateway, Discord bağlantısının sahibidir.
- Yanıt yönlendirmesi belirlenimlidir: Discord gelen yanıtları tekrar Discord'a döner.
- Discord guild/kanal üst verileri, kullanıcıya görünür bir yanıt öneki olarak değil, güvenilmeyen
  bağlam olarak model istemine eklenir. Bir model bu zarfı geri kopyalarsa
  OpenClaw, kopyalanan üst verileri giden yanıtlardan ve gelecekteki
  yeniden oynatma bağlamından kaldırır.
- Varsayılan olarak (`session.dmScope=main`), doğrudan sohbetler ajan ana oturumunu paylaşır (`agent:main:main`).
- Guild kanalları yalıtılmış oturum anahtarlarıdır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM'leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel slash komutları yalıtılmış komut oturumlarında çalışır (`agent:<agentId>:discord:slash:<userId>`), ancak yine de yönlendirilen konuşma oturumuna `CommandTargetSessionKey` taşır.
- Discord'a metin odaklı cron/heartbeat duyuru teslimi, son
  asistan tarafından görülebilen yanıtı bir kez kullanır. Medya ve yapılandırılmış bileşen yükleri,
  ajan birden fazla teslim edilebilir yük yaydığında çok iletili olarak kalır.

## Forum kanalları

Discord forum ve medya kanalları yalnızca konu gönderilerini kabul eder. OpenClaw bunları oluşturmak için iki yol destekler:

- Otomatik olarak bir konu oluşturmak için forum üst kanalına (`channel:<forumId>`) bir ileti gönderin. Konu başlığı, iletinizin ilk boş olmayan satırını kullanır.
- Doğrudan bir konu oluşturmak için `openclaw message thread create` kullanın. Forum kanalları için `--message-id` geçirmeyin.

Örnek: bir konu oluşturmak için forum üst kanalına gönderme

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Örnek: açıkça bir forum konusu oluşturma

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum üst kanalları Discord bileşenlerini kabul etmez. Bileşenlere ihtiyacınız varsa konunun kendisine gönderin (`channel:<threadId>`).

## Etkileşimli bileşenler

OpenClaw, ajan iletileri için Discord components v2 kapsayıcılarını destekler. `components` yüküyle ileti aracını kullanın. Etkileşim sonuçları normal gelen iletiler olarak ajana geri yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Eylem satırları en fazla 5 düğmeye veya tek bir seçim menüsüne izin verir
- Seçim türleri: `string`, `user`, `role`, `mentionable`, `channel`

Varsayılan olarak bileşenler tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süreleri dolana kadar birden çok kez kullanılmasına izin vermek için `components.reusable=true` ayarlayın.

Bir düğmeye kimlerin tıklayabileceğini kısıtlamak için o düğmede `allowedUsers` ayarlayın (Discord kullanıcı kimlikleri, etiketleri veya `*`). Yapılandırıldığında, eşleşmeyen kullanıcılar geçici bir ret alır.

`/model` ve `/models` slash komutları, sağlayıcı, model ve uyumlu çalışma zamanı açılır menülerinin yanı sıra bir Gönder adımı içeren etkileşimli bir model seçici açar. `/models add` kullanımdan kaldırılmıştır ve artık modelleri sohbetten kaydetmek yerine kullanımdan kaldırma iletisi döndürür. Seçici yanıtı geçicidir ve yalnızca komutu çağıran kullanıcı bunu kullanabilir. Discord seçim menüleri 25 seçenekle sınırlıdır; bu nedenle seçicinin dinamik olarak keşfedilen modelleri yalnızca `openai-codex` veya `vllm` gibi seçili sağlayıcılar için göstermesini istediğinizde `agents.defaults.models` içine `provider/*` girdileri ekleyin.

Dosya ekleri:

- `file` blokları bir ek referansına işaret etmelidir (`attachment://<filename>`)
- Eki `media`/`path`/`filePath` üzerinden sağlayın (tek dosya); birden çok dosya için `media-gallery` kullanın
- Yükleme adının ek referansıyla eşleşmesi gerektiğinde bunu geçersiz kılmak için `filename` kullanın

Modal formlar:

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
  <Tab title="DM policy">
    `channels.discord.dmPolicy`, DM erişimini denetler. `channels.discord.allowFrom`, kanonik DM izin listesidir.

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    DM ilkesi açık değilse bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme için yönlendirilir).

    Çok hesaplı öncelik:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesabına uygulanır.
    - Tek hesap için `allowFrom`, eski `dm.allowFrom` karşısında önceliklidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` ve eski `dm.allowFrom` ayarlanmamışsa `channels.discord.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.discord.accounts.default.allowFrom` değerini devralmaz.

    Eski `channels.discord.dm.policy` ve `channels.discord.dm.allowFrom` uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` değerlerine geçirir.

    Teslim için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` mention

    Yalın sayısal kimlikler, kanal varsayılanı etkinken normalde kanal kimlikleri olarak çözümlenir; ancak hesabın etkin DM `allowFrom` listesinde yer alan kimlikler, uyumluluk için kullanıcı DM hedefleri olarak değerlendirilir.

  </Tab>

  <Tab title="Access groups">
    Discord DM'leri ve metin komutu yetkilendirmesi, `channels.discord.allowFrom` içinde dinamik `accessGroup:<name>` girdileri kullanabilir.

    Erişim grubu adları ileti kanalları arasında paylaşılır. Üyeleri her kanalın normal `allowFrom` söz dizimiyle ifade edilen statik bir grup için `type: "message.senders"` kullanın veya bir Discord kanalının mevcut `ViewChannel` kitlesi üyeliği dinamik olarak tanımlamalıysa `type: "discord.channelAudience"` kullanın. Paylaşılan erişim grubu davranışı burada belgelenmiştir: [Erişim grupları](/tr/channels/access-groups).

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

    Bir Discord metin kanalının ayrı bir üye listesi yoktur. `type: "discord.channelAudience"` üyeliği şöyle modeller: DM gönderen, yapılandırılmış guild'in bir üyesidir ve rol ile kanal üzerine yazmaları uygulandıktan sonra yapılandırılmış kanalda şu anda etkin `ViewChannel` iznine sahiptir.

    Örnek: DM'leri diğer herkes için kapalı tutarken `#maintainers` kanalını görebilen herkesin bota DM göndermesine izin verin.

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

    Aramalar kapalı şekilde başarısız olur. Discord `Missing Access` döndürürse, üye araması başarısız olursa veya kanal farklı bir guild'e aitse DM gönderen yetkisiz kabul edilir.

    Kanal kitlesi erişim grupları kullanırken bot için Discord Developer Portal **Server Members Intent** özelliğini etkinleştirin. DM'ler guild üye durumunu içermez; bu nedenle OpenClaw üyeyi yetkilendirme sırasında Discord REST üzerinden çözümler.

  </Tab>

  <Tab title="Guild policy">
    Guild işleme `channels.discord.groupPolicy` tarafından denetlenir:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` mevcut olduğunda güvenli temel ayar `allowlist` olur.

    `allowlist` davranışı:

    - guild, `channels.discord.guilds` ile eşleşmelidir (`id` önerilir, slug kabul edilir)
    - isteğe bağlı gönderen izin listeleri: `users` (kararlı kimlikler önerilir) ve `roles` (yalnızca rol kimlikleri); ikisinden biri yapılandırılmışsa gönderenler `users` VEYA `roles` ile eşleştiklerinde izinli olur
    - doğrudan ad/etiket eşleştirmesi varsayılan olarak devre dışıdır; `channels.discord.dangerouslyAllowNameMatching: true` değerini yalnızca acil uyumluluk modu olarak etkinleştirin
    - adlar/etiketler `users` için desteklenir, ancak kimlikler daha güvenlidir; ad/etiket girdileri kullanıldığında `openclaw security audit` uyarır
    - bir guild'de `channels` yapılandırılmışsa listelenmeyen kanallar reddedilir
    - bir guild'de `channels` bloğu yoksa o izin listesine alınmış guild'deki tüm kanallara izin verilir

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

    Yalnızca `DISCORD_BOT_TOKEN` ayarlarsanız ve bir `channels.discord` bloğu oluşturmazsanız, çalışma zamanı geri dönüşü `groupPolicy="allowlist"` olur (günlüklerde bir uyarıyla), `channels.defaults.groupPolicy` `open` olsa bile.

  </Tab>

  <Tab title="Mentions and group DMs">
    Guild iletileri varsayılan olarak mention kapısıyla sınırlıdır.

    Mention algılama şunları içerir:

    - açık bot mention'ı
    - yapılandırılmış mention kalıpları (`agents.list[].groupChat.mentionPatterns`, geri dönüş `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda örtük bota-yanıt davranışı

    Giden Discord iletileri yazarken kanonik mention söz dizimini kullanın: kullanıcılar için `<@USER_ID>`, kanallar için `<#CHANNEL_ID>` ve roller için `<@&ROLE_ID>`. Eski `<@!USER_ID>` takma ad mention biçimini kullanmayın.

    `requireMention` guild/kanal başına yapılandırılır (`channels.discord.guilds...`).
    `ignoreOtherMentions` isteğe bağlı olarak başka bir kullanıcıdan/rolden bahseden ancak bottan bahsetmeyen iletileri düşürür (@everyone/@here hariç).

    Grup DM'leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - `dm.groupChannels` üzerinden isteğe bağlı izin listesi (kanal kimlikleri veya slug'lar)

  </Tab>
</Tabs>

### Rol tabanlı ajan yönlendirmesi

Discord guild üyelerini rol kimliğine göre farklı ajanlara yönlendirmek için `bindings[].match.roles` kullanın. Rol tabanlı bağlamalar yalnızca rol kimliklerini kabul eder ve eş veya üst-eş bağlamalarından sonra, yalnızca guild bağlamalarından önce değerlendirilir. Bir bağlama başka eşleşme alanları da ayarlarsa (örneğin `peer` + `guildId` + `roles`), yapılandırılmış tüm alanlar eşleşmelidir.

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

## Yerel komutlar ve komut kimlik doğrulaması

- `commands.native` varsayılan olarak `"auto"` değerindedir ve Discord için etkindir.
- Kanal başına geçersiz kılma: `channels.discord.commands.native`.
- `commands.native=false`, başlangıç sırasında Discord slash komut kaydını ve temizliğini atlar. Önceden kaydedilmiş komutlar, Discord uygulamasından kaldırana kadar Discord içinde görünür kalabilir.
- Yerel komut kimlik doğrulaması, normal ileti işleme ile aynı Discord izin listelerini/ilkelerini kullanır.
- Komutlar, yetkili olmayan kullanıcılar için Discord kullanıcı arayüzünde hâlâ görünebilir; yürütme yine de OpenClaw kimlik doğrulamasını uygular ve "not authorized" döndürür.

Komut kataloğu ve davranışı için [Slash komutları](/tr/tools/slash-commands) bölümüne bakın.

Varsayılan slash komut ayarları:

- `ephemeral: true`

## Özellik ayrıntıları

<AccordionGroup>
  <Accordion title="Yanıt etiketleri ve yerel yanıtlar">
    Discord, agent çıktısında yanıt etiketlerini destekler:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` tarafından denetlenir:

    - `off` (varsayılan)
    - `first`
    - `all`
    - `batched`

    Not: `off`, örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketlerine yine de uyulur.
    `first`, dönüşteki ilk giden Discord iletisine örtük yerel yanıt referansını her zaman ekler.
    `batched`, Discord'un örtük yerel yanıt referansını yalnızca gelen dönüş,
    birden çok iletiden oluşan debounced bir toplu iş olduğunda ekler. Bu,
    yerel yanıtları her tek iletili dönüşte değil, çoğunlukla belirsiz ve patlamalı sohbetlerde
    istediğinizde yararlıdır.

    İleti kimlikleri, agent'ların belirli iletileri hedefleyebilmesi için bağlamda/geçmişte sunulur.

  </Accordion>

  <Accordion title="Canlı akış önizlemesi">
    OpenClaw, geçici bir ileti gönderip metin geldikçe onu düzenleyerek taslak yanıtları akış olarak yayınlayabilir. `channels.discord.streaming`, `off` | `partial` | `block` | `progress` (varsayılan) değerlerini alır. `progress`, düzenlenebilir tek bir durum taslağı tutar ve son teslimata kadar onu araç ilerlemesiyle günceller; paylaşılan başlangıç etiketi kayan bir satırdır, bu yüzden yeterince çalışma göründüğünde diğerleri gibi kayıp gider. `streamMode`, eski bir runtime takma adıdır. Kalıcı yapılandırmayı kanonik anahtara yeniden yazmak için `openclaw doctor --fix` çalıştırın.

    Discord önizleme düzenlemelerini devre dışı bırakmak için `channels.discord.streaming.mode` değerini `off` olarak ayarlayın. Discord blok akışı açıkça etkinleştirilmişse, OpenClaw çift akışı önlemek için önizleme akışını atlar.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
    },
  },
}
```

    - `partial`, token'lar geldikçe tek bir önizleme iletisini düzenler.
    - `block`, taslak boyutunda parçalar yayar (boyutu ve kesme noktalarını ayarlamak için `draftChunk` kullanın; `textChunkLimit` ile sınırlandırılır).
    - Medya, hata ve açık yanıt finalleri bekleyen önizleme düzenlemelerini iptal eder.
    - `streaming.preview.toolProgress` (varsayılan `true`), araç/ilerleme güncellemelerinin önizleme iletisini yeniden kullanıp kullanmayacağını denetler.
    - Araç/ilerleme satırları, kullanılabilir olduğunda kompakt emoji + başlık + ayrıntı olarak işlenir; örneğin `🛠️ Bash: run tests` veya `🔎 Web Search: for "query"`.
    - `streaming.preview.commandText` / `streaming.progress.commandText`, kompakt ilerleme satırlarında komut/exec ayrıntısını denetler: `raw` (varsayılan) veya `status` (yalnızca araç etiketi).

    Kompakt ilerleme satırlarını korurken ham komut/exec metnini gizleyin:

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

    Önizleme akışı yalnızca metindir; medya yanıtları normal teslimata geri döner. `block` akışı açıkça etkinleştirildiğinde, OpenClaw çift akışı önlemek için önizleme akışını atlar.

  </Accordion>

  <Accordion title="Geçmiş, bağlam ve iş parçacığı davranışı">
    Guild geçmiş bağlamı:

    - `channels.discord.historyLimit` varsayılanı `20`
    - geri dönüş: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    DM geçmişi denetimleri:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    İş parçacığı davranışı:

    - Discord iş parçacıkları kanal oturumları olarak yönlendirilir ve geçersiz kılınmadığı sürece üst kanal yapılandırmasını devralır.
    - İş parçacığı oturumları, yalnızca model geri dönüşü olarak üst kanalın oturum düzeyi `/model` seçimini devralır; iş parçacığı yerelindeki `/model` seçimleri yine önceliklidir ve transkript devralma etkinleştirilmedikçe üst transkript geçmişi kopyalanmaz.
    - `channels.discord.thread.inheritParent` (varsayılan `false`), yeni otomatik iş parçacıklarının üst transkriptten tohumlanmasını seçer. Hesap başına geçersiz kılmalar `channels.discord.accounts.<id>.thread.inheritParent` altında bulunur.
    - İleti aracı tepkileri `user:<id>` DM hedeflerini çözebilir.
    - `guilds.<guild>.channels.<channel>.requireMention: false`, yanıt aşaması etkinleştirme geri dönüşü sırasında korunur.

    Kanal konuları **güvenilmeyen** bağlam olarak eklenir. İzin listeleri, agent'ı kimin tetikleyebileceğini denetler; tam bir ek bağlam redaksiyon sınırı değildir.

  </Accordion>

  <Accordion title="Subagent'lar için iş parçacığına bağlı oturumlar">
    Discord, bir iş parçacığını bir oturum hedefine bağlayabilir; böylece o iş parçacığındaki takip iletileri aynı oturuma yönlendirilmeye devam eder (subagent oturumları dahil).

    Komutlar:

    - `/focus <target>` mevcut/yeni iş parçacığını bir subagent/oturum hedefine bağla
    - `/unfocus` mevcut iş parçacığı bağını kaldır
    - `/agents` etkin çalıştırmaları ve bağlanma durumunu göster
    - `/session idle <duration|off>` odaklanmış bağlar için hareketsizlik otomatik odaktan çıkarma ayarını incele/güncelle
    - `/session max-age <duration|off>` odaklanmış bağlar için katı azami yaşı incele/güncelle

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

    - `session.threadBindings.*`, genel varsayılanları ayarlar.
    - `channels.discord.threadBindings.*`, Discord davranışını geçersiz kılar.
    - `spawnSessions`, `sessions_spawn({ thread: true })` ve ACP iş parçacığı spawn'ları için iş parçacıklarını otomatik oluşturma/bağlamayı denetler. Varsayılan: `true`.
    - `defaultSpawnContext`, iş parçacığına bağlı spawn'lar için yerel subagent bağlamını denetler. Varsayılan: `"fork"`.
    - Kullanımdan kaldırılmış `spawnSubagentSessions`/`spawnAcpSessions` anahtarları `openclaw doctor --fix` tarafından taşınır.
    - Bir hesap için iş parçacığı bağları devre dışıysa, `/focus` ve ilgili iş parçacığı bağlama işlemleri kullanılamaz.

    [Sub-agent'lar](/tr/tools/subagents), [ACP Agent'ları](/tr/tools/acp-agents) ve [Yapılandırma Referansı](/tr/gateway/configuration-reference) bölümlerine bakın.

  </Accordion>

  <Accordion title="Kalıcı ACP kanal bağları">
    Kararlı "always-on" ACP çalışma alanları için, Discord konuşmalarını hedefleyen üst düzey tipli ACP bağları yapılandırın.

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

    - `/acp spawn codex --bind here`, mevcut kanalı veya iş parçacığını yerinde bağlar ve gelecekteki iletileri aynı ACP oturumunda tutar. İş parçacığı iletileri üst kanal bağını devralır.
    - Bağlı bir kanalda veya iş parçacığında, `/new` ve `/reset` aynı ACP oturumunu yerinde sıfırlar. Geçici iş parçacığı bağları etkinken hedef çözümlemeyi geçersiz kılabilir.
    - `spawnSessions`, `--thread auto|here` aracılığıyla alt iş parçacığı oluşturma/bağlamayı kapıdan geçirir.

    Bağlama davranışı ayrıntıları için [ACP Agent'ları](/tr/tools/acp-agents) bölümüne bakın.

  </Accordion>

  <Accordion title="Tepki bildirimleri">
    Guild başına tepki bildirimi modu:

    - `off`
    - `own` (varsayılan)
    - `all`
    - `allowlist` (`guilds.<id>.users` kullanır)

    Tepki olayları sistem olaylarına dönüştürülür ve yönlendirilen Discord oturumuna eklenir.

  </Accordion>

  <Accordion title="Onay tepkileri">
    OpenClaw gelen bir iletiyi işlerken `ackReaction` bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - agent kimliği emoji geri dönüşü (`agents.list[].identity.emoji`, yoksa "👀")

    Notlar:

    - Discord unicode emoji veya özel emoji adlarını kabul eder.
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Yapılandırma yazmaları">
    Kanal tarafından başlatılan yapılandırma yazmaları varsayılan olarak etkindir.

    Bu, `/config set|unset` akışlarını etkiler (komut özellikleri etkinken).

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
    Discord gateway WebSocket trafiğini ve başlangıç REST aramalarını (uygulama kimliği + izin listesi çözümlemesi) `channels.discord.proxy` ile bir HTTP(S) proxy üzerinden yönlendirin.

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

  <Accordion title="PluralKit desteği">
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
    - üye görünen adları yalnızca `channels.discord.dangerouslyAllowNameMatching: true` olduğunda ad/slug ile eşleştirilir
    - aramalar özgün ileti kimliğini kullanır ve zaman penceresiyle sınırlandırılır
    - arama başarısız olursa, proxy'lenmiş iletiler bot iletileri olarak değerlendirilir ve `allowBots=true` değilse düşürülür

  </Accordion>

  <Accordion title="Giden mention takma adları">
    Agent'lar bilinen Discord kullanıcıları için deterministik giden mention'lara ihtiyaç duyduğunda `mentionAliases` kullanın. Anahtarlar baştaki `@` olmadan handle'lardır; değerler Discord kullanıcı kimlikleridir. Bilinmeyen handle'lar, `@everyone`, `@here` ve Markdown kod span'leri içindeki mention'lar değiştirilmeden bırakılır.

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

  <Accordion title="Presence yapılandırması">
    Presence güncellemeleri, bir durum veya etkinlik alanı ayarladığınızda ya da otomatik presence etkinleştirdiğinizde uygulanır.

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
    - 1: Yayın yapıyor (`activityUrl` gerektirir)
    - 2: Dinliyor
    - 3: İzliyor
    - 4: Özel (durum state'i olarak etkinlik metnini kullanır; emoji isteğe bağlıdır)
    - 5: Yarışıyor

    Otomatik presence örneği (çalışma zamanı sağlık sinyali):

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

    Otomatik presence, çalışma zamanı kullanılabilirliğini Discord durumuna eşler: healthy => online, degraded veya unknown => idle, exhausted veya unavailable => dnd. İsteğe bağlı metin geçersiz kılmaları:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` yer tutucusunu destekler)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord, DM'lerde düğme tabanlı onay işlemeyi destekler ve isteğe bağlı olarak onay istemlerini kaynak kanala gönderebilir.

    Yapılandırma yolu:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord, `enabled` ayarlanmamışsa veya `"auto"` ise ve `execApprovals.approvers` ya da `commands.ownerAllowFrom` üzerinden en az bir onaylayıcı çözümlenebiliyorsa yerel exec onaylarını otomatik olarak etkinleştirir. Discord, exec onaylayıcılarını kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan mesaj `defaultTo` değerlerinden çıkarım yapmaz. Discord'u yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `/diagnostics` ve `/export-trajectory` gibi hassas, yalnızca owner'a açık grup komutları için OpenClaw onay istemlerini ve nihai sonuçları özel olarak gönderir. Çağıran owner'ın bir Discord owner rotası olduğunda önce Discord DM'yi dener; bu kullanılamıyorsa Telegram gibi `commands.ownerAllowFrom` içindeki ilk kullanılabilir owner rotasına geri döner.

    `target`, `channel` veya `both` olduğunda onay istemi kanalda görünür. Düğmeleri yalnızca çözümlenmiş onaylayıcılar kullanabilir; diğer kullanıcılar geçici bir ret alır. Onay istemleri komut metnini içerir, bu nedenle kanal teslimini yalnızca güvenilir kanallarda etkinleştirin. Kanal ID'si oturum anahtarından türetilemiyorsa OpenClaw DM teslimine geri döner.

    Discord, diğer sohbet kanallarının kullandığı paylaşılan onay düğmelerini de işler. Yerel Discord bağdaştırıcısı temel olarak onaylayıcı DM yönlendirmesi ve kanal yayılımı ekler.
    Bu düğmeler mevcut olduğunda birincil onay UX'i bunlardır; OpenClaw
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel
    onayın tek yol olduğunu söylediğinde manuel bir `/approve` komutu içermelidir.
    Discord yerel onay çalışma zamanı etkin değilse OpenClaw yerel
    deterministik `/approve <id> <decision>` istemini görünür tutar. Çalışma
    zamanı etkinse ancak herhangi bir hedefe yerel kart teslim edilemiyorsa
    OpenClaw, bekleyen onaydaki tam `/approve` komutuyla aynı sohbette bir geri dönüş bildirimi gönderir.

    Gateway kimlik doğrulaması ve onay çözümlemesi paylaşılan Gateway istemci sözleşmesini izler (`plugin:` ID'leri `plugin.approval.resolve` üzerinden; diğer ID'ler `exec.approval.resolve` üzerinden çözümlenir). Onayların süresi varsayılan olarak 30 dakika sonra dolar.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Araçlar ve eylem kapıları

Discord mesaj eylemleri mesajlaşma, kanal yönetimi, moderasyon, presence ve metadata eylemlerini içerir.

Temel örnekler:

- mesajlaşma: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- tepkiler: `react`, `reactions`, `emojiList`
- moderasyon: `timeout`, `kick`, `ban`
- presence: `setPresence`

`event-create` eylemi, zamanlanmış etkinlik kapak görselini ayarlamak için isteğe bağlı bir `image` parametresi (URL veya yerel dosya yolu) kabul eder.

Eylem kapıları `channels.discord.actions.*` altında bulunur.

Varsayılan kapı davranışı:

| Eylem grubu                                                                                                                                                              | Varsayılan |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | etkin      |
| roles                                                                                                                                                                    | devre dışı |
| moderation                                                                                                                                                               | devre dışı |
| presence                                                                                                                                                                 | devre dışı |

## Components v2 UI

OpenClaw, exec onayları ve bağlamlar arası işaretleyiciler için Discord components v2 kullanır. Discord mesaj eylemleri ayrıca özel UI için `components` kabul edebilir (ileri düzey; discord aracı üzerinden bir bileşen payload'u oluşturmayı gerektirir), eski `embeds` ise kullanılabilir kalır ancak önerilmez.

- `channels.discord.ui.components.accentColor`, Discord bileşen kapsayıcıları tarafından kullanılan vurgu rengini ayarlar (hex).
- Hesap başına `channels.discord.accounts.<id>.ui.components.accentColor` ile ayarlayın.
- components v2 mevcut olduğunda `embeds` yok sayılır.

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

Discord'un iki ayrı ses yüzeyi vardır: gerçek zamanlı **ses kanalları** (sürekli konuşmalar) ve **sesli mesaj ekleri** (dalga formu önizleme biçimi). Gateway her ikisini de destekler.

### Ses kanalları

Kurulum kontrol listesi:

1. Discord Developer Portal'da Message Content Intent'i etkinleştirin.
2. Rol/kullanıcı izin listeleri kullanıldığında Server Members Intent'i etkinleştirin.
3. Botu `bot` ve `applications.commands` kapsamlarıyla davet edin.
4. Hedef ses kanalında Connect, Speak, Send Messages ve Read Message History izinlerini verin.
5. Yerel komutları etkinleştirin (`commands.native` veya `channels.discord.commands.native`).
6. `channels.discord.voice` yapılandırın.

Oturumları kontrol etmek için `/vc join|leave|status` kullanın. Komut, hesabın varsayılan aracısını kullanır ve diğer Discord komutlarıyla aynı izin listesi ve grup ilkesi kurallarını izler.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Katılmadan önce botun geçerli izinlerini incelemek için şunu çalıştırın:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Otomatik katılım örneği:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
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
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

Notlar:

- `voice.tts`, yalnızca `stt-tts` ses çalma için `messages.tts` değerini geçersiz kılar. Gerçek zamanlı kipler `voice.realtime.voice` kullanır.
- `voice.mode` konuşma yolunu denetler. Varsayılan değer `agent-proxy`’dir: gerçek zamanlı bir ses ön ucu tur zamanlamasını, kesintiyi ve oynatmayı yönetir, asıl işi `openclaw_agent_consult` üzerinden yönlendirilmiş OpenClaw ajanına devreder ve sonucu o konuşmacıdan yazılmış bir Discord istemi gibi ele alır. `stt-tts`, eski toplu STT artı TTS akışını korur. `bidi`, gerçek zamanlı modelin doğrudan konuşmasına izin verirken OpenClaw beyni için `openclaw_agent_consult` aracını sunar.
- `voice.agentSession`, ses turlarını hangi OpenClaw konuşmasının alacağını denetler. Ses kanalının kendi oturumu için ayarlamadan bırakın veya ses kanalının `#maintainers` gibi mevcut bir Discord metin kanalı oturumunun mikrofon/hoparlör uzantısı gibi davranmasını sağlamak için `{ mode: "target", target: "channel:<text-channel-id>" }` olarak ayarlayın.
- `voice.model`, Discord sesli yanıtları ve gerçek zamanlı danışmalar için OpenClaw ajan beynini geçersiz kılar. Yönlendirilmiş ajan modelini devralmak için ayarlamadan bırakın. `voice.realtime.model` değerinden ayrıdır.
- `agent-proxy`, konuşmayı `discord-voice` üzerinden yönlendirir; bu, konuşmacı ve hedef oturum için normal sahip/araç yetkilendirmesini korur ancak Discord ses oynatmayı üstlendiği için ajan `tts` aracını gizler. Varsayılan olarak `agent-proxy`, sahip konuşmacılar için danışmaya tam sahip eşdeğeri araç erişimi verir (`voice.realtime.toolPolicy: "owner"`) ve kapsamlı yanıtlar vermeden önce OpenClaw ajanına danışmayı güçlü biçimde tercih eder (`voice.realtime.consultPolicy: "always"`). Bu varsayılan `always` kipinde gerçek zamanlı katman, danışma yanıtından önce otomatik dolgu konuşması yapmaz; konuşmayı yakalayıp yazıya döker, ardından yönlendirilmiş OpenClaw yanıtını seslendirir. Discord ilk yanıtı hâlâ oynatırken birden çok zorunlu danışma yanıtı tamamlanırsa, sonraki birebir konuşma yanıtları konuşmayı cümlenin ortasında değiştirmek yerine oynatma boşta kalana kadar kuyruğa alınır.
- `stt-tts` kipinde STT, `tools.media.audio` kullanır; `voice.model` transkripsiyonu etkilemez.
- Gerçek zamanlı kiplerde `voice.realtime.provider`, `voice.realtime.model` ve `voice.realtime.voice`, gerçek zamanlı ses oturumunu yapılandırır. OpenAI Realtime 2 ile Codex beyni için `voice.realtime.model: "gpt-realtime-2"` ve `voice.model: "openai-codex/gpt-5.5"` kullanın.
- OpenAI gerçek zamanlı sağlayıcısı, çıktı sesi ve transkript olayları için geçerli Realtime 2 olay adlarını ve eski Codex uyumlu takma adları kabul eder; böylece uyumlu sağlayıcı anlık görüntüleri asistan sesini düşürmeden sapabilir.
- `voice.realtime.bargeIn`, Discord konuşmacı-başladı olaylarının etkin gerçek zamanlı oynatmayı kesip kesmeyeceğini denetler. Ayarlanmamışsa, gerçek zamanlı sağlayıcının giriş-sesi kesinti ayarını izler.
- `voice.realtime.minBargeInAudioEndMs`, OpenAI gerçek zamanlı araya girme sesi kesmeden önceki minimum asistan oynatma süresini denetler. Varsayılan: `250`. Düşük yankılı odalarda anında kesinti için `0` olarak ayarlayın veya yankısı yoğun hoparlör kurulumları için yükseltin.
- Discord oynatmada OpenAI sesi için `voice.tts.provider: "openai"` ayarlayın ve `voice.tts.openai.voice` veya `voice.tts.providers.openai.voice` altında bir Metinden konuşmaya sesi seçin. Geçerli OpenAI TTS modelinde `cedar`, erkeksi tınılı iyi bir seçimdir.
- Kanal bazlı Discord `systemPrompt` geçersiz kılmaları, o ses kanalının ses transkripti turlarına uygulanır.
- Ses transkripti turları sahip durumunu Discord `allowFrom` değerinden (veya `dm.allowFrom`) türetir; sahip olmayan konuşmacılar yalnızca sahiplere açık araçlara erişemez (örneğin `gateway` ve `cron`).
- Discord sesi, yalnızca metin yapılandırmaları için isteğe bağlıdır; `/vc` komutlarını, ses çalışma zamanını ve `GuildVoiceStates` Gateway niyetini etkinleştirmek için `channels.discord.voice.enabled=true` ayarlayın (veya mevcut bir `channels.discord.voice` bloğunu koruyun).
- `channels.discord.intents.voiceStates`, ses-durumu niyet aboneliğini açıkça geçersiz kılabilir. Niyetin etkin ses etkinleştirmesini izlemesi için ayarlamadan bırakın.
- `voice.autoJoin` aynı lonca için birden çok giriş içeriyorsa OpenClaw, o lonca için son yapılandırılmış kanala katılır.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` katılım seçeneklerine olduğu gibi aktarılır.
- Ayarlanmamışsa `@discordjs/voice` varsayılanları `daveEncryption=true` ve `decryptionFailureTolerance=24` şeklindedir.
- OpenClaw, Discord ses alımı için varsayılan olarak saf JS `opusscript` çözücüsünü kullanır. İsteğe bağlı yerel `@discordjs/opus` paketi repo pnpm kurulum ilkesi tarafından yok sayılır; böylece normal kurulumlar, Docker hatları ve ilgisiz testler yerel bir eklenti derlemez. Ayrılmış ses-performansı ana makineleri, yerel eklentiyi kurduktan sonra `OPENCLAW_DISCORD_OPUS_DECODER=native` ile bunu etkinleştirebilir.
- `voice.connectTimeoutMs`, `/vc join` ve otomatik katılma denemeleri için ilk `@discordjs/voice` Ready beklemesini denetler. Varsayılan: `30000`.
- `voice.reconnectGraceMs`, OpenClaw’un bağlantısı kesilmiş bir ses oturumunu yok etmeden önce yeniden bağlanmaya başlamasını ne kadar bekleyeceğini denetler. Varsayılan: `15000`.
- `stt-tts` kipinde, sırf başka bir kullanıcı konuşmaya başladı diye ses oynatma durmaz. Geri besleme döngülerinden kaçınmak için OpenClaw, TTS oynatılırken yeni ses yakalamayı yok sayar; sonraki tur için oynatma bittikten sonra konuşun. Gerçek zamanlı kipler, konuşmacı başlangıçlarını araya girme sinyalleri olarak gerçek zamanlı sağlayıcıya iletir.
- Gerçek zamanlı kiplerde, hoparlörlerden açık mikrofona gelen yankı araya girme gibi görünüp oynatmayı kesebilir. Yankısı yoğun Discord odalarında, OpenAI’ın giriş sesinde otomatik kesinti yapmasını engellemek için `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` ayarlayın. Discord konuşmacı-başladı olaylarının etkin oynatmayı yine de kesmesini istiyorsanız `voice.realtime.bargeIn: true` ekleyin. OpenAI gerçek zamanlı köprüsü, `voice.realtime.minBargeInAudioEndMs` değerinden kısa oynatma kesmelerini olası yankı/gürültü olarak yok sayar ve Discord oynatmayı temizlemek yerine atlandı olarak günlüğe yazar.
- `voice.captureSilenceGraceMs`, Discord bir konuşmacının durduğunu bildirdikten sonra OpenClaw’un o ses bölümünü STT için sonlandırmadan önce ne kadar bekleyeceğini denetler. Varsayılan: `2500`; Discord normal duraklamaları kesik kesik kısmi transkriptlere bölüyorsa bunu artırın.
- Seçili TTS sağlayıcısı ElevenLabs olduğunda Discord ses oynatma, akışlı TTS kullanır ve sağlayıcı yanıt akışından başlar. Akış desteği olmayan sağlayıcılar, sentezlenmiş geçici dosya yoluna geri döner.
- OpenClaw ayrıca alma şifre çözme hatalarını izler ve kısa bir aralıkta tekrarlanan hatalardan sonra ses kanalından çıkıp yeniden katılarak otomatik kurtarma yapar.
- Güncellemeden sonra alma günlüklerinde tekrar tekrar `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` görünürse bir bağımlılık raporu ve günlükler toplayın. Birlikte gelen `@discordjs/voice` satırı, discord.js PR #11449’daki yukarı akış dolgu düzeltmesini içerir; bu düzeltme discord.js issue #11419’u kapatmıştır.
- OpenClaw yakalanan bir konuşmacı bölümünü sonlandırırken `The operation was aborted` alma olayları beklenir; bunlar uyarı değil, ayrıntılı tanılardır.
- Ayrıntılı Discord ses günlükleri, kabul edilen her konuşmacı bölümü için sınırlı tek satırlık STT transkripti önizlemesi içerir; böylece hata ayıklama, sınırsız transkript metni dökmeden hem kullanıcı tarafını hem de ajan yanıt tarafını gösterir.
- `agent-proxy` kipinde zorunlu danışma geri dönüşü, `...` ile biten metin veya sondaki `and` gibi bir bağlaç dahil olmak üzere muhtemelen eksik transkript parçalarını ve “be right back” ya da “bye” gibi açıkça eyleme dönük olmayan kapanışları atlar. Bu, eski bir kuyruk yanıtını engellediğinde günlüklerde `forced agent consult skipped reason=...` gösterilir.

Kaynak checkout’ları için yerel opus kurulumu:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

Yukarı akış macOS arm64 önceden derlenmiş yerel eklentisini istediğinizde Gateway için Node 22 kullanın. Başka bir Node çalışma zamanı kullanırsanız, isteğe bağlı kurucu yerel bir `node-gyp` kaynak-derleme araç zincirine ihtiyaç duyabilir.

Yerel eklentiyi kurduktan sonra Gateway’i şununla başlatın:

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

Ayrıntılı ses günlüklerinde `discord voice: opus decoder: @discordjs/opus` görünmelidir. Ortam değişkeniyle etkinleştirme yoksa veya yerel eklenti eksikse ya da ana makinede yüklenemiyorsa OpenClaw, `discord voice: opus decoder: opusscript` günlüğünü yazar ve saf JS geri dönüşü üzerinden ses almaya devam eder.

STT artı TTS işlem hattı:

- Discord PCM yakalaması bir WAV geçici dosyasına dönüştürülür.
- `tools.media.audio`, örneğin `openai/gpt-4o-mini-transcribe` ile STT’yi yönetir.
- Transkript, Discord girişi ve yönlendirmesi üzerinden gönderilir; yanıt LLM’i ise ajan `tts` aracını gizleyen ve döndürülen metin isteyen bir ses-çıktısı ilkesiyle çalışır, çünkü son TTS oynatmasını Discord sesi üstlenir.
- `voice.model`, ayarlandığında yalnızca bu ses-kanalı turu için yanıt LLM’ini geçersiz kılar.
- `voice.tts`, `messages.tts` üzerine birleştirilir; akış destekli sağlayıcılar oynatıcıyı doğrudan besler, aksi halde ortaya çıkan ses dosyası katılınan kanalda oynatılır.

Varsayılan agent-proxy ses-kanalı oturumu örneği:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

`voice.agentSession` bloğu olmadığında, her ses kanalı kendi yönlendirilmiş OpenClaw oturumunu alır. Örneğin `/vc join channel:234567890123456789`, o Discord ses kanalının oturumuyla konuşur. Gerçek zamanlı model yalnızca ses ön ucudur; kapsamlı istekler yapılandırılmış OpenClaw ajanına verilir. Gerçek zamanlı model danışma aracını çağırmadan son transkript üretirse OpenClaw, varsayılanın yine ajanla konuşuyormuş gibi davranması için danışmayı geri dönüş olarak zorlar.

Eski STT artı TTS örneği:

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
          openai: {
            model: "gpt-4o-mini-tts",
            voice: "cedar",
          },
        },
      },
    },
  },
}
```

Gerçek zamanlı bidi örneği:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
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
        model: "openai-codex/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

`agent-proxy` kipinde bot yapılandırılmış ses kanalına katılır, ancak OpenClaw ajan turları hedef kanalın normal yönlendirilmiş oturumunu ve ajanını kullanır. Gerçek zamanlı ses oturumu, döndürülen sonucu tekrar ses kanalında seslendirir. Gözetmen ajan, doğru eylem buysa ayrı bir Discord mesajı göndermek dahil olmak üzere, araç ilkesine göre normal mesaj araçlarını kullanmaya devam edebilir.

Kullanışlı hedef biçimleri:

- `target: "channel:123456789012345678"` bir Discord metin kanalı oturumu üzerinden yönlendirir.
- `target: "123456789012345678"` bir kanal hedefi olarak ele alınır.
- `target: "dm:123456789012345678"` veya `target: "user:123456789012345678"` o doğrudan-mesaj oturumu üzerinden yönlendirir.

Yankısı yoğun OpenAI Realtime örneği:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
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

Bunu, model açık bir mikrofondan kendi Discord oynatmasını duyduğunda, ancak yine de konuşarak onu kesmek istediğinizde kullanın. OpenClaw, OpenAI'ın ham giriş sesiyle otomatik kesme yapmasını engellerken, `bargeIn: true` Discord konuşmacı başlama olaylarının ve zaten etkin konuşmacı sesinin, yakalanan bir sonraki sıra OpenAI'a ulaşmadan önce etkin realtime yanıtlarını iptal etmesini sağlar. `audioEndMs` değeri `minBargeInAudioEndMs` altında olan çok erken araya girme sinyalleri olası yankı/gürültü olarak değerlendirilir ve modelin ilk oynatma karesinde kesilmemesi için yok sayılır.

Beklenen ses günlükleri:

- Katılımda: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Realtime başlangıcında: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Konuşmacı sesinde: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` ve `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Atlanan eski konuşmada: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` veya `reason=non-actionable-closing ...`
- Realtime yanıt tamamlandığında: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Oynatma durduğunda/sıfırlandığında: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Realtime danışmada: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Ajan yanıtında: `discord voice: agent turn answer ...`
- Kuyruğa alınan birebir konuşmada: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, ardından `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Araya girme algılamasında: `discord voice: realtime barge-in detected source=speaker-start ...` veya `discord voice: realtime barge-in detected source=active-speaker-audio ...`, ardından `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Realtime kesintide: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, ardından `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` veya `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Yok sayılan yankı/gürültüde: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Devre dışı araya girmede: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Boştaki oynatmada: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Kesilen sesi hata ayıklamak için realtime ses günlüklerini bir zaman çizelgesi olarak okuyun:

1. `realtime audio playback started`, Discord'un asistan sesini çalmaya başladığı anlamına gelir. Köprü, asistan çıktı parçalarını, Discord PCM baytlarını, sağlayıcı realtime baytlarını ve sentezlenen ses süresini bu noktadan itibaren saymaya başlar.
2. `realtime speaker turn opened`, bir Discord konuşmacısının etkin hale geldiğini işaretler. Oynatma zaten etkinse ve `bargeIn` etkinleştirilmişse, bunu `barge-in detected source=speaker-start` izleyebilir.
3. `realtime input audio started`, o konuşmacı sırası için alınan ilk gerçek ses karesini işaretler. Burada `outputActive=true` veya sıfır olmayan bir `outputAudioMs`, asistan oynatması hâlâ etkinken mikrofonun giriş gönderdiği anlamına gelir.
4. `barge-in detected source=active-speaker-audio`, OpenClaw'un asistan oynatması etkinken canlı konuşmacı sesi gördüğü anlamına gelir. Bu, gerçek bir kesintiyi faydalı ses içermeyen bir Discord konuşmacı başlama olayından ayırt etmek için yararlıdır.
5. `barge-in requested reason=...`, OpenClaw'un realtime sağlayıcıdan etkin yanıtı iptal etmesini veya kısaltmasını istediği anlamına gelir. Kesintiden önce gerçekte ne kadar asistan sesinin çalındığını görebilmeniz için `outputAudioMs`, `outputActive` ve `playbackChunks` içerir.
6. `realtime audio playback stopped reason=...`, yerel Discord oynatma sıfırlama noktasıdır. Neden, oynatmayı kimin durdurduğunu söyler: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` veya `session-close`.
7. `realtime speaker turn closed`, yakalanan giriş sırasını özetler. `chunks=0` veya `hasAudio=false`, konuşmacı sırasının açıldığını ancak realtime köprüye kullanılabilir ses ulaşmadığını gösterir. `interruptedPlayback=true`, o giriş sırasının asistan çıktısıyla çakıştığı ve araya girme mantığını tetiklediği anlamına gelir.

Yararlı alanlar:

- `outputAudioMs`: günlük satırından önce realtime sağlayıcı tarafından üretilen asistan sesi süresi.
- `audioMs`: OpenClaw'un oynatma durmadan önce saydığı asistan sesi süresi.
- `elapsedMs`: oynatma akışını veya konuşmacı sırasını açma ve kapatma arasındaki duvar saati süresi.
- `discordBytes`: Discord sesine gönderilen veya Discord sesinden alınan 48 kHz stereo PCM baytları.
- `realtimeBytes`: realtime sağlayıcıya gönderilen veya realtime sağlayıcıdan alınan sağlayıcı biçimli PCM baytları.
- `playbackChunks`: etkin yanıt için Discord'a iletilen asistan ses parçaları.
- `sinceLastAudioMs`: son yakalanan konuşmacı ses karesi ile konuşmacı sırasının kapanması arasındaki boşluk.

Yaygın kalıplar:

- `source=active-speaker-audio`, küçük `outputAudioMs` ve yakında aynı kullanıcıyla gerçekleşen anında kesilme, genellikle hoparlör yankısının mikrofona girdiğini gösterir. `voice.realtime.minBargeInAudioEndMs` değerini artırın, hoparlör sesini azaltın, kulaklık kullanın veya `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` ayarlayın.
- `source=speaker-start` ardından `speaker turn closed ... hasAudio=false`, Discord'un konuşmacı başlangıcı bildirdiği ancak OpenClaw'a ses ulaşmadığı anlamına gelir. Bu, geçici bir Discord ses olayı, gürültü kapısı davranışı veya istemcinin mikrofonu kısa süreli etkinleştirmesi olabilir.
- Yakındaki bir araya girme veya `provider-clear-audio` olmadan `audio playback stopped reason=stream-close`, yerel Discord oynatma akışının beklenmedik şekilde sona erdiği anlamına gelir. Önceki sağlayıcı ve Discord oynatıcı günlüklerini kontrol edin.
- `capture ignored during playback (barge-in disabled)`, OpenClaw'un asistan sesi etkinken girişi bilinçli olarak bıraktığı anlamına gelir. Konuşmanın oynatmayı kesmesini istiyorsanız `voice.realtime.bargeIn` özelliğini etkinleştirin.
- `barge-in ignored ... outputActive=false`, Discord veya sağlayıcı VAD'nin konuşma bildirdiği, ancak OpenClaw'un kesilecek etkin oynatması olmadığı anlamına gelir. Bu, sesi kesmemelidir.

Kimlik bilgileri bileşen bazında çözümlenir: `voice.model` için LLM rota kimlik doğrulaması, `tools.media.audio` için STT kimlik doğrulaması, `messages.tts`/`voice.tts` için TTS kimlik doğrulaması ve `voice.realtime.providers` ya da sağlayıcının normal kimlik doğrulama yapılandırması için realtime sağlayıcı kimlik doğrulaması.

### Sesli mesajlar

Discord sesli mesajları bir dalga biçimi önizlemesi gösterir ve OGG/Opus ses gerektirir. OpenClaw dalga biçimini otomatik olarak üretir, ancak inceleme ve dönüştürme için Gateway ana makinesinde `ffmpeg` ve `ffprobe` gerekir.

- Bir **yerel dosya yolu** sağlayın (URL'ler reddedilir).
- Metin içeriğini atlayın (Discord aynı yükte metin + sesli mesajı reddeder).
- Herhangi bir ses biçimi kabul edilir; OpenClaw gerektiğinde OGG/Opus biçimine dönüştürür.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="İzin verilmeyen intent'ler kullanıldı veya bot guild mesajlarını görmüyor">

    - Message Content Intent'i etkinleştirin
    - kullanıcı/üye çözümlemesine bağlı olduğunuzda Server Members Intent'i etkinleştirin
    - intent'leri değiştirdikten sonra gateway'i yeniden başlatın

  </Accordion>

  <Accordion title="Guild mesajları beklenmedik şekilde engellendi">

    - `groupPolicy` değerini doğrulayın
    - `channels.discord.guilds` altında guild izin listesini doğrulayın
    - guild `channels` eşlemesi varsa, yalnızca listelenen kanallara izin verilir
    - `requireMention` davranışını ve mention kalıplarını doğrulayın

    Yararlı kontroller:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false ama hâlâ engelleniyor">
    Yaygın nedenler:

    - eşleşen guild/kanal izin listesi olmadan `groupPolicy="allowlist"`
    - `requireMention` yanlış yerde yapılandırılmış (mutlaka `channels.discord.guilds` veya kanal girdisi altında olmalıdır)
    - gönderen, guild/kanal `users` izin listesi tarafından engellenmiş

  </Accordion>

  <Accordion title="Uzun süren Discord sıraları veya yinelenen yanıtlar">

    Tipik günlükler:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway kuyruk ayarları:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çoklu hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - bu yalnızca Discord gateway listener işini denetler, ajan sırası ömrünü değil

    Discord, kuyruktaki ajan sıralarına kanalın sahip olduğu bir zaman aşımı uygulamaz. Mesaj listener'ları işi hemen devreder ve kuyruğa alınan Discord çalıştırmaları, oturum/araç/runtime yaşam döngüsü tamamlanana veya işi iptal edene kadar oturum başına sıralamayı korur.

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

  <Accordion title="Gateway metadata arama zaman aşımı uyarıları">
    OpenClaw, bağlanmadan önce Discord `/gateway/bot` metadata bilgisini getirir. Geçici hatalar Discord'un varsayılan gateway URL'sine geri döner ve günlüklerde hız sınırına tabi tutulur.

    Metadata zaman aşımı ayarları:

    - tek hesap: `channels.discord.gatewayInfoTimeoutMs`
    - çoklu hesap: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - yapılandırma ayarlanmamışsa env geri dönüşü: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - varsayılan: `30000` (30 saniye), maksimum: `120000`

  </Accordion>

  <Accordion title="Gateway READY zaman aşımı yeniden başlatmaları">
    OpenClaw, başlatma sırasında ve runtime yeniden bağlantılarından sonra Discord'un gateway `READY` olayını bekler. Başlatma kademelendirmesi kullanan çoklu hesap kurulumları, varsayılandan daha uzun bir başlangıç READY penceresine ihtiyaç duyabilir.

    READY zaman aşımı ayarları:

    - başlangıç tek hesap: `channels.discord.gatewayReadyTimeoutMs`
    - başlangıç çoklu hesap: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa başlangıç env geri dönüşü: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - başlangıç varsayılanı: `15000` (15 saniye), maksimum: `120000`
    - runtime tek hesap: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime çoklu hesap: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa runtime env geri dönüşü: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - runtime varsayılanı: `30000` (30 saniye), maksimum: `120000`

  </Accordion>

  <Accordion title="İzin denetimi uyuşmazlıkları">
    `channels status --probe` izin kontrolleri yalnızca sayısal kanal kimlikleri için çalışır.

    Slug anahtarları kullanırsanız runtime eşleştirme yine de çalışabilir, ancak probe izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM ve eşleştirme sorunları">

    - DM devre dışı: `channels.discord.dm.enabled=false`
    - DM policy devre dışı: `channels.discord.dmPolicy="disabled"` (eski: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Botlar arası döngüler">
    Varsayılan olarak bot tarafından yazılan mesajlar yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız, döngü davranışını önlemek için katı mention ve izin listesi kuralları kullanın.
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

  <Accordion title="DecryptionFailed(...) ile Voice STT kesiliyor">

    - Discord ses alma kurtarma mantığının mevcut olması için OpenClaw’ı güncel tutun (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` değerini doğrulayın (varsayılan)
    - `channels.discord.voice.decryptionFailureTolerance=24` ile başlayın (upstream varsayılanı) ve yalnızca gerekirse ayarlayın
    - günlüklerde şunları izleyin:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - otomatik yeniden katılmadan sonra hatalar devam ederse günlükleri toplayın ve [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) ile [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) içindeki upstream DAVE alma geçmişiyle karşılaştırın

  </Accordion>
</AccordionGroup>

## Yapılandırma referansı

Birincil referans: [Yapılandırma referansı - Discord](/tr/gateway/config-channels#discord).

<Accordion title="Yüksek sinyalli Discord alanları">

- başlangıç/kimlik doğrulama: `enabled`, `token`, `accounts.*`, `allowBots`
- ilke: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- komut: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- olay kuyruğu: `eventQueue.listenerTimeout` (dinleyici bütçesi), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- yanıt/geçmiş: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- teslim: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- akış: `streaming` (eski takma ad: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medya/yeniden deneme: `mediaMaxMb` (giden Discord yüklemelerini sınırlar, varsayılan `100MB`), `retry`
- eylemler: `actions.*`
- durum: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- özellikler: `threadBindings`, üst düzey `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Güvenlik ve operasyonlar

- Bot tokenlarını gizli olarak ele alın (gözetimli ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- En düşük ayrıcalıklı Discord izinlerini verin.
- Komut dağıtımı/durumu eskiyse Gateway’i yeniden başlatın ve `openclaw channels status --probe` ile yeniden kontrol edin.

## İlgili

<CardGroup cols={2}>
  <Card title="Eşleme" icon="link" href="/tr/channels/pairing">
    Bir Discord kullanıcısını Gateway ile eşleyin.
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
    Guild’leri ve kanalları ajanlarla eşleyin.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı.
  </Card>
</CardGroup>
