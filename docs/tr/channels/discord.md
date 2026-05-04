---
read_when:
    - Discord kanal özellikleri üzerinde çalışma
summary: Discord bot desteği durumu, yetenekleri ve yapılandırması
title: Discord
x-i18n:
    generated_at: "2026-05-04T07:02:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e00f9d9b134296ac1ca52bb4058fc62ea7a95c4d46d9478648b2ecdd448652a
    source_path: channels/discord.md
    workflow: 16
---

DM’ler ve guild kanalları için resmi Discord gateway üzerinden hazır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Discord DM’leri varsayılan olarak eşleştirme modundadır.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım akışı.
  </Card>
</CardGroup>

## Hızlı kurulum

Bir bot içeren yeni bir uygulama oluşturmanız, botu sunucunuza eklemeniz ve OpenClaw ile eşleştirmeniz gerekir. Botunuzu kendi özel sunucunuza eklemenizi öneririz. Henüz bir sunucunuz yoksa, [önce bir tane oluşturun](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** seçin).

<Steps>
  <Step title="Bir Discord uygulaması ve bot oluşturun">
    [Discord Developer Portal](https://discord.com/developers/applications) sayfasına gidin ve **New Application** öğesine tıklayın. "OpenClaw" gibi bir ad verin.

    Kenar çubuğunda **Bot** öğesine tıklayın. **Username** değerini OpenClaw agent’ınız için kullandığınız ad olarak ayarlayın.

  </Step>

  <Step title="Ayrıcalıklı intent’leri etkinleştirin">
    Hâlâ **Bot** sayfasındayken **Privileged Gateway Intents** bölümüne kaydırın ve şunları etkinleştirin:

    - **Message Content Intent** (gerekli)
    - **Server Members Intent** (önerilir; rol izin listeleri ve ad-ile-ID eşleştirmesi için gereklidir)
    - **Presence Intent** (isteğe bağlı; yalnızca presence güncellemeleri için gerekir)

  </Step>

  <Step title="Bot token’ınızı kopyalayın">
    **Bot** sayfasında tekrar yukarı kaydırın ve **Reset Token** öğesine tıklayın.

    <Note>
    Adına rağmen bu işlem ilk token’ınızı oluşturur; hiçbir şey "sıfırlanmıyor."
    </Note>

    Token’ı kopyalayın ve bir yere kaydedin. Bu sizin **Bot Token** değerinizdir ve kısa süre içinde buna ihtiyacınız olacak.

  </Step>

  <Step title="Davet URL’si oluşturun ve botu sunucunuza ekleyin">
    Kenar çubuğunda **OAuth2** öğesine tıklayın. Botu sunucunuza eklemek için doğru izinlere sahip bir davet URL’si oluşturacaksınız.

    **OAuth2 URL Generator** bölümüne kaydırın ve şunları etkinleştirin:

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

    Bu, normal metin kanalları için temel settir. Forum veya medya kanalı iş akışları dahil olmak üzere Discord thread’lerinde gönderi paylaşmayı planlıyorsanız, bir thread oluşturan veya sürdüren akışlar için **Send Messages in Threads** öğesini de etkinleştirin.
    En altta oluşturulan URL’yi kopyalayın, tarayıcınıza yapıştırın, sunucunuzu seçin ve bağlanmak için **Continue** öğesine tıklayın. Artık botunuzu Discord sunucusunda görmeniz gerekir.

  </Step>

  <Step title="Developer Mode’u etkinleştirin ve ID’lerinizi toplayın">
    Discord uygulamasına geri dönün; dahili ID’leri kopyalayabilmek için Developer Mode’u etkinleştirmeniz gerekir.

    1. **User Settings** öğesine tıklayın (avatarınızın yanındaki dişli simgesi) → **Advanced** → **Developer Mode** anahtarını açın
    2. Kenar çubuğundaki **sunucu simgenize** sağ tıklayın → **Copy Server ID**
    3. **Kendi avatarınıza** sağ tıklayın → **Copy User ID**

    **Server ID** ve **User ID** değerlerinizi Bot Token’ınızla birlikte kaydedin; bir sonraki adımda üçünü de OpenClaw’a göndereceksiniz.

  </Step>

  <Step title="Sunucu üyelerinden DM’lere izin verin">
    Eşleştirmenin çalışması için Discord’un botunuzun size DM göndermesine izin vermesi gerekir. **Sunucu simgenize** sağ tıklayın → **Privacy Settings** → **Direct Messages** anahtarını açın.

    Bu, sunucu üyelerinin (botlar dahil) size DM göndermesine izin verir. OpenClaw ile Discord DM’lerini kullanmak istiyorsanız bunu etkin tutun. Yalnızca guild kanallarını kullanmayı planlıyorsanız, eşleştirmeden sonra DM’leri devre dışı bırakabilirsiniz.

  </Step>

  <Step title="Bot token’ınızı güvenli biçimde ayarlayın (sohbette göndermeyin)">
    Discord bot token’ınız gizli bir bilgidir (parola gibi). Agent’ınıza mesaj göndermeden önce bunu OpenClaw’ın çalıştığı makinede ayarlayın.

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
    Yönetilen hizmet kurulumları için `DISCORD_BOT_TOKEN` değerinin bulunduğu bir shell’den `openclaw gateway install` çalıştırın veya değişkeni `~/.openclaw/.env` içinde saklayın; böylece hizmet yeniden başlatmadan sonra env SecretRef’i çözebilir.
    Ana makineniz Discord’un başlangıç uygulaması araması tarafından engelleniyor veya hız sınırlamasına takılıyorsa, başlangıcın bu REST çağrısını atlayabilmesi için Discord uygulama/istemci ID’sini Developer Portal’dan ayarlayın. Varsayılan hesap için `channels.discord.applicationId`, birden fazla Discord botu çalıştırdığınızda ise `channels.discord.accounts.<accountId>.applicationId` kullanın.

  </Step>

  <Step title="OpenClaw’ı yapılandırın ve eşleştirin">

    <Tabs>
      <Tab title="Agent’ınıza sorun">
        Herhangi bir mevcut kanalda (ör. Telegram) OpenClaw agent’ınızla sohbet edin ve ona söyleyin. Discord ilk kanalınızsa, bunun yerine CLI / config sekmesini kullanın.

        > "Discord bot token’ımı yapılandırmada zaten ayarladım. Lütfen User ID `<user_id>` ve Server ID `<server_id>` ile Discord kurulumunu tamamla."
      </Tab>
      <Tab title="CLI / config">
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

        Varsayılan hesap için env fallback:

```bash
DISCORD_BOT_TOKEN=...
```

        Betikli veya uzak kurulum için aynı JSON5 bloğunu `openclaw config patch --file ./discord.patch.json5 --dry-run` ile yazın ve ardından `--dry-run` olmadan yeniden çalıştırın. Düz metin `token` değerleri desteklenir. SecretRef değerleri de env/file/exec sağlayıcıları genelinde `channels.discord.token` için desteklenir. Bkz. [Secrets Management](/tr/gateway/secrets).

        Birden fazla Discord botu için her bot token’ını ve uygulama ID’sini kendi hesabı altında tutun. Üst düzey `channels.discord.applicationId` hesaplar tarafından devralınır; bu nedenle bunu yalnızca her hesabın aynı uygulama ID’sini kullanması gerektiğinde orada ayarlayın.

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
    Gateway çalışana kadar bekleyin, ardından Discord’da botunuza DM gönderin. Bir eşleştirme koduyla yanıt verecektir.

    <Tabs>
      <Tab title="Agent’ınıza sorun">
        Eşleştirme kodunu mevcut kanalınızda agent’ınıza gönderin:

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

    Artık Discord’da DM üzerinden agent’ınızla sohbet edebilmeniz gerekir.

  </Step>
</Steps>

<Note>
Token çözümleme hesap farkındadır. Config token değerleri env fallback’e üstün gelir. `DISCORD_BOT_TOKEN` yalnızca varsayılan hesap için kullanılır.
Etkinleştirilmiş iki Discord hesabı aynı bot token’ına çözülürse, OpenClaw bu token için yalnızca bir gateway monitörü başlatır. Config kaynaklı token varsayılan env fallback’e üstün gelir; aksi takdirde ilk etkinleştirilen hesap kazanır ve yinelenen hesap devre dışı olarak bildirilir.
Gelişmiş giden çağrılar (mesaj aracı/kanal eylemleri) için açık bir çağrı başına `token` o çağrı için kullanılır. Bu, gönderme ve okuma/yoklama tarzı eylemler için geçerlidir (örneğin read/search/fetch/thread/pins/permissions). Hesap ilkesi/yeniden deneme ayarları yine etkin runtime anlık görüntüsündeki seçili hesaptan gelir.
</Note>

## Önerilir: Bir guild çalışma alanı kurun

DM’ler çalıştıktan sonra Discord sunucunuzu, her kanalın kendi bağlamına sahip kendi agent oturumunu aldığı tam bir çalışma alanı olarak kurabilirsiniz. Bu, yalnızca siz ve botunuzun bulunduğu özel sunucular için önerilir.

<Steps>
  <Step title="Sunucunuzu guild izin listesine ekleyin">
    Bu, agent’ınızın yalnızca DM’lerde değil, sunucunuzdaki herhangi bir kanalda yanıt vermesini sağlar.

    <Tabs>
      <Tab title="Agent’ınıza sorun">
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
    Varsayılan olarak agent’ınız guild kanallarında yalnızca @mention yapıldığında yanıt verir. Özel bir sunucu için muhtemelen her mesaja yanıt vermesini istersiniz.

    Guild kanallarında normal asistan final yanıtları varsayılan olarak özel kalır. Görünür Discord çıktısı açıkça `message` aracıyla gönderilmelidir; böylece agent varsayılan olarak sessizce izleyebilir ve yalnızca kanal yanıtının yararlı olduğuna karar verdiğinde gönderi paylaşır.

    Bu, seçili modelin araçları güvenilir biçimde çağırması gerektiği anlamına gelir. Discord yazıyor olarak gösteriyor ve günlüklerde token kullanımı görünüyor ancak mesaj gönderilmiyorsa, `didSendViaMessagingTool: false` içeren asistan metni için oturum günlüğünü kontrol edin. Bu, modelin `message(action=send)` çağırmak yerine özel bir final yanıtı ürettiği anlamına gelir. Daha güçlü bir araç çağırma modeline geçin veya eski otomatik final yanıtlarını geri yüklemek için aşağıdaki yapılandırmayı kullanın.

    <Tabs>
      <Tab title="Agent’ınıza sorun">
        > "Agent’ımın bu sunucuda @mention edilmesine gerek kalmadan yanıt vermesine izin ver"
      </Tab>
      <Tab title="Config">
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

  <Step title="Guild kanallarında memory için plan yapın">
    Varsayılan olarak uzun vadeli memory (MEMORY.md) yalnızca DM oturumlarında yüklenir. Guild kanalları MEMORY.md dosyasını otomatik yüklemez.

    <Tabs>
      <Tab title="Agent’ınıza sorun">
        > "Discord kanallarında soru sorduğumda, MEMORY.md dosyasından uzun vadeli bağlama ihtiyacın olursa memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Manuel">
        Her kanalda paylaşılan bağlama ihtiyacınız varsa, kararlı talimatları `AGENTS.md` veya `USER.md` içine koyun (bunlar her oturuma enjekte edilir). Uzun vadeli notları `MEMORY.md` içinde tutun ve gerektiğinde memory araçlarıyla erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Şimdi Discord sunucunuzda birkaç kanal oluşturun ve sohbet etmeye başlayın. Agent’ınız kanal adını görebilir ve her kanal kendi yalıtılmış oturumunu alır; böylece `#coding`, `#home`, `#research` veya iş akışınıza uyan başka bir şeyi ayarlayabilirsiniz.

## Runtime modeli

- Gateway, Discord bağlantısının sahibidir.
- Yanıt yönlendirme deterministiktir: Discord gelen yanıtları tekrar Discord'a döner.
- Discord sunucu/kanal meta verileri, kullanıcıya görünen yanıt öneki olarak değil, güvenilmeyen
  bağlam olarak model istemine eklenir. Bir model bu zarfı
  geri kopyalarsa OpenClaw, kopyalanan meta verileri giden yanıtlardan ve
  gelecekteki tekrar oynatma bağlamından çıkarır.
- Varsayılan olarak (`session.dmScope=main`), doğrudan sohbetler aracının ana oturumunu paylaşır (`agent:main:main`).
- Sunucu kanalları yalıtılmış oturum anahtarlarıdır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM'leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel slash komutları yalıtılmış komut oturumlarında çalışır (`agent:<agentId>:discord:slash:<userId>`), ama yönlendirilmiş konuşma oturumuna `CommandTargetSessionKey` taşımaya devam eder.
- Discord'a yalnızca metin cron/heartbeat duyuru teslimi, son
  asistana görünür yanıtı bir kez kullanır. Medya ve yapılandırılmış bileşen yükleri,
  aracı birden çok teslim edilebilir yük yaydığında çok iletili kalır.

## Forum kanalları

Discord forum ve medya kanalları yalnızca ileti dizisi gönderilerini kabul eder. OpenClaw bunları oluşturmak için iki yol destekler:

- Otomatik olarak bir ileti dizisi oluşturmak için forum üst öğesine (`channel:<forumId>`) bir mesaj gönderin. İleti dizisi başlığı, mesajınızın ilk boş olmayan satırını kullanır.
- Doğrudan bir ileti dizisi oluşturmak için `openclaw message thread create` kullanın. Forum kanalları için `--message-id` geçirmeyin.

Örnek: bir ileti dizisi oluşturmak için forum üst öğesine gönderme

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Örnek: açıkça bir forum ileti dizisi oluşturma

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum üst öğeleri Discord bileşenlerini kabul etmez. Bileşenlere ihtiyacınız varsa ileti dizisinin kendisine gönderin (`channel:<threadId>`).

## Etkileşimli bileşenler

OpenClaw, aracı mesajları için Discord components v2 kapsayıcılarını destekler. Mesaj aracını bir `components` yüküyle kullanın. Etkileşim sonuçları normal gelen mesajlar olarak aracıya geri yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Eylem satırları en fazla 5 düğmeye veya tek bir seçim menüsüne izin verir
- Seçim türleri: `string`, `user`, `role`, `mentionable`, `channel`

Varsayılan olarak bileşenler tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süresi dolana kadar birden çok kez kullanılmasına izin vermek için `components.reusable=true` ayarlayın.

Bir düğmeye kimin tıklayabileceğini kısıtlamak için o düğmede `allowedUsers` ayarlayın (Discord kullanıcı kimlikleri, etiketleri veya `*`). Yapılandırıldığında eşleşmeyen kullanıcılar geçici bir ret alır.

`/model` ve `/models` slash komutları sağlayıcı, model ve uyumlu çalışma zamanı açılır menülerinin yanı sıra bir Gönder adımı içeren etkileşimli bir model seçici açar. `/models add` kullanımdan kaldırılmıştır ve artık sohbetten model kaydetmek yerine bir kullanım dışı mesajı döndürür. Seçici yanıtı geçicidir ve yalnızca çağıran kullanıcı bunu kullanabilir.

Dosya ekleri:

- `file` blokları bir ek referansını göstermelidir (`attachment://<filename>`)
- Eki `media`/`path`/`filePath` aracılığıyla sağlayın (tek dosya); birden çok dosya için `media-gallery` kullanın
- Yükleme adının ek referansıyla eşleşmesi gerektiğinde bunu geçersiz kılmak için `filename` kullanın

Modal formlar:

- En fazla 5 alanla `components.modal` ekleyin
- Alan türleri: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw otomatik olarak bir tetikleme düğmesi ekler

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
    `channels.discord.dmPolicy` DM erişimini denetler. `channels.discord.allowFrom` kanonik DM izin listesidir.

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` içinde `"*"` olmasını gerektirir)
    - `disabled`

    DM ilkesi açık değilse bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme istenir).

    Çoklu hesap önceliği:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesabına uygulanır.
    - Tek bir hesap için `allowFrom`, eski `dm.allowFrom` değerine göre önceliklidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` ve eski `dm.allowFrom` ayarlanmamışsa `channels.discord.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.discord.accounts.default.allowFrom` değerini devralmaz.

    Eski `channels.discord.dm.policy` ve `channels.discord.dm.allowFrom` uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` içine taşır.

    Teslim için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` bahsi

    Yalın sayısal kimlikler, bir kanal varsayılanı etkin olduğunda normalde kanal kimlikleri olarak çözümlenir, ancak hesabın etkili DM `allowFrom` listesinde bulunan kimlikler uyumluluk için kullanıcı DM hedefleri olarak ele alınır.

  </Tab>

  <Tab title="DM access groups">
    Discord DM'leri `channels.discord.allowFrom` içinde dinamik `accessGroup:<name>` girişleri kullanabilir.

    Erişim grubu adları mesaj kanalları arasında paylaşılır. Üyeleri her kanalın normal `allowFrom` söz dizimiyle ifade edilen statik bir grup için `type: "message.senders"` kullanın veya bir Discord kanalının mevcut `ViewChannel` kitlesinin üyeliği dinamik olarak tanımlaması gerektiğinde `type: "discord.channelAudience"` kullanın. Paylaşılan erişim grubu davranışı burada belgelenmiştir: [Erişim grupları](/tr/channels/access-groups).

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

    Bir Discord metin kanalının ayrı bir üye listesi yoktur. `type: "discord.channelAudience"` üyeliği şöyle modeller: DM gönderen, yapılandırılan sunucunun bir üyesidir ve rol ile kanal üzerine yazmaları uygulandıktan sonra yapılandırılan kanalda geçerli `ViewChannel` iznine şu anda sahiptir.

    Örnek: diğer herkes için DM'leri kapalı tutarken `#maintainers` kanalını görebilen herkesin bot'a DM göndermesine izin verin.

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

    Dinamik ve statik girişleri karıştırabilirsiniz:

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

    Aramalar kapalı başarısız olur. Discord `Missing Access` döndürürse, üye araması başarısız olursa veya kanal farklı bir sunucuya aitse DM gönderen yetkisiz olarak ele alınır.

    Kanal-kitlesi erişim gruplarını kullanırken bot için Discord Developer Portal **Server Members Intent** özelliğini etkinleştirin. DM'ler sunucu üye durumunu içermez, bu yüzden OpenClaw yetkilendirme sırasında üyeyi Discord REST üzerinden çözümler.

  </Tab>

  <Tab title="Guild policy">
    Sunucu işleme `channels.discord.groupPolicy` tarafından denetlenir:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` mevcut olduğunda güvenli temel değer `allowlist` olur.

    `allowlist` davranışı:

    - sunucu `channels.discord.guilds` ile eşleşmelidir (`id` tercih edilir, slug kabul edilir)
    - isteğe bağlı gönderen izin listeleri: `users` (kararlı kimlikler önerilir) ve `roles` (yalnızca rol kimlikleri); ikisinden biri yapılandırılmışsa gönderenler `users` VEYA `roles` ile eşleştiklerinde izinli olur
    - doğrudan ad/etiket eşleştirme varsayılan olarak devre dışıdır; `channels.discord.dangerouslyAllowNameMatching: true` değerini yalnızca acil uyumluluk modu olarak etkinleştirin
    - `users` için adlar/etiketler desteklenir, ancak kimlikler daha güvenlidir; ad/etiket girişleri kullanıldığında `openclaw security audit` uyarır
    - bir sunucuda `channels` yapılandırılmışsa listelenmeyen kanallar reddedilir
    - bir sunucuda `channels` bloğu yoksa bu izin listesine alınmış sunucudaki tüm kanallara izin verilir

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

    Yalnızca `DISCORD_BOT_TOKEN` ayarlarsanız ve bir `channels.discord` bloğu oluşturmazsanız çalışma zamanı geri dönüşü, `channels.defaults.groupPolicy` değeri `open` olsa bile `groupPolicy="allowlist"` olur (günlüklerde bir uyarıyla).

  </Tab>

  <Tab title="Mentions and group DMs">
    Sunucu mesajları varsayılan olarak bahse bağlıdır.

    Bahis algılama şunları içerir:

    - açık bot bahsi
    - yapılandırılmış bahis kalıpları (`agents.list[].groupChat.mentionPatterns`, geri dönüş `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda örtük bot'a-yanıt davranışı

    Giden Discord mesajları yazarken kanonik bahis söz dizimini kullanın: kullanıcılar için `<@USER_ID>`, kanallar için `<#CHANNEL_ID>` ve roller için `<@&ROLE_ID>`. Eski `<@!USER_ID>` takma ad bahis biçimini kullanmayın.

    `requireMention` sunucu/kanal başına yapılandırılır (`channels.discord.guilds...`).
    `ignoreOtherMentions`, isteğe bağlı olarak bot'tan başka bir kullanıcıdan/rolden bahseden mesajları düşürür (@everyone/@here hariç).

    Grup DM'leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - `dm.groupChannels` aracılığıyla isteğe bağlı izin listesi (kanal kimlikleri veya slug'lar)

  </Tab>
</Tabs>

### Role dayalı aracı yönlendirme

Discord sunucu üyelerini rol kimliğine göre farklı aracılara yönlendirmek için `bindings[].match.roles` kullanın. Role dayalı bağlamalar yalnızca rol kimliklerini kabul eder ve eş ya da üst-eş bağlamalarından sonra, yalnızca sunucu bağlamalarından önce değerlendirilir. Bir bağlama başka eşleşme alanları da ayarlarsa (örneğin `peer` + `guildId` + `roles`), yapılandırılan tüm alanlar eşleşmelidir.

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
- Kanal başına geçersiz kılma: `channels.discord.commands.native`.
- `commands.native=false`, başlatma sırasında Discord slash komutu kaydını ve temizliğini atlar. Önceden kaydedilmiş komutlar, bunları Discord uygulamasından kaldırana kadar Discord içinde görünür kalabilir.
- Yerel komut kimlik doğrulaması, normal ileti işleme ile aynı Discord izin listelerini/ilkelerini kullanır.
- Komutlar, yetkili olmayan kullanıcılar için Discord kullanıcı arayüzünde hâlâ görünür olabilir; yürütme yine de OpenClaw kimlik doğrulamasını uygular ve "yetkili değil" döndürür.

Komut kataloğu ve davranışı için [Slash komutları](/tr/tools/slash-commands) bölümüne bakın.

Varsayılan slash komutu ayarları:

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

    Not: `off`, örtük yanıt dizilimini devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de uygulanır.
    `first`, dönüşteki ilk giden Discord iletisine örtük yerel yanıt referansını her zaman ekler.
    `batched`, yalnızca gelen dönüş birden fazla iletiden oluşan debounce uygulanmış bir toplu ileti olduğunda Discord'un örtük yerel yanıt referansını ekler. Bu, her tek iletili dönüş için değil, esas olarak belirsiz yoğun sohbetlerde yerel yanıtlar istediğinizde kullanışlıdır.

    İleti kimlikleri bağlamda/geçmişte sunulur, böylece aracılar belirli iletileri hedefleyebilir.

  </Accordion>

  <Accordion title="Canlı akış önizlemesi">
    OpenClaw, geçici bir ileti gönderip metin geldikçe onu düzenleyerek taslak yanıtları akış halinde gönderebilir. `channels.discord.streaming`, `off` (varsayılan) | `partial` | `block` | `progress` değerlerini alır. `progress`, düzenlenebilir tek bir durum taslağı tutar ve son teslimata kadar araç ilerlemesiyle günceller; `streamMode` eski bir takma addır ve otomatik olarak taşınır.

    Varsayılan `off` olarak kalır çünkü birden fazla bot veya gateway bir hesabı paylaştığında Discord önizleme düzenlemeleri hız sınırlarına hızla takılır.

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

    - `partial`, tokenlar geldikçe tek bir önizleme iletisini düzenler.
    - `block`, taslak boyutunda parçalar yayar (boyutu ve kesme noktalarını ayarlamak için `draftChunk` kullanın; `textChunkLimit` ile sınırlandırılır).
    - Medya, hata ve açık yanıt son iletileri bekleyen önizleme düzenlemelerini iptal eder.
    - `streaming.preview.toolProgress` (varsayılan `true`), araç/ilerleme güncellemelerinin önizleme iletisini yeniden kullanıp kullanmayacağını denetler.
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

    Önizleme akışı yalnızca metin içindir; medya yanıtları normal teslimata geri döner. `block` akışı açıkça etkinleştirildiğinde OpenClaw, çift akışı önlemek için önizleme akışını atlar.

  </Accordion>

  <Accordion title="Geçmiş, bağlam ve konu davranışı">
    Sunucu geçmiş bağlamı:

    - `channels.discord.historyLimit` varsayılan `20`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    DM geçmiş denetimleri:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Konu davranışı:

    - Discord konuları kanal oturumları olarak yönlendirilir ve geçersiz kılınmadıkça üst kanal yapılandırmasını devralır.
    - Konu oturumları, üst kanalın oturum düzeyi `/model` seçimini yalnızca model yedeği olarak devralır; konuya yerel `/model` seçimleri yine önceliklidir ve transcript devralma etkinleştirilmediği sürece üst transcript geçmişi kopyalanmaz.
    - `channels.discord.thread.inheritParent` (varsayılan `false`), yeni otomatik konuları üst transcript'ten başlangıç verisi almaya dahil eder. Hesap başına geçersiz kılmalar `channels.discord.accounts.<id>.thread.inheritParent` altında bulunur.
    - İleti aracı tepkileri `user:<id>` DM hedeflerini çözebilir.
    - `guilds.<guild>.channels.<channel>.requireMention: false`, yanıt aşaması etkinleştirme yedeği sırasında korunur.

    Kanal konuları **güvenilmeyen** bağlam olarak enjekte edilir. İzin listeleri, aracı kimin tetikleyebileceğini sınırlar; tam bir ek bağlam redaksiyon sınırı değildir.

  </Accordion>

  <Accordion title="Alt aracılar için konuya bağlı oturumlar">
    Discord, bir konuyu oturum hedefine bağlayabilir; böylece o konudaki takip iletileri aynı oturuma yönlendirilmeye devam eder (alt aracı oturumları dahil).

    Komutlar:

    - `/focus <target>` geçerli/yeni konuyu bir alt aracı/oturum hedefine bağlar
    - `/unfocus` geçerli konu bağını kaldırır
    - `/agents` etkin çalışmaları ve bağlama durumunu gösterir
    - `/session idle <duration|off>` odaklanmış bağlar için hareketsizlikte otomatik odaktan çıkarmayı inceler/günceller
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

    - `session.threadBindings.*` genel varsayılanları ayarlar.
    - `channels.discord.threadBindings.*` Discord davranışını geçersiz kılar.
    - `spawnSessions`, `sessions_spawn({ thread: true })` ve ACP konu spawnları için konuları otomatik oluşturmayı/bağlamayı denetler. Varsayılan: `true`.
    - `defaultSpawnContext`, konuya bağlı spawnlar için yerel alt aracı bağlamını denetler. Varsayılan: `"fork"`.
    - Kullanımdan kaldırılmış `spawnSubagentSessions`/`spawnAcpSessions` anahtarları `openclaw doctor --fix` tarafından taşınır.
    - Bir hesap için konu bağları devre dışıysa `/focus` ve ilgili konu bağlama işlemleri kullanılamaz.

    [Alt aracılar](/tr/tools/subagents), [ACP Aracıları](/tr/tools/acp-agents) ve [Yapılandırma Başvurusu](/tr/gateway/configuration-reference) bölümlerine bakın.

  </Accordion>

  <Accordion title="Kalıcı ACP kanal bağları">
    Kararlı, "her zaman açık" ACP çalışma alanları için Discord konuşmalarını hedefleyen üst düzey yazımlı ACP bağları yapılandırın.

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

    - `/acp spawn codex --bind here`, geçerli kanalı veya konuyu yerinde bağlar ve gelecekteki iletileri aynı ACP oturumunda tutar. Konu iletileri üst kanal bağını devralır.
    - Bağlı bir kanalda veya konuda `/new` ve `/reset`, aynı ACP oturumunu yerinde sıfırlar. Geçici konu bağları, etkinken hedef çözümlemesini geçersiz kılabilir.
    - `spawnSessions`, `--thread auto|here` üzerinden alt konu oluşturmayı/bağlamayı kapılar.

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
    `ackReaction`, OpenClaw gelen bir iletiyi işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - aracı kimliği emoji yedeği (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Discord unicode emoji veya özel emoji adlarını kabul eder.
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Yapılandırma yazmaları">
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
    Proxy uygulanmış iletileri sistem üyesi kimliğine eşlemek için PluralKit çözümlemesini etkinleştirin:

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
    - arama başarısız olursa proxy uygulanmış iletiler bot iletileri olarak değerlendirilir ve `allowBots=true` olmadığı sürece bırakılır

  </Accordion>

  <Accordion title="Giden bahsetme takma adları">
    Aracıların bilinen Discord kullanıcıları için deterministik giden bahsetmelere ihtiyaç duyduğu durumlarda `mentionAliases` kullanın. Anahtarlar baştaki `@` olmadan handle'lardır; değerler Discord kullanıcı kimlikleridir. Bilinmeyen handle'lar, `@everyone`, `@here` ve Markdown kod spanları içindeki bahsetmeler değiştirilmeden bırakılır.

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

  <Accordion title="Varlık yapılandırması">
    Bir durum veya etkinlik alanı ayarladığınızda ya da otomatik varlığı etkinleştirdiğinizde varlık güncellemeleri uygulanır.

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

    Auto presence, çalışma zamanı kullanılabilirliğini Discord durumuyla eşler: healthy => online, degraded veya unknown => idle, exhausted veya unavailable => dnd. İsteğe bağlı metin geçersiz kılmaları:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` yer tutucusunu destekler)

  </Accordion>

  <Accordion title="Discord'da Onaylar">
    Discord, DM'lerde düğme tabanlı onay işlemeyi destekler ve isteğe bağlı olarak onay istemlerini kaynak kanala gönderebilir.

    Yapılandırma yolu:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord, `enabled` ayarlanmamışsa veya `"auto"` ise ve `execApprovals.approvers` ya da `commands.ownerAllowFrom` üzerinden en az bir onaylayıcı çözümlenebiliyorsa yerel exec onaylarını otomatik etkinleştirir. Discord, exec onaylayıcılarını kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan mesaj `defaultTo` üzerinden çıkarımsamaz. Discord'u yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `/diagnostics` ve `/export-trajectory` gibi hassas, yalnızca sahibe açık grup komutları için OpenClaw onay istemlerini ve nihai sonuçları özel olarak gönderir. Çağıran sahibin bir Discord sahip rotası varsa önce Discord DM'yi dener; bu yoksa Telegram gibi `commands.ownerAllowFrom` üzerinden kullanılabilir ilk sahip rotasına geri döner.

    `target`, `channel` veya `both` olduğunda onay istemi kanalda görünür. Yalnızca çözümlenmiş onaylayıcılar düğmeleri kullanabilir; diğer kullanıcılar geçici bir ret alır. Onay istemleri komut metnini içerir, bu nedenle kanal teslimini yalnızca güvenilir kanallarda etkinleştirin. Kanal kimliği oturum anahtarından türetilemezse OpenClaw DM teslimine geri döner.

    Discord ayrıca diğer sohbet kanallarının kullandığı paylaşılan onay düğmelerini de işler. Yerel Discord bağdaştırıcısı esas olarak onaylayıcı DM yönlendirmesi ve kanal yayılımı ekler.
    Bu düğmeler mevcut olduğunda birincil onay UX'i bunlardır; OpenClaw
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya elle onayın tek yol olduğunu söylediğinde
    elle `/approve` komutunu dahil etmelidir.
    Discord yerel onay çalışma zamanı etkin değilse OpenClaw
    yerel belirleyici `/approve <id> <decision>` istemini görünür tutar. Çalışma zamanı
    etkinse ancak yerel kart hiçbir hedefe teslim edilemiyorsa
    OpenClaw, bekleyen onaydaki tam `/approve`
    komutuyla aynı sohbete bir geri dönüş bildirimi gönderir.

    Gateway kimlik doğrulaması ve onay çözümlemesi paylaşılan Gateway istemci sözleşmesini izler (`plugin:` kimlikleri `plugin.approval.resolve` üzerinden, diğer kimlikler `exec.approval.resolve` üzerinden çözümlenir). Onayların süresi varsayılan olarak 30 dakika sonra dolar.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Araçlar ve eylem kapıları

Discord ileti eylemleri; mesajlaşma, kanal yönetimi, moderasyon, presence ve metadata eylemlerini içerir.

Temel örnekler:

- mesajlaşma: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- tepkiler: `react`, `reactions`, `emojiList`
- moderasyon: `timeout`, `kick`, `ban`
- presence: `setPresence`

`event-create` eylemi, planlanan etkinlik kapak görselini ayarlamak için isteğe bağlı bir `image` parametresi (URL veya yerel dosya yolu) kabul eder.

Eylem kapıları `channels.discord.actions.*` altında bulunur.

Varsayılan kapı davranışı:

| Eylem grubu                                                                                                                                                              | Varsayılan    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | etkin         |
| roles                                                                                                                                                                    | devre dışı    |
| moderation                                                                                                                                                               | devre dışı    |
| presence                                                                                                                                                                 | devre dışı    |

## Components v2 UI

OpenClaw, exec onayları ve bağlamlar arası işaretleyiciler için Discord components v2 kullanır. Discord ileti eylemleri özel UI için `components` da kabul edebilir (ileri düzey; discord aracıyla bir component yükü oluşturmayı gerektirir); eski `embeds` kullanılabilir kalır ancak önerilmez.

- `channels.discord.ui.components.accentColor`, Discord component kapsayıcıları tarafından kullanılan vurgu rengini ayarlar (hex).
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

Discord'un iki ayrı ses yüzeyi vardır: gerçek zamanlı **ses kanalları** (sürekli konuşmalar) ve **sesli mesaj ekleri** (dalga biçimi önizleme biçimi). Gateway ikisini de destekler.

### Ses kanalları

Kurulum kontrol listesi:

1. Discord Developer Portal'da Message Content Intent'i etkinleştirin.
2. Rol/kullanıcı izin listeleri kullanıldığında Server Members Intent'i etkinleştirin.
3. Botu `bot` ve `applications.commands` kapsamlarıyla davet edin.
4. Hedef ses kanalında Connect, Speak, Send Messages ve Read Message History izinlerini verin.
5. Yerel komutları etkinleştirin (`commands.native` veya `channels.discord.commands.native`).
6. `channels.discord.voice` yapılandırın.

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

- `voice.tts`, yalnızca ses oynatma için `messages.tts` ayarını geçersiz kılar.
- `voice.model`, yalnızca Discord ses kanalı yanıtları için kullanılan LLM'yi geçersiz kılar. Yönlendirilen ajan modelini devralmak için ayarlamadan bırakın.
- STT, `tools.media.audio` kullanır; `voice.model` transkripsiyonu etkilemez.
- Kanal başına Discord `systemPrompt` geçersiz kılmaları, ilgili ses kanalı için ses transkripti dönüşlerine uygulanır.
- Ses transkripti dönüşleri sahip durumunu Discord `allowFrom` (veya `dm.allowFrom`) üzerinden türetir; sahip olmayan konuşmacılar yalnızca sahibe açık araçlara erişemez (örneğin `gateway` ve `cron`).
- Discord ses, yalnızca metin yapılandırmaları için isteğe bağlıdır; `/vc` komutlarını, ses çalışma zamanını ve `GuildVoiceStates` gateway intent'ini etkinleştirmek için `channels.discord.voice.enabled=true` ayarlayın (veya mevcut bir `channels.discord.voice` bloğunu koruyun).
- `channels.discord.intents.voiceStates`, ses durumu intent aboneliğini açıkça geçersiz kılabilir. Intent'in etkili ses etkinleştirmesini izlemesi için ayarlamadan bırakın.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` katılma seçeneklerine aktarılır.
- `@discordjs/voice` varsayılanları, ayarlanmamışsa `daveEncryption=true` ve `decryptionFailureTolerance=24` değerleridir.
- `voice.connectTimeoutMs`, `/vc join` ve otomatik katılma denemeleri için ilk `@discordjs/voice` Ready beklemesini denetler. Varsayılan: `30000`.
- `voice.reconnectGraceMs`, OpenClaw'un bağlantısı kesilmiş bir ses oturumunu yok etmeden önce yeniden bağlanmaya başlamasını ne kadar süre bekleyeceğini denetler. Varsayılan: `15000`.
- OpenClaw ayrıca alma tarafı decrypt hatalarını izler ve kısa bir aralıkta yinelenen hatalardan sonra ses kanalından ayrılıp yeniden katılarak otomatik kurtarma yapar.
- Güncellemeden sonra alma günlükleri tekrar tekrar `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` gösterirse bir bağımlılık raporu ve günlükleri toplayın. Paketlenen `@discordjs/voice` satırı, discord.js issue #11419'u kapatan discord.js PR #11449'daki upstream padding düzeltmesini içerir.

Ses kanalı işlem hattı:

- Discord PCM yakalama, geçici bir WAV dosyasına dönüştürülür.
- `tools.media.audio`, örneğin `openai/gpt-4o-mini-transcribe`, STT'yi işler.
- Transkript, Discord ingress ve yönlendirme üzerinden gönderilir; yanıt LLM'si ise ajanın `tts` aracını gizleyen ve döndürülen metni isteyen bir ses çıkış ilkesiyle çalışır, çünkü Discord ses nihai TTS oynatmanın sahibidir.
- `voice.model` ayarlandığında yalnızca bu ses kanalı dönüşünün yanıt LLM'sini geçersiz kılar.
- `voice.tts`, `messages.tts` üzerine birleştirilir; ortaya çıkan ses, katılınan kanalda oynatılır.

Kimlik bilgileri bileşen başına çözümlenir: `voice.model` için LLM rota kimlik doğrulaması, `tools.media.audio` için STT kimlik doğrulaması ve `messages.tts`/`voice.tts` için TTS kimlik doğrulaması.

### Sesli mesajlar

Discord sesli mesajları bir dalga biçimi önizlemesi gösterir ve OGG/Opus ses gerektirir. OpenClaw dalga biçimini otomatik oluşturur, ancak inceleme ve dönüştürme için gateway ana makinesinde `ffmpeg` ve `ffprobe` gerekir.

- Bir **yerel dosya yolu** sağlayın (URL'ler reddedilir).
- Metin içeriğini atlayın (Discord aynı yükte metin + sesli mesajı reddeder).
- Herhangi bir ses biçimi kabul edilir; OpenClaw gerektiğinde OGG/Opus biçimine dönüştürür.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="İzin verilmeyen intent'ler kullanıldı veya bot hiçbir sunucu mesajı görmüyor">

    - Message Content Intent'i etkinleştirin
    - kullanıcı/üye çözümlemesine bağlı olduğunuzda Server Members Intent'i etkinleştirin
    - intent'leri değiştirdikten sonra gateway'i yeniden başlatın

  </Accordion>

  <Accordion title="Sunucu mesajları beklenmedik şekilde engelleniyor">

    - `groupPolicy` doğrulayın
    - `channels.discord.guilds` altındaki sunucu izin listesini doğrulayın
    - sunucu `channels` haritası varsa yalnızca listelenen kanallara izin verilir
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

    - eşleşen sunucu/kanal izin listesi olmadan `groupPolicy="allowlist"`
    - `requireMention` yanlış yerde yapılandırılmış (mutlaka `channels.discord.guilds` veya kanal girdisi altında olmalıdır)
    - gönderen, sunucu/kanal `users` izin listesi tarafından engellenmiş

  </Accordion>

  <Accordion title="Uzun süren Discord dönüşleri veya yinelenen yanıtlar">

    Tipik günlükler:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway kuyruğu ayarları:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çoklu hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - bu yalnızca Discord gateway dinleyici işini denetler, ajan dönüşünün ömrünü değil

    Discord, kuyruğa alınmış ajan dönüşlerine kanalın sahibi olduğu bir zaman aşımı uygulamaz. İleti dinleyicileri hemen devreder ve kuyruğa alınmış Discord çalıştırmaları, oturum/araç/çalışma zamanı yaşam döngüsü tamamlanana veya işi iptal edene kadar oturum başına sıralamayı korur.

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
    - config ayarlanmadığında env yedek değeri: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - varsayılan: `30000` (30 saniye), en fazla: `120000`

  </Accordion>

  <Accordion title="Gateway READY zaman aşımı yeniden başlatmaları">
    OpenClaw, başlatma sırasında ve çalışma zamanında yeniden bağlanmalardan sonra Discord'un Gateway `READY` olayını bekler. Başlatma kademelendirmesi kullanan çoklu hesap kurulumlarında, varsayılandan daha uzun bir başlatma READY penceresi gerekebilir.

    READY zaman aşımı ayarları:

    - başlatma tek hesap: `channels.discord.gatewayReadyTimeoutMs`
    - başlatma çoklu hesap: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - config ayarlanmadığında başlatma env yedek değeri: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - başlatma varsayılanı: `15000` (15 saniye), en fazla: `120000`
    - çalışma zamanı tek hesap: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - çalışma zamanı çoklu hesap: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - config ayarlanmadığında çalışma zamanı env yedek değeri: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - çalışma zamanı varsayılanı: `30000` (30 saniye), en fazla: `120000`

  </Accordion>

  <Accordion title="İzin denetimi uyumsuzlukları">
    `channels status --probe` izin kontrolleri yalnızca sayısal kanal kimlikleriyle çalışır.

    Slug anahtarları kullanırsanız çalışma zamanı eşleştirmesi yine çalışabilir, ancak probe izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM ve eşleştirme sorunları">

    - DM devre dışı: `channels.discord.dm.enabled=false`
    - DM ilkesi devre dışı: `channels.discord.dmPolicy="disabled"` (eski: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Bot-bot döngüleri">
    Varsayılan olarak bot tarafından yazılmış iletiler yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız, döngü davranışını önlemek için katı mention ve allowlist kuralları kullanın.
    Yalnızca botu mention eden bot mesajlarını kabul etmek için `channels.discord.allowBots="mentions"` tercih edin.

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

    - Discord ses alma kurtarma mantığının mevcut olması için OpenClaw'ı güncel tutun (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` değerini doğrulayın (varsayılan)
    - `channels.discord.voice.decryptionFailureTolerance=24` ile başlayın (upstream varsayılanı) ve yalnızca gerekirse ayarlayın
    - günlüklerde şunları izleyin:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - otomatik yeniden katılımdan sonra hatalar devam ederse, günlükleri toplayın ve [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) ile [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) içindeki upstream DAVE alma geçmişiyle karşılaştırın

  </Accordion>
</AccordionGroup>

## Yapılandırma başvurusu

Birincil başvuru: [Yapılandırma başvurusu - Discord](/tr/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- başlatma/kimlik doğrulama: `enabled`, `token`, `accounts.*`, `allowBots`
- ilke: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- komut: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- olay kuyruğu: `eventQueue.listenerTimeout` (dinleyici bütçesi), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- yanıt/geçmiş: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- teslim: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- akış: `streaming` (eski takma ad: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medya/yeniden deneme: `mediaMaxMb` (giden Discord yüklemelerini sınırlar, varsayılan `100MB`), `retry`
- eylemler: `actions.*`
- durum varlığı: `activity`, `status`, `activityType`, `activityUrl`
- kullanıcı arayüzü: `ui.components.accentColor`
- özellikler: `threadBindings`, üst düzey `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Güvenlik ve operasyonlar

- Bot token'larını sır olarak ele alın (denetimli ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- En az ayrıcalıklı Discord izinlerini verin.
- Komut dağıtımı/durumu eskiyse, gateway'i yeniden başlatın ve `openclaw channels status --probe` ile yeniden kontrol edin.

## İlgili

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Bir Discord kullanıcısını gateway ile eşleştirin.
  </Card>
  <Card title="Groups" icon="users" href="/tr/channels/groups">
    Grup sohbeti ve allowlist davranışı.
  </Card>
  <Card title="Channel routing" icon="route" href="/tr/channels/channel-routing">
    Gelen mesajları aracılara yönlendirin.
  </Card>
  <Card title="Security" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sağlamlaştırma.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/tr/concepts/multi-agent">
    Guild'leri ve kanalları aracılarla eşleyin.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı.
  </Card>
</CardGroup>
