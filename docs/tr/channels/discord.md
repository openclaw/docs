---
read_when:
    - Discord kanal özellikleri üzerinde çalışma
summary: Discord bot desteğinin durumu, yetenekleri ve yapılandırması
title: Discord
x-i18n:
    generated_at: "2026-04-30T09:05:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f31af2801e7faf6456d4452a5f43b0e42a067b86b7e562c308fa450a847356
    source_path: channels/discord.md
    workflow: 16
---

Discord’un resmi Gateway’i üzerinden DM’ler ve guild kanalları için hazır.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Discord DM’leri varsayılan olarak eşleştirme modundadır.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım akışı.
  </Card>
</CardGroup>

## Hızlı kurulum

Bir botla yeni bir uygulama oluşturmanız, botu sunucunuza eklemeniz ve OpenClaw ile eşleştirmeniz gerekir. Botunuzu kendi özel sunucunuza eklemenizi öneririz. Henüz bir sunucunuz yoksa, [önce bir tane oluşturun](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** seçin).

<Steps>
  <Step title="Create a Discord application and bot">
    [Discord Developer Portal](https://discord.com/developers/applications) sayfasına gidin ve **New Application**’a tıklayın. "OpenClaw" gibi bir ad verin.

    Kenar çubuğunda **Bot**’a tıklayın. **Username** alanını OpenClaw ajanınıza ne diyorsanız ona ayarlayın.

  </Step>

  <Step title="Enable privileged intents">
    Hâlâ **Bot** sayfasındayken **Privileged Gateway Intents** bölümüne kadar aşağı kaydırın ve şunları etkinleştirin:

    - **Message Content Intent** (gerekli)
    - **Server Members Intent** (önerilir; rol izin listeleri ve addan ID’ye eşleştirme için gereklidir)
    - **Presence Intent** (isteğe bağlı; yalnızca presence güncellemeleri için gerekir)

  </Step>

  <Step title="Copy your bot token">
    **Bot** sayfasında tekrar yukarı kaydırın ve **Reset Token**’a tıklayın.

    <Note>
    Adına rağmen bu işlem ilk token’ınızı oluşturur; hiçbir şey "sıfırlanmıyor."
    </Note>

    Token’ı kopyalayıp bir yere kaydedin. Bu sizin **Bot Token**’ınızdır ve kısa süre içinde buna ihtiyacınız olacak.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    Kenar çubuğunda **OAuth2**’ye tıklayın. Botu sunucunuza eklemek için doğru izinlere sahip bir davet URL’si oluşturacaksınız.

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

    Bu, normal metin kanalları için temel settir. Forum veya medya kanalı iş akışları dahil Discord thread’lerine gönderi paylaşmayı planlıyorsanız ve bunlar bir thread oluşturuyor ya da sürdürüyorsa, **Send Messages in Threads** seçeneğini de etkinleştirin.
    Altta oluşturulan URL’yi kopyalayın, tarayıcınıza yapıştırın, sunucunuzu seçin ve bağlanmak için **Continue**’a tıklayın. Artık botunuzu Discord sunucusunda görüyor olmalısınız.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    Discord uygulamasına geri dönün; dahili ID’leri kopyalayabilmek için Developer Mode’u etkinleştirmeniz gerekir.

    1. **User Settings**’e (avatarınızın yanındaki dişli simgesi) tıklayın → **Advanced** → **Developer Mode**’u açın
    2. Kenar çubuğundaki **sunucu simgenize** sağ tıklayın → **Copy Server ID**
    3. **Kendi avatarınıza** sağ tıklayın → **Copy User ID**

    **Server ID** ve **User ID** bilgilerinizi Bot Token’ınızla birlikte kaydedin; sonraki adımda üçünü de OpenClaw’a göndereceksiniz.

  </Step>

  <Step title="Allow DMs from server members">
    Eşleştirmenin çalışması için Discord’un botunuzun size DM göndermesine izin vermesi gerekir. **Sunucu simgenize** sağ tıklayın → **Privacy Settings** → **Direct Messages**’ı açın.

    Bu, sunucu üyelerinin (botlar dahil) size DM göndermesine izin verir. OpenClaw ile Discord DM’lerini kullanmak istiyorsanız bunu etkin bırakın. Yalnızca guild kanallarını kullanmayı planlıyorsanız, eşleştirmeden sonra DM’leri devre dışı bırakabilirsiniz.

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    Discord bot token’ınız bir sırdır (parola gibi). Ajanınıza mesaj göndermeden önce bunu OpenClaw’ın çalıştığı makinede ayarlayın.

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

    OpenClaw zaten arka plan hizmeti olarak çalışıyorsa, OpenClaw Mac uygulaması üzerinden ya da `openclaw gateway run` sürecini durdurup yeniden başlatarak yeniden başlatın.
    Yönetilen hizmet kurulumları için `DISCORD_BOT_TOKEN` bulunan bir kabuktan `openclaw gateway install` çalıştırın ya da değişkeni `~/.openclaw/.env` içinde saklayın; böylece hizmet yeniden başlatmadan sonra env SecretRef’i çözebilir.
    Host’unuz Discord’un başlangıç uygulama araması tarafından engelleniyor veya hız sınırına takılıyorsa, başlangıcın bu REST çağrısını atlayabilmesi için Discord uygulama/istemci ID’sini Developer Portal’dan ayarlayın. Varsayılan hesap için `channels.discord.applicationId`, birden fazla Discord botu çalıştırdığınızda ise `channels.discord.accounts.<accountId>.applicationId` kullanın.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        OpenClaw ajanınızla mevcut herhangi bir kanalda (ör. Telegram) sohbet edin ve ona söyleyin. Discord ilk kanalınızsa bunun yerine CLI / config sekmesini kullanın.

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

        Betikli veya uzak kurulum için aynı JSON5 bloğunu `openclaw config patch --file ./discord.patch.json5 --dry-run` ile yazın ve ardından `--dry-run` olmadan tekrar çalıştırın. Düz metin `token` değerleri desteklenir. SecretRef değerleri de env/file/exec sağlayıcılarında `channels.discord.token` için desteklenir. Bkz. [Secrets Management](/tr/gateway/secrets).

        Birden fazla Discord botu için her bot token’ını ve uygulama ID’sini kendi hesabının altında tutun. Üst düzey `channels.discord.applicationId` hesaplar tarafından devralınır; bu yüzden yalnızca her hesabın aynı uygulama ID’sini kullanması gerekiyorsa onu orada ayarlayın.

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

  <Step title="Approve first DM pairing">
    Gateway çalışana kadar bekleyin, ardından Discord’da botunuza DM gönderin. Bir eşleştirme koduyla yanıt verecektir.

    <Tabs>
      <Tab title="Ask your agent">
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
Etkin iki Discord hesabı aynı bot token’ına çözümlenirse, OpenClaw bu token için yalnızca bir Gateway izleyicisi başlatır. Config kaynaklı token varsayılan env fallback’e göre önceliklidir; aksi halde ilk etkin hesap kazanır ve yinelenen hesap devre dışı olarak bildirilir.
Gelişmiş outbound çağrılar (mesaj aracı/kanal eylemleri) için, çağrı başına açık bir `token` o çağrı için kullanılır. Bu, gönderme ve okuma/probe tarzı eylemler için geçerlidir (örneğin read/search/fetch/thread/pins/permissions). Hesap ilkesi/yeniden deneme ayarları yine etkin çalışma zamanı anlık görüntüsündeki seçili hesaptan gelir.
</Note>

## Önerilen: Bir guild çalışma alanı kurun

DM’ler çalışmaya başladıktan sonra, Discord sunucunuzu her kanalın kendi bağlamına sahip kendi ajan oturumunu aldığı tam bir çalışma alanı olarak ayarlayabilirsiniz. Bu, yalnızca siz ve botunuzun bulunduğu özel sunucular için önerilir.

<Steps>
  <Step title="Add your server to the guild allowlist">
    Bu, ajanınızın yalnızca DM’lerde değil, sunucunuzdaki herhangi bir kanalda yanıt vermesini sağlar.

    <Tabs>
      <Tab title="Ask your agent">
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

  <Step title="Allow responses without @mention">
    Varsayılan olarak ajanınız guild kanallarında yalnızca @mention yapıldığında yanıt verir. Özel bir sunucu için muhtemelen her mesaja yanıt vermesini istersiniz.

    Guild kanallarında, normal asistan final yanıtları varsayılan olarak özel kalır. Görünür Discord çıktısı `message` aracıyla açıkça gönderilmelidir; böylece ajan varsayılan olarak sessizce izleyebilir ve yalnızca kanal yanıtının yararlı olduğuna karar verdiğinde gönderi paylaşır.

    <Tabs>
      <Tab title="Ask your agent">
        > "Ajanımın bu sunucuda @mention gerekmeksizin yanıt vermesine izin ver"
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

        Grup/kanal odaları için eski otomatik final yanıtlarını geri yüklemek üzere `messages.groupChat.visibleReplies: "automatic"` ayarlayın.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    Varsayılan olarak uzun süreli bellek (MEMORY.md) yalnızca DM oturumlarında yüklenir. Guild kanalları MEMORY.md dosyasını otomatik yüklemez.

    <Tabs>
      <Tab title="Ask your agent">
        > "Discord kanallarında soru sorduğumda, MEMORY.md’den uzun süreli bağlama ihtiyacın olursa memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Manual">
        Her kanalda paylaşılan bağlama ihtiyacınız varsa, kalıcı talimatları `AGENTS.md` veya `USER.md` içine koyun (her oturum için enjekte edilirler). Uzun süreli notları `MEMORY.md` içinde tutun ve gerektiğinde memory araçlarıyla bunlara erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Şimdi Discord sunucunuzda birkaç kanal oluşturun ve sohbete başlayın. Ajanınız kanal adını görebilir ve her kanal kendi izole oturumunu alır; böylece `#coding`, `#home`, `#research` veya iş akışınıza uyan herhangi bir kanalı ayarlayabilirsiniz.

## Çalışma zamanı modeli

- Gateway, Discord bağlantısının sahibidir.
- Yanıt yönlendirme deterministiktir: Discord gelen yanıtları Discord'a geri döner.
- Discord sunucu/kanal metadata'sı model istemine güvenilmeyen
  bağlam olarak eklenir, kullanıcıya görünen yanıt öneki olarak değil. Bir model bu zarfı
  geri kopyalarsa OpenClaw kopyalanan metadata'yı giden yanıtlardan ve
  gelecekteki yeniden yürütme bağlamından çıkarır.
- Varsayılan olarak (`session.dmScope=main`), doğrudan sohbetler ajan ana oturumunu paylaşır (`agent:main:main`).
- Sunucu kanalları izole oturum anahtarlarıdır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM'leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel slash komutları izole komut oturumlarında çalışır (`agent:<agentId>:discord:slash:<userId>`), ancak yönlendirilmiş konuşma oturumuna `CommandTargetSessionKey` taşımaya devam eder.
- Discord'a metin tabanlı cron/heartbeat duyuru teslimi son
  asistan-görünür yanıtı bir kez kullanır. Medya ve yapılandırılmış bileşen yükleri, ajan birden fazla teslim edilebilir yük yaydığında
  çok mesajlı kalır.

## Forum kanalları

Discord forum ve medya kanalları yalnızca konu gönderilerini kabul eder. OpenClaw bunları oluşturmanın iki yolunu destekler:

- Otomatik olarak konu oluşturmak için forum üst öğesine (`channel:<forumId>`) bir mesaj gönderin. Konu başlığı, mesajınızın ilk boş olmayan satırını kullanır.
- Doğrudan konu oluşturmak için `openclaw message thread create` kullanın. Forum kanalları için `--message-id` geçmeyin.

Örnek: konu oluşturmak için forum üst öğesine gönderin

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Örnek: açıkça bir forum konusu oluşturun

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum üst öğeleri Discord bileşenlerini kabul etmez. Bileşenlere ihtiyacınız varsa konunun kendisine gönderin (`channel:<threadId>`).

## Etkileşimli bileşenler

OpenClaw, ajan mesajları için Discord bileşen v2 kapsayıcılarını destekler. `components` yüküyle mesaj aracını kullanın. Etkileşim sonuçları normal gelen mesajlar olarak ajana geri yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Eylem satırları en fazla 5 düğmeye veya tek bir seçim menüsüne izin verir
- Seçim türleri: `string`, `user`, `role`, `mentionable`, `channel`

Varsayılan olarak bileşenler tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süreleri dolana kadar birden çok kez kullanılmasına izin vermek için `components.reusable=true` ayarlayın.

Bir düğmeye kimlerin tıklayabileceğini kısıtlamak için o düğmede `allowedUsers` ayarlayın (Discord kullanıcı ID'leri, etiketler veya `*`). Yapılandırıldığında, eşleşmeyen kullanıcılar geçici bir ret alır.

`/model` ve `/models` slash komutları; sağlayıcı, model ve uyumlu çalışma zamanı açılır listelerinin yanı sıra bir Gönder adımı içeren etkileşimli bir model seçici açar. `/models add` kullanımdan kaldırıldı ve artık modelleri sohbetten kaydetmek yerine kullanımdan kaldırma mesajı döndürür. Seçici yanıtı geçicidir ve yalnızca çağıran kullanıcı onu kullanabilir.

Dosya ekleri:

- `file` blokları bir ek referansına işaret etmelidir (`attachment://<filename>`)
- Eki `media`/`path`/`filePath` ile sağlayın (tek dosya); birden çok dosya için `media-gallery` kullanın
- Yükleme adının ek referansıyla eşleşmesi gerektiğinde onu geçersiz kılmak için `filename` kullanın

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
    `channels.discord.dmPolicy` DM erişimini denetler. `channels.discord.allowFrom` kanonik DM izin listesidir.

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    DM ilkesi açık değilse bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme istenir).

    Çok hesaplı öncelik:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesabına uygulanır.
    - Tek hesap için `allowFrom`, eski `dm.allowFrom` değerine göre önceliklidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` ve eski `dm.allowFrom` ayarlanmamışsa `channels.discord.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.discord.accounts.default.allowFrom` değerini devralmaz.

    Eski `channels.discord.dm.policy` ve `channels.discord.dm.allowFrom` uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` değerlerine taşır.

    Teslimat için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` bahsi

    Çıplak sayısal ID'ler, bir kanal varsayılanı etkin olduğunda normalde kanal ID'leri olarak çözümlenir, ancak hesabın etkin DM `allowFrom` listesinde bulunan ID'ler uyumluluk için kullanıcı DM hedefleri olarak işlenir.

  </Tab>

  <Tab title="Guild policy">
    Sunucu işleme `channels.discord.groupPolicy` tarafından denetlenir:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` mevcut olduğunda güvenli temel değer `allowlist` olur.

    `allowlist` davranışı:

    - sunucu `channels.discord.guilds` ile eşleşmelidir (`id` tercih edilir, slug kabul edilir)
    - isteğe bağlı gönderen izin listeleri: `users` (kararlı ID'ler önerilir) ve `roles` (yalnızca rol ID'leri); herhangi biri yapılandırılırsa gönderenler `users` VEYA `roles` ile eşleştiklerinde izinli olur
    - doğrudan ad/etiket eşleştirme varsayılan olarak devre dışıdır; `channels.discord.dangerouslyAllowNameMatching: true` yalnızca acil durum uyumluluk modu olarak etkinleştirilmelidir
    - `users` için adlar/etiketler desteklenir, ancak ID'ler daha güvenlidir; `openclaw security audit` ad/etiket girdileri kullanıldığında uyarır
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

    Yalnızca `DISCORD_BOT_TOKEN` ayarlar ve `channels.discord` bloğu oluşturmazsanız, çalışma zamanı yedeği `groupPolicy="allowlist"` olur (günlüklerde bir uyarıyla), `channels.defaults.groupPolicy` `open` olsa bile.

  </Tab>

  <Tab title="Mentions and group DMs">
    Sunucu mesajları varsayılan olarak bahse bağlıdır.

    Bahis algılama şunları içerir:

    - açık bot bahsi
    - yapılandırılmış bahis desenleri (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda örtük bota-yanıt davranışı

    `requireMention` sunucu/kanal başına yapılandırılır (`channels.discord.guilds...`).
    `ignoreOtherMentions`, isteğe bağlı olarak başka bir kullanıcı/rolden bahseden ancak bottan bahsetmeyen mesajları düşürür (@everyone/@here hariç).

    Grup DM'leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - `dm.groupChannels` üzerinden isteğe bağlı izin listesi (kanal ID'leri veya slug'lar)

  </Tab>
</Tabs>

### Rol tabanlı ajan yönlendirme

Discord sunucu üyelerini rol ID'sine göre farklı ajanlara yönlendirmek için `bindings[].match.roles` kullanın. Rol tabanlı bağlamalar yalnızca rol ID'lerini kabul eder ve eş/üst-eş bağlamalarından sonra, yalnızca sunucu bağlamalarından önce değerlendirilir. Bir bağlama başka eşleşme alanları da ayarlarsa (örneğin `peer` + `guildId` + `roles`), yapılandırılmış tüm alanlar eşleşmelidir.

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

## Yerel komutlar ve komut yetkilendirme

- `commands.native` varsayılan olarak `"auto"` olur ve Discord için etkindir.
- Kanal başına geçersiz kılma: `channels.discord.commands.native`.
- `commands.native=false`, daha önce kaydedilmiş Discord yerel komutlarını açıkça temizler.
- Yerel komut yetkilendirmesi, normal mesaj işlemeyle aynı Discord izin listelerini/ilkelerini kullanır.
- Komutlar, yetkili olmayan kullanıcılar için Discord kullanıcı arayüzünde hâlâ görünür olabilir; yürütme yine de OpenClaw yetkilendirmesini zorunlu kılar ve "yetkili değil" döndürür.

Komut kataloğu ve davranışı için bkz. [Slash komutları](/tr/tools/slash-commands).

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

    Not: `off`, örtük yanıt konu bağlamayı devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de uygulanır.
    `first`, örtük yerel yanıt referansını her zaman turdaki ilk giden Discord mesajına ekler.
    `batched`, Discord'un örtük yerel yanıt referansını yalnızca
    gelen tur birden çok mesajdan oluşan debounce edilmiş bir toplu işlem olduğunda ekler. Bu,
    yerel yanıtları her tek mesajlı tur için değil, esas olarak belirsiz yoğun sohbetler için istediğinizde
    kullanışlıdır.

    Mesaj ID'leri bağlam/geçmişte sunulur, böylece ajanlar belirli mesajları hedefleyebilir.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw geçici bir mesaj gönderip metin geldikçe onu düzenleyerek taslak yanıtları yayınlayabilir. `channels.discord.streaming` `off` (varsayılan) | `partial` | `block` | `progress` alır. `progress`, Discord'da `partial` değerine eşlenir; `streamMode` eski bir takma addır ve otomatik olarak taşınır.

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

    - `partial`, token'lar geldikçe tek bir önizleme mesajını düzenler.
    - `block`, taslak boyutlu parçalar yayar (boyutu ve kesme noktalarını ayarlamak için `draftChunk` kullanın, `textChunkLimit` ile sınırlandırılır).
    - Medya, hata ve açık-yanıt sonları bekleyen önizleme düzenlemelerini iptal eder.
    - `streaming.preview.toolProgress` (varsayılan `true`), araç/ilerleme güncellemelerinin önizleme mesajını yeniden kullanıp kullanmayacağını denetler.

    Önizleme yayını yalnızca metindir; medya yanıtları normal teslimata geri döner. `block` yayını açıkça etkinleştirildiğinde, OpenClaw çift yayınlamayı önlemek için önizleme yayınını atlar.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Sunucu geçmişi bağlamı:

    - `channels.discord.historyLimit` varsayılanı `20`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    DM geçmiş denetimleri:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread behavior:

    - Discord thread’leri kanal oturumları olarak yönlendirilir ve geçersiz kılınmadığı sürece üst kanal yapılandırmasını devralır.
    - Thread oturumları, üst kanalın oturum düzeyindeki `/model` seçimini yalnızca model için bir yedek olarak devralır; thread’e yerel `/model` seçimleri yine önceliklidir ve transcript devralma etkinleştirilmediği sürece üst transcript geçmişi kopyalanmaz.
    - `channels.discord.thread.inheritParent` (varsayılan `false`), yeni otomatik thread’lerin üst transcript’ten başlatılmasını seçer. Hesap başına geçersiz kılmalar `channels.discord.accounts.<id>.thread.inheritParent` altında bulunur.
    - Mesaj aracı tepkileri `user:<id>` DM hedeflerini çözümleyebilir.
    - `guilds.<guild>.channels.<channel>.requireMention: false`, yanıt aşaması etkinleştirme yedeği sırasında korunur.

    Kanal konuları **güvenilmeyen** bağlam olarak enjekte edilir. İzin listeleri, tam bir ek bağlam redaksiyonu sınırı değil, agent’ı kimin tetikleyebileceğini denetleyen kapılardır.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord, bir thread’i oturum hedefine bağlayabilir; böylece o thread’deki takip mesajları aynı oturuma yönlendirilmeye devam eder (subagent oturumları dahil).

    Komutlar:

    - `/focus <target>` mevcut/yeni thread’i bir subagent/oturum hedefine bağla
    - `/unfocus` mevcut thread bağlamasını kaldır
    - `/agents` etkin çalıştırmaları ve bağlama durumunu göster
    - `/session idle <duration|off>` odaklanmış bağlamalar için hareketsizlikte otomatik odaktan çıkarma ayarını incele/güncelle
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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Notlar:

    - `session.threadBindings.*` küresel varsayılanları ayarlar.
    - `channels.discord.threadBindings.*` Discord davranışını geçersiz kılar.
    - `sessions_spawn({ thread: true })` için thread’leri otomatik oluşturmak/bağlamak üzere `spawnSubagentSessions` true olmalıdır.
    - ACP için (`/acp spawn ... --thread ...` veya `sessions_spawn({ runtime: "acp", thread: true })`) thread’leri otomatik oluşturmak/bağlamak üzere `spawnAcpSessions` true olmalıdır.
    - Bir hesap için thread bağlamaları devre dışıysa `/focus` ve ilgili thread bağlama işlemleri kullanılamaz.

    Bkz. [Sub-agent’lar](/tr/tools/subagents), [ACP Agent’ları](/tr/tools/acp-agents) ve [Yapılandırma Referansı](/tr/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Kararlı, “her zaman açık” ACP çalışma alanları için Discord konuşmalarını hedefleyen üst düzey tipli ACP bağlamaları yapılandırın.

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

    - `/acp spawn codex --bind here`, mevcut kanalı veya thread’i yerinde bağlar ve gelecekteki mesajları aynı ACP oturumunda tutar. Thread mesajları üst kanal bağlamasını devralır.
    - Bağlı bir kanalda veya thread’de `/new` ve `/reset`, aynı ACP oturumunu yerinde sıfırlar. Geçici thread bağlamaları etkinken hedef çözümlemeyi geçersiz kılabilir.
    - `spawnAcpSessions`, yalnızca OpenClaw’ın `--thread auto|here` aracılığıyla bir alt thread oluşturması/bağlaması gerektiğinde zorunludur.

    Bağlama davranışı ayrıntıları için bkz. [ACP Agent’ları](/tr/tools/acp-agents).

  </Accordion>

  <Accordion title="Reaction notifications">
    Sunucu başına tepki bildirimi modu:

    - `off`
    - `own` (varsayılan)
    - `all`
    - `allowlist` (`guilds.<id>.users` kullanır)

    Tepki olayları sistem olaylarına dönüştürülür ve yönlendirilen Discord oturumuna eklenir.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - agent kimliği emoji yedeği (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Discord unicode emoji veya özel emoji adlarını kabul eder.
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Config writes">
    Kanal tarafından başlatılan yapılandırma yazmaları varsayılan olarak etkindir.

    Bu, `/config set|unset` akışlarını etkiler (komut özellikleri etkinleştirildiğinde).

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
    Proxy’lenmiş mesajları sistem üyesi kimliğine eşlemek için PluralKit çözümlemesini etkinleştirin:

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
    - üye görünen adları, yalnızca `channels.discord.dangerouslyAllowNameMatching: true` olduğunda ada/slug’a göre eşleştirilir
    - aramalar özgün mesaj kimliğini kullanır ve zaman penceresiyle sınırlandırılır
    - arama başarısız olursa proxy’lenmiş mesajlar bot mesajları olarak değerlendirilir ve `allowBots=true` olmadığı sürece bırakılır

  </Accordion>

  <Accordion title="Presence configuration">
    Presence güncellemeleri, bir durum veya etkinlik alanı ayarladığınızda ya da otomatik presence’ı etkinleştirdiğinizde uygulanır.

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

    Streaming örneği:

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
    - 1: Streaming (`activityUrl` gerektirir)
    - 2: Dinliyor
    - 3: İzliyor
    - 4: Özel (etkinlik metnini durum state’i olarak kullanır; emoji isteğe bağlıdır)
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

    Otomatik presence, çalışma zamanı kullanılabilirliğini Discord durumuna eşler: sağlıklı => çevrim içi, bozulmuş veya bilinmiyor => boşta, tükenmiş veya kullanılamıyor => dnd. İsteğe bağlı metin geçersiz kılmaları:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` yer tutucusunu destekler)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord, DM’lerde düğme tabanlı onay işlemeyi destekler ve isteğe bağlı olarak onay istemlerini kaynak kanala gönderebilir.

    Yapılandırma yolu:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord, `enabled` ayarlanmamış veya `"auto"` olduğunda ve `execApprovals.approvers` ya da `commands.ownerAllowFrom` üzerinden en az bir onaylayıcı çözümlenebildiğinde yerel exec onaylarını otomatik etkinleştirir. Discord, exec onaylayıcılarını kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan mesaj `defaultTo` değerlerinden çıkarım yapmaz. Discord’u yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `/diagnostics` ve `/export-trajectory` gibi hassas, yalnızca sahip grubuna açık komutlarda OpenClaw onay istemlerini ve son sonuçları özel olarak gönderir. Çağıran sahibin bir Discord sahip rotası varsa önce Discord DM’yi dener; bu kullanılamıyorsa Telegram gibi `commands.ownerAllowFrom` içindeki ilk kullanılabilir sahip rotasına geri döner.

    `target`, `channel` veya `both` olduğunda onay istemi kanalda görünür. Düğmeleri yalnızca çözümlenmiş onaylayıcılar kullanabilir; diğer kullanıcılar geçici bir ret alır. Onay istemleri komut metnini içerir, bu nedenle kanal teslimini yalnızca güvenilir kanallarda etkinleştirin. Kanal kimliği oturum anahtarından türetilemiyorsa OpenClaw DM teslimine geri döner.

    Discord, diğer sohbet kanalları tarafından kullanılan paylaşılan onay düğmelerini de işler. Yerel Discord adaptörü esas olarak onaylayıcı DM yönlendirmesi ve kanal fanout’u ekler.
    Bu düğmeler mevcut olduğunda birincil onay UX’i bunlardır; OpenClaw,
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya elle onayın tek yol olduğunu söylediğinde
    elle `/approve` komutu içermelidir.
    Discord yerel onay çalışma zamanı etkin değilse OpenClaw yerel deterministik
    `/approve <id> <decision>` istemini görünür tutar. Çalışma zamanı etkinse ancak yerel kart herhangi bir hedefe teslim edilemiyorsa
    OpenClaw, bekleyen onaydan tam `/approve`
    komutuyla aynı sohbet içinde bir yedek bildirim gönderir.

    Gateway auth ve onay çözümlemesi paylaşılan Gateway istemci sözleşmesini izler (`plugin:` kimlikleri `plugin.approval.resolve` üzerinden, diğer kimlikler `exec.approval.resolve` üzerinden çözülür). Onaylar varsayılan olarak 30 dakika sonra sona erer.

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

`event-create` eylemi, planlanmış etkinliğin kapak görselini ayarlamak için isteğe bağlı bir `image` parametresi (URL veya yerel dosya yolu) kabul eder.

Eylem kapıları `channels.discord.actions.*` altında bulunur.

Varsayılan kapı davranışı:

| Eylem grubu                                                                                                                                                             | Varsayılan  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | etkin  |
| roles                                                                                                                                                                    | devre dışı |
| moderation                                                                                                                                                               | devre dışı |
| presence                                                                                                                                                                 | devre dışı |

## Components v2 kullanıcı arayüzü

OpenClaw, exec onayları ve bağlamlar arası işaretleyiciler için Discord components v2 kullanır. Discord mesaj eylemleri özel kullanıcı arayüzü için `components` da kabul edebilir (ileri düzey; discord aracıyla bir bileşen yükü oluşturmayı gerektirir), eski embeds hâlâ kullanılabilir ancak önerilmez.

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

Discord'un iki ayrı ses yüzeyi vardır: gerçek zamanlı **ses kanalları** (sürekli konuşmalar) ve **sesli mesaj ekleri** (dalga biçimi önizleme formatı). Gateway her ikisini de destekler.

### Ses kanalları

Kurulum kontrol listesi:

1. Discord Developer Portal'da Message Content Intent'i etkinleştirin.
2. Rol/kullanıcı izin listeleri kullanıldığında Server Members Intent'i etkinleştirin.
3. Botu `bot` ve `applications.commands` kapsamlarıyla davet edin.
4. Hedef ses kanalında Connect, Speak, Send Messages ve Read Message History izinlerini verin.
5. Yerel komutları (`commands.native` veya `channels.discord.commands.native`) etkinleştirin.
6. `channels.discord.voice` yapılandırmasını ayarlayın.

Oturumları kontrol etmek için `/vc join|leave|status` kullanın. Komut, hesabın varsayılan ajanını kullanır ve diğer Discord komutlarıyla aynı izin listesi ve grup ilkesi kurallarını izler.

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
- `voice.model`, yalnızca Discord ses kanalı yanıtları için kullanılan LLM'yi geçersiz kılar. Yönlendirilen ajan modelini devralmak için ayarlamayın.
- STT `tools.media.audio` kullanır; `voice.model` transkripsiyonu etkilemez.
- Ses transkripti turları sahip durumunu Discord `allowFrom` (veya `dm.allowFrom`) değerinden türetir; sahip olmayan konuşmacılar yalnızca sahip araçlarına erişemez (örneğin `gateway` ve `cron`).
- Ses varsayılan olarak etkindir; ses çalışma zamanını ve `GuildVoiceStates` Gateway intent'ini devre dışı bırakmak için `channels.discord.voice.enabled=false` ayarlayın.
- `channels.discord.intents.voiceStates`, ses durumu intent aboneliğini açıkça geçersiz kılabilir. Intent'in `voice.enabled` değerini izlemesi için ayarlamayın.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` katılma seçeneklerine iletilir.
- Ayarlanmadığında `@discordjs/voice` varsayılanları `daveEncryption=true` ve `decryptionFailureTolerance=24` olur.
- OpenClaw ayrıca alma şifre çözme hatalarını izler ve kısa bir zaman aralığında tekrarlanan hatalardan sonra ses kanalından ayrılıp yeniden katılarak otomatik kurtarma yapar.
- Güncellemeden sonra alma logları tekrar tekrar `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` gösterirse, bir bağımlılık raporu ve logları toplayın. Pakete dahil edilen `@discordjs/voice` sürümü, discord.js PR #11449'daki üst kaynak dolgu düzeltmesini içerir; bu düzeltme discord.js issue #11419'u kapatmıştır.

Ses kanalı işlem hattı:

- Discord PCM yakalaması geçici bir WAV dosyasına dönüştürülür.
- `tools.media.audio` STT'yi işler, örneğin `openai/gpt-4o-mini-transcribe`.
- Transkript normal Discord giriş ve yönlendirme akışından geçirilir.
- `voice.model` ayarlandığında, yalnızca bu ses kanalı turu için yanıt LLM'sini geçersiz kılar.
- `voice.tts`, `messages.tts` üzerine birleştirilir; ortaya çıkan ses katılınan kanalda oynatılır.

Kimlik bilgileri bileşen bazında çözümlenir: `voice.model` için LLM rota kimlik doğrulaması, `tools.media.audio` için STT kimlik doğrulaması ve `messages.tts`/`voice.tts` için TTS kimlik doğrulaması.

### Sesli mesajlar

Discord sesli mesajları bir dalga biçimi önizlemesi gösterir ve OGG/Opus ses gerektirir. OpenClaw dalga biçimini otomatik olarak oluşturur, ancak inceleme ve dönüştürme için Gateway ana makinesinde `ffmpeg` ve `ffprobe` gerekir.

- Bir **yerel dosya yolu** sağlayın (URL'ler reddedilir).
- Metin içeriği eklemeyin (Discord aynı yükte metin + sesli mesajı reddeder).
- Herhangi bir ses formatı kabul edilir; OpenClaw gerektiğinde OGG/Opus'a dönüştürür.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="İzin verilmeyen intent'ler kullanıldı veya bot sunucu mesajlarını görmüyor">

    - Message Content Intent'i etkinleştirin
    - kullanıcı/üye çözümlemesine bağlıysanız Server Members Intent'i etkinleştirin
    - intent'leri değiştirdikten sonra Gateway'i yeniden başlatın

  </Accordion>

  <Accordion title="Sunucu mesajları beklenmedik şekilde engellendi">

    - `groupPolicy` değerini doğrulayın
    - `channels.discord.guilds` altındaki sunucu izin listesini doğrulayın
    - sunucu `channels` haritası varsa, yalnızca listelenen kanallara izin verilir
    - `requireMention` davranışını ve bahsetme kalıplarını doğrulayın

    Yararlı kontroller:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Bahsetme gereksinimi false ama hâlâ engelleniyor">
    Yaygın nedenler:

    - eşleşen sunucu/kanal izin listesi olmadan `groupPolicy="allowlist"`
    - `requireMention` yanlış yerde yapılandırılmış (`channels.discord.guilds` veya kanal girdisi altında olmalıdır)
    - gönderen, sunucu/kanal `users` izin listesi tarafından engellenmiş

  </Accordion>

  <Accordion title="Uzun süren Discord turları veya yinelenen yanıtlar">

    Tipik loglar:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway kuyruk ayarları:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çok hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - bu yalnızca Discord Gateway dinleyici çalışmasını kontrol eder, ajan turu ömrünü değil

    Discord, kuyruğa alınmış ajan turlarına kanala ait bir zaman aşımı uygulamaz. Mesaj dinleyicileri hemen devreder ve kuyruğa alınmış Discord çalıştırmaları, oturum/araç/çalışma zamanı yaşam döngüsü işi tamamlayana veya iptal edene kadar oturum başına sıralamayı korur.

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
    OpenClaw bağlanmadan önce Discord `/gateway/bot` meta verisini getirir. Geçici hatalarda Discord'un varsayılan Gateway URL'sine geri düşülür ve loglarda hız sınırlaması uygulanır.

    Meta veri zaman aşımı ayarları:

    - tek hesap: `channels.discord.gatewayInfoTimeoutMs`
    - çok hesap: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - yapılandırma ayarlı değilken ortam değişkeni geri dönüşü: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - varsayılan: `30000` (30 saniye), maksimum: `120000`

  </Accordion>

  <Accordion title="İzin denetimi uyuşmazlıkları">
    `channels status --probe` izin kontrolleri yalnızca sayısal kanal ID'leriyle çalışır.

    Slug anahtarları kullanırsanız, çalışma zamanı eşleştirmesi hâlâ çalışabilir, ancak probe izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM ve eşleştirme sorunları">

    - DM devre dışı: `channels.discord.dm.enabled=false`
    - DM ilkesi devre dışı: `channels.discord.dmPolicy="disabled"` (eski: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Botlar arası döngüler">
    Varsayılan olarak bot tarafından yazılan mesajlar yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız, döngü davranışını önlemek için katı bahsetme ve izin listesi kuralları kullanın.
    Yalnızca bottan bahseden bot mesajlarını kabul etmek için `channels.discord.allowBots="mentions"` tercih edin.

  </Accordion>

  <Accordion title="DecryptionFailed(...) nedeniyle ses STT kesintileri">

    - Discord ses alımı kurtarma mantığının mevcut olması için OpenClaw'ı güncel tutun (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` değerini doğrulayın (varsayılan)
    - başlangıç olarak `channels.discord.voice.decryptionFailureTolerance=24` (üst kaynak varsayılanı) kullanın ve yalnızca gerekiyorsa ayarlayın
    - loglarda şunları izleyin:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - otomatik yeniden katılmadan sonra hatalar sürerse, logları toplayın ve [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) ile [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) içindeki üst kaynak DAVE alma geçmişiyle karşılaştırın

  </Accordion>
</AccordionGroup>

## Yapılandırma referansı

Birincil referans: [Yapılandırma referansı - Discord](/tr/gateway/config-channels#discord).

<Accordion title="Önemli Discord alanları">

- başlatma/kimlik doğrulama: `enabled`, `token`, `accounts.*`, `allowBots`
- ilke: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- komut: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- olay kuyruğu: `eventQueue.listenerTimeout` (dinleyici bütçesi), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway meta verisi: `gatewayInfoTimeoutMs`
- yanıt/geçmiş: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- iletim: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- akış: `streaming` (eski diğer ad: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medya/yeniden deneme: `mediaMaxMb` (giden Discord yüklemelerini sınırlar, varsayılan `100MB`), `retry`
- eylemler: `actions.*`
- varlık: `activity`, `status`, `activityType`, `activityUrl`
- kullanıcı arayüzü: `ui.components.accentColor`
- özellikler: `threadBindings`, üst düzey `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Güvenlik ve operasyonlar

- Bot tokenlarını gizli bilgi olarak ele alın (denetimli ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- En az ayrıcalıklı Discord izinlerini verin.
- Komut dağıtımı/durumu güncel değilse, Gateway'i yeniden başlatın ve `openclaw channels status --probe` ile yeniden kontrol edin.

## İlgili

<CardGroup cols={2}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bir Discord kullanıcısını Gateway ile eşleştirin.
  </Card>
  <Card title="Gruplar" icon="users" href="/tr/channels/groups">
    Grup sohbeti ve izin verilenler listesi davranışı.
  </Card>
  <Card title="Kanal yönlendirme" icon="route" href="/tr/channels/channel-routing">
    Gelen mesajları ajanlara yönlendirin.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve güçlendirme.
  </Card>
  <Card title="Çok ajanlı yönlendirme" icon="sitemap" href="/tr/concepts/multi-agent">
    Guild'leri ve kanalları ajanlarla eşleyin.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı.
  </Card>
</CardGroup>
