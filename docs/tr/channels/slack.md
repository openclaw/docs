---
read_when:
    - Slack'i kurma veya Slack soket/HTTP modunda hata ayıklama
summary: Slack kurulumu ve çalışma zamanı davranışı (Soket Modu + HTTP İstek URL’leri)
title: Slack
x-i18n:
    generated_at: "2026-05-05T01:44:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a8e1cbfd3d99bfc24d79b56ee762d1ab399402391b241ff40698249b0828008
    source_path: channels/slack.md
    workflow: 16
---

Slack app entegrasyonları aracılığıyla DM'ler ve kanallar için production-ready. Varsayılan mod Socket Mode'dur; HTTP Request URL'leri de desteklenir.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Slack DM'leri varsayılan olarak eşleştirme modunu kullanır.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım playbook'ları.
  </Card>
</CardGroup>

## Socket Mode veya HTTP Request URL'leri seçme

Her iki aktarım da production-ready durumdadır ve mesajlaşma, slash komutları, App Home ve etkileşim için özellik eşitliğine ulaşır. Özelliklere göre değil, dağıtım şekline göre seçin.

| Konu                         | Socket Mode (varsayılan)                                                              | HTTP Request URL'leri                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Genel Gateway URL'si         | Gerekli değil                                                                         | Gerekli (DNS, TLS, ters proxy veya tünel)                                                                        |
| Giden ağ                     | `wss-primary.slack.com` adresine giden WSS erişilebilir olmalıdır                     | Giden WS yok; yalnızca gelen HTTPS                                                                               |
| Gerekli token'lar            | Bot token'ı (`xoxb-...`) + `connections:write` ile App-Level Token (`xapp-...`)       | Bot token'ı (`xoxb-...`) + Signing Secret                                                                        |
| Geliştirici dizüstüsü / güvenlik duvarı arkasında | Olduğu gibi çalışır                                                                    | Genel bir tünel (ngrok, Cloudflare Tunnel, Tailscale Funnel) veya staging Gateway gerekir                        |
| Yatay ölçekleme              | Uygulama başına host başına bir Socket Mode oturumu; birden fazla Gateway için ayrı Slack app'leri gerekir | Durumsuz POST işleyicisi; birden fazla Gateway replikası, bir yük dengeleyicinin arkasında tek bir app'i paylaşabilir |
| Tek Gateway üzerinde çoklu hesap | Desteklenir; her hesap kendi WS bağlantısını açar                                    | Desteklenir; kayıtların çakışmaması için her hesabın benzersiz bir `webhookPath` değerine (varsayılan `/slack/events`) ihtiyacı vardır |
| Slash komutu aktarımı        | WS bağlantısı üzerinden teslim edilir; `slash_commands[].url` yok sayılır             | Slack, `slash_commands[].url` adresine POST gönderir; komutun dağıtılması için alan gereklidir                   |
| İstek imzalama               | Kullanılmaz (kimlik doğrulama App-Level Token'dır)                                   | Slack her isteği imzalar; OpenClaw `signingSecret` ile doğrular                                                  |
| Bağlantı kopmasında kurtarma | Slack SDK otomatik olarak yeniden bağlanır; gateway'in pong-timeout aktarım ayarı uygulanır | Kopacak kalıcı bağlantı yoktur; yeniden denemeler Slack tarafından istek başına yapılır                          |

<Note>
  Tek Gateway host'ları, geliştirici dizüstüleri ve `*.slack.com` adresine giden bağlantı kurabilen ancak gelen HTTPS kabul edemeyen şirket içi ağlar için **Socket Mode seçin**.

Bir yük dengeleyicinin arkasında birden fazla Gateway replikası çalıştırırken, giden WSS engellenip gelen HTTPS'e izin verildiğinde veya Slack webhook'larını zaten bir ters proxy'de sonlandırıyorsanız **HTTP Request URL'lerini seçin**.
</Note>

## Hızlı kurulum

<Tabs>
  <Tab title="Socket Mode (varsayılan)">
    <Steps>
      <Step title="Yeni bir Slack app oluşturun">
        [api.slack.com/apps](https://api.slack.com/apps/new) sayfasını açın → **Create New App** → **From a manifest** → workspace'inizi seçin → aşağıdaki manifest'lerden birini yapıştırın → **Next** → **Create**.

        <CodeGroup>

```json Recommended
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
          **Recommended**, paketle gelen Slack plugin'inin tam özellik kümesiyle eşleşir: App Home, slash komutları, dosyalar, tepkiler, pin'ler, grup DM'leri ve emoji/usergroup okumaları. Workspace politikası kapsamları kısıtlıyorsa **Minimal** seçin; DM'leri, kanal/grup geçmişini, mention'ları ve slash komutlarını kapsar ancak dosyaları, tepkileri, pin'leri, grup-DM (`mpim:*`), `emoji:read` ve `usergroups:read` kapsamlarını çıkarır. Kapsam başına gerekçe ve ek slash komutları gibi ek seçenekler için [Manifest ve kapsam kontrol listesi](#manifest-and-scope-checklist) bölümüne bakın.
        </Note>

        Slack app'i oluşturduktan sonra:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: `connections:write` ekleyin, kaydedin, `xapp-...` değerini kopyalayın.
        - **Install App → Install to Workspace**: `xoxb-...` Bot User OAuth Token değerini kopyalayın.

      </Step>

      <Step title="OpenClaw'ı yapılandırın">

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

        Env fallback (yalnızca varsayılan hesap):

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
      <Step title="Yeni bir Slack app oluşturun">
        [api.slack.com/apps](https://api.slack.com/apps/new) sayfasını açın → **Create New App** → **From a manifest** → workspace'inizi seçin → aşağıdaki manifest'lerden birini yapıştırın → `https://gateway-host.example.com/slack/events` değerini genel Gateway URL'nizle değiştirin → **Next** → **Create**.

        <CodeGroup>

```json Recommended
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
          **Önerilen**, paketle birlikte gelen Slack Plugin'inin tam özellik setiyle eşleşir; **Minimal**, kısıtlayıcı çalışma alanları için dosyaları, tepkileri, sabitlemeleri, grup DM'lerini (`mpim:*`), `emoji:read` ve `usergroups:read` kapsamlarını çıkarır. Kapsam başına gerekçe için [Manifest ve kapsam denetim listesi](#manifest-and-scope-checklist) bölümüne bakın.
        </Note>

        <Info>
          Üç URL alanının (`slash_commands[].url`, `event_subscriptions.request_url` ve `interactivity.request_url` / `message_menu_options_url`) tümü aynı OpenClaw uç noktasını gösterir. Slack'in manifest şeması bunların ayrı adlandırılmasını gerektirir, ancak OpenClaw yük türüne göre yönlendirme yaptığı için tek bir `webhookPath` (varsayılan `/slack/events`) yeterlidir. `slash_commands[].url` olmadan slash komutları HTTP modunda sessizce no-op olur.
        </Info>

        Slack uygulamayı oluşturduktan sonra:

        - **Temel Bilgiler → Uygulama Kimlik Bilgileri**: istek doğrulaması için **İmzalama Gizli Anahtarı** değerini kopyalayın.
        - **Uygulamayı Yükle → Çalışma Alanına Yükle**: `xoxb-...` Bot Kullanıcısı OAuth Belirteci'ni kopyalayın.

      </Step>

      <Step title="OpenClaw'ı yapılandırın">

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

## Socket Mode aktarım ayarı

OpenClaw, Socket Mode için Slack SDK istemcisi pong zaman aşımını varsayılan olarak 15 saniyeye ayarlar. Aktarım ayarlarını yalnızca çalışma alanına veya ana makineye özel ayar gerektiğinde geçersiz kılın:

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

Bunu yalnızca Slack websocket pong/sunucu ping zaman aşımlarını günlüğe kaydeden veya bilinen event-loop açlığı olan ana makinelerde çalışan Socket Mode çalışma alanları için kullanın. `clientPingTimeout`, SDK bir istemci pingi gönderdikten sonraki pong bekleme süresidir; `serverPingTimeout`, Slack sunucu pingleri için bekleme süresidir. Uygulama mesajları ve olayları aktarım canlılık sinyalleri değil, uygulama durumudur.

## Manifest ve kapsam denetim listesi

Temel Slack uygulama manifesti, Socket Mode ve HTTP Request URLs için aynıdır. Yalnızca `settings` bloğu (ve slash komutu `url`) farklıdır.

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

Yukarıdaki varsayılanları genişleten farklı özellikleri gösterir.

Varsayılan manifest, Slack App Home **Home** sekmesini etkinleştirir ve `app_home_opened` olayına abone olur. Bir çalışma alanı üyesi Home sekmesini açtığında OpenClaw, `views.publish` ile güvenli bir varsayılan Home görünümü yayımlar; konuşma yükü veya özel yapılandırma dahil edilmez. **Messages** sekmesi Slack DM'leri için etkin kalır.

<AccordionGroup>
  <Accordion title="İsteğe bağlı yerel slash komutları">

    Tek bir yapılandırılmış komut yerine, belirli nüanslarla birden fazla [yerel slash komutu](#commands-and-slash-behavior) kullanılabilir:

    - `/status` komutu ayrılmış olduğundan `/status` yerine `/agentstatus` kullanın.
    - Aynı anda en fazla 25 slash komutu kullanılabilir hale getirilebilir.

    Mevcut `features.slash_commands` bölümünüzü [kullanılabilir komutlar](/tr/tools/slash-commands#command-list) listesinin bir alt kümesiyle değiştirin:

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
    Giden mesajların varsayılan Slack uygulama kimliği yerine etkin ajan kimliğini (özel kullanıcı adı ve simge) kullanmasını istiyorsanız `chat:write.customize` bot kapsamını ekleyin.

    Bir emoji simgesi kullanıyorsanız Slack `:emoji_name:` söz dizimini bekler.

  </Accordion>
  <Accordion title="İsteğe bağlı kullanıcı token kapsamları (okuma işlemleri)">
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
  dizelerini veya SecretRef nesnelerini kabul eder.
- Yapılandırma tokenları env yedeğini geçersiz kılar.
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env yedeği yalnızca varsayılan hesap için geçerlidir.
- `userToken` (`xoxp-...`) yalnızca yapılandırma üzerinden kullanılır (env yedeği yoktur) ve varsayılan olarak salt okunur davranışa (`userTokenReadOnly: true`) ayarlıdır.

Durum anlık görüntüsü davranışı:

- Slack hesap incelemesi, kimlik bilgisi başına `*Source` ve `*Status`
  alanlarını (`botToken`, `appToken`, `signingSecret`, `userToken`) izler.
- Durum `available`, `configured_unavailable` veya `missing` olur.
- `configured_unavailable`, hesabın SecretRef veya başka bir satır içi olmayan
  gizli kaynak üzerinden yapılandırıldığı, ancak geçerli komut/çalışma zamanı
  yolunun gerçek değeri çözemediği anlamına gelir.
- HTTP modunda `signingSecretStatus` dahil edilir; Socket Mode'da gerekli
  ikili `botTokenStatus` + `appTokenStatus` olur.

<Tip>
Eylemler/dizin okumaları için, yapılandırıldığında kullanıcı tokenı tercih edilebilir. Yazma işlemlerinde bot tokenı tercih edilmeye devam eder; kullanıcı tokenı ile yazmaya yalnızca `userTokenReadOnly: false` olduğunda ve bot tokenı kullanılamadığında izin verilir.
</Tip>

## Eylemler ve geçitler

Slack eylemleri `channels.slack.actions.*` tarafından denetlenir.

Geçerli Slack araçlarında kullanılabilen eylem grupları:

| Grup       | Varsayılan |
| ---------- | ---------- |
| messages   | etkin      |
| reactions  | etkin      |
| pins       | etkin      |
| memberInfo | etkin      |
| emojiList  | etkin      |

Geçerli Slack mesaj eylemleri arasında `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` ve `emoji-list` bulunur. `download-file`, gelen dosya yer tutucularında gösterilen Slack dosya ID'lerini kabul eder ve görüntüler için görüntü önizlemeleri, diğer dosya türleri için yerel dosya meta verileri döndürür.

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.slack.dmPolicy` DM erişimini denetler. `channels.slack.allowFrom` standart DM izin listesidir.

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.slack.allowFrom` içinde `"*"` bulunmasını gerektirir)
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

    Eski `channels.slack.dm.policy` ve `channels.slack.dm.allowFrom` uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` değerlerine taşır.

    DM'lerde eşleştirme `openclaw pairing approve slack <code>` kullanır.

  </Tab>

  <Tab title="Kanal ilkesi">
    `channels.slack.groupPolicy` kanal işlemeyi denetler:

    - `open`
    - `allowlist`
    - `disabled`

    Kanal izin listesi `channels.slack.channels` altında bulunur ve yapılandırma anahtarları olarak **kararlı Slack kanal ID'leri** (örneğin `C12345678`) kullanmalıdır.

    Çalışma zamanı notu: `channels.slack` tamamen eksikse (yalnızca env ile kurulum), çalışma zamanı `groupPolicy="allowlist"` değerine geri döner ve bir uyarı günlüğe yazar (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

    Ad/ID çözümlemesi:

    - kanal izin listesi girdileri ve DM izin listesi girdileri, token erişimi izin verdiğinde başlangıçta çözülür
    - çözülemeyen kanal adı girdileri yapılandırıldığı gibi tutulur, ancak varsayılan olarak yönlendirme için yok sayılır
    - gelen yetkilendirme ve kanal yönlendirmesi varsayılan olarak önce ID kullanır; doğrudan kullanıcı adı/slug eşleştirmesi `channels.slack.dangerouslyAllowNameMatching: true` gerektirir

    <Warning>
    Ada dayalı anahtarlar (`#channel-name` veya `channel-name`) `groupPolicy: "allowlist"` altında eşleşmez. Kanal araması varsayılan olarak önce ID kullanır; bu nedenle ada dayalı bir anahtar hiçbir zaman başarıyla yönlendirilmez ve o kanaldaki tüm mesajlar sessizce engellenir. Bu, kanal anahtarının yönlendirme için gerekmediği ve ada dayalı bir anahtarın çalışıyor gibi göründüğü `groupPolicy: "open"` değerinden farklıdır.

    Anahtar olarak her zaman Slack kanal ID'sini kullanın. Bulmak için: Slack içinde kanala sağ tıklayın → **Copy link** — ID (`C...`) URL'nin sonunda görünür.

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

    - açık uygulama bahsetmesi (`<@botId>`)
    - bot kullanıcısı ilgili kullanıcı grubunun üyesi olduğunda Slack kullanıcı grubu bahsetmesi (`<!subteam^S...>`); `usergroups:read` gerektirir
    - bahsetme regex desenleri (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - örtük bota yanıt iş parçacığı davranışı (`thread.requireExplicitMention` `true` olduğunda devre dışıdır)

    Kanal başına kontroller (`channels.slack.channels.<id>`; adlar yalnızca başlangıç çözümlemesi veya `dangerouslyAllowNameMatching` üzerinden):

    - `requireMention`
    - `users` (izin listesi)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` anahtar biçimi: `id:`, `e164:`, `username:`, `name:` veya `"*"` joker karakteri
      (eski öneksiz anahtarlar hâlâ yalnızca `id:` ile eşlenir)

    `allowBots`, kanallar ve özel kanallar için korumacıdır: bot tarafından yazılan oda mesajları yalnızca gönderen bot o odanın `users` izin listesinde açıkça listelenmişse veya `channels.slack.allowFrom` içindeki en az bir açık Slack sahip kimliği o anda oda üyesiyse kabul edilir. Joker karakterler ve görünen ad sahip girdileri, sahip varlığı koşulunu karşılamaz. Sahip varlığı Slack `conversations.members` kullanır; uygulamanın oda türü için eşleşen okuma kapsamına sahip olduğundan emin olun (genel kanallar için `channels:read`, özel kanallar için `groups:read`). Üye araması başarısız olursa OpenClaw, bot tarafından yazılan oda mesajını düşürür.

  </Tab>
</Tabs>

## İş parçacıkları, oturumlar ve yanıt etiketleri

- DM'ler `direct` olarak; kanallar `channel` olarak; MPIM'ler `group` olarak yönlendirilir.
- Slack rota bağlamaları ham eş kimliklerini ve `channel:C12345678`, `user:U12345678` ve `<@U12345678>` gibi Slack hedef biçimlerini kabul eder.
- Varsayılan `session.dmScope=main` ile Slack DM'leri temsilcinin ana oturumunda birleşir.
- Kanal oturumları: `agent:<agentId>:slack:channel:<channelId>`.
- İş parçacığı yanıtları, uygulanabilir olduğunda iş parçacığı oturum sonekleri (`:thread:<threadTs>`) oluşturabilir.
- `channels.slack.thread.historyScope` varsayılanı `thread`; `thread.inheritParent` varsayılanı `false`.
- `channels.slack.thread.initialHistoryLimit`, yeni bir iş parçacığı oturumu başladığında kaç mevcut iş parçacığı mesajının getirileceğini kontrol eder (varsayılan `20`; devre dışı bırakmak için `0` ayarlayın).
- `channels.slack.thread.requireExplicitMention` (varsayılan `false`): `true` olduğunda, bot iş parçacığına zaten katılmış olsa bile botun iş parçacıkları içinde yalnızca açık `@bot` bahsetmelerine yanıt vermesi için örtük iş parçacığı bahsetmelerini bastırır. Bu olmadan, botun katıldığı bir iş parçacığındaki yanıtlar `requireMention` kapısını atlar.

Yanıt iş parçacığı kontrolleri:

- `channels.slack.replyToMode`: `off|first|all|batched` (varsayılan `off`)
- `channels.slack.replyToModeByChatType`: `direct|group|channel` başına
- doğrudan sohbetler için eski yedek: `channels.slack.dm.replyToMode`

El ile yanıt etiketleri desteklenir:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"`, açık `[[reply_to_*]]` etiketleri dahil Slack içinde **tüm** yanıt iş parçacıklarını devre dışı bırakır. Bu, açık etiketlerin `"off"` modunda hâlâ dikkate alındığı Telegram'dan farklıdır. Slack iş parçacıkları mesajları kanaldan gizlerken Telegram yanıtları satır içinde görünür kalır.
</Note>

## Onay tepkileri

`ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- temsilci kimliği emoji yedeği (`agents.list[].identity.emoji`, yoksa "👀")

Notlar:

- Slack kısa kodlar bekler (örneğin `"eyes"`).
- Slack hesabı için veya genel olarak tepkiyi devre dışı bırakmak üzere `""` kullanın.

## Metin akışı

`channels.slack.streaming`, canlı önizleme davranışını kontrol eder:

- `off`: canlı önizleme akışını devre dışı bırak.
- `partial` (varsayılan): önizleme metnini en son kısmi çıktı ile değiştir.
- `block`: parçalı önizleme güncellemeleri ekle.
- `progress`: oluşturma sırasında ilerleme durumu metnini göster, ardından son metni gönder.
- `streaming.preview.toolProgress`: taslak önizleme etkin olduğunda, araç/ilerleme güncellemelerini aynı düzenlenen önizleme mesajına yönlendirir (varsayılan: `true`). Ayrı araç/ilerleme mesajlarını korumak için `false` ayarlayın.
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

`channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode` `partial` olduğunda Slack yerel metin akışını kontrol eder (varsayılan: `true`).

- Yerel metin akışının ve Slack asistan iş parçacığı durumunun görünmesi için bir yanıt iş parçacığı kullanılabilir olmalıdır. İş parçacığı seçimi yine de `replyToMode` izler.
- Kanal, grup sohbeti ve üst düzey DM kökleri, yerel akış kullanılamadığında veya yanıt iş parçacığı yoksa normal taslak önizlemeyi kullanmaya devam edebilir.
- Üst düzey Slack DM'leri varsayılan olarak iş parçacığı dışında kalır; bu yüzden Slack'in iş parçacığı tarzı yerel akış/durum önizlemesini göstermezler; bunun yerine OpenClaw DM içinde bir taslak önizleme gönderir ve düzenler.
- Medya ve metin olmayan yükler normal teslimata geri döner.
- Medya/hata sonları bekleyen önizleme düzenlemelerini iptal eder; uygun metin/blok sonları yalnızca önizlemeyi yerinde düzenleyebildiklerinde boşaltılır.
- Akış yanıtın ortasında başarısız olursa OpenClaw kalan yükler için normal teslimata geri döner.

Slack yerel metin akışı yerine taslak önizleme kullanın:

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

`typingReaction`, OpenClaw bir yanıtı işlerken gelen Slack mesajına geçici bir tepki ekler, ardından çalışma bittiğinde bunu kaldırır. Bu, varsayılan "yazıyor..." durum göstergesini kullanan konu yanıtlarının dışında en yararlı seçenektir.

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notlar:

- Slack kısa kodlar bekler (örneğin `"hourglass_flowing_sand"`).
- Tepki en iyi çaba esasına göre uygulanır ve yanıt ya da hata yolu tamamlandıktan sonra temizleme otomatik olarak denenir.

## Medya, parçalama ve teslim

<AccordionGroup>
  <Accordion title="Gelen ekler">
    Slack dosya ekleri, Slack tarafından barındırılan özel URL'lerden indirilir (token ile kimliği doğrulanmış istek akışı) ve getirme başarılı olduğunda ve boyut sınırları izin verdiğinde medya deposuna yazılır. Dosya yer tutucuları Slack `fileId` değerini içerir; böylece ajanlar özgün dosyayı `download-file` ile alabilir.

    İndirmeler sınırlı boşta kalma ve toplam zaman aşımları kullanır. Slack dosya alımı takılırsa veya başarısız olursa OpenClaw mesajı işlemeye devam eder ve dosya yer tutucusuna geri döner.

    Çalışma zamanı gelen boyut üst sınırı, `channels.slack.mediaMaxMb` ile geçersiz kılınmadıkça varsayılan olarak `20MB` olur.

  </Accordion>

  <Accordion title="Giden metin ve dosyalar">
    - metin parçaları `channels.slack.textChunkLimit` kullanır (varsayılan 4000)
    - `channels.slack.chunkMode="newline"` paragraf öncelikli bölmeyi etkinleştirir
    - dosya gönderimleri Slack yükleme API'lerini kullanır ve konu yanıtlarını (`thread_ts`) içerebilir
    - giden medya üst sınırı yapılandırıldığında `channels.slack.mediaMaxMb` değerini izler; aksi halde kanal gönderimleri medya işlem hattındaki MIME türü varsayılanlarını kullanır

  </Accordion>

  <Accordion title="Teslim hedefleri">
    Tercih edilen açık hedefler:

    - DM'ler için `user:<id>`
    - kanallar için `channel:<id>`

    Yalnızca metin/blok Slack DM'leri doğrudan kullanıcı kimliklerine gönderilebilir; dosya yüklemeleri ve konu içi gönderimler önce Slack konuşma API'leri üzerinden DM'yi açar, çünkü bu yollar somut bir konuşma kimliği gerektirir.

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

Yerel komutlar Slack uygulamanızda [ek manifest ayarları](#additional-manifest-settings) gerektirir ve bunun yerine genel yapılandırmalarda `channels.slack.commands.native: true` veya `commands.native: true` ile etkinleştirilir.

- Slack için yerel komut otomatik modu **kapalıdır**, bu nedenle `commands.native: "auto"` Slack yerel komutlarını etkinleştirmez.

```txt
/help
```

Yerel bağımsız değişken menüleri, seçili bir seçenek değerini göndermeden önce onay modali gösteren uyarlanabilir bir işleme stratejisi kullanır:

- 5 seçeneğe kadar: düğme blokları
- 6-100 seçenek: statik seçim menüsü
- 100'den fazla seçenek: etkileşim seçenek işleyicileri kullanılabilir olduğunda asenkron seçenek filtrelemeli harici seçim
- Slack sınırları aşıldı: kodlanmış seçenek değerleri düğmelere geri döner

```txt
/think
```

Slash oturumları `agent:<agentId>:slack:slash:<userId>` gibi yalıtılmış anahtarlar kullanır ve yine de komut çalıştırmalarını `CommandTargetSessionKey` kullanarak hedef konuşma oturumuna yönlendirir.

## Etkileşimli yanıtlar

Slack, ajan tarafından yazılan etkileşimli yanıt kontrollerini işleyebilir, ancak bu özellik varsayılan olarak devre dışıdır.

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

Etkinleştirildiğinde ajanlar yalnızca Slack'e özgü yanıt yönergeleri yayabilir:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Bu yönergeler Slack Block Kit'e derlenir ve tıklamaları veya seçimleri mevcut Slack etkileşim olayı yolu üzerinden geri yönlendirir.

Notlar:

- Bu Slack'e özgü kullanıcı arayüzüdür. Diğer kanallar Slack Block Kit yönergelerini kendi düğme sistemlerine çevirmez.
- Etkileşimli geri çağırma değerleri ham ajan tarafından yazılmış değerler değil, OpenClaw tarafından üretilmiş opak token'lardır.
- Üretilen etkileşimli bloklar Slack Block Kit sınırlarını aşacaksa OpenClaw geçersiz blok yükü göndermek yerine özgün metin yanıtına geri döner.

## Slack içinde exec onayları

Slack, Web kullanıcı arayüzüne veya terminale geri dönmek yerine etkileşimli düğmeler ve etkileşimlerle yerel bir onay istemcisi olarak davranabilir.

- Exec onayları yerel DM/kanal yönlendirmesi için `channels.slack.execApprovals.*` kullanır.
- Plugin onayları, istek zaten Slack'e ulaştığında ve onay kimliği türü `plugin:` olduğunda aynı Slack yerel düğme yüzeyi üzerinden çözümlenebilir.
- Onaylayan yetkilendirmesi yine de uygulanır: yalnızca onaylayan olarak tanımlanan kullanıcılar Slack üzerinden istekleri onaylayabilir veya reddedebilir.

Bu, diğer kanallarla aynı paylaşılan onay düğmesi yüzeyini kullanır. Slack uygulama ayarlarınızda `interactivity` etkinleştirildiğinde onay istemleri doğrudan konuşmada Block Kit düğmeleri olarak işlenir.
Bu düğmeler bulunduğunda birincil onay kullanıcı deneyimi bunlardır; OpenClaw
yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu söylüyorsa manuel bir `/approve` komutu eklemelidir.

Yapılandırma yolu:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `agentFilter`, `sessionFilter`

Slack, `enabled` ayarlanmamış veya `"auto"` olduğunda ve en az bir
onaylayan çözümlendiğinde yerel exec onaylarını otomatik olarak etkinleştirir. Slack'i yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.
Onaylayanlar çözümlendiğinde yerel onayları zorla etkinleştirmek için `enabled: true` ayarlayın.

Açık Slack exec onay yapılandırması olmadan varsayılan davranış:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Açık Slack yerel yapılandırması yalnızca onaylayanları geçersiz kılmak, filtre eklemek veya
kaynak sohbet teslimine dahil olmak istediğinizde gerekir:

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

Paylaşılan `approvals.exec` iletimi ayrıdır. Bunu yalnızca exec onay istemlerinin başka sohbetlere veya açık bant dışı hedeflere de
yönlendirilmesi gerektiğinde kullanın. Paylaşılan `approvals.plugin` iletimi de
ayrıdır; Slack yerel düğmeleri, bu istekler zaten Slack'e ulaştığında Plugin onaylarını yine de çözümlendirebilir.

Aynı sohbet `/approve`, komutları zaten destekleyen Slack kanallarında ve DM'lerde de çalışır. Tam onay iletimi modeli için [Exec onayları](/tr/tools/exec-approvals) bölümüne bakın.

## Olaylar ve operasyonel davranış

- Mesaj düzenlemeleri/silmeleri sistem olaylarına eşlenir.
- Konu yayınları ("Kanala da gönder" konu yanıtları) normal kullanıcı mesajları olarak işlenir.
- Tepki ekleme/kaldırma olayları sistem olaylarına eşlenir.
- Üye katılma/ayrılma, kanal oluşturma/yeniden adlandırma ve sabitleme ekleme/kaldırma olayları sistem olaylarına eşlenir.
- `configWrites` etkinleştirildiğinde `channel_id_changed` kanal yapılandırma anahtarlarını taşıyabilir.
- Kanal konu/amaç meta verileri güvenilmeyen bağlam olarak değerlendirilir ve yönlendirme bağlamına enjekte edilebilir.
- Konu başlatıcı ve ilk konu geçmişi bağlamı ekimi, uygulanabilir olduğunda yapılandırılmış gönderen izin listelerine göre filtrelenir.
- Blok eylemleri ve modal etkileşimler, zengin yük alanlarıyla yapılandırılmış `Slack interaction: ...` sistem olayları yayar:
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
    - kanal izin listesi (`channels.slack.channels`) — **anahtarlar kanal kimlikleri olmalıdır** (`C12345678`), adlar (`#channel-name`) değil. Ad tabanlı anahtarlar `groupPolicy: "allowlist"` altında sessizce başarısız olur, çünkü kanal yönlendirmesi varsayılan olarak kimlik önceliklidir. Kimlik bulmak için: Slack'te kanala sağ tıklayın → **Bağlantıyı kopyala** — URL'nin sonundaki `C...` değeri kanal kimliğidir.
    - `requireMention`
    - kanal başına `users` izin listesi

    Yararlı komutlar:

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
    - Slack Assistant DM olayları: `drop message_changed` içeren ayrıntılı günlükler
      genellikle Slack'in mesaj meta verilerinde kurtarılabilir bir insan gönderen olmadan
      düzenlenmiş bir Assistant konu olayı gönderdiği anlamına gelir

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode bağlanmıyor">
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
    görünürse HTTP hesabı yapılandırılmıştır, ancak mevcut çalışma zamanı
    SecretRef destekli imzalama sırrını çözememiştir.

  </Accordion>

  <Accordion title="Yerel/slash komutları tetiklenmiyor">
    Niyetinizin hangisi olduğunu doğrulayın:

    - Slack'te kayıtlı eşleşen slash komutlarıyla yerel komut modu (`channels.slack.commands.native: true`)
    - veya tek slash komut modu (`channels.slack.slashCommand.enabled: true`)

    Ayrıca `commands.useAccessGroups` ve kanal/kullanıcı izin listelerini kontrol edin.

  </Accordion>
</AccordionGroup>

## Ek görüntü başvurusu

Slack dosya indirmeleri başarılı olduğunda ve boyut sınırları izin verdiğinde Slack indirilen medyayı ajan turuna ekleyebilir. Görüntü dosyaları medya anlama yolundan geçirilebilir veya doğrudan görüntü yetenekli bir yanıt modeline verilebilir; diğer dosyalar görüntü girdisi olarak değerlendirilmek yerine indirilebilir dosya bağlamı olarak tutulur.

### Desteklenen medya türleri

| Medya türü                     | Kaynak               | Mevcut davranış                                                                  | Notlar                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP görüntüleri | Slack dosya URL'si       | İndirildi ve görsel yetenekli işleme için dönüşe eklendi                   | Dosya başına sınır: `channels.slack.mediaMaxMb` (varsayılan 20 MB)                 |
| PDF dosyaları                      | Slack dosya URL'si       | İndirildi ve `download-file` veya `pdf` gibi araçlar için dosya bağlamı olarak sunuldu | Slack gelen verisi PDF'leri otomatik olarak görüntüyle görme girdisine dönüştürmez |
| Diğer dosyalar                    | Slack dosya URL'si       | Mümkün olduğunda indirildi ve dosya bağlamı olarak sunuldu                              | İkili dosyalar görüntü girdisi olarak değerlendirilmez                               |
| İleti dizisi yanıtları                 | İleti dizisi başlatıcı dosyaları | Yanıtta doğrudan medya yoksa kök ileti dosyaları bağlam olarak hydrate edilebilir  | Yalnızca dosya içeren başlatıcılar bir ek yer tutucusu kullanır                          |
| Çok görüntülü iletiler           | Birden çok Slack dosyası | Her dosya bağımsız olarak değerlendirilir                                              | Slack işleme ileti başına sekiz dosyayla sınırlıdır                     |

### Gelen işlem hattı

Dosya ekleri olan bir Slack iletisi geldiğinde:

1. OpenClaw, bot token'ını (`xoxb-...`) kullanarak dosyayı Slack'in özel URL'sinden indirir.
2. Başarılı olduğunda dosya medya deposuna yazılır.
3. İndirilen medya yolları ve içerik türleri gelen bağlama eklenir.
4. Görüntü yetenekli model/araç yolları bu bağlamdaki görüntü eklerini kullanabilir.
5. Görüntü olmayan dosyalar, bunları işleyebilen araçlar için dosya meta verisi veya medya referansı olarak kullanılabilir kalır.

### İleti dizisi kökü ek devralma

Bir ileti bir ileti dizisine geldiğinde (`thread_ts` üst öğesi varsa):

- Yanıtın kendisinde doğrudan medya yoksa ve dahil edilen kök iletide dosyalar varsa, Slack kök dosyaları ileti dizisi başlatıcı bağlamı olarak hydrate edebilir.
- Doğrudan yanıt ekleri, kök ileti eklerine göre önceliklidir.
- Yalnızca dosyaları olan ve metni olmayan bir kök ileti, yedek mekanizmanın dosyalarını yine de içerebilmesi için bir ek yer tutucusuyla temsil edilir.

### Çoklu ek işleme

Tek bir Slack iletisi birden çok dosya eki içerdiğinde:

- Her ek medya işlem hattından bağımsız olarak geçirilir.
- İndirilen medya referansları ileti bağlamında birleştirilir.
- İşleme sırası, olay yükündeki Slack dosya sırasını izler.
- Bir ekin indirilmesindeki hata diğerlerini engellemez.

### Boyut, indirme ve model sınırları

- **Boyut sınırı**: Dosya başına varsayılan 20 MB. `channels.slack.mediaMaxMb` ile yapılandırılabilir.
- **İndirme hataları**: Slack'in sunamadığı dosyalar, süresi dolmuş URL'ler, erişilemeyen dosyalar, boyutu aşan dosyalar ve Slack kimlik doğrulama/giriş HTML yanıtları, desteklenmeyen biçimler olarak bildirilmek yerine atlanır.
- **Görsel model**: Görüntü analizi, görmeyi desteklediğinde etkin yanıt modelini veya `agents.defaults.imageModel` konumunda yapılandırılan görüntü modelini kullanır.

### Bilinen sınırlar

| Senaryo                               | Mevcut davranış                                                             | Geçici çözüm                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Süresi dolmuş Slack dosya URL'si                 | Dosya atlanır; hata gösterilmez                                                 | Dosyayı Slack'e yeniden yükleyin                                                |
| Görsel model yapılandırılmamış            | Görüntü ekleri medya referansları olarak depolanır, ancak görüntü olarak analiz edilmez | `agents.defaults.imageModel` yapılandırın veya görsel yetenekli bir yanıt modeli kullanın |
| Çok büyük görüntüler (varsayılan olarak > 20 MB) | Boyut sınırına göre atlanır                                                         | Slack izin veriyorsa `channels.slack.mediaMaxMb` değerini artırın                       |
| İletilmiş/paylaşılmış ekler           | Metin ve Slack'te barındırılan görüntü/dosya medyası en iyi çabayla işlenir                       | Doğrudan OpenClaw ileti dizisinde yeniden paylaşın                                   |
| PDF ekleri                        | Dosya/medya bağlamı olarak depolanır, otomatik olarak görüntüyle görme üzerinden yönlendirilmez  | Dosya meta verisi için `download-file` veya PDF analizi için `pdf` aracını kullanın   |

### İlgili dokümantasyon

- [Medya anlama işlem hattı](/tr/nodes/media-understanding)
- [PDF aracı](/tr/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack ekleri için görme etkinleştirme
- Regresyon testleri: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Canlı doğrulama: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## İlgili

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Bir Slack kullanıcısını Gateway ile eşleyin.
  </Card>
  <Card title="Groups" icon="users" href="/tr/channels/groups">
    Kanal ve grup DM davranışı.
  </Card>
  <Card title="Channel routing" icon="route" href="/tr/channels/channel-routing">
    Gelen iletileri aracılara yönlendirin.
  </Card>
  <Card title="Security" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sağlamlaştırma.
  </Card>
  <Card title="Configuration" icon="sliders" href="/tr/gateway/configuration">
    Yapılandırma düzeni ve öncelik sırası.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tr/tools/slash-commands">
    Komut kataloğu ve davranış.
  </Card>
</CardGroup>
