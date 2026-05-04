---
read_when:
    - Slack kurulumu veya Slack socket/HTTP modunda hata ayıklama
summary: Slack kurulumu ve çalışma zamanı davranışı (Socket Modu + HTTP İstek URL'leri)
title: Slack
x-i18n:
    generated_at: "2026-05-04T07:02:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4a91fc1ae5f1e03f714308be54e164ef204809e74efabed8dc75c3035c14228
    source_path: channels/slack.md
    workflow: 16
---

DM'ler ve kanallar için Slack uygulama entegrasyonları aracılığıyla üretime hazır. Varsayılan mod Socket Mode'dur; HTTP Request URL'leri de desteklenir.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Slack DM'leri varsayılan olarak eşleştirme modunu kullanır.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım başucu rehberleri.
  </Card>
</CardGroup>

## Hızlı kurulum

<Tabs>
  <Tab title="Socket Mode (varsayılan)">
    <Steps>
      <Step title="Yeni bir Slack uygulaması oluşturun">
        Slack uygulama ayarlarında **[Create New App](https://api.slack.com/apps/new)** düğmesine basın:

        - **from a manifest** seçeneğini belirleyin ve uygulamanız için bir workspace seçin
        - aşağıdaki [örnek manifesti](#manifest-and-scope-checklist) yapıştırın ve oluşturmaya devam edin
        - `connections:write` ile bir **App-Level Token** (`xapp-...`) oluşturun
        - uygulamayı yükleyin ve gösterilen **Bot Token** (`xoxb-...`) değerini kopyalayın

      </Step>

      <Step title="OpenClaw'u yapılandırın">

        Önerilen SecretRef kurulumu:

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        Env geri dönüşü (yalnızca varsayılan hesap):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Gateway'i başlatın">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URL'leri">
    <Steps>
      <Step title="Yeni bir Slack uygulaması oluşturun">
        Slack uygulama ayarlarında **[Create New App](https://api.slack.com/apps/new)** düğmesine basın:

        - **from a manifest** seçeneğini belirleyin ve uygulamanız için bir workspace seçin
        - [örnek manifesti](#manifest-and-scope-checklist) yapıştırın ve oluşturmadan önce URL'leri güncelleyin
        - istek doğrulaması için **Signing Secret** değerini kaydedin
        - uygulamayı yükleyin ve gösterilen **Bot Token** (`xoxb-...`) değerini kopyalayın

      </Step>

      <Step title="OpenClaw'u yapılandırın">

        Önerilen SecretRef kurulumu:

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        Çok hesaplı HTTP için benzersiz Webhook yolları kullanın

        Kayıtların çakışmaması için her hesaba ayrı bir `webhookPath` (varsayılan `/slack/events`) verin.
        </Note>

      </Step>

      <Step title="Gateway'i başlatın">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Socket Mode taşıma ayarı

OpenClaw, Socket Mode için Slack SDK istemcisi pong zaman aşımını varsayılan olarak 15 saniyeye ayarlar. Taşıma ayarlarını yalnızca workspace'e veya ana makineye özgü ayarlama gerektiğinde geçersiz kılın:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

Bunu yalnızca Slack websocket pong/sunucu ping zaman aşımlarını günlüğe kaydeden veya bilinen event loop açlığı olan ana makinelerde çalışan Socket Mode workspace'leri için kullanın. `clientPingTimeout`, SDK bir istemci ping'i gönderdikten sonra pong bekleme süresidir; `serverPingTimeout`, Slack sunucu ping'leri için bekleme süresidir. Uygulama mesajları ve event'leri, taşıma canlılık sinyalleri değil uygulama durumudur.

## Manifest ve scope kontrol listesi

Temel Slack uygulama manifesti, Socket Mode ve HTTP Request URL'leri için aynıdır. Yalnızca `settings` bloğu (ve slash komutu `url`) farklıdır.

Temel manifest (Socket Mode varsayılanı):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

**HTTP Request URL'leri modu** için `settings` bölümünü HTTP varyantıyla değiştirin ve her slash komutuna `url` ekleyin. Herkese açık URL gereklidir:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### Ek manifest ayarları

Yukarıdaki varsayılanları genişleten farklı özellikleri açığa çıkarın.

Varsayılan manifest, Slack App Home **Home** sekmesini etkinleştirir ve `app_home_opened` event'ine abone olur. Bir workspace üyesi Home sekmesini açtığında OpenClaw, `views.publish` ile güvenli bir varsayılan Home görünümü yayımlar; konuşma payload'u veya özel yapılandırma dahil edilmez. **Messages** sekmesi Slack DM'leri için etkin kalır.

<AccordionGroup>
  <Accordion title="İsteğe bağlı yerel slash komutları">

    Tek bir yapılandırılmış komut yerine, nüanslarla birden fazla [yerel slash komutu](#commands-and-slash-behavior) kullanılabilir:

    - `/status` komutu ayrılmış olduğundan `/status` yerine `/agentstatus` kullanın.
    - Aynı anda en fazla 25 slash komutu kullanılabilir hale getirilebilir.

    Mevcut `features.slash_commands` bölümünüzü [kullanılabilir komutların](/tr/tools/slash-commands#command-list) bir alt kümesiyle değiştirin:

    <Tabs>
      <Tab title="Socket Mode (varsayılan)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Start a new session",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "Reset the current session"
    },
    {
      "command": "/compact",
      "description": "Compact the session context",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "Stop the current run"
    },
    {
      "command": "/session",
      "description": "Manage thread-binding expiry",
      "usage_hint": "idle <duration|off> or max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "Set the thinking level",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Toggle verbose output",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Show or set fast mode",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Toggle reasoning visibility",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Toggle elevated mode",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Show or set exec defaults",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/model",
      "description": "Show or set the model",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "List providers/models",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "Show the short help summary"
    },
    {
      "command": "/commands",
      "description": "Show the generated command catalog"
    },
    {
      "command": "/tools",
      "description": "Show what the current agent can use right now",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Show runtime status, including provider usage/quota when available"
    },
    {
      "command": "/tasks",
      "description": "List active/recent background tasks for the current session"
    },
    {
      "command": "/context",
      "description": "Explain how context is assembled",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Show your sender identity"
    },
    {
      "command": "/skill",
      "description": "Run a skill by name",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Control the usage footer or show cost summary",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP Request URL'leri">
        Yukarıdaki Socket Mode ile aynı `slash_commands` listesini kullanın ve her girdiye `"url": "https://gateway-host.example.com/slack/events"` ekleyin. Örnek:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Start a new session",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Show the short help summary",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        Bu `url` değerini listedeki her komutta tekrarlayın.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="İsteğe bağlı yazarlık kapsamları (yazma işlemleri)">
    Giden iletilerin varsayılan Slack uygulama kimliği yerine etkin aracı kimliğini (özel kullanıcı adı ve simge) kullanmasını istiyorsanız `chat:write.customize` bot kapsamını ekleyin.

    Emoji simgesi kullanıyorsanız Slack `:emoji_name:` söz dizimini bekler.

  </Accordion>
  <Accordion title="İsteğe bağlı kullanıcı belirteci kapsamları (okuma işlemleri)">
    `channels.slack.userToken` yapılandırırsanız tipik okuma kapsamları şunlardır:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (Slack arama okumalarına bağlıysanız)

  </Accordion>
</AccordionGroup>

## Belirteç modeli

- Socket Mode için `botToken` + `appToken` gereklidir.
- HTTP modu `botToken` + `signingSecret` gerektirir.
- `botToken`, `appToken`, `signingSecret` ve `userToken` düz metin
  dizelerini veya SecretRef nesnelerini kabul eder.
- Yapılandırma belirteçleri env yedeğini geçersiz kılar.
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env yedeği yalnızca varsayılan hesap için geçerlidir.
- `userToken` (`xoxp-...`) yalnızca yapılandırma üzerinden kullanılır (env yedeği yoktur) ve varsayılan olarak salt okunur davranışa (`userTokenReadOnly: true`) ayarlanır.

Durum anlık görüntüsü davranışı:

- Slack hesap incelemesi, kimlik bilgisi başına `*Source` ve `*Status`
  alanlarını (`botToken`, `appToken`, `signingSecret`, `userToken`) izler.
- Durum `available`, `configured_unavailable` veya `missing` olur.
- `configured_unavailable`, hesabın SecretRef
  veya başka bir satır içi olmayan gizli kaynak üzerinden yapılandırıldığı, ancak geçerli komut/çalışma zamanı yolunun
  gerçek değeri çözemediği anlamına gelir.
- HTTP modunda `signingSecretStatus` dahil edilir; Socket Mode'da
  gerekli çift `botTokenStatus` + `appTokenStatus` olur.

<Tip>
Eylemler/dizin okumaları için yapılandırıldığında kullanıcı belirteci tercih edilebilir. Yazma işlemleri için bot belirteci tercih edilmeye devam eder; kullanıcı belirteciyle yazmaya yalnızca `userTokenReadOnly: false` olduğunda ve bot belirteci kullanılamadığında izin verilir.
</Tip>

## Eylemler ve kapılar

Slack eylemleri `channels.slack.actions.*` tarafından kontrol edilir.

Geçerli Slack araçlarında kullanılabilen eylem grupları:

| Grup       | Varsayılan |
| ---------- | ---------- |
| messages   | etkin      |
| reactions  | etkin      |
| pins       | etkin      |
| memberInfo | etkin      |
| emojiList  | etkin      |

Geçerli Slack ileti eylemleri `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` ve `emoji-list` içerir. `download-file`, gelen dosya yer tutucularında gösterilen Slack dosya kimliklerini kabul eder ve görüntüler için görüntü önizlemeleri, diğer dosya türleri için yerel dosya meta verileri döndürür.

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.slack.dmPolicy` DM erişimini kontrol eder. `channels.slack.allowFrom` kanonik DM izin listesidir.

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.slack.allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    DM bayrakları:

    - `dm.enabled` (varsayılan true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (eski)
    - `dm.groupEnabled` (grup DM'leri varsayılan olarak false)
    - `dm.groupChannels` (isteğe bağlı MPIM izin listesi)

    Çok hesaplı öncelik:

    - `channels.slack.accounts.default.allowFrom` yalnızca `default` hesabı için geçerlidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` değerleri ayarlanmamışsa `channels.slack.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.slack.accounts.default.allowFrom` değerini devralmaz.

    Eski `channels.slack.dm.policy` ve `channels.slack.dm.allowFrom` uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` değerlerine taşır.

    DM'lerde eşleştirme `openclaw pairing approve slack <code>` kullanır.

  </Tab>

  <Tab title="Kanal ilkesi">
    `channels.slack.groupPolicy` kanal işleyişini kontrol eder:

    - `open`
    - `allowlist`
    - `disabled`

    Kanal izin listesi `channels.slack.channels` altında bulunur ve yapılandırma anahtarları olarak **kararlı Slack kanal kimlikleri** (örneğin `C12345678`) kullanmalıdır.

    Çalışma zamanı notu: `channels.slack` tamamen eksikse (yalnızca env kurulumu), çalışma zamanı `groupPolicy="allowlist"` değerine geri döner ve bir uyarı günlüğe yazar (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

    Ad/kimlik çözümleme:

    - kanal izin listesi girdileri ve DM izin listesi girdileri, belirteç erişimi izin verdiğinde başlangıçta çözümlenir
    - çözümlenemeyen kanal adı girdileri yapılandırıldığı gibi tutulur, ancak varsayılan olarak yönlendirmede yok sayılır
    - gelen yetkilendirme ve kanal yönlendirme varsayılan olarak önce kimlik esaslıdır; doğrudan kullanıcı adı/slug eşleşmesi `channels.slack.dangerouslyAllowNameMatching: true` gerektirir

    <Warning>
    Ada dayalı anahtarlar (`#channel-name` veya `channel-name`) `groupPolicy: "allowlist"` altında eşleşmez. Kanal araması varsayılan olarak önce kimlik esaslıdır, bu yüzden ada dayalı bir anahtar hiçbir zaman başarıyla yönlendirilmez ve o kanaldaki tüm iletiler sessizce engellenir. Bu, kanal anahtarının yönlendirme için gerekli olmadığı ve ada dayalı bir anahtarın çalışıyor gibi göründüğü `groupPolicy: "open"` değerinden farklıdır.

    Anahtar olarak her zaman Slack kanal kimliğini kullanın. Bunu bulmak için: Slack'te kanala sağ tıklayın → **Copy link** — kimlik (`C...`) URL'nin sonunda görünür.

    Doğru:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    Yanlış (`groupPolicy: "allowlist"` altında sessizce engellenir):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Mentions and channel users">
    Kanal mesajları varsayılan olarak bahsetme ile sınırlandırılır.

    Bahsetme kaynakları:

    - açık uygulama bahsi (`<@botId>`)
    - bot kullanıcısı ilgili kullanıcı grubunun üyesiyse Slack kullanıcı grubu bahsi (`<!subteam^S...>`); `usergroups:read` gerektirir
    - bahsetme regex kalıpları (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - örtük bota yanıt verilen iş parçacığı davranışı (`thread.requireExplicitMention` `true` olduğunda devre dışıdır)

    Kanal başına denetimler (`channels.slack.channels.<id>`; adlar yalnızca başlangıç çözümlemesi veya `dangerouslyAllowNameMatching` aracılığıyla):

    - `requireMention`
    - `users` (izin verilenler listesi)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` anahtar biçimi: `id:`, `e164:`, `username:`, `name:` veya `"*"` joker karakteri
      (eski ön eksiz anahtarlar hâlâ yalnızca `id:` ile eşlenir)

    `allowBots`, kanallar ve özel kanallar için ihtiyatlıdır: bot tarafından yazılan oda mesajları yalnızca gönderen bot o odanın `users` izin verilenler listesinde açıkça yer aldığında veya `channels.slack.allowFrom` içinden en az bir açık Slack sahip kimliği şu anda oda üyesi olduğunda kabul edilir. Joker karakterler ve görünen ad sahibi girdileri, sahip varlığı koşulunu karşılamaz. Sahip varlığı Slack `conversations.members` kullanır; uygulamanın oda türü için eşleşen okuma kapsamına sahip olduğundan emin olun (herkese açık kanallar için `channels:read`, özel kanallar için `groups:read`). Üye araması başarısız olursa OpenClaw, bot tarafından yazılan oda mesajını bırakır.

  </Tab>
</Tabs>

## İş parçacıkları, oturumlar ve yanıt etiketleri

- DM'ler `direct` olarak; kanallar `channel` olarak; MPIM'ler `group` olarak yönlendirilir.
- Slack rota bağlamaları ham eş kimliklerini ve `channel:C12345678`, `user:U12345678` ve `<@U12345678>` gibi Slack hedef biçimlerini kabul eder.
- Varsayılan `session.dmScope=main` ile Slack DM'leri ajan ana oturumuna daraltılır.
- Kanal oturumları: `agent:<agentId>:slack:channel:<channelId>`.
- İş parçacığı yanıtları, uygulanabilir olduğunda iş parçacığı oturum sonekleri (`:thread:<threadTs>`) oluşturabilir.
- `channels.slack.thread.historyScope` varsayılanı `thread`; `thread.inheritParent` varsayılanı `false`.
- `channels.slack.thread.initialHistoryLimit`, yeni bir iş parçacığı oturumu başladığında kaç mevcut iş parçacığı mesajının getirileceğini denetler (varsayılan `20`; devre dışı bırakmak için `0` olarak ayarlayın).
- `channels.slack.thread.requireExplicitMention` (varsayılan `false`): `true` olduğunda, örtük iş parçacığı bahislerini bastırır; böylece bot, iş parçacığında daha önce yer almış olsa bile yalnızca iş parçacıkları içindeki açık `@bot` bahislerine yanıt verir. Bu olmadan, botun yer aldığı bir iş parçacığındaki yanıtlar `requireMention` geçidini atlar.

Yanıt iş parçacığı denetimleri:

- `channels.slack.replyToMode`: `off|first|all|batched` (varsayılan `off`)
- `channels.slack.replyToModeByChatType`: `direct|group|channel` başına
- doğrudan sohbetler için eski yedek: `channels.slack.dm.replyToMode`

Manuel yanıt etiketleri desteklenir:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"`, açık `[[reply_to_*]]` etiketleri dahil Slack içindeki **tüm** yanıt iş parçacıklarını devre dışı bırakır. Bu, açık etiketlerin `"off"` modunda da dikkate alındığı Telegram'dan farklıdır. Slack iş parçacıkları mesajları kanaldan gizlerken Telegram yanıtları satır içinde görünür kalır.
</Note>

## Onay tepkileri

`ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- ajan kimliği emoji yedeği (`agents.list[].identity.emoji`, yoksa "👀")

Notlar:

- Slack kısa kodlar bekler (örneğin `"eyes"`).
- Slack hesabı için veya genel olarak tepkiyi devre dışı bırakmak üzere `""` kullanın.

## Metin akışı

`channels.slack.streaming`, canlı önizleme davranışını denetler:

- `off`: canlı önizleme akışını devre dışı bırakır.
- `partial` (varsayılan): önizleme metnini en son kısmi çıktıyla değiştirir.
- `block`: parçalı önizleme güncellemeleri ekler.
- `progress`: oluşturma sırasında ilerleme durum metnini gösterir, ardından son metni gönderir.
- `streaming.preview.toolProgress`: taslak önizleme etkinken araç/ilerleme güncellemelerini aynı düzenlenen önizleme mesajına yönlendirir (varsayılan: `true`). Ayrı araç/ilerleme mesajlarını korumak için `false` olarak ayarlayın.
- `streaming.preview.commandText` / `streaming.progress.commandText`: ham komut/çalıştırma metnini gizlerken kompakt araç ilerleme satırlarını korumak için `status` olarak ayarlayın (varsayılan: `raw`).

Kompakt ilerleme satırlarını korurken ham komut/çalıştırma metnini gizleyin:

```json
{
  "channels": {
    "slack": {
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

`channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode` `partial` olduğunda Slack yerel metin akışını denetler (varsayılan: `true`).

- Yerel metin akışının ve Slack asistan iş parçacığı durumunun görünmesi için bir yanıt iş parçacığı kullanılabilir olmalıdır. İş parçacığı seçimi yine `replyToMode` izler.
- Kanal, grup sohbeti ve üst düzey DM kökleri, yerel akış kullanılamadığında veya yanıt iş parçacığı olmadığında normal taslak önizlemeyi kullanmaya devam edebilir.
- Üst düzey Slack DM'leri varsayılan olarak iş parçacığı dışında kalır; bu nedenle Slack'in iş parçacığı tarzı yerel akış/durum önizlemesini göstermezler; OpenClaw bunun yerine DM içinde bir taslak önizleme gönderir ve düzenler.
- Medya ve metin dışı yükler normal teslimata geri döner.
- Medya/hata sonları bekleyen önizleme düzenlemelerini iptal eder; uygun metin/blok sonları yalnızca önizlemeyi yerinde düzenleyebildiklerinde boşaltılır.
- Akış yanıtın ortasında başarısız olursa OpenClaw kalan yükler için normal teslimata geri döner.

Slack yerel metin akışı yerine taslak önizlemeyi kullanın:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Eski anahtarlar:

- `channels.slack.streamMode` (`replace | status_final | append`) otomatik olarak `channels.slack.streaming.mode` öğesine geçirilir.
- boolean `channels.slack.streaming` otomatik olarak `channels.slack.streaming.mode` ve `channels.slack.streaming.nativeTransport` öğelerine geçirilir.
- eski `channels.slack.nativeStreaming` otomatik olarak `channels.slack.streaming.nativeTransport` öğesine geçirilir.

## Yazma tepkisi yedeği

`typingReaction`, OpenClaw bir yanıtı işlerken gelen Slack iletisine geçici bir tepki ekler, ardından çalışma tamamlandığında bunu kaldırır. Bu, varsayılan bir "is typing..." durum göstergesi kullanan konu yanıtlarının dışında en yararlı haldedir.

Çözüm sırası:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notlar:

- Slack kısa kodlar bekler (örneğin `"hourglass_flowing_sand"`).
- Tepki en iyi çaba esasına dayanır ve yanıt ya da hata yolu tamamlandıktan sonra temizleme otomatik olarak denenir.

## Medya, parçalama ve teslim

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Slack dosya ekleri, Slack tarafından barındırılan özel URL'lerden (token ile kimlik doğrulamalı istek akışı) indirilir ve getirme başarılı olduğunda ve boyut sınırları izin verdiğinde medya deposuna yazılır. Dosya yer tutucuları Slack `fileId` değerini içerir, böylece ajanlar özgün dosyayı `download-file` ile getirebilir.

    İndirmeler sınırlı boşta kalma ve toplam zaman aşımları kullanır. Slack dosya alma işlemi takılırsa veya başarısız olursa OpenClaw iletiyi işlemeye devam eder ve dosya yer tutucusuna geri döner.

    Çalışma zamanı gelen boyut üst sınırı, `channels.slack.mediaMaxMb` ile geçersiz kılınmadığı sürece varsayılan olarak `20MB` değeridir.

  </Accordion>

  <Accordion title="Outbound text and files">
    - metin parçaları `channels.slack.textChunkLimit` değerini kullanır (varsayılan 4000)
    - `channels.slack.chunkMode="newline"` paragraf öncelikli bölmeyi etkinleştirir
    - dosya gönderimleri Slack yükleme API'lerini kullanır ve konu yanıtlarını (`thread_ts`) içerebilir
    - yapılandırıldığında giden medya üst sınırı `channels.slack.mediaMaxMb` değerini izler; aksi halde kanal gönderimleri medya işlem hattından gelen MIME türü varsayılanlarını kullanır

  </Accordion>

  <Accordion title="Delivery targets">
    Tercih edilen açık hedefler:

    - DM'ler için `user:<id>`
    - kanallar için `channel:<id>`

    Yalnızca metin/blok içeren Slack DM'leri doğrudan kullanıcı kimliklerine gönderi yapabilir; dosya yüklemeleri ve konuya bağlı gönderimler önce Slack konuşma API'leri üzerinden DM'yi açar, çünkü bu yollar somut bir konuşma kimliği gerektirir.

  </Accordion>
</AccordionGroup>

## Komutlar ve slash davranışı

Slash komutları Slack'te tek bir yapılandırılmış komut veya birden çok yerel komut olarak görünür. Komut varsayılanlarını değiştirmek için `channels.slack.slashCommand` öğesini yapılandırın:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Yerel komutlar Slack uygulamanızda [ek manifest ayarları](#additional-manifest-settings) gerektirir ve bunun yerine `channels.slack.commands.native: true` veya genel yapılandırmalarda `commands.native: true` ile etkinleştirilir.

- Slack için yerel komut otomatik modu **kapalıdır**, bu yüzden `commands.native: "auto"` Slack yerel komutlarını etkinleştirmez.

```txt
/help
```

Yerel argüman menüleri, seçilen bir seçenek değerini göndermeden önce bir onay modali gösteren uyarlanabilir bir işleme stratejisi kullanır:

- 5 seçeneğe kadar: düğme blokları
- 6-100 seçenek: statik seçim menüsü
- 100'den fazla seçenek: etkileşim seçenek işleyicileri kullanılabilir olduğunda eşzamansız seçenek filtrelemeli harici seçim
- Slack sınırları aşıldı: kodlanmış seçenek değerleri düğmelere geri döner

```txt
/think
```

Slash oturumları `agent:<agentId>:slack:slash:<userId>` gibi yalıtılmış anahtarlar kullanır ve komut yürütmelerini yine `CommandTargetSessionKey` kullanarak hedef konuşma oturumuna yönlendirir.

## Etkileşimli yanıtlar

Slack, ajan tarafından yazılmış etkileşimli yanıt kontrollerini işleyebilir, ancak bu özellik varsayılan olarak devre dışıdır.

Genel olarak etkinleştirin:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Veya yalnızca bir Slack hesabı için etkinleştirin:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Etkinleştirildiğinde ajanlar yalnızca Slack'e yönelik yanıt yönergeleri yayabilir:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Bu yönergeler Slack Block Kit'e derlenir ve tıklamaları veya seçimleri mevcut Slack etkileşim olayı yolu üzerinden geri yönlendirir.

Notlar:

- Bu Slack'e özgü bir UI'dır. Diğer kanallar Slack Block Kit yönergelerini kendi düğme sistemlerine çevirmez.
- Etkileşimli geri çağırma değerleri, ajan tarafından yazılmış ham değerler değil, OpenClaw tarafından üretilmiş opak token'lardır.
- Üretilen etkileşimli bloklar Slack Block Kit sınırlarını aşacaksa OpenClaw geçersiz bir blok yükü göndermek yerine özgün metin yanıtına geri döner.

## Slack'te yürütme onayları

Slack, Web UI veya terminale geri dönmek yerine etkileşimli düğmeler ve etkileşimlerle yerel bir onay istemcisi gibi davranabilir.

- Yürütme onayları yerel DM/kanal yönlendirmesi için `channels.slack.execApprovals.*` kullanır.
- Plugin onayları, istek zaten Slack'e ulaştığında ve onay kimliği türü `plugin:` olduğunda aynı Slack yerel düğme yüzeyi üzerinden çözümlenebilir.
- Onaylayan yetkilendirmesi yine uygulanır: Slack üzerinden istekleri yalnızca onaylayan olarak tanımlanan kullanıcılar onaylayabilir veya reddedebilir.

Bu, diğer kanallarla aynı paylaşılan onay düğmesi yüzeyini kullanır. Slack uygulama ayarlarınızda `interactivity` etkinleştirildiğinde, onay istemleri doğrudan konuşmada Block Kit düğmeleri olarak işlenir.
Bu düğmeler bulunduğunda birincil onay UX'i bunlardır; OpenClaw,
yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun manuel onay olduğunu söylediğinde manuel bir `/approve` komutu içermelidir.

Yapılandırma yolu:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `agentFilter`, `sessionFilter`

Slack, `enabled` ayarlanmamış veya `"auto"` olduğunda ve en az bir
onaylayan çözümlendiğinde yerel yürütme onaylarını otomatik olarak etkinleştirir. Slack'i yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.
Onaylayanlar çözümlendiğinde yerel onayları zorla açmak için `enabled: true` ayarlayın.

Açık Slack yürütme onayı yapılandırması olmadığında varsayılan davranış:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Açık Slack yerel yapılandırması yalnızca onaylayanları geçersiz kılmak, filtre eklemek veya
kaynak sohbet teslimine katılmak istediğinizde gereklidir:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

Paylaşılan `approvals.exec` iletimi ayrıdır. Bunu yalnızca yürütme onayı istemlerinin başka sohbetlere veya açık bant dışı hedeflere de
yönlendirilmesi gerektiğinde kullanın. Paylaşılan `approvals.plugin` iletimi de ayrıdır; Slack yerel düğmeleri, bu istekler zaten Slack'e ulaştığında Plugin onaylarını yine çözümleyebilir.

Aynı sohbet `/approve`, komutları zaten destekleyen Slack kanallarında ve DM'lerinde de çalışır. Tam onay iletme modeli için [Yürütme onayları](/tr/tools/exec-approvals) bölümüne bakın.

## Olaylar ve operasyonel davranış

- İleti düzenlemeleri/silmeleri sistem olaylarına eşlenir.
- Konu yayınları ("Also send to channel" konu yanıtları) normal kullanıcı iletileri olarak işlenir.
- Tepki ekleme/kaldırma olayları sistem olaylarına eşlenir.
- Üye katılma/ayrılma, kanal oluşturma/yeniden adlandırma ve sabit ekleme/kaldırma olayları sistem olaylarına eşlenir.
- `configWrites` etkinleştirildiğinde `channel_id_changed` kanal yapılandırma anahtarlarını taşıyabilir.
- Kanal konu/amaç metaverileri güvenilmeyen bağlam olarak değerlendirilir ve yönlendirme bağlamına enjekte edilebilir.
- Konu başlatıcısı ve ilk konu geçmişi bağlam tohumlaması, uygulanabilir olduğunda yapılandırılmış gönderici izin listelerine göre filtrelenir.
- Blok eylemleri ve modal etkileşimleri, zengin yük alanlarıyla yapılandırılmış `Slack interaction: ...` sistem olayları yayar:
  - blok eylemleri: seçilen değerler, etiketler, seçici değerleri ve `workflow_*` metaverileri
  - yönlendirilmiş kanal metaverileri ve form girdileriyle modal `view_submission` ve `view_closed` olayları

## Yapılandırma başvurusu

Birincil başvuru: [Yapılandırma başvurusu - Slack](/tr/gateway/config-channels#slack).

<Accordion title="High-signal Slack fields">

- mod/kimlik doğrulama: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM erişimi: `dm.enabled`, `dmPolicy`, `allowFrom` (eski: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- uyumluluk anahtarı: `dangerouslyAllowNameMatching` (son çare; gerekmedikçe kapalı tutun)
- kanal erişimi: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- konu/geçmiş: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- teslim: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- operasyon/özellikler: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Sorun giderme

<AccordionGroup>
  <Accordion title="No replies in channels">
    Sırayla kontrol edin:

    - `groupPolicy`
    - kanal izin listesi (`channels.slack.channels`) — **anahtarlar kanal kimlikleri olmalıdır** (`C12345678`), adlar değil (`#channel-name`). Ada dayalı anahtarlar `groupPolicy: "allowlist"` altında sessizce başarısız olur, çünkü kanal yönlendirmesi varsayılan olarak kimlik önceliklidir. Kimlik bulmak için: Slack'te kanala sağ tıklayın → **Copy link** — URL'nin sonundaki `C...` değeri kanal kimliğidir.
    - `requireMention`
    - kanal başına `users` izin listesi

    Yararlı komutlar:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM messages ignored">
    Kontrol edin:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (veya eski `channels.slack.dm.policy`)
    - eşleştirme onayları / izin listesi girdileri
    - Slack Assistant DM olayları: `drop message_changed` ifadesinden bahseden ayrıntılı günlükler
      genellikle Slack'in ileti metaverilerinde kurtarılabilir bir insan gönderici olmadan
      düzenlenmiş bir Assistant konu olayı gönderdiği anlamına gelir

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    Slack uygulama ayarlarında bot + uygulama token'larını ve Socket Mode etkinleştirmesini doğrulayın.

    `openclaw channels status --probe --json` çıktısı `botTokenStatus` veya
    `appTokenStatus: "configured_unavailable"` gösteriyorsa Slack hesabı
    yapılandırılmıştır, ancak geçerli çalışma zamanı SecretRef destekli
    değeri çözümleyememiştir.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    Doğrulayın:

    - imzalama sırrı
    - Webhook yolu
    - Slack Request URL'leri (Olaylar + Etkileşim + Slash Komutları)
    - HTTP hesabı başına benzersiz `webhookPath`

    Hesap anlık görüntülerinde `signingSecretStatus: "configured_unavailable"` görünüyorsa
    HTTP hesabı yapılandırılmıştır, ancak geçerli çalışma zamanı SecretRef destekli imzalama sırrını
    çözümleyememiştir.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    Neyi amaçladığınızı doğrulayın:

    - Slack'te kayıtlı eşleşen slash komutlarıyla yerel komut modu (`channels.slack.commands.native: true`)
    - veya tek slash komut modu (`channels.slack.slashCommand.enabled: true`)

    Ayrıca `commands.useAccessGroups` ve kanal/kullanıcı izin listelerini kontrol edin.

  </Accordion>
</AccordionGroup>

## Ek görsel başvurusu

Slack, Slack dosya indirmeleri başarılı olduğunda ve boyut sınırları izin verdiğinde indirilen medyayı ajan turuna ekleyebilir. Görüntü dosyaları medya anlama yolundan geçirilebilir veya doğrudan görme yeteneğine sahip bir yanıt modeline iletilebilir; diğer dosyalar görüntü girdisi olarak değerlendirilmek yerine indirilebilir dosya bağlamı olarak tutulur.

### Desteklenen medya türleri

| Medya türü                     | Kaynak               | Geçerli davranış                                                                  | Notlar                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP görselleri | Slack dosya URL'si       | İndirilir ve görme yetenekli işleme için turn'e eklenir                   | Dosya başına sınır: `channels.slack.mediaMaxMb` (varsayılan 20 MB)                 |
| PDF dosyaları                      | Slack dosya URL'si       | İndirilir ve `download-file` veya `pdf` gibi araçlar için dosya bağlamı olarak sunulur | Slack gelen verileri, PDF'leri otomatik olarak görsel-görme girdisine dönüştürmez |
| Diğer dosyalar                    | Slack dosya URL'si       | Mümkün olduğunda indirilir ve dosya bağlamı olarak sunulur                              | İkili dosyalar görsel girdisi olarak değerlendirilmez                               |
| Thread yanıtları                 | Thread başlatıcı dosyaları | Yanıtta doğrudan medya olmadığında kök mesaj dosyaları bağlam olarak hydrate edilebilir  | Yalnızca dosya içeren başlatıcılar bir ek yer tutucusu kullanır                          |
| Çok görselli mesajlar           | Birden çok Slack dosyası | Her dosya bağımsız olarak değerlendirilir                                              | Slack işleme, mesaj başına sekiz dosyayla sınırlıdır                     |

### Gelen veri pipeline'ı

Dosya ekleri olan bir Slack mesajı geldiğinde:

1. OpenClaw, bot token'ını (`xoxb-...`) kullanarak dosyayı Slack'in özel URL'sinden indirir.
2. Başarılı olduğunda dosya medya deposuna yazılır.
3. İndirilen medya yolları ve içerik türleri gelen bağlama eklenir.
4. Görsel yetenekli model/araç yolları, bu bağlamdaki görsel eklerini kullanabilir.
5. Görsel olmayan dosyalar, bunları işleyebilen araçlar için dosya metaverisi veya medya referansları olarak kullanılabilir kalır.

### Thread kökü ek devralma

Bir mesaj bir thread içinde geldiğinde (`thread_ts` üst öğesi varsa):

- Yanıtın kendisinde doğrudan medya yoksa ve dahil edilen kök mesajda dosyalar varsa Slack, kök dosyaları thread başlatıcı bağlamı olarak hydrate edebilir.
- Doğrudan yanıt ekleri, kök mesaj eklerine göre önceliklidir.
- Yalnızca dosyaları olan ve metni olmayan bir kök mesaj, fallback'in dosyalarını yine de dahil edebilmesi için bir ek yer tutucusuyla temsil edilir.

### Çoklu ek işleme

Tek bir Slack mesajı birden çok dosya eki içerdiğinde:

- Her ek medya pipeline'ı üzerinden bağımsız olarak işlenir.
- İndirilen medya referansları mesaj bağlamında birleştirilir.
- İşleme sırası, olay yükündeki Slack dosya sırasını izler.
- Bir ekin indirilmesindeki hata diğerlerini engellemez.

### Boyut, indirme ve model sınırları

- **Boyut sınırı**: Dosya başına varsayılan 20 MB. `channels.slack.mediaMaxMb` ile yapılandırılabilir.
- **İndirme hataları**: Slack'in sunamadığı dosyalar, süresi dolmuş URL'ler, erişilemeyen dosyalar, aşırı büyük dosyalar ve Slack kimlik doğrulama/giriş HTML yanıtları, desteklenmeyen biçimler olarak bildirilmek yerine atlanır.
- **Görme modeli**: Görsel analizi, görmeyi desteklediğinde etkin yanıt modelini veya `agents.defaults.imageModel` konumunda yapılandırılan görsel modelini kullanır.

### Bilinen sınırlar

| Senaryo                               | Geçerli davranış                                                             | Geçici çözüm                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Süresi dolmuş Slack dosya URL'si                 | Dosya atlanır; hata gösterilmez                                                 | Dosyayı Slack'te yeniden yükleyin                                                |
| Görme modeli yapılandırılmamış            | Görsel ekleri medya referansları olarak saklanır, ancak görseller olarak analiz edilmez | `agents.defaults.imageModel` yapılandırın veya görme yetenekli bir yanıt modeli kullanın |
| Çok büyük görseller (varsayılan olarak > 20 MB) | Boyut sınırı nedeniyle atlanır                                                         | Slack izin veriyorsa `channels.slack.mediaMaxMb` değerini artırın                       |
| İletilmiş/paylaşılmış ekler           | Metin ve Slack tarafından barındırılan görsel/dosya medyası en iyi çabayla işlenir                       | Doğrudan OpenClaw thread'inde yeniden paylaşın                                   |
| PDF ekleri                        | Dosya/medya bağlamı olarak saklanır, otomatik olarak görsel görmeden geçirilmez  | Dosya metaverisi için `download-file` veya PDF analizi için `pdf` aracını kullanın   |

### İlgili dokümantasyon

- [Medya anlama pipeline'ı](/tr/nodes/media-understanding)
- [PDF aracı](/tr/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack ekleri için görme etkinleştirme
- Regresyon testleri: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Canlı doğrulama: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## İlgili

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Bir Slack kullanıcısını gateway ile eşleştirin.
  </Card>
  <Card title="Groups" icon="users" href="/tr/channels/groups">
    Kanal ve grup DM davranışı.
  </Card>
  <Card title="Channel routing" icon="route" href="/tr/channels/channel-routing">
    Gelen mesajları aracılara yönlendirin.
  </Card>
  <Card title="Security" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sağlamlaştırma.
  </Card>
  <Card title="Configuration" icon="sliders" href="/tr/gateway/configuration">
    Yapılandırma düzeni ve öncelik.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tr/tools/slash-commands">
    Komut kataloğu ve davranışı.
  </Card>
</CardGroup>
