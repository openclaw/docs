---
read_when:
    - Slack’i ayarlama veya Slack soket/HTTP modunda hata ayıklama
summary: Slack kurulumu ve çalışma zamanı davranışı (Soket Modu + HTTP İstek URL’leri)
title: Slack
x-i18n:
    generated_at: "2026-05-06T17:52:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3afcedca5004c18949206eee2b2620d07a02c76ef663bea80f29ec2591f737b
    source_path: channels/slack.md
    workflow: 16
---

Üretime hazır; Slack uygulama entegrasyonları üzerinden DM’ler ve kanallar için kullanılabilir. Varsayılan mod Socket Mode’dur; HTTP Request URL’leri de desteklenir.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Slack DM’leri varsayılan olarak eşleştirme modunu kullanır.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma kitapları.
  </Card>
</CardGroup>

## Socket Mode veya HTTP Request URL’lerini seçme

Her iki aktarım da üretime hazırdır ve mesajlaşma, eğik çizgi komutları, App Home ve etkileşimlilik için özellik denkliğine ulaşır. Özelliklere göre değil, dağıtım şekline göre seçim yapın.

| Konu                         | Socket Mode (varsayılan)                                                                 | HTTP Request URL’leri                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Herkese açık Gateway URL’si  | Gerekli değil                                                                         | Gerekli (DNS, TLS, ters proxy veya tünel)                                                                   |
| Giden ağ                     | `wss-primary.slack.com` adresine giden WSS erişilebilir olmalı                            | Giden WS yok; yalnızca gelen HTTPS                                                                             |
| Gerekli token’lar            | Bot token’ı (`xoxb-...`) + `connections:write` ile App-Level Token (`xapp-...`)       | Bot token’ı (`xoxb-...`) + Signing Secret                                                                        |
| Geliştirme dizüstüsü / güvenlik duvarı arkasında | Olduğu gibi çalışır                                                                          | Herkese açık tünel (ngrok, Cloudflare Tunnel, Tailscale Funnel) veya hazırlık Gateway’i gerekir                          |
| Yatay ölçekleme              | Uygulama başına, host başına bir Socket Mode oturumu; birden çok Gateway ayrı Slack uygulamaları gerektirir | Durumsuz POST işleyicisi; birden çok Gateway replikası, yük dengeleyicinin arkasında tek bir uygulamayı paylaşabilir                     |
| Tek Gateway’de çoklu hesap   | Desteklenir; her hesap kendi WS bağlantısını açar                                             | Desteklenir; kayıtların çakışmaması için her hesabın benzersiz bir `webhookPath` değerine (varsayılan `/slack/events`) ihtiyacı vardır |
| Eğik çizgi komutu aktarımı   | WS bağlantısı üzerinden teslim edilir; `slash_commands[].url` yok sayılır                  | Slack, `slash_commands[].url` adresine POST gönderir; komutun gönderilmesi için alan zorunludur                           |
| İstek imzalama               | Kullanılmaz (kimlik doğrulama App-Level Token’dır)                                               | Slack her isteği imzalar; OpenClaw `signingSecret` ile doğrular                                              |
| Bağlantı kesilince kurtarma  | Slack SDK otomatik olarak yeniden bağlanır; Gateway’in pong zaman aşımı aktarım ayarı uygulanır       | Kesilecek kalıcı bağlantı yoktur; yeniden denemeler Slack tarafından istek başına yapılır                                           |

<Note>
  Tek Gateway host’ları, geliştirme dizüstüleri ve giden `*.slack.com` erişimi olan ancak gelen HTTPS kabul edemeyen şirket içi ağlar için **Socket Mode’u seçin**.

Bir yük dengeleyicinin arkasında birden çok Gateway replikası çalıştırırken, giden WSS engellenmiş ancak gelen HTTPS izinliyken veya Slack Webhook’larını zaten bir ters proxy’de sonlandırıyorsanız **HTTP Request URL’lerini seçin**.
</Note>

## Hızlı kurulum

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        [api.slack.com/apps](https://api.slack.com/apps/new) adresini açın → **Create New App** → **From a manifest** → çalışma alanınızı seçin → aşağıdaki manifestlerden birini yapıştırın → **Next** → **Create**.

        <CodeGroup>

```json Önerilen
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

```json Minimal
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
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
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Önerilen**, paketlenmiş Slack Plugin’inin tam özellik setiyle eşleşir: App Home, eğik çizgi komutları, dosyalar, tepkiler, sabitlemeler, grup DM’leri ve emoji/kullanıcı grubu okumaları. Çalışma alanı ilkesi kapsamları kısıtladığında **Minimal** seçeneğini seçin; DM’leri, kanal/grup geçmişini, bahsetmeleri ve eğik çizgi komutlarını kapsar ancak dosyaları, tepkileri, sabitlemeleri, grup DM (`mpim:*`), `emoji:read` ve `usergroups:read` kapsamlarını çıkarır. Kapsam başına gerekçe ve ek eğik çizgi komutları gibi eklemeli seçenekler için [Manifest ve kapsam kontrol listesi](#manifest-and-scope-checklist) bölümüne bakın.
        </Note>

        Slack uygulamayı oluşturduktan sonra:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: `connections:write` ekleyin, kaydedin, `xapp-...` değerini kopyalayın.
        - **Install App → Install to Workspace**: `xoxb-...` Bot User OAuth Token’ını kopyalayın.

      </Step>

      <Step title="Configure OpenClaw">

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

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        [api.slack.com/apps](https://api.slack.com/apps/new) adresini açın → **Create New App** → **From a manifest** → çalışma alanınızı seçin → aşağıdaki manifestlerden birini yapıştırın → `https://gateway-host.example.com/slack/events` değerini herkese açık Gateway URL’nizle değiştirin → **Next** → **Create**.

        <CodeGroup>

```json Önerilen
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
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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

```json Minimal
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
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im"
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

        </CodeGroup>

        <Note>
          **Önerilen**, paketle birlikte gelen Slack Plugin’inin tam özellik setiyle eşleşir; **Minimal**, kısıtlayıcı çalışma alanları için dosyaları, tepkileri, sabitlenenleri, grup DM (`mpim:*`), `emoji:read` ve `usergroups:read` kapsamlarını çıkarır. Kapsam başına gerekçe için [Manifest ve kapsam kontrol listesi](#manifest-and-scope-checklist) bölümüne bakın.
        </Note>

        <Info>
          Üç URL alanının (`slash_commands[].url`, `event_subscriptions.request_url` ve `interactivity.request_url` / `message_menu_options_url`) tamamı aynı OpenClaw uç noktasını gösterir. Slack’in manifest şeması bunların ayrı adlandırılmasını gerektirir, ancak OpenClaw yük türüne göre yönlendirme yaptığı için tek bir `webhookPath` (varsayılan `/slack/events`) yeterlidir. `slash_commands[].url` olmadan slash komutları HTTP modunda sessizce hiçbir işlem yapmaz.
        </Info>

        Slack uygulamayı oluşturduktan sonra:

        - **Basic Information → App Credentials**: istek doğrulaması için **Signing Secret** değerini kopyalayın.
        - **Install App → Install to Workspace**: `xoxb-...` Bot User OAuth Token değerini kopyalayın.

      </Step>

      <Step title="OpenClaw’u yapılandır">

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

      <Step title="Gateway’i başlat">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Socket Mode aktarım ayarı

OpenClaw, Socket Mode için Slack SDK istemci pong zaman aşımını varsayılan olarak 15 saniyeye ayarlar. Aktarım ayarlarını yalnızca çalışma alanına veya ana makineye özgü ayar gerektiğinde geçersiz kılın:

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

Bunu yalnızca Slack websocket pong/sunucu ping zaman aşımlarını günlüğe yazan veya bilinen event-loop açlığı olan ana makinelerde çalışan Socket Mode çalışma alanları için kullanın. `clientPingTimeout`, SDK bir istemci ping’i gönderdikten sonraki pong bekleme süresidir; `serverPingTimeout`, Slack sunucu ping’leri için bekleme süresidir. Uygulama mesajları ve olayları aktarım canlılığı sinyalleri değil, uygulama durumu olarak kalır.

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

**HTTP Request URLs modu** için `settings` bölümünü HTTP varyantıyla değiştirin ve her slash komutuna `url` ekleyin. Herkese açık URL gereklidir:

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

Yukarıdaki varsayılanları genişleten farklı özellikleri kullanıma sunun.

Varsayılan manifest, Slack App Home **Home** sekmesini etkinleştirir ve `app_home_opened` olayına abone olur. Bir çalışma alanı üyesi Home sekmesini açtığında OpenClaw, `views.publish` ile güvenli bir varsayılan Home görünümü yayımlar; konuşma yükü veya özel yapılandırma dahil edilmez. **Messages** sekmesi Slack DM’leri için etkin kalır.

<AccordionGroup>
  <Accordion title="İsteğe bağlı yerel slash komutları">

    Tek bir yapılandırılmış komut yerine, bazı ayrıntılarla birlikte birden çok [yerel slash komutu](#commands-and-slash-behavior) kullanılabilir:

    - `/status` komutu ayrılmış olduğu için `/status` yerine `/agentstatus` kullanın.
    - Aynı anda en fazla 25 slash komutu kullanılabilir hale getirilebilir.

    Mevcut `features.slash_commands` bölümünüzü [kullanılabilir komutlar](/tr/tools/slash-commands#command-list) alt kümesiyle değiştirin:

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
      <Tab title="HTTP Request URLs">
        Yukarıdaki Socket Mode ile aynı `slash_commands` listesini kullanın ve her girişe `"url": "https://gateway-host.example.com/slack/events"` ekleyin. Örnek:

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
    Giden iletilerin varsayılan Slack uygulama kimliği yerine etkin ajan kimliğini (özel kullanıcı adı ve simge) kullanmasını istiyorsanız `chat:write.customize` bot kapsamını ekleyin.

    Emoji simgesi kullanıyorsanız Slack `:emoji_name:` sözdizimini bekler.

  </Accordion>
  <Accordion title="İsteğe bağlı kullanıcı-token kapsamları (okuma işlemleri)">
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

## Token modeli

- Socket Mode için `botToken` + `appToken` gereklidir.
- HTTP modu `botToken` + `signingSecret` gerektirir.
- `botToken`, `appToken`, `signingSecret` ve `userToken` düz metin
  dizeleri ya da SecretRef nesnelerini kabul eder.
- Yapılandırma tokenları env yedeğini geçersiz kılar.
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env yedeği yalnızca varsayılan hesap için geçerlidir.
- `userToken` (`xoxp-...`) yalnızca yapılandırmayla verilir (env yedeği yoktur) ve varsayılan olarak salt okunur davranışı kullanır (`userTokenReadOnly: true`).

Durum anlık görüntüsü davranışı:

- Slack hesap incelemesi, kimlik bilgisi başına `*Source` ve `*Status`
  alanlarını (`botToken`, `appToken`, `signingSecret`, `userToken`) izler.
- Durum `available`, `configured_unavailable` veya `missing` olur.
- `configured_unavailable`, hesabın SecretRef veya başka bir satır içi olmayan gizli kaynak
  üzerinden yapılandırıldığı, ancak geçerli komut/çalışma zamanı yolunun
  gerçek değeri çözemediği anlamına gelir.
- HTTP modunda `signingSecretStatus` dahil edilir; Socket Mode içinde
  gerekli çift `botTokenStatus` + `appTokenStatus` değerleridir.

<Tip>
Eylemler/dizin okumaları için, yapılandırıldığında kullanıcı tokenı tercih edilebilir. Yazmalar için bot tokenı tercih edilmeye devam eder; kullanıcı-token yazmalarına yalnızca `userTokenReadOnly: false` olduğunda ve bot tokenı kullanılamadığında izin verilir.
</Tip>

## Eylemler ve geçitler

Slack eylemleri `channels.slack.actions.*` ile denetlenir.

Geçerli Slack araçlarında kullanılabilir eylem grupları:

| Grup       | Varsayılan |
| ---------- | ---------- |
| messages   | etkin      |
| reactions  | etkin      |
| pins       | etkin      |
| memberInfo | etkin      |
| emojiList  | etkin      |

Geçerli Slack ileti eylemleri `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` ve `emoji-list` içerir. `download-file`, gelen dosya yer tutucularında gösterilen Slack dosya kimliklerini kabul eder ve görüntüler için görüntü önizlemeleri ya da diğer dosya türleri için yerel dosya meta verileri döndürür.

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.slack.dmPolicy` DM erişimini denetler. `channels.slack.allowFrom` kanonik DM izin listesidir.

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.slack.allowFrom` öğesinin `"*"` içermesini gerektirir)
    - `disabled`

    DM bayrakları:

    - `dm.enabled` (varsayılan true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (eski)
    - `dm.groupEnabled` (grup DM’leri varsayılan olarak false)
    - `dm.groupChannels` (isteğe bağlı MPIM izin listesi)

    Çok hesaplı öncelik:

    - `channels.slack.accounts.default.allowFrom` yalnızca `default` hesabına uygulanır.
    - Adlandırılmış hesaplar, kendi `allowFrom` değerleri ayarlanmamışsa `channels.slack.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.slack.accounts.default.allowFrom` değerini devralmaz.

    Eski `channels.slack.dm.policy` ve `channels.slack.dm.allowFrom` uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` değerlerine taşır.

    DM’lerde eşleştirme `openclaw pairing approve slack <code>` kullanır.

  </Tab>

  <Tab title="Kanal ilkesi">
    `channels.slack.groupPolicy` kanal işlemeyi denetler:

    - `open`
    - `allowlist`
    - `disabled`

    Kanal izin listesi `channels.slack.channels` altında bulunur ve yapılandırma anahtarları olarak **kararlı Slack kanal kimlikleri** (örneğin `C12345678`) kullanmalıdır.

    Çalışma zamanı notu: `channels.slack` tamamen eksikse (yalnızca env kurulumu), çalışma zamanı `groupPolicy="allowlist"` değerine geri döner ve bir uyarı günlüğe yazar (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

    Ad/kimlik çözümleme:

    - kanal izin listesi girdileri ve DM izin listesi girdileri, token erişimi izin verdiğinde başlangıçta çözümlenir
    - çözümlenemeyen kanal-adı girdileri yapılandırıldığı gibi tutulur ancak varsayılan olarak yönlendirme için yok sayılır
    - gelen yetkilendirme ve kanal yönlendirme varsayılan olarak önce kimlik temellidir; doğrudan kullanıcı adı/slug eşleştirmesi `channels.slack.dangerouslyAllowNameMatching: true` gerektirir

    <Warning>
    Ada dayalı anahtarlar (`#channel-name` veya `channel-name`) `groupPolicy: "allowlist"` altında eşleşmez. Kanal araması varsayılan olarak önce kimlik temellidir, bu nedenle ada dayalı bir anahtar hiçbir zaman başarıyla yönlendirilmez ve o kanaldaki tüm iletiler sessizce engellenir. Bu, kanal anahtarının yönlendirme için gerekli olmadığı ve ada dayalı bir anahtarın çalışıyor gibi göründüğü `groupPolicy: "open"` durumundan farklıdır.

    Anahtar olarak her zaman Slack kanal kimliğini kullanın. Bulmak için: Slack içinde kanala sağ tıklayın → **Copy link** — kimlik (`C...`) URL’nin sonunda görünür.

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
    Kanal iletileri varsayılan olarak bahsetme geçidine tabidir.

    Bahsetme kaynakları:

    - açık uygulama bahsetmesi (`<@botId>`)
    - bot kullanıcısı ilgili kullanıcı grubunun üyesiyse Slack kullanıcı-grubu bahsetmesi (`<!subteam^S...>`); `usergroups:read` gerektirir
    - bahsetme regex desenleri (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - bota yanıt verilen iş parçacığı davranışı (örtük) (`thread.requireExplicitMention` `true` olduğunda devre dışı)

    Kanal başına denetimler (`channels.slack.channels.<id>`; adlar yalnızca başlangıç çözümlemesi veya `dangerouslyAllowNameMatching` üzerinden):

    - `requireMention`
    - `users` (izin listesi)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` anahtar biçimi: `id:`, `e164:`, `username:`, `name:` veya `"*"` joker karakteri
      (eski ön eksiz anahtarlar hâlâ yalnızca `id:` öğesine eşlenir)

    `allowBots`, kanallar ve özel kanallar için muhafazakârdır: bot tarafından yazılan oda iletileri yalnızca gönderen bot o odanın `users` izin listesinde açıkça listelendiğinde veya `channels.slack.allowFrom` içindeki en az bir açık Slack sahip kimliği şu anda oda üyesi olduğunda kabul edilir. Joker karakterler ve görünen ada dayalı sahip girdileri sahip varlığını sağlamaz. Sahip varlığı Slack `conversations.members` kullanır; uygulamanın oda türü için eşleşen okuma kapsamına sahip olduğundan emin olun (genel kanallar için `channels:read`, özel kanallar için `groups:read`). Üye araması başarısız olursa OpenClaw, bot tarafından yazılan oda iletisini düşürür.

  </Tab>
</Tabs>

## İş parçacıkları, oturumlar ve yanıt etiketleri

- DM’ler `direct` olarak; kanallar `channel` olarak; MPIM’ler `group` olarak yönlendirilir.
- Slack rota bağlamaları ham eş kimliklerini ve `channel:C12345678`, `user:U12345678` ve `<@U12345678>` gibi Slack hedef biçimlerini kabul eder.
- Varsayılan `session.dmScope=main` ile Slack DM’leri ajan ana oturumunda birleşir.
- Kanal oturumları: `agent:<agentId>:slack:channel:<channelId>`.
- İş parçacığı yanıtları, uygulanabilir olduğunda iş parçacığı oturum sonekleri (`:thread:<threadTs>`) oluşturabilir.
- `channels.slack.thread.historyScope` varsayılanı `thread`; `thread.inheritParent` varsayılanı `false` olur.
- `channels.slack.thread.initialHistoryLimit`, yeni bir iş parçacığı oturumu başladığında kaç mevcut iş parçacığı iletisinin getirileceğini denetler (varsayılan `20`; devre dışı bırakmak için `0` ayarlayın).
- `channels.slack.thread.requireExplicitMention` (varsayılan `false`): `true` olduğunda örtük iş parçacığı bahsetmelerini bastırır, böylece bot iş parçacığında zaten yer almış olsa bile yalnızca iş parçacıkları içindeki açık `@bot` bahsetmelerine yanıt verir. Bu olmadan, botun yer aldığı bir iş parçacığındaki yanıtlar `requireMention` geçidini atlar.

Yanıt iş parçacığı denetimleri:

- `channels.slack.replyToMode`: `off|first|all|batched` (varsayılan `off`)
- `channels.slack.replyToModeByChatType`: `direct|group|channel` başına
- doğrudan sohbetler için eski yedek: `channels.slack.dm.replyToMode`

El ile yanıt etiketleri desteklenir:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"`, açık `[[reply_to_*]]` etiketleri dahil Slack içindeki **tüm** yanıt iş parçacıklarını devre dışı bırakır. Bu, açık etiketlerin `"off"` modunda hâlâ dikkate alındığı Telegram’dan farklıdır. Slack iş parçacıkları iletileri kanaldan gizlerken Telegram yanıtları satır içinde görünür kalır.
</Note>

## Onay tepkileri

`ackReaction`, OpenClaw gelen bir iletiyi işlerken bir onay emojisi gönderir.

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- ajan kimliği emoji yedeği (`agents.list[].identity.emoji`, yoksa "👀")

Notlar:

- Slack kısa kodlar bekler (örneğin `"eyes"`).
- Slack hesabı veya genel olarak tepkiyi devre dışı bırakmak için `""` kullanın.

## Metin akışı

`channels.slack.streaming` canlı önizleme davranışını denetler:

- `off`: canlı önizleme akışını devre dışı bırakır.
- `partial` (varsayılan): önizleme metnini en son kısmi çıktı ile değiştirir.
- `block`: parçalı önizleme güncellemeleri ekler.
- `progress`: üretim sırasında ilerleme durumu metnini gösterir, ardından son metni gönderir.
- `streaming.preview.toolProgress`: taslak önizleme etkin olduğunda araç/ilerleme güncellemelerini aynı düzenlenen önizleme iletisine yönlendirir (varsayılan: `true`). Ayrı araç/ilerleme iletileri tutmak için `false` olarak ayarlayın.
- `streaming.preview.commandText` / `streaming.progress.commandText`: ham komut/exec metnini gizlerken kompakt araç-ilerleme satırlarını korumak için `status` olarak ayarlayın (varsayılan: `raw`).

Ham komut/exec metnini gizlerken kompakt ilerleme satırlarını koruyun:

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

- Yerel metin akışının ve Slack asistan iş parçacığı durumunun görünmesi için bir yanıt iş parçacığı kullanılabilir olmalıdır. İş parçacığı seçimi yine de `replyToMode` izler.
- Kanal, grup sohbeti ve üst düzey DM kökleri, yerel akış kullanılamadığında veya yanıt iş parçacığı olmadığında normal taslak önizlemeyi hâlâ kullanabilir.
- Üst düzey Slack DM’leri varsayılan olarak iş parçacığı dışında kalır, bu yüzden Slack’in iş parçacığı tarzı yerel akış/durum önizlemesini göstermez; OpenClaw bunun yerine DM içinde bir taslak önizleme gönderir ve düzenler.
- Medya ve metin dışı yükler normal teslimata geri döner.
- Medya/hata sonları bekleyen önizleme düzenlemelerini iptal eder; uygun metin/blok sonları yalnızca önizlemeyi yerinde düzenleyebildiğinde boşaltılır.
- Akış yanıtın ortasında başarısız olursa OpenClaw, kalan yükler için normal teslimata geri döner.

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

- `channels.slack.streamMode` (`replace | status_final | append`), `channels.slack.streaming.mode` için eski bir çalışma zamanı takma adıdır.
- boolean `channels.slack.streaming`, `channels.slack.streaming.mode` ve `channels.slack.streaming.nativeTransport` için eski bir çalışma zamanı takma adıdır.
- eski `channels.slack.nativeStreaming`, `channels.slack.streaming.nativeTransport` için bir çalışma zamanı takma adıdır.
- Kalıcı Slack akış yapılandırmasını kanonik anahtarlara yeniden yazmak için `openclaw doctor --fix` çalıştırın.

## Yazıyor tepkisi yedek davranışı

`typingReaction`, OpenClaw bir yanıtı işlerken gelen Slack mesajına geçici bir tepki ekler, ardından çalışma tamamlandığında bunu kaldırır. Bu, varsayılan bir "yazıyor..." durum göstergesi kullanan konu yanıtları dışında en kullanışlıdır.

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notlar:

- Slack kısa kodlar bekler (örneğin `"hourglass_flowing_sand"`).
- Tepki en iyi çabayla uygulanır ve yanıt ya da hata yolu tamamlandıktan sonra temizlik otomatik olarak denenir.

## Medya, parçalama ve teslim

<AccordionGroup>
  <Accordion title="Gelen ekler">
    Slack dosya ekleri, Slack tarafından barındırılan özel URL'lerden indirilir (token ile kimliği doğrulanmış istek akışı) ve getirme başarılı olduğunda ve boyut sınırları izin verdiğinde medya deposuna yazılır. Dosya yer tutucuları Slack `fileId` değerini içerir; böylece aracılar özgün dosyayı `download-file` ile getirebilir.

    İndirmeler sınırlı boşta kalma ve toplam zaman aşımları kullanır. Slack dosya alma işlemi takılırsa veya başarısız olursa OpenClaw mesajı işlemeye devam eder ve dosya yer tutucusuna geri döner.

    Çalışma zamanı gelen boyut üst sınırı, `channels.slack.mediaMaxMb` ile geçersiz kılınmadığı sürece varsayılan olarak `20MB` değerindedir.

  </Accordion>

  <Accordion title="Giden metin ve dosyalar">
    - metin parçaları `channels.slack.textChunkLimit` kullanır (varsayılan 4000)
    - `channels.slack.chunkMode="newline"` paragraf öncelikli bölmeyi etkinleştirir
    - dosya gönderimleri Slack yükleme API'lerini kullanır ve konu yanıtlarını (`thread_ts`) içerebilir
    - giden medya üst sınırı yapılandırıldığında `channels.slack.mediaMaxMb` değerini izler; aksi takdirde kanal gönderimleri medya işlem hattındaki MIME türü varsayılanlarını kullanır

  </Accordion>

  <Accordion title="Teslim hedefleri">
    Tercih edilen açık hedefler:

    - DM'ler için `user:<id>`
    - kanallar için `channel:<id>`

    Yalnızca metin/blok Slack DM'leri doğrudan kullanıcı ID'lerine gönderi yapabilir; dosya yüklemeleri ve konu içinde gönderimler önce Slack conversation API'leri üzerinden DM'i açar, çünkü bu yollar somut bir konuşma ID'si gerektirir.

  </Accordion>
</AccordionGroup>

## Komutlar ve slash davranışı

Slash komutları Slack içinde tek bir yapılandırılmış komut veya birden çok yerel komut olarak görünür. Komut varsayılanlarını değiştirmek için `channels.slack.slashCommand` yapılandırın:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Yerel komutlar Slack uygulamanızda [ek manifest ayarları](#additional-manifest-settings) gerektirir ve bunun yerine genel yapılandırmalarda `channels.slack.commands.native: true` veya `commands.native: true` ile etkinleştirilir.

- Yerel komut otomatik modu Slack için **kapalıdır**, bu nedenle `commands.native: "auto"` Slack yerel komutlarını etkinleştirmez.

```txt
/help
```

Yerel argüman menüleri, seçilen bir seçenek değerini göndermeden önce bir onay modalı gösteren uyarlanabilir bir işleme stratejisi kullanır:

- en fazla 5 seçenek: düğme blokları
- 6-100 seçenek: statik seçim menüsü
- 100'den fazla seçenek: etkileşim seçenek işleyicileri kullanılabilir olduğunda asenkron seçenek filtrelemeli harici seçim
- Slack sınırları aşıldı: kodlanmış seçenek değerleri düğmelere geri döner

```txt
/think
```

Slash oturumları `agent:<agentId>:slack:slash:<userId>` gibi yalıtılmış anahtarlar kullanır ve komut yürütmelerini `CommandTargetSessionKey` kullanarak hedef konuşma oturumuna yönlendirmeye devam eder.

## Etkileşimli yanıtlar

Slack, aracı tarafından yazılmış etkileşimli yanıt denetimlerini işleyebilir, ancak bu özellik varsayılan olarak devre dışıdır.

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

Etkinleştirildiğinde, aracılar yalnızca Slack'e özgü yanıt yönergeleri yayabilir:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Bu yönergeler Slack Block Kit'e derlenir ve tıklamaları veya seçimleri mevcut Slack etkileşim olayı yolu üzerinden geri yönlendirir.

Notlar:

- Bu Slack'e özgü bir kullanıcı arayüzüdür. Diğer kanallar Slack Block Kit yönergelerini kendi düğme sistemlerine çevirmez.
- Etkileşimli callback değerleri, aracı tarafından yazılmış ham değerler değil, OpenClaw tarafından oluşturulan opak token'lardır.
- Oluşturulan etkileşimli bloklar Slack Block Kit sınırlarını aşacaksa OpenClaw geçersiz bir blok payload'ı göndermek yerine özgün metin yanıtına geri döner.

## Slack içinde Exec onayları

Slack, Web kullanıcı arayüzüne veya terminale geri dönmek yerine etkileşimli düğmeler ve etkileşimlerle yerel bir onay istemcisi gibi davranabilir.

- Exec onayları, yerel DM/kanal yönlendirmesi için `channels.slack.execApprovals.*` kullanır.
- Plugin onayları, istek zaten Slack'e düştüğünde ve onay id türü `plugin:` olduğunda aynı Slack yerel düğme yüzeyi üzerinden hâlâ çözümlenebilir.
- Onaylayan yetkilendirmesi yine uygulanır: yalnızca onaylayan olarak tanımlanan kullanıcılar Slack üzerinden istekleri onaylayabilir veya reddedebilir.

Bu, diğer kanallarla aynı paylaşılan onay düğmesi yüzeyini kullanır. Slack uygulama ayarlarınızda `interactivity` etkinleştirildiğinde, onay istemleri doğrudan konuşmada Block Kit düğmeleri olarak işlenir.
Bu düğmeler bulunduğunda birincil onay kullanıcı deneyimi onlardır; OpenClaw
yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun manuel
onay olduğunu söylediğinde manuel bir `/approve` komutu eklemelidir.

Yapılandırma yolu:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `agentFilter`, `sessionFilter`

Slack, `enabled` ayarlanmamış veya `"auto"` olduğunda ve en az bir
onaylayan çözümlendiğinde yerel Exec onaylarını otomatik olarak etkinleştirir. Slack'i yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.
Onaylayanlar çözümlendiğinde yerel onayları zorla açmak için `enabled: true` ayarlayın.

Açık Slack Exec onay yapılandırması olmadan varsayılan davranış:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Açık Slack yerel yapılandırması yalnızca onaylayanları geçersiz kılmak, filtre eklemek veya
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

Paylaşılan `approvals.exec` iletimi ayrıdır. Bunu yalnızca Exec onay istemlerinin başka sohbetlere
veya açık bant dışı hedeflere de yönlendirilmesi gerektiğinde kullanın. Paylaşılan `approvals.plugin` iletimi de
ayrıdır; Slack yerel düğmeleri, bu istekler zaten Slack'e düştüğünde Plugin onaylarını hâlâ çözümler.

Aynı sohbet `/approve`, komutları zaten destekleyen Slack kanallarında ve DM'lerinde de çalışır. Tam onay iletimi modeli için [Exec onayları](/tr/tools/exec-approvals) bölümüne bakın.

## Olaylar ve operasyonel davranış

- Mesaj düzenlemeleri/silmeleri sistem olaylarına eşlenir.
- Konu yayınları ("Kanala da gönder" konu yanıtları) normal kullanıcı mesajları olarak işlenir.
- Tepki ekleme/kaldırma olayları sistem olaylarına eşlenir.
- Üye katılma/ayrılma, kanal oluşturulma/yeniden adlandırılma ve pin ekleme/kaldırma olayları sistem olaylarına eşlenir.
- `channel_id_changed`, `configWrites` etkinleştirildiğinde kanal yapılandırma anahtarlarını taşıyabilir.
- Kanal konu/amaç meta verileri güvenilmeyen bağlam olarak ele alınır ve yönlendirme bağlamına enjekte edilebilir.
- Konu başlatıcısı ve ilk konu geçmişi bağlam tohumlaması, uygulanabilir olduğunda yapılandırılmış gönderici izin listeleriyle filtrelenir.
- Blok eylemleri ve modal etkileşimleri, zengin payload alanlarıyla yapılandırılmış `Slack interaction: ...` sistem olayları yayar:
  - blok eylemleri: seçilen değerler, etiketler, seçici değerleri ve `workflow_*` meta verileri
  - yönlendirilmiş kanal meta verileri ve form girdileriyle modal `view_submission` ve `view_closed` olayları

## Yapılandırma referansı

Birincil referans: [Yapılandırma referansı - Slack](/tr/gateway/config-channels#slack).

<Accordion title="Yüksek sinyalli Slack alanları">

- mod/kimlik doğrulama: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM erişimi: `dm.enabled`, `dmPolicy`, `allowFrom` (eski: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- uyumluluk anahtarı: `dangerouslyAllowNameMatching` (son çare; gerekmedikçe kapalı tutun)
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
    - kanal izin listesi (`channels.slack.channels`) — **anahtarlar kanal ID'leri olmalıdır** (`C12345678`), adlar (`#channel-name`) değil. Ad tabanlı anahtarlar `groupPolicy: "allowlist"` altında sessizce başarısız olur, çünkü kanal yönlendirmesi varsayılan olarak ID önceliklidir. Bir ID bulmak için: Slack'te kanala sağ tıklayın → **Bağlantıyı kopyala** — URL'nin sonundaki `C...` değeri kanal ID'sidir.
    - `requireMention`
    - kanal başına `users` izin listesi

    Kullanışlı komutlar:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM mesajları yok sayılıyor">
    Kontrol edin:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (veya eski `channels.slack.dm.policy`)
    - eşleştirme onayları / izin listesi girdileri
    - Slack Assistant DM olayları: `drop message_changed` ifadesini belirten ayrıntılı günlükler
      genellikle Slack'in mesaj meta verilerinde kurtarılabilir bir insan gönderici olmadan
      düzenlenmiş bir Assistant-thread olayı gönderdiği anlamına gelir

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode bağlanmıyor">
    Slack uygulama ayarlarında bot + uygulama token'larını ve Socket Mode etkinleştirmesini doğrulayın.

    `openclaw channels status --probe --json` çıktısı `botTokenStatus` veya
    `appTokenStatus: "configured_unavailable"` gösteriyorsa Slack hesabı
    yapılandırılmıştır, ancak geçerli çalışma zamanı SecretRef destekli
    değeri çözememiştir.

  </Accordion>

  <Accordion title="HTTP modu olay almıyor">
    Doğrulayın:

    - imzalama sırrı
    - Webhook yolu
    - Slack İstek URL'leri (Events + Interactivity + Slash Commands)
    - HTTP hesabı başına benzersiz `webhookPath`

    Hesap anlık görüntülerinde `signingSecretStatus: "configured_unavailable"`
    görünüyorsa HTTP hesabı yapılandırılmıştır, ancak geçerli çalışma zamanı
    SecretRef destekli imzalama sırrını çözememiştir.

  </Accordion>

  <Accordion title="Yerel/slash komutları çalışmıyor">
    Neyi amaçladığınızı doğrulayın:

    - Slack'te kayıtlı eşleşen slash komutlarıyla yerel komut modu (`channels.slack.commands.native: true`)
    - veya tek slash komutu modu (`channels.slack.slashCommand.enabled: true`)

    Ayrıca `commands.useAccessGroups` ve kanal/kullanıcı izin listelerini kontrol edin.

  </Accordion>
</AccordionGroup>

## Ek görsel referansı

Slack, Slack dosya indirmeleri başarılı olduğunda ve boyut sınırları izin verdiğinde indirilen medyayı ajan turuna ekleyebilir. Görüntü dosyaları medya anlama yolundan geçirilebilir veya doğrudan görsel yetenekli bir yanıt modeline aktarılabilir; diğer dosyalar, görüntü girdisi olarak ele alınmak yerine indirilebilir dosya bağlamı olarak tutulur.

### Desteklenen medya türleri

| Medya türü                     | Kaynak               | Geçerli davranış                                                                  | Notlar                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP görüntüleri | Slack dosya URL'si       | Görsel yetenekli işleme için indirilir ve tura eklenir                   | Dosya başına sınır: `channels.slack.mediaMaxMb` (varsayılan 20 MB)                 |
| PDF dosyaları                      | Slack dosya URL'si       | İndirilir ve `download-file` veya `pdf` gibi araçlar için dosya bağlamı olarak sunulur | Slack gelen akışı PDF'leri otomatik olarak görüntü-görsel girdisine dönüştürmez |
| Diğer dosyalar                    | Slack dosya URL'si       | Mümkün olduğunda indirilir ve dosya bağlamı olarak sunulur                              | İkili dosyalar görüntü girdisi olarak ele alınmaz                               |
| Konu yanıtları                 | Konu başlatıcı dosyaları | Yanıtta doğrudan medya yoksa kök mesaj dosyaları bağlam olarak yüklenebilir  | Yalnızca dosya içeren başlatıcılar bir ek yer tutucusu kullanır                          |
| Çok görüntülü mesajlar           | Birden çok Slack dosyası | Her dosya bağımsız olarak değerlendirilir                                              | Slack işleme, mesaj başına sekiz dosyayla sınırlıdır                     |

### Gelen işlem hattı

Dosya ekleri olan bir Slack mesajı geldiğinde:

1. OpenClaw, bot belirtecini (`xoxb-...`) kullanarak dosyayı Slack'in özel URL'sinden indirir.
2. Başarı durumunda dosya medya deposuna yazılır.
3. İndirilen medya yolları ve içerik türleri gelen bağlama eklenir.
4. Görüntü yetenekli model/araç yolları bu bağlamdaki görüntü eklerini kullanabilir.
5. Görüntü olmayan dosyalar, bunları işleyebilen araçlar için dosya meta verisi veya medya referansları olarak kullanılabilir kalır.

### Konu kökü eki devralma

Bir mesaj bir konu içinde geldiğinde (`thread_ts` üst öğesi olduğunda):

- Yanıtın kendisinde doğrudan medya yoksa ve dahil edilen kök mesajda dosyalar varsa, Slack kök dosyaları konu başlatıcı bağlamı olarak yükleyebilir.
- Doğrudan yanıt ekleri, kök mesaj eklerine göre önceliklidir.
- Yalnızca dosyaları olan ve metni olmayan bir kök mesaj, geri dönüşün dosyalarını yine de içerebilmesi için bir ek yer tutucusuyla temsil edilir.

### Çoklu ek işleme

Tek bir Slack mesajı birden çok dosya eki içerdiğinde:

- Her ek, medya işlem hattından bağımsız olarak geçirilir.
- İndirilen medya referansları mesaj bağlamında toplanır.
- İşleme sırası, olay yükündeki Slack dosya sırasını izler.
- Bir ekin indirilmesindeki hata diğerlerini engellemez.

### Boyut, indirme ve model sınırları

- **Boyut sınırı**: Dosya başına varsayılan 20 MB. `channels.slack.mediaMaxMb` üzerinden yapılandırılabilir.
- **İndirme hataları**: Slack'in sunamadığı dosyalar, süresi dolmuş URL'ler, erişilemeyen dosyalar, aşırı büyük dosyalar ve Slack kimlik doğrulama/oturum açma HTML yanıtları, desteklenmeyen biçimler olarak bildirilmek yerine atlanır.
- **Görsel modeli**: Görüntü analizi, görseli desteklediğinde etkin yanıt modelini veya `agents.defaults.imageModel` konumunda yapılandırılan görüntü modelini kullanır.

### Bilinen sınırlar

| Senaryo                               | Geçerli davranış                                                             | Geçici çözüm                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Süresi dolmuş Slack dosya URL'si                 | Dosya atlanır; hata gösterilmez                                                 | Dosyayı Slack'e yeniden yükleyin                                                |
| Görsel modeli yapılandırılmamış            | Görüntü ekleri medya referansları olarak depolanır, ancak görüntü olarak analiz edilmez | `agents.defaults.imageModel` yapılandırın veya görsel yetenekli bir yanıt modeli kullanın |
| Çok büyük görüntüler (varsayılan olarak > 20 MB) | Boyut sınırı nedeniyle atlanır                                                         | Slack izin veriyorsa `channels.slack.mediaMaxMb` değerini artırın                       |
| İletilen/paylaşılan ekler           | Metin ve Slack'te barındırılan görüntü/dosya medyası en iyi çabayla işlenir                       | Doğrudan OpenClaw konusunda yeniden paylaşın                                   |
| PDF ekleri                        | Dosya/medya bağlamı olarak depolanır, otomatik olarak görüntü görselinden geçirilmez  | Dosya meta verileri için `download-file` veya PDF analizi için `pdf` aracını kullanın   |

### İlgili belgeler

- [Medya anlama işlem hattı](/tr/nodes/media-understanding)
- [PDF aracı](/tr/tools/pdf)
- Epik: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack eklerinde görsel etkinleştirme
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
    Gelen mesajları ajanlara yönlendirin.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve güçlendirme.
  </Card>
  <Card title="Yapılandırma" icon="sliders" href="/tr/gateway/configuration">
    Yapılandırma düzeni ve öncelik sırası.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Komut kataloğu ve davranışı.
  </Card>
</CardGroup>
