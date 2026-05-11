---
read_when:
    - Discord kanal özellikleri üzerinde çalışma
summary: Discord bot desteği durumu, yetenekleri ve yapılandırması
title: Discord
x-i18n:
    generated_at: "2026-05-11T20:20:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70107cf53c44f80e42f99f670aacf6eed8b77d839c05bccc853cd91a7273e5aa
    source_path: channels/discord.md
    workflow: 16
---

Discord'un resmi Gateway'i üzerinden DM'ler ve guild kanalları için hazır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Discord DM'leri varsayılan olarak eşleştirme modunu kullanır.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım akışı.
  </Card>
</CardGroup>

## Hızlı kurulum

Bot içeren yeni bir uygulama oluşturmanız, botu sunucunuza eklemeniz ve OpenClaw ile eşleştirmeniz gerekir. Botunuzu kendi özel sunucunuza eklemenizi öneririz. Henüz bir sunucunuz yoksa, [önce bir tane oluşturun](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** seçin).

<Steps>
  <Step title="Discord uygulaması ve bot oluşturun">
    [Discord Developer Portal](https://discord.com/developers/applications) adresine gidin ve **New Application** öğesine tıklayın. "OpenClaw" gibi bir ad verin.

    Kenar çubuğunda **Bot** öğesine tıklayın. **Username** değerini OpenClaw ajanınıza verdiğiniz ad olarak ayarlayın.

  </Step>

  <Step title="Ayrıcalıklı intent'leri etkinleştirin">
    Yine **Bot** sayfasında, **Privileged Gateway Intents** bölümüne kadar aşağı kaydırın ve şunları etkinleştirin:

    - **Message Content Intent** (gerekli)
    - **Server Members Intent** (önerilir; rol izin listeleri ve ad ile ID eşleştirme için gereklidir)
    - **Presence Intent** (isteğe bağlı; yalnızca presence güncellemeleri için gerekir)

  </Step>

  <Step title="Bot token'ınızı kopyalayın">
    **Bot** sayfasında tekrar yukarı kaydırın ve **Reset Token** öğesine tıklayın.

    <Note>
    Adına rağmen bu işlem ilk token'ınızı üretir; hiçbir şey "sıfırlanmaz."
    </Note>

    Token'ı kopyalayın ve bir yere kaydedin. Bu sizin **Bot Token** değerinizdir ve kısa süre içinde buna ihtiyacınız olacak.

  </Step>

  <Step title="Davet URL'si oluşturun ve botu sunucunuza ekleyin">
    Kenar çubuğunda **OAuth2** öğesine tıklayın. Botu sunucunuza eklemek için doğru izinlere sahip bir davet URL'si oluşturacaksınız.

    **OAuth2 URL Generator** bölümüne kadar aşağı kaydırın ve şunları etkinleştirin:

    - `bot`
    - `applications.commands`

    Aşağıda bir **Bot Permissions** bölümü görünecek. En az şunları etkinleştirin:

    **Genel İzinler**
      - Kanalları Görüntüle
    **Metin İzinleri**
      - Mesaj Gönder
      - Mesaj Geçmişini Oku
      - Bağlantıları Göm
      - Dosya Ekle
      - Tepki Ekle (isteğe bağlı)

    Bu, normal metin kanalları için temel settir. Forum veya medya kanalı iş akışları dahil olmak üzere bir thread oluşturan ya da sürdüren Discord thread'lerine gönderi yapmayı planlıyorsanız, **Send Messages in Threads** iznini de etkinleştirin.
    Altta oluşturulan URL'yi kopyalayın, tarayıcınıza yapıştırın, sunucunuzu seçin ve bağlanmak için **Continue** öğesine tıklayın. Artık botunuzu Discord sunucusunda görmelisiniz.

  </Step>

  <Step title="Geliştirici Modu'nu etkinleştirin ve ID'lerinizi toplayın">
    Discord uygulamasına geri döndüğünüzde, dahili ID'leri kopyalayabilmek için Geliştirici Modu'nu etkinleştirmeniz gerekir.

    1. **User Settings** öğesine (avatarınızın yanındaki dişli simgesi) tıklayın → **Advanced** → **Developer Mode** seçeneğini açın
    2. Kenar çubuğundaki **sunucu simgenize** sağ tıklayın → **Copy Server ID**
    3. **Kendi avatarınıza** sağ tıklayın → **Copy User ID**

    **Server ID** ve **User ID** değerlerinizi Bot Token'ınızla birlikte kaydedin; sonraki adımda üçünü de OpenClaw'a göndereceksiniz.

  </Step>

  <Step title="Sunucu üyelerinden DM'lere izin verin">
    Eşleştirmenin çalışması için Discord'un botunuzun size DM göndermesine izin vermesi gerekir. **Sunucu simgenize** sağ tıklayın → **Privacy Settings** → **Direct Messages** seçeneğini açın.

    Bu, sunucu üyelerinin (botlar dahil) size DM göndermesine olanak tanır. OpenClaw ile Discord DM'lerini kullanmak istiyorsanız bunu etkin tutun. Yalnızca guild kanallarını kullanmayı planlıyorsanız, eşleştirmeden sonra DM'leri devre dışı bırakabilirsiniz.

  </Step>

  <Step title="Bot token'ınızı güvenli biçimde ayarlayın (sohbette göndermeyin)">
    Discord bot token'ınız bir sırdır (parola gibi). Ajanınıza mesaj göndermeden önce OpenClaw'u çalıştıran makinede ayarlayın.

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
    Yönetilen hizmet kurulumları için, `DISCORD_BOT_TOKEN` bulunan bir shell'den `openclaw gateway install` çalıştırın ya da değişkeni `~/.openclaw/.env` içinde saklayın; böylece hizmet yeniden başlatıldıktan sonra env SecretRef değerini çözebilir.
    Host'unuz Discord'un başlangıçtaki uygulama araması tarafından engelleniyor veya hız sınırına takılıyorsa, başlangıcın bu REST çağrısını atlayabilmesi için Discord uygulama/client ID'sini Developer Portal'dan ayarlayın. Varsayılan hesap için `channels.discord.applicationId` kullanın; birden fazla Discord botu çalıştırıyorsanız `channels.discord.accounts.<accountId>.applicationId` kullanın.

  </Step>

  <Step title="OpenClaw'u yapılandırın ve eşleştirin">

    <Tabs>
      <Tab title="Ajanınıza sorun">
        OpenClaw ajanınızla mevcut herhangi bir kanalda (ör. Telegram) sohbet edin ve ona söyleyin. Discord ilk kanalınızsa bunun yerine CLI / yapılandırma sekmesini kullanın.

        > "Discord bot token'ımı config içinde zaten ayarladım. Lütfen User ID `<user_id>` ve Server ID `<server_id>` ile Discord kurulumunu tamamla."
      </Tab>
      <Tab title="CLI / yapılandırma">
        Dosya tabanlı yapılandırmayı tercih ediyorsanız şunu ayarlayın:

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

        Betikli veya uzak kurulum için aynı JSON5 bloğunu `openclaw config patch --file ./discord.patch.json5 --dry-run` ile yazın ve ardından `--dry-run` olmadan yeniden çalıştırın. Düz metin `token` değerleri desteklenir. SecretRef değerleri de env/file/exec sağlayıcıları genelinde `channels.discord.token` için desteklenir. Bkz. [Sır Yönetimi](/tr/gateway/secrets).

        Birden fazla Discord botu için her bot token'ını ve uygulama ID'sini kendi hesabı altında tutun. Üst düzey `channels.discord.applicationId` hesaplar tarafından devralınır; bu nedenle yalnızca her hesap aynı uygulama ID'sini kullanacaksa orada ayarlayın.

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
    Gateway çalışana kadar bekleyin, ardından Discord'da botunuza DM gönderin. Bir eşleştirme koduyla yanıt verecek.

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

    Artık Discord'da DM üzerinden ajanınızla sohbet edebilmelisiniz.

  </Step>
</Steps>

<Note>
Token çözümleme hesap farkındadır. Config token değerleri env yedeğine göre önceliklidir. `DISCORD_BOT_TOKEN` yalnızca varsayılan hesap için kullanılır.
Etkin iki Discord hesabı aynı bot token'ına çözümlenirse, OpenClaw bu token için yalnızca bir Gateway izleyicisi başlatır. Config kaynaklı token varsayılan env yedeğine göre önceliklidir; aksi halde ilk etkin hesap kazanır ve yinelenen hesap devre dışı olarak bildirilir.
Gelişmiş giden çağrılar (mesaj aracı/kanal eylemleri) için açık bir çağrı başına `token` o çağrı için kullanılır. Bu, gönderme ve okuma/probe tarzı eylemler için geçerlidir (örneğin read/search/fetch/thread/pins/permissions). Hesap politikası/yeniden deneme ayarları yine etkin çalışma zamanı anlık görüntüsündeki seçili hesaptan gelir.
</Note>

## Önerilen: Bir guild çalışma alanı kurun

DM'ler çalıştıktan sonra, Discord sunucunuzu her kanalın kendi bağlamına sahip ayrı bir ajan oturumu aldığı tam bir çalışma alanı olarak kurabilirsiniz. Bu, yalnızca sizin ve botunuzun bulunduğu özel sunucular için önerilir.

<Steps>
  <Step title="Sunucunuzu guild izin listesine ekleyin">
    Bu, ajanınızın yalnızca DM'lerde değil, sunucunuzdaki herhangi bir kanalda yanıt vermesini sağlar.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        > "Discord Server ID `<server_id>` değerimi guild izin listesine ekle"
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

  <Step title="@mention olmadan yanıtlara izin verin">
    Varsayılan olarak ajanınız guild kanallarında yalnızca @mention edildiğinde yanıt verir. Özel bir sunucu için muhtemelen her mesaja yanıt vermesini istersiniz.

    Guild kanallarında normal asistan final yanıtları varsayılan olarak gizli kalır. Görünür Discord çıktısı açıkça `message` aracıyla gönderilmelidir; böylece ajan varsayılan olarak sessiz kalabilir ve yalnızca kanal yanıtının yararlı olduğuna karar verdiğinde gönderi paylaşır.

    Bu, seçilen modelin araçları güvenilir biçimde çağırması gerektiği anlamına gelir. Discord yazıyor gösteriyor ve günlükler token kullanımı gösteriyor ancak gönderilmiş mesaj yoksa, oturum günlüğünde `didSendViaMessagingTool: false` ile asistan metni olup olmadığını kontrol edin. Bu, modelin `message(action=send)` çağırmak yerine gizli bir final yanıt ürettiği anlamına gelir. Daha güçlü araç çağırma modeline geçin veya eski otomatik final yanıtlarını geri yüklemek için aşağıdaki yapılandırmayı kullanın.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        > "Ajanımın bu sunucuda @mention edilmesine gerek kalmadan yanıt vermesine izin ver"
      </Tab>
      <Tab title="Yapılandırma">
        Guild yapılandırmanızda `requireMention: false` ayarlayın:

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

  <Step title="Guild kanallarında bellek için plan yapın">
    Varsayılan olarak uzun süreli bellek (MEMORY.md) yalnızca DM oturumlarında yüklenir. Guild kanalları MEMORY.md dosyasını otomatik yüklemez.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        > "Discord kanallarında soru sorduğumda, MEMORY.md içinden uzun süreli bağlama ihtiyacın olursa memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Elle">
        Her kanalda paylaşılan bağlama ihtiyacınız varsa, kararlı yönergeleri `AGENTS.md` veya `USER.md` içine koyun (bunlar her oturum için enjekte edilir). Uzun süreli notları `MEMORY.md` içinde tutun ve gerektiğinde bellek araçlarıyla erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Şimdi Discord sunucunuzda birkaç kanal oluşturun ve sohbete başlayın. Ajanınız kanal adını görebilir ve her kanal kendi yalıtılmış oturumunu alır; böylece `#coding`, `#home`, `#research` veya iş akışınıza uyan başka herhangi bir şeyi kurabilirsiniz.

## Çalışma zamanı modeli

- Gateway, Discord bağlantısının sahibidir.
- Yanıt yönlendirme deterministiktir: Discord gelen yanıtları tekrar Discord'a döner.
- Discord sunucu/kanal meta verileri, kullanıcıya görünen bir yanıt ön eki olarak değil,
  güvenilmeyen bağlam olarak model istemine eklenir. Bir model bu zarfı geri kopyalarsa,
  OpenClaw kopyalanan meta verileri giden yanıtlardan ve gelecekteki yeniden oynatma bağlamından çıkarır.
- Varsayılan olarak (`session.dmScope=main`), doğrudan sohbetler ajanın ana oturumunu paylaşır (`agent:main:main`).
- Sunucu kanalları yalıtılmış oturum anahtarlarıdır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM'leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel slash komutları yalıtılmış komut oturumlarında çalışır (`agent:<agentId>:discord:slash:<userId>`), ancak yönlendirilmiş konuşma oturumuna `CommandTargetSessionKey` taşımaya devam eder.
- Discord'a metin tabanlı cron/heartbeat duyuru teslimi, son
  asistan tarafından görülebilen yanıtı bir kez kullanır. Medya ve yapılandırılmış bileşen yükleri,
  ajan birden fazla teslim edilebilir yük ürettiğinde çok mesajlı kalır.

## Forum kanalları

Discord forum ve medya kanalları yalnızca iş parçacığı gönderilerini kabul eder. OpenClaw bunları oluşturmak için iki yolu destekler:

- Otomatik olarak bir iş parçacığı oluşturmak için forum üst öğesine (`channel:<forumId>`) bir mesaj gönderin. İş parçacığı başlığı, mesajınızın ilk boş olmayan satırını kullanır.
- Doğrudan bir iş parçacığı oluşturmak için `openclaw message thread create` kullanın. Forum kanalları için `--message-id` geçmeyin.

Örnek: iş parçacığı oluşturmak için forum üst öğesine gönderin

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Örnek: bir forum iş parçacığını açıkça oluşturun

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum üst öğeleri Discord bileşenlerini kabul etmez. Bileşenlere ihtiyacınız varsa, iş parçacığının kendisine gönderin (`channel:<threadId>`).

## Etkileşimli bileşenler

OpenClaw, ajan mesajları için Discord components v2 kapsayıcılarını destekler. `components` yüküyle mesaj aracını kullanın. Etkileşim sonuçları normal gelen mesajlar olarak ajana geri yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Eylem satırları en fazla 5 düğmeye veya tek bir seçim menüsüne izin verir
- Seçim türleri: `string`, `user`, `role`, `mentionable`, `channel`

Varsayılan olarak bileşenler tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süreleri dolana kadar birden çok kez kullanılmasına izin vermek için `components.reusable=true` ayarlayın.

Bir düğmeye kimin tıklayabileceğini kısıtlamak için, o düğmede `allowedUsers` ayarlayın (Discord kullanıcı kimlikleri, etiketler veya `*`). Yapılandırıldığında, eşleşmeyen kullanıcılar geçici bir ret alır.

`/model` ve `/models` slash komutları; sağlayıcı, model ve uyumlu çalışma zamanı açılır menülerinin yanı sıra bir Gönder adımı içeren etkileşimli bir model seçici açar. `/models add` kullanımdan kaldırılmıştır ve artık sohbetten model kaydetmek yerine bir kullanımdan kaldırma mesajı döndürür. Seçici yanıtı geçicidir ve yalnızca komutu çağıran kullanıcı bunu kullanabilir. Discord seçim menüleri 25 seçenekle sınırlıdır, bu nedenle seçicinin dinamik olarak keşfedilen modelleri yalnızca `openai-codex` veya `vllm` gibi seçili sağlayıcılar için göstermesini istediğinizde `agents.defaults.models` içine `provider/*` girdileri ekleyin.

Dosya ekleri:

- `file` blokları bir ek başvurusuna işaret etmelidir (`attachment://<filename>`)
- Eki `media`/`path`/`filePath` üzerinden sağlayın (tek dosya); birden fazla dosya için `media-gallery` kullanın
- Yükleme adının ek başvurusuyla eşleşmesi gerektiğinde geçersiz kılmak için `filename` kullanın

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
  <Tab title="DM policy">
    `channels.discord.dmPolicy`, DM erişimini denetler. `channels.discord.allowFrom`, kanonik DM izin listesidir.

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    DM ilkesi açık değilse, bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme istemi gösterilir).

    Çoklu hesap önceliği:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesabı için geçerlidir.
    - Tek bir hesap için `allowFrom`, eski `dm.allowFrom` değerine göre önceliklidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` ve eski `dm.allowFrom` değerleri ayarlanmamışsa `channels.discord.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.discord.accounts.default.allowFrom` değerini devralmaz.

    Eski `channels.discord.dm.policy` ve `channels.discord.dm.allowFrom` uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` değerlerine taşır.

    Teslim için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` bahsi

    Yalın sayısal kimlikler, bir kanal varsayılanı etkin olduğunda normalde kanal kimlikleri olarak çözümlenir, ancak hesabın etkin DM `allowFrom` listesinde yer alan kimlikler uyumluluk için kullanıcı DM hedefleri olarak ele alınır.

  </Tab>

  <Tab title="Access groups">
    Discord DM'leri ve metin komutu yetkilendirmesi, `channels.discord.allowFrom` içinde dinamik `accessGroup:<name>` girdilerini kullanabilir.

    Erişim grubu adları mesaj kanalları arasında paylaşılır. Üyeleri her kanalın normal `allowFrom` söz dizimiyle ifade edilen statik bir grup için `type: "message.senders"` kullanın veya bir Discord kanalının geçerli `ViewChannel` kitlesinin üyeliği dinamik olarak tanımlaması gerektiğinde `type: "discord.channelAudience"` kullanın. Paylaşılan erişim grubu davranışı burada belgelenmiştir: [Erişim grupları](/tr/channels/access-groups).

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

    Bir Discord metin kanalının ayrı bir üye listesi yoktur. `type: "discord.channelAudience"`, üyeliği şöyle modeller: DM gönderen kişi, yapılandırılmış sunucunun bir üyesidir ve rol ile kanal üzerine yazmaları uygulandıktan sonra yapılandırılmış kanalda şu anda etkin `ViewChannel` iznine sahiptir.

    Örnek: DM'leri diğer herkese kapalı tutarken, `#maintainers` kanalını görebilen herkesin bota DM göndermesine izin verin.

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

    Aramalar kapalı başarısız olur. Discord `Missing Access` döndürürse, üye araması başarısız olursa veya kanal farklı bir sunucuya aitse, DM gönderen kişi yetkisiz kabul edilir.

    Kanal kitlesi erişim gruplarını kullanırken bot için Discord Developer Portal **Server Members Intent** özelliğini etkinleştirin. DM'ler sunucu üyesi durumunu içermez, bu nedenle OpenClaw yetkilendirme zamanında üyeyi Discord REST üzerinden çözümler.

  </Tab>

  <Tab title="Guild policy">
    Sunucu işleme `channels.discord.groupPolicy` tarafından denetlenir:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` mevcut olduğunda güvenli temel değer `allowlist` olur.

    `allowlist` davranışı:

    - sunucu `channels.discord.guilds` ile eşleşmelidir (`id` tercih edilir, slug kabul edilir)
    - isteğe bağlı gönderen izin listeleri: `users` (kararlı kimlikler önerilir) ve `roles` (yalnızca rol kimlikleri); ikisinden biri yapılandırılmışsa, gönderenler `users` VEYA `roles` ile eşleştiğinde izin verilir
    - doğrudan ad/etiket eşleştirmesi varsayılan olarak devre dışıdır; `channels.discord.dangerouslyAllowNameMatching: true` değerini yalnızca acil uyumluluk modu olarak etkinleştirin
    - `users` için adlar/etiketler desteklenir, ancak kimlikler daha güvenlidir; ad/etiket girdileri kullanıldığında `openclaw security audit` uyarır
    - bir sunucuda `channels` yapılandırılmışsa, listelenmeyen kanallar reddedilir
    - bir sunucuda `channels` bloğu yoksa, o izin listesindeki sunucudaki tüm kanallara izin verilir

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

    Yalnızca `DISCORD_BOT_TOKEN` ayarlarsanız ve bir `channels.discord` bloğu oluşturmazsanız, `channels.defaults.groupPolicy` `open` olsa bile çalışma zamanı yedeği `groupPolicy="allowlist"` olur (günlüklerde bir uyarıyla).

  </Tab>

  <Tab title="Mentions and group DMs">
    Sunucu mesajları varsayılan olarak bahse göre kapılanır.

    Bahis algılama şunları içerir:

    - açık bot bahsi
    - yapılandırılmış bahis kalıpları (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda örtük bota-yanıtla davranışı

    Giden Discord mesajları yazarken kanonik bahis söz dizimini kullanın: kullanıcılar için `<@USER_ID>`, kanallar için `<#CHANNEL_ID>` ve roller için `<@&ROLE_ID>`. Eski `<@!USER_ID>` takma ad bahis biçimini kullanmayın.

    `requireMention`, sunucu/kanal başına yapılandırılır (`channels.discord.guilds...`).
    `ignoreOtherMentions`, isteğe bağlı olarak başka bir kullanıcıdan/rolden bahseden ancak bottan bahsetmeyen mesajları düşürür (@everyone/@here hariç).

    Grup DM'leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - `dm.groupChannels` üzerinden isteğe bağlı izin listesi (kanal kimlikleri veya slug'lar)

  </Tab>
</Tabs>

### Rol tabanlı ajan yönlendirmesi

Discord sunucu üyelerini rol kimliğine göre farklı ajanlara yönlendirmek için `bindings[].match.roles` kullanın. Rol tabanlı bağlamalar yalnızca rol kimliklerini kabul eder ve eş ya da üst-eş bağlamalardan sonra, yalnızca sunucu bağlamalarından önce değerlendirilir. Bir bağlama başka eşleşme alanları da ayarlıyorsa (örneğin `peer` + `guildId` + `roles`), yapılandırılmış tüm alanlar eşleşmelidir.

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

- `commands.native` varsayılan olarak `"auto"` değerine ayarlanır ve Discord için etkindir.
- Kanal başına geçersiz kılma: `channels.discord.commands.native`.
- `commands.native=false`, başlangıç sırasında Discord eğik çizgi komutu kaydını ve temizliğini atlar. Daha önce kaydedilmiş komutlar, siz bunları Discord uygulamasından kaldırana kadar Discord içinde görünür kalabilir.
- Yerel komut kimlik doğrulaması, normal mesaj işleme ile aynı Discord izin listelerini/ilkelerini kullanır.
- Komutlar, yetkili olmayan kullanıcılar için Discord kullanıcı arayüzünde hâlâ görünebilir; yürütme yine de OpenClaw kimlik doğrulamasını uygular ve "yetkili değil" döndürür.

Komut kataloğu ve davranış için [Eğik çizgi komutları](/tr/tools/slash-commands) bölümüne bakın.

Varsayılan eğik çizgi komutu ayarları:

- `ephemeral: true`

## Özellik ayrıntıları

<AccordionGroup>
  <Accordion title="Yanıt etiketleri ve yerel yanıtlar">
    Discord, aracı çıktısında yanıt etiketlerini destekler:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` tarafından denetlenir:

    - `off` (varsayılan)
    - `first`
    - `all`
    - `batched`

    Not: `off`, örtük yanıt iş parçacığı oluşturmayı devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.
    `first`, dönüş için ilk giden Discord mesajına örtük yerel yanıt referansını her zaman ekler.
    `batched`, Discord'un örtük yerel yanıt referansını yalnızca gelen dönüş
    birden fazla mesajdan oluşan gecikmeli bir grup olduğunda ekler. Bu,
    yerel yanıtları her tek mesajlık dönüşte değil, esas olarak belirsiz
    yoğun sohbetler için istediğinizde kullanışlıdır.

    Mesaj kimlikleri, aracıların belirli mesajları hedefleyebilmesi için bağlamda/geçmişte sunulur.

  </Accordion>

  <Accordion title="Canlı akış önizlemesi">
    OpenClaw, geçici bir mesaj gönderip metin geldikçe bunu düzenleyerek taslak yanıtları akışa alabilir. `channels.discord.streaming`, `off` | `partial` | `block` | `progress` (varsayılan) değerlerini alır. `progress`, düzenlenebilir tek bir durum taslağı tutar ve bunu son teslimata kadar araç ilerlemesiyle günceller; paylaşılan başlangıç etiketi kayan bir satırdır, bu nedenle yeterince iş göründüğünde geri kalanlar gibi kayarak uzaklaşır. `streamMode` eski bir çalışma zamanı takma adıdır. Kalıcı yapılandırmayı kanonik anahtara yeniden yazmak için `openclaw doctor --fix` komutunu çalıştırın.

    Discord önizleme düzenlemelerini devre dışı bırakmak için `channels.discord.streaming.mode` değerini `off` olarak ayarlayın. Discord blok akışı açıkça etkinleştirilirse OpenClaw çift akışı önlemek için önizleme akışını atlar.

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

    - `partial`, belirteçler geldikçe tek bir önizleme mesajını düzenler.
    - `block`, taslak boyutunda parçalar yayınlar (boyutu ve kesme noktalarını ayarlamak için `draftChunk` kullanın, `textChunkLimit` ile sınırlandırılır).
    - Medya, hata ve açık yanıt sonları bekleyen önizleme düzenlemelerini iptal eder.
    - `streaming.preview.toolProgress` (varsayılan `true`), araç/ilerleme güncellemelerinin önizleme mesajını yeniden kullanıp kullanmayacağını denetler.
    - Araç/ilerleme satırları, kullanılabildiğinde kompakt emoji + başlık + ayrıntı olarak işlenir; örneğin `🛠️ Bash: run tests` veya `🔎 Web Search: for "query"`.
    - `streaming.preview.commandText` / `streaming.progress.commandText`, kompakt ilerleme satırlarında komut/yürütme ayrıntısını denetler: `raw` (varsayılan) veya `status` (yalnızca araç etiketi).

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

    Önizleme akışı yalnızca metin içindir; medya yanıtları normal teslimata geri döner. `block` akışı açıkça etkinleştirildiğinde OpenClaw çift akışı önlemek için önizleme akışını atlar.

  </Accordion>

  <Accordion title="Geçmiş, bağlam ve iş parçacığı davranışı">
    Sunucu geçmişi bağlamı:

    - `channels.discord.historyLimit` varsayılan `20`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    DM geçmişi denetimleri:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    İş parçacığı davranışı:

    - Discord iş parçacıkları kanal oturumları olarak yönlendirilir ve geçersiz kılınmadıkça üst kanal yapılandırmasını devralır.
    - İş parçacığı oturumları, üst kanalın oturum düzeyi `/model` seçimini yalnızca model için bir yedek olarak devralır; iş parçacığı yerelindeki `/model` seçimleri yine de önceliklidir ve transkript devralma etkinleştirilmedikçe üst transkript geçmişi kopyalanmaz.
    - `channels.discord.thread.inheritParent` (varsayılan `false`), yeni otomatik iş parçacıklarının üst transkriptten başlatılmasını sağlar. Hesap başına geçersiz kılmalar `channels.discord.accounts.<id>.thread.inheritParent` altında bulunur.
    - Mesaj aracı tepkileri `user:<id>` DM hedeflerini çözebilir.
    - `guilds.<guild>.channels.<channel>.requireMention: false`, yanıt aşaması etkinleştirme yedeği sırasında korunur.

    Kanal konuları **güvenilmeyen** bağlam olarak eklenir. İzin listeleri, aracıyı kimin tetikleyebileceğini sınırlar; tam bir ek bağlam redaksiyon sınırı değildir.

  </Accordion>

  <Accordion title="Alt aracılar için iş parçacığına bağlı oturumlar">
    Discord, bir iş parçacığını oturum hedefine bağlayabilir; böylece o iş parçacığındaki takip mesajları aynı oturuma yönlendirilmeye devam eder (alt aracı oturumları dahil).

    Komutlar:

    - `/focus <target>` mevcut/yeni iş parçacığını bir alt aracı/oturum hedefine bağla
    - `/unfocus` mevcut iş parçacığı bağını kaldır
    - `/agents` etkin çalıştırmaları ve bağ durumunu göster
    - `/session idle <duration|off>` odaklanmış bağlar için hareketsizlik sonrası otomatik odaktan çıkarma ayarını incele/güncelle
    - `/session max-age <duration|off>` odaklanmış bağlar için katı en yüksek yaşı incele/güncelle

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
    - `spawnSessions`, `sessions_spawn({ thread: true })` ve ACP iş parçacığı başlatmaları için iş parçacıklarını otomatik oluşturmayı/bağlamayı denetler. Varsayılan: `true`.
    - `defaultSpawnContext`, iş parçacığına bağlı başlatmalar için yerel alt aracı bağlamını denetler. Varsayılan: `"fork"`.
    - Kullanımdan kaldırılmış `spawnSubagentSessions`/`spawnAcpSessions` anahtarları `openclaw doctor --fix` tarafından taşınır.
    - Bir hesap için iş parçacığı bağları devre dışı bırakılmışsa `/focus` ve ilgili iş parçacığı bağlama işlemleri kullanılamaz.

    [Alt aracılar](/tr/tools/subagents), [ACP Aracıları](/tr/tools/acp-agents) ve [Yapılandırma Referansı](/tr/gateway/configuration-reference) bölümlerine bakın.

  </Accordion>

  <Accordion title="Kalıcı ACP kanal bağları">
    Kararlı "her zaman açık" ACP çalışma alanları için Discord konuşmalarını hedefleyen üst düzey tipli ACP bağlarını yapılandırın.

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

    - `/acp spawn codex --bind here`, mevcut kanalı veya iş parçacığını yerinde bağlar ve gelecekteki mesajları aynı ACP oturumunda tutar. İş parçacığı mesajları üst kanal bağını devralır.
    - Bağlı bir kanalda veya iş parçacığında `/new` ve `/reset`, aynı ACP oturumunu yerinde sıfırlar. Geçici iş parçacığı bağları etkinken hedef çözümlemeyi geçersiz kılabilir.
    - `spawnSessions`, `--thread auto|here` üzerinden alt iş parçacığı oluşturmayı/bağlamayı sınırlar.

    Bağlama davranışı ayrıntıları için [ACP Aracıları](/tr/tools/acp-agents) bölümüne bakın.

  </Accordion>

  <Accordion title="Tepki bildirimleri">
    Sunucu başına tepki bildirimi modu:

    - `off`
    - `own` (varsayılan)
    - `all`
    - `allowlist` (`guilds.<id>.users` kullanır)

    Tepki olayları sistem olaylarına dönüştürülür ve yönlendirilen Discord oturumuna eklenir.

  </Accordion>

  <Accordion title="Onay tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - aracı kimliği emoji yedeği (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Discord unicode emojileri veya özel emoji adlarını kabul eder.
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Yapılandırma yazımları">
    Kanal tarafından başlatılan yapılandırma yazımları varsayılan olarak etkindir.

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

  <Accordion title="PluralKit desteği">
    Proxy üzerinden iletilen mesajları sistem üyesi kimliğine eşlemek için PluralKit çözümlemesini etkinleştirin:

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
    - aramalar özgün mesaj kimliğini kullanır ve zaman penceresiyle sınırlandırılır
    - arama başarısız olursa proxy üzerinden iletilen mesajlar bot mesajları olarak değerlendirilir ve `allowBots=true` olmadıkça bırakılır

  </Accordion>

  <Accordion title="Giden mention takma adları">
    Aracılar bilinen Discord kullanıcıları için deterministik giden mention'lara ihtiyaç duyduğunda `mentionAliases` kullanın. Anahtarlar başında `@` olmayan handle'lardır; değerler Discord kullanıcı kimlikleridir. Bilinmeyen handle'lar, `@everyone`, `@here` ve Markdown kod aralıkları içindeki mention'lar değiştirilmeden bırakılır.

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
    Presence güncellemeleri, bir durum veya etkinlik alanı ayarladığınızda ya da otomatik presence özelliğini etkinleştirdiğinizde uygulanır.

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

    Etkinlik türü eşlemesi:

    - 0: Oynuyor
    - 1: Yayın yapıyor (`activityUrl` gerektirir)
    - 2: Dinliyor
    - 3: İzliyor
    - 4: Özel (etkinlik metnini durum hâli olarak kullanır; emoji isteğe bağlıdır)
    - 5: Yarışıyor

    Otomatik durum örneği (çalışma zamanı sağlık sinyali):

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

    Otomatik durum, çalışma zamanı kullanılabilirliğini Discord durumuna eşler: healthy => online, degraded veya unknown => idle, exhausted veya unavailable => dnd. İsteğe bağlı metin geçersiz kılmaları:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` yer tutucusunu destekler)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord, DM'lerde düğme tabanlı onay işlemeyi destekler ve isteğe bağlı olarak onay istemlerini kaynak kanalda yayımlayabilir.

    Yapılandırma yolu:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    `enabled` ayarlanmamış veya `"auto"` olduğunda ve `execApprovals.approvers` ya da `commands.ownerAllowFrom` üzerinden en az bir onaylayıcı çözümlenebildiğinde Discord yerel exec onaylarını otomatik olarak etkinleştirir. Discord, exec onaylayıcılarını kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan mesaj `defaultTo` değerinden çıkarım yapmaz. Discord'u yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `/diagnostics` ve `/export-trajectory` gibi hassas, yalnızca sahip komutlarına yönelik grup komutları için OpenClaw onay istemlerini ve nihai sonuçları özel olarak gönderir. Komutu çağıran sahibin Discord sahip rotası varsa önce Discord DM'yi dener; bu yoksa Telegram gibi `commands.ownerAllowFrom` içindeki ilk kullanılabilir sahip rotasına geri döner.

    `target`, `channel` veya `both` olduğunda onay istemi kanalda görünür. Düğmeleri yalnızca çözümlenmiş onaylayıcılar kullanabilir; diğer kullanıcılar geçici bir ret alır. Onay istemleri komut metnini içerir, bu nedenle kanal teslimini yalnızca güvenilir kanallarda etkinleştirin. Kanal kimliği oturum anahtarından türetilemezse OpenClaw DM teslimine geri döner.

    Discord, diğer sohbet kanalları tarafından kullanılan paylaşılan onay düğmelerini de işler. Yerel Discord bağdaştırıcısı temel olarak onaylayıcı DM yönlendirmesi ve kanal yayılımı ekler.
    Bu düğmeler mevcut olduğunda birincil onay UX'i bunlardır; OpenClaw
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu söylediğinde manuel bir `/approve` komutu
    içermelidir.
    Discord yerel onay çalışma zamanı etkin değilse OpenClaw yerel deterministik
    `/approve <id> <decision>` istemini görünür tutar. Çalışma zamanı
    etkinse ancak herhangi bir hedefe yerel kart teslim edilemiyorsa
    OpenClaw, bekleyen onaydan tam `/approve` komutunu içeren aynı sohbet içinde bir yedek bildirim gönderir.

    Gateway kimlik doğrulaması ve onay çözümlemesi paylaşılan Gateway istemci sözleşmesini izler (`plugin:` kimlikleri `plugin.approval.resolve` üzerinden; diğer kimlikler `exec.approval.resolve` üzerinden çözümlenir). Onayların süresi varsayılan olarak 30 dakika sonra dolar.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Araçlar ve eylem kapıları

Discord mesaj eylemleri mesajlaşma, kanal yöneticisi, moderasyon, durum ve meta veri eylemlerini içerir.

Temel örnekler:

- mesajlaşma: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- tepkiler: `react`, `reactions`, `emojiList`
- moderasyon: `timeout`, `kick`, `ban`
- durum: `setPresence`

`event-create` eylemi, planlanmış etkinlik kapak görselini ayarlamak için isteğe bağlı bir `image` parametresini (URL veya yerel dosya yolu) kabul eder.

Eylem kapıları `channels.discord.actions.*` altında bulunur.

Varsayılan kapı davranışı:

| Eylem grubu                                                                                                                                                             | Varsayılan |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | etkin      |
| roles                                                                                                                                                                    | devre dışı |
| moderation                                                                                                                                                               | devre dışı |
| presence                                                                                                                                                                 | devre dışı |

## Bileşenler v2 kullanıcı arayüzü

OpenClaw, exec onayları ve bağlamlar arası işaretleyiciler için Discord bileşenleri v2'yi kullanır. Discord mesaj eylemleri özel kullanıcı arayüzü için `components` da kabul edebilir (ileri düzey; discord aracıyla bir bileşen yükü oluşturmayı gerektirir), eski `embeds` ise kullanılabilir kalır ancak önerilmez.

- `channels.discord.ui.components.accentColor`, Discord bileşen kapsayıcıları tarafından kullanılan vurgu rengini ayarlar (hex).
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

Discord'un iki ayrı ses yüzeyi vardır: gerçek zamanlı **ses kanalları** (sürekli konuşmalar) ve **sesli mesaj ekleri** (dalga formu önizleme biçimi). Gateway her ikisini de destekler.

### Ses kanalları

Kurulum kontrol listesi:

1. Discord Developer Portal'da Message Content Intent'i etkinleştirin.
2. Rol/kullanıcı izin listeleri kullanıldığında Server Members Intent'i etkinleştirin.
3. Botu `bot` ve `applications.commands` kapsamlarıyla davet edin.
4. Hedef ses kanalında Connect, Speak, Send Messages ve Read Message History izinlerini verin.
5. Yerel komutları etkinleştirin (`commands.native` veya `channels.discord.commands.native`).
6. `channels.discord.voice` öğesini yapılandırın.

Oturumları kontrol etmek için `/vc join|leave|status` kullanın. Komut, hesabın varsayılan aracısını kullanır ve diğer Discord komutlarıyla aynı izin listesi ve grup ilkesi kurallarını izler.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Katılmadan önce botun etkin izinlerini incelemek için şunu çalıştırın:

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
        model: "openai-codex/gpt-5.5",
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
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

Notlar:

- `voice.tts`, yalnızca `stt-tts` ses çalma için `messages.tts` değerini geçersiz kılar. Realtime modları `voice.realtime.voice` kullanır.
- `voice.mode`, konuşma yolunu kontrol eder. Varsayılan `agent-proxy` değeridir: bir realtime ses ön ucu sıra zamanlamasını, kesintiyi ve oynatmayı yönetir, asıl işi `openclaw_agent_consult` üzerinden yönlendirilen OpenClaw ajanına devreder ve sonucu o konuşmacıdan gelen yazılı bir Discord istemi gibi ele alır. `stt-tts`, eski toplu STT artı TTS akışını korur. `bidi`, OpenClaw beyni için `openclaw_agent_consult` sunarken realtime modelin doğrudan sohbet etmesine izin verir.
- `voice.agentSession`, ses sıralarını hangi OpenClaw konuşmasının alacağını kontrol eder. Ses kanalının kendi oturumu için ayarsız bırakın veya ses kanalının `#maintainers` gibi mevcut bir Discord metin kanalı oturumunun mikrofon/hoparlör uzantısı gibi davranmasını sağlamak için `{ mode: "target", target: "channel:<text-channel-id>" }` olarak ayarlayın.
- `voice.model`, Discord ses yanıtları ve realtime danışmaları için OpenClaw ajan beynini geçersiz kılar. Yönlendirilen ajan modelini devralmak için ayarsız bırakın. `voice.realtime.model` değerinden ayrıdır.
- `agent-proxy`, konuşmayı `discord-voice` üzerinden yönlendirir; bu, konuşmacı ve hedef oturum için normal sahip/araç yetkilendirmesini korur ancak Discord ses oynatmayı üstlendiği için ajanın `tts` aracını gizler. Varsayılan olarak `agent-proxy`, sahip konuşmacılar için danışmaya tam sahip eşdeğeri araç erişimi verir (`voice.realtime.toolPolicy: "owner"`) ve asıl yanıtlardan önce OpenClaw ajanına danışmayı güçlü biçimde tercih eder (`voice.realtime.consultPolicy: "always"`). Bu varsayılan `always` modunda realtime katmanı danışma yanıtından önce otomatik olarak dolgu konuşması yapmaz; konuşmayı yakalar ve yazıya döker, ardından yönlendirilen OpenClaw yanıtını seslendirir. Discord ilk yanıtı hâlâ oynatırken birden fazla zorunlu danışma yanıtı tamamlanırsa, sonraki birebir konuşma yanıtları konuşmayı cümlenin ortasında değiştirmek yerine oynatma boşa çıkana kadar kuyruğa alınır.
- `stt-tts` modunda STT, `tools.media.audio` kullanır; `voice.model` yazıya dökmeyi etkilemez.
- Realtime modlarında `voice.realtime.provider`, `voice.realtime.model` ve `voice.realtime.voice`, realtime ses oturumunu yapılandırır. OpenAI Realtime 2 ve Codex beyni için `voice.realtime.model: "gpt-realtime-2"` ve `voice.model: "openai-codex/gpt-5.5"` kullanın.
- OpenAI realtime sağlayıcısı, geçerli Realtime 2 olay adlarını ve çıktı sesi ile transkript olayları için eski Codex uyumlu takma adları kabul eder; böylece uyumlu sağlayıcı anlık görüntüleri asistan sesini düşürmeden kayabilir.
- `voice.realtime.bargeIn`, Discord konuşmacı başlama olaylarının etkin realtime oynatmayı kesip kesmeyeceğini kontrol eder. Ayarsızsa realtime sağlayıcının giriş-sesi kesinti ayarını izler.
- `voice.realtime.minBargeInAudioEndMs`, bir OpenAI realtime araya girme işlemi sesi kısaltmadan önceki minimum asistan oynatma süresini kontrol eder. Varsayılan: `250`. Düşük yankılı odalarda anında kesinti için `0` ayarlayın veya yankısı yoğun hoparlör kurulumları için yükseltin.
- Discord oynatmada OpenAI sesi için `voice.tts.provider: "openai"` ayarlayın ve `voice.tts.openai.voice` ya da `voice.tts.providers.openai.voice` altında bir Text-to-speech sesi seçin. `cedar`, geçerli OpenAI TTS modelinde erkeksi tınlayan iyi bir seçimdir.
- Kanal başına Discord `systemPrompt` geçersiz kılmaları, o ses kanalı için ses transkripti sıralarına uygulanır.
- Ses transkripti sıraları sahip durumunu Discord `allowFrom` (veya `dm.allowFrom`) üzerinden türetir; sahip olmayan konuşmacılar yalnızca sahiplere açık araçlara erişemez (örneğin `gateway` ve `cron`).
- Discord sesi, yalnızca metin yapılandırmaları için isteğe bağlıdır; `/vc` komutlarını, ses çalışma zamanını ve `GuildVoiceStates` Gateway intent'ini etkinleştirmek için `channels.discord.voice.enabled=true` ayarlayın (veya mevcut bir `channels.discord.voice` bloğunu koruyun).
- `channels.discord.intents.voiceStates`, ses durumu intent aboneliğini açıkça geçersiz kılabilir. Intent'in etkili ses etkinleştirmesini izlemesi için ayarsız bırakın.
- `voice.autoJoin` aynı guild için birden fazla giriş içeriyorsa OpenClaw, o guild için son yapılandırılan kanala katılır.
- `voice.allowedChannels`, isteğe bağlı bir ikamet izin listesidir. `/vc join` komutunun yetkili herhangi bir Discord ses kanalına girmesine izin vermek için ayarsız bırakın. Ayarlandığında `/vc join`, başlangıçta otomatik katılma ve bot ses durumu taşımaları listelenen `{ guildId, channelId }` girişleriyle sınırlanır. Tüm Discord ses katılımlarını reddetmek için boş diziye ayarlayın. Discord botu izin listesinin dışına taşırsa OpenClaw o kanaldan ayrılır ve kullanılabilir olduğunda yapılandırılmış otomatik katılma hedefine yeniden katılır.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` katılma seçeneklerine aktarılır.
- Ayarsızsa `@discordjs/voice` varsayılanları `daveEncryption=true` ve `decryptionFailureTolerance=24` değerleridir.
- OpenClaw, Discord ses alımı için varsayılan olarak saf JS `opusscript` çözücüsünü kullanır. İsteğe bağlı yerel `@discordjs/opus` paketi repo pnpm kurulum politikası tarafından yok sayılır; böylece normal kurulumlar, Docker hatları ve ilgisiz testler yerel bir eklenti derlemez. Özel ses performansı ana makineleri, yerel eklentiyi kurduktan sonra `OPENCLAW_DISCORD_OPUS_DECODER=native` ile bunu seçebilir.
- `voice.connectTimeoutMs`, `/vc join` ve otomatik katılma denemeleri için ilk `@discordjs/voice` Ready beklemesini kontrol eder. Varsayılan: `30000`.
- `voice.reconnectGraceMs`, OpenClaw'ın bağlantısı kesilmiş bir ses oturumunu yok etmeden önce yeniden bağlanmaya başlamasını ne kadar bekleyeceğini kontrol eder. Varsayılan: `15000`.
- `stt-tts` modunda, başka bir kullanıcı konuşmaya başladı diye ses oynatma durmaz. Geri besleme döngülerini önlemek için OpenClaw, TTS oynatılırken yeni ses yakalamayı yok sayar; sonraki sıra için oynatma bittikten sonra konuşun. Realtime modları konuşmacı başlangıçlarını araya girme sinyalleri olarak realtime sağlayıcıya iletir.
- Realtime modlarında, hoparlörlerden açık mikrofona gelen yankı araya girme gibi görünebilir ve oynatmayı kesebilir. Yankısı yoğun Discord odalarında OpenAI'nin giriş sesiyle otomatik kesinti yapmasını engellemek için `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` ayarlayın. Discord konuşmacı başlama olaylarının etkin oynatmayı kesmesini hâlâ istiyorsanız `voice.realtime.bargeIn: true` ekleyin. OpenAI realtime köprüsü, `voice.realtime.minBargeInAudioEndMs` değerinden kısa oynatma kısaltmalarını olası yankı/gürültü olarak yok sayar ve Discord oynatmasını temizlemek yerine atlandı olarak günlüğe kaydeder.
- `voice.captureSilenceGraceMs`, Discord bir konuşmacının durduğunu bildirdikten sonra OpenClaw'ın o ses segmentini STT için sonlandırmadan önce ne kadar bekleyeceğini kontrol eder. Varsayılan: `2500`; Discord normal duraklamaları kesik kesik kısmi transkriptlere bölüyorsa bunu yükseltin.
- ElevenLabs seçili TTS sağlayıcısı olduğunda Discord ses oynatma, streaming TTS kullanır ve sağlayıcı yanıt akışından başlar. Streaming desteği olmayan sağlayıcılar sentezlenmiş geçici dosya yoluna geri döner.
- OpenClaw ayrıca alma şifre çözme hatalarını izler ve kısa bir zaman aralığında tekrarlanan hatalardan sonra ses kanalından ayrılıp yeniden katılarak otomatik kurtarma yapar.
- Güncellemeden sonra alma günlükleri tekrar tekrar `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` gösteriyorsa bir bağımlılık raporu ve günlükler toplayın. Paketlenen `@discordjs/voice` hattı, discord.js PR #11449'dan gelen upstream padding düzeltmesini içerir; bu düzeltme discord.js issue #11419'u kapatmıştır.
- `The operation was aborted` alma olayları, OpenClaw yakalanmış bir konuşmacı segmentini sonlandırdığında beklenir; bunlar ayrıntılı tanılardır, uyarı değildir.
- Ayrıntılı Discord ses günlükleri, kabul edilen her konuşmacı segmenti için sınırlandırılmış tek satırlık bir STT transkript önizlemesi içerir; böylece hata ayıklama, sınırsız transkript metni dökmeden hem kullanıcı tarafını hem de ajan yanıt tarafını gösterir.
- `agent-proxy` modunda zorunlu danışma geri dönüşü, `...` ile biten metin veya `and` gibi sondaki bağlaçlar dahil muhtemelen eksik transkript parçalarını ve “be right back” ya da “bye” gibi açıkça eyleme geçirilemeyen kapanışları atlar. Bu, eski bir kuyruklanmış yanıtı önlediğinde günlükler `forced agent consult skipped reason=...` gösterir.

Kaynak checkout'ları için yerel opus kurulumu:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

Upstream macOS arm64 önceden derlenmiş yerel eklentiyi istediğinizde Gateway için Node 22 kullanın. Başka bir Node çalışma zamanı kullanırsanız isteğe bağlı kurucunun yerel bir `node-gyp` kaynak derleme araç zincirine ihtiyacı olabilir.

Yerel eklentiyi kurduktan sonra Gateway'i şununla başlatın:

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

Ayrıntılı ses günlükleri `discord voice: opus decoder: @discordjs/opus` göstermelidir. Env seçimi olmadan veya yerel eklenti eksikse ya da ana makinede yüklenemiyorsa OpenClaw `discord voice: opus decoder: opusscript` günlüğünü yazar ve saf JS geri dönüşü üzerinden ses almaya devam eder.

STT artı TTS pipeline'ı:

- Discord PCM yakalaması bir WAV geçici dosyasına dönüştürülür.
- `tools.media.audio`, STT'yi işler; örneğin `openai/gpt-4o-mini-transcribe`.
- Transkript, Discord girişi ve yönlendirmesi üzerinden gönderilir; yanıt LLM'i ise ajanın `tts` aracını gizleyen ve döndürülen metni isteyen bir ses-çıkışı politikasıyla çalışır, çünkü son TTS oynatmayı Discord sesi üstlenir.
- `voice.model` ayarlandığında, yalnızca bu ses kanalı sırası için yanıt LLM'ini geçersiz kılar.
- `voice.tts`, `messages.tts` üzerine birleştirilir; streaming yeteneği olan sağlayıcılar oynatıcıyı doğrudan besler, aksi halde ortaya çıkan ses dosyası katılınan kanalda oynatılır.

Varsayılan agent-proxy ses kanalı oturumu örneği:

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

`voice.agentSession` bloğu olmadığında her ses kanalı kendi yönlendirilmiş OpenClaw oturumunu alır. Örneğin `/vc join channel:234567890123456789`, o Discord ses kanalının oturumuyla konuşur. Realtime model yalnızca ses ön ucudur; asıl istekler yapılandırılmış OpenClaw ajanına aktarılır. Realtime model danışma aracını çağırmadan nihai bir transkript üretirse OpenClaw, varsayılanın hâlâ ajanla konuşmak gibi davranması için danışmayı geri dönüş olarak zorlar.

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

Realtime bidi örneği:

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

`agent-proxy` modunda bot yapılandırılmış ses kanalına katılır, ancak OpenClaw ajan sıraları hedef kanalın normal yönlendirilmiş oturumunu ve ajanını kullanır. Realtime ses oturumu döndürülen sonucu ses kanalına geri seslendirir. Supervisor ajan, doğru eylem buysa ayrı bir Discord mesajı göndermek dahil olmak üzere araç politikasına göre normal mesaj araçlarını hâlâ kullanabilir.

Yararlı hedef biçimleri:

- `target: "channel:123456789012345678"`, bir Discord metin kanalı oturumu üzerinden yönlendirir.
- `target: "123456789012345678"`, kanal hedefi olarak ele alınır.
- `target: "dm:123456789012345678"` veya `target: "user:123456789012345678"`, o doğrudan mesaj oturumu üzerinden yönlendirir.

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

Model kendi Discord oynatımını açık bir mikrofon üzerinden duyduğunda, ama yine de konuşarak onu kesmek istediğinizde bunu kullanın. OpenClaw, OpenAI'ın ham giriş sesinde otomatik kesinti yapmasını engellerken, `bargeIn: true` Discord konuşmacı başlatma olaylarının ve zaten etkin olan konuşmacı sesinin, bir sonraki yakalanan sıra OpenAI'a ulaşmadan önce etkin realtime yanıtlarını iptal etmesine izin verir. `audioEndMs` değeri `minBargeInAudioEndMs` altında olan çok erken araya girme sinyalleri olası yankı/gürültü olarak değerlendirilir ve yok sayılır; böylece model ilk oynatma karesinde kesilmez.

Beklenen ses günlükleri:

- Katılımda: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Realtime başlangıcında: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Konuşmacı sesinde: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` ve `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Eski konuşma atlandığında: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` veya `reason=non-actionable-closing ...`
- Realtime yanıtı tamamlandığında: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Oynatma durduğunda/sıfırlandığında: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Realtime danışmada: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Agent yanıtında: `discord voice: agent turn answer ...`
- Kuyruğa alınan tam konuşmada: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, ardından `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Araya girme algılandığında: `discord voice: realtime barge-in detected source=speaker-start ...` veya `discord voice: realtime barge-in detected source=active-speaker-audio ...`, ardından `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Realtime kesintisinde: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, ardından `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` veya `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Yok sayılan yankı/gürültüde: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Araya girme devre dışı olduğunda: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Boştaki oynatmada: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Kesilen sesi hata ayıklamak için realtime ses günlüklerini bir zaman çizelgesi olarak okuyun:

1. `realtime audio playback started`, Discord'un asistan sesini oynatmaya başladığı anlamına gelir. Bridge, bu noktadan itibaren asistan çıktı parçalarını, Discord PCM baytlarını, sağlayıcı realtime baytlarını ve sentezlenen ses süresini saymaya başlar.
2. `realtime speaker turn opened`, bir Discord konuşmacısının etkin hale geldiğini belirtir. Oynatma zaten etkinse ve `bargeIn` etkinleştirilmişse, bunu `barge-in detected source=speaker-start` izleyebilir.
3. `realtime input audio started`, o konuşmacı sırası için alınan ilk gerçek ses karesini belirtir. Burada `outputActive=true` veya sıfır olmayan bir `outputAudioMs`, mikrofonun asistan oynatımı hâlâ etkinken giriş gönderdiği anlamına gelir.
4. `barge-in detected source=active-speaker-audio`, OpenClaw'un asistan oynatımı etkinken canlı konuşmacı sesi gördüğü anlamına gelir. Bu, gerçek bir kesintiyi işe yarar ses içermeyen bir Discord konuşmacı başlatma olayından ayırmak için yararlıdır.
5. `barge-in requested reason=...`, OpenClaw'un realtime sağlayıcıdan etkin yanıtı iptal etmesini veya kesmesini istediği anlamına gelir. Kesintiden önce gerçekte ne kadar asistan sesi oynatıldığını görebilmeniz için `outputAudioMs`, `outputActive` ve `playbackChunks` içerir.
6. `realtime audio playback stopped reason=...`, yerel Discord oynatma sıfırlama noktasıdır. Neden, oynatmayı kimin durdurduğunu söyler: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` veya `session-close`.
7. `realtime speaker turn closed`, yakalanan giriş sırasını özetler. `chunks=0` veya `hasAudio=false`, konuşmacı sırasının açıldığını ama realtime bridge'e kullanılabilir ses ulaşmadığını gösterir. `interruptedPlayback=true`, bu giriş sırasının asistan çıktısıyla çakıştığını ve araya girme mantığını tetiklediğini gösterir.

Yararlı alanlar:

- `outputAudioMs`: günlük satırından önce realtime sağlayıcı tarafından üretilen asistan ses süresi.
- `audioMs`: oynatma durmadan önce OpenClaw'un saydığı asistan ses süresi.
- `elapsedMs`: oynatma akışının veya konuşmacı sırasının açılması ile kapanması arasındaki duvar saati süresi.
- `discordBytes`: Discord voice'a gönderilen veya Discord voice'tan alınan 48 kHz stereo PCM baytları.
- `realtimeBytes`: realtime sağlayıcıya gönderilen veya sağlayıcıdan alınan sağlayıcı formatındaki PCM baytları.
- `playbackChunks`: etkin yanıt için Discord'a iletilen asistan ses parçaları.
- `sinceLastAudioMs`: yakalanan son konuşmacı ses karesi ile konuşmacı sırasının kapanması arasındaki boşluk.

Yaygın örüntüler:

- `source=active-speaker-audio`, küçük `outputAudioMs` ve yakında aynı kullanıcı ile anında kesilme, genellikle hoparlör yankısının mikrofona girdiğini gösterir. `voice.realtime.minBargeInAudioEndMs` değerini yükseltin, hoparlör sesini azaltın, kulaklık kullanın veya `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` ayarlayın.
- `source=speaker-start` ardından `speaker turn closed ... hasAudio=false`, Discord'un bir konuşmacı başlangıcı bildirdiği ancak OpenClaw'a ses ulaşmadığı anlamına gelir. Bu geçici bir Discord voice olayı, gürültü kapısı davranışı veya istemcinin mikrofonu kısa süreliğine tetiklemesi olabilir.
- Yakınında araya girme veya `provider-clear-audio` olmadan `audio playback stopped reason=stream-close`, yerel Discord oynatma akışının beklenmedik şekilde sona erdiği anlamına gelir. Öncesindeki sağlayıcı ve Discord oynatıcı günlüklerini kontrol edin.
- `capture ignored during playback (barge-in disabled)`, OpenClaw'un asistan sesi etkinken girişi bilerek attığı anlamına gelir. Konuşmanın oynatmayı kesmesini istiyorsanız `voice.realtime.bargeIn` seçeneğini etkinleştirin.
- `barge-in ignored ... outputActive=false`, Discord veya sağlayıcı VAD'nin konuşma bildirdiği ama OpenClaw'un kesilecek etkin oynatması olmadığı anlamına gelir. Bu, sesi kesmemelidir.

Kimlik bilgileri bileşen başına çözümlenir: `voice.model` için LLM rota kimlik doğrulaması, `tools.media.audio` için STT kimlik doğrulaması, `messages.tts`/`voice.tts` için TTS kimlik doğrulaması ve `voice.realtime.providers` veya sağlayıcının normal kimlik doğrulama yapılandırması için realtime sağlayıcı kimlik doğrulaması.

### Sesli mesajlar

Discord sesli mesajları bir dalga formu önizlemesi gösterir ve OGG/Opus ses gerektirir. OpenClaw dalga formunu otomatik olarak üretir, ancak incelemek ve dönüştürmek için gateway ana makinesinde `ffmpeg` ve `ffprobe` gerekir.

- Bir **yerel dosya yolu** sağlayın (URL'ler reddedilir).
- Metin içeriğini atlayın (Discord aynı payload içinde metin + sesli mesajı reddeder).
- Herhangi bir ses formatı kabul edilir; OpenClaw gerektiğinde OGG/Opus'a dönüştürür.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - Message Content Intent'i etkinleştirin
    - kullanıcı/üye çözümlemesine bağlı olduğunuzda Server Members Intent'i etkinleştirin
    - intent'leri değiştirdikten sonra gateway'i yeniden başlatın

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - `groupPolicy` değerini doğrulayın
    - `channels.discord.guilds` altındaki guild izin listesini doğrulayın
    - guild `channels` haritası varsa, yalnızca listelenen kanallara izin verilir
    - `requireMention` davranışını ve bahsetme örüntülerini doğrulayın

    Yararlı kontroller:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    Yaygın nedenler:

    - eşleşen guild/kanal izin listesi olmadan `groupPolicy="allowlist"`
    - `requireMention` yanlış yerde yapılandırılmış (mutlaka `channels.discord.guilds` veya kanal girdisi altında olmalıdır)
    - gönderen, guild/kanal `users` izin listesi tarafından engellenmiş

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Tipik günlükler:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway kuyruğu ayarları:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çoklu hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - bu yalnızca Discord gateway dinleyici işini denetler, agent sıra ömrünü değil

    Discord, kuyruğa alınmış agent sıralarına kanalın sahip olduğu bir zaman aşımı uygulamaz. Mesaj dinleyicileri hemen devreder ve kuyruğa alınmış Discord çalıştırmaları, oturum/araç/runtime yaşam döngüsü işi tamamlayana veya iptal edene kadar oturum başına sıralamayı korur.

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

  <Accordion title="Gateway metadata lookup timeout warnings">
    OpenClaw bağlanmadan önce Discord `/gateway/bot` metadata bilgisini alır. Geçici arızalar Discord'un varsayılan gateway URL'sine geri döner ve günlüklerde hız sınırlamasına tabidir.

    Metadata zaman aşımı ayarları:

    - tek hesap: `channels.discord.gatewayInfoTimeoutMs`
    - çoklu hesap: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - yapılandırma ayarlanmamışsa env geri dönüşü: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - varsayılan: `30000` (30 saniye), en fazla: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw, başlangıç sırasında ve runtime yeniden bağlanmalarından sonra Discord'un gateway `READY` olayını bekler. Başlangıç geciktirmeli çoklu hesap kurulumları, varsayılandan daha uzun bir başlangıç READY penceresine ihtiyaç duyabilir.

    READY zaman aşımı ayarları:

    - başlangıç tek hesap: `channels.discord.gatewayReadyTimeoutMs`
    - başlangıç çoklu hesap: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa başlangıç env geri dönüşü: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - başlangıç varsayılanı: `15000` (15 saniye), en fazla: `120000`
    - runtime tek hesap: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime çoklu hesap: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa runtime env geri dönüşü: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - runtime varsayılanı: `30000` (30 saniye), en fazla: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    `channels status --probe` izin kontrolleri yalnızca sayısal kanal kimlikleriyle çalışır.

    Slug anahtarları kullanıyorsanız, runtime eşleştirmesi yine de çalışabilir, ancak probe izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM devre dışı: `channels.discord.dm.enabled=false`
    - DM ilkesi devre dışı: `channels.discord.dmPolicy="disabled"` (eski: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Bot to bot loops">
    Varsayılan olarak bot tarafından yazılan mesajlar yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız döngü davranışından kaçınmak için katı bahsetme ve izin listesi kuralları kullanın.
    Yalnızca botu etiketleyen bot mesajlarını kabul etmek için `channels.discord.allowBots="mentions"` tercih edin.

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

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - Discord ses alma kurtarma mantığının mevcut olması için OpenClaw’ı güncel tutun (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` değerini doğrulayın (varsayılan)
    - `channels.discord.voice.decryptionFailureTolerance=24` ile başlayın (upstream varsayılanı) ve yalnızca gerekirse ayarlayın
    - günlüklerde şunları izleyin:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - otomatik yeniden katılımdan sonra hatalar devam ederse günlükleri toplayın ve [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) ile [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) içindeki upstream DAVE alma geçmişiyle karşılaştırın

  </Accordion>
</AccordionGroup>

## Yapılandırma referansı

Birincil referans: [Yapılandırma referansı - Discord](/tr/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- başlatma/kimlik doğrulama: `enabled`, `token`, `accounts.*`, `allowBots`
- ilke: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- komut: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- olay kuyruğu: `eventQueue.listenerTimeout` (dinleyici bütçesi), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- yanıt/geçmiş: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- teslim: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (eski diğer ad: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medya/yeniden deneme: `mediaMaxMb` (giden Discord yüklemelerini sınırlar, varsayılan `100MB`), `retry`
- eylemler: `actions.*`
- varlık: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- özellikler: `threadBindings`, üst düzey `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Güvenlik ve işlemler

- Bot token’larını sır olarak ele alın (denetimli ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- En az ayrıcalıklı Discord izinleri verin.
- Komut dağıtımı/durumu güncel değilse gateway’i yeniden başlatın ve `openclaw channels status --probe` ile yeniden kontrol edin.

## İlgili

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Bir Discord kullanıcısını gateway ile eşleştirin.
  </Card>
  <Card title="Groups" icon="users" href="/tr/channels/groups">
    Grup sohbeti ve izin listesi davranışı.
  </Card>
  <Card title="Channel routing" icon="route" href="/tr/channels/channel-routing">
    Gelen mesajları aracılara yönlendirin.
  </Card>
  <Card title="Security" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sıkılaştırma.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/tr/concepts/multi-agent">
    Sunucuları ve kanalları aracılarla eşleyin.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı.
  </Card>
</CardGroup>
