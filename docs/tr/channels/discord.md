---
read_when:
    - OpenClaw Docs i18n girdisi üzerinde çalışıyorum.
summary: Discord bot destek durumu, yetenekleri ve yapılandırması
title: Discord
x-i18n:
    generated_at: "2026-06-28T00:11:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90ed02258347113ca5b1dfcc5169a48190e3b4e1273d27a8a5c45f0f930cdbbf
    source_path: channels/discord.md
    workflow: 16
---

Resmi Discord Gateway aracılığıyla DM'ler ve sunucu kanalları için hazır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Discord DM'leri varsayılan olarak eşleştirme modunu kullanır.
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
  <Step title="Bir Discord uygulaması ve bot oluşturun">
    [Discord Developer Portal](https://discord.com/developers/applications) adresine gidin ve **New Application** öğesine tıklayın. "OpenClaw" gibi bir ad verin.

    Kenar çubuğunda **Bot** öğesine tıklayın. **Username** değerini OpenClaw aracınıza verdiğiniz ad olarak ayarlayın.

  </Step>

  <Step title="Ayrıcalıklı intent'leri etkinleştirin">
    Hâlâ **Bot** sayfasındayken **Privileged Gateway Intents** bölümüne kaydırın ve şunları etkinleştirin:

    - **Message Content Intent** (gerekli)
    - **Server Members Intent** (önerilir; rol izin listeleri ve ad-ID eşleştirmesi için gereklidir)
    - **Presence Intent** (isteğe bağlı; yalnızca presence güncellemeleri için gerekir)

  </Step>

  <Step title="Bot token'ınızı kopyalayın">
    **Bot** sayfasında tekrar yukarı kaydırın ve **Reset Token** öğesine tıklayın.

    <Note>
    Adına rağmen bu, ilk token'ınızı üretir; hiçbir şey "resetlenmez."
    </Note>

    Token'ı kopyalayın ve bir yere kaydedin. Bu sizin **Bot Token** değerinizdir ve kısa süre içinde buna ihtiyacınız olacak.

  </Step>

  <Step title="Davet URL'si oluşturun ve botu sunucunuza ekleyin">
    Kenar çubuğunda **OAuth2** öğesine tıklayın. Botu sunucunuza eklemek için doğru izinlere sahip bir davet URL'si oluşturacaksınız.

    **OAuth2 URL Generator** bölümüne kaydırın ve şunları etkinleştirin:

    - `bot`
    - `applications.commands`

    Aşağıda bir **Bot Permissions** bölümü görünecek. En az şunları etkinleştirin:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (isteğe bağlı)

    Bu, normal metin kanalları için temel settir. Forum veya medya kanalı iş akışları dahil olmak üzere Discord thread'lerine gönderi yapmayı planlıyorsanız, thread oluşturan veya sürdüren akışlar için **Send Messages in Threads** öğesini de etkinleştirin.
    Altta oluşturulan URL'yi kopyalayın, tarayıcınıza yapıştırın, sunucunuzu seçin ve bağlanmak için **Continue** öğesine tıklayın. Artık botunuzu Discord sunucusunda görmelisiniz.

  </Step>

  <Step title="Developer Mode'u etkinleştirin ve ID'lerinizi alın">
    Discord uygulamasına geri dönün; dahili ID'leri kopyalayabilmek için Developer Mode'u etkinleştirmeniz gerekir.

    1. **User Settings** öğesine tıklayın (avatarınızın yanındaki dişli simgesi) → **Advanced** → **Developer Mode** öğesini açın
    2. Kenar çubuğundaki **sunucu simgenize** sağ tıklayın → **Copy Server ID**
    3. **Kendi avatarınıza** sağ tıklayın → **Copy User ID**

    **Server ID** ve **User ID** değerlerinizi Bot Token'ınızla birlikte kaydedin; sonraki adımda üçünü de OpenClaw'a göndereceksiniz.

  </Step>

  <Step title="Sunucu üyelerinden DM'lere izin verin">
    Eşleştirmenin çalışması için Discord'un botunuzun size DM göndermesine izin vermesi gerekir. **Sunucu simgenize** sağ tıklayın → **Privacy Settings** → **Direct Messages** öğesini açın.

    Bu, sunucu üyelerinin (botlar dahil) size DM göndermesine izin verir. OpenClaw ile Discord DM'lerini kullanmak istiyorsanız bunu etkin tutun. Yalnızca sunucu kanallarını kullanmayı planlıyorsanız eşleştirmeden sonra DM'leri devre dışı bırakabilirsiniz.

  </Step>

  <Step title="Bot token'ınızı güvenli şekilde ayarlayın (sohbette göndermeyin)">
    Discord bot token'ınız bir sırdır (parola gibi). Aracınıza mesaj göndermeden önce OpenClaw'ın çalıştığı makinede ayarlayın.

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
    Yönetilen hizmet kurulumları için `DISCORD_BOT_TOKEN` değerinin bulunduğu bir kabuktan `openclaw gateway install` çalıştırın veya değişkeni `~/.openclaw/.env` içinde saklayın; böylece hizmet yeniden başlatıldıktan sonra env SecretRef değerini çözebilir.
    Host'unuz Discord'un başlangıç uygulaması araması tarafından engellenirse veya hız sınırına takılırsa, başlangıcın bu REST çağrısını atlayabilmesi için Developer Portal'dan Discord application/client ID değerini ayarlayın. Varsayılan hesap için `channels.discord.applicationId` kullanın veya birden fazla Discord botu çalıştırdığınızda `channels.discord.accounts.<accountId>.applicationId` kullanın.

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

        Varsayılan hesap için env fallback:

```bash
DISCORD_BOT_TOKEN=...
```

        Betikli veya uzaktan kurulum için aynı JSON5 bloğunu `openclaw config patch --file ./discord.patch.json5 --dry-run` ile yazın ve ardından `--dry-run` olmadan yeniden çalıştırın. Düz metin `token` değerleri desteklenir. SecretRef değerleri de env/file/exec sağlayıcıları genelinde `channels.discord.token` için desteklenir. Bkz. [Secrets Management](/tr/gateway/secrets).

        Birden fazla Discord botu için her bot token'ını ve application ID değerini kendi hesabı altında tutun. Üst düzey `channels.discord.applicationId` hesaplar tarafından devralınır; bu nedenle yalnızca her hesabın aynı application ID değerini kullanması gerekiyorsa orada ayarlayın.

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
Token çözümleme hesap farkındalığına sahiptir. Yapılandırma token değerleri env fallback değerine göre önceliklidir. `DISCORD_BOT_TOKEN` yalnızca varsayılan hesap için kullanılır.
Etkinleştirilmiş iki Discord hesabı aynı bot token'ına çözümlenirse OpenClaw bu token için yalnızca bir Gateway izleyicisi başlatır. Yapılandırma kaynaklı token, varsayılan env fallback değerine göre önceliklidir; aksi takdirde ilk etkin hesap kazanır ve yinelenen hesap devre dışı olarak raporlanır.
Gelişmiş giden çağrılar (mesaj aracı/kanal eylemleri) için açıkça belirtilen çağrı başına `token` o çağrıda kullanılır. Bu, gönderme ve okuma/deneme tarzı eylemler için geçerlidir (örneğin read/search/fetch/thread/pins/permissions). Hesap ilkesi/yeniden deneme ayarları yine etkin runtime snapshot'ında seçili hesaptan gelir.
</Note>

## Önerilen: Bir sunucu çalışma alanı kurun

DM'ler çalıştıktan sonra Discord sunucunuzu, her kanalın kendi bağlamına sahip kendi araç oturumunu aldığı tam bir çalışma alanı olarak ayarlayabilirsiniz. Bu, yalnızca sizin ve botunuzun bulunduğu özel sunucular için önerilir.

<Steps>
  <Step title="Sunucunuzu guild allowlist'e ekleyin">
    Bu, aracınızın yalnızca DM'lerde değil, sunucunuzdaki herhangi bir kanalda yanıt vermesini sağlar.

    <Tabs>
      <Tab title="Aracınıza sorun">
        > "Discord Server ID `<server_id>` değerimi guild allowlist'e ekle"
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
    Varsayılan olarak aracınız sunucu kanallarında yalnızca @mention edildiğinde yanıt verir. Özel bir sunucu için muhtemelen her mesaja yanıt vermesini istersiniz.

    Sunucu kanallarında normal yanıtlar varsayılan olarak otomatik gönderilir. Paylaşılan sürekli açık odalar için `messages.groupChat.visibleReplies: "message_tool"` seçeneğine katılın; böylece araç beklemede kalabilir ve yalnızca kanal yanıtının yararlı olduğuna karar verdiğinde gönderi yapar. Bu, GPT 5.5 gibi son nesil, araç açısından güvenilir modellerle en iyi çalışır. Ortam oda olayları araç göndermediği sürece sessiz kalır. Tam bekleme modu yapılandırması için [Ortam oda olayları](/tr/channels/ambient-room-events) sayfasına bakın.

    Discord yazıyor göstergesi gösteriyor ve günlükler token kullanımını gösteriyor ancak gönderilmiş mesaj yoksa, turun bir ortam oda olayı olarak yapılandırılıp yapılandırılmadığını veya message-tool görünür yanıtlarına katılıp katılmadığını kontrol edin.

    <Tabs>
      <Tab title="Aracınıza sorun">
        > "Aracımın bu sunucuda @mention edilmesine gerek kalmadan yanıt vermesine izin ver"
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
      <Tab title="Aracınıza sorun">
        > "Discord kanallarında soru sorduğumda, MEMORY.md dosyasından uzun vadeli bağlama ihtiyacın olursa memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Manuel">
        Her kanalda paylaşılan bağlama ihtiyacınız varsa, kararlı talimatları `AGENTS.md` veya `USER.md` içine koyun (bunlar her oturum için enjekte edilir). Uzun vadeli notları `MEMORY.md` içinde tutun ve bellek araçlarıyla gerektiğinde erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Şimdi Discord sunucunuzda birkaç kanal oluşturun ve sohbet etmeye başlayın. Aracınız kanal adını görebilir ve her kanal kendi yalıtılmış oturumunu alır; böylece `#coding`, `#home`, `#research` veya iş akışınıza uyan herhangi bir şeyi ayarlayabilirsiniz.

## Runtime modeli

- Gateway, Discord bağlantısının sahibidir.
- Yanıt yönlendirme deterministiktir: Discord’dan gelen yanıtlar Discord’a geri döner.
- Discord sunucu/kanal meta verileri, kullanıcıya görünen bir yanıt öneki olarak değil,
  güvenilmeyen bağlam olarak model istemine eklenir. Bir model bu zarfı
  geri kopyalarsa, OpenClaw kopyalanan meta verileri giden yanıtlardan ve
  gelecekteki yeniden oynatma bağlamından çıkarır.
- Varsayılan olarak (`session.dmScope=main`), doğrudan sohbetler ajanın ana oturumunu paylaşır (`agent:main:main`).
- Sunucu kanalları izole oturum anahtarlarıdır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM’leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel slash komutları izole komut oturumlarında çalışır (`agent:<agentId>:discord:slash:<userId>`), ancak yönlendirilen konuşma oturumuna `CommandTargetSessionKey` taşımaya devam eder.
- Discord’a metin tabanlı cron/heartbeat duyuru teslimi, son
  asistan-görünür yanıtı bir kez kullanır. Medya ve yapılandırılmış bileşen payload’ları,
  ajan birden çok teslim edilebilir payload yaydığında çok mesajlı kalır.

## Forum kanalları

Discord forum ve medya kanalları yalnızca iş parçacığı gönderilerini kabul eder. OpenClaw bunları oluşturmak için iki yol destekler:

- Otomatik iş parçacığı oluşturmak için forum üst kanalına (`channel:<forumId>`) bir mesaj gönderin. İş parçacığı başlığı, mesajınızın boş olmayan ilk satırını kullanır.
- Doğrudan iş parçacığı oluşturmak için `openclaw message thread create` kullanın. Forum kanalları için `--message-id` geçmeyin.

Örnek: iş parçacığı oluşturmak için forum üst kanalına gönderin

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Örnek: açıkça bir forum iş parçacığı oluşturun

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum üst kanalları Discord bileşenlerini kabul etmez. Bileşenlere ihtiyacınız varsa, iş parçacığının kendisine gönderin (`channel:<threadId>`).

## Etkileşimli bileşenler

OpenClaw, ajan mesajları için Discord components v2 kapsayıcılarını destekler. `components` payload’ı ile mesaj aracını kullanın. Etkileşim sonuçları ajana normal gelen mesajlar olarak yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Eylem satırları en fazla 5 düğmeye veya tek bir seçim menüsüne izin verir
- Seçim türleri: `string`, `user`, `role`, `mentionable`, `channel`

Varsayılan olarak bileşenler tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süreleri dolana kadar birden çok kez kullanılmasına izin vermek için `components.reusable=true` ayarlayın.

Bir düğmeye kimlerin tıklayabileceğini kısıtlamak için o düğmede `allowedUsers` ayarlayın (Discord kullanıcı kimlikleri, etiketler veya `*`). Yapılandırıldığında, eşleşmeyen kullanıcılar geçici bir ret alır.

Bileşen callback’lerinin süresi varsayılan olarak 30 dakika sonra dolar. Varsayılan Discord hesabı için bu callback kayıt defteri ömrünü değiştirmek üzere `channels.discord.agentComponents.ttlMs`, çok hesaplı kurulumda tek bir hesabı geçersiz kılmak için `channels.discord.accounts.<accountId>.agentComponents.ttlMs` ayarlayın. Değer milisaniye cinsindedir, pozitif bir tamsayı olmalıdır ve `86400000` (24 saat) ile sınırlandırılır. Daha uzun TTL’ler, düğmelerin kullanılabilir kalmasını gerektiren inceleme veya onay iş akışları için kullanışlıdır, ancak eski bir Discord mesajının hâlâ bir eylemi tetikleyebileceği pencereyi de uzatır. İş akışına uyan en kısa TTL’yi tercih edin ve eski callback’ler şaşırtıcı olacaksa varsayılanı koruyun.

`/model` ve `/models` slash komutları, sağlayıcı, model ve uyumlu çalışma zamanı açılır listeleri ile bir Gönder adımı içeren etkileşimli bir model seçici açar. `/models add` kullanımdan kaldırılmıştır ve artık sohbetten model kaydetmek yerine bir kullanımdan kaldırma mesajı döndürür. Seçici yanıtı geçicidir ve yalnızca çağıran kullanıcı onu kullanabilir. Discord seçim menüleri 25 seçenekle sınırlıdır, bu nedenle seçicinin dinamik olarak keşfedilen modelleri yalnızca `openai` veya `vllm` gibi seçili sağlayıcılar için göstermesini istediğinizde `agents.defaults.models` içine `provider/*` girdileri ekleyin.

Dosya ekleri:

- `file` blokları bir ek referansına işaret etmelidir (`attachment://<filename>`)
- Eki `media`/`path`/`filePath` üzerinden sağlayın (tek dosya); birden çok dosya için `media-gallery` kullanın
- Yükleme adının ek referansıyla eşleşmesi gerektiğinde geçersiz kılmak için `filename` kullanın

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

    DM ilkesi açık değilse, bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme için yönlendirilir).

    Çok hesaplı öncelik:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesabına uygulanır.
    - Tek bir hesap için `allowFrom`, eski `dm.allowFrom` değerine göre önceliklidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` ve eski `dm.allowFrom` değerleri ayarlanmamışsa `channels.discord.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.discord.accounts.default.allowFrom` değerini devralmaz.

    Eski `channels.discord.dm.policy` ve `channels.discord.dm.allowFrom` uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` değerlerine taşır.

    Teslimat için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` mention

    Yalın sayısal kimlikler, bir kanal varsayılanı etkinken normalde kanal kimlikleri olarak çözümlenir, ancak hesabın etkili DM `allowFrom` listesinde yer alan kimlikler uyumluluk için kullanıcı DM hedefleri olarak değerlendirilir.

  </Tab>

  <Tab title="Access groups">
    Discord DM’leri ve metin komutu yetkilendirmesi, `channels.discord.allowFrom` içinde dinamik `accessGroup:<name>` girdilerini kullanabilir.

    Erişim grubu adları mesaj kanalları arasında paylaşılır. Üyeleri her kanalın normal `allowFrom` söz diziminde ifade edilen statik bir grup için `type: "message.senders"` kullanın veya bir Discord kanalının geçerli `ViewChannel` kitlesi üyeliği dinamik olarak tanımlamalıysa `type: "discord.channelAudience"` kullanın. Paylaşılan erişim grubu davranışı burada belgelenmiştir: [Erişim grupları](/tr/channels/access-groups).

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

    Bir Discord metin kanalının ayrı bir üye listesi yoktur. `type: "discord.channelAudience"` üyeliği şöyle modeller: DM gönderen, yapılandırılmış sunucunun üyesidir ve rol ile kanal üzerine yazmaları uygulandıktan sonra yapılandırılmış kanalda o anda etkili `ViewChannel` iznine sahiptir.

    Örnek: DMs’i diğer herkese kapalı tutarken `#maintainers` kanalını görebilen herkesin bota DM göndermesine izin verin.

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

    Aramalar kapalı başarısız olur. Discord `Missing Access` döndürürse, üye araması başarısız olursa veya kanal farklı bir sunucuya aitse, DM gönderen yetkisiz olarak değerlendirilir.

    Kanal kitlesi erişim gruplarını kullanırken bot için Discord Developer Portal **Server Members Intent** özelliğini etkinleştirin. DM’ler sunucu üye durumunu içermez, bu nedenle OpenClaw üyeyi yetkilendirme zamanında Discord REST üzerinden çözer.

  </Tab>

  <Tab title="Guild policy">
    Sunucu işleme `channels.discord.groupPolicy` tarafından denetlenir:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` mevcut olduğunda güvenli temel değer `allowlist` olur.

    `allowlist` davranışı:

    - sunucu `channels.discord.guilds` ile eşleşmelidir (`id` tercih edilir, slug kabul edilir)
    - isteğe bağlı gönderen izin listeleri: `users` (kararlı kimlikler önerilir) ve `roles` (yalnızca rol kimlikleri); ikisinden biri yapılandırılmışsa, gönderenler `users` VEYA `roles` ile eşleştiklerinde izinli olur
    - doğrudan ad/etiket eşleştirme varsayılan olarak devre dışıdır; `channels.discord.dangerouslyAllowNameMatching: true` değerini yalnızca son çare uyumluluk modu olarak etkinleştirin
    - `users` için adlar/etiketler desteklenir, ancak kimlikler daha güvenlidir; ad/etiket girdileri kullanıldığında `openclaw security audit` uyarır
    - bir sunucuda `channels` yapılandırılmışsa, listelenmeyen kanallar reddedilir
    - bir sunucuda `channels` bloğu yoksa, o izin listesindeki sunucudaki tüm kanallara izin verilir

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

    Yalnızca `DISCORD_BOT_TOKEN` ayarlarsanız ve bir `channels.discord` bloğu oluşturmazsanız, çalışma zamanı fallback’i `groupPolicy="allowlist"` olur (loglarda bir uyarıyla), `channels.defaults.groupPolicy` `open` olsa bile.

  </Tab>

  <Tab title="Mentions and group DMs">
    Sunucu mesajları varsayılan olarak mention kapılıdır.

    Mention algılama şunları içerir:

    - açık bot mention’ı
    - yapılandırılmış mention desenleri (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda örtük bota-yanıtla davranışı

    Giden Discord mesajları yazarken kanonik mention söz dizimini kullanın: kullanıcılar için `<@USER_ID>`, kanallar için `<#CHANNEL_ID>` ve roller için `<@&ROLE_ID>`. Eski `<@!USER_ID>` takma ad mention biçimini kullanmayın.

    `requireMention` sunucu/kanal başına yapılandırılır (`channels.discord.guilds...`).
    `ignoreOtherMentions`, isteğe bağlı olarak başka bir kullanıcı/rolden mention eden ancak botu mention etmeyen mesajları düşürür (@everyone/@here hariç).

    Grup DM’leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - `dm.groupChannels` üzerinden isteğe bağlı izin listesi (kanal kimlikleri veya slug’lar)

  </Tab>
</Tabs>

### Rol tabanlı ajan yönlendirmesi

`bindings[].match.roles` kullanarak Discord sunucu üyelerini rol kimliğine göre farklı ajanlara yönlendirin. Rol tabanlı bağlamalar yalnızca rol kimliklerini kabul eder ve eş veya üst-eş bağlamalarından sonra, yalnızca sunucu bağlamalarından önce değerlendirilir. Bir bağlama başka eşleşme alanları da ayarlıyorsa (örneğin `peer` + `guildId` + `roles`), yapılandırılan tüm alanlar eşleşmelidir.

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
- `commands.native=false`, başlangıç sırasında Discord slash komutu kaydını ve temizliğini atlar. Önceden kaydedilmiş komutlar, siz onları Discord uygulamasından kaldırana kadar Discord içinde görünür kalabilir.
- Yerel komut yetkilendirmesi, normal mesaj işleme ile aynı Discord izin listelerini/ilkelerini kullanır.
- Komutlar yetkili olmayan kullanıcılar için Discord arayüzünde hâlâ görünür olabilir; yürütme yine OpenClaw yetkilendirmesini uygular ve "yetkili değil" döndürür.

Komut kataloğu ve davranışı için [Slash komutları](/tr/tools/slash-commands) bölümüne bakın.

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

    Not: `off`, örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.
    `first`, dönüşteki ilk giden Discord mesajına örtük yerel yanıt referansını her zaman ekler.
    `batched`, yalnızca gelen olay birden fazla mesajdan oluşan debounce uygulanmış bir toplu işlem olduğunda Discord'un örtük yerel yanıt referansını ekler. Bu, yerel yanıtları her tek mesajlı dönüş için değil, esas olarak belirsiz ve ani yoğun sohbetler için istediğinizde kullanışlıdır.

    Mesaj kimlikleri bağlamda/geçmişte sunulur, böylece ajanlar belirli mesajları hedefleyebilir.

  </Accordion>

  <Accordion title="Bağlantı önizlemeleri">
    Discord varsayılan olarak URL'ler için zengin bağlantı gömmeleri oluşturur. OpenClaw, varsayılan olarak giden Discord mesajlarında bu oluşturulan gömmeleri bastırır; böylece ajan tarafından gönderilen URL'ler, siz etkinleştirmedikçe düz bağlantılar olarak kalır:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Tek bir hesabı geçersiz kılmak için `channels.discord.accounts.<id>.suppressEmbeds` ayarını yapın. Ajan mesaj aracı gönderimleri, tek bir mesaj için `suppressEmbeds: false` da geçirebilir. Açık Discord `embeds` yükleri, varsayılan bağlantı önizleme ayarı tarafından bastırılmaz.

  </Accordion>

  <Accordion title="Canlı akış önizlemesi">
    OpenClaw, geçici bir mesaj gönderip metin geldikçe onu düzenleyerek taslak yanıtları akış halinde verebilir. `channels.discord.streaming`, `off` | `partial` | `block` | `progress` (varsayılan) değerlerini alır. `progress`, düzenlenebilir tek bir durum taslağını tutar ve son teslimata kadar araç ilerlemesiyle günceller; paylaşılan başlangıç etiketi kayan bir satırdır, bu nedenle yeterince iş göründüğünde diğerleri gibi görünümden kayar. `streamMode`, eski bir çalışma zamanı takma adıdır. Kalıcı yapılandırmayı kurallı anahtara yeniden yazmak için `openclaw doctor --fix` çalıştırın.

    Discord önizleme düzenlemelerini devre dışı bırakmak için `channels.discord.streaming.mode` değerini `off` olarak ayarlayın. Discord blok akışı açıkça etkinleştirilmişse OpenClaw, çift akışı önlemek için önizleme akışını atlar.

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

    - `partial`, belirteçler geldikçe tek bir önizleme mesajını düzenler.
    - `block`, taslak boyutunda parçalar yayar (boyutu ve kırılma noktalarını ayarlamak için `draftChunk` kullanın; `textChunkLimit` ile sınırlandırılır).
    - Medya, hata ve açık-yanıt sonları bekleyen önizleme düzenlemelerini iptal eder.
    - `streaming.preview.toolProgress` (varsayılan `true`), araç/ilerleme güncellemelerinin önizleme mesajını yeniden kullanıp kullanmayacağını denetler.
    - Araç/ilerleme satırları, mevcut olduğunda kompakt emoji + başlık + ayrıntı olarak işlenir; örneğin `🛠️ Bash: run tests` veya `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (varsayılan `false`), geçici ilerleme taslağında asistan yorum/açılış metnini etkinleştirir. Yorum görüntülenmeden önce temizlenir, geçici kalır ve son yanıt teslimatını değiştirmez.
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

    Önizleme akışı yalnızca metindir; medya yanıtları normal teslimata geri döner. `block` akışı açıkça etkinleştirildiğinde OpenClaw, çift akışı önlemek için önizleme akışını atlar.

  </Accordion>

  <Accordion title="Geçmiş, bağlam ve iş parçacığı davranışı">
    Sunucu geçmişi bağlamı:

    - `channels.discord.historyLimit` varsayılan `20`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    DM geçmişi denetimleri:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    İş parçacığı davranışı:

    - Discord iş parçacıkları kanal oturumları olarak yönlendirilir ve geçersiz kılınmadıkça üst kanal yapılandırmasını devralır.
    - İş parçacığı oturumları, üst kanalın oturum düzeyi `/model` seçimini yalnızca model yedeği olarak devralır; iş parçacığına yerel `/model` seçimleri yine önceliklidir ve transkript devralma etkinleştirilmedikçe üst transkript geçmişi kopyalanmaz.
    - `channels.discord.thread.inheritParent` (varsayılan `false`), yeni otomatik iş parçacıklarının üst transkriptten başlatılmasını sağlar. Hesap başına geçersiz kılmalar `channels.discord.accounts.<id>.thread.inheritParent` altında bulunur.
    - Mesaj aracı tepkileri `user:<id>` DM hedeflerini çözümleyebilir.
    - `guilds.<guild>.channels.<channel>.requireMention: false`, yanıt aşaması etkinleştirme yedeği sırasında korunur.

    Kanal konuları **güvenilmeyen** bağlam olarak eklenir. İzin listeleri ajanı kimin tetikleyebileceğini sınırlar; tam bir ek bağlam redaksiyon sınırı değildir.

  </Accordion>

  <Accordion title="Alt ajanlar için iş parçacığına bağlı oturumlar">
    Discord, bir iş parçacığını bir oturum hedefine bağlayabilir; böylece o iş parçacığındaki takip mesajları aynı oturuma yönlendirilmeye devam eder (alt ajan oturumları dahil).

    Komutlar:

    - `/focus <target>` geçerli/yeni iş parçacığını bir alt ajan/oturum hedefine bağlar
    - `/unfocus` geçerli iş parçacığı bağlamasını kaldırır
    - `/agents` etkin çalıştırmaları ve bağlama durumunu gösterir
    - `/session idle <duration|off>` odaklanmış bağlamalar için hareketsizlik otomatik odaktan çıkarma ayarını inceler/günceller
    - `/session max-age <duration|off>` odaklanmış bağlamalar için katı en yüksek yaşı inceler/günceller

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

    - `session.threadBindings.*` küresel varsayılanları ayarlar.
    - `channels.discord.threadBindings.*` Discord davranışını geçersiz kılar.
    - `spawnSessions`, `sessions_spawn({ thread: true })` ve ACP iş parçacığı başlatmaları için iş parçacıklarının otomatik oluşturulmasını/bağlanmasını denetler. Varsayılan: `true`.
    - `defaultSpawnContext`, iş parçacığına bağlı başlatmalar için yerel alt ajan bağlamını denetler. Varsayılan: `"fork"`.
    - Kullanımdan kaldırılmış `spawnSubagentSessions`/`spawnAcpSessions` anahtarları `openclaw doctor --fix` tarafından taşınır.
    - Bir hesap için iş parçacığı bağlamaları devre dışıysa `/focus` ve ilgili iş parçacığı bağlama işlemleri kullanılamaz.

    [Alt ajanlar](/tr/tools/subagents), [ACP Ajanları](/tr/tools/acp-agents) ve [Yapılandırma Başvurusu](/tr/gateway/configuration-reference) bölümlerine bakın.

  </Accordion>

  <Accordion title="Kalıcı ACP kanal bağlamaları">
    Kararlı "her zaman açık" ACP çalışma alanları için Discord konuşmalarını hedefleyen üst düzey yazımlı ACP bağlamaları yapılandırın.

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

    - `/acp spawn codex --bind here`, geçerli kanalı veya iş parçacığını yerinde bağlar ve gelecekteki mesajları aynı ACP oturumunda tutar. İş parçacığı mesajları üst kanal bağlamasını devralır.
    - Bağlı bir kanalda veya iş parçacığında `/new` ve `/reset`, aynı ACP oturumunu yerinde sıfırlar. Geçici iş parçacığı bağlamaları etkinken hedef çözümlemesini geçersiz kılabilir.
    - `spawnSessions`, `--thread auto|here` üzerinden alt iş parçacığı oluşturmayı/bağlamayı sınırlar.

    Bağlama davranışı ayrıntıları için [ACP Ajanları](/tr/tools/acp-agents) bölümüne bakın.

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
    - ajan kimliği emoji yedeği (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Discord unicode emoji veya özel emoji adlarını kabul eder.
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Yapılandırma yazmaları">
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
    Discord Gateway WebSocket trafiğini ve başlangıç REST aramalarını (uygulama kimliği + izin listesi çözümleme), `channels.discord.proxy` ile bir HTTP(S) proxy üzerinden yönlendirin.

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
    Proxy uygulanmış mesajları sistem üyesi kimliğine eşlemek için PluralKit çözümlemesini etkinleştirin:

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
    - üye görünen adları yalnızca `channels.discord.dangerouslyAllowNameMatching: true` olduğunda ada/slug'a göre eşleştirilir
    - aramalar özgün mesaj kimliğini kullanır ve zaman penceresiyle sınırlıdır
    - arama başarısız olursa, proxied mesajlar bot mesajı olarak değerlendirilir ve `allowBots=true` değilse düşürülür

  </Accordion>

  <Accordion title="Giden bahsetme takma adları">
    Ajanların bilinen Discord kullanıcıları için deterministik giden bahsetmelere ihtiyaç duyduğu durumlarda `mentionAliases` kullanın. Anahtarlar başındaki `@` olmadan tanıtıcılardır; değerler Discord kullanıcı kimlikleridir. Bilinmeyen tanıtıcılar, `@everyone`, `@here` ve Markdown kod aralıkları içindeki bahsetmeler değişmeden bırakılır.

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

  <Accordion title="Durum yapılandırması">
    Durum veya etkinlik alanı ayarladığınızda ya da otomatik durumu etkinleştirdiğinizde durum güncellemeleri uygulanır.

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
    - 1: Yayın yapıyor (`activityUrl` gerektirir)
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
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    Otomatik durum, çalışma zamanı kullanılabilirliğini Discord durumuna eşler: sağlıklı => çevrimiçi, bozulmuş veya bilinmiyor => boşta, tükenmiş veya kullanılamaz => rahatsız etmeyin. İsteğe bağlı metin geçersiz kılmaları:

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

    `enabled` ayarı unset veya `"auto"` olduğunda ve `execApprovals.approvers` ya da `commands.ownerAllowFrom` üzerinden en az bir onaylayıcı çözümlenebildiğinde Discord yerel exec onaylarını otomatik olarak etkinleştirir. Discord exec onaylayıcılarını kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan mesaj `defaultTo` değerinden çıkarsamaz. Discord'u yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `/diagnostics` ve `/export-trajectory` gibi hassas, yalnızca sahip komutlarına yönelik grup komutlarında OpenClaw onay istemlerini ve nihai sonuçları özel olarak gönderir. Çağıran sahibin bir Discord sahip rotası varsa önce Discord DM'yi dener; bu mevcut değilse Telegram gibi `commands.ownerAllowFrom` içinden kullanılabilir ilk sahip rotasına geri döner.

    `target` `channel` veya `both` olduğunda onay istemi kanalda görünür. Düğmeleri yalnızca çözümlenmiş onaylayıcılar kullanabilir; diğer kullanıcılar geçici bir ret alır. Onay istemleri komut metnini içerir, bu nedenle kanal teslimini yalnızca güvenilir kanallarda etkinleştirin. Kanal kimliği oturum anahtarından türetilemezse OpenClaw DM teslimine geri döner.

    Discord ayrıca diğer sohbet kanalları tarafından kullanılan paylaşılan onay düğmelerini işler. Yerel Discord adaptörü temel olarak onaylayıcı DM yönlendirmesi ve kanal yayılımı ekler.
    Bu düğmeler mevcut olduğunda birincil onay kullanıcı deneyimi bunlardır; OpenClaw
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun
    manuel onay olduğunu söylediğinde manuel bir `/approve` komutu eklemelidir.
    Discord yerel onay çalışma zamanı etkin değilse OpenClaw yerel deterministik
    `/approve <id> <decision>` istemini görünür tutar. Çalışma zamanı etkin
    ancak yerel bir kart herhangi bir hedefe teslim edilemiyorsa OpenClaw,
    bekleyen onaydan alınan tam `/approve` komutuyla aynı sohbet içinde bir geri dönüş bildirimi gönderir.

    Gateway kimlik doğrulaması ve onay çözümlemesi paylaşılan Gateway istemci sözleşmesini izler (`plugin:` kimlikleri `plugin.approval.resolve` üzerinden, diğer kimlikler `exec.approval.resolve` üzerinden çözümlenir). Onaylar varsayılan olarak 30 dakika sonra sona erer.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Araçlar ve eylem kapıları

Discord mesaj eylemleri mesajlaşma, kanal yönetimi, moderasyon, durum ve meta veri eylemlerini içerir.

Temel örnekler:

- mesajlaşma: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- tepkiler: `react`, `reactions`, `emojiList`
- moderasyon: `timeout`, `kick`, `ban`
- durum: `setPresence`

`event-create` eylemi, zamanlanmış etkinlik kapak görselini ayarlamak için isteğe bağlı bir `image` parametresi (URL veya yerel dosya yolu) kabul eder.

Eylem kapıları `channels.discord.actions.*` altında bulunur.

Varsayılan kapı davranışı:

| Eylem grubu                                                                                                                                                              | Varsayılan      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | etkin           |
| roles                                                                                                                                                                    | devre dışı      |
| moderation                                                                                                                                                               | devre dışı      |
| presence                                                                                                                                                                 | devre dışı      |

## Components v2 kullanıcı arayüzü

OpenClaw, exec onayları ve bağlamlar arası işaretçiler için Discord components v2 kullanır. Discord mesaj eylemleri özel kullanıcı arayüzü için `components` de kabul edebilir (ileri düzey; discord aracı üzerinden bir bileşen yükü oluşturmayı gerektirir); eski `embeds` ise kullanılabilir kalır ancak önerilmez.

- `channels.discord.ui.components.accentColor`, Discord bileşen kapsayıcıları tarafından kullanılan vurgu rengini ayarlar (hex).
- Hesap başına `channels.discord.accounts.<id>.ui.components.accentColor` ile ayarlayın.
- `channels.discord.agentComponents.ttlMs`, gönderilen Discord bileşen geri çağrılarının ne kadar süre kayıtlı kalacağını denetler (varsayılan `1800000`, maksimum `86400000`). Hesap başına `channels.discord.accounts.<id>.agentComponents.ttlMs` ile ayarlayın.
- Components v2 mevcut olduğunda `embeds` yok sayılır.
- Düz URL önizlemeleri varsayılan olarak bastırılır. Tek bir giden bağlantının genişlemesi gerektiğinde mesaj eyleminde `suppressEmbeds: false` ayarlayın.

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

Kurulum kontrol listesi:

1. Discord Developer Portal'da Message Content Intent'i etkinleştirin.
2. Rol/kullanıcı izin listeleri kullanıldığında Server Members Intent'i etkinleştirin.
3. Botu `bot` ve `applications.commands` kapsamlarıyla davet edin.
4. Hedef ses kanalında Connect, Speak, Send Messages ve Read Message History izinlerini verin.
5. Yerel komutları etkinleştirin (`commands.native` veya `channels.discord.commands.native`).
6. `channels.discord.voice` yapılandırın.

Oturumları denetlemek için `/vc join|leave|status` kullanın. Komut, hesabın varsayılan ajanını kullanır ve diğer Discord komutlarıyla aynı izin listesi ve grup politikası kurallarını izler.

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

- `voice.tts`, yalnızca `stt-tts` ses oynatımı için `messages.tts` ayarını geçersiz kılar. Realtime modları `voice.realtime.speakerVoice` kullanır.
- `voice.mode` konuşma yolunu denetler. Varsayılan değer `agent-proxy`'dir: Realtime bir ses ön ucu sıra zamanlamasını, kesintiyi ve oynatmayı yönetir, esas işi `openclaw_agent_consult` aracılığıyla yönlendirilen OpenClaw agent'a devreder ve sonucu o konuşmacıdan yazılmış bir Discord istemi gibi ele alır. `stt-tts` eski toplu STT artı TTS akışını korur. `bidi`, OpenClaw beyni için `openclaw_agent_consult` sunarken realtime modelin doğrudan sohbet etmesini sağlar.
- `voice.agentSession`, ses sıralarını hangi OpenClaw konuşmasının alacağını denetler. Ses kanalının kendi oturumu için ayarlanmamış bırakın veya ses kanalının `#maintainers` gibi mevcut bir Discord metin kanalı oturumunun mikrofon/hoparlör uzantısı gibi davranmasını sağlamak için `{ mode: "target", target: "channel:<text-channel-id>" }` olarak ayarlayın.
- `voice.model`, Discord ses yanıtları ve realtime danışmalar için OpenClaw agent beynini geçersiz kılar. Yönlendirilen agent modelini devralmak için ayarlanmamış bırakın. Bu, `voice.realtime.model` ayarından ayrıdır.
- `voice.followUsers`, botun seçili kullanıcılarla Discord sese katılmasını, taşınmasını ve ayrılmasını sağlar. Davranış kuralları ve örnekler için [Seste kullanıcıları takip et](#follow-users-in-voice) bölümüne bakın.
- `agent-proxy`, konuşmayı `discord-voice` üzerinden yönlendirir; bu, konuşmacı ve hedef oturum için normal sahip/araç yetkilendirmesini korur ancak Discord ses oynatmayı üstlendiği için agent `tts` aracını gizler. Varsayılan olarak `agent-proxy`, sahip konuşmacılar için danışmaya tam sahip eşdeğeri araç erişimi verir (`voice.realtime.toolPolicy: "owner"`) ve esas yanıtlardan önce OpenClaw agent'a danışmayı güçlü biçimde tercih eder (`voice.realtime.consultPolicy: "always"`). Bu varsayılan `always` modunda realtime katman, danışma yanıtından önce otomatik dolgu konuşması yapmaz; konuşmayı yakalayıp yazıya döker, ardından yönlendirilen OpenClaw yanıtını seslendirir. Discord ilk yanıtı hâlâ oynatırken birden fazla zorunlu danışma yanıtı tamamlanırsa, sonraki tam konuşma yanıtları cümlenin ortasında konuşmayı değiştirmek yerine oynatma boşalana kadar kuyruğa alınır.
- `stt-tts` modunda STT `tools.media.audio` kullanır; `voice.model` yazıya dökmeyi etkilemez.
- Realtime modlarında `voice.realtime.provider`, `voice.realtime.model` ve `voice.realtime.speakerVoice` realtime ses oturumunu yapılandırır. OpenAI Realtime 2 artı Codex beyni için `voice.realtime.model: "gpt-realtime-2"` ve `voice.model: "openai/gpt-5.5"` kullanın.
- Realtime ses modları, hızlı doğrudan sıraların yönlendirilen OpenClaw agent ile aynı kimliği, kullanıcı bağlamını ve personayı koruması için varsayılan olarak realtime sağlayıcı talimatlarına küçük `IDENTITY.md`, `USER.md` ve `SOUL.md` profil dosyaları ekler. Bunu özelleştirmek için `voice.realtime.bootstrapContextFiles` değerini bir alt kümeye, devre dışı bırakmak için `[]` değerine ayarlayın. Desteklenen realtime önyükleme dosyaları bu profil dosyalarıyla sınırlıdır; `AGENTS.md` normal agent bağlamında kalır. Enjekte edilen profil bağlamı, çalışma alanı işi, güncel bilgiler, bellek araması veya araç destekli eylemler için `openclaw_agent_consult` yerine geçmez.
- OpenAI `agent-proxy` realtime modunda, bir transkript bir uyanma adıyla başlamadan veya bitmeden Discord realtime sesinin sessiz kalmasını sağlamak için `voice.realtime.requireWakeName: true` olarak ayarlayın. Yapılandırılan uyanma adları bir veya iki kelime olmalıdır. `voice.realtime.wakeNames` ayarlanmamışsa OpenClaw, yönlendirilen agent `name` değerini artı `OpenClaw` kullanır; bu yoksa agent kimliğini artı `OpenClaw` kullanır. Uyanma adı geçidi realtime sağlayıcının otomatik yanıtını devre dışı bırakır, kabul edilen sıraları OpenClaw agent danışma yolu üzerinden yönlendirir ve baştaki bir uyanma adı son transkript gelmeden önce kısmi yazıya dökümden tanındığında kısa bir sözlü onay verir.
- OpenAI realtime sağlayıcısı, güncel Realtime 2 olay adlarını ve çıktı sesi ile transkript olayları için eski Codex uyumlu takma adları kabul eder; böylece uyumlu sağlayıcı anlık görüntüleri asistan sesini düşürmeden kayabilir.
- `voice.realtime.bargeIn`, Discord konuşmacı başlama olaylarının etkin realtime oynatmayı kesip kesmeyeceğini denetler. Ayarlanmamışsa realtime sağlayıcının giriş sesi kesinti ayarını izler.
- `voice.realtime.minBargeInAudioEndMs`, bir OpenAI realtime araya girişinin sesi kesmeden önceki minimum asistan oynatma süresini denetler. Varsayılan: `250`. Düşük yankılı odalarda anında kesinti için `0` olarak ayarlayın veya yankısı yoğun hoparlör kurulumları için yükseltin.
- Discord oynatmasında bir OpenAI sesi için `voice.tts.provider: "openai"` olarak ayarlayın ve `voice.tts.providers.openai.speakerVoice` altında bir metinden konuşmaya sesi seçin. `cedar`, mevcut OpenAI TTS modelinde erkeksi duyulan iyi bir seçenektir.
- Kanal başına Discord `systemPrompt` geçersiz kılmaları, o ses kanalı için ses transkripti sıralarına uygulanır.
- Ses transkripti sıraları, sahip kapılı komutlar ve kanal eylemleri için sahip durumunu Discord `allowFrom` (veya `dm.allowFrom`) değerinden türetir. Agent araç görünürlüğü, yönlendirilen oturum için yapılandırılan araç politikasını izler.
- Discord ses, yalnızca metin yapılandırmaları için isteğe bağlıdır; `/vc` komutlarını, ses çalışma zamanını ve `GuildVoiceStates` Gateway niyetini etkinleştirmek için `channels.discord.voice.enabled=true` ayarlayın (veya mevcut bir `channels.discord.voice` bloğunu koruyun).
- `channels.discord.intents.voiceStates`, ses durumu niyeti aboneliğini açıkça geçersiz kılabilir. Niyetin etkin ses etkinleştirmesini izlemesi için ayarlanmamış bırakın.
- `voice.autoJoin` aynı lonca için birden fazla giriş içeriyorsa OpenClaw o lonca için son yapılandırılan kanala katılır.
- `voice.allowedChannels` isteğe bağlı bir ikamet izin listesidir. `/vc join` komutunun yetkili herhangi bir Discord ses kanalına katılmasına izin vermek için ayarlanmamış bırakın. Ayarlandığında `/vc join`, başlangıçta otomatik katılma ve bot ses durumu taşımaları listelenen `{ guildId, channelId }` girişleriyle sınırlanır. Tüm Discord ses katılımlarını reddetmek için boş dizi olarak ayarlayın. Discord botu izin listesinin dışına taşırsa OpenClaw o kanaldan ayrılır ve uygun olduğunda yapılandırılmış otomatik katılma hedefine yeniden katılır.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` katılma seçeneklerine aynen geçirilir.
- Ayarlanmamışsa `@discordjs/voice` varsayılanları `daveEncryption=true` ve `decryptionFailureTolerance=24` değerleridir.
- OpenClaw, Discord ses alma ve realtime ham PCM oynatma için paketlenmiş `libopus-wasm` codec'ini kullanır. Sabitlenmiş bir libopus WebAssembly derlemesiyle gelir ve yerel opus eklentileri gerektirmez.
- `voice.connectTimeoutMs`, `/vc join` ve otomatik katılma denemeleri için ilk `@discordjs/voice` Ready beklemesini denetler. Varsayılan: `30000`.
- `voice.reconnectGraceMs`, OpenClaw'ın bağlantısı kesilmiş bir ses oturumunun yok edilmeden önce yeniden bağlanmaya başlamasını ne kadar bekleyeceğini denetler. Varsayılan: `15000`.
- `stt-tts` modunda ses oynatma, sırf başka bir kullanıcı konuşmaya başladı diye durmaz. Geri besleme döngülerini önlemek için OpenClaw, TTS oynatılırken yeni ses yakalamayı yoksayar; sonraki sıra için oynatma bittikten sonra konuşun. Realtime modları konuşmacı başlangıçlarını realtime sağlayıcıya araya giriş sinyalleri olarak iletir.
- Realtime modlarında hoparlörlerden açık mikrofona gelen yankı araya giriş gibi görünüp oynatmayı kesebilir. Yankısı yoğun Discord odaları için OpenAI'ın giriş sesinde otomatik kesmesini önlemek üzere `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` ayarlayın. Discord konuşmacı başlama olaylarının etkin oynatmayı yine de kesmesini istiyorsanız `voice.realtime.bargeIn: true` ekleyin. OpenAI realtime köprüsü, `voice.realtime.minBargeInAudioEndMs` değerinden kısa oynatma kesmelerini olası yankı/gürültü olarak yoksayar ve Discord oynatmayı temizlemek yerine atlandı olarak günlüğe kaydeder.
- `voice.captureSilenceGraceMs`, Discord bir konuşmacının durduğunu bildirdikten sonra OpenClaw'ın o ses segmentini STT için sonlandırmadan önce ne kadar bekleyeceğini denetler. Varsayılan: `2000`; Discord normal duraklamaları kesik kesik kısmi transkriptlere bölüyorsa bunu yükseltin.
- Seçili TTS sağlayıcısı ElevenLabs olduğunda Discord ses oynatma akışlı TTS kullanır ve sağlayıcı yanıt akışından başlar. Akış desteği olmayan sağlayıcılar sentezlenmiş geçici dosya yoluna geri döner.
- OpenClaw ayrıca alma şifre çözme hatalarını izler ve kısa bir pencerede tekrarlanan hatalardan sonra ses kanalından ayrılıp yeniden katılarak otomatik toparlanır.
- Güncellemeden sonra alma günlüklerinde tekrar tekrar `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` görünüyorsa bir bağımlılık raporu ve günlükleri toplayın. Paketlenmiş `@discordjs/voice` satırı, discord.js PR #11449'daki yukarı akış dolgu düzeltmesini içerir; bu düzeltme discord.js issue #11419'u kapatmıştır.
- `The operation was aborted` alma olayları, OpenClaw yakalanmış bir konuşmacı segmentini sonlandırdığında beklenir; bunlar uyarı değil, ayrıntılı tanılardır.
- Ayrıntılı Discord ses günlükleri, kabul edilen her konuşmacı segmenti için sınırlı tek satırlık bir STT transkript önizlemesi içerir; böylece hata ayıklama, sınırsız transkript metni dökmeden hem kullanıcı tarafını hem de agent yanıt tarafını gösterir.
- `agent-proxy` modunda zorunlu danışma geri dönüşü, `...` ile biten metin veya sonda `and` gibi bir bağlayıcı gibi muhtemelen tamamlanmamış transkript parçalarını ve “be right back” ya da “bye” gibi bariz eyleme dönük olmayan kapanışları atlar. Bu, eski bir kuyruklanmış yanıtı önlediğinde günlükler `forced agent consult skipped reason=...` gösterir.

### Seste kullanıcıları takip et

Discord ses botunun başlangıçta sabit bir kanala katılmak veya `/vc join` beklemek yerine bir veya daha fazla bilinen Discord kullanıcısıyla kalmasını istediğinizde `voice.followUsers` kullanın.

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

- `followUsers`, ham Discord kullanıcı kimliklerini ve `discord:<id>` değerlerini kabul eder. OpenClaw, ses durumu olaylarını eşleştirmeden önce her iki formu da normalleştirir.
- `followUsers` yapılandırıldığında `followUsersEnabled` varsayılan olarak `true` olur. Kaydedilmiş listeyi koruyup otomatik ses takibini durdurmak için `false` olarak ayarlayın.
- Takip edilen bir kullanıcı izin verilen bir ses kanalına katıldığında OpenClaw o kanala katılır. Kullanıcı taşındığında OpenClaw onunla birlikte taşınır. Etkin takip edilen kullanıcı bağlantıyı kestiğinde OpenClaw ayrılır.
- Aynı loncada birden fazla takip edilen kullanıcı varsa ve etkin takip edilen kullanıcı ayrılırsa OpenClaw loncadan ayrılmadan önce izlenen başka bir takip edilen kullanıcının kanalına taşınır. Birkaç takip edilen kullanıcı aynı anda taşınırsa en son gözlemlenen ses durumu olayı kazanır.
- `allowedChannels` hâlâ uygulanır. İzin verilmeyen bir kanaldaki takip edilen kullanıcı yoksayılır ve takip sahipli bir oturum başka bir takip edilen kullanıcıya taşınır veya ayrılır.
- OpenClaw, başlangıçta ve sınırlı bir aralıkta kaçırılmış ses durumu olaylarını uzlaştırır. Uzlaştırma yapılandırılmış loncaları örnekler ve çalışma başına REST aramalarını sınırlar; bu nedenle çok büyük `followUsers` listelerinin yakınsaması birden fazla aralık sürebilir.
- Discord veya bir yönetici, bot bir kullanıcıyı takip ederken botu taşırsa OpenClaw ses oturumunu yeniden oluşturur ve hedefe izin veriliyorsa takip sahipliğini korur. Bot `allowedChannels` dışına taşınırsa OpenClaw ayrılır ve yapılandırılmış hedef varsa ona yeniden katılır.
- DAVE alma toparlaması, tekrarlanan şifre çözme hatalarından sonra aynı kanaldan ayrılıp yeniden katılabilir. Takip sahipli oturumlar bu toparlanma yolunda takip sahipliğini korur; böylece daha sonra takip edilen kullanıcının bağlantıyı kesmesi kanaldan yine ayrılır.

Katılma modları arasında seçim yapın:

- Botun siz sesteyken otomatik olarak seste olması gereken kişisel veya operatör kurulumları için `followUsers` kullanın.
- İzlenen hiçbir kullanıcı seste olmasa bile mevcut olması gereken sabit oda botları için `autoJoin` kullanın.
- Tek seferlik katılımlar veya otomatik ses varlığının şaşırtıcı olacağı odalar için `/vc join` kullanın.

Discord ses codec'i:

- Ses alma günlükleri `discord voice: opus decoder: libopus-wasm` gösterir.
- Gerçek zamanlı oynatma, paketleri `@discordjs/voice` öğesine vermeden önce aynı paketlenmiş `libopus-wasm` paketiyle ham 48 kHz stereo PCM'yi Opus'a kodlar.
- Dosya ve sağlayıcı akışı oynatması, ffmpeg ile ham 48 kHz stereo PCM'ye dönüştürür, ardından Discord'a gönderilen Opus paket akışı için `libopus-wasm` kullanır.

STT ve TTS işlem hattı:

- Discord PCM yakalaması bir WAV geçici dosyasına dönüştürülür.
- `tools.media.audio`, örneğin `openai/gpt-4o-mini-transcribe` için STT'yi işler.
- Transkript, Discord girişi ve yönlendirmesi üzerinden gönderilir; bu sırada yanıt LLM'i, aracı `tts` aracını gizleyen ve döndürülen metni isteyen bir ses çıktısı ilkesiyle çalışır, çünkü nihai TTS oynatmasının sahibi Discord sestir.
- `voice.model` ayarlandığında, yalnızca bu ses kanalı turu için yanıt LLM'ini geçersiz kılar.
- `voice.tts`, `messages.tts` üzerine birleştirilir; akış yapabilen sağlayıcılar oynatıcıyı doğrudan besler, aksi halde ortaya çıkan ses dosyası katılınan kanalda oynatılır.

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

`voice.agentSession` bloğu yoksa her ses kanalı kendi yönlendirilmiş OpenClaw oturumunu alır. Örneğin, `/vc join channel:234567890123456789` o Discord ses kanalının oturumuyla konuşur. Gerçek zamanlı model yalnızca ses ön yüzüdür; esas istekler yapılandırılmış OpenClaw aracısına aktarılır. Gerçek zamanlı model consult aracını çağırmadan nihai transkript üretirse OpenClaw, varsayılanın yine de aracıyla konuşuyormuş gibi davranması için consult çağrısını yedek olarak zorlar.

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

Gerçek zamanlı bidi örneği:

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

`agent-proxy` modunda bot yapılandırılmış ses kanalına katılır, ancak OpenClaw aracı turları hedef kanalın normal yönlendirilmiş oturumunu ve aracısını kullanır. Gerçek zamanlı ses oturumu döndürülen sonucu ses kanalına geri söyler. Süpervizör aracı, ayrı bir Discord mesajı göndermek dahil olmak üzere, doğru eylem buysa araç ilkesine göre normal mesaj araçlarını kullanmaya devam edebilir.

Yetkilendirilmiş bir OpenClaw çalıştırması etkinken, yeni Discord ses transkriptleri başka bir aracı turu başlatılmadan önce canlı çalıştırma kontrolü olarak ele alınır. "durum", "onu iptal et", "daha küçük düzeltmeyi kullan" veya "bitirdiğinde testleri de kontrol et" gibi ifadeler etkin oturum için durum, iptal, yönlendirme veya takip girdisi olarak sınıflandırılır. Durum, iptal, kabul edilen yönlendirme ve takip sonuçları ses kanalına geri söylenir; böylece arayan kişi OpenClaw'ın isteği işleyip işlemediğini bilir.

Kullanışlı hedef biçimleri:

- `target: "channel:123456789012345678"` bir Discord metin kanalı oturumu üzerinden yönlendirir.
- `target: "123456789012345678"` bir kanal hedefi olarak ele alınır.
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

Model kendi Discord oynatmasını açık bir mikrofon üzerinden duyduğunda, ancak yine de konuşarak onu kesmek istediğinizde bunu kullanın. OpenClaw, OpenAI'ın ham giriş sesinde otomatik kesinti yapmasını engellerken `bargeIn: true`, Discord konuşmacı başlama olaylarının ve zaten etkin konuşmacı sesinin bir sonraki yakalanan tur OpenAI'a ulaşmadan önce etkin gerçek zamanlı yanıtları iptal etmesine izin verir. `audioEndMs` değeri `minBargeInAudioEndMs` altında olan çok erken araya girme sinyalleri olası yankı/gürültü olarak değerlendirilir ve modelin ilk oynatma karesinde kesilmemesi için yok sayılır.

Beklenen ses günlükleri:

- Katılmada: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Gerçek zamanlı başlangıçta: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Konuşmacı sesinde: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` ve `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Eski konuşma atlandığında: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` veya `reason=non-actionable-closing ...`
- Gerçek zamanlı yanıt tamamlandığında: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Oynatma durduğunda/sıfırlandığında: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Gerçek zamanlı consult sırasında: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Aracı yanıtında: `discord voice: agent turn answer ...`
- Sıraya alınan tam konuşmada: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, ardından `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Araya girme algılandığında: `discord voice: realtime barge-in detected source=speaker-start ...` veya `discord voice: realtime barge-in detected source=active-speaker-audio ...`, ardından `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Gerçek zamanlı kesintide: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, ardından ya `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` ya da `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Yok sayılan yankı/gürültüde: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Devre dışı araya girmede: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Boşta oynatmada: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Kesilen sesi hata ayıklamak için gerçek zamanlı ses günlüklerini bir zaman çizelgesi olarak okuyun:

1. `realtime audio playback started`, Discord'un asistan sesini oynatmaya başladığı anlamına gelir. Köprü bu noktadan itibaren asistan çıktı parçalarını, Discord PCM baytlarını, sağlayıcı gerçek zamanlı baytlarını ve sentezlenen ses süresini saymaya başlar.
2. `realtime speaker turn opened`, bir Discord konuşmacısının etkin hale geldiğini işaretler. Oynatma zaten etkinse ve `bargeIn` etkinse, bunun ardından `barge-in detected source=speaker-start` gelebilir.
3. `realtime input audio started`, o konuşmacı turu için alınan ilk gerçek ses karesini işaretler. Burada `outputActive=true` veya sıfır olmayan bir `outputAudioMs`, mikrofonun asistan oynatması hâlâ etkinken giriş gönderdiği anlamına gelir.
4. `barge-in detected source=active-speaker-audio`, OpenClaw'ın asistan oynatması etkinken canlı konuşmacı sesi gördüğü anlamına gelir. Bu, gerçek bir kesintiyi faydalı ses içermeyen bir Discord konuşmacı başlama olayından ayırt etmek için kullanışlıdır.
5. `barge-in requested reason=...`, OpenClaw'ın gerçek zamanlı sağlayıcıdan etkin yanıtı iptal etmesini veya kısaltmasını istediği anlamına gelir. Kesintiden önce ne kadar asistan sesinin gerçekten oynatıldığını görebilmeniz için `outputAudioMs`, `outputActive` ve `playbackChunks` içerir.
6. `realtime audio playback stopped reason=...`, yerel Discord oynatma sıfırlama noktasıdır. Neden, oynatmayı kimin durdurduğunu söyler: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` veya `session-close`.
7. `realtime speaker turn closed`, yakalanan giriş turunu özetler. `chunks=0` veya `hasAudio=false`, konuşmacı turunun açıldığını ancak gerçek zamanlı köprüye kullanılabilir ses ulaşmadığını gösterir. `interruptedPlayback=true`, o giriş turunun asistan çıktısıyla çakıştığı ve araya girme mantığını tetiklediği anlamına gelir.

Kullanışlı alanlar:

- `outputAudioMs`: günlük satırından önce gerçek zamanlı sağlayıcı tarafından oluşturulan asistan sesi süresi.
- `audioMs`: oynatma durmadan önce OpenClaw'ın saydığı asistan sesi süresi.
- `elapsedMs`: oynatma akışının veya konuşmacı turunun açılması ile kapanması arasındaki duvar saati süresi.
- `discordBytes`: Discord sesine gönderilen veya Discord sesinden alınan 48 kHz stereo PCM baytları.
- `realtimeBytes`: gerçek zamanlı sağlayıcıya gönderilen veya ondan alınan sağlayıcı biçimli PCM baytları.
- `playbackChunks`: etkin yanıt için Discord'a iletilen asistan sesi parçaları.
- `sinceLastAudioMs`: yakalanan son konuşmacı ses karesi ile konuşmacı turunun kapanması arasındaki boşluk.

Yaygın örüntüler:

- `source=active-speaker-audio`, küçük `outputAudioMs` ve yakında aynı kullanıcıyla birlikte anında kesilme genellikle hoparlör yankısının mikrofona girdiğini gösterir. `voice.realtime.minBargeInAudioEndMs` değerini yükseltin, hoparlör sesini azaltın, kulaklık kullanın veya `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` ayarlayın.
- `source=speaker-start` ardından `speaker turn closed ... hasAudio=false`, Discord'un bir konuşmacı başlangıcı bildirdiği ancak OpenClaw'a ses ulaşmadığı anlamına gelir. Bu geçici bir Discord ses olayı, gürültü kapısı davranışı veya bir istemcinin mikrofonu kısa süreliğine etkinleştirmesi olabilir.
- Yakında araya girme veya `provider-clear-audio` olmadan `audio playback stopped reason=stream-close`, yerel Discord oynatma akışının beklenmedik şekilde sona erdiği anlamına gelir. Önceki sağlayıcı ve Discord oynatıcı günlüklerini kontrol edin.
- `capture ignored during playback (barge-in disabled)`, OpenClaw'ın asistan sesi etkinken girişi kasıtlı olarak bıraktığı anlamına gelir. Konuşmanın oynatmayı kesmesini istiyorsanız `voice.realtime.bargeIn` etkinleştirin.
- `barge-in ignored ... outputActive=false`, Discord veya sağlayıcı VAD'nin konuşma bildirdiği, ancak OpenClaw'ın kesilecek etkin oynatması olmadığı anlamına gelir. Bu sesi kesmemelidir.

Kimlik bilgileri bileşen başına çözümlenir: `voice.model` için LLM rota kimlik doğrulaması, `tools.media.audio` için STT kimlik doğrulaması, `messages.tts`/`voice.tts` için TTS kimlik doğrulaması ve `voice.realtime.providers` veya sağlayıcının normal kimlik doğrulama yapılandırması için gerçek zamanlı sağlayıcı kimlik doğrulaması.

### Sesli mesajlar

Discord sesli mesajları bir dalga biçimi önizlemesi gösterir ve OGG/Opus ses gerektirir. OpenClaw dalga biçimini otomatik olarak oluşturur, ancak inceleme ve dönüştürme için gateway konağında `ffmpeg` ve `ffprobe` gerekir.

- Bir **yerel dosya yolu** sağlayın (URL'ler reddedilir).
- Metin içeriğini atlayın (Discord aynı yükte metin + sesli mesajı reddeder).
- Herhangi bir ses biçimi kabul edilir; OpenClaw gerektiğinde OGG/Opus biçimine dönüştürür.

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
    - `channels.discord.guilds` altındaki guild izin verilenler listesini doğrulayın
    - guild `channels` haritası varsa yalnızca listelenen kanallara izin verilir
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

    - eşleşen guild/kanal izin verilenler listesi olmadan `groupPolicy="allowlist"`
    - `requireMention` yanlış yerde yapılandırılmış (`channels.discord.guilds` altında veya kanal girdisinde olmalıdır)
    - gönderenin guild/kanal `users` izin verilenler listesi tarafından engellenmesi

  </Accordion>

  <Accordion title="Uzun süren Discord turları veya yinelenen yanıtlar">

    Tipik günlükler:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway kuyruğu ayarları:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çoklu hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - bu yalnızca Discord gateway dinleyici işini denetler, agent turu ömrünü denetlemez

    Discord, kuyruktaki agent turlarına kanalın sahip olduğu bir zaman aşımı uygulamaz. İleti dinleyicileri işi hemen devreder ve kuyruğa alınmış Discord çalıştırmaları, oturum/araç/runtime yaşam döngüsü tamamlanana veya işi iptal edene kadar oturum başına sıralamayı korur.

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
    OpenClaw, bağlanmadan önce Discord `/gateway/bot` metadata bilgisini alır. Geçici hatalar Discord'un varsayılan gateway URL'sine geri döner ve günlüklerde hız sınırına tabi tutulur.

    Metadata zaman aşımı ayarları:

    - tek hesap: `channels.discord.gatewayInfoTimeoutMs`
    - çoklu hesap: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - yapılandırma ayarlanmamışsa env fallback: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - varsayılan: `30000` (30 saniye), en fazla: `120000`

  </Accordion>

  <Accordion title="Gateway READY zaman aşımı yeniden başlatmaları">
    OpenClaw, başlatma sırasında ve runtime yeniden bağlantılarından sonra Discord'un gateway `READY` olayını bekler. Başlatma kademelendirmesi kullanan çoklu hesap kurulumları, varsayılandan daha uzun bir başlatma READY penceresine ihtiyaç duyabilir.

    READY zaman aşımı ayarları:

    - başlatma tek hesap: `channels.discord.gatewayReadyTimeoutMs`
    - başlatma çoklu hesap: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa başlatma env fallback: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - başlatma varsayılanı: `15000` (15 saniye), en fazla: `120000`
    - runtime tek hesap: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime çoklu hesap: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa runtime env fallback: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - runtime varsayılanı: `30000` (30 saniye), en fazla: `120000`

  </Accordion>

  <Accordion title="İzin denetimi uyuşmazlıkları">
    `channels status --probe` izin kontrolleri yalnızca sayısal kanal ID'leri için çalışır.

    Slug anahtarları kullanırsanız runtime eşleştirmesi yine de çalışabilir, ancak probe izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM ve eşleştirme sorunları">

    - DM devre dışı: `channels.discord.dm.enabled=false`
    - DM politikası devre dışı: `channels.discord.dmPolicy="disabled"` (eski: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Bot-bot döngüleri">
    Varsayılan olarak bot tarafından yazılan mesajlar yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız döngü davranışından kaçınmak için katı mention ve izin verilenler listesi kuralları kullanın.
    Yalnızca bottan bahseden bot mesajlarını kabul etmek için `channels.discord.allowBots="mentions"` tercih edin.

    OpenClaw ayrıca paylaşılan [bot döngüsü koruması](/tr/channels/bot-loop-protection) ile gelir. `allowBots`, bot tarafından yazılan mesajların dispatch'e ulaşmasına izin verdiğinde Discord gelen olayı `(account, channel, bot pair)` olgularına eşler ve genel pair guard, yapılandırılan olay bütçesini aştıktan sonra çifti bastırır. Guard, daha önce Discord hız sınırlarıyla durdurulması gereken kontrolden çıkan iki botlu döngüleri önler; bütçenin altında kalan tek botlu dağıtımları veya tek seferlik bot yanıtlarını etkilemez.

    Varsayılan ayarlar (`allowBots` ayarlandığında etkin):

    - `maxEventsPerWindow: 20` -- bot çifti kayan pencere içinde 20 mesaj alışverişi yapabilir
    - `windowSeconds: 60` -- kayan pencere uzunluğu
    - `cooldownSeconds: 60` -- bütçe aşıldığında her iki yöndeki her ek bot-bot mesajı bir dakika boyunca düşürülür

    Paylaşılan varsayılanı `channels.defaults.botLoopProtection` altında bir kez yapılandırın, ardından meşru bir iş akışı daha fazla hareket alanı gerektirdiğinde Discord için geçersiz kılın. Öncelik sırası:

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

  <Accordion title="DecryptionFailed(...) ile Voice STT düşüyor">

    - Discord voice alma kurtarma mantığının mevcut olması için OpenClaw'ı güncel tutun (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` değerini doğrulayın (varsayılan)
    - `channels.discord.voice.decryptionFailureTolerance=24` değerinden başlayın (upstream varsayılanı) ve yalnızca gerekirse ayarlayın
    - günlüklerde şunları izleyin:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - otomatik yeniden katılmadan sonra hatalar sürerse günlükleri toplayın ve [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) ile [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) içindeki upstream DAVE alma geçmişiyle karşılaştırın

  </Accordion>
</AccordionGroup>

## Yapılandırma başvurusu

Birincil başvuru: [Yapılandırma başvurusu - Discord](/tr/gateway/config-channels#discord).

<Accordion title="Yüksek sinyalli Discord alanları">

- başlatma/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- politika: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- komut: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- olay kuyruğu: `eventQueue.listenerTimeout` (dinleyici bütçesi), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
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

- Bot token'larını gizli bilgi olarak ele alın (denetimli ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- En az ayrıcalıklı Discord izinlerini verin.
- Komut dağıtımı/durumu eskiyse gateway'i yeniden başlatın ve `openclaw channels status --probe` ile yeniden kontrol edin.

## İlgili

<CardGroup cols={2}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bir Discord kullanıcısını gateway ile eşleştirin.
  </Card>
  <Card title="Gruplar" icon="users" href="/tr/channels/groups">
    Grup sohbeti ve izin verilenler listesi davranışı.
  </Card>
  <Card title="Kanal yönlendirme" icon="route" href="/tr/channels/channel-routing">
    Gelen mesajları agent'lara yönlendirin.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sağlamlaştırma.
  </Card>
  <Card title="Çoklu agent yönlendirme" icon="sitemap" href="/tr/concepts/multi-agent">
    Guild'leri ve kanalları agent'lara eşleyin.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı.
  </Card>
</CardGroup>
