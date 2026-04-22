---
read_when:
    - Discord kanal özellikleri üzerinde çalışılıyor
summary: Discord bot desteği durumu, yetenekler ve yapılandırma
title: Discord
x-i18n:
    generated_at: "2026-04-22T04:19:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613ae39bc4b8c5661cbaab4f70a57af584f296581c3ce54ddaef0feab44e7e42
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Durum: resmi Discord gateway üzerinden DM'ler ve sunucu kanalları için hazır.

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

Bot içeren yeni bir uygulama oluşturmanız, botu sunucunuza eklemeniz ve OpenClaw ile eşleştirmeniz gerekir. Botunuzu kendi özel sunucunuza eklemenizi öneririz. Henüz bir sunucunuz yoksa önce [bir tane oluşturun](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** seçin).

<Steps>
  <Step title="Bir Discord uygulaması ve bot oluşturun">
    [Discord Developer Portal](https://discord.com/developers/applications) adresine gidin ve **New Application** seçeneğine tıklayın. Adını "OpenClaw" gibi bir şey yapın.

    Kenar çubuğunda **Bot** seçeneğine tıklayın. **Username** alanını, OpenClaw ajanınıza verdiğiniz ad neyse ona ayarlayın.

  </Step>

  <Step title="Ayrıcalıklı intent'leri etkinleştirin">
    Hâlâ **Bot** sayfasındayken aşağı kaydırıp **Privileged Gateway Intents** bölümüne gelin ve şunları etkinleştirin:

    - **Message Content Intent** (gerekli)
    - **Server Members Intent** (önerilir; rol izin listeleri ve addan kimlik eşleme için gereklidir)
    - **Presence Intent** (isteğe bağlı; yalnızca durum güncellemeleri için gereklidir)

  </Step>

  <Step title="Bot token'ınızı kopyalayın">
    **Bot** sayfasında tekrar yukarı kaydırın ve **Reset Token** seçeneğine tıklayın.

    <Note>
    Adına rağmen bu işlem ilk token'ınızı oluşturur — hiçbir şey "sıfırlanmıyor".
    </Note>

    Token'ı kopyalayın ve bir yere kaydedin. Bu sizin **Bot Token**'ınızdır ve birazdan buna ihtiyacınız olacak.

  </Step>

  <Step title="Bir davet URL'si oluşturun ve botu sunucunuza ekleyin">
    Kenar çubuğunda **OAuth2** seçeneğine tıklayın. Botu sunucunuza eklemek için doğru izinlere sahip bir davet URL'si oluşturacaksınız.

    Aşağı kaydırıp **OAuth2 URL Generator** bölümünde şunları etkinleştirin:

    - `bot`
    - `applications.commands`

    Altında bir **Bot Permissions** bölümü görünecektir. Şunları etkinleştirin:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (isteğe bağlı)

    Alttaki oluşturulmuş URL'yi kopyalayın, tarayıcınıza yapıştırın, sunucunuzu seçin ve bağlamak için **Continue** seçeneğine tıklayın. Artık botunuzu Discord sunucusunda görmelisiniz.

  </Step>

  <Step title="Developer Mode'u etkinleştirin ve kimliklerinizi toplayın">
    Discord uygulamasına geri dönün; dahili kimlikleri kopyalayabilmek için Developer Mode'u etkinleştirmeniz gerekir.

    1. **User Settings**'e (avatarınızın yanındaki dişli simgesi) tıklayın → **Advanced** → **Developer Mode** seçeneğini açın
    2. Kenar çubuğunda **sunucu simgenize** sağ tıklayın → **Copy Server ID**
    3. Kendi **avatarınıza** sağ tıklayın → **Copy User ID**

    **Server ID** ve **User ID** bilgilerinizi Bot Token'ınızın yanına kaydedin — bir sonraki adımda üçünü de OpenClaw'a göndereceksiniz.

  </Step>

  <Step title="Sunucu üyelerinden DM'lere izin verin">
    Eşleştirmenin çalışması için Discord'un botunuzun size DM göndermesine izin vermesi gerekir. **Sunucu simgenize** sağ tıklayın → **Privacy Settings** → **Direct Messages** seçeneğini açın.

    Bu, sunucu üyelerinin (botlar dahil) size DM göndermesine izin verir. OpenClaw ile Discord DM'lerini kullanmak istiyorsanız bunu açık bırakın. Yalnızca sunucu kanallarını kullanmayı planlıyorsanız, eşleştirmeden sonra DM'leri kapatabilirsiniz.

  </Step>

  <Step title="Bot token'ınızı güvenli şekilde ayarlayın (sohbette göndermeyin)">
    Discord bot token'ınız bir gizlidir (parola gibi). Ajanınıza mesaj göndermeden önce bunu OpenClaw'ın çalıştığı makinede ayarlayın.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    OpenClaw zaten arka plan hizmeti olarak çalışıyorsa, OpenClaw Mac uygulaması üzerinden ya da `openclaw gateway run` sürecini durdurup yeniden başlatarak yeniden başlatın.

  </Step>

  <Step title="OpenClaw'ı yapılandırın ve eşleştirin">

    <Tabs>
      <Tab title="Ajanınza sorun">
        Mevcut herhangi bir kanalda (ör. Telegram) OpenClaw ajanınızla sohbet edin ve ona söyleyin. Discord ilk kanalınızsa bunun yerine CLI / config sekmesini kullanın.

        > "Discord bot token'ımı config içinde zaten ayarladım. Lütfen User ID `<user_id>` ve Server ID `<server_id>` ile Discord kurulumunu tamamla."
      </Tab>
      <Tab title="CLI / config">
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

        Varsayılan hesap için env geri dönüşü:

```bash
DISCORD_BOT_TOKEN=...
```

        Düz metin `token` değerleri desteklenir. `channels.discord.token` için env/file/exec sağlayıcıları genelinde SecretRef değerleri de desteklenir. Bkz. [Secrets Management](/tr/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="İlk DM eşleştirmesini onaylayın">
    Gateway çalışır duruma gelene kadar bekleyin, ardından Discord'da botunuza DM gönderin. Bot bir eşleştirme koduyla yanıt verir.

    <Tabs>
      <Tab title="Ajanınza sorun">
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
Token çözümleme hesap farkındalığına sahiptir. Config içindeki token değerleri env geri dönüşünden önceliklidir. `DISCORD_BOT_TOKEN` yalnızca varsayılan hesap için kullanılır.
Gelişmiş giden çağrılar için (mesaj aracı/kanal eylemleri), çağrı başına açık bir `token` o çağrı için kullanılır. Bu, gönderme ve okuma/probe tarzı eylemler için geçerlidir (örneğin read/search/fetch/thread/pins/permissions). Hesap ilkesi/yeniden deneme ayarları yine etkin çalışma zamanı anlık görüntüsünde seçili hesaptan gelir.
</Note>

## Önerilen: Bir sunucu çalışma alanı kurun

DM'ler çalıştıktan sonra, Discord sunucunuzu tam bir çalışma alanı olarak ayarlayabilirsiniz; burada her kanal kendi bağlamına sahip kendi ajan oturumunu alır. Bu, yalnızca sizin ve botunuzun olduğu özel sunucular için önerilir.

<Steps>
  <Step title="Sunucunuzu sunucu izin listesine ekleyin">
    Bu, ajanınızın yalnızca DM'lerde değil, sunucunuzdaki herhangi bir kanalda yanıt vermesini sağlar.

    <Tabs>
      <Tab title="Ajanınza sorun">
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
    Varsayılan olarak ajanınız, sunucu kanallarında yalnızca @mention yapıldığında yanıt verir. Özel bir sunucuda, muhtemelen her mesaja yanıt vermesini istersiniz.

    <Tabs>
      <Tab title="Ajanınza sorun">
        > "Ajanimin bu sunucuda @mention yapılmasına gerek kalmadan yanıt vermesine izin ver"
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
    Varsayılan olarak uzun vadeli bellek (`MEMORY.md`) yalnızca DM oturumlarında yüklenir. Sunucu kanalları `MEMORY.md` dosyasını otomatik yüklemez.

    <Tabs>
      <Tab title="Ajanınza sorun">
        > "Discord kanallarında soru sorduğumda, `MEMORY.md` içinden uzun vadeli bağlama ihtiyaç duyarsan memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Manuel">
        Her kanalda paylaşılan bağlama ihtiyacınız varsa, kalıcı yönergeleri `AGENTS.md` veya `USER.md` içine koyun (bunlar her oturum için enjekte edilir). Uzun vadeli notları `MEMORY.md` içinde tutun ve gerektiğinde bellek araçlarıyla erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Şimdi Discord sunucunuzda birkaç kanal oluşturun ve sohbet etmeye başlayın. Ajanınız kanal adını görebilir ve her kanal kendi yalıtılmış oturumunu alır — böylece `#coding`, `#home`, `#research` ya da iş akışınıza uyan başka kanallar ayarlayabilirsiniz.

## Çalışma zamanı modeli

- Gateway, Discord bağlantısını sahiplenir.
- Yanıt yönlendirmesi deterministiktir: Discord'dan gelenler yeniden Discord'a yanıtlanır.
- Varsayılan olarak (`session.dmScope=main`), doğrudan sohbetler ajan ana oturumunu paylaşır (`agent:main:main`).
- Sunucu kanalları yalıtılmış oturum anahtarlarıdır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM'leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel slash komutları yalıtılmış komut oturumlarında çalışır (`agent:<agentId>:discord:slash:<userId>`), buna rağmen yönlendirilmiş konuşma oturumuna `CommandTargetSessionKey` taşır.

## Forum kanalları

Discord forum ve medya kanalları yalnızca iş parçacığı gönderilerini kabul eder. OpenClaw bunları oluşturmak için iki yolu destekler:

- İş parçacığını otomatik oluşturmak için forum üst öğesine (`channel:<forumId>`) bir mesaj gönderin. İş parçacığı başlığı, mesajınızın boş olmayan ilk satırını kullanır.
- Bir iş parçacığını doğrudan oluşturmak için `openclaw message thread create` kullanın. Forum kanalları için `--message-id` geçirmeyin.

Örnek: iş parçacığı oluşturmak için forum üst öğesine gönderme

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Konu başlığı\nGönderi gövdesi"
```

Örnek: açıkça bir forum iş parçacığı oluşturma

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Konu başlığı" --message "Gönderi gövdesi"
```

Forum üst öğeleri Discord bileşenlerini kabul etmez. Bileşenlere ihtiyacınız varsa iş parçacığının kendisine (`channel:<threadId>`) gönderin.

## Etkileşimli bileşenler

OpenClaw, ajan mesajları için Discord components v2 container desteği sunar. `components` yükü ile mesaj aracını kullanın. Etkileşim sonuçları normal gelen mesajlar olarak yeniden ajana yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Eylem satırları en fazla 5 düğmeye veya tek bir seçim menüsüne izin verir
- Seçim türleri: `string`, `user`, `role`, `mentionable`, `channel`

Varsayılan olarak bileşenler tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süreleri dolana kadar birden çok kez kullanılabilmesi için `components.reusable=true` ayarlayın.

Bir düğmeye kimlerin tıklayabileceğini kısıtlamak için, o düğmede `allowedUsers` ayarlayın (Discord kullanıcı kimlikleri, etiketler veya `*`). Yapılandırıldığında, eşleşmeyen kullanıcılar geçici bir ret alır.

`/model` ve `/models` slash komutları; sağlayıcı ve model açılır menüleri ile bir Submit adımı içeren etkileşimli bir model seçici açar. Seçici yanıtı geçicidir ve yalnızca komutu çağıran kullanıcı bunu kullanabilir.

Dosya ekleri:

- `file` blokları bir ek başvurusuna işaret etmelidir (`attachment://<filename>`)
- Eki `media`/`path`/`filePath` üzerinden sağlayın (tek dosya); birden fazla dosya için `media-gallery` kullanın
- Karşıya yükleme adının ek başvurusu ile eşleşmesi gerektiğinde bunu geçersiz kılmak için `filename` kullanın

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
  message: "İsteğe bağlı yedek metin",
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
          placeholder: "Bir seçenek belirleyin",
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
        { type: "text", label: "İstek sahibi" },
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

## Erişim kontrolü ve yönlendirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.discord.dmPolicy`, DM erişimini kontrol eder (eski: `channels.discord.dm.policy`):

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` içinde `"*"` bulunmasını gerektirir; eski: `channels.discord.dm.allowFrom`)
    - `disabled`

    DM ilkesi açık değilse, bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme istenir).

    Çoklu hesap önceliği:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesap için geçerlidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` ayarları tanımlı değilse `channels.discord.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar, `channels.discord.accounts.default.allowFrom` değerini devralmaz.

    Teslimat için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` mention

    Yalın sayısal kimlikler belirsizdir ve açık bir kullanıcı/kanal hedef türü belirtilmediği sürece reddedilir.

  </Tab>

  <Tab title="Sunucu ilkesi">
    Sunucu işleme davranışı `channels.discord.groupPolicy` ile kontrol edilir:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` mevcut olduğunda güvenli temel ayar `allowlist` olur.

    `allowlist` davranışı:

    - sunucu `channels.discord.guilds` ile eşleşmelidir (`id` tercih edilir, slug kabul edilir)
    - isteğe bağlı gönderici izin listeleri: `users` (kararlı kimlikler önerilir) ve `roles` (yalnızca rol kimlikleri); bunlardan biri yapılandırılmışsa, göndericilere `users` VEYA `roles` eşleştiğinde izin verilir
    - doğrudan ad/etiket eşleme varsayılan olarak kapalıdır; bunu yalnızca acil durum uyumluluk modu olarak `channels.discord.dangerouslyAllowNameMatching: true` ile etkinleştirin
    - `users` için adlar/etiketler desteklenir, ancak kimlikler daha güvenlidir; ad/etiket girdileri kullanıldığında `openclaw security audit` uyarı verir
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

  <Tab title="Mention'lar ve grup DM'leri">
    Sunucu mesajları varsayılan olarak mention gerektirir.

    Mention algılaması şunları içerir:

    - botun açıkça mention edilmesi
    - yapılandırılmış mention desenleri (`agents.list[].groupChat.mentionPatterns`, geri dönüş olarak `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda bottan gelen mesaja örtük yanıt davranışı

    `requireMention`, sunucu/kanal başına yapılandırılır (`channels.discord.guilds...`).
    `ignoreOtherMentions`, bot değil başka bir kullanıcıdan/rolden mention alan mesajları isteğe bağlı olarak düşürür (@everyone/@here hariç).

    Grup DM'leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - isteğe bağlı izin listesi: `dm.groupChannels` (kanal kimlikleri veya slug'lar)

  </Tab>
</Tabs>

### Role dayalı ajan yönlendirmesi

Discord sunucu üyelerini rol kimliğine göre farklı ajanlara yönlendirmek için `bindings[].match.roles` kullanın. Role dayalı binding'ler yalnızca rol kimliklerini kabul eder ve peer veya parent-peer binding'lerinden sonra, yalnızca sunucuya dayalı binding'lerden önce değerlendirilir. Bir binding başka eşleşme alanları da ayarlıyorsa (örneğin `peer` + `guildId` + `roles`), yapılandırılmış tüm alanlar eşleşmelidir.

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
    **Bot -> Privileged Gateway Intents** altında şunları etkinleştirin:

    - Message Content Intent
    - Server Members Intent (önerilir)

    Presence intent isteğe bağlıdır ve yalnızca durum güncellemelerini almak istiyorsanız gereklidir. Bot durumu ayarlamak (`setPresence`) için üyeler adına durum güncellemelerini etkinleştirmeniz gerekmez.

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

    Açıkça gerekmediği sürece `Administrator` kullanmaktan kaçının.

  </Accordion>

  <Accordion title="Kimlikleri kopyalayın">
    Discord Developer Mode'u etkinleştirin, sonra şunları kopyalayın:

    - sunucu kimliği
    - kanal kimliği
    - kullanıcı kimliği

    Güvenilir denetimler ve probe'lar için OpenClaw yapılandırmasında sayısal kimlikleri tercih edin.

  </Accordion>
</AccordionGroup>

## Yerel komutlar ve komut yetkilendirmesi

- `commands.native` varsayılan olarak `"auto"` olur ve Discord için etkindir.
- Kanal başına geçersiz kılma: `channels.discord.commands.native`.
- `commands.native=false`, önceden kaydedilmiş Discord yerel komutlarını açıkça temizler.
- Yerel komut yetkilendirmesi, normal mesaj işlemeyle aynı Discord izin listelerini/ilkelerini kullanır.
- Komutlar, yetkili olmayan kullanıcılar için Discord arayüzünde yine de görünebilir; yürütme aşaması yine de OpenClaw yetkilendirmesini uygular ve "yetkili değil" döndürür.

Komut kataloğu ve davranış için bkz. [Slash komutları](/tr/tools/slash-commands).

Varsayılan slash komutu ayarları:

- `ephemeral: true`

## Özellik ayrıntıları

<AccordionGroup>
  <Accordion title="Yanıt etiketleri ve yerel yanıtlar">
    Discord, ajan çıktısında yanıt etiketlerini destekler:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` ile kontrol edilir:

    - `off` (varsayılan)
    - `first`
    - `all`
    - `batched`

    Not: `off`, örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.
    `first`, dönüş içindeki ilk giden Discord mesajına her zaman örtük yerel yanıt başvurusunu ekler.
    `batched`, Discord'un örtük yerel yanıt başvurusunu yalnızca
    gelen dönüş, birden çok mesajın debounce edilmiş bir toplu işlemi olduğunda ekler. Bu,
    yerel yanıtları her tek mesajlı dönüş için değil, esas olarak belirsiz ve patlamalı sohbetlerde kullanmak istediğinizde faydalıdır.

    Ajanların belirli mesajları hedefleyebilmesi için mesaj kimlikleri bağlamda/geçmişte görünür olur.

  </Accordion>

  <Accordion title="Canlı akış önizlemesi">
    OpenClaw, geçici bir mesaj gönderip metin geldikçe onu düzenleyerek taslak yanıtları akış olarak sunabilir.

    - `channels.discord.streaming`, önizleme akışını kontrol eder (`off` | `partial` | `block` | `progress`, varsayılan: `off`).
    - Varsayılan ayar `off` olarak kalır çünkü Discord önizleme düzenlemeleri özellikle birden çok bot veya gateway aynı hesabı ya da sunucu trafiğini paylaştığında hız sınırlarına hızlıca takılabilir.
    - `progress`, kanallar arası tutarlılık için kabul edilir ve Discord'da `partial` olarak eşlenir.
    - `channels.discord.streamMode` eski bir takma addır ve otomatik olarak geçirilir.
    - `partial`, token'lar geldikçe tek bir önizleme mesajını düzenler.
    - `block`, taslak boyutlu parçalar üretir (boyut ve kırılma noktalarını ayarlamak için `draftChunk` kullanın).
    - Medya, hata ve açık-yanıt sonları; normal teslimattan önce geçici bir taslağı boşaltmadan bekleyen önizleme düzenlemelerini iptal eder.
    - `streaming.preview.toolProgress`, araç/ilerleme güncellemelerinin aynı taslak önizleme mesajını yeniden kullanıp kullanmayacağını kontrol eder (varsayılan: `true`). Ayrı araç/ilerleme mesajları tutmak için `false` ayarlayın.

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

    Önizleme akışı yalnızca metin içindir; medya yanıtları normal teslimata geri düşer.

    Not: önizleme akışı, blok akışından ayrıdır. Discord için blok akışı açıkça
    etkinleştirildiğinde, OpenClaw çift akıştan kaçınmak için önizleme akışını atlar.

  </Accordion>

  <Accordion title="Geçmiş, bağlam ve iş parçacığı davranışı">
    Sunucu geçmişi bağlamı:

    - `channels.discord.historyLimit` varsayılan `20`
    - geri dönüş: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    DM geçmiş denetimleri:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    İş parçacığı davranışı:

    - Discord iş parçacıkları kanal oturumları olarak yönlendirilir
    - üst iş parçacığı meta verileri, üst-oturum bağlantısı için kullanılabilir
    - iş parçacığına özgü bir giriş yoksa iş parçacığı yapılandırması üst kanal yapılandırmasını devralır

    Kanal konuları **güvenilmeyen** bağlam olarak enjekte edilir (sistem istemi olarak değil).
    Yanıt ve alıntılanan mesaj bağlamı şu anda alındığı gibi kalır.
    Discord izin listeleri öncelikle ajanın kim tarafından tetiklenebileceğini sınırlar; tam bir ek bağlam redaksiyonu sınırı değildir.

  </Accordion>

  <Accordion title="Alt ajanlar için iş parçacığına bağlı oturumlar">
    Discord, bir iş parçacığını bir oturum hedefine bağlayabilir; böylece bu iş parçacığındaki devam mesajları aynı oturuma yönlendirilmeye devam eder (alt ajan oturumları dahil).

    Komutlar:

    - `/focus <target>` geçerli/yeni iş parçacığını bir alt ajan/oturum hedefine bağlar
    - `/unfocus` geçerli iş parçacığı bağını kaldırır
    - `/agents` etkin çalıştırmaları ve bağ durumu gösterir
    - `/session idle <duration|off>` odaklı bağlar için hareketsizlik nedeniyle otomatik odak kaldırmayı inceleyin/güncelleyin
    - `/session max-age <duration|off>` odaklı bağlar için kesin azami yaşı inceleyin/güncelleyin

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
        spawnSubagentSessions: false, // açık katılım
      },
    },
  },
}
```

    Notlar:

    - `session.threadBindings.*`, genel varsayılanları ayarlar.
    - `channels.discord.threadBindings.*`, Discord davranışını geçersiz kılar.
    - `sessions_spawn({ thread: true })` için iş parçacıklarını otomatik oluşturmak/bağlamak adına `spawnSubagentSessions` true olmalıdır.
    - ACP için (`/acp spawn ... --thread ...` veya `sessions_spawn({ runtime: "acp", thread: true })`) iş parçacıklarını otomatik oluşturmak/bağlamak adına `spawnAcpSessions` true olmalıdır.
    - Bir hesap için iş parçacığı bağları devre dışıysa, `/focus` ve ilgili iş parçacığı bağlama işlemleri kullanılamaz.

    Bkz. [Sub-agents](/tr/tools/subagents), [ACP Agents](/tr/tools/acp-agents) ve [Configuration Reference](/tr/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Kalıcı ACP kanal bağları">
    Kararlı, "her zaman açık" ACP çalışma alanları için Discord konuşmalarını hedefleyen üst düzey tipli ACP bağlarını yapılandırın.

    Yapılandırma yolu:

    - `bindings[]` ile `type: "acp"` ve `match.channel: "discord"`

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

    - `/acp spawn codex --bind here`, mevcut Discord kanalını veya iş parçacığını yerinde bağlar ve sonraki mesajların aynı ACP oturumuna yönlendirilmesini sürdürür.
    - Bu yine de "yeni bir Codex ACP oturumu başlat" anlamına gelebilir, ancak kendi başına yeni bir Discord iş parçacığı oluşturmaz. Mevcut kanal sohbet yüzeyi olarak kalır.
    - Codex yine de diskte kendi `cwd` ya da backend çalışma alanında çalışabilir. Bu çalışma alanı çalışma zamanı durumudur, Discord iş parçacığı değildir.
    - İş parçacığı mesajları üst kanal ACP bağını devralabilir.
    - Bağlı bir kanal veya iş parçacığında `/new` ve `/reset`, aynı ACP oturumunu yerinde sıfırlar.
    - Geçici iş parçacığı bağları yine de çalışır ve etkin olduklarında hedef çözümlemeyi geçersiz kılabilir.
    - `spawnAcpSessions` yalnızca OpenClaw'ın `--thread auto|here` yoluyla bir alt iş parçacığı oluşturması/bağlaması gerektiğinde gerekir. Geçerli kanalda `/acp spawn ... --bind here` için gerekli değildir.

    Bağ davranışının ayrıntıları için bkz. [ACP Agents](/tr/tools/acp-agents).

  </Accordion>

  <Accordion title="Tepki bildirimleri">
    Sunucu başına tepki bildirimi modu:

    - `off`
    - `own` (varsayılan)
    - `all`
    - `allowlist` (`guilds.<id>.users` kullanır)

    Tepki olayları sistem olaylarına dönüştürülür ve yönlendirilmiş Discord oturumuna eklenir.

  </Accordion>

  <Accordion title="Ack tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - ajan kimliği emoji geri dönüşü (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Discord unicode emoji veya özel emoji adlarını kabul eder.
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
    `channels.discord.proxy` ile Discord gateway WebSocket trafiğini ve başlangıç REST sorgularını (uygulama kimliği + izin listesi çözümleme) bir HTTP(S) proxy üzerinden yönlendirin.

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
    Proxylanmış mesajları sistem üyesi kimliğine eşlemek için PluralKit çözümlemesini etkinleştirin:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // isteğe bağlı; özel sistemler için gerekli
      },
    },
  },
}
```

    Notlar:

    - izin listeleri `pk:<memberId>` kullanabilir
    - üye görünen adları, yalnızca `channels.discord.dangerouslyAllowNameMatching: true` olduğunda ad/slug ile eşleştirilir
    - sorgular özgün mesaj kimliğini kullanır ve zaman penceresiyle sınırlıdır
    - sorgulama başarısız olursa, proxylanmış mesajlar bot mesajı olarak değerlendirilir ve `allowBots=true` olmadıkça düşürülür

  </Accordion>

  <Accordion title="Durum yapılandırması">
    Bir durum veya etkinlik alanı ayarladığınızda ya da otomatik durumu etkinleştirdiğinizde durum güncellemeleri uygulanır.

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

    - 0: Oynuyor
    - 1: Yayında (`activityUrl` gerektirir)
    - 2: Dinliyor
    - 3: İzliyor
    - 4: Özel (etkinlik metnini durum durumu olarak kullanır; emoji isteğe bağlıdır)
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
        exhaustedText: "token tükendi",
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
    Discord, DM'lerde düğme tabanlı onay işlemeyi destekler ve isteğe bağlı olarak onay istemlerini kaynak kanalda yayınlayabilir.

    Yapılandırma yolu:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    `enabled` ayarlanmamış veya `"auto"` ise ve en az bir onaylayıcı çözümlenebiliyorsa Discord yerel exec onaylarını otomatik etkinleştirir; bu, `execApprovals.approvers` veya `commands.ownerAllowFrom` üzerinden olabilir. Discord, exec onaylayıcılarını kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan mesaj `defaultTo` ayarlarından çıkarmaz. Discord'u yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `target` değeri `channel` veya `both` olduğunda, onay istemi kanalda görünür. Düğmeleri yalnızca çözümlenen onaylayıcılar kullanabilir; diğer kullanıcılar geçici bir ret alır. Onay istemleri komut metnini içerir, bu nedenle kanal teslimini yalnızca güvenilir kanallarda etkinleştirin. Kanal kimliği oturum anahtarından türetilemezse OpenClaw DM teslimine geri döner.

    Discord ayrıca diğer sohbet kanallarının kullandığı paylaşılan onay düğmelerini de render eder. Yerel Discord adaptörü esas olarak onaylayıcı DM yönlendirmesi ve kanal fanout ekler.
    Bu düğmeler mevcut olduğunda, bunlar birincil onay UX'idir; OpenClaw
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun
    manuel onay olduğunu söylediğinde manuel bir `/approve` komutu içermelidir.

    Bu işleyici için Gateway kimlik doğrulaması, diğer Gateway istemcileriyle aynı paylaşılan kimlik bilgisi çözümleme sözleşmesini kullanır:

    - env öncelikli yerel kimlik doğrulama (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, ardından `gateway.auth.*`)
    - yerel modda `gateway.remote.*`, yalnızca `gateway.auth.*` ayarlanmamışsa geri dönüş olarak kullanılabilir; yapılandırılmış ancak çözümlenmemiş yerel SecretRef'ler başarısız durumda kapalı kalır
    - uygulanabildiğinde `gateway.remote.*` üzerinden uzak mod desteği
    - URL geçersiz kılmaları güvenli şekilde geçersiz kılınır: CLI geçersiz kılmaları örtük kimlik bilgilerini yeniden kullanmaz ve env geçersiz kılmaları yalnızca env kimlik bilgilerini kullanır

    Onay çözümleme davranışı:

    - `plugin:` ile başlayan kimlikler `plugin.approval.resolve` üzerinden çözümlenir.
    - Diğer kimlikler `exec.approval.resolve` üzerinden çözümlenir.
    - Discord burada ek bir exec-to-plugin geri dönüş adımı yapmaz; çağıracağı gateway yöntemini
      kimlik öneki belirler.

    Exec onaylarının süresi varsayılan olarak 30 dakika sonra dolar. Onaylar
    bilinmeyen onay kimlikleriyle başarısız olursa, onaylayıcı çözümlemesini, özellik etkinliğini
    ve teslim edilen onay kimliği türünün bekleyen istekle eşleştiğini doğrulayın.

    İlgili belgeler: [Exec approvals](/tr/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Araçlar ve eylem geçitleri

Discord mesaj eylemleri; mesajlaşma, kanal yönetimi, moderasyon, durum ve meta veri eylemlerini içerir.

Temel örnekler:

- mesajlaşma: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- tepkiler: `react`, `reactions`, `emojiList`
- moderasyon: `timeout`, `kick`, `ban`
- durum: `setPresence`

`event-create` eylemi, planlanmış etkinlik kapak görselini ayarlamak için isteğe bağlı bir `image` parametresi (URL veya yerel dosya yolu) kabul eder.

Eylem geçitleri `channels.discord.actions.*` altında bulunur.

Varsayılan geçit davranışı:

| Eylem grubu                                                                                                                                                              | Varsayılan |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | etkin      |
| roles                                                                                                                                                                    | devre dışı |
| moderation                                                                                                                                                               | devre dışı |
| presence                                                                                                                                                                 | devre dışı |

## Components v2 UI

OpenClaw, exec onayları ve bağlamlar arası işaretleyiciler için Discord components v2 kullanır. Discord mesaj eylemleri, özel UI için `components` da kabul edebilir (ileri düzey; discord aracı üzerinden bir bileşen yükü oluşturmayı gerektirir); eski `embeds` ise hâlâ kullanılabilir ama önerilmez.

- `channels.discord.ui.components.accentColor`, Discord bileşen container'ları için kullanılan vurgu rengini ayarlar (hex).
- Hesap başına ayarlamak için `channels.discord.accounts.<id>.ui.components.accentColor` kullanın.
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

## Ses kanalları

OpenClaw, gerçek zamanlı ve kesintisiz konuşmalar için Discord ses kanallarına katılabilir. Bu, sesli mesaj eklerinden ayrıdır.

Gereksinimler:

- Yerel komutları etkinleştirin (`commands.native` veya `channels.discord.commands.native`).
- `channels.discord.voice` yapılandırmasını ayarlayın.
- Botun hedef ses kanalında Connect + Speak izinlerine sahip olması gerekir.

Oturumları kontrol etmek için yalnızca Discord'a özel yerel `/vc join|leave|status` komutunu kullanın. Bu komut hesap varsayılan ajanını kullanır ve diğer Discord komutlarıyla aynı izin listesi ve sunucu ilkesi kurallarını izler.

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
- Ses dökümü dönüşleri sahip durumunu Discord `allowFrom` (veya `dm.allowFrom`) üzerinden türetir; sahip olmayan konuşmacılar yalnızca sahip erişimine açık araçlara erişemez (örneğin `gateway` ve `cron`).
- Ses varsayılan olarak etkindir; devre dışı bırakmak için `channels.discord.voice.enabled=false` ayarlayın.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` katılma seçeneklerine doğrudan iletilir.
- `@discordjs/voice` varsayılanları, ayarlanmamışsa `daveEncryption=true` ve `decryptionFailureTolerance=24` şeklindedir.
- OpenClaw ayrıca alma tarafındaki şifre çözme hatalarını izler ve kısa bir zaman penceresinde art arda hatalar olduğunda ses kanalından ayrılıp yeniden katılarak otomatik kurtarma yapar.
- Alma günlüklerinde tekrar tekrar `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` görünüyorsa, bunun kaynağı [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) içinde izlenen üst akış `@discordjs/voice` alma hatası olabilir.

## Sesli mesajlar

Discord sesli mesajları bir dalga biçimi önizlemesi gösterir ve OGG/Opus ses ile meta veriler gerektirir. OpenClaw dalga biçimini otomatik üretir, ancak ses dosyalarını incelemek ve dönüştürmek için gateway ana bilgisayarında `ffmpeg` ve `ffprobe` erişilebilir olmalıdır.

Gereksinimler ve kısıtlamalar:

- Bir **yerel dosya yolu** sağlayın (URL'ler reddedilir).
- Metin içeriğini atlayın (Discord aynı yükte metin + sesli mesaja izin vermez).
- Herhangi bir ses biçimi kabul edilir; gerektiğinde OpenClaw bunu OGG/Opus'a dönüştürür.

Örnek:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="İzin verilmeyen intent'ler kullanıldı veya bot sunucu mesajlarını görmüyor">

    - Message Content Intent'i etkinleştirin
    - kullanıcı/üye çözümlemeye bağlıysanız Server Members Intent'i etkinleştirin
    - intent'leri değiştirdikten sonra gateway'i yeniden başlatın

  </Accordion>

  <Accordion title="Sunucu mesajları beklenmedik şekilde engelleniyor">

    - `groupPolicy` değerini doğrulayın
    - `channels.discord.guilds` altındaki sunucu izin listesini doğrulayın
    - sunucuda `channels` eşlemesi varsa yalnızca listelenen kanallara izin verilir
    - `requireMention` davranışını ve mention desenlerini doğrulayın

    Yararlı kontroller:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false ama yine de engelleniyor">
    Yaygın nedenler:

    - eşleşen sunucu/kanal izin listesi olmadan `groupPolicy="allowlist"`
    - `requireMention` yanlış yerde yapılandırılmış (mutlaka `channels.discord.guilds` veya kanal girdisi altında olmalı)
    - gönderici sunucu/kanal `users` izin listesi tarafından engelleniyor

  </Accordion>

  <Accordion title="Uzun süren işleyiciler zaman aşımına uğruyor veya yinelenen yanıtlar oluşuyor">

    Tipik günlükler:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Listener bütçesi ayarı:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çoklu hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Worker çalışma zaman aşımı ayarı:

    - tek hesap: `channels.discord.inboundWorker.runTimeoutMs`
    - çoklu hesap: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - varsayılan: `1800000` (30 dakika); devre dışı bırakmak için `0` ayarlayın

    Önerilen temel ayar:

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

    Yavaş listener kurulumu için `eventQueue.listenerTimeout`, sıralanmış ajan dönüşleri için ayrı bir güvenlik valfi istiyorsanız
    yalnızca `inboundWorker.runTimeoutMs` kullanın.

  </Accordion>

  <Accordion title="İzin denetimi uyuşmazlıkları">
    `channels status --probe` izin kontrolleri yalnızca sayısal kanal kimlikleriyle çalışır.

    Slug anahtarlar kullanırsanız çalışma zamanı eşleştirmesi yine de çalışabilir, ancak probe izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM ve eşleştirme sorunları">

    - DM devre dışı: `channels.discord.dm.enabled=false`
    - DM ilkesi devre dışı: `channels.discord.dmPolicy="disabled"` (eski: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Bottan bota döngüler">
    Varsayılan olarak bot tarafından yazılmış mesajlar yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız döngü davranışını önlemek için katı mention ve izin listesi kuralları kullanın.
    Yalnızca botu mention eden bot mesajlarını kabul etmek için `channels.discord.allowBots="mentions"` tercih edin.

  </Accordion>

  <Accordion title="Voice STT, DecryptionFailed(...) ile düşüyor">

    - Discord ses alma kurtarma mantığının mevcut olması için OpenClaw'ı güncel tutun (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` olduğunu doğrulayın (varsayılan)
    - `channels.discord.voice.decryptionFailureTolerance=24` (üst akış varsayılanı) ile başlayın ve yalnızca gerekirse ayarlayın
    - günlüklerde şunları izleyin:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - otomatik yeniden katılmadan sonra hatalar sürerse günlükleri toplayın ve [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) ile karşılaştırın

  </Accordion>
</AccordionGroup>

## Yapılandırma referansı işaretçileri

Birincil referans:

- [Yapılandırma referansı - Discord](/tr/gateway/configuration-reference#discord)

Yüksek sinyalli Discord alanları:

- başlangıç/kimlik doğrulama: `enabled`, `token`, `accounts.*`, `allowBots`
- ilke: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- komut: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- olay kuyruğu: `eventQueue.listenerTimeout` (listener bütçesi), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- yanıt/geçmiş: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- teslimat: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- akış: `streaming` (eski takma ad: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medya/yeniden deneme: `mediaMaxMb`, `retry`
  - `mediaMaxMb`, giden Discord yüklemelerini sınırlar (varsayılan: `100MB`)
- eylemler: `actions.*`
- durum: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- özellikler: `threadBindings`, üst düzey `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Güvenlik ve işlemler

- Bot token'larını gizli bilgi olarak değerlendirin (denetlenen ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- Discord izinlerinde en az ayrıcalık ilkesini uygulayın.
- Komut dağıtımı/durumu eskiyse gateway'i yeniden başlatın ve `openclaw channels status --probe` ile yeniden kontrol edin.

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Güvenlik](/tr/gateway/security)
- [Çoklu ajan yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
- [Slash komutları](/tr/tools/slash-commands)
