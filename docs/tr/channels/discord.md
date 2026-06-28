---
read_when:
    - Discord kanal özellikleri üzerinde çalışma
summary: Discord bot destek durumu, yetenekleri ve yapılandırması
title: Discord
x-i18n:
    generated_at: "2026-06-28T20:40:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91bda14cfdd7bf5045413d97c56936ea7150b396e0e7ecd4ac300e1a811377cb
    source_path: channels/discord.md
    workflow: 16
---

Resmi Discord gateway üzerinden DM'ler ve guild kanalları için hazır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Discord DM'leri varsayılan olarak eşleştirme modundadır.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım akışı.
  </Card>
</CardGroup>

## Hızlı kurulum

Bot içeren yeni bir uygulama oluşturmanız, botu sunucunuza eklemeniz ve OpenClaw ile eşleştirmeniz gerekir. Botunuzu kendi özel sunucunuza eklemenizi öneririz. Henüz sunucunuz yoksa, [önce bir tane oluşturun](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** seçin).

<Steps>
  <Step title="Bir Discord uygulaması ve bot oluşturun">
    [Discord Developer Portal](https://discord.com/developers/applications) sayfasına gidin ve **New Application** düğmesine tıklayın. "OpenClaw" gibi bir ad verin.

    Kenar çubuğunda **Bot** öğesine tıklayın. **Username** değerini OpenClaw aracınıza verdiğiniz ad olarak ayarlayın.

  </Step>

  <Step title="Ayrıcalıklı intent'leri etkinleştirin">
    Hâlâ **Bot** sayfasındayken **Privileged Gateway Intents** bölümüne kaydırın ve şunları etkinleştirin:

    - **Message Content Intent** (gerekli)
    - **Server Members Intent** (önerilir; rol izin listeleri ve ad-ID eşleştirmesi için gereklidir)
    - **Presence Intent** (isteğe bağlı; yalnızca durum güncellemeleri için gerekir)

  </Step>

  <Step title="Bot token'ınızı kopyalayın">
    **Bot** sayfasında tekrar yukarı kaydırın ve **Reset Token** düğmesine tıklayın.

    <Note>
    Adına rağmen, bu ilk token'ınızı oluşturur — hiçbir şey "sıfırlanmaz."
    </Note>

    Token'ı kopyalayın ve bir yere kaydedin. Bu sizin **Bot Token** değerinizdir ve kısa süre içinde ona ihtiyacınız olacak.

  </Step>

  <Step title="Davet URL'si oluşturun ve botu sunucunuza ekleyin">
    Kenar çubuğunda **OAuth2** öğesine tıklayın. Botu sunucunuza eklemek için doğru izinlere sahip bir davet URL'si oluşturacaksınız.

    **OAuth2 URL Generator** bölümüne kaydırın ve şunları etkinleştirin:

    - `bot`
    - `applications.commands`

    Aşağıda bir **Bot Permissions** bölümü görünür. En az şunları etkinleştirin:

    **Genel İzinler**
      - Kanalları Görüntüle
    **Metin İzinleri**
      - Mesaj Gönder
      - Mesaj Geçmişini Oku
      - Bağlantıları Göm
      - Dosya Ekle
      - Tepki Ekle (isteğe bağlı)

    Bu, normal metin kanalları için temel kümedir. Forum veya medya kanalı iş akışları dahil olmak üzere bir ileti dizisi oluşturan ya da sürdüren Discord ileti dizilerinde gönderi paylaşmayı planlıyorsanız, **Send Messages in Threads** iznini de etkinleştirin.
    Altta oluşturulan URL'yi kopyalayın, tarayıcınıza yapıştırın, sunucunuzu seçin ve bağlanmak için **Continue** düğmesine tıklayın. Artık botunuzu Discord sunucusunda görmelisiniz.

  </Step>

  <Step title="Geliştirici Modu'nu etkinleştirin ve ID'lerinizi toplayın">
    Discord uygulamasına geri dönün; dahili ID'leri kopyalayabilmek için Geliştirici Modu'nu etkinleştirmeniz gerekir.

    1. **User Settings** öğesine tıklayın (avatarınızın yanındaki dişli simgesi) → Kenar çubuğunda **Developer** bölümüne kaydırın → **Developer Mode** öğesini açın

        *(Not: Discord mobil uygulamasında Geliştirici Modu, **App Settings** → **Advanced** altındadır)*

    2. Kenar çubuğunda **sunucu simgenize** sağ tıklayın → **Copy Server ID**
    3. **Kendi avatarınıza** sağ tıklayın → **Copy User ID**

    **Server ID** ve **User ID** değerlerinizi Bot Token'ınızla birlikte kaydedin — sonraki adımda üçünü de OpenClaw'a göndereceksiniz.

  </Step>

  <Step title="Sunucu üyelerinden DM'lere izin verin">
    Eşleştirmenin çalışması için Discord'un botunuzun size DM göndermesine izin vermesi gerekir. **Sunucu simgenize** sağ tıklayın → **Privacy Settings** → **Direct Messages** öğesini açın.

    Bu, sunucu üyelerinin (botlar dahil) size DM göndermesine izin verir. OpenClaw ile Discord DM'lerini kullanmak istiyorsanız bunu etkin bırakın. Yalnızca guild kanallarını kullanmayı planlıyorsanız, eşleştirmeden sonra DM'leri devre dışı bırakabilirsiniz.

  </Step>

  <Step title="Bot token'ınızı güvenli şekilde ayarlayın (sohbette göndermeyin)">
    Discord bot token'ınız bir sırdır (parola gibi). Aracınıza mesaj göndermeden önce bunu OpenClaw çalıştıran makinede ayarlayın.

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

    OpenClaw zaten arka plan hizmeti olarak çalışıyorsa, OpenClaw Mac uygulaması üzerinden veya `openclaw gateway run` işlemini durdurup yeniden başlatarak yeniden başlatın.
    Yönetilen hizmet kurulumları için, `DISCORD_BOT_TOKEN` mevcut olan bir kabuktan `openclaw gateway install` komutunu çalıştırın veya değişkeni `~/.openclaw/.env` içinde saklayın; böylece hizmet yeniden başlatmadan sonra env SecretRef değerini çözebilir.
    Ana makineniz Discord'un başlangıç uygulaması araması tarafından engellenir veya hız sınırına takılırsa, başlangıcın bu REST çağrısını atlayabilmesi için Discord uygulama/istemci ID'sini Developer Portal'dan ayarlayın. Varsayılan hesap için `channels.discord.applicationId` kullanın veya birden fazla Discord botu çalıştırdığınızda `channels.discord.accounts.<accountId>.applicationId` kullanın.

  </Step>

  <Step title="OpenClaw'ı yapılandırın ve eşleştirin">

    <Tabs>
      <Tab title="Aracınıza sorun">
        Mevcut herhangi bir kanalda (örn. Telegram) OpenClaw aracınızla sohbet edin ve ona söyleyin. Discord ilk kanalınızsa, bunun yerine CLI / yapılandırma sekmesini kullanın.

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

        Betikli veya uzak kurulum için, aynı JSON5 bloğunu `openclaw config patch --file ./discord.patch.json5 --dry-run` ile yazın ve ardından `--dry-run` olmadan yeniden çalıştırın. Düz metin `token` değerleri desteklenir. SecretRef değerleri de env/file/exec sağlayıcıları genelinde `channels.discord.token` için desteklenir. Bkz. [Gizli Bilgi Yönetimi](/tr/gateway/secrets).

        Birden fazla Discord botu için, her bot token'ını ve uygulama ID'sini kendi hesabı altında tutun. Üst düzey `channels.discord.applicationId` hesaplar tarafından devralınır; bu nedenle bunu yalnızca her hesap aynı uygulama ID'sini kullanmalıysa orada ayarlayın.

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
    Gateway çalışana kadar bekleyin, ardından Discord'da botunuza DM gönderin. Bot bir eşleştirme koduyla yanıt verir.

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

    Artık aracınızla Discord'da DM üzerinden sohbet edebilmelisiniz.

  </Step>
</Steps>

<Note>
Token çözümleme hesap duyarlıdır. Yapılandırma token değerleri env fallback'e göre önceliklidir. `DISCORD_BOT_TOKEN` yalnızca varsayılan hesap için kullanılır.
Etkinleştirilmiş iki Discord hesabı aynı bot token'ına çözümlenirse OpenClaw, o token için yalnızca bir gateway izleyicisi başlatır. Yapılandırma kaynaklı token, varsayılan env fallback'e göre önceliklidir; aksi takdirde ilk etkin hesap kazanır ve yinelenen hesap devre dışı olarak raporlanır.
Gelişmiş giden çağrılar için (mesaj aracı/kanal eylemleri), açık bir çağrı başına `token` bu çağrı için kullanılır. Bu, gönderme ve okuma/yoklama tarzı eylemler için geçerlidir (örneğin read/search/fetch/thread/pins/permissions). Hesap politikası/yeniden deneme ayarları yine de etkin çalışma zamanı anlık görüntüsünde seçilen hesaptan gelir.
</Note>

## Önerilir: Bir guild çalışma alanı kurun

DM'ler çalıştıktan sonra, Discord sunucunuzu her kanalın kendi bağlamıyla kendi araç oturumunu aldığı tam bir çalışma alanı olarak ayarlayabilirsiniz. Bu, yalnızca siz ve botunuzun bulunduğu özel sunucular için önerilir.

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
    Varsayılan olarak aracınız guild kanallarında yalnızca @mention edildiğinde yanıt verir. Özel bir sunucu için muhtemelen her mesaja yanıt vermesini istersiniz.

    Guild kanallarında normal yanıtlar varsayılan olarak otomatik gönderilir. Paylaşılan her zaman açık odalar için, aracın beklemede kalıp yalnızca kanal yanıtının yararlı olduğuna karar verdiğinde gönderi paylaşabilmesi amacıyla `messages.groupChat.visibleReplies: "message_tool"` seçeneğini etkinleştirin. Bu, GPT 5.5 gibi en yeni nesil, araç açısından güvenilir modellerle en iyi çalışır. Ortam odası olayları araç göndermedikçe sessiz kalır. Tam bekleme modu yapılandırması için [Ortam odası olayları](/tr/channels/ambient-room-events) bölümüne bakın.

    Discord yazıyor gösteriyor ve günlükler token kullanımını gösteriyor ancak mesaj gönderilmiyorsa, turun bir ortam odası olayı olarak yapılandırılıp yapılandırılmadığını veya mesaj aracı görünür yanıtlarına dahil edilip edilmediğini kontrol edin.

    <Tabs>
      <Tab title="Aracınıza sorun">
        > "Aracımın bu sunucuda @mention edilmeden yanıt vermesine izin ver"
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

        Görünür grup/kanal yanıtları için mesaj aracı gönderimlerini zorunlu kılmak üzere `messages.groupChat.visibleReplies: "message_tool"` ayarlayın.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Guild kanallarında bellek için plan yapın">
    Varsayılan olarak uzun vadeli bellek (MEMORY.md) yalnızca DM oturumlarında yüklenir. Guild kanalları MEMORY.md dosyasını otomatik yüklemez.

    <Tabs>
      <Tab title="Aracınıza sorun">
        > "Discord kanallarında soru sorduğumda, MEMORY.md dosyasından uzun vadeli bağlama ihtiyacın varsa memory_search veya memory_get kullan."
      </Tab>
      <Tab title="Manuel">
        Her kanalda paylaşılan bağlama ihtiyacınız varsa, kararlı talimatları `AGENTS.md` veya `USER.md` içine koyun (her oturuma enjekte edilirler). Uzun vadeli notları `MEMORY.md` içinde tutun ve gerektiğinde bellek araçlarıyla bunlara erişin.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Şimdi Discord sunucunuzda bazı kanallar oluşturun ve sohbet etmeye başlayın. Aracınız kanal adını görebilir ve her kanal kendi yalıtılmış oturumunu alır — böylece `#coding`, `#home`, `#research` veya iş akışınıza uyan başka bir şey ayarlayabilirsiniz.

## Çalışma zamanı modeli

- Gateway, Discord bağlantısının sahibidir.
- Yanıt yönlendirmesi deterministiktir: Discord’dan gelen yanıtlar Discord’a geri döner.
- Discord sunucu/kanal meta verileri, kullanıcıya görünen bir yanıt öneki olarak değil,
  güvenilmeyen bağlam olarak model istemine eklenir. Bir model bu zarfı geri
  kopyalarsa OpenClaw, kopyalanan meta verileri giden yanıtlardan ve
  gelecekteki yeniden oynatma bağlamından çıkarır.
- Varsayılan olarak (`session.dmScope=main`), doğrudan sohbetler ajanın ana oturumunu (`agent:main:main`) paylaşır.
- Sunucu kanalları yalıtılmış oturum anahtarlarıdır (`agent:<agentId>:discord:channel:<channelId>`).
- Grup DM’leri varsayılan olarak yok sayılır (`channels.discord.dm.groupEnabled=false`).
- Yerel slash komutları yalıtılmış komut oturumlarında çalışır (`agent:<agentId>:discord:slash:<userId>`), ancak yönlendirilen konuşma oturumuna `CommandTargetSessionKey` taşımaya devam eder.
- Discord’a metin tabanlı cron/heartbeat duyuru teslimi, son
  asistanın görebildiği yanıtı bir kez kullanır. Medya ve yapılandırılmış bileşen yükleri,
  ajan birden fazla teslim edilebilir yük yaydığında çok mesajlı kalır.

## Forum kanalları

Discord forum ve medya kanalları yalnızca konu gönderilerini kabul eder. OpenClaw bunları oluşturmak için iki yolu destekler:

- Otomatik olarak bir konu oluşturmak için forum üst kanalına (`channel:<forumId>`) bir mesaj gönderin. Konu başlığı, mesajınızın ilk boş olmayan satırını kullanır.
- Doğrudan bir konu oluşturmak için `openclaw message thread create` kullanın. Forum kanalları için `--message-id` geçirmeyin.

Örnek: konu oluşturmak için forum üst kanalına gönderme

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Örnek: açıkça bir forum konusu oluşturma

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum üst kanalları Discord bileşenlerini kabul etmez. Bileşenlere ihtiyacınız varsa doğrudan konunun kendisine (`channel:<threadId>`) gönderin.

## Etkileşimli bileşenler

OpenClaw, ajan mesajları için Discord components v2 kapsayıcılarını destekler. Mesaj aracını bir `components` yüküyle kullanın. Etkileşim sonuçları normal gelen mesajlar olarak ajana geri yönlendirilir ve mevcut Discord `replyToMode` ayarlarını izler.

Desteklenen bloklar:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Eylem satırları en fazla 5 düğmeye veya tek bir seçim menüsüne izin verir
- Seçim türleri: `string`, `user`, `role`, `mentionable`, `channel`

Varsayılan olarak bileşenler tek kullanımlıktır. Düğmelerin, seçimlerin ve formların süreleri dolana kadar birden çok kez kullanılmasına izin vermek için `components.reusable=true` ayarlayın.

Bir düğmeye kimin tıklayabileceğini kısıtlamak için o düğmede `allowedUsers` ayarlayın (Discord kullanıcı kimlikleri, etiketleri veya `*`). Yapılandırıldığında, eşleşmeyen kullanıcılar geçici bir ret alır.

Bileşen geri çağrılarının süresi varsayılan olarak 30 dakika sonra dolar. Varsayılan Discord hesabı için bu geri çağrı kayıt defteri ömrünü değiştirmek üzere `channels.discord.agentComponents.ttlMs`, çok hesaplı bir kurulumda bir hesabı geçersiz kılmak üzere `channels.discord.accounts.<accountId>.agentComponents.ttlMs` ayarlayın. Değer milisaniye cinsindedir, pozitif bir tamsayı olmalıdır ve `86400000` (24 saat) ile sınırlıdır. Daha uzun TTL’ler, düğmelerin kullanılabilir kalmasını gerektiren inceleme veya onay iş akışları için kullanışlıdır, ancak eski bir Discord mesajının hâlâ bir eylemi tetikleyebileceği pencereyi de uzatır. İş akışına uyan en kısa TTL’yi tercih edin ve eski geri çağrılar şaşırtıcı olacaksa varsayılanı koruyun.

`/model` ve `/models` slash komutları; sağlayıcı, model ve uyumlu çalışma zamanı açılır listelerinin yanı sıra bir Gönder adımı içeren etkileşimli bir model seçici açar. `/models add` kullanımdan kaldırılmıştır ve artık sohbetten model kaydetmek yerine bir kullanımdan kaldırma mesajı döndürür. Seçici yanıtı geçicidir ve yalnızca çağıran kullanıcı bunu kullanabilir. Discord seçim menüleri 25 seçenekle sınırlıdır; bu nedenle seçicinin dinamik olarak keşfedilen modelleri yalnızca `openai` veya `vllm` gibi seçilen sağlayıcılar için göstermesini istediğinizde `agents.defaults.models` içine `provider/*` girdileri ekleyin.

Dosya ekleri:

- `file` blokları bir ek referansına işaret etmelidir (`attachment://<filename>`)
- Eki `media`/`path`/`filePath` (tek dosya) aracılığıyla sağlayın; birden çok dosya için `media-gallery` kullanın
- Yükleme adının ek referansıyla eşleşmesi gerektiğinde bunu geçersiz kılmak için `filename` kullanın

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
  <Tab title="DM politikası">
    `channels.discord.dmPolicy` DM erişimini denetler. `channels.discord.allowFrom` kanonik DM izin listesidir.

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` öğesinin `"*"` içermesini gerektirir)
    - `disabled`

    DM politikası açık değilse bilinmeyen kullanıcılar engellenir (veya `pairing` modunda eşleştirme için yönlendirilir).

    Çok hesaplı öncelik:

    - `channels.discord.accounts.default.allowFrom` yalnızca `default` hesabına uygulanır.
    - Bir hesap için `allowFrom`, eski `dm.allowFrom` değerinden önceliklidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` ve eski `dm.allowFrom` ayarlanmamışsa `channels.discord.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.discord.accounts.default.allowFrom` değerini devralmaz.

    Eski `channels.discord.dm.policy` ve `channels.discord.dm.allowFrom` uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` değerlerine geçirir.

    Teslimat için DM hedef biçimi:

    - `user:<id>`
    - `<@id>` bahsi

    Yalın sayısal kimlikler, bir kanal varsayılanı etkin olduğunda normalde kanal kimlikleri olarak çözümlenir, ancak hesabın etkin DM `allowFrom` değerinde listelenen kimlikler uyumluluk için kullanıcı DM hedefleri olarak değerlendirilir.

  </Tab>

  <Tab title="Erişim grupları">
    Discord DM’leri ve metin komutu yetkilendirmesi, `channels.discord.allowFrom` içinde dinamik `accessGroup:<name>` girdilerini kullanabilir.

    Erişim grubu adları mesaj kanalları arasında paylaşılır. Üyeleri her kanalın normal `allowFrom` söz diziminde ifade edilen statik bir grup için `type: "message.senders"` kullanın veya bir Discord kanalının geçerli `ViewChannel` hedef kitlesinin üyeliği dinamik olarak tanımlaması gerektiğinde `type: "discord.channelAudience"` kullanın. Paylaşılan erişim grubu davranışı burada belgelenmiştir: [Erişim grupları](/tr/channels/access-groups).

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

    Örnek: DM’leri diğer herkese kapalı tutarken `#maintainers` kanalını görebilen herkesin bota DM göndermesine izin verme.

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

    Aramalar kapalı başarısız olur. Discord `Missing Access` döndürürse, üye araması başarısız olursa veya kanal farklı bir sunucuya aitse DM göndereni yetkisiz olarak değerlendirilir.

    Kanal hedef kitlesi erişim gruplarını kullanırken bot için Discord Developer Portal **Server Members Intent** özelliğini etkinleştirin. DM’ler sunucu üyesi durumunu içermez, bu yüzden OpenClaw yetkilendirme sırasında üyeyi Discord REST üzerinden çözümler.

  </Tab>

  <Tab title="Sunucu politikası">
    Sunucu işleme `channels.discord.groupPolicy` tarafından denetlenir:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` mevcut olduğunda güvenli temel `allowlist` değeridir.

    `allowlist` davranışı:

    - sunucu `channels.discord.guilds` ile eşleşmelidir (`id` tercih edilir, slug kabul edilir)
    - isteğe bağlı gönderen izin listeleri: `users` (kararlı kimlikler önerilir) ve `roles` (yalnızca rol kimlikleri); herhangi biri yapılandırılmışsa gönderenler `users` VEYA `roles` ile eşleştiklerinde izinli olur
    - doğrudan ad/etiket eşleştirme varsayılan olarak devre dışıdır; `channels.discord.dangerouslyAllowNameMatching: true` değerini yalnızca acil durum uyumluluk modu olarak etkinleştirin
    - `users` için adlar/etiketler desteklenir, ancak kimlikler daha güvenlidir; ad/etiket girdileri kullanıldığında `openclaw security audit` uyarır
    - bir sunucuda `channels` yapılandırılmışsa listede olmayan kanallar reddedilir
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

    Yalnızca `DISCORD_BOT_TOKEN` ayarlarsanız ve bir `channels.discord` bloğu oluşturmazsanız çalışma zamanı geri dönüşü, `channels.defaults.groupPolicy` `open` olsa bile `groupPolicy="allowlist"` olur (günlüklerde bir uyarıyla).

  </Tab>

  <Tab title="Bahisler ve grup DM’leri">
    Sunucu mesajları varsayılan olarak bahis geçidine tabidir.

    Bahis algılama şunları içerir:

    - açık bot bahsi
    - yapılandırılmış bahis desenleri (`agents.list[].groupChat.mentionPatterns`, geri dönüş `messages.groupChat.mentionPatterns`)
    - desteklenen durumlarda örtük bota-yanıtla davranışı

    Giden Discord mesajları yazarken kanonik bahis söz dizimini kullanın: kullanıcılar için `<@USER_ID>`, kanallar için `<#CHANNEL_ID>` ve roller için `<@&ROLE_ID>`. Eski `<@!USER_ID>` takma ad bahsi biçimini kullanmayın.

    `requireMention`, sunucu/kanal başına yapılandırılır (`channels.discord.guilds...`).
    `ignoreOtherMentions`, isteğe bağlı olarak başka bir kullanıcıdan/rolden bahseden ancak bottan bahsetmeyen mesajları düşürür (@everyone/@here hariç).

    Grup DM’leri:

    - varsayılan: yok sayılır (`dm.groupEnabled=false`)
    - `dm.groupChannels` aracılığıyla isteğe bağlı izin listesi (kanal kimlikleri veya slug’lar)

  </Tab>
</Tabs>

### Rol tabanlı ajan yönlendirmesi

`bindings[].match.roles` kullanarak Discord guild üyelerini rol kimliğine göre farklı aracılara yönlendirin. Rol tabanlı bağlamalar yalnızca rol kimliklerini kabul eder ve eş ya da üst-eş bağlamalarından sonra, yalnızca guild bağlamalarından önce değerlendirilir. Bir bağlama başka eşleşme alanları da ayarlıyorsa (örneğin `peer` + `guildId` + `roles`), yapılandırılan tüm alanlar eşleşmelidir.

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

- `commands.native` varsayılan olarak `"auto"` değerine sahiptir ve Discord için etkindir.
- Kanal başına geçersiz kılma: `channels.discord.commands.native`.
- `commands.native=false`, başlangıç sırasında Discord eğik çizgi komutu kaydını ve temizliğini atlar. Önceden kaydedilmiş komutlar, Discord uygulamasından kaldırana kadar Discord içinde görünür kalabilir.
- Yerel komut yetkilendirmesi, normal ileti işleme ile aynı Discord izin listelerini/ilkelerini kullanır.
- Komutlar, yetkili olmayan kullanıcılar için Discord UI içinde hâlâ görünür olabilir; yürütme yine de OpenClaw yetkilendirmesini uygular ve "yetkili değil" döndürür.

Komut kataloğu ve davranışı için [Eğik çizgi komutları](/tr/tools/slash-commands) bölümüne bakın.

Varsayılan eğik çizgi komutu ayarları:

- `ephemeral: true`

## Özellik ayrıntıları

<AccordionGroup>
  <Accordion title="Yanıt etiketleri ve yerel yanıtlar">
    Discord, aracı çıktısında yanıt etiketlerini destekler:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` tarafından kontrol edilir:

    - `off` (varsayılan)
    - `first`
    - `all`
    - `batched`

    Not: `off`, örtük yanıt iş parçacığı oluşturmayı devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.
    `first`, dönüş için ilk giden Discord iletisine örtük yerel yanıt referansını her zaman ekler.
    `batched`, yalnızca gelen olay birden fazla iletiden oluşan debounce uygulanmış bir toplu işlem olduğunda Discord'un örtük yerel yanıt referansını ekler. Bu, yerel yanıtları her tek iletilik dönüş için değil, özellikle belirsiz ve yoğun sohbet patlamaları için istediğinizde yararlıdır.

    İleti kimlikleri bağlam/geçmiş içinde gösterilir, böylece aracılar belirli iletileri hedefleyebilir.

  </Accordion>

  <Accordion title="Bağlantı önizlemeleri">
    Discord, varsayılan olarak URL'ler için zengin bağlantı gömmeleri oluşturur. OpenClaw, giden Discord iletilerinde oluşturulan bu gömmeleri varsayılan olarak bastırır; böylece aracı tarafından gönderilen URL'ler, siz açıkça etkinleştirmedikçe düz bağlantılar olarak kalır:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Tek bir hesabı geçersiz kılmak için `channels.discord.accounts.<id>.suppressEmbeds` değerini ayarlayın. Aracı ileti aracı gönderimleri, tek bir ileti için `suppressEmbeds: false` da geçirebilir. Açık Discord `embeds` yükleri varsayılan bağlantı önizleme ayarı tarafından bastırılmaz.

  </Accordion>

  <Accordion title="Canlı akış önizlemesi">
    OpenClaw, geçici bir ileti gönderip metin geldikçe bunu düzenleyerek taslak yanıtları akışla iletebilir. `channels.discord.streaming`, `off` | `partial` | `block` | `progress` (varsayılan) alır. `progress`, düzenlenebilir tek bir durum taslağını korur ve nihai teslimata kadar araç ilerlemesiyle günceller; paylaşılan başlangıç etiketi kayan bir satırdır, bu yüzden yeterince çalışma göründüğünde geri kalan gibi yukarı kayar. `streamMode` eski bir çalışma zamanı takma adıdır. Kalıcı yapılandırmayı kanonik anahtara yeniden yazmak için `openclaw doctor --fix` çalıştırın.

    Discord önizleme düzenlemelerini devre dışı bırakmak için `channels.discord.streaming.mode` değerini `off` olarak ayarlayın. Discord block akışı açıkça etkinleştirilmişse, OpenClaw çift akışı önlemek için önizleme akışını atlar.

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
    - `block`, taslak boyutlu parçalar yayar (boyutu ve kesme noktalarını ayarlamak için `draftChunk` kullanın; `textChunkLimit` ile sınırlandırılır).
    - Medya, hata ve açık yanıt nihai iletileri bekleyen önizleme düzenlemelerini iptal eder.
    - `streaming.preview.toolProgress` (varsayılan `true`), araç/ilerleme güncellemelerinin önizleme iletisini yeniden kullanıp kullanmayacağını kontrol eder.
    - Araç/ilerleme satırları, mevcut olduğunda kompakt emoji + başlık + ayrıntı olarak işlenir; örneğin `🛠️ Bash: run tests` veya `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (varsayılan `false`), geçici ilerleme taslağında asistan yorum/açılış metnini etkinleştirir. Yorum görüntülenmeden önce temizlenir, geçici kalır ve nihai yanıt teslimatını değiştirmez.
    - `streaming.progress.maxLineChars`, satır başına ilerleme önizleme bütçesini kontrol eder. Düzyazı sözcük sınırlarında kısaltılır; komut ve yol ayrıntıları yararlı son ekleri korur.
    - `streaming.preview.commandText` / `streaming.progress.commandText`, kompakt ilerleme satırlarında komut/exec ayrıntısını kontrol eder: `raw` (varsayılan) veya `status` (yalnızca araç etiketi).

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
    Guild geçmiş bağlamı:

    - `channels.discord.historyLimit` varsayılan `20`
    - geri dönüş: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    DM geçmiş kontrolleri:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    İş parçacığı davranışı:

    - Discord iş parçacıkları kanal oturumları olarak yönlendirilir ve geçersiz kılınmadıkça üst kanal yapılandırmasını devralır.
    - İş parçacığı oturumları, üst kanalın oturum düzeyi `/model` seçimini yalnızca model geri dönüşü olarak devralır; iş parçacığı yerel `/model` seçimleri yine de önceliklidir ve transkript devralma etkinleştirilmedikçe üst transkript geçmişi kopyalanmaz.
    - `channels.discord.thread.inheritParent` (varsayılan `false`), yeni otomatik iş parçacıklarının üst transkriptten tohumlanmasını etkinleştirir. Hesap başına geçersiz kılmalar `channels.discord.accounts.<id>.thread.inheritParent` altında bulunur.
    - İleti aracı tepkileri `user:<id>` DM hedeflerini çözebilir.
    - `guilds.<guild>.channels.<channel>.requireMention: false`, yanıt aşaması etkinleştirme geri dönüşü sırasında korunur.

    Kanal konuları **güvenilmeyen** bağlam olarak enjekte edilir. İzin listeleri aracı kimin tetikleyebileceğini sınırlar; tam bir ek bağlam redaksiyon sınırı değildir.

  </Accordion>

  <Accordion title="Alt aracılar için iş parçacığına bağlı oturumlar">
    Discord, bir iş parçacığını bir oturum hedefine bağlayabilir; böylece o iş parçacığındaki takip iletileri aynı oturuma yönlendirilmeye devam eder (alt aracı oturumları dahil).

    Komutlar:

    - `/focus <target>` mevcut/yeni iş parçacığını bir alt aracı/oturum hedefine bağlar
    - `/unfocus` mevcut iş parçacığı bağlamasını kaldırır
    - `/agents` etkin çalıştırmaları ve bağlama durumunu gösterir
    - `/session idle <duration|off>` odaklanmış bağlamalar için etkin olmama otomatik odak kaldırmayı inceler/günceller
    - `/session max-age <duration|off>` odaklanmış bağlamalar için kesin azami yaşı inceler/günceller

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
    - `spawnSessions`, `sessions_spawn({ thread: true })` ve ACP iş parçacığı oluşturmaları için iş parçacıklarını otomatik oluşturma/bağlamayı kontrol eder. Varsayılan: `true`.
    - `defaultSpawnContext`, iş parçacığına bağlı oluşturmalar için yerel alt aracı bağlamını kontrol eder. Varsayılan: `"fork"`.
    - Kullanımdan kaldırılmış `spawnSubagentSessions`/`spawnAcpSessions` anahtarları `openclaw doctor --fix` tarafından taşınır.
    - Bir hesap için iş parçacığı bağlamaları devre dışıysa, `/focus` ve ilgili iş parçacığı bağlama işlemleri kullanılamaz.

    Bağlama davranışı ayrıntıları için [Alt aracılar](/tr/tools/subagents), [ACP Aracıları](/tr/tools/acp-agents) ve [Yapılandırma Referansı](/tr/gateway/configuration-reference) bölümlerine bakın.

  </Accordion>

  <Accordion title="Kalıcı ACP kanal bağlamaları">
    Kararlı ve "her zaman açık" ACP çalışma alanları için Discord konuşmalarını hedefleyen üst düzey türlenmiş ACP bağlamaları yapılandırın.

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

    - `/acp spawn codex --bind here`, mevcut kanalı veya iş parçacığını yerinde bağlar ve gelecekteki iletileri aynı ACP oturumunda tutar. İş parçacığı iletileri üst kanal bağlamasını devralır.
    - Bağlı bir kanalda veya iş parçacığında, `/new` ve `/reset` aynı ACP oturumunu yerinde sıfırlar. Geçici iş parçacığı bağlamaları etkin olduğu sürece hedef çözümlemeyi geçersiz kılabilir.
    - `spawnSessions`, `--thread auto|here` üzerinden alt iş parçacığı oluşturma/bağlamayı sınırlar.

    Bağlama davranışı ayrıntıları için [ACP Aracıları](/tr/tools/acp-agents) bölümüne bakın.

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
    - aracı kimliği emoji geri dönüşü (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Discord unicode emojileri veya özel emoji adlarını kabul eder.
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
    Discord Gateway WebSocket trafiğini ve başlangıç REST aramalarını (uygulama kimliği + izin listesi çözümlemesi) `channels.discord.proxy` ile bir HTTP(S) proxy üzerinden yönlendirin.

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
    Proxy uygulanmış iletileri sistem üyesi kimliğiyle eşlemek için PluralKit çözümlemesini etkinleştirin:

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
    - aramalar özgün ileti kimliğini kullanır ve zaman aralığıyla sınırlıdır
    - arama başarısız olursa, proxy'lenmiş iletiler bot iletileri olarak değerlendirilir ve `allowBots=true` olmadığı sürece düşürülür

  </Accordion>

  <Accordion title="Outbound mention aliases">
    Ajanların bilinen Discord kullanıcıları için deterministik giden bahsetmelere ihtiyacı olduğunda `mentionAliases` kullanın. Anahtarlar başında `@` olmayan tanıtıcılardır; değerler Discord kullanıcı kimlikleridir. Bilinmeyen tanıtıcılar, `@everyone`, `@here` ve Markdown kod aralıklarının içindeki bahsetmeler değiştirilmeden bırakılır.

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
    Bir durum veya etkinlik alanı ayarladığınızda ya da otomatik presence'ı etkinleştirdiğinizde presence güncellemeleri uygulanır.

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
    - 4: Özel (etkinlik metnini durum hâli olarak kullanır; emoji isteğe bağlıdır)
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

    Otomatik presence, çalışma zamanı kullanılabilirliğini Discord durumuna eşler: sağlıklı => çevrimiçi, bozulmuş veya bilinmiyor => boşta, tükenmiş veya kullanılamıyor => dnd. İsteğe bağlı metin geçersiz kılmaları:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` yer tutucusunu destekler)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord, DM'lerde düğme tabanlı onay işlemeyi destekler ve isteğe bağlı olarak onay istemlerini kaynak kanalda yayımlayabilir.

    Yapılandırma yolu:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    `enabled` ayarı yapılmadığında veya `"auto"` olduğunda ve en az bir onaylayıcı `execApprovals.approvers` ya da `commands.ownerAllowFrom` üzerinden çözümlenebildiğinde Discord yerel exec onaylarını otomatik etkinleştirir. Discord, kanal `allowFrom`, eski `dm.allowFrom` veya doğrudan ileti `defaultTo` değerlerinden exec onaylayıcıları çıkarımsamaz. Discord'u yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.

    `/diagnostics` ve `/export-trajectory` gibi hassas, yalnızca sahip grup komutları için OpenClaw onay istemlerini ve nihai sonuçları özel olarak gönderir. Çağıran sahibin bir Discord sahip rotası varsa önce Discord DM'yi dener; bu kullanılamıyorsa Telegram gibi `commands.ownerAllowFrom` içindeki ilk kullanılabilir sahip rotasına geri döner.

    `target`, `channel` veya `both` olduğunda onay istemi kanalda görünür. Düğmeleri yalnızca çözümlenmiş onaylayıcılar kullanabilir; diğer kullanıcılar geçici bir ret alır. Onay istemleri komut metnini içerir, bu yüzden kanal teslimini yalnızca güvenilir kanallarda etkinleştirin. Kanal kimliği oturum anahtarından türetilemezse OpenClaw DM teslimine geri döner.

    Discord, diğer sohbet kanallarının kullandığı paylaşılan onay düğmelerini de işler. Yerel Discord adaptörü esas olarak onaylayıcı DM yönlendirmesi ve kanal fanout'u ekler.
    Bu düğmeler mevcut olduğunda birincil onay kullanıcı deneyimi bunlardır; OpenClaw
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu söylediğinde
    manuel bir `/approve` komutu eklemelidir.
    Discord yerel onay çalışma zamanı etkin değilse OpenClaw yerel deterministik
    `/approve <id> <decision>` istemini görünür tutar. Çalışma zamanı etkinse ancak yerel kart
    herhangi bir hedefe teslim edilemiyorsa OpenClaw bekleyen onaydaki tam `/approve`
    komutuyla aynı sohbete bir geri dönüş bildirimi gönderir.

    Gateway kimlik doğrulaması ve onay çözümlemesi paylaşılan Gateway istemci sözleşmesini izler (`plugin:` kimlikleri `plugin.approval.resolve` üzerinden; diğer kimlikler `exec.approval.resolve` üzerinden çözümlenir). Onaylar varsayılan olarak 30 dakika sonra sona erer.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Araçlar ve eylem kapıları

Discord ileti eylemleri mesajlaşma, kanal yönetimi, moderasyon, presence ve meta veri eylemlerini içerir.

Temel örnekler:

- mesajlaşma: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- tepkiler: `react`, `reactions`, `emojiList`
- moderasyon: `timeout`, `kick`, `ban`
- presence: `setPresence`

`event-create` eylemi, planlanmış etkinlik kapak görselini ayarlamak için isteğe bağlı bir `image` parametresi (URL veya yerel dosya yolu) kabul eder.

Eylem kapıları `channels.discord.actions.*` altında bulunur.

Varsayılan kapı davranışı:

| Eylem grubu                                                                                                                                                              | Varsayılan |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| tepkiler, iletiler, iş parçacıkları, sabitler, anketler, arama, memberInfo, roleInfo, channelInfo, kanallar, voiceStatus, etkinlikler, çıkartmalar, emojiUploads, stickerUploads, izinler | etkin      |
| roller                                                                                                                                                                   | devre dışı |
| moderasyon                                                                                                                                                              | devre dışı |
| presence                                                                                                                                                                | devre dışı |

## Components v2 kullanıcı arayüzü

OpenClaw, exec onayları ve çapraz bağlam işaretleyicileri için Discord components v2 kullanır. Discord ileti eylemleri özel kullanıcı arayüzü için `components` da kabul edebilir (ileri düzey; discord aracı üzerinden bir component yükü oluşturmayı gerektirir), eski `embeds` kullanılabilir kalır ancak önerilmez.

- `channels.discord.ui.components.accentColor`, Discord component kapsayıcıları tarafından kullanılan vurgu rengini ayarlar (hex).
- Hesap başına `channels.discord.accounts.<id>.ui.components.accentColor` ile ayarlayın.
- `channels.discord.agentComponents.ttlMs`, gönderilen Discord component geri çağırmalarının ne kadar süre kayıtlı kalacağını denetler (varsayılan `1800000`, maksimum `86400000`). Hesap başına `channels.discord.accounts.<id>.agentComponents.ttlMs` ile ayarlayın.
- Components v2 mevcut olduğunda `embeds` yok sayılır.
- Düz URL önizlemeleri varsayılan olarak bastırılır. Tek bir giden bağlantının genişletilmesi gerektiğinde ileti eyleminde `suppressEmbeds: false` ayarlayın.

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

Discord'un iki ayrı ses yüzeyi vardır: gerçek zamanlı **ses kanalları** (sürekli konuşmalar) ve **sesli ileti ekleri** (dalga biçimi önizleme biçimi). Gateway ikisini de destekler.

### Ses kanalları

Kurulum kontrol listesi:

1. Discord Developer Portal'da Message Content Intent'i etkinleştirin.
2. Rol/kullanıcı izin listeleri kullanıldığında Server Members Intent'i etkinleştirin.
3. Botu `bot` ve `applications.commands` kapsamlarıyla davet edin.
4. Hedef ses kanalında Connect, Speak, Send Messages ve Read Message History izinlerini verin.
5. Yerel komutları etkinleştirin (`commands.native` veya `channels.discord.commands.native`).
6. `channels.discord.voice` yapılandırın.

Oturumları denetlemek için `/vc join|leave|status` kullanın. Komut, hesap varsayılan ajanını kullanır ve diğer Discord komutlarıyla aynı izin listesi ve grup ilkesi kurallarını izler.

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

- `voice.tts`, yalnızca `stt-tts` ses oynatımı için `messages.tts` ayarını geçersiz kılar. Gerçek zamanlı modlar `voice.realtime.speakerVoice` kullanır.
- `voice.mode` konuşma yolunu denetler. Varsayılan değer `agent-proxy` değeridir: gerçek zamanlı bir ses ön ucu sıra zamanlamasını, kesintiyi ve oynatmayı yönetir, asıl işi `openclaw_agent_consult` üzerinden yönlendirilen OpenClaw ajanına devreder ve sonucu o konuşmacıdan gelen yazılmış bir Discord istemi gibi ele alır. `stt-tts` eski toplu STT artı TTS akışını korur. `bidi`, gerçek zamanlı modelin doğrudan konuşmasına izin verirken OpenClaw beyni için `openclaw_agent_consult` işlevini sunar.
- `voice.agentSession`, hangi OpenClaw konuşmasının ses sıralarını alacağını denetler. Ses kanalının kendi oturumu için ayarsız bırakın veya ses kanalının `#maintainers` gibi mevcut bir Discord metin kanalı oturumunun mikrofon/hoparlör uzantısı gibi davranmasını sağlamak için `{ mode: "target", target: "channel:<text-channel-id>" }` olarak ayarlayın.
- `voice.model`, Discord ses yanıtları ve gerçek zamanlı danışmalar için OpenClaw ajan beynini geçersiz kılar. Yönlendirilen ajan modelini devralmak için ayarsız bırakın. `voice.realtime.model` ayarından ayrıdır.
- `voice.followUsers`, botun seçili kullanıcılarla birlikte Discord sese katılmasına, taşınmasına ve ayrılmasına izin verir. Davranış kuralları ve örnekler için [Seste kullanıcıları takip et](#follow-users-in-voice) bölümüne bakın.
- `agent-proxy`, konuşmayı `discord-voice` üzerinden yönlendirir; bu, konuşmacı ve hedef oturum için normal sahip/araç yetkilendirmesini korur ancak Discord ses oynatmayı üstlendiği için ajan `tts` aracını gizler. Varsayılan olarak `agent-proxy`, sahip konuşmacılar için danışmaya sahip eşdeğeri tam araç erişimi verir (`voice.realtime.toolPolicy: "owner"`) ve asıl yanıtlar öncesinde OpenClaw ajanına danışmayı güçlü biçimde tercih eder (`voice.realtime.consultPolicy: "always"`). Bu varsayılan `always` modunda, gerçek zamanlı katman danışma yanıtından önce otomatik olarak dolgu konuşması yapmaz; konuşmayı yakalayıp yazıya döker, ardından yönlendirilen OpenClaw yanıtını seslendirir. Discord ilk yanıtı hâlâ oynatırken birden çok zorunlu danışma yanıtı tamamlanırsa, sonraki tam-konuşma yanıtları cümlenin ortasında konuşmayı değiştirmek yerine oynatma boşa çıkana kadar kuyruğa alınır.
- `stt-tts` modunda STT `tools.media.audio` kullanır; `voice.model` transkripsiyonu etkilemez.
- Gerçek zamanlı modlarda `voice.realtime.provider`, `voice.realtime.model` ve `voice.realtime.speakerVoice` gerçek zamanlı ses oturumunu yapılandırır. OpenAI Realtime 2 ile Codex beynini kullanmak için `voice.realtime.model: "gpt-realtime-2"` ve `voice.model: "openai/gpt-5.5"` kullanın.
- Gerçek zamanlı ses modları, hızlı doğrudan sıraların yönlendirilen OpenClaw ajanıyla aynı kimliği, kullanıcı dayanağını ve kişiliği koruması için varsayılan olarak gerçek zamanlı sağlayıcı talimatlarına küçük `IDENTITY.md`, `USER.md` ve `SOUL.md` profil dosyalarını dahil eder. Bunu özelleştirmek için `voice.realtime.bootstrapContextFiles` değerini bir alt kümeye, devre dışı bırakmak için `[]` değerine ayarlayın. Desteklenen gerçek zamanlı önyükleme dosyaları bu profil dosyalarıyla sınırlıdır; `AGENTS.md` normal ajan bağlamında kalır. Enjekte edilen profil bağlamı, çalışma alanı işleri, güncel gerçekler, bellek araması veya araç destekli eylemler için `openclaw_agent_consult` yerine geçmez.
- OpenAI `agent-proxy` gerçek zamanlı modunda, Discord gerçek zamanlı sesini bir transkript bir uyandırma adıyla başlayana veya bitene kadar sessiz tutmak için `voice.realtime.requireWakeName: true` ayarlayın. Yapılandırılan uyandırma adları bir veya iki sözcük olmalıdır. `voice.realtime.wakeNames` ayarlanmamışsa OpenClaw yönlendirilen ajan `name` değerini artı `OpenClaw` kullanır; bunun yokluğunda ajan kimliğini artı `OpenClaw` kullanır. Uyandırma adı geçidi gerçek zamanlı sağlayıcı otomatik yanıtını devre dışı bırakır, kabul edilen sıraları OpenClaw ajan danışma yolundan geçirir ve son transkript gelmeden önce kısmi transkripsiyondan baştaki bir uyandırma adı tanındığında kısa bir sözlü onay verir.
- OpenAI gerçek zamanlı sağlayıcısı, geçerli Realtime 2 olay adlarını ve çıkış sesi ile transkript olayları için eski Codex uyumlu takma adları kabul eder; böylece uyumlu sağlayıcı anlık görüntüleri asistan sesini düşürmeden sapabilir.
- `voice.realtime.bargeIn`, Discord konuşmacı-başladı olaylarının etkin gerçek zamanlı oynatmayı kesip kesmeyeceğini denetler. Ayarlanmamışsa gerçek zamanlı sağlayıcının giriş-sesi kesinti ayarını izler.
- `voice.realtime.minBargeInAudioEndMs`, bir OpenAI gerçek zamanlı araya girme sesi kesmeden önceki minimum asistan oynatma süresini denetler. Varsayılan: `250`. Düşük yankılı odalarda anında kesinti için `0` olarak ayarlayın veya yankısı yoğun hoparlör kurulumları için artırın.
- Discord oynatımında bir OpenAI sesi için `voice.tts.provider: "openai"` ayarlayın ve `voice.tts.providers.openai.speakerVoice` altında bir Metinden konuşmaya sesi seçin. `cedar`, geçerli OpenAI TTS modelinde erkeksi tınlayan iyi bir seçimdir.
- Kanal başına Discord `systemPrompt` geçersiz kılmaları, o ses kanalı için ses transkripti sıralarına uygulanır.
- Ses transkripti sıraları, sahip kapılı komutlar ve kanal eylemleri için sahip durumunu Discord `allowFrom` (veya `dm.allowFrom`) değerinden türetir. Ajan araç görünürlüğü, yönlendirilen oturum için yapılandırılmış araç politikasını izler.
- Discord ses, yalnızca metin yapılandırmaları için isteğe bağlıdır; `/vc` komutlarını, ses çalışma zamanını ve `GuildVoiceStates` Gateway niyetini etkinleştirmek için `channels.discord.voice.enabled=true` ayarlayın (veya mevcut bir `channels.discord.voice` bloğunu koruyun).
- `channels.discord.intents.voiceStates`, ses-durumu niyeti aboneliğini açıkça geçersiz kılabilir. Niyetin etkili ses etkinleştirmesini izlemesi için ayarsız bırakın.
- `voice.autoJoin` aynı sunucu için birden çok giriş içeriyorsa OpenClaw o sunucu için son yapılandırılan kanala katılır.
- `voice.allowedChannels` isteğe bağlı bir ikamet izin listesidir. `/vc join` komutunun yetkili herhangi bir Discord ses kanalına katılmasına izin vermek için ayarsız bırakın. Ayarlandığında `/vc join`, başlangıç otomatik katılımı ve bot ses-durumu taşımaları listelenen `{ guildId, channelId }` girişleriyle sınırlandırılır. Tüm Discord ses katılımlarını reddetmek için boş bir diziye ayarlayın. Discord botu izin listesinin dışına taşırsa OpenClaw o kanaldan ayrılır ve mevcut olduğunda yapılandırılmış otomatik katılım hedefine yeniden katılır.
- `voice.daveEncryption` ve `voice.decryptionFailureTolerance`, `@discordjs/voice` katılım seçeneklerine aktarılır.
- Ayarlanmamışsa `@discordjs/voice` varsayılanları `daveEncryption=true` ve `decryptionFailureTolerance=24` değerleridir.
- OpenClaw, Discord ses alma ve gerçek zamanlı ham PCM oynatma için paketlenmiş `libopus-wasm` codec bileşenini kullanır. Sabitlenmiş bir libopus WebAssembly derlemesiyle gelir ve yerel opus eklentileri gerektirmez.
- `voice.connectTimeoutMs`, `/vc join` ve otomatik katılım denemeleri için ilk `@discordjs/voice` Ready beklemesini denetler. Varsayılan: `30000`.
- `voice.reconnectGraceMs`, OpenClaw'ın bağlantısı kesilmiş bir ses oturumunun yok edilmeden önce yeniden bağlanmaya başlamasını ne kadar bekleyeceğini denetler. Varsayılan: `15000`.
- `stt-tts` modunda ses oynatma, başka bir kullanıcı konuşmaya başladı diye durmaz. Geri bildirim döngülerinden kaçınmak için OpenClaw, TTS oynatılırken yeni ses yakalamayı yok sayar; bir sonraki sıra için oynatma bittikten sonra konuşun. Gerçek zamanlı modlar konuşmacı başlangıçlarını gerçek zamanlı sağlayıcıya araya girme sinyalleri olarak iletir.
- Gerçek zamanlı modlarda hoparlörlerden açık mikrofona gelen yankı araya girme gibi görünüp oynatmayı kesebilir. Yankısı yoğun Discord odaları için OpenAI'nin giriş sesinde otomatik kesinti yapmasını engellemek üzere `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` ayarlayın. Discord konuşmacı-başladı olaylarının etkin oynatmayı kesmesini hâlâ istiyorsanız `voice.realtime.bargeIn: true` ekleyin. OpenAI gerçek zamanlı köprüsü, `voice.realtime.minBargeInAudioEndMs` değerinden kısa oynatma kesmelerini olası yankı/gürültü olarak yok sayar ve Discord oynatmayı temizlemek yerine bunları atlandı olarak günlüğe yazar.
- `voice.captureSilenceGraceMs`, Discord bir konuşmacının durduğunu bildirdikten sonra OpenClaw'ın bu ses segmentini STT için sonlandırmadan önce ne kadar bekleyeceğini denetler. Varsayılan: `2000`; Discord normal duraklamaları kesik kesik kısmi transkriptlere bölüyorsa bunu artırın.
- ElevenLabs seçili TTS sağlayıcısı olduğunda Discord ses oynatımı akışlı TTS kullanır ve sağlayıcı yanıt akışından başlar. Akış desteği olmayan sağlayıcılar, sentezlenmiş geçici dosya yoluna geri döner.
- OpenClaw ayrıca alma şifre çözme hatalarını izler ve kısa bir pencere içinde yinelenen hatalardan sonra ses kanalından ayrılıp yeniden katılarak otomatik kurtarma yapar.
- Güncellemeden sonra alma günlükleri tekrar tekrar `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` gösteriyorsa bir bağımlılık raporu ve günlükleri toplayın. Paketlenmiş `@discordjs/voice` satırı, discord.js sorun #11419'u kapatan discord.js PR #11449'daki upstream padding düzeltmesini içerir.
- `The operation was aborted` alma olayları, OpenClaw yakalanmış bir konuşmacı segmentini sonlandırdığında beklenir; bunlar ayrıntılı tanılamalardır, uyarı değildir.
- Ayrıntılı Discord ses günlükleri, kabul edilen her konuşmacı segmenti için sınırlı tek satırlık bir STT transkript önizlemesi içerir; böylece hata ayıklama sınırsız transkript metni dökmeden hem kullanıcı tarafını hem de ajan yanıt tarafını gösterir.
- `agent-proxy` modunda zorunlu danışma geri dönüşü, `...` ile biten metin veya `and` gibi sonda kalan bir bağlaç gibi muhtemelen eksik transkript parçalarını, ayrıca “be right back” veya “bye” gibi bariz eyleme geçirilemeyen kapanışları atlar. Bu eski bir kuyruk yanıtını önlediğinde günlükler `forced agent consult skipped reason=...` gösterir.

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

- `followUsers`, ham Discord kullanıcı kimliklerini ve `discord:<id>` değerlerini kabul eder. OpenClaw, ses-durumu olaylarını eşleştirmeden önce iki formu da normalleştirir.
- `followUsers` yapılandırıldığında `followUsersEnabled` varsayılan olarak `true` olur. Kaydedilmiş listeyi koruyup otomatik ses takibini durdurmak için `false` olarak ayarlayın.
- Takip edilen bir kullanıcı izin verilen bir ses kanalına katıldığında OpenClaw o kanala katılır. Kullanıcı taşındığında OpenClaw onunla birlikte taşınır. Etkin takip edilen kullanıcı bağlantıyı kestiğinde OpenClaw ayrılır.
- Aynı sunucuda birden çok takip edilen kullanıcı varsa ve etkin takip edilen kullanıcı ayrılırsa OpenClaw sunucudan ayrılmadan önce izlenen başka bir takip edilen kullanıcının kanalına taşınır. Birkaç takip edilen kullanıcı aynı anda taşınırsa en son gözlemlenen ses-durumu olayı kazanır.
- `allowedChannels` yine geçerlidir. İzin verilmeyen bir kanaldaki takip edilen kullanıcı yok sayılır ve takip sahipli bir oturum başka bir takip edilen kullanıcıya taşınır veya ayrılır.
- OpenClaw, başlangıçta ve sınırlı bir aralıkta kaçırılmış ses-durumu olaylarını uzlaştırır. Uzlaştırma yapılandırılmış sunucuları örnekler ve çalıştırma başına REST aramalarını sınırlar; bu nedenle çok büyük `followUsers` listelerinin yakınsaması birden fazla aralık sürebilir.
- Discord veya bir yönetici, bot bir kullanıcıyı takip ederken botu taşırsa OpenClaw ses oturumunu yeniden oluşturur ve hedef izinliyse takip sahipliğini korur. Bot `allowedChannels` dışına taşınırsa OpenClaw ayrılır ve mevcut olduğunda yapılandırılmış hedefe yeniden katılır.
- DAVE alma kurtarması, yinelenen şifre çözme hatalarından sonra aynı kanaldan ayrılıp yeniden katılabilir. Takip sahipli oturumlar bu kurtarma yolu boyunca takip sahipliğini korur; böylece daha sonra takip edilen kullanıcının bağlantıyı kesmesi yine kanaldan ayrılır.

Katılım modları arasında seçim yapın:

- Botun siz seste olduğunuzda otomatik olarak seste olması gereken kişisel veya operatör kurulumları için `followUsers` kullanın.
- İzlenen hiçbir kullanıcı seste olmadığında bile bulunması gereken sabit-oda botları için `autoJoin` kullanın.
- Tek seferlik katılımlar veya otomatik ses varlığının şaşırtıcı olacağı odalar için `/vc join` kullanın.

Discord ses codec bileşeni:

- Ses alma günlükleri `discord voice: opus decoder: libopus-wasm` gösterir.
- Gerçek zamanlı oynatma, ham 48 kHz stereo PCM'yi, paketleri `@discordjs/voice` öğesine vermeden önce aynı paketlenmiş `libopus-wasm` paketiyle Opus'a kodlar.
- Dosya ve sağlayıcı akışı oynatma, ffmpeg ile ham 48 kHz stereo PCM'ye dönüştürür, ardından Discord'a gönderilen Opus paket akışı için `libopus-wasm` kullanır.

STT artı TTS işlem hattı:

- Discord PCM yakalaması geçici bir WAV dosyasına dönüştürülür.
- `tools.media.audio` STT'yi işler; örneğin `openai/gpt-4o-mini-transcribe`.
- Transkript Discord girişi ve yönlendirmesi üzerinden gönderilir; yanıt LLM'si ise ajan `tts` aracını gizleyen ve döndürülen metni isteyen bir ses çıkışı ilkesiyle çalışır, çünkü son TTS oynatmasını Discord sesi üstlenir.
- `voice.model`, ayarlandığında bu ses kanalı turu için yalnızca yanıt LLM'sini geçersiz kılar.
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

`voice.agentSession` bloğu yoksa, her ses kanalı kendi yönlendirilmiş OpenClaw oturumunu alır. Örneğin, `/vc join channel:234567890123456789` o Discord ses kanalının oturumuyla konuşur. Gerçek zamanlı model yalnızca ses ön yüzüdür; asıl istekler yapılandırılmış OpenClaw ajanına devredilir. Gerçek zamanlı model danışma aracını çağırmadan son bir transkript üretirse, OpenClaw varsayılanın hâlâ ajanla konuşuyormuş gibi davranması için danışmayı yedek olarak zorlar.

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

`agent-proxy` modunda bot yapılandırılmış ses kanalına katılır, ancak OpenClaw ajan turları hedef kanalın normal yönlendirilmiş oturumunu ve ajanını kullanır. Gerçek zamanlı ses oturumu döndürülen sonucu ses kanalına geri seslendirir. Gözetmen ajan, doğru eylem buysa ayrı bir Discord mesajı göndermek dahil, araç ilkesine göre normal mesaj araçlarını hâlâ kullanabilir.

Yetkilendirilmiş bir OpenClaw çalıştırması etkinken, yeni Discord ses transkriptleri başka bir ajan turu başlatılmadan önce canlı çalıştırma kontrolü olarak ele alınır. "status", "cancel that", "use the smaller fix" veya "when you're done also check tests" gibi ifadeler etkin oturum için durum, iptal, yönlendirme veya takip girdisi olarak sınıflandırılır. Durum, iptal, kabul edilen yönlendirme ve takip sonuçları ses kanalına geri seslendirilir; böylece arayan kişi OpenClaw'ın isteği işleyip işlemediğini bilir.

Kullanışlı hedef biçimleri:

- `target: "channel:123456789012345678"` bir Discord metin kanalı oturumu üzerinden yönlendirir.
- `target: "123456789012345678"` bir kanal hedefi olarak ele alınır.
- `target: "dm:123456789012345678"` veya `target: "user:123456789012345678"` o doğrudan mesaj oturumu üzerinden yönlendirir.

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

Model kendi Discord oynatmasını açık bir mikrofon üzerinden duyuyorsa, ancak konuşarak onu kesmek istiyorsanız bunu kullanın. OpenClaw, OpenAI'ın ham giriş sesiyle otomatik kesinti yapmasını engeller; `bargeIn: true` ise Discord konuşmacı başlama olaylarının ve zaten etkin olan konuşmacı sesinin, yakalanan sonraki tur OpenAI'a ulaşmadan önce etkin gerçek zamanlı yanıtları iptal etmesine izin verir. `audioEndMs` değeri `minBargeInAudioEndMs` altında olan çok erken araya girme sinyalleri olası yankı/gürültü olarak ele alınır ve yok sayılır; böylece model ilk oynatma karesinde kesilmez.

Beklenen ses günlükleri:

- Katılmada: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Gerçek zamanlı başlangıçta: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Konuşmacı sesinde: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` ve `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Atlanan bayat konuşmada: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` veya `reason=non-actionable-closing ...`
- Gerçek zamanlı yanıt tamamlandığında: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Oynatma durdurma/sıfırlamada: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Gerçek zamanlı danışmada: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Ajan yanıtında: `discord voice: agent turn answer ...`
- Kuyruğa alınan tam konuşmada: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, ardından `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Araya girme algılamasında: `discord voice: realtime barge-in detected source=speaker-start ...` veya `discord voice: realtime barge-in detected source=active-speaker-audio ...`, ardından `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Gerçek zamanlı kesintide: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, ardından `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` ya da `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Yok sayılan yankı/gürültüde: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Devre dışı araya girmede: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Boşta oynatmada: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Kesilen sesi hata ayıklamak için gerçek zamanlı ses günlüklerini bir zaman çizelgesi olarak okuyun:

1. `realtime audio playback started`, Discord'un asistan sesini oynatmaya başladığı anlamına gelir. Köprü, bu noktadan itibaren asistan çıkış parçalarını, Discord PCM baytlarını, sağlayıcı gerçek zamanlı baytlarını ve sentezlenen ses süresini saymaya başlar.
2. `realtime speaker turn opened`, bir Discord konuşmacısının etkinleştiğini işaretler. Oynatma zaten etkinse ve `bargeIn` etkinleştirilmişse, bunun ardından `barge-in detected source=speaker-start` gelebilir.
3. `realtime input audio started`, o konuşmacı turu için alınan ilk gerçek ses karesini işaretler. Burada `outputActive=true` veya sıfır olmayan bir `outputAudioMs`, asistan oynatması hâlâ etkinken mikrofonun giriş gönderdiği anlamına gelir.
4. `barge-in detected source=active-speaker-audio`, OpenClaw'ın asistan oynatması etkinken canlı konuşmacı sesi gördüğü anlamına gelir. Bu, gerçek bir kesintiyi kullanışlı ses içermeyen bir Discord konuşmacı başlama olayından ayırt etmek için yararlıdır.
5. `barge-in requested reason=...`, OpenClaw'ın gerçek zamanlı sağlayıcıdan etkin yanıtı iptal etmesini veya kırpmasını istediği anlamına gelir. Kesintiden önce ne kadar asistan sesinin gerçekten oynatıldığını görebilmeniz için `outputAudioMs`, `outputActive` ve `playbackChunks` içerir.
6. `realtime audio playback stopped reason=...`, yerel Discord oynatma sıfırlama noktasıdır. Neden, oynatmayı kimin durdurduğunu söyler: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` veya `session-close`.
7. `realtime speaker turn closed`, yakalanan giriş turunu özetler. `chunks=0` veya `hasAudio=false`, konuşmacı turunun açıldığını ancak kullanılabilir sesin gerçek zamanlı köprüye ulaşmadığını gösterir. `interruptedPlayback=true`, o giriş turunun asistan çıkışıyla çakıştığı ve araya girme mantığını tetiklediği anlamına gelir.

Kullanışlı alanlar:

- `outputAudioMs`: günlük satırından önce gerçek zamanlı sağlayıcı tarafından oluşturulan asistan sesi süresi.
- `audioMs`: oynatma durmadan önce OpenClaw'ın saydığı asistan sesi süresi.
- `elapsedMs`: oynatma akışının veya konuşmacı turunun açılıp kapanması arasındaki duvar saati süresi.
- `discordBytes`: Discord sesine gönderilen veya Discord sesinden alınan 48 kHz stereo PCM baytları.
- `realtimeBytes`: gerçek zamanlı sağlayıcıya gönderilen veya sağlayıcıdan alınan sağlayıcı biçimli PCM baytları.
- `playbackChunks`: etkin yanıt için Discord'a iletilen asistan sesi parçaları.
- `sinceLastAudioMs`: son yakalanan konuşmacı ses karesi ile konuşmacı turunun kapanması arasındaki boşluk.

Yaygın desenler:

- `source=active-speaker-audio`, küçük `outputAudioMs` ve yakında aynı kullanıcıyla hemen kesilme, genellikle konuşmacı yankısının mikrofona girdiğini gösterir. `voice.realtime.minBargeInAudioEndMs` değerini yükseltin, hoparlör sesini düşürün, kulaklık kullanın veya `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` ayarlayın.
- `source=speaker-start` ardından `speaker turn closed ... hasAudio=false`, Discord'un bir konuşmacı başlangıcı bildirdiği ancak OpenClaw'a ses ulaşmadığı anlamına gelir. Bu, geçici bir Discord ses olayı, gürültü kapısı davranışı veya istemcinin mikrofonu kısa süreliğine etkinleştirmesi olabilir.
- Yakında bir araya girme veya `provider-clear-audio` olmadan `audio playback stopped reason=stream-close`, yerel Discord oynatma akışının beklenmedik şekilde sona erdiği anlamına gelir. Önceki sağlayıcı ve Discord oynatıcı günlüklerini kontrol edin.
- `capture ignored during playback (barge-in disabled)`, OpenClaw'ın asistan sesi etkinken girişi kasıtlı olarak bıraktığı anlamına gelir. Konuşmanın oynatmayı kesmesini istiyorsanız `voice.realtime.bargeIn` özelliğini etkinleştirin.
- `barge-in ignored ... outputActive=false`, Discord veya sağlayıcı VAD'nin konuşma bildirdiği, ancak OpenClaw'ın kesilecek etkin bir oynatması olmadığı anlamına gelir. Bu sesi kesmemelidir.

Kimlik bilgileri bileşen başına çözümlenir: `voice.model` için LLM rota kimlik doğrulaması, `tools.media.audio` için STT kimlik doğrulaması, `messages.tts`/`voice.tts` için TTS kimlik doğrulaması ve `voice.realtime.providers` ya da sağlayıcının normal kimlik doğrulama yapılandırması için gerçek zamanlı sağlayıcı kimlik doğrulaması.

### Sesli mesajlar

Discord sesli mesajları bir dalga formu önizlemesi gösterir ve OGG/Opus sesi gerektirir. OpenClaw dalga formunu otomatik olarak oluşturur, ancak incelemek ve dönüştürmek için gateway ana makinesinde `ffmpeg` ve `ffprobe` gerekir.

- Bir **yerel dosya yolu** sağlayın (URL'ler reddedilir).
- Metin içeriğini atlayın (Discord aynı yükte metin + sesli mesajı reddeder).
- Herhangi bir ses biçimi kabul edilir; OpenClaw gerektiğinde OGG/Opus biçimine dönüştürür.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - Message Content Intent'i etkinleştirin
    - kullanıcı/üye çözümlemesine bağlı olduğunuzda Server Members Intent'i etkinleştirin
    - intent'leri değiştirdikten sonra gateway'i yeniden başlatın

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - `groupPolicy` değerini doğrulayın
    - `channels.discord.guilds` altındaki guild izin listesini doğrulayın
    - guild `channels` eşlemesi varsa yalnızca listelenen kanallara izin verilir
    - `requireMention` davranışını ve mention desenlerini doğrulayın

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
    - `requireMention` yanlış yerde yapılandırılmıştır (`channels.discord.guilds` veya kanal girdisi altında olmalıdır)
    - gönderen, guild/kanal `users` izin listesi tarafından engellenmiştir

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Tipik günlükler:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway kuyruk ayarları:

    - tek hesap: `channels.discord.eventQueue.listenerTimeout`
    - çoklu hesap: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - bu yalnızca Discord Gateway dinleyici işini denetler, agent turu ömrünü değil

    Discord, kuyruğa alınmış agent turlarına kanal tarafından sahip olunan bir zaman aşımı uygulamaz. Mesaj dinleyicileri hemen devreder ve kuyruğa alınmış Discord çalıştırmaları, oturum/araç/çalışma zamanı yaşam döngüsü tamamlanana veya işi iptal edene kadar oturum başına sıralamayı korur.

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
    OpenClaw bağlanmadan önce Discord `/gateway/bot` metadata'sını alır. Geçici hatalar Discord'un varsayılan Gateway URL'sine geri döner ve günlüklerde hız sınırlıdır.

    Metadata zaman aşımı ayarları:

    - tek hesap: `channels.discord.gatewayInfoTimeoutMs`
    - çoklu hesap: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - yapılandırma ayarlanmamışsa env yedeği: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - varsayılan: `30000` (30 saniye), en fazla: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw, başlatma sırasında ve çalışma zamanı yeniden bağlanmalarından sonra Discord'un Gateway `READY` olayını bekler. Başlatma kademelendirmesi olan çoklu hesap kurulumları, varsayılandan daha uzun bir başlatma READY penceresine ihtiyaç duyabilir.

    READY zaman aşımı ayarları:

    - başlatma tek hesap: `channels.discord.gatewayReadyTimeoutMs`
    - başlatma çoklu hesap: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa başlatma env yedeği: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - başlatma varsayılanı: `15000` (15 saniye), en fazla: `120000`
    - çalışma zamanı tek hesap: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - çalışma zamanı çoklu hesap: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - yapılandırma ayarlanmamışsa çalışma zamanı env yedeği: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - çalışma zamanı varsayılanı: `30000` (30 saniye), en fazla: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    `channels status --probe` izin kontrolleri yalnızca sayısal kanal ID'leri için çalışır.

    Slug anahtarları kullanırsanız çalışma zamanı eşleştirmesi yine de çalışabilir, ancak probe izinleri tam olarak doğrulayamaz.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM devre dışı: `channels.discord.dm.enabled=false`
    - DM ilkesi devre dışı: `channels.discord.dmPolicy="disabled"` (eski: `channels.discord.dm.policy`)
    - `pairing` modunda eşleştirme onayı bekleniyor

  </Accordion>

  <Accordion title="Bot to bot loops">
    Varsayılan olarak bot tarafından yazılan mesajlar yok sayılır.

    `channels.discord.allowBots=true` ayarlarsanız döngü davranışını önlemek için sıkı mention ve izin listesi kuralları kullanın.
    Yalnızca bot'tan bahseden bot mesajlarını kabul etmek için `channels.discord.allowBots="mentions"` tercih edin.

    OpenClaw ayrıca paylaşılan [bot döngü koruması](/tr/channels/bot-loop-protection) ile gelir. `allowBots` bot tarafından yazılan mesajların gönderime ulaşmasına izin verdiğinde, Discord gelen olayı `(account, channel, bot pair)` olgularına eşler ve genel çift koruması, yapılandırılmış olay bütçesini aştıktan sonra çifti bastırır. Koruma, daha önce Discord hız limitleriyle durdurulması gereken kontrolden çıkmış iki botlu döngüleri önler; tek botlu dağıtımları veya bütçenin altında kalan tek seferlik bot yanıtlarını etkilemez.

    Varsayılan ayarlar (`allowBots` ayarlandığında etkin):

    - `maxEventsPerWindow: 20` -- bot çifti kayan pencere içinde 20 mesaj alışverişi yapabilir
    - `windowSeconds: 60` -- kayan pencere uzunluğu
    - `cooldownSeconds: 60` -- bütçe tetiklendiğinde, her iki yöndeki ek her bot-bot mesajı bir dakika boyunca düşürülür

    Paylaşılan varsayılanı bir kez `channels.defaults.botLoopProtection` altında yapılandırın, ardından meşru bir iş akışı daha fazla pay gerektirdiğinde Discord için geçersiz kılın. Öncelik sırası:

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

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - Discord ses alma kurtarma mantığı mevcut olsun diye OpenClaw'ı güncel tutun (`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` değerini doğrulayın (varsayılan)
    - `channels.discord.voice.decryptionFailureTolerance=24` (upstream varsayılanı) ile başlayın ve yalnızca gerekirse ayarlayın
    - günlüklerde şunları izleyin:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - otomatik yeniden katılmadan sonra hatalar devam ederse günlükleri toplayın ve [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) ve [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) içindeki upstream DAVE alma geçmişiyle karşılaştırın

  </Accordion>
</AccordionGroup>

## Yapılandırma referansı

Birincil referans: [Yapılandırma referansı - Discord](/tr/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- başlatma/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- ilke: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- komut: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- olay kuyruğu: `eventQueue.listenerTimeout` (dinleyici bütçesi), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- yanıt/geçmiş: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- teslim: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (eski diğer ad: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- medya/yeniden deneme: `mediaMaxMb` (giden Discord yüklemelerini sınırlar, varsayılan `100MB`), `retry`
- eylemler: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- özellikler: `threadBindings`, üst düzey `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Güvenlik ve operasyonlar

- Bot token'larını sır olarak ele alın (denetimli ortamlarda `DISCORD_BOT_TOKEN` tercih edilir).
- En az ayrıcalıklı Discord izinleri verin.
- Komut dağıtımı/durumu eskiyse Gateway'i yeniden başlatın ve `openclaw channels status --probe` ile yeniden kontrol edin.

## İlgili

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Bir Discord kullanıcısını Gateway ile eşleştirin.
  </Card>
  <Card title="Groups" icon="users" href="/tr/channels/groups">
    Grup sohbeti ve izin listesi davranışı.
  </Card>
  <Card title="Channel routing" icon="route" href="/tr/channels/channel-routing">
    Gelen mesajları agent'lara yönlendirin.
  </Card>
  <Card title="Security" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sağlamlaştırma.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/tr/concepts/multi-agent">
    Guild'leri ve kanalları agent'lara eşleyin.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı.
  </Card>
</CardGroup>
