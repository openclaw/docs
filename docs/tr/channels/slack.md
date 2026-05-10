---
read_when:
    - Slack'i ayarlama veya Slack socket/HTTP modunda hata ayıklama
summary: Slack kurulumu ve çalışma zamanı davranışı (Socket Mode + HTTP İstek URL'leri)
title: Slack
x-i18n:
    generated_at: "2026-05-10T19:24:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbebdd96c28aed547179d89ac5ea86e4c6b3b420aaceff5e7aa491317697db1e
    source_path: channels/slack.md
    workflow: 16
---

DM’ler ve kanallar için Slack uygulama entegrasyonları üzerinden üretime hazır. Varsayılan mod Socket Modu’dur; HTTP İstek URL’leri de desteklenir.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Slack DM’leri varsayılan olarak eşleştirme modunu kullanır.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma kılavuzları.
  </Card>
</CardGroup>

## Socket Modu veya HTTP İstek URL’lerini seçme

Her iki aktarım da üretime hazırdır ve mesajlaşma, slash komutları, App Home ve etkileşim özelliklerinde eşdeğerdir. Özelliklere göre değil, dağıtım biçimine göre seçin.

| Konu                         | Socket Modu (varsayılan)                                                            | HTTP İstek URL’leri                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Herkese açık Gateway URL’si  | Gerekmez                                                                             | Gerekir (DNS, TLS, ters proxy veya tünel)                                                                       |
| Giden ağ                     | `wss-primary.slack.com` adresine giden WSS erişilebilir olmalıdır                    | Giden WS yoktur; yalnızca gelen HTTPS                                                                           |
| Gereken token’lar            | Bot token’ı (`xoxb-...`) + `connections:write` ile App-Level Token (`xapp-...`)      | Bot token’ı (`xoxb-...`) + Signing Secret                                                                       |
| Geliştirme dizüstü / güvenlik duvarı arkasında | Olduğu gibi çalışır                                                    | Herkese açık bir tünel (ngrok, Cloudflare Tunnel, Tailscale Funnel) veya hazırlık Gateway’i gerekir            |
| Yatay ölçekleme              | Uygulama ve ana makine başına bir Socket Modu oturumu; birden çok Gateway ayrı Slack uygulamaları gerektirir | Durumsuz POST işleyicisi; birden çok Gateway replikası, yük dengeleyici arkasında tek uygulamayı paylaşabilir |
| Tek Gateway’de çoklu hesap   | Desteklenir; her hesap kendi WS bağlantısını açar                                    | Desteklenir; kayıtların çakışmaması için her hesabın benzersiz bir `webhookPath` değerine (varsayılan `/slack/events`) ihtiyacı vardır |
| Slash komutu aktarımı        | WS bağlantısı üzerinden teslim edilir; `slash_commands[].url` yok sayılır            | Slack `slash_commands[].url` adresine POST gönderir; komutun dağıtılması için alan gereklidir                  |
| İstek imzalama               | Kullanılmaz (kimlik doğrulama App-Level Token’dır)                                   | Slack her isteği imzalar; OpenClaw `signingSecret` ile doğrular                                                |
| Bağlantı kopmasında kurtarma | Slack SDK otomatik yeniden bağlanır; Gateway’in pong zaman aşımı aktarım ayarı uygulanır | Kopacak kalıcı bağlantı yoktur; yeniden denemeler Slack tarafından istek bazında yapılır                       |

<Note>
  Tek Gateway ana makineleri, geliştirme dizüstü bilgisayarları ve giden `*.slack.com` erişimi olan ancak gelen HTTPS kabul edemeyen şirket içi ağlar için **Socket Modu’nu seçin**.

Yük dengeleyici arkasında birden çok Gateway replikası çalıştırırken, giden WSS engellenmiş ancak gelen HTTPS’e izin veriliyorsa veya Slack Webhook’larını zaten bir ters proxy’de sonlandırıyorsanız **HTTP İstek URL’lerini seçin**.
</Note>

## Hızlı kurulum

<Tabs>
  <Tab title="Socket Modu (varsayılan)">
    <Steps>
      <Step title="Yeni bir Slack uygulaması oluşturun">
        [api.slack.com/apps](https://api.slack.com/apps/new) adresini açın → **Create New App** → **From a manifest** → çalışma alanınızı seçin → aşağıdaki manifestlerden birini yapıştırın → **Next** → **Create**.

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
          **Recommended**, birlikte gelen Slack plugin’inin tam özellik setiyle eşleşir: App Home, slash komutları, dosyalar, tepkiler, pin’ler, grup DM’leri ve emoji/kullanıcı grubu okumaları. Çalışma alanı politikası kapsamları kısıtladığında **Minimal** seçeneğini seçin — DM’leri, kanal/grup geçmişini, bahsetmeleri ve slash komutlarını kapsar; ancak dosyaları, tepkileri, pin’leri, grup DM (`mpim:*`), `emoji:read` ve `usergroups:read` kapsamlarını çıkarır. Kapsam başına gerekçe ve ek slash komutları gibi eklenebilir seçenekler için [Manifest ve kapsam kontrol listesi](#manifest-and-scope-checklist) bölümüne bakın.
        </Note>

        Slack uygulamayı oluşturduktan sonra:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: `connections:write` ekleyin, kaydedin, `xapp-...` değerini kopyalayın.
        - **Install App → Install to Workspace**: `xoxb-...` Bot User OAuth Token değerini kopyalayın.

      </Step>

      <Step title="OpenClaw’ı yapılandırın">

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

        Ortam değişkeni geri dönüşü (yalnızca varsayılan hesap):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Gateway’i başlatın">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP İstek URL’leri">
    <Steps>
      <Step title="Yeni bir Slack uygulaması oluşturun">
        [api.slack.com/apps](https://api.slack.com/apps/new) adresini açın → **Create New App** → **From a manifest** → çalışma alanınızı seçin → aşağıdaki manifestlerden birini yapıştırın → `https://gateway-host.example.com/slack/events` değerini herkese açık Gateway URL’nizle değiştirin → **Next** → **Create**.

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

```json Asgari
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
          **Önerilen**, birlikte gelen Slack Plugin'inin tam özellik kümesiyle eşleşir; **Asgari**, kısıtlayıcı çalışma alanları için dosyaları, tepkileri, sabitlemeleri, grup doğrudan mesajını (`mpim:*`), `emoji:read` ve `usergroups:read` kapsam dışı bırakır. Kapsam başına gerekçe için [Manifest ve kapsam kontrol listesi](#manifest-and-scope-checklist) bölümüne bakın.
        </Note>

        <Info>
          Üç URL alanının (`slash_commands[].url`, `event_subscriptions.request_url` ve `interactivity.request_url` / `message_menu_options_url`) tamamı aynı OpenClaw uç noktasını işaret eder. Slack'in manifest şeması bunların ayrı ayrı adlandırılmasını gerektirir, ancak OpenClaw yük türüne göre yönlendirme yaptığından tek bir `webhookPath` (varsayılan `/slack/events`) yeterlidir. `slash_commands[].url` olmadan eğik çizgi komutları HTTP modunda sessizce hiçbir işlem yapmaz.
        </Info>

        Slack uygulamayı oluşturduktan sonra:

        - **Temel Bilgiler → Uygulama Kimlik Bilgileri**: istek doğrulaması için **İmzalama Gizli Anahtarı** değerini kopyalayın.
        - **Uygulamayı Yükle → Çalışma Alanına Yükle**: `xoxb-...` Bot Kullanıcısı OAuth Belirteci'ni kopyalayın.

      </Step>

      <Step title="OpenClaw'ı yapılandır">

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

      <Step title="Gateway'i başlat">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Soket Modu aktarım ayarlaması

OpenClaw, Soket Modu için Slack SDK istemcisi pong zaman aşımını varsayılan olarak 15 saniyeye ayarlar. Aktarım ayarlarını yalnızca çalışma alanına veya ana makineye özgü ayarlama gerektiğinde geçersiz kılın:

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

Bunu yalnızca Slack websocket pong/server-ping zaman aşımlarını günlüğe kaydeden veya olay döngüsü tıkanması olduğu bilinen ana makinelerde çalışan Soket Modu çalışma alanları için kullanın. `clientPingTimeout`, SDK bir istemci ping'i gönderdikten sonraki pong bekleme süresidir; `serverPingTimeout`, Slack sunucu ping'leri için bekleme süresidir. Uygulama iletileri ve olayları, aktarım canlılığı sinyalleri değil, uygulama durumu olmaya devam eder.

## Manifest ve kapsam kontrol listesi

Temel Slack uygulama manifesti, Soket Modu ve HTTP İstek URL'leri için aynıdır. Yalnızca `settings` bloğu (ve eğik çizgi komutu `url` değeri) farklıdır.

Temel manifest (varsayılan Soket Modu):

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

**HTTP İstek URL'leri modu** için `settings` değerini HTTP varyantıyla değiştirin ve her eğik çizgi komutuna `url` ekleyin. Genel URL gerekir:

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

Yukarıdaki varsayılanları genişleten farklı özellikleri sunar.

Varsayılan manifest, Slack Uygulama Ana Sayfası **Ana Sayfa** sekmesini etkinleştirir ve `app_home_opened` olayına abone olur. Bir çalışma alanı üyesi Ana Sayfa sekmesini açtığında, OpenClaw `views.publish` ile güvenli bir varsayılan Ana Sayfa görünümü yayımlar; konuşma yükü veya özel yapılandırma dahil edilmez. **İletiler** sekmesi Slack doğrudan mesajları için etkin kalır.

<AccordionGroup>
  <Accordion title="İsteğe bağlı yerel eğik çizgi komutları">

    Tek bir yapılandırılmış komut yerine, bazı ayrıntılara dikkat ederek birden çok [yerel eğik çizgi komutu](#commands-and-slash-behavior) kullanılabilir:

    - `/status` komutu ayrılmış olduğundan `/status` yerine `/agentstatus` kullanın.
    - Aynı anda en fazla 25 eğik çizgi komutu kullanılabilir hale getirilebilir.

    Mevcut `features.slash_commands` bölümünüzü [kullanılabilir komutların](/tr/tools/slash-commands#command-list) bir alt kümesiyle değiştirin:

    <Tabs>
      <Tab title="Soket Modu (varsayılan)">

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
      <Tab title="HTTP İstek URL'leri">
        Yukarıdaki Soket Modu ile aynı `slash_commands` listesini kullanın ve her girdiye `"url": "https://gateway-host.example.com/slack/events"` ekleyin. Örnek:

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

        Listedeki her komutta bu `url` değerini yineleyin.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="İsteğe bağlı yazarlık kapsamları (yazma işlemleri)">
    Giden mesajların varsayılan Slack uygulaması kimliği yerine etkin ajan kimliğini (özel kullanıcı adı ve simge) kullanmasını istiyorsanız `chat:write.customize` bot kapsamını ekleyin.

    Emoji simgesi kullanırsanız Slack `:emoji_name:` söz dizimini bekler.

  </Accordion>
  <Accordion title="İsteğe bağlı kullanıcı-token kapsamları (okuma işlemleri)">
    `channels.slack.userToken` yapılandırırsanız tipik okuma kapsamları şunlardır:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (Slack arama okumalarına bağımlıysanız)

  </Accordion>
</AccordionGroup>

## Token modeli

- Socket Mode için `botToken` + `appToken` gereklidir.
- HTTP modu `botToken` + `signingSecret` gerektirir.
- `botToken`, `appToken`, `signingSecret` ve `userToken` düz metin
  dizelerini veya SecretRef nesnelerini kabul eder.
- Yapılandırma tokenları env geri dönüşünü geçersiz kılar.
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env geri dönüşü yalnızca varsayılan hesap için geçerlidir.
- `userToken` (`xoxp-...`) yalnızca yapılandırmadan gelir (env geri dönüşü yoktur) ve varsayılan olarak salt okunur davranışa ayarlanır (`userTokenReadOnly: true`).

Durum anlık görüntüsü davranışı:

- Slack hesap incelemesi, kimlik bilgisi başına `*Source` ve `*Status`
  alanlarını (`botToken`, `appToken`, `signingSecret`, `userToken`) izler.
- Durum `available`, `configured_unavailable` veya `missing` olur.
- `configured_unavailable`, hesabın SecretRef veya başka bir satır içi olmayan gizli kaynak
  üzerinden yapılandırıldığı, ancak geçerli komut/runtime yolunun
  gerçek değeri çözemediği anlamına gelir.
- HTTP modunda `signingSecretStatus` dahil edilir; Socket Mode’da
  gerekli çift `botTokenStatus` + `appTokenStatus` olur.

<Tip>
Eylemler/dizin okumaları için, yapılandırıldığında kullanıcı tokenı tercih edilebilir. Yazmalar için bot tokenı tercih edilmeye devam eder; kullanıcı-token yazmalarına yalnızca `userTokenReadOnly: false` olduğunda ve bot tokenı kullanılamadığında izin verilir.
</Tip>

## Eylemler ve kapılar

Slack eylemleri `channels.slack.actions.*` ile kontrol edilir.

Geçerli Slack araçlarında kullanılabilen eylem grupları:

| Grup       | Varsayılan |
| ---------- | ---------- |
| messages   | etkin      |
| reactions  | etkin      |
| pins       | etkin      |
| memberInfo | etkin      |
| emojiList  | etkin      |

Geçerli Slack mesaj eylemleri `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` ve `emoji-list` içerir. `download-file`, gelen dosya yer tutucularında gösterilen Slack dosya kimliklerini kabul eder ve görüntüler için görüntü önizlemeleri, diğer dosya türleri için yerel dosya meta verileri döndürür.

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.slack.dmPolicy` DM erişimini kontrol eder. `channels.slack.allowFrom` kanonik DM izin listesidir.

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.slack.allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    DM bayrakları:

    - `dm.enabled` (varsayılan true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (eski)
    - `dm.groupEnabled` (grup DM’leri varsayılan false)
    - `dm.groupChannels` (isteğe bağlı MPIM izin listesi)

    Çok hesaplı öncelik:

    - `channels.slack.accounts.default.allowFrom` yalnızca `default` hesabı için geçerlidir.
    - Adlandırılmış hesaplar, kendi `allowFrom` değerleri ayarlanmamışsa `channels.slack.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.slack.accounts.default.allowFrom` değerini devralmaz.

    Eski `channels.slack.dm.policy` ve `channels.slack.dm.allowFrom` uyumluluk için hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` alanlarına taşır.

    DM’lerde eşleştirme `openclaw pairing approve slack <code>` kullanır.

  </Tab>

  <Tab title="Kanal ilkesi">
    `channels.slack.groupPolicy` kanal işleme davranışını kontrol eder:

    - `open`
    - `allowlist`
    - `disabled`

    Kanal izin listesi `channels.slack.channels` altında bulunur ve yapılandırma anahtarları olarak **kararlı Slack kanal kimlikleri** (örneğin `C12345678`) kullanmalıdır.

    Runtime notu: `channels.slack` tamamen eksikse (yalnızca env kurulumu), runtime `groupPolicy="allowlist"` değerine geri döner ve bir uyarı günlüğe yazar (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

    Ad/kimlik çözümleme:

    - kanal izin listesi girdileri ve DM izin listesi girdileri, token erişimi izin verdiğinde başlangıçta çözümlenir
    - çözümlenmemiş kanal-adı girdileri yapılandırıldığı gibi tutulur ancak varsayılan olarak yönlendirme için yok sayılır
    - gelen yetkilendirme ve kanal yönlendirme varsayılan olarak kimlik önceliklidir; doğrudan kullanıcı adı/slug eşleştirmesi `channels.slack.dangerouslyAllowNameMatching: true` gerektirir

    <Warning>
    Ada dayalı anahtarlar (`#channel-name` veya `channel-name`) `groupPolicy: "allowlist"` altında eşleşmez. Kanal araması varsayılan olarak kimlik önceliklidir, bu nedenle ada dayalı bir anahtar hiçbir zaman başarıyla yönlendirilmez ve o kanaldaki tüm mesajlar sessizce engellenir. Bu, yönlendirme için kanal anahtarının gerekli olmadığı ve ada dayalı bir anahtarın çalışıyor gibi göründüğü `groupPolicy: "open"` davranışından farklıdır.

    Her zaman anahtar olarak Slack kanal kimliğini kullanın. Bulmak için: Slack’te kanala sağ tıklayın → **Bağlantıyı kopyala** — kimlik (`C...`) URL’nin sonunda görünür.

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
    - bahsetme regex kalıpları (`agents.list[].groupChat.mentionPatterns`, geri dönüş `messages.groupChat.mentionPatterns`)
    - örtük bota-yanıt iş parçacığı davranışı (`thread.requireExplicitMention` `true` olduğunda devre dışıdır)

    Kanal başına kontroller (`channels.slack.channels.<id>`; adlar yalnızca başlangıç çözümlemesi veya `dangerouslyAllowNameMatching` üzerinden):

    - `requireMention`
    - `users` (izin listesi)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` anahtar biçimi: `id:`, `e164:`, `username:`, `name:` veya `"*"` joker karakteri
      (eski öneksiz anahtarlar hâlâ yalnızca `id:` ile eşleşir)

    `allowBots`, kanallar ve özel kanallar için muhafazakârdır: bot tarafından yazılmış oda mesajları yalnızca gönderen bot açıkça o odanın `users` izin listesinde yer aldığında veya `channels.slack.allowFrom` içindeki en az bir açık Slack sahip kimliği şu anda oda üyesi olduğunda kabul edilir. Joker karakterler ve görünen ad sahip girdileri sahip varlığı koşulunu karşılamaz. Sahip varlığı Slack `conversations.members` kullanır; uygulamanın oda türü için eşleşen okuma kapsamına sahip olduğundan emin olun (genel kanallar için `channels:read`, özel kanallar için `groups:read`). Üye araması başarısız olursa OpenClaw bot tarafından yazılmış oda mesajını düşürür.

  </Tab>
</Tabs>

## İş parçacıkları, oturumlar ve yanıt etiketleri

- DM’ler `direct` olarak; kanallar `channel` olarak; MPIM’ler `group` olarak yönlendirilir.
- Slack rota bağları ham eş kimliklerini ve `channel:C12345678`, `user:U12345678` ve `<@U12345678>` gibi Slack hedef biçimlerini kabul eder.
- Varsayılan `session.dmScope=main` ile Slack DM’leri ajanın ana oturumuna daraltılır.
- Kanal oturumları: `agent:<agentId>:slack:channel:<channelId>`.
- İş parçacığı yanıtları, uygun olduğunda iş parçacığı oturumu sonekleri (`:thread:<threadTs>`) oluşturabilir.
- OpenClaw’ın açık bir bahsetme gerektirmeden üst düzey mesajları işlediği kanallarda, `off` olmayan `replyToMode`, işlenen her kökü `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` içine yönlendirir; böylece görünür Slack iş parçacığı ilk turdan itibaren tek bir OpenClaw oturumuna eşlenir.
- `channels.slack.thread.historyScope` varsayılanı `thread`; `thread.inheritParent` varsayılanı `false`.
- `channels.slack.thread.initialHistoryLimit`, yeni bir iş parçacığı oturumu başladığında kaç mevcut iş parçacığı mesajının getirileceğini kontrol eder (varsayılan `20`; devre dışı bırakmak için `0` ayarlayın).
- `channels.slack.thread.requireExplicitMention` (varsayılan `false`): `true` olduğunda örtük iş parçacığı bahsetmelerini bastırır; bot iş parçacığına zaten katılmış olsa bile, bot yalnızca iş parçacıkları içindeki açık `@bot` bahsetmelerine yanıt verir. Bu olmadan, botun katıldığı bir iş parçacığındaki yanıtlar `requireMention` kapısını atlar.

Yanıt iş parçacığı kontrolleri:

- `channels.slack.replyToMode`: `off|first|all|batched` (varsayılan `off`)
- `channels.slack.replyToModeByChatType`: `direct|group|channel` başına
- doğrudan sohbetler için eski geri dönüş: `channels.slack.dm.replyToMode`

Manuel yanıt etiketleri desteklenir:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

`message` aracından açık Slack iş parçacığı yanıtları için, Slack’ten iş parçacığı yanıtını üst kanala da yayınlamasını istemek üzere `action: "send"` ve `threadId` veya `replyTo` ile `replyBroadcast: true` ayarlayın. Bu, Slack’in `chat.postMessage` `reply_broadcast` bayrağına eşlenir ve medya yüklemeleri için değil, yalnızca metin veya Block Kit gönderimleri için desteklenir.

Bir `message` aracı çağrısı bir Slack iş parçacığı içinde çalıştığında ve aynı kanalı hedeflediğinde, OpenClaw normalde `replyToMode` değerine göre geçerli Slack iş parçacığını devralır. Bunun yerine yeni bir üst kanal mesajını zorlamak için `action: "send"` veya `action: "upload-file"` üzerinde `topLevel: true` ayarlayın. `threadId: null` aynı üst düzey çıkış seçeneği olarak kabul edilir.

<Note>
`replyToMode="off"`, açık `[[reply_to_*]]` etiketleri dahil olmak üzere Slack’te **tüm** yanıt iş parçacığını devre dışı bırakır. Bu, `"off"` modunda açık etiketlerin hâlâ dikkate alındığı Telegram’dan farklıdır. Slack iş parçacıkları mesajları kanaldan gizlerken Telegram yanıtları satır içinde görünür kalır.
</Note>

## Onay tepkileri

`ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- ajan kimliği emoji geri dönüşü (`agents.list[].identity.emoji`, yoksa "👀")

Notlar:

- Slack shortcode’lar bekler (örneğin `"eyes"`).
- Slack hesabı için veya genel olarak tepkiyi devre dışı bırakmak için `""` kullanın.

## Metin akışı

`channels.slack.streaming` canlı önizleme davranışını kontrol eder:

- `off`: canlı önizleme akışını devre dışı bırakır.
- `partial` (varsayılan): önizleme metnini en son kısmi çıktı ile değiştirir.
- `block`: parçalı önizleme güncellemelerini ekler.
- `progress`: oluşturma sırasında ilerleme durumu metnini gösterir, ardından son metni gönderir.
- `streaming.preview.toolProgress`: taslak önizleme etkinken araç/ilerleme güncellemelerini aynı düzenlenen önizleme mesajına yönlendirir (varsayılan: `true`). Ayrı araç/ilerleme mesajları tutmak için `false` ayarlayın.
- `streaming.preview.commandText` / `streaming.progress.commandText`: ham komut/exec metnini gizlerken kompakt araç-ilerleme satırlarını korumak için `status` değerine ayarlayın (varsayılan: `raw`).

Kompakt ilerleme satırlarını korurken ham komut/exec metnini gizleyin:

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

- Yerel metin akışı ve Slack yardımcı iş parçacığı durumunun görünmesi için bir yanıt iş parçacığı kullanılabilir olmalıdır. İş parçacığı seçimi yine `replyToMode` değerini izler.
- Kanal, grup sohbeti ve üst düzey DM kökleri, yerel akış kullanılamadığında veya yanıt iş parçacığı olmadığında normal taslak önizlemesini kullanmaya devam edebilir.
- Üst düzey Slack DM'leri varsayılan olarak iş parçacığı dışında kalır, bu yüzden Slack'in iş parçacığı tarzı yerel akış/durum önizlemesini göstermezler; OpenClaw bunun yerine DM'de bir taslak önizlemesi gönderir ve düzenler.
- Medya ve metin dışı yükler normal teslimata geri döner.
- Medya/hata sonları bekleyen önizleme düzenlemelerini iptal eder; uygun metin/blok sonları yalnızca önizlemeyi yerinde düzenleyebildiklerinde boşaltılır.
- Akış yanıtın ortasında başarısız olursa OpenClaw kalan yükler için normal teslimata geri döner.

Slack yerel metin akışı yerine taslak önizlemesi kullanın:

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

## Yazıyor tepkisi geri dönüşü

`typingReaction`, OpenClaw bir yanıtı işlerken gelen Slack mesajına geçici bir tepki ekler, ardından çalışma bittiğinde bunu kaldırır. Bu, varsayılan bir "yazıyor..." durum göstergesi kullanan iş parçacığı yanıtlarının dışında en kullanışlıdır.

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notlar:

- Slack kısa kodlar bekler (örneğin `"hourglass_flowing_sand"`).
- Tepki en iyi çabayla eklenir ve yanıt ya da hata yolu tamamlandıktan sonra temizleme otomatik olarak denenir.

## Medya, parçalama ve teslimat

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Slack dosya ekleri, Slack tarafından barındırılan özel URL'lerden indirilir (token kimlik doğrulamalı istek akışı) ve getirme başarılı olduğunda ve boyut sınırları izin verdiğinde medya deposuna yazılır. Dosya yer tutucuları Slack `fileId` değerini içerir; böylece agent'lar özgün dosyayı `download-file` ile getirebilir.

    İndirmeler sınırlı boşta kalma ve toplam zaman aşımları kullanır. Slack dosya alımı takılır veya başarısız olursa OpenClaw mesajı işlemeye devam eder ve dosya yer tutucusuna geri döner.

    Çalışma zamanı gelen boyut sınırı, `channels.slack.mediaMaxMb` tarafından geçersiz kılınmadığı sürece varsayılan olarak `20MB` değeridir.

  </Accordion>

  <Accordion title="Outbound text and files">
    - metin parçaları `channels.slack.textChunkLimit` kullanır (varsayılan 4000)
    - `channels.slack.chunkMode="newline"` paragraf öncelikli bölmeyi etkinleştirir
    - dosya gönderimleri Slack yükleme API'lerini kullanır ve iş parçacığı yanıtlarını (`thread_ts`) içerebilir
    - giden medya sınırı yapılandırıldığında `channels.slack.mediaMaxMb` değerini izler; aksi takdirde kanal gönderimleri medya hattından MIME türü varsayılanlarını kullanır

  </Accordion>

  <Accordion title="Delivery targets">
    Tercih edilen açık hedefler:

    - DM'ler için `user:<id>`
    - kanallar için `channel:<id>`

    Yalnızca metin/blok Slack DM'leri doğrudan kullanıcı kimliklerine gönderi paylaşabilir; dosya yüklemeleri ve iş parçacıklı gönderimler önce Slack konuşma API'leri aracılığıyla DM'yi açar, çünkü bu yollar somut bir konuşma kimliği gerektirir.

  </Accordion>
</AccordionGroup>

## Komutlar ve slash davranışı

Slash komutları Slack'te tek bir yapılandırılmış komut veya birden fazla yerel komut olarak görünür. Komut varsayılanlarını değiştirmek için `channels.slack.slashCommand` yapılandırın:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Yerel komutlar, Slack uygulamanızda [ek manifest ayarları](#additional-manifest-settings) gerektirir ve bunun yerine genel yapılandırmalarda `channels.slack.commands.native: true` veya `commands.native: true` ile etkinleştirilir.

- Slack için yerel komut otomatik modu **kapalıdır**, bu yüzden `commands.native: "auto"` Slack yerel komutlarını etkinleştirmez.

```txt
/help
```

Yerel argüman menüleri, seçilen seçenek değerini göndermeden önce bir onay modalı gösteren uyarlamalı bir işleme stratejisi kullanır:

- en fazla 5 seçenek: düğme blokları
- 6-100 seçenek: statik seçim menüsü
- 100'den fazla seçenek: etkileşim seçenek işleyicileri kullanılabilir olduğunda zaman uyumsuz seçenek filtrelemeli harici seçim
- Slack sınırları aşıldı: kodlanmış seçenek değerleri düğmelere geri döner

```txt
/think
```

Slash oturumları `agent:<agentId>:slack:slash:<userId>` gibi yalıtılmış anahtarlar kullanır ve komut yürütmelerini yine `CommandTargetSessionKey` kullanarak hedef konuşma oturumuna yönlendirir.

## Etkileşimli yanıtlar

Slack, agent tarafından yazılmış etkileşimli yanıt denetimlerini işleyebilir, ancak bu özellik varsayılan olarak devre dışıdır.

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

Etkinleştirildiğinde, ajanlar yalnızca Slack'e özgü yanıt yönergeleri yayınlayabilir:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Bu yönergeler Slack Block Kit'e derlenir ve tıklamaları ya da seçimleri mevcut Slack etkileşim olayı yolu üzerinden geri yönlendirir.

Notlar:

- Bu, Slack'e özgü bir UI'dır. Diğer kanallar Slack Block Kit yönergelerini kendi düğme sistemlerine çevirmez.
- Etkileşimli geri çağırma değerleri, ajan tarafından yazılmış ham değerler değil, OpenClaw tarafından oluşturulan opak token'lardır.
- Oluşturulan etkileşimli bloklar Slack Block Kit sınırlarını aşacaksa OpenClaw, geçersiz bir blok yükü göndermek yerine özgün metin yanıtına geri döner.

## Slack'te exec onayları

Slack, Web UI veya terminale geri dönmek yerine etkileşimli düğmeler ve etkileşimlerle yerel bir onay istemcisi gibi davranabilir.

- Exec onayları, yerel DM/kanal yönlendirmesi için `channels.slack.execApprovals.*` kullanır.
- Plugin onayları, istek zaten Slack'e ulaştığında ve onay kimliği türü `plugin:` olduğunda aynı Slack yerel düğme yüzeyi üzerinden çözülebilir.
- Onaylayıcı yetkilendirmesi yine uygulanır: Slack üzerinden istekleri yalnızca onaylayıcı olarak tanımlanan kullanıcılar onaylayabilir veya reddedebilir.

Bu, diğer kanallarla aynı paylaşılan onay düğmesi yüzeyini kullanır. Slack uygulama ayarlarınızda `interactivity` etkin olduğunda, onay istemleri konuşmanın içinde doğrudan Block Kit düğmeleri olarak işlenir.
Bu düğmeler mevcut olduğunda birincil onay UX'i bunlardır; OpenClaw
yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın
tek yol olduğunu söylediğinde manuel bir `/approve` komutu eklemelidir.

Yapılandırma yolu:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `agentFilter`, `sessionFilter`

Slack, `enabled` ayarlanmamış veya `"auto"` olduğunda ve en az bir
onaylayıcı çözümlendiğinde yerel exec onaylarını otomatik olarak etkinleştirir. Slack'i yerel bir onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın.
Onaylayıcılar çözümlendiğinde yerel onayları zorla açmak için `enabled: true` ayarlayın.

Açık Slack exec onayı yapılandırması olmadan varsayılan davranış:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Açık Slack yerel yapılandırması yalnızca onaylayıcıları geçersiz kılmak, filtre eklemek veya
kaynak sohbet teslimini seçmek istediğinizde gereklidir:

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

Paylaşılan `approvals.exec` iletimi ayrıdır. Bunu yalnızca exec onayı istemlerinin başka sohbetlere veya açık bant dışı hedeflere de
yönlendirilmesi gerektiğinde kullanın. Paylaşılan `approvals.plugin` iletimi de
ayrıdır; Slack yerel düğmeleri, bu istekler zaten Slack'e ulaştığında Plugin onaylarını yine çözebilir.

Aynı sohbet `/approve`, komutları zaten destekleyen Slack kanallarında ve DM'lerde de çalışır. Tam onay iletimi modeli için [Exec onayları](/tr/tools/exec-approvals) bölümüne bakın.

## Olaylar ve operasyonel davranış

- İleti düzenlemeleri/silmeleri sistem olaylarına eşlenir.
- Konu yayınları ("Also send to channel" konu yanıtları) normal kullanıcı iletileri olarak işlenir.
- Tepki ekleme/kaldırma olayları sistem olaylarına eşlenir.
- Üye katılma/ayrılma, kanal oluşturulma/yeniden adlandırılma ve sabit ekleme/kaldırma olayları sistem olaylarına eşlenir.
- `channel_id_changed`, `configWrites` etkinleştirildiğinde kanal yapılandırma anahtarlarını taşıyabilir.
- Kanal konusu/amacı meta verileri güvenilmeyen bağlam olarak değerlendirilir ve yönlendirme bağlamına enjekte edilebilir.
- Konu başlatıcısı ve ilk konu-geçmişi bağlamı ekimi, geçerli olduğunda yapılandırılmış gönderen izin listelerine göre filtrelenir.
- Blok eylemleri ve modal etkileşimleri, zengin yük alanlarıyla yapılandırılmış `Slack interaction: ...` sistem olayları yayar:
  - blok eylemleri: seçili değerler, etiketler, seçici değerleri ve `workflow_*` meta verileri
  - yönlendirilmiş kanal meta verileri ve form girdileriyle modal `view_submission` ve `view_closed` olayları

## Yapılandırma referansı

Birincil referans: [Yapılandırma referansı - Slack](/tr/gateway/config-channels#slack).

<Accordion title="Yüksek sinyalli Slack alanları">

- mod/kimlik doğrulama: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM erişimi: `dm.enabled`, `dmPolicy`, `allowFrom` (eski: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- uyumluluk geçişi: `dangerouslyAllowNameMatching` (acil durum; gerekli olmadıkça kapalı tutun)
- kanal erişimi: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- konu/geçmiş: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- teslim: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- önizlemeler: `chat.postMessage` bağlantı/medya önizleme denetimi için `unfurlLinks`, `unfurlMedia`
- operasyonlar/özellikler: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Sorun giderme

<AccordionGroup>
  <Accordion title="Kanallarda yanıt yok">
    Sırasıyla kontrol edin:

    - `groupPolicy`
    - kanal izin listesi (`channels.slack.channels`) — **anahtarlar kanal adları** (`#channel-name`) değil, **kanal kimlikleri** (`C12345678`) olmalıdır. Ad tabanlı anahtarlar `groupPolicy: "allowlist"` altında sessizce başarısız olur, çünkü kanal yönlendirmesi varsayılan olarak önce kimliğe göre yapılır. Bir kimlik bulmak için: Slack’te kanala sağ tıklayın → **Bağlantıyı kopyala** — URL’nin sonundaki `C...` değeri kanal kimliğidir.
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
    - eşleştirme onayları / izin verilenler listesi girdileri
    - Slack Assistant DM olayları: `drop message_changed` ifadesinden bahseden ayrıntılı günlükler
      genellikle Slack'in, ileti meta verilerinde kurtarılabilir bir insan göndereni olmayan
      düzenlenmiş bir Assistant iş parçacığı olayı gönderdiği anlamına gelir

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode bağlanmıyor">
    Slack uygulama ayarlarında bot + uygulama belirteçlerini ve Socket Mode etkinleştirmesini doğrulayın.

    `openclaw channels status --probe --json`, `botTokenStatus` veya
    `appTokenStatus: "configured_unavailable"` gösteriyorsa Slack hesabı
    yapılandırılmıştır ancak geçerli çalışma zamanı SecretRef destekli
    değeri çözememiştir.

  </Accordion>

  <Accordion title="HTTP modu olayları almıyor">
    Doğrulayın:

    - imzalama sırrı
    - webhook yolu
    - Slack İstek URL'leri (Olaylar + Etkileşim + Slash Komutları)
    - HTTP hesabı başına benzersiz `webhookPath`

    Hesap anlık görüntülerinde `signingSecretStatus: "configured_unavailable"` görünüyorsa,
    HTTP hesabı yapılandırılmıştır ancak mevcut çalışma zamanı SecretRef destekli
    imzalama sırrını çözememiştir.

  </Accordion>

  <Accordion title="Yerel/slash komutları tetiklenmiyor">
    Hangisini amaçladığınızı doğrulayın:

    - Slack'te kayıtlı eşleşen slash komutlarıyla yerel komut modu (`channels.slack.commands.native: true`)
    - veya tek slash komut modu (`channels.slack.slashCommand.enabled: true`)

    Ayrıca `commands.useAccessGroups` ve kanal/kullanıcı izin listelerini kontrol edin.

  </Accordion>
</AccordionGroup>

## Ek görüşü referansı

Slack dosya indirmeleri başarılı olduğunda ve boyut sınırları izin verdiğinde Slack, indirilen medyayı ajan turuna ekleyebilir. Görüntü dosyaları medya anlama yolundan geçirilebilir veya doğrudan görüntü işleyebilen bir yanıt modeline aktarılabilir; diğer dosyalar ise görüntü girdisi olarak ele alınmak yerine indirilebilir dosya bağlamı olarak saklanır.

### Desteklenen medya türleri

| Medya türü                     | Kaynak               | Mevcut davranış                                                                  | Notlar                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP görüntüleri | Slack dosya URL'si       | İndirilir ve görüntü işleyebilen kullanım için tura eklenir                   | Dosya başına sınır: `channels.slack.mediaMaxMb` (varsayılan 20 MB)                 |
| PDF dosyaları                      | Slack dosya URL'si       | İndirilir ve `download-file` veya `pdf` gibi araçlar için dosya bağlamı olarak sunulur | Slack gelen akışı PDF'leri otomatik olarak görüntü-görüş girdisine dönüştürmez |
| Diğer dosyalar                    | Slack dosya URL'si       | Mümkün olduğunda indirilir ve dosya bağlamı olarak sunulur                              | İkili dosyalar görüntü girdisi olarak ele alınmaz                               |
| Konu yanıtları                 | Konu başlatıcı dosyaları | Yanıtta doğrudan medya yoksa kök ileti dosyaları bağlam olarak doldurulabilir  | Yalnızca dosya içeren başlatıcılar bir ek yer tutucusu kullanır                          |
| Çok görüntülü iletiler           | Birden çok Slack dosyası | Her dosya bağımsız olarak değerlendirilir                                              | Slack işleme, ileti başına sekiz dosyayla sınırlıdır                     |

### Gelen akış hattı

Dosya ekleri olan bir Slack iletisi geldiğinde:

1. OpenClaw, bot belirtecini (`xoxb-...`) kullanarak dosyayı Slack'in özel URL'sinden indirir.
2. Başarılı olursa dosya medya deposuna yazılır.
3. İndirilen medya yolları ve içerik türleri gelen bağlama eklenir.
4. Görüntü işleyebilen model/araç yolları bu bağlamdaki görüntü eklerini kullanabilir.
5. Görüntü olmayan dosyalar, bunları işleyebilen araçlar için dosya meta verisi veya medya referansı olarak kullanılabilir kalır.

### Konu kökü ek kalıtımı

Bir ileti bir konu içinde geldiğinde (`thread_ts` üst öğesine sahipse):

- Yanıtın kendisinde doğrudan medya yoksa ve dahil edilen kök iletide dosyalar varsa Slack, kök dosyaları konu başlatıcı bağlamı olarak doldurabilir.
- Doğrudan yanıt ekleri, kök ileti eklerine göre önceliklidir.
- Yalnızca dosyaları olan ve metni olmayan bir kök ileti, yedek yolun dosyalarını yine de dahil edebilmesi için bir ek yer tutucusuyla temsil edilir.

### Çoklu ek işleme

Tek bir Slack iletisi birden çok dosya eki içerdiğinde:

- Her ek medya akış hattından bağımsız olarak işlenir.
- İndirilen medya referansları ileti bağlamında birleştirilir.
- İşleme sırası, olay yükündeki Slack dosya sırasını izler.
- Bir ekin indirilmesindeki hata diğerlerini engellemez.

### Boyut, indirme ve model sınırları

- **Boyut sınırı**: Dosya başına varsayılan 20 MB. `channels.slack.mediaMaxMb` ile yapılandırılabilir.
- **İndirme hataları**: Slack'in sunamadığı dosyalar, süresi dolmuş URL'ler, erişilemeyen dosyalar, aşırı büyük dosyalar ve Slack kimlik doğrulama/giriş HTML yanıtları, desteklenmeyen biçimler olarak bildirilmek yerine atlanır.
- **Görüntü modeli**: Görüntü analizi, görsel yeteneğini desteklediğinde etkin yanıt modelini veya `agents.defaults.imageModel` konumunda yapılandırılan görüntü modelini kullanır.

### Bilinen sınırlar

| Senaryo                               | Mevcut davranış                                                             | Geçici çözüm                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Süresi dolmuş Slack dosya URL'si                 | Dosya atlanır; hata gösterilmez                                                 | Dosyayı Slack'e yeniden yükleyin                                                |
| Görüntü modeli yapılandırılmamış            | Görüntü ekleri medya referansları olarak depolanır, ancak görüntü olarak analiz edilmez | `agents.defaults.imageModel` yapılandırın veya görüntü işleyebilen bir yanıt modeli kullanın |
| Çok büyük görüntüler (varsayılan olarak > 20 MB) | Boyut sınırı nedeniyle atlanır                                                         | Slack izin veriyorsa `channels.slack.mediaMaxMb` değerini artırın                       |
| İletilmiş/paylaşılmış ekler           | Metin ve Slack'te barındırılan görüntü/dosya medyası en iyi çabayla işlenir                       | Doğrudan OpenClaw konusunda yeniden paylaşın                                   |
| PDF ekleri                        | Dosya/medya bağlamı olarak depolanır, otomatik olarak görüntü görüşünden geçirilmez  | Dosya meta verileri için `download-file` veya PDF analizi için `pdf` aracını kullanın   |

### İlgili belgeler

- [Medya anlama akış hattı](/tr/nodes/media-understanding)
- [PDF aracı](/tr/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack ek görüşü etkinleştirmesi
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
    Gelen iletileri ajanlara yönlendirin.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sağlamlaştırma.
  </Card>
  <Card title="Yapılandırma" icon="sliders" href="/tr/gateway/configuration">
    Yapılandırma düzeni ve öncelik sırası.
  </Card>
  <Card title="Slash komutları" icon="terminal" href="/tr/tools/slash-commands">
    Komut kataloğu ve davranışı.
  </Card>
</CardGroup>
