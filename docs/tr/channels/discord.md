---
read_when:
    - Discord kanal özellikleri üzerinde çalışırken
summary: Discord bot desteği durumu, yetenekleri ve yapılandırması
title: Discord
x-i18n:
    generated_at: "2026-04-05T13:47:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: e757d321d80d05642cd9e24b51fb47897bacaf8db19df83bd61a49a8ce51ed3a
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Durum: resmi Discord ağ geçidi üzerinden DM'ler ve sunucu kanalları için hazır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Discord DM'leri varsayılan olarak eşleştirme modundadır.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/channels/troubleshooting">
    Kanallar arası tanılama ve onarım akışı.
  </Card>
</CardGroup>

## Hızlı kurulum

Bot içeren yeni bir uygulama oluşturmanız, botu sunucunuza eklemeniz ve OpenClaw ile eşleştirmeniz gerekir. Botunuzu kendi özel sunucunuza eklemenizi öneririz. Henüz bir sunucunuz yoksa önce [bir tane oluşturun](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** seçin).

<Steps>
  <Step title="Bir Discord uygulaması ve botu oluşturun">
    [Discord Developer Portal](https://discord.com/developers/applications) adresine gidin ve **New Application** seçeneğine tıklayın. Buna "OpenClaw" gibi bir ad verin.

    Kenar çubuğunda **Bot** seçeneğine tıklayın. **Username** alanını OpenClaw aracınıza verdiğiniz adla ayarlayın.

  </Step>

  <Step title="Ayrıcalıklı intent'leri etkinleştirin">
    Hâlâ **Bot** sayfasındayken, aşağı kaydırıp **Privileged Gateway Intents** bölümünde şunları etkinleştirin:

    - **Message Content Intent** (gerekli)
    - **Server Members Intent** (önerilir; rol izin listeleri ve ad-ID eşleştirmesi için gereklidir)
    - **Presence Intent** (isteğe bağlı; yalnızca presence güncellemeleri için gereklidir)

  </Step>

  <Step title="Bot token'ınızı kopyalayın">
    **Bot** sayfasında tekrar yukarı kaydırın ve **Reset Token** seçeneğine tıklayın.

    <Note>
    Adına rağmen bu işlem ilk token'ınızı oluşturur — hiçbir şey "sıfırlanmıyor."
    </Note>

    Token'ı kopyalayın ve bir yere kaydedin. Bu sizin **Bot Token**'ınızdır ve birazdan buna ihtiyacınız olacak.

  </Step>

  <Step title="Bir davet URL'si oluşturun ve botu sunucunuza ekleyin">
    Kenar çubuğunda **OAuth2** seçeneğine tıklayın. Botu sunucunuza eklemek için doğru izinlere sahip bir davet URL'si oluşturacaksınız.

    Aşağı kaydırıp **OAuth2 URL Generator** bölümünde şunları etkinleştirin:

    - `bot`
    - `applications.commands`

    Aşağıda bir **Bot Permissions** bölümü görünecektir. Şunları etkinleştirin:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (isteğe bağlı)

    Alttaki oluşturulan URL'yi kopyalayın, tarayıcınıza yapıştırın, sunucunuzu seçin ve bağlanmak için **Continue** seçeneğine tıklayın. Artık botunuzu Discord sunucusunda görmelisiniz.

  </Step>

  <Step title="Developer Mode'u etkinleştirin ve ID'lerinizi toplayın">
    Discord uygulamasında tekrar, dahili ID'leri kopyalayabilmek için Developer Mode'u etkinleştirmeniz gerekir.

    1. **User Settings** (avatarınızın yanındaki dişli simgesi) → **Advanced** → **Developer Mode** seçeneğini açın
    2. Kenar çubuğunda **sunucu simgenize** sağ tıklayın → **Copy Server ID**
    3. **Kendi avatarınıza** sağ tıklayın → **Copy User ID**

    **Server ID** ve **User ID** değerlerinizi Bot Token'ınızla birlikte kaydedin — sonraki adımda üçünü de OpenClaw'a göndereceksiniz.

  </Step>

  <Step title="Sunucu üyelerinden gelen DM'lere izin verin">
    Eşleştirmenin çalışması için Discord'un botunuzun size DM göndermesine izin vermesi gerekir. **Sunucu simgenize** sağ tıklayın → **Privacy Settings** → **Direct Messages** seçeneğini açın.

    Bu, sunucu üyelerinin (botlar dahil) size DM göndermesine olanak tanır. OpenClaw ile Discord DM'lerini kullanmak istiyorsanız bunu açık tutun. Yalnızca sunucu kanallarını kullanmayı planlıyorsanız, eşleştirmeden sonra DM'leri kapatabilirsiniz.

  </Step>

  <Step title="Bot token'ınızı güvenli şekilde ayarlayın (sohbette göndermeyin)">
    Discord bot token'ınız bir gizli bilgidir (parola gibi). Aracınıza mesaj göndermeden önce bunu OpenClaw çalıştıran makinede ayarlayın.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    OpenClaw zaten bir arka plan hizmeti olarak çalışıyorsa, bunu OpenClaw Mac uygulaması üzerinden veya `openclaw gateway run` sürecini durdurup yeniden başlatarak yeniden başlatın.

  </Step>

  <Step title="OpenClaw'ı yapılandırın ve eşleştirin">

    <Tabs>
      <Tab title="Aracınıza sorun">
        Mevcut herhangi bir kanalda (ör. Telegram) OpenClaw aracınızla sohbet edin ve ona söyleyin. Discord ilk kanalınızsa bunun yerine CLI / yapılandırma sekmesini kullanın.

        > "Discord bot token'ımı zaten yapılandırmada ayarladım. Lütfen User ID `<user_id>` ve Server ID `<server_id>` ile Discord kurulumunu tamamla."
      </Tab>
      <Tab title="CLI / yapılandırma">
        Dosya tabanlı yapılandırmayı tercih ediyorsanız, şunu ayarlayın:

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

        Düz metin `token` değerleri desteklenir. SecretRef değerleri de env/file/exec sağlayıcıları genelinde `channels.discord.token` için desteklenir. Bkz. [Secrets Management](/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="İlk DM eşleştirmesini onaylayın">
    Ağ geçidi çalışana kadar bekleyin, ardından Discord'da botunuza DM gönderin. Size bir eşleştirme koduyla yanıt verecektir.

    <Tabs>
      <Tab title="Aracınıza sorun">
        Eşleştirme kodunu mevcut kanalınızdaki aracınıza gönderin:

        > "Bu Discord eşleştirme kodunu onayla: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Eşleştirme kodlarının süresi 1 saat sonra dolur.

    Artık Discord'da aracınızla DM üzerinden sohbet edebilmelisiniz.

  </Step>
</Steps>

<Note>
Token çözümlemesi hesap farkındalıklıdır. Yapılandırmadaki token değerleri env fallback'e göre önceliklidir. `DISCORD_BOT_TOKEN` yalnızca varsayılan hesap için kullanılır.
Gelişmiş giden çağrılar için (mesaj aracı/kanal eylemleri), çağrı başına açık bir `token` o çağrı için kullanılır. Bu, gönderme ve okuma/probe tarzı eylemler için geçerlidir (örneğin read/search/fetch/thread/pins/permissions). Hesap ilkesi/yeniden deneme ayarları yine etkin çalışma zamanı anlık görüntüsündeki seçili hesaptan gelir.
</Note>

## Önerilen: Bir sunucu çalışma alanı kurun

DM'ler çalıştıktan sonra, Discord sunucunuzu her kanalın kendi bağlamına sahip kendi aracı oturumunu aldığı tam bir çalışma alanı olarak ayarlayabilirsiniz. Bu, yalnızca sizin ve botunuzun bulunduğu özel sunucular için önerilir.

<Steps>
  <Step title="Sunucunuzu sunucu izin listesine ekleyin">
    Bu, aracınızın yalnızca DM'lerde değil, sunucunuzdaki herhangi bir kanalda yanıt vermesini sağlar.

    <Tabs>
      <Tab title="Aracınıza sorun">
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

  <Step title="@mention olmadan yanıt verilmesine izin verin">
    Varsayılan olarak aracınız, sunucu kanallarında yalnızca @mention yapıldığında yanıt verir. Özel bir sunucu için muhtemelen her mesaja yanıt vermesini istersiniz.

    <Tabs>
      <Tab title="Aracınıza sorun">
        > "Aracımın bu sunucuda @mention yapılmasına gerek kalmadan yanıt vermesine izin ver"
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

      </Tab>
    </Tabs>

  </Step>

  <Step title="Sunucu kanallarında bellek kullanımını planlayın">
    Varsayılan olarak uzun süreli bellek (MEMORY.md) yalnızca DM oturumlarında yüklenir. Sunucu kanalları MEMORY.md dosyasını otomatik yüklemez.

    <Tabs>
      <Tab title="Aracınıza sorun">
        > "Discord kanallarında soru sorduğumda, MEMORY.md içindeki uzun süreli bağlama ihtiyacın olursa memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Elle">
        Her kanalda paylaşılan bağlama ihtiyacınız varsa sabit yönergeleri `AGENTS.md` veya `USER.md` içine koyun (bunlar her oturum için enjekte edilir). Uzun süreli notları `MEMORY.md` içinde tutun ve bellek araçlarıyla gerektiğinde erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Şimdi Discord sunucunuzda bazı kanallar oluşturun ve sohbet etmeye başlayın. Aracınız kanal adını görebilir ve her kanal kendi izole oturumunu alır — böylece iş akışınıza uyan `#coding`, `#home`, `#research` veya başka kanallar kurabilirsiniz.

## Çalışma zamanı modeli

- Ağ geçidi Discord bağlantısının sahibidir.
- Yanıt yönlendirmesi deterministiktir: Discord'dan gelen yanıtlar tekrar Discord'a döner.
- Varsayılan olarak (`session.dmScope=main`), doğrudan sohbetler aracın ana oturumunu paylaşır (`agent:main:main`).
- Sunucu kanalları izole oturum anahtarlarıdır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM'leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel slash komutları izole komut oturumlarında çalışır (`agent:<agentId>:discord:slash:<userId>`), ancak yine de yönlendirilen konuşma oturumuna `CommandTargetSessionKey` taşır.

## Forum kanalları

Discord forum ve medya kanalları yalnızca thread gönderilerini kabul eder. OpenClaw bunları oluşturmak için iki yolu destekler:

- Bir thread'i otomatik oluşturmak için forum üst öğesine (`channel:<forumId>`) mesaj gönderin. Thread başlığı, mesajınızın ilk boş olmayan satırını kullanır.
- Bir thread'i doğrudan oluşturmak için `openclaw message thread create` kullanın. Forum kanalları için `--message-id` geçmeyin.

Örnek: Bir thread oluşturmak için forum üst öğesine gönderin

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Örnek: Bir forum thread'ini açıkça oluşturun

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum üst öğeleri Discord bileşenlerini kabul etmez. Bileşenlere ihtiyacınız varsa thread'in kendisine gönderin (`channel:<threadId>`).

## Etkileşimli bileşenler

OpenClaw, aracı mesajları için Discord components v2 kapsayıcılarını destekler. `components` payload'u ile mesaj aracını kullanın. Etkileşim sonuçları normal gelen mesajlar olarak aracıya geri yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Eylem satırları en fazla 5 düğmeye veya tek bir seçim menüsüne izin verir
- Seçim türleri: `string`, `user`, `role`, `mentionable`, `channel`

Varsayılan olarak bileşenler tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süreleri dolana kadar birden çok kez kullanılmasına izin vermek için `components.reusable=true` ayarlayın.

Bir düğmeye kimlerin tıklayabileceğini sınırlamak için o düğmede `allowedUsers` ayarlayın (Discord kullanıcı ID'leri, etiketler veya `*`). Yapılandırıldığında, eşleşmeyen kullanıcılar ephemeral bir red yanıtı alır.

`/model` ve `/models` slash komutları, sağlayıcı ve model açılır menülerinin yanı sıra bir Submit adımı içeren etkileşimli bir model seçici açar. Seçici yanıtı ephemeral'dır ve yalnızca komutu çağıran kullanıcı tarafından kullanılabilir.

Dosya ekleri:

- `file` blokları bir ek başvurusuna işaret etmelidir (`attachment://<filename>`)
- Eki `media`/`path`/`filePath` üzerinden sağlayın (tek dosya); birden çok dosya için `media-gallery` kullanın
- Yükleme adı ek başvurusuyla eşleşmesi gerektiğinde bunu geçersiz kılmak için `filename` kullanın

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
  message: "İsteğe bağlı fallback metni",
  components: {
    reusable: true,
    text: "Bir yol seçin",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Onayla",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Reddet", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Bir seçenek seçin",
          options: [
            { label: "Seçenek A", value: "a" },
            { label: "Seçenek B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Ayrıntılar",
      triggerLabel: "Formu aç",
      fields: [
        { type: "text", label: "İstekte bulunan" },
        {
          type: "select",
          label: "Öncelik",
          options: [
            { label: "Düşük", value: "low" },
            { label: "Yüksek", value: "high" },
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
    `channels.discord.dmPolicy`, DM erişimini denetler (eski: `channels.discord.dm.policy`):

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` içinde `"*"` bulunmasını gerektirir; eski: `channels.discord.dm.allowFrom`)
    - `disabled`

    DM ilkesi açık değilse, bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme için yönlendirilir).

    Çok hesaplı öncelik:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesabı için geçerlidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` değerleri ayarlı değilse `channels.discord.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.discord.accounts.default.allowFrom` değerini devralmaz.

    Teslimat için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` mention

    Çıplak sayısal ID'ler belirsizdir ve açık bir kullanıcı/kanal hedef türü verilmedikçe reddedilir.

  </Tab>

  <Tab title="Sunucu ilkesi">
    Sunucu işleme `channels.discord.groupPolicy` tarafından denetlenir:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` mevcut olduğunda güvenli temel değer `allowlist` olur.

    `allowlist` davranışı:

    - sunucu `channels.discord.guilds` ile eşleşmelidir (`id` tercih edilir, slug kabul edilir)
    - isteğe bağlı gönderici izin listeleri: `users` (kararlı ID'ler önerilir) ve `roles` (yalnızca rol ID'leri); bunlardan biri yapılandırılmışsa, göndericilere `users` VEYA `roles` ile eşleşmeleri halinde izin verilir
    - doğrudan ad/etiket eşleştirmesi varsayılan olarak kapalıdır; bunu yalnızca acil uyumluluk modu olarak `channels.discord.dangerouslyAllowNameMatching: true` ile etkinleştirin
    - `users` için adlar/etiketler desteklenir, ancak ID'ler daha güvenlidir; ad/etiket girişleri kullanıldığında `openclaw security audit` uyarı verir
    - bir sunucuda `channels` yapılandırılmışsa listelenmeyen kanallar reddedilir
    - bir sunucuda `channels` bloğu yoksa, izin verilen bu sunucudaki tüm kanallara izin verilir

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

    Yalnızca `DISCORD_BOT_TOKEN` ayarlayıp bir `channels.discord` bloğu oluşturmazsanız, çalışma zamanı fallback değeri `groupPolicy="allowlist"` olur (günlüklerde bir uyarıyla), `channels.defaults.groupPolicy` değeri `open` olsa bile.

  </Tab>

  <Tab title="Mention'lar ve grup DM'leri">
    Sunucu mesajları varsayılan olarak mention geçitlidir.

    Mention algılama şunları içerir:

    - açık bot mention
    - yapılandırılmış mention kalıpları (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda örtük bota-yanıt davranışı

    `requireMention` sunucu/kanal başına yapılandırılır (`channels.discord.guilds...`).
    `ignoreOtherMentions`, bot hariç başka bir kullanıcıdan/rolden bahseden mesajları isteğe bağlı olarak düşürür (@everyone/@here hariç).

    Grup DM'leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - isteğe bağlı izin listesi: `dm.groupChannels` (kanal ID'leri veya slug'lar)

  </Tab>
</Tabs>

### Role dayalı aracı yönlendirmesi

Discord sunucu üyelerini rol ID'ye göre farklı aracılara yönlendirmek için `bindings[].match.roles` kullanın. Role dayalı bağlamalar yalnızca rol ID'lerini kabul eder ve eş veya üst-eş bağlamalarından sonra, yalnızca sunucu bağlamalarından önce değerlendirilir. Bir bağlama başka eşleşme alanları da ayarlıyorsa (örneğin `peer` + `guildId` + `roles`), yapılandırılmış tüm alanların eşleşmesi gerekir.

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

## Developer Portal kurulumu

<AccordionGroup>
  <Accordion title="Uygulama ve bot oluşturun">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Bot token'ını kopyalayın

  </Accordion>

  <Accordion title="Ayrıcalıklı intent'ler">
    **Bot -> Privileged Gateway Intents** bölümünde şunları etkinleştirin:

    - Message Content Intent
    - Server Members Intent (önerilir)

    Presence intent isteğe bağlıdır ve yalnızca presence güncellemeleri almak istiyorsanız gereklidir. Bot presence ayarlamak (`setPresence`), üyeler için presence güncellemelerini etkinleştirmeyi gerektirmez.

  </Accordion>

  <Accordion title="OAuth kapsamları ve temel izinler">
    OAuth URL oluşturucu:

    - kapsamlar: `bot`, `applications.commands`

    Tipik temel izinler:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (isteğe bağlı)

    Açıkça gerekmedikçe `Administrator` kullanmaktan kaçının.

  </Accordion>

  <Accordion title="ID'leri kopyalayın">
    Discord Developer Mode'u etkinleştirin, ardından şunları kopyalayın:

    - sunucu ID
    - kanal ID
    - kullanıcı ID

    Güvenilir denetimler ve problar için OpenClaw yapılandırmasında sayısal ID'leri tercih edin.

  </Accordion>
</AccordionGroup>

## Yerel komutlar ve komut yetkilendirmesi

- `commands.native` varsayılan olarak `"auto"` değerindedir ve Discord için etkindir.
- Kanal başına geçersiz kılma: `channels.discord.commands.native`.
- `commands.native=false`, daha önce kaydedilmiş Discord yerel komutlarını açıkça temizler.
- Yerel komut yetkilendirmesi, normal mesaj işlemede kullanılan aynı Discord izin listelerini/ilkelerini kullanır.
- Komutlar, yetkili olmayan kullanıcılar için Discord arayüzünde yine de görünür olabilir; yürütme yine de OpenClaw yetkilendirmesini uygular ve "not authorized" döndürür.

Komut kataloğu ve davranış için bkz. [Slash commands](/tools/slash-commands).

Varsayılan slash komut ayarları:

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

    Not: `off`, örtük yanıt thread'lemeyi devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de uygulanır.

    Mesaj ID'leri bağlam/geçmiş içinde görünür, böylece aracılar belirli mesajları hedefleyebilir.

  </Accordion>

  <Accordion title="Canlı akış önizlemesi">
    OpenClaw, geçici bir mesaj gönderip metin geldikçe onu düzenleyerek taslak yanıtları akış halinde gönderebilir.

    - `channels.discord.streaming`, önizleme akışını denetler (`off` | `partial` | `block` | `progress`, varsayılan: `off`).
    - Varsayılan olarak `off` kalır çünkü Discord önizleme düzenlemeleri, özellikle birden çok bot veya ağ geçidi aynı hesap ya da sunucu trafiğini paylaştığında hızla rate limit'e takılabilir.
    - `progress`, kanallar arası tutarlılık için kabul edilir ve Discord'da `partial` olarak eşlenir.
    - `channels.discord.streamMode` eski bir takma addır ve otomatik olarak geçirilir.
    - `partial`, token'lar geldikçe tek bir önizleme mesajını düzenler.
    - `block`, taslak boyutlu parçalar yayınlar (boyutu ve kırılma noktalarını ayarlamak için `draftChunk` kullanın).

    Örnek:

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    `block` modu parça varsayılanları (`channels.discord.textChunkLimit` ile sınırlandırılır):

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

    Önizleme akışı yalnızca metindir; medya yanıtları normal teslimata fallback yapar.

    Not: önizleme akışı, blok akışından ayrıdır. Discord için blok akışı açıkça
    etkinleştirildiğinde, OpenClaw çift akıştan kaçınmak için önizleme akışını atlar.

  </Accordion>

  <Accordion title="Geçmiş, bağlam ve thread davranışı">
    Sunucu geçmiş bağlamı:

    - `channels.discord.historyLimit` varsayılan `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    DM geçmişi denetimleri:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread davranışı:

    - Discord thread'leri kanal oturumları olarak yönlendirilir
    - üst thread meta verileri üst-oturum bağlantısı için kullanılabilir
    - thread'e özgü bir giriş yoksa thread yapılandırması üst kanal yapılandırmasını devralır

    Kanal konuları **güvenilmeyen** bağlam olarak enjekte edilir (sistem prompt'u olarak değil).
    Yanıt ve alıntılanan mesaj bağlamı şu anda alındığı gibi kalır.
    Discord izin listeleri, esas olarak aracıyı kimin tetikleyebileceğini geçitler; tam bir ek-bağlam redaksiyon sınırı değildir.

  </Accordion>

  <Accordion title="Alt aracılar için thread'e bağlı oturumlar">
    Discord, bir thread'i bir oturum hedefine bağlayabilir; böylece o thread'deki takip mesajları aynı oturuma yönlendirilmeye devam eder (alt aracı oturumları dahil).

    Komutlar:

    - `/focus <target>` geçerli/yeni thread'i bir alt aracı/oturum hedefine bağla
    - `/unfocus` geçerli thread bağlamasını kaldır
    - `/agents` etkin çalıştırmaları ve bağlama durumunu göster
    - `/session idle <duration|off>` odaklanmış bağlamalar için hareketsizlikle otomatik odak kaldırmayı incele/güncelle
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
        spawnSubagentSessions: false, // isteğe bağlı etkinleştirme
      },
    },
  },
}
```

    Notlar:

    - `session.threadBindings.*` genel varsayılanları ayarlar.
    - `channels.discord.threadBindings.*`, Discord davranışını geçersiz kılar.
    - `sessions_spawn({ thread: true })` için thread'leri otomatik oluşturup bağlamak üzere `spawnSubagentSessions` true olmalıdır.
    - ACP için (`/acp spawn ... --thread ...` veya `sessions_spawn({ runtime: "acp", thread: true })`) thread'leri otomatik oluşturup bağlamak üzere `spawnAcpSessions` true olmalıdır.
    - Bir hesap için thread bağlamaları devre dışıysa `/focus` ve ilgili thread bağlama işlemleri kullanılamaz.

    Bkz. [Sub-agents](/tools/subagents), [ACP Agents](/tools/acp-agents) ve [Configuration Reference](/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Kalıcı ACP kanal bağlamaları">
    Kararlı "her zaman açık" ACP çalışma alanları için, Discord konuşmalarını hedefleyen üst düzey tipli ACP bağlamaları yapılandırın.

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

    - `/acp spawn codex --bind here`, geçerli Discord kanalını veya thread'ini yerinde bağlar ve gelecekteki mesajları aynı ACP oturumuna yönlendirilmiş halde tutar.
    - Bu hâlâ "yeni bir Codex ACP oturumu başlat" anlamına gelebilir, ancak kendi başına yeni bir Discord thread'i oluşturmaz. Mevcut kanal sohbet yüzeyi olarak kalır.
    - Codex yine de disk üzerindeki kendi `cwd` veya backend çalışma alanında çalışabilir. Bu çalışma alanı, Discord thread'i değil çalışma zamanı durumudur.
    - Thread mesajları üst kanal ACP bağlamasını devralabilir.
    - Bağlı bir kanal veya thread'de `/new` ve `/reset`, aynı ACP oturumunu yerinde sıfırlar.
    - Geçici thread bağlamaları yine de çalışır ve etkin olduklarında hedef çözümlemesini geçersiz kılabilir.
    - OpenClaw'ın `--thread auto|here` ile bir alt thread oluşturup bağlaması gerektiğinde yalnızca `spawnAcpSessions` gerekir. Geçerli kanaldaki `/acp spawn ... --bind here` için gerekli değildir.

    Bağlama davranışı ayrıntıları için bkz. [ACP Agents](/tools/acp-agents).

  </Accordion>

  <Accordion title="Tepki bildirimleri">
    Sunucu başına tepki bildirim modu:

    - `off`
    - `own` (varsayılan)
    - `all`
    - `allowlist` (`guilds.<id>.users` kullanır)

    Tepki olayları sistem olaylarına dönüştürülür ve yönlendirilen Discord oturumuna eklenir.

  </Accordion>

  <Accordion title="Ack tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - aracı kimliği emoji fallback'i (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Discord unicode emoji veya özel emoji adlarını kabul eder.
    - Bir kanal ya da hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Yapılandırma yazmaları">
    Kanal tarafından başlatılan yapılandırma yazmaları varsayılan olarak etkindir.

    Bu, `/config set|unset` akışlarını etkiler (komut özellikleri etkin olduğunda).

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

  <Accordion title="Gateway proxy">
    Discord ağ geçidi WebSocket trafiğini ve başlangıç REST aramalarını (uygulama ID + izin listesi çözümlemesi) `channels.discord.proxy` ile bir HTTP(S) proxy üzerinden yönlendirin.

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
    Proxy'lenmiş mesajları sistem üyesi kimliğiyle eşlemek için PluralKit çözümlemesini etkinleştirin:

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
    - üye görünen adları yalnızca `channels.discord.dangerouslyAllowNameMatching: true` olduğunda ad/slug ile eşleştirilir
    - aramalar orijinal mesaj ID'sini kullanır ve zaman penceresi ile sınırlıdır
    - arama başarısız olursa, proxy'lenmiş mesajlar bot mesajı olarak değerlendirilir ve `allowBots=true` olmadıkça düşürülür

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

    Yayın örneği:

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
    - 1: Yayın Yapıyor (`activityUrl` gerektirir)
    - 2: Dinliyor
    - 3: İzliyor
    - 4: Özel (etkinlik metnini durum durumu olarak kullanır; emoji isteğe bağlıdır)
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
        exhaustedText: "token tükendi",
      },
    },
  },
}
```

    Otomatik presence, çalışma zamanı kullanılabilirliğini Discord durumuna eşler: sağlıklı => online, bozulmuş veya bilinmeyen => idle, tükenmiş veya kullanılamaz => dnd. İsteğe bağlı metin geçersiz kılmaları:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` yer tutucusunu destekler)

  </Accordion>

  <Accordion title="Discord'da onaylar">
    Discord, DM'lerde düğme tabanlı onay işlemeyi destekler ve isteğe bağlı olarak onay istemlerini kaynak kanalda gönderebilir.

    Yapılandırma yolu:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine fallback yapar)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord, `enabled` ayarlanmamış veya `"auto"` olduğunda ve `execApprovals.approvers` ya da `commands.ownerAllowFrom` üzerinden en az bir onaylayıcı çözümlenebildiğinde yerel exec onaylarını otomatik etkinleştirir. Discord, exec onaylayıcılarını kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan mesaj `defaultTo` değerlerinden çıkarmaz. Discord'u yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `target`, `channel` veya `both` olduğunda, onay istemi kanalda görünür. Yalnızca çözümlenen onaylayıcılar düğmeleri kullanabilir; diğer kullanıcılar ephemeral bir red yanıtı alır. Onay istemleri komut metnini içerir, bu nedenle kanal teslimatını yalnızca güvenilen kanallarda etkinleştirin. Kanal ID'si oturum anahtarından türetilemezse OpenClaw DM teslimatına fallback yapar.

    Discord, diğer sohbet kanallarında kullanılan paylaşılan onay düğmelerini de işler. Yerel Discord adaptörü esas olarak onaylayıcı DM yönlendirmesi ve kanal fanout'u ekler.
    Bu düğmeler mevcut olduğunda, bunlar birincil onay UX'idir; OpenClaw
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını söylediğinde veya
    tek yol manuel onay olduğunda bir manuel `/approve` komutu eklemelidir.

    Bu işleyici için Gateway yetkilendirmesi, diğer Gateway istemcileriyle aynı paylaşılan kimlik bilgisi çözümleme sözleşmesini kullanır:

    - env-first yerel yetkilendirme (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, ardından `gateway.auth.*`)
    - yerel modda, `gateway.auth.*` ayarlı değilse `gateway.remote.*` yalnızca fallback olarak kullanılabilir; yapılandırılmış ancak çözümlenmemiş yerel SecretRef'ler fail closed olur
    - uygun olduğunda `gateway.remote.*` üzerinden remote-mode desteği
    - URL geçersiz kılmaları override-safe'tir: CLI geçersiz kılmaları örtük kimlik bilgilerini yeniden kullanmaz ve env geçersiz kılmaları yalnızca env kimlik bilgilerini kullanır

    Onay çözümleme davranışı:

    - `plugin:` önekli ID'ler `plugin.approval.resolve` üzerinden çözülür.
    - Diğer ID'ler `exec.approval.resolve` üzerinden çözülür.
    - Discord burada ek bir exec-to-plugin fallback sıçraması yapmaz; `id`
      öneki hangi gateway yöntemini çağıracağını belirler.

    Exec onaylarının varsayılan olarak süresi 30 dakika sonra dolur. Onaylar
    bilinmeyen onay ID'leri nedeniyle başarısız olursa, onaylayıcı çözümlemesini,
    özellik etkinleştirmesini ve teslim edilen onay id türünün bekleyen istekle
    eşleştiğini doğrulayın.

    İlgili belgeler: [Exec approvals](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Araçlar ve eylem geçitleri

Discord mesaj eylemleri; mesajlaşma, kanal yönetimi, moderasyon, presence ve meta veri eylemlerini içerir.

Temel örnekler:

- mesajlaşma: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- tepkiler: `react`, `reactions`, `emojiList`
- moderasyon: `timeout`, `kick`, `ban`
- presence: `setPresence`

Eylem geçitleri `channels.discord.actions.*` altında bulunur.

Varsayılan geçit davranışı:

| Eylem grubu                                                                                                                                                              | Varsayılan |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | etkin      |
| roles                                                                                                                                                                    | devre dışı |
| moderation                                                                                                                                                               | devre dışı |
| presence                                                                                                                                                                 | devre dışı |

## Components v2 UI

OpenClaw, exec onayları ve bağlamlar arası işaretleyiciler için Discord components v2 kullanır. Discord mesaj eylemleri, özel UI için `components` da kabul edebilir (ileri düzey; discord aracı üzerinden bir bileşen payload'u oluşturmayı gerektirir), ancak eski `embeds` kullanılabilir olmaya devam eder ve önerilmez.

- `channels.discord.ui.components.accentColor`, Discord bileşen kapsayıcıları için kullanılan vurgu rengini ayarlar (hex).
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

## Ses kanalları

OpenClaw, gerçek zamanlı ve sürekli konuşmalar için Discord ses kanallarına katılabilir. Bu, sesli mesaj eklerinden ayrıdır.

Gereksinimler:

- Yerel komutları etkinleştirin (`commands.native` veya `channels.discord.commands.native`).
- `channels.discord.voice` yapılandırın.
- Botun hedef ses kanalında Connect + Speak izinlerine sahip olması gerekir.

Oturumları denetlemek için yalnızca Discord'a özel yerel `/vc join|leave|status` komutunu kullanın. Komut, hesabın varsayılan aracısını kullanır ve diğer Discord komutlarıyla aynı izin listesi ve grup ilkesi kurallarını izler.

Otomatik katılma örneği:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
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
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

Notlar:

- `voice.tts`, yalnızca ses oynatma için `messages.tts` değerini geçersiz kılar.
- Ses transkripti dönüşleri, sahip durumunu Discord `allowFrom` (veya `dm.allowFrom`) üzerinden türetir; sahip olmayan konuşmacılar yalnızca sahip araçlarına (örneğin `gateway` ve `cron`) erişemez.
- Ses varsayılan olarak etkindir; devre dışı bırakmak için `channels.discord.voice.enabled=false` ayarlayın.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` katılma seçeneklerine aynen geçirilir.
- `@discordjs/voice` varsayılanları, ayarlanmamışsa `daveEncryption=true` ve `decryptionFailureTolerance=24` değerleridir.
- OpenClaw ayrıca alma tarafı çözme hatalarını izler ve kısa bir pencerede tekrarlanan hatalardan sonra ses kanalından ayrılıp yeniden katılarak otomatik toparlanır.
- Alma günlükleri tekrar tekrar `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` gösteriyorsa bu, [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) içinde izlenen yukarı akış `@discordjs/voice` alma hatası olabilir.

## Sesli mesajlar

Discord sesli mesajları bir waveform önizlemesi gösterir ve OGG/Opus ses ile meta veri gerektirir. OpenClaw waveform'u otomatik oluşturur, ancak ses dosyalarını incelemek ve dönüştürmek için ağ geçidi ana bilgisayarında `ffmpeg` ve `ffprobe` kullanılabilir olmalıdır.

Gereksinimler ve kısıtlar:

- Bir **yerel dosya yolu** sağlayın (URL'ler reddedilir).
- Metin içeriğini atlayın (Discord aynı payload'da metin + sesli mesaja izin vermez).
- Her türlü ses biçimi kabul edilir; gerektiğinde OpenClaw bunu OGG/Opus'a dönüştürür.

Örnek:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="İzin verilmeyen intent'ler kullanıldı veya bot sunucu mesajlarını görmüyor">

    - Message Content Intent'i etkinleştirin
    - kullanıcı/üye çözümlemesine bağlıysanız Server Members Intent'i etkinleştirin
    - intent'leri değiştirdikten sonra ağ geçidini yeniden başlatın

  </Accordion>

  <Accordion title="Sunucu mesajları beklenmedik şekilde engelleniyor">

    - `groupPolicy` değerini doğrulayın
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

  <Accordion title="Require mention false ama yine de engelleniyor">
    Yaygın nedenler:

    - eşleşen sunucu/kanal izin listesi olmadan `groupPolicy="allowlist"`
    - `requireMention` yanlış yerde yapılandırılmış ( `channels.discord.guilds` veya kanal girdisi altında olmalıdır )
    - gönderici sunucu/kanal `users` izin listesi tarafından engelleniyor

  </Accordion>

  <Accordion title="Uzun süren işleyiciler zaman aşımına uğruyor veya yinelenen yanıtlar oluşuyor">

    Tipik günlükler:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Listener bütçe düğmesi:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çok hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Worker çalıştırma zaman aşımı düğmesi:

    - tek hesap: `channels.discord.inboundWorker.runTimeoutMs`
    - çok hesap: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - varsayılan: `1800000` (30 dakika); devre dışı bırakmak için `0` ayarlayın

    Önerilen temel değer:

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

    Yavaş listener kurulumu için `eventQueue.listenerTimeout`, kuyruğa alınmış aracı dönüşleri için ayrı bir emniyet supabı istiyorsanız ise
    yalnızca `inboundWorker.runTimeoutMs` kullanın.

  </Accordion>

  <Accordion title="İzin denetimi uyuşmazlıkları">
    `channels status --probe` izin denetimleri yalnızca sayısal kanal ID'leriyle çalışır.

    Slug anahtarları kullanıyorsanız çalışma zamanı eşleştirmesi yine de çalışabilir, ancak probe izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM ve eşleştirme sorunları">

    - DM kapalı: `channels.discord.dm.enabled=false`
    - DM ilkesi devre dışı: `channels.discord.dmPolicy="disabled"` (eski: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Bottan bota döngüler">
    Varsayılan olarak bot tarafından yazılmış mesajlar yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız, döngü davranışını önlemek için katı mention ve izin listesi kuralları kullanın.
    Yalnızca botu mention eden bot mesajlarını kabul etmek için `channels.discord.allowBots="mentions"` tercih edin.

  </Accordion>

  <Accordion title="Voice STT, DecryptionFailed(...) ile düşüyor">

    - Discord ses alma toparlama mantığının mevcut olması için OpenClaw'ı güncel tutun (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` olduğunu doğrulayın (varsayılan)
    - `channels.discord.voice.decryptionFailureTolerance=24` (yukarı akış varsayılanı) değerinden başlayın ve yalnızca gerekirse ayarlayın
    - günlüklerde şunları izleyin:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - otomatik yeniden katılmadan sonra hatalar sürerse günlükleri toplayın ve [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) ile karşılaştırın

  </Accordion>
</AccordionGroup>

## Yapılandırma başvuru işaretçileri

Birincil başvuru:

- [Configuration reference - Discord](/gateway/configuration-reference#discord)

Yüksek sinyalli Discord alanları:

- başlangıç/kimlik doğrulama: `enabled`, `token`, `accounts.*`, `allowBots`
- ilke: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- komut: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- olay kuyruğu: `eventQueue.listenerTimeout` (listener bütçesi), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- yanıt/geçmiş: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- teslimat: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- akış: `streaming` (eski takma ad: `streamMode`), `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medya/yeniden deneme: `mediaMaxMb`, `retry`
  - `mediaMaxMb`, giden Discord yüklemelerini sınırlar (varsayılan: `8MB`)
- eylemler: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- özellikler: `threadBindings`, üst düzey `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Güvenlik ve işlemler

- Bot token'larını gizli bilgi olarak değerlendirin (denetimli ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- En az ayrıcalık ilkesine uygun Discord izinleri verin.
- Komut dağıtımı/durumu bayatsa ağ geçidini yeniden başlatın ve `openclaw channels status --probe` ile yeniden kontrol edin.

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Güvenlik](/gateway/security)
- [Çok aracı yönlendirme](/concepts/multi-agent)
- [Sorun giderme](/channels/troubleshooting)
- [Slash komutları](/tools/slash-commands)
