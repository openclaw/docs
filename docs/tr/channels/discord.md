---
read_when:
    - Discord kanal özellikleri üzerinde çalışma
summary: Discord bot desteği durumu, yetenekleri ve yapılandırması
title: Discord
x-i18n:
    generated_at: "2026-05-07T13:13:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805a093452b7af1c844919cdf776d898c6fd39f63f1bf363967dd471842eebd5
    source_path: channels/discord.md
    workflow: 16
---

Discord’un resmi Gateway’i üzerinden DM’ler ve sunucu kanalları için hazır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Discord DM’leri varsayılan olarak eşleştirme moduna geçer.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Kanal sorunlarını giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım akışı.
  </Card>
</CardGroup>

## Hızlı kurulum

Bot içeren yeni bir uygulama oluşturmanız, botu sunucunuza eklemeniz ve OpenClaw ile eşleştirmeniz gerekir. Botunuzu kendi özel sunucunuza eklemenizi öneririz. Henüz yoksa, [önce bir tane oluşturun](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** seçin).

<Steps>
  <Step title="Bir Discord uygulaması ve bot oluşturun">
    [Discord Developer Portal](https://discord.com/developers/applications) sayfasına gidin ve **New Application** seçeneğine tıklayın. "OpenClaw" gibi bir ad verin.

    Kenar çubuğunda **Bot** seçeneğine tıklayın. **Username** alanını OpenClaw ajanınıza verdiğiniz ad olarak ayarlayın.

  </Step>

  <Step title="Ayrıcalıklı amaçları etkinleştirin">
    Hâlâ **Bot** sayfasındayken **Privileged Gateway Intents** bölümüne kadar aşağı kaydırın ve şunları etkinleştirin:

    - **Message Content Intent** (gerekli)
    - **Server Members Intent** (önerilir; rol izin listeleri ve ad-ID eşleştirmesi için gerekli)
    - **Presence Intent** (isteğe bağlı; yalnızca durum güncellemeleri için gerekir)

  </Step>

  <Step title="Bot tokeninizi kopyalayın">
    **Bot** sayfasında tekrar yukarı kaydırın ve **Reset Token** seçeneğine tıklayın.

    <Note>
    Adına rağmen bu işlem ilk tokeninizi oluşturur — hiçbir şey "sıfırlanmıyor."
    </Note>

    Tokeni kopyalayın ve bir yere kaydedin. Bu sizin **Bot Token** değerinizdir ve kısa süre sonra buna ihtiyacınız olacak.

  </Step>

  <Step title="Davet URL’si oluşturun ve botu sunucunuza ekleyin">
    Kenar çubuğunda **OAuth2** seçeneğine tıklayın. Botu sunucunuza eklemek için doğru izinlere sahip bir davet URL’si oluşturacaksınız.

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

    Bu, normal metin kanalları için temel settir. Forum veya medya kanalı iş akışları dahil, Discord ileti dizilerinde paylaşım yapmayı ya da bir ileti dizisi oluşturmayı veya sürdürmeyi planlıyorsanız **Send Messages in Threads** iznini de etkinleştirin.
    Altta oluşturulan URL’yi kopyalayın, tarayıcınıza yapıştırın, sunucunuzu seçin ve bağlamak için **Continue** seçeneğine tıklayın. Artık botunuzu Discord sunucusunda görmelisiniz.

  </Step>

  <Step title="Geliştirici Modu’nu etkinleştirin ve ID’lerinizi alın">
    Discord uygulamasına geri dönün; dahili ID’leri kopyalayabilmek için Geliştirici Modu’nu etkinleştirmeniz gerekir.

    1. **User Settings** seçeneğine tıklayın (avatarınızın yanındaki dişli simgesi) → **Advanced** → **Developer Mode** seçeneğini açın
    2. Kenar çubuğunda **sunucu simgenize** sağ tıklayın → **Copy Server ID**
    3. **Kendi avatarınıza** sağ tıklayın → **Copy User ID**

    **Server ID** ve **User ID** değerlerinizi Bot Tokeninizin yanında kaydedin — bir sonraki adımda üçünü de OpenClaw’a göndereceksiniz.

  </Step>

  <Step title="Sunucu üyelerinden DM’lere izin verin">
    Eşleştirmenin çalışması için Discord’un botunuzun size DM göndermesine izin vermesi gerekir. **Sunucu simgenize** sağ tıklayın → **Privacy Settings** → **Direct Messages** seçeneğini açın.

    Bu, sunucu üyelerinin (botlar dahil) size DM göndermesine izin verir. OpenClaw ile Discord DM’lerini kullanmak istiyorsanız bunu etkin bırakın. Yalnızca sunucu kanallarını kullanmayı planlıyorsanız eşleştirmeden sonra DM’leri devre dışı bırakabilirsiniz.

  </Step>

  <Step title="Bot tokeninizi güvenli şekilde ayarlayın (sohbette göndermeyin)">
    Discord bot tokeniniz bir sırdır (parola gibi). Ajanınıza mesaj göndermeden önce bunu OpenClaw’ın çalıştığı makinede ayarlayın.

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
    Yönetilen hizmet kurulumlarında, `DISCORD_BOT_TOKEN` değişkeninin bulunduğu bir kabuktan `openclaw gateway install` çalıştırın veya değişkeni `~/.openclaw/.env` içinde saklayın; böylece hizmet, yeniden başlatmadan sonra env SecretRef değerini çözebilir.
    Ana makineniz Discord’un başlangıçtaki uygulama araması tarafından engelleniyor veya hız sınırına takılıyorsa, başlangıcın bu REST çağrısını atlayabilmesi için Discord uygulama/istemci ID’sini Developer Portal’dan ayarlayın. Varsayılan hesap için `channels.discord.applicationId` kullanın veya birden fazla Discord botu çalıştırdığınızda `channels.discord.accounts.<accountId>.applicationId` kullanın.

  </Step>

  <Step title="OpenClaw’ı yapılandırın ve eşleştirin">

    <Tabs>
      <Tab title="Ajanınıza sorun">
        OpenClaw ajanınızla mevcut herhangi bir kanalda (ör. Telegram) sohbet edin ve bunu söyleyin. Discord ilk kanalınızsa bunun yerine CLI / yapılandırma sekmesini kullanın.

        > "Discord bot tokenimi yapılandırmada zaten ayarladım. Lütfen User ID `<user_id>` ve Server ID `<server_id>` ile Discord kurulumunu tamamla."
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

        Betikli veya uzak kurulum için aynı JSON5 bloğunu `openclaw config patch --file ./discord.patch.json5 --dry-run` ile yazın ve ardından `--dry-run` olmadan tekrar çalıştırın. Düz metin `token` değerleri desteklenir. SecretRef değerleri de env/file/exec sağlayıcıları genelinde `channels.discord.token` için desteklenir. Bkz. [Sır Yönetimi](/tr/gateway/secrets).

        Birden fazla Discord botu için her bot tokenini ve uygulama ID’sini kendi hesabı altında tutun. Üst düzey `channels.discord.applicationId` hesaplar tarafından devralınır, bu yüzden yalnızca her hesabın aynı uygulama ID’sini kullanması gerekiyorsa orada ayarlayın.

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

    Artık ajanınızla Discord’da DM üzerinden sohbet edebilmelisiniz.

  </Step>
</Steps>

<Note>
Token çözümleme hesap farkındadır. Yapılandırma token değerleri env yedeğine göre önceliklidir. `DISCORD_BOT_TOKEN` yalnızca varsayılan hesap için kullanılır.
Etkinleştirilmiş iki Discord hesabı aynı bot tokenine çözülürse OpenClaw bu token için yalnızca bir Gateway izleyicisi başlatır. Yapılandırma kaynaklı token, varsayılan env yedeğine göre önceliklidir; aksi halde ilk etkin hesap kazanır ve yinelenen hesap devre dışı olarak bildirilir.
Gelişmiş giden çağrılar (mesaj aracı/kanal eylemleri) için açık bir çağrı başına `token` o çağrı için kullanılır. Bu, gönderme ve okuma/yoklama tarzı eylemler için geçerlidir (örneğin oku/ara/getir/ileti dizisi/sabitlenenler/izinler). Hesap politikası/yeniden deneme ayarları yine de etkin çalışma zamanı anlık görüntüsünde seçili hesaptan gelir.
</Note>

## Önerilen: Bir sunucu çalışma alanı kurun

DM’ler çalıştıktan sonra Discord sunucunuzu, her kanalın kendi bağlamıyla kendi ajan oturumunu aldığı tam bir çalışma alanı olarak ayarlayabilirsiniz. Bu, yalnızca siz ve botunuzun bulunduğu özel sunucular için önerilir.

<Steps>
  <Step title="Sunucunuzu sunucu izin listesine ekleyin">
    Bu, ajanınızın yalnızca DM’lerde değil, sunucunuzdaki herhangi bir kanalda yanıt vermesini sağlar.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        > "Discord Server ID `<server_id>` değerimi sunucu izin listesine ekle"
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
    Varsayılan olarak ajanınız sunucu kanallarında yalnızca @mention edildiğinde yanıt verir. Özel bir sunucu için muhtemelen her mesaja yanıt vermesini istersiniz.

    Sunucu kanallarında normal asistan final yanıtları varsayılan olarak özel kalır. Görünür Discord çıktısı `message` aracıyla açıkça gönderilmelidir; böylece ajan varsayılan olarak sessizce izleyebilir ve yalnızca kanal yanıtının yararlı olduğuna karar verdiğinde paylaşım yapar.

    Bu, seçilen modelin araçları güvenilir şekilde çağırması gerektiği anlamına gelir. Discord yazıyor gösteriyor ve günlükler token kullanımını gösteriyor ancak mesaj gönderilmiyorsa, `didSendViaMessagingTool: false` içeren asistan metni için oturum günlüğünü kontrol edin. Bu, modelin `message(action=send)` çağırmak yerine özel bir final yanıtı ürettiği anlamına gelir. Daha güçlü bir araç çağırma modeline geçin veya eski otomatik final yanıtlarını geri yüklemek için aşağıdaki yapılandırmayı kullanın.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        > "Ajanımın bu sunucuda @mention edilmeden yanıt vermesine izin ver"
      </Tab>
      <Tab title="Yapılandırma">
        Sunucu yapılandırmanızda `requireMention: false` ayarlayın:

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

  <Step title="Sunucu kanallarında bellek için plan yapın">
    Varsayılan olarak uzun süreli bellek (MEMORY.md) yalnızca DM oturumlarında yüklenir. Sunucu kanalları MEMORY.md dosyasını otomatik yüklemez.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        > "Discord kanallarında soru sorduğumda, MEMORY.md dosyasından uzun süreli bağlama ihtiyacın olursa memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Manuel">
        Her kanalda paylaşılan bağlama ihtiyacınız varsa kararlı talimatları `AGENTS.md` veya `USER.md` içine koyun (bunlar her oturum için enjekte edilir). Uzun süreli notları `MEMORY.md` içinde tutun ve gerektiğinde bellek araçlarıyla erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Şimdi Discord sunucunuzda birkaç kanal oluşturun ve sohbet etmeye başlayın. Ajanınız kanal adını görebilir ve her kanal kendi yalıtılmış oturumunu alır — böylece `#coding`, `#home`, `#research` veya iş akışınıza uyan başka bir kanal kurabilirsiniz.

## Çalışma zamanı modeli

- Gateway, Discord bağlantısının sahibidir.
- Yanıt yönlendirme deterministiktir: Discord’dan gelen yanıtlar tekrar Discord’a gider.
- Discord sunucu/kanal meta verileri, kullanıcıya görünen yanıt öneki olarak değil, güvenilmeyen
  bağlam olarak model prompt’una eklenir. Bir model bu zarfı
  geri kopyalarsa OpenClaw, kopyalanan meta verileri giden yanıtlardan ve
  gelecekteki yeniden oynatma bağlamından çıkarır.
- Varsayılan olarak (`session.dmScope=main`), doğrudan sohbetler temsilcinin ana oturumunu paylaşır (`agent:main:main`).
- Sunucu kanalları yalıtılmış oturum anahtarlarıdır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM’leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel slash komutları yalıtılmış komut oturumlarında çalışır (`agent:<agentId>:discord:slash:<userId>`), ancak yine de yönlendirilen konuşma oturumuna `CommandTargetSessionKey` taşır.
- Discord’a metin tabanlı cron/heartbeat duyuru teslimi, son
  asistanın görebildiği yanıtı bir kez kullanır. Medya ve yapılandırılmış bileşen yükleri,
  temsilci birden fazla teslim edilebilir yük yaydığında çok iletili kalır.

## Forum kanalları

Discord forum ve medya kanalları yalnızca iş parçacığı gönderilerini kabul eder. OpenClaw bunları oluşturmak için iki yolu destekler:

- Otomatik bir iş parçacığı oluşturmak için forum üst öğesine (`channel:<forumId>`) bir ileti gönderin. İş parçacığı başlığı, iletinizin boş olmayan ilk satırını kullanır.
- Doğrudan bir iş parçacığı oluşturmak için `openclaw message thread create` kullanın. Forum kanalları için `--message-id` geçmeyin.

Örnek: iş parçacığı oluşturmak için forum üst öğesine gönderin

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Örnek: açıkça bir forum iş parçacığı oluşturun

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum üst öğeleri Discord bileşenlerini kabul etmez. Bileşenlere ihtiyacınız varsa, iş parçacığının kendisine gönderin (`channel:<threadId>`).

## Etkileşimli bileşenler

OpenClaw, temsilci iletileri için Discord bileşenleri v2 kapsayıcılarını destekler. `components` yüküyle ileti aracını kullanın. Etkileşim sonuçları normal gelen iletiler olarak temsilciye geri yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Eylem satırları en fazla 5 düğmeye veya tek bir seçim menüsüne izin verir
- Seçim türleri: `string`, `user`, `role`, `mentionable`, `channel`

Varsayılan olarak bileşenler tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süreleri dolana kadar birden fazla kez kullanılmasına izin vermek için `components.reusable=true` ayarlayın.

Bir düğmeye kimin tıklayabileceğini kısıtlamak için o düğmede `allowedUsers` ayarlayın (Discord kullanıcı kimlikleri, etiketler veya `*`). Yapılandırıldığında, eşleşmeyen kullanıcılar geçici bir ret alır.

`/model` ve `/models` slash komutları sağlayıcı, model ve uyumlu çalışma zamanı açılır menüleri ile bir Gönder adımı içeren etkileşimli bir model seçici açar. `/models add` kullanım dışıdır ve artık sohbetten model kaydetmek yerine kullanım dışı olduğunu belirten bir ileti döndürür. Seçici yanıtı geçicidir ve yalnızca çağıran kullanıcı onu kullanabilir.

Dosya ekleri:

- `file` blokları bir ek referansına işaret etmelidir (`attachment://<filename>`)
- Eki `media`/`path`/`filePath` üzerinden sağlayın (tek dosya); birden çok dosya için `media-gallery` kullanın
- Yükleme adı ek referansıyla eşleşmeliyse bunu geçersiz kılmak için `filename` kullanın

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
    `channels.discord.dmPolicy`, DM erişimini denetler. `channels.discord.allowFrom` standart DM izin listesidir.

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    DM ilkesi açık değilse, bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme için yönlendirilir).

    Çoklu hesap önceliği:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesabına uygulanır.
    - Tek bir hesap için `allowFrom`, eski `dm.allowFrom` üzerinde önceliklidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` ve eski `dm.allowFrom` ayarlanmamışsa `channels.discord.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.discord.accounts.default.allowFrom` değerini devralmaz.

    Eski `channels.discord.dm.policy` ve `channels.discord.dm.allowFrom` uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` değerlerine taşır.

    Teslim için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` bahsi

    Çıplak sayısal kimlikler, bir kanal varsayılanı etkin olduğunda normalde kanal kimlikleri olarak çözümlenir; ancak hesabın geçerli DM `allowFrom` listesinde yer alan kimlikler uyumluluk için kullanıcı DM hedefleri olarak değerlendirilir.

  </Tab>

  <Tab title="DM access groups">
    Discord DM’leri, `channels.discord.allowFrom` içinde dinamik `accessGroup:<name>` girdileri kullanabilir.

    Erişim grubu adları ileti kanalları arasında paylaşılır. Üyeleri her kanalın normal `allowFrom` sözdiziminde ifade edilen statik bir grup için `type: "message.senders"` kullanın; bir Discord kanalının mevcut `ViewChannel` kitlesi üyeliği dinamik olarak tanımlamalıysa `type: "discord.channelAudience"` kullanın. Paylaşılan erişim grubu davranışı burada belgelenmiştir: [Erişim grupları](/tr/channels/access-groups).

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

    Bir Discord metin kanalının ayrı bir üye listesi yoktur. `type: "discord.channelAudience"` üyeliği şu şekilde modeller: DM göndereni yapılandırılmış sunucunun üyesidir ve rol ile kanal üzerine yazmaları uygulandıktan sonra yapılandırılmış kanalda şu anda etkin `ViewChannel` iznine sahiptir.

    Örnek: DM’leri diğer herkese kapalı tutarken `#maintainers` kanalını görebilen herkesin bota DM göndermesine izin verin.

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

    Kanal kitlesi erişim gruplarını kullanırken bot için Discord Developer Portal’da **Server Members Intent** özelliğini etkinleştirin. DM’ler sunucu üyesi durumunu içermez, bu nedenle OpenClaw üyeyi yetkilendirme zamanında Discord REST üzerinden çözümler.

  </Tab>

  <Tab title="Guild policy">
    Sunucu işleme `channels.discord.groupPolicy` ile denetlenir:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` mevcut olduğunda güvenli temel değer `allowlist` olur.

    `allowlist` davranışı:

    - sunucu `channels.discord.guilds` ile eşleşmelidir (`id` tercih edilir, slug kabul edilir)
    - isteğe bağlı gönderen izin listeleri: `users` (kararlı kimlikler önerilir) ve `roles` (yalnızca rol kimlikleri); ikisinden biri yapılandırılmışsa gönderenler `users` VEYA `roles` ile eşleştiğinde izin verilir
    - doğrudan ad/etiket eşleştirme varsayılan olarak devre dışıdır; `channels.discord.dangerouslyAllowNameMatching: true` değerini yalnızca acil uyumluluk modu olarak etkinleştirin
    - `users` için adlar/etiketler desteklenir, ancak kimlikler daha güvenlidir; `openclaw security audit`, ad/etiket girdileri kullanıldığında uyarır
    - bir sunucuda `channels` yapılandırılmışsa, listelenmeyen kanallar reddedilir
    - bir sunucuda `channels` bloğu yoksa, izin listesine alınmış o sunucudaki tüm kanallara izin verilir

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
    Sunucu iletileri varsayılan olarak bahse bağlıdır.

    Bahis algılama şunları içerir:

    - açık bot bahsi
    - yapılandırılmış bahis örüntüleri (`agents.list[].groupChat.mentionPatterns`, geri dönüş `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda bota örtük yanıt verme davranışı

    Giden Discord iletileri yazarken standart bahis söz dizimini kullanın: kullanıcılar için `<@USER_ID>`, kanallar için `<#CHANNEL_ID>` ve roller için `<@&ROLE_ID>`. Eski `<@!USER_ID>` takma ad bahis biçimini kullanmayın.

    `requireMention`, sunucu/kanal başına yapılandırılır (`channels.discord.guilds...`).
    `ignoreOtherMentions`, isteğe bağlı olarak başka bir kullanıcıdan/rolden bahseden ancak bottan bahsetmeyen iletileri düşürür (@everyone/@here hariç).

    Grup DM’leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - `dm.groupChannels` üzerinden isteğe bağlı izin listesi (kanal kimlikleri veya slug’lar)

  </Tab>
</Tabs>

### Rol tabanlı temsilci yönlendirme

Discord sunucu üyelerini rol kimliğine göre farklı temsilcilere yönlendirmek için `bindings[].match.roles` kullanın. Rol tabanlı bağlamalar yalnızca rol kimliklerini kabul eder ve eş veya üst eş bağlamalarından sonra, yalnızca sunucu bağlamalarından önce değerlendirilir. Bir bağlama başka eşleşme alanları da ayarlarsa (örneğin `peer` + `guildId` + `roles`), yapılandırılan tüm alanlar eşleşmelidir.

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

- `commands.native` varsayılan olarak `"auto"` olur ve Discord için etkindir.
- Kanal başına geçersiz kılma: `channels.discord.commands.native`.
- `commands.native=false`, başlatma sırasında Discord eğik çizgi komutu kaydını ve temizliğini atlar. Daha önce kaydedilmiş komutlar, siz bunları Discord uygulamasından kaldırana kadar Discord içinde görünür kalabilir.
- Yerel komut kimlik doğrulaması, normal ileti işleme ile aynı Discord izin listelerini/ilkelerini kullanır.
- Komutlar, yetkili olmayan kullanıcılar için Discord arayüzünde hâlâ görünebilir; yürütme yine OpenClaw kimlik doğrulamasını uygular ve "yetkili değil" döndürür.

Komut kataloğu ve davranışı için [Eğik çizgi komutları](/tr/tools/slash-commands) bölümüne bakın.

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

    Not: `off`, örtük yanıt iş parçacığı oluşturmayı devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de uygulanır.
    `first`, dönüş için ilk giden Discord iletisine örtük yerel yanıt başvurusunu her zaman ekler.
    `batched`, Discord'un örtük yerel yanıt başvurusunu yalnızca gelen dönüş birden
    fazla iletiden oluşan debounce uygulanmış bir toplu iletiyse ekler. Bu,
    her tek iletili dönüş için değil, esas olarak belirsiz ve ani yoğun sohbetler
    için yerel yanıtlar istediğinizde kullanışlıdır.

    İleti kimlikleri bağlamda/geçmişte gösterilir, böylece aracılar belirli iletileri hedefleyebilir.

  </Accordion>

  <Accordion title="Canlı akış önizlemesi">
    OpenClaw, geçici bir ileti gönderip metin geldikçe bunu düzenleyerek taslak yanıtları akış halinde verebilir. `channels.discord.streaming`, `off` | `partial` | `block` | `progress` (varsayılan) alır. `progress`, düzenlenebilir tek bir durum taslağı tutar ve son teslimata kadar bunu araç ilerlemesiyle günceller; `streamMode` eski bir çalışma zamanı diğer adıdır. Kalıcı yapılandırmayı kurallı anahtara yeniden yazmak için `openclaw doctor --fix` çalıştırın.

    Discord önizleme düzenlemelerini devre dışı bırakmak için `channels.discord.streaming.mode` değerini `off` olarak ayarlayın. Discord blok akışı açıkça etkinleştirilmişse OpenClaw çift akışı önlemek için önizleme akışını atlar.

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

    - `partial`, tokenlar geldikçe tek bir önizleme iletisini düzenler.
    - `block`, taslak boyutunda parçalar yayar (boyut ve kesme noktalarını ayarlamak için `draftChunk` kullanın, `textChunkLimit` ile sınırlandırılır).
    - Medya, hata ve açık yanıt finalleri bekleyen önizleme düzenlemelerini iptal eder.
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

    Önizleme akışı yalnızca metindir; medya yanıtları normal teslimata geri döner. `block` akışı açıkça etkinleştirildiğinde OpenClaw çift akışı önlemek için önizleme akışını atlar.

  </Accordion>

  <Accordion title="Geçmiş, bağlam ve iş parçacığı davranışı">
    Sunucu geçmişi bağlamı:

    - `channels.discord.historyLimit` varsayılanı `20`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    DM geçmişi denetimleri:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    İş parçacığı davranışı:

    - Discord iş parçacıkları kanal oturumları olarak yönlendirilir ve geçersiz kılınmadığı sürece üst kanal yapılandırmasını devralır.
    - İş parçacığı oturumları, üst kanalın oturum düzeyi `/model` seçimini yalnızca model için bir yedek olarak devralır; iş parçacığına yerel `/model` seçimleri yine önceliklidir ve transkript devralma etkinleştirilmedikçe üst transkript geçmişi kopyalanmaz.
    - `channels.discord.thread.inheritParent` (varsayılan `false`), yeni otomatik iş parçacıklarının üst transkriptten başlatılmasını seçer. Hesap başına geçersiz kılmalar `channels.discord.accounts.<id>.thread.inheritParent` altında yer alır.
    - İleti aracı tepkileri `user:<id>` DM hedeflerini çözümleyebilir.
    - `guilds.<guild>.channels.<channel>.requireMention: false`, yanıt aşaması etkinleştirme yedeği sırasında korunur.

    Kanal konuları **güvenilmeyen** bağlam olarak enjekte edilir. İzin listeleri, aracıyı kimin tetikleyebileceğini sınırlar; tam bir ek bağlam sansürleme sınırı değildir.

  </Accordion>

  <Accordion title="Alt aracılar için iş parçacığına bağlı oturumlar">
    Discord, bir iş parçacığını oturum hedefine bağlayabilir; böylece o iş parçacığındaki takip iletileri aynı oturuma yönlendirilmeye devam eder (alt aracı oturumları dahil).

    Komutlar:

    - `/focus <target>` mevcut/yeni iş parçacığını bir alt aracı/oturum hedefine bağla
    - `/unfocus` mevcut iş parçacığı bağlamasını kaldır
    - `/agents` etkin çalıştırmaları ve bağlama durumunu göster
    - `/session idle <duration|off>` odaklanmış bağlamalar için etkin olmama durumunda otomatik odaktan çıkmayı incele/güncelle
    - `/session max-age <duration|off>` odaklanmış bağlamalar için katı maksimum yaşı incele/güncelle

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
    - `spawnSessions`, `sessions_spawn({ thread: true })` ve ACP iş parçacığı oluşturma işlemleri için iş parçacıklarının otomatik oluşturulmasını/bağlanmasını denetler. Varsayılan: `true`.
    - `defaultSpawnContext`, iş parçacığına bağlı oluşturma işlemleri için yerel alt aracı bağlamını denetler. Varsayılan: `"fork"`.
    - Kullanımdan kaldırılmış `spawnSubagentSessions`/`spawnAcpSessions` anahtarları `openclaw doctor --fix` tarafından taşınır.
    - Bir hesap için iş parçacığı bağlamaları devre dışıysa `/focus` ve ilgili iş parçacığı bağlama işlemleri kullanılamaz.

    [Alt aracılar](/tr/tools/subagents), [ACP Aracıları](/tr/tools/acp-agents) ve [Yapılandırma Başvurusu](/tr/gateway/configuration-reference) bölümlerine bakın.

  </Accordion>

  <Accordion title="Kalıcı ACP kanal bağlamaları">
    Kararlı, "her zaman açık" ACP çalışma alanları için Discord konuşmalarını hedefleyen üst düzey türlendirilmiş ACP bağlamaları yapılandırın.

    Yapılandırma yolu:

    - `bindings[]`, `type: "acp"` ve `match.channel: "discord"` ile

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

    - `/acp spawn codex --bind here`, mevcut kanalı veya iş parçacığını yerinde bağlar ve gelecekteki iletileri aynı ACP oturumunda tutar. İş parçacığı iletileri üst kanal bağlamasını devralır.
    - Bağlı bir kanalda veya iş parçacığında `/new` ve `/reset`, aynı ACP oturumunu yerinde sıfırlar. Geçici iş parçacığı bağlamaları, etkinken hedef çözümlemesini geçersiz kılabilir.
    - `spawnSessions`, `--thread auto|here` aracılığıyla alt iş parçacığı oluşturmayı/bağlamayı sınırlar.

    Bağlama davranışı ayrıntıları için [ACP Aracıları](/tr/tools/acp-agents) bölümüne bakın.

  </Accordion>

  <Accordion title="Tepki bildirimleri">
    Sunucu başına tepki bildirim modu:

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
    - aracı kimliği emoji yedeği (`agents.list[].identity.emoji`, yoksa "👀")

    Notlar:

    - Discord unicode emojiyi veya özel emoji adlarını kabul eder.
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Yapılandırma yazımları">
    Kanal tarafından başlatılan yapılandırma yazımları varsayılan olarak etkindir.

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
    Discord gateway WebSocket trafiğini ve başlatma REST aramalarını (uygulama kimliği + izin listesi çözümlemesi) `channels.discord.proxy` ile bir HTTP(S) proxy üzerinden yönlendirin.

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
    Proxylenen iletileri sistem üyesi kimliğine eşlemek için PluralKit çözümlemesini etkinleştirin:

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
    - aramalar özgün ileti kimliğini kullanır ve zaman penceresiyle sınırlandırılır
    - arama başarısız olursa proxylenen iletiler bot iletisi olarak değerlendirilir ve `allowBots=true` olmadığı sürece bırakılır

  </Accordion>

  <Accordion title="Giden bahsetme diğer adları">
    Aracıların bilinen Discord kullanıcıları için belirleyici giden bahsetmelere ihtiyacı olduğunda `mentionAliases` kullanın. Anahtarlar baştaki `@` olmadan kullanıcı adlarıdır; değerler Discord kullanıcı kimlikleridir. Bilinmeyen kullanıcı adları, `@everyone`, `@here` ve Markdown kod spanleri içindeki bahsetmeler değiştirilmeden bırakılır.

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
    Bir durum veya etkinlik alanı ayarladığınızda ya da otomatik presence etkinleştirdiğinizde presence güncellemeleri uygulanır.

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
    - 4: Özel (etkinlik metnini durum state'i olarak kullanır; emoji isteğe bağlıdır)
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

    Otomatik durum, çalışma zamanı kullanılabilirliğini Discord durumuna eşler: sağlıklı => online, bozulmuş veya bilinmiyor => idle, tükenmiş veya kullanılamıyor => dnd. İsteğe bağlı metin geçersiz kılmaları:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` yer tutucusunu destekler)

  </Accordion>

  <Accordion title="Discord'da onaylar">
    Discord, DM'lerde düğme tabanlı onay işlemeyi destekler ve isteğe bağlı olarak onay istemlerini kaynak kanala gönderebilir.

    Yapılandırma yolu:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord, `enabled` ayarlanmamış veya `"auto"` olduğunda ve `execApprovals.approvers` ya da `commands.ownerAllowFrom` üzerinden en az bir onaylayıcı çözümlenebildiğinde yerel exec onaylarını otomatik olarak etkinleştirir. Discord, exec onaylayıcılarını kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan mesaj `defaultTo` değerlerinden çıkarmaz. Discord'u yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `/diagnostics` ve `/export-trajectory` gibi hassas, yalnızca sahip grup komutları için OpenClaw onay istemlerini ve nihai sonuçları özel olarak gönderir. Çağıran sahibin bir Discord sahip rotası olduğunda önce Discord DM'yi dener; bu yoksa Telegram gibi `commands.ownerAllowFrom` içindeki ilk kullanılabilir sahip rotasına geri döner.

    `target` `channel` veya `both` olduğunda, onay istemi kanalda görünür. Düğmeleri yalnızca çözümlenen onaylayıcılar kullanabilir; diğer kullanıcılar geçici bir ret alır. Onay istemleri komut metnini içerir, bu yüzden kanal teslimini yalnızca güvenilir kanallarda etkinleştirin. Kanal kimliği oturum anahtarından türetilemiyorsa OpenClaw DM teslimine geri döner.

    Discord, diğer sohbet kanalları tarafından kullanılan paylaşılan onay düğmelerini de işler. Yerel Discord bağdaştırıcısı esas olarak onaylayıcı DM yönlendirmesi ve kanal yayılımı ekler.
    Bu düğmeler mevcut olduğunda birincil onay UX'i bunlardır; OpenClaw
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın
    tek yol olduğunu söylediğinde manuel bir `/approve` komutu eklemelidir.
    Discord yerel onay çalışma zamanı etkin değilse OpenClaw yerel deterministik
    `/approve <id> <decision>` istemini görünür tutar. Çalışma zamanı etkin
    olsa da yerel kart herhangi bir hedefe teslim edilemiyorsa OpenClaw,
    bekleyen onaydan tam `/approve` komutuyla aynı sohbette bir geri dönüş bildirimi gönderir.

    Gateway kimlik doğrulaması ve onay çözümlemesi paylaşılan Gateway istemci sözleşmesini izler (`plugin:` kimlikleri `plugin.approval.resolve` üzerinden, diğer kimlikler `exec.approval.resolve` üzerinden çözümlenir). Onaylar varsayılan olarak 30 dakika sonra sona erer.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Araçlar ve eylem kapıları

Discord mesaj eylemleri mesajlaşma, kanal yönetimi, moderasyon, durum ve metadata eylemlerini içerir.

Temel örnekler:

- mesajlaşma: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- tepkiler: `react`, `reactions`, `emojiList`
- moderasyon: `timeout`, `kick`, `ban`
- durum: `setPresence`

`event-create` eylemi, planlanan etkinlik kapak görselini ayarlamak için isteğe bağlı bir `image` parametresi (URL veya yerel dosya yolu) kabul eder.

Eylem kapıları `channels.discord.actions.*` altında bulunur.

Varsayılan kapı davranışı:

| Eylem grubu                                                                                                                                                              | Varsayılan |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | etkin      |
| roles                                                                                                                                                                    | devre dışı |
| moderation                                                                                                                                                               | devre dışı |
| presence                                                                                                                                                                 | devre dışı |

## Components v2 UI

OpenClaw, exec onayları ve bağlamlar arası işaretçiler için Discord components v2 kullanır. Discord mesaj eylemleri özel UI için `components` da kabul edebilir (gelişmiş; discord aracı üzerinden bir component yükü oluşturmayı gerektirir), eski `embeds` kullanılabilir kalır ancak önerilmez.

- `channels.discord.ui.components.accentColor`, Discord component kapsayıcıları tarafından kullanılan vurgu rengini ayarlar (hex).
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

Discord'un iki ayrı ses yüzeyi vardır: gerçek zamanlı **ses kanalları** (sürekli konuşmalar) ve **sesli mesaj ekleri** (dalga formu önizleme biçimi). Gateway ikisini de destekler.

### Ses kanalları

Kurulum kontrol listesi:

1. Discord Developer Portal'da Message Content Intent'i etkinleştirin.
2. Rol/kullanıcı izin listeleri kullanıldığında Server Members Intent'i etkinleştirin.
3. Botu `bot` ve `applications.commands` kapsamlarıyla davet edin.
4. Hedef ses kanalında Connect, Speak, Send Messages ve Read Message History izinlerini verin.
5. Yerel komutları etkinleştirin (`commands.native` veya `channels.discord.commands.native`).
6. `channels.discord.voice` yapılandırmasını yapın.

Oturumları kontrol etmek için `/vc join|leave|status` kullanın. Komut, hesap varsayılan ajanını kullanır ve diğer Discord komutlarıyla aynı izin listesi ve grup ilkesi kurallarını izler.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Katılmadan önce botun geçerli izinlerini incelemek için şunu çalıştırın:

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
- `voice.model`, yalnızca Discord ses kanalı yanıtları için kullanılan LLM'yi geçersiz kılar. Yönlendirilen ajan modelini miras almak için ayarlamadan bırakın.
- STT `tools.media.audio` kullanır; `voice.model` transkripsiyonu etkilemez.
- Kanal başına Discord `systemPrompt` geçersiz kılmaları, o ses kanalı için ses transkripti turlarına uygulanır.
- Ses transkripti turları sahip durumunu Discord `allowFrom` (veya `dm.allowFrom`) üzerinden türetir; sahip olmayan konuşmacılar yalnızca sahip araçlarına erişemez (örneğin `gateway` ve `cron`).
- Discord sesi, yalnızca metin yapılandırmaları için isteğe bağlıdır; `/vc` komutlarını, ses çalışma zamanını ve `GuildVoiceStates` gateway intent'ini etkinleştirmek için `channels.discord.voice.enabled=true` ayarlayın (veya mevcut bir `channels.discord.voice` bloğunu koruyun).
- `channels.discord.intents.voiceStates`, ses durumu intent aboneliğini açıkça geçersiz kılabilir. Intent'in etkili ses etkinleştirmesini izlemesi için ayarlamadan bırakın.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` katılma seçeneklerine geçirilir.
- Ayarlanmamışsa `@discordjs/voice` varsayılanları `daveEncryption=true` ve `decryptionFailureTolerance=24` değerleridir.
- `voice.connectTimeoutMs`, `/vc join` ve otomatik katılma denemeleri için ilk `@discordjs/voice` Ready beklemesini kontrol eder. Varsayılan: `30000`.
- `voice.reconnectGraceMs`, OpenClaw'ın bağlantısı kesilmiş bir ses oturumunu yok etmeden önce yeniden bağlanmaya başlamasını ne kadar süre bekleyeceğini kontrol eder. Varsayılan: `15000`.
- Başka bir kullanıcının konuşmaya başlaması ses oynatmayı kendiliğinden durdurmaz. Geri besleme döngülerini önlemek için OpenClaw, TTS oynatılırken yeni ses yakalamayı yok sayar; sonraki tur için oynatma bittikten sonra konuşun.
- `voice.captureSilenceGraceMs`, Discord bir konuşmacının durduğunu bildirdikten sonra OpenClaw'ın o ses segmentini STT için sonlandırmadan önce ne kadar bekleyeceğini kontrol eder. Varsayılan: `2500`; Discord normal duraklamaları kesik kesik kısmi transkriptlere bölüyorsa bunu artırın.
- ElevenLabs seçili TTS sağlayıcısı olduğunda Discord ses oynatma streaming TTS kullanır ve sağlayıcı yanıt akışından başlar. Streaming desteği olmayan sağlayıcılar sentezlenmiş geçici dosya yoluna geri döner.
- OpenClaw ayrıca alma şifre çözme hatalarını izler ve kısa bir pencerede tekrarlanan hatalardan sonra ses kanalından ayrılıp yeniden katılarak otomatik olarak toparlanır.
- Güncellemeden sonra alma günlükleri tekrar tekrar `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` gösteriyorsa bir bağımlılık raporu ve günlükleri toplayın. Paketlenen `@discordjs/voice` satırı, discord.js issue #11419'u kapatan discord.js PR #11449'daki yukarı akış padding düzeltmesini içerir.
- `The operation was aborted` alma olayları, OpenClaw yakalanan bir konuşmacı segmentini sonlandırdığında beklenir; bunlar ayrıntılı tanılamalardır, uyarı değildir.

Ses kanalı hattı:

- Discord PCM yakalama bir WAV geçici dosyasına dönüştürülür.
- `tools.media.audio` STT'yi işler, örneğin `openai/gpt-4o-mini-transcribe`.
- Transkript Discord ingress ve yönlendirme üzerinden gönderilir; yanıt LLM'si, ajan `tts` aracını gizleyen ve döndürülen metni isteyen bir ses çıkışı ilkesiyle çalışır, çünkü nihai TTS oynatmasını Discord sesi üstlenir.
- `voice.model` ayarlandığında yalnızca bu ses kanalı turu için yanıt LLM'sini geçersiz kılar.
- `voice.tts`, `messages.tts` üzerine birleştirilir; streaming destekli sağlayıcılar oynatıcıyı doğrudan besler, aksi halde oluşan ses dosyası katılınan kanalda oynatılır.

Kimlik bilgileri bileşen başına çözümlenir: `voice.model` için LLM rota kimlik doğrulaması, `tools.media.audio` için STT kimlik doğrulaması ve `messages.tts`/`voice.tts` için TTS kimlik doğrulaması.

### Sesli mesajlar

Discord sesli mesajları bir dalga formu önizlemesi gösterir ve OGG/Opus ses gerektirir. OpenClaw dalga formunu otomatik olarak üretir, ancak incelemek ve dönüştürmek için gateway host üzerinde `ffmpeg` ve `ffprobe` gerekir.

- Bir **yerel dosya yolu** sağlayın (URL'ler reddedilir).
- Metin içeriğini atlayın (Discord aynı payload içinde metin + sesli mesajı reddeder).
- Herhangi bir ses biçimi kabul edilir; OpenClaw gerektiğinde OGG/Opus'a dönüştürür.

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

  <Accordion title="Bahsetme zorunluluğu false olsa da yine de engelleniyor">
    Yaygın nedenler:

    - Eşleşen sunucu/kanal izin listesi olmadan `groupPolicy="allowlist"`
    - `requireMention` yanlış yerde yapılandırılmış (şunun altında olmalıdır: `channels.discord.guilds` veya kanal girdisi)
    - gönderen, sunucu/kanal `users` izin listesi tarafından engellenmiş

  </Accordion>

  <Accordion title="Uzun süren Discord dönüşleri veya yinelenen yanıtlar">

    Tipik günlükler:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway kuyruğu ayarları:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çoklu hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - bu yalnızca Discord gateway dinleyici işini denetler, ajan dönüş ömrünü değil

    Discord, kuyruğa alınmış ajan dönüşlerine kanalın sahip olduğu bir zaman aşımı uygulamaz. İleti dinleyicileri hemen devreder ve kuyruğa alınmış Discord çalıştırmaları, oturum/araç/çalışma zamanı yaşam döngüsü tamamlanana veya işi iptal edene kadar oturum başına sıralamayı korur.

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

  <Accordion title="Gateway meta verisi arama zaman aşımı uyarıları">
    OpenClaw bağlanmadan önce Discord `/gateway/bot` meta verisini getirir. Geçici hatalar Discord'un varsayılan gateway URL'sine geri döner ve günlüklerde hız sınırlamasına tabi tutulur.

    Meta veri zaman aşımı ayarları:

    - tek hesap: `channels.discord.gatewayInfoTimeoutMs`
    - çoklu hesap: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - yapılandırma ayarlanmamışsa env geri dönüşü: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - varsayılan: `30000` (30 saniye), maksimum: `120000`

  </Accordion>

  <Accordion title="Gateway READY zaman aşımı yeniden başlatmaları">
    OpenClaw başlangıç sırasında ve çalışma zamanı yeniden bağlantılarından sonra Discord'un gateway `READY` olayını bekler. Başlangıç kademelendirmesi olan çoklu hesap kurulumları, varsayılandan daha uzun bir başlangıç READY penceresine ihtiyaç duyabilir.

    READY zaman aşımı ayarları:

    - başlangıç tek hesap: `channels.discord.gatewayReadyTimeoutMs`
    - başlangıç çoklu hesap: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa başlangıç env geri dönüşü: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - başlangıç varsayılanı: `15000` (15 saniye), maksimum: `120000`
    - çalışma zamanı tek hesap: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - çalışma zamanı çoklu hesap: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa çalışma zamanı env geri dönüşü: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - çalışma zamanı varsayılanı: `30000` (30 saniye), maksimum: `120000`

  </Accordion>

  <Accordion title="İzin denetimi uyuşmazlıkları">
    `channels status --probe` izin denetimleri yalnızca sayısal kanal kimlikleri için çalışır.

    Slug anahtarları kullanırsanız çalışma zamanı eşleştirmesi yine çalışabilir, ancak probe izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM ve eşleştirme sorunları">

    - DM devre dışı: `channels.discord.dm.enabled=false`
    - DM ilkesi devre dışı: `channels.discord.dmPolicy="disabled"` (eski: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Bot-bot döngüleri">
    Varsayılan olarak bot tarafından yazılmış iletiler yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız döngü davranışını önlemek için katı bahsetme ve izin listesi kuralları kullanın.
    Yalnızca bottan bahseden bot iletilerini kabul etmek için `channels.discord.allowBots="mentions"` tercih edin.

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

  <Accordion title="DecryptionFailed(...) ile Voice STT düşmeleri">

    - Discord ses alma kurtarma mantığı mevcut olsun diye OpenClaw'u güncel tutun (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` olduğunu doğrulayın (varsayılan)
    - `channels.discord.voice.decryptionFailureTolerance=24` (upstream varsayılanı) ile başlayın ve yalnızca gerekirse ayarlayın
    - şu günlükleri izleyin:
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
- akış: `streaming` (eski takma ad: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medya/yeniden deneme: `mediaMaxMb` (giden Discord yüklemelerini sınırlar, varsayılan `100MB`), `retry`
- eylemler: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- özellikler: `threadBindings`, üst düzey `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Güvenlik ve operasyonlar

- Bot tokenlarını gizli bilgi olarak ele alın (denetimli ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- En düşük ayrıcalıklı Discord izinlerini verin.
- Komut dağıtımı/durumu eskiyse gateway'i yeniden başlatın ve `openclaw channels status --probe` ile yeniden denetleyin.

## İlgili

<CardGroup cols={2}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bir Discord kullanıcısını gateway ile eşleştirin.
  </Card>
  <Card title="Gruplar" icon="users" href="/tr/channels/groups">
    Grup sohbeti ve izin listesi davranışı.
  </Card>
  <Card title="Kanal yönlendirme" icon="route" href="/tr/channels/channel-routing">
    Gelen iletileri ajanlara yönlendirin.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sağlamlaştırma.
  </Card>
  <Card title="Çok ajanlı yönlendirme" icon="sitemap" href="/tr/concepts/multi-agent">
    Sunucuları ve kanalları ajanlarla eşleyin.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı.
  </Card>
</CardGroup>
