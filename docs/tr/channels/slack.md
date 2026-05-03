---
read_when:
    - Slack’i kurma veya Slack soket/HTTP modunda hata ayıklama
summary: Slack kurulumu ve çalışma zamanı davranışı (Socket Mode + HTTP İstek URL'leri)
title: Slack
x-i18n:
    generated_at: "2026-05-03T08:54:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85473159dcbd395144e5c37da140164023ac117406ba517d557fcf0989042448
    source_path: channels/slack.md
    workflow: 16
---

Üretime hazır Slack uygulama entegrasyonları üzerinden DM'ler ve kanallar için kullanılabilir. Varsayılan mod Socket Mode'dur; HTTP Request URLs de desteklenir.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Slack DM'leri varsayılan olarak eşleştirme modunu kullanır.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma planları.
  </Card>
</CardGroup>

## Hızlı kurulum

<Tabs>
  <Tab title="Socket Mode (varsayılan)">
    <Steps>
      <Step title="Yeni bir Slack uygulaması oluşturun">
        Slack uygulama ayarlarında **[Create New App](https://api.slack.com/apps/new)** düğmesine basın:

        - **from a manifest** seçeneğini seçin ve uygulamanız için bir çalışma alanı seçin
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

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Yeni bir Slack uygulaması oluşturun">
        Slack uygulama ayarlarında **[Create New App](https://api.slack.com/apps/new)** düğmesine basın:

        - **from a manifest** seçeneğini seçin ve uygulamanız için bir çalışma alanı seçin
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

## Socket Mode aktarım ayarlaması

OpenClaw, Socket Mode için Slack SDK istemci pong zaman aşımını varsayılan olarak 15 saniyeye ayarlar. Aktarım ayarlarını yalnızca çalışma alanına veya ana makineye özgü ayarlama gerektiğinde geçersiz kılın:

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

Bunu yalnızca Slack websocket pong/sunucu ping zaman aşımlarını günlüğe kaydeden veya bilinen olay döngüsü açlığı olan ana makinelerde çalışan Socket Mode çalışma alanları için kullanın. `clientPingTimeout`, SDK istemci ping'i gönderdikten sonraki pong bekleme süresidir; `serverPingTimeout`, Slack sunucu ping'leri için bekleme süresidir. Uygulama mesajları ve olayları aktarım canlılığı sinyalleri değil, uygulama durumudur.

## Manifest ve kapsam kontrol listesi

Temel Slack uygulama manifesti Socket Mode ve HTTP Request URLs için aynıdır. Yalnızca `settings` bloğu (ve slash komutu `url`) farklıdır.

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

**HTTP Request URLs modu** için `settings` değerini HTTP varyantıyla değiştirin ve her slash komutuna `url` ekleyin. Genel URL gereklidir:

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
        /* same as Socket Mode */
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

Yukarıdaki varsayılanları genişleten farklı özellikleri sunun.

Varsayılan manifest, Slack App Home **Home** sekmesini etkinleştirir ve `app_home_opened` için abonelik oluşturur. Bir çalışma alanı üyesi Home sekmesini açtığında OpenClaw, `views.publish` ile güvenli bir varsayılan Home görünümü yayımlar; konuşma yükü veya özel yapılandırma dahil edilmez. **Messages** sekmesi Slack DM'leri için etkin kalır.

<AccordionGroup>
  <Accordion title="İsteğe bağlı yerel slash komutları">

    Birden çok [yerel slash komutu](#commands-and-slash-behavior), nüanslı tek bir yapılandırılmış komut yerine kullanılabilir:

    - `/status` komutu ayrılmış olduğundan `/status` yerine `/agentstatus` kullanın.
    - Aynı anda 25'ten fazla slash komutu kullanıma sunulamaz.

    Mevcut `features.slash_commands` bölümünüzü [kullanılabilir komutların](/tr/tools/slash-commands#command-list) bir alt kümesiyle değiştirin:

    <Tabs>
      <Tab title="Socket Mode (varsayılan)">

```json
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
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">
        Yukarıdaki Socket Mode ile aynı `slash_commands` listesini kullanın ve her girdiye `"url": "https://gateway-host.example.com/slack/events"` ekleyin. Örnek:

```json
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
      // ...repeat for every command with the same `url` value
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="İsteğe bağlı yazarlık kapsamları (yazma işlemleri)">
    Giden mesajların varsayılan Slack uygulama kimliği yerine etkin ajan kimliğini (özel kullanıcı adı ve simge) kullanmasını istiyorsanız `chat:write.customize` bot kapsamını ekleyin.

    Emoji simgesi kullanırsanız Slack `:emoji_name:` sözdizimini bekler.

  </Accordion>
  <Accordion title="İsteğe bağlı kullanıcı token'ı kapsamları (okuma işlemleri)">
    `channels.slack.userToken` yapılandırırsanız, tipik okuma kapsamları şunlardır:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (Slack arama okumalarına bağlıysanız)

  </Accordion>
</AccordionGroup>

## Token modeli

- Socket Mode için `botToken` + `appToken` gereklidir.
- HTTP modu `botToken` + `signingSecret` gerektirir.
- `botToken`, `appToken`, `signingSecret` ve `userToken`, düz metin
  dizelerini veya SecretRef nesnelerini kabul eder.
- Yapılandırma token'ları env yedeğini geçersiz kılar.
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env yedeği yalnızca varsayılan hesap için geçerlidir.
- `userToken` (`xoxp-...`) yalnızca yapılandırma üzerinden verilir (env yedeği yoktur) ve varsayılan olarak salt okunur davranışa ayarlanır (`userTokenReadOnly: true`).

Durum anlık görüntüsü davranışı:

- Slack hesap incelemesi, kimlik bilgisi başına `*Source` ve `*Status`
  alanlarını (`botToken`, `appToken`, `signingSecret`, `userToken`) izler.
- Durum `available`, `configured_unavailable` veya `missing` olur.
- `configured_unavailable`, hesabın SecretRef veya başka bir satır içi olmayan
  gizli kaynak üzerinden yapılandırıldığı, ancak geçerli komut/çalışma zamanı yolunun
  gerçek değeri çözemediği anlamına gelir.
- HTTP modunda `signingSecretStatus` dahil edilir; Socket Mode'da
  gerekli ikili `botTokenStatus` + `appTokenStatus` olur.

<Tip>
Eylemler/dizin okumaları için, yapılandırıldığında kullanıcı token'ı tercih edilebilir. Yazma işlemlerinde bot token'ı tercih edilmeye devam eder; kullanıcı token'ı ile yazmaya yalnızca `userTokenReadOnly: false` olduğunda ve bot token'ı kullanılamadığında izin verilir.
</Tip>

## Eylemler ve kapılar

Slack eylemleri `channels.slack.actions.*` tarafından denetlenir.

Geçerli Slack araçlarında kullanılabilen eylem grupları:

| Grup       | Varsayılan |
| ---------- | ---------- |
| messages   | etkin      |
| reactions  | etkin      |
| pins       | etkin      |
| memberInfo | etkin      |
| emojiList  | etkin      |

Geçerli Slack mesaj eylemleri `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` ve `emoji-list` içerir. `download-file`, gelen dosya yer tutucularında gösterilen Slack dosya kimliklerini kabul eder ve görseller için görsel önizlemeleri, diğer dosya türleri için yerel dosya meta verileri döndürür.

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.slack.dmPolicy` DM erişimini denetler. `channels.slack.allowFrom`, kanonik DM izin listesidir.

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

    - `channels.slack.accounts.default.allowFrom` yalnızca `default` hesabına uygulanır.
    - Adlandırılmış hesaplar, kendi `allowFrom` değerleri ayarlanmamışsa `channels.slack.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.slack.accounts.default.allowFrom` değerini devralmaz.

    Eski `channels.slack.dm.policy` ve `channels.slack.dm.allowFrom` uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` değerlerine geçirir.

    DM'lerde eşleştirme `openclaw pairing approve slack <code>` kullanır.

  </Tab>

  <Tab title="Kanal ilkesi">
    `channels.slack.groupPolicy` kanal işlemeyi denetler:

    - `open`
    - `allowlist`
    - `disabled`

    Kanal izin listesi `channels.slack.channels` altında bulunur ve yapılandırma anahtarları olarak **kararlı Slack kanal kimliklerini** (örneğin `C12345678`) kullanmalıdır.

    Çalışma zamanı notu: `channels.slack` tamamen eksikse (yalnızca env kurulumu), çalışma zamanı `groupPolicy="allowlist"` değerine geri döner ve bir uyarı günlüğe yazar (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

    Ad/kimlik çözümlemesi:

    - kanal izin listesi girdileri ve DM izin listesi girdileri, token erişimi izin verdiğinde başlangıçta çözümlenir
    - çözümlenemeyen kanal adı girdileri yapılandırıldığı gibi tutulur ancak varsayılan olarak yönlendirme için yok sayılır
    - gelen yetkilendirme ve kanal yönlendirme varsayılan olarak önce kimlik kullanır; doğrudan kullanıcı adı/slug eşleşmesi `channels.slack.dangerouslyAllowNameMatching: true` gerektirir

    <Warning>
    Ada dayalı anahtarlar (`#channel-name` veya `channel-name`) `groupPolicy: "allowlist"` altında eşleşmez. Kanal araması varsayılan olarak önce kimlik kullandığı için ada dayalı bir anahtar hiçbir zaman başarıyla yönlendirilmez ve o kanaldaki tüm mesajlar sessizce engellenir. Bu, kanal anahtarının yönlendirme için gerekli olmadığı ve ada dayalı bir anahtarın çalışıyor gibi göründüğü `groupPolicy: "open"` durumundan farklıdır.

    Anahtar olarak her zaman Slack kanal kimliğini kullanın. Bulmak için: Slack içinde kanala sağ tıklayın → **Bağlantıyı kopyala** — kimlik (`C...`) URL'nin sonunda görünür.

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

  <Tab title="Bahsetmeler ve kanal kullanıcıları">
    Kanal mesajları varsayılan olarak bahsetme kapılıdır.

    Bahsetme kaynakları:

    - açık uygulama bahsetmesi (`<@botId>`)
    - bot kullanıcısı ilgili kullanıcı grubunun üyesiyse Slack kullanıcı grubu bahsetmesi (`<!subteam^S...>`); `usergroups:read` gerektirir
    - bahsetme regex kalıpları (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - bota örtük yanıt verilen thread davranışı (`thread.requireExplicitMention` `true` olduğunda devre dışıdır)

    Kanal başına denetimler (`channels.slack.channels.<id>`; adlar yalnızca başlangıç çözümlemesi veya `dangerouslyAllowNameMatching` üzerinden):

    - `requireMention`
    - `users` (izin listesi)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` anahtar biçimi: `id:`, `e164:`, `username:`, `name:` veya `"*"` joker karakteri
      (eski öneksiz anahtarlar hâlâ yalnızca `id:` değerine eşlenir)

    `allowBots`, kanallar ve özel kanallar için muhafazakârdır: bot tarafından yazılmış oda mesajları yalnızca gönderen bot o odanın `users` izin listesinde açıkça listelenmişse veya `channels.slack.allowFrom` içindeki en az bir açık Slack sahip kimliği şu anda oda üyesiyse kabul edilir. Joker karakterler ve görünen ad sahip girdileri sahip varlığı koşulunu karşılamaz. Sahip varlığı Slack `conversations.members` kullanır; uygulamanın oda türü için eşleşen okuma kapsamına sahip olduğundan emin olun (genel kanallar için `channels:read`, özel kanallar için `groups:read`). Üye araması başarısız olursa OpenClaw, bot tarafından yazılmış oda mesajını düşürür.

  </Tab>
</Tabs>

## Thread'ler, oturumlar ve yanıt etiketleri

- DM'ler `direct` olarak; kanallar `channel` olarak; MPIM'ler `group` olarak yönlendirilir.
- Slack rota bağlamaları ham eş kimliklerini ve `channel:C12345678`, `user:U12345678` ve `<@U12345678>` gibi Slack hedef biçimlerini kabul eder.
- Varsayılan `session.dmScope=main` ile Slack DM'leri aracı ana oturumuna daralır.
- Kanal oturumları: `agent:<agentId>:slack:channel:<channelId>`.
- Thread yanıtları, uygulanabildiğinde thread oturum sonekleri (`:thread:<threadTs>`) oluşturabilir.
- `channels.slack.thread.historyScope` varsayılanı `thread`; `thread.inheritParent` varsayılanı `false`.
- `channels.slack.thread.initialHistoryLimit`, yeni bir thread oturumu başladığında kaç mevcut thread mesajının getirileceğini denetler (varsayılan `20`; devre dışı bırakmak için `0` ayarlayın).
- `channels.slack.thread.requireExplicitMention` (varsayılan `false`): `true` olduğunda, bot thread'e zaten katılmış olsa bile botun thread'ler içinde yalnızca açık `@bot` bahsetmelerine yanıt vermesi için örtük thread bahsetmelerini bastırır. Bu olmadan, botun katıldığı bir thread'deki yanıtlar `requireMention` kapısını atlar.

Yanıt thread'i denetimleri:

- `channels.slack.replyToMode`: `off|first|all|batched` (varsayılan `off`)
- `channels.slack.replyToModeByChatType`: `direct|group|channel` başına
- doğrudan sohbetler için eski yedek: `channels.slack.dm.replyToMode`

Manuel yanıt etiketleri desteklenir:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"`, açık `[[reply_to_*]]` etiketleri dahil olmak üzere Slack'te **tüm** yanıt thread'lerini devre dışı bırakır. Bu, açık etiketlerin `"off"` modunda hâlâ dikkate alındığı Telegram'dan farklıdır. Slack thread'leri mesajları kanaldan gizlerken Telegram yanıtları satır içinde görünür kalır.
</Note>

## Onay tepkileri

`ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- aracı kimliği emoji yedeği (`agents.list[].identity.emoji`, aksi takdirde "👀")

Notlar:

- Slack kısa kodlar bekler (örneğin `"eyes"`).
- Slack hesabı veya genel olarak tepkiyi devre dışı bırakmak için `""` kullanın.

## Metin akışı

`channels.slack.streaming` canlı önizleme davranışını denetler:

- `off`: canlı önizleme akışını devre dışı bırakır.
- `partial` (varsayılan): önizleme metnini en son kısmi çıktıyla değiştirir.
- `block`: parçalı önizleme güncellemelerini sona ekler.
- `progress`: oluşturma sırasında ilerleme durumu metnini gösterir, ardından son metni gönderir.
- `streaming.preview.toolProgress`: taslak önizleme etkin olduğunda araç/ilerleme güncellemelerini aynı düzenlenen önizleme mesajına yönlendirir (varsayılan: `true`). Ayrı araç/ilerleme mesajlarını korumak için `false` ayarlayın.

`channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode` `partial` olduğunda Slack yerel metin akışını denetler (varsayılan: `true`).

- Yerel metin akışının ve Slack asistan thread durumunun görünmesi için bir yanıt thread'i kullanılabilir olmalıdır. Thread seçimi hâlâ `replyToMode` değerini izler.
- Kanal, grup sohbeti ve üst düzey DM kökleri, yerel akış kullanılamadığında veya yanıt thread'i olmadığında normal taslak önizlemeyi kullanmaya devam edebilir.
- Üst düzey Slack DM'leri varsayılan olarak thread dışında kalır, bu nedenle Slack'in thread tarzı yerel akış/durum önizlemesini göstermez; OpenClaw bunun yerine DM içinde bir taslak önizleme gönderip düzenler.
- Medya ve metin olmayan yükler normal teslimata geri döner.
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

- `channels.slack.streamMode` (`replace | status_final | append`) otomatik olarak `channels.slack.streaming.mode` değerine geçirilir.
- boolean `channels.slack.streaming` otomatik olarak `channels.slack.streaming.mode` ve `channels.slack.streaming.nativeTransport` değerlerine geçirilir.
- eski `channels.slack.nativeStreaming` otomatik olarak `channels.slack.streaming.nativeTransport` değerine geçirilir.

## Yazıyor tepkisi yedeği

`typingReaction`, OpenClaw bir yanıtı işlerken gelen Slack mesajına geçici bir tepki ekler, ardından çalışma tamamlandığında bunu kaldırır. Bu, varsayılan "yazıyor..." durum göstergesini kullanan thread yanıtları dışında en kullanışlıdır.

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notlar:

- Slack kısa kodlar bekler (örneğin `"hourglass_flowing_sand"`).
- Tepki en iyi çaba esasına göre uygulanır ve yanıt veya hata yolu tamamlandıktan sonra temizlik otomatik olarak denenir.

## Medya, parçalama ve teslimat

<AccordionGroup>
  <Accordion title="Gelen ekler">
    Slack dosya ekleri, Slack tarafından barındırılan özel URL'lerden indirilir (token ile kimliği doğrulanmış istek akışı) ve getirme başarılı olduğunda ve boyut sınırları izin verdiğinde medya deposuna yazılır. Dosya yer tutucuları, aracıların özgün dosyayı `download-file` ile getirebilmesi için Slack `fileId` değerini içerir.

    İndirmeler sınırlı boşta kalma ve toplam zaman aşımları kullanır. Slack dosya alma işlemi takılırsa veya başarısız olursa OpenClaw iletiyi işlemeyi sürdürür ve dosya yer tutucusuna geri döner.

    Çalışma zamanı gelen boyut üst sınırı, `channels.slack.mediaMaxMb` ile geçersiz kılınmadığı sürece varsayılan olarak `20MB` değerindedir.

  </Accordion>

  <Accordion title="Giden metin ve dosyalar">
    - metin parçaları `channels.slack.textChunkLimit` kullanır (varsayılan 4000)
    - `channels.slack.chunkMode="newline"` paragraf öncelikli bölmeyi etkinleştirir
    - dosya gönderimleri Slack yükleme API'lerini kullanır ve konu yanıtları (`thread_ts`) içerebilir
    - giden medya üst sınırı, yapılandırıldığında `channels.slack.mediaMaxMb` değerini izler; aksi halde kanal gönderimleri medya işlem hattından MIME türü varsayılanlarını kullanır

  </Accordion>

  <Accordion title="Teslim hedefleri">
    Tercih edilen açık hedefler:

    - DM'ler için `user:<id>`
    - kanallar için `channel:<id>`

    Yalnızca metin/blok içeren Slack DM'leri doğrudan kullanıcı kimliklerine gönderi yayımlayabilir; dosya yüklemeleri ve konu içi gönderimler önce Slack konuşma API'leri üzerinden DM'yi açar, çünkü bu yollar somut bir konuşma kimliği gerektirir.

  </Accordion>
</AccordionGroup>

## Komutlar ve slash davranışı

Slash komutları Slack içinde tek bir yapılandırılmış komut veya birden çok yerel komut olarak görünür. Komut varsayılanlarını değiştirmek için `channels.slack.slashCommand` yapılandırmasını kullanın:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Yerel komutlar, Slack uygulamanızda [ek manifest ayarları](#additional-manifest-settings) gerektirir ve bunun yerine genel yapılandırmalarda `channels.slack.commands.native: true` veya `commands.native: true` ile etkinleştirilir.

- Slack için yerel komut otomatik modu **kapalıdır**, bu nedenle `commands.native: "auto"` Slack yerel komutlarını etkinleştirmez.

```txt
/help
```

Yerel bağımsız değişken menüleri, seçilen bir seçenek değerini göndermeden önce bir onay modali gösteren uyarlanabilir bir işleme stratejisi kullanır:

- en fazla 5 seçenek: düğme blokları
- 6-100 seçenek: statik seçim menüsü
- 100'den fazla seçenek: etkileşim seçenek işleyicileri kullanılabilir olduğunda eşzamansız seçenek filtrelemeli harici seçim
- Slack sınırları aşıldı: kodlanmış seçenek değerleri düğmelere geri döner

```txt
/think
```

Slash oturumları `agent:<agentId>:slack:slash:<userId>` gibi yalıtılmış anahtarlar kullanır ve komut yürütmelerini yine `CommandTargetSessionKey` kullanarak hedef konuşma oturumuna yönlendirir.

## Etkileşimli yanıtlar

Slack, aracı tarafından yazılmış etkileşimli yanıt kontrollerini işleyebilir, ancak bu özellik varsayılan olarak devre dışıdır.

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

Etkinleştirildiğinde aracılar yalnızca Slack'e özgü yanıt direktifleri yayabilir:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Bu direktifler Slack Block Kit'e derlenir ve tıklamaları veya seçimleri mevcut Slack etkileşim olayı yolu üzerinden geri yönlendirir.

Notlar:

- Bu, Slack'e özgü kullanıcı arayüzüdür. Diğer kanallar Slack Block Kit direktiflerini kendi düğme sistemlerine çevirmez.
- Etkileşimli geri çağırma değerleri, aracı tarafından yazılmış ham değerler değil, OpenClaw tarafından oluşturulan opak token'lardır.
- Oluşturulan etkileşimli bloklar Slack Block Kit sınırlarını aşacaksa OpenClaw geçersiz bir blok yükü göndermek yerine özgün metin yanıtına geri döner.

## Slack'te exec onayları

Slack, Web kullanıcı arayüzüne veya terminale geri dönmek yerine etkileşimli düğmeler ve etkileşimlerle yerel bir onay istemcisi gibi davranabilir.

- Exec onayları, yerel DM/kanal yönlendirmesi için `channels.slack.execApprovals.*` kullanır.
- Plugin onayları, istek zaten Slack'e ulaştığında ve onay kimliği türü `plugin:` olduğunda aynı Slack yerel düğme yüzeyi üzerinden yine çözülebilir.
- Onaylayıcı yetkilendirmesi yine uygulanır: yalnızca onaylayıcı olarak tanımlanan kullanıcılar Slack üzerinden istekleri onaylayabilir veya reddedebilir.

Bu, diğer kanallarla aynı paylaşılan onay düğmesi yüzeyini kullanır. Slack uygulama ayarlarınızda `interactivity` etkinleştirildiğinde, onay istemleri konuşmanın içinde doğrudan Block Kit düğmeleri olarak işlenir.
Bu düğmeler mevcut olduğunda birincil onay UX'i bunlardır; OpenClaw
yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın
tek yol olduğunu söylediğinde manuel bir `/approve` komutu içermelidir.

Yapılandırma yolu:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `agentFilter`, `sessionFilter`

Slack, `enabled` ayarlanmamış veya `"auto"` olduğunda ve en az bir onaylayıcı
çözümlendiğinde yerel exec onaylarını otomatik olarak etkinleştirir. Slack'i yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.
Onaylayıcılar çözümlendiğinde yerel onayları zorla açmak için `enabled: true` ayarlayın.

Açık Slack exec onay yapılandırması olmadan varsayılan davranış:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Açık Slack yerel yapılandırması yalnızca onaylayıcıları geçersiz kılmak, filtre eklemek veya
kaynak sohbet teslimine katılmak istediğinizde gerekir:

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

Paylaşılan `approvals.exec` iletimi ayrıdır. Bunu yalnızca exec onay istemlerinin başka
sohbetlere veya açık bant dışı hedeflere de yönlendirilmesi gerektiğinde kullanın. Paylaşılan `approvals.plugin` iletimi de
ayrıdır; Slack yerel düğmeleri, bu istekler zaten Slack'e ulaştığında Plugin onaylarını yine çözebilir.

Aynı sohbet `/approve`, komutları zaten destekleyen Slack kanallarında ve DM'lerde de çalışır. Tam onay iletimi modeli için [Exec onayları](/tr/tools/exec-approvals) bölümüne bakın.

## Olaylar ve operasyonel davranış

- İleti düzenlemeleri/silmeleri sistem olaylarına eşlenir.
- Konu yayınları ("Also send to channel" konu yanıtları) normal kullanıcı iletileri olarak işlenir.
- Tepki ekleme/kaldırma olayları sistem olaylarına eşlenir.
- Üye katılma/ayrılma, kanal oluşturma/yeniden adlandırma ve sabit ekleme/kaldırma olayları sistem olaylarına eşlenir.
- `channel_id_changed`, `configWrites` etkin olduğunda kanal yapılandırma anahtarlarını taşıyabilir.
- Kanal konu/amaç meta verileri güvenilmeyen bağlam olarak ele alınır ve yönlendirme bağlamına enjekte edilebilir.
- Konu başlatıcı ve ilk konu geçmişi bağlamı tohumlaması, geçerli olduğunda yapılandırılmış gönderen izin listeleriyle filtrelenir.
- Blok eylemleri ve modal etkileşimleri, zengin yük alanlarıyla yapılandırılmış `Slack interaction: ...` sistem olayları yayar:
  - blok eylemleri: seçili değerler, etiketler, seçici değerleri ve `workflow_*` meta verileri
  - yönlendirilmiş kanal meta verileri ve form girdileriyle modal `view_submission` ve `view_closed` olayları

## Yapılandırma başvurusu

Birincil başvuru: [Yapılandırma başvurusu - Slack](/tr/gateway/config-channels#slack).

<Accordion title="Yüksek sinyalli Slack alanları">

- mod/kimlik doğrulama: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM erişimi: `dm.enabled`, `dmPolicy`, `allowFrom` (eski: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- uyumluluk geçişi: `dangerouslyAllowNameMatching` (acil durum; gerekmedikçe kapalı tutun)
- kanal erişimi: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- konu/geçmiş: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- teslim: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- operasyonlar/özellikler: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Sorun giderme

<AccordionGroup>
  <Accordion title="Kanallarda yanıt yok">
    Sırayla kontrol edin:

    - `groupPolicy`
    - kanal izin listesi (`channels.slack.channels`) — **anahtarlar kanal kimlikleri olmalıdır** (`C12345678`), adlar (`#channel-name`) değil. Ad tabanlı anahtarlar `groupPolicy: "allowlist"` altında sessizce başarısız olur, çünkü kanal yönlendirmesi varsayılan olarak kimlik önceliklidir. Kimlik bulmak için: Slack'te kanala sağ tıklayın → **Copy link** — URL'nin sonundaki `C...` değeri kanal kimliğidir.
    - `requireMention`
    - kanal başına `users` izin listesi

    Yararlı komutlar:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM iletileri yok sayılıyor">
    Kontrol edin:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (veya eski `channels.slack.dm.policy`)
    - eşleştirme onayları / izin listesi girdileri
    - Slack Assistant DM olayları: `drop message_changed` ifadesinden söz eden ayrıntılı günlükler
      genellikle Slack'in ileti meta verilerinde kurtarılabilir bir insan gönderen olmadan
      düzenlenmiş bir Assistant konusu olayı gönderdiği anlamına gelir

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket modu bağlanmıyor">
    Slack uygulama ayarlarında bot + uygulama token'larını ve Socket Mode etkinleştirmesini doğrulayın.

    `openclaw channels status --probe --json` çıktısı `botTokenStatus` veya
    `appTokenStatus: "configured_unavailable"` gösteriyorsa Slack hesabı
    yapılandırılmıştır, ancak mevcut çalışma zamanı SecretRef destekli
    değeri çözememiştir.

  </Accordion>

  <Accordion title="HTTP modu olay almıyor">
    Doğrulayın:

    - imzalama sırrı
    - Webhook yolu
    - Slack İstek URL'leri (Olaylar + Etkileşim + Slash Komutları)
    - HTTP hesabı başına benzersiz `webhookPath`

    Hesap anlık görüntülerinde `signingSecretStatus: "configured_unavailable"`
    görünüyorsa HTTP hesabı yapılandırılmıştır, ancak mevcut çalışma zamanı
    SecretRef destekli imzalama sırrını çözememiştir.

  </Accordion>

  <Accordion title="Yerel/slash komutları tetiklenmiyor">
    Hangisini amaçladığınızı doğrulayın:

    - Slack'te kayıtlı eşleşen slash komutlarıyla yerel komut modu (`channels.slack.commands.native: true`)
    - veya tek slash komutu modu (`channels.slack.slashCommand.enabled: true`)

    Ayrıca `commands.useAccessGroups` ile kanal/kullanıcı izin listelerini kontrol edin.

  </Accordion>
</AccordionGroup>

## Ek görüntü başvurusu

Slack dosya indirmeleri başarılı olduğunda ve boyut sınırları izin verdiğinde Slack, indirilen medyayı aracı turuna ekleyebilir. Görüntü dosyaları medya anlama yolundan geçirilebilir veya doğrudan görme yeteneğine sahip bir yanıt modeline verilebilir; diğer dosyalar görüntü girdisi olarak ele alınmak yerine indirilebilir dosya bağlamı olarak tutulur.

### Desteklenen medya türleri

| Medya türü                    | Kaynak                  | Geçerli davranış                                                                                 | Notlar                                                                        |
| ----------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP görüntüleri | Slack dosya URL'si      | İndirilir ve görsel işleme yeteneğine sahip kullanım için tura eklenir                           | Dosya başına sınır: `channels.slack.mediaMaxMb` (varsayılan 20 MB)            |
| PDF dosyaları                 | Slack dosya URL'si      | İndirilir ve `download-file` veya `pdf` gibi araçlar için dosya bağlamı olarak sunulur           | Slack gelen akışı PDF'leri otomatik olarak görüntü-görüş girdisine dönüştürmez |
| Diğer dosyalar                | Slack dosya URL'si      | Mümkün olduğunda indirilir ve dosya bağlamı olarak sunulur                                       | İkili dosyalar görüntü girdisi olarak değerlendirilmez                        |
| Konu yanıtları                | Konu başlatıcı dosyaları | Yanıtta doğrudan medya yoksa kök mesaj dosyaları bağlam olarak doldurulabilir                    | Yalnızca dosya içeren başlatıcılar bir ek yer tutucusu kullanır               |
| Çok görüntülü mesajlar        | Birden fazla Slack dosyası | Her dosya bağımsız olarak değerlendirilir                                                       | Slack işleme, mesaj başına sekiz dosyayla sınırlıdır                          |

### Gelen akış hattı

Dosya ekleri olan bir Slack mesajı geldiğinde:

1. OpenClaw, bot belirtecini (`xoxb-...`) kullanarak dosyayı Slack'in özel URL'sinden indirir.
2. Başarılı olursa dosya medya deposuna yazılır.
3. İndirilen medya yolları ve içerik türleri gelen bağlama eklenir.
4. Görüntü destekli model/araç yolları bu bağlamdaki görüntü eklerini kullanabilir.
5. Görüntü olmayan dosyalar, bunları işleyebilen araçlar için dosya meta verisi veya medya referansı olarak kullanılabilir kalır.

### Konu kökü eki devralma

Bir mesaj bir konu içinde geldiğinde (`thread_ts` üst öğesine sahipse):

- Yanıtın kendisinde doğrudan medya yoksa ve dahil edilen kök mesajda dosyalar varsa, Slack kök dosyaları konu başlatıcı bağlamı olarak doldurabilir.
- Doğrudan yanıt ekleri, kök mesaj eklerine göre önceliklidir.
- Yalnızca dosyaları olan ve metni olmayan bir kök mesaj, yedeğin dosyalarını yine de içerebilmesi için bir ek yer tutucusuyla temsil edilir.

### Çoklu ek işleme

Tek bir Slack mesajı birden fazla dosya eki içerdiğinde:

- Her ek, medya akış hattı üzerinden bağımsız olarak işlenir.
- İndirilen medya referansları mesaj bağlamında birleştirilir.
- İşleme sırası, olay yükündeki Slack dosya sırasını izler.
- Bir ekin indirilmesindeki hata diğerlerini engellemez.

### Boyut, indirme ve model sınırları

- **Boyut sınırı**: Dosya başına varsayılan 20 MB. `channels.slack.mediaMaxMb` üzerinden yapılandırılabilir.
- **İndirme hataları**: Slack'in sunamadığı dosyalar, süresi dolmuş URL'ler, erişilemeyen dosyalar, boyut sınırını aşan dosyalar ve Slack kimlik doğrulama/giriş HTML yanıtları, desteklenmeyen biçimler olarak bildirilmek yerine atlanır.
- **Görüş modeli**: Görüntü analizi, görüşü destekliyorsa etkin yanıt modelini veya `agents.defaults.imageModel` konumunda yapılandırılan görüntü modelini kullanır.

### Bilinen sınırlar

| Senaryo                               | Geçerli davranış                                                                    | Geçici çözüm                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Süresi dolmuş Slack dosya URL'si      | Dosya atlanır; hata gösterilmez                                                     | Dosyayı Slack'e yeniden yükleyin                                             |
| Görüş modeli yapılandırılmamış        | Görüntü ekleri medya referansları olarak depolanır, ancak görüntü olarak analiz edilmez | `agents.defaults.imageModel` yapılandırın veya görüş destekli bir yanıt modeli kullanın |
| Çok büyük görüntüler (varsayılan olarak > 20 MB) | Boyut sınırına göre atlanır                                                         | Slack izin veriyorsa `channels.slack.mediaMaxMb` değerini artırın            |
| İletilen/paylaşılan ekler             | Metin ve Slack üzerinde barındırılan görüntü/dosya medyası en iyi çabayla işlenir   | Doğrudan OpenClaw konusunda yeniden paylaşın                                 |
| PDF ekleri                            | Dosya/medya bağlamı olarak depolanır, otomatik olarak görüntü görüşünden geçirilmez | Dosya meta verisi için `download-file` veya PDF analizi için `pdf` aracını kullanın |

### İlgili belgeler

- [Medya anlama akış hattı](/tr/nodes/media-understanding)
- [PDF aracı](/tr/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack eklerinde görüşü etkinleştirme
- Regresyon testleri: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Canlı doğrulama: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## İlgili

<CardGroup cols={2}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bir Slack kullanıcısını Gateway ile eşleştirin.
  </Card>
  <Card title="Gruplar" icon="users" href="/tr/channels/groups">
    Kanal ve grup DM davranışı.
  </Card>
  <Card title="Kanal yönlendirme" icon="route" href="/tr/channels/channel-routing">
    Gelen mesajları aracılara yönlendirin.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve güçlendirme.
  </Card>
  <Card title="Yapılandırma" icon="sliders" href="/tr/gateway/configuration">
    Yapılandırma düzeni ve önceliği.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Komut kataloğu ve davranışı.
  </Card>
</CardGroup>
