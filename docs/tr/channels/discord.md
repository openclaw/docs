---
read_when:
    - Discord kanal özellikleri üzerinde çalışılıyor
summary: Discord bot desteği durumu, yetenekler ve yapılandırma
title: Discord
x-i18n:
    generated_at: "2026-04-26T11:22:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68f4e1885aab2438c38ef3735b752968b7e1ed70795d1c3903fad20ff183d3ca
    source_path: channels/discord.md
    workflow: 15
---

Resmi Discord gateway üzerinden Discord DM'leri ve sunucu kanalları için hazır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Discord DM'leri varsayılan olarak eşleştirme moduna geçer.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım akışı.
  </Card>
</CardGroup>

## Hızlı kurulum

Bot içeren yeni bir uygulama oluşturmanız, botu sunucunuza eklemeniz ve OpenClaw ile eşleştirmeniz gerekir. Botunuzu kendi özel sunucunuza eklemenizi öneririz. Henüz bir sunucunuz yoksa önce [bir tane oluşturun](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** seçin).

<Steps>
  <Step title="Bir Discord uygulaması ve bot oluşturun">
    [Discord Developer Portal](https://discord.com/developers/applications) adresine gidin ve **New Application** seçeneğine tıklayın. Buna "OpenClaw" gibi bir ad verin.

    Kenar çubuğunda **Bot** seçeneğine tıklayın. **Username** alanını OpenClaw agent'ınıza verdiğiniz ad olarak ayarlayın.

  </Step>

  <Step title="Ayrıcalıklı intent'leri etkinleştirin">
    Hâlâ **Bot** sayfasındayken aşağı kaydırarak **Privileged Gateway Intents** bölümüne gelin ve şunları etkinleştirin:

    - **Message Content Intent** (zorunlu)
    - **Server Members Intent** (önerilir; rol izin listeleri ve addan kimlik eşleme için gereklidir)
    - **Presence Intent** (isteğe bağlı; yalnızca presence güncellemeleri için gereklidir)

  </Step>

  <Step title="Bot token'ınızı kopyalayın">
    **Bot** sayfasında tekrar yukarı kaydırın ve **Reset Token** seçeneğine tıklayın.

    <Note>
    Ada rağmen, bu ilk token'ınızı oluşturur — hiçbir şey "sıfırlanmıyor."
    </Note>

    Token'ı kopyalayıp bir yere kaydedin. Bu sizin **Bot Token** değerinizi oluşturur ve birazdan buna ihtiyacınız olacak.

  </Step>

  <Step title="Bir davet URL'si oluşturun ve botu sunucunuza ekleyin">
    Kenar çubuğunda **OAuth2** seçeneğine tıklayın. Botu sunucunuza eklemek için doğru izinlere sahip bir davet URL'si oluşturacaksınız.

    Aşağı kaydırarak **OAuth2 URL Generator** bölümüne gidin ve şunları etkinleştirin:

    - `bot`
    - `applications.commands`

    Aşağıda bir **Bot Permissions** bölümü görünecektir. En azından şunları etkinleştirin:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (isteğe bağlı)

    Bu, normal metin kanalları için temel izindir. Forum veya medya kanalı iş akışlarında bir konu oluşturmayı ya da sürdürmeyi içeren Discord thread'lerinde paylaşım yapmayı planlıyorsanız **Send Messages in Threads** iznini de etkinleştirin.
    Altta oluşturulan URL'yi kopyalayın, tarayıcınıza yapıştırın, sunucunuzu seçin ve bağlamak için **Continue** seçeneğine tıklayın. Artık botunuzu Discord sunucusunda görmelisiniz.

  </Step>

  <Step title="Developer Mode'u etkinleştirin ve kimliklerinizi toplayın">
    Discord uygulamasına geri dönün; dahili kimlikleri kopyalayabilmek için Developer Mode'u etkinleştirmeniz gerekir.

    1. **User Settings** seçeneğine tıklayın (avatarınızın yanındaki dişli simgesi) → **Advanced** → **Developer Mode** seçeneğini açın
    2. Kenar çubuğunda **sunucu simgenize** sağ tıklayın → **Copy Server ID**
    3. **Kendi avatarınıza** sağ tıklayın → **Copy User ID**

    **Server ID** ve **User ID** değerlerinizi Bot Token ile birlikte kaydedin — sonraki adımda bu üçünü de OpenClaw'a göndereceksiniz.

  </Step>

  <Step title="Sunucu üyelerinden gelen DM'lere izin verin">
    Eşleştirmenin çalışması için Discord'un botunuzun size DM göndermesine izin vermesi gerekir. **Sunucu simgenize** sağ tıklayın → **Privacy Settings** → **Direct Messages** seçeneğini açın.

    Bu, sunucu üyelerinin (botlar dahil) size DM göndermesine izin verir. OpenClaw ile Discord DM'lerini kullanmak istiyorsanız bunu etkin bırakın. Yalnızca sunucu kanallarını kullanmayı planlıyorsanız eşleştirmeden sonra DM'leri devre dışı bırakabilirsiniz.

  </Step>

  <Step title="Bot token'ınızı güvenli şekilde ayarlayın (sohbette göndermeyin)">
    Discord bot token'ınız bir sırdır (parola gibi). Agent'ınıza mesaj göndermeden önce bunu OpenClaw çalışan makinede ayarlayın.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    OpenClaw zaten arka plan hizmeti olarak çalışıyorsa bunu OpenClaw Mac uygulaması üzerinden veya `openclaw gateway run` sürecini durdurup yeniden başlatarak yeniden başlatın.

  </Step>

  <Step title="OpenClaw'ı yapılandırın ve eşleştirin">

    <Tabs>
      <Tab title="Agent'ınıza sorun">
        Mevcut herhangi bir kanalda (örneğin Telegram) OpenClaw agent'ınızla sohbet edin ve bunu söyleyin. Discord ilk kanalınızsa bunun yerine CLI / config sekmesini kullanın.

        > "Discord bot token'ımı config içinde zaten ayarladım. Lütfen User ID `<user_id>` ve Server ID `<server_id>` ile Discord kurulumunu tamamla."
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

        Düz metin `token` değerleri desteklenir. `channels.discord.token` için env/file/exec sağlayıcıları genelinde SecretRef değerleri de desteklenir. Bkz. [Secrets Management](/tr/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="İlk DM eşleştirmesini onaylayın">
    Gateway çalışana kadar bekleyin, ardından Discord'da botunuza DM gönderin. Size bir eşleştirme koduyla yanıt verecektir.

    <Tabs>
      <Tab title="Agent'ınıza sorun">
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

    Artık agent'ınızla Discord'da DM üzerinden sohbet edebilmeniz gerekir.

  </Step>
</Steps>

<Note>
Token çözümleme hesap farkındalığına sahiptir. Config içindeki token değerleri env fallback'in önüne geçer. `DISCORD_BOT_TOKEN` yalnızca varsayılan hesap için kullanılır.
Gelişmiş giden çağrılar için (mesaj aracı/kanal eylemleri), çağrıya açıkça belirtilen bir `token` o çağrı için kullanılır. Bu, gönderme ve okuma/probe tarzı eylemler için geçerlidir (örneğin read/search/fetch/thread/pins/permissions). Hesap ilkesi/retry ayarları ise etkin çalışma zamanı anlık görüntüsünde seçili hesaptan gelmeye devam eder.
</Note>

## Önerilir: Bir sunucu çalışma alanı kurun

DM'ler çalıştıktan sonra Discord sunucunuzu tam bir çalışma alanı olarak kurabilirsiniz; burada her kanal kendi bağlamına sahip kendi agent oturumunu alır. Bu, yalnızca sizin ve botunuzun bulunduğu özel sunucular için önerilir.

<Steps>
  <Step title="Sunucunuzu sunucu izin listesine ekleyin">
    Bu, agent'ınızın yalnızca DM'lerde değil sunucunuzdaki herhangi bir kanalda yanıt vermesini sağlar.

    <Tabs>
      <Tab title="Agent'ınıza sorun">
        > "Discord Server ID `<server_id>` değerimi sunucu izin listesine ekle"
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

  <Step title="@mention olmadan yanıt verilmesine izin verin">
    Varsayılan olarak agent'ınız sunucu kanallarında yalnızca @mention yapıldığında yanıt verir. Özel bir sunucu için, büyük olasılıkla her mesaja yanıt vermesini istersiniz.

    <Tabs>
      <Tab title="Agent'ınıza sorun">
        > "Agent'ımın bu sunucuda @mention yapılmasına gerek kalmadan yanıt vermesine izin ver"
      </Tab>
      <Tab title="Config">
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

      </Tab>
    </Tabs>

  </Step>

  <Step title="Sunucu kanallarında bellek kullanımını planlayın">
    Varsayılan olarak uzun vadeli bellek (MEMORY.md) yalnızca DM oturumlarında yüklenir. Sunucu kanalları MEMORY.md dosyasını otomatik olarak yüklemez.

    <Tabs>
      <Tab title="Agent'ınıza sorun">
        > "Discord kanallarında soru sorduğumda, MEMORY.md içinden uzun vadeli bağlam gerekirse memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Manuel">
        Her kanalda paylaşılan bağlam gerekiyorsa kararlı yönergeleri `AGENTS.md` veya `USER.md` içine koyun (bunlar her oturum için enjekte edilir). Uzun vadeli notları `MEMORY.md` içinde tutun ve gerektiğinde memory araçlarıyla erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Şimdi Discord sunucunuzda birkaç kanal oluşturun ve sohbete başlayın. Agent'ınız kanal adını görebilir ve her kanal kendi yalıtılmış oturumunu alır — böylece `#coding`, `#home`, `#research` veya iş akışınıza uyan her neyse onu kurabilirsiniz.

## Çalışma zamanı modeli

- Gateway, Discord bağlantısının sahibidir.
- Yanıt yönlendirme deterministiktir: Discord'dan gelen içerik yeniden Discord'a yanıt verir.
- Discord sunucu/kanal metaverisi, kullanıcıya görünür bir yanıt öneki olarak değil, güvenilmeyen bağlam olarak model istemine eklenir. Bir model bu zarfı geri kopyalarsa OpenClaw, kopyalanan metaveriyi giden yanıtlardan ve gelecekteki yeniden oynatma bağlamından temizler.
- Varsayılan olarak (`session.dmScope=main`) doğrudan sohbetler agent ana oturumunu paylaşır (`agent:main:main`).
- Sunucu kanalları yalıtılmış oturum anahtarlarıdır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM'leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel slash komutları, yönlendirilen konuşma oturumuna `CommandTargetSessionKey` taşımaya devam ederken yalıtılmış komut oturumlarında çalışır (`agent:<agentId>:discord:slash:<userId>`).
- Metin tabanlı Cron/Heartbeat duyuru teslimi Discord'a yalnızca son, assistant görünür yanıtı bir kez gönderir. Agent birden fazla teslim edilebilir yük yaydığında medya ve yapılandırılmış bileşen yükleri çoklu mesaj olarak kalır.

## Forum kanalları

Discord forum ve medya kanalları yalnızca thread gönderilerini kabul eder. OpenClaw bunları oluşturmak için iki yolu destekler:

- Bir thread'i otomatik oluşturmak için forum üst öğesine (`channel:<forumId>`) mesaj gönderin. Thread başlığı, mesajınızın ilk boş olmayan satırını kullanır.
- Bir thread'i doğrudan oluşturmak için `openclaw message thread create` kullanın. Forum kanalları için `--message-id` geçirmeyin.

Örnek: bir thread oluşturmak için forum üst öğesine gönderin

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

OpenClaw, agent mesajları için Discord components v2 container desteği sunar. `components` payload'u ile mesaj aracını kullanın. Etkileşim sonuçları normal gelen mesajlar olarak yeniden agent'a yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Eylem satırları en fazla 5 düğmeye veya tek bir seçim menüsüne izin verir
- Seçim türleri: `string`, `user`, `role`, `mentionable`, `channel`

Varsayılan olarak bileşenler tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süreleri dolana kadar birden fazla kez kullanılabilmesi için `components.reusable=true` ayarlayın.

Bir düğmeye kimlerin tıklayabileceğini kısıtlamak için o düğmede `allowedUsers` ayarlayın (Discord kullanıcı kimlikleri, etiketler veya `*`). Yapılandırıldığında, eşleşmeyen kullanıcılar geçici bir ret yanıtı alır.

`/model` ve `/models` slash komutları; sağlayıcı, model ve uyumlu çalışma zamanı açılır menülerinin yanı sıra bir Submit adımı içeren etkileşimli bir model seçici açar. `/models add` artık kullanımdan kaldırılmıştır ve sohbetten model kaydetmek yerine artık bir kullanım dışı bırakma mesajı döndürür. Seçici yanıtı ephemeral'dır ve bunu yalnızca komutu çağıran kullanıcı kullanabilir.

Dosya ekleri:

- `file` blokları bir ek başvurusuna işaret etmelidir (`attachment://<filename>`)
- Eki `media`/`path`/`filePath` üzerinden sağlayın (tek dosya); birden çok dosya için `media-gallery` kullanın
- Yükleme adı ek başvurusuyla eşleşecekse yükleme adını geçersiz kılmak için `filename` kullanın

Modal formlar:

- En fazla 5 alan ile `components.modal` ekleyin
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
    `channels.discord.dmPolicy`, DM erişimini kontrol eder (eski: `channels.discord.dm.policy`):

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` içinde `"*"` bulunmasını gerektirir; eski: `channels.discord.dm.allowFrom`)
    - `disabled`

    DM ilkesi open değilse bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme için yönlendirilir).

    Çok hesaplı öncelik sırası:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesabı için geçerlidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` ayarları yapılmamışsa `channels.discord.allowFrom` ayarını devralır.
    - Adlandırılmış hesaplar `channels.discord.accounts.default.allowFrom` ayarını devralmaz.

    Teslimat için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` mention

    Düz sayısal kimlikler belirsizdir ve açık bir user/channel hedef türü belirtilmedikçe reddedilir.

  </Tab>

  <Tab title="Sunucu ilkesi">
    Sunucu işleme davranışı `channels.discord.groupPolicy` tarafından kontrol edilir:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` mevcut olduğunda güvenli temel ayar `allowlist` olur.

    `allowlist` davranışı:

    - sunucu `channels.discord.guilds` ile eşleşmelidir (`id` tercih edilir, slug kabul edilir)
    - isteğe bağlı gönderici izin listeleri: `users` (kararlı kimlikler önerilir) ve `roles` (yalnızca rol kimlikleri); bunlardan biri yapılandırılmışsa göndericiler `users` VEYA `roles` ile eşleştiğinde izin alır
    - doğrudan ad/etiket eşleme varsayılan olarak devre dışıdır; bunu yalnızca acil uyumluluk modu olarak `channels.discord.dangerouslyAllowNameMatching: true` ile etkinleştirin
    - `users` için adlar/etiketler desteklenir, ancak kimlikler daha güvenlidir; ad/etiket girdileri kullanıldığında `openclaw security audit` uyarı verir
    - bir sunucuda `channels` yapılandırılmışsa listelenmeyen kanallar reddedilir
    - bir sunucuda `channels` bloğu yoksa izin listesindeki o sunucudaki tüm kanallara izin verilir

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

    Yalnızca `DISCORD_BOT_TOKEN` ayarlarsanız ve `channels.discord` bloğu oluşturmazsanız çalışma zamanı fallback değeri `groupPolicy="allowlist"` olur (günlüklerde bir uyarıyla), `channels.defaults.groupPolicy` değeri `open` olsa bile.

  </Tab>

  <Tab title="Mention'lar ve grup DM'leri">
    Sunucu mesajları varsayılan olarak mention ile kapılanır.

    Mention algılama şunları içerir:

    - açık bot mention'ı
    - yapılandırılmış mention kalıpları (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda örtük reply-to-bot davranışı

    `requireMention` her sunucu/kanal için yapılandırılır (`channels.discord.guilds...`).
    `ignoreOtherMentions`, başka bir kullanıcıdan/rolden mention alan ama bottan mention almayan mesajları isteğe bağlı olarak düşürür (@everyone/@here hariç).

    Grup DM'leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - isteğe bağlı izin listesi: `dm.groupChannels` (kanal kimlikleri veya slug'lar)

  </Tab>
</Tabs>

### Role dayalı agent yönlendirme

Discord sunucu üyelerini rol kimliğine göre farklı agent'lara yönlendirmek için `bindings[].match.roles` kullanın. Role dayalı bağlamalar yalnızca rol kimliklerini kabul eder ve peer veya parent-peer bağlamalarından sonra, yalnızca sunucu bağlamalarından önce değerlendirilir. Bir bağlama başka eşleşme alanları da ayarlıyorsa (örneğin `peer` + `guildId` + `roles`), yapılandırılan tüm alanların eşleşmesi gerekir.

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

- `commands.native` varsayılan olarak `"auto"` olur ve Discord için etkindir.
- Kanal başına geçersiz kılma: `channels.discord.commands.native`.
- `commands.native=false`, daha önce kaydedilmiş Discord yerel komutlarını açıkça temizler.
- Yerel komut kimlik doğrulaması, normal mesaj işleme ile aynı Discord izin listelerini/ilkelerini kullanır.
- Yetkili olmayan kullanıcılar için komutlar Discord arayüzünde yine de görünür olabilir; yürütme yine de OpenClaw kimlik doğrulamasını uygular ve "not authorized" döndürür.

Komut kataloğu ve davranış için bkz. [Slash commands](/tr/tools/slash-commands).

Varsayılan slash komutu ayarları:

- `ephemeral: true`

## Özellik ayrıntıları

<AccordionGroup>
  <Accordion title="Yanıt etiketleri ve yerel yanıtlar">
    Discord, agent çıktısında yanıt etiketlerini destekler:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` tarafından kontrol edilir:

    - `off` (varsayılan)
    - `first`
    - `all`
    - `batched`

    Not: `off`, örtük yanıt ileti dizisini devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.
    `first`, tur için ilk giden Discord mesajına örtük yerel yanıt başvurusunu her zaman ekler.
    `batched`, Discord'un örtük yerel yanıt başvurusunu yalnızca gelen turun çoklu mesajlardan oluşan debounce edilmiş bir toplu iş olması durumunda ekler. Bu, yerel yanıtları her tek mesajlık turda değil, daha çok belirsiz ve patlamalı sohbetlerde kullanmak istediğinizde yararlıdır.

    Agent'ların belirli mesajları hedefleyebilmesi için mesaj kimlikleri bağlamda/geçmişte gösterilir.

  </Accordion>

  <Accordion title="Canlı akış önizlemesi">
    OpenClaw, geçici bir mesaj gönderip metin geldikçe onu düzenleyerek taslak yanıtları akış halinde iletebilir. `channels.discord.streaming`, `off` (varsayılan) | `partial` | `block` | `progress` değerlerini alır. `progress`, Discord'da `partial` olarak eşlenir; `streamMode` eski bir takma addır ve otomatik olarak taşınır.

    Varsayılan `off` olarak kalır çünkü birden çok bot veya gateway bir hesabı paylaştığında Discord önizleme düzenlemeleri hız sınırlarına hızla takılır.

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
    - `block`, taslak boyutunda parçalar yayar (boyut ve kırılma noktalarını ayarlamak için `draftChunk` kullanın, `textChunkLimit` ile sınırlandırılır).
    - Medya, hata ve açık-yanıt finalleri bekleyen önizleme düzenlemelerini iptal eder.
    - `streaming.preview.toolProgress` (varsayılan `true`), tool/ilerleme güncellemelerinin önizleme mesajını yeniden kullanıp kullanmayacağını kontrol eder.

    Önizleme akışı yalnızca metin içindir; medya yanıtları normal teslimata fallback yapar. `block` akışı açıkça etkinleştirildiğinde OpenClaw, çift akışı önlemek için önizleme akışını atlar.

  </Accordion>

  <Accordion title="Geçmiş, bağlam ve thread davranışı">
    Sunucu geçmişi bağlamı:

    - `channels.discord.historyLimit` varsayılan `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    DM geçmişi denetimleri:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread davranışı:

    - Discord thread'leri kanal oturumları olarak yönlendirilir ve geçersiz kılınmadığı sürece üst kanal yapılandırmasını devralır.
    - `channels.discord.thread.inheritParent` (varsayılan `false`), yeni otomatik thread'lerin üst transkriptten tohumlanmasını seçmeli olarak etkinleştirir. Hesap başına geçersiz kılmalar `channels.discord.accounts.<id>.thread.inheritParent` altında yer alır.
    - Mesaj aracı tepkileri `user:<id>` DM hedeflerini çözebilir.
    - `guilds.<guild>.channels.<channel>.requireMention: false`, yanıt aşaması etkinleştirme fallback'i sırasında korunur.

    Kanal konuları **untrusted** bağlam olarak enjekte edilir. İzin listeleri, agent'ı kimin tetikleyebileceğini kapılar; bu, tam bir ek bağlam redaksiyon sınırı değildir.

  </Accordion>

  <Accordion title="Alt agent'lar için thread'e bağlı oturumlar">
    Discord, bir thread'i bir oturum hedefine bağlayabilir; böylece o thread'deki takip mesajları aynı oturuma yönlendirilmeye devam eder (alt agent oturumları dahil).

    Komutlar:

    - `/focus <target>` geçerli/yeni thread'i bir subagent/oturum hedefine bağlar
    - `/unfocus` geçerli thread bağını kaldırır
    - `/agents` etkin çalışmaları ve bağlama durumunu gösterir
    - `/session idle <duration|off>` odaklı bağlamalar için hareketsizlik nedeniyle otomatik odak kaldırmayı inceler/günceller
    - `/session max-age <duration|off>` odaklı bağlamalar için kesin maksimum yaşı inceler/günceller

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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Notlar:

    - `session.threadBindings.*` genel varsayılanları ayarlar.
    - `channels.discord.threadBindings.*`, Discord davranışını geçersiz kılar.
    - `sessions_spawn({ thread: true })` için thread'leri otomatik oluşturup bağlamak üzere `spawnSubagentSessions` değeri true olmalıdır.
    - ACP için (`/acp spawn ... --thread ...` veya `sessions_spawn({ runtime: "acp", thread: true })`) thread'leri otomatik oluşturup bağlamak üzere `spawnAcpSessions` değeri true olmalıdır.
    - Bir hesap için thread bağlamaları devre dışıysa `/focus` ve ilgili thread bağlama işlemleri kullanılamaz.

    Bkz. [Sub-agents](/tr/tools/subagents), [ACP Agents](/tr/tools/acp-agents) ve [Configuration Reference](/tr/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Kalıcı ACP kanal bağlamaları">
    Kararlı, "her zaman açık" ACP çalışma alanları için Discord konuşmalarını hedefleyen üst düzey türlenmiş ACP bağlamaları yapılandırın.

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

    - `/acp spawn codex --bind here`, geçerli kanal veya thread'i yerinde bağlar ve gelecekteki mesajları aynı ACP oturumunda tutar. Thread mesajları üst kanal bağlamasını devralır.
    - Bağlı bir kanal veya thread içinde `/new` ve `/reset`, aynı ACP oturumunu yerinde sıfırlar. Geçici thread bağlamaları etkin oldukları sürece hedef çözümlemesini geçersiz kılabilir.
    - `spawnAcpSessions` yalnızca OpenClaw'ın `--thread auto|here` üzerinden bir alt thread oluşturup bağlaması gerektiğinde zorunludur.

    Bağlama davranışı ayrıntıları için bkz. [ACP Agents](/tr/tools/acp-agents).

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
    - agent kimliği emoji fallback'i (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Discord, unicode emoji veya özel emoji adlarını kabul eder.
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Config yazımları">
    Kanal tarafından başlatılan config yazımları varsayılan olarak etkindir.

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
    Discord gateway WebSocket trafiğini ve başlangıç REST aramalarını (uygulama kimliği + allowlist çözümlemesi) `channels.discord.proxy` ile bir HTTP(S) proxy üzerinden yönlendirin.

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
    Proxy'lenmiş mesajları sistem üyesi kimliğine eşlemek için PluralKit çözümlemesini etkinleştirin:

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

    - allowlist'ler `pk:<memberId>` kullanabilir
    - üye görünen adları, yalnızca `channels.discord.dangerouslyAllowNameMatching: true` olduğunda ad/slug ile eşleştirilir
    - aramalar özgün mesaj kimliğini kullanır ve zaman penceresiyle sınırlandırılır
    - arama başarısız olursa proxy'lenmiş mesajlar bot mesajı olarak değerlendirilir ve `allowBots=true` değilse düşürülür

  </Accordion>

  <Accordion title="Presence yapılandırması">
    Bir durum veya etkinlik alanı ayarladığınızda ya da otomatik presence'i etkinleştirdiğinizde presence güncellemeleri uygulanır.

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
      activity: "Odak zamanı",
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
      activity: "Canlı kodlama",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Etkinlik türü eşlemesi:

    - 0: Playing
    - 1: Streaming (`activityUrl` gerektirir)
    - 2: Listening
    - 3: Watching
    - 4: Custom (etkinlik metnini durum durumu olarak kullanır; emoji isteğe bağlıdır)
    - 5: Competing

    Otomatik presence örneği (çalışma zamanı sağlık sinyali):

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

    Otomatik presence, çalışma zamanı kullanılabilirliğini Discord durumuna eşler: sağlıklı => online, bozulmuş veya bilinmiyor => idle, tükenmiş veya kullanılamıyor => dnd. İsteğe bağlı metin geçersiz kılmaları:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` yer tutucusunu destekler)

  </Accordion>

  <Accordion title="Discord'da onaylar">
    Discord, DM'lerde düğme tabanlı onay işleme desteği sunar ve isteğe bağlı olarak onay istemlerini kaynak kanalda yayınlayabilir.

    Config yolu:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine fallback yapar)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    `enabled` ayarlanmamışsa veya `"auto"` ise ve en az bir approver çözümlenebiliyorsa Discord yerel exec onaylarını otomatik etkinleştirir; bu çözümleme `execApprovals.approvers` veya `commands.ownerAllowFrom` üzerinden olabilir. Discord, exec approver'ları kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan mesaj `defaultTo` üzerinden çıkarmaz. Discord'u yerel bir onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `target`, `channel` veya `both` olduğunda onay istemi kanalda görünür. Düğmeleri yalnızca çözümlenen approver'lar kullanabilir; diğer kullanıcılar ephemeral bir ret alır. Onay istemleri komut metnini içerir, bu nedenle kanal teslimini yalnızca güvenilen kanallarda etkinleştirin. Kanal kimliği oturum anahtarından türetilemezse OpenClaw, DM teslimine fallback yapar.

    Discord ayrıca diğer sohbet kanallarında kullanılan paylaşılan onay düğmelerini de render eder. Yerel Discord bağdaştırıcısı esas olarak approver DM yönlendirmesi ve kanal fanout ekler.
    Bu düğmeler mevcut olduğunda birincil onay UX'i bunlar olur; OpenClaw yalnızca tool sonucu sohbet onaylarının kullanılamadığını söylüyorsa veya tek yol manuel onaysa manuel `/approve` komutunu eklemelidir.

    Gateway kimlik doğrulaması ve onay çözümlemesi, paylaşılan Gateway istemci sözleşmesini izler (`plugin:` kimlikleri `plugin.approval.resolve` üzerinden, diğer kimlikler `exec.approval.resolve` üzerinden çözülür). Onayların süresi varsayılan olarak 30 dakika sonra dolar.

    Bkz. [Exec approvals](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Tools ve eylem kapıları

Discord mesaj eylemleri; mesajlaşma, kanal yönetimi, moderasyon, presence ve metadata eylemlerini içerir.

Temel örnekler:

- mesajlaşma: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- tepkiler: `react`, `reactions`, `emojiList`
- moderasyon: `timeout`, `kick`, `ban`
- presence: `setPresence`

`event-create` eylemi, planlanmış etkinlik kapak görselini ayarlamak için isteğe bağlı bir `image` parametresini (URL veya yerel dosya yolu) kabul eder.

Eylem kapıları `channels.discord.actions.*` altında bulunur.

Varsayılan kapı davranışı:

| Eylem grubu                                                                                                                                                              | Varsayılan |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | etkin      |
| roles                                                                                                                                                                    | devre dışı |
| moderation                                                                                                                                                               | devre dışı |
| presence                                                                                                                                                                 | devre dışı |

## Components v2 UI

OpenClaw, exec onayları ve bağlamlar arası işaretçiler için Discord components v2 kullanır. Discord mesaj eylemleri özel UI için `components` da kabul edebilir (ileri düzey; discord tool üzerinden bir bileşen payload'u oluşturmayı gerektirir), ancak eski `embeds` hâlâ kullanılabilir olsa da önerilmez.

- `channels.discord.ui.components.accentColor`, Discord bileşen kapsayıcıları tarafından kullanılan vurgu rengini ayarlar (hex).
- Hesap başına ayarlamak için `channels.discord.accounts.<id>.ui.components.accentColor` kullanın.
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

Discord'un iki ayrı ses yüzeyi vardır: gerçek zamanlı **ses kanalları** (sürekli konuşmalar) ve **sesli mesaj ekleri** (dalga biçimi önizleme biçimi). Gateway her ikisini de destekler.

### Ses kanalları

Kurulum denetim listesi:

1. Discord Developer Portal içinde Message Content Intent'i etkinleştirin.
2. Rol/kullanıcı allowlist'leri kullanıldığında Server Members Intent'i etkinleştirin.
3. Botu `bot` ve `applications.commands` kapsamlarıyla davet edin.
4. Hedef ses kanalında Connect, Speak, Send Messages ve Read Message History izinlerini verin.
5. Yerel komutları etkinleştirin (`commands.native` veya `channels.discord.commands.native`).
6. `channels.discord.voice` yapılandırmasını yapın.

Oturumları denetlemek için `/vc join|leave|status` kullanın. Komut, hesabın varsayılan agent'ını kullanır ve diğer Discord komutlarıyla aynı allowlist ve grup ilkesi kurallarını izler.

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
- `voice.model`, yalnızca Discord ses kanalı yanıtları için kullanılan LLM'i geçersiz kılar. Yönlendirilen agent modelini devralmak için bunu ayarlamadan bırakın.
- STT, `tools.media.audio` kullanır; `voice.model` transkripsiyonu etkilemez.
- Ses transkript turları sahip durumunu Discord `allowFrom` (veya `dm.allowFrom`) üzerinden türetir; sahip olmayan konuşmacılar yalnızca sahibe özel tool'lara erişemez (örneğin `gateway` ve `cron`).
- Ses varsayılan olarak etkindir; devre dışı bırakmak için `channels.discord.voice.enabled=false` ayarlayın.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` join seçeneklerine aynen geçirilir.
- Ayarlanmamışsa `@discordjs/voice` varsayılanları `daveEncryption=true` ve `decryptionFailureTolerance=24` olur.
- OpenClaw ayrıca alma tarafı çözme hatalarını izler ve kısa bir zaman penceresinde tekrarlanan hatalardan sonra ses kanalından ayrılıp yeniden katılarak otomatik kurtarma uygular.
- Güncellemeden sonra alma günlüklerinde tekrar tekrar `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` görünüyorsa bir bağımlılık raporu ve günlükler toplayın. Paketlenmiş `@discordjs/voice` satırı, discord.js PR #11449 içindeki upstream padding düzeltmesini içerir; bu düzeltme discord.js issue #11419'u kapatmıştır.

Ses kanalı işlem hattı:

- Discord PCM yakalama, geçici bir WAV dosyasına dönüştürülür.
- `tools.media.audio`, STT'yi işler; örneğin `openai/gpt-4o-mini-transcribe`.
- Transkript, normal Discord giriş ve yönlendirme akışı üzerinden gönderilir.
- `voice.model`, ayarlandığında yalnızca bu ses kanalı turu için yanıt LLM'ini geçersiz kılar.
- `voice.tts`, `messages.tts` üzerine birleştirilir; ortaya çıkan ses katılınan kanalda oynatılır.

Kimlik bilgileri bileşen başına çözülür: `voice.model` için LLM rota kimlik doğrulaması, `tools.media.audio` için STT kimlik doğrulaması ve `messages.tts`/`voice.tts` için TTS kimlik doğrulaması.

### Sesli mesajlar

Discord sesli mesajları bir dalga biçimi önizlemesi gösterir ve OGG/Opus ses gerektirir. OpenClaw dalga biçimini otomatik olarak üretir, ancak inceleme ve dönüştürme için gateway sunucusunda `ffmpeg` ve `ffprobe` bulunmalıdır.

- Bir **yerel dosya yolu** sağlayın (URL'ler reddedilir).
- Metin içeriğini atlayın (Discord aynı payload içinde metin + sesli mesajı reddeder).
- Herhangi bir ses biçimi kabul edilir; OpenClaw gerektiğinde OGG/Opus'a dönüştürür.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="İzin verilmeyen intent'ler kullanıldı veya bot sunucu mesajlarını görmüyor">

    - Message Content Intent'i etkinleştirin
    - kullanıcı/üye çözümlemesine bağlıysanız Server Members Intent'i etkinleştirin
    - intent'leri değiştirdikten sonra gateway'i yeniden başlatın

  </Accordion>

  <Accordion title="Sunucu mesajları beklenmedik şekilde engelleniyor">

    - `groupPolicy` ayarını doğrulayın
    - `channels.discord.guilds` altındaki sunucu izin listesini doğrulayın
    - sunucu `channels` eşlemesi varsa yalnızca listelenen kanallara izin verilir
    - `requireMention` davranışını ve mention kalıplarını doğrulayın

    Yararlı denetimler:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Mention zorunluluğu false ama yine de engelleniyor">
    Yaygın nedenler:

    - eşleşen sunucu/kanal izin listesi olmadan `groupPolicy="allowlist"`
    - `requireMention` yanlış yerde yapılandırılmış (mutlaka `channels.discord.guilds` veya kanal girdisi altında olmalıdır)
    - gönderici, sunucu/kanal `users` izin listesi tarafından engelleniyor

  </Accordion>

  <Accordion title="Uzun süren işleyiciler zaman aşımına uğruyor veya yinelenen yanıtlar oluşuyor">

    Tipik günlükler:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Listener bütçesi ayarı:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çok hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Worker çalışma zaman aşımı ayarı:

    - tek hesap: `channels.discord.inboundWorker.runTimeoutMs`
    - çok hesap: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - varsayılan: `1800000` (30 dakika); devre dışı bırakmak için `0` ayarlayın

    Önerilen temel yapılandırma:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Yavaş listener kurulumu için `eventQueue.listenerTimeout`, kuyruktaki agent turları için ayrı bir güvenlik valfi istiyorsanız yalnızca `inboundWorker.runTimeoutMs` kullanın.

  </Accordion>

  <Accordion title="İzin denetimi uyumsuzlukları">
    `channels status --probe` izin denetimleri yalnızca sayısal kanal kimlikleri için çalışır.

    Slug anahtarları kullanıyorsanız çalışma zamanı eşleştirmesi yine de çalışabilir, ancak probe izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM ve eşleştirme sorunları">

    - DM devre dışı: `channels.discord.dm.enabled=false`
    - DM ilkesi devre dışı: `channels.discord.dmPolicy="disabled"` (eski: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Botlar arası döngüler">
    Varsayılan olarak bot tarafından yazılan mesajlar yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız döngü davranışını önlemek için katı mention ve allowlist kuralları kullanın.
    Yalnızca bottan mention alan bot mesajlarını kabul etmek için `channels.discord.allowBots="mentions"` tercih edin.

  </Accordion>

  <Accordion title="Ses STT, DecryptionFailed(...) ile düşüyor">

    - Discord ses alma kurtarma mantığının mevcut olması için OpenClaw'ı güncel tutun (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` olduğunu doğrulayın (varsayılan)
    - `channels.discord.voice.decryptionFailureTolerance=24` (upstream varsayılanı) ile başlayın ve yalnızca gerekirse ayarlayın
    - günlüklerde şunları izleyin:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - otomatik yeniden katılmadan sonra hatalar sürerse günlükleri toplayın ve upstream DAVE alma geçmişiyle karşılaştırın: [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) ve [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Yapılandırma referansı

Birincil referans: [Yapılandırma referansı - Discord](/tr/gateway/config-channels#discord).

<Accordion title="Yüksek sinyalli Discord alanları">

- başlangıç/kimlik doğrulama: `enabled`, `token`, `accounts.*`, `allowBots`
- ilke: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- komut: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- olay kuyruğu: `eventQueue.listenerTimeout` (listener bütçesi), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- yanıt/geçmiş: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- teslimat: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- akış: `streaming` (eski takma ad: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medya/retry: `mediaMaxMb` (giden Discord yüklemelerini sınırlar, varsayılan `100MB`), `retry`
- eylemler: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- özellikler: `threadBindings`, üst düzey `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Güvenlik ve işlemler

- Bot token'larını sır olarak değerlendirin (denetimli ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- En az ayrıcalık ilkesine göre Discord izinleri verin.
- Komut dağıtımı/durumu bayatsa gateway'i yeniden başlatın ve `openclaw channels status --probe` ile yeniden kontrol edin.

## İlgili

<CardGroup cols={2}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bir Discord kullanıcısını gateway ile eşleştirin.
  </Card>
  <Card title="Gruplar" icon="users" href="/tr/channels/groups">
    Grup sohbeti ve allowlist davranışı.
  </Card>
  <Card title="Kanal yönlendirme" icon="route" href="/tr/channels/channel-routing">
    Gelen mesajları agent'lara yönlendirin.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sertleştirme.
  </Card>
  <Card title="Çoklu agent yönlendirme" icon="sitemap" href="/tr/concepts/multi-agent">
    Sunucuları ve kanalları agent'lara eşleyin.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı.
  </Card>
</CardGroup>
