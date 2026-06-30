---
read_when:
    - Discord kanal özellikleri üzerinde çalışma
summary: Discord bot destek durumu, yetenekleri ve yapılandırması
title: Discord
x-i18n:
    generated_at: "2026-06-30T14:19:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74244c721bfd752bf4ce73a6739503c902a14d07edef5ca6300c87f717669a7e
    source_path: channels/discord.md
    workflow: 16
---

Discord'un resmi Gateway'i üzerinden DM'ler ve sunucu kanalları için hazır.

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

Bot içeren yeni bir uygulama oluşturmanız, botu sunucunuza eklemeniz ve OpenClaw ile eşleştirmeniz gerekir. Botunuzu kendi özel sunucunuza eklemenizi öneririz. Henüz bir sunucunuz yoksa [önce bir tane oluşturun](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** seçeneğini seçin).

<Steps>
  <Step title="Bir Discord uygulaması ve bot oluşturun">
    [Discord Developer Portal](https://discord.com/developers/applications) adresine gidin ve **New Application** öğesine tıklayın. "OpenClaw" gibi bir ad verin.

    Kenar çubuğunda **Bot** öğesine tıklayın. **Username** değerini OpenClaw ajanınıza verdiğiniz ad olarak ayarlayın.

  </Step>

  <Step title="Ayrıcalıklı intent'leri etkinleştirin">
    Hâlâ **Bot** sayfasındayken **Privileged Gateway Intents** bölümüne kaydırın ve şunları etkinleştirin:

    - **Message Content Intent** (gerekli)
    - **Server Members Intent** (önerilir; rol izin listeleri ve ad-ID eşleştirmesi için gereklidir)
    - **Presence Intent** (isteğe bağlı; yalnızca varlık güncellemeleri için gerekir)

  </Step>

  <Step title="Bot token'ınızı kopyalayın">
    **Bot** sayfasında tekrar yukarı kaydırın ve **Reset Token** öğesine tıklayın.

    <Note>
    Adına rağmen bu, ilk token'ınızı oluşturur; hiçbir şey "sıfırlanmıyor."
    </Note>

    Token'ı kopyalayın ve bir yere kaydedin. Bu sizin **Bot Token** değerinizdir ve kısa süre içinde buna ihtiyacınız olacak.

  </Step>

  <Step title="Bir davet URL'si oluşturun ve botu sunucunuza ekleyin">
    Kenar çubuğunda **OAuth2** öğesine tıklayın. Botu sunucunuza eklemek için doğru izinlere sahip bir davet URL'si oluşturacaksınız.

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

    Bu, normal metin kanalları için temel kümedir. Forum veya medya kanalı iş akışları dahil olmak üzere bir ileti dizisi oluşturan ya da sürdüren Discord ileti dizilerinde paylaşım yapmayı planlıyorsanız **Send Messages in Threads** seçeneğini de etkinleştirin.
    Altta oluşturulan URL'yi kopyalayın, tarayıcınıza yapıştırın, sunucunuzu seçin ve bağlanmak için **Continue** öğesine tıklayın. Artık botunuzu Discord sunucusunda görmelisiniz.

  </Step>

  <Step title="Geliştirici Modu'nu etkinleştirin ve ID'lerinizi toplayın">
    Discord uygulamasına geri dönün; dahili ID'leri kopyalayabilmek için Geliştirici Modu'nu etkinleştirmeniz gerekir.

    1. **User Settings** öğesine tıklayın (avatarınızın yanındaki dişli simgesi) → Kenar çubuğunda **Developer** bölümüne kaydırın → **Developer Mode** seçeneğini açın

        *(Not: Discord mobil uygulamasında Geliştirici Modu, **App Settings** → **Advanced** altında bulunur)*

    2. Kenar çubuğundaki **sunucu simgenize** sağ tıklayın → **Copy Server ID**
    3. **Kendi avatarınıza** sağ tıklayın → **Copy User ID**

    **Server ID** ve **User ID** değerlerinizi Bot Token'ınızla birlikte kaydedin; sonraki adımda üçünü de OpenClaw'a göndereceksiniz.

  </Step>

  <Step title="Sunucu üyelerinden gelen DM'lere izin verin">
    Eşleştirmenin çalışması için Discord'un botunuzun size DM göndermesine izin vermesi gerekir. **Sunucu simgenize** sağ tıklayın → **Privacy Settings** → **Direct Messages** seçeneğini açın.

    Bu, sunucu üyelerinin (botlar dahil) size DM göndermesine izin verir. OpenClaw ile Discord DM'lerini kullanmak istiyorsanız bunu etkin bırakın. Yalnızca sunucu kanallarını kullanmayı planlıyorsanız eşleştirmeden sonra DM'leri devre dışı bırakabilirsiniz.

  </Step>

  <Step title="Bot token'ınızı güvenli şekilde ayarlayın (sohbette göndermeyin)">
    Discord bot token'ınız bir sırdır (parola gibi). Ajanınıza mesaj göndermeden önce bunu OpenClaw'ı çalıştıran makinede ayarlayın.

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
    Yönetilen hizmet kurulumlarında, `DISCORD_BOT_TOKEN` değerinin mevcut olduğu bir shell'den `openclaw gateway install` çalıştırın veya değişkeni `~/.openclaw/.env` içinde saklayın; böylece hizmet yeniden başlatmadan sonra env SecretRef değerini çözebilir.
    Ana makineniz Discord'un başlangıç uygulaması araması tarafından engellenirse veya hız sınırına takılırsa, başlangıcın bu REST çağrısını atlayabilmesi için Developer Portal'dan Discord uygulama/istemci ID'sini ayarlayın. Varsayılan hesap için `channels.discord.applicationId` kullanın veya birden fazla Discord botu çalıştırıyorsanız `channels.discord.accounts.<accountId>.applicationId` kullanın.

  </Step>

  <Step title="OpenClaw'ı yapılandırın ve eşleştirin">

    <Tabs>
      <Tab title="Ajanınıza sorun">
        Mevcut herhangi bir kanalda (ör. Telegram) OpenClaw ajanınızla sohbet edin ve ona söyleyin. Discord ilk kanalınızsa bunun yerine CLI / yapılandırma sekmesini kullanın.

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

        Betikli veya uzak kurulum için aynı JSON5 bloğunu `openclaw config patch --file ./discord.patch.json5 --dry-run` ile yazın ve ardından `--dry-run` olmadan yeniden çalıştırın. Düz metin `token` değerleri desteklenir. SecretRef değerleri de env/file/exec sağlayıcıları genelinde `channels.discord.token` için desteklenir. Bkz. [Sır Yönetimi](/tr/gateway/secrets).

        Birden fazla Discord botu için her bot token'ını ve uygulama ID'sini kendi hesabı altında tutun. Üst düzey bir `channels.discord.applicationId` hesaplar tarafından devralınır; bu nedenle onu yalnızca her hesabın aynı uygulama ID'sini kullanması gerektiğinde orada ayarlayın.

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
    Gateway çalışana kadar bekleyin, ardından Discord'da botunuza DM gönderin. Size bir eşleştirme koduyla yanıt verecektir.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        Eşleştirme kodunu mevcut kanalınızdaki ajanınıza gönderin:

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
Token çözümleme hesap farkındadır. Yapılandırma token değerleri env yedeğine göre önceliklidir. `DISCORD_BOT_TOKEN` yalnızca varsayılan hesap için kullanılır.
Etkinleştirilmiş iki Discord hesabı aynı bot token'ına çözülürse OpenClaw bu token için yalnızca bir Gateway izleyicisi başlatır. Yapılandırma kaynaklı token, varsayılan env yedeğine göre önceliklidir; aksi takdirde ilk etkin hesap öncelik kazanır ve yinelenen hesap devre dışı olarak raporlanır.
Gelişmiş giden çağrılar (mesaj aracı/kanal eylemleri) için açık bir çağrı başına `token` o çağrı için kullanılır. Bu, gönderme ve okuma/probe tarzı eylemler için geçerlidir (örneğin read/search/fetch/thread/pins/permissions). Hesap ilkesi/yeniden deneme ayarları yine de etkin çalışma zamanı anlık görüntüsündeki seçili hesaptan gelir.
</Note>

## Önerilen: Bir sunucu çalışma alanı kurun

DM'ler çalışmaya başladıktan sonra Discord sunucunuzu, her kanalın kendi bağlamıyla kendi ajan oturumunu aldığı tam bir çalışma alanı olarak ayarlayabilirsiniz. Bu, yalnızca sizin ve botunuzun bulunduğu özel sunucular için önerilir.

<Steps>
  <Step title="Sunucunuzu sunucu izin listesine ekleyin">
    Bu, ajanınızın yalnızca DM'lerde değil, sunucunuzdaki herhangi bir kanalda yanıt vermesini sağlar.

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
    Varsayılan olarak ajanınız sunucu kanallarında yalnızca @mention edildiğinde yanıt verir. Özel bir sunucuda muhtemelen her mesaja yanıt vermesini istersiniz.

    Sunucu kanallarında normal yanıtlar varsayılan olarak otomatik paylaşılır. Paylaşılan sürekli açık odalarda `messages.groupChat.visibleReplies: "message_tool"` seçeneğini etkinleştirerek ajanın sessizce izlemesini ve yalnızca kanal yanıtının yararlı olduğuna karar verdiğinde paylaşım yapmasını sağlayın. Bu, GPT 5.5 gibi en yeni nesil, araç açısından güvenilir modellerle en iyi sonucu verir. Ortam oda olayları, araç göndermediği sürece sessiz kalır. Tam izleme modu yapılandırması için [Ortam oda olayları](/tr/channels/ambient-room-events) bölümüne bakın.

    Discord yazıyor göstergesi gösteriyor ve günlükler token kullanımını gösteriyor ama mesaj paylaşılmıyorsa turun bir ortam oda olayı olarak yapılandırılıp yapılandırılmadığını veya message-tool görünür yanıtlarının etkinleştirilip etkinleştirilmediğini kontrol edin.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        > "Ajanımın bu sunucuda @mentioned olmak zorunda kalmadan yanıt vermesine izin ver"
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

        Görünür grup/kanal yanıtları için message-tool gönderimlerini zorunlu kılmak üzere `messages.groupChat.visibleReplies: "message_tool"` ayarlayın.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Sunucu kanallarında bellek için plan yapın">
    Varsayılan olarak uzun vadeli bellek (MEMORY.md) yalnızca DM oturumlarında yüklenir. Sunucu kanalları MEMORY.md dosyasını otomatik yüklemez.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        > "Discord kanallarında soru sorduğumda, MEMORY.md içinden uzun vadeli bağlama ihtiyacın olursa memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Manuel">
        Her kanalda paylaşılan bağlama ihtiyacınız varsa kararlı yönergeleri `AGENTS.md` veya `USER.md` içine koyun (bunlar her oturuma enjekte edilir). Uzun vadeli notları `MEMORY.md` içinde tutun ve gerektiğinde bellek araçlarıyla erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Şimdi Discord sunucunuzda bazı kanallar oluşturun ve sohbet etmeye başlayın. Ajanınız kanal adını görebilir ve her kanal kendi yalıtılmış oturumunu alır; böylece iş akışınıza uyan `#coding`, `#home`, `#research` veya başka herhangi bir şeyi ayarlayabilirsiniz.

## Çalışma zamanı modeli

- Gateway, Discord bağlantısının sahibidir.
- Yanıt yönlendirmesi deterministiktir: Discord’dan gelen yanıtlar Discord’a geri döner.
- Discord sunucu/kanal meta verileri, kullanıcıya görünür bir yanıt öneki olarak değil, güvenilmeyen
  bağlam olarak model istemine eklenir. Bir model bu zarfı
  geri kopyalarsa, OpenClaw kopyalanan meta verileri giden yanıtlardan ve
  gelecekteki yeniden oynatma bağlamından çıkarır.
- Varsayılan olarak (`session.dmScope=main`), doğrudan sohbetler aracı ana oturumunu paylaşır (`agent:main:main`).
- Sunucu kanalları yalıtılmış oturum anahtarlarıdır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM’leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel slash komutları yalıtılmış komut oturumlarında çalışır (`agent:<agentId>:discord:slash:<userId>`), ancak yönlendirilen konuşma oturumuna `CommandTargetSessionKey` taşımaya devam eder.
- Discord’a metin tabanlı cron/Heartbeat duyuru teslimi, son
  asistanın görebildiği yanıtı bir kez kullanır. Medya ve yapılandırılmış bileşen yükleri,
  aracı birden çok teslim edilebilir yük yaydığında
  çok iletili kalır.

## Forum kanalları

Discord forum ve medya kanalları yalnızca başlık gönderilerini kabul eder. OpenClaw bunları oluşturmak için iki yolu destekler:

- Otomatik olarak başlık oluşturmak için forum üst öğesine (`channel:<forumId>`) bir ileti gönderin. Başlık adı, iletinizin ilk boş olmayan satırını kullanır.
- Doğrudan başlık oluşturmak için `openclaw message thread create` kullanın. Forum kanalları için `--message-id` geçirmeyin.

Örnek: başlık oluşturmak için forum üst öğesine gönderme

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Örnek: açıkça bir forum başlığı oluşturma

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum üst öğeleri Discord bileşenlerini kabul etmez. Bileşenlere ihtiyacınız varsa başlığın kendisine gönderin (`channel:<threadId>`).

## Etkileşimli bileşenler

OpenClaw, aracı iletileri için Discord bileşenleri v2 kapsayıcılarını destekler. İleti aracını bir `components` yüküyle kullanın. Etkileşim sonuçları aracıya normal gelen iletiler olarak geri yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Eylem satırları en fazla 5 düğmeye veya tek bir seçim menüsüne izin verir
- Seçim türleri: `string`, `user`, `role`, `mentionable`, `channel`

Varsayılan olarak bileşenler tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süreleri dolana kadar birden çok kez kullanılmasına izin vermek için `components.reusable=true` ayarlayın.

Bir düğmeye kimin tıklayabileceğini kısıtlamak için o düğmede `allowedUsers` ayarlayın (Discord kullanıcı kimlikleri, etiketler veya `*`). Yapılandırıldığında, eşleşmeyen kullanıcılar geçici bir ret alır.

Bileşen geri çağrılarının süresi varsayılan olarak 30 dakika sonra dolar. Varsayılan Discord hesabı için bu geri çağrı kayıt defteri ömrünü değiştirmek üzere `channels.discord.agentComponents.ttlMs` ayarlayın veya çok hesaplı kurulumda bir hesabı geçersiz kılmak için `channels.discord.accounts.<accountId>.agentComponents.ttlMs` ayarlayın. Değer milisaniye cinsindedir, pozitif bir tam sayı olmalıdır ve `86400000` (24 saat) ile sınırlıdır. Daha uzun TTL’ler, düğmelerin kullanılabilir kalmasını gerektiren inceleme veya onay iş akışları için yararlıdır, ancak eski bir Discord iletisinin hâlâ bir eylemi tetikleyebileceği pencereyi de uzatır. İş akışına uyan en kısa TTL’yi tercih edin ve eski geri çağrılar şaşırtıcı olacaksa varsayılanı koruyun.

`/model` ve `/models` slash komutları, sağlayıcı, model ve uyumlu çalışma zamanı açılır menülerinin yanı sıra bir Gönder adımı içeren etkileşimli bir model seçici açar. `/models add` kullanımdan kaldırılmıştır ve artık sohbetten model kaydetmek yerine bir kullanımdan kaldırma iletisi döndürür. Seçici yanıtı geçicidir ve yalnızca çağıran kullanıcı bunu kullanabilir. Discord seçim menüleri 25 seçenekle sınırlıdır; bu nedenle seçicinin dinamik olarak keşfedilen modelleri yalnızca `openai` veya `vllm` gibi seçili sağlayıcılar için göstermesini istediğinizde `agents.defaults.models` içine `provider/*` girdileri ekleyin.

Dosya ekleri:

- `file` blokları bir ek referansına işaret etmelidir (`attachment://<filename>`)
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
    `channels.discord.dmPolicy`, DM erişimini denetler. `channels.discord.allowFrom`, kanonik DM izin listesidir.

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    DM ilkesi açık değilse bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme için yönlendirilir).

    Çok hesaplı öncelik:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesabına uygulanır.
    - Tek bir hesap için `allowFrom`, eski `dm.allowFrom` üzerinde önceliklidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` ve eski `dm.allowFrom` değerleri ayarlanmamışsa `channels.discord.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.discord.accounts.default.allowFrom` değerini devralmaz.

    Eski `channels.discord.dm.policy` ve `channels.discord.dm.allowFrom` uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` değerlerine taşır.

    Teslim için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` bahsi

    Çıplak sayısal kimlikler normalde bir kanal varsayılanı etkin olduğunda kanal kimlikleri olarak çözümlenir, ancak hesabın etkili DM `allowFrom` listesinde yer alan kimlikler uyumluluk için kullanıcı DM hedefleri olarak ele alınır.

  </Tab>

  <Tab title="Access groups">
    Discord DM’leri ve metin komutu yetkilendirmesi, `channels.discord.allowFrom` içinde dinamik `accessGroup:<name>` girdilerini kullanabilir.

    Erişim grubu adları ileti kanalları arasında paylaşılır. Üyeleri her kanalın normal `allowFrom` söz diziminde ifade edilen statik bir grup için `type: "message.senders"` kullanın veya bir Discord kanalının geçerli `ViewChannel` kitlesinin üyeliği dinamik olarak tanımlaması gerektiğinde `type: "discord.channelAudience"` kullanın. Paylaşılan erişim grubu davranışı burada belgelenmiştir: [Erişim grupları](/tr/channels/access-groups).

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

    Bir Discord metin kanalının ayrı bir üye listesi yoktur. `type: "discord.channelAudience"` üyeliği şu şekilde modeller: DM gönderen, yapılandırılmış sunucunun bir üyesidir ve rol ve kanal üzerine yazmaları uygulandıktan sonra yapılandırılmış kanalda şu anda etkili `ViewChannel` iznine sahiptir.

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

    Aramalar kapalı varsayılanla başarısız olur. Discord `Missing Access` döndürürse, üye araması başarısız olursa veya kanal farklı bir sunucuya aitse, DM gönderen yetkisiz olarak ele alınır.

    Kanal kitlesi erişim grupları kullanırken bot için Discord Developer Portal **Server Members Intent** seçeneğini etkinleştirin. DM’ler sunucu üye durumu içermez, bu nedenle OpenClaw yetkilendirme sırasında üyeyi Discord REST üzerinden çözümler.

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
    - doğrudan ad/etiket eşleştirme varsayılan olarak devre dışıdır; `channels.discord.dangerouslyAllowNameMatching: true` değerini yalnızca acil durum uyumluluk modu olarak etkinleştirin
    - `users` için adlar/etiketler desteklenir, ancak kimlikler daha güvenlidir; ad/etiket girdileri kullanıldığında `openclaw security audit` uyarır
    - bir sunucuda `channels` yapılandırılmışsa listelenmeyen kanallar reddedilir
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

    Yalnızca `DISCORD_BOT_TOKEN` ayarlayıp bir `channels.discord` bloğu oluşturmazsanız, çalışma zamanı geri dönüşü `groupPolicy="allowlist"` olur (günlüklerde bir uyarıyla), `channels.defaults.groupPolicy` `open` olsa bile.

  </Tab>

  <Tab title="Mentions and group DMs">
    Sunucu iletileri varsayılan olarak bahis geçidine tabidir.

    Bahis algılama şunları içerir:

    - açık bot bahsi
    - yapılandırılmış bahis desenleri (`agents.list[].groupChat.mentionPatterns`, geri dönüş `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda örtük bota-yanıt davranışı

    Giden Discord iletileri yazarken kanonik bahis söz dizimini kullanın: kullanıcılar için `<@USER_ID>`, kanallar için `<#CHANNEL_ID>` ve roller için `<@&ROLE_ID>`. Eski `<@!USER_ID>` takma ad bahis biçimini kullanmayın.

    `requireMention`, sunucu/kanal başına yapılandırılır (`channels.discord.guilds...`).
    `ignoreOtherMentions`, isteğe bağlı olarak botu değil başka bir kullanıcıyı/rolü anan iletileri bırakır (@everyone/@here hariç).

    Grup DM’leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - `dm.groupChannels` aracılığıyla isteğe bağlı izin listesi (kanal kimlikleri veya slug’lar)

  </Tab>
</Tabs>

### Rol tabanlı aracı yönlendirmesi

Discord guild üyelerini rol kimliğine göre farklı ajanlara yönlendirmek için `bindings[].match.roles` kullanın. Rol tabanlı bağlamalar yalnızca rol kimliklerini kabul eder ve eş veya üst-eş bağlamalarından sonra, yalnızca guild bağlamalarından önce değerlendirilir. Bir bağlama başka eşleşme alanları da ayarlarsa (örneğin `peer` + `guildId` + `roles`), yapılandırılan tüm alanlar eşleşmelidir.

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

- `commands.native` varsayılan olarak `"auto"` değerindedir ve Discord için etkindir.
- Kanal başına geçersiz kılma: `channels.discord.commands.native`.
- `commands.native=false`, başlangıç sırasında Discord slash-command kaydını ve temizliğini atlar. Daha önce kaydedilmiş komutlar, siz onları Discord uygulamasından kaldırana kadar Discord içinde görünür kalabilir.
- Yerel komut yetkilendirmesi, normal ileti işleme ile aynı Discord izin listelerini/ilkelerini kullanır.
- Komutlar, yetkili olmayan kullanıcılar için Discord kullanıcı arayüzünde hâlâ görünür olabilir; yürütme yine de OpenClaw yetkilendirmesini uygular ve "yetkili değil" döndürür.

Komut kataloğu ve davranışı için [Slash komutları](/tr/tools/slash-commands) bölümüne bakın.

Varsayılan slash komut ayarları:

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

    Not: `off`, örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.
    `first`, dönüş için ilk giden Discord iletisine örtük yerel yanıt referansını her zaman ekler.
    `batched`, Discord'un örtük yerel yanıt referansını yalnızca gelen olay
    birden çok iletiden oluşan debounce uygulanmış bir toplu işlem olduğunda ekler. Bu,
    yerel yanıtları her tek iletili dönüşte değil, özellikle belirsiz ve ani sohbetler için
    istediğinizde kullanışlıdır.

    İleti kimlikleri, ajanların belirli iletileri hedefleyebilmesi için bağlam/geçmiş içinde sunulur.

  </Accordion>

  <Accordion title="Bağlantı önizlemeleri">
    Discord, URL'ler için varsayılan olarak zengin bağlantı gömmeleri oluşturur. OpenClaw, giden Discord iletilerinde bu oluşturulan gömmeleri varsayılan olarak bastırır; böylece ajan tarafından gönderilen URL'ler, siz açıkça etkinleştirmedikçe düz bağlantılar olarak kalır:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Bir hesabı geçersiz kılmak için `channels.discord.accounts.<id>.suppressEmbeds` değerini ayarlayın. Ajan ileti aracı gönderimleri, tek bir ileti için `suppressEmbeds: false` de geçebilir. Açık Discord `embeds` yükleri, varsayılan bağlantı önizleme ayarı tarafından bastırılmaz.

  </Accordion>

  <Accordion title="Canlı akış önizlemesi">
    OpenClaw, geçici bir ileti gönderip metin geldikçe onu düzenleyerek taslak yanıtları akışla verebilir. `channels.discord.streaming`, `off` | `partial` | `block` | `progress` (varsayılan) değerlerini alır. `progress`, düzenlenebilir tek bir durum taslağını tutar ve nihai teslimata kadar araç ilerlemesiyle günceller; paylaşılan başlangıç etiketi kayan bir satırdır, bu nedenle yeterli iş göründüğünde geri kalanı gibi kayıp gider. `streamMode` eski bir çalışma zamanı takma adıdır. Kalıcı yapılandırmayı kanonik anahtara yeniden yazmak için `openclaw doctor --fix` çalıştırın.

    Discord önizleme düzenlemelerini devre dışı bırakmak için `channels.discord.streaming.mode` değerini `off` olarak ayarlayın. Discord blok akışı açıkça etkinleştirilmişse, OpenClaw çift akışı önlemek için önizleme akışını atlar.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `partial`, tokenlar geldikçe tek bir önizleme iletisini düzenler.
    - `block`, taslak boyutunda parçalar yayar (boyutu ve kırılma noktalarını ayarlamak için `draftChunk` kullanın; `textChunkLimit` ile sınırlandırılır).
    - Medya, hata ve açık yanıt finalleri bekleyen önizleme düzenlemelerini iptal eder.
    - `streaming.preview.toolProgress` (varsayılan `true`), araç/ilerleme güncellemelerinin önizleme iletisini yeniden kullanıp kullanmayacağını denetler.
    - Araç/ilerleme satırları, kullanılabilir olduğunda kompakt emoji + başlık + ayrıntı olarak işlenir; örneğin `🛠️ Bash: run tests` veya `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (varsayılan `false`), geçici ilerleme taslağında asistan yorum/açılış metnini etkinleştirir. Yorum görüntülemeden önce temizlenir, geçici kalır ve nihai yanıt teslimatını değiştirmez.
    - `streaming.progress.maxLineChars`, satır başına ilerleme önizleme bütçesini denetler. Düzyazı sözcük sınırlarında kısaltılır; komut ve yol ayrıntıları kullanışlı son ekleri korur.
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

    Önizleme akışı yalnızca metindir; medya yanıtları normal teslimata geri döner. `block` akışı açıkça etkinleştirildiğinde, OpenClaw çift akışı önlemek için önizleme akışını atlar.

  </Accordion>

  <Accordion title="Geçmiş, bağlam ve iş parçacığı davranışı">
    Guild geçmişi bağlamı:

    - `channels.discord.historyLimit` varsayılan `20`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    DM geçmiş denetimleri:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    İş parçacığı davranışı:

    - Discord iş parçacıkları kanal oturumları olarak yönlendirilir ve geçersiz kılınmadıkça üst kanal yapılandırmasını devralır.
    - İş parçacığı oturumları, üst kanalın oturum düzeyi `/model` seçimini yalnızca model için yedek olarak devralır; iş parçacığına yerel `/model` seçimleri yine de önceliklidir ve transkript devralma etkinleştirilmediği sürece üst transkript geçmişi kopyalanmaz.
    - `channels.discord.thread.inheritParent` (varsayılan `false`), yeni otomatik iş parçacıklarının üst transkriptten tohumlanmasını etkinleştirir. Hesap başına geçersiz kılmalar `channels.discord.accounts.<id>.thread.inheritParent` altında bulunur.
    - İleti aracı tepkileri `user:<id>` DM hedeflerini çözebilir.
    - `guilds.<guild>.channels.<channel>.requireMention: false`, yanıt aşaması etkinleştirme yedeği sırasında korunur.

    Kanal konuları **güvenilmeyen** bağlam olarak enjekte edilir. İzin listeleri, ajanı kimin tetikleyebileceğini belirler; tam bir ek bağlam redaksiyon sınırı değildir.

  </Accordion>

  <Accordion title="Alt ajanlar için iş parçacığına bağlı oturumlar">
    Discord, bir iş parçacığını oturum hedefine bağlayabilir; böylece o iş parçacığındaki takip iletileri aynı oturuma yönlendirilmeye devam eder (alt ajan oturumları dahil).

    Komutlar:

    - `/focus <target>` mevcut/yeni iş parçacığını bir alt ajan/oturum hedefine bağla
    - `/unfocus` mevcut iş parçacığı bağlamasını kaldır
    - `/agents` etkin çalıştırmaları ve bağlama durumunu göster
    - `/session idle <duration|off>` odaklanmış bağlamalar için etkin olmama otomatik odaktan çıkarma ayarını incele/güncelle
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
    - `spawnSessions`, `sessions_spawn({ thread: true })` ve ACP iş parçacığı spawnları için iş parçacıklarını otomatik oluşturmayı/bağlamayı denetler. Varsayılan: `true`.
    - `defaultSpawnContext`, iş parçacığına bağlı spawnlar için yerel alt ajan bağlamını denetler. Varsayılan: `"fork"`.
    - Kullanımdan kaldırılmış `spawnSubagentSessions`/`spawnAcpSessions` anahtarları `openclaw doctor --fix` tarafından geçirilir.
    - Bir hesap için iş parçacığı bağlamaları devre dışıysa, `/focus` ve ilgili iş parçacığı bağlama işlemleri kullanılamaz.

    [Alt ajanlar](/tr/tools/subagents), [ACP Ajanları](/tr/tools/acp-agents) ve [Yapılandırma Başvurusu](/tr/gateway/configuration-reference) bölümlerine bakın.

  </Accordion>

  <Accordion title="Kalıcı ACP kanal bağlamaları">
    Kararlı ve "her zaman açık" ACP çalışma alanları için Discord konuşmalarını hedefleyen üst düzey tiplendirilmiş ACP bağlamalarını yapılandırın.

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

    - `/acp spawn codex --bind here` mevcut kanalı veya iş parçacığını yerinde bağlar ve gelecekteki iletileri aynı ACP oturumunda tutar. İş parçacığı iletileri üst kanal bağlamasını devralır.
    - Bağlı bir kanalda veya iş parçacığında, `/new` ve `/reset` aynı ACP oturumunu yerinde sıfırlar. Geçici iş parçacığı bağlamaları etkinken hedef çözümlemeyi geçersiz kılabilir.
    - `spawnSessions`, `--thread auto|here` aracılığıyla alt iş parçacığı oluşturmayı/bağlamayı sınırlar.

    Bağlama davranışı ayrıntıları için [ACP Ajanları](/tr/tools/acp-agents) bölümüne bakın.

  </Accordion>

  <Accordion title="Tepki bildirimleri">
    Guild başına tepki bildirimi modu:

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
    - ajan kimliği emoji yedeği (`agents.list[].identity.emoji`, yoksa "👀")

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
    Proxy'lenmiş iletileri sistem üyesi kimliğine eşlemek için PluralKit çözümlemesini etkinleştirin:

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
    - aramalar özgün mesaj kimliğini kullanır ve zaman penceresiyle sınırlıdır
    - arama başarısız olursa, proxy’lenmiş mesajlar bot mesajları olarak değerlendirilir ve `allowBots=true` değilse düşürülür

  </Accordion>

  <Accordion title="Giden bahsetme takma adları">
    Aracıların bilinen Discord kullanıcıları için deterministik giden bahsetmelere ihtiyaç duyduğu durumlarda `mentionAliases` kullanın. Anahtarlar başında `@` olmayan kullanıcı adlarıdır; değerler Discord kullanıcı kimlikleridir. Bilinmeyen kullanıcı adları, `@everyone`, `@here` ve Markdown kod aralıkları içindeki bahsetmeler değiştirilmeden bırakılır.

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

    Yayın örneği:

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
    - 1: Yayında (`activityUrl` gerektirir)
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

    Otomatik presence, çalışma zamanı kullanılabilirliğini Discord durumuna eşler: healthy => online, degraded veya unknown => idle, exhausted veya unavailable => dnd. İsteğe bağlı metin geçersiz kılmaları:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` yer tutucusunu destekler)

  </Accordion>

  <Accordion title="Discord içinde onaylar">
    Discord, DM’lerde düğme tabanlı onay işlemeyi destekler ve isteğe bağlı olarak onay istemlerini kaynak kanalda paylaşabilir.

    Yapılandırma yolu:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord, `enabled` ayarlanmamış veya `"auto"` olduğunda ve en az bir onaylayıcı `execApprovals.approvers` ya da `commands.ownerAllowFrom` üzerinden çözümlenebildiğinde yerel exec onaylarını otomatik olarak etkinleştirir. Discord, kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan mesaj `defaultTo` üzerinden exec onaylayıcıları çıkarım yoluyla belirlemez. Discord’u yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `/diagnostics` ve `/export-trajectory` gibi hassas, yalnızca sahip grubu komutları için OpenClaw onay istemlerini ve nihai sonuçları özel olarak gönderir. Çağıran sahibin bir Discord sahip rotası varsa önce Discord DM’yi dener; bu kullanılamıyorsa Telegram gibi `commands.ownerAllowFrom` içindeki ilk kullanılabilir sahip rotasına geri döner.

    `target`, `channel` veya `both` olduğunda onay istemi kanalda görünür. Düğmeleri yalnızca çözümlenmiş onaylayıcılar kullanabilir; diğer kullanıcılar geçici bir ret alır. Onay istemleri komut metnini içerir, bu nedenle kanal teslimini yalnızca güvenilir kanallarda etkinleştirin. Kanal kimliği oturum anahtarından türetilemezse OpenClaw DM teslimine geri döner.

    Discord, diğer sohbet kanalları tarafından kullanılan paylaşılan onay düğmelerini de işler. Yerel Discord adaptörü esas olarak onaylayıcı DM yönlendirmesi ve kanal yayılımı ekler.
    Bu düğmeler mevcut olduğunda birincil onay kullanıcı deneyimi bunlardır; OpenClaw
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu söylediğinde manuel bir `/approve` komutu
    içermelidir.
    Discord yerel onay çalışma zamanı etkin değilse OpenClaw yerel
    deterministik `/approve <id> <decision>` istemini görünür tutar. Çalışma zamanı
    etkinse ancak yerel kart herhangi bir hedefe teslim edilemiyorsa
    OpenClaw bekleyen onaydaki tam `/approve` komutuyla aynı sohbette yedek bildirim gönderir.

    Gateway kimlik doğrulaması ve onay çözümleme paylaşılan Gateway istemci sözleşmesini izler (`plugin:` kimlikleri `plugin.approval.resolve` üzerinden; diğer kimlikler `exec.approval.resolve` üzerinden çözümlenir). Onayların süresi varsayılan olarak 30 dakika sonra dolar.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Araçlar ve eylem kapıları

Discord mesaj eylemleri mesajlaşma, kanal yönetimi, moderasyon, presence ve meta veri eylemlerini içerir.

Temel örnekler:

- mesajlaşma: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- tepkiler: `react`, `reactions`, `emojiList`
- moderasyon: `timeout`, `kick`, `ban`
- presence: `setPresence`

`event-create` eylemi, zamanlanmış etkinlik kapak görselini ayarlamak için isteğe bağlı bir `image` parametresi (URL veya yerel dosya yolu) kabul eder.

Eylem kapıları `channels.discord.actions.*` altında bulunur.

Varsayılan kapı davranışı:

| Eylem grubu                                                                                                                                                              | Varsayılan       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | etkin            |
| roles                                                                                                                                                                    | devre dışı       |
| moderation                                                                                                                                                               | devre dışı       |
| presence                                                                                                                                                                 | devre dışı       |

## Bileşenler v2 kullanıcı arayüzü

OpenClaw, exec onayları ve bağlamlar arası işaretçiler için Discord bileşenleri v2 kullanır. Discord mesaj eylemleri özel kullanıcı arayüzü için `components` da kabul edebilir (ileri düzey; discord aracı üzerinden bir bileşen yükü oluşturmayı gerektirir), eski `embeds` ise kullanılabilir kalır ancak önerilmez.

- `channels.discord.ui.components.accentColor`, Discord bileşen kapsayıcıları tarafından kullanılan vurgu rengini ayarlar (hex).
- Hesap başına `channels.discord.accounts.<id>.ui.components.accentColor` ile ayarlayın.
- `channels.discord.agentComponents.ttlMs`, gönderilen Discord bileşen geri çağırmalarının ne kadar süre kayıtlı kalacağını kontrol eder (varsayılan `1800000`, maksimum `86400000`). Hesap başına `channels.discord.accounts.<id>.agentComponents.ttlMs` ile ayarlayın.
- Bileşenler v2 mevcut olduğunda `embeds` yok sayılır.
- Düz URL önizlemeleri varsayılan olarak bastırılır. Tek bir giden bağlantının genişlemesi gerektiğinde bir mesaj eyleminde `suppressEmbeds: false` ayarlayın.

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

Discord’un iki ayrı ses yüzeyi vardır: gerçek zamanlı **ses kanalları** (sürekli konuşmalar) ve **ses mesajı ekleri** (dalga biçimi önizleme biçimi). Gateway ikisini de destekler.

### Ses kanalları

Kurulum kontrol listesi:

1. Discord Developer Portal içinde Message Content Intent’i etkinleştirin.
2. Rol/kullanıcı izin listeleri kullanıldığında Server Members Intent’i etkinleştirin.
3. Botu `bot` ve `applications.commands` kapsamlarıyla davet edin.
4. Hedef ses kanalında Connect, Speak, Send Messages ve Read Message History izinlerini verin.
5. Yerel komutları etkinleştirin (`commands.native` veya `channels.discord.commands.native`).
6. `channels.discord.voice` yapılandırın.

Oturumları kontrol etmek için `/vc join|leave|status` kullanın. Komut, hesap varsayılan aracısını kullanır ve diğer Discord komutlarıyla aynı izin listesi ve grup politikası kurallarını izler.

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
        model: "openai/gpt-5.5",
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
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Notlar:

- `voice.tts`, yalnızca `stt-tts` ses oynatımı için `messages.tts` değerini geçersiz kılar. Gerçek zamanlı modlar `voice.realtime.speakerVoice` kullanır.
- `voice.mode`, konuşma yolunu denetler. Varsayılan değer `agent-proxy` olur: gerçek zamanlı bir ses ön ucu sıra zamanlamasını, kesintiyi ve oynatımı yönetir, esas işi `openclaw_agent_consult` üzerinden yönlendirilen OpenClaw agent’ına devreder ve sonucu o konuşmacıdan yazılmış bir Discord istemi gibi ele alır. `stt-tts`, eski toplu STT artı TTS akışını korur. `bidi`, OpenClaw beyni için `openclaw_agent_consult` sunarken gerçek zamanlı modelin doğrudan sohbet etmesini sağlar.
- `voice.agentSession`, hangi OpenClaw konuşmasının ses sıralarını alacağını denetler. Ses kanalının kendi oturumu için ayarlanmamış bırakın veya ses kanalının `#maintainers` gibi mevcut bir Discord metin kanalı oturumunun mikrofon/hoparlör uzantısı gibi davranmasını sağlamak için `{ mode: "target", target: "channel:<text-channel-id>" }` olarak ayarlayın.
- `voice.model`, Discord ses yanıtları ve gerçek zamanlı consult’lar için OpenClaw agent beynini geçersiz kılar. Yönlendirilen agent modelini devralmak için ayarlanmamış bırakın. Bu, `voice.realtime.model` değerinden ayrıdır.
- `voice.followUsers`, botun seçili kullanıcılarla Discord sesine katılmasını, taşınmasını ve ayrılmasını sağlar. Davranış kuralları ve örnekler için [Kullanıcıları seste takip et](#follow-users-in-voice) bölümüne bakın.
- `agent-proxy`, konuşmayı `discord-voice` üzerinden yönlendirir; bu, konuşmacı ve hedef oturum için normal sahip/araç yetkilendirmesini korur ancak Discord sesi oynatımı sahiplendiği için agent `tts` aracını gizler. Varsayılan olarak `agent-proxy`, sahip konuşmacılar için consult’a tam sahip eşdeğeri araç erişimi verir (`voice.realtime.toolPolicy: "owner"`) ve esas yanıtlar öncesinde OpenClaw agent’ına danışmayı güçlü biçimde tercih eder (`voice.realtime.consultPolicy: "always"`). Bu varsayılan `always` modunda, gerçek zamanlı katman consult yanıtından önce otomatik dolgu konuşmaz; konuşmayı yakalar ve yazıya döker, ardından yönlendirilen OpenClaw yanıtını konuşur. Discord ilk yanıtı hâlâ oynatırken birden fazla zorunlu consult yanıtı tamamlanırsa sonraki tam-konuşma yanıtları, cümle ortasında konuşmayı değiştirmek yerine oynatım boşa çıkana kadar kuyruğa alınır.
- `stt-tts` modunda STT, `tools.media.audio` kullanır; `voice.model` yazıya dökümü etkilemez.
- Gerçek zamanlı modlarda `voice.realtime.provider`, `voice.realtime.model` ve `voice.realtime.speakerVoice`, gerçek zamanlı ses oturumunu yapılandırır. OpenAI Realtime 2 ve Codex beyni için `voice.realtime.model: "gpt-realtime-2"` ve `voice.model: "openai/gpt-5.5"` kullanın.
- Gerçek zamanlı ses modları, hızlı doğrudan sıraların yönlendirilen OpenClaw agent ile aynı kimliği, kullanıcı dayanağını ve personayı koruması için varsayılan olarak gerçek zamanlı sağlayıcı talimatlarına küçük `IDENTITY.md`, `USER.md` ve `SOUL.md` profil dosyalarını dahil eder. Bunu özelleştirmek için `voice.realtime.bootstrapContextFiles` değerini bir alt kümeye veya devre dışı bırakmak için `[]` değerine ayarlayın. Desteklenen gerçek zamanlı bootstrap dosyaları yalnızca bu profil dosyalarıyla sınırlıdır; `AGENTS.md` normal agent bağlamında kalır. Enjekte edilen profil bağlamı, çalışma alanı işleri, güncel olgular, bellek araması veya araç destekli eylemler için `openclaw_agent_consult` yerine geçmez.
- OpenAI `agent-proxy` gerçek zamanlı modunda, bir transkript uyanma adıyla başlamadan veya bitmeden Discord gerçek zamanlı sesini sessiz tutmak için `voice.realtime.requireWakeName: true` ayarlayın. Yapılandırılan uyanma adları bir veya iki sözcük olmalıdır. `voice.realtime.wakeNames` ayarlanmamışsa OpenClaw, yönlendirilen agent `name` değerini artı `OpenClaw` kullanır; yoksa agent kimliğine artı `OpenClaw` değerine geri döner. Uyanma adı kapısı, gerçek zamanlı sağlayıcı otomatik yanıtını devre dışı bırakır, kabul edilen sıraları OpenClaw agent consult yolu üzerinden yönlendirir ve baştaki uyanma adı son transkript gelmeden önce kısmi yazıya dökümden tanındığında kısa bir sözlü onay verir.
- OpenAI gerçek zamanlı sağlayıcı, çıktı sesi ve transkript olayları için güncel Realtime 2 olay adlarını ve eski Codex uyumlu takma adları kabul eder; böylece uyumlu sağlayıcı snapshot’ları asistan sesini düşürmeden sapabilir.
- `voice.realtime.bargeIn`, Discord konuşmacı-başlangıç olaylarının etkin gerçek zamanlı oynatımı kesip kesmeyeceğini denetler. Ayarlanmamışsa gerçek zamanlı sağlayıcının giriş-sesi kesinti ayarını izler.
- `voice.realtime.minBargeInAudioEndMs`, bir OpenAI gerçek zamanlı barge-in sesi kırpmadan önceki minimum asistan oynatma süresini denetler. Varsayılan: `250`. Düşük yankılı odalarda anında kesinti için `0` ayarlayın veya yankısı yoğun hoparlör kurulumları için yükseltin.
- Discord oynatımında bir OpenAI sesi için `voice.tts.provider: "openai"` ayarlayın ve `voice.tts.providers.openai.speakerVoice` altında bir Text-to-speech sesi seçin. `cedar`, güncel OpenAI TTS modelinde erkeksi duyulan iyi bir seçimdir.
- Kanal başına Discord `systemPrompt` geçersiz kılmaları, o ses kanalı için ses transkripti sıralarına uygulanır.
- Ses transkripti sıraları, sahip kapılı komutlar ve kanal eylemleri için sahip durumunu Discord `allowFrom` (veya `dm.allowFrom`) üzerinden türetir. Agent araç görünürlüğü, yönlendirilen oturum için yapılandırılmış araç politikasını izler.
- Discord sesi, yalnızca metin yapılandırmaları için isteğe bağlıdır; `/vc` komutlarını, ses runtime’ını ve `GuildVoiceStates` gateway intent’ini etkinleştirmek için `channels.discord.voice.enabled=true` ayarlayın (veya mevcut bir `channels.discord.voice` bloğunu koruyun).
- `channels.discord.intents.voiceStates`, ses durumu intent aboneliğini açıkça geçersiz kılabilir. Intent’in etkili ses etkinleştirmesini izlemesi için ayarlanmamış bırakın.
- `voice.autoJoin` aynı guild için birden fazla giriş içeriyorsa OpenClaw, o guild için son yapılandırılan kanala katılır.
- `voice.allowedChannels`, isteğe bağlı bir ikamet izin listesidir. `/vc join` komutunun yetkili herhangi bir Discord ses kanalına girmesine izin vermek için ayarlanmamış bırakın. Ayarlandığında `/vc join`, başlangıç otomatik katılımı ve bot ses durumu taşımaları, listelenen `{ guildId, channelId }` girişleriyle sınırlandırılır. Tüm Discord ses katılımlarını reddetmek için boş diziye ayarlayın. Discord botu izin listesinin dışına taşırsa OpenClaw o kanaldan ayrılır ve mevcut olduğunda yapılandırılmış otomatik katılım hedefine yeniden katılır.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` katılım seçeneklerine aktarılır.
- `@discordjs/voice` varsayılanları, ayarlanmamışsa `daveEncryption=true` ve `decryptionFailureTolerance=24` olur.
- OpenClaw, Discord ses alma ve gerçek zamanlı ham PCM oynatımı için paketlenmiş `libopus-wasm` codec’ini kullanır. Sabitlenmiş bir libopus WebAssembly derlemesiyle gelir ve native opus eklentileri gerektirmez.
- `voice.connectTimeoutMs`, `/vc join` ve otomatik katılım denemeleri için başlangıç `@discordjs/voice` Ready beklemesini denetler. Varsayılan: `30000`.
- `voice.reconnectGraceMs`, OpenClaw’ın bağlantısı kesilmiş bir ses oturumunun yok edilmeden önce yeniden bağlanmaya başlamasını ne kadar bekleyeceğini denetler. Varsayılan: `15000`.
- `stt-tts` modunda ses oynatımı, yalnızca başka bir kullanıcı konuşmaya başladı diye durmaz. Geri bildirim döngülerini önlemek için OpenClaw, TTS oynatılırken yeni ses yakalamayı yok sayar; sonraki sıra için oynatım bittikten sonra konuşun. Gerçek zamanlı modlar, konuşmacı başlangıçlarını gerçek zamanlı sağlayıcıya barge-in sinyalleri olarak iletir.
- Gerçek zamanlı modlarda, hoparlörlerden açık mikrofona gelen yankı barge-in gibi görünüp oynatımı kesebilir. Yankısı yoğun Discord odalarında, OpenAI’ın giriş sesinde otomatik kesinti yapmasını engellemek için `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` ayarlayın. Discord konuşmacı-başlangıç olaylarının etkin oynatımı yine de kesmesini istiyorsanız `voice.realtime.bargeIn: true` ekleyin. OpenAI gerçek zamanlı köprüsü, `voice.realtime.minBargeInAudioEndMs` değerinden kısa oynatma kırpmalarını muhtemel yankı/gürültü olarak yok sayar ve Discord oynatımını temizlemek yerine atlandı olarak günlüğe kaydeder.
- `voice.captureSilenceGraceMs`, Discord bir konuşmacının durduğunu bildirdikten sonra OpenClaw’ın o ses segmentini STT için sonlandırmadan önce ne kadar bekleyeceğini denetler. Varsayılan: `2000`; Discord normal duraklamaları kesik kesik kısmi transkriptlere bölüyorsa bunu yükseltin.
- ElevenLabs seçili TTS sağlayıcısı olduğunda Discord ses oynatımı streaming TTS kullanır ve sağlayıcı yanıt stream’inden başlar. Streaming desteği olmayan sağlayıcılar sentezlenmiş geçici dosya yoluna geri döner.
- OpenClaw ayrıca alma şifre çözme hatalarını izler ve kısa bir pencere içinde tekrarlanan hatalardan sonra ses kanalından ayrılıp yeniden katılarak otomatik kurtarır.
- Güncellemeden sonra alma günlükleri tekrar tekrar `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` gösteriyorsa bir bağımlılık raporu ve günlükleri toplayın. Paketlenmiş `@discordjs/voice` satırı, discord.js issue #11419’u kapatan discord.js PR #11449’daki upstream padding düzeltmesini içerir.
- `The operation was aborted` alma olayları, OpenClaw yakalanmış bir konuşmacı segmentini sonlandırdığında beklenir; bunlar uyarı değil ayrıntılı tanı kayıtlarıdır.
- Ayrıntılı Discord ses günlükleri, kabul edilen her konuşmacı segmenti için sınırlı tek satırlık STT transkript önizlemesi içerir; böylece hata ayıklama, sınırsız transkript metni dökmeden hem kullanıcı tarafını hem de agent yanıt tarafını gösterir.
- `agent-proxy` modunda zorunlu consult geri dönüşü, `...` ile biten metinler veya `and` gibi sondaki bağlaçlar dahil olası eksik transkript parçalarını ve “be right back” ya da “bye” gibi belirgin biçimde eyleme dönük olmayan kapanışları atlar. Bu, bayat bir kuyruk yanıtını önlediğinde günlükler `forced agent consult skipped reason=...` gösterir.

### Kullanıcıları seste takip et

Discord ses botunun başlangıçta sabit bir kanala katılmak veya `/vc join` beklemek yerine bir ya da daha fazla bilinen Discord kullanıcısıyla kalmasını istediğinizde `voice.followUsers` kullanın.

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

Davranış:

- `followUsers`, ham Discord kullanıcı kimliklerini ve `discord:<id>` değerlerini kabul eder. OpenClaw, ses durumu olaylarını eşleştirmeden önce iki biçimi de normalleştirir.
- `followUsers` yapılandırıldığında `followUsersEnabled` varsayılan olarak `true` olur. Kaydedilmiş listeyi koruyup otomatik ses takibini durdurmak için `false` ayarlayın.
- Takip edilen bir kullanıcı izin verilen bir ses kanalına katıldığında OpenClaw o kanala katılır. Kullanıcı taşındığında OpenClaw onunla birlikte taşınır. Etkin takip edilen kullanıcı bağlantısını kestiğinde OpenClaw ayrılır.
- Aynı guild içinde birden çok takip edilen kullanıcı varsa ve etkin takip edilen kullanıcı ayrılırsa OpenClaw, guild’den ayrılmadan önce izlenen başka bir takip edilen kullanıcının kanalına taşınır. Birkaç takip edilen kullanıcı aynı anda taşınırsa en son gözlemlenen ses durumu olayı kazanır.
- `allowedChannels` yine uygulanır. İzin verilmeyen bir kanaldaki takip edilen kullanıcı yok sayılır ve takip sahipli bir oturum başka bir takip edilen kullanıcıya taşınır veya ayrılır.
- OpenClaw, başlangıçta ve sınırlı bir aralıkta kaçırılmış ses durumu olaylarını uzlaştırır. Uzlaştırma, yapılandırılmış guild’leri örnekler ve her çalıştırmada REST aramalarını sınırlar; bu nedenle çok büyük `followUsers` listelerinin yakınsaması birden fazla aralık sürebilir.
- Discord veya bir yönetici, bot bir kullanıcıyı takip ederken botu taşırsa OpenClaw ses oturumunu yeniden oluşturur ve hedef izinliyse takip sahipliğini korur. Bot `allowedChannels` dışına taşınırsa OpenClaw ayrılır ve mevcut olduğunda yapılandırılmış hedefe yeniden katılır.
- DAVE alma kurtarması, tekrarlanan şifre çözme hatalarından sonra aynı kanaldan ayrılıp yeniden katılabilir. Takip sahipli oturumlar bu kurtarma yolu boyunca takip sahipliğini korur; böylece takip edilen kullanıcının sonraki bağlantı kesmesi yine kanaldan ayrılır.

Katılım modları arasında seçim yapın:

- Botun siz seste olduğunuzda otomatik olarak seste olması gereken kişisel veya operatör kurulumları için `followUsers` kullanın.
- İzlenen hiçbir kullanıcı seste olmasa bile bulunması gereken sabit oda botları için `autoJoin` kullanın.
- Tek seferlik katılımlar veya otomatik ses varlığının şaşırtıcı olacağı odalar için `/vc join` kullanın.

Discord ses codec’i:

- Ses alma günlükleri `discord voice: opus decoder: libopus-wasm` gösterir.
- Gerçek zamanlı oynatma, paketleri `@discordjs/voice`'a vermeden önce aynı paketlenmiş `libopus-wasm` paketiyle ham 48 kHz stereo PCM'yi Opus'a kodlar.
- Dosya ve sağlayıcı akışı oynatması, ffmpeg ile ham 48 kHz stereo PCM'ye dönüştürür, ardından Discord'a gönderilen Opus paket akışı için `libopus-wasm` kullanır.

STT artı TTS işlem hattı:

- Discord PCM yakalaması bir WAV geçici dosyasına dönüştürülür.
- `tools.media.audio`, örneğin `openai/gpt-4o-mini-transcribe`, STT'yi işler.
- Çıktı metni Discord girişi ve yönlendirmesi üzerinden gönderilir; yanıt LLM'si, Discord sesinin son TTS oynatmasına sahip olması nedeniyle ajan `tts` aracını gizleyen ve döndürülen metni isteyen bir ses çıkışı ilkesiyle çalışır.
- `voice.model`, ayarlandığında yalnızca bu ses kanalı turu için yanıt LLM'sini geçersiz kılar.
- `voice.tts`, `messages.tts` üzerine birleştirilir; akış destekli sağlayıcılar oynatıcıyı doğrudan besler, aksi halde ortaya çıkan ses dosyası katılınan kanalda oynatılır.

Varsayılan ajan proxy ses kanalı oturumu örneği:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

`voice.agentSession` bloğu olmadığında her ses kanalı kendi yönlendirilmiş OpenClaw oturumunu alır. Örneğin, `/vc join channel:234567890123456789` o Discord ses kanalının oturumuyla konuşur. Gerçek zamanlı model yalnızca ses ön ucudur; esas istekler yapılandırılmış OpenClaw ajanına devredilir. Gerçek zamanlı model, danışma aracını çağırmadan son bir çıktı metni üretirse OpenClaw, varsayılanın hâlâ ajanla konuşuyormuş gibi davranması için danışmayı yedek olarak zorlar.

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
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

Gerçek zamanlı çift yönlü örnek:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
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
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

`agent-proxy` modunda bot yapılandırılmış ses kanalına katılır, ancak OpenClaw ajan turları hedef kanalın normal yönlendirilmiş oturumunu ve ajanını kullanır. Gerçek zamanlı ses oturumu, döndürülen sonucu ses kanalına geri söyler. Denetleyici ajan, ayrı bir Discord iletisi göndermek doğru eylemse bunu da içerecek şekilde, araç ilkesine göre normal ileti araçlarını hâlâ kullanabilir.

Devredilmiş bir OpenClaw çalıştırması etkinken yeni Discord ses çıktıları, başka bir ajan turu başlatılmadan önce canlı çalıştırma denetimi olarak ele alınır. "durum", "bunu iptal et", "daha küçük düzeltmeyi kullan" veya "işin bitince testleri de kontrol et" gibi ifadeler etkin oturum için durum, iptal, yönlendirme veya takip girdisi olarak sınıflandırılır. Durum, iptal, kabul edilen yönlendirme ve takip sonuçları ses kanalına geri söylenir; böylece arayan kişi OpenClaw'ın isteği işleyip işlemediğini bilir.

Kullanışlı hedef biçimleri:

- `target: "channel:123456789012345678"` bir Discord metin kanalı oturumu üzerinden yönlendirir.
- `target: "123456789012345678"` bir kanal hedefi olarak ele alınır.
- `target: "dm:123456789012345678"` veya `target: "user:123456789012345678"` ilgili doğrudan ileti oturumu üzerinden yönlendirir.

Yankının yoğun olduğu OpenAI Realtime örneği:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
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

Model kendi Discord oynatmasını açık bir mikrofon üzerinden duyduğunda, ancak yine de konuşarak onu kesmek istediğinizde bunu kullanın. OpenClaw, OpenAI'ın ham giriş sesiyle otomatik kesme yapmasını engellerken `bargeIn: true`, Discord konuşmacı başlama olaylarının ve zaten etkin olan konuşmacı sesinin, bir sonraki yakalanan tur OpenAI'a ulaşmadan önce etkin gerçek zamanlı yanıtları iptal etmesine izin verir. `audioEndMs` değeri `minBargeInAudioEndMs` değerinin altında olan çok erken araya girme sinyalleri olası yankı/gürültü olarak ele alınır ve modelin ilk oynatma karesinde kesilmemesi için yok sayılır.

Beklenen ses günlükleri:

- Katılmada: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Gerçek zamanlı başlatmada: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Konuşmacı sesinde: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` ve `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Eski konuşma atlandığında: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` veya `reason=non-actionable-closing ...`
- Gerçek zamanlı yanıt tamamlandığında: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Oynatma durduğunda/sıfırlandığında: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Gerçek zamanlı danışmada: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Ajan yanıtında: `discord voice: agent turn answer ...`
- Tam konuşma kuyruğa alındığında: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, ardından `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Araya girme algılandığında: `discord voice: realtime barge-in detected source=speaker-start ...` veya `discord voice: realtime barge-in detected source=active-speaker-audio ...`, ardından `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Gerçek zamanlı kesmede: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, ardından `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` veya `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Yankı/gürültü yok sayıldığında: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Araya girme devre dışıyken: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Boşta oynatmada: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Kesilen sesi hata ayıklamak için gerçek zamanlı ses günlüklerini bir zaman çizelgesi olarak okuyun:

1. `realtime audio playback started`, Discord'un asistan sesini oynatmaya başladığı anlamına gelir. Köprü, bu noktadan itibaren asistan çıkış parçalarını, Discord PCM baytlarını, sağlayıcı gerçek zamanlı baytlarını ve sentezlenen ses süresini saymaya başlar.
2. `realtime speaker turn opened`, bir Discord konuşmacısının etkinleştiğini belirtir. Oynatma zaten etkinse ve `bargeIn` etkinleştirilmişse, bunu `barge-in detected source=speaker-start` izleyebilir.
3. `realtime input audio started`, o konuşmacı turu için alınan ilk gerçek ses karesini belirtir. Buradaki `outputActive=true` veya sıfır olmayan bir `outputAudioMs`, mikrofonun asistan oynatması hâlâ etkinken giriş gönderdiği anlamına gelir.
4. `barge-in detected source=active-speaker-audio`, OpenClaw'ın asistan oynatması etkinken canlı konuşmacı sesi gördüğü anlamına gelir. Bu, gerçek bir kesintiyi kullanışlı sesi olmayan bir Discord konuşmacı başlama olayından ayırmak için faydalıdır.
5. `barge-in requested reason=...`, OpenClaw'ın gerçek zamanlı sağlayıcıdan etkin yanıtı iptal etmesini veya kısaltmasını istediği anlamına gelir. Kesintiden önce ne kadar asistan sesinin gerçekten oynatıldığını görebilmeniz için `outputAudioMs`, `outputActive` ve `playbackChunks` içerir.
6. `realtime audio playback stopped reason=...`, yerel Discord oynatma sıfırlama noktasıdır. Neden, oynatmayı kimin durdurduğunu söyler: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` veya `session-close`.
7. `realtime speaker turn closed`, yakalanan giriş turunu özetler. `chunks=0` veya `hasAudio=false`, konuşmacı turunun açıldığını ancak gerçek zamanlı köprüye kullanılabilir ses ulaşmadığını gösterir. `interruptedPlayback=true`, bu giriş turunun asistan çıkışıyla çakıştığı ve araya girme mantığını tetiklediği anlamına gelir.

Kullanışlı alanlar:

- `outputAudioMs`: günlük satırından önce gerçek zamanlı sağlayıcı tarafından üretilen asistan ses süresi.
- `audioMs`: oynatma durmadan önce OpenClaw'ın saydığı asistan ses süresi.
- `elapsedMs`: oynatma akışının veya konuşmacı turunun açılması ile kapanması arasındaki duvar saati süresi.
- `discordBytes`: Discord sesine gönderilen veya oradan alınan 48 kHz stereo PCM baytları.
- `realtimeBytes`: gerçek zamanlı sağlayıcıya gönderilen veya oradan alınan sağlayıcı biçimli PCM baytları.
- `playbackChunks`: etkin yanıt için Discord'a iletilen asistan ses parçaları.
- `sinceLastAudioMs`: son yakalanan konuşmacı ses karesi ile konuşmacı turunun kapanması arasındaki boşluk.

Yaygın örüntüler:

- `source=active-speaker-audio`, küçük `outputAudioMs` ve aynı kullanıcının yakında olmasıyla anında kesilme, genellikle hoparlör yankısının mikrofona girdiğini gösterir. `voice.realtime.minBargeInAudioEndMs` değerini artırın, hoparlör sesini düşürün, kulaklık kullanın veya `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` ayarlayın.
- `source=speaker-start` ardından `speaker turn closed ... hasAudio=false`, Discord'un konuşmacı başlangıcı bildirdiği ancak OpenClaw'a ses ulaşmadığı anlamına gelir. Bu geçici bir Discord ses olayı, gürültü kapısı davranışı veya bir istemcinin mikrofonu kısa süre etkinleştirmesi olabilir.
- Yakında araya girme veya `provider-clear-audio` olmadan `audio playback stopped reason=stream-close`, yerel Discord oynatma akışının beklenmedik şekilde sona erdiği anlamına gelir. Önceki sağlayıcı ve Discord oynatıcı günlüklerini kontrol edin.
- `capture ignored during playback (barge-in disabled)`, OpenClaw'ın asistan sesi etkinken girişi kasıtlı olarak bıraktığı anlamına gelir. Konuşmanın oynatmayı kesmesini istiyorsanız `voice.realtime.bargeIn` etkinleştirin.
- `barge-in ignored ... outputActive=false`, Discord veya sağlayıcı VAD'nin konuşma bildirdiği, ancak OpenClaw'ın kesilecek etkin oynatması olmadığı anlamına gelir. Bu, sesi kesmemelidir.

Kimlik bilgileri bileşen bazında çözümlenir: `voice.model` için LLM rota kimlik doğrulaması, `tools.media.audio` için STT kimlik doğrulaması, `messages.tts`/`voice.tts` için TTS kimlik doğrulaması ve `voice.realtime.providers` veya sağlayıcının normal kimlik doğrulama yapılandırması için gerçek zamanlı sağlayıcı kimlik doğrulaması.

### Sesli mesajlar

Discord sesli mesajları bir dalga biçimi önizlemesi gösterir ve OGG/Opus ses gerektirir. OpenClaw dalga biçimini otomatik olarak üretir, ancak incelemek ve dönüştürmek için Gateway ana makinesinde `ffmpeg` ve `ffprobe` gerekir.

- Bir **yerel dosya yolu** sağlayın (URL'ler reddedilir).
- Metin içeriğini çıkarın (Discord aynı yükte metin + sesli mesajı reddeder).
- Herhangi bir ses biçimi kabul edilir; OpenClaw gerektiğinde OGG/Opus'a dönüştürür.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="İzin verilmeyen intent'ler kullanıldı veya bot hiçbir guild mesajı görmüyor">

    - Message Content Intent'i etkinleştirin
    - kullanıcı/üye çözümlemesine bağlı olduğunuzda Server Members Intent'i etkinleştirin
    - intent'leri değiştirdikten sonra gateway'i yeniden başlatın

  </Accordion>

  <Accordion title="Guild mesajları beklenmedik şekilde engellendi">

    - `groupPolicy` değerini doğrulayın
    - `channels.discord.guilds` altında guild izin listesini doğrulayın
    - guild `channels` eşlemesi varsa yalnızca listelenen kanallara izin verilir
    - `requireMention` davranışını ve mention kalıplarını doğrulayın

    Yararlı kontroller:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Mention gerektirme false ama hâlâ engelleniyor">
    Yaygın nedenler:

    - eşleşen guild/kanal izin listesi olmadan `groupPolicy="allowlist"`
    - `requireMention` yanlış yerde yapılandırılmış (`channels.discord.guilds` veya kanal girdisi altında olmalıdır)
    - gönderen, guild/kanal `users` izin listesi tarafından engellenmiş

  </Accordion>

  <Accordion title="Uzun süren Discord turn'leri veya yinelenen yanıtlar">

    Tipik günlükler:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway kuyruğu ayarları:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çoklu hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - bu yalnızca Discord gateway listener işini denetler, agent turn ömrünü değil

    Discord, kuyruğa alınmış agent turn'lerine kanalın sahip olduğu bir zaman aşımı uygulamaz. Mesaj listener'ları hemen devreder ve kuyruğa alınmış Discord çalıştırmaları, oturum/araç/runtime yaşam döngüsü işi tamamlayana veya iptal edene kadar oturum başına sıralamayı korur.

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

  <Accordion title="Gateway metadata lookup zaman aşımı uyarıları">
    OpenClaw bağlanmadan önce Discord `/gateway/bot` metadata'sını getirir. Geçici hatalar Discord'un varsayılan gateway URL'sine geri döner ve günlüklerde hız sınırına tabidir.

    Metadata zaman aşımı ayarları:

    - tek hesap: `channels.discord.gatewayInfoTimeoutMs`
    - çoklu hesap: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - yapılandırma ayarlanmamışsa env fallback: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - varsayılan: `30000` (30 saniye), en fazla: `120000`

  </Accordion>

  <Accordion title="Gateway READY zaman aşımı yeniden başlatmaları">
    OpenClaw başlangıç sırasında ve runtime yeniden bağlanmalarından sonra Discord gateway `READY` olayını bekler. Başlangıç kademelendirmesi olan çoklu hesap kurulumları, varsayılandan daha uzun bir başlangıç READY penceresine ihtiyaç duyabilir.

    READY zaman aşımı ayarları:

    - başlangıç tek hesap: `channels.discord.gatewayReadyTimeoutMs`
    - başlangıç çoklu hesap: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa başlangıç env fallback: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - başlangıç varsayılanı: `15000` (15 saniye), en fazla: `120000`
    - runtime tek hesap: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime çoklu hesap: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa runtime env fallback: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - runtime varsayılanı: `30000` (30 saniye), en fazla: `120000`

  </Accordion>

  <Accordion title="İzin denetimi uyuşmazlıkları">
    `channels status --probe` izin kontrolleri yalnızca sayısal kanal ID'leri için çalışır.

    Slug anahtarları kullanırsanız runtime eşleştirmesi yine çalışabilir, ancak probe izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM ve eşleştirme sorunları">

    - DM devre dışı: `channels.discord.dm.enabled=false`
    - DM ilkesi devre dışı: `channels.discord.dmPolicy="disabled"` (eski: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Bot'tan bot'a döngüler">
    Varsayılan olarak bot tarafından yazılmış mesajlar yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız, döngü davranışını önlemek için katı mention ve izin listesi kuralları kullanın.
    Yalnızca bottan bahseden bot mesajlarını kabul etmek için `channels.discord.allowBots="mentions"` tercih edin.

    OpenClaw ayrıca paylaşılan [bot döngüsü koruması](/tr/channels/bot-loop-protection) ile gelir. `allowBots` bot tarafından yazılmış mesajların dispatch'e ulaşmasına izin verdiğinde, Discord gelen olayı `(account, channel, bot pair)` bilgilerine eşler ve genel pair guard yapılandırılmış olay bütçesini aştıktan sonra çifti bastırır. Guard, daha önce Discord hız sınırlarıyla durdurulması gereken kontrolden çıkmış iki botlu döngüleri önler; tek botlu dağıtımları veya bütçenin altında kalan tek seferlik bot yanıtlarını etkilemez.

    Varsayılan ayarlar (`allowBots` ayarlandığında etkin):

    - `maxEventsPerWindow: 20` -- bot çifti kayan pencere içinde 20 mesaj alışverişi yapabilir
    - `windowSeconds: 60` -- kayan pencere uzunluğu
    - `cooldownSeconds: 60` -- bütçe aşıldığında, her iki yöndeki her ek bot'tan bot'a mesaj bir dakika boyunca düşürülür

    Paylaşılan varsayılanı bir kez `channels.defaults.botLoopProtection` altında yapılandırın, ardından meşru bir iş akışı daha fazla paya ihtiyaç duyduğunda Discord'u geçersiz kılın. Öncelik sırası:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - yerleşik varsayılanlar

    Discord genel `maxEventsPerWindow`, `windowSeconds` ve `cooldownSeconds` anahtarlarını kullanır.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Voice STT, DecryptionFailed(...) ile düşüyor">

    - Discord ses alma kurtarma mantığının mevcut olması için OpenClaw'ı güncel tutun (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` değerini doğrulayın (varsayılan)
    - `channels.discord.voice.decryptionFailureTolerance=24` değerinden başlayın (upstream varsayılanı) ve yalnızca gerekirse ayarlayın
    - günlüklerde şunları izleyin:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - otomatik yeniden katılımdan sonra hatalar devam ederse günlükleri toplayın ve [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) ile [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) içindeki upstream DAVE alma geçmişiyle karşılaştırın

  </Accordion>
</AccordionGroup>

## Yapılandırma başvurusu

Birincil başvuru: [Yapılandırma başvurusu - Discord](/tr/gateway/config-channels#discord).

<Accordion title="Yüksek sinyalli Discord alanları">

- başlangıç/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- ilke: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- komut: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- olay kuyruğu: `eventQueue.listenerTimeout` (listener bütçesi), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- yanıt/geçmiş: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- teslim: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (eski alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medya/yeniden deneme: `mediaMaxMb` (giden Discord yüklemelerini sınırlar, varsayılan `100MB`), `retry`
- eylemler: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- özellikler: `threadBindings`, üst düzey `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Güvenlik ve operasyonlar

- Bot token'larını sır olarak ele alın (denetimli ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- En az ayrıcalıklı Discord izinlerini verin.
- Komut dağıtımı/durumu bayatsa gateway'i yeniden başlatın ve `openclaw channels status --probe` ile yeniden kontrol edin.

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
    Tehdit modeli ve sıkılaştırma.
  </Card>
  <Card title="Çoklu agent yönlendirme" icon="sitemap" href="/tr/concepts/multi-agent">
    Guild'leri ve kanalları agent'lara eşleyin.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı.
  </Card>
</CardGroup>
