---
read_when:
    - Discord kanal özellikleri üzerinde çalışma
summary: Discord bot desteği durumu, yetenekleri ve yapılandırması
title: Discord
x-i18n:
    generated_at: "2026-05-02T20:41:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 42223982a8bfd288d29a1f402b37141557718a407537011956b878b91b894e62
    source_path: channels/discord.md
    workflow: 16
---

Resmi Discord gateway üzerinden DM'ler ve lonca kanalları için hazır.

<CardGroup cols={3}>
  <Card title="Eşleme" icon="link" href="/tr/channels/pairing">
    Discord DM'leri varsayılan olarak eşleme moduna geçer.
  </Card>
  <Card title="Eğik çizgi komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım akışı.
  </Card>
</CardGroup>

## Hızlı kurulum

Bot içeren yeni bir uygulama oluşturmanız, botu sunucunuza eklemeniz ve OpenClaw ile eşleştirmeniz gerekir. Botunuzu kendi özel sunucunuza eklemenizi öneririz. Henüz bir sunucunuz yoksa [önce bir tane oluşturun](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** seçeneğini seçin).

<Steps>
  <Step title="Discord uygulaması ve botu oluşturun">
    [Discord Developer Portal](https://discord.com/developers/applications) sayfasına gidin ve **New Application** öğesine tıklayın. "OpenClaw" gibi bir ad verin.

    Kenar çubuğunda **Bot** öğesine tıklayın. **Username** değerini OpenClaw aracınıza verdiğiniz ada ayarlayın.

  </Step>

  <Step title="Ayrıcalıklı niyetleri etkinleştirin">
    Hâlâ **Bot** sayfasındayken **Privileged Gateway Intents** bölümüne kadar aşağı kaydırın ve şunları etkinleştirin:

    - **Message Content Intent** (gerekli)
    - **Server Members Intent** (önerilir; rol izin listeleri ve ad-kimlik eşleştirmesi için gereklidir)
    - **Presence Intent** (isteğe bağlı; yalnızca varlık güncellemeleri için gerekir)

  </Step>

  <Step title="Bot token'ınızı kopyalayın">
    **Bot** sayfasında tekrar yukarı kaydırın ve **Reset Token** öğesine tıklayın.

    <Note>
    Adına rağmen bu, ilk token'ınızı oluşturur; hiçbir şey "sıfırlanmıyor."
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

    Bu, normal metin kanalları için temel settir. Forum veya medya kanalı iş akışları dahil, bir iş parçacığı oluşturan ya da sürdüren Discord iş parçacıklarında gönderi paylaşmayı planlıyorsanız **Send Messages in Threads** öğesini de etkinleştirin.
    Alttaki oluşturulan URL'yi kopyalayın, tarayıcınıza yapıştırın, sunucunuzu seçin ve bağlanmak için **Continue** öğesine tıklayın. Artık botunuzu Discord sunucusunda görmelisiniz.

  </Step>

  <Step title="Geliştirici Modu'nu etkinleştirin ve kimliklerinizi toplayın">
    Discord uygulamasına geri dönün; dahili kimlikleri kopyalayabilmek için Geliştirici Modu'nu etkinleştirmeniz gerekir.

    1. **User Settings** öğesine (avatarınızın yanındaki dişli simgesi) tıklayın → **Advanced** → **Developer Mode** anahtarını açın
    2. Kenar çubuğundaki **sunucu simgenize** sağ tıklayın → **Copy Server ID**
    3. **Kendi avatarınıza** sağ tıklayın → **Copy User ID**

    **Server ID** ve **User ID** değerlerinizi Bot Token'ınızla birlikte kaydedin; sonraki adımda üçünü de OpenClaw'a göndereceksiniz.

  </Step>

  <Step title="Sunucu üyelerinden DM'lere izin verin">
    Eşleştirmenin çalışması için Discord'un botunuzun size DM göndermesine izin vermesi gerekir. **Sunucu simgenize** sağ tıklayın → **Privacy Settings** → **Direct Messages** anahtarını açın.

    Bu, sunucu üyelerinin (botlar dahil) size DM göndermesini sağlar. OpenClaw ile Discord DM'lerini kullanmak istiyorsanız bunu etkin bırakın. Yalnızca lonca kanallarını kullanmayı planlıyorsanız eşleştirmeden sonra DM'leri devre dışı bırakabilirsiniz.

  </Step>

  <Step title="Bot token'ınızı güvenli şekilde ayarlayın (sohbette göndermeyin)">
    Discord bot token'ınız gizlidir (parola gibi). Aracınıza mesaj göndermeden önce bunu OpenClaw çalışan makinede ayarlayın.

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
    Yönetilen hizmet kurulumlarında, `DISCORD_BOT_TOKEN` değişkeninin mevcut olduğu bir shell'den `openclaw gateway install` çalıştırın veya değişkeni `~/.openclaw/.env` içine kaydedin; böylece hizmet yeniden başlatmadan sonra env SecretRef değerini çözebilir.
    Ana makineniz Discord'un başlangıç uygulaması araması tarafından engelleniyorsa veya hız sınırına takılıyorsa, başlangıcın bu REST çağrısını atlayabilmesi için Discord uygulama/istemci kimliğini Developer Portal'dan ayarlayın. Varsayılan hesap için `channels.discord.applicationId` kullanın veya birden fazla Discord botu çalıştırdığınızda `channels.discord.accounts.<accountId>.applicationId` kullanın.

  </Step>

  <Step title="OpenClaw'ı yapılandırın ve eşleştirin">

    <Tabs>
      <Tab title="Aracınıza sorun">
        Mevcut herhangi bir kanalda (ör. Telegram) OpenClaw aracınızla sohbet edin ve ona söyleyin. Discord ilk kanalınızsa bunun yerine CLI / yapılandırma sekmesini kullanın.

        > "Discord bot token'ımı yapılandırmada zaten ayarladım. Lütfen User ID `<user_id>` ve Server ID `<server_id>` ile Discord kurulumunu tamamla."
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

        Betikli veya uzak kurulum için aynı JSON5 bloğunu `openclaw config patch --file ./discord.patch.json5 --dry-run` ile yazın ve ardından `--dry-run` olmadan yeniden çalıştırın. Düz metin `token` değerleri desteklenir. Env/file/exec sağlayıcıları genelinde `channels.discord.token` için SecretRef değerleri de desteklenir. Bkz. [Gizli Bilgi Yönetimi](/tr/gateway/secrets).

        Birden fazla Discord botu için her bot token'ını ve uygulama kimliğini kendi hesabı altında tutun. Üst düzey `channels.discord.applicationId` hesaplar tarafından devralınır, bu nedenle bunu yalnızca her hesap aynı uygulama kimliğini kullanmalıysa orada ayarlayın.

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
    gateway çalışana kadar bekleyin, ardından Discord'da botunuza DM gönderin. Bot bir eşleme koduyla yanıt verir.

    <Tabs>
      <Tab title="Aracınıza sorun">
        Eşleme kodunu mevcut kanalınızda aracınıza gönderin:

        > "Bu Discord eşleme kodunu onayla: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Eşleme kodlarının süresi 1 saat sonra dolar.

    Artık Discord'da DM üzerinden aracınızla sohbet edebilmelisiniz.

  </Step>
</Steps>

<Note>
Token çözümleme hesap farkındadır. Yapılandırma token değerleri env yedeğine göre önceliklidir. `DISCORD_BOT_TOKEN` yalnızca varsayılan hesap için kullanılır.
Etkinleştirilmiş iki Discord hesabı aynı bot token'ına çözümlenirse OpenClaw bu token için yalnızca bir gateway izleyicisi başlatır. Yapılandırma kaynaklı token varsayılan env yedeğine göre önceliklidir; aksi durumda ilk etkin hesap kazanır ve yinelenen hesap devre dışı olarak bildirilir.
Gelişmiş giden çağrılar için (mesaj aracı/kanal eylemleri), açık bir çağrı başına `token` o çağrı için kullanılır. Bu, gönderme ve okuma/yoklama tarzı eylemler için geçerlidir (örneğin read/search/fetch/thread/pins/permissions). Hesap ilkesi/yeniden deneme ayarları yine de etkin çalışma zamanı anlık görüntüsünde seçili hesaptan gelir.
</Note>

## Önerilir: Bir lonca çalışma alanı kurun

DM'ler çalıştıktan sonra Discord sunucunuzu, her kanalın kendi bağlamına sahip kendi aracı oturumunu aldığı tam bir çalışma alanı olarak kurabilirsiniz. Bu, yalnızca siz ve botunuzun olduğu özel sunucular için önerilir.

<Steps>
  <Step title="Sunucunuzu lonca izin listesine ekleyin">
    Bu, aracınızın yalnızca DM'lerde değil, sunucunuzdaki herhangi bir kanalda yanıt vermesini sağlar.

    <Tabs>
      <Tab title="Aracınıza sorun">
        > "Discord Server ID `<server_id>` değerimi lonca izin listesine ekle"
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
    Varsayılan olarak aracınız lonca kanallarında yalnızca @mentioned olduğunda yanıt verir. Özel bir sunucu için muhtemelen her mesaja yanıt vermesini istersiniz.

    Lonca kanallarında normal asistan final yanıtları varsayılan olarak özel kalır. Görünür Discord çıktısı açıkça `message` aracıyla gönderilmelidir; böylece aracı varsayılan olarak izleyici kalabilir ve yalnızca kanal yanıtının yararlı olduğuna karar verdiğinde gönderi paylaşır.

    <Tabs>
      <Tab title="Aracınıza sorun">
        > "Aracımın bu sunucuda @mentioned olmasına gerek kalmadan yanıt vermesine izin ver"
      </Tab>
      <Tab title="Yapılandırma">
        Lonca yapılandırmanızda `requireMention: false` ayarlayın:

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

  <Step title="Lonca kanallarında bellek için plan yapın">
    Varsayılan olarak uzun süreli bellek (MEMORY.md) yalnızca DM oturumlarında yüklenir. Lonca kanalları MEMORY.md dosyasını otomatik yüklemez.

    <Tabs>
      <Tab title="Aracınıza sorun">
        > "Discord kanallarında soru sorduğumda, MEMORY.md dosyasından uzun süreli bağlama ihtiyacın olursa memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Manuel">
        Her kanalda paylaşılan bağlama ihtiyacınız varsa kararlı yönergeleri `AGENTS.md` veya `USER.md` içine koyun (her oturum için enjekte edilirler). Uzun süreli notları `MEMORY.md` içinde tutun ve gerektiğinde bellek araçlarıyla erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Şimdi Discord sunucunuzda birkaç kanal oluşturun ve sohbete başlayın. Aracınız kanal adını görebilir ve her kanal kendi yalıtılmış oturumunu alır; böylece iş akışınıza uyan `#coding`, `#home`, `#research` veya başka herhangi bir kanal kurabilirsiniz.

## Çalışma zamanı modeli

- Gateway, Discord bağlantısına sahiptir.
- Yanıt yönlendirme deterministiktir: Discord'dan gelen yanıtlar Discord'a geri döner.
- Discord sunucu/kanal meta verileri, kullanıcıya görünen bir yanıt öneki olarak değil, güvenilmeyen
  bağlam olarak model istemine eklenir. Bir model bu zarfı
  geri kopyalarsa, OpenClaw kopyalanan meta verileri giden yanıtlardan ve
  gelecekteki yeniden oynatma bağlamından çıkarır.
- Varsayılan olarak (`session.dmScope=main`), doğrudan sohbetler aracının ana oturumunu paylaşır (`agent:main:main`).
- Sunucu kanalları yalıtılmış oturum anahtarlarıdır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM'leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel eğik çizgi komutları yalıtılmış komut oturumlarında çalışır (`agent:<agentId>:discord:slash:<userId>`), ancak yönlendirilen konuşma oturumuna `CommandTargetSessionKey` taşımaya devam eder.
- Discord'a metin odaklı cron/heartbeat duyuru teslimi, son
  asistan tarafından görülebilen yanıtı bir kez kullanır. Medya ve yapılandırılmış bileşen yükleri, aracı birden fazla teslim edilebilir yük yaydığında
  çok iletili kalır.

## Forum kanalları

Discord forum ve medya kanalları yalnızca iş parçacığı gönderilerini kabul eder. OpenClaw bunları oluşturmak için iki yolu destekler:

- Otomatik olarak iş parçacığı oluşturmak için forum üst öğesine (`channel:<forumId>`) bir ileti gönderin. İş parçacığı başlığı, iletinizin boş olmayan ilk satırını kullanır.
- Doğrudan bir iş parçacığı oluşturmak için `openclaw message thread create` kullanın. Forum kanalları için `--message-id` geçirmeyin.

Örnek: iş parçacığı oluşturmak için forum üst öğesine gönderme

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Örnek: açıkça forum iş parçacığı oluşturma

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum üst öğeleri Discord bileşenlerini kabul etmez. Bileşenlere ihtiyacınız varsa, iş parçacığının kendisine gönderin (`channel:<threadId>`).

## Etkileşimli bileşenler

OpenClaw, aracı iletileri için Discord components v2 kapsayıcılarını destekler. `components` yüküyle ileti aracını kullanın. Etkileşim sonuçları, normal gelen iletiler olarak aracıya geri yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Eylem satırları en fazla 5 düğmeye veya tek bir seçim menüsüne izin verir
- Seçim türleri: `string`, `user`, `role`, `mentionable`, `channel`

Varsayılan olarak bileşenler tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süreleri dolana kadar birden çok kez kullanılmasına izin vermek için `components.reusable=true` ayarlayın.

Bir düğmeye kimin tıklayabileceğini kısıtlamak için o düğmede `allowedUsers` ayarlayın (Discord kullanıcı kimlikleri, etiketler veya `*`). Yapılandırıldığında, eşleşmeyen kullanıcılar geçici bir ret alır.

`/model` ve `/models` eğik çizgi komutları; sağlayıcı, model ve uyumlu çalışma zamanı açılır menülerinin yanı sıra Gönder adımı içeren etkileşimli bir model seçici açar. `/models add` kullanımdan kaldırılmıştır ve artık sohbetten model kaydetmek yerine kullanımdan kaldırma iletisi döndürür. Seçici yanıtı geçicidir ve yalnızca komutu çağıran kullanıcı kullanabilir.

Dosya ekleri:

- `file` blokları bir ek referansına işaret etmelidir (`attachment://<filename>`)
- Eki `media`/`path`/`filePath` aracılığıyla sağlayın (tek dosya); birden çok dosya için `media-gallery` kullanın
- Yükleme adı ek referansıyla eşleşmesi gerektiğinde geçersiz kılmak için `filename` kullanın

Modal formlar:

- En fazla 5 alanla `components.modal` ekleyin
- Alan türleri: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw otomatik olarak bir tetik düğmesi ekler

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
    `channels.discord.dmPolicy`, DM erişimini denetler. `channels.discord.allowFrom`, kurallı DM izin listesidir.

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    DM ilkesi açık değilse, bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme için yönlendirilir).

    Çok hesaplı öncelik:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesabına uygulanır.
    - Tek bir hesap için `allowFrom`, eski `dm.allowFrom` değerine göre önceliklidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` ve eski `dm.allowFrom` değerleri ayarlanmamışsa `channels.discord.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.discord.accounts.default.allowFrom` değerini devralmaz.

    Eski `channels.discord.dm.policy` ve `channels.discord.dm.allowFrom`, uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` değerlerine taşır.

    Teslimat için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` bahsi

    Çıplak sayısal kimlikler, bir kanal varsayılanı etkinken normalde kanal kimlikleri olarak çözümlenir, ancak hesabın etkin DM `allowFrom` listesindeki kimlikler uyumluluk için kullanıcı DM hedefleri olarak ele alınır.

  </Tab>

  <Tab title="DM access groups">
    Discord DM'leri, `channels.discord.allowFrom` içinde dinamik `accessGroup:<name>` girdilerini kullanabilir.

    Erişim grubu adları ileti kanalları genelinde paylaşılır. Üyeleri her kanalın normal `allowFrom` söz diziminde ifade edilen statik bir grup için `type: "message.senders"` kullanın veya bir Discord kanalının geçerli `ViewChannel` kitlesi üyeliği dinamik olarak tanımlamalıysa `type: "discord.channelAudience"` kullanın. Paylaşılan erişim grubu davranışı burada belgelenmiştir: [Erişim grupları](/tr/channels/access-groups).

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

    Bir Discord metin kanalının ayrı bir üye listesi yoktur. `type: "discord.channelAudience"`, üyeliği şöyle modeller: DM göndereni yapılandırılmış sunucunun bir üyesidir ve rol ile kanal geçersiz kılmaları uygulandıktan sonra yapılandırılmış kanalda şu anda etkin `ViewChannel` iznine sahiptir.

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

    Aramalar kapalı başarısız olur. Discord `Missing Access` döndürürse, üye araması başarısız olursa veya kanal farklı bir sunucuya aitse, DM göndereni yetkisiz kabul edilir.

    Kanal kitlesi erişim grupları kullanırken bot için Discord Developer Portal **Server Members Intent** etkinleştirin. DM'ler sunucu üye durumunu içermez, bu nedenle OpenClaw yetkilendirme sırasında üyeyi Discord REST üzerinden çözümler.

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
    - doğrudan ad/etiket eşleştirme varsayılan olarak devre dışıdır; `channels.discord.dangerouslyAllowNameMatching: true` değerini yalnızca uyumluluk için son çare modu olarak etkinleştirin
    - `users` için adlar/etiketler desteklenir, ancak kimlikler daha güvenlidir; ad/etiket girdileri kullanıldığında `openclaw security audit` uyarır
    - bir sunucuda `channels` yapılandırılmışsa, listelenmeyen kanallar reddedilir
    - bir sunucuda `channels` bloğu yoksa, izin listesindeki o sunucudaki tüm kanallara izin verilir

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

    Yalnızca `DISCORD_BOT_TOKEN` ayarlar ve `channels.discord` bloğu oluşturmazsanız, `channels.defaults.groupPolicy` `open` olsa bile çalışma zamanı yedeği `groupPolicy="allowlist"` olur (günlüklerde bir uyarıyla).

  </Tab>

  <Tab title="Mentions and group DMs">
    Sunucu iletileri varsayılan olarak bahse bağlıdır.

    Bahis algılama şunları içerir:

    - açık bot bahsi
    - yapılandırılmış bahis kalıpları (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda bota örtük yanıt verme davranışı

    Giden Discord iletileri yazarken kurallı bahis söz dizimini kullanın: kullanıcılar için `<@USER_ID>`, kanallar için `<#CHANNEL_ID>` ve roller için `<@&ROLE_ID>`. Eski `<@!USER_ID>` takma ad bahis biçimini kullanmayın.

    `requireMention`, sunucu/kanal başına yapılandırılır (`channels.discord.guilds...`).
    `ignoreOtherMentions`, isteğe bağlı olarak başka bir kullanıcıdan/rolden bahseden ancak bottan bahsetmeyen iletileri bırakır (@everyone/@here hariç).

    Grup DM'leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - `dm.groupChannels` aracılığıyla isteğe bağlı izin listesi (kanal kimlikleri veya slug'lar)

  </Tab>
</Tabs>

### Rol tabanlı aracı yönlendirme

Discord sunucu üyelerini rol kimliğine göre farklı aracılara yönlendirmek için `bindings[].match.roles` kullanın. Rol tabanlı bağlamalar yalnızca rol kimliklerini kabul eder ve eş ya da üst-eş bağlamalardan sonra, yalnızca sunucu bağlamalarından önce değerlendirilir. Bir bağlama başka eşleşme alanları da ayarlıyorsa (örneğin `peer` + `guildId` + `roles`), yapılandırılan tüm alanlar eşleşmelidir.

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
- `commands.native=false`, önceden kaydedilmiş Discord yerel komutlarını açıkça temizler.
- Yerel komut yetkilendirmesi, normal ileti işleme ile aynı Discord izin listelerini/ilkelerini kullanır.
- Komutlar, yetkili olmayan kullanıcılar için Discord kullanıcı arayüzünde hâlâ görünür olabilir; yürütme yine de OpenClaw yetkilendirmesini uygular ve "yetkili değil" döndürür.

Komut kataloğu ve davranışı için [Slash komutları](/tr/tools/slash-commands) bölümüne bakın.

Varsayılan slash komut ayarları:

- `ephemeral: true`

## Özellik ayrıntıları

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord, ajan çıktısında yanıt etiketlerini destekler:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` tarafından denetlenir:

    - `off` (varsayılan)
    - `first`
    - `all`
    - `batched`

    Not: `off`, örtük yanıt iş parçacığı oluşturmayı devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.
    `first`, dönüş için ilk giden Discord iletisine örtük yerel yanıt başvurusunu her zaman ekler.
    `batched`, Discord'un örtük yerel yanıt başvurusunu yalnızca gelen dönüş,
    birden çok iletiden oluşan geciktirilmiş bir toplu iş olduğunda ekler. Bu, yerel yanıtları
    her tek iletili dönüş için değil, ağırlıklı olarak belirsiz ve patlamalı sohbetler için
    istediğinizde yararlıdır.

    İleti kimlikleri bağlam/geçmiş içinde sunulur, böylece ajanlar belirli iletileri hedefleyebilir.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw, geçici bir ileti gönderip metin geldikçe onu düzenleyerek taslak yanıtları akışa alabilir. `channels.discord.streaming`, `off` (varsayılan) | `partial` | `block` | `progress` alır. Discord'da `progress`, `partial` değerine eşlenir; `streamMode` eski bir takma addır ve otomatik olarak taşınır.

    Varsayılan `off` olarak kalır çünkü birden çok bot veya Gateway aynı hesabı paylaştığında Discord önizleme düzenlemeleri hız sınırlarına hızlıca takılır.

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
    - `block`, taslak boyutunda parçalar yayar (boyut ve kesme noktalarını ayarlamak için `draftChunk` kullanın; `textChunkLimit` ile sınırlandırılır).
    - Medya, hata ve açık yanıt finalleri bekleyen önizleme düzenlemelerini iptal eder.
    - `streaming.preview.toolProgress` (varsayılan `true`), araç/ilerleme güncellemelerinin önizleme iletisini yeniden kullanıp kullanmayacağını denetler.

    Önizleme akışı yalnızca metindir; medya yanıtları normal teslimata geri döner. `block` akışı açıkça etkinleştirildiğinde OpenClaw, çift akışı önlemek için önizleme akışını atlar.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Sunucu geçmişi bağlamı:

    - `channels.discord.historyLimit` varsayılan `20`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    DM geçmişi denetimleri:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    İş parçacığı davranışı:

    - Discord iş parçacıkları kanal oturumları olarak yönlendirilir ve geçersiz kılınmadıkça üst kanal yapılandırmasını devralır.
    - İş parçacığı oturumları, modelle sınırlı bir yedek olarak üst kanalın oturum düzeyi `/model` seçimini devralır; iş parçacığına yerel `/model` seçimleri yine önceliklidir ve transkript devralma etkinleştirilmedikçe üst transkript geçmişi kopyalanmaz.
    - `channels.discord.thread.inheritParent` (varsayılan `false`), yeni otomatik iş parçacıklarını üst transkriptten tohumlamaya dahil eder. Hesap başına geçersiz kılmalar `channels.discord.accounts.<id>.thread.inheritParent` altında bulunur.
    - İleti aracı tepkileri `user:<id>` DM hedeflerini çözümleyebilir.
    - `guilds.<guild>.channels.<channel>.requireMention: false`, yanıt aşaması etkinleştirme yedeği sırasında korunur.

    Kanal konuları **güvenilmeyen** bağlam olarak enjekte edilir. İzin listeleri, ajanı kimin tetikleyebileceğini denetler; tam bir ek bağlam redaksiyon sınırı değildir.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord, bir iş parçacığını bir oturum hedefine bağlayabilir; böylece o iş parçacığındaki takip iletileri aynı oturuma yönlendirilmeye devam eder (alt ajan oturumları dahil).

    Komutlar:

    - `/focus <target>` geçerli/yeni iş parçacığını bir alt ajan/oturum hedefine bağla
    - `/unfocus` geçerli iş parçacığı bağını kaldır
    - `/agents` etkin çalıştırmaları ve bağ durumunu göster
    - `/session idle <duration|off>` odaklanmış bağlar için hareketsizlik nedeniyle otomatik odaktan çıkarma ayarını incele/güncelle
    - `/session max-age <duration|off>` odaklanmış bağlar için katı maksimum yaşı incele/güncelle

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
    - `spawnSessions`, `sessions_spawn({ thread: true })` ve ACP iş parçacığı oluşturma işlemleri için iş parçacıklarının otomatik oluşturulmasını/bağlanmasını denetler. Varsayılan: `true`.
    - `defaultSpawnContext`, iş parçacığına bağlı oluşturulan oturumlar için yerel alt ajan bağlamını denetler. Varsayılan: `"fork"`.
    - Kullanımdan kaldırılmış `spawnSubagentSessions`/`spawnAcpSessions` anahtarları `openclaw doctor --fix` tarafından taşınır.
    - Bir hesap için iş parçacığı bağları devre dışıysa `/focus` ve ilgili iş parçacığı bağlama işlemleri kullanılamaz.

    [Alt ajanlar](/tr/tools/subagents), [ACP Ajanları](/tr/tools/acp-agents) ve [Yapılandırma Başvurusu](/tr/gateway/configuration-reference) bölümlerine bakın.

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Kararlı ve "her zaman açık" ACP çalışma alanları için Discord konuşmalarını hedefleyen üst düzey türlendirilmiş ACP bağları yapılandırın.

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
    - Bağlı bir kanalda veya iş parçacığında `/new` ve `/reset`, aynı ACP oturumunu yerinde sıfırlar. Geçici iş parçacığı bağları etkin oldukları sürece hedef çözümlemeyi geçersiz kılabilir.
    - `spawnSessions`, `--thread auto|here` üzerinden alt iş parçacığı oluşturma/bağlama işlemlerini sınırlar.

    Bağlama davranışı ayrıntıları için [ACP Ajanları](/tr/tools/acp-agents) bölümüne bakın.

  </Accordion>

  <Accordion title="Reaction notifications">
    Sunucu başına tepki bildirim modu:

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
    - ajan kimliği emoji yedeği (`agents.list[].identity.emoji`, yoksa "👀")

    Notlar:

    - Discord, Unicode emojileri veya özel emoji adlarını kabul eder.
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Config writes">
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
    Discord Gateway WebSocket trafiğini ve başlangıç REST aramalarını (uygulama kimliği + izin listesi çözümleme) `channels.discord.proxy` ile bir HTTP(S) proxy üzerinden yönlendirin.

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
    Proxy üzerinden gelen iletileri sistem üyesi kimliğine eşlemek için PluralKit çözümlemeyi etkinleştirin:

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
    - üye görünen adları, yalnızca `channels.discord.dangerouslyAllowNameMatching: true` olduğunda ad/slug ile eşleştirilir
    - aramalar özgün ileti kimliğini kullanır ve zaman aralığıyla sınırlıdır
    - arama başarısız olursa proxy üzerinden gelen iletiler bot iletisi olarak değerlendirilir ve `allowBots=true` olmadığı sürece düşürülür

  </Accordion>

  <Accordion title="Outbound mention aliases">
    Ajanlar bilinen Discord kullanıcıları için belirleyici giden bahsetmelere ihtiyaç duyduğunda `mentionAliases` kullanın. Anahtarlar başında `@` olmayan kullanıcı tanıtıcılarıdır; değerler Discord kullanıcı kimlikleridir. Bilinmeyen tanıtıcılar, `@everyone`, `@here` ve Markdown kod satır içi alanlarındaki bahsetmeler değişmeden bırakılır.

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
    Presence güncellemeleri, bir durum veya etkinlik alanı ayarladığınızda ya da otomatik Presence etkinleştirdiğinizde uygulanır.

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
    - 1: Akışta (`activityUrl` gerektirir)
    - 2: Dinliyor
    - 3: İzliyor
    - 4: Özel (etkinlik metnini durum hali olarak kullanır; emoji isteğe bağlıdır)
    - 5: Yarışıyor

    Otomatik Presence örneği (çalışma zamanı sağlık sinyali):

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

    Otomatik Presence, çalışma zamanı kullanılabilirliğini Discord durumuna eşler: sağlıklı => çevrimiçi, bozulmuş veya bilinmiyor => boşta, tükenmiş veya kullanılamıyor => rahatsız etmeyin. İsteğe bağlı metin geçersiz kılmaları:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` yer tutucusunu destekler)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord, DM'lerde düğme tabanlı onay işlemeyi destekler ve isteğe bağlı olarak onay istemlerini kaynak kanalda paylaşabilir.

    Yapılandırma yolu:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord, `enabled` ayarlanmamışsa veya `"auto"` ise ve `execApprovals.approvers` ya da `commands.ownerAllowFrom` üzerinden en az bir onaylayıcı çözümlenebiliyorsa yerel exec onaylarını otomatik olarak etkinleştirir. Discord, kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan ileti `defaultTo` değerlerinden exec onaylayıcıları çıkarmaz. Discord'u yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `/diagnostics` ve `/export-trajectory` gibi hassas, yalnızca sahip komutları için OpenClaw onay istemlerini ve nihai sonuçları özel olarak gönderir. Çağıran sahibin bir Discord sahip rotası varsa önce Discord DM'yi dener; bu yoksa Telegram gibi `commands.ownerAllowFrom` içindeki ilk kullanılabilir sahip rotasına geri döner.

    `target`, `channel` veya `both` olduğunda onay istemi kanalda görünür. Düğmeleri yalnızca çözümlenen onaylayıcılar kullanabilir; diğer kullanıcılar geçici bir ret alır. Onay istemleri komut metnini içerir, bu nedenle kanal teslimini yalnızca güvenilir kanallarda etkinleştirin. Kanal kimliği oturum anahtarından türetilemiyorsa OpenClaw DM teslimine geri döner.

    Discord ayrıca diğer sohbet kanallarının kullandığı paylaşılan onay düğmelerini işler. Yerel Discord adaptörü temel olarak onaylayıcı DM yönlendirmesi ve kanal yayılımı ekler.
    Bu düğmeler mevcut olduğunda birincil onay UX'i bunlardır; OpenClaw
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu söylediğinde manuel bir `/approve` komutu eklemelidir.
    Discord yerel onay çalışma zamanı etkin değilse OpenClaw yerel deterministik
    `/approve <id> <decision>` istemini görünür tutar. Çalışma zamanı etkinse
    ancak yerel bir kart hiçbir hedefe teslim edilemiyorsa OpenClaw, bekleyen onaydaki tam `/approve`
    komutuyla aynı sohbete geri dönüş bildirimi gönderir.

    Gateway kimlik doğrulaması ve onay çözümlemesi paylaşılan Gateway istemci sözleşmesini izler (`plugin:` kimlikleri `plugin.approval.resolve` üzerinden; diğer kimlikler `exec.approval.resolve` üzerinden çözümlenir). Onayların süresi varsayılan olarak 30 dakika sonra dolar.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Araçlar ve eylem kapıları

Discord ileti eylemleri mesajlaşma, kanal yöneticiliği, moderasyon, durum ve meta veri eylemlerini içerir.

Temel örnekler:

- mesajlaşma: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- tepkiler: `react`, `reactions`, `emojiList`
- moderasyon: `timeout`, `kick`, `ban`
- durum: `setPresence`

`event-create` eylemi, zamanlanmış etkinlik kapak görselini ayarlamak için isteğe bağlı bir `image` parametresi (URL veya yerel dosya yolu) kabul eder.

Eylem kapıları `channels.discord.actions.*` altında bulunur.

Varsayılan kapı davranışı:

| Eylem grubu                                                                                                                                                             | Varsayılan  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | etkin  |
| roles                                                                                                                                                                    | devre dışı |
| moderation                                                                                                                                                               | devre dışı |
| presence                                                                                                                                                                 | devre dışı |

## Components v2 kullanıcı arayüzü

OpenClaw, exec onayları ve bağlamlar arası işaretleyiciler için Discord components v2 kullanır. Discord ileti eylemleri özel UI için `components` da kabul edebilir (ileri düzey; discord aracı üzerinden bir bileşen yükü oluşturmayı gerektirir); eski `embeds` hâlâ kullanılabilir ancak önerilmez.

- `channels.discord.ui.components.accentColor`, Discord bileşen kapsayıcılarının kullandığı vurgu rengini ayarlar (hex).
- Her hesap için `channels.discord.accounts.<id>.ui.components.accentColor` ile ayarlayın.
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

Discord'un iki farklı ses yüzeyi vardır: gerçek zamanlı **ses kanalları** (sürekli konuşmalar) ve **sesli mesaj ekleri** (dalga biçimi önizleme biçimi). Gateway ikisini de destekler.

### Ses kanalları

Kurulum kontrol listesi:

1. Discord Developer Portal'da Message Content Intent'i etkinleştirin.
2. Rol/kullanıcı izin listeleri kullanıldığında Server Members Intent'i etkinleştirin.
3. Botu `bot` ve `applications.commands` kapsamlarıyla davet edin.
4. Hedef ses kanalında Connect, Speak, Send Messages ve Read Message History izinlerini verin.
5. Yerel komutları etkinleştirin (`commands.native` veya `channels.discord.commands.native`).
6. `channels.discord.voice` yapılandırın.

Oturumları denetlemek için `/vc join|leave|status` kullanın. Komut, hesabın varsayılan agent'ını kullanır ve diğer Discord komutlarıyla aynı izin listesi ve grup politikası kurallarını izler.

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
- `voice.model`, yalnızca Discord ses kanalı yanıtları için kullanılan LLM'yi geçersiz kılar. Yönlendirilen agent modelini devralmak için ayarlamadan bırakın.
- STT `tools.media.audio` kullanır; `voice.model` transkripsiyonu etkilemez.
- Kanal başına Discord `systemPrompt` geçersiz kılmaları, o ses kanalı için ses transkripti dönüşlerine uygulanır.
- Ses transkripti dönüşleri sahip durumunu Discord `allowFrom` (veya `dm.allowFrom`) üzerinden türetir; sahip olmayan konuşmacılar yalnızca sahip araçlarına erişemez (örneğin `gateway` ve `cron`).
- Discord sesi, yalnızca metin yapılandırmaları için isteğe bağlıdır; `/vc` komutlarını, ses çalışma zamanını ve `GuildVoiceStates` Gateway intent'ini etkinleştirmek için `channels.discord.voice.enabled=true` ayarlayın (veya mevcut bir `channels.discord.voice` bloğunu koruyun).
- `channels.discord.intents.voiceStates`, ses durumu intent aboneliğini açıkça geçersiz kılabilir. Intent'in etkili ses etkinleştirmesini izlemesi için ayarlamadan bırakın.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` katılma seçeneklerine doğrudan aktarılır.
- Ayarlanmadığında `@discordjs/voice` varsayılanları `daveEncryption=true` ve `decryptionFailureTolerance=24` şeklindedir.
- `voice.connectTimeoutMs`, `/vc join` ve otomatik katılma denemeleri için ilk `@discordjs/voice` Ready beklemesini denetler. Varsayılan: `30000`.
- `voice.reconnectGraceMs`, bağlantısı kesilen bir ses oturumunu yok etmeden önce OpenClaw'un yeniden bağlanmaya başlamasını ne kadar bekleyeceğini denetler. Varsayılan: `15000`.
- OpenClaw ayrıca alma şifre çözme hatalarını izler ve kısa bir zaman aralığında tekrarlanan hatalardan sonra ses kanalından ayrılıp yeniden katılarak otomatik kurtarır.
- Güncellemeden sonra alma günlükleri tekrar tekrar `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` gösteriyorsa bir bağımlılık raporu ve günlükleri toplayın. Paketlenen `@discordjs/voice` satırı, discord.js PR #11449'daki yukarı akış dolgu düzeltmesini içerir; bu düzeltme discord.js issue #11419'u kapatmıştır.

Ses kanalı işlem hattı:

- Discord PCM yakalaması geçici bir WAV dosyasına dönüştürülür.
- `tools.media.audio` STT'yi işler, örneğin `openai/gpt-4o-mini-transcribe`.
- Transkript, Discord giriş ve yönlendirmesi üzerinden gönderilir; yanıt LLM'si ise agent `tts` aracını gizleyen ve döndürülen metni isteyen bir ses çıktısı politikasıyla çalışır, çünkü Discord sesi nihai TTS oynatmaya sahiptir.
- `voice.model` ayarlandığında yalnızca bu ses kanalı dönüşü için yanıt LLM'sini geçersiz kılar.
- `voice.tts`, `messages.tts` üzerine birleştirilir; sonuçtaki ses katılınan kanalda oynatılır.

Kimlik bilgileri bileşen başına çözümlenir: `voice.model` için LLM rota kimlik doğrulaması, `tools.media.audio` için STT kimlik doğrulaması ve `messages.tts`/`voice.tts` için TTS kimlik doğrulaması.

### Sesli mesajlar

Discord sesli mesajları bir dalga biçimi önizlemesi gösterir ve OGG/Opus ses gerektirir. OpenClaw dalga biçimini otomatik olarak oluşturur, ancak inceleme ve dönüştürme için Gateway ana makinesinde `ffmpeg` ve `ffprobe` gerekir.

- Bir **yerel dosya yolu** sağlayın (URL'ler reddedilir).
- Metin içeriğini atlayın (Discord aynı yükte metin + sesli mesajı reddeder).
- Herhangi bir ses biçimi kabul edilir; OpenClaw gerektiğinde OGG/Opus'a dönüştürür.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - Message Content Intent'i etkinleştirin
    - kullanıcı/üye çözümlemesine bağlı olduğunuzda Server Members Intent'i etkinleştirin
    - intent'leri değiştirdikten sonra Gateway'i yeniden başlatın

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - `groupPolicy` değerini doğrulayın
    - `channels.discord.guilds` altında guild izin listesini doğrulayın
    - guild `channels` haritası mevcutsa yalnızca listelenen kanallara izin verilir
    - `requireMention` davranışını ve mention kalıplarını doğrulayın

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
    - gönderici guild/kanal `users` izin listesi tarafından engellenmiş

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Tipik günlükler:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway kuyruk ayarları:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çoklu hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - bu yalnızca Discord Gateway dinleyici işini denetler, agent dönüş ömrünü değil

    Discord, kuyruğa alınmış agent dönüşlerine kanalın sahip olduğu bir zaman aşımı uygulamaz. İleti dinleyicileri hemen devreder ve kuyruğa alınmış Discord çalıştırmaları, oturum/araç/çalışma zamanı yaşam döngüsü tamamlanana veya işi iptal edene kadar oturum başına sıralamayı korur.

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
    OpenClaw, bağlanmadan önce Discord `/gateway/bot` meta verilerini alır. Geçici hatalar Discord'un varsayılan Gateway URL'sine geri döner ve günlüklerde hız sınırına tabidir.

    Meta veri zaman aşımı ayarları:

    - tek hesap: `channels.discord.gatewayInfoTimeoutMs`
    - çoklu hesap: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - yapılandırma ayarlanmamışsa env geri dönüşü: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - varsayılan: `30000` (30 saniye), maksimum: `120000`

  </Accordion>

  <Accordion title="Gateway READY zaman aşımı yeniden başlatmaları">
    OpenClaw, başlangıç sırasında ve çalışma zamanı yeniden bağlantılarından sonra Discord'un gateway `READY` olayını bekler. Başlangıç kademelendirmesi kullanan çok hesaplı kurulumlar, varsayılandan daha uzun bir başlangıç READY penceresine ihtiyaç duyabilir.

    READY zaman aşımı ayarları:

    - başlangıç tek hesap: `channels.discord.gatewayReadyTimeoutMs`
    - başlangıç çok hesap: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - yapılandırma ayarlanmamışken başlangıç ortam yedeği: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - başlangıç varsayılanı: `15000` (15 saniye), maks: `120000`
    - çalışma zamanı tek hesap: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - çalışma zamanı çok hesap: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - yapılandırma ayarlanmamışken çalışma zamanı ortam yedeği: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - çalışma zamanı varsayılanı: `30000` (30 saniye), maks: `120000`

  </Accordion>

  <Accordion title="İzin denetimi uyuşmazlıkları">
    `channels status --probe` izin kontrolleri yalnızca sayısal kanal kimlikleri için çalışır.

    Slug anahtarları kullanırsanız çalışma zamanı eşleştirmesi yine çalışabilir, ancak probe izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM ve eşleştirme sorunları">

    - DM devre dışı: `channels.discord.dm.enabled=false`
    - DM ilkesi devre dışı: `channels.discord.dmPolicy="disabled"` (eski: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Bot-bot döngüleri">
    Varsayılan olarak bot tarafından yazılan mesajlar yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız döngü davranışından kaçınmak için sıkı mention ve izin listesi kuralları kullanın.
    Yalnızca bottan bahseden bot mesajlarını kabul etmek için `channels.discord.allowBots="mentions"` seçeneğini tercih edin.

  </Accordion>

  <Accordion title="Ses STT, DecryptionFailed(...) ile düşüyor">

    - Discord ses alma kurtarma mantığının mevcut olması için OpenClaw'ı güncel tutun (`openclaw update`)
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
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- yanıt/geçmiş: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- teslim: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (eski takma ad: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medya/yeniden deneme: `mediaMaxMb` (giden Discord yüklemelerini sınırlar, varsayılan `100MB`), `retry`
- eylemler: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- özellikler: `threadBindings`, üst düzey `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Güvenlik ve operasyonlar

- Bot token'larını gizli bilgiler olarak ele alın (denetimli ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- En az ayrıcalıklı Discord izinleri verin.
- Komut dağıtımı/durumu eskiyse gateway'i yeniden başlatın ve `openclaw channels status --probe` ile yeniden kontrol edin.

## İlgili

<CardGroup cols={2}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bir Discord kullanıcısını gateway ile eşleştirin.
  </Card>
  <Card title="Gruplar" icon="users" href="/tr/channels/groups">
    Grup sohbeti ve izin listesi davranışı.
  </Card>
  <Card title="Kanal yönlendirme" icon="route" href="/tr/channels/channel-routing">
    Gelen mesajları agent'lara yönlendirin.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve güçlendirme.
  </Card>
  <Card title="Çok agent'lı yönlendirme" icon="sitemap" href="/tr/concepts/multi-agent">
    Sunucuları ve kanalları agent'lara eşleyin.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı.
  </Card>
</CardGroup>
