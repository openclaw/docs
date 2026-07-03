---
read_when:
    - Discord kanal özellikleri üzerinde çalışılıyor
summary: Discord bot desteği durumu, yetenekleri ve yapılandırması
title: Discord
x-i18n:
    generated_at: "2026-07-03T02:54:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e8724b02baa1a2dba1ac932e20533c9293b6021f30b1a79107349c34f195e5
    source_path: channels/discord.md
    workflow: 16
---

Resmi Discord gateway aracılığıyla DM'ler ve guild kanalları için hazır.

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

Bot içeren yeni bir uygulama oluşturmanız, botu sunucunuza eklemeniz ve OpenClaw ile eşleştirmeniz gerekir. Botunuzu kendi özel sunucunuza eklemenizi öneririz. Henüz yoksa, [önce bir tane oluşturun](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Kendim İçin Oluştur > Ben ve arkadaşlarım için** seçeneğini seçin).

<Steps>
  <Step title="Bir Discord uygulaması ve bot oluşturun">
    [Discord Developer Portal](https://discord.com/developers/applications) sayfasına gidin ve **Yeni Uygulama**'ya tıklayın. "OpenClaw" gibi bir ad verin.

    Kenar çubuğunda **Bot**'a tıklayın. **Kullanıcı adı** alanını OpenClaw ajanınıza verdiğiniz ad olarak ayarlayın.

  </Step>

  <Step title="Ayrıcalıklı intent'leri etkinleştirin">
    Hâlâ **Bot** sayfasındayken **Ayrıcalıklı Gateway Intent'leri** bölümüne kaydırın ve şunları etkinleştirin:

    - **Mesaj İçeriği Intent'i** (gerekli)
    - **Sunucu Üyeleri Intent'i** (önerilir; rol izin listeleri ve addan ID'ye eşleştirme için gereklidir)
    - **Varlık Intent'i** (isteğe bağlı; yalnızca varlık güncellemeleri için gerekir)

  </Step>

  <Step title="Bot token'ınızı kopyalayın">
    **Bot** sayfasında tekrar yukarı kaydırın ve **Token'ı Sıfırla**'ya tıklayın.

    <Note>
    Adına rağmen bu işlem ilk token'ınızı oluşturur; hiçbir şey "sıfırlanmıyor."
    </Note>

    Token'ı kopyalayın ve bir yere kaydedin. Bu sizin **Bot Token**'ınızdır ve kısa süre içinde buna ihtiyacınız olacak.

  </Step>

  <Step title="Davet URL'si oluşturun ve botu sunucunuza ekleyin">
    Kenar çubuğunda **OAuth2**'ye tıklayın. Botu sunucunuza eklemek için doğru izinlere sahip bir davet URL'si oluşturacaksınız.

    **OAuth2 URL Oluşturucu** bölümüne kaydırın ve şunları etkinleştirin:

    - `bot`
    - `applications.commands`

    Aşağıda bir **Bot İzinleri** bölümü görünecek. En az şunları etkinleştirin:

    **Genel İzinler**
      - Kanalları Görüntüle

    **Metin İzinleri**
      - Mesaj Gönder
      - Mesaj Geçmişini Oku
      - Bağlantıları Göm
      - Dosya Ekle
      - Tepki Ekle (isteğe bağlı)

    Bu, normal metin kanalları için temel settir. Forum veya medya kanalı iş akışları dahil Discord thread'lerinde gönderi paylaşmayı planlıyorsanız, bir thread oluşturan veya sürdüren akışlar için **Thread'lerde Mesaj Gönder** seçeneğini de etkinleştirin.
    En altta oluşturulan URL'yi kopyalayın, tarayıcınıza yapıştırın, sunucunuzu seçin ve bağlanmak için **Devam**'a tıklayın. Artık botunuzu Discord sunucusunda görmelisiniz.

  </Step>

  <Step title="Geliştirici Modu'nu etkinleştirin ve ID'lerinizi toplayın">
    Discord uygulamasına dönün; dahili ID'leri kopyalayabilmek için Geliştirici Modu'nu etkinleştirmeniz gerekir.

    1. **Kullanıcı Ayarları**'na tıklayın (avatarınızın yanındaki dişli simgesi) → Kenar çubuğunda **Geliştirici** bölümüne kaydırın → **Geliştirici Modu**'nu açın

        *(Not: Discord mobil uygulamasında Geliştirici Modu, **Uygulama Ayarları** → **Gelişmiş** altındadır)*

    2. Kenar çubuğunda **sunucu simgenize** sağ tıklayın → **Sunucu ID'sini Kopyala**
    3. **Kendi avatarınıza** sağ tıklayın → **Kullanıcı ID'sini Kopyala**

    **Sunucu ID**'nizi ve **Kullanıcı ID**'nizi Bot Token'ınızla birlikte kaydedin; sonraki adımda üçünü de OpenClaw'a göndereceksiniz.

  </Step>

  <Step title="Sunucu üyelerinden DM'lere izin verin">
    Eşleştirmenin çalışması için Discord'un botunuzun size DM göndermesine izin vermesi gerekir. **Sunucu simgenize** sağ tıklayın → **Gizlilik Ayarları** → **Doğrudan Mesajlar**'ı açın.

    Bu, sunucu üyelerinin (botlar dahil) size DM göndermesini sağlar. OpenClaw ile Discord DM'leri kullanmak istiyorsanız bunu etkin bırakın. Yalnızca guild kanallarını kullanmayı planlıyorsanız, eşleştirmeden sonra DM'leri devre dışı bırakabilirsiniz.

  </Step>

  <Step title="Bot token'ınızı güvenli şekilde ayarlayın (sohbette göndermeyin)">
    Discord bot token'ınız bir sırdır (parola gibi). Ajanınıza mesaj göndermeden önce OpenClaw'ı çalıştıran makinede bunu ayarlayın.

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
    Yönetilen hizmet kurulumları için, `DISCORD_BOT_TOKEN` mevcut olan bir shell'den `openclaw gateway install` çalıştırın veya değişkeni `~/.openclaw/.env` içinde saklayın; böylece hizmet yeniden başlatmadan sonra env SecretRef değerini çözebilir.
    Host'unuz Discord'un başlangıç uygulaması araması tarafından engelleniyorsa veya hız sınırlamasına takılıyorsa, başlangıcın bu REST çağrısını atlayabilmesi için Discord uygulama/client ID'sini Developer Portal'dan ayarlayın. Varsayılan hesap için `channels.discord.applicationId`, birden fazla Discord botu çalıştırdığınızda ise `channels.discord.accounts.<accountId>.applicationId` kullanın.

  </Step>

  <Step title="OpenClaw'ı yapılandırın ve eşleştirin">

    <Tabs>
      <Tab title="Ajanınıza sorun">
        Mevcut herhangi bir kanalda (ör. Telegram) OpenClaw ajanınızla sohbet edin ve ona söyleyin. Discord ilk kanalınızsa bunun yerine CLI / config sekmesini kullanın.

        > "Discord bot token'ımı config içinde zaten ayarladım. Lütfen Discord kurulumunu User ID `<user_id>` ve Server ID `<server_id>` ile tamamla."
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

        Script'li veya uzak kurulum için aynı JSON5 bloğunu `openclaw config patch --file ./discord.patch.json5 --dry-run` ile yazın ve sonra `--dry-run` olmadan yeniden çalıştırın. Düz metin `token` değerleri desteklenir. Env/file/exec provider'ları genelinde `channels.discord.token` için SecretRef değerleri de desteklenir. Bkz. [Secrets Management](/tr/gateway/secrets).

        Birden fazla Discord botu için her bot token'ını ve uygulama ID'sini kendi hesabı altında tutun. Üst düzey `channels.discord.applicationId` hesaplar tarafından devralınır; bu nedenle yalnızca her hesap aynı uygulama ID'sini kullanmalıysa orada ayarlayın.

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
    Gateway çalışana kadar bekleyin, ardından Discord'da botunuza DM gönderin. Bot bir eşleştirme koduyla yanıt verecektir.

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

    Artık Discord'da DM üzerinden ajanınızla sohbet edebilmelisiniz.

  </Step>
</Steps>

<Note>
Token çözümleme hesap farkındadır. Config token değerleri env fallback'e göre önceliklidir. `DISCORD_BOT_TOKEN` yalnızca varsayılan hesap için kullanılır.
Etkinleştirilmiş iki Discord hesabı aynı bot token'ına çözülürse, OpenClaw bu token için yalnızca bir gateway izleyicisi başlatır. Config kaynaklı token varsayılan env fallback'e göre önceliklidir; aksi durumda ilk etkin hesap kazanır ve yinelenen hesap devre dışı olarak raporlanır.
Gelişmiş giden çağrılar (mesaj aracı/kanal eylemleri) için, açık bir çağrı başına `token` o çağrıda kullanılır. Bu, gönderme ve okuma/probe tarzı eylemler için geçerlidir (örneğin read/search/fetch/thread/pins/permissions). Hesap politikası/yeniden deneme ayarları hâlâ etkin runtime anlık görüntüsünde seçilen hesaptan gelir.
</Note>

## Önerilir: Bir guild çalışma alanı kurun

DM'ler çalıştıktan sonra Discord sunucunuzu, her kanalın kendi bağlamına sahip ayrı bir ajan oturumu aldığı tam bir çalışma alanı olarak kurabilirsiniz. Bu, yalnızca sizin ve botunuzun bulunduğu özel sunucular için önerilir.

<Steps>
  <Step title="Sunucunuzu guild izin listesine ekleyin">
    Bu, ajanınızın yalnızca DM'lerde değil, sunucunuzdaki herhangi bir kanalda yanıt vermesini sağlar.

    <Tabs>
      <Tab title="Ajanınıza sorun">
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
    Varsayılan olarak ajanınız guild kanallarında yalnızca @mention edildiğinde yanıt verir. Özel bir sunucu için muhtemelen her mesaja yanıt vermesini istersiniz.

    Guild kanallarında normal yanıtlar varsayılan olarak otomatik gönderilir. Paylaşılan sürekli açık odalar için `messages.groupChat.visibleReplies: "message_tool"` seçeneğini etkinleştirin; böylece ajan dinlemede kalabilir ve yalnızca kanal yanıtının yararlı olduğuna karar verdiğinde gönderi paylaşır. Bu, GPT 5.5 gibi en yeni nesil, araç güvenilirliği yüksek modellerle en iyi çalışır. Ortam oda olayları, araç göndermedikçe sessiz kalır. Tam dinleme modu config'i için [Ortam oda olayları](/tr/channels/ambient-room-events) sayfasına bakın.

    Discord yazıyor gösteriyor ve log'lar token kullanımını gösteriyor ancak gönderilmiş mesaj yoksa, turn'ün bir ortam oda olayı olarak yapılandırılıp yapılandırılmadığını veya mesaj aracı görünür yanıtlarının etkinleştirilip etkinleştirilmediğini kontrol edin.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        > "Ajanımın bu sunucuda @mention edilmesine gerek kalmadan yanıt vermesine izin ver"
      </Tab>
      <Tab title="Config">
        Guild config'inizde `requireMention: false` ayarlayın:

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

        Görünür grup/kanal yanıtları için mesaj aracı gönderimlerini zorunlu kılmak üzere `messages.groupChat.visibleReplies: "message_tool"` ayarlayın.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Guild kanallarında bellek için plan yapın">
    Varsayılan olarak uzun vadeli bellek (MEMORY.md) yalnızca DM oturumlarında yüklenir. Guild kanalları MEMORY.md dosyasını otomatik yüklemez.

    <Tabs>
      <Tab title="Ajanınıza sorun">
        > "Discord kanallarında soru sorduğumda, MEMORY.md içinden uzun vadeli bağlama ihtiyacın olursa memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Manuel">
        Her kanalda paylaşılan bağlama ihtiyacınız varsa, kararlı talimatları `AGENTS.md` veya `USER.md` içine koyun (bunlar her oturuma enjekte edilir). Uzun vadeli notları `MEMORY.md` içinde tutun ve gerektiğinde bellek araçlarıyla erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Şimdi Discord sunucunuzda bazı kanallar oluşturun ve sohbet etmeye başlayın. Ajanınız kanal adını görebilir ve her kanal kendi yalıtılmış oturumunu alır; böylece `#coding`, `#home`, `#research` veya iş akışınıza uyan herhangi bir şeyi kurabilirsiniz.

## Runtime modeli

- Gateway, Discord bağlantısının sahibidir.
- Yanıt yönlendirmesi deterministiktir: Discord’dan gelen yanıtlar Discord’a geri döner.
- Discord sunucu/kanal meta verileri, kullanıcıya görünen bir yanıt öneki olarak değil,
  güvenilmeyen bağlam olarak model istemine eklenir. Bir model bu zarfı
  geri kopyalarsa, OpenClaw kopyalanan meta verileri giden yanıtlardan ve
  gelecekteki yeniden oynatma bağlamından çıkarır.
- Varsayılan olarak (`session.dmScope=main`), doğrudan sohbetler agent ana oturumunu paylaşır (`agent:main:main`).
- Sunucu kanalları yalıtılmış oturum anahtarlarıdır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM’leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel slash komutları yalıtılmış komut oturumlarında çalışır (`agent:<agentId>:discord:slash:<userId>`), ancak yönlendirilen konuşma oturumuna `CommandTargetSessionKey` taşımaya devam eder.
- Discord’a metin tabanlı cron/heartbeat duyuru teslimi, son
  assistant tarafından görülebilen yanıtı bir kez kullanır. Medya ve yapılandırılmış bileşen yükleri,
  agent birden fazla teslim edilebilir yük yaydığında çok iletili kalır.

## Forum kanalları

Discord forum ve medya kanalları yalnızca thread gönderilerini kabul eder. OpenClaw bunları oluşturmak için iki yolu destekler:

- Otomatik thread oluşturmak için forum üst kanalına (`channel:<forumId>`) bir ileti gönderin. Thread başlığı, iletinizin ilk boş olmayan satırını kullanır.
- Doğrudan thread oluşturmak için `openclaw message thread create` kullanın. Forum kanalları için `--message-id` geçmeyin.

Örnek: thread oluşturmak için forum üst kanalına gönderme

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Örnek: açıkça forum thread’i oluşturma

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum üst kanalları Discord bileşenlerini kabul etmez. Bileşenlere ihtiyacınız varsa, thread’in kendisine gönderin (`channel:<threadId>`).

## Etkileşimli bileşenler

OpenClaw, agent iletileri için Discord components v2 kapsayıcılarını destekler. `components` yüküyle message aracını kullanın. Etkileşim sonuçları agent’a normal gelen iletiler olarak geri yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Eylem satırları en fazla 5 düğmeye veya tek bir seçme menüsüne izin verir
- Seçme türleri: `string`, `user`, `role`, `mentionable`, `channel`

Varsayılan olarak bileşenler tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süreleri dolana kadar birden çok kez kullanılmasına izin vermek için `components.reusable=true` ayarlayın.

Bir düğmeye kimin tıklayabileceğini kısıtlamak için o düğmede `allowedUsers` ayarlayın (Discord kullanıcı ID’leri, etiketleri veya `*`). Yapılandırıldığında, eşleşmeyen kullanıcılar geçici bir ret alır.

Bileşen geri çağrıları varsayılan olarak 30 dakika sonra sona erer. Varsayılan Discord hesabı için bu geri çağrı kayıt defteri ömrünü değiştirmek üzere `channels.discord.agentComponents.ttlMs`, çok hesaplı bir kurulumda bir hesabı geçersiz kılmak üzere `channels.discord.accounts.<accountId>.agentComponents.ttlMs` ayarlayın. Değer milisaniyedir, pozitif bir tam sayı olmalıdır ve `86400000` (24 saat) ile sınırlıdır. Daha uzun TTL’ler, düğmelerin kullanılabilir kalmasını gerektiren inceleme veya onay iş akışları için yararlıdır, ancak eski bir Discord iletisinin hâlâ bir eylemi tetikleyebileceği pencereyi de uzatır. İş akışına uyan en kısa TTL’yi tercih edin ve bayat geri çağrılar şaşırtıcı olacaksa varsayılanı koruyun.

`/model` ve `/models` slash komutları, sağlayıcı, model ve uyumlu runtime açılır menüleri ile bir Gönder adımı içeren etkileşimli bir model seçici açar. `/models add` kullanımdan kaldırılmıştır ve artık sohbetten model kaydetmek yerine bir kullanımdan kaldırma iletisi döndürür. Seçici yanıtı geçicidir ve yalnızca çağıran kullanıcı bunu kullanabilir. Discord seçme menüleri 25 seçenekle sınırlıdır; bu nedenle seçicinin dinamik olarak keşfedilen modelleri yalnızca `openai` veya `vllm` gibi seçili sağlayıcılar için göstermesini istediğinizde `agents.defaults.models` içine `provider/*` girdileri ekleyin.

Dosya ekleri:

- `file` blokları bir ek referansına işaret etmelidir (`attachment://<filename>`)
- Eki `media`/`path`/`filePath` aracılığıyla sağlayın (tek dosya); birden çok dosya için `media-gallery` kullanın
- Yükleme adı ek referansıyla eşleşmesi gerektiğinde bunu geçersiz kılmak için `filename` kullanın

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
    `channels.discord.dmPolicy`, DM erişimini denetler. `channels.discord.allowFrom` kanonik DM izin listesidir.

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    DM ilkesi açık değilse, bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme için yönlendirilir).

    Çok hesaplı öncelik:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesabına uygulanır.
    - Tek hesap için `allowFrom`, eski `dm.allowFrom` değerinden önceliklidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` ve eski `dm.allowFrom` değerleri ayarlanmamışsa `channels.discord.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.discord.accounts.default.allowFrom` değerini devralmaz.

    Eski `channels.discord.dm.policy` ve `channels.discord.dm.allowFrom` uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` değerlerine taşır.

    Teslimat için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` mention

    Yalın sayısal ID’ler, bir kanal varsayılanı etkinken normalde kanal ID’leri olarak çözülür; ancak hesabın etkin DM `allowFrom` listesinde yer alan ID’ler uyumluluk için kullanıcı DM hedefleri olarak ele alınır.

  </Tab>

  <Tab title="Access groups">
    Discord DM’leri ve metin komutu yetkilendirmesi, `channels.discord.allowFrom` içinde dinamik `accessGroup:<name>` girdileri kullanabilir.

    Erişim grubu adları ileti kanalları arasında paylaşılır. Üyeleri her kanalın normal `allowFrom` söz diziminde ifade edilen statik bir grup için `type: "message.senders"` kullanın veya bir Discord kanalının mevcut `ViewChannel` kitlesinin üyeliği dinamik olarak tanımlaması gerektiğinde `type: "discord.channelAudience"` kullanın. Paylaşılan erişim grubu davranışı burada belgelenmiştir: [Erişim grupları](/tr/channels/access-groups).

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

    Bir Discord metin kanalının ayrı bir üye listesi yoktur. `type: "discord.channelAudience"` üyeliği şöyle modeller: DM göndereni yapılandırılmış sunucunun üyesidir ve rol ile kanal üzerine yazmaları uygulandıktan sonra yapılandırılmış kanalda şu anda etkin `ViewChannel` iznine sahiptir.

    Örnek: DM’leri diğer herkese kapalı tutarken `#maintainers` kanalını görebilen herkesin bot’a DM göndermesine izin verin.

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

    Kanal kitlesi erişim grupları kullanırken bot için Discord Developer Portal’da **Server Members Intent** özelliğini etkinleştirin. DM’ler sunucu üye durumunu içermez; bu yüzden OpenClaw üyeyi yetkilendirme sırasında Discord REST üzerinden çözer.

  </Tab>

  <Tab title="Guild policy">
    Sunucu işleme `channels.discord.groupPolicy` tarafından denetlenir:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` mevcut olduğunda güvenli temel değer `allowlist` olur.

    `allowlist` davranışı:

    - sunucu `channels.discord.guilds` ile eşleşmelidir (`id` tercih edilir, slug kabul edilir)
    - isteğe bağlı gönderen izin listeleri: `users` (kararlı ID’ler önerilir) ve `roles` (yalnızca rol ID’leri); ikisinden biri yapılandırılmışsa gönderenler `users` VEYA `roles` ile eşleştiklerinde izinli olur
    - doğrudan ad/etiket eşleştirme varsayılan olarak devre dışıdır; `channels.discord.dangerouslyAllowNameMatching: true` değerini yalnızca son çare uyumluluk modu olarak etkinleştirin
    - `users` için adlar/etiketler desteklenir, ancak ID’ler daha güvenlidir; ad/etiket girdileri kullanıldığında `openclaw security audit` uyarır
    - bir sunucuda `channels` yapılandırılmışsa, listelenmeyen kanallar reddedilir
    - bir sunucuda `channels` bloğu yoksa, bu izin listesine alınmış sunucudaki tüm kanallara izin verilir

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

    Yalnızca `DISCORD_BOT_TOKEN` ayarlarsanız ve bir `channels.discord` bloğu oluşturmazsanız, çalışma zamanı fallback değeri, `channels.defaults.groupPolicy` `open` olsa bile `groupPolicy="allowlist"` olur (loglarda bir uyarıyla birlikte).

  </Tab>

  <Tab title="Mentions and group DMs">
    Sunucu iletileri varsayılan olarak mention ile sınırlıdır.

    Mention algılama şunları içerir:

    - açık bot mention’ı
    - yapılandırılmış mention desenleri (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda örtük bot’a yanıt verme davranışı

    Giden Discord iletileri yazarken kanonik mention söz dizimini kullanın: kullanıcılar için `<@USER_ID>`, kanallar için `<#CHANNEL_ID>` ve roller için `<@&ROLE_ID>`. Eski `<@!USER_ID>` takma ad mention biçimini kullanmayın.

    `requireMention` sunucu/kanal başına yapılandırılır (`channels.discord.guilds...`).
    `ignoreOtherMentions`, isteğe bağlı olarak başka bir kullanıcıdan/rolden bahseden ancak bot’tan bahsetmeyen iletileri düşürür (@everyone/@here hariç).

    Grup DM’leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - `dm.groupChannels` aracılığıyla isteğe bağlı izin listesi (kanal ID’leri veya slug’lar)

  </Tab>
</Tabs>

### Role dayalı agent yönlendirmesi

`bindings[].match.roles` kullanarak Discord sunucu üyelerini rol kimliğine göre farklı aracılara yönlendirin. Rol tabanlı bağlamalar yalnızca rol kimliklerini kabul eder ve eş ya da üst-eş bağlamalarından sonra, yalnızca sunucu bağlamalarından önce değerlendirilir. Bir bağlama başka eşleşme alanları da ayarlıyorsa (örneğin `peer` + `guildId` + `roles`), yapılandırılmış tüm alanlar eşleşmelidir.

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

- `commands.native` varsayılan olarak `"auto"` değerine sahiptir ve Discord için etkindir.
- Kanal başına geçersiz kılma: `channels.discord.commands.native`.
- `commands.native=false`, başlangıç sırasında Discord slash komutu kaydını ve temizliğini atlar. Daha önce kaydedilmiş komutlar, siz bunları Discord uygulamasından kaldırana kadar Discord içinde görünür kalabilir.
- Yerel komut kimlik doğrulaması, normal ileti işleme ile aynı Discord izin listelerini/ilkelerini kullanır.
- Komutlar, yetkili olmayan kullanıcılar için Discord kullanıcı arayüzünde hâlâ görünebilir; yürütme yine de OpenClaw kimlik doğrulamasını zorunlu kılar ve "yetkili değil" döndürür.

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

    Not: `off`, örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.
    `first`, dönüş için ilk giden Discord iletisine örtük yerel yanıt referansını her zaman ekler.
    `batched`, Discord'un örtük yerel yanıt referansını yalnızca gelen olay
    birden çok iletiden oluşan debounce uygulanmış bir toplu işlem olduğunda ekler. Bu,
    yerel yanıtları her tek iletili dönüş için değil, daha çok belirsiz ve yoğun sohbet patlamaları için
    istediğinizde kullanışlıdır.

    İleti kimlikleri bağlam/geçmiş içinde gösterilir, böylece aracılar belirli iletileri hedefleyebilir.

  </Accordion>

  <Accordion title="Bağlantı önizlemeleri">
    Discord, URL'ler için varsayılan olarak zengin bağlantı gömmeleri oluşturur. OpenClaw, varsayılan olarak giden Discord iletilerinde bu oluşturulan gömmeleri bastırır; böylece aracı tarafından gönderilen URL'ler, siz özellikle etkinleştirmedikçe düz bağlantılar olarak kalır:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Bir hesabı geçersiz kılmak için `channels.discord.accounts.<id>.suppressEmbeds` ayarlayın. Aracı ileti aracı gönderimleri de tek bir ileti için `suppressEmbeds: false` iletebilir. Açık Discord `embeds` yükleri, varsayılan bağlantı önizleme ayarı tarafından bastırılmaz.

  </Accordion>

  <Accordion title="Canlı akış önizlemesi">
    OpenClaw, geçici bir ileti gönderip metin geldikçe bunu düzenleyerek taslak yanıtları akış halinde iletebilir. `channels.discord.streaming`, `off` | `partial` | `block` | `progress` (varsayılan) değerlerini alır. `progress`, düzenlenebilir tek bir durum taslağı tutar ve son teslimata kadar araç ilerlemesiyle günceller; paylaşılan başlangıç etiketi kayan bir satırdır, bu yüzden yeterince iş göründüğünde diğerleri gibi ekrandan kayar. `streamMode` eski bir çalışma zamanı takma adıdır. Kalıcı yapılandırmayı kanonik anahtara yeniden yazmak için `openclaw doctor --fix` çalıştırın.

    Discord önizleme düzenlemelerini devre dışı bırakmak için `channels.discord.streaming.mode` değerini `off` olarak ayarlayın. Discord blok akışı açıkça etkinleştirilirse OpenClaw, çift akışı önlemek için önizleme akışını atlar.

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

    - `partial`, token'lar geldikçe tek bir önizleme iletisini düzenler.
    - `block`, taslak boyutunda parçalar yayar (boyutu ve kesme noktalarını ayarlamak için `draftChunk` kullanın; `textChunkLimit` ile sınırlandırılır).
    - Medya, hata ve açık yanıt finalleri bekleyen önizleme düzenlemelerini iptal eder.
    - `streaming.preview.toolProgress` (varsayılan `true`), araç/ilerleme güncellemelerinin önizleme iletisini yeniden kullanıp kullanmayacağını denetler.
    - Araç/ilerleme satırları, mevcut olduğunda kompakt emoji + başlık + ayrıntı olarak işlenir; örneğin `🛠️ Bash: run tests` veya `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (varsayılan `false`), geçici ilerleme taslağında asistan yorum/açılış metnini etkinleştirir. Yorum görüntülenmeden önce temizlenir, geçici kalır ve son yanıt teslimatını değiştirmez.
    - `streaming.progress.maxLineChars`, satır başına ilerleme önizleme bütçesini denetler. Düzyazı sözcük sınırlarında kısaltılır; komut ve yol ayrıntıları yararlı son ekleri korur.
    - `streaming.preview.commandText` / `streaming.progress.commandText`, kompakt ilerleme satırlarındaki komut/yürütme ayrıntısını denetler: `raw` (varsayılan) veya `status` (yalnızca araç etiketi).

    Kompakt ilerleme satırlarını korurken ham komut/yürütme metnini gizleyin:

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
    - İş parçacığı oturumları, model için yalnızca geri dönüş olarak üst kanalın oturum düzeyi `/model` seçimini devralır; iş parçacığına yerel `/model` seçimleri yine de önceliklidir ve transkript devralma etkinleştirilmedikçe üst transkript geçmişi kopyalanmaz.
    - `channels.discord.thread.inheritParent` (varsayılan `false`), yeni otomatik iş parçacıklarının üst transkriptten başlatılmasını etkinleştirir. Hesap başına geçersiz kılmalar `channels.discord.accounts.<id>.thread.inheritParent` altında bulunur.
    - İleti aracı tepkileri `user:<id>` DM hedeflerini çözebilir.
    - `guilds.<guild>.channels.<channel>.requireMention: false`, yanıt aşaması etkinleştirme geri dönüşü sırasında korunur.

    Kanal konuları **güvenilmeyen** bağlam olarak enjekte edilir. İzin listeleri, aracıyı kimin tetikleyebileceğini denetler; tam bir ek bağlam redaksiyon sınırı değildir.

  </Accordion>

  <Accordion title="Alt aracılar için iş parçacığına bağlı oturumlar">
    Discord, bir iş parçacığını bir oturum hedefine bağlayabilir; böylece o iş parçacığındaki takip iletileri aynı oturuma yönlendirilmeye devam eder (alt aracı oturumları dahil).

    Komutlar:

    - `/focus <target>` geçerli/yeni iş parçacığını bir alt aracı/oturum hedefine bağla
    - `/unfocus` geçerli iş parçacığı bağlamasını kaldır
    - `/agents` etkin çalıştırmaları ve bağlama durumunu göster
    - `/session idle <duration|off>` odaklı bağlamalar için hareketsizlikte otomatik odak kaldırmayı incele/güncelle
    - `/session max-age <duration|off>` odaklı bağlamalar için katı en yüksek yaşı incele/güncelle

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
    - `defaultSpawnContext`, iş parçacığına bağlı oluşturmalarda yerel alt aracı bağlamını denetler. Varsayılan: `"fork"`.
    - Kullanımdan kaldırılmış `spawnSubagentSessions`/`spawnAcpSessions` anahtarları `openclaw doctor --fix` tarafından taşınır.
    - Bir hesap için iş parçacığı bağlamaları devre dışıysa `/focus` ve ilgili iş parçacığı bağlama işlemleri kullanılamaz.

    [Alt aracılar](/tr/tools/subagents), [ACP Aracıları](/tr/tools/acp-agents) ve [Yapılandırma Başvurusu](/tr/gateway/configuration-reference) bölümlerine bakın.

  </Accordion>

  <Accordion title="Kalıcı ACP kanal bağlamaları">
    Kararlı "her zaman açık" ACP çalışma alanları için Discord konuşmalarını hedefleyen üst düzey türlendirilmiş ACP bağlamaları yapılandırın.

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

    - `/acp spawn codex --bind here`, geçerli kanalı veya iş parçacığını yerinde bağlar ve gelecekteki iletileri aynı ACP oturumunda tutar. İş parçacığı iletileri üst kanal bağlamasını devralır.
    - Bağlı bir kanalda veya iş parçacığında `/new` ve `/reset`, aynı ACP oturumunu yerinde sıfırlar. Geçici iş parçacığı bağlamaları etkin oldukları sürece hedef çözümlemeyi geçersiz kılabilir.
    - `spawnSessions`, `--thread auto|here` üzerinden alt iş parçacığı oluşturma/bağlamayı kapılar.

    Bağlama davranışı ayrıntıları için [ACP Aracıları](/tr/tools/acp-agents) bölümüne bakın.

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
    `ackReaction`, OpenClaw gelen bir iletiyi işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - aracı kimliği emojisi geri dönüşü (`agents.list[].identity.emoji`, aksi halde "👀")

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
    Discord Gateway WebSocket trafiğini ve başlangıç REST sorgularını (uygulama kimliği + izin listesi çözümlemesi) `channels.discord.proxy` ile bir HTTP(S) proxy üzerinden yönlendirin.
    Discord Gateway WebSocket proxy kullanımı açıktır; WebSocket bağlantıları, Gateway sürecinden ortam proxy çevre değişkenlerini devralmaz. Başlangıç REST sorguları, `channels.discord.proxy` yapılandırıldığında bu proxy'yi kullanır.

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
    Proxy iletileri sistem üyesi kimliğine eşlemek için PluralKit çözümlemesini etkinleştirin:

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
    - aramalar özgün ileti kimliğini kullanır ve zaman penceresiyle sınırlandırılır
    - arama başarısız olursa, proxy iletileri bot iletileri olarak ele alınır ve `allowBots=true` olmadığı sürece bırakılır

  </Accordion>

  <Accordion title="Giden bahsetme takma adları">
    Aracıların bilinen Discord kullanıcıları için deterministik giden bahsetmelere ihtiyaç duyduğu durumlarda `mentionAliases` kullanın. Anahtarlar başındaki `@` olmadan kullanıcılardır; değerler Discord kullanıcı kimlikleridir. Bilinmeyen kullanıcılar, `@everyone`, `@here` ve Markdown kod satır içi alanlarındaki bahsetmeler değiştirilmeden bırakılır.

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
    Presence güncellemeleri, bir durum veya etkinlik alanı ayarladığınızda ya da otomatik presence etkinleştirdiğinizde uygulanır.

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

    Etkinlik türü eşlemesi:

    - 0: Oynuyor
    - 1: Yayın yapıyor (`activityUrl` gerektirir)
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

    Otomatik presence, çalışma zamanı kullanılabilirliğini Discord durumuna eşler: sağlıklı => çevrimiçi, bozulmuş veya bilinmeyen => boşta, tükenmiş veya kullanılamaz => rahatsız etmeyin. İsteğe bağlı metin geçersiz kılmaları:

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

    Discord, `enabled` ayarlanmamış veya `"auto"` olduğunda ve en az bir onaylayıcı `execApprovals.approvers` ya da `commands.ownerAllowFrom` üzerinden çözümlenebildiğinde yerel exec onaylarını otomatik etkinleştirir. Discord, exec onaylayıcılarını kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan ileti `defaultTo` değerinden çıkarmaz. Discord'u yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `/diagnostics` ve `/export-trajectory` gibi hassas yalnızca sahip grup komutları için OpenClaw, onay istemlerini ve nihai sonuçları özel olarak gönderir. Çağıran sahibin bir Discord sahip rotası olduğunda önce Discord DM'yi dener; bu mevcut değilse Telegram gibi `commands.ownerAllowFrom` içindeki ilk kullanılabilir sahip rotasına geri döner.

    `target`, `channel` veya `both` olduğunda onay istemi kanalda görünür. Yalnızca çözümlenen onaylayıcılar düğmeleri kullanabilir; diğer kullanıcılar geçici bir ret alır. Onay istemleri komut metnini içerir, bu nedenle kanal teslimini yalnızca güvenilir kanallarda etkinleştirin. Kanal kimliği oturum anahtarından türetilemiyorsa OpenClaw DM teslimine geri döner.

    Discord, diğer sohbet kanalları tarafından kullanılan paylaşılan onay düğmelerini de işler. Yerel Discord bağdaştırıcısı esas olarak onaylayıcı DM yönlendirmesi ve kanal yayılımı ekler.
    Bu düğmeler mevcut olduğunda birincil onay UX'i bunlardır; OpenClaw
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın
    tek yol olduğunu söylediğinde manuel bir `/approve` komutu içermelidir.
    Discord yerel onay çalışma zamanı etkin değilse OpenClaw yerel
    deterministik `/approve <id> <decision>` istemini görünür tutar. Çalışma zamanı
    etkinse ancak yerel kart herhangi bir hedefe teslim edilemiyorsa OpenClaw,
    bekleyen onaydan tam `/approve` komutunu içeren aynı sohbet yedek bildirimini gönderir.

    Gateway kimlik doğrulaması ve onay çözümlemesi paylaşılan Gateway istemci sözleşmesini izler (`plugin:` kimlikleri `plugin.approval.resolve` üzerinden, diğer kimlikler `exec.approval.resolve` üzerinden çözümlenir). Onayların süresi varsayılan olarak 30 dakika sonra dolar.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Araçlar ve eylem kapıları

Discord ileti eylemleri mesajlaşma, kanal yönetimi, moderasyon, presence ve metadata eylemlerini içerir.

Temel örnekler:

- mesajlaşma: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- tepkiler: `react`, `reactions`, `emojiList`
- moderasyon: `timeout`, `kick`, `ban`
- presence: `setPresence`

`event-create` eylemi, zamanlanmış etkinlik kapak görselini ayarlamak için isteğe bağlı bir `image` parametresi (URL veya yerel dosya yolu) kabul eder.

Eylem kapıları `channels.discord.actions.*` altında bulunur.

Varsayılan kapı davranışı:

| Eylem grubu                                                                                                                                                             | Varsayılan    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | etkin         |
| roles                                                                                                                                                                    | devre dışı    |
| moderation                                                                                                                                                               | devre dışı    |
| presence                                                                                                                                                                 | devre dışı    |

## Components v2 UI

OpenClaw, exec onayları ve bağlamlar arası işaretleyiciler için Discord components v2 kullanır. Discord ileti eylemleri özel UI için `components` da kabul edebilir (ileri düzey; discord aracı üzerinden bir bileşen yükü oluşturmayı gerektirir), eski `embeds` kullanılabilir durumda kalsa da önerilmez.

- `channels.discord.ui.components.accentColor`, Discord bileşen kapsayıcıları tarafından kullanılan vurgu rengini ayarlar (hex).
- Hesap başına `channels.discord.accounts.<id>.ui.components.accentColor` ile ayarlayın.
- `channels.discord.agentComponents.ttlMs`, gönderilen Discord bileşen geri çağrılarının ne kadar süre kayıtlı kalacağını denetler (varsayılan `1800000`, maksimum `86400000`). Hesap başına `channels.discord.accounts.<id>.agentComponents.ttlMs` ile ayarlayın.
- Components v2 mevcut olduğunda `embeds` yok sayılır.
- Düz URL önizlemeleri varsayılan olarak bastırılır. Tek bir giden bağlantının genişlemesi gerektiğinde ileti eyleminde `suppressEmbeds: false` ayarlayın.

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

Discord'un iki ayrı ses yüzeyi vardır: gerçek zamanlı **ses kanalları** (sürekli konuşmalar) ve **sesli ileti ekleri** (dalga formu önizleme biçimi). Gateway her ikisini de destekler.

### Ses kanalları

Kurulum kontrol listesi:

1. Discord Developer Portal'da Message Content Intent'i etkinleştirin.
2. Rol/kullanıcı izin listeleri kullanıldığında Server Members Intent'i etkinleştirin.
3. Botu `bot` ve `applications.commands` kapsamlarıyla davet edin.
4. Hedef ses kanalında Connect, Speak, Send Messages ve Read Message History izinlerini verin.
5. Yerel komutları etkinleştirin (`commands.native` veya `channels.discord.commands.native`).
6. `channels.discord.voice` yapılandırmasını yapın.

Oturumları denetlemek için `/vc join|leave|status` kullanın. Komut, hesabın varsayılan aracısını kullanır ve diğer Discord komutlarıyla aynı izin listesi ve grup ilkesi kurallarını izler.

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

- `voice.tts`, yalnızca `stt-tts` ses oynatma için `messages.tts` ayarını geçersiz kılar. Realtime modları `voice.realtime.speakerVoice` kullanır.
- `voice.mode`, konuşma yolunu denetler. Varsayılan değer `agent-proxy` şeklindedir: realtime ses ön ucu tur zamanlamasını, kesintiyi ve oynatmayı yönetir, esas işi `openclaw_agent_consult` aracılığıyla yönlendirilen OpenClaw ajanına devreder ve sonucu, o konuşmacıdan gelen yazılı bir Discord istemi gibi ele alır. `stt-tts`, eski toplu STT artı TTS akışını korur. `bidi`, OpenClaw beyni için `openclaw_agent_consult` sunarken realtime modelin doğrudan sohbet etmesine izin verir.
- `voice.agentSession`, ses turlarını hangi OpenClaw konuşmasının alacağını denetler. Ses kanalının kendi oturumu için ayarlamadan bırakın veya ses kanalının `#maintainers` gibi mevcut bir Discord metin kanalı oturumunun mikrofon/hoparlör uzantısı gibi davranmasını sağlamak için `{ mode: "target", target: "channel:<text-channel-id>" }` olarak ayarlayın.
- `voice.model`, Discord ses yanıtları ve realtime danışmalar için OpenClaw ajan beynini geçersiz kılar. Yönlendirilen ajan modelini devralmak için ayarlamadan bırakın. Bu, `voice.realtime.model` ayarından ayrıdır.
- `voice.followUsers`, botun seçili kullanıcılarla birlikte Discord sesine katılmasına, taşınmasına ve ayrılmasına izin verir. Davranış kuralları ve örnekler için bkz. [Seste kullanıcıları takip et](#follow-users-in-voice).
- `agent-proxy`, konuşmayı `discord-voice` üzerinden yönlendirir; bu, konuşmacı ve hedef oturum için normal sahip/araç yetkilendirmesini korur ancak Discord ses oynatmaya sahip olduğu için ajan `tts` aracını gizler. Varsayılan olarak `agent-proxy`, sahip konuşmacılar için danışmaya sahip eşdeğeri tam araç erişimi verir (`voice.realtime.toolPolicy: "owner"`) ve esas yanıtlardan önce OpenClaw ajanına danışmayı güçlü biçimde tercih eder (`voice.realtime.consultPolicy: "always"`). Bu varsayılan `always` modunda realtime katman, danışma yanıtından önce otomatik dolgu konuşması yapmaz; konuşmayı yakalayıp yazıya döker, ardından yönlendirilen OpenClaw yanıtını konuşur. Discord ilk yanıtı hâlâ oynatırken birden fazla zorunlu danışma yanıtı biterse sonraki tam konuşma yanıtları, konuşmayı cümlenin ortasında değiştirmek yerine oynatma boşa çıkana kadar kuyruğa alınır.
- `stt-tts` modunda STT, `tools.media.audio` kullanır; `voice.model` yazıya dökmeyi etkilemez.
- Realtime modlarında `voice.realtime.provider`, `voice.realtime.model` ve `voice.realtime.speakerVoice`, realtime ses oturumunu yapılandırır. OpenAI Realtime 2 artı Codex beyni için `voice.realtime.model: "gpt-realtime-2"` ve `voice.model: "openai/gpt-5.5"` kullanın.
- Realtime ses modları, hızlı doğrudan turların yönlendirilen OpenClaw ajanıyla aynı kimliği, kullanıcı temellendirmesini ve personayı koruması için varsayılan olarak realtime sağlayıcı yönergelerine küçük `IDENTITY.md`, `USER.md` ve `SOUL.md` profil dosyalarını ekler. Bunu özelleştirmek için `voice.realtime.bootstrapContextFiles` değerini bir alt kümeye, devre dışı bırakmak için `[]` değerine ayarlayın. Desteklenen realtime önyükleme dosyaları bu profil dosyalarıyla sınırlıdır; `AGENTS.md` normal ajan bağlamında kalır. Enjekte edilen profil bağlamı, çalışma alanı işi, güncel gerçekler, bellek araması veya araç destekli eylemler için `openclaw_agent_consult` yerine geçmez.
- OpenAI `agent-proxy` realtime modunda, bir transkript bir uyandırma adıyla başlayana veya bitene kadar Discord realtime sesini sessiz tutmak için `voice.realtime.requireWakeName: true` ayarlayın. Yapılandırılan uyandırma adları bir veya iki kelime olmalıdır. `voice.realtime.wakeNames` ayarlanmamışsa OpenClaw, yönlendirilen ajan `name` değerini artı `OpenClaw` kullanır; yoksa ajan kimliği artı `OpenClaw` değerine geri döner. Uyandırma adı kapılaması realtime sağlayıcı otomatik yanıtını devre dışı bırakır, kabul edilen turları OpenClaw ajan danışma yolu üzerinden yönlendirir ve son transkript gelmeden önce kısmi yazıya dökümden baştaki bir uyandırma adı tanındığında kısa bir sözlü onay verir.
- OpenAI realtime sağlayıcı, güncel Realtime 2 olay adlarını ve çıkış sesi ile transkript olayları için eski Codex uyumlu takma adları kabul eder; böylece uyumlu sağlayıcı anlık görüntüleri asistan sesini düşürmeden farklılaşabilir.
- `voice.realtime.bargeIn`, Discord konuşmacı başlama olaylarının etkin realtime oynatmayı kesip kesmeyeceğini denetler. Ayarlanmamışsa realtime sağlayıcının giriş sesi kesinti ayarını izler.
- `voice.realtime.minBargeInAudioEndMs`, OpenAI realtime araya girme sesi kesmeden önceki minimum asistan oynatma süresini denetler. Varsayılan: `250`. Düşük yankılı odalarda anında kesinti için `0` ayarlayın veya yoğun yankılı hoparlör kurulumları için yükseltin.
- Discord oynatma üzerinde bir OpenAI sesi için `voice.tts.provider: "openai"` ayarlayın ve `voice.tts.providers.openai.speakerVoice` altında bir Text-to-speech sesi seçin. `cedar`, güncel OpenAI TTS modelinde erkeksi tınılı iyi bir seçimdir.
- Kanal başına Discord `systemPrompt` geçersiz kılmaları, o ses kanalı için ses transkripti turlarına uygulanır.
- Ses transkripti turları, sahip kapılı komutlar ve kanal eylemleri için sahip durumunu Discord `allowFrom` (veya `dm.allowFrom`) değerinden türetir. Ajan araç görünürlüğü, yönlendirilen oturum için yapılandırılan araç politikasını izler.
- Discord sesi, yalnızca metin yapılandırmaları için isteğe bağlıdır; `/vc` komutlarını, ses çalışma zamanını ve `GuildVoiceStates` Gateway amacını etkinleştirmek için `channels.discord.voice.enabled=true` ayarlayın (veya mevcut bir `channels.discord.voice` bloğunu koruyun).
- `channels.discord.intents.voiceStates`, ses durumu amacı aboneliğini açıkça geçersiz kılabilir. Amacın etkin ses etkinleştirmesini izlemesi için ayarlamadan bırakın.
- `voice.autoJoin` aynı sunucu için birden fazla girdiye sahipse OpenClaw o sunucu için son yapılandırılan kanala katılır.
- `voice.allowedChannels` isteğe bağlı bir ikamet izin listesidir. `/vc join` komutunun yetkili herhangi bir Discord ses kanalına girmesine izin vermek için ayarlamadan bırakın. Ayarlandığında `/vc join`, başlangıçta otomatik katılma ve bot ses durumu taşımaları listelenen `{ guildId, channelId }` girdileriyle sınırlanır. Tüm Discord ses katılımlarını reddetmek için boş dizi olarak ayarlayın. Discord botu izin listesinin dışına taşırsa OpenClaw o kanaldan ayrılır ve uygun olduğunda yapılandırılmış otomatik katılma hedefine yeniden katılır.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` katılma seçeneklerine aktarılır.
- Ayarlanmamışsa `@discordjs/voice` varsayılanları `daveEncryption=true` ve `decryptionFailureTolerance=24` şeklindedir.
- OpenClaw, Discord ses alma ve realtime ham PCM oynatma için paketlenmiş `libopus-wasm` codec'ini kullanır. Sabitlenmiş bir libopus WebAssembly derlemesiyle gelir ve yerel opus eklentileri gerektirmez.
- `voice.connectTimeoutMs`, `/vc join` ve otomatik katılma denemeleri için ilk `@discordjs/voice` Ready beklemesini denetler. Varsayılan: `30000`.
- `voice.reconnectGraceMs`, OpenClaw'ın bağlantısı kesilmiş bir ses oturumunu yok etmeden önce yeniden bağlanmaya başlamasını ne kadar bekleyeceğini denetler. Varsayılan: `15000`.
- `stt-tts` modunda ses oynatma, yalnızca başka bir kullanıcı konuşmaya başladı diye durmaz. Geri besleme döngülerini önlemek için OpenClaw, TTS oynatılırken yeni ses yakalamayı yok sayar; sonraki tur için oynatma bittikten sonra konuşun. Realtime modları, konuşmacı başlangıçlarını realtime sağlayıcıya araya girme sinyalleri olarak iletir.
- Realtime modlarında hoparlörlerden açık mikrofona gelen yankı, araya girme gibi görünüp oynatmayı kesebilir. Yoğun yankılı Discord odalarında, OpenAI'ın giriş sesinde otomatik kesinti yapmasını engellemek için `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` ayarlayın. Discord konuşmacı başlama olaylarının etkin oynatmayı kesmesini hâlâ istiyorsanız `voice.realtime.bargeIn: true` ekleyin. OpenAI realtime köprüsü, `voice.realtime.minBargeInAudioEndMs` değerinden kısa oynatma kesmelerini olası yankı/gürültü olarak yok sayar ve Discord oynatmayı temizlemek yerine atlandı olarak günlüğe kaydeder.
- `voice.captureSilenceGraceMs`, Discord bir konuşmacının durduğunu bildirdikten sonra OpenClaw'ın bu ses segmentini STT için sonlandırmadan önce ne kadar bekleyeceğini denetler. Varsayılan: `2000`; Discord normal duraklamaları kesik kısmi transkriptlere bölüyorsa bunu yükseltin.
- Seçili TTS sağlayıcısı ElevenLabs olduğunda, Discord ses oynatma akışlı TTS kullanır ve sağlayıcı yanıt akışından başlar. Akış desteği olmayan sağlayıcılar sentezlenmiş geçici dosya yoluna geri döner.
- OpenClaw ayrıca alma şifre çözme hatalarını izler ve kısa bir pencerede tekrarlanan hatalardan sonra ses kanalından ayrılıp yeniden katılarak otomatik kurtarır.
- Güncellemeden sonra alma günlükleri tekrar tekrar `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` gösteriyorsa bir bağımlılık raporu ve günlükler toplayın. Paketlenmiş `@discordjs/voice` satırı, discord.js PR #11449'dan gelen ve discord.js issue #11419'u kapatan yukarı akış dolgu düzeltmesini içerir.
- `The operation was aborted` alma olayları, OpenClaw yakalanan bir konuşmacı segmentini sonlandırdığında beklenir; bunlar uyarı değil, ayrıntılı tanılamalardır.
- Ayrıntılı Discord ses günlükleri, kabul edilen her konuşmacı segmenti için sınırlandırılmış tek satırlık STT transkript önizlemesi içerir; böylece hata ayıklama, sınırsız transkript metni dökmeden hem kullanıcı tarafını hem de ajan yanıtı tarafını gösterir.
- `agent-proxy` modunda zorunlu danışma geri dönüşü, `...` ile biten metin veya `and` gibi sonda kalan bir bağlaç gibi muhtemelen eksik transkript parçalarını ve “be right back” ya da “bye” gibi açıkça eyleme dönük olmayan kapanışları atlar. Bu durum bayat kuyruk yanıtını engellediğinde günlükler `forced agent consult skipped reason=...` gösterir.

### Seste kullanıcıları takip et

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
- `followUsers` yapılandırıldığında `followUsersEnabled` varsayılan olarak `true` olur. Kaydedilen listeyi koruyup otomatik ses takibini durdurmak için `false` olarak ayarlayın.
- Takip edilen bir kullanıcı izin verilen bir ses kanalına katıldığında OpenClaw o kanala katılır. Kullanıcı taşındığında OpenClaw onunla birlikte taşınır. Etkin takip edilen kullanıcı bağlantıyı kestiğinde OpenClaw ayrılır.
- Aynı sunucuda birden fazla takip edilen kullanıcı varsa ve etkin takip edilen kullanıcı ayrılırsa OpenClaw, sunucudan ayrılmadan önce izlenen başka bir takip edilen kullanıcının kanalına taşınır. Birkaç takip edilen kullanıcı aynı anda taşınırsa en son gözlemlenen ses durumu olayı kazanır.
- `allowedChannels` yine uygulanır. İzin verilmeyen bir kanaldaki takip edilen kullanıcı yok sayılır ve takip sahipli bir oturum başka bir takip edilen kullanıcıya taşınır veya ayrılır.
- OpenClaw, başlangıçta ve sınırlandırılmış bir aralıkta kaçırılan ses durumu olaylarını uzlaştırır. Uzlaştırma yapılandırılmış sunucuları örnekler ve çalıştırma başına REST aramalarını sınırlar; bu nedenle çok büyük `followUsers` listelerinin yakınsaması birden fazla aralık sürebilir.
- Discord veya bir yönetici botu bir kullanıcıyı takip ederken taşırsa OpenClaw ses oturumunu yeniden oluşturur ve hedefe izin veriliyorsa takip sahipliğini korur. Bot `allowedChannels` dışına taşınırsa OpenClaw ayrılır ve varsa yapılandırılmış hedefe yeniden katılır.
- DAVE alma kurtarması, tekrarlanan şifre çözme hatalarından sonra aynı kanaldan ayrılıp yeniden katılabilir. Takip sahipli oturumlar bu kurtarma yolunda takip sahipliğini korur; böylece daha sonra takip edilen kullanıcının bağlantıyı kesmesi yine kanaldan ayrılır.

Katılma modları arasında seçim yapın:

- Botun siz sesteyken otomatik olarak seste olmasını istediğiniz kişisel veya operatör kurulumları için `followUsers` kullanın.
- İzlenen hiçbir kullanıcı seste değilken bile bulunması gereken sabit oda botları için `autoJoin` kullanın.
- Tek seferlik katılımlar veya otomatik ses varlığının şaşırtıcı olacağı odalar için `/vc join` kullanın.

Discord ses codec'i:

- Ses alma günlüklerinde `discord voice: opus decoder: libopus-wasm` görünür.
- Gerçek zamanlı oynatma, paketleri `@discordjs/voice` öğesine vermeden önce ham 48 kHz stereo PCM'yi aynı paketlenmiş `libopus-wasm` paketiyle Opus'a kodlar.
- Dosya ve sağlayıcı akışı oynatma, ffmpeg ile ham 48 kHz stereo PCM'ye dönüştürür, ardından Discord'a gönderilen Opus paket akışı için `libopus-wasm` kullanır.

STT ve TTS işlem hattı:

- Discord PCM yakalaması geçici bir WAV dosyasına dönüştürülür.
- `tools.media.audio`, örneğin `openai/gpt-4o-mini-transcribe` ile STT'yi işler.
- Transkript, Discord girişi ve yönlendirme üzerinden gönderilir; yanıt LLM'si ise agent `tts` aracını gizleyen ve döndürülen metni isteyen bir ses çıkışı ilkesiyle çalışır, çünkü son TTS oynatmasının sahibi Discord sestir.
- `voice.model`, ayarlandığında yalnızca bu ses kanalı turu için yanıt LLM'sini geçersiz kılar.
- `voice.tts`, `messages.tts` üzerine birleştirilir; akış destekli sağlayıcılar oynatıcıyı doğrudan besler, aksi takdirde oluşan ses dosyası katılınan kanalda oynatılır.

Varsayılan agent-proxy ses kanalı oturumu örneği:

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

`voice.agentSession` bloğu olmadan her ses kanalı kendi yönlendirilmiş OpenClaw oturumunu alır. Örneğin, `/vc join channel:234567890123456789` bu Discord ses kanalının oturumuyla konuşur. Gerçek zamanlı model yalnızca ses ön ucudur; anlamlı istekler yapılandırılmış OpenClaw agent öğesine aktarılır. Gerçek zamanlı model consult aracını çağırmadan son transkript üretirse, varsayılanın yine agent ile konuşuyormuş gibi davranması için OpenClaw consult işlemini yedek olarak zorunlu kılar.

Eski STT ve TTS örneği:

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

`agent-proxy` modunda bot yapılandırılmış ses kanalına katılır, ancak OpenClaw agent turları hedef kanalın normal yönlendirilmiş oturumunu ve agent öğesini kullanır. Gerçek zamanlı ses oturumu, döndürülen sonucu ses kanalına geri söyler. Gözetmen agent, doğru eylem buysa ayrı bir Discord mesajı göndermek dahil, araç ilkesine göre normal mesaj araçlarını kullanmaya devam edebilir.

Yetki verilmiş bir OpenClaw çalışması etkinken, yeni Discord ses transkriptleri başka bir agent turu başlatılmadan önce canlı çalışma kontrolü olarak ele alınır. "status", "cancel that", "use the smaller fix" veya "when you're done also check tests" gibi ifadeler etkin oturum için durum, iptal, yönlendirme veya takip girdisi olarak sınıflandırılır. Durum, iptal, kabul edilen yönlendirme ve takip sonuçları ses kanalına geri söylenir; böylece arayan kişi OpenClaw'un isteği işleyip işlemediğini bilir.

Yararlı hedef biçimleri:

- `target: "channel:123456789012345678"` bir Discord metin kanalı oturumu üzerinden yönlendirir.
- `target: "123456789012345678"` kanal hedefi olarak ele alınır.
- `target: "dm:123456789012345678"` veya `target: "user:123456789012345678"` ilgili doğrudan mesaj oturumu üzerinden yönlendirir.

Yankısı yoğun OpenAI Realtime örneği:

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

Bunu model kendi Discord oynatmasını açık bir mikrofondan duyduğunda, ancak yine de konuşarak onu kesmek istediğinizde kullanın. OpenClaw, OpenAI'nin ham giriş sesinde otomatik kesme yapmasını engellerken `bargeIn: true`, Discord konuşmacı başlama olaylarının ve halihazırda etkin konuşmacı sesinin, bir sonraki yakalanan tur OpenAI'ye ulaşmadan önce etkin gerçek zamanlı yanıtları iptal etmesini sağlar. `audioEndMs` değeri `minBargeInAudioEndMs` altında olan çok erken araya girme sinyalleri muhtemel yankı/gürültü olarak ele alınır ve modelin ilk oynatma karesinde kesilmemesi için yok sayılır.

Beklenen ses günlükleri:

- Katılımda: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Gerçek zamanlı başlatmada: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Konuşmacı sesinde: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` ve `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Eski konuşma atlandığında: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` veya `reason=non-actionable-closing ...`
- Gerçek zamanlı yanıt tamamlandığında: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Oynatma durduğunda/sıfırlandığında: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Gerçek zamanlı consult sırasında: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Agent yanıtında: `discord voice: agent turn answer ...`
- Kuyruğa alınan bire bir konuşmada: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, ardından `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Araya girme algılandığında: `discord voice: realtime barge-in detected source=speaker-start ...` veya `discord voice: realtime barge-in detected source=active-speaker-audio ...`, ardından `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Gerçek zamanlı kesintide: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, ardından `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` ya da `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Yok sayılan yankı/gürültüde: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Araya girme devre dışıyken: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Boştaki oynatmada: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Kesilen sesi hata ayıklamak için gerçek zamanlı ses günlüklerini zaman çizelgesi olarak okuyun:

1. `realtime audio playback started`, Discord'un assistant sesini oynatmaya başladığı anlamına gelir. Köprü bu noktadan itibaren assistant çıkış parçalarını, Discord PCM baytlarını, sağlayıcı gerçek zamanlı baytlarını ve sentezlenen ses süresini saymaya başlar.
2. `realtime speaker turn opened`, bir Discord konuşmacısının etkinleştiğini belirtir. Oynatma zaten etkinse ve `bargeIn` etkinleştirilmişse, bunun ardından `barge-in detected source=speaker-start` gelebilir.
3. `realtime input audio started`, bu konuşmacı turu için alınan ilk gerçek ses karesini belirtir. Burada `outputActive=true` veya sıfır olmayan bir `outputAudioMs`, mikrofonun assistant oynatması hâlâ etkinken giriş gönderdiği anlamına gelir.
4. `barge-in detected source=active-speaker-audio`, OpenClaw'un assistant oynatması etkinken canlı konuşmacı sesi gördüğü anlamına gelir. Bu, gerçek bir kesmeyi yararlı sesi olmayan bir Discord konuşmacı başlama olayından ayırt etmek için kullanışlıdır.
5. `barge-in requested reason=...`, OpenClaw'un gerçek zamanlı sağlayıcıdan etkin yanıtı iptal etmesini veya kırpmasını istediği anlamına gelir. Kesinti öncesinde ne kadar assistant sesinin gerçekten oynatıldığını görebilmeniz için `outputAudioMs`, `outputActive` ve `playbackChunks` içerir.
6. `realtime audio playback stopped reason=...` yerel Discord oynatma sıfırlama noktasıdır. Gerekçe oynatmayı kimin durdurduğunu söyler: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` veya `session-close`.
7. `realtime speaker turn closed` yakalanan giriş turunu özetler. `chunks=0` veya `hasAudio=false`, konuşmacı turunun açıldığını ancak kullanılabilir sesin gerçek zamanlı köprüye ulaşmadığını gösterir. `interruptedPlayback=true`, bu giriş turunun assistant çıkışıyla çakıştığı ve araya girme mantığını tetiklediği anlamına gelir.

Yararlı alanlar:

- `outputAudioMs`: günlük satırından önce gerçek zamanlı sağlayıcı tarafından oluşturulan assistant ses süresi.
- `audioMs`: oynatma durmadan önce OpenClaw'un saydığı assistant ses süresi.
- `elapsedMs`: oynatma akışının veya konuşmacı turunun açılması ile kapanması arasındaki duvar saati süresi.
- `discordBytes`: Discord sesine gönderilen veya Discord sesinden alınan 48 kHz stereo PCM baytları.
- `realtimeBytes`: gerçek zamanlı sağlayıcıya gönderilen veya ondan alınan sağlayıcı biçimli PCM baytları.
- `playbackChunks`: etkin yanıt için Discord'a iletilen assistant ses parçaları.
- `sinceLastAudioMs`: son yakalanan konuşmacı ses karesi ile konuşmacı turunun kapanması arasındaki boşluk.

Yaygın kalıplar:

- `source=active-speaker-audio`, küçük `outputAudioMs` ve yakında aynı kullanıcıyla anında kesilme, genellikle hoparlör yankısının mikrofona girdiğini gösterir. `voice.realtime.minBargeInAudioEndMs` değerini artırın, hoparlör sesini düşürün, kulaklık kullanın veya `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` ayarlayın.
- `source=speaker-start` ardından `speaker turn closed ... hasAudio=false`, Discord'un bir konuşmacı başlangıcı bildirdiği ancak OpenClaw'a ses ulaşmadığı anlamına gelir. Bu geçici bir Discord ses olayı, gürültü kapısı davranışı veya istemcinin mikrofonu kısa süreliğine tetiklemesi olabilir.
- Yakında araya girme veya `provider-clear-audio` olmadan `audio playback stopped reason=stream-close`, yerel Discord oynatma akışının beklenmedik biçimde sona erdiği anlamına gelir. Öncesindeki sağlayıcı ve Discord oynatıcı günlüklerini kontrol edin.
- `capture ignored during playback (barge-in disabled)`, OpenClaw'un assistant sesi etkinken girişi bilerek bıraktığı anlamına gelir. Konuşmanın oynatmayı kesmesini istiyorsanız `voice.realtime.bargeIn` öğesini etkinleştirin.
- `barge-in ignored ... outputActive=false`, Discord veya sağlayıcı VAD'nin konuşma bildirdiği, ancak OpenClaw'un kesecek etkin oynatması olmadığı anlamına gelir. Bu sesi kesmemelidir.

Kimlik bilgileri bileşen başına çözümlenir: `voice.model` için LLM rota kimlik doğrulaması, `tools.media.audio` için STT kimlik doğrulaması, `messages.tts`/`voice.tts` için TTS kimlik doğrulaması ve `voice.realtime.providers` veya sağlayıcının normal kimlik doğrulama yapılandırması için gerçek zamanlı sağlayıcı kimlik doğrulaması.

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
  <Accordion title="İzin verilmeyen intent'ler kullanıldı veya bot sunucu mesajlarını görmüyor">

    - Message Content Intent'i etkinleştirin
    - kullanıcı/üye çözümlemesine bağlı olduğunuzda Server Members Intent'i etkinleştirin
    - intent'leri değiştirdikten sonra gateway'i yeniden başlatın

  </Accordion>

  <Accordion title="Sunucu mesajları beklenmedik şekilde engellendi">

    - `groupPolicy` değerini doğrulayın
    - `channels.discord.guilds` altındaki sunucu izin listesini doğrulayın
    - sunucu `channels` eşlemesi varsa yalnızca listelenen kanallara izin verilir
    - `requireMention` davranışını ve mention kalıplarını doğrulayın

    Yararlı kontroller:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Mention gereksinimi false ama hâlâ engelleniyor">
    Yaygın nedenler:

    - eşleşen sunucu/kanal izin listesi olmadan `groupPolicy="allowlist"`
    - `requireMention` yanlış yerde yapılandırılmış (`channels.discord.guilds` veya kanal girdisi altında olmalıdır)
    - gönderenin sunucu/kanal `users` izin listesi tarafından engellenmesi

  </Accordion>

  <Accordion title="Uzun süren Discord turları veya yinelenen yanıtlar">

    Tipik günlükler:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway kuyruğu ayarları:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çoklu hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - bu yalnızca Discord Gateway dinleyici işini kontrol eder, ajan turu ömrünü değil

    Discord, kuyruğa alınmış ajan turlarına kanalın sahip olduğu bir zaman aşımı uygulamaz. Mesaj dinleyicileri işi hemen devreder ve kuyruğa alınmış Discord çalıştırmaları, oturum/araç/çalışma zamanı yaşam döngüsü tamamlanana veya işi iptal edene kadar oturum başına sıralamayı korur.

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
    OpenClaw bağlanmadan önce Discord `/gateway/bot` meta verilerini alır. Geçici hatalar Discord'un varsayılan Gateway URL'sine geri döner ve günlüklerde hız sınırlamasına tabi tutulur.

    Meta veri zaman aşımı ayarları:

    - tek hesap: `channels.discord.gatewayInfoTimeoutMs`
    - çoklu hesap: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - yapılandırma ayarlanmamışsa env yedeği: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - varsayılan: `30000` (30 saniye), en fazla: `120000`

  </Accordion>

  <Accordion title="Gateway READY zaman aşımı yeniden başlatmaları">
    OpenClaw başlangıç sırasında ve çalışma zamanı yeniden bağlanmalarından sonra Discord'un Gateway `READY` olayını bekler. Başlangıç kademelendirmesi olan çoklu hesap kurulumları, varsayılandan daha uzun bir başlangıç READY penceresine ihtiyaç duyabilir.

    READY zaman aşımı ayarları:

    - başlangıç tek hesap: `channels.discord.gatewayReadyTimeoutMs`
    - başlangıç çoklu hesap: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa başlangıç env yedeği: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - başlangıç varsayılanı: `15000` (15 saniye), en fazla: `120000`
    - çalışma zamanı tek hesap: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - çalışma zamanı çoklu hesap: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa çalışma zamanı env yedeği: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - çalışma zamanı varsayılanı: `30000` (30 saniye), en fazla: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    `channels status --probe` izin denetimleri yalnızca sayısal kanal kimlikleriyle çalışır.

    Slug anahtarları kullanırsanız çalışma zamanı eşleştirmesi yine çalışabilir, ancak probe izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM devre dışı: `channels.discord.dm.enabled=false`
    - DM ilkesi devre dışı: `channels.discord.dmPolicy="disabled"` (eski: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Bot to bot loops">
    Varsayılan olarak bot tarafından yazılan iletiler yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız döngü davranışını önlemek için katı mention ve allowlist kuralları kullanın.
    Yalnızca bottan bahseden bot iletilerini kabul etmek için `channels.discord.allowBots="mentions"` tercih edin.

    OpenClaw ayrıca paylaşılan [bot döngüsü koruması](/tr/channels/bot-loop-protection) ile gelir. `allowBots`, bot tarafından yazılan iletilerin dispatch aşamasına ulaşmasına izin verdiğinde Discord, gelen olayı `(account, channel, bot pair)` bilgilerine eşler ve genel çift koruması, yapılandırılan olay bütçesini aştıktan sonra çifti bastırır. Koruma, daha önce Discord hız sınırlarıyla durdurulması gereken kontrolsüz iki botlu döngüleri önler; tek botlu dağıtımları veya bütçenin altında kalan tek seferlik bot yanıtlarını etkilemez.

    Varsayılan ayarlar (`allowBots` ayarlandığında etkin):

    - `maxEventsPerWindow: 20` -- bot çifti kayan pencere içinde 20 ileti alışverişi yapabilir
    - `windowSeconds: 60` -- kayan pencere uzunluğu
    - `cooldownSeconds: 60` -- bütçe tetiklendiğinde, her iki yöndeki her ek botlar arası ileti bir dakika boyunca bırakılır

    Paylaşılan varsayılanı bir kez `channels.defaults.botLoopProtection` altında yapılandırın, ardından meşru bir iş akışının daha fazla hareket alanına ihtiyacı olduğunda Discord için geçersiz kılın. Öncelik sırası şöyledir:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - yerleşik varsayılanlar

    Discord, genel `maxEventsPerWindow`, `windowSeconds` ve `cooldownSeconds` anahtarlarını kullanır.

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

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - Discord ses alma kurtarma mantığının mevcut olması için OpenClaw’ı güncel tutun (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` olduğunu doğrulayın (varsayılan)
    - `channels.discord.voice.decryptionFailureTolerance=24` değerinden başlayın (upstream varsayılanı) ve yalnızca gerekirse ayarlayın
    - günlüklerde şunları izleyin:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - otomatik yeniden katılmadan sonra hatalar devam ederse günlükleri toplayın ve [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) ile [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) içindeki upstream DAVE alma geçmişiyle karşılaştırın

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
- streaming: `streaming` (eski takma ad: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medya/yeniden deneme: `mediaMaxMb` (giden Discord yüklemelerini sınırlar, varsayılan `100MB`), `retry`
- eylemler: `actions.*`
- durum: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- özellikler: `threadBindings`, üst düzey `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Güvenlik ve işlemler

- Bot tokenlarını sır olarak ele alın (gözetimli ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- En az ayrıcalıklı Discord izinlerini verin.
- Komut dağıtımı/durumu eskiyse Gateway’i yeniden başlatın ve `openclaw channels status --probe` ile yeniden kontrol edin.

## İlgili

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Bir Discord kullanıcısını Gateway ile eşleştirin.
  </Card>
  <Card title="Groups" icon="users" href="/tr/channels/groups">
    Grup sohbeti ve allowlist davranışı.
  </Card>
  <Card title="Channel routing" icon="route" href="/tr/channels/channel-routing">
    Gelen iletileri aracılara yönlendirin.
  </Card>
  <Card title="Security" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sağlamlaştırma.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/tr/concepts/multi-agent">
    Guild’leri ve kanalları aracılarla eşleyin.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı.
  </Card>
</CardGroup>
