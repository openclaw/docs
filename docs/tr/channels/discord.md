---
read_when:
    - Discord kanal özellikleri üzerinde çalışılıyor
summary: Discord botu desteğinin durumu, yetenekleri ve yapılandırması
title: Discord
x-i18n:
    generated_at: "2026-05-03T21:27:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a38cb3c8e25c1f3d6b7ddfc35a0445dc264be74d74b08d0051528b462b743a3
    source_path: channels/discord.md
    workflow: 16
---

DM'ler ve resmi Discord Gateway üzerinden guild kanalları için hazır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Discord DM'leri varsayılan olarak eşleştirme modundadır.
  </Card>
  <Card title="Eğik çizgi komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım akışı.
  </Card>
</CardGroup>

## Hızlı kurulum

Bot içeren yeni bir uygulama oluşturmanız, botu sunucunuza eklemeniz ve OpenClaw ile eşleştirmeniz gerekir. Botunuzu kendi özel sunucunuza eklemenizi öneririz. Henüz bir sunucunuz yoksa [önce bir tane oluşturun](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** seçin).

<Steps>
  <Step title="Discord uygulaması ve botu oluşturun">
    [Discord Developer Portal](https://discord.com/developers/applications) sayfasına gidin ve **New Application** öğesine tıklayın. Buna "OpenClaw" gibi bir ad verin.

    Kenar çubuğunda **Bot** öğesine tıklayın. **Username** değerini OpenClaw aracınıza verdiğiniz ad olarak ayarlayın.

  </Step>

  <Step title="Ayrıcalıklı intent'leri etkinleştirin">
    Hâlâ **Bot** sayfasındayken **Privileged Gateway Intents** bölümüne kadar aşağı kaydırın ve şunları etkinleştirin:

    - **Message Content Intent** (gerekli)
    - **Server Members Intent** (önerilir; rol izin listeleri ve ad-kimlik eşleştirmesi için gereklidir)
    - **Presence Intent** (isteğe bağlı; yalnızca presence güncellemeleri için gerekir)

  </Step>

  <Step title="Bot token'ınızı kopyalayın">
    **Bot** sayfasında tekrar yukarı kaydırın ve **Reset Token** öğesine tıklayın.

    <Note>
    Adına rağmen bu ilk token'ınızı oluşturur; hiçbir şey "sıfırlanmıyor."
    </Note>

    Token'ı kopyalayın ve bir yere kaydedin. Bu sizin **Bot Token** değerinizdir ve kısa süre içinde buna ihtiyacınız olacak.

  </Step>

  <Step title="Davet URL'si oluşturun ve botu sunucunuza ekleyin">
    Kenar çubuğunda **OAuth2** öğesine tıklayın. Botu sunucunuza eklemek için doğru izinlere sahip bir davet URL'si oluşturacaksınız.

    **OAuth2 URL Generator** bölümüne kadar aşağı kaydırın ve şunları etkinleştirin:

    - `bot`
    - `applications.commands`

    Aşağıda bir **Bot Permissions** bölümü görünecektir. En azından şunları etkinleştirin:

    **Genel İzinler**
      - Kanalları Görüntüle
    **Metin İzinleri**
      - Mesaj Gönder
      - Mesaj Geçmişini Oku
      - Bağlantıları Göm
      - Dosya Ekle
      - Tepki Ekle (isteğe bağlı)

    Bu, normal metin kanalları için temel kümedir. Bir thread oluşturan veya sürdüren forum ya da medya kanalı iş akışları dahil Discord thread'lerinde paylaşım yapmayı planlıyorsanız **Send Messages in Threads** öğesini de etkinleştirin.
    Altta oluşturulan URL'yi kopyalayın, tarayıcınıza yapıştırın, sunucunuzu seçin ve bağlanmak için **Continue** öğesine tıklayın. Artık botunuzu Discord sunucusunda görmelisiniz.

  </Step>

  <Step title="Developer Mode'u etkinleştirin ve kimliklerinizi toplayın">
    Discord uygulamasına dönün; dahili kimlikleri kopyalayabilmek için Developer Mode'u etkinleştirmeniz gerekir.

    1. **User Settings** öğesine tıklayın (avatarınızın yanındaki dişli simgesi) → **Advanced** → **Developer Mode** anahtarını açın
    2. Kenar çubuğundaki **sunucu simgenize** sağ tıklayın → **Copy Server ID**
    3. **Kendi avatarınıza** sağ tıklayın → **Copy User ID**

    **Server ID** ve **User ID** değerlerinizi Bot Token ile birlikte kaydedin; sonraki adımda üçünü de OpenClaw'a göndereceksiniz.

  </Step>

  <Step title="Sunucu üyelerinden DM'lere izin verin">
    Eşleştirmenin çalışması için Discord'un botunuzun size DM göndermesine izin vermesi gerekir. **Sunucu simgenize** sağ tıklayın → **Privacy Settings** → **Direct Messages** anahtarını açın.

    Bu, sunucu üyelerinin (botlar dahil) size DM göndermesine izin verir. OpenClaw ile Discord DM'lerini kullanmak istiyorsanız bunu etkin tutun. Yalnızca guild kanallarını kullanmayı planlıyorsanız eşleştirmeden sonra DM'leri devre dışı bırakabilirsiniz.

  </Step>

  <Step title="Bot token'ınızı güvenli şekilde ayarlayın (sohbette göndermeyin)">
    Discord bot token'ınız bir sırdır (parola gibi). Aracınıza mesaj göndermeden önce bunu OpenClaw çalıştıran makinede ayarlayın.

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

    OpenClaw zaten arka plan hizmeti olarak çalışıyorsa OpenClaw Mac uygulaması üzerinden veya `openclaw gateway run` sürecini durdurup yeniden başlatarak yeniden başlatın.
    Yönetilen hizmet kurulumlarında, `DISCORD_BOT_TOKEN` mevcut olan bir kabuktan `openclaw gateway install` komutunu çalıştırın veya değişkeni `~/.openclaw/.env` içinde saklayın; böylece hizmet yeniden başlatmadan sonra env SecretRef değerini çözebilir.
    Ana makineniz Discord'un başlangıç uygulaması araması tarafından engellenirse veya hız sınırına takılırsa, başlangıcın bu REST çağrısını atlayabilmesi için Discord uygulama/istemci kimliğini Developer Portal'dan ayarlayın. Varsayılan hesap için `channels.discord.applicationId` kullanın veya birden fazla Discord botu çalıştırdığınızda `channels.discord.accounts.<accountId>.applicationId` kullanın.

  </Step>

  <Step title="OpenClaw'ı yapılandırın ve eşleştirin">

    <Tabs>
      <Tab title="Aracınıza sorun">
        Herhangi bir mevcut kanalda (ör. Telegram) OpenClaw aracınızla sohbet edin ve ona söyleyin. Discord ilk kanalınızsa bunun yerine CLI / config sekmesini kullanın.

        > "Discord bot token'ımı yapılandırmada zaten ayarladım. Lütfen Discord kurulumunu User ID `<user_id>` ve Server ID `<server_id>` ile tamamla."
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

        Betikli veya uzaktan kurulum için aynı JSON5 bloğunu `openclaw config patch --file ./discord.patch.json5 --dry-run` ile yazın ve ardından `--dry-run` olmadan yeniden çalıştırın. Düz metin `token` değerleri desteklenir. SecretRef değerleri de env/file/exec sağlayıcıları genelinde `channels.discord.token` için desteklenir. Bkz. [Gizli Bilgi Yönetimi](/tr/gateway/secrets).

        Birden fazla Discord botu için her bot token'ını ve uygulama kimliğini kendi hesabının altında tutun. Üst düzey `channels.discord.applicationId` hesaplar tarafından devralınır; bu nedenle bunu yalnızca her hesabın aynı uygulama kimliğini kullanması gerektiğinde orada ayarlayın.

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
    Gateway çalışana kadar bekleyin, ardından Discord'da botunuza DM gönderin. Bir eşleştirme koduyla yanıt verecektir.

    <Tabs>
      <Tab title="Aracınıza sorun">
        Eşleştirme kodunu mevcut kanalınızda aracınıza gönderin:

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

    Artık Discord'da DM üzerinden aracınızla sohbet edebilmelisiniz.

  </Step>
</Steps>

<Note>
Token çözümleme hesap farkındadır. Yapılandırma token değerleri env yedeğine göre önceliklidir. `DISCORD_BOT_TOKEN` yalnızca varsayılan hesap için kullanılır.
Etkin iki Discord hesabı aynı bot token'ına çözülürse OpenClaw bu token için yalnızca bir Gateway izleyicisi başlatır. Yapılandırma kaynaklı token, varsayılan env yedeğine göre önceliklidir; aksi takdirde ilk etkin hesap kazanır ve yinelenen hesap devre dışı olarak bildirilir.
Gelişmiş giden çağrılar (mesaj aracı/kanal eylemleri) için açık bir çağrı başına `token` o çağrıda kullanılır. Bu, gönderme ve okuma/yoklama tarzı eylemler için geçerlidir (örneğin read/search/fetch/thread/pins/permissions). Hesap ilkesi/yeniden deneme ayarları yine etkin çalışma zamanı anlık görüntüsünde seçilen hesaptan gelir.
</Note>

## Önerilen: Bir guild çalışma alanı kurun

DM'ler çalıştıktan sonra Discord sunucunuzu, her kanalın kendi bağlamına sahip kendi aracı oturumunu aldığı tam bir çalışma alanı olarak kurabilirsiniz. Bu, yalnızca siz ve botunuzun bulunduğu özel sunucular için önerilir.

<Steps>
  <Step title="Sunucunuzu guild izin listesine ekleyin">
    Bu, aracınızın yalnızca DM'lerde değil, sunucunuzdaki herhangi bir kanalda yanıt vermesini sağlar.

    <Tabs>
      <Tab title="Aracınıza sorun">
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
    Varsayılan olarak aracınız guild kanallarında yalnızca @mention edildiğinde yanıt verir. Özel bir sunucu için muhtemelen her mesaja yanıt vermesini istersiniz.

    Guild kanallarında normal asistan son yanıtları varsayılan olarak gizli kalır. Görünür Discord çıktısı `message` aracıyla açıkça gönderilmelidir; böylece aracı varsayılan olarak sessizce izleyebilir ve yalnızca bir kanal yanıtının yararlı olduğuna karar verdiğinde paylaşım yapabilir.

    <Tabs>
      <Tab title="Aracınıza sorun">
        > "Aracımın bu sunucuda @mention edilmek zorunda kalmadan yanıt vermesine izin ver"
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

        Grup/kanal odaları için eski otomatik son yanıtları geri yüklemek üzere `messages.groupChat.visibleReplies: "automatic"` ayarlayın.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Guild kanallarında bellek için plan yapın">
    Varsayılan olarak uzun süreli bellek (MEMORY.md) yalnızca DM oturumlarında yüklenir. Guild kanalları MEMORY.md dosyasını otomatik olarak yüklemez.

    <Tabs>
      <Tab title="Aracınıza sorun">
        > "Discord kanallarında soru sorduğumda MEMORY.md dosyasından uzun süreli bağlama ihtiyacın varsa memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Manuel">
        Her kanalda paylaşılan bağlama ihtiyacınız varsa kararlı talimatları `AGENTS.md` veya `USER.md` içine koyun (bunlar her oturum için enjekte edilir). Uzun süreli notları `MEMORY.md` içinde tutun ve gerektiğinde bellek araçlarıyla bunlara erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Şimdi Discord sunucunuzda birkaç kanal oluşturun ve sohbet etmeye başlayın. Aracınız kanal adını görebilir ve her kanal kendi yalıtılmış oturumunu alır; böylece iş akışınıza uygun şekilde `#coding`, `#home`, `#research` veya istediğiniz başka bir kanal kurabilirsiniz.

## Çalışma zamanı modeli

- Gateway, Discord bağlantısının sahibidir.
- Yanıt yönlendirme deterministiktir: Discord'dan gelen yanıtlar Discord'a geri döner.
- Discord sunucu/kanal metadatası, kullanıcıya görünen yanıt öneki olarak değil, güvenilmeyen
  bağlam olarak model istemine eklenir. Bir model bu zarfı
  geri kopyalarsa, OpenClaw kopyalanan metadatayı giden yanıtlardan ve
  gelecekteki yeniden oynatma bağlamından çıkarır.
- Varsayılan olarak (`session.dmScope=main`), doğrudan sohbetler ajanın ana oturumunu paylaşır (`agent:main:main`).
- Sunucu kanalları yalıtılmış oturum anahtarlarıdır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM'leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel eğik çizgi komutları yalıtılmış komut oturumlarında çalışır (`agent:<agentId>:discord:slash:<userId>`), ancak yönlendirilen konuşma oturumuna `CommandTargetSessionKey` taşımaya devam eder.
- Discord'a metin tabanlı cron/heartbeat duyuru teslimi, son
  asistan tarafından görülebilen yanıtı bir kez kullanır. Medya ve yapılandırılmış bileşen yükleri,
  ajan birden fazla teslim edilebilir yük yaydığında çok mesajlı kalır.

## Forum kanalları

Discord forum ve medya kanalları yalnızca başlık gönderilerini kabul eder. OpenClaw bunları oluşturmak için iki yol destekler:

- Otomatik olarak bir başlık oluşturmak için forum üst öğesine (`channel:<forumId>`) mesaj gönderin. Başlık adı mesajınızın boş olmayan ilk satırını kullanır.
- Doğrudan bir başlık oluşturmak için `openclaw message thread create` kullanın. Forum kanalları için `--message-id` geçmeyin.

Örnek: başlık oluşturmak için forum üst öğesine gönderin

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Örnek: açıkça bir forum başlığı oluşturun

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum üst öğeleri Discord bileşenlerini kabul etmez. Bileşenlere ihtiyacınız varsa, başlığın kendisine gönderin (`channel:<threadId>`).

## Etkileşimli bileşenler

OpenClaw, ajan mesajları için Discord bileşenleri v2 kapsayıcılarını destekler. Mesaj aracını bir `components` yüküyle kullanın. Etkileşim sonuçları normal gelen mesajlar olarak ajana geri yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Eylem satırları en fazla 5 düğmeye veya tek bir seçim menüsüne izin verir
- Seçim türleri: `string`, `user`, `role`, `mentionable`, `channel`

Varsayılan olarak bileşenler tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süreleri dolana kadar birden çok kez kullanılmasına izin vermek için `components.reusable=true` ayarlayın.

Bir düğmeye kimin tıklayabileceğini sınırlamak için o düğmede `allowedUsers` ayarlayın (Discord kullanıcı kimlikleri, etiketleri veya `*`). Yapılandırıldığında, eşleşmeyen kullanıcılar geçici bir ret alır.

`/model` ve `/models` eğik çizgi komutları, sağlayıcı, model ve uyumlu çalışma zamanı açılır menüleri ile bir Gönder adımı içeren etkileşimli bir model seçici açar. `/models add` kullanımdan kaldırılmıştır ve artık modelleri sohbetten kaydetmek yerine bir kullanımdan kaldırma mesajı döndürür. Seçici yanıtı geçicidir ve yalnızca komutu çağıran kullanıcı bunu kullanabilir.

Dosya ekleri:

- `file` blokları bir ek referansına işaret etmelidir (`attachment://<filename>`)
- Eki `media`/`path`/`filePath` üzerinden sağlayın (tek dosya); birden çok dosya için `media-gallery` kullanın
- Yükleme adının ek referansıyla eşleşmesi gerektiğinde onu geçersiz kılmak için `filename` kullanın

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
  <Tab title="DM politikası">
    `channels.discord.dmPolicy`, DM erişimini denetler. `channels.discord.allowFrom`, kanonik DM izin listesidir.

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` öğesinin `"*"` içermesini gerektirir)
    - `disabled`

    DM politikası açık değilse, bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme istenir).

    Çoklu hesap önceliği:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesabına uygulanır.
    - Tek hesap için `allowFrom`, eski `dm.allowFrom` üzerinde önceliklidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` ve eski `dm.allowFrom` ayarlanmamışsa `channels.discord.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.discord.accounts.default.allowFrom` değerini devralmaz.

    Eski `channels.discord.dm.policy` ve `channels.discord.dm.allowFrom` uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` öğelerine taşır.

    Teslim için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` bahsi

    Çıplak sayısal kimlikler normalde bir kanal varsayılanı etkin olduğunda kanal kimlikleri olarak çözülür, ancak hesabın etkin DM `allowFrom` listesinde yer alan kimlikler uyumluluk için kullanıcı DM hedefleri olarak değerlendirilir.

  </Tab>

  <Tab title="DM erişim grupları">
    Discord DM'leri, `channels.discord.allowFrom` içinde dinamik `accessGroup:<name>` girdileri kullanabilir.

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

    Bir Discord metin kanalının ayrı bir üye listesi yoktur. `type: "discord.channelAudience"` üyeliği şöyle modeller: DM gönderen, yapılandırılmış sunucunun bir üyesidir ve rol ve kanal üzerine yazmaları uygulandıktan sonra yapılandırılmış kanalda şu anda etkin `ViewChannel` iznine sahiptir.

    Örnek: `#maintainers` kanalını görebilen herkesin bota DM göndermesine izin verin, diğer herkese DM'leri kapalı tutun.

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

    Aramalar kapalı şekilde başarısız olur. Discord `Missing Access` döndürürse, üye araması başarısız olursa veya kanal farklı bir sunucuya aitse, DM gönderen yetkisiz olarak değerlendirilir.

    Kanal kitlesi erişim grupları kullanırken bot için Discord Developer Portal **Server Members Intent** özelliğini etkinleştirin. DM'ler sunucu üyesi durumunu içermez, bu yüzden OpenClaw üyeyi yetkilendirme sırasında Discord REST üzerinden çözer.

  </Tab>

  <Tab title="Sunucu politikası">
    Sunucu işleme `channels.discord.groupPolicy` tarafından denetlenir:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` mevcut olduğunda güvenli temel değer `allowlist` olur.

    `allowlist` davranışı:

    - sunucu `channels.discord.guilds` ile eşleşmelidir (`id` tercih edilir, slug kabul edilir)
    - isteğe bağlı gönderen izin listeleri: `users` (kararlı kimlikler önerilir) ve `roles` (yalnızca rol kimlikleri); herhangi biri yapılandırılmışsa, gönderenler `users` VEYA `roles` ile eşleştiklerinde izinli olur
    - doğrudan ad/etiket eşleştirme varsayılan olarak devre dışıdır; `channels.discord.dangerouslyAllowNameMatching: true` ayarını yalnızca acil uyumluluk modu olarak etkinleştirin
    - `users` için adlar/etiketler desteklenir, ancak kimlikler daha güvenlidir; ad/etiket girdileri kullanıldığında `openclaw security audit` uyarır
    - bir sunucuda `channels` yapılandırılmışsa, listelenmeyen kanallar reddedilir
    - bir sunucuda `channels` bloğu yoksa, izin listesindeki o sunucunun tüm kanallarına izin verilir

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

  <Tab title="Bahisler ve grup DM'leri">
    Sunucu mesajları varsayılan olarak bahse bağlıdır.

    Bahis algılama şunları içerir:

    - açık bot bahsi
    - yapılandırılmış bahis desenleri (`agents.list[].groupChat.mentionPatterns`, geri dönüş `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda örtük bota yanıt verme davranışı

    Giden Discord mesajları yazarken kanonik bahis söz dizimini kullanın: kullanıcılar için `<@USER_ID>`, kanallar için `<#CHANNEL_ID>` ve roller için `<@&ROLE_ID>`. Eski `<@!USER_ID>` takma ad bahis biçimini kullanmayın.

    `requireMention` sunucu/kanal başına yapılandırılır (`channels.discord.guilds...`).
    `ignoreOtherMentions`, isteğe bağlı olarak botu değil başka bir kullanıcıyı/rolü bahseden mesajları düşürür (@everyone/@here hariç).

    Grup DM'leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - `dm.groupChannels` üzerinden isteğe bağlı izin listesi (kanal kimlikleri veya slug'lar)

  </Tab>
</Tabs>

### Rol tabanlı ajan yönlendirme

Discord sunucu üyelerini rol kimliğine göre farklı ajanlara yönlendirmek için `bindings[].match.roles` kullanın. Rol tabanlı bağlamalar yalnızca rol kimliklerini kabul eder ve eş ya da üst-eş bağlamalarından sonra, yalnızca sunucu bağlamalarından önce değerlendirilir. Bir bağlama başka eşleşme alanları da ayarlarsa (örneğin `peer` + `guildId` + `roles`), yapılandırılmış tüm alanlar eşleşmelidir.

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

- `commands.native` varsayılan olarak `"auto"` değerine sahiptir ve Discord için etkindir.
- Kanal bazında geçersiz kılma: `channels.discord.commands.native`.
- `commands.native=false`, başlangıç sırasında Discord slash komutu kaydını ve temizliğini atlar. Önceden kaydedilmiş komutlar, onları Discord uygulamasından kaldırana kadar Discord içinde görünür kalabilir.
- Yerel komut kimlik doğrulaması, normal mesaj işleme ile aynı Discord izin listelerini/ilkelerini kullanır.
- Komutlar, yetkili olmayan kullanıcılar için Discord arayüzünde hâlâ görünür olabilir; yürütme yine de OpenClaw kimlik doğrulamasını uygular ve "yetkili değil" döndürür.

Komut kataloğu ve davranışı için [Slash komutları](/tr/tools/slash-commands) bölümüne bakın.

Varsayılan slash komutu ayarları:

- `ephemeral: true`

## Özellik ayrıntıları

<AccordionGroup>
  <Accordion title="Yanıt etiketleri ve yerel yanıtlar">
    Discord, aracı çıktısında yanıt etiketlerini destekler:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` ile denetlenir:

    - `off` (varsayılan)
    - `first`
    - `all`
    - `batched`

    Not: `off`, örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.
    `first`, dönüş için ilk giden Discord mesajına örtük yerel yanıt başvurusunu her zaman ekler.
    `batched`, Discord'un örtük yerel yanıt başvurusunu yalnızca gelen dönüş,
    birden çok mesajdan oluşan debounce uygulanmış bir toplu işlem olduğunda ekler. Bu,
    yerel yanıtları her tek mesajlı dönüş için değil, özellikle belirsiz ve yoğun sohbetler için
    istediğinizde kullanışlıdır.

    Mesaj kimlikleri bağlamda/geçmişte sunulur, böylece aracılar belirli mesajları hedefleyebilir.

  </Accordion>

  <Accordion title="Canlı akış önizlemesi">
    OpenClaw, geçici bir mesaj gönderip metin geldikçe onu düzenleyerek taslak yanıtları akışa alabilir. `channels.discord.streaming`, `off` (varsayılan) | `partial` | `block` | `progress` değerlerini alır. `progress`, düzenlenebilir tek bir durum taslağını tutar ve son teslimata kadar araç ilerlemesiyle günceller; `streamMode` eski bir takma addır ve otomatik olarak geçirilir.

    Discord önizleme düzenlemeleri, birden çok bot veya Gateway aynı hesabı paylaştığında hız sınırlarına hızla takıldığı için varsayılan değer `off` olarak kalır.

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

    - `partial`, token'lar geldikçe tek bir önizleme mesajını düzenler.
    - `block`, taslak boyutunda parçalar yayar (boyutu ve kesme noktalarını ayarlamak için `draftChunk` kullanın; `textChunkLimit` ile sınırlandırılır).
    - Medya, hata ve açık yanıt sonları bekleyen önizleme düzenlemelerini iptal eder.
    - `streaming.preview.toolProgress` (varsayılan `true`), araç/ilerleme güncellemelerinin önizleme mesajını yeniden kullanıp kullanmayacağını denetler.

    Önizleme akışı yalnızca metin içindir; medya yanıtları normal teslimata geri döner. `block` akışı açıkça etkinleştirildiğinde OpenClaw, çift akışı önlemek için önizleme akışını atlar.

  </Accordion>

  <Accordion title="Geçmiş, bağlam ve iş parçacığı davranışı">
    Sunucu geçmişi bağlamı:

    - `channels.discord.historyLimit` varsayılan `20`
    - geri dönüş: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    DM geçmişi denetimleri:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    İş parçacığı davranışı:

    - Discord iş parçacıkları kanal oturumları olarak yönlendirilir ve geçersiz kılınmadıkça üst kanal yapılandırmasını devralır.
    - İş parçacığı oturumları, üst kanalın oturum düzeyi `/model` seçimini yalnızca model için geri dönüş olarak devralır; iş parçacığına yerel `/model` seçimleri yine de önceliklidir ve transcript devralma etkinleştirilmedikçe üst transcript geçmişi kopyalanmaz.
    - `channels.discord.thread.inheritParent` (varsayılan `false`), yeni otomatik iş parçacıklarının üst transcript'ten tohumlanmasını sağlar. Hesap bazında geçersiz kılmalar `channels.discord.accounts.<id>.thread.inheritParent` altında bulunur.
    - Mesaj aracı tepkileri `user:<id>` DM hedeflerini çözebilir.
    - `guilds.<guild>.channels.<channel>.requireMention: false`, yanıt aşaması etkinleştirme geri dönüşü sırasında korunur.

    Kanal konuları **güvenilmeyen** bağlam olarak enjekte edilir. İzin listeleri, aracıyı kimin tetikleyebileceğini sınırlar; tam bir ek bağlam redaksiyon sınırı değildir.

  </Accordion>

  <Accordion title="Alt aracılar için iş parçacığına bağlı oturumlar">
    Discord, bir iş parçacığını bir oturum hedefine bağlayabilir; böylece o iş parçacığındaki takip mesajları aynı oturuma yönlendirilmeye devam eder (alt aracı oturumları dahil).

    Komutlar:

    - `/focus <target>` mevcut/yeni iş parçacığını bir alt aracı/oturum hedefine bağla
    - `/unfocus` mevcut iş parçacığı bağlamasını kaldır
    - `/agents` etkin çalışmaları ve bağlama durumunu göster
    - `/session idle <duration|off>` odaklanmış bağlamalar için hareketsizlik otomatik odak kaldırmayı incele/güncelle
    - `/session max-age <duration|off>` odaklanmış bağlamalar için zorunlu en yüksek yaşı incele/güncelle

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
    - `spawnSessions`, `sessions_spawn({ thread: true })` ve ACP iş parçacığı oluşturma işlemleri için iş parçacıklarını otomatik oluşturmayı/bağlamayı denetler. Varsayılan: `true`.
    - `defaultSpawnContext`, iş parçacığına bağlı oluşturmalar için yerel alt aracı bağlamını denetler. Varsayılan: `"fork"`.
    - Kullanımdan kaldırılmış `spawnSubagentSessions`/`spawnAcpSessions` anahtarları `openclaw doctor --fix` tarafından geçirilir.
    - Bir hesap için iş parçacığı bağlamaları devre dışı bırakılmışsa `/focus` ve ilgili iş parçacığı bağlama işlemleri kullanılamaz.

    [Alt aracılar](/tr/tools/subagents), [ACP Aracıları](/tr/tools/acp-agents) ve [Yapılandırma Referansı](/tr/gateway/configuration-reference) bölümlerine bakın.

  </Accordion>

  <Accordion title="Kalıcı ACP kanal bağlamaları">
    Kararlı "her zaman açık" ACP çalışma alanları için Discord konuşmalarını hedefleyen üst düzey tipli ACP bağlamaları yapılandırın.

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

    - `/acp spawn codex --bind here`, mevcut kanalı veya iş parçacığını yerinde bağlar ve gelecekteki mesajları aynı ACP oturumunda tutar. İş parçacığı mesajları üst kanal bağlamasını devralır.
    - Bağlı bir kanalda veya iş parçacığında `/new` ve `/reset`, aynı ACP oturumunu yerinde sıfırlar. Geçici iş parçacığı bağlamaları etkin olduğu sürece hedef çözümlemesini geçersiz kılabilir.
    - `spawnSessions`, `--thread auto|here` üzerinden alt iş parçacığı oluşturmayı/bağlamayı sınırlar.

    Bağlama davranışı ayrıntıları için [ACP Aracıları](/tr/tools/acp-agents) bölümüne bakın.

  </Accordion>

  <Accordion title="Tepki bildirimleri">
    Sunucu bazında tepki bildirimi modu:

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
    - aracı kimliği emoji geri dönüşü (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Discord unicode emoji veya özel emoji adlarını kabul eder.
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Yapılandırma yazmaları">
    Kanal tarafından başlatılan yapılandırma yazmaları varsayılan olarak etkindir.

    Bu, `/config set|unset` akışlarını etkiler (komut özellikleri etkin olduğunda).

    Devre dışı bırak:

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
    Proxy'lenmiş mesajları sistem üyesi kimliğine eşlemek için PluralKit çözümlemesini etkinleştirin:

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
    - arama başarısız olursa proxy'lenmiş mesajlar bot mesajı olarak değerlendirilir ve `allowBots=true` olmadığı sürece bırakılır

  </Accordion>

  <Accordion title="Giden bahsetme takma adları">
    Aracılar bilinen Discord kullanıcıları için deterministik giden bahsetmelere ihtiyaç duyduğunda `mentionAliases` kullanın. Anahtarlar baştaki `@` olmadan kullanıcı adlarıdır; değerler Discord kullanıcı kimlikleridir. Bilinmeyen kullanıcı adları, `@everyone`, `@here` ve Markdown kod span'leri içindeki bahsetmeler değiştirilmeden bırakılır.

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
    Bir durum veya etkinlik alanı ayarladığınızda ya da otomatik presence'ı etkinleştirdiğinizde presence güncellemeleri uygulanır.

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

    Otomatik presence, çalışma zamanı kullanılabilirliğini Discord durumuna eşler: sağlıklı => çevrim içi, düşmüş veya bilinmeyen => boşta, tükenmiş veya kullanılamaz => rahatsız etmeyin. İsteğe bağlı metin geçersiz kılmaları:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` yer tutucusunu destekler)

  </Accordion>

  <Accordion title="Discord içinde onaylar">
    Discord, DM'lerde düğme tabanlı onay işlemeyi destekler ve isteğe bağlı olarak onay istemlerini kaynak kanalda yayımlayabilir.

    Yapılandırma yolu:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord, `enabled` ayarlanmamışsa veya `"auto"` ise ve `execApprovals.approvers` ya da `commands.ownerAllowFrom` üzerinden en az bir onaylayan çözümlenebiliyorsa yerel exec onaylarını otomatik olarak etkinleştirir. Discord, kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan mesaj `defaultTo` değerlerinden exec onaylayıcılarını çıkarmaz. Discord'u yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `/diagnostics` ve `/export-trajectory` gibi hassas, yalnızca sahiplerin kullanabildiği grup komutları için OpenClaw onay istemlerini ve nihai sonuçları özel olarak gönderir. Çağıran sahibin bir Discord sahip rotası varsa önce Discord DM dener; bu yoksa Telegram gibi `commands.ownerAllowFrom` içindeki ilk kullanılabilir sahip rotasına geri döner.

    `target`, `channel` veya `both` olduğunda onay istemi kanalda görünür. Düğmeleri yalnızca çözümlenmiş onaylayanlar kullanabilir; diğer kullanıcılar geçici bir ret alır. Onay istemleri komut metnini içerir, bu yüzden kanal teslimini yalnızca güvenilir kanallarda etkinleştirin. Kanal kimliği oturum anahtarından türetilemiyorsa OpenClaw DM teslimine geri döner.

    Discord, diğer sohbet kanalları tarafından kullanılan paylaşılan onay düğmelerini de işler. Yerel Discord adaptörü esas olarak onaylayan DM yönlendirmesi ve kanal dağıtımı ekler.
    Bu düğmeler mevcut olduğunda birincil onay UX'i bunlardır; OpenClaw
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu söylediğinde manuel bir `/approve` komutu eklemelidir.
    Discord yerel onay çalışma zamanı etkin değilse OpenClaw yerel deterministik
    `/approve <id> <decision>` istemini görünür tutar. Çalışma zamanı etkinse ancak yerel kart hiçbir hedefe teslim edilemiyorsa
    OpenClaw bekleyen onaydan alınan tam `/approve` komutuyla aynı sohbet içinde bir geri dönüş bildirimi gönderir.

    Gateway kimlik doğrulaması ve onay çözümlemesi paylaşılan Gateway istemci sözleşmesini izler (`plugin:` kimlikleri `plugin.approval.resolve` üzerinden, diğer kimlikler `exec.approval.resolve` üzerinden çözümlenir). Onaylar varsayılan olarak 30 dakika sonra sona erer.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Araçlar ve eylem kapıları

Discord mesaj eylemleri mesajlaşma, kanal yönetimi, moderasyon, durum ve metadata eylemlerini içerir.

Çekirdek örnekler:

- mesajlaşma: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- tepkiler: `react`, `reactions`, `emojiList`
- moderasyon: `timeout`, `kick`, `ban`
- durum: `setPresence`

`event-create` eylemi, zamanlanmış etkinlik kapak görselini ayarlamak için isteğe bağlı bir `image` parametresi (URL veya yerel dosya yolu) kabul eder.

Eylem kapıları `channels.discord.actions.*` altında bulunur.

Varsayılan kapı davranışı:

| Eylem grubu                                                                                                                                                              | Varsayılan     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | etkin          |
| roles                                                                                                                                                                    | devre dışı     |
| moderation                                                                                                                                                               | devre dışı     |
| presence                                                                                                                                                                 | devre dışı     |

## Components v2 UI

OpenClaw, exec onayları ve bağlamlar arası işaretçiler için Discord components v2 kullanır. Discord mesaj eylemleri özel UI için `components` da kabul edebilir (gelişmiş; discord aracı üzerinden bir bileşen yükü oluşturmayı gerektirir), eski `embeds` hâlâ kullanılabilir ancak önerilmez.

- `channels.discord.ui.components.accentColor`, Discord bileşen kapsayıcıları tarafından kullanılan vurgu rengini ayarlar (hex).
- Hesap başına `channels.discord.accounts.<id>.ui.components.accentColor` ile ayarlayın.
- Components v2 mevcut olduğunda `embeds` yok sayılır.

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

1. Discord Developer Portal içinde Message Content Intent'i etkinleştirin.
2. Rol/kullanıcı izin listeleri kullanıldığında Server Members Intent'i etkinleştirin.
3. Botu `bot` ve `applications.commands` kapsamlarıyla davet edin.
4. Hedef ses kanalında Connect, Speak, Send Messages ve Read Message History izinlerini verin.
5. Yerel komutları (`commands.native` veya `channels.discord.commands.native`) etkinleştirin.
6. `channels.discord.voice` yapılandırın.

Oturumları kontrol etmek için `/vc join|leave|status` kullanın. Komut, hesap varsayılan aracısını kullanır ve diğer Discord komutlarıyla aynı izin listesi ve grup ilkesi kurallarını izler.

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
- `voice.model`, yalnızca Discord ses kanalı yanıtları için kullanılan LLM'yi geçersiz kılar. Yönlendirilen aracı modelini devralmak için ayarlanmamış bırakın.
- STT, `tools.media.audio` kullanır; `voice.model` transkripsiyonu etkilemez.
- Kanal başına Discord `systemPrompt` geçersiz kılmaları, o ses kanalı için ses transkripti turlarına uygulanır.
- Ses transkripti turları sahip durumunu Discord `allowFrom` (veya `dm.allowFrom`) değerinden türetir; sahip olmayan konuşmacılar yalnızca sahip araçlarına (örneğin `gateway` ve `cron`) erişemez.
- Discord sesi, yalnızca metin yapılandırmaları için isteğe bağlıdır; `/vc` komutlarını, ses çalışma zamanını ve `GuildVoiceStates` gateway intent'ini etkinleştirmek için `channels.discord.voice.enabled=true` ayarlayın (veya mevcut bir `channels.discord.voice` bloğunu koruyun).
- `channels.discord.intents.voiceStates`, ses durumu intent aboneliğini açıkça geçersiz kılabilir. Intent'in etkili ses etkinleştirmesini izlemesi için ayarlanmamış bırakın.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` katılma seçeneklerine geçirilir.
- `@discordjs/voice` varsayılanları, ayarlanmamışsa `daveEncryption=true` ve `decryptionFailureTolerance=24` şeklindedir.
- `voice.connectTimeoutMs`, `/vc join` ve otomatik katılma denemeleri için ilk `@discordjs/voice` Ready beklemesini kontrol eder. Varsayılan: `30000`.
- `voice.reconnectGraceMs`, OpenClaw'un bağlantısı kesilmiş bir ses oturumunu yok etmeden önce yeniden bağlanmaya başlamasını ne kadar bekleyeceğini kontrol eder. Varsayılan: `15000`.
- OpenClaw ayrıca alma şifre çözme hatalarını izler ve kısa bir pencerede tekrarlanan hatalardan sonra ses kanalından ayrılıp yeniden katılarak otomatik olarak toparlanır.
- Güncellemeden sonra alma günlükleri tekrar tekrar `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` gösteriyorsa bir bağımlılık raporu ve günlükleri toplayın. Paketlenen `@discordjs/voice` satırı, discord.js PR #11449'dan gelen ve discord.js issue #11419'u kapatan yukarı akış padding düzeltmesini içerir.

Ses kanalı işlem hattı:

- Discord PCM yakalama bir WAV geçici dosyasına dönüştürülür.
- `tools.media.audio`, STT'yi işler, örneğin `openai/gpt-4o-mini-transcribe`.
- Transkript Discord girişinden ve yönlendirmesinden geçirilir; yanıt LLM'si ise aracı `tts` aracını gizleyen ve döndürülen metin isteyen bir ses çıkışı ilkesiyle çalışır, çünkü Discord sesi nihai TTS oynatmasına sahiptir.
- `voice.model`, ayarlandığında yalnızca bu ses kanalı turu için yanıt LLM'sini geçersiz kılar.
- `voice.tts`, `messages.tts` üzerine birleştirilir; ortaya çıkan ses katılınan kanalda oynatılır.

Kimlik bilgileri bileşen başına çözümlenir: `voice.model` için LLM rota kimlik doğrulaması, `tools.media.audio` için STT kimlik doğrulaması ve `messages.tts`/`voice.tts` için TTS kimlik doğrulaması.

### Sesli mesajlar

Discord sesli mesajları bir dalga biçimi önizlemesi gösterir ve OGG/Opus ses gerektirir. OpenClaw dalga biçimini otomatik olarak oluşturur, ancak inceleme ve dönüştürme için gateway ana makinesinde `ffmpeg` ve `ffprobe` gerekir.

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
    - `channels.discord.guilds` altındaki guild izin listesini doğrulayın
    - guild `channels` haritası varsa yalnızca listelenen kanallara izin verilir
    - `requireMention` davranışını ve mention kalıplarını doğrulayın

    Yararlı kontroller:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false ama yine de engellendi">
    Yaygın nedenler:

    - eşleşen guild/kanal izin listesi olmadan `groupPolicy="allowlist"`
    - `requireMention` yanlış yerde yapılandırılmış (mutlaka `channels.discord.guilds` veya kanal girdisi altında olmalıdır)
    - gönderen, guild/kanal `users` izin listesi tarafından engellenmiş

  </Accordion>

  <Accordion title="Uzun süren Discord turları veya yinelenen yanıtlar">

    Tipik günlükler:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway kuyruğu ayarları:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çoklu hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - bu yalnızca Discord gateway dinleyici işini kontrol eder, aracı turu ömrünü değil

    Discord, kuyruğa alınmış aracı turlarına kanalın sahip olduğu bir zaman aşımı uygulamaz. Mesaj dinleyicileri hemen devreder ve kuyruğa alınmış Discord çalıştırmaları, oturum/araç/çalışma zamanı yaşam döngüsü tamamlanana veya işi durdurana kadar oturum başına sıralamayı korur.

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
    OpenClaw bağlanmadan önce Discord `/gateway/bot` metadata bilgilerini alır. Geçici hatalar Discord'un varsayılan gateway URL'sine geri döner ve günlüklerde hız sınırlamasına tabidir.

    Metadata zaman aşımı ayarları:

    - tek hesap: `channels.discord.gatewayInfoTimeoutMs`
    - çoklu hesap: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - yapılandırma ayarlanmamışsa env geri dönüşü: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - varsayılan: `30000` (30 saniye), maksimum: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw, başlatma sırasında ve çalışma zamanı yeniden bağlantılarından sonra Discord'un Gateway `READY` olayını bekler. Başlatma gecikmeli çok hesaplı kurulumlar, varsayılandan daha uzun bir başlatma READY penceresine ihtiyaç duyabilir.

    READY zaman aşımı ayarları:

    - başlatma tek hesap: `channels.discord.gatewayReadyTimeoutMs`
    - başlatma çok hesap: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa başlatma env yedeği: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - başlatma varsayılanı: `15000` (15 saniye), maksimum: `120000`
    - çalışma zamanı tek hesap: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - çalışma zamanı çok hesap: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa çalışma zamanı env yedeği: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - çalışma zamanı varsayılanı: `30000` (30 saniye), maksimum: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    `channels status --probe` izin kontrolleri yalnızca sayısal kanal kimlikleri için çalışır.

    Slug anahtarları kullanırsanız, çalışma zamanı eşleştirmesi yine de çalışabilir, ancak probe izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM devre dışı: `channels.discord.dm.enabled=false`
    - DM ilkesi devre dışı: `channels.discord.dmPolicy="disabled"` (eski: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Bot to bot loops">
    Varsayılan olarak bot tarafından yazılan mesajlar yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız, döngü davranışını önlemek için katı mention ve allowlist kuralları kullanın.
    Yalnızca bottan bahseden bot mesajlarını kabul etmek için `channels.discord.allowBots="mentions"` tercih edin.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis, diğer botları yalnızca kendisinden bahsettiklerinde dinler.
          allowBots: "mentions",
        },
        molty: {
          // Molty, bot tarafından yazılmış tüm Discord mesajlarını dinler.
          allowBots: true,
          mentionAliases: {
            // Molty'nin "@Mantis" yazıp gerçek bir Discord mention göndermesini sağlar.
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
    - `channels.discord.voice.decryptionFailureTolerance=24` değerinden başlayın (upstream varsayılanı) ve yalnızca gerekiyorsa ayarlayın
    - günlüklerde şunları izleyin:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - otomatik yeniden katılmadan sonra hatalar devam ederse, günlükleri toplayın ve [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) ve [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) içindeki upstream DAVE alma geçmişiyle karşılaştırın

  </Accordion>
</AccordionGroup>

## Yapılandırma referansı

Birincil referans: [Yapılandırma referansı - Discord](/tr/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- başlatma/auth: `enabled`, `token`, `accounts.*`, `allowBots`
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

- Bot tokenlerini gizli bilgi olarak ele alın (denetimli ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- En az ayrıcalıklı Discord izinleri verin.
- Komut dağıtımı/durumu bayatsa, gateway'i yeniden başlatın ve `openclaw channels status --probe` ile yeniden kontrol edin.

## İlgili

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Bir Discord kullanıcısını gateway ile eşleştirin.
  </Card>
  <Card title="Groups" icon="users" href="/tr/channels/groups">
    Grup sohbeti ve allowlist davranışı.
  </Card>
  <Card title="Channel routing" icon="route" href="/tr/channels/channel-routing">
    Gelen mesajları ajanlara yönlendirin.
  </Card>
  <Card title="Security" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sağlamlaştırma.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/tr/concepts/multi-agent">
    Guild'leri ve kanalları ajanlarla eşleyin.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı.
  </Card>
</CardGroup>
