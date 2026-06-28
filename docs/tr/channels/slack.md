---
read_when:
    - Slack’i kurma veya Slack soket, HTTP ya da relay modunda hata ayıklama
summary: Slack kurulumu ve çalışma zamanı davranışı (Socket Mode, HTTP Request URL'leri ve relay modu)
title: Slack
x-i18n:
    generated_at: "2026-06-28T00:15:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95acddb569b1ddc184609f0918336a7465d409351a0406f48fd5dd92a79ca9d6
    source_path: channels/slack.md
    workflow: 16
---

DM'ler ve kanallar için Slack uygulama entegrasyonlarıyla üretime hazır. Varsayılan mod Socket Mode'dur; HTTP İstek URL'leri de desteklenir. Relay modu, güvenilir bir yönlendiricinin Slack girişini yönettiği yönetilen dağıtımlar için tasarlanmıştır.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Slack DM'leri varsayılan olarak eşleştirme modunu kullanır.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma kılavuzları.
  </Card>
</CardGroup>

## Socket Mode veya HTTP İstek URL'lerini seçme

Her iki aktarım da üretime hazırdır ve mesajlaşma, slash komutları, App Home ve etkileşim için özellik eşitliğine ulaşır. Özelliklere göre değil, dağıtım şekline göre seçim yapın.

| Konu                         | Socket Mode (varsayılan)                                                                                                                             | HTTP İstek URL'leri                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Herkese açık Gateway URL'si  | Gerekli değil                                                                                                                                         | Gerekli (DNS, TLS, ters proxy veya tünel)                                                                      |
| Giden ağ                     | `wss-primary.slack.com` adresine giden WSS erişilebilir olmalıdır                                                                                     | Giden WS yok; yalnızca gelen HTTPS                                                                             |
| Gerekli token'lar            | Bot token'ı + `connections:write` ile App-Level Token                                                                                                 | Bot token'ı + Signing Secret                                                                                   |
| Geliştirici dizüstü / güvenlik duvarı arkasında | Olduğu gibi çalışır                                                                                                                   | Herkese açık bir tünel (ngrok, Cloudflare Tunnel, Tailscale Funnel) veya hazırlık Gateway'i gerekir           |
| Yatay ölçeklendirme          | Uygulama başına, ana bilgisayar başına bir Socket Mode oturumu; birden fazla Gateway ayrı Slack uygulamaları gerektirir                              | Durumsuz POST işleyici; birden fazla Gateway replikası bir yük dengeleyicinin arkasında tek bir uygulamayı paylaşabilir |
| Tek Gateway'de çoklu hesap   | Desteklenir; her hesap kendi WS bağlantısını açar                                                                                                     | Desteklenir; kayıtların çakışmaması için her hesabın benzersiz bir `webhookPath` değerine (varsayılan `/slack/events`) ihtiyacı vardır |
| Slash komutu aktarımı        | WS bağlantısı üzerinden teslim edilir; `slash_commands[].url` yok sayılır                                                                             | Slack, `slash_commands[].url` adresine POST gönderir; komutun dağıtılması için alan gereklidir                 |
| İstek imzalama               | Kullanılmaz (kimlik doğrulama App-Level Token'dır)                                                                                                    | Slack her isteği imzalar; OpenClaw `signingSecret` ile doğrular                                                |
| Bağlantı koptuğunda kurtarma | Slack SDK otomatik yeniden bağlanma etkindir; OpenClaw ayrıca başarısız Socket Mode oturumlarını sınırlı geri çekilme ile yeniden başlatır. Pong-timeout aktarım ayarı uygulanır. | Kopacak kalıcı bağlantı yoktur; yeniden denemeler Slack tarafından istek bazında yapılır                       |

<Note>
  Tek Gateway ana bilgisayarları, geliştirici dizüstü bilgisayarları ve `*.slack.com` adresine giden bağlantı kurabilen ancak gelen HTTPS kabul edemeyen şirket içi ağlar için **Socket Mode'u seçin**.

Bir yük dengeleyicinin arkasında birden fazla Gateway replikası çalıştırırken, giden WSS engelliyken gelen HTTPS'ye izin verildiğinde veya Slack Webhook'larını zaten bir ters proxy'de sonlandırıyorsanız **HTTP İstek URL'lerini seçin**.
</Note>

### Relay modu

Relay modu, Slack girişini OpenClaw gateway'den ayırır. Güvenilir bir yönlendirici tek Slack Socket Mode bağlantısına sahip olur, bir hedef gateway seçer ve yazılmış bir olayı kimliği doğrulanmış bir websocket üzerinden iletir. Gateway, giden Slack Web API çağrıları için bot token'ını kullanmaya devam eder.

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

Relay URL'si localhost'u hedeflemediği sürece `wss://` kullanmalıdır. Bearer token'ı ve yönlendirici rota tablosunu Slack yetkilendirme sınırının parçası olarak ele alın: yönlendirilen olaylar, yetkilendirilmiş etkinleştirmeler olarak normal Slack mesaj işleyicisine girer. Websocket `hello` karesindeki yönlendirici tarafından sağlanan bir `slack_identity`, varsayılan giden kullanıcı adını ve simgeyi ayarlayabilir; çağıran tarafından sağlanan açık kimlik yine önceliklidir. Relay bağlantısı, Socket Mode tarafından kullanılan aynı sınırlı geri çekilme zamanlamasıyla yeniden bağlanır ve bağlantısı her kesildiğinde yönlendirici tarafından sağlanan kimliği temizler.

## Kurulum

Kanalı yapılandırmadan önce Slack'i kurun:

```bash
openclaw plugins install @openclaw/slack
```

`plugins install`, plugin'i kaydeder ve etkinleştirir. Slack uygulamasını ve aşağıdaki kanal ayarlarını yapılandırana kadar plugin yine de hiçbir şey yapmaz. Genel plugin davranışı ve kurulum kuralları için [Plugins](/tr/tools/plugin) bölümüne bakın.

## Hızlı kurulum

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        [api.slack.com/apps](https://api.slack.com/apps/new) sayfasını açın → **Create New App** → **From a manifest** → çalışma alanınızı seçin → aşağıdaki manifestlerden birini yapıştırın → **Next** → **Create**.

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          **Recommended**, Slack plugin'inin tam özellik kümesiyle eşleşir: App Home, slash komutları, dosyalar, tepkiler, sabitlemeler, grup DM'leri ve emoji/kullanıcı grubu okumaları. Çalışma alanı politikası kapsamları kısıtladığında **Minimal** seçeneğini seçin; DM'leri, kanal/grup geçmişini, bahsetmeleri ve slash komutlarını kapsar ancak dosyaları, tepkileri, sabitlemeleri, grup DM (`mpim:*`), `emoji:read` ve `usergroups:read` kapsamlarını çıkarır. Kapsam başına gerekçe ve ek slash komutları gibi eklemeli seçenekler için [Manifest ve kapsam kontrol listesi](#manifest-and-scope-checklist) bölümüne bakın.
        </Note>

        Slack uygulamayı oluşturduktan sonra:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: `connections:write` ekleyin, kaydedin, App-Level Token'ı kopyalayın.
        - **Install App -> Install to Workspace**: Bot User OAuth Token'ı kopyalayın.

      </Step>

      <Step title="Configure OpenClaw">

        Önerilen SecretRef kurulumu:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
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

        Env yedeği (yalnızca varsayılan hesap):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
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
        [api.slack.com/apps](https://api.slack.com/apps/new) adresini açın → **Yeni Uygulama Oluştur** → **Bir manifestten** → çalışma alanınızı seçin → aşağıdaki manifestlerden birini yapıştırın → `https://gateway-host.example.com/slack/events` değerini herkese açık Gateway URL'nizle değiştirin → **İleri** → **Oluştur**.

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          **Önerilen**, Slack plugininin tam özellik setiyle eşleşir; **Minimal**, kısıtlayıcı çalışma alanları için dosyaları, tepkileri, pinleri, grup DM'lerini (`mpim:*`), `emoji:read` ve `usergroups:read` kapsamlarını çıkarır. Kapsam bazında gerekçe için [Manifest ve kapsam kontrol listesi](#manifest-and-scope-checklist) bölümüne bakın.
        </Note>

        <Info>
          Üç URL alanının (`slash_commands[].url`, `event_subscriptions.request_url` ve `interactivity.request_url` / `message_menu_options_url`) tümü aynı OpenClaw uç noktasını işaret eder. Slack'in manifest şeması bunların ayrı ayrı adlandırılmasını gerektirir, ancak OpenClaw yük türüne göre yönlendirdiği için tek bir `webhookPath` (varsayılan `/slack/events`) yeterlidir. `slash_commands[].url` olmadan eğik çizgi komutları HTTP modunda sessizce işlem yapmaz.
        </Info>

        Slack uygulamayı oluşturduktan sonra:

        - **Temel Bilgiler → Uygulama Kimlik Bilgileri**: istek doğrulaması için **İmzalama Sırrını** kopyalayın.
        - **Uygulamayı Kur -> Çalışma Alanına Kur**: Bot Kullanıcısı OAuth Token'ını kopyalayın.

      </Step>

      <Step title="Configure OpenClaw">

        Önerilen SecretRef kurulumu:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
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

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Socket Mode aktarım ayarı

OpenClaw, Socket Mode için Slack SDK istemcisi pong zaman aşımını varsayılan olarak 15 saniyeye ayarlar. Aktarım ayarlarını yalnızca çalışma alanına veya ana makineye özgü ayar gerektiğinde geçersiz kılın:

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

Bunu yalnızca Slack websocket pong/sunucu ping zaman aşımlarını günlüğe kaydeden veya bilinen olay döngüsü açlığı olan ana makinelerde çalışan Socket Mode çalışma alanları için kullanın. `clientPingTimeout`, SDK bir istemci pingi gönderdikten sonraki pong bekleme süresidir; `serverPingTimeout`, Slack sunucu pingleri için bekleme süresidir. Uygulama mesajları ve olayları, aktarım canlılığı sinyalleri değil uygulama durumudur.

Notlar:

- `socketMode`, HTTP İstek URL'si modunda yok sayılır.
- Temel `channels.slack.socketMode` ayarları, geçersiz kılınmadığı sürece tüm Slack hesaplarına uygulanır. Hesap bazında geçersiz kılmalar `channels.slack.accounts.<accountId>.socketMode` kullanır; bu bir nesne geçersiz kılması olduğundan, o hesap için istediğiniz her socket ayar alanını ekleyin.
- Yalnızca `clientPingTimeout` için bir OpenClaw varsayılanı vardır (`15000`). `serverPingTimeout` ve `pingPongLoggingEnabled`, yalnızca yapılandırıldığında Slack SDK'ya geçirilir.
- Socket Mode yeniden başlatma geri çekilmesi yaklaşık 2 saniyeden başlar ve yaklaşık 30 saniyede sınırlanır. Kurtarılabilir başlatma, başlatma beklemesi ve bağlantı kesilme hataları kanal durana kadar yeniden denenir. Geçersiz kimlik doğrulama, iptal edilmiş tokenlar veya eksik kapsamlar gibi kalıcı hesap ve kimlik bilgisi hataları ise sonsuza kadar yeniden denemek yerine hızlıca başarısız olur.

## Manifest ve kapsam kontrol listesi

Temel Slack uygulama manifesti Socket Mode ve HTTP İstek URL'leri için aynıdır. Yalnızca `settings` bloğu (ve eğik çizgi komutu `url`) farklıdır.

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

**HTTP İstek URL'leri modu** için `settings` değerini HTTP varyantıyla değiştirin ve her eğik çizgi komutuna `url` ekleyin. Herkese açık URL gereklidir:

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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

Yukarıdaki varsayılanları genişleten farklı özellikleri gösterin.

Varsayılan manifest, Slack Uygulama Ana Sayfası **Ana Sayfa** sekmesini etkinleştirir ve `app_home_opened` olayına abone olur. Bir çalışma alanı üyesi Ana Sayfa sekmesini açtığında OpenClaw, `views.publish` ile güvenli bir varsayılan Ana Sayfa görünümü yayımlar; konuşma yükü veya özel yapılandırma dahil edilmez. **Mesajlar** sekmesi Slack DM'leri için etkin kalır. Manifest ayrıca `features.assistant_view`, `assistant:write`, `assistant_thread_started` ve `assistant_thread_context_changed` ile Slack asistan iş parçacıklarını etkinleştirir; asistan iş parçacıkları kendi OpenClaw iş parçacığı oturumlarına yönlendirilir ve Slack tarafından sağlanan iş parçacığı bağlamını agent için kullanılabilir tutar.

<AccordionGroup>
  <Accordion title="İsteğe bağlı yerel eğik çizgi komutları">

    Birden çok [yerel eğik çizgi komutu](#commands-and-slash-behavior), bazı ayrıntılarla tek bir yapılandırılmış komut yerine kullanılabilir:

    - `/status` yerine `/agentstatus` kullanın, çünkü `/status` komutu ayrılmıştır.
    - Aynı anda en fazla 25 eğik çizgi komutu kullanılabilir hale getirilebilir.

    Mevcut `features.slash_commands` bölümünüzü [kullanılabilir komutlar](/tr/tools/slash-commands#command-list) listesinin bir alt kümesiyle değiştirin:

    <Tabs>
      <Tab title="Socket Mode (default)">

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
      "command": "/approve",
      "description": "Approve or deny pending approval requests",
      "usage_hint": "<id> <decision>"
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
    Giden mesajların varsayılan Slack uygulama kimliği yerine etkin agent kimliğini (özel kullanıcı adı ve simge) kullanmasını istiyorsanız `chat:write.customize` bot kapsamını ekleyin.

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
- Relay modu `botToken` ile birlikte `relay.url`, `relay.authToken` ve `relay.gatewayId` gerektirir; uygulama belirteci veya imzalama gizli anahtarı kullanmaz.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` ve `userToken` düz metin
  dizelerini veya SecretRef nesnelerini kabul eder.
- Yapılandırma belirteçleri env yedeğini geçersiz kılar.
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env yedeği yalnızca varsayılan hesaba uygulanır.
- `userToken` yalnızca yapılandırma üzerinden ayarlanır (env yedeği yoktur) ve varsayılan olarak salt okunur davranışa (`userTokenReadOnly: true`) ayarlanır.

Durum anlık görüntüsü davranışı:

- Slack hesap incelemesi, kimlik bilgisi başına `*Source` ve `*Status`
  alanlarını izler (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Durum `available`, `configured_unavailable` veya `missing` olur.
- `configured_unavailable`, hesabın SecretRef veya başka bir satır içi olmayan gizli kaynak üzerinden yapılandırıldığı, ancak geçerli komut/çalışma zamanı yolunun gerçek değeri çözemediği anlamına gelir.
- HTTP modunda `signingSecretStatus` dahil edilir; Socket Mode’da
  gerekli çift `botTokenStatus` + `appTokenStatus` olur.

<Tip>
Eylemler/dizin okumaları için, yapılandırıldığında kullanıcı belirteci tercih edilebilir. Yazmalarda bot belirteci tercih edilmeye devam eder; kullanıcı belirteciyle yazmalara yalnızca `userTokenReadOnly: false` olduğunda ve bot belirteci kullanılamadığında izin verilir.
</Tip>

## Eylemler ve kapılar

Slack eylemleri `channels.slack.actions.*` tarafından denetlenir.

Geçerli Slack araçlarında kullanılabilir eylem grupları:

| Grup       | Varsayılan |
| ---------- | ---------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

Geçerli Slack mesaj eylemleri arasında `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` ve `emoji-list` bulunur. `download-file`, gelen dosya yer tutucularında gösterilen Slack dosya kimliklerini kabul eder ve görüntüler için görüntü önizlemeleri, diğer dosya türleri için yerel dosya meta verileri döndürür.

## Erişim denetimi ve yönlendirme

  <Tabs>
  <Tab title="DM ilkesi">
    `channels.slack.dmPolicy` DM erişimini denetler. `channels.slack.allowFrom` kurallı DM izin listesidir.

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

    Çoklu hesap önceliği:

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

    Kanal izin listesi `channels.slack.channels` altında bulunur ve yapılandırma anahtarları olarak **kararlı Slack kanal kimlikleri** (örneğin `C12345678`) kullanmalıdır.

    Çalışma zamanı notu: `channels.slack` tamamen eksikse (yalnızca env kurulumu), çalışma zamanı `groupPolicy="allowlist"` değerine geri döner ve bir uyarı kaydeder (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

    Ad/kimlik çözümleme:

    - kanal izin listesi girdileri ve DM izin listesi girdileri, token erişimi izin verdiğinde başlangıçta çözümlenir
    - çözümlenmemiş kanal adı girdileri yapılandırıldığı gibi tutulur, ancak varsayılan olarak yönlendirme için yok sayılır
    - gelen yetkilendirme ve kanal yönlendirme varsayılan olarak önce kimlik temellidir; doğrudan kullanıcı adı/slug eşleşmesi `channels.slack.dangerouslyAllowNameMatching: true` gerektirir

    <Warning>
    Ada dayalı anahtarlar (`#channel-name` veya `channel-name`) `groupPolicy: "allowlist"` altında eşleşmez. Kanal araması varsayılan olarak önce kimlik temellidir, bu nedenle ada dayalı bir anahtar hiçbir zaman başarıyla yönlendirilmez ve o kanaldaki tüm iletiler sessizce engellenir. Bu, yönlendirme için kanal anahtarının gerekmediği ve ada dayalı bir anahtarın çalışıyor gibi göründüğü `groupPolicy: "open"` değerinden farklıdır.

    Anahtar olarak her zaman Slack kanal kimliğini kullanın. Bulmak için: Slack'te kanala sağ tıklayın → **Bağlantıyı kopyala** — kimlik (`C...`) URL'nin sonunda görünür.

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
    - bot kullanıcısı ilgili kullanıcı grubunun üyesiyse Slack kullanıcı grubu bahsetmesi (`<!subteam^S...>`); `usergroups:read` gerektirir
    - bahsetme regex desenleri (`agents.list[].groupChat.mentionPatterns`, geri dönüş `messages.groupChat.mentionPatterns`)
    - örtük bot yanıtı konu davranışı (`thread.requireExplicitMention` `true` olduğunda devre dışıdır)

    Kanal başına denetimler (`channels.slack.channels.<id>`; adlar yalnızca başlangıç çözümlemesi veya `dangerouslyAllowNameMatching` üzerinden):

    - `requireMention`
    - `users` (izin listesi)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` anahtar biçimi: `channel:`, `id:`, `e164:`, `username:`, `name:` veya `"*"` joker karakteri
      (eski öneksiz anahtarlar hâlâ yalnızca `id:` ile eşlenir)

    `allowBots`, kanallar ve özel kanallar için tutucudur: bot tarafından yazılan oda mesajları yalnızca gönderen bot o odanın `users` izin listesinde açıkça yer aldığında veya `channels.slack.allowFrom` içindeki en az bir açık Slack sahipliği kimliği o anda odanın üyesi olduğunda kabul edilir. Joker karakterler ve görünen ad sahipliği girdileri sahip varlığını karşılamaz. Sahip varlığı Slack `conversations.members` kullanır; uygulamanın oda türü için eşleşen okuma kapsamına sahip olduğundan emin olun (`channels:read` genel kanallar için, `groups:read` özel kanallar için). Üye araması başarısız olursa OpenClaw, bot tarafından yazılan oda mesajını düşürür.

    Kabul edilen bot tarafından yazılmış Slack mesajları, paylaşılan [bot döngüsü koruması](/tr/channels/bot-loop-protection) kullanır. Varsayılan bütçe için `channels.defaults.botLoopProtection` yapılandırın, ardından bir çalışma alanı veya kanal farklı bir sınıra ihtiyaç duyduğunda `channels.slack.botLoopProtection` ya da `channels.slack.channels.<id>.botLoopProtection` ile geçersiz kılın.

  </Tab>
</Tabs>

## İleti dizileri, oturumlar ve yanıt etiketleri

- DM'ler `direct` olarak; kanallar `channel` olarak; MPIM'ler `group` olarak yönlendirilir.
- Slack rota bağlamaları ham eş kimliklerini ve `channel:C12345678`, `user:U12345678` ve `<@U12345678>` gibi Slack hedef biçimlerini kabul eder.
- Varsayılan `session.dmScope=main` ile Slack DM'leri aracının ana oturumuna daraltılır.
- Kanal oturumları: `agent:<agentId>:slack:channel:<channelId>`.
- Sıradan üst düzey kanal mesajları, `replyToMode` `off` olmadığında bile kanal başına oturumda kalır.
- Slack ileti dizisi yanıtları, giden yanıt ileti dizileri `replyToMode="off"` ile devre dışı bırakılmış olsa bile, oturum son ekleri için üst Slack `thread_ts` değerini kullanır (`:thread:<threadTs>`).
- OpenClaw, bu kökün görünür bir Slack ileti dizisi başlatması beklendiğinde uygun bir üst düzey kanal kökünü `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` içine eker; böylece kök ve sonraki ileti dizisi yanıtları tek bir OpenClaw oturumunu paylaşır. Bu, `app_mention` olayları, açık bot veya yapılandırılmış bahsetme deseni eşleşmeleri ve `off` olmayan `replyToMode` ile `requireMention: false` kanalları için geçerlidir.
- `channels.slack.thread.historyScope` varsayılanı `thread`; `thread.inheritParent` varsayılanı `false` değeridir.
- `channels.slack.thread.initialHistoryLimit`, yeni bir ileti dizisi oturumu başladığında kaç mevcut ileti dizisi mesajının getirileceğini denetler (varsayılan `20`; devre dışı bırakmak için `0` ayarlayın).
- `channels.slack.thread.requireExplicitMention` (varsayılan `false`): `true` olduğunda örtük ileti dizisi bahsetmelerini bastırır; böylece bot, ileti dizisine zaten katılmış olsa bile yalnızca ileti dizileri içindeki açık `@bot` bahsetmelerine yanıt verir. Bu olmadan, botun katıldığı bir ileti dizisindeki yanıtlar `requireMention` geçidini atlar.

Yanıt ileti dizisi denetimleri:

- `channels.slack.replyToMode`: `off|first|all|batched` (varsayılan `off`)
- `channels.slack.replyToModeByChatType`: `direct|group|channel` başına
- doğrudan sohbetler için eski yedek: `channels.slack.dm.replyToMode`

Manuel yanıt etiketleri desteklenir:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

`message` aracından açık Slack ileti dizisi yanıtları için, Slack'ten ileti dizisi yanıtını üst kanala da yayımlamasını istemek üzere `action: "send"` ve `threadId` veya `replyTo` ile `replyBroadcast: true` ayarlayın. Bu, Slack'in `chat.postMessage` `reply_broadcast` bayrağına eşlenir ve medya yüklemeleri için değil, yalnızca metin veya Block Kit gönderimleri için desteklenir.

Bir `message` araç çağrısı bir Slack ileti dizisi içinde çalıştığında ve aynı kanalı hedeflediğinde, OpenClaw normalde mevcut Slack ileti dizisini `replyToMode` uyarınca devralır. Bunun yerine yeni bir üst kanal mesajını zorlamak için `action: "send"` veya `action: "upload-file"` üzerinde `topLevel: true` ayarlayın. `threadId: null` aynı üst düzey çıkış seçeneği olarak kabul edilir.

<Note>
`replyToMode="off"`, açık `[[reply_to_*]]` etiketleri dahil giden Slack yanıt ileti dizilerini devre dışı bırakır. Gelen Slack ileti dizisi oturumlarını düzleştirmez: bir Slack ileti dizisi içinde zaten yayımlanmış mesajlar yine de `:thread:<threadTs>` oturumuna yönlendirilir. Bu, açık etiketlerin `"off"` modunda hâlâ dikkate alındığı Telegram'dan farklıdır. Slack ileti dizileri mesajları kanaldan gizlerken Telegram yanıtları satır içinde görünür kalır.
</Note>

## Onay tepkileri

`ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir. `ackReactionScope`, bu emojinin gerçekte _ne zaman_ gönderileceğine karar verir.

### Emoji (`ackReaction`)

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- aracı kimliği emoji yedeği (`agents.list[].identity.emoji`, aksi halde `"eyes"` / 👀)

Notlar:

- Slack kısa kodlar bekler (örneğin `"eyes"`).
- Slack hesabı için veya genel olarak tepkiyi devre dışı bırakmak üzere `""` kullanın.

### Kapsam (`messages.ackReactionScope`)

Slack sağlayıcısı kapsamı `messages.ackReactionScope` değerinden okur (varsayılan `"group-mentions"`). Bugün Slack hesabı veya Slack kanal düzeyinde geçersiz kılma yoktur; değer Gateway genelinde küreseldir.

Değerler:

- `"all"`: DM'lerde ve gruplarda tepki ver.
- `"direct"`: yalnızca DM'lerde tepki ver.
- `"group-all"`: her grup mesajında tepki ver (DM yok).
- `"group-mentions"` (varsayılan): gruplarda tepki ver, ancak yalnızca bottan bahsedildiğinde (veya kabul etmiş grup bahsedilebilirlerinde). **DM'ler hariç tutulur.**
- `"off"` / `"none"`: hiçbir zaman tepki verme.

<Note>
Varsayılan kapsam (`"group-mentions"`) doğrudan mesajlarda onay tepkilerini tetiklemez. Yapılandırılmış `ackReaction` değerini (örneğin `"eyes"`) gelen Slack DM'lerinde görmek için `messages.ackReactionScope` değerini `"direct"` veya `"all"` olarak ayarlayın. `messages.ackReactionScope`, Slack sağlayıcısı başlatılırken okunur; bu nedenle değişikliğin etkili olması için Gateway yeniden başlatması gerekir.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // react in DMs and groups
  },
}
```

## Metin akışı

`channels.slack.streaming`, canlı önizleme davranışını denetler:

- `off`: canlı önizleme akışını devre dışı bırak.
- `partial` (varsayılan): önizleme metnini en son kısmi çıktı ile değiştir.
- `block`: parçalı önizleme güncellemeleri ekle.
- `progress`: oluşturma sırasında ilerleme durumu metnini göster, ardından son metni gönder.
- `streaming.preview.toolProgress`: taslak önizleme etkin olduğunda araç/ilerleme güncellemelerini aynı düzenlenen önizleme mesajına yönlendirir (varsayılan: `true`). Ayrı araç/ilerleme mesajlarını korumak için `false` ayarlayın.
- `streaming.preview.commandText` / `streaming.progress.commandText`: ham komut/exec metnini gizlerken kompakt araç ilerleme satırlarını korumak için `status` olarak ayarlayın (varsayılan: `raw`).

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

`channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode` `partial` olduğunda Slack yerel metin akışını denetler (varsayılan: `true`).

Slack yerel ilerleme görev kartları, ilerleme modu için isteğe bağlıdır. İş çalışırken Slack'e yerel bir plan/görev kartı göndermek, ardından tamamlandığında aynı görev kartını güncellemek için `channels.slack.streaming.mode="progress"` ile `channels.slack.streaming.progress.nativeTaskCards` değerini `true` olarak ayarlayın. Bu bayrak olmadan, ilerleme modu taşınabilir taslak önizleme davranışını korur.

- Yerel metin akışının ve Slack asistan ileti dizisi durumunun görünmesi için bir yanıt ileti dizisi kullanılabilir olmalıdır. İleti dizisi seçimi yine `replyToMode` değerini izler.
- Kanal, grup sohbeti ve üst düzey DM kökleri, yerel akış kullanılamadığında veya yanıt ileti dizisi olmadığında normal taslak önizlemeyi kullanmaya devam edebilir.
- Üst düzey Slack DM'leri varsayılan olarak ileti dizisi dışında kalır; bu nedenle Slack'in ileti dizisi tarzı yerel akış/durum önizlemesini göstermezler. OpenClaw bunun yerine DM içinde bir taslak önizleme yayımlar ve düzenler.
- Medya ve metin dışı yükler normal teslimata geri döner.
- Medya/hata sonları bekleyen önizleme düzenlemelerini iptal eder; uygun metin/blok sonları yalnızca önizlemeyi yerinde düzenleyebildiklerinde boşaltılır.
- Akış yanıt ortasında başarısız olursa OpenClaw kalan yükler için normal teslimata geri döner.

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

Slack yerel ilerleme görev kartlarını kabul edin:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

Eski anahtarlar:

- `channels.slack.streamMode` (`replace | status_final | append`), `channels.slack.streaming.mode` için eski bir çalışma zamanı takma adıdır.
- Boole `channels.slack.streaming`, `channels.slack.streaming.mode` ve `channels.slack.streaming.nativeTransport` için eski bir çalışma zamanı takma adıdır.
- Eski `channels.slack.nativeStreaming`, `channels.slack.streaming.nativeTransport` için bir çalışma zamanı takma adıdır.
- Kalıcı Slack akış yapılandırmasını kurallı anahtarlara yeniden yazmak için `openclaw doctor --fix` çalıştırın.

## Yazıyor tepkisi yedeği

`typingReaction`, OpenClaw bir yanıtı işlerken gelen Slack mesajına geçici bir tepki ekler, ardından çalışma bittiğinde bunu kaldırır. Bu, varsayılan bir "yazıyor..." durum göstergesi kullanan ileti dizisi yanıtlarının dışında en kullanışlıdır.

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notlar:

- Slack kısa kodlar bekler (örneğin `"hourglass_flowing_sand"`).
- Tepki en iyi çaba esasına göredir ve yanıt veya hata yolu tamamlandıktan sonra temizlik otomatik olarak denenir.

## Medya, parçalama ve teslimat

<AccordionGroup>
  <Accordion title="Gelen ekler">
    Slack dosya ekleri, Slack tarafından barındırılan özel URL'lerden indirilir (token ile kimlik doğrulamalı istek akışı) ve getirme başarılı olduğunda ve boyut sınırları izin verdiğinde medya deposuna yazılır. Dosya yer tutucuları Slack `fileId` değerini içerir; böylece aracılar özgün dosyayı `download-file` ile getirebilir.

    İndirmeler sınırlı boşta kalma ve toplam zaman aşımları kullanır. Slack dosya alma işlemi takılır veya başarısız olursa OpenClaw mesajı işlemeye devam eder ve dosya yer tutucusuna geri döner.

    Çalışma zamanı gelen boyut üst sınırı, `channels.slack.mediaMaxMb` ile geçersiz kılınmadığı sürece varsayılan olarak `20MB` olur.

  </Accordion>

  <Accordion title="Giden metin ve dosyalar">
    - metin parçaları `channels.slack.textChunkLimit` kullanır (varsayılan 4000)
    - `channels.slack.chunkMode="newline"` paragraf öncelikli bölmeyi etkinleştirir
    - dosya gönderimleri Slack yükleme API'lerini kullanır ve ileti dizisi yanıtlarını (`thread_ts`) içerebilir
    - giden medya üst sınırı yapılandırıldığında `channels.slack.mediaMaxMb` değerini izler; aksi halde kanal gönderimleri medya hattındaki MIME türü varsayılanlarını kullanır

  </Accordion>

  <Accordion title="Teslimat hedefleri">
    Tercih edilen açık hedefler:

    - DM'ler için `user:<id>`
    - kanallar için `channel:<id>`

    Yalnızca metin/blok Slack DM'leri doğrudan kullanıcı kimliklerine gönderi yayımlayabilir; dosya yüklemeleri ve ileti dizili gönderimler önce Slack konuşma API'leri aracılığıyla DM'yi açar, çünkü bu yollar somut bir konuşma kimliği gerektirir.

  </Accordion>
</AccordionGroup>

## Komutlar ve slash davranışı

Slash komutları Slack'te tek bir yapılandırılmış komut veya birden çok yerel komut olarak görünür. Komut varsayılanlarını değiştirmek için `channels.slack.slashCommand` yapılandırın:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Yerel komutlar Slack uygulamanızda [ek manifest ayarları](#additional-manifest-settings) gerektirir ve bunun yerine küresel yapılandırmalarda `channels.slack.commands.native: true` veya `commands.native: true` ile etkinleştirilir.

- Yerel komut otomatik modu Slack için **kapalıdır**, bu nedenle `commands.native: "auto"` Slack yerel komutlarını etkinleştirmez.

```txt
/help
```

Yerel bağımsız değişken menüleri, seçilen bir seçenek değerini göndermeden önce bir onay modali gösteren uyarlanabilir bir işleme stratejisi kullanır:

- en fazla 5 seçenek: düğme blokları
- 6-100 seçenek: statik seçim menüsü
- 100'den fazla seçenek: etkileşim seçenek işleyicileri kullanılabilir olduğunda eşzamansız seçenek filtrelemeli dış seçim
- Slack sınırları aşıldı: kodlanmış seçenek değerleri düğmelere geri döner

```txt
/think
```

Slash oturumları `agent:<agentId>:slack:slash:<userId>` gibi yalıtılmış anahtarlar kullanır ve komut yürütmelerini yine `CommandTargetSessionKey` kullanarak hedef konuşma oturumuna yönlendirir.

## Etkileşimli yanıtlar

Slack, ajan tarafından yazılmış etkileşimli yanıt denetimlerini işleyebilir, ancak bu özellik varsayılan olarak devre dışıdır.
Yeni ajan, CLI ve Plugin çıktısı için paylaşılan
`presentation` düğmelerini veya seçim bloklarını tercih edin. Bunlar aynı Slack etkileşim
yolunu kullanırken diğer kanallarda da geriye uyumlu şekilde basitleşir.

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

Etkinleştirildiğinde, ajanlar kullanımdan kaldırılmış yalnızca Slack'e özgü yanıt direktifleri yaymaya devam edebilir:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Bu direktifler Slack Block Kit'e derlenir ve tıklamaları veya seçimleri
mevcut Slack etkileşim olayı yolu üzerinden geri yönlendirir. Bunları eski
istemler ve Slack'e özgü kaçış yolları için tutun; yeni taşınabilir
denetimler için paylaşılan sunumu kullanın.

Direktif derleyici API'leri de yeni üretici kodu için kullanımdan kaldırılmıştır:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Yeni Slack'te işlenen denetimler için `presentation` yüklerini ve
`buildSlackPresentationBlocks(...)` kullanın.

Notlar:

- Bu, Slack'e özgü eski UI'dır. Diğer kanallar Slack Block
  Kit direktiflerini kendi düğme sistemlerine çevirmez.
- Etkileşimli geri çağrı değerleri, ajan tarafından yazılmış ham değerler değil, OpenClaw tarafından oluşturulan opak belirteçlerdir.
- Oluşturulan etkileşimli bloklar Slack Block Kit sınırlarını aşacaksa, OpenClaw geçersiz bir blok yükü göndermek yerine özgün metin yanıtına geri döner.

### Plugin sahipli modal gönderimleri

Etkileşimli bir işleyici kaydeden Slack Plugin'leri, OpenClaw yükü
ajan tarafından görülebilen sistem olayı için sıkıştırmadan önce modal
`view_submission` ve `view_closed` yaşam döngüsü olaylarını da alabilir.
Bir Slack modali açarken bu yönlendirme desenlerinden birini kullanın:

- `callback_id` değerini `openclaw:<namespace>:<payload>` olarak ayarlayın.
- Veya mevcut bir `callback_id` değerini koruyun ve modal `private_metadata` içine `pluginInteractiveData:
"<namespace>:<payload>"` koyun.

İşleyici `ctx.interaction.kind` değerini `view_submission` veya
`view_closed` olarak, normalleştirilmiş `inputs` değerlerini ve Slack'ten gelen tam ham
`stateValues` nesnesini alır. Yalnızca geri çağrı kimliğiyle yönlendirme, Plugin işleyicisini çağırmak için yeterlidir; modal aynı zamanda ajan tarafından görülebilen bir sistem olayı üretmeliyse mevcut modal `private_metadata` kullanıcı/oturum yönlendirme alanlarını ekleyin. Ajan kompakt, redakte edilmiş bir `Slack interaction: ...` sistem olayı alır. İşleyici
`systemEvent.summary`, `systemEvent.reference` veya `systemEvent.data` döndürürse, bu
alanlar kompakt olaya eklenir; böylece ajan, eksiksiz form yükünü görmeden
Plugin sahipli depolamaya başvurabilir.

## Slack'te yerel onaylar

Slack, Web UI veya terminale geri dönmek yerine etkileşimli düğmeler ve etkileşimlerle yerel bir onay istemcisi olarak davranabilir.

- Exec ve Plugin onayları Slack'e özgü Block Kit istemleri olarak işlenebilir.
- `channels.slack.execApprovals.*`, yerel exec onay istemcisi etkinleştirme ve DM/kanal yönlendirme yapılandırması olarak kalır.
- Exec onayı DM'leri `channels.slack.execApprovals.approvers` veya `commands.ownerAllowFrom` kullanır.
- Plugin onayları, Slack kaynak oturum için yerel onay istemcisi olarak etkinse veya `approvals.plugin` kaynak Slack oturumuna ya da bir Slack hedefine yönlendiriyorsa Slack'e özgü düğmeler kullanır.
- Plugin onayı DM'leri `channels.slack.allowFrom`, adlandırılmış hesap `allowFrom` veya hesap varsayılan rotasından Slack Plugin onaylayıcılarını kullanır.
- Onaylayıcı yetkilendirmesi yine zorunlu tutulur: yalnızca exec onaylayıcıları, aynı zamanda Plugin onaylayıcısı değillerse Plugin isteklerini onaylayamaz.

Bu, diğer kanallarla aynı paylaşılan onay düğmesi yüzeyini kullanır. Slack uygulama ayarlarınızda `interactivity` etkin olduğunda, onay istemleri doğrudan konuşmada Block Kit düğmeleri olarak işlenir.
Bu düğmeler mevcut olduğunda birincil onay UX'i bunlardır; OpenClaw
yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu söylediğinde manuel bir `/approve` komutu eklemelidir.

Yapılandırma yolu:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `agentFilter`, `sessionFilter`

Slack, `enabled` ayarlanmamışsa veya `"auto"` ise ve en az bir
exec onaylayıcı çözümleniyorsa yerel exec onaylarını otomatik olarak etkinleştirir. Slack, Slack Plugin onaylayıcıları çözümlendiğinde ve istek yerel istemci filtreleriyle eşleştiğinde bu yerel istemci
yolu üzerinden yerel Plugin onaylarını da işleyebilir. Slack'i yerel onay istemcisi olarak açıkça devre dışı bırakmak için
`enabled: false` ayarlayın. Onaylayıcılar çözümlendiğinde yerel onayları zorla açmak için `enabled: true` ayarlayın. Slack exec onaylarını devre dışı bırakmak,
`approvals.plugin` üzerinden etkinleştirilen yerel Slack Plugin onayı teslimini devre dışı bırakmaz; Plugin onayı
teslimi bunun yerine Slack Plugin onaylayıcılarını kullanır.

Açık Slack exec onay yapılandırması olmadan varsayılan davranış:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Açık Slack'e özgü yapılandırma yalnızca onaylayıcıları geçersiz kılmak, filtre eklemek veya
kaynak sohbet teslimine dahil olmak istediğinizde gereklidir:

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
ayrıdır; Slack yerel teslimi, bu geri dönüşü yalnızca Slack Plugin
onayı isteğini yerel olarak işleyebildiğinde bastırır.

Aynı sohbette `/approve`, komutları zaten destekleyen Slack kanallarında ve DM'lerde de çalışır. Tam onay iletme modeli için [Exec onayları](/tr/tools/exec-approvals) bölümüne bakın.

## Olaylar ve operasyonel davranış

- Mesaj düzenlemeleri/silmeleri sistem olaylarına eşlenir.
- Konu yayınları ("Kanala da gönder" konu yanıtları) normal kullanıcı mesajları olarak işlenir.
- Tepki ekleme/kaldırma olayları sistem olaylarına eşlenir.
- Üye katılma/ayrılma, kanal oluşturulma/yeniden adlandırılma ve sabitleme ekleme/kaldırma olayları sistem olaylarına eşlenir.
- `configWrites` etkin olduğunda `channel_id_changed` kanal yapılandırma anahtarlarını taşıyabilir.
- Kanal konu/amaç meta verileri güvenilmeyen bağlam olarak değerlendirilir ve yönlendirme bağlamına enjekte edilebilir.
- Konu başlatıcı ve ilk konu geçmişi bağlamı tohumlaması, geçerli olduğunda yapılandırılmış gönderen izin listelerine göre filtrelenir.
- Blok eylemleri, kısayollar ve modal etkileşimleri zengin yük alanlarıyla yapılandırılmış `Slack interaction: ...` sistem olayları yayar:
  - blok eylemleri: seçilen değerler, etiketler, seçici değerleri ve `workflow_*` meta verileri
  - genel kısayollar: geri çağrı ve aktör meta verileri, aktörün doğrudan oturumuna yönlendirilir
  - mesaj kısayolları: geri çağrı, aktör, kanal, konu ve seçili mesaj bağlamı
  - yönlendirilmiş kanal meta verileri ve form girdileriyle modal `view_submission` ve `view_closed` olayları

Slack uygulama yapılandırmanızda genel veya mesaj kısayolları tanımlayın ve boş olmayan herhangi bir geri çağrı kimliği kullanın. OpenClaw eşleşen kısayol yüklerini onaylar, diğer Slack etkileşimleriyle aynı DM/kanal gönderen politikasını uygular ve temizlenmiş olayı yönlendirilen ajan oturumu için kuyruğa alır. Tetikleyici kimlikleri ve yanıt URL'leri ajan bağlamından redakte edilir.

## Yapılandırma referansı

Birincil referans: [Yapılandırma referansı - Slack](/tr/gateway/config-channels#slack).

<Accordion title="Yüksek sinyalli Slack alanları">

- mod/kimlik doğrulama: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM erişimi: `dm.enabled`, `dmPolicy`, `allowFrom` (eski: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- uyumluluk anahtarı: `dangerouslyAllowNameMatching` (son çare; gerekmedikçe kapalı tutun)
- kanal erişimi: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- konular/geçmiş: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- teslim: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- önizlemeler: `unfurlLinks` (varsayılan: `false`), `chat.postMessage` bağlantı/medya önizlemesi denetimi için `unfurlMedia`; bağlantı önizlemelerine geri dönmek için `unfurlLinks: true` ayarlayın
- operasyonlar/özellikler: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Sorun giderme

<AccordionGroup>
  <Accordion title="Kanallarda yanıt yok">
    Sırayla kontrol edin:

    - `groupPolicy`
    - kanal izin listesi (`channels.slack.channels`) — **anahtarlar kanal kimlikleri olmalıdır** (`C12345678`), adlar değil (`#channel-name`). Ad tabanlı anahtarlar, kanal yönlendirmesi varsayılan olarak kimlik öncelikli olduğundan `groupPolicy: "allowlist"` altında sessizce başarısız olur. Bir kimlik bulmak için: Slack'te kanala sağ tıklayın → **Bağlantıyı kopyala** — URL'nin sonundaki `C...` değeri kanal kimliğidir.
    - `requireMention`
    - kanal başına `users` izin listesi
    - `messages.groupChat.visibleReplies`: normal grup/kanal istekleri varsayılan olarak `"automatic"` kullanır. `"message_tool"` seçtiyseniz ve günlükler `message(action=send)` çağrısı olmadan asistan metni gösteriyorsa, model görünür message-tool yolunu kaçırmıştır. Son metin bu modda özel kalır; bastırılmış yük meta verileri için gateway ayrıntılı günlüğünü inceleyin veya her normal asistan son yanıtının eski yol üzerinden gönderilmesini istiyorsanız bunu `"automatic"` olarak ayarlayın.
    - `messages.groupChat.unmentionedInbound`: `"room_event"` ise, bahsedilmeyen izinli kanal sohbeti ortam bağlamıdır ve ajan `message` aracını çağırmadıkça sessiz kalır. [Ortam oda olayları](/tr/channels/ambient-room-events) bölümüne bakın.

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

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
    - eşleştirme onayları / izin listesi girdileri (`dmPolicy: "open"` yine de `channels.slack.allowFrom: ["*"]` gerektirir)
    - grup DM'leri MPIM işlemeyi kullanır; `channels.slack.dm.groupEnabled` etkinleştirin ve yapılandırılmışsa MPIM'i `channels.slack.dm.groupChannels` içine ekleyin
    - Slack Assistant DM olayları: `drop message_changed` ifadesinden bahseden ayrıntılı günlükler
      genellikle Slack'in mesaj meta verilerinde kurtarılabilir bir insan gönderen olmadan
      düzenlenmiş bir Assistant konu olayı gönderdiği anlamına gelir

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket modu bağlanmıyor">
    Slack uygulama ayarlarında bot + uygulama belirteçlerini ve Socket Mode etkinleştirmesini doğrulayın.
    App-Level Token `connections:write` gerektirir ve Bot User OAuth Token
    bot belirteci, uygulama belirteciyle aynı Slack uygulamasına/çalışma alanına ait olmalıdır.

    `openclaw channels status --probe --json` çıktısı `botTokenStatus` veya
    `appTokenStatus: "configured_unavailable"` gösteriyorsa Slack hesabı
    yapılandırılmıştır ancak mevcut çalışma zamanı SecretRef destekli
    değeri çözememiştir.

    `slack socket mode failed to start; retry ...` gibi günlükler kurtarılabilir
    başlatma hatalarıdır. Eksik kapsamlar, iptal edilmiş token'lar ve geçersiz kimlik doğrulama ise
    bunun yerine hızlı başarısız olur. Bir `slack token mismatch ...` günlüğü, bot token'ının ve uygulama token'ının
    farklı Slack uygulamalarına ait göründüğü anlamına gelir; Slack uygulaması kimlik bilgilerini düzeltin.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    Doğrulayın:

    - imzalama sırrı
    - webhook yolu
    - Slack Request URL'leri (Events + Interactivity + Slash Commands)
    - HTTP hesabı başına benzersiz `webhookPath`
    - herkese açık URL TLS'i sonlandırır ve istekleri Gateway yoluna iletir
    - Slack uygulamasının `request_url` yolu, `channels.slack.webhookPath` ile tam olarak eşleşir (varsayılan `/slack/events`)

    Hesap anlık görüntülerinde `signingSecretStatus: "configured_unavailable"`
    görünürse, HTTP hesabı yapılandırılmıştır ancak mevcut çalışma zamanı
    SecretRef destekli imzalama sırrını çözememiştir.

    Yinelenen bir `slack: webhook path ... already registered` günlüğü, iki HTTP
    hesabının aynı `webhookPath` değerini kullandığı anlamına gelir; her hesaba ayrı bir yol verin.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    Şunu amaçlayıp amaçlamadığınızı doğrulayın:

    - Slack'te kayıtlı eşleşen slash commands ile yerel komut modu (`channels.slack.commands.native: true`)
    - veya tek slash command modu (`channels.slack.slashCommand.enabled: true`)

    Slack, slash commands'ı otomatik olarak oluşturmaz veya kaldırmaz. `commands.native: "auto"` Slack yerel komutlarını etkinleştirmez; `true` kullanın ve Slack uygulamasında eşleşen komutları oluşturun. HTTP modunda, her Slack slash command Gateway URL'sini içermelidir. Socket Mode'da komut yükleri websocket üzerinden gelir ve Slack `slash_commands[].url` değerini yok sayar.

    Ayrıca `commands.useAccessGroups`, DM yetkilendirmesini, kanal izin listelerini
    ve kanal başına `users` izin listelerini kontrol edin. Slack, engellenen
    slash-command gönderenleri için geçici hatalar döndürür, örneğin:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Ek görüş referansı

Slack dosya indirmeleri başarılı olduğunda ve boyut sınırları izin verdiğinde Slack, indirilen medyayı agent turuna ekleyebilir. Görüntü dosyaları medya anlama yolundan geçirilebilir veya doğrudan görüş yetenekli bir yanıt modeline iletilebilir; diğer dosyalar görüntü girdisi olarak ele alınmak yerine indirilebilir dosya bağlamı olarak tutulur.

### Desteklenen medya türleri

| Medya türü                     | Kaynak               | Mevcut davranış                                                                  | Notlar                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP görüntüleri | Slack dosya URL'si       | İndirilir ve görüş yetenekli işleme için tura eklenir                   | Dosya başına sınır: `channels.slack.mediaMaxMb` (varsayılan 20 MB)                 |
| PDF dosyaları                      | Slack dosya URL'si       | İndirilir ve `download-file` veya `pdf` gibi araçlar için dosya bağlamı olarak sunulur | Slack gelen akışı, PDF'leri otomatik olarak görüntü-görüş girdisine dönüştürmez |
| Diğer dosyalar                    | Slack dosya URL'si       | Mümkün olduğunda indirilir ve dosya bağlamı olarak sunulur                              | İkili dosyalar görüntü girdisi olarak ele alınmaz                               |
| Thread yanıtları                 | Thread başlatıcı dosyaları | Yanıtın doğrudan medyası yoksa kök ileti dosyaları bağlam olarak hydrate edilebilir  | Yalnızca dosya içeren başlatıcılar bir ek yer tutucusu kullanır                          |
| Çoklu görüntü iletileri           | Birden fazla Slack dosyası | Her dosya bağımsız olarak değerlendirilir                                              | Slack işleme, ileti başına sekiz dosyayla sınırlıdır                     |

### Gelen akış hattı

Dosya ekleri olan bir Slack iletisi geldiğinde:

1. OpenClaw, bot token'ını kullanarak dosyayı Slack'in özel URL'sinden indirir.
2. Başarılı olursa dosya medya deposuna yazılır.
3. İndirilen medya yolları ve içerik türleri gelen bağlama eklenir.
4. Görüntü yetenekli model/araç yolları bu bağlamdaki görüntü eklerini kullanabilir.
5. Görüntü olmayan dosyalar, bunları işleyebilen araçlar için dosya meta verisi veya medya referansı olarak kullanılabilir kalır.

### Thread kök eki kalıtımı

Bir ileti bir thread içinde geldiğinde (`thread_ts` üst öğesi varsa):

- Yanıtın kendisinde doğrudan medya yoksa ve dahil edilen kök iletide dosyalar varsa, Slack kök dosyaları thread başlatıcı bağlamı olarak hydrate edebilir.
- Doğrudan yanıt ekleri, kök ileti eklerine göre önceliklidir.
- Yalnızca dosyaları olan ve metni olmayan bir kök ileti, geri dönüşün yine de dosyalarını içerebilmesi için bir ek yer tutucusuyla temsil edilir.

### Çoklu ek işleme

Tek bir Slack iletisi birden fazla dosya eki içerdiğinde:

- Her ek, medya akış hattı üzerinden bağımsız olarak işlenir.
- İndirilen medya referansları ileti bağlamında birleştirilir.
- İşleme sırası, olay yükündeki Slack dosya sırasını izler.
- Bir ekin indirilmesindeki hata diğerlerini engellemez.

### Boyut, indirme ve model sınırları

- **Boyut sınırı**: Dosya başına varsayılan 20 MB. `channels.slack.mediaMaxMb` ile yapılandırılabilir.
- **İndirme hataları**: Slack'in sunamadığı dosyalar, süresi dolmuş URL'ler, erişilemeyen dosyalar, aşırı büyük dosyalar ve Slack kimlik doğrulama/giriş HTML yanıtları, desteklenmeyen biçimler olarak raporlanmak yerine atlanır.
- **Görüş modeli**: Görüntü analizi, görüşü desteklediğinde etkin yanıt modelini veya `agents.defaults.imageModel` konumunda yapılandırılan görüntü modelini kullanır.

### Bilinen sınırlar

| Senaryo                               | Mevcut davranış                                                             | Geçici çözüm                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Süresi dolmuş Slack dosya URL'si                 | Dosya atlanır; hata gösterilmez                                                 | Dosyayı Slack'e yeniden yükleyin                                                |
| Görüş modeli yapılandırılmamış            | Görüntü ekleri medya referansları olarak saklanır, ancak görüntü olarak analiz edilmez | `agents.defaults.imageModel` yapılandırın veya görüş yetenekli bir yanıt modeli kullanın |
| Çok büyük görüntüler (varsayılan olarak > 20 MB) | Boyut sınırı nedeniyle atlanır                                                         | Slack izin veriyorsa `channels.slack.mediaMaxMb` değerini artırın                       |
| İletilmiş/paylaşılmış ekler           | Metin ve Slack barındırmalı görüntü/dosya medyası en iyi çaba ile işlenir                       | Doğrudan OpenClaw thread'inde yeniden paylaşın                                   |
| PDF ekleri                        | Dosya/medya bağlamı olarak saklanır, otomatik olarak görüntü görüşü üzerinden yönlendirilmez  | Dosya meta verisi için `download-file` veya PDF analizi için `pdf` aracını kullanın   |

### İlgili belgeler

- [Medya anlama akış hattı](/tr/nodes/media-understanding)
- [PDF aracı](/tr/tools/pdf)
- Epik: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack ek görüşünü etkinleştirme
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
    Gelen iletileri agent'lara yönlendirin.
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
