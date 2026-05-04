---
read_when:
    - Discord kanal özellikleri üzerinde çalışma
summary: Discord bot desteği durumu, yetenekleri ve yapılandırması
title: Discord
x-i18n:
    generated_at: "2026-05-04T02:21:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: df4e045e39f8977f779fe409abf41dad0d950c92f1230c51ff356343513df812
    source_path: channels/discord.md
    workflow: 16
---

Resmi Discord Gateway üzerinden DM'ler ve guild kanalları için hazır.

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

Bir bot içeren yeni bir uygulama oluşturmanız, botu sunucunuza eklemeniz ve OpenClaw ile eşleştirmeniz gerekir. Botunuzu kendi özel sunucunuza eklemenizi öneririz. Henüz yoksa, [önce bir tane oluşturun](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** seçeneğini seçin).

<Steps>
  <Step title="Bir Discord uygulaması ve bot oluşturun">
    [Discord Developer Portal](https://discord.com/developers/applications) adresine gidin ve **New Application**'a tıklayın. "OpenClaw" gibi bir ad verin.

    Kenar çubuğunda **Bot**'a tıklayın. **Username** değerini OpenClaw aracınıza verdiğiniz ad olarak ayarlayın.

  </Step>

  <Step title="Ayrıcalıklı amaçları etkinleştirin">
    Hala **Bot** sayfasındayken **Privileged Gateway Intents** bölümüne kaydırın ve şunları etkinleştirin:

    - **Message Content Intent** (gerekli)
    - **Server Members Intent** (önerilir; rol izin listeleri ve ad-kimlik eşleştirmesi için gereklidir)
    - **Presence Intent** (isteğe bağlı; yalnızca durum güncellemeleri için gerekir)

  </Step>

  <Step title="Bot tokenınızı kopyalayın">
    **Bot** sayfasında yukarı kaydırın ve **Reset Token**'a tıklayın.

    <Note>
    Adına rağmen bu işlem ilk tokenınızı oluşturur; hiçbir şey "sıfırlanmıyor."
    </Note>

    Tokenı kopyalayın ve bir yere kaydedin. Bu sizin **Bot Token** değerinizdir ve kısa süre sonra gerekecektir.

  </Step>

  <Step title="Bir davet URL'si oluşturun ve botu sunucunuza ekleyin">
    Kenar çubuğunda **OAuth2**'ye tıklayın. Botu sunucunuza eklemek için doğru izinlere sahip bir davet URL'si oluşturacaksınız.

    **OAuth2 URL Generator** bölümüne kaydırın ve şunları etkinleştirin:

    - `bot`
    - `applications.commands`

    Aşağıda bir **Bot Permissions** bölümü görünecektir. En az şunları etkinleştirin:

    **General Permissions**
      - Kanalları Görüntüle
    **Text Permissions**
      - Mesaj Gönder
      - Mesaj Geçmişini Oku
      - Bağlantı Göm
      - Dosya Ekle
      - Tepki Ekle (isteğe bağlı)

    Bu, normal metin kanalları için temel izin kümesidir. Forum veya medya kanalı iş akışları dahil Discord konu dizilerine gönderi yapmayı planlıyorsanız, bir konu oluşturan ya da sürdüren akışlar için **Send Messages in Threads** seçeneğini de etkinleştirin.
    Alttaki oluşturulan URL'yi kopyalayın, tarayıcınıza yapıştırın, sunucunuzu seçin ve bağlanmak için **Continue**'ya tıklayın. Artık Discord sunucusunda botunuzu görmelisiniz.

  </Step>

  <Step title="Geliştirici Modunu etkinleştirin ve kimliklerinizi toplayın">
    Discord uygulamasına geri dönün; dahili kimlikleri kopyalayabilmek için Geliştirici Modunu etkinleştirmeniz gerekir.

    1. **User Settings**'e tıklayın (avatarınızın yanındaki dişli simgesi) → **Advanced** → **Developer Mode**'u açın
    2. Kenar çubuğundaki **sunucu simgenize** sağ tıklayın → **Copy Server ID**
    3. **Kendi avatarınıza** sağ tıklayın → **Copy User ID**

    **Server ID** ve **User ID** değerlerinizi Bot Token değerinizle birlikte kaydedin; sonraki adımda üçünü de OpenClaw'a göndereceksiniz.

  </Step>

  <Step title="Sunucu üyelerinden DM'lere izin verin">
    Eşleştirmenin çalışması için Discord'un botunuzun size DM göndermesine izin vermesi gerekir. **Sunucu simgenize** sağ tıklayın → **Privacy Settings** → **Direct Messages**'ı açın.

    Bu, sunucu üyelerinin (botlar dahil) size DM göndermesine izin verir. Discord DM'lerini OpenClaw ile kullanmak istiyorsanız bunu açık tutun. Yalnızca guild kanallarını kullanmayı planlıyorsanız eşleştirmeden sonra DM'leri devre dışı bırakabilirsiniz.

  </Step>

  <Step title="Bot tokenınızı güvenli biçimde ayarlayın (sohbette göndermeyin)">
    Discord bot tokenınız bir sırdır (parola gibi). Aracınıza mesaj göndermeden önce OpenClaw'ı çalıştıran makinede ayarlayın.

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
    Yönetilen hizmet kurulumları için, `DISCORD_BOT_TOKEN` değerinin mevcut olduğu bir shell'den `openclaw gateway install` çalıştırın veya değişkeni `~/.openclaw/.env` içinde saklayın; böylece hizmet yeniden başlatmadan sonra env SecretRef değerini çözebilir.
    Ana makineniz Discord'un başlangıç uygulama araması tarafından engellenirse veya hız sınırına takılırsa, başlangıcın bu REST çağrısını atlayabilmesi için Discord uygulama/istemci kimliğini Developer Portal'dan ayarlayın. Varsayılan hesap için `channels.discord.applicationId` kullanın veya birden fazla Discord botu çalıştırdığınızda `channels.discord.accounts.<accountId>.applicationId` kullanın.

  </Step>

  <Step title="OpenClaw'ı yapılandırın ve eşleştirin">

    <Tabs>
      <Tab title="Aracınıza sorun">
        Mevcut herhangi bir kanalda (ör. Telegram) OpenClaw aracınızla sohbet edin ve ona söyleyin. Discord ilk kanalınızsa bunun yerine CLI / yapılandırma sekmesini kullanın.

        > "Discord bot tokenımı yapılandırmada zaten ayarladım. Lütfen Discord kurulumunu User ID `<user_id>` ve Server ID `<server_id>` ile tamamla."
      </Tab>
      <Tab title="CLI / yapılandırma">
        Dosya tabanlı yapılandırmayı tercih ediyorsanız şunları ayarlayın:

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

        Betikli veya uzak kurulum için aynı JSON5 bloğunu `openclaw config patch --file ./discord.patch.json5 --dry-run` ile yazın ve ardından `--dry-run` olmadan yeniden çalıştırın. Düz metin `token` değerleri desteklenir. SecretRef değerleri de env/file/exec sağlayıcıları genelinde `channels.discord.token` için desteklenir. Bkz. [Gizli Bilgi Yönetimi](/tr/gateway/secrets).

        Birden fazla Discord botu için her bot tokenını ve uygulama kimliğini kendi hesabının altında tutun. Üst düzey `channels.discord.applicationId` hesaplar tarafından devralınır, bu nedenle yalnızca her hesabın aynı uygulama kimliğini kullanması gerektiğinde orada ayarlayın.

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
Etkin iki Discord hesabı aynı bot tokenına çözümlenirse, OpenClaw bu token için yalnızca bir Gateway izleyicisi başlatır. Yapılandırma kaynaklı token, varsayılan env yedeğine göre önceliklidir; aksi halde ilk etkin hesap kazanır ve yinelenen hesap devre dışı olarak bildirilir.
Gelişmiş giden çağrılar için (mesaj aracı/kanal eylemleri), çağrıya özel açık bir `token` kullanılır. Bu, gönderme ve okuma/sondaj tarzı eylemler için geçerlidir (örneğin read/search/fetch/thread/pins/permissions). Hesap ilkesi/yeniden deneme ayarları yine etkin çalışma zamanı anlık görüntüsünde seçilen hesaptan gelir.
</Note>

## Önerilir: Bir guild çalışma alanı ayarlayın

DM'ler çalıştıktan sonra, Discord sunucunuzu her kanalın kendi bağlamına sahip kendi aracı oturumunu aldığı tam bir çalışma alanı olarak ayarlayabilirsiniz. Bu, yalnızca siz ve botunuzun olduğu özel sunucular için önerilir.

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
    Varsayılan olarak aracınız guild kanallarında yalnızca @mentioned olduğunda yanıt verir. Özel bir sunucu için muhtemelen her mesaja yanıt vermesini istersiniz.

    Guild kanallarında, normal asistan son yanıtları varsayılan olarak özel kalır. Görünür Discord çıktısı `message` aracıyla açıkça gönderilmelidir; böylece araç varsayılan olarak sessizce izleyebilir ve yalnızca kanal yanıtının yararlı olduğuna karar verdiğinde gönderi paylaşabilir.

    Bu, seçilen modelin araçları güvenilir biçimde çağırması gerektiği anlamına gelir. Discord yazıyor gösteriyor ve günlükler token kullanımı gösteriyor ama gönderilmiş mesaj yoksa, `didSendViaMessagingTool: false` içeren asistan metni için oturum günlüğünü kontrol edin. Bu, modelin `message(action=send)` çağırmak yerine özel bir son yanıt ürettiği anlamına gelir. Daha güçlü araç çağıran bir modele geçin veya eski otomatik son yanıtları geri yüklemek için aşağıdaki yapılandırmayı kullanın.

    <Tabs>
      <Tab title="Aracınıza sorun">
        > "Aracımın bu sunucuda @mentioned olmadan yanıt vermesine izin ver"
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
        > "Discord kanallarında soru sorduğumda, MEMORY.md dosyasından uzun süreli bağlama ihtiyacın olursa memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Manuel">
        Her kanalda paylaşılan bağlama ihtiyacınız varsa, kararlı yönergeleri `AGENTS.md` veya `USER.md` içine koyun (bunlar her oturum için enjekte edilir). Uzun süreli notları `MEMORY.md` içinde tutun ve gerektiğinde bellek araçlarıyla erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Şimdi Discord sunucunuzda birkaç kanal oluşturun ve sohbete başlayın. Aracınız kanal adını görebilir ve her kanal kendi yalıtılmış oturumunu alır; böylece iş akışınıza uyan `#coding`, `#home`, `#research` veya başka herhangi bir kanalı ayarlayabilirsiniz.

## Çalışma zamanı modeli

- Gateway, Discord bağlantısına sahiptir.
- Yanıt yönlendirme deterministiktir: Discord üzerinden gelen yanıtlar Discord'a geri döner.
- Discord sunucu/kanal meta verileri, kullanıcıya görünür bir yanıt öneki olarak değil, güvenilmeyen
  bağlam olarak model istemine eklenir. Bir model bu zarfı geri kopyalarsa
  OpenClaw, kopyalanan meta verileri giden yanıtlardan ve gelecekteki
  yeniden oynatma bağlamından kaldırır.
- Varsayılan olarak (`session.dmScope=main`), doğrudan sohbetler ajanın ana oturumunu paylaşır (`agent:main:main`).
- Sunucu kanalları yalıtılmış oturum anahtarlarıdır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM'leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel slash komutları yalıtılmış komut oturumlarında çalışır (`agent:<agentId>:discord:slash:<userId>`), ancak yönlendirilen konuşma oturumuna `CommandTargetSessionKey` taşımaya devam eder.
- Discord'a yalnızca metin cron/heartbeat duyuru teslimi, son
  asistana görünür yanıtı bir kez kullanır. Medya ve yapılandırılmış bileşen yükleri, ajan
  birden fazla teslim edilebilir yük yaydığında çok iletili kalır.

## Forum kanalları

Discord forum ve medya kanalları yalnızca konu gönderilerini kabul eder. OpenClaw bunları oluşturmak için iki yolu destekler:

- Bir konuyu otomatik oluşturmak için forum üst öğesine (`channel:<forumId>`) bir ileti gönderin. Konu başlığı, iletinizin boş olmayan ilk satırını kullanır.
- Doğrudan bir konu oluşturmak için `openclaw message thread create` kullanın. Forum kanalları için `--message-id` geçirmeyin.

Örnek: konu oluşturmak için forum üst öğesine gönderme

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Örnek: açıkça forum konusu oluşturma

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum üst öğeleri Discord bileşenlerini kabul etmez. Bileşenlere ihtiyacınız varsa, konunun kendisine gönderin (`channel:<threadId>`).

## Etkileşimli bileşenler

OpenClaw, ajan iletileri için Discord bileşenleri v2 kapsayıcılarını destekler. `components` yüküyle ileti aracını kullanın. Etkileşim sonuçları normal gelen iletiler olarak ajana geri yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Eylem satırları en fazla 5 düğmeye veya tek bir seçim menüsüne izin verir
- Seçim türleri: `string`, `user`, `role`, `mentionable`, `channel`

Varsayılan olarak bileşenler tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süresi dolana kadar birden çok kez kullanılmasına izin vermek için `components.reusable=true` ayarlayın.

Bir düğmeye kimin tıklayabileceğini kısıtlamak için o düğmede `allowedUsers` ayarlayın (Discord kullanıcı kimlikleri, etiketleri veya `*`). Yapılandırıldığında, eşleşmeyen kullanıcılar geçici bir ret alır.

`/model` ve `/models` slash komutları, sağlayıcı, model ve uyumlu çalışma zamanı açılır listeleri ile bir Gönder adımı içeren etkileşimli bir model seçici açar. `/models add` kullanımdan kaldırılmıştır ve artık sohbetten model kaydetmek yerine kullanımdan kaldırma iletisi döndürür. Seçici yanıtı geçicidir ve yalnızca çağıran kullanıcı tarafından kullanılabilir.

Dosya ekleri:

- `file` blokları bir ek referansına işaret etmelidir (`attachment://<filename>`)
- Eki `media`/`path`/`filePath` aracılığıyla sağlayın (tek dosya); birden fazla dosya için `media-gallery` kullanın
- Karşıya yükleme adının ek referansıyla eşleşmesi gerektiğinde adı geçersiz kılmak için `filename` kullanın

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
  <Tab title="DM ilkesi">
    `channels.discord.dmPolicy`, DM erişimini denetler. `channels.discord.allowFrom`, kanonik DM izin listesidir.

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    DM ilkesi açık değilse, bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme istenir).

    Çoklu hesap önceliği:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesabı için geçerlidir.
    - Tek hesap için `allowFrom`, eski `dm.allowFrom` değerinden önceliklidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` ve eski `dm.allowFrom` ayarlanmamışsa `channels.discord.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.discord.accounts.default.allowFrom` değerini devralmaz.

    Eski `channels.discord.dm.policy` ve `channels.discord.dm.allowFrom`, uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` alanlarına taşır.

    Teslimat için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` bahsi

    Yalın sayısal kimlikler, bir kanal varsayılanı etkinken normalde kanal kimlikleri olarak çözümlenir, ancak hesabın etkin DM `allowFrom` listesinde yer alan kimlikler uyumluluk için kullanıcı DM hedefleri olarak değerlendirilir.

  </Tab>

  <Tab title="DM erişim grupları">
    Discord DM'leri, `channels.discord.allowFrom` içinde dinamik `accessGroup:<name>` girişlerini kullanabilir.

    Erişim grubu adları ileti kanalları arasında paylaşılır. Üyeleri her kanalın normal `allowFrom` söz dizimiyle ifade edilen statik bir grup için `type: "message.senders"` kullanın veya bir Discord kanalının geçerli `ViewChannel` kitlesi üyeliği dinamik olarak tanımlamalıysa `type: "discord.channelAudience"` kullanın. Paylaşılan erişim grubu davranışı burada belgelenmiştir: [Erişim grupları](/tr/channels/access-groups).

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

    Bir Discord metin kanalının ayrı bir üye listesi yoktur. `type: "discord.channelAudience"` üyeliği şu şekilde modeller: DM göndereni, yapılandırılmış sunucunun bir üyesidir ve rol ile kanal üzerine yazmaları uygulandıktan sonra yapılandırılmış kanalda geçerli `ViewChannel` iznine sahiptir.

    Örnek: `#maintainers` kanalını görebilen herkesin bota DM göndermesine izin verirken DM'leri diğer herkese kapalı tutma.

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

    Aramalar güvenli biçimde kapalı başarısız olur. Discord `Missing Access` döndürürse, üye araması başarısız olursa veya kanal farklı bir sunucuya aitse, DM göndereni yetkisiz kabul edilir.

    Kanal kitlesi erişim gruplarını kullanırken bot için Discord Developer Portal **Server Members Intent** özelliğini etkinleştirin. DM'ler sunucu üye durumunu içermez, bu nedenle OpenClaw yetkilendirme sırasında üyeyi Discord REST üzerinden çözümler.

  </Tab>

  <Tab title="Sunucu ilkesi">
    Sunucu işleme `channels.discord.groupPolicy` tarafından denetlenir:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` mevcut olduğunda güvenli temel çizgi `allowlist` değeridir.

    `allowlist` davranışı:

    - sunucu `channels.discord.guilds` ile eşleşmelidir (`id` tercih edilir, slug kabul edilir)
    - isteğe bağlı gönderen izin listeleri: `users` (kararlı kimlikler önerilir) ve `roles` (yalnızca rol kimlikleri); ikisinden biri yapılandırılmışsa, gönderenler `users` VEYA `roles` ile eşleştiklerinde izinli olur
    - doğrudan ad/etiket eşleştirme varsayılan olarak devre dışıdır; `channels.discord.dangerouslyAllowNameMatching: true` değerini yalnızca acil uyumluluk modu olarak etkinleştirin
    - `users` için adlar/etiketler desteklenir, ancak kimlikler daha güvenlidir; ad/etiket girişleri kullanıldığında `openclaw security audit` uyarır
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

    Yalnızca `DISCORD_BOT_TOKEN` ayarlar ve bir `channels.discord` bloğu oluşturmazsanız, `channels.defaults.groupPolicy` `open` olsa bile çalışma zamanı geri dönüşü `groupPolicy="allowlist"` olur (günlüklerde bir uyarıyla).

  </Tab>

  <Tab title="Bahisler ve grup DM'leri">
    Sunucu iletileri varsayılan olarak bahis kapılıdır.

    Bahis algılama şunları içerir:

    - açık bot bahsi
    - yapılandırılmış bahis kalıpları (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda örtük bota-yanıt davranışı

    Giden Discord iletileri yazarken kanonik bahis söz dizimini kullanın: kullanıcılar için `<@USER_ID>`, kanallar için `<#CHANNEL_ID>` ve roller için `<@&ROLE_ID>`. Eski `<@!USER_ID>` takma ad bahis biçimini kullanmayın.

    `requireMention` sunucu/kanal başına yapılandırılır (`channels.discord.guilds...`).
    `ignoreOtherMentions`, isteğe bağlı olarak botu değil başka bir kullanıcıyı/rolü bahseden iletileri bırakır (@everyone/@here hariç).

    Grup DM'leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - `dm.groupChannels` üzerinden isteğe bağlı izin listesi (kanal kimlikleri veya slug'lar)

  </Tab>
</Tabs>

### Role dayalı ajan yönlendirme

Discord sunucu üyelerini rol kimliğine göre farklı ajanlara yönlendirmek için `bindings[].match.roles` kullanın. Role dayalı bağlamalar yalnızca rol kimliklerini kabul eder ve eş veya üst eş bağlamalarından sonra, yalnızca sunucu bağlamalarından önce değerlendirilir. Bir bağlama başka eşleşme alanları da ayarlarsa (örneğin `peer` + `guildId` + `roles`), yapılandırılmış tüm alanlar eşleşmelidir.

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

- `commands.native`, varsayılan olarak `"auto"` değerini alır ve Discord için etkindir.
- Kanal başına geçersiz kılma: `channels.discord.commands.native`.
- `commands.native=false`, başlangıç sırasında Discord slash-command kaydını ve temizliğini atlar. Daha önce kaydedilmiş komutlar, onları Discord uygulamasından kaldırana kadar Discord içinde görünür kalabilir.
- Yerel komut kimlik doğrulaması, normal ileti işleme ile aynı Discord izin listelerini/politikalarını kullanır.
- Komutlar yetkili olmayan kullanıcılar için Discord kullanıcı arayüzünde hâlâ görünebilir; yürütme yine de OpenClaw kimlik doğrulamasını uygular ve "yetkili değil" döndürür.

Komut kataloğu ve davranışı için bkz. [Slash komutları](/tr/tools/slash-commands).

Varsayılan slash komutu ayarları:

- `ephemeral: true`

## Özellik ayrıntıları

<AccordionGroup>
  <Accordion title="Yanıt etiketleri ve yerel yanıtlar">
    Discord, ajan çıktısında yanıt etiketlerini destekler:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` tarafından denetlenir:

    - `off` (varsayılan)
    - `first`
    - `all`
    - `batched`

    Not: `off`, örtük yanıt iş parçacığı oluşturmayı devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.
    `first`, örtük yerel yanıt referansını her zaman turdaki ilk giden Discord iletisine ekler.
    `batched`, Discord'un örtük yerel yanıt referansını yalnızca
    gelen tur birden fazla iletiden oluşan debounce uygulanmış bir toplu işlem olduğunda ekler. Bu,
    yerel yanıtları her tek iletili tur için değil, ağırlıklı olarak belirsiz ve yoğun sohbetler için
    istediğinizde kullanışlıdır.

    İleti kimlikleri bağlamda/geçmişte sunulur, böylece ajanlar belirli iletileri hedefleyebilir.

  </Accordion>

  <Accordion title="Canlı akış önizlemesi">
    OpenClaw, geçici bir ileti gönderip metin geldikçe onu düzenleyerek taslak yanıtları akışla iletebilir. `channels.discord.streaming`, `off` (varsayılan) | `partial` | `block` | `progress` değerlerini alır. `progress`, düzenlenebilir tek bir durum taslağını tutar ve son teslimata kadar araç ilerlemesiyle günceller; `streamMode` eski bir takma addır ve otomatik olarak geçirilir.

    Varsayılan `off` olarak kalır, çünkü birden fazla bot veya Gateway bir hesabı paylaştığında Discord önizleme düzenlemeleri hız sınırlarına hızla takılır.

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
    - `block`, taslak boyutunda parçalar yayar (boyutu ve kesme noktalarını ayarlamak için `draftChunk` kullanın; `textChunkLimit` ile sınırlandırılır).
    - Medya, hata ve açık yanıt son iletileri bekleyen önizleme düzenlemelerini iptal eder.
    - `streaming.preview.toolProgress` (varsayılan `true`), araç/ilerleme güncellemelerinin önizleme iletisini yeniden kullanıp kullanmayacağını denetler.

    Önizleme akışı yalnızca metin içindir; medya yanıtları normal teslimata geri döner. `block` akışı açıkça etkinleştirildiğinde, OpenClaw çift akışı önlemek için önizleme akışını atlar.

  </Accordion>

  <Accordion title="Geçmiş, bağlam ve iş parçacığı davranışı">
    Sunucu geçmişi bağlamı:

    - `channels.discord.historyLimit` varsayılan `20`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    DM geçmiş denetimleri:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    İş parçacığı davranışı:

    - Discord iş parçacıkları kanal oturumları olarak yönlendirilir ve geçersiz kılınmadıkça üst kanal yapılandırmasını devralır.
    - İş parçacığı oturumları, üst kanalın oturum düzeyi `/model` seçimini yalnızca model için yedek olarak devralır; iş parçacığına yerel `/model` seçimleri yine de önceliklidir ve transkript devralma etkinleştirilmedikçe üst transkript geçmişi kopyalanmaz.
    - `channels.discord.thread.inheritParent` (varsayılan `false`), yeni otomatik iş parçacıklarının üst transkriptten başlatılmasını seçer. Hesap başına geçersiz kılmalar `channels.discord.accounts.<id>.thread.inheritParent` altında bulunur.
    - İleti aracı tepkileri `user:<id>` DM hedeflerini çözebilir.
    - `guilds.<guild>.channels.<channel>.requireMention: false`, yanıt aşaması etkinleştirme yedeği sırasında korunur.

    Kanal konuları **güvenilmeyen** bağlam olarak enjekte edilir. İzin listeleri ajanı kimin tetikleyebileceğini belirler; tam bir ek bağlam redaksiyon sınırı değildir.

  </Accordion>

  <Accordion title="Alt ajanlar için iş parçacığına bağlı oturumlar">
    Discord, bir iş parçacığını bir oturum hedefine bağlayabilir; böylece o iş parçacığındaki takip iletileri aynı oturuma yönlendirilmeye devam eder (alt ajan oturumları dahil).

    Komutlar:

    - `/focus <target>` geçerli/yeni iş parçacığını bir alt ajan/oturum hedefine bağla
    - `/unfocus` geçerli iş parçacığı bağını kaldır
    - `/agents` etkin çalıştırmaları ve bağ durumunu göster
    - `/session idle <duration|off>` odaklanmış bağlar için hareketsizlikte otomatik odak kaldırmayı incele/güncelle
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

    - `session.threadBindings.*` genel varsayılanları ayarlar.
    - `channels.discord.threadBindings.*` Discord davranışını geçersiz kılar.
    - `spawnSessions`, `sessions_spawn({ thread: true })` ve ACP iş parçacığı oluşturma için iş parçacıklarının otomatik oluşturulmasını/bağlanmasını denetler. Varsayılan: `true`.
    - `defaultSpawnContext`, iş parçacığına bağlı oluşturma için yerel alt ajan bağlamını denetler. Varsayılan: `"fork"`.
    - Kullanımdan kaldırılmış `spawnSubagentSessions`/`spawnAcpSessions` anahtarları `openclaw doctor --fix` tarafından geçirilir.
    - Bir hesap için iş parçacığı bağları devre dışıysa `/focus` ve ilgili iş parçacığı bağlama işlemleri kullanılamaz.

    Bkz. [Alt ajanlar](/tr/tools/subagents), [ACP Ajanları](/tr/tools/acp-agents) ve [Yapılandırma Referansı](/tr/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Kalıcı ACP kanal bağları">
    Kararlı ve "her zaman açık" ACP çalışma alanları için, Discord konuşmalarını hedefleyen üst düzey türlenmiş ACP bağları yapılandırın.

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
    - Bağlı bir kanalda veya iş parçacığında, `/new` ve `/reset` aynı ACP oturumunu yerinde sıfırlar. Geçici iş parçacığı bağları etkinken hedef çözümlemeyi geçersiz kılabilir.
    - `spawnSessions`, `--thread auto|here` aracılığıyla alt iş parçacığı oluşturmayı/bağlamayı kapılar.

    Bağ davranışı ayrıntıları için bkz. [ACP Ajanları](/tr/tools/acp-agents).

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
    OpenClaw gelen bir iletiyi işlerken `ackReaction` bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - ajan kimliği emoji yedeği (`agents.list[].identity.emoji`, yoksa "👀")

    Notlar:

    - Discord unicode emoji veya özel emoji adlarını kabul eder.
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

  <Accordion title="PluralKit desteği">
    Proxy'lenmiş iletileri sistem üyesi kimliğine eşlemek için PluralKit çözümlemesini etkinleştirin:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // isteğe bağlı; özel sistemler için gerekir
      },
    },
  },
}
```

    Notlar:

    - izin listeleri `pk:<memberId>` kullanabilir
    - üye görünen adları yalnızca `channels.discord.dangerouslyAllowNameMatching: true` olduğunda ad/slug ile eşleştirilir
    - aramalar özgün ileti kimliğini kullanır ve zaman penceresiyle sınırlandırılır
    - arama başarısız olursa proxy'lenmiş iletiler bot iletisi olarak ele alınır ve `allowBots=true` olmadığı sürece düşürülür

  </Accordion>

  <Accordion title="Giden bahsetme takma adları">
    Ajanlar bilinen Discord kullanıcıları için belirleyici giden bahsetmelere ihtiyaç duyduğunda `mentionAliases` kullanın. Anahtarlar baştaki `@` olmadan tanıtıcılardır; değerler Discord kullanıcı kimlikleridir. Bilinmeyen tanıtıcılar, `@everyone`, `@here` ve Markdown kod aralıkları içindeki bahsetmeler değişmeden bırakılır.

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
    Varlık güncellemeleri, bir durum veya etkinlik alanı ayarladığınızda ya da otomatik varlığı etkinleştirdiğinizde uygulanır.

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
        exhaustedText: "token tükendi",
      },
    },
  },
}
```

    Otomatik varlık çalışma zamanı kullanılabilirliğini Discord durumuna eşler: sağlıklı => çevrimiçi, bozulmuş veya bilinmiyor => boşta, tükenmiş veya kullanılamaz => dnd. İsteğe bağlı metin geçersiz kılmaları:

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

    Discord, `enabled` ayarlanmamışsa veya `"auto"` ise ve en az bir onaylayıcı çözümlenebiliyorsa, `execApprovals.approvers` ya da `commands.ownerAllowFrom` üzerinden native exec onaylarını otomatik olarak etkinleştirir. Discord, exec onaylayıcılarını kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan mesaj `defaultTo` üzerinden çıkarımsamaz. Discord'u native onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `/diagnostics` ve `/export-trajectory` gibi hassas, yalnızca sahip komutlarına açık grup komutları için OpenClaw onay istemlerini ve nihai sonuçları özel olarak gönderir. Çağıran sahibin bir Discord sahip rotası varsa önce Discord DM denemesi yapar; bu yoksa Telegram gibi `commands.ownerAllowFrom` içindeki ilk kullanılabilir sahip rotasına geri döner.

    `target`, `channel` veya `both` olduğunda onay istemi kanalda görünür. Düğmeleri yalnızca çözümlenen onaylayıcılar kullanabilir; diğer kullanıcılar geçici bir ret alır. Onay istemleri komut metnini içerir, bu nedenle kanal teslimini yalnızca güvenilir kanallarda etkinleştirin. Kanal kimliği oturum anahtarından türetilemiyorsa OpenClaw DM teslimine geri döner.

    Discord ayrıca diğer sohbet kanalları tarafından kullanılan paylaşılan onay düğmelerini de işler. Native Discord bağdaştırıcısı temel olarak onaylayıcı DM yönlendirmesi ve kanal dağıtımı ekler.
    Bu düğmeler mevcut olduğunda birincil onay UX'i bunlardır; OpenClaw
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu
    söylediğinde manuel bir `/approve` komutu içermelidir.
    Discord native onay çalışma zamanı etkin değilse OpenClaw yerel belirleyici
    `/approve <id> <decision>` istemini görünür tutar. Çalışma zamanı etkinse ancak herhangi bir hedefe native kart teslim edilemiyorsa
    OpenClaw, bekleyen onaydan alınan tam `/approve`
    komutuyla aynı sohbet içinde yedek bir bildirim gönderir.

    Gateway kimlik doğrulaması ve onay çözümlemesi, paylaşılan Gateway istemci sözleşmesini izler (`plugin:` kimlikleri `plugin.approval.resolve` üzerinden; diğer kimlikler `exec.approval.resolve` üzerinden çözümlenir). Onaylar varsayılan olarak 30 dakika sonra sona erer.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Araçlar ve eylem kapıları

Discord mesaj eylemleri mesajlaşma, kanal yöneticiliği, moderasyon, durum ve meta veri eylemlerini içerir.

Temel örnekler:

- mesajlaşma: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- tepkiler: `react`, `reactions`, `emojiList`
- moderasyon: `timeout`, `kick`, `ban`
- durum: `setPresence`

`event-create` eylemi, zamanlanmış etkinlik kapak görselini ayarlamak için isteğe bağlı bir `image` parametresi (URL veya yerel dosya yolu) kabul eder.

Eylem kapıları `channels.discord.actions.*` altında bulunur.

Varsayılan kapı davranışı:

| Eylem grubu                                                                                                                                                              | Varsayılan |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled    |
| roles                                                                                                                                                                    | disabled   |
| moderation                                                                                                                                                               | disabled   |
| presence                                                                                                                                                                 | disabled   |

## Components v2 UI

OpenClaw, exec onayları ve bağlamlar arası işaretleyiciler için Discord components v2 kullanır. Discord mesaj eylemleri özel UI için `components` da kabul edebilir (gelişmiş; discord aracı üzerinden bir component yükü oluşturmayı gerektirir), eski `embeds` ise kullanılabilir kalır ancak önerilmez.

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

Discord'un iki ayrı ses yüzeyi vardır: gerçek zamanlı **ses kanalları** (sürekli konuşmalar) ve **sesli mesaj ekleri** (dalga formu önizleme biçimi). Gateway her ikisini de destekler.

### Ses kanalları

Kurulum kontrol listesi:

1. Discord Developer Portal içinde Message Content Intent etkinleştirin.
2. Rol/kullanıcı izin listeleri kullanıldığında Server Members Intent etkinleştirin.
3. Botu `bot` ve `applications.commands` kapsamlarıyla davet edin.
4. Hedef ses kanalında Connect, Speak, Send Messages ve Read Message History izinlerini verin.
5. Native komutları (`commands.native` veya `channels.discord.commands.native`) etkinleştirin.
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
- `voice.model`, yalnızca Discord ses kanalı yanıtları için kullanılan LLM'yi geçersiz kılar. Yönlendirilen aracı modelini devralmak için ayarlamadan bırakın.
- STT `tools.media.audio` kullanır; `voice.model` transkripsiyonu etkilemez.
- Kanal başına Discord `systemPrompt` geçersiz kılmaları, söz konusu ses kanalı için ses transkripti turlarına uygulanır.
- Ses transkripti turları sahip durumunu Discord `allowFrom` (veya `dm.allowFrom`) üzerinden türetir; sahip olmayan konuşmacılar yalnızca sahibe açık araçlara erişemez (örneğin `gateway` ve `cron`).
- Discord sesi yalnızca metin yapılandırmaları için isteğe bağlıdır; `/vc` komutlarını, ses çalışma zamanını ve `GuildVoiceStates` gateway amacını etkinleştirmek için `channels.discord.voice.enabled=true` ayarlayın (veya mevcut bir `channels.discord.voice` bloğunu koruyun).
- `channels.discord.intents.voiceStates`, ses durumu intent aboneliğini açıkça geçersiz kılabilir. Intent'in etkili ses etkinleştirmesini izlemesi için ayarlamadan bırakın.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` katılma seçeneklerine geçirilir.
- Ayarlanmamışsa `@discordjs/voice` varsayılanları `daveEncryption=true` ve `decryptionFailureTolerance=24` şeklindedir.
- `voice.connectTimeoutMs`, `/vc join` ve otomatik katılma denemeleri için ilk `@discordjs/voice` Ready beklemesini kontrol eder. Varsayılan: `30000`.
- `voice.reconnectGraceMs`, OpenClaw'ın bağlantısı kesilmiş bir ses oturumunu yok etmeden önce yeniden bağlanmaya başlamasını ne kadar süre bekleyeceğini kontrol eder. Varsayılan: `15000`.
- OpenClaw ayrıca alma şifre çözme hatalarını izler ve kısa bir zaman aralığında tekrarlanan hatalardan sonra ses kanalından ayrılıp yeniden katılarak otomatik kurtarma yapar.
- Güncellemeden sonra alma günlüklerinde tekrar tekrar `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` görünüyorsa bir bağımlılık raporu ve günlükler toplayın. Paketlenen `@discordjs/voice` satırı, discord.js issue #11419'u kapatan discord.js PR #11449'daki upstream padding düzeltmesini içerir.

Ses kanalı hattı:

- Discord PCM yakalaması bir WAV geçici dosyasına dönüştürülür.
- STT'yi `tools.media.audio` işler, örneğin `openai/gpt-4o-mini-transcribe`.
- Transkript Discord girişine ve yönlendirmeye gönderilir; yanıt LLM'si, Discord sesinin son TTS oynatmanın sahibi olması nedeniyle aracı `tts` aracını gizleyen ve döndürülen metin isteyen bir ses çıkışı ilkesiyle çalışır.
- `voice.model` ayarlandığında yalnızca bu ses kanalı turu için yanıt LLM'sini geçersiz kılar.
- `voice.tts`, `messages.tts` üzerine birleştirilir; ortaya çıkan ses katılınan kanalda oynatılır.

Kimlik bilgileri bileşen başına çözümlenir: `voice.model` için LLM rota kimlik doğrulaması, `tools.media.audio` için STT kimlik doğrulaması ve `messages.tts`/`voice.tts` için TTS kimlik doğrulaması.

### Sesli mesajlar

Discord sesli mesajları bir dalga formu önizlemesi gösterir ve OGG/Opus ses gerektirir. OpenClaw dalga formunu otomatik olarak oluşturur, ancak inceleme ve dönüştürme için gateway ana makinesinde `ffmpeg` ve `ffprobe` gerekir.

- Bir **yerel dosya yolu** sağlayın (URL'ler reddedilir).
- Metin içeriğini atlayın (Discord aynı yükte metin + sesli mesajı reddeder).
- Herhangi bir ses biçimi kabul edilir; OpenClaw gerektiğinde OGG/Opus biçimine dönüştürür.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="İzin verilmeyen intent'ler kullanıldı veya bot sunucu mesajlarını görmüyor">

    - Message Content Intent etkinleştirin
    - kullanıcı/üye çözümlemesine bağlı olduğunuzda Server Members Intent etkinleştirin
    - intent'leri değiştirdikten sonra gateway'i yeniden başlatın

  </Accordion>

  <Accordion title="Sunucu mesajları beklenmedik şekilde engellendi">

    - `groupPolicy` değerini doğrulayın
    - `channels.discord.guilds` altındaki sunucu izin listesini doğrulayın
    - sunucu `channels` haritası varsa yalnızca listelenen kanallara izin verilir
    - `requireMention` davranışını ve mention desenlerini doğrulayın

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
    - `requireMention` yanlış yerde yapılandırılmış (mutlaka `channels.discord.guilds` altında veya kanal girdisinde olmalıdır)
    - gönderen, sunucu/kanal `users` izin listesi tarafından engellenmiş

  </Accordion>

  <Accordion title="Uzun süren Discord turları veya yinelenen yanıtlar">

    Tipik günlükler:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway kuyruk ayarları:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çoklu hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - bu yalnızca Discord gateway dinleyici işini kontrol eder, aracı turu ömrünü değil

    Discord, kuyruğa alınmış aracı turlarına kanalın sahip olduğu bir zaman aşımı uygulamaz. Mesaj dinleyicileri işi hemen devreder ve kuyruğa alınmış Discord çalışmaları, oturum/araç/çalışma zamanı yaşam döngüsü tamamlanana veya işi iptal edene kadar oturum başına sıralamayı korur.

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
    OpenClaw bağlanmadan önce Discord `/gateway/bot` meta verilerini getirir. Geçici hatalar Discord'un varsayılan gateway URL'sine geri döner ve günlüklerde oran sınırlamasına tabidir.

    Meta veri zaman aşımı ayarları:

    - tek hesap: `channels.discord.gatewayInfoTimeoutMs`
    - çoklu hesap: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - yapılandırma ayarlanmamışsa env geri dönüşü: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - varsayılan: `30000` (30 saniye), maks: `120000`

  </Accordion>

  <Accordion title="Gateway READY zaman aşımı yeniden başlatmaları">
    OpenClaw, başlangıç sırasında ve çalışma zamanı yeniden bağlantılarından sonra Discord'un gateway `READY` olayını bekler. Başlangıç kademelendirmesi olan çok hesaplı kurulumlar, varsayılandan daha uzun bir başlangıç READY penceresine ihtiyaç duyabilir.

    READY zaman aşımı ayarları:

    - başlangıç tek hesap: `channels.discord.gatewayReadyTimeoutMs`
    - başlangıç çok hesap: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa başlangıç env yedeği: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - başlangıç varsayılanı: `15000` (15 saniye), maks: `120000`
    - çalışma zamanı tek hesap: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - çalışma zamanı çok hesap: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa çalışma zamanı env yedeği: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - çalışma zamanı varsayılanı: `30000` (30 saniye), maks: `120000`

  </Accordion>

  <Accordion title="İzin denetimi uyumsuzlukları">
    `channels status --probe` izin kontrolleri yalnızca sayısal kanal kimlikleri için çalışır.

    Slug anahtarları kullanırsanız çalışma zamanı eşleştirmesi yine de çalışabilir, ancak probe izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM ve eşleştirme sorunları">

    - DM devre dışı: `channels.discord.dm.enabled=false`
    - DM ilkesi devre dışı: `channels.discord.dmPolicy="disabled"` (eski: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Bot-bot döngüleri">
    Varsayılan olarak bot tarafından yazılmış mesajlar yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız döngü davranışını önlemek için katı mention ve allowlist kuralları kullanın.
    Yalnızca botu mention eden bot mesajlarını kabul etmek için `channels.discord.allowBots="mentions"` tercih edin.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis, diğer botları yalnızca kendisini mention ettiklerinde dinler.
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

  <Accordion title="Ses STT, DecryptionFailed(...) ile düşüyor">

    - Discord ses alma kurtarma mantığının mevcut olması için OpenClaw'u güncel tutun (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` (varsayılan) olduğunu doğrulayın
    - `channels.discord.voice.decryptionFailureTolerance=24` (upstream varsayılanı) ile başlayın ve yalnızca gerekirse ayarlayın
    - günlüklerde şunları izleyin:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - otomatik yeniden katılmadan sonra hatalar devam ederse günlükleri toplayın ve [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) ile [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) içindeki upstream DAVE alma geçmişiyle karşılaştırın

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
- teslim: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- akış: `streaming` (eski alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medya/yeniden deneme: `mediaMaxMb` (giden Discord yüklemelerini sınırlar, varsayılan `100MB`), `retry`
- eylemler: `actions.*`
- varlık: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- özellikler: `threadBindings`, üst düzey `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Güvenlik ve operasyonlar

- Bot token'larını sır olarak ele alın (denetimli ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- En az ayrıcalıklı Discord izinleri verin.
- Komut dağıtımı/durumu eskiyse gateway'i yeniden başlatın ve `openclaw channels status --probe` ile yeniden kontrol edin.

## İlgili

<CardGroup cols={2}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bir Discord kullanıcısını gateway ile eşleştirin.
  </Card>
  <Card title="Gruplar" icon="users" href="/tr/channels/groups">
    Grup sohbeti ve allowlist davranışı.
  </Card>
  <Card title="Kanal yönlendirme" icon="route" href="/tr/channels/channel-routing">
    Gelen mesajları aracılara yönlendirin.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sağlamlaştırma.
  </Card>
  <Card title="Çok aracılı yönlendirme" icon="sitemap" href="/tr/concepts/multi-agent">
    Sunucuları ve kanalları aracılarla eşleyin.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı.
  </Card>
</CardGroup>
